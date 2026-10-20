// @ts-check
const {themes} = require('prism-react-renderer');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'NeoForge 1.21.1 ドキュメント 日本語訳( 非公式 )',
  tagline: 'NeoForge 1.21.1 ドキュメントの非公式日本語訳',
  url: 'https://okonomiyak.github.io',
  baseUrl: '/neofroge-jp/',
  organizationName: 'okonomiyak',
  projectName: 'neofroge-jp',
  trailingSlash: false,
  onBrokenLinks: 'warn',
  i18n: {
    defaultLocale: 'ja',
    locales: ['ja'],
  },
  markdown: {
    hooks: {
      // 未翻訳ページへのリンクは翻訳が進むまで切れたままになるため、警告にとどめる
      onBrokenMarkdownLinks: 'warn',
    },
  },
  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          path: '../docs-ja',
          routeBasePath: '/',
          sidebarPath: require.resolve('./sidebars.js'),
          exclude: ['progress.md'],
          editUrl: 'https://github.com/okonomiyak/neofroge-jp/edit/main/',
        },
        blog: false,
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],
  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      announcementBar: {
        id: 'version-1-21-1',
        content: 'このサイトは <b>Minecraft 1.21.1</b> 向け NeoForge ドキュメントの非公式日本語訳です。他のバージョンでは内容が異なることがあります。',
        isCloseable: false,
      },
      navbar: {
        title: 'NeoForge ドキュメント( 日本語訳・非公式 )',
        items: [
          {type: 'html', value: '<span class="version-badge">Minecraft 1.21.1</span>', position: 'left'},
          {to: '/glossary', label: '用語集', position: 'left'},
          {href: 'https://docs.neoforged.net/docs/1.21.1/gettingstarted/', label: '原文', position: 'right'},
          {href: 'https://github.com/okonomiyak/neofroge-jp', label: 'GitHub', position: 'right'},
        ],
      },
      footer: {
        style: 'dark',
        copyright:
          'NeoForge 1.21.1 ドキュメントの非公式の日本語訳です。原文: <a href="https://github.com/neoforged/Documentation/tree/main/versioned_docs/version-1.21.1">neoforged/Documentation( version-1.21.1 )</a>( MIT License )。訳の誤りは訳者の責任です。正確な内容は原文を参照してください。',
      },
      prism: {
        theme: themes.github,
        darkTheme: themes.dracula,
        additionalLanguages: ['java', 'gradle', 'toml', 'groovy', 'kotlin', 'json', 'json5', 'properties'],
      },
    }),
};

module.exports = config;
