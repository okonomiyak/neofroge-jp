# Item {#items}

Block とともに、Item は Minecraft の重要な要素です。Block が周囲の世界を形作るのに対し、Item はインベントリの中に存在します。

## そもそも Item とは {#what-even-is-an-item}

Item の作成に進む前に、Item とは実際に何なのか、そして [Block][block] などと何が違うのかを理解しておくことが重要です。例を使って説明しましょう。

- ワールドで土の Block を見つけ、それを掘りたいとします。これはワールドに設置されているので **Block** です( 実際には Block ではなくブロックステートです。詳しくは[ブロックステートの記事][blockstates]を参照してください )。
    - すべての Block が、壊したときに自分自身をドロップするわけではありません( 例: 葉 )。詳しくは[ルートテーブル][loottables]の記事を参照してください。
- [Block を掘る][breaking]と、Block は取り除かれ( 空気の Block に置き換えられ )、土がドロップします。ドロップした土はアイテム**エンティティ**です。つまり、他のエンティティ( ブタ、ゾンビ、矢など )と同様に、水に押されて動いたり、火や溶岩で燃えたりします。
- 土のアイテムエンティティを拾うと、インベントリの中で**アイテムスタック**になります。アイテムスタックとは、簡単に言えば、スタック数などの追加情報を持つ Item のインスタンスです。
- アイテムスタックの背後には、対応する **Item**( これから作るもの )があります。Item は、すべてのアイテムスタックの初期値となるデフォルト情報を含む[データコンポーネント][datacomponents]を持っています( たとえば、鉄の剣はすべて最大耐久値が 250 です )。一方、アイテムスタックはそのデータコンポーネントを変更できるため、同じ Item の 2 つのスタックが異なる情報を持てます( たとえば、ある鉄の剣は残り 100 回使え、別の鉄の剣は残り 200 回使える )。何が Item で行われ、何がアイテムスタックで行われるかについては、この先を読んでください。
    - Item とアイテムスタックの関係は、[Block][block] と[ブロックステート][blockstates]の関係とおおむね同じで、ブロックステートの背後にも常に Block があります。あまり正確な比較ではありませんが( たとえば、アイテムスタックはシングルトンではありません )、ここでの考え方の基本をつかむにはよいでしょう。

## Item の作成 {#creating-an-item}

Item が何かわかったので、作ってみましょう！

基本的な Block と同様に、特別な機能が不要な基本的な Item( 棒や砂糖など )には、`Item` クラスを直接使えます。そのためには、登録時に `Item.Properties` を引数として `Item` をインスタンス化します。この `Item.Properties` は `Item.Properties#of` で作成でき、メソッドを呼び出してカスタマイズできます。

- `stacksTo` - この Item の最大スタック数を( `DataComponents#MAX_STACK_SIZE` によって )設定します。デフォルトは 64 です。たとえば、エンダーパールなど 16 個までしかスタックしない Item に使われます。
- `durability` - この Item の耐久値を( `DataComponents#MAX_DAMAGE` によって )設定し、初期ダメージを( `DataComponents#DAMAGE` によって )0 に設定します。デフォルトは 0 で、「耐久値なし」を意味します。たとえば、鉄の道具ではここに 250 を使います。耐久値を設定すると、最大スタック数が自動的に 1 に固定される点に注意してください。
- `craftRemainder` - この Item のクラフト後の残りを設定します。バニラでは、クラフト後に空のバケツが残る、中身の入ったバケツに使われています。
- `fireResistant` - この Item を使うアイテムエンティティを、火や溶岩で燃えないようにします( `DataComponents#FIRE_RESISTANT` によって )。さまざまなネザライトの Item で使われています。
- `setNoRepair` - この Item の金床やクラフトグリッドでの修理を無効にします。バニラでは使われていません。
- `rarity` - この Item のレア度を( `DataComponents#RARITY` によって )設定します。現在のところ、これは単に Item の色を変えるだけです。`Rarity` は `COMMON`( 白、デフォルト )、`UNCOMMON`( 黄 )、`RARE`( 水色 )、`EPIC`( 薄紫 )の 4 つの値からなる enum です。Mod によってレア度の種類が追加される場合もある点に注意してください。
- `requiredFeatures` - この Item に必要なフィーチャーフラグを設定します。これは主に、マイナーバージョンにおけるバニラのフィーチャーロックの仕組みに使われます。バニラでフィーチャーフラグによってロックされたシステムと連携する場合を除き、使用はおすすめしません。
- `food` - この Item の [`FoodProperties`][food] を( `DataComponents#FOOD` によって )設定します。

例や、Minecraft が使っているさまざまな値を見たい場合は、`Items` クラスを確認してください。

### 食べ物 {#food}

`Item` クラスには食べ物の Item のためのデフォルトの機能が備わっているので、そのための別のクラスは必要ありません。Item を食べられるようにするには、`Item.Properties` の `food` メソッドで `FoodProperties` を設定するだけです。

`FoodProperties` は `FoodProperties.Builder` で作成します。そこにさまざまなプロパティを設定できます。

- `nutrition` - 回復する満腹度を設定します。満腹度の半分を単位として数えます。たとえば、Minecraft のステーキは満腹度を 8 回復します。
- `saturationMod` - この食べ物を食べたときに回復する[隠し満腹度][hunger]の計算に使う倍率です。計算式は `min(2 * nutrition * saturationMod, playerNutrition)` で、`0.5` を使うと、実際の隠し満腹度が満腹度の値と同じになります。
- `alwaysEdible` - 満腹度ゲージが満タンでも、この Item を常に食べられるかどうか。デフォルトは `false` で、金のリンゴなど、満腹度ゲージを満たす以上の効果がある Item では `true` です。
- `fast` - この食べ物で早食いを有効にするかどうか。デフォルトは `false` で、バニラでは乾燥した昆布が `true` です。
- `effect` - この Item を食べたときに付与する [`MobEffectInstance`][mobeffectinstance] を追加します。2 つ目の引数は、その効果が付与される確率を表します。たとえば、腐った肉は食べると 80%( = 0.8 )の確率で空腹の効果を付与します。このメソッドには 2 つの形があります。Supplier を受け取るほうを使ってください( もう一方はモブ効果のインスタンスを直接受け取るもので、クラスロードの問題から NeoForge によって非推奨とされています )。
- `usingConvertsTo` - 使用後にこの Item が変わる Item を設定します。
- `build` - 設定したいものをすべて設定したら、`build` を呼び出して、以降で使う `FoodProperties` オブジェクトを取得します。

例や、Minecraft が使っているさまざまな値を見たい場合は、`Foods` クラスを確認してください。

Item の `FoodProperties` を取得するには、`Item#getFoodProperties(ItemStack, LivingEntity)` を呼び出します。すべての Item が食べられるわけではないので、これは null を返すことがあります。Item が食べられるかどうかを判定するには、`getFoodProperties` の呼び出し結果を null チェックしてください。

### さらなる機能 {#more-functionality}

`Item` を直接使うだけでは、ごく基本的な Item しか作れません。右クリックでのインタラクションなどの機能を追加したい場合は、`Item` を継承したカスタムクラスが必要です。`Item` クラスには、さまざまな処理を行うためにオーバーライドできるメソッドが多数あります。詳しくは `Item` と `IItemExtension` の各クラスを参照してください。

Item のよくある使い方は、左クリックと右クリックの 2 つです。左クリックについては、[Block の破壊][breaking]と、エンティティへの攻撃( 執筆中 )を参照してください。右クリックについては、[インタラクションパイプライン][interactionpipeline]を参照してください。

### `DeferredRegister.Items`

すべての Registry は `DeferredRegister` を使って中身を登録し、Item も例外ではありません。ただし、新しい Item の追加は非常に多くの Mod にとって欠かせない機能なので、NeoForge は `DeferredRegister.Items` というヘルパークラスを提供しています。これは `DeferredRegister<Item>` を継承し、Item 固有のヘルパーをいくつか備えています。

```java
public static final DeferredRegister.Items ITEMS = DeferredRegister.createItems(ExampleMod.MOD_ID);

public static final Supplier<Item> EXAMPLE_ITEM = ITEMS.registerItem(
    "example_item",
    Item::new, // The factory that the properties will be passed into.
    new Item.Properties() // The properties to use.
);
```

内部的には、渡された Item のファクトリ( 通常はコンストラクタ )にプロパティの引数を適用し、`ITEMS.register("example_item", () -> new Item(new Item.Properties()))` を呼び出しているだけです。

`Item::new` を使う場合は、ファクトリを完全に省略し、`simple` 版のメソッドを使えます。

```java
public static final Supplier<Item> EXAMPLE_ITEM = ITEMS.registerSimpleItem(
    "example_item",
    new Item.Properties() // The properties to use.
);
```

これは前の例とまったく同じ処理ですが、少し短く書けます。もちろん、`Item` そのものではなく `Item` のサブクラスを使いたい場合は、前の方法を使う必要があります。

どちらのメソッドにも、`new Item.Properties()` の引数を省略できるオーバーロードがあります。

```java
public static final Supplier<Item> EXAMPLE_ITEM = ITEMS.registerItem("example_item", Item::new);
// Variant that also omits the Item::new parameter
public static final Supplier<Item> EXAMPLE_ITEM = ITEMS.registerSimpleItem("example_item");
```

最後に、BlockItem 用のショートカットもあります。

```java
public static final Supplier<BlockItem> EXAMPLE_BLOCK_ITEM = ITEMS.registerSimpleBlockItem(
    "example_block",
    ExampleBlocksClass.EXAMPLE_BLOCK, new Item.Properties()
);
// Variant that omits the properties parameter:
public static final Supplier<BlockItem> EXAMPLE_BLOCK_ITEM = ITEMS.registerSimpleBlockItem(
    "example_block",
    ExampleBlocksClass.EXAMPLE_BLOCK
);
// Variant that omits the name parameter, instead using the block's registry name:
public static final Supplier<BlockItem> EXAMPLE_BLOCK_ITEM = ITEMS.registerSimpleBlockItem(
    ExampleBlocksClass.EXAMPLE_BLOCK,
    new Item.Properties()
);
// Variant that omits both the name and the properties:
public static final Supplier<BlockItem> EXAMPLE_BLOCK_ITEM = ITEMS.registerSimpleBlockItem(
    ExampleBlocksClass.EXAMPLE_BLOCK
);
```

:::note
登録した Block を別のクラスにまとめている場合は、Item のクラスより先に Block のクラスをクラスロードしてください。
:::

### リソース {#resources}

Item を登録して( `/give` や[クリエイティブタブ][creativetabs]から )手に入れると、適切なモデルやテクスチャが欠けていることに気づくでしょう。これは、テクスチャやモデルが Minecraft のリソースシステムによって扱われるためです。

すべての Item について、次の JSON ファイルを追加するか、[生成][datagen]する必要があります。

- [テクスチャ][texture]を伴う[アイテムモデル][model]
- [翻訳][i18n]
- [レシピ][recipes]（ 任意 ）
- いくつかのアイテム[タグ][tags]（ 任意 ）

これらすべてについて、似たバニラの Block のファイルやデータジェネレーターも参考にしてください。

## `ItemStack` {#itemstacks}

Block とブロックステートの場合と同様に、`Item` が使われると思われる場所のほとんどでは、実際には代わりに `ItemStack` が使われます。`ItemStack` は、コンテナ( インベントリなど )の中にある、1 つまたは複数の Item のスタックを表します。これも Block とブロックステートと同様に、メソッドは `Item` でオーバーライドし、`ItemStack` に対して呼び出します。`Item` の多くのメソッドには `ItemStack` のインスタンスが渡されます。

`ItemStack` は、主に 3 つの部分からなります。

- それが表す `Item`。`ItemStack#getItem` で取得できます。
- スタック数。通常は 1 から 64 で、`getCount` で取得でき、`setCount` や `shrink` で変更できます。
- スタック固有のデータが保存される[データコンポーネント][datacomponents]のマップ。`getComponents` で取得できます。コンポーネントの値には、通常 `has`、`get`、`set`、`update`、`remove` でアクセスし、変更します。

新しい `ItemStack` を作るには、背後にある Item を渡して `new ItemStack(Item)` を呼び出します。デフォルトでは個数は 1 で、NBT データはありません。必要に応じて、個数や NBT データを受け取るコンストラクタのオーバーロードもあります。

`ItemStack` はミュータブル( 可変 )なオブジェクトです( 後述 )。ただし、イミュータブルなものとして扱う必要がある場合もあります。イミュータブルとして扱うべき `ItemStack` を変更する必要がある場合は、`#copy` で、または特定のスタック数にしたい場合は `#copyWithCount` で、スタックを複製できます。

スタックに Item がないことを表したい場合は、`ItemStack.EMPTY` を使います。`ItemStack` が空かどうかを確認したい場合は、`#isEmpty` を呼び出します。

### `ItemStack` の可変性 {#mutability-of-itemstacks}

`ItemStack` はミュータブルなオブジェクトです。つまり、たとえば `#setCount` やデータコンポーネントのマップのメソッドを呼び出すと、`ItemStack` 自体が変更されます。バニラは `ItemStack` の可変性を多用しており、それに依存しているメソッドもいくつかあります。たとえば `#split` は、呼び出し元のスタックから指定した数を分割し、呼び出し元を変更すると同時に新しい `ItemStack` を返します。

ただし、これは複数の `ItemStack` を同時に扱うときに問題を引き起こすことがあります。これが起きる最も一般的な場面は、インベントリのスロットを扱うときです。カーソルで現在選択している `ItemStack` と、挿入先または取り出し元の `ItemStack` の両方を考慮しなければならないからです。

:::tip
迷ったら、念のためスタックを `#copy` しておきましょう。
:::

### JSON での表現 {#json-representation}

[レシピ][recipes]など多くの場面で、アイテムスタックを JSON オブジェクトとして表す必要があります。アイテムスタックの JSON での表現は次のようになります。

```json5
{
    // The item ID. Required.
    "id": "minecraft:dirt",
    // The item stack count. Optional, defaults to 1.
    "count": 4,
    // A map of data components. Optional, defaults to an empty map.
    "components": {
        "minecraft:enchantment_glint_override": true
    }
}
```

## クリエイティブタブ {#creative-tabs}

デフォルトでは、Item は `/give` でしか手に入らず、クリエイティブインベントリには表示されません。これを変えましょう！

Item をクリエイティブメニューに入れる方法は、どのタブに追加したいかによって異なります。

### 既存のクリエイティブタブ {#existing-creative-tabs}

:::note
この方法は、Minecraft のタブや他の Mod のタブに Item を追加するためのものです。自分のタブに Item を追加する方法は、後述を参照してください。
:::

既存の `CreativeModeTab` には、`BuildCreativeModeTabContentsEvent` を使って Item を追加できます。この Event は [Mod の EventBus][modbus] で、[論理クライアント][sides]でのみ発火されます。Item を追加するには `event#accept` を呼び出します。

```java
//MyItemsClass.MY_ITEM is a Supplier<? extends Item>, MyBlocksClass.MY_BLOCK is a Supplier<? extends Block>
@SubscribeEvent // on the mod event bus
public static void buildContents(BuildCreativeModeTabContentsEvent event) {
    // Is this the tab we want to add to?
    if (event.getTabKey() == CreativeModeTabs.INGREDIENTS) {
        event.accept(MyItemsClass.MY_ITEM.get());
        // Accepts an ItemLike. This assumes that MY_BLOCK has a corresponding item.
        event.accept(MyBlocksClass.MY_BLOCK.get());
    }
}
```

この Event は追加の情報も提供します。たとえば、有効なフィーチャーフラグの一覧を取得する `getFlags` や、プレイヤーにオペレーター用アイテムのタブを見る権限があるかを確認する `hasPermissions` などです。

### カスタムのクリエイティブタブ {#custom-creative-tabs}

`CreativeModeTab` は Registry です。つまり、カスタムの `CreativeModeTab` は[登録][registering]する必要があります。クリエイティブタブの作成にはビルダーの仕組みを使い、ビルダーは `CreativeModeTab#builder` で取得できます。ビルダーでは、タイトル、アイコン、デフォルトの Item など、さまざまなプロパティを設定できます。さらに NeoForge は、タブの画像、ラベルとスロットの色、タブの並び順などをカスタマイズするための追加のメソッドも提供しています。

```java
//CREATIVE_MODE_TABS is a DeferredRegister<CreativeModeTab>
public static final Supplier<CreativeModeTab> EXAMPLE_TAB = CREATIVE_MODE_TABS.register("example", () -> CreativeModeTab.builder()
    //Set the title of the tab. Don't forget to add a translation!
    .title(Component.translatable("itemGroup." + MOD_ID + ".example"))
    //Set the icon of the tab.
    .icon(() -> new ItemStack(MyItemsClass.EXAMPLE_ITEM.get()))
    //Add your items to the tab.
    .displayItems((params, output) -> {
        output.accept(MyItemsClass.MY_ITEM.get());
        // Accepts an ItemLike. This assumes that MY_BLOCK has a corresponding item.
        output.accept(MyBlocksClass.MY_BLOCK.get());
    })
    .build()
);
```

## `ItemLike`

`ItemLike` は、バニラで `Item` と [`Block`][block] が実装しているインターフェースです。このインターフェースは `#asItem` メソッドを定義しており、そのオブジェクトが実際に何であれ、その Item としての表現を返します。`Item` は自分自身を返し、`Block` は対応する `BlockItem` があればそれを、なければ `Blocks.AIR` を返します。`ItemLike` は、Item の「出どころ」が重要でないさまざまな場面で使われます。たとえば、多くの[データジェネレーター][datagen]です。

独自のオブジェクトに `ItemLike` を実装することもできます。`#asItem` をオーバーライドするだけです。

[block]: ../blocks/index.md
[blockstates]: ../blocks/states.md
[breaking]: ../blocks/index.md#breaking-a-block
[creativetabs]: #creative-tabs
[datacomponents]: ./datacomponents.md
[datagen]: ../resources/index.md#data-generation
[food]: #food
[hunger]: https://minecraft.wiki/w/Hunger#Mechanics
[i18n]: ../resources/client/i18n.md
[interactionpipeline]: interactionpipeline.md
[loottables]: ../resources/server/loottables/index.md
[mobeffectinstance]: mobeffects.md#mobeffectinstances
[modbus]: ../concepts/events.md#event-buses
[model]: ../resources/client/models/index.md
[recipes]: ../resources/server/recipes/index.md
[registering]: ../concepts/registries.md#methods-for-registering
[resources]: ../resources/index.md#assets
[sides]: ../concepts/sides.md
[tags]: ../resources/server/tags.md
[texture]: ../resources/client/textures.md
[wikicomponents]: https://minecraft.wiki/w/Data_component_format
