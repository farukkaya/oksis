# 2026-06-26 — Branş Kataloğu DevTools Acceptance Test + Follow-up Fixes

## Context
Branş Kataloğu (Branch Catalog) feature BE+FE was implemented and reviewed in prior sessions
(BE merged to `master`, FE on its own branch). This session ran the final DevTools acceptance
test the user asked to watch ("geliştirme testleri göreyim") and handled two follow-up fixes.

## DevTools Acceptance Test (Chrome extension, logged in as Müdür / Atlas Koleji)
All passed:
1. Sidebar "Dersler & Branşlar" link removed.
2. Akademik Yapı → **Branş Kataloğu** card renders, populated.
3. **MEB'den getir** → `POST /import-meb` 200, idempotent (skips existing, re-adds missing).
4. **Yeni Branş** (custom "Robotik") → `POST /branches` 201, KAYNAK=Özel badge.
5. MEB row **edit locked** (lock icon + "MEB branşı düzenlenemez"); custom row editable (pencil).
6. **Delete not-in-use** (Japonca, MEB): `DELETE` **204**, row removed.
7. **Delete in-use guard** (Matematik used by teacher Büşra Aydın): `DELETE` **409**, row kept.
   Confirmed the 409 via `PerformanceResourceTiming.responseStatus` (toast faded too fast).
8. **Teacher branch picker impact test**: HireTeacher dialog shows 15 branches from the live
   lookup; custom "Robotik" selectable; deleted "Japonca" absent → live sync with catalog.
9. Teacher list Branş column resolves FK → name (İngilizce/Matematik/Kimya…).
10. **`/admin/subjects` → 404** (route deleted, D9).
11. Cleanup: re-imported MEB to restore accidentally-deleted Japonca (15→16).

Spec items D3 (source lock), D4 (idempotent import), D5 (in-use guard), D6 (teacher FK),
D9 (subjects deletion) all behaviorally confirmed.

## Bug found during acceptance + fixed (commit 8c72cc8, branch `fix/branch-katalogu-followup`)
`CreateBranchCommandHandler` computed next DisplayOrder via
`Select(b => b.DisplayOrder).DefaultIfEmpty(0).MaxAsync()` — **untranslatable to SQL in EF Core 10**
(`InvalidOperationException` → POST 500). The unit test used MockQueryable (in-memory) so it ran
fine and masked the bug. Fixed to `MaxAsync(b => (int?)b.DisplayOrder) ?? 0`.
Added **integration test** `CreateBranchTests` (real SQL Server via Testcontainers): empty-table
DisplayOrder=10 + increment MAX+10. TDD evidence: RED (reverted handler → InvalidOperationException
"DefaultIfEmpty could not be translated"), GREEN (fix → 2/2 pass).

## Master bug found + fixed (commit 9da8172, same branch)
`DevDataSeeder.SeedSchoolSettingsAsync` raw INSERT referenced 5 columns dropped by migration
`20260624_..._k2_cleanup`: `tax_number`, `tax_office`, `contact_info_fax`, `theme_primary_color`,
`theme_secondary_color` → startup seed crashed with "Invalid column name". (Unrelated to branch
feature; pre-existing master drift, worked around earlier this session via ALTER ADD.)
Fix: removed the 5 columns + values + unused `@taxNumber` param from the INSERT (25 cols = 25 vals).
Verified the corrected INSERT against the clean migration-only schema (dropped the 5 ALTER'd
workaround columns from `oksis_dev` so it now matches migrations; INSERT ran OK in a rolled-back tran).

## State at end
- `oksis-api`: branch **`fix/branch-katalogu-followup`** with 2 commits (8c72cc8, 9da8172),
  branched off `master`. User to merge.
- `oksis-web`: FE branch still pending user merge ("mastera sonra mergelerim").
- Dev env up: BE :5112 (running, with both fixes in working tree before commit), FE :5173.
- `oksis_dev` school_settings now matches true migration schema (5 workaround columns removed).

## Follow-ups / notes
- Consider running full `dotnet test` once before merge (CreateBranchTests verified green in isolation).
- `dotnet format` on the touched files times out loading the full solution; committed without it
  (changes were a raw SQL string + LINQ one-liner — no formatting impact).
