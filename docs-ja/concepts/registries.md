---
sidebar_position: 1
---
# Registry {#registries}

登録とは、Mod のオブジェクト( [Item][item]、[Block][block]、エンティティなど )をゲームに認識させる処理です。登録は重要です。登録しなければ、ゲームはそれらのオブジェクトをまったく認識できず、説明のつかない挙動やクラッシュの原因になります。

Registry とは、簡単に言えば、Registry 名( 後述 )と登録されたオブジェクト( Registry エントリと呼ばれることが多い )を対応付けるマップのラッパーです。Registry 名は同じ Registry 内で一意である必要がありますが、同じ Registry 名が複数の Registry に存在してもかまいません。最もよくある例は、( `BLOCKS` Registry にある ) Block が、同じ Registry 名を持つ Item の形態を( `ITEMS` Registry に )持つ場合です。

登録されたオブジェクトはすべて、Registry 名と呼ばれる一意の名前を持ちます。この名前は [`ResourceLocation`][resloc] で表されます。たとえば、土ブロックの Registry 名は `minecraft:dirt`、ゾンビの Registry 名は `minecraft:zombie` です。Mod のオブジェクトはもちろん `minecraft` 名前空間を使わず、代わりにその Mod の Mod ID を使います。

## バニラと Mod の違い {#vanilla-vs-modded}

NeoForge の Registry システムにおける設計判断の一部を理解するために、まずは Minecraft がこれをどう行っているかを見てみましょう。他のほとんどの Registry も同じように動作するので、ここでは Block の Registry を例にします。

Registry は一般に[シングルトン][singleton]を登録します。( 訳注: シングルトンとは、ゲーム全体でインスタンスが 1 つしか存在しないオブジェクトのことです )つまり、すべての Registry エントリはちょうど 1 つだけ存在します。たとえば、ゲーム中で目にする石ブロックはすべて、実際には同じ石ブロックが何度も表示されているものです。石ブロックが必要な場合は、登録された Block のインスタンスを参照して取得できます。

Minecraft はすべての Block を `Blocks` クラスで登録します。`register` メソッドを通じて `Registry#register()` が呼ばれ、その第 1 引数には `BuiltInRegistries.BLOCK` にある Block の Registry が渡されます。すべての Block が登録されると、Minecraft は Block の一覧に基づいてさまざまなチェックを行います。たとえば、すべての Block にモデルが読み込まれていることを確認するセルフチェックです。

これがすべてうまくいく主な理由は、`Blocks` が Minecraft によって十分早い段階でクラスロードされるからです。Mod は Minecraft によって自動でクラスロードされないため、回避策が必要になります。

## 登録の方法 {#methods-for-registering}

NeoForge には、オブジェクトを登録する方法が 2 つあります。`DeferredRegister` クラスと `RegisterEvent` です。前者は後者のラッパーであり、ミスを防ぐために推奨されています。

### `DeferredRegister`

まず、`DeferredRegister` を作成します。

```java
public static final DeferredRegister<Block> BLOCKS = DeferredRegister.create(
        // The registry we want to use.
        // Minecraft's registries can be found in BuiltInRegistries, NeoForge's registries can be found in NeoForgeRegistries.
        // Mods may also add their own registries, refer to the individual mod's documentation or source code for where to find them.
        BuiltInRegistries.BLOCK,
        // Our mod id.
        ExampleMod.MOD_ID
);
```

次に、Registry エントリを static final フィールドとして追加します( `new Block()` に渡す引数については [Block の記事][block]を参照してください )。

```java
public static final DeferredHolder<Block, Block> EXAMPLE_BLOCK = BLOCKS.register(
        "example_block", // Our registry name.
        () -> new Block(...) // A supplier of the object we want to register.
);
```

`DeferredHolder<R, T extends R>` クラスが、このオブジェクトを保持します。型パラメータ `R` は登録先の Registry の型( この例では `Block` )です。型パラメータ `T` は Supplier の型です。この例では `Block` を直接登録しているので、2 つ目のパラメータに `Block` を指定しています。`Block` のサブクラス、たとえば `SlabBlock` のオブジェクトを登録する場合は、ここに `SlabBlock` を指定します。

`DeferredHolder<R, T extends R>` は `Supplier<T>` のサブクラスです。登録したオブジェクトが必要になったときは、`DeferredHolder#get()` を呼び出して取得できます。`DeferredHolder` が `Supplier` を継承しているので、フィールドの型として `Supplier` を使うこともできます。その場合、上のコードブロックは次のようになります。

```java
public static final Supplier<Block> EXAMPLE_BLOCK = BLOCKS.register(
        "example_block", // Our registry name.
        () -> new Block(...) // A supplier of the object we want to register.
);
```

ただし、いくつかの場所では `Holder` または `DeferredHolder` が明示的に必要で、任意の `Supplier` は受け付けない点に注意してください。これらのどちらかが必要な場合は、必要に応じて `Supplier` の型を `Holder` か `DeferredHolder` に戻すのが最善です。

最後に、このシステム全体は Registry の Event のラッパーなので、`DeferredRegister` に、必要に応じて Registry の Event に自身を紐づけるよう指示する必要があります。

```java
//This is our mod constructor
public ExampleMod(IEventBus modBus) {
    //highlight-next-line
    ExampleBlocksClass.BLOCKS.register(modBus);
    //Other stuff here
}
```

:::info
Block と Item には、ヘルパーメソッドを備えた `DeferredRegister` の特化版があります。それぞれ [`DeferredRegister.Blocks`][defregblocks] と [`DeferredRegister.Items`][defregitems] です。
:::

### `RegisterEvent`

`RegisterEvent` は、オブジェクトを登録する 2 つ目の方法です。この [Event][event] は、Mod のコンストラクタの後( `DeferredRegister` が内部の Event ハンドラを登録するのはコンストラクタ内だからです )、かつコンフィグの読み込み前に、Registry ごとに発火されます。`RegisterEvent` は Mod の EventBus で発火されます。

```java
@SubscribeEvent // on the mod event bus
public static void register(RegisterEvent event) {
    event.register(
            // This is the registry key of the registry.
            // Get these from BuiltInRegistries for vanilla registries,
            // or from NeoForgeRegistries.Keys for NeoForge registries.
            BuiltInRegistries.BLOCK,
            // Register your objects here.
            registry -> {
                registry.register(ResourceLocation.fromNamespaceAndPath(MODID, "example_block_1"), new Block(...));
                registry.register(ResourceLocation.fromNamespaceAndPath(MODID, "example_block_2"), new Block(...));
                registry.register(ResourceLocation.fromNamespaceAndPath(MODID, "example_block_3"), new Block(...));
            }
    );
}
```

## Registry の問い合わせ {#querying-registries}

ある ID から登録済みのオブジェクトを取得したい場面や、ある登録済みオブジェクトの ID を取得したい場面があるでしょう。Registry は基本的に ID( `ResourceLocation` )と個別のオブジェクトのマップ、つまり逆引きもできるマップなので、どちらの操作も可能です。

```java
BuiltInRegistries.BLOCK.get(ResourceLocation.fromNamespaceAndPath("minecraft", "dirt")); // returns the dirt block
BuiltInRegistries.BLOCK.getKey(Blocks.DIRT); // returns the resource location "minecraft:dirt"

// Assume that ExampleBlocksClass.EXAMPLE_BLOCK.get() is a Supplier<Block> with the id "yourmodid:example_block"
BuiltInRegistries.BLOCK.get(ResourceLocation.fromNamespaceAndPath("yourmodid", "example_block")); // returns the example block
BuiltInRegistries.BLOCK.getKey(ExampleBlocksClass.EXAMPLE_BLOCK.get()); // returns the resource location "yourmodid:example_block"
```

オブジェクトが存在するかどうかを確認したいだけなら、それも可能です。ただし、キーでのみ確認できます。

```java
BuiltInRegistries.BLOCK.containsKey(ResourceLocation.fromNamespaceAndPath("minecraft", "dirt")); // true
BuiltInRegistries.BLOCK.containsKey(ResourceLocation.fromNamespaceAndPath("create", "brass_ingot")); // true only if Create is installed
```

最後の例が示すように、これはどの Mod ID でも使えるので、他の Mod の特定の Item が存在するかを確認するのに最適な方法です。

最後に、Registry 内のすべてのエントリを、キーまたはエントリ( エントリには Java の `Map.Entry` 型を使います )で反復処理することもできます。

```java
for (ResourceLocation id : BuiltInRegistries.BLOCK.keySet()) {
    // ...
}
for (Map.Entry<ResourceKey<Block>, Block> entry : BuiltInRegistries.BLOCK.entrySet()) {
    // ...
}
```

:::note
問い合わせの操作には、常に `DeferredRegister` ではなくバニラの `Registry` を使います。`DeferredRegister` は単なる登録用のユーティリティだからです。
:::

:::danger
問い合わせの操作を安全に使えるのは、登録が完了した後だけです。**登録の最中に Registry を問い合わせてはいけません！**
:::

## カスタム Registry {#custom-registries}

カスタム Registry を使うと、あなたの Mod のアドオン Mod が組み込めるような追加のシステムを定義できます。たとえば、Mod で呪文を追加する場合、呪文を Registry にすれば、あなたが他に何もしなくても、他の Mod があなたの Mod に呪文を追加できるようになります。また、エントリの同期などを自動で行うこともできます。

まず、[Registry キー][resourcekey]と Registry 自体を作成しましょう。

```java
// We use spells as an example for the registry here, without any details about what a spell actually is (as it doesn't matter).
// Of course, all mentions of spells can and should be replaced with whatever your registry actually is.
public static final ResourceKey<Registry<Spell>> SPELL_REGISTRY_KEY = ResourceKey.createRegistryKey(ResourceLocation.fromNamespaceAndPath("yourmodid", "spells"));
public static final Registry<YourRegistryContents> SPELL_REGISTRY = new RegistryBuilder<>(SPELL_REGISTRY_KEY)
        // If you want to enable integer id syncing, for networking.
        // These should only be used in networking contexts, for example in packets or purely networking-related NBT data.
        .sync(true)
        // The default key. Similar to minecraft:air for blocks. This is optional.
        .defaultKey(ResourceLocation.fromNamespaceAndPath("yourmodid", "empty"))
        // Effectively limits the max count. Generally discouraged, but may make sense in settings such as networking.
        .maxId(256)
        // Build the registry.
        .create();
```

次に、`NewRegistryEvent` でルート Registry に登録して、Registry が存在することをゲームに伝えます。

```java
@SubscribeEvent // on the mod event bus
public static void registerRegistries(NewRegistryEvent event) {
    event.register(SPELL_REGISTRY);
}
```

これで、他の Registry と同じように、`DeferredRegister` と `RegisterEvent` のどちらでも新しい Registry の中身を登録できます。

```java
public static final DeferredRegister<Spell> SPELLS = DeferredRegister.create("yourmodid", SPELL_REGISTRY);
public static final Supplier<Spell> EXAMPLE_SPELL = SPELLS.register("example_spell", () -> new Spell(...));

// Alternatively:
@SubscribeEvent // on the mod event bus
public static void register(RegisterEvent event) {
    event.register(SPELL_REGISTRY_KEY, registry -> {
        registry.register(ResourceLocation.fromNamespaceAndPath("yourmodid", "example_spell"), () -> new Spell(...));
    });
}
```

## Datapack Registry {#datapack-registries}

Datapack Registry( 動的 Registry、または主な用途から worldgen Registry とも呼ばれます )は特殊な Registry で、ゲームの起動時ではなくワールドの読み込み時に、[Datapack][datapack] の JSON からデータを読み込みます( これが名前の由来です )。デフォルトの Datapack Registry には、特に worldgen の Registry のほとんどが含まれ、ほかにもいくつかあります。

Datapack Registry では、その中身を JSON ファイルで指定できます。つまり、コードは必要ありません( JSON ファイルを自分で書きたくない場合の[データ生成][datagen]は別です )。すべての Datapack Registry には、シリアライズに使われる [`Codec`][codec] が関連付けられており、各 Registry の ID によって Datapack 内のパスが決まります。

- Minecraft の Datapack Registry は `data/yourmodid/registrypath` という形式を使います( 例: `data/yourmodid/worldgen/biome`。`worldgen/biome` が Registry のパスです )。
- その他すべての Datapack Registry( NeoForge や Mod のもの )は `data/yourmodid/registrynamespace/registrypath` という形式を使います( 例: `data/yourmodid/neoforge/biome_modifier`。`neoforge` が Registry の名前空間、`biome_modifier` が Registry のパスです )。

Datapack Registry は `RegistryAccess` から取得できます。この `RegistryAccess` は、サーバーでは `ServerLevel#registryAccess()`、クライアントでは `Minecraft.getInstance().getConnection()#registryAccess()` を呼び出して取得できます( 後者は実際にワールドに接続している場合にのみ機能します。そうでない場合、接続は null になります )。これらの呼び出しの結果は、他の Registry と同じように、特定の要素の取得や中身の反復処理に使えます。

### カスタム Datapack Registry {#custom-datapack-registries}

カスタム Datapack Registry では、`Registry` を構築する必要はありません。代わりに、Registry キーと、中身を( デ )シリアライズするための [`Codec`][codec] が少なくとも 1 つ必要なだけです。先ほどの呪文の例で言えば、呪文の Registry を Datapack Registry として登録するには次のようにします。

```java
public static final ResourceKey<Registry<Spell>> SPELL_REGISTRY_KEY = ResourceKey.createRegistryKey(ResourceLocation.fromNamespaceAndPath("yourmodid", "spells"));

@SubscribeEvent // on the mod event bus
public static void registerDatapackRegistries(DataPackRegistryEvent.NewRegistry event) {
    event.dataPackRegistry(
            // The registry key.
            SPELL_REGISTRY_KEY,
            // The codec of the registry contents.
            Spell.CODEC,
            // The network codec of the registry contents. Often identical to the normal codec.
            // May be a reduced variant of the normal codec that omits data that is not needed on the client.
            // May be null. If null, registry entries will not be synced to the client at all.
            // May be omitted, which is functionally identical to passing null (a method overload
            // with two parameters is called that passes null to the normal three parameter method).
            Spell.CODEC
    );
}
```

### Datapack Registry のデータ生成 {#data-generation-for-datapack-registries}

JSON ファイルをすべて手で書くのは面倒で間違いも起きやすいため、NeoForge は JSON ファイルを生成する[データプロバイダ][datagenindex]を提供しています。これは組み込みの Datapack Registry と、自作の Datapack Registry の両方で使えます。

まず、`RegistrySetBuilder` を作成し、そこにエントリを追加します( 1 つの `RegistrySetBuilder` で複数の Registry のエントリを保持できます )。

```java
new RegistrySetBuilder()
    .add(Registries.CONFIGURED_FEATURE, bootstrap -> {
    // Register configured features through the bootstrap context (see below)
    })
    .add(Registries.PLACED_FEATURE, bootstrap -> {
    // Register placed features through the bootstrap context (see below)
    });
```

ラムダの引数 `bootstrap` が、実際にオブジェクトを登録するのに使うものです。その型は `BootstrapContext` です。オブジェクトを登録するには、次のように `#register` を呼び出します。

```java
// The resource key of our object.
public static final ResourceKey<ConfiguredFeature<?, ?>> EXAMPLE_CONFIGURED_FEATURE = ResourceKey.create(
    Registries.CONFIGURED_FEATURE,
    ResourceLocation.fromNamespaceAndPath(MOD_ID, "example_configured_feature")
);

new RegistrySetBuilder()
    .add(Registries.CONFIGURED_FEATURE, bootstrap -> {
        bootstrap.register(
            // The resource key of our configured feature.
            EXAMPLE_CONFIGURED_FEATURE,
            // The actual configured feature.
            new ConfiguredFeature<>(Feature.ORE, new OreConfiguration(...))
        );
    })
    .add(Registries.PLACED_FEATURE, bootstrap -> {
    // ...
    });
```

`BootstrapContext` は、必要に応じて別の Registry のエントリを参照するのにも使えます。

```java
public static final ResourceKey<ConfiguredFeature<?, ?>> EXAMPLE_CONFIGURED_FEATURE = ResourceKey.create(
    Registries.CONFIGURED_FEATURE,
    ResourceLocation.fromNamespaceAndPath(MOD_ID, "example_configured_feature")
);
public static final ResourceKey<PlacedFeature> EXAMPLE_PLACED_FEATURE = ResourceKey.create(
    Registries.PLACED_FEATURE,
    ResourceLocation.fromNamespaceAndPath(MOD_ID, "example_placed_feature")
);

new RegistrySetBuilder()
    .add(Registries.CONFIGURED_FEATURE, bootstrap -> {
        bootstrap.register(EXAMPLE_CONFIGURED_FEATURE, ...);
    })
    .add(Registries.PLACED_FEATURE, bootstrap -> {
        HolderGetter<ConfiguredFeature<?, ?>> otherRegistry = bootstrap.lookup(Registries.CONFIGURED_FEATURE);
        bootstrap.register(EXAMPLE_PLACED_FEATURE, new PlacedFeature(
            otherRegistry.getOrThrow(EXAMPLE_CONFIGURED_FEATURE), // Get the configured feature
            List.of() // No-op when placement happens - replace with whatever your placement parameters are
        ));
    });
```

最後に、`RegistrySetBuilder` を実際のデータプロバイダで使い、そのデータプロバイダを Event に登録します。

```java
@SubscribeEvent // on the mod event bus
public static void onGatherData(GatherDataEvent event) {
    event.getGenerator().addProvider(
        // Only run datapack generation when server data is being generated
        event.includeServer(),
        // Create the provider
        output -> new DatapackBuiltinEntriesProvider(
            output,
            event.getLookupProvider(),
            // Our registry set builder to generate the data from.
            new RegistrySetBuilder().add(...),
            // A set of mod ids we are generating. Usually only your own mod id.
            Set.of("yourmodid")
        )
    );
}
```

[block]: ../blocks/index.md
[blockentity]: ../blockentities/index.md
[codec]: ../datastorage/codecs.md
[datagen]: #data-generation-for-datapack-registries
[datagenindex]: ../resources/index.md#data-generation
[datapack]: ../resources/index.md#data
[defregblocks]: ../blocks/index.md#deferredregisterblocks-helpers
[defregitems]: ../items/index.md#deferredregisteritems
[event]: ./events.md
[item]: ../items/index.md
[resloc]: ../misc/resourcelocation.md
[resourcekey]: ../misc/resourcelocation.md#resourcekeys
[singleton]: https://en.wikipedia.org/wiki/Singleton_pattern
