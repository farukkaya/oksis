# 2026-06-26 — FE skipInvalidate Cleanup — Implementation

Follow-up to the backend option C fix. Once the backend invalidate-before-commit race was
closed (`fix/post-commit-cache-invalidation`, `c4d5f74`), the FE `skipInvalidate` band-aid added
in A1.3 became dead debt. This change removes it. Not a bug fix — tech-debt cleanup.

Flow: brainstorming → design → writing-plans → subagent-driven-development (fresh implementer +
task reviewer per task, sonnet final whole-change review) → Chrome DevTools E2E.

## What shipped — branch `refactor/fe-skipinvalidate-cleanup`, commit `771ee97` (oksis-web, NOT merged)
- **4 school-settings update hooks** (BasicInfo/ContactInfo/Address/SchoolAuthority): removed the
  `skipInvalidate` option + the `if (!skipInvalidate)` guard → each unconditionally invalidates
  `schoolSettingsKeys.all()` on success. `silent`/toast/onError unchanged.
- **GeneralTab.tsx**: stopped passing `skipInvalidate: true`; removed the manual one-shot
  `qc.invalidateQueries` after `Promise.allSettled` (each mutation now invalidates on its own
  success; React Query dedupes concurrent invalidations of the same key). Removed the now-unused
  `qc` + `useQueryClient`/`schoolSettingsKeys` imports + `qc` dep. **Kept** the stable `mutateAsync`
  extraction + deps pattern (B0.1 infinite-render-loop fix) — untouched.
- **Test**: added a regression-lock unit test for `useUpdateBasicInfo` invalidation (msw 204 +
  invalidateSpy asserts `schoolSettingsKeys.all()`).

## Decisions
- "Tam sadeleştir" over "keep batch-single-invalidate" (user) — React Query dedup makes the
  redundant-refetch cost negligible (~1-2 refetches), and removing the plumbing eliminates
  misleading code. The `mutateAsync` stability invariant was explicitly protected throughout.
- Policy: NO COMMITS during execution (working tree); committed once at the end on a branch after
  user approval. master merge deferred to user (merge backend first — FE builds on it).

## Verification
- tsc: 0 errors in changed files (repo has ~58 pre-existing unrelated errors — Figma-Make migration debt).
- Unit: new BasicInfo test + existing mutations/SchoolSettingsPage tests green via `npx vitest run`.
- Full suite: 6 failures, all PRE-EXISTING — stash-verified on clean HEAD (same 6 over ScheduleEditorPage ×4,
  useHolidays year ×1, SchoolSettingsPage Zil-Programı ×1). This change adds zero new failures.
- **E2E (Chrome DevTools, live app :5173 + API :5112)**: changed Görünen Ad → Kaydet → topbar +
  preview live-updated; hard reload → value persisted (backend committed, no stale cache); console
  clean (no infinite-render warnings, no save errors). Test data reverted to "Atlas Lisesi".

## Notes / learnings
- The web repo's test runner is `npx vitest run` — npm `oksis:test` is a placeholder (not the intended
  runner, per user), and `npm run test` does not exist. CLAUDE.md still says `npm run test` (stale).
- Task-3 review (cache work) and this work both show the value of an adversarial review pass: the
  cache E2E test had a tautological assertion caught in review; here the reviewer confirmed the
  render-loop invariant was preserved.

## Docs
- Design: `.claude/sessions/2026-06-26-fe-skipinvalidate-cleanup-design.md`
- Plan: `.claude/sessions/2026-06-26-fe-skipinvalidate-cleanup-plan.md`
- Memory `project_ayarlar_bug_temizleme` → FE skipInvalidate cleanup marked ✅ DONE.
