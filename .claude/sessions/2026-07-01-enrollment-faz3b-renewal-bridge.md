# Session — 2026-07-01 · Öğrenci Kayıt Faz 3B (Renewal + Rollover Bridge)

## Goal
Bridge the renewal intent collected in 3A (`Renewing`) into a real next-season draft
enrollment and class promotion, per the binding umbrella spec
`.claude/specs/ogrenci-kayit-enrollment-spec.md` (E6.2/E6.3/E8/E10/E11.6/E1.3). Single-slice
3B (A academic-sessions + B RenewEnrollment/event + C promote gating + D FE). Ran overnight,
autonomous, subagent-driven.

## Workflow
brainstorming → design doc → writing-plans (TDD) → subagent-driven-development (fresh
implementer + spec/quality reviewer per task; two opus whole-branch final reviews) → Chrome
E2E → finishing (push + PRs). Every task reviewed clean before advancing; progress tracked in
`oksis-api/.superpowers/sdd/progress.md`.

## Key decisions (brainstorming, locked)
- **S1** Single 3B slice (not split into 3B/3C).
- **S2** Gating is **renewal-draft-driven**: PromoteStudents promotes only students who have a
  `Type=Renewal` draft in the target season (single source of truth = enrollment ledger).
- **S3** RenewEnrollment handles **Renewing→draft only**; Leaving/Undecided are no-ops (no auto-withdraw).
- **S4** `EnrollmentRenewedEvent` fires at RenewEnrollment time; guardian notification is class-less.
- **S5** OpenRenewalPeriod uses a new granular permission **`season.renewal.open`** (default-deny).
- **S6** FE Export stays deferred (notReadyHint).
- Design: `.claude/specs/ogrenci-kayit-faz3b-yenileme-kopru-design.md`; plan: `...-plan.md`.

## Delivered (branch `student-faz3b`, both repos)

### Backend (oksis-api, PR #29, base student-faz3a, HEAD a06d754)
- **academic-sessions:** `AcademicSession.RenewalPeriodOpenedAt` (nullable) + `OpenRenewalPeriod()`
  (Setup-only, idempotent) + migration; `OpenRenewalPeriodCommand` + `POST /academic-sessions/{id}/open-renewal-period`
  + perm `season.renewal.open` (default-deny, zero roles); reopen/cancel guard extended in
  `SetupSeasonReverter` (RenewalPeriodOpenedAt!=null OR Type=Renewal/Draft enrollment → 409
  `reopen-has-data`; BR-AS-015 silent-data-loss fix); `renewalPeriodOpenedAt` added to the
  academic-sessions **list** DTO (detail DTO parity still open).
- **students:** `EnrollmentRenewedEvent` + `EnrollmentRenewedEventHandler` (guardian notification,
  class-less); `RenewEnrollmentCommand(TargetSessionId)→{Created,Skipped}` + `POST /enrollments:renew`
  (`students.renew`): current-active-season Renewing+Active → target Setup season `Type=Renewal,
  Status=Draft, ClassRoomId=null, GradeLevel=source+1`; skips existing-draft & terminal-grade;
  idempotent; StudentNumber unchanged; EnrollmentDate=clock.Today. `ListRenewalCandidates` gained
  `classRoomId?` (KPIs reflect filtered set).
- **bridge:** `PromoteStudents` E6.3 gating — period open → only draft-holders promote + `Draft→Active
  + ClassRoomId`(destination seat); period closed → legacy unchanged, no enrollment touched.
  `ActivateSeasonRollover` unchanged (gating flows through transparently). E11.6 guard from final
  review: gated activation requires target `Status==Active` (else 409) — protects the standalone
  promote endpoint from activating a draft in a Setup season.
- Tests: domain 481, integration ~350/351 (1 pre-existing unrelated `PersonDirectoryChildren` FK
  fail). build/format clean.

### Frontend (oksis-web, PR #60, base student-faz3a, HEAD 7db7d08)
- `renewalApi.openRenewalPeriod`/`renewEnrollment` + `useOpenRenewalPeriodMutation`/`useRenewEnrollmentMutation`
  (stable mutateAsync; invalidate `studentKeys.all` **and** `academicSessionsKeys.list()`).
- RenewalPage "Yenilemeyi Başlat" enabled: sequential open→renew + confirm dialog + created/skipped
  toast + error; permission gate (`season.renewal.open` + `students.renew`); real target Setup season
  bridge with `renewalPeriodOpenedAt` "Dönem açık" badge; graceful empty state; `classRoomId` filter
  (replacing gradeLevel); Export stays disabled; i18n `renewal.start.*` (tr+en).
- CSS: renewal.css diff empty; reused `.scr-*`/`.lc-*`/`.rb-*`, no `.stu-*` (3A lesson).
- Tests: RenewalPage 12/12 + hooks/api green; build clean.

### Docs (oksis workspace, local — no remote; commit 12b82fe)
- students domain-model (Intent collision was stale docs — corrected; StudentNumber lives on
  StudentProfile), business-rules (BR-students-004), api-contracts; academic-years business-rules
  (BR-AS-016 + BR-AS-015 guard), api-contracts; permission-matrix (`season.renewal.open`); both
  completion_status with 5 logged deviations.

## Final whole-branch reviews (opus, both GO-WITH-FIXES → fixed)
- **API:** E11.6 seam — standalone promote-students endpoint could activate a draft in a Setup
  (non-active) season. Fixed (a06d754): gated activation requires `Status==Active` (else Conflict);
  gated tests activate first + negative test added. Main rollover flow unaffected (activates first).
- **Web:** stale season-bridge badge after "Yenilemeyi Başlat" — mutations only invalidated
  `studentKeys`, not the academic-sessions query. Fixed (7db7d08): both hooks also invalidate
  `academicSessionsKeys.list()`.

## Chrome E2E (Atlas Lisesi, school admin, 2026-2027)
- **Verified live:** RenewalPage renders fully styled (`.scr-*`/`.lc-*`, no CSS breakage — the 3A
  blind spot); "Yenilemeyi Başlat" renders and is correctly **disabled** with permission tooltip
  ("Yenileme dönemini başlatma yetkiniz yok" — `season.renewal.open` default-deny gate works);
  Export disabled (S6); season bridge empty state ("Hedef taslak sezon yok"); KPI 20 Kararsız/22%.
- **Full flow verified live (user granted `season.renewal.open` to SCHOOL_ADMIN in dev DB):** created
  a Setup season 2027-2028 via the rollover wizard ("Sezonu Aç", not activated), marked 2 students
  (10-A, 10-B) Renewing, clicked "Yenilemeyi Başlat" → ConfirmDialog → OpenRenewalPeriod (bridge badge
  flipped "Taslak"→"Dönem açık" with no reload, confirming the badge-invalidation fix live) →
  RenewEnrollment → toast "2 taslak kayıt oluşturuldu, 0 atlandı". DB confirms: 2027-2028
  renewal_period_opened_at set and status STILL Setup (E11.6 respected); 2 Renewal/Draft/grade-11
  (=10+1)/ClassRoomId=NULL enrollments.
- **CSS bug found + fixed live (commit 07e4e12, web):** RenewalPage did NOT import `modal.css` (a
  page-level import pattern; StudentsPage does it). The ConfirmDialog's `.modal`/`.modal-scrim` were
  unstyled (position:static) so the dialog rendered at ~1950px down the page, invisible. Unit tests
  (jsdom, query by role/text) could not catch it — **only the screen test did (the 3A `.scr-*` lesson
  repeating)**. Fix = one-line import; build clean, RenewalPage 12/12. Minor observation: two
  "Yenilemeyi Başlat" buttons render (header + empty-state) — worth a later look.

## Notes for user
- 3A still not merged; 3B PRs are based on `student-faz3a` for a clean diff. Merge 3A first, then
  rebase/retarget 3B PRs to master.
- Task 2 commit also fixed a **pre-existing** (2026-06-14, c7b6f5e) test-only `MasterRoleSeedTests`
  bug (assignments.copy-season / curriculum-hours.override exception list) — zero production impact;
  can be split into its own commit if preferred.
- Notification text hardcoded Turkish (no notification-i18n infra; consistent with 3 sibling
  handlers — Debt-N2).
- Dev servers left running on 3B: api :5112, web :5173. New migrations applied to `oksis_dev`.

## State at session end
- PRs open: oksis-api#29, oksis-web#60 (base student-faz3a). Workspace docs local.
- Branches: api HEAD a06d754, web HEAD 7db7d08 (both off student-faz3a).
