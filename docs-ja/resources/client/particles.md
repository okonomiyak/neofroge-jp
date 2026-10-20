# パーティクル {#particles}

パーティクルは、ゲームを華やかにし、没入感を高める 2D のエフェクトです。クライアントとサーバーのどちらの [Side][side] でもスポーンさせられますが、主に視覚的なものなので、重要な部分は物理( かつ論理 )クライアント側にしかありません。

## パーティクルの登録 {#registering-particles}

### `ParticleType`

パーティクルは `ParticleType` を使って登録します。これは `EntityType` や `BlockEntityType` と同じような仕組みで、`Particle` クラス( スポーンしたパーティクルはすべてこのクラスのインスタンスです )と、共通の情報を持ち、登録に使う `ParticleType` クラスがあります。`ParticleType` は [Registry][registry] なので、他の登録するオブジェクトと同様に、`DeferredRegister` を使って登録します。

```java
public class MyParticleTypes {
    // Assuming that your mod id is examplemod
    public static final DeferredRegister<ParticleType<?>> PARTICLE_TYPES =
        DeferredRegister.create(BuiltInRegistries.PARTICLE_TYPE, "examplemod");
    
    // The easiest way to add new particle types is reusing vanilla's SimpleParticleType.
    // Implementing a custom ParticleType is also possible, see below.
    public static final DeferredHolder<ParticleType<?>, SimpleParticleType> MY_PARTICLE = PARTICLE_TYPES.register(
        // The name of the particle type.
        "my_particle",
        // The supplier. The boolean parameter denotes whether setting the Particles option in the
        // video settings to Minimal will affect this particle type or not; this is false for
        // most vanilla particles, but true for e.g. explosions, campfire smoke, or squid ink.
        () -> new SimpleParticleType(false)
    );
}
```

:::info
`ParticleType` が必要なのは、サーバー側でパーティクルを扱う必要がある場合だけです。クライアントでは `Particle` を直接使うこともできます。
:::

### `Particle`

`Particle` は、後でワールドにスポーンさせ、プレイヤーに表示するものです。`Particle` を継承して自分で実装することもできますが、多くの場合は代わりに `TextureSheetParticle` を継承するほうがよいでしょう。このクラスには、アニメーションや拡大縮小などのヘルパーがあり、実際の描画も行ってくれます( `Particle` を直接継承する場合は、これらをすべて自分で実装する必要があります )。

`Particle` のプロパティのほとんどは、`gravity`、`lifetime`、`hasPhysics`、`friction` などのフィールドで制御します。自分で実装する意味があるメソッドは `tick` と `move` の 2 つだけで、どちらも名前のとおりの処理を行います。そのため、カスタムのパーティクルのクラスは短いことが多く、たとえば、いくつかのフィールドを設定し、残りを親クラスに任せるコンストラクタだけで済むこともあります。基本的な実装は次のようになります。

```java
public class MyParticle extends TextureSheetParticle {
    private final SpriteSet spriteSet;
    
    // First four parameters are self-explanatory. The SpriteSet parameter is provided by the
    // ParticleProvider, see below. You may also add additional parameters as needed, e.g. xSpeed/ySpeed/zSpeed.
    public MyParticle(ClientLevel level, double x, double y, double z, SpriteSet spriteSet) {
        super(level, x, y, z);
        this.spriteSet = spriteSet;
        this.gravity = 0; // Our particle floats in midair now, because why not.

        // We set the initial sprite here since ticking is not guaranteed to set the sprite
        // before the render method is called.
        this.setSpriteFromAge(spriteSet);
    }
    
    @Override
    public void tick() {
        // Set the sprite for the current particle age, i.e. advance the animation.
        this.setSpriteFromAge(spriteSet);
        // Let super handle further movement. You may replace this with your own movement if needed.
        // You may also override move() if you only want to modify the built-in movement.
        super.tick();
    }
}
```

### `ParticleProvider`

次に、パーティクルのタイプに `ParticleProvider` を登録する必要があります。`ParticleProvider` はクライアント専用のクラスで、`createParticle` メソッドで実際に `Particle` を作成する役割を担います。ここにより凝ったコードを入れることもできますが、多くのパーティクルプロバイダは次のように単純です。

```java
// The generic type of ParticleProvider must match the type of the particle type this provider is for.
public class MyParticleProvider implements ParticleProvider<SimpleParticleType> {
    // A set of particle sprites.
    private final SpriteSet spriteSet;
    
    // The registration function passes a SpriteSet, so we accept that and store it for further use.
    public MyParticleProvider(SpriteSet spriteSet) {
        this.spriteSet = spriteSet;
    }
    
    // This is where the magic happens. We return a new particle each time this method is called!
    // The type of the first parameter matches the generic type passed to the super interface.
    @Override
    public Particle createParticle(SimpleParticleType type, ClientLevel level,
            double x, double y, double z, double xSpeed, double ySpeed, double zSpeed) {
        // We don't use the type and speed, and pass in everything else. You may of course use them if needed.
        return new MyParticle(level, x, y, z, spriteSet);
    }
}
```

そのうえで、[クライアント側][side]の [Mod バス][modbus]の [Event][event] である `RegisterParticleProvidersEvent` で、パーティクルプロバイダをパーティクルのタイプに関連付ける必要があります。

```java
@SubscribeEvent // on the mod event bus only on the physical client
public static void registerParticleProviders(RegisterParticleProvidersEvent event) {
    // There are multiple ways to register providers, all differing in the functional type they provide in the
    // second parameter. For example, #registerSpriteSet represents a Function<SpriteSet, ParticleProvider<?>>:
    event.registerSpriteSet(MyParticleTypes.MY_PARTICLE.get(), MyParticleProvider::new);
    // Other methods include #registerSprite, which is essentially a Supplier<TextureSheetParticle>,
    // and #registerSpecial, which maps to a Supplier<Particle>. See the source code of the event for further info.
}
```

### パーティクルの記述 {#particle-descriptions}

最後に、パーティクルのタイプをテクスチャに関連付ける必要があります。Item をアイテムモデルに関連付けるのと同じように、パーティクルのタイプを、パーティクルの記述と呼ばれるものに関連付けます。パーティクルの記述は `assets/<namespace>/particles` ディレクトリにある JSON ファイルで、パーティクルのタイプと同じ名前にします( たとえば、上の例なら `my_particle.json` )。パーティクルの定義の JSON は次の形式です。

```json5
{
    // A list of textures that will be played in order. Will loop if necessary.
    // Texture locations are relative to the textures/particle folder.
    "textures": [
        "examplemod:my_particle_0",
        "examplemod:my_particle_1",
        "examplemod:my_particle_2",
        "examplemod:my_particle_3"
    ]
}
```

パーティクルの定義は、`SpriteSet` を受け取るパーティクルを使う場合に必要です。これは、`registerSpriteSet` または `registerSprite` でパーティクルプロバイダを登録した場合に当たります。`#registerSpecial` で登録したパーティクルプロバイダには、パーティクルの定義を用意しては**いけません**。

:::danger
スプライトセットのパーティクルファクトリと、パーティクルの定義ファイルの対応が合っていない場合、つまり対応するパーティクルファクトリのないパーティクルの記述がある場合やその逆の場合は、例外がスローされます!
:::

:::note
パーティクルの記述には特定の方法でプロバイダを登録する必要がありますが、実際に使われるのは、( `Particle#getRenderType` で設定する )`ParticleRenderType` が、シェーダーのテクスチャとして `TextureAtlas#LOCATION_PARTICLES` を使う場合だけです。バニラの描画タイプでは、`PARTICLE_SHEET_OPAQUE`、`PARTICLE_SHEET_TRANSLUCENT`、`PARTICLE_SHEET_LIT` がこれに当たります。
:::

### データ生成 {#datagen}

パーティクルの定義ファイルも、`ParticleDescriptionProvider` を継承して `#addDescriptions()` メソッドをオーバーライドすることで、[データ生成][datagen]できます。

```java
public class MyParticleDescriptionProvider extends ParticleDescriptionProvider {
    // Get the parameters from GatherDataEvent.
    public AMParticleDefinitionsProvider(PackOutput output, ExistingFileHelper existingFileHelper) {
        super(output, existingFileHelper);
    }

    // Assumes that all the referenced particles actually exists. Replace "examplemod" with your mod id.
    @Override
    protected void addDescriptions() {
        // Adds a single sprite particle definition with the file at
        // assets/examplemod/textures/particle/my_single_particle.png.
        sprite(MyParticleTypes.MY_SINGLE_PARTICLE.get(), ResourceLocation.fromNamespaceAndPath("examplemod", "my_single_particle"));
        // Adds a multi sprite particle definition, with a vararg parameter. Alternatively accepts a list.
        spriteSet(MyParticleTypes.MY_MULTI_PARTICLE.get(),
            ResourceLocation.fromNamespaceAndPath("examplemod", "my_multi_particle_0"),
            ResourceLocation.fromNamespaceAndPath("examplemod", "my_multi_particle_1"),
            ResourceLocation.fromNamespaceAndPath("examplemod", "my_multi_particle_2")
        );
        // Alternative for the above, appends "_<index>" to the base name given, for the given amount of textures.
        spriteSet(MyParticleTypes.MY_ALT_MULTI_PARTICLE.get(),
            // The base name.
            ResourceLocation.fromNamespaceAndPath("examplemod", "my_multi_particle"),
            // The amount of textures.
            3,
            // Whether to reverse the list, i.e. start at the last element instead of the first.
            false
        );
    }
}
```

プロバイダを `GatherDataEvent` に追加するのを忘れないでください。

```java
@SubscribeEvent // on the mod event bus
public static void gatherData(GatherDataEvent event) {
    DataGenerator generator = event.getGenerator();
    PackOutput output = generator.getPackOutput();
    ExistingFileHelper existingFileHelper = event.getExistingFileHelper();

    // other providers here
    generator.addProvider(
        event.includeClient(),
        new MyParticleDescriptionProvider(output, existingFileHelper)
    );
}
```

### カスタムの `ParticleType` {#custom-particletypes}

ほとんどの場合は `SimpleParticleType` で十分ですが、サーバー側でパーティクルに追加のデータを持たせる必要があることもあります。その場合は、カスタムの `ParticleType` と、それに対応するカスタムの `ParticleOptions` が必要です。まずは、実際に情報を保存する `ParticleOptions` から始めましょう。

```java
public class MyParticleOptions implements ParticleOptions {
    
    // Read and write information, typically for use in commands
    // Since there is no information in this type, this will be an empty string
    public static final MapCodec<MyParticleOptions> CODEC = MapCodec.unit(new MyParticleOptions());

    // Read and write information to the network buffer.
    public static final StreamCodec<ByteBuf, MyParticleOptions> STREAM_CODEC = StreamCodec.unit(new MyParticleOptions());

    // Does not need any parameters, but may define any fields necessary for the particle to work.
    public MyParticleOptions() {}
}
```

次に、この `ParticleOptions` の実装をカスタムの `ParticleType` で使い……

```java
public class MyParticleType extends ParticleType<MyParticleOptions> {
    // The boolean parameter again determines whether to limit particles at lower particle settings.
    // See implementation of the MyParticleTypes class near the top of the article for more information.
    public MyParticleType(boolean overrideLimiter) {
        // Pass the deserializer to super.
        super(overrideLimiter);
    }

    @Override
    public MapCodec<MyParticleOptions> codec() {
        return MyParticleOptions.CODEC;
    }

    @Override
    public StreamCodec<? super RegistryFriendlyByteBuf, MyParticleOptions> streamCodec() {
        return MyParticleOptions.STREAM_CODEC;
    }
}
```

……登録時にそれを参照します。

```java
public static final Supplier<MyParticleType> MY_CUSTOM_PARTICLE = PARTICLE_TYPES.register(
    "my_custom_particle",
    () -> new MyParticleType(false)
);
```

## パーティクルのスポーン {#spawning-particles}

前述のとおり、サーバーが知っているのは `ParticleType` と `ParticleOption` だけで、クライアントは `ParticleType` に関連付けられた `ParticleProvider` が提供する `Particle` を直接扱います。そのため、パーティクルをスポーンさせる方法は、どちらの Side にいるかによって大きく異なります。

- **共通のコード**: `Level#addParticle` または `Level#addAlwaysVisibleParticle` を呼び出します。誰にでも見えるパーティクルを作る方法としては、これが推奨されます。
- **クライアントのコード**: 共通のコードの方法を使います。または、好きなパーティクルのクラスで `new Particle()` を作り、そのパーティクルを渡して `Minecraft.getInstance().particleEngine#add(Particle)` を呼び出します。この方法で追加したパーティクルはそのクライアントにしか表示されず、他のプレイヤーには見えない点に注意してください。
- **サーバーのコード**: `ServerLevel#sendParticles` を呼び出します。バニラでは `/particle` コマンドで使われています。

[datagen]: ../index.md#data-generation
[event]: ../../concepts/events.md
[modbus]: ../../concepts/events.md#event-buses
[registry]: ../../concepts/registries.md
[side]: ../../concepts/sides.md
