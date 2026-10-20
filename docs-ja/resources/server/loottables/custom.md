# カスタムのルートオブジェクト {#custom-loot-objects}

ルートテーブルの仕組みは複雑なため、いくつもの [Registry][registries] が関わっており、Mod 開発者はそのすべてを使って動作を追加できます。

ルートテーブルに関係する Registry は、どれも似たパターンに従います。新しい Registry のエントリを追加するには、一般に、機能を持つクラスを継承するか、インターフェースを実装します。そのうえで、シリアライズ用の [Codec][codec] を定義し、その Codec を、通常どおり `DeferredRegister` を使って対応する Registry に登録します。これは、ほとんどの Registry( たとえば Block / ブロックステートや、Item / アイテムスタックも )が採用している「1 つの基本オブジェクトと、多数のインスタンス」という考え方に沿ったものです。

## カスタムのルートエントリの種類 {#custom-loot-entry-types}

カスタムのルートエントリの種類を作るには、`LootPoolEntryContainer`、またはその 2 つの直接のサブクラス `LootPoolSingletonContainer` か `CompositeEntryBase` のいずれかを継承します。例として、エンティティのドロップを返すルートエントリの種類を作ってみます。これは純粋に例のためのもので、実際には別のルートテーブルを直接参照するほうが理想的です。まず、ルートエントリの種類のクラスを作りましょう。

```java
// We extend LootPoolSingletonContainer since we have a "finite" set of drops.
// Some of this code is adapted from NestedLootTable.
public class EntityLootEntry extends LootPoolSingletonContainer {
    // A Holder for the entity type we want to roll the other table for.
    private final Holder<EntityType<?>> entity;

    // It is common practice to have a private constructor and have a static factory method.
    // This is because weight, quality, conditions, and functions are supplied by a lambda below.
    private EntityLootEntry(Holder<EntityType<?>> entity, int weight, int quality, List<LootItemCondition> conditions, List<LootItemFunction> functions) {
        // Pass lambda-provided parameters to super.
        super(weight, quality, conditions, functions);
        // Set our values.
        this.entity = entity;
    }

    // Static builder method, accepting our custom parameters and combining them with a lambda that supplies the values common to all entry types.
    public static LootPoolSingletonContainer.Builder<?> entityLoot(Holder<EntityType<?>> entity) {
        // Use the static simpleBuilder() method defined in LootPoolSingletonContainer.
        return simpleBuilder((weight, quality, conditions, functions) -> new EntityLootEntry(entity, weight, quality, conditions, functions));
    }

    // This is where the magic happens. To add an item stack, we generally call #accept on the consumer.
    // However, in this case, we let #getRandomItems do that for us.
    @Override
    public void createItemStack(Consumer<ItemStack> consumer, LootContext context) {
        // Get the entity's loot table. If it doesn't exist, an empty loot table will be returned, so null-checking is not necessary.
        LootTable table = context.getLevel().reloadableRegistries().getLootTable(entity.value().getDefaultLootTable());
        // Use the raw version here, because vanilla does it too. :P
        // #getRandomItemsRaw calls consumer#accept for us on the results of the roll.
        table.getRandomItemsRaw(context, consumer);
    }
}
```

次に、ルートエントリ用の `MapCodec` を作ります。

```java
// This is placed as a constant in EntityLootEntry.
public static final MapCodec<EntityLootEntry> CODEC = RecordCodecBuilder.mapCodec(inst ->
        // Add our own fields.
        inst.group(
                        // A value referencing an entity type id.
                        BuiltInRegistries.ENTITY_TYPE.holderByNameCodec().fieldOf("entity").forGetter(e -> e.entity)
                )
                // Add common fields: weight, display, conditions, and functions.
                .and(singletonFields(inst))
                .apply(inst, EntityLootEntry::new)
);
```

そして、登録でこの Codec を使います。

```java
public static final DeferredRegister<LootPoolEntryType> LOOT_POOL_ENTRY_TYPES =
        DeferredRegister.create(Registries.LOOT_POOL_ENTRY_TYPE, ExampleMod.MOD_ID);

public static final Supplier<LootPoolEntryType> ENTITY_LOOT =
        LOOT_POOL_ENTRY_TYPES.register("entity_loot", () -> new LootPoolEntryType(EntityLootEntry.CODEC));
```

最後に、ルートエントリのクラスで `getType()` をオーバーライドする必要があります。

```java
public class EntityLootEntry extends LootPoolSingletonContainer {
    // other stuff here

    @Override
    public LootPoolEntryType getType() {
        return ENTITY_LOOT.get();
    }
}
```

## カスタムの数値プロバイダ {#custom-number-providers}

カスタムの数値プロバイダを作るには、`NumberProvider` インターフェースを実装します。例として、渡された数値の符号を反転させる数値プロバイダを作りたいとします。

```java
// We accept another number provider as our base.
public record InvertedSignProvider(NumberProvider base) implements NumberProvider {
    public static final MapCodec<InvertedSignProvider> CODEC = RecordCodecBuilder.mapCodec(inst -> inst.group(
            NumberProviders.CODEC.fieldOf("base").forGetter(InvertedSignProvider::base)
    ).apply(inst, InvertedSignProvider::new));

    // Return a float value. Use the context and the record parameters as needed.
    @Override
    public float getFloat(LootContext context) {
        return -this.base.getFloat(context);
    }

    // Return an int value. Use the context and the record parameters as needed.
    // Overriding this is optional, the default implementation will round the result of #getFloat.
    @Override
    public int getInt(LootContext context) {
        return -this.base.getInt(context);
    }

    // Return a set of the loot context params used by this provider. See below for more information.
    // Since we have a base value, we just defer to the base.
    @Override
    public Set<LootContextParam<?>> getReferencedContextParams() {
        return this.base.getReferencedContextParams();
    }
}
```

カスタムのルートエントリの種類と同様に、登録でこの Codec を使います。

```java
public static final DeferredRegister<LootNumberProviderType> LOOT_NUMBER_PROVIDER_TYPES =
        DeferredRegister.create(Registries.LOOT_NUMBER_PROVIDER_TYPE, ExampleMod.MOD_ID);

public static final Supplier<LootNumberProviderType> INVERTED_SIGN =
        LOOT_NUMBER_PROVIDER_TYPES.register("inverted_sign", () -> new LootNumberProviderType(InvertedSignProvider.CODEC));
```

同様に、数値プロバイダのクラスで `getType()` をオーバーライドする必要があります。

```java
public record InvertedSignProvider(NumberProvider base) implements NumberProvider {
    // other stuff here

    @Override
    public LootNumberProviderType getType() {
        return INVERTED_SIGN.get();
    }
}
```

## カスタムのレベルに基づく値 {#custom-level-based-values}

カスタムの `LevelBasedValue` は、record で `LevelBasedValue` インターフェースを実装することで作成できます。ここでも例として、別の `LevelBasedValue` の出力を反転させたいとします。

```java
public record InvertedSignLevelBasedValue(LevelBasedValue base) implements LevelBaseValue {
    public static final MapCodec<InvertedLevelBasedValue> CODEC = RecordCodecBuilder.mapCodec(inst -> inst.group(
            LevelBasedValue.CODEC.fieldOf("base").forGetter(InvertedLevelBasedValue::base)
    ).apply(inst, InvertedLevelBasedValue::new));

    // Perform our operation.
    @Override
    public float calculate(int level) {
        return -this.base.calculate(level);
    }

    // Unlike NumberProviders, we don't return the registered type, instead we return the codec directly.
    @Override
    public MapCodec<InvertedLevelBasedValue> codec() {
        return CODEC;
    }
}
```

そしてまた、登録で Codec を使います。ただし、今回は直接使います。

```java
public static final DeferredRegister<MapCodec<? extends LevelBasedValue>> LEVEL_BASED_VALUES =
        DeferredRegister.create(Registries.ENCHANTMENT_LEVEL_BASED_VALUE_TYPE, ExampleMod.MOD_ID);

public static final Supplier<MapCodec<? extends LevelBasedValue>> INVERTED_SIGN =
        LEVEL_BASED_VALUES.register("inverted_sign", () -> InvertedSignLevelBasedValue.CODEC);
```

## カスタムのルート条件 {#custom-loot-conditions}

まず、`LootItemCondition` を実装したルートアイテムの条件のクラスを作ります。例として、モブを倒したプレイヤーが特定の経験値レベルを持っている場合にのみ、条件が満たされるようにしたいとします。

```java
public record HasXpLevelCondition(int level) implements LootItemCondition {
    // Add the context we need for this condition. In our case, this will be the xp level the player must have.
    public static final MapCodec<HasXpLevelCondition> CODEC = RecordCodecBuilder.mapCodec(inst -> inst.group(
            Codec.INT.fieldOf("level").forGetter(HasXpLevelCondition::level)
    ).apply(inst, HasXpLevelCondition::new));
    
    // Evaluates the condition here. Get the required loot context parameters from the provided LootContext.
    // In our case, we want the KILLER_ENTITY to have at least our required level.
    @Override
    public boolean test(LootContext context) {
        Entity entity = context.getParamOrNull(LootContextParams.KILLER_ENTITY);
        return entity instanceof Player player && player.experienceLevel >= level; 
    }
    
    // Tell the game what parameters we expect from the loot context. Used in validation.
    @Override
    public Set<LootContextParam<?>> getReferencedContextParams() {
        return ImmutableSet.of(LootContextParams.KILLER_ENTITY);
    }
}
```

条件の Codec を使って、条件のタイプを Registry に登録できます。

```java
public static final DeferredRegister<LootItemConditionType> LOOT_CONDITION_TYPES =
        DeferredRegister.create(Registries.LOOT_CONDITION_TYPE, ExampleMod.MOD_ID);

public static final Supplier<LootItemConditionType> MIN_XP_LEVEL =
        LOOT_CONDITION_TYPES.register("min_xp_level", () -> new LootItemConditionType(HasXpLevelCondition.CODEC));
```

それができたら、条件で `#getType` をオーバーライドし、登録したタイプを返す必要があります。

```java
public record HasXpLevelCondition(int level) implements LootItemCondition {
    // other stuff here

    @Override
    public LootItemConditionType getType() {
        return MIN_XP_LEVEL.get();
    }
}
```

## カスタムのルート関数 {#custom-loot-functions}

まず、`LootItemFunction` を継承した独自のクラスを作ります。`LootItemFunction` は `BiFunction<ItemStack, LootContext, ItemStack>` を継承しているので、既存のアイテムスタックとルートコンテキストを使って、変更した新しいアイテムスタックを返すことになります。ただし、ほとんどすべてのルート関数は、`LootItemFunction` を直接継承せず、代わりに `LootItemConditionalFunction` を継承しています。このクラスには、関数にルート条件を適用する機能が組み込まれており、ルート条件が当てはまる場合にのみ関数が適用されます。例として、指定したレベルのランダムなエンチャントを Item に付けてみましょう。

```java
// Code adapted from vanilla's EnchantRandomlyFunction class.
// LootItemConditionalFunction is an abstract class, not an interface, so we cannot use a record here.
public class RandomEnchantmentWithLevelFunction extends LootItemConditionalFunction {
    // Our context: an optional list of enchantments, and a level.
    private final Optional<HolderSet<Enchantment>> enchantments;
    private final int level;
    // Our codec.
    public static final MapCodec<RandomEnchantmentWithLevelFunction> CODEC =
            // #commonFields adds the conditions field.
            RecordCodecBuilder.mapCodec(inst -> commonFields(inst).and(inst.group(
                    RegistryCodecs.homogeneousList(Registries.ENCHANTMENT).optionalFieldOf("enchantments").forGetter(e -> e.enchantments),
                    Codec.INT.fieldOf("level").forGetter(e -> e.level)
            ).apply(inst, RandomEnchantmentWithLevelFunction::new));
    
    public RandomEnchantmentWithLevelFunction(List<LootItemCondition> conditions, Optional<HolderSet<Enchantment>> enchantments, int level) {
        super(conditions);
        this.enchantments = enchantments;
        this.level = level;
    }
    
    // Run our enchantment application logic. Most of this is copied from EnchantRandomlyFunction#run.
    @Override
    public ItemStack run(ItemStack stack, LootContext context) {
        RandomSource random = context.getRandom();
        List<Holder<Enchantment>> stream = this.enchantments
                .map(HolderSet::stream)
                .orElseGet(() -> context.getLevel().registryAccess().registryOrThrow(Registries.ENCHANTMENT).holders().map(Function.identity()))
                .filter(e -> e.value().canEnchant(stack))
                .toList();
        Optional<Holder<Enchantment>> optional = Util.getRandomSafe(list, random);
        if (optional.isEmpty()) {
            LOGGER.warn("Couldn't find a compatible enchantment for {}", stack);
        } else {
            if (stack.is(Items.BOOK)) {
                stack = new ItemStack(Items.ENCHANTED_BOOK);
            }
            stack.enchant(enchantment, Mth.nextInt(random, enchantment.value().getMinLevel(), enchantment.value().getMaxLevel()));
        }
        return stack;
    }
}
```

そして、関数の Codec を使って、関数のタイプを Registry に登録できます。

```java
public static final DeferredRegister<LootItemFunctionType<?>> LOOT_FUNCTION_TYPES =
        DeferredRegister.create(Registries.LOOT_FUNCTION_TYPE, ExampleMod.MOD_ID);

public static final Supplier<LootItemFunctionType<RandomEnchantmentWithLevelFunction>> RANDOM_ENCHANTMENT_WITH_LEVEL =
        LOOT_FUNCTION_TYPES.register("random_enchantment_with_level", () -> new LootItemFunctionType(RandomEnchantmentWithLevelFunction.CODEC));
```

それができたら、条件で `#getType` をオーバーライドし、登録したタイプを返す必要があります。( 訳注: 原文は「条件」ですが、文脈上はルート関数のクラスを指します )

```java
public class RandomEnchantmentWithLevelFunction extends LootItemConditionalFunction {
    // other stuff here

    @Override
    public LootItemFunctionType getType() {
        return RANDOM_ENCHANTMENT_WITH_LEVEL.get();
    }
}
```

[codec]: ../../../datastorage/codecs.md
[registries]: ../../../concepts/registries.md
