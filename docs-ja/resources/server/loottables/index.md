# ルートテーブル {#loot-tables}

ルートテーブルは、ランダムなドロップ品を定義するためのデータファイルです。ルートテーブルは抽選でき、アイテムスタックのリスト( 空の場合もあります )を返します。この処理の結果は( 疑似 )乱数に依存します。ルートテーブルは `data/<mod_id>/loot_table/<name>.json` に置かれます。たとえば、土の Block が使うルートテーブル `minecraft:blocks/dirt` は、`data/minecraft/loot_table/blocks/dirt.json` にあります。

Minecraft は、Block のドロップ、エンティティのドロップ、チェストの中身、釣りの戦利品など、ゲームのさまざまな場面でルートテーブルを使っています。ルートテーブルがどう参照されるかは、場面によって異なります。

- すべての Block には、デフォルトで `<block_namespace>:blocks/<block_name>` にあるルートテーブルが関連付けられます。Block の `Properties` で `#noLootTable` を呼び出すとこれを無効にでき、ルートテーブルが作られず、Block は何もドロップしなくなります。これは主に、空気のような Block や技術的な Block で行われます。
- `MobCategory.MISC` カテゴリ( `EntityType#getCategory` で決まります )に属さない `LivingEntity` のサブクラスには、デフォルトで `<entity_namespace>:entities/<entity_name>` にあるルートテーブルが関連付けられます。これは、`LivingEntity` を直接継承している場合は `#getLootTable` を、`Mob` またはそのサブクラスを継承している場合は `#getDefaultLootTable` をオーバーライドして変更できます。たとえば、ヒツジはこれを使って、毛の色に応じて異なるルートテーブルを抽選しています。
- 構造物のチェストは、BlockEntity のデータでルートテーブルを指定します。Minecraft は、チェストのルートテーブルをすべて `minecraft:chests/<chest_name>` に置いています。Mod でもこの慣例に従うことをおすすめしますが、必須ではありません。
- 襲撃の後に村人がプレイヤーに投げる贈り物のアイテムのルートテーブルは、[`neoforge:raid_hero_gifts` データマップ][raidherogifts]で定義されます。
- 釣りのルートテーブルなど、その他のルートテーブルは、必要なときに `level.getServer().reloadableRegistries().getLootTable(lootTableId)` から取得されます。バニラのすべてのルートテーブルの場所の一覧は `BuiltInLootTables` にあります。

:::warning
ルートテーブルは一般に、自分の Mod に属するものについてだけ作るべきです。既存のルートテーブルを変更するには、代わりに[グローバルルートモディファイア( GLM )][glm]を使ってください。
:::

ルートテーブルの仕組みは複雑なため、ルートテーブルは、それぞれ異なる目的を持つ複数のサブシステムで構成されています。

## ルートエントリ {#loot-entry}

ルートエントリ( ルートプールのエントリ )は、コード上では抽象クラス `LootPoolEntryContainer` で表され、単一のルートの要素です。ドロップする 1 つまたは複数の Item を指定できます。

バニラには、全部で 8 種類のルートエントリがあります。共通の親クラス `LootPoolEntryContainer` を通じて、どれも次のプロパティを持ちます。

- `weight`: 重みの値。デフォルトは 1 です。一部の Item を他より出やすくしたい場合に使います。たとえば、重みが 3 と 1 の 2 つのルートエントリがある場合、1 つ目のエントリが選ばれる確率は 75%、2 つ目は 25% になります。
- `quality`: 品質の値。デフォルトは 0 です。0 以外の場合、ルートテーブルを抽選するときに、この値に( [ルートコンテキスト][context]で設定された )幸運の値を掛けたものが重みに加えられます。
- `conditions`: このルートエントリに適用する[ルート条件][lootcondition]のリスト。条件の 1 つでも満たされなければ、そのエントリは存在しないものとして扱われます。
- `functions`: このルートエントリの出力に適用する[ルート関数][lootfunction]のリスト。

ルートエントリは、一般に 2 つのグループに分けられます。単一のもの( 共通の親クラスは `LootPoolSingletonContainer` )と複合のもの( 共通の親クラスは `CompositeEntryBase` )で、複合のものは複数の単一のもので構成されます。Minecraft には、次の単一の種類があります。

- `minecraft:empty`: アイテムがないことを表す、空のルートエントリ。コードでは `EmptyLootItem#emptyItem` を呼び出して作成します。
- `minecraft:item`: 単一のアイテムのルートエントリで、抽選されると指定した Item をドロップします。コードでは、目的の Item を渡して `LootItem#lootTableItem` を呼び出して作成します。
    - スタック数やデータコンポーネントなどの設定は、ルート関数で行えます。
- `minecraft:tag`: タグのエントリで、抽選されると指定したタグ内のすべての Item をドロップします。真偽値の `expand` プロパティの値によって、2 つの形があります。`expand` が true の場合は、タグ内の Item ごとに別々のエントリが生成されます。そうでなければ、すべての Item をドロップする 1 つのエントリが使われます。`TagEntry#tagContents`( `expand=false` の場合 )または `TagEntry#expandTag`( `expand=true` の場合 )に、アイテムの[タグキー][tags]を渡して作成します。
    - たとえば、`expand` が true でタグが `#minecraft:planks` の場合、木材の種類ごとに 1 つのエントリが生成されます( バニラの 11 種類の木材に 11 個のエントリと、Mod の木材ごとに 1 つずつ )。それぞれが指定した重み、品質、関数を持ちます。一方、`expand` が false の場合は、すべての木材をドロップする 1 つのエントリが使われます。
- `minecraft:dynamic`: 動的なドロップを参照するルートエントリ。動的なドロップは、事前には指定できないエントリをルートテーブルに追加するための仕組みで、代わりにコードで追加します。動的なドロップのエントリは、ID と、実際に Item を追加する `Consumer<ItemStack>` からなります。動的なドロップのエントリを追加するには、目的の ID で `minecraft:dynamic` のエントリを指定し、[ルートコンテキスト][context]に対応する Consumer を追加します。`DynamicLoot#dynamicEntry` で作成します。
- `minecraft:loot_table`: 別のルートテーブルを抽選し、その結果を 1 つのエントリとして加えるルートエントリ。別のルートテーブルは、ID で指定することも、全体をインラインで書くこともできます。コードでは、`ResourceLocation` を渡して `NestedLootTable#lootTableReference` を呼び出すか、インラインのルートテーブルなら `LootTable` オブジェクトを渡して `NestedLootTable#inlineLootTable` を呼び出して作成します。

Minecraft には、次の複合の種類があります。

- `minecraft:group`: 他のルートエントリのリストを含むルートエントリで、順に実行されます。コードでは `EntryGroup#list` を呼び出すか、別の `LootPoolSingletonContainer.Builder` で `#append` を呼び出して作成します。どちらも他のルートエントリのビルダーを渡します。
- `minecraft:sequence`: `minecraft:group` に似ていますが、サブエントリの 1 つが失敗した時点でルートエントリの実行が止まり、それ以降のエントリはすべて破棄されます。コードでは `SequentialEntry#sequential` を呼び出すか、別の `LootPoolSingletonContainer.Builder` で `#then` を呼び出して作成します。どちらも他のルートエントリのビルダーを渡します。
- `minecraft:alternatives`: `minecraft:sequence` のいわば逆で、サブエントリの 1 つが( 失敗したときではなく )成功した時点でルートエントリの実行が止まり、それ以降のエントリはすべて破棄されます。コードでは `AlternativesEntry#alternatives` を呼び出すか、別の `LootPoolSingletonContainer.Builder` で `#otherwise` を呼び出して作成します。どちらも他のルートエントリのビルダーを渡します。

Mod 開発者は、[カスタムのルートエントリの種類][customentry]を定義することもできます。

## ルートプール {#loot-pool}

ルートプールとは、本質的にはルートエントリのリストです。ルートテーブルは複数のルートプールを持つことができ、各ルートプールは他とは独立して抽選されます。

ルートプールには、次の内容を含められます。

- `entries`: ルートエントリのリスト。
- `conditions`: このルートプールに適用する[ルート条件][lootcondition]のリスト。条件の 1 つでも満たされなければ、ルートプールのエントリはどれも抽選されません。
- `functions`: このルートプールのすべてのルートエントリの出力に適用する[ルート関数][lootfunction]のリスト。
- `rolls` と `bonus_rolls`: 2 つの数値プロバイダ( 後述 )で、合わせてこのルートプールを抽選する回数を決めます。計算式は rolls + bonus_rolls * luck で、luck の値は[ルートパラメータ][parameters]で設定されます。
- `name`: ルートプールの名前。NeoForge が追加したものです。[GLM][glm] で使えます。指定しない場合は、ルートプールのハッシュコードに `custom#` を接頭辞として付けたものになります。

## 数値プロバイダ {#number-provider}

数値プロバイダは、Datapack の文脈で( 疑似 )ランダムな数値を得る方法です。主にルートテーブルで使われますが、worldgen など他の場面でも使われます。バニラには、次の 6 つの数値プロバイダがあります。

- `minecraft:constant`: 定数の float 値で、必要に応じて整数に丸められます。`ConstantValue#exactly` で作成します。
- `minecraft:uniform`: 一様分布のランダムな整数または float の値で、最小値と最大値を設定します。最小値と最大値の間のすべての値が、同じ確率で出ます。`UniformGenerator#between` で作成します。
- `minecraft:binomial`: 二項分布のランダムな整数値で、n と p の値を設定します。これらの値の意味については、[二項分布][binomial]を参照してください。`BinomialDistributionGenerator#binomial` で作成します。
- `minecraft:score`: エンティティの対象、スコアの名前、( 任意で )倍率を受け取り、エンティティの対象について指定したスコアボードの値を取得し、( あれば )倍率を掛けます。`ScoreboardValue#fromScoreboard` で作成します。
- `minecraft:storage`: 指定した NBT パスにある、コマンドストレージの値。`new StorageValue` で作成します。
- `minecraft:enchantment_level`: エンチャントのレベルごとの値を提供します。`LevelBasedValue` を渡して `EnchantmentLevelProvider#forEnchantmentLevel` で作成します。有効な `LevelBasedValue` は次のとおりです。
    - 種類を指定しない、単なる定数の値。`LevelBasedValue#constant` で作成します。
    - `minecraft:linear`: エンチャントのレベルごとに線形に増える値に、任意で定数のベース値を加えたもの。`LevelBasedValue#perLevel` で作成します。
    - `minecraft:levels_squared`: エンチャントの値を 2 乗し、任意でベース値を加えます。`new LevelBasedValue.LevelsSquared` で作成します。
    - `minecraft:fraction`: 他の 2 つの `LevelBasedValue` を受け取り、それを使って分数を作ります。`new LevelBasedValue.Fraction` で作成します。
    - `minecraft:clamped`: 別の `LevelBasedValue` と、最小値・最大値を受け取ります。別の `LevelBasedValue` で値を計算し、結果を範囲内に収めます。`new LevelBasedValue.Clamped` で作成します。
    - `minecraft:lookup`: `List<Float>` と、フォールバックの `LevelBasedValue` を受け取ります。使う値をリストから探し( レベル 1 はリストの最初の要素、レベル 2 は 2 番目の要素、というように )、あるレベルの値がない場合はフォールバックの値を使います。`LevelBasedValue#lookup` で作成します。

必要であれば、Mod 開発者は[カスタムの数値プロバイダ][customnumber]や[カスタムのレベルに基づく値][customlevelbased]を登録することもできます。

## ルートパラメータ {#loot-parameters}

ルートパラメータは、内部では `LootContextParam<T>` と呼ばれ、ルートテーブルを抽選するときに渡されるパラメータです。`T` は、渡されるパラメータの型( 例: `BlockPos` や `Entity` )です。ルートパラメータは、[ルート条件][lootcondition]や[ルート関数][lootfunction]で使えます。たとえば、`minecraft:killed_by_player` のルート条件は、`minecraft:player` パラメータが存在するかをチェックします。

Minecraft には、次のルートパラメータがあります。

- `minecraft:origin`: ルートテーブルに関連付けられた位置。例: 戦利品のチェストの位置。`LootContextParams.ORIGIN` でアクセスします。
- `minecraft:tool`: ルートテーブルに関連付けられたアイテムスタック。例: Block を壊すのに使った Item。必ずしも道具とは限りません。`LootContextParams.TOOL` でアクセスします。
- `minecraft:enchantment_level`: エンチャントのロジックで使う、エンチャントのレベル。`LootContextParams.ENCHANTMENT_LEVEL` でアクセスします。
- `minecraft:enchantment_active`: 使った Item にエンチャントがあるかどうか。シルクタッチのチェックなどで使われます。`LootContextParams.ENCHANTMENT_ACTIVE` でアクセスします。
- `minecraft:block_state`: ルートテーブルに関連付けられたブロックステート。例: 壊されたブロックステート。`LootContextParams.BLOCK_STATE` でアクセスします。
- `minecraft:block_entity`: ルートテーブルに関連付けられた BlockEntity。例: 壊された Block に関連付けられた BlockEntity。シュルカーボックスが、ドロップしたアイテムにインベントリを保存するのに使っています。`LootContextParams.BLOCK_ENTITY` でアクセスします。
- `minecraft:explosion_radius`: 現在の文脈での爆発の半径。主に、ドロップに爆発による減少を適用するのに使われます。`LootContextParams.EXPLOSION_RADIUS` でアクセスします。
- `minecraft:this_entity`: ルートテーブルに関連付けられたエンティティ。通常は倒されたエンティティです。`LootContextParams.THIS_ENTITY` でアクセスします。
- `minecraft:damage_source`: ルートテーブルに関連付けられた[ダメージソース][damagesource]。通常は、エンティティを倒したダメージソースです。`LootContextParams.DAMAGE_SOURCE` でアクセスします。
- `minecraft:attacking_entity`: ルートテーブルに関連付けられた、攻撃したエンティティ。通常は、エンティティを倒した者です。`LootContextParams.ATTACKING_ENTITY` でアクセスします。
- `minecraft:direct_attacking_entity`: ルートテーブルに関連付けられた、直接攻撃したエンティティ。たとえば、攻撃したエンティティがスケルトンなら、直接攻撃したエンティティは矢です。`LootContextParams.DIRECT_ATTACKING_ENTITY` でアクセスします。
- `minecraft:last_damage_player`: ルートテーブルに関連付けられたプレイヤー。通常は、倒されたエンティティを最後に攻撃したプレイヤーで、プレイヤーによる討伐が間接的な場合( 例: プレイヤーがエンティティを軽く叩き、その後エンティティがトゲで倒された )でも当てはまります。プレイヤーが倒したときだけのドロップなどに使われます。`LootContextParams.LAST_DAMAGE_PLAYER` でアクセスします。

カスタムのルートパラメータは、目的の ID を渡して `new LootContextParam<T>` を呼び出すことで作成できます。これらは単なるリソースロケーションのラッパーなので、登録する必要はありません。

### エンティティの対象 {#entity-targets}

エンティティの対象は、ルート条件やルート関数で使われる型で、コード上では `LootContext.EntityTarget` enum で表されます。条件や関数の文脈で問い合わせるエンティティのルートパラメータを指定するのに使います。有効な値は次のとおりです。

- `"this"` または `LootContext.EntityTarget.THIS`: `"minecraft:this_entity"` パラメータを表します。
- `"attacker"` または `LootContext.EntityTarget.ATTACKER`: `"minecraft:attacking_entity"` パラメータを表します。
- `"direct_attacker"` または `LootContext.EntityTarget.DIRECT_ATTACKER`: `"minecraft:direct_attacking_entity"` パラメータを表します。
- `"attacking_player"` または `LootContext.EntityTarget.ATTACKING_PLAYER`: `"minecraft:last_damage_player"` パラメータを表します。

たとえば、`minecraft:entity_properties` のルート条件はエンティティの対象を受け取るので、( ルートテーブルの作者として )必要であれば、4 つのルートパラメータのどれでもチェックできます。

### ルートパラメータのセット {#loot-parameter-sets}

ルートパラメータのセットは、ルートテーブルのタイプとも呼ばれ、コード上では `LootContextParamSet` と呼ばれます。必須と任意のルートパラメータの集まりです。名前に反して、これは `Set` ではありません( `Collection` ですらありません )。実際には 2 つの `Set<LootContextParam<?>>` のラッパーで、1 つは必須のパラメータ( `#getRequired` )を、もう 1 つは必須と任意のパラメータ( `#getAllowed` )を保持します。ルートパラメータを使う側が、利用できると期待できるパラメータだけを使っていることの検証と、テーブルを抽選するときに必須のパラメータがあることの確認に使われます。それ以外に、進捗やエンチャントのロジックでも使われます。

バニラには、次のルートパラメータのセットがあります( 必須のパラメータは**太字**、任意のパラメータは_斜体_で示します。コード上の名前は `LootContextParamSets` の定数です )。

| ID | コード上の名前 | 指定されるルートパラメータ | 用途 |
|----------------------------------|------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------|
| `minecraft:empty`                | `EMPTY`                | n/a                                                                                                                                                                                                                                                                                                                  | フォールバック用。 |
| `minecraft:generic`              | `ALL_PARAMS`           | **`minecraft:origin`**, **`minecraft:tool`**, **`minecraft:block_state`**, **`minecraft:block_entity`**, **`minecraft:explosion_radius`**, **`minecraft:this_entity`**, **`minecraft:damage_source`**, **`minecraft:attacking_entity`**, **`minecraft:direct_attacking_entity`**, **`minecraft:last_damage_player`** | 検証。 |
| `minecraft:command`              | `COMMAND`              | **`minecraft:origin`**, _`minecraft:this_entity`_                                                                                                                                                                                                                                                                    | コマンド。 |
| `minecraft:selector`             | `SELECTOR`             | **`minecraft:origin`**, _`minecraft:this_entity`_                                                                                                                                                                                                                                                                    | コマンドのエンティティセレクター。 |
| `minecraft:block`                | `BLOCK`                | **`minecraft:origin`**, **`minecraft:tool`**, **`minecraft:block_state`**, _`minecraft:block_entity`_, _`minecraft:explosion_radius`_, _`minecraft:this_entity`_                                                                                                                                                     | Block の破壊。 |
| `minecraft:block_use`            | `BLOCK_USE`            | **`minecraft:origin`**, **`minecraft:block_state`**, **`minecraft:this_entity`**                                                                                                                                                                                                                                     | バニラでは使われていません。 |
| `minecraft:hit_block`            | `HIT_BLOCK`            | **`minecraft:origin`**, **`minecraft:enchantment_level`**, **`minecraft:block_state`**, **`minecraft:this_entity`**                                                                                                                                                                                                  | 召雷のエンチャント。 |
| `minecraft:chest`                | `CHEST`                | **`minecraft:origin`**, _`minecraft:this_entity`_, _`minecraft:attacking_entity`_                                                                                                                                                                                                                                    | 戦利品のチェストや類似のコンテナ、チェスト付きトロッコ。 |
| `minecraft:archaeology`          | `ARCHAEOLOGY`          | **`minecraft:origin`**, _`minecraft:this_entity`_                                                                                                                                                                                                                                                                    | 考古学。 |
| `minecraft:vault`                | `VAULT`                | **`minecraft:origin`**, _`minecraft:this_entity`_                                                                                                                                                                                                                                                                    | トライアルチャンバーの宝庫の報酬。 |
| `minecraft:entity`               | `ENTITY`               | **`minecraft:origin`**, **`minecraft:this_entity`**, **`minecraft:damage_source`**, _`minecraft:attacking_entity`_, _`minecraft:direct_attacking_entity`_, _`minecraft:last_damage_player`_                                                                                                                          | エンティティの討伐。 |
| `minecraft:shearing`             | `SHEARING`             | **`minecraft:origin`**, _`minecraft:this_entity`_                                                                                                                                                                                                                                                                    | ヒツジなど、エンティティの毛刈り。 |
| `minecraft:equipment`            | `EQUIPMENT`            | **`minecraft:origin`**, **`minecraft:this_entity`**                                                                                                                                                                                                                                                                  | ゾンビなどのエンティティの装備。 |
| `minecraft:gift`                 | `GIFT`                 | **`minecraft:origin`**, **`minecraft:this_entity`**                                                                                                                                                                                                                                                                  | 襲撃の英雄への贈り物。 |
| `minecraft:barter`               | `PIGLIN_BARTER`        | **`minecraft:this_entity`**                                                                                                                                                                                                                                                                                          | ピグリンとの物々交換。 |
| `minecraft:fishing`              | `FISHING`              | **`minecraft:origin`**, **`minecraft:tool`**, _`minecraft:this_entity`_, _`minecraft:attacking_entity`_                                                                                                                                                                                                              | 釣り。 |
| `minecraft:enchanted_item`       | `ENCHANTED_ITEM`       | **`minecraft:tool`**, **`minecraft:enchantment_level`**                                                                                                                                                                                                                                                              | いくつかのエンチャント。 |
| `minecraft:enchanted_entity`     | `ENCHANTED_ENTITY`     | **`minecraft:origin`**, **`minecraft:enchantment_level`**, **`minecraft:this_entity`**                                                                                                                                                                                                                               | いくつかのエンチャント。 |
| `minecraft:enchanted_damage`     | `ENCHANTED_DAMAGE`     | **`minecraft:origin`**, **`minecraft:enchantment_level`**, **`minecraft:this_entity`**, **`minecraft:damage_source`**, _`minecraft:attacking_entity`_, _`minecraft:direct_attacking_entity`_                                                                                                                         | ダメージと防御のエンチャント。 |
| `minecraft:enchanted_location`   | `ENCHANTED_LOCATION`   | **`minecraft:origin`**, **`minecraft:enchantment_level`**, **`minecraft:enchantment_active`**, **`minecraft:this_entity`**                                                                                                                                                                                           | 氷渡りとソウルスピードのエンチャント。 |
| `minecraft:advancement_entity`   | `ADVANCEMENT_ENTITY`   | **`minecraft:origin`**, **`minecraft:this_entity`**                                                                                                                                                                                                                                                                  | いくつかの[進捗の条件][advancement]。 |
| `minecraft:advancement_location` | `ADVANCEMENT_LOCATION` | **`minecraft:origin`**, **`minecraft:tool`**, **`minecraft:block_state`**, **`minecraft:this_entity`**                                                                                                                                                                                                               | いくつかの[進捗のトリガー][advancement]。 |
| `minecraft:advancement_reward`   | `ADVANCEMENT_REWARD`   | **`minecraft:origin`**, **`minecraft:this_entity`**                                                                                                                                                                                                                                                                  | [進捗の報酬][advancement]。 |

### ルートコンテキスト {#loot-context}

ルートコンテキストは、ルートテーブルを抽選するための状況の情報を含むオブジェクトです。情報には次のものが含まれます。

- ルートテーブルを抽選する `ServerLevel`。`#getLevel` で取得します。
- ルートテーブルの抽選に使う `RandomSource`。`#getRandom` で取得します。
- ルートパラメータ。存在は `#hasParam` で確認し、個々のパラメータは `#getParam` で取得します。
- ボーナスの抽選回数や品質の値の計算に使う幸運の値。通常は、エンティティの幸運の属性で設定されます。`#getLuck` で取得します。
- 動的なドロップの Consumer。詳しくは[前述][entry]を参照してください。`#addDynamicDrops` で設定します。getter はありません。

## ルートテーブル {#loot-table}

ここまでの要素をすべて組み合わせると、ついにルートテーブルができます。ルートテーブルの JSON では、次の値を指定できます。

- `pools`: ルートプールのリスト。
- `neoforge:conditions`: [データの読み込み条件][conditions]のリスト。**警告: これはデータの読み込み条件であり、[ルート条件][lootcondition]ではありません!**
- `functions`: このルートテーブルのすべてのルートエントリの出力に適用する[ルート関数][lootfunction]のリスト。
- `type`: ルートパラメータが正しく使われているかの検証に使う、ルートパラメータのセット。任意で、ない場合は検証が省かれます。
- `random_sequence`: このルートテーブルの乱数列を、リソースロケーションの形で指定します。乱数列は `Level` が提供し、同じ条件のもとで一貫したルートテーブルの抽選を行うために使われます。通常は、ルートテーブルの場所を使います。

ルートテーブルの例は、次のような形式になります。

```json5
{
    "type": "chest", // loot parameter set
    "neoforge:conditions": [
        // data load conditions
    ],
    "functions": [
        // table-wide loot functions
    ],
    "pools": [ // list of loot pools
        {
            "rolls": 1, // amount of rolls of the loot table, using 5 here will yield 5 results from the pool
            "bonus_rolls": 0.5, // amount of bonus rolls
            "name": "my_pool",
            "conditions": [
                // pool-wide loot conditions
            ],
            "functions": [
                // pool-wide loot functions
            ],
            "entries": [ // list of loot table entries
                {
                    "type": "minecraft:item", // loot entry type
                    "name": "minecraft:dirt", // type-specific properties, for example the name of the item
                    "weight": 3, // weight of an entry
                    "quality": 1, // quality of an entry
                    "conditions": [
                        // entry-wide loot conditions
                    ],
                    "functions": [
                        // entry-wide loot functions
                    ]
                }
            ]
        }
    ]
}
```

## ルートテーブルの抽選 {#rolling-a-loot-table}

ルートテーブルを抽選するには、ルートテーブル自体とルートコンテキストの 2 つが必要です。

まず、ルートテーブル自体の取得から始めましょう。ルートテーブルは `level.getServer().reloadableRegistries().getLootTable(lootTableId)` で取得できます。ルートのデータはサーバーからしか利用できないため、このロジックは論理クライアントではなく[論理サーバー][sides]で実行する必要があります。

:::tip
Minecraft の組み込みのルートテーブルの ID は、`BuiltInLootTables` クラスにあります。Block のルートテーブルは `BlockBehaviour#getLootTable` で、エンティティのルートテーブルは `EntityType#getDefaultLootTable` または `Entity#getLootTable` で取得できます。
:::

ルートテーブルが手に入ったので、パラメータのセットを構築しましょう。まず `LootParams.Builder` のインスタンスを作成します。

```java
// Make sure that you are on a server, otherwise the cast will fail.
LootParams.Builder builder = new LootParams.Builder((ServerLevel) level);
```

そして、次のようにルートコンテキストのパラメータを追加できます。

```java
// Use whatever context parameters and values you need. Vanilla parameters can be found in LootContextParams.
builder.withParameter(LootContextParams.ORIGIN, position);
// This variant can accept null as the value, in which case an existing value for that parameter will be removed.
builder.withOptionalParameter(LootContextParams.ORIGIN, null);
// Add a dynamic drop.
builder.withDynamicDrop(ResourceLocation.fromNamespaceAndPath("examplemod", "example_dynamic_drop"), stack -> {
    // some logic here
});
// Set our luck value. Assumes that a player is available. Contexts without a player should use 0 here.
builder.withLuck(player.getLuck());
```

最後に、ビルダーから `LootParams` を作成し、それを使ってルートテーブルを抽選します。

```java
// Specify a loot context param set here if you want.
LootParams params = builder.create(LootContextParamSet.EMPTY);
// Get the loot table.
LootTable table = level.getServer().reloadableRegistries().getLootTable(location);
// Actually roll the loot table.
List<ItemStack> list = table.getRandomItems(params);
// Use this instead if you are rolling the loot table for container contents, e.g. loot chests.
// This method takes care of properly splitting the loot items across the container.
List<ItemStack> containerList = table.fill(container, params, someSeed);
```

:::danger
`LootTable` は、さらに `#getRandomItemsRaw` というメソッドも公開しています。さまざまな `#getRandomItems` の形と異なり、`#getRandomItemsRaw` メソッドは[グローバルルートモディファイア][glm]を適用しません。このメソッドは、何をしているか理解している場合にのみ使ってください。
:::

## データ生成 {#datagen}

ルートテーブルは、`LootTableProvider` を登録し、そのコンストラクタで `LootTableSubProvider` のリストを渡すことで、[データ生成][datagen]できます。

```java
@SubscribeEvent // on the mod event bus
public static void onGatherData(GatherDataEvent event) {
    event.getGenerator().addProvider(
            event.includeServer(),
            output -> new MyLootTableProvider(
                    output,
                    // A set of required table resource locations. These are later verified to be present.
                    // It is generally not recommended for mods to validate existence,
                    // therefore we pass in an empty set.
                    Set.of(),
                    // A list of sub provider entries. See below for what values to use here.
                    List.of(...)
            )
    );
}
```

### `LootTableSubProvider` {#loottablesubproviders}

実際の生成は `LootTableSubProvider` で行われます。まず、`LootTableSubProvider` を実装し、`#generate` をオーバーライドします。

```java
public class MyLootTableSubProvider implements LootTableSubProvider {
    // The parameter is provided by the lambda (see below). It can be stored and used to lookup other registry entries.
    public MyLootTableSubProvider(HolderLookup.Provider lookupProvider) {
        super(lookupProvider);
    }

    @Override
    public void generate(BiConsumer<ResourceKey<LootTable>, LootTable.Builder> consumer) {
        // LootTable.lootTable() returns a loot table builder we can add loot tables to.
        consumer.accept(
                ResourceKey.create(
                    Registries.LOOT_TABLE,
                    ResourceLocation.fromNamespaceAndPath(ExampleMod.MOD_ID, "example_loot_table")
                ),
                LootTable.lootTable()
                // Add a loot table-level loot function. This example uses a number provider (see below).
                .apply(SetItemCountFunction.setCount(ConstantValue.exactly(5)))
                // Add a loot pool.
                .withPool(LootPool.lootPool()
                        // Add a loot pool-level function, similar to above.
                        .apply(...)
                        // Add a loot pool-level condition. This example only rolls the pool if it is raining.
                        .when(WeatherCheck.weather().setRaining(true))
                // Set the amount of rolls and bonus rolls, respectively.
                // Both of these methods utilize a number provider.
                .setRolls(UniformGenerator.between(5, 9))
                .setBonusRolls(ConstantValue.exactly(1))
                // Add a loot entry. This example returns an item loot entry. See below for more loot entries.
                .add(LootItem.lootTableItem(Items.DIRT))
                )
        );
    }
}
```

ルートテーブルのサブプロバイダができたら、次のように、ルートのプロバイダのコンストラクタに追加します。

```java
super(output, Set.of(), List.of(
        new SubProviderEntry(
                // A reference to the sub provider's constructor.
                // This is a Function<HolderLookup.Provider, ? extends LootTableSubProvider>.
                MyLootTableSubProvider::new,
                // An associated loot context set. If you're unsure what to use, use empty.
                LootContextParamSets.EMPTY
        ),
// other sub providers here (if applicable)
));
```

### `BlockLootSubProvider`

`BlockLootSubProvider` は、よくあるブロックのルートテーブルを作るための多くのヘルパーを持つ、抽象的なヘルパークラスです。たとえば、単一の Item のドロップ( `#createSingleItemTable` )、テーブルを作る対象の Block 自身のドロップ( `#dropSelf` )、シルクタッチのときだけのドロップ( `#createSilkTouchOnlyTable` )、ハーフブロックのような Block のドロップ( `#createSlabItemTable` )などがあります。残念ながら、`BlockLootSubProvider` を Mod で使えるように準備するには、さらに定型コードが必要です。

```java
public class MyBlockLootSubProvider extends BlockLootSubProvider {
    // The constructor can be private if this class is an inner class of your loot table provider.
    // The parameter is provided by the lambda in the LootTableProvider's constructor.
    public MyBlockLootSubProvider(HolderLookup.Provider lookupProvider) {
        // The first parameter is a set of blocks we are creating loot tables for. Instead of hardcoding,
        // we use our block registry and just pass an empty set here.
        // The second parameter is the feature flag set, this will be the default flags
        // unless you are adding custom flags (which is beyond the scope of this article).
        super(Set.of(), FeatureFlags.DEFAULT_FLAGS, lookupProvider);
    }

    // The contents of this Iterable are used for validation.
    // We return an Iterable over our block registry's values here.
    @Override
    protected Iterable<Block> getKnownBlocks() {
        // The contents of our DeferredRegister.
        return MyRegistries.BLOCK_REGISTRY.getEntries()
                .stream()
                // Cast to Block here, otherwise it will be a ? extends Block and Java will complain.
                .map(e -> (Block) e.value())
                .toList();
    }

    // Actually add our loot tables.
    @Override
    protected void generate() {
        // Equivalent to calling add(MyBlocks.EXAMPLE_BLOCK.get(), createSingleItemTable(MyBlocks.EXAMPLE_BLOCK.get()));
        dropSelf(MyBlocks.EXAMPLE_BLOCK.get());
        // Add a table with a silk touch only loot table.
        add(MyBlocks.EXAMPLE_SILK_TOUCHABLE_BLOCK.get(),
                createSilkTouchOnlyTable(MyBlocks.EXAMPLE_SILK_TOUCHABLE_BLOCK.get()));
        // other loot table additions here
    }
}
```

そして、他のサブプロバイダと同じように、サブプロバイダをルートテーブルのプロバイダのコンストラクタに追加します。

```java
super(output, Set.of(), List.of(new SubProviderEntry(
        MyBlockLootTableSubProvider::new,
        LootContextParamSets.BLOCK // it makes sense to use BLOCK here
)));
```

### `EntityLootSubProvider`

`BlockLootSubProvider` と同様に、`EntityLootSubProvider` にも、エンティティのルートテーブルの生成のための多くのヘルパーがあります。また `BlockLootSubProvider` と同様に、プロバイダが認識するエンティティの `Stream<EntityType<?>>` を渡す必要があります( 先ほどの `Iterable<Block>` の代わりです )。全体として、実装は `BlockLootSubProvider` とよく似ていますが、Block について触れている部分がすべてエンティティタイプに置き換わります。

```java
public class MyEntityLootSubProvider extends EntityLootSubProvider {
    public MyEntityLootSubProvider(HolderLookup.Provider lookupProvider) {
        // Unlike with blocks, we do not provide a set of known entity types. Vanilla instead uses custom checks here.
        super(FeatureFlags.DEFAULT_FLAGS, lookupProvider);
    }

    // This class uses a Stream instead of an Iterable, so we need to adjust this slightly.
    @Override
    protected Stream<EntityType<?>> getKnownEntityTypes() {
        return MyRegistries.ENTITY_TYPES.getEntries()
                .stream()
                .map(e -> (EntityType<?>) e.value());
    }

    @Override
    protected void generate() {
        add(MyEntities.EXAMPLE_ENTITY.get(), LootTable.lootTable());
        // other loot table additions here
    }
}
```

そして再び、サブプロバイダをルートテーブルのプロバイダのコンストラクタに追加します。

```java
super(output, Set.of(), List.of(new SubProviderEntry(
        MyEntityLootTableSubProvider::new,
        LootContextParamSets.ENTITY
)));
```

[advancement]: ../advancements.md
[binomial]: https://en.wikipedia.org/wiki/Binomial_distribution
[conditions]: ../conditions.md
[context]: #loot-context
[customentry]: custom.md#custom-loot-entry-types
[customlevelbased]: custom.md#custom-level-based-values
[customnumber]: custom.md#custom-number-providers
[damagesource]: ../damagetypes.md#creating-and-using-damage-sources
[datagen]: ../../index.md#data-generation
[entry]: #loot-entry
[glm]: glm.md
[lootcondition]: lootconditions
[lootfunction]: lootfunctions
[parameters]: #loot-parameters
[raidherogifts]: ../datamaps/builtin.md#neoforgeraid_hero_gifts
[sides]: ../../../concepts/sides.md
[tags]: ../tags.md
