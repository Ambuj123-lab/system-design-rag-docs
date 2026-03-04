---
sidebar_position: 5
title: Architecture Decisions Log
description: Real production decisions with the problem, solution, and measured outcome.
---

# Architecture Decisions Log

> Personal production decisions from my own deployed system. Every entry has: what I did, why technically, and what changed measurably.

---

## Decision 1 — Monolith over Microservices

**What:** Single FastAPI service handling auth + RAG + DB instead of separate services.

**Why:** Shared in-memory singletons (Qdrant client, Presidio engine, embedding model). Zero cold-start latency. One Docker container on Render free tier — no orchestration overhead.

**Result:** Zero functionality loss. Simpler deployment. Faster local dev. Clean PR diffs.

---

## Decision 2 — 4-Layer File Ingestion Shield

**What:**
- L1: Extension guard (`.pdf` check)
- L2: Magic bytes (first 4 bytes `%PDF`)
- L3: Chunked streaming (1MB chunks, 10MB max)
- L4: PDF bomb guard (500 page limit)

**Why:** L1 catches obvious abuse. L2 catches renamed `.exe` files. L3 prevents OOM on 512MB container. L4 prevents CPU infinite loop from decompression bomb PDFs.

**Result:** OOM-proof upload pipeline. Malicious files rejected at HTTP layer before touching disk or memory.

---

## Decision 3 — Zero-Memory PII Masking

**What:** Removed spaCy heavy NLP models. Replaced with Custom Regex Recognizers. Patterns: Aadhaar (12-digit) + PAN (ABCDE1234F format).

**Why:** `spaCy en_core_web_sm` = ~200MB RAM load at startup. Custom regex = 0.01MB. Same accuracy for Indian PII patterns (Aadhaar, PAN, mobile numbers).

**Result:** Memory footprint 0.01MB vs 200MB. Zero latency overhead. 100% accurate for target patterns.

---

## Decision 4 — Parent Text in Qdrant Payload (Not SQL)

**What:** Parent text stored directly in Qdrant payload metadata alongside the child vector. Child vector → parent text fetched in same query. No second database call.

**Why:** SQL lookup = extra network hop + DB query. Qdrant payload = collocated with vector. Single API call returns both child match + parent context.

**Result:** 183ms retrieval latency. Eliminated one full DB round-trip per query. Simpler architecture — fewer moving parts.

---

## Decision 5 — DNS Monkey-Patch for ISP Block

**What:** JioFiber ISP was blocking `*.cloud.qdrant.io` DNS resolution at network level during development. Monkey-patched `socket.getaddrinfo` to intercept Qdrant hostnames → resolve via Google DNS (8.8.8.8). All other DNS queries unchanged.

**Why:** ISP-level DNS block. No VPN option on dev machine.

**Result:** Full Qdrant connectivity restored in dev. No-op in production (Render has normal DNS). Taught me exactly how Python DNS resolution works under the hood.

```python
import socket

original_getaddrinfo = socket.getaddrinfo

def patched_getaddrinfo(host, port, *args, **kwargs):
    if host and 'qdrant.io' in host:
        import dns.resolver
        resolved = dns.resolver.resolve(host, 'A', nameservers=['8.8.8.8'])
        host = str(resolved[0])
    return original_getaddrinfo(host, port, *args, **kwargs)

socket.getaddrinfo = patched_getaddrinfo
```

---

## Decision 6 — Deterministic UUIDs for Idempotent Indexing

**What:** Vector IDs generated using `uuid.uuid5` seeded from file hash + chunk position. Same file content + same position = same UUID always.

**Why:** Re-indexing the same file should replace existing vectors via Qdrant's upsert — not create duplicates. If content changes, hash changes → new UUIDs → old vectors explicitly deleted first.

**Result:** Zero orphaned vectors across multiple re-indexing cycles. SHA-256 sync engine runs safely multiple times.

```python
import uuid

# Deterministic — same input always = same UUID
chunk_id = f"{file_hash}_{parent_index}_{child_index}"
vector_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, chunk_id))

# Re-index same file → same IDs → upsert overwrites (no duplicates)
# File content changes → new hash → new IDs → old vectors deleted first
```
