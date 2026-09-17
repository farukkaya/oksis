# MEB Müfredatı — Dilim 1 Sürümlü Master ve Sezon Snapshot Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** OKSİS'in geçici `CurriculumVersions.Active` + `CurriculumHourTemplate` çözümünü; eğitim programına ve akademik yıla bağlı sürümlü master müfredat, özel okulun serbest taslak planı ve sezon aktivasyonunda değişmez snapshot mimarisine taşımak. Aktif/geçmiş sezon, daha sonra eklenen master sürümlerden etkilenmeyecek; ders programı ile eksik saat hesabı yalnız snapshot okuyacak.

**Architecture:** Platform genelindeki `EducationProgram → CurriculumVersion → CurriculumEntry` zinciri MEB referansını sürümler. Tenant tarafında `SchoolAcademicProgram`, bir okulun sezon içindeki tek eğitim programını; `SchoolCurriculumDraft`, sınıf seviyesi bazındaki tabanı; override ve ek ders kayıtları okul kararını taşır. `AcademicSession` `Setup → Active` geçişinde master + override + ek dersler tek transaction içinde `SchoolCurriculumSnapshot` ve item'larına materyalize edilir. `Active` ve `Archived` sezonda taslak yazılamaz; ders programı ve toplam saat okuyucuları snapshot dışına çıkmaz. MEB master'ı bulunmayan kademe boş/manual taslak ve snapshot ile devam eder; okul/sezon açılışı bloklanmaz.

**Tech Stack:** .NET 10 / C# 13, EF Core 10 + SQL Server 2022, MediatR, FluentValidation, Mapster, xUnit + FluentAssertions + NSubstitute + Testcontainers.

**Spec:** `docs/teknik-analizler/mufredat/meb-haftalik-ders-cizelgesi-entegrasyonu-tasarimi.md` (onaylı, 2026-09-18). Kapanacak bulgular: `TB-201` (sürümsüz provider duplicate/crash), `TB-202` (sezona pinlenmeyen master geçmişi değiştiriyor); ilerleyecek bulgu: `E-16` (geçici lise verisi resmî değildir).

## Global Constraints

- Bu plan yalnız **Dilim 1** içindir. MEB sayfa/PDF keşfi, ham belge saklama, parser, staging, merkez inceleme/onay uçları ve okul yönetim UI/API'larının yeni sözleşmeleri bu planda uygulanmaz; sırasıyla Dilim 2–4 planlarıdır.
- Kod yalnız `/Users/farukkaya/Repositories/oksis-api` deposuna; plan ve domain notları yalnız `/Users/farukkaya/Repositories/oksis/docs` deposuna yazılır.
- Başlangıç dalı `master`; uygulama dalı `feat/mufredat-surum-snapshot`. Başlangıç commit'i bu plan yazılırken `b7f8baaf` idi; uygulamaya başlarken `origin/master` ile güncellik yeniden doğrulanır.
- Tenant entity'lerin tamamı `TenantEntity`/`IHasTenant`, global query filter ve `TenantSaveChangesInterceptor` korumasında olur. Tenant yolunda `IgnoreQueryFilters()` kullanılmaz.
- Master varlıklar tenant kimliği taşımaz. Dilim 1'de master'a yazan ürün endpoint'i açılmaz; yalnız deterministik seed ve göç verisi vardır.
- Özel okul saat kuralı: `WeeklyHours >= 0`; üst sınır yoktur. Sıfır geçerlidir. MEB toplamına göre alt/üst sınır veya eşitlik kuralı uygulanmaz.
- Aynı okul + akademik sezon + eğitim kademesi için tek `SchoolAcademicProgram` bulunur. Bu, bir okulun aynı yılda birden fazla lise programı kullanmasını veritabanında da engeller.
- Snapshot item'ı oluşturulduktan sonra update/delete edilemez. Bu yalnız “mutator yok” yorumuna bırakılmaz; save interceptor ile korunur.
- Sezon aktivasyonu sırasında snapshot üretimi idempotenttir: aynı tam snapshot kümesi varsa no-op; kısmi küme varsa sessiz tamamlama yapılmaz, conflict döner.
- Aktif/arşiv sezonlarda saat yazma reddedilir. Dönem içi MEB senkronizasyonu, bildirim, erteleme ve cascade yoktur.
- `SeasonDraft`, sezon açılış sihirbazının state kaydı olarak kalır. Yeni `SchoolCurriculumDraft` onun yerine geçmez ve aynı aggregate'e gömülmez.
- `CurriculumHourOption`, `CurriculumSelectionRule`, provenance, belge seti ve parser staging şeması Dilim 2'ye aittir. Dilim 1 master şeması bunların sonradan FK ile eklenebileceği sabit kimlikleri üretir; kullanılmayan tablo önceden açılmaz.
- Mevcut HTTP rotaları bu dilimde korunur. Yeni program seçme/rebase/fark/snapshot yönetim uçları Dilim 4'te açılır. Var olan saat yazma ucu yalnız `Setup` sezondaki müfredat taslağına yazar.
- AutoMapper, repository wrapper, lazy loading, controller `DbContext`, `async void`, `.Result` ve `.Wait()` kullanılmaz.
- Her davranış değişikliği kırmızı test ile başlar. Günlük kapı `./scripts/test-changed.sh`; SQL Server entegrasyonu `./scripts/test-changed.sh --integration`; commit öncesi `dotnet format`.
- Her görev ayrı commit olur. Biçim: `<type>(<scope>): türkçe açıklama`, sonda nokta yok.

---

## Kilitli veri sözleşmesi

### Master

```csharp
public enum CurriculumVersionStatus { Draft, Published, Superseded, Rejected }
public enum CurriculumCourseType { Common, Elective }

public sealed class EducationProgram : MasterEntity
{
    public string Code { get; private set; }
    public string Name { get; private set; }
    public EducationLevel EducationLevel { get; private set; }
    public bool IsDefault { get; private set; }
    public bool IsActive { get; private set; }
}

public sealed class CurriculumVersion : MasterEntity
{
    public Guid EducationProgramId { get; private set; }
    public string Code { get; private set; }
    public string AcademicYearCode { get; private set; }
    public string DecisionNumber { get; private set; }
    public DateOnly? DecisionDate { get; private set; }
    public Guid? SourceDocumentSetId { get; private set; }
    public Guid? SupersedesVersionId { get; private set; }
    public CurriculumVersionStatus Status { get; private set; }
    public DateTimeOffset? PublishedAt { get; private set; }
    public Guid? PublishedBy { get; private set; }
}

public sealed class CurriculumEntry : MasterEntity
{
    public Guid CurriculumVersionId { get; private set; }
    public Guid GradeLevelId { get; private set; }
    public Guid MasterSubjectId { get; private set; }
    public int DefaultWeeklyHours { get; private set; }
    public CurriculumCourseType CourseType { get; private set; }
    public int DisplayOrder { get; private set; }
}
```

`SourceDocumentSetId` Dilim 1'de nullable kalır; Dilim 2 tabloyu eklediğinde gerçek FK kurulur. `Published` sürümün entry kümesi değiştirilemez. Yeni resmî karar yeni `CurriculumVersion` üretir; mevcut satırlar update edilmez.

### Tenant taslak ve snapshot

```csharp
public enum CurriculumSourceType { Master, Manual }

public sealed class SchoolAcademicProgram : TenantEntity
{
    public Guid AcademicSessionId { get; private set; }
    public Guid EducationProgramId { get; private set; }
    public EducationLevel EducationLevel { get; private set; }
}

public sealed class SchoolCurriculumDraft : TenantEntity
{
    public Guid SchoolAcademicProgramId { get; private set; }
    public Guid GradeLevelId { get; private set; }
    public Guid? BaseCurriculumVersionId { get; private set; }
    public CurriculumSourceType SourceType { get; private set; }
}

public sealed class SchoolCurriculumOverride : TenantEntity
{
    public Guid SchoolCurriculumDraftId { get; private set; }
    public Guid CurriculumEntryId { get; private set; }
    public Guid SubjectId { get; private set; }
    public int WeeklyHours { get; private set; }
    public string? Reason { get; private set; }
}

public sealed class SchoolCurriculumCustomCourse : TenantEntity
{
    public Guid SchoolCurriculumDraftId { get; private set; }
    public Guid SubjectId { get; private set; }
    public int WeeklyHours { get; private set; }
    public string? Reason { get; private set; }
}

public sealed class SchoolCurriculumSnapshot : TenantEntity
{
    public Guid SchoolAcademicProgramId { get; private set; }
    public Guid GradeLevelId { get; private set; }
    public Guid? CurriculumVersionId { get; private set; }
    public CurriculumSourceType SourceType { get; private set; }
    public DateTimeOffset LockedAt { get; private set; }
    public Guid LockedBy { get; private set; }
}

public sealed class SchoolCurriculumSnapshotItem : TenantEntity
{
    public Guid SchoolCurriculumSnapshotId { get; private set; }
    public Guid SubjectId { get; private set; }
    public Guid? MasterSubjectId { get; private set; }
    public Guid? SourceCurriculumEntryId { get; private set; }
    public int? MebReferenceHours { get; private set; }
    public int FinalWeeklyHours { get; private set; }
    public bool IsCustomCourse { get; private set; }
}
```

Bir master kataloğu dersi seçili `CurriculumVersion` içinde yoksa okul onu yine ekleyebilir; kayıt `SchoolCurriculumCustomCourse` olur. `IsCustomCourse`, “kaynak curriculum entry yok” anlamına gelir; `MasterSubjectId` bu durumda yine dolu olabilir.

### Çözülmüş satır portları

```csharp
public sealed record ResolvedCurriculumItem(
    Guid GradeLevelId,
    Guid SubjectId,
    Guid? MasterSubjectId,
    Guid? CurriculumEntryId,
    int? MebReferenceHours,
    int FinalWeeklyHours,
    bool IsCustomCourse);

public interface ICurriculumDraftResolver
{
    Task<IReadOnlyList<ResolvedCurriculumItem>> ResolveAsync(
        Guid academicSessionId,
        IReadOnlyCollection<Guid> gradeLevelIds,
        CancellationToken cancellationToken);
}

public interface ICurriculumDraftBootstrapper
{
    Task<Result> EnsureAsync(Guid academicSessionId, CancellationToken cancellationToken);
}

public interface ICurriculumSnapshotMaterializer
{
    Task<Result> MaterializeAsync(
        Guid academicSessionId,
        DateTimeOffset lockedAt,
        Guid lockedBy,
        CancellationToken cancellationToken);
}
```

`ICurriculumDraftResolver` salt okumadır. `EnsureAsync`, `Setup` sezon için okulun aktif kademelerini bulur, her eğitim kademesinde default `EducationProgram` bağını ve her sınıf seviyesi için tek draft'ı idempotent oluşturur. Aynı akademik yıl + program için `Published` master yoksa draft `Manual` ve `BaseCurriculumVersionId = null` olur.

---

## Dosya haritası

### Yeni — Domain

- `src/Oksis.Domain/Modules/Academics/Enums/CurriculumVersionStatus.cs`
- `src/Oksis.Domain/Modules/Academics/Enums/CurriculumCourseType.cs`
- `src/Oksis.Domain/Modules/Academics/Enums/CurriculumSourceType.cs`
- `src/Oksis.Domain/Modules/Academics/Entities/EducationProgram.cs`
- `src/Oksis.Domain/Modules/Academics/Entities/CurriculumVersion.cs`
- `src/Oksis.Domain/Modules/Academics/Entities/CurriculumEntry.cs`
- `src/Oksis.Domain/Modules/Academics/Entities/SchoolAcademicProgram.cs`
- `src/Oksis.Domain/Modules/Academics/Entities/SchoolCurriculumDraft.cs`
- `src/Oksis.Domain/Modules/Academics/Entities/SchoolCurriculumOverride.cs`
- `src/Oksis.Domain/Modules/Academics/Entities/SchoolCurriculumCustomCourse.cs`
- `src/Oksis.Domain/Modules/Academics/Entities/SchoolCurriculumSnapshot.cs`
- `src/Oksis.Domain/Modules/Academics/Entities/SchoolCurriculumSnapshotItem.cs`

### Yeni — Application/Infrastructure

- `src/Oksis.Application/Modules/Academics/Curriculum/ResolvedCurriculumItem.cs`
- `src/Oksis.Application/Modules/Academics/Curriculum/ICurriculumDraftResolver.cs`
- `src/Oksis.Application/Modules/Academics/Curriculum/ICurriculumDraftBootstrapper.cs`
- `src/Oksis.Application/Modules/Academics/Curriculum/ICurriculumSnapshotMaterializer.cs`
- `src/Oksis.Infrastructure/Academics/CurriculumDraftResolver.cs`
- `src/Oksis.Infrastructure/Academics/CurriculumDraftBootstrapper.cs`
- `src/Oksis.Infrastructure/Academics/CurriculumSnapshotMaterializer.cs`
- `src/Oksis.Infrastructure/Persistence/Interceptors/CurriculumSnapshotImmutabilityInterceptor.cs`
- `src/Oksis.Infrastructure/Persistence/Configurations/Academics/EducationProgramConfiguration.cs`
- `src/Oksis.Infrastructure/Persistence/Configurations/Academics/CurriculumVersionConfiguration.cs`
- `src/Oksis.Infrastructure/Persistence/Configurations/Academics/CurriculumEntryConfiguration.cs`
- `src/Oksis.Infrastructure/Persistence/Configurations/Academics/SchoolAcademicProgramConfiguration.cs`
- `src/Oksis.Infrastructure/Persistence/Configurations/Academics/SchoolCurriculumDraftConfiguration.cs`
- `src/Oksis.Infrastructure/Persistence/Configurations/Academics/SchoolCurriculumOverrideConfiguration.cs`
- `src/Oksis.Infrastructure/Persistence/Configurations/Academics/SchoolCurriculumCustomCourseConfiguration.cs`
- `src/Oksis.Infrastructure/Persistence/Configurations/Academics/SchoolCurriculumSnapshotConfiguration.cs`
- `src/Oksis.Infrastructure/Persistence/Configurations/Academics/SchoolCurriculumSnapshotItemConfiguration.cs`
- `src/Oksis.Infrastructure/Persistence/Seed/MasterData/CurriculumProgramSeedData.cs`
- `src/Oksis.Infrastructure/Persistence/Seed/MasterData/CurriculumVersionSeedData.cs`
- `src/Oksis.Infrastructure/Persistence/Seed/MasterData/CurriculumEntrySeedData.cs`
- `src/Oksis.Infrastructure/Persistence/Migrations/*_20260918_curriculum_version_schema.cs` (+ designer ve snapshot; timestamp'i EF üretir)
- `src/Oksis.Infrastructure/Persistence/Migrations/*_20260918_curriculum_version_cutover.cs` (+ designer ve snapshot; timestamp'i EF üretir)

### Değişecek

- `src/Oksis.Application/Common/Abstractions/IApplicationDbContext.cs`
- `src/Oksis.Infrastructure/Persistence/OksisDbContext.cs`
- `src/Oksis.Infrastructure/DependencyInjection.cs`
- `src/Oksis.Application/Modules/AcademicSessions/Commands/CreateAcademicSession/CreateAcademicSessionCommandHandler.cs`
- `src/Oksis.Application/Modules/AcademicSessions/Commands/OpenSeasonFromDraft/OpenSeasonFromDraftCommandHandler.cs`
- `src/Oksis.Application/Modules/AcademicSessions/Commands/ActivateAcademicSession/ActivateAcademicSessionCommandHandler.cs`
- `src/Oksis.Application/Modules/AcademicSessions/Commands/ActivateSeasonRollover/ActivateSeasonRolloverCommandHandler.cs`
- `src/Oksis.Application/Modules/Academics/Curriculum/Commands/SetSubjectWeeklyHours/SetSubjectWeeklyHoursCommandHandler.cs`
- `src/Oksis.Application/Modules/Academics/Curriculum/Commands/SetSubjectWeeklyHours/SetSubjectWeeklyHoursCommandValidator.cs`
- `src/Oksis.Application/Modules/Academics/Curriculum/Queries/GetCatalogWeeklyHours/GetCatalogWeeklyHoursQueryHandler.cs`
- `src/Oksis.Application/Modules/Academics/Curriculum/Queries/GetSubjectWeeklyHours/GetSubjectWeeklyHoursQueryHandler.cs`
- `src/Oksis.Infrastructure/Academics/RequiredHoursResolver.cs`
- `src/Oksis.Infrastructure/Timetable/CurriculumWeeklyHourProvider.cs`
- `src/Oksis.Application/Modules/Academics/Internal/SubjectUsageInspector.cs`
- `tests/Oksis.Tests/Architecture/SubjectUsageCoverageTests.cs`
- `tests/Oksis.Tests/Architecture/SubjectCatalogTranslationTests.cs`
- ilgili mevcut unit test dosyaları

### Kaldırılacak — geçiş tamamlanınca

- `src/Oksis.Domain/Modules/Academics/CurriculumVersions.cs`
- `src/Oksis.Domain/Modules/Academics/Entities/CurriculumHourTemplate.cs`
- `src/Oksis.Domain/Modules/Academics/Entities/SchoolWeeklyHourOverride.cs`
- `src/Oksis.Infrastructure/Persistence/Configurations/Academics/CurriculumHourTemplateConfiguration.cs`
- `src/Oksis.Infrastructure/Persistence/Configurations/Academics/SchoolWeeklyHourOverrideConfiguration.cs`
- `src/Oksis.Infrastructure/Persistence/Seed/MasterData/CurriculumHourSeedData.cs`
- eski entity'lere ait domain testleri; aynı kurallar yeni entity testlerine taşınır

---

## Task 0: Başlangıç güvenlik ağı ve dal

**Files:** Değişiklik yok.

- [ ] **Step 1: Çalışma alanının temiz olduğunu doğrula**

Run:

```bash
git status --short
git fetch origin
git rev-parse HEAD
git rev-parse origin/master
```

Expected: çalışma alanı boş. `HEAD != origin/master` ise kullanıcı değişikliği yokken önce fast-forward et; kirli çalışma alanını resetleme/stash'leme.

- [ ] **Step 2: Uygulama dalını aç**

```bash
git switch -c feat/mufredat-surum-snapshot
```

- [ ] **Step 3: Mevcut kapıları ölç**

```bash
./scripts/test-changed.sh --all
git status --short
```

Expected: testler yeşil; testlerin bıraktığı tracked değişiklik yok.

---

## Task 1: Sürümlü master domain modeli

**Files:**
- Create: master enum/entity dosyaları (dosya haritasındaki ilk 6 dosya)
- Test: `tests/Oksis.Domain.UnitTests/Modules/Academics/CurriculumVersionTests.cs`
- Test: `tests/Oksis.Domain.UnitTests/Modules/Academics/CurriculumEntryTests.cs`
- Test: `tests/Oksis.Domain.UnitTests/Modules/Academics/EducationProgramTests.cs`

**Interfaces:**
- `EducationProgram.Create(Guid id, string code, string name, EducationLevel level, bool isDefault)`.
- `CurriculumVersion.CreateDraft(Guid id, Guid programId, string code, string academicYearCode, string decisionNumber, DateOnly? decisionDate, Guid? documentSetId, Guid? supersedesVersionId)`.
- `CurriculumVersion.Publish(DateTimeOffset now, Guid actorId)` yalnız `Draft → Published`.
- `CurriculumVersion.Supersede()` yalnız `Published → Superseded`.
- `CurriculumVersion.Reject()` yalnız `Draft → Rejected`.
- `CurriculumEntry.Create(Guid id, Guid versionId, Guid gradeLevelId, Guid masterSubjectId, int defaultWeeklyHours, CurriculumCourseType type, int displayOrder)`; master saati `> 0`.

- [ ] **Step 1: Domain testlerini kırmızı yaz**

Testler en az şunları ölçsün:

```csharp
[Fact]
public void Draft_can_be_published_once()
{
    var version = CurriculumVersion.CreateDraft(
        Guid.NewGuid(), Guid.NewGuid(), "2026.01-ANADOLU", "2026-2027",
        "2026/01", new DateOnly(2026, 6, 1), null, null);

    version.Publish(Now, ActorId);

    version.Status.Should().Be(CurriculumVersionStatus.Published);
    version.PublishedAt.Should().Be(Now);
    version.PublishedBy.Should().Be(ActorId);
    var second = () => version.Publish(Now.AddMinutes(1), ActorId);
    second.Should().Throw<AcademicsDomainException>();
}

[Theory]
[InlineData(0)]
[InlineData(-1)]
public void Master_entry_rejects_non_positive_hours(int hours)
{
    var act = () => CurriculumEntry.Create(
        Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(),
        hours, CurriculumCourseType.Common, 10);

    act.Should().Throw<AcademicsDomainException>();
}
```

Ayrıca boş program/version/grade/subject ID, boş kod/yıl, duplicate yayın ve published sürümden reject test edilir.

- [ ] **Step 2: Testin derlenmediğini gör**

```bash
dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~CurriculumVersionTests|FullyQualifiedName~CurriculumEntryTests|FullyQualifiedName~EducationProgramTests"
```

Expected: yeni tipler olmadığı için compile failure.

- [ ] **Step 3: Minimum domain modelini uygula**

Kurallar:

- Kodlar `Trim().ToUpperInvariant()` ile normalize edilir.
- `AcademicYearCode` `YYYY-YYYY` biçimini regex ile değil, `TryParse` eden küçük bir domain guard ile doğrular; ikinci yıl ilk yıl + 1 olmalıdır.
- `SourceDocumentSetId` Dilim 1'de yalnız saklanan nullable kimliktir; navigation yoktur.
- `CurriculumVersion` entry koleksiyonu taşımaz; başka aggregate'e yalnız ID ile referans kuralı korunur.
- Published içeriğin değişmezliği private setter + durum geçişleriyle korunur; entry için update metodu yazılmaz.

- [ ] **Step 4: Domain testlerini yeşile getir**

```bash
dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~CurriculumVersionTests|FullyQualifiedName~CurriculumEntryTests|FullyQualifiedName~EducationProgramTests"
```

Expected: green.

- [ ] **Step 5: Commit**

```bash
git add src/Oksis.Domain tests/Oksis.Domain.UnitTests/Modules/Academics
git commit -m "feat(academics): sürümlü master müfredat modelini ekle"
```

---

## Task 2: Tenant taslak, override, ek ders ve değişmez snapshot domain modeli

**Files:**
- Create: tenant enum/entity dosyaları (kilitli veri sözleşmesindeki 7 entity + `CurriculumSourceType`)
- Test: `tests/Oksis.Domain.UnitTests/Modules/Academics/SchoolCurriculumDraftTests.cs`
- Test: `tests/Oksis.Domain.UnitTests/Modules/Academics/SchoolCurriculumOverrideTests.cs`
- Test: `tests/Oksis.Domain.UnitTests/Modules/Academics/SchoolCurriculumSnapshotTests.cs`

**Interfaces:**
- `SchoolAcademicProgram.Create(Guid schoolId, Guid sessionId, Guid programId, EducationLevel level)`.
- `SchoolCurriculumDraft.Create(Guid schoolId, Guid schoolProgramId, Guid gradeLevelId, Guid? baseVersionId)`; version null ise `SourceType.Manual`, doluysa `Master`.
- `SchoolCurriculumDraft.Rebase(Guid newVersionId)` yalnız taslak use case'inde çağrılacak; bu dilimde yalnız domain primitive'i, rebase akışı Dilim 4.
- `SchoolCurriculumOverride.Create(Guid schoolId, Guid draftId, Guid entryId, Guid subjectId, int weeklyHours, string? reason)` ve `UpdateHours(int weeklyHours, string? reason)`; yalnız negatif reddedilir.
- `SchoolCurriculumCustomCourse.Create(Guid schoolId, Guid draftId, Guid subjectId, int weeklyHours, string? reason)`; sıfır satır oluşturulmaz, handler sıfır isteğinde kaydı siler.
- `SchoolCurriculumSnapshot.Create(Guid schoolId, Guid schoolProgramId, Guid gradeLevelId, Guid? curriculumVersionId, CurriculumSourceType sourceType, DateTimeOffset lockedAt, Guid lockedBy)`.
- `SchoolCurriculumSnapshotItem.Create(Guid schoolId, Guid snapshotId, Guid subjectId, Guid? masterSubjectId, Guid? sourceEntryId, int? mebReferenceHours, int finalWeeklyHours, bool isCustomCourse)`; negatif final saat reddedilir, MEB referans saati null veya pozitiftir.

- [ ] **Step 1: Serbest override ve snapshot testlerini kırmızı yaz**

Özellikle kullanıcı kararını kilitleyen testler:

```csharp
[Theory]
[InlineData(0)]
[InlineData(41)]
[InlineData(120)]
public void Override_accepts_any_non_negative_hour(int hours)
{
    var row = SchoolCurriculumOverride.Create(
        SchoolId, DraftId, EntryId, SubjectId, hours, "Okul planı");

    row.WeeklyHours.Should().Be(hours);
}

[Fact]
public void Manual_draft_has_no_base_version()
{
    var draft = SchoolCurriculumDraft.Create(SchoolId, ProgramId, GradeId, null);
    draft.SourceType.Should().Be(CurriculumSourceType.Manual);
    draft.BaseCurriculumVersionId.Should().BeNull();
}

[Fact]
public void Snapshot_item_preserves_reference_and_final_hours_separately()
{
    var item = SchoolCurriculumSnapshotItem.Create(
        SchoolId, SnapshotId, SubjectId, MasterSubjectId, EntryId,
        mebReferenceHours: 2, finalWeeklyHours: 0, isCustomCourse: false);

    item.MebReferenceHours.Should().Be(2);
    item.FinalWeeklyHours.Should().Be(0);
}
```

- [ ] **Step 2: Kırmızıyı gör**

```bash
dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~SchoolCurriculum"
```

Expected: compile failure.

- [ ] **Step 3: Minimum entity'leri uygula**

Tüm tenant entity factory'leri `schoolId`, zorunlu yabancı kimlikler ve saat invariant'ını doğrular. `Reason` trim edilir, maksimum uzunluk domain'de değil EF/validator'da 500 olarak korunur. Snapshot ve item entity'lerine update/deactivate/delete mutator'ı eklenmez.

- [ ] **Step 4: Testleri yeşile getir**

```bash
dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~SchoolCurriculum"
```

- [ ] **Step 5: Commit**

```bash
git add src/Oksis.Domain tests/Oksis.Domain.UnitTests/Modules/Academics
git commit -m "feat(academics): okul müfredat taslağı ve snapshot modelini ekle"
```

---

## Task 3: EF modeli, tenant kısıtları ve deterministik master seed

**Files:**
- Create: dosya haritasındaki 8 configuration dosyası
- Create: `CurriculumProgramSeedData.cs`, `CurriculumVersionSeedData.cs`, `CurriculumEntrySeedData.cs`
- Modify: `MasterSeedIds.cs`
- Modify: `IApplicationDbContext.cs`, `OksisDbContext.cs`
- Test: `tests/Oksis.Tests/Architecture/CurriculumModelGuardTests.cs`
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/CurriculumTenantIsolationTests.cs`

**DbSets:**

```csharp
DbSet<EducationProgram> EducationPrograms { get; }
DbSet<CurriculumVersion> CurriculumVersions { get; }
DbSet<CurriculumEntry> CurriculumEntries { get; }
DbSet<SchoolAcademicProgram> SchoolAcademicPrograms { get; }
DbSet<SchoolCurriculumDraft> SchoolCurriculumDrafts { get; }
DbSet<SchoolCurriculumOverride> SchoolCurriculumOverrides { get; }
DbSet<SchoolCurriculumCustomCourse> SchoolCurriculumCustomCourses { get; }
DbSet<SchoolCurriculumSnapshot> SchoolCurriculumSnapshots { get; }
DbSet<SchoolCurriculumSnapshotItem> SchoolCurriculumSnapshotItems { get; }
```

**Tablo ve indeksler:**

| Tablo | Şema | Zorunlu tekillik |
|---|---|---|
| `education_programs` | `master` | `code`; ayrıca `education_level` için yalnız bir `is_default=1 AND is_deleted=0` |
| `curriculum_versions` | `master` | `(education_program_id, academic_year_code, code)` |
| `curriculum_entries` | `master` | `(curriculum_version_id, grade_level_id, master_subject_id)` |
| `school_academic_programs` | `academic` | `(school_id, academic_session_id, education_level)` |
| `school_curriculum_drafts` | `academic` | `(school_id, school_academic_program_id, grade_level_id)` |
| `school_curriculum_overrides` | `academic` | `(school_id, school_curriculum_draft_id, curriculum_entry_id)` |
| `school_curriculum_custom_courses` | `academic` | `(school_id, school_curriculum_draft_id, subject_id)` |
| `school_curriculum_snapshots` | `academic` | `(school_id, school_academic_program_id, grade_level_id)` |
| `school_curriculum_snapshot_items` | `academic` | `(school_id, school_curriculum_snapshot_id, subject_id)` |

Tüm unique indeksler soft-delete filtresi taşır. Master FK'ler ve tenant aggregate-arası FK'ler `DeleteBehavior.Restrict`; snapshot item → snapshot `Cascade` değil `Restrict` olur, çünkü snapshot silinmez.

- [ ] **Step 1: Model guard testini kırmızı yaz**

`CurriculumModelGuardTests`, EF metadata üzerinden şunları assert etsin:

- tenant tiplerin hepsi `IHasTenant`;
- beklenen schema/table adı;
- yukarıdaki unique index property sırası ve filtre;
- snapshot item `FinalWeeklyHours` required;
- `SchoolCurriculumDraft.BaseCurriculumVersionId` nullable;
- `SchoolCurriculumSnapshot.CurriculumVersionId` nullable;
- `CurriculumVersion.SourceDocumentSetId` FK değil (Dilim 2 gelene kadar scalar).

Run:

```bash
dotnet test tests/Oksis.Tests --filter FullyQualifiedName~CurriculumModelGuardTests
```

Expected: DbSet/configuration olmadığı için compile veya assertion failure.

- [ ] **Step 2: Configuration ve DbSet'leri ekle**

Audit, soft-delete, rowversion ve `DomainEvents` ignore kalıbını mevcut `SchoolWeeklyHourOverrideConfiguration` ve `CurriculumHourTemplateConfiguration` ile aynı kur. `builder.ToMasterTable(...)` / `builder.ToAcademicTable(...)` dışında `ToTable` kullanma.

- [ ] **Step 3: Deterministik seed'i kur**

`MasterSeedIds` altına dört default program kimliği ekle:

```text
curriculum-program:PRESCHOOL-GENERAL
curriculum-program:PRIMARY-GENERAL
curriculum-program:MIDDLE-GENERAL
curriculum-program:HIGH-PROVISIONAL
```

`CurriculumProgramSeedData` her `EducationLevel` için bir default program üretir. `MIDDLE-GENERAL` ve `HIGH-PROVISIONAL` için mevcut `2025.04` satırlarını iki ayrı `CurriculumVersion` altında taşır. Kodlar sırasıyla `LEGACY-2025.04-MIDDLE` ve `LEGACY-2025.04-HIGH`; karar metni mevcut dürüst etiketleri korur. `AcademicYearCode` mevcut uyumluluk sürümü için `2025-2026` olur. Bu seed'in resmî onaylı MEB verisi olmadığı lise sürüm adında ve `DecisionNumber` değerinde görünür; gerçek TTKB verisi Dilim 2–3'te yeni sürüm olarak eklenir.

`CurriculumEntrySeedData`, eski `CurriculumHourSeedData` dağılımlarını `GradeLevelId` ve `MasterSubjectId` ile üretir. Yeni `Id` deterministik olarak `curriculum-entry:{versionId}:{gradeId}:{masterSubjectId}` girdisinden çıkar.

- [ ] **Step 4: Seed bütünlük testini yeni modele geçir**

`tests/Oksis.Tests/Modules/Academics/CurriculumIntersectionTests.cs` artık `CurriculumEntrySeedData` okuyacak. Şunları koru:

- her entry'nin `MasterSubjectGradeLevel` karşılığı var;
- seed edilen her sınıfın toplamı en az 25;
- `(version, grade, subject)` duplicate değil;
- lise sürümünün karar metni resmî karar gibi davranmıyor.

- [ ] **Step 5: Tenant izolasyonu entegrasyon testini yaz**

`CurriculumTenantIsolationTests` iki okul context'i açsın. Tenant A program/draft/override/snapshot ekledikten sonra Tenant B'nin her yeni tenant DbSet'inde `CountAsync() == 0` olduğunu ve B context'iyle A `SchoolId` yazmanın `SecurityException` verdiğini ölçsün.

```bash
dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter FullyQualifiedName~CurriculumTenantIsolationTests
```

Expected: green after model implementation; SQL Server Docker gerekir.

- [ ] **Step 6: Expand migration'ını üret ve incele**

```bash
dotnet ef migrations add 20260918_curriculum_version_schema \
  --project src/Oksis.Infrastructure \
  --startup-project src/Oksis.Api
dotnet test tests/Oksis.Tests --filter FullyQualifiedName~MigrationsMatchModelTests
```

Migration yalnız yeni tabloları, seed satırlarını, FK ve indeksleri ekler; legacy `master.curriculum_hour_templates` ile `academic.school_weekly_hour_overrides` tablolarına dokunmaz. Expected: model/migration bekçisi green.

- [ ] **Step 7: Commit**

```bash
git add src/Oksis.Application/Common/Abstractions src/Oksis.Infrastructure/Persistence src/Oksis.Infrastructure/Persistence/Seed tests/Oksis.Tests tests/Oksis.Infrastructure.IntegrationTests
git commit -m "feat(academics): müfredat master ve tenant tablolarını yapılandır"
```

---

## Task 4: Taslak bootstrap ve katmanlı resolver

**Files:**
- Create: `ResolvedCurriculumItem.cs`, üç porttan `ICurriculumDraftResolver` ve `ICurriculumDraftBootstrapper`
- Create: `CurriculumDraftResolver.cs`, `CurriculumDraftBootstrapper.cs`
- Modify: `DependencyInjection.cs`
- Modify: `CreateAcademicSessionCommandHandler.cs`
- Modify: `OpenSeasonFromDraftCommandHandler.cs`
- Test: `tests/Oksis.Application.UnitTests/Modules/Academics/CurriculumDraftResolverTests.cs`
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/CurriculumDraftBootstrapperTests.cs`
- Test: mevcut Create/OpenSeason handler testleri

**Resolver precedence:**

```text
SchoolCurriculumOverride.WeeklyHours
    > CurriculumEntry.DefaultWeeklyHours

SchoolCurriculumCustomCourse.WeeklyHours
    = kaynaksız ek satır
```

Master entry'nin okul kataloğundaki karşılığı `Subject.MasterSubjectId` ile çözülür. Okul kataloğunda karşılığı olmayan master entry snapshot'a “hayalet ders” olarak yazılmaz; bootstrap önce `SubjectCatalogImporter.ImportAsync` çağırarak eksik master dersleri ve kademe bağlarını idempotent tamamlar.

- [ ] **Step 1: Resolver unit testlerini kırmızı yaz**

Senaryolar:

1. master 2 saat, override yok → final 2;
2. master 2, override 0 → final 0;
3. master 2, override 8 → final 8;
4. master toplamı 30 iken override toplamı 3 veya 90 → resolver aynen döndürür;
5. tenant custom subject 5 saat → `CurriculumEntryId/MebReferenceHours` null, `IsCustomCourse=true`;
6. manuel draft + iki custom course → yalnız custom satırlar;
7. başka sınıf seviyesinin satırı sızmaz.

```bash
dotnet test tests/Oksis.Application.UnitTests --filter FullyQualifiedName~CurriculumDraftResolverTests
```

Expected: port/implementation yokken compile failure.

- [ ] **Step 2: Bootstrapper entegrasyon testlerini kırmızı yaz**

Senaryolar:

- ortaokul + lise kademeleri açık okulda aynı session için iki `SchoolAcademicProgram`, kademe başına bir draft;
- aynı session için ikinci çağrı duplicate üretmez;
- lise için ikinci program satırı unique index'e takılır;
- eşleşen published sürüm yoksa manual draft oluşur ve session açılışı başarıyla devam eder;
- master dersler okul kataloğuna daha önce alınmamışsa bootstrap sonrası `Subject` + `SubjectGradeLevel` oluşur.

- [ ] **Step 3: Bootstrapper'ı uygula**

Algoritma:

1. Session'ı `Setup` durumuyla yükle; yoksa NotFound, aktif/arşivse Conflict.
2. `SubjectCatalogImporter.ImportAsync` çağır. Bu helper kendi `SaveChangesAsync` çağrısını yapar; çağrı command transaction'ı içindedir.
3. Okulun aktif `SchoolGradeLevel` satırlarını `GradeLevel` ile join et ve `EducationLevel` bazında grupla.
4. Her level için `EducationProgram.IsDefault && IsActive` programını bul; yoksa `CURRICULUM_DEFAULT_PROGRAM_MISSING` failure.
5. `(session, level)` program satırını idempotent oluştur.
6. Session adıyla eşleşen `Published` curriculum version'ı seç. Birden fazla varsa hata; yoksa manual.
7. Her grade için draft'ı idempotent oluştur.
8. Tek `SaveChangesAsync` ile program/draft kayıtlarını yaz.

Bootstrapper seçiminde sabit “aktif sürüm” kullanılmaz.

- [ ] **Step 4: Sezon oluşturma yollarına bağla**

`CreateAcademicSessionCommandHandler` ve `OpenSeasonFromDraftCommandHandler`, `AcademicSession` ID üretildikten ve context'e eklendikten sonra `EnsureAsync(session.Id)` çağırır. Bootstrapper tracked, henüz kaydedilmemiş session'ı göremeyeceği için bu iki handler'da session ilk `SaveChangesAsync` ile yazılır; command transaction'ı bütün akışı atomik tutar. Bootstrap failure olursa dış transaction rollback eder.

Doğrudan handler unit testlerinde transaction behavior olmadığı için “bootstrap failure'da session kalmaz” iddiası unit testte yapılmaz; bu atomiklik MediatR üzerinden SQL Server entegrasyon testinde ölçülür.

- [ ] **Step 5: Resolver'ı uygula ve DI'a kaydet**

```csharp
services.AddScoped<ICurriculumDraftBootstrapper, CurriculumDraftBootstrapper>();
services.AddScoped<ICurriculumDraftResolver, CurriculumDraftResolver>();
```

Resolver tüm sorgularında `AsNoTracking()` kullanır; tenant filtreyi bypass etmez.

- [ ] **Step 6: Testleri yeşile getir**

```bash
dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~CurriculumDraftResolverTests|FullyQualifiedName~CreateAcademicSession|FullyQualifiedName~OpenSeasonFromDraft"
dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter FullyQualifiedName~CurriculumDraftBootstrapperTests
```

- [ ] **Step 7: Commit**

```bash
git add src/Oksis.Application src/Oksis.Infrastructure tests/Oksis.Application.UnitTests tests/Oksis.Infrastructure.IntegrationTests
git commit -m "feat(academics): sezon müfredat taslağını otomatik hazırla"
```

---

## Task 5: Mevcut saat yazma ve okuma uçlarını yeni taslağa geçir

**Files:**
- Modify: `SetSubjectWeeklyHoursCommandHandler.cs`, validator ve testleri
- Modify: `GetCatalogWeeklyHoursQueryHandler.cs` ve testleri
- Modify: `GetSubjectWeeklyHoursQueryHandler.cs` ve testleri
- Modify: `SubjectUsageInspector.cs`, `SubjectUsageCoverageTests.cs`

**Compatibility contract:** HTTP gövdesi bu dilimde değişmez. `SessionId` gönderilirse o session kullanılır. `SessionId=null` ise önce tenant'ın tek `Setup` session'ı aranır; yoksa mevcut `IsCurrent` session yalnız okumada kullanılabilir. Yazmada aktif session'a fallback yapılmaz ve `CURRICULUM_DRAFT_SESSION_REQUIRED` conflict döner.

- [ ] **Step 1: Validator testini yeni serbest saate çevir**

`SetSubjectWeeklyHoursCommandValidatorTests`:

- `-1` geçersiz;
- `0`, `41`, `120` geçerli;
- duplicate kademe ve boş kod hâlâ geçersiz.

Run ve kırmızıyı gör:

```bash
dotnet test tests/Oksis.Application.UnitTests --filter FullyQualifiedName~SetSubjectWeeklyHoursCommandValidatorTests
```

Expected: 41/120 mevcut `InclusiveBetween(0,40)` nedeniyle failure.

- [ ] **Step 2: Handler testlerini yeni modele taşı**

Her test setup session + `SchoolAcademicProgram` + grade draft kurar. Şunları ölç:

- master entry'den farklı saat override upsert eder;
- master saatine dönünce override siler;
- custom school subject için pozitif saat custom-course upsert eder;
- custom satırda 0 kayıt siler / kayıt yoksa no-op;
- active veya archived session yazması conflict;
- subject'in seçili grade bağı yoksa conflict;
- başka tenant satırı global filter ile görünmez.

- [ ] **Step 3: Yazma handler'ını uygula**

Master-sourced subject için draft'ın base version'ındaki `(GradeLevelId, MasterSubjectId)` entry aranır. Entry varsa `SchoolCurriculumOverride`, yoksa `SchoolCurriculumCustomCourse` yolu kullanılır. Saat master ile aynıysa override silinir; custom saat 0 ise custom satır silinir. `WeeklyHours` için yalnız `GreaterThanOrEqualTo(0)` validator'ı kalır.

- [ ] **Step 4: Okuma query'lerini resolver/snapshot ayrımına geçir**

- Session `Setup`: `ICurriculumDraftResolver`.
- Session `Active` veya `Archived`: `SchoolCurriculumSnapshotItem`.
- Session bulunamazsa mevcut NotFound/Conflict sözleşmesini koru.
- DTO'daki legacy version string gerekiyorsa snapshot'ta `CurriculumVersion.Code`, manual'da `"MANUAL"` dön; `CurriculumVersions.Active` sabitini kullanma.

- [ ] **Step 5: Ders silme kapısını güncelle**

`SubjectUsageInspector.CoveredConsumers` ve `FindBlockingUsagesAsync` şu canlı tenant kullanımlarını bilsin:

- `SchoolCurriculumOverride.SubjectId`
- `SchoolCurriculumCustomCourse.SubjectId`
- Aktif/geçmiş kanıt olan `SchoolCurriculumSnapshotItem`, `SubjectUsageCoverageTests._historicalLogTypes` listesine gerekçesiyle girsin; snapshot geçmişi silmeyi sonsuza kadar bloklamasın.
- `CurriculumEntry` master katalog tanımıdır ve `_catalogDefinitionTypes` listesine girsin.

- [ ] **Step 6: Testleri yeşile getir**

```bash
dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~SetSubjectWeeklyHours|FullyQualifiedName~GetCatalogWeeklyHours|FullyQualifiedName~GetSubjectWeeklyHours"
dotnet test tests/Oksis.Tests --filter "FullyQualifiedName~SubjectUsageCoverageTests"
```

- [ ] **Step 7: Commit**

```bash
git add src/Oksis.Application tests/Oksis.Application.UnitTests tests/Oksis.Tests
git commit -m "feat(academics): haftalık saat uçlarını sezon taslağına geçir"
```

---

## Task 6: Snapshot materializer, immutability ve sezon aktivasyonu

**Files:**
- Create: `ICurriculumSnapshotMaterializer.cs`, `CurriculumSnapshotMaterializer.cs`
- Create: `CurriculumSnapshotImmutabilityInterceptor.cs`
- Modify: `DependencyInjection.cs`
- Modify: `ActivateAcademicSessionCommandHandler.cs`
- Modify: `ActivateSeasonRolloverCommandHandler.cs` (constructor wiring/test setup)
- Test: `tests/Oksis.Application.UnitTests/Modules/AcademicSessions/Commands/ActivateAcademicSessionCommandHandlerTests.cs`
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/CurriculumSnapshotActivationTests.cs`
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/CurriculumSnapshotImmutabilityTests.cs`

- [ ] **Step 1: Aktivasyon unit testini kırmızı genişlet**

`BuildSut` bir `ICurriculumSnapshotMaterializer` substitute alır. Testler:

- materializer success olmadan `target.Activate` çağrılmaz;
- materializer conflict dönerse target `Setup` kalır ve final activation save çalışmaz;
- success'te materializer tam bir kez `target.Id`, `clock.UtcNow`, `ICurrentUser.Id` ile çağrılır;
- zaten active session idempotent çağrısında ikinci materialization istenmez.

- [ ] **Step 2: SQL Server aktivasyon testlerini kırmızı yaz**

`CurriculumSnapshotActivationTests` gerçek MediatR/pipeline üzerinden şunları ölçsün:

1. master 2 + override 0 + custom 5 → snapshot item final değerleri 0 ve 5;
2. aktivasyon tekrarında snapshot ve item count değişmez;
3. birden fazla sınıf seviyesi ayrı snapshot üretir;
4. master bulunmayan manual draft boş snapshot üretir ve aktivasyonu engellemez;
5. materializer'ın ikinci grade'de bilinçli failure'ı transaction'ı rollback eder: session `Setup`, snapshot count 0;
6. aktivasyon sonrası yeni `CurriculumVersion/Entry` eklemek eski snapshot sonucunu değiştirmez.

- [ ] **Step 3: Materializer'ı uygula**

Algoritma:

1. Session'ı ve status'ü kontrol et; yalnız `Setup` materialize edilir.
2. `ICurriculumDraftBootstrapper.EnsureAsync` ile legacy/doğrudan oluşturulmuş setup session savunmasını tamamla.
3. Program + draft + aktif school grade setini yükle.
4. Beklenen snapshot anahtarlarını `(SchoolAcademicProgramId, GradeLevelId)` olarak hesapla.
5. Hiç snapshot yoksa devam et. Var olan anahtar kümesi beklenenle birebir aynıysa idempotent success. Alt/üst küme ise `CURRICULUM_SNAPSHOT_PARTIAL` conflict.
6. Her draft için resolver sonucunu al; final saati sıfır olan item'ı da snapshot'a yaz. Sıfır satır çalışma zamanı provider'ında elenir ama tarihsel okul kararını korur.
7. Snapshot ve item'ları context'e ekle; materializer `SaveChangesAsync` çağırmaz.

- [ ] **Step 4: Aktivasyon handler'ına doğru sırada bağla**

Mevcut filtered unique index nedeniyle önceki sezon arşivlenip ilk `SaveChangesAsync` yapılmaya devam eder. Ardından:

```text
archive previous + SaveChanges
→ materializer adds snapshot graph (SaveChanges YOK)
→ target.Activate + due term start
→ final SaveChanges (snapshot + target activation birlikte)
```

Gerçek command MediatR `TransactionBehavior` içinde olduğu için iki save tek dış transaction'dadır. `ActivateSeasonRolloverCommandHandler`, alt handler'ı doğrudan kurduğu için yeni `ICurriculumSnapshotMaterializer` ve `ICurrentUser` bağımlılıklarını constructor'dan geçirir; nested `ISender` eklenmez.

- [ ] **Step 5: Snapshot immutability interceptor'ını uygula**

`SavingChangesAsync` sırasında `SchoolCurriculumSnapshot` veya `SchoolCurriculumSnapshotItem` entry state'i `Modified` ya da `Deleted` ise `InvalidOperationException("Curriculum snapshots are immutable.")` fırlatır. Interceptor sırası:

```text
TenantSaveChangesInterceptor
→ StudentClassroomSyncInterceptor
→ CurriculumSnapshotImmutabilityInterceptor
→ AuditingInterceptor
→ SoftDeleteInterceptor
→ DomainEventInterceptor
→ CacheInvalidationInterceptor
```

Guard `SoftDeleteInterceptor`'dan önce olmalı; aksi hâlde delete modified'a dönüştürülüp niyet gizlenir. Added graph serbesttir.

- [ ] **Step 6: Immutability entegrasyon testini yeşile getir**

Test, kaydedilmiş item'ı `db.Entry(item).Property(x => x.FinalWeeklyHours).CurrentValue = 9` ile değiştirmeyi ve `db.SchoolCurriculumSnapshotItems.Remove(item)` çağrısını ayrı ayrı dener; ikisi de aynı exception ile reddedilir. Yeni snapshot graph'ının ilk insert'i geçer.

```bash
dotnet test tests/Oksis.Application.UnitTests --filter FullyQualifiedName~ActivateAcademicSessionCommandHandlerTests
dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~CurriculumSnapshotActivationTests|FullyQualifiedName~CurriculumSnapshotImmutabilityTests"
```

- [ ] **Step 7: Commit**

```bash
git add src/Oksis.Application src/Oksis.Infrastructure tests/Oksis.Application.UnitTests tests/Oksis.Infrastructure.IntegrationTests
git commit -m "feat(academic-sessions): aktivasyonda müfredat snapshotını dondur"
```

---

## Task 7: Ders programı ve gerekli toplam saati yalnız snapshot'tan okut

**Files:**
- Modify: `CurriculumWeeklyHourProvider.cs`
- Modify: `RequiredHoursResolver.cs`
- Modify: ilgili yorumlar ve `IWeeklyHourRequirementProvider` açıklaması
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Timetable/CurriculumSnapshotWeeklyHourProviderTests.cs`
- Modify: `RequiredHoursResolverTests.cs`
- Modify: `SubjectCatalogTranslationTests.cs`

- [ ] **Step 1: TB-201/TB-202 regresyon testlerini kırmızı yaz**

`CurriculumSnapshotWeeklyHourProviderTests`:

- aynı grade/subject için iki master version bulunduğunda provider exception atmaz ve snapshot saatini döner;
- snapshot 2 saatken daha yeni version 4 saat eklense de sonuç 2;
- final 0 item requirement listesine girmez;
- custom subject final 5 requirement olarak döner;
- başka session/grade/school snapshot'ı sızmaz;
- class room yoksa mevcut sözleşme gibi boş liste.

`RequiredHoursResolverTests`:

- snapshot item toplamını grade code bazında toplar;
- 0 saat toplamı etkiler ama key kaybolmaz; snapshot yoksa key yoktur;
- master/version/override DbSet'lerine erişmez.

- [ ] **Step 2: Provider'ı doğrudan snapshot query'sine indir**

`CurriculumWeeklyHourProvider.GetAsync`:

1. ClassRoom'dan `GradeLevelId` + `AcademicSessionId` alır.
2. `SchoolAcademicPrograms` ile session'ı, `SchoolCurriculumSnapshots` ile grade'i bulur.
3. `SchoolCurriculumSnapshotItems` içinden `FinalWeeklyHours > 0` satırlarını `(SubjectId, RequiredHours)` döner.
4. `CurriculumVersions`, `CurriculumEntries`, taslak, override, subject-grade kesişimi ve kimlik çevirisi okumaz.

`schoolId` parametresi global filter'a alternatif değildir; class room/session tutarlılığını savunmacı doğrulamada kullanılır.

- [ ] **Step 3: RequiredHoursResolver'ı snapshot'a geçir**

Grade code girişi `GradeLevels` ile ID'ye çevrilir; snapshot + item join'i session/program/grade üzerinden yapılır. Sonuç `FinalWeeklyHours` toplamıdır. Yeni master sürüm hiçbir koşulda sorguya katılmaz.

- [ ] **Step 4: Mimari bekçiyi güncelle**

`SubjectCatalogTranslationTests._masterKeyedReads` içinden `db.CurriculumHourTemplates` kaldırılır; yerine şu yeni bekçi eklenir veya aynı test genişletilir:

```text
CurriculumWeeklyHourProvider.cs ve RequiredHoursResolver.cs içinde
CurriculumVersions / CurriculumEntries / SchoolCurriculumDrafts /
SchoolCurriculumOverrides ifadeleri bulunamaz.
```

Bu statik bekçi, çalışma zamanı okuyucularının ileride tekrar dinamik master'a dönmesini engeller.

- [ ] **Step 5: Testleri yeşile getir**

```bash
dotnet test tests/Oksis.Application.UnitTests --filter FullyQualifiedName~RequiredHoursResolverTests
dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter FullyQualifiedName~CurriculumSnapshotWeeklyHourProviderTests
dotnet test tests/Oksis.Tests --filter "FullyQualifiedName~SubjectCatalogTranslationTests|FullyQualifiedName~Curriculum"
```

- [ ] **Step 6: Commit**

```bash
git add src/Oksis.Infrastructure src/Oksis.Application tests
git commit -m "fix(timetable): haftalık saatleri kilitli sezon snapshotından oku"
```

---

## Task 8: Kontrollü veri göçü ve legacy modelin sökülmesi

**Files:**
- Create: EF migration + designer
- Modify: `OksisDbContextModelSnapshot.cs`
- Delete: legacy entity/config/seed dosyaları
- Modify: `IApplicationDbContext.cs`, `OksisDbContext.cs`
- Modify: legacy tipe referans veren test ve mimari bekçiler
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/CurriculumVersioningMigrationTests.cs`

**Migration order:** Task 3'teki schema expand migration'ı → bu task'taki data copy → validation guards → contract. Cutover migration'ının veri taşıma ve drop bölümü aynı migration transaction'ında tamamlanır; uygulama kodu deploy edildiğinde ikili-okuma kalmaz.

- [ ] **Step 1: Legacy modeli runtime kodundan kaldır**

Aşağıdaki dosyaları sil:

- `CurriculumVersions.cs`
- `CurriculumHourTemplate.cs` ve configuration/seed/testi
- `SchoolWeeklyHourOverride.cs` ve configuration/testi

`IApplicationDbContext` ve `OksisDbContext` legacy DbSet'lerini kaldır. Task 5–7 sonunda runtime tüketicileri zaten yeni modele geçmiş olmalıdır; burada kalan compile referanslarını yeni tiplere taşı. Eski tablolar veritabanında cutover migration çalışana kadar fiziksel olarak durur.

- [ ] **Step 2: Modelden cutover migration'ını üret**

```bash
dotnet ef migrations add 20260918_curriculum_version_cutover \
  --project src/Oksis.Infrastructure \
  --startup-project src/Oksis.Api
```

- [ ] **Step 3: Üretilen migration'ı kontrollü veri taşıma ile patch et**

`Up()` sırası kesin olarak:

1. Session'ın tarihsel kademe kapsamını geçici SQL tabloda hesapla: önce o session'ın soft-delete edilmemiş `academic.class_rooms.grade_level_id` satırları ve legacy override grade kodları; bir session için ikisi de boşsa okulun bugün aktif `school.school_grade_levels` satırları fallback olur. Geçmiş sezon kapsamını yalnız bugünkü okul ayarından çıkarmaya çalışma.
2. Her `academic_session × tarihsel grade education_level` için `school_academic_programs` insert. Default program level üzerinden seçilir.
3. Her tarihsel grade için `school_curriculum_drafts` insert. Session adıyla eşleşen published version varsa bağlanır; legacy migration sırasında `2025-2026` dışındaki session'lar, eski çalışma davranışını korumak için aynı level'daki `LEGACY-2025.04-*` uyumluluk sürümüne bağlanır. Bu özel fallback yalnız migration SQL'indedir; yeni runtime bootstrap exact academic year arar, bulamazsa manual açar.
4. Legacy `school_weekly_hour_overrides` satırları taşınır:
   - `school.subjects.master_subject_id` ve grade üzerinden entry bulunursa `school_curriculum_overrides`;
   - entry bulunamazsa `school_curriculum_custom_courses`.
5. `Active` ve `Archived` session'ların her program/grade'ı için snapshot insert edilir.
6. Snapshot item inserti:
   - master entry + okul subject eşleşmesi için `COALESCE(override.weekly_hours, entry.default_weekly_hours)`;
   - entry'siz custom satırlar için custom weekly hour;
   - `meb_reference_hours` yalnız master satırında dolu;
   - final 0 satır da taşınır.
7. SQL guard'ları çalışır; koşul sağlanmazsa sırasıyla `THROW 51001, N'Legacy curriculum override migration is incomplete.', 1`, `51002 / N'Active or archived session snapshot migration is incomplete.'`, `51003 / N'Curriculum snapshot tenant mismatch detected.'`, `51004 / N'Duplicate curriculum snapshot subject detected.'` ile migration rollback eder:
   - legacy override olup yeni override/custom karşılığı olmayan satır sayısı 0;
   - active/archived session'da hesaplanan tarihsel grade kapsamı ile snapshot sayısı eşit;
   - snapshot item'da tenant school mismatch sayısı 0;
   - aynı snapshot/subject duplicate sayısı 0.
8. Geçici grade kapsam tablosu düşürülür.
9. EF'in ürettiği sırada `academic.school_weekly_hour_overrides` ve `master.curriculum_hour_templates` drop edilir.

GUID üretiminde rastgele `NEWID()` kullanılabilir; tekillik koordinattan gelir ve migration bir kez çalışır. Seed master kimlikleri ise `HasData` ile deterministiktir.

`Down()` contract tablolarını yeniden kurup veriyi eski forma çevirebildiği ölçüde geri taşır:

- curriculum entries → `curriculum_hour_templates`;
- draft override → `school_weekly_hour_overrides`;
- custom course satırları eski override'a taşınır;
- yeni tablolar düşürülmez; onların sahibi Task 3 schema migration'ıdır. İki migration birlikte geri alınırsa schema migration kendi tablolarını düşürür.

Snapshot'ın tarihsel ayrıntılarının legacy şemada tam karşılığı olmadığı migration XML doc'unda açıkça yazılır; `Down()` çalıştırılmadan önce yedek zorunluluğu belirtilir.

- [ ] **Step 4: Gerçek migration zinciri testini yaz**

`CurriculumVersioningMigrationTests` ayrı Testcontainers veritabanında:

1. `IMigrator.MigrateAsync("20260916223316_20260917_class_room_track")` ile bir önceki migration'a gider.
2. İki okul, active + archived + setup session, school subjects, grade levels, legacy template ve override satırlarını SQL ile seed eder.
3. `IMigrator.MigrateAsync()` ile latest'e çıkar.
4. Şunları assert eder: legacy tablolar yok; override 0 ve custom saat korunmuş; active/archived snapshot tam; setup draft var ama snapshot yok; iki tenant verisi ayrık; bugün deaktif edilmiş fakat geçmiş class room tarafından kullanılan grade'in snapshot'ı var.
5. Aynı DB'de app context açıp provider sonucunu ölçer.

Run:

```bash
dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter FullyQualifiedName~CurriculumVersioningMigrationTests
```

- [ ] **Step 5: Legacy referans ve model/migration bekçilerini çalıştır**

```bash
rg -n "CurriculumVersions|CurriculumHourTemplate|SchoolWeeklyHourOverride|curriculum_hour_templates|school_weekly_hour_overrides" src tests --glob '*.cs' --glob '!**/Migrations/**'
```

Expected: sıfır eşleşme. Migration geçmişindeki eşleşmeler bilinçli olarak kalır.

```bash
dotnet test tests/Oksis.Tests --filter FullyQualifiedName~MigrationsMatchModelTests
```

Expected: green.

- [ ] **Step 6: Commit**

```bash
git add src tests
git commit -m "feat(academics): geçici müfredat verisini sürüm ve snapshota taşı"
```

---

## Task 9: Tam doğrulama, domain haritası ve teslim

**Files:**
- Modify via `domain-map` skill: `docs/domain/moduller/Müfredat.md`
- Modify via `domain-map` skill: `docs/domain/kavramlar/Haftalık Ders Saati.md`
- Create/modify via `domain-map` skill: `docs/domain/kavramlar/Müfredat Sürümü.md`, `Sezon Müfredat Snapshotı.md`
- Create decision: `docs/domain/kararlar/0021-aktif-sezon-mufredati-snapshottan-okur.md`
- Modify: `docs/domain/_indeks.md`
- Modify: `docs/bulgular/OKSİS - Yapısal Kararlar ve Eksikler.md` (`TB-201`, `TB-202` kapanış kanıtı)

- [ ] **Step 1: Format ve statik tarama**

```bash
dotnet format
rg -n "TODO|TBD|PLACEHOLDER|NotImplementedException" \
  src/Oksis.Domain/Modules/Academics \
  src/Oksis.Application/Modules/Academics \
  src/Oksis.Infrastructure/Academics \
  src/Oksis.Infrastructure/Timetable
```

Expected: bu dilimden gelen placeholder yok.

- [ ] **Step 2: Günlük ve entegrasyon kapıları**

```bash
./scripts/test-changed.sh
./scripts/test-changed.sh --integration
dotnet build
```

Expected: all green.

- [ ] **Step 3: İdempotent migration script üret**

Önce bir önceki migration adını `dotnet ef migrations list` ile doğrula, sonra:

```bash
dotnet ef migrations script \
  20260916223316_20260917_class_room_track \
  20260918_curriculum_version_cutover \
  --project src/Oksis.Infrastructure \
  --startup-project src/Oksis.Api \
  --idempotent \
  -o /tmp/oksis_curriculum_v1.sql
```

Script'i oku; tablo drop'larının backfill guard'larından sonra olduğunu ve `THROW` kontrollerinin transaction içinde kaldığını doğrula. EF migration komutunda timestamp'siz benzersiz migration adı kullanılabilir; listede aynı suffix'ten yalnız bir tane olduğunu `dotnet ef migrations list` çıktısı doğrular.

- [ ] **Step 4: Domain notlarını `domain-map` skill'iyle güncelle**

Kod tamamlandığı için skill'i şimdi kullan. Notlar şunları açıkça söylemeli:

- haftalık saatin artık aktif sezonda master + override ile dinamik çözülmediği;
- setup sezonda draft, active/archived sezonda snapshot okunduğu;
- özel okulun 0 ve sınırsız artış/azalış hakkı;
- MEB değişikliğinin aktif sezona cascade etmediği;
- tek lise programı kuralı;
- manual fallback ve geçici legacy seed'in resmî olmadığı.

- [ ] **Step 5: Bulguları kanıtla kapat**

`TB-201` için iki master version regresyon testini; `TB-202` için yeni master eklenince eski snapshot'ın değişmediği testi dosya/metot adıyla kaydet. `E-16` kapanmaz; yalnız verinin `HIGH-PROVISIONAL` sürümüne izole edildiğini not et.

- [ ] **Step 6: Belge commit'i**

`oksis` deposunda:

```bash
git add docs/domain docs/bulgular
git commit -m "docs(mufredat): sürümlü master ve sezon snapshot haritasını işle"
```

- [ ] **Step 7: Son kod commit kontrolü**

`oksis-api` deposunda:

```bash
git status --short
git log --oneline origin/master..HEAD
```

Expected: çalışma alanı temiz; Task 1–8 commit'leri görünür.

---

## Kabul matrisi

| Kabul ölçütü | Kanıt |
|---|---|
| İkinci lise programı açılamaz | unique index + `CurriculumDraftBootstrapperTests` |
| Okul saat 0, 41, 120 girebilir | domain + validator + handler testleri |
| MEB toplamı okul toplamını sınırlandırmaz | `CurriculumDraftResolverTests` |
| Master yokluğu sezonu bloklamaz | manual draft/snapshot activation integration testi |
| Aktivasyon ikinci snapshot üretmez | `CurriculumSnapshotActivationTests` |
| Yarım snapshot aktivasyonu yok | transaction rollback integration testi |
| Yeni master eski sezonu değiştirmez | snapshot activation + provider regresyon testi |
| İki master sürüm provider'ı çökertmez | TB-201 provider integration testi |
| Ders programı yalnız snapshot okur | provider kodu + mimari bekçi |
| Eksik saat yalnız snapshot okur | `RequiredHoursResolverTests` + mimari bekçi |
| Tenant A, B verisini göremez/yazamaz | `CurriculumTenantIsolationTests` |
| Snapshot update/delete edilemez | immutability interceptor integration testi |
| Legacy override/custom veri kaybolmaz | gerçek migration zinciri testi |
| Model ile migration eşleşir | `MigrationsMatchModelTests` |

## Plan öz-denetimi

- [x] Kapsam yalnız Dilim 1; scraper, parser, merkez onay ve yeni UI/API kapsam dışı.
- [x] Master, tenant draft ve snapshot kimlikleri birbirinden ayrıldı.
- [x] `AcademicSession` gerçek domain adı kullanıldı; belgede geçen `AcademicYearId` kodda bu kimliğe eşlendi.
- [x] Özel okulun serbest artı/eksi override kararı ve saat 0 açıkça test edildi.
- [x] Dönem içi cascade/notification/erteleme eklenmedi.
- [x] Fail-safe master-yok akışı manual draft/snapshot ile tanımlandı.
- [x] TB-201/TB-202 için doğrudan regresyon kanıtı planlandı.
- [x] Legacy aktif/arşiv sezonlar backfill edilmeden provider switch yapılmıyor.
- [x] Tenant filter bypass ve repository wrapper yok.
- [x] Kod dosyalarında uygulanmak üzere `TODO`, `TBD`, sahte implementasyon veya sessiz fallback bırakılmadı.
