# Okul / Tenant Yönetimi — Domain Model

> Bu modülün domain katmanı: entity'ler, value object'ler, aggregate root'lar, invariants, domain event'ler.

---

## Aggregate Root'lar

### `School` (tenant root)

**Sorumluluk:** OKSİS multi-tenant mimarisinin tenant aggregate'ı. `School.Id == SchoolId` (diğer tüm tenant tablolarındaki FK).

**Properties:**

| İsim | Tip | Açıklama | Kısıt |
|---|---|---|---|
| `Id` | `Guid` | PK = SchoolId | Otomatik |
| `Name` | `string` | Görünen ad | 1-200 karakter |
| `Code` | `string` | Global tekil okul kodu | `^[A-Z0-9][A-Z0-9\-]{1,48}[A-Z0-9]$` |
| `Type` | `SchoolType` enum | Anaokulu/İlkokul/Ortaokul/Lise | |
| `Status` | `TenantStatus` enum | Setup/Active/Suspended/Archived | Yaşam döngüsü kuralı |
| `Plan` | `PlanCode` enum | Free/Standard/Premium | |
| `TimeZone` | `string` | IANA tz id | Default "Europe/Istanbul", `TimeZoneInfo.FindSystemTimeZoneById` validate |

**Invariants:**

- `Code` formatı regex ile zorunlu.
- `TimeZone` IANA tarafından tanınır olmalı.
- `Status` geçişi: Setup → Active ↔ Suspended → Archived (terminal). Archived dönüşsüz.

**Davranışlar:**

- `Create(name, code, type, plan?, timeZone?)` — Setup statüsünde başlatır, `SchoolCreatedEvent` raise eder.
- `Activate()`, `Suspend(reason)`, `Archive()`, `Rename(newName)`, `ChangePlan(newPlan)`, `UpdateTimeZone(iana)`.

**Domain Event'leri:**

- `SchoolCreatedEvent(SchoolId, Name)`
- `SchoolActivatedEvent(SchoolId)`
- `SchoolSuspendedEvent(SchoolId, Reason)`
- `SchoolArchivedEvent(SchoolId)`
- `SchoolPlanChangedEvent(SchoolId, OldPlan, NewPlan)`

---

### `OnboardingStatus` (TenantEntity, bu çalışmada eklendi)

**Sorumluluk:** Okul kurulum sihirbazının adım bazlı ilerleme durumu.

**Properties:**

| İsim | Tip | Açıklama | Kısıt |
|---|---|---|---|
| `Id` | `Guid` | PK | |
| `SchoolId` | `Guid` | Tenant FK | Immutable |
| `Step` | `OnboardingStep` enum | SchoolInfo/GradeSetup/TeacherImport/StudentImport/ScheduleSetup/Publish | |
| `Status` | `OnboardingStepStatus` enum | Pending/InProgress/Completed/Skipped | |
| `StartedAt`, `CompletedAt` | `DateTimeOffset?` | Adımın başlangıç/bitiş zamanı | |
| `Notes` | `string?` | Yöneticinin not düşmesi için | Max 500 |

**Invariants:**

- Bir tenant için her `(SchoolId, Step)` çifti **tek satır** (unique index korur).
- `Status = Completed` adımı yeniden başlatılamaz (`MarkInProgress` throw).
- `StartedAt` ilk transition'da set edilir, sonraki çağrılarda korunur.

**Davranışlar:**

- `Create(schoolId, step)` — Pending durumunda.
- `MarkInProgress(now)` — Completed adım için yasak.
- `MarkCompleted(now, notes?)`
- `Skip(notes?)`

---

## Enum'lar

### `TenantStatus`

```csharp
public enum TenantStatus { Setup, Active, Suspended, Archived }
```

### `SchoolType`

```csharp
public enum SchoolType { Preschool, PrimarySchool, MiddleSchool, HighSchool }
```

### `PlanCode`

```csharp
public enum PlanCode { Free = 0, Standard = 1, Premium = 2 }
```

### `OnboardingStep` (yeni)

```csharp
public enum OnboardingStep
{
    SchoolInfo = 0,
    GradeSetup = 1,
    TeacherImport = 2,
    StudentImport = 3,
    ScheduleSetup = 4,
    Publish = 5
}
```

### `OnboardingStepStatus` (yeni)

```csharp
public enum OnboardingStepStatus { Pending = 0, InProgress = 1, Completed = 2, Skipped = 3 }
```

---

## Layer 2 Tenant Init Akışı

`SchoolCreatedEvent` publish edildiğinde **iki MediatR notification handler** paralel çalışır:

```
School.Create(...)
   └─► SchoolCreatedEvent(SchoolId, Name)
        ├─► SchoolCreatedEventHandler
        │      └─► SchoolSettings.CreateDefault(SchoolId)
        │           └─► school_settings INSERT (BR-SS-001)
        │
        └─► SchoolCreatedOnboardingStatusHandler (bu çalışmada eklendi)
               └─► OnboardingStatus.Create(SchoolId, step) × 6
                    └─► school_onboarding_status × 6 INSERT
```

Mevcut migration `20260523140000_seed_default_module_configs` ek olarak her okul oluşumunda `school_module_configs` × 6 satır insert eder (cross-join migration ile).

**Idempotency:** Her handler önce `IgnoreQueryFilters().AnyAsync(s => s.SchoolId == schoolId)` ile var olan kayıtları kontrol eder, çift insert engellenir.

---

## Yasaklar

- ❌ Public setter (constructor / factory üzerinden).
- ❌ Domain'de EF Core attribute (Fluent API'de — `Infrastructure/Persistence/Configurations/Schools/`).
- ❌ `School` `TenantEntity`'den türetme — kendisi tenant.
- ❌ `Archived` okulun statüsünü geri çevirmek.
- ❌ `OnboardingStatus` satırını manuel insert (handler üretir).

> Genel domain kuralları için bkz. `backend/domain-model-rules.md`.
