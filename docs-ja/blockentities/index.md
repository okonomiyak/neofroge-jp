# BlockEntity {#block-entities}

BlockEntity を使うと、[ブロックステート][blockstate]が適さない場合に、[Block][block] にデータを保存できます。特に、インベントリのように取りうる値が有限でないデータの場合です。BlockEntity は静止していて Block に結び付いていますが、それ以外の点ではエンティティと多くの共通点があります。名前の由来はそこです。

:::note
Block が取りうる状態の数が有限でそれなりに少ない(多くても数百程度)なら、代わりに[ブロックステート][blockstate]を使うことを検討してください。
:::

## BlockEntity の作成と登録 {#creating-and-registering-block-entities}

エンティティと同様に、また Block とは異なり、`BlockEntity` クラスは BlockEntity のインスタンスを表すもので、[登録][registration]されたシングルトンのオブジェクトではありません。シングルトンは、代わりに `BlockEntityType<?>` クラスで表されます。新しい BlockEntity を作るには、この両方が必要です。

まず、BlockEntity のクラスを作成しましょう。

```java
public class MyBlockEntity extends BlockEntity {
    public MyBlockEntity(BlockPos pos, BlockState state) {
        super(type, pos, state);
    }
}
```

お気づきかもしれませんが、親のコンストラクタに未定義の変数 `type` を渡しています。この未定義の変数はいったんそのままにして、先に登録に移りましょう。

登録はエンティティと同じような方法で行います。対応するシングルトンのクラス `BlockEntityType<?>` のインスタンスを作成し、次のように BlockEntity タイプの Registry に登録します。

```java
public static final DeferredRegister<BlockEntityType<?>> BLOCK_ENTITY_TYPES =
        DeferredRegister.create(Registries.BLOCK_ENTITY_TYPE, ExampleMod.MOD_ID);

public static final Supplier<BlockEntityType<MyBlockEntity>> MY_BLOCK_ENTITY = BLOCK_ENTITY_TYPES.register(
        "my_block_entity",
        // The block entity type, created using a builder.
        () -> BlockEntityType.Builder.of(
                // The supplier to use for constructing the block entity instances.
                MyBlockEntity::new,
                // A vararg of blocks that can have this block entity.
                // This assumes the existence of the referenced blocks as DeferredBlock<Block>s.
                MyBlocks.MY_BLOCK_1.get(), MyBlocks.MY_BLOCK_2.get()
        )
        // Build using null; vanilla does some datafixer shenanigans with the parameter that we don't need.
        .build(null)
);
```

BlockEntity タイプができたので、先ほど残しておいた `type` 変数の代わりに使えます。

```java
public class MyBlockEntity extends BlockEntity {
    public MyBlockEntity(BlockPos pos, BlockState state) {
        super(MY_BLOCK_ENTITY.get(), pos, state);
    }
}
```

:::info
このようなわかりにくい手順になっている理由は、`BlockEntityType.Builder#of` が `BlockEntityType.BlockEntitySupplier<T extends BlockEntity>` を受け取るためです。これは基本的に `BiFunction<BlockPos, BlockState, T extends BlockEntity>` です。そのため、`::new` で直接参照できるコンストラクタがあると非常に便利です。一方で、構築した BlockEntity タイプを `BlockEntity` の唯一のデフォルトコンストラクタに渡す必要もあるため、参照を少しやりとりしなければなりません。
:::

最後に、BlockEntity に対応する Block のクラスを変更する必要があります。つまり、単純な `Block` のインスタンスには BlockEntity を付けられないので、サブクラスが必要です。

```java
// The important part is implementing the EntityBlock interface and overriding the #newBlockEntity method.
public class MyEntityBlock extends Block implements EntityBlock {
    // Constructor deferring to super.
    public MyEntityBlock(BlockBehaviour.Properties properties) {
        super(properties);
    }

    // Return a new instance of our block entity here.
    @Override
    public BlockEntity newBlockEntity(BlockPos pos, BlockState state) {
        return new MyBlockEntity(pos, state);
    }
}
```

そしてもちろん、Block の登録ではこのクラスを型として使う必要があります。

```java
public static final DeferredBlock<MyEntityBlock> MY_BLOCK_1 =
        BLOCKS.register("my_block_1", () -> new MyEntityBlock( /* ... */ ));
public static final DeferredBlock<MyEntityBlock> MY_BLOCK_2 =
        BLOCKS.register("my_block_2", () -> new MyEntityBlock( /* ... */ ));
```

## データの保存 {#storing-data}

`BlockEntity` の主な目的の一つは、データの保存です。BlockEntity へのデータの保存方法は 2 つあります。[NBT][nbt] を直接読み書きする方法と、[データアタッチメント][dataattachments]を使う方法です。このセクションでは NBT の直接の読み書きを扱います。データアタッチメントについては、リンク先の記事を参照してください。

:::info
データアタッチメントの主な目的は、その名のとおり、バニラや他の Mod が提供するものなど、既存の BlockEntity にデータを付け加えることです。自分の Mod の BlockEntity では、NBT に直接保存・読み込みするほうが望ましいです。
:::

`CompoundTag` へのデータの読み込みと書き込みには、それぞれ `#loadAdditional` メソッドと `#saveAdditional` メソッドを使います。これらのメソッドは、BlockEntity がディスクに、またはネットワーク経由で同期されるときに呼ばれます。

```java
public class MyBlockEntity extends BlockEntity {
    // This can be any value of any type you want, so long as you can somehow serialize it to NBT.
    // We will use an int for the sake of example.
    private int value;

    public MyBlockEntity(BlockPos pos, BlockState state) {
        super(MY_BLOCK_ENTITY.get(), pos, state);
    }

    // Read values from the passed CompoundTag here.
    @Override
    public void loadAdditional(CompoundTag tag, HolderLookup.Provider registries) {
        super.loadAdditional(tag, registries);
        // Will default to 0 if absent. See the NBT article for more information.
        this.value = tag.getInt("value");
    }

    // Save values into the passed CompoundTag here.
    @Override
    public void saveAdditional(CompoundTag tag, HolderLookup.Provider registries) {
        super.saveAdditional(tag, registries);
        tag.putInt("value", this.value);
    }
}
```

どちらのメソッドでも、super を呼び出すことが重要です。位置などの基本的な情報がそこで追加されるためです。タグ名 `id`、`x`、`y`、`z`、`NeoForgeData`、`neoforge:attachments` は親メソッドで予約されているため、自分で使わないでください。

もちろん、デフォルト値で扱うだけでなく、他の値も設定したくなるでしょう。他のフィールドと同じように、自由に設定できます。ただし、ゲームにその変更を保存させたい場合は、その後で `#setChanged()` を呼び出す必要があります。これにより、BlockEntity のチャンクがダーティ(保存が必要な状態)としてマークされます。このメソッドを呼ばないと、保存時にその BlockEntity が飛ばされることがあります。Minecraft の保存システムは、ダーティとマークされたチャンクしか保存しないためです。

## ティッカー {#tickers}

BlockEntity のもう一つのよくある使い方は、保存したデータと組み合わせることの多い tick 処理です。tick 処理とは、ゲームの tick ごとに何らかのコードを実行することです。これは、`EntityBlock#getTicker` をオーバーライドして、`BlockEntityTicker` を返すことで行います。これは基本的に、4 つの引数(レベル、位置、ブロックステート、BlockEntity)を取る Consumer です。

```java
// Note: The ticker is defined in the block, not the block entity. However, it is good practice to
// keep the ticking logic in the block entity in some way, for example by defining a static #tick method.
public class MyEntityBlock extends Block implements EntityBlock {
    // other stuff here

    // We use a second method here due to generic conversions
    // If extending `BaseEntityBlock`, this method is also available there as a protected static method
    private static <E extends BlockEntity, A extends BlockEntity> @Nullable BlockEntityTicker<A> createTickerHelper(
        BlockEntityType<A> type, BlockEntityType<E> checkedType, BlockEntityTicker<? super E> ticker
    ) {
        return checkedType == type ? (BlockEntityTicker<A>) ticker : null;
    }

    @Override
    public <T extends BlockEntity> BlockEntityTicker<T> getTicker(Level level, BlockState state, BlockEntityType<T> type) {
        // You can return different tickers here, depending on whatever factors you want. A common use case would be
        // to return different tickers on the client or server, only tick one side to begin with,
        // or only return a ticker for some blockstates (e.g. when using a "my machine is working" blockstate property).
        return createTickerHelper(type, MY_BLOCK_ENTITY.get(), MyBlockEntity::tick);
    }
}

public class MyBlockEntity extends BlockEntity {
    // other stuff here

    // The signature of this method matches the signature of the BlockEntityTicker functional interface.
    public static void tick(Level level, BlockPos pos, BlockState state, MyBlockEntity blockEntity) {
        // Whatever you want to do during ticking.
        // For example, you could change a crafting progress value or consume power here.
    }
}
```

`#tick` メソッドは実際に毎 tick 呼ばれる点に注意してください。そのため、できる限りここで複雑な計算を大量に行うのは避けるべきです。たとえば、X tick ごとにだけ計算する、結果をキャッシュするなどの方法があります。

## 同期 {#syncing}

BlockEntity のロジックは、通常サーバーで実行されます。そのため、何をしているかをクライアントに伝える必要があります。その方法は 3 つあります。チャンクの読み込み時、Block の更新時、カスタムパケットの使用です。ネットワークを無駄に詰まらせないよう、一般に情報の同期は必要なときだけにしてください。

### チャンク読み込み時の同期 {#syncing-on-chunk-load}

チャンクは、ネットワークまたはディスクから読み取られるたびに読み込まれます(そして、この方法が使われます)。ここでデータを送るには、次のメソッドをオーバーライドする必要があります。

```java
public class MyBlockEntity extends BlockEntity {
    // ...

    // Create an update tag here. For block entities with only a few fields, this can just call #saveAdditional.
    @Override
    public CompoundTag getUpdateTag(HolderLookup.Provider registries) {
        CompoundTag tag = new CompoundTag();
        saveAdditional(tag, registries);
        return tag;
    }

    // Handle a received update tag here. The default implementation calls #loadAdditional here,
    // so you do not need to override this method if you don't plan to do anything beyond that.
    @Override
    public void handleUpdateTag(CompoundTag tag, HolderLookup.Provider registries) {
        super.handleUpdateTag(tag, registries);
    }
}
```

### Block 更新時の同期 {#syncing-on-block-update}

この方法は、Block の更新が起きるたびに使われます。Block の更新は手動で発生させる必要がありますが、一般にチャンクの同期より速く処理されます。

```java
public class MyBlockEntity extends BlockEntity {
    // ...

    // Create an update tag here, like above.
    @Override
    public CompoundTag getUpdateTag(HolderLookup.Provider registries) {
        CompoundTag tag = new CompoundTag();
        saveAdditional(tag, registries);
        return tag;
    }

    // Return our packet here. This method returning a non-null result tells the game to use this packet for syncing.
    @Override
    public Packet<ClientGamePacketListener> getUpdatePacket() {
        // The packet uses the CompoundTag returned by #getUpdateTag. An alternative overload of #create exists
        // that allows you to specify a custom update tag, including the ability to omit data the client might not need.
        return ClientboundBlockEntityDataPacket.create(this);
    }

    // Optionally: Run some custom logic when the packet is received.
    // The super/default implementation forwards to #loadAdditional.
    @Override
    public void onDataPacket(Connection connection, ClientboundBlockEntityDataPacket packet, HolderLookup.Provider registries) {
        super.onDataPacket(connection, packet, registries);
        // Do whatever you need to do here.
    }
}
```

実際にパケットを送るには、サーバーで `Level#sendBlockUpdated(BlockPos pos, BlockState oldState, BlockState newState, int flags)` を呼び出して、更新通知を発生させる必要があります。位置には BlockEntity の位置を指定します。これは `BlockEntity#getBlockPos` で取得できます。2 つのブロックステートの引数には、どちらも BlockEntity の位置にあるブロックステートを渡せます。これは `BlockEntity#getBlockState` で取得できます。最後の `flags` 引数は、[`Level#setBlock`][setblock] で使うものと同じ更新マスクです。

### カスタムパケットの使用 {#using-a-custom-packet}

専用の更新パケットを使えば、必要なときにいつでも自分でパケットを送れます。最も柔軟な方法ですが、ネットワークハンドラの準備が必要なため、最も複雑でもあります。`PacketDistrubtor#sendToPlayersTrackingChunk` を使うと、その BlockEntity を追跡しているすべてのプレイヤーにパケットを送れます。詳しくは[ネットワーク][networking]のセクションを参照してください。

:::caution
メッセージがプレイヤーに届いた時点で、`BlockEntity` がすでに破壊または置き換えられている可能性があるため、安全確認を行うことが重要です。また、`Level#hasChunkAt` でチャンクが読み込まれているかも確認してください。
:::

[block]: ../blocks/index.md
[blockstate]: ../blocks/states.md
[dataattachments]: ../datastorage/attachments.md
[nbt]: ../datastorage/nbt.md
[networking]: ../networking/index.md
[registration]: ../concepts/registries.md#methods-for-registering
[setblock]: ../blocks/states.md#levelsetblock
