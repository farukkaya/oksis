# Generated Issues — School Settings (genişletme)

> Kaynak dokümanlar: `.claude/docs/modules/school-settings/` (9 dosya).
> Bu issue seti **sıfırdan modül kurulumu değildir** — `oksis-api/src/Oksis.Application/Modules/Schools/` altındaki mevcut 21 endpoint ve `oksis-web/src/portals/admin/settings/` altındaki mevcut 6 tab korunur. Issues yalnızca **2026-05-25 ihtiyaç analizinde eklenen genişletme** kapsamını üretir (yeni 5 endpoint, 2 entity, 2 permission, `AcademicPolicyTab`, vb.).

Issue dosyaları `.claude/generated-issues/example-module-name/issue-1.md` şablonunu birebir takip eder (tek konu, küçük scope, “Commit Requirement (ZORUNLU)” bloğu sabit).

## Mevcut durum vs. doc kapsamı (boşluk analizi özeti)

| Katman | Mevcut | Eksik (bu issue setinde) |
|---|---|---|
| API Domain | `SchoolSettings` (3 parametric kolon dahil), `Holiday`, `BellSchedule`, `ModuleConfig`, `NotificationConfig`, master `GradeLevel`/`GradeScale` | `SchoolGradeLevel`, `SchoolGradeLevelScale`, `SchoolSettings.{DefaultGradeScaleId,DefaultPassingScore,UpdateAcademicPolicy}`, `Holiday.AcademicSessionId?` |
| API Infra | EF configs + 21 endpoint migration + 10 permission seed | 3 yeni migration (junction'lar + 2 kolon + holiday FK), 1 permission seed migration (2 yeni + #6 taşıma) |
| API Application | Mevcut 21 CQRS handler | 5 yeni CQRS (`GET/PUT /grade-levels`, `PUT /academic-policy`, `GET/PUT /grade-level-scales`), `IGradeScaleResolver` + `ISchoolSettingsReader.GetActiveGradeLevelIdsAsync`, `CreateHoliday` handler `ICurrentSessionProvider` entegrasyonu |
| API Controller | `SchoolSettingsController` 21 action | 5 yeni action + `#6 UpdateAcademicStructure` permission attribute taşıma |
| Web | 6 tab + tüm mevcut hook/schema | `AcademicPolicyTab`, `GradeLevelScalePanel`, 3 query/mutation hook, 2 zod schema, `AcademicStructureTab` (grade-level multi-select), `SchoolSettingsTabs` 10 sekme + URL param |
| Mobile | 8 read-only ekran | — (docs salt-okunur kararı) |

## Dağılım

| Katman | Issue sayısı |
|---|:-:|
| API | 14 |
| Web | 8 |
| Mobile | 0 |
| **Toplam** | **22** |

## Sıra (önerilen implementasyon sırası)

API issues (1-14) önce, çünkü web 5 yeni endpoint'i tüketir. Web issues (15-22) arası bağımlılık her issue'nun başında `Scope` bölümünde belirtilmiştir.

| # | Başlık | Bağımlı |
|---|---|---|
| 1 | API — Domain: `SchoolSettings` akademik politika genişletmesi | — |
| 2 | API — Domain: `Holiday.AcademicSessionId?` opsiyonel sezon bağlantısı | — |
| 3 | API — Domain: `SchoolGradeLevel` entity | — |
| 4 | API — Domain: `SchoolGradeLevelScale` entity | 1 (DefaultGradeScaleId) |
| 5 | API — Migration: `school_settings` 2 yeni kolon + `school_holidays.academic_session_id` | 1, 2 |
| 6 | API — Migration + EF config: `school_grade_levels` + `SchoolCreatedEvent` seed | 3 |
| 7 | API — Migration + EF config: `school_grade_level_scales` | 4, 6 |
| 8 | API — Migration: 2 yeni permission seed + `update-academic-structure` taşıma | — |
| 9 | API — CQRS: `GET/PUT /grade-levels` | 3, 6 |
| 10 | API — CQRS: `PUT /academic-policy` + cache invalidation | 1, 5 |
| 11 | API — CQRS: `GET/PUT /grade-level-scales` | 4, 7 |
| 12 | API — Service: `IGradeScaleResolver` + `ISchoolSettingsReader.GetActiveGradeLevelIdsAsync` (BR-SS-011 + Redis cache) | 10, 11 |
| 13 | API — `CreateHoliday` handler: `ICurrentSessionProvider` ile session-id otomasyonu | 2 |
| 14 | API — Controller: 5 yeni endpoint + `#6` permission attribute taşıma + integration testler | 8, 9, 10, 11 |
| 15 | Web — Types + Zod şemaları (grade-levels, grade-level-scales, academic-policy) | 14 |
| 16 | Web — React Query hook: `useGradeLevels` + `useUpdateGradeLevels` | 15 |
| 17 | Web — React Query hook: `useGradeLevelScales` + `useUpdateGradeLevelScales` | 15 |
| 18 | Web — React Query hook: `useUpdateAcademicPolicy` | 15 |
| 19 | Web — Component: `GradeLevelScalePanel` | 17 |
| 20 | Web — Component: `AcademicPolicyTab` | 18, 19 |
| 21 | Web — Update: `AcademicStructureTab` (grade-level multi-select + `school_type` çoklu seçim) | 16 |
| 22 | Web — `SchoolSettingsTabs` 10 sekme + URL param + i18n + e2e smoke test | 20, 21 |

## Cross-cutting hatırlatmalar

1. **Multi-tenant izolasyon** — `TenantContextBehavior`, EF global query filter ve `TenantSaveChangesInterceptor` bypass edilmez. Yeni 2 entity (`SchoolGradeLevel`, `SchoolGradeLevelScale`) `IHasTenant` implement etmelidir.
2. **Strongly-typed ID** kullanın (yeni entity'ler için `SchoolGradeLevelId`, `SchoolGradeLevelScaleId`).
3. **Domain event'ler** sadece aggregate metodu içinden raise edilir (handler'dan değil). Outbox interceptor aynı transaction içinde persist eder.
4. **Mapster** kullanın, AutoMapper YASAK.
5. **i18n** — hiçbir Türkçe string hardcoded olmasın; yeni anahtarlar `school-settings.*` namespace altında.
6. **Commit formatı** — `YYYY-MM-DD <type>[,type]: Türkçe özet.` Husky `commit-msg` hook zorunlu, `--no-verify` YASAK.
7. **BR-SS-010 / 011 / 012 / 013 / 015** — yeni 5 iş kuralı, her ilgili issue'da `Acceptance Criteria` içinde test edilir.
