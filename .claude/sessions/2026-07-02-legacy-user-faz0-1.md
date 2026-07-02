# Session Summary — 2026-07-02 — Legacy User Retirement, Faz 0+1 (Login/Refresh)

## Goal
Start the full retirement of the legacy `identity.User` model (Faz 2 / OQ-identity-001): brainstorm → binding design → phased plan → subagent-driven execution of Faz 0+1 with Chrome E2E and per-phase PRs.

## Process
- **Brainstorming (superpowers):** 6 one-at-a-time decisions locked: no migration script (dev reseed; logged as ADR-001 Stage 2 deviation), merge `identity-invite-accept-route` first, hard removal of legacy endpoints, minimal scope (no "D"-badge admin endpoints), include invite-accept onError UX fix (Faz 3), PR per phase. Approach A (delete-within-phase) chosen.
- **Design doc:** `.claude/specs/legacy-user-emeklilik-design.md` — 6 phases (0 merge+reseed → 1 login/refresh → 2 password → 3 invitations+creation → 4 CRUD/reads → 5 entity+table drop). Key model decision: "Account is born only when a password is born". **Amendment** after plan discovery: `RefreshTokenCookie` is permanent Account infra (never delete); `IJwtTokenService` + `PermissionReader` legacy claim fallback move to Faz 3 (AcceptInvitation dependency); `IRefreshTokenStore` moves to Faz 4; no legacy refresh DB table exists (Redis).
- **Plan:** `.claude/specs/legacy-user-emeklilik-faz0-1-plan.md` — 7 tasks, verbatim code blocks, exact commands.
- **Execution (subagent-driven):** fresh implementer + task reviewer per task, fix subagents on findings, final whole-branch review on the strongest model. Ledger: `.superpowers/sdd/progress.md`.

## Shipped (3 PRs open, merge order: web+mobile first, api last)
- **oksis-api#31** (8c0943d..1fde98d): deleted `POST /auth/login|refresh|revoke` + `IssueSession` + `LoginBody`; deleted Login/RefreshToken/RevokeToken command slices + `LoginResponse` + `LoginCommandHandlerTests`; cleaned dead `TenantContextMiddleware` allowlist entries (final-review finding); doc comments realigned. 148/148 Api.UnitTests, full suite green except one pre-existing integration FK failure (stash-proven unrelated).
- **oksis-web#62** (3a55524..f1d4703): `RefreshTokenManager` account-only via TDD (MSW unhandled-request as RED evidence); `NO_REFRESH_PATHS`, unconditional account logout, `LoginResponse` type + comment sweep. 1164/1170 (6 pre-existing).
- **oksis-mobile#16** (f322abe..e7b8a31): cold-start recovery repointed to `accountApi.refresh` (incidentally fixes account-session cold start), legacy fallback + `auth.api.ts` + `BackendLoginPayload` deleted. 172/175 (3 pre-existing).
- **Faz 0:** `identity-invite-accept-route` merged to web master (`3a55524`); dev DB reseeded; account-login smoke 200.
- **Docs:** identity `completion_status.md` (Faz 0+1 entry + ADR-001 Stage 2 deviation under "Spec Dışına Çıkılanlar") + README metadata; memory updated.

## E2E (Chrome, live dev)
Login ✓; reload → `POST /auth/account/refresh` 200, session restored, ZERO legacy `/auth/refresh` requests ✓; server-side logout proven via curl (204 + cookie cleared + subsequent refresh impossible) ✓.

## Pre-existing bugs discovered (debt, NOT caused by this branch)
1. **AdminLayout.handleLogout** (`oksis-web` `1f58f47`, identical on master): only `localStorage.clear()+redirect`, never calls `authStore.logout()` → server-side revoke/cookie clear never triggered from UI; a reload restores the "logged out" session.
2. **401 storm on stale persisted session + dead cookie** (~1000 refresh/logout requests): no re-entrancy guard on the interceptor→logout path; `/auth/account/logout` not in `NO_REFRESH_PATHS`.

## Next
Faz 2 (password) — its plan will be written when started; carry-overs listed in the ledger and in memory (`project_legacy_user_retirement`).

---

# Addendum — Faz 0+1 merged, AdminLayout fix, Faz 2 completed (same day)

## Merges + logout fix
- All three Faz 0+1 PRs merged in order (web#62 `2ebbb91` → mobile#16 `e6ee777` → api#31 `af72bf4`).
- AdminLayout logout bug fixed on web master (`c162dfe`): all four portal layouts now call a shared `performLogout` (server logout → localStorage.clear → redirect); TDD (2 new tests) + live Chrome proof (logout 204, session does NOT survive reload).

## Faz 2 (password) — shipped, 3 PRs open (api#32 / web#63 / mobile#17, merge order web+mobile→api)
- Design amendment-2a (discovery corrected a premise: `ChangePasswordCommand` was live-but-clientless via `POST /users/me/change-password` — user approved deleting endpoint+slice) and amendment-2b (orphaned `PasswordResetToken` + `identity.password_reset_tokens` dropped this phase via migration with full Down).
- api: 2 legacy password endpoints + 3 slices + 3 contract records + TenantFreeEndpoints entries + token infra deleted; postman/curl/manual-test docs converted to account endpoints. web: 4 dead payload types. mobile: 2 dead zod schemas (changePasswordSchema kept).
- Verification: insurance full suite at api head (sole pre-existing FK fail); deleted endpoints 404; `account/forgot` 202 (token persisted, log-proven); change-password contract chain via curl (204 → old pw 401 → new pw 200 → revert 204 → original 200; dev password restored); Chrome login/bootstrap-refresh live. 6/6 task reviews + final whole-branch review (fable) clean; 2 Minors closed on-branch.

## New root-cause diagnosis (pre-existing debt, separate work)
**Cross-tab refresh double-spend:** the httpOnly `oksis_rt` cookie is shared across tabs; concurrent per-tab bootstrap refreshes make the second present an already-rotated token → reuse detection revokes the whole chain → all tabs die; with no re-entrancy guard on the interceptor→logout path this cascades into a ~1000-request 401 storm (reproduced live twice today). Candidate fix: cross-tab refresh lock (BroadcastChannel/localStorage), add `/auth/account/logout` to `NO_REFRESH_PATHS`, logout re-entrancy guard.

## Tooling notes
- Web scripts are `oksis:dev`/`oksis:test` (CLAUDE.md says `npm run dev/test` — docs drift, still open).
- Chrome extension form automation (form_input/type) fails to trigger RHF submits on forgot/change-password pages (no console errors) — future E2E should fall back to curl for those flows.
- A subagent accidentally popped the user's `demotable` stash; original intact at `stash@{1}`, duplicate parked at `stash@{0}` (user to decide drop).

---

# Addendum 2 — Faz 3 (invitations + user creation) completed, 2 PRs awaiting merge

- Faz 2 PRs merged (web#63 → mobile#17 → api#32). Faz 3 executed subagent-driven (7 tasks, 3 Important findings fixed on-branch, final whole-branch review: both repos YES).
- **api#33 (ready)**: provisioner now creates a real Account (`Person.LinkedAccountId` = Account.Id — proven live: JWT sub == accounts.id == linked_account_id, auto Staff profile); Kullanıcılar read invitation correlation → Users `Invitations` (PersonId-keyed, DTO status map); `POST /users` → Person+invitation (`PersonUserCreationService`, 5-role limit, `INVITE_EXPIRE_DAYS` from SystemSettings, distinct error codes); 65-file legacy teardown incl. `IJwtTokenService` + PermissionReader legacy-claim fallback; `invitation_tokens` DROP migration. Final suite at head: single known pre-existing FK fail.
- **web#64**: dead `modules/invitations` deleted; MVP-dışı roles removed from modals; **InvitationAcceptPage visible onError** (the 2026-07-01 debt CLOSED — E2E screenshot proof: "Bu davet için hesap zaten oluşturulmuş"). Memory file for that debt deleted.
- **Chrome E2E:** full invitation lifecycle (create 201 → wizard accept 200 → login with new account 200 → repeat-accept visible error → deleted endpoints 404). Token obtained via dev-DB hash override — which exposed the sharp finding below.
- **SHARP DEBT:** the raw invitation link is now unreachable from ANY production path (not in create/resend responses; `UserInvitedEvent` has no handler so no email; the legacy create-with-link path was deleted). Candidate quick fix: return the invite link in create/resend responses, or wire an email handler. Decision pending with the user.
- Merge order: web#64 first, then api#33. Next phase: Faz 4 (CRUD/reads + IRefreshTokenStore retirement).
