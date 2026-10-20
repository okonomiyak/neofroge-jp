---
sidebar_position: 3
---
# 道具と防具 {#tools--armor}

道具は、主に [Block][block] を壊すために使う [Item][item] です。多くの Mod が、新しい道具のセット(たとえば銅の道具)や、新しい種類の道具(たとえばハンマー)を追加しています。

## カスタムの道具セット {#custom-tool-sets}

道具のセットは、通常ツルハシ、斧、シャベル、クワ、剣の 5 つの Item からなります(剣は従来の意味での道具ではありませんが、一貫性のためここに含めています)。これらの Item には、それぞれ対応するクラス `PickaxeItem`、`AxeItem`、`ShovelItem`、`HoeItem`、`SwordItem` があります。道具のクラス階層は次のとおりです。

```text
Item
- TieredItem
    - DiggerItem
        - AxeItem
        - HoeItem
        - PickaxeItem
        - ShovelItem
    - SwordItem
```

`TieredItem` は、特定の `Tier`(後述)を持つ Item のためのヘルパーを含むクラスです。`DiggerItem` は、Block を壊すために作られた Item のためのヘルパーを含みます。ハサミなど、通常は道具とみなされる他の Item はこの階層に含まれない点に注意してください。それらは `Item` を直接継承し、破壊のロジックを自分で持っています。

標準的な道具のセットを作るには、まず `Tier` を定義する必要があります。参考になる値は、Minecraft の `Tiers` enum を確認してください。この例では銅の道具を使いますが、ここには独自の素材を使い、必要に応じて値を調整してかまいません。

```java
// We place copper somewhere between stone and iron.
public static final Tier COPPER_TIER = new SimpleTier(
        // The tag that determines what blocks this tool cannot break. See below for more information.
        MyBlockTags.INCORRECT_FOR_COPPER_TOOL,
        // Determines the durability of the tier.
        // Stone is 131, iron is 250.
        200,
        // Determines the mining speed of the tier. Unused by swords.
        // Stone uses 4, iron uses 6.
        5f,
        // Determines the attack damage bonus. Different tools use this differently. For example, swords do (getAttackDamageBonus() + 4) damage.
        // Stone uses 1, iron uses 2, corresponding to 5 and 6 attack damage for swords, respectively; our sword does 5.5 damage now.
        1.5f,
        // Determines the enchantability of the tier. This represents how good the enchantments on this tool will be.
        // Gold uses 22, we put copper slightly below that.
        20,
        // Determines the repair ingredient of the tier. Use a supplier for lazy initializing.
        () -> Ingredient.of(Tags.Items.INGOTS_COPPER)
);
```

`Tier` ができたので、それを使って道具を登録できます。道具のコンストラクタは、どれも同じ 4 つの引数を取ります。

```java
//ITEMS is a DeferredRegister<Item>
public static final Supplier<SwordItem> COPPER_SWORD = ITEMS.register("copper_sword", () -> new SwordItem(
        // The tier to use.
        COPPER_TIER,
        // The item properties. We don't need to set the durability here because TieredItem handles that for us.
        new Item.Properties().attributes(
            // There are `createAttributes` methods in either the class or subclass of each DiggerItem
            SwordItem.createAttributes(
                // The tier to use.
                COPPER_TIER,
                // The type-specific attack damage bonus. 3 for swords, 1.5 for shovels, 1 for pickaxes, varying for axes and hoes.
                3,
                // The type-specific attack speed modifier. The player has a default attack speed of 4, so to get to the desired
                // value of 1.6f, we use -2.4f. -2.4f for swords, -3f for shovels, -2.8f for pickaxes, varying for axes and hoes.
                -2.4f,
            )
        )
));
public static final Supplier<AxeItem> COPPER_AXE = ITEMS.register("copper_axe", () -> new AxeItem(...));
public static final Supplier<PickaxeItem> COPPER_PICKAXE = ITEMS.register("copper_pickaxe", () -> new PickaxeItem(...));
public static final Supplier<ShovelItem> COPPER_SHOVEL = ITEMS.register("copper_shovel", () -> new ShovelItem(...));
public static final Supplier<HoeItem> COPPER_HOE = ITEMS.register("copper_hoe", () -> new HoeItem(...));
```

### タグ {#tags}

`Tier` を作るときには、その道具で壊しても何もドロップしない Block を含むブロック[タグ][tags]を割り当てます。たとえば、`minecraft:incorrect_for_stone_tool` タグにはダイヤモンド鉱石などが、`minecraft:incorrect_for_iron_tool` タグには黒曜石や古代の残骸などが含まれます。Block を、採掘レベルが不適切な道具のタグに割り当てやすくするため、その道具がないと採掘できない Block のタグも用意されています。たとえば、`minecraft:needs_iron_tool` タグにはダイヤモンド鉱石などが、`minecraft:needs_diamond_tool` タグには黒曜石や古代の残骸などが含まれます。

それで問題なければ、既存の incorrect タグのいずれかを自分の道具に再利用できます。たとえば、銅の道具を単に耐久値の高い石の道具にしたいなら、`BlockTags#INCORRECT_FOR_STONE_TOOL` を渡します。

または、次のように独自のタグを作ることもできます。

```java
// This tag will allow us to add these blocks to the incorrect tags that cannot mine them
public static final TagKey<Block> NEEDS_COPPER_TOOL = TagKey.create(BuiltInRegistries.BLOCK.key(), ResourceLocation.fromNamespaceAndPath(MOD_ID, "needs_copper_tool"));

// This tag will be passed into our tier
public static final TagKey<Block> INCORRECT_FOR_COPPER_TOOL = TagKey.create(BuiltInRegistries.BLOCK.key(), ResourceLocation.fromNamespaceAndPath(MOD_ID, "incorrect_for_cooper_tool"));
```

次に、タグの中身を書きます。たとえば、銅で金鉱石、金ブロック、レッドストーン鉱石は採掘できるが、ダイヤモンドやエメラルドは採掘できないようにしてみましょう(レッドストーンブロックはすでに石の道具で採掘できます)。タグファイルは `src/main/resources/data/mod_id/tags/block/needs_copper_tool.json` に置きます(`mod_id` は自分の Mod ID です)。

```json5
{
    "values": [
        "minecraft:gold_block",
        "minecraft:raw_gold_block",
        "minecraft:gold_ore",
        "minecraft:deepslate_gold_ore",
        "minecraft:redstone_ore",
        "minecraft:deepslate_redstone_ore"
    ]
}
```

そして、Tier に渡すタグとして、石の道具には不適切だが銅の道具のタグには含まれるものを除外する、否定の条件を指定できます。タグファイルは `src/main/resources/data/mod_id/tags/block/incorrect_for_cooper_tool.json` に置きます。

```json5
{
    "values": [
        "#minecraft:incorrect_for_stone_tool"
    ],
    "remove": [
        "#mod_id:needs_copper_tool"
    ]
}
```

最後に、上で見たように、このタグを Tier の作成時に渡します。

道具でブロックステートの Block をドロップさせられるかを確認したい場合は、`Tool#isCorrectForDrops` を呼び出します。`Tool` は、`DataComponents#TOOL` を指定して `ItemStack#get` を呼び出すと取得できます。

## カスタムの道具 {#custom-tools}

カスタムの道具は、`Item.Properties#component` で、Item のデフォルトのコンポーネント一覧に `Tool` [データコンポーネント][datacomponents]を(`DataComponents#TOOL` によって)追加することで作れます。`DiggerItem` は、前述のとおり `Tier` を受け取って `Tool` を構築する実装です。`DiggerItem` には、変更後の攻撃力や攻撃速度など、道具の `Item.Properties#attributes` に渡す値を用意するための便利なメソッド `#createAttributes` もあります。

`Tool` は、`Tool.Rule` の一覧、道具を持っているときのデフォルトの採掘速度(デフォルトは `1`)、Block を採掘したときに道具が受けるダメージ量(デフォルトは `1`)を持ちます。`Tool.Rule` は 3 つの情報を持ちます。ルールを適用する Block の `HolderSet`、そのセット内の Block を採掘する速度(任意)、そしてその道具でそれらの Block がドロップするかどうかを決める真偽値(任意)です。任意の値が設定されていない場合は、他のルールがチェックされます。すべてのルールが当てはまらない場合のデフォルトの動作は、デフォルトの採掘速度で、Block はドロップしない、というものです。

:::note
`HolderSet` は、`Registry#getOrCreateTag` で `TagKey` から作成できます。
:::

マルチツールのような Item(2 つ以上の道具を 1 つにまとめた Item。たとえば斧とツルハシを 1 つにした Item)や、その他の道具のような Item を作るのに、既存の `TieredItem` のいずれかを継承する必要はありません。次の要素を組み合わせるだけで実装できます。

- `Item.Properties#component` で `DataComponents#TOOL` を設定し、独自のルールを持つ `Tool` を追加する。
- `Item.Properties#attributes` で、Item に属性(攻撃力、攻撃速度など)を追加する。
- `IItemExtension#canPerformAction` をオーバーライドして、その Item が実行できる [`ItemAbility`][itemability] を決める。
- `ItemAbility` に基づいて、右クリック時に Item でブロックステートを変更したい場合は、`IBlockExtension#getToolModifiedState` を呼び出す。
- 特定のエンチャントを付けられるように、道具を `minecraft:enchantable/*` タグのいくつかに追加する。

## `ItemAbility` {#itemabilitys}

`ItemAbility` は、Item ができることとできないことを抽象化したものです。左クリックと右クリックの両方の動作が含まれます。NeoForge は、`ItemAbilities` クラスにデフォルトの `ItemAbility` を用意しています。

- 採掘のアビリティ。前述の 4 種類の `DiggerItem` すべてに加え、剣とハサミによる採掘にもあります。
- 斧の右クリックのアビリティ。樹皮を剥ぐ(原木)、削る(酸化した銅)、蝋を取る(錆止めされた銅)があります。
- ハサミのアビリティ。収穫(ハニカム)、彫る(カボチャ)、解除(トリップワイヤー)があります。
- シャベルで平らにする(土の道)、剣のなぎ払い、クワで耕す、盾で防ぐ、釣り竿を投げるためのアビリティ。

独自の `ItemAbility` を作るには、`ItemAbility#get` を使います。必要に応じて新しい `ItemAbility` が作成されます。そのうえで、カスタムの道具の種類で、必要に応じて `IItemExtension#canPerformAction` をオーバーライドします。

`ItemStack` が特定の `ItemAbility` を実行できるかを問い合わせるには、`IItemStackExtension#canPerformAction` を呼び出します。これは道具だけでなく、どの `Item` でも機能する点に注意してください。

## 防具 {#armor}

道具と同様に、防具も(別のものですが)ティアの仕組みを使います。道具で `Tier` と呼ばれるものは、防具では `ArmorMaterial` と呼ばれます。上と同様に、この例では銅の防具を追加する方法を示します。必要に応じて変更してください。ただし、`Tier` と異なり、`ArmorMaterial` は[登録][registered]する必要があります。バニラの値は `ArmorMaterials` クラスを参照してください。

```java
// ARMOR_MATERIALS is a DeferredRegister<ArmorMaterial>

// We place copper somewhere between chainmail and iron.
public static final Holder<ArmorMaterial> COPPER_ARMOR_MATERIAL =
    ARMOR_MATERIALS.register("copper", () -> new ArmorMaterial(
        // Determines the defense value of this armor material, depending on what armor piece it is.
        Util.make(new EnumMap<>(ArmorItem.Type.class), map -> {
            map.put(ArmorItem.Type.BOOTS, 2);
            map.put(ArmorItem.Type.LEGGINGS, 4);
            map.put(ArmorItem.Type.CHESTPLATE, 6);
            map.put(ArmorItem.Type.HELMET, 2);
            map.put(ArmorItem.Type.BODY, 4);
        }),
        // Determines the enchantability of the tier. This represents how good the enchantments on this armor will be.
        // Gold uses 25, we put copper slightly below that.
        20,
        // Determines the sound played when equipping this armor.
        // This is wrapped with a Holder.
        SoundEvents.ARMOR_EQUIP_GENERIC,
        // Determines the repair item for this armor.
        () -> Ingredient.of(Tags.Items.INGOTS_COPPER),
        // Determines the texture locations of the armor to apply when rendering
        // This can also be specified by overriding 'IItemExtension#getArmorTexture' on your item if the armor texture needs to be more dynamic
        List.of(
            // Creates a new armor texture that will be located at:
            // - 'assets/mod_id/textures/models/armor/copper_layer_1.png' for the outer texture
            // - 'assets/mod_id/textures/models/armor/copper_layer_2.png' for the inner texture (only legs)
            new ArmorMaterial.Layer(
                ResourceLocation.fromNamespaceAndPath(MOD_ID, "copper")
            ),
            // Creates a new armor texture that will be rendered on top of the previous at:
            // - 'assets/mod_id/textures/models/armor/copper_layer_1_overlay.png' for the outer texture
            // - 'assets/mod_id/textures/models/armor/copper_layer_2_overlay.png' for the inner texture (only legs)
            // 'true' means that the armor material is dyeable; however, the item must also be added to the 'minecraft:dyeable' tag
            new ArmorMaterial.Layer(
                ResourceLocation.fromNamespaceAndPath(MOD_ID, "copper"), "_overlay", true
            )
        ),
        // Returns the toughness value of the armor. The toughness value is an additional value included in
        // damage calculation, for more information, refer to the Minecraft Wiki's article on armor mechanics:
        // https://minecraft.wiki/w/Armor#Armor_toughness
        // Only diamond and netherite have values greater than 0 here, so we just return 0.
        0,
        // Returns the knockback resistance value of the armor. While wearing this armor, the player is
        // immune to knockback to some degree. If the player has a total knockback resistance value of 1 or greater
        // from all armor pieces combined, they will not take any knockback at all.
        // Only netherite has values greater than 0 here, so we just return 0.
        0
    ));
```

そして、その防具の素材を Item の登録で使います。

```java
//ITEMS is a DeferredRegister<Item>
public static final Supplier<ArmorItem> COPPER_HELMET = ITEMS.register("copper_helmet", () -> new ArmorItem(
        // The armor material to use.
        COPPER_ARMOR_MATERIAL,
        // The armor type to use.
        ArmorItem.Type.HELMET,
        // The item properties where we set the durability.
        // ArmorItem.Type is an enum of five values: HELMET, CHESTPLATE, LEGGINGS, BOOTS, and BODY.
        // BODY is used for non-player entities like wolves or horses.
        // Vanilla armor materials determine this by using a base value and multiplying it with a type-specific constant.
        // The constants are 13 for BOOTS, 15 for LEGGINGS, 16 for CHESTPLATE, 11 for HELMET, and 16 for BODY.
        // If we don't want to use these ratios, we can set the durability normally.
        new Item.Properties().durability(ArmorItem.Type.HELMET.getDurability(15))
));
public static final Supplier<ArmorItem> COPPER_CHESTPLATE = ITEMS.register("copper_chestplate", () -> new ArmorItem(...));
public static final Supplier<ArmorItem> COPPER_LEGGINGS = ITEMS.register("copper_leggings", () -> new ArmorItem(...));
public static final Supplier<ArmorItem> COPPER_BOOTS = ITEMS.register("copper_boots", () -> new ArmorItem(...));
```

防具のテクスチャを作るときは、バニラの防具のテクスチャをベースに作業すると、どの部分がどこに対応するかがわかりやすくなります。

[block]: ../blocks/index.md
[datacomponents]: ./datacomponents.md
[item]: index.md
[itemability]: #itemabilitys
[tags]: ../resources/server/tags.md
[registered]: ../concepts/registries.md#methods-for-registering
