# OKSİS — Not (Grades) Modülü + Öğrenciler Listesi · Backend Tasarımı

| | |
|---|---|
| **Belge türü** | Uygulama tasarımı (backend) |
| **Kapsam** | `oksis-api` · `oksis-ui` sözleşme bağı |
| **Tarih** | 23 Ağustos 2026 |
| **Durum** | Karar bekleyen maddeler §7'de — onaylanınca §8'deki dilimlere göre geliştirilir |

## 0. Otorite

Bu belgenin tek girdisi **çalışan mock sunucudur**:

```
packages/api-mocks/src/grade/grade-handlers.ts   ← davranış (durum makinesi, doğrulama, hata kodları)
packages/api-mocks/src/grade/grade-data.ts       ← semantik (hesap formülleri, seed kuralları)
packages/api/src/grade/contract.ts               ← wire şekli (DTO alanları, path'ler)
```

Bir çelişkide **mock kazanır**; bu belge yanlıştır ve düzeltilir. Frontend 17 ucun
tamamını fiilen tüketiyor (13'ü hem web hem mobil), dolayısıyla sözleşme
"ileride lazım olabilir" listesi değil, bugün karşılanması gereken bir borç.

> Bu belge, 18 Ağustos tarihli `not-modulu-teknik-analiz.md`'nin yerini alır.
> O belge repo taramasına dayanıyordu ve doğru bulunmadı; kaynak olarak kullanılmadı.

---

## 1. Öğrenciler listesi — 5 alan

`GET /api/v1/students` yanıtındaki `StudentListItemDto`'ya eklenecek. İstemci
alanları **opsiyonel** tiplendi: gelmezse sütun `—` gösterir, ekran çalışmaya
devam eder (`packages/api/src/students/endpoints.ts :: toAbsence/toAverage`).

| Alan | Kaynak | Durum |
|---|---|---|
| `unexcusedDays` | Attendance — gün eşdeğeri hesabı | ✅ parçalar hazır |
| `unexcusedLimit` | `SchoolSettings.UnexcusedAbsenceLimit` | ✅ |
| `warningThreshold` | `SchoolSettings.WarningAbsenceThreshold` | ✅ |
| `termAverage` | Grades — ders ortalamalarının ortalaması | ⛔ Grades'e bağlı |
| `averageCourseCount` | Grades — ortalamaya giren ders sayısı | ⛔ Grades'e bağlı |

### 1.1 Devamsızlık — mevcut parçalarla

`GetRiskStudentsQueryHandler` aynı hesabı **zaten toplu** yapıyor:

```
AbsenceSummaries (dönem satırları)
  → AttendanceDayEquivalenceBatchLoader.LoadAsync(schoolId, termId, studentIds)
  → AttendanceReportMath.CalculateTotalUnexcusedDays(
        sessionsByDate, totalLate, carriedLate, carriedAbsence,
        halfDayLessonThresholdPercent, lateToHalfDayCount)
```

`GetStudentSummaryQueryHandler`'ın tekil yolu (`AbsenceDayBreakdownResolver
.CalculateAbsentDaysAsync`) liste için kullanılamaz — 200 satırda N+1 olur.

**Karar (onaylandı):** Bu matematik iki handler'da tekrarlanmaz. Attendance
modülü bir soyutlama yayınlar, Students onu tüketir:

```csharp
// Oksis.Application/Modules/Attendance/Abstractions/IAbsenceDaysBatchReader.cs
public interface IAbsenceDaysBatchReader
{
    Task<IReadOnlyDictionary<Guid, AbsenceDaysDto>> ReadAsync(
        Guid schoolId, Guid academicTermId, IReadOnlySet<Guid> studentPersonIds, CancellationToken ct);
}

public sealed record AbsenceDaysDto(decimal UnexcusedDays, int UnexcusedLimit, int WarningThreshold);
```

Uygulaması Attendance/Internal'da yaşar ve `GetRiskStudents` de aynı yerden okur
(bugünkü gövdesi bu arabirime taşınır). Böylece eşik matematiği tek tanımlı kalır.

**Dönem kaynağı:** Liste ucunun `TermId` parametresi yok. Aktif sezonun güncel
dönemi sunucuda çözülür (`AttendanceTermResolver` ile aynı yol). Dönem
çözülemezse üç alan da `null` döner — sütun `—` gösterir, sıfır göstermez.

---

## 2. Not modülü — domain modeli

Sözleşmeden türetilen dört varlık. Ad kuralı: **`Mark` = notun kendisi**,
`Grade` = sınıf seviyesi (workspace kuralı). Rota `/api/v1/grades` kalır — rota
modülü adlandırır, varlığı değil.

### 2.1 `GradeBook` — defter

Koordinat taşır, durum taşımaz. Tekillik: `(SchoolId, AcademicTermId, ClassRoomId, SubjectId)`.

| Alan | Kaynak / not |
|---|---|
| `AcademicSessionId`, `AcademicTermId`, `ClassRoomId`, `SubjectId` | cross-modül, yalnız ID |
| — | `sectionName`, `courseName`, `studentCount` **projeksiyonda** çözülür, kolon değil |

İlk not girişinde tembel oluşturulur (`empty` sütunlar defter olmadan da listelenir,
bkz. §3 `GET /books`).

### 2.2 `Assessment` — sütun

Yayın birimi budur. Bir hücrenin görünürlüğü kendi alanı değil, **bağlı olduğu
sütunun durumudur**.

| Alan | Not |
|---|---|
| `GradeBookId`, `ExamTypeId` | `name` (`"1. Yazılı"`) ExamType'tan gelir |
| `Status` | `empty` / `draft` / `published` / `locked` — wire'da **string** |
| `ExamDate` | `DateOnly?` — gecikme hesabının girdisi |
| `PublishedAt/By`, `UnpublishedAt/By/Reason`, `LockedAt`, `UnlockedAt/By/Reason` | denetim izinin kaynağı |
| `RowVersion` | yayın/kilit yarışı → 409 |

`enteredCount` ve `studentCount` **hesaplanır**, kolon değildir (§4.1).

### 2.3 `Mark` — hücre

`(AssessmentId, StudentPersonId)` benzersiz. Değer üç hâlli:

```
sayı        → 0..scaleMax arası ondalık
"G" | "M"   → özel değer (Girmedi / Muaf)
null        → girilmemiş
```

Wire tipi `GradeValueDto = number | string | null`. Depolamada `decimal? Value`
+ `MarkSpecialValue? Special` ayrı tutulur; ikisi aynı anda dolu olamaz.

### 2.4 `GradeAuditEntry` — denetim kaydı

Append-only. `GET /books/{id}/audit` bunu okur.

> **Düzeltme:** ilk taslakta `MarkAmendment` deniyordu — **fazla dar**. `GRADE_AUDIT`
> fixture'ı yalnız not düzeltmesi değil, defter üzerindeki TÜM olayları taşıyor:
> sütun oluşturma ("Sözlü sütununu oluşturdu"), toplu giriş ("2. Yazılı sütununa
> 24 not girdi"), yayınlama, yayından geri alma (gerekçeli), not düzeltme
> (`valueFrom`/`valueTo` dolu) ve sistem olayları (`isSystem: true`,
> "1. Dönem kapatıldı, defter kilitlendi", `isPlanned: true`).
> Tek tablo, olay tipine göre `valueFrom`/`valueTo`/`reason` nullable.

| Alan | Not |
|---|---|
| `GradeBookId`, `AssessmentId?`, `StudentPersonId?` | kapsam; sütun/hücre olayında dolar |
| `ActorPersonId?`, `IsSystem` | sistem olayında aktör yok |
| `Action` | görüntülenecek metin sunucuda kurulur (Türkçe) |
| `Reason` | yönetici işlemlerinde zorunlu; **aileyle paylaşılmaz** |
| `ValueFrom` / `ValueTo` | yalnız not düzeltmesinde |
| `OccurredAt`, `Tone?`, `IsPlanned?` | sunum ipuçları |

### 2.5 `GradeSettings` — `SchoolSettings` genişlemesi

Beş alan; yeni tablo değil (`GradeSettingsDto`):

```
visibilityPrimary | visibilityMiddle | visibilityHigh   → "hidden" | "simultaneous"
showClassAverage: bool
correctionWindowHours: int (mock 48)
```

> Geçme notu / ağırlık / yuvarlama / skala **buraya girmez** — onlar
> `AcademicPolicy` + `SchoolSettings`'te zaten var ve ikinci kez tanımlanmaz.

---

## 3. Uç → komut/sorgu eşlemesi

| # | Uç | Karşılık | İzin |
|---|---|---|---|
| — | ~~`GET /grades/terms`~~ | **Grades'te YAZILMAZ** → `academic-sessions` (§7.6) | — |
| 1 | `GET /grades/books?termId=` | `ListMyGradeBooks` | `grades.read` + kapsam |
| 2 | `GET /grades/books/{id}` | `GetGradeBook` | `grades.read` + kapsam |
| 3 | `GET /grades/books/{id}/grid` | `GetGradeBookGrid` | `grades.read` + kapsam |
| 4 | `GET /grades/assessments/{id}/entries` | `GetAssessmentEntries` | `grades.read` + kapsam |
| 5 | `PUT /grades/assessments/{id}/entries/{studentNo}` | `SetMark` | `grades.write` + kapsam |
| 6 | `POST …/entries/{studentNo}:correct` | `AmendMark` | `grades.write` (pencere içi) / `grades.manage` (dışı) |
| 7 | **`DELETE /grades/assessments/{id}/entries`** 🆕 | `ClearAssessmentMarks` | `grades.write` + kapsam |
| 8 | **`PUT /grades/assessments/{id}/exam-date`** 🆕 | `SetAssessmentExamDate` | `grades.write` + kapsam |
| 9 | **`GET /grades/books/{id}/export`** 🆕 | `ExportGradeBook` (xlsx) | `grades.read` + kapsam |
| 10 | `POST /grades/assessments/{id}:publish` | `PublishAssessment` (öğretmen, kendi sütunu) | `grades.publish` + kapsam |
| 11 | `POST /grades/assessments/{id}:publish-for` | `PublishAssessmentOnBehalf` (yönetici, öğretmen adına) | `grades.manage` |
| 12 | `POST /grades/assessments/{id}:unpublish` | `UnpublishAssessment` | `grades.manage` |
| 13 | `POST /grades/assessments/{id}:lock?unlock=` | `LockAssessment` / `UnlockAssessment` | `grades.manage` |
| 14 | `GET /grades/books/{id}/audit` | `GetGradeBookAudit` | `grades.manage` |
| 15 | `GET /grades/family?studentId=&termId=` | `GetFamilyGrades` | `grades.read` + aile kapsamı |
| 16 | **`POST /grades/family:seen`** 🆕 | `MarkFamilyGradesSeen` | `grades.read` + aile kapsamı |
| 17 | `GET /grades/students/{id}?termId=` | `GetStudentTermGrades` | `grades.read` + kapsam |
| 18 | `GET /grades/summary?termId=` | `GetGradeEntrySummary` | `grades.report` |
| 19 | `GET /grades/tracking?termId=` | `GetGradeTrackingBoard` | `grades.report` |
| 20 | `GET/PUT /school-settings/grade-settings` | `GetGradeSettings` / `UpdateGradeSettings` | okuma `grades.read` · yazma `grades.manage` |

Ayrıca `academic-sessions` modülüne: `GET /api/v1/academic-sessions/terms` (§7.6).

> **`:publish` ile `:publish-for` farkı** (ilk taslakta yanlış eşlenmişti — "republish"
> değil): `:publish` öğretmenin KENDİ sütununu yayınlaması, gövde `{silent}`,
> yalnız `status=="draft"` iken. `:publish-for` yöneticinin SORUMLU ÖĞRETMEN ADINA
> yayınlaması, gövde `{reason}` (≥15), menüde "Yönetici işlemleri" grubunda.
> Kaynak: `grade-admin-dialogs.tsx:245` başlığı "…notlarını {öğretmen} adına yayınla".

### 3.1 Sözleşmenin pazarlığa kapalı kuralları

Bunlar mock'ta **davranış** olarak duruyor; atlanırsa UI kırılır.

1. **Hücre yolu `studentNo` (string) ile** — `entries/{studentNo}`, Guid değil.
   Izgara ise `entries[].studentId` (Guid) kullanır. İki anahtar da korunur;
   roster satırı ikisini birden taşır (`GradeRosterEntryDto.id` + `.studentNo`).
2. **Yönetici gerekçesi ≥ 15 karakter** (`:unpublish`, `:lock`, `:publish-for`)
   → `400 {code:"validation"}`. `:correct` için yalnız boş-değil.
3. **`:lock` çift yönlü** — `?unlock=true` kilidi açar. Ayrı uç yok.
4. **`:publish` gövdesi `{ silent: boolean }`** — sessizde notlar hemen görünür,
   bildirim ertelenir. `silent` yok sayılamaz.
5. **Statüler string** (`"published"`), int değil. Zarf
   `{data, meta, errors, correlationId}`.
6. **Bulunamayan sütun/defter → 404** `{code:"not_found"}`.

---

## 4. Hesaplanan alanlar (mock formülleri)

Bunlar istemcide türetilemez; sunucu üretir.

### 4.1 Sütun sayaçları
```
enteredCount = değeri null OLMAYAN ve status != "transferred" öğrenci sayısı
studentCount = defterin roster büyüklüğü
```

### 4.2 Gösterge paneli kartı — `GET /grades/summary`
```
completedPercent = published / (published + draft + empty)        ← SÜTUN oranı
pendingTeachers  = geciken defterlerin ÖĞRETMENLERİNİN tekil sayısı
```

### 4.3 İdare panosu KPI — `GET /grades/tracking`
```
completionPercent = Σ enteredCount / Σ studentCount               ← HÜCRE oranı
bookCount         = okul genelindeki defter sayısı (listelenenden fazla olabilir)
```

> **Dikkat:** `completedPercent` ve `completionPercent` **farklı formüllerdir**
> (biri sütun, diğeri hücre oranı). İkisi aynı sanılıp tek hesaba indirilirse
> iki ekran birbiriyle çelişen yüzde gösterir.

### 4.4 Ders ortalaması
`FamilyCourseDto.average` + `StudentGradeRowDto.termAverage`. Ağırlıklar
`AcademicPolicy`'den okunur; `isFinal=false` iken **geçici** (karne yayınlanınca
kesinleşir). Öğrenci listesi `termAverage`'ı bu ders ortalamalarının ortalamasıdır.

---

## 5. Yetki

Dört ayrı mekanizma, karıştırılmaz:

1. **Kimlik** — JWT.
2. **RBAC izin kodu** — `grades.read` / `.write` / `.publish` / `.manage` / `.report`.
3. **Kapsam kapısı** — "bu öğretmen bu deftere yazabilir mi": `TeacherCourseLoadProjection` *(X-16: eskiden `TeachingAssignment` yazıyordu, o tablo emekli edildi)*
   üzerinden. RBAC'in üstünde, handler seviyesinde zorunlu. Görevlendirmesi
   olmayan öğretmen `grades.write` taşısa bile yazamaz.
4. **Aile kapsamı** — `/grades/family` yalnız `ParentStudentRelationship` ile
   bağlı çocuğu döner; `studentId` parametresi **doğrulanır**, güvenilmez.

> **Güvenlik notu:** Mock `/grades/students/{id}` ucunda `?viewerRole=teacher`
> sorgusuyla öğretmen daraltmasını simüle ediyor. **İstemci bu parametreyi hiç
> göndermiyor** (`endpoints.ts` içinde geçmiyor) — ölü daldır. Gerçek uçta
> daraltma çağıranın kimliğinden türetilir; istemciden gelen bir rol parametresi
> yetki yükseltme açığı olur ve **uygulanmaz**.

---

## 6. Bildirimler

Mock bildirim üretmiyor; aşağıdakiler UI'ın beklediği davranıştan türetilmiştir
ve §7'de karara bağlanmalıdır.

- Sütun yayınlandığında aileye/öğrenciye bildirim (`silent=true` ise ertelenir).
- `newGradeCount` sayacının beslenmesi (§7.1).

---

## 7. Kararlar (23 Ağustos 2026 · tamamı kapatıldı)

### 7.1 `newGradeCount` — ✅ kişi başına tek zaman damgası
Yeni tablo: `FamilyGradeSeen(PersonId, StudentPersonId, AcademicTermId, LastSeenAt)`.
Sayaç = `LastSeenAt`'ten SONRA yayınlanmış not sayısı. Ucuz (öğrenci×kişi×dönem),
anne/baba/öğrenci ayrı takip edilir.

İşaretleme **ayrı bir uçla**: `POST /grades/family:seen`. Okuma ucu (`GET /grades/family`)
yan etki üretmez — GET'in state değiştirmesi engellenmiş olur.

Kart kapsamı **yalnız seçili çocuk** (bugünkü davranış korunur); sayaç zaten
`/grades/family` yanıtından gelir ve o da seçili çocuğa aittir.

### 7.2 Nakil giden öğrencinin notu — ✅ not korunur, giriş kapalı
Izgara yüzünün bugünkü davranışı doğru kabul edildi. `buildEntries`'teki
koşulsuz `null`'lama **kaldırılır**; sütun yüzü de notu döndürür, hücre
salt-okunur olur. `enteredCount` nakil gideni saymaz (pay ve payda tutarlı kalır).

**Kapsanan statüler:** `TransferredOut`, `Withdrawn`, `Graduated`.
`Frozen` **hariç** — geçici hâl, öğrenci döndüğünde not girilebilmeli.

### 7.3 `classAverage` — ✅ politika yalnız aileyi bağlar
Ayarın kendi metni bunu söylüyor: *"Ailelere sınıf ortalaması göster — açıldığında
veli ve öğrenci, kendi notunun yanında sınıf ortalamasını görür."*

- `GET /grades/family` → politika kapalıysa `classAverage: null`.
- Öğretmen ızgarası → **her zaman** görür. Değer zaten istemcide hesaplanıyor
  (`columnAverage`), sunucudan gelmiyor; satırın kendi etiketi "aileye gitmez".
  `grade-grid-screen.tsx`'teki `policy.showClassAverage &&` koşulu kaldırıldı.
- **Gizli kademe önceliklidir:** `visibility == "hidden"` ise o kademenin ailesi
  notu da ortalamayı da görmez; `showClassAverage` orada hiç değerlendirilmez.

### 7.4 İzin kodları — ✅ iki yeni kod, yalnız SchoolAdmin
Üçü **zaten seed'li** (`PermissionSeedData.cs:42-44`): `grades.read` / `.write` /
`.publish` — Teacher'da üçü, Parent/Student'ta yalnız `read`.

Eklenecek: **`grades.manage`** ve **`grades.report`**. Attendance/Duties kalıbının
birebir kopyası: ikisi de `AllPermissionIds()` kataloğuna **girmez**, yalnız
`SchoolAdmin`'e açık satırla verilir — platform hesabı (SuperAdmin) okul içi not
kararı veremez.

Gerekçesi: `grades.write` öğretmende var; yönetici işlemleri onunla kapılanırsa
öğretmen kendi yayınını geri çekebilir. `grades.read` veli/öğrencide var;
`/tracking` onunla kapılanırsa okul geneli pano aileye açılır.

> **İzin ≠ kapsam.** `grades.write` "not girebilir mi", kapsam kapısı "hangi
> deftere" sorusunu yanıtlar. İkincisi `TeacherCourseLoadProjection` üzerinden handler'da
> zorunludur; görevlendirmesi olmayan öğretmen izni taşısa bile yazamaz.

### 7.5 `:publish-for` — ✅ ad doğru, eşleme düzeltildi
"Yeniden yayınla" değil, **"öğretmen adına yayınla"**. Bkz. §3 tablosundaki not.
Sözleşme değişmez.

### 7.6 `/grades/terms` — ✅ uç Grades'te YAZILMAZ
Bu uç not modülüne ait değil. `apps/web/lib/season-context.tsx` dönem listesini
buradan okuyor; yani uygulama genelindeki dönem seçicisinin kaynağı.
`GradeTermDto` de yeni bir varlık değil, `AcademicTerm`'ün sunum izdüşümü
(`label` ← `AcademicTermType.Name`, `seasonLabel` ← `AcademicSession.Name`,
`isEnabled` ← başladı mı, `isClosed` ← `closedAt != null`).

Dönem verisinin sahibi `academic-sessions` modülüdür; Grades onu **tüketir**:

```
GET /api/v1/academic-sessions/terms   → GradeTermDto ile aynı şekil
```

Frontend: `useGradeTerms` bu uca bağlanır, `contract.ts`ten `/grades/terms` düşer.

> **Tek açık parametre:** kaç sezon geriye? Varsayılan **aktif + bir önceki**
> (mock'un fiilen yaptığı). Seçici düz liste çizdiği için (gruplama/arama yok)
> daha geniş kapsam bileşenin yeniden tasarımını gerektirir.

### 7.7 Karne ekranının dönemi — ✅ ÇÖZÜLDÜ
`karne-tab.tsx` dönemini `useCurrentSession` + `resolvePlanningTerm` ile YEREL
çözüyordu; kullanıcı topbar'dan dönem değiştirdiğinde ekran değişmiyordu —
uygulamada iki ayrı dönem gerçeği vardı. `useSeasonContext()`e bağlandı.
Aynı gerekçeyle karne başlığındaki sabit seçenekli sahte "Dönem" filtresi
kaldırıldı (yalnız toast basıyordu).

### 7.8 Sözleşmede karşılığı olmayan üç eylem — ✅ üçü de uç kazanıyor
Izgara sütun menüsünde uç karşılığı olmayan işlemler vardı:

| Eylem | Eski hâli | Karar |
|---|---|---|
| Sütunu temizle | 30 ayrı `PUT entries/{no}` — atomik değil, denetim izi 30 satır | `DELETE /assessments/{id}/entries` · tek transaction, tek denetim kaydı, yalnız `draft` (aksi 409) |
| Sınav tarihi ayarla | yalnız toast — hiçbir yere yazmıyordu | `PUT /assessments/{id}/exam-date` |
| Excel'e aktar | yalnız toast | `GET /books/{id}/export` (senkron xlsx, Dilim 4) |

`examDate` sözleşmede okunabilir ve `isOverdue` hesabının girdisi; yazılamadığı
sürece geciken-sütun rozeti seed veriden gelmeye devam ederdi.

---

## 8. Dilimleme

| Dilim | İçerik | Çıktı |
|---|---|---|
| **0** ✅ | `IAbsenceDaysBatchReader` + öğrenci listesi devamsızlık 3 alanı · `GET /academic-sessions/terms` + `useGradeTerms` taşıması | Devamsızlık sütunu canlıda, dönem seçicisi gerçek uçta |
| **1** ✅ | Domain (4 entity) + EF konfig + migration + `grades.manage/.report` seed · `/books`, `/books/{id}`, `/books/{id}/grid`, `/assessments/{id}/entries` | Öğretmen defteri salt-okuma |
| **2** ✅ | `SetMark`, `AmendMark`, `ClearAssessmentMarks`, `SetAssessmentExamDate` + durum makinesi (`:publish`, `:publish-for`, `:unpublish`, `:lock`) + audit | Not girişi uçtan uca |
| **3** ✅ | `/family` + `:seen` + `FamilyGradeSeen` tablosu · `/students/{id}` · `/summary` · `/tracking` · öğrenci listesi ortalama alanları | Tüm okuma yüzleri + Ortalama sütunu |
| **4** ✅ | `grade-settings` · `/books/{id}/export` · bildirimler | Politika + dışa aktarma + bildirim |

**Dilim 0 — tamamlandı (23 Ağustos 2026).**

Backend (`oksis-api`):
- `Attendance/Abstractions/IAbsenceDaysBatchReader.cs` + `Attendance/Common/AbsenceDaysBatchReader.cs`
  — hesap gövdesi `GetRiskStudentsQueryHandler`'dan taşındı, o handler artık okuyucudan okuyor.
- `StudentListItemDto` +5 opsiyonel alan; `ListStudentsQueryHandler` sayfa başına TEK toplu çağrı.
- `AcademicSessions/DTOs/TermPickerItemDto.cs` + `Queries/ListTermsForPicker/`
  + `GET /api/v1/academic-sessions/terms`.

Frontend (`oksis-ui`): `contract.ts`'ten `/grades/terms` düştü, `getGradeTerms` ve MSW handler'ı
`/academic-sessions/terms`'e bakıyor.

Tasarımdan üç bilinçli sapma:
1. Uygulama `Attendance/Internal/` yerine **`Attendance/Common/`**'da — repoda `Internal` klasörü
   yok, sadece-okuyan yardımcılar `Common`'da yaşıyor (`AbsenceDayBreakdownResolver` komşusu).
2. `AbsenceSummary` satırı olmayan öğrenci **0 gün** döner, sözlükten düşmez — satırın yokluğu
   "veri yok" değil "hiç devamsızlık yapmamış" demek. `—` yalnız DÖNEM ÇÖZÜLEMEDİĞİNDE çıkar.
3. Risk listesine `ThenBy(StudentPersonId)` sıralama kırıcısı eklendi: sonuç artık sözlükten
   geldiği için eşit devamsızlıkta sıra tanımsız kalırdı; sayfalama deterministik yapıldı.

**Kalan:** `:5112`'deki API yeni derlemeyle yeniden başlatılıp `packages/api` içinde
`npm run codegen` çalıştırılınca `/academic-sessions/terms` gerçek şemadan gelir ve
`contract.ts`'teki geçici augmentation düşer.

**Dilim 1-4 — tamamlandı (23 Ağustos 2026).** Backend bir turda yazıldı; tek migration
(`20260823_grades_core`) beş tabloyu, `SchoolSettings`'in beş kolonunu ve iki izin kodunu
birlikte getirdi (tasarımın iki migration öngörüsü yerine — dilimler ardışık değil, aynı
turda tamamlandığı için ikinci migration'a gerek kalmadı).

**Açık kararlar bu turda kapatıldı:**

| Karar | Verilen | Gerekçe |
|---|---|---|
| Denetim granülerliği | Yayın anında TEK özet satır ("n not girdi") | Hücre başına kayıt denetim ekranını doldururdu; var olan satırı sayaç artırarak güncellemek append-only ilkesini delerdi. Üçüncü yol ikisini de bozmuyor ve fixture'ın cümlesiyle örtüşüyor |
| `ClearAssessmentMarks` silme | Soft-delete (`IsDeleted`) | Repo geneli hard-delete yasağı; denetim izi ayrı tabloda olduğu için satırı yok etmenin kazancı yok |
| `isOverdue` eşiği | **3 gün** sabit, `SchoolSettings`'e kolon YOK | Mock'ta okunacak eşik yoktu (statik fixture). Tek kanıt gerekçe metniydi: "sınav tarihi 3 gün önceydi" → `isOverdue: true` |
| Ortalama formülü | Ağırlıksız aritmetik; `G`/`M`/boş paydaya girmez | Fixture'lardan türetildi, üç satırın üçünü de veriyor. Mock ağırlıkları kullanmıyor; otorite mock |
| Ortalama yuvarlama | Her uçta **bir ondalık** | Mock iki uçta iki biçim veriyordu (82.3 vs 88); sunucu tek biçim üretir, biçimleme görünümün işi |
| Bildirim: `MarkAmended` / `Unpublished` | Üretilmez | Yalnız yayın bildirim üretir. Düzeltme aile yüzünde "güncellendi" rozetiyle zaten görünür; ikinci bir kanal gürültü olurdu |

**Entegrasyon testinin yakaladığı hata (derleme ve typecheck yakalamıyordu):**
`Mark` tablosunun CHECK kısıtı ilk hâlinde `([value] IS NULL) <> ([special] IS NULL)`
yazılmıştı. **T-SQL'de boolean tipi yoktur**; iki yüklem `<>` ile karşılaştırılamaz ve
bu bir SÖZDİZİMİ hatasıdır. Sonuç: `EnsureCreated` şemayı hiç kuramadı ve Grades'e
dokunmayan testler dahil **14 testin 14'ü** düştü. Kural düz OR ile yeniden yazıldı
(`[value] IS NULL OR [special] IS NULL`) — anlamı aynı: en az biri boş, yani ikisi
birden dolu olamaz. Ders: kısıt SQL'i yalnız derlemeyle doğrulanamaz, şema kurulmalı.

**Tasarımdan sapmalar:**

1. **Tel kimlikleri BİLEŞİK.** Defter ve sütun tembel oluştuğu için satırları yokken de
   adreslenebilmeleri gerekiyordu. Deterministik Guid (MD5) elendi — geri çevrilemez,
   yani kimlikten koordinata dönülemezdi. Kimlik `{termId}.{classRoomId}.{subjectId}`
   biçiminde kuruluyor; sözleşme zaten id'yi STRING tanımlıyor (`"gb-9a-mat-t1"`).
2. **Kapsam kaynağı `LessonPlacement`** (B1 kararı) — `ITeachingSlotReader` ile Timetable
   modülünden okunuyor. Vekâlet (`ScheduleException`) kapsama girmiyor.
3. **Öğrenci statüsü `StudentEnrollment.Status`** (B2) — `ClassRoomStudent`'ta böyle bir
   alan yok.
4. **Sütun kataloğu master veriden**: dönemin sütunları `ExamType` tablosundan gelir
   (`TermOrder` 0 veya dönem sırası). Fixture'ın beş sütunu tam olarak bu kümedir.

**Doğrulama (23 Ağustos 2026):**

| Küme | Sonuç |
|---|---|
| `oksis-api` tam çözüm derlemesi | 0 uyarı, 0 hata |
| Domain birim testleri (durum makinesi + `MarkValue`) | **39/39** |
| Application birim testleri (ortalama, gecikme, yüzde, bileşik anahtar) | **32/32** |
| Entegrasyon testleri (öğrenci listesi, dönem seçicisi, risk listesi) | **14/14** |
| `oksis-ui` typecheck (web + mobil + 4 paket) | **6/6** |
| `oksis-ui` lint | **6/6** |
| `oksis-ui` birim testleri | **675/675** |

**Her dilimin çıkış kriteri:** ilgili MSW handler'ı devre dışı bırakılıp ekran
gerçek uca bağlandığında **aynı** davranmalı. Dilim 4 bitince
`packages/api/src/grade/contract.ts` silinir ve şekil codegen'den gelir.

**Frontend'de bu turda kapanan borçlar** (backend beklemez):
- `karne-tab.tsx` → topbar dönem bağlamı (§7.7) ✅
- `grade-grid-screen.tsx` → öğretmen sınıf ortalaması satırının politika koşulu (§7.3) ✅

---

## 9. Kapanış (23 Ağustos 2026)

Beş dilim tamamlandı, migration uygulandı, **codegen koşuldu ve `contract.ts` silindi**.
Mock-first dönem kapandı: şekil artık yalnız `generated/schema.ts`ten geliyor.

### Drift bekçisinin yakaladıkları

Augmentation kaldırılınca typecheck **gerçek** uyuşmazlıkları gösterdi — bekçi tam da
bunun için konmuştu:

| # | Uyuşmazlık | Kim yanlıştı |
|---|---|---|
| 1 | `/grades/family` sunucuda `children[]` dönüyordu; sözleşme `child` (TEK) + `termId` + `columns` bekliyor | **Backend.** Aktif çocuk topbar bağlamından gelir; ikinci bir "aktif çocuk" gerçeği yaratılamaz. `FamilyGradesDto` düzeltildi |
| 2 | `int32` alanlar telde `number \| string` | Depo geneli (.NET OpenAPI kalıbı; 389 int32'nin 379'u). `academic-sessions` ile aynı çözüm: `Number(...)` daraltması |
| 3 | `isClosed`/`note`/`isLocked`/`tone`/`isPlanned` sunucuda zorunlu-nullable, domain tipinde opsiyonel | Eşleyici. `null` alan ATLANIR — "kapalı değil" ile "bilgi yok" ayrı hâller |
| 4 | Mock fixture'ları bu alanları hiç taşımıyordu | **Mock.** CLAUDE.md "mocks are typed too" kuralı işledi; fixture'lar şemaya hizalandı |
| 5 | `getGradeTracking` kısmi yanıtta çöküyordu | Eşleyici; KPI eksikse pano sıfırlanır, ekran beyaza düşmez |

### Kalan tek iş

**Uçtan uca tarayıcı doğrulaması** — her dilimin çıkış kriteri "MSW kapatılınca ekran
AYNI davranır". Kod tarafında engel kalmadı; ekranların gerçek veriyle sürülmesi gerekiyor.

**Tasarım kapsamı dışında bırakılan iki ekran eylemi** (idare panosu):
okul geneli Excel dışa aktarma ve toplu öğretmen hatırlatması. İkisinin de ucu
yok ve tasarımın 20 ucunda yer almıyorlar. Butonlar kaldırılmadı ama **yanıltıcı
mesajları düzeltildi** — eskiden "gönderildi"/"hazırlanıyor" diyorlardı ve bu
yalandı; hiçbir yere istek gitmiyordu.

