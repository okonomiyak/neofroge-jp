---
sidebar_position: 4
---
# SavedData {#saved-data}

Saved Data( SD )システムを使うと、レベルに追加のデータを保存できます。

_データが特定の BlockEntity、チャンク、エンティティに固有のものである場合は、代わりに[データアタッチメント](attachments)の使用を検討してください。_

## 宣言 {#declaration}

SD の実装はそれぞれ、`SavedData` クラスのサブタイプである必要があります。知っておくべき重要なメソッドが 2 つあります。

- `save`: 実装がレベルに NBT データを書き込めるようにします。
- `setDirty`: データを変更した後に呼び出す必要があるメソッドです。書き込むべき変更があることをゲームに通知します。呼び出さないと `#save` が呼ばれず、元のデータが変わらないままになります。

## レベルへの付与 {#attaching-to-a-level}

`SavedData` は、すべて動的にレベルに読み込まれ、付与されます。そのため、あるレベルで一度も作成されなければ、存在しません。

`SavedData` は `DimensionDataStorage` から作成・読み込みされます。これには、`ServerChunkCache#getDataStorage` か `ServerLevel#getDataStorage` を呼び出してアクセスできます。そこから `DimensionDataStorage#computeIfAbsent` を呼び出すと、SD のインスタンスを取得または作成できます。これは、SD の現在のインスタンスがあればそれを取得し、なければ新しいインスタンスを作成して、利用可能なすべてのデータを読み込みます。

`DimensionDataStorage#computeIfAbsent` は 2 つの引数を取ります。1 つ目は `SavedData.Factory` のインスタンスで、SD の新しいインスタンスを構築する Supplier と、NBT データを SD に読み込んでそれを返す関数からなります。2 つ目の引数は、実装したレベルの `data` フォルダ内に保存される `.dat` ファイルの名前です。名前は有効なファイル名である必要があり、`/` や `\` を含めることはできません。

たとえば、ネザーで「example」という名前の SD を作った場合、ファイルは `./<level_folder>/DIM-1/data/example.dat` に作成され、次のように実装されます。

```java
// In some saved data implementation
public class ExampleSavedData extends SavedData {

    // Create new instance of saved data
    public static ExampleSavedData create() {
        return new ExampleSavedData();
    }

    // Load existing instance of saved data
    public static ExampleSavedData load(CompoundTag tag, HolderLookup.Provider lookupProvider) {
        ExampleSavedData data = ExampleSavedData.create();
        // Load saved data
        return data;
    }

    @Override
    public CompoundTag save(CompoundTag tag, HolderLookup.Provider registries) {
        // Write data to tag
        return tag;
    }

    public void foo() {
        // Change data in saved data
        // Call set dirty if data changes
        this.setDirty();
    }
}

// In some method within the class
netherDataStorage.computeIfAbsent(new Factory<>(ExampleSavedData::create, ExampleSavedData::load), "example");
```

SD が特定のレベルに固有でない場合は、オーバーワールドに付与してください。オーバーワールドは `MinecraftServer#overworld` で取得できます。オーバーワールドは完全にアンロードされることのない唯一のディメンションなので、複数のレベルにまたがるデータを保存するのに最適です。
