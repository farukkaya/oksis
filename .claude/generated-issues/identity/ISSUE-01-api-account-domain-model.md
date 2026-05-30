## Description
Implement the Identity `Account` aggregate domain model: authentication/session ownership entity, value objects, enums, and domain events, per the technical analysis (Section 3).

Parent issue: `OKSMVP-1`

Repository: `farukkaya/oksis-api`

Story Points: `21`

Sprint: 1 — Auth Foundation

## Scope
- `src/Oksis.Domain/Modules/Identity/**`
- Aggregate: `Account` (tenant entity, owns auth + session state)
- Child entity: `RefreshToken` (under Account)
- Value objects: `AccountId`, `Identifier`, `NationalIdHash`, `PasswordHash`
- Enums: `IdentifierType`, `LoginFailureReason`, `LogoutReason`
- Domain events listed in `.claude/docs/modules/identity/domain-model.md`

## Implementation
- Add `Account` as tenant aggregate root with private setters and factory method; `PersonId`/`SchoolId` are reference Ids (no cross-module FK).
- Implement behaviors: `RegisterSuccessfulLogin`, `RegisterFailedLogin`, `IsCurrentlyLocked`, `Unlock`, `ChangePassword`, `RecordActiveProfile`, `RecordActiveChild`.
- Password verification stays out of the domain (called via `IPasswordHasher` port in Application).
- Add `RefreshToken` entity with rotation chain fields (`ReplacedByTokenHash`) and revoke fields.
- Emit domain events (`LoginSucceeded`, `LoginFailed`, `AccountLocked`, `PasswordChanged`, switch events, `SuspiciousTokenReuse`, etc.) as MediatR `INotification`, carrying no infrastructure types.
- **Reconciliation:** Resolve `Account` vs existing `User` per `open-questions.md` OQ-identity-001 before implementing; document the chosen path in `completion_status.md`.

## Acceptance Criteria
- [ ] `Account` has private setters; state changes only through behaviors.
- [ ] `RegisterFailedLogin` increments counter and locks when threshold is crossed, emitting `AccountLocked`.
- [ ] `ChangePassword` clears `RequirePasswordChange` and signals refresh-token revocation.
- [ ] TCKN plain value is never stored on `Account`.
- [ ] Domain layer contains no EF Core attributes or DataAnnotations.
- [ ] Domain events carry no infrastructure types.
- [ ] OQ-identity-001 decision is recorded in `completion_status.md`.

## Test Requirements
- Unit tests for all `Account` behaviors (success/fail/lock/unlock/change-password).
- Unit tests for value object normalization/validation (`Identifier`, `PasswordHash`).
- Unit tests for domain event emission.

## Dependencies
- OQ-identity-001 decision (Account vs User).

## Out of Scope
- EF Core mappings and migrations (ISSUE-02).
- Login/refresh handlers (ISSUE-04/05).

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
