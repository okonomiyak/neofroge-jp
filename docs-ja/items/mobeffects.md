---
sidebar_position: 4
---
# モブ効果とポーション {#mob-effects--potions}

ステータス効果(ポーション効果と呼ばれることもあり、コード上では `MobEffect` と呼ばれます)は、毎 tick エンティティに影響を与える効果です。この記事では、その使い方、効果とポーションの違い、独自の効果の追加方法を説明します。

## 用語 {#terminology}

- `MobEffect` は、毎 tick エンティティに影響を与えます。[Block][block] や [Item][item] と同様に、`MobEffect` は Registry のオブジェクトです。つまり、[登録][registration]する必要があり、シングルトンです。
    - **即時のモブ効果**は、1 tick だけ適用されるように作られた特別な種類のモブ効果です。バニラには、即時回復と即時ダメージの 2 つの即時効果があります。
- `MobEffectInstance` は `MobEffect` のインスタンスで、効果時間、増幅値、その他いくつかのプロパティ(後述)が設定されています。`MobEffectInstance` と `MobEffect` の関係は、[`ItemStack`][itemstack] と `Item` の関係と同じです。
- `Potion` は `MobEffectInstance` の集まりです。バニラでは主に 4 つのポーション系 Item(後述)にポーションを使いますが、任意の Item に自由に設定できます。設定されたポーションをその Item が使うかどうか、どう使うかは、Item 次第です。
- **ポーション系 Item** は、ポーションを設定することを想定した Item です。これは非公式の用語で、バニラの `PotionItem` クラスとは関係ありません(このクラスは「通常の」ポーションの Item を指します)。Minecraft には現在、ポーション、スプラッシュポーション、残留ポーション、効能付きの矢の 4 つのポーション系 Item がありますが、Mod によって追加されることもあります。

## `MobEffect` {#mobeffects}

独自の `MobEffect` を作るには、`MobEffect` クラスを継承します。

```java
public class MyMobEffect extends MobEffect {
    public MyMobEffect(MobEffectCategory category, int color) {
        super(category, color);
    }
    
    @Override
    public boolean applyEffectTick(LivingEntity entity, int amplifier) {
        // Apply your effect logic here.

        // If this returns false when shouldApplyEffectTickThisTick returns true, the effect will immediately be removed
        return true;
    }
    
    // Whether the effect should apply this tick. Used e.g. by the Regeneration effect that only applies
    // once every x ticks, depending on the tick count and amplifier.
    @Override
    public boolean shouldApplyEffectTickThisTick(int tickCount, int amplifier) {
        return tickCount % 2 == 0; // replace this with whatever check you want
    }
    
    // Utility method that is called when the effect is first added to the entity.
    // This does not get called again until all instances of this effect have been removed from the entity.
    @Override
    public void onEffectAdded(LivingEntity entity, int amplifier) {
        super.onEffectAdded(entity, amplifier);
    }

    // Utility method that is called when the effect is added to the entity.
    // This gets called every time this effect is added to the entity.
    @Override
    public void onEffectStarted(LivingEntity entity, int amplifier) {
    }
}
```

他の Registry のオブジェクトと同様に、`MobEffect` も次のように登録する必要があります。

```java
//MOB_EFFECTS is a DeferredRegister<MobEffect>
public static final Holder<MyMobEffect> MY_MOB_EFFECT = MOB_EFFECTS.register("my_mob_effect", () -> new MyMobEffect(
        //Can be either BENEFICIAL, NEUTRAL or HARMFUL. Used to determine the potion tooltip color of this effect.
        MobEffectCategory.BENEFICIAL,
        //The color of the effect particles.
        0xffffff
));
```

`MobEffect` クラスには、効果を受けたエンティティに属性修飾子を追加するためのデフォルトの機能もあります。たとえば、移動速度上昇の効果は、移動速度の属性修飾子を追加します。効果の属性修飾子は次のように追加します。

```java
public static final Holder<MyMobEffect> MY_MOB_EFFECT = MOB_EFFECTS.register("my_mob_effect", () -> new MyMobEffect(...)
        .addAttributeModifier(Attributes.ATTACK_DAMAGE, ResourceLocation.fromNamespaceAndPath("examplemod", "effect.strength"), 2.0, AttributeModifier.Operation.ADD_VALUE)
);
```

### `InstantenousMobEffect`

即時効果を作りたい場合は、通常の `MobEffect` クラスの代わりに、ヘルパークラス `InstantenousMobEffect` を使えます。

```java
public class MyMobEffect extends InstantenousMobEffect {
    public MyMobEffect(MobEffectCategory category, int color) {
        super(category, color);
    }

    @Override
    public void applyEffectTick(LivingEntity entity, int amplifier) {
        // Apply your effect logic here.
    }
}
```

そのうえで、通常どおり効果を登録します。

### Event {#events}

多くの効果は、別の場所でロジックが適用されています。たとえば、浮遊の効果は、生物の移動処理の中で適用されます。Mod の `MobEffect` では、[Event ハンドラ][events]で適用するのが理にかなっていることがよくあります。NeoForge には、効果に関する Event もいくつか用意されています。

- `MobEffectEvent.Applicable` は、`MobEffectInstance` をエンティティに適用できるかをゲームがチェックするときに発火されます。この Event を使うと、対象への効果インスタンスの追加を拒否したり、強制したりできます。
- `MobEffectEvent.Added` は、`MobEffectInstance` が対象に追加されたときに発火されます。この Event には、対象にすでに存在していた可能性のある以前の `MobEffectInstance` の情報が含まれます。
- `MobEffectEvent.Expired` は、`MobEffectInstance` の効果が切れたとき、つまりタイマーが 0 になったときに発火されます。
- `MobEffectEvent.Remove` は、効果切れ以外の方法、たとえば牛乳を飲む、コマンドを使うなどで、効果がエンティティから取り除かれたときに発火されます。

## `MobEffectInstance` {#mobeffectinstances}

`MobEffectInstance` とは、簡単に言えば、エンティティに適用された効果です。`MobEffectInstance` は、コンストラクタを呼び出して作成します。

```java
MobEffectInstance instance = new MobEffectInstance(
        // The mob effect to use.
        MobEffects.REGENERATION,
        // The duration to use, in ticks. Defaults to 0 if not specified.
        500,
        // The amplifier to use. This is the "strength" of the effect, i.e. Strength I, Strength II, etc;
        // starting at 0. Defaults to 0 if not specified.
        0,
        // Whether the effect is an "ambient" effect, meaning it is being applied by an ambient source,
        // of which Minecraft currently has the beacon and the conduit. Defaults to false if not specified.
        false,
        // Whether the effect is visible in the inventory. Defaults to true if not specified.
        true,
        // Whether an effect icon is visible in the top right corner. Defaults to true if not specified.
        true
);
```

最後の 1〜5 個の引数をそれぞれ省略したコンストラクタのオーバーロードもあります。

:::info
`MobEffectInstance` はミュータブルです。コピーが必要な場合は、`new MobEffectInstance(oldInstance)` を呼び出してください。
:::

### `MobEffectInstance` の使用 {#using-mobeffectinstances}

`MobEffectInstance` は、次のようにエンティティに追加できます。

```java
MobEffectInstance instance = new MobEffectInstance(...);
entity.addEffect(instance);
```

同様に、`MobEffectInstance` をエンティティから取り除くこともできます。`MobEffectInstance` は、エンティティにすでにある同じ `MobEffect` の `MobEffectInstance` を上書きするため、1 つの `MobEffect` とエンティティの組み合わせにつき、`MobEffectInstance` は常に 1 つしか存在しません。そのため、取り除くときは `MobEffect` を指定するだけで十分です。

```java
entity.removeEffect(MobEffects.REGENERATION);
```

:::info
`MobEffect` を適用できるのは `LivingEntity` とそのサブクラス、つまりプレイヤーやモブだけです。アイテムや投げられた雪玉などは、`MobEffect` の影響を受けません。
:::

## `Potion` {#potions}

`Potion` は、ポーションに持たせたい `MobEffectInstance` を渡して `Potion` のコンストラクタを呼び出すことで作成します。例:

```java
//POTIONS is a DeferredRegister<Potion>
public static final Supplier<Potion> MY_POTION = POTIONS.register("my_potion", () -> new Potion(new MobEffectInstance(MY_MOB_EFFECT, 3600)));
```

`new Potion` の引数は可変長引数である点に注意してください。つまり、ポーションには好きなだけ効果を追加できます。また、空のポーション、つまり効果を何も持たないポーションも作れます。`new Potion()` を呼び出すだけです!(ちなみに、バニラはこの方法で `awkward`(奇妙なポーション)を追加しています。)

ポーションの名前は、コンストラクタの最初の引数として渡せます。これは翻訳に使われます。たとえば、バニラの延長版や強化版のポーションは、これを使って基本版と同じ名前にしています。名前は必須ではなく、省略した場合は Registry から名前が問い合わせられます。

`PotionContents` クラスには、ポーション系 Item に関するさまざまなヘルパーメソッドがあります。ポーション系 Item は、`DataComponent#POTION_CONTENTS` によって `PotionContents` を保存します。

### 醸造 {#brewing}

ポーションを追加したので、そのポーションのポーション系 Item が使えるようになりました。しかし、サバイバルでそのポーションを入手する方法がないので、それを変えましょう!

ポーションは昔から醸造台で作られます。残念ながら、Mojang は醸造レシピの [Datapack][datapack] 対応を提供していないため、少し古風なやり方で、`RegisterBrewingRecipesEvent` を通じてコードでレシピを追加する必要があります。これは次のように行います。

```java
@SubscribeEvent // on the game event bus
public static void registerBrewingRecipes(RegisterBrewingRecipesEvent event) {
    // Gets the builder to add recipes to
    PotionBrewing.Builder builder = event.getBuilder();

    // Will add brewing recipes for all container potions (e.g. potion, splash potion, lingering potion)
    builder.addMix(
        // The initial potion to apply to
        Potions.AWKWARD,
        // The brewing ingredient. This is the item at the top of the brewing stand.
        Items.FEATHER,
        // The resulting potion
        MY_POTION
    );
}
```

[block]: ../blocks/index.md
[commonsetup]: ../concepts/events.md#event-buses
[datapack]: ../resources/index.md#data
[events]: ../concepts/events.md
[item]: index.md
[itemstack]: index.md#itemstacks
[registration]: ../concepts/registries.md
[uuidgen]: https://www.uuidgenerator.net/version4
