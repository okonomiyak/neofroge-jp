import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# バイオームモディファイア {#biome-modifiers}

バイオームモディファイアは、データ駆動でバイオームのさまざまな側面を変更できる仕組みです。PlacedFeature の追加や削除、モブのスポーンの追加や削除、気候の変更、葉や水の色の調整などができます。NeoForge には、プレイヤーと Mod 開発者の両方にとって、ほとんどの用途をカバーするデフォルトのバイオームモディファイアがいくつか用意されています。

### おすすめの読むべきセクション {#recommended-section-to-read}

- プレイヤーやパック制作者:
    - [バイオームモディファイアの適用](#applying-biome-modifiers)
    - [NeoForge 組み込みのバイオームモディファイア](#built-in-biome-modifiers)


- 単純な追加や削除のバイオームの変更を行う Mod 開発者:
    - [バイオームモディファイアの適用](#applying-biome-modifiers)
    - [NeoForge 組み込みのバイオームモディファイア](#built-in-biome-modifiers)
    - [バイオームモディファイアのデータ生成](#datagenning-biome-modifiers)


- 独自の、または複雑なバイオームの変更を行いたい Mod 開発者:
    - [バイオームモディファイアの適用](#applying-biome-modifiers)
    - [カスタムのバイオームモディファイアの作成](#creating-custom-biome-modifiers)
    - [バイオームモディファイアのデータ生成](#datagenning-biome-modifiers)


## バイオームモディファイアの適用 {#applying-biome-modifiers}

NeoForge にバイオームモディファイアの JSON ファイルをゲームへ読み込ませるには、そのファイルを Mod のリソース、または [Datapack][datapacks] の `data/<modid>/neoforge/biome_modifier/<path>.json` に置く必要があります。NeoForge はバイオームモディファイアを読み込むと、その指示を読み取り、ワールドの読み込み時に、対象のすべてのバイオームに記述された変更を適用します。Mod の既存のバイオームモディファイアは、Datapack でまったく同じ場所と名前の新しい JSON ファイルを用意することで上書きできます。

JSON ファイルは、「[NeoForge 組み込みのバイオームモディファイア](#built-in-biome-modifiers)」セクションの例に従って手で作るか、「[バイオームモディファイアのデータ生成](#datagenning-biome-modifiers)」セクションで示すようにデータ生成で作れます。

## 組み込みのバイオームモディファイア {#built-in-biome-modifiers}

以下のバイオームモディファイアは NeoForge によって登録されており、誰でも使えます。

### なし {#none}

このバイオームモディファイアは何も処理を行わず、何も変更しません。パック制作者やプレイヤーは、Datapack でこれを使い、Mod のバイオームモディファイアの JSON を下の JSON で上書きすることで、Mod のバイオームモディファイアを無効にできます。

<Tabs>
<TabItem value="json" label="JSON" default>

```json5
{
    "type": "neoforge:none"
}
```

</TabItem>
<TabItem value="datagen" label="Datagen">

```java
// Define the ResourceKey for our BiomeModifier.
public static final ResourceKey<BiomeModifier> NO_OP_EXAMPLE = ResourceKey.create(
    NeoForgeRegistries.Keys.BIOME_MODIFIERS, // The registry this key is for
    ResourceLocation.fromNamespaceAndPath(MOD_ID, "no_op_example") // The registry name
);

// BUILDER is a RegistrySetBuilder passed to DatapackBuiltinEntriesProvider
// in a listener for GatherDataEvent.
BUILDER.add(NeoForgeRegistries.Keys.BIOME_MODIFIERS, bootstrap -> {
    // Register the biome modifiers.
    bootstrap.register(NO_OP_EXAMPLE, NoneBiomeModifier.INSTANCE);
});
```

</TabItem>
</Tabs>

### フィーチャーの追加 {#add-features}

このバイオームモディファイアのタイプは、ワールド生成中にスポーンするよう、`PlacedFeature`( 木や鉱石など )をバイオームに追加します。このモディファイアは、フィーチャーを追加するバイオームの ID またはタグ、選択したバイオームに追加する `PlacedFeature` の ID またはタグ、そしてフィーチャーを生成する [`GenerationStep.Decoration`](#Available-Values-for-Decoration-Steps) を受け取ります。

<Tabs>
<TabItem value="json" label="JSON" default>

```json5
{
    "type": "neoforge:add_features",
    // Can either be a biome id, such as "minecraft:plains",
    // or a list of biome ids, such as ["minecraft:plains", "minecraft:badlands", ...],
    // or a biome tag, such as "#c:is_overworld".
    "biomes": "#namespace:your_biome_tag",
    // Can either be a placed feature id, such as "examplemod:add_features_example",
    // or a list of placed feature ids, such as ["examplemod:add_features_example", minecraft:ice_spike", ...],
    // or a placed feature tag, such as "#examplemod:placed_feature_tag".
    "features": "namespace:your_feature",
    // See the GenerationStep.Decoration enum in code for a list of valid enum names.
    // The decoration step section further down also has the list of values for reference.
    "step": "underground_ores"
}
```

</TabItem>
<TabItem value="datagen" label="Datagen">

```java
// Assume we have some PlacedFeature named EXAMPLE_PLACED_FEATURE.
// Define the ResourceKey for our BiomeModifier.
public static final ResourceKey<BiomeModifier> ADD_FEATURES_EXAMPLE = ResourceKey.create(
    NeoForgeRegistries.Keys.BIOME_MODIFIERS, // The registry this key is for
    ResourceLocation.fromNamespaceAndPath(MOD_ID, "add_features_example") // The registry name
);

// BUILDER is a RegistrySetBuilder passed to DatapackBuiltinEntriesProvider
// in a listener for GatherDataEvent.
BUILDER.add(NeoForgeRegistries.Keys.BIOME_MODIFIERS, bootstrap -> {
    // Lookup any necessary registries.
    // Static registries only need to be looked up if you need to grab the tag data.
    HolderGetter<Biome> biomes = bootstrap.lookup(Registries.BIOME);
    HolderGetter<PlacedFeature> placedFeatures = bootstrap.lookup(Registries.PLACED_FEATURE);

    // Register the biome modifiers.
    bootstrap.register(ADD_FEATURES_EXAMPLE,
        new AddFeaturesBiomeModifier(
            // The biome(s) to generate within
            HolderSet.direct(biomes.getOrThrow(Biomes.PLAINS)),
            // The feature(s) to generate within the biomes
            HolderSet.direct(placedFeatures.getOrThrow(EXAMPLE_PLACED_FEATURE)),
            // The generation step
            GenerationStep.Decoration.LOCAL_MODIFICATIONS
        )
    );
})
```

</TabItem>
</Tabs>


:::warning
バニラの `PlacedFeature` をバイオームに追加するときは注意が必要です。そうすると、フィーチャーサイクル違反( 2 つのバイオームが同じ 2 つのフィーチャーを、同じ `GenerationStep` の中で異なる順序でフィーチャーリストに持つこと )と呼ばれる状態を引き起こし、クラッシュすることがあります。同様の理由で、同じ `PlacedFeature` を複数のバイオームモディファイアで使うべきではありません。

バニラの `PlacedFeature` は、バイオームの JSON で参照することも、バイオームモディファイアで追加することもできますが、両方で使うべきではありません。それでもこの方法で追加する必要がある場合は、バニラの `PlacedFeature` のコピーを自分の名前空間に作るのが、これらの問題を避ける最も簡単な方法です。
:::

### フィーチャーの削除 {#remove-features}

このバイオームモディファイアのタイプは、ワールド生成中にスポーンしないよう、フィーチャー( 木や鉱石など )をバイオームから削除します。このモディファイアは、フィーチャーを削除するバイオームの ID またはタグ、選択したバイオームから削除する `PlacedFeature` の ID またはタグ、そしてフィーチャーを削除する [`GenerationStep.Decoration`](#Available-Values-for-Decoration-Steps) を受け取ります。

<Tabs>
<TabItem value="json" label="JSON" default>

```json5
{
    "type": "neoforge:remove_features",
    // Can either be a biome id, such as "minecraft:plains",
    // or a list of biome ids, such as ["minecraft:plains", "minecraft:badlands", ...],
    // or a biome tag, such as "#c:is_overworld".
    "biomes": "#namespace:your_biome_tag",
    // Can either be a placed feature id, such as "examplemod:add_features_example",
    // or a list of placed feature ids, such as ["examplemod:add_features_example", "minecraft:ice_spike", ...],
    // or a placed feature tag, such as "#examplemod:placed_feature_tag".
    "features": "namespace:problematic_feature",
    // Optional field specifying a GenerationStep, or a list of GenerationSteps, to remove features from.
    // If omitted, defaults to all GenerationSteps.
    // See the GenerationStep.Decoration enum in code for a list of valid enum names.
    // The decoration step section further down also has the list of values for reference.
    "steps": ["underground_ores", "underground_decoration"]
}
```

</TabItem>
<TabItem value="datagen" label="Datagen">

```java
// Define the ResourceKey for our BiomeModifier.
public static final ResourceKey<BiomeModifier> REMOVE_FEATURES_EXAMPLE = ResourceKey.create(
    NeoForgeRegistries.Keys.BIOME_MODIFIERS, // The registry this key is for
    ResourceLocation.fromNamespaceAndPath(MOD_ID, "remove_features_example") // The registry name
);

// BUILDER is a RegistrySetBuilder passed to DatapackBuiltinEntriesProvider
// in a listener for GatherDataEvent.
BUILDER.add(NeoForgeRegistries.Keys.BIOME_MODIFIERS, bootstrap -> {
    // Lookup any necessary registries.
    // Static registries only need to be looked up if you need to grab the tag data.
    HolderGetter<Biome> biomes = bootstrap.lookup(Registries.BIOME);
    HolderGetter<PlacedFeature> placedFeatures = bootstrap.lookup(Registries.PLACED_FEATURE);

    // Register the biome modifiers.
    bootstrap.register(REMOVE_FEATURES_EXAMPLE,
        new RemoveFeaturesBiomeModifier(
            // The biome(s) to remove from
            biomes.getOrThrow(Tags.Biomes.IS_OVERWORLD),
            // The feature(s) to remove from the biomes
            HolderSet.direct(placedFeatures.getOrThrow(OrePlacements.ORE_DIAMOND)),
            // The generation steps to remove from
            Set.of(
                GenerationStep.Decoration.LOCAL_MODIFICATIONS,
                GenerationStep.Decoration.UNDERGROUND_ORES
            )
        )
    );
});
```

</TabItem>
</Tabs>


### スポーンの追加 {#add-spawns}

このバイオームモディファイアのタイプは、エンティティのスポーンをバイオームに追加します。このモディファイアは、エンティティのスポーンを追加するバイオームの ID またはタグと、追加するエンティティの `SpawnerData` を受け取ります。各 `SpawnerData` には、エンティティの ID、スポーンの重み、一度にスポーンするエンティティの最小数と最大数が含まれます。

:::note
新しいエンティティを追加する Mod 開発者は、そのエンティティのスポーン制限を `RegisterSpawnPlacementsEvent` に登録してください。スポーン制限は、エンティティを地表や水中に安全にスポーンさせるために使われます。スポーン制限を登録しないと、エンティティが空中にスポーンし、落下して死んでしまうことがあります。
:::

<Tabs>
<TabItem value="json" label="JSON" default>

```json5
{
    "type": "neoforge:add_spawns",
    // Can either be a biome id, such as "minecraft:plains",
    // or a list of biome ids, such as ["minecraft:plains", "minecraft:badlands", ...],
    // or a biome tag, such as "#c:is_overworld".
    "biomes": "#namespace:biome_tag",
    // Can be either a single object or a list of objects.
    "spawners": [
        {
            "type": "namespace:entity_type", // The id of the entity type to spawn
            "weight": 100, // int, spawn weight
            "minCount": 1, // int, minimum group size
            "maxCount": 4 // int, maximum group size
        },
        {
            "type": "minecraft:ghast",
            "weight": 1,
            "minCount": 5,
            "maxCount": 10
        }
    ]
}
```

</TabItem>
<TabItem value="datagen" label="Datagen">

```java
// Assume we have some EntityType<?> named EXAMPLE_ENTITY.
// Define the ResourceKey for our BiomeModifier.
public static final ResourceKey<BiomeModifier> ADD_SPAWNS_EXAMPLE = ResourceKey.create(
    NeoForgeRegistries.Keys.BIOME_MODIFIERS, // The registry this key is for
    ResourceLocation.fromNamespaceAndPath(MOD_ID, "add_spawns_example") // The registry name
);

// BUILDER is a RegistrySetBuilder passed to DatapackBuiltinEntriesProvider
// in a listener for GatherDataEvent.
BUILDER.add(NeoForgeRegistries.Keys.BIOME_MODIFIERS, bootstrap -> {
    // Lookup any necessary registries.
    // Static registries only need to be looked up if you need to grab the tag data.
    HolderGetter<Biome> biomes = bootstrap.lookup(Registries.BIOME);

    // Register the biome modifiers.
    bootstrap.register(ADD_SPAWNS_EXAMPLE,
        new AddSpawnsBiomeModifier(
            // The biome(s) to spawn the mobs within
            HolderSet.direct(biomes.getOrThrow(Biomes.PLAINS)),
            // The spawners of the entities to add
            List.of(
                new SpawnerData(EXAMPLE_ENTITY, 100, 1, 4),
                new SpawnerData(EntityType.GHAST, 1, 5, 10)
            )
        )
    );
});
```

</TabItem>
</Tabs>


### スポーンの削除 {#remove-spawns}

このバイオームモディファイアのタイプは、エンティティのスポーンをバイオームから削除します。このモディファイアは、エンティティのスポーンを削除するバイオームの ID またはタグと、削除するエンティティの `EntityType` の ID またはタグを受け取ります。

<Tabs>
<TabItem value="json" label="JSON" default>

```json5
{
    "type": "neoforge:remove_spawns",
    // Can either be a biome id, such as "minecraft:plains",
    // or a list of biome ids, such as ["minecraft:plains", "minecraft:badlands", ...],
    // or a biome tag, such as "#c:is_overworld".
    "biomes": "#namespace:biome_tag",
    // Can either be an entity type id, such as "minecraft:ghast",
    // or a list of entity type ids, such as ["minecraft:ghast", "minecraft:skeleton", ...],
    // or an entity type tag, such as "#minecraft:skeletons".
    "entity_types": "#namespace:entitytype_tag"
}
```

</TabItem>
<TabItem value="datagen" label="Datagen">

```java
// Define the ResourceKey for our BiomeModifier.
public static final ResourceKey<BiomeModifier> REMOVE_SPAWNS_EXAMPLE = ResourceKey.create(
    NeoForgeRegistries.Keys.BIOME_MODIFIERS, // The registry this key is for
    ResourceLocation.fromNamespaceAndPath(MOD_ID, "remove_spawns_example") // The registry name
);

// BUILDER is a RegistrySetBuilder passed to DatapackBuiltinEntriesProvider
// in a listener for GatherDataEvent.
BUILDER.add(NeoForgeRegistries.Keys.BIOME_MODIFIERS, bootstrap -> {
    // Lookup any necessary registries.
    // Static registries only need to be looked up if you need to grab the tag data.
    HolderGetter<Biome> biomes = bootstrap.lookup(Registries.BIOME);
    HolderGetter<EntityType<?>> entities = bootstrap.lookup(Registries.ENTITY_TYPE);

    // Register the biome modifiers.
    bootstrap.register(REMOVE_SPAWNS_EXAMPLE,
        new RemoveSpawnsBiomeModifier(
            // The biome(s) to remove the spawns from
            biomes.getOrThrow(Tags.Biomes.IS_OVERWORLD),
            // The entities to remove spawns for
            entities.getOrThrow(EntityTypeTags.SKELETONS)
        )
    );
});
```

</TabItem>
</Tabs>


### スポーンコストの追加 {#add-spawn-costs}

バイオームに新しいスポーンコストを追加できます。スポーンコストは、モブが固まってスポーンしないよう、バイオーム内でばらけてスポーンさせるための比較的新しい方法です。この仕組みでは、エンティティが周囲に `charge` を放ち、それが他のエンティティの `charge` と足し合わされます。新しいエンティティをスポーンさせるとき、スポーンのアルゴリズムは、その場所の `charge` の合計値にスポーンするエンティティの `charge` の値を掛けたものが、スポーンするエンティティの `energy_budget` より小さくなる場所を探します。これはモブをスポーンさせる高度な方法なので、既存の値を参考にするために、この仕組みの代表的な利用例であるソウルサンドの谷のバイオームを参照するとよいでしょう。

このモディファイアは、スポーンコストを追加するバイオームの ID またはタグ、スポーンコストを追加するエンティティタイプの `EntityType` の ID またはタグ、そしてそのエンティティの `MobSpawnSettings.MobSpawnCost` を受け取ります。`MobSpawnCost` にはエネルギーの予算が含まれます。これは、スポーンする各エンティティが持つ charge に基づいて、ある場所にスポーンできるエンティティの最大数を示します。

:::note
新しいエンティティを追加する Mod 開発者は、そのエンティティのスポーン制限を `RegisterSpawnPlacementsEvent` に登録してください。
:::

<Tabs>
<TabItem value="json" label="JSON" default>

```json5
{
    "type": "neoforge:add_spawn_costs",
    // Can either be a biome id, such as "minecraft:plains",
    // or a list of biome ids, such as ["minecraft:plains", "minecraft:badlands", ...],
    // or a biome tag, such as "#c:is_overworld".
    "biomes": "#namespace:biome_tag",
    // Can either be an entity type id, such as "minecraft:ghast",
    // or a list of entity type ids, such as ["minecraft:ghast", "minecraft:skeleton", ...],
    // or an entity type tag, such as "#minecraft:skeletons".
    "entity_types": "#minecraft:skeletons",
    "spawn_cost": {
        // The energy budget
        "energy_budget": 1.0,
        // The amount of charge each entity takes up from the budget
        "charge": 0.1
    }
}
```

</TabItem>
<TabItem value="datagen" label="Datagen">

```java
// Define the ResourceKey for our BiomeModifier.
public static final ResourceKey<BiomeModifier> ADD_SPAWN_COSTS_EXAMPLE = ResourceKey.create(
    NeoForgeRegistries.Keys.BIOME_MODIFIERS, // The registry this key is for
    ResourceLocation.fromNamespaceAndPath(MOD_ID, "add_spawn_costs_example") // The registry name
);

// BUILDER is a RegistrySetBuilder passed to DatapackBuiltinEntriesProvider
// in a listener for GatherDataEvent.
BUILDER.add(NeoForgeRegistries.Keys.BIOME_MODIFIERS, bootstrap -> {
    // Lookup any necessary registries.
    // Static registries only need to be looked up if you need to grab the tag data.
    HolderGetter<Biome> biomes = bootstrap.lookup(Registries.BIOME);
    HolderGetter<EntityType<?>> entities = bootstrap.lookup(Registries.ENTITY_TYPE);

    // Register the biome modifiers.
    bootstrap.register(ADD_SPAWN_COSTS_EXAMPLE,
        new AddSpawnCostsBiomeModifier(
            // The biome(s) to add the spawn costs to
            biomes.getOrThrow(Tags.Biomes.IS_OVERWORLD),
            // The entities to add the spawn costs for
            entities.getOrThrow(EntityTypeTags.SKELETONS),
            new MobSpawnSettings.MobSpawnCost(
                1.0, // The energy budget
                0.1  // The amount of charge each entity takes up from the budget
            )
        )
    );
});
```

</TabItem>
</Tabs>


### スポーンコストの削除 {#remove-spawn-costs}

バイオームからスポーンコストを削除できます。スポーンコストは、モブが固まってスポーンしないよう、バイオーム内でばらけてスポーンさせるための比較的新しい方法です。このモディファイアは、スポーンコストを削除するバイオームの ID またはタグと、スポーンコストを削除するエンティティの `EntityType` の ID またはタグを受け取ります。

<Tabs>
<TabItem value="json" label="JSON" default>

```json5
{
    "type": "neoforge:remove_spawn_costs",
    // Can either be a biome id, such as "minecraft:plains",
    // or a list of biome ids, such as ["minecraft:plains", "minecraft:badlands", ...],
    // or a biome tag, such as "#c:is_overworld".
    "biomes": "#namespace:biome_tag",
    // Can either be an entity type id, such as "minecraft:ghast",
    // or a list of entity type ids, such as ["minecraft:ghast", "minecraft:skeleton", ...],
    // or an entity type tag, such as "#minecraft:skeletons".
    "entity_types": "#minecraft:skeletons"
}
```

</TabItem>
<TabItem value="datagen" label="Datagen">

```java
// Define the ResourceKey for our BiomeModifier.
public static final ResourceKey<BiomeModifier> REMOVE_SPAWN_COSTS_EXAMPLE = ResourceKey.create(
    NeoForgeRegistries.Keys.BIOME_MODIFIERS, // The registry this key is for
    ResourceLocation.fromNamespaceAndPath(MOD_ID, "remove_spawn_costs_example") // The registry name
);

// BUILDER is a RegistrySetBuilder passed to DatapackBuiltinEntriesProvider
// in a listener for GatherDataEvent.
BUILDER.add(NeoForgeRegistries.Keys.BIOME_MODIFIERS, bootstrap -> {
    // Lookup any necessary registries.
    // Static registries only need to be looked up if you need to grab the tag data.
    HolderGetter<Biome> biomes = bootstrap.lookup(Registries.BIOME);
    HolderGetter<EntityType<?>> entities = bootstrap.lookup(Registries.ENTITY_TYPE);

    // Register the biome modifiers.
    bootstrap.register(REMOVE_SPAWN_COSTS_EXAMPLE,
        new RemoveSpawnCostsBiomeModifier(
            // The biome(s) to remove the spawn costs from
            biomes.getOrThrow(Tags.Biomes.IS_OVERWORLD),
            // The entities to remove spawn costs for
            entities.getOrThrow(EntityTypeTags.SKELETONS)
        )
    );
});
```

</TabItem>
</Tabs>


### レガシーカーバーの追加 {#add-legacy-carvers}

このバイオームモディファイアのタイプを使うと、カーバーによる洞窟や峡谷をバイオームに追加できます。これは、洞窟と崖のアップデートより前に洞窟の生成に使われていたものです。ノイズ洞窟をバイオームに追加することは**できません**。ノイズ洞窟は、ノイズに基づく特定のチャンクジェネレーターの仕組みの一部であり、実際にはバイオームに結び付いていないためです。

<Tabs>
<TabItem value="json" label="JSON" default>

```json5
    {
    "type": "neoforge:add_carvers",
    // Can either be a biome id, such as "minecraft:plains",
    // or a list of biome ids, such as ["minecraft:plains", "minecraft:badlands", ...],
    // or a biome tag, such as "#c:is_overworld".
    "biomes": "minecraft:plains",
    // Can either be a carver id, such as "examplemod:add_carvers_example",
    // or a list of carver ids, such as ["examplemod:add_carvers_example", "minecraft:canyon", ...],
    // or a carver tag, such as "#examplemod:configured_carver_tag".
    "carvers": "examplemod:add_carvers_example",
    // See GenerationStep.Carving in code for a list of valid enum names.
    // Only "air" and "liquid" are available.
    "step": "air"
}
```

</TabItem>
<TabItem value="datagen" label="Datagen">

```java
// Assume we have some ConfiguredWorldCarver named EXAMPLE_CARVER.
// Define the ResourceKey for our BiomeModifier.
public static final ResourceKey<BiomeModifier> ADD_CARVERS_EXAMPLE = ResourceKey.create(
    NeoForgeRegistries.Keys.BIOME_MODIFIERS, // The registry this key is for
    ResourceLocation.fromNamespaceAndPath(MOD_ID, "add_carvers_example") // The registry name
);

// BUILDER is a RegistrySetBuilder passed to DatapackBuiltinEntriesProvider
// in a listener for GatherDataEvent.
BUILDER.add(NeoForgeRegistries.Keys.BIOME_MODIFIERS, bootstrap -> {
    // Lookup any necessary registries.
    // Static registries only need to be looked up if you need to grab the tag data.
    HolderGetter<Biome> biomes = bootstrap.lookup(Registries.BIOME);
    HolderGetter<ConfiguredWorldCarver<?>> carvers = bootstrap.lookup(Registries.CONFIGURED_CARVER);

    // Register the biome modifiers.
    bootstrap.register(ADD_CARVERS_EXAMPLE,
        new AddCarversBiomeModifier(
            // The biome(s) to generate within
            HolderSet.direct(biomes.getOrThrow(Biomes.PLAINS)),
            // The carver(s) to generate within the biomes
            HolderSet.direct(carvers.getOrThrow(EXAMPLE_CARVER)),
            // The generation step
            GenerationStep.Carving.AIR
        )
    );
});
```

</TabItem>
</Tabs>

### レガシーカーバーの削除 {#removing-legacy-carvers}

このバイオームモディファイアのタイプを使うと、カーバーによる洞窟や峡谷をバイオームから削除できます。これは、洞窟と崖のアップデートより前に洞窟の生成に使われていたものです。ノイズ洞窟をバイオームから削除することは**できません**。ノイズ洞窟はディメンションのノイズ設定の仕組みに組み込まれており、実際にはバイオームに結び付いていないためです。

<Tabs>
<TabItem value="json" label="JSON" default>

```json5
{
    "type": "neoforge:remove_carvers",
    // Can either be a biome id, such as "minecraft:plains",
    // or a list of biome ids, such as ["minecraft:plains", "minecraft:badlands", ...],
    // or a biome tag, such as "#c:is_overworld".
    "biomes": "minecraft:plains",
    // Can either be a carver id, such as "examplemod:add_carvers_example",
    // or a list of carver ids, such as ["examplemod:add_carvers_example", "minecraft:canyon", ...],
    // or a carver tag, such as "#examplemod:configured_carver_tag".
    "carvers": "examplemod:add_carvers_example",
    // Can either be a single generation step, such as "air",
    // or a list of generation steps, such as ["air", "liquid"].
    // See GenerationStep.Carving for a list of valid enum names.
    // Only "air" and "liquid" are available.
    "steps": [
        "air",
        "liquid"
    ]
}
```

</TabItem>
<TabItem value="datagen" label="Datagen">

```java
// Define the ResourceKey for our BiomeModifier.
public static final ResourceKey<BiomeModifier> REMOVE_CARVERS_EXAMPLE = ResourceKey.create(
    NeoForgeRegistries.Keys.BIOME_MODIFIERS, // The registry this key is for
    ResourceLocation.fromNamespaceAndPath(MOD_ID, "remove_carvers_example") // The registry name
);

// BUILDER is a RegistrySetBuilder passed to DatapackBuiltinEntriesProvider
// in a listener for GatherDataEvent.
BUILDER.add(NeoForgeRegistries.Keys.BIOME_MODIFIERS, bootstrap -> {
    // Lookup any necessary registries.
    // Static registries only need to be looked up if you need to grab the tag data.
    HolderGetter<Biome> biomes = bootstrap.lookup(Registries.BIOME);
    HolderGetter<ConfiguredWorldCarver<?>> carvers = bootstrap.lookup(Registries.CONFIGURED_CARVER);

    // Register the biome modifiers.
    bootstrap.register(REMOVE_CARVERS_EXAMPLE,
        new AddFeaturesBiomeModifier(
            // The biome(s) to remove from
            biomes.getOrThrow(Tags.Biomes.IS_OVERWORLD),
            // The carver(s) to remove from the biomes
            HolderSet.direct(carvers.getOrThrow(Carvers.CAVE)),
            // The generation steps to remove from
            Set.of(
                GenerationStep.Carving.AIR,
                GenerationStep.Carving.LIQUID
            )
        )
    );
});
```

</TabItem>
</Tabs>

### 装飾ステップで使える値 {#available-values-for-decoration-steps}

前述の多くの JSON にある `step` または `steps` フィールドは、`GenerationStep.Decoration` enum を指します。この enum のステップは次の順に並んでおり、これはゲームがワールド生成中に生成を行う順序と同じです。フィーチャーは、最もふさわしいステップに入れるようにしてください。

|           ステップ           | 説明                                                                             |
|:------------------------:|:----------------------------------------------------------------------------------------|
|     `raw_generation`     | 最初に実行されます。小さなエンド島のような、地形に近い特殊なフィーチャーに使われます。 |
|         `lakes`          | 溶岩湖のような、池に近いフィーチャーをスポーンさせるためのものです。                             |
|  `local_modifications`   | ジオード、氷山、岩、鍾乳石など、地形の変更のためのものです。          |
| `underground_structures` | ダンジョンや化石のような、地下の小さな構造物に近いフィーチャーに使われます。         |
|   `surface_structures`   | 砂漠の井戸のような、地表にのみある小さな構造物に近いフィーチャーのためのものです。                    |
|      `strongholds`       | 要塞の構造物専用です。変更されていない Minecraft では、ここにはフィーチャーが追加されません。  |
|    `underground_ores`    | すべての鉱石と鉱脈を追加するステップです。金、土、花崗岩などが含まれます。 |
| `underground_decoration` | 通常、洞窟の装飾に使われます。鍾乳石の群生やスカルクの脈はここにあります。         |
|     `fluid_springs`      | 小さな溶岩の滝や水の滝は、このステップのフィーチャーから生まれます。                    |
|   `vegetal_decoration`   | ほぼすべての植物( 花、木、ツタなど )がこのステップで追加されます。            |
| `top_layer_modification` | 最後に実行されます。寒いバイオームの地表に雪や氷を置くのに使われます。               |


## カスタムのバイオームモディファイアの作成 {#creating-custom-biome-modifiers}

### `BiomeModifier` の実装 {#the-biomemodifier-implementation}

内部的には、バイオームモディファイアは 3 つの部分からなります。

- バイオームのビルダーを変更するために使う、[Datapack Registry に登録した][datareg] `BiomeModifier`。
- モディファイアをエンコード・デコードする、[静的に登録した][staticreg] `MapCodec`。
- 登録した `MapCodec` の ID を参照可能なタイプとして使い、`BiomeModifier` を構築する JSON。

`BiomeModifier` には、`#modify` と `#codec` の 2 つのメソッドがあります。`modify` は、現在の `Biome` の `Holder`、現在の `BiomeModifier.Phase`、変更するバイオームのビルダーを受け取ります。バイオームへの特定の変更をいつ行うかを整理するため、すべての `BiomeModifier` は `Phase` ごとに 1 回ずつ呼ばれます。

| フェーズ               | 説明                                                              |
|:-------------------:|:-------------------------------------------------------------------------|
| `BEFORE_EVERYTHING` | 標準のフェーズより前に実行する必要があるものすべてを受け持ちます。 |
| `ADD`               | フィーチャーやモブのスポーンなどを追加します。                                        |
| `REMOVE`            | フィーチャーやモブのスポーンなどを削除します。                                      |
| `MODIFY`            | 単一の値( 例: 気候、色 )を変更します。                         |
| `AFTER_EVERYTHING`  | 標準のフェーズより後に実行する必要があるものすべてを受け持ちます。  |

すべての `BiomeModifier` には、その `BiomeModifier` に使う `MapCodec` の ID を参照する `type` キーがあります。`codec` は、モディファイアをエンコード・デコードする `MapCodec` を受け取ります。この `MapCodec` は[静的に登録][staticreg]され、その ID が `BiomeModifier` の `type` として使われます。

```java
public record ExampleBiomeModifier(HolderSet<Biome> biomes, int value) implements BiomeModifier {
    
    @Override
    public void modify(Holder<Biome> biome, Phase phase, ModifiableBiomeInfo.BiomeInfo.Builder builder) {
        if (phase == /* Pick the phase that best matches what your want to modify */) {
            // Modify the 'builder', checking any information about the biome itself
        }
    }

    @Override
    public MapCodec<? extends BiomeModifier> codec() {
        return EXAMPLE_BIOME_MODIFIER.get();
    }
}

// In some registration class
private static final DeferredRegister<MapCodec<? extends BiomeModifier>> BIOME_MODIFIERS =
    DeferredRegister.create(NeoForgeRegistries.Keys.BIOME_MODIFIER_SERIALIZERS, MOD_ID);

public static final Supplier<MapCodec<ExampleBiomeModifier>> EXAMPLE_BIOME_MODIFIER =
    BIOME_MODIFIERS.register("example_biome_modifier", () -> RecordCodecBuilder.mapCodec(instance ->
        instance.group(
            Biome.LIST_CODEC.fieldOf("biomes").forGetter(ExampleBiomeModifier::biomes),
            Codec.INT.fieldOf("value").forGetter(ExampleBiomeModifier::value)
        ).apply(instance, ExampleBiomeModifier::new)
    ));
```


## バイオームモディファイアのデータ生成 {#datagenning-biome-modifiers}

`BiomeModifier` の JSON は、`RegistrySetBuilder` を `DatapackBuiltinEntriesProvider` に渡すことで、[データ生成][datagen]によって作成できます。JSON は `data/<modid>/neoforge/biome_modifier/<path>.json` に置かれます。

`RegistrySetBuilder` と `DatapackBuiltinEntriesProvider` の仕組みについて詳しくは、[Datapack Registry のデータ生成][datapackdatagen]の記事を参照してください。

```java
// Define the ResourceKey for our BiomeModifier.
public static final ResourceKey<BiomeModifier> EXAMPLE_MODIFIER = ResourceKey.create(
    NeoForgeRegistries.Keys.BIOME_MODIFIERS, // The registry this key is for
    ResourceLocation.fromNamespaceAndPath(MOD_ID, "example_modifier") // The registry name
);

// BUILDER is a RegistrySetBuilder passed to DatapackBuiltinEntriesProvider
// in a listener for GatherDataEvent.
BUILDER.add(NeoForgeRegistries.Keys.BIOME_MODIFIERS, bootstrap -> {
    // Lookup any necessary registries.
    // Static registries only need to be looked up if you need to grab the tag data.
    HolderGetter<Biome> biomes = bootstrap.lookup(Registries.BIOME);

    // Register the biome modifiers.
    bootstrap.register(EXAMPLE_MODIFIER,
        new ExampleBiomeModifier(
            biomes.getOrThrow(Tags.Biomes.IS_OVERWORLD),
            20
        )
    );
});
```

これにより、次の JSON が作成されます。

```json5
// In data/examplemod/neoforge/biome_modifier/example_modifier.json
{
    // The registy key of the MapCodec for the modifier
    "type": "examplemod:example_biome_modifier",
    // All additional settings are applied to the root object
    "biomes": "#c:is_overworld",
    "value": 20
}
```

[datareg]: ../concepts/registries.md#datapack-registries
[staticreg]: ../concepts/registries.md#methods-for-registering
[datapacks]: ../resources/index.md#data
[datagen]: ../resources/index.md#data-generation
[datapackdatagen]: ../concepts/registries#data-generation-for-datapack-registries
