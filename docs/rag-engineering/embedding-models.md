---
sidebar_position: 4
title: Embedding Models
description: Model choice determines RAM, retrieval quality, and cost. On 512MB servers — local models are not an option.
---

# Embedding Models Comparison

> On 512MB servers, local embedding models are not an option. They will OOM kill your server before the first request.

---

## Model Comparison Table

| Model | Dimensions | Type | Best For | RAM on 512MB | Cost |
|-------|-----------|------|----------|-------------|------|
| **⭐ Jina AI v2 base-en** | 768 | API | Constrained servers — my production choice | ~0 MB (API call) | 1M tokens free/month |
| **OpenAI text-embedding-3-small** | 1536 | API | General RAG, best quality/cost balance | ~0 MB (API call) | $0.02 per 1M tokens |
| **OpenAI text-embedding-3-large** | 3072 (MRL: → 256) | API + MRL | Max accuracy — truncate to 512 for 80% storage savings | ~0 MB (API call) | $0.13 per 1M tokens |
| **all-MiniLM-L6-v2** | 384 | ⚠️ Local | Offline dev/testing ONLY | **~400 MB — OOM RISK** | Free but kills server |
| **all-mpnet-base-v2** | 768 | ⚠️ Local | Higher accuracy than MiniLM — local dev only | **~450 MB — OOM KILL** | Free local only |
| **Google textembedding-gecko** | 768 | API | GCP ecosystem, good multilingual | ~0 MB | Paid after free quota |

---

## Why I Use Jina AI in Production

```python
from langchain_community.embeddings import JinaEmbeddings

embeddings = JinaEmbeddings(
    jina_api_key="your_key",
    model_name="jina-embeddings-v2-base-en"
)

# Batch embedding — critical for large files
# Jina free tier: per-request token limits
# Solution: batch at 5 chunks per call with 200ms pause

async def embed_in_batches(chunks: list[str], batch_size: int = 5):
    vectors = []
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i:i + batch_size]
        batch_vectors = embeddings.embed_documents(batch)
        vectors.extend(batch_vectors)
        await asyncio.sleep(0.2)  # Rate limit protection
    return vectors
```

**Why Jina over others on free tier:**
- 1M tokens/month free — enough for full legal corpus + ongoing queries
- API-based = 0MB local RAM overhead
- 768-dim = same as Google's gecko, good quality
- Exponential backoff when rate limited: `3s → 6s → 12s → 24s → 48s`

---

## Matryoshka Representation Learning (MRL)

MRL is an embedding training technique where the full vector encodes meaning **in its first N dimensions**. You can truncate without retraining the model.

| Configuration | Dimensions | Storage/Vector | Accuracy Loss | Best For |
|--------------|-----------|---------------|--------------|----------|
| Full | 3072 | ~12 KB/vector | 0% baseline | Unlimited storage |
| MRL Truncated 1024 | 1024 | ~4 KB/vector | &lt;1% | Balanced production |
| **⭐ MRL Truncated 512** | **512** | **~2 KB/vector** | **&lt;1.5%** | **512MB RAM servers** |
| MRL Truncated 256 | 256 | ~1 KB/vector | &lt;2% | Extreme constraints |

### How to Use MRL with OpenAI

```python
from openai import OpenAI

client = OpenAI()

response = client.embeddings.create(
    model="text-embedding-3-large",
    input="Your text here",
    dimensions=512   # MRL truncation — pass this parameter
)

vector = response.data[0].embedding
# Returns 512-dim vector instead of 3072
# Store in Qdrant with vector_size=512
# Cosine similarity still works correctly
```

:::tip Storage Savings
512 dims instead of 3072 = **80% less Qdrant storage** with **&lt;1.5% accuracy loss**. On the free 1GB Qdrant tier, this means you can store 5x more vectors before hitting the limit.
:::

---

## The Embedding Model Graveyard (Things I Tried)

```
HuggingFace Transformers  → OOM kill immediately on Render 512MB
Gemini Embedding 001      → 100 RPM, 1500 req/month quota
                            First full indexing run exhausted monthly
                            quota before app finished starting
text-embedding-004        → Deprecated January 14, 2026
embedding-001             → Deprecated, returns 404
all-MiniLM-L6-v2         → ~400MB RAM, instant OOM on 512MB

Jina AI                   → ✅ Stable, generous free tier,
                            API-based (0 local RAM)
                            This finally worked.
```
