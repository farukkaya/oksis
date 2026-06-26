# 2026-06-26 — Ayarlar Remediation: FAZ 1 + FAZ 3 + doc debt (continued)

Continuation of the `/admin/settings` bug-cleanup plan. After FAZ 0 (B0.1–B0.4) earlier
this day, this stretch cleared most of FAZ 1 and FAZ 3, plus the branch documentation debt.
Each item: TDD where applicable + Chrome DevTools E2E + isolated commit + fast-forward merge
to master. Per-item branches deleted after merge.

## Completed (all merged to master)

- **A1.2** (api+web) — Tatil Takvimi season-context. Was 3 mismatched sources (hardcoded
  "2025-2026" sub, `new Date().getFullYear()`, topbar). Now single source = active season
  (`useCurrentSessionQuery`): `useHolidays(seasonId)` → `holidays?seasonId=`; dynamic season
  name in headings. **Discovered + fixed a backend Redis cache race** (cache key
  `holidays:{Year}:{SeasonId}`, seasonId read → `holidays:0:{seasonId}`, but create/update/delete
  invalidated `holidays:{HolidayDate.Year}` → mismatch, stale cache survived restart). Fixed all
  3 handlers to invalidate the whole `holidays:` prefix.
- **A1.3 + B2.3** (web) — Topbar/sidebar school name bound to settings Görünen Ad
  (`buildAdminSchoolChip` from `useSchoolSettings`); live-updates on save. Fixing the live update
  exposed a backend **invalidate-before-commit** race (TransactionBehavior commits AFTER the
  handler; `_cache.RemoveAsync` runs pre-commit; a concurrent refetch re-caches stale). Mitigated
  on the FE: GeneralTab now (B2.3) PUTs only dirty sections + (A) uses `skipInvalidate` on the 4
  mutation hooks and invalidates ONCE after all PUTs settle (post-commit). The root backend fix
  ("option C", post-commit invalidation) is deferred tech-debt — affects ~34 cache-invalidation sites.
- **B2.2** (web) — İl/İlçe readonly inputs → `useCountries/useProvinces/useDistricts` cascade
  selects; İl pick writes country (TR fallback) + resets district. E2E: İstanbul→KADIKÖY persisted.
- **B2.1** (web) — Logo upload UI. Backend was already complete (UploadSchoolLogo +
  IFileStorageService storage abstraction + endpoints; FE useUploadLogo/useDeleteLogo hooks existed);
  only the GeneralTab UI was missing. Added preview + hidden file input + Yükle/Değiştir/Kaldır.
  E2E: PNG uploaded (POST 201), logo live in slot + topbar + preview. (Old dev logoUrl
  cdn.oksisdev.k12.tr → 503 was stale dev data.)
- **B3.1** (web) — School holidays now reflected in Akademik Takvim (`holidaysToCalendarEvents`
  HolidayDto→CalendarEventDto type='holiday'). NOTE: the calendar module uses a MOCK season slug
  id ("sess-2025-2026"); holidays need the REAL academic-session GUID → holiday query uses
  `useCurrentSessionQuery`, not the calendar's mock season id. E2E: 15/20 Mart holidays in grid + panel.
- **B3.2** (web) — Disabled modules hidden from sidebar. `ShellNavItem.moduleKey` +
  `filterNavByModules` (a module is active only if moduleConfigs isEnabled=true; absent/false =
  Kapalı = hidden — same semantics as the Modüller tab). E2E: Ders Programı + Duyurular gone.
- **B3.3** (api) — TimetableDevSeeder now seeds bell day-assignments (Mon-Fri FullDay, weekend
  closed). Was empty → "all days Kapalı". Bell schedule itself was already conflict-free.
- **Branch doc debt** (workspace docs) — A1.1/A1.4 (master.branches + teacher branchId FK +
  /admin/subjects deletion) had overridden subjects spec D6/FE-S2 without doc updates (Rule #6).
  Updated the spec (D6/FE-S2 "superseded" notes) + subjects/teachers completion_status deviation logs.

## Deferred / remaining
- **B0.2H** (level-based weekly hours, L) — DISCOVERY DONE: backend level model already exists
  (CurriculumHourTemplate master + SchoolWeeklyHourOverride + RequiredHoursResolver). Correct
  approach = wire the catalog UI to that model (per-level hours, override upsert), NOT a new
  SubjectGradeLevel.WeeklyHours column (3rd conflicting source). Overrides spec D4. Own focused session.
- **option C** (post-commit cache invalidation) — deferred by user; the real fix for the
  invalidate-before-commit race; ~34 sites + TransactionBehavior; high blast radius.
- **FAZ 4** refactors (R4.1 shared create-drawer, R4.2 shared settings-tab, R4.4 type
  convention TR↔EN, R4.5 API host/proxy + httpClient unify). R4.3 (Kısa Kod label) already done via B0.2.

## Notes / learnings
- Two recurring backend cache bugs surfaced via E2E (A1.2 holidays + A1.3 school-settings): the
  invalidate-before-commit + Redis-survives-restart pattern. E2E (not unit tests) caught both.
- The academic-calendar module + the calendar SeasonAxis use mock slug season ids decoupled from
  the real academic-sessions GUIDs — relevant for any future calendar↔real-data integration.
