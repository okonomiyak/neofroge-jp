# リソース {#resources}

リソースとは、ゲームが使う、コードではない外部ファイルのことです。最も代表的な種類はテクスチャですが、Minecraft のエコシステムには他にも多くの種類のリソースがあります。もちろん、これらのリソースにはすべてコード側で利用する仕組みが必要なので、利用する側の仕組みもこのセクションにまとめています。

Minecraft のリソースは一般に 2 種類あります。アセットと呼ばれる[論理クライアント][logicalsides]用のリソースと、データと呼ばれる[論理サーバー][logicalsides]用のリソースです。アセットは主に表示専用の情報で、テクスチャ、表示用のモデル、翻訳、サウンドなどです。一方、データには、ルートテーブル、レシピ、worldgen の情報など、ゲームプレイに影響するさまざまなものが含まれます。それぞれリソースパックとデータパックから読み込まれます。NeoForge は、Mod ごとに組み込みのリソースパックとデータパックを生成します。

リソースパックとデータパックには、通常 [`pack.mcmeta` ファイル][packmcmeta]が必要です。ただし、現在の NeoForge は実行時にこれを生成してくれるので、気にする必要はありません。

何かの形式がわからないときは、バニラのリソースを見てみてください。NeoForge の開発環境には、バニラのコードだけでなくバニラのリソースも含まれています。リソースは External Resources セクション( IntelliJ )/ Project Libraries セクション( Eclipse )にあり、名前は `ng_dummy_ng.net.minecraft:client:client-extra:<minecraft_version>`( Minecraft のリソース )または `ng_dummy_ng.net.neoforged:neoforge:<neoforge_version>`( NeoForge のリソース )です。

## アセット {#assets}

_関連項目: [Minecraft Wiki][mcwiki] の[リソースパック][mcwikiresourcepacks]_

アセット( クライアント側のリソース )は、[クライアント][sides]でのみ意味を持つすべてのリソースです。アセットはリソースパックから読み込まれます。リソースパックは、古い用語でテクスチャパックとも呼ばれます( テクスチャにしか影響できなかった古いバージョンに由来します )。リソースパックは、基本的に `assets` フォルダです。`assets` フォルダには、リソースパックが含む名前空間ごとにサブフォルダがあり、名前空間 1 つがサブフォルダ 1 つです。たとえば、ID が `coolmod` の Mod のリソースパックには、おそらく `coolmod` 名前空間が含まれますが、`minecraft` など他の名前空間も含まれることがあります。

NeoForge は、すべての Mod のリソースパックを自動で `Mod resources` パックにまとめます。このパックは、リソースパックのメニューで、選択中のパックの一番下にあります。現在、`Mod resources` パックを無効にすることはできません。ただし、`Mod resources` パックより上にあるリソースパックは、その下にあるリソースパックで定義されたリソースを上書きします。この仕組みにより、リソースパックの制作者は Mod のリソースを上書きでき、Mod 開発者も必要に応じて Minecraft のリソースを上書きできます。

リソースパックには、[モデル][models]、[ブロックステートファイル][bsfile]、[テクスチャ][textures]、[サウンド][sounds]、[パーティクルの定義][particles]、[翻訳ファイル][translations]を含められます。

## データ {#data}

_関連項目: [Minecraft Wiki][mcwiki] の[データパック][mcwikidatapacks]_

アセットと対照的に、データはすべての[サーバー][sides]用リソースを指す用語です。リソースパックと同様に、データはデータパック( Datapack )を通じて読み込まれます。リソースパックと同じく、データパックは [`pack.mcmeta` ファイル][packmcmeta]と、`data` という名前のルートフォルダからなります。そして、これもリソースパックと同じく、`data` フォルダには、リソースパックが含む名前空間ごとにサブフォルダがあり、名前空間 1 つがサブフォルダ 1 つです。たとえば、ID が `coolmod` の Mod のデータパックには、おそらく `coolmod` 名前空間が含まれますが、`minecraft` など他の名前空間も含まれることがあります。

NeoForge は、新しいワールドの作成時に、すべての Mod のデータパックを自動で適用します。現在、Mod のデータパックを無効にすることはできません。ただし、ほとんどのデータファイルは、優先度の高いデータパックで上書きできます( つまり、空のファイルに置き換えることで削除できます )。追加のデータパックは、ワールドの `datapacks` サブフォルダに置き、[`/datapack`][datapackcmd] コマンドで有効・無効を切り替えられます。

:::info
現在、独自のデータパックの組をすべてのワールドに適用する組み込みの方法はありません。ただし、これを実現する Mod はいくつかあります。
:::

データパックには、次のものに影響するファイルを入れたフォルダを含められます。

| フォルダ名                                                                       | 内容                     |
|-----------------------------------------------------------------------------------|------------------------------|
| `advancement`                                                                     | [進捗][advancements] |
| `damage_type`                                                                     | [ダメージタイプ][damagetypes]  |
| `loot_table`                                                                      | [ルートテーブル][loottables]    |
| `recipe`                                                                          | [レシピ][recipes]           |
| `tags`                                                                            | [タグ][tags]                 |
| `neoforge/data_maps`                                                              | [データマップ][datamap]         |
| `neoforge/loot_modifiers`                                                         | [グローバルルートモディファイア][glm] |
| `dimension`, `dimension_type`, `structure`, `worldgen`, `neoforge/biome_modifier` | worldgen のファイル               |

さらに、コマンドと連携するいくつかの仕組みのためのサブフォルダも含められます。これらの仕組みが Mod と組み合わせて使われることはまれですが、いずれにせよ挙げておきます。

| フォルダ名     | 内容                       |
|-----------------|--------------------------------|
| `chat_type`     | [チャットの種類][chattype]         |
| `function`      | [関数][function]          |
| `item_modifier` | [アイテムモディファイア][itemmodifier] |
| `predicate`     | [プレディケート][predicate]        |

## `pack.mcmeta`

_関連項目: [Minecraft Wiki][mcwiki] の [`pack.mcmeta`( リソースパック )][packmcmetaresourcepack]と [`pack.mcmeta`( データパック )][packmcmetadatapack]_

`pack.mcmeta` ファイルは、リソースパックやデータパックのメタデータを保持します。Mod の場合、`pack.mcmeta` は自動で生成されるため、NeoForge によってこのファイルは不要になっています。それでも `pack.mcmeta` ファイルが必要な場合は、リンク先の Minecraft Wiki の記事に完全な仕様があります。

## データ生成 {#data-generation}

データ生成( 通称 datagen )は、JSON のリソースファイルをプログラムで生成する方法で、手で書く面倒で間違いやすい作業を避けるためのものです。名前は少し紛らわしく、データだけでなくアセットにも使えます。

データ生成は Data の実行構成で実行します。この実行構成は、Client と Server の実行構成とともに自動で生成されます。Data の実行構成は、Registry の Event が発火された後までは [Mod のライフサイクル][lifecycle]に従います。その後、[`GatherDataEvent`][event] を発火します。この Event の中で、生成したいオブジェクトをデータプロバイダの形で登録できます。そして、それらのオブジェクトをディスクに書き出して、処理を終了します。

すべてのデータプロバイダは `DataProvider` インターフェースを継承しており、通常は 1 つのメソッドをオーバーライドする必要があります。以下は、Minecraft と NeoForge が提供する主なデータジェネレーターの一覧です( リンク先の記事には、ヘルパーメソッドなどの詳しい情報があります )。

| クラス                                                | メソッド                           | 生成するもの                                                               | Side   | 備考                                                                                                           |
|------------------------------------------------------|----------------------------------|-------------------------------------------------------------------------|--------|-----------------------------------------------------------------------------------------------------------------|
| [`BlockStateProvider`][blockstateprovider]           | `registerStatesAndModels()`      | ブロックステートファイル、ブロックモデル                                          | Client |                                                                                                                 |
| [`ItemModelProvider`][itemmodelprovider]             | `registerModels()`               | アイテムモデル                                                             | Client |                                                                                                                 |
| [`LanguageProvider`][langprovider]                   | `addTranslations()`              | 翻訳                                                            | Client | コンストラクタで言語も渡す必要があります。                                                          |
| [`ParticleDescriptionProvider`][particleprovider]    | `addDescriptions()`              | パーティクルの定義                                                    | Client |                                                                                                                 |
| [`SoundDefinitionsProvider`][soundprovider]          | `registerSounds()`               | サウンドの定義                                                       | Client |                                                                                                                 |
| `SpriteSourceProvider`                               | `gather()`                       | スプライトソース / アトラス                                                | Client |                                                                                                                 |
| [`AdvancementProvider`][advancementprovider]         | `generate()`                     | 進捗                                                            | Server | Minecraft のものではなく、NeoForge 版を使ってください。                                                   |
| [`LootTableProvider`][loottableprovider]             | `generate()`                     | ルートテーブル                                                             | Server | 正しく動作させるには追加のメソッドとクラスが必要です。詳しくはリンク先の記事を参照してください。                            |
| [`RecipeProvider`][recipeprovider]                   | `buildRecipes(RecipeOutput)`     | レシピ                                                                 | Server |                                                                                                                 |
| [`TagsProvider` の各種サブクラス][tagsprovider] | `addTags(HolderLookup.Provider)` | タグ                                                                    | Server | 特化したサブクラスがいくつかあります。詳しくはリンク先の記事を参照してください。                                           |
| [`DataMapProvider`][datamapprovider]                 | `gather()`                       | データマップのエントリ                                                        | Server |                                                                                                                 |
| [`GlobalLootModifierProvider`][glmprovider]          | `start()`                        | グローバルルートモディファイア                                                   | Server |                                                                                                                 |
| [`DatapackBuiltinEntriesProvider`][datapackprovider] | N/A                              | Datapack の組み込みエントリ( 例: worldgen や[ダメージタイプ][damagetypes] ) | Server | メソッドのオーバーライドはなく、代わりにコンストラクタ内のラムダでエントリを追加します。詳しくはリンク先の記事を参照してください。 |
| `JsonCodecProvider`( 抽象クラス )                 | `gather()`                       | Codec を持つオブジェクト                                                    | Both   | データをエンコードする [Codec][codec] を持つ任意のオブジェクトに使えるよう、継承して使えます。                              |

これらのプロバイダは、どれも同じパターンに従います。まず、サブクラスを作り、生成したい独自のリソースを追加します。次に、[Event ハンドラ][eventhandler]でプロバイダを Event に追加します。`RecipeProvider` を使った例を示します。

```java
public class MyRecipeProvider extends RecipeProvider {
    public MyRecipeProvider(PackOutput output, CompletableFuture<HolderLookup.Provider> lookupProvider) {
        super(output, lookupProvider);
    }

    @Override
    protected void buildRecipes(RecipeOutput output) {
        // Register your recipes here.
    }
}

// In some event handler class
@SubscribeEvent // on the mod event bus
public static void gatherData(GatherDataEvent event) {
    // Data generators may require some of these as constructor parameters.
    // See below for more details on each of these.
    DataGenerator generator = event.getGenerator();
    PackOutput output = generator.getPackOutput();
    ExistingFileHelper existingFileHelper = event.getExistingFileHelper();
    CompletableFuture<HolderLookup.Provider> lookupProvider = event.getLookupProvider();

    // Register the provider.
    generator.addProvider(
            // A boolean that determines whether the data should actually be generated.
            // The event provides methods that determine this:
            // event.includeClient(), event.includeServer(),
            // event.includeDev() and event.includeReports().
            // Since recipes are server data, we only run them in a server datagen.
            event.includeServer(),
            // Our provider.
            new MyRecipeProvider(output, lookupProvider)
    );
    // Other data providers here.
}
```

この Event は、使えるコンテキストをいくつか提供します。

- `event.getGenerator()` は、プロバイダを登録する `DataGenerator` を返します。
- `event.getPackOutput()` は、一部のプロバイダがファイルの出力先を決めるのに使う `PackOutput` を返します。
- `event.getExistingFileHelper()` は、他のファイルを参照できるもの( たとえば、親ファイルを指定できるブロックモデル )のためにプロバイダが使う `ExistingFileHelper` を返します。
- `event.getLookupProvider()` は `CompletableFuture<HolderLookup.Provider>` を返します。これは主に、タグやデータ生成の Registry が、まだ存在しないかもしれない他の要素を参照するのに使います。
- `event.includeClient()`、`event.includeServer()`、`event.includeDev()`、`event.includeReports()` は `boolean` のメソッドで、特定のコマンドライン引数( 後述 )が有効かどうかを確認できます。

### コマンドライン引数 {#command-line-arguments}

データジェネレーターは、いくつかのコマンドライン引数を受け付けます。

- `--mod examplemod`: この Mod のデータ生成を実行するよう指示します。プロジェクトを所有する Mod の ID は NeoGradle が自動で追加します。1 つのプロジェクトに複数の Mod がある場合などは、これを追加してください。
- `--output path/to/folder`: 指定したフォルダに出力するよう指示します。Gradle の `file(...).getAbsolutePath()` を使って絶対パスを生成することをおすすめします( パスはプロジェクトのルートディレクトリからの相対パスで指定します )。デフォルトは `file('src/generated/resources').getAbsolutePath()` です。
- `--existing path/to/folder`: 既存のファイルを確認するときに、指定したフォルダも考慮するよう指示します。出力と同様に、Gradle の `file(...).getAbsolutePath()` を使うことをおすすめします。
- `--existing-mod examplemod`: 既存のファイルを確認するときに、指定した Mod の JAR ファイル内のリソースも考慮するよう指示します。
- ジェネレーターのモード( いずれも真偽値の引数で、追加の引数は不要です ):
    - `--includeClient`: クライアントのリソース( アセット )を生成するかどうか。実行時に `GatherDataEvent#includeClient()` で確認できます。
    - `--includeServer`: サーバーのリソース( データ )を生成するかどうか。実行時に `GatherDataEvent#includeServer()` で確認できます。
    - `--includeDev`: 開発用ツールを実行するかどうか。一般に Mod では使うべきではありません。実行時に `GatherDataEvent#includeDev()` で確認できます。
    - `--includeReports`: 登録済みのオブジェクトの一覧を出力するかどうか。実行時に `GatherDataEvent#includeReports()` で確認できます。
    - `--all`: すべてのジェネレーターのモードを有効にします。

すべての引数は、`build.gradle` に次のように書くことで、実行構成に追加できます。

```groovy
runs {
    // other run configurations here

    data {
        programArguments.addAll '--arg1', 'value1', '--arg2', 'value2', '--all' // boolean args have no value
    }
}
```

たとえば、デフォルトの引数を再現するには、次のように指定できます。

```groovy
runs {
    // other run configurations here

    data {
        programArguments.addAll '--mod', 'examplemod', // insert your own mod id
                '--output', file('src/generated/resources').getAbsolutePath(),
                '--includeClient',
                '--includeServer'
    }
}
```

[advancementprovider]: server/advancements.md#data-generation
[advancements]: server/advancements.md
[blockstateprovider]: client/models/datagen.md#block-model-datagen
[bsfile]: client/models/index.md#blockstate-files
[chattype]: https://minecraft.wiki/w/Chat_type
[codec]: ../datastorage/codecs.md
[damagetypes]: server/damagetypes.md
[datamap]: server/datamaps/index.md
[datamapprovider]: server/datamaps/index.md#data-generation
[datapackcmd]: https://minecraft.wiki/w/Commands/datapack
[datapackprovider]: ../concepts/registries.md#data-generation-for-datapack-registries
[event]: ../concepts/events.md
[eventhandler]: ../concepts/events.md#registering-an-event-handler
[function]: https://minecraft.wiki/w/Function_(Java_Edition)
[glm]: server/loottables/glm.md
[glmprovider]: server/loottables/glm.md#datagen
[itemmodelprovider]: client/models/datagen.md#item-model-datagen
[itemmodifier]: https://minecraft.wiki/w/Item_modifier
[langprovider]: client/i18n.md#datagen
[lifecycle]: ../concepts/events.md#the-mod-lifecycle
[logicalsides]: ../concepts/sides.md#the-logical-side
[loottableprovider]: server/loottables/index.md#datagen
[loottables]: server/loottables/index.md
[mcwiki]: https://minecraft.wiki
[mcwikidatapacks]: https://minecraft.wiki/w/Data_pack
[mcwikiresourcepacks]: https://minecraft.wiki/w/Resource_pack
[models]: client/models/index.md
[packmcmeta]: #packmcmeta
[packmcmetadatapack]: https://minecraft.wiki/w/Data_pack#pack.mcmeta
[packmcmetaresourcepack]: https://minecraft.wiki/w/Resource_pack#Contents
[particleprovider]: client/particles.md#datagen
[particles]: client/particles.md
[predicate]: https://minecraft.wiki/w/Predicate
[recipeprovider]: server/recipes/index.md#data-generation
[recipes]: server/recipes/index.md
[sides]: ../concepts/sides.md
[soundprovider]: client/sounds.md#datagen
[sounds]: client/sounds.md
[tags]: server/tags.md
[tagsprovider]: server/tags.md#datagen
[textures]: client/textures.md
[translations]: client/i18n.md#language-files
