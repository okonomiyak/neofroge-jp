# データマップ {#data-maps}

データマップは、登録済みのオブジェクトに付与できる、データ駆動で再読み込み可能なオブジェクトを含みます。同期や競合の解決などの機能を備えているため、この仕組みを使うとゲームの動作をより簡単にデータ駆動にでき、より良く、より設定しやすいユーザー体験につながります。[タグ][tags]は Registry のオブジェクト ➜ 真偽値のマップ、データマップはより柔軟な Registry のオブジェクト ➜ オブジェクトのマップと考えるとよいでしょう。[タグ][tags]と同様に、データマップは上書きではなく、対応するデータマップに追加されます。

データマップは、静的な組み込みの Registry と、動的でデータ駆動の Datapack Registry の両方に付与できます。データマップは、`/reload` コマンドや、サーバーのリソースを再読み込みするその他の手段による再読み込みに対応しています。

NeoForge は、よくある用途向けに、ハードコードされたバニラのフィールドを置き換えるさまざまな[組み込みのデータマップ][builtin]を提供しています。詳しくはリンク先の記事を参照してください。

## ファイルの場所 {#file-location}

データマップは、`<mapNamespace>/data_maps/<registryNamespace>/<registryPath>/<mapPath>.json` にある JSON ファイルから読み込まれます。各部分は次のとおりです。

- `<mapNamespace>` は、データマップの ID の名前空間です。
- `<mapPath>` は、データマップの ID のパスです。
- `<registryNamespace>` は、Registry の ID の名前空間です( `minecraft` の場合は省略します )。
- `<registryPath>` は、Registry の ID のパスです。

例:

- `minecraft:item` Registry 用の `mymod:drop_healing` という名前のデータマップ( 下の例のもの )なら、パスは `mymod/data_maps/item/drop_healing.json` になります。
- `minecraft:block` Registry 用の `somemod:somemap` という名前のデータマップなら、パスは `somemod/data_maps/block/somemap.json` になります。
- `somemod:custom` Registry 用の `example:stuff` という名前のデータマップなら、パスは `example/data_maps/somemod/custom/stuff.json` になります。

## JSON の構造 {#json-structure}

データマップのファイル自体には、次のフィールドを含められます。

- `replace`: このファイルの値を追加する前に、データマップを空にする真偽値。Mod がこれを含めて配布すべきではなく、独自の目的でこのマップを上書きしたいパック制作者だけが使うべきです。
- `neoforge:conditions`: [読み込み条件][conditions]のリスト。
- `values`: Mod がデータマップに追加する、Registry の ID またはタグの ID から値へのマップ。値自体の構造は、データマップの Codec で定義されます( 後述 )。
- `remove`: データマップから取り除く、Registry の ID またはタグの ID のリスト。

### 値の追加 {#adding-values}

たとえば、`minecraft:item` Registry 用に、`amount` と `chance` という 2 つの float のキーを持つデータマップのオブジェクトがあるとします。対応するデータマップのファイルは、次のようになります。

```json5
{
    "values": {
        // Attach a value to the carrot item
        "minecraft:carrot": {
            "amount": 12,
            "chance": 1
        },
        // Attach a value to all items in the logs tag
        "#minecraft:logs": {
            "amount": 1,
            "chance": 0.1
        }
    }
}
```

データマップは[マージャー][mergers]をサポートしている場合があります。これは、2 つの Mod が同じ Item にデータマップの値を追加した場合などの競合時に、独自のマージの動作を行います。マージャーが発動しないようにするには、次のように要素の単位で `replace` フィールドを指定できます。

```json5
{
    "values": {
        // Overwrite the value of the carrot item
        "minecraft:carrot": {
            // highlight-next-line
            "replace": true,
            // The new value will be under a value sub-object
            "value": {
                "amount": 12,
                "chance": 1
            }
        }
    }
}
```

### 既存の値の削除 {#removing-existing-values}

要素を削除するには、削除する Item の ID またはタグの ID のリストを指定します。

```json5
{
    // We do not want the potato to have a value, even if another mod's data map added it
    "remove": [
        "minecraft:potato"
    ]
}
```

削除は追加の後に実行されるため、タグを含めておき、その中の特定の要素だけを再び除外することもできます。

```json5
{
    "values": {
        "#minecraft:logs": { /* ... */ }
    },
    // Exclude crimson stem again
    "remove": [
        "minecraft:crimson_stem"
    ]
}
```

データマップは、追加の引数を持つカスタムの[リムーバー][removers]をサポートしている場合があります。それを指定するには、`remove` のリストを、削除する要素をマップのキー、追加のデータをその値とする JSON オブジェクトに変えます。たとえば、リムーバーのオブジェクトが文字列にシリアライズされるとすると、リムーバーのマップは次のようになります。

```json5
{
    "remove": {
        // The remover will be deserialized from the value (`somekey1` in this case)
        // and applied to the value attached to the carrot item
        "minecraft:carrot": "somekey1"
    }
}
```

## カスタムのデータマップ {#custom-data-maps}

まず、データマップのエントリの形式を定義します。**データマップのエントリはイミュータブルである必要がある**ため、record が最適です。上の、`amount` と `chance` の 2 つの float の値を持つ例を繰り返すと、データマップのエントリは次のようになります。

```java
public record ExampleData(float amount, float chance) {}
```

他の多くのものと同様に、データマップは [Codec][codecs] を使ってシリアライズ・デシリアライズされます。つまり、この後で使う、データマップのエントリ用の Codec を用意する必要があります。

```java
public record ExampleData(float amount, float chance) {
    public static final Codec<ExampleData> CODEC = RecordCodecBuilder.create(instance -> instance.group(
            Codec.FLOAT.fieldOf("amount").forGetter(ExampleData::amount),
            Codec.floatRange(0, 1).fieldOf("chance").forGetter(ExampleData::chance)
    ).apply(instance, ExampleData::new));
}
```

次に、データマップ自体を作成します。

```java
// In this example, we register the data map for the minecraft:item registry, hence we use Item as the generic.
// Adjust the types accordingly if you want to create a data map for a different registry.
public static final DataMapType<Item, ExampleData> EXAMPLE_DATA = DataMapType.builder(
        // The ID of the data map. Data map files for this data map will be located at
        // <yourmodid>:examplemod/data_maps/item/example_data.json.
        ResourceLocation.fromNamespaceAndPath("examplemod", "example_data"),
        // The registry to register the data map for.
        Registries.ITEM,
        // The codec of the data map entries.
        ExampleData.CODEC
).build();
```

最後に、[Mod の EventBus][modbus] の [`RegisterDataMapTypesEvent`][events] で、データマップを登録します。

```java
@SubscribeEvent // on the mod event bus
public static void registerDataMapTypes(RegisterDataMapTypesEvent event) {
    event.register(EXAMPLE_DATA);
}
```

### 同期 {#syncing}

同期するデータマップは、その値がクライアントに同期されます。データマップを同期するようにするには、次のようにビルダーで `#synced` を呼び出します。

```java
public static final DataMapType<Item, ExampleData> EXAMPLE_DATA = DataMapType.builder(...)
        .synced(
                // The codec used for syncing. May be identical to the normal codec, but may also be
                // a codec with less fields, omitting parts of the object that are not required on the client.
                ExampleData.CODEC,
                // Whether the data map is mandatory or not. Marking a data map as mandatory will disconnect clients
                // that are missing the data map on their side; this includes vanilla clients.
                false
        ).build();
```

### 使い方 {#usage}

データマップはどの Registry でも使えるため、実際の Registry のオブジェクトではなく、`Holder` を通じて問い合わせる必要があります。さらに、機能するのは参照ホルダーだけで、`Direct` ホルダーでは機能しません。ただし、`Registry#wrapAsHolder`、`Registry#getHolder`、さまざまな `builtInRegistryHolder` メソッドなど、ほとんどの場所は参照ホルダーを返すので、たいていの場合は問題にならないはずです。

そのうえで、`Holder#getData(DataMapType)` でデータマップの値を問い合わせられます。オブジェクトにデータマップの値が付与されていない場合、このメソッドは `null` を返します。先ほどの `ExampleData` を再利用して、プレイヤーがそれを拾うたびにプレイヤーを回復させてみましょう。

```java
@SubscribeEvent // on the game event bus
public static void itemPickup(ItemPickupEvent event) {
    ItemStack stack = event.getItemStack();
    // Get a Holder<Item> via ItemStack#getItemHolder.
    Holder<Item> holder = stack.getItemHolder();
    // Get the data from the holder.
    //highlight-next-line
    ExampleData data = holder.getData(EXAMPLE_DATA);
    if (data != null) {
        // The values are present, so let's do something with them!
        Player player = event.getPlayer();
        if (player.getLevel().getRandom().nextFloat() > data.chance()) {
            player.heal(data.amount());
        }
    }
}
```

もちろん、この手順は NeoForge が提供するすべてのデータマップでも使えます。

## 高度なデータマップ {#advanced-data-maps}

高度なデータマップとは、標準の `DataMapType` の代わりに `AdvancedDataMapType` を使うデータマップです( `AdvancedDataMapType` はそのサブクラスです )。高度なデータマップには追加の機能があり、カスタムのマージャーとカスタムのリムーバーを指定できます。値がコレクションやそれに近いもの( `List` や `Map` など )であるデータマップでは、これを実装することを強くおすすめします。

`DataMapType` には `R`( Registry の型 )と `T`( データマップの値の型 )の 2 つの型パラメータがありますが、`AdvancedDataMapType` にはもう 1 つ、`VR extends DataMapValueRemover<R, T>` があります。この型パラメータにより、リムーバーを型安全にデータ生成できます。

`AdvancedDataMapType` は、`DataMapType#builder()` ではなく `AdvancedDataMapType#builder()` で作成し、`AdvancedDataMapType.Builder` が返されます。このビルダーには、それぞれリムーバーとマージャーを指定するための `#remover` と `#merger` の 2 つの追加のメソッドがあります( 後述 )。同期を含め、それ以外の機能はすべて同じです。

### マージャー {#mergers}

マージャーを使うと、複数のデータパックが同じオブジェクトに値を追加しようとしたときの競合を処理できます。デフォルトのマージャー( `DataMapValueMerger#defaultMerger` )は、( 優先度の低いデータパックなどからの )既存の値を新しい値で上書きします。そのため、それが望ましい動作でない場合は、カスタムのマージャーが必要です。

マージャーには、競合する 2 つの値、値を付与する対象のオブジェクト( 値はタグ内のすべてのオブジェクトにも単一のオブジェクトにも付与できるため、`Either<TagKey<R>, ResourceKey<R>>` として渡されます )、そのオブジェクトを所有する Registry が渡され、実際に付与すべき値を返す必要があります。一般に、マージャーは可能であれば単にマージするだけにし、上書きは行わないでください( つまり、通常の方法でマージできない場合にのみ上書きします )。データパックがマージャーを迂回したい場合は、オブジェクトで `replace` フィールドを指定してください( [値の追加][add]を参照 )。

Item に整数を追加するデータマップがある場面を考えてみましょう。その場合、次のように両方の値を足すだけで競合を解決できます。

```java
public class IntMerger implements DataMapValueMerger<Item, Integer> {
    @Override
    public Integer merge(Registry<Item> registry,
            Either<TagKey<Item>, ResourceKey<Item>> first, Integer firstValue,
            Either<TagKey<Item>, ResourceKey<Item>> second, Integer secondValue) {
        return firstValue + secondValue;
    }
}
```

こうすると、あるパックが `minecraft:carrot` に値 12 を指定し、別のパックが `minecraft:carrot` に値 15 を指定した場合、`minecraft:carrot` の最終的な値は 27 になります。どちらかのオブジェクトが `"replace": true` を指定していれば、そのオブジェクトの値が使われます。両方が `"replace": true` を指定していれば、上にあるデータパックの値が使われます。

最後に、次のようにビルダーで実際にマージャーを指定するのを忘れないでください。

```java
// We assume AdvancedData contains an integer property of some sort.
AdvancedDataMapType<Item, AdvancedData> ADVANCED_MAP = AdvancedDataMapType.builder(...)
        .merger(new IntMerger())
        .build();
```

:::tip
NeoForge は、`DataMapValueMerger` に、リスト、セット、マップ用のデフォルトのマージャーを用意しています。
:::

### リムーバー {#removers}

より複雑なデータに対するマージャーと同様に、リムーバーを使うと、要素の `remove` 句を適切に処理できます。デフォルトのリムーバー( `DataMapValueRemover.Default.INSTANCE` )は、指定したオブジェクトに関係する情報をすべて取り除くだけなので、オブジェクトのデータの一部だけを取り除くには、カスタムのリムーバーを使います。

ビルダーに渡した Codec( 後述 )は、リムーバーのインスタンスのデコードに使われます。リムーバーには、オブジェクトに現在付与されている値とその出どころが渡され、古い値を置き換える値の `Optional` を返す必要があります。空の `Optional` を返すと、値は実際に取り除かれます。

`Map<String, String>` を値とするデータマップから、特定のキーを持つ値を取り除くリムーバーの例を考えてみましょう。

```java
public record MapRemover(String key) implements DataMapValueRemover<Item, Map<String, String>> {
    public static final Codec<MapRemover> CODEC = Codec.STRING.xmap(MapRemover::new, MapRemover::key);
    
    @Override
    public Optional<Map<String, String>> remove(Map<String, String> value, Registry<Item> registry, Either<TagKey<Item>, ResourceKey<Item>> source, Item object) {
        final Map<String, String> newMap = new HashMap<>(value);
        newMap.remove(key);
        return Optional.of(newMap);
    }
}
```

このリムーバーを念頭に、次のデータファイルを考えます。

```json5
{
    "values": {
        "minecraft:carrot": {
            "somekey1": "value1",
            "somekey2": "value2"
        }
    }
}
```

次に、1 つ目より高い優先度に置かれた、この 2 つ目のデータファイルを考えます。

```json5
{
    "remove": {
        // As the remover is decoded as a string, we can use a string as the value here.
        // If it were decoded as an object, we would have needed to use an object.
        "minecraft:carrot": "somekey1"
    }
}
```

こうすると、両方のファイルが適用された後の最終的な結果は、次のようになります( メモリ上での表現です )。

```json5
{
    "values": {
        "minecraft:carrot": {
            "somekey2": "value2"
        }
    }
}
```

マージャーと同様に、ビルダーに追加するのを忘れないでください。ここでは単に Codec を使う点に注意してください。

```java
// We assume AdvancedData contains a Map<String, String> property of some sort.
AdvancedDataMapType<Item, AdvancedData> ADVANCED_MAP = AdvancedDataMapType.builder(...)
        .remover(MapRemover.CODEC)
        .build();
```

## データ生成 {#data-generation}

データマップは、`DataMapProvider` を継承し、`#gather` をオーバーライドしてエントリを作ることで、[データ生成][datagen]できます。先ほどの `ExampleData`( float の値 `amount` と `chance` を持つもの )を再利用すると、データ生成のファイルは次のようになります。

```java
public class MyDataMapProvider extends DataMapProvider {
    public MyDataMapProvider(PackOutput packOutput, CompletableFuture<HolderLookup.Provider> lookupProvider) {
        super(packOutput, lookupProvider);
    }
    
    @Override
    protected void gather() {
        // We create a builder for the EXAMPLE_DATA data map and add our entries using #add.
        builder(EXAMPLE_DATA)
                // We turn on replacing. Don't ever ship a mod like this! This is purely for educational purposes.
                .replace(true)
                // We add the value "amount": 10, "chance": 1 for all slabs. The boolean parameter controls
                // the "replace" field, which should always be false in a mod.
                .add(ItemTags.SLABS, new ExampleData(10, 1), false)
                // We add the value "amount": 5, "chance": 0.2 for apples.
                .add(Items.APPLE.builtInRegistryHolder(), new ExampleData(5, 0.2f), false) // Can also use Registry#wrapAsHolder to get the holder of a registry object
                // We remove wooden slabs again.
                .remove(ItemTags.WOODEN_SLABS)
                // We add a mod loaded condition for Botania, because why not.
                .conditions(new ModLoadedCondition("botania"));
    }
}
```

これにより、次の JSON ファイルができます。

```json5
{
    "replace": true,
    "values": {
        "#minecraft:slabs": {
            "amount": 10,
            "chance": 1.0
        },
        "minecraft:apple": {
            "amount": 5,
            "chance": 0.2
        }
    },
    "remove": [
        "#minecraft:wooden_slabs"
    ],
    "neoforge:conditions": [
        {
            "type": "neoforge:mod_loaded",
            "modid": "botania"
        }
    ]
}
```

他のデータプロバイダと同様に、プロバイダを Event に追加するのを忘れないでください。

```java
@SubscribeEvent // on the mod event bus
public static void gatherData(GatherDataEvent event) {
    DataGenerator generator = event.getGenerator();
    PackOutput output = generator.getPackOutput();
    CompletableFuture<HolderLookup.Provider> lookupProvider = event.getLookupProvider();

    // other providers here
    generator.addProvider(
            event.includeServer(),
            new MyDataMapProvider(output, lookupProvider)
    );
}
```

[builtin]: builtin.md
[codecs]: ../../../datastorage/codecs.md
[conditions]: ../conditions.md
[datagen]: ../../index.md#data-generation
[events]: ../../../concepts/events.md
[add]: #adding-values
[mergers]: #mergers
[modbus]: ../../../concepts/events.md#event-buses
[removers]: #removers
[tags]: ../tags.md
