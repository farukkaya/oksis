# WEB-15 — Types + Zod şemaları (grade-levels, grade-level-scales, academic-policy)

## Description
Yeni 5 endpoint için TypeScript tip tanımları ve Zod şemaları. Mevcut `types/` ve `schemas/` klasörlerinin yapısı takip edilir.

## Scope
- `oksis-web/src/portals/admin/settings/types/school-settings.types.ts` — yeni tipler eklenir
- `oksis-web/src/portals/admin/settings/schemas/gradeLevels.schema.ts` (yeni)
- `oksis-web/src/portals/admin/settings/schemas/gradeLevelScales.schema.ts` (yeni)
- `oksis-web/src/portals/admin/settings/schemas/academicPolicy.schema.ts` (yeni)
- `oksis-web/src/portals/admin/settings/schemas/index.ts` — re-export

## Implementation

### Yeni types

```ts
export interface SchoolGradeLevelDto {
  id: string;
  gradeLevelId: string;
  gradeLevelCode: string;
  gradeLevelName: string;
  educationLevel: 'Preschool' | 'PrimarySchool' | 'MiddleSchool' | 'HighSchool';
  isActive: boolean;
  displayOrder: number;
}

export interface SchoolGradeLevelScaleDto {
  id: string;
  gradeLevelId: string;
  gradeLevelName: string;
  gradeScaleId: string;
  gradeScaleCode: string;
  gradeScaleName: string;
  passingScore: number | null;
}

export interface AcademicPolicyDto {
  defaultGradeScaleId: string | null;
  defaultPassingScore: number;
  graduatedDataRetentionYears: number;
  requireApprovalForClassRoomCreation: boolean;
  autoPublishReportCards: boolean;
}
```

### `gradeLevels.schema.ts`

```ts
import { z } from 'zod';

export const updateGradeLevelsSchema = z.object({
  gradeLevelIds: z.array(z.string().uuid()).min(1, 'school-settings.grade-levels.min-one'),
});

export type UpdateGradeLevelsFormValues = z.infer<typeof updateGradeLevelsSchema>;
```

### `academicPolicy.schema.ts`

```ts
import { z } from 'zod';

export const academicPolicySchema = z.object({
  defaultGradeScaleId: z.string().uuid().nullable(),
  defaultPassingScore: z.number().min(0),
  graduatedDataRetentionYears: z.number().int().min(1).max(30),
  requireApprovalForClassRoomCreation: z.boolean(),
  autoPublishReportCards: z.boolean(),
});

export type AcademicPolicyFormValues = z.infer<typeof academicPolicySchema>;
```

> `defaultPassingScore` üst sınırı dinamik (seçili skalaya göre) — schema'da değil, form layer'ında `superRefine` veya component-level validation ile.

### `gradeLevelScales.schema.ts`

```ts
import { z } from 'zod';

export const gradeLevelScalesSchema = z.object({
  scales: z.array(z.object({
    gradeLevelId: z.string().uuid(),
    gradeScaleId: z.string().uuid(),
    passingScore: z.number().nullable(),
  })).min(1),
});

export type GradeLevelScalesFormValues = z.infer<typeof gradeLevelScalesSchema>;
```

## Acceptance Criteria
- [ ] 3 yeni schema dosyası mevcut, hepsi Zod tabanlı
- [ ] Tüm tipler `school-settings.types.ts` veya schema dosyalarından export edilmiş
- [ ] `i18n` anahtarları validation message olarak kullanılır (raw Türkçe YASAK)
- [ ] `index.ts` re-export günceldir
- [ ] `tsc --noEmit` yeşil
- [ ] `npm run test` yeşil (yeni schema unit testleri)

## Test Requirements
- `updateGradeLevelsSchema_emptyArray_failsValidation`
- `academicPolicySchema_retention35_failsValidation`
- `academicPolicySchema_retention5_passes`
- `gradeLevelScalesSchema_duplicateGradeLevel_failsValidation` (eğer schema seviyesinde refine yapılırsa)

## Out of Scope
- Hooks (ISSUE-16, 17, 18)
- Component'ler (ISSUE-19, 20)

## Commit Requirement (ZORUNLU)

> ?? Bu b�l�m her generated issue'da **aynen** yer almak zorundadir. Issue tamamlandiginda **ayri bir commit** atilmadik�a issue "Done" sayilmaz.

- [ ] Issue tamamlandiginda **yalnizca bu issue'a ait dosyalar** stage edilir (`git add <path>`); baska issue'larin degisiklikleri ayni commit'e karismaz.
- [ ] Commit, **OKSIS commit kuralina** uygun formatta atilir: `YYYY-MM-DD <type>[,type]: T�rk�e �zet.` � kanonik kural `.claude/docs/git-commit-rules.md`.
- [ ] Issue-linked commit prefix'i kullanilir: `Issue #<no> YYYY-MM-DD <type>: ...` (issue numarasi `gh issue list` veya dosya adindan alinir, �r. `issue-7.md` ? `Issue #7`).
- [ ] Commit **dogru repoda** atilir: API issue'lari ? `oksis-api`, web issue'lari ? `oksis-web`, mobile issue'lari ? `oksis-mobile`. Workspace root (`oksis/`) repo'sunda **kod commit'i atilmaz**.
- [ ] Husky `commit-msg` hook (`oksis-api`) formati zorlar; `--no-verify` **YASAK**. Hook fail olursa root cause'u d�zelt, sonra yeniden commit at � `--amend` ile ge�mis commit'i degistirme; yeni commit at.
- [ ] **Bir issue = bir commit**. Ayni issue i�inde test + implementation ayni commit'e girer (type: `feat,test`). Birden fazla issue tek commit'e birlestirilmez; "mod�l� bitirince hepsini tek commit yapayim" yaklasimi YASAK.
- [ ] Commit mesajinin body'sinde (opsiyonel) Acceptance Criteria'dan tamamlanan kalemler madde madde �zetlenebilir; uzun a�iklamalar PR description'ina birakilir.

**�rnek (tek issue commit'i):**

```
Issue #7 2026-05-24 feat,test: ChangePasswordCommand ve unit testleri eklendi.

- Mevcut parola BCrypt.Verify ile dogrulanir
- PasswordPolicy.Validate �agrisi yeni parola i�in zorunlu
- Basarili degisimde t�m refresh token'lar revoke edilir
- 3 handler testi + 1 validator testi yesil
```

**Kabul edilmeyen anti-pattern'ler:**

- ? 12 API issue'sunu tek "users mod�l� backend" commit'inde toplamak.
- ? Birden fazla repoya tek bir summary commit atmak.
- ? `update stuff` / `WIP` / T�rk�e olmayan / tarihsiz / nokta'siz mesaj.
- ? `--no-verify` veya hook bypass.
