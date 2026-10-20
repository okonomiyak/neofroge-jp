# Block {#blocks}

Block は Minecraft の世界に欠かせないものです。地形、構造物、機械はすべて Block でできています。Mod を作ろうと思っているなら、おそらく Block を追加したくなるでしょう。このページでは、Block の作り方と、Block でできることのいくつかを説明します。

## 唯一の Block {#one-block-to-rule-them-all}

始める前に、ゲーム内には各 Block が常に 1 つしか存在しないことを理解しておくことが重要です。ワールドは、その 1 つの Block へのさまざまな位置からの参照が何千と集まってできています。言い換えれば、同じ Block が何度も表示されているだけです。

このため、Block のインスタンス化は 1 回だけ、それも[登録][registration]の間に行うべきです。Block を登録したら、必要に応じて登録済みの参照を使えます。

他のほとんどの Registry と異なり、Block には `DeferredRegister.Blocks` という `DeferredRegister` の特化版を使えます。`DeferredRegister.Blocks` は基本的に `DeferredRegister<Block>` のように動作しますが、いくつか小さな違いがあります。

- 通常の `DeferredRegister.create(...)` メソッドではなく、`DeferredRegister.createBlocks("yourmodid")` で作成します。
- `#register` は `DeferredBlock<T extends Block>` を返します。これは `DeferredHolder<Block, T>` を継承しています。`T` は登録する Block のクラスの型です。
- Block を登録するためのヘルパーメソッドがいくつかあります。詳しくは[後述][below]を参照してください。

では、Block を登録してみましょう。

```java
//BLOCKS is a DeferredRegister.Blocks
public static final DeferredBlock<Block> MY_BLOCK = BLOCKS.register("my_block", () -> new Block(...));
```

Block を登録したら、新しい `my_block` への参照にはすべてこの定数を使います。たとえば、ある位置の Block が `my_block` かどうかを確認したい場合、コードは次のようになります。

```java
level.getBlockState(position) // returns the blockstate placed in the given level (world) at the given position
        //highlight-next-line
        .is(MyBlockRegistrationClass.MY_BLOCK);
```

この方法には、`block1 == block2` が機能し、Java の `equals` メソッドの代わりに使えるという便利な効果もあります(もちろん `equals` も機能しますが、いずれにせよ参照で比較するので意味がありません)。

:::danger
登録の外で `new Block()` を呼び出してはいけません!そうした時点で、問題が起きうるし、実際に起きます。

- Block は、Registry が凍結されていない間に作成する必要があります。NeoForge が Registry の凍結を解除し、後で再び凍結します。そのため、Block を作成できるのは登録の間だけです。
- Registry が再び凍結された後に Block を作成・登録しようとすると、ゲームはクラッシュし、Block が `null` だと報告されます。そのため、原因が非常にわかりにくくなります。
- それでも、どこにも登録されていない Block のインスタンスができてしまった場合、ゲームは同期や保存の際にそれを認識できず、空気に置き換えます。
:::

## Block の作成 {#creating-blocks}

前述のとおり、まず `DeferredRegister.Blocks` を作成します。

```java
public static final DeferredRegister.Blocks BLOCKS = DeferredRegister.createBlocks("yourmodid");
```

### 基本的な Block {#basic-blocks}

特別な機能が不要な単純な Block(丸石や木材など)には、`Block` クラスを直接使えます。そのためには、登録時に `BlockBehaviour.Properties` を引数として `Block` をインスタンス化します。この `BlockBehaviour.Properties` は `BlockBehaviour.Properties#of` で作成でき、メソッドを呼び出してカスタマイズできます。特に重要なメソッドは次のとおりです。

- `destroyTime` - Block の破壊にかかる時間を決めます。
    - 石の破壊時間は 1.5、土は 0.5、黒曜石は 50、岩盤は -1(破壊不可)です。
- `explosionResistance` - Block の爆発耐性を決めます。
    - 石の爆発耐性は 6.0、土は 0.5、黒曜石は 1,200、岩盤は 3,600,000 です。
- `sound` - Block を叩いたとき、壊したとき、置いたときの音を設定します。
    - デフォルト値は `SoundType.STONE` です。詳しくは[サウンドのページ][sounds]を参照してください。
- `lightLevel` - Block の発光を設定します。`BlockState` を引数に取り、0 から 15 の値を返す関数を受け取ります。
    - たとえば、グロウストーンは `state -> 15`、松明は `state -> 14` を使います。
- `friction` - Block の摩擦(滑りやすさ)を設定します。
    - デフォルト値は 0.6 です。氷は 0.98 を使います。

たとえば、簡単な実装は次のようになります。

```java
//BLOCKS is a DeferredRegister.Blocks
public static final DeferredBlock<Block> MY_BETTER_BLOCK = BLOCKS.register(
        "my_better_block", 
        () -> new Block(BlockBehaviour.Properties.of()
                //highlight-start
                .destroyTime(2.0f)
                .explosionResistance(10.0f)
                .sound(SoundType.GRAVEL)
                .lightLevel(state -> 7)
                //highlight-end
        ));
```

さらに詳しくは、`BlockBehaviour.Properties` のソースコードを参照してください。他の例や、Minecraft が使っている値を見たい場合は、`Blocks` クラスを確認してください。

:::note
ワールド内の Block と、インベントリ内のものは同じではないことを理解しておくことが重要です。インベントリ内で Block のように見えるものは、実際には `BlockItem` です。これは、使うと Block を設置する特別な種類の [Item][item] です。つまり、クリエイティブタブや最大スタック数などは、対応する `BlockItem` が扱います。

`BlockItem` は Block とは別に登録する必要があります。Block に Item が必要とは限らないためです。たとえば、回収されることを想定していない Block(火など)がそうです。
:::

### さらなる機能 {#more-functionality}

`Block` を直接使うだけでは、ごく基本的な Block しか作れません。プレイヤーとのインタラクションや異なる当たり判定などの機能を追加したい場合は、`Block` を継承したカスタムクラスが必要です。`Block` クラスには、さまざまな処理を行うためにオーバーライドできるメソッドが多数あります。詳しくは `Block`、`BlockBehaviour`、`IBlockExtension` の各クラスを参照してください。Block のよくある使い方のいくつかについては、下の [Block の使用][usingblocks]のセクションも参照してください。

異なるバリアントを持つ Block(下付き、上付き、2 段のバリアントを持つハーフブロックなど)を作りたい場合は、[ブロックステート][blockstates]を使ってください。そして、追加のデータを保存する Block(インベントリを保存するチェストなど)が必要な場合は、[BlockEntity][blockentities] を使ってください。目安として、状態の数が有限でそれなりに少ない(多くても数百程度)ならブロックステートを、無限またはほぼ無限なら BlockEntity を使います。

#### Block タイプ {#block-types}

Block タイプは、Block オブジェクトをシリアライズ・デシリアライズするための [`MapCodec`][codec] です。この `MapCodec` は `BlockBehaviour#codec` で設定し、Block タイプの Registry に[登録][registration]します。現在のところ、使われるのは Block 一覧のレポートを生成するときだけです。Block タイプは `Block` のサブクラスごとに 1 つ作成してください。たとえば、`FlowerBlock#CODEC` はほとんどの花の Block タイプを表しますが、そのサブクラスである `WitherRoseBlock` は別の Block タイプを持っています。

Block のサブクラスが `BlockBehaviour.Properties` だけを受け取る場合は、`BlockBehaviour#simpleCodec` を使って `MapCodec` を作成できます。

```java
// For some block subclass
public class SimpleBlock extends Block {

    public SimpleBlock(BlockBehavior.Properties properties) {
        // ...
    }

    @Override
    public MapCodec<SimpleBlock> codec() {
        return SIMPLE_CODEC.value();
    }
}

// In some registration class
public static final DeferredRegister<MapCodec<? extends Block>> REGISTRAR = DeferredRegister.create(BuiltInRegistries.BLOCK_TYPE, "yourmodid");

public static final DeferredHolder<MapCodec<? extends Block>, MapCodec<SimpleBlock>> SIMPLE_CODEC = REGISTRAR.register(
    "simple",
    () -> simpleCodec(SimpleBlock::new)
);
```

Block のサブクラスがそれ以上の引数を持つ場合は、[`RecordCodecBuilder#mapCodec`][codec] を使って `MapCodec` を作成し、`BlockBehaviour.Properties` の引数には `BlockBehaviour#propertiesCodec` を渡してください。

```java
// For some block subclass
public class ComplexBlock extends Block {

    public ComplexBlock(int value, BlockBehavior.Properties properties) {
        // ...
    }

    @Override
    public MapCodec<ComplexBlock> codec() {
        return COMPLEX_CODEC.value();
    }

    public int getValue() {
        return this.value;
    }
}

// In some registration class
public static final DeferredRegister<MapCodec<? extends Block>> REGISTRAR = DeferredRegister.create(BuiltInRegistries.BLOCK_TYPE, "yourmodid");

public static final DeferredHolder<MapCodec<? extends Block>, MapCodec<ComplexBlock>> COMPLEX_CODEC = REGISTRAR.register(
    "simple",
    () -> RecordCodecBuilder.mapCodec(instance ->
        instance.group(
            Codec.INT.fieldOf("value").forGetter(ComplexBlock::getValue),
            BlockBehaviour.propertiesCodec() // represents the BlockBehavior.Properties parameter
        ).apply(instance, ComplexBlock::new)
    );
);
```

:::note
Block タイプは現時点ではほとんど使われていませんが、Mojang が Codec 中心の構造への移行を進めるにつれ、今後重要になると予想されます。
:::

### `DeferredRegister.Blocks` のヘルパー {#deferredregisterblocks-helpers}

`DeferredRegister.Blocks` の作成方法と、それが `DeferredBlock` を返すことは[前述][above]しました。ここでは、この特化版の `DeferredRegister` が提供する他のユーティリティを見てみましょう。まずは `#registerBlock` です。

```java
public static final DeferredRegister.Blocks BLOCKS = DeferredRegister.createBlocks("yourmodid");

public static final DeferredBlock<Block> EXAMPLE_BLOCK = BLOCKS.registerBlock(
        "example_block",
        Block::new, // The factory that the properties will be passed into.
        BlockBehaviour.Properties.of() // The properties to use.
);
```

内部的には、渡された Block のファクトリ(通常はコンストラクタ)にプロパティの引数を適用し、`BLOCKS.register("example_block", () -> new Block(BlockBehaviour.Properties.of()))` を呼び出しているだけです。

`Block::new` を使う場合は、ファクトリを完全に省略できます。

```java
public static final DeferredBlock<Block> EXAMPLE_BLOCK = BLOCKS.registerSimpleBlock(
        "example_block",
        BlockBehaviour.Properties.of() // The properties to use.
);
```

これは前の例とまったく同じ処理ですが、少し短く書けます。もちろん、`Block` そのものではなく `Block` のサブクラスを使いたい場合は、前の方法を使う必要があります。

### リソース {#resources}

Block を登録してワールドに置くと、テクスチャなどが欠けていることに気づくでしょう。これは、[テクスチャ][textures]などが Minecraft のリソースシステムによって扱われるためです。Minecraft に新しい Block を追加するときは、次のファイルを手で書くか、[生成][datagen]する必要があります。

- [ブロックステートファイル][bsfile]
- [ブロックモデル][model]
- [翻訳][i18n]
- [ルートテーブル][loottable]
- 採掘用などのブロック[タグ][tags]

これらすべてについて、似たバニラの Block のファイルやデータジェネレーターも参考にしてください。

## Block の使用 {#using-blocks}

Block を直接使って何かをすることはほとんどありません。実際、Minecraft 全体で最もよく行われる操作であろう 2 つ、つまりある位置の Block の取得と、ある位置への Block の設置は、Block ではなくブロックステートを使います。一般的な設計方針は、Block が動作を定義し、その動作を実際にはブロックステートを通して実行するというものです。このため、`BlockState` は `Block` のメソッドに引数として渡されることがよくあります。ブロックステートの使い方や、Block からブロックステートを取得する方法について詳しくは、[ブロックステートの使用][usingblockstates]を参照してください。

いくつかの場面では、`Block` の複数のメソッドが異なるタイミングで使われます。以下のサブセクションでは、Block に関するよくある処理の流れ(パイプライン)を挙げます。特に断りのない限り、すべてのメソッドは両方の論理 Side で呼ばれ、両方の Side で同じ結果を返す必要があります。

### Block の設置 {#placing-a-block}

Block の設置ロジックは `BlockItem#useOn`(またはそのサブクラスの実装。たとえばスイレンの葉に使われる `PlaceOnWaterBlockItem` など)から呼ばれます。ゲームがそこに至るまでの流れについて詳しくは、[インタラクションパイプライン][interactionpipeline]を参照してください。実際には、`BlockItem`(たとえば丸石のアイテム)が右クリックされた時点で、この動作が呼ばれます。

- いくつかの前提条件がチェックされます。たとえば、スペクテイターモードでないこと、Block に必要なすべてのフィーチャーフラグが有効であること、対象の位置がワールドボーダーの外でないことなどです。これらのチェックのうち 1 つでも失敗すると、パイプラインは終了します。
- Block を設置しようとしている位置に現在ある Block に対して、`BlockBehaviour#canBeReplaced` が呼ばれます。`false` を返すと、パイプラインは終了します。ここで `true` を返す代表的な例は、背の高い草や雪の層です。
- `Block#getStateForPlacement` が呼ばれます。ここでは、コンテキスト(位置、回転、Block が設置される面などの情報を含む)に応じて、異なるブロックステートを返せます。これは、たとえば異なる向きに設置できる Block に便利です。
- 前のステップで得たブロックステートで、`BlockBehaviour#canSurvive` が呼ばれます。`false` を返すと、パイプラインは終了します。
- `Level#setBlock` の呼び出しによって、ブロックステートがレベルに設定されます。
    - その `Level#setBlock` の呼び出しの中で、`BlockBehaviour#onPlace` が呼ばれます。
- `Block#setPlacedBy` が呼ばれます。

### Block の破壊 {#breaking-a-block}

Block の破壊は時間がかかるため、少し複雑です。この処理は、おおまかに「開始」「採掘」「実際の破壊」の 3 段階に分けられます。

- 左クリックすると、「開始」段階に入ります。
- 続いて左クリックを押し続ける必要があり、「採掘」段階に入ります。**この段階のメソッドは毎 tick 呼ばれます。**
- 「継続」段階が(左クリックを離すことで)中断されず、Block が壊れると、「実際の破壊」段階に入ります。

疑似コードで書くと次のようになります。

```java
leftClick();
initiatingStage();
while (leftClickIsBeingHeld()) {
    miningStage();
    if (blockIsBroken()) {
        actuallyBreakingStage();
        break;
    }
}
```

以下のサブセクションでは、これらの段階を実際のメソッド呼び出しにさらに分解します。

#### 「開始」段階 {#the-initiating-stage}

- クライアントのみ: 左クリックとメインハンドで `InputEvent.InteractionKeyMappingTriggered` が発火されます。Event がキャンセルされると、パイプラインは終了します。
- いくつかの前提条件がチェックされます。たとえば、スペクテイターモードでないこと、メインハンドの `ItemStack` に必要なすべてのフィーチャーフラグが有効であること、対象の Block がワールドボーダーの外でないことなどです。これらのチェックのうち 1 つでも失敗すると、パイプラインは終了します。
- `PlayerInteractEvent.LeftClickBlock` が発火されます。Event がキャンセルされると、パイプラインは終了します。
    - クライアントで Event をキャンセルすると、パケットがサーバーに送られないため、サーバー側のロジックは何も実行されない点に注意してください。
    - 一方、サーバーでこの Event をキャンセルしてもクライアントのコードは実行されるため、非同期の原因になることがあります!
- `Block#attack` が呼ばれます。

#### 「採掘」段階 {#the-mining-stage}

- `PlayerInteractEvent.LeftClickBlock` が発火されます。Event がキャンセルされると、パイプラインは「終了」段階に移ります。
    - クライアントで Event をキャンセルすると、パケットがサーバーに送られないため、サーバー側のロジックは何も実行されない点に注意してください。
    - 一方、サーバーでこの Event をキャンセルしてもクライアントのコードは実行されるため、非同期の原因になることがあります!
- `Block#getDestroyProgress` が呼ばれ、その値が内部の破壊進行度カウンターに加算されます。
    - `Block#getDestroyProgress` は 0 から 1 の float 値を返し、毎 tick 破壊進行度カウンターをどれだけ増やすかを表します。
- それに応じて、進行度のオーバーレイ(ひび割れのテクスチャ)が更新されます。
- 破壊進行度が 1.0 を超えると(つまり完了し、Block が壊れるべき状態になると)、「採掘」段階を抜けて「実際の破壊」段階に入ります。

#### 「実際の破壊」段階 {#the-actually-breaking-stage}

- `Item#canAttackBlock` が呼ばれます。`false` を返す(Block を壊すべきでないと判断した)と、パイプラインは「終了」段階に移ります。
- Block が `GameMasterBlock` のインスタンスの場合、`Player#canUseGameMasterBlocks` が呼ばれます。これは、プレイヤーがクリエイティブ専用の Block を破壊できるかどうかを判定します。`false` の場合、パイプラインは「終了」段階に移ります。
- サーバーのみ: `Player#blockActionRestricted` が呼ばれます。これは、現在のプレイヤーがその Block を壊せないかどうかを判定します。`true` の場合、パイプラインは「終了」段階に移ります。
- サーバーのみ: `BlockEvent.BreakEvent` が発火されます。キャンセルされた場合、または `getExpToDrop` が -1 を返した場合、パイプラインは「終了」段階に移ります。キャンセル状態の初期値は、上記の 3 つのメソッドによって決まります。
    - サーバーのみ: `PlayerEvent.HarvestCheck` が発火されます。`HarvestCheck#canHarvest` が `false` を返すか、破壊 Event に渡された `BlockState` が null の場合、Event の経験値の初期値は 0 になります。
    - サーバーのみ: `PlayerEvent.HarvestCheck#canHarvest` が `true` を返した場合、`IBlockExtension#getExpDrop` が呼ばれます。この値は `BlockEvent.BreakEvent#getExpToDrop` に渡され、パイプラインの後の段階で使われます。
- サーバーのみ: `IBlockExtension#canHarvestBlock` が呼ばれます。これは、Block を収穫できる、つまりドロップ付きで壊せるかどうかを判定します。
- `IBlockExtension#onDestroyedByPlayer` が呼ばれます。`false` を返すと、パイプラインは「終了」段階に移ります。その `IBlockExtension#onDestroyedByPlayer` の呼び出しの中では、次の処理が行われます。
    - `Block#playerWillDestroy` が呼ばれます。
    - ブロックステートの引数に `Blocks.AIR.defaultBlockState()` を渡した `Level#setBlock` の呼び出しによって、ブロックステートがレベルから取り除かれます。
        - その `Level#setBlock` の呼び出しの中で、`Block#onRemove` が呼ばれます。
- `Block#destroy` が呼ばれます。
- サーバーのみ: 先の `IBlockExtension#canHarvestBlock` の呼び出しが `true` を返していた場合、`Block#playerDestroy` が呼ばれます。
    - サーバーのみ: `Block#dropResources` が呼ばれます。これは、採掘したときに Block から何がドロップするかを決めます。
        - サーバーのみ: `BlockDropsEvent` が発火されます。Event がキャンセルされると、Block が壊れても何もドロップしません。そうでなければ、`BlockDropsEvent#getDrops` 内のすべての `ItemEntity` が現在のレベルに追加されます。
- サーバーのみ: 先の `IBlockExtension#getExpDrop` の呼び出しが 0 より大きい値を返していた場合、その結果を使って `Block#popExperience` が呼ばれます。

### tick 処理 {#ticking}

tick 処理は、ゲームの各部分を 1/20 秒、つまり 50 ミリ秒(「1 tick」)ごとに更新(tick)する仕組みです。Block には、それぞれ異なる方法で呼ばれる複数の tick 用メソッドがあります。

#### サーバーの tick とスケジュールされた tick {#server-ticking-and-tick-scheduling}

`BlockBehaviour#tick` は、スケジュールされた tick によって呼ばれます。スケジュールされた tick は `Level#scheduleTick(BlockPos, Block, int)` で作成できます。`int` は遅延を表します。これはバニラのさまざまな場所で使われています。たとえば、大きなドリップリーフが傾く仕組みは、このシステムに大きく依存しています。他の代表的な利用例は、さまざまなレッドストーン部品です。

#### クライアントの tick {#client-ticking}

`Block#animateTick` は、クライアントでのみ毎フレーム呼ばれます。松明のパーティクルの発生など、クライアント専用の動作はここで行われます。

#### 天候の tick {#weather-ticking}

天候の tick は `Block#handlePrecipitation` で処理され、通常の tick とは独立して動きます。サーバーでのみ、何らかの形で雨が降っているときにだけ、1/16 の確率で呼ばれます。これは、たとえば雨や雪で水が溜まる大釜に使われています。

#### ランダム tick {#random-ticking}

ランダム tick のシステムは、通常の tick とは独立して動きます。ランダム tick は、Block の `BlockBehaviour.Properties` で `BlockBehaviour.Properties#randomTicks()` メソッドを呼び出して有効にする必要があります。これにより、その Block がランダム tick の仕組みの対象になります。

ランダム tick は毎 tick、チャンク内の一定数の Block に対して発生します。その数は `randomTickSpeed` ゲームルールで定義されます。デフォルト値の 3 では、毎 tick、チャンクからランダムに 3 つの Block が選ばれます。それらの Block でランダム tick が有効になっていれば、それぞれの `BlockBehaviour#randomTick` メソッドが呼ばれます。

ランダム tick は、植物の成長、氷や雪の融解、銅の酸化など、Minecraft のさまざまな仕組みで使われています。

[above]: #one-block-to-rule-them-all
[below]: #deferredregisterblocks-helpers
[blockentities]: ../blockentities/index.md
[blockstates]: states.md
[bsfile]: ../resources/client/models/index.md#blockstate-files
[codec]: ../datastorage/codecs.md#records
[datagen]: ../resources/index.md#data-generation
[events]: ../concepts/events.md
[i18n]: ../resources/client/i18n.md
[interactionpipeline]: ../items/interactionpipeline.md
[item]: ../items/index.md
[loottable]: ../resources/server/loottables/index.md
[model]: ../resources/client/models/index.md
[registration]: ../concepts/registries.md#methods-for-registering
[resources]: ../resources/index.md#assets
[sounds]: ../resources/client/sounds.md
[tags]: ../resources/server/tags.md
[textures]: ../resources/client/textures.md
[usingblocks]: #using-blocks
[usingblockstates]: states.md#using-blockstates
