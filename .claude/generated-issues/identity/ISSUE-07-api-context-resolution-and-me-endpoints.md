## Description
Implement `IContextResolver` and the `/auth/me/context` + `/auth/me/available-contexts` endpoints (Section 7).

Parent issue: `OKSMVP-1`

Repository: `farukkaya/oksis-api`

Story Points: `13`

Sprint: 2 — Context Resolution

## Scope
- `src/Oksis.Application/Modules/Identity/Abstractions/IContextResolver.cs` + impl
- `src/Oksis.Application/Modules/Identity/Queries/{GetCurrentContext,GetAvailableContexts}/**`
- `ResolvedContext`, `ContextView`, `AvailableContextsView` DTOs
- Lifecycle + consent gates (read-port consumers)

## Implementation
- `IContextResolver.ResolveAsync(personId, schoolId, ct)` returns `ResolvedContext(ActiveProfileType, ActiveChildId?, ActiveSeasonId, NeedsProfileSelection)`.
- Profile: list valid profiles for active season; 1 → auto; `LastActiveProfileType` if present; else `NeedsProfileSelection=true`.
- Child: only when `ParentProfile`; single → auto; valid `LastActiveChildId` → that; multiple + no hint → `null` (unified dashboard).
- Season: default `School.CurrentSeason`.
- `GetCurrentContext` / `GetAvailableContexts` queries read from the token + users read-port.
- Implement `IConsentGate` and lifecycle gate consumers used by login (Section 12).

## Acceptance Criteria
- [ ] Single profile auto-selected; unknown last-active → `NeedsProfileSelection`.
- [ ] Parent with multiple children + no hint → `ActiveChildId = null`.
- [ ] Default season is `School.CurrentSeason`.
- [ ] `/me/context` and `/me/available-contexts` return correct shapes.
- [ ] Consent gate denies when `DataProcessing != Granted` or bundle version mismatch.
- [ ] ResolveContext runs once per login/switch (no N+1 to read-port).

## Test Requirements
- Unit tests for each resolution branch (profile/child/season).
- Query handler tests for both `/me` endpoints.
- Consent/lifecycle gate tests.

## Dependencies
- ISSUE-03 (read-port), ISSUE-01/02.

## Out of Scope
- Switch handlers (ISSUE-08/09).
- Permission cache build (ISSUE-08).

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
