# Access Transformer {#access-transformers}

Access Transformer( 略して AT )を使うと、クラス、メソッド、フィールドの可視性を広げたり、`final` フラグを変更したりできます。これにより Mod 開発者は、自分が管理していないクラスの、本来はアクセスできないメンバーにアクセスし、変更できます。

[仕様書][specs]は、NeoForged の GitHub で確認できます。

## AT の追加 {#adding-ats}

Mod のプロジェクトに Access Transformer を追加するのは、`build.gradle` に 1 行加えるだけの簡単な作業です。

Access Transformer は `build.gradle` で宣言する必要があります。AT ファイルは、コンパイル時に `resources` の出力ディレクトリにコピーされるのであれば、どこに置いてもかまいません。

```groovy
// In build.gradle:
// This block is where your mappings version is also specified
minecraft {
    accessTransformers {
        file('src/main/resources/META-INF/accesstransformer.cfg')
    }
}
```

デフォルトでは、NeoForge は `META-INF/accesstransformer.cfg` を探します。`build.gradle` で Access Transformer を別の場所に指定している場合は、その場所を `neoforge.mods.toml` で定義する必要があります。

```toml
# In neoforge.mods.toml:
[[accessTransformers]]
## The file is relative to the output directory of the resources, or the root path inside the jar when compiled
## The 'resources' directory represents the root output directory of the resources
file="META-INF/accesstransformer.cfg"
```

さらに、複数の AT ファイルを指定でき、順に適用されます。これは、複数のパッケージを持つ大きな Mod で便利です。

```groovy
// In build.gradle:
minecraft {
    accessTransformers {
        file('src/main/resources/accesstransformer_main.cfg')
        file('src/additions/resources/accesstransformer_additions.cfg')
    }
}
```

```toml
# In neoforge.mods.toml
[[accessTransformers]]
file="accesstransformer_main.cfg"

[[accessTransformers]]
file="accesstransformer_additions.cfg"
```

Access Transformer を追加・変更したら、変換を反映させるために Gradle プロジェクトを再読み込みする必要があります。

## Access Transformer の仕様 {#the-access-transformer-specification}

### コメント {#comments}

`#` から行末までのテキストは、すべてコメントとして扱われ、解析されません。

### アクセス修飾子 {#access-modifiers}

アクセス修飾子は、対象をどの可視性に変換するかを指定します。可視性の広い順に次のとおりです。

- `public` - パッケージの内外を問わず、すべてのクラスから見える
- `protected` - パッケージ内のクラスとサブクラスからのみ見える
- `default` - パッケージ内のクラスからのみ見える
- `private` - クラスの内部からのみ見える

前述の修飾子の後ろには、特別な修飾子 `+f` と `-f` を付けられます。これらはそれぞれ `final` 修飾子を追加・削除します。この修飾子が付くと、サブクラス化、メソッドのオーバーライド、フィールドの変更ができなくなります。

:::danger
ディレクティブが変更するのは、直接参照しているメソッドだけです。それをオーバーライドしているメソッドは、アクセスが変換されません。変換したメソッドに、可視性を制限する変換されていないオーバーライドがないことを確認してください。そうしたオーバーライドがあると、JVM がエラーをスローします。

安全に変換できるメソッドの例は、`final` メソッド( または `final` クラスのメソッド )と `static` メソッドです。`private` メソッドも一般に安全ですが、サブタイプで意図しないオーバーライドを引き起こす可能性があるため、追加で手動の確認を行ってください。
:::

### 対象とディレクティブ {#targets-and-directives}

#### クラス {#classes}

クラスを対象にするには、次のようにします。

```
<access modifier> <fully qualified class name>
```

内部クラスは、外側のクラスの完全修飾名と内部クラスの名前を、`$` を区切りとしてつなげて表します。

#### フィールド {#fields}

フィールドを対象にするには、次のようにします。

```
<access modifier> <fully qualified class name> <field name>
```

#### メソッド {#methods}

メソッドを対象にするには、メソッドの引数と戻り値の型を表す特別な構文が必要です。

```
<access modifier> <fully qualified class name> <method name>(<parameter types>)<return type>
```

##### 型の指定 {#specifying-types}

「ディスクリプタ」とも呼ばれます。技術的な詳細は、[Java 仮想マシン仕様 SE 21 の 4.3.2 節と 4.3.3 節][jvmdescriptors]を参照してください。

- `B` - `byte`、符号付きのバイト
- `C` - `char`、UTF-16 での Unicode 文字のコードポイント
- `D` - `double`、倍精度浮動小数点数
- `F` - `float`、単精度浮動小数点数
- `I` - `integer`、32 ビット整数
- `J` - `long`、64 ビット整数
- `S` - `short`、符号付きの short
- `Z` - `boolean`、`true` または `false` の値
- `[` - 配列の 1 次元を表す
    - 例: `[[S` は `short[][]` を表します
- `L<class name>;` - 参照型を表す
    - 例: `Ljava/lang/String;` は参照型 `java.lang.String` を表します _( ピリオドではなくスラッシュを使う点に注意してください )_
- `(` - メソッドディスクリプタを表す。引数があればここに指定し、なければ何も書かない
    - 例: `<method>(I)Z` は、整数の引数を取り、真偽値を返すメソッドを表します
- `V` - メソッドが値を返さないことを表す。メソッドディスクリプタの末尾でのみ使える
    - 例: `<method>()V` は、引数を取らず、何も返さないメソッドを表します

### 例 {#examples}

```
# Makes public the ByteArrayToKeyFunction interface in Crypt
public net.minecraft.util.Crypt$ByteArrayToKeyFunction

# Makes protected and removes the final modifier from 'random' in MinecraftServer
protected-f net.minecraft.server.MinecraftServer random

# Makes public the 'makeExecutor' method in Util,
# accepting a String and returns an ExecutorService
public net.minecraft.Util makeExecutor(Ljava/lang/String;)Ljava/util/concurrent/ExecutorService;

# Makes public the 'leastMostToIntArray' method in UUIDUtil,
# accepting two longs and returning an int[]
public net.minecraft.core.UUIDUtil leastMostToIntArray(JJ)[I
```

[specs]: https://github.com/NeoForged/AccessTransformers/blob/main/FMLAT.md
[jvmdescriptors]: https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-4.html#jvms-4.3.2
