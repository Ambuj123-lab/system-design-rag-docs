---
sidebar_position: 2
title: Document Loaders & Parsers
description: Every RAG pipeline starts with ingestion. Wrong loader = wasted tokens, OOM, or lost structure.
---

# Document Loaders & Parsers

> Every RAG pipeline starts with ingestion. The wrong loader wastes tokens, crashes on memory, or loses table structure.

---

## Loader Comparison Table

| Document Type | Best Loader | When to Use | Trade-off | RAM Impact |
|--------------|-------------|-------------|-----------|------------|
| **Standard Text PDF** | `PyMuPDF (fitz)` | Clean text, no OCR needed | Doesn't handle scanned pages | Very Low ~5–10 MB |
| **Scanned PDF / Image** | `Tesseract OCR` or `Unstructured` | Image-only pages | Slow, CPU-heavy. Accuracy drops with bad scans | High ~200–400 MB |
| **Complex Tables** | `LlamaParse` or `Marker` | Multi-column, nested tables, financial reports | Paid API. Slower than PyMuPDF | Low (API call) ~10–20 MB |
| **Word Doc (.docx)** | `python-docx` or `Unstructured` | Preserves headings + tables intact | Doesn't handle embedded images/charts | Low ~10–30 MB |
| **CSV / Excel** | `Pandas` or `CSVLoader` | Structured tabular data, row-level retrieval | 100k+ rows can exhaust RAM. Chunk by row groups | Medium ~50–200 MB |
| **Web Page / URL** | `BeautifulSoup` or `WebBaseLoader` | Live page scraping, documentation sites | JS-rendered pages need Playwright/Selenium | Low–Medium ~20–80 MB |
| **Audio (.mp3/.wav)** | `OpenAI Whisper API` | Transcribe speech, podcasts, meetings | Local Whisper ~3GB RAM. **Use API always** | CRITICAL — API only |
| **Video (.mp4)** | `ffmpeg → Whisper API` | Lecture transcription | Direct video RAG = extremely heavy, avoid | CRITICAL — API only on 512MB |
| **Plain Text** | `TextLoader` | Simplest case | No structure preservation | Very Low |

---

## The Ones I Actually Use

### PyMuPDF — My Default for PDFs

```python
from langchain_community.document_loaders import PyMuPDFLoader

loader = PyMuPDFLoader("constitution.pdf")
documents = loader.load()
# Returns list of Document objects, one per page
# Each has .page_content (text) and .metadata (page, source)
```

**Why PyMuPDF over PyPDF:**
- 5–10x faster on large legal PDFs (tested on 400-page Constitution)
- Preserves page numbers in metadata automatically
- Handles multi-column layouts better
- RAM: ~5–10MB even for large files

---

### Unstructured — When PDF Has Tables

```python
from langchain_community.document_loaders import UnstructuredPDFLoader

loader = UnstructuredPDFLoader(
    "financial_report.pdf",
    mode="elements",          # Preserves table structure
    strategy="hi_res"         # Better for complex layouts
)
documents = loader.load()
```

:::warning RAM Warning
`strategy="hi_res"` uses detectron2 under the hood — can consume 1–2GB RAM. On 512MB servers, use `strategy="fast"` only.
:::

---

### Audio — Always API, Never Local

```python
# Local Whisper = 3–6GB RAM = instant OOM kill on free tier
# Use AssemblyAI or OpenAI API instead

import openai

with open("meeting.mp3", "rb") as audio:
    transcript = openai.audio.transcriptions.create(
        model="whisper-1",
        file=audio,
        response_format="text"
    )
# RAM cost: ~0MB local. API handles everything.
```

---

## My 4-Layer File Ingestion Shield

Before any loader runs, every uploaded file goes through 4 checks:

```python
import magic  # python-magic for MIME detection

async def validate_file(file: UploadFile) -> bytes:
    # L1 — Extension guard
    if not file.filename.endswith('.pdf'):
        raise HTTPException(415, "Only PDF files accepted")

    # L2 — Magic bytes check (first 4 bytes only)
    header = await file.read(4)
    if header != b'%PDF':
        raise HTTPException(415, "Invalid file format")
    await file.seek(0)

    # L3 — Chunked streaming with 10MB limit
    content = b""
    async for chunk in file:
        content += chunk
        if len(content) > 10 * 1024 * 1024:  # 10MB
            raise HTTPException(413, "File too large")

    # L4 — PDF bomb guard
    import fitz
    doc = fitz.open(stream=content, filetype="pdf")
    if doc.page_count > 500:
        raise HTTPException(400, "Too many pages (max 500)")

    return content
```

**Why each layer:**
- L1 catches obvious abuse at the HTTP layer
- L2 catches renamed `.exe` files disguised as `.pdf`
- L3 prevents OOM from a large file being read into memory all at once
- L4 prevents CPU infinite loop from decompression bomb PDFs

:::tip Result
OOM-proof upload pipeline. Malicious files rejected before touching disk or memory.
:::
