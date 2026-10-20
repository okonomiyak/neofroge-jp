# コンフィグ {#configuration}

コンフィグは、Mod のインスタンスに適用できる設定やユーザーの好みを定義します。NeoForge は、[TOML][toml] ファイルを使い、[NightConfig][nightconfig] で読み込むコンフィグの仕組みを採用しています。

## コンフィグの作成 {#creating-a-configuration}

コンフィグは、`IConfigSpec` のサブタイプを使って作成できます。NeoForge はこの型を `ModConfigSpec` として実装しており、`ModConfigSpec.Builder` で構築できるようにしています。ビルダーでは、`Builder#push` でセクションを作り、`Builder#pop` でセクションを抜けることで、コンフィグの値をセクションに分けられます。その後、次の 2 つのメソッドのいずれかでコンフィグをビルドできます。

 メソッド     | 説明
 :---       | :---
`build`     | `ModConfigSpec` を作成します。
`configure` | コンフィグの値を保持するクラスと `ModConfigSpec` のペアを作成します。

:::note
`ModConfigSpec.Builder#configure` は通常、`static` ブロックと、値を紐づけて保持するためにコンストラクタで `ModConfigSpec.Builder` を受け取るクラスと組み合わせて使います。

```java
//Define a field to keep the config and spec for later
public static final ExampleConfig CONFIG;
public static final ModConfigSpec CONFIG_SPEC;
    
//CONFIG and CONFIG_SPEC are both built from the same builder, so we use a static block to seperate the properties
static {
    Pair<ExampleConfig, ModConfigSpec> pair =
            new ModConfigSpec.Builder().configure(ExampleConfig::new);
        
    //Store the resulting values
    CONFIG = pair.getLeft();
    CONFIG_SPEC = pair.getRight();
}
```
:::

コンフィグの各値には、追加の動作を与えるための追加のコンテキストを指定できます。コンテキストは、コンフィグの値を完全にビルドする前に定義する必要があります。

| メソッド         | 説明                                                                                                 |
|:---------------|:------------------------------------------------------------------------------------------------------------|
| `comment`      | コンフィグの値が何をするかの説明を指定します。複数の文字列を渡すと、複数行のコメントになります。 |
| `translation`  | コンフィグの値の名前に使う翻訳キーを指定します。                                                |
| `worldRestart` | コンフィグの値を変更するには、ワールドを再起動する必要があります。                                         |

### ConfigValue

コンフィグの値は、`#define` 系のいずれかのメソッドを使い、( 定義されていれば )指定したコンテキストとともにビルドできます。

コンフィグの値のメソッドは、どれも少なくとも 2 つの要素を受け取ります。

- 変数の名前を表すパス。コンフィグの値が属するセクションを表す、`.` 区切りの文字列です。
- 有効なコンフィグがない場合のデフォルト値

`ConfigValue` 固有のメソッドは、さらに 2 つの要素を受け取ります。

- デシリアライズしたオブジェクトが有効かを確かめるバリデータ
- コンフィグの値のデータ型を表すクラス

```java
//Store the config properties as public finals
public final ModConfigSpec.ConfigValue<String> welcomeMessage;

private ExampleConfig(ModConfigSpec.Builder builder) {
    //Define each property
    //One property could be a message to log to the console when the game is initialised
    welcomeMessage = builder.define("welcome_message", "Hello from the config!");
}
```

値そのものは `ConfigValue#get` で取得できます。さらに、ファイルから何度も読み込まないよう、値はキャッシュされます。

#### その他のコンフィグの値の型 {#additional-config-value-types}

- **範囲の値**
    - 説明: 値は定義した範囲内にある必要があります
    - クラスの型: `Comparable<T>`
    - メソッド名: `#defineInRange`
    - 追加の要素:
        - コンフィグの値が取りうる最小値と最大値
        - コンフィグの値のデータ型を表すクラス

:::note
`DoubleValue`、`IntValue`、`LongValue` は範囲の値で、クラスをそれぞれ `Double`、`Integer`、`Long` に指定したものです。
:::

- **許可リストの値**
    - 説明: 値は渡したコレクションに含まれている必要があります
    - クラスの型: `T`
    - メソッド名: `#defineInList`
    - 追加の要素:
        - A collection of the allowed values the configuration can be

- **リストの値**
    - 説明: 値はエントリのリストです
    - クラスの型: `List<T>`
    - メソッド名: `#defineList`。リストが空でもよい場合は `#defineListAllowEmpty`
    - 追加の要素:
        - コンフィグ画面で新しいエントリを追加するときに使うデフォルト値を返す Supplier
        - デシリアライズしたリストの要素が有効かを確かめるバリデータ
        - ( 任意 )リストのエントリが少なすぎたり多すぎたりしないかを確かめるバリデータ

- **enum の値**
    - 説明: 渡したコレクションに含まれる enum の値
    - クラスの型: `Enum<T>`
    - メソッド名: `#defineEnum`
    - 追加の要素:
        - 文字列または整数を enum に変換する getter
        - A collection of the allowed values the configuration can be

- **真偽値**
    - 説明: `boolean` の値
    - クラスの型: `Boolean`
    - メソッド名: `#define`

## コンフィグの登録 {#registering-a-configuration}

`ModConfigSpec` をビルドしたら、NeoForge が必要に応じてコンフィグの設定を読み込み、追跡し、同期できるよう、登録する必要があります。コンフィグは、Mod のコンストラクタで `ModContainer#registerConfig` を使って登録してください。コンフィグは、そのコンフィグが属する Side を表す[タイプ][configtype]、`ModConfigSpec`、そして任意でコンフィグの特定のファイル名を指定して登録できます。

```java
// In the main mod file with a ModConfigSpec CONFIG_SPEC
public ExampleMod(ModContainer container) {
    ...
    //Register the config
    container.registerConfig(ModConfig.Type.COMMON, ExampleConfig.CONFIG_SPEC);
    ...
}
```

### コンフィグのタイプ {#configuration-types}

コンフィグのタイプによって、コンフィグファイルの場所、読み込まれるタイミング、ファイルがネットワーク経由で同期されるかどうかが決まります。デフォルトでは、すべてのコンフィグは、物理クライアントでは `.minecraft/config` から、物理サーバーでは `<server_folder>/config` から読み込まれます。各タイプの細かな違いは、以下で説明します。

:::tip
NeoForge は、[コンフィグのタイプ][type]をコードベース内で文書化しています。
:::

- `STARTUP`
    - 物理クライアントと物理サーバーの両方で、config フォルダから読み込まれます
    - 登録時にすぐ読み込まれます
    - ネットワーク経由では同期**されません**
    - デフォルトでは `-startup` の接尾辞が付きます

:::warning
`STARTUP` タイプで登録したコンフィグは、たとえばコンテンツの登録を無効にするのに使った場合など、クライアントとサーバーの間で非同期を引き起こすことがあります。そのため、`STARTUP` のコンフィグは、Mod のコンテンツを変えうる機能の有効・無効の切り替えには使わないことを強くおすすめします。
:::

- `CLIENT`
    - 物理クライアント**でのみ**、config フォルダから読み込まれます
        - このコンフィグのタイプには、サーバー側の場所はありません
    - `FMLCommonSetupEvent` が発火される直前に読み込まれます
    - ネットワーク経由では同期**されません**
    - デフォルトでは `-client` の接尾辞が付きます
- `COMMON`
    - 物理クライアントと物理サーバーの両方で、config フォルダから読み込まれます
    - `FMLCommonSetupEvent` が発火される直前に読み込まれます
    - ネットワーク経由では同期**されません**
    - デフォルトでは `-common` の接尾辞が付きます
- `SERVER`
    - 物理クライアントと物理サーバーの両方で、config フォルダから読み込まれます
        - 次の場所にコンフィグを追加すると、ワールドごとに上書きできます
            - クライアント: `.minecraft/saves/<world_name>/serverconfig`
            - サーバー: `<server_folder>/world/serverconfig`
    - `ServerAboutToStartEvent` が発火される直前に読み込まれます
    - ネットワーク経由でクライアントに同期されます
    - デフォルトでは `-server` の接尾辞が付きます

## コンフィグの Event {#configuration-events}

コンフィグが読み込まれたとき、または再読み込みされたときの処理は、`ModConfigEvent.Loading` と `ModConfigEvent.Reloading` の Event で行えます。これらの Event は、Mod の EventBus に[登録][events]する必要があります。

:::caution
これらの Event は、その Mod のすべてのコンフィグについて呼ばれます。どのコンフィグが読み込み・再読み込みされているかは、渡される `ModConfig` オブジェクトで判断してください。
:::
## コンフィグ画面 {#configuration-screen}

コンフィグ画面を使うと、ユーザーはファイルを開かなくても、ゲーム内で Mod のコンフィグの値を編集できます。画面は、登録したコンフィグファイルを自動で解析し、内容を表示します。

Mod は、NeoForge が提供する組み込みのコンフィグ画面を使えます。`ConfigurationScreen` を継承して、デフォルトの画面の動作を変えたり、独自のコンフィグ画面を作ったりすることもできます。また、独自の画面を一から作り、後述の拡張ポイントを通じて NeoForge に渡すこともできます。

Mod のコンフィグ画面は、[クライアント][client]で Mod の構築中に `IConfigScreenFactory` の拡張ポイントを登録することで登録できます。
```java
// In the main client mod file
public ExampleModClient(ModContainer container) {
    ...
    // This will use NeoForge's ConfigurationScreen to display this mod's configs
    container.registerExtensionPoint(IConfigScreenFactory.class, ConfigurationScreen::new);
    ...
}
```

コンフィグ画面には、ゲーム内で「Mods」ページを開き、サイドバーから Mod を選んで「Config」ボタンをクリックするとアクセスできます。Startup、Common、Client のコンフィグの項目は、いつでも編集できます。Server のコンフィグは、ローカルのワールドで遊んでいるときにだけ、画面で編集できます。サーバーや他の人の LAN ワールドに接続している場合、Server のコンフィグの項目は画面上で無効になります。Mod のコンフィグ画面の最初のページには、登録されたすべてのコンフィグファイルが表示され、プレイヤーはどれを編集するかを選べます。

:::warning
画面を作る場合は、すべてのコンフィグの項目に翻訳キーを追加し、lang JSON でテキストを定義してください。

コンフィグの翻訳キーは `ModConfigSpec$Builder#translation` メソッドで指定できるので、先ほどのコードを次のように拡張できます。
```java
ConfigValue<T> value = builder.comment("This value is called 'config_value_name', and is set to defaultValue if no existing config is present")
    .translation("modid.config.config_value_name")
    .define("config_value_name", defaultValue);
```

翻訳を楽にするには、コンフィグ画面を開いて、すべてのコンフィグとそのサブセクションを見て回ってください。その後、Mod 一覧の画面に戻ります。その時点で、見て回った中で未翻訳のコンフィグの項目がすべてコンソールに出力されます。これで、何を翻訳すべきか、翻訳キーが何かがわかりやすくなります。
:::

[toml]: https://toml.io/
[nightconfig]: https://github.com/TheElectronWill/night-config
[configtype]: #configuration-types
[type]: https://github.com/neoforged/FancyModLoader/blob/1b6af92893464a4f477cab310256639f39d41ea7/loader/src/main/java/net/neoforged/fml/config/ModConfig.java#L81-L114
[events]: ../concepts/events.md#registering-an-event-handler
[client]: ../concepts/sides.md#mod
