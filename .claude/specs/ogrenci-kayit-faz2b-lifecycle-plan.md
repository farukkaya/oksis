# Öğrenci Kayıt — Faz 2B: Lifecycle Komutları — Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `StudentEnrollment` için 5 koordineli lifecycle komutu (Freeze/Resume/Withdraw/TransferOut/Graduate) yazıp REST uçlarını açmak ve frontend'in pasif aksiyonlarını bunlara bağlamak.

**Architecture:** CQRS komutları (MediatR + `ICommand`/`ICommandHandler`). Her komut tek transaction'da üç ekseni yönetir: `StudentEnrollment.Status` + şube üyeliği (`ClassRoom.RemoveStudent` + `StudentProfile.CurrentClassroomId`) + `Person.LifecycleState`. İzin `[RequirePermission("students.manage")]` attribute'u + `AuthorizationBehavior` pipeline'ı ile. Frontend React Query mutation + paylaşılan `LifecycleActionDialog`.

**Tech Stack:** .NET 10, EF Core 10, MediatR, FluentValidation, xUnit + Testcontainers (SQL Server). oksis-web: React + TS, React Query, react-i18next, vitest.

**Tasarım kaynağı (bağlayıcı):** `.claude/specs/ogrenci-kayit-faz2b-lifecycle-design.md` + şemsiye `ogrenci-kayit-enrollment-spec.md`.

## Global Constraints

- **Tenant izolasyonu asla bypass edilmez.** Her handler `tenant.CurrentSchoolId` null ise `Result.Forbidden()` döner. Sorgular global query filter ile scope'lanır; `IgnoreQueryFilters()` yok.
- **İzin:** 5 komutun tamamı `[Tenancy(TenancyMode.Required)]` + `[RequirePermission("students.manage")]`. FE gate `can.has("students.manage")` (UX-only; backend otorite).
- **Result API (Oksis.Shared):** `Result.Success()`, `Result.Forbidden()`, `Result.NotFound()`, `Result.Conflict(string message)`. `Result.Fail(...)` **yoktur** — geçersiz geçiş = `Conflict("students.errors.invalid-lifecycle-transition")`.
- **Komutlar payload döndürmez** → `ICommand` (generic olmayan) + `ICommandHandler<TCommand>`; handler `Task<Result>` döner.
- **Hardcoded Türkçe string YASAK** — hata kodları i18n anahtarı (`students.errors.*`), UI metni `t(...)`.
- **Component/identifier İngilizce PascalCase**; UI metni Türkçe i18n.
- **React Query:** mutation NESNESİ hook bağımlılığına konmaz; stabil `mutateAsync` kullanılır.
- **Commit formatı:** `YYYY-MM-DD <type>: Türkçe özet.` + `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` + `Claude-Session: ...` trailer.
- **Domain event YOK** (lifecycle bildirimleri Debt). İstisna: `ClassRoom.RemoveStudent(reason: Graduation)` zaten mevcut `StudentGraduatedEvent`'i raise eder — bu var olan davranıştır, dokunulmaz.

---

## Task 1: Domain ayarlamaları (Person.Transfer nullable + AssignmentReason değerleri)

**Files:**
- Modify: `oksis-api/src/Oksis.Domain/Modules/Users/Entities/Person.cs:159-174` (`Transfer` metodu)
- Modify: `oksis-api/src/Oksis.Domain/Modules/Users/Events/PersonTransferredEvent.cs:11` (`TargetSchoolId` → `Guid?`)
- Modify: `oksis-api/src/Oksis.Domain/Modules/AcademicSessions/Enums/AssignmentReason.cs` (2 yeni değer)
- Test: `oksis-api/tests/Oksis.Domain.UnitTests/Users/PersonTransferTests.cs` (yeni)

**Interfaces:**
- Produces:
  - `Person.Transfer(Guid? targetSchoolId)` — null = OKSİS dışı nakil (hedef Guid yok); değer varsa Empty/kendi okulu reddedilir.
  - `PersonTransferredEvent(Guid PersonId, Guid SchoolId, Guid? TargetSchoolId, DateTimeOffset OccurredAt)`.
  - `AssignmentReason.Withdrawal = 5`, `AssignmentReason.TransferOut = 6`.

- [ ] **Step 1: PersonTransferredEvent.TargetSchoolId'i nullable yap**

`PersonTransferredEvent.cs`'te alanı değiştir:
```csharp
public sealed record PersonTransferredEvent(
    Guid PersonId,
    Guid SchoolId,
    Guid? TargetSchoolId,
    DateTimeOffset OccurredAt) : IDomainEvent;
```

- [ ] **Step 2: AssignmentReason'a iki değer ekle**

`AssignmentReason.cs`'te `Archive = 4`'ten sonra ekle:
```csharp
    /// <summary>Şube veya sezon arşivleme sebebiyle otomatik kapatma.</summary>
    Archive = 4,

    /// <summary>Öğrencinin yıl içinde okuldan ayrılması (Withdrawn).</summary>
    Withdrawal = 5,

    /// <summary>Öğrencinin başka okula nakil çıkışı (TransferredOut).</summary>
    TransferOut = 6
}
```
> Enum int olarak saklanır → şema/migration değişikliği gerekmez.

- [ ] **Step 3: Failing test yaz — Transfer(null) ve Transfer(Guid.Empty)**

`PersonTransferTests.cs`:
```csharp
using FluentAssertions;
using Oksis.Domain.Modules.Users.Entities;
using Oksis.Domain.Modules.Users.Enums;
using Oksis.Domain.Modules.Users.Events;
using Oksis.Domain.Modules.Users.Exceptions;
using Xunit;

namespace Oksis.Domain.UnitTests.Users;

public sealed class PersonTransferTests
{
    private static Person CreateActiveStudent(Guid schoolId)
    {
        var person = Person.Create(schoolId, "Ali", "Veli", Gender.Male);
        person.AddProfile(StudentProfile.Create());
        person.Activate();
        return person;
    }

    [Fact]
    public void Transfer_with_null_target_marks_transferred_external()
    {
        var schoolId = Guid.NewGuid();
        var person = CreateActiveStudent(schoolId);

        person.Transfer(null);

        person.LifecycleState.Should().Be(PersonLifecycleState.Transferred);
        person.DomainEvents.OfType<PersonTransferredEvent>().Single()
            .TargetSchoolId.Should().BeNull();
    }

    [Fact]
    public void Transfer_with_empty_target_still_throws()
    {
        var person = CreateActiveStudent(Guid.NewGuid());

        var act = () => person.Transfer(Guid.Empty);

        act.Should().Throw<UsersDomainException>();
    }
}
```
> NOT: `Person.Create` / `AddProfile` / `Gender` / `DomainEvents` isimlerini implementer, `Person.cs` ve mevcut `Oksis.Domain.UnitTests/Users/*` testlerinden birebir doğrular; yukarıdaki imzalar Person.cs'teki kullanımla hizalıdır. Uyuşmazlık olursa mevcut Person testindeki kurucu kullanımıyla eşitle.

- [ ] **Step 4: Run test — fail (Transfer henüz Guid alıyor)**

Run: `dotnet test oksis-api/tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~PersonTransferTests"`
Expected: derleme hatası veya FAIL (Transfer(null) imzaya uymuyor).

- [ ] **Step 5: Person.Transfer'ı nullable yap**

`Person.cs:159-174`'ü değiştir:
```csharp
    /// <summary><c>Active → Transferred</c>. null hedef = OKSİS dışı okula nakil. Hedef okuldaki kopya ayrı bir iştir.</summary>
    public void Transfer(Guid? targetSchoolId)
    {
        if (LifecycleState != PersonLifecycleState.Active)
        {
            throw InvalidTransition(nameof(Transfer));
        }

        if (targetSchoolId is { } target && (target == Guid.Empty || target == SchoolId))
        {
            throw new UsersDomainException("Geçersiz hedef okul; nakil yapılamaz.");
        }

        LifecycleState = PersonLifecycleState.Transferred;
        Raise(new PersonTransferredEvent(Id, SchoolId, targetSchoolId, DateTimeOffset.UtcNow));
    }
```

- [ ] **Step 6: Mevcut çağıranı ve event tüketicilerini doğrula**

Run: `cd oksis-api && grep -rn "person.Transfer(" src/ && grep -rn "PersonTransferredEvent" src/`
- `TransferPersonCommandHandler.cs` `person.Transfer(request.TargetSchoolId)` (Guid → Guid? uyumlu, değişiklik gerekmez).
- `PersonTransferredEvent.TargetSchoolId` tüketen kod (outbox/notification) varsa `Guid?`'e göre derlenmeli. Derleme hatası çıkarsa o tüketicide null-guard ekle (örn. `?.ToString() ?? "—"`).

- [ ] **Step 7: Build + tüm domain testleri**

Run: `cd oksis-api && dotnet build && dotnet test tests/Oksis.Domain.UnitTests`
Expected: PASS (0 hata).

- [ ] **Step 8: Commit**

```bash
cd oksis-api && git add -A && git commit -m "$(cat <<'EOF'
2026-06-30 feat: Person.Transfer nullable hedef (dış nakil) + AssignmentReason Withdrawal/TransferOut değerleri (Faz 2B domain hazırlığı).

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01MiBCgS3zvFNBSmo6UdSivy
EOF
)"
```

---

## Task 2: FreezeEnrollment komutu + lifecycle test scaffolding

**Files:**
- Create: `oksis-api/src/Oksis.Application/Modules/Students/Commands/FreezeEnrollment/FreezeEnrollmentCommand.cs`
- Create: `.../FreezeEnrollment/FreezeEnrollmentCommandValidator.cs`
- Create: `.../FreezeEnrollment/FreezeEnrollmentCommandHandler.cs`
- Create: `oksis-api/src/Oksis.Api/Contracts/Students/LifecycleRequests.cs`
- Modify: `oksis-api/src/Oksis.Api/Controllers/V1/StudentsController.cs` (route ekle)
- Create: `oksis-api/tests/Oksis.Infrastructure.IntegrationTests/Students/Lifecycle/LifecycleScenario.cs` (paylaşılan seed helper)
- Create: `oksis-api/tests/Oksis.Infrastructure.IntegrationTests/Students/Lifecycle/FreezeEnrollmentTests.cs`

**Interfaces:**
- Consumes: `Result` (Oksis.Shared), `ICommand`/`ICommandHandler<T>` (Common.Cqrs), `[RequirePermission]`/`[Tenancy]` (Common.Attributes), `IApplicationDbContext`, `ITenantContext`, `IDateTimeProvider`.
- Produces:
  - `FreezeEnrollmentCommand(Guid StudentId, string Reason) : ICommand`
  - `LifecycleScenario.SeedActiveStudentAsync(DatabaseFixture) → SeededStudent(Guid SchoolId, Guid SessionId, Guid ClassRoomId, Guid StudentPersonId, Guid EnrollmentId)` ve `LifecycleScenario.Handler<T>(...)` yardımcıları.

- [ ] **Step 1: FreezeEnrollmentCommand + Validator**

`FreezeEnrollmentCommand.cs`:
```csharp
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Cqrs;

namespace Oksis.Application.Modules.Students.Commands.FreezeEnrollment;

[Tenancy(TenancyMode.Required)]
[RequirePermission("students.manage")]
public sealed record FreezeEnrollmentCommand(Guid StudentId, string Reason) : ICommand;
```

`FreezeEnrollmentCommandValidator.cs`:
```csharp
using FluentValidation;

namespace Oksis.Application.Modules.Students.Commands.FreezeEnrollment;

public sealed class FreezeEnrollmentCommandValidator : AbstractValidator<FreezeEnrollmentCommand>
{
    public FreezeEnrollmentCommandValidator()
    {
        RuleFor(x => x.StudentId).NotEmpty();
        RuleFor(x => x.Reason)
            .NotEmpty().MinimumLength(3).MaximumLength(500)
            .WithMessage("students.errors.lifecycle-reason-required");
    }
}
```

- [ ] **Step 2: FreezeEnrollmentCommandHandler**

`FreezeEnrollmentCommandHandler.cs`:
```csharp
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Domain.Modules.Students.Enums;
using Oksis.Shared;

namespace Oksis.Application.Modules.Students.Commands.FreezeEnrollment;

public sealed class FreezeEnrollmentCommandHandler(
    IApplicationDbContext db,
    ITenantContext tenant)
    : ICommandHandler<FreezeEnrollmentCommand>
{
    public async Task<Result> Handle(FreezeEnrollmentCommand request, CancellationToken ct)
    {
        if (tenant.CurrentSchoolId is null)
        {
            return Result.Forbidden();
        }

        var sessionId = await db.AcademicSessions
            .Where(s => s.IsCurrent)
            .Select(s => (Guid?)s.Id)
            .FirstOrDefaultAsync(ct);
        if (sessionId is null)
        {
            return Result.NotFound();
        }

        var enrollment = await db.StudentEnrollments
            .FirstOrDefaultAsync(
                e => e.StudentPersonId == request.StudentId && e.AcademicSessionId == sessionId,
                ct);
        if (enrollment is null)
        {
            return Result.NotFound();
        }

        if (enrollment.Status != EnrollmentStatus.Active)
        {
            return Result.Conflict("students.errors.invalid-lifecycle-transition");
        }

        var person = await db.Persons.FirstOrDefaultAsync(p => p.Id == request.StudentId, ct);
        if (person is null)
        {
            return Result.NotFound();
        }

        enrollment.Freeze();         // Active → Frozen
        person.Suspend(request.Reason); // Active → Suspended (şube koltuğu korunur)
        await db.SaveChangesAsync(ct);
        return Result.Success();
    }
}
```

- [ ] **Step 3: Request DTO + controller route**

`LifecycleRequests.cs`:
```csharp
namespace Oksis.Api.Contracts.Students;

public sealed record FreezeRequest(string Reason);
public sealed record WithdrawRequest(string Reason);
public sealed record TransferOutRequest(Guid? TargetSchoolId, string? Reason);
```

`StudentsController.cs`'e (mevcut `using`'lere `Oksis.Api.Contracts.Students;` ve komut namespace'leri eklenecek) ekle:
```csharp
    [HttpPost("students/{id:guid}:freeze")]
    public async Task<IActionResult> Freeze(Guid id, [FromBody] FreezeRequest body, CancellationToken ct)
        => (await sender.Send(new FreezeEnrollmentCommand(id, body.Reason), ct)).ToHttpResult(HttpContext);
```

- [ ] **Step 4: Paylaşılan seed helper — LifecycleScenario**

`LifecycleScenario.cs` (aktif öğrenciyi `EnrollStudentCommandHandler` ile tohumlar — kanıtlı yol; `EnrollStudentTests.SeedAsync`/`BuildHandler`'ı birebir model alır):
```csharp
using Microsoft.Extensions.Options;
using NSubstitute;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Modules.Students.Commands.EnrollStudent;
using Oksis.Application.Modules.Students.Services;
using Oksis.Domain.Modules.Academics.Entities;
using Oksis.Domain.Modules.Academics.Enums;
using Oksis.Domain.Modules.AcademicSessions.Entities;
using Oksis.Domain.Modules.Schools.Entities;
using Oksis.Domain.Modules.Schools.Enums;
using Oksis.Domain.Modules.Students.Enums;
using Oksis.Domain.Modules.Users.Enums;
using Oksis.Infrastructure.Identity;
using Oksis.Infrastructure.IntegrationTests.Fixtures;
using Microsoft.EntityFrameworkCore;

namespace Oksis.Infrastructure.IntegrationTests.Students.Lifecycle;

internal sealed record SeededStudent(
    Guid SchoolId, Guid SessionId, Guid ClassRoomId, Guid StudentPersonId, Guid EnrollmentId);

internal sealed class FixedClock(DateTimeOffset utcNow) : IDateTimeProvider
{
    public DateTimeOffset UtcNow => utcNow;
    public DateOnly Today => DateOnly.FromDateTime(utcNow.UtcDateTime);
}

internal static class LifecycleScenario
{
    public static readonly DateTimeOffset Now = new(2026, 6, 30, 12, 0, 0, TimeSpan.Zero);

    /// <summary>Okul + aktif sezon + aktif şube + tek aktif öğrenci (EnrollStudent ile) tohumlar.</summary>
    public static async Task<SeededStudent> SeedActiveStudentAsync(DatabaseFixture fixture)
    {
        var school = School.Create($"LC-{Guid.NewGuid():N}"[..18], $"LC-{Guid.NewGuid():N}"[..8], SchoolType.PrimarySchool);
        await using (var ctx = fixture.CreateDbContext())
        {
            ctx.Schools.Add(school);
            await ctx.SaveChangesAsync();
        }
        var schoolId = school.Id;

        Guid gradeLevelId;
        await using (var ctx = fixture.CreateDbContext())
        {
            var existing = await ctx.GradeLevels.FirstOrDefaultAsync(g => g.Code == "E5");
            if (existing is null)
            {
                var gl = GradeLevel.Create(Guid.NewGuid(), "E5", "5. Sınıf", 5, EducationLevel.Middle);
                ctx.GradeLevels.Add(gl);
                await ctx.SaveChangesAsync();
                gradeLevelId = gl.Id;
            }
            else { gradeLevelId = existing.Id; }
        }

        List<Guid> termTypeIds;
        await using (var ctx = fixture.CreateDbContext(schoolId))
        {
            termTypeIds = await ctx.AcademicTermTypes.AsNoTracking()
                .OrderBy(t => t.DisplayOrder).Take(2).Select(t => t.Id).ToListAsync();
        }

        Guid sessionId;
        await using (var ctx = fixture.CreateDbContext(schoolId))
        {
            var session = AcademicSession.Create(
                schoolId, $"S-{Guid.NewGuid():N}"[..10],
                new DateOnly(2025, 9, 15), new DateOnly(2026, 6, 13),
                termTypeIds[0], new DateOnly(2025, 9, 15), new DateOnly(2026, 1, 23),
                termTypeIds[1], new DateOnly(2026, 2, 10), new DateOnly(2026, 6, 13));
            session.Activate(DateTimeOffset.UtcNow, previousSessionId: null);
            ctx.AcademicSessions.Add(session);
            await ctx.SaveChangesAsync();
            sessionId = session.Id;
        }

        Guid classRoomId;
        await using (var ctx = fixture.CreateDbContext(schoolId))
        {
            var classRoom = ClassRoom.Create(schoolId, sessionId, gradeLevelId, "E5", "A", 30, requireApproval: false);
            ctx.ClassRooms.Add(classRoom);
            await ctx.SaveChangesAsync();
            classRoomId = classRoom.Id;
        }

        // Öğrenciyi EnrollStudent ile kaydet (person + profil + enrollment(Active) + şube ataması).
        var db = fixture.CreateDbContext(schoolId);
        var handler = new EnrollStudentCommandHandler(
            db, new FakeTenantContext(schoolId), new FixedClock(Now),
            Substitute.For<INationalIdProtector>(),
            new StudentNumberGenerator(db),
            new StudentAccountProvisioner(db,
                new Argon2IdPasswordHasher(Options.Create(new Argon2PasswordHasherOptions())),
                new TemporaryPasswordGenerator()));
        var command = new EnrollStudentCommand(
            ClientRequestId: Guid.NewGuid(), FirstName: "Ali", LastName: "Veli",
            Gender: Gender.Male, BirthDate: new DateOnly(2014, 3, 1),
            NationalId: null, NationalIdType: null, Email: null,
            Type: EnrollmentType.New, PreviousSchool: null,
            AcademicSessionId: sessionId, GradeLevel: 5, ClassRoomId: classRoomId,
            EnrollmentDate: new DateOnly(2025, 9, 15), Guardians: [], Invite: false, InviteChannel: null);
        var enrolled = await handler.Handle(command, CancellationToken.None);
        if (!enrolled.IsSuccess)
        {
            throw new InvalidOperationException($"Seed başarısız: {enrolled.Error.Code} — {enrolled.Error.Message}");
        }
        await db.DisposeAsync();

        Guid enrollmentId;
        await using (var verify = fixture.CreateDbContext(schoolId))
        {
            enrollmentId = await verify.StudentEnrollments.AsNoTracking()
                .Where(e => e.StudentPersonId == enrolled.Value!.StudentPersonId)
                .Select(e => e.Id).SingleAsync();
        }

        return new SeededStudent(schoolId, sessionId, classRoomId, enrolled.Value!.StudentPersonId, enrollmentId);
    }
}
```
> NOT: Üstteki `using`/kurucu imzaları `EnrollStudentTests.cs`'ten birebir alınmıştır. `Person.Create`/`Gender`/`StudentProfile` gibi tipler EnrollStudent akışında zaten kullanıldığı için seed dolaylı olarak doğrudur.

- [ ] **Step 5: Failing test — Freeze happy-path + invalid transition**

`FreezeEnrollmentTests.cs`:
```csharp
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Modules.Students.Commands.FreezeEnrollment;
using Oksis.Domain.Modules.Students.Enums;
using Oksis.Domain.Modules.Users.Enums;
using Oksis.Infrastructure.IntegrationTests.Fixtures;
using Xunit;

namespace Oksis.Infrastructure.IntegrationTests.Students.Lifecycle;

[Collection(DatabaseCollection.Name)]
public sealed class FreezeEnrollmentTests(DatabaseFixture fixture) : IAsyncLifetime
{
    public async Task InitializeAsync() => await fixture.EnsureDatabaseCreatedAsync();
    public Task DisposeAsync() => Task.CompletedTask;

    private FreezeEnrollmentCommandHandler Handler(Guid schoolId, ITenantContext? tenant = null)
        => new(fixture.CreateDbContext(schoolId), tenant ?? new FakeTenantContext(schoolId));

    [Fact]
    public async Task Freeze_sets_enrollment_frozen_and_person_suspended_keeping_classroom_seat()
    {
        var s = await LifecycleScenario.SeedActiveStudentAsync(fixture);

        var result = await Handler(s.SchoolId).Handle(
            new FreezeEnrollmentCommand(s.StudentPersonId, "Sağlık raporu"), CancellationToken.None);

        result.IsSuccess.Should().BeTrue($"hata: {result.Error?.Code} — {result.Error?.Message}");

        await using var verify = fixture.CreateDbContext(s.SchoolId);
        (await verify.StudentEnrollments.AsNoTracking().SingleAsync(e => e.Id == s.EnrollmentId))
            .Status.Should().Be(EnrollmentStatus.Frozen);
        (await verify.Persons.AsNoTracking().SingleAsync(p => p.Id == s.StudentPersonId))
            .LifecycleState.Should().Be(PersonLifecycleState.Suspended);
        // Şube koltuğu korunur (donmuş öğrenci dönecek).
        var activeSeats = await verify.ClassRooms.AsNoTracking()
            .Where(c => c.Id == s.ClassRoomId).SelectMany(c => c.Students)
            .CountAsync(st => st.LeftAt == null);
        activeSeats.Should().Be(1);
    }

    [Fact]
    public async Task Freeze_on_already_frozen_returns_conflict()
    {
        var s = await LifecycleScenario.SeedActiveStudentAsync(fixture);
        await Handler(s.SchoolId).Handle(new FreezeEnrollmentCommand(s.StudentPersonId, "İlk dondurma"), CancellationToken.None);

        var second = await Handler(s.SchoolId).Handle(
            new FreezeEnrollmentCommand(s.StudentPersonId, "Tekrar"), CancellationToken.None);

        second.IsFailure.Should().BeTrue();
        second.Error.Code.Should().Be("Error.Conflict");
    }

    [Fact]
    public async Task Freeze_without_tenant_is_forbidden()
    {
        var s = await LifecycleScenario.SeedActiveStudentAsync(fixture);

        var result = await Handler(s.SchoolId, new FakeTenantContext(null)).Handle(
            new FreezeEnrollmentCommand(s.StudentPersonId, "neden"), CancellationToken.None);

        result.Error.Code.Should().Be("Error.Forbidden");
    }
}
```
> NOT: `FakeTenantContext(null)` — null okul senaryosu. Mevcut `FakeTenantContext` null kabul etmiyorsa, testte tenant'ı `Substitute.For<ITenantContext>()` ile `CurrentSchoolId` null döndürerek kur (implementer mevcut FakeTenantContext'i kontrol eder).

- [ ] **Step 6: Run — fail (handler/komut yok)**

Run: `cd oksis-api && dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~FreezeEnrollmentTests"`
Expected: derleme hatası → komut/handler eklenince FAIL→PASS.

- [ ] **Step 7: Build + test PASS**

Run: `cd oksis-api && dotnet build && dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~FreezeEnrollmentTests"`
Expected: 3/3 PASS.

- [ ] **Step 8: Commit**

```bash
cd oksis-api && git add -A && git commit -m "$(cat <<'EOF'
2026-06-30 feat,test: FreezeEnrollment komutu + lifecycle test scaffolding (enrollment→Frozen, person→Suspended, şube koltuğu korunur).

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01MiBCgS3zvFNBSmo6UdSivy
EOF
)"
```

---

## Task 3: ResumeEnrollment komutu

**Files:**
- Create: `.../Commands/ResumeEnrollment/ResumeEnrollmentCommand.cs`
- Create: `.../ResumeEnrollment/ResumeEnrollmentCommandValidator.cs`
- Create: `.../ResumeEnrollment/ResumeEnrollmentCommandHandler.cs`
- Modify: `StudentsController.cs` (route)
- Create: `tests/.../Students/Lifecycle/ResumeEnrollmentTests.cs`

**Interfaces:**
- Consumes: `LifecycleScenario.SeedActiveStudentAsync` (Task 2), `FreezeEnrollmentCommand` (önce dondurmak için).
- Produces: `ResumeEnrollmentCommand(Guid StudentId) : ICommand`.

- [ ] **Step 1: Command + Validator**

```csharp
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Cqrs;

namespace Oksis.Application.Modules.Students.Commands.ResumeEnrollment;

[Tenancy(TenancyMode.Required)]
[RequirePermission("students.manage")]
public sealed record ResumeEnrollmentCommand(Guid StudentId) : ICommand;
```
```csharp
using FluentValidation;

namespace Oksis.Application.Modules.Students.Commands.ResumeEnrollment;

public sealed class ResumeEnrollmentCommandValidator : AbstractValidator<ResumeEnrollmentCommand>
{
    public ResumeEnrollmentCommandValidator() => RuleFor(x => x.StudentId).NotEmpty();
}
```

- [ ] **Step 2: Handler**

```csharp
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Domain.Modules.Students.Enums;
using Oksis.Shared;

namespace Oksis.Application.Modules.Students.Commands.ResumeEnrollment;

public sealed class ResumeEnrollmentCommandHandler(
    IApplicationDbContext db,
    ITenantContext tenant)
    : ICommandHandler<ResumeEnrollmentCommand>
{
    public async Task<Result> Handle(ResumeEnrollmentCommand request, CancellationToken ct)
    {
        if (tenant.CurrentSchoolId is null)
        {
            return Result.Forbidden();
        }

        var sessionId = await db.AcademicSessions
            .Where(s => s.IsCurrent).Select(s => (Guid?)s.Id).FirstOrDefaultAsync(ct);
        if (sessionId is null)
        {
            return Result.NotFound();
        }

        var enrollment = await db.StudentEnrollments
            .FirstOrDefaultAsync(e => e.StudentPersonId == request.StudentId && e.AcademicSessionId == sessionId, ct);
        if (enrollment is null)
        {
            return Result.NotFound();
        }

        if (enrollment.Status != EnrollmentStatus.Frozen)
        {
            return Result.Conflict("students.errors.invalid-lifecycle-transition");
        }

        var person = await db.Persons.FirstOrDefaultAsync(p => p.Id == request.StudentId, ct);
        if (person is null)
        {
            return Result.NotFound();
        }

        enrollment.Resume();      // Frozen → Active
        person.Reactivate();      // Suspended → Active
        await db.SaveChangesAsync(ct);
        return Result.Success();
    }
}
```

- [ ] **Step 3: Controller route**

```csharp
    [HttpPost("students/{id:guid}:resume")]
    public async Task<IActionResult> Resume(Guid id, CancellationToken ct)
        => (await sender.Send(new ResumeEnrollmentCommand(id), ct)).ToHttpResult(HttpContext);
```

- [ ] **Step 4: Failing test**

`ResumeEnrollmentTests.cs`:
```csharp
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Modules.Students.Commands.FreezeEnrollment;
using Oksis.Application.Modules.Students.Commands.ResumeEnrollment;
using Oksis.Domain.Modules.Students.Enums;
using Oksis.Domain.Modules.Users.Enums;
using Oksis.Infrastructure.IntegrationTests.Fixtures;
using Xunit;

namespace Oksis.Infrastructure.IntegrationTests.Students.Lifecycle;

[Collection(DatabaseCollection.Name)]
public sealed class ResumeEnrollmentTests(DatabaseFixture fixture) : IAsyncLifetime
{
    public async Task InitializeAsync() => await fixture.EnsureDatabaseCreatedAsync();
    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task Resume_returns_frozen_student_to_active()
    {
        var s = await LifecycleScenario.SeedActiveStudentAsync(fixture);
        await new FreezeEnrollmentCommandHandler(fixture.CreateDbContext(s.SchoolId), new FakeTenantContext(s.SchoolId))
            .Handle(new FreezeEnrollmentCommand(s.StudentPersonId, "Geçici"), CancellationToken.None);

        var result = await new ResumeEnrollmentCommandHandler(
            fixture.CreateDbContext(s.SchoolId), new FakeTenantContext(s.SchoolId))
            .Handle(new ResumeEnrollmentCommand(s.StudentPersonId), CancellationToken.None);

        result.IsSuccess.Should().BeTrue($"hata: {result.Error?.Code}");
        await using var verify = fixture.CreateDbContext(s.SchoolId);
        (await verify.StudentEnrollments.AsNoTracking().SingleAsync(e => e.Id == s.EnrollmentId))
            .Status.Should().Be(EnrollmentStatus.Active);
        (await verify.Persons.AsNoTracking().SingleAsync(p => p.Id == s.StudentPersonId))
            .LifecycleState.Should().Be(PersonLifecycleState.Active);
    }

    [Fact]
    public async Task Resume_on_active_enrollment_returns_conflict()
    {
        var s = await LifecycleScenario.SeedActiveStudentAsync(fixture);

        var result = await new ResumeEnrollmentCommandHandler(
            fixture.CreateDbContext(s.SchoolId), new FakeTenantContext(s.SchoolId))
            .Handle(new ResumeEnrollmentCommand(s.StudentPersonId), CancellationToken.None);

        result.Error.Code.Should().Be("Error.Conflict");
    }
}
```

- [ ] **Step 5: Run — fail, sonra implement, sonra PASS**

Run: `cd oksis-api && dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~ResumeEnrollmentTests"`
Expected: 2/2 PASS.

- [ ] **Step 6: Build + commit**

```bash
cd oksis-api && dotnet build && git add -A && git commit -m "$(cat <<'EOF'
2026-06-30 feat,test: ResumeEnrollment komutu (Frozen→Active, person Reactivate).

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01MiBCgS3zvFNBSmo6UdSivy
EOF
)"
```

---

## Task 4: WithdrawStudent komutu

**Files:**
- Create: `.../Commands/WithdrawStudent/{WithdrawStudentCommand,WithdrawStudentCommandValidator,WithdrawStudentCommandHandler}.cs`
- Modify: `StudentsController.cs` (route)
- Create: `tests/.../Students/Lifecycle/WithdrawStudentTests.cs`

**Interfaces:**
- Consumes: `LifecycleScenario`, `ClassRoom.RemoveStudent`, `StudentProfile.Deactivate/RemoveFromClassroom`, `Person.Suspend`.
- Produces: `WithdrawStudentCommand(Guid StudentId, string Reason) : ICommand`.

- [ ] **Step 1: Command + Validator**

```csharp
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Cqrs;

namespace Oksis.Application.Modules.Students.Commands.WithdrawStudent;

[Tenancy(TenancyMode.Required)]
[RequirePermission("students.manage")]
public sealed record WithdrawStudentCommand(Guid StudentId, string Reason) : ICommand;
```
```csharp
using FluentValidation;

namespace Oksis.Application.Modules.Students.Commands.WithdrawStudent;

public sealed class WithdrawStudentCommandValidator : AbstractValidator<WithdrawStudentCommand>
{
    public WithdrawStudentCommandValidator()
    {
        RuleFor(x => x.StudentId).NotEmpty();
        RuleFor(x => x.Reason)
            .NotEmpty().MinimumLength(3).MaximumLength(500)
            .WithMessage("students.errors.lifecycle-reason-required");
    }
}
```

- [ ] **Step 2: Handler (3 eksen: enrollment + şube/profil + person)**

```csharp
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Domain.Modules.AcademicSessions.Enums;
using Oksis.Domain.Modules.Students.Enums;
using Oksis.Domain.Modules.Users.Entities;
using Oksis.Shared;

namespace Oksis.Application.Modules.Students.Commands.WithdrawStudent;

public sealed class WithdrawStudentCommandHandler(
    IApplicationDbContext db,
    ITenantContext tenant,
    IDateTimeProvider clock)
    : ICommandHandler<WithdrawStudentCommand>
{
    public async Task<Result> Handle(WithdrawStudentCommand request, CancellationToken ct)
    {
        if (tenant.CurrentSchoolId is null)
        {
            return Result.Forbidden();
        }

        var sessionId = await db.AcademicSessions
            .Where(s => s.IsCurrent).Select(s => (Guid?)s.Id).FirstOrDefaultAsync(ct);
        if (sessionId is null)
        {
            return Result.NotFound();
        }

        var enrollment = await db.StudentEnrollments
            .FirstOrDefaultAsync(e => e.StudentPersonId == request.StudentId && e.AcademicSessionId == sessionId, ct);
        if (enrollment is null)
        {
            return Result.NotFound();
        }

        if (enrollment.Status != EnrollmentStatus.Active)
        {
            return Result.Conflict("students.errors.invalid-lifecycle-transition");
        }

        var person = await db.Persons.FirstOrDefaultAsync(p => p.Id == request.StudentId, ct);
        if (person is null)
        {
            return Result.NotFound();
        }

        // Şube üyeliğini kapat (tek doğruluk kaynağı ClassRoomStudent — E1.3).
        if (enrollment.ClassRoomId is Guid classRoomId)
        {
            var classRoom = await db.ClassRooms
                .Include(c => c.Students)
                .FirstOrDefaultAsync(c => c.Id == classRoomId, ct);
            if (classRoom is not null && classRoom.Students.Any(st => st.StudentId == request.StudentId && st.IsActive))
            {
                classRoom.RemoveStudent(request.StudentId, clock.UtcNow, AssignmentReason.Withdrawal, notes: null);
            }
        }

        var profile = await db.Profiles.OfType<StudentProfile>()
            .FirstOrDefaultAsync(p => p.PersonId == request.StudentId, ct);
        profile?.RemoveFromClassroom();
        profile?.Deactivate();

        enrollment.Withdraw();          // Active → Withdrawn
        person.Suspend(request.Reason); // Active → Suspended
        await db.SaveChangesAsync(ct);
        return Result.Success();
    }
}
```

- [ ] **Step 3: Controller route**

```csharp
    [HttpPost("students/{id:guid}:withdraw")]
    public async Task<IActionResult> Withdraw(Guid id, [FromBody] WithdrawRequest body, CancellationToken ct)
        => (await sender.Send(new WithdrawStudentCommand(id, body.Reason), ct)).ToHttpResult(HttpContext);
```

- [ ] **Step 4: Failing test (3 eksen + cross-tenant)**

`WithdrawStudentTests.cs`:
```csharp
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Modules.Students.Commands.WithdrawStudent;
using Oksis.Domain.Modules.Students.Enums;
using Oksis.Domain.Modules.Users.Enums;
using Oksis.Infrastructure.IntegrationTests.Fixtures;
using Xunit;

namespace Oksis.Infrastructure.IntegrationTests.Students.Lifecycle;

[Collection(DatabaseCollection.Name)]
public sealed class WithdrawStudentTests(DatabaseFixture fixture) : IAsyncLifetime
{
    public async Task InitializeAsync() => await fixture.EnsureDatabaseCreatedAsync();
    public Task DisposeAsync() => Task.CompletedTask;

    private WithdrawStudentCommandHandler Handler(Guid schoolId)
        => new(fixture.CreateDbContext(schoolId), new FakeTenantContext(schoolId),
               new FixedClock(LifecycleScenario.Now));

    [Fact]
    public async Task Withdraw_terminates_enrollment_closes_seat_and_suspends_person()
    {
        var s = await LifecycleScenario.SeedActiveStudentAsync(fixture);

        var result = await Handler(s.SchoolId).Handle(
            new WithdrawStudentCommand(s.StudentPersonId, "Şehir değişikliği"), CancellationToken.None);

        result.IsSuccess.Should().BeTrue($"hata: {result.Error?.Code} — {result.Error?.Message}");
        await using var verify = fixture.CreateDbContext(s.SchoolId);
        (await verify.StudentEnrollments.AsNoTracking().SingleAsync(e => e.Id == s.EnrollmentId))
            .Status.Should().Be(EnrollmentStatus.Withdrawn);
        (await verify.Persons.AsNoTracking().SingleAsync(p => p.Id == s.StudentPersonId))
            .LifecycleState.Should().Be(PersonLifecycleState.Suspended);
        // Şube koltuğu kapandı.
        var activeSeats = await verify.ClassRooms.AsNoTracking()
            .Where(c => c.Id == s.ClassRoomId).SelectMany(c => c.Students)
            .CountAsync(st => st.LeftAt == null);
        activeSeats.Should().Be(0);
        // Profil mirror temizlendi + pasif.
        var profile = await verify.Profiles.OfType<Oksis.Domain.Modules.Users.Entities.StudentProfile>()
            .AsNoTracking().SingleAsync(p => p.PersonId == s.StudentPersonId);
        profile.CurrentClassroomId.Should().BeNull();
        profile.IsActiveStudent.Should().BeFalse();
    }

    [Fact]
    public async Task Withdraw_other_school_student_is_not_found_cross_tenant()
    {
        var s = await LifecycleScenario.SeedActiveStudentAsync(fixture);
        var otherSchoolId = Guid.NewGuid();

        // Başka tenant context → query filter öğrenciyi göstermez.
        var result = await Handler(otherSchoolId).Handle(
            new WithdrawStudentCommand(s.StudentPersonId, "neden"), CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("Error.NotFound");
    }
}
```
> NOT: cross-tenant testte aktif sezon `otherSchoolId` için yok → handler `NotFound` döner (sessionId null veya enrollment görünmez). İki yol da `NotFound`'a çıkar; assertion bunu doğrular.

- [ ] **Step 5: Run + build + PASS**

Run: `cd oksis-api && dotnet build && dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~WithdrawStudentTests"`
Expected: 2/2 PASS.

- [ ] **Step 6: Commit**

```bash
cd oksis-api && git add -A && git commit -m "$(cat <<'EOF'
2026-06-30 feat,test: WithdrawStudent komutu (enrollment→Withdrawn, şube Close, profil pasif, person Suspend) + cross-tenant testi.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01MiBCgS3zvFNBSmo6UdSivy
EOF
)"
```

---

## Task 5: TransferOutStudent komutu

**Files:**
- Create: `.../Commands/TransferOutStudent/{TransferOutStudentCommand,TransferOutStudentCommandValidator,TransferOutStudentCommandHandler}.cs`
- Modify: `StudentsController.cs` (route)
- Create: `tests/.../Students/Lifecycle/TransferOutStudentTests.cs`

**Interfaces:**
- Consumes: `LifecycleScenario`, `ClassRoom.RemoveStudent(AssignmentReason.TransferOut)`, `Person.Transfer(Guid?)`.
- Produces: `TransferOutStudentCommand(Guid StudentId, Guid? TargetSchoolId, string? Reason) : ICommand`.

- [ ] **Step 1: Command + Validator**

```csharp
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Cqrs;

namespace Oksis.Application.Modules.Students.Commands.TransferOutStudent;

[Tenancy(TenancyMode.Required)]
[RequirePermission("students.manage")]
public sealed record TransferOutStudentCommand(Guid StudentId, Guid? TargetSchoolId, string? Reason) : ICommand;
```
```csharp
using FluentValidation;

namespace Oksis.Application.Modules.Students.Commands.TransferOutStudent;

public sealed class TransferOutStudentCommandValidator : AbstractValidator<TransferOutStudentCommand>
{
    public TransferOutStudentCommandValidator()
    {
        RuleFor(x => x.StudentId).NotEmpty();
        RuleFor(x => x.Reason).MaximumLength(500).When(x => x.Reason is not null);
    }
}
```

- [ ] **Step 2: Handler**

```csharp
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Domain.Modules.AcademicSessions.Enums;
using Oksis.Domain.Modules.Students.Enums;
using Oksis.Domain.Modules.Users.Entities;
using Oksis.Shared;

namespace Oksis.Application.Modules.Students.Commands.TransferOutStudent;

public sealed class TransferOutStudentCommandHandler(
    IApplicationDbContext db,
    ITenantContext tenant,
    IDateTimeProvider clock)
    : ICommandHandler<TransferOutStudentCommand>
{
    public async Task<Result> Handle(TransferOutStudentCommand request, CancellationToken ct)
    {
        if (tenant.CurrentSchoolId is null)
        {
            return Result.Forbidden();
        }

        var sessionId = await db.AcademicSessions
            .Where(s => s.IsCurrent).Select(s => (Guid?)s.Id).FirstOrDefaultAsync(ct);
        if (sessionId is null)
        {
            return Result.NotFound();
        }

        var enrollment = await db.StudentEnrollments
            .FirstOrDefaultAsync(e => e.StudentPersonId == request.StudentId && e.AcademicSessionId == sessionId, ct);
        if (enrollment is null)
        {
            return Result.NotFound();
        }

        if (enrollment.Status != EnrollmentStatus.Active)
        {
            return Result.Conflict("students.errors.invalid-lifecycle-transition");
        }

        var person = await db.Persons.FirstOrDefaultAsync(p => p.Id == request.StudentId, ct);
        if (person is null)
        {
            return Result.NotFound();
        }

        if (enrollment.ClassRoomId is Guid classRoomId)
        {
            var classRoom = await db.ClassRooms
                .Include(c => c.Students)
                .FirstOrDefaultAsync(c => c.Id == classRoomId, ct);
            if (classRoom is not null && classRoom.Students.Any(st => st.StudentId == request.StudentId && st.IsActive))
            {
                classRoom.RemoveStudent(request.StudentId, clock.UtcNow, AssignmentReason.TransferOut, request.Reason);
            }
        }

        var profile = await db.Profiles.OfType<StudentProfile>()
            .FirstOrDefaultAsync(p => p.PersonId == request.StudentId, ct);
        profile?.RemoveFromClassroom();
        profile?.Deactivate();

        enrollment.TransferOut();              // Active → TransferredOut
        person.Transfer(request.TargetSchoolId); // null = dış nakil
        await db.SaveChangesAsync(ct);
        return Result.Success();
    }
}
```

- [ ] **Step 3: Controller route**

```csharp
    [HttpPost("students/{id:guid}:transfer-out")]
    public async Task<IActionResult> TransferOut(Guid id, [FromBody] TransferOutRequest body, CancellationToken ct)
        => (await sender.Send(new TransferOutStudentCommand(id, body.TargetSchoolId, body.Reason), ct)).ToHttpResult(HttpContext);
```

- [ ] **Step 4: Failing test (dış nakil = null hedef)**

`TransferOutStudentTests.cs`:
```csharp
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Modules.Students.Commands.TransferOutStudent;
using Oksis.Domain.Modules.Students.Enums;
using Oksis.Domain.Modules.Users.Entities;
using Oksis.Domain.Modules.Users.Enums;
using Oksis.Infrastructure.IntegrationTests.Fixtures;
using Xunit;

namespace Oksis.Infrastructure.IntegrationTests.Students.Lifecycle;

[Collection(DatabaseCollection.Name)]
public sealed class TransferOutStudentTests(DatabaseFixture fixture) : IAsyncLifetime
{
    public async Task InitializeAsync() => await fixture.EnsureDatabaseCreatedAsync();
    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task TransferOut_with_null_target_marks_transferred_and_closes_seat()
    {
        var s = await LifecycleScenario.SeedActiveStudentAsync(fixture);

        var result = await new TransferOutStudentCommandHandler(
                fixture.CreateDbContext(s.SchoolId), new FakeTenantContext(s.SchoolId), new FixedClock(LifecycleScenario.Now))
            .Handle(new TransferOutStudentCommand(s.StudentPersonId, TargetSchoolId: null, Reason: "Yurt dışı"), CancellationToken.None);

        result.IsSuccess.Should().BeTrue($"hata: {result.Error?.Code} — {result.Error?.Message}");
        await using var verify = fixture.CreateDbContext(s.SchoolId);
        (await verify.StudentEnrollments.AsNoTracking().SingleAsync(e => e.Id == s.EnrollmentId))
            .Status.Should().Be(EnrollmentStatus.TransferredOut);
        (await verify.Persons.AsNoTracking().SingleAsync(p => p.Id == s.StudentPersonId))
            .LifecycleState.Should().Be(PersonLifecycleState.Transferred);
        var profile = await verify.Profiles.OfType<StudentProfile>().AsNoTracking()
            .SingleAsync(p => p.PersonId == s.StudentPersonId);
        profile.IsActiveStudent.Should().BeFalse();
        profile.CurrentClassroomId.Should().BeNull();
    }
}
```

- [ ] **Step 5: Run + build + PASS**

Run: `cd oksis-api && dotnet build && dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~TransferOutStudentTests"`
Expected: 1/1 PASS.

- [ ] **Step 6: Commit**

```bash
cd oksis-api && git add -A && git commit -m "$(cat <<'EOF'
2026-06-30 feat,test: TransferOutStudent komutu (enrollment→TransferredOut, şube Close, person Transfer null hedef dahil).

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01MiBCgS3zvFNBSmo6UdSivy
EOF
)"
```

---

## Task 6: GraduateStudent komutu

**Files:**
- Create: `.../Commands/GraduateStudent/{GraduateStudentCommand,GraduateStudentCommandValidator,GraduateStudentCommandHandler}.cs`
- Modify: `StudentsController.cs` (route)
- Create: `tests/.../Students/Lifecycle/GraduateStudentTests.cs`

**Interfaces:**
- Consumes: `LifecycleScenario`, `ClassRoom.RemoveStudent(AssignmentReason.Graduation)` (mevcut `StudentGraduatedEvent`'i raise eder), `Person.Graduate()`.
- Produces: `GraduateStudentCommand(Guid StudentId) : ICommand`.

- [ ] **Step 1: Command + Validator**

```csharp
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Cqrs;

namespace Oksis.Application.Modules.Students.Commands.GraduateStudent;

[Tenancy(TenancyMode.Required)]
[RequirePermission("students.manage")]
public sealed record GraduateStudentCommand(Guid StudentId) : ICommand;
```
```csharp
using FluentValidation;

namespace Oksis.Application.Modules.Students.Commands.GraduateStudent;

public sealed class GraduateStudentCommandValidator : AbstractValidator<GraduateStudentCommand>
{
    public GraduateStudentCommandValidator() => RuleFor(x => x.StudentId).NotEmpty();
}
```

- [ ] **Step 2: Handler**

```csharp
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Domain.Modules.AcademicSessions.Enums;
using Oksis.Domain.Modules.Students.Enums;
using Oksis.Domain.Modules.Users.Entities;
using Oksis.Shared;

namespace Oksis.Application.Modules.Students.Commands.GraduateStudent;

public sealed class GraduateStudentCommandHandler(
    IApplicationDbContext db,
    ITenantContext tenant,
    IDateTimeProvider clock)
    : ICommandHandler<GraduateStudentCommand>
{
    public async Task<Result> Handle(GraduateStudentCommand request, CancellationToken ct)
    {
        if (tenant.CurrentSchoolId is null)
        {
            return Result.Forbidden();
        }

        var sessionId = await db.AcademicSessions
            .Where(s => s.IsCurrent).Select(s => (Guid?)s.Id).FirstOrDefaultAsync(ct);
        if (sessionId is null)
        {
            return Result.NotFound();
        }

        var enrollment = await db.StudentEnrollments
            .FirstOrDefaultAsync(e => e.StudentPersonId == request.StudentId && e.AcademicSessionId == sessionId, ct);
        if (enrollment is null)
        {
            return Result.NotFound();
        }

        if (enrollment.Status != EnrollmentStatus.Active)
        {
            return Result.Conflict("students.errors.invalid-lifecycle-transition");
        }

        var person = await db.Persons.FirstOrDefaultAsync(p => p.Id == request.StudentId, ct);
        if (person is null)
        {
            return Result.NotFound();
        }

        if (enrollment.ClassRoomId is Guid classRoomId)
        {
            var classRoom = await db.ClassRooms
                .Include(c => c.Students)
                .FirstOrDefaultAsync(c => c.Id == classRoomId, ct);
            if (classRoom is not null && classRoom.Students.Any(st => st.StudentId == request.StudentId && st.IsActive))
            {
                classRoom.RemoveStudent(request.StudentId, clock.UtcNow, AssignmentReason.Graduation, notes: null);
            }
        }

        var profile = await db.Profiles.OfType<StudentProfile>()
            .FirstOrDefaultAsync(p => p.PersonId == request.StudentId, ct);
        profile?.RemoveFromClassroom();
        profile?.Deactivate();

        enrollment.Graduate();  // Active → Graduated
        person.Graduate();      // Active → Graduated (öğrenci profili gerekli — mevcut)
        await db.SaveChangesAsync(ct);
        return Result.Success();
    }
}
```

- [ ] **Step 3: Controller route**

```csharp
    [HttpPost("students/{id:guid}:graduate")]
    public async Task<IActionResult> Graduate(Guid id, CancellationToken ct)
        => (await sender.Send(new GraduateStudentCommand(id), ct)).ToHttpResult(HttpContext);
```

- [ ] **Step 4: Failing test**

`GraduateStudentTests.cs`:
```csharp
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Modules.Students.Commands.GraduateStudent;
using Oksis.Domain.Modules.Students.Enums;
using Oksis.Domain.Modules.Users.Entities;
using Oksis.Domain.Modules.Users.Enums;
using Oksis.Infrastructure.IntegrationTests.Fixtures;
using Xunit;

namespace Oksis.Infrastructure.IntegrationTests.Students.Lifecycle;

[Collection(DatabaseCollection.Name)]
public sealed class GraduateStudentTests(DatabaseFixture fixture) : IAsyncLifetime
{
    public async Task InitializeAsync() => await fixture.EnsureDatabaseCreatedAsync();
    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task Graduate_marks_enrollment_and_person_graduated_and_closes_seat()
    {
        var s = await LifecycleScenario.SeedActiveStudentAsync(fixture);

        var result = await new GraduateStudentCommandHandler(
                fixture.CreateDbContext(s.SchoolId), new FakeTenantContext(s.SchoolId), new FixedClock(LifecycleScenario.Now))
            .Handle(new GraduateStudentCommand(s.StudentPersonId), CancellationToken.None);

        result.IsSuccess.Should().BeTrue($"hata: {result.Error?.Code} — {result.Error?.Message}");
        await using var verify = fixture.CreateDbContext(s.SchoolId);
        (await verify.StudentEnrollments.AsNoTracking().SingleAsync(e => e.Id == s.EnrollmentId))
            .Status.Should().Be(EnrollmentStatus.Graduated);
        (await verify.Persons.AsNoTracking().SingleAsync(p => p.Id == s.StudentPersonId))
            .LifecycleState.Should().Be(PersonLifecycleState.Graduated);
        var activeSeats = await verify.ClassRooms.AsNoTracking()
            .Where(c => c.Id == s.ClassRoomId).SelectMany(c => c.Students)
            .CountAsync(st => st.LeftAt == null);
        activeSeats.Should().Be(0);
    }
}
```

- [ ] **Step 5: Run + build + PASS + full lifecycle suite**

Run: `cd oksis-api && dotnet build && dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~Students.Lifecycle"`
Expected: tüm lifecycle testleri PASS.

- [ ] **Step 6: Commit**

```bash
cd oksis-api && git add -A && git commit -m "$(cat <<'EOF'
2026-06-30 feat,test: GraduateStudent komutu (enrollment→Graduated, şube Close, person Graduate).

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01MiBCgS3zvFNBSmo6UdSivy
EOF
)"
```

---

## Task 7: Frontend — studentsApi lifecycle metotları + hata i18n anahtarları

**Files:**
- Modify: `oksis-web/src/portals/admin/students/api/studentsApi.ts:576-610` (5 metot → enrollment uçları)
- Modify: `oksis-web/src/shared/i18n/locales/tr/students.json` (rowActions.confirm + errors anahtarları)
- Modify: `oksis-web/src/shared/i18n/locales/en/students.json`
- Test: `oksis-web/src/portals/admin/students/api/__tests__/studentsApi.lifecycle.test.ts` (yeni; mevcut studentsApi testlerinin klasör konvansiyonunu izle)

**Interfaces:**
- Produces: `studentsApi.freeze(id, reason)`, `.resume(id)`, `.withdraw(id, reason)`, `.transferOut(id, { targetSchoolId?, reason? })`, `.graduate(id)` — hepsi `POST /students/{id}:action`.

- [ ] **Step 1: studentsApi lifecycle metotlarını enrollment uçlarına taşı**

`studentsApi.ts`'teki mevcut suspend/reactivate/graduate/transferOut/deactivate bloğunu (576-610) şununla değiştir:
```typescript
  // ── Domain yaşam-döngüsü aksiyonları (Faz 2B). Enrollment ekseninde; backend
  //    aktif sezon enrollment'ını çözer. StudentListItem.id = Person.id. ──

  /** Kaydı dondur — `POST /students/{id}:freeze` (neden zorunlu). */
  freeze: async (studentId: string, reason: string): Promise<void> => {
    await httpClient.post(`/students/${studentId}:freeze`, { reason });
  },

  /** Donmuş kaydı devam ettir — `POST /students/{id}:resume`. */
  resume: async (studentId: string): Promise<void> => {
    await httpClient.post(`/students/${studentId}:resume`, {});
  },

  /** Kaydı sonlandır / ayrılma — `POST /students/{id}:withdraw` (neden zorunlu). */
  withdraw: async (studentId: string, reason: string): Promise<void> => {
    await httpClient.post(`/students/${studentId}:withdraw`, { reason });
  },

  /** Nakil çıkışı — `POST /students/{id}:transfer-out`. Hedef OKSİS dışıysa boş bırakılır. */
  transferOut: async (
    studentId: string,
    input?: { targetSchoolId?: string; reason?: string },
  ): Promise<void> => {
    await httpClient.post(`/students/${studentId}:transfer-out`, {
      targetSchoolId: input?.targetSchoolId ?? null,
      reason: input?.reason ?? null,
    });
  },

  /** Mezun et — `POST /students/{id}:graduate`. */
  graduate: async (studentId: string): Promise<void> => {
    await httpClient.post(`/students/${studentId}:graduate`, {});
  },
```

- [ ] **Step 2: i18n anahtarları (tr)**

`tr/students.json` içindeki `rowActions` bloğunda `notReady2B`'yi kaldırıp `confirm` bloğunu genişlet, `errors` bloğuna 3 anahtar ekle:
```json
      "freeze": "Kaydı dondur",
      "reactivate": "Kaydı devam ettir",
      "deactivate": "Kaydı sonlandır",
      "confirm": {
        "cancel": "Vazgeç",
        "reasonLabel": "Gerekçe",
        "reasonPlaceholder": "Kısa bir gerekçe yazın (zorunlu)",
        "targetSchoolLabel": "Hedef okul (OKSİS dışıysa boş bırakın)",
        "freezeTitle": "Kaydı dondur",
        "freezeBody": "{{name}} kaydı dondurulsun mu? Öğrenci şubede kalır, gerekçeyle askıya alınır.",
        "freezeCta": "Dondur",
        "resumeTitle": "Kaydı devam ettir",
        "resumeBody": "{{name}} kaydı yeniden etkinleştirilsin mi?",
        "resumeCta": "Devam Ettir",
        "withdrawTitle": "Kaydı sonlandır",
        "withdrawBody": "{{name}} okuldan ayrılsın mı? Aktif listeden düşer, filtreyle erişilebilir. Veriler silinmez.",
        "withdrawCta": "Sonlandır",
        "graduateTitle": "Öğrenciyi mezun et",
        "graduateBody": "{{name}} mezun edilsin mi? Mezun öğrenci aktif listeden düşer, filtreyle erişilebilir.",
        "graduateCta": "Mezun Et",
        "transferTitle": "Nakil çıkışı",
        "transferBody": "{{name}} için nakil çıkışı yapılsın mı? Öğrenci aktif listeden düşer.",
        "transferCta": "Nakil Çıkışı Yap"
      }
```
Ayrıca aynı dosyadaki `errors` bloğuna ekle:
```json
      "invalid-lifecycle-transition": "Bu işlem öğrencinin mevcut durumunda yapılamaz.",
      "lifecycle-reason-required": "Gerekçe zorunludur (en az 3 karakter).",
      "no-current-enrollment": "Aktif sezonda bu öğrenciye ait kayıt bulunamadı."
```

- [ ] **Step 3: i18n anahtarları (en)**

`en/students.json`'a aynı anahtarların İngilizcesini ekle (freezeTitle "Freeze enrollment", withdrawCta "End enrollment", vb.; `errors.invalid-lifecycle-transition` "This action isn't allowed in the student's current state.").

- [ ] **Step 4: Failing test — studentsApi URL/gövde**

`studentsApi.lifecycle.test.ts` (mevcut studentsApi test dosyalarındaki httpClient mock pattern'ini izle):
```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { studentsApi } from "../studentsApi";
import { httpClient } from "../../../../../shared/api/httpClient";

vi.mock("../../../../../shared/api/httpClient", () => ({
  httpClient: { post: vi.fn().mockResolvedValue({ data: null }) },
}));

describe("studentsApi lifecycle", () => {
  beforeEach(() => vi.clearAllMocks());

  it("freeze posts reason to :freeze", async () => {
    await studentsApi.freeze("stu-1", "Sağlık");
    expect(httpClient.post).toHaveBeenCalledWith("/students/stu-1:freeze", { reason: "Sağlık" });
  });

  it("withdraw posts reason to :withdraw", async () => {
    await studentsApi.withdraw("stu-1", "Ayrıldı");
    expect(httpClient.post).toHaveBeenCalledWith("/students/stu-1:withdraw", { reason: "Ayrıldı" });
  });

  it("transferOut posts nullable target+reason to :transfer-out", async () => {
    await studentsApi.transferOut("stu-1");
    expect(httpClient.post).toHaveBeenCalledWith("/students/stu-1:transfer-out", {
      targetSchoolId: null, reason: null,
    });
  });

  it("graduate posts to :graduate", async () => {
    await studentsApi.graduate("stu-1");
    expect(httpClient.post).toHaveBeenCalledWith("/students/stu-1:graduate", {});
  });

  it("resume posts to :resume", async () => {
    await studentsApi.resume("stu-1");
    expect(httpClient.post).toHaveBeenCalledWith("/students/stu-1:resume", {});
  });
});
```
> NOT: `httpClient` mock göreli yolu, dosyanın konumuna göre doğrulanmalı (mevcut studentsApi testlerindeki yolu birebir kopyala).

- [ ] **Step 5: Run + PASS**

Run: `cd oksis-web && npm run test -- studentsApi.lifecycle`
Expected: 5/5 PASS.

- [ ] **Step 6: Commit**

```bash
cd oksis-web && git add -A && git commit -m "$(cat <<'EOF'
2026-06-30 feat,test: FE studentsApi lifecycle metotları enrollment uçlarına taşındı (freeze/resume/withdraw/transfer-out/graduate) + i18n + testler.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01MiBCgS3zvFNBSmo6UdSivy
EOF
)"
```

---

## Task 8: Frontend — useStudentLifecycle hook + LifecycleActionDialog

**Files:**
- Create: `oksis-web/src/portals/admin/students/hooks/useStudentLifecycle.ts`
- Create: `oksis-web/src/portals/admin/students/components/LifecycleActionDialog.tsx`
- Test: `oksis-web/src/portals/admin/students/components/__tests__/LifecycleActionDialog.test.tsx`

**Interfaces:**
- Consumes: `studentsApi` (Task 7), `useGuardianMutations`/`studentKeys` pattern (mevcut), `ConfirmDialog`/`Modal` primitifi (mevcut `shared/components/modal/`).
- Produces:
  - `useStudentLifecycle(studentId) → { freeze, resume, withdraw, transferOut, graduate }` (her biri React Query mutation; başarıda students list + detail invalidate).
  - `LifecycleAction = "freeze" | "resume" | "withdraw" | "transferOut" | "graduate"`.
  - `LifecycleActionDialog({ action, student, open, isPending, onConfirm, onClose })` — `onConfirm(payload)` çağırır: freeze/withdraw `{ reason }`, transferOut `{ targetSchoolId?, reason? }`, resume/graduate `undefined`.

- [ ] **Step 1: useStudentLifecycle hook**

`useStudentLifecycle.ts` (`useGuardianMutations.ts` pattern'i — stabil mutateAsync, invalidate):
```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../../../shared/store/authStore";
import { studentsApi } from "../api/studentsApi";
import { studentKeys } from "../keys/studentKeys";

/**
 * Öğrenci yaşam-döngüsü mutasyonları (Faz 2B). Her başarılı geçiş öğrenci
 * listesini + ilgili detayı invalidate eder. Tüm erişim studentsApi üzerinden.
 */
export function useStudentLifecycle(studentId: string) {
  const queryClient = useQueryClient();
  const schoolId = useAuthStore((s) => s.user?.schoolId);

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: studentKeys.all(schoolId) }),
      queryClient.invalidateQueries({ queryKey: studentKeys.detail(schoolId, studentId) }),
    ]);
  };

  const freeze = useMutation({
    mutationFn: (reason: string) => studentsApi.freeze(studentId, reason),
    onSuccess: invalidate,
  });
  const resume = useMutation({
    mutationFn: () => studentsApi.resume(studentId),
    onSuccess: invalidate,
  });
  const withdraw = useMutation({
    mutationFn: (reason: string) => studentsApi.withdraw(studentId, reason),
    onSuccess: invalidate,
  });
  const transferOut = useMutation({
    mutationFn: (input: { targetSchoolId?: string; reason?: string }) =>
      studentsApi.transferOut(studentId, input),
    onSuccess: invalidate,
  });
  const graduate = useMutation({
    mutationFn: () => studentsApi.graduate(studentId),
    onSuccess: invalidate,
  });

  return { freeze, resume, withdraw, transferOut, graduate };
}
```
> NOT: `studentKeys.detail` anahtarının imzasını implementer `keys/studentKeys.ts`'ten doğrular (Faz 2A'da eklendi). Yoksa yalnız `studentKeys.all(schoolId)` invalidate edilir.

- [ ] **Step 2: LifecycleActionDialog component**

`LifecycleActionDialog.tsx` — mevcut `ConfirmDialog`/`Modal` primitifini sarmalar; reason gerektiren aksiyonlarda RHF + zod ile zorunlu Textarea. Implementer `shared/components/modal/ConfirmDialog.tsx` ve `Modal.tsx`'i okuyup aynı primitifi kullanır:
```tsx
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Modal } from "../../../../shared/components/modal/Modal";
import type { StudentListItem } from "../types";

export type LifecycleAction = "freeze" | "resume" | "withdraw" | "transferOut" | "graduate";

const REASON_REQUIRED: ReadonlySet<LifecycleAction> = new Set(["freeze", "withdraw"]);

interface Props {
  action: LifecycleAction | null;
  student: StudentListItem | null;
  open: boolean;
  isPending: boolean;
  onClose: () => void;
  onConfirm: (payload: { reason?: string; targetSchoolId?: string }) => void;
}

const schema = z.object({
  reason: z.string().trim().optional(),
  targetSchoolId: z.string().trim().optional(),
});
type FormValues = z.infer<typeof schema>;

/**
 * Yaşam-döngüsü onay diyaloğu (Faz 2B). freeze/withdraw → zorunlu gerekçe;
 * transferOut → opsiyonel hedef okul + gerekçe; resume/graduate → düz onay.
 */
export function LifecycleActionDialog({ action, student, open, isPending, onClose, onConfirm }: Props) {
  const { t } = useTranslation("students");
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { reason: "", targetSchoolId: "" },
  });

  useEffect(() => {
    if (open) reset({ reason: "", targetSchoolId: "" });
  }, [open, action, reset]);

  if (!action || !student) return null;

  const needsReason = REASON_REQUIRED.has(action);
  const name = student.fullName;

  const submit = handleSubmit((values) => {
    if (needsReason && (!values.reason || values.reason.length < 3)) return; // guard
    onConfirm({
      reason: values.reason || undefined,
      targetSchoolId: values.targetSchoolId || undefined,
    });
  });

  return (
    <div className="scr">
      <Modal open={open} onClose={onClose} title={t(`rowActions.confirm.${action}Title`)}>
        <p>{t(`rowActions.confirm.${action}Body`, { name })}</p>

        {(needsReason || action === "transferOut") && (
          <label className="lc-field">
            <span>{t("rowActions.confirm.reasonLabel")}{needsReason ? " *" : ""}</span>
            <textarea
              {...register("reason", needsReason ? { required: true, minLength: 3 } : {})}
              placeholder={t("rowActions.confirm.reasonPlaceholder")}
              rows={3}
            />
            {needsReason && errors.reason && (
              <small className="lc-error">{t("errors.lifecycle-reason-required")}</small>
            )}
          </label>
        )}

        {action === "transferOut" && (
          <label className="lc-field">
            <span>{t("rowActions.confirm.targetSchoolLabel")}</span>
            <input type="text" {...register("targetSchoolId")} />
          </label>
        )}

        <div className="lc-actions">
          <button type="button" onClick={onClose} disabled={isPending}>
            {t("rowActions.confirm.cancel")}
          </button>
          <button type="button" onClick={submit} disabled={isPending}>
            {t(`rowActions.confirm.${action}Cta`)}
          </button>
        </div>
      </Modal>
    </div>
  );
}
```
> NOT: `Modal` prop imzası (`open`/`onClose`/`title`/children) `shared/components/modal/Modal.tsx`'ten doğrulanır; farklıysa `ConfirmDialog`'un kullandığı sarmalama birebir uygulanır. `StudentListItem.fullName` alan adı `types`'tan doğrulanır.

- [ ] **Step 3: Failing test — zorunlu gerekçe boşsa onConfirm çağrılmaz**

`LifecycleActionDialog.test.tsx`:
```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LifecycleActionDialog } from "../LifecycleActionDialog";

const student = { id: "s1", fullName: "Ali Veli", status: "active" } as never;

function setup(action: "freeze" | "graduate", onConfirm = vi.fn()) {
  render(
    <LifecycleActionDialog
      action={action} student={student} open isPending={false}
      onClose={vi.fn()} onConfirm={onConfirm}
    />,
  );
  return onConfirm;
}

describe("LifecycleActionDialog", () => {
  it("freeze: empty reason blocks confirm", () => {
    const onConfirm = setup("freeze");
    fireEvent.click(screen.getByText(/Dondur/));
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("graduate: confirms without reason", () => {
    const onConfirm = setup("graduate");
    fireEvent.click(screen.getByText(/Mezun Et/));
    expect(onConfirm).toHaveBeenCalled();
  });
});
```
> NOT: i18next test setup'ı mevcut component testlerindeki provider/mock pattern'ini izler (tr namespace yüklü). Buton metinleri tr çevirisiyle eşleşir.

- [ ] **Step 4: Run + PASS**

Run: `cd oksis-web && npm run test -- LifecycleActionDialog`
Expected: 2/2 PASS.

- [ ] **Step 5: Build + commit**

```bash
cd oksis-web && npm run build && git add -A && git commit -m "$(cat <<'EOF'
2026-06-30 feat,test: FE useStudentLifecycle hook + LifecycleActionDialog (zorunlu gerekçe freeze/withdraw, opsiyonel hedef transferOut).

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01MiBCgS3zvFNBSmo6UdSivy
EOF
)"
```

---

## Task 9: Frontend — StudentRowActions'ı bağla (izin düzeltmesi + aktifleştirme + diyalog)

**Files:**
- Modify: `oksis-web/src/portals/admin/students/components/StudentRowActions.tsx`
- Test: `oksis-web/src/portals/admin/students/components/__tests__/StudentRowActions.test.tsx` (varsa genişlet; yoksa yeni)

**Interfaces:**
- Consumes: `useStudentLifecycle` (Task 8), `LifecycleActionDialog` + `LifecycleAction` (Task 8), `usePermission`.

- [ ] **Step 1: İzin düzeltmesi + lifecycle bağlama**

`StudentRowActions.tsx`'te değişiklikler:
1. `usePermission` satırlarını düzelt:
```typescript
  const can = usePermission();
  const canManage = can.has("students.manage");
```
(`canUpdate`/`canDeactivate` lifecycle için `canManage` ile değiştirilir; akademik düzenleme/diğer maddeler kendi izinlerini korur.)

2. Hook + dialog state ekle:
```typescript
  const lifecycle = useStudentLifecycle(student.id);
  const [dialogAction, setDialogAction] = useState<LifecycleAction | null>(null);

  const pending =
    lifecycle.freeze.isPending || lifecycle.resume.isPending ||
    lifecycle.withdraw.isPending || lifecycle.transferOut.isPending ||
    lifecycle.graduate.isPending;

  const runAction = async (payload: { reason?: string; targetSchoolId?: string }) => {
    try {
      switch (dialogAction) {
        case "freeze": await lifecycle.freeze.mutateAsync(payload.reason!); break;
        case "resume": await lifecycle.resume.mutateAsync(); break;
        case "withdraw": await lifecycle.withdraw.mutateAsync(payload.reason!); break;
        case "transferOut":
          await lifecycle.transferOut.mutateAsync({
            targetSchoolId: payload.targetSchoolId, reason: payload.reason,
          });
          break;
        case "graduate": await lifecycle.graduate.mutateAsync(); break;
      }
      setDialogAction(null);
    } catch {
      /* hata toast'u global interceptor'da; diyalog açık kalır */
    }
  };
```

3. Menü maddelerinde 5 lifecycle aksiyonunu **enable** et — `disabled: true` ve `disabledHint: notReady2B` kaldırılır; `onSelect: () => setDialogAction("freeze")` (resume/withdraw/transferOut/graduate benzer), `visible` koşulları korunur ama `canUpdate`/`canDeactivate` → `canManage`. Durum eşlemesi: `freeze` (isActive), `reactivate→resume` (isSuspended), `transferOut`/`graduate` (isActive), `deactivate→withdraw` (isActive). `notReady2B` değişkeni ve i18n anahtarı silinir.

4. Menünün sonuna diyaloğu render et:
```tsx
      <LifecycleActionDialog
        action={dialogAction}
        student={student}
        open={dialogAction !== null}
        isPending={pending}
        onClose={() => setDialogAction(null)}
        onConfirm={runAction}
      />
```

> Implementer, dosyadaki tam `items` dizisini okuyup yukarıdaki kurallara göre 5 maddeyi günceller; mevcut `detail/edit/assignClass/linkGuardian/uploadDocument` maddelerine dokunmaz (onlar kendi durumlarında kalır).

- [ ] **Step 2: Test — students.manage yokken lifecycle gizli; varken tıklanınca diyalog açılır**

`StudentRowActions.test.tsx` (mevcut permission/test provider pattern'iyle):
```tsx
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
// ... mevcut test wrapper'ı (QueryClientProvider + i18n + authStore mock) ile

// 1) izin yok → "Mezun et" görünmez
// 2) izin var + active → "Mezun et" tıkla → confirm.graduateTitle diyaloğu açılır
```
> Implementer mevcut StudentRowActions testindeki render helper'ını (authStore permissions mock'u) kullanır; yoksa Faz 2A FE testlerindeki provider pattern'ini kopyalar. En az 2 assertion: izinsiz gizli + izinli diyalog açılır.

- [ ] **Step 3: Run + build + PASS**

Run: `cd oksis-web && npm run test -- StudentRowActions && npm run build`
Expected: testler PASS, build temiz.

- [ ] **Step 4: Commit**

```bash
cd oksis-web && git add -A && git commit -m "$(cat <<'EOF'
2026-06-30 feat,test: StudentRowActions lifecycle aksiyonları aktifleşti (students.manage izni + LifecycleActionDialog); students.delete izin hatası düzeltildi.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01MiBCgS3zvFNBSmo6UdSivy
EOF
)"
```

---

## Task 10: Dokümantasyon + completion_status + session özeti

**Files:**
- Modify: `.claude/docs/modules/students/api-contracts.md` (5 lifecycle ucu)
- Modify: `.claude/docs/modules/students/completion_status.md` (Faz 2B ✅; Debt: Archive + lifecycle event/bildirim)
- Modify: `.claude/docs/modules/students/business-rules.md` (lifecycle geçiş + koordineli eksen kuralı)
- Modify: `.claude/docs/modules/students/README.md` (Last Updated bump)
- Create: `.claude/sessions/2026-06-30-enrollment-faz2b-lifecycle.md` (İngilizce günlük özet)

- [ ] **Step 1: api-contracts.md — 5 lifecycle ucu**

`POST /students/{id}:freeze|:resume|:withdraw|:transfer-out|:graduate` satırlarını gövde + izin (`students.manage`) + dönüş (204 No Content / hata kodları) ile ekle.

- [ ] **Step 2: business-rules.md — lifecycle kuralı**

Koordineli iki-eksen geçiş tablosunu (enrollment.Status + ClassRoomStudent + Person.LifecycleState) ve "Frozen öğrenci önce Resume edilmeden Withdraw/Transfer/Graduate edilemez" kısıtını ekle.

- [ ] **Step 3: completion_status.md — Faz 2B + Debt**

Faz 2B'yi ✅'ye taşı, ilerleme yüzdesini güncelle, `Güncel` tarihini 2026-06-30 yap. "⚠️ Spec Dışına Çıkılanlar / Debt" altına:
- "2026-06-30: Lifecycle domain event'leri + veli bildirimi ertelendi (Faz 2B kapsam dışı). Sebep: bildirim/outbox ayrı iş. Onay: kullanıcı."
- "2026-06-30: ArchiveEnrollment komutu/uç/buton ertelendi (UI yok). Onay: kullanıcı."

- [ ] **Step 4: Session özeti (İngilizce)**

`2026-06-30-enrollment-faz2b-lifecycle.md`: what was built (5 lifecycle commands, coordinated two-axis, Person.Transfer nullable, AssignmentReason values, FE wiring + permission fix), key decisions, deferred Debt.

- [ ] **Step 5: Commit (workspace repo)**

```bash
cd /Users/farukkaya/Projects/oksis && git add -A && git commit -m "$(cat <<'EOF'
2026-06-30 docs: students Faz 2B lifecycle — api-contracts/business-rules/completion_status güncellendi (5 komut canlı; Archive + event/bildirim Debt) + session özeti.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01MiBCgS3zvFNBSmo6UdSivy
EOF
)"
```

---

## Self-Review Notları (plan yazarı)

- **Spec coverage:** Tasarım §3 (5 komut tablosu) → Task 2-6; §4 (Person.Transfer nullable) → Task 1; §5 (REST) → her komut task'ında route; §6 (hata) → handler'larda Forbidden/NotFound/Conflict; §8 (FE) → Task 7-9; §9 (test) → her task'ta integration/unit/vitest; §10 (out of scope) → Task 10 Debt. AssignmentReason boşluğu (tasarımda "planda kesinleştirilir") → Task 1'de Withdrawal/TransferOut eklendi.
- **Type tutarlılığı:** `Result` (payload'sız) + `ICommand`/`ICommandHandler<T>` tüm komutlarda; `Result.Conflict(string)` / `Forbidden()` / `NotFound()` gerçek factory'ler; `AssignmentReason.Withdrawal/TransferOut/Graduation` Task 1'le hizalı; `Person.Transfer(Guid?)` Task 1 ↔ Task 5.
- **Bilinen doğrulama noktaları (implementer kontrol eder):** `FakeTenantContext(null)` desteği; `Modal`/`ConfirmDialog` prop imzası; `studentKeys.detail`/`StudentListItem.fullName` alanları; `httpClient` mock göreli yolu. Her biri ilgili task NOT'unda işaretli.
