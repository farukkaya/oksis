## Description
Add EF Core persistence for `identity.accounts` and `identity.refresh_tokens`, migrations, and secure password/token hashing services (Section 11 + 12).

Parent issue: `OKSMVP-1`

Repository: `farukkaya/oksis-api`

Story Points: `21`

Sprint: 1 — Auth Foundation

## Scope
- `src/Oksis.Infrastructure/Persistence/Configurations/Identity/**`
- `src/Oksis.Infrastructure/Identity/**` (hashing)
- DbSet registrations + migration for `accounts`, `refresh_tokens`
- `IPasswordHasher` (Argon2id) + token hasher

## Implementation
- Map `Account` and `RefreshToken` with Fluent API only (no attributes), enums as strings with explicit lengths.
- `accounts`: `ux_accounts_person` unique, `ix_accounts_school`, `row_version` for optimistic concurrency. No cross-module FK on `person_id`/`school_id`.
- `refresh_tokens`: FK to accounts, `ix_rt_account_active` (filtered `revoked_at IS NULL`), `ix_rt_token_hash`.
- Implement `IPasswordHasher` with Argon2id (per TQ-auth-003 decision) and a token hashing utility; refresh/reset tokens stored only as hash.
- Wire tenant interceptor so `Account.SchoolId` is auto-filled and immutable.

## Acceptance Criteria
- [ ] Migration creates `identity.accounts` and `identity.refresh_tokens` as documented in `database-schema.md`.
- [ ] `person_id` is unique per account; no FK to users.
- [ ] Tenant indexes start with `school_id` where applicable.
- [ ] Refresh token is persisted only as hash (no plain column).
- [ ] Password hash uses the algorithm decided in TQ-auth-003.
- [ ] EF configurations use no attributes.
- [ ] `Account.SchoolId` is immutable via interceptor.

## Test Requirements
- Migration smoke test against the integration test database.
- Persistence tests for unique constraints (`person`, token hash).
- Test proving no plain token/password is persisted.
- Round-trip hash/verify unit tests.

## Dependencies
- ISSUE-01 Account domain model.
- TQ-auth-003 (hash algorithm + params).

## Out of Scope
- API endpoints.
- password_reset / otp tables (ISSUE-10 / ISSUE-13).

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
