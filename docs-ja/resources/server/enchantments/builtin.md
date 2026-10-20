import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 組み込みのエンチャント効果コンポーネント {#built-in-enchantment-effect-components}

バニラの Minecraft には、[エンチャント][enchantment]の定義で使える、多くの種類のエンチャント効果コンポーネントがあります。この記事では、それぞれの使い方とコード上での定義を含めて説明します。

## 値の効果コンポーネント {#value-effect-components}

_関連項目: Minecraft Wiki の[値の効果コンポーネント][Value Effect Components]_

値の効果コンポーネントは、ゲーム内のどこかの数値を変えるエンチャントに使われ、`EnchantmentValueEffect` クラスで実装されています。ある値が複数の値の効果コンポーネントによって( たとえば複数のエンチャントによって )変更される場合は、そのすべての効果が適用されます。

値の効果コンポーネントでは、与えられた値に対して次のいずれかの演算を使うよう設定できます。
- `minecraft:set`: 指定したレベルに基づく値で上書きします。
- `minecraft:add`: 指定したレベルに基づく値を、元の値に加えます。
- `minecraft:multiply`: 指定したレベルに基づく係数を、元の値に掛けます。
- `minecraft:remove_binomial`: 指定した( レベルに基づく )確率で、二項分布を使って判定します。成功すると、値から 1 を引きます。多くの値は実質的にフラグで、1 で完全にオン、0 で完全にオフになる点に注意してください。
- `minecraft:all_of`: 他の値の効果のリストを受け取り、記述した順に適用します。

ダメージ増加のエンチャントは、その効果を実現するために、値の効果コンポーネントである `minecraft:damage` を次のように使っています。

<Tabs>
<TabItem value="sharpness.json" label="JSON">

```json5
"effects": {
    // The type of this effect component is "minecraft:damage".
    // This means that the effect will modify weapon damage.
    // See below for a list of more effect component types.
    "minecraft:damage": [
        {
            // A value effect that should be applied.
            // In this case, since there's only one, this value effect is just named "effect".
            "effect": {
                // The type of value effect to use. In this case, it is "minecraft:add", so the value (given below) will be added 
                // to the weapon damage value.
                "type": "minecraft:add",

                // The value block. In this case, the value is a LevelBasedValue that starts at 1 and increases by 0.5 every enchantment level.
                "value": {
                    "type": "minecraft:linear",
                    "base": 1.0,
                    "per_level_above_first": 0.5
                }
            }
        }
    ]
}
```

</TabItem>
<TabItem value="sharpness.datagen" label="Datagen">

```java
// Passed into 'effects' in an Enchantment during data generation
// See the Data Generation section of the Enchantments entry to learn more
DataComponentMap.builder().set(
    // Selects the "minecraft:damage" component.
    EnchantmentEffectComponents.DAMAGE,

    // Constructs a list of one conditional AddValue without any requirements.
    List.of(new ConditionalEffect<>(
        new AddValue(LevelBasedValue.perLevel(1.0F, 0.5F)),
        Optional.empty()))
).build()
```

</TabItem>
</Tabs>

`value` ブロック内のオブジェクトは [LevelBasedValue][LevelBasedValue] で、レベルに応じて効果の強さが変わる値の効果コンポーネントにするのに使えます。

`EnchantmentValueEffect#process` メソッドを使うと、指定した数値の演算に基づいて値を調整できます。

```java
// `valueEffect` is an EnchantmentValueEffect instance.
// `enchantLevel` is an integer representing the level of the enchantment
float baseValue = 1.0;
float modifiedValue = valueEffect.process(enchantLevel, server.random, baseValue);
```

### バニラのエンチャントの値の効果コンポーネントのタイプ {#vanilla-enchantment-value-effect-component-types}

#### `DataComponentType<EnchantmentValueEffect>` として定義 {#defined-as-datacomponenttypeenchantmentvalueeffect}

- `minecraft:crossbow_charge_time`: このクロスボウの装填時間( 秒 )を変更します。高速装填で使われています。
- `minecraft:trident_spin_attack_strength`: トライデントの回転攻撃の「強さ」を変更します( `TridentItem#releaseUsing` を参照 )。激流で使われています。

#### `DataComponentType<List<ConditionalEffect<EnchantmentValueEffect>>>` として定義 {#defined-as-datacomponenttypelistconditionaleffectenchantmentvalueeffect}

防具関連:
- `minecraft:armor_effectiveness`: この武器に対する防具の有効性を、0( 防御なし )から 1( 通常の防御 )の尺度で決めます。防具貫通で使われています。
- `minecraft:damage_protection`: ダメージ軽減の「ポイント」1 つごとに、この Item を身に着けている間に受けるダメージを 4% 減らします。軽減は最大 80% までです。爆発耐性、落下耐性、火炎耐性、ダメージ軽減、飛び道具耐性で使われています。

攻撃関連:
- `minecraft:damage`: この武器の攻撃ダメージを変更します。ダメージ増加、水生特効、虫特効、射撃ダメージ増加、アンデッド特効で使われています。
- `minecraft:smash_damage_per_fallen_block`: メイスに、落下したブロック数ごとのダメージを加えます。重量で使われています。
- `minecraft:knockback`: この武器を持っているときに与えるノックバックの量を、ゲーム内の単位で変更します。ノックバックとパンチで使われています。
- `minecraft:mob_experience`: モブを倒したときの経験値の量を変更します。使われていません。

耐久値関連:
- `minecraft:item_damage`: Item が受ける耐久値のダメージを変更します。1 未満の値は、Item がダメージを受ける確率として働きます。耐久力で使われています。
- `minecraft:repair_with_xp`: 経験値の獲得によって Item が自身を修理するようにし、その効率を決めます。修繕で使われています。

飛び道具関連:
- `minecraft:ammo_use`: 弓やクロスボウを撃つときに使う弾薬の数を変更します。値は整数に丸められるため、1 未満の値では弾薬を消費しなくなります。無限で使われています。
- `minecraft:projectile_piercing`: この武器から放たれた飛び道具が貫通するエンティティの数を変更します。貫通で使われています。
- `minecraft:projectile_count`: この弓で撃ったときに出る飛び道具の数を変更します。拡散で使われています。
- `minecraft:projectile_spread`: 撃った方向からの飛び道具の最大の広がりを、度単位で変更します。拡散で使われています。
- `minecraft:trident_return_acceleration`: トライデントが持ち主のもとに戻るようにし、戻るときにトライデントにかかる加速度を変更します。忠誠で使われています。

その他:
- `minecraft:block_experience`: ブロックを壊したときの経験値の量を変更します。シルクタッチで使われています。
- `minecraft:fishing_time_reduction`: この釣り竿で釣りをするときに、浮きが沈むまでの時間を指定した秒数だけ短くします。入れ食いで使われています。
- `minecraft:fishing_luck_bonus`: 釣りのルートテーブルで使われる[幸運][luck]の量を変更します。宝釣りで使われています。

#### `DataComponentType<List<TargetedConditionalEffect<EnchantmentValueEffect>>>` として定義 {#defined-as-datacomponenttypelisttargetedconditionaleffectenchantmentvalueeffect}

- `minecraft:equipment_drops`: この武器で倒したエンティティから装備がドロップする確率を変更します。ドロップ増加で使われています。

## 位置に基づく効果コンポーネント {#location-based-effect-components}

_関連項目: Minecraft Wiki の[位置に基づく効果コンポーネント][Location Based Effect Components]_

位置に基づく効果コンポーネントは、`EnchantmentLocationBasedEffect` を実装するコンポーネントです。これらのコンポーネントは、エンチャントを身に着けている者がレベル内のどこにいるかを知る必要がある動作を定義します。主に 2 つのメソッドで動作します。エンチャントされた Item を装備したときと、身に着けている者の `BlockPos` が変わったときに呼ばれる `EnchantmentEntityEffect#onChangedBlock` と、エンチャントされた Item が外されたときに呼ばれる `onDeactivate` です。

`minecraft:attributes` という位置に基づく効果コンポーネントのタイプを使って、身に着けている者のエンティティの大きさを変える例です。

<Tabs>
<TabItem value="attribute.json" label="JSON">

```json5
// The type is "minecraft:attributes" (described below).
// In a nutshell, this applies an attribute modifier.
"minecraft:attributes": [
    {
        // This "amount" block is a LevelBasedValue.
        "amount": {
            "type": "minecraft:linear",
            "base": 1,
            "per_level_above_first": 1
        },

        // Which attribute to modify. In this case, modifies "minecraft:scale"
        "attribute": "minecraft:generic.scale",
        // The unique identifier for this attribute modifier. Should not overlap with others, but doesn't need to be registered.
        "id": "examplemod:enchantment.size_change",
        // What operation to use on the attribute. Can be "add_value", "add_multiplied_base", or "add_multiplied_total".
        "operation": "add_value"
    }
],
```

</TabItem>
<TabItem value="attribute.datagen" label="Datagen">

```java
// Passed into the effects of an Enchantment during data generation
DataComponentMap.builder().set(
    // Specifies the "minecraft:attributes" component type.
    EnchantmentEffectComponents.ATTRIBUTES,

    // This component takes a list of these EnchantmentAttributeEffect objects.
    List.of(new EnchantmentAttributeEffect(
        ResourceLocation.fromNamespaceAndPath("examplemod", "enchantment.size_change"),
        Attributes.SCALE,
        LevelBasedValue.perLevel(1F, 1F),
        AttributeModifier.Operation.ADD_VALUE
    ))
).build()
```


</TabItem>
</Tabs>

バニラは、次の位置に基づくイベントを追加しています。

- `minecraft:all_of`: エンティティの効果のリストを順に実行します。
- `minecraft:apply_mob_effect`: 対象のモブに[モブ効果][mob effect]を付与します。
- `minecraft:attribute`: エンチャントを身に着けている者に[属性修飾子][attribute modifier]を適用します。
- `minecraft:damage_entity`: 対象のエンティティにダメージを与えます。攻撃の場面では、攻撃ダメージに上乗せされます。
- `minecraft:damage_item`: この Item の耐久値を減らします。
- `minecraft:explode`: 爆発を起こします。
- `minecraft:ignite`: エンティティに火を付けます。
- `minecraft:play_sound`: 指定したサウンドを再生します。
- `minecraft:replace_block`: 指定したオフセットにあるブロックを置き換えます。
- `minecraft:replace_disk`: 円盤状の範囲のブロックを置き換えます。
- `minecraft:run_function`: 指定した [Datapack の関数][datapack function]を実行します。
- `minecraft:set_block_properies`: 指定したブロックのブロックステートのプロパティを変更します。
- `minecraft:spawn_particles`: パーティクルをスポーンさせます。
- `minecraft:summon_entity`: エンティティを召喚します。

### バニラの位置に基づく効果コンポーネントのタイプ {#vanilla-location-based-effect-component-types}

#### `DataComponentType<List<ConditionalEffect<EnchantmentLocationBasedEffect>>>` として定義 {#defined-as-datacomponenttypelistconditionaleffectenchantmentlocationbasedeffect}

- `minecraft:location_changed`: 身に着けている者のブロックの位置が変わったときと、この Item を装備したときに、位置に基づく効果を実行します。氷渡りとソウルスピードで使われています。

#### `DataComponentType<List<EnchantmentAttributeEffect>>` として定義 {#defined-as-datacomponenttypelistenchantmentattributeeffect}

- `minecraft:attributes`: 身に着けている者に属性修飾子を適用し、エンチャントされた Item を装備しなくなったときに取り除きます。

## エンティティの効果コンポーネント {#entity-effect-components}

_関連項目: Minecraft Wiki の[エンティティの効果コンポーネント][Entity Effect Components]_

エンティティの効果コンポーネントは、`EnchantmentLocationBasedEffect` のサブタイプである `EnchantmentEntityEffect` を実装するコンポーネントです。これらは `EnchantmentLocationBasedEffect#onChangedBlock` をオーバーライドし、代わりに `EnchantmentEntityEffect#apply` を実行します。この `apply` メソッドは、コンポーネントの具体的な種類に応じて、コードベースの別の場所からも直接呼ばれます。これにより、身に着けている者のブロックの位置が変わるのを待たずに、効果を発生させられます。

位置に基づく効果コンポーネントのタイプは、すべてエンティティの効果コンポーネントのタイプとしても有効です。ただし、位置に基づく効果コンポーネントとしてのみ登録されている `minecraft:attribute` は例外です。

火属性のエンチャントにある、そのようなコンポーネントの JSON の定義の例です。

<Tabs>
<TabItem value="fire.json" label="JSON">

```json5
// This component's type is "minecraft:post_attack" (see below).
"minecraft:post_attack": [
    {
        // Decides whether the "victim" of the attack, the "attacker", or the "damaging entity" (the projectile if there is one, attacker if not) recieves the effect.
        "affected": "victim",
        
        // Decides which enchantment entity effect to apply.
        "effect": {
            // The type of this effect is "minecraft:ignite".
            "type": "minecraft:ignite",
            // "minecraft:ignite" requires a LevelBasedValue as a duration for how long the entity will be ignited.
            "duration": {
                "type": "minecraft:linear",
                "base": 4.0,
                "per_level_above_first": 4.0
            }
        },

        // Decides who (the "victim", "attacker", or "damaging entity") must have the enchantment for it to take effect.
        "enchanted": "attacker",

        // An optional predicate which controls whether the effect applies.
        "requirements": {
            "condition": "minecraft:damage_source_properties",
            "predicate": {
                "is_direct": true
            }
        }
    }
]
```

</TabItem>
<TabItem value="fire.datagen" label="Datagen">

```java
// Passed into the effects of an Enchantment during data generation
DataComponentMap.builder().set(
    // Specifies the "minecraft:post_attack" component type.
    EnchantmentEffectComponents.POST_ATTACK,

    // Defines the data for this component. In this case, a list of one TargetedConditionalEffect.
    List.of(
        new TargetedConditionalEffect<>(

            // Determines the "enchanted" field.
            EnchantmentTarget.ATTACKER,

            // Determines the "affected" field.
            EnchantmentTarget.VICTIM,

            // The enchantment entity effect.
            new Ignite(LevelBasedValue.perLevel(4.0F, 4.0F)),

            // The "requirements" clause. 
            // In this case, the only optional part activated is the isDirect boolean flag.
            Optional.of(
                new DamageSourceCondition(
                    Optional.of(
                        new DamageSourcePredicate(
                            List.of(),
                            Optional.empty(),
                            Optional.empty(),
                            Optional.of(true)
                        )
                    )
                )
            )
        )
    )
).build()
```

</TabItem>
</Tabs>

ここでは、エンティティの効果コンポーネントは `minecraft:post_attack` です。その効果は `minecraft:ignite` で、`Ignite` という record で実装されています。この record の `EnchantmentEntityEffect#apply` の実装は、対象のエンティティに火を付けます。

### バニラのエンチャントのエンティティの効果コンポーネントのタイプ {#vanilla-enchantment-entity-effect-component-types}

#### `DataComponentType<List<ConditionalEffect<EnchantmentEntityEffect>>>` として定義 {#defined-as-datacomponenttypelistconditionaleffectenchantmententityeffect}

- `minecraft:hit_block`: エンティティ( たとえば飛び道具 )がブロックに当たったときに、エンティティの効果を実行します。召雷で使われています。
- `minecraft:tick`: 毎 tick、エンティティの効果を実行します。ソウルスピードで使われています。
- `minecraft:projectile_spawned`: 弓やクロスボウから飛び道具のエンティティがスポーンした後に、エンティティの効果を実行します。フレイムで使われています。

#### `DataComponentType<List<TargetedConditionalEffect<EnchantmentEntityEffect>>>` として定義 {#defined-as-datacomponenttypelisttargetedconditionaleffectenchantmententityeffect}

- `minecraft:post_attack`: 攻撃がエンティティにダメージを与えた後に、エンティティの効果を実行します。虫特効、召雷、火属性、棘の鎧、ウィンドバーストで使われています。

それぞれの詳細は、[Minecraft Wiki の関連ページ][relevant minecraft wiki page]を参照してください。

## その他のバニラのエンチャントのコンポーネントのタイプ {#other-vanilla-enchantment-component-types}

#### `DataComponentType<List<ConditionalEffect<DamageImmunity>>>` として定義 {#defined-as-datacomponenttypelistconditionaleffectdamageimmunity}

- `minecraft:damage_immunity`: 指定したダメージタイプへの耐性を与えます。氷渡りで使われています。

#### `DataComponentType<Unit>` として定義 {#defined-as-datacomponenttypeunit}

- `minecraft:prevent_equipment_drop`: プレイヤーが死亡したときに、この Item がドロップしないようにします。消滅の呪いで使われています。
- `minecraft:prevent_armor_change`: この Item を防具スロットから外せないようにします。束縛の呪いで使われています。

#### `DataComponentType<List<CrossbowItem.ChargingSounds>>` として定義 {#defined-as-datacomponenttypelistcrossbowitemchargingsounds}

- `minecraft:crossbow_charge_sounds`: クロスボウを装填するときに鳴るサウンドイベントを決めます。各エントリが、エンチャントの 1 レベル分に対応します。

#### `DataComponentType<List<Holder<SoundEvent>>>` として定義 {#defined-as-datacomponenttypelistholdersoundevent}

- `minecraft:trident_sound`: トライデントを使うときに鳴るサウンドイベントを決めます。各エントリが、エンチャントの 1 レベル分に対応します。

[enchantment]: index.md
[Value Effect Components]: https://minecraft.wiki/w/Enchantment_definition#Components_with_value_effects
[Entity Effect Components]: https://minecraft.wiki/w/Enchantment_definition#Components_with_entity_effects
[Location Based Effect Components]: https://minecraft.wiki/w/Enchantment_definition#location_changed
[text component]: /docs/resources/client/i18n.md
[LevelBasedValue]: /docs/resources/server/loottables/#number-provider
[Attribute Effect Component]: https://minecraft.wiki/w/Enchantment_definition#Attribute_effects
[datapack function]: https://minecraft.wiki/w/Function_(Java_Edition)
[luck]: https://minecraft.wiki/w/Luck
[mob effect]: /docs/items/mobeffects/
[attribute modifier]: https://minecraft.wiki/w/Attribute#Modifiers
[relevant minecraft wiki page]: https://minecraft.wiki/w/Enchantment_definition#Components_with_entity_effects