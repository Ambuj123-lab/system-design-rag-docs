/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  ragSidebar: [
    {
      type: 'category',
      label: '📚 RAG Engineering Guide',
      collapsible: false,
      items: [
        'rag-engineering/intro',
        'rag-engineering/document-loaders',
        'rag-engineering/chunking-strategies',
        'rag-engineering/embedding-models',
        'rag-engineering/architecture-decisions',
        'rag-engineering/langgraph-stategraph',
        'rag-engineering/oom-prevention',
        'rag-engineering/adaptive-retrieval',
      ],
    },
  ],
  projectsSidebar: [
    {
      type: 'category',
      label: '🚀 Production Projects',
      collapsible: false,
      items: [
        'projects/intro',
        'projects/indian-legal-ai',
        'projects/citizen-safety-ai',
        'projects/deployment-lessons',
      ],
    },
  ],
  fieldNotesSidebar: [
    {
      type: 'category',
      label: '📝 Field Notes',
      collapsible: false,
      items: [
        'field-notes/intro',
        'field-notes/sha256-sync-engine',
        'field-notes/512mb-ram-rag',
      ],
    },
  ],
};

module.exports = sidebars;
