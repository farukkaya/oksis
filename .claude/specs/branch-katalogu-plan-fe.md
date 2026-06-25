# Branş Kataloğu — Frontend Uygulama Planı (plan-fe)

> **For agentic workers:** REQUIRED SUB-SKILL: `superpowers:subagent-driven-development` (önerilen) veya
> `superpowers:executing-plans`. Adımlar `- [ ]` checkbox. Spec: `.claude/specs/branch-katalogu-spec.md`.
> **Bağımlılık:** BE planı (`branch-katalogu-plan-be.md`) **merge edilmiş olmalı** (`/api/v1/branches` canlı).

**Goal:** Akademik Yapı'ya okula özel "Branş Kataloğu" kartı (MEB getir + CRUD + kilit) eklemek; öğretmen
branş seçicisini gerçek `/api/v1/branches` lookup'ına bağlamak; `/admin/subjects` ekranını + mock'unu silmek.

**Architecture:** `settings/api/branches/` (rooms modülü deseni: tenant-scoped React Query key + httpClient +
ApiEnvelope). `StructureTab`'e `BranchCatalogCard` (CourseCatalogCard deseni, raw `stu-tbl yap-tbl` tablo).
`BranchDrawer` (DerslikDrawer deseni, plain useState + touched validation). `/admin/subjects` silinmeden önce
`StructureTab`'in subjects-hook bağımlılığı settings altına taşınır.

**Tech Stack:** React 18 + Vite + TS, TanStack Query v5, Zustand (`useAuthStore`), shadcn/ui + Tailwind,
axios (`httpClient`), i18next, Vitest + Testing Library + MSW.

## Global Constraints

- **Tenant-scoped React Query key'leri** (rooms deseni: her key `schoolId` prefix'i). Server state yalnız
  React Query'de — Zustand'a kopyalanmaz.
- Ayrı grid kütüphanesi YOK — mevcut `stu-tbl`/`yap-tbl` raw tablo deseni (RoomsTab/StructureTab).
- Hardcoded Türkçe YOK — i18n key (`school-settings` namespace, `tr`+`en`).
- `any` yok; sayfa/komponentte default export yok; inline style yok.
- Permission gate yalnız UX (sunucu zaten kontrol ediyor).
- Her task sonu: `npm run build` + ilgili `npm run test` yeşil.
- Commit: OKSİS formatı.

## Dosya Yapısı

```
src/portals/admin/settings/api/branches/        (yeni — rooms/ deseni)
  branches.types.ts   (BranchDto, MebBranchDto, BranchUpsert)
  branches.keys.ts    (tenant-scoped)
  branches.queries.ts (useSchoolBranches, useMebBranches)
  branches.mutations.ts (useCreateBranch, useUpdateBranch, useSetBranchStatus, useDeleteBranch, useImportMeb)
  __tests__/branches.queries.test.ts
src/portals/admin/settings/components/BranchDrawer.tsx   (yeni — DerslikDrawer deseni) + __tests__
src/portals/admin/settings/tabs/StructureTab.tsx         (değişir — BranchCatalogCard ekle)
src/portals/admin/settings/api/subjects/                 (yeni — StructureTab subject hook'larının yeni evi)
src/portals/admin/teachers/components/HireTeacherDialog.tsx  (değişir — BRANCH_OPTIONS → lookup)
src/portals/admin/teachers/hooks/useBranchOptions.ts     (yeni — settings branches'ı tüketir)
src/shared/i18n/locales/{tr,en}/school-settings.json     (değişir — branches key'leri)
src/app/routes.tsx                                       (değişir — /admin/subjects route SİL)
src/app/layouts/AdminLayout.tsx                          (değişir — sidebar item SİL)
src/portals/admin/subjects/                              (SİL — relocate sonrası)
```

> **Önce keşif (1 dk):** `StructureTab.tsx`'in `../../subjects/hooks/...`'tan TAM olarak hangi import'ları
> aldığını ve `portals/admin/subjects`'e başka dışarıdan import olup olmadığını grep'le doğrula
> (`grep -rn "portals/admin/subjects\|from \"../../subjects" src/`). Task 6 buna göre netleşir.

---

### Task 1: `branches` api modülü (keys + types + queries + mutations)

**Files:**
- Create: `src/portals/admin/settings/api/branches/{branches.types.ts, branches.keys.ts, branches.queries.ts, branches.mutations.ts}`
- Test: `.../api/branches/__tests__/branches.queries.test.ts`

**Interfaces:**
- Produces: `useSchoolBranches(includeInactive?)`, `useMebBranches()`, `useCreateBranch()`,
  `useUpdateBranch()`, `useSetBranchStatus()`, `useDeleteBranch()`, `useImportMeb()`;
  `BranchDto = { id, name, mebCode, mebBranchId, isMebSourced, isActive, displayOrder }`.

- [ ] **Step 1: Failing test (tenant-scoped key + GET)**
```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '<test>/mswServer';
import { createTestWrapper } from '<test>/utils';
import { useSchoolBranches } from '../branches.queries';
import { branchKeys } from '../branches.keys';

describe('useSchoolBranches', () => {
  it('tenant-scoped key kullanır', () => {
    expect(branchKeys.list('school-1', true)).toEqual(['branches', 'school-1', 'list', { includeInactive: true }]);
  });
  it('GET /branches listesini döner', async () => {
    server.use(http.get('*/api/v1/branches', () =>
      HttpResponse.json({ data: [{ id: '1', name: 'Matematik', mebCode: '1245', mebBranchId: 'm1', isMebSourced: true, isActive: true, displayOrder: 10 }], success: true })));
    const { result } = renderHook(() => useSchoolBranches(), { wrapper: createTestWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
  });
});
```
- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement** (rooms.* deseni birebir)
```typescript
// branches.keys.ts
export const branchKeys = {
  all: (schoolId: string) => ['branches', schoolId] as const,
  list: (schoolId: string, includeInactive: boolean) =>
    ['branches', schoolId, 'list', { includeInactive }] as const,
  meb: () => ['branches', 'meb'] as const,
};
// branches.queries.ts
export function useSchoolBranches(includeInactive = true) {
  const schoolId = useAuthStore((s) => s.user?.schoolId ?? '');
  return useQuery({
    queryKey: branchKeys.list(schoolId, includeInactive),
    queryFn: async ({ signal }) => {
      const res = await httpClient.get<ApiEnvelope<BranchDto[]>>(`/branches?includeInactive=${includeInactive}`, { signal });
      return res.data.data;
    },
    enabled: !!schoolId,
  });
}
export function useMebBranches() { /* GET /branches/meb → MebBranchDto[] */ }
// branches.mutations.ts — useCreateBranch (POST /branches), useUpdateBranch (PUT /branches/:id),
// useSetBranchStatus (PUT /branches/:id/status), useDeleteBranch (DELETE), useImportMeb (POST /branches/import-meb)
// hepsi onSuccess → qc.invalidateQueries({ queryKey: branchKeys.all(schoolId) })
```
- [ ] **Step 4: Run → PASS** + `npm run build`.
- [ ] **Step 5: Commit** `"2026-06-26 feat(web): branches api modülü (tenant-scoped query/mutation)."`

---

### Task 2: `BranchDrawer` (özel branş ekle/düzenle)

**Files:**
- Create: `src/portals/admin/settings/components/BranchDrawer.tsx`
- Test: `.../components/__tests__/BranchDrawer.test.tsx`

**Interfaces:**
- Produces: `<BranchDrawer mode editing? branch? existing onClose onSave saving />`;
  `onSave({ name, mebCode, isActive })`.

- [ ] **Step 1: Failing test** (DerslikForm test deseni)
```typescript
it('Ad boşken Kaydet disabled', () => {
  render(<BranchDrawer mode="create" existing={[]} onClose={() => {}} onSave={() => {}} />);
  expect(screen.getByRole('button', { name: /^Kaydet$/ })).toBeDisabled();
});
it('Ad dolunca onSave çağrılır', () => {
  const onSave = vi.fn();
  render(<BranchDrawer mode="create" existing={[]} onClose={() => {}} onSave={onSave} />);
  fireEvent.change(screen.getByLabelText(/Branş Adı/), { target: { value: 'Robotik' } });
  fireEvent.click(screen.getByRole('button', { name: /^Kaydet$/ }));
  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: 'Robotik' }));
});
```
- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement** — `DerslikDrawer.tsx` deseni; alanlar: `Branş Adı*`, `MEB Kodu (ops.)`,
  `Aktif` toggle; ad-dup validasyonu (`existing` ile, tr-lower). i18n `school-settings:branches.drawer.*`.
- [ ] **Step 4: Run → PASS** + build.
- [ ] **Step 5: Commit** `"2026-06-26 feat(web): BranchDrawer (özel branş formu)."`

---

### Task 3: `BranchCatalogCard` — StructureTab'e ekle (liste + MEB kilit + import + drawer bağlama)

**Files:**
- Modify: `src/portals/admin/settings/tabs/StructureTab.tsx` (CourseCatalogCard altına yeni kart)
- Modify: `src/shared/i18n/locales/{tr,en}/school-settings.json` (branches key'leri)

**Interfaces:**
- Consumes: Task 1 hook'ları + Task 2 drawer.

- [ ] **Step 1: i18n key'leri ekle** — `school-settings.json` (tr+en) `branches` bölümü: başlık, kolonlar
  (`branch`, `mebCode`, `source`, `status`), `mebSourceBadge`/`customBadge`, `importMeb`, `newBranch`,
  `lockedTooltip`, `inUseTooltip`, import toast (`{added} eklendi · {skipped} zaten vardı`).
- [ ] **Step 2: Failing test (kart render + MEB satırı kilitli)** — RTL ile StructureTab'i MSW-mock'lu
  branches ile render et; MEB-kaynaklı satırın Düzenle butonunun `disabled`/gizli olduğunu assert et.
- [ ] **Step 3: Run → FAIL.**
- [ ] **Step 4: Implement** — `CourseCatalogCard` (L:302-432) desenini kopyalayıp `BranchCatalogCard`:
  - Başlık: "Branş Kataloğu · {n} branş" + `MEB'den getir` (→ `useImportMeb`, sonuç toast'ı) + `Yeni Branş` (→ BranchDrawer).
  - Tablo kolonları: `BRANŞ · MEB KODU · KAYNAK (MEB/Özel rozeti) · DURUM` + satır aksiyonları
    (Düzenle: yalnız `!isMebSourced`; MEB'de kilit+tooltip · Aktif/Pasif · Sil: in-use 409 → toast).
  - Veri: `useSchoolBranches(true)`.
- [ ] **Step 5: Run → PASS** + build.
- [ ] **Step 6: Commit** `"2026-06-26 feat(web): Branş Kataloğu kartı (Akademik Yapı) — MEB getir + CRUD + kilit."`

---

### Task 4: Öğretmen branş seçicisini lookup'a bağla

**Files:**
- Create: `src/portals/admin/teachers/hooks/useBranchOptions.ts`
- Modify: `src/portals/admin/teachers/components/HireTeacherDialog.tsx` (L:12-24 BRANCH_OPTIONS + L:145-153 kullanım)
- (varsa) öğretmen düzenleme formundaki branş alanı

**Interfaces:**
- Produces: `useBranchOptions() → { id, name }[]` (aktif school branşları; `useSchoolBranches`'i sarar).

- [ ] **Step 1: Failing test** — HireTeacherDialog'u MSW-mock'lu branches ile render et; chip listesinin
  hardcoded değil, lookup'tan gelen adlarla (örn. "Matematik", "Fizik") render edildiğini assert et.
- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement** — `useBranchOptions` = `useSchoolBranches(false)` map `{id,name}`. HireTeacherDialog'da
  `const BRANCH_OPTIONS = [...]` **kaldır**; `const { data: branchOptions = [] } = useBranchOptions()`;
  chip grid `branchOptions.map((b) => ...)` (value: `b.id` ana branş; yan branşlar çoklu `b.id`).
  Ana branş tek seçim + yan branşlar çoklu (spec D6).
- [ ] **Step 4: Run → PASS** + build.
- [ ] **Step 5: Commit** `"2026-06-26 feat(web): öğretmen branş seçici gerçek branches lookup'ına bağlandı."`

---

### Task 5: `StructureTab` subject-hook bağımlılığını taşı (silme hazırlığı)

**Files:**
- Create: `src/portals/admin/settings/api/subjects/` — `StructureTab`'in kullandığı subject hook'ları
  (`useSubjectsData`/`useSubjectMutations` karşılığı) buraya taşınır (backend `academics/subjects`'e bağlı).
- Modify: `src/portals/admin/settings/tabs/StructureTab.tsx` — import'ları yeni yere yönelt.

**Interfaces:**
- Produces: settings altında subjects query/mutation hook'ları (StructureTab tüketir).

- [ ] **Step 1: Keşif** — `StructureTab`'in `../../subjects/hooks/`'tan aldığı TAM hook'ları/tipleri listele
  (keşif notundaki grep). `portals/admin/subjects`'e BAŞKA dışarıdan import var mı doğrula (teacher artık
  Task 4'te koptu → kalan yok beklenir).
- [ ] **Step 2: Taşı** — ilgili hook + tipleri `settings/api/subjects/`'e kopyala (backend'e bağlı kısım),
  mock store'a bağımlılık varsa kopar (gerçek `academics/subjects` endpoint'i). StructureTab import'larını güncelle.
- [ ] **Step 3: Run** — `npm run build` + StructureTab testleri yeşil (Ders Kataloğu hâlâ çalışıyor).
- [ ] **Step 4: Commit** `"2026-06-26 refactor(web): StructureTab subject hook'ları settings altına taşındı."`

---

### Task 6: `/admin/subjects` route + ekran + mock + sidebar SİL

**Files:**
- Modify: `src/app/routes.tsx` (L:138-144 subjects route bloğu SİL)
- Modify: `src/app/layouts/AdminLayout.tsx` (L:69 "Dersler & Branşlar" item SİL)
- Delete: `src/portals/admin/subjects/` (tüm klasör — `data/seed.ts`, `store.ts`, `SubjectsPage`, vb.)

**Interfaces:** —

- [ ] **Step 1: Final dış-import doğrulaması** `grep -rn "portals/admin/subjects" src/` → yalnız silinecek
  kendi içi kalmalı (Task 4+5 sonrası dışarıdan import olmamalı). Varsa düzelt, sonra devam.
- [ ] **Step 2: Sil** — routes.tsx bloğu + AdminLayout item + `rm -rf src/portals/admin/subjects/`.
- [ ] **Step 3: Run** `npm run build` (kırık import yok) + `npm run test` yeşil + `/admin/subjects` artık 404
  (router'da yok) + sidebar'da "Dersler & Branşlar" yok.
- [ ] **Step 4: Commit** `"2026-06-26 feat(web): /admin/subjects ekranı + mock + sidebar linki kaldırıldı (D9)."`

---

### Task 7: i18n + EN paritesi + son temizlik

**Files:**
- Modify: `src/shared/i18n/locales/en/school-settings.json` (branches key'lerinin EN karşılıkları)
- Sil: subjects namespace dosyaları artık kullanılmıyorsa (`tr/en/subjects.json`) — referans grep'le doğrula.

- [ ] **Step 1:** EN `school-settings.json`'a Task 3 key'lerinin İngilizcesini ekle (paritede).
- [ ] **Step 2:** `subjects.json` namespace'ine başka tüketici kalmadıysa kaldır (grep `useTranslation('subjects')`).
- [ ] **Step 3:** `npm run build` + `npm run test` yeşil; DOM'da ham/missing i18n key yok.
- [ ] **Step 4: Commit** `"2026-06-26 chore(web): branş i18n EN paritesi + subjects namespace temizliği."`

---

### Task 8: Final DevTools kabul testi (manuel — kullanıcı istedi)

> Otomatik test değil; oturum başındaki **ekran + etki testi** yöntemiyle DevTools üzerinden.

- [ ] **Ekran:** Müdür ile giriş → Ayarlar → Akademik Yapı → Branş Kataloğu: liste yüklenir; "MEB'den getir"
  toast + idempotent (ikinci basışta "0 eklendi"); "Yeni Branş" ekleme; MEB satırı kilitli (Düzenle yok);
  özel branş düzenle/pasif/sil; in-use silme 409 toast. Konsol/network hatasız. i18n key'li.
- [ ] **Etki:** Öğretmen ekleme/düzenleme branş seçici Branş Kataloğu'ndaki branşları gösterir; eklenen
  özel branş seçicide görünür; görevlendirme ekranı branş rozetleri çalışır. `/admin/subjects` → 404;
  sidebar'da "Dersler & Branşlar" yok; Akademik Yapı Ders Kataloğu hâlâ çalışıyor.
- [ ] Bulguları raporla; gerekiyorsa düzeltme task'ı aç.

---

## Kapanış (FE)
- [ ] `npm run build` + `npm run test` yeşil.
- [ ] `superpowers:finishing-a-development-branch` ile tamamla.

## Self-Review (plan-fe ↔ spec)
- Spec §5 UI → Task 1-3 ✓ · §6 öğretmen → Task 4 ✓ · §7 silme → Task 5-6 (relocate→sil) ✓ ·
  §8 test/DevTools kabul → Task 1-4 vitest + Task 8 DevTools ✓ · D5 CRUD+kilit UI → Task 3 ✓ ·
  D4 import toast → Task 3 ✓.
- Kritik bağımlılık: subjects silme (Task 6) öncesi StructureTab hook taşıma (Task 5) — sıraya alındı.
  Teacher kopması (Task 4) silmeden önce.
