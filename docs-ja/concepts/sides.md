---
sidebar_position: 2
---
# Side {#sides}

多くのプログラムと同じく、Minecraft はクライアント・サーバーの考え方に従っています。クライアントはデータの表示を、サーバーはデータの更新を担当します。こう言われると、意味はかなり直感的にわかる……ように思えます。

ところが、実はそうでもありません。混乱の多くは、Minecraft に文脈によって異なる 2 種類の Side の概念、つまり物理 Side と論理 Side があることから生じています。

## 論理 Side と物理 Side {#logical-vs-physical-side}

### 物理 Side {#the-physical-side}

Minecraft のランチャーを開き、Minecraft のインストールを選んでプレイを押すと、**物理クライアント**が起動します。ここでの「物理」という言葉は、「これはクライアントのプログラムである」という意味で使っています。つまり、描画まわりのすべてなど、クライアント側の機能がここでは利用でき、必要に応じて使えます。これに対して、**物理サーバー**(専用サーバーとも呼ばれます)は、Minecraft サーバーの JAR を起動したときに開くものです。Minecraft サーバーには簡易的な GUI が付いていますが、クライアント専用の機能はすべて欠けています。特に、さまざまなクライアント用クラスがサーバーの JAR には含まれていません。物理サーバーでこれらのクラスを呼び出すと、クラスが見つからないエラー、つまりクラッシュが起きるため、これを防ぐ必要があります。

### 論理 Side {#the-logical-side}

論理 Side は、主に Minecraft の内部的なプログラム構造に注目したものです。**論理サーバー**はゲームロジックが動く場所です。時間や天候の変化、エンティティの tick、エンティティのスポーンなどは、すべてサーバーで動きます。インベントリの内容などのあらゆるデータも、サーバーの担当です。一方、**論理クライアント**は、表示すべきものをすべて表示する役割を担います。Minecraft はクライアントのコードをすべて独立した `net.minecraft.client` パッケージにまとめ、レンダースレッドと呼ばれる別のスレッドで実行します。それ以外はすべて共通(つまりクライアントとサーバーの両方の)コードとみなされます。

### 何が違うのか {#whats-the-difference}

物理 Side と論理 Side の違いは、次の 2 つのシナリオでよくわかります。

- プレイヤーが**マルチプレイ**のワールドに参加する場合。これはとても単純です。プレイヤーの物理(かつ論理)クライアントが、どこか別の場所にある物理(かつ論理)サーバーに接続します。その場所がどこかをプレイヤーは気にしません。接続できさえすれば、クライアントが知っているのはそれだけで、知る必要があるのもそれだけです。
- プレイヤーが**シングルプレイ**のワールドに参加する場合。ここからが面白いところです。プレイヤーの物理クライアントは論理サーバーを立ち上げ、今度は論理クライアントの役割として、同じマシン上のその論理サーバーに接続します。ネットワークに詳しい方は、`localhost` への接続と考えてもかまいません(あくまで概念上の話で、実際にソケットなどが使われるわけではありません)。

この 2 つのシナリオは、ここでの主な問題も示しています。論理サーバーでコードが動作しても、それだけでは物理サーバーでも動作する保証にはなりません。そのため、予期しない動作がないか、常に専用サーバーでテストすべきです。クライアントとサーバーの分離が正しくないことによる `NoClassDefFoundError` や `ClassNotFoundException` は、Mod 開発で最もよくあるエラーの一つです。もう一つよくある間違いは、static フィールドを使い、両方の論理 Side からそれにアクセスすることです。通常は何かがおかしいという兆候がないため、これは特に厄介です。

:::tip
ある Side から別の Side へデータを転送する必要がある場合は、[パケットを送信][networking]しなければなりません。
:::

NeoForge のコードベースでは、物理 Side は `Dist` という enum で、論理 Side は `LogicalSide` という enum で表されます。

:::info
かつては、クライアントにはないクラスがサーバーの JAR に含まれていました。現在のバージョンではそうではなくなっています。言うなれば、物理サーバーは物理クライアントのサブセットです。
:::

## Side 固有の処理を行う {#performing-side-specific-operations}

### `Level#isClientSide()`

この真偽値のチェックは、Side を判定する方法として最もよく使うものになるでしょう。`Level` オブジェクトでこのフィールドを問い合わせると、そのレベルが属する**論理** Side がわかります。このフィールドが `true` なら、レベルは論理クライアントで動いています。`false` なら、論理サーバーで動いています。したがって、物理サーバーではこのフィールドは常に `false` です。ただし、`false` だからといって物理サーバーだとは限りません。物理クライアント内の論理サーバー(つまりシングルプレイのワールド)でも、このフィールドは `false` になりうるからです。

ゲームロジックやその他の仕組みを実行すべきかを判断する必要があるときは、常にこのチェックを使ってください。たとえば、プレイヤーがあなたのブロックをクリックするたびにダメージを与えたい場合や、機械で土をダイヤモンドに加工させたい場合は、`#isClientSide` が `false` であることを確認してから行うべきです。論理クライアントにゲームロジックを適用すると、よくても非同期(ゴーストエンティティ、ステータスの不一致など)が起き、最悪の場合はクラッシュします。

:::tip
このチェックを基本として使ってください。`Level` が利用できるときは、いつでもこのチェックを使いましょう。
:::

### `FMLEnvironment.dist`

`FMLEnvironment.dist` は、`Level#isClientSide()` のチェックに対応する**物理**版です。このフィールドが `Dist.CLIENT` なら物理クライアント、`Dist.DEDICATED_SERVER` なら物理サーバーです。


#### `@Mod`

クライアント専用のクラスを扱うときは、物理環境の確認が重要です。物理クライアントでのみ実行すべきコードを分ける推奨の方法は、別の [`@Mod` アノテーション][mod]を指定し、その `dist` パラメータに Mod クラスを読み込むべき物理 Side を設定することです。

```java
@Mod("examplemod")
public class ExampleMod {
    public ExampleMod(IEventBus modBus) {
        // Perform logic in that should be executed on both sides
    }
}

@Mod(value = "examplemod", dist = Dist.CLIENT) 
public class ExampleModClient {
    public ExampleModClient(IEventBus modBus) {
        // Perform logic in that should only be executed on the physical client
        Minecraft.getInstance().whatever();
    }
}

@Mod(value = "examplemod", dist = Dist.DEDICATED_SERVER) 
public class ExampleModDedicatedServer {
    public ExampleModDedicatedServer(IEventBus modBus) {
        // Perform logic in that should only be executed on the physical server
    }
}
```

:::tip
Mod は一般に、どちらの Side でも動作することが求められます。特に、クライアント専用の Mod を開発している場合は、その Mod が実際に物理クライアントで動いているかを確認し、そうでない場合は何もしないようにしてください。
:::

[networking]: ../networking/index.md
[mod]: ../gettingstarted/modfiles.md#javafml-and-mod
