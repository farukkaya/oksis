## Description
Implement the web auth data layer, login flow, and single-flight token refresh interceptor (Section 8 + 10, ui-flows.md).

Parent issue: `OKSMVP-1`

Repository: `farukkaya/oksis-web`

Story Points: `21`

Sprint: 1 — Auth Foundation

## Scope
- `src/modules/identity/**` (api, hooks, schemas, types, store)
- `LoginPage` + route guards per portal
- Axios single-flight refresh interceptor
- Zustand `auth` store (token/identity), React Query auth hooks

## Implementation
- `useLogin` mutation + RHF/Zod login form (identifier, password). Map `200`/`409`/`403`/`401`/`429` to the documented UX.
- Single-flight refresh interceptor: on `401`, refresh once; concurrent requests await the same refresh; failure → login.
- Access token in-memory; refresh token via httpOnly cookie (`RefreshTokenCookie` contract).
- Portal route guards based on resolved context (`activeProfileType`).
- Skeletons for loading (no spinners); i18n keys for all strings.

## Acceptance Criteria
- [ ] Login routes by resolved context to the correct portal.
- [ ] `409 NEEDS_PROFILE_SELECTION` routes to profile selection.
- [ ] `403 ACCOUNT_SUSPENDED` shows explanatory message + contact.
- [ ] `401` shows uniform error; `429` shows throttle message.
- [ ] Single-flight refresh: concurrent 401s trigger exactly one refresh.
- [ ] TCKN entry blocked client-side with a clear message.
- [ ] No hardcoded Turkish strings; skeletons used for loading.

## Test Requirements
- Vitest: login mutation states, error mapping.
- Interceptor test: concurrent 401s → single refresh.
- Route-guard tests.

## Dependencies
- Backend `/auth/login`, `/auth/refresh`, `/auth/me/context` (ISSUE-04/05/07).

## Out of Scope
- Switch UI (ISSUE-16).
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
