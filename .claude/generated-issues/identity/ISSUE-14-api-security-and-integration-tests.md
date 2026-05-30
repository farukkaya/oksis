## Description
Build the Identity security and integration test suite covering enumeration, lockout, token reuse, permission-cache invalidation, ABAC, read-only season, and cross-tenant isolation (Section 17 + 20, DoD Section 23).

Parent issue: `OKSMVP-1`

Repository: `farukkaya/oksis-api`

Story Points: `21`

Sprint: cross-cutting

## Scope
- `tests/Oksis.Infrastructure.IntegrationTests/Identity/**`
- `tests/Oksis.Application.UnitTests/Identity/**` (gap coverage)
- Security regression scenarios

## Implementation
- Enumeration protection: uniform `401`, constant-time behavior for absent accounts.
- Lockout/brute-force thresholds and rate-limit behavior.
- Refresh reuse detection (replay → full revoke + audit).
- **Permission cache invalidation on switch (en kritik — ZORUNLU).**
- ABAC denial (boşanmış veli), ABAC-over-RBAC precedence.
- `ActiveSeasonWritePolicy` blocks writes in past season.
- Cross-tenant isolation: cache keys, SignalR groups, queries are tenant-scoped; no leakage.
- Token/log PII masking assertions.

## Acceptance Criteria
- [ ] Enumeration test passes (uniform error, timing-safe).
- [ ] Lockout + rate-limit integration tests pass.
- [ ] Token reuse detection integration test passes.
- [ ] Permission cache invalidation integration test passes.
- [ ] ABAC deny + precedence tests pass.
- [ ] Read-only season write-block test passes.
- [ ] Cross-tenant isolation tests pass (no cross-school leak).

## Test Requirements
- This issue **is** the test suite; coverage spans the scenarios above.
- Must run green in CI (`dotnet test`).

## Dependencies
- ISSUE-04…12 (features under test). Can land incrementally per feature.

## Out of Scope
- Web/mobile tests (covered in their issues).

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
