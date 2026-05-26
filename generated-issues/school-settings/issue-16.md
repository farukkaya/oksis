# WEB-16 — React Query hook: `useGradeLevels` + `useUpdateGradeLevels`

## Description
`GET /school-settings/grade-levels` ve `PUT /school-settings/grade-levels` için React Query query/mutation hook'ları.

## Scope
- `oksis-web/src/portals/admin/settings/api/school-settings.keys.ts` — yeni key factory'ler
- `oksis-web/src/portals/admin/settings/api/school-settings.queries.ts` — `useGradeLevels`
- `oksis-web/src/portals/admin/settings/api/school-settings.mutations.ts` — `useUpdateGradeLevels`

## Implementation

### Key factory (mevcut `schoolSettingsKeys`'e ekle)

```ts
export const schoolSettingsKeys = {
  // ... mevcut
  gradeLevels: () => [...schoolSettingsKeys.all, 'grade-levels'] as const,
};
```

### Query hook

```ts
export function useGradeLevels() {
  return useQuery({
    queryKey: schoolSettingsKeys.gradeLevels(),
    queryFn: () => fetchJson<SchoolGradeLevelDto[]>('/school-settings/grade-levels'),
    staleTime: ONE_HOUR_MS,
  });
}
```

### Mutation hook

```ts
export function useUpdateGradeLevels() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateGradeLevelsFormValues) =>
      api.put('/school-settings/grade-levels', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: schoolSettingsKeys.gradeLevels() });
      qc.invalidateQueries({ queryKey: schoolSettingsKeys.detail() });
    },
  });
}
```

## Acceptance Criteria
- [ ] `useGradeLevels` query hook tenant-scope'lu key kullanır (mevcut `schoolSettingsKeys` pattern'i)
- [ ] `useUpdateGradeLevels` mutation `onSuccess` ile cache invalidate eder (grade-levels + detail)
- [ ] Hook'lar default `staleTime` 1 saat (BR: nadiren değişen veri)
- [ ] `tsc --noEmit` yeşil
- [ ] `npm run test` yeşil

## Test Requirements
- `useGradeLevels_returnsData_andCachesByKey`
- `useUpdateGradeLevels_onSuccess_invalidatesGradeLevelsAndDetail`

## Out of Scope
- Component (ISSUE-21)
- Diğer hook'lar (ISSUE-17, 18)

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
