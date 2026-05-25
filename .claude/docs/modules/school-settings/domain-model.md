# Okul Ayarları — Domain Model (Güncellenmiş)

> Mevcut domain model korunur, yeni entity'ler ve property'ler eklenir.

---

## Mevcut Aggregate Root — `SchoolSettings` (güncellendi)

**Yeni Properties (mevcut property'lere ek olarak):**

| İsim | Tip | Açıklama | Kısıt |
|---|---|---|---|
| `DefaultGradeScaleId` | `Guid?` (FK master `grade_scales`) | Okulun default not skalası | Nullable (henüz seçilmemiş) |
| `DefaultPassingScore` | `decimal` | Default geçme notu | Skala aralığında (BR-SS-012) |
| `GraduatedDataRetentionYears` | `int` | Mezun veri saklama süresi | 1-30, default 5 |
| `RequireApprovalForClassRoomCreation` | `bool` | Şube onay akışı | Default false |
| `AutoPublishReportCards` | `bool` | Karne otomatik yayın | Default true |

**Yeni Davranışlar:**

- `UpdateAcademicPolicy(defaultGradeScaleId, defaultPassingScore, retentionYears, requireApproval, autoPublish)` — Akademik Politikalar sekmesinden çağrılır. `SchoolSettingsUpdatedEvent(SchoolId, "AcademicPolicy")` raise eder.
- `UpdateAcademicStructure(...)` — Mevcut davranış, artık ayrı permission ile korunur.

**Yeni Domain Event:**

- `AcademicPolicyUpdatedEvent(SchoolId)` — `UpdateAcademicPolicy` çağrıldığında. Cache invalidation tetikler (grade scale resolver, approval flag).

---

## Yeni Entity'ler

### `SchoolGradeLevel` (tenant scope)

**Sorumluluk:** Okulun aktif çalıştırdığı sınıf kademeleri.

| İsim | Tip | Açıklama |
|---|---|---|
| `Id` | `Guid` | PK |
| `SchoolId` | `SchoolId` | Tenant |
| `GradeLevelId` | `Guid` (FK master `grade_levels`) | Sınıf seviyesi |
| `IsActive` | `bool` | Aktif mi |
| `DisplayOrder` | `int` | Sıralama |

**Invariants:**
- `(SchoolId, GradeLevelId)` unique
- En az 1 aktif kademe (BR-SS-010)

**Domain Event:** `SchoolGradeLevelsChangedEvent(SchoolId)` — grade level aktive/deaktive edildiğinde. `academic-sessions` modülü bu event'e abone olur (şube oluşturma dropdown'ını günceller).

---

### `SchoolGradeLevelScale` (tenant scope)

**Sorumluluk:** Sınıf seviyesi bazlı not skalası override. İlkokul 5'lik, lise 100'lük kullanabilir.

| İsim | Tip | Açıklama |
|---|---|---|
| `Id` | `Guid` | PK |
| `SchoolId` | `SchoolId` | Tenant |
| `GradeLevelId` | `Guid` (FK master `grade_levels`) | Sınıf seviyesi |
| `GradeScaleId` | `Guid` (FK master `grade_scales`) | Not skalası |
| `PassingScore` | `decimal?` | Seviye-özel geçme notu (null ise default kullanılır) |

**Invariants:**
- `(SchoolId, GradeLevelId)` unique — her seviyeye en fazla bir skala atanabilir
- `GradeLevelId` `school_grade_levels` tablosunda aktif olmalı
- `PassingScore` null değilse, `GradeScaleId`'nin min/max aralığında olmalı (BR-SS-012)

**Domain Event:** `SchoolGradeLevelScaleChangedEvent(SchoolId, GradeLevelId)` — skala değiştiğinde. `marks` modülü cache invalidation.

---

## Mevcut Entity'ler (değişmez)

- `BellSchedule` — Zil programı child entity
- `Holiday` — Tatil (`school_holidays`, artık opsiyonel `AcademicSessionId` taşır)
- `ModuleConfig` — Modül toggle
- `NotificationConfig` — Bildirim override

### `Holiday` — güncelleme

**Yeni property:**

| İsim | Tip | Açıklama |
|---|---|---|
| `AcademicSessionId` | `AcademicSessionId?` | Bağlı sezon (nullable geçiş dönemi) |

Mevcut property'ler değişmez. `Create(...)` davranışı `ICurrentSessionProvider` ile aktif sezonu otomatik atar.

---

## Servis Arayüzleri (bu modülün dışa sunduğu)

```csharp
/// Diğer modüller (marks, attendance, timetable) bu interface'i inject eder
public interface ISchoolSettingsReader
{
    Task<SchoolSettingsDto> GetAsync(SchoolId schoolId, CancellationToken ct);
    Task<IReadOnlyList<Guid>> GetActiveGradeLevelIdsAsync(SchoolId schoolId, CancellationToken ct);
}

/// Not girişinde skala belirlemek için (fallback chain — BR-SS-011)
public interface IGradeScaleResolver
{
    Task<GradeScaleInfo> ResolveAsync(SchoolId schoolId, Guid gradeLevelId, CancellationToken ct);
}

/// Tatil kontrolü (ders programı + nöbet atamasında kullanılır)
public interface IHolidayCalendarReader
{
    Task<bool> IsHolidayAsync(SchoolId schoolId, DateOnly date, CancellationToken ct);
}
```

---

## İlişkiler

```
SchoolSettings (aggregate root, 1:1 School)
  ├── (1:N) → BellSchedule
  ├── (1:N) → Holiday (artık opsiyonel AcademicSessionId taşır)
  ├── (1:N) → ModuleConfig
  ├── (1:N) → NotificationConfig
  └── (FK) → GradeScale (default_grade_scale_id)

SchoolGradeLevel (ayrı entity, tenant scope)
  ├── (N:1) → School
  └── (N:1) → GradeLevel (master)

SchoolGradeLevelScale (ayrı entity, tenant scope)
  ├── (N:1) → School
  ├── (N:1) → GradeLevel (master)
  └── (N:1) → GradeScale (master)
```