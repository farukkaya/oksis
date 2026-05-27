# WEB-21 — Update: `AcademicStructureTab` (grade-level multi-select + `school_type` çoklu seçim)

## Description
Mevcut `AcademicStructureTab.tsx`'i genişlet:
1. Yeni "Aktif Sınıf Kademeleri" bölümü (master `grade_levels` checkbox group, eğitim seviyesine göre gruplu)
2. `school_type` artık çoklu seçim (multi-select dropdown veya checkbox group)
3. Okul tipi değişimi → "Sınıf kademelerini otomatik güncellemek ister misiniz?" confirm dialog
4. BR-SS-010 — son aktif kademe deaktive edilemez (disabled + tooltip)

## Scope
- `oksis-web/src/portals/admin/settings/tabs/AcademicStructureTab.tsx` — güncelleme
- `oksis-web/src/portals/admin/settings/tabs/__tests__/AcademicStructureTab.test.tsx` — yeni testler

## Implementation

### Yeni bölüm — Sınıf Kademeleri

- `useGradeLevels()` (ISSUE-16) ile mevcut atamayı çek
- Master `grade_levels` listesi (`useMasterGradeLevels()` — yoksa **bu issue'da `school-settings.queries.ts`'e ekle**, basit GET `/lookups/grade-levels`)
- Eğitim seviyesine göre gruplu checkbox render:

```
Anaokulu          [☐ Anaokulu]
İlkokul           [☑ 1.] [☑ 2.] [☑ 3.] [☑ 4.]
Ortaokul          [☑ 5.] [☑ 6.] [☑ 7.] [☑ 8.]
Lise              [☑ 9.] [☑ 10.] [☑ 11.] [☑ 12.]
```

- `useUpdateGradeLevels()` mutation, ayrı save button (üst akademik yapı form'undan bağımsız endpoint)
- Aktif kademe sayısı 1 ise → son checkbox `disabled` + tooltip `school-settings.grade-levels.min-one`

### `school_type` çoklu seçim

- Mevcut tek-seçim DxSelectBox → DxTagBox (multi) veya checkbox group
- Backend payload (`PUT /academic-structure`): array → string formatına dönüştür (open-question Q6, mevcut backend tek string bekliyor — kısa vadeli çözüm: ilk seçimi gönder + `display`'de hepsini göster, veya backend tarafına `string[]` alacak şekilde güncelleme **bu issue dışında**, çünkü ISSUE-1..14 backend tarafta `school_type` çoklu desteği eklemiyor)
- **Karar (open-question Q6 çözülene kadar):** UI'da multi-select görünsün ama backend'e ilk seçim gönderilsin; bir `TODO` comment ile open-question'a referans ver. Asıl kademe kapsamı zaten `school_grade_levels`'tan gelecek (BR-SS-014).

### School type değişimi confirm

```ts
const handleSchoolTypeChange = (newTypes: SchoolType[]) => {
  if (hasUserModifiedGradeLevels) {
    return showConfirm({
      title: t('school-settings.grade-levels.auto-update-confirm'),
      onConfirm: () => seedGradeLevelsFor(newTypes),
    });
  }
  // auto-seed silently
};
```

## Acceptance Criteria
- [ ] Yeni "Aktif Sınıf Kademeleri" bölümü render edilir, eğitim seviyesine göre gruplu
- [ ] `useGradeLevels` query loading sırasında skeleton
- [ ] Aktif kademe sayısı 1 ise son checkbox disabled + tooltip (BR-SS-010)
- [ ] Save → `useUpdateGradeLevels.mutate({ gradeLevelIds: [...] })`
- [ ] `school_type` multi-select component (TagBox veya checkbox group)
- [ ] Okul tipi değişiminde confirm dialog gösterilir
- [ ] `school_type` array → backend payload formatı (geçici: ilk element gönder + TODO comment ile open-question referansı)
- [ ] `[HasPermission]` UI gate: `school-settings.update-academic-structure` (eski `update-basic` referansı temizle)
- [ ] Hardcoded Türkçe YASAK
- [ ] `any` YASAK

## UX Requirements
- 2 ayrı save button: (1) Akademik yapı formu (mevcut endpoint), (2) Sınıf kademeleri (yeni endpoint)
- Disabled checkbox tooltip
- Confirm dialog mevcut shared `ConfirmDialog` component'i ile

## Test Requirements
- Render: grade levels checkbox group render edilir, gruplu
- Click last active checkbox → disabled + tooltip
- Click non-last → `useUpdateGradeLevels.mutate` çağrılır
- School type değiş → confirm dialog appear
- Confirm yes → grade levels seed mantığı tetiklenir (frontend mock)

## Out of Scope
- Backend `school_type` çoklu desteği (open-question Q6)
- `AcademicPolicyTab` (ISSUE-20)
- `SchoolSettingsTabs` nav (ISSUE-22)