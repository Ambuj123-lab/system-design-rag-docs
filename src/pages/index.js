import React from 'react';
import Layout from '@theme/Layout';

export default function Home() {
  return (
    <Layout
      title="Ambuj Kumar Tripathi"
      description="Production RAG Engineering Notes"
    >
      <main className="ts-landing">
        <section className="ts-hero">
          <div className="ts-hero__content">
            <h1 className="ts-hero__title">Ambuj Kumar Tripathi</h1>
            <h2 className="ts-hero__subtitle">
              AI infrastructure<br />that builds itself
            </h2>

            <div className="ts-hero__actions">
              <a href="/docs/domain-ingestion/intro" className="ts-btn-group">
                <span className="ts-btn-text">READ THE DOCS</span>
                <span className="ts-btn-icon">→</span>
              </a>
              <a href="/docs/domain-applications/indian-legal-ai" className="ts-btn-group ts-btn-group--dark">
                <span className="ts-btn-text">FLAGSHIP PROJECT</span>
                <span className="ts-btn-icon">→</span>
              </a>
            </div>
          </div>
        </section>

        <section className="ts-grid">
          <div className="ts-grid__left">
            <div className="ts-block">
              <h3 className="ts-eyebrow">INTRODUCING THE ARCHITECTURE</h3>
              <p className="ts-desc">
                Designed for scale, this platform leverages autonomous agentic workflows to plan, generate, and maintain production-grade RAG pipelines, seamlessly integrating with lightweight embeddings and strict 512MB RAM constraints.
              </p>
            </div>

            <div className="ts-block ts-block--no-border-bottom">
              <h3 className="ts-eyebrow">ACTIVE INTEGRATIONS:</h3>
              <ul className="ts-tech-list">
                <li><span className="ts-dot ts-dot--green"></span>LangGraph StateMachines</li>
                <li><span className="ts-dot ts-dot--green"></span>Qdrant Vector Database</li>
                <li><span className="ts-dot ts-dot--green"></span>FastAPI (Render Cloud)</li>
                <li><span className="ts-dot ts-dot--green"></span>Jina AI Embeddings</li>
                <li><span className="ts-dot ts-dot--green"></span>Google Gemini Flash</li>
              </ul>
            </div>
          </div>

          <div className="ts-grid__right">
            <div className="ts-block">
              <h3 className="ts-eyebrow">TRUSTED ENGINEERING</h3>
              <p className="ts-desc">
                Engineered for the modern AI stack, this architecture solves the hardest problems in generative AI: Out-Of-Memory crashes, API quota exhaustion, and state management under heavy load.
              </p>
            </div>

            <div className="ts-logos">
              <a href="https://github.com/Ambuj123-lab" target="_blank" rel="noreferrer" className="ts-logo-link">GitHub</a>
              <a href="https://www.linkedin.com/in/ambuj-tripathi-042b4a118/" target="_blank" rel="noreferrer" className="ts-logo-link">LinkedIn</a>
              <a href="https://ambuj-portfolio-v2.netlify.app" target="_blank" rel="noreferrer" className="ts-logo-link">Portfolio</a>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
