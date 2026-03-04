import React, { useEffect } from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';

const sections = [
  {
    title: 'RAG Engineering',
    icon: '📚',
    desc: 'Document loaders, chunking strategies, embedding models, and LangGraph state machines — all production-tested.',
    link: '/docs/rag-engineering/intro',
    items: ['Parent-Child Chunking', 'Jina Embeddings', 'LangGraph StateGraph', 'Adaptive Retrieval'],
  },
  {
    title: 'Production Projects',
    icon: '🚀',
    desc: 'Live AI systems deployed on Docker + Render with OAuth, rate limiting, and observability.',
    link: '/docs/projects/intro',
    items: ['Indian Legal AI Expert', 'Citizen Safety AI', 'Deployment Lessons'],
  },
  {
    title: 'Field Notes',
    icon: '📝',
    desc: 'Hard-won lessons from deploying RAG on 512MB RAM, SHA-256 sync engines, and OOM prevention.',
    link: '/docs/field-notes/intro',
    items: ['512MB RAM RAG', 'SHA-256 Sync Engine', 'OOM Prevention'],
  },
];

const techStack = [
  { name: 'FastAPI', color: '#009688' },
  { name: 'LangGraph', color: '#7C3AED' },
  { name: 'Qdrant', color: '#DC2626' },
  { name: 'Jina AI', color: '#F59E0B' },
  { name: 'Presidio', color: '#0EA5E9' },
  { name: 'Docker', color: '#2496ED' },
  { name: 'Redis', color: '#DC382D' },
  { name: 'Supabase', color: '#3ECF8E' },
  { name: 'Langfuse', color: '#8B5CF6' },
  { name: 'Google OAuth', color: '#EA4335' },
];

function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    document.querySelectorAll('.scroll-reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

export default function Home() {
  useScrollReveal();

  return (
    <Layout
      title="Engineering Docs"
      description="Production RAG Engineering Notes by Ambuj Kumar Tripathi"
    >
      <main className="lp">
        {/* ===== HERO ===== */}
        <section className="lp-hero">
          <div className="lp-hero__mesh" />
          <div className="lp-hero__content scroll-reveal">
            <div className="lp-hero__eyebrow">Engineering Documentation</div>
            <h1 className="lp-hero__name">
              Ambuj Kumar<br />
              <span className="lp-hero__name--accent">Tripathi</span>
            </h1>
            <p className="lp-hero__role">
              RAG Engineer&nbsp;&nbsp;·&nbsp;&nbsp;LangGraph&nbsp;&nbsp;·&nbsp;&nbsp;LLMOps
            </p>
            <p className="lp-hero__desc">
              Production engineering notes from building AI systems that run on
              512 MB RAM. No theory — only what ships.
            </p>
            <div className="lp-hero__cta">
              <Link className="lp-btn lp-btn--fill" to="/docs/rag-engineering/intro">
                Read the Guide
              </Link>
              <Link className="lp-btn lp-btn--ghost" to="/docs/projects/indian-legal-ai">
                View Flagship Project
              </Link>
            </div>
          </div>
          <div className="lp-hero__scroll-hint">
            <span>scroll</span>
            <div className="lp-hero__scroll-line" />
          </div>
        </section>

        {/* ===== METRICS ===== */}
        <section className="lp-metrics scroll-reveal">
          {[
            ['6+', 'Engineering Docs'],
            ['3', 'Live Projects'],
            ['512 MB', 'RAM Budget'],
            ['4-Layer', 'Security'],
          ].map(([val, label], i) => (
            <div className="lp-metric" key={i}>
              <span className="lp-metric__val">{val}</span>
              <span className="lp-metric__label">{label}</span>
            </div>
          ))}
        </section>

        {/* ===== SECTIONS ===== */}
        <section className="lp-sections">
          <div className="lp-sections__header scroll-reveal">
            <h2>What's Inside</h2>
            <p>Real decisions. Real constraints. Real deployments.</p>
          </div>
          <div className="lp-sections__grid">
            {sections.map((s, i) => (
              <Link to={s.link} key={i} className="lp-card scroll-reveal">
                <div className="lp-card__glow" />
                <div className="lp-card__inner">
                  <span className="lp-card__icon">{s.icon}</span>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                  <ul className="lp-card__list">
                    {s.items.map((item, j) => (
                      <li key={j}>{item}</li>
                    ))}
                  </ul>
                  <span className="lp-card__arrow">→</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ===== TECH ===== */}
        <section className="lp-tech scroll-reveal">
          <h2>Built With</h2>
          <div className="lp-tech__grid">
            {techStack.map((t, i) => (
              <span
                key={i}
                className="lp-tech__pill"
                style={{ '--pill-color': t.color }}
              >
                {t.name}
              </span>
            ))}
          </div>
        </section>
      </main>
    </Layout>
  );
}
