# Ders Programı — Domain Model

> Bu modülün domain katmanı: entity'ler, value object'ler, aggregate root'lar, invariants, domain event'ler.

> **REVİZE (2026-06-12, K0.2/K0.3):** Aşağıdaki **`ScheduleProgram` aggregate modeli** geçerli
> tasarımdır (Faz 1A'da uygulandı). Altındaki eski **`Schedule` satır-modeli (StartTime/EndTime
> aralığı)** *süperseded*'tir, yalnız tarihçe için tutulur — yeni kod onu kullanmaz.

---

## Aggregate Root — `ScheduleProgram` (geçerli model)

**Sorumluluk:** Bir **Sınıf (BranchId) + Dönem (AcademicTermId)** için programın tamamı.
`LessonPlacement` entity'lerinin sahibi (aggregate). Zaman, saat-aralığı değil **period** olarak modellenir.

| Alan | Tip | Not |
|---|---|---|
| `Id` | `Guid` (`ScheduleProgramId`) | strongly-typed id |
| `SchoolId` | `Guid` | tenant, immutable |
| `AcademicYearId` / `AcademicTermId` | `Guid` | immutable |
| `BranchId` | `Guid` | sınıf/şube, immutable |
| `Status` | `ScheduleProgramStatus` | `Draft`, `Revising`, `Published` (Faz 1 yalnız Draft) |
| `Version` | `int` | default 1 (Faz 2'de artar) |
| `RowVersion` | `byte[]` | optimistic concurrency |
| `Placements` | `IReadOnlyList<LessonPlacement>` | EF-mapped ham koleksiyon (aktif+pasif) |
| `ActivePlacements` | `IReadOnlyList<LessonPlacement>` | yalnız `IsActive` — domain mantığı bunu kullanır |

**Invariant'lar (aggregate içi, güçlü tutarlılık):**
- **INV-1 (Sınıf tekilliği):** Aynı program içinde aynı `TimeSlot`'a iki aktif yerleşim olamaz.
- **INV-2 (Blok bütünlüğü):** `SetBlock` → aynı gün ardışık ≥2 yerleşim; aksi halde reddedilir.
- **INV-3 (Haftalık saat — yumuşak):** Yerleşim sayısı müfredat saatine eşit olmalı; eksik/fazla
  uyarı üretir (Faz 1'de bloklamaz; müfredat kaynağı stub → no-op, Debt).

**Davranışlar:** `Create`, `Place(slot, subjectId, teacherId, roomId?)` → PlacementId, `Move`, `Remove`
(deaktivasyon), `AssignTeacher`, `AssignRoom`, `SetBlock`, `Publish(int version, …)`, `RevertToDraft()`,
`ApplyGeneratedDraft(...)`. Öğretmen/derslik çapraz çakışması aggregate sınırını aşar → application
(occupancy ön-kontrol + DB filtreli unique index son savunma).

**Çok-taslak / canlı-program davranışı (2026-06-16, K6/K9/K10/K11):**
- `Publish(int version, …)` — yayın sürümü artık dışarıdan verilir; uygulama bunu programın kendi
  `ScheduleVersion` geçmişinden (max+1) türetir → demote edilmiş bir program yeniden yayınlanırken sürüm
  çakışmaz. `Draft/Revising → Published`. (Eski "yeniden yayınlanamaz" kısıtı kalktı.)
- `RevertToDraft()` — canlı (Yayında *veya* Revize) bir programı **Taslağa indirir** (publish-swap'ta eski
  canlı kardeş için; silinmez). Yerleşimlerin `IsReserving` bayrağını temizler.
- `ApplyGeneratedDraft(...)` — autogen adayının yerleşimlerini **yeni bir Taslak** programa doldurur (apply
  mevcut programa dokunmaz; `Create` ile birlikte kullanılır).
- **İlk düzenlemede Revize (K11):** Düzenleme komutları (Move/Place/Remove/AssignTeacher/AssignRoom/SetBlock)
  bir `Published` programda çalışınca durumu `Revising`'e çevirir; canlı snapshot tüketiciye değişmeden kalır.
- **Rezervasyon (K8):** Program canlıya (Yayında/Revize) girip çıktıkça aggregate, yerleşimlerinin
  `IsReserving` bayrağını senkronlar (yalnız canlı program rezerve eder).

**Domain event'ler:** `ScheduleProgramCreatedEvent`, `LessonPlacedEvent`, `LessonRemovedEvent`.

### `LessonPlacement` (entity, aggregate içi)

| Alan | Tip | Not |
|---|---|---|
| `Id` | `Guid` (`LessonPlacementId`) | |
| `ProgramId`, `SchoolId`, `AcademicTermId`, `BranchId` | `Guid` | son ikisi index için denormalize |
| `Day` | `DayOfWeek` | |
| `Period` | `int` | zil çizelgesi ders sırası (1..N), `IBellScheduleProvider`'dan |
| `SubjectId`, `TeacherId` | `Guid` | |
| `RoomId` | `Guid?` | opsiyonel |
| `IsBlock`, `BlockGroupId` | `bool`, `Guid?` | blok ders işareti |
| `IsActive` | `bool` | Remove → false (filtreli unique index `WHERE is_active=1`) |
| `IsReserving` | `bool` | **(YENİ 2026-06-16, K8)** sahip program canlı (Yayında/Revize) ise true; üç çakışma unique index'i artık `... AND is_reserving=1` ile filtreler — yalnız canlı programlar kaynak rezerve eder, taslaklar serbestçe çakışır |

> Aggregate'ler arası referans yalnız Id ile (navigation yok — modül izolasyonu).
> Davranış metotları `internal` (yalnız `ScheduleProgram` çağırır).

### Value Object — `TimeSlot`
`(DayOfWeek Day, int Period)`, değere göre eşitlik, immutable. `Period` 1..20 (zil çizelgesinden türetilir).

### Value Object — `WeeklyHourRequirement`
`(Guid SubjectId, int RequiredHours)` — müfredattan; Faz 1'de stub provider besler (Debt).

### Application port'ları (çapraz çakışma + bağımlılık)
- `IOccupancyIndex` — dönem başına öğretmen/derslik doluluk haritası (Redis, O(1) ön-kontrol). Kaynak doğruluk DB.
- `IBellScheduleProvider` — şube kademesine göre period sayısı (school-settings).
- `ITeachingAssignmentSource` — şube görevlendirmeleri (Teachers) → "yerleşmemiş dersler".
- `IWeeklyHourRequirementProvider` — müfredat haftalık saati (Faz 1 stub).

### `ScheduleGenerationJob` (Faz 3 Dilim-1 — otomatik üretim job'u)

Otomatik üretim işinin durum + aday/ipucu kaydı.

| Alan | Tip | Not |
|---|---|---|
| `Id` | `Guid` | jobId |
| `SchoolId` | `Guid` | tenant, immutable |
| `BranchId`, `AcademicTermId`, `AcademicYearId` | `Guid` | **(RE-KEY 2026-06-16, K6)** job artık bir programa değil, bir **sınıfa + döneme + yıla** bağlı (`ProgramId` kaldırıldı) |
| `Scope` | enum | `Single` (tek sınıf). Kademe/Tümü = Dilim 2 |
| `Status` | enum | `Queued/Running/Done/NoSolution/Failed` |
| `CandidatesJson`, `HintsJson` | `string?` | 3 puanlı aday / gevşetme ipuçları |

> RE-KEY (K6): Önceki sürüm `ProgramId`'ye anahtarlıydı (autogen mevcut programa uygulanıyordu). Yeni model
> sıfırdan, sınıf-bazlı üretir; aday uygulandığında **yeni bir Taslak `ScheduleProgram`** yaratılır. Tablo:
> `database-schema.md`. Durum-geçiş metotları korumasız (tek-yazıcı job).

---

## (SÜPERSEDED — Faz 1A öncesi satır-modeli, yalnız tarihçe)

### `Schedule`

**Sorumluluk:** Bir şube + ders + öğretmen + (opsiyonel) derslik kombinasyonunu belirli bir akademik dönem ve hafta günü/saat dilimi için temsil eden, **versiyonlanabilir** atama. Yoklama ve diğer modüllerin "ne zaman/kim/nerede" referansı.

**Properties:**

| İsim | Tip | Açıklama | Kısıt |
|---|---|---|---|
| `Id` | `Guid` | Primary key | Otomatik |
| `SchoolId` | `Guid` | Tenant | Zorunlu, immutable |
| `AcademicYearId` | `Guid` | Akademik yıl | Zorunlu, immutable |
| `AcademicTermId` | `Guid` | Dönem | Zorunlu, immutable |
| `BranchId` | `Guid` | Şube | Zorunlu, immutable |
| `CourseId` | `Guid` | Ders | Zorunlu |
| `TeacherId` | `Guid` | Öğretmen | Zorunlu |
| `RoomId` | `Guid?` | Derslik (yeni; nullable transition için) | Opsiyonel — set edilirse çakışma kontrolüne girer |
| `ClassroomName` | `string?` | Eski derslik metni (legacy) | DEPRECATED — `RoomId` migration tamamlanınca kaldırılacak |
| `DayOfWeek` | `DayOfWeek` | Pazartesi…Cumartesi/Pazar | Zorunlu, enum |
| `StartTime` | `TimeOnly` | Ders başlangıç saati | Zorunlu, `< EndTime` |
| `EndTime` | `TimeOnly` | Ders bitiş saati | Zorunlu, `> StartTime` |
| `LessonOrder` | `int` | Günün kaçıncı dersi (zil saat sırası) | `>= 1` |
| `IsBlockLesson` | `bool` | Çift saat blok ders mi? | Default false; true ise ardışık 2 slot rezerve |
| `BlockGroupId` | `Guid?` | Blok dersin parçaları aynı id'yi paylaşır | `IsBlockLesson == true` ise zorunlu |
| `Status` | `ScheduleStatus` | `Draft`, `Published`, `Archived` | Default `Draft`; arşivlenen değiştirilemez |
| `Version` | `int` | Sezon içi değişiklikte artar | Default 1 |
| `EffectiveFrom` | `DateOnly` | Bu versiyonun geçerli olduğu ilk tarih | Zorunlu |
| `EffectiveTo` | `DateOnly?` | Bu versiyonun geçerlilik bitişi (null = açık uçlu) | `>= EffectiveFrom` |
| `PreviousVersionId` | `Guid?` | Üstüne yazdığı önceki Schedule | Versiyon zinciri için |
| `RowVersion` | `byte[]` | Optimistic concurrency token | EF Core rowversion |

**Invariants (her zaman geçerli iş kuralı):**

- `StartTime < EndTime` (yer değiştirilemez).
- `EffectiveTo` null veya `>= EffectiveFrom`.
- `Status == Archived` ise `EffectiveTo != null` zorunlu.
- `IsBlockLesson == true` ise `BlockGroupId != null` zorunlu, aynı block grubunda en az 2 Schedule olmalı (oluşturma anında atomik kontrol).
- Aynı `(SchoolId, AcademicTermId, TeacherId, DayOfWeek)` için zaman aralıkları çakışan **aktif** (`Status == Published`, `EffectiveFrom <= today <= EffectiveTo`) Schedule olamaz. → **BR-TT-001**
- Aynı `(SchoolId, AcademicTermId, BranchId, DayOfWeek)` için zaman aralıkları çakışan aktif Schedule olamaz. → **BR-TT-002**
- `RoomId != null` ise aynı `(SchoolId, AcademicTermId, RoomId, DayOfWeek)` için zaman aralıkları çakışan aktif Schedule olamaz. → **BR-TT-003**
- `EffectiveFrom` tatil günü değil. (Tatil günü kontrolü application layer'da — domain `IHolidayChecker` port'u üzerinden.) → **BR-TT-004**
- `StartTime`/`EndTime`, okulun zil saati dilimlerinden birine denk gelmeli. (Application layer kontrolü — `IBellScheduleProvider` port'u.) → **BR-TT-005**

**Davranışlar (method'lar):**

- `Create(...)` — Static factory; tüm invariant'ları kontrol eder, `ScheduleCreatedEvent` yayar.
- `ChangeTeacher(Guid newTeacherId, Guid? changedBy)` — Çakışma kontrolü sonrası öğretmen değiştirir. **Published statüsünde direkt değil, `Supersede(...)` üzerinden yeni versiyon olarak yapılır.**
- `ChangeRoom(Guid? newRoomId, Guid? changedBy)` — Aynı: published'da supersede.
- `MarkAsBlock(Guid blockGroupId)` — `IsBlockLesson = true`, grup id atar.
- `Publish(Guid publishedBy)` — `Draft → Published` geçişi, `SchedulePublishedEvent` yayar. Yeniden publish edilemez.
- `Archive(DateOnly archiveDate, Guid archivedBy)` — `Status = Archived`, `EffectiveTo = archiveDate`. `ScheduleArchivedEvent` yayar.
- `Supersede(Schedule newVersion)` — Mevcut Schedule'a `EffectiveTo = newVersion.EffectiveFrom - 1` set eder, `Status = Archived` yapar; yeni satır `PreviousVersionId = this.Id` ile yaratılır.

> Yoklama referansı olan Schedule **fiziksel silinemez** — `Archive(...)` üzerinden statü değişir (soft semantik). → **BR-TT-008/009**

---

### `Room`

**Sorumluluk:** Okulun fiziksel mekânı (normal sınıf, laboratuvar, spor salonu, müzik odası, atölye, vb.). Schedule'a opsiyonel olarak bağlanır, çakışma ve doluluk hesabı için kullanılır.

**Properties:**

| İsim | Tip | Açıklama | Kısıt |
|---|---|---|---|
| `Id` | `Guid` | Primary key | Otomatik |
| `SchoolId` | `Guid` | Tenant | Zorunlu, immutable |
| `Code` | `string` | Kısa kod (örn. `A-12`, `LAB-2`) | Zorunlu, max 20, `SchoolId` scope'unda unique |
| `Name` | `string` | Görünen ad (örn. `2. Kat Fen Lab.`) | Zorunlu, max 150 |
| `Type` | `RoomType` | `Classroom`, `Lab`, `Gym`, `Music`, `Art`, `Auditorium`, `Workshop`, `Other` | Zorunlu enum |
| `Capacity` | `int` | Maksimum öğrenci sayısı | `> 0`, max 200 |
| `Building` | `string?` | Bina/blok | Opsiyonel |
| `Floor` | `int?` | Kat (kat numarası) | Opsiyonel |
| `Features` | `RoomFeatures` | VO — bayrak koleksiyonu (SmartBoard, Projector, Sink, AirCondition, vb.) | Opsiyonel |
| `Status` | `RoomStatus` | `Active`, `Passive` | Default `Active` |

**Invariants:**

- `Code` `SchoolId` scope'unda unique (whitespace trim + case-insensitive).
- `Capacity > 0`.
- `Status == Passive` olduğunda yeni Schedule'a atanamaz (application layer guard).

**Davranışlar:**

- `Create(...)` — Static factory, `RoomCreatedEvent` yayar.
- `Rename(string newName)` — Sadece Name değişir.
- `UpdateCapacity(int newCapacity)`
- `ToggleFeature(RoomFeature feature)` — VO içinde flag toggle.
- `Activate()` / `Deactivate()` — Status değişimi.

---

### `ScheduleOverride`

**Sorumluluk:** Belirli bir takvim gününe ait Schedule satırının **o gün için** geçici değişikliği (iptal, yerine geçen öğretmen, derslik değişikliği, saat kayması). Orijinal Schedule değişmez; override geçerli olduğu gün için Schedule sorgusunda **uygulanır**.

**Properties:**

| İsim | Tip | Açıklama | Kısıt |
|---|---|---|---|
| `Id` | `Guid` | Primary key | Otomatik |
| `SchoolId` | `Guid` | Tenant | Zorunlu, immutable |
| `OriginalScheduleId` | `Guid` | Etkilediği Schedule | Zorunlu, FK |
| `OverrideDate` | `DateOnly` | Etkilediği takvim günü | Zorunlu |
| `OverrideType` | `ScheduleOverrideType` | `Cancellation`, `TeacherSubstitution`, `RoomChange`, `TimeChange`, `Combined` | Zorunlu enum |
| `NewTeacherId` | `Guid?` | `TeacherSubstitution`/`Combined` ise zorunlu | Çakışma kontrolüne girer |
| `NewRoomId` | `Guid?` | `RoomChange`/`Combined` ise zorunlu | Çakışma kontrolüne girer |
| `NewStartTime` | `TimeOnly?` | `TimeChange`/`Combined` ise zorunlu | Bell schedule slot kontrolü |
| `NewEndTime` | `TimeOnly?` | `TimeChange`/`Combined` ise zorunlu | `> NewStartTime` |
| `Reason` | `string?` | Açıklama (öğretmen hasta, vb.) | Max 500 |
| `Status` | `OverrideStatus` | `Active`, `Reverted` | Default `Active` |

**Invariants:**

- `OverrideDate >= today` (geçmişe override yapılamaz). → **BR-TT-011**
- `OverrideDate <= today + 30 days` (en fazla 30 gün ileriye). → **BR-TT-011**
- `OverrideType == Cancellation` ise `NewTeacherId/NewRoomId/NewStartTime/NewEndTime` hepsi null.
- `OverrideType == TeacherSubstitution` ise `NewTeacherId != null` ve diğerleri null.
- `OverrideType == RoomChange` ise `NewRoomId != null` ve diğerleri null.
- `OverrideType == TimeChange` ise `NewStartTime != null && NewEndTime != null` ve diğerleri null.
- `OverrideType == Combined` ise en az 2 yeni değer set edilmiş olmalı.
- Aynı `OriginalScheduleId + OverrideDate` için tek aktif override olabilir (yeni override oluşturulurken eskisi `Revert` edilir).
- `OverrideDate`, `OriginalSchedule.EffectiveFrom..EffectiveTo` aralığında olmalı.

**Davranışlar:**

- `Create(...)` — Static factory, çakışma kontrolü dahil; `ScheduleOverrideCreatedEvent` yayar.
- `Revert(Guid revertedBy)` — Status = Reverted, `ScheduleOverrideRevertedEvent` yayar.

---

## Value Objects

### `RoomFeatures`

Bayrak koleksiyonu: `SmartBoard`, `Projector`, `Sink`, `AirCondition`, `WheelchairAccessible`, `SoundSystem`, `Mirror` (dans/spor için), `Internet`. EF Core'da `nvarchar(max)` JSON serialize.

### `TimeSlot` (Schedule'ın okuma modeli için)

`(DayOfWeek, StartTime, EndTime)` üçlüsü; `Overlaps(TimeSlot other)` kontrolü için kullanılır. Sadece domain içi yardımcı, persist edilmez.

---

## Domain Events

| Event | Tetiklenme Anı | Payload |
|---|---|---|
| `ScheduleCreatedEvent` | Draft Schedule oluşturulduğunda | `SchoolId, ScheduleId, BranchId, CourseId, TeacherId, DayOfWeek, StartTime, EndTime, CreatedBy` |
| `SchedulePublishedEvent` | `Publish()` çağrıldığında | `SchoolId, ScheduleId, BranchId, AcademicTermId, EffectiveFrom, PublishedBy` |
| `ScheduleSupersededEvent` | `Supersede()` ile yeni versiyon oluşturulduğunda | `SchoolId, OldScheduleId, NewScheduleId, ChangedFields, EffectiveFrom, ChangedBy` |
| `ScheduleArchivedEvent` | `Archive()` çağrıldığında | `SchoolId, ScheduleId, ArchiveDate, ArchivedBy` |
| `ScheduleOverrideCreatedEvent` | Tek günlük override oluşturulduğunda | `SchoolId, OverrideId, OriginalScheduleId, OverrideDate, OverrideType, Reason` |
| `ScheduleOverrideRevertedEvent` | Override geri alındığında | `SchoolId, OverrideId, OriginalScheduleId, OverrideDate, RevertedBy` |
| `TeacherSubstitutionAssignedEvent` | Override → `TeacherSubstitution` veya `Combined`'da yeni teacher set edildiğinde | `SchoolId, OverrideId, OriginalTeacherId, SubstituteTeacherId, OverrideDate, Slot` |
| `RoomCreatedEvent` | Yeni Room oluşturulduğunda | `SchoolId, RoomId, Code, Type` |

> Event'lerin bildirim akışları için bkz. `notifications.md`.

---

## İlişkiler

```
Schedule (Aggregate Root)
  ├── (N:1) → AcademicYear
  ├── (N:1) → AcademicTerm
  ├── (N:1) → Branch
  ├── (N:1) → Course
  ├── (N:1) → Teacher
  ├── (N:1) → Room?            (opsiyonel — nullable FK)
  ├── (N:1) → Schedule? (PreviousVersion)  (kendi kendine — versiyon zinciri)
  └── (1:N) → ScheduleOverride

Room (Aggregate Root)
  └── (1:N) → Schedule (RoomId)

ScheduleOverride (Aggregate Root)
  ├── (N:1) → Schedule (OriginalSchedule)
  ├── (N:1) → Teacher? (NewTeacher)
  └── (N:1) → Room?    (NewRoom)
```

---

## Application-Layer Kontrol Portları (Domain'in tanımladığı, infrastructure'ın implement ettiği)

Domain bu port'ları çağırır ama implement etmez (DIP):

- `IHolidayChecker` — `Task<bool> IsHolidayAsync(Guid schoolId, DateOnly date, CancellationToken ct)` (school-settings + academic-years bilgisini birleştirir)
- `IBellScheduleProvider` — `Task<IReadOnlyList<BellSlot>> GetSlotsAsync(Guid schoolId, DayOfWeek day, CancellationToken ct)` (school-settings)
- `IScheduleConflictChecker` — Çakışma sorgularını DB'ye dağıtmadan domain seviyesinde çalıştırılabilen contract; uygulama Dapper ile hızlı sorgu yapar (tek read, çoklu kural).

---

## Yasaklar

- ❌ Public setter (constructor / factory üzerinden)
- ❌ Domain'de EF Core attribute (Fluent API'de yapılır — `Infrastructure/Persistence/Configurations/`)
- ❌ DataAnnotations
- ❌ Public collection ekleme/çıkarma (method üzerinden)
- ❌ `Schedule.Delete()` method'u — yoklama referansı varken silinemez; her zaman `Archive(...)`.
- ❌ `Status == Published` Schedule üzerinde doğrudan `ChangeTeacher/ChangeRoom` — yeni versiyon için `Supersede(...)` zorunlu.
- ❌ Override'ın orijinal Schedule'ı arşivlenmişse yeni override oluşturmak.

> Genel domain kuralları için bkz. `backend/domain-model-rules.md`.
