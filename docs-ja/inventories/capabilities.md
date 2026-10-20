---
sidebar_position: 2
---
# Capability {#capabilities}

capability を使うと、多くのインターフェースを直接実装しなくても、機能を動的かつ柔軟に公開できます。

一般的に言えば、各 capability はインターフェースの形で機能を提供します。

NeoForge は、Block、エンティティ、アイテムスタックに capability のサポートを追加しています。詳しくは以下のセクションで説明します。

## なぜ capability を使うのか {#why-use-capabilities}

capability は、Block、エンティティ、アイテムスタックが**何を**できるかと、それを**どのように**行うかを分けるために設計されています。capability がその用途に適したツールか迷ったら、次のことを自問してください。

1. 気にしているのは、Block、エンティティ、アイテムスタックが**何を**できるかだけで、それを**どのように**行うかは気にしないか。
1. その**何を**( 動作 )は、一部の Block、エンティティ、アイテムスタックだけにあり、すべてにあるわけではないか。
1. その**どのように**( 動作の実装 )は、個々の Block、エンティティ、アイテムスタックによって異なるか。

capability のよい使い方の例をいくつか挙げます。

- *「自分の液体容器を他の Mod の液体容器と互換にしたいが、それぞれの液体容器の詳細はわからない」* - はい、`IFluidHandler` capability を使ってください。
- *「あるエンティティに入っているアイテムの数を数えたいが、そのエンティティがアイテムをどう保存しているかはわからない」* - はい、`IItemHandler` capability を使ってください。
- *「あるアイテムスタックに電力を充填したいが、そのアイテムスタックが電力をどう保存しているかはわからない」* - はい、`IEnergyStorage` capability を使ってください。
- *「プレイヤーが現在狙っている Block に色を付けたいが、その Block がどう変化するかはわからない」* - はい。NeoForge は Block に色を付ける capability を提供していませんが、自分で実装できます。

おすすめしない capability の使い方の例です。

- *「エンティティが自分の機械の範囲内にいるかを確認したい」* - いいえ、代わりにヘルパーメソッドを使ってください。

## NeoForge が提供する capability {#neoforge-provided-capabilities}

NeoForge は、`IItemHandler`、`IFluidHandler`、`IEnergyStorage` の 3 つのインターフェースについて capability を提供しています。

`IItemHandler` は、インベントリのスロットを扱うためのインターフェースを公開します。`IItemHandler` 型の capability は次のとおりです。

- `Capabilities.ItemHandler.BLOCK`: Block の、自動化でアクセスできるインベントリ( チェスト、機械など )。
- `Capabilities.ItemHandler.ENTITY`: エンティティのインベントリの中身( プレイヤーの追加スロット、モブや生き物のインベントリやバッグ )。
- `Capabilities.ItemHandler.ENTITY_AUTOMATION`: エンティティの、自動化でアクセスできるインベントリ( ボート、トロッコなど )。
- `Capabilities.ItemHandler.ITEM`: アイテムスタックの中身( 持ち運べるバックパックなど )。

`IFluidHandler` は、液体のインベントリを扱うためのインターフェースを公開します。`IFluidHandler` 型の capability は次のとおりです。

- `Capabilities.FluidHandler.BLOCK`: Block の、自動化でアクセスできる液体のインベントリ。
- `Capabilities.FluidHandler.ENTITY`: エンティティの液体のインベントリ。
- `Capabilities.FluidHandler.ITEM`: アイテムスタックの液体のインベントリ。
バケツが液体を保持する仕組みの都合上、この capability は特別な `IFluidHandlerItem` 型です。

`IEnergyStorage` は、エネルギーの容器を扱うためのインターフェースを公開します。TeamCoFH による RedstoneFlux API をもとにしています。`IEnergyStorage` 型の capability は次のとおりです。

- `Capabilities.EnergyStorage.BLOCK`: Block の中に蓄えられたエネルギー。
- `Capabilities.EnergyStorage.ENTITY`: エンティティの中に蓄えられたエネルギー。
- `Capabilities.EnergyStorage.ITEM`: アイテムスタックの中に蓄えられたエネルギー。

## capability の作成 {#creating-a-capability}

NeoForge は、Block、エンティティ、アイテムスタックの capability をサポートしています。

capability を使うと、何らかの振り分けのロジックによって、API の実装を検索できます。NeoForge には、次の種類の capability が実装されています。

- `BlockCapability`: Block と BlockEntity の capability。動作は個々の `Block` によって異なります。
- `EntityCapability`: エンティティの capability。動作は個々の `EntityType` によって異なります。
- `ItemCapability`: アイテムスタックの capability。動作は個々の `Item` によって異なります。

:::tip
他の Mod との互換性のため、可能であれば、NeoForge が `Capabilities` クラスで提供している capability を使うことをおすすめします。そうでない場合は、このセクションで説明するように独自のものを作れます。
:::

capability の作成は 1 回の関数呼び出しで済み、得られたオブジェクトは `static final` フィールドに保存してください。次の引数を指定する必要があります。

- capability の名前。
    - 同じ名前で capability を複数回作成すると、常に同じオブジェクトが返されます。
    - 名前の異なる capability は**完全に独立**しており、別々の目的に使えます。
- 問い合わせる動作の型。これが型パラメータ `T` です。
- 問い合わせの追加のコンテキストの型。これが型パラメータ `C` です。

たとえば、面を考慮する Block の `IItemHandler` 用の capability は、次のように宣言できます。

```java
public static final BlockCapability<IItemHandler, @Nullable Direction> ITEM_HANDLER_BLOCK =
    BlockCapability.create(
        // Provide a name to uniquely identify the capability.
        ResourceLocation.fromNamespaceAndPath("mymod", "item_handler"),
        // Provide the queried type. Here, we want to look up `IItemHandler` instances.
        IItemHandler.class,
        // Provide the context type. We will allow the query to receive an extra `Direction side` parameter.
        Direction.class);
```

Block では `@Nullable Direction` が非常によく使われるため、専用のヘルパーがあります。

```java
public static final BlockCapability<IItemHandler, @Nullable Direction> ITEM_HANDLER_BLOCK =
    BlockCapability.createSided(
        // Provide a name to uniquely identify the capability.
        ResourceLocation.fromNamespaceAndPath("mymod", "item_handler"),
        // Provide the queried type. Here, we want to look up `IItemHandler` instances.
        IItemHandler.class);
```

コンテキストが不要な場合は、`Void` を使ってください。コンテキストのない capability 用の専用ヘルパーもあります。

```java
public static final BlockCapability<IItemHandler, Void> ITEM_HANDLER_NO_CONTEXT =
    BlockCapability.createVoid(
        // Provide a name to uniquely identify the capability.
        ResourceLocation.fromNamespaceAndPath("mymod", "item_handler_no_context"),
        // Provide the queried type. Here, we want to look up `IItemHandler` instances.
        IItemHandler.class);
```

エンティティとアイテムスタックについては、それぞれ `EntityCapability` と `ItemCapability` に同様のメソッドがあります。

## capability の問い合わせ {#querying-capabilities}

`BlockCapability`、`EntityCapability`、`ItemCapability` のオブジェクトを static フィールドに用意したら、capability を問い合わせられます。

エンティティとアイテムスタックでは、`getCapability` で capability の実装を探せます。結果が `null` なら、利用できる実装はありません。

例:

```java
var object = entity.getCapability(CAP, context);
if (object != null) {
    // Use object
}
```

```java
var object = stack.getCapability(CAP, context);
if (object != null) {
    // Use object
}
```

Block の capability は、BlockEntity を持たない Block も capability を持てるため、少し使い方が異なります。問い合わせは `level` に対して行い、探している位置( `pos` )を追加の引数として渡します。

```java
var object = level.getCapability(CAP, pos, context);
if (object != null) {
    // Use object
}
```

BlockEntity やブロックステートがわかっている場合は、それらを渡して問い合わせの時間を節約できます。

```java
var object = level.getCapability(CAP, pos, blockState, blockEntity, context);
if (object != null) {
    // Use object
}
```

より具体的な例として、Block の `IItemHandler` capability を `Direction.NORTH` の面から問い合わせるには、次のようにします。

```java
IItemHandler handler = level.getCapability(Capabilities.ItemHandler.BLOCK, pos, Direction.NORTH);
if (handler != null) {
    // Use the handler for some item-related operation.
}
```

## Block の capability のキャッシュ {#block-capability-caching}

capability を検索すると、システムは内部で次の手順を実行します。

1. BlockEntity とブロックステートが渡されていなければ、それらを取得します。
1. 登録済みの capability プロバイダを取得します( 詳しくは後述 )。
1. プロバイダを順に調べ、capability を提供できるか問い合わせます。
1. プロバイダの 1 つが capability のインスタンスを返します。その際、新しいオブジェクトが割り当てられることもあります。

この実装はかなり効率的ですが、たとえば毎 tick のように頻繁に行う問い合わせでは、これらの手順がサーバーの時間をかなり消費することがあります。`BlockCapabilityCache` の仕組みを使うと、特定の位置で頻繁に問い合わせる capability を劇的に高速化できます。

:::tip
一般に、`BlockCapabilityCache` は一度作成し、capability を頻繁に問い合わせるオブジェクトのフィールドに保存します。具体的にいつ、どこにキャッシュを保存するかは自由です。
:::

キャッシュを作成するには、問い合わせる capability、レベル、位置、問い合わせのコンテキストを渡して `BlockCapabilityCache.create` を呼び出します。

```java
// Declare the field:
private BlockCapabilityCache<IItemHandler, @Nullable Direction> capCache;

// Later, for example in `onLoad` for a block entity:
this.capCache = BlockCapabilityCache.create(
    Capabilities.ItemHandler.BLOCK, // capability to cache
    level, // level
    pos, // target position
    Direction.NORTH // context
);
```

キャッシュへの問い合わせは `getCapability()` で行います。

```java
IItemHandler handler = this.capCache.getCapability();
if (handler != null) {
    // Use the handler for some item-related operation.
}
```

**キャッシュはガベージコレクタによって自動で破棄されるため、登録を解除する必要はありません。**

capability のオブジェクトが変わったときに通知を受け取ることもできます！これには、capability が変わった場合( `oldHandler != newHandler` )、利用できなくなった場合( `null` )、再び利用できるようになった場合( `null` でなくなった )が含まれます。

その場合は、2 つの追加の引数を渡してキャッシュを作成する必要があります。

- キャッシュがまだ有効かどうかを判定する、有効性のチェック。
    - BlockEntity のフィールドとして使う最も単純な場合は、`() -> !this.isRemoved()` で十分です。
- capability が変わったときに呼ばれる、無効化のリスナー。
    - capability の変更、削除、出現には、ここで対応できます。

```java
// With optional invalidation listener:
this.capCache = BlockCapabilityCache.create(
    Capabilities.ItemHandler.BLOCK, // capability to cache
    level, // level
    pos, // target position
    Direction.NORTH, // context
    () -> !this.isRemoved(), // validity check (because the cache might outlive the object it belongs to)
    () -> onCapInvalidate() // invalidation listener
);
```

## Block の capability の無効化 {#block-capability-invalidation}

:::info
無効化は Block の capability だけのものです。エンティティとアイテムスタックの capability はキャッシュできず、無効化する必要もありません。
:::

キャッシュが保存している capability を正しく更新できるよう、**Mod 開発者は、capability が変わったとき、現れたとき、消えたときは必ず `level.invalidateCapabilities(pos)` を呼び出す必要があります**。

```java
// whenever a capability changes, appears, or disappears:
level.invalidateCapabilities(pos);
```

チャンクの読み込み・アンロードや、BlockEntity の作成・削除などのよくある場合は、NeoForge がすでに処理しています。しかし、それ以外の場合は Mod 開発者が明示的に処理する必要があります。たとえば、次の場合は capability を無効化しなければなりません。

- 以前に返した capability が有効でなくなった場合。
- capability を提供する( BlockEntity を持たない )Block が設置された、または状態が変わった場合。`onPlace` をオーバーライドして行います。
- capability を提供する( BlockEntity を持たない )Block が取り除かれた場合。`onRemove` をオーバーライドして行います。

BlockEntity を持たない Block の例は、`ComposterBlock.java` ファイルを参照してください。

詳しくは、[`IBlockCapabilityProvider`][block-cap-provider] の javadoc を参照してください。

## capability の登録 {#registering-capabilities}

capability を最終的に提供するのは、capability の*プロバイダ*です。capability プロバイダは、capability のインスタンスを返すか、capability を提供できない場合は `null` を返す関数です。プロバイダは、次のものに固有です。

- 提供の対象となる capability
- 提供の対象となる Block のインスタンス、BlockEntity タイプ、エンティティタイプ、Item のインスタンス

プロバイダは `RegisterCapabilitiesEvent` で登録する必要があります。

Block のプロバイダは `registerBlock` で登録します。例:

```java
@SubscribeEvent  // on the mod event bus
public static void registerCapabilities(RegisterCapabilitiesEvent event) {
    event.registerBlock(
        Capabilities.ItemHandler.BLOCK, // capability to register for
        (level, pos, state, be, side) -> <return the IItemHandler>,
        // blocks to register for
        MY_ITEM_HANDLER_BLOCK,
        MY_OTHER_ITEM_HANDLER_BLOCK
    );
}
```

一般に、登録は特定の BlockEntity タイプに対して行うことが多いため、`registerBlockEntity` ヘルパーメソッドも用意されています。

```java
event.registerBlockEntity(
    Capabilities.ItemHandler.BLOCK, // capability to register for
    MY_BLOCK_ENTITY_TYPE, // block entity type to register for
    (myBlockEntity, side) -> myBlockEntity.myIItemHandlerForTheGivenSide
);
```

:::danger
Block または BlockEntity のプロバイダが以前に返した capability が有効でなくなった場合は、`level.invalidateCapabilities(pos)` を呼び出して*キャッシュを無効化しなければなりません**。詳しくは、上の[無効化のセクション][invalidation]を参照してください。
:::

エンティティの登録も同様で、`registerEntity` を使います。

```java
event.registerEntity(
    Capabilities.ItemHandler.ENTITY, // capability to register for
    MY_ENTITY_TYPE, // entity type to register for
    (myEntity, context) -> myEntity.myIItemHandlerForTheGivenContext
);
```

Item の登録も同様です。プロバイダはスタックを受け取る点に注意してください。

```java
event.registerItem(
    Capabilities.ItemHandler.ITEM, // capability to register for
    (itemStack, context) -> <return the IItemHandler for the itemStack>,
    // items to register for
    MY_ITEM,
    MY_OTHER_ITEM
);
```

## すべてのオブジェクトへの capability の登録 {#registering-capabilities-for-all-objects}

何らかの理由で、すべての Block、エンティティ、Item にプロバイダを登録する必要がある場合は、対応する Registry を反復処理し、オブジェクトごとにプロバイダを登録する必要があります。

たとえば NeoForge は、この方法で、すべての `BucketItem`( サブクラスを除く )に液体ハンドラの capability を登録しています。

```java
// For reference, you can find this code in the `CapabilityHooks` class.
for (Item item : BuiltInRegistries.ITEM) {
    if (item.getClass() == BucketItem.class) {
        event.registerItem(Capabilities.FluidHandler.ITEM, (stack, ctx) -> new FluidBucketWrapper(stack), item);
    }
}
```

プロバイダには、登録された順に capability が問い合わせられます。自分のオブジェクトに NeoForge がすでに登録しているプロバイダより先に実行したい場合は、`RegisterCapabilitiesEvent` のハンドラを、より高い優先度で登録してください。

例:

```java
modBus.addListener(RegisterCapabilitiesEvent.class, event -> {
    event.registerItem(
        Capabilities.FluidHandler.ITEM,
        (stack, ctx) -> new MyCustomFluidBucketWrapper(stack),
        // blocks to register for
        MY_CUSTOM_BUCKET);
}, EventPriority.HIGH); // use HIGH priority to register before NeoForge!
```

NeoForge 自体が登録しているプロバイダの一覧は、[`CapabilityHooks`][capability-hooks] を参照してください。

[block-cap-provider]: https://github.com/neoforged/NeoForge/blob/1.21.x/src/main/java/net/neoforged/neoforge/capabilities/IBlockCapabilityProvider.java
[capability-hooks]: https://github.com/neoforged/NeoForge/blob/1.21.x/src/main/java/net/neoforged/neoforge/capabilities/CapabilityHooks.java
[invalidation]: #block-capability-invalidation
