# Legacy User Emeklilik — Faz 0+1 (Taban + Login/Refresh) Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Legacy User-tabanlı `/auth/login|refresh|revoke` uçlarını ve istemcilerdeki legacy fallback'leri kalıntısız kaldırmak; öncesinde `identity-invite-accept-route` branch'ini merge edip dev DB'yi reseed etmek.

**Architecture:** Silme + repoint aynı fazda (Yaklaşım A). Account akışı (`/auth/account/*`) zaten tek canlı yol; bu faz yalnız ölü legacy yüzeyi kaldırır. Paylaşılan altyapı (`RefreshTokenCookie`, `RefreshTokenBody`/`RevokeTokenBody`, `IJwtTokenService`, `IRefreshTokenStore`, `PermissionReader` legacy fallback) **bu fazda DOKUNULMAZ** (amendman sınırları).

**Tech Stack:** .NET 10 (MediatR/CQRS), React+Vite+vitest+MSW, Expo RN+jest.

## Global Constraints

- Spec: `.claude/specs/legacy-user-emeklilik-design.md` (amendmanlı) — bağlayıcı; sapma önce kullanıcıya sorulur.
- **Faz sınırı (ASLA silme/değiştirme):** `RefreshTokenCookie.cs`, `RefreshTokenBody`, `RevokeTokenBody`, `IsMobileClient()`, `IJwtTokenService`+`JwtTokenService` (Faz 3), `PermissionReader.cs` legacy `permissions` fallback'i (Faz 3), `IRefreshTokenStore`+`RefreshTokenStore`+`InMemoryRefreshTokenStore` (Faz 4).
- Commit formatı: **oksis-api + oksis-web** → OKSİS formatı `YYYY-MM-DD <type>: Türkçe özet.` (api'de husky commit-msg hook'u zorlar); **oksis-mobile** → Conventional Commits, İngilizce, scope zorunlu (mobil CLAUDE.md).
- Her commit'e ekle: `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`
- oksis-api: commit öncesi `dotnet format`. Yeni kütüphane eklenmez. `any` yasak (web/mobile).
- Branch adı (üç repoda): `legacy-user-faz1-login`. PR'lar faz sonunda birlikte merge edilir.
- Bugünün tarihi commit önekleri için: **2026-07-02** (gün değiştiyse gerçek tarihi kullan).

---

## Faz 0

### Task 0: `identity-invite-accept-route` merge + dev reseed

**Files:**
- Repo: `oksis-web` (merge only), `oksis-api` (DB komutları — kod değişikliği yok)

**Interfaces:**
- Produces: master'da `/invite/:token` public route'u; taze seed'li dev DB (yalnız Account/Person modeli, legacy `identity.users` boş).

- [ ] **Step 1: Branch'i doğrula ve merge et**

```bash
cd /Users/farukkaya/Projects/oksis/oksis-web
git checkout master && git pull origin master
git log --oneline identity-invite-accept-route -3   # ca498d2 görünmeli
git merge --no-ff identity-invite-accept-route -m "2026-07-02 feat: Davet kabul /invite/:token public route fix master'a merge edildi (identity-invite-accept-route, E2E onaylı).

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```
Expected: fast-forward olmayan merge commit'i, conflict yok. Conflict çıkarsa DUR ve kullanıcıya bildir.

- [ ] **Step 2: Web test + build doğrula**

Run: `npm run test && npm run build`
Expected: vitest PASS (bilinen pre-existing fail'ler hariç — yeni fail olmamalı), build yeşil.

- [ ] **Step 3: Push**

Run: `git push origin master`

- [ ] **Step 4: Dev DB reseed**

```bash
cd /Users/farukkaya/Projects/oksis/oksis-api
docker compose up -d
dotnet ef database drop -f --project src/Oksis.Infrastructure --startup-project src/Oksis.Api
dotnet ef database update --project src/Oksis.Infrastructure --startup-project src/Oksis.Api
```
Expected: drop + tüm migration'lar uygulanır, hata yok.

- [ ] **Step 5: API'yi başlat, seed'i ve account login'i doğrula**

```bash
dotnet run --project src/Oksis.Api
```
Seeder startup'ta koşar. Seed kimlik bilgisi için `src/Oksis.Infrastructure/Persistence/Seed/IdentityDevSeeder.cs` içindeki sabit e-posta/parolaları oku (SchoolAdmin hesabı). Ayrı terminalde:

```bash
curl -s -X POST http://localhost:5000/api/v1/auth/account/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"<seed-admin-email>","password":"<seed-parola>"}' | head -c 400
```
Expected: 200 + `accessToken` içeren JSON (Faz 0 smoke; port `launchSettings.json`'dan farklıysa onu kullan).

---

## Faz 1 — oksis-api

### Task 1: AuthController legacy uçlarını + `LoginBody`'yi kaldır

**Files:**
- Modify: `oksis-api/src/Oksis.Api/Controllers/V1/AuthController.cs` (LoginAsync ~52-61, RefreshAsync ~114-130, RevokeAsync ~132-146, IssueSession ~402-421)
- Modify: `oksis-api/src/Oksis.Api/Contracts/Identity/CreateUserBody.cs` (`LoginBody` record, ~20-23)

**Interfaces:**
- Consumes: —
- Produces: `AuthController`'da yalnız `/auth/account/*` + `me/*` uçları kalır. **KORUNUR:** `RefreshTokenBody` (~29), `RevokeTokenBody` (~31), `RefreshTokenCookie`, `IsMobileClient()` — account uçları kullanıyor.

- [ ] **Step 1: Branch aç**

```bash
cd /Users/farukkaya/Projects/oksis/oksis-api
git checkout -b legacy-user-faz1-login
```

- [ ] **Step 2: Controller'dan legacy metodları sil**

`AuthController.cs` içinde şu üç action metodunu attribute'larıyla birlikte komple sil: `LoginAsync` (`[HttpPost("login")]`), `RefreshAsync` (`[HttpPost("refresh")]`), `RevokeAsync` (`[HttpPost("revoke")]`). Ardından yalnız bu ikisinin kullandığı private yardımcı `IssueSession(Result<LoginResponse> ...)` metodunu sil. `AccountLoginAsync`, `AccountRefreshAsync`, `AccountLogoutAsync`, `IsMobileClient` ve tüm `RefreshTokenCookie` çağrılarına DOKUNMA. Artık kullanılmayan `using`'leri temizle (ör. `LoginResponse`/`LoginCommand` namespace'leri; `EmptyBodyBehavior` account uçlarında da geçiyor — silme).

- [ ] **Step 3: `LoginBody`'yi sil**

`CreateUserBody.cs` içindeki `LoginBody` record bloğunu (SchoolCode/Email/Password taşıyan, ~satır 20-23) sil. `RefreshTokenBody` ve `RevokeTokenBody`'ye DOKUNMA.

- [ ] **Step 4: Build**

Run: `dotnet build`
Expected: PASS (legacy command tipleri hâlâ mevcut olduğundan derleme temiz).

- [ ] **Step 5: Api testleri**

Run: `dotnet test tests/Oksis.Api.UnitTests`
Expected: PASS (AuthController route testi yok — 2026-07-02 keşfiyle doğrulandı).

- [ ] **Step 6: Commit**

```bash
dotnet format && git add -A
git commit -m "2026-07-02 refactor: Legacy /auth/login|refresh|revoke uçları ve LoginBody kaldırıldı (legacy User emeklilik Faz 1); account uçları tek yol.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 2: Legacy Login/RefreshToken/RevokeToken command dilimlerini sil

**Files:**
- Delete: `oksis-api/src/Oksis.Application/Modules/Identity/Commands/Login/` (LoginCommand.cs, LoginCommandHandler.cs, LoginCommandValidator.cs, LoginResponse.cs)
- Delete: `.../Commands/RefreshToken/` (RefreshTokenCommand.cs, RefreshTokenCommandHandler.cs)
- Delete: `.../Commands/RevokeToken/` (RevokeTokenCommand.cs, RevokeTokenCommandHandler.cs)
- Delete: `oksis-api/tests/Oksis.Application.UnitTests/Modules/Identity/Commands/LoginCommandHandlerTests.cs`

**Interfaces:**
- Consumes: Task 1 (controller referansları silinmiş olmalı — aksi halde build kırılır).
- Produces: `LoginResponse` tipi API'den tamamen kalkar. **KORUNUR:** `IJwtTokenService`, `IRefreshTokenStore` (diğer tüketiciler: AcceptInvitation, ConfirmPasswordReset, ChangePassword, SoftDeleteUser).

- [ ] **Step 1: Klasörleri ve test dosyasını sil**

```bash
git rm -r src/Oksis.Application/Modules/Identity/Commands/Login \
          src/Oksis.Application/Modules/Identity/Commands/RefreshToken \
          src/Oksis.Application/Modules/Identity/Commands/RevokeToken
git rm tests/Oksis.Application.UnitTests/Modules/Identity/Commands/LoginCommandHandlerTests.cs
```

- [ ] **Step 2: Build — kalıntı referans avı**

Run: `dotnet build`
Expected: PASS. FAIL olursa hata veren dosya beklenmedik bir tüketicidir → DUR, dosyayı incele; `IJwtTokenService`/`IRefreshTokenStore`/`RefreshTokenCookie` kaynaklıysa Global Constraints'e göre o tipe dokunulmaz, yalnız silinen command referansı temizlenir.

- [ ] **Step 3: Tüm backend testleri**

Run: `dotnet test`
Expected: PASS (Infrastructure.IntegrationTests Docker ister; SQL container Faz 0'da ayakta).

- [ ] **Step 4: Kalıntı grep doğrulaması**

```bash
grep -rn "LoginCommand\|RevokeTokenCommand\|RefreshTokenCommand\|LoginResponse\b" src/ | grep -v AccountLogin
```
Expected: boş çıktı (yalnız `AccountLogin*` eşleşmeleri kalabilir — onlar Account akışı).

- [ ] **Step 5: Commit**

```bash
dotnet format && git add -A
git commit -m "2026-07-02 refactor: Legacy Login/RefreshToken/RevokeToken command dilimleri ve LoginResponse silindi (legacy User emeklilik Faz 1).

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Faz 1 — oksis-web

### Task 3: Single-flight testini account-only'ye çevir (kırmızı), sonra `refreshTokenManager` legacy fallback'ini sil (yeşil)

**Files:**
- Modify: `oksis-web/src/modules/identity/__tests__/refresh.single-flight.test.ts` (satır 99, 101)
- Modify: `oksis-web/src/shared/api/refreshTokenManager.ts`

**Interfaces:**
- Consumes: —
- Produces: `RefreshTokenManager.refresh(): Promise<string | null>` imzası AYNI kalır (tüketiciler: `authStore.bootstrap`, `httpClient` interceptor — dokunulmaz).

- [ ] **Step 1: Branch aç**

```bash
cd /Users/farukkaya/Projects/oksis/oksis-web
git checkout master && git pull && git checkout -b legacy-user-faz1-login
```

- [ ] **Step 2: Testten legacy MSW handler'larını kaldır (failing test)**

`refresh.single-flight.test.ts` ikinci testinde (satır 91-111) şu iki satırı sil:

```typescript
      http.post('*/api/v1/auth/refresh', () => new HttpResponse(null, { status: 401 })),
```
ve
```typescript
      http.post('*/api/v1/auth/revoke', () => HttpResponse.json({ data: null })),
```

- [ ] **Step 3: Testi çalıştır — kırmızıyı doğrula**

Run: `npx vitest run src/modules/identity/__tests__/refresh.single-flight.test.ts`
Expected: FAIL veya MSW "unhandled request POST .../auth/refresh" uyarısı/hatası — manager hâlâ legacy fallback çağırıyor. (Test yine de geçerse MSW unhandled-passthrough modundadır; Step 4 sonrası tekrar koşulduğunda davranışın korunması yeterli kanıttır — devam et.)

- [ ] **Step 4: `refreshTokenManager.ts`'i account-only yap**

Dosyanın tamamını şununla değiştir:

```typescript
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import type { AccountAuthResult } from '../../modules/identity/types/account.types';
import { applyAccountAuthResult } from '../../modules/identity/hooks/applyAccountAuthResult';

interface ApiEnvelope<T> {
  data: T;
}

/**
 * Single-flight refresh logic. Aynı anda gelen N adet 401 isteği tek bir refresh
 * çağrısı bekler; ilk refresh sonucu döndüğünde hepsi yeni access token ile retry edilir.
 *
 * Refresh token httpOnly cookie'de (oksis_rt) tutulur; `withCredentials` ile cookie
 * otomatik gönderilir, gövdeye token koymaya gerek yoktur. Sunucu yeni cookie ile
 * token'ı rotate eder. Tek yol Account akışıdır (`/auth/account/refresh`); legacy
 * `/auth/refresh` fallback'i legacy User emekliliği Faz 1'de kaldırıldı.
 */
export class RefreshTokenManager {
  private static refreshPromise: Promise<string | null> | null = null;

  public static async refresh(): Promise<string | null> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async (): Promise<string | null> => {
      const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';
      try {
        const accountResponse = await axios.post<ApiEnvelope<AccountAuthResult>>(
          `${baseUrl}/auth/account/refresh`,
          {},
          { withCredentials: true },
        );
        const store = useAuthStore.getState();
        applyAccountAuthResult(accountResponse.data.data, {
          setSession: store.setSession,
          setAccountContext: store.setAccountContext,
          setPermVersion: store.setPermVersion,
        });
        // İzin hydrate'i bu katmanda yapılmaz: izinler `/auth/me/context`'ten gelir
        // ve çağrı yerine göre farklı bağlanır — bootstrap (await ederek, route
        // guard'lar sayfa yenilemede yanlış 403 vermesin) ve mid-session 401
        // interceptor (fire-and-forget). Bkz. authStore.bootstrap + httpClient.
        return accountResponse.data.data.accessToken;
      } catch {
        return null;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }
}
```

(Silinenler: `LoginResponse` importu, `AxiosResponse` importu, `isAuthError`, `applyLegacySession`, legacy `catch` dalı.)

- [ ] **Step 5: Testi çalıştır — yeşil**

Run: `npx vitest run src/modules/identity/__tests__/refresh.single-flight.test.ts`
Expected: PASS (2 test), unhandled request uyarısı yok.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "2026-07-02 refactor,test: RefreshTokenManager legacy /auth/refresh fallback'i kaldırıldı, single-flight testi account-only yapıldı (legacy User emeklilik Faz 1).

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 4: Web kalıntı temizliği — `NO_REFRESH_PATHS`, logout dalı, `LoginResponse` tipi

**Files:**
- Modify: `oksis-web/src/shared/api/httpClient.ts` (satır 33-38)
- Modify: `oksis-web/src/shared/store/authStore.ts` (satır 120-129)
- Modify: `oksis-web/src/modules/identity/types/user.types.ts` (`LoginResponse` interface, ~224)
- Modify (yalnız yorum): `oksis-web/src/modules/identity/types/account.types.ts` (~6), `oksis-web/src/test/authFixtures.ts` (~3), `oksis-web/src/shared/hooks/__tests__/usePermission.test.tsx` (~10)

**Interfaces:**
- Consumes: Task 3 (`refreshTokenManager` artık `LoginResponse` import etmiyor — aksi halde tip silme derlemeyi kırar).
- Produces: web üretim kodunda `/auth/login`, `/auth/refresh`, `/auth/revoke` string'i ve `LoginResponse` tipi kalmaz.

- [ ] **Step 1: `NO_REFRESH_PATHS`'i sadeleştir**

`httpClient.ts` satır 33-38'i şununla değiştir:

```typescript
const NO_REFRESH_PATHS = [
  '/auth/account/login',
  '/auth/account/refresh',
];
```

- [ ] **Step 2: `authStore.logout`'u account-only yap**

Satır 120-129'daki try bloğunu şununla değiştir (`isAccount` ternary'si ve legacy `/auth/revoke` dalı kalkar):

```typescript
    try {
      const { httpClient } = await import('../api/httpClient');
      // Refresh token cookie ile otomatik gider; sunucu revoke edip cookie'yi siler.
      await httpClient.post('/auth/account/logout');
    } catch {
      // ignore
    }
```

Not: `const isAccount = get().accountContext !== null;` satırı da silinir.

- [ ] **Step 3: `LoginResponse` interface'ini sil**

`user.types.ts` ~224'teki `export interface LoginResponse { ... }` bloğunu komple sil; ~237 civarındaki `LoginResponse.Permissions` yorum referansını çevre yorumdan çıkar. `account.types.ts:6`, `authFixtures.ts:3`, `usePermission.test.tsx:10`'daki salt-yorum referanslarını "legacy LoginResponse (Faz 1'de kaldırıldı)" bağlamı kalmayacak şekilde günceller ya da yorumdan çıkarırsın — kod değişikliği yok, yalnız yorum.

- [ ] **Step 4: Tüm web testleri + build**

Run: `npm run test && npm run build`
Expected: PASS + build yeşil (pre-existing fail'ler dışında yeni fail yok). `grep -rn "'/auth/login'\|'/auth/refresh'\|'/auth/revoke'\|LoginResponse" src/` → yalnız (varsa) tarihsel yorumlar; üretim kodu eşleşmesi boş.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "2026-07-02 refactor: Web'de legacy auth kalıntıları temizlendi — NO_REFRESH_PATHS, logout /auth/revoke dalı, LoginResponse tipi (legacy User emeklilik Faz 1).

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Faz 1 — oksis-mobile

### Task 5: Cold-start'ı account refresh'e taşı, legacy `auth.api.ts`'i sil

**Files:**
- Modify: `oksis-mobile/src/features/auth/hooks/useAuthBootstrap.ts` (satır 3, 44)
- Modify: `oksis-mobile/src/shared/api/client.ts` (satır 9-12 yorum, 80-99 `refreshOnce`)
- Delete: `oksis-mobile/src/features/auth/api/auth.api.ts`
- Modify: `oksis-mobile/src/shared/types/auth.types.ts` (`BackendLoginPayload` ~60 + doc yorumu ~43)

**Interfaces:**
- Consumes: mevcut `accountApi.refresh(refreshToken: string): Promise<AccountAuthResult>` (`features/auth/api/account.api.ts:40`; `AccountAuthResult.accessToken`/`.refreshToken` alanları).
- Produces: mobil üretim kodunda `/auth/refresh` string'i ve `BackendLoginPayload` kalmaz; cold-start kurtarma account yolundan çalışır.

- [ ] **Step 1: Branch aç**

```bash
cd /Users/farukkaya/Projects/oksis/oksis-mobile
git checkout master && git pull && git checkout -b legacy-user-faz1-login
```

- [ ] **Step 2: `useAuthBootstrap`'ı account refresh'e repoint et**

Satır 3'teki importu değiştir:

```typescript
import { accountApi } from '@/features/auth/api/account.api';
```
(`authApi` importu silinir.) Satır 44'teki çağrıyı değiştir:

```typescript
            const tokens = await accountApi.refresh(state.refreshToken);
```
(`state.setTokens(tokens.accessToken, tokens.refreshToken)` satırı aynı kalır — `AccountAuthResult` aynı alan adlarını taşır.)

- [ ] **Step 3: `client.ts` legacy fallback'ini sil**

`refreshOnce` içindeki şu bloğu sil (satır 94-98):

```typescript
      const legacy = await tryRefresh('/auth/refresh', refreshToken);
      if (legacy) {
        authHooks?.setTokens(legacy.accessToken, legacy.refreshToken);
        return legacy.accessToken;
      }
```
(account `if` bloğundan sonra doğrudan `return null;` kalır). Satır 82-83'teki "fail olursa User-tabanlı eski endpoint denenir" yorumunu "Tek yol Account refresh'idir (legacy /auth/refresh Faz 1'de kaldırıldı)." olarak güncelle; dosya başı (satır 9-12) yorumundaki legacy fallback cümlesini de kaldır. `tryRefresh` yardımcısı KALIR (account çağrısı kullanıyor).

- [ ] **Step 4: `auth.api.ts`'i ve `BackendLoginPayload`'ı sil**

```bash
git rm src/features/auth/api/auth.api.ts
```
`auth.types.ts`'ten `export interface BackendLoginPayload { ... }` bloğunu (~60) ve ~43'teki "Backend `/auth/login` ham payload'u" doc yorumunu sil.

- [ ] **Step 5: Doğrula**

Run: `npm run typecheck && npm run lint && npm test`
Expected: hepsi PASS (bilinen pre-existing `portal-routing.test.tsx` 3 fail hariç — yeni fail yok). `grep -rn "auth/refresh'\|auth/login'\|BackendLoginPayload\|authApi" src/` → yalnız `account/...` eşleşmeleri.

- [ ] **Step 6: Commit (Conventional Commits, İngilizce — mobil konvansiyonu)**

```bash
git add -A
git commit -m "refactor(auth): remove legacy /auth/refresh fallback and auth.api, repoint cold-start recovery to account refresh

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Faz 1 — Kapanış

### Task 6: Chrome E2E + üç PR

**Files:** — (doğrulama + PR)

**Interfaces:**
- Consumes: Task 1-5 tamam; API (`dotnet run --project src/Oksis.Api`) ve web (`npm run dev`) ayakta.

- [ ] **Step 1: Chrome E2E — login/refresh/logout zinciri**

claude-in-chrome araçlarıyla (yeni sekme):
1. `http://localhost:5173/login` → seed SchoolAdmin kimlik bilgisiyle (IdentityDevSeeder'daki sabitler) giriş → admin dashboard açılır (401/403 yok).
2. Sayfayı yenile (F5) → oturum httpOnly `oksis_rt` cookie'siyle **bootstrap → account refresh** üzerinden geri gelir (login'e düşmez) — bu, legacy fallback silindikten sonra refresh yolunun canlı kanıtı. Network panelinde `POST /auth/account/refresh` 200 doğrula; `/auth/refresh` isteği HİÇ atılmamalı.
3. Logout → login'e döner; tekrar F5 → oturum GERİ GELMEZ (cookie revoke edildi).
Expected: üç adım da geçer; console'da auth hatası yok.

- [ ] **Step 2: Son süit turu (üç repo)**

```bash
cd /Users/farukkaya/Projects/oksis/oksis-api && dotnet build && dotnet test
cd /Users/farukkaya/Projects/oksis/oksis-web && npm run test && npm run build
cd /Users/farukkaya/Projects/oksis/oksis-mobile && npm run typecheck && npm test
```
Expected: hepsi yeşil (pre-existing fail'ler hariç yeni fail yok).

- [ ] **Step 3: PR'ları aç**

Üç repoda push + `gh pr create` (base master, branch `legacy-user-faz1-login`). Başlık örnekleri:
- api: `2026-07-02 refactor: Legacy /auth/login|refresh|revoke ve command dilimleri kaldırıldı (legacy User emeklilik Faz 1)`
- web: `2026-07-02 refactor: Legacy auth fallback ve kalıntıları temizlendi (legacy User emeklilik Faz 1)`
- mobile: `refactor(auth): remove legacy auth fallback (legacy User retirement phase 1)`
PR body: fazın özeti + spec linki (`.claude/specs/legacy-user-emeklilik-design.md`) + E2E kanıt notu; sonuna `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.
Expected: 3 PR açık. **Merge, kullanıcı onayı sonrası — üçü birlikte** (api uçları silinmeden istemci PR'ları tek başına zararsızdır ama tersi değil: önce web+mobile, en son api merge sırası güvenlidir).

- [ ] **Step 4: Docs güncelle (workspace repo)**

`identity/completion_status.md`'ye Faz 1 kaydı (tarih + ne silindi + E2E kanıtı); README metadata `Last Updated`. Commit (workspace, OKSİS formatı) + push.
