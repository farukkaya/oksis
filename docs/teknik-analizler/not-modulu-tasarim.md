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

### 2.4 `MarkAmendment` — denetim kaydı

Append-only. `GET /books/{id}/audit` bunu okur. Gerekçe **aileyle paylaşılmaz**,
okul kaydında durur (`CorrectGradeBody.reason` XML doc'u).

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
| 1 | `GET /grades/terms` | `ListGradeTerms` | read |
| 2 | `GET /grades/books?termId=` | `ListMyGradeBooks` | read |
| 3 | `GET /grades/books/{id}` | `GetGradeBook` | read |
| 4 | `GET /grades/books/{id}/grid` | `GetGradeBookGrid` | read |
| 5 | `GET /grades/assessments/{id}/entries` | `GetAssessmentEntries` | read |
| 6 | `PUT /grades/assessments/{id}/entries/{studentNo}` | `SetMark` | write |
| 7 | `POST …/entries/{studentNo}:correct` | `AmendMark` | write (pencere içi) |
| 8 | `GET /grades/books/{id}/audit` | `GetGradeBookAudit` | manage |
| 9 | `POST /grades/assessments/{id}:publish` | `PublishAssessment` | publish |
| 10 | `POST /grades/assessments/{id}:unpublish` | `UnpublishAssessment` | manage |
| 11 | `POST /grades/assessments/{id}:lock?unlock=` | `LockAssessment` / `UnlockAssessment` | manage |
| 12 | `POST /grades/assessments/{id}:publish-for` | `RepublishAssessment` | manage |
| 13 | `GET /grades/family?studentId=&termId=` | `GetFamilyGrades` | read (aile kapsamı) |
| 14 | `GET /grades/students/{id}?termId=` | `GetStudentTermGrades` | read |
| 15 | `GET /grades/summary?termId=` | `GetGradeEntrySummary` | report |
| 16 | `GET /grades/tracking?termId=` | `GetGradeTrackingBoard` | report |
| 17 | `GET/PUT /school-settings/grade-settings` | `GetGradeSettings` / `UpdateGradeSettings` | manage |

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
3. **Kapsam kapısı** — "bu öğretmen bu deftere yazabilir mi": `TeachingAssignment`
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

## 7. Karara bağlanacak maddeler

Mock bunları **çözmüyor**; kod yazmadan önce kapatılmalı.

### 7.1 `newGradeCount` — okundu bilgisi nerede tutulacak?
`FamilyGradesDto.newGradeCount` "bu ailenin henüz görmediği yayınlanmış not
sayısı". Mock sabit veriyor (ilk çocuğa 2, diğerlerine 0). Okundu-bilgisi
**hiçbir tabloda yok**. Seçenekler: (a) `FamilyGradeRead` tablosu
(personId × assessmentId × readAt), (b) aile başına tek `LastSeenAt` damgası,
(c) sayaç şimdilik 0 döner, kısayol devre dışı kalır.

### 7.2 Nakil öğrencinin notu — iki yüzey çelişiyor
Mock kendi içinde tutarsız:
- `buildEntries` (sütun yüzü): nakil öğrencinin değeri **her hâlde `null`**.
- `buildGrid` (ızgara yüzü): nakil öğrencinin notu **korunur** (dosya yorumu:
  "notlar görünür kalır, girişi kapalıdır").

Aynı veri iki uçta farklı görünüyor. Backend birini seçmeli — ızgaradaki
davranışın (notu göster, girişi kapat) doğru olduğunu düşünüyorum; sütun yüzü
ona hizalanmalı. Onay gerekiyor.

### 7.3 `classAverage` politika kapalıyken
`showClassAverage=false` iken sunucu `null` döner (sözleşme öyle diyor). Peki
**idare** kendi ekranında sınıf ortalamasını görebilecek mi? Politika aileyi mi
yoksa herkesi mi kapsıyor?

### 7.4 İzin kodları ve seed
`grades.*` kodları mock'ta yok. Permission matrisine eklenip
`PermissionSeedData` + `RolePermissionSeedData`'ya işlenmesi gerekiyor —
hangi rol hangi kodu alacak?

### 7.5 `:publish-for` gerçekte ne yapıyor?
Mock'ta `:unpublish` sonrası tekrar yayına almak için kullanılıyor
(`unpublished`'dan çıkar, `published`'a ekler) ve gerekçe ister. Ad "belirli bir
kitleye yayınla" izlenimi veriyor ama davranış "yeniden yayınla". Uç adı
korunacak mı, yoksa `:republish` mi olacak? (Ad değişirse frontend sözleşmesi
de güncellenir.)

### 7.6 `/grades/terms` kapsamı
Mock üç dönem döndürüyor ve biri **geçen sezondan** (`t0`, `isClosed: true`).
Yani uç aktif sezonla sınırlı değil. Kaç sezon geriye gidilecek?

---

## 8. Dilimleme

| Dilim | İçerik | Çıktı |
|---|---|---|
| **0** | Öğrenciler devamsızlık 3 alanı + `IAbsenceDaysBatchReader` | Devamsızlık sütunu canlıda |
| **1** | Domain + EF konfig + migration + `/terms`, `/books`, `/books/{id}`, `/books/{id}/grid` | Öğretmen defteri salt-okuma |
| **2** | `entries` yazma, `:correct`, durum makinesi (4 uç), audit | Not girişi uçtan uca |
| **3** | `/family`, `/students/{id}`, `/summary`, `/tracking` + öğrenci listesi ortalama alanları | Tüm okuma yüzleri + Ortalama sütunu |
| **4** | `grade-settings`, izin seed, bildirimler | Politika + yetki tamam |

Her dilimin çıkış kriteri: ilgili MSW handler'ı devre dışı bırakılıp ekran
gerçek uca bağlandığında **aynı** davranıyor olmalı. Dilim 4 bitince
`packages/api/src/grade/contract.ts` silinir ve şekil codegen'den gelir.
