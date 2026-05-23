# OKSİS — Multi-Tenant Rules

> **EN KRİTİK KURAL DOSYALARINDAN BİRİ.** OKSİS shared-database / row-level isolation modeli kullanır. **Tek bir tenant ihlali = sözleşme/itibar kaybı + KVKK ihlali.** AI bu dosyadaki kuralları **istisnasız** uygulamalıdır.

---

## 1. Tenancy Modeli

- **Shared Database, Shared Schema** + Row-Level Isolation.
- Her tenant tablosunda **`school_id`** (UUID) zorunlu.
- Tenant'ı **path/header** üzerinden değil, **authenticated user'ın claim'inden** alırız.
- Cache, queue, log, audit, file storage **hepsi** tenant-aware.

> Alternatif modeller (DB-per-tenant, schema-per-tenant) MVP için kullanılmaz. V2'de "Enterprise" planlar için DB-per-tenant değerlendirilebilir.

---

## 2. Tenant Context

```csharp
public interface ITenantContext
{
    SchoolId? CurrentSchoolId { get; }     // SuperAdmin için null olabilir
    bool IsSuperAdmin { get; }
    bool HasTenant => CurrentSchoolId is not null;
    void OverrideForSuperAdmin(SchoolId schoolId);  // Sadece SuperAdmin "impersonate" akışında
}

public sealed class TenantContext : ITenantContext
{
    private SchoolId? _override;
    private readonly IHttpContextAccessor _http;

    public SchoolId? CurrentSchoolId
    {
        get
        {
            if (_override is not null) return _override;
            var claim = _http.HttpContext?.User.FindFirst("school_id")?.Value;
            return claim is null ? null : new SchoolId(Guid.Parse(claim));
        }
    }

    public bool IsSuperAdmin =>
        _http.HttpContext?.User.IsInRole("SuperAdmin") ?? false;

    public void OverrideForSuperAdmin(SchoolId schoolId)
    {
        if (!IsSuperAdmin) throw new SecurityException("Tenant override only allowed for SuperAdmin");
        _override = schoolId;
    }
}
```

- DI scope: **Scoped** (her request'te yeniden çözümlenir).
- Middleware/pipeline behavior'da `CurrentSchoolId` boşsa ve endpoint tenant gerektiriyorsa **401/403** döner.

---

## 3. EF Core Global Query Filter (KILIT)

```csharp
public sealed class OksisDbContext : DbContext
{
    private readonly ITenantContext _tenant;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (typeof(IHasTenant).IsAssignableFrom(entityType.ClrType))
            {
                var method = typeof(OksisDbContext)
                    .GetMethod(nameof(TenantFilter), BindingFlags.NonPublic | BindingFlags.Instance)!
                    .MakeGenericMethod(entityType.ClrType);
                var filter = method.Invoke(this, null);
                entityType.SetQueryFilter((LambdaExpression)filter!);
            }
        }
    }

    private LambdaExpression TenantFilter<T>() where T : class, IHasTenant
    {
        Expression<Func<T, bool>> filter = e =>
            _tenant.IsSuperAdmin || e.SchoolId == _tenant.CurrentSchoolId;
        return filter;
    }
}
```

> **AI Kuralı:** `IHasTenant` implement eden bir entity oluşturduğunda **hiçbir zaman** elle `.Where(e => e.SchoolId == ...)` yazma. Global filter otomatik uygular. `IgnoreQueryFilters()` çağırma. (Tek istisna: SuperAdmin'in cross-tenant raporu.)

### 3.1 Global Filter Bypass — İzinli Durumlar

| Senaryo | Yöntem |
|---------|--------|
| SuperAdmin tenant raporu | Pipeline'da `IsSuperAdmin` flag açıkça check + explicit `WHERE school_id = X` |
| Cross-tenant background job | `ITenantContext.OverrideForSuperAdmin(schoolId)` + try/finally |
| Migration / seed | Standalone konsoldan, Web API context'i değil |

`IgnoreQueryFilters()` **sadece** yukarıdaki 3 senaryoda ve **kod review onayı** ile kullanılır. Her kullanımda yorum satırı: `// JUSTIFICATION: ...` zorunlu.

---

## 4. Write-Path Koruma — SaveChanges Interceptor

```csharp
public sealed class TenantSaveChangesInterceptor : SaveChangesInterceptor
{
    private readonly ITenantContext _tenant;

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken ct = default)
    {
        var context = eventData.Context!;
        foreach (var entry in context.ChangeTracker.Entries<IHasTenant>())
        {
            if (entry.State == EntityState.Added)
            {
                if (entry.Entity.SchoolId == default)
                {
                    if (_tenant.CurrentSchoolId is null)
                        throw new SecurityException(
                            $"Cannot insert {entry.Entity.GetType().Name} without tenant context.");
                    entry.Property(nameof(IHasTenant.SchoolId)).CurrentValue = _tenant.CurrentSchoolId;
                }
                else if (!_tenant.IsSuperAdmin && entry.Entity.SchoolId != _tenant.CurrentSchoolId)
                {
                    throw new SecurityException(
                        $"Tenant mismatch on insert: entity.SchoolId={entry.Entity.SchoolId} ctx={_tenant.CurrentSchoolId}");
                }
            }
            else if (entry.State is EntityState.Modified or EntityState.Deleted)
            {
                var original = entry.Property(nameof(IHasTenant.SchoolId)).OriginalValue;
                if (!_tenant.IsSuperAdmin && !Equals(original, _tenant.CurrentSchoolId))
                {
                    throw new SecurityException("Cross-tenant modification blocked.");
                }
                // SchoolId değiştirilemez (immutable)
                if (entry.Property(nameof(IHasTenant.SchoolId)).IsModified)
                    throw new InvalidOperationException("SchoolId is immutable.");
            }
        }
        return base.SavingChangesAsync(eventData, result, ct);
    }
}
```

- Insert'te `SchoolId` boşsa **otomatik doldurulur**.
- Cross-tenant insert/update/delete `SecurityException` fırlatır → 500 değil, **403** mapping.
- `SchoolId` **immutable** (asla update edilemez).

---

## 5. Pipeline Behavior (MediatR)

```csharp
public sealed class TenantContextBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken ct)
    {
        var attr = request.GetType().GetCustomAttribute<TenancyAttribute>()
            ?? new TenancyAttribute(TenancyMode.Required); // default Required

        if (attr.Mode == TenancyMode.Required && _tenant.CurrentSchoolId is null && !_tenant.IsSuperAdmin)
            throw new TenantRequiredException();

        if (attr.Mode == TenancyMode.SuperAdminOnly && !_tenant.IsSuperAdmin)
            throw new ForbiddenException();

        return await next();
    }
}

[AttributeUsage(AttributeTargets.Class)]
public sealed class TenancyAttribute(TenancyMode mode) : Attribute
{
    public TenancyMode Mode { get; } = mode;
}

public enum TenancyMode { Required, Optional, SuperAdminOnly }
```

Default: `Required`. Login/Refresh/Health gibi tenant-bağımsız endpoint'lerde `[Tenancy(TenancyMode.Optional)]`.

---

## 6. Tenant-Aware Bileşenler

### 6.1 Cache (Redis)

Tüm cache key'leri tenant prefix'i taşır:

```csharp
public string CacheKey(string suffix) =>
    _tenant.IsSuperAdmin
        ? $"global:{suffix}"
        : $"tenant:{_tenant.CurrentSchoolId}:{suffix}";
```

> **Yasak:** `cache.Set("user:123", ...)` gibi tenant-agnostik key. Otomatik wrapping için `ITenantCache` abstraction'ı kullanılır.

### 6.2 Background Job (Hangfire)

```csharp
public sealed class TenantJobContext
{
    public SchoolId SchoolId { get; init; }
    public Guid CorrelationId { get; init; }
}

// Enqueue
_jobs.Enqueue<INotificationDispatcher>(d =>
    d.SendAsync(new TenantJobContext { SchoolId = _tenant.CurrentSchoolId!.Value, ... }));

// Worker tarafında
public async Task SendAsync(TenantJobContext ctx)
{
    _tenant.OverrideForSuperAdmin(ctx.SchoolId); // worker scope'da tenant set'le
    try { /* iş */ }
    finally { /* override temizlenir scope dispose ile */ }
}
```

**Kural:** Hiçbir Hangfire job'u tenant context olmadan iş yapamaz. Job argümanı **mutlaka** `SchoolId` taşır.

### 6.3 SignalR Hub

```csharp
public override Task OnConnectedAsync()
{
    var schoolId = Context.User?.FindFirst("school_id")?.Value;
    if (schoolId is not null)
        Groups.AddToGroupAsync(Context.ConnectionId, $"tenant:{schoolId}");
    return base.OnConnectedAsync();
}

// Broadcast
await _hub.Clients.Group($"tenant:{schoolId}").SendAsync("notification", payload);
```

**Yasak:** `Clients.All.SendAsync(...)` — cross-tenant leak.

### 6.4 File Storage (S3/Blob)

Path/Key formatı:

```
{schoolId}/{module}/{yyyy}/{MM}/{guid}.{ext}
```

Örnek: `e3f.../homework/2025/09/8a2b.pdf`

**Kural:** Bucket/Container ortak; izolasyon **path** + **pre-signed URL** ile. SuperAdmin hariç hiçbir kullanıcı başka tenant path'ine erişemez (server-side check).

### 6.5 Logging (Serilog)

```csharp
LogContext.PushProperty("SchoolId", _tenant.CurrentSchoolId?.Value);
LogContext.PushProperty("UserId", _currentUser.Id);
LogContext.PushProperty("CorrelationId", correlationId);
```

ELK'da her log satırı `SchoolId` taşır. Müşteri destek aramasında: `school_id:"..."` filtresiyle anında log izolasyonu.

### 6.6 Email Templates

Template'ler global olabilir ama **content** tenant-aware: okul adı, logo, telefon. Tenant ayarları `School.Settings` value object'inden okunur.

---

## 7. Authorization — Tenant + Resource Scope

Tenant izolasyonu **yetkilendirmenin yarısıdır.** İkinci yarı: **resource-level scope** (örn. Teacher yalnız kendi sınıfının yoklamasını alabilir).

```csharp
public interface IResourceAuthorizationService
{
    Task<bool> CanAccessClassAsync(ClassId classId, CancellationToken ct);
    Task<bool> CanAccessStudentAsync(StudentId studentId, CancellationToken ct);
}
```

Detay: `backend/security-rules.md`.

---

## 8. Cross-Tenant Senaryolar (NADİREN ve KONTROLLÜ)

| Senaryo | Çözüm |
|---------|-------|
| SuperAdmin dashboard (tenant istatistikleri) | Read-only, explicit `IgnoreQueryFilters()`, audit'lenir |
| Bir velinin **birden fazla** okulda çocuğu | **Şu an MVP'de yok.** V2'de: User'ın multi-tenant olabilmesi için ayrı tasarım gerekir. Şimdilik her okul için ayrı User |
| Demo veri seed | Migration script + `IgnoreQueryFilters()` |
| Tenant data export (KVKK) | SuperAdmin only, full audit, sadece o tenant'ın verisi |

---

## 9. Test Zorunluluğu — Tenant Isolation Test

Her yeni tenant entity için **şu testler zorunlu**:

```csharp
[Fact]
public async Task Query_Should_Not_Return_Other_Tenant_Data()
{
    // Arrange: 2 farklı tenant'a ait Student insert
    var schoolA = await CreateSchool();
    var schoolB = await CreateSchool();
    await SeedStudent(schoolA);
    await SeedStudent(schoolB);

    // Act: schoolA context'inde sorgu
    SetTenant(schoolA);
    var result = await Mediator.Send(new ListStudentsQuery());

    // Assert: schoolB öğrencisi gelmedi
    result.Items.Should().OnlyContain(s => s.SchoolId == schoolA);
}

[Fact]
public async Task Insert_Without_Tenant_Should_Throw()
{
    ClearTenant();
    var act = () => Mediator.Send(new CreateStudentCommand(...));
    await act.Should().ThrowAsync<TenantRequiredException>();
}

[Fact]
public async Task Update_Other_Tenant_Resource_Should_Throw()
{
    var schoolA = await CreateSchool();
    var schoolB = await CreateSchool();
    var studentB = await SeedStudent(schoolB);

    SetTenant(schoolA);
    var act = () => Mediator.Send(new UpdateStudentCommand(studentB.Id, ...));
    await act.Should().ThrowAsync<ForbiddenException>(); // veya NotFound
}
```

> Bu testler **CI gate**. Geçmeyen PR merge edilemez.

---

## 10. Yasak Pratikler

- ❌ Endpoint URL'inde `schoolId` parametresi (örn. `/schools/{schoolId}/students`). Tenant **claim**'den çözülür.
- ❌ `WHERE SchoolId = X` manuel yazmak (global filter zaten yapıyor; çift yazılırsa DRY ihlali + tutarsızlık).
- ❌ `IgnoreQueryFilters()` justification olmadan.
- ❌ Cache key'i tenant prefix'siz.
- ❌ Hangfire job'una `SchoolId` argüman olarak vermemek.
- ❌ SignalR `Clients.All` veya `Clients.User` (tenant-bypass).
- ❌ Aynı User'a 2 farklı tenant'tan login (MVP).
- ❌ File path'inde tenant id'siz upload.
- ❌ Background job içinde `IHttpContextAccessor` kullanmak (yok HttpContext, fail).

---

## 11. AI Direktifleri (özet)

1. Yeni entity tenant scope'unda mı? → `IHasTenant` implement et, **bitti**.
2. Sorgu yazıyorsun → manuel `SchoolId` filtresi koyma; global filter çalışır.
3. Cache, queue, file, log, hub → tenant prefix/grup/property **zorunlu**.
4. SuperAdmin cross-tenant işlem mi? → açık `IgnoreQueryFilters()` + audit + justification yorumu.
5. Hangfire job'u mu? → argüman olarak `SchoolId` taşı; worker scope'da `OverrideForSuperAdmin` ile set'le.
6. Test yazmadan PR açma: isolation testi olmadan tenant entity merge edilmez.
