## Description
Implement real-time forced logout via SignalR `SessionHub` and the Hangfire background cleanup/retention jobs (Section 14 + 15).

Parent issue: `OKSMVP-1`

Repository: `farukkaya/oksis-api`

Story Points: `21`

Sprint: 6 — 2FA + Hardening

## Scope
- `src/Oksis.Api/Hubs/SessionHub.cs` + Redis backplane config
- Hangfire jobs: `ExpiredRefreshTokenCleanup`, `OtpChallengeCleanup`, `DormantAccountScan`, `AuditRetentionEnforcer`, `LockoutReleaseAudit`
- Event consumers that trigger `ForceLogout`

## Implementation
- `SessionHub`: client joins `account:{accountId}` group on connect.
- On `AllSessionsLoggedOut`, `PasswordChanged`, `AccountSuspended`, `SuspiciousTokenReuse` → broadcast `ForceLogout` to the group; Redis backplane for multi-instance consistency. Tenant-scoped groups (`SchoolId` prefix).
- Hangfire jobs per the schedule table in `notifications.md`/Section 15; `AuditRetentionEnforcer` anonymizes IP/UA past KVKK retention (default 1 year).
- Whether forced logout ships in MVP or Sprint 6 depends on TQ-auth-006.

## Acceptance Criteria
- [ ] Clients join tenant-scoped `account:{accountId}` group.
- [ ] Listed events broadcast `ForceLogout` to the correct group only.
- [ ] Multi-instance broadcast works via Redis backplane.
- [ ] No cross-tenant broadcast.
- [ ] Each Hangfire job runs on its schedule and is idempotent.
- [ ] Audit retention job anonymizes IP/UA past 1 year.

## Test Requirements
- Hub group join + targeted broadcast tests.
- Cross-tenant isolation test (no leak).
- Job unit tests (cleanup correctness, retention anonymization, idempotency).

## Dependencies
- ISSUE-05 (events), ISSUE-11 (audit), ISSUE-02 (tokens), ISSUE-13 (otp table for cleanup).

## Out of Scope
- 2FA TOTP enrollment (separate hardening task).

## Commit Requirement (ZORUNLU)

> ⚠️ Bu bölüm her generated issue'da **aynen** yer almak zorundadır. Issue tamamlandığında **ayrı bir commit** atılmadıkça issue "Done" sayılmaz.

- [ ] Issue tamamlandığında **yalnızca bu issue'a ait dosyalar** stage edilir (`git add <path>`); başka issue'ların değişiklikleri aynı commit'e karışmaz.
- [ ] Commit, **OKSİS commit kuralına** uygun formatta atılır: `YYYY-MM-DD <type>[,type]: Türkçe özet.` — kanonik kural `.claude/docs/git-commit-rules.md`.
- [ ] Issue-linked commit prefix'i kullanılır: `Issue #<no> YYYY-MM-DD <type>: ...` (issue numarası `gh issue list` veya dosya adından alınır).
- [ ] Commit **doğru repoda** atılır: API issue'ları → `oksis-api`, web issue'ları → `oksis-web`, mobile issue'ları → `oksis-mobile`. Workspace root (`oksis/`) repo'sunda **kod commit'i atılmaz**.
- [ ] Husky `commit-msg` hook (`oksis-api`) formatı zorlar; `--no-verify` **YASAK**. Hook fail olursa root cause'u düzelt, sonra yeniden commit at.
- [ ] **Bir issue = bir commit**. Aynı issue içinde test + implementation aynı commit'e girer (type: `feat,test`).
- [ ] Commit mesajının body'sinde tamamlanan Acceptance Criteria kalemleri özetlenebilir.

**Kabul edilmeyen anti-pattern'ler:** ❌ birden fazla issue'yu tek commit'te toplamak · ❌ birden fazla repoya tek summary commit · ❌ `update stuff`/`WIP`/tarihsiz mesaj · ❌ `--no-verify`.
