# バージョン {#versioning}

この記事では、Minecraft と NeoForge でバージョンがどのように付けられているかを解説し、Mod のバージョンの付け方についてもいくつか推奨事項を紹介します。

## Minecraft

Minecraft は[セマンティックバージョニング][semver]を採用しています。セマンティックバージョニング( 略して「semver」 )は `major.minor.patch` という形式です。たとえば Minecraft 1.20.2 では、メジャーバージョンが 1、マイナーバージョンが 20、パッチバージョンが 2 です。

Minecraft は、Minecraft 1.0 が登場した 2011 年から、メジャーバージョンとして `1` を使い続けています。それ以前はバージョンの付け方が頻繁に変わり、`a1.1`( Alpha 1.1 )や `b1.7.3`( Beta 1.7.3 )、さらには明確な規則にまったく従っていない `infdev` バージョンなどがありました。メジャーバージョン `1` が 10 年以上続いていることや、Minecraft 2 が内輪ネタになっていることから、これが変わる可能性は低いと一般に考えられています。

### スナップショット {#snapshots}

スナップショットは、標準的な semver の形式から外れています。`YYwWWa` という形式で、`YY` は西暦の下 2 桁( 例: `23` )、`WW` はその年の週番号( 例: `01` )を表します。たとえば、スナップショット `23w01a` は 2023 年の第 1 週にリリースされたスナップショットです。

接尾辞の `a` は、同じ週に 2 つのスナップショットがリリースされる場合のためにあります( その場合、2 つ目のスナップショットは `23w01b` のような名前になります )。Mojang は過去に何度かこれを使っています。また、[2020 年のエイプリルフールネタである無限ディメンション][infinite]の `20w14infinite` のように、別の接尾辞が使われたこともあります。

### プレリリースとリリース候補 {#pre-releases-and-release-candidates}

スナップショットのサイクルが終わりに近づくと、Mojang はプレリリースと呼ばれるものをリリースし始めます。プレリリースは、そのバージョンの機能がそろったものとみなされ、バグ修正のみに集中します。対象バージョンの semver 表記に `-preX` を付けた名前になります。たとえば、1.20.2 の最初のプレリリースは `1.20.2-pre1` でした。プレリリースは複数あることがあり、通常は複数出ます。その場合は `-pre2`、`-pre3` のように接尾辞が付きます。

同様に、プレリリースのサイクルが終わると、Mojang はリリース候補 1( バージョンに `-rc1` を付けたもの。例: `1.20.2-rc1` )をリリースします。Mojang は、それ以上バグが見つからなければそのままリリースできるリリース候補を 1 つで済ませることを目指しています。ただし、予期しないバグが見つかった場合は、プレリリースと同様に `-rc2`、`-rc3` などのバージョンが出ることもあります。

## NeoForge

NeoForge は semver を応用した方式を採用しています。メジャーバージョンは Minecraft のマイナーバージョン、マイナーバージョンは Minecraft のパッチバージョン、パッチバージョンは「実際の」NeoForge のバージョンです。たとえば NeoForge 20.2.59 は、Minecraft 1.20.2 向けの 60 番目のバージョンです( 0 から数えるため )。先頭の `1` は変わる可能性が非常に低いため省略されています。その理由は[上記][minecraft]を参照してください。

NeoForge のいくつかの場所では、[Maven のバージョン範囲][mvr]も使われています。たとえば、[`neoforge.mods.toml`][neoforgemodstoml] ファイルにおける Minecraft と NeoForge のバージョン範囲です。これは semver とほぼ互換性がありますが、完全ではありません( たとえば、`pre` タグは考慮されません )。

## Mod {#mods}

決定的に最良のバージョン方式というものはありません。開発スタイルやプロジェクトの規模など、さまざまな要素がどの方式を使うかの判断に影響します。複数の方式を組み合わせることもあります。このセクションでは、よく使われるバージョン方式の概要を、実例とともに紹介します。

通常、Mod のファイル名は `modid-<version>.jar` のようになります。Mod ID が `examplemod` でバージョンが `1.2.3` なら、Mod ファイルの名前は `examplemod-1.2.3.jar` になります。

:::note
バージョン方式は推奨であり、厳密に強制されるルールではありません。特に、いつ、どのようにバージョンを変更する( 「上げる」 )かについてはそうです。別のバージョン方式を使いたければ、誰も止めはしません。
:::

### セマンティックバージョニング {#semantic-versioning}

セマンティックバージョニング( 「semver」 )は、`major.minor.patch` の 3 つの部分からなります。メジャーバージョンはコードベースに大きな変更を加えたときに上げます。これは通常、大きな新機能やバグ修正に対応します。マイナーバージョンは小さな機能を追加したときに上げ、パッチバージョンはバグ修正のみのアップデートで上げます。

一般に、`0.x.x` のバージョンは開発版とされ、最初の( 正式な )リリースでバージョンを `1.0.0` に上げるべきだと考えられています。

「機能はマイナー、バグ修正はパッチ」というルールは、実際には無視されることがよくあります。よく知られた例が Minecraft 自体で、大きな機能はマイナーバージョン、小さな機能はパッチバージョンで追加し、バグ修正はスナップショットで行っています( 上記参照 )。

Mod の更新頻度によって、これらの数値は小さくも大きくもなります。たとえば、[Supplementaries][supplementaries] は( 執筆時点で )バージョン `2.6.31` です。特に `patch` が 3 桁や 4 桁になることも十分ありえます。

### 「縮小」semver と「拡張」semver {#reduced-and-expanded-semver}

semver が 2 つの数値だけで使われていることもあります。これは一種の「縮小」semver、または「2 部構成」の semver です。バージョン番号は `major.minor` の形式だけです。これは、単純なオブジェクトをいくつか追加するだけで、( Minecraft のバージョンアップを除けば )更新がほとんど必要ない小規模な Mod でよく使われ、ずっとバージョン `1.0` のままということもよくあります。

「拡張」semver、または「4 部構成」の semver には 4 つの数値があります( `1.0.0.0` のような形です )。Mod によって、形式は `major.api.minor.patch` だったり、`major.minor.patch.hotfix` だったり、まったく別のものだったりします。標準的なやり方はありません。

`major.api.minor.patch` では、`major` バージョンが `api` バージョンから独立しています。つまり、`major`( 機能 )の部分と `api` の部分を別々に上げられます。これは、他の Mod 開発者が使える API を公開している Mod でよく使われます。たとえば、[Mekanism][mekanism] は( 執筆時点で )バージョン 10.4.5.19 です。

`major.minor.patch.hotfix` では、パッチの部分が 2 つに分かれています。これは [Create][create] Mod が採用している方式で、( 執筆時点で )バージョン 0.5.1f です。Create では、通常の semver との互換性を保つため、hotfix を 4 つ目の数値ではなく文字で表している点に注意してください。

:::info
縮小 semver、拡張 semver、2 部構成の semver、4 部構成の semver は、いずれも公式の用語ではなく、標準化された形式でもありません。
:::

### アルファ、ベータ、リリース {#alpha-beta-release}

Minecraft 自体と同様に、Mod 開発でも、ソフトウェア工学でおなじみの古典的な `alpha`/`beta`/`release` の段階がよく使われます。`alpha` は不安定/実験的なバージョン( `experimental` や `snapshot` と呼ばれることもあります )、`beta` はある程度安定したバージョン、`release` は安定版( `release` ではなく `stable` と呼ばれることもあります )を表します。

メジャーバージョンを Minecraft のバージョンアップを示すために使う Mod もあります。たとえば [JEI][jei] は、Minecraft 1.19.2 には `13.x.x.x`、1.19.4 には `14.x.x.x`、1.20.1 には `15.x.x.x` を使っています( 1.19.3 と 1.20.0 向けのバージョンはありません )。また、Mod 名にタグを付け加える Mod もあります。たとえば [Minecolonies][minecolonies] Mod は、執筆時点で `1.1.328-BETA` です。

### Minecraft のバージョンを含める {#including-the-minecraft-version}

Mod が対象とする Minecraft のバージョンをファイル名に含めるのは一般的です。こうすると、エンドユーザーが Mod の対象バージョンを簡単に確認できます。よく使われる位置は Mod のバージョンの前か後で、前に置くほうが広く使われています。たとえば、1.20.2 向けの JEI バージョン `16.0.0.28`( 執筆時点の最新版 )なら、`jei-1.20.2-16.0.0.28` または `jei-16.0.0.28-1.20.2` になります。

### Mod ローダーを含める {#including-the-mod-loader}

ご存じのとおり、Mod ローダーは NeoForge だけではなく、多くの Mod 開発者が複数のプラットフォームで開発しています。そのため、同じ Mod の同じバージョンで、Mod ローダーだけが異なる 2 つのファイルを区別する方法が必要です。

通常は、名前のどこかに Mod ローダーを含めます。`jei-neoforge-1.20.2-16.0.0.28`、`jei-1.20.2-neoforge-16.0.0.28`、`jei-1.20.2-16.0.0.28-neoforge` はいずれも有効なやり方です。他の Mod ローダー向けには、`neoforge` の部分を `forge`、`fabric`、`quilt` など、NeoForge と並行して開発している Mod ローダーの名前に置き換えます。

### Maven についての注意 {#a-note-on-maven}

依存関係のホスティングに使われるシステムである Maven は、細かい点で semver とは異なるバージョン方式を使っています( ただし、`major.minor.patch` という全体的なパターンは同じです )。関連する [Maven Versioning Range ( MVR )][mvr] は、NeoForge のいくつかの場所で使われています( [上記][neoforge]参照 )。バージョン方式を選ぶときは、MVR と互換性があることを確認してください。そうでないと、他の Mod があなたの Mod の特定のバージョンに依存できなくなります。

[create]: https://www.curseforge.com/minecraft/mc-mods/create
[infinite]: https://minecraft.wiki/w/Java_Edition_20w14∞
[jei]: https://www.curseforge.com/minecraft/mc-mods/jei
[mekanism]: https://www.curseforge.com/minecraft/mc-mods/mekanism
[minecolonies]: https://www.curseforge.com/minecraft/mc-mods/minecolonies
[minecraft]: #minecraft
[neoforgemodstoml]: modfiles.md#neoforgemodstoml
[mvr]: https://maven.apache.org/enforcer/enforcer-rules/versionRanges.html
[mvr]: https://maven.apache.org/ref/3.5.2/maven-artifact/apidocs/org/apache/maven/artifact/versioning/ComparableVersion.html
[neoforge]: #neoforge
[pre]: #pre-releases
[rc]: #release-candidates
[semver]: https://semver.org/
[supplementaries]: https://www.curseforge.com/minecraft/mc-mods/supplementaries
