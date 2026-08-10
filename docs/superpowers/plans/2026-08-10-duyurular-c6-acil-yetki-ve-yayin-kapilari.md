# Duyurular C6 — Acil Yetki Kapısı ve Yayın Anı Kapıları

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Acil (`Urgent`) işaretinin yetki kapısını oluşturma anından **yayın anına** taşımak ve aynı kavşaktaki üç komşu boşluğu (zamanlama×moderasyon, şablon acil kapısı, taslak mahremiyeti) tek dalda kapatmak.

**Architecture:** Bugün kapı yalnız `CreateAnnouncementCommandHandler`'da. `Announcement.Publish()`'in üç çağıranından ikisi (`ApproveAnnouncementCommandHandler`, `PublishScheduledAnnouncementsJob`) bayrağı hiç sorgulamıyor. Çözüm: (1) domain'e `RevokeUrgent()` eklenir, (2) saf bir karar yükleminin (`AnnouncementUrgentGuard`) ve ortak bir yetki çözücünün (`AnnouncementPublisherAuthority`) arkasına alınır, (3) iki yayın yolunda `Publish()` çağrısından **önce** uygulanır. Bayrak düşürülür, istek reddedilmez; denetim izine warning tonlu bir satır yazılır.

**Tech Stack:** .NET 10 / C# 13 · EF Core 10 · MediatR · FluentAssertions + xUnit · Hangfire · MSSQL (LocalDB)

## Global Constraints

- **Türkçe zorunlu:** Kullanıcıya dönen her hata mesajı insan-okunur Türkçedir, i18n anahtarı DEĞİL. Depoda çeviri katmanı yoktur (bkz. `AnnouncementValidatorMessageTests` — kuralı yapısal olarak kilitler).
- **Hata kodu öneki `Announcements.` OLMAK ZORUNDA.** İstemcinin 403 kolu (`oksis-ui` → `packages/api/src/client/mutation-error.ts` → `DOMAIN_FORBIDDEN_CODE_PREFIXES`) sunucunun Türkçe cümlesini yalnız bu önekte ekrana taşır. Başka bir kovaya yazılan kod, kullanıcıya sabit *"Bu işlem için yetkiniz yok."* gösterir.
- **Statü eşlemesi (`ResultExtensions.MapStatusCode`, `Announcements.` kovası):** kod `Forbidden` içeriyorsa 403, `InvalidStatus`/`Session.NotFound`/`Duplicate` içeriyorsa 409, aksi hâlde 400.
- **Rol SORULMAZ.** `ICurrentUser.Roles` bu depoda her zaman boştur, `IsInRole(...)` ölü koddur. "Yönetim mi" sorusunun tek biçimi `announcements.approve` iznidir.
- **Denetim izi aktörü `Guid.Empty` OLAMAZ** (`AnnouncementAuditEntry.Create` domain guard'ı).
- **`field` / `tag` konvansiyonu** (tek kaynak: `AnnouncementAuditWriter` docblock'u): `field` = durum geçişi, `"Durum: {eski} → {yeni}"` biçiminde, ok İÇERİR. `tag` = nitelik damgası, üretilen değerlerde ok İÇERMEZ. `tone` ∈ `"danger" | "warning" | null`.
- **Tenant izolasyonu:** `IgnoreQueryFilters()` yalnız job'ların aday-okul taramasında, var olan tek bilinçli bypass noktasında kullanılır. Yeni bypass eklenmez.
- **AutoMapper, repository wrapper, lazy loading YASAK.** Domain'de EF Core/DataAnnotations YASAK.
- **`dotnet` PATH dışında olabilir:** komutlardan önce `export PATH="$HOME/.dotnet:$PATH"`.
- **Commit formatı:** `<type>(<scope>): türkçe açıklama` — scope `announcements`, sonda nokta yok, Türkçe karakter kullanılmaz (mevcut geçmişle tutarlı: `feat(announcements): acil isareti icin yonetim yetkisi kapisi eklendi`).
- **Her görev sonunda `dotnet build` 0 hata / 0 uyarı olmalı.**

## Alınan kararlar (2026-08-10, kullanıcı)

| # | Soru | Karar |
|---|---|---|
| K1 | Yayın anında yetkisiz `Urgent` bulunursa | **Bayrağı düşür + denetim izine yaz.** Duyuru normal olarak yayınlanır; istek reddedilmez, zamanlanmış duyuru düşmez |
| K2 | Zamanlanmış duyuru moderasyonu atlıyor | **Zamanlamayı reddet.** Onay gerektiren duyuru zamanlanamaz → 400 |
| K3 | Kapsam | Dördü de dâhil: şablon acil kapısı, C5-6 test borcu, backfill, C5-8 taslak mahremiyeti |

## Varsayım (kullanıcıya açıkça bildirildi)

**C5-8 için ürün kararı:** taslak **kişiseldir** — başkasının taslağı yönetim envanterinde de görünmez. Gerekçe: ekran C5 öncesinde kullanıcıya *"listede yalnız siz görürsünüz"* diye söz veriyordu; C5'te sunucu davranışına uymak için **ekran metni** düzeltilmişti. Bu görev tersini yapar: sunucuyu, kullanıcıya verilen asıl söze uydurur. Karar farklı olursa Görev 9 iptal edilir, plan geri kalanı etkilenmez.

---

## File Structure

**Domain (`src/Oksis.Domain`)**
- `Modules/Announcements/Entities/Announcement.cs` — MODIFY: `RevokeUrgent()` eklenir.

**Application (`src/Oksis.Application/Modules/Announcements`)**
- `Common/AnnouncementUrgentGuard.cs` — CREATE: saf karar yüklemi. Tek sorumluluk: "bayrak düşürülmeli mi, düşür."
- `Common/AnnouncementPublisherAuthority.cs` — CREATE: "bu YAYINLAYAN yönetim mi" sorusunun tek cevabı (oturumdaki kullanıcının değil). İzin slug'ı burada sabittir.
- `Commands/ApproveAnnouncement/ApproveAnnouncementCommandHandler.cs` — MODIFY: yayın öncesi kapı + denetim izi damgası.
- `Commands/CreateAnnouncement/CreateAnnouncementCommandHandler.cs` — MODIFY: K2 kapısı + bayat docblock düzeltmesi.
- `Commands/CreateAnnouncementTemplate/CreateAnnouncementTemplateCommandHandler.cs` — MODIFY: şablon acil kapısı.
- `Commands/UpdateAnnouncementTemplate/UpdateAnnouncementTemplateCommandHandler.cs` — MODIFY: şablon acil kapısı.
- `Queries/GetAnnouncements/GetAnnouncementsQueryHandler.cs` — MODIFY: taslak mahremiyeti.

**Infrastructure (`src/Oksis.Infrastructure`)**
- `BackgroundJobs/Jobs/PublishScheduledAnnouncementsJob.cs` — MODIFY: yayın öncesi kapı; izin slug'ı ortak sabite devredilir.
- `BackgroundJobs/Jobs/SweepUnauthorizedUrgentAnnouncementsJob.cs` — CREATE: yayın öncesi kayıtları temizleyen günlük süpürge (backfill'in idempotent hâli).
- `DependencyInjection.cs` — MODIFY: yeni job kaydı.

**API (`src/Oksis.Api`)**
- `Extensions/HangfireSetup.cs` — MODIFY: yeni job'ın recurring kaydı.

**Tests**
- `tests/Oksis.Domain.UnitTests/Modules/Announcements/AnnouncementTests.cs` — MODIFY
- `tests/Oksis.Application.UnitTests/Modules/Announcements/AnnouncementUrgentGuardTests.cs` — CREATE
- `tests/Oksis.Infrastructure.IntegrationTests/Persistence/PublishScheduledAnnouncementsJobTests.cs` — MODIFY
- `tests/Oksis.Infrastructure.IntegrationTests/Persistence/AnnouncementApprovalTests.cs` — MODIFY
- `tests/Oksis.Infrastructure.IntegrationTests/Persistence/CreateAnnouncementTests.cs` — MODIFY
- `tests/Oksis.Infrastructure.IntegrationTests/Persistence/AnnouncementTemplateEndpointTests.cs` — MODIFY
- `tests/Oksis.Infrastructure.IntegrationTests/Persistence/GetAnnouncementsTests.cs` — MODIFY
- `tests/Oksis.Infrastructure.IntegrationTests/Persistence/SweepUnauthorizedUrgentAnnouncementsJobTests.cs` — CREATE

**Docs (`oksis` deposu)**
- `docs/superpowers/specs/2026-08-02-duyurular-uctan-uca-design.md` — MODIFY: §17 kapanışlar + yeni backlog.

---

### Task 1: Domain — `Announcement.RevokeUrgent()`

Acil bayrağını yayın öncesinde düşürebilen tek yol. Setter `private` olduğu için uygulama katmanı bunu kendi yapamaz; kural domain'de yaşar.

**Files:**
- Modify: `src/Oksis.Domain/Modules/Announcements/Entities/Announcement.cs`
- Test: `tests/Oksis.Domain.UnitTests/Modules/Announcements/AnnouncementTests.cs`

**Interfaces:**
- Consumes: —
- Produces: `void Announcement.RevokeUrgent()` — `Draft`/`Scheduled`/`PendingApproval` dışında `AnnouncementDomainException("Announcements.Urgent.RevokeInvalidStatus", …)` fırlatır.

- [ ] **Step 1: Failing test'leri yaz**

`AnnouncementTests.cs`'in sonuna (son `}`'dan önce) ekle. Dosyadaki mevcut kurulum yardımcısının adını önce oku (`AnnouncementTests.cs` içinde `CreateDraft(` çağrısı yapan private helper) ve aynısını kullan; aşağıdaki `Draft(...)` çağrısı o helper'ın yerini tutar — **helper adı farklıysa mevcut adı kullan, yeni helper yazma.**

```csharp
[Fact(DisplayName = "RevokeUrgent taslakta acil bayrağını düşürür")]
public void Should_ClearUrgentFlag_When_RevokedOnDraft()
{
    var sut = Draft(urgent: true);

    sut.RevokeUrgent();

    sut.Urgent.Should().BeFalse();
}

[Fact(DisplayName = "RevokeUrgent yayınlanmış duyuruda reddedilir")]
public void Should_Throw_When_RevokeUrgentAfterPublish()
{
    var sut = Draft(urgent: true);
    sut.Publish(AnnouncementReach.SchoolWide, 3, DateTimeOffset.UtcNow);

    var act = () => sut.RevokeUrgent();

    act.Should().Throw<AnnouncementDomainException>()
        .Which.Code.Should().Be("Announcements.Urgent.RevokeInvalidStatus");
}

[Fact(DisplayName = "RevokeUrgent zaten normal olan duyuruyu bozmaz")]
public void Should_StayFalse_When_RevokeUrgentOnNonUrgentDraft()
{
    var sut = Draft(urgent: false);

    sut.RevokeUrgent();

    sut.Urgent.Should().BeFalse();
}
```

- [ ] **Step 2: Test'in düştüğünü doğrula**

```bash
export PATH="$HOME/.dotnet:$PATH"
dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~RevokeUrgent"
```
Beklenen: DERLEME HATASI — `'Announcement' does not contain a definition for 'RevokeUrgent'`.

- [ ] **Step 3: Metodu ekle**

`Announcement.cs`'te `MarkCreatedFromTemplate` metodundan hemen SONRA:

```csharp
    /// <summary>
    /// Acil işaretini yayın ÖNCESİ düşürür (C6).
    ///
    /// <para><b>Neden domain'de:</b> <see cref="Urgent"/> setter'ı private'tır ve öyle
    /// kalmalıdır — bayrağı serbest bırakmak, onu yazabilecek yerlerin sayısını
    /// <see cref="CreateDraft"/>'tan fazlaya çıkarırdı. Kaldırma ise yayın yolunda gereklidir:
    /// oluşturma anındaki yetki kapısı (<c>CreateAnnouncementCommandHandler</c>) kapıdan ÖNCE
    /// yazılmış kayıtları ve oluşturma ile yayın arasında izni geri alınmış yayınlayanları
    /// görmez.</para>
    ///
    /// <para><b>Yayın SONRASI reddedilir.</b> <see cref="Publish"/>
    /// <see cref="Events.AnnouncementPublishedEvent"/>'i <see cref="Urgent"/> ile birlikte
    /// yaymıştır; bayrağı sonradan düşürmek bildirimi geri almaz, yalnız kaydı olayla
    /// çelişkiye sokardı.</para>
    ///
    /// <para>Olay YAYMAZ ve saat parametresi ALMAZ (<see cref="Restore"/> emsali): hiçbir iş
    /// zamanı yazmaz. Denetim izi çağıranın işidir.</para>
    /// </summary>
    public void RevokeUrgent()
    {
        if (Status is not (AnnouncementStatus.Draft
            or AnnouncementStatus.Scheduled
            or AnnouncementStatus.PendingApproval))
        {
            throw new AnnouncementDomainException(
                "Announcements.Urgent.RevokeInvalidStatus",
                "Acil işareti yalnız yayın öncesinde kaldırılabilir.");
        }

        Urgent = false;
    }
```

- [ ] **Step 4: Test'in geçtiğini doğrula**

```bash
export PATH="$HOME/.dotnet:$PATH"
dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~RevokeUrgent"
```
Beklenen: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add src/Oksis.Domain/Modules/Announcements/Entities/Announcement.cs \
        tests/Oksis.Domain.UnitTests/Modules/Announcements/AnnouncementTests.cs
git commit -m "feat(announcements): acil isareti yayin oncesi kaldirilabilir oldu"
```

---

### Task 2: Saf karar yüklemi — `AnnouncementUrgentGuard`

İki yayın yolunun paylaşacağı karar. Saf tutulur ki koşucusu olmayan job kolunda da test edilebilsin.

**Files:**
- Create: `src/Oksis.Application/Modules/Announcements/Common/AnnouncementUrgentGuard.cs`
- Test: `tests/Oksis.Application.UnitTests/Modules/Announcements/AnnouncementUrgentGuardTests.cs`

**Interfaces:**
- Consumes: `Announcement.RevokeUrgent()` (Task 1)
- Produces: `static bool AnnouncementUrgentGuard.RevokeIfUnauthorized(Announcement announcement, bool publisherIsManager)` — bayrak düşürüldüyse `true`, dokunulmadıysa `false`.

- [ ] **Step 1: Failing test'i yaz**

`tests/Oksis.Application.UnitTests/Modules/Announcements/AnnouncementUrgentGuardTests.cs`:

```csharp
using FluentAssertions;
using Oksis.Application.Modules.Announcements.Common;
using Oksis.Domain.Modules.Announcements.Entities;
using Oksis.Domain.Modules.Announcements.Enums;
using Xunit;

namespace Oksis.Application.UnitTests.Modules.Announcements;

/// <summary>
/// Yayın anı acil kapısının SAF kararı (C6). Yükleminin saf olması zorunludur: iki
/// çağıranından biri <c>PublishScheduledAnnouncementsJob</c>'dır ve job'ın kendi
/// koşucusu bu kararı ayrıca sınayamaz.
/// </summary>
public sealed class AnnouncementUrgentGuardTests
{
    private static Announcement Draft(bool urgent) => Announcement.CreateDraft(
        Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(),
        "Ayşe Yılmaz", "Ayşe Yılmaz · Matematik", "Ayşe Yılmaz",
        AnnouncementType.Classroom, "Sınav duyurusu", "Yarın sınav yapılacaktır.",
        urgent, pinned: false, scheduledAt: null, validUntil: null,
        channels: [DeliveryChannel.InApp]);

    [Fact(DisplayName = "Yayınlayan yönetim değilse acil bayrağı düşer")]
    public void Should_Revoke_When_PublisherIsNotManager()
    {
        var sut = Draft(urgent: true);

        var revoked = AnnouncementUrgentGuard.RevokeIfUnauthorized(sut, publisherIsManager: false);

        revoked.Should().BeTrue();
        sut.Urgent.Should().BeFalse();
    }

    [Fact(DisplayName = "Yayınlayan yönetimse acil bayrağı korunur")]
    public void Should_KeepFlag_When_PublisherIsManager()
    {
        var sut = Draft(urgent: true);

        var revoked = AnnouncementUrgentGuard.RevokeIfUnauthorized(sut, publisherIsManager: true);

        revoked.Should().BeFalse();
        sut.Urgent.Should().BeTrue();
    }

    [Fact(DisplayName = "Acil olmayan duyuruda karar hiç verilmez")]
    public void Should_ReportNoChange_When_AnnouncementIsNotUrgent()
    {
        var sut = Draft(urgent: false);

        var revoked = AnnouncementUrgentGuard.RevokeIfUnauthorized(sut, publisherIsManager: false);

        revoked.Should().BeFalse();
        sut.Urgent.Should().BeFalse();
    }
}
```

- [ ] **Step 2: Test'in düştüğünü doğrula**

```bash
export PATH="$HOME/.dotnet:$PATH"
dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~AnnouncementUrgentGuard"
```
Beklenen: DERLEME HATASI — `The name 'AnnouncementUrgentGuard' does not exist`.

- [ ] **Step 3: Guard'ı yaz**

`src/Oksis.Application/Modules/Announcements/Common/AnnouncementUrgentGuard.cs`:

```csharp
using Oksis.Domain.Modules.Announcements.Entities;

namespace Oksis.Application.Modules.Announcements.Common;

/// <summary>
/// Yayın anı acil kapısı (C6). <c>Announcement.Publish()</c>'in ÜÇ çağıranından ikisi
/// (<c>ApproveAnnouncementCommandHandler</c>, <c>PublishScheduledAnnouncementsJob</c>)
/// oluşturma anındaki kapıyı hiç görmez; bu yüklem onların paylaştığı karardır.
///
/// <para><b>Neden oluşturma kapısı yetmiyor:</b> <c>CreateAnnouncementCommandHandler</c>'ın
/// kapısı isteğin geldiği ANDAKİ yetkiyi ölçer, oysa duyuru günler sonra yayınlanabilir.
/// İki delik ölçüldü (2026-08-10): kapıdan ÖNCE yazılmış <c>scheduled</c>/<c>pendingApproval</c>
/// kayıtlar ve oluşturma ile yayın arasında rol ataması sona eren yayınlayanlar.</para>
///
/// <para><b>Neden REDDETMEK yerine DÜŞÜRMEK</b> (kullanıcı kararı K1, 2026-08-10): yayın
/// anında uyarılacak bir muhatap yoktur — istek çoktan bitmiştir. Reddetmek, zamanlanmış
/// duyurunun hiç çıkmaması demekti. Sessizlik ise çağıranın yazacağı denetim izi satırıyla
/// kapatılır; bu yüzden metot <c>bool</c> döner: çağıran izi ancak karar verildiğinde yazar.</para>
///
/// <para><b>Saf tutulur.</b> "Yayınlayan yönetim mi" sorusunu SORMAZ, cevabını alır —
/// çağıranlardan biri o cevabı toplu bir önbellekten (job), diğeri tek sorgudan (onay handler'ı)
/// üretir. Soruyu buraya taşımak job'ın N+1 kapısını delerdi.</para>
/// </summary>
public static class AnnouncementUrgentGuard
{
    /// <param name="publisherIsManager">
    /// DUYURUYU YAZAN kişinin yönetim yetkisi (<c>announcements.approve</c>) —
    /// oturumdaki kullanıcının DEĞİL. Onay yolunda onaylayan her zaman yöneticidir;
    /// sorulan soru onun değil, yayınlayanın yetkisidir.
    /// </param>
    /// <returns>Bayrak düşürüldüyse <c>true</c>; dokunulmadıysa <c>false</c>.</returns>
    public static bool RevokeIfUnauthorized(Announcement announcement, bool publisherIsManager)
    {
        if (!announcement.Urgent || publisherIsManager)
        {
            return false;
        }

        announcement.RevokeUrgent();
        return true;
    }
}
```

- [ ] **Step 4: Test'in geçtiğini doğrula**

```bash
export PATH="$HOME/.dotnet:$PATH"
dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~AnnouncementUrgentGuard"
```
Beklenen: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add src/Oksis.Application/Modules/Announcements/Common/AnnouncementUrgentGuard.cs \
        tests/Oksis.Application.UnitTests/Modules/Announcements/AnnouncementUrgentGuardTests.cs
git commit -m "feat(announcements): yayin ani acil kapisinin saf karari eklendi"
```

---

### Task 3: Ortak yetki çözücü — `AnnouncementPublisherAuthority`

"Bu YAYINLAYAN yönetim mi" sorusu bugün job'ın içinde gömülü (`_managementPermission` sabiti + `ResolveAsync` argümanları). Onay handler'ı da aynı soruyu soracak; iki kopya zamanla ayrışır.

**Files:**
- Create: `src/Oksis.Application/Modules/Announcements/Common/AnnouncementPublisherAuthority.cs`
- Modify: `src/Oksis.Infrastructure/BackgroundJobs/Jobs/PublishScheduledAnnouncementsJob.cs`
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/PublishScheduledAnnouncementsJobTests.cs` (mevcut testler regresyon bekçisidir — yeni test YAZILMAZ, hepsi geçmeye devam etmeli)

**Interfaces:**
- Consumes: `IAccountPermissionResolver.ResolveAsync(accountId, personId, activeProfileType, activeSeasonId, ct)`, `IApplicationDbContext`
- Produces:
  - `const string AnnouncementPublisherAuthority.ManagementPermission = "announcements.approve"`
  - `static Task<bool> IsManagerAsync(IApplicationDbContext db, IAccountPermissionResolver resolver, Guid schoolId, Guid publisherId, Guid sessionId, CancellationToken ct)`
  - `static Task<bool> IsManagerForAccountAsync(IAccountPermissionResolver resolver, Guid accountId, Guid publisherId, Guid sessionId, CancellationToken ct)`

- [ ] **Step 1: Çözücüyü yaz**

Bu görevde önce üretim kodu yazılır: davranış YENİ DEĞİLDİR — job'ın bugünkü kodundan çıkarılmaktadır ve mevcut job testleri onun bekçisidir. Yeni bir test yazmak, var olan davranışı ikinci kez iddia etmek olurdu.

`src/Oksis.Application/Modules/Announcements/Common/AnnouncementPublisherAuthority.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Modules.Identity.Abstractions;

namespace Oksis.Application.Modules.Announcements.Common;

/// <summary>
/// "DUYURUYU YAZAN kişi yönetim yetkisine sahip mi" sorusunun tek cevabı (C6).
///
/// <para><b>Oturumdaki kullanıcının yetkisiyle KARIŞTIRILMAMALIDIR.</b> Oturum sorusu
/// <c>AnnouncementCallerResolver.IsManagerAsync</c>'tir ve <c>IPermissionReader</c>
/// üzerinden çalışır; o port <c>IHttpContextAccessor</c>'a bağlıdır ve arka plan job'ında
/// HttpContext yoktur. Buradaki soru bir KAYDIN yayınlayanı hakkındadır, "isteği kim
/// gönderdi" hakkında değil — onay yolunda ikisi tanım gereği farklı kişilerdir.</para>
///
/// <para><b>Argümanlar neden bu değerler</b> (gerekçe <c>PublishScheduledAnnouncementsJob</c>'ın
/// metot doc'undan devralındı): <c>activeProfileType: null</c> portal filtresini kapatır —
/// job'ın oturumu yoktur, dolayısıyla yayınlayanın "aktif profili" diye bir şey de yoktur ve
/// uydurulmuş bir değer kişinin gerçek yönetim rolünü sessizce eleyebilirdi.
/// <c>activeSeasonId</c> DUYURUNUN kendi sezonudur — <c>null</c> geçilseydi kişinin GEÇMİŞ bir
/// sezondaki yönetim ataması bugünkü duyuruya yetki kazandırırdı.</para>
///
/// <para><b>Hesap çözülemezse FAIL-CLOSED (<c>false</c>).</b> Job'ın A3'ten beri uyguladığı
/// politika: yetkisi tam olarak doğrulanamayan kimliğe yönetim ayrıcalığı verilmez.</para>
/// </summary>
public static class AnnouncementPublisherAuthority
{
    /// <summary>
    /// Modülde "yönetim yetkisi"nin TEK izin karşılığı. Seed'de yalnız <c>SCHOOL_ADMIN</c>
    /// rolündedir ve anlamı tam olarak "başkasının duyurusu hakkında karar verebilir"dir.
    /// </summary>
    public const string ManagementPermission = "announcements.approve";

    /// <summary>
    /// Tek yayınlayan için: hesabını çözer, iznini sorar. Hesabı yoksa <c>false</c>.
    /// Çağrı başına iki sorgu açar — TOPLU kullanımda
    /// <see cref="IsManagerForAccountAsync"/> tercih edilmelidir.
    /// </summary>
    public static async Task<bool> IsManagerAsync(
        IApplicationDbContext db,
        IAccountPermissionResolver resolver,
        Guid schoolId,
        Guid publisherId,
        Guid sessionId,
        CancellationToken ct)
    {
        var accountId = await db.Persons.AsNoTracking()
            .Where(p => p.SchoolId == schoolId && p.Id == publisherId)
            .Select(p => p.LinkedAccountId)
            .FirstOrDefaultAsync(ct);

        return accountId is { } id
            && await IsManagerForAccountAsync(resolver, id, publisherId, sessionId, ct);
    }

    /// <summary>
    /// Hesabı ZATEN çözülmüş yayınlayan için. Toplu çağıranlar (job) hesap eşlemesini okul
    /// başına TEK sorguda çeker ve bu aşırı yüklemeyi kullanır — aksi hâlde yayınlayan başına
    /// bir <c>Persons</c> sorgusu açılırdı.
    /// </summary>
    public static async Task<bool> IsManagerForAccountAsync(
        IAccountPermissionResolver resolver,
        Guid accountId,
        Guid publisherId,
        Guid sessionId,
        CancellationToken ct)
    {
        var permissions = await resolver.ResolveAsync(
            accountId, publisherId,
            activeProfileType: null,
            activeSeasonId: sessionId,
            ct);

        return permissions.Contains(ManagementPermission);
    }
}
```

- [ ] **Step 2: Job'ı ortak çözücüye bağla**

`PublishScheduledAnnouncementsJob.cs`'te:

1. `using Oksis.Application.Modules.Announcements.Common;` zaten var (`AnnouncementPublicationService` için) — doğrula.
2. `_managementPermission` sabitini ve XML doc'unu **sil** (satır 39-44).
3. `BuildPublisherScopeCacheAsync` içindeki izin çağrısını değiştir:

```csharp
            var isManager = await AnnouncementPublisherAuthority.IsManagerForAccountAsync(
                resolver: permissionResolver,
                accountId: accountId,
                publisherId: key.PublisherId,
                sessionId: key.AcademicSessionId,
                ct: cancellationToken);

            cache[key] = isManager ? null : key.PublisherId;
```

(Eski hâli `permissionResolver.ResolveAsync(...)` + `permissions.Contains(_managementPermission)` idi.)

4. Metot doc'undaki `<see cref="AnnouncementCallerResolver.IsManagerAsync"/>` atfını `<see cref="AnnouncementPublisherAuthority.ManagementPermission"/>` ile değiştir — artık slug orada yaşıyor.

- [ ] **Step 3: Mevcut job testlerinin hâlâ geçtiğini doğrula**

```bash
export PATH="$HOME/.dotnet:$PATH"
dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~PublishScheduledAnnouncementsJobTests"
```
Beklenen: hepsi PASS — özellikle `Should_TreatPublisherAsScoped_When_PublisherAccountIsUnresolvable` (fail-closed kolunun bekçisi).

- [ ] **Step 4: Commit**

```bash
git add src/Oksis.Application/Modules/Announcements/Common/AnnouncementPublisherAuthority.cs \
        src/Oksis.Infrastructure/BackgroundJobs/Jobs/PublishScheduledAnnouncementsJob.cs
git commit -m "refactor(announcements): yayinlayan yetki sorusu ortak coozucuye tasindi"
```

---

### Task 4: Zamanlanmış yayın yolunda kapı

S1'in kapatılması: kapıdan önce yazılmış `scheduled` kayıtlar ve izni geri alınmış yayınlayanlar.

**Files:**
- Modify: `src/Oksis.Infrastructure/BackgroundJobs/Jobs/PublishScheduledAnnouncementsJob.cs`
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/PublishScheduledAnnouncementsJobTests.cs`

**Interfaces:**
- Consumes: `AnnouncementUrgentGuard.RevokeIfUnauthorized` (Task 2), `AnnouncementAuditWriter.Write`, `AnnouncementCaller` ctor
- Produces: yayınlanan duyuruda `Urgent == false` + bir `AnnouncementAuditEntry` (`Action = "acil işareti kaldırıldı"`, `Tone = "warning"`)

- [ ] **Step 1: Failing test'i yaz**

`PublishScheduledAnnouncementsJobTests.cs`'e ekle. Dosyadaki mevcut yardımcıları kullan: `BuildJob`, `GrantSchoolAdminAsync`, `AnnouncementAudienceFixture`, `FixedTimeProvider`. Sahne: **öğretmen** (yönetim yetkisi YOK) acil bir duyuruyu zamanlar — kapıyı atlamak için kayıt `CreateAnnouncementAsAsync` yerine doğrudan domain'den kurulur, çünkü uç zaten reddederdi.

```csharp
    [Fact(DisplayName = "Yetkisiz yayınlayanın zamanladığı acil duyuru acil olmadan yayınlanır")]
    public async Task Should_RevokeUrgent_When_ScheduledPublisherIsNotManager()
    {
        var now = DateTimeOffset.UtcNow;
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync(_database);
        await GrantSchoolAdminAsync(fixture);

        // Kapı OLUŞTURMA ucunda olduğu için kayıt domain'den kurulur: uç bu isteği
        // bugün reddeder, oysa test edilen şey KAPIDAN ÖNCE yazılmış kayıttır.
        var announcement = Announcement.CreateDraft(
            fixture.AdminScope.SchoolId,
            fixture.AdminScope.AcademicSessionId,
            fixture.TeacherPersonId,
            "Ayşe Yılmaz", "Ayşe Yılmaz · Matematik", "Ayşe Yılmaz",
            AnnouncementType.Classroom,
            "Deneme sınavı", "Yarınki deneme sınavı iptal edilmiştir.",
            urgent: true, pinned: false,
            scheduledAt: now.AddMinutes(-1), validUntil: null,
            channels: [DeliveryChannel.InApp]);

        announcement.MarkScheduled(now.AddMinutes(-1));
        fixture.Db.Announcements.Add(announcement);
        fixture.Db.AnnouncementTargets.Add(AnnouncementTarget.Create(
            fixture.AdminScope.SchoolId, announcement.Id,
            AudienceDimension.Role, "parent", AudienceBucket.Parent, "Veliler"));
        await fixture.Db.SaveChangesAsync();

        var (job, db) = BuildJob(now);
        await job.RunAsync(CancellationToken.None);

        var published = await db.Announcements.AsNoTracking()
            .SingleAsync(a => a.Id == announcement.Id);

        published.Status.Should().Be(AnnouncementStatus.Published);
        published.Urgent.Should().BeFalse();

        var audit = await db.AnnouncementAuditEntries.AsNoTracking()
            .Where(e => e.AnnouncementId == announcement.Id)
            .ToListAsync();

        audit.Should().ContainSingle(e => e.Action == "acil işareti kaldırıldı")
            .Which.Tone.Should().Be("warning");
    }

    [Fact(DisplayName = "Yöneticinin zamanladığı acil duyuru acil kalır")]
    public async Task Should_KeepUrgent_When_ScheduledPublisherIsManager()
    {
        var now = DateTimeOffset.UtcNow;
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync(_database);
        await GrantSchoolAdminAsync(fixture);

        var announcement = Announcement.CreateDraft(
            fixture.AdminScope.SchoolId,
            fixture.AdminScope.AcademicSessionId,
            fixture.AdminPersonId,
            "Okul Müdürlüğü", null, "Mustafa Şahin",
            AnnouncementType.Institutional,
            "Kar tatili", "Yarın okulumuz tatil edilmiştir.",
            urgent: true, pinned: false,
            scheduledAt: now.AddMinutes(-1), validUntil: null,
            channels: [DeliveryChannel.InApp]);

        announcement.MarkScheduled(now.AddMinutes(-1));
        fixture.Db.Announcements.Add(announcement);
        fixture.Db.AnnouncementTargets.Add(AnnouncementTarget.Create(
            fixture.AdminScope.SchoolId, announcement.Id,
            AudienceDimension.Role, "parent", AudienceBucket.Parent, "Veliler"));
        await fixture.Db.SaveChangesAsync();

        var (job, db) = BuildJob(now);
        await job.RunAsync(CancellationToken.None);

        var published = await db.Announcements.AsNoTracking()
            .SingleAsync(a => a.Id == announcement.Id);

        published.Status.Should().Be(AnnouncementStatus.Published);
        published.Urgent.Should().BeTrue();
        (await db.AnnouncementAuditEntries.AsNoTracking()
            .AnyAsync(e => e.AnnouncementId == announcement.Id
                && e.Action == "acil işareti kaldırıldı"))
            .Should().BeFalse();
    }
```

> **Fixture uyarısı:** `AnnouncementAudienceFixture`'ın öğretmen/yönetici alan adlarını (`TeacherPersonId`, `AdminPersonId`, `AdminScope`) dosyayı okuyarak doğrula. Ad farklıysa mevcut adı kullan; fixture'a yeni alan EKLEME. Hedef seçimi (`Role`/`parent`) fixture'ın gerçekten veli çözebildiği bir seçim olmalı — dosyadaki mevcut testlerin kullandığı seçimi örnek al; hedef kimseye çözülmezse job duyuruyu yayınlamaz ve test yanlış sebeple düşer.

- [ ] **Step 2: Test'in düştüğünü doğrula**

```bash
export PATH="$HOME/.dotnet:$PATH"
dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~Should_RevokeUrgent_When_ScheduledPublisherIsNotManager"
```
Beklenen: FAIL — `Expected published.Urgent to be false, but found True`.

- [ ] **Step 3: Kapıyı ekle**

`PublishScheduledAnnouncementsJob.RunAsync` içinde, `announcement.Publish(...)` çağrısından **ÖNCE** (materialization ve sıfır-alıcı kontrolünden sonra):

```csharp
                // C6 — YAYIN ANI ACİL KAPISI. Publish() olayı Urgent ile birlikte yayar,
                // bu yüzden kapı ondan ÖNCEDEDİR. Cevap zaten elimizde: scopeCache'te
                // null = "yayınlayan yönetim" (aynı izin, aynı sezon), ek sorgu açılmaz.
                var publisherIsManager =
                    scopeCache[(announcement.PublisherId, announcement.AcademicSessionId)] is null;

                if (AnnouncementUrgentGuard.RevokeIfUnauthorized(announcement, publisherIsManager))
                {
                    // Denetim izinin aktörü YAYINLAYANDIR. Domain Guid.Empty aktörü yasaklar
                    // (AnnouncementAuditEntry.Create) ve job'ın oturumu yoktur; yayınlayan,
                    // bayrağı talep etmiş gerçek kişidir ve kaydın sahibi odur.
                    //
                    // `action` bu modülde İLK EDİLGEN fiil cümlesidir (kardeşleri "duyuruyu
                    // yayınladı", "duyuruyu onayladı"). Bilinçlidir: eylemi yapan sistemdir,
                    // aktör alanı ise onu yapan kişi olmak zorundadır — etken yazmak
                    // yayınlayana yapmadığı bir işi atfederdi.
                    AnnouncementAuditWriter.Write(
                        db, schoolId, announcement.Id,
                        new AnnouncementCaller(
                            announcement.PublisherId,
                            announcement.PublisherRealName ?? announcement.PublisherLabel,
                            isManager: false),
                        action: "acil işareti kaldırıldı",
                        at: now,
                        field: null,
                        tag: "Yayınlayanın acil işareti yetkisi yok",
                        tone: "warning");

                    logger.LogWarning(
                        "Acil işareti yayın öncesi kaldırıldı — yayınlayanın yetkisi yok "
                        + "(announcementId={AnnouncementId}, publisherId={PublisherId}, schoolId={SchoolId}).",
                        announcement.Id, announcement.PublisherId, schoolId);
                }

                announcement.Publish(materialization.Reach, materialization.RecipientCount, now);
```

- [ ] **Step 4: Test'lerin geçtiğini doğrula**

```bash
export PATH="$HOME/.dotnet:$PATH"
dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~PublishScheduledAnnouncementsJobTests"
```
Beklenen: yeni 2 test dâhil hepsi PASS.

- [ ] **Step 5: Commit**

```bash
git add src/Oksis.Infrastructure/BackgroundJobs/Jobs/PublishScheduledAnnouncementsJob.cs \
        tests/Oksis.Infrastructure.IntegrationTests/Persistence/PublishScheduledAnnouncementsJobTests.cs
git commit -m "fix(announcements): zamanlanmis yayinda acil isareti yetkiden gecirilir"
```

---

### Task 5: Onay yolunda kapı

S2'nin kapatılması. Bu kolda gerçek bir aktör (onaylayan yönetici) vardır — iz ayrı satır değil, mevcut "duyuruyu onayladı" satırının damgası olur.

**Files:**
- Modify: `src/Oksis.Application/Modules/Announcements/Commands/ApproveAnnouncement/ApproveAnnouncementCommandHandler.cs`
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/AnnouncementApprovalTests.cs`

**Interfaces:**
- Consumes: `AnnouncementUrgentGuard.RevokeIfUnauthorized` (Task 2), `AnnouncementPublisherAuthority.IsManagerAsync` (Task 3)
- Produces: onay handler'ının ctor'una `IAccountPermissionResolver permissionResolver` parametresi eklenir (son parametre `IDateTimeProvider clock`'tan ÖNCE)

- [ ] **Step 1: Failing test'i yaz**

`AnnouncementApprovalTests.cs`'e ekle. Dosyadaki mevcut kurulum yardımcılarını (onay kuyruğuna duyuru düşüren sahne + `ApproveAnnouncementCommandHandler` kuran yardımcı) önce oku ve aynısını kullan; handler ctor'una yeni parametre eklendiği için o yardımcı da güncellenecek.

```csharp
    [Fact(DisplayName = "Yetkisiz yayınlayanın onaylanan acil duyurusu acil olmadan yayınlanır")]
    public async Task Should_RevokeUrgent_When_ApprovedPublisherIsNotManager()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync(_database);

        // Onay kuyruğuna öğretmen duyurusu düşüren mevcut sahneyi kur, ardından acil
        // bayrağını KAPIDAN BAĞIMSIZ olarak yaz: uç bu isteği bugün reddeder, test edilen
        // şey kapıdan önce yazılmış kayıttır.
        var announcementId = await QueueTeacherAnnouncementAsync(fixture);

        var queued = await fixture.Db.Announcements.SingleAsync(a => a.Id == announcementId);
        typeof(Announcement).GetProperty(nameof(Announcement.Urgent))!
            .SetValue(queued, true);
        await fixture.Db.SaveChangesAsync();

        var result = await ApproveAsync(fixture, announcementId);

        result.IsSuccess.Should().BeTrue();

        var published = await fixture.Db.Announcements.AsNoTracking()
            .SingleAsync(a => a.Id == announcementId);
        published.Urgent.Should().BeFalse();

        var approvalEntry = await fixture.Db.AnnouncementAuditEntries.AsNoTracking()
            .SingleAsync(e => e.AnnouncementId == announcementId && e.Action == "duyuruyu onayladı");
        approvalEntry.Tag.Should().Be("Acil işareti yetkisiz olduğu için kaldırıldı");
        approvalEntry.Tone.Should().Be("warning");
    }
```

> **Yansıma notu:** `Urgent` setter'ı private'tır ve `RevokeUrgent()` yalnız DÜŞÜRÜR — testin kurması gereken sahne ise "kapıdan önce yazılmış acil kayıt"tır. Yansıma bu tek noktada bilinçlidir; üretim kodunda karşılığı yoktur. Daha temiz bir alternatif varsa (ör. fixture'ın domain'den doğrudan `CreateDraft(urgent: true)` + `MarkPendingApproval()` ile kayıt kurması) **onu tercih et** — `QueueTeacherAnnouncementAsync` mevcut değilse zaten o yolu yazacaksın ve yansımaya hiç gerek kalmaz.

- [ ] **Step 2: Test'in düştüğünü doğrula**

```bash
export PATH="$HOME/.dotnet:$PATH"
dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~Should_RevokeUrgent_When_ApprovedPublisherIsNotManager"
```
Beklenen: FAIL — `Expected published.Urgent to be false, but found True`.

- [ ] **Step 3: Handler'a kapıyı ekle**

`ApproveAnnouncementCommandHandler.cs`:

1. `using Oksis.Application.Modules.Identity.Abstractions;` ekle.
2. Ctor'a parametre ekle:

```csharp
public sealed class ApproveAnnouncementCommandHandler(
    IApplicationDbContext db,
    ITenantContext tenant,
    ICurrentUser currentUser,
    IPermissionReader permissionReader,
    IAudienceResolver resolver,
    IAccountPermissionResolver permissionResolver,
    IDateTimeProvider clock)
    : ICommandHandler<ApproveAnnouncementCommand, AnnouncementDto>
```

3. `announcement.Approve(...)` çağrısını saran `try` bloğundan **ÖNCE**:

```csharp
        // C6 — YAYIN ANI ACİL KAPISI. Approve() içinden Publish() çağrılır ve olay Urgent
        // ile birlikte yayılır, bu yüzden kapı ondan ÖNCEDEDİR.
        //
        // Sorulan yetki ONAYLAYANIN değil YAYINLAYANIN yetkisidir. Onaylayan tanım gereği
        // yöneticidir (yukarıdaki caller.IsManager kapısı) — onun yetkisine bakmak kapıyı
        // her zaman açık bırakırdı. Ayrıca onay kuyruğu ekranı acil rozetini bugün hiç
        // göstermiyor (ölçüldü 2026-08-10, oksis-ui approval-queue-tab.tsx), yani
        // "yönetim onayladıysa acili de onaylamıştır" varsayımı da tutmaz.
        var publisherIsManager = await AnnouncementPublisherAuthority.IsManagerAsync(
            db, permissionResolver, schoolId,
            announcement.PublisherId, announcement.AcademicSessionId, cancellationToken);

        var urgentRevoked = AnnouncementUrgentGuard.RevokeIfUnauthorized(
            announcement, publisherIsManager);
```

4. Mevcut denetim izi çağrısını damgala:

```csharp
        AnnouncementAuditWriter.Write(
            db, schoolId, announcement.Id, caller,
            action: "duyuruyu onayladı",
            at: clock.UtcNow,
            field: "Durum: pendingApproval → published",
            // Ayrı bir iz satırı YAZILMAZ: burada gerçek bir aktör (onaylayan) vardır ve
            // konvansiyon gereği `tag` tam olarak bunun içindir — geçiş OLMAYAN bir nitelik
            // damgası. Zamanlanmış yayın kolunda ayrı satır yazılır çünkü orada aktör yoktur.
            tag: urgentRevoked ? "Acil işareti yetkisiz olduğu için kaldırıldı" : null,
            tone: urgentRevoked ? "warning" : null);
```

5. Testlerdeki handler kurulum yardımcısına `new AccountPermissionResolver(db)` argümanını ekle (`PublishScheduledAnnouncementsJobTests.BuildJob` emsali — sahte DEĞİL, gerçek çözücü).

- [ ] **Step 4: Test'lerin geçtiğini doğrula**

```bash
export PATH="$HOME/.dotnet:$PATH"
dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~AnnouncementApprovalTests"
```
Beklenen: yeni test dâhil hepsi PASS.

- [ ] **Step 5: Commit**

```bash
git add src/Oksis.Application/Modules/Announcements/Commands/ApproveAnnouncement/ApproveAnnouncementCommandHandler.cs \
        tests/Oksis.Infrastructure.IntegrationTests/Persistence/AnnouncementApprovalTests.cs
git commit -m "fix(announcements): onaydan gecen duyuruda acil isareti yetkiden gecirilir"
```

---

### Task 6: K2 — onay gerektiren duyuru zamanlanamaz

B2'nin kapatılması. Bugün zamanlama kolu (`:299`) moderasyon kontrolünün (`:315`) ÖNÜNDE dönüyor; eşikli modda öğretmenin velilere zamanladığı duyuru onay kuyruğuna hiç düşmüyor.

**Files:**
- Modify: `src/Oksis.Application/Modules/Announcements/Commands/CreateAnnouncement/CreateAnnouncementCommandHandler.cs`
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/CreateAnnouncementTests.cs`

**Interfaces:**
- Consumes: `IAnnouncementModerationPolicy.RequiresApprovalAsync(schoolId, isScopedPublisher, selections, ct)`
- Produces: yeni hata kodu `Announcements.Schedule.RequiresApproval` → 400 (kod `Forbidden`/`InvalidStatus`/`Duplicate` içermez)

- [ ] **Step 1: Failing test'i yaz**

`CreateAnnouncementTests.cs`'e ekle. Okulun moderasyon modunu `thresholded` yapan mevcut yardımcıyı dosyadan oku ve kullan (`AnnouncementModerationEndpointTests`/`AnnouncementModerationPersistenceTests` de emsal taşır).

```csharp
    [Fact(DisplayName = "Eşikli modda öğretmen velilere giden duyuruyu zamanlayamaz")]
    public async Task Should_Reject_When_ScheduledAnnouncementWouldRequireApproval()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync(_database);
        await SetModerationAsync(fixture, AnnouncementModeration.Thresholded);

        var result = await fixture.CreateAnnouncementResultAsAsync(
            fixture.TeacherAccountId,
            "Veli toplantısı", "Veli toplantısı gelecek hafta yapılacaktır.",
            [("role", "parent", "parent")],
            asDraft: false,
            scheduledAt: DateTimeOffset.UtcNow.AddDays(1).ToString("O"));

        result.IsFailure.Should().BeTrue();
        result.Error!.Code.Should().Be("Announcements.Schedule.RequiresApproval");
        result.Error!.Message.Should().Be(
            "Onay gerektiren duyuru zamanlanamaz; önce onaya gönderin.");

        // Hiçbir satır yazılmamalı: erken dönüş SaveChangesAsync'ten öncedir.
        (await fixture.Db.Announcements.AsNoTracking()
            .AnyAsync(a => a.Title == "Veli toplantısı")).Should().BeFalse();
    }

    [Fact(DisplayName = "Eşikli modda öğretmen öğrencilere giden duyuruyu zamanlayabilir")]
    public async Task Should_Allow_When_ScheduledAnnouncementDoesNotRequireApproval()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync(_database);
        await SetModerationAsync(fixture, AnnouncementModeration.Thresholded);

        var created = await fixture.CreateAnnouncementAsAsync(
            fixture.TeacherAccountId,
            "Ödev hatırlatma", "Ödevlerinizi pazartesi teslim ediniz.",
            [("role", "student", "student")],
            asDraft: false,
            scheduledAt: DateTimeOffset.UtcNow.AddDays(1).ToString("O"));

        created.Status.Should().Be("scheduled");
    }
```

> **Fixture uyarısı:** `CreateAnnouncementResultAsAsync` (ham `Result` dönen kardeş) fixture'da yoksa **ekle** — `CreateAnnouncementAsAsync` başarısızlıkta fırlatıyor olabilir ve negatif kol onunla iddia edilemez. `SetModerationAsync` yoksa okulun `SchoolSettings` moderasyon alanını doğrudan yazan küçük bir yardımcı ekle; mevcut moderasyon testlerindeki kurulumu birebir örnek al.

- [ ] **Step 2: Test'in düştüğünü doğrula**

```bash
export PATH="$HOME/.dotnet:$PATH"
dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~Should_Reject_When_ScheduledAnnouncementWouldRequireApproval"
```
Beklenen: FAIL — `result.IsFailure` false (duyuru bugün sessizce `scheduled` oluyor).

- [ ] **Step 3: Kapıyı ekle**

`CreateAnnouncementCommandHandler.cs`'te:

1. `survivingSelections` bildirimini yukarı taşı — bugün zamanlama kolundan SONRA (`var survivingSelections = surviving.Select(x => x.Selection).ToList();`). Onu `targets` bildiriminin hemen altına al ve **eski bildirimi sil** (iki kez bildirilirse derlenmez).

2. Zamanlama kolunu şu hâle getir:

```csharp
            if (scheduledAt is { } when && when > clock.UtcNow)
            {
                // C6/K2 — ONAY GEREKTİREN DUYURU ZAMANLANAMAZ. Bu kol moderasyon
                // kontrolünün ÖNÜNDEDİR ve öyle kalmalıdır (hedefler henüz donmadı); bu
                // yüzden kontrolün kendisi buraya taşındı, sıra değiştirilmedi.
                //
                // Ölçülen boşluk (2026-08-10): eşikli modda öğretmenin velilere giden
                // duyurusu ileri tarihe zamanlandığında onay kuyruğuna HİÇ düşmüyordu —
                // job vakti gelince doğrudan yayınlıyordu. INV-5 "pendingApproval yalnız
                // thresholded + öğretmen→veli" der; fiiliyatta yazılı olmayan bir
                // "…ve zamanlanmamışsa" şartı vardı.
                //
                // NEDEN ONAYA DÜŞÜRMEK DEĞİL DE REDDETMEK (kullanıcı kararı K2): onaydan
                // sonra zamanı korumak, `Approve()`'un yayınlamak yerine `Scheduled`a
                // geçebilmesini gerektirirdi — yeni bir durum makinesi kolu. Reddetmek
                // kullanıcıya doğru yolu söyler ve tek satırdır.
                if (await moderationPolicy.RequiresApprovalAsync(
                        schoolId, scopedPublisherId is not null, survivingSelections, cancellationToken))
                {
                    return Result<AnnouncementDto>.Failure(new Error(
                        "Announcements.Schedule.RequiresApproval",
                        "Onay gerektiren duyuru zamanlanamaz; önce onaya gönderin."));
                }

                // Zamanlanmış duyuruda alıcı MATERYALİZE EDİLMEZ — liste yayın anında
                // sabitlenir (DYR-K-15), zamanlama anında değil.
                announcement.MarkScheduled(when);
                await db.SaveChangesAsync(cancellationToken);
                return Result<AnnouncementDto>.Success(
                    AnnouncementMapper.ToDto(announcement, targets, null, [], null));
            }
```

3. **Bayat docblock'u düzelt.** Sınıfın `Urgent` kapısı yorumunda (satır ~123-128) şu cümle artık YANLIŞ:
   > *"…yani kapı burada sızdırırsa modülde onu yakalayacak ikinci bir yer yoktur."*

   Yerine:

```csharp
        // TASLAK DA REDDEDİLİR (kapı AsDraft dallanmasının ÖNÜNDEDİR): taslak Urgent = true
        // ile kaydedilebilseydi, aynı kayıt sonradan yayına çıkarken bu kapıyı görmezdi.
        // Urgent'ı YAZAN tek yer Announcement.CreateDraft'tır (AmendAnnouncementCommand
        // dahil hiçbir komut bu alana dokunmaz — ölçüldü).
        //
        // C6 (2026-08-10): artık İKİNCİ bir kapı daha var — AnnouncementUrgentGuard,
        // ApproveAnnouncementCommandHandler ve PublishScheduledAnnouncementsJob'da
        // Publish()'ten hemen önce. Buradaki kapı yine de kaldırılmaz ve ilk savunma
        // hattıdır: yalnız burada çağıranı REDDEDEBİLİR ve ona SEBEBİNİ söyleyebiliriz;
        // yayın anında uyarılacak bir muhatap yoktur, orada bayrak sessizce düşer ve
        // yalnız denetim izine yazılır.
```

- [ ] **Step 4: Test'lerin geçtiğini doğrula**

```bash
export PATH="$HOME/.dotnet:$PATH"
dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~CreateAnnouncementTests"
```
Beklenen: yeni 2 test dâhil hepsi PASS.

- [ ] **Step 5: Commit**

```bash
git add src/Oksis.Application/Modules/Announcements/Commands/CreateAnnouncement/CreateAnnouncementCommandHandler.cs \
        tests/Oksis.Infrastructure.IntegrationTests/Persistence/CreateAnnouncementTests.cs
git commit -m "fix(announcements): onay gerektiren duyuru artik zamanlanamiyor"
```

---

### Task 7: Şablon acil kapısı

B4/S5. `Urgent` şablon tarafında bugün **hiç** kapılı değil; öğretmene acil anahtarını gizleyen yalnız istemci.

**Files:**
- Modify: `src/Oksis.Application/Modules/Announcements/Commands/CreateAnnouncementTemplate/CreateAnnouncementTemplateCommandHandler.cs`
- Modify: `src/Oksis.Application/Modules/Announcements/Commands/UpdateAnnouncementTemplate/UpdateAnnouncementTemplateCommandHandler.cs`
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/AnnouncementTemplateEndpointTests.cs`

**Interfaces:**
- Consumes: `AnnouncementCallerResolver.IsManagerAsync(IPermissionReader, ct)`
- Produces: yeni hata kodu `Announcements.Template.Urgent.Forbidden` → 403 (kod `Forbidden` içerir)

- [ ] **Step 1: Failing test'leri yaz**

```csharp
    [Fact(DisplayName = "Öğretmen acil şablon oluşturamaz")]
    public async Task Should_Reject_When_TeacherCreatesUrgentTemplate()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync(_database);

        var result = await SendAsTeacherAsync(fixture,
            new CreateAnnouncementTemplateCommand("Kar Tatili", "Yarın okul tatildir.", Urgent: true));

        result.IsFailure.Should().BeTrue();
        result.Error!.Code.Should().Be("Announcements.Template.Urgent.Forbidden");
        result.Error!.Message.Should().Be(
            "Acil işareti yalnız okul yönetimi tarafından kullanılabilir.");
    }

    [Fact(DisplayName = "Öğretmen acil olmayan şablon oluşturabilir")]
    public async Task Should_Allow_When_TeacherCreatesNormalTemplate()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync(_database);

        var result = await SendAsTeacherAsync(fixture,
            new CreateAnnouncementTemplateCommand("Ödev hatırlatma", "Ödevleri teslim ediniz.", Urgent: false));

        result.IsSuccess.Should().BeTrue();
        result.Value!.Urgent.Should().BeFalse();
    }

    [Fact(DisplayName = "Öğretmen kendi şablonunu acile çeviremez")]
    public async Task Should_Reject_When_TeacherUpdatesTemplateToUrgent()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync(_database);

        var created = (await SendAsTeacherAsync(fixture,
            new CreateAnnouncementTemplateCommand("Ödev hatırlatma", "Ödevleri teslim ediniz.", Urgent: false)))
            .Value!;

        var result = await SendAsTeacherAsync(fixture,
            new UpdateAnnouncementTemplateCommand(
                Guid.Parse(created.Id), "Ödev hatırlatma", "Ödevleri teslim ediniz.", Urgent: true));

        result.IsFailure.Should().BeTrue();
        result.Error!.Code.Should().Be("Announcements.Template.Urgent.Forbidden");
    }
```

> **Fixture uyarısı:** dosyada şablon komutlarını **öğretmen kimliğiyle** gönderen bir yardımcı olmayabilir (mevcut testler yönetici kimliğiyle koşuyor olabilir). Yoksa `SendAsTeacherAsync` adında bir yardımcı ekle: `AnnouncementAudienceFixture`'ın öğretmen `ICurrentUser` + `IPermissionReader` sahtelerini kullanan mevcut kalıbı örnek al (`PermissionsFor` yardımcısı dosyada mevcuttur). Öğretmenin izin kümesinde `announcements.template.manage` **vardır** (K1) ama `announcements.approve` **yoktur** — testin ayırt ediciliği tam olarak buna dayanır.

- [ ] **Step 2: Test'lerin düştüğünü doğrula**

```bash
export PATH="$HOME/.dotnet:$PATH"
dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~UrgentTemplate"
```
Beklenen: FAIL — `result.IsFailure` false (şablon bugün acil olarak yazılıyor).

- [ ] **Step 3: Kapıları ekle**

**`CreateAnnouncementTemplateCommandHandler.cs`:**

1. Ctor'a `IPermissionReader permissionReader` ekle (son parametre):

```csharp
public sealed class CreateAnnouncementTemplateCommandHandler(
    IApplicationDbContext db,
    ITenantContext tenant,
    ICurrentUser currentUser,
    IPermissionReader permissionReader)
    : ICommandHandler<CreateAnnouncementTemplateCommand, AnnouncementTemplateDto>
```

2. `using Oksis.Application.Modules.Announcements.Common;` ekle.
3. `schoolId` kapısından hemen SONRA, `normalizedName` hesabından ÖNCE:

```csharp
        // C6 — ŞABLON ACİL KAPISI. Duyurudaki kapının (CreateAnnouncementCommandHandler)
        // şablon karşılığı. Olmadan kapı bir adım geriye taşınmış olurdu: yetkisiz bir
        // çağıran acil şablon yazar, "Bu şablonla oluştur" bayrağı forma tohumlar ve
        // duyuru kapısı 403 döner — kullanıcı hiç kuramayacağı bir şablonla karşılaşır.
        //
        // AYNI izin, AYNI cümle: ayrım şablon/duyuru değil YETKİdir, iki farklı metin
        // kullanıcıya iki farklı kural olduğunu düşündürürdü.
        if (request.Urgent
            && !await AnnouncementCallerResolver.IsManagerAsync(permissionReader, cancellationToken))
        {
            return Result<AnnouncementTemplateDto>.Failure(new Error(
                "Announcements.Template.Urgent.Forbidden",
                "Acil işareti yalnız okul yönetimi tarafından kullanılabilir."));
        }
```

**`UpdateAnnouncementTemplateCommandHandler.cs`:** aynı ctor parametresi, aynı `using`, aynı blok — `schoolId` kapısından sonra, şablon sorgusundan önce. Yorumun ilk paragrafını şuna çevir:

```csharp
        // C6 — ŞABLON ACİL KAPISI (create ile aynı kural). Düzenleme kolu da kapılı olmalı:
        // aksi hâlde acil olmayan bir şablon oluşturup hemen acile çevirmek kapıyı delerdi.
```

- [ ] **Step 4: Test'lerin geçtiğini doğrula**

```bash
export PATH="$HOME/.dotnet:$PATH"
dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~AnnouncementTemplateEndpointTests"
```
Beklenen: yeni 3 test dâhil hepsi PASS.

- [ ] **Step 5: Commit**

```bash
git add src/Oksis.Application/Modules/Announcements/Commands/CreateAnnouncementTemplate/CreateAnnouncementTemplateCommandHandler.cs \
        src/Oksis.Application/Modules/Announcements/Commands/UpdateAnnouncementTemplate/UpdateAnnouncementTemplateCommandHandler.cs \
        tests/Oksis.Infrastructure.IntegrationTests/Persistence/AnnouncementTemplateEndpointTests.cs
git commit -m "feat(announcements): sablon acil isareti yonetim yetkisine baglandi"
```

---

### Task 8: C5-6 test borcu — Türkçe cümleyi çivile

Bugün iki test yalnız **kodu** eşliyor (`ResultExtensionsAnnouncementsTests` → `StatusCode == 403`; `CreateAnnouncementTests` negatif kolu → `*Announcements.Urgent.Forbidden*`). Mesajı boşaltan bir mutasyon hiçbir testi düşürmüyor — oysa o cümle C5-6'dan beri fiilen ekrana çıkıyor.

**Files:**
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/CreateAnnouncementTests.cs`

**Interfaces:**
- Consumes: Task 7'nin ürettiği `Announcements.Template.Urgent.Forbidden` cümlesi (Task 7 testleri onu zaten çiviliyor); bu görev **duyuru** kolunun karşılığını ekler.

- [ ] **Step 1: Testi yaz**

Mevcut negatif testi (`Announcements.Urgent.Forbidden` kodunu eşleyen) **bul ve genişlet** — yeni bir test eklemek yerine iddiayı güçlendir:

```csharp
        result.Error!.Code.Should().Be("Announcements.Urgent.Forbidden");
        // C6: mesajın KENDİSİ çivilenir. C5-6'dan beri bu cümle istemcinin 403 kolundan
        // GEÇİYOR (DOMAIN_FORBIDDEN_CODE_PREFIXES → "Announcements.") ve kullanıcının
        // ekranında görünüyor; yalnız kodu eşleyen bir test, cümleyi boşaltan mutasyonu
        // sağ bırakırdı. İstemci testi (mutation-error.test.ts) bu cümleyi bir FIXTURE
        // olarak taşır — sunucunun onu ürettiğini doğrulayan taraf burasıdır.
        result.Error!.Message.Should().Be(
            "Acil işareti yalnız okul yönetimi tarafından kullanılabilir.");
```

- [ ] **Step 2: Mutasyonu ölç**

Üretim kodundaki cümleyi geçici olarak `""` yap, testi koş, düştüğünü GÖR, sonra geri al:

```bash
export PATH="$HOME/.dotnet:$PATH"
# CreateAnnouncementCommandHandler.cs içindeki cümleyi "" yap, sonra:
dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~CreateAnnouncementTests"
```
Beklenen: FAIL. Ardından cümleyi geri al ve testin PASS ettiğini doğrula. **Mutasyon ölçülmeden bu adım tamam sayılmaz** — iddianın gerçekten koruduğunu kanıtlayan tek şey budur.

- [ ] **Step 3: Commit**

```bash
git add tests/Oksis.Infrastructure.IntegrationTests/Persistence/CreateAnnouncementTests.cs
git commit -m "test(announcements): acil kapisinin turkce cumlesi civilendi"
```

---

### Task 9: Yayın öncesi kayıtları süpüren job (backfill'in idempotent hâli)

Yayın anı kapıları (Task 4-5) yayına çıkan her kaydı temizler; ama `draft`/`scheduled`/`pendingApproval` **beklerken** envanterde ve özet sayacında acil görünmeye devam ederler. Tek seferlik bir backfill script'i yerine idempotent günlük süpürge yazılır: aynı işi yapar, ayrıca S3'ün (izin oluşturma ile yayın arasında geri alınıyor) görüntü ayağını da kapatır.

**Files:**
- Create: `src/Oksis.Infrastructure/BackgroundJobs/Jobs/SweepUnauthorizedUrgentAnnouncementsJob.cs`
- Modify: `src/Oksis.Infrastructure/DependencyInjection.cs`
- Modify: `src/Oksis.Api/Extensions/HangfireSetup.cs`
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/SweepUnauthorizedUrgentAnnouncementsJobTests.cs`

**Interfaces:**
- Consumes: `AnnouncementPublisherAuthority` (Task 3), `AnnouncementUrgentGuard` (Task 2)
- Produces: `Task<int> SweepUnauthorizedUrgentAnnouncementsJob.RunAsync(CancellationToken ct)` — temizlenen satır sayısı

- [ ] **Step 1: Failing test'i yaz**

`SweepUnauthorizedUrgentAnnouncementsJobTests.cs`. `PublishScheduledAnnouncementsJobTests`'in `MutableTenantContext` + `BuildJob` kalıbını birebir kopyala (o dosyadaki gerekçe yorumu da geçerlidir: sabit `FakeTenantContext` okul-okul döngüyü taklit edemez).

```csharp
    [Fact(DisplayName = "Yetkisiz yayınlayanın bekleyen acil taslağı temizlenir")]
    public async Task Should_ClearUrgent_When_PendingAnnouncementPublisherIsNotManager()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync(_database);

        var draft = Announcement.CreateDraft(
            fixture.AdminScope.SchoolId, fixture.AdminScope.AcademicSessionId,
            fixture.TeacherPersonId,
            "Ayşe Yılmaz", "Ayşe Yılmaz · Matematik", "Ayşe Yılmaz",
            AnnouncementType.Classroom, "Deneme sınavı", "Deneme sınavı ertelenmiştir.",
            urgent: true, pinned: false, scheduledAt: null, validUntil: null,
            channels: [DeliveryChannel.InApp]);

        fixture.Db.Announcements.Add(draft);
        await fixture.Db.SaveChangesAsync();

        var (job, db) = BuildJob();
        var cleared = await job.RunAsync(CancellationToken.None);

        cleared.Should().Be(1);
        (await db.Announcements.AsNoTracking().SingleAsync(a => a.Id == draft.Id))
            .Urgent.Should().BeFalse();
    }

    [Fact(DisplayName = "Yayınlanmış acil duyuruya dokunulmaz")]
    public async Task Should_LeavePublishedAnnouncementsAlone()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync(_database);

        var published = Announcement.CreateDraft(
            fixture.AdminScope.SchoolId, fixture.AdminScope.AcademicSessionId,
            fixture.TeacherPersonId,
            "Ayşe Yılmaz", "Ayşe Yılmaz · Matematik", "Ayşe Yılmaz",
            AnnouncementType.Classroom, "Sınav sonucu", "Sınav sonuçları açıklanmıştır.",
            urgent: true, pinned: false, scheduledAt: null, validUntil: null,
            channels: [DeliveryChannel.InApp]);

        published.Publish(AnnouncementReach.Classroom, 5, DateTimeOffset.UtcNow);
        fixture.Db.Announcements.Add(published);
        await fixture.Db.SaveChangesAsync();

        var (job, db) = BuildJob();
        var cleared = await job.RunAsync(CancellationToken.None);

        cleared.Should().Be(0);
        (await db.Announcements.AsNoTracking().SingleAsync(a => a.Id == published.Id))
            .Urgent.Should().BeTrue();
    }
```

- [ ] **Step 2: Test'in düştüğünü doğrula**

```bash
export PATH="$HOME/.dotnet:$PATH"
dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~SweepUnauthorizedUrgentAnnouncementsJobTests"
```
Beklenen: DERLEME HATASI — job sınıfı yok.

- [ ] **Step 3: Job'ı yaz**

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Modules.Announcements.Common;
using Oksis.Application.Modules.Identity.Abstractions;
using Oksis.Domain.Modules.Announcements.Enums;

namespace Oksis.Infrastructure.BackgroundJobs.Jobs;

/// <summary>
/// Yayın ÖNCESİ bekleyen duyurulardaki yetkisiz acil işaretlerini temizler (C6).
///
/// <para><b>Neden tek seferlik bir backfill DEĞİL:</b> aynı iş sürekli yeniden doğar.
/// Oluşturma kapısı isteğin geldiği andaki yetkiyi ölçer; bir duyuru günlerce
/// <c>draft</c>/<c>scheduled</c>/<c>pendingApproval</c> bekleyebilir ve bu arada
/// yayınlayanın rol ataması sona erebilir (<c>ExpireRoleAssignmentsJob</c>). Yayın anı
/// kapıları (<c>ApproveAnnouncementCommandHandler</c>, <c>PublishScheduledAnnouncementsJob</c>)
/// bunu yayın anında yakalar — ama o ana kadar kayıt envanterde ve özet kartının
/// <c>UrgentThisMonth</c> sayacında ACİL görünmeye devam eder. Bu job o pencereyi kapatır
/// ve aynı hareketle C5-5'in geriye dönük temizliğini de yapar.</para>
///
/// <para><b>YAYINLANMIŞ duyuruya DOKUNMAZ.</b> <c>Announcement.RevokeUrgent()</c> zaten
/// reddeder: yayın olayı bayrağı taşıyarak yayılmıştır, kaydı sonradan değiştirmek onu
/// gönderilmiş bildirimle çelişkiye sokardı.</para>
///
/// <para>Denetim izi YAZMAZ. Bir sistem süpürgesinin aktörü yoktur ve
/// <c>AnnouncementAuditEntry</c> <c>Guid.Empty</c> aktörü yasaklar; yayın anı kollarında
/// izin yazılabilmesinin sebebi orada gerçek bir kişinin (yayınlayan/onaylayan) bulunmasıdır.
/// Burada iz yerine yapılandırılmış log tutulur.</para>
///
/// <para>Tüm tenant'larda çalışır (<c>PublishScheduledAnnouncementsJob</c> kalıbı): aday
/// okulları bulmak için tek bilinçli global-filter bypass'i, ardından okul başına tenant
/// context sabitleme. İdempotenttir — temizlenen satır ikinci koşuda aday kümede değildir.</para>
/// </summary>
public sealed class SweepUnauthorizedUrgentAnnouncementsJob(
    IApplicationDbContext db,
    ITenantContext tenantContext,
    IAccountPermissionResolver permissionResolver,
    ILogger<SweepUnauthorizedUrgentAnnouncementsJob> logger)
{
    private static readonly AnnouncementStatus[] _prePublishStatuses =
    [
        AnnouncementStatus.Draft,
        AnnouncementStatus.Scheduled,
        AnnouncementStatus.PendingApproval,
    ];

    public async Task<int> RunAsync(CancellationToken cancellationToken)
    {
        // SECURITY: sistem sweep'i henüz bir tenant context'inde değil. Aday okulları
        // bulmak için global filter bypass'i zorunlu — bilinçli, sınırlı tek bypass noktası.
        var candidateSchoolIds = await db.Announcements
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(a => a.Urgent && _prePublishStatuses.Contains(a.Status))
            .Select(a => a.SchoolId)
            .Distinct()
            .ToListAsync(cancellationToken);

        var totalCleared = 0;

        foreach (var schoolId in candidateSchoolIds)
        {
            tenantContext.SetForLoginFlow(schoolId);

            var candidates = await db.Announcements
                .Where(a => a.Urgent && _prePublishStatuses.Contains(a.Status))
                .ToListAsync(cancellationToken);

            // Yetki (yayınlayan, sezon) başına BİR kez çözülür: aynı öğretmenin bekleyen
            // beş duyurusu izin matrisini beş kez okutmamalıdır.
            var authorityCache = new Dictionary<(Guid PublisherId, Guid SessionId), bool>();

            foreach (var announcement in candidates)
            {
                var key = (announcement.PublisherId, announcement.AcademicSessionId);

                if (!authorityCache.TryGetValue(key, out var isManager))
                {
                    isManager = await AnnouncementPublisherAuthority.IsManagerAsync(
                        db, permissionResolver, schoolId,
                        key.PublisherId, key.SessionId, cancellationToken);

                    authorityCache[key] = isManager;
                }

                if (!AnnouncementUrgentGuard.RevokeIfUnauthorized(announcement, isManager))
                {
                    continue;
                }

                totalCleared++;

                logger.LogWarning(
                    "Yayın öncesi acil işareti temizlendi — yayınlayanın yetkisi yok "
                    + "(announcementId={AnnouncementId}, publisherId={PublisherId}, "
                    + "status={Status}, schoolId={SchoolId}).",
                    announcement.Id, announcement.PublisherId, announcement.Status, schoolId);
            }

            await db.SaveChangesAsync(cancellationToken);
        }

        logger.LogInformation(
            "Yetkisiz acil işareti sweep tamamlandı: {Count} duyuru temizlendi ({SchoolCount} okul).",
            totalCleared, candidateSchoolIds.Count);

        return totalCleared;
    }
}
```

- [ ] **Step 4: DI + Hangfire kaydı**

`src/Oksis.Infrastructure/DependencyInjection.cs` — `ExpireAnnouncementsJob` kaydının hemen ALTINA:

```csharp
        services.AddScoped<BackgroundJobs.Jobs.SweepUnauthorizedUrgentAnnouncementsJob>();
```

`src/Oksis.Api/Extensions/HangfireSetup.cs` — `ExpireAnnouncementsJob` kaydının hemen ALTINA (aynı `recurring.AddOrUpdate<...>` kalıbıyla, günlük cron; komşu kayıtların cron biçimini birebir örnek al):

```csharp
        recurring.AddOrUpdate<SweepUnauthorizedUrgentAnnouncementsJob>(
            "announcements-urgent-sweep",
            job => job.RunAsync(CancellationToken.None),
            Cron.Daily());
```

- [ ] **Step 5: Test'lerin geçtiğini doğrula**

```bash
export PATH="$HOME/.dotnet:$PATH"
dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~SweepUnauthorizedUrgentAnnouncementsJobTests"
dotnet build
```
Beklenen: 2 passed, build 0 hata / 0 uyarı.

- [ ] **Step 6: Commit**

```bash
git add src/Oksis.Infrastructure/BackgroundJobs/Jobs/SweepUnauthorizedUrgentAnnouncementsJob.cs \
        src/Oksis.Infrastructure/DependencyInjection.cs \
        src/Oksis.Api/Extensions/HangfireSetup.cs \
        tests/Oksis.Infrastructure.IntegrationTests/Persistence/SweepUnauthorizedUrgentAnnouncementsJobTests.cs
git commit -m "feat(announcements): yayin oncesi yetkisiz acil isaretleri icin gunluk supurge"
```

---

### Task 10: C5-8 — taslak kişiseldir

**⚠ Bu görev bir ÜRÜN KARARINA dayanır** (bkz. plan başındaki Varsayım). Karar farklıysa görev atlanır; planın geri kalanı etkilenmez.

**Files:**
- Modify: `src/Oksis.Application/Modules/Announcements/Queries/GetAnnouncements/GetAnnouncementsQueryHandler.cs`
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/GetAnnouncementsTests.cs`

**Interfaces:**
- Consumes: handler'da hâlihazırda çözülmüş `myPersonId`
- Produces: envanter sorgusu artık başkasının `Draft` kaydını hiçbir kapsamda döndürmez

- [ ] **Step 1: Failing test'i yaz**

```csharp
    [Fact(DisplayName = "Öğretmenin taslağı yönetim envanterinde görünmez")]
    public async Task Should_HideOtherPeoplesDrafts_When_ManagerListsInventory()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync(_database);

        await fixture.CreateAnnouncementAsAsync(
            fixture.TeacherAccountId,
            "Yarım kalan duyuru", "Bu duyuru henüz tamamlanmadı.",
            [("role", "student", "student")],
            asDraft: true);

        var page = await fixture.GetAnnouncementsAsAsync(fixture.AdminAccountId);

        page.Items.Should().NotContain(a => a.Title == "Yarım kalan duyuru");
    }

    [Fact(DisplayName = "Kendi taslağını sahibi görür")]
    public async Task Should_ShowOwnDraft_When_PublisherListsInventory()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync(_database);

        await fixture.CreateAnnouncementAsAsync(
            fixture.TeacherAccountId,
            "Yarım kalan duyuru", "Bu duyuru henüz tamamlanmadı.",
            [("role", "student", "student")],
            asDraft: true);

        var page = await fixture.GetAnnouncementsAsAsync(fixture.TeacherAccountId);

        page.Items.Should().Contain(a => a.Title == "Yarım kalan duyuru");
    }
```

> **Fixture uyarısı:** `GetAnnouncementsAsAsync` yoksa dosyadaki mevcut envanter çağrı kalıbını kullan (`GetAnnouncementsQuery` + handler kurulumu). İkinci test öğretmen için `scope` varsayılanının `"mine"` olduğunu kullanır (`scopedPublisherId is not null` → `"mine"`), o yüzden ayrıca `scope` geçmeye gerek yok.

- [ ] **Step 2: Test'in düştüğünü doğrula**

```bash
export PATH="$HOME/.dotnet:$PATH"
dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~Should_HideOtherPeoplesDrafts_When_ManagerListsInventory"
```
Beklenen: FAIL — taslak bugün yönetim envanterinde görünüyor.

- [ ] **Step 3: Süzgeci ekle**

`GetAnnouncementsQueryHandler.cs`'te, `scope switch` bloğundan hemen SONRA ve statü süzgecinden ÖNCE:

```csharp
        // C6/C5-8 — TASLAK KİŞİSELDİR. Ölçülen boşluk (2026-08-10): temel sorguda hiçbir
        // varsayılan statü kapısı yoktu (yalnız SchoolId), dolayısıyla öğretmenin yarım
        // bıraktığı taslak filtresiz çağrıda yönetimin envanterine düşüyordu.
        //
        // Ekran C5 ÖNCESİNDE kullanıcıya "listede yalnız siz görürsünüz" diye söz veriyordu;
        // C5'te sunucu davranışına uymak için EKRAN METNİ düzeltilmişti. Bu satır tersini
        // yapar: sunucuyu kullanıcıya verilen asıl söze uydurur.
        //
        // `scope: "mine"` kolunda gereksizdir (zaten PublisherId'ye daralmıştır) ama zararsızdır
        // ve koşulu oraya da yazmak, ileride yeni bir kapsam eklendiğinde kuralın unutulmasını
        // engeller — kapı kapsamdan BAĞIMSIZ olarak durur.
        query = query.Where(a => a.Status != AnnouncementStatus.Draft
            || a.PublisherId == myPersonId.Value);
```

- [ ] **Step 4: Test'lerin geçtiğini doğrula**

```bash
export PATH="$HOME/.dotnet:$PATH"
dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~GetAnnouncementsTests"
```
Beklenen: yeni 2 test dâhil hepsi PASS. **Mevcut bir test düşerse dur** — eski davranışa yaslanan bir iddia bulunmuş demektir; onu düzeltmeden önce raporla.

- [ ] **Step 5: Commit**

```bash
git add src/Oksis.Application/Modules/Announcements/Queries/GetAnnouncements/GetAnnouncementsQueryHandler.cs \
        tests/Oksis.Infrastructure.IntegrationTests/Persistence/GetAnnouncementsTests.cs
git commit -m "fix(announcements): taslaklar sahibinden baskasinin envanterinde gorunmuyor"
```

---

### Task 11: Kapanış — tam doğrulama ve belgeler

**Files:**
- Modify: `../oksis/docs/superpowers/specs/2026-08-02-duyurular-uctan-uca-design.md`

- [ ] **Step 1: Tam test koşusu**

```bash
export PATH="$HOME/.dotnet:$PATH"
dotnet build
dotnet test
```
Beklenen: build 0 hata / 0 uyarı; tüm test projeleri yeşil. **Ham sayıları not al** (proje başına geçen/düşen) — spec'e yazılacak.

- [ ] **Step 2: Bekleyen model değişikliği olmadığını doğrula**

```bash
export PATH="$HOME/.dotnet:$PATH"
dotnet ef migrations has-pending-model-changes \
  --project src/Oksis.Infrastructure --startup-project src/Oksis.Api
```
Beklenen: `No changes`. Bu dilim **şema değiştirmez** — migration eklenmemelidir. Çıktı başka bir şey söylerse dur ve raporla.

- [ ] **Step 3: Spec §17'yi güncelle**

`docs/superpowers/specs/2026-08-02-duyurular-uctan-uca-design.md`:

1. **C5-5** satırını `🔴` → **KAPANDI** olarak işaretle; kapanış cümlesi: *"C6 (2026-08-10): kapı yayın anına taşındı — `AnnouncementUrgentGuard`, iki yayın yolunda `Publish()` öncesi. Bayrak düşürülür, denetim izine warning tonlu satır yazılır. Bekleyen kayıtlar için günlük `SweepUnauthorizedUrgentAnnouncementsJob`."*
2. **C5-8** satırını KAPANDI olarak işaretle ve alınan ürün kararını (taslak kişiseldir) yaz.
3. **C5-6**'nın "AÇIK KALAN" kolunu KAPANDI yap — backend artık cümleyi çiviliyor (Task 8, mutasyon ölçüldü).
4. **§14**'e yeni bir satır ekleme; §17'ye **C6 backlog tablosu** aç ve şu maddeleri yaz:
   - **C6-1 — D fazı ön koşulu:** `NotificationEventTypeSeedData` `ANNOUNCEMENT_URGENT`'a `DefaultEmailEnabled: true` verir (normal `ANNOUNCEMENT` `false`), `NotificationConfig.QuietHours*` kalıcı ve düzenlenebilir ama hiçbir teslim yolu okumuyor. `AnnouncementPublished` bildirimini iki olay türünden hangisine eşleyeceğini söyleyen **hiç kod yok** (`ANNOUNCEMENT_URGENT`'ın seed dışında tüketicisi yok, ölçüldü 2026-08-10). K-2 kanalları bağlandığı gün acil = kanal tırmanması olur; eşleme yazılırken C6'nın kapıları oraya da uygulanmalıdır.
   - **C6-2 — Onay kuyruğu acil rozetini göstermiyor:** `oksis-ui` `approval-queue-tab.tsx` içinde `urgent` kelimesi 0 kez geçiyor (ölçüldü 2026-08-10). Onaylayan, acil bir duyuruyu onayladığını ekranda göremiyor. C6 bunu yetkisiz durumda zararsız kıldı, ama YETKİLİ acil duyuruda rozet hâlâ eksik. **`oksis-ui` maddesi.**
   - **C6-3 — Denetim izinde ilk edilgen fiil:** `"acil işareti kaldırıldı"` bu modülün ilk edilgen `action` değeri (kardeşleri "duyuruyu yayınladı" vb.). Aktör yayınlayandır çünkü domain `Guid.Empty` aktörü yasaklar ve job'ın oturumu yoktur. İstemcinin denetim izi çekmecesi cümleyi `"{ActorName} {Action}"` diye kuruyorsa okunuşu bozuk olabilir — **`oksis-ui`'da gözle doğrulanmalı.**
   - **C6-4 — `SweepUnauthorizedUrgentAnnouncementsJob` geri döndürmez:** yönetici acil bir taslak yazıp geçici olarak iznini kaybederse süpürge bayrağı siler ve izin geri geldiğinde **kendiliğinden geri gelmez**. Yayın anı kapısının kararıyla tutarlıdır (o gün de düşerdi), ama kullanıcıya söylenmiyor.
5. **§16 (teslim sınırı) DEĞİŞMEZ** — bu dilim teslim davranışına dokunmaz.

- [ ] **Step 4: Bayat atıf taraması**

```bash
cd /Users/farukkaya/Repositories/oksis-api
grep -rn "ikinci bir yer yoktur\|_managementPermission" src --include="*.cs"
```
Beklenen: **0 satır**. Çıkarsa Task 3/6'da düzeltilmesi gereken bir yer atlanmış demektir.

- [ ] **Step 5: Commit**

```bash
# oksis-api tarafında değişiklik yoksa yalnız oksis deposunda commit
cd /Users/farukkaya/Repositories/oksis
git add docs/superpowers/specs/2026-08-02-duyurular-uctan-uca-design.md \
        docs/superpowers/plans/2026-08-10-duyurular-c6-acil-yetki-ve-yayin-kapilari.md
git commit -m "docs(announcements): c6 kapanisi spec ve backlog'a islendi"
```

---

## Kapsam dışı — bilinçli olarak

| İş | Gerekçe |
|---|---|
| **C5-7 — taslağın çıkmaz sokak olması** | Ayrı bir ürün kararı ve ayrı bir durum makinesi işi. C6'nın yayın anı kapısı, C5-7 düzeltildiğinde **kendiliğinden** taslak yolunu da korur — bağ bu yüzden tek yönlüdür ve C6 önce gelmelidir |
| **`oksis-ui` değişiklikleri** | Bu dilim yalnız backend'dir. C6-2 (acil rozeti) ve C6-3 (edilgen fiilin okunuşu) istemci maddeleridir ve §17'ye yazılır |
| **D fazı kanal bağlama (K-2)** | Kapsam dışı; C6 onun ön koşuludur (C6-1) |
| **Şema değişikliği** | Bu dilim hiçbir kolon/indeks eklemez. `has-pending-model-changes` "No changes" demeli |

---

## Self-Review

**Spec coverage:** Kullanıcının seçtiği dört kapsam maddesinin dördü de bir göreve bağlı — B4 → Task 7, B3 → Task 8, backfill → Task 9, C5-8 → Task 10. K1 kararı Task 4-5'te, K2 kararı Task 6'da. S1 → Task 4, S2 → Task 5, S3 → Task 4+5+9 (üçü birlikte), S4 → kapsam dışı ama Task 1-2 onu ileride bedava kapatıyor, S5 → Task 7. B1 (D fazı) → belge maddesi C6-1. B2 → Task 6. B5 → Task 10.

**Type consistency:** `RevokeUrgent()` (Task 1) → `AnnouncementUrgentGuard.RevokeIfUnauthorized(Announcement, bool)` (Task 2) → çağıranlar Task 4/5/9. `AnnouncementPublisherAuthority.IsManagerAsync` (6 parametre, Task 3) Task 5 ve Task 9'da aynı imzayla çağrılıyor; `IsManagerForAccountAsync` (5 parametre) yalnız Task 3'te job tarafından. Hata kodları: `Announcements.Urgent.RevokeInvalidStatus` (409, iç hata), `Announcements.Schedule.RequiresApproval` (400), `Announcements.Template.Urgent.Forbidden` (403) — üçü de `Announcements.` önekinde, Global Constraints'e uygun.

**Bilinen risk:** Task 4, 5, 6, 7, 9, 10'un testleri `AnnouncementAudienceFixture`'ın bugünkü yardımcı adlarına yaslanıyor. Her görevin ilk adımında fixture dosyası **okunmalı** ve mevcut adlar kullanılmalıdır; plan bunu her ilgili görevde ayrıca uyarıyor. Uydurulmuş bir yardımcı adı derleme hatası verir, sessiz bir yanlışlık üretmez — bu yüzden risk gürültülüdür, tehlikeli değil.
