## Description
Implement refresh token rotation with reuse detection, logout, logout-all, and access-token blacklist (Section 8.2 + 8.3).

Parent issue: `OKSMVP-1`

Repository: `farukkaya/oksis-api`

Story Points: `21`

Sprint: 1 — Auth Foundation

## Scope
- `src/Oksis.Application/Modules/Identity/Commands/{RefreshToken,Logout,LogoutAllSessions}/**`
- Access-token blacklist (Redis) + authorization middleware `jti` check
- Refresh rotation + reuse detection logic

## Implementation
- `RefreshToken` command: validate token hash, rotate (revoke old, issue new, set `ReplacedByTokenHash`).
- **Reuse detection:** if a revoked token is replayed → revoke all account refresh tokens + publish `SuspiciousTokenReuse` (+ optional SignalR forced logout hook).
- `Logout`: revoke the current refresh token + blacklist access-token `jti` in Redis (`blacklist:jti:{jti}`, TTL = remaining token life ≤ 15 min).
- `LogoutAllSessions`: revoke all refresh tokens; publish `AllSessionsLoggedOut`.
- Authorization middleware checks `jti` against blacklist on every request.

## Acceptance Criteria
- [ ] Each refresh rotates the token and records the replacement chain.
- [ ] Replaying a revoked token revokes the whole chain and audits `SuspiciousTokenReuse`.
- [ ] Logout blacklists the access-token `jti` with TTL ≤ remaining life.
- [ ] Blacklisted `jti` is rejected by middleware.
- [ ] LogoutAll revokes all refresh tokens and emits the event.
- [ ] Refresh tokens compared/stored as hash only.

## Test Requirements
- Rotation tests (old revoked, new issued, chain set).
- Reuse-detection integration test (replay → full revoke + audit).
- Blacklist middleware test (blacklisted jti → 401).
- LogoutAll test.

## Dependencies
- ISSUE-01, ISSUE-02.

## Out of Scope
- SignalR hub implementation (ISSUE-12) — only the publish hook here.

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
