# Mod ファイル {#mod-files}

Mod ファイルは、JAR にどの Mod を含めるか、「Mods」メニューにどんな情報を表示するか、ゲーム内で Mod をどのように読み込むかを決めるものです。

## `gradle.properties`

`gradle.properties` ファイルには、Mod ID や Mod のバージョンなど、Mod に共通するさまざまなプロパティを記述します。ビルド時に Gradle がこのファイルの値を読み込み、[neoforge.mods.toml][neoforgemodstoml] ファイルなどのさまざまな場所に埋め込みます。こうすることで、値を 1 か所で変更するだけで、すべての場所に反映されます。

ほとんどの値は、[MDK の `gradle.properties` ファイル][mdkgradleproperties]内のコメントでも説明されています。

| プロパティ                  | 説明                                                                                                                                                                                                                             | 例                                    |
|---------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------|
| `org.gradle.jvmargs`      | Gradle に追加の JVM 引数を渡せます。最もよく使われるのは、Gradle に割り当てるメモリを増減する用途です。これは Gradle 自体の設定であり、Minecraft のものではない点に注意してください。                                                                 | `org.gradle.jvmargs=-Xmx3G`                |
| `org.gradle.daemon`       | ビルド時に Gradle がデーモンを使うかどうか。                                                                                                                                                                                     | `org.gradle.daemon=false`                  |
| `org.gradle.debug`        | Gradle をデバッグモードにするかどうか。デバッグモードでは主に Gradle のログ出力が増えます。これは Gradle 自体の設定であり、Minecraft のものではない点に注意してください。                                                                                                | `org.gradle.debug=false`                   |
| `minecraft_version`       | Mod 開発の対象とする Minecraft のバージョン。`neo_version` と一致させる必要があります。                                                                                                                                                                | `minecraft_version=1.20.6`                 |
| `minecraft_version_range` | この Mod が使える Minecraft のバージョン範囲。[Maven のバージョン範囲][mvr]の形式で指定します。[スナップショット、プレリリース、リリース候補][mcversioning]は Maven のバージョン規則に従っていないため、正しく並べ替えられる保証はない点に注意してください。    | `minecraft_version_range=[1.20.6,1.21)`    |
| `neo_version`             | Mod 開発の対象とする NeoForge のバージョン。`minecraft_version` と一致させる必要があります。NeoForge のバージョン規則について詳しくは、[NeoForge のバージョン][neoversioning]を参照してください。                                                           | `neo_version=20.6.62`                      |
| `neo_version_range`       | この Mod が使える NeoForge のバージョン範囲。[Maven のバージョン範囲][mvr]の形式で指定します。                                                                                                                                                           | `neo_version_range=[20.6.62,20.7)`         |
| `loader_version_range`    | この Mod が使える Mod ローダーのバージョン範囲。[Maven のバージョン範囲][mvr]の形式で指定します。ローダーのバージョンは NeoForge のバージョンとは独立している点に注意してください。                                                                           | `loader_version_range=[1,)`                |
| `mod_id`                  | [Mod ID][modid] を参照してください。                                                                                                                                                                                                                | `mod_id=examplemod`                        |
| `mod_name`                | 人が読める形式の Mod の表示名。デフォルトでは Mod 一覧でのみ表示されますが、[JEI][jei] などの Mod では、アイテムのツールチップにも Mod 名が目立つように表示されます。                                                | `mod_name=Example Mod`                     |
| `mod_license`             | Mod を提供するライセンス。使用するライセンスの [SPDX 識別子][spdx]、ライセンスへのリンク、またはその両方を設定することをおすすめします。使用するライセンスを選ぶには、https://choosealicense.com/ が参考になります。 | `mod_license=MIT`                          |
| `mod_version`             | Mod のバージョン。Mod 一覧に表示されます。詳しくは[バージョンのページ][versioning]を参照してください。                                                                                                                          | `mod_version=1.0`                          |
| `mod_group_id`            | [Group ID][group] を参照してください。                                                                                                                                                                                                              | `mod_group_id=com.example.examplemod`      |
| `mod_authors`             | Mod の作者。Mod 一覧に表示されます。                                                                                                                                                                                          | `mod_authors=ExampleModder`                |
| `mod_description`         | Mod の説明。複数行の文字列で、Mod 一覧に表示されます。改行文字( `\n` )を使うことができ、正しく置き換えられます。                                                                                          | `mod_description=Example mod description.` |

### Mod ID {#the-mod-id}

Mod ID は、Mod を他の Mod と区別するための主な手段です。Mod の [Registry][registration] の名前空間や、[リソースパックとデータパック][resource]の名前空間など、さまざまな場所で使われます。同じ ID の Mod が 2 つあると、ゲームを読み込めなくなります。

そのため、Mod ID は一意で覚えやすいものにしてください。通常は Mod の表示名( を小文字にしたもの )か、その変形を使います。Mod ID に使えるのは小文字の英字、数字、アンダースコアのみで、長さは 2 文字以上 64 文字以下である必要があります。

:::info
`gradle.properties` ファイルでこのプロパティを変更すると、メイン Mod クラスの [`@Mod` アノテーション][javafml]を除くすべての場所に自動で反映されます。アノテーションの値は、`gradle.properties` ファイルの値と一致するよう手動で変更する必要があります。
:::

### Group ID {#the-group-id}

`build.gradle` の `group` プロパティは、Mod を Maven に公開する場合にのみ必要ですが、常に適切に設定しておくのがよい習慣とされています。これは `gradle.properties` の `mod_group_id` プロパティによって設定されます。

Group ID には、トップレベルパッケージを設定してください。詳しくは[パッケージ構成][packaging]を参照してください。

```properties
# In your gradle.properties file
mod_group_id=com.example
```

Java ソース( `src/main/java` )内のパッケージも、この構成に合わせます。内側のパッケージは Mod ID を表します。

```text
com
- example (top-level package specified in group property)
    - mymod (the mod id)
        - MyMod.java (renamed ExampleMod.java)
```

## `neoforge.mods.toml`

`neoforge.mods.toml` ファイルは `src/main/resources/META-INF/neoforge.mods.toml` にある [TOML][toml] 形式のファイルで、Mod のメタデータを定義します。また、Mod をゲームにどのように読み込むかについての追加情報や、「Mods」メニューに表示される情報も含みます。[MDK に含まれる `neoforge.mods.toml` ファイル][mdkneoforgemodstoml]には各項目を説明するコメントがありますが、ここではさらに詳しく説明します。

`neoforge.mods.toml` は 3 つの部分に分けられます。Mod ファイルに紐づく Mod 固有でないプロパティ、Mod ごとにセクションを持つ Mod のプロパティ、そして Mod ごとの依存関係のセクションを持つ依存関係の設定です。`neoforge.mods.toml` ファイルのプロパティには必須のものがあります。必須プロパティには値を指定する必要があり、指定しないと例外がスローされます。

:::note
デフォルトの MDK では、Gradle がこのファイル内のさまざまなプロパティを `gradle.properties` ファイルで指定された値に置き換えます。たとえば `license="${mod_license}"` という行は、`license` フィールドが `gradle.properties` の `mod_license` プロパティで置き換えられることを意味します。このように置き換えられる値は、ここではなく `gradle.properties` で変更してください。
:::

### Mod 固有でないプロパティ {#non-mod-specific-properties}

Mod 固有でないプロパティは JAR 自体に関連するプロパティで、Mod の読み込み方法や、その他のグローバルなメタデータを示します。

| プロパティ             | 型     | デフォルト        | 説明                                                                                                                                                                                                                                                                                                                                         | 例                                                                        |
|----------------------|----------|----------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------|
| `modLoader`          | string   | **必須**  | Mod が使う言語ローダー。メインファイルに Kotlin のオブジェクトを使うといった別の言語構造や、インターフェースやメソッドなどエントリポイントを決める別の方法をサポートするために使えます。NeoForge は Java 用のローダー [`"javafml"`][javafml] と、ローコード/ノーコード用のローダー [`"lowcodefml"`][lowcodefml] を提供しています。  | `modLoader="javafml"`                                                          |
| `loaderVersion`      | string   | **必須**  | 言語ローダーの許容バージョン範囲。[Maven のバージョン範囲][mvr]の形式で指定します。`javafml` と `lowcodefml` の場合、現在のバージョンは `1` です。                                                                                                                                                                                      | `loaderVersion="[1,)"`                                                         |
| `license`            | string   | **必須**  | この JAR に含まれる Mod を提供するライセンス。使用するライセンスの [SPDX 識別子][spdx]、ライセンスへのリンク、またはその両方を設定することをおすすめします。使用するライセンスを選ぶには、https://choosealicense.com/ が参考になります。                                                                                              | `license="MIT"`                                                                |
| `showAsResourcePack` | boolean  | `false`        | `true` の場合、Mod のリソースは「Mod Resources」パックにまとめられず、「Resource Packs」メニューに別のリソースパックとして表示されます。                                                                                                                                                                           | `showAsResourcePack=true`                                                      |
| `showAsDataPack`     | boolean  | `false`        | `true` の場合、Mod のデータファイルは「Mod Data」パックにまとめられず、「Data Packs」メニューに別のデータパックとして表示されます。                                                                                                                                                                           | `showAsDataPack=true`                                                          |
| `services`           | array    | `[]`           | Mod が使うサービスの配列。NeoForge による Java Platform Module System の実装において、Mod 用に作成されるモジュールの一部として使われます。                                                                                                                                                                                   | `services=["net.neoforged.neoforgespi.language.IModLanguageProvider"]`         |
| `properties`         | table    | `{}`           | 置換プロパティのテーブル。`StringSubstitutor` が `${file.<key>}` を対応する値に置き換えるために使います。                                                                                                                                                                                                                    | `properties={"example"="1.2.3"}`( `${file.example}` で参照できます ) |
| `issueTrackerURL`    | string   | _なし_      | Mod の問題を報告・追跡する場所を示す URL。                                                                                                                                                                                                                                                                            | `"https://github.com/neoforged/NeoForge/issues"`                               |

:::note
`services` プロパティは、[モジュールで `uses` ディレクティブ][uses]を指定するのと機能的に同等で、[特定の型のサービスを読み込む][serviceload]ことができます。

または、`src/main/resources/META-INF/services` フォルダ内のサービスファイルで定義することもできます。ファイル名はサービスの完全修飾名、ファイルの内容は読み込むサービスの名前にします( [AtlasViewer Mod のこの例][atlasviewer]も参照してください )。
:::

### Mod 固有のプロパティ {#mod-specific-properties}

Mod 固有のプロパティは、`[[mods]]` ヘッダーによって指定した Mod に紐づけられます。これは[テーブルの配列][array]で、次のヘッダーまでのすべてのキー/値プロパティがその Mod に紐づけられます。

```toml
# Properties for examplemod1
[[mods]]
modId = "examplemod1"

# Properties for examplemod2
[[mods]]
modId = "examplemod2"
```

| プロパティ         | 型     | デフォルト                      | 説明                                                                                                                                                                                                                                                                    | 例                                                         |
|------------------|----------|------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------|
| `modId`          | string   | **必須**                | [Mod ID][modid] を参照してください。                                                                                                                                                                                                                                                       | `modId="examplemod"`                                            |
| `namespace`      | string   | `modId` の値             | Mod の名前空間を上書きします。有効な [Mod ID][modid] である必要がありますが、ドットやハイフンも使えます。現在は使われていません。                                                                                                                                        | `namespace="example"`                                           |
| `version`        | string   | `"1"`                        | Mod のバージョン。[Maven のバージョン規則の変形][versioning]を使うことが望まれます。`${file.jarVersion}` を設定すると、JAR のマニフェストにある `Implementation-Version` プロパティの値に置き換えられます( 開発環境では `0.0NONE` と表示されます )。 | `version="1.20.2-1.0.0"`                                        |
| `displayName`    | string   | `modId` の値             | Mod の表示名。画面上で Mod を表すとき( Mod 一覧、Mod の不一致など )に使われます。                                                                                                                                                                        | `displayName="Example Mod"`                                     |
| `description`    | string   | `'''MISSING DESCRIPTION'''`  | Mod 一覧画面に表示される Mod の説明。[複数行リテラル文字列][multiline]の使用をおすすめします。この値は翻訳することもできます。詳しくは [Mod メタデータの翻訳][i18n]を参照してください。                                                                | `description='''This is an example.'''`                         |
| `logoFile`       | string   | _なし_                    | Mod 一覧画面で使われる画像ファイルの名前と拡張子。ロゴは JAR のルート、またはソースセットのルート直下( メインのソースセットなら `src/main/resources` )に置く必要があります。                                                                   | `logoFile="example_logo.png"`                                   |
| `logoBlur`       | boolean  | `true`                       | `logoFile` の描画に `GL_LINEAR*`( true )と `GL_NEAREST*`( false )のどちらを使うか。簡単に言えば、ロゴを拡大縮小するときにぼかすかどうかです。                                                                                    | `logoBlur=false`                                                |
| `updateJSONURL`  | string   | _なし_                    | [アップデートチェッカー][update]が、プレイ中の Mod が最新バージョンかを確認するために使う JSON の URL。                                                                                                                                                               | `updateJSONURL="https://example.github.io/update_checker.json"` |
| `modUrl`         | string   | _なし_                    | Mod のダウンロードページの URL。現在は使われていません。                                                                                                                                                                                                                       | `modUrl="https://neoforged.net/"`                               |
| `credits`        | string   | _なし_                    | Mod 一覧画面に表示される、Mod のクレジットと謝辞。                                                                                                                                                                                                             | `credits="The person over here and there."`                     |
| `authors`        | string   | _なし_                    | Mod 一覧画面に表示される Mod の作者。                                                                                                                                                                                                                           | `authors="Example Person"`                                      |
| `displayURL`     | string   | _なし_                    | Mod 一覧画面に表示される、Mod の紹介ページの URL。                                                                                                                                                                                                             | `displayURL="https://neoforged.net/"`                           |
| `enumExtensions` | string   | _なし_                    | [enum の拡張][enumextension]に使う JSON ファイルのパス。                                                                                                                                                                                                          | `enumExtensions="META_INF/enumextensions.json"`                 |

#### フィーチャー {#features}

フィーチャーシステムを使うと、Mod は読み込み時に特定の設定、ソフトウェア、ハードウェアが利用可能であることを要求できます。フィーチャーが満たされない場合、Mod の読み込みは失敗し、ユーザーに要件が通知されます。この設定は[テーブル][table] `[features.<modid>]` で作成します。`modid` は、そのフィーチャーを利用する Mod の識別子です。現在、NeoForge は次のフィーチャーを提供しています。

| フィーチャー          | 説明                                                                                                                                                                                                | 例                             |
|------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------|
| `javaVersion`   | Java の許容バージョン範囲。[Maven のバージョン範囲][mvr]の形式で指定します。Minecraft が使用する、サポート対象のバージョンにしてください。                                                       | `javaVersion="[17,)"`  |
| `openGLVersion` | OpenGL の許容バージョン範囲。[Maven のバージョン範囲][mvr]の形式で指定します。Minecraft には OpenGL 3.2 以降が必要です。より新しい OpenGL バージョンを要求したい場合は、ここで指定できます。  | `openGLVersion="[4.6,)"` |

#### Mod のプロパティ {#mod-properties}

Mod のプロパティシステムは、特定の Mod に関連付けられた任意のキーと値のマップです。Mod ファイルが同じキーで異なるメタデータを定義する場合に便利です。あるキーに対応するプロパティの値は、`IModInfo#getModProperties` でマップからオブジェクトの値を取得して得られます。この設定は[テーブル][table] `[modproperties.<modid>]` で作成します。`modid` は、定義したプロパティを利用する Mod の識別子です。

```java
// Assume we have two mods `mod1` and `mod2` with the following property configuration in separate files
// [modproperties.mod1]
// key="value1"
// [modproperties.mod2]
// key="value2"

@Mod("mod1")
public class ModOne {

    private final String key;

    public ModOne(ModContainer container) {
        // Will store 'value1' in key
        this.key = (String) container.getModInfo().getModProperties().get("key");
    }
}

@Mod("mod2")
public class ModTwo {

    private final String key;

    public ModTwo(ModContainer container) {
        // Will store 'value2' in key
        this.key = (String) container.getModInfo().getModProperties().get("key");
    }
}
```

### Access Transformer 固有のプロパティ {#access-transformer-specific-properties}

[Access Transformer 固有のプロパティ][accesstransformer]は、`[[accessTransformers]]` ヘッダーによって指定した Access Transformer に紐づけられます。これは[テーブルの配列][array]で、次のヘッダーまでのすべてのキー/値プロパティがその Access Transformer に紐づけられます。Access Transformer のヘッダーは省略できますが、指定する場合はすべての要素が必須です。

| プロパティ |  型  |    デフォルト    |             説明              |     例     |
|:--------:|:------:|:-------------:|:------------------------------------:|:----------------|
| `file`   | string | **必須** | [AT の追加][accesstransformer]を参照してください。 | `file="at.cfg"` |

### Mixin 設定のプロパティ {#mixin-configuration-properties}

[Mixin 設定のプロパティ][mixinconfig]は、`[[mixins]]` ヘッダーによって指定した Mixin 設定に紐づけられます。これは[テーブルの配列][array]で、次のヘッダーまでのすべてのキー/値プロパティがその Mixin ブロックに紐づけられます。Mixin のヘッダーは省略できますが、指定する場合はすべての要素が必須です。

| プロパティ |  型  |    デフォルト    |             説明                       |     例                       |
|:--------:|:------:|:-------------:|:---------------------------------------------:|:----------------------------------|
| `config` | string | **必須** | Mixin 設定ファイルの場所。 | `config="examplemod.mixins.json"` |

### 依存関係の設定 {#dependency-configurations}

Mod は依存関係を指定でき、NeoForge は Mod を読み込む前にそれをチェックします。この設定は[テーブルの配列][array] `[[dependencies.<modid>]]` で作成します。`modid` は、その依存関係を利用する Mod の識別子です。

| プロパティ       | 型    | デフォルト        | 説明                                                                                                                                                                                                                                                                                                                                                                                                                                                                | 例                                      |
|----------------|---------|----------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------|
| `modId`        | string  | **必須**  | 依存関係として追加する Mod の識別子。                                                                                                                                                                                                                                                                                                                                                                                                                           | `modId="jei"`                                |
| `type`         | string  | `"required"`   | 依存関係の性質を指定します。`"required"` はデフォルトで、依存先がない場合は Mod を読み込みません。`"optional"` は依存先がなくても Mod の読み込みを妨げませんが、依存先の互換性は検証します。`"incompatible"` は依存先が存在する場合に Mod を読み込みません。`"discouraged"` は依存先が存在しても Mod の読み込みを許可しますが、ユーザーに警告を表示します。 | `type="incompatible"`                        |
| `reason`       | string  | _なし_      | この依存関係が必要な理由、または互換性がない理由を説明する、ユーザー向けの任意のメッセージ。                                                                                                                                                                                                                                                                                                                                                                    | `reason="integration"`                       |
| `versionRange` | string  | `""`           | 言語ローダーの許容バージョン範囲。[Maven のバージョン範囲][mvr]の形式で指定します。空文字列はすべてのバージョンに一致します。( 訳注: 原文は「言語ローダー」ですが、文脈上は依存先 Mod のバージョン範囲を指すと思われます )                                                                                                                                                                                                                                                                                                                                       | `versionRange="[1, 2)"`                      |
| `ordering`     | string  | `"NONE"`       | Mod をこの依存先より前( `"BEFORE"` )に読み込むか、後( `"AFTER"` )に読み込むかを定義します。順序が問題にならない場合は `"NONE"` を返します。                                                                                                                                                                                                                                                                                                                                    | `ordering="AFTER"`                           |
| `side`         | string  | `"BOTH"`       | 依存先が存在している必要がある[物理 Side][sides]。`"CLIENT"`、`"SERVER"`、`"BOTH"` のいずれかです。                                                                                                                                                                                                                                                                                                                                                                         | `side="CLIENT"`                              |
| `referralUrl`  | string  | _なし_      | 依存先のダウンロードページの URL。現在は使われていません。                                                                                                                                                                                                                                                                                                                                                                                                            | `referralUrl="https://library.example.com/"` |

:::danger
2 つの Mod の `ordering` が循環依存を起こし、クラッシュすることがあります。たとえば、Mod A は Mod B より `"BEFORE"` に読み込む必要があり、同時に Mod B も Mod A より `"BEFORE"` に読み込む必要がある場合です。
:::

## Mod のエントリポイント {#mod-entrypoints}

`neoforge.mods.toml` を記入したら、次は Mod のエントリポイントを用意する必要があります。エントリポイントは、Mod の実行の起点となるものです。エントリポイント自体は、`neoforge.mods.toml` で使用する言語ローダーによって決まります。

### `javafml` と `@Mod` {#javafml-and-mod}

`javafml` は、NeoForge が提供する Java プログラミング言語用の言語ローダーです。エントリポイントは、`@Mod` アノテーションを付けた public クラスで定義します。`@Mod` の値には、`neoforge.mods.toml` で指定した Mod ID のいずれかを含める必要があります。そのうえで、すべての初期化ロジック( 例: [Event の登録][events]や [`DeferredRegister` の追加][registration] )をクラスのコンストラクタ内に記述できます。

メイン Mod クラスの public コンストラクタは 1 つだけにする必要があります。そうでない場合は `RuntimeException` がスローされます。コンストラクタは、以下の引数を**任意の**順序で**いくつでも**受け取れます。どれも必須ではありません。ただし、同じ引数を重複させることはできません。

引数の型     | 説明                                                                                              |
------------------|----------------------------------------------------------------------------------------------------------|
`IEventBus`       | [Mod 固有の EventBus][modbus]（ 登録や Event などに必要 ）                             |
`ModContainer`    | この Mod のメタデータを保持する抽象コンテナ                                                       |
`FMLModContainer` | `javafml` が定義する、この Mod のメタデータを保持する実際のコンテナ。`ModContainer` を拡張したもの |
`Dist`            | この Mod が読み込まれている[物理 Side][sides]                                                        |

```java
@Mod("examplemod") // Must match a mod id in the neoforge.mods.toml
public class ExampleMod {
    // Valid constructor, only uses two of the available argument types
    public ExampleMod(IEventBus modBus, ModContainer container) {
        // Initialize logic here
    }
}
```

デフォルトでは、`@Mod` アノテーションは両方の [Side][sides] で読み込まれます。これは `dist` パラメータを指定して変更できます。

```java
// Must match a mod id in the neoforge.mods.toml
// This mod class will only be loaded on the physical client
@Mod(value = "examplemod", dist = Dist.CLIENT) 
public class ExampleModClient {
    // Valid constructor
    public ExampleModClient(FMLModContainer container, IEventBus modBus, Dist dist) {
        // Initialize client-only logic here
    }
}
```

:::note
`neoforge.mods.toml` のエントリに、対応する `@Mod` アノテーションがなくてもかまいません。同様に、`neoforge.mods.toml` の 1 つのエントリに複数の `@Mod` アノテーションを対応させることもできます。たとえば、共通ロジックとクライアント専用ロジックを分けたい場合です。
:::

### `lowcodefml`

`lowcodefml` は、コード内のエントリポイントなしで、Datapack やリソースパックを Mod として配布するための言語ローダーです。`nocodefml` ではなく `lowcodefml` という名前になっているのは、将来、最小限のコードが必要になる小さな機能が追加される可能性があるためです。

[accesstransformer]: ../advanced/accesstransformers.md#adding-ats
[array]: https://toml.io/en/v1.0.0#array-of-tables
[atlasviewer]: https://github.com/XFactHD/AtlasViewer/blob/1.20.2/neoforge/src/main/resources/META-INF/services/xfacthd.atlasviewer.platform.services.IPlatformHelper
[events]: ../concepts/events.md
[features]: #features
[group]: #the-group-id
[i18n]: ../resources/client/i18n.md#translating-mod-metadata
[javafml]: #javafml-and-mod
[jei]: https://www.curseforge.com/minecraft/mc-mods/jei
[lowcodefml]: #lowcodefml
[mcversioning]: versioning.md#minecraft
[mdkgradleproperties]: https://github.com/NeoForgeMDKs/MDK-1.21-NeoGradle/blob/main/gradle.properties
[mdkneoforgemodstoml]: https://github.com/NeoForgeMDKs/MDK-1.21-NeoGradle/blob/main/src/main/resources/META-INF/neoforge.mods.toml
[neoforgemodstoml]: #neoforgemodstoml
[mixinconfig]: https://github.com/SpongePowered/Mixin/wiki/Introduction-to-Mixins---The-Mixin-Environment#mixin-configuration-files
[modbus]: ../concepts/events.md#event-buses
[modid]: #the-mod-id
[mojmaps]: https://github.com/neoforged/NeoForm/blob/main/Mojang.md
[multiline]: https://toml.io/en/v1.0.0#string
[mvr]: https://maven.apache.org/enforcer/enforcer-rules/versionRanges.html
[neoversioning]: versioning.md#neoforge
[packaging]: ./structuring.md#packaging
[registration]: ../concepts/registries.md#deferredregister
[resource]: ../resources/index.md
[serviceload]: https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/ServiceLoader.html#load(java.lang.Class)
[sides]: ../concepts/sides.md
[spdx]: https://spdx.org/licenses/
[table]: https://toml.io/en/v1.0.0#table
[toml]: https://toml.io/
[update]: ../misc/updatechecker.md
[uses]: https://docs.oracle.com/javase/specs/jls/se21/html/jls-7.html#jls-7.7.3
[versioning]: ./versioning.md
[enumextension]: ../advanced/extensibleenums.md
