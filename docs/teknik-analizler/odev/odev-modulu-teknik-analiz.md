# Ödev (Homework) Modülü — Teknik Analiz

**Yazım:** 26 Ağustos 2026 · **Revizyon:** 27 Ağustos 2026
**Kapsam:** `oksis-api` backend modülünün sıfırdan yazımı

> **27 Ağustos revizyonu.** Belge yazıldıktan sonra (26-27 Ağustos) dokuz ekran
> tasarımla yan yana konup gezildi. O gözden geçirme **sözleşmeyi dört yerde
> değiştirdi**, bir kusur kaydını **kapattı** ve birini büyük ölçüde kapattı.
> Değişen bölümler: §4.1 (`UpdatedAt` tuzağı), §6 (uç sayısı),
> §6.3 (**K-8 kaldırıldı**), §6.4, §7 (`updatedAtLabel`), §11.2, §11.3,
> §13.2 ve §13.3. Ölçüm tarihi geçen ifadeler yeniden ölçüldü.

> **Kaynak beyanı.** Bu belge `oksis/docs/teknik-analizler/` altındaki ödev
> analizinden **bağımsız** yazıldı; o belge kaynak olarak kullanılmadı. Buradaki
> her ifadenin dayanağı ya çalışan koddur ya da ölçülmüş bir davranıştır.
> Dayanağı olmayan yerler "**karar bekliyor**" diye işaretlidir.

---

## 0. Yöntem — neye bakıldı

| Kaynak | Konum | Ne söyler |
| --- | --- | --- |
| **Davranış** (birincil) | `oksis-ui/packages/api-mocks/src/homework/homework-handlers.ts` | Durum makinesi, hata kodları, alan daraltması |
| **Kabul kriteri** | `…/homework-handlers.test.ts` + `homework-data.test.ts` | 97 test, hepsi yeşil |
| **Wire şekli** | `oksis-ui/packages/api/src/homework/contract.ts` | DTO + path (module augmentation) |
| **Türev mantık** | `oksis-ui/packages/core/src/homework/` | Gruplama, etiket, durum→ton eşlemesi |
| **Bugünkü backend** | `oksis-api/src/**` | Ne var, ne yok, ne yeniden kullanılır |

Mock **mutlu yolu değil sözleşmenin tamamını** uygular. `.NET` handler'ları buna
karşı yazılacaktır; test dosyası o davranışın okunabilir tarifidir.

---

## 1. Bugünkü durum — backend'de ne var

### 1.1 Modülün kendisi: yok

`src/Oksis.Application/Modules/Homework/` yalnız bir README taşır (0 handler),
`src/Oksis.Domain/Modules/Homework/` **hiç yoktur** (0 entity). Klasör modülün
adını rezerve eder, varlığını değil.

### 1.2 Zaten hazır olanlar

| İhtiyaç | Karşılığı | Durum |
| --- | --- | --- |
| Modül anahtarı | `module_configs` → `homework` (Free plan, aktif) | ✔ seed'li |
| Okuma izni | `homework.read` | ✔ |
| Yönetim izni | `homework.manage` | ✔ |
| **Yazma izni** | `homework.write` | ✘ **yok — §5.2** |
| Öğretmen kapsamı | `ITeachingSlotReader` (`TeachingSlot = şube × ders`) | ✔ Not modülü kullanıyor |
| Rehber öğretmen kapsamı | `ClassRoom.HomeroomTeacherId` | ✔ |
| Veli kapsamı | `ParentStudentRelationship` | ✔ Not/Yoklama kullanıyor |
| Okul günü / saat dilimi | `School.TimeZone` | ✔ |
| Okul kademesi | `GradeLevel.EducationLevel` (Preschool/Primary/Middle/High) | ✔ |
| Dosya altyapısı | `POST /api/v1/files` + `StoredFile` + `FileAttachment` | ✔ istemci zaten konuşuyor |
| Dosya sahibi | `StoredFile.CreatedBy` (`TenantEntity`) | ✔ **açık soru kapandı** |
| Ödev dosya kategorisi | `FileCategories.AssignmentSubmission` (20 MB, pdf/docx/jpg/png, virüs taramalı, sezon+1 yıl) | ✔ istemci 27 Ağustos'ta doğru ada geçti (§11.2) |
| Zamanlanmış iş altyapısı | Hangfire + `UseOksisRecurringJobs()` | ✔ |
| Bildirim dağıtımı | `NotificationKind` + `InAppNotificationChannel` | ✔ (ödev değeri yok) |
| **Bildirim olay tipi** | `HOMEWORK_*` | ✘ **seed'den düşmüş — §12.1** |

### 1.3 Emsal modül: Grades

Ödev, yapı olarak **Not modülünün ikizidir** ve onun mimarisi kanıtlanmıştır
(`src/Oksis.Application/Modules/Grades/ARCHITECTURE.md`). Aynı üç karar burada da
geçerlidir: kapsam ders programından türer, istemciden rol parametresi kabul
edilmez, denetim kaydı hücre başına değil olay başına yazılır. Ödev'in Not'tan
ayrıldığı tek yapısal nokta: **ödevde "defter" katmanı yoktur** — ödev doğrudan
şube × ders × son teslim üçlüsüdür ve tembel oluşmaz.

---

## 2. Kavramlar — karıştırma

| Kavram | Karşılığı | Durum taşır mı |
| --- | --- | --- |
| **Ödev** (`Homework`) | şube × ders × son teslim tarihi | **Evet — yayın birimi budur** |
| **Takip satırı** (`HomeworkTracking`) | ödev × öğrenci | Evet (beş değerli) |
| **Teslim** (`HomeworkSubmission`) | takip satırına bağlı öğrenci dosyası | Kaldırılmış/aktif |
| **Ek** (`HomeworkAttachment`) | öğretmenin ödeve koyduğu dosya **ya da bağlantı** | Hayır |

**K-1 — çoklu şube = N kayıt.** Öğretmen tek formda üç şube seçtiğinde **üç ayrı
ödev** doğar; yanıt `{ ids: [...] }`'dir. Tek kayıt + N şube olsaydı bir şubenin
son teslimi ötelendiğinde diğerleri de kayardı.

**Takip satırı ile teslim aynı şey değildir.** Öğrencinin fotoğraf yüklemesi
`Status`'ü değiştirmez; işaretleme öğretmenin kararıdır. Bu kural mock'ta
testlidir ve arayüzde sabit bir bilgi satırıyla söylenir.

---

## 3. Durum makinesi

```
                 (oluştur)
                     │
                     ▼
                  ┌──────┐   sil ── ► (yok)      ← SESSİZ, bildirim üretmez
                  │Draft │
                  └──┬───┘
             publish │ (GERİ ALINAMAZ — hedef bu anda materialize edilir)
                     ▼
                ┌──────────┐  cancel ─► ┌──────────┐
                │Published │            │Cancelled │
                └────┬─────┘            └──────────┘
               close │
                     ▼
                 ┌────────┐
                 │ Closed │
                 └────────┘
```

| Geçiş | Kim | Ön koşul | İhlalde |
| --- | --- | --- | --- |
| create → Draft | sahip öğretmen | başlık dolu, tarih `YYYY-MM-DD` | `validation` 400 |
| Draft → Published | sahip | `DueDate >= bugün` **ve hedef boş değil** | `due_date_past` 400 / `empty_target` 409 |
| Draft → (silme) | sahip | — | yalnız Draft; değilse `invalid_state` 409 |
| Published → Cancelled | sahip | gerekçe ≥ 15 karakter | `validation` 400 |
| Published → Closed | sahip | — | idare **kapatamaz** (izleyicidir) |
| Draft → Published (vekâleten) | idare | sahibi okuldan ayrılmış olmalı + yeni son teslim + gerekçe ≥ 15 | — |

**Yayın geri alınamaz.** Not modülünde `UnpublishAssessment` vardır; ödevde
karşılığı **yoktur ve bilinçlidir**: yayın anında öğrenciye bir iş atanmıştır,
onu "hiç olmamış" saymanın yolu iptaldir (izi kalır), geri alma değil.

Düzenleme `Closed`/`Cancelled`'da kapalıdır (`invalid_state`). `Draft` ve
`Published` düzenlenebilir — yayındaki ödevin başlığını düzeltmek meşrudur.

---

## 4. Varlık tasarımı (öneri)

Aşağıdaki şema mock'un iç kayıtlarından (`HomeworkRecord`/`TrackingRecord`/
`SubmissionRecord`) türetildi ve repo kurallarına uyarlandı (fluent API,
`TenantEntity`, `IHasTenant` + global query filter).

### 4.1 `Homework` — aggregate root

```
Id · SchoolId · AcademicTermId · ClassRoomId · SubjectId · OwnerTeacherPersonId
Title (200) · Description (4000, null)
DueDate            DateOnly          ← SAAT YOK (§10)
Status             HomeworkStatus    (Draft|Published|Closed|Cancelled)
TargetType         HomeworkTargetType(WholeClass|SelectedStudents)
PublishedAt · ClosedAt · CancelledAt   DateTimeOffset?
CancelReason (500, null)
[TenantEntity: CreatedAt/By · UpdatedAt/By · IsDeleted · RowVersion]
```

- **`OwnerHasLeft` bir kolon DEĞİLDİR.** Mock'ta alan olarak duruyor ama gerçek
  karşılığı `Person`/`RoleAssignment` durumundan türer. Kolonlaştırmak, öğretmen
  ayrıldığında güncellenmesi gereken ikinci bir gerçek üretirdi.
- Cross-aggregate referanslar **yalnız Id** (repo kuralı; `ClassRoom` emsali).
- `DueDate` için `DateOnly` → SQL `date`. `DateTimeOffset` kullanmak wire'da
  olmayan bir saat kavramı uydururdu.
- **`TenantEntity.UpdatedAt` doğrudan `updatedAtLabel`e projeksiyonlanamaz**
  *(27 Ağustos)*. Wire'daki alan "ödev **yayından sonra içeriği düzenlendi**"
  demektir; `UpdatedAt` ise HER kaydetmede ilerler — yayınlama, kapatma, iptal,
  hatta ödevin kendisine dokunmayan bir toplu işlem. Naif projeksiyon, hiç
  düzenlenmemiş bir ödevde öğrenciye "Güncellendi: bugün" gösterirdi ve öğrenci
  değişmemiş bir açıklamayı yeniden okurdu.
  Doğrusu **ayrı bir kolondur** (`ContentUpdatedAt DateTimeOffset?`), yalnız
  `Title`/`Description`/`DueDate`/`Attachments` değiştiğinde ve yalnız
  `Status != Draft` iken yazılır. Taslak düzenlemesi damgayı ilerletmez —
  taslağı henüz kimse görmediği için "güncellendi" diyecek bir okuyucusu yoktur.

### 4.2 `HomeworkTargetStudent` — yalnız taslakta yaşar

```
Id · SchoolId · HomeworkId · StudentPersonId
```

`SelectedStudents` hedefinde oluşturma anında seçilen alt küme. **Yayında
tüketilir**: `Publish` bu satırlardan takip satırlarını üretir. Ayrı tablo
gerekli çünkü taslakta takip satırı **yoktur** — ödev henüz kimseye ulaşmamıştır
ve "işaretlenmemiş" bir satır göstermek yalan olurdu.

### 4.3 `HomeworkTracking` — ödev × öğrenci

```
Id · SchoolId · HomeworkId · StudentPersonId
Status             TrackingStatus (Unmarked|Completed|Incomplete|NotDone|Exempt)
ExemptReason (200, null)
MarkedAt · MarkedBy            DateTimeOffset? / Guid?
AddedAfterPublish  bool
UNIQUE (HomeworkId, StudentPersonId)
```

- **`StudentNo` ve `FullName` denormalize EDİLMEZ.** Mock onları satırda taşır
  (test kolaylığı); gerçekte okuma tarafında `Person`/`StudentEnrollment`'tan
  join edilir. Snapshot almak, ad değişikliğinde eski ödevlerde eski adı
  gösterirdi.
- `ExemptReason` **duruma bağlıdır**: `Exempt` dışına çıkan satır gerekçesini
  kaybeder (aksi hâlde ızgarada "Tamamlandı — Raporlu" gibi çelişen satır kalır).
  Mock bunu uyguluyor ve testliyor.
- `AddedAfterPublish`: yayından sonra şubeye gelen öğrenci. Satırı açılır ama
  öğretmen "bu ödev ona verilmemişti" bilgisini görür.

### 4.4 `HomeworkAttachment` — öğretmenin eki

```
Id · SchoolId · HomeworkId
Kind (File|Link) · StoredFileId? · Url? · DisplayName (200) · SortOrder
```

**Neden `FileAttachment` yeniden kullanılmıyor:** `Documents.FileAttachment`
polimorfiktir ve tam olarak bu iş için uygundur — ama **yalnız dosya bağlar**.
Ödev ekinin `Link` türü vardır (öğretmenin verdiği video/kaynak bağlantısı) ve
`FileAttachment` bir URL taşıyamaz. İki türü iki ayrı tabloya bölmek, ekranda tek
liste olan bir şeyi iki sorguya bölerdi.

**Ama dosya türünde ayrıca bir `FileAttachment` satırı da yazılmalıdır** —
Documents modülünün retention ve kullanım hesapları bağı oradan görür.

### 4.5 `HomeworkSubmission` — öğrencinin teslimi

```
Id · SchoolId · HomeworkTrackingId · StoredFileId
UploadedAt (= CreatedAt) · UploadedByPersonId (= CreatedBy)
RemovedAt? · RemovedBy? · RemovedReason (500, null)
```

**Neden ayrı tablo, `FileAttachment` değil:** teslimin `FileAttachment`'ta
karşılığı olmayan **üç alanı** var — idari kaldırmanın gerekçesi, kaldırılma anı
ve "aktif dosya" kavramı (üst sınır 5, §9). `FileAttachment`'a bu üç alanı
eklemek, ödevin özel ihtiyacını tüm modüllere taşımak olurdu.

**Kaldırma SOFT'tur**: satır kalır, erişim kapanır. Öğrenci "dosyam kayboldu"
demez; idare kimin neyi neden kaldırdığını gösterebilir.

### 4.6 `HomeworkAuditEntry` — Grades emsali

Denetim **hücre başına değil olay başına** yazılır: yayın, vekâleten yayın,
iptal, idari kaldırma, toplu tamamlama (**tek özet satır**: "n satır
tamamlandı"). Tek tek işaretlemeler için kayıt yazılmaz — 30 satırlık bir ödevde
denetim ekranı okunamaz hâle gelirdi (`GradeAuditEntry` kararının aynısı).

---

## 5. İzin ≠ kapsam

### 5.1 Ayrım

| Soru | Mekanizma |
| --- | --- |
| Kim? | JWT |
| Ödev **verebilir mi**? | `homework.write` (`[RequirePermission]`) |
| **Hangi** şubeye? | `ITeachingSlotReader` — (şube, ders) çifti |
| Yönetici mi? | `homework.manage` |
| Rehber olduğu şube? | `ClassRoom.HomeroomTeacherId == callerPersonId` |
| Hangi çocuğu? | `ParentStudentRelationship` — `studentId` **sunucuda** doğrulanır |
| Kendi ödevi? | `Person.LinkedAccountId == currentUser.Id` |

`SubjectTeacherAssignment` **kullanılmaz**: `ClassRoomId` taşımadığı için "9-A'nın
matematik öğretmeni" diyemez, yalnız "matematik öğretmeni" der. Not modülü aynı
gerekçeyle onu eledi.

### 5.2 Eksik izin: `homework.write`

Bugün yalnız `homework.read` ve `homework.manage` seed'li
(`PermissionSeedData.cs:87-88`). "Öğretmen yazar / yönetici yönetir" ayrımı
üçüncü izne dayanır:

| Rol | read | write | manage |
| --- | --- | --- | --- |
| SchoolAdmin | ✓ | ✓ | ✓ |
| Teacher | ✓ | ✓ | — |
| Student | ✓ | — | — |
| Parent | ✓ | — | — |

`homework.manage`, Not modülündeki `grades.manage` gibi `AllPermissionIds()`
kataloğuna **girmemeli**, yalnız `SchoolAdmin` satırıyla verilmelidir — platform
hesabı okul içi ödev kararı vermez.

Öğrencinin yükleme/silme uçları **ayrı izin kodu açmaz**: `homework.read` +
self kapsamıyla çalışır. Yükleme, kendi kaydını okuma yüzeyinin doğal uzantısıdır.

### 5.3 Kapsam dışı = 404

Yetkisiz erişimde **403 değil 404** döner. 403 "var ama yasak" der ve erişilemeyen
bir varlığın **varlığını doğrular** — velinin, çocuğu olmayan bir öğrencinin
kimliğini denemesi buna yeter. Mock bunu her uçta uyguluyor.

### 5.4 İstemciden rol parametresi kabul edilmez

Mock'ta görünüm `viewer` adlı **modül state'inden** gelir ve `setMockViewer` ile
senaryo barından ayarlanır; istemcinin gönderdiği `view`/`role` parametresi yok
sayılır. Gerçekte bu `ICurrentUser`'dan türer. Parametreyle değiştirilebilseydi
yetki istemcide olurdu — yetki yükseltmenin en kısa yolu.

---

## 6. Uç envanteri

Mock'ta **çalışan ve testli** 26 operasyon; **sözleşmede olup mock'ta olmayan** 2
operasyon (⚠). *(26 — 26 Ağustos'ta yönetici filtre evreni ucu eklendi, §6.3.)*

### 6.1 Öğretmen (sahip) yüzü

| # | Uç | Kapsam kapısı |
| --- | --- | --- |
| 1 | `POST /homework` | `homework.write` + TeachingSlot; her şube için ayrı kayıt, `{ids}` |
| 2 | `PUT /homework/{id}` | sahip; `Closed`/`Cancelled` → 409 |
| 3 | `POST /homework/{id}:publish` | sahip; `DueDate >= bugün`; hedef boşsa `empty_target` |
| 5 | `POST /homework/{id}:cancel` | sahip; gerekçe ≥ 15 |
| 6 | `POST /homework/{id}:close` | sahip **yalnız** |
| 7 | `DELETE /homework/{id}` | sahip; yalnız `Draft`; **sessiz** |
| 8 | `GET /homework/mine` | sahiplik daraltması sunucuda (`termId`/`classRoomId`/`status`) |
| 10 | `GET /homework/{id}` | üç görünüm (§7) |
| 11 | `GET /homework/{id}/tracking` | görünüme göre alan daraltması |
| 12 | `PUT /homework/{id}/tracking/{studentId}` | **yalnız sahip**, yalnız `Published`; `exempt` → gerekçe zorunlu |
| 13 | `POST /homework/{id}/tracking:bulk-complete` | yalnız `Unmarked` satırlar; audit tek özet |
| 26 | `GET /homework/form-context` | formun bağlamı — §6.4 |
| 27 | `GET /homework/classrooms/{id}/students` | hedef seçici; kapsam dışı şube → 404 |

### 6.2 Öğrenci ve veli yüzü

| # | Uç | Not |
| --- | --- | --- |
| 14 | `GET /homework/my` | `{ today, items }` — dizi değil (§10) |
| 15 | `GET /homework/{id}/my` | **iptal edilmiş ödev de döner** (liste döndürmez) |
| 16 | `POST /homework/{id}/submissions` | gövde `{ fileId }` — dosya Files modülünde |
| 17 | `DELETE /homework/{id}/submissions/{submissionId}` | ödev kapanana kadar |
| 18 | `GET /homework/family?studentId=` | çocuk istemciden, erişim sunucuda |
| 19 | `GET /homework/{id}/family?studentId=` | salt okunur ikiz; `canSubmit` **alanı yok** |

### 6.3 Yönetici yüzü

| # | Uç | Not |
| --- | --- | --- |
| 20 | `GET /homework/admin` | `termId`·`classRoomId`·`subjectId`·`status`·`ownerTeacherPersonId`·`dueFrom`·`dueTo` |
| 28 | `GET /homework/admin/filters` | filtre evreni + sunucunun günü — aşağıda |
| 21 | `GET /homework/density?weekStart=&schoolStage=` | şube × gün; `Draft`/`Cancelled` sayılmaz |
| 22 | `GET /homework/pending-check` | `isOverdue && unmarkedCount > 0`; en eski üstte |
| 24 | `GET /school-settings/homework-settings` | `SchoolSettingsController` (`grade-settings` emsali) |
| 25 | `PUT /school-settings/homework-settings` | üç alan, üçü de aralık doğrulamalı |
| 4 | ⚠ `POST /homework/{id}:publish-for` | **mock'ta handler YOK** — §13.1 |
| 23 | ⚠ `POST /homework/{id}/submissions/{sid}:remove` | **mock'ta handler YOK** — §13.1 |

**K-8 KALDIRILDI (26 Ağustos 2026, ürün sahibi kararı).** Belgenin ilk sürümü
"öğretmen bir filtre boyutu değildir; uç `ownerTeacherPersonId` **kabul etmez**"
diyordu. Yönetici ekranı tasarımla karşılaştırıldığında filtre şeridinde
**Öğretmen** açıkça isteniyordu ve karar kuralın üstüne yazıldı: uç artık
`ownerTeacherPersonId` **kabul eder**.

Kuralın gerekçesi yine de ölmedi, sınırı daraldı. K-8'in koruduğu şey
**öğretmenler arası kıyas**tı: pano bir yük ölçerdir, performans karnesi değil.
Süzme kıyas değildir — "Ayşe Demir'in bu haftaki ödevleri" idari bir arama,
"kim daha çok ödev vermiş" ise sıralamadır. Kalan iki kural bu yüzden
**yürürlüktedir**:

- Yönetici listesinde ve panoda öğretmene göre **SIRALAMA yoktur**.
- `GET /homework/density` öğretmen parametresi **kabul etmez** — yoğunluk
  ölçümü şube × gün eksenindedir, öğretmen ekseninde değil.

**Backend yazarken:** `ownerTeacherPersonId` bir eşitlik süzgecidir, kapsam
kapısı değil. Yönetici zaten okulun tamamını görür; parametre yetki genişletmez,
yalnız daraltır. Kapsamı olmayan bir kimlik gelirse sonuç **boş liste**dir,
403 değil — yönetici o öğretmeni görmeye yetkilidir, o öğretmenin ödevi yoktur.

Taslak yönetici listesinde **yalnız sahibi ayrılmışsa** görünür. Çalışan
öğretmenin yayınlamadığı taslağı onun özel çalışmasıdır.

**Uç 28 — `GET /homework/admin/filters` (26 Ağustos'ta doğdu).** Filtre şeridi
yazılırken çıktı: ekran şube/ders/öğretmen listelerini **kendi elinde
tutamaz**. Sabit yazılsaydı okulun kadrosu değiştiğinde filtre yalan söylerdi;
liste sayfasından türetilseydi filtre yalnız o sayfadaki ödevlerin öğretmenlerini
gösterirdi — süzmenin amacı ise sayfada görünmeyeni bulmaktır.

```
{ today, classRooms: [{id,name}], subjects: [{id,name}], teachers: [{id,name}] }
```

Üç liste de **okul kapsamındadır** (yönetici yüzü). `today` buradan da gelir:
"Bu hafta"/"Gelecek hafta" hızlı seçimleri sunucunun gününden hesaplanır (§10).
`dueFrom`/`dueTo` bu hesabın çıktısıdır; ekran takvim kurmaz.

### 6.4 `GET /homework/form-context` — sonradan doğan uç

Bu uç ilk envanterde yoktu; oluşturma ekranı yazılırken **üç ayrı eksiklik**
olarak ortaya çıktı ve tek uçta toplandı:

```
{ today, subjectId, subjectName, lastClassRoomId,
  classRooms: [{ id, name, studentCount }] }
```

- `classRooms` — okul geneli `/class-rooms` **yanlış cevaptır**: öğretmene ödev
  veremeyeceği şubeyi seçtirir, sunucu da kapsam kapısında reddeder. Liste
  `ITeachingSlotReader.GetForTeacherAsync`'ten türer. Rehber öğretmen görünümünde
  liste **boştur** — rehberlik ödev verme yetkisi değildir.
- `subjectId` — görevlendirmeden gelir, ekranda sabit kodlanamaz.
- `today` — **sunucunun okul günü**; §10.
- `lastClassRoomId` — *(26 Ağustos'ta eklendi)* öğretmenin **en son ödev verdiği
  şube**, yoksa `null`. Form onu SEÇMEZ, yalnız ipucu olarak gösterir
  ("Son: 10-C"). Otomatik seçmek, iki şubeye ders veren öğretmenin yanlış şubeye
  ödev vermesini bir tıkla mümkün kılardı; ipucu ise seçimi öğretmende bırakır.
  Sunucu tarafında bu, sahibin ödevlerinin `CreatedAt`'e göre en yenisidir —
  taslak dâhil, çünkü ipucunun ölçtüğü şey **öğretmenin neyle uğraştığı**.

---

## 7. Alan daraltması — görünüm × alan

Daraltma **serileştirme düzeyindedir**: gizlenen alan `null` değil, **şemada
hiç yoktur**. Testler bunu `'exemptReason' in row` ile doğruluyor; "null döner"
yetmez, çünkü `null` alanın var olduğunu ve boş olduğunu söyler.

| Alan | Sahip | Rehber | İdare | Öğrenci | Veli |
| --- | --- | --- | --- | --- | --- |
| `counters` (sınıf sayaçları) | ✓ | ✓ | ✓ | **yok** | **yok** |
| `exemptReason` | ✓ | **yok** | ✓ | **yok** | **yok** |
| `submissions[]` (içerik) | ✓ | **boş dizi** | ✓ | kendi | çocuğunun |
| `submissionCount` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `canEdit` / `canMark` | duruma göre | `false` | `false` | — | — |
| `canSubmit` | — | — | — | ✓ | **alan yok** |
| `updatedAtLabel` | — | — | — | ✓ | ✓ |

**Muafiyet gerekçesi öğrenciye ve aileye açılmaz.** Sağlık gerekçesi başka bir
sürecin bilgisidir; ödev ekranında yeri yoktur.

**Öğrenci/veli satırında `counters` bloğu yoktur** — kıyas yasağı bir görünüm
kuralı değil, **sözleşme kuralıdır**. Sınıfın kaçının tamamladığı tel şeklinde de
taşınmaz; taşınsaydı yarınki bir ekran onu gösterebilirdi.

**`updatedAtLabel` YALNIZ öğrenci ve veli detayındadır** *(27 Ağustos'ta
eklendi)*. Ödev yayından sonra düzenlendiyse öğrencinin bunu bilmesi gerekir —
açıklama değişmiş olabilir ve öğrenci eski metne göre çalışıyor olabilir.
Öğretmen/yönetici yüzünde alan İSTENMEDİ: orada düzenleyen zaten kendisidir.
Değerler `"bugün"` · `"dün"` · `"3 Eylül"`; hiç düzenlenmemişse `null` ve ekran
satırı **çizmez**. Ham damga değil hazır metin — gerekçesi §10.

**Velide `canSubmit` alanı hiç yoktur.** `false` göndermek "yetkisi var ama şu an
kapalı" derdi; velinin böyle bir yetkisi hiç yok.

`readOnlyReason` sırası önemlidir: **görünümden gelen** salt okunurluk
(`homeroomView`/`adminView`) **durumdan gelenden önce** gelir — rehber, kapanmış
bir ödevde de kendi bandını görmelidir.

---

## 8. Sayaçlar — tek kaynak

`HomeworkCounters` **tek sınıftan** okunur; liste, detay ve ızgara aynı hesabı
kullanır. İki yerde ayrı toplama yapılırsa ekranlar birbiriyle çelişen sayı
gösterir (Not modülünde iki farklı yüzde formülünün ayrı tutulması bunun tersi
örneğidir).

```
targetCount · markedCount · completedCount · incompleteCount
notDoneCount · exemptCount · unmarkedCount · submissionStudentCount
isOverdue · isPendingCheck
```

- **Yüzde alanı yoktur.** Yüzde bir kıyas dilidir.
- `isOverdue = Status == Published && DueDate < okulGünü`. `Closed`/`Cancelled`
  için **anlamsızdır** ve `false` döner — kapanmış kayda "gecikmiş" demenin bilgi
  değeri yok.
- `isPendingCheck = isOverdue && unmarkedCount > 0` — yönetici panosunun
  "kontrol bekleyen" satırı bundan türer.
- `submissionStudentCount` **öğrenci sayar, dosya değil**: 3 fotoğraf yükleyen
  bir öğrenci 1'dir.

---

## 9. Hata sözleşmesi

| Kod | HTTP | Koşul |
| --- | --- | --- |
| `validation` | 400 | başlık boş · gerekçe < 15 · tarih formatı · tanınmayan durum · muaf gerekçesiz · bilinmeyen `fileId` |
| `due_date_past` | 400 | `DueDate < okulGünü` ile yayın |
| `invalid_state` | 409 | durum makinesi ihlali |
| `empty_target` | 409 | hedefi boş çıkan yayın |
| `submission_closed` | 409 | `Closed`/`Cancelled`'a yükleme veya ondan silme |
| `submission_limit` | 409 | 5'ten fazla aktif dosya |
| `not_found` | 404 | yok **veya kapsam dışı** |

**`empty_target` neden var:** öğrenci listesi boş bir şubeye yayın **sessizce
başarılı** oluyordu — öğretmen "yayınladım" sanıyor, ödev hiç kimseye açılmıyor,
ekranda "0/0 kontrol edildi" görünüyordu. Sessiz başarısızlık açık hatadan çok
daha pahalıdır.

Zarf her uçta `{ data, meta, errors, correlationId }`.

---

## 10. Takvim — günün sahibi sunucudur

Bu modülün en çok tekrar eden hatası buydu ve üç ayrı yerde kapatıldı.

**`DueDate` wire'da `YYYY-MM-DD`; saat alanı sözleşmede hiç yoktur.** "Yarın
23:59" gibi bir son dakika yoktur — ödevin son günü bir okul günüdür.

**Bugünün ne olduğunu sunucu söyler.** Üç uç kendi yanıtında `today` taşır:

| Uç | Alan | Neden |
| --- | --- | --- |
| `form-context` | `today` | Hızlı tarih çipleri ("Bu Cuma") bundan türer. Ekran `new Date()` kullanınca **ölçüldü**: mock 15 Eylül derken ekran 26 Ağustos üretiyordu ve seçenek `due_date_past` ile reddediliyordu. |
| `my` / `family` | `today` | Gruplama (bugün/bu hafta/ileri/geçmiş) istemcidedir ama **takvim değildir**: saati kaymış bir telefonda "Bugün son" yanlış ödevleri toplardı. |
| `density` | `today: string \| null` | Takvimin "bugün" sütununu sunucu işaretler; hafta bugünü içermiyorsa hiçbir sütun vurgulanmaz. |

`isOverdue` da aynı ilkenin uzantısıdır: **istemci tarih karşılaştırması yapmaz**.

Backend'de bu "okul günü" `School.TimeZone` ile hesaplanmalıdır — `DateTime.Today`
sunucunun bulunduğu makinenin günüdür, okulun değil.

**Yoğunluk haftası:** `weekStart` haftanın **herhangi bir günü** olabilir; sunucu
onu içeren haftanın **Pazartesi–Cuma**'sına indirger ve indirgenmiş hâlini döner.
Hafta sonu yoktur (beş sütun): ödevin son günü okul günüdür.

---

## 11. Dosya entegrasyonu

### 11.1 İki adımlı akış — ödev modülü dosya depolamaz

```
1) POST /api/v1/files      (multipart: file + category)  → { fileId }
2) POST /homework/{id}/submissions  { fileId }           → teslim satırı
```

İkinci adım düşerse dosya sunucuda **kalır** (yetim). Bu yüzden istemcideki hata
cümlesi "yüklenemedi" değildir; hangi adımın düştüğü ayrı söylenir.

Bağlanacak `fileId` **doğrulanmalıdır** — var olmayan kimlik bağlanırsa ekranda
adı olmayan bir karo belirir ve hata çok sonra, indirme anında görünür.

**Ayrıca doğrulanmalı ama bugün hiçbir yerde doğrulanmıyor:** dosyanın
`CreatedBy`'ı isteği yapan kişi mi? Bu alan `TenantEntity`'de **vardır**; kontrol
edilmezse öğrenci, kimliğini ele geçirdiği başka bir dosyayı kendi ödevine
bağlayabilir. (Mock bunu modellemiyor — mock'ta kimlik tek.)

### 11.2 Kategori uyuşmazlığı — **düzeltildi (27 Ağustos)**

İstemci `category: 'homework'` gönderiyordu
(`homework-self-detail-screen.tsx:184`). Böyle bir kategori **hiçbir yerde
yoktu**:

- Backend kayıt defterinde sekiz kategori var; doğrusu **`AssignmentSubmission`**
  (20 MB, pdf/docx/jpg/png, virüs taramalı, sezon + 1 yıl retention).
  `FileCategoryPolicyRegistry.GetRequired("homework")` → `file.category.unknown`.
- Mock, kategorileri 26 Ağustos'ta bir **politika tablosuna** taşıdı
  (`MOCK_CATEGORY_POLICIES`: `AnnouncementAttachment` + `HomeworkAttachment`,
  her birinin kendi uzantı/MIME/boyut sınırıyla). Tabloda olmayan her kategori
  yine 422 `FILES_CATEGORY_UNKNOWN` alır — `'homework'` de dâhil. Yani kusur
  **kapanmadı, netleşti**: artık açıkça istemci tarafında.

**Sonuç (o gün): öğrencinin fotoğraf yükleme akışı ne mock'ta ne gerçekte
çalışıyordu.** Ekran 5 gezilerek doğrulanmıştı ama yükleme işlemi hiç
tamamlanmamıştı; kusur gezinmeyle görünmüyordu çünkü hata ancak dosya
seçildikten SONRA doğuyor.

**Düzeltme (27 Ağustos).** İstemci artık
`@workspace/core :: HOMEWORK_SUBMISSION_CATEGORY` = `"AssignmentSubmission"`
gönderiyor; sabit, uzantı/MIME/boyut değerleriyle birlikte kayıt defterinden
birebir kopyalandı. Mock kategoriyi politika tablosuna aldı ve iki sözleşme
testi kilitledi: doğru kategori 200, tahmin edilen `'homework'` adı 422.
Web hedefinde gerçek bir görsel yüklenerek uçtan uca doğrulandı (kart
"1/5 dosya" oldu).

**Backend'de açılacak bir şey YOK** — `AssignmentSubmission` kayıt defterinde
zaten var. Bu, `HomeworkAttachment`ın (§11.3) tersidir; ikisi karıştırılmamalı.

### 11.3 Öğretmen ekleri — yazma dalı 26 Ağustos'ta yazıldı

İlk sürümde bu bölüm "yazma tarafı yok" diyordu ve doğruydu: sözleşme
`attachments` taşıyordu, okuma çalışıyordu, ama ek **yalnız seed'den
doğabiliyordu**. Ekran gözden geçirmesinde yazıldı. Bugünkü durum:

- **Mock'un `POST`/`PUT` handler'ları gövdedeki `attachments`'ı okuyor** ve
  kayda yazıyor. `PUT`ta alan **gönderilmediyse** mevcut ekler KORUNUR —
  gönderilmeyeni boş dizi saymak, başlığı düzelten bir isteğin ekleri sessizce
  silmesi olurdu. Backend'in `PUT` semantiği de böyle olmalıdır.
- **Web oluşturma ekranında ek arayüzü var** (dosya + bağlantı, iki adımlı
  yükleme, yeniden deneme). Ek yüklenirken kaydet/yayınla **kilitlidir**:
  yarım yüklenmiş bir ekle yayınlamak, öğrencinin göremeyeceği bir ek olurdu.
- **Mobil oluşturma ekranı hâlâ `attachments: []` gönderiyor** — ek arayüzü
  orada yok. Sözleşme açısından geçerli (alan opsiyoneldir), ama iki yüzey aynı
  ödevi aynı zenginlikte üretemiyor.

Ayrıca ek dosyaları **kendi kategorisini** gerektirdi: `HomeworkAttachment`
(20 MB, pdf/docx/jpg/png). Öğrencinin teslimiyle (`AssignmentSubmission`) aynı
kategori olamaz — retention ve tarama politikaları farklıdır ve öğretmenin
çalışma kağıdı öğrenci teslimi gibi imha edilmemelidir. Kategori mock'ta
**politika tablosuna** eklendi (`MOCK_CATEGORY_POLICIES`); backend'de
`FileCategoryPolicyRegistry`'ye yeni bir satır gerekiyor. Ayrıntı:
`oksis-ui/docs/backend-needs-homework.md §3.4`.

---

## 12. Bildirim ve zamanlanmış işler

### 12.1 Bildirim olay tipleri seed'den düşmüş

`HOMEWORK_CREATED` ve `HOMEWORK_DUE` eski migration snapshot'larında duruyor
(`20260624…Designer.cs`), ama **güncel `NotificationEventTypeSeedData` sekiz olay
taşıyor ve hiçbiri ödev değil**. `NotificationEventGroup` enum'unda da ödev
grubu yok (Attendance/Academic/Payment/Announcement).

Okul Ayarları'ndaki olay × kanal matrisi bu katalogdan beslendiği için **ödev
bildirimleri bugün yönetici tarafından açılıp kapatılamaz**. Ödev politikası
ekranındaki `missingNotificationMode` ile bu matris arasındaki ilişki **karar
bekliyor** (§14).

### 12.2 Ödev politikası — üç kolon, beş kontrol

```
reminderHoursBefore      int   0–72     (0 = hatırlatma yok)
missingNotificationMode  enum  off | dailyDigest | instant
dailyDensityThreshold    int   1–10
```

Arayüzde beş kontrol görünür; fazladan ikisi **alan değil görünümdür**:
"hatırlatma açık" = `reminderHoursBefore > 0`, "veli bildirimi açık" =
`mode != off`. **Bu iki anahtar için backend'e ayrı kolon açılmamalıdır** — tel
şeklini arayüze göre şişirmek, olmayan iki gerçeği kalıcılaştırmak olurdu.

Varsayılanlar: `24` · `dailyDigest` · `3`.

### 12.3 Gereken işler (henüz yazılmadı)

| İş | Tetik | Not |
| --- | --- | --- |
| `HomeworkDueReminderJob` | `DueDate - reminderHoursBefore` | Okul saat dilimine göre; `Published` ödevler |
| `HomeworkMissingDigestJob` | akşam, günde bir | `Incomplete`/`NotDone` işaretlerini veli başına **tek** bildirimde toplar |
| Anlık eksik bildirimi | işaretleme anı | Yalnız `mode == instant` |

**Yükleme bildirim üretmez** ve **taslak silme sessizdir** — ikisi de kasıtlı.

---

## 13. Bu analizde bulunan açık kusurlar

Aşağıdakiler mock'un birincil kaynak olma hedefini doğrudan etkiler.

### 13.1 İki yönetici yazma ucunun karşılığı yok — **yüksek**

`POST /homework/{id}:publish-for` (uç 4) ve
`POST /homework/{id}/submissions/{sid}:remove` (uç 23):

- `contract.ts`'te **tanımlı**,
- `endpoints.ts` + `queries.ts`'te **kancalı**,
- `homework-admin-screen.tsx`'te **butonları var** (satır 254-255, 565, 609),
- `homework-handlers.ts`'te **handler yok**, testte **satır yok**.

Yani vekâleten yayın ve idari kaldırma düğmelerine basıldığında istek hiçbir
mock'a düşmez; MSW passthrough ile gerçek API'ye (`:5112`) gider ve 404 alır.
Faz C doğrulanmadan tamamlandığı için bu gezinmeyle görülmedi.

Ayrıca `docs/backend-needs-homework.md` §7 bu ikisini **"mock'ta çalışan"** diye
listeliyor — belge yanlış.

### 13.2 Öğrenci yükleme akışı — **KAPANDI (27 Ağustos)**

§11.2. `category: 'homework'` → `AssignmentSubmission`. Sabit çekirdeğe alındı,
mock kategoriyi tanıyor, iki test kilitliyor, akış tarayıcıda uçtan uca
doğrulandı. Backend'de karşılığı zaten vardı.

### 13.3 Ek yazma dalı — **büyük ölçüde kapandı (26 Ağustos)**

§11.3. Üç eksikten ikisi kapandı: mock handler'ları ekleri artık yazıyor, web
oluşturma ekranında ek arayüzü var. **Açık kalan:** mobil oluşturma ekranı hâlâ
`attachments: []` gönderiyor. Backend'i engellemez — mock artık yazma dalının
tarifidir.

**Yeni gereksinim:** `FileCategoryPolicyRegistry`'ye `HomeworkAttachment`
kategorisi eklenecek (§11.3).

### 13.4 Numaralandırma çelişkisi — **düşük**

`contract.ts` "Uç 23"ü **idari yükleme kaldırma** sayıyor;
`backend-needs-homework.md` §7 aynı numarayı **audit kaydı listesi** sayıyor.
Uç numaraları belge içinde kimlik gibi kullanıldığı için bu çelişki karışıklık
üretir. Bu belge numarayı **yalnız mock'un yorumundan** aldı.

### 13.5 Mock kimlik evreni hâlâ tam hizalı değil — **düşük (ödev dışı)**

Ödev tarafı hizalandı (oturumun öğrencisi ve velinin iki çocuğu paylaşılan
roster'a yazıldı, 6-B açıldı). Ama not modülü hâlâ kendi çocuklarını uyduruyor
(Elif/Kerem Yılmaz) ve `GET /grades/family` gelen `studentId`'yi yok sayıp ilk
çocuğa düşüyor. Aynı mock okulda veli, çocuk seçicide Efe/Zeynep, not ekranında
Elif/Kerem görüyor. **Backend'i etkilemez; mock'un birincil kaynak olmasını
etkiler.**

---

## 14. Karar bekleyen sorular

1. **Ödev bildirimleri olay × kanal matrisine girecek mi?** Girecekse
   `NotificationEventGroup`'a bir değer ve iki `NotificationEventType` satırı
   gerekir; `missingNotificationMode` ile matris arasındaki öncelik tanımlanmalı
   (hangisi hangisini ezer?).
2. **`OwnerHasLeft` neyden türer?** `RoleAssignment` süresi dolmuş mu, `Person`
   pasif mi, `StaffRecord` ayrılış tarihi mi? Vekâleten yayın ucunun kapısı bu
   tanıma dayanıyor.
3. **Vekâleten yayında ders ve şube kimin kapsamıyla doğrulanır?** Ayrılan
   öğretmenin `TeachingSlot`'ları programda hâlâ duruyor olabilir de olmayabilir
   de.
4. **Yayından sonra şubeye katılan öğrenci** için takip satırı ne zaman açılır —
   kayıt anında bir olay dinleyicisiyle mi, yoksa ızgara okunurken tembel mi?
   (`AddedAfterPublish` alanı ikisinde de aynı, maliyet farklı.)
5. **Teslim dosyalarının retention'ı** `AssignmentSubmission` politikasıyla
   (sezon + 1 yıl) yeterli mi, yoksa ödev kapandığında erken imha mı?
6. **Çoklu şube × seçili öğrenci** kombinasyonu bugün 400 ile kapalı. Kalıcı
   kural mı, faz kısıtı mı?

---

## 15. Yazım sırası önerisi

> **Faz 1 tamamlandı — 27 Ağustos 2026.** Adım 1-3 yazıldı: `homework.write` izni ve
> rol matrisi, domain (üç varlık + durum makinesi + sayaçlar), kalıcılık ve öğretmenin
> beş okuma ucu (8, 10, 11, 26, 27). Plan:
> `docs/superpowers/plans/2026-08-27-odev-modulu-faz-1.md`. Modülün haritası:
> `src/Oksis.Application/Modules/Homework/ARCHITECTURE.md`.

1. `homework.write` izni + seed + rol eşlemesi (§5.2) — her şeyin kapısı.
2. Domain: `Homework` + `HomeworkTracking` + durum makinesi + `HomeworkCounters`.
   Birim testleri geçiş kurallarını kilitler.
3. Öğretmen okuma uçları (8, 10, 11, 26, 27) — `ITeachingSlotReader` kapısı burada
   kurulur ve sonraki her şey onu kullanır.
4. Öğretmen yazma uçları (1, 2, 3, 5, 6, 7, 12, 13) + hata sözleşmesi.
5. Öğrenci/veli yüzü (14-19) + Files bağı — teslimin kategorisi
   `AssignmentSubmission`, defterde zaten var (§11.2).
6. Yönetici yüzü (20-25, 28) + **§13.1'in mock karşılığı yazılmalı**, yoksa
   backend'in kabul kriteri yok. Uç 28 (filtre evreni) uç 20'den **önce**
   yazılmalı: liste filtresinin evreni olmadan uç 20'nin yeni parametreleri
   test edilemez.
7. Politika + zamanlanmış işler + bildirim (§12).

Her adımda kabul kriteri `homework-handlers.test.ts`'in ilgili bölümüdür.
