---
sidebar_position: 4
title: Deployment Challenges & Fixes
description: Every real bug I hit deploying RAG systems — dependency conflicts, quota exhaustion, DNS blocks.
---

# Deployment Challenges & Fixes

> These are real bugs from real deployments. Not hypothetical. Not from documentation. From actual crashes, error logs, and 2am debugging sessions.

---

## Dependency Conflicts

| Conflict | Error | Fix |
|----------|-------|-----|
| `langchain-core` version mismatch | `ImportError: cannot import name 'RunnablePassthrough'` | Pin `langchain-core==0.1.52`, `langchain==0.1.20` |
| `itsdangerous` + Starlette | `TypeError: argument of type 'NoneType'` in session middleware | Pin `itsdangerous==2.1.2` |
| `langfuse` + `pydantic` v2 | `ValidationError` on every trace | Pin `langfuse==2.7.3` with `pydantic<2.0` |

**Lesson:** Lock every version in `requirements.txt`. `pip freeze > requirements.txt` after every working state.

---

## Missing Imports That Aren't in Docs

```python
# These fail silently or with cryptic errors:
from langchain_community.vectorstores import Chroma       # NOT langchain.vectorstores
from langchain_community.document_loaders import PyMuPDFLoader  # NOT langchain.document_loaders

# Always use langchain_community for:
# - Vector stores (Chroma, Qdrant, Pinecone)
# - Document loaders (PyMuPDF, Unstructured, WebBase)
# - Embeddings (HuggingFace, Jina, Cohere)
```

---

## Embedding Model Deprecation

```
text-embedding-004     → Deprecated Jan 14, 2026. 404 error.
embedding-001          → Deprecated. Returns HTTP 404.
gemini-embedding-001   → Current as of 2026 (but quota problems)

# If you get 404 on Google embedding:
# Always check: https://ai.google.dev/gemini-api/docs/models
```

---

## Embedding Quota Exhaustion on Deploy

**Problem:** Google Gemini free tier = 1500 requests/month. Cold start re-embeds entire corpus = 300+ API calls = quota gone in one deploy.

**Fix:** Pre-build ChromaDB locally, commit to git.
```bash
# Build once locally:
python scripts/build_vectordb.py

# Commit the built DB:
git add chroma_db/
git commit -m "Pre-built ChromaDB — skip embedding at startup"

# Render pulls this on deploy — loads from disk
# Startup: 8s. Zero API calls for embeddings.
```

---

## Memory Optimization Journey

| Stage | RAM Usage | What Changed |
|-------|-----------|-------------|
| Initial | ~850MB (OOM) | HuggingFace model + spaCy lg + full LangChain |
| After embedding fix | ~650MB (OOM) | Switched to API embeddings |
| After spaCy fix | ~450MB | Replaced spaCy with custom regex |
| After model pruning | ~250–400MB | Removed unused LangChain components |
| **Final** | **~250–400MB ✅** | **Stable on 512MB Render** |

---

## ISP DNS Block (JioFiber + Qdrant)

**Problem:** JioFiber blocked `*.cloud.qdrant.io` at DNS level during local development. `ConnectionError: Name or service not known`.

**Fix:** Monkey-patch Python's socket resolver for Qdrant hostnames only.

```python
import socket
import dns.resolver  # pip install dnspython

_original = socket.getaddrinfo

def _patched(host, port, *args, **kwargs):
    if host and 'qdrant.io' in str(host):
        resolved = dns.resolver.resolve(host, 'A',
                   nameservers=['8.8.8.8'])  # Google DNS
        host = str(resolved[0])
    return _original(host, port, *args, **kwargs)

socket.getaddrinfo = _patched
# No-op in production — Render has normal DNS
```

---

## ChromaDB Telemetry Deadlock

**Problem:** ChromaDB sends telemetry on startup. On Render's network restrictions, this DNS lookup hung indefinitely — blocking the entire startup.

**Fix:**
```python
import chromadb
from chromadb.config import Settings

client = chromadb.Client(Settings(
    anonymized_telemetry=False  # Disable the DNS call entirely
))
```

**Lesson:** Any telemetry/analytics call in your dependencies can deadlock startup on restricted networks. Always check for telemetry settings.
