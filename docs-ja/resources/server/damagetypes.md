# ダメージタイプとダメージソース {#damage-types--damage-sources}

ダメージタイプは、エンティティに与えるダメージの種類を表します。物理ダメージ、火のダメージ、溺れるダメージ、魔法のダメージ、奈落のダメージなどです。ダメージタイプによる区別は、さまざまな耐性( 例: ブレイズは火のダメージを受けない )、エンチャント( 例: 爆発耐性は爆発のダメージだけを防ぐ )など、多くの用途に使われます。

ダメージタイプは、言うなればダメージソースのテンプレートです。言い換えれば、ダメージソースはダメージタイプのインスタンスとみなせます。ダメージタイプはコード上では [`ResourceKey`][rk] として存在しますが、そのプロパティはすべてデータパックで定義されます。一方、ダメージソースは、データパックのファイルの値に基づいて、ゲームが必要に応じて作成します。ダメージソースは、攻撃したエンティティなどの追加のコンテキストを持てます。

## ダメージタイプの作成 {#creating-damage-types}

まず、独自の `DamageType` を作ります。`DamageType` は [Datapack Registry][dr] なので、新しい `DamageType` はコードで登録するのではなく、対応するファイルを追加すると自動で登録されます。ただし、コードからダメージソースを取得するための手がかりは用意する必要があります。そのために、[リソースキー][rk]を指定します。

```java
public static final ResourceKey<DamageType> EXAMPLE_DAMAGE =
        ResourceKey.create(Registries.DAMAGE_TYPE, ResourceLocation.fromNamespaceAndPath(ExampleMod.MOD_ID, "example"));
```

コードから参照できるようになったので、データファイルでいくつかのプロパティを指定しましょう。データファイルは `data/examplemod/damage_type/example.json` に置き( `examplemod` と `example` は、Mod ID とリソースロケーションの名前に置き換えてください )、次の内容を含めます。

```json5
{
    // The death message id of the damage type. The full death message translation key will be
    // "death.examplemod.example" (with swapped-out mod ids and names).
    "message_id": "example",
    // Whether this damage type's damage amount scales with difficulty or not. Valid vanilla values are:
    // - "never": The damage value remains the same on any difficulty. Common for player-caused damage types.
    // - "when_caused_by_living_non_player": The damage value is scaled if the entity is caused by a
    //   living entity of some sort, including indirectly (e.g. an arrow shot by a skeleton), that is not a player.
    // - "always": The damage value is always scaled. Commonly used by explosion-like damage.
    "scaling": "when_caused_by_living_non_player",
    // The amount of exhaustion caused by receiving this kind of damage.
    "exhaustion": 0.1,
    // The damage effects (currently only sound effects) that are applied when receiving this kind of damage. Optional.
    // Valid vanilla values are "hurt" (default), "thorns", "drowning", "burning", "poking", and "freezing".
    "effects": "hurt",
    // The death message type. Determines how the death message is built. Optional.
    // Valid vanilla values are "default" (default), "fall_variants", and "intentional_game_design".
    "death_message_type": "default"
}
```

:::tip
`scaling`、`effects`、`death_message_type` のフィールドは、内部でそれぞれ enum の `DamageScaling`、`DamageEffects`、`DeathMessageType` によって制御されています。必要に応じて、これらの enum を[拡張][extenum]して独自の値を追加できます。
:::

同じ形式はバニラのダメージタイプにも使われており、パック制作者は必要に応じてこれらの値を変更できます。
 
## ダメージソースの作成と使用 {#creating-and-using-damage-sources}

`DamageSource` は通常、`Entity#hurt` を呼び出すときにその場で作成します。ダメージタイプは [Datapack Registry][dr] なので、問い合わせるには `RegistryAccess` が必要な点に注意してください。これは `Level#registryAccess` で取得できます。`DamageSource` を作成するには、最大 4 つの引数を渡して `DamageSource` のコンストラクタを呼び出します。

```java
DamageSource damageSource = new DamageSource(
        // The damage type holder to use. Query from the registry. This is the only required parameter.
        registryAccess.registryOrThrow(Registries.DAMAGE_TYPE).getHolderOrThrow(EXAMPLE_DAMAGE),
        // The direct entity. For example, if a skeleton shot you, the skeleton would be the causing entity
        // (= the parameter above), and the arrow would be the direct entity (= this parameter). Similar to
        // the causing entity, this isn't always applicable and therefore nullable. Optional, defaults to null.
        null,
        // The entity causing the damage. This isn't always applicable (e.g. when falling out of the world)
        // and may therefore be null. Optional, defaults to null.
        null,
        // The damage source position. This is rarely used, one example would be intentional game design
        // (= nether beds exploding). Nullable and optional, defaulting to null.
        null
);
```

:::warning
`new DamageSource` のラッパーである `DamageSources#source` では、2 つ目と 3 つ目の引数( 直接のエンティティと原因のエンティティ )の順序が逆になっています。正しい引数に正しい値を渡していることを確認してください。
:::

`DamageSource` がエンティティや位置のコンテキストをまったく持たない場合は、フィールドにキャッシュするのが理にかなっています。エンティティや位置のコンテキストを持つ `DamageSource` については、次のようにヘルパーメソッドを追加するのが一般的です。

```java
public static DamageSource exampleDamage(Entity causer) {
    return new DamageSource(
            causer.level().registryAccess().registryOrThrow(Registries.DAMAGE_TYPE).getHolderOrThrow(EXAMPLE_DAMAGE),
            causer);
}
```

:::tip
バニラの `DamageSource` のファクトリは `DamageSources` に、バニラの `DamageType` のリソースキーは `DamageTypes` にあります。
:::

ダメージソースの最も主要な用途は `Entity#hurt` です。このメソッドは、エンティティがダメージを受けるたびに呼ばれます。独自のダメージタイプでエンティティにダメージを与えるには、自分で `Entity#hurt` を呼び出すだけです。

```java
// The second parameter is the amount of damage, in half hearts.
entity.hurt(exampleDamage(player), 10);
```

無敵のチェックなど、ダメージタイプに固有のその他の動作は、多くの場合ダメージタイプの[タグ][tags]を通じて行われます。タグは Minecraft と NeoForge の両方が追加しており、それぞれ `DamageTypeTags` と `Tags.DamageTypes` にあります。

## データ生成 {#datagen}

_詳しくは、[Datapack Registry のデータ生成][drdatagen]を参照してください。_

ダメージタイプの JSON ファイルは[データ生成][datagen]できます。ダメージタイプは Datapack Registry なので、`GatherDataEvent` に `DatapackBuiltinEntriesProvider` を追加し、ダメージタイプを `RegistrySetBuilder` に入れます。

```java
// In your datagen class
@SubscribeEvent // on the mod event bus
public static void onGatherData(GatherDataEvent event) {
    CompletableFuture<HolderLookup.Provider> lookupProvider = event.getLookupProvider();
    event.getGenerator().addProvider(
            event.includeServer(),
            output -> new DatapackBuiltinEntriesProvider(output, lookupProvider, new RegistrySetBuilder()
                    // Add a datapack builtin entry provider for damage types. If this lambda becomes longer,
                    // this should probably be extracted into a separate method for the sake of readability.
                    .add(Registries.DAMAGE_TYPE, bootstrap -> {
                        // Use new DamageType() to create an in-code representation of a damage type.
                        // The parameters map to the values of the JSON file, in the order seen above.
                        // All parameters except for the message id and the exhaustion value are optional.
                        bootstrap.register(EXAMPLE_DAMAGE, new DamageType(EXAMPLE_DAMAGE.location(),
                                DamageScaling.WHEN_CAUSED_BY_LIVING_NON_PLAYER,
                                0.1f,
                                DamageEffects.HURT,
                                DeathMessageType.DEFAULT))
                    })
                    // Add datapack providers for other datapack entries, if applicable.
                    .add(...),
                    Set.of(ExampleMod.MOD_ID)
            )
    );
}
```

[datagen]: ../index.md#data-generation
[dr]: ../../concepts/registries.md#datapack-registries
[drdatagen]: ../../concepts/registries.md#data-generation-for-datapack-registries
[extenum]: ../../advanced/extensibleenums.md
[rk]: ../../misc/resourcelocation.md#resourcekeys
[tags]: tags.md
