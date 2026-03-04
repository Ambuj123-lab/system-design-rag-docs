---
sidebar_position: 6
title: LangGraph StateGraph
description: 6 nodes, 3 execution paths, conditional edges — how my production system is orchestrated.
---

# LangGraph StateGraph

> LangGraph lets you build multi-step AI pipelines as a directed graph. Unlike a simple chain (A→B→C), a StateGraph can branch, loop, and make decisions at runtime.

---

## StateGraph vs Simple LangChain

| Approach | Behavior | Best For |
|----------|----------|----------|
| Simple LangChain LCEL | A→B→C always. No branching. No decisions. | Tutorials, demos, linear Q&A |
| **LangGraph StateGraph** | Conditional routing. Can loop. Multi-agent capable. State persists across nodes. | **Production AI systems** |

---

## Core Concepts

- **Nodes** — Python functions that read from and write to a shared State object
- **Edges** — Define which node runs next (fixed or conditional/branching)
- **State** — A `TypedDict` that flows unchanged through every node — single source of truth
- **START** — Entry point. **END** — Terminates the graph.

---

## The 6 Nodes — My Production Deployment

### Node 1: `classify_node`
```python
def classify_node(state: RAGState) -> dict:
    query = state["query"]

    # Keyword blocklist check
    if is_abusive(query):
        return {"query_type": "abusive"}

    # Whitelist + length < 4 words check
    if is_greeting(query):
        return {"query_type": "greeting"}

    return {"query_type": "rag"}
```
**Output:** `query_type = "rag" | "greeting" | "abusive"`

---

### Node 2: `reject_node`
```python
def reject_node(state: RAGState) -> dict:
    return {
        "response": "I can only help with legal and safety queries.",
        "error": "abusive_content"
    }
    # Zero API calls
    # NOT saved to MongoDB — keeps chat history clean
```

---

### Node 3: `greet_node`
```python
def greet_node(state: RAGState) -> dict:
    response = llm.invoke(
        greeting_prompt.format(name=state["user_name"]),
        max_tokens=150,
        temperature=0.7   # Creative, friendly
    )
    return {"response": response.content}
    # Saved to MongoDB
    # Skips Qdrant entirely — saves embedding quota
```

---

### Node 4: `retrieve_node` (Core of the Pipeline)
```python
def retrieve_node(state: RAGState) -> dict:
    # Step 1 — PII masking
    safe_query, pii_found, pii_entities = mask_pii(state["query"])

    # Step 2 — Keyword expansion for legal acronyms
    KEYWORD_MAP = {
        "fir": "First Information Report Section 173 BNSS",
        "murder": "Section 103 BNS",
        "arrest": "Section 35 BNSS",
        "bail": "Section 479 BNSS"
    }
    expanded = safe_query + " " + expand_keywords(safe_query, KEYWORD_MAP)

    # Step 3 — Dual Qdrant search
    query_vector = jina_embeddings.embed_query(expanded)

    core_results = qdrant.search(
        query_vector=query_vector,
        query_filter=Filter(must=[
            FieldCondition("chunk_type", MatchValue("child")),
            FieldCondition("is_temporary", MatchValue(False))
        ]),
        limit=15
    )
    user_results = qdrant.search(
        query_vector=query_vector,
        query_filter=Filter(must=[
            FieldCondition("is_temporary", MatchValue(True)),
            FieldCondition("uploaded_by", MatchValue(state["user_email"]))
        ]),
        limit=5
    )

    # Step 4 — Merge and deduplicate by parent_id
    all_results = sorted(
        list(core_results) + list(user_results),
        key=lambda x: x.score, reverse=True
    )
    seen_parents = set()
    sources = []
    for hit in all_results:
        parent_id = hit.payload["parent_id"]
        if parent_id not in seen_parents:
            seen_parents.add(parent_id)
            sources.append(hit)

    # Step 5 — Confidence score
    confidence = sources[0].score * 100 if sources else 0

    return {
        "safe_query": safe_query,
        "pii_found": pii_found,
        "context": "\n\n".join(s.payload["parent_text"] for s in sources[:3]),
        "sources": [format_source(s) for s in sources[:3]],
        "confidence": confidence
    }
```

---

### Node 5: `generate_node`
```python
def generate_node(state: RAGState) -> dict:
    # Confidence gate — no LLM call if context is weak
    if state.get("confidence", 0) < 40:
        return {"response": FALLBACK_MESSAGE}

    # Sliding window — last 6 messages (3 turns)
    history = state["chat_history"][-6:]

    start_time = time.time()
    response = llm_breaker.call(
        chain.invoke,
        {
            "context":  state["context"],
            "question": state["safe_query"],
            "history":  format_history(history),
            "user_name": state["user_name"]
        }
    )
    latency = (time.time() - start_time) * 1000

    return {"response": response, "latency": latency}
    # LLM: Qwen 3 235B via OpenRouter
    # temperature=0.3 — factual, low creativity
```

---

### Node 6: `post_process_node`
```python
def post_process_node(state: RAGState) -> dict:
    # Save to MongoDB
    save_message(state["user_email"], "user",      state["query"])
    save_message(state["user_email"], "assistant", state["response"])

    # Log to Langfuse
    logger.info(json.dumps({
        "event":      "rag_complete",
        "user":       state["user_email"],
        "query_type": state["query_type"],
        "confidence": state.get("confidence", 0),
        "latency":    state.get("latency", 0),
        "pii_found":  state.get("pii_found", False),
    }))

    return {}  # No state mutation — pure side effects
```

---

## The 3 Execution Paths

```
PATH 1 — ABUSIVE:
START → classify → reject → END
(No API calls. Not saved to MongoDB.)

PATH 2 — GREETING:
START → classify → greet → post_process → END
(LLM call only. No Qdrant. Saves embedding quota.)

PATH 3 — RAG QUERY:
START → classify → retrieve → generate → post_process → END
(Full pipeline: PII → Qdrant → LLM → MongoDB → Langfuse)
```

---

## Conditional Edge Code

```python
from langgraph.graph import StateGraph, END

# Build graph
graph = StateGraph(RAGState)

# Add nodes
graph.add_node("classify",     classify_node)
graph.add_node("reject",       reject_node)
graph.add_node("greet",        greet_node)
graph.add_node("retrieve",     retrieve_node)
graph.add_node("generate",     generate_node)
graph.add_node("post_process", post_process_node)

# Entry point
graph.set_entry_point("classify")

# Conditional routing after classify
def route_query(state: RAGState) -> str:
    if state["query_type"] == "abusive":  return "reject"
    elif state["query_type"] == "greeting": return "greet"
    else:                                   return "retrieve"

graph.add_conditional_edges("classify", route_query, {
    "reject":   "reject",
    "greet":    "greet",
    "retrieve": "retrieve"
})

# Fixed edges
graph.add_edge("retrieve",     "generate")
graph.add_edge("generate",     "post_process")
graph.add_edge("greet",        "post_process")
graph.add_edge("post_process", END)
graph.add_edge("reject",       END)

app = graph.compile()
```

---

## RAGState TypedDict — Every Field

```python
from typing import TypedDict, Optional

class RAGState(TypedDict):
    # INPUT — set before graph starts
    query:        str         # Raw user query — never modified after classify
    user_name:    str         # From JWT — personalization
    user_email:   str         # From JWT — temp file isolation (multi-tenant)
    chat_history: list        # Last 30 days from MongoDB

    # SET BY classify_node
    query_type:   str         # "rag" | "greeting" | "abusive"

    # SET BY retrieve_node
    safe_query:   str         # PII-masked query → sent to Jina AI + Qdrant
    pii_found:    bool        # Whether PII was detected
    pii_entities: list        # Types detected: PHONE_NUMBER, PERSON, etc.
    context:      str         # Parent texts concatenated → sent to LLM prompt
    sources:      list        # Citations: file, page, preview, cosine score
    confidence:   float       # Top cosine score × 100 → 0–100%

    # SET BY generate_node
    response:     str         # Final answer → returned to frontend
    latency:      float       # Time from entry to LLM response (ms)

    # SET BY any node on failure
    error:        Optional[str]  # Short-circuits remaining nodes
```

---

## Why Deduplicate by `parent_id`?

Multiple child chunks from the **same parent** can match a query. For example, Section 173 BNSS has 5 child chunks — all might score high for "FIR procedure". Without deduplication, the LLM gets the same parent text 5 times → wasted tokens.

Deduplication by `parent_id` ensures diverse context from different parts of the document.
