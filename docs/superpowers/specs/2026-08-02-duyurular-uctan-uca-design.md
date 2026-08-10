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
| K-6 | Şablon CRUD **A'ya dâhil** (3 yeni uç) | DYR-F-13; donmuş 17 uçta şablon salt okunur.<br><br>**C5 düzeltmesi (2026-08-09):** DYR-F-13'ün *"yalnız yönetim oluşturur"* ifadesi **geçersizdir**. K1 ile şablon **kişiselleşti**: `announcements.template.manage` öğretmene de verildi (seed migration `20260809_announcement_templates_personal`), liste `CreatedBy` ile daraltıldı ve Update/Delete **sahiplik kapısı** aldı. Benzersiz indeks de okul genelinden sahibe indi: `IX_..._SchoolId_Name` → `IX_..._SchoolId_CreatedBy_Name` |
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

> **DÜZELTME (2026-08-09, C4 kapanışı) — "yedi rolün tamamı" HEDEF dağılımdır, seed'de
> BEŞ rol vardır. Bu cümle C4'te bir güvenlik gerekçesine dönüştü.**
>
> **Nasıl ölçüldü (2026-08-09, `oksis-api` `master`):** `RolePermissionSeedData.Rows()`
> baştan sona okundu ve `announcements.view` satırları sayıldı:
>
> | Rol | Nereden gelir |
> |---|---|
> | `SuperAdmin` | `AllPermissionIds()` kataloğu (`Rows()`in ilk döngüsü) |
> | `SchoolAdmin` | aynı katalog |
> | `Teacher` | Teacher bloğunda açık satır |
> | `Parent` | Parent bloğunda açık satır |
> | `Student` | Student bloğunda açık satır |
>
> **Toplam: 5.** `SchoolStaff` ve `Secretary` **seed'lenmiş rol değildir** — bu, §17'nin
> ilk tablosunda zaten yazılı bir riskti (*"yalnız 5 `SystemRole` var"*), ama bu satır
> ona göre güncellenmemişti. `VicePrincipal` ve `Counselor` de MVP sonrasına ertelendi
> (seed dosyasındaki kendi notlarıyla). Yani metin **hedef tasarımı**, seed **bugünkü
> gerçeği** anlatıyor ve ikisi arasındaki fark hiçbir yerde işaretlenmemişti.
>
> **Neden zararlı oldu:** cümle plana *"bu rota yönetim yüzeyidir ve yetkisi olmayan
> çağıranda uç zaten 403 döner"* diye geçti. Ölçüldü, yanlış:
> `GetAnnouncementByIdQueryHandler`'da **iki** `Forbidden()` vardır ve ikisi de yetkiyle
> ilgili değildir (biri tenant çözülemediğinde, biri çağıranın `Person` kaydı
> bulunamadığında); alıcı olmayan çağıran **`NotFound()`** alır. Veli/öğrenci `view`
> iznini taşıdığı için kapıdan geçer ve 200/404 alır. Plana birebir uyulsaydı web'de
> `/announcements/{id}` rotası veli, öğrenci ve öğretmene **yönetim konsolunu** açardı.
> Rota bu yüzden rol kapılı bir bileşene (`AnnouncementsScreen`) bağlandı.
>
> **Doğru ifade:** *"`announcements.view` bugünkü seed'de beş rolde vardır (SuperAdmin,
> SchoolAdmin, Teacher, Parent, Student); Secretary ve SchoolStaff seed'lendiğinde yediye
> çıkar. İzin ucu AÇAR — yüzey ayrımını sunucu YAPMAZ, istemci yapar."*
> Aynı düzeltme `modules/announcements/api-contracts.md` "Handler'daki Ek Daraltmalar"
> tablosuna da işlendi. Backend docblock'ları hâlâ "yedi rolün tamamında" diyor —
> §17, **C4-6**.

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
| `POST /{id}:withdraw` | `withdraw` | Öğretmen yalnız kendi kaydı |
| `POST /{id}:restore` | `withdraw` | **Yönetim VEYA duyuruyu geri çeken kişi** (`WithdrawnBy`) — yayınlayan olmak tek başına yetmez |
| `POST /{id}:approve` · `:reject` · `GET /approvals` | `approve` | — |
| `GET /{id}/delivery-report` · `/audit-trail` | `report.view` | Öğretmen yalnız kendi kaydı |
| `GET /moderation` | `create` | Öğretmenin compose ekranı modu **okumak zorunda** — yoksa "bu duyuru onaya düşecek mi" sorusunu cevaplayamaz |
| `PUT /moderation` | `moderate` | Okul geneli — yalnız yönetim değiştirir |
| `GET /templates` | `view` | — |
| `POST\|PUT\|DELETE /templates` | `template.manage` | Yalnız yönetim |
| `GET /audience` | `create` | Rol havuzu daraltır — öğretmen "tüm okul"u **görmez**, kilitli de görmez (§4.2 tasarım notu) |
| `GET /publishers` | `view` | — |

Yaşam döngüsü fiilleri iki nokta ile ifade edilir (`{id}:withdraw`); generic `PATCH` kullanılmaz. **`DELETE /announcements/{id}` yazılmaz** — modül şablonundaki o satır INV-1 ile çelişen bir artıktır.

> **DÜZELTME (2026-08-05, C2 kapanışında modül dokümanı kaynaktan yeniden yazılırken).**
> Bu tablonun iki satırı kodla çelişiyordu ve düzeltildi:
>
> - **`GET /moderation` izni `moderate` değil `create`'tir.** Tabloda ikisi tek satırda
>   birleştirilmişti; oysa okuma ile yazma farklı anahtar ister. Gerekçe kodda yazılı:
>   öğretmenin compose ekranı modu okumak zorundadır, `moderate` istenseydi öğretmen
>   "bu duyuru onaya düşecek mi" sorusunu hiç cevaplayamazdı.
> - **`:restore` kapısı `:withdraw` ile aynı değil.** `CanActOn` kullanılmıyor: yönetim
>   **veya duyuruyu geri çeken kişi** (`WithdrawnBy`) geri alabilir. Yayınlayan olmak tek
>   başına yetmez — başkasının geri çektiği bir duyuruyu yayınlayan geri alamaz.
>
> Ayrıca **uç sayısı 17+3 değil, 22'dir**: 18 `AnnouncementsController` action'ı
> (C2'de eklenen `GET /summary` dâhil) + 4 `AnnouncementTemplatesController` action'ı.
> Üç bağımsız sayım (controller action'ları, `[RequirePermission]` öznitelikleri,
> `generated/schema.ts` yolları) aynı sonucu verdi.

---

## 7. Ek dosya (Documents entegrasyonu)

✅ **Yapıldı — C3 (2026-08-05).** Aşağıdaki adımlar sevk edilen akıştır.

1. İstemci ek seçer — boyut/tip ön elemesi (10 MB sınırı `packages/core` sabitinde)
2. Dosya **tek adımda, API üzerinden** yüklenir: `POST /api/v1/files` (multipart, `[FromForm] IFormFile file` + `category`) `StoredFile`'ı döner — **presigned akış kullanılmadı** (bkz. aşağıdaki not)
3. `FileUploadConfirmedEvent` → virüs taraması + thumbnail job'ı
4. Dönen id `CreateAnnouncementBody.attachmentFileId` olarak gönderilir; `FileAttachment` bağını **backend kendisi yazar** (`CreateAnnouncementCommandHandler`), istemci `POST /files/{id}/attach` **çağırmaz**
5. Okumada `FileAccessGuard`, alıcı olmayanın eke erişimini keser
6. İndirmede istemci `attachment.fileId` ile `GET /api/v1/files/{id}/download-url` çağırır, zarftan çıkan kısa ömürlü adrese gider

**Presigned üç adımlı akış (`/files/initiate` → depoya PUT → `/files/{id}/confirm`) KULLANILMADI.** Gerekçe ölçüldü: `FileCategoryPolicyRegistry`'de `AnnouncementAttachment` kategorisi `ForcePresigned: false`, `AllowMultipart: false` ve üst sınır **10 MB** ilan ediyor — yani kategori proxy yüklemeye zaten uygun ve üç adımlı akışın getireceği karmaşıklığın burada karşılığı yok. `UploadFileCommandHandler` proxy yolunu `ForcePresigned || SizeBytes > ProxyMaxSizeBytes` koşuluyla kapatır; 10 MB o eşiğin (25 MB) altındadır.

> **Bayat cümle düzeltildi (C3 kapanışı, 2026-08-06):** 2. adım eskiden *"dosya doğrudan depolamaya gider"* diyordu. Bu **presigned akışın** tarifidir ve sevk edilen proxy akışında yanlıştır: dosya nesne deposuna doğrudan değil, `FilesController.UploadAsync` üzerinden **API'den geçerek** gider (Kestrel `[RequestSizeLimit(26_214_400)]` ile ölçer; `FileSizeBytes` daima `IFormFile.Length`'ten alınır). 3. ve 5. adım yeniden ölçüldü ve **doğru çıktı**: `FileUploadConfirmedEvent` proxy yolunda da raise edilir (`StoredFile.ApplyUploadCompleted`) ve iki abonesi vardır (`FileUploadConfirmedScanEnqueuer`, `FileUploadConfirmedThumbnailEnqueuer` — ikisinin de XML doc'u "proxy tek adım veya iki-fazlı" der); `FileAccessGuard` gerçek bir sınıftır ve duyuru kolunu `AnnouncementEntityScopeResolver` çözer — o dosya 5. adımı **adıyla** alıntılar.

**Kontrat değişikliği (ikinci):** `CreateAnnouncementBody`'ye `attachmentFileId: string | null`. Backend `FileCategoryPolicy` ile boyut/tipi yeniden doğrular — istemci ön elemesi güvenlik sınırı değildir.

**Kontrat değişikliği (C3):** `AnnouncementAttachmentDto`'ya `fileId: Guid`. `url` alanı bir dosya değil, **indirme ucunun göreli yoludur** (`/api/v1/files/{id}/download-url`) ve o uç `[Authorize]`'dır; yolun biçimi tel sözleşmesinde tanımlı değildir (üretilen şemada düz `string`). İstemci yolu **ayrıştırmaz**, `fileId`'yi kullanır.

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
| Listede ACİL rozetiyle görsel ayrışma | ✅ Çalışır (`parts.tsx` rozeti `urgent` alanını okur) |
| Denetim izine ayrıca yazılma | ✅ Çalışır (Görev 12) |
| Bildirim başlığında "Acil duyuru: …" ön eki | ✅ Çalışır |
| **Alıcı listesinde en üste sabitlenme** | ❌ **Çalışmaz** — sıralama yalnız `pinned`'e bakar |
| Sessiz saat delme | ❌ **Delecek kısıt yok** |
| E-posta kanalının ayrıca açılması | ❌ Kanal yok (K-2) |

> **DÜZELTME (2026-08-05, C1 Task 8 gözden geçirmesi).** Bu tablonun ilk sürümü
> sabitlenmeyi ve görsel ayrışmayı **tek satırda** "✅ Çalışır" diye yazıyordu.
> Yarısı yanlıştı: rozet gerçekten `urgent`'ı okur, ama **sıralama okumaz** —
> `sortAnnouncements` (o tarihte `packages/core/src/announcements/logic.ts`'teydi;
> **C2'de silindi** — sunucu zaten sıralıyor ve istemci sıralaması `CreatedAt`
> telde olmadığı için taslaklarda sunucudan ayrışıyordu) ve
> `GetAnnouncementsQueryHandler.cs` yalnız `Pinned`'e bakar; `Urgent` ile
> `Pinned` bağımsız alanlardır ve hiçbir komut birinden diğerini türetmez.
> `AnnouncementPublishedEvent.cs:9-12` bunu zaten açıkça yazıyordu.
>
> Hata ucuz kalmadı: C1 Task 8 bu satıra dayanarak beş ekran metnini "acil duyuru
> listede en üste sabitlenir" diye yazdı — yani "sessiz saat kısıtını deler"
> asılsız vaadinin yerine **başka bir asılsız vaat** geçti. Gözden geçirme
> yakaladı ve metinler rozete göre düzeltildi. Acil işaretinin sıralamaya
> girmesi istenirse bu bir **ürün kararıdır** ve `urgent`'ın iki sıralamaya da
> eklenmesini gerektirir; bugünkü davranış değildir.

Sessiz saat ve öncelik, teslim kanallarının (D) konusudur ve o iş yapıldığında `AnnouncementPublishedEvent.Urgent` zaten olayda taşındığı için handler değişmeden bağlanabilir. Bugün acil işareti bir **sunum ve kayıt** işaretidir, bir teslim değiştirici değil.

> Yetkinin yönetimde kalması (KR-07) yine de doğrudur ve uygulanır — işaretin bugün teknik bir gücü olmaması, yarın olmayacağı anlamına gelmez.

### 8.4 Derin bağlantı

Bildirim doğrudan duyuru detayına açılır (DYR-F-18 — "ara listeye düşmez"). Mobilde veli/öğrenci **detay** derin bağlantısı tanımlı değildir; C'de eklenir:

```
oksis://parent/announcements/:announcementId
oksis://student/announcements/:announcementId
```

> **DÜZELTME (2026-08-09, C4 kapanışı).** Yukarıdaki `oksis://parent|student/…` biçimi
> **yazılmadı** ve yazılmayacak. Ölçüldü (`oksis-api` `src/` altında `oksis://` araması →
> **0 eşleşme**): backend bildirime **tek ve rolden bağımsız** bir yol yazar
> (`/announcements/{id}`). Yazamazdı da — `INotificationEnqueuer.Enqueue` imzası tek bir
> `string? deepLink` alıp onu `recipientAccountIds` listesinin **tamamına** yazar; alıcı
> başına farklı bağlantı taşıyamaz. Üstelik bir duyurunun hedefi **kova listesidir** ve
> kovalar rol karışıktır, yani sunucunun ayıracak bilgisi de yoktur.
>
> **Ayrım istemciye alındı.** `resolveNotificationTarget` (`packages/core`) rolü okuyup
> okuyucu/yönetim yüzeyini seçer; rol → yüzey tablosu `announcementRoleSurface`ta tek
> yerdedir ve testlidir. Rol henüz **çözülmemişse** (`undefined`) hedef üretilmez — satır
> o an tıklanamaz kalır, ama yanlış bir yere de götürmez (mobilde `PORTAL_ROLE_FALLBACK`
> yüzünden veliyi yönetim detayına atan bir yarış bu şekilde kapandı).
>
> Web'de `/announcements/[id]` rotası C4'te açıldı; `/announcements` altında bugün üç
> rota vardır (`page.tsx`, `[id]/page.tsx`, `approvals/page.tsx` — sayıldı).
>
> **DYR-F-18 web'de hâlâ bir yerde ihlal ediliyor** — ama artık dar bir yerde. C4
> kapanışında yüzey seçimi bildirim türüne bağlandı: öğretmenin **okuyucu** şapkasıyla
> aldığı bildirimler (`Published`/`Amended`) web'de artık tıklanamaz (yanlış yere
> götürmektense hiç götürmez). Kalan ihlal **yayınlayan** şapkasında: `Approved`,
> `Withdrawn`, `ScheduledExecuted`, `ScheduleFailed` web'de detaya değil ara listeye
> iniyor, çünkü **web'de öğretmenin duyuru detay yüzeyi hiç yoktur** (ölçüldü:
> `TeacherAnnouncementsPage` yalnız "yeni duyuru formu" ve "Duyurularım tablosu"
> durumlarını tanır; detay çizen kol, parametre ya da tıklanabilir satır yok).
> En ağırı `ScheduledExecuted`: o bildirimin var oluş sebebi gönderim raporudur ve
> rapora web'den ulaşılamıyor. Kapatmak **yeni bir ekran** demektir → §17 → `C4-21`.

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
4. Şekil farkları giderilir. **Dokuzu önceden bilinir ve istemci tarafında düzeltilir** —
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

     Kol **üçtür**, ikisi değil: `published → published`, `expired → expired`
     ve — ME-4b'den sonra — `scheduled → scheduled`, yani geri alma zamanlanmış
     duyuruyu yayın kuyruğuna geri koyar ve job onu tekrar denemeye devam eder.
   - `paths.ts` + MSW + UI → **`:withdraw` artık `scheduled`'dan da çalışıyor**
     (A3, ME-4b, 2026-08-04). Gerekçe: hedefi sıfır alıcıya çözülen zamanlanmış
     bir duyuru yayınlanamaz (`PublishScheduledAnnouncementsJob` onu `scheduled`
     bırakır), düzeltilemez (`Amend` yalnız `published`'dan çalışır ve hedef
     ALMAZ — INV-2) ve silinemez (INV-1); INV-1 silmeyi yasakladığı için
     `:withdraw` böyle bir kaydı emekliye ayırmanın TEK yoludur. Web ve mobil
     üç ayrı yerde `status === "published"` diyordu; kural
     `packages/core` `canWithdrawAnnouncement`'a taşındı.
   - `generated/schema.ts` → **duyuru enum alanları düz `string`'tir.**
     `AnnouncementDto.status`/`type`/`reach`, `channels: string[]`,
     `AudienceOptionDto.bucket`, `AnnouncementModerationDto.mode`,
     `AnnouncementAuditEntryDto.tone` — OpenAPI belgesinde **hiç `enum` şeması
     yoktur**, çünkü Application DTO'ları bilinçli olarak `string` kullanır
     (`AnnouncementDto.cs:12-14`). Bu bir kusur değil, mock-first sözleşmeyle
     uyum kararıdır; sonucu şudur: her enum alanı `endpoints.ts`'te domain
     union'ına daraltılmalıdır (emsal `schedule/endpoints.ts` `toStatus`).
     Bilinmeyen statü **`archived`'a** düşer — `published`'a düşmek geri
     çekilmiş bir duyuruyu yayında gösterirdi. B fazının uçtan uca koşusu
     (2026-08-04) tel üzerinden gelen değerlerin `packages/core` union'larıyla
     birebir örtüştüğünü doğruladı (backend'in `AnnouncementEnumWire.cs`
     dosyasıyla çapraz kontrol edildi): daralma bir savunmadır, bilinen bir
     uyuşmazlığın yaması değil.
   - `generated/schema.ts` → **tüm int alanları `number | string`'tir**
     (`recipientCount`, `seenCount`, `usageCount`, `total`/`reached`/`seen`,
     `AnnouncementAttachmentDto.size`, sayfalama sayaçları). Repo genelinde
     mevcut bir .NET OpenAPI davranışıdır; `Number(v) || 0` ile daraltılır.
     Sayaçlarda **null korunur** — "yayınlanmadı" ile "sıfır kişi gördü"
     aynı şey değildir.
   - `generated/schema.ts` → **nullable alanlar OPSİYONELDİR** (`isRead?:
     null | boolean`), oysa `contract.ts` bunları zorunlu-nullable ilan
     ediyordu. Eşleyiciler `?? null` almalıdır, aksi hâlde alan hiç gelmediğinde
     `undefined` domain tipine sızar.
5. `contract.ts` + `paths.ts` **silinir**; `endpoints.ts`'teki eşleyiciler (`toAnnouncement` vb.) yerinde kalır
   *(Yapıldı — B fazı, 2026-08-04. `packages/api/package.json` exports haritası
   `{".": "./src/index.ts", "./*": "./src/*.ts"}` jokeridir; silme bir exports
   düzenlemesi gerektirmedi.)*
6. `packages/api-mocks` tiplerini generated şemadan almaya geçirilir — bugün `contract.ts`'ten alır, silinince kırılır; **bu adım atlanamaz**
7. İki app typecheck + lint
8. Web ve mobil gerçek uca karşı duman testi (Next `rewrites` proxy üzerinden)

MSW handler'ları **silinmez** — senaryo/hata denemeleri ve mobil dev için kalır (attendance emsali).

---

## 14. Frontend boşlukları (C)

| Boşluk | Karar |
|---|---|
| `restore` bağlanması | ✅ **Yapıldı — C4 (2026-08-09).** Web: Arşiv sekmesinde satır eylemi + `RestoreModal` (onay + "gerekçe silinir" uyarısı). Mobil: duyuru detayının işlem menüsünde. Eylemin adı tek metindir — **"Geri çekmeyi iptal et"** (`restoreActionLabel`, core), beş yüzeyde de aynı. Sonuç cümlesi de core'dadır (`restoreOutcomeMessage`): INV-4 gereği `restore` koşulsuz `published` yapmaz, `StatusBeforeWithdraw`'a döner — üç kolun üçü de ayrı cümle söyler. **Mobil kolda da onay vardır** (`RestoreSheet`, C4 kapanışı 2026-08-09): kardeş `WithdrawSheet` kalıbı, gövdede üç kolun anlatımı ve *"geri çekme gerekçesi kayıttan silinir"* uyarısı. Uyarı metni web modalıyla **tek kaynaktan** gelir (`restoreNotice`, core) — iki yüzey ayrışamaz |
| Sayfalama (`pageSize` 200 sabit) | ✅ **Yapıldı — C2 (2026-08-05).** Tam sunucu sayfalaması: filtre/arama/sayaçlar sunucuya taşındı, `GET /announcements/summary` açıldı (18. operasyon), gelen kutusu da sayfalandı (orada tavan bile yoktu) |
| Ek dosya yükleme akışı | ✅ **Yapıldı — C3 (2026-08-05); mobilde yalnız görsel.** Tek adımlı proxy yükleme (§7): web compose gerçekten yüklüyor, web + mobil detay ve mobil okuyucu indiriyor. Mobil compose **yalnız jpg/png** alır — `expo-document-picker` depoda yok, eklenmesi native yeniden derleme gerektirir; sınır ekranda açıkça yazılıdır ("PDF eklemek için web arayüzünü kullanın") |
| Moderasyon ↔ Ayarlar bağı | ✅ **Yapıldı — C4 (2026-08-09).** Aynı uç, artık **üç** yüzey: web Ayarlar › Bildirimler, web Duyurular › Moderasyon, mobil Ayarlar › Bildirim Ayarları. Aynı query anahtarını paylaştıkları için biri değişince diğeri anında güncellenir. Yazma kararı core'da ve testlidir (`shouldSaveModerationChange`) — seçili moda dokunmak uca istek göndermez; etiketler de core'dan (`announcementModerationLabel`). **Kapı okumada değil yazmadadır:** okuma ucu `announcements.create` ister (öğretmen modu okumak zorundadır), yazma `announcements.moderate` — öğretmen kartı görür, kaydedemez |
| Veli/öğrenci detay derin bağlantısı (mobil) | ✅ **Yapıldı — C4 (2026-08-09); ama `oksis://` ile DEĞİL.** Bkz. §8.4 düzeltme notu: backend rolden bağımsız tek yol yazar, ayrım istemcide `resolveNotificationTarget` ile yapılır. Veli/öğrenci `announcements/read/[id]` okuyucu ekranına gider (gönderim raporu, denetim izi ve "Geri çek" yoktur); yönetim `announcements/[id]/index`e. Karşılığı olmayan bildirim adresleri `null`a çözülür ve satır tıklanamaz kalır — kullanıcı 404 ya da "Unmatched Route" görmez.<br><br>**C4 kapanışında yüzey seçimi ROLDEN değil BİLDİRİM TÜRÜNDEN'e geçti** (`ANNOUNCEMENT_NOTIFICATION_HAT` + `announcementDetailSurface`, core'da testli). Ölçüldü: sekiz duyuru türünün her biri tek bir şapkaya düşüyor — `Published`/`Amended` alıcı kümesini `AnnouncementRecipients`'tan okur (**okuyucu**), kalan beşi tek elemanlı `[PublisherId]`'ye gider (**yayınlayan**), `SubmittedForApproval` izin zincirinden gelir (**onaycı**, ayrı kol). Böylece **başkasının duyurusunu alan öğretmen** artık yönetim ekranına düşmüyor. `kind` parametresi zorunludur — unutulan çağrı yeri typecheck'te yakalanır; bilinmeyen tür `null`a çözülür. Backend'e dokunulmadı (karşılaştırma: `Enqueue` imzasına alan eklemek 24 çağrı yeri + Hangfire job imzası + 18 test dosyası olurdu) |
| Gönderim raporunda kanal tablosunun gizlenmesi | ✅ **Yapıldı.** `showsChannelBreakdown(report)` kapısı her iki uçta: tek kanal varken tablo çizilmiyor, başlık "Gönderim" oluyor ve altına *"Bu sürümde duyuru yalnız uygulama içinde iletilir; kanal kırılımı yoktur."* yazılıyor (web `detail.tsx`, mobil `announcement-detail-screen.tsx` — ikisi de ölçüldü 2026-08-09) |
| Şablon CRUD — **backend** | **A'ya taşındı** (K-6); A3'te dört uç da yazıldı |
| Şablon CRUD — **arayüz** | ✅ **Yapıldı — C5 (2026-08-09).** B fazı (2026-08-04) API katmanını bağlamış ama hiçbir ekran çağırmamıştı: `useCreateAnnouncementTemplate` / `useUpdateAnnouncementTemplate` / `useDeleteAnnouncementTemplate` üçü de **ölü hook**tu. C5'te üçünün de çağıranı var (ölçüldü 2026-08-10, `grep`): **ilk çağıran `apps/web/features/announcements/announcements-page.tsx`** (yönetim yüzü, Görev 10) — üç hook da orada. Ardından öğretmen yüzü `teacher-announcements-page.tsx` (Görev 12, üçü de) ve mobil `announcements/templates/new.tsx` + `templates/[id].tsx` + `templates.tsx` (Görev 14). `useCreateAnnouncementTemplate`'in ayrıca üç compose çağıranı daha var ("Şablon olarak kaydet": web iki sayfa, mobil `announcements/new.tsx` ve `announcements/[id]/index.tsx`).<br><br>Şablon **kişiselleşti** (K-6 düzeltmesi): liste sahibine daralır, düzenle/sil sahiplik kapısından geçer, öğretmen de şablon yönetir. Ekran icat edilmedi — tasarım handoff'u geldi ve C5 planı ona göre yazıldı |
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

### C2'de (2026-08-05) ölçülerek eklenen riskler

| Risk | Etki |
|---|---|
| **Arama davranışı daraldı ve kullanıcıya söylenmiyor** | İstemci araması `foldTurkish` ile aksan katlıyordu ("ogrenci" → "öğrenci"); sunucu araması katlamıyor (depo geneli kalıp, `ListStudentsQueryHandler` emsali). Kullanıcıya hiçbir yerde bildirilmiyor |
| **Türkçe küçültme prod'da farklı davranacak** | Sunucu `ToLower()` `CurrentCulture`'a bağlı. Deponun kendi notu (`GetAnnouncementPublishersQueryHandler.cs`) prod'da Invariant'a düşüldüğünü yazıyor — Invariant `İ`ye hiç dokunmaz. Üstelik samanlık tarafı hiç .NET değil, SQL `LOWER()` yani DB collation'ı (`UseCollation` hiçbir yerde yok). Aynı arama üç ortamda üç sonuç verebilir |
| **`PaginationNormalizer` sapması** | `src/Oksis.Shared/PaginationNormalizer.cs` doc'u "clamp mantığı handler içinde kopyalanmamalıdır" diyor ve 8 üretim dosyası onu kullanıyor; iki duyuru handler'ı kullanmıyor. Ölçülen fark: `?pageSize=-1` depo genelinde "hepsi", duyuruda **1 satır** |
| **`?page` taşması ve bozuk sorgu parametreleri 500 döndürüyor** | `GetAnnouncementsQueryHandler`'daki `.Skip((page-1)*pageSize)` taşması (A fazından devralınmış) ve `?status=zirva` → `ParseStatus` fırlatıyor → 500. Gelen kutusunda C2'de düzeltildi, envanterde duruyor |
| **`Mvc.Testing` yok → HTTP uç dikişi testsiz** | Routing + middleware + durum kodu katmanı hiçbir testle kapsanmıyor; `Program.cs`'te `partial` işareti de yok. C2 Task 1'de `?status=` boş değerinin 500 döndürdüğü bulgusu tam bu dikişte doğdu |
| **Mobil UI iki turdur çalıştırılmadan sevk ediliyor** | `apps/mobile`'da test koşucusu yok ve mock ortamı oturum/`me/context` handler'ı taşımadığı için ekranlar tarayıcıda da açılamıyor. JSX katmanı yalnız tip denetleyicisi ve okumayla doğrulanıyor<br><br>⚠️ **Bu satırın ikinci yarısı C2 kapanışında bayatladı (C3'te ölçülerek düzeltildi, 2026-08-06).** `packages/api-mocks/src/session/` eklendi ve `auth/account/login`, `auth/me/context`, `auth/me/available-contexts`, `users/self` handler'larını taşıyor — yani `expo start --web` ile ekranlar **artık açılabiliyor** ve C3'ün mobil maddeleri gözle doğrulandı. **Birinci yarı hâlâ geçerli:** `apps/mobile/package.json`'da `test` betiği yoktur (ölçüldü). Native tarafta mock ayrı bir sebeple hâlâ kırık — bkz. C3-3 |

### C3'te (2026-08-05) ölçülerek eklenen backlog

Ek dosya dilimi kapatılırken **ölçülerek** bulunan, C3 kapsamı dışında bırakılan işler.
Hepsi kod okunarak doğrulandı; hiçbiri varsayım değildir.

| # | Madde | Ölçüm ve etki |
|---|---|---|
| **C3-1** | **Liste DTO'suna `hasAttachment` bayrağı gerekiyor** | Üç liste yüzeyi de `row.attachment`'a bakıp ataç rozeti çiziyor (`apps/web/features/announcements/inventory-tab.tsx`; `apps/mobile/src/features/announcements/components/announcement-inbox-row.tsx` — ataç + "1 ek"; `.../announcement-row.tsx`). Ama `GetAnnouncements` / `GetAnnouncementInbox` / `GetAnnouncementApprovals` handler'larının **üçü de** `AnnouncementMapper.ToDto`'ya `attachment` argümanını geçmiyor (varsayılan `null`) → **rozetler üretimde hiç görünmüyor, yalnız mock'ta görünüyor.** `Announcement.AttachmentFileId` zaten kökte bir kolon olduğu için hafif bir `hasAttachment` bayrağı **N+1 doğurmaz** — `StoredFile`'a join gerekmez. Tam `AnnouncementAttachmentDto`'yu listede doldurmak ise dosya başına bir okuma ister; bayrak bilinçli olarak daha ucuz seçenektir |
| **C3-2** | **`expo-document-picker` eklenmeli** | Mobilden PDF eki seçebilmek için gerekli. Paket hiçbir `package.json`'da yok (ölçüldü); mobil ek seçici bugün `expo-image-picker` + `mediaTypes: ['images']`. Eklenmesi **native yeniden derleme** gerektirir, bu yüzden C3'e alınmadı. Politika (`AnnouncementAttachment`) pdf'i zaten kabul ediyor — eksik olan yalnız istemci seçicisi |
| **C3-3** | **Mock modu mobilde NATIVE'de kırık** | iOS simülatöründe `msw/native` Hermes'te patlıyor: `MessageEvent` global'i yok, shim'lenince bu kez `BroadcastChannel` yok. Web (`expo start --web`) etkilenmiyor ve mock orada çalışıyor. **Ölçüm iOS 26.5'te yapıldı; Android denenmedi** — kapsamı bu kadardır |
| **C3-4** | **`excuse-create-screen.tsx` web'de `asset.file` göndermiyor** | `apps/mobile/src/features/attendance/components/excuse-create-screen.tsx` eki native köprünün beklediği `{ uri, name, type }` şeklinde kuruyor. Expo web'de bu düz bir nesnedir, `File` değildir — tarayıcı `FormData.append` çağrısında onu `"[object Object]"` diye serileştirir. C3'te ölçülen tarayıcı FormData davranışından **çıkarıldı**; mazeret akışı web'de **ayrıca doğrulanmalı** (bu turda çalıştırılmadı). Duyuru akışı bu hatadan muaftır: orası gerçek `File` taşır |
| **C3-5** | **Duyuru DÜZENLEME ekranında Başlık/İçerik boş geliyor** | `compose.tsx` (web) ve `compose-screen.tsx` (mobil) alanları `useState(seed?.title ?? "")` ile **bir kez** ilkliyor; `seed` geç çözülen `detailQuery`'den geliyor ve bileşende `key` yok, dolayısıyla ilk render'daki `undefined` kalıcı oluyor. **C3 öncesinden var**, ek dosya işiyle ilgisiz |
| **C3-6** | **Expo web'de sayfa yenilemesiyle rol yöneticiye düşüyor** | `/announcements/new` doğrudan yenilenerek açıldığında token öğretmen olsa bile rol yönetici çözülüyor. Görsel doğrulama yapan **her turu bozar** — moderasyon/onay davranışı role bağlı olduğu için yanlış ekran ölçülür |
| **C3-7** | **Yükleme başarılı + duyuru oluşturma başarısız → öksüz `StoredFile`** | Akış iki ayrı isteğe bölündüğü için (önce `POST /files`, sonra `POST /announcements`) ikincisi düşerse dosya yüklenmiş ama hiçbir duyuruya bağlanmamış hâlde kalır ve **okul kotasından düşer**. Backend tarafında bir orphan temizliği gerekiyor; `dosya-yonetimi-spec.md` §8.2'de `files.upload.orphan-cleaned` log olayı zaten **tanımlı** (yani tasarım bu işi öngörmüş), duyuru akışında karşılığı yok |
| **C3-8** | **Mock yaşam döngüsü uçları ham satır döndürüyor** | `markInboxRead` ve kardeşleri MSW handler'ında satırı doğrudan döndürüyor. Gerçek uçta `MarkAnnouncementReadCommandHandler` `attachment` argümanını **geçmez** ve kendi yorumunda "istemci detayı bu yanıttan yeniden render ETMEMELİDİR" diye uyarır. Mock bu farkı **maskeliyor**: `:read` sonrası ekin düşmesi mock'ta görülmez, üretimde görülür |
| **C3-9** | **`sameTabFileOpener` tipi gereğinden geniş** | `packages/api/src/files/download.ts` imzası `Pick<Window, "location" \| "open">` istiyor ama gövde yalnız `win.location.href`'e yazıyor; `open` gereksiz yere zorunlu. Daraltmak test sahtelerini de basitleştirir. Zararsız ama yanıltıcı: imza, fonksiyonun `window.open` kullandığını ima ediyor — oysa tam tersi bilinçli bir karar (depoda çalışma zamanında `window.open` çağrısı **sıfırdır**, ölçüldü) |

### C4'te (2026-08-09) ölçülerek eklenen backlog

Yönlendirme/bağlar dilimi (bildirim → doğru ekran, `restore`, moderasyon ↔ ayarlar)
kapatılırken **ölçülerek** bulunan, C4 kapsamı dışında bırakılan işler. Kaynak: sekiz
görevin gözden geçirme triyajı + bütün-dal gözden geçirmesi + tek düzeltme dalgası.
Düzeltme dalgasında **kapanan** maddeler bu tabloda YOKTUR (bayat backlog üretmemek için
ayıklandı); burada kalanlar bilerek açık bırakılmıştır.

**Atıf kuralı:** bu tabloda satır numarası kullanılmaz, sembol/dosya adı kullanılır.
Gerekçe ölçülmüştür: bu dalda en az yedi atıf bayatladı ve **dördü düzeltme turlarının
kendi ürünüydü** — satır numarası, düzelttiği metnin ömründen kısa yaşıyor.

| # | Madde | Ölçüm ve etki |
|---|---|---|
| **C4-1** | 🔴 **`packages/api-mocks`'ta bildirim ucu mock'u YOK — kritik yol** | `packages/api-mocks/src/` altında dört alan var: `announcements`, `attendance`, `files`, `session` — **`notifications` yok** (dizin listelendi, 2026-08-09). Sonucu ölçüldü: C4'te bildirim yönlendirmesini ekranda görebilmek için **üç ayrı turda** geçici scaffold kuruldu ve her seferinde geri alındı (Task 5, Task 6, düzeltme dalgası). Rol duyarlı bildirim yönlendirmesi artık **iki uygulamada da kritik yoldur** ve `packages/core`'da testlidir — ama **uçtan uca hiçbir zaman mock'la koşulamıyor**, yani bir gerileme ancak gerçek backend'de fark edilir. Gereken: kalıcı bir `notificationHandlers` kümesi. İkinci bir şart daha ölçüldü: bugünkü duyuru fixture kimlikleri (`d1`, `p-zeynep`, …) **GUID biçiminde değil**, dolayısıyla `ANNOUNCEMENT_ID_PATTERN` süzgecinden geçmez — mock en az bir GUID kimlikli duyuru taşımalıdır, yoksa duyuru kolu mock'ta hiç çalışmaz |
| **C4-2** | **`WithdrawSheet` "isteğe bağlı" diyor, uç zorunlu tutuyor** | `apps/mobile/.../withdraw-sheet.tsx` alanı `label="Gerekçe (isteğe bağlı)"` ile çiziyor; `oksis-api` `Announcement.Withdraw()` boş gerekçeyi `"Announcements.Withdraw.ReasonRequired"` / *"Geri çekme gerekçesi zorunludur."* ile **reddediyor**. Kullanıcı alanı boş bırakıp gönderiyor ve hata alıyor. C4 öncesinden var (master'da duruyor), C4'ün getirdiği değil |
| **C4-3** | **Reddedilen öğretmenin bildirimi mobilde boş yer tutucuya gidiyor** | `AnnouncementRejectedNotificationHandler` alıcıyı `PublisherId` (= duyuruyu yazan öğretmen) olarak çözüp deepLink'e **`/announcements`** yazıyor. Mobilde `(tabs)/announcements.tsx` `role !== 'admin'` ise `PlannedScreen` — *"Bu ekran henüz boş."* — döndürüyor. Öğretmenin gerçek yüzeyi `(tabs)/my-announcements`. C4'te `announcementRoleSurface` bu eşlemeyi core'a taşıdı ve **bildirim satırı** artık doğru rotaya gidiyor; kalan kusur o sekmenin kendisinde ve C4'ün getirdiği değil |
| **C4-4** | **Mobilde `+not-found.tsx` yok** | `apps/mobile` altında `+not-found*` dosyası **0 adet** (arandı, 2026-08-09). Karşılıksız bir yol expo-router'ın **İngilizce** yerleşik "Unmatched Route" ekranını açıyor. C4 ölü bildirim adreslerini tıklanamaz yaparak bu yüzeyi bildirimlerden **eriştirmez** hâle getirdi (dün 3 desen "Unmatched Route" veriyordu, bugün 0), ama başka her yol hâlâ oraya düşebilir |
| **C4-5** | **Yönetici `/attendance` bildirimini alıyor, mobil karşılığı yok** | `AbsenceThresholdReachedNotificationHandler` okul yöneticilerine **ayrı** bir bildirim kuyruklıyor (`ResolveSchoolAdminAccountsAsync`) ve deepLink `/attendance`. Mobilde `AttendanceTabScreen` yalnız `teacher` ve `parent` dallarına sahip; yönetici **fallthrough** ile `StudentAttendanceScreen`e düşüyor, yani "Devamsızlığım · Kayıt bulunamadı" görüyor. Ekranın kendi docblock'u yönetici yüzeyinin `/attendance/live`e taşındığını yazıyor — oraya yollamak **yeni bir yönlendirme kararıdır**, C4'te bilinçli olarak verilmedi |
| **C4-6** | **`oksis-api` — docblock'lar hâlâ "yedi rolün tamamında" diyor** | `GetAnnouncementByIdQuery` ve `GetAnnouncementInboxQuery` özetleri `announcements.view` iznini "yedi rolün tamamında" diye anlatıyor (grep → tam 2 dosya). Seed'de **beş** rol var (bkz. §4 düzeltme notu). İstemci artık "beş" diyor; çelişki kaynağın kendisinde. **`oksis-api` maddesi** |
| **C4-7** | **`oksis-api` — deepLink desenleri gözden geçirilmeli** | Bildirim handler'larındaki adres literalleri sayıldı (2026-08-09): **7 desen + `null`**. Üçü istemci rotasıyla birebir tutmuyor: **`/duties`** (web rotası tekil **`duty`**), **`/announcements/approvals`** (web'de rota değil **sekme**, mobilde `announcements/queue`), **`/announcements/{id}/delivery-report`** (hiçbir uçta ayrı rota yok — rapor detayın içinde). C4 çeviriyi core'da kapalı bir tabloyla çözdü ve **istemci tarafı kapandı**; ama `Notification.DeepLink` **kalıcı bir sütundur**, yazıldığı anda donar — sunucu düzeltilse bile kutulardaki eski bildirimler eski adresi taşımaya devam eder. Yani bu iş "sunucuyu düzelt"le bitmez, çeviri katmanı kalıcıdır. Karar: desenler **istemci rota envanterine göre gözden geçirilsin**, yeni desen eklenmeden önce iki uygulamada da karşılığı olduğu ölçülsün. **`oksis-api` maddesi** |
| **C4-8** | **Web mock'u backend'in üretmediği deepLink'leri taşıyor** | `apps/web/mocks/notifications-data.ts` içinde `/roll-call`, `/reports`, `/students`, `/duty` var; backend'in ürettiği 7 desende bunların **hiçbiri yok**. C4'ten sonra doğru şekilde **tıklanamazlar** (kapalı liste), yani zarar vermiyorlar — ama mock artık gerçeği taklit etmiyor ve "bildirim satırı neden ölü?" sorusuna yanlış cevap verdiriyor. Mock sadakati C3'te de bir madde olmuştu (C3-8) |
| **C4-9** | **Düzeltme dalgasından park edilen dört Minor** | Kural gereği ikinci bir düzeltme dalgası açılmadı; dördü de triyajda "gerçek ama bekleyebilir" hükmü aldı: **(a)** `packages/core/.../announcements/logic.ts` ölçüm günlüğündeki satır atfı, §16'yı düzelten commit'in **kendi** ürettiği yeni §16 vakasıdır (yaşayan atıf sembol adı olduğu için kullanıcı etkisi yok). **(b)** `notif-list-screen.tsx` — rol `undefined` iken satır okundu işaretlenir ama **hiçbir geri bildirim vermez**; rol asla çözülmezse dokunuş kalıcı olarak sessizdir (eski davranıştan — yanlış ekran — yine de iyidir). **(c)** `announcements-page.tsx` "Moderasyon ayarına git" yalnız sekmeyi değiştiriyor, adres `/announcements/approvals`ta kalıyor; F5 kullanıcıyı kapalı kuyruğa geri atıyor — aynı turda yazılan `backToList` kalıbıyla tek satırda kapanır. **(d)** `approval-queue-tab.tsx` iki fazla boş satır (nit) |
| **C4-10** | **`announcements-page.tsx` sürdürülemez büyüklüğe yaklaştı** | C4 sonunda ~690 satır ve **altıncı** modal eklendi. `activeModal` union'ına geçirmek ayrı bir görevdir; bugün her modal kendi `useState`'ini taşıyor ve iki modalın aynı anda açılabilmesini engelleyen bir tip yok |
| **C4-11** | **Apps'ta testsiz kalan karar kuralları** | Bütün-dal gözden geçirmesi **5** test edilemez karar kuralı saydı. Düzeltme dalgası ikisini core'a taşıdı (rol bağımlı karar tablosu apps'ta **2 → 0**). Kalanlar: `entry` → sekme/görünüm eşlemesi, `AnnouncementsScreen`in rol kapısı + `entry` düşürmesi, `AREA_HREF`. Hiçbirinin koşucusu yok (`apps/web` ve `apps/mobile`'da test runner yoktur — planın kendi Global Constraint'i); core'a taşınabilecek olanlar taşınmalı |
| **C4-12** | **`moderation = data ?? "open"` sorgu yüklenirken sessiz no-op üretiyor** | `announcements-page.tsx` moderasyon modunu sorgu inmeden `"open"` varsayıyor. Gerçek mod `thresholded` iken "Serbest yayın"a tıklamak `shouldSaveModerationChange` yüklemine `("open","open")` verir ve **hiçbir şey yapmaz** — kullanıcı tıkladığını sanır. Fix öncesinde de aynıydı (yeni hata değil), ama artık koruma yüklemi bu yanlış girdiyi okuyor. Doğru çözüm: yüklenirken kontrolü devre dışı bırakmak |
| **C4-13** | **Mobil erişilebilirlik borçları** | Dört ölçüm: **(a)** geri alma bekleme/sonuç şeritlerinde `accessibilityLiveRegion`/`announceForAccessibility` yok — ekran okuyucu kullanıcısı şeridi ancak gezinerek bulur. **(b)** Şeritler `ScrollView` içinde ve otomatik kaydırma yok; kullanıcı aşağıdayken eylemi tetiklerse **hiçbir şerit görmez**. **(c)** `accessibilityHint`in TalkBack/VoiceOver'da fiilen seslendirilmesi **ölçülemedi** (cihaz/simülatör yok); `react-native-web`de hiçbir niteliğe çevrilmediği ölçüldü, native'de yalnız prop desteği kod düzeyinde doğrulandı. **(d)** Web'de moderasyon çapraz-referansı yalnız hover'da görünür (`ATip` → CSS `::after`), ekran okuyucuya duyurulmuyor — mobilde aynı bilgi görünür `Note` şeridine kondu, web hizalanmadı |
| **C4-14** | **Mobilde ölü bildirim satırı tıklanabilir GÖRÜNÜYOR** | Karşılığı olmayan adres artık hiçbir yere gitmiyor (doğru), ama satır mobilde hâlâ basılabilir görünüyor ve dokunuş sessiz. Web aynı sorunu `href` vermeyerek çözüyor; mobil eşdeğeri bir **görsel** değişiklik olurdu ve C4'ün kapsamı dışında bırakıldı |
| **C4-15** | **Mobilde kaydetme geri bildirimi eksik** | Moderasyon kartı başarıda **toast göstermiyor** (web gösteriyor). "Kaydediliyor…" ara durumu mock anında cevapladığı için **hiçbir ölçümde ekrana düşmedi** — gerçek backend'le bir kez görülmeli. Ayrıca mobil okul ayarları hub'ında "Düzenle" rozeti hâlâ yalnız İletişim'de, oysa Bildirim Ayarları artık **yazılabilir** bir alan içeriyor |
| **C4-16** | **Gerçek uca karşı elle doğrulanacak kollar** | Mock'ta tetiklenemeyen üç dal: geri almanın **403** kolu (yönetici de değil, geri çeken de değil), **409** kolu (bayat statü) ve moderasyon yazmanın 403 kolu. Kod ve metinler ölçüldü, **ekran görünümleri ölçülmedi**. Kapanış duman testinde gerçek backend'le bir kez görülmeli |
| **C4-17** | **Depo düzeyinde biçim kararı gerekiyor** | `.prettierrc` (printWidth 80, semi false) depo geneliyle uyuşmuyor (~100 sütun, noktalı virgüllü). Daha kötüsü ölçüldü: `notification-bell.tsx`, `core/notifications/logic.ts` ve `core/announcements/logic.ts` **C4'ün değişikliklerinden ÖNCE de** `prettier --check`i geçmiyordu (`git stash` ile doğrulandı). Bu yüzden bu turda hiçbir dosyaya prettier çalıştırılmadı, komşu biçime uyuldu. Depo düzeyinde çözülmeli |
| **C4-18** | **Yeniden kullanım borçları (nit kümesi)** | **(a)** `{ ok: boolean; text: string }` tipi iki mobil dosyada elle tekrarlanıyor. **(b)** `archive-tab.tsx`teki `VISUALLY_HIDDEN` satır içi bir `CSSProperties` sabiti — depoda ortak `sr-only` sınıfı yok (`packages/ui/src/styles` altında 0 eşleşme); ikinci bir adsız sütun çıktığı anda kopyalanmaya davetiye. **(c)** `toasts.tsx`in `action`/`onAction`/`progress`/`sticky` alanlarının **sıfır çağıranı** var — taşındı ama kullanılmıyor. **(d)** Dar sütunda "Geri çekmeyi iptal et" üç satıra sarıyor. **(e)** `should*` öneki `packages/core`'da ilk kez kullanıldı (önce 0) — kalıp kayması olarak izlenmeye değer. **(f)** `NotificationTarget` artık **dört kollu**; iki uygulamanın `switch`leri de total olduğu için yeni kol derleme hatası verir, ama bir sonraki kol talebinde önce *"bu gerçekten yeni bir HEDEF mi, yoksa var olan bir hedefin parametresi mi?"* sorulmalı |
| **C4-19** | **Ölçüm günlüğü ve rapor hijyeni** | Bu fazın imza hatasının artıkları. **(a)** Kod içi ölçüm günlükleri kalıcı docblock'larla karışmış durumda ve satır numarası taşıdıkları için bayatlamaya açık (mobil duyuru detayının başlık yorumu C4'te 11 satır büyüdü). **(b)** SDD görev raporlarında düzeltilmemiş üç bayat metin var: fix ÖNCESİ ölçüm yöntemini hâlâ anlatan bir seçici, "7 bildirim satırı" derken görüntüde 4 satır olan bir sayım, ve yaklaşık verilmiş bir emsal dosya yolu. **(c)** `packages/core/.../notifications/logic.test.ts`te bir zayıf negatif iddia (`not.toContain("tarih")`) mutantı sağ bırakıyor. **Kural olarak yazıldı:** kalıcı belgede satır numarası yerine sembol adı; numara zorunluysa yanına ölçüm tarihi |
| **C4-20** | **Mock oturumunda rol tam sayfa gezintide kayıyor (C3-6'nın web ayağı)** | C3-6 bunu Expo web için kaydetmişti. C4'ün duman testlerinde **web'de de** görüldü: adres çubuğundan yapılan tam sayfa gezintide oturum yönetici profiline dönüyor. Bu yüzden C4'ün bütün rol değişimleri **uygulama içinden** yapıldı. Görsel doğrulama yapan her turu yavaşlatıyor ve rol duyarlı davranışın yanlış ölçülmesine açık kapı bırakıyor |

### C4 kapanışında (2026-08-09) eklenen backlog

| # | Konu | Ölçüm |
|---|---|---|
| **C4-21** | ✅ **KAPANDI — C5 (2026-08-09).** Web'de öğretmen duyuru DETAY yüzeyi yok — DYR-F-18'in kalan ihlali | **Kapanış:** öğretmen web detayı `apps/web/features/announcements/teacher-detail.tsx` (`TeacherAnnouncementDetail`) ile açıldı ve `teacher-announcements-page.tsx` onu render ediyor. `entry` artık öğretmene de **taşınıyor**: `announcements-screen.tsx` `activeRole === "teacher"` kolunda `<TeacherAnnouncementsPage entry={entry} />` çağırıyor, yani `/announcements/{id}` derin bağlantısı ara listeye düşmüyor — DYR-F-18'in kalan ihlali **kapandı** (ölçüldü 2026-08-10). Eski gerekçe (*"`entry` taşınsaydı öğretmen yönetim konsoluna düşerdi"*) yeniden ölçülüp çürütüldü: `TeacherAnnouncementsPage` `AnnouncementsPage`i hiç render etmiyor, `entry`yi kendi `TeacherView` birliğine çeviriyor. Onay kuyruğu kolu orada bilinçli yok sayılıyor (`announcements.approve` Teacher'da yok). Red gerekçesi bloğu denetim izinden üretiliyor (`announcementRejection`, core).<br><br>**Tarihsel kayıt (C4'teki ölçüm):** `TeacherAnnouncementsPage` yalnız iki durum tanır: "yeni duyuru formu" ve "Duyurularım tablosu". Detay çizen kol, alabileceği parametre, hatta tıklanabilir tablo satırı bile yok; detay bileşenlerinin (gönderim raporu, denetim izi, geri çekme) hiçbiri ithal edilmiyor. Sonuç: öğretmenin **yayınlayan** şapkalı bildirimleri web'de ara listeye iniyor. Etki ölçüldü: beş türün **dördü** (`Approved`, `Withdrawn`, `ScheduledExecuted`, `ScheduleFailed`; `Rejected` etkilenmiyor, adresi zaten liste). En ağırı `ScheduledExecuted` — bildirimin var oluş sebebi gönderim raporudur ve rapora web'den ulaşılamıyor. **Gerileme değil** (önce de aynıydı; C4 okuyucu kolunu ayırarak iyileştirdi), ama kapatmak **yeni bir ekran** = ürün kararı. Karar ne olursa olsun DYR-F-18'e karşılık ya da istisna yazılmalı. Obsidian karar defterinde `K-05` / `E-07` |
| **C4-22** | **Bildirim türü sözleşmesinin testi yok** | Backend `NotificationKind`te **sekiz** duyuru türü var (16–23); istemcinin `NOTIFICATION_KIND_CONFIG`i **yedi** taşıyordu ve `AnnouncementScheduleFailed` satırda jenerik "Bildirim" + zil olarak görünüyordu. C4 kapanışında elle kapatıldı, ama iki tarafın eşitliğini koruyan bir sözleşme testi yok — backend'e dokuzuncu tür eklendiğinde aynı sessiz düşüş tekrarlanır. Aynı risk `ANNOUNCEMENT_NOTIFICATION_HAT` tablosu için de geçerli |
| **C4-23** | **`modules/announcements/` dokümanlarında 107 `{{TBD}}` duruyor** | §15 "~110 `{{TBD}}` bu belgeden beslenerek doldurulur" diyordu. Ölçüldü (2026-08-09): dokuz dosyada **107** `{{TBD}}` hâlâ yerinde. C3 ve C4 yalnız `api-contracts.md`ye ekleme yaptı. `permission-matrix.md` ve `notification-matrix.md` ✅ tamamlandı — kalan iş bu dokuz modül dokümanı |

### C4 kapanışında sorulan ÜRÜN KARARLARI — ✅ ikisi de karara bağlandı (2026-08-09)

Aşağıdaki iki soru bütün-dal gözden geçirmesinde çıktı, kullanıcıya sunuldu ve
**ikisi de aynı gün karara bağlanıp uygulandı.** Sorunun kendisi tarihsel kayıt olarak
duruyor; kararlar her bölümün sonundadır.

#### I-2 — Öğretmen **alıcı** olduğunda `surface: "manager"` sözleşmesi → ✅ ÇÖZÜLDÜ

Aynı sözleşme **iki katmanda iki farklı yanlış** üretiyordu ve ikisi de ölçüldü.

**Nasıl oluşuyor:** yayın bildiriminin alıcıları kova listesinden gelir ve
`{parent, teacher, student}` karışıktır — yani bir öğretmen, **başkasının** duyurusunun
alıcısı olabilir (müdürün tüm personele duyurusu). Bildirim `/announcements/{id}` taşır.
`announcementRoleSurface("teacher")` → `"authored"` → `resolveNotificationTarget` →
`surface: "manager"`.

- **Mobilde:** öğretmen yönetim detayına (`announcements/[id]/index`) iner. Orada
  **kendisine ait olmayan** bir duyurunun "Geri çek" düğmesini ve gönderim raporunu
  görür; uç ikisini de **403** ile reddeder (`AnnouncementLifecycleGuard.CanActOn` →
  `caller.IsManager || PublisherId == caller.PersonId`). Yani çalışmayan eylemler ve
  hataya düşen bir rapor.
- **Web'de:** `notificationHref` öğretmen için `/announcements/{id}` üretiyor, rota
  `AnnouncementsScreen`e gidiyor, orası `activeRole === "teacher"` görünce **`entry`yi
  düşürüp** `TeacherAnnouncementsPage`e yolluyor. Sonuç: derin bağlantı **ara listeye**
  iniyor — **DYR-F-18'in doğrudan ihlali.** Bu ayak hiçbir görev gözden geçirmesinde
  görünmemişti; yalnız bütününe bakınca çıktı.

> ### ✅ KARAR (2026-08-09) — yüzey ROLDEN değil BİLDİRİM TÜRÜNDEN seçilir
>
> Kullanıcı "backend kapsam dışı değil" dedi; bunun üzerine sekiz duyuru bildirimi
> handler'ının alıcı kümesi kaynağında okundu. **Sonuç: backend'e dokunmaya gerek yoktu** —
> tür, alıcının şapkasını zaten kesin söylüyor (`Published`/`Amended` → alıcı kümesi
> `AnnouncementRecipients`; kalan beşi → `[PublisherId]`; `SubmittedForApproval` → izin
> zinciri). Ve `kind` istemcide zaten vardı; `resolveNotificationTarget` onu almıyordu.
>
> **Uygulanan:** `ANNOUNCEMENT_NOTIFICATION_HAT` + `announcementDetailSurface`
> (`packages/core`, testli). `kind` parametresi **zorunlu** — unutulan çağrı yeri
> typecheck'te yakalanır. Bilinmeyen tür `null`a çözülür (satır tıklanamaz), testli.
> Web'de öğretmen + okuyucu şapkası → satır tıklanamaz (K-7 gereği web'de öğretmen okuma
> yüzü yok). Veli/öğrenci/yönetici davranışı **değişmedi** — iki erken dönüş türe hiç
> bakmıyor ve ikisi de mutasyonla bağlı.
>
> **Karşılaştırma (ölçüldü):** backend'de netleştirmek `Enqueue` imzasında 24 çağrı yeri +
> Hangfire job imzası + 18 test dosyası demekti; istemci çözümü tek parametre.
>
> **Yan bulgu:** `AnnouncementScheduleFailed` istemcide hem şapka tablosunda hem
> `NOTIFICATION_KIND_CONFIG`te eksikti (backend 8 / istemci 7) — o bildirim satırda jenerik
> "Bildirim" olarak görünüyordu. İkisi de kapatıldı. Bir sözleşme testi yok → `C4-22`.
>
> **Kalan:** web'de öğretmenin **yayınlayan** şapkası hâlâ ara listeye iniyor, çünkü web'de
> öğretmen detay yüzeyi hiç yok. Yeni ekran gerektirdiği için ayrıldı → `C4-21`.

#### I-5 — Mobil geri alma onaysız ve sessiz → ✅ ÇÖZÜLDÜ

`WithdrawReason` **veri kaybıdır**: `oksis-api` `Announcement.Restore()` içinde
`WithdrawReason = null` yazılır, yani geri çekme gerekçesi kayıttan kalıcı olarak silinir.

- **Web:** `RestoreModal` — "Vazgeç" + onay düğmesi, gövdede *"Geri çekme gerekçesi
  kayıttan silinir."*
- **Mobil:** işlem menüsünde tek dokunuş; `Alert` geçen satır sayısı **0** (ölçüldü).
- **Kardeş eylem tutarsız:** aynı mobil ekranda **"Geri çek"** bir sheet + onay adımı
  ister; onun **iptali** hiçbir şey istemez.

Planın kendi kusuru: onay katmanı yalnız web ayağına yazıldı (bkz. plan, Task 3 düzeltme
notu).

> ### ✅ KARAR (2026-08-09) — mobile de onay eklendi
>
> `RestoreSheet` — kardeş `WithdrawSheet` kalıbı (aynı `Sheet`, aynı iki düğmeli altlık,
> "Vazgeç" solda ghost). Gövde üç kolun ne olacağını ve *"geri çekme gerekçesi kayıttan
> silinir"* uyarısını taşır. Cümleler web modalıyla **tek kaynaktan** gelir
> (`restoreNotice`, core) — iki yüzey ayrışamaz. `restorePending` davranışı korundu.
>
> Metnin her parçası backend'de ölçüldü: `Restore()` → `Status = previous` (koşulsuz
> `published` değil); `Withdraw` yalnız `Published/Expired/Scheduled`tan çalışır, yani
> dönülebilecek statü **tam olarak** o üç kol; `WithdrawReason = null` gerçekten yazılır ve
> arşiv satırındaki "Gerekçe:" satırı bu yüzden kaybolur (ekran görüntüsüyle kanıtlandı).
>
> Gözden geçirmede bir yan kusur daha çıktı ve düzeltildi: "Vazgeç" düğmesine konan
> `disabled={pending}` hem etkisizdi (sheet arka plandan ve Android geri tuşundan zaten
> kapanıyordu) hem de kardeş kalıptan sapıyordu — kaldırıldı, `WithdrawSheet` ile hizalandı.

---

### C5'te (2026-08-09/10) ölçülerek eklenen backlog

Şablon yönetimi dilimi (kişisel şablon, "Şablon olarak kaydet", kullanım sayacı,
öğretmen web detayı, mobil şablon CRUD) kapatılırken **ölçülerek** bulunan, C5 kapsamı
dışında bırakılan işler. On altı görevin gözden geçirme triyajı + kullanıcı kararı
görevi (12b). Kapanan maddeler bu tabloda YOKTUR.

**Atıf kuralı C4'ten devam eder:** satır numarası değil sembol/dosya adı. Her satırın
ölçümü ve ölçüm tarihi yazılıdır; hiçbiri varsayım değildir.

| # | Madde | Ölçüm ve etki |
|---|---|---|
| **C5-1** | **Red gerekçesi telde bir DTO alanı DEĞİL — istemci onu denetim izindeki iki sabit dizeden okuyor** | `announcementRejection` (`packages/core/.../announcements/logic.ts`) izdeki `action === "duyuruyu reddetti"` satırını bulup `tag`in `"Gerekçe: "` önekini soyuyor. Alan gerçekten yok: `Announcement.cs`teki TEK gerekçe alanı `WithdrawReason`'dır ve `Reject()` hiçbir alana yazmaz. Önek TEK BAŞINA yetmez — `WithdrawAnnouncementCommandHandler` de aynı öneki kullanır, ayrım yalnız `action`dadır. Bugün sahipsiz değil (bir backend testi iki sabiti tek iddiada tutuyor: `AnnouncementApprovalTests`), ama backend metni değiştirirse **iki backend testi kırılır ve istemci SESSİZCE boşalır** — kullanıcı "Reddedildi" başlığını gerekçesiz görür. Bu bir kırılganlıktır; ileride `AnnouncementDto`'ya alan eklemek gündeme gelirse **ilk aday budur** |
| **C5-2** | **Şablon `Description` 4000'e çıktı, duyuru `Body` hâlâ SINIRSIZ** | K5 kararıyla `AnnouncementTemplateConfiguration.Description` 500 → 4000 (migration `20260809_announcement_templates_personal`, `AlterColumn` ölçüldü). `AnnouncementConfiguration` `Body`'ye `HasMaxLength` **vermez**. Sonuç: 4000'i aşan bir duyurudan "Şablon olarak kaydet" ile şablon üretmek **400** döner. İstemci bunu `TEMPLATE_BODY_MAX` ile `maxLength`e çevirip kesiyor — yani akış **kayıpsız değildir**, uzun gövde sessizce kırpılır. Tavanı kaldırmak ya da kırpmayı kullanıcıya söylemek ayrı bir karardır |
| **C5-3** | **Mobil şablon ekranının yetki kapısı YOK** | `apps/mobile/.../templates-screen.tsx` ve `template-form-screen.tsx`te `readOnly` benzeri bir kapı yok (grep `readOnly\|template.manage\|canManageTemplate` → mobil şablon yüzeylerinde **0**, ölçüldü 2026-08-10). İzin verisi telde var, okuyan istemci kodu yok. C4 ölçümü hâlâ geçerli. **Bugün sorun üretmiyor**, çünkü K1 ile `announcements.template.manage` öğretmene de verildi ve şablon ekranına erişen her rol o izne sahip; izin bir rolden geri alınırsa ekran sessizce 403 üretmeye başlar |
| **C5-4** | 🔶 **Migration'ın `Down` kolu VERİ-BAĞIMLI olarak geri alınamaz — rollback runbook notu** | `20260809_announcement_templates_personal.Down` iki veri bağımlı adım taşıyor (dosya okundu 2026-08-10): **(1)** eski `IX_..._SchoolId_Name` **unique** indeksini yeniden kuruyor — C5'ten sonra **iki farklı sahip aynı şablon adını** kullandıysa `CREATE UNIQUE INDEX` duplicate key ile düşer; **(2)** `description`ı `nvarchar(4000)` → `nvarchar(500)` daraltıyor — 500 karakteri aşan tek bir şablon metni varsa truncate hatası verir. **İkisi de GÜRÜLTÜLÜ hatadır** (sessiz veri kaybı değil): rollback yarıda durur, veri bozulmaz. Kod değişikliği gerekmiyor; gereken şey **rollback runbook'unda** bu iki ön koşulun yazılı olması (geri alma öncesi çakışan ad ve 500'ü aşan metin sorgulanmalı) |
| **C5-5** | 🔴 **Acil işareti yetki kapısının GERİYE DÖNÜK KOLU YOK** | Kullanıcı kararı (2026-08-10) `Urgent = true`'yu `announcements.approve` iznine bağladı; kapı `CreateAnnouncementCommandHandler`'da ve `AsDraft` dallanmasının ÖNÜNDEDİR, yani bugünden sonra yetkisiz çağıran acil kayıt **üretemez**. Ama **kapıdan ÖNCE** bir öğretmenin `Urgent = true` ile kaydettiği taslak/onay bekleyen duyuru varsa: `ApproveAnnouncementCommandHandler` ve `PublishScheduledAnnouncementsJob` `Urgent`'ı **hiç sorgulamıyor** (grep `Urgent` → her ikisinde **0 isabet**, ölçüldü 2026-08-10), dolayısıyla o kayıt **acil olarak yayına çıkar**. Backfill C5 kapsamı dışındaydı. Etki dev verisinde sıfıra yakındır ama prod'a çıkmadan önce ya bir backfill ya da yayın yolunda ikinci bir kapı gerekir |
| **C5-6** | **Acil kapısının TÜRKÇE MESAJI korumasız DEĞİL, ERİŞİLEMEZDİ — taşıma yolu açıldı, backend koruması hâlâ açık** | **Düzeltme (2026-08-10).** Bu satırın ilk hâli sorunu eksik teşhis ediyordu: cümle yalnız testsiz değildi, **hiçbir ekrana ulaşmıyordu**. Ölçüm: `oksis-ui` `packages/api` `client/mutation-error.ts` `case 403` **koşulsuz** *"Bu işlem için yetkiniz yok."* döndürüyor, sunucunun `errors[0].message`'ını atıyordu; duyuru yüzeylerinin hiçbiri `err.message`'ı doğrudan taşımıyor. Yani *"Acil işareti yalnız okul yönetimi tarafından kullanılabilir."* **üründe hiçbir yerde görünmüyordu** — üstelik `ResultExtensions.MapStatusCode` docblock'u tam tersini (istemcinin çıplak 403 görmesini ENGELLEMEK için `Result<T>.Forbidden()` kullanılmadığını) iddia ediyordu. **Şimdi:** 403 kolu ikiye bölündü ve bölmeyi **hata kodu** yapıyor — kod `DOMAIN_FORBIDDEN_CODE_PREFIXES` (bugün yalnız `Announcements.`) ile başlıyorsa sunucunun Türkçe cümlesi geçer, jenerik kodlarda sabit cümle konur. Ayrımın **kodla** yapılması zorunluydu, statüyle değil: jenerik yol `AuthorizationBehavior`/`TenantContextBehavior` → `ForbiddenException` (kod `Forbidden`, mesaj *"Access denied."* / *"This operation requires SuperAdmin privileges."*), `Result.Forbidden()` → `Error.Forbidden` + *"Access denied."*, `TenantRequired` → *"This operation requires a tenant context."* — koşulsuz geçirmek bu **İngilizce** metinleri ekrana basardı. Sezgisel bir *"kodda nokta varsa modül kodudur"* kuralı da yanlış olurdu: `identity.account.suspended` noktalıdır ama mesaj alanında bir **çeviri anahtarı** taşır (`identity.errors.account-suspended`, `AccountErrors.cs`) ve ekrana ham anahtar sızardı — bu yüzden kural açık bir önek **listesidir**. **Dört** yeni testle çivili (`mutation-error.test.ts`, dosya **12 → 16** `it` bloğu — ölçüldü 2026-08-10, commit `f012999`; api 135 → 139 ile tutarlı); üç mutasyon ölçüldü: geçirme kolu kaldırılınca 1 test, jenerik kol geçirir yapılınca 3 test (biri C5 öncesinden), boş-mesaj koruması kaldırılınca 1 test düşüyor. **AÇIK KALAN:** cümlenin **backend tarafındaki** koruması yok — `ResultExtensionsAnnouncementsTests.Should_Map403_When_UrgentIsNotPermitted` hâlâ yalnız `StatusCode == 403` iddia ediyor, `CreateAnnouncementTests` negatif kolu `.WithMessage("*Announcements.Urgent.Forbidden*")` ile yalnız **kodu** eşliyor. İstemci testi cümleyi bir **fixture** olarak taşır, sunucunun onu ürettiğini doğrulamaz; backend'de metni boşaltan bir mutasyon hâlâ hiçbir testi düşürmez |
| **C5-7** | 🔶 **Kaydedilmiş bir TASLAK bu sürümde ne DÜZENLENEBİLİYOR ne YAYINA ALINABİLİYOR** | Zincirin dördü de ölçüldü (2026-08-10): `Publish()` `Draft`ı kabul ediyor ama **iki çağıranı da kaydedilmiş taslağa erişemiyor** — `CreateAnnouncementCommandHandler` aynı istekte yarattığı yeni kökü yayınlar, `PublishScheduledAnnouncementsJob` `Status == AnnouncementStatus.Scheduled` süzgeciyle çeker. `Approve()` `PendingApproval` ister. Taslağı o iki statüye taşıyacak ikinci yol yok: `MarkScheduled`/`MarkPendingApproval`ın **TEK çağıranı** `CreateAnnouncementCommandHandler`'dır. `Amend()` `Published` ister. Yani taslak yazıldığı anda **çıkmaz sokaktır**. Bugünkü çıkış yolu: metni "Şablon olarak kaydet" ile saklayıp **yeni duyuru** göndermek.<br><br>**Yan bulgu:** iki depoda da bunun tersini vaat eden docblock var — `Announcement.Reject()` özeti *"Öğretmen düzeltip yeniden gönderebilir."* diyor, `announcementRejection` docblock'u aynı cümleyi tekrarlıyor. Ekrandaki karşılığı C5 Görev 13'te düzeltildi, **kaynaktaki iki cümle duruyor** |
| **C5-8** | **TASLAKLAR okul yönetiminin envanterinde görünüyor** | `GetAnnouncementsQueryHandler`'da varsayılan bir statü kapısı **yok** (okundu 2026-08-10): temel sorgu yalnız `a.SchoolId == schoolId`; `scope` ve `statuses` süzgeçleri **isteğe bağlıdır**. Yani öğretmenin taslağı, hiçbir filtre verilmediğinde yönetimin envanter listesine düşer. Ekran eskiden *"listede yalnız siz görürsünüz"* diyordu; o cümle C5'te düzeltildi ama **sunucu davranışı olduğu gibi duruyor**. Taslağın kişisel mi kurumsal mı olduğu bir ürün kararıdır |
| **C5-9** | **Şablon ad benzersizliği ÖRNEK COLLATION'ına bağlı** | Modelde hiçbir kolon collation'ı sabitlenmemiş: `grep -rn "HasCollation\|UseCollation" src/` → **0** (ölçüldü 2026-08-10). Dolayısıyla `IX_..._SchoolId_CreatedBy_Name` benzersizliği örnek varsayılanına düşer (dev'de case-insensitive + accent-sensitive). İstemcinin uyarısı `toLocaleLowerCase("tr")` ile kuruluyor ve bugün sunucuyla örtüşüyor — ama `Turkish_CI_AS` ile kurulmuş bir prod örneği bu aynayı **tersine çevirir** ve kullanıcı ya sahte uyarı ya da uyarısız 409 alır. `Name` kolonuna EF'te açık `HasCollation` vermek bağımlılığı tamamen kaldırırdı |
| **C5-10** | **`npm run codegen` betiği URL'yi `localhost:5112`'ye SABİTLİYOR** | `packages/api/package.json`: `openapi-typescript http://localhost:5112/openapi/v1.json -o src/generated/schema.ts` (okundu 2026-08-10). Şema artık **donmuş bir sözleşmedir** (C5'te `templateId` eklendi). Betik bayat bir 5112 sürecine karşı koşulursa `templateId` **sessizce geri alınır** ve kullanım sayacı zinciri typecheck'i geçerek ölür. Port/URL parametreleştirilmeli ya da betik üretilen şemayı bir sürüm damgasına karşı doğrulamalı |
| **C5-11** | **MSW ayrışmaları istemci doğrulamasını sınırlıyor** | Dördü de ölçüldü (2026-08-10): **(a)** `buildAuditTrail` (`packages/api-mocks/.../announcement-data.ts`) *"duyuruyu reddetti"* satırını **HİÇ üretmiyor** (grep `reddetti` → `packages/api-mocks/src` altında **0**), yani red gerekçesi bloğu (C5-1) mock'ta uçtan uca koşulamıyor. **(b)** `:reject` handler'ı gerekçeyi `withdrawReason`'a yazıyor — gerçek uç hiçbir alana yazmaz, gerekçe yalnız denetim izindedir. **(c)** Mock create handler'ı `body.asDraft ? "draft" : body.scheduledAt ? "scheduled" : "published"` diyor; **`pendingApproval` dalı yok** — eşikli modda öğretmenin duyurusu gerçek uçta onaya düşer ve kullanım sayacı ARTMAZ, mock'ta yayınlanır ve ARTAR. **(d)** `apps/web` MSW'sine `sessionHandlers` **bilinçli olarak** eklenmedi (`packages/api-mocks/src/index.ts` gerekçeyi yazıyor), bu yüzden **web mock modunda öğretmen yüzü açılamaz** — rol yöneticiye düşer. C5'in öğretmen yüzeyleri gerçek backend + DEV hızlı giriş ile doğrulandı |
| **C5-12** | **Boş sunucu mesajı deliğinin KÖKÜ hâlâ açık** | C5 Görev 15 bunu **merkezi** yerde (`packages/api/src/client/mutation-error.ts`) kapattı ve beş yüzey tek satır değişmeden düzeldi. Ama kök `packages/api/src/client/errors.ts`tedir: `super(errors[0]?.message ?? "Beklenmeyen bir hata oluştu.")` — `??` yalnız `null`/`undefined`ı yakalar, **boş dizeyi geçirir**; `||` bu deliği global olarak kapatırdı. Ayrıca `mutationErrorDesc`i **atlayıp** `err.message`ı doğrudan ekrana taşıyan **dört yüzey** var (ölçüldü 2026-08-10, hepsi duyurular DIŞI): `apps/web/features/attendance/retro-modal.tsx`, `apps/web/features/schedule/autogen-drawer.tsx`, `apps/web/features/roll-call/roster.tsx`, `apps/mobile/.../attendance/components/roster-screen.tsx` |

### C5 kapanışı — counseling migration'ı: ÇAKIŞMA DEĞİL, YENİDEN ÜRETİM (2026-08-10)

> Bu bir kod maddesi değil, bir **sıra** maddesidir. **Düzeltme (2026-08-10):** bu notun
> ilk hâli hem riski yanlış ölçüyordu hem de uyardığı hasarı bizzat üreten bir adım
> öneriyordu (`dotnet ef migrations remove`). İkisi de aşağıda ölçülerek değiştirildi.

**Durum (ölçüldü 2026-08-10, `oksis-api`).** `stash@{0}` ("counseling dersi kaldirma
calismasi — C5 oncesi kenara alindi") C5'ten bağımsız bir migration taşıyor:
`20260807213717_20260808_remove_counseling_subject` (`.cs` + `.Designer.cs`, stash'in
**untracked** kolunda — `stash@{0}^3`). Migration'ın `Up`'ı yalnız **13 `DeleteData`**,
`Down`'ı iki `InsertData` içeriyor; şema değil **seed** işidir.

**ÇAKIŞMA YOK — sıradan bir `git stash pop` C5'i korur.** Bu notun ilk hâli stash'teki
`OksisDbContextModelSnapshot.cs`'in "bütün dosyayı değiştirdiğini (16618 → 16497)"
söylüyordu; o rakam `git show <stash>` çıktısının **birleşik-fark (combined diff)
yapaylığıdır** — stash bir merge commit'idir (`git rev-list --parents`: üç ebeveyn) ve
`git show` üçünü birden özetler. Gerçek yama `git diff stash@{0}^ stash@{0}` ile
ölçülünce **121 silme / 0 ekleme, iki hunk** (3316 ve 4601; hepsi counseling `HasData`
seed satırı). C5'in snapshot hunk'ları **4956 / 5246 / 5293 / 10699**'da — kesişme yok.
Üç yollu birleştirme depoya yazmadan fiilen koşturuldu (`git merge-file -p`, çıkış kodu
**0** = sıfır çakışma): sonuçta `template_id` **iki**,
`ix_announcement_templates_school_id_created_by_name` **bir** kez geçiyor, counseling seed
satırları da düşmüş. İki dalın ortak tek dosyası zaten snapshot'tır; stash'in diğer altı
dosyasına C5 hiç dokunmuyor. Yani *"counseling işi C5'in şema değişikliğini snapshot'tan
düşürür"* iddiası **desteklenmiyor**.

**Asıl sorun başka: KİMLİK TERS ve DESIGNER BAYAT.**

1. **Damga ters.** Counseling `20260807213717`, C5 `20260809194112`. Migration geçmişi
   kronolojik olmaz; counseling migration'ı, kendisinden **sonra** yazılmış bir
   migration'ın **öncesinde** duruyormuş gibi görünür.
2. **`.Designer.cs` C5 ÖNCESİ modelden üretilmiş.** İçinde `template_id` **bir** kez
   geçiyor (C5'li model: **iki**) ve `ix_announcement_templates_school_id_created_by_name`
   **sıfır** kez (C5'li model: **bir**). Migration'ın kendi anlık görüntüsü yanlıştır;
   dosya elle düzeltilse bile yanlış kalır.

**`dotnet ef migrations remove` ÖNERİLMEZ — bu notun ilk hâlinin en tehlikeli satırıydı.**
Komut **en büyük kimlikli** migration'ı seçer; iki migration bir aradayken bu
**C5'inkidir** (`20260809194112` > `20260807213717`). O adım C5'in migration'ını siler ve
snapshot'ı counseling'in bayat `.Designer.cs`'inden geri kurar — yani aşağıdaki
`has-pending-model-changes` kırmızısına giden **gerçek** yol tam olarak budur.

**Doğru sıra.**

1. **Önce C5 birleşsin** (`feature/announcements-c5` → hedef dal).
2. `git stash pop` — snapshot temiz birleşir, C5 öğeleri korunur (yukarıda ölçüldü).
3. İki counseling migration dosyası (`20260807213717_….cs` ve `….Designer.cs`)
   **elle silinsin**. `migrations remove`'a gerek yok: dosyalar hâlâ **izlenmiyor**
   (stash'in untracked kolundan geliyorlar), silmek yeterlidir.
4. `git checkout -- src/Oksis.Infrastructure/Persistence/Migrations/OksisDbContextModelSnapshot.cs`
   ile snapshot C5'li hâline döndürülsün. **Gerekçe:** `migrations add` farkı bu dosyaya
   karşı alır; pop sonrası snapshot counseling satırlarını zaten düşürmüş olur
   (`Category = "Counseling"` → **0**, C5'li snapshot'ta **1**), yani bu adım atlanırsa
   yeni migration **boş** çıkar.
5. C5'li model üzerinde `dotnet ef migrations add <YYYYMMDD_name>` koşulsun. Böylece hem
   damga C5'in ardına düşer hem de `.Designer.cs` **C5'li modelden** üretilir.

**Kapanış kontrolü — ayırt edici olanı.** `dotnet ef migrations has-pending-model-changes`
**yeşil** olmalı. Snapshot'ta `template_id` saymak **ayırt edici DEĞİLDİR**: hiçbir şey
yapılmasa da C5'in snapshot'ında zaten iki kez geçer. Ayırt edici olan üç ölçüm:

- yeni migration'ın **`.Designer.cs`**'inde `template_id` **iki**, indeks adı **bir** kez
  (bayat Designer'da sırasıyla **bir** ve **sıfır**dı) — Designer'ın tazeliğini yalnız bu
  gösterir;
- yeni migration'ın damgası `20260809194112`'den **büyük**;
- snapshot'ta `Category = "Counseling"` **sıfır** kez (C5 birleşir birleşmez **bir**dir) —
  counseling işinin fiilen indiğini yalnız bu gösterir.

**Belirti.** Bir şey ters giderse `dotnet ef migrations has-pending-model-changes`
**kırmızıya** döner (kod `TemplateId`i ve indeksi tanımlarken snapshot onları içermez).
Veri kaybı değil, **model/snapshot ayrışmasıdır**; fark edilmezse bir sonraki migration bu
iki öğeyi "yeni" sanıp tekrar eklemeye kalkar ve prod script'i çakışır.
