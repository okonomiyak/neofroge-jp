# モデル {#models}

モデルは、Block や Item の見た目の形とテクスチャを決める JSON ファイルです。モデルは直方体の要素からなり、要素はそれぞれ独自の大きさを持ち、各面にテクスチャが割り当てられます。

各 Item には、Registry 名によってアイテムモデルが割り当てられます。たとえば、Registry 名が `examplemod:example_item` の Item には、`assets/examplemod/models/item/example_item.json` にあるモデルが割り当てられます。Block の場合は少し複雑で、まずブロックステートファイルが割り当てられます。詳しくは[後述][bsfile]を参照してください。

## 仕様 {#specification}

_関連項目: [Minecraft Wiki][mcwiki] の[モデル][mcwikimodel]_

モデルは、ルートのタグに次の任意のプロパティを持つ JSON ファイルです。

- `loader`: NeoForge が追加したものです。カスタムのモデルローダーを設定します。詳しくは[カスタムモデルローダー][custommodelloader]を参照してください。
- `parent`: 親モデルを、`models` フォルダからの相対パスの[リソースロケーション][rl]の形式で設定します。親のプロパティがすべて適用された後、宣言しているモデルで設定したプロパティで上書きされます。よく使われる親には次のものがあります。
    - `minecraft:block/block`: すべてのブロックモデルに共通の親です。
    - `minecraft:block/cube`: 1x1x1 の立方体のモデルを使う、すべてのモデルの親です。
    - `minecraft:block/cube_all`: 6 面すべてに同じテクスチャを使う立方体のモデルの派生版です。たとえば丸石や木材です。
    - `minecraft:block/cube_bottom_top`: 水平な 4 面に同じテクスチャを使い、上面と底面に別々のテクスチャを使う立方体のモデルの派生版です。よくある例は砂岩や模様入りのクォーツです。
    - `minecraft:block/cube_column`: 側面のテクスチャと、底面・上面のテクスチャを持つ立方体のモデルの派生版です。例としては、原木や、クォーツとプルプァの柱があります。
    - `minecraft:block/cross`: 同じテクスチャの 2 枚の平面を使うモデルで、1 枚を時計回りに 45°、もう 1 枚を反時計回りに 45° 回転させており、上から見ると X の形になります( 名前の由来です )。例としては、草、苗木、花など、ほとんどの植物があります。
    - `minecraft:item/generated`: 従来の 2D の平らなアイテムモデルの親です。ゲーム内のほとんどの Item で使われています。四角形はテクスチャから生成されるため、`elements` ブロックは無視されます。
    - `minecraft:item/handheld`: プレイヤーが実際に手に持っているように見える、2D の平らなアイテムモデルの親です。主に道具で使われています。`item/generated` のサブモデルなので、同じく `elements` ブロックは無視されます。
    - `minecraft:builtin/entity`: `particle` 以外のテクスチャを指定しません。これを親にすると、[`BakedModel#isCustomRenderer()`][iscustomrenderer] が `true` を返し、[`BlockEntityWithoutLevelRenderer`][bewlr] を使えるようになります。
    - BlockItem は、対応するブロックモデルを親にすることがよくあります( 常にではありません )。たとえば、丸石のアイテムモデルは親として `minecraft:block/cobblestone` を使います。
- `ambientocclusion`: [アンビエントオクルージョン][ao]を有効にするかどうか。ブロックモデルでのみ有効です。デフォルトは `true` です。カスタムのブロックモデルの陰影がおかしい場合は、`false` にしてみてください。
- `render_type`: [描画タイプ][rendertype]を参照してください。
- `gui_light`: `"front"` または `"side"` にできます。`"front"` の場合、光は正面から当たり、平らな 2D のモデルに便利です。`"side"` の場合、光は横から当たり、3D のモデル( 特にブロックモデル )に便利です。デフォルトは `"side"` です。アイテムモデルでのみ有効です。
- `textures`: 名前( テクスチャ変数と呼ばれます )を[テクスチャの場所][textures]に対応付けるサブオブジェクトです。テクスチャ変数は、[要素][elements]で使えます。要素で指定したまま値を指定せずにおき、子モデルで指定させることもできます。
    - ブロックモデルでは、さらに `particle` テクスチャも指定してください。このテクスチャは、Block に落下したとき、Block の上を走ったとき、Block を壊したときに使われます。
    - アイテムモデルでは、`layer0`、`layer1` などの名前のレイヤーテクスチャも使えます。インデックスの大きいレイヤーほど上に描画されます( 例: `layer1` は `layer0` の上に描画されます )。親が `item/generated` の場合にのみ機能し、最大 5 レイヤー( `layer0` から `layer4` )まで使えます。
- `elements`: 直方体の[要素][elements]のリストです。
- `overrides`: [オーバーライドモデル][overrides]のリストです。アイテムモデルでのみ有効です。
- `display`: さまざまな[視点][perspectives]ごとの表示オプションを保持するサブオブジェクトです。使えるキーはリンク先の記事を参照してください。アイテムモデルでのみ有効ですが、アイテムモデルが表示オプションを継承できるよう、ブロックモデルで指定されることもよくあります。各視点は任意のサブオブジェクトで、次のオプションを含められ、この順に適用されます。
    - `translation`: モデルの平行移動。`[x, y, z]` で指定します。
    - `rotation`: モデルの回転。`[x, y, z]` で指定します。
    - `scale`: モデルの拡大縮小。`[x, y, z]` で指定します。
    - `right_rotation`: NeoForge が追加したものです。拡大縮小の後に適用される 2 つ目の回転で、`[x, y, z]` で指定します。
- `transform`: [ルート変換][roottransforms]を参照してください。

:::tip
何かを具体的にどう指定すればよいかわからない場合は、似たことをしているバニラのモデルを見てみてください。
:::

### 描画タイプ {#render-types}

NeoForge が追加した任意の `render_type` フィールドを使うと、モデルの描画タイプを設定できます。設定しない場合( バニラのモデルはすべてそうです )、ゲームは `ItemBlockRenderTypes` にハードコードされた描画タイプにフォールバックします。`ItemBlockRenderTypes` にもその Block の描画タイプがない場合は、`minecraft:solid` にフォールバックします。バニラには、次のデフォルトの描画タイプがあります。

- `minecraft:solid`: 石のように、完全に不透明な Block に使います。
- `minecraft:cutout`: ガラスのように、各ピクセルが完全に不透明か完全に透明か( つまり、透明度が全部かゼロか )のどちらかである Block に使います。
- `minecraft:cutout_mipped`: `minecraft:cutout` の派生版で、見た目の乱れを避けるため、遠くではテクスチャを縮小します( [ミップマップ][mipmapping] )。アイテムの描画では、通常望ましくなく乱れの原因になることがあるため、ミップマップは適用されません。たとえば葉で使われています。
- `minecraft:cutout_mipped_all`: `minecraft:cutout_mipped` の派生版で、アイテムモデルにもミップマップを適用します。
- `minecraft:translucent`: 色付きガラスのように、各ピクセルが部分的に透明になりうる Block に使います。
- `minecraft:tripwire`: 天候の描画先に描画する必要があるという特別な要件を持つ Block、つまりトリップワイヤーで使われます。

正しい描画タイプを選ぶことは、ある程度パフォーマンスの問題です。solid の描画は cutout の描画より速く、cutout の描画は translucent の描画より速くなります。そのため、用途に合う中で最も「厳しい」描画タイプを指定してください。それが最も速くもなります。

必要であれば、独自の描画タイプを追加することもできます。そのためには、[Mod バス][modbus]の [Event][event] である `RegisterNamedRenderTypesEvent` を listen し、描画タイプを `#register` します。`#register` は 3 つまたは 4 つの引数を取ります。

- 描画タイプの名前。Mod ID が接頭辞として付きます。たとえば、ここで `"my_cutout"` を使うと、新しい描画タイプとして `examplemod:my_cutout` が使えるようになります( もちろん、Mod ID が `examplemod` の場合です )。
- チャンクの描画タイプ。`RenderType.chunkBufferLayers()` が返すリスト内のいずれかの型を使えます。
- エンティティの描画タイプ。`DefaultVertexFormat.NEW_ENTITY` の頂点フォーマットを持つ描画タイプである必要があります。
- 任意: fabulous の描画タイプ。`DefaultVertexFormat.NEW_ENTITY` の頂点フォーマットを持つ描画タイプである必要があります。グラフィックモードが _Fabulous!_ に設定されている場合に、通常のエンティティの描画タイプの代わりに使われます。省略した場合は、通常の描画タイプにフォールバックします。描画タイプが何らかの形で透明度を使う場合は、一般に設定することをおすすめします。

### 要素 {#elements}

要素は、直方体のオブジェクトを JSON で表したものです。次のプロパティを持ちます。

- `from`: 直方体の始点の角の座標で、`[x, y, z]` で指定します。1/16 ブロック単位で指定します。たとえば、`[0, 0, 0]` は Block の「左下」の角、`[8, 8, 8]` は中心、`[16, 16, 16]` は「右上」の角になります。
- `to`: 直方体の終点の角の座標で、`[x, y, z]` で指定します。`from` と同様に、1/16 ブロック単位で指定します。

:::tip
`from` と `to` の値は、Minecraft によって `[-16, 32]` の範囲に制限されています。ただし、照明やカリングの問題につながるため、`[0, 16]` を超えることは強くおすすめしません。
:::

- `neoforge_data`: [面の追加データ][extrafacedata]を参照してください。
- `faces`: 最大 6 つの面のデータを含むオブジェクトで、面の名前はそれぞれ `north`、`south`、`east`、`west`、`up`、`down` です。各面は次のデータを持ちます。
    - `uv`: 面の UV で、`[u1, v1, u2, v2]` で指定します。`u1, v1` が左上、`u2, v2` が右下の UV 座標です。
    - `texture`: 面に使うテクスチャ。`#` を接頭辞に付けたテクスチャ変数である必要があります。たとえば、モデルに `wood` という名前のテクスチャがあれば、そのテクスチャを参照するには `#wood` を使います。厳密には任意で、ない場合は欠落テクスチャが使われます。
    - `rotation`: 任意。テクスチャを時計回りに 90、180、270 度回転させます。
    - `cullface`: 任意。指定した方向に完全な Block が接しているときに、その面の描画を省くよう描画エンジンに指示します。方向は `north`、`south`、`east`、`west`、`up`、`down` のいずれかです。
    - `tintindex`: 任意。カラーハンドラが使える着色インデックスを指定します。詳しくは[着色][tinting]を参照してください。デフォルトは -1 で、着色しないことを意味します。
    - `neoforge_data`: [面の追加データ][extrafacedata]を参照してください。

さらに、次の任意のプロパティも指定できます。

- `shade`: ブロックモデルでのみ使えます。任意。この要素の面に、方向に応じた陰影を付けるかどうか。デフォルトは true です。
- `rotation`: オブジェクトの回転。次のデータを含むサブオブジェクトで指定します。
    - `angle`: 回転の角度( 度 )。-45 から 45 まで、22.5 度刻みで指定できます。
    - `axis`: 回転の軸。現在、オブジェクトを複数の軸で回転させることはできません。
    - `origin`: 任意。回転の中心点で、`[x, y, z]` で指定します。これは絶対的な値であり、立方体の位置からの相対値ではない点に注意してください。指定しない場合は `[0, 0, 0]` が使われます。

#### 面の追加データ {#extra-face-data}

面の追加データ( `neoforge_data` )は、要素と、要素の個々の面の両方に適用できます。使えるところではどこでも任意です。要素単位と面単位の両方で追加データを指定した場合は、面単位のデータが要素単位のデータを上書きします。追加データでは、次のデータを指定できます。

- `color`: 指定した色で面を着色します。ARGB の値である必要があります。文字列または 10 進数の整数で指定できます( JSON は 16 進数のリテラルをサポートしていません )。デフォルトは `0xFFFFFFFF` です。色の値が一定であれば、着色の代わりに使えます。
- `block_light`: この面に使うブロックの明るさの値を上書きします。デフォルトは 0 です。
- `sky_light`: この面に使う空の明るさの値を上書きします。デフォルトは 0 です。
- `ambient_occlusion`: この面のアンビエントオクルージョンを無効または有効にします。デフォルトは、モデルで設定した値です。

カスタムの `neoforge:item_layers` ローダーを使うと、`item/generated` モデルのすべてのジオメトリに適用する面の追加データも指定できます。次の例では、レイヤー 1 が赤く着色され、最大の明るさで光ります。

```json5
{
    "loader": "neoforge:item_layers",
    "parent": "minecraft:item/generated",
    "textures": {
        "layer0": "minecraft:item/stick",
        "layer1": "minecraft:item/glowstone_dust"
    },
    "neoforge_data": {
        "layers": {
            "1": {
                "color": "0xFFFF0000",
                "block_light": 15,
                "sky_light": 15,
                "ambient_occlusion": false
            }
        }
    }
}
```

### オーバーライド {#overrides}

アイテムのオーバーライドを使うと、オーバーライド値と呼ばれる float の値に基づいて、Item に別のモデルを割り当てられます。たとえば、弓とクロスボウは、引いている時間に応じてテクスチャを変えるためにこれを使っています。オーバーライドには、モデル側とコード側の両方があります。

モデル側では、オーバーライド値が指定したしきい値以上のときに使う、1 つまたは複数のオーバーライドモデルを指定できます。たとえば、弓は `pulling` と `pull` の 2 つの異なるプロパティを使います。`pulling` は真偽値として扱われ、1 は引いている、0 は引いていないと解釈されます。一方、`pull` は弓が現在どれだけ引かれているかを表します。そして、これらのプロパティを使って、65% 未満( `pulling` が 1、`pull` の値なし )、65%( `pulling` が 1、`pull` が 0.65 )、90%( `pulling` が 1、`pull` が 0.9 )まで引いたときに使う 3 つの代替モデルを指定しています。( 値が大きくなり続けるため )複数のモデルが当てはまる場合は、リストの最後の要素が一致するので、順序が正しいことを確認してください。オーバーライドは次のようになります。

```json5
{
    // other stuff here
    "overrides": [
        {
            // pulling = 1
            "predicate": {
                "pulling": 1
            },
            "model": "item/bow_pulling_0"
        },
        {
            // pulling = 1, pull >= 0.65
            "predicate": {
                "pulling": 1,
                "pull": 0.65
            },
            "model": "item/bow_pulling_1"
        },
        // pulling = 1, pull >= 0.9
        {
            "predicate": {
                "pulling": 1,
                "pull": 0.9
            },
            "model": "item/bow_pulling_2"
        }
    ]
}
```

コード側はとても単純です。Item に `examplemod:property` という名前のプロパティを追加したいとすると、[クライアント側][side]の [Event ハンドラ][eventhandler]で次のコードを使います。

```java
@SubscribeEvent // on the mod event bus only on the physical client
public static void onClientSetup(FMLClientSetupEvent event) {
    event.enqueueWork(() -> { // ItemProperties#register is not threadsafe, so we need to call it on the main thread
        ItemProperties.register(
            // The item to apply the property to.
            ExampleItems.EXAMPLE_ITEM,
            // The id of the property.
            ResourceLocation.fromNamespaceAndPath("examplemod", "property"),
            // A reference to a method that calculates the override value.
            // Parameters are the used item stack, the level context, the player using the item,
            // and a random seed you can use.
            (stack, level, player, seed) -> someMethodThatReturnsAFloat()
        );
    });
}
```

:::info
バニラの Minecraft では、0 から 1 の float 値しか使えません。NeoForge はこれにパッチを当て、任意の float 値を使えるようにしています。
:::

### ルート変換 {#root-transforms}

モデルの最上位に `transform` プロパティを追加すると、[ブロックステートファイル][bsfile]の回転( ブロックモデルの場合 )や `display` ブロックの変換( アイテムモデルの場合 )が適用される直前に、すべてのジオメトリに変換を適用するようローダーに指示します。これは NeoForge が追加したものです。

ルート変換は 2 通りの方法で指定できます。1 つ目は、変換の 3x4 行列( 行優先、最後の行は省略 )を入れ子の JSON 配列の形で含む、`matrix` という名前の 1 つのプロパティとして指定する方法です。この行列は、平行移動、左回転、拡大縮小、右回転、変換の原点をこの順に合成したものです。例は次のようになります。

```json5
{
    // ...
    "transform": {
        "matrix": [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ]
    }
}
```

2 つ目は、次の項目を任意に組み合わせた JSON オブジェクトを指定する方法で、この順に適用されます。

- `translation`: 相対的な平行移動。3 次元ベクトル( `[x, y, z]` )で指定し、ない場合のデフォルトは `[0, 0, 0]` です。
- `rotation` または `left_rotation`: 拡大縮小の前に適用する、移動後の原点を中心とした回転。デフォルトは回転なしです。次のいずれかの方法で指定します。
    - 1 つの軸と回転の対応を持つ JSON オブジェクト。例: `{"x": 90}`
    - それぞれ 1 つの軸と回転の対応を持つ JSON オブジェクトの配列。指定した順に適用されます。例: `[{"x": 90}, {"y": 45}, {"x": -22.5}]`
    - 各軸まわりの回転をそれぞれ指定する、3 つの値の配列。例: `[90, 45, -22.5]`
    - クォータニオンを直接指定する、4 つの値の配列。例: `[0.38268346, 0, 0, 0.9238795]`( = X 軸まわりに 45 度 )
- `scale`: 移動後の原点を基準にした拡大縮小。3 次元ベクトル( `[x, y, z]` )で指定し、ない場合のデフォルトは `[1, 1, 1]` です。
- `post_rotation` または `right_rotation`: 拡大縮小の後に適用する、移動後の原点を中心とした回転。デフォルトは回転なしです。`rotation` と同じ方法で指定します。
- `origin`: 回転と拡大縮小に使う原点。最後の手順として、変換もここに移動されます。3 次元ベクトル( `[x, y, z]` )で指定するか、3 つの組み込みの値 `"corner"`( = `[0, 0, 0]` )、`"center"`( = `[0.5, 0.5, 0.5]` )、`"opposing-corner"`( = `[1, 1, 1]`、デフォルト )のいずれかを使います。

## ブロックステートファイル {#blockstate-files}

_関連項目: [Minecraft Wiki][mcwiki] の[ブロックステートファイル][mcwikiblockstate]_

ブロックステートファイルは、異なる [blockstates] に異なるモデルを割り当てるためにゲームが使います。ゲームに登録した Block ごとに、ブロックステートファイルがちょうど 1 つ必要です。ブロックステートにブロックモデルを指定する方法は 2 つあり、互いに排他的です。variants による方法と、multipart による方法です。

`variants` ブロックの中には、ブロックステートごとに要素が 1 つあります。これはブロックステートとモデルを関連付ける主要な方法で、大多数の Block で使われています。
- キーは、Block 名を除いたブロックステートの文字列表現です。たとえば、水浸しでない上付きのハーフブロックなら `"type=top,waterlogged=false"`、プロパティのない Block なら `""` です。使わないプロパティは省略できる点は覚えておくとよいでしょう。たとえば、`waterlogged` プロパティが選ばれるモデルに影響しない場合、`type=top,waterlogged=false` と `type=top,waterlogged=true` の 2 つのオブジェクトを、1 つの `type=top` オブジェクトにまとめられます。これは、空文字列がどの Block でも有効であることも意味します。
- 値は、1 つのモデルオブジェクトか、モデルオブジェクトの配列です。モデルオブジェクトの配列を使うと、その中からランダムにモデルが選ばれます。モデルオブジェクトは次のデータからなります。
    - `model`: モデルファイルの場所を表すパスで、名前空間の `models` フォルダからの相対パスです。例: `minecraft:block/cobblestone`。
    - `x` と `y`: x 軸 / y 軸まわりのモデルの回転。90 度刻みに制限されています。どちらも任意で、デフォルトは 0 です。
    - `uvlock`: 回転するときにモデルの UV を固定するかどうか。任意で、デフォルトは false です。
    - `weight`: モデルオブジェクトの配列でのみ意味を持ちます。オブジェクトに重みを付け、ランダムなモデルオブジェクトを選ぶときに使われます。任意で、デフォルトは 1 です。

対照的に、`multipart` ブロックの中では、ブロックステートのプロパティに応じて要素が組み合わされます。この方法は主にフェンスや塀で使われており、真偽値のプロパティに基づいて 4 方向の部品を有効にします。multipart の要素は、`when` ブロックと `apply` ブロックの 2 つの部分からなります。

- `when` ブロックは、要素を適用するために満たすべき、ブロックステートの文字列表現か、プロパティのリストを指定します。リストには `"OR"` または `"AND"` という名前を付けられ、中身に対してそれぞれの論理演算を行います。単一のブロックステートとリストの値は、どちらも `|` で区切って複数の実際の値を指定することもできます( 例: `facing=east|facing=west` )。
- `apply` ブロックは、使うモデルオブジェクト、またはモデルオブジェクトの配列を指定します。これは `variants` ブロックとまったく同じように機能します。

## 着色 {#tinting}

草や葉など一部の Block は、位置やプロパティに応じてテクスチャの色を変えます。[モデルの要素][elements]では面に着色インデックスを指定でき、カラーハンドラがその面を扱えるようになります。コード側は 2 つの Event で処理します。1 つは Block のカラーハンドラ用、もう 1 つは Item のカラーハンドラ用です。どちらもよく似ているので、まず Block のハンドラを見てみましょう。

```java
@SubscribeEvent // on the mod event bus only on the physical client
public static void registerBlockColorHandlers(RegisterColorHandlersEvent.Block event) {
    // Parameters are the block's state, the level the block is in, the block's position, and the tint index.
    // The level and position may be null.
    event.register((state, level, pos, tintIndex) -> {
        // Replace with your own calculation. See the BlockColors class for vanilla references.
        // Colors are in ARGB format. Generally, if the tint index is -1, it means that no tinting
        // should take place and a default value should be used instead.
        return 0xFFFFFFFF;
    },
    // A varargs of blocks to apply the tinting to
    EXAMPLE_BLOCK.value(), ...);
}
```

Item のハンドラも、名前とラムダの引数が少し違うだけで、ほぼ同じです。

```java
@SubscribeEvent // on the mod event bus only on the physical client
public static void registerItemColorHandlers(RegisterColorHandlersEvent.Item event) {
    // Parameters are the item stack and the tint index.
    event.register((stack, tintIndex) -> {
        // Like above, replace with your own calculation. Vanilla values are in the ItemColors class.
        // Also like above, tint index -1 means no tint and should use a default value instead.
        return 0xFFFFFFFF;
    },
    // A varargs of items to apply the tinting to
    EXAMPLE_ITEM.value(), ...);
}
```

`item/generated` モデルは、各レイヤーに着色インデックスを指定している点に注意してください。`layer0` の着色インデックスは 0、`layer1` は 1、というようになります。また、BlockItem は Block ではなく Item なので、色を付けるには Item のカラーハンドラが必要なことも覚えておいてください。

## 追加のモデルの登録 {#registering-additional-models}

何らかの形で Block や Item に関連付けられていないものの、他の場面( [BlockEntityRenderer][ber] など )で必要なモデルは、`ModelEvent.RegisterAdditional` で登録できます。

```java
@SubscribeEvent // on the mod event bus only on the physical client
public static void registerAdditional(ModelEvent.RegisterAdditional event) {
    event.register(new ModelResourceLocation(
        // The id of the model
        ResourceLocation.fromNamespaceAndPath("examplemod", "block/example_unused_model"),
        // The string representing what variant of the model this is for
        // In normal vanilla, this would be one of three values:
        // - Blocks: The stringified block state
        // - Items: 'inventory' as it is the inventory model
        // - Standalone: 'standalone' as this does not refer to any other model
        "variant_type=true"
    ));

    // An inventory model example
    event.register(ModelResourceLocation.inventory(
        ResourceLocation.fromNamespaceAndPath("examplemod", "item/example_unused_inventory_model")
    ));

    // A standalone model example
    event.register(ModelResourceLocation.standalone(
        ResourceLocation.fromNamespaceAndPath("examplemod", "block/example_unused_standalone_model")
    ));
}
```

[ao]: https://en.wikipedia.org/wiki/Ambient_occlusion
[ber]: ../../../blockentities/ber.md
[bewlr]: ../../../blockentities/ber.md#blockentitywithoutlevelrenderer
[bsfile]: #blockstate-files
[custommodelloader]: modelloaders.md
[elements]: #elements
[event]: ../../../concepts/events.md
[eventhandler]: ../../../concepts/events.md#registering-an-event-handler
[extrafacedata]: #extra-face-data
[iscustomrenderer]: bakedmodel.md#others
[mcwiki]: https://minecraft.wiki
[mcwikiblockstate]: https://minecraft.wiki/w/Tutorials/Models#Block_states
[mcwikimodel]: https://minecraft.wiki/w/Model
[mipmapping]: https://en.wikipedia.org/wiki/Mipmap
[modbus]: ../../../concepts/events.md#event-buses
[overrides]: #overrides
[perspectives]: bakedmodel.md#perspectives
[rendertype]: #render-types
[roottransforms]: #root-transforms
[rl]: ../../../misc/resourcelocation.md
[side]: ../../../concepts/sides.md
[textures]: ../textures.md
[tinting]: #tinting
