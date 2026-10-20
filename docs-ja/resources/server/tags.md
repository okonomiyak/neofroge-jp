# タグ {#tags}

タグとは、簡単に言えば、同じ型の登録済みオブジェクトのリストです。データファイルから読み込まれ、あるオブジェクトが含まれているかのチェックに使えます。たとえば、棒のクラフトでは、木材( `minecraft:planks` のタグが付いた Item )をどんな組み合わせでも受け付けます。タグは、`#` を接頭辞に付けることで「通常の」オブジェクトと区別されることがよくあります( 例: `#minecraft:planks` に対して `minecraft:oak_planks` )。

どの [Registry][registry] でもタグファイルを持てます。最もよく使われるのは Block と Item ですが、液体、エンティティタイプ、ダメージタイプなど、他の Registry でもタグがよく使われます。必要であれば、独自のタグを作ることもできます。

タグは、Minecraft の Registry では `data/<tag_namespace>/tags/<registry_path>/<tag_path>.json` に、Minecraft 以外の Registry では `data/<tag_namespace>/tags/<registry_namespace>/<registry_path>/<tag_path>.json` に置きます。たとえば、`minecraft:planks` のアイテムタグを変更するには、タグファイルを `data/minecraft/tags/item/planks.json` に置きます。

:::info
NeoForge の他のほとんどのデータファイルと異なり、NeoForge が追加するタグは、一般に `neoforge` 名前空間を使いません。代わりに、`c` 名前空間を使います( 例: `c:ingots/gold` )。これは、複数のローダー向けに開発している多くの Mod 開発者の要望を受けて、NeoForge と Fabric の Mod ローダーの間でタグを統一しているためです。

このルールには、NeoForge の仕組みと密接に結び付いた一部のタグについて、いくつか例外があります。たとえば、多くの[ダメージタイプ][damagetype]のタグがこれに当たります。
:::

タグファイルの上書きは、一般に置き換えではなく追加になります。つまり、2 つの Datapack が同じ ID のタグファイルを指定すると、( 特に指定がない限り )両方のファイルの中身がマージされます。この動作は、既存の値をすべて置き換える他のほとんどのデータファイルとは異なる、タグならではの特徴です。

## タグファイルの形式 {#tag-file-format}

タグファイルの構文は次のとおりです。

```json5
{
    // The values of the tag.
    "values": [
        // A value object. Must specify the id of the object to add, and whether it is required.
        // If the entry is required, but the object is not present, the tag will not load. The "required" field
        // is technically optional, but when removed, the entry is equivalent to the shorthand below.
        {
            "id": "examplemod:example_ingot",
            "required": false
        }
        // Shorthand for {"id": "minecraft:gold_ingot", "required": true}, i.e. a required entry.
        "minecraft:gold_ingot",
        // A tag object. Distinguished from regular entries by the leading #. In this case, all planks
        // will be considered entries of the tag. Like normal entries, this can also have the "id"/"required" format.
        // Warning: Circular tag dependencies will lead to a datapack not being loaded!
        "#minecraft:planks"
    ],
    // Whether to remove all pre-existing entries before adding your own (true) or just add your own (false).
    // This should generally be false, the option to set this to true is primarily aimed at pack developers.
    "replace": false,
    // A finer-grained way to remove entries from the tag again, if present. Optional, NeoForge-added.
    // Entry syntax is the same as in the "values" array.
    "remove": [
        "minecraft:iron_ingot"
    ]
}
```

## タグの探し方と名前の付け方 {#finding-and-naming-tags}

既存のタグを探すときは、一般に次の手順に従うことをおすすめします。

- Minecraft のタグを見て、探しているタグがあるか確認します。Minecraft のタグは `BlockTags`、`ItemTags`、`EntityTypeTags` などにあります。
- なければ、NeoForge のタグを見て、探しているタグがあるか確認します。NeoForge のタグは `Tags.Blocks`、`Tags.Items`、`Tags.EntityTypes` などにあります。
- それでもなければ、そのタグは Minecraft にも NeoForge にも定義されていないとみなし、独自のタグを作る必要があります。

独自のタグを作るときは、次のことを自問してください。

- これは自分の Mod の動作を変えるものか。そうであれば、タグは自分の Mod の名前空間に置くべきです( たとえば「自分のものがこの Block の上にスポーンできる」といった種類のタグでよくあります )。
- 他の Mod もこのタグを使いたいと思うか。そうであれば、タグは `c` 名前空間に置くべきです( たとえば新しい金属や宝石でよくあります )。
- それ以外の場合は、自分の Mod の名前空間を使います。

タグ自体の名前の付け方にも、従うべき慣例がいくつかあります。

- 複数形を使う。例: `minecraft:planks`、`c:ingots`。
- 同じ種類の複数のオブジェクトにはフォルダを使い、フォルダごとに全体のタグを用意する。例: `c:ingots/iron`、`c:ingots/gold`、そして両方を含む `c:ingots`。( 注: これは NeoForge の慣例で、Minecraft のほとんどのタグはこの慣例に従っていません。 )

## タグの使用 {#using-tags}

コードでタグを参照するには、[Registry キー][regkey]と[リソースロケーション][resloc]を使って `TagKey<T>` を作成する必要があります。`T` はタグの型( `Block`、`Item`、`EntityType<?>` など )です。

```java
public static final TagKey<Block> MY_TAG = TagKey.create(
        // The registry key. The type of the registry must match the generic type of the tag.
        Registries.BLOCK,
        // The location of the tag. This example will put our tag at data/examplemod/tags/blocks/example_tag.json.
        ResourceLocation.fromNamespaceAndPath("examplemod", "example_tag")
);
```

:::warning
`TagKey` は record なので、コンストラクタは public です。ただし、タグのエントリを検索するときなどにさまざまな問題を引き起こすことがあるため、コンストラクタを直接使うべきではありません。
:::

これで、タグを使ってさまざまな操作を行えます。まずは最もわかりやすいものから始めましょう。オブジェクトがタグに含まれているかのチェックです。以下の例はブロックタグを前提としていますが、( 特に指定がない限り )機能はどの種類のタグでもまったく同じです。

```java
// Check whether dirt is in our tag.
boolean isInTag = BuiltInRegistries.BLOCK.getOrCreateTag(MY_TAG).stream().anyMatch(e -> e == Items.DIRT);
```

これは、特に何度も使う場合、とても冗長な書き方です。そのため、タグの仕組みを最もよく使う `BlockState` と `ItemStack` には、それぞれ `#is` ヘルパーメソッドが定義されており、次のように使えます。

```java
// Check whether the blockState's block is in our tag.
boolean isInBlockTag = blockState.is(MY_TAG);
// Check whether the itemStack's item is in our tag. Assumes the existence of MY_ITEM_TAG as a TagKey<Item>.
boolean isInItemTag = itemStack.is(MY_ITEM_TAG);
```

必要であれば、次のようにタグのエントリのストリームを取得することもできます。

```java
Stream<Block> blocksInTag = BuiltInRegistries.BLOCK.getOrCreateTag(MY_TAG).stream();
```

パフォーマンスのため、これらのタグのエントリはフィールドにキャッシュし、タグが再読み込みされたときに無効化することをおすすめします( 再読み込みは `TagsUpdatedEvent` で listen できます )。これは次のように行えます。

```java
public class MyTagsCacheClass {
    private static Set<Block> blocksInTag = null;

    public static Set<Block> getBlockTagContents() {
        if (blocksInTag == null) {
            // Wrap as an unmodifiable set, as we're not supposed to modify this anyway
            blocksInTag = Collections.unmodifiableSet(BuiltInRegistries.BLOCK.getOrCreateTag(MY_TAG).stream().collect(Collectors.toSet()));
        }
        return blocksInTag;
    }
    
    public static void invalidateCache() {
        blocksInTag = null;
    }
}

// In some event handler class
@SubscribeEvent // on the game event bus
public static void onTagsUpdated(TagsUpdatedEvent event) {
    MyTagsCacheClass.invalidateCache();
}
```

## データ生成 {#datagen}

他の多くの JSON ファイルと同様に、タグも[データ生成][datagen]できます。タグの種類ごとに独自のデータ生成の基底クラス( ブロックタグ用、アイテムタグ用など )があるので、こちらもタグの種類ごとにクラスが 1 つ必要です。これらのクラスはすべて基底クラス `TagsProvider<T>` を継承しており、`T` はここでもタグの型( `Block`、`Item` など )です。次の表は、さまざまなオブジェクトのタグプロバイダの一覧です。

| 型                       | タグプロバイダのクラス                     |
|----------------------------|----------------------------------------|
| `BannerPattern`            | `BannerPatternTagsProvider`            |
| `Biome`                    | `BiomeTagsProvider`                    |
| `Block`                    | `BlockTagsProvider`                    |
| `CatVariant`               | `CatVariantTagsProvider`               |
| `DamageType`               | `DamageTypeTagsProvider`               |
| `Enchantment`              | `EnchantmentTagsProvider`              |
| `EntityType`               | `EntityTypeTagsProvider`               |
| `FlatLevelGeneratorPreset` | `FlatLevelGeneratorPresetTagsProvider` |
| `Fluid`                    | `FluidTagsProvider`                    |
| `GameEvent`                | `GameEventTagsProvider`                |
| `Instrument`               | `InstrumentTagsProvider`               |
| `Item`                     | `ItemTagsProvider`                     |
| `PaintingVariant`          | `PaintingVariantTagsProvider`          |
| `PoiType`                  | `PoiTypeTagsProvider`                  |
| `Structure`                | `StructureTagsProvider`                |
| `WorldPreset`              | `WorldPresetTagsProvider`              |

注目すべきは `IntrinsicHolderTagsProvider<T>` クラスです。これは `TagsProvider<T>` のサブクラスで、`BlockTagsProvider`、`ItemTagsProvider`、`FluidTagsProvider`、`EntityTypeTagsProvider`、`GameEventTagsProvider` の共通の親クラスです。これらのクラス( 以降、簡単のため intrinsic プロバイダと呼びます )には、生成のための追加の機能があり、これからそれを説明します。

例として、ブロックタグを生成したいとします( 他のクラスも、それぞれのタグの型で同じように機能します )。

```java
public class MyBlockTagsProvider extends BlockTagsProvider {
    // Get parameters from GatherDataEvent.
    public MyBlockTagsProvider(PackOutput output, CompletableFuture<HolderLookup.Provider> lookupProvider, ExistingFileHelper existingFileHelper) {
        super(output, lookupProvider, ExampleMod.MOD_ID, existingFileHelper);
    }

    // Add your tag entries here.
    @Override
    protected void addTags(HolderLookup.Provider lookupProvider) {
        // Create a tag builder for our tag. This could also be e.g. a vanilla or NeoForge tag.
        tag(MY_TAG)
                // Add entries. This is a vararg parameter.
                // Non-intrinsic providers must provide ResourceKeys here instead of the actual objects.
                .add(Blocks.DIRT, Blocks.COBBLESTONE)
                // Add optional entries that will be ignored if absent. This example uses Botania's Pure Daisy.
                // Unlike #add, this is not a vararg parameter.
                .addOptional(ResourceLocation.fromNamespaceAndPath("botania", "pure_daisy"))
                // Add a tag entry.
                .addTag(BlockTags.PLANKS)
                // Add multiple tag entries. This is a vararg parameter.
                // Can cause unchecked warnings that can safely be suppressed.
                .addTags(BlockTags.LOGS, BlockTags.WOODEN_SLABS)
                // Add an optional tag entry that will be ignored if absent.
                .addOptionalTag(ResourceLocation.fromNamespaceAndPath("c", "ingots/tin"))
                // Add multiple optional tag entries. This is a vararg parameter.
                // Can cause unchecked warnings that can safely be suppressed.
                .addOptionalTags(ResourceLocation.fromNamespaceAndPath("c", "nuggets/tin"), ResourceLocation.fromNamespaceAndPath("c", "storage_blocks/tin"))
                // Set the replace property to true.
                .replace()
                // Set the replace property back to false.
                .replace(false)
                // Remove entries. This is a vararg parameter. Accepts either resource locations, resource keys,
                // tag keys, or (intrinsic providers only) direct values.
                // Can cause unchecked warnings that can safely be suppressed.
                .remove(ResourceLocation.fromNamespaceAndPath("minecraft", "crimson_slab"), ResourceLocation.fromNamespaceAndPath("minecraft", "warped_slab"));
    }
}
```

この例からは、次のタグの JSON ができます。

```json5
{
    "values": [
        "minecraft:dirt",
        "minecraft:cobblestone",
        {
            "id": "botania:pure_daisy",
            "required": false
        },
        "#minecraft:planks",
        "#minecraft:logs",
        "#minecraft:wooden_slabs",
        {
            "id": "c:ingots/tin",
            "required": false
        },
        {
            "id": "c:nuggets/tin",
            "required": false
        },
        {
            "id": "c:storage_blocks/tin",
            "required": false
        }
    ],
    "remove": [
        "minecraft:crimson_slab",
        "minecraft:warped_slab"
    ]
}
```

他のデータプロバイダと同様に、各タグプロバイダを `GatherDataEvent` に追加します。

```java
@SubscribeEvent // on the mod event bus
public static void gatherData(GatherDataEvent event) {
    PackOutput output = generator.getPackOutput();
    CompletableFuture<HolderLookup.Provider> lookupProvider = event.getLookupProvider();
    ExistingFileHelper existingFileHelper = event.getExistingFileHelper();

    // other providers here
    event.getGenerator().addProvider(
        event.includeServer(),
        new MyBlockTagsProvider(output, lookupProvider, existingFileHelper)
    );
}
```

`ItemTagsProvider` には、`#copy` という追加のヘルパーメソッドがあります。これは、アイテムタグがブロックタグをそのまま反映するという、よくある用途を想定したものです。

```java
// In an ItemTagsProvider's #addTags method, assuming types TagKey<Block> and TagKey<Item> for the two parameters.
copy(EXAMPLE_BLOCK_TAG, EXAMPLE_ITEM_TAG);
```

### カスタムのタグプロバイダ {#custom-tag-providers}

カスタムの [Registry][registry] や、デフォルトではタグプロバイダのないバニラや NeoForge の Registry のためにカスタムのタグプロバイダを作るには、次のようにします( レシピタイプのタグを例にします )。

```java
public class MyRecipeTypeTagsProvider extends TagsProvider<RecipeType<?>> {
    // Get parameters from GatherDataEvent.
    public MyRecipeTypeTagsProvider(PackOutput output, CompletableFuture<HolderLookup.Provider> lookupProvider, ExistingFileHelper existingFileHelper) {
        // Second parameter is the registry key we are generating the tags for.
        super(output, Registries.RECIPE_TYPE, lookupProvider, ExampleMod.MOD_ID, existingFileHelper);
    }
    
    @Override
    protected void addTags(HolderLookup.Provider lookupProvider) { /*...*/ }
}
```

望ましく、かつ当てはまる場合は、`TagsProvider<T>` の代わりに `IntrinsicHolderTagsProvider<T>` を継承することもできます。そうすると、リソースキーだけでなく、オブジェクトを直接渡せるようになります。その場合は、オブジェクトに対するリソースキーを返す関数の引数も必要です。属性のタグを例にします。

```java
public class MyAttributeTagsProvider extends TagsProvider<Attribute> {
    // Get parameters from GatherDataEvent.
    public MyAttributeTagsProvider(PackOutput output, CompletableFuture<HolderLookup.Provider> lookupProvider, ExistingFileHelper existingFileHelper) {
        super(output,
                Registries.ATTRIBUTE,
                lookupProvider,
                // A function that, given an Attribute, returns a ResourceKey<Attribute>.
                attribute -> BuiltInRegistries.ATTRIBUTE.getResourceKey(attribute).orElseThrow(),
                ExampleMod.MOD_ID,
                existingFileHelper);
    }

    // Attributes can now be used here directly, instead of just their resource keys.
    @Override
    protected void addTags(HolderLookup.Provider lookupProvider) { /*...*/ }
}
```

:::info
`TagsProvider` は `#getOrCreateRawBuilder` メソッドも公開しており、これは `TagBuilder` を返します。`TagBuilder` を使うと、タグに `ResourceLocation` をそのまま追加でき、場面によっては便利です。`TagsProvider#tag` が返す `TagsProvider.TagAppender<T>` クラスは、単に `TagBuilder` のラッパーです。
:::

[damagetype]: damagetypes.md
[datagen]: ../index.md#data-generation
[registry]: ../../concepts/registries.md
[regkey]: ../../misc/resourcelocation.md#resourcekeys
[resloc]: ../../misc/resourcelocation.md
