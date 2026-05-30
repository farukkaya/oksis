## Description
Implement the mobile auth flow (login, secure-store refresh, forced logout) and profile/child/season switching (ui-flows.md, Section 8 + 14).

Parent issue: `OKSMVP-1`

Repository: `farukkaya/oksis-mobile`

Story Points: `13`

Sprint: 1 / 4 — Auth + Switch (mobile)

## Scope
- `src/modules/identity/**` + `src/app/index.tsx` (auth wiring)
- `useAuthStore` integration in `RootNavigator`
- Switchers in role stacks (Teacher/Parent/Student)

## Implementation
- Login screen + `useLogin`; access token in-memory, refresh token in `expo-secure-store` (never AsyncStorage).
- Single-flight refresh; `RootNavigator` selects stack by `useAuthStore.user.role`/active profile.
- Profile/child/season switchers (≤2 taps); child switch updates context without re-login.
- SignalR `ForceLogout` handling → clear token, return to auth stack.
- NativeWind `className` (no `StyleSheet.create`); `FlatList`/`FlashList` for lists; i18n keys; tenant-scoped React Query keys (`tenantScopedKey`).

## Acceptance Criteria
- [ ] Refresh token stored in `expo-secure-store`; access token in-memory only.
- [ ] Stack selection follows active profile/role.
- [ ] Child switch updates context without a full re-login.
- [ ] Forced logout returns to the auth stack and clears tokens.
- [ ] No `StyleSheet.create`, no AsyncStorage for tokens, no `any`.
- [ ] React Query keys are tenant-scoped.

## Test Requirements
- Jest: login flow, secure-store refresh, stack selection.
- Switch flow tests; forced-logout handling test.

## Dependencies
- Backend auth + switch endpoints (ISSUE-04/05/07/08/09); ISSUE-12 (forced logout) optional per TQ-auth-006.

## Out of Scope
- Password recovery mobile screens (future).

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
