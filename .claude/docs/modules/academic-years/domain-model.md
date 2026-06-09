# Akademik Sezon — Domain Model

> Bu modülün domain katmanı: entity'ler, value object'ler, aggregate root'lar, invariants, domain event'ler.

---

## Aggregate Root(lar)

### `AcademicSession`

**Sorumluluk:** Bir okulun eğitim yılı çatısı. Tüm akademik aktivitenin (şube, ders programı, yoklama, not, karne) zaman bağı.

**Properties:**

| İsim | Tip | Açıklama | Kısıt |
|---|---|---|---|
| `Id` | `AcademicSessionId` (`Guid`) | Primary key | Otomatik |
| `SchoolId` | `SchoolId` | Tenant | Zorunlu, immutable |
| `Name` | `string` | Görünen ad ("2025-2026") | 4-20 karakter |
| `StartDate` | `DateOnly` | Sezon başlangıcı (genelde 1 Eylül civarı) | < EndDate |
| `EndDate` | `DateOnly` | Sezon bitişi (genelde 30 Haziran civarı) | > StartDate |
| `IsCurrent` | `bool` | Aktif sezon işareti | Tenant başına en fazla 1 `true` |
| `Status` | `AcademicSessionStatus` enum | `Setup` / `Active` / `Archived` | Geçiş kuralı (aşağıda) |
| `ActivatedAt` | `DateTimeOffset?` | İlk aktive zamanı | Setup → Active geçişinde set |
| `ArchivedAt` | `DateTimeOffset?` | Arşive alındığı zaman | Archived geçişinde set |
| Audit | base class | Created/Updated/Deleted By/At, IsDeleted, RowVersion | |

**Invariants:**

- `IsCurrent = true` olan kayıt **tenant başına en fazla 1** (DB filtered unique index).
- Status geçişi tek yönlü: `Setup → Active → Archived`. Geri dönüş yok.
- `Name` tenant içinde unique (aynı okulda iki "2025-2026" olamaz).
- `StartDate < EndDate` (`Term1.End` ile `Term2.Start` arasında tatil aralığı olabilir).
- Status `Setup` iken `IsCurrent` daima `false`.
- Status `Archived` iken yazma operasyonu reddedilir (`AcademicSessionArchivedException`).
- Bir tenant aynı anda **birden fazla `Setup` sezonu açabilir** (yeni yıl hazırlanıyor, eski hala aktif). Ama aktif olan tek tane.

**Davranışlar:**

- `Create(schoolId, name, startDate, endDate)` — static factory; `Setup` statüsünde başlatır, iki `AcademicTerm` otomatik oluşturur (`T1`, `T2`).
- `Activate(now)` — eski aktif sezonu (varsa) `Archived`'a düşürür, bu sezonu `Active + IsCurrent=true` yapar; `AcademicSessionActivatedEvent` raise eder.
- `Archive(now)` — `Active` → `Archived` geçişi. Manuel arşiv (genelde yeni yıl aktive edildiğinde otomatik).
- `Rename(newName)` — sadece `Setup` durumunda izinli.
- `UpdateDates(start, end)` — sadece `Setup` durumunda izinli; `Term` tarihleriyle tutarlılık check edilir.

### `ClassRoom` (Şube)

**Sorumluluk:** Bir sezona ait şube ("9-A"). Öğrenci atamalarını barındırır.

**Properties:**

| İsim | Tip | Açıklama | Kısıt |
|---|---|---|---|
| `Id` | `ClassRoomId` (`Guid`) | Primary key | Otomatik |
| `SchoolId` | `SchoolId` | Tenant | Zorunlu, immutable |
| `AcademicSessionId` | `AcademicSessionId` | Bağlı sezon | Zorunlu, immutable |
| `GradeLevelId` | `Guid` (FK master `grade_levels`) | Sınıf seviyesi | Zorunlu |
| `Section` | `string` | Harf ("A", "B", ...) | 1-3 karakter, uppercase |
| `FullName` | `string` (computed/stored) | "9-A" formatı | GradeLevel.Code + "-" + Section |
| `HomeroomTeacherId` | `TeacherId?` | Rehber öğretmen | Nullable, set edildikten sonra `ClassRoomHomeroomChangedEvent` |
| `Capacity` | `int` | Maks. öğrenci sayısı | 1-100 |
| `Status` | `ClassRoomStatus` enum | `Draft` / `PendingApproval` / `Active` / `Archived` | (Geçiş kuralı aşağıda) |
| Audit | base class | | |

**Invariants:**

- `(SchoolId, AcademicSessionId, GradeLevelId, Section)` **unique** — aynı sezonda iki "9-A" olamaz.
- `AcademicSession.Status = Archived` ise yeni `ClassRoom` oluşturulamaz.
- `Status` geçişi: `Draft → PendingApproval → Active → Archived` *veya* `Draft → Active → Archived` (parametriğe bağlı, BR-AS-008).
- `PendingApproval` statüsü sadece `RequireApprovalForClassRoomCreation = true` ise üretilir.
- `Archived` ClassRoom'da öğrenci ataması/değişimi yapılamaz; mevcut atamalar `LeftAt = ArchivedAt` olarak kapatılır.

**Davranışlar:**

- `Create(schoolId, sessionId, gradeLevelId, section, capacity, requireApproval)` — eğer `requireApproval = true` → `PendingApproval`, değilse `Active`.
- `Approve(approverUserId, now)` — `PendingApproval` → `Active`; `ClassRoomApprovedEvent` raise eder.
- `AssignHomeroom(teacherId)` — rehber öğretmen atar/değiştirir.
- `Archive(now, reason)` — sezon sonu veya manuel; tüm aktif `ClassRoomStudent` kayıtlarını kapatır.
- `UpdateCapacity(newCapacity)` — `Active` durumunda mevcut öğrenci sayısının altına düşürülemez.

### `AcademicTerm` (Dönem, AcademicSession owned entity)

**Sorumluluk:** Sezon içindeki dönem (1. Dönem, 2. Dönem). Notlar ve devamsızlık sayaçları dönem bazlı.

**Properties:**

| İsim | Tip | Açıklama | Kısıt |
|---|---|---|---|
| `Id` | `AcademicTermId` (`Guid`) | Primary key | |
| `AcademicSessionId` | `AcademicSessionId` | Bağlı sezon | Zorunlu, immutable |
| `TermTypeId` | `Guid` (FK master `academic_term_types`) | T1 / T2 | Zorunlu |
| `StartDate` | `DateOnly` | Dönem başlangıcı | |
| `EndDate` | `DateOnly` | Dönem bitişi | |
| `Status` | `AcademicTermStatus` enum | `NotStarted` / `Active` / `Closed` | |
| `ClosedAt` | `DateTimeOffset?` | Kapatıldığı zaman | Closed geçişinde set |
| Audit | base class | | |

**Invariants:**

- `(AcademicSessionId, TermTypeId)` **unique** — bir sezonda T1 ve T2 birer kez.
- `StartDate < EndDate`.
- `T1.EndDate < T2.StartDate` (sezon içinde tarih sırası).
- `Status = Closed` geri alınamaz (BR-AS-005).
- `Active` durumdaki sezonda en fazla **bir** `AcademicTerm` aynı anda `Active` olabilir.

**Davranışlar:**

- `Activate(now)` — `NotStarted` → `Active`. Önceki dönemi otomatik kapatmaz; idare manuel kapatır.
- `Close(now)` — `Active` → `Closed`; `TermClosedEvent` raise eder.

---

## Owned Entity / Join Entity'ler

### `ClassRoomStudent` (history-aware atama)

**Sorumluluk:** Şube ↔ öğrenci atama kaydı. Tarihsel olarak korunur (üzerine yazılmaz).

**Properties:**

| İsim | Tip | Açıklama | Kısıt |
|---|---|---|---|
| `Id` | `Guid` | PK | |
| `ClassRoomId` | `ClassRoomId` | Şube | Zorunlu, immutable |
| `StudentId` | `StudentId` | Öğrenci | Zorunlu, immutable |
| `AssignedAt` | `DateTimeOffset` | Atama zamanı | |
| `LeftAt` | `DateTimeOffset?` | Ayrılış zamanı (null = aktif atama) | |
| `Reason` | `AssignmentReason` enum | `Initial` / `Transfer` / `NewEnrollment` / `Graduation` / `Archive` | |
| `Notes` | `string?` | Yöneticinin not düşmesi | Max 500 |

**Invariants:**

- Bir öğrenci aktif sezonda **en fazla bir** aktif kayda (`LeftAt IS NULL`) sahip olabilir. DB constraint: filtered unique index `(SchoolId, StudentId) WHERE LeftAt IS NULL AND IsDeleted = 0`.
- `Reason = Transfer` ise, aynı öğrencinin daha önce kapatılmış bir kaydı olmalı.
- `Reason = Graduation` ise, `ClassRoom.GradeLevel.Code = "12"` olmalı.

**Davranışlar:** Bu entity *direkt* mutate edilmez; `ClassRoom.AssignStudent(...)` ve `ClassRoom.TransferStudent(...)` ile yönetilir.

### `SchoolHoliday` (tatil)

**Sorumluluk:** Sezon-scope'lu tatil tanımı (manuel girilen). Master tablo `official_holidays`'tan farklı: dini bayramlar, okul-spesifik tatiller burada.

**Properties:**

| İsim | Tip | Açıklama | Kısıt |
|---|---|---|---|
| `Id` | `Guid` | PK | |
| `SchoolId` | `SchoolId` | Tenant | |
| `AcademicSessionId` | `AcademicSessionId` | Bağlı sezon | Zorunlu |
| `Name` | `string` | "Ramazan Bayramı 1. Gün" | Max 150 |
| `StartDate` | `DateOnly` | Başlangıç | |
| `EndDate` | `DateOnly` | Bitiş (tek günse `EndDate = StartDate`) | ≥ StartDate |
| `Type` | `HolidayType` enum | `PublicHoliday` / `SchoolEvent` / `ClosedDay` / `SemesterBreak` | |
| `IsRecurring` | `bool` | Her yıl tekrar mı? | |
| `Description` | `string?` | Açıklama | Max 500 |

**`HolidayType` Notu (2026-06-09):** `Schools.Enums.HolidayType` enum'una `SemesterBreak` değeri eklendi. `SemesterBreak`, yarıyıl tatilini temsil eder ve sihirbaz aracılığıyla `OpenSeasonFromDraft` çağrısında canlı `Holiday` entity'si olarak sezona yazılır (BR-AS-004'e bakın). EF Core `HasConversion<string>()` ile saklandığından migration gerekmez.

> **Dormant entity notu:** `SchoolHoliday` domain model dokümantasyonunda tanımlanmış olsa da kod tabanında fiilen kullanılmayan ikiz bir entity (`Holiday`) mevcuttur — `holiday` tablosu `SchoolHoliday` yerine `Holiday` entity'sine karşılık gelir. `SchoolHoliday` şu an ölü kod / dormant; `SemesterBreak` ve gelecekteki tatil kopyalama işlemleri canlı `Holiday` entity'si üzerinden yapılır.

**Invariants:**

- `StartDate` ve `EndDate` `AcademicSession.StartDate` ve `EndDate` aralığında olmalı.
- Tatil günlerine ders programı / nöbet atanamaz (BR-AS-006 — başka modülde validate edilir).

---

## Value Objects

### `AcademicSessionId`, `AcademicTermId`, `ClassRoomId`

Strongly-typed ID'ler (clean architecture pattern). `Guid` wrapper.

```csharp
public readonly record struct AcademicSessionId(Guid Value)
{
    public static AcademicSessionId New() => new(Guid.NewGuid());
    public static AcademicSessionId From(Guid value) => new(value);
}
```

---

## Domain Events

| Event | Tetiklenme Anı | Payload |
|---|---|---|
| `AcademicSessionCreatedEvent` | `AcademicSession.Create()` çağrıldığında | `SessionId`, `SchoolId`, `Name`, `StartDate`, `EndDate` |
| `AcademicSessionActivatedEvent` | `Setup → Active` geçişi | `SessionId`, `SchoolId`, `PreviousSessionId?` (varsa) |
| `AcademicSessionArchivedEvent` | `Active → Archived` geçişi | `SessionId`, `SchoolId`, `ArchivedAt` |
| `AcademicTermActivatedEvent` | Dönem `NotStarted → Active` | `TermId`, `SessionId`, `TermTypeId` |
| `AcademicTermClosedEvent` ⚠️ | Dönem `Active → Closed` | `TermId`, `SessionId`, `TermTypeId`, `ClosedAt` |
| `ClassRoomCreatedEvent` | Şube oluşturulduğunda | `ClassRoomId`, `SessionId`, `GradeLevelId`, `Section`, `Status` |
| `ClassRoomApprovedEvent` | `PendingApproval → Active` | `ClassRoomId`, `ApprovedBy` |
| `ClassRoomHomeroomChangedEvent` | Rehber öğretmen değişimi | `ClassRoomId`, `OldTeacherId?`, `NewTeacherId` |
| `ClassRoomArchivedEvent` | Şube arşive alındığında | `ClassRoomId`, `Reason` |
| `StudentAssignedToClassRoomEvent` | Öğrenci şubeye atandığında | `ClassRoomId`, `StudentId`, `Reason` |
| `StudentTransferredEvent` | Öğrenci şube değiştirdiğinde | `StudentId`, `FromClassRoomId`, `ToClassRoomId`, `Notes?` |
| `StudentGraduatedEvent` | 12. sınıf öğrencisi mezun edildiğinde | `StudentId`, `LastClassRoomId`, `GraduatedAt` |

⚠️ **`AcademicTermClosedEvent` özellikle kritik:** `report-cards` modülü buna abone olur ve otomatik karne üretim job'ını tetikler (BR-AS-010, manuel müdahale destekli).

> Event'lerin bildirim akışları için bkz. `notifications.md`.

---

## İlişkiler

```
AcademicSession (aggregate root)
  ├── (1:N owned) → AcademicTerm  (T1, T2 — sezon ile birlikte yaratılır)
  ├── (1:N) → ClassRoom            (referans, ayrı aggregate)
  └── (1:N) → SchoolHoliday        (referans)

ClassRoom (aggregate root)
  ├── (N:1) → AcademicSession      (ID ile referans)
  ├── (N:1) → GradeLevel (master)  (ID ile referans)
  ├── (N:1) → Teacher              (ID ile referans, HomeroomTeacherId)
  └── (1:N owned) → ClassRoomStudent

ClassRoomStudent
  └── (N:1) → Student (ID ile referans, ayrı aggregate)
```

**Aggregate sınırı kuralı:** Bir aggregate'in içinden başka aggregate root'a sadece **ID ile referans**. Navigation property sadece aynı aggregate içindeki entity'ler için (örn. `ClassRoom.Students` koleksiyonu OK, `ClassRoom.Session` navigation property YASAK — `AcademicSessionId` taşı yeterli).

---

## Yasaklar

- ❌ Public setter (constructor / static factory üzerinden).
- ❌ Domain'de EF Core attribute (Fluent API'de yapılır — `Infrastructure/Persistence/Configurations/`).
- ❌ DataAnnotations.
- ❌ Public collection ekleme/çıkarma (`AssignStudent`, `TransferStudent`, `Archive` method'ları üzerinden).
- ❌ `ClassRoom`'un başka tenant'a ait `AcademicSessionId` taşıması (cross-tenant integrity — interceptor + global query filter koruması).
- ❌ `AcademicSession.Status = Archived` iken herhangi bir command (Application layer'da 403 fırlatılır).
- ❌ `AcademicTermClosedEvent`'i `Status = Closed` olmadan raise etmek.

> Genel domain kuralları için bkz. `backend/domain-model-rules.md`.