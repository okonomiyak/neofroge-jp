---
sidebar_position: 3
---
# コンフィギュレーションタスクの使用 {#using-configuration-tasks}

クライアントとサーバーのネットワークプロトコルには、プレイヤーが実際にゲームに参加する前に、サーバーがクライアントを設定できる特別なフェーズがあります。このフェーズはコンフィギュレーションフェーズと呼ばれ、たとえばバニラのサーバーが、リソースパックの情報をクライアントに送るのに使っています。

Mod もこのフェーズを使って、プレイヤーがゲームに参加する前にクライアントを設定できます。

## コンフィギュレーションタスクの登録 {#registering-a-configuration-task}

コンフィギュレーションフェーズを使うための最初のステップは、コンフィギュレーションタスクの登録です。これは、`RegisterConfigurationTasksEvent` で新しいコンフィギュレーションタスクを登録して行います。

```java
@SubscribeEvent // on the mod event bus
public static void register(final RegisterConfigurationTasksEvent event) {
    event.register(new MyConfigurationTask());
}
```

`RegisterConfigurationTasksEvent` は Mod バスで発火され、対象のクライアントを設定するためにサーバーが使う、現在のリスナーを公開します。Mod 開発者は、公開されたリスナーを使ってクライアントがその Mod を実行しているかを調べ、実行していればコンフィギュレーションタスクを登録できます。

## コンフィギュレーションタスクの実装 {#implementing-a-configuration-task}

コンフィギュレーションタスクは、`ICustomConfigurationTask` という単純なインターフェースです。このインターフェースには 2 つのメソッドがあります。`void run(Consumer<CustomPacketPayload> sender);` と、コンフィギュレーションタスクのタイプを返す `ConfigurationTask.Type type();` です。タイプは、コンフィギュレーションタスクを識別するために使われます。コンフィギュレーションタスクの例を次に示します。

```java
public record MyConfigurationTask implements ICustomConfigurationTask {
    public static final ConfigurationTask.Type TYPE = new ConfigurationTask.Type(ResourceLocation.fromNamespaceAndPath("mymod", "my_task"));
    
    @Override
    public void run(final Consumer<CustomPacketPayload> sender) {
        final MyData payload = new MyData();
        sender.accept(payload);
    }

    @Override
    public ConfigurationTask.Type type() {
        return TYPE;
    }
}
```

## コンフィギュレーションタスクの完了通知 {#acknowledging-a-configuration-task}

設定はサーバーで実行され、サーバーは次のコンフィギュレーションタスクをいつ実行できるかを知る必要があります。これは、そのコンフィギュレーションタスクの実行完了を通知することで行います。

これを実現する方法は、主に 2 つあります。

### リスナーを保持する {#capturing-the-listener}

クライアントがコンフィギュレーションタスクの完了を通知する必要がない場合は、リスナーを保持しておき、サーバー側で直接コンフィギュレーションタスクの完了を通知できます。

```java
public record MyConfigurationTask(ServerConfigurationPacketListener listener) implements ICustomConfigurationTask {
    public static final ConfigurationTask.Type TYPE = new ConfigurationTask.Type(ResourceLocation.fromNamespaceAndPath("mymod", "my_task"));
    
    @Override
    public void run(final Consumer<CustomPacketPayload> sender) {
        final MyData payload = new MyData();
        sender.accept(payload);
        this.listener().finishCurrentTask(this.type());
    }

    @Override
    public ConfigurationTask.Type type() {
        return TYPE;
    }
}
```

このようなコンフィギュレーションタスクを使うには、`RegisterConfigurationTasksEvent` でリスナーを保持する必要があります。

```java
@SubscribeEvent // on the mod event bus
public static void register(final RegisterConfigurationTasksEvent event) {
    event.register(new MyConfigurationTask(event.getListener()));
}
```

こうすると、現在のコンフィギュレーションタスクが完了した直後に次のコンフィギュレーションタスクが実行され、クライアントはコンフィギュレーションタスクの完了を通知する必要がありません。また、サーバーは、送ったペイロードをクライアントが正しく処理するのを待ちません。

### コンフィギュレーションタスクの完了を通知する {#acknowledging-the-configuration-task}

クライアントがコンフィギュレーションタスクの完了を通知する必要がある場合は、独自のペイロードをクライアントに送る必要があります。

```java
public record AckPayload() implements CustomPacketPayload {
    public static final CustomPacketPayload.Type<AckPayload> TYPE = new CustomPacketPayload.Type<>(ResourceLocation.fromNamespaceAndPath("mymod", "ack"));
    
    // Unit codec with no data to write
    public static final StreamCodec<ByteBuf, AckPayload> STREAM_CODEC = StreamCodec.unit(new AckPayload());

    @Override
    public CustomPacketPayload.Type<? extends CustomPacketPayload> type() {
        return TYPE;
    }
}
```

サーバー側のコンフィギュレーションタスクから送られたペイロードを正しく処理できたら、このペイロードをサーバーに送って、コンフィギュレーションタスクの完了を通知できます。

```java
public void onMyData(MyData data, IPayloadContext context) {
    context.enqueueWork(() -> {
        blah(data.name());
    })
    .exceptionally(e -> {
        // Handle exception
        context.disconnect(Component.translatable("my_mod.configuration.failed", e.getMessage()));
        return null;
    })
    .thenAccept(v -> {
        context.reply(new AckPayload());
    });     
}
```

ここで、`onMyData` は、サーバー側のコンフィギュレーションタスクが送ったペイロードのハンドラです。

サーバーがこのペイロードを受け取ると、コンフィギュレーションタスクの完了が確認され、次のコンフィギュレーションタスクが実行されます。

```java
public void onAck(AckPayload payload, IPayloadContext context) {
    context.finishCurrentTask(MyConfigurationTask.TYPE);
}
```

ここで、`onAck` は、クライアントが送ったペイロードのハンドラです。

## ログイン処理の停滞 {#stalling-the-login-process}

設定の完了が通知されないと、サーバーは永遠に待ち続け、クライアントはいつまでもゲームに参加できません。そのため、コンフィギュレーションタスクの完了は必ず通知することが重要です。ただし、コンフィギュレーションタスクが失敗した場合は、クライアントを切断してもかまいません。
