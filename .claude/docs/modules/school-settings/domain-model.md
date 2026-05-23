# Okul Ayarları — Domain Model

> Bu modülün domain katmanı: entity'ler, value object'ler, aggregate root'lar, invariants, domain event'ler.

---

## Aggregate Root'lar

### `SchoolSettings` (1:1 `School`)

**Sorumluluk:** Okulun tüm yapılandırma alanlarını gruplandırır. Sekme bazlı `Update*` davranışlarıyla parça parça mutate edilir.

**Properties:**

| İsim | Tip | Açıklama | Kısıt |
|---|---|---|---|
| `Id` | `Guid` | PK | Otomatik |
| `SchoolId` | `Guid` | Tenant FK | Immutable |
| `OfficialName`, `MebCode`, `TaxNumber`, `TaxOffice` | `string?` | Kurumsal | Opsiyonel |
| `ContactInfo` | `ContactInfo` (VO) | Owned VO (Phone/Fax/Email/Website) | |
| `Address` | `SchoolAddress` (VO) | Owned VO (Country/Province/District/Neighborhood FK + FullAddress + PostalCode) | |
| `Theme` | `SchoolTheme` (VO) | Owned VO (LogoUrl/PrimaryColor/SecondaryColor/FaviconUrl) | PrimaryColor zorunlu |
| `SchoolType` | `SchoolType?` enum | Anaokulu/İlkokul/Ortaokul/Lise | |
| `EducationLanguage` | `EducationLanguage?` enum | Eğitim dili | |
| `WeeklyLessonDays` | `int[]` | Haftanın ders günleri | 1-7 |
| `DailyLessonCount` | `int` | Günlük ders sayısı | Default 8 |
| `StudentNumberPrefix`, `StudentNumberLength` | string, int | Öğrenci no formatı | Default `null, 4` |
| `Timezone` | `string` | Windows tz id (örn. "Turkey Standard Time") | Default "Turkey Standard Time" |

**Davranışlar:**

- `CreateDefault(schoolId)` — Static factory; `SchoolSettingsCreatedEvent` raise eder.
- `UpdateBasicInfo(...)` — Resmi ad/MEB kodu/vergi alanları.
- `UpdateContactInfo(ContactInfo)`
- `UpdateAddress(SchoolAddress)`
- `UpdateTheme(SchoolTheme)`
- `UpdateAcademicStructure(...)`
- `RaiseBellScheduleChanged()` — Bell schedule batch update sonrası aggregate üzerinden event yayar.

**Domain Event'leri:**

- `SchoolSettingsCreatedEvent(SchoolId)` — Aggregate ilk oluşturulduğunda.
- `SchoolSettingsUpdatedEvent(SchoolId, SectionName)` — Her `Update*` çağrısında; SectionName ile hangi sekme güncellendi belirtilir.
- `BellScheduleChangedEvent(SchoolId)` — Bell schedule değişikliklerinde.

---

### `BellSchedule` (child entity)

Tenant scope, `school_id` taşır. Slot tipi (`Lesson`, `Break`, `Lunch`) + saat aralığı + display order.

---

### `Holiday` (tenant scope)

Frontend zod şeması (`HolidayFormValues`) ile birebir hizalı: `Title`, `HolidayDate`, `EndDate`, `HolidayType` (enum: `PublicHoliday`, `SchoolEvent`, `ClosedDay`), `IsRecurring`, `Description`.

**Davranışlar:**

- `Create(...)`, `Update(...)` — Validation domain entity içinde.

---

### `ModuleConfig` (tenant scope)

Tenant başına 6 satır. Properties: `ModuleName`, `IsEnabled`, `PlanRestricted`.

**Önemli kural:** `PlanRestricted = true` olan modüller okul yöneticisi tarafından açılamaz; satır yine seed edilir ama `IsEnabled = false` ve UI'da read-only badge ile gösterilir.

---

### `NotificationConfig` (tenant scope)

Tenant başına bildirim tipi override'ları. Global `notification_types` master kataloğuna referansla varsayılanları okul bazında ezer.

---

## Value Object'ler

- `ContactInfo` — `Phone`, `Fax`, `Email`, `Website`. `ContactInfo.Empty` factory.
- `SchoolAddress` — Lookup FK'leri (nullable) + `FullAddress`, `PostalCode`. `SchoolAddress.Empty`.
- `SchoolTheme` — `LogoUrl?`, `PrimaryColor` (zorunlu), `SecondaryColor?`, `FaviconUrl?`. `SchoolTheme.Default` (`#2563eb`, `#1d4ed8`).

---

## Invariants

- Her tenant için **tek bir** `SchoolSettings` satırı (DB unique index korur).
- `SchoolId` immutable (TenantSaveChangesInterceptor enforce eder).
- `PrimaryColor` boş olamaz.
- `DailyLessonCount` > 0.
- `WeeklyLessonDays` her elementi 1-7 aralığında.
- `ModuleConfig.PlanRestricted = true` ise tenant `IsEnabled` toggle edemez (Application validation).

---

## Domain Event Flow

```
SchoolCreatedEvent  ──► SchoolCreatedEventHandler
                          └─► SchoolSettings.CreateDefault()
                               └─► SchoolSettingsCreatedEvent

SchoolSettings.UpdateBasicInfo()
   └─► SchoolSettingsUpdatedEvent(SchoolId, "UpdateBasicInfo")
        └─► [Sprint 2+] AuditLogHandler kayıt tutar

SchoolSettings.RaiseBellScheduleChanged()
   └─► BellScheduleChangedEvent(SchoolId)
        └─► [Sprint 2+] Schedule modülü cache invalidate
```

> Notification akışları: `notifications.md` (bu klasörde).
