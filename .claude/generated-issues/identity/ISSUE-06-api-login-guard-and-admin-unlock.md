## Description
Implement `ILoginGuard` (lockout + rate limiting via Redis), brute-force protection, and the admin unlock endpoint (Section 12, TR-auth-007).

Parent issue: `OKSMVP-1`

Repository: `farukkaya/oksis-api`

Story Points: `13`

Sprint: 1 — Auth Foundation

## Scope
- `src/Oksis.Application/Modules/Identity/Abstractions/ILoginGuard.cs` + Redis impl
- `src/Oksis.Application/Modules/Identity/Commands/AdminUnlockAccount/**`
- ASP.NET Core Rate Limiting on the anonymous login endpoint

## Implementation
- `ILoginGuard.Check(accountKey, ip)` with Redis sliding-window counters (`login:fail:{accountId}`, `login:fail:ip:{ip}`).
- Staged lockout 5/10/20; on threshold persist `locked_until` on the account (DB backup of the Redis value).
- Rate limiting per IP / per identifier per TQ-auth-007 decision.
- `AdminUnlockAccount` command: clears lockout (DB + Redis), requires `accounts.unlock` permission, audits.

## Acceptance Criteria
- [ ] Failed attempts increment Redis counters and lock at 5/10/20.
- [ ] Locked account returns uniform failure (no enumeration leak).
- [ ] `locked_until` persisted to DB for admin visibility.
- [ ] Anonymous login endpoint is rate-limited.
- [ ] Admin unlock clears DB + Redis state and requires `accounts.unlock`.
- [ ] Unlock and lockout events are audited.

## Test Requirements
- Login guard unit tests (threshold transitions, window expiry).
- Rate-limit integration test.
- Admin unlock handler test (permission + state clear).

## Dependencies
- ISSUE-01, ISSUE-02.

## Out of Scope
- Login handler (ISSUE-04) — guard is consumed there.

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
