# Duyurular A3 — Yardımcı Uçlar, Job'lar ve Ek Dosya

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task.
> Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Spec dilim 6–8'i teslim et — şablon CRUD, yayınlayan filtresi, gönderim raporu,
zamanlanmış yayın ve süre dolumu job'ları, ek dosya entegrasyonu — ve A2'nin nihai
incelemesinden devreden altı fix-next maddesini kapat.

**Architecture:** Mevcut duyuru modülünün üzerine additive. Şablon AYRI bir aggregate'tir
(`AnnouncementTemplate`, kendi tablosu, kendi controller'ı) ve INV-1'e tabi DEĞİLDİR —
duyuru silinmez, şablon silinir; bu ayrım hem domain bekçisinde hem API bekçisinde AÇIKÇA
ifade edilir, hiçbir bekçi gevşetilmez. Zamanlanmış yayın job'ı yayın mantığını tekrar
etmez: `:approve` ile ortak `AnnouncementPublicationService`'i kullanır. Ek dosya Documents
modülünün mevcut altyapısına (`UploadFileCommand` → `AttachFileCommand` → `IFileAccessGuard`)
bağlanır; duyuru modülü yalnız kendi `IFileEntityScopeResolver`'ını yazar.

**Tech Stack:** .NET 10 / C# 13, Clean Architecture + CQRS (MediatR), EF Core 10, MSSQL
(Testcontainers), Hangfire, xUnit + FluentAssertions + NSubstitute.

**Depo:** `/Users/farukkaya/Repositories/oksis-api`
**Dal:** `feature/announcements-a3`
**Dal başlangıcı (MERGE_BASE):** `d37fc3176d8d2636003cc35b4b25a4f874c1ced9`
**Önceki dilim:** A2 — `.superpowers/sdd/2026-08-03-duyurular-a2-yasam-dongusu/progress.md`

---

## Global Constraints

Her görevin gereksinimleri bu bölümü ÖRTÜK olarak içerir.

### Derleme ve biçim

- **`dotnet format` ÇALIŞTIRMA.** `Directory.Build.props:6,9` → `TreatWarningsAsErrors=true` +
  `EnforceCodeStyleInBuild=true`. Yani **`dotnet build` biçim kapısıdır**. Format tüm
  solution'da >15 dk sürer ve implementer'ları asar (A2 ölçümü).
  **TEK İSTİSNA:** EF'in ürettiği migration dosyası blok kapsamlı namespace kullanır ve
  IDE0161'i kırar — DERLENMEZ. Onu **elle** dosya kapsamlıya çevir; formatter çalıştırma.
  Bu planda EF migration üreten görev YOKTUR (A3 şema değiştirmez), dolayısıyla istisna da
  beklenmez.
- **Okunmayan parametre BUILD HATASIDIR** (IDE0060). `#pragma warning disable` ile susturmak
  A2'de reddedildi. Parametre gereksizse KALDIR.
- **SAAT KURALI:** bir domain metodu ancak bir **iş zamanı** yazıyorsa `now` alır.
  `Publish`/`Withdraw`/`Approve`/`RegisterUse` alır; `Amend`/`Restore`/`Expire`/`Reject` almaz.
  `UpdatedAt`'i `AuditingInterceptor` yazar.

### Test disiplini

- Spesifik hatayı doğrula: `ThrowAsync<AnnouncementDomainException>()` + `.Where(e => e.Code == ...)`.
  **`ThrowAsync<Exception>()` ASLA.**
- **Her test adlandırdığı kuralı İZOLE etsin.** Sınama: "korumak istediğim satırı silsem bu
  test kırılır mı?" Cevap kesin **evet** değilse test yanlıştır. A2'de üç test "kanıt gibi
  okunan ama kırılamayan" çıktı ve ikisi ancak nihai incelemede yakalandı.
- **BİLDİRİM HANDLER'I TESTSİZ BIRAKILMAZ.** Bu depoda ÜÇ KEZ oldu (A1 `Published`, A2 Görev 7
  `Amended`, A2 Görev 14 `SubmittedForApproval`) ve üçü de geriye dönük kapatıldı. Handler'ı
  GERÇEKTEN örnekleyen, alıcı kümesini TAM olarak assert eden test yaz. Her `DidNotReceive`
  testi alternatif açıklamayı İMKÂNSIZ kılmalıdır (ör. "hesap yok" sessizliği açıklayamasın:
  hesabın var olduğunu bağımsız olarak assert et).
- **Dedup anahtarı kuralı:** tekrarlanabilir eylemin dedup anahtarı `OccurredAt.UtcTicks`
  İÇERİR; tek seferlik eylemin içermez.
- **Testi kırdığını göstermek için üretim kodunu KALICI olarak değiştirme.** Geri alınan ve
  raporlanan mutasyon denetimi meşrudur ve bu planda iki görevde ZORUNLUDUR.

### Süit aritmetiği (A2'nin en pahalı dersi)

**DÖRT SÜİTİN HEPSİNE** "taban X, delta tam +N" aritmetiği uygula. A2'de bu yalnız
entegrasyona uygulandı ve INV-1 bekçisi SEKİZ GÖREV boyunca kırmızı kaldı, çünkü domain
süitinin çıplak sayısı gürültü sanıldı.

Dal başlangıcındaki (`d37fc31`) tabanlar:

| Süit | Komut | Taban |
|---|---|---|
| Domain | `dotnet test tests/Oksis.Domain.UnitTests` | 667 / 0 |
| Application | `dotnet test tests/Oksis.Application.UnitTests` | 1489 / 0 |
| Api | `dotnet test tests/Oksis.Api.UnitTests` | 207 / 0 |
| Integration | `dotnet test tests/Oksis.Infrastructure.IntegrationTests` | 726 / 0 |

Her görev raporunda: "taban X, delta tam +N, toplam Y" yaz. Delta tam çıkmıyorsa DUR ve bildir.

### Ortam

- **Entegrasyon testlerinden ÖNCE container'ları kaldır:**
  `docker compose up -d garage && ./scripts/init-garage.sh`
  A1 ve A2 boyunca "37 önceden var olan Documents/S3 hatası" diye taşınan şey buydu —
  container'lar hiç ayağa kalkmamıştı. Kaldırılınca süit 726/0.
- `GetHolidaysQueryHandlerBe6Tests` (Schools) paylaşılan statik Mapster config yüzünden
  FLAKY'dir. Application süiti kırmızı gelirse ÖNCE bunu ele.
- Uzun komutları **önplanda**, açık `timeout` ile çalıştır. Arka plana atma.
- Çalışma ağacında **`git stash` YAPMA**.
- **`oksis-ui`'a YAZMA.** A3 backend işidir; kontrat değişiklikleri B fazında.
- Paylaşılan `AnnouncementAudienceFixture`'a dokunan görev **TÜM** entegrasyon projesini
  koşmak zorundadır (A1'de iki kez sessizce 6 test kırıldı).

### Devreden doğrulanmış kararlar (tahmin etme)

- `AggregateRoot`: `protected void Raise(IDomainEvent)`, `ClearDomainEvents()`.
- `IDomainEvent.OccurredAt` **ambient** `DateTimeOffset.UtcNow`'dan gelir, çağıranın iş
  zamanından değil.
- `ICurrentUser.Roles` HER ZAMAN BOŞ; `IsInRole` depo genelinde ölü kod. "Yönetim mi" =
  `AnnouncementCallerResolver.IsManagerAsync(permissionReader, ct)` →
  `HasPermissionAsync("announcements.approve")`.
- Her yazma ucu `AnnouncementLifecycleGuard.ResolveCallerAsync(db, currentUser, permissionReader, ct)`
  KULLANIR, yeniden yazmaz. `person is null` → izin değerlendirmesinden ÖNCE `Forbidden`.
- `AnnouncementAuditWriter.Write(...)` kendi `SaveChangesAsync`'ini ÇAĞIRMAZ.
- `PagedResult<T>`'nin konumsal yapıcısı YOKTUR.
- İzin kapısı `[RequirePermission("...")]` + `[Tenancy(TenancyMode.Required)]` ile
  **KOMUT/SORGU sınıfında**, controller'da değil.
- `AnnouncementPermissionSurfaceTests` her yeni istek için satır İSTER; o test bunu zorlamak
  için var.
- `AcademicSession`'da `IsActive` YOK — `Status == AcademicSessionStatus.Active`.

---

## Plan yazımında doğrulanan şekiller

Plan yazılırken on beş API şekli depodan okundu. **Beşi planın ilk tahmininden farklı
çıktı ve plan yazılmadan ÖNCE düzeltildi** — bunlar tahmin değil, dosyadan okunmuş
gerçeklerdir:

| Şekil | Gerçek | İlk tahmin (YANLIŞ) |
|---|---|---|
| `GET /announcements/templates` | **Backend'de YOK.** A1/A2 hiç yazmadı; yalnız kontrat ilan ediyor | "mevcut GET, üçü eklenecek" (spec §12 dilim 6 böyle diyor) |
| `AnnouncementHardDeleteGuardTests.GuardedDbSets` | **`AnnouncementTemplates` DAHİL** — beş DbSet | "yalnız duyuru aggregate'i korunuyor" |
| `FileCategories.AnnouncementAttachment` | **Zaten var**, 10 MB / pdf-jpg-png / `RequiresVirusScan: true` / retention 365 gün | "kategori eklenecek" |
| `Announcement.AttachFile(Guid?)` | **Zaten var**; `AttachmentFileId` kolonu ve migration da var | "domain metodu yazılacak" |
| `CreateAnnouncementCommand.AttachmentFileId` | **Zaten var ama handler onu SESSİZCE DÜŞÜRÜYOR** | "komuta alan eklenecek" |
| Job saat soyutlaması | Job'lar `TimeProvider` alır (`ExpireRoleAssignmentsJob`), handler'lar `IDateTimeProvider` | "her yerde `IDateTimeProvider`" |

Ayrıca doğrulanan (tahmin edilmemesi gereken) şekiller:

- `AnnouncementTemplate`: `PermanentTenantEntity`; `Name`(120)/`Description`(500)/`Urgent`/
  `UsageCount`/`LastUsedAt`; `Create(schoolId, name, description, urgent)` +
  `RegisterUse(now)`. **`Update` metodu YOK** (Görev 1 ekler).
  Benzersiz indeks: `(SchoolId, Name)`.
- Sekiz izin anahtarının **hepsi seed'de hazır** —
  `announcements.template.manage` ve `announcements.report.view` dahil
  (`PermissionSeedData.cs:57-64`).
- `MapStatusCode`: `Announcements.` kovası `Session.NotFound` → 409, `InvalidStatus` → 409,
  **diğer her şey → 400**. Duplicate için 409 kolu YOK (Görev 3 ekler).
- `INotificationRecipientResolver.ResolvePersonAccountsMapAsync(schoolId, personIds, ct)`
  → `IReadOnlyDictionary<Guid, Guid>` (Person.Id → Account.Id), bağlı hesabı olmayanlar
  DIŞLANIR. Altı duyuru bildirim handler'ı bunu kullanıyor.
- `NotificationKind`: 1–15 mevcut modüller, **16 = `AnnouncementPublished`**, 17–21 A2
  (`Withdrawn`/`Amended`/`SubmittedForApproval`/`Approved`/`Rejected`).
  **22 boştur.**
- `IFileEntityScopeResolver`: `string EntityType { get; }` +
  `Task<bool> CanAccessAsync(Guid entityId, FileAccessIntent intent, CancellationToken ct)`.
  DI kaydı `Oksis.Infrastructure/DependencyInjection.cs:323-331`.
- `AttachFileCommand(Guid FileId, string EntityType, Guid EntityId, int Version = 1,
  int DisplayOrder = 0, string? Description = null)`; handler `PendingUpload`/`SoftDeleted`
  statülerini reddeder ve `IFileAccessGuard`'ı `FileAccessIntent.Write` ile çağırır.
- `StoredFile`: `OriginalFileName`, `ContentType`, `SizeBytes`, `Category`, `Status`,
  `VirusScanStatus`.
- Dosya indirme yüzeyi: `GET /api/v1/files/{id}/download-url` (imzalı URL üreten uç).
- `AnnouncementMapper.ToDto(a, targets, isRead, childIds, seenCount)` — bugün
  `Attachment = null, // A3: Documents entegrasyonu` yazıyor.
- `AnnouncementsController`: 15 uç, `[Route("api/v1/announcements")]`.
  `AnnouncementsControllerTests` sayıyı 15'e sabitliyor ve **kendi doc'unda A3'ün bu testi
  kıracağını, kırılmasının İSTENDİĞİNİ yazıyor.**

---

## Spec'e karşı dört plan-seviyesi düzeltme

### D-1 — INV-1'in sınırı DARALTILIR, bekçi GÜÇLENDİRİLİR

**Çatışma:** Spec §12 dilim 6 `DELETE /announcements/templates/{id}` istiyor.
`AnnouncementHardDeleteGuardTests.GuardedDbSets` ise `AnnouncementTemplates`'i de koruyor —
yani şablon silme ucu bu testi kaynak taramasıyla kırar.

**Karar:** `AnnouncementTemplates` guard listesinden **çıkarılır**, ama boşluk bırakılmaz:
yerine **tek-çağrı-yeri karşı testi** gelir (Görev 1).

**Gerekçe:** INV-1 "duyuru kurumsal kayıttır, silinmez" der. Şablon kurumsal kayıt DEĞİLDİR
— entity'nin kendi doc'u onu *"AYRI aggregate (duyurunun içinde yaşamaz)"* diye tanımlar ve
sözlük onu *"hazır duyuru metni"* diye tarif eder. Yayınlanmamış bir metin kalıbının
silinmesi hiçbir alıcının gördüğü hiçbir kaydı yok etmez. A1 beş DbSet'i tek listeye
süpürürken bu ayrımı yapmamıştı; listenin kapsamı fazlaydı.

**Bekçi neden ZAYIFLAMIYOR:** eski test "hiçbir yerde `.AnnouncementTemplates.Remove(` yok"
diyordu. Yenisi "**tam olarak bir** dosyada var, o da `DeleteAnnouncementTemplateCommandHandler.cs`"
diyor. İkinci bir silme yolu (ör. duyuru silmeye giden bir uç, ya da bir job'ın toplu
temizliği) yine KIRILIR. Duyuru aggregate'inin dört DbSet'i için "sıfır çağrı" kuralı
**aynen** kalır.

### D-2 — `GET /publishers` handler'da envantere daraltılır

**Çatışma:** Spec §6 tablosu `GET /publishers` → izin `view`, "handler'da ek daraltma" kolonu
boş. Ama `announcements.view` VELİDE ve ÖĞRENCİDE de vardır (gelen kutusu için).
Daraltmasız bir `/publishers` her veliye okulun tüm personelinin adını ve `Person.Id`'sini
verir — bir roster sızıntısı.

**Karar:** İzin anahtarı spec'teki gibi `announcements.view` kalır (kontrat sadakati), ama
handler `AnnouncementCallerResolver.CanUseInventoryAsync` geçmeyeni `Forbidden` yapar.

**Emsal:** `GetAnnouncementsQuery` tam olarak bunu yapıyor — `view` ilan eder, envanteri
`create` ile kapatır. İki katman birbirinin yerine geçmez (spec §4 notu).

### D-3 — `NotificationKind` 22 VE 23 eklenir

**Çatışma:** Spec §8.2 yedi duyuru değeri sayar ve `AnnouncementScheduledExecuted` bunlardan
biridir. Ama spec §9 ayrıca şunu ister: *"Hedef yayın anında boş kalırsa yayınlamaz ve
yayınlayana bildirim gider"*. Bu İKİNCİ bir olaydır ve §8.2 listesinde karşılığı yoktur.

**Karar:** `AnnouncementScheduledExecuted = 22` (zamanlanmış duyuru yayına çıktı → YAYINLAYANA)
ve `AnnouncementScheduleFailed = 23` (hedef boş kaldı, yayınlanmadı → YAYINLAYANA) eklenir.
**Araya ekleme yok** — `notification_delivery_logs`'ta int'ler kalıcıdır.

**Gerekçe:** Tek bir kind'ı iki anlama gelecek şekilde kullanmak, derin bağlantıyı ve
bildirim gövdesini belirsizleştirir; alıcı "duyurun gitti" ile "duyurun gitmedi"yi aynı
rozetten ayırt edemez.

### D-4 — Gönderim raporunda `unreachable` listesi SINIRLANIR ve sınır AÇIKÇA SÖYLENİR

**Çatışma:** `DeliveryReportDto.unreachable` bir dizidir ve sayı alanı yoktur. 1200 kişilik
bir okulda okul geneli bir duyuruda bu dizi yüzlerce satır olabilir.

**Karar:** Liste en çok **100** satır döner. Kesin sayı istemcide `total - reached` ile
türetilebilir ve bu handler doc'una + testine yazılır. Sessiz kısaltma YASAKTIR: sınır
testle sabitlenir (Görev 8).

---

## Pre-flight taraması (plan self-review'ünün sonucu)

Plan kendi self-review'ünden geçti (spec kapsamı, placeholder taraması, tip tutarlılığı).
Review rubriğiyle çatışabilecek **dört bilinçli plan kararı** — hepsi burada beyan edilir
ki reviewer onları "eksik" diye işaretlemesin:

1. **Görev 1 bir testi BİLEREK KIRMIZI bırakır** ve o kırmızı Görev 5'e kadar sürer.
   Sebebi, D-1'in karşı testinin koruduğu üretim kodunun (silme handler'ı) henüz
   yazılmamış olmasıdır. Kırmızı BEYAN EDİLİR, sayısı sabitlenir (domain 672/1) ve
   Görev 2/3/4'ün raporları onu "bilinen ve beyan edilmiş" diye taşır. Görev 5'in çıkış
   kriteri onu yeşile çevirmektir. **A2'de bir testin sekiz görev boyunca fark edilmeden
   kırmızı kalması dalın en pahalı hatasıydı; bu yüzden burada tam tersi yapılır.**

2. **Görev 8, 11, 12, 13, 14, 15 ve 17'nin bazı testleri İSKELET olarak verilir** — gövde
   yerine, sınanacak iddiayı harfiyen tarif eden bir doc yorumu. Bu, planın geri kalanında
   yapılmayan bilinçli bir istisnadır ve gerekçesi şudur: bu testlerin kurulum kodu
   tamamen `AnnouncementAudienceFixture`'ın ve mevcut job/bildirim test kalıplarının
   gerçek şekline bağlıdır, ve o şekilleri plana kopyalamak **uydurma bir API'yi plana
   yazma** riskini taşırdı (A1'de dokuz tahminin dokuzu da yanlış çıkmıştı).
   **İskelet, gevşetme değildir:** her doc yorumu plan-mandated'dır ve implementer onu
   silemez, zayıflatamaz, "benzer bir şey" yazamaz. Her iskelet görevin brief'i, kalıbın
   alınacağı GERÇEK dosyayı adıyla gösterir.

3. **On görev implementer'dan üretim kodunu GEÇİCİ olarak mutasyona uğratıp geri
   almasını ister** (Görev 1, 5, 7, 8, 10, 11, 12, 13, 14, 15). A1'in *"reviewer üretim
   kodunu zayıflatmasın"* güvenlik notu REVIEWER içindir; bu, implementer'ın geri alınan
   ve raporlanan mutasyon denetimidir (A1 Görev 10, A2 Görev 2/5 emsali). Her mutasyonun
   BEKLENEN ölü test sayısı planda yazılıdır — "hiçbiri" veya "hepsi" cevabı testlerin
   yanlış olduğunu gösterir ve o durumda testler düzeltilir.

4. **Görev 10 ve 16 REFACTOR'dür ve sıfır yeni test ekler.** Çıkış kriterleri "mevcut
   testler TEK BİR DEĞİŞİKLİK OLMADAN yeşil kalır"dır. Bir reviewer bunu "test yok" diye
   işaretlerse yanlış atıftır: davranış yeni değildir, dolayısıyla yeni test onu
   kanıtlamaz — mevcut testlerin değişmeden geçmesi kanıtlar. Görev 16 tek istisnayla
   +3 test alır (`AnnouncementCallerTests`), çünkü orada gerçekten yeni bir kural doğar.

---

## Spec kapsamı — A3'ün ALDIĞI ve ALMADIĞI

**Alınan (spec dilim 6–8, §9, §10, §7):** tabloda 17 görev olarak dağıtılmıştır.

**Bilinçli olarak ALINMAYAN — ve neden:**

| Spec maddesi | Karar |
|---|---|
| §15 `modules/announcements/` (9 doküman, ~110 `{{TBD}}`) | **A3 dışı.** Bu bir dokümantasyon projesidir, bir kod dilimi değil; 110 yer tutucuyu doldurmak A3'ün 17 görevine eşit bir iştir ve kod teslimini geciktirir. Küçük ve doğrulanabilir iki madde (`permission-matrix.md`'den `delete` kaldırma, `notification-matrix.md`'ye olayları ekleme) **Görev 17e'de yapılır**; kalan dokuz doküman B fazından sonraya, gerçek uçlara karşı yazılmak üzere bırakılır. |
| §15 `analysis_standards.md` §7.3 yığın notu | **A3 dışı** — duyuru modülüyle ilgisiz bir depo-geneli düzeltmedir. |
| §8.4 mobil derin bağlantı (`oksis://parent/announcements/:id`) | **C fazı** (spec zaten öyle diyor). A3 backend işidir. |
| §14 frontend boşlukları | **C fazı.** |
| §13 codegen ve `contract.ts`/`paths.ts` silinmesi | **B fazı.** A3 boyunca ikisi de DURUR — silinirse 11 endpoint fonksiyonu ve 13 hook tipsiz kalır. |
| `oksis-ui/packages/core` → `requiresApproval`'ın sıfır testi | **Sahipsiz, A3 dışı.** Spec §11 ve A2 planı "20 birim testiyle korunuyor" diyordu; o 20 test dosyanın TAMAMINA ait, `requiresApproval`'a değil (`grep -c requiresApproval logic.test.ts` → 0). INV-5'in "istemci ve backend ayrışmasın" güvenlik ağı şu an YALNIZ backend'de sabitli. C fazına veya `oksis-ui` backlog'una atanmalıdır. |

---

## Dosya yapısı

### Yeni dosyalar — üretim

```
src/Oksis.Domain/Modules/Announcements/Entities/
  AnnouncementTemplate.cs                       (MODIFY — Update() eklenir)
  Announcement.cs                               (değişmez)

src/Oksis.Application/Modules/Announcements/
  DTOs/AnnouncementTemplateDto.cs               (YENİ)
  DTOs/AnnouncementPublisherDto.cs              (YENİ)
  DTOs/DeliveryReportDto.cs                     (YENİ)
  Commands/CreateAnnouncementTemplate/          (YENİ — komut + validator + handler)
  Commands/UpdateAnnouncementTemplate/          (YENİ — komut + validator + handler)
  Commands/DeleteAnnouncementTemplate/          (YENİ — komut + handler)
  Queries/GetAnnouncementTemplates/             (YENİ — sorgu + handler)
  Queries/GetAnnouncementPublishers/            (YENİ — sorgu + handler)
  Queries/GetAnnouncementDeliveryReport/        (YENİ — sorgu + handler)
  Common/AnnouncementPublicationService.cs      (YENİ — Approve + Job ortak yayın yolu)
  Common/AnnouncementModerationWire.cs          (YENİ — mod dizelerinin tek kaynağı)

src/Oksis.Application/Modules/Documents/Security/
  AnnouncementEntityScopeResolver.cs            (YENİ — üçüncü kapsam çözümleyici)

src/Oksis.Infrastructure/BackgroundJobs/Jobs/
  PublishScheduledAnnouncementsJob.cs           (YENİ)
  ExpireAnnouncementsJob.cs                     (YENİ)

src/Oksis.Api/Controllers/V1/
  AnnouncementTemplatesController.cs            (YENİ — dört uç, D-1)
  AnnouncementsController.cs                    (MODIFY — +2 uç, 403 ilanları)
```

### Yeni dosyalar — test

```
tests/Oksis.Domain.UnitTests/Modules/Announcements/
  AnnouncementTemplateTests.cs                  (MODIFY — Update testleri)
  AnnouncementHardDeleteGuardTests.cs           (MODIFY — D-1)

tests/Oksis.Application.UnitTests/Modules/Announcements/
  AnnouncementTemplateValidatorTests.cs         (YENİ)
  AnnouncementPermissionSurfaceTests.cs         (MODIFY — +6 satır)
  NotificationKindContinuityTests.cs            (MODIFY — 22/23)
  AnnouncementModerationWireTests.cs            (YENİ)

tests/Oksis.Api.UnitTests/Controllers/V1/
  AnnouncementsControllerTests.cs               (MODIFY — 15 → 17)
  AnnouncementTemplatesControllerTests.cs       (YENİ — D-1'in API yüzü)

tests/Oksis.Infrastructure.IntegrationTests/Persistence/
  AnnouncementTemplateEndpointTests.cs          (YENİ)
  GetAnnouncementPublishersTests.cs             (YENİ)
  GetAnnouncementDeliveryReportTests.cs         (YENİ)
  PublishScheduledAnnouncementsJobTests.cs      (YENİ)
  ExpireAnnouncementsJobTests.cs                (YENİ)
  AnnouncementAttachmentTests.cs                (YENİ)
  AnnouncementScheduleNotificationTests.cs      (YENİ)
```

---

## Görev tablosu

| # | Görev | Dosya | Süit(ler) |
|---|---|---|---|
| 1 | INV-1 sınırının netleştirilmesi + `AnnouncementTemplate.Update` | bu dosya | Domain |
| 2 | `GET /templates` — sorgu + handler | bu dosya | Application, Integration |
| 3 | `POST /templates` — komut + validator + handler + 409 kolu | bu dosya | Application, Integration, Api |
| 4 | `PUT /templates/{id}` — komut + validator + handler | bu dosya | Application, Integration |
| 5 | `DELETE /templates/{id}` — komut + handler | bu dosya | Application, Integration, Domain |
| 6 | `AnnouncementTemplatesController` + API bekçisi | bu dosya | Api, Integration |
| 7 | `GET /publishers` | `-2.md` | Application, Integration |
| 8 | `GET /{id}/delivery-report` | `-2.md` | Application, Integration |
| 9 | Controller'a iki uç + 403 ilanları + sayı 15→17 | `-2.md` | Api |
| 10 | `AnnouncementPublicationService` çıkarımı | `-2.md` | Integration |
| 11 | `NotificationKind` 22/23 + zamanlanmış yayın job'ı | `-2.md` | Application, Integration |
| 12 | Zamanlanmış yayın bildirim handler'ları | `-2.md` | Integration |
| 13 | `ExpireAnnouncementsJob` + Hangfire kayıtları | `-3.md` | Integration, Api |
| 14 | `AnnouncementEntityScopeResolver` + DI | `-3.md` | Application, Integration |
| 15 | `attachmentFileId` uçtan uca bağlanması | `-3.md` | Application, Integration |
| 16 | `AnnouncementCaller` kapısı + create handler'ın ortak yola alınması | `-3.md` | Application, Integration |
| 17 | Denetim izi konvansiyonu + moderasyon dizeleri + devreden test boşlukları | `-3.md` | Application, Integration |

---

## Görev 1: INV-1 sınırının netleştirilmesi + `AnnouncementTemplate.Update`

**Files:**
- Modify: `tests/Oksis.Domain.UnitTests/Modules/Announcements/AnnouncementHardDeleteGuardTests.cs`
- Modify: `tests/Oksis.Domain.UnitTests/Modules/Announcements/AnnouncementTemplateTests.cs`
- Modify: `src/Oksis.Domain/Modules/Announcements/Entities/AnnouncementTemplate.cs`

**Interfaces:**
- Produces: `AnnouncementTemplate.Update(string name, string description, bool urgent)` — void,
  `AnnouncementDomainException` fırlatır. Görev 4 kullanır.
- Produces: `AnnouncementHardDeleteGuardTests` artık DÖRT DbSet için sıfır-çağrı, şablon için
  tek-çağrı-yeri kuralı uygular. Görev 5 bu kuralın izin verdiği tek çağrıyı yazar.

**Bağlam — bu görev NEDEN var:** D-1'i oku. Bu görev planın en hassas kararını uygular:
bir bekçiyi daraltıp yerine daha dar ama daha keskin bir bekçi koyar. **Bekçiyi silme,
`GuardedDbSets`'ten `AnnouncementTemplates`'i çıkarıp geçme.** Yeni testi de yaz.

- [ ] **Step 1: Şablon `Update` için failing testleri yaz**

`tests/Oksis.Domain.UnitTests/Modules/Announcements/AnnouncementTemplateTests.cs` sonuna ekle
(dosyanın mevcut `using`'leri ve sınıf adı korunur — sadece bu testler eklenir):

```csharp
    [Fact]
    public void Should_UpdateFields_When_TemplateIsUpdated()
    {
        var template = AnnouncementTemplate.Create(
            Guid.NewGuid(), "Veli Toplantısı", "Sayın velimiz,", urgent: false);

        template.Update("Veli Toplantısı Duyurusu", "Sayın velimiz, toplantımız...", urgent: true);

        template.Name.Should().Be("Veli Toplantısı Duyurusu");
        template.Description.Should().Be("Sayın velimiz, toplantımız...");
        template.Urgent.Should().BeTrue();
    }

    [Fact]
    public void Should_TrimFields_When_TemplateIsUpdated()
    {
        var template = AnnouncementTemplate.Create(
            Guid.NewGuid(), "Ad", "Metin", urgent: false);

        template.Update("  Yeni Ad  ", "  Yeni Metin  ", urgent: false);

        template.Name.Should().Be("Yeni Ad");
        template.Description.Should().Be("Yeni Metin");
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Should_Reject_When_UpdatedNameIsBlank(string blank)
    {
        var template = AnnouncementTemplate.Create(
            Guid.NewGuid(), "Ad", "Metin", urgent: false);

        var act = () => template.Update(blank, "Metin", urgent: false);

        act.Should().Throw<AnnouncementDomainException>()
            .Where(e => e.Code == "Announcements.Template.NameRequired");
    }

    /// <summary>
    /// Kullanım sayacı bir KULLANIM ölçüsüdür, bir düzenleme ölçüsü değil. Şablonun metni
    /// değiştiğinde sayaç sıfırlanırsa envanterdeki "bu şablon işe yarıyor mu" sinyali kaybolur.
    /// </summary>
    [Fact]
    public void Should_PreserveUsageCounters_When_TemplateIsUpdated()
    {
        var template = AnnouncementTemplate.Create(
            Guid.NewGuid(), "Ad", "Metin", urgent: false);
        var usedAt = new DateTimeOffset(2026, 5, 1, 9, 0, 0, TimeSpan.Zero);
        template.RegisterUse(usedAt);

        template.Update("Yeni Ad", "Yeni Metin", urgent: true);

        template.UsageCount.Should().Be(1);
        template.LastUsedAt.Should().Be(usedAt);
    }
```

- [ ] **Step 2: Testlerin DERLENMEDİĞİNİ doğrula**

```bash
dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~AnnouncementTemplateTests"
```

Beklenen: derleme hatası — `'AnnouncementTemplate' does not contain a definition for 'Update'`.

- [ ] **Step 3: `Update` metodunu yaz**

`src/Oksis.Domain/Modules/Announcements/Entities/AnnouncementTemplate.cs` — `Create`'in
doğrulamasını paylaşan bir normalize yardımcısı çıkararak (iki yerde ayrı yazılmasın):

```csharp
    /// <summary>
    /// Şablon metnini günceller. <b>Saat parametresi ALMAZ</b> — düzenleme bir iş zamanı
    /// yazmaz; <c>UpdatedAt</c>'i <c>AuditingInterceptor</c> yazar (A2 Görev 4 kararı).
    ///
    /// <para><see cref="UsageCount"/> ve <see cref="LastUsedAt"/> KORUNUR: sayaç şablonun
    /// kullanım değerini ölçer, metninin yaşını değil.</para>
    /// </summary>
    public void Update(string name, string description, bool urgent)
    {
        Name = NormalizeName(name);
        Description = (description ?? string.Empty).Trim();
        Urgent = urgent;
    }

    /// <summary>
    /// Ad normalizasyonu — <see cref="Create"/> ile <see cref="Update"/> AYNI kuralı uygular.
    /// İki yerde ayrı yazılsaydı güncelleme, oluşturmanın kabul etmeyeceği bir adı kabul ederdi.
    /// </summary>
    private static string NormalizeName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new AnnouncementDomainException(
                "Announcements.Template.NameRequired", "Şablon adı zorunludur.");
        }

        return name.Trim();
    }
```

Ve `Create` içindeki mevcut `if (string.IsNullOrWhiteSpace(name)) { throw ... }` bloğu ile
`Name = name.Trim()` ataması `Name = NormalizeName(name)` ile DEĞİŞTİRİLİR (kural tek yerde).

- [ ] **Step 4: Domain testlerinin geçtiğini doğrula**

```bash
dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~AnnouncementTemplateTests"
```

Beklenen: PASS.

- [ ] **Step 5: INV-1 bekçisini daralt ve karşı testi yaz (failing)**

`tests/Oksis.Domain.UnitTests/Modules/Announcements/AnnouncementHardDeleteGuardTests.cs`:

`GuardedDbSets` dizisinden `"AnnouncementTemplates"` çıkarılır ve sınıf doc'una
gerekçe eklenir:

```csharp
    // Bkz. IApplicationDbContext.cs — Announcement AGGREGATE'inin dört DbSet'i.
    //
    // `AnnouncementTemplates` BİLİNÇLİ OLARAK BU LİSTEDE DEĞİLDİR (A3 D-1). INV-1 "duyuru
    // kurumsal kayıttır, silinmez" der; şablon kurumsal kayıt DEĞİLDİR — entity'nin kendi
    // doc'u onu "AYRI aggregate (duyurunun içinde yaşamaz)" diye tanımlar ve sözlük onu
    // "hazır duyuru metni" diye tarif eder. Silinen bir metin kalıbı hiçbir alıcının gördüğü
    // hiçbir kaydı yok etmez. A1 beş DbSet'i tek listeye süpürürken bu ayrımı yapmamıştı.
    //
    // Şablon KORUMASIZ KALMAZ: aşağıdaki
    // Should_AllowTemplateRemoval_OnlyFrom_TheDeleteHandler testi silmeye TEK bir çağrı yeri
    // tanır. İkinci bir silme yolu (duyuru silen bir uç, toplu temizlik yapan bir job) yine
    // KIRILIR — kural gevşemedi, ADRESLENDİ.
    private static readonly string[] GuardedDbSets =
    [
        "Announcements", "AnnouncementTargets", "AnnouncementRecipients",
        "AnnouncementAuditEntries",
    ];

    /// <summary>Şablon silmeye izinli TEK dosya. Görev 5 bunu yazar.</summary>
    private const string TemplateDeleteHandlerFile = "DeleteAnnouncementTemplateCommandHandler.cs";
```

Ve yeni test (mevcut testin altına):

```csharp
    /// <summary>
    /// D-1'in ikinci yarısı: şablon SİLİNEBİLİR, ama YALNIZ bir yerden.
    ///
    /// <para>Bu test, kaldırılan <c>AnnouncementTemplates</c> guard satırının yerine geçer ve
    /// ondan DAHA DAR bir kural kodlar: eski kural "sıfır çağrı" diyordu ve şablon silme ucunu
    /// imkânsız kılıyordu; yenisi "tam olarak bir çağrı, o da silme handler'ında" diyor.
    /// İkinci bir çağrı yeri (ör. duyuruyu silmeye çalışan bir uç, şablonları toplu temizleyen
    /// bir job, ya da yanlışlıkla <c>Announcements</c> yerine yazılmış bir satır) KIRILIR.</para>
    /// </summary>
    [Fact]
    public void Should_AllowTemplateRemoval_OnlyFrom_TheDeleteHandler()
    {
        var srcDir = Path.Combine(FindRepoRoot(), "src");
        var callSites = new List<string>();

        foreach (var file in Directory.EnumerateFiles(srcDir, "*.cs", SearchOption.AllDirectories))
        {
            foreach (var line in File.ReadLines(file))
            {
                var trimmed = line.TrimStart();
                if (trimmed.StartsWith("//", StringComparison.Ordinal)
                    || trimmed.StartsWith("*", StringComparison.Ordinal)
                    || trimmed.StartsWith("/*", StringComparison.Ordinal))
                {
                    continue;
                }

                if (line.Contains(".AnnouncementTemplates.Remove(", StringComparison.Ordinal)
                    || line.Contains(".AnnouncementTemplates.RemoveRange(", StringComparison.Ordinal))
                {
                    callSites.Add(Path.GetFileName(file));
                }
            }
        }

        callSites.Should().ContainSingle(
            "şablon silme TEK bir kod yolundan geçmelidir — ikinci bir yol, denetlenmemiş bir " +
            "silme kapısı demektir")
            .Which.Should().Be(TemplateDeleteHandlerFile,
                "izinli tek çağrı yeri şablon silme handler'ıdır");
    }
```

- [ ] **Step 6: Yeni testin KIRMIZI olduğunu doğrula**

```bash
dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~AnnouncementHardDeleteGuardTests"
```

Beklenen: `Should_NeverCallRemove_OnAnnouncementDbSets_AnywhereInSource` PASS,
`Should_AllowTemplateRemoval_OnlyFrom_TheDeleteHandler` **FAIL** — `callSites` boş
("Expected callSites to contain a single item, but the collection is empty").

**Bu kırmızı DOĞRUDUR ve Görev 5'e kadar KIRMIZI KALIR.** Bunu raporuna açıkça yaz:
"Görev 1 domain süitini `667 → 672 geçti / 1 kırmızı` bırakır; kırmızı Görev 5'te kapanır."

> **KONTROLÖRE NOT:** Bu, planın bilinçli olarak kırmızı bıraktığı TEK testtir ve nedeni
> Görev 5'in üretim kodunu henüz yazmamış olmasıdır. A2'de bir testin sekiz görev boyunca
> fark edilmeden kırmızı kalması dalın en pahalı hatasıydı; bu yüzden burada kırmızı
> BEYAN EDİLİR, sayısı sabitlenir ve Görev 5'in çıkış kriteri onu yeşile çevirmektir.
> Görev 2/3/4 raporlarının hepsi "domain: 672/1, bilinen ve beyan edilmiş" yazmalıdır.

- [ ] **Step 7: Mutasyon denetimi — yeni testin ayırt edici olduğunu kanıtla**

`TemplateDeleteHandlerFile` sabitini GEÇİCİ olarak `"WrongFile.cs"` yap ve testi koş.
Zaten kırmızı olduğu için bu tek başına kanıt DEĞİLDİR — bu yüzden şunu yap:

Testin gövdesindeki `callSites` listesine geçici olarak elle `"DeleteAnnouncementTemplateCommandHandler.cs"`
ekle (`callSites.Add(...)` satırını döngüden sonra), testi koş:
- `TemplateDeleteHandlerFile == "DeleteAnnouncementTemplateCommandHandler.cs"` → PASS
- `TemplateDeleteHandlerFile == "WrongFile.cs"` → FAIL

Her iki mutasyonu da GERİ AL ve raporunda gözlemlediğin iki sonucu yaz. Bu, dosya adı
iddiasının gerçekten sınandığını kanıtlar (yalnız "liste boş" hatasını okumuş olmazsın).

- [ ] **Step 8: Tüm domain süitini koş**

```bash
dotnet test tests/Oksis.Domain.UnitTests
```

Beklenen: **672 geçti / 1 kırmızı, 673 toplam** (taban 667, delta tam **+6 test VAKASI**;
kırmızı beyan edilmiş `Should_AllowTemplateRemoval_OnlyFrom_TheDeleteHandler`).

> **PLAN DÜZELTMESİ (Görev 1 implementer'ının bulgusu, 2026-08-03):** bu satır önce "+4 yeni
> test" diyordu ve YANLIŞTI. Eklenenler üç `[Fact]` + bir `[Theory]`
> (`Should_Reject_When_UpdatedNameIsBlank`, iki `[InlineData]`) + bir kırmızı guard testidir.
> **xUnit her `[InlineData]`'yı AYRI test sayar**, dolayısıyla delta +6 vakadır: 5 yeşil +
> 1 beyan edilmiş kırmızı. Sonraki görevlerin domain tabanı **673 toplam**'dır. Kod
> DEĞİŞMEDİ — bu bir plan aritmetiği hatasıydı, bir üretim kusuru değil.

- [ ] **Step 9: Solution'ı derle**

```bash
dotnet build Oksis.slnx
```

Beklenen: 0 uyarı, 0 hata.

- [ ] **Step 10: Commit**

```bash
git add src/Oksis.Domain/Modules/Announcements/Entities/AnnouncementTemplate.cs \
        tests/Oksis.Domain.UnitTests/Modules/Announcements/AnnouncementTemplateTests.cs \
        tests/Oksis.Domain.UnitTests/Modules/Announcements/AnnouncementHardDeleteGuardTests.cs
git commit -m "feat(core): sablon guncelleme domain metodu ve INV-1 sinirinin netlestirilmesi

INV-1 duyuru aggregate'ini korur; sablon ayri bir aggregate'tir ve silinebilir.
Guard listesi dorde indi, yerine sablon silmeye tek cagri yeri taniyan karsi test
geldi. Karsi test Gorev 5'e kadar bilerek kirmizi kalir."
```

---

## Görev 2: `GET /templates` — sorgu + handler

**Files:**
- Create: `src/Oksis.Application/Modules/Announcements/DTOs/AnnouncementTemplateDto.cs`
- Create: `src/Oksis.Application/Modules/Announcements/Queries/GetAnnouncementTemplates/GetAnnouncementTemplatesQuery.cs`
- Create: `src/Oksis.Application/Modules/Announcements/Queries/GetAnnouncementTemplates/GetAnnouncementTemplatesQueryHandler.cs`
- Create: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/AnnouncementTemplateEndpointTests.cs`
- Modify: `tests/Oksis.Application.UnitTests/Modules/Announcements/AnnouncementPermissionSurfaceTests.cs`

**Interfaces:**
- Consumes: `AnnouncementTemplate` (Görev 1'de `Update` kazandı).
- Produces: `AnnouncementTemplateDto` — Görev 3/4 aynı DTO'yu döner.
  `GetAnnouncementTemplatesQuery()` — Görev 6 controller'dan çağırır.

**Kontrat gerçeği (tel şekli DEĞİŞTİRİLEMEZ):** `packages/api/src/announcements/contract.ts:84`

```ts
export interface AnnouncementTemplateDto {
  id: string
  name: string
  description: string
  usageCount: number
  lastUsedAt: string | null
  urgent: boolean
}
```

- [ ] **Step 1: Failing entegrasyon testini yaz**

`tests/Oksis.Infrastructure.IntegrationTests/Persistence/AnnouncementTemplateEndpointTests.cs`:

```csharp
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Modules.Announcements.Queries.GetAnnouncementTemplates;
using Oksis.Domain.Modules.Announcements.Entities;
using Xunit;

namespace Oksis.Infrastructure.IntegrationTests.Persistence;

/// <summary>
/// Şablon uçları (A3 dilim 6). Şablon AYRI bir aggregate'tir: duyuruya bağlı değildir,
/// sezona bağlı değildir, okul bazlıdır ve SİLİNEBİLİR (bkz. A3 D-1).
/// </summary>
[Collection(DatabaseCollection.Name)]
public sealed class AnnouncementTemplateEndpointTests : IAsyncLifetime
{
    private readonly DatabaseFixture _fixture;
    private OksisDbContext _db = default!;
    private Guid _schoolId;

    public AnnouncementTemplateEndpointTests(DatabaseFixture fixture) => _fixture = fixture;

    public async Task InitializeAsync()
    {
        _db = _fixture.CreateDbContext();
        _schoolId = await AnnouncementAudienceFixture.EnsureSchoolAsync(_db);
    }

    public Task DisposeAsync()
    {
        _db.Dispose();
        return Task.CompletedTask;
    }

    [Fact]
    public async Task Should_ReturnTemplatesOfThisSchoolOnly_When_TemplatesAreListed()
    {
        var otherSchoolId = Guid.NewGuid();
        _db.AnnouncementTemplates.Add(
            AnnouncementTemplate.Create(_schoolId, "Veli Toplantısı", "Sayın velimiz", urgent: false));
        _db.AnnouncementTemplates.Add(
            AnnouncementTemplate.Create(otherSchoolId, "Başka Okul", "Metin", urgent: false));
        await _db.SaveChangesAsync();

        var handler = new GetAnnouncementTemplatesQueryHandler(_db, Tenant(_schoolId));
        var result = await handler.Handle(new GetAnnouncementTemplatesQuery(), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value!.Should().ContainSingle();
        result.Value![0].Name.Should().Be("Veli Toplantısı");
    }

    /// <summary>
    /// Envanter kullanışlı olmalıdır: en çok kullanılan şablon en üstte. Sıralama ada göre
    /// olsaydı "A" ile başlayan hiç kullanılmamış bir şablon, okulun her hafta kullandığı
    /// şablonun üstünde kalırdı.
    /// </summary>
    [Fact]
    public async Task Should_OrderByUsageDescendingThenName_When_TemplatesAreListed()
    {
        var rare = AnnouncementTemplate.Create(_schoolId, "Az Kullanılan", "M", urgent: false);
        var common = AnnouncementTemplate.Create(_schoolId, "Zil Değişikliği", "M", urgent: false);
        var never = AnnouncementTemplate.Create(_schoolId, "Ara Tatil", "M", urgent: false);

        rare.RegisterUse(new DateTimeOffset(2026, 3, 1, 8, 0, 0, TimeSpan.Zero));
        common.RegisterUse(new DateTimeOffset(2026, 3, 1, 8, 0, 0, TimeSpan.Zero));
        common.RegisterUse(new DateTimeOffset(2026, 4, 1, 8, 0, 0, TimeSpan.Zero));

        _db.AnnouncementTemplates.AddRange(rare, common, never);
        await _db.SaveChangesAsync();

        var handler = new GetAnnouncementTemplatesQueryHandler(_db, Tenant(_schoolId));
        var result = await handler.Handle(new GetAnnouncementTemplatesQuery(), CancellationToken.None);

        result.Value!.Select(t => t.Name).Should()
            .ContainInOrder("Zil Değişikliği", "Az Kullanılan", "Ara Tatil");
    }

    [Fact]
    public async Task Should_MapWireShape_When_TemplateIsReturned()
    {
        var usedAt = new DateTimeOffset(2026, 3, 1, 8, 0, 0, TimeSpan.Zero);
        var template = AnnouncementTemplate.Create(_schoolId, "Kar Tatili", "Yarın okul tatil", urgent: true);
        template.RegisterUse(usedAt);
        _db.AnnouncementTemplates.Add(template);
        await _db.SaveChangesAsync();

        var handler = new GetAnnouncementTemplatesQueryHandler(_db, Tenant(_schoolId));
        var dto = (await handler.Handle(new GetAnnouncementTemplatesQuery(), CancellationToken.None)).Value![0];

        dto.Id.Should().Be(template.Id.ToString());
        dto.Name.Should().Be("Kar Tatili");
        dto.Description.Should().Be("Yarın okul tatil");
        dto.UsageCount.Should().Be(1);
        dto.LastUsedAt.Should().Be(usedAt.ToString("O"));
        dto.Urgent.Should().BeTrue();
    }

    [Fact]
    public async Task Should_ReturnForbidden_When_TenantIsMissing()
    {
        var handler = new GetAnnouncementTemplatesQueryHandler(_db, Tenant(null));

        var result = await handler.Handle(new GetAnnouncementTemplatesQuery(), CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("Error.Forbidden");
    }

    private static ITenantContext Tenant(Guid? schoolId)
    {
        var tenant = Substitute.For<ITenantContext>();
        tenant.CurrentSchoolId.Returns(schoolId);
        return tenant;
    }
}
```

> **Implementer'a not:** `AnnouncementAudienceFixture.EnsureSchoolAsync` gerçek adı ve imzası
> için `AnnouncementAudienceFixture.cs`'yi OKU ve bu dosyadaki kurulumu ona uydur —
> **paylaşılan fixture'a satır EKLEME** (A1'de bu iki kez sessizce 6 test kırdı). Fixture'da
> uygun bir "yalnız okul kur" yardımcısı yoksa, bu test sınıfı kendi `Guid` okul kimliğini
> üretip yalnız `AnnouncementTemplate` satırları yazsın — şablon tablosunun başka hiçbir
> tabloya FK'sı yoktur, dolayısıyla izole bir okul kimliği yeterlidir.
> `using NSubstitute;` ve `using Oksis.Application.Common.Abstractions;` ekle.

- [ ] **Step 2: Testlerin DERLENMEDİĞİNİ doğrula**

```bash
dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~AnnouncementTemplateEndpointTests"
```

Beklenen: derleme hatası — `GetAnnouncementTemplatesQuery` bulunamıyor.

- [ ] **Step 3: DTO'yu yaz**

`src/Oksis.Application/Modules/Announcements/DTOs/AnnouncementTemplateDto.cs`:

```csharp
namespace Oksis.Application.Modules.Announcements.DTOs;

/// <summary>
/// Hazır duyuru metni — <c>packages/api/src/announcements/contract.ts</c> içindeki
/// <c>AnnouncementTemplateDto</c> ile BİREBİR. Alan adı veya null'lanabilirlik
/// değiştirilirse codegen sonrası frontend typecheck'i kırılır; bilinçli drift bekçisi.
/// </summary>
public sealed record AnnouncementTemplateDto
{
    public required string Id { get; init; }
    public required string Name { get; init; }
    public required string Description { get; init; }
    public required int UsageCount { get; init; }
    public string? LastUsedAt { get; init; }
    public required bool Urgent { get; init; }
}
```

- [ ] **Step 4: Sorguyu ve handler'ı yaz**

`.../Queries/GetAnnouncementTemplates/GetAnnouncementTemplatesQuery.cs`:

```csharp
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Announcements.DTOs;

namespace Oksis.Application.Modules.Announcements.Queries.GetAnnouncementTemplates;

/// <summary>
/// Okulun şablon envanteri. İzin <c>announcements.view</c>'dur çünkü şablonu KULLANAN
/// (sekreter, öğretmen) onu yönetenden farklıdır — oluşturma/düzenleme/silme
/// <c>announcements.template.manage</c> ister (spec §6).
/// </summary>
[Tenancy(TenancyMode.Required)]
[RequirePermission("announcements.view")]
public sealed record GetAnnouncementTemplatesQuery : IQuery<IReadOnlyList<AnnouncementTemplateDto>>;
```

`.../GetAnnouncementTemplatesQueryHandler.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Announcements.DTOs;
using Oksis.Shared;

namespace Oksis.Application.Modules.Announcements.Queries.GetAnnouncementTemplates;

/// <summary>
/// Şablon envanteri. Sıralama <b>kullanım sayısına göre azalan</b>, eşitlikte ada göre —
/// envanter bir seçim yüzeyidir: okulun her hafta kullandığı şablon, hiç kullanılmamış bir
/// şablonun altında kalmamalıdır.
/// </summary>
public sealed class GetAnnouncementTemplatesQueryHandler(
    IApplicationDbContext db,
    ITenantContext tenant)
    : IQueryHandler<GetAnnouncementTemplatesQuery, IReadOnlyList<AnnouncementTemplateDto>>
{
    public async Task<Result<IReadOnlyList<AnnouncementTemplateDto>>> Handle(
        GetAnnouncementTemplatesQuery request, CancellationToken cancellationToken)
    {
        if (tenant.CurrentSchoolId is not { } schoolId)
        {
            return Result<IReadOnlyList<AnnouncementTemplateDto>>.Forbidden();
        }

        var templates = await db.AnnouncementTemplates.AsNoTracking()
            .Where(t => t.SchoolId == schoolId)
            .OrderByDescending(t => t.UsageCount)
            .ThenBy(t => t.Name)
            .Select(t => new AnnouncementTemplateDto
            {
                Id = t.Id.ToString(),
                Name = t.Name,
                Description = t.Description,
                UsageCount = t.UsageCount,
                LastUsedAt = t.LastUsedAt == null ? null : t.LastUsedAt.Value.ToString("O"),
                Urgent = t.Urgent,
            })
            .ToListAsync(cancellationToken);

        return Result<IReadOnlyList<AnnouncementTemplateDto>>.Success(templates);
    }
}
```

> **Implementer'a not:** `.ToString("O")` bir LINQ-to-SQL çevirisi olmayabilir. Eğer EF
> `InvalidOperationException: could not be translated` verirse, projeksiyonu iki adıma böl:
> önce `Select` ile anonim tipe (ham `DateTimeOffset?` ile) çekip `ToListAsync`, sonra
> bellekte DTO'ya çevir. **Sessizce `AsEnumerable()` serpme** — hangi yolu seçtiğini ve
> nedenini rapora yaz.

- [ ] **Step 5: İzin yüzeyi tablosuna satır ekle**

`tests/Oksis.Application.UnitTests/Modules/Announcements/AnnouncementPermissionSurfaceTests.cs`
→ `ExpectedPermissions()` içine, `GetAudiencePoolQuery` satırından sonra:

```csharp
        yield return [typeof(GetAnnouncementTemplatesQuery), "announcements.view"];
```

Dosyanın başına `using Oksis.Application.Modules.Announcements.Queries.GetAnnouncementTemplates;`
ekle.

- [ ] **Step 6: Testleri koş**

```bash
docker compose up -d garage && ./scripts/init-garage.sh
dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~AnnouncementTemplateEndpointTests"
dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~AnnouncementPermissionSurfaceTests"
```

Beklenen: ikisi de PASS.

- [ ] **Step 7: Dört süiti de koş ve deltaları doğrula**

```bash
dotnet build Oksis.slnx
dotnet test tests/Oksis.Domain.UnitTests
dotnet test tests/Oksis.Application.UnitTests
dotnet test tests/Oksis.Api.UnitTests
dotnet test tests/Oksis.Infrastructure.IntegrationTests
```

Beklenen: build 0 uyarı; Domain **672/1** (Görev 1'in beyan edilmiş kırmızısı);
Application 1489 + 2 (izin yüzeyi Theory'si iki testli) = **1491/0**;
Api **207/0**; Integration 726 + 4 = **730/0**.

- [ ] **Step 8: Commit**

```bash
git add src/Oksis.Application/Modules/Announcements/DTOs/AnnouncementTemplateDto.cs \
        src/Oksis.Application/Modules/Announcements/Queries/GetAnnouncementTemplates/ \
        tests/Oksis.Infrastructure.IntegrationTests/Persistence/AnnouncementTemplateEndpointTests.cs \
        tests/Oksis.Application.UnitTests/Modules/Announcements/AnnouncementPermissionSurfaceTests.cs
git commit -m "feat(api): duyuru sablonu listeleme sorgusu eklendi

Kontratta ilan edilmis ama backend'de hic yazilmamis uc. Siralama kullanim
sayisina gore azalan: envanter bir secim yuzeyidir."
```

---

## Görev 3: `POST /templates` — komut + validator + handler + 409 kolu

**Files:**
- Create: `src/Oksis.Application/Modules/Announcements/Commands/CreateAnnouncementTemplate/CreateAnnouncementTemplateCommand.cs`
- Create: `.../CreateAnnouncementTemplateCommandValidator.cs`
- Create: `.../CreateAnnouncementTemplateCommandHandler.cs`
- Create: `tests/Oksis.Application.UnitTests/Modules/Announcements/AnnouncementTemplateValidatorTests.cs`
- Modify: `src/Oksis.Api/Extensions/ResultExtensions.cs` (Announcements kovasına Duplicate kolu)
- Modify: `tests/Oksis.Api.UnitTests/Extensions/ResultExtensionsAnnouncementsTests.cs`
- Modify: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/AnnouncementTemplateEndpointTests.cs`
- Modify: `tests/Oksis.Application.UnitTests/Modules/Announcements/AnnouncementPermissionSurfaceTests.cs`

**Interfaces:**
- Consumes: `AnnouncementTemplateDto` (Görev 2), `AnnouncementTemplate.Create` (mevcut).
- Produces: `CreateAnnouncementTemplateCommand(string Name, string Description, bool Urgent)`
  → `ICommand<AnnouncementTemplateDto>`. Görev 6 controller'dan çağırır.
- Produces: `"Announcements.Template.NameDuplicate"` hata kodu → 409.

**Kontrat gerçeği:** `POST /announcements/templates` **donmuş kontratta YOKTUR**
(`paths.ts:275-287` yalnız `get` ilan eder; `post`/`put`/`delete` hepsi `never`). Backend
önden gider — A1'in `bucket`'ı ve A2'nin `attachmentFileId`'si gibi. Bu, B fazının drift
listesine **beşinci** madde olarak yazılacaktır (Görev 17'nin kapanış adımı).
Gövde şekli bu yüzden BURADA tanımlanır:

```ts
// B fazında contract.ts'e eklenecek
export interface CreateAnnouncementTemplateBody {
  name: string
  description: string
  urgent: boolean
}
```

- [ ] **Step 1: Failing validator testlerini yaz**

`tests/Oksis.Application.UnitTests/Modules/Announcements/AnnouncementTemplateValidatorTests.cs`:

```csharp
using FluentAssertions;
using Oksis.Application.Modules.Announcements.Commands.CreateAnnouncementTemplate;
using Xunit;

namespace Oksis.Application.UnitTests.Modules.Announcements;

/// <summary>
/// Şablon gövdesi doğrulaması. Sınırlar EF konfigürasyonundan gelir
/// (<c>AnnouncementTemplateConfiguration</c>: Name 120, Description 500) — validator ile
/// kolon genişliği AYRIŞIRSA 500 dönerdi, bu yüzden ikisi aynı sayıya bağlanır.
/// </summary>
public sealed class AnnouncementTemplateValidatorTests
{
    private readonly CreateAnnouncementTemplateCommandValidator _sut = new();

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Should_Reject_When_NameIsBlank(string blank)
    {
        var result = _sut.Validate(new CreateAnnouncementTemplateCommand(blank, "Metin", false));

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Name");
    }

    [Fact]
    public void Should_Reject_When_NameExceedsColumnWidth()
    {
        var result = _sut.Validate(
            new CreateAnnouncementTemplateCommand(new string('a', 121), "Metin", false));

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Name");
    }

    [Fact]
    public void Should_Accept_When_NameIsExactlyAtColumnWidth()
    {
        var result = _sut.Validate(
            new CreateAnnouncementTemplateCommand(new string('a', 120), "Metin", false));

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Should_Reject_When_DescriptionExceedsColumnWidth()
    {
        var result = _sut.Validate(
            new CreateAnnouncementTemplateCommand("Ad", new string('a', 501), false));

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Description");
    }

    /// <summary>
    /// Açıklama BOŞ OLABİLİR — şablon yalnız bir başlık kalıbı olabilir. Bunu ayrıca test
    /// ediyoruz çünkü "her string alanı NotEmpty yap" refleksi bu kuralı sessizce kırardı.
    /// </summary>
    [Fact]
    public void Should_Accept_When_DescriptionIsEmpty()
    {
        var result = _sut.Validate(new CreateAnnouncementTemplateCommand("Ad", "", false));

        result.IsValid.Should().BeTrue();
    }

    /// <summary>
    /// <c>null</c> açıklama, <c>NotNull</c> kuralı olmadan <c>MaximumLength</c>'i sessizce
    /// atlar ve handler'ın <c>?? string.Empty</c>'sine ulaşır — ama komut kaydı
    /// non-nullable ilan ettiği için elle kurulmuş bir çağrı NRE üretebilir. Kural açık olsun.
    /// </summary>
    [Fact]
    public void Should_Reject_When_DescriptionIsNull()
    {
        var result = _sut.Validate(new CreateAnnouncementTemplateCommand("Ad", null!, false));

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Description");
    }
}
```

- [ ] **Step 2: Testin DERLENMEDİĞİNİ doğrula**

```bash
dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~AnnouncementTemplateValidatorTests"
```

Beklenen: derleme hatası — `CreateAnnouncementTemplateCommand` bulunamıyor.

- [ ] **Step 3: Komutu ve validator'ı yaz**

`CreateAnnouncementTemplateCommand.cs`:

```csharp
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Announcements.DTOs;

namespace Oksis.Application.Modules.Announcements.Commands.CreateAnnouncementTemplate;

/// <summary>
/// Yeni hazır duyuru metni. <b>Yalnız yönetim oluşturur</b> (DYR-F-13, spec §6) —
/// sekreter ve öğretmen yalnız KULLANIR, bu yüzden okuma <c>announcements.view</c>,
/// yazma <c>announcements.template.manage</c> ister.
/// </summary>
[Tenancy(TenancyMode.Required)]
[RequirePermission("announcements.template.manage")]
public sealed record CreateAnnouncementTemplateCommand(
    string Name,
    string Description,
    bool Urgent) : ICommand<AnnouncementTemplateDto>;
```

`CreateAnnouncementTemplateCommandValidator.cs`:

```csharp
using FluentValidation;

namespace Oksis.Application.Modules.Announcements.Commands.CreateAnnouncementTemplate;

/// <summary>
/// Uzunluk sınırları <c>AnnouncementTemplateConfiguration</c>'daki kolon genişlikleriyle
/// AYNI olmalıdır — ayrışırlarsa 400 yerine SqlException/500 dönerdi.
/// </summary>
public sealed class CreateAnnouncementTemplateCommandValidator
    : AbstractValidator<CreateAnnouncementTemplateCommand>
{
    /// <summary>EF: <c>HasMaxLength(120)</c>.</summary>
    public const int NameMaxLength = 120;

    /// <summary>EF: <c>HasMaxLength(500)</c>.</summary>
    public const int DescriptionMaxLength = 500;

    public CreateAnnouncementTemplateCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Şablon adı zorunludur.")
            .MaximumLength(NameMaxLength);

        // Açıklama BOŞ olabilir (yalnız başlık kalıbı olan şablon geçerlidir) ama NULL olamaz:
        // MaximumLength null'ı sessizce geçer ve kural hiç uygulanmamış olur.
        RuleFor(x => x.Description)
            .NotNull().WithMessage("Şablon metni zorunludur (boş olabilir).")
            .MaximumLength(DescriptionMaxLength);
    }
}
```

- [ ] **Step 4: Validator testlerinin geçtiğini doğrula**

```bash
dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~AnnouncementTemplateValidatorTests"
```

Beklenen: PASS (7 test).

- [ ] **Step 5: Failing entegrasyon testlerini yaz**

`AnnouncementTemplateEndpointTests.cs` içine ekle:

```csharp
    [Fact]
    public async Task Should_PersistTemplate_When_ManagerCreatesIt()
    {
        var handler = new CreateAnnouncementTemplateCommandHandler(_db, Tenant(_schoolId));

        var result = await handler.Handle(
            new CreateAnnouncementTemplateCommand("Kar Tatili", "Yarın okul tatildir.", Urgent: true),
            CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        var persisted = await _db.AnnouncementTemplates.AsNoTracking()
            .SingleAsync(t => t.SchoolId == _schoolId);
        persisted.Name.Should().Be("Kar Tatili");
        persisted.Description.Should().Be("Yarın okul tatildir.");
        persisted.Urgent.Should().BeTrue();
        persisted.UsageCount.Should().Be(0);
        persisted.LastUsedAt.Should().BeNull();
        result.Value!.Id.Should().Be(persisted.Id.ToString());
    }

    /// <summary>
    /// Benzersiz indeks <c>(SchoolId, Name)</c> üzerindedir. Handler bunu ÖNCEDEN kontrol
    /// etmezse SqlException → 500 döner; kullanıcı "bu ad zaten var" bilgisini alamaz.
    /// </summary>
    [Fact]
    public async Task Should_ReturnDuplicateError_When_NameAlreadyExistsInSameSchool()
    {
        _db.AnnouncementTemplates.Add(
            AnnouncementTemplate.Create(_schoolId, "Kar Tatili", "M", urgent: false));
        await _db.SaveChangesAsync();

        var handler = new CreateAnnouncementTemplateCommandHandler(_db, Tenant(_schoolId));
        var result = await handler.Handle(
            new CreateAnnouncementTemplateCommand("Kar Tatili", "Başka metin", Urgent: false),
            CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("Announcements.Template.NameDuplicate");
    }

    /// <summary>
    /// Benzersizlik OKUL BAZLIDIR. İki okul aynı şablon adını kullanabilmelidir — aksi hâlde
    /// ilk okulun "Kar Tatili"ni yaratması diğer 400 okulu engellerdi.
    /// </summary>
    [Fact]
    public async Task Should_Allow_When_SameNameExistsInAnotherSchool()
    {
        var otherSchoolId = Guid.NewGuid();
        _db.AnnouncementTemplates.Add(
            AnnouncementTemplate.Create(otherSchoolId, "Kar Tatili", "M", urgent: false));
        await _db.SaveChangesAsync();

        var handler = new CreateAnnouncementTemplateCommandHandler(_db, Tenant(_schoolId));
        var result = await handler.Handle(
            new CreateAnnouncementTemplateCommand("Kar Tatili", "M", Urgent: false),
            CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
    }

    /// <summary>
    /// Ad karşılaştırması TRIM SONRASI yapılmalıdır: domain <c>Name.Trim()</c> yazar, yani
    /// "  Kar Tatili  " veritabanına "Kar Tatili" olarak gider ve benzersiz indeksi ihlal
    /// eder. Handler ham dizeyi sorgularsa çakışmayı GÖREMEZ ve SqlException'a düşer.
    /// </summary>
    [Fact]
    public async Task Should_ReturnDuplicateError_When_NameDiffersOnlyByWhitespace()
    {
        _db.AnnouncementTemplates.Add(
            AnnouncementTemplate.Create(_schoolId, "Kar Tatili", "M", urgent: false));
        await _db.SaveChangesAsync();

        var handler = new CreateAnnouncementTemplateCommandHandler(_db, Tenant(_schoolId));
        var result = await handler.Handle(
            new CreateAnnouncementTemplateCommand("  Kar Tatili  ", "M", Urgent: false),
            CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("Announcements.Template.NameDuplicate");
    }
```

`using Oksis.Application.Modules.Announcements.Commands.CreateAnnouncementTemplate;` ekle.

- [ ] **Step 6: Handler'ı yaz**

`CreateAnnouncementTemplateCommandHandler.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Announcements.DTOs;
using Oksis.Domain.Modules.Announcements.Entities;
using Oksis.Domain.Modules.Announcements.Exceptions;
using Oksis.Shared;

namespace Oksis.Application.Modules.Announcements.Commands.CreateAnnouncementTemplate;

/// <summary>
/// Şablon oluşturur. Denetim izi YAZMAZ — <c>AnnouncementAuditEntry</c> bir DUYURUNUN
/// geçmişidir (<c>AnnouncementId</c> zorunlu FK'sı vardır); şablonun kendi izi yoktur ve
/// sahte bir duyuru kimliği uydurmak izi kirletirdi. Şablon değişikliğinin izlenmesi
/// gerekirse bu ayrı bir tablo işidir, bu ucun değil.
/// </summary>
public sealed class CreateAnnouncementTemplateCommandHandler(
    IApplicationDbContext db,
    ITenantContext tenant)
    : ICommandHandler<CreateAnnouncementTemplateCommand, AnnouncementTemplateDto>
{
    public async Task<Result<AnnouncementTemplateDto>> Handle(
        CreateAnnouncementTemplateCommand request, CancellationToken cancellationToken)
    {
        if (tenant.CurrentSchoolId is not { } schoolId)
        {
            return Result<AnnouncementTemplateDto>.Forbidden();
        }

        // Ad TRIM SONRASI karşılaştırılır: domain `Name.Trim()` yazar, yani benzersiz indeks
        // trim'lenmiş değeri görür. Ham dizeyle sorgulamak çakışmayı kaçırıp SqlException/500
        // üretirdi.
        var normalizedName = (request.Name ?? string.Empty).Trim();

        var exists = await db.AnnouncementTemplates.AsNoTracking()
            .AnyAsync(t => t.SchoolId == schoolId && t.Name == normalizedName, cancellationToken);

        if (exists)
        {
            return Result<AnnouncementTemplateDto>.Failure(new Error(
                "Announcements.Template.NameDuplicate",
                "Bu adda bir şablon zaten var."));
        }

        AnnouncementTemplate template;
        try
        {
            template = AnnouncementTemplate.Create(
                schoolId, request.Name, request.Description, request.Urgent);
        }
        catch (AnnouncementDomainException ex)
        {
            return Result<AnnouncementTemplateDto>.Failure(new Error(ex.Code, ex.Message));
        }

        db.AnnouncementTemplates.Add(template);
        await db.SaveChangesAsync(cancellationToken);

        return Result<AnnouncementTemplateDto>.Success(ToDto(template));
    }

    /// <summary>Entity → wire DTO. Görev 4 aynı eşlemeyi kullanır.</summary>
    internal static AnnouncementTemplateDto ToDto(AnnouncementTemplate t) => new()
    {
        Id = t.Id.ToString(),
        Name = t.Name,
        Description = t.Description,
        UsageCount = t.UsageCount,
        LastUsedAt = t.LastUsedAt?.ToString("O"),
        Urgent = t.Urgent,
    };
}
```

- [ ] **Step 7: `MapStatusCode`'a Duplicate kolunu ekle (failing test önce)**

`tests/Oksis.Api.UnitTests/Extensions/ResultExtensionsAnnouncementsTests.cs` içine ekle
(dosyadaki mevcut test kalıbını OKU ve ona uydur; aşağıdaki assertion'ın şekli oradan gelir):

```csharp
    /// <summary>
    /// Ad çakışması bir ÇAKIŞMADIR (409), bir gövde doğrulama hatası (400) değil. İstemci
    /// ikisini farklı ele alır: 400 formu kırmızıya boyar, 409 "bu ad kullanılıyor" der.
    /// Announcements kovası bugün varsayılan olarak 400'e düşer — bu kol onu ayırır.
    /// </summary>
    [Fact]
    public void Should_Map409_When_TemplateNameIsDuplicate()
    {
        var result = Result<object>.Failure(
            new Error("Announcements.Template.NameDuplicate", "Bu adda bir şablon zaten var."));

        var action = result.ToHttpResult(HttpContextStub());

        action.Should().BeOfType<ObjectResult>()
            .Which.StatusCode.Should().Be(StatusCodes.Status409Conflict);
    }
```

Testin KIRMIZI olduğunu doğrula (400 döner), sonra
`src/Oksis.Api/Extensions/ResultExtensions.cs` içindeki Announcements kovasına, `InvalidStatus`
kolundan SONRA ekle:

```csharp
            // Ad çakışması → 409. Şablon adları okul içinde benzersizdir; bu bir gövde
            // doğrulama hatası (400) değil, var olan bir kayıtla çakışmadır.
            if (code.Contains("Duplicate", StringComparison.Ordinal))
                return StatusCodes.Status409Conflict;
```

- [ ] **Step 8: İzin yüzeyi tablosuna satır ekle**

```csharp
        yield return [typeof(CreateAnnouncementTemplateCommand), "announcements.template.manage"];
```

- [ ] **Step 9: Testleri koş**

```bash
dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~AnnouncementTemplate"
dotnet test tests/Oksis.Api.UnitTests --filter "FullyQualifiedName~ResultExtensionsAnnouncements"
dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~AnnouncementTemplateEndpointTests"
```

Beklenen: hepsi PASS.

- [ ] **Step 10: Dört süiti koş, deltaları doğrula, commit**

```bash
dotnet build Oksis.slnx
dotnet test tests/Oksis.Domain.UnitTests          # 672/1 (beyan edilmiş)
dotnet test tests/Oksis.Application.UnitTests      # 1491 + 7 validator + 2 izin = 1500/0
dotnet test tests/Oksis.Api.UnitTests              # 207 + 1 = 208/0
dotnet test tests/Oksis.Infrastructure.IntegrationTests  # 730 + 4 = 734/0
```

```bash
git add src/Oksis.Application/Modules/Announcements/Commands/CreateAnnouncementTemplate/ \
        src/Oksis.Api/Extensions/ResultExtensions.cs \
        tests/
git commit -m "feat(api): duyuru sablonu olusturma ucu eklendi

Ad cakismasi trim sonrasi kontrol edilir (domain Name.Trim() yazar, benzersiz
indeks onu gorur) ve 409'a esler. Sablon denetim izi yazmaz: AnnouncementAuditEntry
bir duyurunun gecmisidir."
```

---

## Görev 4: `PUT /templates/{id}` — komut + validator + handler

**Files:**
- Create: `src/Oksis.Application/Modules/Announcements/Commands/UpdateAnnouncementTemplate/UpdateAnnouncementTemplateCommand.cs`
- Create: `.../UpdateAnnouncementTemplateCommandValidator.cs`
- Create: `.../UpdateAnnouncementTemplateCommandHandler.cs`
- Modify: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/AnnouncementTemplateEndpointTests.cs`
- Modify: `tests/Oksis.Application.UnitTests/Modules/Announcements/AnnouncementTemplateValidatorTests.cs`
- Modify: `tests/Oksis.Application.UnitTests/Modules/Announcements/AnnouncementPermissionSurfaceTests.cs`

**Interfaces:**
- Consumes: `AnnouncementTemplate.Update(name, description, urgent)` (Görev 1),
  `CreateAnnouncementTemplateCommandHandler.ToDto` (Görev 3).
- Produces: `UpdateAnnouncementTemplateCommand(Guid Id, string Name, string Description, bool Urgent)`.

**Kontrat gerçeği:** `PUT /announcements/templates/{id}` donmuş kontratta YOK. B fazı
gövdesi:

```ts
export interface UpdateAnnouncementTemplateBody {
  name: string
  description: string
  urgent: boolean
}
```

`id` ROTADAN gelir, gövdede yoktur — `AmendAnnouncementRequestBody` emsali
(komut kaydını doğrudan `[FromBody]` bağlamak generated OpenAPI'ye gövdede olmayan bir `id`
yazardı).

- [ ] **Step 1: Failing entegrasyon testlerini yaz**

`AnnouncementTemplateEndpointTests.cs` içine ekle:

```csharp
    [Fact]
    public async Task Should_UpdateFields_When_ManagerUpdatesTemplate()
    {
        var template = AnnouncementTemplate.Create(_schoolId, "Eski Ad", "Eski metin", urgent: false);
        _db.AnnouncementTemplates.Add(template);
        await _db.SaveChangesAsync();

        var handler = new UpdateAnnouncementTemplateCommandHandler(_db, Tenant(_schoolId));
        var result = await handler.Handle(
            new UpdateAnnouncementTemplateCommand(template.Id, "Yeni Ad", "Yeni metin", Urgent: true),
            CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        var persisted = await _db.AnnouncementTemplates.AsNoTracking().SingleAsync(t => t.Id == template.Id);
        persisted.Name.Should().Be("Yeni Ad");
        persisted.Description.Should().Be("Yeni metin");
        persisted.Urgent.Should().BeTrue();
    }

    /// <summary>
    /// Başka okulun şablonu 404 döner, 403 DEĞİL — "yetkin yok" demek o kimliğin başka bir
    /// okulda var olduğunu sızdırır (spec §4.1.4 ilkesi, <c>FileAccessGuard</c> emsali).
    /// </summary>
    [Fact]
    public async Task Should_ReturnNotFound_When_TemplateBelongsToAnotherSchool()
    {
        var otherSchoolId = Guid.NewGuid();
        var template = AnnouncementTemplate.Create(otherSchoolId, "Başka", "M", urgent: false);
        _db.AnnouncementTemplates.Add(template);
        await _db.SaveChangesAsync();

        var handler = new UpdateAnnouncementTemplateCommandHandler(_db, Tenant(_schoolId));
        var result = await handler.Handle(
            new UpdateAnnouncementTemplateCommand(template.Id, "Yeni", "M", Urgent: false),
            CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("Error.NotFound");
    }

    [Fact]
    public async Task Should_ReturnDuplicateError_When_RenamedOntoAnExistingName()
    {
        var a = AnnouncementTemplate.Create(_schoolId, "Kar Tatili", "M", urgent: false);
        var b = AnnouncementTemplate.Create(_schoolId, "Veli Toplantısı", "M", urgent: false);
        _db.AnnouncementTemplates.AddRange(a, b);
        await _db.SaveChangesAsync();

        var handler = new UpdateAnnouncementTemplateCommandHandler(_db, Tenant(_schoolId));
        var result = await handler.Handle(
            new UpdateAnnouncementTemplateCommand(b.Id, "Kar Tatili", "M", Urgent: false),
            CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("Announcements.Template.NameDuplicate");
    }

    /// <summary>
    /// Şablonun KENDİ adıyla güncellenmesi çakışma DEĞİLDİR — yalnız <c>urgent</c> bayrağını
    /// veya metni değiştiren bir düzenleme, adı hiç değiştirmediği hâlde reddedilirse uç
    /// kullanılamaz hâle gelir. Duplicate sorgusu bu yüzden <c>t.Id != request.Id</c> ile
    /// kendini dışlamak ZORUNDADIR.
    /// </summary>
    [Fact]
    public async Task Should_Allow_When_TemplateIsSavedWithItsOwnName()
    {
        var template = AnnouncementTemplate.Create(_schoolId, "Kar Tatili", "M", urgent: false);
        _db.AnnouncementTemplates.Add(template);
        await _db.SaveChangesAsync();

        var handler = new UpdateAnnouncementTemplateCommandHandler(_db, Tenant(_schoolId));
        var result = await handler.Handle(
            new UpdateAnnouncementTemplateCommand(template.Id, "Kar Tatili", "Yeni metin", Urgent: true),
            CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value!.Urgent.Should().BeTrue();
    }

    /// <summary>
    /// Kullanım sayaçları düzenlemeden ETKİLENMEZ (domain kuralı, Görev 1). Burada uçtan uca
    /// da doğrulanır: DTO'nun sayacı sıfırlaması, envanterdeki sıralamayı sessizce bozardı.
    /// </summary>
    [Fact]
    public async Task Should_PreserveUsageCounters_When_TemplateIsUpdatedThroughTheEndpoint()
    {
        var usedAt = new DateTimeOffset(2026, 2, 1, 10, 0, 0, TimeSpan.Zero);
        var template = AnnouncementTemplate.Create(_schoolId, "Ad", "M", urgent: false);
        template.RegisterUse(usedAt);
        _db.AnnouncementTemplates.Add(template);
        await _db.SaveChangesAsync();

        var handler = new UpdateAnnouncementTemplateCommandHandler(_db, Tenant(_schoolId));
        var result = await handler.Handle(
            new UpdateAnnouncementTemplateCommand(template.Id, "Yeni Ad", "M", Urgent: false),
            CancellationToken.None);

        result.Value!.UsageCount.Should().Be(1);
        result.Value!.LastUsedAt.Should().Be(usedAt.ToString("O"));
    }
```

`using Oksis.Application.Modules.Announcements.Commands.UpdateAnnouncementTemplate;` ekle.

- [ ] **Step 2: Testlerin DERLENMEDİĞİNİ doğrula**

```bash
dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~AnnouncementTemplateEndpointTests"
```

Beklenen: derleme hatası — `UpdateAnnouncementTemplateCommand` bulunamıyor.

- [ ] **Step 3: Komutu ve validator'ı yaz**

`UpdateAnnouncementTemplateCommand.cs`:

```csharp
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Announcements.DTOs;

namespace Oksis.Application.Modules.Announcements.Commands.UpdateAnnouncementTemplate;

/// <summary>
/// Hazır duyuru metnini düzenler. Yalnız yönetim (<c>announcements.template.manage</c>).
/// <c>Id</c> ROTADAN gelir; controller gövdeyi ayrı bir kayıtla bağlar.
/// </summary>
[Tenancy(TenancyMode.Required)]
[RequirePermission("announcements.template.manage")]
public sealed record UpdateAnnouncementTemplateCommand(
    Guid Id,
    string Name,
    string Description,
    bool Urgent) : ICommand<AnnouncementTemplateDto>;
```

`UpdateAnnouncementTemplateCommandValidator.cs`:

```csharp
using FluentValidation;
using Oksis.Application.Modules.Announcements.Commands.CreateAnnouncementTemplate;

namespace Oksis.Application.Modules.Announcements.Commands.UpdateAnnouncementTemplate;

/// <summary>
/// Oluşturma ile AYNI uzunluk sınırları — sabitler
/// <see cref="CreateAnnouncementTemplateCommandValidator"/>'dan ALINIR, yeniden yazılmaz.
/// İki validator ayrı sayı tutarsa düzenleme, oluşturmanın kabul etmeyeceği bir adı kabul
/// ederdi (Görev 1'in <c>NormalizeName</c> gerekçesinin validator karşılığı).
/// </summary>
public sealed class UpdateAnnouncementTemplateCommandValidator
    : AbstractValidator<UpdateAnnouncementTemplateCommand>
{
    public UpdateAnnouncementTemplateCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Şablon adı zorunludur.")
            .MaximumLength(CreateAnnouncementTemplateCommandValidator.NameMaxLength);

        RuleFor(x => x.Description)
            .NotNull().WithMessage("Şablon metni zorunludur (boş olabilir).")
            .MaximumLength(CreateAnnouncementTemplateCommandValidator.DescriptionMaxLength);
    }
}
```

- [ ] **Step 4: Handler'ı yaz**

`UpdateAnnouncementTemplateCommandHandler.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Announcements.Commands.CreateAnnouncementTemplate;
using Oksis.Application.Modules.Announcements.DTOs;
using Oksis.Domain.Modules.Announcements.Exceptions;
using Oksis.Shared;

namespace Oksis.Application.Modules.Announcements.Commands.UpdateAnnouncementTemplate;

/// <summary>
/// Şablon metnini günceller. Kullanım sayaçları KORUNUR (domain kuralı) — sayaç şablonun
/// kullanım değerini ölçer, metninin yaşını değil.
/// </summary>
public sealed class UpdateAnnouncementTemplateCommandHandler(
    IApplicationDbContext db,
    ITenantContext tenant)
    : ICommandHandler<UpdateAnnouncementTemplateCommand, AnnouncementTemplateDto>
{
    public async Task<Result<AnnouncementTemplateDto>> Handle(
        UpdateAnnouncementTemplateCommand request, CancellationToken cancellationToken)
    {
        if (tenant.CurrentSchoolId is not { } schoolId)
        {
            return Result<AnnouncementTemplateDto>.Forbidden();
        }

        var template = await db.AnnouncementTemplates
            .SingleOrDefaultAsync(t => t.Id == request.Id && t.SchoolId == schoolId, cancellationToken);

        // Başka okulun şablonu da buraya düşer: 404, 403 DEĞİL — "yetkin yok" demek o
        // kimliğin başka bir okulda var olduğunu sızdırırdı.
        if (template is null)
        {
            return Result<AnnouncementTemplateDto>.NotFound();
        }

        var normalizedName = (request.Name ?? string.Empty).Trim();

        // KENDİNİ DIŞLA: yalnız `urgent` bayrağını değiştiren bir düzenleme, adı hiç
        // değiştirmediği hâlde kendi satırına çakışırdı ve uç kullanılamaz hâle gelirdi.
        var duplicate = await db.AnnouncementTemplates.AsNoTracking()
            .AnyAsync(
                t => t.SchoolId == schoolId && t.Id != request.Id && t.Name == normalizedName,
                cancellationToken);

        if (duplicate)
        {
            return Result<AnnouncementTemplateDto>.Failure(new Error(
                "Announcements.Template.NameDuplicate",
                "Bu adda bir şablon zaten var."));
        }

        try
        {
            template.Update(request.Name, request.Description, request.Urgent);
        }
        catch (AnnouncementDomainException ex)
        {
            return Result<AnnouncementTemplateDto>.Failure(new Error(ex.Code, ex.Message));
        }

        await db.SaveChangesAsync(cancellationToken);

        return Result<AnnouncementTemplateDto>.Success(
            CreateAnnouncementTemplateCommandHandler.ToDto(template));
    }
}
```

- [ ] **Step 5: Validator sabitlerinin paylaşıldığını sınayan testi ekle**

`AnnouncementTemplateValidatorTests.cs` sonuna:

```csharp
    /// <summary>
    /// İki validator AYNI sınırları uygulamalıdır. Ayrışırlarsa düzenleme, oluşturmanın
    /// kabul etmeyeceği bir adı kabul ederdi — ve o ad kolona sığmayıp 500 üretirdi.
    /// Bu test sabitlerin paylaşıldığını DAVRANIŞTAN doğrular (sabitleri karşılaştırmak
    /// yalnız aynı sayıyı iki kez okumak olurdu).
    /// </summary>
    [Fact]
    public void Should_ApplySameNameLimit_When_UpdateValidatorIsUsed()
    {
        var update = new UpdateAnnouncementTemplateCommandValidator();

        update.Validate(new UpdateAnnouncementTemplateCommand(
            Guid.NewGuid(), new string('a', 120), "M", false)).IsValid.Should().BeTrue();

        update.Validate(new UpdateAnnouncementTemplateCommand(
            Guid.NewGuid(), new string('a', 121), "M", false)).IsValid.Should().BeFalse();
    }

    [Fact]
    public void Should_Reject_When_UpdateIdIsEmpty()
    {
        var update = new UpdateAnnouncementTemplateCommandValidator();

        var result = update.Validate(new UpdateAnnouncementTemplateCommand(
            Guid.Empty, "Ad", "M", false));

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Id");
    }
```

`using Oksis.Application.Modules.Announcements.Commands.UpdateAnnouncementTemplate;` ekle.

- [ ] **Step 6: İzin yüzeyi tablosuna satır ekle**

```csharp
        yield return [typeof(UpdateAnnouncementTemplateCommand), "announcements.template.manage"];
```

- [ ] **Step 7: Testleri koş**

```bash
dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~AnnouncementTemplate"
dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~AnnouncementTemplateEndpointTests"
```

Beklenen: PASS.

- [ ] **Step 8: Dört süiti koş, deltaları doğrula, commit**

Beklenen: Domain **672/1** (beyan edilmiş); Application 1500 + 2 validator + 2 izin = **1504/0**;
Api **208/0**; Integration 734 + 5 = **739/0**.

```bash
git add src/Oksis.Application/Modules/Announcements/Commands/UpdateAnnouncementTemplate/ tests/
git commit -m "feat(api): duyuru sablonu duzenleme ucu eklendi

Duplicate sorgusu kendini dislar: yalniz urgent bayragini degistiren bir duzenleme
kendi satirina cakisip ucu kullanilamaz hale getirirdi. Uzunluk sabitleri
olusturma validator'undan alinir, ikinci kez yazilmaz."
```

---

## Görev 5: `DELETE /templates/{id}` — komut + handler (Görev 1'in kırmızısını kapatır)

**Files:**
- Create: `src/Oksis.Application/Modules/Announcements/Commands/DeleteAnnouncementTemplate/DeleteAnnouncementTemplateCommand.cs`
- Create: `.../DeleteAnnouncementTemplateCommandHandler.cs`
- Modify: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/AnnouncementTemplateEndpointTests.cs`
- Modify: `tests/Oksis.Application.UnitTests/Modules/Announcements/AnnouncementPermissionSurfaceTests.cs`

**Interfaces:**
- Consumes: Görev 1'in `Should_AllowTemplateRemoval_OnlyFrom_TheDeleteHandler` testi —
  bu görev onu YEŞİLE çevirir.
- Produces: `DeleteAnnouncementTemplateCommand(Guid Id)` → `ICommand` (değer döndürmez;
  controller `NoContent` verir).

**Bu görevin çıkış kriteri:** Görev 1'de beyan edilen kırmızı KAPANIR. Domain süiti
**673/0** olmadan bu görev bitmiş sayılmaz.

**Dosya adı KRİTİKTİR:** `DeleteAnnouncementTemplateCommandHandler.cs`. Görev 1'in testi bu
tam adı bekler (`TemplateDeleteHandlerFile` sabiti). Farklı bir ada koyarsan test kırmızı
kalır — bu bir tesadüf değil, tasarım: silme yolunun adı bekçiye YAZILIDIR.

- [ ] **Step 1: Failing entegrasyon testlerini yaz**

`AnnouncementTemplateEndpointTests.cs` içine ekle:

```csharp
    [Fact]
    public async Task Should_RemoveRow_When_ManagerDeletesTemplate()
    {
        var template = AnnouncementTemplate.Create(_schoolId, "Silinecek", "M", urgent: false);
        _db.AnnouncementTemplates.Add(template);
        await _db.SaveChangesAsync();

        var handler = new DeleteAnnouncementTemplateCommandHandler(_db, Tenant(_schoolId));
        var result = await handler.Handle(
            new DeleteAnnouncementTemplateCommand(template.Id), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        (await _db.AnnouncementTemplates.AsNoTracking().AnyAsync(t => t.Id == template.Id))
            .Should().BeFalse("şablon GERÇEKTEN silinir — soft-delete DEĞİL");
    }

    [Fact]
    public async Task Should_ReturnNotFound_When_DeletedTemplateBelongsToAnotherSchool()
    {
        var otherSchoolId = Guid.NewGuid();
        var template = AnnouncementTemplate.Create(otherSchoolId, "Başka", "M", urgent: false);
        _db.AnnouncementTemplates.Add(template);
        await _db.SaveChangesAsync();

        var handler = new DeleteAnnouncementTemplateCommandHandler(_db, Tenant(_schoolId));
        var result = await handler.Handle(
            new DeleteAnnouncementTemplateCommand(template.Id), CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("Error.NotFound");
        (await _db.AnnouncementTemplates.AsNoTracking().AnyAsync(t => t.Id == template.Id))
            .Should().BeTrue("başka okulun şablonu SİLİNMEMİŞ olmalıdır");
    }

    [Fact]
    public async Task Should_ReturnNotFound_When_DeletedTemplateDoesNotExist()
    {
        var handler = new DeleteAnnouncementTemplateCommandHandler(_db, Tenant(_schoolId));

        var result = await handler.Handle(
            new DeleteAnnouncementTemplateCommand(Guid.NewGuid()), CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("Error.NotFound");
    }

    /// <summary>
    /// INV-1'in kapsamı: şablonun silinmesi DUYURULARA dokunmaz. Şablondan üretilmiş bir
    /// duyuru, şablon silindikten sonra da yayında kalır — aralarında FK yoktur ve olmamalıdır
    /// (şablon bir metin kalıbıdır, duyurunun kaynağı değil).
    /// </summary>
    [Fact]
    public async Task Should_LeaveAnnouncementsUntouched_When_TemplateIsDeleted()
    {
        var template = AnnouncementTemplate.Create(_schoolId, "Silinecek", "M", urgent: false);
        _db.AnnouncementTemplates.Add(template);
        await _db.SaveChangesAsync();

        var announcementCountBefore = await _db.Announcements.AsNoTracking()
            .CountAsync(a => a.SchoolId == _schoolId);

        var handler = new DeleteAnnouncementTemplateCommandHandler(_db, Tenant(_schoolId));
        await handler.Handle(new DeleteAnnouncementTemplateCommand(template.Id), CancellationToken.None);

        (await _db.Announcements.AsNoTracking().CountAsync(a => a.SchoolId == _schoolId))
            .Should().Be(announcementCountBefore);
    }
```

`using Oksis.Application.Modules.Announcements.Commands.DeleteAnnouncementTemplate;` ekle.

- [ ] **Step 2: Testlerin DERLENMEDİĞİNİ doğrula**

```bash
dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~AnnouncementTemplateEndpointTests"
```

Beklenen: derleme hatası.

- [ ] **Step 3: Komutu yaz**

`DeleteAnnouncementTemplateCommand.cs`:

```csharp
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Cqrs;

namespace Oksis.Application.Modules.Announcements.Commands.DeleteAnnouncementTemplate;

/// <summary>
/// Hazır duyuru metnini SİLER.
///
/// <para><b>INV-1 ile çelişmez.</b> INV-1 duyurunun silinmezliğidir: yayınlanmış bir duyuru
/// alıcıların gördüğü kurumsal bir kayıttır ve yalnız <c>:withdraw</c> ile geri çekilir.
/// Şablon ise AYRI bir aggregate'tir — hiç yayınlanmamış bir metin kalıbıdır ve silinmesi
/// hiçbir alıcının gördüğü hiçbir kaydı yok etmez. Bu ayrım
/// <c>AnnouncementHardDeleteGuardTests</c>'te İKİ testle kodlanır: duyuru aggregate'inin
/// dört DbSet'inde SIFIR <c>Remove</c> çağrısı, şablonda TAM BİR çağrı — ve o tek çağrının
/// hangi dosyada olduğu da sabitlenmiştir.</para>
/// </summary>
[Tenancy(TenancyMode.Required)]
[RequirePermission("announcements.template.manage")]
public sealed record DeleteAnnouncementTemplateCommand(Guid Id) : ICommand;
```

> **Implementer'a not:** Bu depoda değer döndürmeyen komut arayüzünün gerçek adını
> DOĞRULA — `Oksis.Application/Common/Cqrs/` altındaki tanımları oku. `ICommand` /
> `ICommand<Unit>` / `ICommandHandler<TCommand>` şekillerinden hangisinin var olduğunu
> gördüğün gibi kullan ve `ToHttpResult(this Result result, ...)` overload'ının
> `NoContentResult` döndürdüğünü teyit et (`ResultExtensions.cs:23-35` bunu yapıyor).
> Değersiz komut arayüzü yoksa `ICommand<Unit>` KULLANMA — bunun yerine ne bulduğunu
> rapora yaz ve DUR.

- [ ] **Step 4: Handler'ı yaz**

`DeleteAnnouncementTemplateCommandHandler.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Shared;

namespace Oksis.Application.Modules.Announcements.Commands.DeleteAnnouncementTemplate;

/// <summary>
/// Şablonu kalıcı olarak siler.
///
/// <para><b>Bu dosya, tüm <c>src/</c> ağacında <c>db.AnnouncementTemplates.Remove(...)</c>
/// çağırmasına izin verilen TEK dosyadır</b> —
/// <c>AnnouncementHardDeleteGuardTests.Should_AllowTemplateRemoval_OnlyFrom_TheDeleteHandler</c>
/// bunu dosya ADIYLA sabitler. İkinci bir silme yolu eklenirse o test kırılır. Dosyayı
/// yeniden adlandırırsan testin sabitini de güncelle ve gerekçesini yaz.</para>
///
/// <para>Soft-delete YOKTUR: <c>AnnouncementTemplate</c> bir <c>PermanentTenantEntity</c>'dir,
/// <c>ISoftDeletable</c> uygulamaz, dolayısıyla <c>SoftDeleteInterceptor</c> bu tipi hiç
/// görmez ve <c>Remove</c> gerçek bir SQL DELETE üretir. Bu BİLİNÇLİDİR.</para>
/// </summary>
public sealed class DeleteAnnouncementTemplateCommandHandler(
    IApplicationDbContext db,
    ITenantContext tenant)
    : ICommandHandler<DeleteAnnouncementTemplateCommand>
{
    public async Task<Result> Handle(
        DeleteAnnouncementTemplateCommand request, CancellationToken cancellationToken)
    {
        if (tenant.CurrentSchoolId is not { } schoolId)
        {
            return Result.Forbidden();
        }

        var template = await db.AnnouncementTemplates
            .SingleOrDefaultAsync(t => t.Id == request.Id && t.SchoolId == schoolId, cancellationToken);

        if (template is null)
        {
            return Result.NotFound();
        }

        db.AnnouncementTemplates.Remove(template);
        await db.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
```

> **Implementer'a not:** `Result` (generic olmayan) tipinin `Forbidden()` / `NotFound()` /
> `Success()` fabrikalarının GERÇEKTEN var olduğunu `Oksis.Shared/Result.cs`'den doğrula.
> Yoksa hangi fabrikaların var olduğunu kullan ve rapora yaz. **Uydurma.**

- [ ] **Step 5: İzin yüzeyi tablosuna satır ekle**

```csharp
        yield return [typeof(DeleteAnnouncementTemplateCommand), "announcements.template.manage"];
```

- [ ] **Step 6: Görev 1'in kırmızısının KAPANDIĞINI doğrula**

```bash
dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~AnnouncementHardDeleteGuardTests"
```

Beklenen: **İKİSİ DE PASS.** `Should_AllowTemplateRemoval_OnlyFrom_TheDeleteHandler` artık
tam bir çağrı yeri buluyor ve dosya adı eşleşiyor.

- [ ] **Step 7: Zorunlu mutasyon denetimi — bekçinin gerçekten bekçilik ettiğini kanıtla**

`GetAnnouncementTemplatesQueryHandler.cs`'ye GEÇİCİ olarak ikinci bir silme çağrısı ekle
(ör. handler'ın başına `db.AnnouncementTemplates.Remove(null!);` — derlensin diye
`#pragma` KULLANMA, gerekirse gerçek bir entity değişkeni üret). Domain testini koş:

Beklenen: `Should_AllowTemplateRemoval_OnlyFrom_TheDeleteHandler` **FAIL**
("Expected callSites to contain a single item, but found 2").

**Mutasyonu GERİ AL**, testi tekrar koş (PASS), ve raporunda iki gözlemi de yaz.
Bu, D-1'in ikinci yarısının gerçekten koruduğunu kanıtlar — Görev 1'de test yalnız
"boş liste" hatasıyla kırmızıydı, "ikinci çağrı" hâli hiç görülmemişti.

- [ ] **Step 8: Dört süiti koş, deltaları doğrula**

```bash
dotnet build Oksis.slnx
dotnet test tests/Oksis.Domain.UnitTests                 # 673/0 — KIRMIZI KAPANDI
dotnet test tests/Oksis.Application.UnitTests             # 1504 + 2 izin = 1506/0
dotnet test tests/Oksis.Api.UnitTests                     # 208/0
dotnet test tests/Oksis.Infrastructure.IntegrationTests   # 739 + 4 = 743/0
```

**Domain 673/0 olmadan commit ETME.**

- [ ] **Step 9: Commit**

```bash
git add src/Oksis.Application/Modules/Announcements/Commands/DeleteAnnouncementTemplate/ tests/
git commit -m "feat(api): duyuru sablonu silme ucu eklendi

Gorev 1'de bilerek kirmizi birakilan INV-1 karsi testi kapandi: sablon silmeye
tam bir cagri yeri var ve o da bu handler. Duyuru aggregate'inin dort DbSet'i
icin sifir-cagri kurali degismedi."
```

---

## Görev 6: `AnnouncementTemplatesController` + API bekçisi

**Files:**
- Create: `src/Oksis.Api/Controllers/V1/AnnouncementTemplatesController.cs`
- Create: `tests/Oksis.Api.UnitTests/Controllers/V1/AnnouncementTemplatesControllerTests.cs`

**Interfaces:**
- Consumes: Görev 2–5'in dört isteği.
- Produces: `api/v1/announcements/templates` rotası altında dört uç. Görev 9
  `AnnouncementsController`'ın sayısını 15→17 yaparken bu controller'a DOKUNMAZ.

**Bu görev D-1'in API yarısıdır.** `AnnouncementsController`'daki
`NotContain(attr => attr is HttpDeleteAttribute)` assertion'ı **DEĞİŞMEZ ve GEVŞETİLMEZ**.
Şablon uçları AYRI bir controller'a gider; böylece "duyuru silinmez" bekçisi tam gücüyle
kalır ve "şablon silinir" ayrı bir yerde, kendi bekçisiyle ifade edilir.

**Rota çakışması yoktur:** `AnnouncementsController`'ın `[HttpGet("{id:guid}")]` kısıtı
GUID ister; `"templates"` bir GUID değildir, dolayısıyla `/api/v1/announcements/templates`
yalnız yeni controller'a düşer.

- [ ] **Step 1: Failing controller testini yaz**

`tests/Oksis.Api.UnitTests/Controllers/V1/AnnouncementTemplatesControllerTests.cs`:

```csharp
using System.Reflection;
using FluentAssertions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Routing;
using Oksis.Api.Controllers.V1;
using Xunit;

namespace Oksis.Api.UnitTests.Controllers.V1;

/// <summary>
/// A3 D-1'in API yüzü. <see cref="AnnouncementsControllerTests"/> "duyuru controller'ında
/// HİÇBİR uç <c>[HttpDelete]</c> DEĞİL" der ve o assertion DEĞİŞMEDEN kalır. Şablon
/// silinebilir olduğu için şablon uçları AYRI bir controller'dadır — bu ayrım, INV-1
/// bekçisini gevşetmek yerine kapsamını AÇIKÇA ifade eder.
///
/// <para>Bu sınıf simetrik bekçidir: burada <c>[HttpDelete]</c> TAM OLARAK BİR TANEDİR.
/// İkincisi eklenirse (ör. "tüm şablonları temizle" ucu) test kırılır.</para>
/// </summary>
public sealed class AnnouncementTemplatesControllerTests
{
    private static readonly Type _controllerType = typeof(AnnouncementTemplatesController);

    [Fact]
    public void Controller_ShouldHave_ApiControllerAttribute()
    {
        _controllerType.GetCustomAttribute<ApiControllerAttribute>().Should().NotBeNull();
    }

    [Fact]
    public void Controller_ShouldHave_AuthorizeAttribute_AtClassLevel()
    {
        _controllerType.GetCustomAttribute<AuthorizeAttribute>().Should().NotBeNull(
            "Authorization header yoksa 401 dönmesi sınıf düzeyinde [Authorize] gerektirir");
    }

    [Fact]
    public void Controller_ShouldHave_CorrectBaseRoute()
    {
        var route = _controllerType.GetCustomAttribute<RouteAttribute>();
        route.Should().NotBeNull();
        route!.Template.Should().Be("api/v1/announcements/templates");
    }

    public static IEnumerable<object[]> ExpectedEndpoints()
    {
        yield return ["ListAsync", "GET", ""];
        yield return ["CreateAsync", "POST", ""];
        yield return ["UpdateAsync", "PUT", "{id:guid}"];
        yield return ["DeleteAsync", "DELETE", "{id:guid}"];
    }

    [Theory]
    [MemberData(nameof(ExpectedEndpoints))]
    public void Controller_ShouldExpose_AllExpectedEndpoints(
        string actionName, string httpMethod, string template)
    {
        var method = _controllerType.GetMethod(actionName, BindingFlags.Public | BindingFlags.Instance);
        method.Should().NotBeNull($"action {actionName} must exist");

        var httpAttr = method!.GetCustomAttributes().OfType<HttpMethodAttribute>().FirstOrDefault();

        httpAttr.Should().NotBeNull($"{actionName} must have an Http* attribute");
        httpAttr!.HttpMethods.Should().Contain(httpMethod);
        (httpAttr.Template ?? string.Empty).Should().Be(template);
    }

    /// <summary>
    /// Yüzey sayısı sabittir ve silme TEK tanedir. "Toplu temizlik" gibi ikinci bir silme ucu
    /// eklenirse bu test kırılır — şablon silinebilir olabilir, ama denetlenmemiş bir toplu
    /// silme kapısı açılamaz.
    /// </summary>
    [Fact]
    public void Controller_ShouldExpose_ExactlyFourEndpoints_With_ExactlyOneHttpDelete()
    {
        var httpMethods = _controllerType
            .GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly)
            .Where(m => m.GetCustomAttributes().OfType<HttpMethodAttribute>().Any())
            .ToList();

        httpMethods.Should().HaveCount(4);

        httpMethods.SelectMany(m => m.GetCustomAttributes().OfType<HttpMethodAttribute>())
            .Count(attr => attr is HttpDeleteAttribute)
            .Should().Be(1,
                "şablon silinebilir — ama tek bir uçtan, tek bir kimlikle; toplu silme kapısı yok");
    }

    /// <summary>
    /// Duyuru controller'ının INV-1 bekçisi bu controller'dan ETKİLENMEZ. Bu testi burada
    /// tutmak, iki bekçinin BİRLİKTE okunmasını sağlar: birinin gevşetilerek diğerinin
    /// "zaten kapsıyor" sanılması A3'ün en olası hatasıydı.
    /// </summary>
    [Fact]
    public void AnnouncementsController_ShouldStillHave_NoHttpDelete()
    {
        typeof(AnnouncementsController)
            .GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly)
            .SelectMany(m => m.GetCustomAttributes().OfType<HttpMethodAttribute>())
            .Should().NotContain(attr => attr is HttpDeleteAttribute,
                "INV-1: duyuru SİLİNMEZ — şablonun silinebilir olması bunu değiştirmez");
    }
}
```

- [ ] **Step 2: Testin DERLENMEDİĞİNİ doğrula**

```bash
dotnet test tests/Oksis.Api.UnitTests --filter "FullyQualifiedName~AnnouncementTemplatesControllerTests"
```

Beklenen: derleme hatası — `AnnouncementTemplatesController` bulunamıyor.

- [ ] **Step 3: Controller'ı yaz**

`src/Oksis.Api/Controllers/V1/AnnouncementTemplatesController.cs`:

```csharp
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Oksis.Api.Contracts;
using Oksis.Api.Extensions;
using Oksis.Application.Modules.Announcements.Commands.CreateAnnouncementTemplate;
using Oksis.Application.Modules.Announcements.Commands.DeleteAnnouncementTemplate;
using Oksis.Application.Modules.Announcements.Commands.UpdateAnnouncementTemplate;
using Oksis.Application.Modules.Announcements.DTOs;
using Oksis.Application.Modules.Announcements.Queries.GetAnnouncementTemplates;

namespace Oksis.Api.Controllers.V1;

/// <summary>
/// Duyuru şablonları — hazır duyuru metinleri.
///
/// <para><b>Neden AYRI controller (A3 D-1):</b> şablon SİLİNEBİLİR, duyuru silinemez (INV-1).
/// <see cref="AnnouncementsController"/>'ın "hiçbir uç <c>[HttpDelete]</c> değil" bekçisi
/// INV-1'in API katmanındaki tek otomatik kanıtıdır; şablon silme ucunu oraya koymak o
/// bekçiyi gevşetmeyi gerektirirdi. Ayrı controller, ayrımı GEVŞETMEDEN ifade eder:
/// duyuru yüzeyinde sıfır DELETE, şablon yüzeyinde tam bir DELETE.</para>
///
/// <para>Rota <c>api/v1/announcements/templates</c>'tir ve
/// <see cref="AnnouncementsController"/>'ın <c>{id:guid}</c> kısıtıyla çakışmaz —
/// "templates" bir GUID değildir.</para>
/// </summary>
[ApiController]
[Route("api/v1/announcements/templates")]
[Authorize]
[Produces("application/json")]
public sealed class AnnouncementTemplatesController(ISender sender) : ControllerBase
{
    /// <summary>Okulun şablon envanteri. Okuma <c>announcements.view</c> ile açıktır —
    /// şablonu KULLANAN (sekreter, öğretmen) onu yönetenden farklıdır.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<AnnouncementTemplateDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ListAsync(CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetAnnouncementTemplatesQuery(), cancellationToken);
        return result.ToHttpResult(HttpContext);
    }

    /// <summary>Yeni şablon — yalnız yönetim (<c>announcements.template.manage</c>).</summary>
    [HttpPost]
    // ToHttpResult başarılı Result<T> için 200 döner (201 DEĞİL) — AnnouncementsController.CreateAsync
    // ile aynı gerekçe: generated OpenAPI kontrat-senkron frontend'i besler, ilan gerçeği söylemelidir.
    [ProducesResponseType(typeof(ApiResponse<AnnouncementTemplateDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateAsync(
        [FromBody] CreateAnnouncementTemplateCommand command, CancellationToken cancellationToken)
    {
        var result = await sender.Send(command, cancellationToken);
        return result.ToHttpResult(HttpContext);
    }

    /// <summary>Şablonu düzenler. <c>id</c> ROTADAN gelir, gövdede YOKTUR.</summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<AnnouncementTemplateDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> UpdateAsync(
        Guid id, [FromBody] UpdateAnnouncementTemplateRequestBody body, CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new UpdateAnnouncementTemplateCommand(id, body.Name, body.Description, body.Urgent),
            cancellationToken);
        return result.ToHttpResult(HttpContext);
    }

    /// <summary>
    /// Şablonu SİLER. <b>Bu, duyuru modülündeki TEK <c>[HttpDelete]</c>'tir</b> ve
    /// <see cref="AnnouncementTemplatesControllerTests"/> sayısını bire sabitler.
    /// Duyurunun kendisi için DELETE ucu YOKTUR ve yazılmayacaktır (INV-1).
    /// </summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteAsync(Guid id, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new DeleteAnnouncementTemplateCommand(id), cancellationToken);
        return result.ToHttpResult(HttpContext);
    }
}

/// <summary>
/// <c>PUT /announcements/templates/{id}</c> gövdesi. <c>id</c> rotadan gelir, gövdede YOKTUR
/// — komut kaydını doğrudan <c>[FromBody]</c> ile bağlamak generated OpenAPI'ye gövdede
/// olmayan bir <c>id</c> alanı yazardı (<c>AmendAnnouncementRequestBody</c> emsali).
/// </summary>
public sealed record UpdateAnnouncementTemplateRequestBody(string Name, string Description, bool Urgent);
```

- [ ] **Step 4: Testleri koş**

```bash
dotnet test tests/Oksis.Api.UnitTests --filter "FullyQualifiedName~AnnouncementTemplatesControllerTests"
```

Beklenen: PASS (8 test: 3 attribute + 4 Theory + 2 sayım/DELETE... implementer gerçek sayıyı
raporlasın).

- [ ] **Step 5: Uygulamanın gerçekten ayağa kalktığını ve rotaların çakışmadığını doğrula**

```bash
dotnet run --project src/Oksis.Api &
sleep 20
curl -s http://localhost:5112/openapi/v1.json | python3 -c "
import json,sys
d=json.load(sys.stdin)
for p in sorted(k for k in d['paths'] if 'announcement' in k.lower()):
    print(p, sorted(d['paths'][p].keys()))
"
kill %1
```

Beklenen: `/api/v1/announcements/templates` yolunda `get` + `post`,
`/api/v1/announcements/templates/{id}` yolunda `put` + `delete`. Rota çakışması hatası YOK.

> **Implementer'a not:** Swagger `/openapi/v1.json` adresinde ve port **5112**'dir (A2
> doğrulaması). `dotnet run`'ı ÖNPLANDA başlatıp ayrı bir kabuk kullanamıyorsan
> `--urls` ile sabitle ve süreci mutlaka öldür.

- [ ] **Step 6: Dört süiti koş, deltaları doğrula, commit**

Beklenen: Domain **673/0**; Application **1506/0**; Api 208 + ~8 = implementer sayar;
Integration **743/0**.

```bash
git add src/Oksis.Api/Controllers/V1/AnnouncementTemplatesController.cs \
        tests/Oksis.Api.UnitTests/Controllers/V1/AnnouncementTemplatesControllerTests.cs
git commit -m "feat(api): sablon controller'i eklendi

Sablon uclari AYRI controller'a gitti: duyuru controller'inin 'hicbir uc HttpDelete
degil' bekcisi INV-1'in API katmanindaki tek otomatik kaniti ve gevsetilmedi.
Simetrik bekci: sablon yuzeyinde TAM BIR DELETE."
```

---

**Görev 7'den itibaren:** `2026-08-03-duyurular-a3-yardimci-uclar-2.md`
