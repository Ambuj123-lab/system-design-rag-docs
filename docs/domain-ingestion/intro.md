---
sidebar_position: 1
---

# Ingestion Domain

Welcome to the **Ingestion Domain**. This section covers the architecture and implementation details for getting data into the RAG system securely and efficiently.

### Key Components:
- **Document Loaders:** How we parse and extract text from various file formats (especially PDFs).
- **Chunking Strategies:** Advanced techniques like Parent-Child chunking to preserve context.
- **Sync Engine:** The SHA-256 based synchronization engine that prevents duplicate processing.
