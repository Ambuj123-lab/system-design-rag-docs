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
      title: 'Ambuj Kumar Tripathi',
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: '📖 Engineering Docs',
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
          title: 'Infrastructure Docs',
          items: [
            { label: 'Document Loaders', to: '/docs/domain-ingestion/document-loaders' },
            { label: 'Chunking Strategies', to: '/docs/domain-ingestion/chunking-strategies' },
            { label: 'Embedding Models', to: '/docs/domain-retrieval/embedding-models' },
            { label: 'LangGraph StateGraph', to: '/docs/domain-orchestration/langgraph-stategraph' },
            { label: 'OOM Prevention', to: '/docs/domain-operations/oom-prevention' },
            { label: 'Adaptive Retrieval', to: '/docs/domain-retrieval/adaptive-retrieval' },
          ],
        },
        {
          title: 'Applications',
          items: [
            { label: 'Indian Legal AI Expert', to: '/docs/domain-applications/indian-legal-ai' },
            { label: 'Citizen Safety AI', to: '/docs/domain-applications/citizen-safety-ai' },
            { label: 'Citizen Safety Tech Spec', to: '/docs/domain-applications/citizen-safety-tech-spec' },
            { label: 'SHA-256 Sync Engine', to: '/docs/domain-ingestion/sha256-sync-engine' },
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
      copyright: `© 2026 Ambuj Kumar Tripathi. Field notes from production. All rights reserved.`,
    },
    prism: {
      theme: themes.vsDark,
      darkTheme: themes.vsDark,
      additionalLanguages: ['python', 'bash', 'javascript', 'typescript'],
    },
  },
  markdown: {
    mermaid: true,
  },
  themes: [
    '@docusaurus/theme-mermaid',
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      {
        hashed: true,
        language: ['en'],
        indexDocs: true,
        indexBlog: false,
        indexPages: false,
        docsRouteBasePath: '/docs',
        highlightSearchTermsOnTargetPage: true,
        searchResultLimits: 8,
        searchResultContextMaxLength: 50,
      },
    ],
  ],
};

module.exports = config;
