---
sidebar_position: 7
title: OOM Prevention Checklist
description: Running RAG on 512MB RAM requires deliberate engineering at every layer.
---

# OOM Prevention Checklist

> Running RAG on 512MB RAM is not a limitation — it's a constraint that forces good engineering. This is the complete checklist I use in production.

---

## Ingestion Layer

| Status | Check | Why It Matters |
|--------|-------|---------------|
| ✅ | Validate file extension before reading — HTTP 415 on failure | Zero bytes read before validation |
| ✅ | Read only first 4 bytes for magic-bytes check — never full file | Catches renamed `.exe` as `.pdf` |
| ✅ | Stream file in 1MB chunks, 10MB total limit — HTTP 413 on exceed | Prevents OOM from large file reads |
| ✅ | Enforce 500-page limit on PDF parsing | PDF bomb protection — prevents CPU loop |

---

## Embedding Layer

| Status | Check | Why It Matters |
|--------|-------|---------------|
| ⚠️ | **NEVER** load HuggingFace or spaCy models locally on constrained servers | `all-MiniLM` alone = ~400MB — instant OOM kill |
| ✅ | Use Jina AI or OpenAI embedding API — zero local RAM overhead | API call ≈ 0MB local RAM |
| ✅ | Use MRL truncation (512 dims) to reduce Qdrant storage by 80% | &lt;2% accuracy loss |
| ✅ | Batch embed in groups of 5–50 chunks with 200ms pause between batches | Prevents API timeout + rate limit |

---

## Runtime / Query Layer

| Status | Check | Why It Matters |
|--------|-------|---------------|
| ✅ | PII masking with custom regex only — no spaCy `en_core_web_lg` | 0.01MB vs ~700MB |
| ✅ | Redis cache for repeated queries — prevents duplicate LLM calls | Legal Q&A has very high repeat rate |
| ✅ | Circuit Breaker: 10 failures → OPEN state → halt requests 120s | Cascading failure prevention |
| ✅ | Confidence gate &lt;40% → return fallback — no LLM generation call | Saves tokens + prevents hallucination |
| ✅ | Rate limit with SlowAPI: 5 req/min per IP | Protects 512MB Render from burst load |

---

## The Mistakes I Made (So You Don't Have To)

### Mistake 1 — Loading HuggingFace Model in FastAPI Startup

```python
# ❌ WRONG — This killed my server before first request
@app.on_event("startup")
async def startup():
    model = SentenceTransformer("all-MiniLM-L6-v2")  # ~400MB OOM kill

# ✅ CORRECT — Use API-based embeddings
@app.on_event("startup")
async def startup():
    app.state.embeddings = JinaEmbeddings(
        jina_api_key=settings.JINA_API_KEY,
        model_name="jina-embeddings-v2-base-en"
    )  # 0MB local RAM
```

---

### Mistake 2 — Reading Entire File Into Memory

```python
# ❌ WRONG — 50MB PDF = 50MB RAM spike
content = await file.read()

# ✅ CORRECT — Stream in chunks
content = b""
async for chunk in file:
    content += chunk
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(413, "File too large")
```

---

### Mistake 3 — spaCy Model at Startup for PII

```python
# ❌ WRONG — ~200MB RAM just for PII masking
nlp = spacy.load("en_core_web_sm")

# ✅ CORRECT — Custom regex, 0.01MB
PHONE_PATTERN = re.compile(r'\b[6-9]\d{9}\b')
AADHAAR_PATTERN = re.compile(r'\b\d{4}\s?\d{4}\s?\d{4}\b')
PAN_PATTERN = re.compile(r'\b[A-Z]{5}[0-9]{4}[A-Z]\b')

def mask_pii(text: str) -> tuple[str, bool, list]:
    masked = PHONE_PATTERN.sub('<PHONE_NUMBER>', text)
    masked = AADHAAR_PATTERN.sub('<AADHAAR_NUMBER>', masked)
    masked = PAN_PATTERN.sub('<PAN_NUMBER>', masked)
    pii_found = masked != text
    return masked, pii_found, []
```

---

## Memory Budget on Render 512MB (Free Tier)

```
FastAPI + Uvicorn          ~50 MB
Langfuse client            ~20 MB
MongoDB motor client       ~15 MB
Qdrant client              ~10 MB
Redis client               ~5 MB
Presidio (regex only)      ~0.01 MB
Jina Embeddings client     ~0.01 MB
─────────────────────────────────
Total at startup:         ~100 MB
Available for requests:   ~412 MB
Peak during PDF indexing: ~250 MB  ✅ Safe
```

:::tip
The 512MB constraint actually helped me build a better system. Every dependency has to justify its RAM cost.
:::
