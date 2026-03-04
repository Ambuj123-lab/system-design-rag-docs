<div align="center">
  <img src="https://raw.githubusercontent.com/Ambuj123-lab/system-design-rag-docs/main/static/img/favicon.ico" alt="Logo" width="80" height="80">
  <h1 align="center">Enterprise RAG Architecture & Engineering Docs</h1>

  <p align="center">
    <strong>Production-tested patterns for LangGraph, Vector Search, and LLMOps on constrained infrastructure.</strong>
    <br />
    <br />
    <a href="https://ambuj-rag-docs.netlify.app/"><strong>Explore the Documentation »</strong></a>
    <br />
    <br />
    <a href="https://ambuj-portfolio-v2.netlify.app/">Portfolio</a>
    ·
    <a href="https://github.com/Ambuj123-lab">GitHub Profile</a>
    ·
    <a href="https://www.linkedin.com/in/ambuj-tripathi-042b4a118/">LinkedIn</a>
  </p>
</div>

---

## 📖 Overview

This repository houses the source code for my technical engineering documentation, built with [Docusaurus](https://docusaurus.io/). It serves as a unified knowledge base detailing the architectural decisions, constraints, and implementations of my AI Flagship projects.

The documentation is structured using **Domain-Driven Design (DDD)** concepts, separating infrastructure concerns from application logic. It focuses heavily on the harsh realities of deploying Agentic RAG systems on severely constrained environments (e.g., 512MB RAM standard tier instances).

## 🏗️ Domain Layout

The documentation is organized into functional domains:

- 📥 **[`domain-ingestion/`](docs/domain-ingestion/intro.md)**: Data pipelines. Parsing PDFs safely, Parent-Child chunking, and handling OOMs via chunked reads and Magic Bytes validation. Includes details on the custom SHA-256 state sync engine.
- 🔍 **[`domain-retrieval/`](docs/domain-retrieval/intro.md)**: Vector stores and embeddings. Why lightweight embedding models (like Jina AI) are critical for cost-efficiency.
- 🧠 **[`domain-orchestration/`](docs/domain-orchestration/intro.md)**: Control flow. Deep dives into LangGraph StateGraphs, agent routing, and fallbacks.
- ⚙️ **[`domain-operations/`](docs/domain-operations/intro.md)**: DevOps & LLMOps. Hard-won limits and optimization strategies for running RAG with absolutely minimal memory footprints.
- 🚀 **[`domain-applications/`](docs/domain-applications/intro.md)**: The ultimate flagship products this architecture powers (e.g., *Indian Legal AI Expert*, *Citizen Safety AI*).

## 🚀 The Web Application (Docusaurus)

This documentation site isn't just a basic template—it's engineered as a premium, high-performance static site.

### 🎨 Premium UI / UX
- **Vercel/Linear-inspired Design**: Built a completely custom, enterprise-grade landing page replacing the default Docusaurus hero.
- **Dynamic Animations**: Utilizes CSS-based shimmer effects, mesh-gradient animated backgrounds, and IntersectionObserver-powered scroll reveal animations.
- **Glassmorphism Components**: Feature cards implement conic-gradient glow hover states.

### 🔒 Enterprise Security Setup
Deployed on **Netlify**, the site enforces strict HTTP headers via `netlify.toml`:
*   `Strict-Transport-Security` (HSTS)
*   `X-Frame-Options: DENY`
*   `X-XSS-Protection: 1; mode=block`
*   `Content-Security-Policy (CSP)`
*   `X-Content-Type-Options: nosniff`

## 🛠️ Local Development

If you want to run this documentation site locally:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Ambuj123-lab/system-design-rag-docs.git
   cd system-design-rag-docs
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run start
   ```
   > The site will run at `http://localhost:3000`.

4. **Build for production:**
   ```bash
   npm run build
   ```

## 👨‍💻 Architect

Designed and engineered by **Ambuj Kumar Tripathi**, an AI & Backend Engineer specializing in extracting maximum performance from constrained infrastructure.

*“No theory — only what ships.”*
