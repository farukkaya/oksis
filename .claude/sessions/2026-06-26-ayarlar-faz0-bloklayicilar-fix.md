# 2026-06-26 — Ayarlar FAZ 0 Blockers Fixed (B0.1–B0.4)

## Context
Continuation of the /admin/settings bug-cleanup plan
(`2026-06-25-ayarlar-bug-temizleme-plani.md`). Prior session shipped the big FAZ 1
item (Branş Kataloğu / A1.1+A1.4). This session the user picked **FAZ 0 blockers**
(skipped earlier in favour of branches). All four diagnosed, fixed with TDD, and
**E2E-verified in the browser** (DevTools, logged in as Müdür / Atlas Koleji).

Both repos: work on branch **`fix/ayarlar-faz0-bloklayicilar`** (api + web),
branched off master, **pending user merge**.

## Diagnosis (3 parallel Explore agents + static + runtime)
- **B0.1** infinite render loop — *reproduced live*: console showed 20+ "Maximum
  update depth" at `GnlForm` (GeneralTab). Root cause: `handleSave` useCallback
  depended on whole React Query mutation **objects** (new ref every render) →
  `headAction` useMemo new → `useSetHeadAction` effect `set(node)` → parent
  setState → loop. (NB: the old plan's line refs were stale; component was rewritten
  but the loop persisted via a different path.)
- **B0.2** subject create 400 — FE sent `code: ""` (no FE validation) + `displayOrder: 0`;
  backend `Code NotEmpty` + `DisplayOrder > 0`.
- **B0.3** room create — the diagnosing agent's "JSON PascalCase/camelCase" theory was
  **wrong** (disproved: AddControllers uses Web defaults = camelCase; branch POST works).
  Real cause: FE sends `capacity: 0` when empty; backend required 1-500 at **three
  layers** (domain, FluentValidation, AND a DB CHECK constraint `ck_rooms_capacity`).
  The DB constraint was only discovered via E2E (first save → 500), not static reading.
- **B0.4** generic error toasts — axios `httpClient` calls reject with AxiosError;
  backend `errors[].message` was never surfaced. (school-settings uses the fetch
  `utils/api` + `ApiError` + `translateApiError` and already worked — left untouched.)

## Fixes
**oksis-api** (2 commits):
- B0.2: removed `DisplayOrder` from `CreateSubjectCommand`; handler auto-assigns
  `max(DisplayOrder)+10` using SQL-safe `MaxAsync(s => (int?)s.DisplayOrder) ?? 0`
  (branch CreateBranch bug lesson); dropped validator `GreaterThan(0)`. Unit tests
  updated + auto-assign test (empty→10, max 30→40). 16/16 pass.
- B0.3: capacity optional (0 = unspecified). `Room.ValidateCapacity` allows 0;
  CreateRoom/UpdateRoom validators `InclusiveBetween(0, MaxCapacity)`; new migration
  `20260626_room_capacity_allow_zero` (ck_rooms_capacity → BETWEEN 0 AND 500), applied
  to oksis_dev. Domain test: 0 allowed, -1/501 rejected. 19/19 pass.
  (Generated migration needed manual fix to file-scoped namespace — IDE0161-as-error.)

**oksis-web** (3 commits):
- B0.1: `handleSave` now depends on stable `mutateAsync` (destructured) instead of
  mutation objects. Regression test in SchoolSettingsPage.test (asserts no
  "Maximum update depth" console.error on render + field change).
  **Follow-up (same session, after user saw the loop recur on Akademik Yapı):**
  the loop existed in 4 tabs, not just GeneralTab. Audited ALL settings tabs and
  fixed the same pattern in StructureTab (YapForm), PoliciesTab, BellScheduleTab
  (commit 394a0e5). Bildirim/Modüller/Tatil/Derslik tabs are safe — they
  deliberately keep `save` out of the head-action useMemo deps (eslint-disabled).
  Lesson: when fixing a shared anti-pattern, grep ALL sibling components, not just
  the reported one.
- B0.2 FE: Kısa Kod made required (`*` + err() guard + submit guard + onBlur). Test
  for empty-code-blocks-save + filled-code-in-payload. 5/5 pass.
- B0.4: new `getApiErrorMessage(error, fallback)` in `shared/api/apiError.ts`
  (joins backend messages, skips InternalError/500 generic, falls back otherwise);
  wired into RoomsTab (save/toggle/delete) and subjects mutations onError. Helper
  unit tests (4). 11 FE tests green total.

## E2E verification (Chrome DevTools)
1. B0.1 — settings page load: console clean (was 20+ errors). ✅
2. B0.2 — created "E2E Test Dersi" (TSTE2E): "Ders kaydedildi", catalog 22→23. ✅
   Kısa Kod shows `*` (required) live. ✅
3. B0.3 — created "E2E Kapasitesiz Derslik" (DTKAP0) with **empty capacity**:
   first attempt 500 (`ck_rooms_capacity`) → after migration "Derslik eklendi",
   capacity renders "—". ✅
4. B0.4 — duplicate code TSTE2E → red toast **"Bu ders kodu zaten kullanılıyor."**
   (real backend message, not generic). ✅

## State / follow-ups
- Both branches pending merge to master (user merges).
- Dev artifacts left in oksis_dev: subject TSTE2E + room DTKAP0 (harmless; can clean).
- Backend was restarted (old pid killed, fresh `dotnet run` on :5112) to serve new code.
- **Pre-existing, NOT touched**: `SchoolSettingsPage.test` "Zil Programı" test fails
  (`getByText('Zil Çizelgesi')`) — BellScheduleTab content drift, unrelated; several
  other test files have pre-existing TS type-drift errors (identity/duties/sessions).
- **Still open** (next): FAZ 1 — A1.3 (topbar displayName), A1.2 (season-context),
  B2.1 (logo), B2.2 (il/ilçe); B0.2H (level-based weekly hours); FAZ 3/4. Plus the
  Branş documentation debt (subjects spec D6/D9 + subjects/teachers completion_status
  not yet updated for the merged master.branches + teacher branchId FK work).
