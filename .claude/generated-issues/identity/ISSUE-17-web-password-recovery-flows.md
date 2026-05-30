## Description
Implement the web Forgot / Reset / Change password flows (ui-flows.md, Section 5).

Parent issue: `OKSMVP-1`

Repository: `farukkaya/oksis-web`

Story Points: `13`

Sprint: 5 — OTP + Forgot

## Scope
- `src/modules/identity/**` (recovery pages, hooks, schemas)
- Routes: `/forgot-password`, `/reset-password`, `/change-password`

## Implementation
- Forgot form (identifier) → `/auth/forgot-password`; always show uniform success message (no channel leak).
- Reset page consumes token from URL → `/auth/reset-password`; on success redirect to login (all sessions dropped).
- Change-password form (current + new) → `/auth/change-password`; handle `RequirePasswordChange` forced flow after login.
- RHF/Zod validation (password policy mirrored client-side as UX only — server is source of truth).

## Acceptance Criteria
- [ ] Forgot shows uniform success regardless of identifier.
- [ ] Reset with invalid/expired token shows clear error.
- [ ] Successful reset/change redirects to login.
- [ ] `RequirePasswordChange` forces the change flow post-login.
- [ ] No hardcoded Turkish strings; Zod validation present.

## Test Requirements
- Vitest: forgot/reset/change form states + error mapping.
- Forced-change flow test.

## Dependencies
- Backend recovery endpoints (ISSUE-10); ISSUE-15 (auth layer).

## Out of Scope
- OTP login UI (future).

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
