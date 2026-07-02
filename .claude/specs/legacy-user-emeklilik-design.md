# Legacy `User` Emeklilik Tasarımı (Faz 2 / OQ-identity-001 kapanışı)

> **Tür:** Onaylı tasarım (design doc) · **Tarih:** 2026-07-02 · **Durum:** Onaylandı (farukkaya)
> **Amendman (2026-07-02, onaylı):** Faz 1 plan keşfi 4 sınır düzeltmesi getirdi — `RefreshTokenCookie`
> Account akışının çekirdeği olduğundan HİÇ silinmez; `IJwtTokenService`+`JwtTokenService` ve
> `PermissionReader` legacy claim fallback'i davet-kabul bağımlılığı nedeniyle **Faz 3'e**;
> `IRefreshTokenStore`+impl'leri (ConfirmPasswordReset/ChangePassword/SoftDeleteUser bağımlılığı)
> **Faz 4'e** kaydı. Legacy refresh store Redis tabanlı — DB tablosu yok, Faz 1 drop migration maddesi düştü.
> **İlgili:** `.claude/specs/adr-001-legacy-user-kaldirma.md` (ADR-001),
> `.claude/docs/modules/identity/open-questions.md` (OQ-identity-001),
> `identity/completion_status.md` (Faz 1 okuma göçü, 2026-06-08)

## 1. Amaç ve kapsam

Legacy `identity.User` modeli **kalıntısız** kaldırılır: tüm auth/yazma/okuma yolları
`Person` + `Account` + `Profile` + `RoleAssignment` modeline taşınır, ardından `User`
entity + `UserConfiguration` + `DbSet<User>` + `[identity].[users]` tablosu silinir.

**Kapsam kararları (brainstorming, 2026-07-02, farukkaya):**

1. **Veri göçü script'i YOK — dev reseed.** Tek gerçek ortam dev; taşınacak gerçek veri
   yok. Bu, **ADR-001 Aşama 2'den bilinçli sapmadır** (idempotent migration script şartı);
   Faz 5'te `completion_status.md → Spec Dışına Çıkılanlar`a işlenir, ADR'ye not düşülür.
2. **`identity-invite-accept-route` branch'i (oksis-web `ca498d2`) göçten ÖNCE merge edilir** (Faz 0).
3. **Sert kaldırma:** legacy uçlar + istemci fallback'leri + `PermissionReader` legacy
   `permissions` claim fallback'i deprecation penceresi olmadan silinir (dev-only ortam;
   web+mobil zaten Account akışında).
4. **Minimal kapsam:** Kullanıcılar ekranının "D" rozetli eksik account-axis admin uçları
   (SendPasswordReset, AdminUnlock ucu, Suspend, RevokeSessions, rol atama, security GET)
   bu göçe **dahil değil** — ayrı iş.
5. **Davet UX borcu dahil:** `InvitationAcceptPage` accept hatasının ekranda gösterimi
   (onError → görünür TR mesaj) Faz 3'te yapılır ([[project-invite-accept-error-debt]] kapanır).
6. **Faz başına branch + PR**; her faz sonunda Chrome E2E.
7. **Yaklaşım A:** her faz kendi legacy'sini aynı fazda siler (repoint + sil birlikte);
   hiçbir fazda çift yol yaşamaz.

## 2. Hedef mimari ve değişmezler

Tek kimlik modeli: `Person` (kişi/PII) + `Account` (login/parola/kilit) + `Profile`
(TPH rol verisi) + `RoleAssignment` (sezonsal rol). ADR-001 madde 3'teki "giriş kimliği"
rolü tamamen `Account`'ta.

**Değişmezler:**
- `/auth/account/*` uç sözleşmeleri değişmez (web+mobil tüketiyor).
- Kullanıcılar ekranı okuma DTO'ları (`UserListDto`/`UserDetailDto`/`UserStatsDto`) değişmez; `{id}` = `Account.Id`.
- `Person.LinkedAccountId` her yerde **gerçek `Account.Id`** (bugün davet yolu legacy
  `User.Id` yazıyor — tutarsızlık kapanır).
- Tenant izolasyonu, TR-auth kuralları (uniform 401, TCKN reddi, timing-safe verify) aynen.

**Kilit model kararı (onaylı):** **"Account yalnız parola doğduğunda doğar."**
Person (+ Profile + RoleAssignment) davet/oluşturma anında; `Account` yalnız davet
kabulünde (kullanıcı parolasını belirlediğinde) yaratılır. Parolasız/kilitli yarı-canlı
Account hiç var olmaz. *(Planlama notu: `StudentAccountProvisioner`'ın eager-Account
davranışıyla çelişki planlamada netleştirilecek — bkz. §6.)*

## 3. Fazlar

Her faz: kendi branch'i → TDD → testler yeşil → Chrome E2E → review → PR → merge.

### Faz 0 — Taban (web + db)
- `identity-invite-accept-route` (`ca498d2`, `/invite/:token` route fix) master'a merge.
- Dev DB reseed doğrulaması (`ef database drop` + `update` + run) + Chrome smoke login.

### Faz 1 — Login/Refresh (api + web + mobile) *(amendmanla daraltıldı)*
- **API sil:** `POST /auth/login|refresh|revoke` uçları + `IssueSession` yardımcısı;
  `LoginCommand/Handler/Validator`, `RefreshTokenCommand/Handler`, `RevokeTokenCommand/Handler`;
  `LoginBody` + `LoginResponse` (yalnız legacy kullanıyor); `LoginCommandHandlerTests`.
- **API KALIR (paylaşılan/sonraki faz):** `RefreshTokenCookie` (Account çekirdeği — kalıcı),
  `RefreshTokenBody`/`RevokeTokenBody` (account/refresh + account/logout paylaşıyor),
  `IsMobileClient()`, `IJwtTokenService`+impl (AcceptInvitation → Faz 3),
  `PermissionReader` legacy claim fallback (davet token'ları → Faz 3),
  `IRefreshTokenStore`+impl'ler (ConfirmPasswordReset/ChangePassword/SoftDeleteUser → Faz 4).
- **Web:** `refreshTokenManager.ts` legacy `/auth/refresh` fallback dalı (+ `applyLegacySession`,
  `isAuthError`, `LoginResponse` importu) silinir; `httpClient.ts` `NO_REFRESH_PATHS`'ten
  `/auth/login` + `/auth/refresh` çıkar; `authStore` logout'taki legacy `/auth/revoke` dalı
  account-only sadeleşir; ilgili MSW mock'ları account-only olur.
- **Mobil:** `client.ts` legacy refresh fallback dalı silinir; `useAuthBootstrap` cold-start
  kurtarması `authApi.refresh` yerine account refresh'e taşınır, ardından `auth.api.ts` +
  `BackendLoginPayload` silinir.
- **Sıra:** istemci repoint + uç silme aynı fazda; api PR'ı ile web+mobil PR'ı birlikte merge edilir.

### Faz 2 — Parola (api + web + mobile) *(2026-07-02 amendman-2 ile genişletildi, onaylı)*
- `POST /auth/reset-password|confirm-reset` uçları + `ResetPasswordCommand`,
  `ConfirmPasswordResetCommand` dilimleri + `ResetPasswordBody`/`ConfirmResetBody` silinir.
- **Amendman-2a (öncül düzeltmesi):** `ChangePasswordCommand` "controller'sız ölü handler"
  DEĞİLDİ — canlı `POST /users/me/change-password` (UsersController) ucuna bağlıydı ama
  **istemcisi sıfır** (web+mobil `/auth/account/change-password` kullanıyor). Kullanıcı
  kararı: uç + dilim (command/handler/validator/test) + `ChangePasswordBody` Faz 2'de silinir.
- **Amendman-2b:** legacy `identity.password_reset_tokens` tablosu + `PasswordResetToken`
  entity/config/DbSet/testi iki handler silinince tamamen yetim → **bu fazda drop migration**
  ile düşürülür (Account'ın `account_password_reset_tokens`'ı AYRI ve KALIR).
- `TenantContextMiddleware.TenantFreeEndpoints`'ten `reset-password`/`confirm-reset` girdileri silinir.
- Web: ölü tipler silinir (`LoginPayload`, `ResetPasswordPayload`, `ConfirmResetPayload`,
  `ChangePasswordPayload` — üretim kullanıcıları yok). Mobil: ölü legacy şemalar silinir
  (`resetPasswordSchema`/`confirmResetSchema` + testleri); `changePasswordSchema` KALIR
  (form-validasyonu, account ucuna gidiyor).
- api docs temizliği: postman koleksiyonu + curl reference + test/invitations script'lerindeki
  legacy uç kayıtları (Faz 1+2 silinenleri) temizlenir.
- **KALIR:** `IPasswordResetEmailSender` + `PasswordResetEmailSender` + `PasswordResetEmailJob`
  + DI kayıtları (AccountForgotPassword da kullanıyor); tüm `Account*` parola dilimleri;
  `IRefreshTokenStore` (bu fazdan sonra kalan TEK tüketicisi `SoftDeleteUser` → Faz 4).

### Faz 3 — Davet + kullanıcı oluşturma (api + web)

> **Amendman-3 (2026-07-02, onaylı — Faz 3 keşfi öncülleri düzeltti):**
> **(3a)** Web `/invite/:token` ZATEN Person-merkezli Users accept'ini kullanıyor
> (`POST /users/invitations/accept`: Person davetten önce var, Account accept'te,
> token dönmez → login'e yönlendirir, KVKK rızaları kaydedilir). "İki zincir tek
> handler'da birleşir" maddesi yerine gerçek iş: **`InvitationAccountProvisioner`'ın
> `User.Create` yapan gövdesi gerçek `Account.Create`'e çevrilir** (bugün
> `Person.LinkedAccountId`'ye User.Id yazılıyor — ana tutarsızlık burada).
> **(3b)** Legacy Identity davet zinciri **TÜMDEN emekli**: `InvitationToken`
> entity+config+`invitation_tokens` tablosu (drop migration), `InvitationsController`
> + `PublicInvitationsController`, Identity AcceptInvitation (auto-login'li) /
> BulkCreateInvitation / RequestInvitationRefresh / GetInvitationPreview /
> GetExpiredInvitation dilimleri, `InvitationCreationService`,
> `SendInvitationNotificationJob` + testleri. Accept auto-login modeli: token
> DÖNDÜRMEZ (mevcut Users davranışı standart).
> **(3c)** `PreCreatedUserId` → `PersonId` **rename İPTAL** — aggregate komple
> düştüğü için yerine `invitation_tokens` DROP migration'ı gelir.
> **(3d)** `StudentAccountProvisioner` eager-Account'u (temp parola +
> requirePasswordChange, E2.6) **istisna olarak korunur** — "Account yalnız parola
> doğduğunda doğar" ilkesi davet akışlarına özgüdür; öğrenci enroll akışına dokunulmaz.
> **(3e)** `POST /users` (Yeni Kullanıcı) **Person+davet akışına yeniden yazılır**
> (temp parola + welcome yerine Person (+uygun Profile/RoleAssignment) + Users daveti);
> `ImportUsers` aynı yeni servise geçer. Uç korunur, web repoint gerekmez.
> Ayrıca `IJwtTokenService`+`JwtTokenService` (son kullanıcı Identity accept ile
> gider), `PermissionReader` legacy claim fallback'i ve `CurrentUser`'ın legacy
> `permissions` okuması bu fazda silinir.
> **(3f)** Kullanıcılar ekranı okuma uçlarının davet korelasyonu (`AccountUserQuery`)
> `db.InvitationTokens`'tan **Users `db.Invitations`'a repoint** edilir (PersonId
> anahtarlı); `UserListDto.invitationStatus` SÖZLEŞMESİ KORUNUR — Users status'u
> mevcut değerlere map edilir (Created/Sent/Opened→Pending). Web dokunulmaz.
> **(3g)** `POST /users` 5-rol sınırına iner (SystemRole'ü olan roller; SuperAdmin
> reddi sürer) — 2026-06-05 MVP rol kararının uygulanması; web modalından MVP-dışı
> idari rol seçenekleri kaldırılır. İdari (SchoolAdmin) kişiye **Staff profili
> otomatik** eklenir (`Person.Activate` ≥1 profil invariant'ı korunur); Gender
> body'ye eklenmez, default ile Person yaratılır (DTO sözleşmesi korunur).
> **(3h)** Legacy davet bildirim kanalları (Email/Sms/WhatsApp channel+dispatcher)
> legacy zincirle silinir; **Users davet bildirimi (UserInvitedEvent handler +
> kanal bağlama) AÇIK BORÇ** olarak kaydedilir — bugün de gönderilmiyor, fiili
> durum değişmez. Anonim `request-refresh` özelliği emekli (Users'ta yalnız
> admin-tetiklemeli resend var).
- `UserCreationService` → **`PersonCreationService`** semantiği: admin "Yeni Kullanıcı" =
  `Person` + uygun `Profile` + `RoleAssignment` + davet. `User.Create` yolu silinir.
- `InvitationToken.PreCreatedUserId` → **`PersonId`** (rename migration): davet doğrudan
  kişiye bağlanır; Faz 1 okuma göçünün "bellek-içi e-posta korelasyonu" zayıflığı da kapanır.
- İki `AcceptInvitation` zinciri (**Modules/Users** — `UserInvitationsController` ve
  **Modules/Identity** — `PublicInvitationsController`) **tek handler'da birleşir**:
  accept → `Account.Create(parola)` → `person.LinkAccount(account.Id)` → `RoleAssignment`
  gerçek Account.Id ile. `InvitationAccountProvisioner` `StudentAccountProvisioner`
  desenine çekilir ya da ortak provisioner'a birleşir (planlamada koda bakılıp karar).
- `BulkCreateInvitation`, `GetInvitationPreview`, `GetExpiredInvitation`,
  `RequestInvitationRefresh`, `SendInvitationNotificationJob` yeni semantiğe repoint.
- **Amendmanla Faz 3'e taşındı:** `IJwtTokenService` + `JwtTokenService` silinir (son tüketici
  AcceptInvitation bu fazda Account token'a geçer) ve `PermissionReader.cs:61-67` legacy
  `permissions` claim fallback'i aynı PR'da kaldırılır (claim'i üreten tek yer JwtTokenService'ti).
- **Web:** `InvitationAcceptPage` accept `onError` → görünür TR hata (409 "hesap zaten
  var" + genel hata; toast/inline).

### Faz 4 — CRUD/okuma (api)

> **Amendman-4 (2026-07-02, onaylı — Faz 4 keşfi öncülleri düzeltti):**
> **(4a)** `PUT /users/{id}` (UpdateUser), `DELETE /users/{id}` (SoftDeleteUser) ve
> `GET /users/me` (GetUserProfile) web+mobilde SIFIR tüketicili (karşılıkları
> Person-eksenli `/users/persons/*` + `/users/self` canlı) → "repoint" yerine
> **üçü de dilimleriyle SİLİNİR** (`UserProfileDto`/`UpdateUserBody` dahil).
> **(4b)** `DeactivateUser` web'de CANLI ("Pasife al") ama **bugün fiilen 404**:
> web `Account.Id` gönderiyor (liste id'si), handler legacy `db.Users`'ta arıyor.
> Repoint = `db.Accounts` + `Account.Suspend(now)` — hem göç hem gerçek bug fix.
> **(4c)** `GetSchoolSettings` UpdatedBy alanı fiilen **Account.Id** taşıyor
> (JWT sub = account.Id; koddaki "User.Id" yorumu bayat) → ad çözümü bugün hep
> null; repoint Account⋈Person join'iyle gerçek düzeltme.
> **(4d)** `IRefreshTokenStore` + iki impl + DI kayıtları TAMAMEN silinir — auth
> zaten `Account` domain koleksiyonunu kullanıyor; SoftDeleteUser (tek tüketici)
> 4a ile gittiğinden port bütünüyle ölü.
- Alan sahipliği: ad/e-posta/telefon → `Person`; aktiflik/kilit → `Account`; yaşam
  döngüsü → `Person.LifecycleState`.
- `UpdateUser` → Person (+ gerekirse Account identifier); `DeactivateUser` →
  `Account.Deactivate`; `SoftDeleteUser` → Person lifecycle + Account deaktivasyon;
  `GetUserProfile` → `Account`⋈`Person` projeksiyonu. DTO sözleşmeleri korunur.
- `GetSchoolSettingsQueryHandler.cs:98` UpdatedBy ad çözümü → `Persons`.
- **Amendmanla Faz 4'e taşındı:** `IRefreshTokenStore` + `RefreshTokenStore` (Redis) +
  `InMemoryRefreshTokenStore` silinir (son tüketici `SoftDeleteUser` bu fazda repoint edilir;
  Faz 2'de `ConfirmPasswordReset`/`ChangePassword` zaten ölmüş olur).
- Not: `GetUserActivity` handler'ı mevcut değil (2026-07-02 keşfiyle doğrulandı) — kapsam dışı.

### Faz 5 — Emeklilik (api + docs)
- `User.cs`, `UserConfiguration`, `DbSet<User>` (`IApplicationDbContext` + `OksisDbContext`),
  kalan tip referansları, ilgili unit testler silinir/taşınır.
- `[identity].[users]` tablosunu düşüren final migration.
- Solution-genelinde legacy tip grep'i = 0 doğrulaması + tüm auth akışları smoke E2E.
- Docs: OQ-identity-001 kapatılır, ADR-001 durumu "Uygulandı" + Aşama 2 sapma notu,
  `identity/completion_status.md` güncellenir (sapma kaydı dahil), memory güncellenir.

## 4. Veri ve şema

- Migration'lar şema değiştirir, veri taşımaz: **Faz 2 (`password_reset_tokens` drop —
  amendman-2b)**, Faz 3 (`pre_created_user_id` → `person_id` rename), Faz 5 (`users` drop).
  *(Amendman: legacy refresh store Redis tabanlı — DB tablosu yok, Faz 1 migration'ı düştü.)*
- Stale `LinkedAccountId` (legacy User.Id) değerleri reseed ile yok olur.
- Prod'da auto-migrate yok (mevcut kural); tüm migration'lar `--idempotent` script üretilebilir.

## 5. Test ve geri dönüş

- **TDD + subagent-driven:** her repoint önce test; ~13 legacy-User test dosyası kendi
  fazında Account⋈Person'a yeniden yazılır ya da handler'la birlikte silinir. Her faz
  `dotnet test` / `vitest` / mobil `typecheck+jest` yeşil olmadan PR'a gitmez.
- **Chrome E2E (faz sonu, canlı dev):**
  - Faz 0-1: login → korumalı sayfa → 401 → sessiz refresh → logout.
  - Faz 2: forgot → token → reset → yeni parolayla login; change-password.
  - Faz 3: "Yeni Kullanıcı"/davet → `/invite/:token` sihirbazı → accept → yeni hesapla
    login; **hata senaryosu:** aynı daveti ikinci kez accept → ekranda TR hata.
  - Faz 4: Kullanıcılar ekranı güncelle/pasife al/soft-delete + profil.
  - Faz 5: tüm auth akışları smoke.
- **Geri dönüş:** faz-başına PR → tek revert; dev DB her an drop+reseed.
- **Riskli noktalar → panzehir:** mobil cold-start repoint (jest + manuel akış); accept
  birleşimi (entegrasyon testi: LinkedAccountId = gerçek Account.Id + RoleAssignment
  doğru); PermissionReader fallback kaldırımı (reseed sonrası eski token kalmaz, E2E kanıtlar).
- Süreç: her faz PR'ı öncesi ayrı review; fix'lerde onaysız commit yok; OKSİS commit formatı.

## 6. Planlamada netleşecekler (tasarımı değiştirmez)

1. `StudentAccountProvisioner` eager-Account davranışı ile "Account accept anında doğar"
   kararının çelişip çelişmediği; gerekiyorsa ortak provisioner tasarımı.
2. ~~Legacy `IRefreshTokenStore`'un DB tablosu var mı~~ **Yanıtlandı (2026-07-02 amendman):**
   yok — Redis/in-memory; drop migration gerekmez.
3. `SendInvitationNotificationJob` repoint'inin Faz 3'te mi Faz 4'te mi yapılacağı
   (davet semantiği Faz 3'te değiştiğinden büyük olasılıkla Faz 3).
4. İki AcceptInvitation zincirinin tekilleştirmede hangi controller ucunun kalacağı
   (public `/invite` sözleşmesi korunur).

## 7. Keşif kanıtları (2026-07-02 doğrulaması)

- Legacy uçlar: `AuthController.cs` — login:53, refresh:118, revoke:134, reset-password:148,
  confirm-reset:157; hepsi `db.Users` okuyan handler'lara gidiyor (revoke hariç — yalnız
  `IRefreshTokenStore`).
- `InvitationAccountProvisioner.cs:40-46` — `User.Create` + `db.Users.Add`; dönen
  "AccountId" aslında legacy User.Id → `AcceptInvitationCommandHandler` (Users):132
  `person.LinkAccount(legacy User.Id)`, :137 `RoleAssignment.Create(..., legacy User.Id)`.
- İkinci legacy accept: `Modules/Identity/Commands/AcceptInvitation/...:94-108`
  (`PublicInvitationsController:76`).
- `UserCreationService.cs:57-66` — `User.Create` + `db.Users.Add` (admin `POST /users`).
- `InvitationToken.PreCreatedUserId` (`InvitationToken.cs:20`) — açık FK yok, gevşek Guid;
  set eden: `BulkCreateInvitationCommandHandler.cs:73`.
- İstemci fallback'leri: web `refreshTokenManager.ts:56`, mobil `client.ts:94`,
  mobil cold-start `auth.api.ts:22`.
- Identity dışı `db.Users`: `GetSchoolSettingsQueryHandler.cs:98`,
  `SendInvitationNotificationJob.cs:91`; tip refs: `IApplicationDbContext.cs:46`,
  `IJwtTokenService.cs:7`.
- `PermissionReader.cs:62-67` — legacy `permissions` claim fallback.
