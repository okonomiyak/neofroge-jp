# 画面 {#screens}

画面は通常、Minecraft のすべてのグラフィカルユーザーインターフェース( GUI )の土台です。ユーザーの入力を受け取り、サーバーで検証し、その結果の動作をクライアントに同期し直します。画面は[メニュー][menus]と組み合わせて、インベントリのようなビューのための通信の仕組みを作ることもできますし、Mod 開発者が独自の[ネットワーク][network]実装で扱う単独の画面にすることもできます。

画面は多くの部品からできているため、Minecraft における「画面」が実際に何なのかを完全に理解するのは難しいものです。そこでこのドキュメントでは、画面そのものを説明する前に、画面を構成する各要素とその使われ方を見ていきます。

## 相対座標 {#relative-coordinates}

何かを描画するときは、それがどこに表示されるかを指定する何らかの識別子が必要です。多くの抽象化を経て、Minecraft の描画呼び出しのほとんどは、座標平面上の x、y、z の値を受け取ります。x の値は左から右へ、y は上から下へ、z は奥から手前へ増えます。ただし、座標は決まった範囲に固定されていません。その範囲は、画面のサイズや、ゲームのオプションで指定した「GUI の大きさ」によって変わることがあります。そのため、描画呼び出しに渡す座標の値が、変化しうる画面サイズに合わせて正しくスケールされる( 正しく相対化される )よう、特に注意する必要があります。

座標を相対化する方法については、[画面][screen]のセクションを参照してください。

:::caution
固定の座標を使ったり、画面のスケールを誤ったりすると、描画されたオブジェクトがおかしく見えたり、ずれた位置に表示されたりすることがあります。座標を正しく相対化できたかを簡単に確認するには、ビデオ設定の「GUI の大きさ」ボタンをクリックしてみてください。この値は、GUI を描画するスケールを決めるときに、ディスプレイの幅と高さを割る除数として使われます。
:::

## GuiGraphics {#gui-graphics}

Minecraft が描画する GUI は、通常 `GuiGraphics` を使って描画されます。`GuiGraphics` はほぼすべての描画メソッドの最初の引数で、よく使うオブジェクトを描画するための基本的なメソッドを持っています。これらは、色付きの矩形、文字列、テクスチャ、アイテム、ツールチップの 5 つに分類されます。コンポーネントの一部だけを描画するための追加のメソッド( `#enableScissor` / `#disableScissor` )もあります。`GuiGraphics` は `PoseStack` も公開しています。これは、コンポーネントを描画すべき位置に正しく描画するために必要な変換を適用します。また、色は [ARGB][argb] 形式です。

### 色付きの矩形 {#colored-rectangles}

色付きの矩形は、位置と色のシェーダーで描画されます。すべての塗りつぶしメソッドは、矩形の描画方法を指定する `RenderType` を任意で受け取れます。描画できる色付きの矩形は 3 種類あります。

1 つ目は、幅 1 ピクセルの色付きの水平線と垂直線で、それぞれ `#hLine` と `#vLine` です。`#hLine` は、左端と右端( 両端を含む )を定める 2 つの x 座標、上端の y 座標、色を受け取ります。`#vLine` は、左端の x 座標、上端と下端( 両端を含む )を定める 2 つの y 座標、色を受け取ります。

2 つ目は、画面に矩形を描画する `#fill` メソッドです。線のメソッドは、内部でこのメソッドを呼び出しています。これは、左端の x 座標、上端の y 座標、右端の x 座標、下端の y 座標、色を受け取ります。`#fillRenderType` も同じことをしますが、座標の位置を補正せずに頂点を描画します。

最後は、縦方向のグラデーションの矩形を描画する `#fillGradient` メソッドです。これは、右端の x 座標、下端の y 座標、左端の x 座標、上端の y 座標、z 座標、下端と上端の色を受け取ります。

### 文字列 {#strings}

文字列は `Font` で描画されます。これは一般に、通常、透過、オフセットの各モード用の独自のシェーダーを持っています。描画できる文字列の揃え方は 2 種類あり、どちらも影付きです。左揃えの文字列( `#drawString` )と中央揃えの文字列( `#drawCenteredString` )です。どちらも、文字列を描画するフォント、描画する文字列、それぞれ文字列の左端または中央を表す x 座標、上端の y 座標、色を受け取ります。

テキストを指定した範囲内で折り返したい場合は、代わりに `#drawWordWrap` を使えます。これはデフォルトで左揃えの文字列を描画します。

:::note
文字列は通常、[`Component`][component] として渡してください。メソッドの他の 2 つのオーバーロードを含め、さまざまな用途に対応できるためです。
:::

### テクスチャ {#textures}

テクスチャはブリット( blit )によって描画されます。メソッド名が `#blit` なのはそのためで、ここでは画像のビットをコピーして画面に直接描画することを指します。これらは、位置とテクスチャのシェーダーで描画されます。

各 `#blit` メソッドは、テクスチャの絶対的な場所を表す `ResourceLocation` を受け取ります。

```java
// Points to 'assets/examplemod/textures/gui/container/example_container.png'
private static final ResourceLocation TEXTURE = ResourceLocation.fromNamespaceAndPath("examplemod", "textures/gui/container/example_container.png");
```

`#blit` には多くのオーバーロードがありますが、ここではそのうち 2 つだけを説明します。

1 つ目の `#blit` は 6 つの整数を受け取り、描画するテクスチャが 256 × 256 の PNG ファイル上にあると仮定します。画面上の左端の x 座標と上端の y 座標、PNG 内の左端の x 座標と上端の y 座標、描画する画像の幅と高さを受け取ります。

:::tip
対応する UV の値を得るために座標を正規化できるよう、PNG ファイルのサイズを指定する必要があります。
:::

1 つ目から呼び出される 2 つ目の `#blit` は、これを 7 つの整数と、PNG の座標用の 2 つの float に拡張したもので、画像が PNG ファイル上にあることだけを仮定します。画面上の左端の x 座標と上端の y 座標、z 座標( ブリットオフセットと呼ばれます )、PNG 内の左端の x 座標と上端の y 座標、描画する画像の幅と高さ、PNG ファイルの幅と高さを受け取ります。

#### `blitSprite`

`#blitSprite` は `#blit` の特殊な実装で、テクスチャが GUI のテクスチャアトラスに書き込まれます。かまどの GUI の「燃焼の進行」のオーバーレイなど、背景の上に重ねるテクスチャのほとんどはスプライトです。スプライトのテクスチャはすべて `textures/gui/sprites` からの相対パスで、ファイルの拡張子を指定する必要はありません。

```java
// Points to 'assets/examplemod/textures/gui/sprites/container/example_container/example_sprite.png'
private static final ResourceLocation SPRITE = ResourceLocation.fromNamespaceAndPath("examplemod", "container/example_container/example_sprite");
```

`#blitSprite` メソッドの一方のグループは、スプライト内の x 座標と y 座標を除いて、`#blit` と同じ引数を取ります。

もう一方の `#blitSprite` メソッドは、スプライトの一部を描画できるよう、より多くのテクスチャ情報を受け取ります。これらのメソッドは、テクスチャの幅と高さ、スプライト内の x 座標と y 座標、画面上の左端の x 座標と上端の y 座標、z 座標( ブリットオフセットと呼ばれます )、描画する画像の幅と高さを受け取ります。

スプライトのサイズがテクスチャのサイズと一致しない場合、スプライトは `stretch`、`tile`、`nine_slice` の 3 通りの方法でスケールできます。`stretch` は、画像をテクスチャのサイズから画面のサイズまで引き伸ばします。`tile` は、画面のサイズに達するまでテクスチャを繰り返し描画します。`nine_slice` は、テクスチャを中央 1 つ、辺 4 つ、角 4 つに分割し、必要な画面のサイズまでテクスチャを敷き詰めます。

これは、テクスチャファイルと同じ名前の mcmeta ファイルに、`gui.scaling` の JSON オブジェクトを追加して設定します。

```json5
// For some texture file example_sprite.png
// In example_sprite.png.mcmeta

// Stretch example
{
    "gui": {
        "scaling": {
            "type": "stretch"
        }
    }
}

// Tile example
{
    "gui": {
        "scaling": {
            "type": "tile",
            // The size to begin tiling at
            // This is usually the size of the texture
            "width": 40,
            "height": 40
        }
    }
}

// Nine slice example
{
    "gui": {
        "scaling": {
            "type": "nine_slice",
            // The size to begin tiling at
            // This is usually the size of the texture
            "width": 40,
            "height": 40,
            "border": {
                // The padding of the texture that will be sliced into the border texture
                "left": 1,
                "right": 1,
                "top": 1,
                "bottom": 1
            }
        }
    }
}
```

#### ブリットオフセット {#blit-offset}

テクスチャを描画するときの z 座標は、通常ブリットオフセットに設定されます。このオフセットは、画面を表示するときに描画を正しく重ねる役割を担います。z 座標が小さいものは奥に、逆に z 座標が大きいものは手前に描画されます。z オフセットは、`#translate` で `PoseStack` 自体に直接設定できます。`GuiGraphics` の一部のメソッド( 例: アイテムの描画 )では、基本的なオフセットのロジックが内部で適用されます。

:::caution
ブリットオフセットを設定した場合は、オブジェクトを描画した後に元に戻す必要があります。そうしないと、画面内の他のオブジェクトが誤った階層に描画され、表示の問題が起きることがあります。移動する前に現在のポーズを push し、そのオフセットでの描画がすべて終わった後に pop することをおすすめします。
:::

## Renderable

`Renderable` は、本質的には描画されるオブジェクトです。画面、ボタン、チャット欄、リストなどが含まれます。`Renderable` が持つメソッドは `#render` の 1 つだけです。これは、画面に描画するための `GuiGraphics`、相対的な画面サイズに合わせてスケールされたマウスの x 座標と y 座標、そして tick デルタ( 前のフレームから何 tick 経過したか )を受け取ります。

よくある Renderable には、画面と「ウィジェット」があります。ウィジェットとは、通常画面上に描画される操作可能な要素で、`Button`、そのサブタイプの `ImageButton`、画面上でテキストを入力するための `EditBox` などです。

## GuiEventListener

Minecraft で描画される画面は、すべて `GuiEventListener` を実装しています。`GuiEventListener` は、画面に対するユーザーの操作を処理する役割を担います。これには、マウスからの入力( 移動、クリック、離す、ドラッグ、スクロール、マウスオーバー )と、キーボードからの入力( 押す、離す、文字入力 )が含まれます。各メソッドは、その操作が画面に正しく作用したかどうかを返します。ボタン、チャット欄、リストなどのウィジェットも、このインターフェースを実装しています。

### ContainerEventHandler

`GuiEventListener` とほぼ同義なのが、そのサブタイプである `ContainerEventHandler` です。これは、ウィジェットを含む画面でのユーザーの操作を処理する役割を担い、現在どのウィジェットにフォーカスがあるか、操作をどう適用するかを管理します。`ContainerEventHandler` は、操作可能な子要素、ドラッグ、フォーカスの 3 つの機能を追加します。

イベントハンドラは、要素を操作する順序を決めるための子要素を保持します。マウスのイベントハンドラ( ドラッグを除く )では、リスト内でマウスが重なっている最初の子要素のロジックが実行されます。

マウスで要素をドラッグする処理は `#mouseClicked` と `#mouseReleased` で実装され、より精密にロジックを実行できます。

フォーカスを使うと、キーボードのイベントやマウスのドラッグなど、イベントの実行中に特定の子要素を最初にチェックして処理できます。フォーカスは通常 `#setFocused` で設定します。さらに、`#nextFocusPath` を使うと、渡された `FocusNavigationEvent` に基づいて子要素を選び、操作可能な子要素を順に切り替えられます。

:::note
画面は `AbstractContainerEventHandler` を通じて `ContainerEventHandler` を実装しています。前者は、子要素のドラッグとフォーカスのための setter と getter のロジックを追加します。
:::

## NarratableEntry

`NarratableEntry` は、Minecraft のアクセシビリティ機能であるナレーターで読み上げられる要素です。各要素は、何にマウスが重なっているか、何が選択されているかに応じて、異なるナレーションを提供できます。優先順位は通常、フォーカス、マウスオーバー、その他すべての場合の順です。

`NarratableEntry` には 3 つのメソッドがあります。要素の優先度を決めるもの( `#narrationPriority` )、ナレーションを読み上げるかどうかを決めるもの( `#isActive` )、そして読み上げや表示などの出力先にナレーションを提供するもの( `#updateNarration` )です。

:::note
Minecraft のウィジェットはすべて `NarratableEntry` なので、既存のサブタイプを使う場合は、通常手動で実装する必要はありません。
:::

## Screen のサブタイプ {#the-screen-subtype}

ここまでの知識があれば、基本的な画面を構築できます。理解しやすいように、画面の構成要素を、通常出会う順に説明します。

まず、すべての画面は、画面のタイトルを表す `Component` を受け取ります。このコンポーネントは通常、サブタイプのいずれかによって画面に描画されます。基本の画面では、ナレーションのメッセージにのみ使われます。

```java
// In some Screen subclass
public MyScreen(Component title) {
    super(title);
}
```

### 初期化 {#initialization}

画面が初期化されると、`#init` メソッドが呼ばれます。`#init` メソッドは、`Minecraft` のインスタンスや、ゲームによってスケールされた相対的な幅と高さなど、画面内の初期設定を行います。ウィジェットの追加や相対座標の事前計算などの準備は、すべてこのメソッドで行ってください。ゲームのウィンドウのサイズが変わると、`#init` メソッドが呼ばれて画面が再初期化されます。

画面にウィジェットを追加する方法は 3 つあり、それぞれ目的が異なります。

メソッド                 | 説明
:---:                  | :---
`#addWidget`           | 操作可能でナレーションされるが、描画はされないウィジェットを追加します。
`#addRenderableOnly`   | 描画だけされるウィジェットを追加します。操作もナレーションもされません。
`#addRenderableWidget` | 操作可能で、ナレーションされ、描画もされるウィジェットを追加します。

通常、最もよく使うのは `#addRenderableWidget` です。

```java
// In some Screen subclass
@Override
protected void init() {
    super.init();

    // Add widgets and precomputed values
    this.addRenderableWidget(new EditBox(/* ... */));
}
```

### 画面の tick 処理 {#ticking-screens}

画面も `#tick` メソッドで tick 処理を行い、描画のためのクライアント側のロジックをある程度実行します。

```java
// In some Screen subclass
@Override
public void tick() {
    super.tick();

    // Execute some logic every frame
}
```

### 入力の処理 {#input-handling}

画面は `GuiEventListener` のサブタイプなので、入力ハンドラをオーバーライドすることもできます。たとえば、特定の[キー入力][keymapping]でロジックを処理する場合です。

### 画面の描画 {#rendering-the-screen}

最後に、画面は `Renderable` のサブタイプであることで提供される `#render` メソッドで描画されます。前述のとおり、`#render` メソッドは、背景、ウィジェット、ツールチップなど、画面が描画すべきものすべてを毎フレーム描画します。デフォルトでは、`#render` メソッドはウィジェットだけを画面に描画します。

画面内で描画されるもののうち、通常サブタイプでは扱われない最も一般的な 2 つは、背景とツールチップです。

背景は `#renderBackground` で描画できます。そのうちの 1 つのメソッドは、画面の背後にレベルを描画できないときに使うオプション画面の背景用に、v オフセットを受け取ります。

ツールチップは `GuiGraphics#renderTooltip` または `GuiGraphics#renderComponentTooltip` で描画します。これらは、描画するテキストコンポーネント、任意のカスタムツールチップコンポーネント、画面上でツールチップを描画すべき位置の相対的な x / y 座標を受け取ります。

```java
// In some Screen subclass

// mouseX and mouseY indicate the scaled coordinates of where the cursor is in on the screen
@Override
public void render(GuiGraphics graphics, int mouseX, int mouseY, float partialTick) {
    // Background is typically rendered first
    this.renderBackground(graphics);

    // Render things here before widgets (background textures)

    // Then the widgets if this is a direct child of the Screen
    super.render(graphics, mouseX, mouseY, partialTick);

    // Render things after widgets (tooltips)
}
```

### 画面を閉じる {#closing-the-screen}

画面が閉じられるときは、`#onClose` と `#removed` の 2 つのメソッドが後片付けを行います。

`#onClose` は、ユーザーが現在の画面を閉じる入力をするたびに呼ばれます。このメソッドは通常、画面自体の内部処理を破棄・保存するためのコールバックとして使われます。サーバーへのパケットの送信もこれに含まれます。

`#removed` は、画面が切り替わってガベージコレクタに解放される直前に呼ばれます。画面が開かれる前の初期状態に戻されていないものを、ここで処理します。

```java
// In some Screen subclass

@Override
public void onClose() {
    // Stop any handlers here

    // Call last in case it interferes with the override
    super.onClose();
}

@Override
public void removed() {
    // Reset initial states here

    // Call last in case it interferes with the override
    super.removed()
;}
```

## `AbstractContainerScreen`

画面が[メニュー][menus]に直接紐づく場合は、代わりに `AbstractContainerScreen` のサブクラスを作ってください。`AbstractContainerScreen` は、メニューの描画と入力処理を担い、スロットの同期や操作のためのロジックを持っています。そのため、通常は 2 つのメソッドをオーバーライドまたは実装するだけで、動作するコンテナ画面を作れます。ここでも理解しやすいように、コンテナ画面の構成要素を、通常出会う順に説明します。

`AbstractContainerScreen` は通常、3 つの引数を必要とします。開かれるコンテナのメニュー( ジェネリクスの `T` で表されます )、プレイヤーのインベントリ( 表示名のためだけに使います )、画面自体のタイトルです。ここでは、位置に関するいくつかのフィールドを設定できます。

フィールド             | 説明
:---:             | :---
`imageWidth`      | 背景に使うテクスチャの幅。通常は 256 × 256 の PNG 内にあり、デフォルトは 176 です。
`imageHeight`     | 背景に使うテクスチャの高さ。通常は 256 × 256 の PNG 内にあり、デフォルトは 166 です。
`titleLabelX`     | 画面のタイトルを描画する位置の、相対的な x 座標。
`titleLabelY`     | 画面のタイトルを描画する位置の、相対的な y 座標。
`inventoryLabelX` | プレイヤーのインベントリ名を描画する位置の、相対的な x 座標。
`inventoryLabelY` | プレイヤーのインベントリ名を描画する位置の、相対的な y 座標。

:::caution
前のセクションで、事前計算した相対座標は `#init` メソッドで設定すべきだと述べました。ここで挙げた値は事前計算した座標ではなく、固定の値と相対化された座標なので、その説明は引き続き当てはまります。

画像の値は背景テクスチャのサイズを表すため、固定で変わりません。描画を楽にするため、`#init` メソッドでは追加の 2 つの値( `leftPos` と `topPos` )が事前計算されます。これらは背景を描画する位置の左上の角を示します。ラベルの座標は、これらの値からの相対位置です。

`leftPos` と `topPos` は、`#blit` メソッドに渡す位置をすでに表しているため、背景を描画するときにも便利に使えます。
:::

```java
// In some AbstractContainerScreen subclass
public MyContainerScreen(MyMenu menu, Inventory playerInventory, Component title) {
    super(menu, playerInventory, title);

    this.titleLabelX = 10;
    this.inventoryLabelX = 10;

    /*
     * If the 'imageHeight' is changed, 'inventoryLabelY' must also be
     * changed as the value depends on the 'imageHeight' value.
     */
}
```

### メニューへのアクセス {#menu-access}

メニューは画面に渡されるので、メニュー内にあって( スロット、データスロット、独自の仕組みのいずれかで )同期された値には、`menu` フィールドからアクセスできます。

### コンテナの tick 処理 {#container-tick}

コンテナ画面は、プレイヤーが生きていて画面を見ているとき、`#tick` メソッドの中で `#containerTick` によって tick 処理を行います。これはコンテナ画面における実質的な `#tick` の代わりで、最もよくある用途はレシピ本の tick 処理です。

```java
// In some AbstractContainerScreen subclass
@Override
protected void containerTick() {
    super.containerTick();

    // Tick things here
}
```

### コンテナ画面の描画 {#rendering-the-container-screen}

コンテナ画面は、3 つのメソッドにまたがって描画されます。背景のテクスチャを描画する `#renderBg`、背景の上にテキストを描画する `#renderLabels`、そして前の 2 つのメソッドを包含し、さらにグレーアウトした背景とツールチップを提供する `#render` です。

まず `#render` について、最もよくある( そして通常は唯一の )オーバーライドは、背景を追加し、super を呼び出してコンテナ画面を描画し、最後にその上にツールチップを描画するものです。

```java
// In some AbstractContainerScreen subclass
@Override
public void render(GuiGraphics graphics, int mouseX, int mouseY, float partialTick) {
    this.renderBackground(graphics);
    super.render(graphics, mouseX, mouseY, partialTick);

    /*
     * This method is added by the container screen to render
     * the tooltip of the hovered slot.
     */
    this.renderTooltip(graphics, mouseX, mouseY);
}
```

super の中では、画面の背景を描画するために `#renderBg` が呼ばれます。最も標準的な実装では、3 つのメソッド呼び出しを使います。2 つは準備用、1 つは背景テクスチャの描画用です。

```java
// In some AbstractContainerScreen subclass

// The location of the background texture (assets/<namespace>/<path>)
private static final ResourceLocation BACKGROUND_LOCATION = ResourceLocation.fromNamespaceAndPath(MOD_ID, "textures/gui/container/my_container_screen.png");

@Override
protected void renderBg(GuiGraphics graphics, float partialTick, int mouseX, int mouseY) {
    /*
     * Renders the background texture to the screen. 'leftPos' and
     * 'topPos' should already represent the top left corner of where
     * the texture should be rendered as it was precomputed from the
     * 'imageWidth' and 'imageHeight'. The two zeros represent the
     * integer u/v coordinates inside the 256 x 256 PNG file.
     */
    graphics.blit(BACKGROUND_LOCATION, this.leftPos, this.topPos, 0, 0, this.imageWidth, this.imageHeight);
}
```

最後に、背景より上、ツールチップより下にテキストを描画するために `#renderLabels` が呼ばれます。これは単に、フォントを使って対応するコンポーネントを描画します。

```java
// In some AbstractContainerScreen subclass
@Override
protected void renderLabels(GuiGraphics graphics, int mouseX, int mouseY) {
    super.renderLabels(graphics, mouseX, mouseY);

    // Assume we have some Component 'label'
    // 'label' is drawn at 'labelX' and 'labelY'
    graphics.drawString(this.font, this.label, this.labelX, this.labelY, 0x404040);
}
```

:::note
ラベルを描画するときに、`leftPos` と `topPos` のオフセットを指定する必要は**ありません**。それらはすでに `PoseStack` 内で移動されているため、このメソッド内のものはすべて、それらの座標を基準に描画されます。
:::

## AbstractContainerScreen の登録 {#registering-an-abstractcontainerscreen}

`AbstractContainerScreen` をメニューで使うには、登録する必要があります。これは、[**Mod の EventBus**][modbus] で `RegisterMenuScreensEvent` の中から `register` を呼び出して行います。

```java
@SubscribeEvent // on the mod event bus only on the physical client
public static void registerScreens(RegisterMenuScreensEvent event) {
    event.register(MY_MENU.get(), MyContainerScreen::new);
}
```

[menus]: ./menus.md
[network]: ../networking/index.md
[screen]: #the-screen-subtype
[argb]: https://en.wikipedia.org/wiki/RGBA_color_model#ARGB32
[component]: ../resources/client/i18n.md#components
[keymapping]: ../misc/keymappings.md#inside-a-gui
[modbus]: ../concepts/events.md#event-buses
