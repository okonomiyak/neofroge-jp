# ブロックステート {#blockstates}

Block に異なる状態を持たせたい場面はよくあります。たとえば、小麦の作物には 8 段階の成長段階があり、段階ごとに別の Block を作るのは不自然です。あるいは、ハーフブロックやそれに似た Block には、下側の状態、上側の状態、両方そろった状態があります。

そこで登場するのがブロックステートです。ブロックステートを使うと、成長段階やハーフブロックの設置位置など、Block が取りうるさまざまな状態を簡単に表せます。

## ブロックステートのプロパティ {#blockstate-properties}

ブロックステートは、プロパティの仕組みを使います。Block は、さまざまな型のプロパティを複数持てます。たとえば、エンドポータルフレームには 2 つのプロパティがあります。目がはまっているかどうか(`eye`、2 通り)と、どの向きに設置されているか(`facing`、4 通り)です。つまり、エンドポータルフレームには全部で 8 通り(2 × 4)のブロックステートがあります。

```
minecraft:end_portal_frame[facing=north,eye=false]
minecraft:end_portal_frame[facing=east,eye=false]
minecraft:end_portal_frame[facing=south,eye=false]
minecraft:end_portal_frame[facing=west,eye=false]
minecraft:end_portal_frame[facing=north,eye=true]
minecraft:end_portal_frame[facing=east,eye=true]
minecraft:end_portal_frame[facing=south,eye=true]
minecraft:end_portal_frame[facing=west,eye=true]
```

`blockid[property1=value1,property2=value,...]` という表記は、ブロックステートをテキストで表す標準的な方法で、コマンドなどバニラのいくつかの場所で使われています。

Block にブロックステートのプロパティが 1 つも定義されていなくても、ブロックステートはちょうど 1 つあります。指定するプロパティがないので、プロパティを持たないブロックステートです。これは `minecraft:oak_planks[]`、または単に `minecraft:oak_planks` と表せます。

Block と同じく、すべての `BlockState` はメモリ上にちょうど 1 つだけ存在します。つまり、`BlockState` の比較には `==` を使うことができ、また使うべきです。`BlockState` は final クラスでもあるため、継承できません。**機能はすべて、対応する [Block][block] クラスに実装してください!**

## ブロックステートを使うべきとき {#when-to-use-blockstates}

### ブロックステートか、別の Block か {#blockstates-vs-separate-blocks}

よい目安は、**名前が異なるなら別の Block にすべき**というものです。たとえば椅子の Block を作る場合、椅子の向きはプロパティにすべきですが、木材の種類が違うものは別々の Block に分けるべきです。つまり、木材の種類ごとに椅子の Block を 1 つずつ作り、それぞれの椅子の Block が 4 つのブロックステート(向きごとに 1 つ)を持つことになります。

### ブロックステートか、[BlockEntity][blockentity] か {#blockstates-vs-block-entities}

ここでの目安は、**状態の数が有限ならブロックステートを、無限またはほぼ無限なら BlockEntity を使う**というものです。BlockEntity は任意の量のデータを保存できますが、ブロックステートより遅くなります。

ブロックステートと BlockEntity は組み合わせて使えます。たとえばチェストは、向き、水浸しかどうか、ラージチェストになっているかどうかといったものにはブロックステートのプロパティを使い、インベントリの保存、現在開いているかどうか、ホッパーとのやりとりは BlockEntity で扱っています。

「ブロックステートには、いくつ以上の状態があると多すぎるのか」という問いに決定的な答えはありません。ただ、8〜9 ビットを超えるデータ(つまり数百を超える状態)が必要なら、代わりに BlockEntity を使うことをおすすめします。

## ブロックステートの実装 {#implementing-blockstates}

ブロックステートのプロパティを実装するには、Block クラスで `public static final Property<?>` 定数を作成するか、既存のものを参照します。独自の `Property<?>` 実装を作ることもできますが、バニラのコードには、ほとんどの用途をカバーできる便利な実装がいくつか用意されています。

- `IntegerProperty`
    - `Property<Integer>` を実装します。整数値を保持するプロパティを定義します。負の値はサポートされない点に注意してください。
    - `IntegerProperty#create(String propertyName, int minimum, int maximum)` を呼び出して作成します。
- `BooleanProperty`
    - `Property<Boolean>` を実装します。`true` か `false` の値を保持するプロパティを定義します。
    - `BooleanProperty#create(String propertyName)` を呼び出して作成します。
- `EnumProperty<E extends Enum<E>>`
    - `Property<E>` を実装します。Enum クラスの値を取るプロパティを定義します。
    - `EnumProperty#create(String propertyName, Class<E> enumClass)` を呼び出して作成します。
    - Enum の値の一部だけ(例: 16 種類の `DyeColor` のうち 4 つ)を使うこともできます。`EnumProperty#create` のオーバーロードを参照してください。
- `DirectionProperty`
    - `EnumProperty<Direction>` を継承します。`Direction` を取るプロパティを定義します。
    - `DirectionProperty#create(String propertyName)` を呼び出して作成します。
    - 便利な述語がいくつか用意されています。たとえば、東西南北の方向を表すプロパティを得るには `DirectionProperty.create("<name>", Direction.Plane.HORIZONTAL)` を、X 方向を得るには `DirectionProperty.create("<name>", Direction.Axis.X)` を呼び出します。

`BlockStateProperties` クラスには、バニラで共有されているプロパティが含まれています。独自のプロパティを作る代わりに、できる限りこれらを使うか参照してください。

プロパティの定数ができたら、Block クラスで `Block#createBlockStateDefinition(StateDefinition$Builder)` をオーバーライドします。そのメソッド内で `StateDefinition.Builder#add(YOUR_PROPERTY);` を呼び出します。`StateDefinition.Builder#add` は可変長引数を取るので、プロパティが複数ある場合は一度にすべて追加できます。

すべての Block にはデフォルトの状態もあります。特に指定しなければ、デフォルトの状態では各プロパティのデフォルト値が使われます。デフォルトの状態は、コンストラクタから `Block#registerDefaultState(BlockState)` メソッドを呼び出して変更できます。

Block を設置したときに使われる `BlockState` を変えたい場合は、`Block#getStateForPlacement(BlockPlaceContext)` をオーバーライドします。これを使うと、たとえばプレイヤーが設置したときの立ち位置や視線の向きに応じて、Block の向きを設定できます。

具体例として、`EndPortalFrameBlock` クラスの関連部分は次のようになっています。

```java
public class EndPortalFrameBlock extends Block {
    // Note: It is possible to directly use the values in BlockStateProperties instead of referencing them here again.
    // However, for the sake of simplicity and readability, it is recommended to add constants like this.
    public static final DirectionProperty FACING = BlockStateProperties.FACING;
    public static final BooleanProperty EYE = BlockStateProperties.EYE;

    public EndPortalFrameBlock(BlockBehaviour.Properties pProperties) {
        super(pProperties);
        // stateDefinition.any() returns a random BlockState from an internal set,
        // we don't care because we're setting all values ourselves anyway
        registerDefaultState(stateDefinition.any()
                .setValue(FACING, Direction.NORTH)
                .setValue(EYE, false)
        );
    }

    @Override
    protected void createBlockStateDefinition(StateDefinition.Builder<Block, BlockState> pBuilder) {
        // this is where the properties are actually added to the state
        pBuilder.add(FACING, EYE);
    }

    @Override
    @Nullable
    public BlockState getStateForPlacement(BlockPlaceContext pContext) {
        // code that determines which state will be used when
        // placing down this block, depending on the BlockPlaceContext
    }
}
```

## ブロックステートの使用 {#using-blockstates}

`Block` から `BlockState` を得るには、`Block#defaultBlockState()` を呼び出します。デフォルトのブロックステートは、前述のとおり `Block#registerDefaultState` で変更できます。

プロパティの値を取得するには、値を取得したいプロパティを渡して `BlockState#getValue(Property<?>)` を呼び出します。先ほどのエンドポータルフレームの例を使うと、次のようになります。

```java
// EndPortalFrameBlock.FACING is a DirectionProperty and thus can be used to obtain a Direction from the BlockState
Direction direction = endPortalFrameBlockState.getValue(EndPortalFrameBlock.FACING);
```

値の組み合わせが異なる `BlockState` を得たい場合は、既存のブロックステートに対して、プロパティとその値を渡して `BlockState#setValue(Property<T>, T)` を呼び出すだけです。レバーの例では、次のようになります。(訳注: 原文は「レバー」ですが、コード例はエンドポータルフレームのものです)

```java
endPortalFrameBlockState = endPortalFrameBlockState.setValue(EndPortalFrameBlock.FACING, Direction.SOUTH);
```

:::note
`BlockState` はイミュータブル(不変)です。つまり、`#setValue(Property<T>, T)` を呼び出しても、実際にブロックステートが変更されるわけではありません。内部で検索が行われ、要求したブロックステートのオブジェクトが返されます。それは、まさにそのプロパティ値の組み合わせを持つ、ただ 1 つのオブジェクトです。そのため、`state#setValue` を呼び出すだけで、結果を変数に(たとえば `state` に)保存しなければ、何も起きません。
:::

レベルから `BlockState` を取得するには、`Level#getBlockState(BlockPos)` を使います。

### `Level#setBlock`

レベルに `BlockState` を設定するには、`Level#setBlock(BlockPos, BlockState, int)` を使います。

`int` の引数は意味がすぐにはわからないため、少し説明が必要です。これは更新フラグと呼ばれるものを表します。

更新フラグを正しく設定しやすいように、`Block` には `UPDATE_` で始まる `int` 定数がいくつかあります。これらを組み合わせたい場合は、ビット単位の OR で結合できます(例: `Block.UPDATE_NEIGHBORS | Block.UPDATE_CLIENTS`)。

- `Block.UPDATE_NEIGHBORS` は、隣接する Block に更新を送ります。具体的には `Block#neighborChanged` を呼び出し、そこから多くのメソッドが呼ばれます。その多くは何らかの形でレッドストーンに関係しています。
- `Block.UPDATE_CLIENTS` は、Block の更新をクライアントに同期します。
- `Block.UPDATE_INVISIBLE` は、明示的にクライアントで更新しないようにします。これは `Block.UPDATE_CLIENTS` よりも優先され、更新は同期されません。サーバーでは Block は常に更新されます。
- `Block.UPDATE_IMMEDIATE` は、クライアントのメインスレッドで強制的に再描画させます。
- `Block.UPDATE_KNOWN_SHAPE` は、隣接更新の再帰を止めます。
- `Block.UPDATE_SUPPRESS_DROPS` は、その位置にあった古い Block のドロップを無効にします。
- `Block.UPDATE_MOVE_BY_PISTON` は、Block がピストンで動かされたことを示すために、ピストンのコードでのみ使われます。主に、光源エンジンの更新を遅らせる役割を担います。
- `Block.UPDATE_ALL` は `Block.UPDATE_NEIGHBORS | Block.UPDATE_CLIENTS` の別名です。
- `Block.UPDATE_ALL_IMMEDIATE` は `Block.UPDATE_NEIGHBORS | Block.UPDATE_CLIENTS | Block.UPDATE_IMMEDIATE` の別名です。
- `Block.NONE` は `Block.UPDATE_INVISIBLE` の別名です。

内部で `setBlock(pos, state, Block.UPDATE_ALL)` を呼び出す便利なメソッド、`Level#setBlockAndUpdate(BlockPos pos, BlockState state)` もあります。

[block]: index.md
[blockentity]: ../blockentities/index.md
