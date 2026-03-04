---
sidebar_position: 3
title: Chunking Strategies
description: Wrong chunk size = silently bad retrieval. This is where most RAG systems fail.
---

# Chunking Strategy Guide

> Wrong chunk size = silently bad retrieval. This is where most RAG implementations fail **silently** — no error, just bad answers.

---

## Strategy Comparison

| Strategy | Best For | How It Works | Tool | Cost |
|----------|----------|-------------|------|------|
| **Fixed Size** | General RAG default | Splits at char limit regardless of meaning | `RecursiveCharacterTextSplitter` | Fast · Free |
| **⭐ Parent-Child** | Legal / Medical / Deep context | Child (400) → Qdrant search. Parent (2000) → LLM context. Single lookup. | `RecursiveCharacterTextSplitter` (twice) | Fast · Free — **My production approach** |
| **Semantic** | High-accuracy, precision > cost | Groups sentences by cosine similarity. Breaks where meaning shifts. | `SemanticChunker` (LangChain) | Slow · Expensive (API per sentence) |
| **Markdown Header** | Docs, Notion exports | Splits on H1/H2/H3. Chunk inherits parent heading. | `MarkdownHeaderTextSplitter` | Fast · Free |
| **HTML Section** | Web pages | Splits on `<h1>` `<h2>` `<div>`. Section context in metadata. | `HTMLHeaderTextSplitter` | Fast · Free |
| **Token-Based** | LLM token-limit control | Splits by actual token count — prevents context overflow | `TokenTextSplitter` / tiktoken | Fast · Free |
| **CSV Row** | Tabular data | Each row = one chunk. Row + headers embedded together. | Pandas `iterrows()` | Fast · No overlap |
| **Code Splitter** | Source code RAG | Splits on functions/classes — not arbitrary char limits | `RecursiveCharacterTextSplitter(language=...)` | Fast · Free |

---

## Parent-Child Chunking — Deep Dive

This is the most important pattern for production RAG. Here's exactly why and how.

### The Problem With Naive Chunking

```
Small chunks (400 chars) → precise vector search BUT poor LLM context
Large chunks (2000 chars) → rich LLM context BUT noisy vector search

You can't win with one size. So use two sizes.
```

### The Solution — Two-Level Chunking

```python
from langchain.text_splitter import RecursiveCharacterTextSplitter

# PARENT: Large, contextual, for LLM
parent_splitter = RecursiveCharacterTextSplitter(
    chunk_size=2000,    # ~1.5 pages of legal text
    chunk_overlap=200   # Preserve cross-boundary context
)

# CHILD: Small, precise, for vector search
child_splitter = RecursiveCharacterTextSplitter(
    chunk_size=400,     # ~3-4 paragraphs
    chunk_overlap=50    # Minimal overlap (search precision)
)
```

### How It Works — Step by Step

```
PDF (Constitution.pdf — 400 pages)
  ↓ PyMuPDFLoader
  ↓ parent_splitter  → ~685 parent chunks (2000 chars each)
  ↓ For each parent  → child_splitter → ~4-5 child chunks per parent
  ↓ Total            → ~2,845 child chunks

WHAT GOES INTO QDRANT:
  Only CHILD chunks stored as vector points

EACH CHILD PAYLOAD CONTAINS:
  text:             child text (400 chars) ← shown as source preview in UI
  parent_text:      FULL parent text       ← sent to LLM as context
  parent_id:        "{file_hash}_{p_idx}" ← for deduplication
  source_file:      "Constitution_of_India_2024.pdf"
  page:             92
  chunk_type:       "child"
  is_temporary:     False
  uploaded_by:      "system"
```

### The Key Insight

```python
# During SEARCH:
# Small child chunks → precise retrieval (less noise)

# During GENERATION:
# Parent text (2000 chars) → sent to LLM
# → rich legal context with surrounding provisions,
#   definitions, and section numbers
# → prevents hallucination
```

:::tip Interview Answer
*"During vector search, small child chunks give precise retrieval because they have less noise. But during generation, I send the parent text (2000 chars) to the LLM — giving it rich legal context. This prevents hallucination because parent text includes surrounding legal provisions, definitions, and section numbers."*
:::

---

## Real Numbers From My Production System

| Document | Parent Chunks | Child Chunks | File Size |
|----------|-------------|-------------|-----------|
| Constitution of India 2024 | 685 | 2,845 | 2.4 MB |
| Bharatiya Nagarik Suraksha Sanhita | 555 | 2,656 | 2.1 MB |
| Bharatiya Nyaya Sanhita 2023 | 271 | 1,311 | 0.9 MB |
| Motor Vehicles Act 1988 | 262 | 1,248 | 1.2 MB |
| Consumer Protection Act 2019 | 81 | 416 | 1.2 MB |
| IT Act 2000 (Updated) | 83 | 420 | 0.8 MB |
| **TOTAL** | **1,937** | **8,896** | **~8.6 MB** |

---

## Quick Reference — Sizes I Use

```
Standard RAG default:     chunk_size=1000, chunk_overlap=200
Legal / Medical RAG:      parent=2000, child=400, child_overlap=50
Code RAG:                 language-aware splitter — function/class boundaries
CSV RAG:                  no splitter — one chunk per row + column headers
Markdown docs:            MarkdownHeaderTextSplitter first, then RecursiveChar
```
