# BlockEntityRenderer {#blockentityrenderer}

`BlockEntityRenderer`(よく BER と略されます)は、[静的なベイク済みモデル][model]（JSON、OBJ など）では表現できない方法で [Block][block] を描画するために使います。たとえば、チェストのような Block で、コンテナの中身を動的に描画するのに使えます。BlockEntityRenderer を使うには、その Block が [`BlockEntity`][blockentity] を持っている必要があります。Block が他にデータを何も保存しない場合でも同様です。

BER を作るには、`BlockEntityRenderer` を継承したクラスを作成します。このクラスは、Block の `BlockEntity` クラスを指定するジェネリクスの型引数を取り、それが BER の `render` メソッドの引数の型として使われます。

```java
// Assumes the existence of MyBlockEntity as a subclass of BlockEntity.
public class MyBlockEntityRenderer implements BlockEntityRenderer<MyBlockEntity> {
    // Add the constructor parameter for the lambda below. You may also use it to get some context
    // to be stored in local fields, such as the entity renderer dispatcher, if needed.
    public MyBlockEntityRenderer(BlockEntityRendererProvider.Context context) {
    }
    
    // This method is called every frame in order to render the block entity. Parameters are:
    // - blockEntity:   The block entity instance being rendered. Uses the generic type passed to the super interface.
    // - partialTick:   The amount of time, in fractions of a tick (0.0 to 1.0), that has passed since the last tick.
    // - poseStack:     The pose stack to render to.
    // - bufferSource:  The buffer source to get vertex buffers from.
    // - packedLight:   The light value of the block entity.
    // - packedOverlay: The current overlay value of the block entity, usually OverlayTexture.NO_OVERLAY.
    @Override
    public void render(MyBlockEntity blockEntity, float partialTick, PoseStack stack, MultiBufferSource bufferSource, int packedLight, int packedOverlay) {
        // Do the rendering here.
    }
}
```

1 つの `BlockEntityType<?>` に対して存在できる BER は 1 つだけです。そのため、個々の BlockEntity のインスタンスに固有の値は、BER 自体ではなく、その BlockEntity のインスタンスに保存してください。

BER を作成したら、[Mod の EventBus][eventbus] で発火される [Event][event] である `EntityRenderersEvent.RegisterRenderers` に登録する必要もあります。

```java
@SubscribeEvent // on the mod event bus only on the physical client
public static void registerEntityRenderers(EntityRenderersEvent.RegisterRenderers event) {
    event.registerBlockEntityRenderer(
            // The block entity type to register the renderer for.
            MyBlockEntities.MY_BLOCK_ENTITY.get(),
            // A function of BlockEntityRendererProvider.Context to BlockEntityRenderer.
            MyBlockEntityRenderer::new
    );
}
```

BER で BER プロバイダのコンテキストが不要な場合は、コンストラクタを削除することもできます。

```java
public class MyBlockEntityRenderer implements BlockEntityRenderer<MyBlockEntity> {
    @Override
    public void render( /* ... */ ) { /* ... */ }
}

// In some event handler class
@SubscribeEvent // on the mod event bus only on the physical client
public static void registerEntityRenderers(EntityRenderersEvent.RegisterRenderers event) {
    event.registerBlockEntityRenderer(MyBlockEntities.MY_BLOCK_ENTITY.get(),
            // Pass the context to an empty (default) constructor call
            context -> new MyBlockEntityRenderer()
    );
}
```

## `BlockEntityWithoutLevelRenderer`

`BlockEntityWithoutLevelRenderer`(通称 BEWLR)は、通常の `BlockEntityRenderer` を特殊な [Item][item] の描画向けにしたものです(Item にはレベルのコンテキストがないため、「without level」という名前になっています)。全体的な目的は同じで、静的なモデルでは不十分な場合に特殊な描画を行うことです。

BEWLR を追加するには、`BlockEntityWithoutLevelRenderer` を継承し、`#renderByItem` をオーバーライドしたクラスを作成します。コンストラクタでも追加の準備が必要です。

```java
public class MyBlockEntityWithoutLevelRenderer extends BlockEntityWithoutLevelRenderer {
    // We need some boilerplate in the constructor, telling the superclass where to find the central block entity and entity renderers.
    public MyBlockEntityWithoutLevelRenderer() {
        super(Minecraft.getInstance().getBlockEntityRenderDispatcher(), Minecraft.getInstance().getEntityModels());
    }
    
    @Override
    public void renderByItem(ItemStack stack, ItemDisplayContext transform, PoseStack poseStack, MultiBufferSource bufferSource, int packedLight, int packedOverlay) {
        // Do the rendering here.
    }
}
```

BER と同様に、BEWLR のインスタンスも 1 つしかない点に注意してください。そのため、スタック固有のプロパティは BEWLR ではなく、スタックに保存してください。

BER と異なり、BEWLR は直接登録しません。代わりに、`IClientItemExtensions` のインスタンスを `RegisterClientExtensionsEvent` に登録します。`IClientItemExtensions` は、BEWLR をはじめとする、Item の描画に関するさまざまな動作を指定できるインターフェースです。このインターフェースの実装は、たとえば次のようになります。

```java
public class MyClientItemExtensions implements IClientItemExtensions {
    // Cache our BEWLR in a field.
    private final MyBlockEntityWithoutLevelRenderer myBEWLR = new MyBlockEntityWithoutLevelRenderer();

    // Return our BEWLR here.
    @Override
    public BlockEntityWithoutLevelRenderer getCustomRenderer() {
        return myBEWLR;
    }
}
```

そして、`IClientItemExtensions` を Event に登録します。

```java
@SubscribeEvent // on the mod event bus only on the physical client
public static void registerClientExtensions(RegisterClientExtensionsEvent event) {
    event.registerItem(
            // The only instance of our IClientItemExtensions, and as such, the only instance of our BEWLR.
            new MyClientItemExtensions(),
            // A vararg list of items that use this BEWLR.
            MyItems.ITEM_1, MyItems.ITEM_2
    );
}
```

:::info
`IClientItemExtensions` は、一般にシングルトンとして扱うことが想定されています。`RegisterClientExtensionsEvent` の外で構築しないでください!
:::

[block]: ../blocks/index.md
[blockentity]: index.md
[event]: ../concepts/events.md#registering-an-event-handler
[eventbus]: ../concepts/events.md#event-buses
[item]: ../items/index.md
[model]: ../resources/client/models/index.md
