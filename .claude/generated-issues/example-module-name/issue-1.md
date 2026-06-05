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
- Each field uses `<Controller>` (or shadcn `FormField`) wrapping the appropriate shadcn/ui input
- Save button shows loading state while `mutation.isPending`
- Form section wrapped in `<FormSection>` with title from `school-settings.sections.academic`

## Fields

| Field | Component | Options / Validation |
|---|---|---|
| schoolType | shadcn `Select` | Preschool, Primary, Secondary, HighSchool — labels via i18n |
| educationLanguage | shadcn `Select` | tr, en, other — labels via i18n |
| weeklyLessonCount | shadcn `Input type="number"` | min 1, max 50, int |

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