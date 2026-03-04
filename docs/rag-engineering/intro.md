---
sidebar_position: 1
title: Introduction
description: Personal engineering notes from building production RAG systems on zero budget
slug: /rag-engineering/intro
---

# RAG Engineering — Master Reference Guide

> **A note before you read.**
>
> This is a collection of personal engineering notes I wrote while building production AI systems from zero — no formal training, no company resources, no senior engineer to ask.
>
> The patterns here came from real failures I debugged at 2am, real OOM kills I fixed, and real production decisions I had to make alone. Not landmark discoveries. Just honest notes from someone in the trenches.
>
> — Ambuj Kumar Tripathi, 2026

---

## What's Inside

| # | Section | What you'll learn |
|---|---------|------------------|
| 01 | [Document Loaders](./document-loaders) | Which loader, when, and actual RAM cost |
| 02 | [Chunking Strategies](./chunking-strategies) | Parent-child, semantic, token — the differences that matter |
| 03 | [Embedding Models](./embedding-models) | Local vs API on 512MB servers — what survives |
| 04 | [Architecture Decisions](./architecture-decisions) | Real decisions with measured outcomes |
| 05 | [LangGraph StateGraph](./langgraph-stategraph) | 6 nodes, 3 paths, full state breakdown |
| 06 | [OOM Prevention](./oom-prevention) | Ingestion, embedding, runtime — full checklist |
| 07 | [Adaptive Retrieval](./adaptive-retrieval) | The pattern that separates production RAG from demos |

---

## My Stack (Zero Budget, Production Grade)

```
Frontend     → React 18 + Vite + Tailwind
Backend      → FastAPI + Uvicorn (Docker on Render)
Orchestration→ LangGraph StateGraph (6 nodes)
Vector DB    → Qdrant Cloud (1GB free tier)
LLM          → Qwen 3 235B via OpenRouter (free tier)
Embeddings   → Jina AI v2 base-en (1M tokens/month free)
Chat History → MongoDB Atlas (512MB free)
Cache        → Upstash Redis (10K req/day free)
PII Masking  → Microsoft Presidio + spaCy
Observability→ Langfuse
Auth         → Google OAuth 2.0 + JWT
─────────────────────────────────────────
Total Monthly Cost: ₹0
```

---

:::info Who this is for
Engineers learning RAG who want production patterns, not tutorial happy paths. Everything here is from deployed systems — not hypothetical.
:::
