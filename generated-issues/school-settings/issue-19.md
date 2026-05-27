# WEB-19 — Component: `GradeLevelScalePanel`

## Description
`AcademicPolicyTab` içinde kullanılan alt component: aktif sınıf kademelerini tablo halinde listeler ve her satır için skala + geçme notu seçimini sağlar.

## Scope
- `oksis-web/src/portals/admin/settings/components/GradeLevelScalePanel.tsx` (yeni)
- `oksis-web/src/portals/admin/settings/components/index.ts` — export
- `oksis-web/src/portals/admin/settings/components/__tests__/GradeLevelScalePanel.test.tsx`

## Implementation
- `useGradeLevels()` + `useGradeLevelScales()` ile veri çek
- `useForm<GradeLevelScalesFormValues>({ resolver: zodResolver(gradeLevelScalesSchema), defaultValues })` — `defaultValues` mevcut scale satırları + henüz scale tanımlanmamış aktif kademeler için boş satır
- `useUpdateGradeLevelScales()` mutation
- DevExtreme `OksisDataGrid` ile satır listesi:

| Sütun | Tip | Düzenlenebilir |
|---|---|---|
| Sınıf Seviyesi | text (read-only) | ❌ |
| Not Skalası | DxSelectBox (master `grade_scales`) | ✅ |
| Geçme Notu | DxNumberBox (nullable) | ✅ |

- Skala değiştiğinde geçme notu input'unun `min/max` dinamik güncellenir (BR-SS-012 frontend hint)
- Boş aktif kademe yoksa info banner: `school-settings.policy.no-grades-info`
- "Seviye Bazlı Skalayı Kaydet" button → `mutation.mutate(formValues)`
- Loading skeleton, error state (retry), submit `isPending` disabled
- `master grade_scales` listesi mevcut bir endpoint'ten gelmiyorsa (boş varsay): bu issue master liste için yeni endpoint açmaz; mevcut bir lookup hook'u varsa onu kullan, yoksa hardcoded 3 skala (`TR_100`, `TR_5`, `HARFLI`) — backend ID'leri seed migration'dan bilinir; **ekibe sor** veya placeholder bırak

## Acceptance Criteria
- [ ] Component `useGradeLevels` ile aktif kademe listesini, `useGradeLevelScales` ile mevcut atamaları çeker
- [ ] Loading durumunda `SettingsSkeleton` (mevcut) render edilir
- [ ] Aktif kademe sayısı 0 ise info banner gösterilir (`no-grades-info` i18n key)
- [ ] Skala değiştiğinde geçme notu min/max dinamik güncellenir
- [ ] Geçme notu null bırakılabilir → "—" gösterilir, hint i18n key `level-scales.default-hint`
- [ ] Save `useUpdateGradeLevelScales.mutate()` çağırır
- [ ] Success toast (`toast.success`, key `school-settings.policy.save-success`)
- [ ] Error toast (`toast.error`, key `common.errors.save-failed`)
- [ ] Save button `mutation.isPending` iken disabled
- [ ] Hardcoded Türkçe string YASAK
- [ ] `any` YASAK
- [ ] Permission gate: `school-settings.update-academic-policy` yoksa form read-only (UI gate; backend hard gate ISSUE-14)

## UX Requirements
- `<FormSection>` shared component ile sarmalı
- DataGrid sticky header
- "—" placeholder geçme notu boş satırda
- Master skala listesi `useGradeScales()` hook'u ile veya mevcut lookup'tan

## Test Requirements
- Render: aktif kademe 0 → info banner gösterilir
- Render: aktif kademe var → DataGrid satırları render edilir
- Skala değişimi → geçme notu min/max güncellenir
- Submit valid → `useUpdateGradeLevelScales.mutate` doğru payload ile çağrılır
- Submit duplicate gradeLevelId (test data) → schema-level error gösterilir
- Mutation success → toast

## Out of Scope
- `AcademicPolicyTab` üst formu (ISSUE-20)
- Master `grade_scales` lookup endpoint (eğer yoksa, ayrı issue açılmalı — bu issue'da `TODO` ile placeholder)
- Sprint 2 attendance bölümü
