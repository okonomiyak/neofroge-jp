---
sidebar_position: 2
---
# ストリームコーデック {#stream-codecs}

ストリームコーデックは、オブジェクトをバッファなどのストリームにどう格納し、そこからどう読み取るかを記述するためのシリアライズ用のツールです。ストリームコーデックは主に、バニラの[ネットワークの仕組み][networking]でデータを同期するために使われます。

:::info
ストリームコーデックは [Codec][codecs] とおおむね似ているため、共通点がわかるよう、このページは同じ構成にしています。
:::

## ストリームコーデックの使い方 {#using-stream-codecs}

ストリームコーデックは、`StreamCodec#encode` でオブジェクトをストリームにエンコードし、`StreamCodec#decode` でデコードします。`encode` は、ストリームと、そこにエンコードするオブジェクトを受け取ります。`decode` は、ストリームを受け取り、デコードしたオブジェクトを返します。通常、ストリームは `ByteBuf`、`FriendlyByteBuf`、`RegistryFriendlyByteBuf` のいずれかです。

```java
// Let exampleStreamCodec represent a StreamCodec<ExampleJavaObject>
// Let exampleObject be a ExampleJavaObject
// Let buffer be a RegistryFriendlyByteBuf

// Encode Java object into the buffer stream
exampleStreamCodec.encode(buffer, exampleObject);

// Read Java object from buffer stream
ExampleJavaObject obj = exampleStreamCodec.decode(buffer);
```

:::note
バッファのオブジェクトを手動で扱うのでない限り、通常 `encode` と `decode` を呼び出すことはありません。
:::

## 既存のストリームコーデック {#existing-stream-codecs}

### `ByteBufCodecs`

`ByteBufCodecs` には、いくつかのプリミティブとオブジェクト用のコーデックが static インスタンスとして含まれています。

| ストリームコーデック   | Java の型     |
|----------------|---------------|
| `BOOL`         | `Boolean`     |
| `BYTE`         | `Byte`        |
| `SHORT`        | `Short`       |
| `INT`          | `Integer`     |
| `FLOAT`        | `Float`       |
| `DOUBLE`       | `Double`      |
| `BYTE_ARRAY`   | `byte[]`\*    |
| `STRING_UTF8`  | `String`\*\*  |
| `TAG`          | `Tag`         |
| `COMPOUND_TAG` | `CompoundTag` |
| `VECTOR3F`     | `Vector3f`    |
| `QUATERNIONF`  | `Quaternionf` |
| `GAME_PROFILE` | `GameProfile` |

\* `byte[]` は、`ByteBufCodecs#byteArray` で値の数を制限できます。

\* `String` は、`ByteBufCodecs#stringUtf8` で文字数を制限できます。

さらに、別の方法でプリミティブやオブジェクトをエンコード・デコードする static インスタンスもいくつかあります。

#### 符号なし short {#unsigned-shorts}

`UNSIGNED_SHORT` は `SHORT` の代わりとなるもので、符号なしの数値として扱うためのものです。Java の数値は符号付きなので、符号なし short は、上位 2 バイトをマスクした `Integer` として送受信されます。

#### 可変長の数値 {#variable-sized-number}

`VAR_INT` と `VAR_LONG` は、値をできるだけ小さくエンコードするストリームコーデックです。これは 7 ビットずつエンコードし、最上位ビットを、その数値にまだ続きのデータがあるかどうかの目印として使うことで実現しています。整数なら 0 から 2^28-1、long なら 0 から 2^56-1 の数値は、それぞれ整数や long のバイト数以下で送られます。数値が通常この範囲にあり、多くの場合その下のほうの値であれば、これらの可変長のストリームコーデックを使ってください。

:::note
`VAR_INT` は `INT` の代わりとして使えます。
:::

#### 信頼済みタグ {#trusted-tags}

`TRUSTED_TAG` と `TRUSTED_COMPOUND_TAG` は、それぞれ `TAG` と `COMPOUND_TAG` の派生版です。`TAG` と `COMPOUND_TAG` にはデコード時に 2MiB の上限がありますが、こちらはタグをデコードするヒープに上限がありません。信頼済みタグのストリームコーデックは、理想的にはクライアント向けのパケットでのみ使うべきです。バニラでは、[BlockEntity のデータパケット][blockentity]や[エンティティのデータシリアライザ][entityserializer]で使われています。

別の上限を使いたい場合は、`ByteBufCodecs#tagCodec` または `#compoundTagCodec` を使い、そのサイズを指定した `NbtAccounter` を渡せます。

### バニラと NeoForge {#vanilla-and-neoforge}

Minecraft と NeoForge は、頻繁にエンコード・デコードされるオブジェクト用に、多くのストリームコーデックを定義しています。例としては、`ResourceLocation` 用の `ResourceLocation#STREAM_CODEC` や、`ChunkPos` 用の `NeoForgeStreamCodecs#CHUNK_POS` などがあります。

ほとんどのストリームコーデックは、そのオブジェクトのクラス自体か、`StreamCodec`、`ByteBufCodecs`、`NeoForgeStreamCodecs` の中にあります。

## ストリームコーデックの作成 {#creating-stream-codecs}

ストリームコーデックは、任意のオブジェクトをストリームに読み書きするために作成できます。主な用途であることから、このドキュメントではストリームがバッファである場合を中心に説明します。

ストリームコーデックには 2 つの型パラメータがあります。バッファを表す `B` と、オブジェクトの値を表す `V` です。`B` は通常、`ByteBuf`、`FriendlyByteBuf`、`RegistryFriendlyByteBuf` の 3 つの型のいずれかで、それぞれが順に継承しています。`FriendlyByteBuf` は Minecraft 固有の読み書きメソッドを追加し、`RegistryFriendlyByteBuf` は Registry の一覧とそのオブジェクトへのアクセスを提供します。

ストリームコーデックを構築するときは、`B` を最も汎用的なバッファの型にしてください。たとえば、`ResourceLocation` は文字列として送られます。文字列は通常の `ByteBuf` でサポートされているので、型は `StreamCodec<ByteBuf, ResourceLocation>` にします。`FriendlyByteBuf` には `ChunkPos` を書き込むメソッドがあるので、型は `StreamCodec<FriendlyByteBuf, ChunkPos>` にします。`Item` は Registry へのアクセスが必要なので、型は `StreamCodec<RegistryFriendlyByteBuf, Item>` にします。

ストリームコーデックを受け取るメソッドのほとんどは、バッファの型として `? super B` を求めます。つまり、バッファの型が `RegistryFriendlyByteBuf` であれば、上の 3 つの例はすべて使えます。

### メンバーエンコーダ {#member-encoders}

`StreamMemberEncoder` は `StreamEncoder` の代わりとなるもので、エンコードするオブジェクトが先、バッファが後になります。これは通常、エンコードするオブジェクトが、自身をバッファに書き込むインスタンスメソッドを持っている場合に使います。`StreamMemberEncoder` を使うと、`StreamCodec#ofMember` を呼び出して `StreamCodec` を作成できます。

```java
// Some object to create a stream codec for
public class ExampleObject {
    
    // The normal constructor
    public ExampleObject(String arg1, int arg2, boolean arg3) { /* ... */ }

    // The stream decoder reference
    public ExampleObject(ByteBuf buffer) { /* ... */ }

    // The stream encoder reference
    public void encode(ByteBuf buffer) { /* ... */ }
}

// What the stream codec would look like
public static StreamCodec<ByteBuf, ExampleObject> STREAM_CODEC =
    StreamCodec.ofMember(ExampleObject::encode, ExampleObject::new);
```

### 複合 {#composites}

ストリームコーデックは、`StreamCodec#composite` でオブジェクトを読み書きできます。各複合ストリームコーデックは、ストリームコーデックと getter の並びを定義し、指定した順に読み書きします。`composite` には、6 組までの引数を取るオーバーロードがあります。

`composite` の引数は 2 つずつ組になっており、フィールドの読み書きに使うストリームコーデックと、エンコードするフィールドをオブジェクトから取得する getter を表します。最後の引数は、デコード時にオブジェクトの新しいインスタンスを作成する関数です。

```java
// Objects to create a stream codec for
public record SimpleExample(String arg1, int arg2, boolean arg3) {}
public record RegistryExample(double arg1, Holder<Item> arg2) {}

// The stream codecs
public static final StreamCodec<ByteBuf, SimpleExample> SIMPLE_STREAM_CODEC =
    StreamCodec.composite(
        // Stream codec and getter pair
        ByteBufCodecs.STRING_UTF8, SimpleExample::arg1,
        ByteBufCodecs.VAR_INT, SimpleExample::arg2,
        ByteBufCodecs.BOOL, SimpleExample::arg3,
        SimpleExample::new
    );

// Since this has a holder, a RegistryFriendlyByteBuf is used
public static final StreamCodec<RegistryFriendlyByteBuf, RegistryExample> REGISTRY_STREAM_CODEC =
    StreamCodec.composite(
        // Note that ByteBuf stream codecs can be used here
        ByteBufCodecs.DOUBLE, RegistryExample::arg1,
        ByteBufCodecs.holderRegistry(Registries.ITEM), RegistryExample::arg2,
        RegistryExample::new
    );
```

### 変換 {#transformers}

ストリームコーデックは、マッピングのメソッドを使って、等価な、または部分的に等価な表現に変換できます。マッピングのメソッドのうち 2 つは値に、1 つはバッファに適用されます。

`map` メソッドは、2 つの関数を使って値を変換します。現在の型を新しい型に変換する関数と、新しい型を現在の型に戻す関数です。これは [Codec の変換][transformers]と同様です。

```java
public static final StreamCodec<ByteBuf, ResourceLocation> STREAM_CODEC = 
    ByteBufCodecs.STRING_UTF8.map(
        // String -> ResourceLocation
        ResourceLocation::new,
        // ResourceLocation -> String
        ResourceLocation::toString
    );
```

`apply` メソッドは、`StreamCodec.CodecOperation` を使って値を変換します。`StreamCodec.CodecOperation` は、現在の型のストリームコーデックを受け取り、新しい型のストリームコーデックを返します。これらは通常、`map` をラップするか、ヘルパーメソッドを受け取ります。

```java
public static final StreamCodec<ByteBuf, List<ResourceLocation>> STREAM_CODEC =
    ResourceLocation.STREAM_CODEC.apply(ByteBufCodecs.list());
```

`mapStream` メソッドは、新しいバッファの型を受け取って現在のバッファの型を返す関数を使って、バッファを変換します。ストリームコーデックを扱うメソッドのほとんどはバッファの型を変える必要がないため、このメソッドを使うことはまれです。

```java
public static final StreamCodec<RegistryFriendlyByteBuf, Integer> STREAM_CODEC =
    ByteBufCodecs.VAR_INT.mapStream(buffer -> (ByteBuf) buffer);
```

### Unit

コード内の値を提供し、エンコードすると何も出力しないストリームコーデックは、`StreamCodec#unit` で表せます。これは、ネットワーク経由で何も情報を同期すべきでない場合に便利です。

:::warning
unit ストリームコーデックは、エンコードするオブジェクトが指定した unit と一致することを前提としており、一致しないとエラーがスローされます。そのため、すべてのオブジェクトが unit のオブジェクトに対して true を返す `equals` の実装を持つか、エンコード時には常にストリームコーデックに渡したインスタンスが渡されるようにする必要があります。
:::

```java
public static final StreamCodec<ByteBuf, Item> UNIT_STREAM_CODEC =
    StreamCodec.unit(Items.AIR);
```
### 遅延初期化 {#lazy-initialized}

ストリームコーデックが、構築時にはまだ存在しないデータに依存することがあります。そのような場合は `NeoForgeStreamCodecs#lazy` を使うと、最初の読み書き時にストリームコーデック自身を構築させられます。このメソッドは、ストリームコーデックの Supplier を受け取ります。

```java
public static final StreamCodec<ByteBuf, Item> LAZY_STREAM_CODEC = 
    NeoForgeStreamCodecs.lazy(
        () -> StreamCodec.unit(Items.AIR)
    );
```

### コレクション {#collections}

コレクション用のストリームコーデックは、オブジェクトのストリームコーデックから `collection` で生成できます。`collection` は、空のコレクションを構築する `IntFunction`、オブジェクトのストリームコーデック、任意の最大サイズを受け取ります。

```java
public static final StreamCodec<ByteBuf, Set<BlockPos>> COLLECTION_STREAM_CODEC =
    ByteBufCodecs.collection(
        HashSet::new, // Constructs a set with the specified capacity
        BlockPos.STREAM_CODEC,
        256 // The set can only have up to 256 elements
    );
```

`collection` の別のオーバーロードは、`StreamCodec#apply` で指定できます。

```java
public static final StreamCodec<ByteBuf, Set<BlockPos>> COLLECTION_STREAM_CODEC =
    BlockPos.STREAM_CODEC.apply(
        ByteBufCodecs.collection(HashSet::new)
    );
```

リストベースのコレクションも、任意の最大サイズを渡して `ByteBufCodecs#list` を呼び出すことで、`StreamCodec#apply` を通じて指定できます。

```java
public static final StreamCodec<ByteBuf, List<BlockPos>> LIST_STREAM_CODEC =
    BlockPos.STREAM_CODEC.apply(
        // The list can only have up to 256 elements
        ByteBufCodecs.list(256)
    );
```

### マップ {#map}

キーと値のオブジェクトのマップ用のストリームコーデックは、2 つのストリームコーデックから `ByteBufCodecs#map` で生成できます。この関数は、空のマップを構築する `IntFunction` と、任意の最大サイズも受け取ります。

```java
public static final StreamCodec<ByteBuf, Map<String, BlockPos>> MAP_STREAM_CODEC =
    ByteBufCodecs.map(
        HashMap::new, // Constructs a map with the specified capacity
        ByteBufCodecs.STRING_UTF8,
        BlockPos.STREAM_CODEC,
        256 // The map can only have up to 256 elements
    );
```

### Either

あるオブジェクトのデータを 2 通りの方法で読み書きするストリームコーデックは、2 つのストリームコーデックから `ByteBufCodecs#either` で生成できます。このメソッドは、まず 1 つ目と 2 つ目のどちらのストリームコーデックで読み書きするかを示す真偽値を読み書きします。

```java
public static final StreamCodec<ByteBuf, Either<Integer, String>> EITHER_STREAM_CODEC = 
    ByteBufCodecs.either(
        ByteBufCodecs.VAR_INT,
        ByteBufCodecs.STRING_UTF8
    );
```

### ID マッパー {#id-mapper}

両方の Side に存在するオブジェクトについてネットワーク経由で情報を送る場合、ほとんどは ID を表す整数を送ります。オブジェクトを ID で表すと、ネットワーク経由で同期する必要のある情報量を減らせます。enum と Registry は、どちらもこれを利用しています。

`ByteBufCodecs#idMapper` は、オブジェクトの ID を送る便利な方法を提供します。これは、オブジェクトを int に、またその逆に変換する 2 つの関数か、`IdMap` を受け取ります。

```java
// For some enum
public enum ExampleIdObject {
    ;

    // Gets Id -> Enum
    public static final IntFunction<ExampleIdObject> BY_ID = 
        ByIdMap.continuous(
            ExampleIdObject::getId,
            ExampleIdObject.values(),
            ByIdMap.OutOfBoundsStrategy.ZERO
    );
    
    ExampleIdObject(int id) { /* ... */ }
}

// The stream codec would look like
public static final StreamCodec<ByteBuf, ExampleIdObject> ID_STREAM_CODEC =
    ByteBufCodecs.idMapper(ExampleIdObject.BY_ID, ExampleIdObject::getId);
```

:::note
NeoForge は、構築時に enum の値をキャッシュしない ID マッパーの代替として、`IExtensibleEnum#createStreamCodecForExtensibleEnum` を提供しています。ただし、拡張可能な enum 以外でこれが必要になることはまれです。
:::

### Optional

`Optional` でラップされた値を送るストリームコーデックは、`ByteBufCodecs#optional` にストリームコーデックを渡して生成できます。このメソッドは、まずオブジェクトを読み書きするかどうかを示す真偽値を読み書きします。

```java
public static final StreamCodec<RegistryFriendlyByteBuf, Optional<DataComponentType<?>>> OPTIONAL_STREAM_CODEC =
    DataComponentType.STREAM_CODEC.apply(ByteBufCodecs::optional);
```

### Registry のオブジェクト {#registry-objects}

Registry のオブジェクトは、`registry`、`holderRegistry`、`holder` の 3 つのメソッドのいずれかを使って、ネットワーク経由で送れます。どれも、Registry のオブジェクトが属する Registry を表す `ResourceKey` を受け取ります。

:::warning
カスタム Registry は、`RegistryBuilder#sync` を呼び出して値を `true` に設定し、同期できるようにしておく必要があります。そうしないと、エンコーダが例外をスローします。
:::

`registry` は Registry のオブジェクトを、`holderRegistry` はホルダーでラップされた Registry のオブジェクトを返します。これらのメソッドは、Registry のオブジェクトを表す ID を送ります。

```java
// Registry object
public static final StreamCodec<RegistryFriendlyByteBuf, Item> VALUE_STREAM_CODEC =
    BytebufCodecs.registry(Registries.ITEM);

// Holder of registry object
public static final StreamCodec<RegistryFriendlyByteBuf, Holder<Item>> HOLDER_STREAM_CODEC =
    BytebufCodecs.holderRegistry(Registries.ITEM);
```

`holder` は、ホルダーでラップされた Registry のオブジェクトを返します。このメソッドは、Registry のオブジェクトを表す ID を送ります。ただし、渡された `Holder` が直接参照の場合は、Registry のオブジェクト自体を送ります。そのため、`holder` は Registry のオブジェクトのストリームコーデックも受け取ります。

```java
public static final StreamCodec<RegistryFriendlyByteBuf, Holder<SoundEvent>> STREAM_CODEC =
    ByteBufCodecs.holder(
        Registries.SOUND_EVENT, SoundEvent.DIRECT_STREAM_CODEC
    );
```

:::note
`holder` が同期されないカスタム Registry に対して例外をスローするのは、ホルダーが直接参照でない場合だけです。
:::

### ホルダーセット {#holder-sets}

タグや、ホルダーでラップされた Registry のオブジェクトのセットは、`holderSet` を使って送れます。これは、Registry のオブジェクトが属する Registry を表す `ResourceKey` を受け取ります。

```java
public static final StreamCodec<RegistryFriendlyByteBuf, HolderSet<Item>> HOLDER_SET_STREAM_CODEC =
    BytebufCodecs.holderSet(Registries.ITEM);
```

### 再帰 {#recursive}

オブジェクトが、同じ型のオブジェクトをフィールドとして参照することがあります。たとえば `MobEffectInstance` は、隠れた効果がある場合に、任意で `MobEffectInstance` を受け取ります。この場合は `StreamCodec#recursive` を使うと、ストリームコーデックを作る関数の一部として、そのストリームコーデック自身を渡せます。

```java
// Define our recursive object
public record RecursiveObject(Optional<RecursiveObject> inner) { /* ... */ }

public static final StreamCodec<ByteBuf, RecursiveObject> RECURSIVE_CODEC = StreamCodec.recursive(
    recursedStreamCodec -> StreamCodec.composite(
        recursedStreamCodec.apply(ByteBufCodecs::optional),
        RecursiveObject::inner,
        RecursiveObject::new
    )
);
```

### ディスパッチ {#dispatch}

ストリームコーデックは、`StreamCodec#dispatch` によって、指定された型に基づいて特定のオブジェクトをデコードできるサブストリームコーデックを持てます。これは通常、`ParticleOptions` に対する `ParticleType` や、`Stat` に対する `StatType` のような、型を表す Registry のオブジェクトとともに使われます。

ディスパッチストリームコーデックは、まず型のオブジェクトを読み書きしようとします。そこから、メソッドに渡された関数のいずれかを使って、現在のオブジェクトを読み書きします。1 つ目の `Function` は、現在のオブジェクトを受け取り、値を書き込むための型を取得します。2 つ目の `Function` は、型のオブジェクトを受け取り、値を読み取るための、現在のオブジェクト用の `StreamCodec` を取得します。

```java
// Define our object(s)
public abstract class ExampleObject {

    // Define the method used to specify the object type for encoding
    public abstract StreamCodec<? super RegistryFriendlyByteBuf, ? extends ExampleObject> streamCodec();
}

// Assume there is a ResourceKey<StreamCodec< super RegistryFriendlyByteBuf, ? extends ExampleObject>> DISPATCH
public static final StreamCodec<RegistryFriendlyByteBuf, ExampleObject> DISPATCH_STREAM_CODEC =
    ByteBufCodecs.registry(DISPATCH).dispatch(
        // Get the stream codec from the specific object
        ExampleObject::streamCodec,
        // Get the stream codec from the registry object
        Function.identity()
    )
```

[networking]: ./payload.md
[codecs]: ../datastorage/codecs.md
[blockentity]: ../blockentities/index.md#synchronizing-on-block-update
[entityserializer]: ../networking/entities.md#dynamic-data-parameters
[transformers]: ../datastorage/codecs.md#transformers
