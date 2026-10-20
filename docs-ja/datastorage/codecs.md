---
sidebar_position: 2
---
# Codec {#codecs}

Codec は、Mojang の [DataFixerUpper][DataFixerUpper] に含まれるシリアライズ用のツールです。JSON 用の `JsonElement` や NBT 用の `Tag` など、異なるフォーマットの間でオブジェクトをどう変換するかを記述するのに使います。

## Codec の使い方 {#using-codecs}

Codec の主な用途は、Java のオブジェクトを何らかのデータフォーマットの型にエンコード( シリアライズ )することと、フォーマット済みのデータオブジェクトを対応する Java の型にデコード( デシリアライズ )して戻すことです。通常、それぞれ `Codec#encodeStart` と `Codec#parse` を使って行います。

### DynamicOps

どの中間ファイルフォーマットにエンコード・デコードするかを決めるため、`#encodeStart` と `#parse` はどちらも、そのフォーマットでのデータを定義する `DynamicOps` のインスタンスを必要とします。

[DataFixerUpper][DataFixerUpper] ライブラリには、[`Gson`][gson] の `JsonElement` インスタンスに格納された JSON データを Codec で扱うための `JsonOps` が含まれています。`JsonOps` は、`JsonElement` のシリアライズを 2 種類サポートしています。標準的な JSON ファイルを定義する `JsonOps#INSTANCE` と、データを 1 つの文字列に圧縮できる `JsonOps#COMPRESSED` です。

```java
// Let exampleCodec represent a Codec<ExampleJavaObject>
// Let exampleObject be a ExampleJavaObject
// Let exampleJson be a JsonElement

// Encode Java object to regular JsonElement
exampleCodec.encodeStart(JsonOps.INSTANCE, exampleObject);

// Encode Java object to compressed JsonElement
exampleCodec.encodeStart(JsonOps.COMPRESSED, exampleObject);

// Decode JsonElement into Java object
// Assume JsonElement was parsed normally
exampleCodec.parse(JsonOps.INSTANCE, exampleJson);
```

Minecraft は、`Tag` インスタンスに格納された NBT データを Codec で扱うための `NbtOps` も提供しています。これは `NbtOps#INSTANCE` で参照できます。

```java
// Let exampleCodec represent a Codec<ExampleJavaObject>
// Let exampleObject be a ExampleJavaObject
// Let exampleNbt be a Tag

// Encode Java object to Tag
exampleCodec.encodeStart(NbtOps.INSTANCE, exampleObject);

// Decode Tag into Java object
exampleCodec.parse(NbtOps.INSTANCE, exampleNbt);
```

Registry のエントリを扱うために、Minecraft は `RegistryOps` を提供しています。これには、利用可能な Registry の要素を取得するためのルックアッププロバイダが含まれます。これは `RegistryOps#create` で作成でき、データを格納する具体的な型の `DynamicOps` と、利用可能な Registry にアクセスできるルックアッププロバイダを受け取ります。NeoForge は `RegistryOps` を拡張して `ConditionalOps` を作っています。これは、[エントリを読み込む条件][conditions]を扱える、Registry の Codec のルックアップです。

```java
// Let lookupProvider be a HolderLookup.Provider
// Let exampleCodec represent a Codec<ExampleJavaObject>
// Let exampleObject be a ExampleJavaObject
// Let exampleJson be a JsonElement

// Get the registry ops for JsonElement
RegistryOps<JsonElement> ops = RegistryOps.create(JsonOps.INSTANCE, lookupProvider);

// Encode Java object to JsonElement
exampleCodec.encodeStart(ops, exampleObject);

// Decode JsonElement into Java object
exampleCodec.parse(ops, exampleJson);
```

#### フォーマットの変換 {#format-conversion}

`DynamicOps` は、2 つの異なるエンコード済みフォーマットの間で変換するために単独で使うこともできます。これには、`#convertTo` に変換先の `DynamicOps` フォーマットと、変換するエンコード済みオブジェクトを渡します。

```java
// Convert Tag to JsonElement
// Let exampleTag be a Tag
JsonElement convertedJson = NbtOps.INSTANCE.convertTo(JsonOps.INSTANCE, exampleTag);
```

### DataResult

Codec でエンコード・デコードすると、`DataResult` が返されます。これは変換が成功したかどうかに応じて、変換後のインスタンスか、何らかのエラーデータを保持します。変換が成功した場合は、`#result` が返す `Optional` に、変換に成功したオブジェクトが含まれます。変換が失敗した場合は、`#error` が返す `Optional` に `PartialResult` が含まれます。これはエラーメッセージと、Codec によっては部分的に変換されたオブジェクトを保持します。

さらに、`DataResult` には、結果やエラーを目的の形式に変換するためのメソッドが多数あります。たとえば `#resultOrPartial` は、成功時には結果を、失敗時には部分的に変換されたオブジェクトを含む `Optional` を返します。このメソッドは、エラーメッセージがある場合にそれをどう報告するかを決める、文字列の Consumer を受け取ります。

```java
// Let exampleCodec represent a Codec<ExampleJavaObject>
// Let exampleJson be a JsonElement

// Decode JsonElement into Java object
DataResult<ExampleJavaObject> result = exampleCodec.parse(JsonOps.INSTANCE, exampleJson);

result
    // Get result or partial on error, report error message
    .resultOrPartial(errorMessage -> /* Do something with error message */)
    // If result or partial is present, do something
    .ifPresent(decodedObject -> /* Do something with decoded object */);
```

## 既存の Codec {#existing-codecs}

### プリミティブ {#primitives}

`Codec` クラスには、定義済みのいくつかのプリミティブ用の Codec が static インスタンスとして含まれています。

Codec         | Java の型
:---:         | :---
`BOOL`        | `Boolean`
`BYTE`        | `Byte`
`SHORT`       | `Short`
`INT`         | `Integer`
`LONG`        | `Long`
`FLOAT`       | `Float`
`DOUBLE`      | `Double`
`STRING`      | `String`\*
`BYTE_BUFFER` | `ByteBuffer`
`INT_STREAM`  | `IntStream`
`LONG_STREAM` | `LongStream`
`PASSTHROUGH` | `Dynamic<?>`\*\*
`EMPTY`       | `Unit`\*\*\*

\* `String` は、`Codec#string` または `Codec#sizeLimitedString` で文字数を制限できます。

\*\* `Dynamic` は、サポートされている `DynamicOps` のフォーマットでエンコードされた値を保持するオブジェクトです。通常、エンコード済みオブジェクトのフォーマットを、別のエンコード済みオブジェクトのフォーマットに変換するのに使われます。

\*\*\* `Unit` は、`null` のオブジェクトを表すために使われるオブジェクトです。

### バニラと NeoForge {#vanilla-and-neoforge}

Minecraft と NeoForge は、頻繁にエンコード・デコードされるオブジェクト用に、多くの Codec を定義しています。例としては、`ResourceLocation` 用の `ResourceLocation#CODEC`、`DateTimeFormatter#ISO_INSTANT` 形式の `Instant` 用の `ExtraCodecs#INSTANT_ISO8601`、`CompoundTag` 用の `CompoundTag#CODEC` などがあります。

:::caution
`CompoundTag` は、`JsonOps` を使って JSON から数値のリストをデコードすることはできません。`JsonOps` は変換時に、数値を最も狭い型に設定します。`ListTag` はデータに特定の型を強制するため、型の異なる数値( 例: `64` は `byte`、`384` は `short` になる )があると、変換時にエラーがスローされます。
:::

バニラと NeoForge の Registry には、その Registry が含むオブジェクトの型用の Codec もあります( 例: `BuiltInRegistries#BLOCK` は `Codec<Block>` を持ちます )。`Registry#byNameCodec` は、Registry のオブジェクトをその Registry 名にエンコードします。バニラの Registry には `Registry#holderByNameCodec` もあり、これは Registry 名にエンコードし、`Holder` でラップされた Registry のオブジェクトにデコードします。

## Codec の作成 {#creating-codecs}

Codec は、任意のオブジェクトをエンコード・デコードするために作成できます。理解しやすいように、対応するエンコード済みの JSON も示します。

### レコード {#records}

Codec では、レコードを使ってオブジェクトを定義できます。各レコード Codec は、明示的に名前の付いたフィールドを持つ任意のオブジェクトを定義します。レコード Codec の作り方はいくつもありますが、最も簡単なのは `RecordCodecBuilder#create` を使う方法です。

`RecordCodecBuilder#create` は、`Instance` を定義してオブジェクトのアプリケーション( `App` )を返す関数を受け取ります。これは、クラスの*インスタンス*を作ることと、そのクラスを構築されたオブジェクトに*適用*するために使うコンストラクタとの関係になぞらえられます。

```java
// Some object to create a codec for
public class SomeObject {

    public SomeObject(String s, int i, boolean b) { /* ... */ }

    public String s() { /* ... */ }

    public int i() { /* ... */ }

    public boolean b() { /* ... */ }
}
```

#### フィールド {#fields}

`Instance` では、`#group` を使って最大 16 個のフィールドを定義できます。各フィールドは、オブジェクトを作る対象のインスタンスと、オブジェクトの型を定義するアプリケーションである必要があります。この要件を満たす最も簡単な方法は、`Codec` を使い、デコード元となるフィールドの名前と、フィールドのエンコードに使う getter を設定することです。

フィールドは `Codec` から作成できます。フィールドが必須なら `#fieldOf` を、`Optional` でラップされているかデフォルト値がある場合は `#optionalFieldOf` を使います。どちらのメソッドも、エンコード済みオブジェクトでのフィールド名を表す文字列を必要とします。そのうえで、フィールドのエンコードに使う getter を `#forGetter` で設定できます。これは、オブジェクトを受け取ってフィールドのデータを返す関数を受け取ります。

:::warning
`#optionalFieldOf` は、パース時にエラーをスローする要素があると、エラーをスローします。エラーを握りつぶしたい場合は、代わりに `#lenientOptionalFieldOf` を使ってください。
:::

そこから、得られた結果に `#apply` を適用して、アプリケーションのためにインスタンスがオブジェクトをどう構築するかを定義します。便利なように、グループ化したフィールドはコンストラクタでの順序と同じ順に並べてください。そうすれば、関数を単にコンストラクタのメソッド参照にできます。

```java
public static final Codec<SomeObject> RECORD_CODEC = RecordCodecBuilder.create(instance -> // Given an instance
    instance.group( // Define the fields within the instance
        Codec.STRING.fieldOf("s").forGetter(SomeObject::s), // String
        Codec.INT.optionalFieldOf("i", 0).forGetter(SomeObject::i), // Integer, defaults to 0 if field not present
        Codec.BOOL.fieldOf("b").forGetter(SomeObject::b) // Boolean
    ).apply(instance, SomeObject::new) // Define how to create the object
);
```

```json5
// Encoded SomeObject
{
    "s": "value",
    "i": 5,
    "b": false
}

// Another encoded SomeObject
{
    "s": "value2",
    // i is omitted, defaults to 0
    "b": true
}

// Another encoded SomeObject
{
    "s": "value2",
    // Will throw an error as lenientOptionalFieldOf is not used
    "i": "bad_value",
    "b": true
}
```

### 変換 {#transformers}

Codec は、マッピングのメソッドを使って、等価な、または部分的に等価な表現に変換できます。各マッピングのメソッドは 2 つの関数を受け取ります。現在の型を新しい型に変換する関数と、新しい型を現在の型に戻す関数です。これは `#xmap` 関数で行います。

```java
// A class
public class ClassA {

    public ClassB toB() { /* ... */ }
}

// Another equivalent class
public class ClassB {

    public ClassA toA() { /* ... */ }
}

// Assume there is some codec A_CODEC
public static final Codec<ClassB> B_CODEC = A_CODEC.xmap(ClassA::toB, ClassB::toA);
```

型が部分的に等価な場合、つまり変換時に何らかの制約がある場合は、`DataResult` を返すマッピング関数があります。これを使うと、例外や不正な状態になったときにエラー状態を返せます。

A は B と完全に等価か | B は A と完全に等価か | 変換メソッド
:---:                      | :---:                      | :---
はい                        | はい                        | `#xmap`
はい                        | いいえ                         | `#flatComapMap`
いいえ                         | はい                        | `#comapFlatMap`
いいえ                         | いいえ                         | `#flatXMap`

```java
// Given an string codec to convert to a integer
// Not all strings can become integers (A is not fully equivalent to B)
// All integers can become strings (B is fully equivalent to A)
public static final Codec<Integer> INT_CODEC = Codec.STRING.comapFlatMap(
    s -> { // Return data result containing error on failure
        try {
            return DataResult.success(Integer.valueOf(s));
        } catch (NumberFormatException e) {
            return DataResult.error(s + " is not an integer.");
        }
    },
    Integer::toString // Regular function
);
```

```json5
// Will return 5
"5"

// Will error, not an integer
"value"
```

#### 範囲 Codec {#range-codecs}

範囲 Codec は `#flatXMap` の実装の一つで、値が設定した最小値と最大値の範囲( 両端を含む )に入っていない場合に、エラーの `DataResult` を返します。範囲外の場合でも、値は部分的な結果として提供されます。整数、float、double 用に、それぞれ `#intRange`、`#floatRange`、`#doubleRange` の実装があります。

```java
public static final Codec<Integer> RANGE_CODEC = Codec.intRange(0, 4); 
```

```json5
// Will be valid, inside [0, 4]
4

// Will error, outside [0, 4]
5
```

#### 文字列リゾルバ {#string-resolver}

`Codec#stringResolver` は `flatXmap` の実装の一つで、文字列を何らかのオブジェクトに対応付けます。

```java
public record StringResolverObject(String name) { /* ... */ }

// Assume there is some Map<String, StringResolverObject> OBJECT_MAP
public static final Codec<StringResolverObject> STRING_RESOLVER_CODEC = Codec.stringResolver(StringResolverObject::name, OBJECT_MAP::get);
```

```json5
// Will map this string to its associated object
"example_name"
```

### デフォルト値 {#defaults}

エンコードやデコードが失敗した場合は、`Codec#orElse` または `Codec#orElseGet` で、代わりにデフォルト値を提供できます。

```java
public static final Codec<Integer> DEFAULT_CODEC = Codec.INT.orElse(
    errorMessage -> /* Do something with the error message */,
    0 // Can also be a supplied value via #orElseGet
); 
```

```json5
// Not an integer, defaults to 0
"value"
```

### Unit

コード内の値を提供し、エンコードすると何も出力しない Codec は、`Codec#unit` で表せます。これは、Codec がデータオブジェクト内でエンコードできないエントリを使う場合に便利です。

```java
public static final Codec<IEventBus> UNIT_CODEC = Codec.unit(
    () -> NeoForge.EVENT_BUS // Can also be a raw value
);
```

```json5
// Nothing here, will return the NeoForge event bus
```

### 遅延初期化 {#lazy-initialized}

Codec が、構築時にはまだ存在しないデータに依存することがあります。そのような場合は `Codec#lazyInitialized` を使うと、最初のエンコード・デコード時に Codec 自身を構築させられます。このメソッドは、Codec の Supplier を受け取ります。

```java
public static final Codec<IEventBus> LAZY_CODEC = Codec.lazyInitialized(
    () -> Codec.Unit(NeoForge.EVENT_BUS)
);
```

```json5
// Nothing here, will return the NeoForge event bus
// Encodes/decodes the same way as the normal codec
```

### リスト {#list}

オブジェクトのリスト用の Codec は、オブジェクトの Codec から `Codec#listOf` で生成できます。`listOf` は、リストの最小サイズと最大サイズを表す整数を受け取ることもできます。`sizeLimitedListOf` も同様ですが、上限だけを指定します。

```java
// BlockPos#CODEC is a Codec<BlockPos>
public static final Codec<List<BlockPos>> LIST_CODEC = BlockPos.CODEC.listOf();
```

```json5
// Encoded List<BlockPos>
[
    [1, 2, 3], // BlockPos(1, 2, 3)
    [4, 5, 6], // BlockPos(4, 5, 6)
    [7, 8, 9]  // BlockPos(7, 8, 9)
]
```

リスト Codec でデコードしたリストのオブジェクトは、**イミュータブル**なリストに格納されます。ミュータブルなリストが必要な場合は、リスト Codec に[変換][transformer]を適用してください。

### マップ {#map}

キーと値のオブジェクトのマップ用の Codec は、2 つの Codec から `Codec#unboundedMap` で生成できます。unbounded マップでは、文字列ベースの値、または文字列に変換された値であれば、何でもキーに指定できます。

```java
// BlockPos#CODEC is a Codec<BlockPos>
public static final Codec<Map<String, BlockPos>> MAP_CODEC = Codec.unboundedMap(Codec.STRING, BlockPos.CODEC);
```

```json5
// Encoded Map<String, BlockPos>
{
    "key1": [1, 2, 3], // key1 -> BlockPos(1, 2, 3)
    "key2": [4, 5, 6], // key2 -> BlockPos(4, 5, 6)
    "key3": [7, 8, 9]  // key3 -> BlockPos(7, 8, 9)
}
```

unbounded マップの Codec でデコードしたマップのオブジェクトは、**イミュータブル**なマップに格納されます。ミュータブルなマップが必要な場合は、マップの Codec に[変換][transformer]を適用してください。

:::caution
unbounded マップがサポートするのは、文字列との間でエンコード・デコードできるキーだけです。この制限を回避するには、キーと値の[ペア][pair]のリスト Codec を使えます。
:::

### ペア {#pair}

オブジェクトのペア用の Codec は、2 つの Codec から `Codec#pair` で生成できます。

ペア Codec は、まずペアの左側のオブジェクトをデコードし、次にエンコード済みオブジェクトの残りの部分を使って右側のオブジェクトをデコードします。そのため、Codec は、デコード後のエンコード済みオブジェクトについて何かを表すもの( [レコード][records]など )であるか、`MapCodec` に拡張したうえで `#codec` で通常の Codec に変換したものである必要があります。これは通常、Codec を何らかのオブジェクトの[フィールド][field]にすることで行えます。

```java
public static final Codec<Pair<Integer, String>> PAIR_CODEC = Codec.pair(
    Codec.INT.fieldOf("left").codec(),
    Codec.STRING.fieldOf("right").codec()
);
```

```json5
// Encoded Pair<Integer, String>
{
    "left": 5,       // fieldOf looks up 'left' key for left object
    "right": "value" // fieldOf looks up 'right' key for right object
}
```

:::tip
文字列でないキーを持つマップの Codec は、キーと値のペアのリストに[変換][transformer]を適用することで、エンコード・デコードできます。
:::

### Either

あるオブジェクトのデータを 2 通りの方法でエンコード・デコードする Codec は、2 つの Codec から `Codec#either` で生成できます。

either Codec は、まず 1 つ目の Codec でオブジェクトのデコードを試みます。失敗した場合は、2 つ目の Codec でデコードを試みます。それも失敗した場合、`DataResult` には 2 つ目の Codec の失敗によるエラーだけが含まれます。

```java
public static final Codec<Either<Integer, String>> EITHER_CODEC = Codec.either(
    Codec.INT,
    Codec.STRING
);
```

```json5
// Encoded Either.Left<Integer, String>
5

// Encoded Either.Right<Integer, String>
"value"
```

:::tip
これを[変換][transformer]と組み合わせると、2 通りのエンコード方法から特定のオブジェクトを得られます。
:::

#### Xor

`Codec#xor` は [either][either] Codec の特殊なケースで、2 つの方法のうちどちらか一方だけが処理に成功した場合にのみ、結果が成功になります。両方の Codec で処理できた場合は、代わりにエラーがスローされます。

```java
public static final Codec<Either<Integer, String>> XOR_CODEC = Codec.xor(
    Codec.INT.fieldOf("number").codec(),
    Codec.STRING.fieldOf("text").codec()
);
```

```json5
// Encoded Either.Left<Integer, String>
{
    "number": 4
}

// Encoded Either.Right<Integer, String>
{
    "text": "value"
}

// Throws an error as both can be decoded
{
    "number": 4,
    "text": "value"
}
```

#### Alternative

`Codec#withAlternative` は [either][either] Codec の特殊なケースで、2 つの Codec が、異なるフォーマットで保存された同じオブジェクトをデコードしようとします。まず 1 つ目( プライマリ )の Codec がオブジェクトのデコードを試みます。失敗した場合は、代わりに 2 つ目の Codec が使われます。エンコードには常にプライマリの Codec が使われます。

```java
public static final Codec<BlockPos> ALTERNATIVE_CODEC = Codec.withAlternative(
    BlockPos.CODEC,
    RecordCodecBuilder.create(instance -> instance.group(
        Codec.INT.fieldOf("x").forGetter(BlockPos::getX),
        Codec.INT.fieldOf("y").forGetter(BlockPos::getY),
        Codec.INT.fieldOf("z").forGetter(BlockPos::getZ)
    ), BlockPos::new)
);
```

```json5
// Normal method to decode BlockPos
[ 1, 2, 3 ]

// Alternative method to decode BlockPos
{
    "x": 1,
    "y": 2,
    "z": 3
}
```

### 再帰 {#recursive}

オブジェクトが、同じ型のオブジェクトをフィールドとして参照することがあります。たとえば `EntityPredicate` は、乗り物、乗客、対象のエンティティについて `EntityPredicate` を受け取ります。この場合は `Codec#recursive` を使うと、Codec を作る関数の一部として、その Codec 自身を渡せます。

```java
// Define our recursive object
public record RecursiveObject(Optional<RecursiveObject> inner) { /* ... */ }

public static final Codec<RecursiveObject> RECURSIVE_CODEC = Codec.recursive(
    RecursiveObject.class.getSimpleName(), // This is for the toString method
    recursedCodec -> RecordCodecBuilder.create(instance -> instance.group(
        recursedCodec.optionalFieldOf("inner").forGetter(RecursiveObject::inner)
    ).apply(instance, RecursiveObject::new))
);
```

```json5
// An encoded recursive object
{
    "inner": {
        "inner": {}
    }
}
```

### ディスパッチ {#dispatch}

Codec は、`Codec#dispatch` によって、指定された型に基づいて特定のオブジェクトをデコードできるサブ Codec を持てます。これは通常、ルールテストやブロックプレーサーなど、Codec を含む Registry で使われます。

ディスパッチ Codec は、まず何らかの文字列のキー( 通常は `type` )からエンコード済みの型を取得しようとします。そこから型がデコードされ、実際のオブジェクトのデコードに使う特定の Codec の getter が呼ばれます。オブジェクトのデコードに使う `DynamicOps` がマップを圧縮する場合や、オブジェクトの Codec 自体が `MapCodec` に拡張されていない場合( レコードやフィールド化されたプリミティブなど )は、オブジェクトを `value` キーの中に格納する必要があります。そうでなければ、オブジェクトは他のデータと同じ階層でデコードされます。

```java
// Define our object
public abstract class ExampleObject {

    // Define the method used to specify the object type for encoding
    public abstract MapCodec<? extends ExampleObject> type();
}

// Create simple object which stores a string
public class StringObject extends ExampleObject {

    public StringObject(String s) { /* ... */ }

    public String s() { /* ... */ }

    public MapCodec<? extends ExampleObject> type() {
        // A registered registry object
        // "string":
        //   Codec.STRING.xmap(StringObject::new, StringObject::s).fieldOf("string")
        return STRING_OBJECT_CODEC.get();
    }
}

// Create complex object which stores a string and integer
public class ComplexObject extends ExampleObject {

    public ComplexObject(String s, int i) { /* ... */ }

    public String s() { /* ... */ }

    public int i() { /* ... */ }

    public MapCodec<? extends ExampleObject> type() {
        // A registered registry object
        // "complex":
        //   RecordCodecBuilder.mapCodec(instance ->
        //     instance.group(
        //       Codec.STRING.fieldOf("s").forGetter(ComplexObject::s),
        //       Codec.INT.fieldOf("i").forGetter(ComplexObject::i)
        //     ).apply(instance, ComplexObject::new)
        //   )
        return COMPLEX_OBJECT_CODEC.get();
    }
}

// Assume there is an Registry<MapCodec<? extends ExampleObject>> DISPATCH
public static final Codec<ExampleObject> = DISPATCH.byNameCodec() // Gets Codec<MapCodec<? extends ExampleObject>>
    .dispatch(
        ExampleObject::type, // Get the codec from the specific object
        Function.identity() // Get the codec from the registry
    );
```

```json5
// Simple object
{
    "type": "string", // For StringObject
    "value": "value" // Codec type is not augmented from MapCodec, needs field
}

// Complex object
{
    "type": "complex", // For ComplexObject

    // Codec type is augmented from MapCodec, can be inlined
    "s": "value",
    "i": 0
}
```

[DataFixerUpper]: https://github.com/Mojang/DataFixerUpper
[gson]: https://github.com/google/gson
[conditions]: ../resources/server/conditions.md
[transformer]: #transformer-codecs
[pair]: #pair
[records]: #records
[field]: #fields
[either]: #either
