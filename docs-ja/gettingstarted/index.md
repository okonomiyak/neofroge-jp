# NeoForge を始める {#getting-started-with-neoforge}

このセクションでは、NeoForge のワークスペースのセットアップ方法と、Mod の実行・テスト方法を説明します。

## 前提条件 {#prerequisites}

- Java プログラミング言語、特にオブジェクト指向、ポリモーフィズム、ジェネリクス、関数型の機能に慣れていること。
- Java 21 Development Kit ( JDK ) と 64 ビット版 Java Virtual Machine ( JVM ) がインストールされていること。NeoForge は [Microsoft ビルドの OpenJDK][jdk] を推奨し、公式にサポートしていますが、他の JDK でも動作するはずです。

:::caution
64 ビット版の JVM を使っていることを確認してください。確認方法の一つは、ターミナルで `java -version` を実行することです。Minecraft は 32 ビット版の JVM をサポートしていません。
:::

- 好みの統合開発環境 ( IDE ) に慣れていること。
      - NeoForge が公式にサポートしているのは [IntelliJ IDEA][intellij] と [Eclipse][eclipse] で、どちらも Gradle との連携機能を備えています。ただし、Netbeans や Visual Studio Code から Vim や Emacs まで、どの IDE でも使えます。
- [Git][git] と [GitHub][github] に慣れていること。厳密には必須ではありませんが、作業がずっと楽になります。

## ワークスペースのセットアップ {#setting-up-the-workspace}

- Mod Developer Kit ( MDK )( [ModDevGradle][mdgmdk] 版または [NeoGradle][ngmdk] 版 )の GitHub リポジトリを開き、「Use this template」をクリックして、新しく作成されたリポジトリをローカルマシンにクローンします。
    - GitHub を使いたくない場合や、古いコミットのテンプレートを入手したい場合は、リポジトリの ZIP( Code -> Download ZIP )をダウンロードして展開することもできます。
- IDE を開き、Gradle プロジェクトをインポートします。IntelliJ IDEA と Eclipse では自動で行われます。自動でインポートしない IDE の場合は、ターミナルの `gradlew` コマンドでも行えます。
    - 初回は、Gradle が Minecraft 本体を含む NeoForge のすべての依存関係をダウンロードし、デコンパイルします。ハードウェアやネットワーク環境によっては、かなりの時間( 最大 1 時間ほど )がかかることがあります。
    - Gradle のファイルを変更したときは、IDE の「Reload Gradle」ボタンか、再度ターミナルの `gradlew` コマンドで、Gradle の変更を再読み込みする必要があります。

### Minecraft のソースコード {#minecraft-source-code}

Gradle の読み込みが完了すると、サンプルの Mod プロジェクトが用意されるだけでなく、参照用に Minecraft と NeoForge の( パッチ適用済みの )ソースと[リソースファイル][resources]もワークスペースに含まれます。これらのソースは、IntelliJ IDEA では `External Libraries`、Eclipse では `Referenced Libraries` の下にあります。名前は使用する Gradle プラグインによって異なります( `<version>` は使用している NeoForge のバージョンです )。

| Gradle プラグイン | Minecraft のソース                              | NeoForge のソース                             |
|---------------|------------------------------------------------|----------------------------------------------|
| NeoGradle     | `ng_dummy_ng.net.neoforged:neoforge:<version>` | `net.neoforged:neoforge:universal:<version>` |
| ModDevGradle  | `minecraft-patched-<version>-merged.jar`       | `net.neoforged:neoforge:universal:<version>` |

また、IDE の検索機能( デフォルトでは IntelliJ IDEA は Shift 2 回、Eclipse は Ctrl+H )を使って、特定の Minecraft のクラスやファイルを検索できます。

:::warning
他の IDE にはこの連携機能がない場合があります。多くの機能を実装するうえでソースコードの参照は欠かせません。ソースコードを参照したい場合、サポート対象は IntelliJ IDEA と Eclipse のみです。
:::

## Mod 情報のカスタマイズ {#customizing-your-mod-information}

Mod の基本的なプロパティの多くは、`gradle.properties` ファイルで変更できます。Mod 名や Mod のバージョンといった基本的な項目も含まれます。詳しくは、`gradle.properties` ファイル内のコメントか、[`gradle.properties` ファイルのドキュメント][properties]を参照してください。

それ以上にビルドプロセスを変更したい場合は、`build.gradle` ファイルを編集します。NeoForge 用の Gradle プラグインである NeoGradle にはいくつもの設定オプションがあり、その一部は `build.gradle` ファイル内のコメントで説明されています。完全なドキュメントは [NeoGradle のドキュメント][neogradle]を参照してください。

:::caution
`build.gradle` と `settings.gradle` は、何をしているか理解している場合にのみ編集してください。基本的なプロパティはすべて `gradle.properties` で設定できます。
:::

## Mod のビルドとテスト {#building-and-testing-your-mod}

Mod をビルドするには、`gradlew build` を実行します。`build/libs` に `<archivesBaseName>-<version>.jar` という名前のファイルが出力されます。`<archivesBaseName>` と `<version>` は `build.gradle` で設定されるプロパティで、デフォルトではそれぞれ `gradle.properties` の `mod_id` と `mod_version` の値になります。必要に応じて `build.gradle` で変更できます。生成された JAR ファイルは、NeoForge を導入した Minecraft の `mods` フォルダに置くか、Mod 配布プラットフォームにアップロードできます。

テスト環境で Mod を実行するには、生成された実行構成を使うか、対応するタスク( 例: `gradlew runClient` )を使います。これにより、指定したソースセットとともに、対応する runs ディレクトリ( 例: `runs/client` や `runs/server` )から Minecraft が起動します。デフォルトの MDK には `main` ソースセットが含まれているため、`src/main/java` に書いたコードはすべて適用されます。

### サーバーでのテスト {#server-testing}

実行構成または `gradlew runServer` で専用サーバーを起動すると、サーバーはすぐに終了します。実行ディレクトリにある `eula.txt` ファイルを編集して、Minecraft の EULA に同意する必要があります。

同意すると、サーバーが読み込まれ、`localhost`( デフォルトでは `127.0.0.1` )で利用できるようになります。ただし、まだ接続はできません。サーバーはデフォルトでオンラインモードになっており、認証が必要ですが、開発用のプレイヤーは認証情報を持っていないためです。これを解決するには、サーバーを停止し、`server.properties` ファイルの `online-mode` プロパティを `false` に設定します。そのうえでサーバーを起動すれば、接続できるはずです。

:::tip
Mod は必ず専用サーバー環境でもテストしてください。[クライアント専用 Mod][client] も対象です。クライアント専用 Mod は、サーバーで読み込まれたときに何もしないようにする必要があるためです。
:::

[client]: ../concepts/sides.md
[eclipse]: https://www.eclipse.org/downloads/
[git]: https://www.git-scm.com/
[github]: https://github.com/
[intellij]: https://www.jetbrains.com/idea/
[jdk]: https://learn.microsoft.com/en-us/java/openjdk/download#openjdk-21
[mdgmdk]: https://github.com/NeoForgeMDKs/MDK-1.21-ModDevGradle
[ngmdk]: https://github.com/NeoForgeMDKs/MDK-1.21-NeoGradle
[neogradle]: https://docs.neoforged.net/neogradle/docs/
[properties]: modfiles.md#gradleproperties
[resources]: ../resources/index.md
