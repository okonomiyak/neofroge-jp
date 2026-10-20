---
sidebar_position: 2
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# データコンポーネント {#data-components}

データコンポーネントは、`ItemStack` にデータを保存するために使われる、マップ内のキーと値のペアです。花火の爆発や道具など、それぞれのデータは実際のオブジェクトとしてスタックに保存されます。そのため、汎用的なエンコード済みのインスタンス( 例: `CompoundTag`、`JsonElement` )を動的に変換しなくても、値を確認・操作できます。

## `DataComponentType`

各データコンポーネントには、対応する `DataComponentType<T>` があります。`T` はコンポーネントの値の型です。`DataComponentType` は、保存されたコンポーネントの値を参照するためのキーを表し、必要に応じて、ディスクやネットワークへの読み書きを扱う Codec も持ちます。

既存のコンポーネントの一覧は `DataComponents` にあります。

### カスタムのデータコンポーネントの作成 {#creating-custom-data-components}

`DataComponentType` に対応するコンポーネントの値は、`hashCode` と `equals` を実装している必要があり、保存された後は**イミュータブル**とみなすべきです。

:::note
コンポーネントの値は、record を使うと非常に簡単に実装できます。record のフィールドはイミュータブルで、`hashCode` と `equals` も実装されています。
:::

```java
// A record example
public record ExampleRecord(int value1, boolean value2) {}

// A class example
public class ExampleClass {

    private final int value1;
    // Can be mutable, but care needs to be taken when using
    private boolean value2;

    public ExampleClass(int value1, boolean value2) {
        this.value1 = value1;
        this.value2 = value2;
    }

    @Override
    public int hashCode() {
        return Objects.hash(this.value1, this.value2);
    }

    @Override
    public boolean equals(Object obj) {
        if (obj == this) {
            return true;
        } else {
            return obj instanceof ExampleClass ex
                && this.value1 == ex.value1
                && this.value2 == ex.value2;
        }
    }
}
```

標準的な `DataComponentType` は、`DataComponentType#builder` で作成し、`DataComponentType.Builder#build` でビルドできます。ビルダーには `persistent`、`networkSynchronized`、`cacheEncoding` の 3 つの設定があります。

`persistent` は、コンポーネントの値をディスクに読み書きするための [`Codec`][codec] を指定します。`networkSynchronized` は、コンポーネントをネットワーク経由で読み書きするための `StreamCodec` を指定します。`networkSynchronized` を指定しない場合は、`persistent` に渡した `Codec` がラップされ、[`StreamCodec`][streamcodec] として使われます。

:::warning
ビルダーには `persistent` か `networkSynchronized` のどちらかを指定する必要があります。指定しないと `NullPointerException` がスローされます。ネットワーク経由でデータを送るべきでない場合は、`networkSynchronized` に、デフォルトのコンポーネントの値を渡した `StreamCodec#unit` を設定してください。
:::

`cacheEncoding` は `Codec` のエンコード結果をキャッシュし、コンポーネントの値が変わっていなければ、以降のエンコードでキャッシュした値を使うようにします。これは、コンポーネントの値がめったに、またはまったく変わらないと想定される場合にのみ使ってください。

`DataComponentType` は Registry のオブジェクトなので、[登録][registered]する必要があります。

<Tabs defaultValue="latest">
<TabItem value="latest" label="Latest">

```java
// Using ExampleRecord(int, boolean)
// Only one Codec and/or StreamCodec should be used below
// Multiple are provided for an example

// Basic codec
public static final Codec<ExampleRecord> BASIC_CODEC = RecordCodecBuilder.create(instance ->
    instance.group(
        Codec.INT.fieldOf("value1").forGetter(ExampleRecord::value1),
        Codec.BOOL.fieldOf("value2").forGetter(ExampleRecord::value2)
    ).apply(instance, ExampleRecord::new)
);
public static final StreamCodec<ByteBuf, ExampleRecord> BASIC_STREAM_CODEC = StreamCodec.composite(
    ByteBufCodecs.INT, ExampleRecord::value1,
    ByteBufCodecs.BOOL, ExampleRecord::value2,
    ExampleRecord::new
);

// Unit stream codec if nothing should be sent across the network
public static final StreamCodec<ByteBuf, ExampleRecord> UNIT_STREAM_CODEC = StreamCodec.unit(new ExampleRecord(0, false));


// In another class
// The specialized DeferredRegister.DataComponents simplifies data component registration and avoids some generic inference issues with the `DataComponentType.Builder` within a `Supplier`
public static final DeferredRegister.DataComponents REGISTRAR = DeferredRegister.createDataComponents(Registries.DATA_COMPONENT_TYPE, "examplemod");

public static final DeferredHolder<DataComponentType<?>, DataComponentType<ExampleRecord>> BASIC_EXAMPLE = REGISTRAR.registerComponentType(
    "basic",
    builder -> builder
        // The codec to read/write the data to disk
        .persistent(BASIC_CODEC)
        // The codec to read/write the data across the network
        .networkSynchronized(BASIC_STREAM_CODEC)
);

/// Component will not be saved to disk
public static final DeferredHolder<DataComponentType<?>, DataComponentType<ExampleRecord>> TRANSIENT_EXAMPLE = REGISTRAR.registerComponentType(
    "transient",
    builder -> builder.networkSynchronized(BASIC_STREAM_CODEC)
);

// No data will be synced across the network
public static final DeferredHolder<DataComponentType<?>, DataComponentType<ExampleRecord>> NO_NETWORK_EXAMPLE = REGISTRAR.registerComponentType(
   "no_network",
   builder -> builder
        .persistent(BASIC_CODEC)
        // Note we use a unit stream codec here
        .networkSynchronized(UNIT_STREAM_CODEC)
);
```

</TabItem>
<TabItem value="21.1.48" label="[21.0.0, 21.1.48]">

```java
// Using ExampleRecord(int, boolean)
// Only one Codec and/or StreamCodec should be used below
// Multiple are provided for an example

// Basic codec
public static final Codec<ExampleRecord> BASIC_CODEC = RecordCodecBuilder.create(instance ->
    instance.group(
        Codec.INT.fieldOf("value1").forGetter(ExampleRecord::value1),
        Codec.BOOL.fieldOf("value2").forGetter(ExampleRecord::value2)
    ).apply(instance, ExampleRecord::new)
);
public static final StreamCodec<ByteBuf, ExampleRecord> BASIC_STREAM_CODEC = StreamCodec.composite(
    ByteBufCodecs.INT, ExampleRecord::value1,
    ByteBufCodecs.BOOL, ExampleRecord::value2,
    ExampleRecord::new
);

// Unit stream codec if nothing should be sent across the network
public static final StreamCodec<ByteBuf, ExampleRecord> UNIT_STREAM_CODEC = StreamCodec.unit(new ExampleRecord(0, false));


// In another class
// The specialized DeferredRegister.DataComponents simplifies data component registration and avoids some generic inference issues with the `DataComponentType.Builder` within a `Supplier`
public static final DeferredRegister.DataComponents REGISTRAR = DeferredRegister.createDataComponents("examplemod");

public static final DeferredHolder<DataComponentType<?>, DataComponentType<ExampleRecord>> BASIC_EXAMPLE = REGISTRAR.registerComponentType(
    "basic",
    builder -> builder
        // The codec to read/write the data to disk
        .persistent(BASIC_CODEC)
        // The codec to read/write the data across the network
        .networkSynchronized(BASIC_STREAM_CODEC)
);

/// Component will not be saved to disk
public static final DeferredHolder<DataComponentType<?>, DataComponentType<ExampleRecord>> TRANSIENT_EXAMPLE = REGISTRAR.registerComponentType(
    "transient",
    builder -> builder.networkSynchronized(BASIC_STREAM_CODEC)
);

// No data will be synced across the network
public static final DeferredHolder<DataComponentType<?>, DataComponentType<ExampleRecord>> NO_NETWORK_EXAMPLE = REGISTRAR.registerComponentType(
   "no_network",
   builder -> builder
        .persistent(BASIC_CODEC)
        // Note we use a unit stream codec here
        .networkSynchronized(UNIT_STREAM_CODEC)
);
```
</TabItem>
</Tabs>

## コンポーネントマップ {#the-component-map}

すべてのデータコンポーネントは、`DataComponentType` をキー、オブジェクトを値として `DataComponentMap` に保存されます。`DataComponentMap` は、読み取り専用の `Map` と同じように機能します。そのため、`DataComponentType` を指定してエントリを取得する( `#get` )メソッドや、存在しない場合にデフォルト値を返す( `#getOrDefault` )メソッドがあります。

```java
// For some DataComponentMap map

// Will get dye color if component is present
// Otherwise null
@Nullable
DyeColor color = map.get(DataComponents.BASE_COLOR);
```

### `PatchedDataComponentMap`

デフォルトの `DataComponentMap` には読み取り系の操作のメソッドしかないため、書き込み系の操作はサブクラスの `PatchedDataComponentMap` でサポートされています。これには、コンポーネントの値の設定( `#set` )や、コンポーネント自体の削除( `#remove` )が含まれます。

`PatchedDataComponentMap` は、プロトタイプとパッチマップを使って変更を保存します。プロトタイプは、このマップが持つべきデフォルトのコンポーネントと
その値を含む `DataComponentMap` です。パッチマップは、`DataComponentType` から `Optional` の値へのマップで、デフォルトのコンポーネントに加えられた変更を含みます。

```java
// For some PatchedDataComponentMap map

// Sets the base color to white
map.set(DataComponents.BASE_COLOR, DyeColor.WHITE);

// Removes the base color by
// - Removing the patch if no default is provided
// - Setting an empty optional if there is a default
map.remove(DataComponents.BASE_COLOR);
```

:::danger
プロトタイプとパッチマップは、どちらも `PatchedDataComponentMap` のハッシュコードの一部です。そのため、マップ内のコンポーネントの値はすべて**イミュータブル**として扱うべきです。データコンポーネントの値を変更した後は、必ず `#set`、または後述のそれを参照するメソッドのいずれかを呼び出してください。
:::

## コンポーネントホルダー {#the-component-holder}

データコンポーネントを保持できるインスタンスは、すべて `DataComponentHolder` を実装しています。`DataComponentHolder` は、実質的に `DataComponentMap` の読み取り専用メソッドへの委譲です。

```java
// For some ItemStack stack

// Delegates to 'DataComponentMap#get'
@Nullable
DyeColor color = stack.get(DataComponents.BASE_COLOR);
```

### `MutableDataComponentHolder`

`MutableDataComponentHolder` は、コンポーネントマップへの書き込み系のメソッドをサポートするために NeoForge が提供するインターフェースです。バニラと NeoForge の実装はすべて `PatchedDataComponentMap` を使ってデータコンポーネントを保存しているため、`#set` と `#remove` のメソッドにも同名の委譲メソッドがあります。

さらに、`MutableDataComponentHolder` には `#update` メソッドもあります。これは、コンポーネントの値( 設定されていなければ渡されたデフォルト値 )を取得し、その値に対して操作を行い、マップに設定し直すまでを処理します。操作には、コンポーネントの値を受け取ってコンポーネントの値を返す `UnaryOperator` か、コンポーネントの値と別のオブジェクトを受け取ってコンポーネントの値を返す `BiFunction` を使います。

```java
// For some ItemStack stack

FireworkExplosion explosion = stack.get(DataComponents.FIREWORK_EXPLOSION);

// Modifying the component value
explosion = explosion.withFadeColors(new IntArrayList(new int[] {1, 2, 3}));

// Since we modified the component value, 'set' should be called afterward
stack.set(DataComponents.FIREWORK_EXPLOSION, explosion);

// Update the component value (calls 'set' internally)
stack.update(
    DataComponents.FIREWORK_EXPLOSION,
    // Default value if no component value is present
    FireworkExplosion.DEFAULT,
    // Return a new FireworkExplosion to set
    explosion -> explosion.withFadeColors(new IntArrayList(new int[] {4, 5, 6}))
);

stack.update(
    DataComponents.FIREWORK_EXPLOSION,
    // Default value if no component value is present
    FireworkExplosion.DEFAULT,
    // An object that is supplied to the function
    new IntArrayList(new int[] {7, 8, 9}),
    // Return a new FireworkExplosion to set
    FireworkExplosion::withFadeColors
);
```

## Item へのデフォルトのデータコンポーネントの追加 {#adding-default-data-components-to-items}

データコンポーネントは `ItemStack` に保存されますが、`Item` にデフォルトのコンポーネントのマップを設定しておくと、`ItemStack` の構築時にそれがプロトタイプとして渡されます。`Item` には `Item.Properties#component` でコンポーネントを追加できます。

```java
// For some DeferredRegister.Items REGISTRAR
public static final Item COMPONENT_EXAMPLE = REGISTRAR.register("component",
    // register is used over other overloads as the DataComponentType has not been registered yet
    () -> new Item(
        new Item.Properties()
        .component(BASIC_EXAMPLE.value(), new ExampleRecord(24, true))
    )
);
```

バニラや他の Mod の既存の Item にデータコンポーネントを追加したい場合は、[**Mod の EventBus**][modbus] で `ModifyDefaultComponentsEvent` を listen してください。この Event には `modify` と `modifyMatching` のメソッドがあり、対象の Item の `DataComponentPatch.Builder` を変更できます。ビルダーでは、コンポーネントを設定( `#set` )したり、既存のコンポーネントを削除( `#remove` )したりできます。

```java
@SubscribeEvent // on the mod event bus
public static void modifyComponents(ModifyDefaultComponentsEvent event) {
    // Sets the component on melon seeds
    event.modify(Items.MELON_SEEDS, builder ->
        builder.set(BASIC_EXAMPLE.value(), new ExampleRecord(10, false))
    );

    // Removes the component for any items that have a crafting item
    event.modifyMatching(
        item -> item.hasCraftingRemainingItem(),
        builder -> builder.remove(DataComponents.BUCKET_ENTITY_DATA)
    );
}
```

## カスタムのコンポーネントホルダーの使用 {#using-custom-component-holders}

カスタムのデータコンポーネントホルダーを作るには、ホルダーのオブジェクトで `MutableDataComponentHolder` を実装し、不足しているメソッドを実装するだけです。関連するメソッドを実装するために、ホルダーのオブジェクトは `PatchedDataComponentMap` を表すフィールドを持つ必要があります。

```java
public class ExampleHolder implements MutableDataComponentHolder {

    private int data;
    private final PatchedDataComponentMap components;

    // Overloads can be provided to supply the map itself
    public ExampleHolder() {
        this.data = 0;
        this.components = new PatchedDataComponentMap(DataComponentMap.EMPTY);
    }

    @Override
    public DataComponentMap getComponents() {
        return this.components;
    }

    @Nullable
    @Override
    public <T> T set(DataComponentType<? super T> componentType, @Nullable T value) {
        return this.components.set(componentType, value);
    }

    @Nullable
    @Override
    public <T> T remove(DataComponentType<? extends T> componentType) {
        return this.components.remove(componentType);
    }

    @Override
    public void applyComponents(DataComponentPatch patch) {
        this.components.applyPatch(patch);
    }

    @Override
    public void applyComponents(DataComponentMap components) {
        this.components.setAll(p_330402_);
    }

    // Other methods
}
```

### `DataComponentPatch` と Codec {#datacomponentpatch-and-codecs}

コンポーネントをディスクに保存したり、ネットワーク経由で情報を送ったりするには、ホルダーが `DataComponentMap` 全体を送ることもできます。しかし、データの送り先にはデフォルト値がすでに存在するため、これは一般に情報の無駄です。そこで代わりに、`DataComponentPatch` を使って関連するデータを送ります。`DataComponentPatch` には、デフォルト値を含まず、コンポーネントマップのパッチ情報だけが含まれます。そのパッチが、受信側でプロトタイプに適用されます。

`DataComponentPatch` は、`#patch` で `PatchedDataComponentMap` から作成できます。同様に、`PatchedDataComponentMap#fromPatch` は、プロトタイプの `DataComponentMap` と `DataComponentPatch` から `PatchedDataComponentMap` を構築できます。

```java
public class ExampleHolder implements MutableDataComponentHolder {

    public static final Codec<ExampleHolder> CODEC = RecordCodecBuilder.create(instance ->
        instance.group(
            Codec.INT.fieldOf("data").forGetter(ExampleHolder::getData),
            DataCopmonentPatch.CODEC.optionalFieldOf("components", DataComponentPatch.EMPTY).forGetter(holder -> holder.components.asPatch())
        ).apply(instance, ExampleHolder::new)
    );

    public static final StreamCodec<RegistryFriendlyByteBuf, ExampleHolder> STREAM_CODEC = StreamCodec.composite(
        ByteBufCodecs.INT, ExampleHolder::getData,
        DataComponentPatch.STREAM_CODEC, holder -> holder.components.asPatch(),
        ExampleHolder::new
    );

    // ...

    public ExampleHolder(int data, DataComponentPatch patch) {
        this.data = data;
        this.components = PatchedDataComponentMap.fromPatch(
            // The prototype map to apply to
            DataComponentMap.EMPTY,
            // The associated patches
            patch
        );
    }

    // ...
}
```

[ホルダーのデータのネットワーク経由での同期][network]と、ディスクへのデータの読み書きは、手動で行う必要があります。

[registered]: ../concepts/registries.md
[codec]: ../datastorage/codecs.md
[modbus]: ../concepts/events.md#event-buses
[network]: ../networking/payload.md
[streamcodec]: ../networking/streamcodecs.md
