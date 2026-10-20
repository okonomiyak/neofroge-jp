import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# エンチャント {#enchantments}

エンチャントは、道具などの Item に付けられる特殊な効果です。1.21 以降、エンチャントは[データコンポーネント][Data Components]として Item に保存され、JSON で定義され、いわゆるエンチャント効果コンポーネントで構成されます。ゲーム中、特定の Item のエンチャントは、`DataComponentTypes.ENCHANTMENT` コンポーネント内の `ItemEnchantment` インスタンスに含まれます。

新しいエンチャントは、名前空間の `enchantment` という Datapack のサブフォルダに JSON ファイルを作ることで追加できます。たとえば、`examplemod:example_enchant` というエンチャントを作るには、`data/examplemod/enchantment/example_enchantment.json` というファイルを作ります。

## エンチャントの JSON の形式 {#enchantment-json-format}

```json5
{
    // The text component that will be used as the in-game name of the enchantment.
    // Can be a translation key or a literal string. 
    // Remember to translate this in your lang file if you use a translation key!
    "description": {
        "translate": "enchantment.examplemod.enchant_name"
    },
    
    // Which items this enchantment can be applied to.
    // Can be either an item id, such as "minecraft:trident",
    // or a list of item ids, such as ["examplemod:red_sword", "examplemod:blue_sword"]
    // or an item tag, such as "#examplemod:enchantable/enchant_name".
    // Note that this doesn't cause the enchantment to appear for these items in the enchanting table.
    "supported_items": "#examplemod:enchantable/enchant_name",

    // (Optional) Which items this enchantment appears for in the enchanting table.
    // Can be an item, list of items, or item tag.
    // If left unspecified, this is the same as `supported_items`.
    "primary_items": [
        "examplemod:item_a",
        "examplemod:item_b"
    ],

    // (Optional) Which enchantments are incompatible with this one.
    // Can be an enchantment id, such as "minecraft:sharpness",
    // or a list of enchantment ids, such as ["minecraft:sharpness", "minecraft:fire_aspect"],
    // or enchantment tag, such as "#examplemod:exclusive_to_enchant_name".
    // Incompatible enchantments will not be added to the same item by vanilla mechanics.
    "exclusive_set": "#examplemod:exclusive_to_enchant_name",
    
    // The likelihood that this enchantment will appear in the Enchanting Table. 
    // Bounded by [1, 1024].
    "weight": 6,
    
    // The maximum level this enchantment is allowed to reach.
    // Bounded by [1, 255].
    "max_level": 3,
    
    // The maximum cost of this enchantment, measured in "enchanting power". 
    // This corresponds to, but is not equivalent to, the threshold in levels the player needs to meet to bestow this enchantment.
    // See below for details.
    // The actual cost will be between this and the min_cost.
    "max_cost": {
        "base": 45,
        "per_level_above_first": 9
    },
    
    // Specifies the minimum cost of this enchantment; otherwise as above.
    "min_cost": {
        "base": 2,
        "per_level_above_first": 8
    },

    // The cost that this enchantment adds to repairing an item in an anvil in levels. The cost is multiplied by enchantment level.
    // If an item has a DataComponentTypes.STORED_ENCHANTMENTS component, the cost is halved. In vanilla, this only applies to enchanted books.
    // Bounded by [1, inf).
    "anvil_cost": 2,
    
    // (Optional) A list of slot groups this enchantment provides effects in. 
    // A slot group is defined as one of the possible values of the EquipmentSlotGroup enum.
    // In vanilla, these are: `any`, `hand`, `mainhand`, `offhand`, `armor`, `feet`, `legs`, `chest`, `head`, and  `body`.
    "slots": [
        "mainhand"
    ],

    // The effects that this enchantment provides as a map of enchantment effect components (read on).
    "effects": {
        "examplemod:custom_effect": [
            {
                "effect": {
                    "type": "minecraft:add",
                    "value": {
                        "type": "minecraft:linear",
                        "base": 1,
                        "per_level_above_first": 1
                    }
                }
            }
        ]
    }
}
```

### エンチャントのコストとレベル {#enchantment-costs-and-levels}

`max_cost` と `min_cost` のフィールドは、このエンチャントを生み出すのに必要なエンチャントの力の範囲を指定します。ただし、これらの値が実際に使われる手順は、やや込み入っています。

まず、エンチャントテーブルは、周囲の Block の `IBlockExtension#getEnchantPowerBonus()` の戻り値を考慮します。そこから `EnchantmentHelper#getEnchantmentCost` を呼び出し、各スロットの「基本レベル」を求めます。このレベルは、ゲーム内のメニューで、エンチャントの横の緑の数字として表示されます。エンチャントごとに、基本レベルは、Item のエンチャント適性( `IItemExtension#getEnchantmentValue()` の戻り値 )から求めたランダムな値で、次のように 2 回変更されます。

`(Modified Level) = (Base Level) + random.nextInt(e / 4 + 1) + random.nextInt(e / 4 + 1)`。ここで `e` はエンチャント適性の値です。

この変更後のレベルは、ランダムに最大 15% 上下され、最終的にエンチャントの選択に使われます。エンチャントが選ばれるには、このレベルがエンチャントのコストの範囲内に収まっている必要があります。

実際には、エンチャントの定義のコストの値が 30 を超えることがあり、時には大きく超えることもあるということです。たとえば、エンチャント適性が 10 の Item では、エンチャントテーブルはコストが最大 1.15 * ( 30 + 2 * ( 10 / 4 ) + 1 ) = 40 のエンチャントを生み出すことがあります。

## エンチャント効果コンポーネント {#enchantment-effect-components}

エンチャント効果コンポーネントは、エンチャントの機能を決める、特別に登録された[データコンポーネント][Data Components]です。コンポーネントの型がその効果を決め、含まれるデータはその効果の情報や調整に使われます。たとえば、`minecraft:damage` コンポーネントは、武器が与えるダメージを、そのデータで決まる量だけ変更します。

バニラは、すべてのバニラのエンチャントを実装するのに使われる、さまざまな[組み込みのエンチャント効果コンポーネント][built-in enchantment effect components]を定義しています。

### カスタムのエンチャント効果コンポーネント {#custom-enchantment-effect-components}

カスタムのエンチャント効果コンポーネントを適用するロジックは、すべて作成者が実装する必要があります。まず、ある効果を実装するのに必要な情報を保持するクラスまたは record を定義します。たとえば、`Increment` という record クラスの例を作ってみましょう。

```java
// Define an example data-bearing record.
public record Increment(int value) {
    public static final Codec<Increment> CODEC = RecordCodecBuilder.create(instance ->
            instance.group(
                    Codec.INT.fieldOf("value").forGetter(Increment::value)
            ).apply(instance, Increment::new)
    );

    public int add(int x) {
        return value() + x;
    }
}
```

エンチャント効果コンポーネントのタイプは、`BuiltInRegistries.ENCHANTMENT_EFFECT_COMPONENT_TYPE` に[登録][registered]する必要があります。この Registry は `DataComponentType<?>` を受け取ります。たとえば、`Increment` オブジェクトを保存できるエンチャント効果コンポーネントは、次のように登録できます。

```java
// In some registration class
public static final DeferredRegister<DataComponentType<?>> ENCHANTMENT_COMPONENT_TYPES = DeferredRegister.create(BuiltInRegistries.ENCHANTMENT_EFFECT_COMPONENT_TYPE, "examplemod");

public static final DeferredHolder<DataComponentType<?>, DataComponentType<Increment>>> INCREMENT =
    ENCHANTMENT_COMPONENT_TYPES.register("increment",
        () -> DataComponentType.<Increment>builder()
            .persistent(Increment.CODEC)
            .build());
```

これで、このコンポーネントを使って整数の値を変えるゲームロジックを実装できます。

```java
// Somewhere in game logic where an `itemStack` is available.
// `INCREMENT` is the enchantment component type holder defined above.
// `value` is an integer.
AtomicInteger atomicValue = new AtomicInteger(value);

EnchantmentHelper.runIterationOnItem(stack, (enchantmentHolder, enchantLevel) -> {
    // Acquire the Increment instance from the enchantment holder (or null if this is a different enchantment)
    Increment increment = enchantmentHolder.value().effects().get(INCREMENT.get());

    // If this enchant has an Increment component, use it.
    if(increment != null){
        atomicValue.set(increment.add(atomicValue.get()));
    }
});

int modifiedValue = atomicValue.get();
// Use the now-modified value elsewhere in your game logic.
```

まず、`EnchantmentHelper#runIterationOnItem` のオーバーロードのいずれかを呼び出します。この関数は `EnchantmentHelper.EnchantmentVisitor` を受け取ります。これは、エンチャントとそのレベルを受け取る関数型インターフェースで、指定したアイテムスタックが持つすべてのエンチャントに対して呼ばれます( 本質的には `BiConsumer<Enchantment, Integer>` です )。

実際に調整を行うには、用意した `Increment#add` メソッドを使います。これはラムダ式の中なので、値を変更するには、`AtomicInteger` のようなアトミックに更新できる型を使う必要があります。これにより、バニラと同じように、同じ Item で複数の `INCREMENT` コンポーネントを実行し、効果を重ねることもできます。

### `ConditionalEffect`
型を `ConditionalEffect<?>` でラップすると、エンチャント効果コンポーネントが、指定した [LootContext][LootContext] に応じて条件付きで効果を発揮するようにできます。

`ConditionalEffect` には `ConditionalEffect#matches(LootContext context)` があり、内部の `Optional<LootItemConditon>` に基づいて、効果の実行を許可すべきかどうかを返します。また、`LootItemCondition` のシリアライズとデシリアライズも処理します。

バニラは、これらの条件のチェックをさらに簡単にするため、追加のヘルパーメソッド `Enchantment#applyEffects()` を用意しています。このメソッドは `List<ConditionalEffect<T>>` を受け取り、条件を評価して、条件を満たした `ConditionalEffect` に含まれる各 `T` に対して `Consumer<T>` を実行します。バニラのエンチャント効果コンポーネントの多くは `List<ConditionalEffect<?>>` として定義されているため、次のようにこのヘルパーメソッドに直接渡せます。

```java
// `enchant` is an Enchantment instance.
// `lootContext` is a LootContext instance.
Enchantment.applyEffects(
    enchant.getEffects(EnchantmentEffectComponents.KNOCKBACK), // Or whichever other List<ConditionalEffect<T>> you want
    lootContext,
    (effectData) -> // Use the effectData (in this example, an EnchantmentValueEffect) however you want.
);
```

`ConditionalEffect` でラップしたカスタムのエンチャント効果コンポーネントのタイプは、次のように登録できます。

```java
public static final DeferredHolder<DataComponentType<?>, DataComponentType<ConditionalEffect<Increment>>> CONDITIONAL_INCREMENT =
    ENCHANTMENT_COMPONENT_TYPES.register("conditional_increment",
        () -> DataComponentType.ConditionalEffect<Increment>builder()
            // The LootContextParamSet needed depends on what the enchantment is supposed to do.
            // This might be one of ENCHANTED_DAMAGE, ENCHANTED_ITEM, ENCHANTED_LOCATION, ENCHANTED_ENTITY, or HIT_BLOCK
            // since all of these bring the enchantment level into context (along with whatever other information is indicated).
            .persistent(ConditionalEffect.codec(Increment.CODEC, LootContextParamSets.ENCHANTED_DAMAGE))
            .build());
```
`ConditionalEffect.codec` の引数は、ジェネリクスの `ConditionalEffect<T>` 用の Codec と、それに続く何らかの `LootContextParamSets` のエントリです。

## エンチャントのデータ生成 {#enchantment-data-generation}

エンチャントの JSON ファイルは、`RegistrySetBuilder` を `DatapackBuiltInEntriesProvider` に渡すことで、[データ生成][data generation]の仕組みを使って自動で作成できます。JSON は `<project root>/src/generated/data/<modid>/enchantment/<path>.json` に置かれます。

`RegistrySetBuilder` と `DatapackBuiltinEntriesProvider` の仕組みについて詳しくは、[Datapack Registry のデータ生成][Data Generation for Datapack Registries]の記事を参照してください。

<Tabs>
<TabItem value="datagen" label="Datagen">

```java

// This RegistrySetBuilder should be passed into a DatapackBuiltinEntriesProvider in your GatherDataEvent handler.
RegistrySetBuilder BUILDER = new RegistrySetBuilder();
BUILDER.add(
    Registries.ENCHANTMENT,
    bootstrap -> bootstrap.register(
        // Define the ResourceKey for our enchantment.
        ResourceKey.create(
            Registries.ENCHANTMENT,
            ResourceLocation.fromNamespaceAndPath("examplemod", "example_enchantment")
        ),
        new Enchantment(
            // The text Component that specifies the enchantment's name.
            Component.literal("Example Enchantment"),  
            
            // Specify the enchantment definition of for our enchantment.
            new Enchantment.EnchantmentDefinition(
                // A HolderSet of Items that the enchantment will be compatible with.
                HolderSet.direct(...), 

                // An Optional<HolderSet> of items that the enchantment considers "primary".
                Optional.empty(), 

                // The weight of the enchantment.
                30, 

                // The maximum level this enchantment can be.
                3, 

                // The minimum cost of the enchantment. The first parameter is base cost, the second is cost per level.
                new Enchantment.Cost(3, 1), 

                // The maximum cost of the enchantment. As above.
                new Enchantment.Cost(4, 2), 

                // The anvil cost of the enchantment.
                2, 

                // A list of EquipmentSlotGroups that this enchantment has effects in.
                List.of(EquipmentSlotGroup.ANY) 
            ),
            // A HolderSet of incompatible other enchantments.
            HolderSet.empty(), 

            // A DataComponentMap of the enchantment effect components associated with this enchantment and their values.
            DataComponentMap.builder() 
                .set(MY_ENCHANTMENT_EFFECT_COMPONENT_TYPE, new ExampleData())
                .build()
        )
    )
);

```

</TabItem>

<TabItem value="json" label="JSON" default>

```json5
// For more detail on each entry, please check the section above on the enchantment JSON format.
{
    // The anvil cost of the enchantment.
    "anvil_cost": 2,

    // The text Component that specifies the enchantment's name.
    "description": "Example Enchantment",

    // A map of the effect components associated with this enchantment and their values.
    "effects": {
        // <effect components>
    },

    // The maximum cost of the enchantment.
    "max_cost": {
        "base": 4,
        "per_level_above_first": 2
    },

    // The maximum level this enchantment can be.
    "max_level": 3,

    // The minimum cost of the enchantment.
    "min_cost": {
        "base": 3,
        "per_level_above_first": 1
    },

    // A list of EquipmentSlotGroup aliases that this enchantment has effects in.
    "slots": [
        "any"
    ],

    // The set of items that this enchantment can be applied to using an anvil.
    "supported_items": /* <supported item list> */,

    // The weight of this enchantment.
    "weight": 30
}
```

</TabItem>
</Tabs>

[Data Components]: /docs/items/datacomponents
[Codec]: /docs/datastorage/codecs
[Enchantment definition Minecraft wiki page]: https://minecraft.wiki/w/Enchantment_definition
[registered]: /docs/concepts/registries
[Predicate]: https://minecraft.wiki/w/Predicate
[data generation]: /docs/resources/#data-generation
[Data Generation for Datapack Registries]: https://docs.neoforged.net/docs/concepts/registries/#data-generation-for-datapack-registries
[relevant minecraft wiki page]: https://minecraft.wiki/w/Enchantment_definition#Entity_effects
[built-in enchantment effect components]: builtin.md
[LootContext]: /docs/resources/server/loottables/#loot-context