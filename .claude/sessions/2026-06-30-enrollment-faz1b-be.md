# Session: Enrollment Faz 1B-BE — Student Account Provisioning + Student-Number Login

**Date:** 2026-06-30
**Branches:** `oksis-api:student-enrollment-be`, `oksis-web:student-enrollment-be`
**Session type:** Feature implementation (backend + frontend, 10 tasks)

---

## Goal

Implement the BE side of enrollment Phase 1B — automatically provision a student account with a temporary password during enrollment (`EnrollStudentCommand`), support small-grade carve-out (no account for Preschool/Primary), wire up student-number login, and close the FE success-screen password-box Debt that was deferred from Phase 1B FE (2026-06-29).

---

## What Shipped (Tasks 1–10)

| Task | Scope | Summary |
|---|---|---|
| 1 | BE Domain | `EducationLevelClassifier` — maps grade number to `EducationLevel`; `IsSmallGrade` helper (Preschool, Primary) |
| 2 | BE Domain/Infra | `ITemporaryPasswordGenerator` + `TemporaryPasswordGenerator` — crypto-RNG, readable charset (no confusable chars), 8-character output |
| 3 | BE Application/Infra | `IStudentAccountProvisioner` + `StudentAccountProvisioner` — opens student `Account` with temp password inside the EnrollStudent transaction; small-grade → no-op; idempotent (returns existing account state on replay) |
| 4 | BE Application | `EnrollStudentResult` gains `TemporaryPassword: string?` + `StudentAccountCreated: bool`; handler calls provisioner at step 7.5; replay → TemporaryPassword null, StudentAccountCreated via account-existence check |
| 5 | BE Domain | `IdentifierType.StudentNumber`; `Identifier.Create` classifies 1–9 digit numeric strings as StudentNumber |
| 6 | BE Application port | `IPersonDirectory.FindByStudentNumberAsync(string, Guid, CancellationToken)` — tenant-scoped; SchoolHint required |
| 7 | BE Infra | `IdentifierResolver` StudentNumber branch — calls `FindByStudentNumberAsync`; missing SchoolHint → rejected; account-less student → uniform not-found |
| 8 | FE | `EnrollResult` type extended with `temporaryPassword` / `studentAccountCreated` |
| 9 | FE | `IdentityBox` three-state success row: real temp password / replay note / small-grade note; `DebtBadge` removed; i18n tr+en updated |
| 10 | Docs | This session — module docs updated, session summary written |

---

## Key Decisions

1. **Small-grade carve-out is automatic by grade (E2.6):** `EducationLevelClassifier.IsSmallGrade` returns `true` for Preschool and Primary. `StudentAccountProvisioner` skips account creation for small-grade students — no admin toggle needed. Middle School and High School always get a student account auto-created.

2. **Replay returns no temporary password:** The plain-text temporary password is never stored (only its hash is persisted via `Account.SetPassword`). On replay (`clientRequestId` already processed), `EnrollStudentResult.TemporaryPassword` is `null` and `StudentAccountCreated` reflects the actual existence of the account. FE `IdentityBox` shows a human-friendly note explaining the password was already issued.

3. **Student-number format/acceptance deferred to a separate spec (user decision 2026-06-30):** The current `StudentNumber` generation format (`{year}{5-digits}`) is defined in spec E2.3. However, the question of *which formats the login resolver should accept* (current 5-digit padding, short-form, old existing numbers) was deemed out of scope for this phase. The login resolver was intentionally made format-agnostic (accepts any 1–9 digit numeric string) so it survives whatever the number format spec decides. This is NOT a spec deviation — it is a deliberate deferral to keep scope clean.

4. **`SchoolHint` is mandatory for student-number login:** Student numbers are school-scoped (not globally unique). Without `SchoolHint` (school ID in the login request), `IdentifierResolver` rejects the attempt immediately. This prevents accidental cross-tenant resolution.

---

## Closed Debt

- **Success-screen password box (Debt, 2026-06-29):** `EnrollSuccess` previously rendered a placeholder `IdentityBox` with a `DebtBadge` because the backend did not return a temporary password. With Faz 1B-BE complete, `IdentityBox` now receives the real `temporaryPassword` from the API response and renders one of three states: (a) real password, (b) replay note, (c) small-grade note. `DebtBadge` component reference removed from `EnrollSuccess`.

---

## Pre-existing Test Failures (unrelated, noted)

Two test failures were confirmed on the `master`/base branch and are **not caused by this work**:

- `MasterRoleSeedTests` — seed test depends on DB state or ordering; pre-existing flake.
- `FindActiveChildrenTests` — identity read-port test; pre-existing failure unrelated to enrollment.

These are tracked separately and do not block this branch.

---

## E2E Browser Verification + Follow-up Fixes (2026-06-30)

Stood up the full stack (docker SQL+Redis+Mailpit, `oksis-api :5112`, `oksis-web :5173` via vite proxy, `DevDataSeeder`) and drove the enrollment wizard end-to-end with the Chrome extension as a seeded SchoolAdmin (`mudur.s1@oksis.local`, school "OKSİS Dev Okulu", grades 9–12).

**Verified live:** 5-step wizard → success screen with REAL student number (`202600001`) + REAL temporary password (`kXnTNYVR`, readable charset). Student-number login resolver verified via API: with `SchoolHint` → credentials accepted (reached consent-onboarding gate = resolver + password OK); without `SchoolHint` → uniform invalid-credentials. DB confirmed `require_password_change = 1`. Capacity grid + duplicate-check endpoints worked.

**Three real defects surfaced and addressed:**

1. **CSS — bare wizard form fields (FIXED, commit `d08c75d`):** `EnrollStudentSheet` root (`.enroll-sheet`) carries neither `.modal` nor `.scr`, but the shared base form-control styles (`.inp`/`.fld`/`.fld-row`/`.sel`) in `modal.css` are scoped under `.modal`. Inputs rendered unstyled. Fix: ported the base form-control rules scoped to `.enroll-sheet` in `enroll.css`. Pre-existing Phase 1B FE handoff-port gap, not Phase 1B-BE.
2. **TCKN effectively mandatory (FIXED, commit `ec1ce2f`):** `tcknOk` required exactly 11 digits, so an empty national ID blocked the wizard — violating spec E2.4/E11.1 (TCKN optional). Now optional (empty OR 11 digits); label `*` → "· optional".
3. **Foreign-national gap closed (E2.4, commit `ec1ce2f`):** Added a "Foreign national student" checkbox. When checked, the ID field becomes "Foreign ID No" (free format, no 11-digit rule) and the command sends `NationalIdType=Ykn`. Backend unchanged (`IdType.Ykn` exists; `NationalIdProtector.Protect` is type-agnostic). Schema TDD (9/9) + 2 component tests; students suite 95/95; tsc + build clean; live-verified.

**Operational finding (root cause of an enroll 403):** Enroll endpoints returned 403 `students.create` for the SchoolAdmin because the dev DB (`oksis_dev`, ~8h old) was missing the `20260628235823_20260629_students_permissions` migration — **the API does NOT auto-migrate on startup**. The seed code is correct (`PermissionSeedData` defines the 8 students permissions; `RolePermissionSeedData.AllPermissionIds` grants them to SuperAdmin + SchoolAdmin). Applied via `dotnet ef database update`; SchoolAdmin now has all 8 `students.*` permissions. The separate `MasterRoleSeedTests` failure (its own Testcontainers DB) remains unexplained, tracked apart.

---

## Remaining Roadmap

| Phase | Scope |
|---|---|
| Faz 2 — List & Lifecycle BE | `ListStudents`, `GetStudentDetail`, `GetEnrollmentHistory`, `Freeze`/`Withdraw`/`TransferOut`/`Graduate` endpoints; server-side `seasonId` filter |
| Faz 2 — FE mock-to-real | AssignClass / PromoteStudents `studentsDebtApi` → real endpoints; Documents tab activation; Account tab wiring |
| Student-number format spec | Separate spec for format/acceptance rules (E4.4/E2.3 deferral); login resolver already format-agnostic |
| Faz 3+ | `students.import` bulk import; document upload UI; mobile student-role screens |
