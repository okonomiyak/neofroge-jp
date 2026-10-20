# ルート関数 {#loot-functions}

ルート関数は、[ルートエントリ][entry]の結果や、[ルートプール][pool]・[ルートテーブル][table]の複数の結果を変更するために使えます。どちらの場合も関数のリストを定義し、順番に実行されます。データ生成では、`#apply` を呼び出すことで、`LootPoolSingletonContainer.Builder<?>`、`LootPool.Builder`、`LootTable.Builder` にルート関数を適用できます。この記事では、利用できるルート関数を紹介します。独自のルート関数を作成する方法については、[カスタムのルート関数][custom]を参照してください。

:::note
ルート関数は、複合ルートエントリ（ `CompositeEntryBase` のサブクラスと、それに対応するビルダークラス ）には適用できません。単一エントリのそれぞれに手動で追加する必要があります。
:::

`minecraft:sequence` を除くすべてのバニラのルート関数では、`conditions` ブロックで[ルート条件][conditions]を指定できます。これらの条件のいずれかを満たさない場合、その関数は適用されません。コード上では、これは `LootItemConditionalFunction` によって制御されており、`SequenceFunction` を除くすべてのルート関数がこのクラスを継承しています。

## `minecraft:set_item`

結果のアイテムスタックで使う Item を別のものに設定します。

```json5
{
    "function": "minecraft:set_item",
    // The item to use.
    "item": "minecraft:dirt"
}
```

現在、データ生成でこの関数を作成することはできません。

## `minecraft:set_count`

結果のアイテムスタックのアイテム数を設定します。[数値プロバイダ][numberprovider]を使います。

```json5
{
    "function": "minecraft:set_count",
    // The count to use.
    "count": {
        "type": "minecraft:uniform",
        "min": 1,
        "max": 3
    },
    // Whether to add to the existing value instead of setting it. Optional, defaults to false.
    "add": true
}
```

データ生成では、目的の数値プロバイダと、任意で `add` の真偽値を渡して `SetItemCountFunction#setCount` を呼び出し、この関数のビルダーを作成します。

## `minecraft:explosion_decay`

爆発による減少を適用します。アイテムは 1 / `explosion_radius` の確率で「生き残り」ます。これはアイテム数に応じて複数回実行されます。`minecraft:explosion_radius` ルートパラメータが必要で、このパラメータが存在しない場合は何も変更されません。

```json5
{
    "function": "minecraft:explosion_decay"
}
```

データ生成では、`ApplyExplosionDecay#explosionDecay` を呼び出し、この関数のビルダーを作成します。

## `minecraft:limit_count`

アイテムスタックのアイテム数を、指定した `IntRange` の範囲内に収めます。

```json5
{
    "function": "minecraft:limit_count",
    // The limit to use. Can have a min, a max, or both.
    "limit": {
        "max": 32
    }
}
```

データ生成では、目的の `IntRange` を渡して `LimitCount#limitCount` を呼び出し、この関数のビルダーを作成します。

## `minecraft:set_custom_data`

アイテムスタックにカスタム NBT データを設定します。

```json5
{
    "function": "minecraft:set_custom_data",
    "tag": {
        "exampleproperty": 0
    }
}
```

データ生成では、目的の [`CompoundTag`][nbt] を渡して `SetCustomDataFunction#setCustomData` を呼び出し、この関数のビルダーを作成します。

:::warning
この関数は、基本的に非推奨と考えてください。代わりに `minecraft:set_components` を使ってください。
:::

## `minecraft:copy_custom_data`

BlockEntity またはエンティティのソースから、アイテムスタックにカスタム NBT データをコピーします。BlockEntity に対してこれを使うことは推奨されません。代わりに `minecraft:copy_components` か `minecraft:set_contents` を使ってください。エンティティの場合は、[エンティティの対象][entitytarget]を指定する必要があります。指定したソース（ エンティティの対象または BlockEntity ）に対応するルートパラメータが必要で、このパラメータが存在しない場合は何も変更されません。

```json5
{
    "function": "minecraft:copy_custom_data",
    // The source to use. Valid values are either an entity target, "block_entity" to use the loot context's
    // block entity parameter, or be "storage" for command storage. If this is "storage", it can instead be a
    // JSON object that additionally specify the command storage path to be used.
    "source": "this",
    // Example for using "storage".
    "source": {
        "type": "storage",
        "source": "examplepath"
    },
    // The copy operation(s).
    "ops": [
        {
            // The source and target paths. In this example, we copy from "src" in the source to "dest" in the target.
            "source": "src",
            "target": "dest",
            // A merging strategy. Valid values are "replace", "append", and "merge".
            "op": "merge"
        }
    ]
}
```

データ生成では、目的のソースとターゲットの値、そしてマージ戦略（ 任意。デフォルトは `replace` ）を渡して `CopyCustomDataFunction#copy` を呼び出し、この関数のビルダーを作成します。

## `minecraft:set_components`

アイテムスタックに[データコンポーネント][datacomponent]の値を設定します。バニラのほとんどの用途には専用の関数があり、それらは以下で説明します。

```json5
{
    "function": "minecraft:set_components",
    // Any component can be used. In this example, we set the dyed color of the item to red.
    "components": {
        "dyed_color": {
            "rgb": 16711680
        }
    }
}
```

データ生成では、目的のデータコンポーネントと値を渡して `SetComponentsFunction#setComponent` を呼び出し、この関数のビルダーを作成します。

## `minecraft:copy_components`

BlockEntity からアイテムスタックに[データコンポーネント][datacomponent]の値をコピーします。`minecraft:block_entity` ルートパラメータが必要で、このパラメータが存在しない場合は何も変更されません。

```json5
{
    "function": "minecraft:copy_components",
    // The system is designed to allow multiple sources, however for now, there are only block entities available.
    "source": "block_entity",
    // By default, all components are copied. The "exclude" list allows excluding certain components, and the
    // "include" list allows explicitly re-including components. Both fields are optional.
    "exclude": [],
    "include": []
}
```

データ生成では、目的のデータソース（ 通常は `CopyComponentsFunction.Source.BLOCK_ENTITY` ）を渡して `CopyComponentsFunction#copyComponents` を呼び出し、この関数のビルダーを作成します。

## `minecraft:copy_state`

ブロックステートのプロパティを、アイテムスタックの `block_state` [データコンポーネント][datacomponent]にコピーします。これは Block を設置しようとするときに使われます。コピーするブロックステートのプロパティは明示的に指定する必要があります。`minecraft:block_state` ルートパラメータが必要で、このパラメータが存在しない場合は何も変更されません。

```json5
{
    "function": "minecraft:copy_state",
    // The expected block. If this does not match the block that is actually broken, the function does not run.
    "block": "minecraft:oak_slab",
    // The block state properties to save.
    "properties": {
        "type": "top"
    }
}
```

データ生成では、Block を渡して `CopyBlockState#copyState` を呼び出し、ビルダーを作成します。そのあと、ビルダーの `#copy` で目的のブロックステートのプロパティの値を設定できます。

## `minecraft:set_contents`

アイテムスタックの中身を設定します。

```json5
{
    "function": "minecraft:set_contents",
    // The contents component to use. Valid values are "container", "bundle_contents" and "charged_projectiles".
    "component": "container",
    // A list of loot entries to add to the contents.
    "entries": [
        {
            "type": "minecraft:empty",
            "weight": 3
        },
        {
            "type": "minecraft:item",
            "item": "minecraft:arrow"
        }
    ]
}
```

データ生成では、目的の中身のコンポーネントを渡して `SetContainerContents#setContents` を呼び出し、この関数のビルダーを作成します。そのあと、ビルダーの `#withEntry` を呼び出してエントリを追加します。

## `minecraft:modify_contents`

アイテムスタックの中身に関数を適用します。

```json5
{
    "function": "minecraft:modify_contents",
    // The contents component to use. Valid values are "container", "bundle_contents" and "charged_projectiles".
    "component": "container",
    // The function to use.
    "modifier": "apply_explosion_decay"
}
```

現在、データ生成でこの関数を作成することはできません。

## `minecraft:set_loot_table`

結果のアイテムスタックに、コンテナのルートテーブルを設定します。チェストなど、設置したときにこのプロパティを保持するルートコンテナを想定しています。

```json5
{
    "function": "minecraft:set_loot_table",
    // The id of the loot table to use.
    "name": "minecraft:entities/enderman",
    // The id of the block entity type of the target block entity.
    "type": "minecraft:chest",
    // The random seed for generating loot tables. Optional, defaults to 0.
    "seed": 42
}
```

データ生成では、目的の BlockEntity タイプ、ルートテーブルのリソースキー、任意でシード値を渡して `SetContainerLootTable#withLootTable` を呼び出し、この関数のビルダーを作成します。

## `minecraft:set_name`

結果のアイテムスタックに名前を設定します。名前には、文字列リテラルの代わりに [`Component`][component] を使えます。また、[エンティティの対象][entitytarget]から名前を解決することもできます。該当する場合は対応するエンティティのルートパラメータが必要で、このパラメータが存在しない場合は何も変更されません。

```json5
{
    "function": "minecraft:set_name",
    "name": "Funny Item",
    // The entity target to use.
    "entity": "this",
    // Whether to set the custom name ("custom_name") or the item name ("item_name") itself.
    // Custom name are displayed in italics and can be changed in an anvil, while item names cannot.
    "target": "custom_name"
}
```

データ生成では、目的の名前のコンポーネント、目的の名前のターゲット、任意でエンティティの対象を渡して `SetNameFunction#setName` を呼び出し、この関数のビルダーを作成します。

## `minecraft:copy_name`

[エンティティの対象][entitytarget]または BlockEntity の名前を、結果のアイテムスタックにコピーします。指定したソース（ エンティティの対象または BlockEntity ）に対応するルートパラメータが必要で、このパラメータが存在しない場合は何も変更されません。

```json5
{
    "function": "minecraft:copy_name",
    // The entity target, or "block_entity" if a block entity's name should be copied.
    "source": "this"
}
```

データ生成では、目的のエンティティのソースを渡して `CopyNameFunction#copyName` を呼び出し、この関数のビルダーを作成します。

## `minecraft:set_lore`

結果のアイテムスタックに説明文（ ツールチップの行 ）を設定します。各行には、文字列リテラルの代わりに [`Component`][component] を使えます。また、[エンティティの対象][entitytarget]から解決することもできます。該当する場合は対応するエンティティのルートパラメータが必要で、このパラメータが存在しない場合は何も変更されません。

```json5
{
    "function": "minecraft:set_lore",
    "lore": [
        "Funny Lore",
        "Funny Lore 2"
    ],
    // The merging mode used. Valid values are:
    // - "append": Appends the entries to any existing lore entries.
    // - "insert": Inserts the entries at a certain position. The position is denoted as an additional field
    //   named "offset". "offset" is optional and defaults to 0.
    // - "replace_all": Removes all previous entries and then appends the entries.
    // - "replace_section": Removes a section of entries and then adds the entries at that position.
    //   The section removed is denoted through the "offset" and optional "size" fields.
    //   If "size" is omitted, the amount of lines in "lore" is used.
    "mode": {
        "type": "insert",
        "offset": 0
    },
    // The entity target to use.
    "entity": "this"
}
```

データ生成では、`SetLoreFunction#setLore` を呼び出し、この関数のビルダーを作成します。そのあと、必要に応じてビルダーの `#addLine`、`#setMode`、`#setResolutionContext` を呼び出します。

## `minecraft:toggle_tooltips`

特定のコンポーネントのツールチップを有効または無効にします。

```json5
{
    "function": "minecraft:toggle_tooltips",
    "toggles": {
        // All values are optional. If omitted, these values will use pre-existing values on the stack.
        // The pre-existing values are generally true, unless they have already been modified by another function.
        "minecraft:attribute_modifiers": false,
        "minecraft:can_break": false,
        "minecraft:can_place_on": false,
        "minecraft:dyed_color": false,
        "minecraft:enchantments": false,
        "minecraft:jukebox_playable": false,
        "minecraft:stored_enchantments": false,
        "minecraft:trim": false,
        "minecraft:unbreakable": false
    }
}
```

現在、データ生成でこの関数を作成することはできません。

## `minecraft:enchant_with_levels`

指定したレベル数で、アイテムスタックにランダムにエンチャントを付けます。[数値プロバイダ][numberprovider]を使います。

```json5
    {
    "function": "minecraft:enchant_with_levels",
    // The amount of levels to use.
    "levels": {
        "type": "minecraft:uniform",
        "min": 10,
        "max": 30
    },
    // A list of possible enchantments. Optional, defaults to all applicable enchantments for the item.
    "options": [
        "minecraft:sharpness",
        "minecraft:fire_aspect"
    ]
}
```

データ生成では、目的の数値プロバイダを渡して `EnchantWithLevelsFunction#enchantWithLevels` を呼び出し、この関数のビルダーを作成します。そのあと、必要であればビルダーの `#fromOptions` でエンチャントのリストを設定します。

## `minecraft:enchant_randomly`

アイテムにランダムなエンチャントを 1 つ付けます。

```json5
{
    "function": "minecraft:enchant_randomly",
    // A list of possible enchantments. Optional, defaults to all enchantments.
    "options": [
        "minecraft:sharpness",
        "minecraft:fire_aspect"
    ]
    // Whether to only allow compatible enchantments, or any enchantments. Optional, defaults to true.
    "only_compatible": true
}
```

データ生成では、`EnchantRandomlyFunction#randomEnchantment` または `EnchantRandomlyFunction#randomApplicableEnchantment` を呼び出し、この関数のビルダーを作成します。そのあと、必要であればビルダーの `#withEnchantment` または `#withOneOf` を呼び出します。

## `minecraft:set_enchantments`

結果のアイテムスタックにエンチャントを設定します。

```json5
{
    "function": "minecraft:set_enchantments",
    // A map of enchantments to number providers.
    "enchantments": {
        "minecraft:fire_aspect": 2,
        "minecraft:sharpness": {
        "type": "minecraft:uniform",
        "min": 3,
        "max": 5,
        }
    },
    // Whether to add enchantment levels to existing levels instead of overwriting them. Optional, defaults to false.
    "add": true
}
```

データ生成では、`add` の真偽値（ 任意 ）を渡して `new SetEnchantmentsFunction.Builder` を呼び出し、この関数のビルダーを作成します。そのあと、`#withEnchantment` を呼び出して、設定するエンチャントを追加します。

## `minecraft:enchanted_count_increase`

エンチャントの値に基づいて、アイテムスタックのアイテム数を増やします。[数値プロバイダ][numberprovider]を使います。`minecraft:attacking_entity` ルートパラメータが必要で、このパラメータが存在しない場合は何も変更されません。

```json5
{
    "function": "minecraft:enchanted_count_increase",
    // The enchantment to use.
    "enchantment": "minecraft:fortune",
    // The increase count per level. The number provider is rolled once per function, not once per level.
    "count": {
        "type": "minecraft:uniform",
        "min": 1,
        "max": 3
    },
    // The stack size limit, which will not be exceeded no matter the enchantment level. Optional.
    "limit": 5
}
```

データ生成では、目的の数値プロバイダを渡して `EnchantedCountIncreaseFunction#lootingMultiplier` を呼び出し、この関数のビルダーを作成します。必要であれば、そのあとビルダーの `#setLimit` を呼び出します。

## `minecraft:apply_bonus`

エンチャントの値とさまざまな計算式に基づいて、アイテムスタックのアイテム数を増やします。`minecraft:tool` ルートパラメータが必要で、このパラメータが存在しない場合は何も変更されません。

```json5
{
    "function": "minecraft:apply_bonus",
    // The enchantment value to query.
    "enchantment": "minecraft:fortune",
    // The formula to use. Valid values are:
    // - "minecraft:binomial_with_bonus_count": Applies a bonus based on a binomial distribution with
    //   n = enchantment level + extra and p = probability.
    // - "minecraft:ore_drops": Applies a bonus based on a special formula for ore drops, including randomness.
    // - "minecraft:uniform_bonus_count": Adds a bonus based on the enchantment level scaled by a constant multiplier.
    "formula": "ore_drops",
    // The parameter values, depending on the formula.
    // If the formula is "minecraft:binomial_with_bonus_count", requires "extra" and "probability".
    // If the formula is "minecraft:ore_drops", requires no parameters.
    // If the formula is "minecraft:uniform_bonus_count", requires "bonusMultiplier".
    "parameters": {}
}
```

データ生成では、エンチャントと、その他の必要なパラメータ（ 計算式によって異なります ）を渡して `ApplyBonusCount#addBonusBinomialDistributionCount`、`ApplyBonusCount#addOreBonusCount`、または `ApplyBonusCount#addUniformBonusCount` を呼び出し、この関数のビルダーを作成します。

## `minecraft:furnace_smelt`

かまどに入れた場合と同じようにアイテムの精錬を試みます。精錬できなかった場合は、変更されていないアイテムスタックを返します。

```json5
{
    "function": "minecraft:furnace_smelt"
}
```

データ生成では、`SmeltItemFunction#smelted` を呼び出し、この関数のビルダーを作成します。

## `minecraft:set_damage`

結果のアイテムスタックに耐久値のダメージを設定します。[数値プロバイダ][numberprovider]を使います。

```json5
{
    "function": "minecraft:set_damage",
    // The damage to set.
    "damage": {
        "type": "minecraft:uniform",
        "min": 10,
        "max": 300
    },
    // Whether to add to the existing damage instead of setting it. Optional, defaults to false.
    "add": true
}
```

データ生成では、目的の数値プロバイダと、任意で `add` の真偽値を渡して `SetItemDamageFunction#setDamage` を呼び出し、この関数のビルダーを作成します。

## `minecraft:set_attributes`

結果のアイテムスタックに、属性修飾子のリストを追加します。

```json5
{
    "function": "minecraft:set_attributes",
    // A list of attribute modifiers.
    "modifiers": [
        {
        // The resource location id of the modifier. Should be prefixed by your mod id.
        "id": "examplemod:example_modifier",
        // The id of the attribute the modifier is for.
        "attribute": "minecraft:generic.attack_damage",
        // The attribute modifier operation.
        // Valid values are "add_value", "add_multiplied_base" and "add_multiplied_total". 
        "operation": "add_value",
        // The amount of the modifier. This can also be a number provider.
        "amount": 5,
        // The slot(s) the modifier applies for. Valid values are "any" (any inventory slot),
        // "mainhand", "offhand", "hand", (mainhand/offhand/both hands),
        // "feet", "legs", "chest", "head", "armor" (boots/leggings/chestplates/helmets/any armor slots)
        // and "body" (horse armor and similar slots).
        "slot": "armor"
        }
    ],
    // Whether to replace the existing values instead of adding to them. Optional, defaults to true.
    "replace": false
}
```

データ生成では、`SetAttributesFunction#setAttributes` を呼び出し、この関数のビルダーを作成します。そのあと、ビルダーの `#withModifier` で修飾子を追加します。修飾子を取得するには `SetAttributesFunction#modifier` を使います。

## `minecraft:set_potion`

結果のアイテムスタックにポーションを設定します。

```json5
{
    "function": "minecraft:set_potion",
    // The id of the potion.
    "id": "minecraft:strength"
}
```

データ生成では、目的のポーションを渡して `SetPotionFunction#setPotion` を呼び出し、この関数のビルダーを作成します。

## `minecraft:set_stew_effect`

結果のアイテムスタックに、シチューの効果のリストを設定します。

```json5
{
    "function": "minecraft:set_stew_effect",
    // The effects to set.
    "effects": [
        {
        // The effect id.
        "type": "minecraft:fire_resistance",
        // The effect duration, in ticks. This can also be a number provider.
        "duration": 100
        }
    ]
}
```

データ生成では、`SetStewEffectFunction#stewEffect` を呼び出し、この関数のビルダーを作成します。そのあと、ビルダーの `#withModifier` を呼び出します。

## `minecraft:set_ominous_bottle_amplifier`

結果のアイテムスタックに、不吉な瓶の増幅値を設定します。[数値プロバイダ][numberprovider]を使います。

```json5
{
    "function": "minecraft:set_ominous_bottle_amplifier",
    // The amplifier to use.
    "amplifier": {
        "type": "minecraft:uniform",
        "min": 1,
        "max": 3
    }
}
```

データ生成では、目的の数値プロバイダを渡して `SetOminousBottleAmplifierFunction#amplifier` を呼び出し、この関数のビルダーを作成します。

## `minecraft:exploration_map`

結果のアイテムスタックが地図である場合に限り、それを探検家の地図に変換します。`minecraft:origin` ルートパラメータが必要で、このパラメータが存在しない場合は何も変更されません。

```json5
{
    "function": "minecraft:exploration_map",
    // A structure tag, containing the structures an exploration map can lead to.
    // Optional, defaults to "minecraft:on_treasure_maps", which only contains buried treasures by default.
    "destination": "minecraft:eye_of_ender_located",
    // The map decoration type to use. See the MapDecorationTypes class for available values.
    // Optional, defaults to "minecraft:mansion".
    "decoration": "minecraft:target_x",
    // The zoom level to use. Optional, defaults to 2.
    "zoom": 4,
    // The search radius to use. Optional, defaults to 50.
    "search_radius": 25,
    // Whether existing chunks are skipped when searching for structures. Optional, defaults to true.
    "skip_existing_chunks": true
}
```

データ生成では、`ExplorationMapFunction#makeExplorationMap` を呼び出し、この関数のビルダーを作成します。そのあと、必要に応じてビルダーの各種セッターを呼び出します。

## `minecraft:fill_player_head`

指定した[エンティティの対象][entitytarget]に基づいて、結果のアイテムスタックにプレイヤーの頭の持ち主を設定します。対応するルートパラメータが必要で、このパラメータが存在しない場合は何も変更されません。

```json5
{
    "function": "minecraft:fill_player_head",
    // The entity target to use. If this doesn't resolve to a player, the stack is not modified.
    "entity": "this_entity"
}
```

データ生成では、目的のエンティティの対象を渡して `FillPlayerHead#fillPlayerHead` を呼び出し、この関数のビルダーを作成します。

## `minecraft:set_banner_pattern`

結果のアイテムスタックに旗の模様を設定します。これは旗に対するもので、旗の模様のアイテムに対するものではありません。

```json5
{
    "function": "minecraft:set_banner_patterns",
    // A list of banner pattern layers.
    "patterns": [
        {
            // The id of the banner pattern to use.
            "pattern": "minecraft:globe",
            // The dye color of the layer.
            "color": "light_blue"
        }
    ],
    // Whether to append to the existing layers instead of replacing them.
    "append": true
}
```

データ生成では、`append` の真偽値を渡して `SetBannerPatternFunction#setBannerPattern` を呼び出し、この関数のビルダーを作成します。そのあと、`#addPattern` を呼び出して関数に模様を追加します。

## `minecraft:set_instrument`

結果のアイテムスタックに楽器のタグを設定します。

```json5
{
    "function": "minecraft:set_instrument",
    // The instrument tag to use.
    "options": "minecraft:goat_horns"
}
```

データ生成では、目的の楽器のタグを渡して `SetInstrumentFunction#setInstrumentOptions` を呼び出し、この関数のビルダーを作成します。

## `minecraft:set_fireworks`

```json5
{
    "function": "minecraft:set_fireworks",
    // The explosions to use. Optional, uses the existing data component value if absent.
    "explosions": [
        {
            // The firework explosion shape to use. Valid vanilla values are "small_ball", "large_ball",
            // "star", "creeper" and "burst". Optional, defaults to "small_ball".
            "shape": "star",
            // The colors to use. Optional, defaults to an empty list.
            "colors": [
                16711680,
                65280
            ],
            // The fade colors to use. Optional, defaults to an empty list.
            "fade_colors": [
                65280,
                255
            ],
            // Whether the explosion has a trail. Optional, defaults to false.
            "has_trail": true,
            // Whether the explosion has a twinkle. Optional, defaults to false.
            "has_twinkle": true
        }
    ],
    // The flight duration of the fireworks. Optional, uses the existing data component value if absent.
    "flight_duration": 5
}
```

現在、データ生成でこの関数を作成することはできません。

## `minecraft:set_firework_explosion`

結果のアイテムスタックに花火の星の爆発を設定します。

```json5
{
    "function": "minecraft:set_firework_explosion",
    // The firework explosion shape to use. Valid vanilla values are "small_ball", "large_ball",
    // "star", "creeper" and "burst". Optional, defaults to "small_ball".
    "shape": "star",
    // The colors to use. Optional, defaults to an empty list.
    "colors": [
        16711680,
        65280
    ],
    // The fade colors to use. Optional, defaults to an empty list.
    "fade_colors": [
        65280,
        255
    ],
    // Whether the explosion has a trail. Optional, defaults to false.
    "has_trail": true,
    // Whether the explosion has a twinkle. Optional, defaults to false.
    "has_twinkle": true
}
```

データ生成では、目的の数値プロバイダと、任意で `add` の真偽値を渡して `SetItemCountFunction#setCount` を呼び出し、この関数のビルダーを作成します。( 訳注: この一文は上記 minecraft:set_count の説明と同じ文で、原文の誤記と思われます )

## `minecraft:set_book_cover`

記入済みの本の、ページに依存しない内容を設定します。

```json5
{
    "function": "minecraft:set_book_cover",
    // The book title. Optional, if absent, the book title remains unchanged.
    "title": "Hello World!",
    // The book author. Optional, if absent, the book author remains unchanged.
    "author": "Steve",
    // The book generation, i.e. how often it has been copied. Clamped between 0 and 3.
    // Optional, if absent, the book generation remains unchanged.
    "generation": 2
}
```

データ生成では、目的のパラメータを渡して `new SetBookCoverFunction` を呼び出し、この関数のビルダーを作成します。

## `minecraft:set_written_book_pages`

記入済みの本のページを設定します。

```json5
{
    "function": "minecraft:set_written_book_pages",
    // The pages to set, as a list of strings.
    "pages": [
        "Hello World!",
        "Hello World on page 2!",
        "Never Gonna Give You Up!"
    ],
    // The merging mode used. Valid values are:
    // - "append": Appends the entries to any existing lore entries.
    // - "insert": Inserts the entries at a certain position. The position is denoted as an additional field
    //   named "offset". "offset" is optional and defaults to 0.
    // - "replace_all": Removes all previous entries and then appends the entries.
    // - "replace_section": Removes a section of entries and then adds the entries at that position.
    //   The section removed is denoted through the "offset" and optional "size" fields.
    //   If "size" is omitted, the amount of lines in "lore" is used.
    "mode": {
        "type": "insert",
        "offset": 0
    }
}
```

現在、データ生成でこの関数を作成することはできません。

## `minecraft:set_writable_book_pages`

書きかけの本（ 本と羽根ペン ）のページを設定します。

```json5
{
    "function": "minecraft:set_writable_book_pages",
    // The pages to set, as a list of strings.
    "pages": [
        "Hello World!",
        "Hello World on page 2!",
        "Never Gonna Give You Up!"
    ],
    // The merging mode used. Valid values are:
    // - "append": Appends the entries to any existing lore entries.
    // - "insert": Inserts the entries at a certain position. The position is denoted as an additional field
    //   named "offset". "offset" is optional and defaults to 0.
    // - "replace_all": Removes all previous entries and then appends the entries.
    // - "replace_section": Removes a section of entries and then adds the entries at that position.
    //   The section removed is denoted through the "offset" and optional "size" fields.
    //   If "size" is omitted, the amount of lines in "lore" is used.
    "mode": {
        "type": "insert",
        "offset": 0
    }
}
```

現在、データ生成でこの関数を作成することはできません。

## `minecraft:set_custom_model_data`

結果のアイテムスタックのカスタムモデルデータを設定します。

```json5
{
    "function": "minecraft:set_custom_model_data",
    // The custom model data value to use. This can also be a number provider.
    "value": 4
}
```

現在、データ生成でこの関数を作成することはできません。

## `minecraft:filtered`

この関数は、`tool` ルートパラメータに対して判定される `ItemPredicate` を受け取り、判定に成功した場合はもう一方の関数を実行します。`ItemPredicate` では、有効なアイテム ID のリスト（ `items` ）、アイテムの個数の最小・最大範囲（ `count` ）、`DataComponentPredicate`（ `components` ）、`ItemSubPredicate`（ `predicates` ）を指定できます。どのフィールドも省略可能です。`minecraft:tool` ルートパラメータが必要で、このパラメータが存在しない場合は常に失敗します。

```json5
{
    "function": "minecraft:filtered",
    // The custom model data value to use. This can also be a number provider.
    "item_filter": {
        "items": [
            "minecraft:diamond_shovel"
        ]
    },
    // The other loot function to run, as either a loot modifier file or an in-line list of functions.
    "modifier": "examplemod:example_modifier"
}
```

現在、データ生成でこの関数を作成することはできません。

:::warning
この関数は、基本的に非推奨と考えてください。代わりに、渡している関数を `minecraft:match_tool` 条件と組み合わせて使ってください。
:::

## `minecraft:reference`

この関数はアイテムモディファイアを参照し、それを結果のアイテムスタックに適用します。詳しくは[アイテムモディファイア][itemmodifiers]を参照してください。

```json5
{
    "function": "minecraft:reference",
    // Refers to the item modifier file at data/examplemod/item_modifier/example_modifier.json.
    "name": "examplemod:example_modifier"
}
```

データ生成では、参照するプレディケートファイルの ID を渡して `FunctionReference#functionReference` を呼び出し、この関数のビルダーを作成します。

## `minecraft:sequence`

この関数は、他のルート関数を順番に実行します。

```json5
{
    "function": "minecraft:sequence",
    // A list of functions to run.
    "functions": [
        {
            "function": "minecraft:set_count",
            // ...
        },
        {
            "function": "minecraft:explosion_decay"
        }
    ],
}
```

データ生成では、他の関数を渡して `SequenceFunction#of` を呼び出し、ビルダーを作成します。

## 関連項目 {#see-also}

- [Minecraft Wiki][mcwiki] の[アイテムモディファイア][itemmodifiers]

[component]: ../../client/i18n.md#components
[conditions]: lootconditions
[custom]: custom.md#custom-loot-functions
[datacomponent]: ../../../items/datacomponents.md
[entitytarget]: index.md#entity-targets
[entry]: index.md#loot-entry
[itemmodifiers]: https://minecraft.wiki/w/Item_modifier#JSON_format
[mcwiki]: https://minecraft.wiki
[nbt]: ../../../datastorage/nbt.md
[numberprovider]: index.md#number-provider
[pool]: index.md#loot-pool
[table]: index.md#loot-table
