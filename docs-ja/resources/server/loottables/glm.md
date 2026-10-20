# グローバルルートモディファイア {#global-loot-modifiers}

グローバルルートモディファイア( 略して GLM )は、何十、何百ものバニラのルートテーブルを上書きすることなくドロップを変更するための、データ駆動の方法です。また、どの Mod が読み込まれているかを知らなくても、他の Mod のルートテーブルとのやりとりが必要になる効果を扱えます。

GLM は、まず対応する[ルートテーブル][loottable]を抽選し、その抽選結果に GLM を適用することで機能します。また、複数の Mod が同じルートテーブルを変更できるよう、GLM は最後に読み込まれたものが勝つのではなく、積み重なっていきます。これは[タグ][tags]と似ています。

GLM を登録するには、次の 4 つが必要です。

- `data/neoforge/loot_modifiers/global_loot_modifiers.json` にある `global_loot_modifiers.json` ファイル( **自分の Mod の名前空間ではありません** )。このファイルは、どのモディファイアを、どの順序で適用するかを NeoForge に伝えます。
- ルートモディファイアを表す JSON ファイル。このファイルには変更に関するすべてのデータが含まれ、データパックで効果を調整できるようにします。`data/<namespace>/loot_modifiers/<path>.json` に置きます。
- `IGlobalLootModifier` を実装するか、`LootModifier`( これ自体も `IGlobalLootModifier` を実装しています )を継承したクラス。このクラスには、モディファイアを動作させるコードが含まれます。
- ルートモディファイアのクラスをエンコード・デコードするための MapCodec( [Codec][codec] )。通常は、ルートモディファイアのクラスの `public static final` フィールドとして実装します。

## `global_loot_modifiers.json`

`global_loot_modifiers.json` ファイルは、ルートテーブルにどのモディファイアを適用するかを NeoForge に伝えます。このファイルには 2 つのキーを含められます。

- `entries` は、読み込むべきモディファイアのリストです。指定した [`ResourceLocation`][resloc] は、`data/<namespace>/loot_modifiers/<path>.json` にある対応するエントリを指します。このリストには順序があり、モディファイアは指定した順に適用されます。これは、Mod の互換性の問題が起きたときに関係することがあります。
- `replace` は、モディファイアで古いものを置き換える( `true` )か、既存のリストに追加するだけにする( `false` )かを表します。これは[タグ][tags]の `replace` キーと同じように機能しますが、タグと異なり、ここではこのキーが必須です。一般に、Mod 開発者は常に `false` を使ってください。`true` を使えるのは、Mod パックやデータパックの制作者向けです。

使用例:

```json5
{
    "replace": false, // must be present
    "entries": [
        // represents a loot modifier in data/examplemod/loot_modifiers/example_glm_1.json
        "examplemod:example_glm_1",
        "examplemod:example_glm_2"
        // ...
    ]
}
```

## ルートモディファイアの JSON {#the-loot-modifier-json}

このファイルには、適用される確率や追加する Item など、モディファイアに関係するすべての値が含まれます。データパックの制作者が望めばバランスを調整できるよう、できる限りハードコードされた値は避けることをおすすめします。ルートモディファイアには少なくとも 2 つのフィールドが必要で、状況に応じてさらに多くのフィールドを含められます。

- `type` フィールドには、ルートモディファイアの Registry 名が入ります。
- `conditions` フィールドは、このモディファイアを有効にするためのルートテーブルの条件のリストです。
- 使う Codec に応じて、追加のプロパティが必須だったり任意だったりします。

:::tip
GLM のよくある用途は、特定の 1 つのルートテーブルに追加の戦利品を加えることです。これを実現するには、[`neoforge:loot_table_id` 条件][loottableid]を使えます。
:::

使用例は次のようになります。

```json5
{
    // This is the registry name of the loot modifier
    "type": "examplemod:my_loot_modifier",
    "conditions": [
        // Loot table conditions here
    ],
    // Extra properties specified by the codec
    "field1": "somestring",
    "field2": 10,
    "field3": "minecraft:dirt"
}
```

## `IGlobalLootModifier` と `LootModifier` {#igloballootmodifier-and-lootmodifier}

ルートモディファイアを実際にルートテーブルに適用するには、`IGlobalLootModifier` の実装を指定する必要があります。ほとんどの場合は、条件などを処理してくれる `LootModifier` サブクラスを使うとよいでしょう。まず、ルートモディファイアのクラスで `LootModifier` を継承します。

```java
// We cannot use a record because records cannot extend other classes.
public class MyLootModifier extends LootModifier {
    // See below for how the codec works.
    public static final MapCodec<MyLootModifier> CODEC = ...;
    // Our extra properties.
    private final String field1;
    private final int field2;
    private final Item field3;
    
    // First constructor parameter is the list of conditions. The rest is our extra properties.
    public MyLootModifier(LootItemCondition[] conditions, String field1, int field2, Item field3) {
        super(conditions);
        this.field1 = field1;
        this.field2 = field2;
        this.field3 = field3;
    }
    
    // Return our codec here.
    @Override
    public MapCodec<? extends IGlobalLootModifier> codec() {
        return CODEC;
    }
    
    // This is where the magic happens. Use your extra properties here if needed.
    // Parameters are the existing loot, and the loot context.
    @Override
    protected ObjectArrayList<ItemStack> doApply(ObjectArrayList<ItemStack> generatedLoot, LootContext context) {
        // Add your items to generatedLoot here.
        return generatedLoot;
    }
}
```

:::info
モディファイアが返すドロップのリストは、登録された順に他のモディファイアに渡されます。そのため、変更した戦利品は、別のルートモディファイアによってさらに変更されることがあり、またそれを想定しておくべきです。
:::

## ルートモディファイアの Codec {#the-loot-modifier-codec}

ルートモディファイアの存在をゲームに伝えるには、そのための [Codec][codec] を定義して[登録][register]する必要があります。3 つのフィールドを持つ先ほどの例を繰り返すと、次のようになります。

```java
public static final MapCodec<MyLootModifier> CODEC = RecordCodecBuilder.mapCodec(inst -> 
        // LootModifier#codecStart adds the conditions field.
        LootModifier.codecStart(inst).and(inst.group(
                Codec.STRING.fieldOf("field1").forGetter(e -> e.field1),
                Codec.INT.fieldOf("field2").forGetter(e -> e.field2),
                BuiltInRegistries.ITEM.byNameCodec().fieldOf("field3").forGetter(e -> e.field3)
        )).apply(inst, MyLootModifier::new)
);
```

そして、Codec を Registry に登録します。

```java
public static final DeferredRegister<MapCodec<? extends IGlobalLootModifier>> GLOBAL_LOOT_MODIFIER_SERIALIZERS =
        DeferredRegister.create(NeoForgeRegistries.Keys.GLOBAL_LOOT_MODIFIER_SERIALIZERS, ExampleMod.MOD_ID);

public static final Supplier<MapCodec<MyLootModifier>> MY_LOOT_MODIFIER =
        GLOBAL_LOOT_MODIFIER_SERIALIZERS.register("my_loot_modifier", () -> MyLootModifier.CODEC);
```

## 組み込みのルートモディファイア {#builtin-loot-modifiers}

NeoForge には、すぐに使えるルートモディファイアが用意されています。

### `neoforge:add_table`

このルートモディファイアは、2 つ目のルートテーブルを抽選し、その結果を、モディファイアを適用したルートテーブルに追加します。

```json5
{
    "type": "neoforge:add_table",
    "conditions": [], // the required loot conditions
    "table": "minecraft:chests/abandoned_mineshaft" // the second table to roll
}
```

## データ生成 {#datagen}

GLM は[データ生成][datagen]できます。そのためには、`GlobalLootModifierProvider` のサブクラスを作ります。

```java
public class MyGlobalLootModifierProvider extends GlobalLootModifierProvider {
    // Get the PackOutput from GatherDataEvent.
    public MyGlobalLootModifierProvider(PackOutput output) {
        super(output, ExampleMod.MOD_ID);
    }
    
    @Override
    protected void start() {
        // Call #add to add a new GLM. This also adds a corresponding entry in global_loot_modifiers.json.
        add(
                // The name of the modifier. This will be the file name.
                "my_loot_modifier_instance",
                // The loot modifier to add. For the sake of example, we add a weather loot condition.
                new MyLootModifier(new LootItemCondition[] {
                        WeatherCheck.weather().setRaining(true).build()
                }, "somestring", 10, Items.DIRT);
                // A list of data load conditions. Note that these are unrelated to the loot conditions
                // specified on the modifier itself. For the sake of example, we add a mod loaded condition.
                // An overload of #add is available that accepts a vararg of conditions instead of a list.
                List.of(new ModLoadedCondition("create"))
        );
    }
}
```

そして、他のデータプロバイダと同様に、プロバイダを `GatherDataEvent` に登録する必要があります。

```java
@SubscribeEvent // on the mod event bus
public static void onGatherData(GatherDataEvent event) {
    event.getGenerator().addProvider(event.includeServer(), MyGlobalLootModifierProvider::new);
}
```

[codec]: ../../../datastorage/codecs.md
[datagen]: ../../index.md#data-generation
[loottable]: index.md
[loottableid]: lootconditions#neoforgeloot_table_id
[register]: ../../../concepts/registries.md#methods-for-registering
[resloc]: ../../../misc/resourcelocation.md
[tags]: ../tags.md
