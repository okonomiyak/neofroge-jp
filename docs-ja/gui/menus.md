# メニュー {#menus}

メニューは、グラフィカルユーザーインターフェース( GUI )のバックエンドの一種です。表示対象のデータホルダーとのやりとりに関わるロジックを扱います。メニュー自体はデータホルダーではありません。ユーザーが内部のデータホルダーの状態を間接的に変更できるようにするビューです。そのため、データホルダーをメニューと直接結び付けるべきではありません。代わりに、呼び出しや変更のためのデータの参照を渡してください。

## `MenuType`

メニューは動的に作成・削除されるため、Registry のオブジェクトではありません。そのため代わりに、メニューの*タイプ*を簡単に作成・参照するための、別のファクトリオブジェクトを登録します。メニューの場合、これが `MenuType` です。

`MenuType` は[登録][registered]する必要があります。

### `MenuSupplier`

`MenuType` は、コンストラクタに `MenuSupplier` と `FeatureFlagSet` を渡して作成します。`MenuSupplier` は、コンテナの ID と、メニューを見ているプレイヤーのインベントリを受け取り、新しく作成した [`AbstractContainerMenu`][acm] を返す関数を表します。

```java
// For some DeferredRegister<MenuType<?>> REGISTER
public static final Supplier<MenuType<MyMenu>> MY_MENU = REGISTER.register("my_menu", () -> new MenuType(MyMenu::new, FeatureFlags.DEFAULT_FLAGS));

// In MyMenu, an AbstractContainerMenu subclass
public MyMenu(int containerId, Inventory playerInv) {
    super(MY_MENU.get(), containerId);
    // ...
}
```

:::note
コンテナの ID は、個々のプレイヤーごとに一意です。つまり、2 人の異なるプレイヤーで同じコンテナ ID であっても、たとえ同じデータホルダーを見ていても、それは 2 つの異なるメニューを表します。
:::

`MenuSupplier` は通常、クライアントでメニューを作成する役割を担います。そのメニューは、サーバーのデータホルダーから同期された情報を保存・操作するための、ダミーのデータ参照を持ちます。

### `IContainerFactory`

クライアントで追加の情報( 例: ワールド内でのデータホルダーの位置 )が必要な場合は、代わりにサブクラスの `IContainerFactory` を使えます。これは、コンテナ ID とプレイヤーのインベントリに加えて、サーバーから送られた追加情報を格納できる `RegistryFriendlyByteBuf` も提供します。`IContainerFactory` を使った `MenuType` は、`IMenuTypeExtension#create` で作成できます。

```java
// For some DeferredRegister<MenuType<?>> REGISTER
public static final Supplier<MenuType<MyMenuExtra>> MY_MENU_EXTRA = REGISTER.register("my_menu_extra", () -> IMenuTypeExtension.create(MyMenu::new));

// In MyMenuExtra, an AbstractContainerMenu subclass
public MyMenuExtra(int containerId, Inventory playerInv, FriendlyByteBuf extraData) {
    super(MY_MENU_EXTRA.get(), containerId);
    // Store extra data from buffer
    // ...
}
```

## `AbstractContainerMenu`

すべてのメニューは `AbstractContainerMenu` を継承しています。メニューは 2 つの引数を受け取ります。メニュー自体のタイプを表す [`MenuType`][mt] と、現在アクセスしている者にとってのメニューの一意な識別子を表すコンテナ ID です。

:::caution
プレイヤーが同時に開けるメニューは、100 個までです。
:::

各メニューには、2 つのコンストラクタを用意してください。サーバーでメニューを初期化するためのものと、クライアントでメニューを初期化するためのものです。クライアントでメニューを初期化するコンストラクタは、`MenuType` に渡すものです。サーバー用のメニューのコンストラクタが持つフィールドには、クライアント用のメニューのコンストラクタで何らかのデフォルト値を与えてください。

```java
// Client menu constructor
public MyMenu(int containerId, Inventory playerInventory) { // optional FriendlyByteBuf parameter if reading data from server
    this(containerId, playerInventory, /* Any default parameters here */);
}

// Server menu constructor
public MyMenu(int containerId, Inventory playerInventory, /* Any additional parameters here. */) {
    // ...
}
```

メニューの実装はそれぞれ、`#stillValid` と [`#quickMoveStack`][qms] の 2 つのメソッドを実装する必要があります。

### `#stillValid` と `ContainerLevelAccess` {#stillvalid-and-containerlevelaccess}

`#stillValid` は、あるプレイヤーに対してメニューを開いたままにすべきかどうかを判定します。通常は、`ContainerLevelAccess`、プレイヤー、このメニューが紐づく `Block` を受け取る static な `#stillValid` に委ねます。クライアント用のメニューでは、このメソッドは常に `true` を返す必要があり、static な `#stillValid` はデフォルトでそうなります。この実装は、データを保存するオブジェクトがある位置から 8 ブロック以内にプレイヤーがいるかどうかをチェックします。

`ContainerLevelAccess` は、閉じたスコープの中で、現在のレベルとブロックの位置を提供します。サーバーでメニューを構築するときは、`ContainerLevelAccess#create` を呼び出して新しいアクセスを作成できます。クライアント用のメニューのコンストラクタでは、何もしない `ContainerLevelAccess#NULL` を渡せます。

```java
// Client menu constructor
public MyMenuAccess(int containerId, Inventory playerInventory) {
    this(containerId, playerInventory, ContainerLevelAccess.NULL);
}

// Server menu constructor
public MyMenuAccess(int containerId, Inventory playerInventory, ContainerLevelAccess access) {
    // ...
}

// Assume this menu is attached to Supplier<Block> MY_BLOCK
@Override
public boolean stillValid(Player player) {
    return AbstractContainerMenu.stillValid(this.access, player, MY_BLOCK.get());
}
```

### データの同期 {#data-synchronization}

プレイヤーに表示するために、サーバーとクライアントの両方に存在する必要があるデータがあります。そのため、メニューは基本的なデータ同期の仕組みを実装しており、現在のデータが最後にクライアントへ同期したデータと一致しないときに同期します。プレイヤーについては、これが毎 tick チェックされます。

Minecraft は、デフォルトで 2 種類のデータ同期をサポートしています。`Slot` による `ItemStack` の同期と、`DataSlot` による整数の同期です。`Slot` と `DataSlot` は、データの保存先への参照を保持するビューで、操作が有効であれば、プレイヤーが画面上で変更できます。これらは、コンストラクタ内で `#addSlot` と `#addDataSlot` を使ってメニューに追加できます。

:::note
`Slot` が使う `Container` は、[`IItemHandler` capability][cap] を使うために NeoForge によって非推奨とされているため、以降の説明は capability 版である `SlotItemHandler` を使う前提で進めます。
:::

`SlotItemHandler` は 4 つの引数を取ります。スタックが入っているインベントリを表す `IItemHandler`、このスロットが表すスタックのインデックス、そして `AbstractContainerScreen#leftPos` と `#topPos` を基準にした、画面上でスロットの左上が描画される x 座標と y 座標です。クライアント用のメニューのコンストラクタでは、常に同じサイズのインベントリの空のインスタンスを渡してください。

ほとんどの場合、まずメニューが持つスロットを追加し、次にプレイヤーのインベントリ、最後にプレイヤーのホットバーを追加します。メニューから個々の `Slot` にアクセスするには、スロットを追加した順序に基づいてインデックスを計算する必要があります。

`DataSlot` は抽象クラスで、データを保存するオブジェクトに格納されたデータを参照するための getter と setter を実装する必要があります。クライアント用のメニューのコンストラクタでは、常に `DataSlot#standalone` で新しいインスタンスを渡してください。

これらはスロットとともに、新しいメニューを初期化するたびに作り直してください。

:::note
`DataSlot` は整数を格納しますが、ネットワーク経由での値の送り方のために、実質的には **short**( -32768 から 32767 )に制限されます。整数の上位 16 ビットは無視されます。

NeoForge はパケットにパッチを当て、整数全体をクライアントに届けるようにしています。
:::

```java
// Assume we have an inventory from a data object of size 5
// Assume we have a DataSlot constructed on each initialization of the server menu

// Client menu constructor
public MyMenuAccess(int containerId, Inventory playerInventory) {
    this(containerId, playerInventory, new ItemStackHandler(5), DataSlot.standalone());
}

// Server menu constructor
public MyMenuAccess(int containerId, Inventory playerInventory, IItemHandler dataInventory, DataSlot dataSingle) {
    // Check if the data inventory size is some fixed value
    // Then, add slots for data inventory
    this.addSlot(new SlotItemHandler(dataInventory, /*...*/));

    // Add slots for player inventory
    this.addSlot(new Slot(playerInventory, /*...*/));

    // Add data slots for handled integers
    this.addDataSlot(dataSingle);

    // ...
}
```

#### `ContainerData`

複数の整数をクライアントに同期する必要がある場合は、代わりに `ContainerData` を使って整数を参照できます。このインターフェースはインデックスによる検索として機能し、各インデックスが異なる整数を表します。`ContainerData` を `#addDataSlots` でメニューに追加する場合は、データオブジェクト自体の中で `ContainerData` を構築することもできます。このメソッドは、インターフェースが指定するデータの数だけ新しい `DataSlot` を作成します。クライアント用のメニューのコンストラクタでは、常に `SimpleContainerData` で新しいインスタンスを渡してください。

```java
// Assume we have a ContainerData of size 3

// Client menu constructor
public MyMenuAccess(int containerId, Inventory playerInventory) {
    this(containerId, playerInventory, new SimpleContainerData(3));
}

// Server menu constructor
public MyMenuAccess(int containerId, Inventory playerInventory, ContainerData dataMultiple) {
    // Check if the ContainerData size is some fixed value
    checkContainerDataCount(dataMultiple, 3);

    // Add data slots for handled integers
    this.addDataSlots(dataMultiple);

    // ...
}
```

#### `#quickMoveStack`

`#quickMoveStack` は、すべてのメニューが実装しなければならない 2 つ目のメソッドです。このメソッドは、スタックが Shift クリック( クイック移動 )によって現在のスロットから移動されるたびに呼ばれ、スタックが元のスロットから完全に移動し終えるか、スタックの移動先がなくなるまで続きます。このメソッドは、クイック移動されるスロットにあるスタックのコピーを返します。

スタックは通常、`#moveItemStackTo` を使ってスロット間を移動します。これは、スタックを最初に空いているスロットに移動します。移動するスタック、移動先として試す最初のスロットのインデックス( これを含む )、最後のスロットのインデックス( これを含まない )、そしてスロットを最初から最後へ( `false` のとき )チェックするか、最後から最初へ( `true` のとき )チェックするかを受け取ります。

Minecraft の実装全体を通して、このメソッドのロジックはおおむね一貫しています。

```java
// Assume we have a data inventory of size 5
// The inventory has 4 inputs (index 1 - 4) which outputs to a result slot (index 0)
// We also have the 27 player inventory slots and the 9 hotbar slots
// As such, the actual slots are indexed like so:
//   - Data Inventory: Result (0), Inputs (1 - 4)
//   - Player Inventory (5 - 31)
//   - Player Hotbar (32 - 40)
@Override
public ItemStack quickMoveStack(Player player, int quickMovedSlotIndex) {
    // The quick moved slot stack
    ItemStack quickMovedStack = ItemStack.EMPTY;
    // The quick moved slot
    Slot quickMovedSlot = this.slots.get(quickMovedSlotIndex) 
  
    // If the slot is in the valid range and the slot is not empty
    if (quickMovedSlot != null && quickMovedSlot.hasItem()) {
        // Get the raw stack to move
        ItemStack rawStack = quickMovedSlot.getItem(); 
        // Set the slot stack to a copy of the raw stack
        quickMovedStack = rawStack.copy();

        /*
        The following quick move logic can be simplified to if in data inventory,
        try to move to player inventory/hotbar and vice versa for containers
        that cannot transform data (e.g. chests).
        */

        // If the quick move was performed on the data inventory result slot
        if (quickMovedSlotIndex == 0) {
            // Try to move the result slot into the player inventory/hotbar
            if (!this.moveItemStackTo(rawStack, 5, 41, true)) {
                // If cannot move, no longer quick move
                return ItemStack.EMPTY;
            }

            // Perform logic on result slot quick move
            slot.onQuickCraft(rawStack, quickMovedStack);
        }
        // Else if the quick move was performed on the player inventory or hotbar slot
        else if (quickMovedSlotIndex >= 5 && quickMovedSlotIndex < 41) {
            // Try to move the inventory/hotbar slot into the data inventory input slots
            if (!this.moveItemStackTo(rawStack, 1, 5, false)) {
                // If cannot move and in player inventory slot, try to move to hotbar
                if (quickMovedSlotIndex < 32) {
                    if (!this.moveItemStackTo(rawStack, 32, 41, false)) {
                        // If cannot move, no longer quick move
                        return ItemStack.EMPTY;
                    }
                }
                // Else try to move hotbar into player inventory slot
                else if (!this.moveItemStackTo(rawStack, 5, 32, false)) {
                    // If cannot move, no longer quick move
                    return ItemStack.EMPTY;
                }
            }
        }
        // Else if the quick move was performed on the data inventory input slots, try to move to player inventory/hotbar
        else if (!this.moveItemStackTo(rawStack, 5, 41, false)) {
            // If cannot move, no longer quick move
            return ItemStack.EMPTY;
        }

        if (rawStack.isEmpty()) {
            // If the raw stack has completely moved out of the slot, set the slot to the empty stack
            quickMovedSlot.set(ItemStack.EMPTY);
        } else {
            // Otherwise, notify the slot that that the stack count has changed
            quickMovedSlot.setChanged();
        }

        // Execute logic on what to do post move with the remaining stack
        // This can be removed if there are no `Slot` subtypes that override `onTake`
        quickMovedSlot.onTake(player, rawStack);
    }

    return quickMovedStack; // Return the slot stack
}
```

## メニューを開く {#opening-a-menu}

メニューのタイプを登録し、メニュー自体を作り終え、[画面][screen]を紐づけたら、プレイヤーがメニューを開けるようになります。メニューは、論理サーバーで `IPlayerExtension#openMenu` を呼び出すことで開けます。このメソッドは、サーバー側のメニューの `MenuProvider` と、追加のデータをクライアントに同期する必要がある場合は任意で `Consumer<RegistryFriendlyByteBuf>` を受け取ります。

:::note
`Consumer<RegistryFriendlyByteBuf>` 引数を持つ `IPlayerExtension#openMenu` は、メニューのタイプを [`IContainerFactory`][icf] で作成した場合にのみ使ってください。
:::

#### `MenuProvider`

`MenuProvider` は、2 つのメソッドを持つインターフェースです。メニューのサーバー側のインスタンスを作成する `#createMenu` と、[画面][screen]に渡すメニューのタイトルを含むコンポーネントを返す `#getDisplayName` です。`#createMenu` メソッドは 3 つの引数を取ります。メニューのコンテナ ID、メニューを開いたプレイヤーのインベントリ、メニューを開いたプレイヤーです。

`MenuProvider` は、`SimpleMenuProvider` を使うと簡単に作成できます。これは、サーバー用のメニューを作成するメソッド参照と、メニューのタイトルを受け取ります。

```java
// In some implementation with access to the Player on the logical server (e.g. ServerPlayer instance)
// Assume we have ServerPlayer serverPlayer
serverPlayer.openMenu(new SimpleMenuProvider(
    (containerId, playerInventory, player) -> new MyMenu(containerId, playerInventory),
    Component.translatable("menu.title.examplemod.mymenu")
));
```

### よくある実装 {#common-implementations}

メニューは通常、プレイヤーの何らかのインタラクション( 例: Block やエンティティを右クリックしたとき )で開かれます。

#### Block での実装 {#block-implementation}

Block では通常、`BlockBehaviour#useWithoutItem` をオーバーライドしてメニューを実装します。[論理クライアント][side]の場合、[インタラクション][interaction]は `InteractionResult#SUCCESS` を返します。そうでなければ、メニューを開いて `InteractionResult#CONSUME` を返します。

`MenuProvider` は、`BlockBehaviour#getMenuProvider` をオーバーライドして実装してください。バニラのメソッドは、スペクテイターモードでメニューを表示するためにこれを使います。

```java
// In some Block subclass
@Override
public MenuProvider getMenuProvider(BlockState state, Level level, BlockPos pos) {
    return new SimpleMenuProvider(/* ... */);
}

@Override
public InteractionResult useWithoutItem(BlockState state, Level level, BlockPos pos, Player player, BlockHitResult result) {
    if (!level.isClientSide && player instanceof ServerPlayer serverPlayer) {
        serverPlayer.openMenu(state.getMenuProvider(level, pos));
    }
    return InteractionResult.sidedSuccess(level.isClientSide);
}
```

:::note
これはロジックを実装する最も簡単な方法であって、唯一の方法ではありません。特定の条件下でのみ Block がメニューを開くようにしたい場合は、条件を満たさないときに `InteractionResult#PASS` または `#FAIL` を返せるよう、事前に何らかのデータをクライアントに同期しておく必要があります。
:::

#### モブでの実装 {#mob-implementation}

モブでは通常、`Mob#mobInteract` をオーバーライドしてメニューを実装します。Block での実装と同じように行いますが、唯一の違いは、スペクテイターモードでの表示をサポートするために、`Mob` 自体が `MenuProvider` を実装すべきという点です。

```java
public class MyMob extends Mob implements MenuProvider {
    // ...

    @Override
    public InteractionResult mobInteract(Player player, InteractionHand hand) {
        if (!this.level.isClientSide && player instanceof ServerPlayer serverPlayer) {
            serverPlayer.openMenu(this);
        }
        return InteractionResult.sidedSuccess(this.level.isClientSide);
    }
}
```

:::note
繰り返しになりますが、これはロジックを実装する最も簡単な方法であって、唯一の方法ではありません。
:::

[registered]: ../concepts/registries.md#methods-for-registering
[acm]: #abstractcontainermenu
[mt]: #menutype
[qms]: #quickmovestack
[cap]: ../inventories/capabilities.md#neoforge-provided-capabilities
[screen]: ./screens.md
[icf]: #icontainerfactory
[side]: ../concepts/sides.md#the-logical-side
[interaction]: ../items/interactionpipeline.md
