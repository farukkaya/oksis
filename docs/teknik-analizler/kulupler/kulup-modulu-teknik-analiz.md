# Kulüp (Clubs) Modülü — Teknik Analiz

**Yazım:** 28 Ağustos 2026 · **Revizyon:** 29 Ağustos 2026 (OS push + FE uyumu)
**Kapsam:** Önerilen "Okul Kulüpleri MVP" tasarımının `oksis-api` altyapısına uygunluğu ve modülün yazım planı

> **Kaynak beyanı.** Bu belgedeki her ifadenin dayanağı bu depodaki çalışan
> koddur; dosya ve satır referansları verilmiştir. Dayanağı olmayan yerler
> "**karar bekliyor**" diye işaretlidir. Ölçüm tarihi 28 Ağustos 2026'dır.

> **Revizyon notu (29 Ağustos 2026).** İlk yazım iki şeyi görmüyordu:
> (1) OS push altyapısı o gün henüz merge edilmemişti — bugün `oksis-api`
> `1acf29a`'da FCM push kanalı, cihaz kaydı, veli tercihi ve matris push
> ekseni çalışıyor; kulüp bildirimlerinin push'a bağlanma yolu **§18**'dedir.
> (2) Kulüp ekranları Claude Design'dan `oksis-ui` `1fec5aa`'ya portlandı
> (web `c23c7c0`: yönetici + öğretmen, mobil `144a0ba`: öğrenci + öğretmen +
> veli) ve FE **kendi sözleşmesini yazdı** (`packages/api/src/club/contract.ts`,
> 34 operasyon). Bu sözleşme §10'daki 22 uçluk öneriyi **geçersiz kılar**;
> §10 FE sözleşmesiyle değiştirildi, sapmalar **§19**'da, ayarlar **§20**'de.
> §4–§9'daki varlık/enum adları domain adıdır; telde FE'nin adları geçer
> (**§4.6**). Uygulamaya geçerken sıra: §16 kararları → §14 fazları → §18–§20.

---

## 0. Yöntem — neye bakıldı

| Kaynak | Konum | Ne söyler |
| --- | --- | --- |
| **Temel sınıflar** | `src/Oksis.Domain/Common/` | Tenant, audit, soft delete, domain event tabanı |
| **Emsal modül (yazma+yayın)** | `src/Oksis.Domain/Modules/Homework/`, `…/Application/Modules/Homework/ARCHITECTURE.md` | Durum makinesi, hedef dondurma, faz sırası |
| **Emsal modül (duyuru)** | `src/Oksis.Domain/Modules/Announcements/` | Kurumsal kayıt, hedef kitle, moderasyon |
| **Emsal modül (etkinlik)** | `src/Oksis.Domain/Modules/Attendance/Entities/ActivityRollCall.cs` | Etkinlik + katılımcı + sayım zaten var |
| **Kesişim noktaları** | `IApplicationDbContext`, `OksisSchemas`, `PermissionSeedData`, `NotificationEventTypeSeedData`, `SeedDefaultModuleConfigsHandler` | Modülün bağlanacağı yuvalar |
| **Boru hattı** | `src/Oksis.Application/DependencyInjection.cs:45-54` | Davranış sırası sabittir |
| **Emsal belge** | `docs/analysis/odev-modulu-teknik-analiz.md` | Bu belgenin biçimi oradan alındı |

---

## 1. Kısa cevap — uygun mu?

**Evet, uygun.** Önerilen `Club → Membership → Event → Participation → Announcement`
zinciri OKSİS'in modüler monolit + CQRS + tenant-izolasyonlu yapısına **yapısal
olarak oturur**; taslakta mimariye aykırı tek bir kavram yoktur. Kulüp modülü,
bu depodaki **Ödev modülünün kardeşidir**: taslak/yayın durum makinesi, kişi
başına satır üreten bir katılım tablosu, bildirim üreten yayın anı ve okul
politikası kolonları — dördü de kanıtlanmış kalıplardır.

Uyum, tasarımın **olduğu gibi kodlanabileceği** anlamına gelmez. Taslak bir ürün
belgesidir; bu depo bir ürün belgesinden **dokuz noktada ayrılır** ve bu ayrımlar
sonradan düzeltilirse şema göçü gerektirir.

| # | Taslaktaki ifade | Bu depodaki karşılığı | Sonuç |
| --- | --- | --- | --- |
| K-1 | Kulüp okula bağlı | Kulüp okula **ve sezona** bağlı olmalı (`AcademicSessionId`) | **Şema değişikliği — §4.1** |
| K-2 | `StudentId`, `AdvisorTeacherId` | Öğrenci ve öğretmen bu depoda **`PersonId`**'dir | **Adlandırma — §3** |
| K-3 | `CoverImage` alanı | Dosya kolonda tutulmaz: `StoredFile` + `FileAttachment` | **Kolon kaldırılır — §11** |
| K-4 | `Status: Active/Passive` | Bu depoda durumlar **sayısal enum** + fluent `HasConversion<int>()` | Uyarlama — §4.1 |
| K-5 | `ClubAnnouncement` yeni tablo | `Announcements` modülü zaten var ama **kurumsal kayıttır** | **Karar gerekir — §6** |
| K-6 | "Etkinlik katılımı" | `ActivityRollCall` (gezi/tören sayımı) ile **karıştırılmamalı** | **Sınır çizilir — §7** |
| K-7 | `CreatedBy`, `CreatedAt` alanları | `TenantEntity` bunları **zaten verir**; tekrar tanımlanmaz | Kaldırılır — §4 |
| K-8 | "Event-Driven mimari, yeni servisler eklenebilir" | Bugün **in-process MediatR** domain event'i var; broker yok | **Beklenti düzeltmesi — §9** |
| K-9 | `Member/President/VicePresident` rolleri | Bunlar **yetki değil etikettir**; izin sistemine bağlanmaz | Sınır — §5.4 |

Bu dokuzu §3–§11'de tek tek gerekçelendirilmiştir. Yazım planı §14'tedir.

**Revizyonda eklenen sapmalar** — kaynağı taslak değil, portlanmış FE
sözleşmesi (`oksis-ui` `1fec5aa`) ve merge edilmiş push altyapısıdır:

| # | FE'nin/kodun beklediği | Bu belgenin ilk hâli | Sonuç |
| --- | --- | --- | --- |
| K-10 | Etkinlik **`activity`**, rota `/activities/{id}:publish` | `ClubEvent` | **Domain adı `ClubActivity`** olur (çift "Event" sorunu da biter) — §4.6 |
| K-11 | `advisorId`, `studentId` (semantiği person id) | `AdvisorTeacherPersonId`, `StudentPersonId` | Domain adı kalır, **telde FE adı** — §4.6 |
| K-12 | Kulüp durumu `active/draft/inactive/archived`; **oluşturmada danışman varsa `active`** | `Passive`; oluşturma hep `Draft` | `Inactive`; oluşturma kuralı mock'tan alınır — §4.6, §19 |
| K-13 | Kategori telde **Türkçe etiket** (`"Sosyal Sorumluluk"`) | `ClubCategory` int enum | Telde İngilizce kod; **FE sabiti değişir** — §19-F |
| K-14 | Başvuru ve üye **iki ayrı liste** (`applications` / `members`), `paused` üyelik | Tek `ClubMembership`, `Left` | Tek tablo kalır, **iki projeksiyon**; `Paused` eklenir, `Left` kalır — §4.6 |
| K-15 | Katılım `present` | `Attended` | Telde `present` — §4.6 |
| K-16 | Bildirim kind'ları `ClubActivity*`, `ClubApplicationDecided` | `ClubEvent*`, `ClubMembershipDecided` | **FE adları** esas — §9.2 |
| K-17 | 34 operasyon, öğrenci/veli yüzü `students/me`, `parents/me` kökünde | 22 uç, hepsi `/clubs` altında | §10 değiştirildi |
| K-18 | Push: `PushEventKeyMap` + `PushDeepLinks` + matris `SupportsPush` | Yalnız in-app | §18 |

---

## 2. Bugünkü durum — backend'de ne var

### 2.1 Modülün kendisi: yok

`src/Oksis.Domain/Modules/` altında 16 modül klasörü vardır; **`Clubs` yoktur**.
`src/Oksis.Application/Modules/` altında 18 klasör vardır; **`Clubs` yoktur**.
Depoda "kulüp" geçen üç yer vardır ve üçü de modül değildir:

- `FileCategories.ClubDocument` — dosya kategorisi kayıt defterinde **hazır**
  (`FileCategoryPolicyRegistry.cs:35`: pdf/docx/jpg, 20 MB, virüs taramalı,
  sezon + 1 yıl saklama). Modül yazılmadan önce tanımlanmış bir yer tutucudur.
- `GreedySolver.cs:124` — ders programı çözücüsünün "haftada yalnız 1 saati olan
  dersler (Kulüp, Koçluk, Rehberlik…)" yorumu. Bu **ders çizelgesindeki kulüp
  saatidir**, kulüp topluluğu değil (bkz. §3, karıştırma tablosu).
- Migration snapshot'larındaki kolon adları — ilgisiz.

### 2.2 Zaten hazır olanlar

| İhtiyaç | Karşılığı | Durum |
| --- | --- | --- |
| Tenant izolasyonu | `TenantEntity` + `IHasTenant` global query filter (`OksisDbContext.cs:249`) | ✔ |
| Silinmeyen kayıt tabanı | `PermanentTenantEntity` (duyuru emsali) | ✔ |
| Audit alanları | `AuditingInterceptor` (`CreatedAt/By`, `UpdatedAt/By`) | ✔ |
| Soft delete | `SoftDeleteInterceptor` + global filter (`OksisDbContext.cs:262`) | ✔ |
| Eşzamanlılık | `TenantEntity.RowVersion` (kontenjan yarışı için — §4.2) | ✔ |
| Domain event dağıtımı | `DomainEventInterceptor` + `PostCommitDispatchBehavior` | ✔ |
| CQRS + izin kapısı | `ICommand`/`IQuery` + `[RequirePermission]` + `AuthorizationBehavior` | ✔ |
| Doğrulama | FluentValidation + `ValidationBehavior` | ✔ |
| Öğrenci/öğretmen kimliği | `Person` + `StudentProfile`/`TeacherProfile` (TPH) | ✔ |
| Veli kapsamı | `ParentStudentRelationship` | ✔ |
| Öğretmen kapsamı | `ITeachingSlotReader`, `ITeacherClassroomScope` | ✔ |
| Sezon/dönem | `AcademicSession` + `AcademicTerm` | ✔ |
| Okul-yerel gün | `ISchoolCalendarService.GetLocalNowAsync` + `School.TimeZone` | ✔ |
| Tatil takvimi | `IHolidayCalendarReader` (etkinlik tarihi doğrulaması için) | ✔ |
| Dosya altyapısı | `StoredFile` + `FileAttachment` (polimorfik `EntityType`/`EntityId`) | ✔ |
| **Kulüp dosya kategorisi** | `FileCategories.ClubDocument` | ✔ **hazır** (ama kapak görseli için değil — §11) |
| Bildirim dağıtımı | `INotificationEnqueuer` → `DispatchNotificationJob` → `NotificationDispatcher` → **`InAppNotificationChannel` + `PushNotificationChannel`** (`NotificationChannelRegistration.cs:27-32`) | ✔ (revizyon) |
| **OS push (FCM)** | `PushNotificationChannel` beş kapı + `FcmSender`; kapsam `PushEventKeyMap`; derin bağlantı `PushDeepLinks`; cihaz `user_devices`; tercih `notification_preferences` | ✔ **hazır, kulüp eşlemesi yok — §18** |
| Zamanlanmış iş | Hangfire + `UseOksisRecurringJobs()` (`Program.cs:288`) | ✔ |
| Hata sözleşmesi | `Result<T>` / `Error(Code, Message)` + `ToHttpResult` | ✔ |
| **Modül anahtarı** | `module_configs` → `clubs` | ✘ **yok — §12** |
| **İzinler** | `clubs.read` / `clubs.write` / `clubs.manage` | ✘ **yok — §5** |
| **Bildirim olay tipi** | `CLUB_*` + `NotificationEventGroup.Club` | ✘ **yok — §9** |
| **Bildirim kind** | `NotificationKind.Club*` | ✘ **yok — §9** |

Yani **altyapının tamamı hazırdır**; eksik olan üç seed satırı, bir modül
anahtarı ve modülün kendisidir.

### 2.3 Emsal modül: Homework

Kulüp modülü yapı olarak **Ödev modülünün ikizidir** ve o mimari bu depoda
kanıtlanmıştır (`src/Oksis.Application/Modules/Homework/ARCHITECTURE.md`):

| Ödev | Kulüp karşılığı |
| --- | --- |
| `Homework` (şube × ders × son teslim) | `Club` (okul × sezon × kulüp) |
| `HomeworkTracking` (ödev × öğrenci) | `ClubActivityParticipation` (etkinlik × öğrenci) |
| `HomeworkTargetStudent` (taslakta yaşar) | — (kulüpte hedef yoktur, üyelik vardır) |
| `HomeworkAttachment` | `FileAttachment` (`EntityType = "Club"`) |
| Draft → Published → Closed/Cancelled | Draft → Published → Completed/Cancelled |
| Yayın anında bildirim | Yayın anında bildirim |

Kulübün Ödev'den ayrıldığı **tek yapısal nokta**: ödevde hedef yayın anında
dondurulur, kulüpte **üyelik kalıcı ve akışkandır** — öğrenci sezon içinde
katılır, ayrılır, yeniden katılır. Bu fark §4.2'de üyeliğin durum makinesini
doğurur.

---

## 3. Kavramlar — karıştırma

| Kavram | Karşılığı | Durum taşır mı |
| --- | --- | --- |
| **Kulüp** (`Club`) | okul × sezon × kalıcı topluluk | Evet (Draft/Active/Inactive/Archived) |
| **Üyelik** (`ClubMembership`) | kulüp × öğrenci | Evet (Pending/Active/Paused/Rejected/Left) |
| **Etkinlik** (`ClubActivity`) | kulübün düzenlediği tek faaliyet | **Evet — yayın birimi budur** |
| **Katılım** (`ClubActivityParticipation`) | etkinlik × öğrenci | Evet (Registered/Present/Absent/Cancelled) |
| **Kulüp duyurusu** (`ClubAnnouncement`) | kulübe özel kısa haber | Hayır (yayınlanır, geri çekilmez) |

**K-2 — bu depoda "öğrenci" `PersonId`'dir.** Taslaktaki `StudentId`/
`AdvisorTeacherId` adları bu depoda karşılıksızdır. Öğrenci `Person`
aggregate'idir; `StudentProfile` ona TPH ile bağlı bir profildir ve kendi Id'si
kimlik olarak dolaşmaz. Ödev modülü aynı kararı `OwnerTeacherPersonId` ve
`HomeworkTracking.StudentPersonId` adlarıyla uygular. Kulüpte de alan adları
**`AdvisorTeacherPersonId`** ve **`StudentPersonId`** olmalıdır. `StudentId`
yazmak, altı ay sonra `StudentProfile.Id` ile `Person.Id` karıştırıldığında
sessizce boş liste dönen bir sorgu üretir.

**Kulüp ≠ ders programındaki "Kulüp" dersi.** `GreedySolver.cs:124` haftada bir
saatlik bir **ders**ten söz eder; o saat `Subject` kataloğundadır ve şubeye
bağlıdır. Kulüp modülünün topluluğu şubeden bağımsızdır: 9-A'dan da 11-C'den de
öğrenci alır. İkisi arasında bugün bağ **yoktur ve MVP'de kurulmamalıdır**;
kurulursa "kulüp saati olan şubede kulüp üyeliği zorunlu mu" sorusu doğar ve bu
soru MVP'nin kapsamında değildir.

**Kulüp etkinliği ≠ Etkinlik Yoklaması.** Bkz. §7 — bu ayrım modülün en kolay
yanlış yapılacak yeridir.

---

## 4. Varlık tasarımı (öneri)

Beş varlık. Şema: **`[school]`** (duyuru emsali — `AnnouncementConfiguration.cs:20`
`ToSchoolTable`). `[academic]` seçilmedi: kulüp akademik bir kayıt değildir, notu
ve dönemi yoktur; okulun sosyal hayatına aittir.

Tümü `TenantEntity`'den türer (soft delete + `RowVersion` + audit hazır gelir),
tek istisna §4.5'tedir. **`CreatedAt`/`CreatedBy` alanları yeniden tanımlanmaz** —
taslaktaki `ClubActivity.CreatedBy`/`CreatedAt` satırları tabandan gelir (K-7).

### 4.1 `Club` — aggregate root

```
Club : TenantEntity                       → [school].clubs
  SchoolId              Guid              (tabandan)
  AcademicSessionId     Guid              ← K-1, taslakta YOK
  Name                  string(120)
  Description           string(2000)?
  Category              ClubCategory      (enum, HasConversion<int>)
  AdvisorTeacherPersonId Guid             ← K-2
  Capacity              int?              (null = sınırsız)
  Status                ClubStatus        (Draft/Active/Inactive/Archived)   ← K-12
  JoinMode              ClubJoinMode      (Approval/Open)   ← taslakta "alternatif" olarak geçiyor
  JoinStartDate         DateOnly?
  JoinEndDate           DateOnly?
  MemberCount           int               (denormalize sayaç — §8)
```

**K-1 — kulüp sezona bağlıdır ve bu taslakta eksiktir.** Taslak kulübü yalnız
okula bağlar. Bu depoda sezona bağlı olmayan bir kulüp **iki yıl sonra 40 üyeli
"Satranç Kulübü"nde mezun olmuş öğrencileri gösterir**. Emsal nettir:
`Announcement.AcademicSessionId` (`Announcement.cs:41`) ve
`RoleAssignment.SeasonId` (`RoleAssignment.cs:24`) aynı gerekçeyle vardır.
Kulüp yıl bazlı bir yapıdır: her sezonda yeniden açılır, danışmanı değişebilir,
üye listesi sıfırlanır. Sezon kolonu **sonradan eklenemez** — eklendiğinde var
olan kayıtların hangi sezona ait olduğu bilinmez ve elle doldurulur.

Karşı görüş şudur: "kulüp kalıcı bir topluluktur, her yıl yeniden kurulmaz."
Doğrudur, ama kalıcı olan **kulübün kimliğidir**, üye listesi değil. MVP'de
kimliği taşımanın maliyeti (ayrı `ClubDefinition` tablosu + sezon örneği) fayda
vermez; kulübün her sezonda yeni bir satır olarak doğması ve önceki sezonun
`Archived` kalması yeterlidir. Sezonlar arası devamlılık istenirse ileride
`PreviousClubId` nullable kolonu eklenir — o kolon sonradan eklenebilir, sezon
kolonu eklenemez.

**Kategori enum'dur, lookup tablosu değil.** Taslaktaki on kategori sabittir ve
okula göre değişmez; master seed tablosu açmak (`MasterBranch` emsali) bakım
maliyeti getirir, karşılığı yoktur. Ancak listede bir **kategori hatası** vardır:
"Satranç" bir kategori değil, bir kulüp adıdır — satranç zaten "Spor" ya da
"Zeka Oyunları" altındadır. Enum'a `Chess` koymak, yarın "Bilardo Kulübü" için
`Billiards` istenmesini davet eder. **Öneri:** dokuz kategori (Bilim, Teknoloji,
Sanat, Müzik, Spor, Kültür, Sosyal Sorumluluk, Girişimcilik, Yabancı Dil) +
`Other`. `Other` seçildiğinde `Name` zaten kulübü anlatır.

**`Status` dört değerlidir, iki değil.** Taslak `Active/Passive` der. Ama kulüp
oluşturulduğu anda üye alacak durumda değildir (danışman atanmamış, kontenjan
girilmemiş olabilir) ve sezon sonunda "pasif" ile "arşiv" aynı şey değildir:
pasif kulüp bu sezon üye almıyor demektir, arşiv kulüp geçmiş sezona ait
demektir. Ödev modülünün `Draft` kararının kardeşidir — **taslak kimseye
ulaşmaz ve bildirim üretmez** (`HomeworkStatus`, BR-HW-03).

### 4.2 `ClubMembership` — kulüp × öğrenci

```
ClubMembership : TenantEntity             → [school].club_memberships
  ClubId                Guid
  StudentPersonId       Guid
  Status                MembershipStatus  (Pending/Active/Paused/Rejected/Left)   ← K-14
  Role                  MembershipRole    (Member/President/VicePresident)
  AppliedAt             DateTimeOffset
  DecidedAt             DateTimeOffset?
  DecidedByPersonId     Guid?
  LeftAt                DateTimeOffset?
  RejectReason          string(500)?
```

**Tekillik kısıtı: `(SchoolId, ClubId, StudentPersonId)` filtreli unique —
`Status IN (Pending, Active)` koşuluyla.** Ayrılan öğrencinin yeniden
başvurabilmesi gerekir; koşulsuz unique bunu engellerdi. Filtreli unique index
bu depoda kullanılan bir kalıptır (`NotificationDeliveryLog`'un
`(SchoolId, EventId, RecipientAccountId, Channel)` filtreli unique'i,
`IApplicationDbContext` yorumu).

**K-8'in kaynağı burasıdır: kontenjan bir yarış koşuludur.** Son kontenjana iki
öğrenci aynı anda başvurursa `SELECT COUNT` + `INSERT` ikisini de kabul eder.
Üç savunma katmanı gerekir ve üçü de bu depoda mevcuttur:

1. `Club.MemberCount` denormalize sayaç + `Club.RowVersion` optimistic
   concurrency (`TenantEntity.RowVersion`) — üyelik onayı kulüp satırını da
   günceller, ikinci istek `DbUpdateConcurrencyException` alır.
2. Uygulama katmanında `Capacity` kontrolü — kullanıcıya anlamlı hata
   (`Clubs.Membership.CapacityFull`).
3. Filtreli unique index — çift başvuruya karşı son savunma hattı.

Sayaç yerine her okumada `COUNT(*)` çalıştırmak MVP'de çalışır ama liste
ekranında N kulüp için N alt sorgu demektir; ayrıca kontenjan kontrolünü
kilitlenecek bir satırdan mahrum bırakır. `MemberCount` bilinçli bir
denormalizasyondur ve **tek yazarı `Club` aggregate'inin kendi metotlarıdır**.

**Onay akışı `JoinMode`'a bağlıdır.** `Approval` → başvuru `Pending` doğar,
danışman öğretmen veya yönetici `Active`'e çeker. `Open` → başvuru doğrudan
`Active` doğar (taslaktaki "açık katılım" alternatifi). İki akış **aynı komutla**
karşılanır; ikinci bir uç açmak, istemcinin kulübün moduna bakıp doğru ucu
seçmesini gerektirirdi ve mod sonradan değişirse istemci yanılırdı.

### 4.3 `ClubActivity` — etkinlik

```
ClubActivity : TenantEntity                  → [school].club_activities
  ClubId                Guid
  Title                 string(200)
  Description           string(4000)?
  StartsAt              DateTimeOffset    ← saat VARDIR (ödevden ayrılır)
  EndsAt                DateTimeOffset
  Location              string(200)?
  Capacity              int?
  Status                ClubActivityStatus   (Draft/Published/Cancelled/Completed)
  CancelReason          string(500)?
  PublishedAt / CancelledAt / CompletedAt  DateTimeOffset?
  ParticipantCount      int               (denormalize — §8)
```

**Ödevden ayrılan nokta: etkinliğin saati vardır.** Ödevde son teslim `DateOnly`
tutulur ve bu bilinçlidir (ödev analizi §10: "wire'da OLMAYAN bir saat kavramı
uydurmak"). Etkinlikte saat sözleşmenin parçasıdır ("16:00 - 18:00"), bu yüzden
`DateTimeOffset` doğrudur. Ama **"bugün" kavramı yine okul-yereldir**:
`ISchoolCalendarService.GetLocalNowAsync` kullanılır, `DateTime.Now`
kullanılmaz — o, sunucunun bulunduğu makinenin günüdür, okulun değil.

**`Completed`'ı kim üretir?** Taslak söylemiyor. İki seçenek vardır ve karar
gerekir:
- **(a) Zamanlanmış iş** — `EndsAt` geçmiş `Published` etkinlikleri gece
  `Completed`'a çeker. Otomatiktir, unutulmaz.
- **(b) Danışman öğretmenin kapanışı** — katılım listesi kesinleştikten sonra.

**Öneri: (a) + katılım kilidi yok.** Etkinlik `Completed` olduktan sonra da
öğretmen katılım işaretleyebilmelidir (etkinlik akşam bitti, öğretmen ertesi gün
işaretliyor). `Completed` bir kilit değil, bir **etikettir**; kilitlemek
öğretmeni "etkinliği yeniden aç" gibi bir uca muhtaç ederdi. Ödevdeki `Close`
kararının tersidir ve gerekçesi farklıdır: ödevde kapanış öğretmenin iradesidir,
etkinlikte bitiş takvimin gerçeğidir.

### 4.4 `ClubActivityParticipation` — etkinlik × öğrenci

```
ClubActivityParticipation : TenantEntity     → [school].club_activity_participations
  ClubActivityId           Guid
  StudentPersonId       Guid
  Status                ParticipationStatus (Registered/Present/Absent/Cancelled)   ← K-15
  RegisteredAt          DateTimeOffset
  AttendanceMarkedAt    DateTimeOffset?
  MarkedByPersonId      Guid?
```

**Satır kayıt anında doğar, yayın anında değil.** Ödevde takip satırı yayın
anında **tüm şube için** doğar (ödev herkese verilmiştir). Etkinlikte katılım
gönüllüdür: satır ancak öğrenci "Katıl" dediğinde doğar. Yayın anında tüm
üyeler için satır üretmek, 24 üyeli kulübün 3 kişilik atölyesinde 21 tane
anlamsız `Absent` satırı üretirdi.

**`AttendedAt` DEĞİL `AttendanceMarkedAt`.** Taslaktaki `AttendedAt` "öğrencinin
geldiği an" gibi okunur; gerçekte saklanan **öğretmenin işaretlediği andır**.
Ödev modülü aynı ayrımı yapar: takip satırı öğrencinin yaptığını değil,
öğretmenin kararını taşır (`HomeworkTracking`, ARCHITECTURE.md "Kavram üçlüsü").
Adı yanlış koymak, ileride "öğrenci saat kaçta geldi" raporu istendiğinde bu
kolonun yanlış cevap vermesi demektir.

**Tekillik: `(SchoolId, ClubActivityId, StudentPersonId)` unique** — koşulsuz.
Üyelikten farklı olarak burada "ayrılıp yeniden katılma" `Cancelled` → yeniden
`Registered` geçişiyle **aynı satır üzerinde** çözülür; etkinlik tek bir andır,
ikinci bir satır tarihçe değil çift kayıt olurdu.

### 4.5 `ClubAnnouncement` — kulüp duyurusu

```
ClubAnnouncement : PermanentTenantEntity  → [school].club_announcements
  ClubId                Guid
  Title                 string(120)
  Content               string(4000)
  PublishedAt           DateTimeOffset
  PublisherPersonId     Guid
  PublisherLabel        string(120)       (yayın anında DONAR)
```

`PermanentTenantEntity` seçilmiştir (`Announcement`'ın kardeşi): yayınlanmış bir
duyuru silinmez. `PublisherLabel`'ın donması da duyuru modülünün kararıdır
(`Announcement.cs:66` yorumu): öğretmen okuldan ayrılsa bile imza tarihsel olarak
korunur.

Bu varlığın **var olup olmayacağı** §6'da tartışılan karara bağlıdır.

### 4.6 Tel (wire) sözleşmesi — FE'nin sabitlediği adlar (revizyon)

FE sözleşmesi (`oksis-ui/packages/api/src/club/contract.ts`, `packages/core/src/club/types.ts`)
portlanmış 20+ ekran tarafından tüketiliyor; teli FE'ye göre yazmak, ekranları
yeniden dokunmaktan ucuzdur. **Kural:** domain adı bu belgedeki gibi kalır,
DTO/JSON alanı FE adını taşır. Emsal: Homework `HomeworkWire.ToWire()`
(`HomeworkDtos.cs:15-45`) — enum telde **camelCase string**,
`ToString().ToLowerInvariant()` kullanılmaz (`vicePresident` bunu kanıtlar).

| Domain | Tel (FE) | Not |
| --- | --- | --- |
| `Club.AdvisorTeacherPersonId` | `advisorId` (+ `advisorName`) | K-11. Danışman havuzu ucunda `teacherId`/`teacherName`/`subjectArea` |
| `ClubMembership.StudentPersonId` | `studentId` (+ `studentName`, `studentNo` **string**, `section` `"11-C"`) | K-11. Veli özetinde çocuk alanı `studentId` + **`fullName`** |
| `ClubEvent` → **`ClubActivity`** | `activityId`, `ClubActivityDto` | K-10. Tablo `[school].club_activities`; olaylar `ClubActivityPublishedEvent`, `ClubActivityCancelledEvent`, `ActivityRegistrationCreatedEvent` |
| `ClubActivityParticipation` → **`ClubActivityParticipation`** | roster satırı `{ studentId, attendanceStatus }` | Tablo `[school].club_activity_participations` |
| `ClubStatus` `Draft/Active/Inactive/Archived` | `draft` `active` `inactive` `archived` | K-12. `Passive` → `Inactive` |
| `ClubJoinMode` | `approval` `open` | |
| `MembershipRole` | `member` `president` `vicePresident` | |
| `MembershipStatus` `Pending/Active/Paused/Rejected/Left` | başvuru listesi: `pending` `approved` `rejected` · üye listesi: `active` `paused` | K-14. **Tek tablo, iki projeksiyon:** `applications` = `Pending/Rejected` (+ onaylanan, `Active`'e geçen satır `approved` görünür); `members` = `Active/Paused`. `Left` telde görünmez (satır listelerden düşer). `Paused`'u yazan uç MVP'de **yok** (§19-H) |
| `ClubActivityStatus` | `draft` `published` `cancelled` `completed` | |
| `ParticipationStatus` `Registered/Present/Absent/Cancelled` | `registered` `present` `absent` `cancelled` | K-15. `Attended` → `Present`; kolon adı `AttendanceMarkedAt` kalır |
| `ClubCategory` (int enum, 10 değer) | **karar bekliyor** (S-11) — öneri İngilizce kod `science` … `other` | K-13, §19-F |
| Öğrenci üyelik hâli (türetilir, kolon değil) | `membership`: `joinable` `pending` `member` `full` `closed` | Sunucu hesaplar: `JoinMode` + `Capacity`/`MemberCount` + başvuru penceresi + öğrencinin satırı. **Buton kararı sunucudadır** |
| Tarih/saat | `date` `YYYY-MM-DD`, `startTime`/`endTime` `HH:mm` (etkinlik formu); okuma DTO'larında `startsAt` ISO | §4.3'ün `DateTimeOffset`'i okul saat dilimiyle (`School.TimeZone`) birleştirilerek üretilir |

**Sunucu-hazır metinler.** FE dört alanı hesaplamıyor, sunucudan **Türkçe
metin** bekliyor: `applicationNote` ("5 gün kaldı"), `applicationPeriod`
("1 – 20 Eylül"), `joinPolicy` ("Onaylı (danışman onaylar)"), `memberSince`
("Üye · 12 Eylül'den beri"). Bu, "kural ekranda değil sunucuda" ilkesinin
sonucudur (istemci tarih hesabı yapmaz) ama **metin dili sunucuya sızar**.
MVP'de kabul; ileride i18n istenirse alan bir koda (`applicationWindow:
{ start, end, daysLeft }`) döner. Üretim yeri tek olmalı: `ClubLabels`
statik sınıfı (Application/Modules/Clubs/Internal).

**Kimlikler GUID'dir.** FE tüm id'leri `string` tutar, mock'ta `"1"`, `"a-1-1"`
gibi değerler var; bildirim çözümleyicisi `GUID_PATTERN` kullanır
(`logic.ts:41`). Backend `Guid.ToString("D")` üretir — mock'taki kısa
kimliklere bağlı bir istemci mantığı **olmamalıdır** (§19-J).

---

## 5. İzin modeli

### 5.1 Eksik izinler

`PermissionSeedData.cs`'te **hiçbir `clubs.*` izni yoktur**. Ödev modülünün üçlü
kalıbı (`read`/`write`/`manage`) burada da doğru ölçektedir:

| Kod | Kim | Ne yapar |
| --- | --- | --- |
| `clubs.read` | Öğretmen, Öğrenci, Veli, Yönetici | Kulüp listesi, detay, etkinlik, duyuru okuma |
| `clubs.write` | Danışman öğretmen | Kendi kulübünde etkinlik/duyuru yazma, üyelik kararı, katılım işaretleme |
| `clubs.manage` | Okul yöneticisi | Kulüp açma/kapama, danışman atama, okul geneli görünüm, kulüp politikası |
| `clubs.join` | Öğrenci | Kulübe başvurma, etkinliğe kaydolma |

**`clubs.join` neden ayrı bir izin:** öğrenci `clubs.read` ile listeyi görür ama
katılım bir **yazma** eylemidir ve okul "bu sezon kulüp başvuruları kapalı"
diyebilmelidir. Ödevde bunun karşılığı yoktur çünkü öğrenci ödev seçmez; burada
vardır. Alternatif — `clubs.read` içine gömmek — okulun başvuruyu izin
seviyesinde kapatmasını imkânsız kılardı.

Seed satırları üç yere girer: `MasterSeedIds.Permissions`, `PermissionSeedData`,
`RolePermissionSeedData` (rol → izin eşlemesi). Roller sabittir:
`SUPER_ADMIN`, `SCHOOL_ADMIN`, `TEACHER`, `PARENT`, `STUDENT`
(`SystemRoleSeedData.cs:11-15`).

### 5.2 İzin ≠ kapsam

`[RequirePermission("clubs.write")]` **hangi kulüpte** yazabileceğini söylemez.
Danışman öğretmen yalnız **kendi kulübünde** yazabilir. Bu, `AuthorizationBehavior`'ın
işi değildir; handler'ın işidir:

```
Club.AdvisorTeacherPersonId == currentPersonId   → yazabilir
clubs.manage sahibi                              → her kulüpte yazabilir
diğer                                            → 404 (403 DEĞİL)
```

**Kapsam dışı = 404.** Ödev modülünün kararıdır ve gerekçesi güvenliktir: 403
"bu kaynak var ama sana kapalı" der ve varlık bilgisini sızdırır. Kulüpte bu
daha kritiktir: üye listesi kişisel veridir.

### 5.3 Veli yüzü salt okunurdur

Veli `clubs.read` ile **çocuğunun** kulüplerini ve katılım geçmişini görür;
`ParentStudentRelationship` üzerinden kapsamlanır. Veli kulübe kaydolamaz,
katılım işaretleyemez. Ödev modülünün F8 kararının kardeşi: **`canJoin` alanı
veli şemasında `false` değil, hiç yoktur** — `false` göndermek "yapabilirdi ama
şu an kapalı" demek olurdu; velinin böyle bir yetkisi hiç yok.

### 5.4 K-9 — Kulüp rolleri yetki değildir

Taslak `Member/President/VicePresident` sıralamasını "Kulüp Rolleri" başlığı
altında, danışman öğretmenin altında bir hiyerarşi olarak çiziyor. **Bu depoda
`SystemRole` ve `RoleAssignment` gerçek yetki taşır** (`RoleAssignment.cs`:
kişi × rol × sezon, ABAC scope'lu). Kulüp başkanlığını oraya bağlamak,
öğrenciye izin sistemi üzerinden yetki vermek olurdu ve "başkan üyelik onaylar
mı" sorusunu açardı.

**Karar: `MembershipRole` bir etikettir.** Üye listesinde gösterilir, hiçbir
uçta yetki kontrolüne girmez. Taslak da bunu zaten söylüyor ("MVP'de zorunlu
olan tek yönetici rolü: `AdvisorTeacherId`") — bu bölüm o ifadeyi koda bağlıyor.

---

## 6. K-5 — Kulüp duyurusu: yeni tablo mu, mevcut modül mü?

Bu, taslaktaki **en tartışmalı karardır** ve iki savunulabilir cevabı vardır.

**Seçenek A — `ClubAnnouncement` ayrı varlık (taslaktaki öneri).**
Beş kolonluk hafif bir kayıt. Kulüp duyurusu üyelerine gider, moderasyondan
geçmez, geri çekilmez, şablonu yoktur.

**Seçenek B — mevcut `Announcements` modülünü genişletmek.**
`AudienceDimension` enum'una `Club = 7` eklenip
`AnnouncementTarget(Dimension: Club, Key: clubId, Bucket: Student)` yazılır.

| | A (ayrı varlık) | B (duyuru modülü) |
| --- | --- | --- |
| Yazım maliyeti | 1 entity + 2 uç | Enum + hedef çözücü + moderasyon kararı |
| Moderasyon | yok | **Var — ve istenmiyor** |
| Gönderim raporu, şablon, zamanlama | yok | bedava gelir |
| "Kulüp duyurusu okul duyurusu mudur?" | Hayır | Evet |

**Öneri: A.** Belirleyici gerekçe moderasyondur. `Announcements` modülü
kurumsal bir kayıt üretir: eşikli moderasyon (`AnnouncementModeration`), onay
kuyruğu, geri çekme, düzeltme rozeti, yayın anında dondurulan alıcı sayısı ve
`PermanentTenantEntity` tabanı — hepsi "bu duyuru bir kanıttır" varsayımına
dayanır. "Cuma günü atölye var" cümlesi kanıt değildir. Duyuru modülüne
bağlamak, danışman öğretmenin her kulüp duyurusunu müdür onayına düşürebilir ve
kulübün gündelik iletişimini kurumsal bir sürece hapsederdi.

**Bedeli açıkça yazılmalıdır:** kulüp duyurusunun gönderim raporu, şablonu ve
zamanlaması olmayacak. MVP için doğru takas; ileride kulüp duyurusuna bunlar
istenirse **o zaman** B'ye göç edilir (tek yönlü göç: `ClubAnnouncement`
satırları `Announcement`'a taşınabilir, tersi taşınamaz).

`ClubAnnouncement` yine de `PermanentTenantEntity` olmalıdır (§4.5): üyeye
gitmiş bir duyurunun sonradan yok olması, üyenin gördüğü şeyin
doğrulanamaması demektir.

---

## 7. K-6 — Kulüp etkinliği ≠ Etkinlik Yoklaması

Bu depoda `ActivityRollCall` adında **zaten bir "etkinlik" vardır** ve kulüp
etkinliğiyle karıştırılması modülün en pahalı hatası olur.

| | `ActivityRollCall` (Attendance) | `ClubActivity` (Clubs) |
| --- | --- | --- |
| Amaç | Gezi/tören **güvenlik sayımı** | Kulüp faaliyeti |
| Ne cevaplar | "Otobüste 42 kişi var mı" | "Kim katıldı" |
| Yapı | Grup × tur × öğrenci (çoklu checkpoint) | Etkinlik × öğrenci (tek satır) |
| Devamsızlık | **Girmez**; ders yoklamalarını `BulkExcuse` ile mazeretler | **Girmez** |
| Katılım | Zorunlu (öğrenci geziye gitti) | Gönüllü (öğrenci kaydoldu) |

İkisi **ayrı kalmalıdır**. `ClubActivity`'i `ActivityRollCall` üzerine kurmak,
her React atölyesi için grup/tur yapısı taşımak ve 20 kişilik bir atölyeye
otobüs sayımı ergonomisi dayatmak olurdu.

**Ama bir köprü gerekir — MVP'de değil.** Ders saatine denk gelen bir kulüp
etkinliği (okul içi turnuva, saat 14:00) öğrencinin o saatteki dersinde
**devamsızlık yazdırır**. `ActivityRollCall` bunu `ActivityBulkExcusedEvent` ile
çözer. Kulüp etkinliği için aynı köprü kurulabilir:
`ClubActivityPublished` → ders saatiyle çakışıyorsa idareye "toplu mazeret
gerekli mi" uyarısı. **Öneri: MVP dışı**, ama etkinlik saatinin
`DateTimeOffset` tutulması (§4.3) bu köprüyü ileride mümkün kılar; `DateOnly`
tutulsaydı çakışma hiç hesaplanamazdı.

---

## 8. Sayaçlar — tek kaynak

Taslak arayüzde üç sayı gösteriyor: "24 Üye", "20 / 25 Katılımcı", "12 Etkinlik ·
36 Saat Katılım". Üçünün kaynağı ayrı olmalı ve **her birinin tek bir yazarı**
bulunmalıdır (ödev analizi §8'in kardeşi):

| Sayaç | Kaynak | Kim yazar |
| --- | --- | --- |
| `Club.MemberCount` | denormalize kolon | Yalnız `Club` aggregate metotları (§4.2) |
| `ClubActivity.ParticipantCount` | denormalize kolon | Yalnız `ClubActivity` aggregate metotları |
| Öğrencinin etkinlik sayısı | `COUNT` (`Status = Present`) | Hesaplanır, saklanmaz |
| **"36 Saat Katılım"** | `SUM(EndsAt - StartsAt)` (`Present` satırlar) | **Hesaplanır, saklanmaz** |

**"Saat katılım" bir kolon DEĞİLDİR.** Etkinliğin saati değişirse (16:00-18:00
→ 16:00-19:00) saklanmış bir toplam bayatlar ve hangi etkinlikten geldiği
bilinemez. Türetilebilen bir değeri saklamak, güncellenmesi gereken ikinci bir
gerçek üretir (`Homework.OwnerHasLeft` kararının aynısı, `Homework.cs` yorumu).

`MemberCount` ve `ParticipantCount` ise bilinçli istisnadır: ikisi de
**kontenjan kontrolünün kilit satırıdır** (§4.2) ve liste ekranlarında N+1
sorguyu önler.

---

## 9. Bildirim ve olay mimarisi

### 9.1 K-8 — "Event-Driven mimari" beklentisinin düzeltilmesi

Taslak "yeni servisler mevcut API değiştirilmeden sisteme eklenebilir" diyor.
Bu depoda bunun **bugünkü karşılığı in-process MediatR domain event'idir**:
`AggregateRoot.Raise()` → `DomainEventInterceptor` → `PostCommitDispatchBehavior`
→ `INotificationHandler<DomainEventNotification<T>>`. Message broker (RabbitMQ,
Kafka, Service Bus) **yoktur**; "Analytics Service", "Activity Feed" gibi ayrı
servisler de yoktur.

Bu bir eksiklik değildir — modüler monolit kararının sonucudur ve doğru
kararıdır. Ama taslağın vaadi olduğu gibi bırakılırsa, modülü yazan kişi
olmayan bir altyapıya bağlanmaya çalışır. **Doğru ifade:** kulüp modülü domain
event üretir; bu olaylara yeni **handler** eklemek modülü değiştirmeden
mümkündür.

Olay adları repo kuralına uydurulur (`…Event` soneki, `IDomainEvent`):
`ClubCreatedEvent`, `StudentJoinedClubActivity`, `StudentLeftClubActivity`,
`ClubApplicationDecidedEvent`, `ClubActivityPublishedEvent`,
`ClubActivityCancelledEvent`, `ActivityRegistrationCreatedEvent`,
`StudentAttendanceMarkedEvent`, `ClubAnnouncementPublishedEvent`
(varlık adı K-10 ile `ClubActivity` olduğundan çift "Event" sorunu kalmadı).

Taslaktaki `ClubActivityCreated` **olay üretmez**: taslak kimseye ulaşmamıştır.
Bildirimi doğuran olay **yayındır** — ödev modülünün BR-HW-03 kararı, seed
yorumunda da gerekçelendirilmiştir (`NotificationEventTypeSeedData.cs`:
"HOMEWORK_CREATED DEĞİL… bildirimi doğuran olay yayındır").

### 9.2 Eksik seed satırları

`NotificationKind` enum'unun son değeri **27**'dir (`HomeworkMissing`).
`NotificationEventGroup`'un son değeri **5**'tir (`Homework`). Kulüp modülü
ikisine de ekleme yapar ve **enum değerleri kolonda saklandığı için araya değer
sokulamaz** (grup enum'unun kendi yorumu bunu söyler).

```
NotificationEventGroup.Club = 6

NotificationKind (adlar FE ile aynı — K-16, packages/core/src/notifications/constants.ts:69-72):
  ClubActivityPublished     = 28   → kulüp üyeleri (+ velileri, S-12)
  ClubActivityCancelled     = 29   → kayıtlı katılımcılar (+ velileri)
  ClubAnnouncementPublished = 30   → kulüp üyeleri
  ClubApplicationDecided    = 31   → başvuran öğrenci (onay VE red — tek kind)
```

`NotificationEventTypeSeedData.Row(...)` imzası revizyonda **11 parametre**dir
(`id, eventKey, name, group, supportsSms, portal, email, sms, push, order,
delivered` — `NotificationEventTypeSeedData.cs:91-109`); `supportsPush` diye bir
kolon **yoktur**, push uygunluğu `PushEventKeyMap`'ten türetilir (§18.2).
Dört `CLUB_*` satırı (eventKey'ler FE mock'undaki `kl1…kl4` yer tutucularının
yerine geçer):

| EventKey | Kind | supportsSms | portal | email | sms | push (varsayılan) |
| --- | --- | --- | --- | --- | --- | --- |
| `CLUB_ACTIVITY_PUBLISHED` | `ClubActivityPublished` | false | true | false | false | **false** (S-12) |
| `CLUB_ACTIVITY_CANCELLED` | `ClubActivityCancelled` | false | true | false* | false | **true** |
| `CLUB_ANNOUNCEMENT_PUBLISHED` | `ClubAnnouncementPublished` | false | true | false | false | **false** |
| `CLUB_APPLICATION_DECIDED` | `ClubApplicationDecided` | false | true | false | false | **true** |

`delivered: true` dördünde. *FE mock'u iptal satırını `email: true` yazmış
(`notifications-data.ts:43`); bu depoda **e-posta kanalı yoktur**
(`INotificationChannel` uygulayan yalnız InApp ve Push), yani matristeki
e-posta toggle'ı teslimatı değiştirmez — seed'de `false` bırakılır, `true`
yazmak `Y-05` türü sahte toggle olurdu.

**`ClubApplicationDecided` tek kind'dır, onay/red ayrı değildir.** Duyuru
modülünün `AnnouncementApproved`/`AnnouncementRejected` ayrımının tersi bir
karardır ve gerekçesi ayarlar ekranıdır: veli/öğrenci ayarlarda "kulüp başvuru
sonucu" satırını görür; ikiye bölmek, ayırt edemeyeceği iki satır gösterirdi
(`HomeworkMissing`'in anlık/özet ayrımını tek kind'da tutan kararın kardeşi).

**Etkinlik hatırlatması (`ClubActivityReminder`) MVP dışı.** Ödevde
`HomeworkDueReminder` vardır çünkü ödevin bir yükümlülüğü vardır; etkinliğe
kaydolmuş öğrenci gönüllüdür. İstenirse Faz 5'te eklenir.

### 9.3 Zamanlanmış işler

Hangfire kaydı `HangfireSetup.UseOksisRecurringJobs` içindedir ve cron
config'ten okunur (`Program.cs:288`).

| İş | Ne yapar | Zorunlu mu |
| --- | --- | --- |
| `CompleteFinishedClubActivitiesJob` | `EndsAt` geçmiş `Published` → `Completed` | **Evet** (§4.3) |
| `CloseExpiredClubJoinWindowsJob` | `JoinEndDate` geçmiş kulüplerde başvuruyu kapatır | Hayır — okuma anında `JoinEndDate` kontrolü yeterli |

İkincisi **yazılmamalıdır**: bir işin yapabileceği tek şey, okuma anında bir
karşılaştırmayla zaten yapılabiliyorsa, iş gece koşan ikinci bir gerçek üretir.

---

## 10. Uç envanteri — FE sözleşmesi (revizyon)

İlk yazımdaki 22 uçluk öneri, FE portu tamamlanınca **geçersiz kaldı**: FE
kendi sözleşmesini yazdı ve 20+ ekran onu tüketiyor. Aşağıdaki liste
`oksis-ui/packages/api/src/club/contract.ts` (satır 411-715) ve çalışan tarifi
`packages/api-mocks/src/club/club-handlers.ts`'ten alınmıştır. **Backend bu
listeyi birebir uygular**; sapma gereken yerler §19'da FE'ye iş olarak
yazılmıştır. Zarf `{ data, meta, errors, correlationId }`, oluşturma 201, eylem
soneki `:fiil` (Homework emsali: `HomeworkController.cs:337-386`).

Üç controller: `ClubsController` (`api/v1/clubs`), `ClubActivitiesController`
(`api/v1/activities` — kök bu depoda **boş**; yoklama etkinlikleri
`api/v1/attendance/activities` altındadır, çakışma yok), öğrenci/veli yüzü için
`StudentClubsController` (`api/v1/students/me/clubs`) ve `ParentClubsController`
(`api/v1/parents/me/children`). **Sabit yollar `{id:guid}`'den önce yazılır** —
mock'un el ile sıraladığı üç çakışma noktası: `clubs/advisor-options|mine`,
`students/me/clubs/mine|discovery|history|activities`,
`parents/me/children/{studentId}/clubs/history`.

### Yönetici ve danışman yüzü (web)

| # | Uç | İzin + kapsam | Not |
| --- | --- | --- | --- |
| 1 | `GET /clubs` `?status&category&search` | `clubs.manage` | Sorgu parametreleri FE'de **gönderilmiyor** (istemci filtreler); yine de uygulanır |
| 2 | `POST /clubs` | `clubs.manage` | `CreateClubBody`; **danışman verilmişse `active`, yoksa `draft` doğar** (K-12) |
| 3 | `GET /clubs/{clubId}` → `ClubDetailDto` | `clubs.read` + (danışman **veya** `clubs.manage`) → aksi 404 | Yönetici ve öğretmen (mobil dâhil) aynı ucu çağırır; sayaçlar `activeMemberCount`, `pausedMemberCount`, `upcomingActivityCount`, `pastActivityCount` |
| 4 | `PUT /clubs/{clubId}` | `clubs.manage` | Gövde = create; `draft` kulübe danışman atanınca `active` |
| 5 | `POST /clubs/{clubId}:changeStatus` `{ status, reason }` | `clubs.manage` | FE yalnız `inactive` ve `archived` gönderir, `reason` hep `null`; `active`'e dönüş ucu **FE'de yok** (§19-I) |
| 6 | `GET /clubs/{clubId}/members` → `ClubMemberDto[]` | 3 ile aynı kapsam | `Active/Paused` projeksiyonu, sezon süzgeci sunucuda |
| 7 | `GET /clubs/{clubId}/applications` `?status` | 3 ile aynı | `pending` çağrılır; `Pending/Rejected` (+ karar verilmiş) projeksiyonu |
| 8 | `POST /clubs/{clubId}/applications/{applicationId}:approve` `{ reason }` | `clubs.write` (danışman) veya `clubs.manage` | Kontenjan dolu → `Clubs.Membership.CapacityFull`; `MemberCount++`, kontenjan dolunca `applicationOpen=false` |
| 9 | `POST …/applications/{applicationId}:reject` `{ reason }` | aynı | `ClubApplicationDecided` bildirimi 8 ve 9'da |
| 10 | `GET /clubs/{clubId}/activities` `?group=upcoming\|past` | 3 ile aynı | `group` FE'de gönderilmiyor |
| 11 | `POST /clubs/{clubId}/activities` | `clubs.write` | `draft` doğar; `date + startTime/endTime` okul saat dilimiyle `DateTimeOffset`'e çevrilir |
| 12 | `POST /activities/{activityId}:publish` | `clubs.write` | Gövde yok; yalnız `draft`tan; **bildirim burada doğar** |
| 13 | `POST /activities/{activityId}:cancel` `{ reason }` | `clubs.write` | 15-500 karakter; satır silinmez |
| 14 | `GET /activities/{activityId}/roster` → `ClubActivityRosterDto` | `clubs.write` | İlk okumada üye listesinden türetilir, hepsi `registered`; `savedAt` null |
| 15 | `PUT /activities/{activityId}/roster` `{ rows: [{studentId, attendanceStatus}] }` | `clubs.write` | **Delta**: gelen satır üzerine yazılır, gelmeyen korunur; `Completed` sonrası da açık (§4.3) |
| 16 | `GET /clubs/advisor-options` → `ClubAdvisorOptionDto[]` | `clubs.manage` | Aktif sezon öğretmenleri (`TeacherProfile`), `teacherId` = PersonId |
| 17 | `GET /clubs/mine` → `ClubAdvisorSummaryDto[]` | `clubs.write` | Kimlik Bearer'dan; `activityCount`, `pendingCount`, `note` |
| 18 | `GET /clubs/{clubId}/announcements` | 3 ile aynı | |
| 19 | `POST /clubs/{clubId}/announcements` `{ title, content }` | `clubs.write` | Tek adımda yayın, moderasyon yok (§6) |

### Öğrenci yüzü (mobil)

| # | Uç | İzin | Not |
| --- | --- | --- | --- |
| 20 | `GET /students/me/clubs/discovery` `?category&search` → `ClubDiscoveryDto[]` | `clubs.read` | Yalnız `active` kulüpler; satırda `membership` beş-durum sunucudan |
| 21 | `GET /students/me/clubs/mine` | `clubs.read` | |
| 22 | `GET /students/me/clubs/activities` | `clubs.read` | Üyesi olduğu kulüplerin `published` + gelecek etkinlikleri, `startsAt` artan |
| 23 | `GET /students/me/clubs/activities/{activityId}` | `clubs.read` | |
| 24 | `GET /students/me/clubs/history` → `{ summary: {clubCount, activityCount, hourCount}, items[] }` | `clubs.read` | `activityCount` yalnız `present`; `hourCount = round(Σ durationMinutes/60)` (§8) |
| 25 | `GET /students/me/clubs/{clubId}` → `ClubStudentDetailDto` | `clubs.read` | Üye listesi **dönmez**; `role`, `memberSince`, `applicationPeriod`, `joinPolicy` |
| 26 | ~~`POST /students/me/clubs/{clubId}:apply`~~ | — | **Yazılmaz.** FE'de ölü (§19-A); sözleşmeden düşer |
| 27 | `POST /students/me/clubs/{clubId}:join` | `clubs.join` | **Tek komut iki mod**: `open` → `Active`, `approval` → `Pending` (§4.2 kararı). Mock'un `409 wrong_mode`'u uygulanmaz |
| 28 | `POST /students/me/clubs/{clubId}:leave` | `clubs.join` | `Pending` → başvuru geri çekilir (`Left`), `Active` → ayrılır (§19-B) |
| 29 | `POST /students/me/clubs/activities/{activityId}:register` | `clubs.join` | Üye değilse 404; `registeredCount++`; kontenjan → `CapacityFull` |
| 30 | `POST …/activities/{activityId}:unregister` | `clubs.join` | `Cancelled`; aynı satır (§4.4) |

### Veli yüzü (mobil, salt okunur)

| # | Uç | İzin | Not |
| --- | --- | --- | --- |
| 31 | `GET /parents/me/children/clubs-summary` → `ClubParentChildDto[]` | `clubs.read` | `ParentStudentRelationship` kapsamı; `{ studentId, fullName, section, clubCount, activityCount, hourCount }` |
| 32 | `GET /parents/me/children/{studentId}/clubs` | `clubs.read` + çocuk kapsamı → aksi 404 | |
| 33 | `GET /parents/me/children/{studentId}/clubs/history` | aynı | **`summary` bloğu eklenir** (§19-C) |
| 34 | `GET /parents/me/children/{studentId}/clubs/{clubId}` → `ClubStudentDetailDto` | aynı | Öğrenciyle **aynı DTO**; `canJoin`/`membershipId` alanı zaten hiçbir DTO'da yok (§5.3 sağlanmış) |

33 operasyon (26 düşer). **Alan daraltması** ilk yazımdaki gibi serileştirme
düzeyindedir: öğrenci/veli DTO'larında üye listesi yoktur; veli için ayrı
record yazılmaz çünkü FE öğrenci ve veli detayını **aynı DTO** ile çiziyor ve
yazma düğmesini `readOnly` prop'uyla gizliyor — veli tarafında `:join`/`:leave`
ucu **yoktur**, dolayısıyla "alanın varlığı iddiadır" riski uçta değil DTO'da
yaşamaz.

**FE'de tanımlı ama hiçbir ekranın çağırmadığı davranışlar** (yazılır, çünkü
sözleşmede; ama Faz sırasında sona bırakılır): `GET /clubs` filtreleri,
`activities?group`, `discovery?category&search`.

---

## 11. K-3 — Dosya entegrasyonu

**`CoverImage` bir kolon değildir.** Bu depoda dosya iki adımlıdır ve kulüp
modülü dosya depolamaz:

1. İstemci `POST /api/v1/files` ile yükler → `StoredFile` doğar (virüs taraması,
   kota, saklama politikası orada işler).
2. Kulüp komutu dönen `storedFileId`'yi alır ve
   `FileAttachment.Create(schoolId, storedFileId, entityType: "Club", entityId: clubId)`
   ile bağlar.

Bağ polimorfiktir (`FileAttachment.cs`: `EntityType`/`EntityId`) ve aynı dosya
N varlığa bağlanabilir.

**Kategori sorunu — dikkat.** `FileCategories.ClubDocument` **zaten hazır** ama
kapak görseli için uygun değildir: izin verilen tipler `pdf/docx/jpg`, boyut
20 MB. Kapak görseli için `png` eksiktir ve 20 MB fazladır. İki seçenek:

- **(a)** `ClubDocument`'a `png` eklemek — kulüp belgesi ile kapak görselini aynı
  politikada birleştirir; 20 MB'lık bir kapak görseli yüklenebilir hale gelir.
- **(b)** Yeni kategori: `ClubCoverImage` (png/jpg, 2 MB, virüs taramalı,
  saklama süresiz) — `SchoolLogo` emsali (`FileCategoryPolicyRegistry.cs`).

**Öneri: (b).** Kapak görseli ile kulüp belgesi farklı şeylerdir; tek politikada
birleştirmek, ikisinden birinin sınırını yanlış yapar.

---

## 12. Modül anahtarı ve tenant izolasyonu

### 12.1 `module_configs` → `clubs` yok

`SeedDefaultModuleConfigsHandler.DefaultCatalog` **on modül** içerir
(`students`, `attendance`, `marks`, `timetable`, `announcements`, `finance`,
`eokul`, `transport`, `cafeteria`, `library`); `clubs` yoktur. Handler'ın kendi
yorumu ne yapılacağını söylüyor: *"Yeni bir modül eklenirken bu listeye girilir
ve eski okullara uygulamak için ayrıca backfill migration koşulur."*

**Öneri:** `new("clubs", IsEnabled: true, PlanRestricted: false, Tier: ModuleTier.Standard)`
+ mevcut okullar için backfill migration. `Standard` seçilmiştir: kulüp çekirdek
değildir (okul kapatabilmelidir) ama plan kısıtlı da değildir.

### 12.2 Tenant izolasyonu

Beş varlık da `IHasTenant` uygular; global query filter
(`OksisDbContext.cs:249`) otomatik uygulanır ve `TenantSaveChangesInterceptor`
yazmada `SchoolId`'yi mühürler. **Kulüp modülünde `IgnoreQueryFilters()`
kullanılmaz** — gerekçesi olabilecek tek yer yoktur; SuperAdmin bakış açısı
kulüpte tanımlı değildir.

**Sezon izolasyonu tenant izolasyonundan ayrıdır ve otomatik DEĞİLDİR.**
`AcademicSessionId` filtresi her sorguda **elle** yazılır (duyuru modülü de
böyle yapar). Unutulursa geçen yılın kulüpleri listeye sızar — bu, testle
yakalanması gereken bir sınıftır (§15).

---

## 13. Öğrenci aktivite geçmişi

Taslağın "en değerli özellik" dediği bölüm, aslında **yeni bir varlık
gerektirmez**: üç sorgunun birleşimidir.

```
Kulüpler          → ClubMembership WHERE StudentPersonId = X AND Status = Active
Katıldığı etkinlik → ClubActivityParticipation WHERE StudentPersonId = X AND Status = Present
Saat toplamı       → SUM(EndsAt - StartsAt) aynı küme üzerinde   ← saklanmaz (§8)
```

**"Başarılar / 🏆" bölümü MVP dışıdır** — taslak da rozet ve puan sistemini
kapsam dışı bırakıyor, ama profil mock'unda ödül gösteriyor. İkisi çelişir.
Bu depoda "başarı" kavramının karşılığı yoktur ve MVP'de üretilmemelidir; aksi
halde `Present` sayısından türetilmiş sahte bir rozet mantığı doğar.

**Sezon kapsamı burada da geçerlidir:** aktivite geçmişi varsayılan olarak
**aktif sezonu** gösterir; geçmiş sezonlar `?sessionId=` ile istenir
(**revizyon:** FE bu parametreyi göndermiyor, MVP dışı — §19-N). Sezonsuz
bir "tüm zamanlar" görünümü, mezun öğrencinin listesini beş yıl boyunca
büyütür — ve K-1'in atlanması hâlinde bu ekran **yanlış** çalışır.

---

## 14. Yazım sırası önerisi (revizyon — uç numaraları §10'a göre)

Ödev modülünün beş fazlı sırası burada da işler (her faz kendi migration'ıyla
kapanır; migration adı `YYYYMMDD_clubs_<faz>`). Her faz sonunda `oksis-ui`
`packages/api/src/generated/schema.ts` yeniden üretilir ve `contract.ts`'teki
augmentation bloğunun ilgili kısmı silinir — **drift bekçisi ancak o zaman
çalışır** (contract.ts:1-13).

| Faz | Kapsam | Yeni varlık | Uçlar (§10) |
| --- | --- | --- | --- |
| **0** | Seed + modül anahtarı: izinler (`clubs.read/write/manage/join`), `module_configs.clubs`, 4 `CLUB_*` olay tipi + `NotificationEventGroup.Club`, 4 `NotificationKind` (28-31), **`PushEventKeyMap` 4 satır + `PushDeepLinks.Club`** (§18) | — | — |
| **1** | Kulüp çekirdeği: oluştur/düzenle/durum + liste/detay + danışman havuzu + danışmanın kulüpleri | `Club` | 1, 2, 3, 4, 5, 16, 17 |
| **2** | Üyelik: keşif, katıl/ayrıl, başvuru listesi, onay/red, üye listesi, öğrenci "kulüplerim", veli özeti + çocuk kulüpleri | `ClubMembership` | 6, 7, 8, 9, 20, 21, 25, 27, 28, 31, 32, 34 |
| **3** | Etkinlik: taslak/yayın/iptal + kayıt + roster | `ClubActivity`, `ClubActivityParticipation` | 10–15, 22, 23, 29, 30 |
| **4** | Duyuru + aktivite geçmişi (öğrenci ve veli, `summary` ile) | `ClubAnnouncement` | 18, 19, 24, 33 |
| **5** | Bildirim handler'ları (4 kind, in-app + push) + `CompleteFinishedClubActivitiesJob` | — | uç yok |

**Faz 0 önce koşar ve tek başına anlamlıdır**: seed satırları olmadan yazılan
handler'lar `[RequirePermission("clubs.write")]` ile 403 döner ve neden
döndüğü hemen anlaşılmaz. Push eşlemesinin Faz 0'da olması, Faz 5'e kadar
push'un **kapalı** kalmasına engel değildir: eşleme kapsamı açar, gönderimi
Faz 5'teki handler'lar üretir.

**Faz 1'de `AcademicSessionId` kolonu doğar** (K-1). Faz 3'e ertelenirse, Faz 1
ve 2'de yazılan kulüp/üyelik satırları sezonsuz kalır.

**FE tarafı işleri** (§19) Faz 2 ile Faz 5 arasına dağıtılır; en erken
gerekeni §19-F (kategori kodu — Faz 1 ile aynı anda) ve §19-D (bildirim
çözümleyicisi `clubs` kolu — Faz 5 ile aynı anda).

---

## 15. Test beklentisi

Depoda 595 test dosyası vardır; kulüp modülü aşağıdakileri getirmelidir
(ödev modülünün kapsama kalıbı):

| Proje | Ne test edilir |
| --- | --- |
| `Oksis.Domain.UnitTests` | Durum makinesi geçişleri, kontenjan kuralı, üyelik tekilliği |
| `Oksis.Application.UnitTests` | Validator'lar, görünüm çözümleyici (sahiplik→idare→404), hata eşlemesi |
| `Oksis.Api.UnitTests` | Rota sırası (`mine`/`advised`/`admin` vs `{id:guid}`), wire şekli (veli şemasında `canJoin` **yok**) |
| `Oksis.Infrastructure.IntegrationTests` | **Tenant sızıntısı ve sezon sızıntısı** — §12.2 |

Son satır kırmızı çizgidir: sezon filtresinin unutulduğu bir sorgu, birim
testlerden geçer ve ancak ikinci sezonda fark edilir.

---

## 16. Karar bekleyen sorular

| # | Soru | Öneri |
| --- | --- | --- |
| S-1 | Kulüp sezona bağlanacak mı (K-1)? | **Evet** — sonradan eklenemez |
| S-2 | Kulüp duyurusu ayrı varlık mı, `Announcements` modülü mü (§6)? | **Ayrı varlık** (moderasyon istenmiyor) |
| S-3 | `Completed`'ı iş mi üretir, öğretmen mi (§4.3)? | **Zamanlanmış iş**, katılım kilidi yok |
| S-4 | Kapak görseli için yeni dosya kategorisi mi (§11)? | **Yeni kategori** `ClubCoverImage` |
| S-5 | Bir öğrenci kaç kulübe üye olabilir? | **Karar bekliyor** — sınır konacaksa `SchoolSettings` kolonu (`Homework*` emsali); MVP'de sınırsız |
| S-6 | Kulüp etkinliği ders saatiyle çakışırsa devamsızlık ne olur (§7)? | **MVP dışı**; `DateTimeOffset` saklamak köprüyü açık bırakır |
| S-7 | Danışman öğretmen ikinci bir öğretmenle paylaşılabilir mi? | **Hayır** — taslak da tek danışman diyor; çoklu danışman `ActivityGroup` benzeri bir yapı gerektirir |
| S-8 | Kulüp başkanı seçimi nasıl yapılır? | **MVP dışı** — `MembershipRole` elle atanır (§5.4); oylama zaten kapsam dışı |
| S-9 | Kulüp push'u hangi kind'larda **varsayılan açık** (`DefaultPushEnabled`)? | **`ClubActivityCancelled` ve `ClubApplicationDecided` açık**, yayın ve duyuru kapalı (okul matristen açar). Gerekçe §18.3 |
| S-10 | Kulüp push'u için **throttle** gerekir mi? | **Hayır** — en geniş fan-out bir kulübün üyeleri (+ velileri), yüzlerce değil onlarca alıcı; `PushEventKeyMap` yorumunun ~1.560'lık uyarısı (ders programı) burada geçerli değil |
| S-11 | `ClubCategory` telde ne taşır (K-13)? | **İngilizce camelCase kod** (`science`, `technology`, `art`, `music`, `sports`, `culture`, `socialResponsibility`, `entrepreneurship`, `foreignLanguage`, `other`) + FE `CLUB_CATEGORIES` sabitinin etiketleştirilmesi (§19-F). Türkçe etiketi tel değeri yapmak, sunucunun Türkçe string üzerinden `switch` yazması demek olurdu |
| S-12 | `ClubActivityPublished` / `ClubActivityCancelled` **veliye de** gider mi? | **Evet, veli de alıcıdır** — veli yüzü portlandı ve çocuğun etkinliklerini görüyor; K-02'nin "veli push'u" pilot kriteri bunu ister. `ClubAnnouncementPublished` ve `ClubApplicationDecided` yalnız öğrenciye |
| S-13 | Derin bağlantı biçimi: dört kind için tek `/clubs/{clubId}` mi, etkinlik için `/clubs/activities/{activityId}` mi? | **MVP'de tek biçim `/clubs/{clubId}`** (§18.4). Etkinlik kimlikli bağlantı FE'de rolden bağımsız bir rotaya oturmuyor (öğrenci `clubs/activities/[id]`, öğretmen web `clubs/{clubId}/activities/{id}/roster`, veli yok) |
| S-14 | `MembershipStatus.Paused` MVP'de kim yazar? | **Kimse** — FE'de yazma ucu yok (§19-H). Enum değeri ve `pausedMemberCount` sayacı yazılır, yazma ucu Faz 6+ |
| S-15 | `inactive`/`archived` kulüp yeniden `active` olabilir mi? | **`inactive` → `active` evet, `archived` → hiçbir şey** (arşiv geri dönüşsüz). FE'de düğmesi yok (§19-I); uç 5 `active` değerini kabul eder, FE sonra bağlar |

---

## 17. Sonuç

Önerilen kulüp modeli OKSİS altyapısına **uygundur** ve mevcut kalıpların
üzerine oturur: `TenantEntity` + global query filter, MediatR CQRS + izin
kapısı, taslak/yayın durum makinesi, domain event → Hangfire bildirim zinciri,
`StoredFile`/`FileAttachment` dosya akışı. Altyapı tarafında **yazılacak yeni
altyapı yoktur**; eksik olan üç seed grubudur (izin, bildirim olay tipi, modül
anahtarı) ve modülün kendisidir.

Taslağın koda dönüşürken düzeltilmesi gereken tek **yapısal** eksiği sezon
kapsamıdır (K-1); geri kalan sekiz nokta adlandırma, sınır çizme ve beklenti
düzeltmesidir. Bunlar yazımdan önce kararlaştırılırsa modül, Ödev modülünün
beş fazlık ritmiyle yazılabilir.

**Revizyon sonrası durum (29 Ağustos 2026):** tel sözleşmesi FE tarafından
sabitlenmiştir (§10, §4.6) — backend'in tasarım özgürlüğü domain adlarında ve
iç kurallarda kalır, JSON şeklinde kalmaz. Push altyapısı hazırdır; kulüp için
eklenecek olan dört eşleme satırı, bir derin bağlantı üyesi ve dört seed
satırıdır (§18). FE tarafında modül canlıya çıkmadan kapatılması gereken **beş
iş** vardır (§19-A/B/C/D/F); bunlar backend'i beklemez, paralel yürür.
Uygulamaya S-9…S-15 kararları verilmeden başlanmamalıdır; hepsinin önerisi
yazılıdır, "kabul" demek yeter.

---

## 18. OS push entegrasyonu (revizyon — 29 Ağustos 2026)

İlk yazım bildirim zincirini `InAppNotificationChannel`'da bitiriyordu. Bugün
(`oksis-api` `1acf29a`, merge `50d35d2` + `a0bd4d8`) zincirin ikinci kanalı
çalışıyor ve kulüp modülü **hiçbir push altyapısı yazmaz**; yalnız kapsam
listesine girer. Spec: `docs/superpowers/specs/2026-08-28-os-push-bildirimi-design.md`;
karar: `oksis/docs/bugs-and-decisions/Kararlar/K-02 - OS Push Altyapısı.md`
(28 Ağustos revizyonuyla: FCM her iki platforma, `@react-native-firebase/messaging`).

### 18.1 Gönderim yolu ve beş kapı

```
handler → INotificationEnqueuer.Enqueue(eventId, schoolId, kind, title, body, deepLink, accountIds)
        → IPostCommitDispatcher → Hangfire DispatchNotificationJob (tenant set)
        → NotificationDispatcher (kanal × alıcı; AnyAsync idempotentlik)
            ├─ InAppNotificationChannel   (Notification satırı; EventId kolonu — push bunu okur)
            └─ PushNotificationChannel    (PushNotificationChannel.cs:123-255)
```

Push kanalı her alıcı için **ucuzdan pahalıya** beş kapıdan geçer:

| # | Kapı | Okuduğu | Satır yoksa | Kulüp için anlamı |
| --- | --- | --- | --- | --- |
| 1 | Kapsam | `PushEventKeyMap.TryGetEventKey(kind)` (`PushEventKeyMap.cs:27-32`) | → `false` | **Kulüp kind'ları eşlemede yoksa push HİÇ gitmez.** Bugün eşleme üç satırdır: `GradePublished`, `HomeworkPublished`, `HomeworkDueReminder` |
| 2 | Okul ana anahtarı | `NotificationConfig.PushEnabled` | **kapalı** | Okul push'u açtıysa kulüp de açık |
| 3 | Okulun olay kararı | `NotificationRuleConfig.PushEnabled` (SchoolId+EventKey) | → `NotificationEventType.DefaultPushEnabled` | Seed'deki `push:` sütunu buradan okunur (§9.2, S-9). Mevcut okullar için tenant satırı yoksa katalog varsayılanına düşer — **backfill migration gerekmez** (`PushNotificationChannel.cs:154-162`) |
| 4 | Kullanıcı tercihi | `NotificationPreference.PushEnabled` (AccountId+EventKey) | **açık** | Veli/öğrenci ayarlarda kulüp satırını görür (aşağıda) |
| 5 | Sessiz saat | `NotificationConfig.QuietHours*` + `School.TimeZone` | erteleme yok | Ertelenen push `DeferredPushJob`'a gider; **`false` döner** ve `NotificationDeliveryLog` satırı yazılmaz (bilinen eksik, `DeferredPushJob.cs:19-31`) |

Sonra aktif cihaz araması (`user_devices`, cihaz yoksa `false`), payload, `FcmSender`
(500'lük partiler, yalnız `Unregistered` cihazı kapatır — `FcmErrorClassifier.cs:46-47`),
cihaz başına `push_deliveries` satırı (`RecordAsync`, doğal anahtar
`EventId + RecipientAccountId`, FK değil — Ruling-30).

**Dönüş değeri "ulaştı" demektir, "denendi" değil** (`INotificationChannel.cs:12-52`).
Kulüp handler'ları bu sözleşmeye dokunmaz; yalnız `Enqueue` çağırır.

### 18.2 Kulüp için yapılacaklar — checklist (Faz 0 + Faz 5)

Backend push envanterinden çıkarılmış, dosya bazlı, sıralı:

1. **Enum** — `NotificationKind.cs:155` sonrasına **sona** dört değer (28-31,
   adlar §9.2). Araya değer sokulmaz; `NotificationKindContinuityTests` kilitler.
   `NotificationEventGroup.cs:33` sonrasına `Club = 6`.
2. **Katalog** — `MasterSeedIds.cs:316-337` dört `SeedGuid.From("notifevt:CLUB_…")`;
   `NotificationEventTypeSeedData.cs:37-89` dört `Row(...)` (§9.2 tablosu; 11 parametre).
   Migration: seed satırları + `default_push_enabled` (`20260828130231_20260828_push_matrix_column.cs:36-58`
   emsali; EF'in ürettiği boş `UpdateData` çağrıları silinir — aynı dosya 11-16).
3. **Eşleme** — `PushEventKeyMap.cs:27-32` dört satır:
   `[NotificationKind.ClubActivityPublished] = "CLUB_ACTIVITY_PUBLISHED"` vb.
   Bu tek yer aynı anda üç şeyi açar: Kapı 1, veli tercih validator'ının beyaz
   listesi (`UpdateNotificationPreferencesCommandValidator.cs:42`) ve matrisin
   `SupportsPush` projeksiyonu (`GetNotificationConfigQueryHandler.cs:51-54`).
   Yorum satırındaki "dördüncü tip bilinçli karardır" uyarısı **S-10** ile
   cevaplanır: kulüp fan-out'u onlarca alıcıdır.
4. **Derin bağlantı** — `PushDeepLinks.cs`'e `public static string Club(Guid clubId)
   => $"/clubs/{clubId:D}"`. Dört kind de bunu kullanır (S-13). Bu string
   `oksis-ui/packages/core/src/notifications/logic.ts · resolveNotificationTarget`
   ile **iki depoda yaşayan sözleşmedir** (§19-D) — FE tarafı henüz `clubs`
   kolunu tanımıyor.
5. **Handler'lar (Faz 5)** — dört `INotificationHandler<DomainEventNotification<…>>`:
   `ClubActivityPublishedEvent` → üyeler (+ veliler, S-12) ·
   `ClubActivityCancelledEvent` → `Registered` katılımcılar (+ veliler) ·
   `ClubAnnouncementPublishedEvent` → üyeler · `ClubApplicationDecidedEvent` →
   başvuran. Alıcı `AccountId` çözümü `NotificationRecipientResolver` emsaliyle
   (`Person → Account`, veli için `ParentStudentRelationship`). `eventId`
   **deterministik** olmalı — `DeterministicGuid.Combine` (`HomeworkDueReminderJob.cs:255-259`);
   aksi hâlde Hangfire retry'ı çift in-app satırı üretir.
6. **Gövde kuralı (K-02 §5, bağlayıcı)** — başlık/gövde PII'sız: kulüp adı ve
   etkinlik başlığı serbest, öğrenci adı yalnız veliye giden mesajda (çok çocuklu
   veli için zorunlu). Başvuru kararında **red gerekçesi push gövdesine yazılmaz**
   (kilit ekranında görünür kabul edilir); gerekçe in-app detayda kalır.
7. **Testler** — `PushEventKeyMapTests.cs:31-36` ("tam üç tip") → yedi;
   `NotificationMatrixPushTests.cs:38-49` `DefaultPushEnabled` listesi;
   `NotificationKindContinuityTests`.

### 18.3 S-9 gerekçesi — hangi kulüp push'u varsayılan açık

Push, kilit ekranına düşen bir kesintidir; in-app satırı zaten dördünde yazılır.
Varsayılanı "kişinin planını bozan" olaylara açmak doğru ölçektir:
`ClubActivityCancelled` (öğrenci gelmesin diye) ve `ClubApplicationDecided`
(beklediği cevap). `ClubActivityPublished` ve `ClubAnnouncementPublished`
haber niteliğindedir; okul matristen açar (`PUT school-settings/notification-config`,
`RuleItem.PushEnabled` üç durumlu — `UpdateNotificationConfigCommand.cs:47-52`).
İlk dalganın üç olayı (`GRADE_PUBLISHED`, `HOMEWORK_PUBLISHED`, `HOMEWORK_DUE`)
zaten "kişisel ve eyleme dönük" ölçütüyle seçilmişti; bu, aynı ölçütün devamıdır.

### 18.4 Payload ve derin bağlantı

`data = { kind, deepLink, schoolId, accountId, notificationId? }`
(`PushNotificationChannel.cs:228-244`). `notificationId` in-app satırından
`Notification.EventId` ile bulunur — kulüp handler'ı bunun için ekstra iş
yapmaz, yeter ki `Enqueue`'ya verilen `eventId` her iki kanal için aynı olsun
(zaten öyle, tek `NotificationMessage`).

**Bağlantı rolden bağımsızdır** (`PushDeepLinks.cs:14-18`): aynı `/clubs/{id}`
öğrenciye, veliye ve danışmana gider; velinin çocuk kimliğini **istemci** aile
listesinden çözer (ödev kararı 2026-08-29). FE'nin `/clubs/{clubId}` rotası
üç rolde farklı ekrana açılır: öğrenci `clubs/[clubId]` (detay), öğretmen
`clubs/[clubId]/applications`, veli `clubs/parent/[studentId]/[clubId]`
(`apps/mobile/src/app/clubs/[clubId]/index.tsx:16-19`) — çözümleyicinin
`clubs` kolu bu üçlü dağıtımı yapmak zorunda (§19-D).

### 18.5 Ayarlar yüzü — kullanıcı tercihi

`GET/PUT api/v1/notifications/preferences` (`NotificationsController.cs:93-113`)
`PushableEventKeys`'in **tamamı** için satır döner; eşlemeye giren dört
`CLUB_*` anahtarı otomatik olarak veli/öğrenci tercih listesine düşer, satırı
olmayan anahtar `PushEnabled = true` gelir. Tercih **hesap × olay** boyutundadır,
**çocuk bazlı değildir** (`NotificationPreference.cs:19-43` — `StudentId` kolonu
yok); iki çocuğu iki farklı kulüpte olan veli kulüp push'unu ikisi için birden
açar/kapar. Bu K-02'nin kabul edilmiş sınırıdır, kulüp için yeni bir şey değildir.

Sessiz saat **okul bazlıdır**, kullanıcı bazlı değil (`NotificationConfig.cs:38-45`).
Akşam yayınlanan bir etkinlik iptali sessiz saatte ertelenir — iptal "kritik"
sınıfında değildir (spec §6, kritik = yalnız devamsızlık eşiği). Karar
gerekmez; belgelenir.

---

## 19. Portlanan FE ekranlarına uyum — sapmalar ve FE'ye düşen işler

Kaynak: `oksis-ui` `1fec5aa`; web `apps/web/features/club/*` (12 ekran),
mobil `apps/mobile/src/features/club/components/*` (11 ekran), sözleşme
`packages/api/src/club/contract.ts`, çalışan tarif
`packages/api-mocks/src/club/club-handlers.ts` + `club-data.ts`. Her madde
"kim düzeltir" ile biter; **backend**, **FE** ya da **ikisi**.

### 19-A · `:apply` ölü, `:join` onaylı kulüpte 409 alıyor 🔴 — **backend + FE**

`student-detail-screen.tsx:307-314` `membership === "joinable"` iken her koşulda
`:join` çağırır; `:apply` yalnız tip imzasında ve `queries.ts:294`'te var.
Mock ise `joinMode !== "open"` iken `:join`'e **409 `wrong_mode`** döndürür
(`club-handlers.ts:309-322`). Yani onaylı kulüpte "Kulübe katıl" mock'ta patlar.
§4.2 zaten "iki akış aynı komutla" demişti — backend `:join`'i moda göre
`Active`/`Pending` üretir (§10 uç 27), `:apply` yazılmaz. **FE:** `:apply`
sözleşmeden ve `queries.ts`'ten düşer, mock'un 409 dalı silinir.

### 19-B · `:leave` iki iş yapıyor 🟡 — **backend**

Sözleşme "üyelikten çık" der (`contract.ts:655`), ekran `pending` başvuruyu geri
çekmek için de aynı ucu çağırır (`student-detail-screen.tsx:352`). Backend
`Pending → Left` geçişini de kabul eder; ayrı uç açılmaz (aynı komut, aynı
sonuç: öğrencinin kulüple bağı biter). Domain'de `Withdraw()` ve `Leave()`
iki metot olabilir, uç tektir.

### 19-C · Veli geçmiş özeti istemcide hesaplanıyor 🟡 — **backend + FE**

`ClubParentHistoryDto` yalnız `{ child, items }` döner; ekran `activityCount`
ve `hourCount`'u kendisi toplar (`parent/[studentId]/history.tsx:38-46`).
Öğrenci ucu (`/students/me/clubs/history`) aynı bilgiyi `summary` bloğuyla
sunucudan alıyor. Proje kuralı "toplamlar sunucudan" (`history-screen.tsx:13`)
veli yüzünde ihlal edilmiş; iki yüz aynı sayıyı iki yerde hesaplarsa bir gün
ayrışır. Backend uç 33'e `summary` ekler; **FE** hesaplamayı siler.

### 19-D · Bildirim çözümleyicisi `/clubs/...`'ı tanımıyor 🔴 — **FE**

`packages/core/src/notifications/logic.ts:436-485 · resolveNotificationTarget`
yalnız `announcements`, `homework` ve `NOTIFICATION_AREA_BY_PATH`
(`attendance|schedule|duties|grades`, satır 213-222) kollarını bilir. `/clubs/1`
için `null` döner → web'de zil satırı tıklanamaz
(`apps/web/features/notifications/notification-href.ts:68-69`), mobilde push
dokunuşu hiçbir yere gitmez (`navigate-to-target.ts:83-122`, `push-router.ts:81-83`).
Web mock'u iki kulüp bildirimini `/clubs/1` ile örneklemiş
(`notifications-data.ts:113-114`) ama tıklanmıyor. **FE:** `clubs` kolu —
`/clubs/{guid}` → role göre üç hedef (§18.4). `GUID_PATTERN` mock'un `"1"`
kimliğini eler; mock verisi GUID'e çevrilmeli (§19-J).

### 19-E · Etkinlik durumu değiştiren kurallar mock'ta, belgede yoktu 🟢 — **backend**

Mock'un ima ettiği ve backend'in **aynen** uygulayacağı davranışlar
(`club-data.ts` satırları): oluşturmada danışman varsa `active` (243-245, K-12);
`applicationOpen = joinMode === "open" || applicationStart != null` (238);
onayda `memberCount++` + kontenjan dolunca `applicationOpen=false` (449-473);
`:publish` yalnız `draft`tan, tekrar no-op (559); `:cancel` satırı silmez
(566-581); roster PUT delta (639-656); roster ilk okumada üye listesinden
`registered` (622-638); keşif yalnız `active` (769-795); öğrenci etkinlikleri
üye olduğu kulüplerin `published` gelecek etkinlikleri (880-907). Bunlar §10
notlarına işlendi.

### 19-F · Kategori telde Türkçe etiket 🟠 — **FE** (S-11)

`ClubCategory` on değeri `"Bilim"…"Diğer"` **string sabit** olarak tel değeri
(`types.ts`, `endpoints.ts:139-141`); bilinmeyen değer sessizce `"Diğer"`e
düşer. Backend İngilizce kod üretirse (S-11) FE **her kulübü "Diğer" gösterir
ve hata vermez** — sessiz bir yanlış. **FE:** `CLUB_CATEGORIES` sabiti
`{ code, label }` çiftine döner, `endpoints.ts` daraltması koda bakar. Faz 1 ile
aynı anda yapılır.

### 19-G · `reason` alanları hiç dolmuyor 🟢 — **backend**

`:approve`/`:reject` ve `:changeStatus` gövdelerinde `reason` var, üç ekran da
`null` gönderir (`queries.ts:155`, `status-dialog.tsx:72`). Yalnız `:cancel`'ın
gerekçesi gerçektir (15-500). Backend üçünü `string?` alır, validator zorunlu
kılmaz; `RejectReason` kolonu (§4.2) boş kalabilir. Ekrana gerekçe alanı
eklemek ürün kararıdır, MVP dışı.

### 19-H · Üye yönetimi menüsü ve `paused` 🟢 — **karar** (S-14)

Web commit'i "Rol ata / Üyelikten çıkar" menüsünü bilinçli atlamış
(`panel-page.tsx:17-22`: `PATCH/DELETE /members/{id}` yok). `paused` üyelik
durumu tel sözleşmesinde var ve `pausedMemberCount` kartı çiziliyor, ama
hiçbir uç `paused` yazmıyor. Enum ve sayaç yazılır, yazma ucu Faz 6+.

### 19-I · `inactive` kulübü yeniden açma düğmesi yok 🟢 — **FE** (S-15)

`status-dialog.tsx` yalnız `inactive` ve `archived` üretir. Pasife alınan kulüp
web'den bir daha aktifleştirilemez. Backend uç 5'te `active`'i kabul eder
(`Inactive → Active` geçişi), FE düğmeyi sonra bağlar.

### 19-J · Mock kimlikleri GUID değil 🟢 — **FE**

`"1"`, `"a-1-1"`, `"9001"`, `"st-elif"` (`club-data.ts`). Backend GUID üretir;
bildirim çözümleyicisi GUID ister (19-D). Mock verisi GUID'e çevrilmeli —
Homework/Grade mock'ları bunu zaten yapıyor.

### 19-K · Mobil roll-call rotası erişilemez 🟡 — **FE**

`apps/mobile/src/app/clubs/activities/[activityId]/roll-call.tsx` var, ama
danışman kartı öğretmeni yalnız `applications`'a götürüyor
(`app/clubs/index.tsx:55-60`); mobilde öğretmen etkinlik listesi ekranı yok.
Backend'i ilgilendirmez; uç 14/15 web'den kullanılıyor.

### 19-L · Öğretmen için etkinlik detay ucu yok 🟢 — **kabul**

Roster sayfası etkinliği listeden `.find()` ile buluyor
(`activity-roster-page.tsx:56-59`). `GET /activities/{id}` (öğretmen yüzü)
sözleşmede yok; roster DTO'su etkinlik başlığını zaten taşıyor. Uç açılmaz.

### 19-M · Danışmanlık ilişkisi tek kaynaktır 🟢 — **backend**

Mock'ta kulüp 6'nın `advisorId` `null` iken `/clubs/mine`'da görünüyor ve
yorum "backend'de ilişki `TeacherAdvisories` üzerinden ayrı tutulur" diyor
(`club-data.ts:352-355`). **Bu depoda öyle bir tablo yoktur ve açılmaz** (S-7:
tek danışman). `Club.AdvisorTeacherPersonId` tek kaynaktır; `/clubs/mine`
= `AdvisorTeacherPersonId == currentPersonId`. Mock'un tutarsızlığı düzeltilir.

### 19-N · Sezon parametresi hiçbir uçta yok 🟢 — **kabul, §13 güncellenir**

FE `sessionId`/`academicSessionId` göndermiyor; geçmiş sezon görünümü yok
("dönem içi", `contract.ts:280`). Sunucu aktif sezonu tenant bağlamından çözer.
§13'teki `?sessionId=` önerisi **MVP dışı**dır; kolon (K-1) yine Faz 1'de doğar,
parametre rota doğduğunda eklenir.

### 19-O · İzin kodları FE yorumlarıyla ayrışıyor 🟢 — **belge**

FE yorumları `clubs.view` / `clubs.manage` diyor (`club-screen.tsx:9`,
`club-list-page.tsx:42`); izin kataloğunda yalnız modül etiketi var
(`permissions/constants.ts:79` → `clubs: "Kulüpler"`), somut anahtar yok.
Kanonik kodlar §5.1'dekilerdir (`clubs.read/write/manage/join`); `canWrite`
sabiti (`club-list-page.tsx:41-45`, hep `true`) `clubs.manage`'e bağlanır.

### Özet — FE'ye düşen iş listesi (backend'i beklemez)

| # | İş | Ne zaman |
| --- | --- | --- |
| F1 | Kategori sabiti `{ code, label }` (19-F) | Faz 1 ile |
| F2 | `:apply` sözleşmeden düşer, mock 409 dalı silinir (19-A) | Faz 2 ile |
| F3 | Veli geçmiş `summary`'yi sunucudan okur (19-C) | Faz 4 ile |
| F4 | `resolveNotificationTarget` `clubs` kolu + mobil `navigate-to-target` (19-D) | Faz 5 ile |
| F5 | Mock kimlikleri GUID (19-J) | F4 ile |
| F6 | `canWrite` → `clubs.manage` (19-O) | Faz 1 ile |
| F7 | Mobil öğretmen etkinlik listesi → roll-call (19-K) · `active`'e dönüş düğmesi (19-I) | Sonra |

---

## 20. Ayarlar — kulüp için portlanan ne var, ne yok

Kulüp portu **ayarlar ekranlarına hiç dokunmadı**: `apps/web/features/settings`,
`apps/mobile/src/features/school-settings` ve `more` altında kulüp geçen satır
yok. Kulüp politikası (öğrenci başına kulüp sınırı — S-5, kontenjan
varsayılanı, başvuru penceresi) ekranı **yoktur**; dolayısıyla `SchoolSettings`'e
kulüp kolonu **açılmaz** — ekranı olmayan kural yazılmaz. S-5 "MVP'de sınırsız"
kararı bununla tutarlıdır.

Ayarlara dokunan tek şey **bildirim matrisi**dir ve iki katmanı vardır:

1. **Mock matris satırları** `kl1…kl4` (`apps/web/mocks/notifications-data.ts:41-46`,
   `[eventKey, name, group, supportsSms, portal, email, sms]`). Bunlar yer
   tutucudur; gerçek anahtarlar `CLUB_*` (§9.2) ve grup `"Club"` → "Kulüp"
   (`constants.ts:99,108`) FE'de zaten var. Backend seed'i yazıldığında mock
   satırları `CLUB_*` anahtarıyla değiştirilir; `kl2`'nin `email: true` değeri
   seed'e taşınmaz (§9.2).
2. **Push sütunu web matrisinde yok.** `notification-tab.tsx:109-146` yalnız
   Portal / E-posta / SMS sütunlarını çizer; backend `NotificationRuleRowDto`
   `SupportsPush` + `PushEnabled` döndürüyor (`NotificationMatrixDto.cs:35-79`)
   ve `RuleItem.PushEnabled` üç durumlu kabul ediyor. Bu K-02 kapsam dışı
   maddesi "ayar ekranına Push toggle'ı" (`S-8`) hâlâ açıktır ve **kulübe özgü
   değildir** — ama sonucu kulüpte görünür: yönetici `CLUB_ACTIVITY_PUBLISHED`
   push'unu açmak istese (S-9 varsayılanı kapalı) ekranda düğmesi yoktur.
   Bu belge o işi kapsamına almaz; bağımlılık olarak kaydeder.

Mobil "Daha fazla" menüsünde kulüp girişi öğretmen/öğrenci/veli için `/clubs`,
yönetici satırında **href yok** (`nav-config.ts:480-505`) — yönetici mobil yüzü
bilinçli olarak portlanmadı (`app/clubs/index.tsx:42` → `PlannedScreen`).
Backend için sonucu: yönetici uçları (1, 2, 4, 5, 16) yalnız web'den çağrılır.
