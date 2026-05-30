## Description
Implement multi-channel Forgot/Reset/Change password flows with enumeration protection and session invalidation (Section 5 + 12, TR-auth-008).

Parent issue: `OKSMVP-1`

Repository: `farukkaya/oksis-api`

Story Points: `13`

Sprint: 5 — OTP + Forgot

## Scope
- `src/Oksis.Application/Modules/Identity/Commands/{ForgotPassword,ResetPassword,ChangePassword}/**`
- `identity.password_reset_tokens` table + config + migration
- Channel selection (Email/Sms) via existing notification/email port

## Implementation
- `ForgotPassword`: resolve via `FindForRecoveryAsync` (Email/Phone/TCKN), pick channel, issue single-use short-lived (30 min) reset token (hashed), publish `PasswordResetRequested`. Always return uniform `202` (no channel leak).
- `ResetPassword`: validate token (single-use, not expired), set new hash via policy, revoke all sessions; `204`.
- `ChangePassword`: verify current password, apply policy, on success clear `RequirePasswordChange` and revoke all refresh tokens.
- Reset tokens stored hashed; consumed-once enforced.

## Acceptance Criteria
- [ ] Forgot returns uniform `202` regardless of identifier existence.
- [ ] Reset token is single-use, short-lived, stored hashed.
- [ ] Successful reset/change revokes all sessions.
- [ ] Change password validates current password and policy.
- [ ] `RequirePasswordChange` flow honored.
- [ ] Channel selection (Email/Sms) works without leaking which was used.

## Test Requirements
- Handler tests for forgot/reset/change (happy + invalid/expired token).
- Enumeration-safety test (uniform 202).
- Session-revocation-on-reset test.

## Dependencies
- ISSUE-03 (recovery resolver), ISSUE-05 (session revoke), ISSUE-02.

## Out of Scope
- OTP login (ISSUE-13).

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
