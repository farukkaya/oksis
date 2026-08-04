# Duyurular A3 — Yardımcı Uçlar, Job'lar ve Ek Dosya (Görev 13–17)

> Bu dosya `2026-08-03-duyurular-a3-yardimci-uclar.md`'nin devamıdır.
> **Global Constraints, doğrulanmış şekiller ve D-1..D-4 düzeltmeleri o dosyadadır ve
> buradaki her görev için de bağlayıcıdır.**

---

## Görev 13: `ExpireAnnouncementsJob` + Hangfire kayıtları

**Files:**
- Create: `src/Oksis.Infrastructure/BackgroundJobs/Jobs/ExpireAnnouncementsJob.cs`
- Create: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/ExpireAnnouncementsJobTests.cs`
- Modify: `src/Oksis.Api/Extensions/HangfireSetup.cs`
- Modify: `src/Oksis.Infrastructure/DependencyInjection.cs`

**Interfaces:**
- Consumes: `Announcement.Expire()` (A2'de yazıldı, D-3 gereği),
  `PublishScheduledAnnouncementsJob` (Görev 11).
- Produces: `ExpireAnnouncementsJob.RunAsync(CancellationToken) → Task<int>`.

**Spec §9:** günlük; `ValidUntil < now` olanları `expired` yapar (INV-6).
**Bildirim ÜRETMEZ** — `Announcement.Expire()` olay yaymaz ve bu bilinçlidir: süresi dolan
bir duyuru bir haber değildir.

**Cron seçimi:** mevcut günlük bantlar 02:xx (davet), 03:xx (rol/token/OTP), 04:00
(soft-delete purge), 04:20 (retention). Çakışmayı önlemek için (background-job-rules §9)
**04:40** seçilir. Zamanlanmış yayın job'ı dakikalıktır: `* * * * *`.

- [ ] **Step 1: Failing job testlerini yaz**

`tests/Oksis.Infrastructure.IntegrationTests/Persistence/ExpireAnnouncementsJobTests.cs`:

```csharp
/// <summary>
/// Süre dolumu job'ı (A3 dilim 7, spec §9 — INV-6).
///
/// <para><b>Bildirim ÜRETMEZ.</b> <c>Announcement.Expire()</c> olay yaymaz; süresi dolan
/// bir duyuru bir haber değildir. Bu, testlerin de doğrulaması gereken bir şeydir —
/// aksi hâlde bir gün eklenen bir olay sessizce her alıcıya bildirim gönderirdi.</para>
/// </summary>
[Collection(DatabaseCollection.Name)]
public sealed class ExpireAnnouncementsJobTests : IAsyncLifetime
{
    /// <summary>
    /// Süresi geçmiş YAYINDAKİ duyuru <c>expired</c> olur.
    /// </summary>
    [Fact]
    public async Task Should_Expire_When_ValidUntilHasPassed() { }

    /// <summary>
    /// Süresi GEÇMEMİŞ duyuruya dokunulmaz. Yüklem düşerse yayındaki her duyuru anında
    /// arşive düşerdi.
    /// </summary>
    [Fact]
    public async Task Should_LeaveUntouched_When_ValidUntilIsInTheFuture() { }

    /// <summary>
    /// <c>ValidUntil</c> NULL olan duyuru asla süresi dolmaz — süresiz duyuru geçerli bir
    /// hâldir ve <c>ValidUntil != null</c> yüklemi olmadan SQL'de null karşılaştırması
    /// sessizce false döner (yani bugün kazara doğru çalışır); yüklem AÇIK olmalıdır ki
    /// niyet okunabilsin.
    /// </summary>
    [Fact]
    public async Task Should_LeaveUntouched_When_ValidUntilIsNull() { }

    /// <summary>
    /// GERİ ÇEKİLMİŞ duyurunun süresi dolmaz: <c>Expire()</c> yalnız <c>Published</c>'ı
    /// kabul eder ve job bu duyuruyu aday kümeye HİÇ almamalıdır — alsaydı domain istisnası
    /// tüm sweep'i düşürürdü.
    /// </summary>
    [Fact]
    public async Task Should_LeaveUntouched_When_AnnouncementIsWithdrawn() { }

    /// <summary>
    /// Süre dolumu bildirim ÜRETMEZ (spec §9). Bu test <c>INotificationEnqueuer</c>'ın
    /// HİÇ çağrılmadığını assert eder.
    ///
    /// <para><b>İzolasyon:</b> duyurunun bağlı hesaplı alıcıları vardır ve test bunu job'ı
    /// koşmadan ÖNCE assert eder — böylece sessizliği "alıcı yok" açıklayamaz.</para>
    /// </summary>
    [Fact]
    public async Task Should_EnqueueNothing_When_AnnouncementsExpire() { }

    /// <summary>Job TÜM okulları gezer (<c>ExpireRoleAssignmentsJob</c> kalıbı).</summary>
    [Fact]
    public async Task Should_ProcessAllSchools_When_MultipleTenantsHaveExpiredAnnouncements() { }

    /// <summary>
    /// İDEMPOTENT: ikinci koşu <c>expired</c> duyuruya yeniden dokunmaz (statü yüklemi
    /// onu aday kümeden çıkarır).
    /// </summary>
    [Fact]
    public async Task Should_BeIdempotent_When_JobRunsTwice() { }
}
```

> **Implementer'a not:** İskelet; her doc yorumundaki iddiayı harfiyen sına. Süresi geçmiş
> duyuru sahnesine GERÇEK yoldan ulaş (`CreateDraft` → `Publish(...)` ile `ValidUntil`
> geçmişte). `RestoreAnnouncementTests.cs` süresi dolmuş duyuru kuran bir sahneye sahip —
> ONU OKU ve kurulumu oradan al.

- [ ] **Step 2: Testlerin DERLENMEDİĞİNİ doğrula**

- [ ] **Step 3: Job'ı yaz**

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Oksis.Application.Common.Abstractions;
using Oksis.Domain.Modules.Announcements.Enums;

namespace Oksis.Infrastructure.BackgroundJobs.Jobs;

/// <summary>
/// Geçerlilik süresi dolan duyuruları arşive çeker (spec §9, INV-6). Günlük sweep.
///
/// <para><b>Bildirim ÜRETMEZ.</b> <c>Announcement.Expire()</c> olay yaymaz — süresi dolan
/// bir duyuru bir haber değildir; alıcı onu zaten görmüştür ve artık gelen kutusunda
/// "süresi doldu" olarak görünür (INV-7: okuyucu yüzeyi <c>published</c> ve <c>expired</c>
/// görür).</para>
///
/// <para>Tüm tenant'larda çalışır (<c>ExpireRoleAssignmentsJob</c> kalıbı). İdempotenttir:
/// <c>expired</c> olan duyuru <c>Status == Published</c> yüklemini geçmez.</para>
/// </summary>
public sealed class ExpireAnnouncementsJob(
    IApplicationDbContext db,
    ITenantContext tenantContext,
    TimeProvider timeProvider,
    ILogger<ExpireAnnouncementsJob> logger)
{
    public async Task<int> RunAsync(CancellationToken cancellationToken)
    {
        var now = timeProvider.GetUtcNow();

        // SECURITY: sistem sweep'i henüz bir tenant context'inde değil — aday okulları
        // bulmak için tek bilinçli global-filter bypass'i.
        var dueSchoolIds = await db.Announcements
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(a => a.Status == AnnouncementStatus.Published
                && a.ValidUntil != null
                && a.ValidUntil < now)
            .Select(a => a.SchoolId)
            .Distinct()
            .ToListAsync(cancellationToken);

        var totalExpired = 0;

        foreach (var schoolId in dueSchoolIds)
        {
            tenantContext.SetForLoginFlow(schoolId);

            var due = await db.Announcements
                .Where(a => a.Status == AnnouncementStatus.Published
                    && a.ValidUntil != null
                    && a.ValidUntil < now)
                .ToListAsync(cancellationToken);

            if (due.Count == 0)
            {
                continue;
            }

            foreach (var announcement in due)
            {
                // Statü yüklemi zaten Published diyor; Expire() yalnız onu kabul eder.
                // İkisi ayrışırsa domain istisnası TÜM sweep'i düşürürdü — bu yüzden
                // yüklem ile domain guard'ı bilinçli olarak AYNI koşulu ifade eder.
                announcement.Expire();
            }

            await db.SaveChangesAsync(cancellationToken);
            totalExpired += due.Count;

            logger.LogInformation(
                "Duyuru süre dolumu: {Count} duyuru arşive çekildi (schoolId={SchoolId}).",
                due.Count, schoolId);
        }

        logger.LogInformation(
            "Duyuru süre dolumu sweep tamamlandı: {Count} duyuru ({SchoolCount} okul).",
            totalExpired, dueSchoolIds.Count);

        return totalExpired;
    }
}
```

- [ ] **Step 4: DI kaydını ekle**

```csharp
        services.AddTransient<BackgroundJobs.Jobs.ExpireAnnouncementsJob>();
```

- [ ] **Step 5: Hangfire recurring kayıtlarını ekle (İKİ job birlikte)**

`src/Oksis.Api/Extensions/HangfireSetup.cs` — cron sabitleri bloğuna:

```csharp
    // Duyuru (A3) — zamanlanmış yayın DAKİKALIK: kullanıcı 14:30'a zamanladıysa 14:30'da
    // çıkmalıdır, 15:00'te değil. Süre dolumu GÜNLÜK ve mevcut 02:xx/03:xx/04:00/04:20
    // bloklarıyla çakışmaması için 04:40'a kademelendirildi (background-job-rules §9).
    private const string CronPublishScheduledAnnouncements = "* * * * *";  // her dakika
    private const string CronExpireAnnouncements = "40 4 * * *";           // her gün 04:40
```

Ve `UseOksisRecurringJobs` içine, yoklama bloğundan sonra:

```csharp
        // Duyuru (A3 dilim 7, spec §9). İkisi de kendi içinde tüm okulları gezer
        // (ExpireRoleAssignmentsJob kalıbı) — job id başına ayrı SchoolId parametresi YOKTUR.
        recurring.AddOrUpdate<PublishScheduledAnnouncementsJob>(
            recurringJobId: "announcements-publish-scheduled",
            methodCall: job => job.RunAsync(CancellationToken.None),
            cronExpression: Cron(config, "AnnouncementsPublishScheduled", CronPublishScheduledAnnouncements),
            options: Options());

        recurring.AddOrUpdate<ExpireAnnouncementsJob>(
            recurringJobId: "announcements-expire",
            methodCall: job => job.RunAsync(CancellationToken.None),
            cronExpression: Cron(config, "AnnouncementsExpire", CronExpireAnnouncements),
            options: Options());
```

- [ ] **Step 6: Testleri koş**

```bash
docker compose up -d garage && ./scripts/init-garage.sh
dotnet build Oksis.slnx
dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~ExpireAnnouncementsJobTests"
```

- [ ] **Step 7: Zorunlu mutasyon denetimi — statü yükleminin ayırt edici olduğunu kanıtla**

`Status == AnnouncementStatus.Published` yüklemini HER İKİ sorgudan GEÇİCİ olarak kaldır ve
testleri koş.
Beklenen: `Should_LeaveUntouched_When_AnnouncementIsWithdrawn` **FAIL** (ve muhtemelen
`Should_BeIdempotent_When_JobRunsTwice` de). Kaç testin öldüğünü rapora yaz.
Mutasyonu GERİ AL.

- [ ] **Step 8: Uygulamanın gerçekten ayağa kalktığını doğrula**

```bash
dotnet run --project src/Oksis.Api 2>&1 | head -40 &
sleep 20
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5112/openapi/v1.json
kill %1
```

Beklenen: 200 ve başlangıç loglarında Hangfire/DI hatası YOK.

> **Not:** Hangfire varsayılan olarak `Hangfire:Enabled = false` ile kapalıdır, yani
> `UseOksisRecurringJobs` dev'de ÇAĞRILMAYABİLİR. Bu durumda kayıtların doğruluğu yalnız
> derlemeyle sınanır — bunu rapora AÇIKÇA yaz ("recurring kaydı çalışma zamanında
> doğrulanamadı, sebep: Hangfire:Enabled=false"), sessizce "doğrulandı" deme.

- [ ] **Step 9: Dört süiti koş, deltaları doğrula, commit**

```bash
git add src/Oksis.Infrastructure/BackgroundJobs/Jobs/ExpireAnnouncementsJob.cs \
        src/Oksis.Infrastructure/DependencyInjection.cs \
        src/Oksis.Api/Extensions/HangfireSetup.cs tests/
git commit -m "feat(api): sure dolumu job'i ve iki duyuru job'inin hangfire kaydi eklendi

Sure dolumu bildirim uretmez (spec §9): Expire() olay yaymaz. Zamanlanmis yayin
dakikalik, sure dolumu 04:40 — mevcut gunluk bantlarla cakismiyor."
```

---

## Görev 14: `AnnouncementEntityScopeResolver` + DI

**Files:**
- Create: `src/Oksis.Application/Modules/Documents/Security/AnnouncementEntityScopeResolver.cs`
- Create: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/AnnouncementAttachmentTests.cs`
- Modify: `src/Oksis.Infrastructure/DependencyInjection.cs`

**Interfaces:**
- Consumes: `IFileEntityScopeResolver` (`string EntityType { get; }` +
  `Task<bool> CanAccessAsync(Guid entityId, FileAccessIntent intent, CancellationToken ct)`),
  `AnnouncementCallerResolver.ResolveMyPersonIdAsync`, `IPermissionReader`.
- Produces: `EntityType => "Announcement"`. Görev 15 `AttachFileCommand`'i bu tiple çağırır.

**Spec §7 adım 5:** *"Okumada `FileAccessGuard`, alıcı olmayanın eke erişimini keser."*

**Kapsam kuralı (Read/Write AYRI — KTK-2):**

| Intent | Kim |
|---|---|
| `Write` (bağlama) | Duyurunun yayınlayanı VEYA yönetim (`announcements.approve`) |
| `Read` (görüntüleme/indirme) | Yayınlayan, yönetim, **VEYA duyurunun bir alıcısı** |

`AttendanceExcuseEntityScopeResolver` Read/Write için AYNI kuralı kullanır; burada
FARKLIDIR ve gerekçesi şudur: 600 alıcının hepsi eki okuyabilmelidir ama hiçbiri duyuruya
başka bir dosya BAĞLAYAMAMALIDIR.

- [ ] **Step 1: Failing testleri yaz**

`tests/Oksis.Infrastructure.IntegrationTests/Persistence/AnnouncementAttachmentTests.cs`:

```csharp
/// <summary>
/// Duyuru eki erişim kapsamı (A3 dilim 8, spec §7 adım 5).
///
/// <para><b>Read ve Write kuralları FARKLIDIR (KTK-2).</b> 600 alıcının hepsi eki
/// okuyabilmelidir ama hiçbiri duyuruya başka bir dosya bağlayamamalıdır.
/// <c>AttendanceExcuseEntityScopeResolver</c> ikisi için aynı kuralı kullanır; burada
/// bilinçli olarak ayrışır.</para>
/// </summary>
[Collection(DatabaseCollection.Name)]
public sealed class AnnouncementAttachmentTests : IAsyncLifetime
{
    [Fact]
    public async Task Should_AllowWrite_When_CallerIsThePublisher() { }

    [Fact]
    public async Task Should_AllowWrite_When_CallerIsManager() { }

    /// <summary>
    /// Alıcı olmak YAZMA hakkı vermez. Bu, Read/Write ayrımının ayırt edici testidir:
    /// aynı kişi aşağıdaki Read testinde İZİNLİ, burada REDDEDİLİR.
    /// </summary>
    [Fact]
    public async Task Should_DenyWrite_When_CallerIsOnlyARecipient() { }

    [Fact]
    public async Task Should_AllowRead_When_CallerIsARecipient() { }

    [Fact]
    public async Task Should_AllowRead_When_CallerIsThePublisher() { }

    /// <summary>
    /// Ne alıcı ne yayınlayan ne yönetim olan biri eki OKUYAMAZ — spec §7 adım 5'in tam
    /// ifadesi. Bu kişi okulda gerçek bir <c>Person</c>'dır (yani ret, "kişi çözülemedi"
    /// yan etkisi DEĞİLDİR).
    /// </summary>
    [Fact]
    public async Task Should_DenyRead_When_CallerIsUnrelatedToTheAnnouncement() { }

    /// <summary>
    /// Var olmayan duyuru kimliği için ret. <c>FileAccessGuard</c> bunu 404'e çevirir —
    /// kaynağın varlığını sızdırmama ilkesi.
    /// </summary>
    [Fact]
    public async Task Should_Deny_When_AnnouncementDoesNotExist() { }

    /// <summary>
    /// BAŞKA OKULUN duyurusu için ret. Alıcı satırı da yayınlayan da tenant filtresinin
    /// arkasındadır; bu test, çözümleyicinin çok kiracılı sınırı gerçekten taşıdığını
    /// gösterir.
    /// </summary>
    [Fact]
    public async Task Should_Deny_When_AnnouncementBelongsToAnotherSchool() { }

    /// <summary>
    /// <c>Person</c>'ı çözülemeyen çağıran REDDEDİLİR — <c>ResolveMyPersonIdAsync</c> null
    /// dönerse "kapsam yok" demektir, "kapsam serbest" değil
    /// (<c>AnnouncementLifecycleGuard</c>'ın aynı ilkesi).
    /// </summary>
    [Fact]
    public async Task Should_Deny_When_CallerHasNoLinkedPerson() { }

    /// <summary>
    /// <c>EntityType</c> tam olarak "Announcement" olmalıdır — <c>FileAccessGuard</c>
    /// çözümleyicileri bu dizeyle bulur ve kayıtsız bir tip DENY'e düşer. Yazım hatası
    /// sessizce her eki erişilemez yapardı.
    /// </summary>
    [Fact]
    public void Should_DeclareAnnouncementEntityType() { }
}
```

- [ ] **Step 2: Testlerin DERLENMEDİĞİNİ doğrula**

- [ ] **Step 3: Çözümleyiciyi yaz**

```csharp
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Modules.Announcements.Common;

namespace Oksis.Application.Modules.Documents.Security;

/// <summary>
/// A3 dilim 8 — <c>"Announcement"</c> entity tipi (<see cref="SchoolEntityScopeResolver"/> ve
/// <see cref="AttendanceExcuseEntityScopeResolver"/>'dan sonra üçüncü canlı çözümleyici).
///
/// <para><b>Read ve Write kuralları FARKLIDIR</b> (dosya-yonetimi-faz5-plan.md KTK-2 —
/// aynı entity için iki intent ayrı kurallara tabi olabilir):</para>
/// <list type="bullet">
/// <item><b>Write</b> (ek bağlama/kaldırma): yayınlayan VEYA yönetim. 600 alıcıdan
/// herhangi biri duyuruya dosya bağlayabilseydi, kurumsal kayıt bir paylaşım alanına
/// dönerdi.</item>
/// <item><b>Read</b> (görüntüleme/indirme): yayınlayan, yönetim, VEYA duyurunun bir
/// ALICISI. Spec §7 adım 5: "alıcı olmayanın eke erişimini keser" — yani alıcının
/// erişimi AÇIKTIR.</item>
/// </list>
///
/// <para>Erişim <c>AnnouncementRecipient</c> satırından okunur, hedef listesinden DEĞİL:
/// alıcı kümesi yayın anında materyalize edilmiş tek gerçektir ve gelen kutusu da onu
/// kullanır (self-only sınırı). Hedefe bakmak, hedefi çözümleyen mantığı ikinci kez
/// yazmak olurdu.</para>
/// </summary>
public sealed class AnnouncementEntityScopeResolver(
    IApplicationDbContext db,
    ICurrentUser currentUser,
    IPermissionReader permissionReader) : IFileEntityScopeResolver
{
    public string EntityType => "Announcement";

    public async Task<bool> CanAccessAsync(
        Guid entityId, FileAccessIntent intent, CancellationToken cancellationToken)
    {
        var announcement = await db.Announcements.AsNoTracking()
            .Where(a => a.Id == entityId)
            .Select(a => new { a.PublisherId })
            .FirstOrDefaultAsync(cancellationToken);

        // Başka okulun duyurusu da buraya düşer: tenant query filter onu görünmez yapar.
        if (announcement is null)
        {
            return false;
        }

        if (await AnnouncementCallerResolver.IsManagerAsync(permissionReader, cancellationToken))
        {
            return true;
        }

        var myPersonId = await AnnouncementCallerResolver.ResolveMyPersonIdAsync(
            db, currentUser.Id, cancellationToken);

        // Person çözülemeyen çağıran REDDEDİLİR: "kapsam yok" demektir, "kapsam serbest"
        // değil (AnnouncementLifecycleGuard'ın aynı ilkesi).
        if (myPersonId is null)
        {
            return false;
        }

        if (announcement.PublisherId == myPersonId.Value)
        {
            return true;
        }

        // Alıcılık YALNIZ okuma hakkı verir.
        if (intent is not FileAccessIntent.Read)
        {
            return false;
        }

        return await db.AnnouncementRecipients.AsNoTracking()
            .AnyAsync(
                r => r.AnnouncementId == entityId && r.PersonId == myPersonId.Value,
                cancellationToken);
    }
}
```

> **Implementer'a not:** `FileAccessIntent`'in gerçek üyelerini
> (`Read`/`Write` mi, başka mı) `FileAccessIntent.cs`'den OKU ve birebir kullan.

- [ ] **Step 4: DI kaydını ekle**

`DependencyInjection.cs` — `AttendanceExcuseEntityScopeResolver` kaydından SONRA:

```csharp
        // A3 dilim 8 — üçüncü tüketici: "Announcement" (duyuru eki). Read ve Write kuralları
        // farklıdır (KTK-2): alıcı OKUR, yalnız yayınlayan/yönetim BAĞLAR.
        services.AddScoped<Application.Modules.Documents.Security.IFileEntityScopeResolver,
            Application.Modules.Documents.Security.AnnouncementEntityScopeResolver>();
```

- [ ] **Step 5: Testleri koş**

- [ ] **Step 6: Zorunlu mutasyon denetimi — Read/Write ayrımını kanıtla**

`if (intent is not FileAccessIntent.Read) { return false; }` satırını GEÇİCİ olarak kaldır
ve testleri koş.
Beklenen: `Should_DenyWrite_When_CallerIsOnlyARecipient` **FAIL** — tam olarak bir test.
Başka test ölmüyorsa ayrım gerçekten tek bir testle korunuyordur ve o test doğru yerdedir.
Mutasyonu GERİ AL.

- [ ] **Step 7: Dört süiti koş, deltaları doğrula, commit**

```bash
git add src/Oksis.Application/Modules/Documents/Security/AnnouncementEntityScopeResolver.cs \
        src/Oksis.Infrastructure/DependencyInjection.cs tests/
git commit -m "feat(api): duyuru eki erisim kapsami cozumleyicisi eklendi

Read ve Write kurallari ayrisir (KTK-2): 600 alici eki okur, yalnizca yayinlayan
ve yonetim baglar. Erisim AnnouncementRecipient satirindan okunur — hedef
cozumleme mantigi ikinci kez yazilmaz."
```

---

## Görev 15: `attachmentFileId` uçtan uca bağlanması

**Files:**
- Modify: `src/Oksis.Application/Modules/Announcements/Commands/CreateAnnouncement/CreateAnnouncementCommandHandler.cs`
- Modify: `src/Oksis.Application/Modules/Announcements/Commands/CreateAnnouncement/CreateAnnouncementCommandValidator.cs`
- Modify: `src/Oksis.Application/Modules/Announcements/Common/AnnouncementMapper.cs`
- Modify: `src/Oksis.Application/Modules/Announcements/Queries/GetAnnouncementById/GetAnnouncementByIdQueryHandler.cs`
- Modify: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/AnnouncementAttachmentTests.cs`
- Modify: `tests/Oksis.Application.UnitTests/Modules/Announcements/CreateAnnouncementCommandValidatorTests.cs`

**Interfaces:**
- Consumes: `Announcement.AttachFile(Guid?)` (mevcut), `AttachFileCommandHandler`
  (`new(db, tenantContext, accessGuard)` — `CreateExcuseCommandHandler:134` emsali),
  `AnnouncementEntityScopeResolver` (Görev 14).
- Produces: `AnnouncementMapper.ToDto(..., AnnouncementAttachmentDto? attachment = null)`.

**Bugünkü gerçek — bu görevin var olma sebebi:** `CreateAnnouncementCommand`
`AttachmentFileId` (string?) alanını ZATEN taşıyor, ama `CreateAnnouncementCommandHandler`
onu **hiç okumuyor**. İstemcinin gönderdiği ek sessizce düşüyor. `AnnouncementMapper` de
`Attachment = null, // A3: Documents entegrasyonu` yazıyor.

**Kategori politikası ZATEN VAR:** `FileCategories.AnnouncementAttachment` —
`["pdf","jpg","png"]`, 10 MB, `RequiresVirusScan: true`, retention 365 gün. `packages/core`
sabiti `ANNOUNCEMENT_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024` ile birebir. **Değiştirme.**

**`url` kararı:** `AnnouncementAttachmentDto.Url` =
**`/api/v1/files/{fileId}/download-url`** (göreli yol).

Gerekçe: imzalı URL'i DTO içinde üretmek, her liste/detay yanıtına uzun ömürlü bir erişim
belirteci gömerdi ve o yanıt önbelleklenebilir. Göreli yol ise istemciyi gerçek indirme
ucundan geçmeye zorlar; orada `IFileAccessGuard` (Görev 14'ün çözümleyicisiyle) **her
istekte** yeniden karar verir. Yani erişim kontrolü tek yerde ve canlı kalır.

- [ ] **Step 1: Failing validator testini yaz**

`CreateAnnouncementCommandValidatorTests.cs`'ye:

```csharp
    /// <summary>
    /// <c>attachmentFileId</c> bir GUID dizesidir. Bozuk bir değer handler'a ulaşırsa
    /// <c>Guid.Parse</c> <c>FormatException</c> atar; handler'ın genel catch'i onu 400'e
    /// çevirir ama mesaj hangi alanın bozuk olduğunu SÖYLEMEZ. Kural validator'da olsun.
    /// </summary>
    [Fact]
    public void Should_Reject_When_AttachmentFileIdIsNotAGuid()
    {
        var result = _sut.Validate(Build(attachmentFileId: "elbette-guid-degil"));

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "AttachmentFileId");
    }

    /// <summary>Ek isteğe bağlıdır — <c>null</c> geçerli bir değerdir.</summary>
    [Fact]
    public void Should_Accept_When_AttachmentFileIdIsNull()
    {
        _sut.Validate(Build(attachmentFileId: null)).IsValid.Should().BeTrue();
    }

    [Fact]
    public void Should_Accept_When_AttachmentFileIdIsAValidGuid()
    {
        _sut.Validate(Build(attachmentFileId: Guid.NewGuid().ToString())).IsValid.Should().BeTrue();
    }
```

> **Implementer'a not:** Dosyadaki `Build(...)` yardımcısının gerçek imzasını OKU ve
> `attachmentFileId` parametresini ona ekle (bugün `AttachmentFileId: null` sabitliyor,
> üç yerde). Var olan çağrıları BOZMA — varsayılan değer ver.

- [ ] **Step 2: Validator kuralını yaz**

```csharp
        // Ek isteğe bağlıdır, ama VERİLDİYSE bir GUID olmalıdır. Bozuk değer handler'da
        // FormatException'a düşer ve genel catch onu hangi alan olduğunu söylemeyen bir
        // 400'e çevirirdi.
        RuleFor(x => x.AttachmentFileId)
            .Must(v => v is null || Guid.TryParse(v, out _))
            .WithMessage("Ek dosya kimliği geçerli bir kimlik olmalıdır.");
```

- [ ] **Step 3: Failing uçtan uca testleri yaz**

`AnnouncementAttachmentTests.cs`'ye ekle:

```csharp
    /// <summary>
    /// <b>BUGÜNKÜ HATA:</b> komut <c>AttachmentFileId</c> taşıyor ama handler onu hiç
    /// okumuyor — istemcinin gönderdiği ek SESSİZCE düşüyor. Bu test o düşmeyi yakalar.
    /// </summary>
    [Fact]
    public async Task Should_PersistAttachmentFileId_When_AnnouncementIsCreatedWithAnAttachment() { }

    /// <summary>
    /// Ek, Documents modülünün <c>FileAttachment</c> tablosuna da BAĞLANIR
    /// (<c>CreateExcuseCommandHandler</c> emsali) — yalnız <c>Announcement.AttachmentFileId</c>
    /// kolonunu doldurmak, dosyayı sahipsiz (orphan) bırakır ve
    /// <c>OrphanUploadCleanupJob</c> onu SİLER.
    /// </summary>
    [Fact]
    public async Task Should_CreateFileAttachmentRow_When_AnnouncementIsCreatedWithAnAttachment() { }

    /// <summary>
    /// Ek bağlanamazsa (dosya yok / statüsü uygun değil / kapsam reddi) duyuru
    /// YAYINLANMAZ ve hata döner. Sessizce eksiz yayınlamak, yayınlayanın "ek gitti"
    /// sanmasına yol açardı — ve duyuru geri çekilemeden düzeltilemez (INV-2 hedefi dondurur,
    /// ama ek metnin bir parçasıdır).
    /// </summary>
    [Fact]
    public async Task Should_FailWithoutPublishing_When_AttachmentCannotBeLinked() { }

    /// <summary>
    /// Kategori YENİDEN doğrulanır: yanlış kategoride yüklenmiş bir dosya (ör.
    /// <c>SchoolLogo</c>) duyuruya bağlanamaz. İstemcinin upload sırasında seçtiği kategori
    /// bir güvenlik sınırı DEĞİLDİR (spec §7: "Backend FileCategoryPolicy ile boyut/tipi
    /// yeniden doğrular").
    /// </summary>
    [Fact]
    public async Task Should_Reject_When_FileCategoryIsNotAnnouncementAttachment() { }

    /// <summary>
    /// Detay ucu eki DTO'ya doldurur: ad, boyut, MIME tipi ve indirme YOLU.
    ///
    /// <para><c>Url</c> GÖRELİ bir yoldur (<c>/api/v1/files/{id}/download-url</c>), imzalı
    /// URL DEĞİL: imzalı URL'i DTO'ya gömmek her yanıta uzun ömürlü bir erişim belirteci
    /// koyardı ve o yanıt önbelleklenebilir. Göreli yol istemciyi gerçek indirme ucundan
    /// geçmeye zorlar; orada <c>IFileAccessGuard</c> HER İSTEKTE yeniden karar verir.</para>
    /// </summary>
    [Fact]
    public async Task Should_PopulateAttachmentDto_When_AnnouncementDetailIsFetched() { }

    /// <summary>
    /// Eki olmayan duyuruda <c>Attachment</c> null döner — boş bir nesne değil
    /// (kontrat <c>AnnouncementAttachmentDto | null</c> der).
    /// </summary>
    [Fact]
    public async Task Should_ReturnNullAttachment_When_AnnouncementHasNoFile() { }

    /// <summary>
    /// <b>LİSTE uçları eki DOLDURMAZ</b> (null döner) — bilinçli. 200 satırlık bir envanter
    /// yanıtı için 200 ek sorgusu N+1 üretirdi ve liste kartında ek gösterilmiyor.
    /// Kontrat null'a izin verir. Bu test o kararı SABİTLER ki bir gün "liste de doldursun"
    /// diye sessizce eklenmesin.
    /// </summary>
    [Fact]
    public async Task Should_LeaveAttachmentNull_When_AnnouncementsAreListed() { }
```

- [ ] **Step 4: `AnnouncementMapper`'ı genişlet**

```csharp
    public static AnnouncementDto ToDto(
        Announcement a,
        IReadOnlyList<AnnouncementTarget> targets,
        bool? isRead,
        IReadOnlyList<Guid> childIds,
        int? seenCount,
        AnnouncementAttachmentDto? attachment = null) =>
        new()
        {
            // ... mevcut alanlar değişmez ...
            Attachment = attachment,
            WithdrawReason = a.WithdrawReason,
        };
```

`Attachment = null, // A3: Documents entegrasyonu` satırı `Attachment = attachment,` olur.

> **Varsayılan parametre BİLİNÇLİDİR:** mevcut on iki çağrı yeri DEĞİŞMEZ ve `null` alır —
> yani liste uçları bugünkü davranışını korur. Yalnız detay ucu değeri geçer. Bu, "liste
> de doldursun" değişikliğinin bir gün SESSİZCE yapılamamasını sağlar: doldurmak için
> çağrı yerini AÇIKÇA değiştirmek gerekir.

- [ ] **Step 5: `GetAnnouncementByIdQueryHandler`'da eki doldur**

Handler'a `AttachmentFileId` doluysa `StoredFile`'ı çeken bir adım eklenir:

```csharp
        AnnouncementAttachmentDto? attachment = null;
        if (announcement.AttachmentFileId is { } fileId)
        {
            attachment = await db.StoredFiles.AsNoTracking()
                .Where(f => f.Id == fileId)
                .Select(f => new AnnouncementAttachmentDto
                {
                    Name = f.OriginalFileName,
                    Size = f.SizeBytes,
                    MimeType = f.ContentType,
                    // GÖRELİ yol — imzalı URL DEĞİL. İmzalı URL'i buraya gömmek her detay
                    // yanıtına uzun ömürlü bir erişim belirteci koyardı ve o yanıt
                    // önbelleklenebilir. Göreli yol istemciyi indirme ucundan geçmeye zorlar;
                    // orada IFileAccessGuard (AnnouncementEntityScopeResolver ile) HER
                    // İSTEKTE yeniden karar verir.
                    Url = $"/api/v1/files/{f.Id}/download-url",
                })
                .FirstOrDefaultAsync(cancellationToken);
        }
```

ve `AnnouncementMapper.ToDto(..., attachment)` çağrılır.

> **Implementer'a not:** `db.StoredFiles` `IApplicationDbContext`'te GERÇEKTEN var mı
> DOĞRULA. Yoksa duyuru sorgusuna Documents DbSet'i eklemek yerine, `FileAttachment`
> üzerinden mi gitmek gerektiğine bak ve **kararı rapora yaz**. `$"..."` interpolasyonunun
> LINQ'e çevrilmediği durumda projeksiyonu bellekte tamamla (Görev 2'nin aynı notu).

- [ ] **Step 6: `CreateAnnouncementCommandHandler`'da eki bağla**

`announcement.Publish(...)`'tan ÖNCE, `db.Announcements.Add(announcement)`'tan sonra:

```csharp
            // Ek dosya (spec §7). İstemci dosyayı Documents ucundan yükledi ve bize KİMLİĞİNİ
            // verdi; biz onu (a) köke iliştiririz ve (b) Documents'in FileAttachment tablosuna
            // BAĞLARIZ. İkincisi zorunludur: yalnız kolonu doldurmak dosyayı sahipsiz bırakır
            // ve OrphanUploadCleanupJob onu SİLER (CreateExcuseCommandHandler emsali).
            if (!string.IsNullOrWhiteSpace(request.AttachmentFileId)
                && Guid.TryParse(request.AttachmentFileId, out var attachmentFileId))
            {
                // Kategori YENİDEN doğrulanır — istemcinin upload sırasında seçtiği kategori
                // bir güvenlik sınırı değildir (spec §7).
                var category = await db.StoredFiles.AsNoTracking()
                    .Where(f => f.Id == attachmentFileId)
                    .Select(f => f.Category)
                    .FirstOrDefaultAsync(cancellationToken);

                if (category != FileCategories.AnnouncementAttachment)
                {
                    return Result<AnnouncementDto>.Failure(new Error(
                        "Announcements.Attachment.InvalidCategory",
                        "Ek dosya duyuru eki olarak yüklenmiş olmalıdır."));
                }

                announcement.AttachFile(attachmentFileId);

                // Kimliğin gerçek olması için önce kaydet (CreateExcuseCommandHandler'ın
                // aynı sırası): FileAttachment.EntityId var olmayan bir duyuruya
                // bağlanamaz.
                await db.SaveChangesAsync(cancellationToken);

                var attachHandler = new AttachFileCommandHandler(db, tenantContext, accessGuard);
                var attachResult = await attachHandler.Handle(
                    new AttachFileCommand(attachmentFileId, "Announcement", announcement.Id),
                    cancellationToken);

                if (attachResult.IsFailure)
                {
                    // Ek bağlanamazsa duyuru YAYINLANMAZ. Sessizce eksiz yayınlamak,
                    // yayınlayanın "ek gitti" sanmasına yol açardı ve ek, metnin bir
                    // parçasıdır — INV-2 hedefi dondurur ama içeriği düzeltmek
                    // :withdraw gerektirir.
                    return Result<AnnouncementDto>.Failure(attachResult.Error);
                }
            }
```

> **Implementer'a DİKKAT — iki gerçek sorun ve nasıl ele alacağın:**
>
> 1. **Handler'a iki yeni bağımlılık gerekiyor** (`ITenantContext` zaten var mı bak;
>    `IFileAccessGuard` kesinlikle yok). Ekle ve DI'ın onları çözdüğünü doğrula.
> 2. **Ara `SaveChangesAsync` mevcut tek-transaction anlatısını böler.** Bugün handler
>    doc'u "TEK TRANSACTION içinde yayınlar" diyor. Ek akışı bir ara kaydetme getiriyor:
>    ek bağlanamazsa duyuru TASLAK olarak veritabanında KALIR (yayınlanmamış, alıcısız).
>    Bu kabul edilebilir mi? **Kararı sen ver, gerekçesini yaz ve handler doc'unu
>    GÜNCELLE** — yanlış olan, doc'un anlatısıyla kodun ayrışmasıdır. Alternatif:
>    `AttachFileCommandHandler` yerine `FileAttachment.Create(...)`'ı doğrudan çağırıp
>    `db.FileAttachments.Add(...)` demek ve ara kaydetmeyi hiç yapmamak — ama o zaman
>    `IFileAccessGuard` kontrolünü ATLAMIŞ olursun, ki bu yolda çağıran zaten duyurunun
>    yayınlayanı olduğu için güvenlik açığı DEĞİLDİR. **İki seçeneği de tart, birini seç,
>    seçmediğini neden seçmediğini yaz.** Bu, bu görevin tek gerçek tasarım kararıdır.

- [ ] **Step 7: Testleri koş**

- [ ] **Step 8: Zorunlu mutasyon denetimi — sessiz düşmenin gerçekten kapandığını kanıtla**

`announcement.AttachFile(attachmentFileId);` satırını GEÇİCİ olarak kaldır (yani A3 ÖNCESİ
davranışa dön) ve testleri koş.
Beklenen: `Should_PersistAttachmentFileId_...` **VE**
`Should_PopulateAttachmentDto_...` kırılır.
Bu, "bugünkü hata"nın gerçekten bir hata olduğunu ve testlerin onu yakaladığını kanıtlar.
Mutasyonu GERİ AL.

- [ ] **Step 9: Dört süiti koş, deltaları doğrula, commit**

```bash
git add src/Oksis.Application/Modules/Announcements/ tests/
git commit -m "feat(api): duyuru eki uctan uca baglandi

AttachmentFileId komutta vardi ama handler onu sessizce dusuruyordu. Artik koke
ilistirilir VE Documents'in FileAttachment tablosuna baglanir (yoksa
OrphanUploadCleanupJob dosyayi siler). Kategori yeniden dogrulanir. DTO'daki url
goreli yoldur: imzali URL'i yanita gommek her detay cevabina uzun omurlu bir
erisim belirteci koyardi."
```

---

## Görev 16: `AnnouncementCaller` kapısı + create handler'ın ortak yola alınması

**Files:**
- Modify: `src/Oksis.Application/Modules/Announcements/Common/AnnouncementLifecycleGuard.cs`
- Modify: `src/Oksis.Application/Modules/Announcements/Commands/CreateAnnouncement/CreateAnnouncementCommandHandler.cs`
- Modify: `src/Oksis.Application/Modules/Announcements/Common/AnnouncementAuditWriter.cs` (doc)
- Modify: ilgili testler

**Bu görev A2 nihai incelemesinin ÜÇ fix-next maddesini kapatır** (ledger'dan birebir):

1. *"`AnnouncementCaller`'ın public primary ctor'u korumasız; `CanActOn` PersonId'nin boş
   olmamasına güveniyor. Altı tüketici artık var → internal görünürlük veya guard."*
2. *"`CreateAnnouncementCommandHandler` altıncı yazma yeri ama iki ortak yardımcıyı da
   BYPASS ediyor: `ResolveCallerAsync` kullanmıyor, aktör adını ÜÇ KEZ sorguluyor, bir izi
   writer'dan bir izi doğrudan yazıyor."*
3. *"`AnnouncementAuditWriter`'ın doc'undaki iddia şu an yanlış"* (— "ek sorgu YAPMAZ"
   diyor ama create handler üç kez sorguluyor).

**Kritik uyarı — bu bir REFACTOR'dür, davranış DEĞİŞMEZ.** `CreateAnnouncementCommandHandler`
A1'in en çok gözden geçirilmiş kodudur ve içinde birden fazla düzeltilmiş defect'in
gerekçesi yorum olarak yaşıyor. **Hiçbir yorumu silme.** Çıkış kriteri: `CreateAnnouncementTests`
ve `AnnouncementEndToEndTests` **TEK BİR TEST DEĞİŞMEDEN** yeşil kalır.

- [ ] **Step 1: `AnnouncementCaller`'a guard ekle (failing test önce)**

Yeni birim testi (`tests/Oksis.Application.UnitTests/Modules/Announcements/`):

```csharp
/// <summary>
/// A2 nihai incelemesi devri: <c>AnnouncementCaller</c>'ın primary ctor'u korumasızdı ve
/// <c>CanActOn</c> <c>PersonId</c>'nin boş olmamasına güveniyordu. Altı tüketici var; bir
/// gün biri <c>ResolveCallerAsync</c>'i atlayıp <c>PersonId = Guid.Empty</c> ile bir caller
/// üretirse, <c>CanActOn</c> "yayınlayan bu kişi mi" sorusunu <c>Guid.Empty</c> ile
/// karşılaştırır ve sahipsiz bir duyuruda YANLIŞLIKLA true dönebilirdi.
/// </summary>
public sealed class AnnouncementCallerTests
{
    [Fact]
    public void Should_Reject_When_PersonIdIsEmpty()
    {
        var act = () => new AnnouncementCaller(Guid.Empty, "Ayşe Yılmaz", IsManager: false);

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Should_Reject_When_DisplayNameIsBlank()
    {
        var act = () => new AnnouncementCaller(Guid.NewGuid(), "   ", IsManager: false);

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Should_Construct_When_FieldsAreValid()
    {
        var personId = Guid.NewGuid();

        var caller = new AnnouncementCaller(personId, "Ayşe Yılmaz", IsManager: true);

        caller.PersonId.Should().Be(personId);
        caller.DisplayName.Should().Be("Ayşe Yılmaz");
        caller.IsManager.Should().BeTrue();
    }
}
```

Ve guard:

```csharp
public sealed record AnnouncementCaller
{
    public AnnouncementCaller(Guid personId, string displayName, bool isManager)
    {
        // A2 fix-next: primary ctor korumasızdı. `CanActOn` "yayınlayan bu kişi mi"
        // sorusunu PersonId ile sorar; Guid.Empty taşıyan bir caller, PublisherId'si
        // bir şekilde boş olan bir kayıtta yanlışlıkla sahip sayılırdı. Domain'de
        // AnnouncementRecipient.Create ve AnnouncementAuditEntry.Create AYNI kapıyı
        // kapatıyor — bu, uygulama katmanındaki karşılığıdır.
        if (personId == Guid.Empty)
        {
            throw new ArgumentException("Çağıranın kişi kimliği zorunludur.", nameof(personId));
        }

        if (string.IsNullOrWhiteSpace(displayName))
        {
            throw new ArgumentException("Çağıranın görünen adı zorunludur.", nameof(displayName));
        }

        PersonId = personId;
        DisplayName = displayName;
        IsManager = isManager;
    }

    public Guid PersonId { get; }

    /// <summary>Denetim izine yazılır ve çözüm anında DONAR — kişi sonradan okuldan
    /// ayrılsa bile iz okunur kalır.</summary>
    public string DisplayName { get; }

    public bool IsManager { get; }
}
```

> **Implementer'a not:** `record`'un `with` ifadesi ve eşitliği bu yazımla da çalışır ama
> derleyici davranışını DOĞRULA (init-only property'ler yerine get-only kullanıldı).
> Mevcut altı tüketicinin hiçbiri `with` kullanmıyorsa sorun yoktur; kullanan varsa
> `sealed record` yerine ne gerekiyorsa onu kullan ve rapora yaz.

- [ ] **Step 2: Testlerin geçtiğini ve MEVCUT testlerin kırılmadığını doğrula**

```bash
dotnet build Oksis.slnx
dotnet test tests/Oksis.Application.UnitTests
dotnet test tests/Oksis.Infrastructure.IntegrationTests
```

Beklenen: entegrasyon süitinde **hiçbir regresyon yok**. Bir test kırılıyorsa, o test
`Guid.Empty` taşıyan bir caller üretiyordur — **testi zayıflatma**, neden öyle kurulduğunu
araştır ve rapora yaz.

- [ ] **Step 3: `CreateAnnouncementCommandHandler`'ı ortak yola al**

Üç değişiklik, hepsi DAVRANIŞI KORUYARAK:

**(a)** `ResolveMyPersonIdAsync` + ayrı ad sorguları yerine `ResolveCallerAsync`:

```csharp
        var callerResult = await AnnouncementLifecycleGuard.ResolveCallerAsync(
            db, currentUser, permissionReader, cancellationToken);
        if (callerResult.IsFailure)
        {
            return Result<AnnouncementDto>.Forbidden();
        }

        var caller = callerResult.Value!;
        var myPersonId = caller.PersonId;
```

**(b)** `ResolveRealNameAsync(db, myPersonId, ct)`'nin ÜÇ çağrısı `caller.DisplayName`
ile değiştirilir. `ResolveRealNameAsync` private metodu, başka çağrısı kalmadıysa SİLİNİR
(IDE0051 build hatası üretir).

**(c)** Doğrudan yazılan denetim izi (`db.AnnouncementAuditEntries.Add(AnnouncementAuditEntry.Create(...))`)
`AnnouncementAuditWriter.Write(...)` ile değiştirilir.

> **DAVRANIŞ EŞDEĞERLİĞİ — mutlaka doğrula:**
> - `ResolveCallerAsync` `p.Name.First + " " + p.Name.Last` projeksiyonunu kullanır;
>   `ResolveRealNameAsync` de aynısını. **Ama `ResolveRealNameAsync` null dönebilir ve
>   çağrı yerleri `?? "Bilinmeyen"` yazıyor**; `ResolveCallerAsync` ise Person bulunamazsa
>   `Forbidden` döner. Yani "Bilinmeyen" kolu ARTIK ULAŞILAMAZ hâle gelir. Bu bir davranış
>   değişikliğidir ve **DOĞRU yöndedir** (A1 BLOCKER'ının aynı gerekçesi) — ama rapora
>   AÇIKÇA yaz.
> - `ResolveCallerAsync` fazladan bir `IsManagerAsync` çağrısı yapar. Handler zaten
>   `ResolveScopedPublisherIdAsync` içinde onu çağırıyor. **İki çağrı olur.**
>   `caller.IsManager`'ı kullanarak `ResolveScopedPublisherIdAsync` çağrısını
>   `caller.IsManager ? null : myPersonId` ile değiştir — böylece izin okuması TEK'e iner.
>   Bunu yaparsan `ResolveScopedPublisherIdAsync`'in başka çağrısı kalıp kalmadığını
>   kontrol et.

**(d)** `AnnouncementAuditWriter` doc'undaki iddia artık DOĞRU olur; doc'a şunu ekle:

```csharp
/// <para><b>A3 güncellemesi:</b> altı yazma ucunun ALTISI da artık
/// <see cref="AnnouncementCaller"/>'ı <c>ResolveCallerAsync</c>'ten alır ve bu yazıcıyı
/// kullanır. A2'de <c>CreateAnnouncementCommandHandler</c> her ikisini de bypass ediyordu
/// ve yukarıdaki "ek sorgu YAPMAZ" iddiası o handler için YANLIŞTI (aktör adı üç kez
/// sorgulanıyordu). O sapma kapatıldı.</para>
```

- [ ] **Step 4: Refactor'ün davranışı DEĞİŞTİRMEDİĞİNİ doğrula**

```bash
dotnet build Oksis.slnx
dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~CreateAnnouncementTests"
dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~AnnouncementEndToEndTests"
```

Beklenen: **TEK BİR TEST DEĞİŞMEDEN** hepsi PASS. Kırılan varsa refactor'ü düzelt, testi
değil.

- [ ] **Step 5: Sorgu sayısının GERÇEKTEN azaldığını göster**

`git diff` üzerinde say ve rapora yaz:
- `ResolveRealNameAsync` çağrı sayısı: 3 → 0
- `IsManagerAsync`'e giden yol sayısı: 2 → 1
- Doğrudan `AnnouncementAuditEntries.Add` sayısı: 1 → 0

Bu sayılar, refactor'ün iddia ettiği şeyi yaptığının tek somut kanıtıdır.

- [ ] **Step 6: Dört süiti koş, deltaları doğrula, commit**

Beklenen: Application süiti +3 (yeni `AnnouncementCallerTests`); diğer üçü SIFIR delta.

```bash
git add src/Oksis.Application/Modules/Announcements/ tests/
git commit -m "refactor(api): create handler ortak caller ve audit yoluna alindi

A2 nihai incelemesinin uc fix-next maddesi: AnnouncementCaller ctor'u artik
Guid.Empty ve bos ad reddediyor; create handler ResolveCallerAsync kullaniyor
(aktor adi uc kez degil bir kez sorgulanir); denetim izi tek yazicidan geciyor.
AnnouncementAuditWriter doc'undaki iddia artik dogru."
```

---

## Görev 17: Denetim izi konvansiyonu + moderasyon dizeleri + devreden test boşlukları + kapanış

**Files:**
- Create: `src/Oksis.Application/Modules/Announcements/Common/AnnouncementModerationWire.cs`
- Create: `tests/Oksis.Application.UnitTests/Modules/Announcements/AnnouncementModerationWireTests.cs`
- Modify: moderasyon dizesi kodlayan üç yer
- Modify: altı denetim izi yazıcısı (yalnız `field`/`tag` kullanımı)
- Modify: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/WithdrawAnnouncementTests.cs`
- Modify: `oksis/docs/superpowers/specs/2026-08-02-duyurular-uctan-uca-design.md` (§12, §13)
- Modify: `oksis/.claude/docs/permission-matrix.md`
- Modify: `oksis/.claude/docs/notification-matrix.md`

**Bu görev A2'nin kalan üç fix-next maddesini kapatır ve dalı kapanışa hazırlar.**

### 17a — Moderasyon mod dizelerinin tek kaynağı

A2 ledger'ından: *"Şablon geçerli mod dizeleri üç yerde kodlu (ParseModeration, validator,
handler)."*

- [ ] **Step 1: Üç yeri bul ve rapora yaz**

```bash
grep -rn '"thresholded"\|"open"' src/ tests/ | grep -v "\.md"
```

Bulduğun her satırı rapora yaz. Üçten fazlaysa hepsini ele al.

- [ ] **Step 2: Failing testi yaz**

```csharp
/// <summary>
/// A2 fix-next: geçerli moderasyon modu dizeleri ÜÇ yerde kodluydu (enum ayrıştırıcı,
/// validator, handler). Üçü ayrışırsa validator'ın kabul ettiği bir değer ayrıştırıcıda
/// patlar ve 400 yerine 500 döner.
/// </summary>
public sealed class AnnouncementModerationWireTests
{
    [Theory]
    [InlineData("open", AnnouncementModeration.Open)]
    [InlineData("thresholded", AnnouncementModeration.Thresholded)]
    public void Should_RoundTrip_When_ModeIsValid(string wire, AnnouncementModeration domain)
    {
        AnnouncementModerationWire.Parse(wire).Should().Be(domain);
        AnnouncementModerationWire.ToWire(domain).Should().Be(wire);
    }

    /// <summary>
    /// Geçerli değerler listesi, enum'un TÜM üyelerini kapsamalıdır. Üçüncü bir mod
    /// eklenirse (ör. "closed") bu test kırılır ve ekleyen kişi tel karşılığını
    /// yazmak zorunda kalır — sessizce eksik kalamaz.
    /// </summary>
    [Fact]
    public void Should_CoverEveryEnumMember_When_ValidValuesAreEnumerated()
    {
        AnnouncementModerationWire.ValidValues.Should().HaveCount(
            Enum.GetValues<AnnouncementModeration>().Length);

        foreach (var member in Enum.GetValues<AnnouncementModeration>())
        {
            AnnouncementModerationWire.ValidValues.Should()
                .Contain(AnnouncementModerationWire.ToWire(member));
        }
    }

    [Fact]
    public void Should_Reject_When_ModeIsUnknown()
    {
        var act = () => AnnouncementModerationWire.Parse("kapalı");

        act.Should().Throw<ArgumentOutOfRangeException>();
    }
}
```

- [ ] **Step 3: Tek kaynağı yaz ve üç yeri ona yönlendir**

```csharp
using Oksis.Domain.Modules.Announcements.Enums;

namespace Oksis.Application.Modules.Announcements.Common;

/// <summary>
/// Moderasyon modunun tel (wire) karşılıklarının TEK kaynağı.
///
/// <para><b>Neden ortak (A2 fix-next):</b> geçerli dizeler üç yerde kodluydu — enum
/// ayrıştırıcı, validator ve handler. Üçü ayrışırsa validator'ın kabul ettiği bir değer
/// ayrıştırıcıda patlar ve kullanıcı 400 yerine 500 görür.</para>
/// </summary>
public static class AnnouncementModerationWire
{
    public const string Open = "open";
    public const string Thresholded = "thresholded";

    /// <summary>Validator'ın <c>.Must(ValidValues.Contains)</c> ile kullandığı küme.</summary>
    public static readonly IReadOnlyList<string> ValidValues = [Open, Thresholded];

    public static string ToWire(AnnouncementModeration mode) => mode switch
    {
        AnnouncementModeration.Open => Open,
        AnnouncementModeration.Thresholded => Thresholded,
        _ => throw new ArgumentOutOfRangeException(nameof(mode), mode, "Bilinmeyen moderasyon modu."),
    };

    public static AnnouncementModeration Parse(string wire) => wire switch
    {
        Open => AnnouncementModeration.Open,
        Thresholded => AnnouncementModeration.Thresholded,
        _ => throw new ArgumentOutOfRangeException(nameof(wire), wire, "Bilinmeyen moderasyon modu."),
    };
}
```

> **Implementer'a not:** `AnnouncementEnumWire`'da zaten bir moderasyon çevirisi VARSA
> yeni bir sınıf açma — onu genişlet ve `ValidValues`'i oraya koy. Dosyayı OKU, sonra
> karar ver ve kararını rapora yaz. Üç çağrı yerinin hepsini yeni kaynağa yönlendir.

### 17b — Denetim izi `field`/`tag` konvansiyonu

A2 ledger'ından: *"Denetim izi field/tag semantiği altı yazıcıda tutarsız (geçişler bazen
field bazen tag); web audit-drawer ikisini FARKLI ikonla render ediyor."*

- [ ] **Step 4: Altı yazıcının bugünkü kullanımını çıkar**

```bash
grep -rn "AnnouncementAuditWriter.Write" -A 8 src/
```

Her çağrı için `action` / `field` / `tag` / `tone` değerlerini bir tabloya yaz. Bu tablo
rapora GİRER — konvansiyonu tabloyu görmeden seçmek mümkün değildir.

- [ ] **Step 5: İstemcinin ne beklediğini doğrula**

```bash
grep -rn "field\|tag" /Users/farukkaya/Repositories/oksis-ui/apps/web/features/announcements/ | grep -i audit
```

**`oksis-ui`'a YAZMA — yalnız OKU.** İstemci `field`'ı ve `tag`'i hangi ikonla/biçimde
render ediyor, rapora yaz.

- [ ] **Step 6: Konvansiyonu seç, yaz ve altısına uygula**

Önerilen (istemci gözlemin farklı diyorsa ONU izle ve gerekçeni yaz):

| Alan | Anlam | Örnek |
|---|---|---|
| `field` | **Durum geçişi** — "neyin neye döndüğü" | `"Durum: pendingApproval → published"` |
| `tag` | **Nitelik damgası** — geçiş olmayan bir işaret | `"Acil olarak işaretlendi"` |
| `tone` | Görsel ağırlık: `"danger"` / `"warning"` / `null` | |

Konvansiyonu `AnnouncementAuditWriter`'ın doc'una YAZ (tek kaynak orası) ve altı çağrıyı
ona uydur. **Mevcut kayıtlar geriye dönük düzeltilmez** — denetim izi değiştirilemezdir
(sözlük: `auditTrail`). Bunu da doc'a yaz.

- [ ] **Step 7: Konvansiyonu sabitleyen testi yaz**

```csharp
/// <summary>
/// A2 fix-next: <c>field</c> ile <c>tag</c> altı yazıcıda tutarsız kullanılıyordu ve web
/// audit-drawer ikisini FARKLI ikonla render ediyor — yani tutarsızlık kullanıcıya
/// GÖRÜNÜYOR. Konvansiyon: <c>field</c> durum geçişidir ("X → Y"), <c>tag</c> nitelik
/// damgasıdır.
///
/// <para>Bu test, durum geçişi yazan her izin <c>field</c>'ının "→" içerdiğini ve
/// <c>tag</c>'inin geçiş oku İÇERMEDİĞİNİ doğrular.</para>
/// </summary>
[Fact]
public async Task Should_WriteTransitionsIntoField_When_LifecycleActionsAreAudited()
{
    // Bir duyuruyu yayınla → onaya gönder → onayla → geri çek → geri al
    // Denetim izinin TAMAMINI oku:
    //   entries.Where(e => e.Field != null).Should().OnlyContain(e => e.Field!.Contains("→"));
    //   entries.Where(e => e.Tag != null).Should().OnlyContain(e => !e.Tag!.Contains("→"));
}
```

### 17c — Devreden test boşluğu: Withdraw-from-Expired

A2 ledger'ından: *"`Withdraw`'ın Expired'dan başarıyla çalıştığı izole testi yok (yalnız
restore testinin kurulumunda dolaylı)."*

- [ ] **Step 8: İzole testi yaz**

`WithdrawAnnouncementTests.cs`'ye:

```csharp
    /// <summary>
    /// A2 fix-next: <c>Withdraw</c>'ın <c>Expired</c>'dan çalıştığı YALNIZ
    /// <c>RestoreAnnouncementTests</c>'in kurulumunda dolaylı olarak sınanıyordu — o kurulum
    /// patlarsa hata bir Restore testiymiş gibi görünürdü. İzole edildi.
    ///
    /// <para>Süresi dolmuş duyuru arşivdedir ama hâlâ okuyucu yüzeyinde görünür (INV-7);
    /// yanlış bir duyurunun süresi dolduğu için "artık zararsız" olduğunu varsaymak yanlıştır.</para>
    /// </summary>
    [Fact]
    public async Task Should_Withdraw_When_AnnouncementIsExpired()
    {
        // Duyuru GERÇEK yoldan expired'a getirilir: Publish() → Expire().
        // withdrawn.Status.Should().Be(AnnouncementStatus.Withdrawn);
        // withdrawn.StatusBeforeWithdraw.Should().Be(AnnouncementStatus.Expired);
    }

    /// <summary>
    /// A2 fix-next (b): <c>Withdraw</c> gerekçesinin <c>.Trim()</c>'i çalışıyordu ama çıktısı
    /// hiç assert edilmiyordu — yalnız boş/whitespace reddi test edilmişti.
    /// </summary>
    [Fact]
    public async Task Should_TrimReason_When_AnnouncementIsWithdrawn()
    {
        // reason: "  Yanlış tarih yazıldı.  "
        // persisted.WithdrawReason.Should().Be("Yanlış tarih yazıldı.");
    }
```

### 17c-bis — Görev 4'ten devreden zayıf test (PLAN KUSURU)

Görev 4'ün incelemesinden: `AnnouncementTemplateValidatorTests.Should_ApplySameNameLimit_When_UpdateValidatorIsUsed`
**doc yorumunun iddia ettiği şeyi doğrulamıyor.** Test yalnız Update validator'ını 120/121
sınırında koşuyor; Update `.MaximumLength(120)` diye DÜZ SAYI yazsaydı da yeşil kalırdı, ve
`NameMaxLength` ileride 100'e çekildiğinde iki validator ayrışırken test yine yeşil kalırdı —
yani "önlediğini" söylediği ayrışmayı YAKALAMAZ.

Kod doğru (`UpdateAnnouncementTemplateCommandValidator.cs:21,25` sabitleri gerçekten
`CreateAnnouncementTemplateCommandValidator`'dan alıyor); **zayıf olan testtir** ve testi
brief birebir dikte etmişti — bu bir plan kusurudur, uygulama kusuru değil.

- [ ] **Step 9c: Testi ayırt edici hâle getir**

İki validator'ı **aynı** girdiyle karşılaştır; sabitleri okuma, davranışı karşılaştır:

```csharp
    /// <summary>
    /// İki validator AYNI sınırları uygulamalıdır. Ayrışırlarsa düzenleme, oluşturmanın
    /// kabul etmeyeceği bir adı kabul ederdi — ve o ad kolona sığmayıp 500 üretirdi.
    ///
    /// <para><b>Görev 4 incelemesinin düzelttiği hâl:</b> önceki sürüm yalnız Update
    /// validator'ını 120/121'de koşuyordu ve Update düz sayı yazsa bile yeşil kalırdı —
    /// yani önlediğini söylediği ayrışmayı yakalamıyordu. Şimdi İKİ validator AYNI girdiyle
    /// koşuluyor ve verdict'leri karşılaştırılıyor: sabit paylaşımı bozulursa (biri 120,
    /// diğeri 100) bu test kırılır. Sabitleri doğrudan karşılaştırmak ise yalnız aynı sayıyı
    /// iki kez okumak olurdu ve kanıt üretmezdi.</para>
    /// </summary>
    [Theory]
    [InlineData(119)]
    [InlineData(120)]
    [InlineData(121)]
    public void Should_AgreeOnNameLimit_When_BothValidatorsSeeTheSameName(int length)
    {
        var name = new string('a', length);

        var createValid = new CreateAnnouncementTemplateCommandValidator()
            .Validate(new CreateAnnouncementTemplateCommand(name, "M", false)).IsValid;

        var updateValid = new UpdateAnnouncementTemplateCommandValidator()
            .Validate(new UpdateAnnouncementTemplateCommand(Guid.NewGuid(), name, "M", false)).IsValid;

        updateValid.Should().Be(createValid,
            "iki validator ad uzunluğu sınırını PAYLAŞIR — ayrışırlarsa düzenleme, "
            + "oluşturmanın reddedeceği bir adı kabul eder ve o ad kolona sığmaz");
    }
```

Eski `Should_ApplySameNameLimit_When_UpdateValidatorIsUsed` **silinir** (yerini bu alır;
aynı kuralı iki testle ölçmenin değeri yok ve zayıf olan yanıltıcıdır).

**Zorunlu mutasyon denetimi:** `UpdateAnnouncementTemplateCommandValidator`'daki
`CreateAnnouncementTemplateCommandValidator.NameMaxLength` referansını GEÇİCİ olarak düz
`100` yap ve testi koş. Beklenen: `[InlineData(119)]` ve `[InlineData(120)]` vakaları
**FAIL** (create kabul eder, update reddeder). Mutasyonu GERİ AL ve gözlemi rapora yaz.
Eski testin bu mutasyonda **yeşil kaldığını** da göster — zayıflığın kanıtı budur.

### 17c-ter — Görev 7'den devreden yanlış kod yorumu

`GetAnnouncementPublishersQueryHandler.cs:112` üretim yorumunda niteliksiz **"sonuç böylece
deterministiktir"** yazıyor. Görev 7'nin raporu (§11.3) bu iddiayı re-review sonrası GERİ
ALDI: iki satırın da gerçek adı doluysa **ve** `PublishedAt` eşitse (toplu zamanlanmış
yayında paylaşılabilir) **ve** kişi arada yeniden adlandırılmışsa tie çözülmez ve sonuç
`ORDER BY`'sız SQL satır sırasına düşer.

Rapor düzeltildi ama **kod yorumu düzeltilmedi** — yani bugün kaynakta, geri alınmış bir
iddia duruyor. Bu, dilim boyunca kovaladığımız "sahte güven" sınıfının aynısı, yalnız
yorum düzeyinde.

- [ ] **Step 9d: Yorumu gerçeğe uydur**

`deterministiktir` ifadesini nitelendir — örneğin:

```csharp
        // Tie-break: gerçek adı olan satır kazanır, eşitlikte en yeni PublishedAt.
        // DAR BİR HÂLDE ÇÖZÜLMEZ: iki satırın da gerçek adı doluysa VE PublishedAt eşitse
        // (toplu zamanlanmış yayında paylaşılabilir) VE kişi arada yeniden adlandırılmışsa
        // sıra ORDER BY'sız SQL satır sırasına düşer. Bugün gözlemlenebilir bir etkisi yok;
        // iddia niteliksiz bırakılırsa okuyucu var olmayan bir garantiye dayanır.
```

Metni birebir kopyalaman gerekmiyor; gereken, **niteliksiz "deterministiktir" iddiasının
kaynakta kalmaması**.

### 17c-quater — Görev 8'den devreden eskimiş doc'lar ve iki test boşluğu

Görev 8'in fix turu `DeliveryReportDto`'nun semantiğini değiştirdi ama iki doc bunu takip
etmedi, ve iki küçük test boşluğu bilinçli olarak açık bırakıldı (delta sabitlemesi yüzünden).

- [ ] **Step 9e: İki eskimiş doc'u gerçeğe uydur**

1. `GetAnnouncementDeliveryReportQueryHandler` içindeki `_noAccountReason` doc'u hâlâ
   *"Tek gerekçe: bugün ulaşılamamanın tek gerçek nedeni budur"* diyor. **Artık İKİ gerekçe
   var** (`"Hesap bağlı değil"` ve `"Kişi kaydı silinmiş"`). İfadeyi düzelt.
2. `DeliveryReportDto.Reached` özeti *"Bağlı hesabı olan alıcı sayısı"* diyor; yeni semantik
   **"Person kaydı DURAN ve hesabı bağlı olan"**. Bir kelime eksik — tamamla.

- [ ] **Step 9f: İki bilinçli test boşluğunu tek testle kapat**

Görev 8'in re-reviewer'ının önerisi. İkisi de küçük:

1. **Bilinmeyen `RoleAtPublish` ham geçer.** `AnnouncementRoleLabels.For(...)` saf statik bir
   metot, dolayısıyla üç satırlık bir **Application birim testi** yeter — entegrasyona gerek
   yok:

```csharp
    /// <summary>
    /// Beklenmedik bir rol dizesi HAM geçer — veri kaybetmek, yanlış etiketlemekten kötüdür.
    /// Bugün `AudienceBucket` yalnız üç değer üretiyor, yani bu dal üretimde ulaşılamaz;
    /// test onu YARIN bir dördüncü rol eklendiğinde sessizce boşa düşmesin diye sabitliyor.
    /// </summary>
    [Theory]
    [InlineData("Parent", "Veli")]
    [InlineData("Teacher", "Öğretmen")]
    [InlineData("Student", "Öğrenci")]
    [InlineData("Secretary", "Secretary")]
    [InlineData("", "")]
    public void Should_MapKnownRolesAndPassThroughUnknown(string stored, string expected)
    {
        AnnouncementRoleLabels.For(stored).Should().Be(expected);
    }
```

> `AnnouncementRoleLabels.For`'un gerçek metot adını ve imzasını **kaynaktan doğrula** —
> yukarıdaki `For` bir tahmindir. Farklıysa gerçeğini kullan ve rapora yaz.

2. **`tr-TR` sıralaması hiçbir testle ayırt edilmiyor** (Görev 7 ve 8'de aynı boşluk).
   Sahnedeki adlar ASCII olduğu için `tr-TR` ile Invariant aynı sırayı veriyor.
   `GetAnnouncementPublishersTests`'e Türkçe'ye özgü adlarla bir sıralama testi ekle —
   ayırt edici olması için `I`/`ı`/`İ`/`i` ya da `Ç`/`Ş`/`Ğ` içeren adlar seç ve
   `InvariantCulture` ile **farklı** sıra üreteceğini doğrula (üretmiyorsa test ayırt edici
   değildir, adları değiştir).

Bu iki test **birlikte** Görev 7 ve 8'in devrettiği "karşılaştırıcı seçimi testsiz"
boşluğunu kapatır.

### 17c-quinquies — Görev 9'dan devreden iki eksik OpenAPI ilanı

Görev 9, `AnnouncementsController`'ın tüm uçlarına 403 ve iki uca 404 ilanı ekledi. Gerekçe:
**generated OpenAPI B fazını besler, ilan gerçeği söylemelidir.** İmplementer kalan uçları
tarayıp "başka eksik yok" dedi; **re-review bu taramanın İKİ noktada da yanlış olduğunu
kaynaktan gösterdi.**

- [ ] **Step 9g: İki eksik ilanı tamamla**

1. **`UpdateModerationAsync` → 404 eksik.**
   `UpdateAnnouncementModerationCommandHandler.cs:44-47` `SchoolSettings` satırı null ise
   açıkça `Result.NotFound()` döndürüyor. (Kardeş SORGU handler'ı döndürmüyor — o yüzden
   `GetModerationAsync`'e 404 EKLEME, yalnız `UpdateModerationAsync`'e.)
   İmplementer'ın "moderasyon kaydı okul başına tekil, 404 yolu yok" gerekçesi kaynakla
   çelişiyordu.

2. **`CreateAsync` → 400 eksik.**
   `CreateAnnouncementCommandHandler` satır 45, 209 ve 213'te handler'ın **kendisi**
   `Result.Failure(Error)` döndürüyor ve `ResultExtensions` bunu 400'e eşliyor. Yani eksik
   400 yalnız `ValidationBehavior` artefaktı değil.
   İmplementer'ın "tüm controller'larda aynı" iddiası da yanlış: aynı controller'daki
   `UpdateModerationAsync` 400 ilan ediyor, ve depoda SchoolSettings 21, Persons 9,
   Duties 8 ilan taşıyor.

**Salt-additive ol:** yalnız eksik satırları ekle, sayısal sıraya. Mevcut hiçbir ilanı
değiştirme, sırasını bozma. `NotContain(attr => attr is HttpDeleteAttribute)` assertion'ına
ve `HaveCount(17)` çıpasına **DOKUNMA**.

**Uyarı:** bu iki ekleme uç sayısını değiştirmez, dolayısıyla `HaveCount(17)` ve iki yönlü
tablo assertion'ı aynen geçmelidir. Geçmiyorsa yanlış bir şey yapmışsındır.

### 17c-sexies — `IFileEntityScopeResolver` DI kayıtlarının bekçisi yok (ÜÇ kayıt birden)

Görev 14'ün implementer'ı kendi kaydını denetlerken daha genel bir boşluk buldu ve
doğruladı: `tests/` altında **DI konteynerini kuran hiçbir test yok**
(`FileAccessGuardTests` sahte resolver'larla çalışıyor).

Sonuç: `DependencyInjection.cs`'teki üç `AddScoped<IFileEntityScopeResolver, …>` satırından
**biri silinse hiçbir test kırılmaz**. `FileAccessGuard` çözümleyicileri
`IEnumerable<IFileEntityScopeResolver>` ile topluyor; kayıtsız bir `EntityType` **deny**'e
düşer, yani o entity'nin ek erişimi **tamamen ve sessizce kapanır**.

Bu, bu dilimde dört kez tekrarlanan kusur zincirinin aynısıdır: *kod yazıldı ve test edildi,
ama üretimde onu bağlayan satırın bekçisi yok.* (A1/A2'de handler → Görev 12'de job'ın olay
yayması → Görev 13'te job'ın Hangfire kaydı → burada resolver'ın DI kaydı.)

- [ ] **Step 9h: Üç kaydı birden koruyan tek test**

```csharp
    /// <summary>
    /// `FileAccessGuard` çözümleyicileri `IEnumerable<IFileEntityScopeResolver>` ile toplar;
    /// KAYITSIZ bir `EntityType` deny'e düşer, yani o entity'nin ek erişimi SESSİZCE kapanır.
    /// Bu test üç kaydı birden sabitler — biri silinirse kırılır.
    ///
    /// <para>Yeni bir tüketici modül eklendiğinde bu listeye satır eklemek ZORUNLUDUR;
    /// unutulan bir kayıt, hiçbir testin söylemeyeceği bir erişim kapanmasıdır.</para>
    /// </summary>
    [Fact]
    public void Should_RegisterEveryFileEntityScopeResolver()
    {
        // AddInfrastructure(...) ile servis sağlayıcı kur, sonra:
        var entityTypes = provider.GetServices<IFileEntityScopeResolver>()
            .Select(r => r.EntityType)
            .ToList();

        entityTypes.Should().BeEquivalentTo(["School", "AttendanceExcuse", "Announcement"]);
    }
```

> **Implementer'a not:** `AddInfrastructure`'ın gerçek adını ve gerektirdiği bağımlılıkları
> (`IConfiguration`, connection string vb.) **kaynaktan oku**. Servis sağlayıcıyı kurmak
> harici bir bağımlılık (DB bağlantısı, Redis) gerektiriyorsa ve bu testte kurulamıyorsa,
> **DUR ve bildir** — sahte bir soyutlama ekleme, kaydı taklit eden bir test yazma
> (o, korumadığı bir şeyi koruduğunu iddia eden testtir; bu dilimde sekiz kez düzeltildi).
>
> Kurulabiliyorsa: Görev 13'ün `HangfireRecurringJobRegistrationTests`'i emsaldir — orada
> gerçek `WebApplication.CreateBuilder()` kurulup yalnız tek bir port sahtelendi ve yan
> etki üretmediği (`Run/StartAsync` çağrılmadığı) doğrulandı.

**Zorunlu mutasyon:** üç kayıttan birini geçici sil, testin kırıldığını göster, geri al.

### 17d — Spec ve B fazı drift listesinin güncellenmesi

- [ ] **Step 9: Spec §13'e beşinci drift maddesini ekle**

`/Users/farukkaya/Repositories/oksis/docs/superpowers/specs/2026-08-02-duyurular-uctan-uca-design.md`
§13 adım 4'ün altına:

```markdown
   - `contract.ts` + `paths.ts` → **şablon yazma uçları** (`POST`/`PUT`/`DELETE
     /announcements/templates`) eklenir. Bugün `paths.ts:275-287` yalnız `get` ilan eder;
     `post`/`put`/`delete` hepsi `never`'dır. Backend A3'te üçünü de yazdı
     (`AnnouncementTemplatesController`), yani drift bekçisi burada da bilerek çalar.
     Gövde tipleri:

     ```ts
     export interface CreateAnnouncementTemplateBody {
       name: string
       description: string
       urgent: boolean
     }
     export interface UpdateAnnouncementTemplateBody {
       name: string
       description: string
       urgent: boolean
     }
     ```

     `DELETE` gövdesizdir ve `204` döner (`Wrapped<T>` sarmalı YOKTUR — `ToHttpResult`'ın
     generic olmayan overload'ı `NoContentResult` üretir).
```

Ayrıca §13'ün girişindeki "İkisi önceden bilinir" ifadesi **"Dördü önceden bilinir"**
olarak düzeltilir ve `restore`'un koşulsuz `published` yazan MSW mock'u da listeye eklenir
(A2'de doğrulandı, spec'e yazılmamıştı).

- [ ] **Step 10: Spec §12 dilim 6'daki yanlış ifadeyi düzelt**

Bugünkü metin: *"Şablon uçları (mevcut `GET` + 3 yeni: `POST`/`PUT`/`DELETE`)"*.
**`GET` mevcut DEĞİLDİ** — kontratta ilan edilmişti ama backend'de hiç yazılmamıştı.
Düzelt:

```markdown
| 6 | Yardımcı uçlar | Şablon uçları (**dördü de yeni** — `GET` kontratta ilan edilmişti ama backend'de yoktu), `GET /publishers`, `GET /{id}/delivery-report` |
```

### 17e — İki küçük matris düzeltmesi (spec §15'in doğrulanabilir kısmı)

Spec §15 dört doküman güncellemesi ister. İkisi küçük ve doğrulanabilir, ikisi ayrı bir
dokümantasyon projesidir. **A3 küçük ikisini yapar** (aşağıda), büyük ikisini bilinçli
olarak B fazı sonrasına bırakır — gerekçe ana plan dosyasının "Spec kapsamı" bölümünde.

- [ ] **Step 10a: `permission-matrix.md` — sekiz anahtar, `delete` kaldırılır**

```bash
grep -n "announcements" /Users/farukkaya/Repositories/oksis/.claude/docs/permission-matrix.md
```

Dosyayı OKU. Duyuru satırlarını `PermissionSeedData.cs:57-64`'teki **sekiz** anahtarla
birebir hizala:
`view`, `create`, `update`, `withdraw`, `approve`, `moderate`, `template.manage`, `report.view`.
`announcements.delete` ve `announcements.view-detail` satırları varsa **SİL** — ikisi de
jenerik CRUD şablonu artığıdır ve seed'de karşılıkları yoktur (spec §15 bunu açıkça söyler).

Dosya bulunamıyorsa veya duyuru bölümü hiç yoksa: **uydurma, ekleme yapma** — durumu
rapora yaz ve bu adımı "kapsam dışı, dosya yok" diye geç.

- [ ] **Step 10b: `notification-matrix.md` — duyuru olayları ve yanlış satır**

Dosyayı OKU ve iki şey yap:

1. Duyuru bildirim olaylarını **sekiz** değerle hizala (A1'in 16'sı + A2'nin 17–21'i +
   A3'ün 22/23'ü): `AnnouncementPublished`, `AnnouncementWithdrawn`, `AnnouncementAmended`,
   `AnnouncementSubmittedForApproval`, `AnnouncementApproved`, `AnnouncementRejected`,
   `AnnouncementScheduledExecuted`, `AnnouncementScheduleFailed`. Her satıra ALICIYI yaz
   (alıcılar mı, yayınlayan mı, yönetim mi) — enum'un XML doc'ları bunu zaten söylüyor,
   oradan al.
2. **`AnnouncementTargetResolver` satırını düzelt.** Spec §8.1: *"`notification-matrix.md`'de
   adı geçen `AnnouncementTargetResolver` YAZILMAMIŞTIR ve bu tasarımda gerek yoktur
   (fan-out duyuru modülündedir)."* Doğrula:

   ```bash
   grep -rn "AnnouncementTargetResolver" /Users/farukkaya/Repositories/oksis-api/src/
   ```

   Sıfır eşleşme bekleniyor. Satırı, gerçekte kullanılan
   `INotificationRecipientResolver.ResolvePersonAccountsMapAsync` ile değiştir.

- [ ] **Step 11: Kapanış doğrulaması — TAM SÜİT + uygulama**

```bash
docker compose up -d garage && ./scripts/init-garage.sh
dotnet build Oksis.slnx                                   # 0 uyarı, 0 hata
dotnet test tests/Oksis.Domain.UnitTests
dotnet test tests/Oksis.Application.UnitTests
dotnet test tests/Oksis.Api.UnitTests
dotnet test tests/Oksis.Infrastructure.IntegrationTests
```

**Dördü de SIFIR kırmızı olmalıdır.** Görev 1'in beyan edilmiş kırmızısı Görev 5'te
kapandı; başka bilinen kırmızı YOKTUR.

```bash
dotnet run --project src/Oksis.Api &
sleep 25
curl -s http://localhost:5112/openapi/v1.json | python3 -c "
import json,sys
d=json.load(sys.stdin)
paths=[k for k in d['paths'] if 'announcement' in k.lower()]
ops=[(p,m) for p in paths for m in d['paths'][p] if m in ('get','post','put','delete','patch')]
print('yol:', len(paths), 'operasyon:', len(ops))
dels=[p for p,m in ops if m=='delete']
print('DELETE ucu:', dels)
assert dels == ['/api/v1/announcements/templates/{id}'], dels
print('OK')
"
kill %1
```

Beklenen: **21 operasyon** (17 duyuru + 4 şablon), DELETE **tam olarak bir tane** ve o da
şablon ucu.

- [ ] **Step 12: Kapanış kontrol listesi — her maddeyi TEK TEK doğrula ve rapora yaz**

| # | Kriter | Nasıl doğrulanır |
|---|---|---|
| 1 | Dört süit sıfır kırmızı | Yukarıdaki dört komut |
| 2 | Build sıfır uyarı | `dotnet build Oksis.slnx` |
| 3 | Uygulama ayağa kalkıyor | `curl` 200 |
| 4 | Duyuru yüzeyinde SIFIR DELETE | Yukarıdaki assert |
| 5 | Şablon yüzeyinde TAM BİR DELETE | Yukarıdaki assert |
| 6 | INV-1 kaynak taraması: dört DbSet'te sıfır `Remove` | `dotnet test --filter AnnouncementHardDeleteGuardTests` |
| 7 | Şablon `Remove` çağrısı tam bir dosyada | aynı test |
| 8 | `NotificationKind` 1–21 değişmedi, 22/23 eklendi | `dotnet test --filter NotificationKindContinuityTests` |
| 9 | İzin yüzeyi tablosu altı yeni satır aldı | `grep -c "yield return" AnnouncementPermissionSurfaceTests.cs` → 21 |
| 10 | Her bildirim handler'ının testi var | `ls src/.../Events/Notifications/` ile `grep -l` karşılaştır |
| 11 | `oksis-ui`'da HİÇBİR değişiklik yok | `cd ~/Repositories/oksis-ui && git status --short` → boş |
| 12 | `contract.ts` ve `paths.ts` DURUYOR | `ls packages/api/src/announcements/` |
| 13 | Hiç `#pragma warning` eklenmedi | `git diff d37fc31 --stat` + `git diff d37fc31 \| grep pragma` → boş |
| 14 | Hiç `ThrowAsync<Exception>()` yok | `grep -rn "ThrowAsync<Exception>" tests/` → boş |
| 15 | Mutasyon denetimlerinin HEPSİ geri alındı | `git diff d37fc31 -- src/` gözden geçir |

- [ ] **Step 13: Commit**

```bash
git add src/ tests/
git commit -m "refactor(api): moderasyon dizeleri tek kaynaga alindi, denetim izi konvansiyonu sabitlendi

A2'nin kalan uc fix-next maddesi: mod dizeleri uc yerde kodluydu; field/tag
semantigi alti yazicida tutarsizdi (web audit-drawer ikisini farkli ikonla
render ediyor, yani tutarsizlik goruntuluyordu); Withdraw'in Expired'dan
calistigi izole testi yoktu."
```

```bash
cd /Users/farukkaya/Repositories/oksis
git add docs/superpowers/specs/2026-08-02-duyurular-uctan-uca-design.md \
        .claude/docs/permission-matrix.md .claude/docs/notification-matrix.md
git commit -m "docs(repo): duyuru spec'i, izin matrisi ve bildirim matrisi guncellendi

Sablon yazma uclari donmus kontratta yok — backend onden gitti (besinci drift).
Dilim 6 'mevcut GET' diyordu; GET kontratta ilan edilmisti ama backend'de hic
yazilmamisti. Izin matrisinden delete/view-detail kaldirildi (sekiz anahtar,
seed ile birebir); bildirim matrisine 22/23 eklendi ve yazilmamis
AnnouncementTargetResolver satiri gercek resolver ile degistirildi."
```

> **Not:** Matris dosyalarının yolu plan yazımında doğrulandı:
> `oksis/.claude/docs/permission-matrix.md` ve `oksis/.claude/docs/notification-matrix.md`
> (repo kökündeki `docs/` altında DEĞİL).

---

## Dal kapanışı

Görev 17 bittiğinde `superpowers:finishing-a-development-branch` çalıştırılır.
**Ama ondan ÖNCE, A2'nin en pahalı dersi gereği, NİHAİ DAL İNCELEMESİ yapılır:**

A2'de per-görev incelemenin göremediği ÜÇ merge engelleyici vardı ve üçü de yalnız dalın
tamamına bakınca görüldü:

1. Bir doc yorumunun kaynak tarayıcısını tetiklemesi (sekiz görev boyunca kırmızı test),
2. `:restore`'un yanlış kapıyla korunması (plan kusuru),
3. Üretim sorgusunun yarısını kopyalayıp kendini doğrulayan bir test.

Nihai inceleme şunlara BAKAR:

- `git diff d37fc31..HEAD` — dalın TAMAMI, görev görev değil.
- Her yeni testin ayırt ediciliği: "korumak istediği satırı silsem kırılır mı?"
- Her bildirim handler'ının GERÇEKTEN örneklendiği.
- Her yeni yetki kapısının hem pozitif hem negatif kolunun sınandığı.
- Doc yorumlarının kodla uyuştuğu (A2 BLOCKER 1'in sınıfı).
- D-1..D-4 kararlarının gerçekten uygulandığı ve hiçbir bekçinin gevşetilmediği.

**Merge yalnız nihai inceleme temizse ve dört süit de sıfır kırmızıysa yapılır.**
`--no-ff` (deponun konvansiyonu). SDD ledger'ı SİLİNMEZ — B fazının el kitabıdır.
