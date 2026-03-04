---
sidebar_position: 1
title: Projects Overview
slug: /projects/intro
---

# Production Projects

Two production AI systems built from scratch — zero budget, free tiers only, real users.

---

## Indian Legal AI Expert

**The goal:** A RAG system that answers questions about Indian law — Constitution, BNS, BNSS, Motor Vehicles Act — with source citations and confidence scores.

**Stack:** React + FastAPI + LangGraph + Qdrant + Jina AI + MongoDB + Redis + Langfuse

**What makes it non-trivial:**
- 8,896 child vectors across 6 legal documents
- Parent-child chunking with legal keyword expansion
- PII masking before every query
- 189ms average response latency on Render free tier
- SHA-256 sync engine for document versioning

→ [Read the full breakdown](./indian-legal-ai)

---

## Citizen Safety AI

**The goal:** A safety information chatbot covering Digital Arrest scams, POCSO, POSH, RBI consumer protection — for general public awareness.

**Stack:** React (Vercel) + FastAPI (Render) + ChromaDB + Google Embeddings + MongoDB + Upstash Redis

**What makes it non-trivial:**
- Runs on 512MB RAM with all safety features active
- ChromaDB pre-built at deploy time — committed to git
- 4-layer security: rate limiting, OAuth, GDPR PII, circuit breaker
- Defeated 3 embedding models (HuggingFace OOM, Gemini quota exhausted) before finding Jina AI

→ [Read the full breakdown](./citizen-safety-ai)
