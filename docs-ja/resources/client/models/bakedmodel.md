# ベイク済みモデル {#baked-models}

`BakedModel` は、テクスチャ付きの形状をコード上で表したものです。複数の出どころがあり、たとえば `UnbakedModel#bake`( デフォルトのモデルローダー )や `IUnbakedGeometry#bake`( [カスタムモデルローダー][modelloader] )の呼び出しから生まれます。一部の [BlockEntityRenderer][ber] もベイク済みモデルを利用します。モデルの複雑さに制限はありません。

モデルは `ModelManager` に保存されており、`Minecraft.getInstance().modelManager` でアクセスできます。そこから `ModelManager#getModel` を呼び出すと、[`ResourceLocation`][rl] または [`ModelResourceLocation`][mrl] で特定のモデルを取得できます。Mod は基本的に、以前に自動で読み込まれ、ベイクされたモデルを再利用することになります。

## `BakedModel` のメソッド {#methods-of-bakedmodel}

### `getQuads`

ベイク済みモデルで最も重要なメソッドは `getQuads` です。このメソッドは、GPU に送れる `BakedQuad` のリストを返す役割を担います。四角形( quad )は、モデリングソフト( や他のほとんどのゲーム )での三角形に相当しますが、Minecraft は全体的に正方形を中心にしているため、開発者は Minecraft の描画に三角形( 頂点 3 つ )ではなく四角形( 頂点 4 つ )を使うことにしました。`getQuads` には、使える引数が 5 つあります。

- `BlockState`: 描画している[ブロックステート][blockstate]。null の場合は、Item を描画していることを示します。
- `Direction`: カリングの対象となる面の方向。null の場合は、遮られることのない四角形を返すべきであることを意味します。
- `RandomSource`: ランダム化に使える、クライアントに紐づいたランダムソース。
- `ModelData`: 使う追加のモデルデータ。描画に必要な、BlockEntity からの追加データを含むことがあります。`BakedModel#getModelData` から渡されます。
- `RenderType`: Block の描画に使う[描画タイプ][rendertype]。null の場合は、このモデルが使うすべての描画タイプの四角形を返すべきであることを示します。そうでなければ、`BakedModel#getRenderTypes`( 後述 )が返す描画タイプのいずれかです。

モデルは積極的にキャッシュすべきです。チャンクが再構築されるのはその中の Block が変わったときだけですが、このメソッドはチャンクセクションごとに何度も呼ばれます( あるモデルが使う RenderType ごとに最大 7 回 × そのモデルが使う RenderType の数 × チャンクセクションあたり 4096 ブロック )。そのため、このメソッドで行う計算はできる限り速くする必要があり、理想的には積極的にキャッシュすべきなのです。さらに、[BER][ber] やエンティティのレンダラーは、このメソッドを 1 フレームに何度も呼び出すことがあります。

### `applyTransform` と `getTransforms` {#applytransform-and-gettransforms}

`applyTransform` を使うと、モデルに視点の変換を適用するときに、独自のロジックを適用できます。まったく別のモデルを返すこともできます。このメソッドは、バニラの `getTransforms()` メソッドの代わりとして NeoForge が追加したものです。そちらでは変換自体をカスタマイズできるだけで、その適用方法は変えられません。ただし、`applyTransform` のデフォルト実装は `getTransforms` に委ねているので、独自の変換だけが必要なら、`getTransforms` をオーバーライドするだけでも済みます。`applyTransforms` には 3 つの引数があります。

- `ItemDisplayContext`: モデルを変換する先の[視点][perspective]。
- `PoseStack`: 描画に使うポーズスタック。
- `boolean`: デフォルトの右手での描画の代わりに、左手での描画用に変更した値を使うかどうか。描画する手が左手( オフハンド、またはオプションで左利きモードが有効な場合はメインハンド )なら `true` です。

:::note
`applyTransform` と `getTransforms` は、アイテムモデルにのみ適用されます。
:::

### その他 {#others}

オーバーライドや問い合わせができる `BakedModel` のその他のメソッドには、次のものがあります。

| シグネチャ                                                                         | 効果 |
|-------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `TriState useAmbientOcclusion()`                                              | [アンビエントオクルージョン][ao]を使うかどうか。`BlockState`、`RenderType`、`ModelData` を引数に取り、`TriState` を返します。これにより、AO を強制的に無効にするだけでなく、強制的に有効にすることもできます。`boolean` を返すオーバーロードが 2 つあり、それぞれ `BlockState` だけを受け取るものと、引数を取らないものですが、どちらも最初の形を優先して非推奨となっており、削除予定です。 |
| `boolean isGui3d()`                                                           | このモデルを、GUI のスロットで 3D として描画するか、平らに描画するか。 |
| `boolean usesBlockLight()`                                                    | モデルを照らすときに、3D の照明( `true` )を使うか、正面からの平らな照明( `false` )を使うか。 |
| `boolean isCustomRenderer()`                                                  | true の場合、通常の描画を省き、代わりに関連付けられた [`BlockEntityWithoutLevelRenderer`][bewlr] の `renderByItem` メソッドを呼び出します。false の場合は、デフォルトのレンダラーで描画します。 |
| `ItemOverrides getOverrides()`                                                | このモデルに関連付けられた [`ItemOverrides`][itemoverrides] を返します。アイテムモデルでのみ意味を持ちます。 |
| `ModelData getModelData(BlockAndTintGetter, BlockPos, BlockState, ModelData)` | モデルに使うモデルデータを返します。このメソッドには既存の `ModelData` が渡されます。これは、Block に関連付けられた BlockEntity があれば `BlockEntity#getModelData()` の結果、なければ `ModelData.EMPTY` です。このメソッドは、モデルデータが必要だが BlockEntity を持たない Block、たとえば連結テクスチャを持つ Block に使えます。 |
| `TextureAtlasSprite getParticleIcon(ModelData)`                               | モデルに使うパーティクルのスプライトを返します。モデルデータを使って、モデルデータの値ごとに異なるパーティクルのスプライトを使うこともできます。NeoForge が追加したもので、引数のないバニラの `getParticleIcon()` のオーバーロードを置き換えます。 |
| `ChunkRenderTypeSet getRenderTypes(BlockState, RandomSource, ModelData)`      | ブロックモデルの描画に使う描画タイプを含む `ChunkRenderTypeSet` を返します。`ChunkRenderTypeSet` は、セットに基づく順序付きの `Iterable<RenderType>` です。デフォルトでは、[モデルの JSON から描画タイプを取得する][rendertype]処理にフォールバックします。ブロックモデルでのみ使われ、アイテムモデルでは下のオーバーロードが使われます。 |
| `List<RenderType> getRenderTypes(ItemStack, boolean)`                         | アイテムモデルの描画に使う描画タイプを含む `List<RenderType>` を返します。デフォルトでは、モデルに紐づく通常の描画タイプの検索にフォールバックし、常に要素が 1 つのリストになります。アイテムモデルでのみ使われ、ブロックモデルでは上のオーバーロードが使われます。 |

## 視点 {#perspectives}

Minecraft の描画エンジンは、アイテムの描画について全部で 8 種類の視点( コード内のフォールバックを含めると 9 種類 )を認識します。これらはモデルの JSON の `display` ブロックで使われ、コード上では `ItemDisplayContext` enum で表されます。

| enum の値                   | JSON のキー                  | 用途 |
|---------------------------|---------------------------|------------------------------------------------------------------------------------------------------------------|
| `THIRD_PERSON_RIGHT_HAND` | `"thirdperson_righthand"` | 三人称視点での右手( F5 の視点、または他のプレイヤー ) |
| `THIRD_PERSON_LEFT_HAND`  | `"thirdperson_lefthand"`  | 三人称視点での左手( F5 の視点、または他のプレイヤー ) |
| `FIRST_PERSON_RIGHT_HAND` | `"firstperson_righthand"` | 一人称視点での右手 |
| `FIRST_PERSON_LEFT_HAND`  | `"firstperson_lefthand"`  | 一人称視点での左手 |
| `HEAD`                    | `"head"`                  | プレイヤーの頭の防具スロットにあるとき( 多くの場合、コマンドでしか実現できません ) |
| `GUI`                     | `"gui"`                   | インベントリ、プレイヤーのホットバー |
| `GROUND`                  | `"ground"`                | ドロップしたアイテム。ドロップしたアイテムの回転は、モデルではなく、ドロップしたアイテムのレンダラーが扱う点に注意してください |
| `FIXED`                   | `"fixed"`                 | 額縁 |
| `NONE`                    | `"none"`                  | コード内でのフォールバック用。JSON では使わないでください |

## `ItemOverrides`

`ItemOverrides` は、ベイク済みモデルが [`ItemStack`][itemstack] の状態を処理し、`#resolve` メソッドで新しいベイク済みモデルを返す手段を提供するクラスです。`#resolve` には 5 つの引数があります。

- `BakedModel`: 元のモデル。
- `ItemStack`: 描画しているアイテムスタック。
- `ClientLevel`: モデルを描画しているレベル。これはレベルの問い合わせにのみ使い、どのような形でも変更しないでください。null の場合があります。
- `LivingEntity`: モデルを描画している対象のエンティティ。null の場合があります( 例: [BlockEntityRenderer][ber] から描画する場合 )。
- `int`: ランダム化のためのシード。

`ItemOverrides` は、モデルのオーバーライドのオプションを `BakedOverride` としても保持します。`BakedOverride` のオブジェクトは、モデルの [`overrides`][overrides] ブロックをコード上で表したものです。ベイク済みモデルは、その中身に応じて異なるモデルを返すのにこれを使えます。`ItemOverrides` インスタンスのすべての `BakedOverride` のリストは、`ItemOverrides#getOverrides()` で取得できます。

## `BakedModelWrapper`

`BakedModelWrapper` を使うと、既存の `BakedModel` を変更できます。`BakedModelWrapper` は `BakedModel` のサブクラスで、コンストラクタで別の `BakedModel`( 「元の」モデル )を受け取り、デフォルトではすべてのメソッドを元のモデルに転送します。実装では、次のように特定のメソッドだけをオーバーライドできます。

```java
// The generic parameter may optionally be a more specific subclass of BakedModel.
// If it is, the constructor parameter must match that type.
public class MyBakedModelWrapper extends BakedModelWrapper<BakedModel> {
    // Pass the original model to super.
    public MyBakedModelWrapper(BakedModel originalModel) {
        super(originalModel);
    }
    
    // Override whatever methods you want here. You may also access originalModel if needed.
}
```

モデルのラッパークラスを書いたら、影響させたいモデルにラッパーを適用する必要があります。これは、`ModelEvent.ModifyBakingResult` の[クライアント側][sides]の [Event ハンドラ][event]で行います。

```java
@SubscribeEvent // on the mod event bus only on the physical client
public static void modifyBakingResult(ModelEvent.ModifyBakingResult event) {
    // For block models
    event.getModels().computeIfPresent(
        // The model resource location of the model to modify. Get it from
        // BlockModelShaper#stateToModelLocation with the blockstate to be affected as a parameter.
        BlockModelShaper.stateToModelLocation(MyBlocksClass.EXAMPLE_BLOCK.defaultBlockState()),
        // A BiFunction with the location and the original models as parameters, returning the new model.
        (location, model) -> new MyBakedModelWrapper(model);
    );
    // For item models
    event.getModels().computeIfPresent(
        // The model resource location of the model to modify.
        new ModelResourceLocation(
            ResourceLocation.fromNamespaceAndPath("examplemod", "example_item"),
            "inventory"
        ),
        // A BiFunction with the location and the original models as parameters, returning the new model.
        (location, model) -> new MyBakedModelWrapper(model);
    );
}
```

:::warning
可能であれば、`ModelEvent.ModifyBakingResult` でベイク済みモデルをラップするよりも、[カスタムモデルローダー][modelloader]を使うことが一般におすすめです。カスタムモデルローダーでも、必要に応じて `BakedModelWrapper` を使えます。
:::

[ao]: https://en.wikipedia.org/wiki/Ambient_occlusion
[ber]: ../../../blockentities/ber.md
[bewlr]: ../../../blockentities/ber.md#blockentitywithoutlevelrenderer
[blockstate]: ../../../blocks/states.md
[event]: ../../../concepts/events.md
[itemoverrides]: #itemoverrides
[itemstack]: ../../../items/index.md#itemstacks
[modelloader]: modelloaders.md
[mrl]: ../../../misc/resourcelocation.md#modelresourcelocations
[overrides]: index.md#overrides
[perspective]: #perspectives
[rendertype]: index.md#render-types
[rl]: ../../../misc/resourcelocation.md
[sides]: ../../../concepts/sides.md
