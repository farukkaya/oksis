# Öğrenci Kayıt Faz 1B-BE — Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** EnrollStudent akışına öğrenci hesabı provisioning + geçici şifre eklemek, öğrenci-no ile login resolver'ı açmak, küçük kademe veli-only carve-out'u uygulamak ve FE başarı ekranındaki Debt şifre kutusunu gerçek değerle doldurmak.

**Architecture:** Yaklaşım B — ayrı `IStudentAccountProvisioner` servisi EnrollStudent transaction'ı içinde çağrılır (DB yazımı; teslim/yan etki yok). Login resolver'a tenant-scoped `StudentNumber` identifier tipi additive eklenir. FE değişikliği minimal (sonuç tipi + üç-durumlu başarı satırı). Migration gerekmez.

**Tech Stack:** .NET 10 / EF Core 10 / MediatR / xUnit + FluentAssertions + NSubstitute (BE); React + TS / Vitest + Testing Library (FE).

## Global Constraints

- **Bağlayıcı spec:** `.claude/specs/ogrenci-kayit-enrollment-spec.md` — E2.6 (küçük kademe veli-only), E2.7 (öğrenci no=kullanıcı adı + geçici şifre + ilk-giriş değişim), E5.1/E5.2 (tek transaction; yan etki dışında), E5.3 (idempotency). Üst spec madde 121-122. **Sapma yok.**
- **Tasarım dokümanı:** `.claude/specs/ogrenci-kayit-faz1b-be-design.md` (bu planın kaynağı).
- **Kapsam DIŞI:** Öğrenci no format/kabul (okul mevcut numarası + okul-konfigüre generator) — ayrı spec'lenecek (design §1.1). Bu plan generator'a/`EnrollStudentCommand` numara alanına **dokunmaz**.
- **Tenant (Rule #1):** Her sorgu/yazım `SchoolId`-scoped. Login resolver cross-tenant istisnası yalnız `ProjectFirstAsync` deseninde + öğrenci-no'da `SchoolId` predikatı zorunlu.
- **Güvenlik:** Düz şifre yalnız Argon2id hash olarak saklanır; sonuç DTO'da bir kez döner; loglanmaz (iki log katmanı da gövde loglamıyor — doğrulandı).
- **BE kuralları:** Mapster (AutoMapper yasak), `IApplicationDbContext` (repository yasak), `async void`/`.Result`/`.Wait()` yasak, hardcoded Türkçe string yasak (BE'de domain mesajları istisna), commit OKSİS formatı.
- **FE kuralları:** named export (default yasak), `any` yasak, inline-style yasak, server state yalnız React Query, i18n key zorunlu (tr+en parite).
- **Commit formatı:** `YYYY-MM-DD <type>: Türkçe özet.` Bugün: `2026-06-30`. Düzeltme commit'lerinde kullanıcıdan onay iste — ama bu plan kapsamındaki TDD task commit'leri normal akışın parçasıdır.
- **Kademe→EducationLevel:** `int GradeLevel` = sınıf numarası 0-12 (FE `gradeLevelToInt` = `parseInt(code)`). Eşleme: 0=Preschool, 1-4=Primary (**küçük kademe**), 5-8=Middle, 9-12=High.

---

## Task 1: EducationLevelClassifier (saf domain helper)

**Files:**
- Create: `oksis-api/src/Oksis.Domain/Modules/Academics/EducationLevelClassifier.cs`
- Test: `oksis-api/tests/Oksis.Domain.UnitTests/Modules/Academics/EducationLevelClassifierTests.cs`

**Interfaces:**
- Produces: `static EducationLevel EducationLevelClassifier.FromGradeNumber(int gradeNumber)` ve `static bool EducationLevelClassifier.IsSmallGrade(int gradeNumber)` (namespace `Oksis.Domain.Modules.Academics`).

- [ ] **Step 1: Write the failing test**

`EducationLevelClassifierTests.cs`:
```csharp
using FluentAssertions;
using Oksis.Domain.Modules.Academics;
using Oksis.Domain.Modules.Academics.Enums;
using Xunit;

namespace Oksis.Domain.UnitTests.Modules.Academics;

public sealed class EducationLevelClassifierTests
{
    [Theory]
    [InlineData(0, EducationLevel.Preschool)]
    [InlineData(1, EducationLevel.Primary)]
    [InlineData(4, EducationLevel.Primary)]
    [InlineData(5, EducationLevel.Middle)]
    [InlineData(8, EducationLevel.Middle)]
    [InlineData(9, EducationLevel.High)]
    [InlineData(12, EducationLevel.High)]
    public void FromGradeNumber_maps_grade_to_education_level(int grade, EducationLevel expected)
    {
        EducationLevelClassifier.FromGradeNumber(grade).Should().Be(expected);
    }

    [Theory]
    [InlineData(0, true)]
    [InlineData(4, true)]
    [InlineData(5, false)]
    [InlineData(9, false)]
    public void IsSmallGrade_is_true_for_preschool_and_primary(int grade, bool expected)
    {
        EducationLevelClassifier.IsSmallGrade(grade).Should().Be(expected);
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd oksis-api && dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~EducationLevelClassifier"`
Expected: FAIL — `EducationLevelClassifier` does not exist (compile error).

- [ ] **Step 3: Write minimal implementation**

`EducationLevelClassifier.cs`:
```csharp
using Oksis.Domain.Modules.Academics.Enums;

namespace Oksis.Domain.Modules.Academics;

/// <summary>
/// Türk eğitim sistemi sınıf-numarası (0-12) → <see cref="EducationLevel"/> eşlemesi.
/// Eşleme sistem-değişmezdir; öğrenci kayıt carve-out'u (E2.6) bunu kullanır.
/// </summary>
public static class EducationLevelClassifier
{
    public static EducationLevel FromGradeNumber(int gradeNumber) => gradeNumber switch
    {
        <= 0 => EducationLevel.Preschool,
        >= 1 and <= 4 => EducationLevel.Primary,
        >= 5 and <= 8 => EducationLevel.Middle,
        _ => EducationLevel.High,
    };

    /// <summary>Küçük kademe = Anaokulu veya İlkokul (E2.6 — yalnız veli hesabı).</summary>
    public static bool IsSmallGrade(int gradeNumber) =>
        FromGradeNumber(gradeNumber) is EducationLevel.Preschool or EducationLevel.Primary;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd oksis-api && dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~EducationLevelClassifier"`
Expected: PASS (11 cases).

- [ ] **Step 5: Commit**

```bash
cd oksis-api && dotnet format && git add -A && git commit -m "2026-06-30 feat,test: EducationLevelClassifier — sınıf no → EducationLevel eşlemesi + küçük kademe (E2.6)."
```

---

## Task 2: ITemporaryPasswordGenerator + impl

**Files:**
- Create: `oksis-api/src/Oksis.Application/Common/Abstractions/ITemporaryPasswordGenerator.cs`
- Create: `oksis-api/src/Oksis.Infrastructure/Identity/TemporaryPasswordGenerator.cs`
- Modify: `oksis-api/src/Oksis.Infrastructure/DependencyInjection.cs` (Argon2 kaydının yanına)
- Test: `oksis-api/tests/Oksis.Infrastructure.IntegrationTests/Identity/TemporaryPasswordGeneratorTests.cs`

**Interfaces:**
- Produces: `string ITemporaryPasswordGenerator.Generate()` (namespace `Oksis.Application.Common.Abstractions`); impl `Oksis.Infrastructure.Identity.TemporaryPasswordGenerator`.

- [ ] **Step 1: Write the failing test**

`TemporaryPasswordGeneratorTests.cs`:
```csharp
using FluentAssertions;
using Oksis.Infrastructure.Identity;
using Xunit;

namespace Oksis.Infrastructure.IntegrationTests.Identity;

public sealed class TemporaryPasswordGeneratorTests
{
    private const string Ambiguous = "0Oo1lIL";

    [Fact]
    public void Generate_returns_8_chars_from_readable_alphabet()
    {
        var gen = new TemporaryPasswordGenerator();

        for (var i = 0; i < 200; i++)
        {
            var pwd = gen.Generate();
            pwd.Should().HaveLength(8);
            pwd.Should().NotContainAny(Ambiguous.Select(c => c.ToString()).ToArray());
            pwd.Should().MatchRegex("^[A-Za-z2-9]+$");
        }
    }

    [Fact]
    public void Generate_is_not_constant()
    {
        var gen = new TemporaryPasswordGenerator();
        var a = gen.Generate();
        var b = gen.Generate();
        (a == b).Should().BeFalse();
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd oksis-api && dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~TemporaryPasswordGenerator"`
Expected: FAIL — type does not exist (compile error).

- [ ] **Step 3: Write minimal implementation**

`ITemporaryPasswordGenerator.cs`:
```csharp
namespace Oksis.Application.Common.Abstractions;

/// <summary>
/// Öğrenci hesabı için okunabilir geçici şifre üretir (E2.7). Üretilen şifre yalnız
/// hash'lenerek saklanır; düz metin tek seferlik döner ve ilk girişte değiştirilir.
/// </summary>
public interface ITemporaryPasswordGenerator
{
    string Generate();
}
```

`TemporaryPasswordGenerator.cs`:
```csharp
using System.Security.Cryptography;
using Oksis.Application.Common.Abstractions;

namespace Oksis.Infrastructure.Identity;

/// <summary>
/// Kripto-RNG ile okunabilir geçici şifre. Karışan karakterler (0 O o 1 l I L) hariç
/// tutulur ki yönetici şifreyi sesli okuyup öğrenciye/veliye iletebilsin.
/// </summary>
public sealed class TemporaryPasswordGenerator : ITemporaryPasswordGenerator
{
    private const string Alphabet =
        "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    private const int Length = 8;

    public string Generate()
    {
        var chars = new char[Length];
        for (var i = 0; i < Length; i++)
        {
            chars[i] = Alphabet[RandomNumberGenerator.GetInt32(Alphabet.Length)];
        }

        return new string(chars);
    }
}
```

`DependencyInjection.cs` (Infrastructure) — `services.AddSingleton<IPasswordHasher, Argon2IdPasswordHasher>();` satırının hemen altına ekle:
```csharp
services.AddSingleton<ITemporaryPasswordGenerator, TemporaryPasswordGenerator>();
```
(Üstte `using Oksis.Application.Common.Abstractions;` zaten var — yoksa ekle.)

- [ ] **Step 4: Run test to verify it passes**

Run: `cd oksis-api && dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~TemporaryPasswordGenerator"`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
cd oksis-api && dotnet format && git add -A && git commit -m "2026-06-30 feat,test: ITemporaryPasswordGenerator — kripto-RNG okunabilir geçici şifre (E2.7)."
```

---

## Task 3: IStudentAccountProvisioner + impl

**Files:**
- Create: `oksis-api/src/Oksis.Application/Modules/Students/Services/IStudentAccountProvisioner.cs`
- Create: `oksis-api/src/Oksis.Application/Modules/Students/Services/StudentAccountProvisioner.cs`
- Modify: `oksis-api/src/Oksis.Application/DependencyInjection.cs`
- Test: `oksis-api/tests/Oksis.Infrastructure.IntegrationTests/Students/StudentAccountProvisionerTests.cs`

**Interfaces:**
- Consumes: `EducationLevelClassifier.IsSmallGrade(int)` (Task 1); `ITemporaryPasswordGenerator.Generate()` (Task 2); `IPasswordHasher.Hash(string)`, `PasswordHash.FromEncoded(string)`, `Account.Create(Guid, Guid, PasswordHash, int, bool)`, `Person.LinkAccount(Guid)`, `IApplicationDbContext.Accounts`.
- Produces: `Task<string?> IStudentAccountProvisioner.ProvisionAsync(Person person, int gradeLevel, Guid schoolId, CancellationToken ct)` (namespace `Oksis.Application.Modules.Students.Services`). Dönen değer: düz geçici şifre; küçük kademe veya zaten hesaplı kişi → `null`.

- [ ] **Step 1: Write the failing test**

`StudentAccountProvisionerTests.cs`:
```csharp
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Modules.Students.Services;
using Oksis.Domain.Modules.Users.Entities;
using Oksis.Domain.Modules.Users.Enums;
using Oksis.Domain.Modules.Users.ValueObjects;
using Oksis.Infrastructure.Identity;
using Oksis.Infrastructure.IntegrationTests.Fixtures;
using Xunit;

namespace Oksis.Infrastructure.IntegrationTests.Students;

[Collection(DatabaseCollection.Name)]
public sealed class StudentAccountProvisionerTests(DatabaseFixture fixture) : IAsyncLifetime
{
    public async Task InitializeAsync() => await fixture.EnsureDatabaseCreatedAsync();
    public Task DisposeAsync() => Task.CompletedTask;

    private sealed class FixedTempPwd(string value) : ITemporaryPasswordGenerator
    {
        public string Generate() => value;
    }

    private static Person NewStudent(Guid schoolId)
    {
        var person = Person.Create(
            schoolId,
            PersonName.Create("Minik", "Öğrenci"),
            null, null, Gender.Female, null, null);
        person.AttachProfile(StudentProfile.Create(studentNumber: "202600777"));
        person.Activate();
        return person;
    }

    [Fact]
    public async Task Provision_creates_account_with_temp_password_for_middle_grade()
    {
        var schoolId = Guid.NewGuid();
        await using var db = fixture.CreateDbContext(schoolId);
        var person = NewStudent(schoolId);
        db.Persons.Add(person);
        await db.SaveChangesAsync();

        var sut = new StudentAccountProvisioner(db, new Argon2IdPasswordHasher(), new FixedTempPwd("Test23xy"));

        var pwd = await sut.ProvisionAsync(person, gradeLevel: 5, schoolId, CancellationToken.None);
        await db.SaveChangesAsync();

        pwd.Should().Be("Test23xy");
        person.LinkedAccountId.Should().NotBeNull();

        await using var verify = fixture.CreateDbContext(schoolId);
        var account = await verify.Accounts.AsNoTracking().SingleAsync(a => a.PersonId == person.Id);
        account.RequirePasswordChange.Should().BeTrue();
        account.IsActive.Should().BeTrue();
        account.PasswordHash.Encoded.Should().NotBe("Test23xy", "düz şifre saklanmaz, hash'lenir");
    }

    [Fact]
    public async Task Provision_skips_account_for_small_grade()
    {
        var schoolId = Guid.NewGuid();
        await using var db = fixture.CreateDbContext(schoolId);
        var person = NewStudent(schoolId);
        db.Persons.Add(person);
        await db.SaveChangesAsync();

        var sut = new StudentAccountProvisioner(db, new Argon2IdPasswordHasher(), new FixedTempPwd("Test23xy"));

        var pwd = await sut.ProvisionAsync(person, gradeLevel: 2, schoolId, CancellationToken.None);
        await db.SaveChangesAsync();

        pwd.Should().BeNull();
        person.LinkedAccountId.Should().BeNull();

        await using var verify = fixture.CreateDbContext(schoolId);
        (await verify.Accounts.AsNoTracking().AnyAsync(a => a.PersonId == person.Id)).Should().BeFalse();
    }

    [Fact]
    public async Task Provision_is_idempotent_when_person_already_linked()
    {
        var schoolId = Guid.NewGuid();
        await using var db = fixture.CreateDbContext(schoolId);
        var person = NewStudent(schoolId);
        db.Persons.Add(person);
        await db.SaveChangesAsync();

        var sut = new StudentAccountProvisioner(db, new Argon2IdPasswordHasher(), new FixedTempPwd("Test23xy"));
        await sut.ProvisionAsync(person, gradeLevel: 5, schoolId, CancellationToken.None);
        await db.SaveChangesAsync();

        var second = await sut.ProvisionAsync(person, gradeLevel: 5, schoolId, CancellationToken.None);
        await db.SaveChangesAsync();

        second.Should().BeNull();
        await using var verify = fixture.CreateDbContext(schoolId);
        (await verify.Accounts.AsNoTracking().CountAsync(a => a.PersonId == person.Id)).Should().Be(1);
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd oksis-api && dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~StudentAccountProvisioner"`
Expected: FAIL — `StudentAccountProvisioner` / `IStudentAccountProvisioner` does not exist.

- [ ] **Step 3: Write minimal implementation**

`IStudentAccountProvisioner.cs`:
```csharp
using Oksis.Domain.Modules.Users.Entities;

namespace Oksis.Application.Modules.Students.Services;

/// <summary>
/// EnrollStudent transaction'ı içinde öğrenci login hesabını açar (E2.6/E2.7).
/// Küçük kademede (Anaokulu/İlkokul) hesap açılmaz; düz geçici şifre yalnız döner,
/// saklanmaz. Aynı kişiye ikinci kez çağrılırsa hesap tekrar açılmaz (idempotent).
/// </summary>
public interface IStudentAccountProvisioner
{
    Task<string?> ProvisionAsync(Person person, int gradeLevel, Guid schoolId, CancellationToken ct);
}
```

`StudentAccountProvisioner.cs`:
```csharp
using Oksis.Application.Common.Abstractions;
using Oksis.Domain.Modules.Academics;
using Oksis.Domain.Modules.Identity.Entities;
using Oksis.Domain.Modules.Identity.ValueObjects;
using Oksis.Domain.Modules.Users.Entities;

namespace Oksis.Application.Modules.Students.Services;

public sealed class StudentAccountProvisioner(
    IApplicationDbContext db,
    IPasswordHasher hasher,
    ITemporaryPasswordGenerator passwords)
    : IStudentAccountProvisioner
{
    public Task<string?> ProvisionAsync(Person person, int gradeLevel, Guid schoolId, CancellationToken ct)
    {
        // E2.6 — küçük kademe (Anaokulu/İlkokul): yalnız veli hesabı, öğrenci hesabı açılmaz.
        if (EducationLevelClassifier.IsSmallGrade(gradeLevel))
        {
            return Task.FromResult<string?>(null);
        }

        // İdempotent: kişiye zaten bir hesap bağlıysa yeniden açma.
        if (person.LinkedAccountId is not null)
        {
            return Task.FromResult<string?>(null);
        }

        var plain = passwords.Generate();
        var hash = PasswordHash.FromEncoded(hasher.Hash(plain));
        var account = Account.Create(schoolId, person.Id, hash, requirePasswordChange: true);
        db.Accounts.Add(account);
        person.LinkAccount(account.Id);

        return Task.FromResult<string?>(plain);
    }
}
```

`DependencyInjection.cs` (Application) — diğer `services.AddScoped<...>` servis kayıtlarının yanına (örn. `IAccountProvisioner` satırının altına) ekle:
```csharp
services.AddScoped<Modules.Students.Services.IStudentAccountProvisioner,
    Modules.Students.Services.StudentAccountProvisioner>();
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd oksis-api && dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~StudentAccountProvisioner"`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
cd oksis-api && dotnet format && git add -A && git commit -m "2026-06-30 feat,test: IStudentAccountProvisioner — öğrenci hesabı + geçici şifre, küçük kademe carve-out + idempotent (E2.6/E2.7)."
```

---

## Task 4: EnrollStudent handler'a provisioner'ı bağla + sonuç DTO

**Files:**
- Modify: `oksis-api/src/Oksis.Application/Modules/Students/Commands/EnrollStudent/EnrollStudentResult.cs`
- Modify: `oksis-api/src/Oksis.Application/Modules/Students/Commands/EnrollStudent/EnrollStudentCommandHandler.cs`
- Modify (test harness + yeni testler): `oksis-api/tests/Oksis.Infrastructure.IntegrationTests/Students/EnrollStudentTests.cs`

**Interfaces:**
- Consumes: `IStudentAccountProvisioner.ProvisionAsync(...)` (Task 3).
- Produces: `EnrollStudentResult` artık `(Guid StudentPersonId, Guid EnrollmentId, string StudentNumber, bool HasGuardianWarning, string? TemporaryPassword, bool StudentAccountCreated)`. Handler ctor imzası: `(IApplicationDbContext, ITenantContext, IDateTimeProvider, INationalIdProtector, IStudentNumberGenerator, IStudentAccountProvisioner)`.

- [ ] **Step 1: Write the failing test**

`EnrollStudentTests.cs` — `BuildCommand`'a opsiyonel `int gradeLevel = 5` parametresi ekle (satır 33-55):
```csharp
    private static EnrollStudentCommand BuildCommand(
        Guid clientRequestId,
        Guid sessionId,
        Guid classRoomId,
        DateOnly enrollmentDate,
        int gradeLevel = 5)
        => new(
            ClientRequestId: clientRequestId,
            FirstName: "Zeynep",
            LastName: "Arslan",
            Gender: Gender.Female,
            BirthDate: new DateOnly(2012, 5, 10),
            NationalId: null,
            NationalIdType: null,
            Email: null,
            Type: EnrollmentType.New,
            PreviousSchool: null,
            AcademicSessionId: sessionId,
            GradeLevel: gradeLevel,
            ClassRoomId: classRoomId,
            EnrollmentDate: enrollmentDate,
            Guardians: [],
            Invite: false,
            InviteChannel: null);
```

`BuildHandler` (satır 126-134) — provisioner'ı ekle:
```csharp
    private EnrollStudentCommandHandler BuildHandler(Guid schoolId)
    {
        var db = fixture.CreateDbContext(schoolId);
        var tenantCtx = new FakeTenantContext(schoolId);
        var clock = new FixedClock(new DateTimeOffset(2026, 6, 29, 12, 0, 0, TimeSpan.Zero));
        var generator = new StudentNumberGenerator(db);
        var protector = Substitute.For<INationalIdProtector>();
        var provisioner = new StudentAccountProvisioner(
            db, new Argon2IdPasswordHasher(), new TemporaryPasswordGenerator());
        return new EnrollStudentCommandHandler(db, tenantCtx, clock, protector, generator, provisioner);
    }
```
Dosya başına ekle: `using Oksis.Application.Modules.Students.Services;`

Yeni testler (sınıf içine ekle):
```csharp
    [Fact]
    public async Task Enroll_middle_grade_creates_student_account_with_temp_password()
    {
        var (schoolId, sessionId, classRoomId) = await SeedAsync();
        var command = BuildCommand(Guid.NewGuid(), sessionId, classRoomId, new DateOnly(2026, 9, 15), gradeLevel: 5);

        var result = await BuildHandler(schoolId).Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue($"hata: {result.Error?.Code} — {result.Error?.Message}");
        result.Value!.StudentAccountCreated.Should().BeTrue();
        result.Value.TemporaryPassword.Should().NotBeNullOrWhiteSpace();

        await using var verify = fixture.CreateDbContext(schoolId);
        var account = await verify.Accounts.AsNoTracking().SingleAsync(a => a.PersonId == result.Value.StudentPersonId);
        account.RequirePasswordChange.Should().BeTrue();
        var person = await verify.Persons.AsNoTracking().SingleAsync(p => p.Id == result.Value.StudentPersonId);
        person.LinkedAccountId.Should().Be(account.Id);
    }

    [Fact]
    public async Task Enroll_small_grade_does_not_create_student_account()
    {
        var (schoolId, sessionId, classRoomId) = await SeedAsync();
        var command = BuildCommand(Guid.NewGuid(), sessionId, classRoomId, new DateOnly(2026, 9, 15), gradeLevel: 2);

        var result = await BuildHandler(schoolId).Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue($"hata: {result.Error?.Code} — {result.Error?.Message}");
        result.Value!.StudentAccountCreated.Should().BeFalse();
        result.Value.TemporaryPassword.Should().BeNull();

        await using var verify = fixture.CreateDbContext(schoolId);
        (await verify.Accounts.AsNoTracking().AnyAsync(a => a.PersonId == result.Value.StudentPersonId)).Should().BeFalse();
    }

    [Fact]
    public async Task Enroll_replay_returns_no_password_but_reports_account_created()
    {
        var (schoolId, sessionId, classRoomId) = await SeedAsync();
        var clientRequestId = Guid.NewGuid();
        var command = BuildCommand(clientRequestId, sessionId, classRoomId, new DateOnly(2026, 9, 15), gradeLevel: 5);

        var first = await BuildHandler(schoolId).Handle(command, CancellationToken.None);
        first.Value!.TemporaryPassword.Should().NotBeNullOrWhiteSpace();

        var replay = await BuildHandler(schoolId).Handle(command, CancellationToken.None);

        replay.IsSuccess.Should().BeTrue();
        replay.Value!.StudentPersonId.Should().Be(first.Value.StudentPersonId);
        replay.Value.TemporaryPassword.Should().BeNull("replay'de düz şifre yeniden gösterilmez");
        replay.Value.StudentAccountCreated.Should().BeTrue("hesap ilk çağrıda açıldı");

        await using var verify = fixture.CreateDbContext(schoolId);
        (await verify.Accounts.AsNoTracking().CountAsync(a => a.PersonId == first.Value.StudentPersonId)).Should().Be(1);
    }
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd oksis-api && dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~EnrollStudentTests"`
Expected: FAIL — `EnrollStudentResult` 6 argüman almıyor / handler ctor 6 parametre almıyor (compile error).

- [ ] **Step 3: Write minimal implementation**

`EnrollStudentResult.cs` — tüm dosya:
```csharp
namespace Oksis.Application.Modules.Students.Commands.EnrollStudent;

public sealed record EnrollStudentResult(
    Guid StudentPersonId,
    Guid EnrollmentId,
    string StudentNumber,
    bool HasGuardianWarning,
    string? TemporaryPassword,
    bool StudentAccountCreated);
```

`EnrollStudentCommandHandler.cs` değişiklikleri:

(a) Dosya başına ekle: `using Oksis.Application.Modules.Students.Services;`

(b) Ctor'a provisioner ekle (satır 16-22):
```csharp
public sealed class EnrollStudentCommandHandler(
    IApplicationDbContext db,
    ITenantContext tenant,
    IDateTimeProvider clock,
    INationalIdProtector protector,
    IStudentNumberGenerator numbers,
    IStudentAccountProvisioner accountProvisioner)
    : ICommandHandler<EnrollStudentCommand, EnrollStudentResult>
```

(c) Replay yolunu güncelle (mevcut satır 35-44):
```csharp
        if (prior is not null)
        {
            var existingNumber = await db.Profiles.OfType<StudentProfile>()
                .AsNoTracking()
                .Where(sp => sp.PersonId == prior.StudentPersonId)
                .Select(sp => sp.StudentNumber)
                .FirstOrDefaultAsync(cancellationToken);
            var accountExists = await db.Accounts
                .AsNoTracking()
                .AnyAsync(a => a.PersonId == prior.StudentPersonId, cancellationToken);
            return Result<EnrollStudentResult>.Success(
                new EnrollStudentResult(
                    prior.StudentPersonId, prior.EnrollmentId, existingNumber ?? string.Empty,
                    HasGuardianWarning: false, TemporaryPassword: null, StudentAccountCreated: accountExists));
        }
```

(d) Adım 7 (Veliler döngüsü) ile adım 8 (İdempotency kaydı) arasına yeni adım ekle (mevcut satır 177 ile 179 arası):
```csharp
        // 7.5) Öğrenci hesabı (E2.6/E2.7) — küçük kademe hariç, transaction içinde
        var temporaryPassword = await accountProvisioner.ProvisionAsync(
            person, request.GradeLevel, schoolId.Value, cancellationToken);
```

(e) Final return'ü güncelle (mevcut satır 204-205):
```csharp
        return Result<EnrollStudentResult>.Success(
            new EnrollStudentResult(
                person.Id, enrollment.Id, studentNumber, hasGuardianWarning,
                temporaryPassword, StudentAccountCreated: temporaryPassword is not null));
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd oksis-api && dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~EnrollStudentTests"`
Expected: PASS (mevcut testler + 3 yeni test). Tüm students süiti yeşil kalmalı.

- [ ] **Step 5: Commit**

```bash
cd oksis-api && dotnet format && git add -A && git commit -m "2026-06-30 feat,test: EnrollStudent sonucu geçici şifre + StudentAccountCreated taşır; provisioner transaction içinde (E2.6/E2.7/E5.3)."
```

---

## Task 5: IdentifierType.StudentNumber + Identifier.Create sınıflama

**Files:**
- Modify: `oksis-api/src/Oksis.Domain/Modules/Identity/Enums/IdentifierType.cs`
- Modify: `oksis-api/src/Oksis.Domain/Modules/Identity/ValueObjects/Identifier.cs`
- Test: `oksis-api/tests/Oksis.Application.UnitTests/Modules/Identity/Services/IdentifierResolverTests.cs` (mevcut dosyaya ekle)

**Interfaces:**
- Produces: `IdentifierType.StudentNumber = 4`; `Identifier.Create(raw)` salt-rakam uzunluk 1-9 girdiyi `IdentifierType.StudentNumber` olarak sınıflar.

- [ ] **Step 1: Write the failing test**

`IdentifierResolverTests.cs` — mevcut `Should_ClassifyByShape_When_RawProvided` Theory'sine yeni `[InlineData]` satırları ekle ve ayrı bir test ekle:
```csharp
    [Theory]
    [InlineData("ahmet@okul.com", IdentifierType.Email)]
    [InlineData("05551112233", IdentifierType.Phone)]
    [InlineData("12345678901", IdentifierType.Tckn)]
    [InlineData("202600777", IdentifierType.StudentNumber)]
    [InlineData("12345", IdentifierType.StudentNumber)]
    [InlineData("123", IdentifierType.StudentNumber)]
    public void Should_ClassifyByShape_When_RawProvided_StudentNumber(string raw, IdentifierType expected)
    {
        var directory = Substitute.For<IPersonDirectory>();
        var resolver = new IdentifierResolver(directory);
        resolver.Classify(raw).Type.Should().Be(expected);
    }
```
(Not: mevcut `Should_ClassifyByShape_When_RawProvided` Theory'si korunur; bu ek test öğrenci-no kapsamını ekler. İmportlar mevcut dosyada zaten var: `IdentifierType`, `IPersonDirectory`, `IdentifierResolver`.)

- [ ] **Step 2: Run test to verify it fails**

Run: `cd oksis-api && dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~IdentifierResolverTests"`
Expected: FAIL — `IdentifierType.StudentNumber` yok (compile error) ve/veya 9-haneli `202600777` `Unknown` dönüyor.

- [ ] **Step 3: Write minimal implementation**

`IdentifierType.cs` — tüm dosya:
```csharp
namespace Oksis.Domain.Modules.Identity.Enums;

public enum IdentifierType
{
    Email = 0,
    Phone = 1,
    Tckn = 2,
    Unknown = 3,
    StudentNumber = 4
}
```

`Identifier.Create` (satır 43-55) — telefon kontrolünden sonra, `Unknown` fallback'inden önce öğrenci-no kontrolü ekle:
```csharp
        var digits = DigitsOnly.Replace(trimmed, string.Empty);

        if (IsTcknShape(digits))
        {
            return new Identifier(trimmed, digits, IdentifierType.Tckn);
        }

        if (IsPhoneShape(digits))
        {
            return new Identifier(trimmed, NormalizePhone(digits), IdentifierType.Phone);
        }

        if (IsStudentNumberShape(digits))
        {
            return new Identifier(trimmed, digits, IdentifierType.StudentNumber);
        }

        return new Identifier(trimmed, trimmed.ToLowerInvariant(), IdentifierType.Unknown);
```
Ve yardımcı metodları (`IsTcknShape`/`IsPhoneShape` yanına) ekle:
```csharp
    // Öğrenci no salt-rakam ve telefon/TCKN aralığının altında (1-9 hane). Telefon ≥10,
    // TCKN =11 olduğundan çakışma yoktur. Format-agnostik (eski 9-hane / yeni 3-5 hane).
    private static bool IsStudentNumberShape(string digits) =>
        digits.Length is >= 1 and <= 9;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd oksis-api && dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~IdentifierResolverTests"`
Expected: PASS (mevcut + yeni sınıflama testleri).

- [ ] **Step 5: Commit**

```bash
cd oksis-api && dotnet format && git add -A && git commit -m "2026-06-30 feat,test: IdentifierType.StudentNumber — 1-9 hane salt-rakam öğrenci no sınıflaması (format-agnostik)."
```

---

## Task 6: IPersonDirectory.FindByStudentNumberAsync + impl

**Files:**
- Modify: `oksis-api/src/Oksis.Application/Modules/Identity/Abstractions/IPersonDirectory.cs`
- Modify: `oksis-api/src/Oksis.Infrastructure/Identity/PersonDirectory.cs`
- Test: `oksis-api/tests/Oksis.Infrastructure.IntegrationTests/Students/EnrollStudentTests.cs` (yeni test sınıfı yerine mevcut entegrasyon harness'ı kullanan ayrı dosya)

**Interfaces:**
- Produces: `Task<PersonContextView?> IPersonDirectory.FindByStudentNumberAsync(string studentNumber, Guid schoolId, CancellationToken ct)`. Tenant-scoped; bulunan kişinin `LinkedAccountId`'si dahil view döner.

- [ ] **Step 1: Write the failing test**

Create `oksis-api/tests/Oksis.Infrastructure.IntegrationTests/Identity/StudentNumberDirectoryTests.cs`:
```csharp
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Oksis.Domain.Modules.Users.Entities;
using Oksis.Domain.Modules.Users.Enums;
using Oksis.Domain.Modules.Users.ValueObjects;
using Oksis.Domain.Modules.Identity.Entities;
using Oksis.Domain.Modules.Identity.ValueObjects;
using Oksis.Infrastructure.Identity;
using Oksis.Infrastructure.IntegrationTests.Fixtures;
using NSubstitute;
using Oksis.Application.Common.Abstractions;
using Xunit;

namespace Oksis.Infrastructure.IntegrationTests.Identity;

[Collection(DatabaseCollection.Name)]
public sealed class StudentNumberDirectoryTests(DatabaseFixture fixture) : IAsyncLifetime
{
    public async Task InitializeAsync() => await fixture.EnsureDatabaseCreatedAsync();
    public Task DisposeAsync() => Task.CompletedTask;

    private async Task<(Guid schoolId, Guid personId, Guid accountId, string number)> SeedLinkedStudentAsync()
    {
        var schoolId = Guid.NewGuid();
        var number = $"2026{Guid.NewGuid().ToString("N")[..5]}";
        await using var db = fixture.CreateDbContext(schoolId);

        var person = Person.Create(schoolId, PersonName.Create("Linked", "Student"), null, null, Gender.Male, null, null);
        person.AttachProfile(StudentProfile.Create(studentNumber: number));
        person.Activate();
        db.Persons.Add(person);

        var account = Account.Create(schoolId, person.Id, PasswordHash.FromEncoded("$argon2id$v=19$m=1,t=1,p=1$YWJj$YWJj"));
        db.Accounts.Add(account);
        person.LinkAccount(account.Id);
        await db.SaveChangesAsync();

        return (schoolId, person.Id, account.Id, number);
    }

    private static PersonDirectory BuildDirectory(Guid schoolId) =>
        new(fixture: null!, nationalIdProtector: Substitute.For<INationalIdProtector>());

    [Fact]
    public async Task FindByStudentNumber_returns_linked_person_within_school()
    {
        var (schoolId, personId, accountId, number) = await SeedLinkedStudentAsync();
        await using var db = fixture.CreateDbContext(schoolId);
        var directory = new PersonDirectory(db, Substitute.For<INationalIdProtector>());

        var view = await directory.FindByStudentNumberAsync(number, schoolId, CancellationToken.None);

        view.Should().NotBeNull();
        view!.PersonId.Should().Be(personId);
        view.LinkedAccountId.Should().Be(accountId);
    }

    [Fact]
    public async Task FindByStudentNumber_returns_null_for_other_school()
    {
        var (_, _, _, number) = await SeedLinkedStudentAsync();
        await using var db = fixture.CreateDbContext(Guid.NewGuid());
        var directory = new PersonDirectory(db, Substitute.For<INationalIdProtector>());

        var view = await directory.FindByStudentNumberAsync(number, Guid.NewGuid(), CancellationToken.None);

        view.Should().BeNull();
    }
}
```
(Not: `BuildDirectory` yardımcı metodu kullanılmıyorsa silinebilir — testler `new PersonDirectory(db, ...)` ile doğrudan kuruyor. `Account.Create`'in `PasswordHash.FromEncoded(...)` argümanı geçerli bir argon2id encoded string olmalı; yukarıdaki örnek format kabul edilir.)

- [ ] **Step 2: Run test to verify it fails**

Run: `cd oksis-api && dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~StudentNumberDirectoryTests"`
Expected: FAIL — `FindByStudentNumberAsync` interface'te/impl'de yok (compile error).

- [ ] **Step 3: Write minimal implementation**

`IPersonDirectory.cs` — `FindByNormalizedTcknAsync` satırının altına ekle:
```csharp
    Task<PersonContextView?> FindByStudentNumberAsync(string studentNumber, Guid schoolId, CancellationToken ct);
```

`PersonDirectory.cs` — `FindByAccountIdAsync` metodunun yanına ekle:
```csharp
    public Task<PersonContextView?> FindByStudentNumberAsync(string studentNumber, Guid schoolId, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(studentNumber) || schoolId == Guid.Empty)
        {
            return Task.FromResult<PersonContextView?>(null);
        }

        var trimmed = studentNumber.Trim();
        // Öğrenci no tenant-scoped tekildir → SchoolId predikatı ZORUNLU
        // (ProjectFirstAsync IgnoreQueryFilters ile cross-tenant çalışır).
        return ProjectFirstAsync(
            p => p.SchoolId == schoolId
                && p.Profiles.OfType<StudentProfile>().Any(sp => sp.StudentNumber == trimmed),
            ct);
    }
```
(`StudentProfile` için `using Oksis.Domain.Modules.Users.Entities;` zaten dosyada var.)

- [ ] **Step 4: Run test to verify it passes**

Run: `cd oksis-api && dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~StudentNumberDirectoryTests"`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
cd oksis-api && dotnet format && git add -A && git commit -m "2026-06-30 feat,test: IPersonDirectory.FindByStudentNumberAsync — tenant-scoped öğrenci no → kişi/hesap çözümü."
```

---

## Task 7: IdentifierResolver.FindForLoginAsync — StudentNumber case

**Files:**
- Modify: `oksis-api/src/Oksis.Application/Modules/Identity/Services/IdentifierResolver.cs`
- Test: `oksis-api/tests/Oksis.Application.UnitTests/Modules/Identity/Services/IdentifierResolverTests.cs`

**Interfaces:**
- Consumes: `IPersonDirectory.FindByStudentNumberAsync(...)` (Task 6); `IdentifierType.StudentNumber` (Task 5).
- Produces: `FindForLoginAsync` öğrenci-no'yu yalnız `schoolHint` doluyken çözer; hesapsız/okul-bağlamsız → `NotFound`.

- [ ] **Step 1: Write the failing test**

`IdentifierResolverTests.cs` — ekle:
```csharp
    [Fact]
    public async Task Should_ResolveStudentNumber_When_SchoolHintPresent()
    {
        var schoolId = Guid.NewGuid();
        var directory = Substitute.For<IPersonDirectory>();
        var view = new PersonContextView(
            PersonId: Guid.NewGuid(), SchoolId: schoolId, LinkedAccountId: Guid.NewGuid(),
            LifecycleState: "Active", ProfileTypes: Array.Empty<ProfileType>(), LastActiveProfileHint: null);
        directory.FindByStudentNumberAsync("202600777", schoolId, Arg.Any<CancellationToken>())
            .Returns(view);
        var resolver = new IdentifierResolver(directory);
        var identifier = resolver.Classify("202600777");

        var result = await resolver.FindForLoginAsync(identifier, schoolHint: schoolId, CancellationToken.None);

        result.Status.Should().Be(IdentifierResolutionStatus.Found);
        result.Person.Should().Be(view);
    }

    [Fact]
    public async Task Should_NotResolveStudentNumber_When_SchoolHintMissing()
    {
        var directory = Substitute.For<IPersonDirectory>();
        var resolver = new IdentifierResolver(directory);
        var identifier = resolver.Classify("202600777");

        var result = await resolver.FindForLoginAsync(identifier, schoolHint: null, CancellationToken.None);

        result.Status.Should().Be(IdentifierResolutionStatus.NotFound);
        await directory.Received(0).FindByStudentNumberAsync(Arg.Any<string>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Should_NotFindStudentNumber_When_NoLinkedAccount()
    {
        var schoolId = Guid.NewGuid();
        var directory = Substitute.For<IPersonDirectory>();
        var view = new PersonContextView(
            PersonId: Guid.NewGuid(), SchoolId: schoolId, LinkedAccountId: null,
            LifecycleState: "Active", ProfileTypes: Array.Empty<ProfileType>(), LastActiveProfileHint: null);
        directory.FindByStudentNumberAsync("123", schoolId, Arg.Any<CancellationToken>()).Returns(view);
        var resolver = new IdentifierResolver(directory);
        var identifier = resolver.Classify("123");

        var result = await resolver.FindForLoginAsync(identifier, schoolHint: schoolId, CancellationToken.None);

        result.Status.Should().Be(IdentifierResolutionStatus.NotFound);
    }
```
İmportlar gerekiyorsa ekle: `using Oksis.Application.Modules.Identity.Abstractions;` (PersonContextView), `using Oksis.Domain.Modules.Users.Enums;` (ProfileType). (Mevcut dosyadaki import'ları kontrol et; eksikse ekle.)

- [ ] **Step 2: Run test to verify it fails**

Run: `cd oksis-api && dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~IdentifierResolverTests"`
Expected: FAIL — StudentNumber identifier'ı switch'te ele alınmadığından `person` null → `NotFound` (Found bekleyen test patlar).

- [ ] **Step 3: Write minimal implementation**

`IdentifierResolver.cs` `FindForLoginAsync` içindeki switch'e (satır 25-30) case ekle:
```csharp
        var person = identifier.Type switch
        {
            IdentifierType.Email => await directory.FindByEmailAsync(identifier.Normalized, ct),
            IdentifierType.Phone => await directory.FindByPhoneAsync(identifier.Normalized, ct),
            IdentifierType.StudentNumber => schoolHint is { } sid
                ? await directory.FindByStudentNumberAsync(identifier.Normalized, sid, ct)
                : null,
            _ => null
        };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd oksis-api && dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~IdentifierResolverTests"`
Expected: PASS. Ardından tüm BE süitini doğrula:
Run: `cd oksis-api && dotnet test`
Expected: PASS (tümü yeşil).

- [ ] **Step 5: Commit**

```bash
cd oksis-api && dotnet format && git add -A && git commit -m "2026-06-30 feat,test: IdentifierResolver öğrenci no login case — SchoolHint zorunlu, hesapsız → NotFound (E2.7)."
```

---

## Task 8: FE — EnrollResult tipi + studentsApi yeni alanlar

**Files:**
- Modify: `oksis-web/src/portals/admin/students/api/studentsApi.ts` (`EnrollResult` interface, ~satır 64-69)
- Test: `oksis-web/src/portals/admin/students/__tests__/studentsApiEnroll.test.ts`

**Interfaces:**
- Produces: `EnrollResult` artık `temporaryPassword: string | null` ve `studentAccountCreated: boolean` alanlarını içerir. `enroll`/`transferIn` zaten `unwrap` passthrough yaptığından alanlar otomatik akar.

- [ ] **Step 1: Write the failing test**

`studentsApiEnroll.test.ts` — mevcut "enroll posts to students:enroll" testini güncelle (yeni alanları assert et):
```typescript
  it("enroll passes through temporaryPassword and studentAccountCreated", async () => {
    post.mockResolvedValue({
      data: { data: {
        studentPersonId: "sp", enrollmentId: "e", studentNumber: "202600001",
        hasGuardianWarning: false, temporaryPassword: "Test23xy", studentAccountCreated: true,
      } },
    });
    const r = await studentsApi.enroll({ ClientRequestId: "r" } as never);
    expect(r.temporaryPassword).toBe("Test23xy");
    expect(r.studentAccountCreated).toBe(true);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd oksis-web && npm run test -- studentsApiEnroll`
Expected: FAIL — TS hatası: `EnrollResult` üzerinde `temporaryPassword`/`studentAccountCreated` yok.

- [ ] **Step 3: Write minimal implementation**

`studentsApi.ts` `EnrollResult` (satır 64-69):
```typescript
export interface EnrollResult {
  studentPersonId: string;
  enrollmentId: string;
  studentNumber: string;
  hasGuardianWarning: boolean;
  temporaryPassword: string | null;
  studentAccountCreated: boolean;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd oksis-web && npm run test -- studentsApiEnroll`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd oksis-web && git add -A && git commit -m "2026-06-30 feat,test: EnrollResult — temporaryPassword + studentAccountCreated alanları (Faz 1B-BE)."
```

---

## Task 9: FE — IdentityBox üç-durumlu başarı satırı + i18n

**Files:**
- Modify: `oksis-web/src/portals/admin/students/components/enroll/parts/IdentityBox.tsx`
- Modify: `oksis-web/src/portals/admin/students/components/enroll/steps/EnrollSuccess.tsx` (IdentityBox'a yeni prop'lar)
- Modify: `oksis-web/src/shared/i18n/locales/tr/students.json` (`enrollWizard.success`)
- Modify: `oksis-web/src/shared/i18n/locales/en/students.json` (`enrollWizard.success`)
- Test: `oksis-web/src/portals/admin/students/__tests__/IdentityBox.test.tsx`

**Interfaces:**
- Consumes: `EnrollResult.temporaryPassword`, `EnrollResult.studentAccountCreated` (Task 8).
- Produces: `IdentityBox` prop'ları `{ studentNumber: string; temporaryPassword: string | null; studentAccountCreated: boolean }`.

- [ ] **Step 1: Write the failing test**

Create `IdentityBox.test.tsx`:
```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { i18n } from "../../../../shared/i18n";
import { IdentityBox } from "../components/enroll/parts/IdentityBox";

function renderBox(props: { studentNumber: string; temporaryPassword: string | null; studentAccountCreated: boolean }) {
  render(
    <I18nextProvider i18n={i18n}>
      <IdentityBox {...props} />
    </I18nextProvider>,
  );
}

describe("IdentityBox", () => {
  it("hesap açıldı + şifre var → geçici şifreyi gösterir", () => {
    renderBox({ studentNumber: "202600001", temporaryPassword: "Test23xy", studentAccountCreated: true });
    expect(screen.getByText("202600001")).toBeInTheDocument();
    expect(screen.getByText("Test23xy")).toBeInTheDocument();
  });

  it("hesap açıldı + şifre yok (replay) → 'ilk yanıtta gösterildi' notu", () => {
    renderBox({ studentNumber: "202600001", temporaryPassword: null, studentAccountCreated: true });
    expect(screen.queryByText("Test23xy")).not.toBeInTheDocument();
    expect(screen.getByText(/ilk yanıtta gösterildi/i)).toBeInTheDocument();
  });

  it("küçük kademe → hesap açılmadı notu", () => {
    renderBox({ studentNumber: "202600001", temporaryPassword: null, studentAccountCreated: false });
    expect(screen.getByText(/öğrenci hesabı açılmadı/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd oksis-web && npm run test -- IdentityBox`
Expected: FAIL — `IdentityBox` yeni prop'ları kabul etmiyor / yeni metinler yok.

- [ ] **Step 3: Write minimal implementation**

`IdentityBox.tsx` — tüm dosya:
```typescript
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Key, Copy, Check } from "lucide-react";

interface IdentityBoxProps {
  studentNumber: string;
  temporaryPassword: string | null;
  studentAccountCreated: boolean;
}

export function IdentityBox({ studentNumber, temporaryPassword, studentAccountCreated }: IdentityBoxProps) {
  const { t } = useTranslation("students");
  const [copied, setCopied] = useState<"no" | "pw" | null>(null);

  function copy(value: string, key: "no" | "pw") {
    try { navigator.clipboard.writeText(value); } catch (_) { /* clipboard yoksa sessiz geç */ }
    setCopied(key);
    setTimeout(() => setCopied(null), 1400);
  }

  return (
    <div className="identity-box">
      <div className="ib-head">
        <div className="ib-ico"><Key size={20} /></div>
        <div>
          <div className="ib-t">{t("enrollWizard.success.identityTitle")}</div>
          <div className="ib-d">{t("enrollWizard.success.identityHint")}</div>
        </div>
      </div>
      <div className="ib-rows">
        <div className="ib-row">
          <span className="ibr-l">{t("enrollWizard.success.studentNo")}</span>
          <span className="ibr-r">
            <span className="ibr-v">{studentNumber}</span>
            <button
              className={"ib-copy" + (copied === "no" ? " copied" : "")}
              onClick={() => copy(studentNumber, "no")}
              title={t("enrollWizard.success.copy")}
            >
              {copied === "no" ? <Check size={15} /> : <Copy size={15} />}
            </button>
          </span>
        </div>
        <div className="ib-row">
          <span className="ibr-l">{t("enrollWizard.success.tempPassword")}</span>
          <span className="ibr-r">
            {studentAccountCreated && temporaryPassword ? (
              <>
                <span className="ibr-v">{temporaryPassword}</span>
                <button
                  className={"ib-copy" + (copied === "pw" ? " copied" : "")}
                  onClick={() => copy(temporaryPassword, "pw")}
                  title={t("enrollWizard.success.copy")}
                >
                  {copied === "pw" ? <Check size={15} /> : <Copy size={15} />}
                </button>
              </>
            ) : (
              <span className="ibr-debt-note">
                {studentAccountCreated
                  ? t("enrollWizard.success.passwordShownOnce")
                  : t("enrollWizard.success.accountNotCreatedSmallGrade")}
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
```

`EnrollSuccess.tsx` — IdentityBox kullanımını güncelle (mevcut `<IdentityBox studentNumber={result.studentNumber} />`):
```typescript
        <IdentityBox
          studentNumber={result.studentNumber}
          temporaryPassword={result.temporaryPassword}
          studentAccountCreated={result.studentAccountCreated}
        />
```

`tr/students.json` `enrollWizard.success` bloğunda `tempPasswordDebt` ve `accountDebt` anahtarlarını SİL, yerine ekle:
```json
      "passwordShownOnce": "Şifre ilk yanıtta gösterildi (kayıt zaten oluşturulmuş).",
      "accountNotCreatedSmallGrade": "Küçük kademe — öğrenci hesabı açılmadı; veli daveti gönderildi.",
```

`en/students.json` `enrollWizard.success` bloğunda `tempPasswordDebt` ve `accountDebt` anahtarlarını SİL, yerine ekle:
```json
      "passwordShownOnce": "Password was shown in the first response (enrollment already created).",
      "accountNotCreatedSmallGrade": "Lower grade — student account not created; guardian invitation sent.",
```
(`tempPassword`, `studentNo`, `identityTitle`, `identityHint`, `copy` anahtarları korunur.)

- [ ] **Step 4: Run test to verify it passes**

Run: `cd oksis-web && npm run test -- IdentityBox`
Expected: PASS (3 states). Ardından tüm students FE süiti:
Run: `cd oksis-web && npm run test -- students`
Expected: PASS. Build doğrula: `cd oksis-web && npm run build`.

- [ ] **Step 5: Commit**

```bash
cd oksis-web && git add -A && git commit -m "2026-06-30 feat,test: başarı ekranı üç-durumlu kimlik kutusu — gerçek geçici şifre / replay / küçük kademe; Debt kaldırıldı (E2.6/E2.7)."
```

---

## Task 10: Modül dokümanları + session özeti

**Files:**
- Modify: `.claude/docs/modules/students/completion_status.md`
- Modify: `.claude/docs/modules/students/api-contracts.md` (EnrollStudentResult yeni alanlar; login öğrenci-no notu)
- Modify: `.claude/docs/modules/students/README.md` (Last Updated)
- Modify: `.claude/docs/modules/identity/` (login resolver öğrenci-no desteği — `api-contracts.md` veya `business-rules.md`)
- Create: `.claude/sessions/2026-06-30-enrollment-faz1b-be.md`

- [ ] **Step 1: Modül dokümanlarını güncelle**

`students/completion_status.md`: ilerleme yüzdesini bump et (50→ ~60), `Güncel` tarihini `2026-06-30` yap, Faz 1B-BE'yi ✅ bölümüne taşı (öğrenci hesabı + geçici şifre + öğrenci-no login + küçük kademe carve-out). "Spec Dışına Çıkılanlar" bölümüne **deviation YOK** — yalnız bir takip notu: "Öğrenci no format/kabul (E4.4/E2.3) ayrı spec'e ertelendi (2026-06-30, kullanıcı onayı)".

`students/api-contracts.md`: `EnrollStudentResult` şemasına `temporaryPassword: string?` + `studentAccountCreated: bool` ekle; "küçük kademede null" notu.

`identity` modülü dokümanına: login identifier'ları artık `StudentNumber` (tenant-scoped, SchoolHint zorunlu) içerir notu.

`students/README.md`: `Last Updated: 2026-06-30`, ilgili Files checkbox'ları işaretle.

- [ ] **Step 2: Session özetini yaz**

`.claude/sessions/2026-06-30-enrollment-faz1b-be.md` — İngilizce; ne yapıldı (10 task), kararlar (carve-out otomatik-kademe, replay'de şifre null, öğrenci no format işi ertelendi), kapanan Debt (başarı ekranı şifre kutusu), kalan roadmap (Faz 2 Liste & Yaşam döngüsü).

- [ ] **Step 3: Commit (workspace docs repo)**

```bash
cd /Users/farukkaya/Projects/oksis && git add .claude/docs/modules/students .claude/docs/modules/identity .claude/sessions/2026-06-30-enrollment-faz1b-be.md && git commit -m "2026-06-30 docs: students Faz 1B-BE tamam — öğrenci hesabı + geçici şifre + öğrenci-no login; başarı ekranı Debt kapandı; numara format işi ayrı spec'e ertelendi."
```

---

## Self-Review (yazar kontrolü)

**Spec coverage:** E2.6 → Task 1+3 (carve-out); E2.7 → Task 2+3+4 (geçici şifre, RequirePasswordChange) + Task 5+6+7 (öğrenci-no login); E5.1/E5.2 → Task 4 (transaction içi, teslim yok); E5.3 → Task 4 (replay). Üst spec 121-122 → Task 2-7. FE Debt kapanışı → Task 8+9. Docs → Task 10. ✅ Tüm tasarım bölümleri (§2-§8) bir task'a bağlı.

**Type consistency:** `EnrollStudentResult` 6-arg her yerde tutarlı (Task 4 def, FE Task 8 alan adları camelCase karşılığı). `ProvisionAsync(Person, int, Guid, CancellationToken)` Task 3 def → Task 4 call aynı. `FindByStudentNumberAsync(string, Guid, CancellationToken)` Task 6 def → Task 7 call aynı. `IdentityBox` prop'ları Task 9 def → EnrollSuccess kullanımı aynı.

**Placeholder scan:** Somut kod her step'te mevcut; "TBD"/"benzer" yok. `BuildDirectory` kullanılmayan yardımcı not'la işaretli (silinebilir).

**Kapsam dışı teyit:** Hiçbir task `StudentNumberGenerator` / `EnrollStudentCommand` numara alanına dokunmuyor — öğrenci no format/kabul ayrı (Global Constraints).
