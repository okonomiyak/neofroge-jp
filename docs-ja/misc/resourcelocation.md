# リソースロケーション {#resource-locations}

`ResourceLocation` は、Minecraft で最も重要なものの一つです。[Registry][registries] のキー、データファイルやリソースファイルの識別子、コード内でのモデルの参照など、多くの場所で使われます。`ResourceLocation` は、`:` で区切られた名前空間とパスの 2 つの部分からなります。

名前空間は、その場所がどの Mod、リソースパック、Datapack を指すかを表します。たとえば、Mod ID が `examplemod` の Mod は、`examplemod` 名前空間を使います。Minecraft は `minecraft` 名前空間を使います。対応するデータフォルダを作るだけで、追加の名前空間を自由に定義できます。これは通常、Datapack が、自身のロジックをバニラと連携する部分から分けておくために行います。

パスは、名前空間の中にある、目的のオブジェクトへの参照です。たとえば `minecraft:cow` は、`minecraft` 名前空間にある `cow` という名前の何かへの参照です。通常、この場所はエンティティの Registry から牛のエンティティを取得するのに使われます。別の例として `examplemod:example_item` は、おそらく Item の Registry から Mod の `example_item` を取得するのに使われます。

`ResourceLocation` に使えるのは、小文字の英字、数字、アンダースコア、ドット、ハイフンだけです。パスには、さらにスラッシュも使えます。Java のモジュールの制約により、Mod ID にはハイフンを使えない点に注意してください。したがって、Mod の名前空間にもハイフンは使えません( パスでは引き続き使えます )。

:::info
`ResourceLocation` 自体は、それをどんな種類のオブジェクトに使っているかについて何も示しません。たとえば、`minecraft:dirt` という名前のオブジェクトは複数の場所に存在します。`ResourceLocation` にオブジェクトを対応付けるのは、それを受け取る側の役割です。
:::

新しい `ResourceLocation` は、`ResourceLocation.fromNamespaceAndPath("examplemod", "example_item")` または `ResourceLocation.parse("examplemod:example_item")` を呼び出して作成できます。`withDefaultNamespace` を使うと、文字列がパスとして、`minecraft` が名前空間として使われます。たとえば、`ResourceLocation.withDefaultNamespace("example_item")` は `minecraft:example_item` になります。

`ResourceLocation` の名前空間とパスは、それぞれ `ResourceLocation#getNamespace()` と `#getPath()` で取得でき、結合した形は `ResourceLocation#toString` で取得できます。

`ResourceLocation` はイミュータブルです。`withPrefix` や `withSuffix` など、`ResourceLocation` のユーティリティメソッドは、すべて新しい `ResourceLocation` を返します。

## `ResourceLocation` の解決 {#resolving-resourcelocations}

Registry など一部の場所では、`ResourceLocation` を直接使います。一方、必要に応じて `ResourceLocation` を解決する場所もあります。例:

- `ResourceLocation` は、GUI の背景の識別子として使われます。たとえば、かまどの GUI は `minecraft:textures/gui/container/furnace.png` というリソースロケーションを使います。これは、ディスク上の `assets/minecraft/textures/gui/container/furnace.png` ファイルに対応します。このリソースロケーションでは `.png` の接尾辞が必要な点に注意してください。
- `ResourceLocation` は、ブロックモデルの識別子として使われます。たとえば、土のブロックモデルは `minecraft:block/dirt` というリソースロケーションを使います。これは、ディスク上の `assets/minecraft/models/block/dirt.json` ファイルに対応します。ここでは `.json` の接尾辞は不要な点に注意してください。また、このリソースロケーションは自動的に `models` サブフォルダに対応付けられる点にも注意してください。
- `ResourceLocation` は、レシピの識別子として使われます。たとえば、鉄ブロックのクラフトレシピは `minecraft:iron_block` というリソースロケーションを使います。これは、ディスク上の `data/minecraft/recipe/iron_block.json` ファイルに対応します。ここでは `.json` の接尾辞は不要な点に注意してください。また、このリソースロケーションは自動的に `recipe` サブフォルダに対応付けられる点にも注意してください。

`ResourceLocation` にファイルの接尾辞が必要かどうかや、リソースロケーションが具体的に何に解決されるかは、用途によって異なります。

## `ModelResourceLocation` {#modelresourcelocations}

`ModelResourceLocation` は特殊なリソースロケーションで、バリアントと呼ばれる 3 つ目の部分を含みます。Minecraft は主に、モデルの異なるバリアントを区別するためにこれを使います。異なるバリアントは、異なる表示の場面で使われます( たとえば、一人称視点、三人称視点、インベントリで異なるモデルを持つトライデントなど )。バリアントは、Item では常に `inventory`、ブロックステートではプロパティと値の組をカンマで区切った文字列です( 例: `facing=north,waterlogged=false`。ブロックステートのプロパティを持たない Block では空です )。

バリアントは、`#` とともに通常のリソースロケーションの後ろに付け加えられます。たとえば、ダイヤモンドの剣のアイテムモデルの完全な名前は `minecraft:diamond_sword#inventory` です。ただし、ほとんどの場面では `inventory` バリアントを省略できます。

`ModelResourceLocation` は[クライアント専用][sides]のクラスです。つまり、このクラスを参照するサーバーは `NoClassDefFoundError` でクラッシュします。

## `ResourceKey` {#resourcekeys}

`ResourceKey` は、Registry の ID と Registry 名を組み合わせたものです。たとえば、Registry の ID が `minecraft:item`、Registry 名が `minecraft:diamond_sword` の Registry キーがあります。`ResourceLocation` と異なり、`ResourceKey` は実際に一意の要素を指すため、要素を明確に識別できます。最もよく使われるのは、多くの異なる Registry が互いに関わり合う場面です。よくある用途は Datapack、特に worldgen です。

新しい `ResourceKey` は、static メソッド `ResourceKey#create(ResourceKey<? extends Registry<T>>, ResourceLocation)` で作成できます。2 つ目の引数は Registry 名で、1 つ目の引数は Registry キーと呼ばれるものです。Registry キーは特殊な `ResourceKey` で、その Registry はルート Registry( つまり、他のすべての Registry の Registry )です。Registry キーは、目的の Registry の ID を渡して `ResourceKey#createRegistryKey(ResourceLocation)` で作成できます。

`ResourceKey` は作成時にインターン化されます。つまり、参照の等価性( `==` )で比較でき、そうすることが推奨されますが、作成のコストは比較的高くなります。

[registries]: ../concepts/registries.md
[sides]: ../concepts/sides.md
