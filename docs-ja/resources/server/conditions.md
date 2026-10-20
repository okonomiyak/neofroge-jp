# データの読み込み条件 {#data-load-conditions}

他の Mod が存在する場合や、いずれかの Mod が別の種類の鉱石を追加する場合などに、特定の機能を無効・有効にしたいことがあります。こうした用途のために、NeoForge はデータの読み込み条件を追加しています。この仕組みはもともとレシピのためのものだったため、当初はレシピの条件と呼ばれていましたが、その後他の仕組みにも拡張されました。組み込みの条件の一部が Item に限られているのも、そのためです。

ほとんどの JSON ファイルでは、任意でルートに `neoforge:conditions` ブロックを宣言でき、データファイルが実際に読み込まれる前に評価されます。すべての条件が満たされた場合にのみ読み込みが続行され、そうでなければデータファイルは無視されます( このルールの例外は[ルートテーブル][loottable]で、代わりに空のルートテーブルに置き換えられます )。

```json5
{
    "neoforge:conditions": [
        {
            // Condition 1
        },
        {
            // Condition 2
        },
        // ...
    ],
    // The rest of the data file
}
```

たとえば、ID が `examplemod` の Mod が存在する場合にのみファイルを読み込みたい場合、ファイルは次のようになります。

```json5
{
    // highlight-start
    "neoforge:conditions": [
        {
            "type": "neoforge:mod_loaded",
            "modid": "examplemod"
        }
    ],
    // highlight-end
    "type": "minecraft:crafting_shaped",
    // ...
}
```

:::note
ほとんどのバニラのファイルには、`ConditionalCodec` のラッパーを使って条件を使えるようパッチが当てられています。ただし、すべての仕組み、特に [Codec][codec] を使っていない仕組みで条件が使えるわけではありません。データファイルで条件を使えるかを確認するには、その元になっている Codec の定義を確認してください。
:::

## 組み込みの条件 {#built-in-conditions}

### `neoforge:true` と `neoforge:false` {#neoforgetrue-and-neoforgefalse}

これらはデータを持たず、名前のとおりの値を返します。

```json5
{
    // Will always return true (or false for "neoforge:false")
    "type": "neoforge:true"
}
```

:::tip
`neoforge:false` 条件を使うと、どのデータファイルも非常にすっきりと無効にできます。必要な場所に、次の内容のファイルを置くだけです。

```json5
{"neoforge:conditions":[{"type":"neoforge:false"}]}
```

この方法でファイルを無効にしても、ログが大量に出力されることは**ありません**。
:::

### `neoforge:not`

この条件は、別の条件を受け取り、それを反転させます。

```json5
{
    // Inverts the result of the stored condition
    "type": "neoforge:not",
    "value": {
        // Another condition
    }
}
```

### `neoforge:and` と `neoforge:or` {#neoforgeand-and-neoforgeor}

これらの条件は、対象となる条件を受け取り、名前のとおりの論理演算を適用します。受け付ける条件の数に制限はありません。

```json5
{
    // ANDs the stored conditions together (or ORs for "neoforge:or")
    "type": "neoforge:and",
    "values": [
        {
            // First condition
        },
        {
            // Second condition
        }
    ]
}
```

### `neoforge:mod_loaded`

この条件は、指定した Mod ID の Mod が読み込まれていれば true を、そうでなければ false を返します。

```json5
{
    "type": "neoforge:mod_loaded",
    // Returns true if "examplemod" is loaded
    "modid": "examplemod"
}
```

### `neoforge:item_exists`

この条件は、指定した Registry 名の Item が登録されていれば true を、そうでなければ false を返します。

```json5
{
    "type": "neoforge:item_exists",
    // Returns true if "examplemod:example_item" has been registered
    "item": "examplemod:example_item"
}
```

### `neoforge:tag_empty`

この条件は、指定したアイテムの[タグ][tag]が空であれば true を、そうでなければ false を返します。

```json5
{
    "type": "neoforge:tag_empty",
    // Returns true if "examplemod:example_tag" is an empty item tag
    "tag": "examplemod:example_tag"
}
```

## カスタムの条件の作成 {#creating-custom-conditions}

カスタムの条件は、`ICondition` とその `#test(IContext)` メソッドを実装し、それ用の [MapCodec][codec] を作ることで作成できます。`#test` の引数 `IContext` は、ゲームの状態の一部にアクセスできます。現在のところ、できるのは Registry からタグを問い合わせることだけです。条件を持つオブジェクトの中にはタグより先に読み込まれるものもあり、その場合のコンテキストは `IContext.EMPTY` で、タグの情報はまったく含まれません。

たとえば、`tag_empty` 条件を、アイテムタグではなくエンティティタイプのタグ向けに実装し直したいとすると、条件は次のようになります。

```java
// This class is basically a boiled-down copy of TagEmptyCondition, adjusted for entity types instead of items.
public record EntityTagEmptyCondition(TagKey<EntityType<?>> tag) implements ICondition {
    public static final MapCodec<EntityTagEmptyCondition> CODEC = RecordCodecBuilder.mapCodec(inst -> inst.group(
            ResourceLocation.CODEC.xmap(rl -> TagKey.create(Registries.ENTITY_TYPES, rl), TagKey::location).fieldOf("tag").forGetter(EntityTagEmptyCondition::tag)
    ).apply(inst, EntityTagEmptyCondition::new));

    @Override
    public boolean test(ICondition.IContext context) {
        return context.getTag(this.tag()).isEmpty();
    }

    @Override
    public MapCodec<? extends ICondition> codec() {
        return CODEC;
    }
}
```

条件は Codec の Registry です。そのため、次のように Codec を[登録][register]する必要があります。

```java
public static final DeferredRegister<MapCodec<? extends ICondition>> CONDITION_CODECS =
        DeferredRegister.create(NeoForgeRegistries.Keys.CONDITION_CODECS, ExampleMod.MOD_ID);

public static final Supplier<MapCodec<EntityTagEmptyCondition>> ENTITY_TAG_EMPTY =
        CONDITION_CODECS.register("entity_tag_empty", () -> EntityTagEmptyCondition.CODEC);
```

これで、データファイルで条件を使えます( 条件を `examplemod` 名前空間で登録したものとします )。

```json5
{
    "neoforge:conditions": [
        {
            "type": "examplemod:entity_tag_empty",
            "tag": "minecraft:zombies"
        }
    ],
    // The rest of the data file
}
```

## データ生成 {#datagen}

どの Datapack の JSON ファイルでも読み込み条件を使えますが、条件を生成できるよう変更されている[データプロバイダ][datagen]は一部だけです。次のものがあります。

- [`RecipeProvider`][recipeprovider]（ `RecipeOutput#withConditions` を使用 ）。レシピの進捗を含みます
- `JsonCodecProvider` とそのサブクラスの `SpriteSourceProvider`
- [`DataMapProvider`][datamapprovider]
- [`GlobalLootModifierProvider`][glmprovider]

条件自体については、`IConditionBuilder` インターフェースが、組み込みの条件の種類ごとに、対応する `ICondition` を返す static なヘルパーを提供しています。

[codec]: ../../datastorage/codecs
[datagen]: ../index.md#data-generation
[datamapprovider]: datamaps/index.md#data-generation
[glmprovider]: loottables/glm.md#datagen
[loottable]: loottables/index.md
[recipeprovider]: recipes/index.md#data-generation
[register]: ../../concepts/registries
[tag]: tags.md
