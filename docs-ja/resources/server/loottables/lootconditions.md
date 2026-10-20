# ルート条件 {#loot-conditions}

ルート条件は、現在のコンテキストで[ルートエントリ][entry]や[ルートプール][pool]を使うべきかどうかを判定するために使えます。どちらの場合も条件のリストを定義し、すべての条件を満たした場合にのみ、そのエントリやプールが使われます。データ生成では、目的の条件のインスタンスを渡して `#when` を呼び出すことで、`LootPoolEntryContainer.Builder<?>` または `LootPool.Builder` に条件を追加します。この記事では、利用できるルート条件を紹介します。独自のルート条件を作成する方法については、[カスタムルート条件][custom]を参照してください。

## `minecraft:inverted`

この条件は別の条件を受け取り、その結果を反転させます。必要なルートパラメータは、受け取った条件が必要とするものと同じです。

```json5
{
    "condition": "minecraft:inverted",
    "term": {
        // Some other loot condition.
    }
}
```

データ生成では、反転させたい条件を渡して `InvertedLootItemCondition#invert` を呼び出し、この条件のビルダーを作成します。

## `minecraft:all_of`

この条件は任意の数の他の条件を受け取り、すべての子条件が true を返した場合に true を返します。リストが空の場合は false を返します。必要なルートパラメータは、受け取った条件が必要とするものと同じです。

```json5
{
    "condition": "minecraft:all_of",
    "terms": [
        {
            // A loot condition.
        },
        {
            // Another loot condition.
        },
        {
            // Yet another loot condition.
        }
    ]
}
```

データ生成では、目的の条件を渡して `AllOfCondition#allOf` を呼び出し、この条件のビルダーを作成します。

## `minecraft:any_of`

この条件は任意の数の他の条件を受け取り、少なくとも 1 つの子条件が true を返した場合に true を返します。リストが空の場合は false を返します。必要なルートパラメータは、受け取った条件が必要とするものと同じです。

```json5
{
    "condition": "minecraft:any_of",
    "terms": [
        {
            // A loot condition.
        },
        {
            // Another loot condition.
        },
        {
            // Yet another loot condition.
        }
    ]
}
```

データ生成では、目的の条件を渡して `AnyOfCondition#anyOf` を呼び出し、この条件のビルダーを作成します。

## `minecraft:random_chance`

この条件は、0 から 1 の間の確率を表す[数値プロバイダ][numberprovider]を受け取り、その確率に応じてランダムに true または false を返します。数値プロバイダは、原則として `[0, 1]` の範囲外の値を返さないようにしてください。

```json5
{
    "condition": "minecraft:random_chance",
    // A constant 50% chance for the condition to apply. 
    "chance": 0.5
}
```

データ生成では、数値プロバイダまたは（ 定数の ）float 値を渡して `RandomChance#randomChance` を呼び出し、この条件のビルダーを作成します。

## `minecraft:random_chance_with_enchanted_bonus`

この条件は、エンチャントの ID、[`LevelBasedValue`][numberprovider]、そして定数のフォールバック用 float 値を受け取ります。指定したエンチャントが存在する場合は、`LevelBasedValue` から値を取得します。指定したエンチャントが存在しない場合や、`LevelBasedValue` から値を取得できなかった場合は、定数のフォールバック値が使われます。そのうえでこの条件はランダムに true または false を返し、先に決まった値が true を返す確率になります。`minecraft:attacking_entity` パラメータが必要で、存在しない場合はレベル 0 として扱います。

```json5
{
    "condition": "minecraft:random_chance_with_enchanted_bonus",
    // Add a 20% chance per looting level to succeed.
    "enchantment": "minecraft:looting",
    "enchanted_chance": {
        "type": "linear",
        "base": 0.2,
        "per_level_above_first": 0.2
    },
    // Always fail if the looting enchantment is not present.
    "unenchanted_chance": 0.0
}
```

データ生成では、Registry のルックアップ（ `HolderLookup.Provider` ）、基本値、レベルごとの増加量を渡して `LootItemRandomChanceWithEnchantedBonusCondition#randomChanceAndLootingBoost` を呼び出し、この条件のビルダーを作成します。あるいは、`new LootItemRandomChanceWithEnchantedBonusCondition` を呼び出して、値をさらに細かく指定することもできます。

## `minecraft:value_check`

この条件は[数値プロバイダ][numberprovider]と `IntRange` を受け取り、数値プロバイダの結果がその範囲内であれば true を返します。

```json5
{
    "condition": "minecraft:value_check",
    // May be any number provider.
    "value": {
        "type": "minecraft:uniform",
        "min": 0.0,
        "max": 10.0
    },
    // A range with min/max values.
    "range": {
        "min": 2.0,
        "max": 5.0
    }
}
```

データ生成では、数値プロバイダと範囲を渡して `ValueCheckCondition#hasValue` を呼び出し、この条件のビルダーを作成します。

## `minecraft:time_check`

この条件は、ワールドの時刻が `IntRange` の範囲内にあるかを判定します。任意で `period` パラメータを指定でき、時刻をこの値で割った余りが使われます。たとえば `period` を 24000（ ゲーム内の昼夜 1 サイクルは 24000 tick ）にすると、1 日のうちの時刻を判定できます。

```json5
{
    "condition": "minecraft:time_check",
    // Optional, can be omitted. If omitted, no modulo operation will take place.
    // We use 24000 here, which is the length of one in-game day/night cycle.
    "period": 24000,
    // A range with min/max values. This example checks if the time is between 0 and 12000.
    // Combined with the modulo operand of 24000 specified above, this example checks if it is currently daytime.
    "value": {
        "min": 0,
        "max": 12000
    }
}
```

データ生成では、目的の範囲を渡して `TimeCheck#time` を呼び出し、この条件のビルダーを作成します。そのあと、ビルダーの `#setPeriod` で `period` の値を設定できます。

## `minecraft:weather_check`

この条件は、現在の天気が雨や雷雨であるかを判定します。

```json5
{
    "condition": "minecraft:weather_check",
    // Optional. If unspecified, the rain state will not be checked.
    "raining": true,
    // Optional. If unspecified, the thundering state will not be checked.
    // Specifying "raining": true and "thundering": true is functionally equivalent to just specifying
    // "thundering": true, since it is always raining when a thunderstorm occurs.
    "thundering": false
}
```

データ生成では、`WeatherCheck#weather` を呼び出してこの条件のビルダーを作成します。そのあと、ビルダーの `#setRaining` と `#setThundering` で、それぞれ `raining` と `thundering` の値を設定できます。

## `minecraft:location_check`

この条件は、`LocationPredicate` と、各軸方向の任意のオフセット値を受け取ります。`LocationPredicate` を使うと、位置そのもの、その位置のブロックや流体の状態、その位置のディメンション・バイオーム・構造物、明るさ、空が見えるかどうかなどの条件を判定できます。指定できるすべての値は、`LocationPredicate` クラスの定義で確認できます。`minecraft:origin` ルートパラメータが必要で、このパラメータが存在しない場合は常に失敗します。

```json5
{
    "condition": "minecraft:location_check",
    "predicate": {
        // Succeed if our target is anywhere in the nether.
        "dimension": "the_nether"
    },
    // Optional position offset values. Only relevant if you are checking the position in some way.
    // Must either be provided all at once, or not at all.
    "offsetX": 10,
    "offsetY": 10,
    "offsetZ": 10
}
```

データ生成では、`LocationPredicate` と、任意で `BlockPos` を渡して `LocationCheck#checkLocation` を呼び出し、この条件のビルダーを作成します。

## `minecraft:block_state_property`

この条件は、破壊されたブロックの状態において、指定したブロックステートのプロパティが指定した値になっているかを判定します。`minecraft:block_state` ルートパラメータが必要で、このパラメータが存在しない場合は常に失敗します。

```json5
{
    "condition": "minecraft:block_state_property",
    // The expected block. If this does not match the block that is actually broken, the condition fails.
    "block": "minecraft:oak_slab",
    // The block state properties to match. Unspecified properties can have either value.
    // In this example, we want to only succeed if a top slab - waterlogged or not - is broken.
    // If this specifies properties not present on the block, a log warning will be printed.
    "properties": {
        "type": "top"
    }
}
```

データ生成では、ブロックを渡して `LootItemBlockStatePropertyCondition#hasBlockStateProperties` を呼び出し、この条件のビルダーを作成します。そのあと、ビルダーの `#setProperties` で目的のブロックステートのプロパティの値を設定できます。

## `minecraft:survives_explosion`

この条件は、ドロップをランダムに消滅させます。ドロップが残る確率は 1 / `explosion_radius` ルートパラメータです。これは、ビーコンやドラゴンの卵などごく一部の例外を除き、すべてのブロックのドロップで使われています。`minecraft:explosion_radius` ルートパラメータが必要で、このパラメータが存在しない場合は常に成功します。

```json5
{
    "condition": "minecraft:survives_explosion"
}
```

データ生成では、`ExplosionCondition#survivesExplosion` を呼び出してこの条件のビルダーを作成します。

## `minecraft:match_tool`

この条件は、`tool` ルートパラメータに対して判定される `ItemPredicate` を受け取ります。`ItemPredicate` では、有効なアイテム ID のリスト（ `items` ）、アイテムの個数の最小・最大範囲（ `count` ）、`DataComponentPredicate`（ `components` ）、`ItemSubPredicate`（ `predicates` ）を指定できます。どのフィールドも省略可能です。`minecraft:tool` ルートパラメータが必要で、このパラメータが存在しない場合は常に失敗します。

```json5
{
    "condition": "minecraft:match_tool",
    // Match a netherite pickaxe or axe.
    "predicate": {
        "items": [
            "minecraft:netherite_pickaxe",
            "minecraft:netherite_axe"
        ]
    }
}
```

データ生成では、`ItemPredicate.Builder` を渡して `MatchTool#toolMatches` を呼び出し、この条件のビルダーを作成します。

## `minecraft:enchantment_active`

この条件は、エンチャントが有効かどうかを返します。`minecraft:enchantment_active` ルートパラメータが必要で、このパラメータが存在しない場合は常に失敗します。

```json5
{
    "condition": "minecraft:enchantment_active",
    // Whether the enchantment should be active (true) or not (false).
    "active": true
}
```

データ生成では、`EnchantmentActiveCheck#enchantmentActiveCheck` または `#enchantmentInactiveCheck` を呼び出してこの条件のビルダーを作成します。

## `minecraft:table_bonus`

この条件は `minecraft:random_chance_with_enchanted_bonus` に似ていますが、ランダムな値の代わりに固定値を使います。`minecraft:tool` ルートパラメータが必要で、このパラメータが存在しない場合は常に失敗します。

```json5
{
    "condition": "minecraft:table_bonus",
    // Apply the bonus if the fortune enchantment is present.
    "enchantment": "minecraft:fortune",
    // The chances to use per level. This example has a 20% chance of succeeding if unenchanted,
    // 30% if enchanted at level 1, and 60% if enchanted at level 2 or above.
    "chances": [0.2, 0.3, 0.6]
}
```

データ生成では、エンチャントの ID と確率を渡して `BonusLevelTableCondition#bonusLevelFlatChance` を呼び出し、この条件のビルダーを作成します。

## `minecraft:entity_properties`

この条件は、指定した `EntityPredicate` を[エンティティターゲット][entitytarget]に対して判定します。`EntityPredicate` では、エンティティの種類、ステータス効果、NBT の値、装備、位置などを判定できます。

```json5
{
    "condition": "minecraft:entity_properties",
    // The entity target to use. Valid values are "this", "attacker", "direct_attacker" or "attacking_player".
    // These correspond to the "this_entity", "attacking_entity", "direct_attacking_entity" and
    // "last_damage_player" loot parameters, respectively.
    "entity": "attacker",
    // Only succeed if the target is a pig. The predicate may also be empty, this can be used
    // to check whether the specified entity target is set at all.
    "predicate": {
        "type": "minecraft:pig"
    }
}
```

データ生成では、エンティティターゲットを渡して `LootItemEntityPropertyCondition#entityPresent` を呼び出すか、エンティティターゲットと `EntityPredicate` を渡して `LootItemEntityPropertyCondition#hasProperties` を呼び出し、この条件のビルダーを作成します。

## `minecraft:damage_source_properties`

この条件は、指定した `DamageSourcePredicate` をダメージソースのルートパラメータに対して判定します。`minecraft:origin` と `minecraft:damage_source` のルートパラメータが必要で、これらのパラメータが存在しない場合は常に失敗します。

```json5
{
    "condition": "minecraft:damage_source_properties",
    "predicate": {
        // Check whether the source entity is a zombie.
        "source_entity": {
        "type": "zombie"
        }
    }
}
```

データ生成では、`DamageSourcePredicate.Builder` を渡して `DamageSourceCondition#hasDamageSource` を呼び出し、この条件のビルダーを作成します。

## `minecraft:killed_by_player`

この条件は、プレイヤーによって倒されたかどうかを判定します。ブレイズがドロップするブレイズロッドなど、一部のエンティティのドロップで使われています。`minecraft:last_player_damage` ルートパラメータが必要で、このパラメータが存在しない場合は常に失敗します。

```json5
{
    "condition": "minecraft:killed_by_player"
}
```

データ生成では、`LootItemKilledByPlayerCondition#killedByPlayer` を呼び出してこの条件のビルダーを作成します。

## `minecraft:entity_scores`

この条件は、[エンティティターゲット][entitytarget]のスコアボードを判定します。指定したエンティティターゲットに対応するルートパラメータが必要で、このパラメータが存在しない場合は常に失敗します。

```json5
{
    "condition": "minecraft:entity_scores"
    // The entity target to use. Valid values are "this", "attacker", "direct_attacker" or "attacking_player".
    // These correspond to the "this_entity", "attacking_entity", "direct_attacking_entity" and
    // "last_damage_player" loot parameters, respectively.
    "entity": "attacker",
    // A list of scoreboard values that must be in the given ranges.
    "scores": {
        "score1": {
            "min": 0,
            "max": 100
        },
        "score2": {
            "min": 10,
            "max": 20
        }
    }
}
```

データ生成では、エンティティターゲットを渡して `EntityHasScoreCondition#hasScores` を呼び出し、この条件のビルダーを作成します。そのあと、ビルダーの `#withScore` で必要なスコアを追加します。

## `minecraft:reference`

この条件はプレディケートファイルを参照し、その結果を返します。詳しくは[アイテムプレディケート][predicate]を参照してください。

```json5
{
    "condition": "minecraft:reference",
    // Refers to the predicate file at data/examplemod/predicate/example_predicate.json.
    "name": "examplemod:example_predicate"
}
```

データ生成では、参照するプレディケートファイルの ID を渡して `ConditionReference#conditionReference` を呼び出し、この条件のビルダーを作成します。

## `neoforge:loot_table_id`

この条件は、これを含むルートテーブルの ID が一致する場合にのみ true を返します。通常は[グローバルルートモディファイア][glm]の中で使われます。

```json5
{
    "condition": "neoforge:loot_table_id",
    // Will only apply when the loot table is for dirt
    "loot_table_id": "minecraft:blocks/dirt"
}
```

データ生成では、目的のルートテーブルの ID を渡して `LootTableIdCondition#builder` を呼び出し、この条件のビルダーを作成します。

## `neoforge:can_item_perform_ability`

この条件は、`tool` ルートコンテキストパラメータ（ `LootContextParams.TOOL` ）のアイテム（ 通常はブロックの破壊やエンティティの撃破に使われたアイテム ）が、指定した [`ItemAbility`][itemability] を実行できる場合にのみ true を返します。`minecraft:tool` ルートパラメータが必要で、このパラメータが存在しない場合は常に失敗します。

```json5
{
    "condition": "neoforge:can_item_perform_ability",
    // Will only apply if the tool can strip a log like an axe
    "ability": "axe_strip"
}
```

データ生成では、目的のアイテムアビリティの ID を渡して `CanItemPerformAbility#canItemPerformAbility` を呼び出し、この条件のビルダーを作成します。

## 関連項目 {#see-also}

- [Minecraft Wiki][mcwiki] の[アイテムプレディケート][predicatejson]

[custom]: custom.md#custom-loot-conditions
[entitytarget]: index.md#entity-targets
[entry]: index.md#loot-entry
[glm]: glm.md
[itemability]: ../../../items/tools.md#itemabilitys
[mcwiki]: https://minecraft.wiki
[numberprovider]: index.md#number-provider
[pool]: index.md#loot-pool
[predicate]: https://minecraft.wiki/w/Predicate
[predicatejson]: https://minecraft.wiki/w/Predicate#JSON_format
[registry]: ../../../concepts/registries.md
