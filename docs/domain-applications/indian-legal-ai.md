---
sidebar_position: 2
title: Indian Legal AI Expert
description: Production RAG system for Indian law — LangGraph orchestration, parent-child chunking, 189ms latency on free tier.
---

# Indian Legal AI Expert

A production-grade RAG system that answers Indian legal queries with source citations, confidence scoring, and full LLMOps observability — running on ₹0/month infrastructure.

---

## Architecture Overview

```
User Query
  ↓
React 18 SPA (Vercel)
  ↓ HTTPS
FastAPI + Uvicorn (Render free tier — 512MB RAM)
  ↓
LangGraph StateGraph (6 nodes)
  ├── classify_node    → query type routing
  ├── reject_node      → abusive query fast-fail
  ├── greet_node       → greeting handling (no Qdrant)
  ├── retrieve_node    → PII mask → keyword expand → dual Qdrant search
  ├── generate_node    → confidence gate → LLM via OpenRouter
  └── post_process_node → MongoDB save → Langfuse log
  ↓
Response + Sources + Confidence Score
```

---

## Tech Stack (₹0/month)

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React 18 + Vite + Tailwind | Vercel free tier |
| Backend | FastAPI + Uvicorn | Fast async, minimal overhead |
| Orchestration | LangGraph StateGraph | Conditional routing — not linear chain |
| Vector DB | Qdrant Cloud (1GB free) | Parent text in payload — no SQL round-trip |
| Embeddings | Jina AI v2 (1M/month free) | 0MB local RAM |
| LLM | Qwen 3 235B via OpenRouter | Best free-tier quality |
| Chat History | MongoDB Atlas (512MB free) | Persistent cross-session memory |
| Cache | Upstash Redis (10K req/day) | Repeated query caching |
| Auth | Google OAuth 2.0 + JWT | No credential storage |
| PII Masking | Microsoft Presidio + Custom Regex | Indian PII: Aadhaar + PAN |
| Observability | Langfuse | Full LLM trace: latency, tokens, confidence |

---

## Knowledge Base

| Document | Chunks (Parent) | Chunks (Child) | Size |
|----------|----------------|----------------|------|
| Constitution of India 2024 | 685 | 2,845 | 2.4 MB |
| Bharatiya Nagarik Suraksha Sanhita | 555 | 2,656 | 2.1 MB |
| Bharatiya Nyaya Sanhita 2023 | 271 | 1,311 | 0.9 MB |
| Motor Vehicles Act 1988 | 262 | 1,248 | 1.2 MB |
| Consumer Protection Act 2019 | 81 | 416 | 1.2 MB |
| IT Act 2000 (Updated) | 83 | 420 | 0.8 MB |
| **Total** | **1,937** | **8,896** | **~8.6 MB** |

---

## Performance Metrics

```
Average response latency:   189ms  (measured across 50 queries)
Minimum observed:           167ms
Maximum observed:           211ms
Infrastructure:             Render free tier, 512MB RAM
Vector search:              768-dim Cosine, 100% precision@3

Confidence zones:
  0–39%   → Fallback response (no LLM call)
  40–65%  → Partial match answer
  65–85%  → Good match with sources
  85–100% → Exact match with direct citation
```

---

## Key Engineering Decisions

### 1. Parent Text in Qdrant Payload
Instead of storing parent text in PostgreSQL and doing a SQL lookup after vector search, parent text lives directly in the Qdrant point payload. One API call returns both the child match and the parent context. Eliminated one full network round-trip per query.

### 2. Legal Keyword Expansion
Acronym expansion before embedding:
```python
KEYWORD_MAP = {
    "fir":     "First Information Report Section 173 BNSS",
    "murder":  "Section 103 BNS culpable homicide",
    "arrest":  "Section 35 BNSS arrest without warrant",
    "bail":    "Section 479 BNSS bail conditions",
    "ipc":     "Indian Penal Code BNS equivalent",
}
```
Users type "FIR" — system searches for the full legal phrase. Precision improvement: significant.

### 3. Dual Search (Core + User Uploads)
Every query searches two Qdrant collections simultaneously:
- Core corpus (6 legal documents — permanent)
- User temp vectors (documents uploaded by this specific user — session-scoped)

Results merged, deduplicated by `parent_id`, sorted by score.

### 4. Zero-Memory PII Masking
Replaced spaCy NLP (~200MB RAM) with custom regex recognizers (0.01MB). Same accuracy for Indian PII patterns (12-digit Aadhaar, PAN format `ABCDE1234F`).
