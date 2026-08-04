# Duyurular — Uçtan Uca Teslim Tasarımı

| | |
|---|---|
| **Tarih** | 2026-08-02 |
| **Kapsam** | `oksis-api` (Announcements modülü) · `oksis-ui` (mock→gerçek geçiş, web + mobil) · `oksis` (kanonik dokümanlar) |
| **Girdi belgeleri** | `duyurular_ihtiyac_analizi.docx` v1.0 · `oksis-api/docs/analysis/duyuru_sistemi_analiz.docx` v1.1 |
| **Durum** | Onaylandı — uygulama planı bekliyor |

---

## 1. Problem ve başlangıç noktası

Duyuru frontend'i mock-first kalıbıyla **yazılmış** durumdadır; backend **hiç yoktur**. 2026-08-02 itibarıyla depolardan doğrulanan durum:

| Katman | Durum |
|---|---|
| `packages/core/src/announcements` | Hazır — types + constants + logic + schemas, 20 birim testi |
| `packages/api/src/announcements` | Hazır (mock-first) — `contract.ts` (saf DTO) + `paths.ts` (drift bekçisi) + `endpoints.ts` + 18 hook |
| `packages/api-mocks/src/announcements` | Hazır — 18 MSW handler |
| `apps/web/features/announcements` | Hazır — 16 dosya (yönetici + öğretmen) |
| `apps/mobile/src/features/announcements` | Hazır — 18 bileşen + 10 rota (veli/öğrenci gelen kutusu dâhil) |
| `oksis-api` Announcements modülü | **%0** — `src/Oksis.Application/Modules/Announcements/` yalnız `.gitkeep` içerir |
| `packages/api/src/generated/schema.ts` | Duyuru uçlarını **tanımıyor** (`grep announcements` → 0) |

Görev: bu sözleşmeyi karşılayan backend'i yazmak ve iki uygulamayı mock'tan gerçek uca geçirmek.

---

## 2. Kilitlenmiş kapsam kararları

| # | Karar | Gerekçe |
|---|---|---|
| K-1 | **Uçtan uca**: `oksis-api` modülü + `oksis-ui` geçişi | Kullanıcı kararı |
| K-2 | **In-app only teslim** — push/e-posta zinciri kapsam dışı | Teknik analiz §9.3-1 önerisi; iki modülün birbirine kilitlenmemesi |
| K-3 | **Ek dosya dâhil** — Documents modülüne bağlanır | DYR-F-10 "Zorunlu" |
| K-4 | `oksis/` dokümanları **tam** güncellenir — 9 spec dokümanı dâhil | Kullanıcı kararı |
| K-5 | Yapım yaklaşımı: **dikey dilimler, her dilim TDD'li** | Riskin CRUD'da değil kurallarda olması |
| K-6 | Şablon CRUD **A'ya dâhil** (3 yeni uç) | DYR-F-13; donmuş 17 uçta şablon salt okunur |
| K-7 | Web veli/öğrenci okuma yüzü **kapsam dışı** | Tasarım çizilmemiş; ekran icat etmek handoff kurallarına aykırı |

### Teslim sırası

```
A  oksis-api Announcements modülü      (9 dilim → A1 ✅ / A2 ⬜ / A3 ⬜)
   ↓
B  Mock → gerçek geçiş                  (A'nın ÜÇÜ de bitince, tek seferde)
   ↓
C  Frontend boşlukları
   ‖
D  Push/e-posta teslim zinciri          KAPSAM DIŞI
```

**A üç plana bölünmüştür** ve B, üçünün de tamamlanmasını bekler:

| | Dilimler | Kapsam | Durum |
|---|---|---|---|
| **A1** | 0–3 | Domain, şema, izinler, DTO, alıcı çözümleme, yayın, envanter, detay, gelen kutusu, okundu | ✅ 2026-08-03, `oksis-api/master` |
| **A2** | 4–5 | `PUT /{id}` düzeltme, `:withdraw`, `:restore`, `/audit-trail`, `GET\|PUT /moderation`, `/approvals`, `:approve`, `:reject` | ⬜ |
| **A3** | 6–8 | Şablon CRUD, `/publishers`, `/delivery-report`, Hangfire job'ları, ek dosya (Documents) | ⬜ |

**B neden A'nın tamamını bekler.** `packages/api/src/announcements/paths.ts` **15 yol / 17 operasyon** ilan eder. A1 bunların **5 yol / 6 operasyonunu** yayınladı; kalan 11 operasyon A2 ve A3'ün kapsamındadır. `contract.ts` + `paths.ts` bugün silinirse 11 endpoint fonksiyonu ve 13 hook tipsiz kalır ve iki app'in typecheck'i kırılır.

> **DÜZELTME (2026-08-03).** Bu belgenin ilk sürümü "`paths.ts` tek parça olduğu için bölünemez, codegen ancak uçların hepsi yayındayken çalıştırılabilir" diyordu. **Teknik olarak yanlıştı** — augmentation'dan yalnız yayındaki yolları çıkarmak mümkündür, çünkü interface merge çakışması yalnız generated şemada karşılığı oluşan yollarda doğar; kalan yollar drift bekçisi olarak yerinde durabilir.
>
> Doğru gerekçe bir kısıt değil, bir **tercihtir**: yarısı generated yarısı elle yazılmış bir sözleşmeyle yaşamak, drift bekçisinin engellemek için var olduğu belirsizliği geri getirir — hangi tipin hangi kaynaktan geldiği okuma anında belirsizleşir ve kısmi geçiş her A dilimi için yeni bir eşitleme turu doğurur. Bölünebilir; **bölünmemelidir**. Zorlayıcı bir sebep çıkarsa (ör. A2/A3 uzarsa ve frontend'in yayındaki uçlara erken bağlanması gerekirse) bu bir seçenektir, sürpriz değil.

---

## 3. Domain modeli

Aggregate sınırı duyurunun kendisidir. `AnnouncementTarget`, `AnnouncementRecipient` ve `AnnouncementAuditEntry` duyuruya aittir ve onunla yaşar. `AnnouncementTemplate` ayrı aggregate'tir.

### 3.1 Tablolar (5)

Hepsi `TenantEntity` — `IHasTenant` + global query filter + `TenantSaveChangesInterceptor`.

| Tablo | Rol |
|---|---|
| `announcements` | Aggregate root |
| `announcement_targets` | Hedef katmanları — yayın anında donar |
| `announcement_recipients` | Alıcı satırları — yayın anında materyalize edilir |
| `announcement_audit_entries` | Denetim izi — değiştirilemez |
| `announcement_templates` | Şablonlar (ayrı aggregate) |

`Announcement` alanları teknik analiz §2.1'den aynen alınır. `is_deleted` **kullanılmaz** (INV-1).

### 3.2 Enum'lar (6)

`AnnouncementStatus` (7 değer, `deleted` YOK) · `AnnouncementType` · `AnnouncementReach` · `DeliveryChannel` · `AnnouncementModeration` · `AudienceDimension`.

> **Üç kavram, üç ayrı alan.** `Reach` erişimi, `Type` imzayı, `AnnouncementScope` ise liste parametresini söyler. Kanıt: 11. sınıf velilerine Okul Müdürlüğü imzasıyla giden duyuru `{ Reach = classScoped, Type = institutional }`tır — tek alanla modellenemez.

### 3.3 Mevcut yapılara bağlanma (yeni tablo açmadan)

| İhtiyaç | Nereye | Gerekçe |
|---|---|---|
| Moderasyon modu | `SchoolSettings`'e `AnnouncementModeration` kolonu | `RequireApprovalForClassRoomCreation` ile aynı şekilde bir okul politikası. `/announcements/moderation` ucu bunu okur; Ayarlar › Bildirimler ekranı **aynı ucu** tüketir |
| Sessiz saat delme | `NotificationConfig.QuietHoursEnabled/Start/End` | Zaten mevcut, yeniden tanımlanmaz |
| Ek dosya | `Announcement.AttachmentFileId` → `Documents.FileAttachment` (FK) | Dosya içeriği duyuru modülünden geçmez |
| İmza | `PublisherId` (Person) + snapshot etiketler | KR-06 / DYR-K-09 |

### 3.4 İmza alanları snapshot'lanır — bilinçli sapma

`PublisherLabel` / `PublisherSignature` / `PublisherRealName` yazıldığı anda dondurulur; ad çözümlemesi okuma anında yapılmaz.

Bu, `ActivityGroup.PreviousTeacherId` yorumundaki "ad snapshot'lamak kişi adı değiştiğinde bayatlar" ilkesinin tersidir. Duyuruda **bayatlama istenen davranıştır**: ihtiyaç analizi §14 — *"öğretmen okuldan ayrıldı, duyurusu yayında → duyuru yayında kalır; imza tarihsel olarak korunur."* Sapma entity üzerinde gerekçesiyle yazılacaktır.

### 3.5 Invariant'lar

Domain katmanında zorlanır (handler'da değil) — `AnnouncementDomainException`, `AttendanceDomainException` emsali.

| Kod | Kural | Nasıl zorlanır |
|---|---|---|
| INV-1 | Duyuru silinmez | `Delete()` metodu yok, `IsDeleted` alanı yok, `DELETE` ucu yok — NetArchTest ile yapısal koruma |
| INV-2 | Hedef yayın anında donar | `Amend()` imzası hedef parametresi **almaz** |
| INV-3 | `inApp` kanalı kapatılamaz | `Channels` her zaman `inApp` içerir; doğrulayıcı reddeder |
| INV-4 | Geri çekme geri alınırsa ÖNCEKİ statüye dönülür | `StatusBeforeWithdraw` saklanır; `Restore()` koşulsuz `published` yapmaz |
| INV-5 | `pendingApproval` yalnız `thresholded` + öğretmen→veli | `IAnnouncementModerationPolicy` |
| INV-6 | `ValidUntil` geçince `expired` | `ExpireAnnouncementsJob` |
| INV-7 | Okuyucu yüzeyi yalnız `published` + `expired` görür | Ayrı sorgu (`GetAnnouncementInboxQuery`), `AnnouncementRecipient` üzerinden — istemci daraltması YOK |

---

## 4. İzin anahtarları — üç isim kümesi çelişkisi

Depoda **üç ayrı** duyuru izni isimlendirmesi bulundu:

| Kaynak | Anahtarlar |
|---|---|
| DB seed (`PermissionSeedData.cs:57-58`) | `announcements.read`, `announcements.manage` |
| `permission-matrix.md` §Announcements | `view`, `create`, `update`, `delete` |
| Teknik analiz §4.1 | `view`, `create`, `update`, `withdraw`, `approve`, `moderate`, `template.manage`, `report.view` |

**Karar:** teknik analizin 8 anahtarı kanoniktir. `read`/`manage` emekliye ayrılır, `delete` hiç doğmaz (INV-1 ile çelişir).

```
announcements.view              announcements.withdraw
announcements.create            announcements.approve
announcements.update            announcements.moderate
announcements.report.view       announcements.template.manage
```

**DÜZELTME (2026-08-02, Görev 7 kapısı).** Bu belgenin ilk sürümü "`RolePermissionSeedData.cs`'te duyuru satırı yoktur, yeniden adlandırma kimseyi kırmaz" diyordu. **Yanlıştı** — ilk tarama yalnız doğrudan sabit adını arıyordu, oysa izinler `AllPermissionIds()` katalogu üzerinden de dağıtılıyor. Gerçek durum:

| Anahtar | Kim alıyor (mevcut) |
|---|---|
| `announcements.read` | SuperAdmin, SchoolAdmin (katalog) + Teacher, Parent, Student (satır 50, 81, 96) |
| `announcements.manage` | SuperAdmin, SchoolAdmin (katalog) |

Yeniden adlandırma yine de **gerçek bir erişimi iptal etmez**, ama gerekçe farklıdır: bugün hiçbir duyuru ucu yoktur, dolayısıyla bu anahtarlar hiçbir şeye erişim vermez.

**KARAR:** hedef dağılım teknik analiz §4.2'ye birebir uyar.

- `announcements.view` → **yedi rolün tamamı** (SuperAdmin, SchoolAdmin, SchoolStaff, Teacher, Parent, Student, Secretary). Veli/öğrenci için "kendisine hedefli" bir izin niteliği değil, handler'daki self-only sınırıdır — iki katman birlikte çalışır.
- Kalan yedi anahtar yalnız yönetim/sekreter/öğretmen dağılımında (§4.2 tablosu).
- **SuperAdmin yalnız `view` alır.** Yedi yazma anahtarı `AllPermissionIds()` katalogundan bilinçli olarak DIŞARIDA bırakılır — dosyanın `DutiesManage`/`AttendanceManage` için zaten kullandığı kalıp ve aynı gerekçe: platform hesabı okul adına karar veremez.

Migration `read`/`manage`'i siler, sekizini ekler, `RolePermissionSeedData`'yı bu dağılıma göre yazar. `permission-matrix.md` aynı commit'te düzeltilir.

### 4.1 Kapı nasıl kurulur

Kapı **komut/sorgu sınıfının özniteliğidir, controller'ın değil.** `AuthorizationBehavior` (MediatR pipeline) `[RequirePermission]` özniteliklerini `TRequest` tipinden okur, `IPermissionReader.HasPermissionAsync` ile doğrular, reddederse `ForbiddenException` atar ve izin adını gövdeye sızdırmaz. Birden çok öznitelik **VE**'lenir. Attendance bu kalıbı bugün kullanmaktadır:

```csharp
[Tenancy(TenancyMode.Required)]
[RequirePermission("announcements.create")]
public sealed record CreateAnnouncementCommand(...) : ICommand<AnnouncementDto>;
```

> Teknik analizin #5 boşluğu ("yetki kapısı yok") bu mekanizmayı gözden kaçırmıştır — kapı vardır ve çalışır. `Oksis.Api/Authorization/PermissionPolicyProvider` (controller seviyesi `perm:` policy'leri) ayrı ve kullanılmayan bir yoldur; duyuru modülü onu **kullanmaz**, mevcut komut-seviyesi kalıbı izler.

> **İzin anahtarı rolü kapatır; rol içi daraltmayı kapatmaz.** "Öğretmen başkasının duyurusunu geri çekemez" bir izin sorusu değil, bir sahiplik sorusudur — `ICurrentUser` ile handler'da zorlanır ve **her daraltma kendi testini alır**.

---

## 5. Alıcı çözümleme

### 5.1 Kontrat boşluğu: `{dimension, key}` alıcıyı belirlemiyor

`endpoints.ts:247` gövdeyi kurarken `bucket` alanını düşürür:

```ts
audience: input.audience.map((a) => ({ dimension: a.dimension, key: a.key }))
```

Ancak havuzda aynı `(dimension, key)` çifti role göre farklı anlam taşır:

| Havuz | `dimension` | `key` | `label` | `bucket` |
|---|---|---|---|---|
| Yönetici | `section` | `"9-A"` | "9-A" | `student` |
| Öğretmen | `section` | `"9-A"` | "9-A **velileri**" | `parent` |

Aynı gövde yöneticide öğrencilere, öğretmende velilere gider. Backend bunu deterministik çözemez — ve `AnnouncementTarget` sonsuza kadar donduğu için (INV-2) üç yıl sonra denetim izinden okunduğunda "bu duyuru kime gitti" sorusunun cevabı o anki rol bağlamına bağlı kalamaz.

**Karar: `AudienceSelectionBody`'ye `bucket` eklenir.** Frontend değeri zaten elinde tutar (`AudienceSelection extends AudienceOption`), yalnızca gövdeye yazmaz. Hedef kaydı kendi kendini anlatır hale gelir.

*Reddedilen alternatifler:* backend'in çağıranın rolünden çıkarımı — hedefi rol bağlamına bağımlı kılar, INV-2 ile çelişir. `key` içine gömmek — havuz anahtarlarını kirletir.

### 5.2 Tek resolver

`IAudienceResolver` hem `GET /audience` havuzunu üretir hem yayın anında alıcıyı materyalize eder. **İki ayrı kod yolu olmaz** — olursa önizlemedeki sayı ile gerçek alıcı ayrışır; DYR-F-04 tam da bunu yasaklar.

| Katman | Dayandığı yapı |
|---|---|
| `all` | `Person.LifecycleState` + `RoleAssignment` |
| `role` | `RoleAssignment` (Active) → `SystemRole` |
| `schoolStage` | `GradeLevel.EducationLevel` (`Preschool` / `Primary` / `Middle` / `High`) |
| `gradeLevel` | `ClassRoom.GradeLevelId` |
| `section` | `StudentProfile.CurrentClassroomId` → `ClassRoom` |
| `person` | `Person.Id` |
| `course` | `TeachingAssignment(TeacherId, SubjectId, ClassRoomId)` |

`bucket: "parent"` seçimlerinde öğrenci kümesi `ParentStudentRelationship` (`RevokedAt == null`) üzerinden veliye çevrilir — `NotificationRecipientResolver:35-39` ile aynı ilke.

> **İsimlendirme tuzağı.** `ResolveBranchConsumersAsync(schoolId, branchId)` parametresi aslında `CurrentClassroomId`, yani **şube**tir; `Branch` entity'si ise **branş**tır. Yeni kod bu karışıklığı taşımaz — sözlükteki `section` / `subjectArea` ayrımı korunur.

### 5.3 Kademe kuralı (KR-03 / DYR-K-05 / DYR-F-15)

`Primary` **ve** `Preschool` kademesinde öğrenci alıcı olmaz — yalnız veli.

> **Açık varsayım:** İhtiyaç analizinin tablosunda anaokulu yoktur (yalnız İlkokul/Ortaokul/Lise). Kural anaokuluna evleviyetle genişletilmiştir; sessiz bir genişletme değil, kayda geçmiş bir karardır.

DYR-F-15 kapsam dışı kalanın ekranda **açıkça** gösterilmesini şart koşar ("sessiz filtreleme kabul edilemez"). Kontratta bunun için ayrılmış alan yoktur; `AudienceOptionDto.sublabel` tek yerdir. Havuz bu seçenekleri `sublabel: "İlkokul öğrencileri kapsam dışı — yalnız veliler"` ile üretir ve `recipientCount` **zaten daraltılmış** sayıdır. Müdür 400 sanıp 260 kişiye göndermez.

### 5.4 Yayın anında materyalizasyon

`Publish()` tek transaction içinde:

1. `AnnouncementTarget` satırlarını dondurur
2. `IAudienceResolver` ile `PersonId` kümesini çözer
3. `AnnouncementRecipient` satırlarını yazar
4. `RecipientCountSnapshot`'ı mühürler
5. `AnnouncementPublishedEvent` yayar

**Senkron.** Okul ölçeğinde en kötü hâl birkaç bin satırdır ve `recipientCount` yayın cevabında doğru dönmek zorundadır — DYR-F-05 açık onay adımı buna dayanır. Hangfire'a atmak sayıyı geçici olarak yalancı yapardı.

---

## 6. Uç envanteri ve yetki

17 operasyon + 3 şablon CRUD ucu (K-6).

| Uç | İzin | Handler'da ek daraltma |
|---|---|---|
| `GET /announcements` | `view` | `scope=mine` → yalnız `PublisherId == me`; öğretmen `scope=school` isterse 403 |
| `POST /announcements` | `create` | Öğretmen: hedef ∈ kendi şube/dersleri — **yeniden doğrulanır**, istemciye güvenilmez |
| `GET /announcements/inbox` | `view` | **self-only** — `AnnouncementRecipient.PersonId == me` |
| `POST /{id}:read` | `view` | **self-only** — yalnız çağıranın kendi alıcı satırı |
| `GET /{id}` | `view` | Okuyucu ise gelen kutusu kuralı, yönetim ise tam kayıt |
| `PUT /{id}` | `update` | Yalnız `published`; öğretmen yalnız kendi kaydı; hedef **gönderilmez** |
| `POST /{id}:withdraw` · `:restore` | `withdraw` | Öğretmen yalnız kendi kaydı |
| `POST /{id}:approve` · `:reject` · `GET /approvals` | `approve` | — |
| `GET /{id}/delivery-report` · `/audit-trail` | `report.view` | Öğretmen yalnız kendi kaydı |
| `GET\|PUT /moderation` | `moderate` | Okul geneli |
| `GET /templates` | `view` | — |
| `POST\|PUT\|DELETE /templates` | `template.manage` | Yalnız yönetim |
| `GET /audience` | `create` | Rol havuzu daraltır — öğretmen "tüm okul"u **görmez**, kilitli de görmez (§4.2 tasarım notu) |
| `GET /publishers` | `view` | — |

Yaşam döngüsü fiilleri iki nokta ile ifade edilir (`{id}:withdraw`); generic `PATCH` kullanılmaz. **`DELETE /announcements/{id}` yazılmaz** — modül şablonundaki o satır INV-1 ile çelişen bir artıktır.

---

## 7. Ek dosya (Documents entegrasyonu)

1. İstemci ek seçer — boyut/tip ön elemesi (10 MB sınırı `packages/core` sabitinde)
2. Documents yükleme ucundan `StoredFile` alınır; dosya doğrudan depolamaya gider
3. `FileUploadConfirmedEvent` → virüs taraması + thumbnail job'ı
4. Dönen id `CreateAnnouncementBody.attachmentFileId` olarak gönderilir
5. Okumada `FileAccessGuard`, alıcı olmayanın eke erişimini keser

**Kontrat değişikliği (ikinci):** `CreateAnnouncementBody`'ye `attachmentFileId: string | null`. Backend `FileCategoryPolicy` ile boyut/tipi yeniden doğrular — istemci ön elemesi güvenlik sınırı değildir.

---

## 8. Bildirim zinciri (in-app only)

Mevcut çekirdek birebir kullanılır: `INotificationRecipientResolver` → `INotificationEnqueuer` → `NotificationDeliveryLogs` (dedup).

### 8.1 Eksik: genel `Person → Account` çevirisi

Fan-out `AnnouncementRecipient` satırlarını `PersonId` ile yazar; bildirim `Account.Id` ister. Mevcut resolver yalnız dar hâlleri bilir (veli, öğretmen, şube, idare) — karışık kitle (öğretmen + öğrenci + veli) yoktur. Eklenecek:

```csharp
Task<IReadOnlyDictionary<Guid, Guid>> ResolvePersonAccountsMapAsync(
    Guid schoolId, IReadOnlyList<Guid> personIds, CancellationToken ct);
```

Bağlı hesabı olmayan kişiler dışlanır (mevcut guardian resolver'larıyla aynı ilke). **Tek toplu sorgu** — `ResolveGuardianAccountsMapAsync`'in N+1 yorumu aynen geçerlidir.

> `notification-matrix.md`'de adı geçen `AnnouncementTargetResolver` **yazılmamıştır** ve bu tasarımda gerek yoktur (fan-out duyuru modülündedir). Matris dokümanı buna göre düzeltilecektir.

### 8.2 Eksik: `NotificationKind` duyuru değerleri

Enum'da 15 değer vardır, **hiçbiri duyuru değildir**. Eklenecek: `AnnouncementPublished`, `AnnouncementScheduledExecuted`, `AnnouncementSubmittedForApproval`, `AnnouncementApproved`, `AnnouncementRejected`, `AnnouncementWithdrawn`, `AnnouncementAmended`. Ekleme additive'dir, mevcut kayıtları bozmaz.

Dedup anahtarı: `DeterministicGuid.Combine(schoolId, announcementId, "ANNOUNCEMENT_PUBLISHED")`.

### 8.3 Acil duyuru — teslim davranışı DEĞİŞTİRMEZ (düzeltme, 2026-08-02)

Bu belgenin ilk sürümü "acil duyuru `NotificationPriority.Critical` ile gider ve sessiz saat kısıtını deler" diyordu. **Yanlıştı.** Depoda doğrulanan gerçek:

- **`NotificationPriority` enum'u yoktur.**
- `INotificationEnqueuer.Enqueue(eventId, schoolId, kind, title, body, deepLink, recipientAccountIds)` imzasında **öncelik parametresi yoktur**.
- `InAppNotificationChannel` sessiz saate **hiç bakmaz** — `NotificationConfig.QuietHours*` alanları mevcut ama gönderim anında tüketen kod yok. Bu yalnız duyuruda değil, tüm bildirimlerde böyle.

Yani delinecek bir kısıt kurulmamıştır. **Acil işaretinin A1'deki gerçek etkisi:**

| Etki | Durum |
|---|---|
| Alıcı listesinde en üste sabitlenme ve görsel ayrışma | ✅ Çalışır (istemci `urgent` alanını okur) |
| Denetim izine ayrıca yazılma | ✅ Çalışır (Görev 12) |
| Bildirim başlığında "Acil duyuru: …" ön eki | ✅ Çalışır |
| Sessiz saat delme | ❌ **Delecek kısıt yok** |
| E-posta kanalının ayrıca açılması | ❌ Kanal yok (K-2) |

Sessiz saat ve öncelik, teslim kanallarının (D) konusudur ve o iş yapıldığında `AnnouncementPublishedEvent.Urgent` zaten olayda taşındığı için handler değişmeden bağlanabilir. Bugün acil işareti bir **sunum ve kayıt** işaretidir, bir teslim değiştirici değil.

> Yetkinin yönetimde kalması (KR-07) yine de doğrudur ve uygulanır — işaretin bugün teknik bir gücü olmaması, yarın olmayacağı anlamına gelmez.

### 8.4 Derin bağlantı

Bildirim doğrudan duyuru detayına açılır (DYR-F-18 — "ara listeye düşmez"). Mobilde veli/öğrenci **detay** derin bağlantısı tanımlı değildir; C'de eklenir:

```
oksis://parent/announcements/:announcementId
oksis://student/announcements/:announcementId
```

---

## 9. Job'lar

`Infrastructure/BackgroundJobs/Jobs/` altında, `HangfireSetup.UseOksisRecurringJobs()` ile idempotent kayıt (`ExpireRoleAssignmentsJob` emsali).

| Job | Sıklık | Davranış |
|---|---|---|
| `PublishScheduledAnnouncementsJob` | Dakikalık | `ScheduledAt ≤ now` olanları yayınlar. Yayın mantığını **tekrar etmez** — `Announcement.Publish()` domain metodunu çağırır. Hedef yayın anında boş kalırsa yayınlamaz ve yayınlayana bildirim gider (§14 kenar durumu) |
| `ExpireAnnouncementsJob` | Günlük | `ValidUntil < now` olanları `expired` yapar (INV-6). Bildirim üretmez |

---

## 10. Gönderim raporu — açıkça sınırlı

Teknik analiz §3.6 seçenek **(A)**: rapor yalnız **inApp + görülme** ile çıkar, kanal kırılımı tablosu **gizlenir**. `DeliveryReportDto.channels` tek satır döner (`inApp`); frontend tek kanal gördüğünde tabloyu göstermez. Yönetici gitmemiş bir e-postayı "gönderildi" olarak okumaz.

`unreachable` **bugün gerçek veri üretebilir**: `Person.LinkedAccountId == null` olan alıcılar = "uygulamayı hiç kurmamış". DYR-F-29 uydurma olmadan karşılanır; `reason` alanı "Hesap bağlı değil" der. E-posta geri dönüşü D geldiğinde eklenir.

---

## 11. Test stratejisi

TDD, dilim başına: **domain testi → handler testi → controller → yeşil**. Araçlar `testing-rules.md`'den: xUnit + FluentAssertions + NSubstitute + Testcontainers. İsim kalıbı `Should_{ExpectedBehavior}_When_{Condition}`.

| Seviye | Neyi korur |
|---|---|
| Domain unit | INV-1..7, durum geçişleri, `Amend()` imzasının hedef almaması |
| Application / integration (Testcontainers) | Alıcı çözümleme, tenant izolasyonu, **self-only** sınırı |
| Mimari (NetArchTest) | `Announcement`'ta `Delete()` yok, `IsDeleted` yok — INV-1 yapısal olarak zorlanır |
| Eşleşme | `requiresApproval` ve gelen kutusu görünürlüğü, `packages/core`'daki 20 testle **aynı vakalar** |

Son satır kritiktir: eşikli moderasyon kuralı bugün istemcide saf fonksiyon olarak testlidir. **Backend bağlayıcı olan taraftır**; ikisi ayrışırsa öğretmene "yayınlanacak" denip duyuru onay kuyruğuna düşer.

---

## 12. Dilimler (A)

| # | Dilim | Kapsam |
|---|---|---|
| 0 | Domain + şema | 5 entity, 6 enum, EF configuration, migration, izin anahtarları, invariant birim testleri. Uç yok |
| 1 | Hedef havuzu | `IAudienceResolver`, `GET /audience`, 7 katman, rol bazlı daralma, kademe farkındalığı |
| 2 | Yayın omurgası | `POST /announcements`, materyalizasyon, `GET /announcements`, `GET /{id}` |
| 3 | Okuma yüzü | `GET /inbox`, `POST /{id}:read` — self-only sınırı |
| 4 | Yaşam döngüsü | `PUT /{id}`, `:withdraw`, `:restore`, `GET /{id}/audit-trail` |
| 5 | Moderasyon | `GET\|PUT /moderation`, eşikli akış, `GET /approvals`, `:approve`, `:reject` |
| 6 | Yardımcı uçlar | Şablon uçları (**dördü de yeni** — `GET` kontratta ilan edilmişti ama backend'de yoktu), `GET /publishers`, `GET /{id}/delivery-report` |
| 7 | Job'lar | `PublishScheduledAnnouncementsJob`, `ExpireAnnouncementsJob` |
| 8 | Ek dosya | Documents entegrasyonu, `attachmentFileId`, `FileAccessGuard` |

---

## 13. Geçiş (B)

Tek seferde, A bittikten sonra:

1. Backend ayağa kalkar; Swagger duyuru uçlarını içerir
2. Codegen çalıştırılır → `packages/api/src/generated/schema.ts` yenilenir
3. `paths.ts` augmentation'ı generated tiplerle çakışır ve **typecheck kırılır** — bilinçli drift bekçisi
4. Şekil farkları giderilir. **Beşi önceden bilinir ve istemci tarafında düzeltilir** —
   backend bunları A'da zaten yazdı, yani drift bekçisi burada bilerek çalar:
   - `contract.ts` → `AudienceSelectionBody`'ye **`bucket: "parent" | "teacher" | "student"`**
     eklenir (§5.1), ve `endpoints.ts:247` onu gövdeye yazacak şekilde düzeltilir. Bugün o
     satır `bucket`'ı düşürüyor; değer formda zaten mevcut (`AudienceSelection extends
     AudienceOption`), yalnız gönderilmiyor.
   - `contract.ts` → `CreateAnnouncementBody`'ye **`attachmentFileId: string | null`** eklenir
     ve compose formu doldurur (§7).
   - `paths.ts` → **`POST /announcements` başarı statüsü `201` → `200`.** Bugün
     `paths.ts:76` yalnız `201` ilan ediyor; backend `AnnouncementsController.cs:144`
     `Status200OK` ilan ediyor ve bu **bilinçli** (gerekçe `:141-143`'te yazılı:
     `ToHttpResult` başarılı `Result<T>` için 200 döner, 201 değil — ve bir Api.UnitTests
     bekçisi bunu kilitler). Codegen geldiğinde `201` anahtarı kaybolur ve o yanıtı okuyan
     `data` `never`'a daralır; **typecheck'i kıracak olan tam da budur.** Aynı sapma
     `POST /announcements/templates` için de geçerlidir (aşağıdaki maddede yeni açılacak
     `post` slotu `200` ilan etmelidir).
   - `contract.ts` + `paths.ts` → **şablon yazma uçları** (`POST`/`PUT`/`DELETE
     /announcements/templates`) eklenir. Bugün `paths.ts:275-291` yalnız `get` ilan eder;
     `post`/`put`/`delete` hepsi `never`'dır. Backend A3'te dördünü de yazdı
     (`AnnouncementTemplatesController`), yani drift bekçisi burada da bilerek çalar.

     **`PUT`/`DELETE` mevcut anahtarın boş slotlarına YAZILMAZ** — rotaları
     `/announcements/templates/{id}`'dir, yani `paths.ts`'e **yeni bir path anahtarı**
     (`"/api/v1/announcements/templates/{id}"`) açmak gerekir; yalnız `POST` mevcut
     `"/api/v1/announcements/templates"` anahtarının `post` slotuna girer.

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
   - `packages/api-mocks` → **`restore` mock'u koşulsuz `published` yazıyor**
     (`announcement-handlers.ts:220-228`). Backend `StatusBeforeWithdraw`'a döndürür, yani
     süresi dolmuş bir duyuru geri alındığında gerçek uç `expired` üretirken mock `published`
     üretir. A2'de doğrulandı; şekil farkı değil **davranış** farkı olduğu için typecheck
     yakalamaz — MSW handler'ı elle düzeltilmelidir.
5. `contract.ts` + `paths.ts` **silinir**; `endpoints.ts`'teki eşleyiciler (`toAnnouncement` vb.) yerinde kalır
6. `packages/api-mocks` tiplerini generated şemadan almaya geçirilir — bugün `contract.ts`'ten alır, silinince kırılır; **bu adım atlanamaz**
7. İki app typecheck + lint
8. Web ve mobil gerçek uca karşı duman testi (Next `rewrites` proxy üzerinden)

MSW handler'ları **silinmez** — senaryo/hata denemeleri ve mobil dev için kalır (attendance emsali).

---

## 14. Frontend boşlukları (C)

| Boşluk | Karar |
|---|---|
| `restore` bağlanması | Yapılır — uç ve hook hazır, hiçbir ekrana bağlı değil |
| Sayfalama (`pageSize` 200 sabit) | Yapılır — 200. duyurudan sonrası bugün sessizce kayboluyor |
| Moderasyon ↔ Ayarlar bağı | Yapılır — aynı uç, iki yüzey |
| Veli/öğrenci detay derin bağlantısı (mobil) | Yapılır |
| Gönderim raporunda kanal tablosunun gizlenmesi | Yapılır (§10) |
| Şablon CRUD | **A'ya taşındı** (K-6) |
| **Web veli/öğrenci okuma yüzü** | **Kapsam dışı** (K-7) — tasarım çizilmemiş. Yeniden kullanılabilecek çekirdek (`filterInbox`, `partitionInboxByValidity`, `countUnreadByChild`) hazırdır; `handoff-web` ile teslim geldiğinde bağlanır |

---

## 15. Doküman güncellemeleri (`oksis/`)

| Dosya | Değişiklik |
|---|---|
| `permission-matrix.md` | 8 anahtar; `delete` kaldırılır |
| `notification-matrix.md` | 4 önerilen olay eklenir; yazılmamış `AnnouncementTargetResolver` satırı düzeltilir |
| `modules/announcements/` (9 doküman) | ~110 `{{TBD}}` bu belgeden beslenerek doldurulur; `DELETE` ucu ve `announcements.view-detail` izni temizlenir (ikisi de jenerik CRUD şablonu artığıdır) |
| `analysis_standards.md` §7.3 | Fiili yığın farkı notu (aktif depo `oksis-ui`; Next.js 16 + Expo Router) |

---

## 16. Teslim sınırı — yazılı beyan

> Duyuru yayınlanır, uygulama içinde görünür, okundu takibi çalışır — **ama alıcı uygulamayı kendisi açmazsa telefonuna bildirim düşmez.** Sunucuda `INotificationChannel` olarak yalnız `InAppNotificationChannel` kayıtlıdır; mobilde `expo-notifications` kurulu değildir. Gönderim raporu bu sınırı gizlemez.
>
> Ayrıca **okundu onayı ("Okudum" butonu) V2'dedir** (KR-02). MVP'de rapor "ulaştı" ve "görüldü"den ileri bir kanıt üretmez; tebliği gereken duyurularda okul kağıt forma devam eder. Bu bilinçli bir MVP kararıdır ve pilot okulla konuşulurken açıkça söylenmelidir.

---

## 17. Açık kalan riskler

| Risk | Etki |
|---|---|
| `oksis-ui` mock verisi kendi içinde tutarsız (`all.breakdown.students = 48` ama `role.student = 612`) | Mock sayıları referans alınamaz; kabul testleri gerçek veriye karşı yapılmalı |
| **`ICurrentUser.Roles` her zaman boş** — `AccountTokenIssuer` JWT'ye hiç `ClaimTypes.Role` claim'i yazmıyor, dolayısıyla `IsInRole(...)` deponun tamamında ölü kod (`TenantContext.IsSuperAdmin` dahil, ki tüketicisi `OverrideForSuperAdmin` her zaman exception atıyor) | §4.1'in "kapı çalışıyor" tespiti izin katmanı için doğru, ama **rol tabanlı daraltma için değil**. Duyuru modülü rol sormaz: "kendi kapsamı" veri sahipliğiyle (`Person.LinkedAccountId`), "yönetim mi" ise `HasPermissionAsync("announcements.approve")` ile çözülür — Attendance'ın `isOwner \|\| HasPermissionAsync("attendance.manage")` kalıbı |
| **`Secretary` ve `SchoolStaff` seed'lenmiş rol DEĞİL** — yalnız 5 `SystemRole` var. `UserRole` enum'unda üyeleri var ama dışa/içe aktarma etiketi olarak; `RolePermissionSeedData.cs:136-139` ve `MasterSeedIds.cs:58` ertelemeyi açıkça yazıyor | Teknik analiz §4.2'nin yedi sütunlu matrisi bugün birebir uygulanamaz. Bu ikisinin yetkileri `SCHOOL_ADMIN`'de toplandı ve gerekçesi seed dosyasına yazıldı. Secretary rolü seed'lendiğinde matris yeniden bölünmeli |
| `TenantEntity`, `ISoftDeletable`'ı paketliyor — INV-1'in "`IsDeleted` alanı yok" şartı mevcut temelle karşılanamıyor | `Domain/Common`'a `PermanentTenantEntity` eklenir (Görev 1). Paylaşılan temele dokunur; soft-delete filtresi `typeof(ISoftDeletable).IsAssignableFrom(...)` korumalı olduğu için additive |
| `AnnouncementRecipient` fan-out'u büyük okulda satır sayısını hızla büyütür | Sezon bazlı arşivleme stratejisi V2'de ele alınmalı |
