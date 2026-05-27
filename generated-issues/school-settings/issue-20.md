# WEB-20 — Component: `AcademicPolicyTab`

## Description
Yeni 6. sekme — Akademik Politikalar. İki bölümlü form:
1. **Not Sistemi** — default skala + default geçme notu + `GradeLevelScalePanel` (ISSUE-19)
2. **İş Akışı Ayarları** — şube onayı + karne yayın politikası + veri saklama süresi

## Scope
- `oksis-web/src/portals/admin/settings/tabs/AcademicPolicyTab.tsx` (yeni)
- `oksis-web/src/portals/admin/settings/tabs/index.ts` — export
- `oksis-web/src/portals/admin/settings/tabs/__tests__/AcademicPolicyTab.test.tsx`

## Implementation

- `useSchoolSettings()` (mevcut) ile detail yükle — `academicPolicy` alt-objesi var (eğer backend response'da ayrı bir alt-section yoksa `useAcademicPolicy()` adı altında ayrı bir GET ekle; ama mevcut `GET /school-settings` flat response'una göre `defaultGradeScaleId`, `defaultPassingScore` vb. değerleri buradan çek — query adapter güncellemesi gerekiyorsa **bu issue içinde** `school-settings.queries.ts` `adaptSchoolSettings` fonksiyonuna `academicPolicy` alt-objesi ekle)
- `useForm<AcademicPolicyFormValues>({ resolver: zodResolver(academicPolicySchema), defaultValues: data.academicPolicy })`
- `useUpdateAcademicPolicy()` mutation (ISSUE-18)
- 3 bölüm:
  - Üst: Not sistemi form alanları + Kaydet butonu (sadece bu üst form için)
  - Orta: `<GradeLevelScalePanel />` — kendi save button'u var
  - Alt: İş akışı ayarları — aynı form'a dahil (üst form ile birlikte save)
- Devamsızlık alt-bölümü Sprint 2'de aktive edilecek → disabled placeholder + "Yakında" badge

### Form alanları (üst + alt — tek mutation ile gönderilir)

| Field | Component | Validation | i18n key |
|---|---|---|---|
| defaultGradeScaleId | DxSelectBox (master `grade_scales`) | nullable | `policy.grade-scale` |
| defaultPassingScore | DxNumberBox | skalaya göre dinamik min/max | `policy.passing-score` |
| requireApprovalForClassRoomCreation | DxCheckBox | — | `policy.approval-toggle` |
| autoPublishReportCards | DxRadioGroup (otomatik/taslak) | — | `policy.report-card-auto` / `policy.report-card-draft` |
| graduatedDataRetentionYears | DxNumberBox (suffix "yıl") | 1-30 | `policy.retention` |

## Acceptance Criteria
- [ ] `useSchoolSettings` query adapter `academicPolicy` alt-objesini döndürür
- [ ] Loading sırasında `SettingsSkeleton` (mevcut)
- [ ] Error durumunda `SettingsErrorCard` (mevcut) — retry button
- [ ] Form `academicPolicySchema` Zod resolver kullanır
- [ ] Skala değiştiğinde `defaultPassingScore` min/max güncellenir (BR-SS-012 frontend hint)
- [ ] Skala null ise info banner: `school-settings.policy.no-scale-info`
- [ ] Retention > 5 → uyarı banner: `school-settings.policy.retention-warning`
- [ ] Save → `useUpdateAcademicPolicy.mutate(formValues)`
- [ ] Success → `toast.success('school-settings.policy.save-success')`
- [ ] Error → `toast.error('common.errors.save-failed')`
- [ ] Save button `isPending` iken disabled
- [ ] `<GradeLevelScalePanel />` orta bölümde render edilir
- [ ] Devamsızlık bölümü disabled + "Yakında" badge
- [ ] Hardcoded Türkçe YASAK
- [ ] `any` YASAK
- [ ] Permission gate: `school-settings.update-academic-policy` yoksa form read-only

## UX Requirements
- 3 bölüm ayrı `<FormSection>` (Not Sistemi / İş Akışı / Devamsızlık-disabled)
- `<SaveButton isPending={mutation.isPending} />` üst form altında
- `GradeLevelScalePanel` kendi save'i ile çalışır (bağımsız endpoint)
- Devamsızlık bölümünde gri overlay + "Yakında" badge

## Test Requirements
- Render: skeleton → load sonrası 3 bölüm render edilir
- Submit retention 35 → validation error gösterilir
- Submit valid → mutation çağrılır
- Skala değişimi → geçme notu min/max güncellenir
- Mutation success → toast
- `GradeLevelScalePanel` mount olur (snapshot/integration)

## Out of Scope
- Devamsızlık alanları (Sprint 2)
- Sprint 2 enum frequency
- `SchoolSettingsTabs` nav (ISSUE-22)