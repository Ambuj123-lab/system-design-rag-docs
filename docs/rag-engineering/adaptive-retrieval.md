---
sidebar_position: 8
title: Adaptive Retrieval
description: The pattern that separates production RAG from demos — route retrieval strategy based on query type.
---

# Adaptive Retrieval

> Most RAG systems do: query → embed → vector search → LLM. Every. Single. Time. That's a tutorial. Production systems decide **how** to retrieve based on **what kind of question** is being asked.

---

## The Problem With One-Size-Fits-All

```
"What is Section 173 BNSS?"           → Simple factual lookup → standard top-3 is fine
"Difference between IPC and BNS?"     → Comparison → needs context from BOTH documents
"How do I file an FIR step by step?"  → Procedural → needs sequential ordering + more chunks
"What about in criminal cases?"        → Follow-up → needs chat history to understand context
```

Same retrieval path for all 4 = wrong answer for at least 3 of them.

---

## 5 Query Types → 5 Retrieval Strategies

| Query Type | Example | Strategy | Detail |
|------------|---------|----------|--------|
| **Factual Lookup** | "What is Section 173 BNSS?" | Standard vector search | Top-k=3, threshold >70%, fetch exact clause |
| **Comparison** | "Difference between IPC and BNS for theft?" | Multi-query retrieval | Generate 2 sub-queries, search separately, merge contexts |
| **Procedural** | "How do I file an FIR step by step?" | Reranking retrieval | Fetch top-k=8, cross-encoder rerank, sequential order |
| **Ambiguous** | "What are my rights?" (no context) | Broad + structured | Wide retrieval + structured response with multiple scenarios |
| **Follow-up** | "What about in criminal cases?" | History-expanded query | Expand using `chat_history[-3:]` to reconstruct full query |

---

## Implementation

### Step 1 — Extend classify_node

```python
def classify_node(state: RAGState) -> dict:
    query = state["query"]

    # Existing checks
    if is_abusive(query):  return {"query_type": "abusive"}
    if is_greeting(query): return {"query_type": "greeting"}

    # Adaptive retrieval classification
    if is_comparison(query):    return {"query_type": "comparison"}
    if is_procedural(query):    return {"query_type": "procedural"}
    if has_prior_context(state):return {"query_type": "followup"}
    return {"query_type": "factual"}  # default


def is_comparison(query: str) -> bool:
    keywords = ["difference", "compare", "vs", "versus",
                "better", "worse", "old vs new", "ipc vs bns"]
    return any(kw in query.lower() for kw in keywords)


def is_procedural(query: str) -> bool:
    keywords = ["how to", "step by step", "procedure",
                "process", "what are the steps", "how do i"]
    return any(kw in query.lower() for kw in keywords)


def has_prior_context(state: RAGState) -> bool:
    # Short query + existing history = likely follow-up
    return (len(state["query"].split()) < 6
            and len(state.get("chat_history", [])) > 0)
```

---

### Step 2 — Route in retrieve_node

```python
def retrieve_node(state: RAGState) -> dict:
    qtype = state["query_type"]

    if qtype == "comparison":
        return multi_query_retrieve(state)

    elif qtype == "procedural":
        return reranked_retrieve(state, k=8)

    elif qtype == "followup":
        return history_expanded_retrieve(state)

    else:  # "factual" default
        return standard_retrieve(state, k=3)
```

---

### The 4 Retrieval Functions

```python
# 1. STANDARD — Default factual lookup
def standard_retrieve(state: RAGState, k: int = 3) -> dict:
    vector = jina.embed_query(state["safe_query"])
    results = qdrant.search(query_vector=vector, limit=k)
    return build_context(results)


# 2. MULTI-QUERY — For comparisons
def multi_query_retrieve(state: RAGState) -> dict:
    # LLM generates focused sub-queries
    sub_queries = llm.invoke(
        f"Generate 2 focused search queries to answer: {state['safe_query']}"
    )
    all_results = []
    for sq in sub_queries:
        vector = jina.embed_query(sq)
        results = qdrant.search(query_vector=vector, limit=5)
        all_results.extend(results)

    # Deduplicate by parent_id
    return build_context(deduplicate(all_results))


# 3. RERANKED — For procedural, sequential answers
def reranked_retrieve(state: RAGState, k: int = 8) -> dict:
    vector = jina.embed_query(state["safe_query"])
    results = qdrant.search(query_vector=vector, limit=k)

    # Cross-encoder reranking for relevance
    from sentence_transformers import CrossEncoder
    reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
    pairs = [(state["safe_query"], r.payload["text"]) for r in results]
    scores = reranker.predict(pairs)

    reranked = sorted(
        zip(results, scores),
        key=lambda x: x[1],
        reverse=True
    )
    return build_context([r for r, _ in reranked[:4]])


# 4. HISTORY-EXPANDED — For follow-up questions
def history_expanded_retrieve(state: RAGState) -> dict:
    # Last 3 messages give context to short follow-up
    recent = state["chat_history"][-3:]
    history_text = " ".join(m["content"] for m in recent)

    expanded = f"{state['safe_query']} {history_text}"
    vector = jina.embed_query(expanded[:500])  # Token limit safe
    results = qdrant.search(query_vector=vector, limit=5)
    return build_context(results)
```

---

## What This Signals in an Interview

```
Entry level  → One retrieval path. Same k. Same threshold. No query analysis.

Mid level    → Parent-child chunking. Confidence scoring.
               Circuit breaker. PII masking.

Senior level → Adaptive retrieval routing. Multi-query for comparisons.
               Reranking for procedural. History expansion for follow-ups.
               Query-type-aware confidence thresholds.
```

:::tip One-liner for interviews
*"The biggest RAG improvement in production is moving from one-size-fits-all vector search to query-type-aware adaptive retrieval — where factual queries get standard top-3 search, comparison queries trigger multi-sub-query retrieval, and follow-up questions use history-expanded queries. The routing decision happens in a LangGraph node before the vector search, adding ~5ms of latency for significantly better answer quality."*
:::
