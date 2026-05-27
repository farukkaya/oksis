# WEB-17 — React Query hook: `useGradeLevelScales` + `useUpdateGradeLevelScales`

## Description
`GET /school-settings/grade-level-scales` ve `PUT /school-settings/grade-level-scales` için React Query hook'ları.

## Scope
- `oksis-web/src/portals/admin/settings/api/school-settings.keys.ts` — `gradeLevelScales()` key
- `oksis-web/src/portals/admin/settings/api/school-settings.queries.ts` — `useGradeLevelScales`
- `oksis-web/src/portals/admin/settings/api/school-settings.mutations.ts` — `useUpdateGradeLevelScales`

## Implementation

### Key

```ts
gradeLevelScales: () => [...schoolSettingsKeys.all, 'grade-level-scales'] as const,
```

### Query

```ts
export function useGradeLevelScales() {
  return useQuery({
    queryKey: schoolSettingsKeys.gradeLevelScales(),
    queryFn: () => fetchJson<SchoolGradeLevelScaleDto[]>('/school-settings/grade-level-scales'),
    staleTime: ONE_HOUR_MS,
  });
}
```

### Mutation

```ts
export function useUpdateGradeLevelScales() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: GradeLevelScalesFormValues) =>
      api.put('/school-settings/grade-level-scales', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: schoolSettingsKeys.gradeLevelScales() }),
  });
}
```

## Acceptance Criteria
- [ ] Hook'lar mevcut `schoolSettingsKeys` factory pattern'ine uyumlu
- [ ] Mutation `onSuccess` cache invalidation yapar
- [ ] `tsc --noEmit` yeşil
- [ ] `npm run test` yeşil

## Test Requirements
- `useGradeLevelScales_query_returnsData`
- `useUpdateGradeLevelScales_onSuccess_invalidatesKey`

## Out of Scope
- Component (ISSUE-19)