# カスタムモデルローダー {#custom-model-loaders}

モデルとは、単なる形状です。立方体でも、立方体の集まりでも、三角形の集まりでも、その他の幾何学的な形状( またはその集まり )でもかまいません。ほとんどの場面では、モデルがどう定義されているかは関係ありません。いずれにせよ、すべてはメモリ上で `BakedModel` になるからです。そこで NeoForge は、任意のモデルをゲームが使える `BakedModel` に変換するカスタムモデルローダーを登録できる機能を追加しています。

ブロックモデルの入り口は、引き続きモデルの JSON ファイルです。ただし、JSON のルートに `loader` フィールドを指定すると、デフォルトのローダーを自分のローダーに置き換えられます。カスタムモデルローダーは、デフォルトのローダーが必要とするフィールドをすべて無視してもかまいません。

## 組み込みのモデルローダー {#builtin-model-loaders}

デフォルトのモデルローダーのほかに、NeoForge にはいくつかの組み込みのローダーがあり、それぞれ異なる目的に使います。

### 複合モデル {#composite-model}

複合モデルを使うと、親でさまざまなモデルの部品を指定し、子でその一部だけを適用できます。これは例で説明するのが一番わかりやすいでしょう。`examplemod:example_composite_model` にある、次の親モデルを考えます。

```json5
{
    "loader": "neoforge:composite",
    // Specify model parts.
    "children": {
        "part_1": {
            "parent": "examplemod:some_model_1"
        },
        "part_2": {
            "parent": "examplemod:some_model_2"
        }
    },
    "visibility": {
        // Disable part 2 by default.
        "part_2": false
    }
}
```

そして、`examplemod:example_composite_model` の子モデルで、個々の部品を無効・有効にできます。

```json5
{
    "parent": "examplemod:example_composite_model",
    // Override visibility. If a part is missing, it will use the parent model's visibility value.
    "visibility": {
        "part_1": false,
        "part_2": true
    }
}
```

このモデルを[データ生成][modeldatagen]するには、カスタムローダーのクラス `CompositeModelBuilder` を使います。

### 動的な液体容器のモデル {#dynamic-fluid-container-model}

動的な液体容器のモデル( 最もよくある用途から、動的なバケツのモデルとも呼ばれます )は、液体容器( バケツやタンクなど )を表し、モデル内に液体を表示したい Item に使います。これは、使える液体の種類が決まっている場合( 例: 溶岩と粉雪のみ )にしか機能しません。液体が任意の場合は、代わりに [`BlockEntityWithoutLevelRenderer`][bewlr] を使ってください。

```json5
{
    "loader": "neoforge:fluid_container",
    // Required. Must be a valid fluid id.
    "fluid": "minecraft:water",
    // The loader generally expects two textures: base and fluid.
    "textures": {
        // The base container texture, i.e. the equivalent of an empty bucket.
        "base": "examplemod:item/custom_container",
        // The fluid texture, i.e. the equivalent of water in a bucket.
        "fluid": "examplemod:item/custom_container_fluid"
    },
    // Optional, defaults to false. Whether to flip the model upside down, for gaseous fluids.
    "flip_gas": true,
    // Optional, defaults to true. Whether to have the cover act as the mask.
    "cover_is_mask": false,
    // Optional, defaults to true. Whether to apply the fluid's luminosity to the item model.
    "apply_fluid_luminosity": false,
}
```

動的な液体容器のモデルでは、バケツのモデルをそのまま使うことがよくあります。これは、次のように親モデルに `neoforge:item_bucket` を指定して行います。

```json5
{
    "loader": "neoforge:fluid_container",
    "parent": "neoforge:item/bucket",
    // Replace with your own fluid.
    "fluid": "minecraft:water"
    // Optional properties here. Note that the textures are handled by the parent.
}
```

このモデルを[データ生成][modeldatagen]するには、カスタムローダーのクラス `DynamicFluidContainerModelBuilder` を使います。互換性を保つ理由から、このクラスにはもう使われていない `apply_tint` プロパティを設定するメソッドもある点に注意してください。

### 要素のモデル {#elements-model}

要素のモデルは、ブロックモデルの[要素][elements]と、任意の[ルート変換][transform]からなります。主に、[BER][ber] の中など、通常のモデルの描画以外での使用を想定しています。

```json5
{
    "loader": "neoforge:elements",
    "elements": [...],
    "transform": {...}
}
```

### 空のモデル {#empty-model}

空のモデルは、何も描画しません。

```json5
{
    "loader": "neoforge:empty"
}
```

### アイテムレイヤーのモデル {#item-layer-model}

アイテムレイヤーのモデルは、標準の `item/generated` モデルの派生版で、次の追加機能があります。

- レイヤーの数が無制限( デフォルトでは 5 つ )
- レイヤーごとの[描画タイプ][rendertype]

```json5
{
    "loader": "neoforge:item_layers",
    "textures": {
        "layer0": "...",
        "layer1": "...",
        "layer2": "...",
        "layer3": "...",
        "layer4": "...",
        "layer5": "...",
    },
    "render_types": {
        // Map render types to layer numbers. For example, layers 0, 2 and 4 will use cutout.
        "minecraft:cutout": [0, 2, 4],
        "minecraft:cutout_mipped": [1, 3],
        "minecraft:translucent": [5]
    },
    // other stuff the default loader allows here
}
```

このモデルを[データ生成][modeldatagen]するには、カスタムローダーのクラス `ItemLayerModelBuilder` を使います。

### OBJ モデル {#obj-model}

OBJ モデルのローダーを使うと、ゲーム内で Wavefront の `.obj` 3D モデルを使えるようになり、任意の形状( 三角形、円なども含む )をモデルに含められます。`.obj` モデルは `models` フォルダ( またはそのサブフォルダ )に置く必要があり、同じ名前の `.mtl` ファイルを用意する( または手動で設定する )必要があります。たとえば、`models/block/example.obj` にある OBJ モデルには、`models/block/example.mtl` に対応する MTL ファイルが必要です。

```json5
{
    "loader": "neoforge:obj",
    // Required. Reference to the model file. Note that this is relative to the namespace root, not the model folder.
    "model": "examplemod:models/example.obj",
    // Normally, .mtl files must be put into the same location as the .obj file, with only the file ending differing.
    // This will cause the loader to automatically pick them up. However, you can also set the location
    // of the .mtl file manually if needed.
    "mtl_override": "examplemod:models/example_other_name.mtl",
    // These textures can be referenced in the .mtl file as #texture0, #particle, etc.
    // This usually requires manual editing of the .mtl file.
    "textures": {
        "texture0": "minecraft:block/cobblestone",
        "particle": "minecraft:block/stone"
    },
    // Enable or disable automatic culling of the model. Optional, defaults to true.
    "automatic_culling": false,
    // Whether to shade the model or not. Optional, defaults to true.
    "shade_quads": false,
    // Some modeling programs will assume V=0 to be bottom instead of the top. This property flips the Vs upside-down.
    // Optional, defaults to false.
    "flip_v": true,
    // Whether to enable emissivity or not. Optional, defaults to true.
    "emissive_ambient": false
}
```

このモデルを[データ生成][modeldatagen]するには、カスタムローダーのクラス `ObjModelBuilder` を使います。

### 視点別の変換のモデル {#separate-transforms-model}

視点別の変換のモデルを使うと、視点に応じて異なるモデルに切り替えられます。視点は、[通常のモデル][model]の `display` ブロックと同じです。これは、( フォールバックとして )ベースのモデルを指定し、さらに視点ごとのオーバーライドモデルを指定することで機能します。望むなら、それぞれを完全なモデルにすることもできますが、通常は、次のように別のモデルの子モデルを使ってそのモデルを参照するのが最も簡単です。

```json5
{
    "loader": "neoforge:separate_transforms",
    // Use the cobblestone model normally.
    "base": {
        "parent": "minecraft:block/cobblestone"
    },
    // Use the stone model only when dropped.
    "perspectives": {
        "ground": {
            "parent": "minecraft:block/stone"
        }
    }
}
```

このモデルを[データ生成][modeldatagen]するには、カスタムローダーのクラス `SeparateTransformsModelBuilder` を使います。

## カスタムモデルローダーの作成 {#creating-custom-model-loaders}

独自のモデルローダーを作るには、3 つのクラスと、Event ハンドラが 1 つ必要です。

- ジオメトリローダーのクラス
- ジオメトリのクラス
- 動的な[ベイク済みモデル][bakedmodel]のクラス
- ジオメトリローダーを登録する、`ModelEvent.RegisterGeometryLoaders` 用の[クライアント側][sides]の [Event ハンドラ][event]

これらのクラスがどうつながっているかを示すため、モデルが読み込まれる流れを追ってみましょう。

- モデルの読み込み中に、`loader` プロパティを自分のローダーに設定したモデルの JSON が、ジオメトリローダーに渡されます。ジオメトリローダーは、モデルの JSON を読み取り、その JSON のプロパティを使ってジオメトリのオブジェクトを返します。
- モデルのベイク中に、ジオメトリがベイクされ、動的なベイク済みモデルが返されます。
- モデルの描画中に、動的なベイク済みモデルが描画に使われます。

基本的なクラス構成で、さらに説明しましょう。ジオメトリローダーのクラスを `MyGeometryLoader`、ジオメトリのクラスを `MyGeometry`、動的なベイク済みモデルのクラスを `MyDynamicModel` とします。

```java
public class MyGeometryLoader implements IGeometryLoader<MyGeometry> {
    // It is highly recommended to use a singleton pattern for geometry loaders, as all models can be loaded through one loader.
    public static final MyGeometryLoader INSTANCE = new MyGeometryLoader();
    // The id we will use to register this loader. Also used in the loader datagen class.
    public static final ResourceLocation ID = ResourceLocation.fromNamespaceAndPath("examplemod", "my_custom_loader");
    
    // In accordance with the singleton pattern, make the constructor private.        
    private MyGeometryLoader() {}
    
    @Override
    public MyGeometry read(JsonObject jsonObject, JsonDeserializationContext context) throws JsonParseException {
        // Use the given JsonObject and, if needed, the JsonDeserializationContext to get properties from the model JSON.
        // The MyGeometry constructor may have constructor parameters (see below).
        return new MyGeometry();
    }
}

public class MyGeometry implements IUnbakedGeometry<MyGeometry> {
    // The constructor may have any parameters you need, and store them in fields for further usage below.
    // If the constructor has parameters, the constructor call in MyGeometryLoader#read must match them.
    public MyGeometry() {}

    // Method responsible for model baking, returning our dynamic model. Parameters in this method are:
    // - The geometry baking context. Contains many properties that we will pass into the model, e.g. light and ao values.
    // - The model baker. Can be used for baking sub-models.
    // - The sprite getter. Maps materials (= texture variables) to TextureAtlasSprites. Materials can be obtained from the context.
    //   For example, to get a model's particle texture, call spriteGetter.apply(context.getMaterial("particle"));
    // - The model state. This holds the properties from the blockstate file, e.g. rotations and the uvlock boolean.
    // - The item overrides. This is the code representation of an "overrides" block in an item model.
    @Override
    public BakedModel bake(IGeometryBakingContext context, ModelBaker baker, Function<Material, TextureAtlasSprite> spriteGetter, ModelState modelState, ItemOverrides overrides) {
        // See info on the parameters below.
        return new MyDynamicModel(context.useAmbientOcclusion(), context.isGui3d(), context.useBlockLight(),
            spriteGetter.apply(context.getMaterial("particle")), overrides);
    }

    // Method responsible for correctly resolving parent properties. Required if this model loads any nested models or reuses the vanilla loader on itself (see below).
    @Override
    public void resolveParents(Function<ResourceLocation, UnbakedModel> modelGetter, IGeometryBakingContext context) {
        // UnbakedModel#resolveParents
    }
}

// BakedModelWrapper can be used as well to return default values for most methods, allowing you to only override what actually needs to be overridden.
public class MyDynamicModel implements IDynamicBakedModel {
    // Material of the missing texture. Its sprite can be used as a fallback when needed.
    private static final Material MISSING_TEXTURE = 
        new Material(TextureAtlas.LOCATION_BLOCKS, MissingTextureAtlasSprite.getLocation());

    // Attributes for use in the methods below. Optional, the methods may also use constant values if applicable.
    private final boolean useAmbientOcclusion;
    private final boolean isGui3d;
    private final boolean usesBlockLight;
    private final TextureAtlasSprite particle;
    private final ItemOverrides overrides;

    // The constructor does not require any parameters other than the ones for instantiating the final fields.
    // It may specify any additional parameters to store in fields you deem necessary for your model to work.
    public MyDynamicModel(boolean useAmbientOcclusion, boolean isGui3d, boolean usesBlockLight, TextureAtlasSprite particle, ItemOverrides overrides) {
        this.useAmbientOcclusion = useAmbientOcclusion;
        this.isGui3d = isGui3d;
        this.usesBlockLight = usesBlockLight;
        this.particle = particle;
        this.overrides = overrides;
    }

    // Use our attributes. Refer to the article on baked models for more information on the method's effects.
    @Override
    public boolean useAmbientOcclusion() {
        return useAmbientOcclusion;
    }

    @Override
    public boolean isGui3d() {
        return isGui3d;
    }

    @Override
    public boolean usesBlockLight() {
        return usesBlockLight;
    }

    @Override
    public TextureAtlasSprite getParticleIcon() {
        // Return MISSING_TEXTURE.sprite() if you don't need a particle, e.g. when in an item model context.
        return particle;
    }

    @Override
    public ItemOverrides getOverrides() {
        // Return ItemOverrides.EMPTY when in a block model context.
        return overrides;
    }

    // Override this to true if you want to use a custom block entity renderer instead of the default renderer.
    @Override
    public boolean isCustomRenderer() {
        return false;
    }

    // This is where the magic happens. Return a list of the quads to render here. Parameters are:
    // - The blockstate being rendered. May be null if rendering an item.
    // - The side being culled against. May be null, which means quads that cannot be occluded should be returned.
    // - A client-bound random source you can use for randomizing stuff.
    // - The extra data to use. Originates from a block entity (if present), or from BakedModel#getModelData().
    // - The render type for which quads are being requested.
    // NOTE: This may be called many times in quick succession, up to several times per block.
    // This should be as fast as possible and use caching wherever applicable.
    @Override
    public List<BakedQuad> getQuads(@Nullable BlockState state, @Nullable Direction side, RandomSource rand, ModelData extraData, @Nullable RenderType renderType) {
        List<BakedQuad> quads = new ArrayList<>();
        // add elements to the quads list as needed here
        return quads;
    }
}
```

すべてできたら、ローダーを実際に登録するのを忘れないでください。そうしないと、すべての作業が無駄になってしまいます。

```java
@SubscribeEvent // on the mod event bus only on the physical client
public static void registerGeometryLoaders(ModelEvent.RegisterGeometryLoaders event) {
    event.register(MyGeometryLoader.ID, MyGeometryLoader.INSTANCE);
}
```

### データ生成 {#datagen}

もちろん、モデルを[データ生成][datagen]することもできます。そのためには、`CustomLoaderBuilder` を継承したクラスが必要です。

```java
// This assumes a block model. Use ItemModelBuilder as the generic parameter instead 
// if you're making a custom item model.
public class MyLoaderBuilder extends CustomLoaderBuilder<BlockModelBuilder> {
    public MyLoaderBuilder(BlockModelBuilder parent, ExistingFileHelper existingFileHelper) {
        super(
            // Your model loader's id.
            MyGeometryLoader.ID,
            // The parent builder we use. This is always the first constructor parameter.
            parent,
            // The existing file helper we use. This is always the second constructor parameter.
            existingFileHelper,
            // Whether the loader allows inline vanilla elements as a fallback if the loader is absent.
            false
        );
    }
    
    // Add fields and setters for the fields here. The fields can then be used below.
    
    // Serialize the model to JSON.
    @Override
    public JsonObject toJson(JsonObject json) {
        // Add your fields to the given JsonObject.
        // Then call super, which adds the loader property and some other things.
        return super.toJson(json);
    }
}
```

このローダーのビルダーを使うには、Block( または Item )の[モデルのデータ生成][modeldatagen]の中で、次のようにします。

```java
// This assumes a BlockStateProvider. Use getBuilder("my_cool_block") directly in an ItemModelProvider.
// The parameter for customLoader() is a BiFunction. The parameters of the BiFunction
// are the result of the getBuilder() call and the provider's ExistingFileHelper.
MyLoaderBuilder loaderBuilder = models().getBuilder("my_cool_block").customLoader(MyLoaderBuilder::new);
```

そのうえで、`loaderBuilder` でフィールドの setter を呼び出します。

#### 表示 {#visibility}

`CustomLoaderBuilder` のデフォルト実装には、表示( visibility )を適用するためのメソッドがあります。モデルローダーで `visibility` プロパティを使うか無視するかは自由です。現在、このプロパティを利用しているのは[複合モデルのローダー][composite]だけです。

### デフォルトのモデルローダーの再利用 {#reusing-the-default-model-loader}

場面によっては、バニラのモデルローダーを完全に置き換えるのではなく、それを再利用し、その上に自分のモデルのロジックを構築するのが理にかなっています。これは、うまい手を使って実現できます。モデルローダーで `loader` プロパティを取り除き、それをモデルのデシリアライザに戻して、通常のモデルだと思わせるのです。そのうえで、それをジオメトリに渡し、そこで( デフォルトのジオメトリハンドラと同じように )モデルのジオメトリをベイクして、動的なモデルに渡します。動的なモデルでは、モデルの四角形を好きなように使えます。

```java
public class MyGeometryLoader implements IGeometryLoader<MyGeometry> {
    public static final MyGeometryLoader INSTANCE = new MyGeometryLoader();
    public static final ResourceLocation ID = ResourceLocation.fromNamespaceAndPath(...);
    
    private MyGeometryLoader() {}
    
    @Override
    public MyGeometry read(JsonObject jsonObject, JsonDeserializationContext context) throws JsonParseException {
        // Trick the deserializer into thinking this is a normal model by removing the loader field and then passing it back into the deserializer.
        jsonObject.remove("loader");
        BlockModel base = context.deserialize(jsonObject, BlockModel.class);
        // other stuff here if needed
        return new MyGeometry(base);
    }
}

public class MyGeometry implements IUnbakedGeometry<MyGeometry> {
    private final BlockModel base;

    // Store the block model for usage below.            
    public MyGeometry(BlockModel base) {
        this.base = base;
    }

    @Override
    public BakedModel bake(IGeometryBakingContext context, ModelBaker baker, Function<Material, TextureAtlasSprite> spriteGetter, ModelState modelState, ItemOverrides overrides) {
        BakedModel bakedBase = new ElementsModel(base.getElements()).bake(context, baker, spriteGetter, modelState, overrides);
        return new MyDynamicModel(bakedBase, /* other parameters here */);
    }

    @Override
    public void resolveParents(Function<ResourceLocation, UnbakedModel> modelGetter, IGeometryBakingContext context) {
        base.resolveParents(modelGetter);
    }
}

public class MyDynamicModel implements IDynamicBakedModel {
    private final BakedModel base;
    // other fields here

    public MyDynamicModel(BakedModel base, /* other parameters here */) {
        this.base = base;
        // set other fields here
    }

    // other override methods here

    @Override
    public List<BakedQuad> getQuads(@Nullable BlockState state, @Nullable Direction side, RandomSource rand, ModelData extraData, @Nullable RenderType renderType) {
        List<BakedQuad> quads = new ArrayList<>();
        // Add the base model's quads. Can also do something different with the quads here, depending on what you need.
        quads.addAll(base.getQuads(state, side, rand, extraData, renderType));
        // add other elements to the quads list as needed here
        return quads;
    }
    
    // Apply the base model's transforms to our model as well.
    @Override
    public BakedModel applyTransform(ItemDisplayContext transformType, PoseStack poseStack, boolean applyLeftHandTransform) {
        return base.applyTransform(transformType, poseStack, applyLeftHandTransform);
    }
}
```

[bakedmodel]: bakedmodel.md
[ber]: ../../../blockentities/ber.md
[bewlr]: ../../../blockentities/ber.md#blockentitywithoutlevelrenderer
[composite]: #composite-model
[datagen]: ../../index.md#data-generation
[elements]: index.md#elements
[event]: ../../../concepts/events.md#registering-an-event-handler
[model]: index.md#specification
[modeldatagen]: datagen.md
[rendertype]: index.md#render-types
[sides]: ../../../concepts/sides.md
[transform]: index.md#root-transforms
