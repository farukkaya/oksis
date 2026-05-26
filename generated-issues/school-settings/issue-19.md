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
