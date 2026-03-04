// @ts-check
const { themes } = require('prism-react-renderer');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Ambuj Kumar Tripathi',
  tagline: 'RAG Engineering · LangGraph · LLMOps · Field Notes from Production',
  favicon: 'img/favicon.ico',
  url: 'https://ambuj-docs.netlify.app',
  baseUrl: '/',
  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  i18n: { defaultLocale: 'en', locales: ['en'] },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          routeBasePath: 'docs',
        },
        blog: false,
        theme: { customCss: require.resolve('./src/css/custom.css') },
      },
    ],
  ],

  themeConfig: {
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: false,
      respectPrefersColorScheme: false,
    },
    navbar: {
      title: 'AKT · Engineering Docs',
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'ragSidebar',
          position: 'left',
          label: '📚 RAG Guide',
        },
        {
          type: 'docSidebar',
          sidebarId: 'projectsSidebar',
          position: 'left',
          label: '🚀 Projects',
        },
        {
          type: 'docSidebar',
          sidebarId: 'fieldNotesSidebar',
          position: 'left',
          label: '📝 Field Notes',
        },
        {
          href: 'https://ambuj-portfolio-v2.netlify.app',
          label: 'Portfolio',
          position: 'right',
        },
        {
          href: 'https://github.com/Ambuj123-lab',
          position: 'right',
          className: 'header-github-link',
          'aria-label': 'GitHub',
        },
        {
          href: 'https://www.linkedin.com/in/ambuj-tripathi-042b4a118/',
          position: 'right',
          className: 'header-linkedin-link',
          'aria-label': 'LinkedIn',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'RAG Engineering',
          items: [
            { label: 'Document Loaders', to: '/docs/rag-engineering/document-loaders' },
            { label: 'Chunking Strategies', to: '/docs/rag-engineering/chunking-strategies' },
            { label: 'Embedding Models', to: '/docs/rag-engineering/embedding-models' },
            { label: 'LangGraph StateGraph', to: '/docs/rag-engineering/langgraph-stategraph' },
            { label: 'OOM Prevention', to: '/docs/rag-engineering/oom-prevention' },
            { label: 'Adaptive Retrieval', to: '/docs/rag-engineering/adaptive-retrieval' },
          ],
        },
        {
          title: 'Projects',
          items: [
            { label: 'Indian Legal AI Expert', to: '/docs/projects/indian-legal-ai' },
            { label: 'Citizen Safety AI', to: '/docs/projects/citizen-safety-ai' },
            { label: 'SHA-256 Sync Engine', to: '/docs/field-notes/sha256-sync-engine' },
          ],
        },
        {
          title: 'Connect',
          items: [
            { label: 'Portfolio', href: 'https://ambuj-portfolio-v2.netlify.app' },
            { label: 'GitHub', href: 'https://github.com/Ambuj123-lab' },
            { label: 'LinkedIn', href: 'https://linkedin.com/in/ambuj-kumar-tripathi' },
          ],
        },
      ],
      copyright: `© ${new Date().getFullYear()} Ambuj Kumar Tripathi · Personal Engineering Notes · Not for redistribution`,
    },
    prism: {
      theme: themes.vsDark,
      darkTheme: themes.vsDark,
      additionalLanguages: ['python', 'bash', 'javascript', 'typescript'],
    },
  },
};

module.exports = config;
