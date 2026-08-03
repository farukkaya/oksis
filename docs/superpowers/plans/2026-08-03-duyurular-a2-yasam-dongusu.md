# Duyurular A2 — Yaşam Döngüsü ve Moderasyon Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Yayınlanmış duyuruyu düzeltilebilir, geri çekilebilir, geri alınabilir ve denetlenebilir hâle getirmek; okul geneli eşikli moderasyonu (öğretmen→veli duyurusu yönetim onayına düşer) uçtan uca çalıştırmak.

**Architecture:** A1'in kurduğu Clean Architecture + CQRS omurgası üzerine dokuz yeni uç. Durum geçişleri **domain metotlarındadır** (`Amend`/`Withdraw`/`Restore`/`Expire`/`Approve`/`Reject`), handler yalnız yetki + kapsam + denetim izi + bildirim orkestrasyonu yapar. Moderasyon modu yeni bir tablo değil, `SchoolSettings` üzerinde bir kolondur — `RequireApprovalForClassRoomCreation` ile aynı cinsten bir okul politikasıdır.

**Tech Stack:** .NET 10 / C# 13 · EF Core 10 · MSSQL 2022 · MediatR · FluentValidation · Hangfire · xUnit + FluentAssertions + NSubstitute + Testcontainers

**Spec:** `docs/superpowers/specs/2026-08-02-duyurular-uctan-uca-design.md` — §2 (teslim sırası), §3.5 (invariant'lar), §6 (uç envanteri), §8 (bildirim zinciri), §12 dilim 4–5.

**Önceki plan:** `2026-08-02-duyurular-a1-omurga.md` (+ `-2`, `-3`, `-4`). A1 kaydı:
`oksis-api/.superpowers/sdd/2026-08-02-duyurular-a1-omurga/progress.md` — **oku, tahmin etme.**

**Depo:** `/Users/farukkaya/Repositories/oksis-api` — tüm yollar bu depoya görelidir.
Kontrat referansları `/Users/farukkaya/Repositories/oksis-ui`'dedir (salt okuma; A2'de oksis-ui'a **hiç yazılmaz** — mock→gerçek geçişi B'nin işidir).

**Dal:** `feature/announcements-a2` (master `ebfb157`'ten açılır).

---

## Global Constraints

Bunlar A1'in Global Constraints'inin **tamamını** kapsar ve A2'ye özgü olanları ekler. Her görevin gereksinimleri bu bölümü örtük olarak içerir.

- **Tenant izolasyonu kırmızı çizgidir.** Her tenant entity `IHasTenant` + global query filter + `TenantSaveChangesInterceptor`. `IgnoreQueryFilters()` gerekçesiz YASAK.
- **AutoMapper YASAK** — Mapster. **Repository pattern wrapper YASAK** — `IApplicationDbContext` yeterli. **Lazy loading YASAK** — explicit `Include()` veya projection.
- **Domain'de EF Core / DataAnnotations YASAK** — fluent API `Infrastructure/Persistence/Configurations/`.
- **Controller'da `DbContext` YASAK** — her zaman `ISender.Send`.
- **`async void`, `Task.Result`, `.Wait()` YASAK.**
- **Duyuru SİLİNMEZ (INV-1)** — `Delete()` metodu, `IsDeleted` alanı ve `DELETE` ucu yazılmaz. Yeni uçlar bu bekçiyi (Görev 16) günceller, **gevşetmez**.
- **Yorumlar Türkçe**, tanımlama noktalarında; tanımlayıcılar İngilizce.
- **Test isimlendirme:** `Should_{ExpectedBehavior}_When_{Condition}`, sınıf `{SystemUnderTest}Tests`.
- **Commit formatı:** `<type>(<scope>): türkçe açıklama` — scope `announcements` veya `repo`, sonda nokta yok.
- **`dotnet format` ÇALIŞTIRILMAZ — biçim kapısı `dotnet build`'dir.** `Directory.Build.props:6,9`
  `TreatWarningsAsErrors=true` + `EnforceCodeStyleInBuild=true` ilan eder, yani stil ihlali zaten
  derlemeyi kırar; `format` elle yazılan kod için gereksiz bir tekrardır. Bu depoda ölçüldü
  (2026-08-03): tüm solution'da >15 dk sürüyor, `--include` ile daraltmak bile 2 dk'yı aşıyor —
  maliyet dosyalarda değil, MSBuild workspace yüklemesinde. A1'in "her commit'ten önce format"
  kuralı bu ölçümle emekliye ayrılmıştır.
  **TEK İSTİSNA Görev 12:** EF'in ürettiği migration şablonu IDE0161'i kırar ve o dosya
  derlenmez; orada `format` bir kez, migration'dan hemen sonra çalıştırılır.
- **Enum'lar tel'de string anahtar** döner, DB'de `int` saklanır — dönüşüm `AnnouncementEnumWire`'dadır, çağrı yerinde tahmin edilmez.

### A2'ye özgü, DOĞRULANMIŞ kısıtlar (A1 kaydından — tahmin etme)

- `AggregateRoot`'un metodu **`protected void Raise(IDomainEvent)`**, `RaiseDomainEvent` DEĞİL.
- `IDomainEvent` **`DateTimeOffset OccurredAt`** ister ve o **AMBIENT `DateTimeOffset.UtcNow`**'dan gelir — çağıranın iş zamanından DEĞİL. Depodaki ~70 event'in tamamı böyledir. A2'nin altı yeni event'i aynı kurala uyar. `PublishedAt`/`WithdrawnAt` gibi **iş** zamanları çağırandan gelir.
- **`ICurrentUser.Roles` HER ZAMAN BOŞ.** `IsInRole(...)` deponun tamamında ölü koddur. "Yönetim mi" sorusu `AnnouncementCallerResolver.IsManagerAsync(IPermissionReader, ct)` (yani `announcements.approve`) ile, "kendi kapsamı" `Person.LinkedAccountId` sahipliğiyle sorulur.
- `AnnouncementCallerResolver.ResolveScopedPublisherIdAsync(permissionReader, **Guid** myPersonId, ct)` — parametre **nullable DEĞİL**. Çağıran önce `ResolveMyPersonIdAsync` çağırıp `null` ise **Forbidden** dönmek zorundadır. Dönen `null` ARTIK yalnız "yönetim" demektir.
- Rol kodları UPPER_SNAKE ve yalnız beş tane: `SUPER_ADMIN`, `SCHOOL_ADMIN`, `TEACHER`, `PARENT`, `STUDENT`. `SECRETARY`/`SCHOOL_STAFF` seed'lenmiş rol DEĞİLDİR.
- İzin anahtarları **zaten seed'de** (A1 Görev 7). A2'nin kullandıkları:
  `announcements.update` · `announcements.withdraw` · `announcements.approve` · `announcements.moderate` · `announcements.report.view` · `announcements.create` · `announcements.view`.
  Dağılım: SCHOOL_ADMIN sekizinin tamamı; TEACHER `view/create/update/withdraw/report.view`; PARENT ve STUDENT yalnız `view`; SUPER_ADMIN yalnız `view`.
- **Kapı `[RequirePermission]` ile KOMUT/SORGU sınıfındadır**, controller'da değil. `AuthorizationBehavior` onu `TRequest` tipinden okur ve reddederse `ForbiddenException` atar.
- `AcademicSession`'da `IsActive` **YOK** — `Status == AcademicSessionStatus.Active`.
- `PagedResult<T>`'nin konumsal yapıcısı **YOK** — object initializer kullan; `TotalPages`/`HasPreviousPage`/`HasNextPage` hesaplanmış property'lerdir.
- `MapStatusCode`'da (`src/Oksis.Api/Extensions/ResultExtensions.cs:112-123`) `Announcements.` kovası vardır: `Session.NotFound` → 409, `InvalidStatus` → 409, diğer her şey → 400.
- `NotificationKind`'da `AnnouncementPublished = 16`. **Yeni değerler 17'den devam eder, ARAYA EKLENMEZ** (kalıcı).
- **`NotificationPriority` YOKTUR**, `INotificationEnqueuer.Enqueue`'da öncelik parametresi YOKTUR, sessiz saat gönderim anında hiçbir bildirimde kontrol edilmez. Acil işaretinin tek etkisi başlık önekidir. **Öncelik icat etme.**
- Integration test kalıbı: `DatabaseFixture` + `[Collection(DatabaseCollection.Name)]` + `IAsyncLifetime`. Sahne `AnnouncementAudienceFixture.CreateAsync(_database)`.
- **Paylaşılan `AnnouncementAudienceFixture`'a dokunursan TÜM integration projesini çalıştır.** `~Announcement` filtresi `AudienceResolverTests`'i eşlemez ve paylaşılan sahneye aktif kişi eklemek onu iki kez sessizce kırdı.
- **~37 Documents/S3 (Garage) hatası dal öncesinden gelir. Kovalama.**

### Test titizliği — A1'de dört görev bu yüzden tur kaybetti

1. **Spesifik hatayı doğrula.** `ThrowAsync<Exception>()` ASLA. `ThrowAsync<InvalidOperationException>().WithMessage("*Announcements.Amend.InvalidStatus*")` gibi.
2. **Her test adlandırdığı kuralı İZOLE etsin.** İki bağımsız koşul aynı sonucu üretiyorsa test hangisinin çalıştığını söyleyemez ve hedefi silinse bile yeşil kalır. Testi yazmadan önce sor: *"korumak istediğim satırı silsem bu test kırılır mı?"* Cevap kesin "evet" değilse test yanlıştır.
3. **Bir testin kırıldığını göstermek için ÜRETİM KODUNU DEĞİŞTİRME.** (A1 Görev 13 güvenlik notu.)
4. `("all","all","parent")` **"tüm veliler" DEĞİLDİR** — `all` katmanı kovadan bağımsızdır ve birleşim döner. "Tüm veliler" = `("role","parent","parent")`.

---

## Kapsam sınırı

**Bu plan A2'dir.** A3 (şablon CRUD, `GET /publishers`, `GET /{id}/delivery-report`, Hangfire job'ları, ek dosya) ve B (mock→gerçek geçiş) **kapsam dışıdır**.

`packages/api/src/announcements/{contract,paths}.ts` **silinmez ve değiştirilmez**. A1 15 yoldan 5'ini yayınladı; A2 dokuz operasyon daha ekler, geriye A3'ün üç şablon ucu + `publishers` + `delivery-report` kalır. Codegen ancak A3'ten sonra çalıştırılır.

---

## Plan-seviyesi düzeltmeler (spec'e karşı) — uygulamadan ÖNCE oku

Bu üç karar spec'in metnini **düzeltir**. Gerekçeleri depodan doğrulanmıştır.

### D-1 · `GET /moderation` izni `moderate` DEĞİL, `create`'tir

Spec §6 tablosu `GET|PUT /moderation` satırını tek izne (`moderate`) bağlar. **Bu, öğretmen compose ekranını kırar.**

Kanıt: `oksis-ui/apps/web/features/announcements/teacher-announcements-page.tsx:43` `useAnnouncementModeration()` çağırır ve sonucu `compose.tsx:108`'deki `requiresApproval({ isTeacher, moderation, selections })`'a besler. `announcements.moderate` yalnız SCHOOL_ADMIN'dedir; öğretmen 403 alırsa istemci `?? "open"` varsayılanına düşer ve öğretmene **"yayınlanacak" denip duyuru onay kuyruğuna düşer** — spec §11'in son paragrafının açıkça yasakladığı ayrışma.

**KARAR:** `GET /announcements/moderation` → `[RequirePermission("announcements.create")]` (yayınlayan yüzeyi; yönetim de bu izne sahiptir). `PUT /announcements/moderation` → `[RequirePermission("announcements.moderate")]`. Yazma sınırı korunur, okuma açılır.

### D-2 · Red gerekçesi `WithdrawReason`'a YAZILMAZ

MSW mock'u (`api-mocks/.../announcement-handlers.ts:255`) reddedilen duyurunun `withdrawReason`'ına red gerekçesini yazar. **Backend bunu tekrarlamaz.**

Kanıt: `withdrawReason` alanı iki yüzeyde de **geri çekme** olarak etiketlenmiştir —
`apps/web/features/announcements/archive-tab.tsx:75` ("Gerekçe:", yalnız arşiv sekmesinde) ve
`apps/mobile/.../announcement-detail-screen.tsx:145` (**"Geri çekme gerekçesi: …"**). Reddedilen duyuru `draft`'a döner, arşiv sekmesine hiç girmez, ama yönetim/öğretmen detayında mobilde yanlış etiketle görünürdü. Denetim izi de "geri çekildi" diyen bir alanla "reddedildi" eylemini karıştırırdı.

**KARAR:** red gerekçesi (a) **denetim izine** (`AnnouncementAuditEntry`, `action: "duyuruyu reddetti"`, `field: "Gerekçe: …"`, `tone: "danger"`) ve (b) **bildirim gövdesine** yazılır (`AnnouncementRejected` — "Duyurunuz reddedildi: <gerekçe>"). `WithdrawReason` **yalnız geri çekmeye** aittir ve `:restore` onu temizler.

> **Bilinen frontend boşluğu (C'ye devredilir, A2 kapatmaz):** öğretmen red gerekçesini bugün yalnız bildirimde görür; ekranda ayrı bir alan yoktur. Kontrata `rejectReason` eklemek üçüncü bir bilinçli drift açardı ve bugün onu render eden hiçbir bileşen yok. C fazında ya `audit-trail` ucu öğretmen detayına bağlanır ya da alan eklenir.

### D-3 · `Expire()` domain metodu A2'de doğar, job'ı A3'te

Spec §12 `ExpireAnnouncementsJob`'ı dilim 7'ye (A3) koyar. **Job A3'te kalır**, ama domain metodu A2'ye çekilir. İki gerekçe:

1. INV-4'ün ayırt edici testi `expired` bir duyuruyu geri çekip geri almaktır — `Restore()` koşulsuz `published` yapıyor olsaydı yalnız bu senaryo yakalardı. Test-only `ForceStatusAsync` arka kapısıyla kurulan bir sahne bunu kanıtlayamaz.
2. A1 kaydı (Görev 13 minor) `ForceStatusAsync`'i açıkça geçici ilan etti: *"Task 14+ gerçek metotları getirince arşiv durumuna GERÇEK yoldan ulaşan eş testler ekle."* Görev 11 bunu kapatır.

---

## Dosya Yapısı

```
src/Oksis.Domain/Modules/Announcements/
  Entities/Announcement.cs                    DEĞİŞİR — Amend/Withdraw/Restore/Expire/Approve/Reject
  Events/AnnouncementAmendedEvent.cs          YENİ
  Events/AnnouncementWithdrawnEvent.cs        YENİ
  Events/AnnouncementSubmittedForApprovalEvent.cs  YENİ
  Events/AnnouncementApprovedEvent.cs         YENİ
  Events/AnnouncementRejectedEvent.cs         YENİ
  (AnnouncementScheduledExecutedEvent → A3, job ile birlikte)

src/Oksis.Domain/Modules/Schools/Entities/SchoolSettings.cs   DEĞİŞİR — AnnouncementModeration kolonu

src/Oksis.Application/Modules/Announcements/
  Abstractions/IAnnouncementModerationPolicy.cs   YENİ
  Common/AnnouncementAuditWriter.cs               YENİ — denetim izi tek yazıcı
  Common/AnnouncementLifecycleGuard.cs            YENİ — "kendi kaydı mı / yönetim mi" tek kapı
  Commands/AmendAnnouncement/                     YENİ (Command + Handler + Validator)
  Commands/WithdrawAnnouncement/                  YENİ
  Commands/RestoreAnnouncement/                   YENİ
  Commands/ApproveAnnouncement/                   YENİ
  Commands/RejectAnnouncement/                    YENİ
  Commands/UpdateAnnouncementModeration/          YENİ
  Queries/GetAnnouncementAuditTrail/              YENİ
  Queries/GetAnnouncementModeration/              YENİ
  Queries/GetAnnouncementApprovals/               YENİ
  DTOs/AnnouncementAuditEntryDto.cs               YENİ
  DTOs/AnnouncementModerationDto.cs               YENİ
  Events/Notifications/AnnouncementLifecycleNotificationHandlers.cs  YENİ
  Commands/CreateAnnouncement/…                   DEĞİŞİR (Görev 1, 2, 14)

src/Oksis.Infrastructure/
  Announcements/AnnouncementModerationPolicy.cs   YENİ
  Persistence/Configurations/Schools/SchoolSettingsConfiguration.cs  DEĞİŞİR
  Persistence/Migrations/…_announcements_moderation_setting.cs       YENİ

src/Oksis.Api/Controllers/V1/AnnouncementsController.cs   DEĞİŞİR — 6 → 15 uç
src/Oksis.Domain/Modules/Notifications/Enums/NotificationKind.cs  DEĞİŞİR — 17..21

tests/Oksis.Domain.UnitTests/Modules/Announcements/AnnouncementLifecycleTests.cs   YENİ
tests/Oksis.Application.UnitTests/Modules/Announcements/                           YENİ dosyalar
tests/Oksis.Api.UnitTests/Controllers/V1/AnnouncementsControllerTests.cs           DEĞİŞİR
tests/Oksis.Infrastructure.IntegrationTests/Persistence/Announcement*.cs           YENİ + DEĞİŞİR
```

---

## Görev Listesi (A2)

| # | Görev | Dilim | Dosya |
|---|---|---|---|
| 1 | A1 devri — yayın handler'ında tek hayatta kalan seçim kümesi | devir | bu dosya |
| 2 | A1 devri — validator `.NotNull()`, 201→200, sayfalamada Id tiebreaker | devir | bu dosya |
| 3 | A1 devri — `[RequirePermission]` yüzey bekçisi | devir | bu dosya |
| 4 | Domain — `Amend()` + `AnnouncementAmendedEvent` (INV-2) | 4 | bu dosya |
| 5 | Domain — `Withdraw()` / `Restore()` / `Expire()` (INV-4) | 4 | bu dosya |
| 6 | Ortak altyapı — `NotificationKind` 17–21, `AnnouncementAuditWriter`, `AnnouncementLifecycleGuard` | 4 | bu dosya |
| 7 | `PUT /announcements/{id}` — düzeltme ucu | 4 | `-2.md` |
| 8 | `POST /announcements/{id}:withdraw` | 4 | `-2.md` |
| 9 | `POST /announcements/{id}:restore` | 4 | `-2.md` |
| 10 | `GET /announcements/{id}/audit-trail` | 4 | `-2.md` |
| 11 | `ForceStatusAsync` emekliye ayrılır — arşiv testleri gerçek yoldan | 4 | `-2.md` |
| 12 | `SchoolSettings.AnnouncementModeration` kolonu + migration | 5 | `-3.md` |
| 13 | `GET \| PUT /announcements/moderation` | 5 | `-3.md` |
| 14 | `IAnnouncementModerationPolicy` (INV-5) + yayın akışına bağlanması | 5 | `-3.md` |
| 15 | `GET /announcements/approvals` + `:approve` + `:reject` | 5 | `-3.md` |
| 16 | Uçtan uca duman testi + controller yüzey bekçisi (6 → 15) | 4+5 | `-3.md` |

---

### Task 1: A1 devri — yayın handler'ında tek hayatta kalan seçim kümesi

A1'in nihai incelemesi bunu **merge öncesi kapatılacak** listesine koydu ve bir sonraki dala devretti. Bu dal odur; ilk iş odur, çünkü Görev 14 (moderasyon politikası) aynı handler'ın aynı bölgesine dokunur ve bozuk zemine yazmak iki kusuru birbirine dolar.

**Kusur.** `CreateAnnouncementCommandHandler` üç ayrı şeyi isteğin **üç farklı süzülmüş görünümünden** türetir:

| Türetilen | Kaynak (bugün) | Doğru kaynak |
|---|---|---|
| `targets` | etiketi çözülen seçimler | ✅ zaten doğru |
| `recipients` | `request.Audience` (süzülmemiş) | hayatta kalan seçimler |
| `reach` | `request.Audience` (süzülmemiş) | hayatta kalan seçimler |

Sonuç: elle kurulmuş bir gövde, sınıf kapsamlı bir duyuruyu `schoolWide` ilan ettirebilir ve `reach == SchoolWide` kolunun `ChildPersonId`'leri sıfırlamasını tetikleyebilir (`CreateAnnouncementCommandHandler.cs:161-164`).

**Sömürülebilirliğin kanıtı (tahmin değil, kodla doğrulandı):**
- `AudienceResolver.BuildTeacherPoolAsync` (`AudienceResolver.cs:602-611`) öğretmen havuzunda `All = null, Role = null, SchoolStage = null, GradeLevel = null` döner → `BuildLabelMapAsync` `("role","parent")` için **etiket üretmez** → hedef dondurulmaz.
- `AudienceResolver.ResolveAsync` (`:70-73`) öğretmen bağlamında `IsWithinTeacherScope`'a takılan seçimi **atlar** → alıcılar da doğru.
- Ama `reach` (`CreateAnnouncementCommandHandler.cs:150-152`) `request.Audience`'a bakar → `"role"` görür → **`SchoolWide`**.

Yani öğretmen `[("role","parent","parent"), ("section", <kendi 9-A>, "parent")]` gönderirse: hedef "9-A velileri", alıcılar 9-A velileri, ama `reach = schoolWide` ve her alıcının `ChildPersonId`'si `null`'lanır. Çok çocuklu veli bu duyuruyu **hiçbir çocuk sekmesinde ayırt edemez** ve `reach` çipi (`filterInbox`'ın `chip === "schoolWide"` kolu) yalan söyler.

**Files:**
- Modify: `src/Oksis.Application/Modules/Announcements/Commands/CreateAnnouncement/CreateAnnouncementCommandHandler.cs:105-166`
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/CreateAnnouncementTests.cs` (mevcut dosyaya ekleme)

**Interfaces:**
- Consumes: `IAudienceResolver.ResolveAsync(AudienceScope, IReadOnlyList<AudienceSelectionBody>, CancellationToken)`, `AnnouncementTarget.Create(Guid schoolId, Guid announcementId, AudienceDimension, string key, AudienceBucket, string label)`, `AnnouncementAudienceFixture.CreateAnnouncementAsAsync(Guid asAccountId, string title, string body, IReadOnlyList<(string,string,string)> audience, bool asDraft, string? scheduledAt = null, bool urgent = false)`
- Produces: davranış değişikliği; yeni tip yok. Görev 14 aynı bölgeye `MarkPendingApproval()` ekleyecek ve **hayatta kalan seçim kümesini** kullanacak.

- [ ] **Step 1: Failing test yaz**

`tests/Oksis.Infrastructure.IntegrationTests/Persistence/CreateAnnouncementTests.cs` dosyasına ekle (mevcut `using`'ler yeterli; `Oksis.Domain.Modules.Announcements.Enums` gerekiyorsa ekle):

```csharp
/// <summary>
/// A1 nihai incelemesinden devir: reach/targets/recipients ÜÇÜ DE aynı hayatta kalan
/// seçim kümesinden türemelidir.
///
/// <para><b>İzolasyon:</b> öğretmen bağlamında ("role","parent") seçimi havuzda HİÇ yoktur
/// (BuildTeacherPoolAsync Role = null döner), dolayısıyla ne hedef olarak donar ne de alıcı
/// üretir — TEK etkisi eski `reach` hesabının onu görmesiydi. Test bu yüzden yalnız reach
/// satırının kaynağını sınar: hedefler ve alıcılar zaten doğruydu ve öyle kalmalıdır.
/// İkinci seçim (kendi 9-A'sı) duyurunun gerçekten yayınlanabilmesi için gereklidir —
/// tek başına ("role","parent") gönderilseydi hedef de alıcı da boş kalır ve test
/// "reach yanlış" ile "duyuru boş" arasında ayrım yapamazdı.</para>
/// </summary>
[Fact]
public async Task Should_DeriveReachFromSurvivingSelections_When_OutOfScopeSelectionIsDropped()
{
    await using var fixture = await AnnouncementAudienceFixture.CreateAsync(_database);

    var created = await fixture.CreateAnnouncementAsAsync(
        fixture.TeacherAccountId,
        "Veli toplantisi",
        "9-A veli toplantisi carsamba gunu yapilacaktir.",
        [
            ("role", "parent", "parent"),                              // öğretmen kapsamı DIŞI — düşer
            ("section", fixture.HighSchoolClassRoomId.ToString(), "parent"), // kendi şubesi — kalır
        ],
        asDraft: false);

    created.Reach.Should().Be("classScoped",
        "hayatta kalmayan bir seçim reach'i schoolWide'a çeviremez");

    // reach == SchoolWide olsaydı handler ChildPersonId'leri null'lardı; classScoped'ta
    // veli satırı çocuğunu taşımaya devam eder.
    var parentRow = await fixture.Db.AnnouncementRecipients.AsNoTracking()
        .SingleAsync(r => r.AnnouncementId == Guid.Parse(created.Id)
            && r.PersonId == fixture.HighSchoolParentIds[0]);

    parentRow.ChildPersonId.Should().Be(fixture.HighSchoolStudentIds[0],
        "sınıf kapsamlı duyuruda alıcı satırı hangi çocuk üzerinden geldiğini taşır");

    // Hedeflerin ve alıcıların ZATEN doğru olduğu, düzeltmenin onları BOZMADIĞI:
    var targets = await fixture.Db.AnnouncementTargets.AsNoTracking()
        .Where(t => t.AnnouncementId == Guid.Parse(created.Id)).ToListAsync();
    targets.Should().ContainSingle("kapsam dışı seçim hedef olarak da donmamalıdır");
}
```

- [ ] **Step 2: Testin kırıldığını doğrula**

Run: `dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~Should_DeriveReachFromSurvivingSelections"`

Expected: **FAIL** — `created.Reach` `"schoolWide"` döner (ve muhtemelen ikinci assertion da `ChildPersonId` null olduğu için kırılır). İki assertion'ın da aynı tek nedenden kırıldığını gör: `reach`.

> **Eğer test GEÇERSE DUR.** Kusur bu yolla üretilemiyor demektir; bulguyu bildir ve devam etme — düzeltmeyi testsiz yapma.

- [ ] **Step 3: Handler'ı tek kaynağa indir**

`CreateAnnouncementCommandHandler.cs` — `var scopeForLabels = …` satırından `announcement.Publish(...)` satırına kadar olan bölgeyi şununla değiştir:

```csharp
            var scopeForLabels = new AudienceScope(schoolId, sessionId.Value, scopedPublisherId);
            var labels = await BuildLabelMapAsync(db, resolver, scopeForLabels, request.Audience, cancellationToken);

            // TEK HAYATTA KALAN SEÇİM KÜMESİ (A1 nihai incelemesi devri). Etiketi çözülemeyen
            // seçim hiçbir şeye çözülmez: ne hedef olarak donar, ne alıcı üretir, ne de reach'i
            // etkiler. Eskiden bu üç türetme İSTEĞİN ÜÇ FARKLI GÖRÜNÜMÜNDEN yapılıyordu ve
            // `reach` süzülmemiş girdiye bakıyordu — elle kurulmuş bir gövde sınıf kapsamlı bir
            // duyuruyu schoolWide ilan ettirip alıcıların ChildPersonId'lerini sıfırlatabiliyordu.
            var surviving = request.Audience
                .Select(s => (Selection: s, Label: labels.GetValueOrDefault((s.Dimension, s.Key))))
                .Where(x => x.Label is not null)
                .Select(x => (x.Selection, Label: x.Label!))
                .ToList();

            var targets = surviving.Select(x => AnnouncementTarget.Create(
                schoolId, announcement.Id,
                AnnouncementEnumWire.ParseDimension(x.Selection.Dimension), x.Selection.Key,
                AnnouncementEnumWire.ParseBucket(x.Selection.Bucket), x.Label)).ToList();

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

            var survivingSelections = surviving.Select(x => x.Selection).ToList();

            var recipients = await resolver.ResolveAsync(
                scopeForLabels, survivingSelections, cancellationToken);

            var reach = survivingSelections.Any(a => a.Dimension is "all" or "role")
                ? AnnouncementReach.SchoolWide
                : AnnouncementReach.ClassScoped;
```

Kalan satırlar (`db.AnnouncementRecipients.AddRange(...)`, `announcement.Publish(...)`, denetim izi, `SaveChangesAsync`, `return`) **aynen korunur**.

> `scopeForLabels` artık `resolver.ResolveAsync`'e de verilir — eskiden aynı değerlerle **ikinci bir** `AudienceScope` kuruluyordu. Aynı nesne, aynı üç alan; tekrar kaldırıldı.

- [ ] **Step 4: Testin geçtiğini doğrula**

Run: `dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~CreateAnnouncementTests"`
Expected: PASS — yeni test dâhil dosyanın tamamı.

- [ ] **Step 5: Regresyon — alıcı/hedef davranışı bozulmadı**

Run: `dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~Announcement"`
Expected: PASS. Özellikle `Should_...ChildPersonId...` (Görev 16, A1) testlerinin **hâlâ** okul geneli duyuruda `ChildPersonId == null` beklediğini doğrula — bu görev o davranışı korur, kaldırmaz.

- [ ] **Step 6: Tam integration projesi**

Run: `dotnet test tests/Oksis.Infrastructure.IntegrationTests`
Expected: yalnız ~37 Documents/S3 (Garage) hatası. Duyuru/AudienceResolver/Persistence'ta **sıfır** hata. Sayıyı not al — sonraki görevler bu tabana göre okunacak.

- [ ] **Step 7: Commit**

```bash
cd /Users/farukkaya/Repositories/oksis-api
git add src/Oksis.Application/Modules/Announcements/Commands/CreateAnnouncement/CreateAnnouncementCommandHandler.cs \
        tests/Oksis.Infrastructure.IntegrationTests/Persistence/CreateAnnouncementTests.cs
git commit -m "fix(announcements): reach hedef ve alici tek secim kumesinden turetiliyor

A1 nihai incelemesinin devri: reach istegin SUZULMEMIS halinden hesaplaniyordu,
bu yuzden ogretmenin kapsami disindaki bir secim -- hedef olarak donmasa ve hic
alici uretmese bile -- sinif kapsamli duyuruyu schoolWide ilan ettirip alici
satirlarinin ChildPersonId'lerini sifirlatabiliyordu."
```

---

### Task 2: A1 devri — validator `.NotNull()`, 201→200, sayfalamada Id tiebreaker

Nihai incelemenin kalan üç küçük maddesi. Üçü de aynı cinsten (**dış yüzeyin sözünü tutması**) ve hiçbiri tek başına bir görev değil; birlikte tek bir gözden geçirilebilir dilim.

**Files:**
- Modify: `src/Oksis.Application/Modules/Announcements/Commands/CreateAnnouncement/CreateAnnouncementCommandValidator.cs`
- Modify: `src/Oksis.Api/Controllers/V1/AnnouncementsController.cs:71-72`
- Modify: `src/Oksis.Application/Modules/Announcements/Queries/GetAnnouncements/GetAnnouncementsQueryHandler.cs:118-123`
- Test: `tests/Oksis.Application.UnitTests/Modules/Announcements/CreateAnnouncementCommandValidatorTests.cs` (mevcut)
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/GetAnnouncementsTests.cs` (mevcut)
- Test: `tests/Oksis.Api.UnitTests/Controllers/V1/AnnouncementsControllerTests.cs` (mevcut)

**Interfaces:**
- Consumes: `CreateAnnouncementCommand(string Title, string Body, IReadOnlyList<AudienceSelectionBody> Audience, IReadOnlyList<string> Channels, string? ScheduledAt, string? ValidUntil, bool Urgent, bool Pinned, bool AsDraft, string? AttachmentFileId)`
- Produces: davranış değişikliği; yeni tip yok.

- [ ] **Step 1: Üç failing test yaz**

**(a)** `CreateAnnouncementCommandValidatorTests.cs`'e ekle:

```csharp
/// <summary>
/// Koleksiyonlar `required` DEĞİLDİR (record positional parametreler); JSON gövdesinde
/// `"audience": null` gelirse System.Text.Json null bağlar. `RuleForEach` null koleksiyonu
/// SESSİZCE atlar ve handler'daki `request.Audience.Select(...)` NullReferenceException
/// ile 500 üretir. `.NotNull()` bunu 400'e çeker.
/// </summary>
[Fact]
public void Should_Reject_When_AudienceIsNull()
{
    var command = Build(audience: null!);

    var result = new CreateAnnouncementCommandValidator().Validate(command);

    result.IsValid.Should().BeFalse();
    result.Errors.Should().Contain(e => e.ErrorMessage == "announcements.errors.audience-required");
}

[Fact]
public void Should_Reject_When_ChannelsIsNull()
{
    var command = Build(channels: null!);

    var result = new CreateAnnouncementCommandValidator().Validate(command);

    result.IsValid.Should().BeFalse();
    result.Errors.Should().Contain(e => e.ErrorMessage == "announcements.errors.channel-invalid");
}
```

> `Build(...)` bu dosyada zaten bir yardımcı olarak varsa onu kullan; yoksa dosyanın mevcut komut kurma kalıbını birebir izleyen `private static CreateAnnouncementCommand Build(...)` ekle — **tüm parametreler geçerli varsayılanlarla**, yalnız sınanan alan bozuk. İki testin de tek nedenden kırılması buna bağlıdır.

**(b)** `AnnouncementsControllerTests.cs`'e ekle:

```csharp
/// <summary>
/// A1 nihai incelemesi devri: CreateAsync 201 ilan ediyordu ama ToHttpResult başarılı
/// Result&lt;T&gt; için 200 döner. Yanlış ilan generated OpenAPI'ye, oradan da kontrat-senkron
/// frontend'e geçer (B fazı). İlan ile gerçek arasındaki fark test edilebilir tek yerdir:
/// öznitelik.
/// </summary>
[Fact]
public void CreateAsync_ShouldDeclare_Status200_NotStatus201()
{
    var method = _controllerType.GetMethod("CreateAsync", BindingFlags.Public | BindingFlags.Instance);
    var declared = method!.GetCustomAttributes<ProducesResponseTypeAttribute>()
        .Select(a => a.StatusCode)
        .ToList();

    declared.Should().Contain(StatusCodes.Status200OK);
    declared.Should().NotContain(StatusCodes.Status201Created,
        "ToHttpResult basarili Result<T> icin 201 uretmez — ilan gercegi soylemelidir");
}
```

`using Microsoft.AspNetCore.Http;` gerekiyorsa ekle.

**(c)** `GetAnnouncementsTests.cs`'e ekle:

```csharp
/// <summary>
/// Sayfalama kararlı olmalıdır. Sıralama (Pinned, PublishedAt ?? CreatedAt) AYNI transaction
/// içinde yayınlanan kayıtlar için EŞİTTİR; SQL Server eşit anahtarlarda satır sırasını
/// garanti etmez, bu yüzden bir kayıt iki sayfada birden görünebilir veya hiç görünmeyebilir.
/// Id tiebreaker toplam kümenin tekilliğini garanti eder.
///
/// <para><b>İzolasyon:</b> assertion sayfaların İÇERİĞİNİ değil, iki sayfanın BİRLEŞİMİNİN
/// tekrarsız ve tam olduğunu sınar — sıralama kuralının kendisi değişirse bu test yine
/// geçmelidir; kırılması yalnız tiebreaker'ın yokluğuyla mümkündür.</para>
/// </summary>
[Fact]
public async Task Should_PaginateWithoutOverlap_When_RecordsShareSortKey()
{
    await using var fixture = await AnnouncementAudienceFixture.CreateAsync(_database);

    // Aynı sahnede altı duyuru: hepsi taslak (PublishedAt null → CreatedAt'e düşer) ve
    // aynı FixedClock ile kurulduğu için sıralama anahtarları pratikte eşit.
    for (var i = 0; i < 6; i++)
    {
        await fixture.CreateAnnouncementAsync(
            $"Duyuru {i}", "Icerik metni yeterince uzun.", [("all", "all", "student")], asDraft: true);
    }

    var first = await fixture.ListAsync(fixture.AdminAccountId, scope: "school", page: 1, pageSize: 3);
    var second = await fixture.ListAsync(fixture.AdminAccountId, scope: "school", page: 2, pageSize: 3);

    var union = first.Items.Concat(second.Items).Select(a => a.Id).ToList();

    union.Should().OnlyHaveUniqueItems("bir kayit iki sayfada birden gorunemez");
    union.Should().HaveCount(6, "iki sayfa tum kumeyi kapsamalidir");
}
```

- [ ] **Step 2: Üçünün de kırıldığını doğrula**

```bash
dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~CreateAnnouncementCommandValidatorTests"
dotnet test tests/Oksis.Api.UnitTests --filter "FullyQualifiedName~AnnouncementsControllerTests"
dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~Should_PaginateWithoutOverlap"
```

Expected: (a) 2 FAIL, (b) 1 FAIL, (c) FAIL **veya** geçebilir.

> **(c) hakkında dürüst ol.** Tiebreaker'sız sıralama *belirsizdir*, *garantili yanlış* değil — SQL Server küçük bir kümede kararlı bir plan seçip testi geçirebilir. Test geçerse: (1) düzeltmeyi yine de yap, (2) testi ledger'a **"koruyucu, üretimi kanıtlanmamış"** diye kaydet, (3) testi silme ve "geçti" diye rapor etme. Kanıtlanamayan bir kusuru kanıtlanmış gibi sunmak A1'in tekrar tekrar cezalandırdığı hatadır.

- [ ] **Step 3: Validator'a `.NotNull()` ekle**

`CreateAnnouncementCommandValidator.cs` — mevcut iki kuralı şununla değiştir:

```csharp
        // Koleksiyonlar record positional parametredir, `required` DEĞİL: JSON'da null
        // gelirse bağlanır ve RuleForEach null'ı SESSİZCE atlar — handler'daki
        // request.Audience.Select(...) NullReferenceException ile 500 üretirdi.
        RuleFor(x => x.Audience).NotNull()
            .WithMessage("announcements.errors.audience-required");

        // Taslakta hedef ARANMAZ — hazırlanan duyuru hedefi sonra seçilebilir.
        RuleFor(x => x.Audience).NotEmpty()
            .When(x => !x.AsDraft)
            .WithMessage("announcements.errors.audience-required");
```

ve kanal kuralının üstüne:

```csharp
        // Boş liste MEŞRUDUR (domain inApp'i kendisi ekler — INV-3); null değildir.
        RuleFor(x => x.Channels).NotNull()
            .WithMessage("announcements.errors.channel-invalid");
```

> `Channels` için `NotEmpty()` **yazma**. A1 Görev 12 fix turu boş `channels`'ın meşru olduğunu kilitledi: `Announcement.CreateDraft` `inApp`'i kendisi ekler (INV-3). `NotEmpty()` bunu geri alır ve mevcut testi kırar.

- [ ] **Step 4: Controller ilanını düzelt**

`AnnouncementsController.cs` — `CreateAsync`'in özniteliğini değiştir:

```csharp
    [HttpPost]
    // ToHttpResult başarılı Result<T> için 200 döner (201 DEĞİL). İlan gerçeği söylemelidir:
    // generated OpenAPI kontrat-senkron frontend'i besler (B fazı) ve yanlış statü kodu
    // orada sessiz bir hata hâline gelirdi.
    [ProducesResponseType(typeof(ApiResponse<AnnouncementDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> CreateAsync(
```

Ayrıca `oksis-ui/packages/api/src/announcements/paths.ts`'in `POST /api/v1/announcements` yolunda `201` ilan ettiğini **not al ve DEĞİŞTİRME** — o dosya B fazının konusudur ve drift bekçisinin orada çalması beklenen davranıştır (spec §13 adım 3).

- [ ] **Step 5: Sayfalamaya Id tiebreaker ekle**

`GetAnnouncementsQueryHandler.cs`:

```csharp
        // Sabitlenenler üstte, sonra yayın anına göre yeniden eskiye; taslaklarda
        // PublishedAt null olduğu için oluşturulma anı yedek sıralamadır. Id son
        // kırıcıdır: aynı transaction'da yayınlanan kayıtların sıralama anahtarları
        // EŞİTTİR ve eşit anahtarlarda satır sırası garanti edilmez — tiebreaker'sız
        // bir kayıt iki sayfada birden görünebilir veya hiç görünmeyebilir.
        var rows = await query
            .OrderByDescending(a => a.Pinned)
            .ThenByDescending(a => a.PublishedAt ?? a.CreatedAt)
            .ThenBy(a => a.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
```

- [ ] **Step 6: Üçünün de geçtiğini doğrula**

```bash
dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~Announcement"
dotnet test tests/Oksis.Api.UnitTests --filter "FullyQualifiedName~Announcement"
dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~Announcement"
```

Expected: PASS. Özellikle `GetAnnouncementsTests`'in mevcut sıralama testleri (varsa) **kırılmamalıdır** — `ThenBy(Id)` yalnız eşitlik durumunda devreye girer.

- [ ] **Step 7: Commit**

```bash
cd /Users/farukkaya/Repositories/oksis-api
git add src/Oksis.Application/Modules/Announcements/Commands/CreateAnnouncement/CreateAnnouncementCommandValidator.cs \
        src/Oksis.Api/Controllers/V1/AnnouncementsController.cs \
        src/Oksis.Application/Modules/Announcements/Queries/GetAnnouncements/GetAnnouncementsQueryHandler.cs \
        tests/
git commit -m "fix(announcements): dis yuzey ilanlari gercege hizalandi

Uc devir maddesi: koleksiyonlarda .NotNull() (null govde 500 yerine 400),
POST /announcements 201 yerine 200 ilan ediyor (ToHttpResult'un gercek davranisi,
generated OpenAPI uzerinden frontend'e gidiyor) ve sayfalamada Id tiebreaker
(esit siralama anahtarlarinda kayit kaymasi)."
```

---

### Task 3: A1 devri — `[RequirePermission]` yüzey bekçisi

**Kusur.** İzin kapısı hiçbir katmanda test edilmiyor. Testler handler'ları **doğrudan** kuruyor (`AnnouncementAudienceFixture.ListAsync` vb. — dosyanın kendi yorumları bunu açıkça söylüyor: *"MediatR pipeline'ı devre dışı — `RequirePermission` attribute'u burada UYGULANMAZ"*). Bir öznitelik silinse veya yanlış anahtar yazılsa 640+ integration ve 1400+ application testinin **tamamı yeşil** kalır.

**Bu görev `AuthorizationBehavior`'ı yeniden test etmez** — `tests/Oksis.Application.UnitTests/Common/Behaviors/AuthorizationBehaviorTests.cs` zaten var ve mekanizmanın çalıştığını kanıtlıyor. Eksik olan, **duyuru isteklerinin doğru anahtarı ilan ettiğidir.** Reflection tablosu bunu kapatır ve A2'nin dokuz yeni isteğine kendiliğinden ölçeklenir.

**Files:**
- Create: `tests/Oksis.Application.UnitTests/Modules/Announcements/AnnouncementPermissionSurfaceTests.cs`

**Interfaces:**
- Consumes: `RequirePermissionAttribute` (`Oksis.Application.Common.Attributes`, property adı `Permission`), `TenancyAttribute` + `TenancyMode` (aynı namespace), `ICommand<T>` / `IQuery<T>` (`Oksis.Application.Common.Cqrs`)
- Produces: `AnnouncementPermissionSurfaceTests` — Görev 7–15 her yeni istek için bu tablodaki satırı **eklemek zorundadır**; tablo eksik kalırsa test kırılır.

- [ ] **Step 1: Failing test yaz**

`tests/Oksis.Application.UnitTests/Modules/Announcements/AnnouncementPermissionSurfaceTests.cs`:

```csharp
using System.Reflection;
using FluentAssertions;
using Oksis.Application.Common.Attributes;
using Oksis.Application.Modules.Announcements.Commands.CreateAnnouncement;
using Oksis.Application.Modules.Announcements.Commands.MarkAnnouncementRead;
using Oksis.Application.Modules.Announcements.Queries.GetAnnouncementById;
using Oksis.Application.Modules.Announcements.Queries.GetAnnouncementInbox;
using Oksis.Application.Modules.Announcements.Queries.GetAnnouncements;
using Oksis.Application.Modules.Announcements.Queries.GetAudiencePool;
using Xunit;

namespace Oksis.Application.UnitTests.Modules.Announcements;

/// <summary>
/// A1 nihai incelemesi devri: izin kapısı HİÇBİR katmanda sınanmıyordu. Entegrasyon
/// testleri handler'ları doğrudan kurar (MediatR pipeline devre dışı), dolayısıyla bir
/// <see cref="RequirePermissionAttribute"/>'ün silinmesi veya yanlış anahtara işaret etmesi
/// tüm süiti yeşil bırakırdı.
///
/// <para><b>Bu sınıf <c>AuthorizationBehavior</c>'ı YENİDEN TEST ETMEZ</b> — mekanizmanın
/// çalıştığı <c>AuthorizationBehaviorTests</c>'te kanıtlıdır. Burada sınanan, duyuru
/// isteklerinin DOĞRU anahtarı ilan ettiğidir: iki test birbirinin yerine geçmez.</para>
///
/// <para><b>Tam sayım kasıtlıdır.</b> <see cref="AllAnnouncementRequests"/> modüldeki her
/// istek tipini reflection ile bulur; tabloda karşılığı olmayan YENİ bir istek testi kırar.
/// Yeni uç eklerken bu tabloya satır eklemek zorunludur — unutulan bir kapı sessizce
/// açık kalamaz.</para>
/// </summary>
public sealed class AnnouncementPermissionSurfaceTests
{
    /// <summary>İstek tipi → beklenen izin anahtarı. Yeni uç → yeni satır.</summary>
    public static IEnumerable<object[]> ExpectedPermissions()
    {
        yield return [typeof(GetAnnouncementsQuery), "announcements.view"];
        yield return [typeof(GetAnnouncementByIdQuery), "announcements.view"];
        yield return [typeof(GetAnnouncementInboxQuery), "announcements.view"];
        yield return [typeof(MarkAnnouncementReadCommand), "announcements.view"];
        yield return [typeof(GetAudiencePoolQuery), "announcements.create"];
        yield return [typeof(CreateAnnouncementCommand), "announcements.create"];
    }

    [Theory]
    [MemberData(nameof(ExpectedPermissions))]
    public void Should_DeclareExpectedPermission_When_RequestIsAnnouncementRequest(
        Type requestType, string expectedPermission)
    {
        var declared = requestType.GetCustomAttributes<RequirePermissionAttribute>()
            .Select(a => a.Permission)
            .ToList();

        declared.Should().ContainSingle(
            $"{requestType.Name} tam olarak bir izin anahtari ilan etmelidir");
        declared[0].Should().Be(expectedPermission);
    }

    [Theory]
    [MemberData(nameof(ExpectedPermissions))]
    public void Should_RequireTenancy_When_RequestIsAnnouncementRequest(
        Type requestType, string _)
    {
        var tenancy = requestType.GetCustomAttribute<TenancyAttribute>();

        tenancy.Should().NotBeNull($"{requestType.Name} tenant kapsamli bir kayda dokunur");
        tenancy!.Mode.Should().Be(TenancyMode.Required);
    }

    [Fact]
    public void Should_CoverEveryAnnouncementRequest_When_TableIsRead()
    {
        var covered = ExpectedPermissions().Select(row => (Type)row[0]).ToHashSet();

        var actual = AllAnnouncementRequests().ToList();

        actual.Should().OnlyContain(t => covered.Contains(t),
            "izin tablosunda karsiligi olmayan bir istek, kapisi sinanmayan bir uctur");
        covered.Should().OnlyContain(t => actual.Contains(t),
            "tabloda artik var olmayan bir istek kalmamalidir");
    }

    private static IEnumerable<Type> AllAnnouncementRequests() =>
        typeof(CreateAnnouncementCommand).Assembly
            .GetTypes()
            .Where(t => t is { IsClass: true, IsAbstract: false }
                && t.Namespace is not null
                && t.Namespace.StartsWith(
                    "Oksis.Application.Modules.Announcements.Commands", StringComparison.Ordinal)
                    || (t.Namespace?.StartsWith(
                        "Oksis.Application.Modules.Announcements.Queries", StringComparison.Ordinal) ?? false))
            .Where(t => t.GetInterfaces().Any(i => i.IsGenericType
                && (i.GetGenericTypeDefinition() == typeof(MediatR.IRequest<>))))
            .Where(t => !t.Name.EndsWith("Handler", StringComparison.Ordinal)
                && !t.Name.EndsWith("Validator", StringComparison.Ordinal));
}
```

- [ ] **Step 2: Testin gerçekten bir şey iddia ettiğini KANITLA**

Bu test, üretim kodu zaten doğruysa ilk çalıştırmada **geçer**. O yüzden değerini ayrıca kanıtla — **üretim kodunu değiştirmeden**:

Run: `dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~AnnouncementPermissionSurfaceTests"`
Expected: 13 PASS.

Sonra **testin kendi tablosunu** geçici olarak boz (üretim kodunu DEĞİL): `GetAudiencePoolQuery` satırındaki beklentiyi `"announcements.view"` yap, çalıştır, **FAIL** gör, geri al. Ardından tablodan `MarkAnnouncementReadCommand` satırını sil, çalıştır, `Should_CoverEveryAnnouncementRequest` **FAIL** gör, geri al.

```bash
dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~AnnouncementPermissionSurfaceTests"
```

Her iki mutasyonun ürettiği hata mesajını ledger'a not al. `AllAnnouncementRequests()` yansımasının gerçekten altı tipi bulduğunu da doğrula — sıfır tip bulan bir yansıma `OnlyContain` ile **boş kümede sessizce geçer**; bu yüzden mutasyon (2) zorunludur.

- [ ] **Step 3: `AllAnnouncementRequests` filtresinin doğru çalıştığını sabitle**

Yansıma sessizce boş dönerse tüm sınıf değersizleşir. Bunu bir testle kilitle — Step 1'deki dosyaya ekle:

```csharp
/// <summary>
/// <see cref="AllAnnouncementRequests"/> yansıması boş dönerse yukarıdaki kapsam testi
/// BOŞ KÜMEDE sessizce geçerdi. Sayı burada sabitlenir: A2'nin her yeni isteği bu sayıyı
/// ve izin tablosunu BİRLİKTE günceller.
/// </summary>
[Fact]
public void Should_DiscoverAllSixRequests_When_ReflectionRuns()
{
    AllAnnouncementRequests().Should().HaveCount(6);
}
```

Run: `dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~AnnouncementPermissionSurfaceTests"`
Expected: 14 PASS. Sayı 6 değilse **DUR** — yansıma filtresi yanlış; düzelt ve gerekçesini not al.

- [ ] **Step 4: Uygulama süitinin tamamı**

Run: `dotnet test tests/Oksis.Application.UnitTests`
Expected: PASS, regresyon yok.

- [ ] **Step 5: Commit**

```bash
cd /Users/farukkaya/Repositories/oksis-api
git add tests/Oksis.Application.UnitTests/Modules/Announcements/AnnouncementPermissionSurfaceTests.cs
git commit -m "test(announcements): izin yuzeyi reflection tablosuyla sabitlendi

A1 devri: [RequirePermission] hicbir katmanda sinanmiyordu (entegrasyon testleri
handler'i dogrudan kuruyor, MediatR behavior'lari calismiyor). Tablo modulun her
istegini kapsar; karsiligi olmayan yeni bir istek testi kirar."
```

---

### Task 4: Domain — `Amend()` + `AnnouncementAmendedEvent` (INV-2)

Yayın sonrası düzeltme. **INV-2'nin domain seviyesindeki kanıtı `Amend()`'in imzasıdır:** hedef parametresi ALMAZ. Hedefi yanlış seçilmiş duyuru düzeltilmez — geri çekilip yeniden yayınlanır.

**Silent (sessiz) düzeltme.** Sözlükteki `silentAmendment`: yayın sonrası **anlamı değiştirmeyen** imla/biçim düzeltmesi — alıcıya bildirim gitmez, "Güncellendi" rozeti açılmaz, denetim izine yazılır. Domain bu ayrımı `silent` bayrağıyla taşır; bildirim kararı Application katmanının (Görev 7).

**Files:**
- Modify: `src/Oksis.Domain/Modules/Announcements/Entities/Announcement.cs`
- Create: `src/Oksis.Domain/Modules/Announcements/Events/AnnouncementAmendedEvent.cs`
- Test: `tests/Oksis.Domain.UnitTests/Modules/Announcements/AnnouncementLifecycleTests.cs` (YENİ dosya)

**Interfaces:**
- Consumes: `Announcement.CreateDraft(...)` (mevcut, 14 parametre), `Announcement.Publish(AnnouncementReach reach, int recipientCount, DateTimeOffset now)`, `AnnouncementDomainException(string code, string message)`, `AggregateRoot.Raise(IDomainEvent)`, `IDomainEvent.OccurredAt`
- Produces:
  - `void Announcement.Amend(string title, string body, bool silent)` — hedef parametresi **YOK** (INV-2); saat parametresi de yok (`UpdatedAt`'i `AuditingInterceptor` yazar). `Amended` bayrağını `!silent` olduğunda açar; **hiçbir zaman kapatmaz**.
  - `sealed record AnnouncementAmendedEvent(Guid SchoolId, Guid AnnouncementId, string Title, bool Silent, DateTimeOffset OccurredAt) : IDomainEvent`

- [ ] **Step 1: Failing testleri yaz**

`tests/Oksis.Domain.UnitTests/Modules/Announcements/AnnouncementLifecycleTests.cs`:

```csharp
using System.Reflection;
using FluentAssertions;
using Oksis.Domain.Modules.Announcements.Entities;
using Oksis.Domain.Modules.Announcements.Enums;
using Oksis.Domain.Modules.Announcements.Events;
using Oksis.Domain.Modules.Announcements.Exceptions;
using Xunit;

namespace Oksis.Domain.UnitTests.Modules.Announcements;

/// <summary>
/// A2 dilim 4 — yaşam döngüsü geçişleri. Kurallar HANDLER'DA değil burada zorlanır:
/// bir handler unutulabilir, domain metodu atlanamaz.
/// </summary>
public sealed class AnnouncementLifecycleTests
{
    private static readonly DateTimeOffset _now = new(2026, 8, 3, 9, 0, 0, TimeSpan.Zero);

    private static Announcement Published()
    {
        var a = Draft();
        a.Publish(AnnouncementReach.SchoolWide, recipientCount: 12, _now);
        a.ClearDomainEvents();
        return a;
    }

    private static Announcement Draft() => Announcement.CreateDraft(
        Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(),
        "Okul Müdürlüğü", null, "Okul Müdürü",
        AnnouncementType.Institutional, "Servis saatleri", "Servisler bir saat erken kalkacaktir.",
        urgent: false, pinned: false, scheduledAt: null, validUntil: null,
        channels: [DeliveryChannel.InApp]);

    // ═══════════ INV-2: Amend hedef ALMAZ ═══════════

    /// <summary>
    /// INV-2'nin YAPISAL kanıtı. Bir sonraki geliştirici <c>Amend</c>'e hedef parametresi
    /// eklemeye kalkarsa bu test kırılır — davranış testleri kıramaz, çünkü yeni parametreye
    /// null geçen bir çağrı hâlâ doğru sonuç üretir.
    /// </summary>
    [Fact]
    public void Should_NotAcceptAudienceParameter_When_AmendIsDeclared()
    {
        var amend = typeof(Announcement).GetMethod(nameof(Announcement.Amend));

        amend.Should().NotBeNull();
        amend!.GetParameters().Select(p => p.Name)
            .Should().BeEquivalentTo(["title", "body", "silent"],
                "INV-2: hedef yayin aninda donar — duzeltme onu ALAMAZ");
    }

    [Fact]
    public void Should_SetAmendedBadge_When_AmendIsNotSilent()
    {
        var a = Published();

        a.Amend("Servis saatleri (guncellendi)", "Servisler iki saat erken kalkacaktir.",
            silent: false, _now.AddHours(1));

        a.Amended.Should().BeTrue();
        a.Title.Should().Be("Servis saatleri (guncellendi)");
        a.Body.Should().Be("Servisler iki saat erken kalkacaktir.");
    }

    /// <summary>
    /// Sessiz düzeltme rozeti AÇMAZ (sözlük: silentAmendment). Bu, <c>silent</c> bayrağının
    /// gerçekten okunduğunun tek kanıtıdır — üstteki test tek başına, bayrak hiç okunmasa
    /// ve <c>Amended = true</c> koşulsuz yazılsa bile geçerdi.
    /// </summary>
    [Fact]
    public void Should_NotSetAmendedBadge_When_AmendIsSilent()
    {
        var a = Published();

        a.Amend("Servis saatleri", "Servisler bir saat erken kalkacaktır.", silent: true, _now.AddHours(1));

        a.Amended.Should().BeFalse();
        a.Body.Should().Be("Servisler bir saat erken kalkacaktır.", "metin yine de degisir");
    }

    /// <summary>
    /// Rozet TEK YÖNLÜDÜR. Anlamlı bir düzeltmeden sonra gelen sessiz bir imla düzeltmesi
    /// "Güncellendi" işaretini SİLEMEZ — alıcı duyurunun değiştiğini bir kez öğrendiyse
    /// o bilgi geri alınamaz.
    /// </summary>
    [Fact]
    public void Should_KeepAmendedBadge_When_SilentAmendFollowsRealAmend()
    {
        var a = Published();
        a.Amend("Yeni baslik", "Anlamli bir degisiklik yapildi.", silent: false, _now.AddHours(1));

        a.Amend("Yeni başlık", "Anlamlı bir değişiklik yapıldı.", silent: true, _now.AddHours(2));

        a.Amended.Should().BeTrue();
    }

    [Fact]
    public void Should_RaiseAmendedEvent_When_AmendSucceeds()
    {
        var a = Published();

        a.Amend("Yeni baslik", "Yeni govde metni yeterince uzun.", silent: false, _now.AddHours(1));

        a.DomainEvents.OfType<AnnouncementAmendedEvent>().Should().ContainSingle()
            .Which.Silent.Should().BeFalse();
    }

    /// <summary>
    /// Sessiz düzeltme de olayı YAYAR — bildirim kararı Application katmanınındır (Görev 7),
    /// domain kayıt tutmayı bırakmaz. Denetim izi sessiz düzeltmeyi de yazar.
    /// </summary>
    [Fact]
    public void Should_RaiseAmendedEvent_When_AmendIsSilent()
    {
        var a = Published();

        a.Amend("Baslik", "Govde metni yeterince uzundur.", silent: true, _now.AddHours(1));

        a.DomainEvents.OfType<AnnouncementAmendedEvent>().Should().ContainSingle()
            .Which.Silent.Should().BeTrue();
    }

    /// <summary>
    /// OccurredAt AMBIENT saatten gelir, çağıranın iş zamanından DEĞİL (depodaki ~70 olayın
    /// tamamı böyle — A1 Görev 3 kaydı). İş zamanı <c>now</c> parametresidir ve entity'nin
    /// kendi alanlarına yazılır; olay yalnız "ne zaman yayıldı"yı taşır.
    /// </summary>
    [Fact]
    public void Should_UseAmbientClockForOccurredAt_When_AmendRaisesEvent()
    {
        var businessTime = new DateTimeOffset(2020, 1, 1, 0, 0, 0, TimeSpan.Zero);
        var a = Published();

        a.Amend("Baslik", "Govde metni yeterince uzundur.", silent: false, businessTime);

        a.DomainEvents.OfType<AnnouncementAmendedEvent>().Single()
            .OccurredAt.Should().NotBe(businessTime)
            .And.BeAfter(new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero));
    }

    // ═══════════ Statü kapısı ═══════════

    /// <summary>
    /// Yalnız YAYINDAKİ duyuru düzeltilir (spec §6). Taslak zaten serbestçe düzenlenir
    /// (ayrı akış), onay bekleyen henüz yayınlanmamıştır, geri çekilmiş kayıt dondurulmuştur.
    /// </summary>
    [Theory]
    [InlineData(AnnouncementStatus.Draft)]
    [InlineData(AnnouncementStatus.Scheduled)]
    [InlineData(AnnouncementStatus.PendingApproval)]
    public void Should_Throw_When_AmendingNonPublishedAnnouncement(AnnouncementStatus status)
    {
        var a = Draft();
        if (status is AnnouncementStatus.Scheduled) a.MarkScheduled(_now.AddDays(1));
        if (status is AnnouncementStatus.PendingApproval) a.MarkPendingApproval();

        var act = () => a.Amend("Baslik", "Govde metni yeterince uzundur.", silent: false, _now);

        act.Should().Throw<AnnouncementDomainException>()
            .Which.Code.Should().Be("Announcements.Amend.InvalidStatus");
    }

    [Fact]
    public void Should_Throw_When_AmendedTitleIsTooShort()
    {
        var a = Published();

        var act = () => a.Amend("ab", "Govde metni yeterince uzundur.", silent: false, _now);

        act.Should().Throw<AnnouncementDomainException>()
            .Which.Code.Should().Be("Announcements.Title.Invalid");
    }

    [Fact]
    public void Should_Throw_When_AmendedBodyIsTooShort()
    {
        var a = Published();

        var act = () => a.Amend("Gecerli baslik", "kisa", silent: false, _now);

        act.Should().Throw<AnnouncementDomainException>()
            .Which.Code.Should().Be("Announcements.Body.Invalid");
    }
}
```

> `ClearDomainEvents()` metodunun `AggregateRoot`'ta gerçek adı **DOĞRULANMALIDIR**. Step 2'den önce `grep -n "DomainEvents" src/Oksis.Domain/Common/AggregateRoot.cs` çalıştır ve gerçek adı kullan. Adı farklıysa (ör. `ClearEvents`) testte düzelt — **plan tahmin etmiştir, kod otoritedir.**

- [ ] **Step 2: `AggregateRoot` API'sini doğrula**

Run:
```bash
grep -n "DomainEvents\|Raise\|Clear" src/Oksis.Domain/Common/AggregateRoot.cs
```

Expected: `protected void Raise(IDomainEvent)` ve olay listesini temizleyen bir metot. Gerçek adları Step 1'deki teste yansıt. `Raise` başka bir ada sahipse **DUR ve bildir** — A1 kaydı `Raise` diyor, farklıysa depo değişmiş demektir.

- [ ] **Step 3: Testin kırıldığını doğrula**

Run: `dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~AnnouncementLifecycleTests"`
Expected: FAIL — derleme hatası (`Announcement.Amend` ve `AnnouncementAmendedEvent` yok).

- [ ] **Step 4: Olayı yaz**

`src/Oksis.Domain/Modules/Announcements/Events/AnnouncementAmendedEvent.cs`:

```csharp
using Oksis.Domain.Common;

namespace Oksis.Domain.Modules.Announcements.Events;

/// <summary>
/// Yayınlanmış duyuru düzeltildi. <c>DomainEventInterceptor</c> SaveChangesAsync sırasında işler.
///
/// <para><see cref="Silent"/> true ise düzeltme SESSİZDİR (sözlük: <c>silentAmendment</c>) —
/// anlamı değiştirmeyen imla/biçim düzeltmesi. Alıcıya bildirim GİTMEZ ve "Güncellendi"
/// rozeti açılmaz; denetim izine yine de yazılır. Olay her iki hâlde de yayılır: hangi
/// kanalın susacağına Application katmanı karar verir, domain kayıt tutmayı bırakmaz.</para>
///
/// <para><see cref="OccurredAt"/> AMBIENT <c>DateTimeOffset.UtcNow</c>'dan gelir, çağıranın
/// iş zamanından DEĞİL — depodaki tüm olaylarla aynı kural (bkz.
/// <c>AbsenceThresholdReachedNotificationHandler</c> gerekçesi).</para>
/// </summary>
public sealed record AnnouncementAmendedEvent(
    Guid SchoolId,
    Guid AnnouncementId,
    string Title,
    bool Silent,
    DateTimeOffset OccurredAt) : IDomainEvent;
```

- [ ] **Step 5: `Amend()`'i yaz**

`Announcement.cs` — `MarkPendingApproval()` ile `AttachFile(...)` arasına ekle. Ayrıca sınıfın tepesine, `CreateDraft`'ın doğrulama bloklarını yeniden kullanmak için iki özel yardımcı çıkar (kopyala-yapıştır doğrulama iki yerde ayrışır):

```csharp
    /// <summary>
    /// Yayın SONRASI düzeltme (spec dilim 4).
    ///
    /// <para><b>INV-2 — hedef parametresi YOKTUR ve eklenmeyecektir.</b> Alıcı listesi yayın
    /// anında donar; hedefi yanlış seçilmiş duyuru düzeltilmez, <see cref="Withdraw"/> ile
    /// geri çekilip yeniden yayınlanır. İmzanın kendisi bu invariant'ın kanıtıdır —
    /// <c>AnnouncementLifecycleTests.Should_NotAcceptAudienceParameter_When_AmendIsDeclared</c>
    /// onu yansımayla kilitler.</para>
    ///
    /// <para><paramref name="silent"/> true ise "Güncellendi" rozeti AÇILMAZ (sözlük:
    /// <c>silentAmendment</c>). Rozet TEK YÖNLÜDÜR: bir kez açıldıysa sonraki sessiz bir
    /// düzeltme onu kapatmaz — alıcı duyurunun değiştiğini öğrendiyse o bilgi geri alınamaz.</para>
    ///
    /// <para><b>Saat parametresi YOKTUR.</b> Düzeltmenin zaman damgası <c>UpdatedAt</c>'tir ve
    /// onu <c>AuditingInterceptor</c> kayıt anında yazar — entity çağırandan iş zamanı ALMAZ.
    /// Okunmayan bir parametre, metodun bir zaman kaydettiği yalanını söylerdi ve bu depoda
    /// <c>TreatWarningsAsErrors</c> + IDE0060 onu doğru şekilde build hatasına çevirir.
    /// Olayın <c>OccurredAt</c>'i ise ambient saatten gelir (bkz. <see cref="Publish"/>).</para>
    /// </summary>
    public void Amend(string title, string body, bool silent)
    {
        if (Status is not AnnouncementStatus.Published)
        {
            throw new AnnouncementDomainException(
                "Announcements.Amend.InvalidStatus",
                "Yalnız yayındaki duyuru düzeltilebilir.");
        }

        Title = NormalizeTitle(title);
        Body = NormalizeBody(body);

        if (!silent)
        {
            Amended = true;
        }

        Raise(new AnnouncementAmendedEvent(SchoolId, Id, Title, silent, DateTimeOffset.UtcNow));
    }
```

ve `CreateDraft`'ın hemen altına (ya da sınıfın sonuna) iki yardımcı:

```csharp
    /// <summary>
    /// Başlık normalizasyonu ve doğrulaması — <see cref="CreateDraft"/> ile <see cref="Amend"/>
    /// AYNI kuralı uygular. İki yerde ayrı yazılsaydı düzeltme, yayınlanamayacak bir başlığı
    /// kabul edebilirdi.
    /// </summary>
    private static string NormalizeTitle(string title)
    {
        var normalized = (title ?? string.Empty).Trim();
        if (normalized.Length is < TitleMinLength or > TitleMaxLength)
        {
            throw new AnnouncementDomainException(
                "Announcements.Title.Invalid",
                $"Duyuru başlığı {TitleMinLength}-{TitleMaxLength} karakter olmalıdır.");
        }

        return normalized;
    }

    private static string NormalizeBody(string body)
    {
        var normalized = (body ?? string.Empty).Trim();
        if (normalized.Length < BodyMinLength)
        {
            throw new AnnouncementDomainException(
                "Announcements.Body.Invalid",
                $"Duyuru içeriği en az {BodyMinLength} karakter olmalıdır.");
        }

        return normalized;
    }
```

`CreateDraft` içindeki iki inline doğrulama bloğunu bu yardımcılarla değiştir:

```csharp
        var normalizedTitle = NormalizeTitle(title);
        var normalizedBody = NormalizeBody(body);
```

- [ ] **Step 6: Testin geçtiğini doğrula**

Run: `dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~AnnouncementLifecycleTests"`
Expected: PASS (11 test).

- [ ] **Step 7: Mevcut domain testlerinin bozulmadığını doğrula**

`CreateDraft`'ın doğrulaması yardımcılara taşındı — **davranış aynı kalmalıdır.**

Run: `dotnet test tests/Oksis.Domain.UnitTests`
Expected: PASS, regresyon yok. `AnnouncementTests`'in başlık/gövde doğrulama testleri hâlâ aynı hata kodlarını almalıdır.

- [ ] **Step 8: Commit**

```bash
cd /Users/farukkaya/Repositories/oksis-api
git add src/Oksis.Domain/Modules/Announcements/Entities/Announcement.cs \
        src/Oksis.Domain/Modules/Announcements/Events/AnnouncementAmendedEvent.cs \
        tests/Oksis.Domain.UnitTests/Modules/Announcements/AnnouncementLifecycleTests.cs
git commit -m "feat(core): duyuru duzeltme domain metodu eklendi

Amend() hedef parametresi ALMAZ (INV-2) ve bunu bir yansima testi kilitler.
Sessiz duzeltme Guncellendi rozetini acmaz; rozet tek yonludur. Baslik/govde
dogrulamasi CreateDraft ile ortak yardimcilara cikarildi -- iki yerde ayri
yazilsaydi duzeltme yayinlanamayacak bir basligi kabul edebilirdi."
```

---

### Task 5: Domain — `Withdraw()` / `Restore()` / `Expire()` (INV-4)

**INV-4:** geri çekme geri alınırsa **ÖNCEKİ** statüye dönülür. `Restore()` koşulsuz `published` YAPMAZ.

Bu, MSW mock'unun (`announcement-handlers.ts:220-226`) yaptığının tersidir — mock koşulsuz `published` yazar. **Backend bağlayıcı olan taraftır** (spec §11); mock A2'de değiştirilmez ve B fazında istemci gerçek uca bağlanınca doğru davranış zaten sunucudan gelir.

**`Expire()` neden burada:** D-3'e bakınız. INV-4'ün ayırt edici testi süresi dolmuş bir duyuruyu geri çekip geri almaktır; `Restore()` koşulsuz `published` yapıyor olsaydı **yalnız** o senaryo yakalardı. Job A3'te kalır, metot burada doğar.

**Files:**
- Modify: `src/Oksis.Domain/Modules/Announcements/Entities/Announcement.cs`
- Create: `src/Oksis.Domain/Modules/Announcements/Events/AnnouncementWithdrawnEvent.cs`
- Test: `tests/Oksis.Domain.UnitTests/Modules/Announcements/AnnouncementLifecycleTests.cs` (Görev 4'ün dosyası)

**Interfaces:**
- Consumes: Görev 4'ün ürettiği her şey + `AnnouncementStatus` (Draft=0, Scheduled=1, PendingApproval=2, Published=3, Expired=4, Withdrawn=5, Archived=6)
- Produces:
  - `void Announcement.Withdraw(string reason, Guid withdrawnBy, DateTimeOffset now)` — `StatusBeforeWithdraw`'ı saklar, `WithdrawReason/WithdrawnAt/WithdrawnBy` yazar, `AnnouncementWithdrawnEvent` yayar.
  - `void Announcement.Restore()` — `StatusBeforeWithdraw`'a döner (INV-4), geri çekme alanlarını temizler. Olay YAYMAZ.
  - `void Announcement.Expire()` — `Published` → `Expired`. Olay YAYMAZ (spec §9: "Bildirim üretmez").
  - `sealed record AnnouncementWithdrawnEvent(Guid SchoolId, Guid AnnouncementId, string Title, string Reason, DateTimeOffset OccurredAt) : IDomainEvent`

- [ ] **Step 1: Failing testleri yaz**

`AnnouncementLifecycleTests.cs`'e ekle (Görev 4'ün yardımcıları yeniden kullanılır):

```csharp
    // ═══════════ INV-4: Restore ÖNCEKİ statüye döner ═══════════

    private static readonly Guid _actor = Guid.NewGuid();

    [Fact]
    public void Should_StoreStatusBeforeWithdraw_When_PublishedIsWithdrawn()
    {
        var a = Published();

        a.Withdraw("Yanlis tarih yazilmis.", _actor, _now.AddHours(1));

        a.Status.Should().Be(AnnouncementStatus.Withdrawn);
        a.StatusBeforeWithdraw.Should().Be(AnnouncementStatus.Published);
        a.WithdrawReason.Should().Be("Yanlis tarih yazilmis.");
        a.WithdrawnAt.Should().Be(_now.AddHours(1));
        a.WithdrawnBy.Should().Be(_actor);
    }

    /// <summary>
    /// <b>INV-4'ün AYIRT EDİCİ testi.</b> Süresi dolmuş bir duyuru geri çekilip geri alınırsa
    /// <c>expired</c>'a döner — <c>published</c>'a DEĞİL. <c>Restore()</c> koşulsuz
    /// <c>published</c> yazsaydı yalnız bu test kırılırdı: <c>published</c>'tan geri çekilip
    /// geri alınan senaryo iki uygulamada da aynı sonucu verir ve hiçbir şey ayırt etmez.
    /// (MSW mock'u bugün tam da o yanlışı yapar — backend bağlayıcı olan taraftır.)
    /// </summary>
    [Fact]
    public void Should_ReturnToExpired_When_WithdrawnExpiredAnnouncementIsRestored()
    {
        var a = Published();
        a.Expire();
        a.Withdraw("Arsivden de kaldirilmali.", _actor, _now.AddDays(31));

        a.Restore();

        a.Status.Should().Be(AnnouncementStatus.Expired,
            "INV-4: geri alma ONCEKI statuye doner, kosulsuz published'a DEGIL");
    }

    [Fact]
    public void Should_ReturnToPublished_When_WithdrawnPublishedAnnouncementIsRestored()
    {
        var a = Published();
        a.Withdraw("Yanlislikla yayinlandi.", _actor, _now.AddHours(1));

        a.Restore();

        a.Status.Should().Be(AnnouncementStatus.Published);
    }

    /// <summary>
    /// Geri alma, geri çekmenin İZLERİNİ temizler: alıcı yüzeyinde "Geri çekme gerekçesi"
    /// notu duran bir duyuru yeniden yayında görünemez. Denetim izi ise kalıcıdır —
    /// temizlenen şey KAYDIN DURUMU, tarihçe değildir.
    /// </summary>
    [Fact]
    public void Should_ClearWithdrawTrace_When_Restored()
    {
        var a = Published();
        a.Withdraw("Gerekce metni.", _actor, _now.AddHours(1));

        a.Restore();

        a.WithdrawReason.Should().BeNull();
        a.WithdrawnAt.Should().BeNull();
        a.WithdrawnBy.Should().BeNull();
        a.StatusBeforeWithdraw.Should().BeNull("ikinci bir geri alma icin taban kalmamalidir");
    }

    [Fact]
    public void Should_RaiseWithdrawnEvent_When_WithdrawSucceeds()
    {
        var a = Published();

        a.Withdraw("Gerekce metni.", _actor, _now.AddHours(1));

        a.DomainEvents.OfType<AnnouncementWithdrawnEvent>().Should().ContainSingle()
            .Which.Reason.Should().Be("Gerekce metni.");
    }

    /// <summary>
    /// Geri alma bildirim ÜRETMEZ: alıcı duyuruyu zaten görmüştü, geri çekilme sırasında
    /// listeden düştü, geri gelmesi yeni bir olay değildir. Olay yayılsaydı
    /// <c>AnnouncementPublished</c> dedup anahtarıyla çakışır ya da ikinci bir "yeni duyuru"
    /// bildirimi üretirdi.
    /// </summary>
    [Fact]
    public void Should_NotRaiseAnyEvent_When_Restored()
    {
        var a = Published();
        a.Withdraw("Gerekce metni.", _actor, _now.AddHours(1));
        a.ClearDomainEvents();

        a.Restore();

        a.DomainEvents.Should().BeEmpty();
    }

    // ═══════════ Geri çekme statü kapısı ═══════════

    /// <summary>
    /// Yalnız OKUYUCUYA ULAŞMIŞ bir duyuru geri çekilebilir. Taslak/zamanlanmış/onay
    /// bekleyen henüz kimseye gitmemiştir; geri çekilmiş olan zaten geri çekilmiştir.
    /// </summary>
    [Theory]
    [InlineData(AnnouncementStatus.Draft)]
    [InlineData(AnnouncementStatus.Scheduled)]
    [InlineData(AnnouncementStatus.PendingApproval)]
    public void Should_Throw_When_WithdrawingUnpublishedAnnouncement(AnnouncementStatus status)
    {
        var a = Draft();
        if (status is AnnouncementStatus.Scheduled) a.MarkScheduled(_now.AddDays(1));
        if (status is AnnouncementStatus.PendingApproval) a.MarkPendingApproval();

        var act = () => a.Withdraw("Gerekce metni.", _actor, _now);

        act.Should().Throw<AnnouncementDomainException>()
            .Which.Code.Should().Be("Announcements.Withdraw.InvalidStatus");
    }

    [Fact]
    public void Should_Throw_When_WithdrawingAlreadyWithdrawnAnnouncement()
    {
        var a = Published();
        a.Withdraw("Ilk gerekce.", _actor, _now.AddHours(1));

        var act = () => a.Withdraw("Ikinci gerekce.", _actor, _now.AddHours(2));

        act.Should().Throw<AnnouncementDomainException>()
            .Which.Code.Should().Be("Announcements.Withdraw.InvalidStatus");
    }

    /// <summary>Gerekçe ZORUNLUDUR (spec §6 / DYR). Gerekçesiz geri çekme denetim izini sakatlar.</summary>
    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Should_Throw_When_WithdrawReasonIsBlank(string reason)
    {
        var a = Published();

        var act = () => a.Withdraw(reason, _actor, _now);

        act.Should().Throw<AnnouncementDomainException>()
            .Which.Code.Should().Be("Announcements.Withdraw.ReasonRequired");
    }

    /// <summary>
    /// <c>AnnouncementAuditEntry.Create</c> / <c>AnnouncementRecipient.Create</c> ile AYNI
    /// kapatma: aktörü bilinmeyen bir geri çekme, kimin kaldırdığı sorulamayan kalıcı bir
    /// kayıt üretirdi.
    /// </summary>
    [Fact]
    public void Should_Throw_When_WithdrawnByIsEmpty()
    {
        var a = Published();

        var act = () => a.Withdraw("Gerekce metni.", Guid.Empty, _now);

        act.Should().Throw<AnnouncementDomainException>()
            .Which.Code.Should().Be("Announcements.Withdraw.ActorRequired");
    }

    // ═══════════ Geri alma statü kapısı ═══════════

    [Fact]
    public void Should_Throw_When_RestoringNonWithdrawnAnnouncement()
    {
        var a = Published();

        var act = () => a.Restore();

        act.Should().Throw<AnnouncementDomainException>()
            .Which.Code.Should().Be("Announcements.Restore.InvalidStatus");
    }

    // ═══════════ Expire (INV-6 — job A3'te) ═══════════

    [Fact]
    public void Should_BecomeExpired_When_PublishedAnnouncementExpires()
    {
        var a = Published();

        a.Expire();

        a.Status.Should().Be(AnnouncementStatus.Expired);
    }

    /// <summary>Süre dolması bildirim üretmez (spec §9) — olay da yaymaz.</summary>
    [Fact]
    public void Should_NotRaiseAnyEvent_When_Expired()
    {
        var a = Published();

        a.Expire();

        a.DomainEvents.Should().BeEmpty();
    }

    [Theory]
    [InlineData(AnnouncementStatus.Draft)]
    [InlineData(AnnouncementStatus.Scheduled)]
    [InlineData(AnnouncementStatus.PendingApproval)]
    public void Should_Throw_When_ExpiringUnpublishedAnnouncement(AnnouncementStatus status)
    {
        var a = Draft();
        if (status is AnnouncementStatus.Scheduled) a.MarkScheduled(_now.AddDays(1));
        if (status is AnnouncementStatus.PendingApproval) a.MarkPendingApproval();

        var act = () => a.Expire();

        act.Should().Throw<AnnouncementDomainException>()
            .Which.Code.Should().Be("Announcements.Expire.InvalidStatus");
    }
```

- [ ] **Step 2: Testin kırıldığını doğrula**

Run: `dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~AnnouncementLifecycleTests"`
Expected: FAIL — derleme hatası (`Withdraw`/`Restore`/`Expire`/`AnnouncementWithdrawnEvent` yok).

- [ ] **Step 3: Olayı yaz**

`src/Oksis.Domain/Modules/Announcements/Events/AnnouncementWithdrawnEvent.cs`:

```csharp
using Oksis.Domain.Common;

namespace Oksis.Domain.Modules.Announcements.Events;

/// <summary>
/// Yayındaki duyuru geri çekildi. Alıcı listelerinden düşer (INV-7 — <c>withdrawn</c>
/// okuyucu yüzeyinde görünmez), ama kayıt arşivde "geri çekildi" olarak KALIR (INV-1).
///
/// <para>Tüketicisi yalnız YAYINLAYANA bildirim gönderir, alıcılara DEĞİL: ihtiyaç analizi
/// §16.3 — "sessizce kaybolsun; yanlış duyurunun izinin alıcıda kalması kafa karıştırır.
/// İz yönetim tarafında tutulur."</para>
/// </summary>
public sealed record AnnouncementWithdrawnEvent(
    Guid SchoolId,
    Guid AnnouncementId,
    string Title,
    string Reason,
    DateTimeOffset OccurredAt) : IDomainEvent;
```

- [ ] **Step 4: Üç metodu yaz**

`Announcement.cs` — `Amend(...)`'in altına:

```csharp
    /// <summary>
    /// Yayındaki (veya süresi dolmuş) duyuruyu alıcı listelerinden kaldırır. <b>SİLMEZ</b>
    /// (INV-1): kayıt arşivde "geri çekildi" olarak kalır ve denetim izi korunur.
    ///
    /// <para><b>INV-4:</b> <see cref="StatusBeforeWithdraw"/> saklanır, böylece
    /// <see cref="Restore"/> koşulsuz <c>published</c> yapmak zorunda kalmaz. Süresi dolmuş
    /// bir duyuru geri çekilip geri alınırsa <c>expired</c>'a döner.</para>
    /// </summary>
    public void Withdraw(string reason, Guid withdrawnBy, DateTimeOffset now)
    {
        if (Status is not (AnnouncementStatus.Published or AnnouncementStatus.Expired))
        {
            throw new AnnouncementDomainException(
                "Announcements.Withdraw.InvalidStatus",
                "Yalnız yayında olan veya süresi dolmuş duyuru geri çekilebilir.");
        }

        var normalizedReason = (reason ?? string.Empty).Trim();
        if (normalizedReason.Length == 0)
        {
            throw new AnnouncementDomainException(
                "Announcements.Withdraw.ReasonRequired", "Geri çekme gerekçesi zorunludur.");
        }

        // AnnouncementAuditEntry.Create / AnnouncementRecipient.Create ile AYNI kapatma:
        // aktörü bilinmeyen bir geri çekme, "kim kaldırdı" sorusu sorulamayan kalıcı bir
        // kayıt üretirdi.
        if (withdrawnBy == Guid.Empty)
        {
            throw new AnnouncementDomainException(
                "Announcements.Withdraw.ActorRequired", "Geri çeken kişi zorunludur.");
        }

        StatusBeforeWithdraw = Status;
        Status = AnnouncementStatus.Withdrawn;
        WithdrawReason = normalizedReason;
        WithdrawnAt = now;
        WithdrawnBy = withdrawnBy;

        Raise(new AnnouncementWithdrawnEvent(SchoolId, Id, Title, normalizedReason, DateTimeOffset.UtcNow));
    }

    /// <summary>
    /// Geri çekmeyi geri alır (toast'taki "Geri al" eylemi).
    ///
    /// <para><b>INV-4 — koşulsuz <c>published</c> YAPMAZ.</b> Geri çekmeden ÖNCEKİ statüye
    /// döner: süresi dolmuş bir duyuru <c>expired</c>'a, yayındaki <c>published</c>'a.
    /// (MSW mock'u bugün koşulsuz <c>published</c> yazar — backend bağlayıcı olan taraftır;
    /// B fazında istemci gerçek uca bağlandığında doğru davranış sunucudan gelir.)</para>
    ///
    /// <para>Olay YAYMAZ: alıcı duyuruyu zaten görmüştü ve geri çekilme sırasında listeden
    /// düştü; geri gelmesi yeni bir haber değildir. Denetim izi çağıran tarafından yazılır.</para>
    /// </summary>
    public void Restore()
    {
        if (Status is not AnnouncementStatus.Withdrawn || StatusBeforeWithdraw is not { } previous)
        {
            throw new AnnouncementDomainException(
                "Announcements.Restore.InvalidStatus",
                "Yalnız geri çekilmiş duyuru geri alınabilir.");
        }

        Status = previous;
        StatusBeforeWithdraw = null;
        WithdrawReason = null;
        WithdrawnAt = null;
        WithdrawnBy = null;
    }

    /// <summary>
    /// Geçerlilik süresi dolan duyuruyu <c>expired</c> yapar (INV-6).
    ///
    /// <para>Bu metodu çağıran <c>ExpireAnnouncementsJob</c> <b>A3'ün kapsamındadır</b>;
    /// metot A2'de doğar çünkü INV-4'ün ayırt edici testi (süresi dolmuş duyuruyu geri çekip
    /// geri almak) arşiv durumuna GERÇEK bir yoldan ulaşmayı gerektirir — test-only
    /// <c>ForceStatusAsync</c> kestirmesiyle kurulan sahne o kuralı kanıtlayamaz.</para>
    ///
    /// <para>Bildirim ÜRETMEZ (spec §9) — olay da yaymaz.</para>
    /// </summary>
    public void Expire()
    {
        if (Status is not AnnouncementStatus.Published)
        {
            throw new AnnouncementDomainException(
                "Announcements.Expire.InvalidStatus",
                "Yalnız yayındaki duyurunun süresi dolabilir.");
        }

        Status = AnnouncementStatus.Expired;
    }
```

> **`Restore()` ve `Expire()` saat parametresi ALMAZ — `Withdraw(reason, withdrawnBy, now)` alır.**
> Ayrım keyfi değil: `Withdraw` gerçekten `WithdrawnAt = now` yazar; diğer ikisi hiçbir iş
> zamanı kaydetmez (`Restore` alanları temizler, `Expire` yalnız statü değiştirir). Okunmayan
> bir parametre, metodun bir zaman kaydettiği yalanını söyler — ve bu depoda
> `TreatWarningsAsErrors` + IDE0060 onu doğru şekilde **build hatasına** çevirir.
>
> Bu, planın ilk sürümünün hatasıydı ve Görev 4'te ölçülerek düzeltildi (`Amend` de aynı
> sebeple saatini kaybetti). A3 ileride `ExpiredAt` isterse parametre o zaman, kendi testiyle
> eklenir — bugünden konmuş boş bir parametre o ihtiyacı karşılamaz, yalnız analizörü susturur.

- [ ] **Step 5: Testin geçtiğini doğrula**

Run: `dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~AnnouncementLifecycleTests"`
Expected: PASS (~26 test).

- [ ] **Step 6: INV-4 testinin gerçekten ayırt ettiğini KANITLA**

`Restore()`'u geçici olarak bozmadan **testin mutasyona duyarlı olduğunu** göster:

1. `Restore()` gövdesindeki `Status = previous;` satırını `Status = AnnouncementStatus.Published;` yap.
2. Run: `dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~AnnouncementLifecycleTests"`
3. Expected: **TAM OLARAK BİR** test kırılır: `Should_ReturnToExpired_When_WithdrawnExpiredAnnouncementIsRestored`. `Should_ReturnToPublished_...` yeşil kalır (doğru — o senaryo iki uygulamada da aynı sonucu verir).
4. `git checkout -- src/Oksis.Domain/Modules/Announcements/Entities/Announcement.cs`
5. Run: tekrar → PASS.

Kırılan test sayısı 1 değilse **DUR ve bildir** — testler birbirini gölgeliyor demektir. Bu mutasyon sonucunu ledger'a yaz.

> Bu, "üretim kodunu değiştirme" kuralının **istisnası değildir**: kural, bir testin kırıldığını *göstermek için* üretim kodunu kalıcı olarak değiştirmeyi yasaklar. Burada yapılan, geri alınan ve sonucu raporlanan bir mutasyon denetimidir ve A1'de Görev 10'un tekrar ürettiği kalıptır.

- [ ] **Step 7: Tüm domain süiti**

Run: `dotnet build && dotnet test tests/Oksis.Domain.UnitTests`
Expected: PASS. `AnnouncementHardDeleteGuardTests`'in (INV-1 yansıma testi) hâlâ yeşil olduğunu **özellikle** doğrula — üç yeni metot da `Delete`/`IsDeleted` adını taşımaz.

- [ ] **Step 8: Commit**

```bash
cd /Users/farukkaya/Repositories/oksis-api
git add src/Oksis.Domain/Modules/Announcements/Entities/Announcement.cs \
        src/Oksis.Domain/Modules/Announcements/Events/AnnouncementWithdrawnEvent.cs \
        tests/Oksis.Domain.UnitTests/Modules/Announcements/AnnouncementLifecycleTests.cs
git commit -m "feat(core): geri cekme geri alma ve sure dolmasi domain metotlari eklendi

INV-4: Restore() kosulsuz published YAPMAZ, StatusBeforeWithdraw'a doner. Ayirt
edici test suresi dolmus bir duyuruyu geri cekip geri alir -- published'tan geri
cekilen senaryo iki uygulamada da ayni sonucu verdigi icin hicbir sey kanitlamaz.
Expire() A2'de dogar, onu cagiran job A3'tedir."
```

---

### Task 6: Ortak altyapı — `NotificationKind` 17–21, `AnnouncementAuditWriter`, `AnnouncementLifecycleGuard`

Görev 7–15'in **tamamının** ihtiyaç duyduğu üç parça. Uç yok; tek başına gözden geçirilebilir çünkü üçü de kendi testini taşır ve üçü de yanlış olursa sonraki beş görevi birden zehirler.

**Neden `AnnouncementLifecycleGuard`.** A2'nin beş yazma ucunun tamamı aynı üç adımı yapar: (1) tenant çöz, (2) `Person`'ı çöz — yoksa Forbidden, (3) kaydı bul, (4) "kendi kaydı mı yoksa yönetim mi" sorusunu sor. A1'in nihai incelemesinin BLOCKER'ı tam olarak bu adımların beş handler'da tutarsız uygulanmasıydı ve *"yalnız görev-başına inceleme bunu göremezdi"* diye kaydedildi. Beşinci kez elle yazmak aynı hatayı davet eder.

**Neden `AnnouncementAuditWriter`.** Denetim izi beş yerde yazılacak ve her yerde aynı iki şeyi çözecek: aktörün gerçek adı ve `Guid.Empty` yasağı. A1'de `ResolveRealNameAsync` tek handler'da üç kez çağrılıyordu (kayıtlı minor).

**Files:**
- Modify: `src/Oksis.Domain/Modules/Notifications/Enums/NotificationKind.cs`
- Create: `src/Oksis.Application/Modules/Announcements/Common/AnnouncementAuditWriter.cs`
- Create: `src/Oksis.Application/Modules/Announcements/Common/AnnouncementLifecycleGuard.cs`
- Test: `tests/Oksis.Application.UnitTests/Modules/Announcements/NotificationKindContinuityTests.cs`
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/AnnouncementAuditWriterTests.cs`

**Interfaces:**
- Consumes: `IApplicationDbContext` (`Persons`, `Announcements`, `AnnouncementAuditEntries`), `ITenantContext.CurrentSchoolId`, `ICurrentUser.Id`, `IPermissionReader`, `AnnouncementCallerResolver.{ResolveMyPersonIdAsync, IsManagerAsync}`, `AnnouncementAuditEntry.Create(...)`, `Announcement`
- Produces:
  - `NotificationKind.AnnouncementWithdrawn = 17`, `AnnouncementAmended = 18`, `AnnouncementSubmittedForApproval = 19`, `AnnouncementApproved = 20`, `AnnouncementRejected = 21`
  - `sealed record AnnouncementCaller(Guid PersonId, string DisplayName, bool IsManager)`
  - `static Task<Result<AnnouncementCaller>> AnnouncementLifecycleGuard.ResolveCallerAsync(IApplicationDbContext db, ICurrentUser currentUser, IPermissionReader permissionReader, CancellationToken ct)`
  - `static bool AnnouncementLifecycleGuard.CanActOn(Announcement announcement, AnnouncementCaller caller)`
  - `static void AnnouncementAuditWriter.Write(IApplicationDbContext db, Guid schoolId, Guid announcementId, AnnouncementCaller caller, string action, DateTimeOffset at, string? field = null, string? tag = null, string? tone = null)`

- [ ] **Step 1: `NotificationKind` süreklilik testi yaz**

`tests/Oksis.Application.UnitTests/Modules/Announcements/NotificationKindContinuityTests.cs`:

```csharp
using FluentAssertions;
using Oksis.Domain.Modules.Notifications.Enums;
using Xunit;

namespace Oksis.Application.UnitTests.Modules.Announcements;

/// <summary>
/// <see cref="NotificationKind"/> değerleri KALICIDIR: <c>notification_delivery_logs</c>
/// tablosunda int olarak saklanırlar. Araya değer eklemek geçmiş kayıtların anlamını
/// sessizce değiştirir — bu test A1'in "17'den devam et, ARAYA EKLEME" kararını kilitler.
/// </summary>
public sealed class NotificationKindContinuityTests
{
    [Theory]
    [InlineData(NotificationKind.AnnouncementPublished, 16)]
    [InlineData(NotificationKind.AnnouncementWithdrawn, 17)]
    [InlineData(NotificationKind.AnnouncementAmended, 18)]
    [InlineData(NotificationKind.AnnouncementSubmittedForApproval, 19)]
    [InlineData(NotificationKind.AnnouncementApproved, 20)]
    [InlineData(NotificationKind.AnnouncementRejected, 21)]
    public void Should_KeepStableWireValue_When_KindIsAnnouncementRelated(
        NotificationKind kind, int expected)
    {
        ((int)kind).Should().Be(expected);
    }

    /// <summary>
    /// A1'den önce gelen 15 değerin HİÇBİRİ kaymamalıdır. Tek tek sabitlemek yerine
    /// sınır sabitlenir: 1..15 aralığındaki değerler dolu ve tekil kalmalıdır.
    /// </summary>
    [Fact]
    public void Should_NotRenumberLegacyKinds_When_NewKindsAreAppended()
    {
        var values = Enum.GetValues<NotificationKind>().Select(v => (int)v).ToList();

        values.Should().OnlyHaveUniqueItems();
        values.Should().Contain(Enumerable.Range(1, 15),
            "A1 oncesi 15 deger yerinde kalmalidir");
        values.Max().Should().Be(21, "yeni degerler yalnizca SONA eklenir");
    }
}
```

- [ ] **Step 2: Testin kırıldığını doğrula**

Run: `dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~NotificationKindContinuityTests"`
Expected: FAIL — derleme hatası (`AnnouncementWithdrawn` vb. yok).

- [ ] **Step 3: `NotificationKind`'a beş değer ekle**

`src/Oksis.Domain/Modules/Notifications/Enums/NotificationKind.cs` — `AnnouncementPublished = 16,`'nın altına:

```csharp
    /// <summary>
    /// Duyuru geri çekildi (A2). Bildirim YALNIZ YAYINLAYANA gider, alıcılara DEĞİL —
    /// ihtiyaç analizi §16.3: "sessizce kaybolsun; yanlış duyurunun izinin alıcıda kalması
    /// kafa karıştırır. İz yönetim tarafında tutulur." Öğretmenin duyurusunu yönetim geri
    /// çekmişse öğretmen bunu öğrenmelidir; alıcı ise duyuruyu hiç görmemiş gibi olmalıdır.
    /// </summary>
    AnnouncementWithdrawn = 17,

    /// <summary>
    /// Duyuru düzeltildi (A2). SESSİZ düzeltmede (<c>silentAmendment</c>) bu bildirim
    /// ÜRETİLMEZ — sözlük gereği alıcıya haber gitmez. Alıcılara gider (yayınlayana değil):
    /// düzeltme, okunan metnin anlamının değiştiği anlamına gelir.
    /// </summary>
    AnnouncementAmended = 18,

    /// <summary>
    /// Duyuru onay kuyruğuna düştü (A2, INV-5 — eşikli moderasyon). YÖNETİME gider:
    /// onay kuyruğunda bekleyen iş vardır.
    /// </summary>
    AnnouncementSubmittedForApproval = 19,

    /// <summary>Duyuru onaylandı ve yayınlandı (A2). YAYINLAYAN ÖĞRETMENE gider.</summary>
    AnnouncementApproved = 20,

    /// <summary>
    /// Duyuru reddedildi ve taslağa döndü (A2). YAYINLAYAN ÖĞRETMENE gider ve gövdesinde
    /// RED GEREKÇESİNİ taşır — gerekçe <c>Announcement.WithdrawReason</c>'a YAZILMAZ
    /// (o alan iki uygulamada da "Geri çekme gerekçesi" olarak etiketlidir); kalıcı kaydı
    /// denetim izidir.
    /// </summary>
    AnnouncementRejected = 21,
```

> A3'ün `AnnouncementScheduledExecuted`'ı **buraya eklenmez** — 22 olarak A3'ün job görevinde doğar. Bugün eklemek, kullanılmayan bir değeri kalıcı hâle getirirdi.

- [ ] **Step 4: `NotificationKind` testinin geçtiğini doğrula**

Run: `dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~NotificationKindContinuityTests"`
Expected: PASS (7 test).

- [ ] **Step 5: `AnnouncementLifecycleGuard` için failing test yaz**

`tests/Oksis.Infrastructure.IntegrationTests/Persistence/AnnouncementAuditWriterTests.cs`:

```csharp
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Modules.Announcements.Common;
using Oksis.Infrastructure.IntegrationTests.Fixtures;
using Xunit;

namespace Oksis.Infrastructure.IntegrationTests.Persistence;

/// <summary>
/// A2 Görev 6 — beş yazma ucunun paylaştığı iki yardımcı. Bunlar tek başına küçük ama
/// hatalı olurlarsa Görev 7–15'in tamamını birden zehirlerler; A1'in nihai incelemesinin
/// BLOCKER'ı tam olarak bu adımların beş handler'da BAĞIMSIZ ve tutarsız uygulanmasıydı.
/// </summary>
[Collection(DatabaseCollection.Name)]
public sealed class AnnouncementAuditWriterTests : IAsyncLifetime
{
    private readonly DatabaseFixture _database;

    public AnnouncementAuditWriterTests(DatabaseFixture database) => _database = database;

    public async Task InitializeAsync() => await _database.EnsureDatabaseCreatedAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    /// <summary>
    /// Yönetim çağıranı: Person çözülür, izin okunur, <c>IsManager</c> true döner.
    /// <b>İzolasyon:</b> aşağıdaki öğretmen testiyle AYNI kod yolundan geçer ve YALNIZ
    /// izin kümesi farklıdır — <c>IsManagerAsync</c> çağrısı silinse ikisinden biri kırılır.
    /// </summary>
    [Fact]
    public async Task Should_ResolveManagerCaller_When_CallerHasApprovePermission()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync(_database);

        var caller = await fixture.ResolveCallerAsync(fixture.AdminAccountId);

        caller.PersonId.Should().Be(fixture.AdminPersonId);
        caller.IsManager.Should().BeTrue();
        caller.DisplayName.Should().Be("Okul Müdürü");
    }

    [Fact]
    public async Task Should_ResolveNonManagerCaller_When_CallerLacksApprovePermission()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync(_database);

        var caller = await fixture.ResolveCallerAsync(fixture.TeacherAccountId);

        caller.PersonId.Should().Be(fixture.TeacherPersonId);
        caller.IsManager.Should().BeFalse();
        caller.DisplayName.Should().Be("Elif Öğretmen");
    }

    /// <summary>
    /// A1 nihai incelemesinin BLOCKER'ının kapatılması: Person'ı olmayan çağıran —
    /// izinleri TAM olsa bile — hiçbir yaşam döngüsü eylemine giremez.
    /// <c>PersonlessAccountId</c> izin açısından <c>AdminAccountId</c> ile AYNIDIR, tek farkı
    /// bağlı Person'ının olmamasıdır; dolayısıyla Forbidden'ın TEK açıklaması budur.
    /// </summary>
    [Fact]
    public async Task Should_Fail_When_CallerHasNoLinkedPerson()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync(_database);

        var act = async () => await fixture.ResolveCallerAsync(fixture.PersonlessAccountId);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Error.Forbidden*");
    }

    /// <summary>
    /// Denetim izi satırı gerçek aktör adıyla yazılır ve "Bilinmeyen" gibi bir yer tutucuya
    /// ASLA düşmez — <c>AnnouncementAuditEntry.Create</c>'in <c>Guid.Empty</c> guard'ı zaten
    /// kalıcı olarak kapatır, bu test yazıcının o guard'a hiç girmediğini doğrular.
    /// </summary>
    [Fact]
    public async Task Should_WriteAuditRowWithResolvedActorName_When_WriteIsCalled()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync(_database);
        var created = await fixture.CreateAnnouncementAsync(
            "Servis", "Servisler erken kalkacaktir.", [("all", "all", "student")], asDraft: false);

        await fixture.WriteAuditAsync(
            fixture.AdminAccountId, Guid.Parse(created.Id),
            action: "duyuruyu geri cekti", field: "Durum: Yayında → Geri çekildi", tone: "danger");

        var rows = await fixture.Db.AnnouncementAuditEntries.AsNoTracking()
            .Where(e => e.AnnouncementId == Guid.Parse(created.Id))
            .OrderBy(e => e.At)
            .ToListAsync();

        rows.Should().HaveCount(2, "yayin izi + geri cekme izi");
        rows[1].ActorName.Should().Be("Okul Müdürü");
        rows[1].Action.Should().Be("duyuruyu geri cekti");
        rows[1].Field.Should().Be("Durum: Yayında → Geri çekildi");
        rows[1].Tone.Should().Be("danger");
        rows[1].ActorId.Should().Be(fixture.AdminPersonId);
    }
}
```

- [ ] **Step 6: Fixture'a iki yardımcı ekle**

`tests/Oksis.Infrastructure.IntegrationTests/Persistence/AnnouncementAudienceFixture.cs`'in sonuna (`ForceChildAsync`'ten sonra, `FakeCurrentUser` sınıfından önce):

```csharp
    /// <summary>
    /// Görev 6 — <see cref="AnnouncementLifecycleGuard.ResolveCallerAsync"/>'i VERİLEN hesap
    /// kimliğiyle çalıştırır. Diğer Async yardımcılarıyla AYNI kalıp (MediatR pipeline devre
    /// dışı); hata durumunda <see cref="InvalidOperationException"/> fırlatır.
    /// </summary>
    public async Task<AnnouncementCaller> ResolveCallerAsync(Guid asAccountId)
    {
        var currentUser = new FakeCurrentUser(asAccountId);
        var permissionReader = new FakePermissionReader(PermissionsFor(asAccountId));

        var result = await AnnouncementLifecycleGuard.ResolveCallerAsync(
            _context, currentUser, permissionReader, CancellationToken.None);

        if (result.IsFailure)
        {
            throw new InvalidOperationException(
                $"ResolveCallerAsync başarısız: {result.Error.Code} — {result.Error.Message}");
        }

        return result.Value!;
    }

    /// <summary>Görev 6 — denetim izi yazıcısını sahne üzerinde çalıştırır.</summary>
    public async Task WriteAuditAsync(
        Guid asAccountId, Guid announcementId, string action,
        string? field = null, string? tag = null, string? tone = null)
    {
        var caller = await ResolveCallerAsync(asAccountId);

        AnnouncementAuditWriter.Write(
            _context, AdminScope.SchoolId, announcementId, caller,
            action, DateTimeOffset.UtcNow.AddSeconds(1), field, tag, tone);

        await _context.SaveChangesAsync();
    }
```

`using Oksis.Application.Modules.Announcements.Common;` zaten dosyanın başında var.

> **Paylaşılan fixture'a dokunuldu.** Bu görevin doğrulama adımı **TÜM** integration projesini çalıştırmayı zorunlu kılar (Step 10). Eklenen iki metot hiçbir satır eklemez, yalnız var olan sahneyi okur — yine de A1'in iki kez ısırdığı yerdir.

- [ ] **Step 7: Testin kırıldığını doğrula**

Run: `dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~AnnouncementAuditWriterTests"`
Expected: FAIL — derleme hatası (`AnnouncementLifecycleGuard`, `AnnouncementCaller`, `AnnouncementAuditWriter` yok).

- [ ] **Step 8: `AnnouncementLifecycleGuard`'ı yaz**

`src/Oksis.Application/Modules/Announcements/Common/AnnouncementLifecycleGuard.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Domain.Modules.Announcements.Entities;
using Oksis.Shared;

namespace Oksis.Application.Modules.Announcements.Common;

/// <summary>
/// Yaşam döngüsü eylemini yapan kişi. <see cref="DisplayName"/> denetim izine yazılır ve
/// çözüm anında dondurulur — kişi sonradan okuldan ayrılsa bile iz okunur kalır.
/// </summary>
public sealed record AnnouncementCaller(Guid PersonId, string DisplayName, bool IsManager);

/// <summary>
/// A2'nin beş yazma ucunun paylaştığı kapı.
///
/// <para><b>Neden ortak:</b> A1'in nihai incelemesinin BLOCKER'ı, aynı üç adımın
/// (Person çöz → yoksa Forbidden → yönetim mi) beş handler'da BAĞIMSIZ yazılmasıydı;
/// beşinden ikisi doğru, üçü yanlıştı ve çelişki ancak beşi yan yana konunca görüldü.
/// İnceleme kaydı bunu açıkça <i>"yalnız görev-başına inceleme bunu göremezdi"</i> diye
/// tutar. A2 aynı adımı beş kez daha yazmaz.</para>
///
/// <para><b>Rol SORULMAZ.</b> <c>ICurrentUser.Roles</c> bu depoda HER ZAMAN boştur ve
/// <c>IsInRole(...)</c> ölü koddur. "Yönetim mi" sorusu <c>announcements.approve</c>
/// izninden sorulur (<see cref="AnnouncementCallerResolver.IsManagerAsync"/>).</para>
/// </summary>
public static class AnnouncementLifecycleGuard
{
    /// <summary>
    /// Çağıranın domain kimliğini ve yönetim yetkisini TEK seferde çözer.
    ///
    /// <para><b>Person çözülemezse Forbidden.</b> Bu bir kolaylık değil güvenlik sınırıdır:
    /// giriş anında Person'ı olan bir hesabın Person'ı silinme/nakil sonrası tenant
    /// filtresinin arkasında kaybolabilir, ama token geçerli ve izinler 30 dk önbellekte
    /// kalır. Böyle bir çağıranın "daraltma yok" sayılması, ona yönetim ayrıcalığı verirdi.</para>
    /// </summary>
    public static async Task<Result<AnnouncementCaller>> ResolveCallerAsync(
        IApplicationDbContext db,
        ICurrentUser currentUser,
        IPermissionReader permissionReader,
        CancellationToken ct)
    {
        var person = await db.Persons.AsNoTracking()
            .Where(p => p.LinkedAccountId == currentUser.Id)
            .Select(p => new { p.Id, Name = p.Name.First + " " + p.Name.Last })
            .FirstOrDefaultAsync(ct);

        if (person is null)
        {
            return Result<AnnouncementCaller>.Forbidden();
        }

        var isManager = await AnnouncementCallerResolver.IsManagerAsync(permissionReader, ct);

        return Result<AnnouncementCaller>.Success(
            new AnnouncementCaller(person.Id, person.Name, isManager));
    }

    /// <summary>
    /// Çağıran bu duyuru üzerinde yaşam döngüsü eylemi yapabilir mi?
    ///
    /// <para>İzin anahtarı (<c>announcements.update</c> / <c>.withdraw</c>) ucu AÇAR; bu kapı
    /// HANGİ kayda dokunabileceğini söyler. Öğretmen yalnız kendi duyurusuna, yönetim hepsine.
    /// İki katman birbirinin yerine geçmez — spec §4'ün "izin rolü kapatır, rol içi daraltmayı
    /// kapatmaz" notu budur.</para>
    /// </summary>
    public static bool CanActOn(Announcement announcement, AnnouncementCaller caller) =>
        caller.IsManager || announcement.PublisherId == caller.PersonId;
}
```

- [ ] **Step 9: `AnnouncementAuditWriter`'ı yaz**

`src/Oksis.Application/Modules/Announcements/Common/AnnouncementAuditWriter.cs`:

```csharp
using Oksis.Application.Common.Abstractions;
using Oksis.Domain.Modules.Announcements.Entities;

namespace Oksis.Application.Modules.Announcements.Common;

/// <summary>
/// Denetim izi satırlarının TEK yazıcısı.
///
/// <para><b>Neden ortak:</b> A2 beş yerde iz yazar ve her yerde aynı iki şeyi çözer —
/// aktörün dondurulmuş adı ve <c>Guid.Empty</c> yasağı. A1'de aktör adı tek handler'ın
/// içinde üç kez sorgulanıyordu (kayıtlı minor); <see cref="AnnouncementCaller"/> onu bir
/// kez çözer, bu yazıcı yalnız kullanır — <b>ek sorgu YAPMAZ.</b></para>
///
/// <para><c>SaveChangesAsync</c> ÇAĞIRMAZ: iz, tetikleyen eylemle AYNI transaction'da
/// yazılmalıdır. Eylem geri alınırsa iz de geri alınır — "olmayan bir geri çekmenin izi"
/// denetim izinin anlamını çökertirdi.</para>
/// </summary>
public static class AnnouncementAuditWriter
{
    public static void Write(
        IApplicationDbContext db,
        Guid schoolId,
        Guid announcementId,
        AnnouncementCaller caller,
        string action,
        DateTimeOffset at,
        string? field = null,
        string? tag = null,
        string? tone = null)
    {
        db.AnnouncementAuditEntries.Add(AnnouncementAuditEntry.Create(
            schoolId, announcementId, caller.PersonId, caller.DisplayName,
            action, at, field, tag, tone));
    }
}
```

- [ ] **Step 10: Testin geçtiğini doğrula ve TÜM integration projesini çalıştır**

```bash
dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~AnnouncementAuditWriterTests"
dotnet test tests/Oksis.Infrastructure.IntegrationTests
```

Expected: ilki 4 PASS; ikincisi Görev 1 Step 6'da not edilen tabanla **aynı** hata sayısı (yalnız Documents/S3). Paylaşılan fixture'a dokunuldu — `AudienceResolverTests`'in sayılarının değişmediğini **özellikle** doğrula.

- [ ] **Step 11: Uygulama süiti**

Run: `dotnet test tests/Oksis.Application.UnitTests`
Expected: PASS. `AnnouncementPermissionSurfaceTests` (Görev 3) hâlâ 6 istek bulmalıdır — bu görev istek eklemedi.

- [ ] **Step 12: Commit**

```bash
cd /Users/farukkaya/Repositories/oksis-api
git add src/Oksis.Domain/Modules/Notifications/Enums/NotificationKind.cs \
        src/Oksis.Application/Modules/Announcements/Common/AnnouncementLifecycleGuard.cs \
        src/Oksis.Application/Modules/Announcements/Common/AnnouncementAuditWriter.cs \
        tests/
git commit -m "feat(api): duyuru yasam dongusu ortak altyapisi eklendi

NotificationKind 17-21 (araya eklenmedi, sona eklendi ve bir sureklilik testiyle
kilitlendi), AnnouncementLifecycleGuard (Person cozumleme + yonetim mi + kendi
kaydi mi -- A1 nihai incelemesinin BLOCKER'i bu adimin bes handler'da bagimsiz
yazilmasiydi) ve AnnouncementAuditWriter (tek yazici, ek sorgu yok, kendi
SaveChanges'ini cagirmaz)."
```

---

> **Görev 7'den itibaren `2026-08-03-duyurular-a2-yasam-dongusu-2.md`'ye devam et.**
