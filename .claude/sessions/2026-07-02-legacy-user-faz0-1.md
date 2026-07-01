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
