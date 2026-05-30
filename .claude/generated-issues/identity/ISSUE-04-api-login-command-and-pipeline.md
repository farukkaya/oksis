## Description
Implement the `Login` command/handler orchestrating the full authentication flow, plus the MediatR pipeline behaviors (Section 5 + 6 + 18.1).

Parent issue: `OKSMVP-1`

Repository: `farukkaya/oksis-api`

Story Points: `21`

Sprint: 1 — Auth Foundation

## Scope
- `src/Oksis.Application/Modules/Identity/Commands/Login/**`
- `src/Oksis.Application/Common/Behaviors/**` (Correlation, Validation, Performance, UnitOfWork)
- `AuthResult` response DTO + Mapster mapping

## Implementation
- Implement `LoginCommand` + handler with the ordered flow: guard → `FindForLoginAsync` → uniform fail on null `LinkedAccountId` → password verify → lifecycle gate → consent gate → policy gate → `ResolveContext` → permission cache build → token issue + `RegisterSuccessfulLogin` → publish `LoginSucceeded`.
- FluentValidation validator (non-empty identifier, password min length, channel).
- Pipeline behaviors: `CorrelationLoggingBehavior`, `ValidationBehavior`, `PerformanceBehavior` (>500ms warn), `UnitOfWorkBehavior` (commands only, SaveChanges + domain event dispatch in one transaction).
- Constant-time dummy hash verification when account is absent (timing-attack protection).
- Structured logging with masked identifier + correlationId at each step; `Console.WriteLine` forbidden.
- Return `409 NEEDS_PROFILE_SELECTION` and `403 ACCOUNT_SUSPENDED` per error policy (TR-auth-004).

## Acceptance Criteria
- [ ] Uniform `401` for not-found / null-link / bad-password (TR-auth-004).
- [ ] Suspended/Archived/Transferred with correct password → `403 ACCOUNT_SUSPENDED`.
- [ ] Constant-time dummy hash runs when account is absent.
- [ ] `NeedsProfileSelection` returns `409` with `availableProfiles`.
- [ ] `Result<AuthResult>` flow (no exception-driven control).
- [ ] Pipeline runs in documented order; UoW behavior no-ops on queries.
- [ ] Each log line carries correlationId and masked identifier.

## Test Requirements
- Handler tests: happy path, not-found, bad-password, suspended, needs-profile-selection.
- Validator tests.
- Behavior tests (validation short-circuit, UoW transaction boundary).

## Dependencies
- ISSUE-01, ISSUE-02, ISSUE-03, ISSUE-06 (login guard), ISSUE-07 (context resolver), ISSUE-08 (permission cache build) — coordinate sequencing or stub ports.

## Out of Scope
- Refresh/logout (ISSUE-05).
- Switch endpoints (ISSUE-08/09).

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
