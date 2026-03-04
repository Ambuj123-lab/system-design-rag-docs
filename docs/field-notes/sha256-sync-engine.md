---
sidebar_position: 2
title: SHA-256 Sync Engine for Qdrant
description: Content-aware document versioning — detect changes, delete stale vectors, re-index only what changed.
---

# SHA-256 Sync Engine for Qdrant

> The problem: you have 6 legal PDFs in production. The government releases an updated Constitution. How do you update the vectors without duplicating everything, without downtime, and without re-indexing files that didn't change?

---

## The Problem

Naive re-indexing = delete all vectors + re-embed everything. Problems:
1. Rate limits on Jina AI free tier (1M tokens/month)
2. 8,896 child vectors × Jina embedding = expensive
3. Users hitting the API while indexing happens

---

## The Solution — Content Hash Registry

Store SHA-256 hash of every indexed file in Supabase Postgres. On each sync:

```
For each file in /legal_docs/:
  Compute SHA-256 hash of file content

  Case 1: Hash not in registry     → NEW FILE    → index it
  Case 2: Hash in registry, changed → UPDATED    → delete old vectors + re-index
  Case 3: File removed from folder  → DELETED    → delete vectors from Qdrant
  Case 4: Hash matches registry     → UNCHANGED  → skip (zero API calls)
```

Only changed files get re-embedded. Unchanged files: 0 API calls.

---

## Implementation

### Document Registry (Supabase Postgres)

```sql
CREATE TABLE document_registry (
  id            SERIAL PRIMARY KEY,
  file_name     TEXT NOT NULL UNIQUE,
  file_hash     TEXT NOT NULL,            -- SHA-256 of file bytes
  file_size     INTEGER,
  chunk_count   INTEGER,                  -- Total child chunks indexed
  last_indexed  TIMESTAMP DEFAULT NOW(),
  status        TEXT DEFAULT 'active'     -- active | deleted
);
```

### Sync Engine Python

```python
import hashlib
from pathlib import Path
from qdrant_client.models import Filter, FieldCondition, MatchValue

def compute_sha256(file_path: Path) -> str:
    sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            sha256.update(chunk)
    return sha256.hexdigest()


async def sync_documents(docs_dir: Path):
    current_files = {f.name: f for f in docs_dir.glob("*.pdf")}
    registry = await get_registry()  # Dict[filename → hash]

    for filename, filepath in current_files.items():
        current_hash = compute_sha256(filepath)
        stored_hash = registry.get(filename)

        if stored_hash is None:
            # CASE 1: New file
            print(f"NEW: {filename}")
            await index_document(filepath, current_hash)

        elif stored_hash != current_hash:
            # CASE 2: File content changed
            print(f"UPDATED: {filename}")
            await delete_vectors_by_filename(filename)  # Delete old
            await index_document(filepath, current_hash)  # Re-index

    for filename in registry:
        if filename not in current_files:
            # CASE 3: File removed
            print(f"DELETED: {filename}")
            await delete_vectors_by_filename(filename)
            await update_registry_status(filename, "deleted")
```

### Deletion by Payload Filter

```python
async def delete_vectors_by_filename(filename: str):
    qdrant.delete(
        collection_name="legal_docs",
        points_selector=Filter(
            must=[FieldCondition(
                key="source_file",
                match=MatchValue(value=filename)
            )]
        )
    )
    await remove_from_registry(filename)
```

### Deterministic Vector IDs (Idempotent)

```python
import uuid

def make_vector_id(file_hash: str, parent_idx: int, child_idx: int) -> str:
    # Same content + same position = same ID always
    seed = f"{file_hash}_{parent_idx}_{child_idx}"
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, seed))

# Qdrant upsert with deterministic IDs:
# Re-index same file (same hash) = same IDs = overwrite in place
# No duplicates. No orphaned vectors.
```

---

## Production Numbers

| Sync Scenario | API Calls | Time |
|--------------|-----------|------|
| All 6 files unchanged | 0 | ~200ms |
| 1 file updated (Constitution — 685 parents, 2845 children) | ~570 Jina calls | ~3 min |
| New file added (100 pages) | ~200 Jina calls | ~45s |
| File deleted | 0 | ~1s |

---

## Why Not Just Re-Index Everything Each Time?

```
1M Jina tokens/month free limit.
Full re-index of 8,896 child chunks:
  ~8,896 chunks × avg 80 tokens = ~711,680 tokens per run
  = 71% of monthly quota in one sync
  
With SHA-256 sync:
  Typical month: 1-2 document updates
  Token usage: ~140,000 tokens
  Monthly quota remaining: 86%
```
