# WEB-18 — React Query hook: `useUpdateAcademicPolicy`

## Description
`PUT /school-settings/academic-policy` için mutation hook'u + ana `school-settings` detail query'sini invalidate eder.

## Scope
- `oksis-web/src/portals/admin/settings/api/school-settings.mutations.ts` — `useUpdateAcademicPolicy`

## Implementation

```ts
export function useUpdateAcademicPolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AcademicPolicyFormValues) =>
      api.put('/school-settings/academic-policy', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: schoolSettingsKeys.detail() });
      qc.invalidateQueries({ queryKey: schoolSettingsKeys.gradeLevelScales() });
    },
  });
}
```

> `gradeLevelScales` da invalidate edilir çünkü `defaultPassingScore` değişimi seviye-bazlı satırların `null passingScore` görünümünü etkiler.

## Acceptance Criteria
- [ ] Mutation hook mevcut, `useMutation` döner
- [ ] `onSuccess` 2 query'i invalidate eder
- [ ] `tsc --noEmit` yeşil
- [ ] Unit test yeşil

## Test Requirements
- `useUpdateAcademicPolicy_onSuccess_invalidatesDetailAndScales`
- `useUpdateAcademicPolicy_onError_keepsCache`

## Out of Scope
- Component (ISSUE-20)
- Skala-aralığı dinamik validasyon (component katmanı)
