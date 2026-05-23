# OKSİS — Logging & Error Handling Rules

> **Stack:** Serilog + Elasticsearch + Kibana (ELK). Yapılandırılmış log + correlation ID + tenant scope. Hatalar kullanıcıya **anlamlı**, log'a **detaylı**.

---

## 1. Serilog Konfigürasyonu

```csharp
// Program.cs
builder.Host.UseSerilog((ctx, sp, cfg) => cfg
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .MinimumLevel.Override("Microsoft.EntityFrameworkCore.Database.Command", LogEventLevel.Warning)
    .MinimumLevel.Override("Microsoft.AspNetCore.Hosting", LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .Enrich.WithMachineName()
    .Enrich.WithEnvironmentName()
    .Enrich.WithProperty("Service", "oksis-api")
    .Enrich.WithProperty("Version", ctx.HostingEnvironment.ApplicationName)
    .Enrich.With<SensitiveDataEnricher>()
    .WriteTo.Console(new CompactJsonFormatter())             // dev
    .WriteTo.Elasticsearch(new ElasticsearchSinkOptions(new Uri(ctx.Configuration["Elasticsearch:Url"]!))
    {
        IndexFormat = $"oksis-logs-{ctx.HostingEnvironment.EnvironmentName.ToLower()}-{0:yyyy.MM.dd}",
        AutoRegisterTemplate = true,
        AutoRegisterTemplateVersion = AutoRegisterTemplateVersion.ESv8,
        ModifyConnectionSettings = c => c.BasicAuthentication(user, pwd),
    })
);
```

> Production'da Console **yok** veya Information+ ile sınırlı. ELK ana sink.

---

## 2. Zorunlu Log Property'leri

Her log entry'sinde **mutlaka**:

| Property | Kaynak |
|----------|--------|
| `Timestamp` | Otomatik |
| `Level` | Otomatik |
| `Service` | Enricher (`oksis-api`) |
| `Environment` | Enricher |
| `CorrelationId` | Middleware (per-request) |
| `SchoolId` | TenantScope (LogContext.PushProperty) |
| `UserId` | UserScope |
| `RequestPath` | Middleware |
| `Message` | Yazılım |

```csharp
// Middleware
public async Task InvokeAsync(HttpContext ctx)
{
    var correlationId = ctx.Request.Headers["X-Correlation-Id"].FirstOrDefault()
                        ?? Guid.NewGuid().ToString("N");
    ctx.Response.Headers["X-Correlation-Id"] = correlationId;

    using (LogContext.PushProperty("CorrelationId", correlationId))
    using (LogContext.PushProperty("RequestPath", ctx.Request.Path))
    using (LogContext.PushProperty("RequestMethod", ctx.Request.Method))
    using (LogContext.PushProperty("ClientIp", ctx.Connection.RemoteIpAddress?.ToString()))
    {
        await _next(ctx);
    }
}
```

---

## 3. Structured Logging (Templating)

```csharp
// DOĞRU
_logger.LogInformation(
    "Attendance session created for class {ClassId} with {RecordCount} records",
    classId, records.Count);

// YANLIŞ — string interpolation
_logger.LogInformation($"Attendance session for class {classId} ...");
```

> İnterpolation **structured** logging'i bozar; her log unique string oluşur, ELK aggregate edemez.

### 3.1 Property Naming

- PascalCase: `SchoolId`, `UserId`, `ClassId`, `Elapsed`.
- Karmaşık nesne için `{@Object}` (destructure): `_logger.LogInformation("Created {@Homework}", hw)`.
- PII destructure'lanmaz; özet alanları logla.

---

## 4. Log Level Kullanım Kılavuzu

| Level | Kullanım |
|-------|---------|
| `Trace` | Çok detaylı debug; production'da kapalı |
| `Debug` | Geliştirme; staging'de açık olabilir |
| `Information` | Normal akış: "user logged in", "homework created", "job completed" |
| `Warning` | Beklenmedik ama recoverable: "retry attempt 2", "cache miss for X", "deprecated endpoint" |
| `Error` | Operasyonun başarısız olduğu durumlar: exception caught, payment failed |
| `Fatal` | Servis çökmesi, restart gerekir |

> **Kural:** Beklenen 4xx hataları `Information` veya `Warning`, **`Error` değil.** `Error` log'u alert üretir; gereksiz alert noise yapma.

---

## 5. PII / Sensitive Data Redaction

```csharp
public sealed class SensitiveDataEnricher : ILogEventEnricher
{
    private static readonly string[] SensitiveKeys =
        { "password", "token", "secret", "apikey", "tcno", "creditcard", "iban" };

    public void Enrich(LogEvent logEvent, ILogEventPropertyFactory pf)
    {
        foreach (var prop in logEvent.Properties.ToList())
        {
            if (SensitiveKeys.Any(k => prop.Key.Contains(k, StringComparison.OrdinalIgnoreCase)))
            {
                logEvent.AddOrUpdateProperty(pf.CreateProperty(prop.Key, "***"));
            }
        }
    }
}
```

> Detay: `security-rules.md` §11.

**Kural:** Loglama yaparken request body'yi tamamen log'lama; sadece **endpoint + status + elapsed** yeterli. Body içeriği gerekirse "audit log" tablosuna git.

---

## 6. Request Logging Behavior (MediatR)

```csharp
public sealed class RequestLoggingBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken ct)
    {
        var requestName = typeof(TRequest).Name;
        var sw = Stopwatch.StartNew();
        try
        {
            _logger.LogInformation("Handling {RequestName}", requestName);
            var response = await next();
            _logger.LogInformation("Handled {RequestName} in {Elapsed}ms", requestName, sw.ElapsedMilliseconds);
            return response;
        }
        catch (Exception ex) when (ex is ValidationException or ForbiddenException or NotFoundException)
        {
            _logger.LogWarning(ex, "{RequestName} expected failure: {Message}", requestName, ex.Message);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "{RequestName} unhandled error", requestName);
            throw;
        }
    }
}
```

Pipeline order: RequestLogging → Validation → Tenant → Authorization → ...

---

## 7. Exception Handling Middleware

```csharp
app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async ctx =>
    {
        var feature = ctx.Features.Get<IExceptionHandlerFeature>();
        var exception = feature?.Error;
        var (status, code, message) = exception switch
        {
            ValidationException ve     => (400, "validation_failed", ve.Message),
            UnauthorizedException     => (401, "unauthorized", "Authentication required."),
            ForbiddenException        => (403, "forbidden", "Access denied."),
            NotFoundException nf      => (404, "not_found", nf.Message),
            ConflictException cf      => (409, "conflict", cf.Message),
            TooManyRequestsException  => (429, "rate_limited", "Too many requests."),
            DomainException de        => (422, "domain_rule", de.Message),
            _                         => (500, "internal_error", "An unexpected error occurred.")
        };

        if (status >= 500)
            _logger.LogError(exception, "Unhandled error CorrelationId={CorrelationId}",
                ctx.Response.Headers["X-Correlation-Id"]);

        ctx.Response.StatusCode = status;
        ctx.Response.ContentType = "application/json";
        await ctx.Response.WriteAsJsonAsync(new ApiErrorResponse
        {
            Error = new ApiError(code, message),
            CorrelationId = ctx.Response.Headers["X-Correlation-Id"].ToString(),
            Timestamp = DateTimeOffset.UtcNow
        });
    });
});
```

Detay response envelope: `backend/api-design-rules.md` §Response.

---

## 8. Custom Exception Hierarchy

```csharp
public abstract class OksisException(string message) : Exception(message);

public sealed class ValidationException(IDictionary<string, string[]> errors)
    : OksisException("One or more validation errors occurred.")
{
    public IDictionary<string, string[]> Errors { get; } = errors;
}

public sealed class NotFoundException(string entity, object id)
    : OksisException($"{entity} with id '{id}' was not found.");

public sealed class ForbiddenException(string? reason = null)
    : OksisException(reason ?? "Access denied.");

public sealed class ConflictException(string message) : OksisException(message);

public sealed class DomainException(string message) : OksisException(message);

public sealed class TenantRequiredException()
    : OksisException("This operation requires a tenant context.");
```

> Business case'ler için `Result<T>` pattern tercih edilir (`backend/coding-standards.md`). Exception "exceptional" durum.

---

## 9. Audit Log

İş açısından kritik olaylar `audit_logs` tablosuna yazılır (Serilog'a değil — sorgulanabilir veri).

```sql
CREATE TABLE audit_logs (
    id              uniqueidentifier primary key,
    school_id       uniqueidentifier not null,
    user_id         uniqueidentifier not null,
    action          nvarchar(100) not null,   -- "mark.publish", "user.delete", "auth.login"
    entity_type     nvarchar(100) null,        -- "Mark", "User"
    entity_id       uniqueidentifier null,
    before          nvarchar(max) /* JSON */ null,               -- diff için (UPDATE/DELETE)
    after           nvarchar(max) /* JSON */ null,
    ip_address      nvarchar(45) null,
    user_agent      nvarchar(500) null,
    correlation_id  nvarchar(50) not null,
    created_at      datetimeoffset not null
);
CREATE INDEX ix_audit_logs_school_created ON audit_logs(school_id, created_at desc);
CREATE INDEX ix_audit_logs_entity ON audit_logs(school_id, entity_type, entity_id);
```

### 9.1 Audit'lenmesi Zorunlu Olaylar

- Auth: login (success/fail), logout, password reset, MFA enable/disable.
- Authz: role assign, permission change, SuperAdmin cross-tenant access.
- User lifecycle: create, update (rol, email), delete.
- Sensitive data: mark publish/unpublish, attendance correction (Locked sonrası), homework delete, student transfer/withdrawal.
- Financial (gelecek): payment, refund.
- Tenant lifecycle: create, suspend, activate, archive.
- Bulk: import, export, mass delete.
- KVKK: data export request, data delete request, consent change.

```csharp
public interface IAuditLogger
{
    Task LogAsync(string action, string? entityType, Guid? entityId,
                  object? before = null, object? after = null,
                  CancellationToken ct = default);
}

// Kullanım handler içinde:
await _audit.LogAsync("mark.publish", "Mark", markId.Value, before: null, after: markDto, ct);
```

### 9.2 Audit Log Sorgulama

- SchoolAdmin admin paneli: kendi okulunun audit log'u (paginated).
- SuperAdmin: tüm okullar.
- Retention: **5 yıl** (KVKK + sektör beklentisi). Sonra cold storage.

---

## 10. EF Core Query Logging

Production'da:

- `Microsoft.EntityFrameworkCore.Database.Command` → `Warning` (parametre değerleri loglanmasın).
- Slow query detection: 500ms üstü query'leri `Warning` ile.

```csharp
// Custom interceptor
public sealed class SlowQueryInterceptor(ILogger<SlowQueryInterceptor> logger) : DbCommandInterceptor
{
    public override async ValueTask<DbDataReader> ReaderExecutedAsync(
        DbCommand command, CommandExecutedEventData eventData, DbDataReader result, CancellationToken ct = default)
    {
        if (eventData.Duration.TotalMilliseconds > 500)
            logger.LogWarning("Slow query detected {ElapsedMs}ms: {Sql}",
                eventData.Duration.TotalMilliseconds, command.CommandText);
        return await base.ReaderExecutedAsync(command, eventData, result, ct);
    }
}
```

---

## 11. ELK Pipeline

### 11.1 Index Strategy

- `oksis-logs-{env}-{yyyy.MM.dd}` günlük rotation.
- Index Lifecycle Management (ILM):
  - 7 gün: hot (SSD)
  - 30 gün: warm
  - 90 gün: cold
  - 365 gün: delete (Information+)
  - Error+: 2 yıl saklama
- Audit log Serilog'a değil, **DB**'ye. Logstash → S3 archive opsiyonel.

### 11.2 Kibana Dashboards (öneri)

- **Operational:** RPS, p50/p95 latency, 5xx oranı, error rate by endpoint.
- **Security:** Failed login attempts, 403 spikes, rate limit hits, SuperAdmin cross-tenant.
- **Tenant:** Tenant başına RPS / error / aktif user.
- **Notification:** Send/fail/cooldown skip oranları.
- **Hangfire:** Job count, queue length, failure rate.

### 11.3 Alerts (örnek)

| Sinyal | Eşik | Aksiyon |
|--------|------|--------|
| 5xx rate | >1% (5 dk) | PagerDuty |
| Auth fail spike | >50/dk (tek IP) | Auto-block + alert |
| Tenant cross-access | herhangi bir kayıt | Slack #security |
| Slow query | >2sn (10 dk içinde 10+) | Slack #engineering |
| Hangfire queue length | >500 | Slack #engineering |

---

## 12. Frontend → Backend Hata Korelasyonu

- Frontend her request'te `X-Correlation-Id` header gönderir (yoksa backend üretir).
- Frontend hata UI'ında `correlationId` gösterir (kullanıcı destek için verir).
- Support: Kibana'da `correlation_id:{id}` → tüm request log + audit log birlikte.

---

## 13. Health Check & Readiness

```csharp
services.AddHealthChecks()
    .AddSqlServer(connStr, name: "mssql")
    .AddRedis(redisConn, name: "redis")
    .AddElasticsearch(elasticUrl, name: "elasticsearch")
    .AddHangfire(o => o.MinimumAvailableServers = 1);

app.MapHealthChecks("/health", new HealthCheckOptions { Predicate = _ => true });
app.MapHealthChecks("/health/ready", new HealthCheckOptions { Predicate = c => c.Tags.Contains("ready") });
app.MapHealthChecks("/health/live", new HealthCheckOptions { Predicate = _ => false });
```

---

## 14. Yasak Pratikler

- ❌ `Console.WriteLine`, `Debug.WriteLine` production kodunda.
- ❌ String interpolation ile log mesajı (structured logging bozulur).
- ❌ Password/token/T.C. loglamak.
- ❌ Tüm exception'ları `catch (Exception) { /* sessizce yut */ }`.
- ❌ Beklenen 4xx için `LogError` (alert noise).
- ❌ Audit'i Serilog'a yazıp DB'ye yazmamak (sorgulanabilir olmalı).
- ❌ Correlation ID middleware'i atlamak.
- ❌ "stack trace user'a göster" (sadece dev'de).
- ❌ Production'da `Microsoft.EntityFrameworkCore.Database.Command` Information+.

---

## 15. AI Direktifleri

1. Bir log mesajı yazıyorsan: structured mı? Property'leri PascalCase mi?
2. Hata fırlatıyorsan: doğru exception tipi mi? Mapping middleware'de var mı?
3. İş açısından kritik bir aksiyon mu? → audit log entry ekledin mi?
4. Yeni endpoint açtın: 200/4xx/5xx üçü için log seviyesi doğru mu? (4xx = Warning/Info, 5xx = Error)
5. Kullanıcıya gösterilen hata mesajı internal detay sızdırıyor mu?
6. Correlation ID response header'da, log'da, audit'te aynı değer mi?
