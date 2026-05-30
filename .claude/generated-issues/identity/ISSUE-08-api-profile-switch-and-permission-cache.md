## Description
Implement `SwitchProfile`, the Redis permission cache (build/invalidate), `perms_ver` bumping, and the RBAC authorization handler (Section 8 + 9 + 18.2).

Parent issue: `OKSMVP-1`

Repository: `farukkaya/oksis-api`

Story Points: `21`

Sprint: 3 — Profile Switch

## Scope
- `src/Oksis.Application/Modules/Identity/Commands/SwitchProfile/**`
- Permission cache abstraction + Redis impl
- `PermissionRequirement` + `PermissionAuthorizationHandler` (RBAC)
- JWT claim set (`activeProfileType`, `availableProfiles`, `perms_ver`)

## Implementation
- `SwitchProfile`: validate `target ∈ availableProfiles` (JWT claim) else `400`; rebuild context (child re-resolution when switching into Parent); invalidate old permission cache key + rebuild new; `perms_ver++`; issue new JWT; `RecordActiveProfile` persist; publish `ProfileSwitched`.
- Permission cache key `permissions:{accountId}:{profileType}:{seasonId}`, TTL ~30 min; invalidation is idempotent.
- RBAC handler reads effective permissions from cache (miss → rebuild from `permissions` module).
- Permission list is NOT embedded in JWT; only `perms_ver` (TQ-auth-002 default).

## Acceptance Criteria
- [ ] Switch to a non-available profile returns `400`.
- [ ] Old cache key invalidated and new key rebuilt on switch.
- [ ] `perms_ver` increments and new JWT is issued.
- [ ] `RecordActiveProfile` persisted; `ProfileSwitched` audited.
- [ ] RBAC handler resolves from cache; cache-hit authorization < 5ms (no DB hit).
- [ ] Invalidation is idempotent (repeat call safe).

## Test Requirements
- Switch handler tests (valid/invalid target, cache invalidate+rebuild).
- **Integration test for cache invalidation (ZORUNLU — en kritik risk).**
- RBAC authorization handler tests (allow/deny, cache miss rebuild).

## Dependencies
- ISSUE-07 (context resolution), ISSUE-04 (token issue), `permissions` module effective-permission source.

## Out of Scope
- Child/season switch (ISSUE-09).

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
