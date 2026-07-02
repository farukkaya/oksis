# Legacy User Emeklilik — Faz 3 (Davet + Kullanıcı Oluşturma) Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Legacy Identity davet/kullanıcı-oluşturma dünyasını (User-merkezli `InvitationToken` zinciri + `IJwtTokenService`) kalıntısız söküp Person-merkezli Users zincirini tek yol yapmak; `InvitationAccountProvisioner`'ı gerçek `Account.Create`'e çevirmek; `POST /users`'ı Person+davet akışına yeniden yazmak; web ölü davet modülü + onError fix.

**Architecture:** Yaklaşım A (repoint+sil aynı fazda), amendman-3a..3h bağlayıcı. Sıralama kritik: önce provisioner fix + read-path repoint (Task 1-2), sonra `POST /users` rewrite (Task 3), sonra legacy zincir sökümü (Task 4), en son domain+tablo drop (Task 5). Keşif kanıtları: 2026-07-02 Faz 3 keşif raporları (2 tur).

**Tech Stack:** .NET 10 + EF Core migration, React+vitest.  Mobil bu fazda YOK.

## Global Constraints

- Spec: `.claude/specs/legacy-user-emeklilik-design.md` amendman-3a..3h — bağlayıcı; sapma önce kullanıcıya.
- **DOKUNULMAZ:** Users davet zinciri (`Invitation` aggregate + `UserInvitationsController` + Create/Bulk/Resend/Revoke/Accept dilimleri + `InvitationCreationHelper` + `IInvitationTokenFactory` + `ExpireStaleInvitationsJob`); `StudentAccountProvisioner` + öğrenci enroll akışı (amendman-3d istisnası); `IAccountTokenIssuer`/Account auth altyapısı; `IRefreshTokenStore` (Faz 4); `AccountUserProjection` rol/durum türetimi (yalnız davet korelasyonu değişir).
- **DTO sözleşmeleri KORUNUR:** `UserListDto`/`UserStatsDto`/export kolonları (invitationStatus mevcut değer kümesiyle: Pending/Accepted/Expired/Revoked — Users Created/Sent/Opened→Pending map'i); `CreateUserBody` (Email/FirstName/LastName/Role) ve `POST /users → Guid` dönüşü (artık PersonId).
- Commit: api+web OKSİS formatı + `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`; api'de `dotnet format` (ilgisiz BOM değişikliklerini revert et); web test script `npm run oksis:test`.
- Branch (api+web): `legacy-user-faz3-davet`. Tarih öneki: gerçek tarih.
- Her taskta build+ilgili süit yeşil olmadan commit yok; bilinen pre-existing fail'ler: api `PersonDirectoryChildrenIntegrationTests` FK, web 6 settings/timetable.

---

## oksis-api

### Task 1: `InvitationAccountProvisioner` → gerçek `Account.Create` (TDD)

**Files:**
- Modify: `src/Oksis.Application/Common/Abstractions/IAccountProvisioner.cs` (imza: `ProvisionFromInvitationAsync(Guid schoolId, Guid personId, string plainPassword, CancellationToken ct)`; `AccountProvisionOutcome(bool Succeeded, Guid? AccountId, string? ErrorCode)` şekli korunur; `AccountProvisionErrorCodes.EmailAlreadyExists` → `AccountAlreadyExists`, `EmailMissing` kalkar)
- Modify: `src/Oksis.Application/Modules/Identity/Services/InvitationAccountProvisioner.cs` (gövde: `db.Accounts.AnyAsync(a => a.PersonId == personId)` guard → `AccountAlreadyExists`; `Account.Create(schoolId, personId, PasswordHash.FromEncoded(hasher.Hash(plainPassword)), requirePasswordChange: false)` — kullanıcı parolasını KENDİSİ belirledi; `db.Accounts.Add`; `IPasswordHasher` kalır)
- Modify: `src/Oksis.Application/Modules/Users/Commands/AcceptInvitation/AcceptInvitationCommandHandler.cs` (~108: çağrı yeni imzaya — `invitation.SchoolId, person.Id, request.Password`; `MapRole`/email/ad-soyad parametreleri düşer; `AccountAlreadyExists` → mevcut "hesap zaten var" hata yolu; `MapRole` başka kullanıcısı yoksa silinir)
- Test: `tests/Oksis.Application.UnitTests/Modules/Users/Commands/AcceptInvitationCommandHandlerTests.cs` (mevcutları yeni imzaya uyarla) + YENİ `tests/.../Modules/Identity/Services/InvitationAccountProvisionerTests.cs`

- [ ] **Step 1:** Branch: `cd oksis-api && git checkout master && git pull && git checkout -b legacy-user-faz3-davet`
- [ ] **Step 2 (RED):** Yeni provisioner testini yaz: (a) başarı → `db.Accounts`'a eklenen kaydın `PersonId/SchoolId` doğru + `RequirePasswordChange=false` + outcome.AccountId == account.Id; (b) `PersonId` için Account zaten varsa → `Succeeded=false, ErrorCode=AccountAlreadyExists`, Accounts'a ekleme yok. Çalıştır → derleme hatası/FAIL beklenir.
- [ ] **Step 3 (GREEN):** Arayüz + provisioner + handler çağrısını yaz; testler geçsin. Handler testlerini uyarla.
- [ ] **Step 4:** `dotnet build && dotnet test tests/Oksis.Application.UnitTests` → PASS. Kanıt: accept sonrası `Person.LinkedAccountId` artık gerçek `Account.Id` (handler testi assert'i ekle).
- [ ] **Step 5:** `dotnet format` + commit: `2026-07-02 fix,refactor: InvitationAccountProvisioner gerçek Account.Create'e geçti — Person.LinkedAccountId artık Account.Id (legacy User emeklilik Faz 3, amendman-3a).`

### Task 2: Kullanıcılar okuma uçlarının davet korelasyonu → Users `Invitations` (DTO korunarak)

**Files:**
- Modify: `src/Oksis.Application/Modules/Identity/Queries/Shared/AccountUserQuery.cs` (`LoadLatestInvitationsByEmailAsync` → `LoadLatestInvitationsByPersonAsync`: `db.Invitations` üzerinden, anahtar `(SchoolId, PersonId)`, en güncel = `CreatedAt desc`; `LatestInvitationSummary` alanları korunur ama `Status` map'lenmiş legacy-değer olarak döner: Created/Sent/Opened→Pending, Accepted→Accepted, Expired→Expired, Revoked→Revoked; `ResolveInvitation` imzası person-anahtarına geçer)
- Modify: `ListUsersQueryHandler.cs` (:36/:49/:144/:154-157), `GetUserStatsQueryHandler.cs` (:47/:62-63 — pending sayımı `IsActive` semantiği = map sonrası Pending), `ExportUsersQueryHandler.cs` (:71/:78-84/:105/:115), `ListUsers/InvitationStatusFilter.cs` (cast'ler map'e hizalı kalır — DTO değer kümesi DEĞİŞMEZ)
- Test: `ListUsersQueryHandlerTests` / `GetUserStatsQueryHandlerTests` / `ExportUsersQueryHandlerTests` (InvitationToken fixture'ları Users `Invitation`'a çevrilir) + `Infrastructure.IntegrationTests/Identity/ListUsersAccountModelIntegrationTests.cs` (seed repoint)

- [ ] **Step 1 (test-first):** Okuma testlerinden birinde (ListUsers) Users `Invitation` fixture'lı yeni beklentiyi yaz (Sent→Pending map dahil) → RED.
- [ ] **Step 2:** `AccountUserQuery` + üç handler + filter'ı repoint et → GREEN. Kişisiz e-posta korelasyonu tamamen kalkar (davet artık PersonId'li).
- [ ] **Step 3:** `dotnet build && dotnet test` (tam süit; integration dahil) → bilinen FK fail'i dışında yeşil. Grep: `db.InvitationTokens` üretim kodunda YALNIZ silinecek legacy dilimlerde kalmalı (Task 4-5 listesi) — başka eşleşme çıkarsa DUR.
- [ ] **Step 4:** `dotnet format` + commit: `2026-07-02 refactor,test: Kullanıcılar okuma uçlarının davet korelasyonu Users Invitations'a taşındı (PersonId anahtarlı, DTO status map'li) (Faz 3, amendman-3f).`

### Task 3: `POST /users` → Person + davet akışı (ImportUsers dahil)

**Files:**
- Create: `src/Oksis.Application/Modules/Users/Services/PersonUserCreationService.cs` (yeni `ICreateUserService` impl)
- Modify: `src/Oksis.Application/Common/Abstractions/ICreateUserService.cs` (sözleşme aynı kalır: `CreateAsync(schoolId, email, firstName, lastName, role, ct) → CreateUserOutcome(Succeeded, UserId?, ErrorCode?)` — `UserId` artık **PersonId** taşır; XML doc güncellenir)
- Delete: `src/Oksis.Application/Modules/Identity/Services/UserCreationService.cs`
- Modify: `src/Oksis.Application/DependencyInjection.cs` (:46 kayıt yeni servise)
- Test: YENİ `PersonUserCreationServiceTests` + mevcut `CreateUser`/`ImportUsers` handler testleri (varsa — keşifte ayrı dosya görünmedi; yoksa handler'lar için asgari test ekle)

**Akış (servis içinde, tek SaveChanges):**
1. Rol doğrula: `UserRole → MasterSeedIds.Roles` haritası (SchoolAdmin/Teacher/Parent/Student; SuperAdmin ve haritasız roller → `RoleNotSupported` yeni hata kodu). (amendman-3g)
2. Duplicate: aynı `PrimaryEmail`'li Person (tenant içinde) varsa `EmailAlreadyExists`.
3. `Person.Create(...)` — Draft, default Gender (enum'daki nötr/ilk değer; `CreatePersonCommandHandler`'daki kurulum deseniyle aynı), `PrimaryEmail` set.
4. Profil ekle (Activate invariant'ı için, amendman-3g): SchoolAdmin→`ProfileType.Staff`; Teacher/Parent/Student→ilgili minimal profil (`ProfileBuilder.Build` — `CreatePersonCommandHandler`'ın kullandığı yol).
5. Davet: `ICurrentSessionProvider.GetCurrentSessionIdOrNullAsync` → null ise `NoActiveSeason` hata kodu; `db.ConsentBundles.FirstOrDefaultAsync(b => b.IsCurrent)` → null ise `NoConsentBundle`; `InvitationCreationHelper.CreateForPersonAsync(db, schoolId, person, targetSystemRoleId, seasonId, InvitationChannel.Email, expiresInDays: mevcut Users default'u, bundle.Version, tokenFactory, now, batchId: null, ct)`.
6. `SaveChangesAsync` → `CreateUserOutcome(true, person.Id, null)`.

- [ ] **Step 1 (RED):** `PersonUserCreationServiceTests`: (a) SchoolAdmin → Person+Staff profil+Invitation yaratılır, outcome.UserId=PersonId; (b) Teacher → Teacher profil; (c) SuperAdmin → RoleNotSupported; (d) duplicate email → EmailAlreadyExists; (e) aktif sezon yok → NoActiveSeason. Çalıştır → FAIL.
- [ ] **Step 2 (GREEN):** Servisi yaz, DI'ı çevir, eski `UserCreationService`'i sil. `CreateUserCommandHandler`/`ImportUsersCommandHandler` DOKUNULMADAN yeni servisle çalışır (tek bağımlılık noktası — keşif §6).
- [ ] **Step 3:** `dotnet build && dotnet test tests/Oksis.Application.UnitTests` → PASS; `SendWelcomeAsync`/`IInvitationService` referansı üretimde kalmadığını grep'le doğrula (Task 4 silecek).
- [ ] **Step 4:** `dotnet format` + commit: `2026-07-02 feat,refactor: POST /users Person+davet akışına geçti — PersonUserCreationService (5-rol sınırı, Staff profili, aktif sezon+consent bundle) (Faz 3, amendman-3e/3g).`

### Task 4: Legacy Identity davet zinciri + `IJwtTokenService` + fallback sökümü

**Files (SİLİNİR — keşif §5 envanteri birebir):**
- Controllers: `InvitationsController.cs`, `PublicInvitationsController.cs`; Contracts: `Contracts/Identity/InvitationBodies.cs`
- Identity dilimleri (klasörleriyle): `Commands/AcceptInvitation/`, `Commands/BulkCreateInvitation/`, `Commands/CreateInvitation/`, `Commands/RequestInvitationRefresh/`, `Commands/RevokeInvitation/`, `Queries/GetInvitationPreview/`, `Queries/GetExpiredInvitation/`
- DTOs: `ExpiredInvitationDto.cs`, `InvitationCreatedDto.cs`, `InvitationPreviewDto.cs`; Errors: `InvitationErrors.cs`, `BulkInvitationSkipReasons.cs`
- Services/Abstractions: `InvitationCreationService.cs`+`IInvitationCreationService.cs`, `IInvitationLinkBuilder.cs`, `IInvitationRefreshNotifier.cs`, `IInvitationService.cs`, `IInvitationNotificationSender.cs`, Identity `IInvitationNotificationChannel.cs`+`IInvitationNotificationDispatcher.cs`+`InvitationNotification.cs`
- Infrastructure: `SendInvitationNotificationJob.cs`, `Identity/InvitationService.cs` (+InvitationEmailJob), `Identity/InvitationLinkBuilder.cs`, `Identity/InvitationRefreshNotifier.cs`, `Identity/InvitationOptions.cs` (başka tüketicisi olmadığını doğrula), `Notifications/Invitations/` beş dosya (amendman-3h)
- JWT: `Identity/JwtTokenService.cs`, `Abstractions/IJwtTokenService.cs` (TokenPair dahil — başka tüketici kalmadığını build kanıtlar)
- Fallback'ler: `PermissionReader.cs` legacy `permissions` bloğu (~60-67) + sınıf doc notu; `CurrentUser.cs` `Permissions`+`HasPermission` üyeleri + `ICurrentUser` arayüzünden kaldır
- DI satırları: Application `:41` (+`:46` Task 3'te değişti), Infrastructure `:133, :150, :153, :154, :155, :156, :158, :179-185` (+`InvitationOptions` config bind)
- Testler (SİLİNİR): keşif §5 test listesi (InvitationsController/PublicInvitationsController testleri, Identity davet dilim testleri, `SendInvitationNotificationJobTests`, `PublicInvitation{Expired,Preview}IntegrationTests`, `Notifications/Invitation*Tests` ×3; `Persistence/AcceptInvitationIntegrationTests.cs` Identity'ye aitse sil, Users'a aitse KALIR — dosyayı aç, bak)

- [ ] **Step 1:** `git rm` envanteri; DI satırlarını temizle; PermissionReader+CurrentUser fallback'lerini kaldır.
- [ ] **Step 2:** `dotnet build` → FAIL veren her dosya beklenmedik tüketici: DOKUNULMAZ listesindeyse yalnız silinen-tip referansını temizle; kararsızsan BLOCKED.
- [ ] **Step 3:** `dotnet test` (tam) → bilinen FK fail'i dışında yeşil. Grep doğrulama: `IJwtTokenService|InvitationCreationService|PublicInvitations|"permissions"` üretim kodunda sıfır (permissions: yalnız tablo/route adları kalabilir — `FindAll("permissions")` kalmamalı).
- [ ] **Step 4:** `dotnet format` + commit: `2026-07-02 refactor: Legacy Identity davet zinciri, IJwtTokenService ve legacy permissions fallback'leri söküldü (Faz 3, amendman-3b).`

### Task 5: `InvitationToken` domain + `invitation_tokens` drop migration

**Files:**
- Delete: `Domain/Modules/Identity/Entities/InvitationToken.cs`, Identity `Enums/InvitationStatus.cs` + `Enums/InvitationChannel.cs` (başka tüketici kalmadıysa — Task 2 sonrası read-path map'i kendi sabitlerini kullanmalı; kalan tüketici varsa BLOCKED değil, o dosyada Users enum'una geç), `Events/Invitation{Created,Accepted,Revoked}Event.cs` (tüketicisiz — keşif kanıtlı), `InvitationTokenConfiguration.cs`, `Domain.UnitTests/.../InvitationTokenTests.cs`, `Infrastructure.IntegrationTests/Persistence/InvitationTokenPersistenceTests.cs`
- Modify: `IApplicationDbContext.cs` + `OksisDbContext.cs` DbSet satırları
- Create: migration `20260702_drop_invitation_tokens` (Up yalnız `DropTable("invitation_tokens", schema: ...)` — tablo şeması keşif: `20260524121808_20260524_add_invitation_tokens`; `invitations` (Users) tablosuna DOKUNMAMALI)

- [ ] **Step 1:** Sil + DbSet'leri kaldır → `dotnet build` PASS.
- [ ] **Step 2:** Migration üret + OKU (Up tek DropTable; fazlası = model drift → BLOCKED) → `ef database update` → `dotnet test` tam süit.
- [ ] **Step 3:** Kalıntı grep: `InvitationToken` üretim kodunda sıfır (Users `IInvitationTokenFactory`/`InvitationTokenFactory` adları HARİÇ — farklı tip, kalır).
- [ ] **Step 4:** `dotnet format` + commit: `2026-07-02 refactor,db: InvitationToken domain'i silindi, invitation_tokens drop migration'ı eklendi (Faz 3, amendman-3c).`

---

## oksis-web

### Task 6: Ölü davet modülü + MVP-dışı roller + accept onError fix

**Files:**
- Delete: `src/modules/invitations/` (tümü — hiçbir yerden import edilmiyor, keşif kanıtlı; sil ve grep'le teyit et)
- Modify: `src/portals/admin/parents/api/parentsDebtApi.ts` (~101-105 legacy `/invitations/resend` mock path'i → Users eşdeğeri veya kaldır; DebtBadge davranışı korunur)
- Modify: `src/portals/admin/users/components/modals/InviteUserModal.tsx` (rol listesi `:11` — MVP-dışı Accountant/Secretary/SchoolStaff çıkar; SchoolAdmin kalır; gerekiyorsa Teacher/Parent/Student eklenmez — modal idari hesap içindir) + `portals/admin/pages/users/InviteAccountModal.tsx` (aynı temizlik `:30-35`)
- Modify: `src/portals/public/pages/invitations/InvitationAcceptPage.tsx` (~111-126): `accept.mutate(..., { onSuccess, onError })` — `onError` eklenir: 409/`InvitationPersonInvalidState` → "Bu davet için hesap zaten oluşturulmuş" benzeri i18n mesaj; 410 → süresi dolmuş ekranına; diğer → genel hata. Görünür inline alert (sayfadaki preview-hata desenleriyle aynı görsel dil, `data-testid="accept-error"`). i18n tr+en.
- Test: `InvitationAcceptPage.test.tsx` (+onError senaryosu: accept 409 → hata görünür), modal testleri (rol listesi), silinen modül testleri gider.

- [ ] **Step 1:** Branch: `cd oksis-web && git checkout master && git pull && git checkout -b legacy-user-faz3-davet`
- [ ] **Step 2 (RED):** InvitationAcceptPage testine "accept 409 döner → `accept-error` görünür + TR mesaj" testi ekle → FAIL.
- [ ] **Step 3 (GREEN):** onError + alert + i18n; modül silme + modal rol temizliği + parentsDebtApi.
- [ ] **Step 4:** `npm run oksis:test && npm run build` → bilinen 6 fail dışında yeşil. Grep: `'/invitations'` (users-prefix'siz) üretimde sıfır.
- [ ] **Step 5:** Commit: `2026-07-02 refactor,fix,test: Ölü legacy davet modülü silindi, MVP-dışı roller modallardan çıkarıldı, davet kabul hatası ekranda gösteriliyor (Faz 3; davet-hata borcu kapandı).`

---

## Kapanış

### Task 7: Chrome E2E + 2 PR + docs

- [ ] **Step 1:** API+web'i başlat (`nohup dotnet run ...`, `npm run oksis:dev`). Curl ön kontrol: `POST /api/v1/public/invitations/x/accept` + `POST /api/v1/invitations/bulk` → 404; `GET /api/v1/users/invitations` (Bearer'lı) → 200.
- [ ] **Step 2 (Chrome E2E — form etkileşiminde curl fallback serbest, RHF-extension sürtünmesi bilinir):**
  1. Admin login → Kullanıcılar → Yeni Kullanıcı (SchoolAdmin) → oluştur → listede kişi + davet rozeti (Pending) görünür; ağda `POST /users` 2xx.
  2. Davetler ekranından (veya doğrudan API'den) davet token'ı al → `/invite/:token` → sihirbaz → parola → accept → success ekranı → login'e dön → **yeni hesapla login** ✓ (bu, provisioner fix'inin canlı kanıtı: yeni Account ile giriş; ayrıca DB'de `persons.linked_account_id`'nin `accounts.id`'ye eşit olduğunu sorgula/curl-me-context ile doğrula).
  3. **Hata senaryosu:** aynı daveti ikinci kez accept → ekranda görünür TR hata (`accept-error`) ✓ (onError fix kanıtı).
  4. Kullanıcılar listesi davet rozetleri/istatistikleri doğru (repoint kanıtı).
- [ ] **Step 3:** Son süit turu (api tam + web) → PR'lar: api + web (`legacy-user-faz3-davet`), body'de spec/amendman linki + E2E kanıtı + footer. Merge sırası: **önce web, sonra api** — kullanıcı onayıyla.
- [ ] **Step 4:** Docs: `identity/completion_status.md` Faz 3 kaydı (+ "Users davet bildirimi UserInvitedEvent handler'sız — açık borç" amendman-3h notu + davet-hata borcunun kapandığı) + README; `users` modülü completion_status'a da davet zinciri tekilleşmesi notu; ledger; memory (`project-invite-accept-error-debt` kapanır). Workspace commit+push.
