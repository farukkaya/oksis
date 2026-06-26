# Post-Commit Cache Invalidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cache invalidation'ı (`RemoveAsync`/`RemoveByPrefixAsync`) transaction commit'inden SONRAYA erteleyerek "invalidate-before-commit" Redis bayat-cache yarışını kapatmak.

**Architecture:** `ICacheService`'i saran tek bir `TransactionAwareCacheService` (decorator); aktif transaction varsa silmeyi mevcut `IPostCommitDispatcher` kuyruğuna alır (commit sonrası `PostCommitDispatchBehavior` boşaltır), yoksa hemen yapar. Dispatcher async iş alacak şekilde genişletilir. 34 handler/event-handler değişmez.

**Tech Stack:** .NET 10 / C# · MediatR pipeline behaviors · EF Core 10 (`DatabaseFacade.CurrentTransaction`) · StackExchange.Redis · xUnit + FluentAssertions + NSubstitute · Testcontainers MSSQL (integration).

## Global Constraints

- Commit formatı (OKSİS): `YYYY-MM-DD <type>[,type]: Türkçe özet.` — örn. `2026-06-26 refactor,test: ...`.
- **OTOMATİK COMMIT YOK.** Her görev sonunda commit ETME; DUR ve kullanıcı inceleyip commit'lesin (kullanıcı talimatı 2026-06-26 + `feedback_no_autocommit_fixes`).
- Açıklamalar/özetler Türkçe; kod ve identifier'lar İngilizce.
- `async void`, `Task.Result`, `.Wait()` YASAK; sync-over-async (`.GetAwaiter().GetResult()`) YASAK.
- Tenant izolasyonu bozulmaz (decorator yalnız delege/erteler; `PrefixKey` mantığı `RedisCacheService`'te kalır).
- Mevcut `Enqueue(Action)` imzası KORUNUR (3 Hangfire/notification enqueuer kullanır).
- `dotnet format` pre-commit zorunlu.

---

### Task 1: Async-capable PostCommitDispatcher

`IPostCommitDispatcher`'a async iş (`Func<CancellationToken, Task>`) ekle; `RunPending()` → `RunPendingAsync(ct)` yap. Mevcut sync `Enqueue(Action)` korunur. 3 test dosyası yeni API'ye uyarlanır.

**Files:**
- Modify: `oksis-api/src/Oksis.Application/Common/Behaviors/IPostCommitDispatcher.cs`
- Modify: `oksis-api/src/Oksis.Application/Common/Behaviors/PostCommitDispatcher.cs`
- Modify: `oksis-api/src/Oksis.Application/Common/Behaviors/PostCommitDispatchBehavior.cs`
- Test: `oksis-api/tests/Oksis.Application.UnitTests/Common/Behaviors/PostCommitDispatcherTests.cs`
- Test: `oksis-api/tests/Oksis.Application.UnitTests/Common/Behaviors/PostCommitDispatchBehaviorTests.cs`
- Test: `oksis-api/tests/Oksis.Infrastructure.IntegrationTests/Timetable/AutoGenerateEnqueuerDeferralTests.cs`

**Interfaces:**
- Produces:
  - `void IPostCommitDispatcher.Enqueue(Action action)` (korunur)
  - `void IPostCommitDispatcher.Enqueue(Func<CancellationToken, Task> action)` (yeni)
  - `Task IPostCommitDispatcher.RunPendingAsync(CancellationToken cancellationToken = default)` (yeni; `RunPending()`'in yerine geçer)

- [ ] **Step 1: Testleri yeni async API'ye güncelle (önce kırmızı/derlenmeyen)**

`PostCommitDispatcherTests.cs` — tüm dosyayı şununla değiştir:

```csharp
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Oksis.Application.Common.Behaviors;
using Xunit;

namespace Oksis.Application.UnitTests.Common.Behaviors;

public sealed class PostCommitDispatcherTests
{
    [Fact(DisplayName = "RunPendingAsync kayıtlı aksiyonları sırayla çalıştırır")]
    public async Task RunPendingAsync_runs_registered_actions_in_order()
    {
        var dispatcher = new PostCommitDispatcher(NullLogger<PostCommitDispatcher>.Instance);
        var order = new List<int>();
        dispatcher.Enqueue(() => order.Add(1));
        dispatcher.Enqueue(_ => { order.Add(2); return Task.CompletedTask; });

        await dispatcher.RunPendingAsync();

        order.Should().Equal(1, 2);
    }

    [Fact(DisplayName = "RunPendingAsync aksiyonları boşaltır; ikinci çağrı no-op")]
    public async Task RunPendingAsync_clears_actions_so_second_call_is_noop()
    {
        var dispatcher = new PostCommitDispatcher(NullLogger<PostCommitDispatcher>.Instance);
        var runs = 0;
        dispatcher.Enqueue(() => runs++);

        await dispatcher.RunPendingAsync();
        await dispatcher.RunPendingAsync();

        runs.Should().Be(1);
    }

    [Fact(DisplayName = "Bir aksiyon atarsa diğerleri yine çalışır (hata yutulur, response bozulmaz)")]
    public async Task RunPendingAsync_continues_when_one_action_throws()
    {
        var dispatcher = new PostCommitDispatcher(NullLogger<PostCommitDispatcher>.Instance);
        var ran = false;
        dispatcher.Enqueue(() => throw new InvalidOperationException("boom"));
        dispatcher.Enqueue(_ => { ran = true; return Task.CompletedTask; });

        var act = async () => await dispatcher.RunPendingAsync();

        await act.Should().NotThrowAsync();
        ran.Should().BeTrue();
    }

    [Fact(DisplayName = "Async aksiyona iletilen CancellationToken RunPendingAsync'inkidir")]
    public async Task RunPendingAsync_passes_its_token_to_async_actions()
    {
        var dispatcher = new PostCommitDispatcher(NullLogger<PostCommitDispatcher>.Instance);
        using var cts = new CancellationTokenSource();
        CancellationToken seen = default;
        dispatcher.Enqueue(ct => { seen = ct; return Task.CompletedTask; });

        await dispatcher.RunPendingAsync(cts.Token);

        seen.Should().Be(cts.Token);
    }
}
```

`PostCommitDispatchBehaviorTests.cs` — `RunPending()` çağrılarını async'e çevir:

```csharp
using FluentAssertions;
using MediatR;
using NSubstitute;
using Oksis.Application.Common.Behaviors;
using Xunit;

namespace Oksis.Application.UnitTests.Common.Behaviors;

public sealed class PostCommitDispatchBehaviorTests
{
    [Fact(DisplayName = "next başarılıysa biriken yan etkiler commit SONRASI çalıştırılır")]
    public async Task Dispatches_pending_after_successful_next()
    {
        var dispatcher = Substitute.For<IPostCommitDispatcher>();
        var sut = new PostCommitDispatchBehavior<string, string>(dispatcher);

        var result = await sut.Handle("req", () => Task.FromResult("ok"), CancellationToken.None);

        result.Should().Be("ok");
        await dispatcher.Received(1).RunPendingAsync(Arg.Any<CancellationToken>());
    }

    [Fact(DisplayName = "next atarsa (rollback) yan etkiler ÇALIŞTIRILMAZ ve exception yukarı taşınır")]
    public async Task Does_not_dispatch_when_next_throws()
    {
        var dispatcher = Substitute.For<IPostCommitDispatcher>();
        var sut = new PostCommitDispatchBehavior<string, string>(dispatcher);

        Func<Task> act = () => sut.Handle(
            "req", () => throw new InvalidOperationException("rollback"), CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>();
        await dispatcher.DidNotReceive().RunPendingAsync(Arg.Any<CancellationToken>());
    }
}
```

> Not: `_ => Task.FromResult(...)` yerine `() => ...` — bu MediatR sürümünde `RequestHandlerDelegate<T>` parametresizdir (mevcut behavior `await next()` ile çağırıyor).

`AutoGenerateEnqueuerDeferralTests.cs` — testi async yap, `RunPending()` → `await RunPendingAsync()`:

```csharp
    [Fact(DisplayName = "Enqueue job'u hemen kuyruğa almaz; ancak RunPendingAsync (commit sonrası) ile alır")]
    public async Task Enqueue_defers_until_post_commit_dispatch()
    {
        var jobs = Substitute.For<IBackgroundJobClient>();
        var dispatcher = new PostCommitDispatcher(NullLogger<PostCommitDispatcher>.Instance);
        var enqueuer = new HangfireAutoGenerateEnqueuer(jobs, dispatcher);

        enqueuer.Enqueue(Guid.NewGuid(), Guid.NewGuid());

        jobs.DidNotReceive().Enqueue(Arg.Any<Expression<Func<AutoGenerateScheduleJob, Task>>>());

        await dispatcher.RunPendingAsync();

        jobs.Received(1).Enqueue(Arg.Any<Expression<Func<AutoGenerateScheduleJob, Task>>>());
    }
```

(Sınıf imzası `public void` → `public async Task` olur; metot adı/gövdesi yukarıdaki gibi.)

- [ ] **Step 2: Derle, kırmızı olduğunu doğrula**

Run: `cd oksis-api && dotnet build`
Expected: FAIL — `'IPostCommitDispatcher' does not contain a definition for 'RunPendingAsync'` (ve `Enqueue(Func<...>)` bulunamadı).

- [ ] **Step 3: Production kodunu uygula**

`IPostCommitDispatcher.cs` — interface'i değiştir (xml-doc'ları koru/uyarlama serbest):

```csharp
namespace Oksis.Application.Common.Behaviors;

/// <summary>
/// Komut handler'larının yan etkilerini (arka plan job enqueue, cache invalidation)
/// transaction COMMIT EDİLENE KADAR biriktiren scoped kuyruk. <see cref="PostCommitDispatchBehavior{TRequest,TResponse}"/>
/// commit başarılı olduktan sonra <see cref="RunPendingAsync"/>'i çağırır. İşlem geri alınırsa
/// (exception) <see cref="RunPendingAsync"/> hiç çağrılmaz → yan etki tetiklenmez.
/// </summary>
public interface IPostCommitDispatcher
{
    /// <summary>Commit sonrası çalıştırılacak senkron bir aksiyon kaydeder (sıra korunur).</summary>
    void Enqueue(Action action);

    /// <summary>Commit sonrası çalıştırılacak asenkron bir aksiyon kaydeder (sıra korunur).</summary>
    void Enqueue(Func<CancellationToken, Task> action);

    /// <summary>Biriken aksiyonları sırayla çalıştırır ve kuyruğu boşaltır. İdempotent: tekrar çağrı no-op.</summary>
    Task RunPendingAsync(CancellationToken cancellationToken = default);
}
```

`PostCommitDispatcher.cs` — tüm dosyayı değiştir:

```csharp
using Microsoft.Extensions.Logging;

namespace Oksis.Application.Common.Behaviors;

/// <summary>
/// <see cref="IPostCommitDispatcher"/>'ın scoped (istek-başına) varsayılan uygulaması. Aksiyonlar
/// kayıt sırasında çalışır. Bir aksiyon atarsa hata YUTULUR (log'lanır) ve diğerleri çalışmaya
/// devam eder — yan etkiler best-effort'tur ve commit edilmiş asıl işlemi/HTTP yanıtını bozmamalıdır.
/// </summary>
public sealed class PostCommitDispatcher(ILogger<PostCommitDispatcher> logger) : IPostCommitDispatcher
{
    private readonly List<Func<CancellationToken, Task>> _actions = [];

    public void Enqueue(Action action)
    {
        ArgumentNullException.ThrowIfNull(action);
        _actions.Add(_ =>
        {
            action();
            return Task.CompletedTask;
        });
    }

    public void Enqueue(Func<CancellationToken, Task> action)
    {
        ArgumentNullException.ThrowIfNull(action);
        _actions.Add(action);
    }

    public async Task RunPendingAsync(CancellationToken cancellationToken = default)
    {
        if (_actions.Count == 0)
        {
            return;
        }

        // Kopya üzerinden çalış + hemen boşalt: tekrar çağrı no-op, çalışırken eklenen yeniden tetiklenmez.
        var pending = _actions.ToArray();
        _actions.Clear();

        foreach (var action in pending)
        {
            try
            {
                await action(cancellationToken);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Post-commit aksiyonu başarısız oldu; atlandı");
            }
        }
    }
}
```

`PostCommitDispatchBehavior.cs` — `Handle` gövdesini değiştir:

```csharp
    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        var response = await next();
        // Yalnızca next() exception atmadıysa buraya ulaşılır → commit başarılı → yan etkileri tetikle.
        await dispatcher.RunPendingAsync(cancellationToken);
        return response;
    }
```

- [ ] **Step 4: Testleri çalıştır, yeşil olduğunu doğrula**

Run: `cd oksis-api && dotnet build && dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~PostCommit"`
Expected: PASS (PostCommitDispatcherTests + PostCommitDispatchBehaviorTests).
Run: `dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~AutoGenerateEnqueuerDeferral"`
Expected: PASS.

- [ ] **Step 5: DUR — kullanıcı inceler ve commit'ler (otomatik commit YOK)**

Önerilen mesaj:
`2026-06-26 refactor,test: PostCommitDispatcher async iş + RunPendingAsync; testler uyarlandı.`
Kullanıcı onaylarsa: `cd oksis-api && dotnet format && git add -A && git commit -m "<mesaj>"`.

---

### Task 2: TransactionAwareCacheService decorator + DI

`ICacheService` decorator'ı: aktif transaction varsa `Remove*`'u dispatcher'a erteler, yoksa hemen yapar; okuma/yazma düz geçer. DI'da Redis-bağlı dalda decorator devreye alınır.

**Files:**
- Create: `oksis-api/src/Oksis.Infrastructure/Caching/TransactionAwareCacheService.cs`
- Modify: `oksis-api/src/Oksis.Infrastructure/DependencyInjection.cs:220`
- Test: `oksis-api/tests/Oksis.Infrastructure.IntegrationTests/Caching/TransactionAwareCacheServiceTests.cs` (Create)

**Interfaces:**
- Consumes: `IPostCommitDispatcher.Enqueue(Func<CancellationToken, Task>)` + `RunPendingAsync` (Task 1); `IApplicationDbContext.Database` (`DatabaseFacade.CurrentTransaction`); `ICacheService` (inner).
- Produces: `TransactionAwareCacheService(ICacheService inner, IApplicationDbContext db, IPostCommitDispatcher dispatcher) : ICacheService`.

- [ ] **Step 1: Entegrasyon testini yaz (önce kırmızı)**

Create `tests/Oksis.Infrastructure.IntegrationTests/Caching/TransactionAwareCacheServiceTests.cs`:

```csharp
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Behaviors;
using Oksis.Infrastructure.Caching;
using Oksis.Infrastructure.IntegrationTests.Fixtures;
using Xunit;

namespace Oksis.Infrastructure.IntegrationTests.Caching;

[Collection(DatabaseCollection.Name)]
public sealed class TransactionAwareCacheServiceTests
{
    private readonly DatabaseFixture _fixture;

    public TransactionAwareCacheServiceTests(DatabaseFixture fixture) => _fixture = fixture;

    [Fact(DisplayName = "Transaction AÇIKKEN RemoveAsync inner'ı hemen çağırmaz; commit sonrası flush eder")]
    public async Task RemoveAsync_in_transaction_defers_until_flush()
    {
        await _fixture.EnsureDatabaseCreatedAsync();
        await using var db = _fixture.CreateDbContext(Guid.NewGuid());
        var spy = new RecordingCacheService();
        var dispatcher = new PostCommitDispatcher(NullLogger<PostCommitDispatcher>.Instance);
        var sut = new TransactionAwareCacheService(spy, db, dispatcher);

        await using var tx = await db.Database.BeginTransactionAsync();

        await sut.RemoveAsync("school-settings");
        await sut.RemoveByPrefixAsync("holidays:");

        spy.RemovedKeys.Should().BeEmpty();         // henüz commit yok → ertelendi
        spy.RemovedPrefixes.Should().BeEmpty();

        await tx.CommitAsync();
        await dispatcher.RunPendingAsync();          // PostCommitDispatchBehavior'ın yaptığı

        spy.RemovedKeys.Should().Equal("school-settings");
        spy.RemovedPrefixes.Should().Equal("holidays:");
    }

    [Fact(DisplayName = "Transaction YOKKEN RemoveAsync inner'ı hemen çağırır")]
    public async Task RemoveAsync_without_transaction_runs_immediately()
    {
        await _fixture.EnsureDatabaseCreatedAsync();
        await using var db = _fixture.CreateDbContext(Guid.NewGuid());
        var spy = new RecordingCacheService();
        var dispatcher = new PostCommitDispatcher(NullLogger<PostCommitDispatcher>.Instance);
        var sut = new TransactionAwareCacheService(spy, db, dispatcher);

        await sut.RemoveAsync("k");

        spy.RemovedKeys.Should().Equal("k");
    }

    [Fact(DisplayName = "Get/Set/Exists/BuildKey her zaman inner'a delege edilir")]
    public async Task Read_write_delegate_to_inner()
    {
        await _fixture.EnsureDatabaseCreatedAsync();
        await using var db = _fixture.CreateDbContext(Guid.NewGuid());
        var spy = new RecordingCacheService();
        var sut = new TransactionAwareCacheService(spy, db,
            new PostCommitDispatcher(NullLogger<PostCommitDispatcher>.Instance));

        await using var tx = await db.Database.BeginTransactionAsync();  // tx açıkken bile düz geçer
        await sut.SetAsync("k", 42);
        _ = await sut.GetAsync<int>("k");
        _ = await sut.ExistsAsync("k");

        spy.SetKeys.Should().Equal("k");
        spy.GetKeys.Should().Equal("k");
        spy.ExistsKeys.Should().Equal("k");
        sut.BuildKey("a", "b").Should().Be("a:b");
    }

    private sealed class RecordingCacheService : ICacheService
    {
        public List<string> RemovedKeys { get; } = [];
        public List<string> RemovedPrefixes { get; } = [];
        public List<string> SetKeys { get; } = [];
        public List<string> GetKeys { get; } = [];
        public List<string> ExistsKeys { get; } = [];

        public Task RemoveAsync(string key, CancellationToken ct = default)
        { RemovedKeys.Add(key); return Task.CompletedTask; }

        public Task RemoveByPrefixAsync(string prefix, CancellationToken ct = default)
        { RemovedPrefixes.Add(prefix); return Task.CompletedTask; }

        public Task SetAsync<T>(string key, T value, TimeSpan? expiry = null, CancellationToken ct = default)
        { SetKeys.Add(key); return Task.CompletedTask; }

        public Task<T?> GetAsync<T>(string key, CancellationToken ct = default)
        { GetKeys.Add(key); return Task.FromResult<T?>(default); }

        public Task<bool> ExistsAsync(string key, CancellationToken ct = default)
        { ExistsKeys.Add(key); return Task.FromResult(false); }

        public string BuildKey(params string[] segments) => string.Join(":", segments);
    }
}
```

> `DatabaseCollection.Name` = `"Database"` (doğrulandı: `Fixtures/DatabaseCollection.cs`).

- [ ] **Step 2: Derle, kırmızı olduğunu doğrula**

Run: `cd oksis-api && dotnet build`
Expected: FAIL — `The type or namespace name 'TransactionAwareCacheService' could not be found`.

- [ ] **Step 3: Decorator'ı oluştur**

Create `src/Oksis.Infrastructure/Caching/TransactionAwareCacheService.cs`:

```csharp
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Behaviors;

namespace Oksis.Infrastructure.Caching;

/// <summary>
/// <see cref="ICacheService"/> decorator'ı: cache invalidation'ı (Remove*) aktif bir EF Core
/// transaction'ı varken transaction COMMIT EDİLENE KADAR erteler. Aksi halde (eski davranış)
/// silme commit'ten önce çalışır; commit penceresinde eşzamanlı bir GET, DB'den henüz commit
/// edilmemiş ESKİ değeri okuyup cache'e geri yazar → Redis'e bayat değer yapışır.
///
/// Erteleme <see cref="IPostCommitDispatcher"/>'a yazılır; <see cref="PostCommitDispatchBehavior{TRequest,TResponse}"/>
/// commit BAŞARILI olduktan sonra kuyruğu boşaltır, rollback'te hiç boşaltmaz. Transaction yoksa
/// silme hemen yapılır. Okuma/yazma (Get/Set/Exists/BuildKey) her zaman inner'a düz delege edilir.
/// </summary>
public sealed class TransactionAwareCacheService(
    ICacheService inner,
    IApplicationDbContext db,
    IPostCommitDispatcher dispatcher) : ICacheService
{
    public Task RemoveAsync(string key, CancellationToken cancellationToken = default)
        => db.Database.CurrentTransaction is not null
            ? Defer(ct => inner.RemoveAsync(key, ct))
            : inner.RemoveAsync(key, cancellationToken);

    public Task RemoveByPrefixAsync(string prefix, CancellationToken cancellationToken = default)
        => db.Database.CurrentTransaction is not null
            ? Defer(ct => inner.RemoveByPrefixAsync(prefix, ct))
            : inner.RemoveByPrefixAsync(prefix, cancellationToken);

    public Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default)
        => inner.GetAsync<T>(key, cancellationToken);

    public Task SetAsync<T>(string key, T value, TimeSpan? expiry = null, CancellationToken cancellationToken = default)
        => inner.SetAsync(key, value, expiry, cancellationToken);

    public Task<bool> ExistsAsync(string key, CancellationToken cancellationToken = default)
        => inner.ExistsAsync(key, cancellationToken);

    public string BuildKey(params string[] segments) => inner.BuildKey(segments);

    private Task Defer(Func<CancellationToken, Task> action)
    {
        // Commit sonrası çalışır; rollback'te PostCommitDispatchBehavior RunPendingAsync'i hiç çağırmaz.
        dispatcher.Enqueue(action);
        return Task.CompletedTask;
    }
}
```

- [ ] **Step 4: DI'da decorator'ı bağla**

`src/Oksis.Infrastructure/DependencyInjection.cs` — Redis-bağlı dalda satır 220'yi değiştir:

```csharp
// ÖNCE:
services.AddScoped<ICacheService, RedisCacheService>();

// SONRA:
services.AddScoped<RedisCacheService>();
services.AddScoped<ICacheService>(sp => new TransactionAwareCacheService(
    sp.GetRequiredService<RedisCacheService>(),
    sp.GetRequiredService<IApplicationDbContext>(),
    sp.GetRequiredService<IPostCommitDispatcher>()));
```

(NullCacheService dalları AYNEN kalır — cache yok, sarmalama gereksiz.)
Dosya başında `using Oksis.Infrastructure.Caching;` zaten var (RedisCacheService aynı namespace); yoksa ekle.

- [ ] **Step 5: Testleri çalıştır, yeşil olduğunu doğrula**

Run: `cd oksis-api && dotnet build && dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~TransactionAwareCacheService"`
Expected: PASS (3 test). (Docker/localdb gerekir — fixture MSSQL ayağa kaldırır.)

- [ ] **Step 6: DUR — kullanıcı inceler ve commit'ler (otomatik commit YOK)**

Önerilen mesaj:
`2026-06-26 fix,test: Cache invalidation commit sonrasına ertelendi (TransactionAwareCacheService decorator); invalidate-before-commit yarışı kapandı.`

---

### Task 3: Uçtan uca regresyon — commit sonrası siler, rollback'te silmez

Gerçek pipeline parçalarını (`TransactionBehavior` + `PostCommitDispatchBehavior` + decorator) gerçek bir DbContext etrafında birleştirip kök bug'ın kapandığını kanıtla: commit → inner silme OLDU; handler atar (rollback) → inner silme OLMADI.

**Files:**
- Test: `oksis-api/tests/Oksis.Infrastructure.IntegrationTests/Caching/PostCommitInvalidationEndToEndTests.cs` (Create)

**Interfaces:**
- Consumes: `TransactionBehavior<,>`, `PostCommitDispatchBehavior<,>` (Task 1), `TransactionAwareCacheService` (Task 2), `ICommand` (`IRequest<Result>`), `DatabaseFixture`.

- [ ] **Step 1: Uçtan uca testi yaz (önce kırmızı — yeni dosya)**

Create `tests/Oksis.Infrastructure.IntegrationTests/Caching/PostCommitInvalidationEndToEndTests.cs`:

```csharp
using FluentAssertions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Behaviors;
using Oksis.Application.Common.Cqrs;
using Oksis.Infrastructure.Caching;
using Oksis.Infrastructure.IntegrationTests.Fixtures;
using Oksis.Shared;
using Xunit;

namespace Oksis.Infrastructure.IntegrationTests.Caching;

[Collection(DatabaseCollection.Name)]
public sealed class PostCommitInvalidationEndToEndTests
{
    private readonly DatabaseFixture _fixture;

    public PostCommitInvalidationEndToEndTests(DatabaseFixture fixture) => _fixture = fixture;

    private sealed record FakeCommand : ICommand;   // IRequest<Result>

    [Fact(DisplayName = "Komut başarılı → cache silme COMMIT SONRASI çalışır")]
    public async Task Removal_happens_after_commit_on_success()
    {
        await _fixture.EnsureDatabaseCreatedAsync();
        await using var db = _fixture.CreateDbContext(Guid.NewGuid());
        var (spy, sut, postCommit, tx) = Build(db);

        // Pipeline: postCommit -> tx -> handler(decorator.RemoveAsync)
        await postCommit.Handle(new FakeCommand(),
            () => tx.Handle(new FakeCommand(), async () =>
            {
                (await spy.RemovedAtHandlerTime()).Should().BeFalse(); // handler içinde HENÜZ silinmedi
                await sut.RemoveAsync("school-settings");
                return Result.Success();
            }, CancellationToken.None),
            CancellationToken.None);

        spy.RemovedKeys.Should().Equal("school-settings"); // commit sonrası silindi
    }

    [Fact(DisplayName = "Komut atar (rollback) → cache silme HİÇ çalışmaz")]
    public async Task Removal_skipped_on_rollback()
    {
        await _fixture.EnsureDatabaseCreatedAsync();
        await using var db = _fixture.CreateDbContext(Guid.NewGuid());
        var (spy, sut, postCommit, tx) = Build(db);

        Func<Task> act = () => postCommit.Handle(new FakeCommand(),
            () => tx.Handle(new FakeCommand(), async () =>
            {
                await sut.RemoveAsync("school-settings");
                throw new InvalidOperationException("boom"); // rollback tetikle
            }, CancellationToken.None),
            CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>();
        spy.RemovedKeys.Should().BeEmpty(); // rollback → flush yok → silme yok
    }

    private static (RecordingCacheService spy, TransactionAwareCacheService sut,
        PostCommitDispatchBehavior<FakeCommand, Result> postCommit,
        TransactionBehavior<FakeCommand, Result> tx) Build(IApplicationDbContext db)
    {
        var spy = new RecordingCacheService();
        var dispatcher = new PostCommitDispatcher(NullLogger<PostCommitDispatcher>.Instance);
        var sut = new TransactionAwareCacheService(spy, db, dispatcher);
        var postCommit = new PostCommitDispatchBehavior<FakeCommand, Result>(dispatcher);
        var tx = new TransactionBehavior<FakeCommand, Result>(
            db, NullLogger<TransactionBehavior<FakeCommand, Result>>.Instance);
        return (spy, sut, postCommit, tx);
    }

    private sealed class RecordingCacheService : ICacheService
    {
        public List<string> RemovedKeys { get; } = [];
        public Task<bool> RemovedAtHandlerTime() => Task.FromResult(RemovedKeys.Count > 0);
        public Task RemoveAsync(string key, CancellationToken ct = default)
        { RemovedKeys.Add(key); return Task.CompletedTask; }
        public Task RemoveByPrefixAsync(string prefix, CancellationToken ct = default) => Task.CompletedTask;
        public Task SetAsync<T>(string key, T value, TimeSpan? expiry = null, CancellationToken ct = default) => Task.CompletedTask;
        public Task<T?> GetAsync<T>(string key, CancellationToken ct = default) => Task.FromResult<T?>(default);
        public Task<bool> ExistsAsync(string key, CancellationToken ct = default) => Task.FromResult(false);
        public string BuildKey(params string[] segments) => string.Join(":", segments);
    }
}
```

> `TransactionBehavior` / `PostCommitDispatchBehavior` `internal` değil `public` (mevcut), test projesi `Oksis.Application`'a referanslı. `RequestHandlerDelegate<TResponse>` parametresizdir → `() => ...`. `ICommand` = `IRequest<Result>`, dolayısıyla `TResponse = Result`.

- [ ] **Step 2: Derle + çalıştır, yeşil olduğunu doğrula**

Run: `cd oksis-api && dotnet build && dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~PostCommitInvalidationEndToEnd"`
Expected: PASS (2 test). Başarısızsa: TransactionBehavior `IsCommand()` `FakeCommand`'i tanımıyorsa (ICommand IRequest<Result> doğru), ya da BeginTransaction DB'ye ulaşamıyorsa fixture/Docker'ı kontrol et.

- [ ] **Step 3: DUR — kullanıcı inceler ve commit'ler (otomatik commit YOK)**

Önerilen mesaj:
`2026-06-26 test: Post-commit cache invalidation uçtan uca regresyon (commit→sil, rollback→silme).`

---

### Task 4: Tam doğrulama (final gate)

Tüm çözüm derlenir, tüm test paketi yeşil, format temiz.

**Files:** (yok — yalnız doğrulama)

- [ ] **Step 1: Tam build**

Run: `cd oksis-api && dotnet build`
Expected: 0 error, 0 warning artışı. (DI döngüsü olsaydı runtime'da çıkardı; testlerde resolve eden bir yol yoksa Step 2'deki entegrasyon testleri yine de decorator'ı elle kuruyor.)

- [ ] **Step 2: Tüm testler**

Run: `cd oksis-api && dotnet test`
Expected: tüm projeler PASS (Domain/Application unit + Infrastructure integration + Api). Özellikle: PostCommit*, TransactionAwareCacheService*, PostCommitInvalidationEndToEnd*, AutoGenerateEnqueuerDeferral* yeşil.

- [ ] **Step 3: Format**

Run: `cd oksis-api && dotnet format --verify-no-changes`
Expected: temiz. Değilse `dotnet format` çalıştır.

- [ ] **Step 4: DUR — kullanıcı son inceleme + (gerekiyorsa) DI smoke**

Opsiyonel canlı doğrulama (kullanıcı): API'yi Redis bağlıyken ayağa kaldır, bir ayar PUT'la, hemen GET'le → yeni değer döner; `module-configs`/`school-settings` gibi anahtarlarda bayat değer dönmediğini gözle. (Kök bug'ı E2E yakaladığı senaryo.)

---

## Self-Review Notları

- **Spec coverage:** Tasarım §3 Parça 1 → Task 1; §3 Parça 2+3 (decorator+DI) → Task 2; §7 test #1-2 → Task 1; #3 (decorator) → Task 2; #4 (entegrasyon) → Task 3. §5 edge-case'ler (rollback, transaction'sız, event-handler) → Task 2 (transaction'sız) + Task 3 (rollback/commit). Event-handler invalidate'leri decorator transparan kapsar (ayrı task gerekmez; aynı `ICacheService` yolundan geçer).
- **Placeholder yok:** tüm adımlarda tam kod/komut var.
- **Tip tutarlılığı:** `RunPendingAsync(CancellationToken)`, `Enqueue(Func<CancellationToken, Task>)`, `TransactionAwareCacheService(ICacheService, IApplicationDbContext, IPostCommitDispatcher)` her görevde aynı imzayla kullanıldı.
- **Açık uç doğrulandı:** `DatabaseCollection.Name = "Database"` (Fixtures/DatabaseCollection.cs); `RunPending()` çağıranlar tam 3 test dosyası (hepsi Task 1'de güncelleniyor).
