# Duyurular A1 — Omurga Implementation Plan (3/4)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Bu dosya `2026-08-02-duyurular-a1-omurga.md`'nin devamıdır.** Global Constraints ve dosya
> yapısı orada tanımlıdır. Görev 1–9 tamamlanmış olmalıdır.

**Bu dosyanın kapsamı:** Görev 10–12 — alıcı çözümleme ve yayın omurgası. Planın en riskli bölümü.

---

### Task 10: `IAudienceResolver` + implementasyon

Modülün tek alıcı otoritesi. **Hem** hedef havuzunu üretir **hem** yayın anında alıcıyı
materyalize eder — iki ayrı kod yolu olursa önizlemedeki sayı ile gerçek alıcı ayrışır ve
DYR-F-04 ("yayın öncesi kaç kişiye gideceği gösterilir") yalan söyler.

**Files:**
- Create: `src/Oksis.Application/Modules/Announcements/Abstractions/IAudienceResolver.cs`
- Create: `src/Oksis.Infrastructure/Announcements/AudienceResolver.cs`
- Modify: `src/Oksis.Infrastructure/DependencyInjection.cs`
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/AudienceResolverTests.cs`

**Interfaces:**
- Consumes: `IApplicationDbContext`, Task 2 enum'ları, Task 8 DTO'ları, Task 9 `AnnouncementAudienceRules`
- Produces:
  - `record ResolvedRecipient(Guid PersonId, string RoleAtPublish, Guid? ChildPersonId)`
  - `record AudienceScope(Guid SchoolId, Guid AcademicSessionId, Guid? TeacherPersonId)` — `TeacherPersonId` doluysa havuz o öğretmenin şube/derslerine daralır
  - `Task<AudiencePoolDto> GetPoolAsync(AudienceScope scope, CancellationToken ct)`
  - `Task<IReadOnlyList<ResolvedRecipient>> ResolveAsync(AudienceScope scope, IReadOnlyList<AudienceSelectionBody> selections, CancellationToken ct)`
  - Task 11 `GetPoolAsync`'i, Task 12 `ResolveAsync`'i çağırır.

> **İsimlendirme tuzağı:** `NotificationRecipientResolver.ResolveBranchConsumersAsync`'in
> `branchId` parametresi aslında `StudentProfile.CurrentClassroomId`'dir — yani **şube**.
> `Branch` entity'si ise **branş**tır. Bu karışıklığı taşıma: şube = `ClassRoom`.

- [ ] **Step 1: Zinciri doğrula**

Run:
```bash
cd /Users/farukkaya/Repositories/oksis-api
grep -n "public .* { get" src/Oksis.Domain/Modules/Users/Entities/StudentProfile.cs
grep -n "public .* { get" src/Oksis.Domain/Modules/AcademicSessions/Entities/ClassRoom.cs
grep -n "public .* { get" src/Oksis.Domain/Modules/Academics/Entities/GradeLevel.cs
grep -n "DbSet<Profile>\|DbSet<ClassRoom>\|DbSet<GradeLevel>\|DbSet<ParentStudentRelationship>\|DbSet<TeachingAssignment>\|DbSet<RoleAssignment>" src/Oksis.Application/Common/Abstractions/IApplicationDbContext.cs
```

Expected zincir: `StudentProfile.CurrentClassroomId → ClassRoom.GradeLevelId → GradeLevel.EducationLevel`.
DbSet adları farklıysa aşağıdaki koda uyarla — **uydurma**.

- [ ] **Step 2: Failing test yaz**

`tests/Oksis.Infrastructure.IntegrationTests/Persistence/AudienceResolverTests.cs`:

```csharp
using FluentAssertions;
using Oksis.Application.Modules.Announcements.Abstractions;
using Oksis.Application.Modules.Announcements.DTOs;
using Xunit;

namespace Oksis.Infrastructure.IntegrationTests.Persistence;

/// <summary>
/// Alıcı çözümleme testleri. Fixture ikisi ilkokul (1-A) ikisi lise (9-A) olmak üzere
/// dört öğrenci ve her birine bir veli kurar; velilerden biri İKİ çocuğa bağlıdır.
/// </summary>
public sealed class AudienceResolverTests
{
    [Fact]
    public async Task Should_ExcludePrimaryStudents_When_AllSchoolTargetedForStudents()
    {
        // KR-03: ilkokul öğrencisi duyuru almaz.
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync();

        var resolved = await fixture.Resolver.ResolveAsync(
            fixture.AdminScope,
            [new AudienceSelectionBody { Dimension = "role", Key = "student", Bucket = "student" }],
            CancellationToken.None);

        resolved.Select(r => r.PersonId).Should().BeEquivalentTo(fixture.HighSchoolStudentIds);
        resolved.Select(r => r.PersonId).Should().NotIntersectWith(fixture.PrimaryStudentIds);
    }

    [Fact]
    public async Task Should_IncludeAllParents_When_PrimaryStageTargetedForParents()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync();

        var resolved = await fixture.Resolver.ResolveAsync(
            fixture.AdminScope,
            [new AudienceSelectionBody { Dimension = "schoolStage", Key = "primary", Bucket = "parent" }],
            CancellationToken.None);

        resolved.Select(r => r.PersonId).Should().BeEquivalentTo(fixture.PrimaryParentIds);
    }

    [Fact]
    public async Task Should_ReturnPersonOnce_When_ParentHasTwoChildrenInSameSelection()
    {
        // DYR-F-20: üç çocuklu veli okul geneli duyuruyu TEK kez görür.
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync();

        var resolved = await fixture.Resolver.ResolveAsync(
            fixture.AdminScope,
            [new AudienceSelectionBody { Dimension = "all", Key = "all", Bucket = "parent" }],
            CancellationToken.None);

        resolved.Select(r => r.PersonId).Should().OnlyHaveUniqueItems();
    }

    [Fact]
    public async Task Should_CarryChildPersonId_When_SectionScopedParentResolved()
    {
        // Sınıf duyurusu ilgili çocuğun adıyla etiketlenir.
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync();

        var resolved = await fixture.Resolver.ResolveAsync(
            fixture.AdminScope,
            [new AudienceSelectionBody
            {
                Dimension = "section", Key = fixture.HighSchoolClassRoomId.ToString(), Bucket = "parent",
            }],
            CancellationToken.None);

        resolved.Should().OnlyContain(r => r.ChildPersonId != null);
    }

    [Fact]
    public async Task Should_ResolveDifferentPeople_When_SameSectionKeyHasDifferentBucket()
    {
        // Kontrata bucket eklenmesinin GEREKÇESİ: aynı (dimension, key) çifti iki farklı
        // alıcı kümesine çözümlenir.
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync();
        var key = fixture.HighSchoolClassRoomId.ToString();

        var students = await fixture.Resolver.ResolveAsync(
            fixture.AdminScope,
            [new AudienceSelectionBody { Dimension = "section", Key = key, Bucket = "student" }],
            CancellationToken.None);

        var parents = await fixture.Resolver.ResolveAsync(
            fixture.AdminScope,
            [new AudienceSelectionBody { Dimension = "section", Key = key, Bucket = "parent" }],
            CancellationToken.None);

        students.Select(r => r.PersonId).Should().NotIntersectWith(parents.Select(r => r.PersonId));
    }

    [Fact]
    public async Task Should_AnnounceExcludedLevels_When_PoolBuiltForAdmin()
    {
        // DYR-F-15: kapsam dışı kalan EKRANDA açıkça görünür.
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync();

        var pool = await fixture.Resolver.GetPoolAsync(fixture.AdminScope, CancellationToken.None);

        var studentRole = pool.Role!.Single(o => o.Key == "student");
        studentRole.Sublabel.Should().Contain("kapsam dışı");
        studentRole.RecipientCount.Should().Be(fixture.HighSchoolStudentIds.Count);
    }

    [Fact]
    public async Task Should_HideAllOption_When_PoolBuiltForTeacher()
    {
        // §4.2 tasarım notu: öğretmen "tüm okul"u devre dışı olarak bile GÖRMEZ.
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync();

        var pool = await fixture.Resolver.GetPoolAsync(fixture.TeacherScope, CancellationToken.None);

        pool.All.Should().BeNull();
        pool.Role.Should().BeNull();
        pool.SchoolStage.Should().BeNull();
        pool.Section.Should().NotBeNullOrEmpty();
    }
}
```

- [ ] **Step 3: Fixture'ı yaz**

`tests/Oksis.Infrastructure.IntegrationTests/Persistence/AnnouncementAudienceFixture.cs` —
mevcut integration fixture kalıbını (Task 6 Step 2'de öğrendiğin) sarmalayarak şu veriyi kurar:

- 1 okul, 1 aktif sezon
- 2 `ClassRoom`: `1-A` (GradeLevel → `EducationLevel.Primary`), `9-A` (→ `High`)
- 4 öğrenci: 2'si `1-A`, 2'si `9-A`; hepsinin `StudentProfile.IsActiveStudent = true`
- 3 veli: `1-A`'daki iki öğrencinin **ikisine birden** bağlı 1 veli (çok çocuklu hâl) + `9-A`'daki her öğrenciye 1'er veli
- 1 öğretmen, `9-A`'ya `TeachingAssignment` ile bağlı
- Açığa çıkardığı üyeler: `Resolver`, `AdminScope`, `TeacherScope`, `PrimaryStudentIds`, `HighSchoolStudentIds`, `PrimaryParentIds`, `HighSchoolClassRoomId`

- [ ] **Step 4: Testin kırıldığını doğrula**

Run: `dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~AudienceResolverTests"`
Expected: FAIL — `IAudienceResolver` yok.

- [ ] **Step 5: Arayüzü yaz**

```csharp
using Oksis.Application.Modules.Announcements.DTOs;

namespace Oksis.Application.Modules.Announcements.Abstractions;

/// <summary>Yayın anında dondurulacak tek bir alıcı.</summary>
public sealed record ResolvedRecipient(Guid PersonId, string RoleAtPublish, Guid? ChildPersonId);

/// <summary>
/// Alıcı çözümlemenin bağlamı. <see cref="TeacherPersonId"/> DOLUYSA havuz o öğretmenin
/// kendi şube ve derslerine daralır — yetki seçeneği kilitleyerek değil LİSTEYİ DARALTARAK
/// uygulanır (§4.2 tasarım notu: görünen ama tıklanamayan seçenek benimsemeyi düşürür).
/// </summary>
public sealed record AudienceScope(Guid SchoolId, Guid AcademicSessionId, Guid? TeacherPersonId);

/// <summary>
/// Duyuru alıcı çözümlemesinin TEK otoritesi.
///
/// <para><b>Neden tek arayüz:</b> <see cref="GetPoolAsync"/> önizlemedeki sayıyı,
/// <see cref="ResolveAsync"/> gerçek alıcıyı üretir. İkisi ayrı kod yollarına bölünürse
/// müdüre "428 kişiye gidecek" denip 260 kişiye gider — DYR-F-04'ün yasakladığı hâl budur.</para>
/// </summary>
public interface IAudienceResolver
{
    Task<AudiencePoolDto> GetPoolAsync(AudienceScope scope, CancellationToken ct);

    Task<IReadOnlyList<ResolvedRecipient>> ResolveAsync(
        AudienceScope scope, IReadOnlyList<AudienceSelectionBody> selections, CancellationToken ct);
}
```

- [ ] **Step 6: Implementasyonu yaz — öğrenci temeli**

`src/Oksis.Infrastructure/Announcements/AudienceResolver.cs`. Önce ortak temel:
her katman önce bir **öğrenci kümesi** üretir, sonra kova'ya göre öğrenciye mi veliye mi
çözümleneceğine karar verilir. `role=teacher` ve `person` katmanları bu temelin dışındadır.

```csharp
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Modules.Announcements.Abstractions;
using Oksis.Application.Modules.Announcements.Common;
using Oksis.Application.Modules.Announcements.DTOs;
using Oksis.Domain.Modules.Academics.Enums;
using Oksis.Domain.Modules.Announcements.Enums;
using Oksis.Domain.Modules.Announcements.Rules;
using Oksis.Domain.Modules.Users.Entities;

namespace Oksis.Infrastructure.Announcements;

/// <summary>
/// <see cref="IAudienceResolver"/> implementasyonu.
///
/// <para><b>Çözümleme zinciri:</b> her katman önce bir ÖĞRENCİ kümesi üretir
/// (<c>StudentProfile.CurrentClassroomId → ClassRoom.GradeLevelId → GradeLevel.EducationLevel</c>),
/// sonra <see cref="AudienceBucket"/>'a göre ya doğrudan öğrenciye ya da
/// <c>ParentStudentRelationship</c> üzerinden veliye çözülür. İstisna: <c>role=teacher</c>
/// ve <c>person</c> katmanları öğrenci temelinden geçmez.</para>
/// </summary>
public sealed class AudienceResolver(IApplicationDbContext db) : IAudienceResolver
{
    private sealed record StudentRow(Guid PersonId, Guid ClassRoomId, EducationLevel Level, int GradeLevel);

    public async Task<IReadOnlyList<ResolvedRecipient>> ResolveAsync(
        AudienceScope scope, IReadOnlyList<AudienceSelectionBody> selections, CancellationToken ct)
    {
        var students = await LoadStudentsAsync(scope, ct);
        var accumulated = new Dictionary<Guid, ResolvedRecipient>();

        foreach (var selection in selections)
        {
            var dimension = AnnouncementEnumWire.ParseDimension(selection.Dimension);
            var bucket = AnnouncementEnumWire.ParseBucket(selection.Bucket);

            foreach (var recipient in await ResolveOneAsync(scope, students, dimension, selection.Key, bucket, ct))
            {
                // Aynı kişi birden çok seçimden gelebilir (ör. hem "9-A velileri" hem
                // "Veliler"). İLK kayıt korunur — çok çocuklu veli duyuruyu tek kez alır.
                accumulated.TryAdd(recipient.PersonId, recipient);
            }
        }

        return accumulated.Values.ToList();
    }

    /// <summary>
    /// Okulun aktif öğrencilerini kademe ve seviye bilgisiyle TEK sorguda çeker.
    /// Katman başına ayrı sorgu N+1 üretirdi; çözümleme bellekte yapılır.
    /// </summary>
    private async Task<IReadOnlyList<StudentRow>> LoadStudentsAsync(AudienceScope scope, CancellationToken ct) =>
        await (
            from sp in db.Profiles.OfType<StudentProfile>().AsNoTracking()
            join cr in db.ClassRooms.AsNoTracking() on sp.CurrentClassroomId equals cr.Id
            join gl in db.GradeLevels.AsNoTracking() on cr.GradeLevelId equals gl.Id
            where sp.SchoolId == scope.SchoolId
                && sp.IsActiveStudent
                && cr.AcademicSessionId == scope.AcademicSessionId
            select new StudentRow(sp.PersonId, cr.Id, gl.EducationLevel, gl.DisplayOrder))
        .ToListAsync(ct);
}
```

> **`gl.DisplayOrder`** sınıf seviyesi için geçici bir vekildir. **Step 7'de**
> `GradeLevel` üzerinde sayısal seviyeyi taşıyan gerçek alanı (`Code` ayrıştırması veya
> `StudentEnrollment.GradeLevel`) doğrula ve kullan.

- [ ] **Step 7: Sınıf seviyesi kaynağını doğrula ve düzelt**

Run:
```bash
grep -n "public .* { get" src/Oksis.Domain/Modules/Academics/Entities/GradeLevel.cs
grep -n "GradeLevel" src/Oksis.Domain/Modules/Students/Entities/StudentEnrollment.cs
```

`StudentEnrollment.GradeLevel` bir `int`tir ve doğrudan sınıf seviyesidir. `gradeLevel`
katmanı için `StudentEnrollment`'a join at (aktif sezon + `EnrollmentStatus` aktif) ve
`StudentRow.GradeLevel`'i oradan doldur. `GradeLevel.DisplayOrder` kullanma.

- [ ] **Step 8: Katman çözümlemesini yaz**

`AudienceResolver` içine ekle:

```csharp
    private async Task<IReadOnlyList<ResolvedRecipient>> ResolveOneAsync(
        AudienceScope scope, IReadOnlyList<StudentRow> students,
        AudienceDimension dimension, string key, AudienceBucket bucket, CancellationToken ct)
    {
        // Öğretmen kovası ve kişi katmanı öğrenci temelinden geçmez.
        if (bucket is AudienceBucket.Teacher)
        {
            return await ResolveTeachersAsync(scope, dimension, key, ct);
        }

        if (dimension is AudienceDimension.Person)
        {
            return [new ResolvedRecipient(Guid.Parse(key), bucket.ToString(), null)];
        }

        var matched = dimension switch
        {
            AudienceDimension.All => students,
            AudienceDimension.Role => students, // key == "student" | "parent"; kova zaten ayırıyor
            AudienceDimension.SchoolStage => students.Where(s => s.Level == ParseLevel(key)).ToList(),
            AudienceDimension.GradeLevel => students.Where(s => s.GradeLevel == ParseGrade(key)).ToList(),
            AudienceDimension.Section => students.Where(s => s.ClassRoomId == Guid.Parse(key)).ToList(),
            AudienceDimension.Course => await ResolveCourseStudentsAsync(scope, students, key, ct),
            _ => throw new ArgumentOutOfRangeException(nameof(dimension), dimension, null),
        };

        if (bucket is AudienceBucket.Student)
        {
            // KADEME KURALI burada uygulanır ve SESSİZ DEĞİLDİR: kapsam dışı kalanın
            // sayısı havuzda (GetPoolAsync) zaten daraltılmış gösterilir, yani müdür
            // gönderim anında sürprizle karşılaşmaz.
            return matched
                .Where(s => AnnouncementAudienceRules.ReceivesAnnouncements(s.Level, AudienceBucket.Student))
                .Select(s => new ResolvedRecipient(s.PersonId, "Student", null))
                .ToList();
        }

        return await ResolveParentsOfAsync(scope, matched, ct);
    }

    /// <summary>
    /// Verilen öğrencilerin velilerini çözer. <c>ChildPersonId</c> DOLDURULUR — sınıf
    /// duyurusu alıcı yüzeyinde ilgili çocuğun adıyla etiketlenir. Bir veli birden çok
    /// çocukla eşleşirse İLK çocuk yazılır ve kişi tek satır olur (DYR-F-20).
    /// </summary>
    private async Task<IReadOnlyList<ResolvedRecipient>> ResolveParentsOfAsync(
        Guid schoolIdScope, IReadOnlyList<StudentRow> students, CancellationToken ct)
    {
        var studentIds = students.Select(s => s.PersonId).ToList();
        if (studentIds.Count == 0)
        {
            return [];
        }

        var links = await db.ParentStudentRelationships.AsNoTracking()
            .Where(r => r.SchoolId == schoolIdScope
                && r.RevokedAt == null
                && studentIds.Contains(r.StudentPersonId))
            .Select(r => new { r.ParentPersonId, r.StudentPersonId })
            .ToListAsync(ct);

        return links
            .GroupBy(l => l.ParentPersonId)
            .Select(g => new ResolvedRecipient(g.Key, "Parent", g.First().StudentPersonId))
            .ToList();
    }

    private static EducationLevel ParseLevel(string key) => key switch
    {
        "preschool" => EducationLevel.Preschool,
        "primary" => EducationLevel.Primary,
        "middle" => EducationLevel.Middle,
        "high" => EducationLevel.High,
        _ => throw new ArgumentOutOfRangeException(nameof(key), key, "Bilinmeyen kademe anahtarı."),
    };

    private static int ParseGrade(string key) =>
        int.Parse(key.StartsWith("grade-", StringComparison.Ordinal) ? key["grade-".Length..] : key);
```

> `ResolveParentsOfAsync` imzasındaki ilk parametre `Guid schoolIdScope` olmalıdır;
> `ResolveOneAsync` içinden `scope.SchoolId` geçir.

- [ ] **Step 9: Öğretmen ve ders çözümlemesini yaz**

```csharp
    /// <summary>
    /// Öğretmen alıcılar. <c>role=teacher</c> tüm aktif öğretmenleri, <c>person</c> tekil
    /// kişiyi verir. Diğer katmanlar öğretmen kovasıyla anlamlı değildir ve boş döner.
    /// </summary>
    private async Task<IReadOnlyList<ResolvedRecipient>> ResolveTeachersAsync(
        AudienceScope scope, AudienceDimension dimension, string key, CancellationToken ct)
    {
        if (dimension is AudienceDimension.Person)
        {
            return [new ResolvedRecipient(Guid.Parse(key), "Teacher", null)];
        }

        if (dimension is not (AudienceDimension.All or AudienceDimension.Role))
        {
            return [];
        }

        var teacherIds = await db.Profiles.OfType<TeacherProfile>().AsNoTracking()
            .Where(tp => tp.SchoolId == scope.SchoolId)
            .Select(tp => tp.PersonId)
            .ToListAsync(ct);

        return teacherIds.Select(id => new ResolvedRecipient(id, "Teacher", null)).ToList();
    }

    /// <summary>
    /// Ders grubu: <c>key</c> bir <c>TeachingAssignment.Id</c>'dir. O görevlendirmenin
    /// şubesindeki öğrenciler alınır — ders bazlı bir öğrenci listesi ayrıca tutulmaz.
    /// </summary>
    private async Task<IReadOnlyList<StudentRow>> ResolveCourseStudentsAsync(
        AudienceScope scope, IReadOnlyList<StudentRow> students, string key, CancellationToken ct)
    {
        var assignmentId = Guid.Parse(key);
        var classRoomId = await db.TeachingAssignments.AsNoTracking()
            .Where(ta => ta.SchoolId == scope.SchoolId
                && ta.Id == assignmentId
                && ta.RevokedAt == null)
            .Select(ta => (Guid?)ta.ClassRoomId)
            .SingleOrDefaultAsync(ct);

        return classRoomId is null
            ? []
            : students.Where(s => s.ClassRoomId == classRoomId.Value).ToList();
    }
```

- [ ] **Step 10: `GetPoolAsync`'i yaz**

```csharp
    public async Task<AudiencePoolDto> GetPoolAsync(AudienceScope scope, CancellationToken ct)
    {
        var students = await LoadStudentsAsync(scope, ct);

        if (scope.TeacherPersonId is { } teacherId)
        {
            return await BuildTeacherPoolAsync(scope, students, teacherId, ct);
        }

        return await BuildAdminPoolAsync(scope, students, ct);
    }

    private async Task<AudiencePoolDto> BuildAdminPoolAsync(
        AudienceScope scope, IReadOnlyList<StudentRow> students, CancellationToken ct)
    {
        var eligibleStudents = students
            .Where(s => AnnouncementAudienceRules.ReceivesAnnouncements(s.Level, AudienceBucket.Student))
            .ToList();

        var excludedLevels = students
            .Where(s => !AnnouncementAudienceRules.ReceivesAnnouncements(s.Level, AudienceBucket.Student))
            .Select(s => s.Level)
            .Distinct()
            .ToList();

        // DYR-F-15: kapsam dışı kalan AÇIKÇA gösterilir ve sayı ZATEN daraltılmıştır.
        var studentNotice = AnnouncementAudienceRules.ExcludedStudentNotice(excludedLevels);

        var parentCount = (await ResolveParentsOfAsync(scope.SchoolId, students, ct)).Count;
        var teacherCount = (await ResolveTeachersAsync(scope, AudienceDimension.Role, "teacher", ct)).Count;

        var all = new AudienceOptionDto
        {
            Key = "all",
            Label = "Tüm okul",
            RecipientCount = parentCount + teacherCount + eligibleStudents.Count,
            Sublabel = studentNotice ?? "Veli, öğretmen ve öğrencilerin tamamı",
            Bucket = "student",
            Breakdown = new AudienceRoleSplitDto
            {
                Parents = parentCount,
                Teachers = teacherCount,
                Students = eligibleStudents.Count,
            },
        };

        var stages = students
            .GroupBy(s => s.Level)
            .OrderBy(g => (int)g.Key)
            .Select(g => new AudienceOptionDto
            {
                Key = StageKey(g.Key),
                Label = StageLabel(g.Key),
                RecipientCount = g.Count(s =>
                    AnnouncementAudienceRules.ReceivesAnnouncements(s.Level, AudienceBucket.Student)),
                Sublabel = AnnouncementAudienceRules.ExcludedStudentNotice(
                    AnnouncementAudienceRules.ReceivesAnnouncements(g.Key, AudienceBucket.Student)
                        ? [] : [g.Key]),
                Bucket = "student",
                Breakdown = null,
            })
            .ToList();

        var grades = students
            .GroupBy(s => s.GradeLevel)
            .OrderBy(g => g.Key)
            .Select(g => new AudienceOptionDto
            {
                Key = $"grade-{g.Key}",
                Label = $"{g.Key}. sınıf",
                RecipientCount = g.Count(s =>
                    AnnouncementAudienceRules.ReceivesAnnouncements(s.Level, AudienceBucket.Student)),
                Sublabel = null,
                Bucket = "student",
                Breakdown = null,
            })
            .ToList();

        var sections = await BuildSectionOptionsAsync(scope, students, students.Select(s => s.ClassRoomId).Distinct(), ct);

        return new AudiencePoolDto
        {
            All = all,
            Role =
            [
                new AudienceOptionDto
                {
                    Key = "parent", Label = "Veliler", RecipientCount = parentCount,
                    Sublabel = null, Bucket = "parent", Breakdown = null,
                },
                new AudienceOptionDto
                {
                    Key = "teacher", Label = "Öğretmenler", RecipientCount = teacherCount,
                    Sublabel = null, Bucket = "teacher", Breakdown = null,
                },
                new AudienceOptionDto
                {
                    Key = "student", Label = "Öğrenciler", RecipientCount = eligibleStudents.Count,
                    Sublabel = studentNotice, Bucket = "student", Breakdown = null,
                },
            ],
            SchoolStage = stages,
            GradeLevel = grades,
            Section = sections,
        };
    }

    private static string StageKey(EducationLevel level) => level switch
    {
        EducationLevel.Preschool => "preschool",
        EducationLevel.Primary => "primary",
        EducationLevel.Middle => "middle",
        EducationLevel.High => "high",
        _ => throw new ArgumentOutOfRangeException(nameof(level), level, null),
    };

    private static string StageLabel(EducationLevel level) => level switch
    {
        EducationLevel.Preschool => "Anaokulu",
        EducationLevel.Primary => "İlkokul",
        EducationLevel.Middle => "Ortaokul",
        EducationLevel.High => "Lise",
        _ => throw new ArgumentOutOfRangeException(nameof(level), level, null),
    };
```

- [ ] **Step 11: Şube seçeneklerini yaz**

```csharp
    /// <summary>
    /// Şube seçenekleri. Yönetici havuzunda ŞUBEDEKİ ÖĞRENCİLER (<c>bucket=student</c>),
    /// öğretmen havuzunda AYNI şubenin VELİLERİ (<c>bucket=parent</c>) kastedilir — anahtar
    /// aynı, anlam farklıdır. Gövdedeki <c>bucket</c> alanı tam da bunu belirsiz olmaktan
    /// çıkarır.
    /// </summary>
    private async Task<IReadOnlyList<AudienceOptionDto>> BuildSectionOptionsAsync(
        AudienceScope scope, IReadOnlyList<StudentRow> students,
        IEnumerable<Guid> classRoomIds, CancellationToken ct)
    {
        var ids = classRoomIds.ToList();
        var names = await db.ClassRooms.AsNoTracking()
            .Where(cr => cr.SchoolId == scope.SchoolId && ids.Contains(cr.Id))
            .Select(cr => new { cr.Id, cr.FullName })
            .ToListAsync(ct);

        var isTeacherPool = scope.TeacherPersonId is not null;

        // Veli sayıları döngüden ÖNCE hesaplanır: `Select` içinde `await` edilemez ve
        // `GetAwaiter().GetResult()` Global Constraints ile yasaktır.
        var parentsBySection = new Dictionary<Guid, int>();
        if (isTeacherPool)
        {
            foreach (var id in ids)
            {
                var inSection = students.Where(s => s.ClassRoomId == id).ToList();
                parentsBySection[id] = (await ResolveParentsOfAsync(scope.SchoolId, inSection, ct)).Count;
            }
        }

        return names
            .OrderBy(n => n.FullName, StringComparer.Create(new System.Globalization.CultureInfo("tr-TR"), true))
            .Select(n =>
            {
                var count = isTeacherPool
                    ? parentsBySection[n.Id]
                    : students.Count(s => s.ClassRoomId == n.Id
                        && AnnouncementAudienceRules.ReceivesAnnouncements(s.Level, AudienceBucket.Student));

                return new AudienceOptionDto
                {
                    Key = n.Id.ToString(),
                    Label = isTeacherPool ? $"{n.FullName} velileri" : n.FullName,
                    RecipientCount = count,
                    Sublabel = isTeacherPool ? $"Şube · {n.FullName}" : null,
                    Bucket = isTeacherPool ? "parent" : "student",
                    Breakdown = null,
                };
            })
            .ToList();
    }
```

- [ ] **Step 12: Öğretmen havuzunu yaz**

```csharp
    /// <summary>
    /// Öğretmen havuzu: YALNIZ kendi şubeleri ve dersleri. "Tüm okul", rol ve kademe
    /// katmanları HİÇ DÖNMEZ (null) — devre dışı olarak bile gösterilmez (§4.2 tasarım notu).
    /// </summary>
    private async Task<AudiencePoolDto> BuildTeacherPoolAsync(
        AudienceScope scope, IReadOnlyList<StudentRow> students, Guid teacherPersonId, CancellationToken ct)
    {
        var assignments = await db.TeachingAssignments.AsNoTracking()
            .Where(ta => ta.SchoolId == scope.SchoolId
                && ta.TeacherId == teacherPersonId
                && ta.AcademicSessionId == scope.AcademicSessionId
                && ta.RevokedAt == null)
            .Select(ta => new { ta.Id, ta.ClassRoomId, ta.SubjectId })
            .ToListAsync(ct);

        var myClassRoomIds = assignments.Select(a => a.ClassRoomId).Distinct().ToList();
        var myStudents = students.Where(s => myClassRoomIds.Contains(s.ClassRoomId)).ToList();

        var sections = await BuildSectionOptionsAsync(scope, myStudents, myClassRoomIds, ct);

        var subjectNames = await db.Subjects.AsNoTracking()
            .Where(s => assignments.Select(a => a.SubjectId).Contains(s.Id))
            .Select(s => new { s.Id, s.Name })
            .ToListAsync(ct);

        var classRoomNames = await db.ClassRooms.AsNoTracking()
            .Where(cr => myClassRoomIds.Contains(cr.Id))
            .Select(cr => new { cr.Id, cr.FullName })
            .ToListAsync(ct);

        var courses = assignments.Select(a =>
        {
            var studentsInCourse = myStudents
                .Where(s => s.ClassRoomId == a.ClassRoomId
                    && AnnouncementAudienceRules.ReceivesAnnouncements(s.Level, AudienceBucket.Student))
                .ToList();

            var subject = subjectNames.SingleOrDefault(s => s.Id == a.SubjectId)?.Name ?? "Ders";
            var room = classRoomNames.SingleOrDefault(c => c.Id == a.ClassRoomId)?.FullName ?? "";

            return new AudienceOptionDto
            {
                Key = a.Id.ToString(),
                Label = $"{room} {subject}".Trim(),
                RecipientCount = studentsInCourse.Count,
                Sublabel = "Öğrenciler",
                Bucket = "student",
                Breakdown = null,
            };
        }).ToList();

        return new AudiencePoolDto
        {
            All = null,
            Role = null,
            SchoolStage = null,
            GradeLevel = null,
            Section = sections,
            Course = courses,
            Person = null,
        };
    }
```

- [ ] **Step 13: DI kaydı**

`src/Oksis.Infrastructure/DependencyInjection.cs` — mevcut `AddScoped` bloğuna:

```csharp
        services.AddScoped<IAudienceResolver, AudienceResolver>();
```

- [ ] **Step 14: `Subjects` DbSet adını doğrula**

Run: `grep -n "DbSet<Subject>\|DbSet<TeacherProfile>\|DbSet<Profile>" src/Oksis.Application/Common/Abstractions/IApplicationDbContext.cs`
Expected: Gerçek adlar. Farklıysa koda uyarla.

- [ ] **Step 15: Testlerin geçtiğini doğrula**

Run:
```bash
docker compose up -d
dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~AudienceResolverTests"
```
Expected: PASS (7 test)

- [ ] **Step 16: Commit**

```bash
cd /Users/farukkaya/Repositories/oksis-api
dotnet format
git add src/Oksis.Application/Modules/Announcements/Abstractions/ src/Oksis.Infrastructure/Announcements/ src/Oksis.Infrastructure/DependencyInjection.cs tests/Oksis.Infrastructure.IntegrationTests/
git commit -m "feat(announcements): alici cozumleyici ve hedef havuzu eklendi

Tek arayuz hem onizleme sayisini hem gercek aliciyi uretir; iki kod
yoluna bolunurse mudure '428 kisiye gidecek' denip 260 kisiye gider
(DYR-F-04). Kademe kurali havuzda ZATEN daraltilmis sayi ve acik
sublabel ile gosterilir. Ogretmen havuzunda tum okul/rol/kademe
katmanlari HIC donmez — devre disi olarak bile gosterilmez."
```

---

### Task 11: `GET /announcements/audience` + controller iskeleti

**Files:**
- Create: `src/Oksis.Application/Modules/Announcements/Queries/GetAudiencePool/GetAudiencePoolQuery.cs`
- Create: `src/Oksis.Application/Modules/Announcements/Queries/GetAudiencePool/GetAudiencePoolQueryHandler.cs`
- Create: `src/Oksis.Application/Modules/Announcements/Common/AnnouncementCallerResolver.cs`
- Create: `src/Oksis.Api/Controllers/V1/AnnouncementsController.cs`
- Test: `tests/Oksis.Application.UnitTests/Modules/Announcements/GetAudiencePoolQueryHandlerTests.cs`

**Interfaces:**
- Consumes: Task 10 `IAudienceResolver`, `ITenantContext`, `ICurrentUser`
- Produces:
  - `GetAudiencePoolQuery(string? Scope) : IQuery<AudiencePoolDto>` — `[RequirePermission("announcements.create")]`
  - `AnnouncementCallerResolver.ResolveMyPersonIdAsync(IApplicationDbContext db, Guid accountId, CancellationToken ct) → Task<Guid?>`
  - `AnnouncementCallerResolver.IsTeacherOnlyAsync(...)` → çağıran yalnız öğretmen rolündeyse true
  - `AnnouncementsController` — Task 12–16 uç ekler.

- [ ] **Step 1: Caller resolver kalıbını oku**

Run: `cat src/Oksis.Application/Modules/Attendance/Common/AttendanceCallerResolver.cs`
Expected: `ResolveMyPersonIdAsync` kalıbı. `AnnouncementCallerResolver`'ı **aynı kalıpta** yaz;
kopyalama yerine mevcut olanı çağırabiliyorsan çağır (DRY).

- [ ] **Step 2: Failing test yaz**

```csharp
using FluentAssertions;
using NSubstitute;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Modules.Announcements.Abstractions;
using Oksis.Application.Modules.Announcements.DTOs;
using Oksis.Application.Modules.Announcements.Queries.GetAudiencePool;
using Xunit;

namespace Oksis.Application.UnitTests.Modules.Announcements;

public sealed class GetAudiencePoolQueryHandlerTests
{
    [Fact]
    public async Task Should_ReturnForbidden_When_NoTenantInContext()
    {
        var tenant = Substitute.For<ITenantContext>();
        tenant.CurrentSchoolId.Returns((Guid?)null);

        var sut = new GetAudiencePoolQueryHandler(
            Substitute.For<IApplicationDbContext>(), tenant,
            Substitute.For<ICurrentUser>(), Substitute.For<IAudienceResolver>());

        var result = await sut.Handle(new GetAudiencePoolQuery(null), CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
    }

}
```

> **Bu handler tek birim testi alır.** "Öğretmen havuzu daralır" davranışı
> `AnnouncementCallerResolver`'ın DB'ye gitmesini gerektirir, dolayısıyla birim testte
> mock yığmak yerine integration seviyesinde doğrulanır — Task 10'un
> `Should_HideAllOptionFromTeacher_When_PoolBuiltForTeacher` testi ve Task 18'in
> `Should_HideAllOptionFromTeacher_When_AudiencePoolRequested` testi bu yolu uçtan uca
> kapsar. Buraya `ICallerResolver` arayüzü ÇIKARMA: tek amacı test edilebilirlik olan
> bir soyutlama, üç satırlık statik bir yardımcı için fazladan katmandır.

- [ ] **Step 3: Query, handler ve controller'ı yaz**

`GetAudiencePoolQuery.cs`:

```csharp
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Announcements.DTOs;

namespace Oksis.Application.Modules.Announcements.Queries.GetAudiencePool;

/// <summary>
/// Hedef kitle havuzu. İzin <c>announcements.create</c>'tir — havuz yalnız duyuru
/// YAZARKEN anlamlıdır; okuma yetkisi olan bir veliye alıcı sayıları gösterilmez
/// (kaç kişiye gittiği hassas veridir).
/// </summary>
[Tenancy(TenancyMode.Required)]
[RequirePermission("announcements.create")]
public sealed record GetAudiencePoolQuery(string? Scope) : IQuery<AudiencePoolDto>;
```

`GetAudiencePoolQueryHandler.cs`:

```csharp
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Announcements.Abstractions;
using Oksis.Application.Modules.Announcements.Common;
using Oksis.Application.Modules.Announcements.DTOs;
using Oksis.Shared;

namespace Oksis.Application.Modules.Announcements.Queries.GetAudiencePool;

public sealed class GetAudiencePoolQueryHandler(
    IApplicationDbContext db,
    ITenantContext tenant,
    ICurrentUser currentUser,
    IAudienceResolver resolver)
    : IQueryHandler<GetAudiencePoolQuery, AudiencePoolDto>
{
    public async Task<Result<AudiencePoolDto>> Handle(
        GetAudiencePoolQuery request, CancellationToken cancellationToken)
    {
        if (tenant.CurrentSchoolId is not { } schoolId)
        {
            return Result<AudiencePoolDto>.Forbidden();
        }

        var sessionId = await AnnouncementCallerResolver.ResolveActiveSessionIdAsync(db, schoolId, cancellationToken);
        if (sessionId is null)
        {
            return Result<AudiencePoolDto>.Failure(
                new Error("Announcements.Session.NotFound", "Aktif sezon bulunamadı."));
        }

        // Öğretmen SADECE öğretmense havuz daralır. Aynı kişi hem öğretmen hem idareciyse
        // geniş havuzu görür — daraltma bir ceza değil, kapsam ifadesidir.
        var teacherPersonId = await AnnouncementCallerResolver.ResolveTeacherOnlyPersonIdAsync(
            db, currentUser, schoolId, cancellationToken);

        var pool = await resolver.GetPoolAsync(
            new AudienceScope(schoolId, sessionId.Value, teacherPersonId), cancellationToken);

        return Result<AudiencePoolDto>.Success(pool);
    }
}
```

`AnnouncementsController.cs`:

```csharp
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Oksis.Api.Contracts;
using Oksis.Api.Extensions;
using Oksis.Application.Modules.Announcements.DTOs;
using Oksis.Application.Modules.Announcements.Queries.GetAudiencePool;

namespace Oksis.Api.Controllers.V1;

/// <summary>
/// Duyurular. Thin controller: yalnız <c>ISender</c>, DbContext YOK.
///
/// <para><b>DELETE ucu YOKTUR ve yazılmayacaktır</b> — duyuru kurumsal kayıttır ve
/// silinmez (INV-1). Yanlış duyuru <c>:withdraw</c> ile geri çekilir.</para>
///
/// <para>Yaşam döngüsü fiilleri iki nokta ile ifade edilir (<c>{id}:withdraw</c>);
/// generic PATCH kullanılmaz.</para>
/// </summary>
[ApiController]
[Route("api/v1/announcements")]
[Authorize]
[Produces("application/json")]
public sealed class AnnouncementsController(ISender sender) : ControllerBase
{
    [HttpGet("audience")]
    [ProducesResponseType(typeof(ApiResponse<AudiencePoolDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAudienceAsync(
        [FromQuery] string? scope, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetAudiencePoolQuery(scope), cancellationToken);
        return result.ToHttpResult(HttpContext);
    }
}
```

- [ ] **Step 4: `AnnouncementCallerResolver`'ı yaz**

```csharp
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;

namespace Oksis.Application.Modules.Announcements.Common;

/// <summary>
/// Çağıranın domain kimliğini çözer. <c>AttendanceCallerResolver</c> kalıbı.
/// </summary>
public static class AnnouncementCallerResolver
{
    /// <summary>Oturum sahibinin <c>Person.Id</c>'si; bağlı kişisi yoksa null.</summary>
    public static async Task<Guid?> ResolveMyPersonIdAsync(
        IApplicationDbContext db, Guid accountId, CancellationToken ct) =>
        await db.Persons.AsNoTracking()
            .Where(p => p.LinkedAccountId == accountId)
            .Select(p => (Guid?)p.Id)
            .FirstOrDefaultAsync(ct);

    /// <summary>
    /// Çağıran YALNIZ öğretmense <c>Person.Id</c>, değilse null. Aynı kişi hem öğretmen
    /// hem idareciyse null döner ve geniş havuzu görür — daraltma bir ceza değil,
    /// kapsam ifadesidir.
    /// </summary>
    public static async Task<Guid?> ResolveTeacherOnlyPersonIdAsync(
        IApplicationDbContext db, ICurrentUser currentUser, Guid schoolId, CancellationToken ct)
    {
        var isTeacherOnly = currentUser.IsInRole("Teacher")
            && !currentUser.IsInRole("SchoolAdmin")
            && !currentUser.IsInRole("SchoolStaff")
            && !currentUser.IsInRole("Secretary");

        return isTeacherOnly
            ? await ResolveMyPersonIdAsync(db, currentUser.Id, ct)
            : null;
    }

    /// <summary>
    /// Çağıran duyuru ENVANTERİNİ kullanabilir mi (yönetim yüzeyi)?
    ///
    /// <para>Veli ve öğrencide de <c>announcements.view</c> izni vardır — ama o izin gelen
    /// kutusu içindir. Envanter onlara açılırsa okul geneli duyuru listesini, taslakları ve
    /// yayınlayan bilgisini görürler. İzin ucu açar; bu kontrol yüzeyi ayırır.</para>
    /// </summary>
    public static bool CanUseInventory(ICurrentUser currentUser) =>
        currentUser.IsInRole("SchoolAdmin")
        || currentUser.IsInRole("SchoolStaff")
        || currentUser.IsInRole("Secretary")
        || currentUser.IsInRole("Teacher");

    /// <summary>Okulun aktif sezonu.</summary>
    public static async Task<Guid?> ResolveActiveSessionIdAsync(
        IApplicationDbContext db, Guid schoolId, CancellationToken ct) =>
        await db.AcademicSessions.AsNoTracking()
            .Where(s => s.SchoolId == schoolId && s.IsActive)
            .Select(s => (Guid?)s.Id)
            .FirstOrDefaultAsync(ct);
}
```

- [ ] **Step 5: Rol kodlarını ve aktif sezon alanını doğrula**

Run:
```bash
grep -rn "\"Teacher\"\|\"SchoolAdmin\"\|\"Secretary\"" src/Oksis.Infrastructure/Persistence/Seed/MasterData/SystemRoleSeedData.cs | head
grep -n "IsActive\|Status" src/Oksis.Domain/Modules/AcademicSessions/Entities/AcademicSession.cs | head
```
Expected: Gerçek rol kodları ve aktif sezon alanı. Farklıysa `AnnouncementCallerResolver`'ı düzelt.

- [ ] **Step 6: Testleri çalıştır**

Run: `dotnet build && dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~GetAudiencePool"`
Expected: PASS

- [ ] **Step 7: Ucu elle doğrula**

```bash
dotnet run --project src/Oksis.Api &
# Yönetici token'ıyla:
curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
  "http://localhost:5000/api/v1/announcements/audience" | jq '.data | keys'
```
Expected: `all`, `role`, `schoolStage`, `gradeLevel`, `section` anahtarları döner.
Öğretmen token'ıyla `all` **null**, `role` **null**, `section` dolu.

- [ ] **Step 8: Commit**

```bash
cd /Users/farukkaya/Repositories/oksis-api
dotnet format
git add src/Oksis.Application/Modules/Announcements/ src/Oksis.Api/Controllers/V1/AnnouncementsController.cs tests/Oksis.Application.UnitTests/
git commit -m "feat(announcements): hedef havuzu ucu ve controller iskeleti eklendi

Havuz izni announcements.create'tir: alici sayilari hassas veridir ve
yalniz duyuru yazarken anlamlidir. Ogretmen SADECE ogretmense havuz
daralir; ayni kisi hem ogretmen hem idareciyse genis havuzu gorur."
```

---

### Task 12: `POST /announcements` + materyalizasyon

Modülün en kritik yazma yolu. **Tek transaction**: hedefi dondur → alıcıyı çöz → satırları
yaz → sayıyı mühürle → olayı yay.

**Files:**
- Create: `src/Oksis.Application/Modules/Announcements/Commands/CreateAnnouncement/CreateAnnouncementCommand.cs`
- Create: `.../CreateAnnouncementCommandValidator.cs`
- Create: `.../CreateAnnouncementCommandHandler.cs`
- Create: `src/Oksis.Application/Modules/Announcements/Common/AnnouncementMapper.cs`
- Modify: `src/Oksis.Api/Controllers/V1/AnnouncementsController.cs`
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/CreateAnnouncementTests.cs`

**Interfaces:**
- Consumes: Task 3–5 entity'leri, Task 8 DTO'ları, Task 10 `IAudienceResolver`, Task 11 `AnnouncementCallerResolver`
- Produces:
  - `CreateAnnouncementCommand(string Title, string Body, IReadOnlyList<AudienceSelectionBody> Audience, IReadOnlyList<string> Channels, string? ScheduledAt, string? ValidUntil, bool Urgent, bool Pinned, bool AsDraft, string? AttachmentFileId) : ICommand<AnnouncementDto>`
  - `AnnouncementMapper.ToDto(Announcement a, IReadOnlyList<AnnouncementTarget> targets, bool? isRead, IReadOnlyList<Guid> childIds, int? seenCount) → AnnouncementDto`
  - Task 13–16 `AnnouncementMapper`'ı kullanır.

> **Moderasyon (eşikli akış) A2 planındadır.** Bu görevde `moderation == open` varsayılır ve
> `asDraft`/`scheduledAt` dışındaki her yayın doğrudan `published` olur. A2 `MarkPendingApproval`
> dalını ekleyecektir — bu yüzden handler'da karar noktası **açık bir yorumla** işaretlenir.

- [ ] **Step 1: Failing integration test yaz**

```csharp
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Oksis.Domain.Modules.Announcements.Entities;
using Oksis.Domain.Modules.Announcements.Enums;
using Xunit;

namespace Oksis.Infrastructure.IntegrationTests.Persistence;

public sealed class CreateAnnouncementTests
{
    [Fact]
    public async Task Should_MaterializeRecipientsAndSealCount_When_PublishedToAllParents()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync();

        var dto = await fixture.CreateAnnouncementAsync(
            title: "Veli toplantısı",
            body: "12 Kasım Salı günü veli toplantısı yapılacaktır.",
            audience: [("all", "all", "parent")],
            asDraft: false);

        dto.Status.Should().Be("published");
        dto.RecipientCount.Should().Be(fixture.AllParentIds.Count);

        var rows = await fixture.Db.AnnouncementRecipients
            .Where(r => r.AnnouncementId == Guid.Parse(dto.Id)).ToListAsync();

        rows.Select(r => r.PersonId).Should().BeEquivalentTo(fixture.AllParentIds);
        rows.Should().OnlyContain(r => !r.IsRead);
    }

    [Fact]
    public async Task Should_FreezeTargetsWithBucket_When_Published()
    {
        // INV-2: hedef yayın anında donar ve kaydın kendisi kime gittiğini anlatır.
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync();

        var dto = await fixture.CreateAnnouncementAsync(
            title: "9-A veli bilgilendirmesi",
            body: "Sınav takvimi güncellenmiştir.",
            audience: [("section", fixture.HighSchoolClassRoomId.ToString(), "parent")],
            asDraft: false);

        var targets = await fixture.Db.AnnouncementTargets
            .Where(t => t.AnnouncementId == Guid.Parse(dto.Id)).ToListAsync();

        targets.Should().ContainSingle();
        targets[0].Bucket.Should().Be(AudienceBucket.Parent);
        targets[0].Dimension.Should().Be(AudienceDimension.Section);
    }

    [Fact]
    public async Task Should_FreezeHumanReadableLabel_When_SectionTargeted()
    {
        // Gövde yalnız (dimension, key, bucket) taşır; `section` katmanında key bir
        // GUID'dir. Etiket havuzdan çözülmezse alıcı yüzeyinde ham kimlik görünür.
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync();

        var dto = await fixture.CreateAnnouncementAsync(
            title: "9-A veli bilgilendirmesi",
            body: "Sınav takvimi güncellenmiştir.",
            audience: [("section", fixture.HighSchoolClassRoomId.ToString(), "parent")],
            asDraft: false);

        var target = await fixture.Db.AnnouncementTargets
            .SingleAsync(t => t.AnnouncementId == Guid.Parse(dto.Id));

        target.Label.Should().NotBe(fixture.HighSchoolClassRoomId.ToString());
        target.Label.Should().Contain("9-A");
        dto.AudienceLabel.Should().Contain("9-A");
    }

    [Fact]
    public async Task Should_NotMaterializeRecipients_When_SavedAsDraft()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync();

        var dto = await fixture.CreateAnnouncementAsync(
            title: "Taslak duyuru",
            body: "Henüz yayınlanmadı.",
            audience: [],
            asDraft: true);

        dto.Status.Should().Be("draft");
        dto.RecipientCount.Should().BeNull();

        var rows = await fixture.Db.AnnouncementRecipients
            .Where(r => r.AnnouncementId == Guid.Parse(dto.Id)).CountAsync();
        rows.Should().Be(0);
    }

    [Fact]
    public async Task Should_WriteAuditEntry_When_Published()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync();

        var dto = await fixture.CreateAnnouncementAsync(
            title: "Servis duyurusu", body: "Servisler 10 dakika erken kalkacaktır.",
            audience: [("all", "all", "parent")], asDraft: false);

        var audit = await fixture.Db.AnnouncementAuditEntries
            .Where(a => a.AnnouncementId == Guid.Parse(dto.Id)).ToListAsync();

        audit.Should().ContainSingle().Which.Action.Should().Contain("yayınladı");
    }

    [Fact]
    public async Task Should_BeScheduledNotPublished_When_ScheduledAtInFuture()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync();

        var dto = await fixture.CreateAnnouncementAsync(
            title: "İleri tarihli duyuru", body: "Gelecek hafta yayınlanacaktır.",
            audience: [("all", "all", "parent")], asDraft: false,
            scheduledAt: DateTimeOffset.UtcNow.AddDays(3).ToString("O"));

        dto.Status.Should().Be("scheduled");

        var rows = await fixture.Db.AnnouncementRecipients
            .Where(r => r.AnnouncementId == Guid.Parse(dto.Id)).CountAsync();
        rows.Should().Be(0, "alıcı YAYIN anında materyalize edilir, zamanlama anında değil");
    }
}
```

- [ ] **Step 2: Testin kırıldığını doğrula**

Run: `dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~CreateAnnouncementTests"`
Expected: FAIL — `CreateAnnouncementAsync` fixture yardımcısı ve komut yok.

- [ ] **Step 3: Komutu ve validator'ı yaz**

```csharp
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Announcements.DTOs;

namespace Oksis.Application.Modules.Announcements.Commands.CreateAnnouncement;

/// <summary>
/// Duyuru oluşturma. Gövde <c>packages/api/.../contract.ts</c> içindeki
/// <c>CreateAnnouncementBody</c> ile birebirdir.
/// </summary>
[Tenancy(TenancyMode.Required)]
[RequirePermission("announcements.create")]
public sealed record CreateAnnouncementCommand(
    string Title,
    string Body,
    IReadOnlyList<AudienceSelectionBody> Audience,
    IReadOnlyList<string> Channels,
    string? ScheduledAt,
    string? ValidUntil,
    bool Urgent,
    bool Pinned,
    bool AsDraft,
    string? AttachmentFileId) : ICommand<AnnouncementDto>;
```

```csharp
using FluentValidation;

namespace Oksis.Application.Modules.Announcements.Commands.CreateAnnouncement;

public sealed class CreateAnnouncementCommandValidator : AbstractValidator<CreateAnnouncementCommand>
{
    public CreateAnnouncementCommandValidator()
    {
        RuleFor(x => x.Title).NotEmpty().Length(3, 90)
            .WithMessage("announcements.errors.title-invalid");

        RuleFor(x => x.Body).NotEmpty().MinimumLength(6)
            .WithMessage("announcements.errors.body-invalid");

        // Taslakta hedef ARANMAZ — hazırlanan duyuru hedefi sonra seçilebilir.
        RuleFor(x => x.Audience).NotEmpty()
            .When(x => !x.AsDraft)
            .WithMessage("announcements.errors.audience-required");
    }
}
```

- [ ] **Step 4: Mapper'ı yaz**

```csharp
using Oksis.Domain.Modules.Announcements.Entities;
using Oksis.Application.Modules.Announcements.DTOs;

namespace Oksis.Application.Modules.Announcements.Common;

/// <summary>Entity → wire DTO. Enum'lar <see cref="AnnouncementEnumWire"/> ile string'e çevrilir.</summary>
public static class AnnouncementMapper
{
    public static AnnouncementDto ToDto(
        Announcement a,
        IReadOnlyList<AnnouncementTarget> targets,
        bool? isRead,
        IReadOnlyList<Guid> childIds,
        int? seenCount) =>
        new()
        {
            Id = a.Id.ToString(),
            Status = AnnouncementEnumWire.ToWire(a.Status),
            Type = AnnouncementEnumWire.ToWire(a.Type),
            Reach = AnnouncementEnumWire.ToWire(a.Reach),
            IsRead = isRead,
            ChildIds = childIds.Select(c => c.ToString()).ToList(),
            Title = a.Title,
            Body = a.Body,
            Urgent = a.Urgent,
            Pinned = a.Pinned,
            Amended = a.Amended,
            AudienceLabel = BuildLabel(targets),
            AudienceDetail = targets.Count == 1 ? targets[0].Label : null,
            RecipientCount = a.RecipientCountSnapshot,
            SeenCount = seenCount,
            PublisherLabel = a.PublisherLabel,
            PublisherRealName = a.PublisherRealName,
            PublisherSignature = a.PublisherSignature,
            PublisherId = a.PublisherId.ToString(),
            PublishedAt = a.PublishedAt?.ToString("O"),
            UpdatedAt = a.UpdatedAt?.ToString("O"),
            ValidUntil = a.ValidUntil?.ToString("O"),
            Channels = a.Channels.Select(AnnouncementEnumWire.ToWire).ToList(),
            Attachment = null, // A3: Documents entegrasyonu
            WithdrawReason = a.WithdrawReason,
        };

    /// <summary>İnsan okunur hedef özeti. Tek hedefte etiketi, çoklu hedefte sayıyı söyler.</summary>
    private static string BuildLabel(IReadOnlyList<AnnouncementTarget> targets) => targets.Count switch
    {
        0 => "Hedef seçilmedi",
        1 => targets[0].Label,
        _ => $"{targets[0].Label} +{targets.Count - 1} hedef",
    };
}
```

- [ ] **Step 5: Handler'ı yaz**

```csharp
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Announcements.Abstractions;
using Oksis.Application.Modules.Announcements.Common;
using Oksis.Application.Modules.Announcements.DTOs;
using Oksis.Domain.Common;
using Oksis.Domain.Modules.Announcements.Entities;
using Oksis.Domain.Modules.Announcements.Enums;
using Oksis.Domain.Modules.Announcements.Exceptions;
using Oksis.Shared;

namespace Oksis.Application.Modules.Announcements.Commands.CreateAnnouncement;

/// <summary>
/// Duyuru oluşturur ve — taslak/zamanlanmış değilse — TEK TRANSACTION içinde yayınlar:
/// hedefleri dondurur (INV-2), alıcıları materyalize eder, sayıyı mühürler, olayı yayar.
///
/// <para><b>Neden senkron:</b> <c>recipientCount</c> yayın cevabında DOĞRU dönmek zorundadır —
/// DYR-F-05'in açık onay adımı bu sayıya dayanır. Fan-out'u Hangfire'a atmak sayıyı geçici
/// olarak yalancı yapardı.</para>
/// </summary>
public sealed class CreateAnnouncementCommandHandler(
    IApplicationDbContext db,
    ITenantContext tenant,
    ICurrentUser currentUser,
    IAudienceResolver resolver,
    IDateTimeProvider clock)
    : ICommandHandler<CreateAnnouncementCommand, AnnouncementDto>
{
    public async Task<Result<AnnouncementDto>> Handle(
        CreateAnnouncementCommand request, CancellationToken cancellationToken)
    {
        if (tenant.CurrentSchoolId is not { } schoolId)
        {
            return Result<AnnouncementDto>.Forbidden();
        }

        var sessionId = await AnnouncementCallerResolver.ResolveActiveSessionIdAsync(db, schoolId, cancellationToken);
        if (sessionId is null)
        {
            return Result<AnnouncementDto>.Failure(
                new Error("Announcements.Session.NotFound", "Aktif sezon bulunamadı."));
        }

        var myPersonId = await AnnouncementCallerResolver.ResolveMyPersonIdAsync(
            db, currentUser.Id, cancellationToken) ?? Guid.Empty;

        var teacherPersonId = await AnnouncementCallerResolver.ResolveTeacherOnlyPersonIdAsync(
            db, currentUser, schoolId, cancellationToken);

        // İmza: öğretmen kendi adına, diğer herkes kurum adına konuşur (KR-06/DYR-K-09).
        // Sekreter yayınlasa bile etiket "Okul Müdürlüğü"dür; gerçek yazar denetim izinde saklanır.
        var (label, signature, type) = await BuildSignatureAsync(
            db, myPersonId, teacherPersonId, cancellationToken);

        var scheduledAt = ParseInstant(request.ScheduledAt);
        var validUntil = ParseInstant(request.ValidUntil);

        Announcement announcement;
        try
        {
            announcement = Announcement.CreateDraft(
                schoolId, sessionId.Value, myPersonId, label, signature,
                await ResolveRealNameAsync(db, myPersonId, cancellationToken),
                type, request.Title, request.Body, request.Urgent, request.Pinned,
                scheduledAt, validUntil,
                request.Channels.Select(AnnouncementEnumWire.ParseChannel).ToList());
        }
        catch (AnnouncementDomainException ex)
        {
            return Result<AnnouncementDto>.Failure(new Error(ex.Code, ex.Message));
        }

        db.Announcements.Add(announcement);

        // Etiket HAVUZDAN çözülür, gövdeden değil. Gövde yalnız (dimension, key, bucket)
        // taşır; `section` katmanında key bir GUID'dir ve doğrudan etiket olarak yazılırsa
        // alıcı yüzeyinde ham kimlik görünürdü. Havuz etiketin tek otoritesidir ve etiket
        // yayın anında donar (INV-2) — şube adı sonradan değişse bile duyuru kime
        // gittiğini kendi kelimeleriyle anlatmaya devam eder.
        var scopeForLabels = new AudienceScope(schoolId, sessionId.Value, teacherPersonId);
        var labels = await BuildLabelMapAsync(resolver, scopeForLabels, cancellationToken);

        var targets = request.Audience
            .Select(s => AnnouncementTarget.Create(
                schoolId, announcement.Id,
                AnnouncementEnumWire.ParseDimension(s.Dimension), s.Key,
                AnnouncementEnumWire.ParseBucket(s.Bucket),
                labels.GetValueOrDefault(($"{s.Dimension}", s.Key), s.Key)))
            .ToList();

        if (request.AsDraft)
        {
            // Taslakta hedef de dondurulmaz — sonradan değiştirilebilir olmalıdır.
            await db.SaveChangesAsync(cancellationToken);
            return Result<AnnouncementDto>.Success(
                AnnouncementMapper.ToDto(announcement, [], null, [], null));
        }

        db.AnnouncementTargets.AddRange(targets);

        if (scheduledAt is { } when && when > clock.UtcNow)
        {
            // Zamanlanmış duyuruda alıcı MATERYALİZE EDİLMEZ — liste yayın anında
            // sabitlenir (DYR-K-15), zamanlama anında değil.
            announcement.MarkScheduled(when);
            await db.SaveChangesAsync(cancellationToken);
            return Result<AnnouncementDto>.Success(
                AnnouncementMapper.ToDto(announcement, targets, null, [], null));
        }

        // A2 GİRİŞ NOKTASI: eşikli moderasyonda öğretmen→veli duyurusu burada
        // announcement.MarkPendingApproval() ile onay kuyruğuna alınacaktır (INV-5).
        // A1 kapsamında moderasyon daima `open` varsayılır.

        var recipients = await resolver.ResolveAsync(
            new AudienceScope(schoolId, sessionId.Value, teacherPersonId),
            request.Audience, cancellationToken);

        db.AnnouncementRecipients.AddRange(recipients.Select(r =>
            AnnouncementRecipient.Create(schoolId, announcement.Id, r.PersonId, r.RoleAtPublish, r.ChildPersonId)));

        var reach = request.Audience.Any(a => a.Dimension is "all" or "role")
            ? AnnouncementReach.SchoolWide
            : AnnouncementReach.ClassScoped;

        announcement.Publish(reach, recipients.Count, clock.UtcNow);

        db.AnnouncementAuditEntries.Add(AnnouncementAuditEntry.Create(
            schoolId, announcement.Id, myPersonId,
            await ResolveRealNameAsync(db, myPersonId, cancellationToken) ?? "Bilinmeyen",
            "duyuruyu yayınladı", clock.UtcNow,
            field: null,
            tag: request.Urgent ? "Acil olarak işaretlendi" : null,
            tone: request.Urgent ? "warning" : null));

        await db.SaveChangesAsync(cancellationToken);

        return Result<AnnouncementDto>.Success(
            AnnouncementMapper.ToDto(announcement, targets, null, [], seenCount: 0));
    }

    private static DateTimeOffset? ParseInstant(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : DateTimeOffset.Parse(value);

    /// <summary>
    /// Havuzdaki her seçeneğin insan okunur etiketini <c>(dimension, key)</c> anahtarıyla
    /// düzleştirir. Tek havuz çağrısıdır — seçim başına ayrı çağrı N+1 üretirdi.
    /// </summary>
    private static async Task<IReadOnlyDictionary<(string Dimension, string Key), string>> BuildLabelMapAsync(
        IAudienceResolver resolver, AudienceScope scope, CancellationToken ct)
    {
        var pool = await resolver.GetPoolAsync(scope, ct);
        var map = new Dictionary<(string, string), string>();

        void Absorb(string dimension, IReadOnlyList<AudienceOptionDto>? options)
        {
            foreach (var option in options ?? [])
            {
                map[(dimension, option.Key)] = option.Label;
            }
        }

        if (pool.All is { } all)
        {
            map[("all", all.Key)] = all.Label;
        }

        Absorb("role", pool.Role);
        Absorb("schoolStage", pool.SchoolStage);
        Absorb("gradeLevel", pool.GradeLevel);
        Absorb("section", pool.Section);
        Absorb("person", pool.Person);
        Absorb("course", pool.Course);

        return map;
    }
}
```

- [ ] **Step 6: `BuildSignatureAsync` ve `ResolveRealNameAsync`'i yaz**

Handler'a ekle:

```csharp
    /// <summary>
    /// İmzayı kurar. Öğretmen kendi adı + branşıyla imzalar (<c>Classroom</c>);
    /// yönetim ve sekreter "Okul Müdürlüğü" ile imzalar (<c>Institutional</c>) —
    /// alıcı yüzeyinde sekreterin adı GÖRÜNMEZ (KR-06).
    /// </summary>
    private static async Task<(string Label, string? Signature, AnnouncementType Type)> BuildSignatureAsync(
        IApplicationDbContext db, Guid myPersonId, Guid? teacherPersonId, CancellationToken ct)
    {
        if (teacherPersonId is null)
        {
            return ("Okul Müdürlüğü", null, AnnouncementType.Institutional);
        }

        var name = await ResolveRealNameAsync(db, myPersonId, ct) ?? "Öğretmen";
        return (name, name, AnnouncementType.Classroom);
    }

    private static async Task<string?> ResolveRealNameAsync(
        IApplicationDbContext db, Guid personId, CancellationToken ct) =>
        await db.Persons.AsNoTracking()
            .Where(p => p.Id == personId)
            .Select(p => p.Name.First + " " + p.Name.Last)
            .FirstOrDefaultAsync(ct);
```

- [ ] **Step 7: `PersonName` alan adlarını doğrula**

Run: `grep -n "public .* { get" src/Oksis.Domain/Modules/Users/ValueObjects/PersonName.cs`
Expected: Gerçek alanlar (`First`/`Last` veya `FirstName`/`LastName`). Koda uyarla.

- [ ] **Step 8: Controller'a ucu ekle**

```csharp
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<AnnouncementDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateAsync(
        [FromBody] CreateAnnouncementCommand command, CancellationToken cancellationToken)
    {
        var result = await sender.Send(command, cancellationToken);
        return result.ToHttpResult(HttpContext);
    }
```

- [ ] **Step 9: Testlerin geçtiğini doğrula**

Run:
```bash
docker compose up -d
dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~CreateAnnouncementTests"
```
Expected: PASS (6 test)

- [ ] **Step 10: Tüm testleri çalıştır**

Run: `dotnet build && dotnet test`
Expected: PASS — regresyon yok.

- [ ] **Step 11: Commit**

```bash
cd /Users/farukkaya/Repositories/oksis-api
dotnet format
git add src/Oksis.Application/Modules/Announcements/ src/Oksis.Api/Controllers/V1/AnnouncementsController.cs tests/Oksis.Infrastructure.IntegrationTests/
git commit -m "feat(announcements): duyuru olusturma ve alici materyalizasyonu eklendi

Tek transaction: hedef donar (INV-2), alici materyalize edilir, sayi
muhurlenir, olay yayilir. Senkron cunku recipientCount yayin cevabinda
DOGRU donmek zorundadir — DYR-F-05'in acik onay adimi ona dayanir.
Zamanlanmis duyuruda alici materyalize EDILMEZ: liste yayin aninda
sabitlenir (DYR-K-15). Imza kurumsaldir, gercek yazar denetim izinde."
```

---

> **Görev 13–18 dördüncü dosyadadır:** `2026-08-02-duyurular-a1-omurga-4.md` —
> envanter listesi, detay, gelen kutusu, okundu damgası, bildirim zinciri ve uçtan uca duman testi.
