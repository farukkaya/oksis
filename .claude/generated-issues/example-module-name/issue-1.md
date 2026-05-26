## Description
Implement `AcademicStructureTab` which allows configuring school type, education language, and weekly lesson count. Uses its own `useSchoolSettings` call and `useUpdateAcademicStructure` mutation.

## Scope
- `src/portals/admin/settings/tabs/AcademicStructureTab.tsx`
- Uses `useSchoolSettings` from ISSUE-05
- Uses `useUpdateAcademicStructure` from ISSUE-07
- Uses `academicStructureSchema` from ISSUE-08

## Implementation
- `useForm<AcademicStructureFormValues>({ resolver: zodResolver(academicStructureSchema), defaultValues: data.academicStructure })`
- Submit calls `mutation.mutate(data)`
- Each field uses `<Controller>` wrapping the appropriate DevExtreme component
- Save button shows loading state while `mutation.isPending`
- Form section wrapped in `<FormSection>` with title from `school-settings.sections.academic`

## Fields

| Field | Component | Options / Validation |
|---|---|---|
| schoolType | DxSelectBox | Preschool, Primary, Secondary, HighSchool — labels via i18n |
| educationLanguage | DxSelectBox | tr, en, other — labels via i18n |
| weeklyLessonCount | DxNumberBox | min 1, max 50, int |

## Acceptance Criteria
- [ ] `SettingsSkeleton` shown while `useSchoolSettings` is pending
- [ ] Error state shown if query fails (retry button)
- [ ] Form initialised from `data.academicStructure`
- [ ] `schoolType` dropdown shows i18n-translated labels (not raw enum strings)
- [ ] `weeklyLessonCount` validates min 1, max 50 — shows error below field
- [ ] Save triggers `useUpdateAcademicStructure` mutation
- [ ] Success shows `toast.success` with key `school-settings.academic.save-success`
- [ ] Error shows `toast.error` with key `common.errors.save-failed`
- [ ] Save button disabled while `mutation.isPending`
- [ ] No hardcoded Turkish strings
- [ ] No `any`

## UX Requirements
- Section wrapped in `<FormSection>` shared component
- `<SaveButton isPending={mutation.isPending} />` at bottom of section
- Error messages below each field

## Test Requirements
- Render: skeleton shown while pending
- Render: after load, dropdowns populated with translated labels
- Submit with `weeklyLessonCount: 0` → validation error shown
- Submit valid form → `useUpdateAcademicStructure` mutation called with correct payload
- Mutation success → toast shown

## Out of Scope
- Other tabs
- BellScheduleTab (ISSUE-18+)

## Commit Requirement (ZORUNLU)

> ⚠️ Bu bölüm her generated issue'da **aynen** yer almak zorundadır. Issue tamamlandığında **ayrı bir commit** atılmadıkça issue "Done" sayılmaz.

- [ ] Issue tamamlandığında **yalnızca bu issue'a ait dosyalar** stage edilir (`git add <path>`); başka issue'ların değişiklikleri aynı commit'e karışmaz.
- [ ] Commit, **OKSİS commit kuralına** uygun formatta atılır: `YYYY-MM-DD <type>[,type]: Türkçe özet.` — kanonik kural `.claude/docs/git-commit-rules.md`.
- [ ] Issue-linked commit prefix'i kullanılır: `Issue #<no> YYYY-MM-DD <type>: ...` (issue numarası `gh issue list` veya dosya adından alınır, ör. `issue-7.md` → `Issue #7`).
- [ ] Commit **doğru repoda** atılır: API issue'ları → `oksis-api`, web issue'ları → `oksis-web`, mobile issue'ları → `oksis-mobile`. Workspace root (`oksis/`) repo'sunda **kod commit'i atılmaz**.
- [ ] Husky `commit-msg` hook (`oksis-api`) formatı zorlar; `--no-verify` **YASAK**. Hook fail olursa root cause'u düzelt, sonra yeniden commit at — `--amend` ile geçmiş commit'i değiştirme; yeni commit at.
- [ ] **Bir issue = bir commit**. Aynı issue içinde test + implementation aynı commit'e girer (type: `feat,test`). Birden fazla issue tek commit'e birleştirilmez; "modülü bitirince hepsini tek commit yapayım" yaklaşımı YASAK.
- [ ] Commit mesajının body'sinde (opsiyonel) Acceptance Criteria'dan tamamlanan kalemler madde madde özetlenebilir; uzun açıklamalar PR description'ına bırakılır.

**Örnek (tek issue commit'i):**

```
Issue #7 2026-05-24 feat,test: ChangePasswordCommand ve unit testleri eklendi.

- Mevcut parola BCrypt.Verify ile doğrulanır
- PasswordPolicy.Validate çağrısı yeni parola için zorunlu
- Başarılı değişimde tüm refresh token'lar revoke edilir
- 3 handler testi + 1 validator testi yeşil
```

**Kabul edilmeyen anti-pattern'ler:**

- ❌ 12 API issue'sunu tek "users modülü backend" commit'inde toplamak.
- ❌ Birden fazla repoya tek bir summary commit atmak.
- ❌ `update stuff` / `WIP` / Türkçe olmayan / tarihsiz / nokta'sız mesaj.
- ❌ `--no-verify` veya hook bypass.
