# OKSİS — Background Job Rules

> **Aracı:** Hangfire (Microsoft SQL Server storage). **Kullanım alanı:** outbox dispatch, scheduled (ödev hatırlatması), bulk operasyonlar (Excel import), notification fan-out, raporlar, KVKK retention. Bir senaryo job'a uygun mu? — § 2.

---

## 1. Hangfire Konfigürasyonu

```csharp
services.AddHangfire(cfg => cfg
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UseSqlServerStorage(connStr, new SqlServerStorageOptions
    {
        SchemaName = "hangfire",
        PrepareSchemaIfNecessary = false,             // CI/CD script ile uygulanır
        QueuePollInterval = TimeSpan.FromSeconds(2),
        SlidingInvisibilityTimeout = TimeSpan.FromMinutes(5),
        DisableGlobalLocks = true,                    // SQL Server için önerilen
        UseRecommendedIsolationLevel = true,
        CommandBatchMaxTimeout = TimeSpan.FromMinutes(5),
    }));

services.AddHangfireServer(o =>
{
    o.WorkerCount = Environment.ProcessorCount * 2;
    o.Queues = new[] { "critical", "default", "low", "bulk" };
    o.ServerName = $"{Environment.MachineName}-{Guid.NewGuid():N}";
});
```

Queue ayrımı:

| Queue | Kullanım | Worker count |
|-------|---------|--------------|
| `critical` | Auth, payment, security alerts | yüksek |
| `default` | Notification dispatch, outbox | varsayılan |
| `low` | Digest mail, recurring reports | düşük |
| `bulk` | Excel import, mass operations | sınırlı (queue isolation) |

> **Bulk queue isolation:** Excel import gibi uzun job'lar `critical` queue'yu blok'lamasın.

---

## 2. Background Job mu, Senkron mu?

| Durum | Sync mi Async mi? |
|-------|--------------------|
| Tek kayıt CRUD | Sync (handler içinde) |
| 1 push notification gönderme | Async (Hangfire) |
| 200 kişiye bildirim | Async, batch'le |
| Bir e-mail | Async |
| Excel 1000 satır import | Async, progress'li |
| Rapor üretimi (>5 saniye sürüyor) | Async, 202 + status URL |
| Domain event yan etkisi | Async (outbox + Hangfire) |
| Real-time SignalR push | Sync (handler içinden) |

> **Kural:** Bir endpoint **2 saniye**'den uzun süreceği zaman Hangfire'a delege et + 202 Accepted dön.

---

## 3. Job Yazma Şablonu

```csharp
public interface IBackgroundJob<TArgs>
{
    Task ExecuteAsync(TArgs args, CancellationToken ct);
}

public sealed class HomeworkReminderJob(
    IOksisDbContext db,
    INotificationDispatcher dispatcher,
    ITenantContext tenant,
    ILogger<HomeworkReminderJob> logger) : IBackgroundJob<HomeworkReminderArgs>
{
    [AutomaticRetry(Attempts = 5, DelaysInSeconds = new[] { 60, 300, 900, 3600 })]
    public async Task ExecuteAsync(HomeworkReminderArgs args, CancellationToken ct)
    {
        tenant.OverrideForSuperAdmin(args.SchoolId);  // tenant scope
        using var _ = logger.BeginScope(new Dictionary<string, object>
        {
            ["SchoolId"] = args.SchoolId.Value,
            ["JobId"] = args.JobId,
            ["CorrelationId"] = args.CorrelationId
        });

        var homework = await db.Homeworks.FirstOrDefaultAsync(h => h.Id == args.HomeworkId, ct);
        if (homework is null) { logger.LogWarning("Homework not found"); return; }

        if (homework.Status != HomeworkStatus.Published) return;
        if (await AlreadySent(args.HomeworkId, ct)) return; // idempotency

        // ... bildirim gönder
    }
}

public sealed record HomeworkReminderArgs(
    SchoolId SchoolId,
    HomeworkId HomeworkId,
    Guid JobId,
    Guid CorrelationId);
```

> **Argüman immutability:** Argüman tipi `record`. Serialize edilebilir, complex domain entity geçirilmez.

---

## 4. Idempotency

**Her job idempotent olmalı.** Hangfire retry, server restart, manual retrigger sebebiyle aynı job birden fazla çalışabilir.

Teknikler:

1. **State check:** `if (homework.Status != Published) return;`
2. **Sent log:** `notification_delivery_log` benzer tablo `(job_id, ...)` unique.
3. **Distributed lock:** Redis lock (`SET NX EX`) ile cross-server uniqueness.
4. **Outbox:** processed_at flag.

```csharp
await using var distributedLock = await _lockFactory.AcquireAsync(
    $"job:homework-reminder:{args.HomeworkId}", TimeSpan.FromMinutes(2), ct);
if (distributedLock is null) { logger.LogInformation("Lock not acquired, skipping"); return; }
// ... iş
```

---

## 5. Enqueue Pattern

### 5.1 Fire-and-Forget (Hemen)

```csharp
_backgroundJobs.Enqueue<HomeworkReminderJob>(
    j => j.ExecuteAsync(new HomeworkReminderArgs(schoolId, hwId, jobId, corrId), CancellationToken.None));
```

### 5.2 Scheduled (Geleceğe)

```csharp
_backgroundJobs.Schedule<HomeworkReminderJob>(
    j => j.ExecuteAsync(args, CancellationToken.None),
    dueAt: homework.DueDate.AddDays(-1).At(18, 0));
```

### 5.3 Recurring (Cron)

Recurring job'lar **Startup**'ta veya **migration** sırasında register edilir:

```csharp
RecurringJob.AddOrUpdate<DailyDigestJob>(
    recurringJobId: "daily-digest",
    methodCall: j => j.ExecuteAsync(CancellationToken.None),
    cronExpression: "0 6 * * *",
    options: new RecurringJobOptions { TimeZone = TimeZoneInfo.FindSystemTimeZoneById("Europe/Istanbul") });
```

**Yasak:** Recurring job'u handler/command içinden register etmek (her request'te tekrar register olur, hata kaynağı).

### 5.4 Continuation (Bağımlı)

```csharp
var importJobId = _bg.Enqueue<ExcelImportJob>(j => j.ParseAsync(args, default));
_bg.ContinueJobWith<EmailReportJob>(importJobId, j => j.SendAsync(args.UserId, default));
```

---

## 6. Tenant Awareness (CRITICAL)

> Hiçbir job tenant scope olmadan çalışmaz.

- Argüman olarak **`SchoolId` zorunlu** (SuperAdmin global job hariç).
- Worker scope başlangıcında `ITenantContext.OverrideForSuperAdmin(args.SchoolId)`.
- Try/finally ile scope dispose. (Pratik: Hangfire job activator scope per job.)

```csharp
public sealed class TenantAwareJobActivator : JobActivator
{
    private readonly IServiceProvider _root;
    public override JobActivatorScope BeginScope(JobActivatorContext context)
    {
        var scope = _root.CreateScope();
        return new ScopeWrapper(scope);
    }
}
```

> Detay: `backend/multi-tenant-rules.md` §6.2.

---

## 7. Retry & Failure

- Default 10 retry, **biz 5'e düşürdük**. Backoff: 1m → 5m → 15m → 1h → 6h.
- Final fail → `[FailedState]` Hangfire dashboard'da. Alert SuperAdmin'e (Critical job'lar için).
- Non-retriable exception tipleri:
  - `TenantNotFoundException`
  - `EntityNotFoundException` (idempotent return önerilir, exception değil)
  - `ValidationException`
- Retriable: network, transient DB, FCM throttle.

```csharp
[AutomaticRetry(Attempts = 5, OnAttemptsExceeded = AttemptsExceededAction.Fail)]
public async Task ExecuteAsync(...) { ... }
```

---

## 8. Long-Running Jobs (Excel Import örneği)

- Status tracking: `bulk_job_status` tablosu (id, status, processed, total, errors[], started_at, finished_at).
- Endpoint: `POST /api/v1/imports/students` → 202 + `{ jobId, statusUrl }`.
- Client `GET /api/v1/imports/{jobId}` ile durum çeker veya SignalR `bulk-progress` event'ine subscribe olur.
- Chunked processing (200 satır/transaction).
- Cancellation: `CancellationToken` job'a iletilir; user `DELETE /api/v1/imports/{jobId}` ile iptal eder.

```sql
CREATE TABLE bulk_job_status (
    id              uuid primary key,
    school_id       uuid not null,
    user_id         uuid not null,
    type            varchar(50) not null,    -- "student-import", "report-export"
    status          varchar(20) not null,    -- queued/running/succeeded/failed/cancelled
    progress_pct    int not null default 0,
    processed       int not null default 0,
    total           int not null default 0,
    errors          nvarchar(max) /* JSON */ null,
    output_url      text null,               -- e.g., resulting file
    created_at      datetimeoffset not null,
    finished_at     datetimeoffset null
);
```

---

## 9. Recurring Jobs Listesi (MVP)

| Job | Cron | Sorumluluk |
|-----|------|-----------|
| `outbox-drain` | her 30 saniye | Outbox tablosundan unprocessed mesajları çek, dispatch et |
| `homework-due-tomorrow-reminder` | her gün 18:00 | Yarın due olan ödevler için bildirim |
| `attendance-not-taken-alert` | her gün 09:00 | Henüz yoklaması alınmamış sınıflar → SchoolAdmin |
| `refresh-token-cleanup` | her gün 03:00 | Expired refresh token'ları purge |
| `inactive-session-cleanup` | her gün 04:00 | Stale SignalR connections |
| `audit-log-archive` | her ay 1. gün 02:00 | 5+ yıl audit log → cold storage |
| `tenant-archive-purge` | her gün 05:00 | Archived + 180 gün geçmiş tenant → hard purge |
| `daily-digest-email` | her gün 07:00 (kullanıcı opt-in) | Önceki gün özeti |

> Yeni recurring job ekleniyorsa: cron expression, tenant scope, idempotency, audit log entry — 4 alan tanımla.

---

## 10. Tenant-Per-Job vs Global Recurring

Recurring job'lar **2 tipte** olabilir:

1. **Global** (tüm tenant'lar): `outbox-drain`, `audit-log-archive` → SuperAdmin scope.
2. **Per-tenant**: `daily-digest` her okul için ayrı job kaydı (`recurring_job_id = "daily-digest:{schoolId}"`).

> Per-tenant'ı tenant onboarding sırasında register et, tenant archive'da deregister.

---

## 11. Observability

- Her job execution'ı log'lar:

```
[Information] Job HomeworkReminderJob started SchoolId={SchoolId} JobId={JobId} HomeworkId={HwId}
[Information] Job HomeworkReminderJob finished elapsed={Ms}ms recipients={Count}
[Warning]     Job HomeworkReminderJob retry attempt={N} error={Error}
[Error]       Job HomeworkReminderJob failed after attempts
```

- Hangfire dashboard `/hangfire` SuperAdmin'e açık (auth ile).
- Metrikler (Prometheus): job_count, job_duration, job_failures, queue_length.

---

## 12. Test Zorunlulukları

- Job execute'u unit testlenir (deps mock).
- Idempotency: aynı argümanla 2 kez execute → tek yan etki.
- Retry tetikleyici: transient exception fırlat → Hangfire retry policy doğrulaması (integration).
- Tenant isolation: cross-tenant entity'ye dokunduğunda hata.

---

## 13. Yasak Pratikler

- ❌ Handler içinden **doğrudan** `Task.Run(...)` ile arka plana atmak. (Hangfire kullan.)
- ❌ Job'a DbContext, HttpContext, kullanıcı entity'si geçmek. (ID + minimal payload.)
- ❌ Job argümanı in `class` (mutable). Record kullan.
- ❌ Recurring job'u her request'te register etmek.
- ❌ Tenant'sız job (argümanda `SchoolId` yoksa).
- ❌ Job sonunda `Console.WriteLine` (structured logging).
- ❌ Long-running job'da progress reporting eksik (kullanıcı saatlerce bekler).
- ❌ Critical queue'ya bulk import koymak.
- ❌ Job'da `Thread.Sleep` (`await Task.Delay` kullan).

---

## 14. AI Direktifleri

1. Bir handler 2 saniyeden uzun bir işi içeriyor mu? → Job'a delege et.
2. Yeni job: argüman record mı? SchoolId argümanda mı? Idempotent mi?
3. Job recurring mi? → Startup'ta register et, handler içinde değil.
4. Job logging: SchoolId, JobId, CorrelationId scope'a eklendi mi?
5. Bulk operasyon mu? → Status tablosu + 202 endpoint + progress + cancellation.
6. Tenant override: try/finally ile geri alındı mı? (Scoped DI yönetiyor olabilir; manuel override sonrası temizle.)
