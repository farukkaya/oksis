# Session — 2026-06-29 · Student Enrollment Faz 1B (Frontend)

## Goal
Port the delivered 5-step enrollment wizard design onto the existing `oksis-web` students module and wire it to the Faz 1A backend endpoints. Binding spec: `.claude/specs/ogrenci-kayit-enrollment-spec.md`.

## What shipped
Brainstorming → design doc → 11-task TDD plan → subagent-driven execution (implementer + reviewer per task) → opus whole-branch review → merged to master.

- **Design + plan (workspace repo):** `.claude/specs/ogrenci-kayit-faz1b-frontend-design.md`, `.claude/specs/ogrenci-kayit-faz1b-frontend-plan.md` (commits f9c0a55, a65cbdd).
- **Code (oksis-web, branch `student-enrollment-fe`, 17 commits, merged to master):**
  - `schemas/enrollWizardSchema.ts` — `EnrollWizardForm`, `isStepValid`, `gradeLevelToInt`, `toEnrollCommand` (form→PascalCase command; enum wire values; gg.aa.yyyy→yyyy-MM-dd; optional pruning).
  - `api/studentsApi.ts` — `enroll`, `transferIn`, `checkNationalId`, `branchCapacity`, **`searchEnrollGuardians`** (renamed to avoid clobbering the existing drawer `searchGuardians`).
  - `hooks/useEnrollWizardQueries.ts` (debounced/enabled-gated queries) + `hooks/useEnrollStudentMutation.ts` (type-routed enroll/transfer-in, tenant-scoped invalidation) + `keys/studentKeys.ts` additions.
  - `components/enroll/` — `EnrollStudentSheet` (RHF FormProvider shell, stepper, footer, idempotent `clientRequestId`), `WizardRail`, `steps/{StepType,StepStudent,StepPlacement,StepGuardians,StepSummary,EnrollSuccess}`, `parts/{PhotoUpload,CapacityGrid,GuardianPicker→inlined,IdentityBox}`, `enroll.css` (ported from handoff `flows.css`).
  - i18n `enrollWizard.*` in tr+en (full parity).
  - Removed old `EnrollStudentDialog` + enroll Debt (`useEnrollStudent`, `studentsDebtApi.enrollStudent`) + `enrollModal` i18n; wired `EnrollStudentSheet` into `StudentsPage`.
- **Module docs (workspace repo, commit 06c5157):** students `completion_status` (40→50%, Faz 1B FE done + spec-deviation notes), `ui-flows`, `api-contracts`, `README`.

## Key decisions
- **Success-screen identity box = faithful port + Debt-flagged whole** (user-locked): student number is REAL (`result.studentNumber`, copyable); temp-password row shows a DebtBadge + "account pending (backend)" note — **no fabricated password**. Rationale: student account + temp password + student-no login resolver + small-grade carve-out are deferred to **Faz 1B-BE** (spec E2.6/E2.7).
- Active session resolved via `useCurrentSessionQuery`; grade levels via classrooms `useGradeLevelsQuery`; capacity via Faz 1A `/branches/capacity`.

## Spec compliance (final opus review)
E11.4 HARD capacity ✅, E5.2 idempotency ✅ (after MUST-FIX), E2.3 ✅, E2.6/E2.7 Debt ✅, multi-tenant keys ✅, i18n parity ✅, no hardcoded Turkish / static inline-style / `any` ✅.
- **MUST-FIX caught + fixed:** `clientRequestId` was created once and reused on "Yeni Kayıt" → second enrollment hit idempotency replay → silent data loss. Now regenerated in `handleNewEnroll` (commit d61f2b6 + regression test).

## State at session end
- **oksis-web:** Faz 1B merged to master (branch ahead-of-master = 0). Students suite 84/84 green, build clean.
- **oksis-api:** Faz 1A already on master (branch ahead = 0). Endpoints the FE calls exist on master.
- Local branches `student-enrollment-fe` (web) and `student-enrollment` (api) still exist — safe to delete.
- SDD ledger: `oksis-web/.superpowers/sdd/progress.md` (section "Öğrenci Kayıt Faz 1B").

## Deferred (carry forward)
- **Faz 1B-BE:** student account provisioning + temp password + student-no login resolver + small-grade parent-only carve-out (E2.6/E2.7) — fills the success-screen Debt box.
- **Faz 2 — Liste & Yaşam döngüsü (P3+P4):** dedicated `ListStudents`/`GetStudentDetail`/`GetEnrollmentHistory` (FE `enrollmentHistory` is stubbed `[]`), drawer cross-read, Freeze/Resume/Withdraw/Archive.
- **FE minors (roll-up, all triaged DEFER):** extract `GuardianPicker` from 400-line `StepGuardians`; summary shows "5-A" not "Ortaokul · 5-A"; orphan `debt.enroll.*` i18n keys; `searchEnrollGuardians` no dedicated unit test; `.fld-hint` label-as-hint fallback; `GuardianSearchItem`/`GuardianSearchResult` duplicate type; "Mevcut kaydı aç" only calls onClose (spec §6 wants drawer nav); unused `summary.*`/`success.inviteSent` i18n keys.
- **E2E browser test:** needs docker (SQL+Redis) + oksis-api running + seed (school/active session/grade levels/classrooms/admin) + web dev server. Not done this session (user deferred).

## Roadmap
P0 ADR ✅ → Faz 1A BE ✅ → Faz 1B FE ✅ → **Faz 1B-BE (deferred account)** / **Faz 2 Liste&Yaşam döngüsü** → Faz 3 Yenileme (`reenroll.jsx`) → Faz 4 Import → Faz 5 Belge & Aday.
