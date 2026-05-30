## Description
Add the `OtpChallenge` skeleton, `ISmsSender` port, and OTP login request/verify endpoints (activation-ready for Sprint 5), plus 2FA groundwork (Section 3.3, 4.2, 22).

Parent issue: `OKSMVP-1`

Repository: `farukkaya/oksis-api`

Story Points: `13`

Sprint: 5 — OTP + Forgot

## Scope
- `src/Oksis.Domain/Modules/Identity/Entities/OtpChallenge.cs`
- `identity.otp_challenges` table + config + migration
- `src/Oksis.Application/Modules/Identity/Commands/{RequestLoginOtp,VerifyLoginOtp}/**`
- `ISmsSender` port + Redis OTP challenge store

## Implementation
- `OtpChallenge` entity: `CodeHash`, `Purpose (Login/Reset)`, `Attempts`, `ExpiresAt`.
- `RequestLoginOtp`/`VerifyLoginOtp` commands (skeleton, feature-flagged off by default), with OTP rate limit + attempt counter (anti sim-swap, Section 20).
- Redis OTP challenge key `otp:{purpose}:{challengeId}` with TTL.
- `ISmsSender` abstraction (no concrete provider required yet).
- Keep `TwoFactorEnabled` plumbing on `Account` ready for Sprint 6 TOTP.

## Acceptance Criteria
- [ ] `OtpChallenge` table created; codes stored hashed.
- [ ] OTP request/verify endpoints exist behind a feature flag (off by default).
- [ ] OTP rate limit + attempt counter enforced.
- [ ] `ISmsSender` port defined; no plain code logged.
- [ ] 2FA fields on `Account` wired but inactive.

## Test Requirements
- Entity/store unit tests (hash, expiry, attempts).
- Request/verify handler tests (rate limit, wrong code, expiry).
- Feature-flag-off test (endpoints inert).

## Dependencies
- ISSUE-01, ISSUE-02.

## Out of Scope
- Full TOTP enrollment + enforcement (Sprint 6).
- SMS provider integration.

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
