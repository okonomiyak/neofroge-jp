# Mod の構成 {#structuring-your-mod}

Mod をきちんと構成しておくと、メンテナンスやコントリビュートがしやすくなり、コードベースも理解しやすくなります。以下に、Java、Minecraft、NeoForge における推奨事項をいくつか挙げます。

:::note
以下のアドバイスに従う必要はなく、Mod は好きなように構成できます。それでも、従うことを強くおすすめします。
:::

## パッケージ構成 {#packaging}

Mod を構成するときは、一意のトップレベルパッケージ構成を選んでください。多くのプログラマーは、異なるクラスやインターフェースなどに同じ名前を使います。Java では、パッケージが異なれば同じ名前のクラスが存在できます。そのため、同じパッケージに同じ名前のクラスが 2 つあると、片方しか読み込まれず、ほぼ確実にゲームがクラッシュします。

```
a.jar
    - com.example.ExampleClass
b.jar
    - com.example.ExampleClass // This class will not normally be loaded
```

これはモジュールの読み込みでは、さらに重要になります。Mod のモジュールはゲームや他の Mod にエクスポートされるため、別々のモジュールに同じ名前のパッケージがあり、そこにクラスファイルが含まれていると、起動時に Mod ローダーがクラッシュします。

```
module A
    - package X
        - class I
        - class J
module B
    - package X // This package will cause the mod loader to crash, as there already is a module with package X being exported
        - class R
        - class S
        - class T
```

そのため、トップレベルパッケージには、自分が所有しているもの(ドメイン、メールアドレス、Web サイト(のサブドメイン)など)を使ってください。想定される範囲内で一意に識別できることを保証できるなら、自分の名前やユーザー名でもかまいません。さらに、トップレベルパッケージは [group id][group] とも一致させてください。

|   種類    |       値       | トップレベルパッケージ   |
|:---------:|:-----------------:|:--------------------|
|  ドメイン   |    example.com    | `com.example`       |
| サブドメイン | example.github.io | `io.github.example` |
|   メールアドレス   | example@gmail.com | `com.gmail.example` |

その次の階層のパッケージは、Mod の ID にします(例: `com.example.examplemod`。`examplemod` が Mod ID)。こうすれば、同じ ID の Mod が 2 つ存在しない限り(本来あってはならないことです)、パッケージの読み込みで問題は起きません。

その他の命名規則は、[Oracle のチュートリアルページ][naming]で確認できます。

### サブパッケージの整理 {#sub-package-organization}

トップレベルパッケージに加えて、Mod のクラスをサブパッケージに分けることを強くおすすめします。主な方法は 2 つあります。

- **機能別にまとめる**: 共通の目的を持つクラスごとにサブパッケージを作ります。たとえば、ブロックは `block`、アイテムは `item`、エンティティは `entity` に置きます。Minecraft 自体も(一部の例外を除き)同様の構成をとっています。
- **ロジック別にまとめる**: 共通のロジックを持つクラスごとにサブパッケージを作ります。たとえば、新しい種類の作業台を作る場合は、そのブロック、メニュー、アイテムなどを `feature.crafting_table` の下に置きます。

#### クライアント、サーバー、データのパッケージ {#client-server-and-data-packages}

一般に、特定の Side やランタイムでのみ使うコードは、別のサブパッケージに分けて他のクラスから隔離してください。たとえば、[データ生成][datagen]に関するコードは `data` パッケージに、専用サーバーでのみ使うコードは `server` パッケージに置きます。

[クライアント専用のコード][sides]は、`client` サブパッケージに隔離することを強くおすすめします。専用サーバーは Minecraft のクライアント専用パッケージにアクセスできず、Mod がそれらにアクセスしようとするとクラッシュするためです。専用のパッケージを用意しておけば、Mod 内で Side をまたいだアクセスをしていないかを確認する、よい目安になります。

## クラスの命名規則 {#class-naming-schemes}

共通の命名規則を使うと、クラスの目的を読み取りやすくなり、特定のクラスも見つけやすくなります。

クラス名には、一般にその種類を接尾辞として付けます。例:

- `PowerRing` という `Item` -> `PowerRingItem`
- `NotDirt` という `Block` -> `NotDirtBlock`
- `Oven` 用のメニュー -> `OvenMenu`

:::tip
Mojang は通常、エンティティを除くすべてのクラスで同様の構成をとっています。エンティティは名前だけで表されます(例: `Pig`、`Zombie` など)。
:::

## 方法は一つに絞る {#choose-one-method-from-many}

オブジェクトの登録や Event のリッスンなど、ある処理を行う方法はたくさんあります。一般に、ある処理には一つの方法を使い、一貫させることをおすすめします。読みやすくなるうえ、予期しない相互作用や重複(例: Event リスナーが 2 回実行される)を避けられます。

[group]: index.md#the-group-id
[naming]: https://docs.oracle.com/javase/tutorial/java/package/namingpkgs.html
[datagen]: ../resources/index.md#data-generation
[sides]: ../concepts/sides.md
