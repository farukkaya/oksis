# Backend Coding Standards (.NET Core API v10)

> .NET 10 / C# 13+ kod yazım kuralları. AI bu standartların dışına çıkmadan kod üretir.

---

## 1. Genel Kurallar

- **C# 13+ özellikleri kullanılır** (primary constructors, collection expressions, `field` keyword, etc.).
- **Nullable Reference Types** her projede aktif (`<Nullable>enable</Nullable>`).
- **Implicit usings** aktif (`<ImplicitUsings>enable</ImplicitUsings>`).
- **Warnings as Errors** açık (`TreatWarningsAsErrors=true`).
- **EditorConfig** root'ta; format zorunlu (`dotnet format` pre-commit).
- Encoding: UTF-8 (BOM yok).
- Line ending: LF.

---

## 2. Solution / Project Yapısı

`.csproj` örnek (Application):

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
    <LangVersion>latest</LangVersion>
    <AnalysisLevel>latest</AnalysisLevel>
    <EnforceCodeStyleInBuild>true</EnforceCodeStyleInBuild>
  </PropertyGroup>
</Project>
```

---

## 3. C# Stil Kuralları

### Class / Record / Struct

- **`sealed` default** — inheritance bilinçli açılır.
- **`record` for immutable data** (DTO, Command, Query, Domain event).
- **`class` for behavior** (Service, Handler).
- **Primary constructor** kullan kısa sınıflar için:
  ```csharp
  public sealed class StudentService(IStudentRepository repo, ITenantContext tenant)
  {
      // ...
  }
  ```

### Method

- **Async/await** zorunlu I/O operasyonlarda.
- **`CancellationToken`** her async metoda parametre olarak gelir.
- **Tek satır method body için expression-bodied** (`=>`) kullan:
  ```csharp
  public string FullName => $"{FirstName} {LastName}";
  ```

### Naming (Detay: `naming-conventions.md`)

- `PascalCase`: class, method, property, constant
- `_camelCase`: private field
- `camelCase`: local, parameter
- Async metod: `Async` suffix
- Boolean: `Is`, `Has`, `Can` prefix

### Domain Entity Base Class Kuralı

Her domain entity'si **kapsamına göre** iki base class'tan birini
miras almak zorundadır:

| Kapsam | Base Class | Eklenen alanlar |
|--------|-----------|-----------------|
| **Tenant-scope** (her okula özel) | `TenantEntity` | `SchoolId` + audit + soft delete + `RowVersion` |
| **Master / lookup** (tüm tenant'ların paylaştığı global referans) | `MasterEntity` | audit + soft delete + `RowVersion` (SchoolId yok) |

Her iki base class da `AggregateRoot`'tan türer; dolayısıyla domain event
yeteneği ücretsiz gelir.

Hiyerarşi:

```
Entity (Id, equality)
└── AggregateRoot (+ DomainEvents)
    ├── TenantEntity (+ SchoolId + audit + soft delete + RowVersion)
    │   ├── BellSchedule
    │   ├── Holiday
    │   ├── ModuleConfig
    │   ├── NotificationConfig
    │   ├── SchoolSettings
    │   └── ... (yeni tüm tenant entity'leri)
    └── MasterEntity (+ audit + soft delete + RowVersion)
        ├── Country
        ├── Province
        ├── District
        ├── Neighborhood
        └── ... (yeni tüm master / lookup entity'leri)
```

#### Otomatik davranışlar

- `AuditingInterceptor` `IAuditableEntity` implement eden her entity için
  `CreatedAt/By` ve `UpdatedAt/By` alanlarını otomatik doldurur.
- `SoftDeleteInterceptor` `ISoftDeletable` implement eden entity için
  `Remove(...)` çağrısını otomatik olarak soft delete'e çevirir.
- `OksisDbContext.OnModelCreating` her iki base için global query
  filter'ı (tenant filter, soft delete filter) otomatik bağlar.

#### Kurallar

- ✅ **Yeni tenant entity** → `: TenantEntity` zorunlu. Manuel `SchoolId`,
  audit, soft delete kolonu tanımlanmaz.
- ✅ **Yeni master / lookup entity** → `: MasterEntity` zorunlu. Audit
  alanları seed sırasında bile (interceptor `Guid.Empty` ile düşer)
  otomatik dolar.
- ✅ EF Core konfigürasyonunda audit + soft delete + `RowVersion`
  mapping'i her tabloda zorunlu (`database-rules.md §2`).
- ✅ Domain event raise edilmeyecek olsa bile konfigürasyonda
  `builder.Ignore(x => x.DomainEvents)` ile EF Core'a sızması engellenir.
- ✅ Soft delete'i olan unique index'lere `HasFilter("is_deleted = 0")`
  partial index uygulanır (silinmiş kayıt unique slot tutmasın).
- ⚠️ **Tek istisna:** `School` — kendisi tenant olduğu için `SchoolId`
  taşımaz ve `TenantEntity`'den türemez; doğrudan `AggregateRoot` +
  `IAuditableEntity` + `RowVersion` implement eder. Yeni böyle bir
  istisna açmadan önce mimari onay alınır.
- ❌ `IHasTenant`, `IAuditableEntity`, `ISoftDeletable` interface'lerini
  doğrudan entity'ye elle implement etmek yasak (iki base class hepsini
  zaten sağlar). Tek istisna: yukarıdaki `School`.
- ❌ Düz `Entity` veya `AggregateRoot`'tan türemek yasak — entity ya
  `TenantEntity` ya `MasterEntity`'dir.
- ❌ `SchoolId` property'sini override etmek veya `public set` yapmak yasak.

---

## 4. Async / Await

### Kurallar
- ✅ Her async metod `Task` veya `Task<T>` döndürür.
- ✅ `ConfigureAwait(false)` library code'da; ASP.NET Core'da gereksiz (SynchronizationContext yok).
- ✅ `async void` **YASAK** (event handler hariç, OKSİS'te kullanılmaz).
- ✅ `Task.Result` / `.Wait()` **YASAK** — deadlock riski.
- ✅ Sync metoddan async çağırmak için → metodu da async yap.
- ✅ Fire-and-forget gerekiyorsa: `_ = Task.Run(...)` ya da `BackgroundService` / Hangfire.

### CancellationToken

```csharp
public async Task<Result<StudentDto>> Handle(GetStudentByIdQuery request, CancellationToken cancellationToken)
{
    var student = await _dbContext.Students
        .Where(s => s.Id == request.Id)
        .FirstOrDefaultAsync(cancellationToken);  // ← cancellation propagate
    // ...
}
```

---

## 5. Dependency Injection

### Lifetime Kuralları

| Tip | Lifetime | Örnek |
|---|---|---|
| DbContext | `Scoped` | `ApplicationDbContext` |
| Repository (varsa) | `Scoped` | `IStudentRepository` |
| Domain service | `Scoped` | `INotificationRecipientResolver` |
| HTTP client (named) | `Scoped` (factory) | `IHttpClientFactory` |
| Singleton infra | `Singleton` | `IFcmProvider`, `IDateTimeProvider` |
| MediatR handler | `Transient` (varsayılan) | Tüm handler'lar |

### Registration

```csharp
public static IServiceCollection AddApplication(this IServiceCollection services)
{
    services.AddMediatR(cfg => cfg.RegisterServicesFromAssemblyContaining<IApplicationMarker>());
    services.AddValidatorsFromAssemblyContaining<IApplicationMarker>();
    services.AddScoped(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
    services.AddScoped(typeof(IPipelineBehavior<,>), typeof(TenantContextBehavior<,>));
    // ...
    return services;
}
```

- Her layer kendi `DependencyInjection.cs` extension method'unu sağlar.
- `Program.cs` minimal: `builder.Services.AddApplication().AddInfrastructure(config).AddApi();`

---

## 6. Service / Handler Pattern

### Command Handler Şablonu

```csharp
public sealed class CreateStudentCommandHandler(
    IApplicationDbContext db,
    ITenantContext tenant,
    ICurrentUser currentUser) : IRequestHandler<CreateStudentCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(CreateStudentCommand request, CancellationToken ct)
    {
        // 1. Domain validation (business rule)
        var existing = await db.Students
            .AnyAsync(s => s.NationalId == request.NationalId, ct);
        if (existing) return Result<Guid>.Failure(StudentErrors.NationalIdAlreadyExists);
        
        // 2. Create entity
        var student = Student.Create(
            schoolId: tenant.SchoolId,
            firstName: request.FirstName,
            lastName: request.LastName,
            nationalId: request.NationalId,
            createdBy: currentUser.Id);
        
        // 3. Persist
        db.Students.Add(student);
        await db.SaveChangesAsync(ct);
        
        // 4. Return
        return Result<Guid>.Success(student.Id);
    }
}
```

### Query Handler Şablonu

```csharp
public sealed class GetStudentByIdQueryHandler(
    IApplicationDbContext db,
    IMapper mapper) : IRequestHandler<GetStudentByIdQuery, Result<StudentDetailDto>>
{
    public async Task<Result<StudentDetailDto>> Handle(GetStudentByIdQuery request, CancellationToken ct)
    {
        var dto = await db.Students
            .AsNoTracking()
            .Where(s => s.Id == request.Id)
            .ProjectToType<StudentDetailDto>()  // Mapster
            .FirstOrDefaultAsync(ct);
        
        return dto is null
            ? Result<StudentDetailDto>.NotFound()
            : Result<StudentDetailDto>.Success(dto);
    }
}
```

### Yasak
- ❌ Handler içinde başka handler çağırmak (`_mediator.Send(...)`) — ortak mantığı **domain service**'e taşı.
- ❌ Handler içinde DbContext dışında external API call'a senkron çağrı (timeout yönet).
- ❌ Handler içinde 50+ satır business logic (ayrı domain service'e taşı).

---

## 7. Repository / DbContext

**MVP'de Repository pattern KULLANILMAZ.** EF Core DbContext doğrudan handler'a inject edilir. Sadece şu durumlarda repository: 
- Karmaşık query reuse > 3 yer.
- Domain spesifik soyutlama gerekiyor.

### IApplicationDbContext Interface

```csharp
public interface IApplicationDbContext
{
    DbSet<Student> Students { get; }
    DbSet<Attendance> Attendances { get; }
    // ...
    Task<int> SaveChangesAsync(CancellationToken ct = default);
}
```

Application sadece interface görür, EF Core referansı yok.

---

## 8. Validation (FluentValidation)

### Kural Tek Sorumluluk

```csharp
public sealed class CreateStudentCommandValidator : AbstractValidator<CreateStudentCommand>
{
    public CreateStudentCommandValidator()
    {
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.NationalId).NotEmpty().Length(11).Matches(@"^\d{11}$");
        RuleFor(x => x.BirthDate).LessThan(DateTime.UtcNow);
        RuleFor(x => x.ClassRoomId).NotEmpty();
    }
}
```

- **Sadece input validation** (formatik, range, uzunluk).
- **Business rule validation Domain'de** (örn. "T.C. kimlik benzersiz" handler'da kontrol).

---

## 9. Mapping (Mapster)

```csharp
public sealed class StudentMappingConfig : IRegister
{
    public void Register(TypeAdapterConfig config)
    {
        config.NewConfig<Student, StudentDetailDto>()
            .Map(dest => dest.ClassRoomName, src => src.ClassRoom.Name)
            .Map(dest => dest.ParentNames, src => src.Parents.Select(p => p.User.FullName));
    }
}
```

- Configuration **bir dosyada, modül başına**.
- `ProjectToType<T>()` ile EF Core query expression olarak çevrilir (N+1'i engeller).
- **AutoMapper YASAK.**

---

## 10. Result Pattern

```csharp
public sealed record Result<T>(bool IsSuccess, T? Value, Error Error)
{
    public static Result<T> Success(T value) => new(true, value, Error.None);
    public static Result<T> Failure(Error error) => new(false, default, error);
    public static Result<T> NotFound() => new(false, default, Error.NotFound);
}

public sealed record Error(string Code, string Message)
{
    public static readonly Error None = new(string.Empty, string.Empty);
    public static readonly Error NotFound = new("Common.NotFound", "Resource not found.");
}
```

- **Exception, business case için kullanılmaz.** Result döner.
- Exception sadece: unexpected (DB error, network), validation pipeline, framework exception.
- Controller: `Result` → HTTP response mapping (`ApiResponseFilter` ile otomatik).

---

## 11. Exception Handling

### Custom Exception Hierarchy

```csharp
public abstract class DomainException : Exception
{
    protected DomainException(string code, string message) : base(message) { Code = code; }
    public string Code { get; }
}

public sealed class TenantMismatchException : DomainException
{
    public TenantMismatchException() : base("Tenant.Mismatch", "Cross-tenant access detected.") { }
}
```

### Global Middleware

```csharp
public sealed class ExceptionHandlingMiddleware
{
    public async Task InvokeAsync(HttpContext ctx, RequestDelegate next)
    {
        try { await next(ctx); }
        catch (ValidationException ex) { /* 400 */ }
        catch (DomainException ex) { /* 422 */ }
        catch (TenantMismatchException ex) { /* 403 + log critical */ }
        catch (Exception ex) { /* 500 + log */ }
    }
}
```

> Detay: `backend/logging-error-rules.md`

---

## 12. EF Core

- ✅ **AsNoTracking** read-only query.
- ✅ **Compiled queries** sık çağrılan query'lerde (performans).
- ✅ **Global Query Filter** tenant + soft delete için.
- ✅ **Interceptors**: `AuditingInterceptor`, `SoftDeleteInterceptor`, `DomainEventInterceptor`.
- ✅ **Fluent API** entity configuration (DataAnnotations YASAK).
- ✅ **DateTime UTC** her zaman.

### Yasak
- ❌ `_dbContext.Database.ExecuteSqlRaw(...)` parametresiz.
- ❌ Lazy loading.
- ❌ `Find()` (tenant filter atlatabilir; `FirstOrDefaultAsync` kullan).
- ❌ `SaveChanges` (sync) — her zaman `SaveChangesAsync`.

> Detay: `backend/database-rules.md`

---

## 13. Logging (Serilog)

- ✅ **Structured log** (`Log.Information("Student {StudentId} created", id)`).
- ❌ **String interpolation log YASAK** (`Log.Information($"Student {id}")` — searchable değil).
- ✅ `LogContext.PushProperty("CorrelationId", id)` middleware'de.
- ✅ Log level: `Information` happy path, `Warning` recoverable, `Error` exception, `Critical` data corruption / security incident.

> Detay: `backend/logging-error-rules.md`

---

## 14. API Controller

```csharp
[ApiController]
[Route("api/v1/[controller]")]
public sealed class StudentsController(ISender mediator) : ControllerBase
{
    [HttpGet]
    [RequirePermission("students.view")]
    public async Task<IActionResult> List([FromQuery] ListStudentsQuery query, CancellationToken ct)
        => (await mediator.Send(query, ct)).ToHttpResult();
    
    [HttpGet("{id:guid}")]
    [RequirePermission("students.view-detail")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
        => (await mediator.Send(new GetStudentByIdQuery(id), ct)).ToHttpResult();
    
    [HttpPost]
    [RequirePermission("students.create")]
    public async Task<IActionResult> Create([FromBody] CreateStudentCommand command, CancellationToken ct)
        => (await mediator.Send(command, ct)).ToHttpResult();
}
```

- Controller'lar ince — mediator'a delege eder.
- Action method tek satır (mediator.Send + ToHttpResult).
- Validation pipeline behavior'da.

---

## 15. Yasaklar Özet

❌ AutoMapper (Mapster)
❌ Repository pattern üzerine ek soyutlama
❌ Sync I/O (`File.ReadAllText`, `HttpClient.GetString`)
❌ `Task.Run` ASP.NET Core içinde (thread pool starvation)
❌ `async void`
❌ Static state
❌ Singleton DbContext
❌ Public entity setter (constructor / static factory ile)
❌ Lazy loading
❌ Exception ile control flow
❌ Magic string (sabit, enum, veya constant kullan)
