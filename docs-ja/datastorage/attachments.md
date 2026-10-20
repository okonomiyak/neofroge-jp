---
sidebar_position: 3
---
# データアタッチメント {#data-attachments}

データアタッチメントのシステムを使うと、Mod は BlockEntity、チャンク、エンティティに追加のデータを付与して保存できます。

_レベルに追加のデータを保存するには、[SavedData][saveddata] を使えます。_

:::note
アイテムスタック向けのデータアタッチメントは、バニラの[データコンポーネント][datacomponents]に置き換えられました。
:::

## アタッチメントタイプの作成 {#creating-an-attachment-type}

このシステムを使うには、`AttachmentType` を登録する必要があります。アタッチメントタイプには、次の設定が含まれます。

- データに初めてアクセスしたときにインスタンスを作成する、デフォルト値の Supplier。
- アタッチメントを永続化する場合の、任意のシリアライザ。
- ( シリアライザを設定した場合 )死亡時にエンティティのデータを自動でコピーする `copyOnDeath` フラグ( 後述 )。

:::tip
アタッチメントを永続化したくない場合は、シリアライザを指定しないでください。
:::

アタッチメントのシリアライザを指定する方法はいくつかあります。`IAttachmentSerializer` を直接実装する方法、`INBTSerializable` を実装し、static な `AttachmentType#serializable` メソッドでビルダーを作成する方法、ビルダーに Codec を渡す方法です。

いずれの場合も、アタッチメントは `NeoForgeRegistries.ATTACHMENT_TYPES` Registry に**登録する必要があります**。例を示します。

```java
// Create the DeferredRegister for attachment types
private static final DeferredRegister<AttachmentType<?>> ATTACHMENT_TYPES = DeferredRegister.create(NeoForgeRegistries.ATTACHMENT_TYPES, MOD_ID);

// Serialization via INBTSerializable
private static final Supplier<AttachmentType<ItemStackHandler>> HANDLER = ATTACHMENT_TYPES.register(
    "handler", () -> AttachmentType.serializable(() -> new ItemStackHandler(1)).build()
);
// Serialization via codec
private static final Supplier<AttachmentType<Integer>> MANA = ATTACHMENT_TYPES.register(
    "mana", () -> AttachmentType.builder(() -> 0).serialize(Codec.INT).build()
);
// No serialization
private static final Supplier<AttachmentType<SomeCache>> SOME_CACHE = ATTACHMENT_TYPES.register(
    "some_cache", () -> AttachmentType.builder(() -> new SomeCache()).build()
);

// In your mod constructor, don't forget to register the DeferredRegister to your mod bus:
ATTACHMENT_TYPES.register(modBus);
```

## アタッチメントタイプの使用 {#using-the-attachment-type}

アタッチメントタイプを登録したら、任意のホルダーオブジェクトで使えます。データがない状態で `getData` を呼び出すと、新しいデフォルトのインスタンスが付与されます。

```java
// Get the ItemStackHandler if it already exists, else attach a new one:
ItemStackHandler stackHandler = chunk.getData(HANDLER);
// Get the current player mana if it is available, else attach 0:
int playerMana = player.getData(MANA);
// And so on...
```

デフォルトのインスタンスを付与したくない場合は、`hasData` のチェックを加えられます。

```java
// Check if the chunk has the HANDLER attachment before doing anything.
if (chunk.hasData(HANDLER)) {
    ItemStackHandler stackHandler = chunk.getData(HANDLER);
    // Do something with chunk.getData(HANDLER).
}
```

データは `setData` で更新することもできます。

```java
// Increment mana by 10.
player.setData(MANA, player.getData(MANA) + 10);
```

:::important
通常、BlockEntity やチャンクは、変更したときにダーティとしてマークする必要があります( `setChanged` や `setUnsaved(true)` で行います )。`setData` を呼び出した場合は、これが自動で行われます。

```java
chunk.setData(MANA, chunk.getData(MANA) + 10); // will call setUnsaved automatically
```

ただし、`getData` で取得したデータ( 新しく作成されたデフォルトのインスタンスを含む )を変更した場合は、BlockEntity やチャンクを明示的にダーティとしてマークする必要があります。

```java
var mana = chunk.getData(MUTABLE_MANA);
mana.set(10);
chunk.setUnsaved(true); // must be done manually because we did not use setData
```
:::

## クライアントとのデータ共有 {#sharing-data-with-the-client}

BlockEntity、チャンク、エンティティのアタッチメントをクライアントに同期するには、自分で[クライアントにパケットを送る][network]必要があります。チャンクの場合は、`ChunkWatchEvent.Sent` を使うと、プレイヤーにチャンクのデータを送るべきタイミングがわかります。

## プレイヤー死亡時のデータのコピー {#copying-data-on-player-death}

デフォルトでは、エンティティのデータアタッチメントはプレイヤーの死亡時にコピーされません。プレイヤーの死亡時にアタッチメントを自動でコピーするには、アタッチメントのビルダーで `copyOnDeath` を設定します。

より複雑な処理は、`PlayerEvent.Clone` で、元のエンティティからデータを読み取って新しいエンティティに割り当てることで実装できます。この Event では、`#isWasDeath` メソッドを使って、死亡後のリスポーンとジ・エンドからの帰還を区別できます。この区別が重要なのは、ジ・エンドから帰還する場合はデータがすでに存在するためです。そのため、この場合は値を重複させないよう注意が必要です。

例:

```java
NeoForge.EVENT_BUS.register(PlayerEvent.Clone.class, event -> {
    if (event.isWasDeath() && event.getOriginal().hasData(MY_DATA)) {
        event.getEntity().getData(MY_DATA).fieldToCopy = event.getOriginal().getData(MY_DATA).fieldToCopy;
    }
});
```

[saveddata]: ./saveddata.md
[datacomponents]: ../items/datacomponents.md
[network]: ../networking/index.md
