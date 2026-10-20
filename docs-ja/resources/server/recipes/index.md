# レシピ {#recipes}

レシピは、Minecraft のワールド内で、一連のオブジェクトを別のオブジェクトに変換するための仕組みです。Minecraft はこのシステムを純粋にアイテムの変換にしか使っていませんが、システム自体はブロックやエンティティなど、どんな種類のオブジェクトでも変換できるように作られています。ほとんどすべてのレシピはレシピのデータファイルを使います。この記事では、特に明記しない限り「レシピ」はデータ駆動のレシピを指すものとします。

レシピのデータファイルは `data/<namespace>/recipe/<path>.json` に置かれます。たとえば、レシピ `minecraft:diamond_block` は `data/minecraft/recipe/diamond_block.json` にあります。

## 用語 {#terminology}

- **レシピ JSON**（ または**レシピファイル** ）は、`RecipeManager` によって読み込まれ、保持される JSON ファイルです。レシピの種類、入力と出力、さらに追加情報（ 例: 処理時間 ）などの情報を含みます。
- **`Recipe`** は、すべての JSON フィールドをコード上で表現したものに加えて、マッチングのロジック（ 「この入力はレシピに一致するか？」 ）やその他のいくつかのプロパティを保持します。
- **`RecipeInput`** は、レシピに入力を提供する型です。`CraftingInput` や `SingleRecipeInput`（ かまどなど用 ）といった、いくつかのサブクラスがあります。
- **レシピの材料**（ または単に**材料** ）は、レシピに対する 1 つの入力です（ 一方、`RecipeInput` は一般に、レシピの材料と照合される入力の集まりを表します ）。材料は非常に強力なシステムなので、[専用の記事][ingredients]で説明しています。
- **`RecipeManager`** は、読み込まれたすべてのレシピを保持する、サーバー上のシングルトンのフィールドです。
- **`RecipeSerializer`** は、基本的には [`MapCodec`][codec] と [`StreamCodec`][streamcodec] をまとめたラッパーで、どちらもシリアライズに使われます。
- **`RecipeType`** は、`Recipe` に対応する、登録された種類です。主にレシピを種類で検索するときに使われます。経験則として、クラフト用のコンテナが異なれば、異なる `RecipeType` を使うべきです。たとえば、`minecraft:crafting` のレシピタイプは、`minecraft:crafting_shaped` と `minecraft:crafting_shapeless` のレシピシリアライザに加え、特殊なクラフトのシリアライザもカバーしています。
- **レシピの[進捗][advancement]**は、レシピブックでレシピを解放する役割を持つ進捗です。必須ではなく、プレイヤーにはレシピビューア系の Mod が好まれて普段はあまり気にされませんが、[レシピのデータプロバイダ][datagen]が自動で生成してくれるので、そのまま使うことをおすすめします。
- **`RecipeBuilder`** は、データ生成で JSON のレシピを作成するために使われます。
- **レシピファクトリ**は、`RecipeBuilder` から `Recipe` を作成するために使われるメソッド参照です。コンストラクタへの参照、static なビルダーメソッド、またはこの目的のために専用に作られた関数型インターフェース（ 多くの場合 `Factory` という名前 ）のいずれかです。

## JSON の仕様 {#json-specification}

レシピファイルの内容は、選択した種類によって大きく異なります。すべてのレシピファイルに共通するのは、`type` と [`neoforge:conditions`][conditions] のプロパティです。

```json5
{
    // The recipe type. This maps to an entry in the recipe serializer registry.
    "type": "minecraft:crafting_shaped",
    // A list of data load conditions. Optional, NeoForge-added. See the article linked above for more information.
    "neoforge:conditions": [ /*...*/ ]
}
```

Minecraft が提供する種類の一覧は、[組み込みのレシピタイプの記事][builtin]で確認できます。Mod は[独自のレシピタイプを定義する][customrecipes]こともできます。

## レシピを使う {#using-recipes}

レシピは `RecipeManager` クラスを通じて読み込み・保持・取得されます。このクラスは `ServerLevel#getRecipeManager` で取得できます。`ServerLevel` が手元にない場合は `ServerLifecycleHooks.getCurrentServer()#getRecipeManager` で取得できます。クライアントも表示のために `RecipeManager` の完全なコピーを持っていますが、同期の問題を避けるため、レシピのロジックは常にサーバーで実行するようにしてください。

レシピを取得する最も簡単な方法は、ID で取得することです。

```java
RecipeManager recipes = serverLevel.getRecipeManager();
// RecipeHolder<?> is a record of the recipe id and the recipe itself.
Optional<RecipeHolder<?>> optional = recipes.byId(ResourceLocation.withDefaultNamespace("diamond_block"));
optional.map(RecipeHolder::value).ifPresent(recipe -> {
        // Do whatever you want to do with the recipe here. Be aware that the recipe may be of any type.
});
```

より実用的な方法は、`RecipeInput` を構築し、それに一致するレシピを取得しようとすることです。この例では、`CraftingInput#of` を使って、ダイヤモンドブロックを 1 つ含む `CraftingInput` を作成します。これは不定形の入力を作成します。定形の入力の場合は代わりに `CraftingInput#ofPositioned` を使い、その他の入力では別の `RecipeInput` を使います（ たとえば、かまどのレシピでは一般に `new SingleRecipeInput` を使います ）。

```java
RecipeManager recipes = serverLevel.getRecipeManager();
// Construct a RecipeInput, as required by the recipe. For example, construct a CraftingInput for a crafting recipe.
// The parameters are width, height and items, respectively.
CraftingInput input = CraftingInput.of(1, 1, List.of(Items.DIAMOND_BLOCK));
// The generic wildcard on the recipe holder should then extend Recipe<CraftingInput>.
// This allows for more type safety later on.
Optional<RecipeHolder<? extends Recipe<CraftingInput>>> optional = recipes.getRecipeFor(
        // The recipe type to get the recipe for. In our case, we use the crafting type.
        RecipeTypes.CRAFTING,
        // Our recipe input.
        input,
        // Our level context.
        serverLevel
);
// This returns the diamond block -> 9 diamonds recipe (unless a datapack changes that recipe).
optional.map(RecipeHolder::value).ifPresent(recipe -> {
        // Do whatever you want here. Note that the recipe is now a Recipe<CraftingInput> instead of a Recipe<?>.
});
```

あるいは、入力に一致するレシピのリスト（ 空の場合もあります ）を取得することもできます。これは、複数のレシピが一致すると十分に考えられる場合に特に便利です。

```java
RecipeManager recipes = serverLevel.getRecipeManager();
CraftingInput input = CraftingInput.of(1, 1, List.of(Items.DIAMOND_BLOCK));
// These are not Optionals, and can be used directly. However, the list may be empty, indicating no matching recipes.
List<RecipeHolder<? extends Recipe<CraftingInput>>> list = recipes.getRecipesFor(
        // Same parameters as above.
        RecipeTypes.CRAFTING, input, serverLevel
);
```

正しいレシピの入力が得られたら、次はレシピの出力も取得したいところです。これは `Recipe#assemble` を呼び出すことで行います。

```java
RecipeManager recipes = serverLevel.getRecipeManager();
CraftingInput input = CraftingInput.of(...);
Optional<RecipeHolder<? extends Recipe<CraftingInput>>> optional = recipes.getRecipeFor(...);
// Use ItemStack.EMPTY as a fallback.
ItemStack result = optional
        .map(RecipeHolder::value)
        .map(e -> e.assemble(input, serverLevel.registryAccess()))
        .orElse(ItemStack.EMPTY);
```

必要であれば、ある種類のすべてのレシピを順に処理することもできます。次のように行います。

```java
RecipeManager recipes = serverLevel.getRecipeManager();
// Like before, pass the desired recipe type.
List<RecipeHolder<?>> list = recipes.getAllRecipesFor(RecipeTypes.CRAFTING);
```

## その他のレシピの仕組み {#other-recipe-mechanisms}

バニラのいくつかの仕組みは、一般にはレシピと見なされていますが、コード上では異なる方法で実装されています。これは多くの場合、歴史的な経緯によるものか、「レシピ」が他のデータ（ 例: [タグ][tags] ）から構築されるためです。

:::warning
レシピビューア系の Mod は、一般にこれらのレシピを認識しません。これらの Mod への対応は手動で追加する必要があります。詳しくは、該当する Mod のドキュメントを参照してください。
:::

### 金床のレシピ {#anvil-recipes}

金床には 2 つの入力スロットと 1 つの出力スロットがあります。バニラでの用途は道具の修理、合成、名前の変更だけで、それぞれに特別な処理が必要なため、レシピファイルは用意されていません。ただし、`AnvilUpdateEvent` を使ってこのシステムを拡張できます。この [Event][event] では、入力（ 左の入力スロット ）と素材（ 右の入力スロット ）を取得でき、出力のアイテムスタック、経験値のコスト、消費する素材の数を設定できます。また、Event を[キャンセル][cancel]することで、処理全体を止めることもできます。

```java
// This example allows repairing a stone pickaxe with a full stack of dirt, consuming half the stack, for 3 levels.
@SubscribeEvent // on the game event bus
public static void onAnvilUpdate(AnvilUpdateEvent event) {
    ItemStack left = event.getLeft();
    ItemStack right = event.getRight();
    if (left.is(Items.STONE_PICKAXE) && right.is(Items.DIRT) && right.getCount() >= 64) {
        event.setOutput(Items.STONE_PICKAXE);
        event.setMaterialCost(32);
        event.setCost(3);
    }
}
```

### 醸造 {#brewing}

[ステータス効果とポーションの記事の醸造の章][brewing]を参照してください。

## カスタムレシピ {#custom-recipes}

カスタムレシピを追加するには、少なくとも `Recipe`、`RecipeType`、`RecipeSerializer` の 3 つが必要です。実装する内容によっては、既存のサブクラスを再利用できない場合に、独自の `RecipeInput` も必要になることがあります。

例として、そしてさまざまな機能を紹介するために、ここではレシピ駆動の仕組みを実装します。これは、ワールド内の `BlockState` を特定のアイテムで右クリックすると、その `BlockState` を壊して結果のアイテムをドロップするというものです。

### レシピの入力 {#the-recipe-input}

まず、レシピに何を入れたいかを定義することから始めましょう。重要なのは、レシピの入力は、プレイヤーがいま実際に使っている入力を表すという点です。そのため、ここではタグや材料は使わず、手元にある実際のアイテムスタックやブロックステートを使います。

```java
// Our inputs are a BlockState and an ItemStack.
public record RightClickBlockInput(BlockState state, ItemStack stack) implements RecipeInput {
    // Method to get an item from a specific slot. We have one stack and no concept of slots, so we just assume
    // that slot 0 holds our item, and throw on any other slot. (Taken from SingleRecipeInput#getItem.)
    @Override
    public ItemStack getItem(int slot) {
        if (slot != 0) throw new IllegalArgumentException("No item for index " + slot);
        return this.stack();
    }

    // The slot size our input requires. Again, we don't really have a concept of slots, so we just return 1
    // because we have one item stack involved. Inputs with multiple items should return the actual count here.
    @Override
    public int size() {
        return 1;
    }
}
```

レシピの入力は必要に応じて作成されるので、登録やシリアライズは一切必要ありません。必ずしも独自のものを作る必要はなく、多くの用途ではバニラのもの（ `CraftingInput`、`SingleRecipeInput`、`SmithingRecipeInput` ）で十分です。

さらに NeoForge は `RecipeWrapper` という入力を提供しています。これは、コンストラクタに渡された `IItemHandler` に対して `#getItem` と `#size` の呼び出しをラップするものです。つまり、チェストのようなグリッド型のインベントリであれば何でも、`RecipeWrapper` で包むことでレシピの入力として使えます。

### レシピクラス {#the-recipe-class}

入力ができたので、レシピそのものに取りかかりましょう。これはレシピのデータを保持し、マッチングとレシピの結果を返す処理も担当します。そのため、通常はカスタムレシピの中で最も長いクラスになります。

```java
// The generic parameter for Recipe<T> is our RightClickBlockInput from above.
public class RightClickBlockRecipe implements Recipe<RightClickBlockInput> {
    // An in-code representation of our recipe data. This can be basically anything you want.
    // Common things to have here is a processing time integer of some kind, or an experience reward.
    // Note that we now use an ingredient instead of an item stack for the input.
    private final BlockState inputState;
    private final Ingredient inputItem;
    private final ItemStack result;

    // Add a constructor that sets all properties. 
    public RightClickBlockRecipe(BlockState inputState, Ingredient inputItem, ItemStack result) {
        this.inputState = inputState;
        this.inputItem = inputItem;
        this.result = result;
    }

    // A list of our ingredients. Does not need to be overridden if you have no ingredients
    // (the default implementation returns an empty list here). It makes sense to cache larger lists in a field.
    @Override
    public NonNullList<Ingredient> getIngredients() {
        NonNullList<Ingredient> list = NonNullList.create();
        list.add(this.inputItem);
        return list;
    }

    // Grid-based recipes should return whether their recipe can fit in the given dimensions.
    // We don't have a grid, so we just return if any item can be placed in there.
    @Override
    public boolean canCraftInDimensions(int width, int height) {
        return width * height >= 1;
    }

    // Check whether the given input matches this recipe. The first parameter matches the generic.
    // We check our blockstate and our item stack, and only return true if both match.
    @Override
    public boolean matches(RightClickBlockInput input, Level level) {
        return this.inputState == input.state() && this.inputItem.test(input.stack());
    }

    // Return an UNMODIFIABLE version of your result here. The result of this method is mainly intended
    // for the recipe book, and commonly used by JEI and other recipe viewers as well.
    @Override
    public ItemStack getResultItem(HolderLookup.Provider registries) {
        return this.result;
    }

    // Return the result of the recipe here, based on the given input. The first parameter matches the generic.
    // IMPORTANT: Always call .copy() if you use an existing result! If you don't, things can and will break,
    // as the result exists once per recipe, but the assembled stack is created each time the recipe is crafted.
    @Override
    public ItemStack assemble(RightClickBlockInput input, HolderLookup.Provider registries) {
        return this.result.copy();
    }

    // This example outlines the most important methods. There is a number of other methods to override.
    // Check the class definition of Recipe to view them all.
}
```

### レシピタイプ {#the-recipe-type}

次はレシピタイプです。レシピタイプには名前以外のデータが関連付けられていないので、これはかなり簡単です。レシピタイプはレシピシステムのうち[登録][registry]が必要な 2 つの部分の 1 つなので、他のすべての Registry と同じように、`DeferredRegister` を作成してそこに登録します。

```java
public static final DeferredRegister<RecipeType<?>> RECIPE_TYPES =
        DeferredRegister.create(Registries.RECIPE_TYPE, ExampleMod.MOD_ID);

public static final Supplier<RecipeType<RightClickBlockRecipe>> RIGHT_CLICK_BLOCK =
        RECIPE_TYPES.register(
                "right_click_block",
                // We need the qualifying generic here due to generics being generics.
                () -> RecipeType.<RightClickBlockRecipe>simple(ResourceLocation.fromNamespaceAndPath(ExampleMod.MOD_ID, "right_click_block"))
        );
```

レシピタイプを登録したら、次のようにレシピで `#getType` をオーバーライドする必要があります。

```java
public class RightClickBlockRecipe implements Recipe<RightClickBlockInput> {
    // other stuff here

    @Override
    public RecipeType<?> getType() {
        return RIGHT_CLICK_BLOCK.get();
    }
}
```

### レシピシリアライザ {#the-recipe-serializer}

レシピシリアライザは 2 つのコーデック（ マップコーデックとストリームコーデック ）を提供し、それぞれ JSON との間、ネットワークとの間のシリアライズに使われます。このセクションではコーデックの仕組みについて詳しくは説明しません。詳しくは[マップコーデック][codec]と[ストリームコーデック][streamcodec]を参照してください。

レシピシリアライザはかなり大きくなることがあるため、バニラではこれを別のクラスに分けています。この慣例に従うことは推奨されますが、必須ではありません。小さなシリアライザは、レシピクラスのフィールド内で匿名クラスとして定義されることもよくあります。ここではよい慣例に従い、コーデックを保持する別のクラスを作成します。

```java
// The generic parameter is our recipe class.
// Note: This assumes that simple RightClickBlockRecipe#getInputState, #getInputItem and #getResult getters
// are available, which were omitted from the code above.
public class RightClickBlockRecipeSerializer implements RecipeSerializer<RightClickBlockRecipe> {
    public static final MapCodec<RightClickBlockRecipe> CODEC = RecordCodecBuilder.mapCodec(inst -> inst.group(
            BlockState.CODEC.fieldOf("state").forGetter(RightClickBlockRecipe::getInputState),
            Ingredient.CODEC.fieldOf("ingredient").forGetter(RightClickBlockRecipe::getInputItem),
            ItemStack.CODEC.fieldOf("result").forGetter(RightClickBlockRecipe::getResult)
    ).apply(inst, RightClickBlockRecipe::new));
    public static final StreamCodec<RegistryFriendlyByteBuf, RightClickBlockRecipe> STREAM_CODEC =
            StreamCodec.composite(
                    ByteBufCodecs.idMapper(Block.BLOCK_STATE_REGISTRY), RightClickBlockRecipe::getInputState,
                    Ingredient.CONTENTS_STREAM_CODEC, RightClickBlockRecipe::getInputItem,
                    ItemStack.STREAM_CODEC, RightClickBlockRecipe::getResult,
                    RightClickBlockRecipe::new
            );

    // Return our map codec.
    @Override
    public MapCodec<RightClickBlockRecipe> codec() {
        return CODEC;
    }

    // Return our stream codec.
    @Override
    public StreamCodec<RegistryFriendlyByteBuf, RightClickBlockRecipe> streamCodec() {
        return STREAM_CODEC;
    }
}
```

種類と同じように、シリアライザを登録します。

```java
public static final DeferredRegister<RecipeSerializer<?>> RECIPE_SERIALIZERS =
        DeferredRegister.create(Registries.RECIPE_SERIALIZER, ExampleMod.MOD_ID);

public static final Supplier<RecipeSerializer<RightClickBlockRecipe>> RIGHT_CLICK_BLOCK =
        RECIPE_SERIALIZERS.register("right_click_block", RightClickBlockRecipeSerializer::new);
```

同様に、次のようにレシピで `#getSerializer` もオーバーライドする必要があります。

```java
public class RightClickBlockRecipe implements Recipe<RightClickBlockInput> {
    // other stuff here

    @Override
    public RecipeSerializer<?> getSerializer() {
        return RIGHT_CLICK_BLOCK.get();
    }
}
```

### クラフトの仕組み {#the-crafting-mechanic}

これでレシピのすべての部品がそろったので、レシピの JSON をいくつか作成し（ その方法は[データ生成][datagen]のセクションを参照してください ）、上で説明したようにレシピマネージャーにレシピを問い合わせることができます。そのあとレシピをどう使うかは自由です。よくある用途としては、レシピを処理できる機械があり、実行中のレシピをフィールドに保持するというものがあります。

ただしこの例では、アイテムでブロックを右クリックしたときにレシピを適用したいと考えています。これは [Event ハンドラ][event]を使って行います。これは実装例の 1 つにすぎず、（ サーバーで実行する限り ）好きなように変更してかまいません。

```java
@SubscribeEvent // on the game event bus
public static void useItemOnBlock(UseItemOnBlockEvent event) {
    // Skip if we are not in the block-dictated phase of the event. See the event's javadocs for details.
    if (event.getUsePhase() != UseItemOnBlockEvent.UsePhase.BLOCK) return;
    // Get the parameters we need.
    UseOnContext context = event.getUseOnContext();
    Level level = context.getLevel();
    BlockPos pos = context.getClickedPos();
    BlockState blockState = level.getBlockState(pos);
    ItemStack itemStack = context.getItemInHand();
    RecipeManager recipes = level.getRecipeManager();
    // Create an input and query the recipe.
    RightClickBlockInput input = new RightClickBlockInput(blockState, itemStack);
    Optional<RecipeHolder<? extends Recipe<CraftingInput>>> optional = recipes.getRecipeFor(
            // The recipe type.
            RIGHT_CLICK_BLOCK,
            input,
            level
    );
    ItemStack result = optional
            .map(RecipeHolder::value)
            .map(e -> e.assemble(input, level.registryAccess()))
            .orElse(ItemStack.EMPTY);
    // If there is a result, break the block and drop the result in the world.
    if (!result.isEmpty()) {
        level.removeBlock(pos, false);
        // If the level is not a server level, don't spawn the entity.
        if (!level.isClientSide()) {
            ItemEntity entity = new ItemEntity(level,
                    // Center of pos.
                    pos.getX() + 0.5, pos.getY() + 0.5, pos.getZ() + 0.5,
                    result);
            level.addFreshEntity(entity);
        }
        // Cancel the event to stop the interaction pipeline.
        event.cancelWithResult(ItemInteractionResult.sidedSuccess(level.isClientSide));
    }
}
```

### クラフトグリッドのサイズを拡張する {#extending-the-crafting-grid-size}

`ShapedRecipePattern` クラスは、定形クラフトレシピのメモリ上の表現を保持するクラスで、3x3 スロットというハードコードされた上限があります。そのため、バニラの定形クラフトのレシピタイプを再利用しつつ、より大きな作業台を追加したい Mod の妨げになります。この問題を解決するため、NeoForge は `ShapedRecipePattern#setCraftingSize(int width, int height)` という static メソッドをパッチで追加しており、これで上限を引き上げられます。これは `FMLCommonSetupEvent` の間に呼び出す必要があります。ここでは最も大きい値が採用されるので、たとえばある Mod が 4x6 の作業台を、別の Mod が 6x5 の作業台を追加した場合、結果の値は 6x6 になります。

:::danger
`ShapedRecipePattern#setCraftingSize` はスレッドセーフではありません。`event#enqueueWork` の呼び出しで包む必要があります。
:::

## データ生成 {#data-generation}

他の多くの JSON ファイルと同じように、レシピもデータ生成できます。レシピの場合は、`RecipeProvider` クラスを継承し、`#buildRecipes` をオーバーライドします。

```java
public class MyRecipeProvider extends RecipeProvider {
    // Get the parameters from GatherDataEvent.
    public MyRecipeProvider(PackOutput output, CompletableFuture<HolderLookup.Provider> lookupProvider) {
        super(output, lookupProvider);
    }

    @Override
    protected void buildRecipes(RecipeOutput output) {
        // Add your recipes here.
    }
}
```

注目すべきは `#buildRecipes` の `RecipeOutput` パラメータです。Minecraft はこのオブジェクトを使って、レシピの進捗を自動で生成します。さらに NeoForge は `RecipeOutput` に[条件][conditions]のサポートを注入しており、`#withConditions` で利用できます。

レシピ自体は、一般に `RecipeBuilder` のサブクラスを通じて追加します。バニラのすべてのレシピビルダーを列挙することはこの記事の範囲を超えますが（ それらは[組み込みのレシピタイプの記事][builtin]で説明しています ）、独自のビルダーを作成する方法は[後述][customdatagen]します。

他のすべてのデータプロバイダと同じように、レシピプロバイダは次のように `GatherDataEvent` に登録する必要があります。

```java
@SubscribeEvent // on the mod event bus
public static void gatherData(GatherDataEvent event) {
    DataGenerator generator = event.getGenerator();
    PackOutput output = generator.getPackOutput();
    CompletableFuture<HolderLookup.Provider> lookupProvider = event.getLookupProvider();

    // other providers here
    generator.addProvider(
            event.includeServer(),
            new MyRecipeProvider(output, lookupProvider)
    );
}
```

レシピプロバイダには、よくある場面のためのヘルパーも用意されています。たとえば `twoByTwoPacker`（ 2x2 のブロックのレシピ用 ）、`threeByThreePacker`（ 3x3 のブロックのレシピ用 ）、`nineBlockStorageRecipes`（ 3x3 のブロックのレシピと、1 ブロックから 9 アイテムへのレシピ用 ）などです。

### カスタムレシピのデータ生成 {#data-generation-for-custom-recipes}

独自のレシピシリアライザ用のレシピビルダーを作成するには、`RecipeBuilder` とそのメソッドを実装する必要があります。一部をバニラからコピーした一般的な実装は、次のようになります。

```java
// This class is abstract because there is a lot of per-recipe-serializer logic.
// It serves the purpose of showing the common part of all (vanilla) recipe builders.
public abstract class SimpleRecipeBuilder implements RecipeBuilder {
    // Make the fields protected so our subclasses can use them.
    protected final ItemStack result;
    protected final Map<String, Criterion<?>> criteria = new LinkedHashMap<>();
    @Nullable
    protected String group;

    // It is common for constructors to accept the result item stack.
    // Alternatively, static builder methods are also possible.
    public SimpleRecipeBuilder(ItemStack result) {
        this.result = result;
    }

    // This method adds a criterion for the recipe advancement.
    @Override
    public SimpleRecipeBuilder unlockedBy(String name, Criterion<?> criterion) {
        this.criteria.put(name, criterion);
        return this;
    }

    // This method adds a recipe book group. If you do not want to use recipe book groups,
    // remove the this.group field and make this method no-op (i.e. return this).
    @Override
    public SimpleRecipeBuilder group(@Nullable String group) {
        this.group = group;
        return this;
    }

    // Vanilla wants an Item here, not an ItemStack. You still can and should use the ItemStack
    // for serializing the recipes.
    @Override
    public Item getResult() {
        return this.result.getItem();
    }
}
```

これでレシピビルダーの土台ができました。レシピシリアライザに依存する部分に進む前に、まずレシピファクトリを何にするかを考えておきましょう。この例では、コンストラクタを直接使うのが理にかなっています。それ以外の状況では、static なヘルパーや小さな関数型インターフェースを使うのがよいでしょう。これは、1 つのビルダーを複数のレシピクラスで使う場合に特に重要です。

`RightClickBlockRecipe::new` をレシピファクトリとして使い、上の `SimpleRecipeBuilder` クラスを再利用すると、`RightClickBlockRecipe` 用に次のようなレシピビルダーを作成できます。

```java
public class RightClickBlockRecipeBuilder extends SimpleRecipeBuilder {
    private final BlockState inputState;
    private final Ingredient inputItem;

    // Since we have exactly one of each input, we pass them to the constructor.
    // Builders for recipe serializers that have ingredient lists of some sort would usually
    // initialize an empty list and have #addIngredient or similar methods instead.
    public RightClickBlockRecipeBuilder(ItemStack result, BlockState inputState, Ingredient inputItem) {
        super(result);
        this.inputState = inputState;
        this.inputItem = inputItem;
    }

    // Saves a recipe using the given RecipeOutput and id. This method is defined in the RecipeBuilder interface.
    @Override
    public void save(RecipeOutput output, ResourceLocation id) {
        // Build the advancement.
        Advancement.Builder advancement = output.advancement()
                .addCriterion("has_the_recipe", RecipeUnlockedTrigger.unlocked(id))
                .rewards(AdvancementRewards.Builder.recipe(id))
                .requirements(AdvancementRequirements.Strategy.OR);
        this.criteria.forEach(advancement::addCriterion);
        // Our factory parameters are the result, the block state, and the ingredient.
        RightClickBlockRecipe recipe = new RightClickBlockRecipe(this.inputState, this.inputItem, this.result);
        // Pass the id, the recipe, and the recipe advancement into the RecipeOutput.
        output.accept(id, recipe, advancement.build(id.withPrefix("recipes/")));
    }
}
```

これで、データ生成の際に、他のビルダーと同じように自分のレシピビルダーを呼び出せます。

```java
@Override
protected void buildRecipes(RecipeOutput output) {
    new RightClickRecipeBuilder(
            // Our constructor parameters. This example adds the ever-popular dirt -> diamond conversion.
            new ItemStack(Items.DIAMOND),
            Blocks.DIRT.defaultBlockState(),
            Ingredient.of(Items.APPLE)
    )
            .unlockedBy("has_apple", has(Items.APPLE))
            .save(output);
    // other recipe builders here
}
```

:::note
特にレシピビルダーが 1 つか 2 つしかない場合は、`SimpleRecipeBuilder` を `RightClickBlockRecipeBuilder`（ または独自のレシピビルダー ）に統合することもできます。ここでの抽象化は、ビルダーのどの部分がレシピに依存し、どの部分が依存しないかを示すためのものです。
:::

[advancement]: ../advancements.md
[brewing]: ../../../items/mobeffects.md
[builtin]: builtin.md
[cancel]: ../../../concepts/events.md#cancellable-events
[codec]: ../../../datastorage/codecs.md
[conditions]: ../conditions.md
[customdatagen]: #data-generation-for-custom-recipes
[customrecipes]: #custom-recipes
[datagen]: #data-generation
[event]: ../../../concepts/events.md
[ingredients]: ingredients.md
[manager]: #using-recipes
[registry]: ../../../concepts/registries.md
[streamcodec]: ../../../networking/streamcodecs.md
[tags]: ../tags.md
