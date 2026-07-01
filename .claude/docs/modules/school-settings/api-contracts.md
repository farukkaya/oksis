# Okul Ayarları — API Contracts (Güncellenmiş)

> Mevcut 21 endpoint korunur, 5 yeni endpoint eklenir. Toplam: **26 endpoint**.

> Base route: `/api/v1/school-settings`

---

## Mevcut Endpoints (1-21) — DEĞİŞMEZ

| # | Action | Method | Route | İzin |
|---|---|---|---|---|
| 1 | GetSettings | GET | `/` | `view` |
| 2 | GetPublicBranding | GET | `/public` | `[AllowAnonymous]` |
| 3 | UpdateBasicInfo | PUT | `/basic-info` | `update-basic` |
| 4 | UpdateContactInfo | PUT | `/contact-info` | `update-contact` |
| 5 | UpdateAddress | PUT | `/address` | `update-address` |
| 6 | UpdateAcademicStructure | PUT | `/academic-structure` | `update-academic-structure` ⚠️ DEĞİŞTİ (Q6: `schoolTypes` çoklu) |
| 7 | UpdateTheme | PUT | `/theme` | `update-theme` |
| 8 | UploadLogo | POST | `/logo` | `upload-logo` |
| 9 | DeleteLogo | DELETE | `/logo` | `upload-logo` |
| 10 | GetBellSchedules | GET | `/bell-schedules` | `view` |
| 11 | BulkCreateBellSchedules | POST | `/bell-schedules/bulk` | `manage-bell` |
| 12 | CreateBellSchedule | POST | `/bell-schedules` | `manage-bell` |
| 13 | UpdateBellSchedule | PUT | `/bell-schedules/{id}` | `manage-bell` |
| 14 | DeleteBellSchedule | DELETE | `/bell-schedules/{id}` | `manage-bell` |
| 15 | GetHolidays | GET | `/holidays` | `view` |
| 16 | CreateHoliday | POST | `/holidays` | `manage-holidays` |
| 17 | UpdateHoliday | PUT | `/holidays/{id}` | `manage-holidays` |
| 18 | DeleteHoliday | DELETE | `/holidays/{id}` | `manage-holidays` |
| 19 | GetModuleConfigs | GET | `/module-configs` | `view` |
| 20 | UpdateModuleConfig | PATCH | `/modules/{moduleKey}` | `manage-modules` |
| 21 | UpdateNotificationConfig | PUT | `/notification-config` | `manage-notifications` |

> ⚠️ **#6 Breaking change:** Permission `update-basic` → `update-academic-structure` (BR-SS-015). Migration'da SCHOOL_ADMIN rolüne yeni permission otomatik eklenir.
>
> ⚠️ **#6 Q6 (2026-05-28) — payload değişimi:** Tekil `schoolType: "HighSchool"` alanı **kaldırıldı**. Yeni alan: `schoolTypes: ["MiddleSchool", "HighSchool"]` (array, en az 1). Null gönderilirse mevcut değer korunur; boş array (`[]`) reddedilir. Backend `SchoolSettingsDetailDto.schoolTypes` olarak döner.
>
> ⚠️ **#6 (2026-07-01, BR-SS-017) — `studentNumberLength` artık `int?` (opsiyonel):** `studentNumberPrefix: string?` (önceden de vardı) + `studentNumberLength: int?` (önceden non-null, default 4) `UpdateAcademicStructure` body'sinde düzenlenebilir. `null` → generator default'u kullanır (öneksiz, min 3 hane, 100'den başlar — bkz. `students/business-rules.md` BR-students-005). Validator: `length` null veya 1-10. Detay: `.claude/specs/ogrenci-numarasi-format-design.md`.
>
> ⚠️ **#6 (2026-07-01, BR-SS-017 amendman) — `prefixConsentAcknowledged` yeni request alanı + 2 yeni hata kodu:**
> - **Request:** `prefixConsentAcknowledged: bool` (default `false`). Yalnız önek **yeni/farklı bir dolu değere** atanırken anlamlıdır; temizleme/length-only/değişmeyen prefix'te dikkate alınmaz.
> - **409 Conflict `schools.errors.prefix-in-use`:** kayıtlı önek dolu ve istek onu değiştiriyor/temizliyorsa, o öneki taşıyan en az bir öğrenci numarası varsa döner (kayıt yapılmaz). Yeni önek eklemek (boştan doluya) her zaman serbesttir.
> - **400 Bad Request `schools.errors.prefix-consent-required`:** yeni/farklı dolu önek + `prefixConsentAcknowledged != true` → döner. Sunucu-tarafı zorunlu (yalnız FE kontrolü değil).
> - Onay geçerliyse aynı transaction'da `school.student_number_prefix_consents` audit satırı yazılır (bkz. `database-schema.md` + `business-rules.md` BR-SS-017). Detay: `.claude/specs/ogrenci-numarasi-format-design.md` §11.

---

## Yeni Endpoints (22-26)

### 22. `GET /grade-levels` — Okul aktif sınıf kademeleri

**Permission:** `school-settings.view`

**Response 200:**
```json
{
  "data": [
    {
      "id": "...",
      "gradeLevelId": "...",
      "gradeLevelCode": "9",
      "gradeLevelName": "9. Sınıf",
      "educationLevel": "HighSchool",
      "isActive": true,
      "displayOrder": 10
    }
  ]
}
```

---

### 23. `PUT /grade-levels` — Okul aktif sınıf kademelerini güncelle

**Permission:** `school-settings.update-academic-structure`

**Request body:**
```json
{
  "gradeLevelIds": ["...", "...", "..."]
}
```

**Validation:**
- En az 1 kademe seçilmeli (BR-SS-010)
- ID'ler master `grade_levels` tablosunda mevcut olmalı

**Response 204**

**Domain Event:** `SchoolGradeLevelsChangedEvent`

---

### 24. `PUT /academic-policy` — Akademik politikaları güncelle

**Permission:** `school-settings.update-academic-policy`

**Request body:**
```json
{
  "defaultGradeScaleId": "...",
  "defaultPassingScore": 50,
  "graduatedDataRetentionYears": 5,
  "requireApprovalForClassRoomCreation": false,
  "autoPublishReportCards": true
}
```

**Validation (FluentValidation):**
- `defaultGradeScaleId` → master `grade_scales` tablosunda mevcut
- `defaultPassingScore` → skala aralığında (BR-SS-012)
- `graduatedDataRetentionYears` → 1-30
- Diğerleri bool, validation yok

**Response 204**

**Domain Event:** `AcademicPolicyUpdatedEvent`

**Side effects:** Cache invalidation (`oksis:tenant:{schoolId}:grade-scale-resolver`, `oksis:tenant:{schoolId}:academic-policy`)

---

### 25. `GET /grade-level-scales` — Seviye bazlı not skalası

**Permission:** `school-settings.view`

**Response 200:**
```json
{
  "data": [
    {
      "id": "...",
      "gradeLevelId": "...",
      "gradeLevelName": "1. Sınıf",
      "gradeScaleId": "...",
      "gradeScaleCode": "TR_5",
      "gradeScaleName": "5'lik Sistem",
      "passingScore": 3
    },
    {
      "id": "...",
      "gradeLevelId": "...",
      "gradeLevelName": "9. Sınıf",
      "gradeScaleId": "...",
      "gradeScaleCode": "TR_100",
      "gradeScaleName": "100'lük Sistem",
      "passingScore": 50
    }
  ]
}
```

---

### 26. `PUT /grade-level-scales` — Seviye bazlı not skalası güncelle

**Permission:** `school-settings.update-academic-policy`

**Request body:**
```json
{
  "scales": [
    {
      "gradeLevelId": "...",
      "gradeScaleId": "...",
      "passingScore": 3
    },
    {
      "gradeLevelId": "...",
      "gradeScaleId": "...",
      "passingScore": 50
    }
  ]
}
```

**Validation:**
- `gradeLevelId` → `school_grade_levels`'ta aktif olmalı
- `gradeScaleId` → master `grade_scales`'ta mevcut olmalı
- `passingScore` → skala aralığında (BR-SS-012), nullable (null ise default kullanılır)
- Aynı `gradeLevelId` iki kez gönderilemez

**Response 204**

**Domain Event:** `SchoolGradeLevelScaleChangedEvent`

**Davranış:** Bulk upsert — gönderilen seviyeler için kayıt oluştur/güncelle, gönderilmeyenler silinmez (explicit DELETE gerekiyorsa ayrı endpoint, Sprint 2+).