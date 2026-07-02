# Davet Linki — API Cevabında Ham Token (Option A) Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax. TDD zorunlu: her davranış için önce RED test.

**Goal:** Admin bir kullanıcı davet ettiğinde (`POST /users`), daveti yeniden gönderdiğinde (`POST /users/invitations/{id}/resend`) ve doğrudan davet oluşturduğunda (`POST /users/invitations`) API cevabı ham davet token'ını döndürsün; frontend `origin + /invite/<token>` linkini kurup "Kopyala" göstersin. Böylece Faz 3'ten devreden "ham davet linki hiçbir üretim yolundan elde edilemiyor" borcu kapanır.

**Architecture:** Ham token üretim anında (`InvitationCreationHelper.cs:67` / `ResendInvitationCommandHandler.cs:28`) zaten `token.RawToken` olarak elde. Entity/domain DEĞİŞMEZ — token yalnız Result/DTO zincirine taşınır. Link'i **backend kurmaz** (multi-tenant origin doğruluğu); token döner, frontend origin'den kurar. İki repo: oksis-api (branch `invite-link-in-response` @698efd1), oksis-web (branch `invite-link-in-response` @c69e86f).

**Tech Stack:** .NET 10 (MediatR, xUnit) + React/TS (vitest, RHF, sonner toast).

## Global Constraints

- **Güvenlik (bağlayıcı):** ham token DB'ye/log'a/audit'e YAZILMAZ (mevcut kural korunur — `database-schema.md:385/587`). Token yalnızca kimliği doğrulanmış, `users.create`/davet izinli admin'e HTTP yanıtında, oluşturma anında bir kez döner. `TokenHasher` SHA-256 hash saklama aynen kalır.
- **notifications.md revizyonu (Task 3):** `notifications.md:60` + `:414-416` "token yalnız e-posta/SMS body'sinde" ifadesine "davet eden admin'e HTTPS yanıtı" açık istisnası eklenir (kullanıcı onayladı 2026-07-02). Bu revizyon YAPILMADAN token response'a konursa spec ihlali olur — Task 3 bu yüzden borç kapanışıyla birlikte kuralı düzeltir.
- **Link kurulumu frontend'de:** `${window.location.origin}/invite/${token}` (web route `routes.tsx:86` → `/invite/:token`). Backend base-URL config'i EKLENMEZ.
- Commit: OKSİS formatı + `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`; api'de `dotnet format` FOREGROUND; web'de `npm run test` yeşil.
- Bilinen pre-existing fail: api `PersonDirectoryChildrenIntegrationTests` FK.

---

### Task 1 (BE): `POST /users`, resend ve create-invitation cevabına `inviteToken` (TDD)

**Files (api):**
- Modify: `src/Oksis.Application/Common/Abstractions/ICreateUserService.cs` — `CreateUserOutcome` record'una (:33) `string? InviteToken` ekle (son parametre, opsiyonel).
- Modify: `src/Oksis.Application/Modules/Users/Common/InvitationCreationHelper.cs` — dönüş `Result<Invitation>` (:31) → `Result<InvitationCreationResult>`; YENİ `record InvitationCreationResult(Invitation Invitation, string RawToken)` (aynı dosyada veya `DTOs/`). `token.RawToken`'ı (:67) sonuca koy. Tüm çağıranlar güncellenir.
- Modify: `src/Oksis.Application/Modules/Users/Services/PersonUserCreationService.cs` — helper'dan `RawToken` al, başarı `CreateUserOutcome`'una koy (:153 civarı). Hata dallarında `InviteToken=null`.
- Modify: `src/Oksis.Application/Modules/Identity/Commands/CreateUser/CreateUserCommandHandler.cs` — dönüş `Result<Guid>` → `Result<CreateUserResult>`; YENİ `record CreateUserResult(Guid PersonId, string InviteToken)` (`Modules/Identity/DTOs/`). Başarıda outcome'dan doldur (:34). Hata dalları aynen.
- Modify: `src/Oksis.Api/Controllers/V1/UsersController.cs` — create action (:161-170) `ApiResponse<Guid>` → `ApiResponse<CreateUserResult>` (201 Created; `ToCreatedResult` id'si `PersonId` kalır).
- Modify: `src/Oksis.Application/Modules/Users/DTOs/CreateInvitationResult.cs` — `record CreateInvitationResult(Guid Id, string Status, DateTimeOffset ExpiresAt, string InviteToken)` (:4-7); yorumdaki "plain token dahil edilmez" (:3) → "plain token yalnız bu HTTP yanıtında döner (DB/log/audit'e yazılmaz)".
- Modify: `src/Oksis.Application/Modules/Users/Commands/CreateInvitation/CreateInvitationCommandHandler.cs` — `created` (helper) `RawToken`'ını sonuca koy (:76).
- Modify: `src/Oksis.Application/Modules/Users/Commands/ResendInvitation/ResendInvitationCommandHandler.cs` — `token.RawToken` (:28) sonuca koy (:47-48).
- **DOKUNMA:** `ImportUsersCommandHandler.cs:165` — `CreateAsync` çağrısı; yeni `InviteToken` alanını yok sayar (davranış değişmez, yalnız derlenmeye devam etsin).

**Tests (api, RED önce):**
- Modify/New: `tests/Oksis.Application.UnitTests/Modules/Identity/Commands/CreateUser/CreateUserCommandHandlerTests.cs` — başarı senaryosunda `result.Value.InviteToken` boş DEĞİL + `PersonId` doğru. (Mevcut `Result<Guid>` assert'leri yeni tipe göre güncellenir.)
- Modify/New: `tests/Oksis.Application.UnitTests/Modules/Users/Commands/ResendInvitation/ResendInvitationCommandHandlerTests.cs` — `result.Value.InviteToken` boş değil, `Resend`'in ürettiği yeni token'la eşleşir (fake tokenFactory ile deterministik).
- Modify/New: `tests/Oksis.Application.UnitTests/Modules/Users/Commands/CreateInvitation/CreateInvitationCommandHandlerTests.cs` — `result.Value.InviteToken` boş değil.
- Mevcut `CreateInvitationResult`/`CreateUserOutcome` şekline bağlı testler yeni alana göre güncellenir.

- [ ] **Step 1:** api branch `invite-link-in-response`'ta (zaten var). Var olan test dosyalarını oku; yoksa TDD için oluştur.
- [ ] **Step 2 (RED):** 3 handler için yukarıdaki assert'leri yaz/güncelle; `dotnet test tests/Oksis.Application.UnitTests` → yeni assert'ler FAIL (token alanı yok).
- [ ] **Step 3 (GREEN):** DTO/record genişletmeleri + helper dönüş tipi + 3 handler + controller + PersonUserCreationService threading. `InvitationCreationHelper` çağıranlarının hepsi derlenir.
- [ ] **Step 4:** `dotnet build` (TWAE, 0 uyarı) + `dotnet test tests/Oksis.Application.UnitTests` PASS. Tam `dotnet test` (Docker up) → bilinen FK hariç yeşil. `dotnet format` FOREGROUND.
- [ ] **Step 5:** Commit: `2026-07-02 feat,test: Davet oluşturma/yeniden-gönderme API yanıtları ham davet token'ı döndürüyor (davet linki borcu, Option A BE).`

### Task 2 (FE): Davet linki kopyala UI + create/resend bağlama (TDD)

**Files (web):**
- New: `src/shared/utils/copyToClipboard.ts` — `navigator.clipboard.writeText` sarmalayıcı (hata durumunda false döner; test edilebilir).
- New: `src/portals/admin/pages/users/InviteLinkCopy.tsx` — prop `token: string`; `const link = \`${window.location.origin}/invite/${token}\``; salt-okunur input/metin + "Kopyala" `Button` → `copyToClipboard(link)` → `sonner` toast (i18n). (Component adı İngilizce PascalCase.)
- Modify: `src/modules/identity/api/user.api.ts` (:108-111) — `createUser` dönüşü `Promise<string>` → `Promise<{ personId: string; inviteToken: string }>` (backend `CreateUserResult`'a hizala).
- Modify: `src/modules/identity/hooks/useCreateUser.ts` — dönüş tipini yay.
- Modify: `src/portals/admin/pages/users/InviteAccountModal.tsx` (:64-71) — `onSuccess`'te modalı hemen kapatma; dönen `inviteToken` ile `InviteLinkCopy` gösteren "davet oluşturuldu, link:" adımı; kullanıcı kapatınca reset.
- Modify: `src/modules/users/api/invitation.api.ts` (:45-49, :81-91) — `CreateInvitationResult` tipine `inviteToken: string`; `resendInvitation` aynı tipi döndürür.
- Modify: `src/modules/users/hooks/useInvitations.ts` — `useResendInvitation` (:71-83) ve `useCreateInvitation` (:41-51) `onSuccess`'te `inviteToken`'dan linki kurup kopyala + toast (veya `InviteLinkCopy` gösteren küçük modal — mevcut `InvitationsPage` desenine uy).
- Modify: i18n `src/**/locales/tr/*.json` + `en/*.json` — yeni anahtarlar (`users.invite.linkReady`, `users.invite.copyLink`, `users.invite.linkCopied` vb.); hardcoded Türkçe YASAK.

**Tests (web, vitest, RED önce):**
- New: `copyToClipboard.test.ts` — `navigator.clipboard.writeText` mock; başarı/başarısız.
- New: `InviteLinkCopy.test.tsx` — token verilince doğru `origin + /invite/<token>` linkini render eder; Kopyala tıklayınca `copyToClipboard` çağrılır + toast.
- Modify: `InviteAccountModal` testi — create başarısında link paneli görünür (mutation mock `inviteToken` döner).
- Modify: resend hook/testi — resend başarısında link kopyalanır.

- [ ] **Step 1:** web branch `invite-link-in-response`'ta. `InviteAccountModal`/`useInvitations` mevcut testlerini oku.
- [ ] **Step 2 (RED):** `copyToClipboard` + `InviteLinkCopy` + modal/resend testleri yaz → `npm run test` FAIL (util/bileşen yok, response tipi eski).
- [ ] **Step 3 (GREEN):** util + bileşen + api tipleri + modal/resend bağlama + i18n. `window.location.origin` testlerde jsdom default'u kullanılır.
- [ ] **Step 4:** `npm run test` yeşil (yeni + regresyon). Commit: `2026-07-02 feat,test: Davet linki "Kopyala" UI'ı — create/resend yanıtındaki token'dan origin+/invite/<token> kuruluyor (davet linki borcu, Option A FE).`

### Task 3 (Docs): notifications.md kural revizyonu + borç kapanışı

**Files (workspace `oksis`):**
- Modify: `.claude/docs/modules/users/notifications.md` (:60 ve :414-416) — "token plain text yalnız e-posta/SMS body'sinde" ifadesine açık istisna: *"...ve davet eden yetkili admin'e dönen `POST /users` / `POST /users/invitations[/resend]` HTTPS yanıtında (yalnızca oluşturma anında; DB/log/audit'e yazılmaz)."* Log/audit/InApp yasağı AYNEN kalır.
- Modify: `.claude/docs/modules/users/business-rules.md` (BR-users-005 civarı, ~:91-108) — link teslim yollarına "API yanıtı (admin manuel iletir)" eklenir; e-posta hâlâ post-MVP.
- Modify: `.claude/docs/modules/identity/completion_status.md` — `:13` ve `:9`'daki "ham davet linki hiçbir üretim yolundan elde edilemiyor … karar bekliyor" borcunu KAPAT (Option A uygulandı, create/resend/create-invitation token döndürüyor + FE kopyala).
- Modify: `.claude/docs/modules/users/completion_status.md` — çapraz-referans borç kapanışı (`:9` civarı) + "Spec Dışına Çıkılanlar"a notifications.md kural revizyonu kaydı (tarih, gerekçe, onay: farukkaya 2026-07-02).

- [ ] **Step 1:** notifications.md + business-rules.md revizyonu (log/audit yasağı korunur).
- [ ] **Step 2:** iki completion_status borç kapanışı + sapma kaydı.
- [ ] **Step 3:** Workspace commit: `2026-07-02 docs: Davet linki API-yanıtı teslim kararı — notifications.md token-teslim istisnası + Faz 3 davet-linki borcu kapatıldı (Option A).` + push.

### Task 4: E2E + PR'lar

- [ ] **Step 1:** api'yi branch'ten başlat + web dev branch'ten. Chrome/curl E2E: admin login → "Yeni Kullanıcı" davet → cevapta `inviteToken` → FE link paneli görünür/kopyalanır → o linkle `/invite/<token>` aç → accept sihirbazı yükleniyor (token geçerli). Resend → yeni token → yeni link → accept. Curl fallback: `POST /users` yanıtında `inviteToken` alanı dolu.
- [ ] **Step 2:** PR'lar: oksis-api (base master) + oksis-web (base master); body + E2E kanıtı + güvenlik notu + footer. Docs zaten Task 3'te push edildi.
- [ ] **Step 3:** memory güncelle: davet-linki borcu KAPANDI.
