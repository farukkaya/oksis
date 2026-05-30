## Description
Implement audit logging for all authentication/switch domain events via Serilog → Elasticsearch, with identifier/TCKN masking (Section 13).

Parent issue: `OKSMVP-1`

Repository: `farukkaya/oksis-api`

Story Points: `13`

Sprint: 1 — Auth Foundation (cross-cutting)

## Scope
- `src/Oksis.Application/Modules/Identity/Events/**` (MediatR notification handlers)
- Serilog enrichers / Elasticsearch sink config
- Masking utilities for identifier/TCKN

## Implementation
- Notification handler per domain event (`LoginSucceeded/Failed`, `AccountLocked`, `PasswordResetRequested/Changed`, `ProfileSwitched`, `ChildContextSwitched`, `SeasonSwitched`, `LoggedOut`, `AllSessionsLoggedOut`, `SuspiciousTokenReuse`, `PermissionDenied`, `LoginBlockedDueToSuspension`) writing structured audit to Elasticsearch.
- Every log carries `CorrelationId`, `SchoolId`, `AccountId`, `Channel`.
- Mask identifier and TCKN (`a***@x.com`, `+90••••••12`); never log plain PII.
- No `Console.WriteLine` anywhere.

## Acceptance Criteria
- [ ] Each listed domain event produces a structured audit record.
- [ ] Logs include correlation/tenant/account/channel fields.
- [ ] Identifier and TCKN are masked in all log output.
- [ ] No plain PII appears in logs or audit.
- [ ] No `Console.WriteLine` usage.

## Test Requirements
- Handler tests asserting audit record shape per event.
- Masking unit tests (email/phone/TCKN).
- Test that error logs include exception detail but masked identifiers.

## Dependencies
- ISSUE-01 (domain events). Other slices publish events consumed here.

## Out of Scope
- SignalR forced logout (ISSUE-12).

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
