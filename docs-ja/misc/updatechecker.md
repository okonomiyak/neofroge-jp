# NeoForge のアップデートチェッカー {#neoforge-update-checker}

NeoForge には、非常に軽量で、使うかどうかを選べるアップデート確認の仕組みがあります。いずれかの Mod に利用可能なアップデートがあると、メインメニューの「Mods」ボタンと Mod 一覧に点滅するアイコンが表示され、それぞれの変更履歴も表示されます。アップデートを自動でダウンロードすることは*ありません*。

## はじめに {#getting-started}

最初に、`mods.toml` ファイルで `updateJSONURL` パラメータを指定します。このパラメータの値は、アップデート用の JSON ファイルを指す有効な URL にしてください。このファイルは、Mod のすべてのユーザーが確実にアクセスできる場所であれば、自分の Web サーバー、GitHub など、どこに置いてもかまいません。

## アップデート JSON の形式 {#update-json-format}

JSON 自体は、次のような比較的単純な形式です。

```json5
{
    "homepage": "<homepage/download page for your mod>",
    "<mcversion>": {
        "<modversion>": "<changelog for this version>", 
        // List all versions of your mod for the given Minecraft version, along with their changelogs
        // ...
    },
    "promos": {
        "<mcversion>-latest": "<modversion>",
        // Declare the latest "bleeding-edge" version of your mod for the given Minecraft version
        "<mcversion>-recommended": "<modversion>",
        // Declare the latest "stable" version of your mod for the given Minecraft version
        // ...
    }
}
```

見ればおおむねわかると思いますが、いくつか補足します。
 
- `homepage` のリンクは、Mod が古くなっているときにユーザーに表示されるリンクです。
- NeoForge は、Mod のあるバージョン文字列が別のものより「新しい」かどうかを、内部のアルゴリズムで判定します。ほとんどのバージョン方式は互換性があるはずですが、自分の方式がサポートされているか気になる場合は、`ComparableVersion` クラスを確認してください。[Maven のバージョン規則][mvnver]に従うことを強くおすすめします。
- 変更履歴の文字列は、`\n` で複数行に分けられます。短い変更履歴だけを載せ、変更の全一覧がある外部サイトにリンクする人もいます。
- データを手で入力するのは面倒かもしれません。Groovy は JSON のパースをネイティブにサポートしているので、リリースのビルド時にこのファイルを自動で更新するよう `build.gradle` を設定できます。その方法は読者への課題とします。

- [nocubes][nocubes]、[Corail Tombstone][corail]、[Chisels & Bits 2][chisel] の例がこちらにあります。

## アップデート確認の結果の取得 {#retrieving-update-check-results}

NeoForge のアップデートチェッカーの結果は、`VersionChecker#getResult(IModInfo)` で取得できます。自分の `IModInfo` は `ModContainer#getModInfo` で取得できます。`ModContainer` は、Mod のコンストラクタの引数に追加できます。他の Mod の `ModContainer` は `ModList.get().getModContainerById(<modId>)` で取得できます。返されるオブジェクトには、バージョン確認の状態を示す `#status` メソッドがあります。

|          状態 | 説明 |
|----------------:|:------------|
|        `FAILED` | バージョンチェッカーが、指定された URL に接続できませんでした。 |
|    `UP_TO_DATE` | 現在のバージョンが推奨バージョンと同じです。 |
|         `AHEAD` | 最新バージョンが存在せず、現在のバージョンが推奨バージョンより新しい状態です。 |
|      `OUTDATED` | 新しい推奨バージョンまたは最新バージョンがあります。 |
| `BETA_OUTDATED` | 新しい最新バージョンがあります。 |
|          `BETA` | 現在のバージョンが最新バージョンと同じか、それより新しいです。 |
|       `PENDING` | 要求した結果がまだ出ていないので、少ししてからもう一度試してください。 |

返されるオブジェクトには、`update.json` で指定した対象のバージョンと変更履歴の行も含まれます。

[mvnver]: ../gettingstarted/versioning.md
[nocubes]: https://cadiboo.github.io/projects/nocubes/update.json
[corail]: https://github.com/Corail31/tombstone_lite/blob/master/update.json
[chisel]: https://github.com/Aeltumn/Chisels-and-Bits-2/blob/master/update.json
