# 材料 {#ingredients}

`Ingredient` は、指定した [`ItemStack`][itemstack] がレシピの有効な入力かどうかを判定するために、[レシピ][recipes]で使われます。そのために `Ingredient` は `Predicate<ItemStack>` を実装しており、`#test` を呼び出すことで、指定した `ItemStack` が材料に一致するかを確認できます。

残念ながら、`Ingredient` の内部の多くはあまり整理されていません。NeoForge はこれを回避するため、可能な限り `Ingredient` クラスを使わず、代わりにカスタム材料用の `ICustomIngredient` インターフェースを導入しています。これは通常の `Ingredient` を直接置き換えるものではありませんが、`ICustomIngredient#toVanilla` と `Ingredient#getCustomIngredient` を使って、それぞれ `Ingredient` への変換と、その逆の変換ができます。

## 組み込みの材料の種類 {#built-in-ingredient-types}

材料を取得する最も簡単な方法は、`Ingredient#of` ヘルパーを使うことです。いくつかのバリエーションがあります。

- `Ingredient.of()` は空の材料を返します。
- `Ingredient.of(Blocks.IRON_BLOCK, Items.GOLD_BLOCK)` は、鉄ブロックか金ブロックのどちらかを受け付ける材料を返します。引数は [`ItemLike`][itemlike] の可変長引数なので、ブロックとアイテムをいくつでも組み合わせて使えます。
- `Ingredient.of(new ItemStack(Items.DIAMOND_SWORD))` は、アイテムスタックを受け付ける材料を返します。個数とデータコンポーネントは無視されることに注意してください。
- `Ingredient.of(Stream.of(new ItemStack(Items.DIAMOND_SWORD)))` は、アイテムスタックを受け付ける材料を返します。前のメソッドと同じですが、たまたま `Stream<ItemStack>` が手元にある場合のためのものです。
- `Ingredient.of(ItemTags.WOODEN_SLABS)` は、指定した[タグ][tag]に含まれる任意のアイテム（ たとえば任意の木のハーフブロック ）を受け付ける材料を返します。

さらに、NeoForge はいくつかの材料を追加しています。

- `new BlockTagIngredient(BlockTags.CONVERTABLE_TO_MUD)` は、`Ingredient.of()` のタグ版に似た材料を返しますが、アイテムタグの代わりにブロックタグを使います。これは、本来ならアイテムタグを使うところで、ブロックタグしか用意されていない場合（ たとえば `minecraft:convertable_to_mud` ）に使います。
- `CompoundIngredient.of(Ingredient.of(Items.DIRT))` は、コンストラクタに（ 可変長引数で ）渡した子の材料を持つ材料を返します。子のいずれかが一致すれば、この材料は一致します。
- `DataComponentIngredient.of(true, new ItemStack(Items.DIAMOND_SWORD))` は、アイテムに加えてデータコンポーネントも一致する材料を返します。真偽値の引数は、厳密な一致（ true ）か部分的な一致（ false ）かを表します。厳密な一致では、データコンポーネントが完全に一致しなければなりません。部分的な一致では、指定したデータコンポーネントが一致する必要はありますが、他のデータコンポーネントが存在していてもかまいません。`#of` には、複数の `Item` を指定したり、その他のオプションを指定したりできるオーバーロードもあります。
- `DifferenceIngredient.of(Ingredient.of(ItemTags.PLANKS), Ingredient.of(ItemTags.NON_FLAMMABLE_WOOD))` は、1 つ目の材料に一致するもののうち、2 つ目の材料には一致しないものすべてに一致する材料を返します。この例では、燃える板材（ つまり、真紅の板材、歪んだ板材、Mod で追加されたネザーの木の板材を除くすべての板材 ）にのみ一致します。
- `IntersectionIngredient.of(Ingredient.of(ItemTags.PLANKS), Ingredient.of(ItemTags.NON_FLAMMABLE_WOOD))` は、両方の子の材料に一致するものすべてに一致する材料を返します。この例では、燃えない板材（ つまり、真紅の板材、歪んだ板材、Mod で追加されたネザーの木の板材 ）にのみ一致します。

この記事の冒頭で説明したとおり、NeoForge が提供する材料の種類は `ICustomIngredient` であり、バニラのコンテキストで使う前に `#toVanilla` を呼び出す必要があることに注意してください。

## カスタムの材料の種類 {#custom-ingredient-types}

Mod 開発者は、`ICustomIngredient` のシステムを通じて独自の材料の種類を追加できます。例として、アイテムタグと、エンチャントと最低レベルを対応付けたマップを受け取る、エンチャント済みアイテムの材料を作ってみましょう。

```java
public class MinEnchantedIngredient implements ICustomIngredient {
    private final TagKey<Item> tag;
    private final Map<Holder<Enchantment>, Integer> enchantments;
    // The codec for serializing the ingredient.
    public static final MapCodec<MinEnchantedIngredient> CODEC = RecordCodecBuilder.mapCodec(inst -> inst.group(
            TagKey.codec(Registries.ITEM).fieldOf("tag").forGetter(e -> e.tag),
            Codec.unboundedMap(Enchantment.CODEC, Codec.INT)
                    .optionalFieldOf("enchantments", Map.of())
                    .forGetter(e -> e.enchantments)
    ).apply(inst, MinEnchantedIngredient::new));
    // Create a stream codec from the regular codec. In some cases, it might make sense to define
    // a new stream codec from scratch.
    public static final StreamCodec<RegistryFriendlyByteBuf, MinEnchantedIngredient> STREAM_CODEC =
            ByteBufCodecs.fromCodecWithRegistries(CODEC.codec());

    // Allow passing in a pre-existing map of enchantments to levels.
    public MinEnchantedIngredient(TagKey<Item> tag, Map<Holder<Enchantment>, Integer> enchantments) {
        this.tag = tag;
        this.enchantments = enchantments;
    }

    public MinEnchantedIngredient(TagKey<Item> tag) {
        this(tag, new HashMap<>());
    }

    // Make this chainable for easy use.
    public MinEnchantedIngredient with(Holder<Enchantment> enchantment, int level) {
        enchantments.put(enchantment, level);
        return this;
    }

    // Check if the passed ItemStack matches our ingredient by verifying the item is in the tag
    // and by testing for presence of all required enchantments with at least the required level.
    @Override
    public boolean test(ItemStack stack) {
        return stack.is(tag) && enchantments.keySet()
                .stream()
                .allMatch(ench -> stack.getEnchantmentLevel(ench) >= enchantments.get(ench));
    }

    // Determines whether this ingredient performs NBT or data component matching (false) or not (true).
    // Also determines whether a stream codec is used for syncing, more on this later.
    // We query enchantments on the stack, therefore our ingredient is not simple.
    @Override
    public boolean isSimple() {
        return false;
    }

    // Returns a stream of items that match this ingredient. Mostly for display purposes.
    // There's a few good practices to follow here:
    // - Always include at least one item stack, to prevent accidental recognition as empty.
    // - Include each accepted Item at least once.
    // - If #isSimple is true, this should be exact and contain every item stack that matches.
    //   If not, this should be as exact as possible, but doesn't need to be super accurate.
    // In our case, we use all items in the tag, each with the required enchantments.
    @Override
    public Stream<ItemStack> getItems() {
        // Get a list of item stacks, one stack per item in the tag.
        List<ItemStack> stacks = BuiltInRegistries.ITEM
                .getOrCreateTag(tag)
                .stream()
                .map(ItemStack::new)
                .toList();
        // Enchant all stacks with all enchantments.
        for (ItemStack stack : stacks) {
            enchantments
                    .keySet()
                    .forEach(ench -> stack.enchant(ench, enchantments.get(ench)));
        }
        // Return stream variant of the list.
        return stacks.stream();
    }
}
```

カスタム材料は [Registry][registry] なので、材料を登録する必要があります。登録には、NeoForge が提供する `IngredientType` クラスを使います。これは基本的に、[`MapCodec`][codec] と、任意で [`StreamCodec`][streamcodec] をまとめたラッパーです。

```java
public static final DeferredRegister<IngredientType<?>> INGREDIENT_TYPES =
        DeferredRegister.create(NeoForgeRegistries.Keys.INGREDIENT_TYPE, ExampleMod.MOD_ID);

public static final Supplier<IngredientType<MinEnchantedIngredient>> MIN_ENCHANTED =
        INGREDIENT_TYPES.register("min_enchanted",
                // The stream codec parameter is optional, a stream codec will be created from the codec
                // using ByteBufCodecs#fromCodec or #fromCodecWithRegistries if the stream codec isn't specified.
                () -> new IngredientType<>(MinEnchantedIngredient.CODEC, MinEnchantedIngredient.STREAM_CODEC));
```

それができたら、材料クラスで `#getType` もオーバーライドする必要があります。

```java
public class MinEnchantedIngredient implements ICustomIngredient {
    // other stuff here

    @Override    
    public IngredientType<?> getType() {
        return MIN_ENCHANTED;
    }
}
```

これで完成です。材料の種類を使う準備ができました。

## JSON 表現 {#json-representation}

バニラの材料はかなり制限されており、NeoForge が材料のためにまったく新しい Registry を導入しているので、組み込みの材料や自作の材料が JSON でどのように表されるかも見ておく価値があります。

`type` を指定した材料は、一般にバニラのものではないと見なされます。たとえば次のとおりです。

```json5
{
    "type": "neoforge:block_tag",
    "tag": "minecraft:convertable_to_mud"
}
```

あるいは、自作の材料を使った別の例です。

```json5
{
    "type": "examplemod:min_enchanted",
    "tag": "c:swords",
    "enchantments": {
        "minecraft:sharpness": 4
    }
}
```

`type` が指定されていない場合は、バニラの材料です。バニラの材料では、`item` と `tag` の 2 つのプロパティのうち、どちらか一方を指定できます。

バニラのアイテムの材料の例です。

```json5
{
    "item": "minecraft:dirt"
}
```

バニラのタグの材料の例です。

```json5
{
    "tag": "c:ingots"
}
```

[codec]: ../../../datastorage/codecs.md
[itemlike]: ../../../items/index.md#itemlike
[itemstack]: ../../../items/index.md#itemstacks
[recipes]: index.md
[registry]: ../../../concepts/registries.md
[streamcodec]: ../../../networking/streamcodecs.md
[tag]: ../tags.md
