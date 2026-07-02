# Legacy User Emeklilik — Faz 2 (Parola) Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Legacy User-tabanlı parola akışlarını kalıntısız kaldırmak: `POST /auth/reset-password|confirm-reset` + istemcisiz `POST /users/me/change-password` uçları, üç command dilimi, `PasswordResetToken` altyapısı (+tablo drop), istemcilerdeki ölü tipler/şemalar ve docs kalıntıları.

**Architecture:** Silme + drop aynı fazda (Yaklaşım A). Account parola akışları (`/auth/account/forgot|reset|change-password`) tek canlı yol — DOKUNULMAZ. Keşif kanıtları: 2026-07-02 Faz 2 keşif raporu (tasarım amendman-2a/2b).

**Tech Stack:** .NET 10 + EF Core migration, React+vitest, Expo RN+jest.

## Global Constraints

- Spec: `.claude/specs/legacy-user-emeklilik-design.md` (amendman-2'li) — bağlayıcı.
- **DOKUNULMAZ:** `IPasswordResetEmailSender` + `PasswordResetEmailSender` + `PasswordResetEmailJob` + DI kayıtları (`DependencyInjection.cs:151,157`) — `AccountForgotPasswordCommandHandler` kullanıyor; tüm `Account*` parola dilimleri + `AccountPasswordResetToken` + `identity.account_password_reset_tokens`; `RefreshTokenBody`/`RevokeTokenBody`; `IRefreshTokenStore`+impl'leri (Faz 4 — bu fazdan sonra tek tüketici `SoftDeleteUser`); mobil `changePasswordSchema`/`ChangePasswordInput` (form-only, account ucuna gidiyor).
- Commit: api+web OKSİS formatı (`YYYY-MM-DD <type>: Türkçe özet.`), mobile Conventional Commits İngilizce scope'lu; hepsine `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- api: commit öncesi `dotnet format` (BOM'una dokunduğu ilgisiz migration dosyalarını revert et — Faz 1 dersleri).
- Web test script'i `npm run oksis:test`, dev script'i `npm run oksis:dev` (CLAUDE.md'deki `npm run test/dev` adları drift).
- Branch adı (üç repoda): `legacy-user-faz2-parola`. Tarih öneki: gerçek tarih (bugün 2026-07-02).

---

## Faz 2 — oksis-api

### Task 1: Legacy parola uçlarını + contract tiplerini + middleware girdilerini kaldır

**Files:**
- Modify: `src/Oksis.Api/Controllers/V1/AuthController.cs` (ResetPasswordAsync ~100-107, ConfirmResetAsync ~109-117, using ~19-20)
- Modify: `src/Oksis.Api/Controllers/V1/UsersController.cs` (`POST me/change-password` action ~212-220, `Commands.ChangePassword` using ~7)
- Modify: `src/Oksis.Api/Contracts/Identity/CreateUserBody.cs` (`ChangePasswordBody` ~16, `ResetPasswordBody` ~28, `ConfirmResetBody` ~30)
- Modify: `src/Oksis.Api/Middleware/TenantContextMiddleware.cs` (satır ~7-8: `"/api/v1/auth/reset-password"`, `"/api/v1/auth/confirm-reset"`)

**Interfaces:**
- Produces: AuthController'da yalnız account+me uçları; UsersController'da change-password ucu yok. **KORUNUR:** `RefreshTokenBody`/`RevokeTokenBody`, `AccountResetPasswordBody`/`AccountChangePasswordBody`, TenantFreeEndpoints'teki health girdileri. Command tipleri henüz durur (Task 2 siler) — build yeşil kalır.

- [ ] **Step 1: Branch aç**

```bash
cd /Users/farukkaya/Projects/oksis/oksis-api
git checkout master && git pull && git checkout -b legacy-user-faz2-parola
```

- [ ] **Step 2: Action'ları sil**

`AuthController.cs`: `ResetPasswordAsync` (`[HttpPost("reset-password")]`) ve `ConfirmResetAsync` (`[HttpPost("confirm-reset")]`) metodlarını attribute'larıyla komple sil; `using ...Commands.ConfirmPasswordReset;` + `using ...Commands.ResetPassword;` satırlarını kaldır. Sınıf XML özetindeki "parola sıfırlama" ifadesini account akışını anlatacak şekilde güncelle (account parola uçları kalıyor).
`UsersController.cs`: `[HttpPost("me/change-password")]` action'ını komple sil + `using ...Commands.ChangePassword;` kaldır.

- [ ] **Step 3: Contract tiplerini sil**

`CreateUserBody.cs`'ten üç record'u sil: `ChangePasswordBody` (~16), `ResetPasswordBody` (~28), `ConfirmResetBody` (~30). `RefreshTokenBody`/`RevokeTokenBody` ve `Account*Body` record'larına DOKUNMA.

- [ ] **Step 4: Middleware girdilerini sil**

`TenantContextMiddleware.cs` `TenantFreeEndpoints` set'inden yalnız şu iki satırı sil:
```csharp
"/api/v1/auth/reset-password",
"/api/v1/auth/confirm-reset",
```

- [ ] **Step 5: Build + Api testleri**

Run: `dotnet build && dotnet test tests/Oksis.Api.UnitTests`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
dotnet format && git add -A
git commit -m "2026-07-02 refactor: Legacy /auth/reset-password|confirm-reset ve istemcisiz /users/me/change-password uçları kaldırıldı (legacy User emeklilik Faz 2).

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 2: Üç legacy parola command dilimini sil

**Files:**
- Delete: `src/Oksis.Application/Modules/Identity/Commands/ResetPassword/` (ResetPasswordCommand.cs, ResetPasswordCommandHandler.cs)
- Delete: `.../Commands/ConfirmPasswordReset/` (ConfirmPasswordResetCommand.cs, ConfirmPasswordResetCommandHandler.cs)
- Delete: `.../Commands/ChangePassword/` (ChangePasswordCommand.cs, ChangePasswordCommandHandler.cs, ChangePasswordCommandValidator.cs)
- Delete: `tests/Oksis.Application.UnitTests/Modules/Identity/Commands/ConfirmPasswordResetCommandHandlerTests.cs`
- Delete: `tests/Oksis.Application.UnitTests/Modules/Identity/Commands/ChangePasswordCommandHandlerTests.cs`

**Interfaces:**
- Consumes: Task 1 (controller referansları silinmiş).
- Produces: `db.PasswordResetTokens`'ın üretim tüketicisi kalmaz (Task 3 altyapıyı düşürür). **KORUNUR:** `IPasswordResetEmailSender` (AccountForgotPassword kullanıyor), `IRefreshTokenStore` (SoftDeleteUser kullanıyor — silme Faz 4).

- [ ] **Step 1: Sil**

```bash
git rm -r src/Oksis.Application/Modules/Identity/Commands/ResetPassword \
          src/Oksis.Application/Modules/Identity/Commands/ConfirmPasswordReset \
          src/Oksis.Application/Modules/Identity/Commands/ChangePassword
git rm tests/Oksis.Application.UnitTests/Modules/Identity/Commands/ConfirmPasswordResetCommandHandlerTests.cs \
       tests/Oksis.Application.UnitTests/Modules/Identity/Commands/ChangePasswordCommandHandlerTests.cs
```

- [ ] **Step 2: Build (kalıntı avı)**

Run: `dotnet build`
Expected: PASS. FAIL → hata veren dosya beklenmedik tüketici; korumalı tipe dokunmadan yalnız silinen-command referansını temizle, çözemiyorsan BLOCKED.

- [ ] **Step 3: Grep doğrulama**

```bash
grep -rn "ResetPasswordCommand\|ConfirmPasswordResetCommand\|ChangePasswordCommand\b" src/ | grep -v "AccountResetPassword\|AccountChangePassword"
```
Expected: boş.

- [ ] **Step 4: Commit**

```bash
dotnet format && git add -A
git commit -m "2026-07-02 refactor: Legacy ResetPassword/ConfirmPasswordReset/ChangePassword command dilimleri silindi (legacy User emeklilik Faz 2).

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 3: `PasswordResetToken` altyapısını düşür (drop migration dahil)

**Files:**
- Delete: `src/Oksis.Domain/Modules/Identity/Entities/PasswordResetToken.cs`
- Delete: `src/Oksis.Infrastructure/Persistence/Configurations/Identity/PasswordResetTokenConfiguration.cs`
- Delete: `tests/Oksis.Domain.UnitTests/Modules/Identity/Entities/PasswordResetTokenTests.cs`
- Modify: `src/Oksis.Application/Common/Abstractions/IApplicationDbContext.cs` (DbSet ~47 + ~56'daki "PasswordResetTokens User akışı için ayrı kalır" yorumu)
- Modify: `src/Oksis.Infrastructure/Persistence/OksisDbContext.cs` (DbSet ~54)
- Create: yeni EF migration (drop `identity.password_reset_tokens`)

**Interfaces:**
- Consumes: Task 2 (son üretim tüketicileri silinmiş — aksi halde build kırılır).
- Produces: `identity.password_reset_tokens` tablosu şemadan kalkar. **KORUNUR:** `AccountPasswordResetToken` + `account_password_reset_tokens` (Account akışı).

- [ ] **Step 1: Entity + config + test + DbSet'leri sil**

Dosyaları `git rm` ile sil; `IApplicationDbContext.cs`'ten `DbSet<PasswordResetToken> PasswordResetTokens` satırını ve ~56'daki ilgili yorumu, `OksisDbContext.cs`'ten DbSet satırını kaldır. Kalan `using` temizliği.

- [ ] **Step 2: Build**

Run: `dotnet build`
Expected: PASS.

- [ ] **Step 3: Drop migration üret + incele**

```bash
dotnet ef migrations add 20260702_drop_password_reset_tokens \
  --project src/Oksis.Infrastructure --startup-project src/Oksis.Api
```
Üretilen migration'ı OKU: `Up` yalnız `DropTable(name: "password_reset_tokens", schema: "identity")` (+index'leri) içermeli; `account_password_reset_tokens`'a DOKUNMAMALI. Başka bir şey içeriyorsa DUR (model snapshot'ta beklenmedik drift) → BLOCKED.

- [ ] **Step 4: Dev DB'ye uygula + tam süit**

```bash
dotnet ef database update --project src/Oksis.Infrastructure --startup-project src/Oksis.Api
dotnet test
```
Expected: update OK; süit yeşil (bilinen pre-existing `PersonDirectoryChildrenIntegrationTests` FK fail'i hariç — yeni fail yok).

- [ ] **Step 5: Commit**

```bash
dotnet format && git add -A
git commit -m "2026-07-02 refactor,db: PasswordResetToken entity+config+DbSet silindi, identity.password_reset_tokens drop migration'ı eklendi (legacy User emeklilik Faz 2, amendman-2b).

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 4: api docs/manuel-test kalıntıları (Faz 1+2 uçları)

**Files:**
- Modify: `docs/postman/oksis-identity.postman_collection.json`, `docs/postman/identity-curl-reference.md`, `test/invitations/test-invitation.http`, `test/invitations/test-invitation.ps1`

**Interfaces:**
- Produces: docs/manuel-test malzemesinde silinen uçlara (`/auth/login`, `/auth/refresh`, `/auth/revoke`, `/auth/reset-password`, `/auth/confirm-reset`, `/users/me/change-password`) referans kalmaz.

- [ ] **Step 1: Legacy kayıtları temizle**

Dört dosyada yukarıdaki altı uca ait istek/örnek bloklarını sil. Bir bloğun account eşi koleksiyonda YOKSA (ör. login), account eşdeğerini (`/auth/account/login` vb.) mevcut account örneklerinin biçimiyle ekle; varsa yalnız sil. `.http`/`.ps1` script'lerinde davet akışının çalışırlığını bozma — script legacy uca istek atıyorsa account eşine çevir.

- [ ] **Step 2: Doğrula + commit**

```bash
grep -rn "auth/login\|auth/refresh\|auth/revoke\|auth/reset-password\|auth/confirm-reset\|me/change-password" docs/ test/ | grep -v account
```
Expected: boş.
```bash
git add -A
git commit -m "2026-07-02 docs: Postman/curl/manuel-test malzemesinden Faz 1+2'de silinen legacy auth uçları temizlendi (legacy User emeklilik Faz 2).

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Faz 2 — oksis-web

### Task 5: Ölü legacy parola/login tipleri

**Files:**
- Modify: `src/modules/identity/types/user.types.ts` (`ChangePasswordPayload` ~213, `LoginPayload` ~218, `ResetPasswordPayload` ~224, `ConfirmResetPayload` ~229)

**Interfaces:**
- Produces: web'de legacy parola/login payload tipi kalmaz. **KORUNUR:** `AccountChangePasswordPayload` vb. account tipleri; `ResetPasswordPayload`'ın account akışındaki adaşları varsa (kontrol et) dokunulmaz.

- [ ] **Step 1: Branch + sil**

```bash
cd /Users/farukkaya/Projects/oksis/oksis-web
git checkout master && git pull && git checkout -b legacy-user-faz2-parola
```
`user.types.ts`'ten dört interface'i (varsa üstlerindeki doc yorumlarıyla) sil. Önce `grep -rn "ChangePasswordPayload\|LoginPayload\|ResetPasswordPayload\|ConfirmResetPayload" src/` ile kullanıcı olmadığını teyit et (yalnız tanım satırları çıkmalı; çıkarsa Account* adaşları hariç tut).

- [ ] **Step 2: Test + build + commit**

Run: `npm run oksis:test && npm run build`
Expected: 6 bilinen pre-existing fail dışında yeşil; build temiz.
```bash
git add -A
git commit -m "2026-07-02 refactor: Ölü legacy parola/login payload tipleri silindi (legacy User emeklilik Faz 2).

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Faz 2 — oksis-mobile

### Task 6: Ölü legacy şemalar

**Files:**
- Modify: `src/features/auth/schemas/login.schema.ts` (`resetPasswordSchema` ~31, `ResetPasswordInput` ~39, `confirmResetSchema` ~41, `ConfirmResetInput` ~56)
- Modify: `src/features/auth/__tests__/login.schema.test.ts` (silinen şemalara ait testler)

**Interfaces:**
- Produces: mobilde legacy parola şeması kalmaz. **KORUNUR:** `changePasswordSchema`/`ChangePasswordInput` (~14-29; ChangePasswordScreen+ForceChangePasswordScreen kullanıyor) ve `login.schema.ts`'teki diğer canlı şemalar.

- [ ] **Step 1: Branch + sil**

```bash
cd /Users/farukkaya/Projects/oksis/oksis-mobile
git checkout master && git pull && git checkout -b legacy-user-faz2-parola
```
`login.schema.ts`'ten dört sembolü sil; `login.schema.test.ts`'te yalnız `resetPasswordSchema`/`confirmResetSchema` kullanan test bloklarını sil (diğer testlere dokunma).

- [ ] **Step 2: Doğrula + commit (Conventional, İngilizce)**

Run: `npm run typecheck && npm run lint && npm test`
Expected: 3 bilinen pre-existing `portal-routing` fail'i dışında yeşil.
```bash
git add -A
git commit -m "refactor(auth): remove dead legacy password reset schemas (legacy User retirement phase 2)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Faz 2 — Kapanış

### Task 7: E2E + 3 PR + docs

- [ ] **Step 1: API + web'i başlat, silinen uçları doğrula**

API: `nohup dotnet run --project src/Oksis.Api > /tmp/oksis-api-faz2.log 2>&1 &` (5112); web: `npm run oksis:dev` (5173). Sonra:
```bash
for p in auth/reset-password auth/confirm-reset users/me/change-password; do
  curl -s -o /dev/null -w "$p: %{http_code}\n" -X POST http://localhost:5112/api/v1/$p -H "Content-Type: application/json" -d '{}'
done
curl -s -o /dev/null -w "account/forgot: %{http_code}\n" -X POST http://localhost:5112/api/v1/auth/account/forgot-password -H "Content-Type: application/json" -d '{"identifier":"mudur.s1@oksis.local"}'
```
Expected: ilk üçü 404 (veya 401 — route yok/auth; 404 beklenir), `account/forgot` **202**.

- [ ] **Step 2: Chrome E2E — account parola akışları**

1. Login (mudur.s1@oksis.local / Oksis1234!) → `/change-password` (self-servis ChangePasswordPage) → mevcut parola + yeni parola (`Oksis1234!x`) → başarı; logout → YENİ parolayla login ✓ → aynı akışla parolayı `Oksis1234!`'e GERİ AL (dev ortam bozulmasın).
2. Login sayfası → "Şifremi unuttum" → identifier gönder → uniform başarı mesajı (202) ✓. (Reset token e-postası stub `PasswordResetEmailJob` yalnız logluyor — `/tmp/oksis-api-faz2.log`'da job kaydını gör; ham token loglanıyorsa `/reset-password?token=...` sayfasıyla akışı tamamla, loglanmıyorsa bu adımı "token stub'da erişilemiyor" notuyla kapat.)
Konsolda auth hatası yok; Network'te yalnız `account/*` istekleri.

- [ ] **Step 3: PR'lar (üç repo, branch `legacy-user-faz2-parola`)**

Başlıklar: api `2026-07-02 refactor: Legacy parola uçları+dilimleri+password_reset_tokens kaldırıldı (legacy User emeklilik Faz 2)`; web `2026-07-02 refactor: Ölü legacy parola/login tipleri silindi (legacy User emeklilik Faz 2)`; mobile `refactor(auth): remove dead legacy password schemas (legacy User retirement phase 2)`. Body: özet + spec linki + E2E kanıtı + `🤖 Generated with [Claude Code](https://claude.com/claude-code)`. Merge sırası: önce web+mobile, en son api — **kullanıcı onayıyla**.

- [ ] **Step 4: Docs**

`identity/completion_status.md` Faz 2 kaydı + README `Last Updated`; ledger güncelle. Workspace commit+push (OKSİS formatı).
