---
sidebar_position: 3
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Event {#events}

NeoForge の主な機能の一つが Event システムです。Event は、ゲーム内で起きるさまざまな出来事に対して発火されます。たとえば、プレイヤーが右クリックしたとき、プレイヤーや他のエンティティがジャンプしたとき、ブロックが描画されるとき、ゲームが読み込まれたときなどの Event があります。Mod 開発者はこれらの Event それぞれに Event ハンドラを登録し、その中で目的の処理を行えます。

Event は、それぞれ対応する EventBus 上で発火されます。最も重要なバスは `NeoForge.EVENT_BUS` で、**ゲーム**バスとも呼ばれます。それとは別に、起動時には読み込まれた Mod ごとに Mod バスが作られ、Mod のコンストラクタに渡されます。Mod バスの Event の多くは並列に発火されるため( 常に同じスレッドで実行されるメインバスの Event とは異なります )、起動速度が大幅に向上します。詳しくは[後述][modbus]を参照してください。

## Event ハンドラの登録 {#registering-an-event-handler}

Event ハンドラを登録する方法はいくつかあります。どの方法にも共通するのは、すべての Event ハンドラが、Event の引数を 1 つだけ受け取り、結果を返さない( つまり戻り値の型が `void` の )メソッドであることです。

### `IEventBus#addListener`

メソッドハンドラを登録する最も簡単な方法は、次のようにメソッド参照を登録することです。

```java
@Mod("yourmodid")
public class YourMod {
    public YourMod(IEventBus modBus) {
        NeoForge.EVENT_BUS.addListener(YourMod::onLivingJump);
    }

    // Heals an entity by half a heart every time they jump.
    private static void onLivingJump(LivingJumpEvent event) {
        Entity entity = event.getEntity();
        // Only heal on the server side
        if (!entity.level().isClientSide()) {
            entity.heal(1);
        }
    }
}
```

### `@SubscribeEvent`

別の方法として、Event ハンドラのメソッドを作って `@SubscribeEvent` アノテーションを付ける、アノテーション駆動の方法もあります。そのうえで、そのメソッドを含むクラスのインスタンスを EventBus に渡すと、そのインスタンスにある `@SubscribeEvent` 付きの Event ハンドラがすべて登録されます。

```java
public class EventHandler {
    @SubscribeEvent
    public void onLivingJump(LivingJumpEvent event) {
        Entity entity = event.getEntity();
        if (!entity.level().isClientSide()) {
            entity.heal(1);
        }
    }
}

@Mod("yourmodid")
public class YourMod {
    public YourMod(IEventBus modBus) {
        NeoForge.EVENT_BUS.register(new EventHandler());
    }
}
```

static で行うこともできます。すべての Event ハンドラを static にし、クラスのインスタンスの代わりにクラスそのものを渡すだけです。

```java
public class EventHandler {
	@SubscribeEvent
    public static void onLivingJump(LivingJumpEvent event) {
        Entity entity = event.getEntity();
        if (!entity.level().isClientSide()) {
            entity.heal(1);
        }
    }
}

@Mod("yourmodid")
public class YourMod {
    public YourMod(IEventBus modBus) {
        NeoForge.EVENT_BUS.register(EventHandler.class);
    }
}
```

### `@EventBusSubscriber`

<Tabs defaultValue="latest">
<TabItem value="latest" label="Latest">

さらに一歩進めて、Event ハンドラのクラスに `@EventBusSubscriber` アノテーションを付けることもできます。このアノテーションは NeoForge によって自動で検出されるため、Mod のコンストラクタから Event 関連のコードをすべて取り除けます。本質的には、Mod のコンストラクタの最後で `NeoForge.EVENT_BUS.register(EventHandler.class)` と `modBus.register(EventHandler.class)` を呼び出すのと同じです。そのため、すべてのハンドラも static にする必要があります。

</TabItem>
<TabItem value="21.1.180" label="[21.1.0,21.1.180]">

さらに一歩進めて、Event ハンドラのクラスに `@EventBusSubscriber` アノテーションを付けることもできます。このアノテーションは NeoForge によって自動で検出されるため、Mod のコンストラクタから Event 関連のコードをすべて取り除けます。本質的には、Mod のコンストラクタの最後で `NeoForge.EVENT_BUS.register(EventHandler.class)` を呼び出すのと同じです。そのため、すべてのハンドラも static にする必要があります。

</TabItem>
</Tabs>

必須ではありませんが、デバッグ( 特に Mod 同士の競合が起きたとき )をしやすくするため、アノテーションに `modid` パラメータを指定することを強くおすすめします。

```java
@EventBusSubscriber(modid = "yourmodid")
public class EventHandler {
    @SubscribeEvent
    public static void onLivingJump(LivingJumpEvent event) {
        Entity entity = event.getEntity();
        if (!entity.level().isClientSide()) {
            entity.heal(1);
        }
    }
}
```

## Event のオプション {#event-options}

### フィールドとメソッド {#fields-and-methods}

フィールドとメソッドは、おそらく Event の最もわかりやすい部分です。ほとんどの Event は、Event を引き起こしたエンティティや Event が起きたレベルなど、Event ハンドラが使うためのコンテキストを持っています。

### 階層 {#hierarchy}

継承の利点を活かすため、一部の Event は `Event` を直接継承せず、そのサブクラスのいずれかを継承しています。たとえば `BlockEvent`( ブロック関連の Event のためにブロックのコンテキストを持つ )や `EntityEvent`( 同様にエンティティのコンテキストを持つ )、そのサブクラスである `LivingEvent`( `LivingEntity` 固有のコンテキスト用 )や `PlayerEvent`( `Player` 固有のコンテキスト用 )などです。こうしたコンテキストを提供する親 Event は `abstract` であり、リッスンすることはできません。

:::danger
`abstract` な Event をリッスンするとゲームがクラッシュします。それが望ましい場面は決してないためです。必ず、そのサブ Event のいずれかをリッスンしてください。
:::

### キャンセル可能な Event {#cancellable-events}

一部の Event は `ICancellableEvent` インターフェースを実装しています。こうした Event は `#setCanceled(boolean canceled)` でキャンセルでき、キャンセル状態は `#isCanceled()` で確認できます。Event がキャンセルされると、その Event の他の Event ハンドラは実行されず、「キャンセル」に対応する何らかの動作が有効になります。たとえば、`LivingJumpEvent` をキャンセルするとジャンプが阻止されます。

Event ハンドラは、キャンセル済みの Event も明示的に受け取るよう選択できます。これには、`IEventBus#addListener`( Event ハンドラの登録方法によっては `@SubscribeEvent` )の真偽値パラメータ `receiveCanceled` を true に設定します。

### TriState と Result {#tristates-and-results}

一部の Event には、`TriState` で表される、または Event クラスに直接定義された `Result` enum で表される、3 種類の戻り状態があります。一般に、戻り状態によって、Event が扱う動作をキャンセルする( `TriState#FALSE` )、動作を強制的に実行する( `TriState#TRUE` )、またはバニラのデフォルトの動作を実行する( `TriState#DEFAULT` )ことができます。

3 種類の戻り状態を持つ Event には、望む結果を設定するための何らかの `set*` メソッドがあります。

```java
// In some event handler class

@SubscribeEvent // on the game event bus
public static void renderNameTag(RenderNameTagEvent event) {
    // Uses TriState to set the return state
    event.setCanRender(TriState.FALSE);
}

@SubscribeEvent // on the game event bus
public static void mobDespawn(MobDespawnEvent event) {
    // Uses a Result enum to set the return state
    event.setResult(MobDespawnEvent.Result.DENY);
}
```

### 優先度 {#priority}

Event ハンドラには、任意で優先度を割り当てられます。`EventPriority` enum には、`HIGHEST`、`HIGH`、`NORMAL`( デフォルト )、`LOW`、`LOWEST` の 5 つの値があります。Event ハンドラは優先度の高い順に実行されます。優先度が同じ場合、メインバスでは登録順( おおむね Mod の読み込み順に対応します )に、Mod バスでは Mod の読み込み順どおりに発火されます( 後述 )。

優先度は、Event ハンドラの登録方法に応じて、`IEventBus#addListener` または `@SubscribeEvent` の `priority` パラメータで指定します。並列に発火される Event では、優先度は無視される点に注意してください。

### Side 別の Event {#sided-events}

一部の Event は、一方の [Side][side] でのみ発火されます。よくある例は、クライアントでのみ発火されるさまざまな描画 Event です。クライアント専用の Event は一般に、Minecraft のコードベースのうち他のクライアント専用の部分にアクセスする必要があるため、それに応じて登録しなければなりません。

`IEventBus#addListener()` を使う Event ハンドラは、[Side][side] の記事で説明しているように、`FMLEnvironment.dist` または Mod のコンストラクタの `Dist` 引数で現在の物理 Side を確認し、クライアント専用の別クラスでリスナーを追加してください。

`@EventBusSubscriber` を使う Event ハンドラは、アノテーションの `value` パラメータで Side を指定できます。例: `@EventBusSubscriber(value = Dist.CLIENT, modid = "yourmodid")`。

## EventBus {#event-buses}

ほとんどの Event は `NeoForge.EVENT_BUS` に投稿されますが、一部の Event は代わりに Mod の EventBus に投稿されます。これらは一般に Mod バスの Event と呼ばれます。Mod バスの Event は、親インターフェースが `IModBusEvent` であることで通常の Event と区別できます。

<Tabs defaultValue="latest">
<TabItem value="latest" label="Latest">

Mod の EventBus は Mod のコンストラクタの引数として渡されるので、そこに Mod バスの Event を登録できます。`@EventBusSubscriber` を使う場合、Event は自動で正しいバスに登録されます。

</TabItem>
<TabItem value="21.1.180" label="[21.1.0,21.1.180]">

Mod の EventBus は Mod のコンストラクタの引数として渡されるので、そこに Mod バスの Event を登録できます。`@EventBusSubscriber` を使う場合は、`@EventBusSubscriber(bus = Bus.MOD, modid = "yourmodid")` のように、アノテーションのパラメータでバスを設定することもできます。デフォルトのバスは `Bus.GAME` です。

</TabItem>
</Tabs>

### Mod のライフサイクル {#the-mod-lifecycle}

Mod バスの Event のほとんどは、ライフサイクル Event と呼ばれるものです。ライフサイクル Event は、起動時に各 Mod のライフサイクルの中で 1 回ずつ実行されます。その多くは `ParallelDispatchEvent` のサブクラスとして並列に発火されます。これらの Event からメインスレッドでコードを実行したい場合は、`#enqueueWork(Runnable runnable)` でキューに入れてください。

ライフサイクルは、おおむね次の順序で進みます。

- Mod のコンストラクタが呼ばれます。Event ハンドラはここか、次のステップで登録してください。
- すべての `@EventBusSubscriber` が呼ばれます。
- `FMLConstructModEvent` が発火されます。
- Registry の Event が発火されます。これには [`NewRegistryEvent`][newregistry]、[`DataPackRegistryEvent.NewRegistry`][newdatapackregistry]、そして Registry ごとの [`RegisterEvent`][registerevent] が含まれます。
- `FMLCommonSetupEvent` が発火されます。ここでさまざまな雑多なセットアップが行われます。
- [Side][side] 別のセットアップが発火されます。物理クライアントでは `FMLClientSetupEvent`、物理サーバーでは `FMLDedicatedServerSetupEvent` です。
- `InterModComms` が処理されます( 後述 )。
- `FMLLoadCompleteEvent` が発火されます。

#### `InterModComms`

`InterModComms` は、互換機能のために Mod 開発者が他の Mod にメッセージを送れるシステムです。このクラスは Mod 宛てのメッセージを保持し、すべてのメソッドはスレッドセーフに呼び出せます。このシステムは主に `InterModEnqueueEvent` と `InterModProcessEvent` の 2 つの Event によって動きます。

`InterModEnqueueEvent` の間に、`InterModComms#sendTo` を使って他の Mod にメッセージを送れます。これらのメソッドは、メッセージを送る先の Mod ID、メッセージのデータに関連付けるキー( 異なるメッセージを区別するため )、そしてメッセージのデータを保持する `Supplier` を受け取ります。送信者を任意で指定することもできます。

そして `InterModProcessEvent` の間に、`InterModComms#getMessages` を使って、受け取ったすべてのメッセージを `IMCMessage` オブジェクトのストリームとして取得できます。これには、データの送信者、データの宛先、データのキー、実際のデータの Supplier が含まれます。

### その他の Mod バスの Event {#other-mod-bus-events}

ライフサイクル Event のほかにも、主に歴史的な理由から、Mod の EventBus で発火される雑多な Event がいくつかあります。これらは一般に、さまざまなものを登録、セットアップ、初期化するための Event です。ライフサイクル Event とは異なり、これらの Event のほとんどは並列には実行されません。いくつか例を挙げます。

- `RegisterColorHandlersEvent`
- `ModelEvent.BakingCompleted`
- `TextureAtlasStitchedEvent`

:::warning
これらの Event のほとんどは、将来のバージョンでメインの EventBus に移される予定です。
:::

[modbus]: #event-buses
[newdatapackregistry]: registries.md#custom-datapack-registries
[newregistry]: registries.md#custom-registries
[registerevent]: registries.md#registerevent
[side]: sides.md
