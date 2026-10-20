---
sidebar_position: 1
---
# インタラクションパイプライン {#the-interaction-pipeline}

このページの目的は、プレイヤーが何かを右クリックしたときの、かなり複雑でわかりにくい処理を理解しやすくすること、そして、どこでどの結果をなぜ使うのかを明確にすることです。

## 右クリックすると何が起きるのか {#what-happens-when-i-right-click}

ワールドのどこかを右クリックすると、そのとき見ているものと手に持っている `ItemStack` に応じて、さまざまな処理が起きます。2 種類の結果型( 後述 )のいずれかを返すメソッドがいくつも呼ばれます。これらのメソッドのほとんどは、明示的な成功または明示的な失敗が返されると、パイプラインを中止します。読みやすさのため、以降ではこの「明示的な成功または明示的な失敗」を「確定的な結果」と呼びます。

- 右クリックとメインハンドで `InputEvent.InteractionKeyMappingTriggered` が発火されます。Event がキャンセルされると、パイプラインは終了します。
- いくつかの条件がチェックされます。たとえば、スペクテイターモードでないこと、メインハンドの `ItemStack` に必要なすべてのフィーチャーフラグが有効であることなどです。これらのチェックのうち 1 つでも失敗すると、パイプラインは終了します。
- 見ているものに応じて、異なる処理が起きます。
    - 手の届く範囲にあり、ワールドボーダーの外でないエンティティを見ている場合:
        - `PlayerInteractEvent.EntityInteractSpecific` が発火されます。Event がキャンセルされると、パイプラインは終了します。
        - **見ているエンティティに対して** `Entity#interactAt` が呼ばれます。確定的な結果を返すと、パイプラインは終了します。
            - 自分のエンティティに動作を追加したい場合は、このメソッドをオーバーライドしてください。バニラのエンティティに動作を追加したい場合は、Event を使ってください。
        - エンティティがインターフェース( たとえば村人の取引 GUI やチェスト付きトロッコの GUI )を開いた場合、パイプラインは終了します。
        - `PlayerInteractEvent.EntityInteract` が発火されます。Event がキャンセルされると、パイプラインは終了します。
        - **見ているエンティティに対して** `Entity#interact` が呼ばれます。確定的な結果を返すと、パイプラインは終了します。
            - 自分のエンティティに動作を追加したい場合は、このメソッドをオーバーライドしてください。バニラのエンティティに動作を追加したい場合は、Event を使ってください。
            - `Mob` では、`Entity#interact` のオーバーライドが、リードを付けることや、メインハンドの `ItemStack` がスポーンエッグのときに子どもをスポーンさせることなどを処理し、その後、モブ固有の処理を `Mob#mobInteract` に委ねます。`Entity#interact` の結果に関するルールは、ここでも同様に適用されます。
        - 見ているエンティティが `LivingEntity` の場合、メインハンドの `ItemStack` に対して `Item#interactLivingEntity` が呼ばれます。確定的な結果を返すと、パイプラインは終了します。
    - 手の届く範囲にあり、ワールドボーダーの外でない Block を見ている場合:
        - `PlayerInteractEvent.RightClickBlock` が発火されます。Event がキャンセルされると、パイプラインは終了します。この Event では、Block の使用または Item の使用だけを個別に拒否することもできます。
        - `IItemExtension#onItemUseFirst` が呼ばれます。確定的な結果を返すと、パイプラインは終了します。
        - プレイヤーがスニークしておらず、Event が Block の使用を拒否していない場合、`UseItemOnBlockEvent` が発火されます。Event がキャンセルされると、キャンセル時の結果が使われます。そうでなければ、`Block#useItemOn` が呼ばれます。確定的な結果を返すと、パイプラインは終了します。
        - `ItemInteractionResult` が `PASS_TO_DEFAULT_BLOCK_INTERACTION` で、実行している手がメインハンドの場合、`Block#useWithoutItem` が呼ばれます。確定的な結果を返すと、パイプラインは終了します。
        - Event が Item の使用を拒否していない場合、`Item#useOn` が呼ばれます。確定的な結果を返すと、パイプラインは終了します。
- `Item#use` が呼ばれます。確定的な結果を返すと、パイプラインは終了します。
- 上記の処理が、今度はメインハンドの代わりにオフハンドで、もう一度実行されます。

## 結果型 {#result-types}

結果には、`InteractionResult`、`ItemInteractionResult`、`InteractionResultHolder<T>` の 3 種類があります。ほとんどの場合は `InteractionResult` が使われます。`InteractionResultHolder<ItemStack>` を使うのは `Item#use` だけで、`ItemInteractionResult` を使うのは `BlockBehaviour#useItemOn` と `CauldronInteraction#interact` だけです。

`InteractionResult` は、`SUCCESS`、`CONSUME`、`CONSUME_PARTIAL`、`PASS`、`FAIL` の 5 つの値からなる enum です。さらに、サーバーでは `SUCCESS` を、クライアントでは `CONSUME` を返す `InteractionResult#sidedSuccess` メソッドもあります。

`InteractionResultHolder<T>` は、`InteractionResult` に `T` という追加のコンテキストを加えたラッパーです。`T` には何でも使えますが、99.99% の場合は `ItemStack` です。`InteractionResultHolder<T>` には、enum の各値に対応するラッパーメソッド( `#success`、`#consume`、`#pass`、`#fail` )と、サーバーでは `#success` を、クライアントでは `#consume` を呼び出す `#sidedSuccess` があります。

`ItemInteractionResult` は、Item を Block に対して使う場合専用の、`InteractionResult` に相当するものです。`SUCCESS`、`CONSUME`、`CONSUME_PARTIAL`、`PASS_TO_DEFAULT_BLOCK_INTERACTION`、`SKIP_DEFAULT_BLOCK_INTERACTION`、`FAIL` の 6 つの値からなる enum です。各 `ItemInteractionResult` は `#result` で `InteractionResult` に対応付けられます。`PASS_TO_DEFAULT_BLOCK_INTERACTION` と `SKIP_DEFAULT_BLOCK_INTERACTION` は、どちらも `InteractionResult#PASS` を表します。同様に、`ItemInteractionResult` にも `#sidedSucess` があります。

一般に、それぞれの値は次のような意味を持ちます。

- `InteractionResult#sidedSuccess`( 必要に応じて `InteractionResultHolder#sidedSuccess` / `ItemInteractionResult#sidedSucess` )は、操作を成功とみなし、腕を振らせたい場合に使います。パイプラインは終了します。
- `InteractionResult#SUCCESS`( 必要に応じて `InteractionResultHolder#success` / `ItemInteractionResult#SUCCESS` )は、操作を成功とみなし、腕を振らせたいが、それを一方の Side だけで行いたい場合に使います。何らかの理由で、もう一方の論理 Side で別の値を返したい場合にのみ使ってください。パイプラインは終了します。
- `InteractionResult#CONSUME`( 必要に応じて `InteractionResultHolder#consume` / `ItemInteractionResult#CONSUME` )は、操作を成功とみなすが、腕を振らせたくない場合に使います。パイプラインは終了します。
- `InteractionResult#CONSUME_PARTIAL` は `InteractionResult#CONSUME` とほぼ同じで、違いは [`Item#useOn`][itemuseon] での使い方だけです。
    - `ItemInteractionResult#CONSUME_PARTIAL` も、`BlockBehaviour#useItemOn` での使い方において同様です。
- `InteractionResult.FAIL`( 必要に応じて `InteractionResultHolder#fail` / `ItemInteractionResult#FAIL` )は、Item の機能を失敗とみなし、それ以上のインタラクションを行うべきでない場合に使います。パイプラインは終了します。どこでも使えますが、`Item#useOn` と `Item#use` 以外では慎重に使うべきです。多くの場合は、`InteractionResult.PASS` を使うほうが理にかなっています。
- `InteractionResult.PASS`( 必要に応じて `InteractionResultHolder#pass` )は、操作を成功とも失敗ともみなさない場合に使います。パイプラインは続行されます。これが( 特に指定がない限り )デフォルトの動作です。
    - `ItemInteractionResult#PASS_TO_DEFAULT_BLOCK_INTERACTION` は、メインハンドについて `BlockBehaviour#useWithoutItem` が呼ばれることを許可し、`#SKIP_DEFAULT_BLOCK_INTERACTION` はそのメソッドの実行自体を防ぎます。`#PASS_TO_DEFAULT_BLOCK_INTERACTION` が( 特に指定がない限り )デフォルトの動作です。

一部のメソッドには特別な動作や要件があり、以下の章で説明します。

## `IItemExtension#onItemUseFirst`

ここでは、`InteractionResult#sidedSuccess` と `InteractionResult.CONSUME` は効果がありません。ここで使うべきなのは `InteractionResult.SUCCESS`、`InteractionResult.FAIL`、`InteractionResult.PASS` のいずれかだけです。

## `Item#useOn`

操作を成功とみなすが、腕を振らせたくない、または `ITEM_USED` の統計ポイントを加算したくない場合は、`InteractionResult.CONSUME_PARTIAL` を使います。

## `Item#use`

戻り値の型が `InteractionResultHolder<ItemStack>` になるのは、ここだけです。`InteractionResultHolder<ItemStack>` に含まれる結果の `ItemStack` は、変化していれば、使用を開始したときの `ItemStack` を置き換えます。

`Item#use` のデフォルト実装は、Item が食べられ、かつプレイヤーがその Item を食べられる場合( 空腹であるか、その Item が常に食べられるため )は `InteractionResultHolder#consume` を、Item は食べられるがプレイヤーが食べられない場合は `InteractionResultHolder#fail` を、Item が食べられない場合は `InteractionResultHolder#pass` を返します。

メインハンドの処理中にここで `InteractionResultHolder#fail` を返すと、オフハンドの動作が実行されなくなります。オフハンドの動作を実行させたい場合( 通常はそうしたいはずです )は、代わりに `InteractionResultHolder#pass` を返してください。

[itemuseon]: #itemuseon
