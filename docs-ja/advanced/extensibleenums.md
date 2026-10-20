# 拡張可能な enum {#extensible-enums}

拡張可能な enum は、特定のバニラの enum に新しいエントリを追加できるようにする機能拡張です。これは、実行時に enum のコンパイル済みバイトコードを変更して要素を追加することで実現しています。

## `IExtensibleEnum`

新しいエントリを追加できる enum は、すべて `IExtensibleEnum` インターフェースを実装しています。このインターフェースは目印として機能し、`RuntimeEnumExtender` という起動プラグインのサービスが、どの enum を変換すべきかを判断できるようにします。

:::warning
自分の enum にこのインターフェースを実装しては**いけません**。用途に応じて、代わりにマップや Registry を使ってください。  
このインターフェースを実装するようパッチが当てられていない enum には、トランスフォーマーの実行順序の都合上、Mixin や coremod でインターフェースを追加することはできません。
:::

### enum のエントリの作成 {#creating-an-enum-entry}

新しい enum のエントリを作るには、JSON ファイルを作成し、`neoforge.mods.toml` の `[[mods]]` ブロックの `enumExtensions` で参照する必要があります。指定するパスは、`resources` ディレクトリからの相対パスにしてください。
```toml
# In neoforge.mods.toml:
[[mods]]
## The file is relative to the output directory of the resources, or the root path inside the jar when compiled
## The 'resources' directory represents the root output directory of the resources
enumExtensions="META-INF/enumextensions.json"
```

エントリの定義は、対象の enum のクラス名、新しいフィールドの名前( Mod ID の接頭辞が必要 )、エントリの構築に使うコンストラクタのディスクリプタ、そしてそのコンストラクタに渡す引数からなります。

```json5
{
    "entries": [
        {
            // The enum class the entry should be added to
            "enum": "net/minecraft/world/item/ItemDisplayContext",
            // The field name of the new entry, must be prefixed with the mod ID
            "name": "EXAMPLEMOD_STANDING",
            // The constructor to be used
            "constructor": "(ILjava/lang/String;Ljava/lang/String;)V",
            // Constant parameters provided directly.
            "parameters": [ -1, "examplemod:standing", null ]
        },
        {
            "enum": "net/minecraft/world/item/Rarity",
            "name": "EXAMPLEMOD_CUSTOM",
            "constructor": "(ILjava/lang/String;Ljava/util/function/UnaryOperator;)V",
            // The parameters to be used, provided as a reference to an EnumProxy<Rarity> field in the given class
            "parameters": {
                "class": "example/examplemod/MyEnumParams",
                "field": "CUSTOM_RARITY_ENUM_PROXY"
            }
        },
        {
            "enum": "net/minecraft/world/damagesource/DamageEffects",
            "name": "EXAMPLEMOD_TEST",
            "constructor": "(Ljava/lang/String;Ljava/util/function/Supplier;)V",
            // The parameters to be used, provided as a reference to a method in the given class
            "parameters": {
                "class": "example/examplemod/MyEnumParams",
                "method": "getTestDamageEffectsParameter"
            }
        }
    ]
}
```

```java
public class MyEnumParams {
    public static final EnumProxy<Rarity> CUSTOM_RARITY_ENUM_PROXY = new EnumProxy<>(
            Rarity.class, -1, "examplemod:custom", (UnaryOperator<Style>) style -> style.withItalic(true)
    );
    
    public static Object getTestDamageEffectsParameter(int idx, Class<?> type) {
        return type.cast(switch (idx) {
            case 0 -> "examplemod:test";
            case 1 -> (Supplier<SoundEvent>) () -> SoundEvents.DONKEY_ANGRY;
            default -> throw new IllegalArgumentException("Unexpected parameter index: " + idx);
        });
    }
}
```

#### コンストラクタ {#constructor}

コンストラクタは[メソッドディスクリプタ][jvmdescriptors]として指定する必要があり、ソースコード上で見える引数だけを含めてください。隠れた引数である定数名と序数は省きます。  
コンストラクタに `@ReservedConstructor` アノテーションが付いている場合、そのコンストラクタは Mod の enum 定数には使えません。

#### 引数 {#parameters}

引数は 3 通りの方法で指定でき、引数の型によって制限があります。

- JSON ファイル内に、定数の配列として直接書く( プリミティブ値、文字列、任意の参照型に null を渡す場合のみ使えます )
- Mod のクラスにある `EnumProxy<TheEnum>` 型のフィールドへの参照として指定する( 上の `EnumProxy` の例を参照 )
    - 1 つ目の引数で対象の enum を指定し、それ以降の引数が enum のコンストラクタに渡されます
- `Object` を返すメソッドへの参照として指定する。戻り値が、使う引数の値になります。このメソッドは、`int`( 引数のインデックス )と `Class<?>`( 期待される引数の型 )の 2 つの引数をちょうど持つ必要があります
    - `ClassCastException` が Mod のコード内で起きるよう、`Class<?>` オブジェクトを使って戻り値をキャスト( `Class#cast()` )してください。

:::warning
Mod のクラスを意図せず早く読み込んでしまわないよう、引数の値の取得元にするフィールドやメソッドは、別のクラスに置いてください。
:::

一部の引数には、追加のルールがあります。

- 引数が、enum の `@IndexedEnum` アノテーションに関係する int の ID の引数である場合、その値は無視され、エントリの序数に置き換えられます。その引数を JSON に直接書く場合は `-1` を指定する必要があり、そうしないと例外がスローされます。
- 引数が、enum の `@NamedEnum` アノテーションに関係する文字列の名前の引数である場合、`ResourceLocation` でおなじみの `namespace:path` 形式で Mod ID を接頭辞として付ける必要があり、そうしないと例外がスローされます。

#### 生成された定数の取得 {#retrieving-the-generated-constant}

生成された enum 定数は、`TheEnum.valueOf(String)` で取得できます。引数をフィールドの参照で指定した場合は、`EnumProxy#getValue()` で `EnumProxy` オブジェクトから定数を取得することもできます。

## NeoForge への貢献 {#contributing-to-neoforge}

NeoForge に新しい拡張可能な enum を追加するには、少なくとも次の 2 つが必要です。

- `RuntimeEnumExtender` で変換すべき enum であることを示すため、その enum に `IExtensibleEnum` を実装させる。
- `ExtensionInfo.nonExtended(TheEnum.class)` を返す `getExtensionInfo` メソッドを追加する。

enum の具体的な内容に応じて、さらに次の対応が必要です。

- enum に、エントリの序数と一致すべき int の ID の引数がある場合は、enum に `@NumberedEnum` アノテーションを付けてください。ID が最初の引数でなければ、アノテーションの値に ID の引数のインデックスを指定します
- enum に、シリアライズに使われるため名前空間を付けるべき文字列の名前の引数がある場合は、enum に `@NamedEnum` アノテーションを付けてください。名前が最初の引数でなければ、アノテーションの値に名前の引数のインデックスを指定します
- enum がネットワーク経由で送られる場合は、`@NetworkedEnum` アノテーションを付け、その引数で値を送る方向( クライアント向け、サーバー向け、双方向 )を指定してください
    - 警告: NeoForge に enum のネットワークチェックが実装されると、ネットワークで送られる enum には追加の手順が必要になります
- enum に Mod が使えないコンストラクタがある場合( たとえば、Mod の登録より前に初期化されうる enum で、Registry のオブジェクトを必要とするため )は、そのコンストラクタに `@ReservedConstructor` アノテーションを付けてください

:::note
enum に実際にエントリが追加された場合、`getExtensionInfo` メソッドは実行時に変換され、動的に生成された `ExtensionInfo` を返すようになります。
:::

```java
// This is an example, not an actual enum within Vanilla
public enum ExampleEnum implements net.neoforged.fml.common.asm.enumextension.IExtensibleEnum {
    // VALUE_1 represents the name parameter here
    VALUE_1(0, "value_1", false),
    VALUE_2(1, "value_2", true),
    VALUE_3(2, "value_3");

    ExampleEnum(int arg1, String arg2, boolean arg3) {
        // ...
    }

    ExampleEnum(int arg1, String arg2) {
        this(arg1, arg2, false);
    }

    public static net.neoforged.fml.common.asm.enumextension.ExtensionInfo getExtensionInfo() {
        return net.neoforged.fml.common.asm.enumextension.ExtensionInfo.nonExtended(ExampleEnum.class);
    }
}
```

[jvmdescriptors]: https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-4.html#jvms-4.3.2
