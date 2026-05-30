## Description
Implement `IIdentifierResolver` / `IPersonDirectory` read-port that resolves login/recovery identifiers via the `users` module and the `LinkedAccountId` bridge (Section 2 + 4).

Parent issue: `OKSMVP-1`

Repository: `farukkaya/oksis-api`

Story Points: `13`

Sprint: 2 — Context Resolution

## Scope
- `src/Oksis.Application/Modules/Identity/Abstractions/IIdentifierResolver.cs`, `IPersonDirectory`
- `src/Oksis.Infrastructure/Identity/PersonDirectory*` (read-port impl over `IUsersReadFacade`)
- Identifier normalization (email lower, phone E.164, TCKN tenant-salted hash)

## Implementation
- Define `IIdentifierResolver` with `Classify`, `FindForLoginAsync` (Email/Phone only — TCKN → `Rejected`), `FindForRecoveryAsync` (Email/Phone/TCKN).
- Define `PersonContextView` minimal read-model (PersonId, LinkedAccountId, LifecycleState, Profiles, LastActiveProfileHint).
- Implement over the `users` read facade; do not reference Users domain/EF types directly (TR-auth-001).
- Implement normalization helpers; TCKN compared via `NationalIdHash(value, tenantSalt)` — plain TCKN never travels or persists.

## Acceptance Criteria
- [ ] `FindForLoginAsync` rejects TCKN at the type level (TR-auth-002).
- [ ] Lookup goes through `users.persons` → `LinkedAccountId`, never directly on accounts (TR-auth-001).
- [ ] Email compared lower-cased; phone normalized to E.164.
- [ ] Recovery resolves TCKN via tenant-salted hash.
- [ ] No concrete Users domain/EF type leaks into Identity.
- [ ] `LinkedAccountId == null` yields a not-found result (uniform), not an exception.

## Test Requirements
- Unit tests for `Classify` across email/phone/TCKN/unknown.
- Unit tests: login rejects TCKN; recovery accepts TCKN hash.
- Normalization tests (phone/email/TCKN).
- Architecture test: Identity does not depend on Users domain types.

## Dependencies
- `users` read facade (`IUsersReadFacade`) availability (coordinate with OKSMVP-2).

## Out of Scope
- Login handler orchestration (ISSUE-04).
- Context resolution (ISSUE-07).

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
