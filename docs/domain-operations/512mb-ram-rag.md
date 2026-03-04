---
sidebar_position: 3
title: Running RAG on 512MB RAM
description: Every trick I used to run a full production RAG stack on Render's free tier.
---

# Running RAG on 512MB RAM

> Render's free tier gives you 512MB. A HuggingFace embedding model alone takes 400MB. Here's every trick I used to make a full production RAG stack survive this constraint.

---

## Problem 1 — No Persistent Disk (Render Free Tier)

Render free tier spins down after 15 minutes of inactivity. When it spins back up, any in-memory state is gone. If ChromaDB is built in memory at startup — gone.

**Fix:** Pickle serialization to `/tmp` (the only writable path on Render free).

```python
import pickle
from pathlib import Path

CACHE_PATH = Path("/tmp/chroma_cache.pkl")

def load_or_build_vectorstore():
    if CACHE_PATH.exists():
        with open(CACHE_PATH, "rb") as f:
            return pickle.load(f)

    # Build from scratch
    docs = load_all_pdfs()
    vectorstore = Chroma.from_documents(docs, embedding_function)

    with open(CACHE_PATH, "wb") as f:
        pickle.dump(vectorstore, f)

    return vectorstore
```

**Catch:** `/tmp` also clears on cold start. So for persistent storage across cold starts: commit pre-built ChromaDB to git (as described in Citizen Safety AI).

---

## Problem 2 — LangChain Calling Embedding API Unnecessarily

Even with a pre-loaded ChromaDB, LangChain's `Chroma` wrapper was calling the embedding API on every query initialization — not for search, but for internal validation.

**Fix:** Bypass the LangChain wrapper entirely. Use the native `chromadb` client.

```python
# ❌ LangChain wrapper — calls embedding API unnecessarily
from langchain.vectorstores import Chroma
vectorstore = Chroma(persist_directory="./chroma_db",
                     embedding_function=embeddings)  # API call here!

# ✅ Native chromadb client — no unnecessary API calls
import chromadb
client = chromadb.PersistentClient(path="./chroma_db")
collection = client.get_collection("safety_docs")

# Search without embedding wrapper:
query_vector = embeddings.embed_query(query)  # One intentional call
results = collection.query(
    query_embeddings=[query_vector],
    n_results=5
)
```

Saved ~3 unnecessary embedding API calls per request on the free tier.

---

## Problem 3 — The Embedding Model Graveyard

```
HuggingFace sentence-transformers:
  all-MiniLM-L6-v2   → 400MB RAM → OOM kill
  all-mpnet-base-v2   → 450MB RAM → OOM kill

Google Gemini (embedding-001):
  100 RPM, 1500 req/month quota
  First indexing run exhausted monthly quota
  Also deprecated January 14, 2026

Google Gemini (text-embedding-004):
  Also deprecated January 14, 2026

Jina AI (jina-embeddings-v2-base-en):
  API-based → 0MB local RAM
  1M tokens/month free
  Stable, no deprecations found
  ✅ This one works
```

---

## Problem 4 — ChromaDB Telemetry Deadlock

ChromaDB sends an analytics ping on startup. On Render's restricted network, this DNS lookup hung for 30+ seconds — blocking every cold start.

```python
# ❌ Default ChromaDB — hangs on startup on restricted networks
import chromadb
client = chromadb.PersistentClient(path="./chroma_db")

# ✅ Disable telemetry DNS call
from chromadb.config import Settings
client = chromadb.PersistentClient(
    path="./chroma_db",
    settings=Settings(anonymized_telemetry=False)
)
```

Fixed cold start from 35+ seconds to ~8 seconds.

---

## Hard-Won Lessons

1. **API-based embeddings are not a compromise** — they're the correct choice for constrained servers. 0MB local RAM, generous free tiers, no version management.

2. **LangChain abstractions hide API calls** — when debugging unexpected rate limit errors, check if the wrapper is calling the embedding API more times than you think.

3. **Every dependency has a RAM cost** — at 512MB, you need to know the startup RAM of every import. `import spacy; nlp = spacy.load("en_core_web_sm")` = 200MB you didn't plan for.

4. **Telemetry is a silent failure mode** — ChromaDB, LangSmith, and others all have optional telemetry that DNS-resolves on startup. Disable all of them on constrained infra.

5. **The constraint made the system better** — every unnecessary dependency was removed. Every API call was counted. The result is a leaner, faster, more predictable system than if I'd had 16GB of RAM.
