# 進捗 {#advancements}

進捗は、プレイヤーが達成できるクエストのような課題です。進捗は進捗の条件に基づいて付与され、達成時に何らかの動作を実行できます。

新しい進捗は、名前空間の `advancement` サブフォルダに JSON ファイルを作ることで追加できます。たとえば、Mod ID が `examplemod` の Mod に `example_name` という名前の進捗を追加したい場合は、`data/examplemod/advancement/example_name.json` に置きます。進捗の ID は `advancement` ディレクトリからの相対パスになるので、この例では `examplemod:example_name` です。名前は自由に選べ、進捗はゲームによって自動で読み込まれます。Java のコードが必要なのは、新しい条件を追加したい場合や、コードから特定の条件を発火したい場合だけです( 後述 )。

## 仕様 {#specification}

進捗の JSON ファイルには、次の項目を含められます。

- `parent`: この進捗の親の進捗 ID。循環参照は検出され、読み込みが失敗します。任意で、ない場合はこの進捗はルート進捗とみなされます。ルート進捗とは、親が設定されていない進捗です。ルート進捗は、その[進捗ツリー][tree]のルートになります。
- `display`: 進捗の GUI で進捗を表示するためのいくつかのプロパティを持つオブジェクト。任意で、ない場合はこの進捗は表示されませんが、発火させることはできます。
    - `icon`: [アイテムスタックの JSON 表現][itemstackjson]。
    - `text`: 進捗のタイトルに使う[テキストコンポーネント][text]。
    - `description`: 進捗の説明に使う[テキストコンポーネント][text]。
    - `frame`: 進捗の枠の種類。`challenge`、`goal`、`task` を受け付けます。任意で、デフォルトは `task` です。
    - `background`: ツリーの背景に使うテクスチャ。これは `textures` ディレクトリからの相対パスではないので、`textures/` フォルダの接頭辞を含める必要があります。任意で、デフォルトは欠落テクスチャです。ルート進捗でのみ有効です。
    - `show_toast`: 達成時に、右上にトースト通知を表示するかどうか。任意で、デフォルトは true です。
    - `announce_to_chat`: 進捗の達成をチャットで告知するかどうか。任意で、デフォルトは true です。
    - `hidden`: 達成するまで、この進捗とそのすべての子を進捗の GUI に表示しないかどうか。ルート進捗自体には効果がありませんが、その子はすべて隠されます。任意で、デフォルトは false です。
- `criteria`: この進捗が追跡する条件のマップ。各条件は、マップのキーで識別されます。Minecraft が追加している条件のトリガーの一覧は `CriteriaTriggers` クラスに、JSON の仕様は [Minecraft Wiki][triggers] にあります。独自の条件の実装や、コードからの条件の発火については後述を参照してください。
- `requirements`: どの条件が必要かを決めるリストのリスト。これは、OR のリストを AND で結んだものです。言い換えれば、各サブリストで少なくとも 1 つの条件が満たされている必要があります。任意で、デフォルトはすべての条件が必須です。
- `rewards`: この進捗を達成したときに与える報酬を表すオブジェクト。任意で、このオブジェクトの値もすべて任意です。
    - `experience`: プレイヤーに与える経験値の量。
    - `recipes`: 解放する[レシピ][recipe]の ID のリスト。
    - `loot`: 抽選してプレイヤーに与える[ルートテーブル][loottable]のリスト。
    - `function`: 実行する[関数][function]。複数の関数を実行したい場合は、他のすべての関数を実行するラッパーの関数を作ってください。
- `sends_telemetry_event`: この進捗を達成したときに、テレメトリーのデータを収集するかどうかを決めます。実際に何かが起きるのは、`minecraft` 名前空間の場合だけです。任意で、デフォルトは false です。
- `neoforge:conditions`: NeoForge が追加したものです。進捗を読み込むために満たす必要がある[条件][conditions]のリスト。任意です。

### 進捗ツリー {#advancement-trees}

進捗のファイルはディレクトリでグループ分けでき、そうするとゲームは複数の進捗のタブを作ります。1 つの進捗のタブには、ルート進捗の数に応じて、1 つ以上の進捗ツリーを含められます。空の進捗のタブは自動で非表示になります。

:::tip
Minecraft では、タブごとにルート進捗は常に 1 つだけで、ルート進捗は常に `root` と呼ばれています。この慣例に従うことをおすすめします。
:::

## 条件のトリガー {#criteria-triggers}

進捗を解除するには、指定した条件を満たす必要があります。条件はトリガーを通じて追跡されます。トリガーは、対応する動作が起きたときにコードから実行されます( 例: `player_killed_entity` トリガーは、プレイヤーが指定したエンティティを倒したときに実行されます )。進捗がゲームに読み込まれるたびに、定義された条件が読み取られ、リスナーとしてトリガーに追加されます。トリガーが実行されると、対応する条件のリスナーを持つすべての進捗について、達成したかどうかが再チェックされます。進捗が達成されると、リスナーは取り除かれます。

カスタムの条件のトリガーは 2 つの部分からなります。コードで `#trigger` を呼び出して発動するトリガーと、トリガーが条件を満たしたとみなす状況を定義するインスタンスです。トリガーは `SimpleCriterionTrigger<T>` を継承し、インスタンスは `SimpleCriterionTrigger.SimpleInstance` を実装します。ジェネリクスの値 `T` は、トリガーのインスタンスの型を表します。

### `SimpleCriterionTrigger.SimpleInstance`

`SimpleCriterionTrigger.SimpleInstance` は、`criteria` オブジェクトで定義した 1 つの条件を表します。トリガーのインスタンスは、定義された状況を保持し、入力がその状況に一致するかを返す役割を担います。

状況は通常、コンストラクタで渡されます。`SimpleCriterionTrigger.SimpleInstance` インターフェースが必要とする関数は `#player` の 1 つだけで、これはプレイヤーが満たすべき状況を `Optional<ContextAwarePredicate>` として返します。サブクラスが、この型の `player` パラメータを持つ record であれば( 下のように )、自動で生成される `#player` メソッドで十分です。

```java
public record ExampleTriggerInstance(Optional<ContextAwarePredicate> player/*, other parameters here*/)
        implements SimpleCriterionTrigger.SimpleInstance {}
```

通常、トリガーのインスタンスには、インスタンスへの引数から完全な `Criterion<T>` オブジェクトを構築する static なヘルパーメソッドがあります。これにより、データ生成のときにこれらのインスタンスを簡単に作れますが、必須ではありません。

```java
// In this example, EXAMPLE_TRIGGER is a DeferredHolder<CriterionTrigger<?>, ExampleTrigger>.
// See below for how to register triggers.
public static Criterion<ExampleTriggerInstance> instance(ContextAwarePredicate player, ItemPredicate item) {
    return EXAMPLE_TRIGGER.get().createCriterion(new ExampleTriggerInstance(Optional.of(player), item));
}
```

最後に、現在のデータの状態を受け取り、ユーザーが必要な状況を満たしたかどうかを返すメソッドを追加してください。プレイヤーの状況は、`SimpleCriterionTrigger#trigger(ServerPlayer, Predicate)` ですでにチェックされます。ほとんどのトリガーのインスタンスは、このメソッドを `#matches` と呼んでいます。

```java
// Let's assume we have an additional ItemPredicate parameter. This can be whatever you need.
// For example, this could also be a Predicate<LivingEntity>.
public record ExampleTriggerInstance(Optional<ContextAwarePredicate> player, ItemPredicate predicate)
        implements SimpleCriterionTrigger.SimpleInstance {
    // This method is unique for each instance and is as such not overridden.
    // The parameter may be whatever you need to properly match, for example, this could also be a LivingEntity.
    // If you need no context other than the player, this may also take no parameters at all.
    public boolean matches(ItemStack stack) {
        // Since ItemPredicate matches a stack, we use a stack as the input here.
        return this.predicate.test(stack);
    }
}
```

### `SimpleCriterionTrigger`

`SimpleCriterionTrigger<T>` の実装には、2 つの目的があります。トリガーのインスタンスをチェックし、成功したら紐づいたリスナーを実行するメソッドを提供することと、トリガーのインスタンス( `T` )をシリアライズする [Codec][codec] を指定することです。

まず、必要な入力を受け取り、`SimpleCriterionTrigger#trigger` を呼び出して、すべてのリスナーのチェックを正しく処理するメソッドを追加します。ほとんどのトリガーのインスタンスも、このメソッドを `#trigger` と呼んでいます。上のトリガーのインスタンスの例を再利用すると、トリガーは次のようになります。

```java
public class ExampleCriterionTrigger extends SimpleCriterionTrigger<ExampleTriggerInstance> {
    // This method is unique for each trigger and is as such not a method to override
    public void trigger(ServerPlayer player, ItemStack stack) {
        this.trigger(player,
                // The condition checker method within the SimpleCriterionTrigger.SimpleInstance subclass
                triggerInstance -> triggerInstance.matches(stack)
        );
    }
}
```

トリガーは、`Registries.TRIGGER_TYPE` の [Registry][registration] に登録する必要があります。

```java
public static final DeferredRegister<CriterionTrigger<?>> TRIGGER_TYPES =
        DeferredRegister.create(Registries.TRIGGER_TYPE, ExampleMod.MOD_ID);

public static final Supplier<ExampleCriterionTrigger> EXAMPLE_TRIGGER =
        TRIGGER_TYPES.register("example", ExampleCriterionTrigger::new);
```

さらに、トリガーでは `#codec` をオーバーライドして、トリガーのインスタンスをシリアライズ・デシリアライズする [Codec][codec] を定義する必要があります。この Codec は通常、インスタンスの実装の中で定数として作成します。

```java
public record ExampleTriggerInstance(Optional<ContextAwarePredicate> player/*, other parameters here*/)
        implements SimpleCriterionTrigger.SimpleInstance {
    public static final Codec<ExampleTriggerInstance> CODEC = ...;

    // ...
}

public class ExampleTrigger extends SimpleCriterionTrigger<ExampleTriggerInstance> {
    @Override
    public Codec<ExampleTriggerInstance> codec() {
        return ExampleTriggerInstance.CODEC;
    }

    // ...
}
```

`ContextAwarePredicate` と `ItemPredicate` を持つ record の先ほどの例であれば、Codec は次のようになります。

```java
public static final Codec<ExampleTriggerInstace> CODEC = RecordCodecBuilder.create(instance -> instance.group(
        EntityPredicate.ADVANCEMENT_CODEC.optionalFieldOf("player").forGetter(ExampleTriggerInstance::player),
        ItemPredicate.CODEC.fieldOf("item").forGetter(ExampleTriggerInstance::item)
).apply(instance, ExampleTriggerInstance::new));
```

### 条件のトリガーの呼び出し {#calling-criterion-triggers}

チェック対象の動作が行われるたびに、`SimpleCriterionTrigger` のサブクラスで定義した `#trigger` メソッドを呼び出してください。もちろん、`CriteriaTriggers` にあるバニラのトリガーを呼び出すこともできます。

```java
// In some piece of code where the action is being performed
// Again, EXAMPLE_TRIGGER is a supplier for the registered instance of the custom criterion trigger
public void performExampleAction(ServerPlayer player, additionalContextParametersHere) {
    // Run code to perform action here
    EXAMPLE_TRIGGER.get().trigger(player, additionalContextParametersHere);
}
```

## データ生成 {#data-generation}

進捗は、`AdvancementProvider` を使って[データ生成][datagen]できます。`AdvancementProvider` は `AdvancementGenerator` のリストを受け取り、それが `Advancement.Builder` を使って実際に進捗を生成します。

:::warning
Minecraft と NeoForge は、どちらも `AdvancementProvider` という名前のクラスを提供しており、それぞれ `net.minecraft.data.advancements.AdvancementProvider` と `net.neoforged.neoforge.common.data.AdvancementProvider` にあります。NeoForge のクラスは Minecraft のものを改良したもので、常に Minecraft のものではなくこちらを使ってください。以下のドキュメントは、常に NeoForge の `AdvancementProvider` クラスを使う前提です。
:::

まず、`AdvancementProvider` のサブクラスを作ります。

```java
public class MyAdvancementProvider extends AdvancementProvider {
    // Parameters can be obtained from GatherDataEvent.
    public MyAdvancementProvider(PackOutput output,
            CompletableFuture<HolderLookup.Provider> lookupProvider, ExistingFileHelper existingFileHelper) {
        super(output, lookupProvider, existingFileHelper, List.of());
    }
}
```

次のステップは、リストをジェネレーターで埋めることです。そのために、1 つ以上のジェネレーターを static クラスとして追加し、それぞれのインスタンスを、コンストラクタの引数にある現在は空のリストに追加します。

```java
public class MyAdvancementProvider extends AdvancementProvider {
    public MyAdvancementProvider(PackOutput output, CompletableFuture<HolderLookup.Provider> lookupProvider, ExistingFileHelper existingFileHelper) {
        // Add an instance of our generator to the list parameter. This can be done as many times as you want.
        // Having multiple generators is purely for organization, all functionality can be achieved with a single generator.
        super(output, lookupProvider, existingFileHelper, List.of(new MyAdvancementGenerator()));
    }

    private static final class MyAdvancementGenerator implements AdvancementProvider.AdvancementGenerator {
        @Override
        public void generate(HolderLookup.Provider registries, Consumer<AdvancementHolder> saver, ExistingFileHelper existingFileHelper) {
            // Generate your advancements here.
        }
    }
}
```

進捗を生成するには、`Advancement.Builder` を使います。

```java
// All methods follow the builder pattern, meaning that chaining is possible and encouraged.
// For better readability of the explanations, chaining will not be done here.

// Create an advancement builder using the static #advancement() method.
// Using #advancement() automatically enables telemetry events. If you do not want this,
// #recipeAdvancement() can be used instead, there are no other functional differences.
Advancement.Builder builder = Advancement.Builder.advancement();

// Sets the parent of the advancement. You can use another advancement you have already generated,
// or create a placeholder advancement using the static AdvancementSubProvider#createPlaceholder method.
builder.parent(AdvancementSubProvider.createPlaceholder("minecraft:story/root"));

// Sets the display properties of the advancement. This can either be a DisplayInfo object,
// or pass in the values directly. If values are passed in directly, a DisplayInfo object will be created for you.
builder.display(
        // The advancement icon. Can be an ItemStack or an ItemLike.
        new ItemStack(Items.GRASS_BLOCK),
        // The advancement title and description. Don't forget to add translations for these!
        Component.translatable("advancements.examplemod.example_advancement.title"),
        Component.translatable("advancements.examplemod.example_advancement.description"),
        // The background texture. Use null if you don't want a background texture (for non-root advancements).
        null,
        // The frame type. Valid values are AdvancementType.TASK, CHALLENGE, or GOAL.
        AdvancementType.GOAL,
        // Whether to show the advancement toast or not.
        true,
        // Whether to announce the advancement into chat or not.
        true,
        // Whether the advancement should be hidden or not.
        false
);

// An advancement reward builder. Can be created with any of the four reward types, and further rewards
// can be added using the methods prefixed with add. This can also be built beforehand,
// and the resulting AdvancementRewards can then be reused across multiple advancement builders.
builder.rewards(
    // Alternatively, use addExperience() to add to an existing builder.
    AdvancementRewards.Builder.experience(100)
    // Alternatively, use loot() to create a new builder.
    .addLootTable(ResourceKey.create(Registries.LOOT_TABLE, ResourceLocation.fromNamespaceAndPath("minecraft", "chests/igloo")))
    // Alternatively, use recipe() to create a new builder.
    .addRecipe(ResourceLocation.fromNamespaceAndPath("minecraft", "iron_ingot"))
    // Alternatively, use function() to create a new builder.
    .runs(ResourceLocation.fromNamespaceAndPath("examplemod", "example_function"))
);

// Adds a criterion with the given name to the advancement. Use the corresponding trigger instance's static method.
builder.addCriterion("pickup_dirt", InventoryChangeTrigger.TriggerInstance.hasItems(Items.DIRT));

// Adds a requirements handler. Minecraft natively provides allOf() and anyOf(), more complex requirements
// must be implemented manually. Only has an effect with two or more criteria.
builder.requirements(AdvancementRequirements.allOf(List.of("pickup_dirt")));

// Save the advancement to disk, using the given resource location. This returns an AdvancementHolder,
// which may be stored in a variable and used as a parent by other advancement builders.
builder.save(saver, ResourceLocation.fromNamespaceAndPath("examplemod", "example_advancement"), existingFileHelper);
```

もちろん、プロバイダを `GatherDataEvent` に追加するのを忘れないでください。

```java
@SubscribeEvent // on the mod event bus
public static void gatherData(GatherDataEvent event) {
    DataGenerator generator = event.getGenerator();
    PackOutput output = generator.getPackOutput();
    CompletableFuture<HolderLookup.Provider> lookupProvider = event.getLookupProvider();
    ExistingFileHelper existingFileHelper = event.getExistingFileHelper();

    // other providers here
    generator.addProvider(
            event.includeServer(),
            new MyAdvancementProvider(output, lookupProvider, existingFileHelper)
    );
}
```

[codec]: ../../datastorage/codecs.md
[conditions]: conditions.md
[datagen]: ../index.md#data-generation
[function]: https://minecraft.wiki/w/Function_(Java_Edition)
[itemstackjson]: ../../items/index.md#json-representation
[loottable]: loottables/index.md
[recipe]: recipes/index.md
[registration]: ../../concepts/registries.md#methods-for-registering
[root]: #root-advancements
[text]: ../client/i18n.md#components
[tree]: #advancement-trees
[triggers]: https://minecraft.wiki/w/Advancement/JSON_format#List_of_triggers
