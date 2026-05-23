# Okul Ayarları — API Contracts

> Endpoint envanteri ve HTTP method/route/permission/status code haritası.

> Base route: `/api/v1/school-settings` · Authorization: class-level `[Authorize]` (anonim endpoint istisna ile).

---

## Endpoint Listesi (21)

20 yetkili endpoint + 1 anonim (`GetPublicBranding`). Backend kontrolcü: `Oksis.Api/Controllers/V1/SchoolSettingsController.cs`.

| # | Action | Method | Route | İzin | Success |
|---|---|---|---|---|---|
| 1 | `GetSettings` | GET | `/` | `school-settings.view` | 200 |
| 2 | `GetPublicBranding` | GET | `/public` | `[AllowAnonymous]` (X-Tenant-Code header) | 200 |
| 3 | `UpdateBasicInfo` | PUT | `/basic-info` | `school-settings.update-basic` | 204 |
| 4 | `UpdateContactInfo` | PUT | `/contact-info` | `school-settings.update-contact` | 204 |
| 5 | `UpdateAddress` | PUT | `/address` | `school-settings.update-address` | 204 |
| 6 | `UpdateAcademicStructure` | PUT | `/academic-structure` | `school-settings.update-basic` | 204 |
| 7 | `UpdateTheme` | PUT | `/theme` | `school-settings.update-theme` | 204 |
| 8 | `UploadLogo` | POST | `/logo` | `school-settings.upload-logo` | 201 |
| 9 | `DeleteLogo` | DELETE | `/logo` | `school-settings.upload-logo` | 204 |
| 10 | `GetBellSchedules` | GET | `/bell-schedules` | `school-settings.view` | 200 |
| 11 | `BulkCreateBellSchedules` | POST | `/bell-schedules/bulk` | `school-settings.manage-bell` | 204 |
| 12 | `CreateBellSchedule` | POST | `/bell-schedules` | `school-settings.manage-bell` | 201 |
| 13 | `UpdateBellSchedule` | PUT | `/bell-schedules/{id:guid}` | `school-settings.manage-bell` | 204 |
| 14 | `DeleteBellSchedule` | DELETE | `/bell-schedules/{id:guid}` | `school-settings.manage-bell` | 204 |
| 15 | `GetHolidays` | GET | `/holidays` | `school-settings.view` | 200 |
| 16 | `CreateHoliday` | POST | `/holidays` | `school-settings.manage-holidays` | 201 |
| 17 | `UpdateHoliday` | PUT | `/holidays/{id:guid}` | `school-settings.manage-holidays` | 204 |
| 18 | `DeleteHoliday` | DELETE | `/holidays/{id:guid}` | `school-settings.manage-holidays` | 204 |
| 19 | `GetModuleConfigs` | GET | `/module-configs` | `school-settings.view` | 200 |
| 20 | `UpdateModuleConfig` | **PATCH** | `/modules/{moduleKey}` | `school-settings.manage-modules` | 204 |
| 21 | `UpdateNotificationConfig` | PUT | `/notification-config` | `school-settings.manage-notifications` | 204 |

> **Önemli:** #20 `UpdateModuleConfig` HTTP method **PATCH**, route `modules/{moduleKey}` — frontend toggle sözleşmesi gereği. Yanlış route (`module-configs/{moduleName}`) kullanılmaz, regresyon testi koruma altında.

---

## Route'lama Notu

- `bell-schedules/bulk` segment'i `bell-schedules/{id:guid}` ÖNCE deklare edilir; aksi takdirde "bulk" string'i `{id:guid}` constraint'inden başarısız olunca da route çakışması yaratabilir. Regresyon testi: `BulkBellSchedules_MustBeDeclaredBefore_BellScheduleById`.
- `RequestSizeLimit(2 MB)` sadece `UploadLogo` üzerinde — controller seviyesinde değil action seviyesinde. Test: `UploadLogo_ShouldHave_RequestSizeLimit_2Mb`.

---

## Response Shape

Tüm endpoint'ler ortak `ApiResponse<T>` zarfı kullanır:

```json
{
  "data": { ... },          // başarılı response için
  "errors": [{ ... }],       // hata response için
  "correlationId": "uuid"
}
```

> Detay: `frontend/coding-standards.md` § 10 (axios interceptor unwrap eder).

---

## Backend Komutları / Query'leri

| Endpoint | Command/Query | Handler |
|---|---|---|
| GetSettings | `GetSchoolSettingsQuery` | `GetSchoolSettingsQueryHandler` |
| GetPublicBranding | `GetPublicSchoolBrandingQuery` | `GetPublicSchoolBrandingQueryHandler` |
| UpdateBasicInfo | `UpdateSchoolBasicInfoCommand` | `UpdateSchoolBasicInfoCommandHandler` |
| UpdateContactInfo | `UpdateSchoolContactInfoCommand` | ... |
| UpdateAddress | `UpdateSchoolAddressCommand` | ... |
| UpdateAcademicStructure | `UpdateAcademicStructureCommand` | ... |
| UpdateTheme | `UpdateSchoolThemeCommand` | ... |
| BulkCreateBellSchedules | `BulkCreateBellScheduleCommand` | ... |
| CreateBellSchedule | `CreateBellScheduleCommand` | ... |
| UpdateBellSchedule | `UpdateBellScheduleCommand` | ... |
| DeleteBellSchedule | `DeleteBellScheduleCommand` | ... |
| CreateHoliday | `CreateHolidayCommand` | ... |
| UpdateHoliday | `UpdateHolidayCommand` | ... |
| DeleteHoliday | `DeleteHolidayCommand` | ... |
| UpdateModuleConfig | `UpdateModuleConfigCommand` | ... |
| UpdateNotificationConfig | `UpdateNotificationConfigCommand` | ... |

---

## Test Coverage

Controller test dosyası: `tests/Oksis.Api.UnitTests/Controllers/V1/SchoolSettingsControllerTests.cs` (48 test).

Coverage:
- Class-level `[Authorize]` varlığı
- Class-level base route `api/v1/school-settings`
- 21 endpoint × {action adı, HTTP method, route template} doğrulaması
- 20 yetkili endpoint × `ProducesResponseType` primary status code'u
- `UploadLogo` `RequestSizeLimit(2 MB)`
- Bulk endpoint sırası (routing ambiguity'den korunma)
- Yetkili endpoint sayımı = 20 (`[AllowAnonymous]` dışlanır)
