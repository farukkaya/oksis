## Description
Implement the web context switchers (profile / child / season) and the profile selection screen (ui-flows.md, Section 7 + 8).

Parent issue: `OKSMVP-1`

Repository: `farukkaya/oksis-web`

Story Points: `21`

Sprint: 3–4 — Profile / Child / Season Switch

## Scope
- `src/modules/identity/components/**` (switchers, profile-select)
- Zustand `activeChild`, `activeSeason` stores
- React Query hooks: `useAvailableContexts`, switch mutations

## Implementation
- Profile selection screen consuming `availableProfiles`; selecting calls `/auth/switch-profile`, stores the new JWT, routes to the portal (e.g. `/teacher/*` ↔ `/parent/*`) and invalidates React Query cache.
- Child switcher (Parent only) → `/auth/switch-child`; token unchanged, update `activeChild` store + React Query keys; include "Tümü" (unified dashboard) option.
- Season switcher → `/auth/switch-season`; on past season show read-only banner and disable write actions.
- All server state in React Query (never duplicated to Zustand); URL/search-param state for filters where relevant.

## Acceptance Criteria
- [ ] Profile switch re-routes to the correct portal and invalidates cache.
- [ ] Child switch updates context without a full re-login; "Tümü" yields unified dashboard.
- [ ] Season switch shows read-only banner and disables writes for past seasons.
- [ ] Switch failures (`400`/`403`) surface clear i18n messages.
- [ ] No hardcoded Turkish strings; skeletons for loading.

## Test Requirements
- Vitest: switcher mutation states + cache invalidation.
- Read-only banner rendering for past season.
- "Tümü" unified-dashboard branch test.

## Dependencies
- ISSUE-15 (auth data layer); backend switch endpoints (ISSUE-08/09).

## Out of Scope
- Password recovery UI (ISSUE-17).

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
