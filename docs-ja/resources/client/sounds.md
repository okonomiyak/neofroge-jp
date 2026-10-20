# サウンド {#sounds}

サウンドは何にも必須ではありませんが、Mod をより奥行きのある、生き生きとしたものにしてくれます。Minecraft にはサウンドを登録・再生するさまざまな方法があり、この記事でそれらを説明します。

## 用語 {#terminology}

Minecraft のサウンドエンジンでは、さまざまなものを指すのにいろいろな用語を使います。

- **サウンドイベント**: サウンドイベントは、特定のサウンドを再生するようサウンドエンジンに指示する、コード内のきっかけです。ゲームに登録するのも `SoundEvent` です。
- **サウンドカテゴリ**または**サウンドソース**: サウンドカテゴリは、個別にオン・オフできる、サウンドのおおまかなグループです。サウンド設定の GUI のスライダー( `master`、`block`、`player` など )が、これらのカテゴリを表しています。コード上では `SoundSource` enum にあります。
- **サウンド定義**: サウンドイベントを 1 つまたは複数のサウンドオブジェクトに対応付けたもので、任意のメタデータも含みます。サウンド定義は、名前空間の [`sounds.json` ファイル][soundsjson]にあります。
- **サウンドオブジェクト**: サウンドファイルの場所と、任意のメタデータからなる JSON オブジェクトです。
- **サウンドファイル**: ディスク上のサウンドファイルです。Minecraft がサポートしているのは `.ogg` のサウンドファイルだけです。

:::danger
OpenAL( Minecraft のオーディオライブラリ )の実装上、サウンドに減衰を持たせる、つまりプレイヤーとの距離に応じて音を小さくしたり大きくしたりするには、サウンドファイルをモノラル( シングルチャンネル )にする必要があります。ステレオ( マルチチャンネル )のサウンドファイルは減衰の対象にならず、常にプレイヤーの位置で再生されるため、環境音や BGM に最適です。[MC-146721][bug] も参照してください。
:::

## `SoundEvent` の作成 {#creating-soundevents}

`SoundEvent` は[登録されるオブジェクト][registration]です。つまり、`DeferredRegister` を通じてゲームに登録する必要があり、シングルトンです。

```java
public class MySoundsClass {
    // Assuming that your mod id is examplemod
    public static final DeferredRegister<SoundEvent> SOUND_EVENTS =
            DeferredRegister.create(BuiltInRegistries.SOUND_EVENT, "examplemod");
    
    // All vanilla sounds use variable range events.
    public static final DeferredHolder<SoundEvent, SoundEvent> MY_SOUND = SOUND_EVENTS.register(
            "my_sound", // must match the resource location on the next line
            () -> SoundEvent.createVariableRangeEvent(ResourceLocation.fromNamespaceAndPath("examplemod", "my_sound"))
    );
    
    // There is a currently unused method to register fixed range (= non-attenuating) events as well:
    public static final DeferredHolder<SoundEvent, SoundEvent> MY_FIXED_SOUND = SOUND_EVENTS.register("my_fixed_sound",
            // 16 is the default range of sounds. Be aware that due to OpenAL limitations,
            // values above 16 have no effect and will be capped to 16.
            () -> SoundEvent.createFixedRangeEvent(ResourceLocation.fromNamespaceAndPath("examplemod", "my_fixed_sound"), 16)
    );
}
```

もちろん、[Mod のコンストラクタ][modctor]で、Registry を [Mod の EventBus][modbus] に追加するのを忘れないでください。

```java
public ExampleMod(IEventBus modBus) {
    MySoundsClass.SOUND_EVENTS.register(modBus);
    // other things here
}
```

これでサウンドイベントができました!

## `sounds.json`

_関連項目: [Minecraft Wiki][mcwiki] の [sounds.json][mcwikisounds]_

次に、サウンドイベントを実際のサウンドファイルに結び付けるため、サウンド定義を作る必要があります。名前空間のサウンド定義はすべて、名前空間のルート直下にある `sounds.json` という 1 つのファイル( サウンド定義ファイルとも呼ばれます )に保存されます。各サウンド定義は、サウンドイベントの ID( 例: `my_sound` )から JSON のサウンドオブジェクトへの対応付けです。名前空間はサウンド定義ファイルがある名前空間で決まるため、サウンドイベントの ID には名前空間を指定しない点に注意してください。`sounds.json` の例は次のようになります。

```json5
{
    // Sound definition for the sound event "examplemod:my_sound"
    "my_sound": {
        // List of sound objects. If this contains more than one element, an element will be chosen randomly.
        "sounds": [
            // Only name is required, all other properties are optional.
            {
                // Location of the sound file, relative to the namespace's sounds folder.
                // This example references a sound at assets/examplemod/sounds/sound_1.ogg.
                "name": "examplemod:sound_1",
                // May be "file" or "event". "file" causes the name to refer to a sound file.
                // "event" causes the name to refer to another sound event. Defaults to "file".
                "type": "file",
                // The volume this sound will be played at. Must be between 0.0 and 1.0 (default).
                "volume": 0.8,
                // The pitch value the sound will be played at.
                // Must be between 0.0 and 2.0. Defaults to 1.0.
                "pitch": 1.1,
                // Weight of this sound when choosing a sound from the sounds list. Defaults to 1.
                "weight": 3,
                // If true, the sound will be streamed from the file instead of loaded all at once.
                // Recommended for sound files that are more than a few seconds long. Defaults to false.
                "stream": true,
                // Manual override for the attenuation distance. Defaults to 16. Ignored by fixed range sound events.
                "attenuation_distance": 8,
                // If true, the sound will be loaded into memory on pack load, instead of when the sound is played.
                // Vanilla uses this for underwater ambience sounds. Defaults to false.
                "preload": true
            },
            // Shortcut for { "name": "examplemod:sound_2" }
            "examplemod:sound_2"
        ]
    },
    "my_fixed_sound": {
        // Optional. If true, replaces sounds from other resource packs instead of adding to them.
        // See the Merging chapter below for more information.
        "replace": true,
        // The translation key of the subtitle displayed when this sound event is triggered.
        "subtitle": "examplemod.my_fixed_sound",
        "sounds": [
            "examplemod:sound_1",
            "examplemod:sound_2"
        ]
    }
}
```

### マージ {#merging}

他のほとんどのリソースファイルと異なり、`sounds.json` は、下にあるパックの値を上書きしません。代わりに、それらはマージされ、1 つにまとめた `sounds.json` ファイルとして解釈されます。2 つの異なるリソースパック RP1 と RP2 にある 2 つの `sounds.json` ファイルで、サウンド `sound_1`、`sound_2`、`sound_3`、`sound_4` が定義されていて、RP2 が RP1 の下に置かれているとします。

RP1 の `sounds.json`:

```json5
{
    "sound_1": {
        "sounds": [
            "sound_1"
        ]
    },
    "sound_2": {
        "replace": true,
        "sounds": [
            "sound_2"
        ]
    },
    "sound_3": {
        "sounds": [
            "sound_3"
        ]
    },
    "sound_4": {
        "replace": true,
        "sounds": [
            "sound_4"
        ]
    }
}
```

RP2 の `sounds.json`:

```json5
{
    "sound_1": {
        "sounds": [
            "sound_5"
        ]
    },
    "sound_2": {
        "sounds": [
            "sound_6"
        ]
    },
    "sound_3": {
        "replace": true,
        "sounds": [
            "sound_7"
        ]
    },
    "sound_4": {
        "replace": true,
        "sounds": [
            "sound_8"
        ]
    }
}
```

ゲームがサウンドの読み込みに使う、まとめた( マージした )`sounds.json` ファイルは、次のようになります( メモリ上にだけ存在し、このファイルがどこかに書き出されることはありません )。

```json5
{
    "sound_1": {
        // replace false and false: add from lower pack, then from upper pack
        "sounds": [
            "sound_5",
            "sound_1"
        ]
    },
    "sound_2": {
        // replace true in upper pack and false in lower pack: add from upper pack only
        "sounds": [
            "sound_2"
        ]
    },
    "sound_3": {
        // replace false in upper pack and true in lower pack: add from lower pack, then from upper pack
        // Would still discard values from a third resource pack sitting below RP2
        "sounds": [
            "sound_7",
            "sound_3"
        ]
    },
    "sound_4": {
        // replace true and true: add from upper pack only
        "sounds": [
            "sound_8"
        ]
    }
}
```

## サウンドの再生 {#playing-sounds}

Minecraft にはサウンドを再生するさまざまなメソッドがあり、どれを使うべきかわかりにくいことがあります。どのメソッドも `SoundEvent` を受け取り、それは自分のものでもバニラのものでもかまいません( バニラのサウンドイベントは `SoundEvents` クラスにあります )。以下のメソッドの説明では、クライアントとサーバーはそれぞれ[論理クライアントと論理サーバー][sides]を指します。

### `Level`

- `playSeededSound(Player player, double x, double y, double z, Holder<SoundEvent> soundEvent, SoundSource soundSource, float volume, float pitch, long seed)`
    - クライアントでの動作: 渡されたプレイヤーがローカルのプレイヤーなら、指定した位置でそのプレイヤーにサウンドイベントを再生します。そうでなければ何もしません。
    - サーバーでの動作: 指定した位置でプレイヤーにサウンドイベントを再生するよう指示するパケットを、渡されたプレイヤー以外のすべてのプレイヤーに送ります。
    - 用途: クライアントから始まり、両方の Side で実行されるコードから呼び出します。サーバーが、操作を始めたプレイヤーには再生しないことで、そのプレイヤーにサウンドイベントが 2 回再生されるのを防ぎます。または、サーバーから始まるコード( 例: [BlockEntity][be] )から、プレイヤーを `null` にして呼び出すと、全員にサウンドを再生できます。
- `playSound(Player player, double x, double y, double z, SoundEvent soundEvent, SoundSource soundSource, float volume, float pitch)`
    - ランダムなシードを選び、`SoundEvent` をホルダーでラップして、`playSeededSound` に転送します
- `playSound(Player player, BlockPos pos, SoundEvent soundEvent, SoundSource soundSource, float volume, float pitch)`
    - `x`、`y`、`z` にそれぞれ `pos.getX() + 0.5`、`pos.getY() + 0.5`、`pos.getZ() + 0.5` の値を使い、上のメソッドに転送します。
- `playLocalSound(double x, double y, double z, SoundEvent soundEvent, SoundSource soundSource, float volume, float pitch, boolean distanceDelay)`
    - クライアントでの動作: 指定した位置でプレイヤーにサウンドを再生します。サーバーには何も送りません。`distanceDelay` が `true` なら、プレイヤーとの距離に応じてサウンドを遅らせます。
    - サーバーでの動作: 何もしません。
    - 用途: サーバーから送られたカスタムパケットから呼び出します。バニラでは雷の音に使われています。

### `ClientLevel`

- `playLocalSound(BlockPos pos, SoundEvent soundEvent, SoundSource soundSource, float volume, float pitch, boolean distanceDelay)`
    - `x`、`y`、`z` にそれぞれ `pos.getX() + 0.5`、`pos.getY() + 0.5`、`pos.getZ() + 0.5` の値を使い、`Level#playLocalSound` に転送します。

### `Entity`

- `playSound(SoundEvent soundEvent, float volume, float pitch)`
    - プレイヤーを `null`、サウンドソースを `Entity#getSoundSource`、x/y/z をエンティティの位置にし、その他は渡された引数を使って、`Level#playSound` に転送します。

### `Player`

- `playSound(SoundEvent soundEvent, float volume, float pitch)`( `Entity` のメソッドをオーバーライドします )
    - プレイヤーを `this`、サウンドソースを `SoundSource.PLAYER`、x/y/z をプレイヤーの位置にし、その他は渡された引数を使って、`Level#playSound` に転送します。そのため、クライアントとサーバーでの動作は `Level#playSound` と同じです。
        - クライアントでの動作: 指定した位置で、クライアントのプレイヤーにサウンドイベントを再生します。
        - サーバーでの動作: このメソッドを呼び出したプレイヤーを除き、指定した位置の近くにいる全員にサウンドイベントを再生します。

## データ生成 {#datagen}

サウンドファイル自体はもちろん[データ生成][datagen]できませんが、`sounds.json` ファイルはできます。そのためには、`SoundDefinitionsProvider` を継承し、`registerSounds()` メソッドをオーバーライドします。

```java
public class MySoundDefinitionsProvider extends SoundDefinitionsProvider {
    // Parameters can be obtained from GatherDataEvent.
    public MySoundDefinitionsProvider(PackOutput output, ExistingFileHelper existingFileHelper) {
        // Use your actual mod id instead of "examplemod".
        super(output, "examplemod", existingFileHelper);
    }

    @Override
    public void registerSounds() {
        // Accepts a Supplier<SoundEvent>, a SoundEvent, or a ResourceLocation as the first parameter.
        add(MySoundsClass.MY_SOUND, SoundDefinition.definition()
            // Add sound objects to the sound definition. Parameter is a vararg.
            .with(
                // Accepts either a string or a ResourceLocation as the first parameter.
                // The second parameter can be either SOUND or EVENT, and can be omitted if the former.
                // A type of SOUND refer to the "file" type mentioned previously
                sound("examplemod:sound_1", SoundDefinition.SoundType.SOUND)
                    // Sets the volume. Also has a double counterpart.
                    .volume(0.8f)
                    // Sets the pitch. Also has a double counterpart.
                    .pitch(1.2f)
                    // Sets the weight.
                    .weight(2)
                    // Sets the attenuation distance.
                    .attenuationDistance(8)
                    // Enables streaming.
                    // Also has a parameterless overload that defers to stream(true).
                    .stream(true)
                    // Enables preloading.
                    // Also has a parameterless overload that defers to preload(true).
                    .preload(true),
                // The shortest we can get.
                sound("examplemod:sound_2")
            )
            // Sets the subtitle.
            .subtitle("sound.examplemod.sound_1")
            // Enables replacing.
            .replace(true)
        );
    }
}
```

他のデータプロバイダと同様に、プロバイダを Event に登録するのを忘れないでください。

```java
@SubscribeEvent // on the mod event bus
public static void gatherData(GatherDataEvent event) {
    DataGenerator generator = event.getGenerator();
    PackOutput output = generator.getPackOutput();
    ExistingFileHelper existingFileHelper = event.getExistingFileHelper();

    // other providers here
    generator.addProvider(
        event.includeClient(),
        new MySoundDefinitionsProvider(output, existingFileHelper)
    );
}
```

[bug]: https://bugs.mojang.com/browse/MC-146721
[datagen]: ../index.md#data-generation
[mcwiki]: https://minecraft.wiki
[mcwikisounds]: https://minecraft.wiki/w/Sounds.json
[modbus]: ../../concepts/events.md#event-buses
[modctor]: ../../gettingstarted/modfiles.md#javafml-and-mod
[registration]: ../../concepts/registries.md
[sides]: ../../concepts/sides.md#the-logical-side
[soundsjson]: #soundsjson
