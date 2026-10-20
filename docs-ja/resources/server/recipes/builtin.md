# 組み込みのレシピタイプ {#built-in-recipe-types}

Minecraft には、すぐに使えるさまざまなレシピタイプとシリアライザが用意されています。この記事では、それぞれのレシピタイプと、その生成方法を説明します。

## クラフト {#crafting}

クラフトレシピは通常、作業台、クラフター、または Mod で追加された作業台や機械で使われます。レシピタイプは `minecraft:crafting` です。

### 定形クラフト {#shaped-crafting}

作業台、棒、ほとんどの道具など、最も重要なレシピのいくつかは定形レシピで作られています。これらのレシピは、アイテムを配置しなければならないクラフトのパターン、つまり形（ そのため「定形」と呼ばれます ）によって定義されます。例を見てみましょう。

```json5
{
    "type": "minecraft:crafting_shaped",
    "category": "equipment",
    "pattern": [
        "XXX",
        " # ",
        " # "
    ],
    "key": {
        "#": {
            "item": "minecraft:stick"
        },
        "X": {
            "item": "minecraft:iron_ingot"
        }
    },
    "result": {
        "count": 1,
        "id": "minecraft:iron_pickaxe"
    }
}
```

1 行ずつ見ていきましょう。

- `type`: 定形レシピのシリアライザの ID である `minecraft:crafting_shaped` です。
- `category`: この省略可能なフィールドは、クラフトブックでのカテゴリを定義します。
- `key` と `pattern`: この 2 つを組み合わせて、アイテムをクラフトグリッドにどう配置するかを定義します。
    - パターンは、形を定義する最大 3 文字幅の文字列を最大 3 行定義します。すべての行は同じ長さでなければなりません。つまり、パターンは長方形になる必要があります。空のままにするスロットはスペースで表せます。
    - キーは、パターンで使われる文字を[材料][ingredient]に対応付けます。上の例では、パターン内のすべての `X` は鉄インゴット、すべての `#` は棒でなければなりません。
- `result`: レシピの結果です。これは[アイテムスタックの JSON 表現][itemjson]です。
- 例には示されていませんが、`group` キーもあります。この省略可能な文字列のプロパティは、レシピブックにグループを作成します。同じグループのレシピは、レシピブックで 1 つにまとめて表示されます。

それでは、このレシピを生成する方法を見てみましょう。

```java
// We use a builder pattern, therefore no variable is created. Create a new builder by calling
// ShapedRecipeBuilder#shaped with the recipe category (found in the RecipeCategory enum)
// and a result item, a result item and count, or a result item stack.
ShapedRecipeBuilder.shaped(RecipeCategory.TOOLS, Items.IRON_PICKAXE)
        // Create the lines of your pattern. Each call to #pattern adds a new line.
        // Patterns will be validated, i.e. their shape will be checked.
        .pattern("XXX")
        .pattern(" # ")
        .pattern(" # ")
        // Create the keys for the pattern. All non-space characters used in the pattern must be defined.
        // This can either accept Ingredients, TagKey<Item>s or ItemLikes, i.e. items or blocks.
        .define('X', Items.IRON_INGOT)
        .define('#', Items.STICK)
        // Creates the recipe advancement. While not mandated by the consuming background systems,
        // the recipe builder will crash if you omit this. The first parameter is the advancement name,
        // and the second one is the condition. Normally, you want to use the has() shortcut for the condition.
        // Multiple advancement requirements can be added by calling #unlockedBy multiple times.
        .unlockedBy("has_iron_ingot", has(Items.IRON_INGOT))
        // Stores the recipe in the passed RecipeOutput, to be written to disk.
        // If you want to add conditions to the recipe, those can be set on the output.
        .save(output);
```

さらに、`#group` を呼び出してレシピブックのグループを設定できます。

### 不定形クラフト {#shapeless-crafting}

定形クラフトレシピとは異なり、不定形クラフトレシピでは材料を入れる順番は関係ありません。そのため、パターンやキーはなく、代わりに材料のリストだけがあります。

```json5
{
    "type": "minecraft:crafting_shapeless",
    "category": "misc",
    "ingredients": [
        {
            "item": "minecraft:brown_mushroom"
        },
        {
            "item": "minecraft:red_mushroom"
        },
        {
            "item": "minecraft:bowl"
        }
    ],
    "result": {
        "count": 1,
        "id": "minecraft:mushroom_stew"
    }
}
```

先ほどと同様に、1 行ずつ見ていきましょう。

- `type`: 不定形レシピのシリアライザの ID である `minecraft:crafting_shapeless` です。
- `category`: この省略可能なフィールドは、クラフトブックでのカテゴリを定義します。
- `ingredients`: [材料][ingredient]のリストです。リストの順序はレシピ表示のためにコード上で保持されますが、レシピ自体は材料を任意の順序で受け付けます。
- `result`: レシピの結果です。これは[アイテムスタックの JSON 表現][itemjson]です。
- 例には示されていませんが、`group` キーもあります。この省略可能な文字列のプロパティは、レシピブックにグループを作成します。同じグループのレシピは、レシピブックで 1 つにまとめて表示されます。

それでは、このレシピを生成する方法を見てみましょう。

```java
// We use a builder pattern, therefore no variable is created. Create a new builder by calling
// ShapelessRecipeBuilder#shapeless with the recipe category (found in the RecipeCategory enum)
// and a result item, a result item and count, or a result item stack.
ShapelessRecipeBuilder.shapeless(RecipeCategory.MISC, Items.MUSHROOM_STEW)
        // Add the recipe ingredients. This can either accept Ingredients, TagKey<Item>s or ItemLikes.
        // Overloads also exist that additionally accept a count, adding the same ingredient multiple times.
        .requires(Blocks.BROWN_MUSHROOM)
        .requires(Blocks.RED_MUSHROOM)
        .requires(Items.BOWL)
        // Creates the recipe advancement. While not mandated by the consuming background systems,
        // the recipe builder will crash if you omit this. The first parameter is the advancement name,
        // and the second one is the condition. Normally, you want to use the has() shortcut for the condition.
        // Multiple advancement requirements can be added by calling #unlockedBy multiple times.
        .unlockedBy("has_mushroom_stew", has(Items.MUSHROOM_STEW))
        .unlockedBy("has_bowl", has(Items.BOWL))
        .unlockedBy("has_brown_mushroom", has(Blocks.BROWN_MUSHROOM))
        .unlockedBy("has_red_mushroom", has(Blocks.RED_MUSHROOM))
        // Stores the recipe in the passed RecipeOutput, to be written to disk.
        // If you want to add conditions to the recipe, those can be set on the output.
        .save(output);
```

さらに、`#group` を呼び出してレシピブックのグループを設定できます。

:::info
1 アイテムのレシピ（ 例: ストレージブロックの分解 ）は、バニラの基準に合わせて不定形レシピにしてください。
:::

### 特殊クラフト {#special-crafting}

場合によっては、出力を入力から動的に作成する必要があります。多くの場合これは、入力のスタックから値をコピーまたは計算して、出力にデータコンポーネントを設定するためです。これらのレシピは通常、タイプだけを指定し、それ以外はすべてハードコードされています。たとえば次のとおりです。

```java
{
    "type": "minecraft:crafting_special_armordye"
}
```

このレシピは革の防具を染色するためのもので、タイプだけを指定し、それ以外はすべてハードコードされています。特に、JSON で表現するのが難しい色の計算がハードコードされています。Minecraft はすべての特殊クラフトレシピに `crafting_special_` という接頭辞を付けていますが、この慣例に従う必要はありません。

このレシピの生成は次のようになります。

```java
// The parameter of #special is a Function<CraftingBookCategory, Recipe<?>>.
// All vanilla special recipes use a constructor with one CraftingBookCategory parameter for this.
SpecialRecipeBuilder.special(ArmorDyeRecipe::new)
        // This overload of #save allows us to specify a name. It can also be used on shaped or shapeless builders.
        .save(output, "armor_dye");
```

バニラは次の特殊クラフトのシリアライザを提供しています（ Mod がさらに追加することもあります ）。

- `minecraft:crafting_special_armordye`: 革の防具やその他の染色可能なアイテムを染色するためのものです。
- `minecraft:crafting_special_bannerduplicate`: 旗を複製するためのものです。
- `minecraft:crafting_special_bookcloning`: 記入済みの本をコピーするためのものです。結果の本の世代（ generation ）プロパティが 1 つ増えます。
- `minecraft:crafting_special_firework_rocket`: ロケット花火をクラフトするためのものです。
- `minecraft:crafting_special_firework_star`: 花火の星をクラフトするためのものです。
- `minecraft:crafting_special_firework_star_fade`: 花火の星にフェード効果を付けるためのものです。
- `minecraft:crafting_special_mapcloning`: 使用済みの地図をコピーするためのものです。宝の地図にも使えます。
- `minecraft:crafting_special_mapextending`: 使用済みの地図を拡張するためのものです。
- `minecraft:crafting_special_repairitem`: 壊れかけたアイテム 2 つを修理して 1 つにするためのものです。
- `minecraft:crafting_special_shielddecoration`: 盾に旗の模様を付けるためのものです。
- `minecraft:crafting_special_shulkerboxcoloring`: 中身を保持したままシュルカーボックスを染色するためのものです。
- `minecraft:crafting_special_suspiciousstew`: 入力した花に応じて怪しげなシチューをクラフトするためのものです。
- `minecraft:crafting_special_tippedarrow`: 入力したポーションに応じて効能付きの矢をクラフトするためのものです。
- `minecraft:crafting_decorated_pot`: 土器の欠片から飾り壺をクラフトするためのものです。

## かまど系のレシピ {#furnace-like-recipes}

2 番目に重要なレシピのグループは、精錬やそれに似た処理で作られるものです。かまど（ タイプ `minecraft:smelting` ）、燻製器（ `minecraft:smoking` ）、溶鉱炉（ `minecraft:blasting` ）、焚き火（ `minecraft:campfire_cooking` ）で作られるすべてのレシピは、同じ形式を使います。

```json5
{
    "type": "minecraft:smelting",
    "category": "food",
    "cookingtime": 200,
    "experience": 0.1,
    "ingredient": {
        "item": "minecraft:kelp"
    },
    "result": {
        "id": "minecraft:dried_kelp"
    }
}
```

1 行ずつ見ていきましょう。

- `type`: レシピシリアライザの ID である `minecraft:smelting` です。作成するかまど系のレシピの種類によって異なる場合があります。
- `category`: この省略可能なフィールドは、クラフトブックでのカテゴリを定義します。
- `cookingtime`: このフィールドは、レシピの処理に必要な時間を tick 単位で決めます。バニラのレシピでは、かまどはすべて 200、燻製器と溶鉱炉は 100、焚き火は 600 を使っています。ただし、好きな値にしてかまいません。
- `experience`: このレシピを作ったときに得られる経験値の量を決めます。このフィールドは省略可能で、省略した場合は経験値は得られません。
- `ingredient`: レシピの入力となる[材料][ingredient]です。
- `result`: レシピの結果です。これは[アイテムスタックの JSON 表現][itemjson]です。

これらのレシピのデータ生成は次のようになります。

```java
// Use #smoking for smoking recipes, #blasting for blasting recipes, and #campfireCooking for campfire recipes.
// All of these builders work the same otherwise.
SimpleCookingRecipeBuilder.smelting(
        // Our input ingredient.
        Ingredient.of(Items.KELP),
        // Our recipe category.
        RecipeCategory.FOOD,
        // Our result item. May also be an ItemStack.
        Items.DRIED_KELP,
        // Our experience reward
        0.1f,
        // Our cooking time.
        200
)
        // The recipe advancement, like with the crafting recipes above.
        .unlockedBy("has_kelp", has(Blocks.KELP))
        // This overload of #save allows us to specify a name.
        .save(p_301191_, "dried_kelp_smelting");
```

:::info
これらのレシピのレシピタイプは、レシピシリアライザと同じです。つまり、かまどは `minecraft:smelting`、燻製器は `minecraft:smoking` を使う、といった具合です。
:::

## 石切 {#stonecutting}

石切台のレシピは `minecraft:stonecutting` のレシピタイプを使います。タイプ、入力、出力しかない、これ以上ないほど単純なレシピです。

```json5
{
    "type": "minecraft:stonecutting",
    "ingredient": {
        "item": "minecraft:andesite"
    },
    "result": {
        "count": 2,
        "id": "minecraft:andesite_slab"
    }
}
```

`type` はレシピシリアライザ（ `minecraft:stonecutting` ）を定義します。入力は[材料][ingredient]で、結果は基本的な[アイテムスタックの JSON][itemjson] です。クラフトレシピと同様に、任意で `group` を指定して、レシピブックでグループにまとめることもできます。

データ生成も簡単です。

```java
SingleItemRecipeBuilder.stonecutting(Ingredient.of(Items.ANDESITE), RecipeCategory.BUILDING_BLOCKS, Items.ANDESITE_SLAB, 2)
        .unlockedBy("has_andesite", has(Items.ANDESITE))
        .save(output, "andesite_slab_from_andesite_stonecutting");
```

単一アイテムのレシピビルダーは、実際の ItemStack の結果をサポートしておらず、そのためデータコンポーネント付きの結果もサポートしていないことに注意してください。ただし、レシピの Codec はこれをサポートしているので、この機能が必要な場合はカスタムビルダーを実装する必要があります。

## 鍛冶 {#smithing}

鍛冶台は 2 種類のレシピシリアライザをサポートしています。1 つは入力を出力に変換し、入力のコンポーネント（ エンチャントなど ）を引き継ぐもので、もう 1 つは入力にコンポーネントを適用するものです。どちらも `minecraft:smithing` のレシピタイプを使い、ベース、テンプレート、追加アイテムと呼ばれる 3 つの入力が必要です。

### 変換の鍛冶 {#transform-smithing}

このレシピシリアライザは、2 つの入力アイテムを 1 つに変換するためのもので、1 つ目の入力のデータコンポーネントを保持します。バニラでは主にネザライトの装備に使われていますが、ここではどんなアイテムでも使えます。

```json5
{
    "type": "minecraft:smithing_transform",
    "base": {
        "item": "minecraft:diamond_axe"
    },
    "template": {
        "item": "minecraft:netherite_upgrade_smithing_template"
    },
    "addition": {
        "item": "minecraft:netherite_ingot"
    },
    "result": {
        "count": 1,
        "id": "minecraft:netherite_axe"
    }
}
```

1 行ずつ分解してみましょう。

- `type`: レシピシリアライザの ID である `minecraft:smithing_transform` です。
- `base`: レシピのベースとなる[材料][ingredient]です。通常は何らかの装備です。
- `template`: レシピのテンプレートとなる[材料][ingredient]です。通常は鍛冶型です。
- `addition`: レシピの追加となる[材料][ingredient]です。通常は何らかの素材で、たとえばネザライトインゴットなどです。
- `result`: レシピの結果です。これは[アイテムスタックの JSON 表現][itemjson]です。

データ生成では、`SmithingTransformRecipeBuilder#smithing` を呼び出してレシピを追加します。

```java
SmithingTransformRecipeBuilder.smithing(
        // The template ingredient.
        Ingredient.of(Items.NETHERITE_UPGRADE_SMITHING_TEMPLATE),
        // The base ingredient.
        Ingredient.of(Items.DIAMOND_AXE),
        // The addition ingredient.
        Ingredient.of(Items.NETHERITE_INGOT),
        // The recipe book category.
        RecipeCategory.TOOLS,
        // The result item. Note that while the recipe codec accepts an item stack here, the builder does not.
        // If you need an item stack output, you need to use your own builder.
        Items.NETHERITE_AXE
)
        // The recipe advancement, like with the other recipes above.
        .unlocks("has_netherite_ingot", has(Items.NETHERITE_INGOT))
        // This overload of #save allows us to specify a name.
        .save(output, "netherite_axe_smithing");
```

### 装飾の鍛冶 {#trim-smithing}

装飾の鍛冶とは、防具に防具の装飾を施す処理です。

```json5
{
    "type": "minecraft:smithing_trim",
    "addition": {
        "tag": "minecraft:trim_materials"
    },
    "base": {
        "tag": "minecraft:trimmable_armor"
    },
    "template": {
        "item": "minecraft:bolt_armor_trim_smithing_template"
    }
}
```

もう一度、要素ごとに分解してみましょう。

- `type`: レシピシリアライザの ID である `minecraft:smithing_trim` です。
- `base`: レシピのベースとなる[材料][ingredient]です。バニラではいずれも、ここに `minecraft:trimmable_armor` タグを使っています。
- `template`: レシピのテンプレートとなる[材料][ingredient]です。バニラではいずれも、ここに防具の装飾の鍛冶型を使っています。
- `addition`: レシピの追加となる[材料][ingredient]です。バニラではいずれも、ここに `minecraft:trim_materials` タグを使っています。

このレシピシリアライザには、注目すべきことに、結果のフィールドがありません。これは、ベースの入力を使い、それにテンプレートと追加アイテムを「適用」するためです。つまり、他の入力に基づいてベースのコンポーネントを設定し、その操作の結果をレシピの結果として使います。

データ生成では、`SmithingTrimRecipeBuilder#smithingTrim` を呼び出してレシピを追加します。

```java
SmithingTrimRecipeBuilder.smithingTrim(
        // The base ingredient.
        Ingredient.of(ItemTags.TRIMMABLE_ARMOR),
        // The template ingredient.
        Ingredient.of(Items.BOLT_ARMOR_TRIM_SMITHING_TEMPLATE),
        // The addition ingredient.
        Ingredient.of(ItemTags.TRIM_MATERIALS),
        // The recipe book category.
        RecipeCategory.MISC
)
        // The recipe advancement, like with the other recipes above.
        .unlocks("has_smithing_trim_template", has(Items.BOLT_ARMOR_TRIM_SMITHING_TEMPLATE))
        // This overload of #save allows us to specify a name. Yes, this name is copied from vanilla.
        .save(output, "bolt_armor_trim_smithing_template_smithing_trim");
```

[ingredient]: ingredients.md
[itemjson]: ../../../items/index.md#json-representation
