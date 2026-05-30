## Description
Implement `SwitchChild` (server-side session), `SwitchSeason` (new JWT), the `ChildScopeRequirement` ABAC handler, and the `ActiveSeasonWritePolicy` (Section 8.4 + 9, Senaryo 3/4).

Parent issue: `OKSMVP-1`

Repository: `farukkaya/oksis-api`

Story Points: `21`

Sprint: 4 — Child/Season Switch

## Scope
- `src/Oksis.Application/Modules/Identity/Commands/{SwitchChild,SwitchSeason}/**`
- `ChildScopeRequirement` + handler (ABAC)
- `ActiveSeasonWritePolicy`
- Child server-session in Redis (`session:{jti}:childId`)

## Implementation
- `SwitchChild`: only when `ParentProfile`; ABAC-check `childId` against `ParentStudentRelationship` flags (users read-port); deny → `403` + `PermissionDenied` audit. **JWT unchanged**; update `session:{jti}:childId` (TTL = access-token life). Publish `ChildContextSwitched`.
- `SwitchSeason`: change `activeSeasonId` → new JWT; require `seasons.view-archived` (auto for parent's own child limited history via ABAC). Publish `SeasonSwitched`.
- `ActiveSeasonWritePolicy`: if `activeSeasonId != School.CurrentSeason`, write endpoints return `403` (applied centrally, not per handler).
- `ChildScopeRequirement`: ABAC wins over RBAC on conflict (TR-auth-003).

## Acceptance Criteria
- [ ] Child switch does not change the JWT; updates Redis child session only.
- [ ] ABAC denies child access when relationship flag is false, even with RBAC permission (TR-auth-003).
- [ ] Season switch issues a new JWT and requires `seasons.view-archived`.
- [ ] Write endpoints return `403` under a non-current (read-only) season.
- [ ] Denials emit `PermissionDenied`; switches emit their events.
- [ ] Unified dashboard read contract handled when `activeChildId = null`.

## Test Requirements
- Child switch tests (ABAC allow/deny, session update, token unchanged).
- Season switch tests (new JWT, permission required).
- `ActiveSeasonWritePolicy` integration test (write blocked in past season).
- ABAC-over-RBAC precedence test.

## Dependencies
- ISSUE-07, ISSUE-08; `users` `ParentStudentRelationship` read-port.

## Out of Scope
- Profile switch (ISSUE-08).

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
