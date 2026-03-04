---
sidebar_position: 3
title: Citizen Safety AI
description: Public safety chatbot — POCSO, POSH, Digital Arrest scams — on 512MB RAM.
---

# Citizen Safety AI

A public-facing AI safety assistant covering digital arrest scams, cyber fraud, POCSO, POSH, and RBI consumer protection — built for general public awareness, not lawyers.

---

## Architecture

```
React SPA (Vercel)
  ↓
FastAPI (Render — 512MB RAM)
  ↓
RAG Pipeline:
  PyMuPDFLoader → RecursiveCharacterTextSplitter
  → Google Embeddings → ChromaDB (pre-built, committed to git)
  → Gemini Flash LLM
  ↓
Security layers:
  Rate limiting (SlowAPI) → PII masking → OAuth → GDPR → Circuit breaker
```

---

## Knowledge Base (8 Safety Documents)

- Digital Arrest Advisory (MHA India)
- POCSO Act 2012
- POSH Act 2013
- RBI Digital Payment Guidelines
- Cyber Crime Reporting SOP
- Consumer Protection Act 2019
- IT Act 2000
- National Cyber Security Policy

---

## The Hardest Problem — Embedding on 512MB

### What Failed Before I Found the Right Solution

```
Attempt 1: HuggingFace sentence-transformers
  → ~400MB RAM at startup
  → OOM kill before first request
  → Eliminated

Attempt 2: Google Gemini Embedding (embedding-001)
  → 100 RPM, 1500 requests/month quota
  → First full indexing run exhausted monthly quota
     before the application finished starting
  → Also: deprecated January 14, 2026
  → Eliminated

Attempt 3: Jina AI (jina-embeddings-v2-base-en)
  → API-based: 0MB local RAM
  → 1M tokens/month free tier
  → Stable, generous, no deprecations
  → ✅ Works
```

### The ChromaDB Pre-Build Solution

Since Jina AI's free tier has rate limits, re-embedding the entire corpus on every cold start would exhaust the quota. Solution: **pre-build ChromaDB and commit it to git**.

```bash
# Local: build the vector DB once
python build_chromadb.py  # embeds all 8 PDFs via Jina AI

# The resulting ./chroma_db/ folder gets committed to git
git add chroma_db/
git commit -m "Pre-built ChromaDB — 8 safety documents"
git push

# On Render: app starts, ChromaDB loads from disk
# Zero embedding API calls at startup
# Cold start: ~8 seconds (loading vectors from disk)
# No quota exhaustion ever
```

---

## Security Architecture

| Layer | Implementation | What It Prevents |
|-------|---------------|-----------------|
| Rate Limiting | SlowAPI: 5 req/min per IP | Burst load, abuse, quota exhaustion |
| PII Masking | Custom regex (Aadhaar, PAN, phone) | Sensitive data in logs/LLM context |
| Authentication | Google OAuth 2.0 + JWT | Unauthorized access |
| GDPR Compliance | No PII storage, masked queries only | Data protection |
| Circuit Breaker | 10 failures → 120s OPEN state | Cascading LLM API failures |
| File Validation | 4-layer shield (ext, magic bytes, size, pages) | OOM from malicious uploads |
