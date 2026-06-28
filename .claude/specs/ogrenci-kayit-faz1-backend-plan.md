# Öğrenci Kayıt — Faz 1A (Backend) Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `StudentEnrollment` çekirdek domainini + `EnrollStudent` tek-transaction orkestrasyonunu + sihirbaz query'lerini (TCKN mükerrer, şube doluluk, veli arama) gerçek uçlarla ayağa kaldırmak.

**Architecture:** Yeni `Oksis.Domain/Modules/Students` aggregate'i (`StudentEnrollment`) idari/sezon kaydını tutar; `ClassRoomStudent` defteri şube yerleştirmesinin tek doğruluk kaynağı olarak korunur (BR-students-001). `EnrollStudent` handler'ı mevcut `Person`/`StudentProfile`/`ParentStudentRelationship`/`ClassRoom.AssignStudent` parçalarını **tek `TransactionBehavior` transaction'ında** birleştirir; davet/hesap yan etkisi `StudentEnrolledEvent` → `DomainEventInterceptor` (post-save publish) → `IPostCommitDispatcher` (Hangfire) ile **transaction dışına** taşınır.

**Tech Stack:** .NET 10 · Clean Architecture + CQRS (MediatR) · EF Core 10 (SQL Server) · FluentValidation · Mapster · Result pattern (`Oksis.Shared`) · xUnit + FluentAssertions + NSubstitute + MockQueryable (unit) · Testcontainers MsSql (integration).

## Global Constraints

- Bağlayıcı spec: `.claude/specs/ogrenci-kayit-enrollment-spec.md` — maddeler `E*` non-negotiable. Çakışmada dur ve bildir (CLAUDE.md Absolute Rule #6).
- **E2.3:** Öğrenci no kişiye sabit; `StudentEnrollment`'ta `EnrollmentNo` YOK; kalıcı `StudentProfile.StudentNumber` yalnız ilk kayıtta üretilir.
- **E1.3/BR-students-001:** Şube üyeliğinin tek doğruluk kaynağı `ClassRoomStudent`; `StudentEnrollment.ClassRoomId` aktif `ClassRoomStudent` ile tutarlı; defter değiştirilmez.
- **E5.2:** Davet/SMS/FCM transaction içinde YAPILMAZ → event + post-commit dispatcher.
- **E5.3:** `EnrollStudentCommand` `ClientRequestId` taşır; aynı key ikinci kez işlenmez.
- **E11.4:** Şube kapasitesi enrollment'ta **HARD** (dolu şubeye yerleştirme reddedilir) — `ClassRoom.Capacity` domain'de SOFT olduğundan kontrol **handler'da**.
- **E2.2 / ADR-001 Aşama 1:** Kayıt yalnız `Person`/`Account`/`Profile` yazar; legacy `User`'a **dokunulmaz**.
- Çok kiracılılık: her entity `TenantEntity` (SchoolId), `[Tenancy(TenancyMode.Required)]`, `tenant.CurrentSchoolId` null → `Result.Forbidden()`.
- Naming: `Mark`=not, `Grade`=sınıf seviyesi. Domain Türkçe kavram, identifier İngilizce. Commit: OKSİS formatı `YYYY-MM-DD <type>: özet.` + co-author trailer'ları.
- Schema: yeni tablolar `academic` şeması (`ToAcademicTable`), `class_room_students` ile cohesion.
- EF config'leri `ApplyConfigurationsFromAssembly` ile otomatik bulunur — yeni config dosyasını `Persistence/Configurations/Academic/` altına koymak yeterli.

---

## Dosya Yapısı

**Domain (`oksis-api/src/Oksis.Domain/Modules/Students/`):**
- `Entities/StudentEnrollment.cs` — yeni aggregate (idari sezon kaydı)
- `Entities/StudentDocument.cs` — belge modeli (UI Faz 5; model şimdi)
- `Enums/EnrollmentType.cs`, `Enums/EnrollmentStatus.cs`, `Enums/RenewalIntent.cs`, `Enums/DocumentType.cs`, `Enums/DocumentStatus.cs`
- `Events/StudentEnrolledEvent.cs`
- `Exceptions/StudentsDomainException.cs`, `Exceptions/InvalidEnrollmentStateException.cs`

**Application (`oksis-api/src/Oksis.Application/`):**
- `Common/Abstractions/IStudentNumberGenerator.cs`
- `Modules/Students/Commands/EnrollStudent/{EnrollStudentCommand,EnrollStudentResult,EnrollStudentCommandValidator,EnrollStudentCommandHandler}.cs`
- `Modules/Students/Queries/CheckNationalIdDuplicate/{CheckNationalIdDuplicateQuery,NationalIdDuplicateDto,...Handler}.cs`
- `Modules/Students/Queries/GetBranchCapacity/{GetBranchCapacityQuery,BranchCapacityDto,...Handler}.cs`
- `Modules/Students/Queries/SearchGuardians/{SearchGuardiansQuery,GuardianSearchItemDto,...Handler}.cs`
- `Modules/Students/Events/StudentEnrolledEventHandler.cs`

**Infrastructure (`oksis-api/src/Oksis.Infrastructure/`):**
- `Persistence/Configurations/Academic/{StudentEnrollmentConfiguration,StudentDocumentConfiguration,EnrollmentIdempotencyConfiguration}.cs`
- `Persistence/Identity/StudentNumberGenerator.cs` (impl)
- `Persistence/Migrations/<generated>` (EF migration)
- `Domain/Modules/Students/Entities/EnrollmentIdempotency.cs` (idempotency kaydı — domain altında değil; basit kayıt: bkz. Task 5)

**Api (`oksis-api/src/Oksis.Api/`):**
- `Controllers/V1/StudentsController.cs` — `:enroll`, `:transfer-in`, `check-national-id`; `BranchesController`/`GuardiansController` (veya StudentsController altında) capacity + guardian search.

**IApplicationDbContext / OksisDbContext:** yeni `DbSet`'ler.

**Permissions:** `students.view/create/update/...` seed.

**Testler:**
- `tests/Oksis.Application.UnitTests/Modules/Students/...` (handler/validator unit)
- `tests/Oksis.Infrastructure.IntegrationTests/Students/...` (EnrollStudent + generator gerçek SQL)

---

## Task 1: Domain enum'ları

**Files:**
- Create: `oksis-api/src/Oksis.Domain/Modules/Students/Enums/EnrollmentType.cs`
- Create: `oksis-api/src/Oksis.Domain/Modules/Students/Enums/EnrollmentStatus.cs`
- Create: `oksis-api/src/Oksis.Domain/Modules/Students/Enums/RenewalIntent.cs`
- Create: `oksis-api/src/Oksis.Domain/Modules/Students/Enums/DocumentType.cs`
- Create: `oksis-api/src/Oksis.Domain/Modules/Students/Enums/DocumentStatus.cs`

**Interfaces:**
- Produces: enum'lar `EnrollmentType`, `EnrollmentStatus`, `RenewalIntent`, `DocumentType`, `DocumentStatus` — Task 2/3/6'da kullanılır.

- [ ] **Step 1: Enum dosyalarını yaz** (E4.3)

```csharp
namespace Oksis.Domain.Modules.Students.Enums;

public enum EnrollmentType { New = 1, TransferIn = 2, Renewal = 3 }
```
```csharp
namespace Oksis.Domain.Modules.Students.Enums;

public enum EnrollmentStatus
{
    Draft = 1, Active = 2, Frozen = 3,
    TransferredOut = 4, Withdrawn = 5, Graduated = 6, Archived = 7
}
```
```csharp
namespace Oksis.Domain.Modules.Students.Enums;

public enum RenewalIntent { Renewing = 1, Undecided = 2, Leaving = 3 }
```
```csharp
namespace Oksis.Domain.Modules.Students.Enums;

public enum DocumentType { Nufus = 1, Foto = 2, Diploma = 3, Saglik = 4, Sozlesme = 5, Diger = 6 }
```
```csharp
namespace Oksis.Domain.Modules.Students.Enums;

public enum DocumentStatus { Missing = 1, Uploaded = 2, Approved = 3, Rejected = 4 }
```

- [ ] **Step 2: Build**

Run: `cd oksis-api && dotnet build src/Oksis.Domain`
Expected: PASS (derlenir).

- [ ] **Step 3: Commit**

```bash
cd oksis-api && git add src/Oksis.Domain/Modules/Students/Enums
git commit -m "2026-06-29 feat: Öğrenci kayıt enum'ları (EnrollmentType/Status, RenewalIntent, Document) eklendi."
```

---

## Task 2: `StudentEnrollment` aggregate + state machine

**Files:**
- Create: `oksis-api/src/Oksis.Domain/Modules/Students/Exceptions/StudentsDomainException.cs`
- Create: `oksis-api/src/Oksis.Domain/Modules/Students/Exceptions/InvalidEnrollmentStateException.cs`
- Create: `oksis-api/src/Oksis.Domain/Modules/Students/Events/StudentEnrolledEvent.cs`
- Create: `oksis-api/src/Oksis.Domain/Modules/Students/Entities/StudentEnrollment.cs`
- Test: `tests/Oksis.Domain.UnitTests/Modules/Students/StudentEnrollmentTests.cs`

**Interfaces:**
- Consumes: enum'lar (Task 1); `TenantEntity`, `AggregateRoot.Raise`, `IDomainEvent` (mevcut).
- Produces: `StudentEnrollment.Create(schoolId, studentPersonId, academicSessionId, gradeLevel, classRoomId, enrollmentDate, type, previousSchool)` → Draft; `Activate()`; `Freeze()/Resume()`; `Withdraw()`; `Graduate()`; `TransferOut()`; `Archive()`; `SetClassRoom(Guid?)`; `SetRenewalIntent(RenewalIntent)`. `StudentEnrolledEvent(EnrollmentId, SchoolId, StudentPersonId, AcademicSessionId, Type, Invite, GuardianPersonIds)`.

- [ ] **Step 1: Failing test yaz**

```csharp
using FluentAssertions;
using Oksis.Domain.Modules.Students.Entities;
using Oksis.Domain.Modules.Students.Enums;
using Oksis.Domain.Modules.Students.Exceptions;
using Xunit;

namespace Oksis.Domain.UnitTests.Modules.Students;

public sealed class StudentEnrollmentTests
{
    private static StudentEnrollment NewDraft() => StudentEnrollment.Create(
        schoolId: Guid.NewGuid(), studentPersonId: Guid.NewGuid(),
        academicSessionId: Guid.NewGuid(), gradeLevel: 5, classRoomId: Guid.NewGuid(),
        enrollmentDate: new DateOnly(2026, 9, 1), type: EnrollmentType.New, previousSchool: null);

    [Fact]
    public void Create_starts_in_draft()
    {
        var e = NewDraft();
        e.Status.Should().Be(EnrollmentStatus.Draft);
        e.Type.Should().Be(EnrollmentType.New);
    }

    [Fact]
    public void Activate_moves_draft_to_active()
    {
        var e = NewDraft();
        e.Activate();
        e.Status.Should().Be(EnrollmentStatus.Active);
    }

    [Fact]
    public void Withdraw_from_draft_is_invalid()
    {
        var e = NewDraft();
        var act = () => e.Withdraw();
        act.Should().Throw<InvalidEnrollmentStateException>();
    }

    [Fact]
    public void TransferIn_requires_previous_school()
    {
        var act = () => StudentEnrollment.Create(
            Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), 5, Guid.NewGuid(),
            new DateOnly(2026, 9, 1), EnrollmentType.TransferIn, previousSchool: null);
        act.Should().Throw<StudentsDomainException>();
    }
}
```

- [ ] **Step 2: Test'in fail ettiğini gör**

Run: `cd oksis-api && dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~StudentEnrollmentTests"`
Expected: FAIL (StudentEnrollment yok / derlenmiyor).

- [ ] **Step 3: Exception + event + aggregate'i yaz**

```csharp
namespace Oksis.Domain.Modules.Students.Exceptions;

public class StudentsDomainException(string code, string message) : Exception(message)
{
    public string Code { get; } = code;
}
```
```csharp
namespace Oksis.Domain.Modules.Students.Exceptions;

public sealed class InvalidEnrollmentStateException(string message)
    : StudentsDomainException("Students.Enrollment.InvalidState", message);
```
```csharp
using Oksis.Domain.Common;
using Oksis.Domain.Modules.Students.Enums;

namespace Oksis.Domain.Modules.Students.Events;

public sealed record StudentEnrolledEvent(
    Guid EnrollmentId,
    Guid SchoolId,
    Guid StudentPersonId,
    Guid AcademicSessionId,
    EnrollmentType Type,
    bool Invite,
    IReadOnlyList<Guid> GuardianPersonIds) : IDomainEvent
{
    public DateTimeOffset OccurredAt { get; } = DateTimeOffset.UtcNow;
}
```
```csharp
using Oksis.Domain.Common;
using Oksis.Domain.Modules.Students.Enums;
using Oksis.Domain.Modules.Students.Exceptions;

namespace Oksis.Domain.Modules.Students.Entities;

public sealed class StudentEnrollment : TenantEntity
{
    public const int MaxPreviousSchoolLength = 200;

    public Guid StudentPersonId { get; private set; }
    public Guid AcademicSessionId { get; private set; }
    public int GradeLevel { get; private set; }
    public Guid? ClassRoomId { get; private set; }
    public DateOnly EnrollmentDate { get; private set; }
    public EnrollmentType Type { get; private set; }
    public EnrollmentStatus Status { get; private set; }
    public string? PreviousSchool { get; private set; }
    public RenewalIntent? Intent { get; private set; }

    private StudentEnrollment() { } // EF Core

    public static StudentEnrollment Create(
        Guid schoolId, Guid studentPersonId, Guid academicSessionId, int gradeLevel,
        Guid? classRoomId, DateOnly enrollmentDate, EnrollmentType type, string? previousSchool)
    {
        if (studentPersonId == Guid.Empty)
            throw new StudentsDomainException("Students.Enrollment.StudentRequired", "Öğrenci kimliği zorunludur.");
        if (academicSessionId == Guid.Empty)
            throw new StudentsDomainException("Students.Enrollment.SessionRequired", "Akademik sezon zorunludur.");
        if (type == EnrollmentType.TransferIn && string.IsNullOrWhiteSpace(previousSchool))
            throw new StudentsDomainException("Students.Enrollment.PreviousSchoolRequired", "Nakil gelende geldiği okul zorunludur.");
        if (previousSchool is { Length: > MaxPreviousSchoolLength })
            throw new StudentsDomainException("Students.Enrollment.PreviousSchoolTooLong", "Geldiği okul adı çok uzun.");

        return new StudentEnrollment
        {
            SchoolId = schoolId,
            StudentPersonId = studentPersonId,
            AcademicSessionId = academicSessionId,
            GradeLevel = gradeLevel,
            ClassRoomId = classRoomId,
            EnrollmentDate = enrollmentDate,
            Type = type,
            Status = EnrollmentStatus.Draft,
            PreviousSchool = string.IsNullOrWhiteSpace(previousSchool) ? null : previousSchool.Trim()
        };
    }

    public void Activate()
    {
        if (Status != EnrollmentStatus.Draft)
            throw new InvalidEnrollmentStateException($"Draft olmayan kayıt aktive edilemez (mevcut: {Status}).");
        Status = EnrollmentStatus.Active;
    }

    public void Freeze()
    {
        if (Status != EnrollmentStatus.Active)
            throw new InvalidEnrollmentStateException($"Yalnız aktif kayıt dondurulabilir (mevcut: {Status}).");
        Status = EnrollmentStatus.Frozen;
    }

    public void Resume()
    {
        if (Status != EnrollmentStatus.Frozen)
            throw new InvalidEnrollmentStateException($"Yalnız dondurulmuş kayıt çözülebilir (mevcut: {Status}).");
        Status = EnrollmentStatus.Active;
    }

    public void Withdraw()
    {
        if (Status != EnrollmentStatus.Active)
            throw new InvalidEnrollmentStateException($"Yalnız aktif kayıt ayrılabilir (mevcut: {Status}).");
        Status = EnrollmentStatus.Withdrawn;
    }

    public void TransferOut()
    {
        if (Status != EnrollmentStatus.Active)
            throw new InvalidEnrollmentStateException($"Yalnız aktif kayıt nakil çıkışı yapabilir (mevcut: {Status}).");
        Status = EnrollmentStatus.TransferredOut;
    }

    public void Graduate()
    {
        if (Status != EnrollmentStatus.Active)
            throw new InvalidEnrollmentStateException($"Yalnız aktif kayıt mezun edilebilir (mevcut: {Status}).");
        Status = EnrollmentStatus.Graduated;
    }

    public void Archive()
    {
        if (Status is not (EnrollmentStatus.Graduated or EnrollmentStatus.Withdrawn or EnrollmentStatus.TransferredOut))
            throw new InvalidEnrollmentStateException($"Bu durumdan arşive geçilemez (mevcut: {Status}).");
        Status = EnrollmentStatus.Archived;
    }

    public void SetClassRoom(Guid? classRoomId) => ClassRoomId = classRoomId;

    public void SetRenewalIntent(RenewalIntent intent) => Intent = intent;
}
```

- [ ] **Step 4: Test'in geçtiğini gör**

Run: `cd oksis-api && dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~StudentEnrollmentTests"`
Expected: PASS (4 test).

- [ ] **Step 5: Commit**

```bash
cd oksis-api && git add src/Oksis.Domain/Modules/Students tests/Oksis.Domain.UnitTests/Modules/Students
git commit -m "2026-06-29 feat,test: StudentEnrollment aggregate + state machine + StudentEnrolledEvent."
```

---

## Task 3: `StudentDocument` aggregate (model)

**Files:**
- Create: `oksis-api/src/Oksis.Domain/Modules/Students/Entities/StudentDocument.cs`
- Test: `tests/Oksis.Domain.UnitTests/Modules/Students/StudentDocumentTests.cs`

**Interfaces:**
- Produces: `StudentDocument.Create(schoolId, studentPersonId, enrollmentId?, type)` → Missing; `Upload(fileUrl, expiry?)`; `Approve()`; `Reject()`.

- [ ] **Step 1: Failing test**

```csharp
using FluentAssertions;
using Oksis.Domain.Modules.Students.Entities;
using Oksis.Domain.Modules.Students.Enums;
using Xunit;

namespace Oksis.Domain.UnitTests.Modules.Students;

public sealed class StudentDocumentTests
{
    [Fact]
    public void Create_starts_missing()
    {
        var d = StudentDocument.Create(Guid.NewGuid(), Guid.NewGuid(), null, DocumentType.Nufus);
        d.Status.Should().Be(DocumentStatus.Missing);
    }

    [Fact]
    public void Upload_sets_uploaded_with_url()
    {
        var d = StudentDocument.Create(Guid.NewGuid(), Guid.NewGuid(), null, DocumentType.Foto);
        d.Upload("https://blob/x.jpg", null);
        d.Status.Should().Be(DocumentStatus.Uploaded);
        d.FileUrl.Should().Be("https://blob/x.jpg");
    }
}
```

- [ ] **Step 2: Fail gör**

Run: `cd oksis-api && dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~StudentDocumentTests"`
Expected: FAIL.

- [ ] **Step 3: Entity yaz**

```csharp
using Oksis.Domain.Common;
using Oksis.Domain.Modules.Students.Enums;
using Oksis.Domain.Modules.Students.Exceptions;

namespace Oksis.Domain.Modules.Students.Entities;

public sealed class StudentDocument : TenantEntity
{
    public Guid StudentPersonId { get; private set; }
    public Guid? EnrollmentId { get; private set; }
    public DocumentType Type { get; private set; }
    public DocumentStatus Status { get; private set; }
    public string? FileUrl { get; private set; }
    public DateOnly? ExpiryDate { get; private set; }

    private StudentDocument() { }

    public static StudentDocument Create(Guid schoolId, Guid studentPersonId, Guid? enrollmentId, DocumentType type)
    {
        if (studentPersonId == Guid.Empty)
            throw new StudentsDomainException("Students.Document.StudentRequired", "Öğrenci kimliği zorunludur.");
        return new StudentDocument
        {
            SchoolId = schoolId, StudentPersonId = studentPersonId,
            EnrollmentId = enrollmentId, Type = type, Status = DocumentStatus.Missing
        };
    }

    public void Upload(string fileUrl, DateOnly? expiry)
    {
        if (string.IsNullOrWhiteSpace(fileUrl))
            throw new StudentsDomainException("Students.Document.FileRequired", "Dosya adresi zorunludur.");
        FileUrl = fileUrl; ExpiryDate = expiry; Status = DocumentStatus.Uploaded;
    }

    public void Approve() => Status = DocumentStatus.Approved;
    public void Reject() => Status = DocumentStatus.Rejected;
}
```

- [ ] **Step 4: Pass gör**

Run: `cd oksis-api && dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~StudentDocumentTests"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd oksis-api && git add src/Oksis.Domain/Modules/Students/Entities/StudentDocument.cs tests/Oksis.Domain.UnitTests/Modules/Students/StudentDocumentTests.cs
git commit -m "2026-06-29 feat,test: StudentDocument aggregate (belge modeli, UI Faz 5)."
```

---

## Task 4: `IStudentNumberGenerator` (atomik öğrenci no üreteci)

**Files:**
- Create: `oksis-api/src/Oksis.Application/Common/Abstractions/IStudentNumberGenerator.cs`
- Create: `oksis-api/src/Oksis.Infrastructure/Persistence/Identity/StudentNumberGenerator.cs`
- Modify: `oksis-api/src/Oksis.Infrastructure/DependencyInjection.cs` (servis kaydı — mevcut dosyada `services.AddScoped<...>` desenini izle)
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Students/StudentNumberGeneratorTests.cs`

**Interfaces:**
- Produces: `IStudentNumberGenerator.NextAsync(Guid schoolId, int year, CancellationToken) → Task<string>` — format `{year}{5-hane}` (örn. `202600001`), tenant+yıl bazlı atomik artan. EnrollStudent handler (Task 10) tüketir.

> **Not (E2.3):** Üreteç yalnız Person'ın `StudentProfile.StudentNumber`'ı boşken çağrılır. Atomiklik: dedikli sayaç tablosu (`academic.student_number_counters`) + `UPDATE ... OUTPUT` (rowlock). Tablo migration'da Task 6'da oluşturulur.

- [ ] **Step 1: Failing integration test**

```csharp
using FluentAssertions;
using Oksis.Infrastructure.IntegrationTests.Fixtures;
using Oksis.Infrastructure.Persistence.Identity;
using Xunit;

namespace Oksis.Infrastructure.IntegrationTests.Students;

[Collection(DatabaseCollection.Name)]
public sealed class StudentNumberGeneratorTests(DatabaseFixture fixture) : IAsyncLifetime
{
    public async Task InitializeAsync() => await fixture.EnsureDatabaseCreatedAsync();
    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task NextAsync_returns_sequential_per_school_year()
    {
        var schoolId = Guid.NewGuid();
        await using var db = fixture.CreateDbContext(schoolId);
        var gen = new StudentNumberGenerator(db);

        var a = await gen.NextAsync(schoolId, 2026, default);
        var b = await gen.NextAsync(schoolId, 2026, default);

        a.Should().Be("202600001");
        b.Should().Be("202600002");
    }
}
```

- [ ] **Step 2: Fail gör**

Run: `cd oksis-api && dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~StudentNumberGeneratorTests"`
Expected: FAIL (tip yok).

- [ ] **Step 3: Interface + impl yaz**

```csharp
namespace Oksis.Application.Common.Abstractions;

public interface IStudentNumberGenerator
{
    Task<string> NextAsync(Guid schoolId, int year, CancellationToken cancellationToken);
}
```
```csharp
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;

namespace Oksis.Infrastructure.Persistence.Identity;

public sealed class StudentNumberGenerator(IApplicationDbContext db) : IStudentNumberGenerator
{
    public async Task<string> NextAsync(Guid schoolId, int year, CancellationToken cancellationToken)
    {
        // Atomik artış: yoksa 1 ile ekle, varsa +1; OUTPUT ile yeni değeri al.
        var sql = @"
MERGE academic.student_number_counters AS t
USING (SELECT @schoolId AS school_id, @year AS [year]) AS s
ON t.school_id = s.school_id AND t.[year] = s.[year]
WHEN MATCHED THEN UPDATE SET next_value = t.next_value + 1
WHEN NOT MATCHED THEN INSERT (school_id, [year], next_value) VALUES (s.school_id, s.[year], 1)
OUTPUT inserted.next_value;";

        var p1 = new Microsoft.Data.SqlClient.SqlParameter("@schoolId", schoolId);
        var p2 = new Microsoft.Data.SqlClient.SqlParameter("@year", year);
        var next = await db.Database
            .SqlQueryRaw<int>(sql, p1, p2)
            .SingleAsync(cancellationToken);

        return $"{year}{next:D5}";
    }
}
```

- [ ] **Step 4: Servis kaydı** — `DependencyInjection.cs` içinde mevcut `AddScoped` bloğuna ekle:

```csharp
services.AddScoped<IStudentNumberGenerator, StudentNumberGenerator>();
```

- [ ] **Step 5: Pass gör** (Task 6 migration sonrası tekrar koşulur; şimdilik derleme + tablo eklenince test)

Run: `cd oksis-api && dotnet build && dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~StudentNumberGeneratorTests"`
Expected: build PASS; test Task 6 migration uygulanınca PASS (sayaç tablosu oradan gelir). Eğer test bu noktada tablo yokluğundan FAIL ederse, Task 6 tamamlanınca yeniden koş.

- [ ] **Step 6: Commit**

```bash
cd oksis-api && git add src/Oksis.Application/Common/Abstractions/IStudentNumberGenerator.cs src/Oksis.Infrastructure/Persistence/Identity/StudentNumberGenerator.cs src/Oksis.Infrastructure/DependencyInjection.cs tests/Oksis.Infrastructure.IntegrationTests/Students/StudentNumberGeneratorTests.cs
git commit -m "2026-06-29 feat,test: IStudentNumberGenerator atomik öğrenci no üreteci (tenant+yıl)."
```

---

## Task 5: Idempotency kaydı (`EnrollmentIdempotency`)

**Files:**
- Create: `oksis-api/src/Oksis.Domain/Modules/Students/Entities/EnrollmentIdempotency.cs`
- Test: `tests/Oksis.Domain.UnitTests/Modules/Students/EnrollmentIdempotencyTests.cs`

**Interfaces:**
- Produces: `EnrollmentIdempotency.Create(schoolId, clientRequestId, studentPersonId, enrollmentId)`. Unique index `(SchoolId, ClientRequestId)` (Task 6). EnrollStudent handler (Task 10) replay tespitinde kullanır.

- [ ] **Step 1: Failing test**

```csharp
using FluentAssertions;
using Oksis.Domain.Modules.Students.Entities;
using Xunit;

namespace Oksis.Domain.UnitTests.Modules.Students;

public sealed class EnrollmentIdempotencyTests
{
    [Fact]
    public void Create_sets_keys()
    {
        var crid = Guid.NewGuid();
        var rec = EnrollmentIdempotency.Create(Guid.NewGuid(), crid, Guid.NewGuid(), Guid.NewGuid());
        rec.ClientRequestId.Should().Be(crid);
    }
}
```

- [ ] **Step 2: Fail gör**

Run: `cd oksis-api && dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~EnrollmentIdempotencyTests"`
Expected: FAIL.

- [ ] **Step 3: Entity yaz**

```csharp
using Oksis.Domain.Common;

namespace Oksis.Domain.Modules.Students.Entities;

public sealed class EnrollmentIdempotency : TenantEntity
{
    public Guid ClientRequestId { get; private set; }
    public Guid StudentPersonId { get; private set; }
    public Guid EnrollmentId { get; private set; }

    private EnrollmentIdempotency() { }

    public static EnrollmentIdempotency Create(Guid schoolId, Guid clientRequestId, Guid studentPersonId, Guid enrollmentId)
        => new()
        {
            SchoolId = schoolId,
            ClientRequestId = clientRequestId,
            StudentPersonId = studentPersonId,
            EnrollmentId = enrollmentId
        };
}
```

- [ ] **Step 4: Pass gör**

Run: `cd oksis-api && dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~EnrollmentIdempotencyTests"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd oksis-api && git add src/Oksis.Domain/Modules/Students/Entities/EnrollmentIdempotency.cs tests/Oksis.Domain.UnitTests/Modules/Students/EnrollmentIdempotencyTests.cs
git commit -m "2026-06-29 feat,test: EnrollmentIdempotency kaydı (çift Kaydet koruması)."
```

---

## Task 6: EF config'leri + DbSet'ler + migration

**Files:**
- Create: `oksis-api/src/Oksis.Infrastructure/Persistence/Configurations/Academic/StudentEnrollmentConfiguration.cs`
- Create: `oksis-api/src/Oksis.Infrastructure/Persistence/Configurations/Academic/StudentDocumentConfiguration.cs`
- Create: `oksis-api/src/Oksis.Infrastructure/Persistence/Configurations/Academic/EnrollmentIdempotencyConfiguration.cs`
- Create: `oksis-api/src/Oksis.Infrastructure/Persistence/Configurations/Academic/StudentNumberCounterConfiguration.cs` (sayaç tablosu — keyless/owned değil, basit tablo; generator raw SQL kullandığından entity gerekmez → bunun yerine migration'a manuel `CreateTable`; bkz. Step 4)
- Modify: `oksis-api/src/Oksis.Application/Common/Abstractions/IApplicationDbContext.cs` (yeni DbSet'ler)
- Modify: `oksis-api/src/Oksis.Infrastructure/Persistence/OksisDbContext.cs` (yeni DbSet'ler)

**Interfaces:**
- Consumes: `StudentEnrollment`, `StudentDocument`, `EnrollmentIdempotency` (Task 2/3/5).
- Produces: `db.StudentEnrollments`, `db.StudentDocuments`, `db.EnrollmentIdempotencyRecords`; tablolar `academic.student_enrollments`, `academic.student_documents`, `academic.enrollment_idempotency`, `academic.student_number_counters`.

- [ ] **Step 1: `StudentEnrollmentConfiguration` yaz** (ClassRoomStudentConfiguration desenini birebir izle)

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Oksis.Domain.Modules.Students.Entities;

namespace Oksis.Infrastructure.Persistence.Configurations.Academic;

public sealed class StudentEnrollmentConfiguration : IEntityTypeConfiguration<StudentEnrollment>
{
    public void Configure(EntityTypeBuilder<StudentEnrollment> builder)
    {
        builder.ToAcademicTable("student_enrollments");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedNever();
        builder.Property(x => x.SchoolId).IsRequired();
        builder.Property(x => x.StudentPersonId).IsRequired();
        builder.Property(x => x.AcademicSessionId).IsRequired();
        builder.Property(x => x.GradeLevel).IsRequired();
        builder.Property(x => x.ClassRoomId);
        builder.Property(x => x.EnrollmentDate).IsRequired();
        builder.Property(x => x.Type).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(x => x.PreviousSchool).HasMaxLength(StudentEnrollment.MaxPreviousSchoolLength);
        builder.Property(x => x.Intent).HasConversion<string>().HasMaxLength(20);

        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.CreatedBy).IsRequired();
        builder.Property(x => x.IsDeleted).IsRequired().HasDefaultValue(false);
        builder.Property(x => x.RowVersion).IsRowVersion();
        builder.Ignore(x => x.DomainEvents);

        // Bir öğrenci × sezon tek aktif idari kayıt
        builder.HasIndex(x => new { x.SchoolId, x.StudentPersonId, x.AcademicSessionId })
            .IsUnique()
            .HasFilter("is_deleted = 0")
            .HasDatabaseName("ux_student_enrollments_student_session");
    }
}
```

- [ ] **Step 2: `StudentDocumentConfiguration` yaz**

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Oksis.Domain.Modules.Students.Entities;

namespace Oksis.Infrastructure.Persistence.Configurations.Academic;

public sealed class StudentDocumentConfiguration : IEntityTypeConfiguration<StudentDocument>
{
    public void Configure(EntityTypeBuilder<StudentDocument> builder)
    {
        builder.ToAcademicTable("student_documents");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedNever();
        builder.Property(x => x.SchoolId).IsRequired();
        builder.Property(x => x.StudentPersonId).IsRequired();
        builder.Property(x => x.EnrollmentId);
        builder.Property(x => x.Type).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(x => x.FileUrl).HasMaxLength(500);
        builder.Property(x => x.ExpiryDate);

        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.CreatedBy).IsRequired();
        builder.Property(x => x.IsDeleted).IsRequired().HasDefaultValue(false);
        builder.Property(x => x.RowVersion).IsRowVersion();
        builder.Ignore(x => x.DomainEvents);

        builder.HasIndex(x => new { x.SchoolId, x.StudentPersonId })
            .HasFilter("is_deleted = 0")
            .HasDatabaseName("ix_student_documents_student");
    }
}
```

- [ ] **Step 3: `EnrollmentIdempotencyConfiguration` yaz** (unique key E5.3)

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Oksis.Domain.Modules.Students.Entities;

namespace Oksis.Infrastructure.Persistence.Configurations.Academic;

public sealed class EnrollmentIdempotencyConfiguration : IEntityTypeConfiguration<EnrollmentIdempotency>
{
    public void Configure(EntityTypeBuilder<EnrollmentIdempotency> builder)
    {
        builder.ToAcademicTable("enrollment_idempotency");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedNever();
        builder.Property(x => x.SchoolId).IsRequired();
        builder.Property(x => x.ClientRequestId).IsRequired();
        builder.Property(x => x.StudentPersonId).IsRequired();
        builder.Property(x => x.EnrollmentId).IsRequired();

        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.CreatedBy).IsRequired();
        builder.Property(x => x.IsDeleted).IsRequired().HasDefaultValue(false);
        builder.Property(x => x.RowVersion).IsRowVersion();
        builder.Ignore(x => x.DomainEvents);

        builder.HasIndex(x => new { x.SchoolId, x.ClientRequestId })
            .IsUnique()
            .HasDatabaseName("ux_enrollment_idempotency_request");
    }
}
```

- [ ] **Step 4: DbSet'leri ekle** — `IApplicationDbContext.cs`:

```csharp
DbSet<StudentEnrollment> StudentEnrollments { get; }
DbSet<StudentDocument> StudentDocuments { get; }
DbSet<EnrollmentIdempotency> EnrollmentIdempotencyRecords { get; }
```
`OksisDbContext.cs`:
```csharp
public DbSet<StudentEnrollment> StudentEnrollments => Set<StudentEnrollment>();
public DbSet<StudentDocument> StudentDocuments => Set<StudentDocument>();
public DbSet<EnrollmentIdempotency> EnrollmentIdempotencyRecords => Set<EnrollmentIdempotency>();
```
(İlgili `using Oksis.Domain.Modules.Students.Entities;` ekle.)

- [ ] **Step 5: Migration üret**

Run:
```bash
cd oksis-api && dotnet ef migrations add 20260629_student_enrollment_core \
  --project src/Oksis.Infrastructure --startup-project src/Oksis.Api
```
Expected: yeni migration dosyası `Persistence/Migrations/` altında.

- [ ] **Step 6: Migration'a `student_number_counters` tablosunu elle ekle** — üretilen migration `Up`'ına ekle (entity yok, generator raw SQL kullanıyor):

```csharp
migrationBuilder.CreateTable(
    name: "student_number_counters",
    schema: "academic",
    columns: table => new
    {
        school_id = table.Column<Guid>(nullable: false),
        year = table.Column<int>(nullable: false),
        next_value = table.Column<int>(nullable: false)
    },
    constraints: table => table.PrimaryKey("pk_student_number_counters", x => new { x.school_id, x.year }));
```
`Down`'a:
```csharp
migrationBuilder.DropTable(name: "student_number_counters", schema: "academic");
```

- [ ] **Step 7: Build + DB güncelle (lokal)**

Run: `cd oksis-api && dotnet build && dotnet ef database update --project src/Oksis.Infrastructure --startup-project src/Oksis.Api`
Expected: PASS; tablolar oluşur.

- [ ] **Step 8: Task 4 generator testini yeniden koş**

Run: `cd oksis-api && dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~StudentNumberGeneratorTests"`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
cd oksis-api && git add src/Oksis.Infrastructure/Persistence src/Oksis.Application/Common/Abstractions/IApplicationDbContext.cs
git commit -m "2026-06-29 feat: StudentEnrollment/Document/Idempotency EF config + DbSet + migration (academic şeması)."
```

---

## Task 7: `CheckNationalIdDuplicateQuery`

**Files:**
- Create: `oksis-api/src/Oksis.Application/Modules/Students/Queries/CheckNationalIdDuplicate/CheckNationalIdDuplicateQuery.cs`
- Create: `.../CheckNationalIdDuplicate/NationalIdDuplicateDto.cs`
- Create: `.../CheckNationalIdDuplicate/CheckNationalIdDuplicateQueryHandler.cs`
- Test: `tests/Oksis.Application.UnitTests/Modules/Students/CheckNationalIdDuplicateQueryHandlerTests.cs`

**Interfaces:**
- Consumes: `IQuery<T>`, `INationalIdProtector.Protect(raw, IdType)`, `ITenantContext`, `db.Persons`.
- Produces: `CheckNationalIdDuplicateQuery(string NationalId, IdType IdType)` → `Result<NationalIdDuplicateDto>`; `NationalIdDuplicateDto(bool Exists, Guid? PersonId, string? FullName, string? StudentNumber)`.

- [ ] **Step 1: Failing unit test** (PublishProgramCommandHandlerTests deseni: NSubstitute + MockQueryable)

```csharp
using FluentAssertions;
using MockQueryable;
using NSubstitute;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Modules.Students.Queries.CheckNationalIdDuplicate;
using Oksis.Domain.Modules.Users.Entities;
using Oksis.Domain.Modules.Users.Enums;
using Oksis.Domain.Modules.Users.ValueObjects;
using Xunit;

namespace Oksis.Application.UnitTests.Modules.Students;

public sealed class CheckNationalIdDuplicateQueryHandlerTests
{
    [Fact]
    public async Task Returns_exists_when_hash_matches()
    {
        var schoolId = Guid.NewGuid();
        var protector = Substitute.For<INationalIdProtector>();
        var hash = new byte[] { 1, 2, 3 };
        protector.Protect("11111111111", IdType.Tckn)
            .Returns(NationalId.FromSecured(IdType.Tckn, hash, new byte[] { 9 }));

        var person = Person.Create(schoolId, PersonName.Create("Elif", "Kaya"),
            NationalId.FromSecured(IdType.Tckn, hash, new byte[] { 9 }));
        var persons = new[] { person }.AsQueryable().BuildMockDbSet();

        var db = Substitute.For<IApplicationDbContext>();
        db.Persons.Returns(persons);
        var tenant = Substitute.For<ITenantContext>();
        tenant.CurrentSchoolId.Returns(schoolId);

        var handler = new CheckNationalIdDuplicateQueryHandler(db, tenant, protector);
        var result = await handler.Handle(new CheckNationalIdDuplicateQuery("11111111111", IdType.Tckn), default);

        result.IsSuccess.Should().BeTrue();
        result.Value!.Exists.Should().BeTrue();
    }
}
```

- [ ] **Step 2: Fail gör**

Run: `cd oksis-api && dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~CheckNationalIdDuplicateQueryHandlerTests"`
Expected: FAIL.

- [ ] **Step 3: Query + DTO + handler yaz**

```csharp
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Cqrs;
using Oksis.Domain.Modules.Users.Enums;

namespace Oksis.Application.Modules.Students.Queries.CheckNationalIdDuplicate;

[Tenancy(TenancyMode.Required)]
[RequirePermission("students.create")]
public sealed record CheckNationalIdDuplicateQuery(string NationalId, IdType IdType)
    : IQuery<NationalIdDuplicateDto>;
```
```csharp
namespace Oksis.Application.Modules.Students.Queries.CheckNationalIdDuplicate;

public sealed record NationalIdDuplicateDto(bool Exists, Guid? PersonId, string? FullName, string? StudentNumber);
```
```csharp
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Domain.Modules.Users.Entities;
using Oksis.Shared;

namespace Oksis.Application.Modules.Students.Queries.CheckNationalIdDuplicate;

public sealed class CheckNationalIdDuplicateQueryHandler(
    IApplicationDbContext db, ITenantContext tenant, INationalIdProtector protector)
    : IQueryHandler<CheckNationalIdDuplicateQuery, NationalIdDuplicateDto>
{
    public async Task<Result<NationalIdDuplicateDto>> Handle(
        CheckNationalIdDuplicateQuery request, CancellationToken cancellationToken)
    {
        if (tenant.CurrentSchoolId is null)
            return Result<NationalIdDuplicateDto>.Forbidden();

        var protectedId = protector.Protect(request.NationalId, request.IdType);
        var hash = protectedId.Hash;

        var person = await db.Persons.AsNoTracking()
            .Where(p => p.NationalId != null && p.NationalId.Hash == hash)
            .Select(p => new { p.Id, p.Name })
            .FirstOrDefaultAsync(cancellationToken);

        if (person is null)
            return new NationalIdDuplicateDto(false, null, null, null);

        var studentNo = await db.Profiles.OfType<StudentProfile>().AsNoTracking()
            .Where(sp => sp.PersonId == person.Id)
            .Select(sp => sp.StudentNumber)
            .FirstOrDefaultAsync(cancellationToken);

        return new NationalIdDuplicateDto(true, person.Id, person.Name.FullName, studentNo);
    }
}
```

> **Doğrula:** `Profile.PersonId` adı (config'de FK). Yoksa `db.Persons` → `Profiles` navigation üzerinden çek. `IQueryHandler<,>` arayüz adını `Common/Cqrs` altından teyit et (ICommandHandler ile aynı dosya ailesi).

- [ ] **Step 4: Pass gör**

Run: `cd oksis-api && dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~CheckNationalIdDuplicateQueryHandlerTests"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd oksis-api && git add src/Oksis.Application/Modules/Students/Queries/CheckNationalIdDuplicate tests/Oksis.Application.UnitTests/Modules/Students/CheckNationalIdDuplicateQueryHandlerTests.cs
git commit -m "2026-06-29 feat,test: CheckNationalIdDuplicate query (sihirbaz TCKN mükerrer kontrolü)."
```

---

## Task 8: `GetBranchCapacityQuery`

**Files:**
- Create: `.../Queries/GetBranchCapacity/GetBranchCapacityQuery.cs`
- Create: `.../GetBranchCapacity/BranchCapacityDto.cs`
- Create: `.../GetBranchCapacity/GetBranchCapacityQueryHandler.cs`
- Test: `tests/Oksis.Application.UnitTests/Modules/Students/GetBranchCapacityQueryHandlerTests.cs`

**Interfaces:**
- Consumes: `db.ClassRooms` (+ `Students` owned), `db.AcademicSessions`.
- Produces: `GetBranchCapacityQuery(Guid AcademicSessionId, Guid? GradeLevelId)` → `Result<IReadOnlyList<BranchCapacityDto>>`; `BranchCapacityDto(Guid ClassRoomId, string FullName, int Used, int Capacity)`.

- [ ] **Step 1: Failing unit test**

```csharp
using FluentAssertions;
using MockQueryable;
using NSubstitute;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Modules.Students.Queries.GetBranchCapacity;
using Oksis.Domain.Modules.AcademicSessions.Entities;
using Xunit;

namespace Oksis.Application.UnitTests.Modules.Students;

public sealed class GetBranchCapacityQueryHandlerTests
{
    [Fact]
    public async Task Returns_used_and_capacity_per_classroom()
    {
        var schoolId = Guid.NewGuid();
        var sessionId = Guid.NewGuid();
        // ClassRoom.Create + AssignStudent ile 1 aktif öğrenci kur (gerçek factory).
        // (Test, ClassRoom.Create imzasını birebir kullanmalı — bkz. ClassRoom.cs)
        var rooms = Array.Empty<ClassRoom>().AsQueryable().BuildMockDbSet();
        var db = Substitute.For<IApplicationDbContext>();
        db.ClassRooms.Returns(rooms);
        var tenant = Substitute.For<ITenantContext>();
        tenant.CurrentSchoolId.Returns(schoolId);

        var handler = new GetBranchCapacityQueryHandler(db, tenant);
        var result = await handler.Handle(new GetBranchCapacityQuery(sessionId, null), default);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().BeEmpty();
    }
}
```

> **Not:** Boş-durum testi minimaldir (ClassRoom.Create imzası uzun). Dolu senaryosu integration testte (Task 11 yanında) doğrulanır.

- [ ] **Step 2: Fail gör**

Run: `cd oksis-api && dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~GetBranchCapacityQueryHandlerTests"`
Expected: FAIL.

- [ ] **Step 3: Query + DTO + handler yaz**

```csharp
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Cqrs;

namespace Oksis.Application.Modules.Students.Queries.GetBranchCapacity;

[Tenancy(TenancyMode.Required)]
[RequirePermission("students.create")]
public sealed record GetBranchCapacityQuery(Guid AcademicSessionId, Guid? GradeLevelId)
    : IQuery<IReadOnlyList<BranchCapacityDto>>;
```
```csharp
namespace Oksis.Application.Modules.Students.Queries.GetBranchCapacity;

public sealed record BranchCapacityDto(Guid ClassRoomId, string FullName, int Used, int Capacity);
```
```csharp
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Shared;

namespace Oksis.Application.Modules.Students.Queries.GetBranchCapacity;

public sealed class GetBranchCapacityQueryHandler(IApplicationDbContext db, ITenantContext tenant)
    : IQueryHandler<GetBranchCapacityQuery, IReadOnlyList<BranchCapacityDto>>
{
    public async Task<Result<IReadOnlyList<BranchCapacityDto>>> Handle(
        GetBranchCapacityQuery request, CancellationToken cancellationToken)
    {
        if (tenant.CurrentSchoolId is null)
            return Result<IReadOnlyList<BranchCapacityDto>>.Forbidden();

        var query = db.ClassRooms.AsNoTracking()
            .Where(c => c.AcademicSessionId == request.AcademicSessionId);
        if (request.GradeLevelId is { } g)
            query = query.Where(c => c.GradeLevelId == g);

        var items = await query
            .Select(c => new BranchCapacityDto(
                c.Id, c.FullName,
                c.Students.Count(s => s.LeftAt == null),
                c.Capacity))
            .ToListAsync(cancellationToken);

        return items;
    }
}
```

- [ ] **Step 4: Pass gör**

Run: `cd oksis-api && dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~GetBranchCapacityQueryHandlerTests"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd oksis-api && git add src/Oksis.Application/Modules/Students/Queries/GetBranchCapacity tests/Oksis.Application.UnitTests/Modules/Students/GetBranchCapacityQueryHandlerTests.cs
git commit -m "2026-06-29 feat,test: GetBranchCapacity query (şube doluluk göstergesi)."
```

---

## Task 9: `SearchGuardiansQuery`

**Files:**
- Create: `.../Queries/SearchGuardians/SearchGuardiansQuery.cs`
- Create: `.../SearchGuardians/GuardianSearchItemDto.cs`
- Create: `.../SearchGuardians/SearchGuardiansQueryHandler.cs`
- Test: `tests/Oksis.Application.UnitTests/Modules/Students/SearchGuardiansQueryHandlerTests.cs`

**Interfaces:**
- Consumes: `db.Persons`, `db.Profiles.OfType<ParentProfile>()`.
- Produces: `SearchGuardiansQuery(string Query)` → `Result<IReadOnlyList<GuardianSearchItemDto>>`; `GuardianSearchItemDto(Guid PersonId, string FullName, string? Phone, string? Email)`.

- [ ] **Step 1: Failing unit test**

```csharp
using FluentAssertions;
using MockQueryable;
using NSubstitute;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Modules.Students.Queries.SearchGuardians;
using Oksis.Domain.Modules.Users.Entities;
using Oksis.Domain.Modules.Users.ValueObjects;
using Xunit;

namespace Oksis.Application.UnitTests.Modules.Students;

public sealed class SearchGuardiansQueryHandlerTests
{
    [Fact]
    public async Task Filters_parents_by_name()
    {
        var schoolId = Guid.NewGuid();
        var parent = Person.Create(schoolId, PersonName.Create("Zeynep", "Kaya"));
        parent.AttachProfile(ParentProfile.Create());
        var persons = new[] { parent }.AsQueryable().BuildMockDbSet();

        var db = Substitute.For<IApplicationDbContext>();
        db.Persons.Returns(persons);
        var tenant = Substitute.For<ITenantContext>();
        tenant.CurrentSchoolId.Returns(schoolId);

        var handler = new SearchGuardiansQueryHandler(db, tenant);
        var result = await handler.Handle(new SearchGuardiansQuery("Zeynep"), default);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().ContainSingle(x => x.FullName == "Zeynep Kaya");
    }
}
```

> **Doğrula:** Parent profili person'da nasıl filtrelenir — `db.Persons.Where(p => p.Profiles.Any(pr => pr is ParentProfile))` veya `db.Profiles.OfType<ParentProfile>()`. `Person.AttachProfile` + `ParentProfile.Create()` gerçek imza (Task agent doğruladı).

- [ ] **Step 2: Fail gör**

Run: `cd oksis-api && dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~SearchGuardiansQueryHandlerTests"`
Expected: FAIL.

- [ ] **Step 3: Query + DTO + handler yaz**

```csharp
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Cqrs;

namespace Oksis.Application.Modules.Students.Queries.SearchGuardians;

[Tenancy(TenancyMode.Required)]
[RequirePermission("students.create")]
public sealed record SearchGuardiansQuery(string Query)
    : IQuery<IReadOnlyList<GuardianSearchItemDto>>;
```
```csharp
namespace Oksis.Application.Modules.Students.Queries.SearchGuardians;

public sealed record GuardianSearchItemDto(Guid PersonId, string FullName, string? Phone, string? Email);
```
```csharp
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Domain.Modules.Users.Entities;
using Oksis.Domain.Modules.Users.Enums;
using Oksis.Shared;

namespace Oksis.Application.Modules.Students.Queries.SearchGuardians;

public sealed class SearchGuardiansQueryHandler(IApplicationDbContext db, ITenantContext tenant)
    : IQueryHandler<SearchGuardiansQuery, IReadOnlyList<GuardianSearchItemDto>>
{
    public async Task<Result<IReadOnlyList<GuardianSearchItemDto>>> Handle(
        SearchGuardiansQuery request, CancellationToken cancellationToken)
    {
        if (tenant.CurrentSchoolId is null)
            return Result<IReadOnlyList<GuardianSearchItemDto>>.Forbidden();

        var term = (request.Query ?? string.Empty).Trim();
        if (term.Length < 2)
            return (IReadOnlyList<GuardianSearchItemDto>)Array.Empty<GuardianSearchItemDto>();

        var items = await db.Persons.AsNoTracking()
            .Where(p => p.Profiles.Any(pr => pr.ProfileType == ProfileType.Parent))
            .Where(p => (p.Name.First + " " + p.Name.Last).Contains(term))
            .Select(p => new GuardianSearchItemDto(
                p.Id, p.Name.First + " " + p.Name.Last,
                p.PrimaryPhone != null ? p.PrimaryPhone.Value : null,
                p.PrimaryEmail != null ? p.PrimaryEmail.Value : null))
            .Take(20)
            .ToListAsync(cancellationToken);

        return items;
    }
}
```

> **Doğrula:** `Profile.ProfileType` discriminator EF'te sorgulanabilir mi (shadow/computed). Sorgulanamıyorsa `p.Profiles.OfType<ParentProfile>().Any()` kullan. `PersonName.First/Last` ve `Email.Value`/`PhoneNumber.Value` alan adları (agent doğruladı).

- [ ] **Step 4: Pass gör**

Run: `cd oksis-api && dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~SearchGuardiansQueryHandlerTests"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd oksis-api && git add src/Oksis.Application/Modules/Students/Queries/SearchGuardians tests/Oksis.Application.UnitTests/Modules/Students/SearchGuardiansQueryHandlerTests.cs
git commit -m "2026-06-29 feat,test: SearchGuardians query (kardeş için mevcut veli arama)."
```

---

## Task 10: `EnrollStudent` orkestrasyon komutu (çekirdek)

**Files:**
- Create: `.../Commands/EnrollStudent/EnrollStudentCommand.cs`
- Create: `.../EnrollStudent/EnrollStudentResult.cs`
- Create: `.../EnrollStudent/GuardianInput.cs`
- Create: `.../EnrollStudent/EnrollStudentCommandValidator.cs`
- Create: `.../EnrollStudent/EnrollStudentCommandHandler.cs`
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Students/EnrollStudentTests.cs`

**Interfaces:**
- Consumes: `INationalIdProtector`, `IStudentNumberGenerator`, `ITenantContext`, `IDateTimeProvider`, `db.*`; domain: `Person.Create/AttachProfile`, `StudentProfile.Create`, `ClassRoom.AssignStudent`, `ParentStudentRelationship.Create`, `StudentEnrollment.Create/Activate/SetClassRoom`, `EnrollmentIdempotency.Create`, `StudentEnrolledEvent`.
- Produces: `EnrollStudentCommand(...)` → `Result<EnrollStudentResult>`; `EnrollStudentResult(Guid StudentPersonId, Guid EnrollmentId, string StudentNumber, bool HasGuardianWarning)`; `GuardianInput(...)`.

- [ ] **Step 1: DTO'lar + command + validator yaz**

```csharp
using Oksis.Domain.Modules.Users.Enums;

namespace Oksis.Application.Modules.Students.Commands.EnrollStudent;

public sealed record GuardianInput(
    Guid? ExistingPersonId,
    string? FirstName,
    string? LastName,
    RelationType RelationType,
    string? Phone,
    string? Email,
    bool CanViewInfo,
    bool CanMakeDecisions,
    bool IsPaymentResponsible,
    bool CanPickup,
    bool IsPrimaryContact);
```
```csharp
namespace Oksis.Application.Modules.Students.Commands.EnrollStudent;

public sealed record EnrollStudentResult(
    Guid StudentPersonId, Guid EnrollmentId, string StudentNumber, bool HasGuardianWarning);
```
```csharp
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Cqrs;
using Oksis.Domain.Modules.Students.Enums;
using Oksis.Domain.Modules.Users.Enums;

namespace Oksis.Application.Modules.Students.Commands.EnrollStudent;

[Tenancy(TenancyMode.Required)]
[RequirePermission("students.create")]
public sealed record EnrollStudentCommand(
    Guid ClientRequestId,
    string FirstName,
    string LastName,
    Gender Gender,
    DateOnly? BirthDate,
    string? NationalId,
    IdType? NationalIdType,
    EnrollmentType Type,
    string? PreviousSchool,
    Guid AcademicSessionId,
    int GradeLevel,
    Guid ClassRoomId,
    DateOnly EnrollmentDate,
    IReadOnlyList<GuardianInput> Guardians,
    bool Invite,
    InvitationChannel? InviteChannel) : ICommand<EnrollStudentResult>;
```
```csharp
using FluentValidation;
using Oksis.Domain.Modules.Students.Enums;

namespace Oksis.Application.Modules.Students.Commands.EnrollStudent;

public sealed class EnrollStudentCommandValidator : AbstractValidator<EnrollStudentCommand>
{
    public EnrollStudentCommandValidator()
    {
        RuleFor(x => x.ClientRequestId).NotEmpty();
        RuleFor(x => x.FirstName).NotEmpty().MinimumLength(2).MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().MinimumLength(2).MaximumLength(100);
        RuleFor(x => x.AcademicSessionId).NotEmpty();
        RuleFor(x => x.ClassRoomId).NotEmpty();
        RuleFor(x => x.PreviousSchool)
            .NotEmpty().When(x => x.Type == EnrollmentType.TransferIn)
            .WithMessage("Nakil gelende geldiği okul zorunludur.");
        RuleFor(x => x.InviteChannel)
            .NotNull().When(x => x.Invite)
            .WithMessage("Davet açıkken kanal seçilmelidir.");
    }
}
```

> **E2.4:** TCKN opsiyonel → validator'da NotEmpty yok. TCKN verildiyse 11 hane/algoritma kontrolünü handler `INationalIdProtector.Protect` içi veya ayrı kuralla yap (mevcut CreatePerson deseni).

- [ ] **Step 2: Failing integration test yaz** (gerçek SQL — mükerrer + idempotency + yerleştirme)

```csharp
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Modules.Students.Commands.EnrollStudent;
using Oksis.Domain.Modules.Students.Enums;
using Oksis.Domain.Modules.Users.Enums;
using Oksis.Infrastructure.IntegrationTests.Fixtures;
using Xunit;

namespace Oksis.Infrastructure.IntegrationTests.Students;

[Collection(DatabaseCollection.Name)]
public sealed class EnrollStudentTests(DatabaseFixture fixture) : IAsyncLifetime
{
    public async Task InitializeAsync() => await fixture.EnsureDatabaseCreatedAsync();
    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task Enroll_creates_person_profile_enrollment_and_assigns_classroom()
    {
        // Arrange: seed AcademicSession (Active) + ClassRoom (Active, kapasite > 0)
        // (DatabaseFixture seed yardımcıları / doğrudan db.Add ile kur — mevcut integration
        //  testlerdeki seed desenini izle: AssignStudentToClassRoom integration testi varsa referans al.)
        var schoolId = Guid.NewGuid();
        await using var db = fixture.CreateDbContext(schoolId);
        // ... seed session + classroom, capture classRoomId, sessionId ...

        // Act: handler'ı bağımlılıklarıyla kur (INationalIdProtector gerçek impl,
        //   IStudentNumberGenerator gerçek impl, IDateTimeProvider fake, ITenantContext fake).
        // var result = await handler.Handle(new EnrollStudentCommand(...), default);

        // Assert
        // result.IsSuccess.Should().BeTrue();
        // result.Value!.StudentNumber.Should().StartWith("2026");
        // (await db.StudentEnrollments.CountAsync()).Should().Be(1);
        // (await db.ClassRooms.SelectMany(c => c.Students).CountAsync(s => s.LeftAt == null)).Should().Be(1);
        true.Should().BeTrue(); // iskelet — seed tamamlanınca gerçek assert'lere çevir
    }

    [Fact]
    public async Task Same_client_request_id_is_idempotent()
    {
        // Aynı ClientRequestId ile iki kez çağır → tek öğrenci, ikinci çağrı ilk sonucu döner.
        true.Should().BeTrue(); // seed + çağrı tamamlanınca gerçek assert
    }
}
```

> **Önemli:** Bu integration testin seed'i (Active session + Active classroom) için mevcut `Oksis.Infrastructure.IntegrationTests` altındaki ClassRoom/AcademicSession seed desenini birebir kullan. İskelet assert'leri gerçek seed bağlanınca somutlaştır (placeholder bırakma — bu test implementasyon sırasında doldurulur).

- [ ] **Step 3: Handler yaz** (tek transaction; TransactionBehavior sarar)

```csharp
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Domain.Modules.Students.Entities;
using Oksis.Domain.Modules.Students.Enums;
using Oksis.Domain.Modules.Students.Events;
using Oksis.Domain.Modules.Students.Exceptions;
using Oksis.Domain.Modules.Users.Entities;
using Oksis.Domain.Modules.Users.Enums;
using Oksis.Domain.Modules.Users.ValueObjects;
using Oksis.Shared;

namespace Oksis.Application.Modules.Students.Commands.EnrollStudent;

public sealed class EnrollStudentCommandHandler(
    IApplicationDbContext db,
    ITenantContext tenant,
    IDateTimeProvider clock,
    INationalIdProtector protector,
    IStudentNumberGenerator numbers)
    : ICommandHandler<EnrollStudentCommand, EnrollStudentResult>
{
    public async Task<Result<EnrollStudentResult>> Handle(
        EnrollStudentCommand request, CancellationToken cancellationToken)
    {
        var schoolId = tenant.CurrentSchoolId;
        if (schoolId is null)
            return Result<EnrollStudentResult>.Forbidden();

        // 0) Idempotency replay (E5.3)
        var prior = await db.EnrollmentIdempotencyRecords.AsNoTracking()
            .FirstOrDefaultAsync(r => r.ClientRequestId == request.ClientRequestId, cancellationToken);
        if (prior is not null)
        {
            var no = await db.Profiles.OfType<StudentProfile>().AsNoTracking()
                .Where(sp => sp.PersonId == prior.StudentPersonId)
                .Select(sp => sp.StudentNumber).FirstOrDefaultAsync(cancellationToken);
            return new EnrollStudentResult(prior.StudentPersonId, prior.EnrollmentId, no ?? string.Empty, false);
        }

        // 1) TCKN mükerrer (E11.1)
        NationalId? nationalId = null;
        if (!string.IsNullOrWhiteSpace(request.NationalId))
        {
            nationalId = protector.Protect(request.NationalId, request.NationalIdType ?? IdType.Tckn);
            var hash = nationalId.Hash;
            var exists = await db.Persons.AsNoTracking()
                .AnyAsync(p => p.NationalId != null && p.NationalId.Hash == hash, cancellationToken);
            if (exists)
                return Result<EnrollStudentResult>.Conflict("students.errors.duplicate-national-id");
        }

        // 2) Aktif sezon + classroom (E11.6, E11.4 hard kapasite)
        var session = await db.AcademicSessions.AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == request.AcademicSessionId, cancellationToken);
        if (session is null)
            return Result<EnrollStudentResult>.NotFound();

        var classRoom = await db.ClassRooms
            .Include(c => c.Students)
            .FirstOrDefaultAsync(c => c.Id == request.ClassRoomId, cancellationToken);
        if (classRoom is null)
            return Result<EnrollStudentResult>.NotFound();

        var used = classRoom.Students.Count(s => s.LeftAt == null);
        if (used >= classRoom.Capacity)
            return Result<EnrollStudentResult>.Conflict("students.errors.classroom-full");

        // 3) Person + StudentProfile + öğrenci no (E2.3)
        var studentNumber = await numbers.NextAsync(schoolId.Value, request.EnrollmentDate.Year, cancellationToken);
        var person = Person.Create(
            schoolId.Value, PersonName.Create(request.FirstName, request.LastName),
            nationalId, request.BirthDate, request.Gender,
            string.IsNullOrWhiteSpace(request.Email) ? null : Email.Create(request.Email),
            null);
        person.AttachProfile(StudentProfile.Create(studentNumber, request.ClassRoomId, request.EnrollmentDate));
        person.Activate();
        db.Persons.Add(person);

        // 4) StudentEnrollment (idari kayıt)
        var enrollment = StudentEnrollment.Create(
            schoolId.Value, person.Id, request.AcademicSessionId, request.GradeLevel,
            request.ClassRoomId, request.EnrollmentDate, request.Type, request.PreviousSchool);
        enrollment.Activate();
        db.StudentEnrollments.Add(enrollment);

        // 5) Şube yerleştirme (defter — BR-students-001)
        var reason = request.Type == EnrollmentType.TransferIn
            ? AssignmentReason.NewEnrollment : AssignmentReason.Initial;
        classRoom.AssignStudent(person.Id, clock.UtcNow, reason, notes: null);

        // 6) Veliler
        var guardianIds = new List<Guid>();
        foreach (var g in request.Guardians)
        {
            Guid guardianPersonId;
            if (g.ExistingPersonId is { } existing)
            {
                guardianPersonId = existing;
            }
            else
            {
                var gp = Person.Create(
                    schoolId.Value, PersonName.Create(g.FirstName ?? "", g.LastName ?? ""),
                    null, null, null,
                    string.IsNullOrWhiteSpace(g.Email) ? null : Email.Create(g.Email),
                    string.IsNullOrWhiteSpace(g.Phone) ? null : PhoneNumber.Create(g.Phone));
                gp.AttachProfile(ParentProfile.Create());
                gp.Activate();
                db.Persons.Add(gp);
                guardianPersonId = gp.Id;
            }
            db.ParentStudentRelationships.Add(ParentStudentRelationship.Create(
                schoolId.Value, guardianPersonId, person.Id, g.RelationType,
                g.CanViewInfo, g.CanMakeDecisions, g.IsPaymentResponsible, g.CanPickup, g.IsPrimaryContact,
                DateOnly.FromDateTime(clock.UtcNow.UtcDateTime), null));
            guardianIds.Add(guardianPersonId);
        }

        // 7) Idempotency kaydı + event (E5.2 yan etki post-commit)
        db.EnrollmentIdempotencyRecords.Add(
            EnrollmentIdempotency.Create(schoolId.Value, request.ClientRequestId, person.Id, enrollment.Id));

        var hasGuardianWarning = guardianIds.Count == 0;
        enrollment.RaiseEnrolled(new StudentEnrolledEvent(
            enrollment.Id, schoolId.Value, person.Id, request.AcademicSessionId,
            request.Type, request.Invite, guardianIds));

        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException) // benzersizlik çakışması (TCKN/idempotency) → 409
        {
            return Result<EnrollStudentResult>.Conflict("students.errors.duplicate-enrollment");
        }

        return new EnrollStudentResult(person.Id, enrollment.Id, studentNumber, hasGuardianWarning);
    }
}
```

> **Düzeltme gerekiyor:** `StudentEnrollment`'a event raise için public bir metot ekle (aggregate event'i kendi içinde raise etmeli). Task 2'deki entity'ye şunu ekle:
> ```csharp
> public void RaiseEnrolled(StudentEnrolledEvent e) => Raise(e);
> ```
> (`Raise` `AggregateRoot`'ta `protected`.) Bu satırı Task 2 entity'sine eklemeyi unutma; commit'i Task 2 ile birlikte yap ya da bu task'ta entity'yi güncelle.
>
> **Doğrula:** `IDateTimeProvider` arayüz adı/`UtcNow` tipi (`DateTimeOffset`), `Email.Create`/`PhoneNumber.Create` davranışı, `request.Email` alanı command'de yok → command'e `string? Email` ekle (öğrenci e-postası opsiyonel) veya öğrenci e-postasını kaldır. (Plan: command'e `string? Email` alanı EKLE — student e-postası opsiyonel; üst kısımdaki record'a ekle.)

- [ ] **Step 4: `Email` alanını command'e ekle** (Step 1 record'una `string? Email` ekle; validator'a kural gerekmez — opsiyonel).

- [ ] **Step 5: Build + integration testleri koş**

Run: `cd oksis-api && dotnet build && dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~EnrollStudentTests"`
Expected: PASS (seed somutlaştırıldıktan sonra).

- [ ] **Step 6: Commit**

```bash
cd oksis-api && git add src/Oksis.Application/Modules/Students/Commands/EnrollStudent src/Oksis.Domain/Modules/Students/Entities/StudentEnrollment.cs tests/Oksis.Infrastructure.IntegrationTests/Students/EnrollStudentTests.cs
git commit -m "2026-06-29 feat,test: EnrollStudent orkestrasyon komutu (Person+Profile+Enrollment+şube+veli, idempotent)."
```

---

## Task 11: `StudentEnrolledEvent` handler (davet/hesap — post-commit)

**Files:**
- Create: `oksis-api/src/Oksis.Application/Modules/Students/Events/StudentEnrolledEventHandler.cs`
- Test: `tests/Oksis.Application.UnitTests/Modules/Students/StudentEnrolledEventHandlerTests.cs`

**Interfaces:**
- Consumes: `INotificationHandler<DomainEventNotification<StudentEnrolledEvent>>`, `IPostCommitDispatcher`, veli daveti için mevcut `InvitationCreationHelper.CreateForPersonAsync` / `IInvitationTokenFactory`.
- Produces: veli daveti (Invite=true ise) + öğrenci hesabı provizyonu **post-commit kuyruğa** alınır.

> **E2.7 / E5.2:** Veli → davet (Email/SMS/WhatsApp); öğrenci → kullanıcı adı=öğrenci no + geçici şifre + RequirePasswordChange. Yan etki **post-commit**.
>
> **Uygulama öncesi doğrula (iki nokta — sıfırdan değil, mevcut koddan):**
> 1. `IPasswordHasher` (veya eşdeğer) servisinin TAM adı/imzası — öğrenci geçici şifresini hash'lemek için. `Account.Create(schoolId, personId, PasswordHash.FromEncoded(hasher.Hash(tempPassword)), requirePasswordChange: true)` ve `person.LinkAccount(account.Id)`.
> 2. Veli daveti için `TargetSystemRoleId` (Parent rolü `SystemRole.Code`), `SeasonId` (event'teki `AcademicSessionId`) ve `consentBundleVersion` kaynağı — `InvitationCreationHelper.CreateForPersonAsync` imzası (agent doğruladı).

- [ ] **Step 1: Failing unit test** (handler post-commit'e iş kuyruklar)

```csharp
using NSubstitute;
using Oksis.Application.Common.Behaviors; // IPostCommitDispatcher
using Oksis.Application.Common.Events;
using Oksis.Application.Modules.Students.Events;
using Oksis.Domain.Modules.Students.Enums;
using Oksis.Domain.Modules.Students.Events;
using Xunit;

namespace Oksis.Application.UnitTests.Modules.Students;

public sealed class StudentEnrolledEventHandlerTests
{
    [Fact]
    public async Task Enqueues_postcommit_work_when_invite_true()
    {
        var dispatcher = Substitute.For<IPostCommitDispatcher>();
        var handler = new StudentEnrolledEventHandler(dispatcher /*, diğer bağımlılıklar */);

        var evt = new StudentEnrolledEvent(
            Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(),
            EnrollmentType.New, Invite: true, GuardianPersonIds: new[] { Guid.NewGuid() });

        await handler.Handle(new DomainEventNotification<StudentEnrolledEvent>(evt), default);

        dispatcher.ReceivedWithAnyArgs(1).Enqueue(default!);
    }
}
```

> **Doğrula:** `IPostCommitDispatcher.Enqueue` imzası (`Enqueue(Action)` / `Enqueue(Expression<...>)`) — `PostCommitDispatcher.cs` ve `HangfireAutoDistributeDutyEnqueuer.cs` desenini izle.

- [ ] **Step 2: Fail gör**

Run: `cd oksis-api && dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~StudentEnrolledEventHandlerTests"`
Expected: FAIL.

- [ ] **Step 3: Handler yaz** (mevcut davet helper + post-commit dispatcher ile; öğrenci hesabı + veli daveti kuyruklanır)

```csharp
using MediatR;
using Oksis.Application.Common.Behaviors;
using Oksis.Application.Common.Events;
using Oksis.Domain.Modules.Students.Events;

namespace Oksis.Application.Modules.Students.Events;

public sealed class StudentEnrolledEventHandler(IPostCommitDispatcher dispatcher /* + invitation/account servisleri */)
    : INotificationHandler<DomainEventNotification<StudentEnrolledEvent>>
{
    public Task Handle(DomainEventNotification<StudentEnrolledEvent> notification, CancellationToken cancellationToken)
    {
        var e = notification.DomainEvent;
        dispatcher.Enqueue(() =>
        {
            // 1) Öğrenci hesabı: Account.Create(... PasswordHash ..., requirePasswordChange: true) + person.LinkAccount
            // 2) Invite=true ise her guardian için InvitationCreationHelper.CreateForPersonAsync (kanal event'ten)
            // (Bu blok Hangfire job'ına devredilir — IPostCommitDispatcher desenini izle.)
        });
        return Task.CompletedTask;
    }
}
```

> **Not:** Bu task'ın gövdesi mevcut davet/hesap servisleri imzaları netleştikten sonra (yukarıdaki iki doğrulama) tam koda dönüştürülür. Test, "post-commit'e iş kuyruklandı" davranışını sabitler; provizyon detayları integration testle ayrıca doğrulanır.

- [ ] **Step 4: Pass gör**

Run: `cd oksis-api && dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~StudentEnrolledEventHandlerTests"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd oksis-api && git add src/Oksis.Application/Modules/Students/Events tests/Oksis.Application.UnitTests/Modules/Students/StudentEnrolledEventHandlerTests.cs
git commit -m "2026-06-29 feat,test: StudentEnrolled event handler (veli daveti + öğrenci hesabı, post-commit)."
```

---

## Task 12: REST uçları (`StudentsController`)

**Files:**
- Create: `oksis-api/src/Oksis.Api/Controllers/V1/StudentsController.cs`
- Test: (controller ince; davranış handler testleriyle kapsanır — controller smoke test opsiyonel)

**Interfaces:**
- Consumes: `ISender`, Task 7-10 command/query'leri.
- Produces: `POST /api/v1/students:enroll`, `POST /api/v1/students:transfer-in`, `GET /api/v1/students/check-national-id`, `GET /api/v1/branches/capacity`, `GET /api/v1/guardians:search`.

- [ ] **Step 1: Controller yaz** (ClassRoomsController desenini izle; `ToHttpResult`)

```csharp
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Oksis.Api.Extensions;
using Oksis.Application.Modules.Students.Commands.EnrollStudent;
using Oksis.Application.Modules.Students.Queries.CheckNationalIdDuplicate;
using Oksis.Application.Modules.Students.Queries.GetBranchCapacity;
using Oksis.Application.Modules.Students.Queries.SearchGuardians;
using Oksis.Domain.Modules.Users.Enums;

namespace Oksis.Api.Controllers.V1;

[ApiController]
[Route("api/v1")]
[Authorize]
[Produces("application/json")]
public sealed class StudentsController(ISender sender) : ControllerBase
{
    [HttpPost("students:enroll")]
    public async Task<IActionResult> EnrollAsync([FromBody] EnrollStudentCommand command, CancellationToken ct)
        => (await sender.Send(command, ct)).ToHttpResult(HttpContext);

    [HttpPost("students:transfer-in")]
    public async Task<IActionResult> TransferInAsync([FromBody] EnrollStudentCommand command, CancellationToken ct)
        => (await sender.Send(command with { Type = EnrollmentType.TransferIn }, ct)).ToHttpResult(HttpContext);

    [HttpGet("students/check-national-id")]
    public async Task<IActionResult> CheckNationalIdAsync([FromQuery] string nationalId, [FromQuery] IdType idType, CancellationToken ct)
        => (await sender.Send(new CheckNationalIdDuplicateQuery(nationalId, idType), ct)).ToHttpResult(HttpContext);

    [HttpGet("branches/capacity")]
    public async Task<IActionResult> BranchCapacityAsync([FromQuery] Guid academicSessionId, [FromQuery] Guid? gradeLevelId, CancellationToken ct)
        => (await sender.Send(new GetBranchCapacityQuery(academicSessionId, gradeLevelId), ct)).ToHttpResult(HttpContext);

    [HttpGet("guardians:search")]
    public async Task<IActionResult> SearchGuardiansAsync([FromQuery] string query, CancellationToken ct)
        => (await sender.Send(new SearchGuardiansQuery(query), ct)).ToHttpResult(HttpContext);
}
```

> **Not:** `EnrollmentType` referansı için `using Oksis.Domain.Modules.Students.Enums;` ekle. `command with { Type = ... }` record kopyalama. Rota stili `:enroll` mevcut spec (E8) ile birebir.

- [ ] **Step 2: Build + API smoke**

Run: `cd oksis-api && dotnet build && dotnet test`
Expected: tüm paket PASS.

- [ ] **Step 3: Commit**

```bash
cd oksis-api && git add src/Oksis.Api/Controllers/V1/StudentsController.cs
git commit -m "2026-06-29 feat: StudentsController — enroll/transfer-in + sihirbaz query uçları."
```

---

## Task 13: İzin seed'i (`students.*`)

**Files:**
- Modify: Permission seed dosyası — `grep -rl "students.view\|permission" src/Oksis.Infrastructure/Persistence/Seed* src/Oksis.Infrastructure/**/Seed*` ile bul; mevcut permission seed listesine ekle (E9).

**Interfaces:**
- Produces: `students.view`, `students.view-detail`, `students.create`, `students.update`, `students.renew`, `students.manage`, `students.import`, `students.export` (default deny; SchoolAdmin/Secretary uygun atama).

- [ ] **Step 1: Mevcut permission seed'i bul ve oku**

Run: `cd oksis-api && grep -rln "RequirePermission\|class-rooms.assign-student\|PermissionDefinitions\|seed" src/Oksis.Infrastructure | head`
Expected: permission tanımlarının/seed'inin dosyası.

- [ ] **Step 2: `students.*` izinlerini ekle** (mevcut format neyse onu izle — `module.action` kayıtları + role-permission default eşlemesi). SchoolAdmin: hepsi; Secretary: view/view-detail/create/update/import/export.

- [ ] **Step 3: Build + (varsa) seed testi**

Run: `cd oksis-api && dotnet build && dotnet test --filter "FullyQualifiedName~Permission"`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
cd oksis-api && git add -A
git commit -m "2026-06-29 feat: students.* izinleri seed (default deny; permission-matrix güncellendi)."
```

- [ ] **Step 5: `permission-matrix.md` + modül dokümanı güncelle** (`.claude/docs/permission-matrix.md` ve `.claude/docs/modules/students/permissions.md` + `completion_status.md` — CLAUDE.md Module Documentation System). Workspace repo'sunda commit.

---

## Task 14: Doküman güncelleme (modül durum)

**Files:**
- Modify: `.claude/docs/modules/students/completion_status.md` (Faz 1A tamam — eklenen entity/komut/query, kaldırılan mock borcu notu Faz 1B'ye bırakılır)
- Modify: `.claude/docs/modules/students/domain-model.md`, `api-contracts.md`, `database-schema.md` (StudentEnrollment/StudentDocument/Idempotency + uçlar — `{{TBD}}` → içerik)

- [ ] **Step 1:** İlgili `{{TBD}}` alanlarını gerçek içerikle doldur; `completion_status.md` ilerleme + tarih + "Spec Dışına Çıkılanlar" (yoksa "yok") güncelle.
- [ ] **Step 2: Commit** (workspace repo)

```bash
git add .claude/docs/modules/students
git commit -m "2026-06-29 docs: students modülü — Faz 1A backend (Enrollment domain + EnrollStudent + query'ler) dokümante edildi."
```

---

## Self-Review notları (uygulayıcı için)

- **Spec kapsamı:** E4.1-E4.5 → Task 1-3,5; E2.3/E4.4 → Task 4; E5.1-E5.3 → Task 10; E11.4/E11.6 → Task 10; sihirbaz query'leri (E8) → Task 7-9; E5.2/E2.7 → Task 11; E8 uçlar → Task 12; E9 izinler → Task 13.
- **Faz 1A kapsam dışı (Faz 1B / sonraki):** `GetStudentDetail`/`ListStudents`/`GetEnrollmentHistory` (Faz 2), Freeze/Withdraw/Transfer endpoint'leri (Faz 2), FE wizard portu (Faz 1B), mock+D borcu temizliği (Faz 1B).
- **Doğrulanacak isimler (uygulamada teyit et):** `IQueryHandler<,>` / `IQuery<>` tam adı (Common/Cqrs); `IDateTimeProvider`; `IPasswordHasher`; `Profile.PersonId` & `Profile.ProfileType` EF sorgulanabilirliği; `IPostCommitDispatcher.Enqueue` imzası; permission seed dosyası.
- **Riskler:** R1 idempotency (Task 5+10), R2 post-commit (Task 11), R3 User'a dokunmama (handler yalnız Person/Account — ADR Aşama 1).
