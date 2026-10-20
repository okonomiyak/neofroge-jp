# テクスチャ {#textures}

Minecraft のテクスチャはすべて PNG ファイルで、名前空間の `textures` フォルダの中に置かれます。JPG、GIF などの画像形式はサポートされていません。テクスチャを指す[リソースロケーション][rl]のパスは、一般に `textures` フォルダからの相対パスです。たとえば、リソースロケーション `examplemod:block/example_block` は、`assets/examplemod/textures/block/example_block.png` にあるテクスチャファイルを指します。

テクスチャのサイズは、一般に 16x16 や 32x32 のような 2 のべき乗にしてください。古いバージョンと異なり、現在の Minecraft は、16x16 より大きい Block や Item のテクスチャをネイティブにサポートしています。2 のべき乗でないテクスチャを自分で描画する場合( たとえば GUI の背景 )は、次に大きい 2 のべき乗のサイズ( 多くは 256x256 )の空のファイルを作り、その左上にテクスチャを置いて、残りは空のままにしてください。描画するテクスチャの実際のサイズは、そのテクスチャを使うコードで設定できます。

## テクスチャのメタデータ {#texture-metadata}

テクスチャのメタデータは、テクスチャとまったく同じ名前に `.mcmeta` の接尾辞を付けたファイルで指定できます。たとえば、`textures/block/example.png` にあるアニメーションテクスチャには、`textures/block/example.png.mcmeta` というファイルを添える必要があります。`.mcmeta` ファイルの形式は次のとおりです( すべて任意 )。

```json5
{
    // Whether the texture will be blurred if needed. Defaults to false.
    // Currently specified by the codec, but unused otherwise both in the files and in code.
    "blur": true,
    // Whether the texture will be clamped if needed. Defaults to false.
    // Currently specified by the codec, but unused otherwise both in the files and in code.
    "clamp": true,
    "gui": {
        // Specifies how the texture will be scaled if needed. Can be one of these three:
        "scaling": {
            "type": "stretch" // default
        },
        "scaling": {
            "type": "tile",
            "width": 16,
            "height": 16
        },
        "scaling": {
            // Like "tile", but allows specifying the border offsets.
            "type": "nine_slice",
            "width": 16,
            "height": 16,
            // May also be a single int that is used as the value for all four sides.
            "border": {
                "left": 0,
                "top": 0,
                "right": 0,
                "bottom": 0
            }
        }
    },
    // See below.
    "animation": {}
}
```

## アニメーションテクスチャ {#animated-textures}

Minecraft は、Block と Item のアニメーションテクスチャをネイティブにサポートしています。アニメーションテクスチャは、アニメーションの各段階を縦に並べた 1 つのテクスチャファイルからなります( たとえば、8 段階ある 16x16 のアニメーションテクスチャは、16x128 の PNG ファイルで表します )。

歪んだテクスチャとして表示されるのではなく、実際にアニメーションさせるには、テクスチャのメタデータに `animation` オブジェクトが必要です。このサブオブジェクトは空でもかまいませんが、次の任意の項目を含めることもできます。

```json5
{
    "animation": {
        // A custom order in which the frames are played. If omitted, the frames are played top to bottom.
        "frames": [1, 0],
        // How long one frame stays before switching to the next animation stage, in frames. Defaults to 1.
        "frametime": 5,
        // Whether to interpolate between animation stages. Defaults to false.
        "interpolate": true,
        // Width and height of one animation stage. If omitted, uses the texture width for both of these.
        "width": 12,
        "height": 12
    }
}
```

[rl]: ../../misc/resourcelocation.md
