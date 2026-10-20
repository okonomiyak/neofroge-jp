# NeoForge ドキュメント 日本語訳(非公式)

[NeoForge 公式ドキュメント](https://github.com/neoforged/Documentation)(Minecraft 1.21.1 版)の**非公式**の日本語訳です。NeoForge プロジェクトとは関係がありません。

- 原文: https://github.com/neoforged/Documentation(`versioned_docs/version-1.21.1/`)
- 原文は MIT ライセンスで公開されています。ライセンス全文は [LICENSE](LICENSE) を参照してください。

## 構成

- `docs-en/` … 原文(英語)のコピー
- `docs-ja/` … 日本語訳(`docs-en/` と同じ構成)
  - `glossary.md` … 訳語集
  - `progress.md` … 翻訳済みファイルの一覧
- `website/` … `docs-ja/` を Web サイトとして表示するための Docusaurus 設定

## Web サイト

`main` に push すると、GitHub Actions で https://okonomiyak.github.io/neofroge-jp/ に公開されます(リポジトリの Settings → Pages で Source を「GitHub Actions」にしておく必要があります)。

ローカルで見る場合:

```sh
cd website
npm ci
npm start
```

## 注意

訳の誤りは訳者の責任です。正確な内容は原文を参照してください。
