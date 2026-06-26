# Tasarım — Post-Commit Cache Invalidation ("option C")

**Tarih:** 2026-06-26
**Durum:** Tasarım onaylandı (kullanıcı), uygulama planı bekleniyor
**Kapsam:** `oksis-api` — MediatR pipeline + cache invalidation
**Karar:** Sarmalayıcı (decorator) yöntemi — `ICacheService`'i saran tek bir `TransactionAwareCacheService`; 34 handler/event-handler'ın HİÇBİRİ değişmez. İş sonunda otomatik git-commit YOK (kullanıcı manuel inceleyecek).

> Not: 2026-06-26'da önce "açık (explicit)" yöntem seçilmiş, sonra kullanıcı sarmalayıcıya döndü. Bu doküman sarmalayıcı kararını yansıtır.

---

## 1. Sorun (kök sebep)

Cache temizleyen handler'larda işlem yanlış sırada:

1. `_cache.RemoveAsync(...)` → cache temizlenir (handler içinde, **commit'ten ÖNCE**)
2. `TransactionBehavior` → `CommitAsync()` (handler'dan **SONRA**)

Aradaki pencerede (cache boş, DB hâlâ eski değer commit'lenmemiş) eşzamanlı bir `GET`:
cache miss → DB'den **eski** değeri okur → **eski** değeri cache'e geri yazar.

Sonuç: **invalidate-before-commit** yarışı → Redis'e bayat değer yapışır.
Redis TTL 3600s ve **sunucu restart'ını aşar** → kullanıcı kaydetse bile ekranda eski değer kalabilir.

**Etki alanı:** cache invalidate eden 34 çağrı (31 command handler + 3 event handler).
Daha önce A1.2 (Tatil Takvimi) ve A1.3 (Okul Ayarları) E2E'de canlı yakalandı; FE tarafında
`skipInvalidate` + tek-seferlik invalidate ile maskelendi ama kök sebep duruyor.

## 2. Çözüm (özet)

Sırayı tersine çevir: **önce commit, sonra cache temizle.** Cache temizleme işini commit
başarılı olana kadar beklet; rollback'te hiç yapma.

Kod tabanında bu işi yapan altyapı **zaten var**:
- `IPostCommitDispatcher` (scoped, request-başına) — `Enqueue(...)` + `RunPending()`.
- `PostCommitDispatchBehavior`, `TransactionBehavior`'ın **dışında** sarar; `next()` (commit dahil)
  başarılıysa `RunPending()` çağırır, exception'da (rollback) hiç çağırmaz.
- Şu an yalnız Hangfire job/notification enqueue'ları için kullanılıyor.

Cache invalidation'ı bu mevcut mekanizmaya bağlayacağız.

## 3. Mimari değişiklik

Pipeline sırası (DIŞTAN İÇE) değişmiyor:
```
... → PostCommitDispatchBehavior → TransactionBehavior → CachingBehavior → Handler
                                       (commit burada)
       (RunPendingAsync burada, commit'ten sonra)
```

### Parça 1 — PostCommitDispatcher'a async yetenek (zorunlu altyapı)

`Enqueue(Action)` senkron; `RemoveAsync` async. Sync-over-async (`.GetAwaiter().GetResult()`)
yasak → dispatcher async'e genişler:

- `IPostCommitDispatcher`:
  - **Korunur:** `void Enqueue(Action action)` (mevcut 3 Hangfire enqueuer aynen kullanır).
  - **Eklenir:** `void Enqueue(Func<CancellationToken, Task> action)`.
  - **Değişir:** `void RunPending()` → `Task RunPendingAsync(CancellationToken ct)`.
- `PostCommitDispatcher`: dahili kuyruk `List<Func<CancellationToken, Task>>`; sync `Enqueue(Action)`,
  içte `c => { action(); return Task.CompletedTask; }` olarak sarılır. `RunPendingAsync` her işi
  sırayla `await` eder; her işi ayrı `try/catch` ile yutar+log'lar (best-effort — başarısız cache
  temizliği HTTP yanıtını bozmamalı; RedisCacheService zaten RedisException'ı içte yutuyor).
- `PostCommitDispatchBehavior`: `dispatcher.RunPending()` → `await dispatcher.RunPendingAsync(ct)`.
- 2 mevcut test dosyası güncellenir: `PostCommitDispatcherTests`, `PostCommitDispatchBehaviorTests`.

### Parça 2 — TransactionAwareCacheService (decorator)

`ICacheService`'i saran tek yeni sınıf (Infrastructure). Yalnız invalidation metodlarını
(transaction farkıyla) erteler; okuma/yazma aynen geçer.

```csharp
sealed class TransactionAwareCacheService(
    ICacheService inner,                 // RedisCacheService
    IApplicationDbContext db,            // CurrentTransaction tespiti
    IPostCommitDispatcher dispatcher)    // commit sonrası kuyruk
    : ICacheService
{
    public Task RemoveAsync(string key, CancellationToken ct)
        => db.Database.CurrentTransaction is not null
            ? Defer(c => inner.RemoveAsync(key, c))
            : inner.RemoveAsync(key, ct);

    public Task RemoveByPrefixAsync(string prefix, CancellationToken ct)
        => db.Database.CurrentTransaction is not null
            ? Defer(c => inner.RemoveByPrefixAsync(prefix, c))
            : inner.RemoveByPrefixAsync(prefix, ct);

    private Task Defer(Func<CancellationToken, Task> action)
    {
        dispatcher.Enqueue(action);   // commit sonrası PostCommitDispatchBehavior boşaltır
        return Task.CompletedTask;
    }

    // Get/Set/Exists/BuildKey -> inner'a düz delege
}
```

### Parça 3 — DI bağlama

```csharp
// Redis varsa: concrete + decorator
services.AddScoped<RedisCacheService>();
services.AddScoped<ICacheService>(sp => new TransactionAwareCacheService(
    sp.GetRequiredService<RedisCacheService>(),
    sp.GetRequiredService<IApplicationDbContext>(),
    sp.GetRequiredService<IPostCommitDispatcher>()));
// Redis yoksa: NullCacheService (singleton) AYNEN — cache yok, bug yok, sarmalama gereksiz.
```

Handler/event-handler dosyaları: **0 değişiklik.** 34 invalidation yeri de şeffaf düzelir.

## 4. Neden tüm yerleri kapsar (decorator garantisi)

`PostCommitDispatchBehavior` her `Send`'i sardığından kuyruk, o isteğin sonunda (commit sonrası)
garanti boşalır. Decorator `CurrentTransaction` ile her çağrıda otomatik karar verir:

- **Transaction içindeki command/event handler çağrıları** (34 yerin tamamı) → otomatik ertelenir.
- **Transaction'sız çağrılar** (varsa) → hemen çalışır (eski davranış, doğru).
- **`SetAsync`/`GetAsync`/`ExistsAsync`** → her zaman düz geçer (invalidation değil; kapsam dışı,
  4 `SetAsync` yeri dahil).

Elle sınıflama gerekmez; karar runtime'da `CurrentTransaction`'a bakılarak verilir.

## 5. Edge-case'ler

| Durum | Davranış | Sonuç |
|-------|----------|-------|
| Transaction'sız komut | Pipeline yine `RunPendingAsync` çağırır → handler biter bitmez flush | Zararsız ✅ |
| Event-handler invalidate (4) | `SavedChangesAsync` içinde, transaction açıkken decorator erteler; scoped dispatcher → dıştaki behavior commit sonrası boşaltır | Düzelir ✅ |
| DI döngüsü | Decorator `IApplicationDbContext` enjekte eder; ApplicationDbContext ctor'da `ICacheService`'e bağlı DEĞİL (event handler'lar runtime publish ile çözülür) → ctor döngüsü yok (build/test doğrular) | Risk yok ✅ |
| Nested | Nested `ISender.Send` yok (konvansiyon); `IPublisher.Publish` pipeline'a yeniden girmez → erken flush yok | Risk yok ✅ |
| Rollback | `next()` exception → `RunPendingAsync` hiç çağrılmaz → kuyruk atılır (scoped dispatcher request'le yok olur) | İstenen ✅ |
| `SetAsync` (4 yer) | Kapsam dışı (invalidation değil, düşük risk) | Dokunulmaz |

## 6. Bilinen sınır (dürüst not)

Post-commit invalidation, yarış penceresini **kapanma ölçüsünde daraltır** ama teorik olarak %100
sıfırlamaz (commit ile post-commit removal arasında mikrosaniyelik bir pencere teoride kalır; TTL
onu sınırlar). Bu, sektörde kabul edilen "doğru" yaklaşımdır; mevcut invalidate-before-commit ise
garantili ve büyük bir penceredir. Net iyileşme.

## 7. Test stratejisi (TDD)

1. `PostCommitDispatcher` (async): sıra korunur; hata yutulur+log'lanır; `RunPendingAsync` await eder;
   tekrar çağrı no-op.
2. `PostCommitDispatchBehavior`: commit (next başarılı) → flush; rollback (next throw) → flush YOK.
3. `TransactionAwareCacheService` birim testleri:
   - `CurrentTransaction != null` → `RemoveAsync`/`RemoveByPrefixAsync` inner'ı HEMEN çağırmaz,
     dispatcher'a enqueue eder; flush sonrası inner çağrılır.
   - `CurrentTransaction == null` → inner hemen çağrılır.
   - `Get/Set/Exists/BuildKey` her zaman inner'a delege (transaction'dan bağımsız).
4. En az 1 entegrasyon testi: bir ayar update'inde cache removal'ın commit'ten SONRA olduğunu
   doğrula (mevcut bug'ı yakalayan kırmızı test → yeşil).

## 8. Kapsam dışı

- `SetAsync` çağrılarının transaction-farkındalığı (4 yer, ayrı/düşük-riskli konu; decorator düz geçirir).
- Handler/event-handler dosyalarında herhangi bir değişiklik (decorator sayesinde gerekmez).
- FE'deki mevcut `skipInvalidate` maskeleri (kök sebep kapanınca ileride sadeleştirilebilir; bu işin
  parçası değil).
