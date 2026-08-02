# Duyurular A1 — Omurga Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `oksis-api`'de duyuru modülünün omurgasını kurmak — yönetici duyuru yayınlar, veli/öğrenci gelen kutusunda görür ve okur.

**Architecture:** Clean Architecture + CQRS (modüler monolith). Domain katmanı invariant'ları taşır, Application katmanı MediatR komut/sorgularıyla orkestre eder, Infrastructure EF Core ile kalıcılaştırır. Alıcı çözümleme tek bir `IAudienceResolver` arkasındadır — hem hedef havuzunu üretir hem yayın anında alıcıyı materyalize eder, böylece önizlemedeki sayı ile gerçek alıcı ayrışamaz.

**Tech Stack:** .NET 10 / C# 13 · EF Core 10 · MSSQL 2022 · MediatR · FluentValidation · Mapster · Hangfire · xUnit + FluentAssertions + NSubstitute + Testcontainers

**Spec:** `docs/superpowers/specs/2026-08-02-duyurular-uctan-uca-design.md`

**Depo:** `/Users/farukkaya/Repositories/oksis-api` — tüm yollar bu depoya görelidir. `permission-matrix.md` düzeltmesi `/Users/farukkaya/Repositories/oksis`'tedir.

## Global Constraints

- **Tenant izolasyonu kırmızı çizgidir.** Her tenant entity `IHasTenant` + global query filter + `TenantSaveChangesInterceptor`. `IgnoreQueryFilters()` gerekçesiz YASAK.
- **AutoMapper YASAK** — Mapster.
- **Repository pattern wrapper YASAK** — `IApplicationDbContext` yeterli.
- **Lazy loading YASAK** — explicit `Include()` veya projection.
- **Domain'de EF Core / DataAnnotations YASAK** — fluent API `Infrastructure/Persistence/Configurations/`.
- **Controller'da `DbContext` YASAK** — her zaman `ISender.Send`.
- **`async void`, `Task.Result`, `.Wait()` YASAK.**
- **Duyuru SİLİNMEZ** (INV-1) — `Delete()` metodu, `IsDeleted` alanı ve `DELETE` ucu yazılmaz.
- **Yorumlar Türkçe**, tanımlama noktalarında; tanımlayıcılar İngilizce.
- **Tablo şeması:** `OksisSchemas.School` (`ToSchoolTable`). Duyuru bir okul kaydıdır, bildirim değildir — `notifications` şemasına konmaz.
- **Test isimlendirme:** `Should_{ExpectedBehavior}_When_{Condition}`, sınıf `{SystemUnderTest}Tests`.
- **Commit formatı:** `<type>(<scope>): türkçe açıklama` — scope `announcements` veya `repo`, sonda nokta yok.
- **Her görevden önce:** `dotnet format` çalıştırılır (pre-commit zorunlu).
- **Enum'lar tel'de string anahtar** döner (frontend sözleşmesi), DB'de `int` saklanır — dönüşüm DTO eşleyicisinde.

---

## Dosya Yapısı

```
src/Oksis.Domain/Common/
  PermanentTenantEntity.cs                    YENİ — soft-delete İÇERMEYEN tenant temeli

src/Oksis.Domain/Modules/Announcements/
  Enums/          AnnouncementStatus, AnnouncementType, AnnouncementReach,
                  DeliveryChannel, AnnouncementModeration, AudienceDimension,
                  AudienceBucket
  Exceptions/     AnnouncementDomainException
  Entities/       Announcement (root), AnnouncementTarget, AnnouncementRecipient,
                  AnnouncementAuditEntry, AnnouncementTemplate
  Events/         AnnouncementPublishedEvent
  Rules/          AnnouncementAudienceRules   (saf — kademe kuralı)

src/Oksis.Application/Modules/Announcements/
  DTOs/           AnnouncementDto, AudienceOptionDto, AudiencePoolDto, ...
  Abstractions/   IAudienceResolver
  Commands/       CreateAnnouncement/, MarkAnnouncementRead/
  Queries/        GetAudiencePool/, GetAnnouncements/, GetAnnouncementById/,
                  GetAnnouncementInbox/
  Common/         AnnouncementMapper, AnnouncementCallerResolver
  Events/Notifications/ AnnouncementPublishedNotificationHandler

src/Oksis.Infrastructure/
  Persistence/Configurations/Announcements/   5 configuration
  Announcements/AudienceResolver.cs           IAudienceResolver implementasyonu

src/Oksis.Api/Controllers/V1/AnnouncementsController.cs

tests/Oksis.Domain.UnitTests/Modules/Announcements/
tests/Oksis.Application.UnitTests/Modules/Announcements/
tests/Oksis.Infrastructure.IntegrationTests/Persistence/Announcements*
```

---

## Görev Listesi (A1)

| # | Görev | Dilim |
|---|---|---|
| 1 | `PermanentTenantEntity` temeli | 0 |
| 2 | Enum'lar + domain exception | 0 |
| 3 | `Announcement` aggregate root + invariant'lar | 0 |
| 4 | Child entity'ler (Target/Recipient/AuditEntry) | 0 |
| 5 | `AnnouncementTemplate` | 0 |
| 6 | EF configuration + DbContext + migration | 0 |
| 7 | İzin anahtarları + rol matrisi + doküman | 0 |
| 8 | DTO'lar (kontrata birebir) | 0 |
| 9 | Kademe kuralı (saf, testli) | 1 |
| 10 | `IAudienceResolver` + implementasyon | 1 |
| 11 | `GET /audience` + controller iskeleti | 1 |
| 12 | `POST /announcements` + materyalizasyon | 2 |
| 13 | `GET /announcements` (scope + filtre + sayfalama) | 2 |
| 14 | `GET /announcements/{id}` | 2 |
| 15 | `GET /announcements/inbox` (self-only) | 3 |
| 16 | `POST /{id}:read` (self-only) | 3 |
| 17 | Bildirim zinciri | 3 |
| 18 | Uçtan uca duman testi | 3 |

---

### Task 1: `PermanentTenantEntity` temeli

INV-1 "`IsDeleted` alanı yok" der. Mevcut `TenantEntity` (`src/Oksis.Domain/Common/TenantEntity.cs`) `ISoftDeletable`'ı paketler ve tenant entity'ler için bundan kaçış yoktur. Bu görev soft-delete içermeyen bir kardeş temel ekler.

**Files:**
- Create: `src/Oksis.Domain/Common/PermanentTenantEntity.cs`
- Test: `tests/Oksis.Domain.UnitTests/Common/PermanentTenantEntityTests.cs`

**Interfaces:**
- Consumes: `AggregateRoot`, `IHasTenant`, `IAuditableEntity` (mevcut)
- Produces: `public abstract class PermanentTenantEntity : AggregateRoot, IHasTenant, IAuditableEntity` — `SchoolId`, `CreatedAt/By`, `UpdatedAt/By`, `RowVersion`. **`IsDeleted` YOK.** Task 3–5 bundan türer.

- [ ] **Step 1: Failing test yaz**

`tests/Oksis.Domain.UnitTests/Common/PermanentTenantEntityTests.cs`:

```csharp
using FluentAssertions;
using Oksis.Domain.Common;
using Xunit;

namespace Oksis.Domain.UnitTests.Common;

public sealed class PermanentTenantEntityTests
{
    private sealed class Probe : PermanentTenantEntity;

    [Fact]
    public void Should_NotImplementSoftDeletable_When_DerivedFromPermanentTenantEntity()
    {
        typeof(Probe).Should().NotBeAssignableTo<ISoftDeletable>();
    }

    [Fact]
    public void Should_CarryTenantAndAudit_When_DerivedFromPermanentTenantEntity()
    {
        typeof(Probe).Should().BeAssignableTo<IHasTenant>();
        typeof(Probe).Should().BeAssignableTo<IAuditableEntity>();
    }
}
```

- [ ] **Step 2: Testin kırıldığını doğrula**

Run: `dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~PermanentTenantEntityTests"`
Expected: FAIL — `PermanentTenantEntity` tipi bulunamıyor (derleme hatası).

- [ ] **Step 3: Temel sınıfı yaz**

`src/Oksis.Domain/Common/PermanentTenantEntity.cs`:

```csharp
namespace Oksis.Domain.Common;

/// <summary>
/// Silinmeyen tenant-scope'lu kayıtların temeli. <see cref="TenantEntity"/> ile aynıdır —
/// tek farkı <see cref="ISoftDeletable"/> UYGULAMAMASIDIR.
///
/// Duyuru kurumsal bir kayıttır: silinmez, yalnız geri çekilir veya arşive iner (INV-1).
/// Soft-delete alanlarını miras almak "silinebilir duyuru" ihtimalini şema seviyesinde
/// açık bırakırdı; silinebilen bir duyuru ise hiç yayınlanmamış bir duyuruyla aynı şeydir
/// ve modülün kanıt üretme işlevi çöker.
///
/// <para><b>Sonuç:</b> bu temelden türeyen entity'ler <c>OksisDbContext</c>'in soft-delete
/// global query filter'ını ALMAZ (filtre <c>typeof(ISoftDeletable).IsAssignableFrom(...)</c>
/// ile koşulludur); tenant filtresini ise <see cref="IHasTenant"/> üzerinden ALIR.</para>
/// </summary>
public abstract class PermanentTenantEntity : AggregateRoot, IHasTenant, IAuditableEntity
{
    public Guid SchoolId { get; protected init; }

    public DateTimeOffset CreatedAt { get; set; }
    public Guid CreatedBy { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
    public Guid? UpdatedBy { get; set; }

    public byte[]? RowVersion { get; set; }
}
```

- [ ] **Step 4: Testin geçtiğini doğrula**

Run: `dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~PermanentTenantEntityTests"`
Expected: PASS (2 test)

- [ ] **Step 5: Tenant filtresinin hâlâ uygulandığını doğrula**

`src/Oksis.Infrastructure/Persistence/OksisDbContext.cs` içinde tenant filtresinin `IHasTenant` üzerinden mi yoksa `TenantEntity` üzerinden mi kurulduğunu oku (satır ~235-275 civarı).

Run: `grep -n "IHasTenant\|TenantEntity" src/Oksis.Infrastructure/Persistence/OksisDbContext.cs`

Expected: Filtre `IHasTenant` üzerinden kurulmuş olmalı. **Eğer `TenantEntity` tipine bağlıysa DUR** — bu planın varsayımı kırılmıştır; bulguyu bildir ve devam etme.

- [ ] **Step 6: Tüm domain testlerinin yeşil kaldığını doğrula**

Run: `dotnet build && dotnet test tests/Oksis.Domain.UnitTests`
Expected: PASS — mevcut testlerde regresyon yok.

- [ ] **Step 7: Commit**

```bash
cd /Users/farukkaya/Repositories/oksis-api
dotnet format
git add src/Oksis.Domain/Common/PermanentTenantEntity.cs tests/Oksis.Domain.UnitTests/Common/PermanentTenantEntityTests.cs
git commit -m "feat(announcements): soft-delete icermeyen PermanentTenantEntity temeli eklendi

Duyuru kurumsal kayittir ve silinmez (INV-1). TenantEntity ISoftDeletable'i
paketledigi icin duyuru entity'leri IsDeleted alanini miras alacakti; bu
kardes temel o alani sema seviyesinde yok eder."
```

---

### Task 2: Enum'lar + domain exception

**Files:**
- Create: `src/Oksis.Domain/Modules/Announcements/Enums/AnnouncementStatus.cs`
- Create: `src/Oksis.Domain/Modules/Announcements/Enums/AnnouncementType.cs`
- Create: `src/Oksis.Domain/Modules/Announcements/Enums/AnnouncementReach.cs`
- Create: `src/Oksis.Domain/Modules/Announcements/Enums/DeliveryChannel.cs`
- Create: `src/Oksis.Domain/Modules/Announcements/Enums/AnnouncementModeration.cs`
- Create: `src/Oksis.Domain/Modules/Announcements/Enums/AudienceDimension.cs`
- Create: `src/Oksis.Domain/Modules/Announcements/Enums/AudienceBucket.cs`
- Create: `src/Oksis.Domain/Modules/Announcements/Exceptions/AnnouncementDomainException.cs`

**Interfaces:**
- Produces: Yukarıdaki 7 enum ve `AnnouncementDomainException(string code, string message)` — `Code` property'si taşır. Task 3+ bunları kullanır.

> **Sıra kritik:** `int` değerleri DB'de saklanacaktır; sonradan araya değer eklemek mevcut satırları bozar. Değerler frontend `packages/core/src/announcements/types.ts` sırasıyla birebir aynıdır.

- [ ] **Step 1: Enum'ları yaz**

`AnnouncementStatus.cs`:

```csharp
namespace Oksis.Domain.Modules.Announcements.Enums;

/// <summary>
/// Duyurunun yaşam döngüsü. <c>Deleted</c> DEĞERİ YOKTUR — kurumsal kayıt silinmez (INV-1).
/// Yanlış yayınlanan duyuru <see cref="Withdrawn"/> olur, süresi dolan <see cref="Expired"/>.
/// Sıra frontend <c>AnnouncementStatus</c> birleşimiyle aynıdır; araya değer EKLENMEZ.
/// </summary>
public enum AnnouncementStatus
{
    Draft = 0,
    Scheduled = 1,
    PendingApproval = 2,
    Published = 3,
    Expired = 4,
    Withdrawn = 5,
    Archived = 6
}
```

`AnnouncementType.cs`:

```csharp
namespace Oksis.Domain.Modules.Announcements.Enums;

/// <summary>
/// Duyurunun İMZASI — kim adına konuşulduğu. <see cref="AnnouncementReach"/> ile karıştırma:
/// o erişimi söyler, bu imzayı. İkisi bağımsızdır.
/// </summary>
public enum AnnouncementType
{
    /// <summary>Okul Müdürlüğü imzalı — yönetim veya sekreter yayınlar.</summary>
    Institutional = 0,

    /// <summary>Öğretmen adı + branş imzalı — sınıf/ders duyurusu.</summary>
    Classroom = 1
}
```

`AnnouncementReach.cs`:

```csharp
namespace Oksis.Domain.Modules.Announcements.Enums;

/// <summary>
/// Duyurunun okuyucuya NEREDEN geldiği — ERİŞİM kapsamı.
/// Kanıt: 11. sınıf velilerine Okul Müdürlüğü imzasıyla giden duyuru
/// <c>{ Reach = ClassScoped, Type = Institutional }</c>tır. Tek alanla modellenemez.
/// </summary>
public enum AnnouncementReach
{
    SchoolWide = 0,
    ClassScoped = 1
}
```

`DeliveryChannel.cs`:

```csharp
namespace Oksis.Domain.Modules.Announcements.Enums;

/// <summary>Gönderim kanalı. <see cref="InApp"/> KAPATILAMAZ (INV-3).</summary>
public enum DeliveryChannel
{
    InApp = 0,
    Push = 1,
    Email = 2
}
```

`AnnouncementModeration.cs`:

```csharp
namespace Oksis.Domain.Modules.Announcements.Enums;

/// <summary>
/// Okul geneli moderasyon ayarı (KR-01). Varsayılan <see cref="Open"/>.
/// <see cref="Thresholded"/> = eşikli: öğretmenin VELİLERE gönderdiği duyuru onaya düşer,
/// öğrencilere gidenler serbest yayınlanır.
/// </summary>
public enum AnnouncementModeration
{
    Open = 0,
    Thresholded = 1
}
```

`AudienceDimension.cs`:

```csharp
namespace Oksis.Domain.Modules.Announcements.Enums;

/// <summary>Hedef kitle seçicisinin katmanları. Öğretmen yalnız Section/Course görür.</summary>
public enum AudienceDimension
{
    All = 0,
    Role = 1,
    SchoolStage = 2,
    GradeLevel = 3,
    Section = 4,
    Person = 5,
    Course = 6
}
```

`AudienceBucket.cs`:

```csharp
namespace Oksis.Domain.Modules.Announcements.Enums;

/// <summary>
/// Bir hedef seçiminin hangi rol kümesine çözümleneceği.
///
/// <para><b>Neden gövdede taşınır:</b> aynı <c>(Dimension, Key)</c> çifti role göre farklı
/// anlama gelir — yönetici havuzunda <c>(Section, "9-A")</c> ŞUBEDEKİ ÖĞRENCİLER, öğretmen
/// havuzunda AYNI çift O ŞUBENİN VELİLERİdir. Hedef yayın anında sonsuza kadar dondugu
/// için (INV-2) kaydın kendisi kime gittiğini anlatmak zorundadır; rol bağlamından
/// sonradan türetilemez.</para>
/// </summary>
public enum AudienceBucket
{
    Parent = 0,
    Teacher = 1,
    Student = 2
}
```

- [ ] **Step 2: Domain exception'ı yaz**

`src/Oksis.Domain/Modules/Announcements/Exceptions/AnnouncementDomainException.cs`:

```csharp
namespace Oksis.Domain.Modules.Announcements.Exceptions;

/// <summary>
/// Duyuru invariant ihlali. <c>AttendanceDomainException</c> kalıbı: handler yakalar ve
/// <c>Result.Failure(new Error(ex.Code, ex.Message))</c>'a çevirir.
/// </summary>
public sealed class AnnouncementDomainException(string code, string message)
    : Exception(message)
{
    public string Code { get; } = code;
}
```

- [ ] **Step 3: Derlemeyi doğrula**

Run: `dotnet build src/Oksis.Domain`
Expected: SUCCESS, 0 warning.

- [ ] **Step 4: Enum değerlerinin frontend ile eşleştiğini doğrula**

Run:
```bash
grep -n "draft\|scheduled\|pendingApproval\|published\|expired\|withdrawn\|archived" \
  /Users/farukkaya/Repositories/oksis-ui/packages/core/src/announcements/types.ts | head -10
```
Expected: `AnnouncementStatus` birleşiminin sırası yukarıdaki `int` sırasıyla aynı. Farklıysa **DUR ve bildir**.

- [ ] **Step 5: Commit**

```bash
cd /Users/farukkaya/Repositories/oksis-api
dotnet format
git add src/Oksis.Domain/Modules/Announcements/
git commit -m "feat(announcements): domain enum'lari ve domain exception eklendi

7 enum frontend packages/core sozlesmesiyle birebir siralidir; int
degerleri DB'de saklandigi icin araya deger eklenmez. AudienceBucket
govdede tasinir cunku ayni (Dimension, Key) cifti role gore farkli
aliciya cozumlenir ve hedef yayin aninda donar (INV-2)."
```

---

### Task 3: `Announcement` aggregate root + invariant'lar

Bu görev modülün kalbidir. Invariant'lar **domain katmanında** zorlanır — handler'da değil.

**Files:**
- Create: `src/Oksis.Domain/Modules/Announcements/Entities/Announcement.cs`
- Create: `src/Oksis.Domain/Modules/Announcements/Events/AnnouncementPublishedEvent.cs`
- Test: `tests/Oksis.Domain.UnitTests/Modules/Announcements/AnnouncementTests.cs`

**Interfaces:**
- Consumes: Task 1 `PermanentTenantEntity`, Task 2 enum'ları ve `AnnouncementDomainException`
- Produces:
  - `Announcement.CreateDraft(Guid schoolId, Guid sessionId, Guid publisherId, string publisherLabel, string? publisherSignature, string? publisherRealName, AnnouncementType type, string title, string body, bool urgent, bool pinned, DateTimeOffset? scheduledAt, DateTimeOffset? validUntil, IReadOnlyList<DeliveryChannel> channels) → Announcement`
  - `announcement.Publish(AnnouncementReach reach, int recipientCount, DateTimeOffset now) → void` (event raise eder)
  - `announcement.MarkScheduled(DateTimeOffset scheduledAt) → void`
  - `announcement.MarkPendingApproval() → void`
  - Property'ler: `Status`, `Type`, `Reach`, `Title`, `Body`, `Urgent`, `Pinned`, `Amended`, `PublisherId`, `PublisherLabel`, `PublisherSignature`, `PublisherRealName`, `PublishedAt`, `ScheduledAt`, `ValidUntil`, `Channels`, `RecipientCountSnapshot`, `WithdrawReason`, `WithdrawnAt`, `WithdrawnBy`, `StatusBeforeWithdraw`, `AttachmentFileId`, `AcademicSessionId`
  - **`Delete()` metodu YOKTUR.** Task 12 `CreateDraft`+`Publish` kullanır; Task 18 duman testi property'leri okur.

> `Amend()`, `Withdraw()`, `Restore()` A2 planındadır — bu görevde yazılmaz.

- [ ] **Step 1: Failing test yaz — invariant'lar**

`tests/Oksis.Domain.UnitTests/Modules/Announcements/AnnouncementTests.cs`:

```csharp
using FluentAssertions;
using Oksis.Domain.Modules.Announcements.Entities;
using Oksis.Domain.Modules.Announcements.Enums;
using Oksis.Domain.Modules.Announcements.Events;
using Oksis.Domain.Modules.Announcements.Exceptions;
using Xunit;

namespace Oksis.Domain.UnitTests.Modules.Announcements;

public sealed class AnnouncementTests
{
    private static readonly Guid SchoolId = Guid.NewGuid();
    private static readonly Guid SessionId = Guid.NewGuid();
    private static readonly Guid PublisherId = Guid.NewGuid();
    private static readonly DateTimeOffset Now = new(2026, 8, 2, 9, 0, 0, TimeSpan.FromHours(3));

    private static Announcement Draft(
        string title = "Servis saati değişikliği",
        string body = "Yarın servisler 10 dakika erken kalkacaktır.",
        bool urgent = false,
        IReadOnlyList<DeliveryChannel>? channels = null) =>
        Announcement.CreateDraft(
            SchoolId, SessionId, PublisherId, "Okul Müdürlüğü", null, "Ayşe Yılmaz",
            AnnouncementType.Institutional, title, body, urgent, pinned: false,
            scheduledAt: null, validUntil: null,
            channels ?? [DeliveryChannel.InApp, DeliveryChannel.Push]);

    [Fact]
    public void Should_HaveNoDeleteMethod_When_TypeInspected()
    {
        // INV-1: duyuru silinmez. Bu test yapısal bir bekçidir — birisi Delete()
        // eklerse derleme değil TEST kırılır ve gerekçe sorulur.
        typeof(Announcement).GetMethod("Delete").Should().BeNull();
        typeof(Announcement).GetProperty("IsDeleted").Should().BeNull();
    }

    [Fact]
    public void Should_StartAsDraft_When_Created()
    {
        Draft().Status.Should().Be(AnnouncementStatus.Draft);
    }

    [Fact]
    public void Should_AlwaysIncludeInAppChannel_When_ChannelsOmitIt()
    {
        // INV-3: inApp kapatılamaz.
        var sut = Draft(channels: [DeliveryChannel.Push]);
        sut.Channels.Should().Contain(DeliveryChannel.InApp);
    }

    [Theory]
    [InlineData("")]
    [InlineData("ab")]
    public void Should_Throw_When_TitleShorterThanThreeChars(string title)
    {
        var act = () => Draft(title: title);
        act.Should().Throw<AnnouncementDomainException>()
            .Which.Code.Should().Be("Announcements.Title.Invalid");
    }

    [Fact]
    public void Should_Throw_When_TitleLongerThanNinetyChars()
    {
        var act = () => Draft(title: new string('a', 91));
        act.Should().Throw<AnnouncementDomainException>()
            .Which.Code.Should().Be("Announcements.Title.Invalid");
    }

    [Fact]
    public void Should_Throw_When_BodyShorterThanSixChars()
    {
        var act = () => Draft(body: "kısa");
        act.Should().Throw<AnnouncementDomainException>()
            .Which.Code.Should().Be("Announcements.Body.Invalid");
    }

    [Fact]
    public void Should_BecomePublishedAndRaiseEvent_When_Published()
    {
        var sut = Draft();
        sut.Publish(AnnouncementReach.SchoolWide, recipientCount: 428, Now);

        sut.Status.Should().Be(AnnouncementStatus.Published);
        sut.Reach.Should().Be(AnnouncementReach.SchoolWide);
        sut.PublishedAt.Should().Be(Now);
        sut.RecipientCountSnapshot.Should().Be(428);
        sut.DomainEvents.Should().ContainSingle(e => e is AnnouncementPublishedEvent);
    }

    [Fact]
    public void Should_Throw_When_PublishingAnAlreadyPublishedAnnouncement()
    {
        var sut = Draft();
        sut.Publish(AnnouncementReach.SchoolWide, 428, Now);

        var act = () => sut.Publish(AnnouncementReach.SchoolWide, 428, Now);
        act.Should().Throw<AnnouncementDomainException>()
            .Which.Code.Should().Be("Announcements.Publish.InvalidStatus");
    }

    [Fact]
    public void Should_CarryUrgentFlagIntoEvent_When_UrgentPublished()
    {
        var sut = Draft(urgent: true);
        sut.Publish(AnnouncementReach.SchoolWide, 428, Now);

        sut.DomainEvents.OfType<AnnouncementPublishedEvent>().Single()
            .Urgent.Should().BeTrue();
    }

    [Fact]
    public void Should_SnapshotPublisherLabel_When_Created()
    {
        // §14: öğretmen okuldan ayrılsa bile imza tarihsel olarak korunur.
        // Etiket YAZILDIĞI ANDA donar, okuma anında çözülmez.
        Draft().PublisherLabel.Should().Be("Okul Müdürlüğü");
    }
}
```

- [ ] **Step 2: Testin kırıldığını doğrula**

Run: `dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~AnnouncementTests"`
Expected: FAIL — `Announcement` tipi bulunamıyor (derleme hatası).

- [ ] **Step 3: Event'i yaz**

`src/Oksis.Domain/Modules/Announcements/Events/AnnouncementPublishedEvent.cs`:

```csharp
using Oksis.Domain.Common;

namespace Oksis.Domain.Modules.Announcements.Events;

/// <summary>
/// Duyuru yayınlandı. <c>DomainEventInterceptor</c> SaveChangesAsync sırasında işler;
/// tüketicisi <c>AnnouncementPublishedNotificationHandler</c> (in-app fan-out).
///
/// <para><see cref="Urgent"/> bildirim önceliğini belirler: acil duyuru
/// <c>NotificationPriority.Critical</c> ile gider ve sessiz saat kısıtını deler.</para>
/// </summary>
public sealed record AnnouncementPublishedEvent(
    Guid SchoolId,
    Guid AnnouncementId,
    string Title,
    bool Urgent) : IDomainEvent;
```

- [ ] **Step 4: Aggregate root'u yaz**

`src/Oksis.Domain/Modules/Announcements/Entities/Announcement.cs`:

```csharp
using Oksis.Domain.Common;
using Oksis.Domain.Modules.Announcements.Enums;
using Oksis.Domain.Modules.Announcements.Events;
using Oksis.Domain.Modules.Announcements.Exceptions;

namespace Oksis.Domain.Modules.Announcements.Entities;

/// <summary>
/// Duyuru — kurumsal kayıt: kalıcı, kitlesel, SİLİNMEZ (INV-1). Aggregate root.
/// Hedefler, alıcılar ve denetim izi bu köke aittir ve onunla yaşar.
///
/// <para><b>Neden <see cref="PermanentTenantEntity"/>:</b> soft-delete alanlarını miras
/// almamak için. Silinebilen bir duyuru hiç yayınlanmamış bir duyuruyla aynı şeydir.</para>
/// </summary>
public sealed class Announcement : PermanentTenantEntity
{
    public const int TitleMinLength = 3;
    public const int TitleMaxLength = 90;
    public const int BodyMinLength = 6;

    private readonly List<DeliveryChannel> _channels = [];

    public Guid AcademicSessionId { get; private set; }
    public AnnouncementStatus Status { get; private set; }
    public AnnouncementType Type { get; private set; }
    public AnnouncementReach Reach { get; private set; }

    public string Title { get; private set; } = default!;
    public string Body { get; private set; } = default!;
    public bool Urgent { get; private set; }
    public bool Pinned { get; private set; }

    /// <summary>Yayın sonrası anlamı değiştiren düzeltme yapıldı ("Güncellendi" rozeti).</summary>
    public bool Amended { get; private set; }

    public Guid PublisherId { get; private set; }

    /// <summary>
    /// Görünen imza ("Okul Müdürlüğü" veya öğretmen adı). YAZILDIĞI ANDA DONAR.
    ///
    /// <para><b>Bilinçli sapma:</b> <c>ActivityGroup.PreviousTeacherId</c> yorumu "ad
    /// snapshot'lamak kişi adı değiştiğinde bayatlar" der ve kimlik saklar. Duyuruda
    /// bayatlama İSTENEN davranıştır — ihtiyaç analizi §14: "öğretmen okuldan ayrıldı,
    /// duyurusu yayında → duyuru yayında kalır; imza tarihsel olarak korunur."</para>
    /// </summary>
    public string PublisherLabel { get; private set; } = default!;

    /// <summary>Öğretmen imzası ("Ayşe Yılmaz · Matematik"); kurumsal duyuruda null.</summary>
    public string? PublisherSignature { get; private set; }

    /// <summary>
    /// Kurumsal imzanın arkasındaki gerçek kişi (DYR-K-09). Sekreter yayınlasa bile imza
    /// "Okul Müdürlüğü"dür; sorumluluk zincirinin kırılmaması için gerçek yazar saklanır.
    /// </summary>
    public string? PublisherRealName { get; private set; }

    public DateTimeOffset? PublishedAt { get; private set; }
    public DateTimeOffset? ScheduledAt { get; private set; }
    public DateTimeOffset? ValidUntil { get; private set; }

    public IReadOnlyList<DeliveryChannel> Channels => _channels;

    /// <summary>Yayın anında mühürlenen alıcı sayısı; taslakta null.</summary>
    public int? RecipientCountSnapshot { get; private set; }

    public string? WithdrawReason { get; private set; }
    public DateTimeOffset? WithdrawnAt { get; private set; }
    public Guid? WithdrawnBy { get; private set; }

    /// <summary>Geri çekme geri alınırsa bu statüye dönülür (INV-4).</summary>
    public AnnouncementStatus? StatusBeforeWithdraw { get; private set; }

    /// <summary>Documents modülündeki <c>FileAttachment</c> kimliği; içerik burada tutulmaz.</summary>
    public Guid? AttachmentFileId { get; private set; }

    private Announcement() { } // EF Core

    public static Announcement CreateDraft(
        Guid schoolId,
        Guid academicSessionId,
        Guid publisherId,
        string publisherLabel,
        string? publisherSignature,
        string? publisherRealName,
        AnnouncementType type,
        string title,
        string body,
        bool urgent,
        bool pinned,
        DateTimeOffset? scheduledAt,
        DateTimeOffset? validUntil,
        IReadOnlyList<DeliveryChannel> channels)
    {
        var normalizedTitle = (title ?? string.Empty).Trim();
        if (normalizedTitle.Length is < TitleMinLength or > TitleMaxLength)
        {
            throw new AnnouncementDomainException(
                "Announcements.Title.Invalid",
                $"Duyuru başlığı {TitleMinLength}-{TitleMaxLength} karakter olmalıdır.");
        }

        var normalizedBody = (body ?? string.Empty).Trim();
        if (normalizedBody.Length < BodyMinLength)
        {
            throw new AnnouncementDomainException(
                "Announcements.Body.Invalid",
                $"Duyuru içeriği en az {BodyMinLength} karakter olmalıdır.");
        }

        if (string.IsNullOrWhiteSpace(publisherLabel))
        {
            throw new AnnouncementDomainException(
                "Announcements.Publisher.LabelRequired", "İmza etiketi zorunludur.");
        }

        var announcement = new Announcement
        {
            SchoolId = schoolId,
            AcademicSessionId = academicSessionId,
            Status = AnnouncementStatus.Draft,
            Type = type,
            Reach = AnnouncementReach.SchoolWide,
            Title = normalizedTitle,
            Body = normalizedBody,
            Urgent = urgent,
            Pinned = pinned,
            PublisherId = publisherId,
            PublisherLabel = publisherLabel.Trim(),
            PublisherSignature = string.IsNullOrWhiteSpace(publisherSignature) ? null : publisherSignature.Trim(),
            PublisherRealName = string.IsNullOrWhiteSpace(publisherRealName) ? null : publisherRealName.Trim(),
            ScheduledAt = scheduledAt,
            ValidUntil = validUntil,
        };

        // INV-3: inApp kanalı kapatılamaz — istemci göndermese de eklenir.
        announcement._channels.Add(DeliveryChannel.InApp);
        foreach (var channel in channels.Distinct().Where(c => c != DeliveryChannel.InApp))
        {
            announcement._channels.Add(channel);
        }

        return announcement;
    }

    /// <summary>
    /// Duyuruyu yayına alır ve alıcı sayısını mühürler. Hedef donması ve alıcı
    /// materyalizasyonu ÇAĞIRANIN işidir (aynı transaction) — bu metot yalnız kökün
    /// durumunu değiştirir ve olayı yayar.
    /// </summary>
    public void Publish(AnnouncementReach reach, int recipientCount, DateTimeOffset now)
    {
        if (Status is not (AnnouncementStatus.Draft or AnnouncementStatus.Scheduled or AnnouncementStatus.PendingApproval))
        {
            throw new AnnouncementDomainException(
                "Announcements.Publish.InvalidStatus",
                "Yalnız taslak, zamanlanmış veya onay bekleyen duyuru yayınlanabilir.");
        }

        Reach = reach;
        Status = AnnouncementStatus.Published;
        PublishedAt = now;
        RecipientCountSnapshot = recipientCount;

        RaiseDomainEvent(new AnnouncementPublishedEvent(SchoolId, Id, Title, Urgent));
    }

    /// <summary>İleri tarihli yayın için bekletir; <c>PublishScheduledAnnouncementsJob</c> tetikler.</summary>
    public void MarkScheduled(DateTimeOffset scheduledAt)
    {
        if (Status is not AnnouncementStatus.Draft)
        {
            throw new AnnouncementDomainException(
                "Announcements.Schedule.InvalidStatus", "Yalnız taslak duyuru zamanlanabilir.");
        }

        Status = AnnouncementStatus.Scheduled;
        ScheduledAt = scheduledAt;
    }

    /// <summary>Eşikli moderasyonda öğretmen→veli duyurusunu onay kuyruğuna alır (INV-5).</summary>
    public void MarkPendingApproval()
    {
        if (Status is not AnnouncementStatus.Draft)
        {
            throw new AnnouncementDomainException(
                "Announcements.Approval.InvalidStatus", "Yalnız taslak duyuru onaya gönderilebilir.");
        }

        Status = AnnouncementStatus.PendingApproval;
    }

    public void AttachFile(Guid? attachmentFileId) => AttachmentFileId = attachmentFileId;
}
```

- [ ] **Step 5: `RaiseDomainEvent` adını doğrula**

`AggregateRoot` sınıfındaki olay yayma metodunun gerçek adını kontrol et.

Run: `grep -n "protected.*void.*Event\|DomainEvents" src/Oksis.Domain/Common/AggregateRoot.cs`

Expected: `RaiseDomainEvent` ve `DomainEvents` mevcut. **Ad farklıysa** `Announcement.Publish` içindeki çağrıyı ve testteki `sut.DomainEvents` erişimini gerçek ada göre düzelt.

- [ ] **Step 6: Testlerin geçtiğini doğrula**

Run: `dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~AnnouncementTests"`
Expected: PASS (10 test)

- [ ] **Step 7: Commit**

```bash
cd /Users/farukkaya/Repositories/oksis-api
dotnet format
git add src/Oksis.Domain/Modules/Announcements/ tests/Oksis.Domain.UnitTests/Modules/Announcements/
git commit -m "feat(announcements): Announcement aggregate root ve invariant'lari eklendi

INV-1 (Delete metodu ve IsDeleted alani yok), INV-3 (inApp kanali
istemci gondermese de eklenir) domain katmaninda zorlanir. Imza
alanlari yazildigi anda donar: ogretmen okuldan ayrilsa da duyurunun
imzasi tarihsel olarak korunur (ihtiyac analizi §14)."
```

---

### Task 4: Child entity'ler — Target, Recipient, AuditEntry

**Files:**
- Create: `src/Oksis.Domain/Modules/Announcements/Entities/AnnouncementTarget.cs`
- Create: `src/Oksis.Domain/Modules/Announcements/Entities/AnnouncementRecipient.cs`
- Create: `src/Oksis.Domain/Modules/Announcements/Entities/AnnouncementAuditEntry.cs`
- Test: `tests/Oksis.Domain.UnitTests/Modules/Announcements/AnnouncementChildEntityTests.cs`

**Interfaces:**
- Consumes: Task 1 `PermanentTenantEntity`, Task 2 enum'ları
- Produces:
  - `AnnouncementTarget.Create(Guid schoolId, Guid announcementId, AudienceDimension dimension, string key, AudienceBucket bucket, string label) → AnnouncementTarget`
  - `AnnouncementRecipient.Create(Guid schoolId, Guid announcementId, Guid personId, string roleAtPublish, Guid? childPersonId) → AnnouncementRecipient`; `recipient.MarkRead(DateTimeOffset now) → void` (idempotent)
  - `AnnouncementAuditEntry.Create(Guid schoolId, Guid announcementId, Guid actorId, string actorName, string action, DateTimeOffset at, string? field, string? tag, string? tone) → AnnouncementAuditEntry`
  - Task 12 üçünü de yazar; Task 15/16 `AnnouncementRecipient` okur.

- [ ] **Step 1: Failing test yaz**

`tests/Oksis.Domain.UnitTests/Modules/Announcements/AnnouncementChildEntityTests.cs`:

```csharp
using FluentAssertions;
using Oksis.Domain.Modules.Announcements.Entities;
using Oksis.Domain.Modules.Announcements.Enums;
using Oksis.Domain.Modules.Announcements.Exceptions;
using Xunit;

namespace Oksis.Domain.UnitTests.Modules.Announcements;

public sealed class AnnouncementChildEntityTests
{
    private static readonly Guid SchoolId = Guid.NewGuid();
    private static readonly Guid AnnouncementId = Guid.NewGuid();
    private static readonly Guid PersonId = Guid.NewGuid();
    private static readonly DateTimeOffset Now = new(2026, 8, 2, 9, 0, 0, TimeSpan.FromHours(3));

    [Fact]
    public void Should_CarryBucket_When_TargetCreated()
    {
        // Hedef donduğu için (INV-2) kaydın kendisi kime gittiğini anlatmalıdır.
        var sut = AnnouncementTarget.Create(
            SchoolId, AnnouncementId, AudienceDimension.Section, "9-A",
            AudienceBucket.Parent, "9-A velileri");

        sut.Dimension.Should().Be(AudienceDimension.Section);
        sut.Key.Should().Be("9-A");
        sut.Bucket.Should().Be(AudienceBucket.Parent);
        sut.Label.Should().Be("9-A velileri");
    }

    [Fact]
    public void Should_Throw_When_TargetKeyIsBlank()
    {
        var act = () => AnnouncementTarget.Create(
            SchoolId, AnnouncementId, AudienceDimension.Section, "  ",
            AudienceBucket.Parent, "9-A velileri");

        act.Should().Throw<AnnouncementDomainException>()
            .Which.Code.Should().Be("Announcements.Target.KeyRequired");
    }

    [Fact]
    public void Should_StartUnread_When_RecipientCreated()
    {
        var sut = AnnouncementRecipient.Create(SchoolId, AnnouncementId, PersonId, "Parent", null);

        sut.IsRead.Should().BeFalse();
        sut.ReadAt.Should().BeNull();
    }

    [Fact]
    public void Should_StampReadAt_When_MarkedRead()
    {
        var sut = AnnouncementRecipient.Create(SchoolId, AnnouncementId, PersonId, "Parent", null);
        sut.MarkRead(Now);

        sut.IsRead.Should().BeTrue();
        sut.ReadAt.Should().Be(Now);
    }

    [Fact]
    public void Should_KeepFirstReadAt_When_MarkedReadTwice()
    {
        // Okuma ekranı her açılışta :read çağırır; ilk okuma anı bozulmamalıdır.
        var sut = AnnouncementRecipient.Create(SchoolId, AnnouncementId, PersonId, "Parent", null);
        sut.MarkRead(Now);
        sut.MarkRead(Now.AddHours(2));

        sut.ReadAt.Should().Be(Now);
    }

    [Fact]
    public void Should_CarryChildPersonId_When_ParentRecipientForClassScoped()
    {
        var childId = Guid.NewGuid();
        var sut = AnnouncementRecipient.Create(SchoolId, AnnouncementId, PersonId, "Parent", childId);

        sut.ChildPersonId.Should().Be(childId);
    }

    [Fact]
    public void Should_CaptureActorAndAction_When_AuditEntryCreated()
    {
        var actorId = Guid.NewGuid();
        var sut = AnnouncementAuditEntry.Create(
            SchoolId, AnnouncementId, actorId, "Ayşe Yılmaz", "duyuruyu yayınladı",
            Now, field: null, tag: null, tone: null);

        sut.ActorId.Should().Be(actorId);
        sut.ActorName.Should().Be("Ayşe Yılmaz");
        sut.Action.Should().Be("duyuruyu yayınladı");
        sut.At.Should().Be(Now);
    }
}
```

- [ ] **Step 2: Testin kırıldığını doğrula**

Run: `dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~AnnouncementChildEntityTests"`
Expected: FAIL — tipler bulunamıyor.

- [ ] **Step 3: `AnnouncementTarget` yaz**

```csharp
using Oksis.Domain.Common;
using Oksis.Domain.Modules.Announcements.Enums;
using Oksis.Domain.Modules.Announcements.Exceptions;

namespace Oksis.Domain.Modules.Announcements.Entities;

/// <summary>
/// Duyurunun hedef katmanlarından biri. YAYIN ANINDAN SONRA DEĞİŞTİRİLEMEZ (INV-2):
/// hedefi yanlış seçilmiş duyuru düzeltilmez, geri çekilip yeniden yayınlanır.
///
/// <para><see cref="Bucket"/> ve <see cref="Label"/> kaydın kendini anlatması içindir —
/// aynı <c>(Dimension, Key)</c> çifti role göre farklı alıcıya çözümlenir ve rol bağlamı
/// yıllar sonra denetim izinden okunurken mevcut olmaz.</para>
/// </summary>
public sealed class AnnouncementTarget : PermanentTenantEntity
{
    public Guid AnnouncementId { get; private set; }
    public AudienceDimension Dimension { get; private set; }
    public string Key { get; private set; } = default!;
    public AudienceBucket Bucket { get; private set; }

    /// <summary>İnsan okunur etiket ("9-A velileri") — yayın anında dondurulur.</summary>
    public string Label { get; private set; } = default!;

    private AnnouncementTarget() { } // EF Core

    public static AnnouncementTarget Create(
        Guid schoolId, Guid announcementId, AudienceDimension dimension,
        string key, AudienceBucket bucket, string label)
    {
        if (string.IsNullOrWhiteSpace(key))
        {
            throw new AnnouncementDomainException(
                "Announcements.Target.KeyRequired", "Hedef anahtarı zorunludur.");
        }

        return new AnnouncementTarget
        {
            SchoolId = schoolId,
            AnnouncementId = announcementId,
            Dimension = dimension,
            Key = key.Trim(),
            Bucket = bucket,
            Label = (label ?? string.Empty).Trim(),
        };
    }
}
```

- [ ] **Step 4: `AnnouncementRecipient` yaz**

```csharp
using Oksis.Domain.Common;

namespace Oksis.Domain.Modules.Announcements.Entities;

/// <summary>
/// Duyurunun tek bir alıcısı. Yayın anında materyalize edilir; gelen kutusu sorgusu ve
/// okundu takibi bu tablodan yürür.
///
/// <para><b>Güvenlik sınırı:</b> gelen kutusu hedef listesi üzerinden istemci tarafında
/// daraltılmaz — <see cref="PersonId"/> eşleşmesiyle sunucuda kesilir (self-only).</para>
/// </summary>
public sealed class AnnouncementRecipient : PermanentTenantEntity
{
    public Guid AnnouncementId { get; private set; }
    public Guid PersonId { get; private set; }

    /// <summary>Yayın anındaki rol etiketi — kişi rol değiştirse de kayıt bozulmaz.</summary>
    public string RoleAtPublish { get; private set; } = default!;

    /// <summary>
    /// Veli satırlarında dolar: duyurunun HANGİ çocuk nedeniyle ulaştığı.
    /// Okul geneli duyuruda null bırakılır — istemci boş listeyi "tüm çocuklar" okur,
    /// böylece üç çocuklu veli okul geneli duyuruyu üç kez görmez (DYR-F-20).
    /// </summary>
    public Guid? ChildPersonId { get; private set; }

    public bool IsRead { get; private set; }
    public DateTimeOffset? ReadAt { get; private set; }

    private AnnouncementRecipient() { } // EF Core

    public static AnnouncementRecipient Create(
        Guid schoolId, Guid announcementId, Guid personId, string roleAtPublish, Guid? childPersonId) =>
        new()
        {
            SchoolId = schoolId,
            AnnouncementId = announcementId,
            PersonId = personId,
            RoleAtPublish = roleAtPublish,
            ChildPersonId = childPersonId,
            IsRead = false,
        };

    /// <summary>
    /// Okundu damgası. IDEMPOTENT — okuma ekranı her açılışta çağırır, ilk okuma anı korunur.
    /// </summary>
    public void MarkRead(DateTimeOffset now)
    {
        if (IsRead)
        {
            return;
        }

        IsRead = true;
        ReadAt = now;
    }
}
```

- [ ] **Step 5: `AnnouncementAuditEntry` yaz**

```csharp
using Oksis.Domain.Common;

namespace Oksis.Domain.Modules.Announcements.Entities;

/// <summary>
/// Denetim izi satırı — DEĞİŞTİRİLEMEZ. Yalnız <see cref="Create"/> vardır; güncelleme
/// metodu YOKTUR. Sezon arşiviyle birlikte saklanır.
/// </summary>
public sealed class AnnouncementAuditEntry : PermanentTenantEntity
{
    public Guid AnnouncementId { get; private set; }
    public Guid ActorId { get; private set; }

    /// <summary>Yayın anındaki ad — sonradan çözülmez, kişi ayrılsa da iz okunur kalır.</summary>
    public string ActorName { get; private set; } = default!;

    /// <summary>Fiil cümlesi ("duyuruyu geri çekti").</summary>
    public string Action { get; private set; } = default!;

    public DateTimeOffset At { get; private set; }

    /// <summary>Etkilenen alan / durum geçişi ("Durum: Yayında → Geri çekildi").</summary>
    public string? Field { get; private set; }

    /// <summary>Ek işaret ("Güncellendi olarak işaretlendi").</summary>
    public string? Tag { get; private set; }

    /// <summary>Görsel vurgu anahtarı: "danger" | "warning" | null.</summary>
    public string? Tone { get; private set; }

    private AnnouncementAuditEntry() { } // EF Core

    public static AnnouncementAuditEntry Create(
        Guid schoolId, Guid announcementId, Guid actorId, string actorName,
        string action, DateTimeOffset at, string? field, string? tag, string? tone) =>
        new()
        {
            SchoolId = schoolId,
            AnnouncementId = announcementId,
            ActorId = actorId,
            ActorName = actorName,
            Action = action,
            At = at,
            Field = field,
            Tag = tag,
            Tone = tone,
        };
}
```

- [ ] **Step 6: Testlerin geçtiğini doğrula**

Run: `dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~AnnouncementChildEntityTests"`
Expected: PASS (7 test)

- [ ] **Step 7: Commit**

```bash
cd /Users/farukkaya/Repositories/oksis-api
dotnet format
git add src/Oksis.Domain/Modules/Announcements/Entities/ tests/Oksis.Domain.UnitTests/Modules/Announcements/
git commit -m "feat(announcements): hedef, alici ve denetim izi entity'leri eklendi

AnnouncementTarget bucket ve label tasir cunku hedef yayin aninda donar
(INV-2) ve rol baglami yillar sonra denetim izinden okunurken mevcut
olmaz. MarkRead idempotenttir: okuma ekrani her acilista cagirir, ilk
okuma ani korunur."
```

---

### Task 5: `AnnouncementTemplate`

**Files:**
- Create: `src/Oksis.Domain/Modules/Announcements/Entities/AnnouncementTemplate.cs`
- Test: `tests/Oksis.Domain.UnitTests/Modules/Announcements/AnnouncementTemplateTests.cs`

**Interfaces:**
- Produces: `AnnouncementTemplate.Create(Guid schoolId, string name, string description, bool urgent) → AnnouncementTemplate`; `template.RegisterUse(DateTimeOffset now) → void`. Task 6 configuration yazar; A3 planı CRUD uçlarını ekler.

- [ ] **Step 1: Failing test yaz**

```csharp
using FluentAssertions;
using Oksis.Domain.Modules.Announcements.Entities;
using Oksis.Domain.Modules.Announcements.Exceptions;
using Xunit;

namespace Oksis.Domain.UnitTests.Modules.Announcements;

public sealed class AnnouncementTemplateTests
{
    private static readonly Guid SchoolId = Guid.NewGuid();
    private static readonly DateTimeOffset Now = new(2026, 8, 2, 9, 0, 0, TimeSpan.FromHours(3));

    [Fact]
    public void Should_StartWithZeroUsage_When_Created()
    {
        var sut = AnnouncementTemplate.Create(SchoolId, "Kar tatili", "Acil kapanış duyurusu", urgent: true);

        sut.UsageCount.Should().Be(0);
        sut.LastUsedAt.Should().BeNull();
        sut.Urgent.Should().BeTrue();
    }

    [Fact]
    public void Should_Throw_When_NameIsBlank()
    {
        var act = () => AnnouncementTemplate.Create(SchoolId, "   ", "açıklama", urgent: false);

        act.Should().Throw<AnnouncementDomainException>()
            .Which.Code.Should().Be("Announcements.Template.NameRequired");
    }

    [Fact]
    public void Should_IncrementUsageAndStampTime_When_Used()
    {
        var sut = AnnouncementTemplate.Create(SchoolId, "Kar tatili", "Acil kapanış", urgent: true);
        sut.RegisterUse(Now);
        sut.RegisterUse(Now.AddDays(1));

        sut.UsageCount.Should().Be(2);
        sut.LastUsedAt.Should().Be(Now.AddDays(1));
    }
}
```

- [ ] **Step 2: Testin kırıldığını doğrula**

Run: `dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~AnnouncementTemplateTests"`
Expected: FAIL — tip bulunamıyor.

- [ ] **Step 3: Entity'yi yaz**

```csharp
using Oksis.Domain.Common;
using Oksis.Domain.Modules.Announcements.Exceptions;

namespace Oksis.Domain.Modules.Announcements.Entities;

/// <summary>
/// Hazır duyuru metni — AYRI aggregate (duyurunun içinde yaşamaz).
/// Yalnız yönetim oluşturur/düzenler; sekreter ve öğretmen kullanır (DYR-F-13).
/// </summary>
public sealed class AnnouncementTemplate : PermanentTenantEntity
{
    public string Name { get; private set; } = default!;
    public string Description { get; private set; } = default!;
    public bool Urgent { get; private set; }

    /// <summary>Kaç kez kullanıldığı — envanterde şablonun değerini gösterir.</summary>
    public int UsageCount { get; private set; }

    public DateTimeOffset? LastUsedAt { get; private set; }

    private AnnouncementTemplate() { } // EF Core

    public static AnnouncementTemplate Create(Guid schoolId, string name, string description, bool urgent)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new AnnouncementDomainException(
                "Announcements.Template.NameRequired", "Şablon adı zorunludur.");
        }

        return new AnnouncementTemplate
        {
            SchoolId = schoolId,
            Name = name.Trim(),
            Description = (description ?? string.Empty).Trim(),
            Urgent = urgent,
            UsageCount = 0,
        };
    }

    public void RegisterUse(DateTimeOffset now)
    {
        UsageCount++;
        LastUsedAt = now;
    }
}
```

- [ ] **Step 4: Testlerin geçtiğini doğrula**

Run: `dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~AnnouncementTemplateTests"`
Expected: PASS (3 test)

- [ ] **Step 5: Tüm domain testlerini çalıştır**

Run: `dotnet test tests/Oksis.Domain.UnitTests`
Expected: PASS — Task 1–5 toplam 22 yeni test, mevcutlarda regresyon yok.

- [ ] **Step 6: Commit**

```bash
cd /Users/farukkaya/Repositories/oksis-api
dotnet format
git add src/Oksis.Domain/Modules/Announcements/Entities/AnnouncementTemplate.cs tests/Oksis.Domain.UnitTests/Modules/Announcements/AnnouncementTemplateTests.cs
git commit -m "feat(announcements): duyuru sablonu entity'si eklendi"
```

---

## Plan dosyaları

Bu plan dört dosyaya bölünmüştür. Sırayla çalıştırılır; her dosya bir öncekinin
tamamlanmış olmasını varsayar. Global Constraints ve dosya yapısı **yalnız bu dosyadadır**.

| Dosya | Görevler | Kapsam |
|---|---|---|
| `2026-08-02-duyurular-a1-omurga.md` (bu dosya) | 1–5 | Domain katmanı |
| `...-omurga-2.md` | 6–9 | EF eşleme + migration, izin anahtarları, DTO'lar, kademe kuralı |
| `...-omurga-3.md` | 10–12 | `IAudienceResolver`, `GET /audience`, `POST /announcements` |
| `...-omurga-4.md` | 13–18 | Envanter, detay, gelen kutusu, okundu damgası, bildirim, duman testi |

**A1 tamamlanma ölçütü 4. dosyanın sonundadır.**
