# 用語集

翻訳で使う訳語の一覧です。訳す前に必ず参照し、新しい用語は追記します。

## 表記ルール

- 本文の括弧は、内側にスペースを入れる。例: `( あ )`。コードブロック、インラインコード、リンク先は対象外。
- listen は英語のまま使う。例: `Event を listen する`。
- リンク直後の括弧は、リンク記法と誤認されないよう全角括弧 `（ ）` にする。

## 英語のまま残す用語

DeferredRegister, Registry, Event, EventBus, BlockEntity, Item, Block, Mixin, Access Transformer, Datapack, Side, Dist, ModContainer

## 訳語

| 原語 | 訳語 |
|------|------|
| mod | Mod |
| mod id | Mod ID |
| group id | Group ID |
| mod loader | Mod ローダー |
| language loader | 言語ローダー |
| mod list ( screen ) | Mod 一覧( 画面 ) |
| main mod class | メイン Mod クラス |
| entrypoint | エントリポイント |
| workspace | ワークスペース |
| dependency | 依存関係 / 依存先 |
| run configuration | 実行構成 |
| source set | ソースセット |
| dedicated server | 専用サーバー |
| physical side / physical client | 物理 Side / 物理クライアント |
| client-only | クライアント専用 |
| side ( 一般名詞として ) | Side |
| event bus / mod-specific event bus | EventBus / Mod 固有の EventBus |
| event listener | Event リスナー |
| registry / registries | Registry |
| data generation ( datagen ) | データ生成 |
| resource pack | リソースパック |
| data pack( メニュー名・パック名の文脈 ) | データパック |
| datapack( Mod として配布するもの ) | Datapack |
| resource files | リソースファイル |
| namespace | 名前空間 |
| property / properties | プロパティ |
| mandatory | 必須 |
| default | デフォルト |
| nothing( 表のデフォルト値 ) | なし |
| array of tables ( TOML ) | テーブルの配列 |
| table ( TOML ) | テーブル |
| multiline literal string | 複数行リテラル文字列 |
| header ( TOML ) | ヘッダー |
| feature ( mods.toml の features ) | フィーチャー |
| update checker | アップデートチェッカー |
| enum extension | enum の拡張 |
| packaging | パッケージ構成 |
| top-level package | トップレベルパッケージ |
| subpackage | サブパッケージ |
| naming convention / naming scheme | 命名規則 |
| versioning | バージョン / バージョン方式 |
| semantic versioning ( semver ) | セマンティックバージョニング ( semver ) |
| major / minor / patch version | メジャー / マイナー / パッチバージョン |
| bump ( version ) | ( バージョンを )上げる |
| snapshot | スナップショット |
| pre-release | プレリリース |
| release candidate | リリース候補 |
| Maven Version Range | Maven のバージョン範囲 |
| bugfix | バグ修正 |
| at the time of writing | 執筆時点で |
| throw ( exception ) | スローする |
| annotation | アノテーション |
| constructor | コンストラクタ |
| fully-qualified name | 完全修飾名 |
| tooltip | ツールチップ |
| crash | クラッシュする |
| logical side / logical client / logical server | 論理 Side / 論理クライアント / 論理サーバー |
| physical server | 物理サーバー |
| render thread | レンダースレッド |
| event handler | Event ハンドラ |
| fire ( an event ) | ( Event を )発火する |
| post ( an event on a bus ) | ( バスに )投稿する |
| subscribe / listen to | 登録する / listen する |
| game bus / mod bus / main bus | ゲームバス / Mod バス / メインバス |
| mod event bus | Mod の EventBus |
| lifecycle event | ライフサイクル Event |
| cancellable event | キャンセル可能な Event |
| priority | 優先度 |
| sided | Side 別の |
| registration | 登録 |
| registry name / registry entry / registry key | Registry 名 / Registry エントリ / Registry キー |
| root registry | ルート Registry |
| custom registry | カスタム Registry |
| datapack registry | Datapack Registry |
| data provider | データプロバイダ |
| query ( a registry ) | 問い合わせる |
| vanilla | バニラ |
| modded | Mod の |
| level | レベル |
| entity | エンティティ |
| tick | tick |
| desynchronization | 非同期 |
| serialize / deserialize | シリアライズ / デシリアライズ |
| blockstate / block state | ブロックステート |
| blockstate property | ブロックステートのプロパティ |
| default state | デフォルトの状態 |
| update flags | 更新フラグ |
| block type | Block タイプ |
| block entity type | BlockEntity タイプ |
| block item | `BlockItem`( コード名のまま ) |
| pipeline | パイプライン |
| ticking / ticker | tick 処理 / ティッカー |
| scheduled tick / random tick | スケジュールされた tick / ランダム tick |
| feature flag | フィーチャーフラグ |
| world border | ワールドボーダー |
| drop ( items ) | ドロップ |
| harvest | 収穫 |
| destroy progress | 破壊進行度 |
| sync / syncing | 同期 |
| update tag / update packet | 更新タグ / 更新パケット |
| dirty ( chunk ) | ダーティ |
| data attachment | データアタッチメント |
| block entity renderer ( BER ) | BlockEntityRenderer ( BER ) |
| ( static ) baked model | ( 静的な )ベイク済みモデル |
| immutable | イミュータブル( 不変 ) |
| networking | ネットワーク |
| item stack | アイテムスタック |
| item entity | アイテムエンティティ |
| data component | データコンポーネント |
| component map / component holder | コンポーネントマップ / コンポーネントホルダー |
| prototype / patch map | プロトタイプ / パッチマップ |
| durability | 耐久値 |
| max stack size | 最大スタック数 |
| crafting remainder | クラフト後の残り |
| rarity | レア度 |
| food / nutrition / saturation | 食べ物 / 満腹度 / 隠し満腹度 |
| creative tab | クリエイティブタブ |
| mutable / mutability | ミュータブル( 可変 ) / 可変性 |
| interaction pipeline | インタラクションパイプライン |
| definitive result | 確定的な結果 |
| main hand / off hand | メインハンド / オフハンド |
| tool set / tier | 道具のセット / ティア( コード上は `Tier` ) |
| item ability | `ItemAbility`( コード名のまま ) |
| armor material | 防具の素材( コード上は `ArmorMaterial` ) |
| attribute modifier | 属性修飾子 |
| mob effect / instant effect | モブ効果 / 即時効果 |
| amplifier | 増幅値 |
| potion item | ポーション系 Item |
| brewing | 醸造 |
| compound tag | compound タグ |
| saved data | SavedData( 見出し )/ SD |
| attachment type | アタッチメントタイプ |
| serializer | シリアライザ |
| persist | 永続化する |
| codec | Codec |
| encode / decode | エンコード / デコード |
| lookup provider | ルックアッププロバイダ |
| record ( codec ) | レコード( Codec ) |
| transformer ( codec ) | 変換 |
| range codec | 範囲 Codec |
| string resolver | 文字列リゾルバ |
| lazy initialized | 遅延初期化 |
| dispatch ( codec ) | ディスパッチ |
| primitive | プリミティブ |
| overworld / nether / the end | オーバーワールド / ネザー / ジ・エンド |
| menu / menu type | メニュー / メニューのタイプ( コード上は `MenuType` ) |
| data holder | データホルダー |
| container id | コンテナ ID |
| slot / data slot | スロット / データスロット |
| hotbar | ホットバー |
| quick move ( shift-click ) | クイック移動( Shift クリック ) |
| screen | 画面 |
| container screen | コンテナ画面 |
| widget | ウィジェット |
| relative coordinates | 相対座標 |
| colored rectangle | 色付きの矩形 |
| blit / blit offset | ブリット / ブリットオフセット |
| sprite / texture atlas | スプライト / テクスチャアトラス |
| tooltip | ツールチップ |
| narration | ナレーション |
| focus | フォーカス |
| teardown | 後片付け |
| container | コンテナ( コード上は `Container` ) |
| equipment slot | 装備スロット |
| capability | capability( 英語のまま ) |
| capability provider | capability プロバイダ |
| invalidate / invalidation | 無効化する / 無効化 |
| automation-accessible | 自動化でアクセスできる |
| payload | ペイロード |
| registrar | レジストラ |
| play phase / configuration phase | プレイフェーズ / コンフィギュレーションフェーズ |
| configuration task | コンフィギュレーションタスク |
| acknowledge ( a task ) | 完了を通知する |
| main thread / network thread | メインスレッド / ネットワークスレッド |
| bundle packet | バンドルパケット |
| data parameter | データパラメータ |
| stream codec | ストリームコーデック |
| buffer | バッファ |
| trusted tag | 信頼済みタグ |
| member encoder | メンバーエンコーダ |
| composite | 複合 |
| id mapper | ID マッパー |
| holder / holder set | ホルダー / ホルダーセット |
| resource location | リソースロケーション( コード上は `ResourceLocation` ) |
| variant ( model ) | バリアント |
| intern | インターン化する |
| debug profiler | デバッグプロファイラ |
| update checker / changelog | アップデートチェッカー / 変更履歴 |
| configuration ( config ) | コンフィグ |
| config screen | コンフィグ画面 |
| validator | バリデータ |
| key mapping / key binding | キー割り当て / キーバインド |
| conflict context | 競合コンテキスト |
| modifier key | 修飾キー |
| game test | ゲームテスト |
| structure template / structure block | 構造物テンプレート / ストラクチャーブロック |
| assertion | アサーション |
| batch | バッチ |
| buildscript | ビルドスクリプト |
| access modifier | アクセス修飾子 |
| directive | ディレクティブ |
| descriptor / method descriptor | ディスクリプタ / メソッドディスクリプタ |
| inner class | 内部クラス |
| extensible enum | 拡張可能な enum |
| ordinal | 序数 |
| transformer ( bytecode ) | トランスフォーマー |
| biome modifier | バイオームモディファイア |
| feature / placed feature | フィーチャー / `PlacedFeature` |
| feature cycle violation | フィーチャーサイクル違反 |
| spawn weight / spawn cost / spawn restriction | スポーンの重み / スポーンコスト / スポーン制限 |
| carver ( legacy carver ) | カーバー( レガシーカーバー ) |
| decoration step | 装飾ステップ |
| phase | フェーズ |
| assets / data | アセット / データ |
| resource pack / data pack | リソースパック / データパック( Datapack ) |
| data generator / datagen | データジェネレーター / データ生成 |
| command line argument | コマンドライン引数 |
| component ( text ) | コンポーネント( コード上は `Component` ) |
| style / text formatting | スタイル / テキストの書式 |
| language file / translation key | 言語ファイル / 翻訳キー |
| animated texture | アニメーションテクスチャ |
| particle / particle description | パーティクル / パーティクルの記述 |
| particle provider | パーティクルプロバイダ |
| sound event / sound category / sound definition | サウンドイベント / サウンドカテゴリ / サウンド定義 |
| attenuation | 減衰 |
| merge | マージ |
| model / item model / block model | モデル / アイテムモデル / ブロックモデル |
| parent ( model ) | 親モデル |
| element ( model ) | 要素 |
| render type | 描画タイプ |
| ambient occlusion | アンビエントオクルージョン |
| mipmapping | ミップマップ |
| tint / tint index / color handler | 着色 / 着色インデックス / カラーハンドラ |
| override ( item model ) | オーバーライド |
| root transform | ルート変換 |
| perspective | 視点 |
| quad | 四角形 |
| baked model | ベイク済みモデル |
| custom model loader | カスタムモデルローダー |
| geometry | ジオメトリ |
| composite model | 複合モデル |
| damage type / damage source | ダメージタイプ / ダメージソース |
| tag / tag provider | タグ / タグプロバイダ |
| advancement / advancement tree / root advancement | 進捗 / 進捗ツリー / ルート進捗 |
| criterion / criteria trigger | 条件 / 条件のトリガー |
| toast | トースト通知 |
| data load condition | データの読み込み条件 |
| data map | データマップ |
| merger / remover ( data map ) | マージャー / リムーバー |
| enchantment | エンチャント |
| enchantment effect component | エンチャント効果コンポーネント |
| enchantability | エンチャント適性 |
| value effect / location based effect / entity effect | 値の効果 / 位置に基づく効果 / エンティティの効果 |
| enchantment names | 日本語版 Minecraft の名称に合わせる( 例: Sharpness → ダメージ増加、Mending → 修繕 ) |
| loot table / loot pool / loot entry | ルートテーブル / ルートプール / ルートエントリ |
| loot condition / loot function | ルート条件 / ルート関数 |
| number provider | 数値プロバイダ |
| loot parameter / loot context / loot context param set | ルートパラメータ / ルートコンテキスト / ルートコンテキストのパラメータセット |
| global loot modifier ( GLM ) | グローバルルートモディファイア( GLM ) |
