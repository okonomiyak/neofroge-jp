# モデルのデータ生成 {#model-datagen}

ほとんどの JSON データと同様に、ブロックモデルとアイテムモデルも[データ生成][datagen]できます。アイテムモデルとブロックモデルには共通する部分があるため、データ生成のコードにも共通する部分があります。

## モデルのデータ生成のクラス {#model-datagen-classes}

### `ModelBuilder`

どのモデルも、何らかの `ModelBuilder` から始まります。通常は、何を生成するかに応じて `BlockModelBuilder` か `ItemModelBuilder` です。ビルダーは、親、テクスチャ、要素、変換、ローダーなど、モデルのすべてのプロパティを持ちます。各プロパティは、メソッドで設定できます。

| メソッド                                             | 効果 |
|--------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `#texture(String key, ResourceLocation texture)` | 指定したキーとテクスチャの場所で、テクスチャ変数を追加します。2 つ目の引数が `String` のオーバーロードもあります。 |
| `#renderType(ResourceLocation renderType)`       | 描画タイプを設定します。引数が `String` のオーバーロードもあります。有効な値の一覧は、`RenderType` クラスを参照してください。 |
| `#ao(boolean ao)`                                | [アンビエントオクルージョン][ao]を使うかどうかを設定します。 |
| `#guiLight(GuiLight light)`                      | GUI の照明を設定します。`GuiLight.FRONT` または `GuiLight.SIDE` を指定できます。 |
| `#element()`                                     | 新しい `ElementBuilder` を追加します( モデルに新しい[要素][elements]を追加するのと同じです )。さらに変更できるよう、その `ElementBuilder` を返します。 |
| `#transforms()`                                  | ビルダーの `TransformVecBuilder` を返します。これは、モデルの `display` を設定するのに使います。 |
| `#customLoader(BiFunction customLoaderFactory)`  | 指定したファクトリを使い、このモデルが[カスタムローダー][custommodelloader]を、したがってカスタムローダーのビルダーを使うようにします。ビルダーの型が変わるため、ローダーの実装によっては異なるメソッドを使うことがあります。NeoForge には、すぐに使えるカスタムローダーがいくつか用意されています。詳しく( データ生成を含む )はリンク先の記事を参照してください。 |

:::tip
凝った複雑なモデルもデータ生成で作れますが、より複雑なモデルは [Blockbench][blockbench] などのモデリングソフトで作り、書き出したモデルを、そのまま、または他のモデルの親として使うことをおすすめします。
:::

### `ModelProvider`

ブロックモデルとアイテムモデルのデータ生成では、どちらも `ModelProvider` のサブクラスを使い、それぞれ `BlockModelProvider` と `ItemModelProvider` という名前です。アイテムモデルのデータ生成では `ItemModelProvider` を直接継承しますが、ブロックモデルのデータ生成では `BlockStateProvider` という基底クラスを使います。このクラスは内部に `BlockModelProvider` を持っており、`BlockStateProvider#models()` でアクセスできます。さらに、`BlockStateProvider` は独自の内部の `ItemModelProvider` も持っており、`BlockStateProvider#itemModels()` でアクセスできます。`ModelProvider` で最も重要なのは `getBuilder(String path)` メソッドで、指定した場所の `BlockModelBuilder`( または `ItemModelBuilder` )を返します。

ただし、`ModelProvider` にはさまざまなヘルパーメソッドもあります。おそらく最も重要なヘルパーメソッドは `withExistingParent(String name, ResourceLocation parent)` で、( `getBuilder(name)` で )新しいビルダーを返し、指定した `ResourceLocation` をモデルの親に設定します。他によく使われるヘルパーとして、名前空間を `minecraft`、パスを指定した名前にした `ResourceLocation` を返す `mcLoc(String name)` と、同じことを `minecraft` の代わりにプロバイダの Mod ID( 通常は自分の Mod ID )で行う `modLoc(String name)` の 2 つがあります。さらに、ハーフブロック、階段、フェンス、ドアなどのよくあるものについて、`#withExistingParent` のショートカットとなるさまざまなヘルパーメソッドがあります。

### `ModelFile`

最後の重要なクラスは `ModelFile` です。`ModelFile` は、ディスク上のモデルの JSON をコード上で表したものです。`ModelFile` は抽象クラスで、`ExistingModelFile` と `UncheckedModelFile` の 2 つの内部サブクラスがあります。`ExistingModelFile` は `ExistingFileHelper` を使って存在が確認されますが、`UncheckedModelFile` はそれ以上確認せずに存在するものとみなされます。また、`ModelBuilder` も `ModelFile` とみなされます。

## ブロックモデルのデータ生成 {#block-model-datagen}

では、実際にブロックステートファイルとブロックモデルファイルを生成するには、`BlockStateProvider` を継承し、`registerStatesAndModels()` メソッドをオーバーライドします。ブロックモデルは常に `models/block` サブフォルダに置かれますが、参照は `models` からの相対パスになる( つまり、常に `block/` を接頭辞に付ける必要がある )点に注意してください。ほとんどの場合は、用意されている多くのヘルパーメソッドの中から選ぶのが理にかなっています。

```java
public class MyBlockStateProvider extends BlockStateProvider {
    // Parameter values are provided by GatherDataEvent.
    public MyBlockStateProvider(PackOutput output, ExistingFileHelper existingFileHelper) {
        // Replace "examplemod" with your own mod id.
        super(output, "examplemod", existingFileHelper);
    }
    
    @Override
    protected void registerStatesAndModels() {
        // Placeholders, their usages should be replaced with real values. See above for how to use the model builder,
        // and below for the helpers the model builder offers.
        ModelFile exampleModel = models().withExistingParent("example_model", this.mcLoc("block/cobblestone"));
        Block block = MyBlocksClass.EXAMPLE_BLOCK.get();
        ResourceLocation exampleTexture = modLoc("block/example_texture");
        ResourceLocation bottomTexture = modLoc("block/example_texture_bottom");
        ResourceLocation topTexture = modLoc("block/example_texture_top");
        ResourceLocation sideTexture = modLoc("block/example_texture_front");
        ResourceLocation frontTexture = modLoc("block/example_texture_front");

        // Create a simple block model with the same texture on each side.
        // The texture must be located at assets/<namespace>/textures/block/<path>.png, where
        // <namespace> and <path> are the block's registry name's namespace and path, respectively.
        // Used by the majority of (full) blocks, such as planks, cobblestone or bricks.
        simpleBlock(block);
        // Overload that accepts a model file to use.
        simpleBlock(block, exampleModel);
        // Overload that accepts one or multiple (vararg) ConfiguredModel objects.
        // See below for more info about ConfiguredModel.
        simpleBlock(block, ConfiguredModel.builder().build());
        // Adds an item model file with the block's name, parenting the given model file, for a block item to pick up.
        simpleBlockItem(block, exampleModel);
        // Shorthand for calling #simpleBlock() (model file overload) and #simpleBlockItem.
        simpleBlockWithItem(block, exampleModel);
        
        // Adds a log block model. Requires two textures at assets/<namespace>/textures/block/<path>.png and
        // assets/<namespace>/textures/block/<path>_top.png, referencing the side and top texture, respectively.
        // Note that the block input here is limited to RotatedPillarBlock, which is the class vanilla logs use.
        logBlock(block);
        // Like #logBlock, but the textures are named <path>_side.png and <path>_end.png instead of
        // <path>.png and <path>_top.png, respectively. Used by quartz pillars and similar blocks.
        // Has an overload that allow you to specify a different texture base name, that is then suffixed
        // with _side and _end as needed, an overload that allows you to specify two resource locations
        // for the side and end textures, and an overload that allows specifying side and end model files.
        axisBlock(block);
        // Variants of #logBlock and #axisBlock that additionally allow for render types to be specified.
        // Comes in string and resource location variants for the render type,
        // in all combinations with all variants of #logBlock and #axisBlock.
        logBlockWithRenderType(block, "minecraft:cutout");
        axisBlockWithRenderType(block, mcLoc("cutout_mipped"));
        
        // Specifies a horizontally-rotatable block model with a side texture, a front texture, and a top texture.
        // The bottom will use the side texture as well. If you don't need the front or top texture,
        // just pass in the side texture twice. Used by e.g. furnaces and similar blocks.
        horizontalBlock(block, sideTexture, frontTexture, topTexture);
        // Specifies a horizontally-rotatable block model with a model file that will be rotated as needed.
        // Has an overload that instead of a model file accepts a Function<BlockState, ModelFile>,
        // allowing for different rotations to use different models. Used e.g. by the stonecutter.
        horizontalBlock(block, exampleModel);
        // Specifies a horizontally-rotatable block model that is attached to a face, e.g. for buttons or levers.
        // Accounts for placing the block on the ground and on the ceiling, and rotates them accordingly.
        // Like #horizontalBlock, has an overload that accepts a Function<BlockState, ModelFile> instead.
        horizontalFaceBlock(block, exampleModel);
        // Similar to #horizontalBlock, but for blocks that are rotatable in all directions, including up and down.
        // Again, has an overload that accepts a Function<BlockState, ModelFile> instead.
        directionalBlock(block, exampleModel);
    }
}
```

さらに、`BlockStateProvider` には、次のよくあるブロックモデル用のヘルパーもあります。

- 階段
- ハーフブロック
- ボタン
- 感圧板
- 看板
- フェンス
- フェンスゲート
- 塀
- 板ガラス
- ドア
- トラップドア

ブロックステートには特別な場合分けが不要でも、モデルには必要な場合があります。その場合のために、`BlockStateProvider#models()` でアクセスできる `BlockModelProvider` には、いくつかの追加のヘルパーがあります。どれも最初の引数に名前を受け取り、ほとんどは何らかの形で完全な立方体に関係しています。これらは通常、`simpleBlock` などのモデルファイルの引数として使われます。ヘルパーには、`BlockStateProvider` のヘルパーを支えるメソッドのほか、次のものがあります。

- `withExistingParent`: 前述のとおり、このメソッドは、指定した親を持つ新しいモデルビルダーを返します。親は、すでに存在するか、モデルより先に作成されている必要があります。
- `getExistingFile`: モデルプロバイダの `ExistingFileHelper` で検索を行い、対応する `ModelFile` があればそれを返し、なければ `IllegalStateException` をスローします。
- `singleTexture`: 親と 1 つのテクスチャの場所を受け取り、指定した親を持ち、テクスチャ変数 `texture` を指定したテクスチャの場所に設定したモデルを返します。
- `sideBottomTop`: 親と 3 つのテクスチャの場所を受け取り、指定した親を持ち、側面・底面・上面のテクスチャをその 3 つのテクスチャの場所に設定したモデルを返します。
- `cube`: 6 面分の 6 つのテクスチャのリソースロケーションを受け取り、6 面をその 6 つのテクスチャに設定した完全な立方体のモデルを返します。
- `cubeAll`: テクスチャの場所を 1 つ受け取り、6 面すべてにそのテクスチャを適用した完全な立方体のモデルを返します。言うなれば、`singleTexture` と `cube` の中間です。
- `cubeTop`: 2 つのテクスチャの場所を受け取り、1 つ目のテクスチャを側面と底面に、2 つ目のテクスチャを上面に適用した完全な立方体のモデルを返します。
- `cubeBottomTop`: 3 つのテクスチャの場所を受け取り、側面・底面・上面のテクスチャをその 3 つのテクスチャの場所に設定した完全な立方体のモデルを返します。言うなれば、`cube` と `sideBottomTop` の中間です。
- `cubeColumn` と `cubeColumnHorizontal`: 2 つのテクスチャの場所を受け取り、側面と端面のテクスチャをその 2 つのテクスチャの場所に設定した、「立てた」または「寝かせた」柱の立方体のモデルを返します。`BlockStateProvider#logBlock`、`BlockStateProvider#axisBlock` とその派生版で使われています。
- `orientable`: 3 つのテクスチャの場所を受け取り、「正面」のテクスチャを持つ立方体を返します。3 つのテクスチャの場所は、それぞれ側面、正面、上面のテクスチャです。
- `orientableVertical`: `orientable` の派生版で、上面の引数を省き、代わりに側面の引数を使います。
- `orientableWithBottom`: `orientable` の派生版で、正面と上面の引数の間に、底面のテクスチャ用の 4 つ目の引数があります。
- `crop`: テクスチャの場所を受け取り、そのテクスチャを使った作物のようなモデルを返します。バニラの 4 つの作物で使われています。
- `cross`: テクスチャの場所を受け取り、そのテクスチャを使った交差( cross )のモデルを返します。花、苗木、その他多くの草木の Block で使われています。
- `torch`: テクスチャの場所を受け取り、そのテクスチャを使った松明のモデルを返します。
- `wall_torch`: テクスチャの場所を受け取り、そのテクスチャを使った壁の松明のモデルを返します( 壁の松明は、立てた松明とは別の Block です )。
- `carpet`: テクスチャの場所を受け取り、そのテクスチャを使ったカーペットのモデルを返します。

最後に、ブロックステートのプロバイダを Event に登録するのを忘れないでください。

```java
@SubscribeEvent // on the mod event bus
public static void gatherData(GatherDataEvent event) {
    DataGenerator generator = event.getGenerator();
    PackOutput output = generator.getPackOutput();
    ExistingFileHelper existingFileHelper = event.getExistingFileHelper();

    // other providers here
    generator.addProvider(
        event.includeClient(),
        new MyBlockStateProvider(output, existingFileHelper)
    );
}
```

### `ConfiguredModel.Builder`

デフォルトのヘルパーでは足りない場合は、`ConfiguredModel.Builder` を使ってモデルのオブジェクトを直接構築することもできます。そのうえで、それを `VariantBlockStateBuilder` で使って `variants` のブロックステートファイルを、または `MultiPartBlockStateBuilder` で使って `multipart` のブロックステートファイルを構築できます。

```java
// Create a ConfiguredModel.Builder. Alternatively, you can use one of the ways demonstrated below
// (VariantBlockStateBuilder.PartialBlockstate#modelForState or MultiPartBlockStateBuilder#part) where applicable.
ConfiguredModel.Builder<?> builder = ConfiguredModel.builder()
// Use a model file. As mentioned previously, can either be an ExistingModelFile, an UncheckedModelFile,
// or some sort of ModelBuilder. See above for how to use ModelBuilder.
        .modelFile(models().withExistingParent("example_model", this.mcLoc("block/cobblestone")))
        // Set rotations around the x and y axes.
        .rotationX(90)
        .rotationY(180)
        // Set a uvlock.
        .uvlock(true)
        // Set a weight.
        .weight(5);
// Build the configured model. The return type is an array
// to account for multiple possible models in the same blockstate.
ConfiguredModel[] model = builder.build();

// Get a variant block state builder.
VariantBlockStateBuilder variantBuilder = getVariantBuilder(MyBlocksClass.EXAMPLE_BLOCK.get());
// Create a partial state and set properties on it.
VariantBlockStateBuilder.PartialBlockstate partialState = variantBuilder.partialState();
// Add one or multiple models for a partial blockstate. The models are a vararg parameter.
variantBuilder.addModels(partialState,
    // Specify at least one ConfiguredModel.Builder, as seen above. Create through #modelForState().
    partialState.modelForState()
        .modelFile(models().withExistingParent("example_variant_model", this.mcLoc("block/cobblestone")))
        .uvlock(true)
);
// Alternatively, forAllStates(Function<BlockState, ConfiguredModel[]>) creates a model for every state.
// The passed function will be called once for each possible state.
variantBuilder.forAllStates(state -> {
    // Return a ConfiguredModel depending on the state's properties.
    // For example, the following code will rotate the model depending on the horizontal rotation of the block.
    return ConfiguredModel.builder()
        .modelFile(models().withExistingParent("example_variant_model", this.mcLoc("block/cobblestone")))
        .rotationY((int) state.getValue(BlockStateProperties.HORIZONTAL_FACING).toYRot())
        .build();
});

// Get a multipart block state builder.
MultiPartBlockStateBuilder multipartBuilder = getMultipartBuilder(MyBlocksClass.EXAMPLE_BLOCK.get());
// Add a new part. Starts with .part() and ends with .end().
multipartBuilder.part()
    // Step one: Build the model. multipartBuilder.part() returns a ConfiguredModel.Builder,
    // meaning that all methods seen above can be used here as well.
    .modelFile(models().withExistingParent("example_multipart_model", this.mcLoc("block/cobblestone")))
    // Call .addModel(). Now that the model is built, we can proceed to step two: add the part data.
    .addModel()
    // Add a condition for the part. Requires a property
    // and at least one property value; property values are a vararg.
    .condition(BlockStateProperties.FACING, Direction.NORTH, Direction.SOUTH)
    // Set the multipart conditions to be ORed instead of the default ANDing.
    .useOr()
    // Creates a nested condition group.
    .nestedGroup()
    // Adds a condition to the nested group.
    .condition(BlockStateProperties.FACING, Direction.NORTH)
    // Sets only this condition group to be ORed instead of ANDed.
    .useOr()
    // Creates yet another nested condition group. There is no limit on how many groups can be nested.
    .nestedGroup()
    // Ends the nested condition group, returning to the owning part builder or condition group level.
    // Called twice here since we currently have two nested groups.
    .endNestedGroup()
    .endNestedGroup()
    // End the part builder and add the resulting part to the multipart builder.
    .end();
```

## アイテムモデルのデータ生成 {#item-model-datagen}

アイテムモデルの生成はかなり簡単です。主な理由は、`BlockStateProvider` のような中間のクラスを使わず、`ItemModelProvider` を直接扱うためです。これはもちろん、アイテムモデルにはブロックステートファイルに相当するものがなく、直接使われるからです。

上と同様に、クラスを作り、基底のプロバイダ( この場合は `ItemModelProvider` )を継承させます。`ModelProvider` のサブクラスの中に直接いるので、`models()` の呼び出しはすべて `this` になります( または省略されます )。

```java
public class MyItemModelProvider extends ItemModelProvider {
    public MyItemModelProvider(PackOutput output, ExistingFileHelper existingFileHelper) {
        super(output, "examplemod", existingFileHelper);
    }
    
    @Override
    protected void registerModels() {
        // Block items generally use their corresponding block models as parent.
        withExistingParent(MyItemsClass.EXAMPLE_BLOCK_ITEM.getId().toString(), modLoc("block/example_block"));
        // Items generally use a simple parent and one texture. The most common parents are item/generated and item/handheld.
        // In this example, the item texture would be located at assets/examplemod/textures/item/example_item.png.
        // If you want a more complex model, you can use getBuilder() and then work from that, like you would with block models.
        withExistingParent(MyItemsClass.EXAMPLE_ITEM.getId().toString(), mcLoc("item/generated")).texture("layer0", "item/example_item");
        // The above line is so common that there is a shortcut for it. Note that the item registry name and the
        // texture path, relative to textures/item, must match.
        basicItem(MyItemsClass.EXAMPLE_ITEM.get());
    }
}
```

そして、他のデータプロバイダと同様に、プロバイダを Event に登録するのを忘れないでください。

```java
@SubscribeEvent // on the mod event bus
public static void gatherData(GatherDataEvent event) {
    DataGenerator generator = event.getGenerator();
    PackOutput output = generator.getPackOutput();
    ExistingFileHelper existingFileHelper = event.getExistingFileHelper();

    // other providers here
    generator.addProvider(
        event.includeClient(),
        new MyItemModelProvider(output, existingFileHelper)
    );
}
```

[ao]: https://en.wikipedia.org/wiki/Ambient_occlusion
[blockbench]: https://www.blockbench.net
[custommodelloader]: modelloaders.md#datagen
[datagen]: ../../index.md#data-generation
[elements]: index.md#elements
