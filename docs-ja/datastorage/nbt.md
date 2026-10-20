---
sidebar_position: 1
---
# Named Binary Tag ( NBT ) {#named-binary-tag-nbt}

NBT は、Minecraft のごく初期に Notch 自身が作ったフォーマットです。Minecraft のコードベース全体で、データの保存に広く使われています。

## 仕様 {#specification}

NBT の仕様は JSON の仕様と似ていますが、いくつか違いがあります。

- byte、short、long、float にはそれぞれ別の型があり、Java のコードでの書き方と同様に、それぞれ `b`、`s`、`l`、`f` の接尾辞を付けます。
    - double にも `d` の接尾辞を付けられますが、Java のコードと同様に必須ではありません。Java で整数に使える省略可能な `i` の接尾辞は使えません。
    - 接尾辞は大文字と小文字を区別しません。たとえば、`64b` と `64B`、`0.5F` と `0.5f` はそれぞれ同じです。
- 真偽値は存在せず、代わりに byte で表します。`true` は `1b`、`false` は `0b` になります。
    - 現在の実装では 0 以外の値はすべて `true` として扱われるため、`2b` も `true` として扱われます。
- NBT には `null` に相当するものがありません。
- キーを引用符で囲むかどうかは任意です。そのため、JSON のプロパティ `"duration": 20` は、NBT では `duration: 20` とも `"duration": 20` とも書けます。
- JSON でサブオブジェクトと呼ばれるものは、NBT では **compound タグ**( または単に compound )と呼ばれます。
- JSON と異なり、NBT のリストでは異なる型を混在させられません。リストの型は、最初の要素で決まるか、コードで定義されます。
    - ただし、リストのリストでは、異なる型のリストを混在させられます。そのため、1 つ目が文字列のリスト、2 つ目が byte のリストである、2 つのリストからなるリストは許可されます。
- リストとは異なる、特別な**配列**型があります。ただし、要素を角括弧で囲むというリストの形式に従います。配列型は 3 種類あります。
    - byte 配列。配列の先頭に `B;` を付けて表します。例: `[B;0b,30b]`
    - 整数配列。配列の先頭に `I;` を付けて表します。例: `[I;0,-300]`
    - long 配列。配列の先頭に `L;` を付けて表します。例: `[L;0l,240l]`
- リスト、配列、compound タグでは、末尾のカンマが許可されます。

## NBT ファイル {#nbt-files}

Minecraft は `.nbt` ファイルを多用しています。たとえば、[Datapack][datapack] の構造物ファイルです。リージョン( つまりチャンクの集まり )の内容を含むリージョンファイル( `.mca` )や、ゲームのさまざまな場所で使われる各種の `.dat` ファイルも NBT ファイルです。

NBT ファイルは通常 GZip で圧縮されています。そのためバイナリファイルであり、直接編集することはできません。

## コードでの NBT {#nbt-in-code}

JSON と同様に、すべての NBT オブジェクトは、それを囲むオブジェクトの子です。まずは 1 つ作ってみましょう。

```java
CompoundTag tag = new CompoundTag();
```

これで、そのタグにデータを入れられます。

```java
tag.putInt("Color", 0xffffff);
tag.putString("Level", "minecraft:overworld");
tag.putDouble("IAmRunningOutOfIdeasForNamesHere", 1d);
```

ここにはいくつかのヘルパーがあります。たとえば `putIntArray` には、`int[]` を受け取る標準の形に加えて、`List<Integer>` を受け取る便利なメソッドもあります。

もちろん、そのタグから値を取得することもできます。

```java
int color = tag.getInt("Color");
String level = tag.getString("Level");
double d = tag.getDouble("IAmRunningOutOfIdeasForNamesHere");
```

数値型は、存在しない場合は 0 を返します。文字列は、存在しない場合は `""` を返します。より複雑な型( リスト、配列、compound )は、存在しない場合に例外をスローします。

そのため、タグの要素が存在するかを確認して、安全策をとるとよいでしょう。

```java
boolean hasColor = tag.contains("Color");
boolean hasColorMoreExplicitly = tag.contains("Color", Tag.TAG_INT);
```

`TAG_INT` 定数は、すべてのタグ型の親インターフェースである `Tag` で定義されています。`CompoundTag` 以外のタグ型( たとえば `ByteTag` や `StringTag` )の多くはほぼ内部向けのものですが、もし出くわした場合は、`CompoundTag#get` と `#put` のメソッドで直接扱えます。

ただし、明らかな例外が 1 つあります。`ListTag` です。これの扱いは特殊で、`CompoundTag#getList` でリストタグを取得するときに、リストの型も指定する必要があります。たとえば、文字列のリストを取得するには次のようにします。

```java
ListTag list = tag.getList("SomeListHere", Tag.TAG_STRING);
```

同様に、`ListTag` を作成するときも、作成時にリストの型を指定する必要があります。

```java
ListTag list = new ListTag(List.of("Value1", "Value2"), Tag.TAG_STRING);
```

最後に、`CompoundTag` の中の `CompoundTag` を扱うには、`CompoundTag#get` と `#put` を直接使います。

```java
tag.put("Tag", new CompoundTag());
tag.get("Tag");
```

## NBT の用途 {#usages-of-nbt}

NBT は Minecraft の多くの場所で使われています。よくある例としては、[`BlockEntity`][blockentity] や `Entity` があります。

:::note
`ItemStack` では、NBT の使用は[データコンポーネント][datacomponents]によって抽象化されています。
:::

## 関連項目 {#see-also}

- [Minecraft Wiki の NBT フォーマット][nbtwiki]

[blockentity]: ../blockentities/index.md
[datapack]: ../resources/index.md#data
[datacomponents]: ../items/datacomponents.md
[nbtwiki]: https://minecraft.wiki/w/NBT_format
