# ゲームテスト {#game-tests}

ゲームテストは、ゲーム内でユニットテストを実行する方法です。このシステムは、大量のさまざまなテストを効率よく実行できるよう、スケーラブルかつ並列に動くように設計されています。オブジェクトのやりとりや動作のテストは、このフレームワークの多くの用途のほんの一例です。

## ゲームテストの作成 {#creating-a-game-test}

標準的なゲームテストは、3 つの基本的な手順に従います。

1. やりとりや動作をテストする場面を含む構造物( テンプレート )を読み込みます。
1. メソッドが、その場面で行うロジックを実行します。
1. メソッドのロジックが実行されます。成功の状態に達すればテストは成功です。そうでなければテストは失敗し、結果が場面の隣にある書見台に保存されます。

そのため、ゲームテストを作るには、場面の最初の状態を含むテンプレートと、実行するロジックを提供するメソッドが必要です。

### テストメソッド {#the-test-method}

ゲームテストのメソッドは `Consumer<GameTestHelper>` の参照です。つまり、`GameTestHelper` を受け取り、何も返しません。ゲームテストのメソッドとして認識されるには、`@GameTest` アノテーションが必要です。

```java
public class ExampleGameTests {
    @GameTest
    public static void exampleTest(GameTestHelper helper) {
        // Do stuff
    }
}
```

`@GameTest` アノテーションには、ゲームテストの実行方法を設定するメンバーもあります。

```java
// In some class
@GameTest(
    setupTicks = 20L, // The test spends 20 ticks to set up for execution
    required = false // The failure is logged but does not affect the execution of the batch
)
public static void exampleConfiguredTest(GameTestHelper helper) {
    // Do stuff
}
```

#### 相対位置 {#relative-positioning}

`GameTestHelper` のメソッドはすべて、ストラクチャーブロックの現在の位置を使って、構造物テンプレートの場面内の相対座標を絶対座標に変換します。相対位置と絶対位置を簡単に変換できるよう、それぞれ `GameTestHelper#absolutePos` と `GameTestHelper#relativePos` を使えます。

構造物テンプレートでの相対位置は、ゲーム内で取得できます。[test コマンド][test]で構造物を読み込み、プレイヤーを目的の場所に置いて、最後に `/test pos` コマンドを実行します。これにより、プレイヤーから 200 ブロック以内で最も近い構造物を基準にした、プレイヤーの座標が得られます。コマンドは、final のローカル変数として使えるよう、相対位置をコピー可能なテキストコンポーネントとしてチャットに出力します。

:::tip
`/test pos` が生成するローカル変数は、コマンドの末尾に名前を付け加えることで、その参照名を指定できます。

```bash
/test pos <var> # Exports 'final BlockPos <var> = new BlockPos(...);'
```
:::

#### 成功での完了 {#successful-completion}

ゲームテストのメソッドが担う役割は 1 つだけです。正しく完了したときに、テストが成功したことを記録することです。( `GameTest#timeoutTicks` で定義される )タイムアウトまでに成功の状態に達しなければ、テストは自動的に失敗します。

`GameTestHelper` には、成功の状態を定義するのに使える抽象化されたメソッドが多数ありますが、特に重要な 4 つを知っておいてください。

メソッド               | 説明
:---:                | :---
`#succeed`           | テストを成功として記録します。
`#succeedIf`         | 渡した `Runnable` をすぐにテストし、`GameTestAssertException` がスローされなければ成功します。その tick で成功しなければ、失敗として記録されます。
`#succeedWhen`       | 渡した `Runnable` をタイムアウトまで毎 tick テストし、いずれかの tick でのチェックが `GameTestAssertException` をスローしなければ成功します。
`#succeedOnTickWhen` | 渡した `Runnable` を指定した tick でテストし、`GameTestAssertException` がスローされなければ成功します。`Runnable` がそれ以外の tick で成功した場合は、失敗として記録されます。

:::caution
ゲームテストは、テストが成功として記録されるまで毎 tick 実行されます。そのため、特定の tick に成功を予定するメソッドでは、それより前の tick では必ず失敗するよう注意する必要があります。
:::

#### 処理の予約 {#scheduling-actions}

すべての処理がテストの開始時に起きるわけではありません。処理は、特定のタイミングや間隔で起きるように予約できます。

メソッド           | 説明
:---:            | :---
`#runAtTickTime` | 指定した tick で処理を実行します。
`#runAfterDelay` | 現在の tick から `x` tick 後に処理を実行します。
`#onEachTick`    | 毎 tick 処理を実行します。

#### アサーション {#assertions}

ゲームテストの間はいつでも、アサーションを行って、ある条件が真かどうかを確認できます。`GameTestHelper` にはアサーションのメソッドが多数ありますが、要するに、適切な状態でないときに `GameTestAssertException` をスローするものです。

### 生成されるテストメソッド {#generated-test-methods}

ゲームテストのメソッドを動的に生成する必要がある場合は、テストメソッドのジェネレーターを作れます。これらのメソッドは引数を取らず、`TestFunction` のコレクションを返します。テストメソッドのジェネレーターとして認識されるには、`@GameTestGenerator` アノテーションが必要です。

```java
public class ExampleGameTests {
    @GameTestGenerator
    public static Collection<TestFunction> exampleTests() {
        // Return a collection of TestFunctions
    }
}
```

#### TestFunction

`TestFunction` は、`@GameTest` アノテーションが持つ情報と、テストを実行するメソッドをまとめたものです。

:::tip
`@GameTest` アノテーションを付けたメソッドは、すべて `GameTestRegistry#turnMethodIntoTestFunction` によって `TestFunction` に変換されます。アノテーションを使わずに `TestFunction` を作る場合は、このメソッドを参考にできます。
:::

### バッチ {#batching}

ゲームテストは、登録順ではなくバッチ単位で実行できます。同じ `GameTest#batch` の文字列を指定すると、テストを同じバッチに入れられます。

バッチ自体には、特に便利な機能はありません。しかし、バッチを使うと、テストを実行しているレベルで準備と後片付けを行えます。これは、準備用のメソッドに `@BeforeBatch`、後片付け用のメソッドに `@AfterBatch` のアノテーションを付けて行います。`#batch` の値は、ゲームテストに指定した文字列と一致させる必要があります。

バッチのメソッドは `Consumer<ServerLevel>` の参照です。つまり、`ServerLevel` を受け取り、何も返しません。

```java
public class ExampleGameTests {
    @BeforeBatch(batch = "firstBatch")
    public static void beforeTest(ServerLevel level) {
        // Perform setup
    }

    @GameTest(batch = "firstBatch")
    public static void exampleTest2(GameTestHelper helper) {
        // Do stuff
    }
}
```

## ゲームテストの登録 {#registering-a-game-test}

ゲームテストをゲーム内で実行するには、登録する必要があります。方法は 2 つあり、`@GameTestHolder` アノテーションを使う方法と、`RegisterGameTestsEvent` を使う方法です。どちらの方法でも、テストメソッドには `@GameTest`、`@GameTestGenerator`、`@BeforeBatch`、`@AfterBatch` のいずれかのアノテーションが必要です。

### GameTestHolder

`@GameTestHolder` アノテーションは、その型( クラス、インターフェース、enum、record )の中にあるテストメソッドをすべて登録します。`@GameTestHolder` には、複数の用途を持つメソッドが 1 つだけあります。ここでは、指定する `#value` を Mod の ID にする必要があります。そうしないと、デフォルトの設定ではテストが実行されません。

```java
@GameTestHolder(MODID)
public class ExampleGameTests {
    // ...
}
```

### RegisterGameTestsEvent

`RegisterGameTestsEvent` でも、`#register` を使ってクラスまたはメソッドを登録できます。Event リスナーは Mod の EventBus に[追加][event]する必要があります。この方法で登録するテストメソッドでは、`@GameTest` を付けたすべてのメソッドで、`GameTest#templateNamespace` に Mod ID を指定する必要があります。

```java
// In some event handler class
@SubscribeEvent  // on the mod event bus
public static void registerTests(RegisterGameTestsEvent event) {
    event.register(ExampleGameTests.class);
}

// In ExampleGameTests
@GameTest(templateNamespace = MODID)
public static void exampleTest3(GameTestHelper helper) {
    // Perform setup
}
```

:::note
`GameTestHolder#value` と `GameTest#templateNamespace` に指定する値は、現在の Mod ID と異なっていてもかまいません。その場合は、[ビルドスクリプト][namespaces]の設定を変更する必要があります。
:::

## 構造物テンプレート {#structure-templates}

ゲームテストは、構造物( テンプレート )によって読み込まれた場面の中で行われます。テンプレートはすべて、場面の大きさと、読み込まれる初期データ( Block とエンティティ )を定義します。テンプレートは、`data/<namespace>/structure` の中に `.nbt` ファイルとして保存する必要があります。

:::tip
構造物テンプレートは、ストラクチャーブロックを使って作成・保存できます。
:::

テンプレートの場所は、いくつかの要素で決まります。

- テンプレートの名前空間が指定されているか。
- テンプレートの名前の前にクラス名を付けるか。
- テンプレートの名前が指定されているか。

テンプレートの名前空間は `GameTest#templateNamespace` で決まります。指定されていなければ `GameTestHolder#value`、どちらも指定されていなければ `minecraft` になります。

テストのアノテーションを付けたクラスまたはメソッドに `@PrefixGameTestTemplate` を適用して `false` に設定すると、テンプレートの名前の前に単純クラス名が付かなくなります。そうでない場合は、単純クラス名が小文字になり、ドットとともにテンプレートの名前の前に付けられます。

テンプレートの名前は `GameTest#template` で決まります。指定されていなければ、代わりにメソッド名を小文字にしたものが使われます。

```java
// Modid for all structures will be MODID
@GameTestHolder(MODID)
public class ExampleGameTests {

    // Class name is prepended, template name is not specified
    // Template Location at 'modid:examplegametests.exampletest'
    @GameTest
    public static void exampleTest(GameTestHelper helper) { /*...*/ }

    // Class name is not prepended, template name is not specified
    // Template Location at 'modid:exampletest2'
    @PrefixGameTestTemplate(false)
    @GameTest
    public static void exampleTest2(GameTestHelper helper) { /*...*/ }

    // Class name is prepended, template name is specified
    // Template Location at 'modid:examplegametests.test_template'
    @GameTest(template = "test_template")
    public static void exampleTest3(GameTestHelper helper) { /*...*/ }

    // Class name is not prepended, template name is specified
    // Template Location at 'modid:test_template2'
    @PrefixGameTestTemplate(false)
    @GameTest(template = "test_template2")
    public static void exampleTest4(GameTestHelper helper) { /*...*/ }
}
```

## ゲームテストの実行 {#running-game-tests}

ゲームテストは `/test` コマンドで実行できます。`test` コマンドは非常に多くの設定ができますが、テストの実行に重要なのはいくつかだけです。

| サブコマンド  | 説明                                           |
|:-----------:|:------------------------------------------------------|
| `run`       | 指定したテストを実行します: `run <test_name>`。           |
| `runall`    | 利用可能なすべてのテストを実行します。                             |
| `runclosest`| プレイヤーから 15 ブロック以内で最も近いテストを実行します。 |
| `runthese`  | プレイヤーから 200 ブロック以内のテストを実行します。           |
| `runfailed` | 前回の実行で失敗したすべてのテストを実行します。       |

:::note
サブコマンドは test コマンドの後に続けます: `/test <subcommand>`。
:::

## ビルドスクリプトの設定 {#buildscript-configurations}

ゲームテストには、さまざまな環境で実行・連携するための追加の設定が、ビルドスクリプト( `build.gradle` ファイル )にあります。

### 他の名前空間を有効にする {#enabling-other-namespaces}

ビルドスクリプトを[推奨どおりに設定][buildscript]した場合、有効になるのは現在の Mod ID のゲームテストだけです。他の名前空間からもゲームテストを読み込むには、実行構成でプロパティ `neoforge.enabledGameTestNamespaces` に、各名前空間をカンマで区切った文字列を設定する必要があります。このプロパティが空か未設定の場合は、すべての名前空間が読み込まれます。

```gradle
// Inside a run configuration
property 'neoforge.enabledGameTestNamespaces', 'modid1,modid2,modid3'
```

:::caution
名前空間の間にスペースを入れてはいけません。入れると、名前空間が正しく読み込まれません。
:::

### ゲームテストサーバーの実行構成 {#game-test-server-run-configuration}

ゲームテストサーバーは、ビルドサーバーを実行する特別な構成です。ビルドサーバーは、失敗した必須のゲームテストの数を終了コードとして返します。失敗したテストは、必須か任意かを問わず、すべてログに記録されます。このサーバーは `gradlew runGameTestServer` で実行できます。

<details>
<summary>NeoGradle に関する重要な情報</summary>

:::caution
Gradle の動作の癖により、デフォルトでは、タスクがシステムの終了を強制すると Gradle デーモンが終了させられ、Gradle の実行環境がビルドの失敗を報告します。NeoGradle は、サブプロジェクトが順に実行されないよう、デフォルトで実行タスクに強制終了を設定しています。しかしそのため、ゲームテストサーバーは常に失敗します。

これは、`#setForceExit` メソッドを使って、実行構成で強制終了を無効にすることで解決できます。

```gradle
// Game Test Server run configuration
gameTestServer {
    // ...
    setForceExit false
}
```
:::
</details>


### 他の実行構成でゲームテストを有効にする {#enabling-game-tests-in-other-run-configurations}

デフォルトでは、ゲームテストが有効なのは `client`、`server`、`gameTestServer` の実行構成だけです。他の実行構成でゲームテストを実行したい場合は、`neoforge.enableGameTest` プロパティを `true` に設定する必要があります。

```gradle
// Inside a run configuration
property 'neoforge.enableGameTest', 'true'
```

[test]: #running-game-tests
[namespaces]: #enabling-other-namespaces
[event]: ../concepts/events.md#registering-an-event-handler
[buildscript]: ../gettingstarted/index.md#simple-buildgradle-customizations
