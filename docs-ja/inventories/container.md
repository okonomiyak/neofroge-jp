---
sidebar_position: 1
---
# コンテナ {#containers}

[BlockEntity][blockentity] やエンティティなど、Minecraft の多くのシステムは何らかの形でアイテムを保存しています。何かにアイテムを保存するために、Minecraft は `Container` の実装を使います。

`Container` インターフェースは、コンテナを問い合わせたり更新したりするための `#getItem`、`#setItem`、`#removeItem` などのメソッドを定義しています。インターフェースなので、実際のリストなどのデータ構造は持っておらず、それは実装する側のシステムに任されています。

そのため、`Container` は BlockEntity だけでなく、他のどんなクラスにも実装できます。代表的な例としては、エンティティのインベントリや、バックパックなど Mod でよくある [Item][item] があります。

:::warning
NeoForge は、多くの場所で `Container` の代わりとなる `ItemStackHandler` クラスを提供しています。他の `Container` や `ItemStackHandler` とのやりとりをすっきり書けるため、できる限り `Container` ではなくこちらを使ってください。

この記事は主に、バニラのコードを読むときの参考や、複数のローダー向けに Mod を開発する場合のためにあります。自分のコードでは、できる限り常に `ItemStackHandler` を使ってください！それについてのドキュメントは現在執筆中です。
:::

## 基本的なコンテナの実装 {#basic-container-implementation}

( Java の他のインターフェースと同様に )定められたメソッドを満たしていれば、コンテナはどのように実装してもかまいません。ただし、内部の構造として固定長の `NonNullList<ItemStack>` を使うのが一般的です。スロットが 1 つだけのコンテナなら、代わりに `ItemStack` のフィールドを使うだけでもかまいません。

たとえば、27 スロット( チェスト 1 つ分 )の `Container` の基本的な実装は、次のようになります。

```java
public class MyContainer implements Container {
    private final NonNullList<ItemStack> items = NonNullList.withSize(
            // The size of the list, i.e. the amount of slots in our container.
            27,
            // The default value to be used in place of where you'd use null in normal lists.
            ItemStack.EMPTY
    );

    // The amount of slots in our container.
    @Override
    public int getContainerSize() {
        return 27;
    }

    // Whether the container is considered empty.
    @Override
    public boolean isEmpty() {
        return this.items.stream().allMatch(ItemStack::isEmpty);
    }

    // Return the item stack in the specified slot.
    @Override
    public ItemStack getItem(int slot) {
        return this.items.get(slot);
    }

    // Call this when changes are done to the container, i.e. when item stacks are added, modified, or removed.
    // For example, you could call BlockEntity#setChanged here.
    @Override
    public void setChanged() {

    }

    // Remove the specified amount of items from the given slot, returning the stack that was just removed.
    // We defer to ContainerHelper here, which does this as expected for us.
    // However, we must call #setChanged manually.
    @Override
    public ItemStack removeItem(int slot, int amount) {
        ItemStack stack = ContainerHelper.removeItem(this.items, slot, amount);
        this.setChanged();
        return stack;
    }

    // Remove all items from the specified slot, returning the stack that was just removed.
    // We again defer to ContainerHelper here, and we again have to call #setChanged manually.
    @Override
    public ItemStack removeItemNoUpdate(int slot) {
        ItemStack stack = ContainerHelper.takeItem(this.items, slot);
        this.setChanged();
        return stack;
    }

    // Set the given item stack in the given slot. Limit to the max stack size of the container first.
    @Override
    public void setItem(int slot, ItemStack stack) {
        stack.limitSize(this.getMaxStackSize(stack));
        this.items.set(slot, stack);
        this.setChanged();
    }

    // Whether the container is considered "still valid" for the given player. For example, chests and
    // similar blocks check if the player is still within a given distance of the block here.
    @Override
    public boolean stillValid(Player player) {
        return true;
    }

    // Clear the internal storage, setting all slots to empty again.
    @Override
    public void clearContent() {
        items.clear();
        this.setChanged();
    }
}
```

### `SimpleContainer`

`SimpleContainer` クラスは、コンテナの基本的な実装に、`ContainerListener` を追加できる機能などを少し加えたものです。特別な要件のないコンテナの実装が必要な場合に使えます。

### `BaseContainerBlockEntity`

`BaseContainerBlockEntity` クラスは、チェストやチェストに似た Block、各種のかまど、ホッパー、ディスペンサー、ドロッパー、醸造台など、Minecraft の多くの重要な BlockEntity の基底クラスです。

`Container` のほかに、`MenuProvider` と `Nameable` のインターフェースも実装しています。

- `Nameable` は、( カスタムの )名前の設定に関するいくつかのメソッドを定義しています。多くの BlockEntity のほか、`Entity` などのクラスでも実装されています。これは [`Component` の仕組み][component]を使います。
- 一方、`MenuProvider` は `#createMenu` メソッドを定義しており、コンテナから [`AbstractContainerMenu`][menu] を構築できるようにします。つまり、ジュークボックスのように GUI を伴わないコンテナが必要な場合は、このクラスを使うのは望ましくありません。

`BaseContainerBlockEntity` は、通常 `NonNullList<ItemStack>` に対して行う呼び出しを、すべて `#getItems` と `#setItems` の 2 つのメソッドにまとめているため、書く必要のある定型コードを大幅に減らせます。`BaseContainerBlockEntity` の実装例は次のとおりです。

```java
public class MyBlockEntity extends BaseContainerBlockEntity {
    // The container size. This can of course be any value you want.
    public static final int SIZE = 9;
    // Our item stack list. This is not final due to #setItems existing.
    private NonNullList<ItemStack> items = NonNullList.withSize(SIZE, ItemStack.EMPTY);

    // The constructor, like before.
    public MyBlockEntity(BlockPos pos, BlockState blockState) {
        super(MY_BLOCK_ENTITY.get(), pos, blockState);
    }

    // The container size, like before.
    @Override
    public int getContainerSize() {
        return SIZE;
    }

    // The getter for our item stack list.
    @Override
    protected NonNullList<ItemStack> getItems() {
        return items;
    }

    // The setter for our item stack list.
    @Override
    protected void setItems(NonNullList<ItemStack> items) {
        this.items = items;
    }

    // The display name of the menu. Don't forget to add a translation!
    @Override
    protected Component getDefaultName() {
        return Component.translatable("container.examplemod.myblockentity");
    }

    // The menu to create from this container. See below for what to return here.
    @Override
    protected AbstractContainerMenu createMenu(int containerId, Inventory inventory) {
        return null;
    }
}
```

このクラスは、`BlockEntity` であると同時に `Container` でもある点に注意してください。つまり、このクラスを BlockEntity の親の型として使えば、コンテナが実装済みの、動作する BlockEntity が得られます。

### `WorldlyContainer`

`WorldlyContainer` は `Container` のサブインターフェースで、`Direction` によって `Container` のスロットにアクセスできるようにします。主に、コンテナの一部だけを特定の面に公開する BlockEntity を想定しています。たとえば、ある面に出力し、他のすべての面から入力を受け取る機械( またはその逆 )で使えます。このインターフェースの簡単な実装は次のようになります。

```java
// See BaseContainerBlockEntity methods above. You can of course extend BlockEntity directly
// and implement Container yourself if needed.
public class MyBlockEntity extends BaseContainerBlockEntity implements WorldlyContainer {
    // other stuff here
    
    // Assume that slot 0 is our output and slots 1-8 are our inputs.
    // Further assume that we output to the top and take inputs from all other sides.
    private static final int[] OUTPUTS = new int[]{0};
    private static final int[] INPUTS = new int[]{1, 2, 3, 4, 5, 6, 7, 8};

    // Return an array of exposed slot indices based on the passed Direction.
    @Override
    public int[] getSlotsForFace(Direction side) {
        return side == Direction.UP ? OUTPUTS : INPUTS;
    }

    // Whether items can be placed through the given side at the given slot.
    // For our example, we return true only if we're not inputing from above and are in the index range [1, 8].
    @Override
    public boolean canPlaceItemThroughFace(int index, ItemStack itemStack, @Nullable Direction direction) {
        return direction != Direction.UP && index > 0 && index < 9;
    }

    // Whether items can be taken from the given side and the given slot.
    // For our example, we return true only if we're pulling from above and from slot index 0.
    @Override
    public boolean canTakeItemThroughFace(int index, ItemStack stack, Direction direction) {
        return direction == Direction.UP && index == 0;
    }
}
```

## コンテナの使用 {#using-containers}

コンテナを作ったので、使ってみましょう！

`Container` と `BlockEntity` には重なる部分がかなり多いため、可能であれば、BlockEntity を `Container` にキャストしてコンテナを取得するのが最善です。

```java
if (blockEntity instanceof Container container) {
    // do something with the container
}
```

そうすれば、先ほど挙げたメソッドをコンテナで使えます。例:

```java
// Get the first item in the container.
ItemStack stack = container.getItem(0);

// Set the first item in the container to dirt.
container.setItem(0, new ItemStack(Items.DIRT));

// Removes a quantity of (up to) 16 from the third slot.
container.removeItem(2, 16);
```

:::warning
コンテナのサイズを超えるスロットにアクセスしようとすると、コンテナが例外をスローすることがあります。あるいは、( たとえば )`SimpleContainer` のように `ItemStack.EMPTY` を返す場合もあります。
:::

## `ItemStack` の `Container` {#containers-on-itemstacks}

ここまでは主に `BlockEntity` の `Container` を扱ってきました。しかし、`minecraft:container` [データコンポーネント][datacomponent]を使えば、[`ItemStack`][itemstack] にも適用できます。

```java
// We use SimpleContainer as the superclass here so we don't have to reimplement the item handling logic ourselves.
// Due to implementation details of SimpleContainer, this may lead to race conditions if multiple parties
// can access the container at the same time, so we're just going to assume our mod doesn't allow that.
// You may of course use a different implementation of Container (or implement Container yourself) if needed.
public class MyBackpackContainer extends SimpleContainer {
    // The item stack this container is for. Passed into and set in the constructor.
    private final ItemStack stack;
    
    public MyBackpackContainer(ItemStack stack) {
        // We call super with our desired container size.
        super(27);
        // Setting the stack field.
        this.stack = stack;
        // We load the container contents from the data component (if present), which is represented
        // by the ItemContainerContents class. If absent, we use ItemContainerContents.EMPTY.
        ItemContainerContents contents = stack.getOrDefault(DataComponents.CONTAINER, ItemContainerContents.EMPTY);
        // Copy the data component contents into our item stack list.
        contents.copyInto(this.getItems());
    }

    // When the contents are changed, we save the data component on the stack.
    @Override
    public void setChanged() {
        super.setChanged();
        this.stack.set(DataComponents.CONTAINER, ItemContainerContents.fromItems(this.getItems()));
    }
}
```

これで、アイテムに紐づいたコンテナができました！メニューなどの用途でコンテナを作るには、`new MyBackpackContainer(stack)` を呼び出します。

:::warning
`Container` と直接やりとりする `Menu` では、`ItemStack` を変更するときに `#copy()` する必要がある点に注意してください。そうしないと、データコンポーネントのイミュータブルであるという約束が破られます。そのために、NeoForge は `StackCopySlot` クラスを提供しています。
:::

## `Entity` の `Container` {#containers-on-entitys}

`Entity` の `Container` は扱いが厄介です。エンティティがコンテナを持つかどうかは、一律には判断できません。すべては扱うエンティティ次第で、そのため多くの場合分けが必要になることがあります。

自分でエンティティを作る場合は、そこに `Container` を直接実装してもまったく問題ありません。ただし、( `Entity` が親クラスになるため )`SimpleContainer` などの親クラスは使えない点に注意してください。

### `Mob` の `Container` {#containers-on-mobs}

`Mob` は `Container` を実装していませんが、( ほかのものに加えて )`EquipmentUser` インターフェースを実装しています。このインターフェースは、`#setItemSlot(EquipmentSlot, ItemStack)`、`#getItemBySlot(EquipmentSlot)`、`#setDropChance(EquipmentSlot, float)` のメソッドを定義しています。コード上は `Container` と関係ありませんが、機能はかなり似ています。スロット( ここでは装備スロット )と `ItemStack` を対応付けるという点です。

`Container` との最も大きな違いは、リストのような順序がないことです( ただし、`Mob` は内部で `NonNullList<ItemStack>` を使っています )。アクセスはスロットのインデックスではなく、7 つの `EquipmentSlot` の enum 値で行います。`MAINHAND`、`OFFHAND`、`FEET`、`LEGS`、`CHEST`、`HEAD`、`BODY` です( `BODY` は馬や犬の鎧に使われます )。

モブの「スロット」とのやりとりの例は、次のようになります。

```java
// Get the item stack in the HEAD (helmet) slot.
ItemStack helmet = mob.getItemBySlot(EquipmentSlot.HEAD);

// Put bedrock into the mob's FEET (boots) slot.
mob.setItemSlot(EquipmentSlot.FEET, new ItemStack(Items.BEDROCK));

// Enable that bedrock to always drop if the mob is killed.
mob.setDropChance(EquipmentSlot.FEET, 1f);
```

### `InventoryCarrier`

`InventoryCarrier` は、村人など一部の生物が実装しているインターフェースです。`SimpleContainer` を返す `#getInventory` メソッドを宣言しています。このインターフェースは、`EquipmentUser` が提供する装備スロットだけでなく、実際のインベントリを必要とするプレイヤー以外のエンティティで使われます。

### `Player` の `Container`( プレイヤーのインベントリ ) {#containers-on-players-player-inventory}

プレイヤーのインベントリは `Inventory` クラスで実装されています。これは `Container` と、先に述べた `Nameable` インターフェースを実装したクラスです。その `Inventory` のインスタンスは、`Player` の `inventory` という名前のフィールドに保存されており、`Player#getInventory` でアクセスできます。インベントリは、他のコンテナと同じように扱えます。

インベントリの中身は、3 つの `public final NonNullList<ItemStack>` に保存されています。

- `items` リストは、9 つのホットバーのスロット( インデックス 0〜8 )を含む、36 のメインインベントリのスロットを扱います。
- `armor` リストは長さ 4 のリストで、`FEET`、`LEGS`、`CHEST`、`HEAD` の防具をこの順に格納します。このリストは、`Mob` と同様に `EquipmentSlot` でアクセスします( 上記参照 )。
- `offhand` リストはオフハンドのスロットだけを格納します。つまり長さは 1 です。

インベントリの中身を反復処理するときは、バニラの動作と一貫させるため、`items`、`armor`、`offhand` の順に処理することをおすすめします。

[blockentity]: ../blockentities/index.md
[component]: ../resources/client/i18n.md#components
[datacomponent]: ../items/datacomponents.md
[item]: ../items/index.md
[itemstack]: ../items/index.md#itemstacks
[menu]: ../gui/menus.md
