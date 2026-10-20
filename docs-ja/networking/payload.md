---
sidebar_position: 1
---
# ペイロードの登録 {#registering-payloads}

ペイロードは、クライアントとサーバーの間で任意のデータを送るための手段です。ペイロードは、`RegisterPayloadHandlersEvent` から得られる `PayloadRegistrar` を使って登録します。

```java
@SubscribeEvent // on the mod event bus
public static void register(final RegisterPayloadHandlersEvent event) {
    // Sets the current network version
    final PayloadRegistrar registrar = event.registrar("1");
}
```

次のデータを送りたいとします。

```java
public record MyData(String name, int age) {}
```

その場合、`CustomPacketPayload` インターフェースを実装して、このデータの送受信に使えるペイロードを作れます。

```java
public record MyData(String name, int age) implements CustomPacketPayload {
    
    public static final CustomPacketPayload.Type<MyData> TYPE = new CustomPacketPayload.Type<>(ResourceLocation.fromNamespaceAndPath("mymod", "my_data"));

    // Each pair of elements defines the stream codec of the element to encode/decode and the getter for the element to encode
    // 'name' will be encoded and decoded as a string
    // 'age' will be encoded and decoded as an integer
    // The final parameter takes in the previous parameters in the order they are provided to construct the payload object
    public static final StreamCodec<ByteBuf, MyData> STREAM_CODEC = StreamCodec.composite(
        ByteBufCodecs.STRING_UTF8,
        MyData::name,
        ByteBufCodecs.VAR_INT,
        MyData::age,
        MyData::new
    );
    
    @Override
    public CustomPacketPayload.Type<? extends CustomPacketPayload> type() {
        return TYPE;
    }
}
```

上の例からわかるように、`CustomPacketPayload` インターフェースでは `type` メソッドを実装する必要があります。`type` メソッドは、このペイロードの一意な識別子を返す役割を担います。さらに、後でこれを登録するための読み取り処理として、ペイロードのデータを読み書きする `StreamCodec` も必要です。

最後に、このペイロードをレジストラに登録します。

```java
@SubscribeEvent // on the mod event bus
public static void register(final RegisterPayloadHandlersEvent event) {
    final PayloadRegistrar registrar = event.registrar("1");
    registrar.playBidirectional(
        MyData.TYPE,
        MyData.STREAM_CODEC,
        new DirectionalPayloadHandler<>(
            ClientPayloadHandler::handleDataOnMain,
            ServerPayloadHandler::handleDataOnMain
        )
    );
}
```

上のコードを詳しく見ると、いくつかのことがわかります。
- レジストラには `play*` メソッドがあり、ゲームのプレイフェーズ中に送るペイロードの登録に使えます。
    - このコードには出てきませんが、`configuration*` と `common*` のメソッドもあり、コンフィギュレーションフェーズ用のペイロードの登録にも使えます。`common` メソッドを使うと、コンフィギュレーションフェーズとプレイフェーズの両方のペイロードを同時に登録できます。
- レジストラは `*Bidirectional` メソッドを使っています。これは、論理サーバーと論理クライアントの両方に送るペイロードの登録に使えます。
    - このコードには出てきませんが、`*ToClient` と `*ToServer` のメソッドもあり、それぞれ論理クライアントだけ、論理サーバーだけに送るペイロードの登録に使えます。
- ペイロードのタイプは、ペイロードの一意な識別子として使われます。
- [ストリームコーデック][streamcodec]は、ネットワーク経由で送られるバッファとの間で、ペイロードを読み書きするために使われます。
- ペイロードハンドラは、ペイロードがいずれかの論理 Side に届いたときに呼ばれるコールバックです。
    - `*Bidirectional` メソッドを使う場合は、`DirectionalPayloadHandler` を使って、論理 Side ごとに別々のペイロードハンドラを指定できます。

ペイロードを登録したので、ハンドラを実装する必要があります。この例ではクライアント側のハンドラを見ていきますが、サーバー側のハンドラもよく似ています。

```java
public class ClientPayloadHandler {
    
    public static void handleDataOnMain(final MyData data, final IPayloadContext context) {
        // Do something with the data, on the main thread
        blah(data.age());
    }
}
```

ここで注目すべき点がいくつかあります。

- この処理メソッドは、ペイロードとコンテキストのオブジェクトを受け取ります。
- ペイロードの処理メソッドは、デフォルトでメインスレッドで呼び出されます。


リソースを多く使う計算が必要な場合は、メインスレッドをブロックするのではなく、ネットワークスレッドで処理してください。これには、ペイロードを登録する前に、`PayloadRegistrar#executesOn` で `PayloadRegistrar` の `HandlerThread` を `HandlerThread#NETWORK` に設定します。

```java
@SubscribeEvent // on the mod event bus
public static void register(final RegisterPayloadHandlersEvent event) {
    final PayloadRegistrar registrar = event.registrar("1")
        .executesOn(HandlerThread.NETWORK); // All subsequent payloads will register on the network thread
    registrar.playBidirectional(
        MyData.TYPE,
        MyData.STREAM_CODEC,
        new DirectionalPayloadHandler<>(
            ClientPayloadHandler::handleDataOnNetwork,
            ServerPayloadHandler::handleDataOnNetwork
        )
    );
}
```

:::note
`executesOn` の呼び出し後に登録したペイロードは、再び `executesOn` を呼び出すまで、すべて同じ実行スレッドのままになります。

```java
PayloadRegistrar registrar = event.registrar("1");

registrar.playBidirectional(...); // On the main thread
registrar.playBidirectional(...); // On the main thread

// Configuration methods modify the state of the registrar
// by creating a new instance, so the change needs to be
/// updated by storing the result
registrar = registrar.executesOn(HandlerThread.NETWORK);

registrar.playBidirectional(...); // On the network thread
registrar.playBidirectional(...); // On the network thread

registrar = registrar.executesOn(HandlerThread.MAIN);

registrar.playBidirectional(...); // On the main thread
registrar.playBidirectional(...); // On the main thread
```
:::

ここで注目すべき点がいくつかあります。

- ゲームのメインスレッドでコードを実行したい場合は、`enqueueWork` を使ってメインスレッドにタスクを投入できます。
    - このメソッドは、メインスレッドで完了する `CompletableFuture` を返します。
    - 注意: `CompletableFuture` が返されるので、複数のタスクをつなげたり、例外を 1 か所でまとめて処理したりできます。
    - `CompletableFuture` で例外を処理しないと、例外は握りつぶされ、**通知もされません**。

```java
public class ClientPayloadHandler {
    
    public static void handleDataOnNetwork(final MyData data, final IPayloadContext context) {
        // Do something with the data, on the network thread
        blah(data.name());
        
        // Do something with the data, on the main thread
        context.enqueueWork(() -> {
            blah(data.age());
        })
        .exceptionally(e -> {
            // Handle exception
            context.disconnect(Component.translatable("my_mod.networking.failed", e.getMessage()));
            return null;
        });
    }
}
```

独自のペイロードは、[コンフィギュレーションタスク][configuration]を使ったクライアントとサーバーの設定にも使えます。

## ペイロードの送信 {#sending-payloads}

`CustomPacketPayload` は、バニラのパケットの仕組みを使ってネットワーク経由で送られます。サーバーに送るときは `ServerboundCustomPayloadPacket` で、クライアントに送るときは `ClientboundCustomPayloadPacket` でペイロードをラップします。クライアントに送るペイロードに含められるデータは最大 1 MiB まで、サーバーに送るペイロードは 32 KiB 未満までです。

すべてのペイロードは、ある程度抽象化されたうえで `Connection#send` を通じて送られます。ただし、条件に応じて複数のプレイヤーにパケットを送りたい場合、これらのメソッドを呼び出すのは一般に不便です。そのため、`PacketDistributor` には、ペイロードを送るための便利な実装が多数あります。サーバーにパケットを送るメソッドは 1 つ( `sendToServer` )だけですが、クライアントに送るメソッドは、どのプレイヤーがペイロードを受け取るべきかに応じて多数あります。

```java
// ON THE CLIENT

// Send payload to server
PacketDistributor.sendToServer(new MyData(...));

// ON THE SERVER

// Send to one player (ServerPlayer serverPlayer)
PacketDistributor.sendToPlayer(serverPlayer, new MyData(...));

/// Send to all players tracking this chunk (ServerLevel serverLevel, ChunkPos chunkPos)
PacketDistributor.sendToPlayersTrackingChunk(serverLevel, chunkPos, new MyData(...));

/// Send to all connected players
PacketDistributor.sendToAllPlayers(new MyData(...));
```

その他の実装は、`PacketDistributor` クラスを参照してください。

[configuration]: ./configuration-tasks.md
[streamcodec]: ./streamcodecs.md
