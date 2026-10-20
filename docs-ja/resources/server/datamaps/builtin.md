# 組み込みのデータマップ {#built-in-data-maps}

NeoForge は、よくある用途向けに、ハードコードされたバニラのフィールドを置き換えるさまざまな組み込みの[データマップ][datamap]を提供しています。バニラの値は NeoForge のデータマップのファイルとして同梱されているため、プレイヤーにとって機能上の違いはありません。

## `neoforge:compostables`

コンポスターの値を設定できます。`ComposterBlock.COMPOSTABLES`( 現在は無視されます )の代わりとなるものです。このデータマップは `neoforge/data_maps/item/compostables.json` にあり、そのオブジェクトの構造は次のとおりです。

```json5
{
    // A 0 to 1 (inclusive) float representing the chance that the item will update the level of the composter
    "chance": 1,
    // Optional, defaults to false - whether farmer villagers can compost this item
    "can_villager_compost": false
}
```

例:

```json5
{
    "values": {
        // Give acacia logs a 50% chance that they will fill a composter
        "minecraft:acacia_log": {
            "chance": 0.5
        }
    }
}
```

## `neoforge:furnace_fuels`

Item の燃焼時間を設定できます。このデータマップは `neoforge/data_maps/item/furnace_fuels.json` にあり、そのオブジェクトの構造は次のとおりです。

```json5
{
    // A positive integer representing the item's burn time in ticks
    "burn_time": 1000
}
```

例:

```json5
{
    "values": {
        // Give anvils a 2 seconds burn time
        "minecraft:anvil": {
            "burn_time": 40
        }
    }
}
```

:::info
NeoForge はさらに、カスタムの Item でオーバーライドするための `IItemExtension#getBurnTime` メソッドを追加しており、これはこのデータマップより優先されます。`#getBurnTime` は、データマップでは足りない場合、たとえば[データコンポーネント][datacomponent]に応じた燃焼時間などの場合にのみ使ってください。
:::

:::warning
バニラは `#minecraft:logs` と `#minecraft:planks` に 300 tick( 15 秒 )の暗黙の燃焼時間を加え、そこから真紅と歪んだ木の Item を除外する処理をハードコードしています。そのため、燃えない木材を新たに追加する場合は、次のように、その木材の Item をこのマップから除外する記述を追加してください。

```json5
{
    "replace": false,
    "values": [
        // values here
    ],
    "remove": [
        "examplemod:example_nether_wood_planks",
        "#examplemod:example_nether_wood_stems",
        "examplemod:example_nether_wood_door",
        // etc.
        // other removals here
    ]
}
```
:::

## `neoforge:monster_room_mobs`

モンスタールームのスポナーに現れうるモブを設定できます。`MonsterRoomFeature#MOBS`( 現在は無視されます )の代わりとなるものです。このデータマップは `neoforge/data_maps/entity_type/monster_room_mobs.json` にあり、そのオブジェクトの構造は次のとおりです。

```json5
{
    // The weight of this mob, relative to other mobs in the datamap
    "weight": 100
}
```

例:

```json5
{
    "values": {
        // Make squids appear in monster room spawners with a weight of 100
        "minecraft:squid": {
            "weight": 100
        }
    }
}
```

## `neoforge:oxidizables`

酸化の段階を設定できます。`WeatheringCopper#NEXT_BY_BLOCK`( 1.21.2 で無視されるようになります )の代わりとなるものです。このデータマップは、逆向きの酸化除去のマップ( 斧で削るためのもの )を作るのにも使われます。`neoforge/data_maps/block/oxidizables.json` にあり、そのオブジェクトの構造は次のとおりです。

```json5
{
    // The block this block will turn into once oxidized
    "next_oxidation_stage": "examplemod:oxidized_block"
}
```

:::note
カスタムの Block が自然に酸化するには、`WeatheringCopperFullBlock` または `WeatheringCopper` を実装し、`randomTick` で `changeOverTime` を呼び出す必要があります。
:::

例:

```json5
{
    "values": {
        "mymod:custom_copper": {
            // Make a custom copper block oxidize into custom oxidized copper
            "next_oxidation_stage": "mymod:custom_oxidized_copper"
        }
    }
}
```

## `neoforge:parrot_imitations`

オウムがモブの真似をするときに出す音を設定できます。`Parrot#MOB_SOUND_MAP`( 現在は無視されます )の代わりとなるものです。このデータマップは `neoforge/data_maps/entity_type/parrot_imitations.json` にあり、そのオブジェクトの構造は次のとおりです。

```json5
{
    // The ID of the sound that parrots will produce when imitating the mob
    "sound": "minecraft:entity.parrot.imitate.creeper"
}
```

例:

```json5
{
    "values": {
        // Make parrots produce the ambient cave sound when imitating allays
        "minecraft:allay": {
            "sound": "minecraft:ambient.cave"
        }
    }
}
```

## `neoforge:raid_hero_gifts`

襲撃を止めたときに、特定の `VillagerProfession` を持つ村人がくれることのある贈り物を設定できます。`GiveGiftToHero#GIFTS`( 現在は無視されます )の代わりとなるものです。このデータマップは `neoforge/data_maps/villager_profession/raid_hero_gifts.json` にあり、そのオブジェクトの構造は次のとおりです。

```json5
{
    // The ID of the loot table that a villager profession will hand out after a raid
    "loot_table": "minecraft:gameplay/hero_of_the_village/armorer_gift"
}
```

例:

```json5
{
    "values": {
        "minecraft:armorer": {
            // Make armorers give the raid hero the armorer gift loot table
            "loot_table": "minecraft:gameplay/hero_of_the_village/armorer_gift"
        }
    }
}
```

## `neoforge:vibration_frequencies`

ゲームイベントが発するスカルクの振動の周波数を設定できます。`VibrationSystem#VIBRATION_FREQUENCY_FOR_EVENT`( 現在は無視されます )の代わりとなるものです。このデータマップは `neoforge/data_maps/game_event/vibration_frequencies.json` にあり、そのオブジェクトの構造は次のとおりです。

```json5
{
    // An integer between 1 and 15 (inclusive) that indicates the vibration frequency of the event
    "frequency": 2
}
```

例:

```json5
{
    "values": {
        // Make the splash in water game event vibrate on the second frequency
        "minecraft:splash": {
            "frequency": 2
        }
    }
}
```

## `neoforge:villager_types`

バイオームに応じてスポーンする村人の種類を設定できます。`VillagerType#BY_BIOME`( 26.2 で無視されるようになります )の代わりとなるものです。`neoforge/data_maps/worldgen/biome/villager_types.json` にあり、そのオブジェクトの構造は次のとおりです。

```json5
{
    // The villager type that will spawn in this biome
    // If no villager type is specified for a biome, then `minecraft:plains` will be used
    "villager_type": "minecraft:desert"
    
}
```

例:

```json5
{
    "values": {
        // Make villagers in the jungle biome be of the desert type
        "minecraft:jungle": {
            "villager_type": "minecraft:desert"
        }
    }
}
```

## `neoforge:waxables`

Block を錆止めした( ハニカムで右クリックした )ときに変わる先の Block を設定できます。`HoneycombItem#WAXABLES`( 1.21.2 で無視されるようになります )の代わりとなるものです。このデータマップは、逆向きの錆止め除去のマップ( 斧で削るためのもの )を作るのにも使われます。`neoforge/data_maps/block/waxables.json` にあり、そのオブジェクトの構造は次のとおりです。

```json5
{
    // The waxed variant of this block
    "waxed": "minecraft:iron_block"
}
```

例:

```json5
{
    "values": {
        // Make gold blocks turn into iron blocks once waxed
        "minecraft:gold_block": {
            "waxed": "minecraft:iron_block"
        }
    }
}
```

[datacomponent]: ../../../items/datacomponents.md
[datamap]: index.md
