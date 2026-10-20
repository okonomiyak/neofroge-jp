# キー割り当て {#key-mappings}

キー割り当て( キーバインド )は、マウスのクリックやキーの押下などの入力に結び付ける特定の操作を定義します。キー割り当てで定義した各操作は、クライアントが入力を受け付けられるときにいつでもチェックできます。さらに、各キー割り当ては、[操作設定のメニュー][controls]から任意の入力に割り当てられます。

## `KeyMapping` の登録 {#registering-a-keymapping}

`KeyMapping` は、物理クライアントでのみ [Mod の EventBus][eventbus] で `RegisterKeyMappingsEvent` を listen し、`#register` を呼び出すことで登録できます。

```java
// In some physical client only class

// Key mapping is lazily initialized so it doesn't exist until it is registered
public static final Lazy<KeyMapping> EXAMPLE_MAPPING = Lazy.of(() -> /*...*/);

@SubscribeEvent // on the mod event bus only on the physical client
public static void registerBindings(RegisterKeyMappingsEvent event) {
    event.register(EXAMPLE_MAPPING.get());
}
```

## `KeyMapping` の作成 {#creating-a-keymapping}

`KeyMapping` は、コンストラクタで作成できます。`KeyMapping` は、割り当ての名前を定義する[翻訳キー][tk]、割り当てのデフォルトの入力、そして[操作設定のメニュー][controls]で割り当てを入れるカテゴリを定義する[翻訳キー][tk]を受け取ります。

:::tip
バニラにないカテゴリの[翻訳キー][tk]を指定すると、`KeyMapping` を独自のカテゴリに追加できます。独自のカテゴリの翻訳キーには、Mod ID を含めてください( 例: `key.categories.examplemod.examplecategory` )。
:::

### デフォルトの入力 {#default-inputs}

各キー割り当てには、デフォルトの入力が関連付けられています。これは `InputConstants.Key` で指定します。各入力は、どのデバイスが入力を提供するかを定義する `InputConstants.Type` と、そのデバイス上での入力の識別子を定義する整数からなります。

バニラには 3 種類の入力があります。`GLFW` のキートークンでキーボードを定義する `KEYSYM`、プラットフォーム固有のスキャンコードでキーボードを定義する `SCANCODE`、マウスを定義する `MOUSE` です。

:::note
`GLFW` のキートークンは特定のシステムに依存しないため、キーボードには `SCANCODE` ではなく `KEYSYM` を使うことを強くおすすめします。詳しくは [GLFW のドキュメント][keyinput]を参照してください。
:::

整数は、指定したタイプによって異なります。入力コードはすべて `GLFW` で定義されています。`KEYSYM` のトークンには `GLFW_KEY_*` の接頭辞が、`MOUSE` のコードには `GLFW_MOUSE_*` の接頭辞が付きます。

```java
new KeyMapping(
    "key.examplemod.example1", // Will be localized using this translation key
    InputConstants.Type.KEYSYM, // Default mapping is on the keyboard
    GLFW.GLFW_KEY_P, // Default key is P
    "key.categories.misc" // Mapping will be in the misc category
)
```

:::note
キー割り当てにデフォルトの入力を割り当てない場合は、入力を `InputConstants#UNKNOWN` に設定してください。バニラのコンストラクタでは、`InputConstants$Key#getValue` で入力コードを取り出す必要がありますが、NeoForge のコンストラクタには入力のフィールドをそのまま渡せます。
:::

### `IKeyConflictContext`

すべての割り当てが、あらゆる場面で使われるわけではありません。GUI でのみ使う割り当てもあれば、純粋にゲーム中でのみ使う割り当てもあります。異なる場面で使われる同じキーの割り当てが互いに競合しないよう、`IKeyConflictContext` を割り当てられます。

各競合コンテキストには 2 つのメソッドがあります。現在のゲームの状態でその割り当てを使えるかを定義する `#isActive` と、同じまたは異なる競合コンテキストのキーと競合するかを定義する `#conflicts` です。

現在、NeoForge は `KeyConflictContext` で 3 つの基本的なコンテキストを定義しています。デフォルトであり、どの場面でもキーを使えることを意味する `UNIVERSAL`、`Screen` が開いているときだけ割り当てを使えることを意味する `GUI`、`Screen` が開いていないときだけ割り当てを使えることを意味する `IN_GAME` です。新しい競合コンテキストは、`IKeyConflictContext` を実装して作成できます。

```java
new KeyMapping(
    "key.examplemod.example2",
    KeyConflictContext.GUI, // Mapping can only be used when a screen is open
    InputConstants.Type.MOUSE, // Default mapping is on the mouse
    GLFW.GLFW_MOUSE_BUTTON_LEFT, // Default mouse input is the left mouse button
    "key.categories.examplemod.examplecategory" // Mapping will be in the new example category
)
```

### `KeyModifier`

Mod 開発者は、修飾キーを同時に押しているときに、割り当てに同じ動作をさせたくない場合があります( 例: `G` と `CTRL + G` )。これに対応するため、NeoForge はコンストラクタに `KeyModifier` を受け取る追加の引数を加えています。これを使うと、任意の入力に Ctrl( `KeyModifier#CONTROL` )、Shift( `KeyModifier#SHIFT` )、Alt( `KeyModifier#ALT` )を組み合わせられます。デフォルトは `KeyModifier#NONE` で、修飾キーは組み合わせません。

修飾キーは、[操作設定のメニュー][controls]で、修飾キーと対応する入力を同時に押すことで追加できます。

```java
new KeyMapping(
    "key.examplemod.example3",
    KeyConflictContext.UNIVERSAL,
    KeyModifier.SHIFT, // Default mapping requires shift to be held down
    InputConstants.Type.KEYSYM, // Default mapping is on the keyboard
    GLFW.GLFW_KEY_G, // Default key is G
    "key.categories.misc"
)
```

## `KeyMapping` のチェック {#checking-a-keymapping}

`KeyMapping` は、押されたかどうかをチェックできます。タイミングに応じて、割り当てを条件に使い、対応するロジックを適用できます。

### ゲーム中 {#within-the-game}

ゲーム中は、[EventBus][eventbus] で `ClientTickEvent.Post` を listen し、while ループの中で `KeyMapping#consumeClick` をチェックしてください。`#consumeClick` は、入力が行われて、まだ処理されていない回数だけ `true` を返すので、ゲームが無限に止まることはありません。

```java
@SubscribeEvent // on the game event bus only on the physical client
public static void onClientTick(ClientTickEvent.Post event) {
    while (EXAMPLE_MAPPING.get().consumeClick()) {
        // Execute logic to perform on click here
    }
}
```

:::caution
`ClientTickEvent.Post` の代わりに `InputEvent` を使わないでください。キーボードとマウスの入力にそれぞれ別の Event しかないため、それ以外の入力を扱えません。
:::

### GUI の中 {#inside-a-gui}

GUI の中では、`GuiEventListener` のいずれかのメソッドで、`IKeyMappingExtension#isActiveAndMatches` を使って割り当てをチェックできます。チェックに使う最も一般的なメソッドは、`#keyPressed` と `#mouseClicked` です。

`#keyPressed` は、`GLFW` のキートークン、プラットフォーム固有のスキャンコード、押されている修飾キーのビットフィールドを受け取ります。キーが割り当てと一致するかは、`InputConstants#getKey` で入力を作成してチェックできます。修飾キーは、割り当てのメソッド自体の中ですでにチェックされます。

```java
// In some Screen subclass
@Override
public boolean keyPressed(int key, int scancode, int mods) {
    if (EXAMPLE_MAPPING.get().isActiveAndMatches(InputConstants.getKey(key, scancode))) {
        // Execute logic to perform on key press here
        return true;
    }
    return super.keyPressed(x, y, button);
} 
```

:::note
**キー**をチェックしたい画面が自分のものでない場合は、代わりに [EventBus][eventbus] で `ScreenEvent.KeyPressed` の `Pre` または `Post` の Event を listen できます。
:::

`#mouseClicked` は、マウスの x 座標、y 座標、クリックされたボタンを受け取ります。マウスのボタンが割り当てと一致するかは、`MOUSE` の入力で `InputConstants.Type#getOrCreate` を使って入力を作成してチェックできます。

```java
// In some Screen subclass
@Override
public boolean mouseClicked(double x, double y, int button) {
    if (EXAMPLE_MAPPING.get().isActiveAndMatches(InputConstants.TYPE.MOUSE.getOrCreate(button))) {
        // Execute logic to perform on mouse click here
        return true;
    }
    return super.mouseClicked(x, y, button);
} 
```

:::note
**マウス**をチェックしたい画面が自分のものでない場合は、代わりに [EventBus][eventbus] で `ScreenEvent.MouseButtonPressed` の `Pre` または `Post` の Event を listen できます。
:::

[eventbus]: ../concepts/events.md#registering-an-event-handler
[controls]: https://minecraft.wiki/w/Options#Controls
[tk]: ../resources/client/i18n.md#components
[keyinput]: https://www.glfw.org/docs/3.3/input_guide.html#input_key
