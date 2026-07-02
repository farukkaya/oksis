# Legacy User Emeklilik — Faz 4 (CRUD/Okuma) Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Son legacy `db.Users` tüketicilerini bitirmek: `DeactivateUser`'ı Account'a repoint (canlı 404 bug'ı da düzelir), `GetSchoolSettings` UpdatedBy ad çözümünü Account⋈Person'a taşımak, tüketicisiz üç ucu dilimleriyle silmek, ölü `IRefreshTokenStore` portunu kaldırmak.

**Architecture:** Amendman-4a..4d bağlayıcı. Yalnız oksis-api. **Stacked branch:** `legacy-user-faz4-crud` ← `legacy-user-faz3-davet` (@6bb4447; Faz 3 PR'ları henüz merge edilmedi — kullanıcı kararı). Faz 3 merge olunca bu PR master'a sadeleşir.

**Tech Stack:** .NET 10; migration YOK (şema değişmiyor — tablo drop'u Faz 5).

## Global Constraints

- Spec: `legacy-user-emeklilik-design.md` amendman-4a..4d.
- **DOKUNULMAZ:** `Account` domain'inin auth koleksiyonu (IssueRefreshToken/Rotate/RevokeAll), `SelfController`/`/users/self`, Person-eksenli uçlar, ListUsers/Export/Stats (Faz 1-3 halleri), `User` entity+config+DbSet (Faz 5 silecek — bu fazda derlenmeye devam eder).
- Commit: OKSİS formatı + `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`; `dotnet format` FOREGROUND (ilgisiz BOM değişikliklerini revert).
- Bilinen pre-existing fail: `PersonDirectoryChildrenIntegrationTests` FK.
- Branch: `legacy-user-faz4-crud` (from `legacy-user-faz3-davet`).

---

### Task 1: `DeactivateUser` → Account repoint (TDD; canlı 404 fix)

**Files:**
- Modify: `src/Oksis.Application/Modules/Identity/Commands/DeactivateUser/DeactivateUserCommandHandler.cs` (`db.Users` → `db.Accounts.FirstOrDefaultAsync(a => a.Id == request.UserId)`; yoksa `UserErrors.NotFound`; `account.Suspend(now)` — now-kaynağı için komşu handler'ların desenine bak; Save)
- Test: YENİ `tests/Oksis.Application.UnitTests/Modules/Identity/Commands/DeactivateUserCommandHandlerTests.cs` (bugüne dek test YOKTU)

- [ ] **Step 1:** Branch: `cd oksis-api && git checkout legacy-user-faz3-davet && git pull && git checkout -b legacy-user-faz4-crud`
- [ ] **Step 2 (RED):** Testler: (a) var olan Account.Id ile → `account.IsActive == false` + Success; (b) olmayan id → NotFound; (c) zaten pasif hesap → tekrar çağrı davranışı (`Account.Suspend` gövdesine göre idempotent Success beklenir — koda bak, gerçeği assert et). Mevcut handler `db.Users` kullandığından (a) FAIL etmeli.
- [ ] **Step 3 (GREEN):** Handler'ı repoint et; command/route/permission (`users.update`) AYNEN kalır (web sözleşmesi değişmez).
- [ ] **Step 4:** `dotnet build && dotnet test tests/Oksis.Application.UnitTests` → PASS. `dotnet format` + commit: `2026-07-02 fix,refactor,test: DeactivateUser Account'a repoint edildi — 'Pasife al' 404 bug'ı düzeldi (legacy User emeklilik Faz 4, amendman-4b).`

### Task 2: `GetSchoolSettings` UpdatedBy → Account⋈Person

**Files:**
- Modify: `src/Oksis.Application/Modules/Schools/Queries/GetSchoolSettings/GetSchoolSettingsQueryHandler.cs` (~:95-103: `db.Users` sorgusu yerine Account→PersonId→Person adı çözümü; `Person.Name` VO'sunun EF-çevrilebilir ad projeksiyonu için `PersonDirectory`'nin FirstName/LastName projeksiyon desenini kopyala; bayat "UpdatedBy = User.Id" yorumunu "Account.Id (JWT sub)" gerçeğiyle değiştir)
- Test: `tests/Oksis.Application.UnitTests/Modules/Schools/Queries/GetSchoolSettingsQueryHandlerTests.cs` — YENİ test: `settings.UpdatedBy = account.Id` iken `updatedByName` dolu döner (mevcut testler yalnız null senaryosunu kapsıyordu)

- [ ] **Step 1 (RED):** Yeni test: Account+Person fixture'ı, UpdatedBy=account.Id → beklenen `updatedByName == "Ad Soyad"`. FAIL (mevcut kod db.Users'ta arıyor).
- [ ] **Step 2 (GREEN):** Join repoint + yorum düzeltme; mevcut null-senaryolu testler aynen geçmeli.
- [ ] **Step 3:** Build + Application.UnitTests → PASS. `dotnet format` + commit: `2026-07-02 fix,refactor,test: SchoolSettings güncelleyen adı Account⋈Person'dan çözülüyor — UpdatedBy fiilen Account.Id (Faz 4, amendman-4c).`

### Task 3: Tüketicisiz üç uç + `IRefreshTokenStore` sökümü

**Files (SİLİNİR):**
- `src/Oksis.Application/Modules/Identity/Commands/UpdateUser/` (Command+Handler+Validator)
- `src/Oksis.Application/Modules/Identity/Commands/SoftDeleteUser/` (Command+Handler)
- `src/Oksis.Application/Modules/Identity/Queries/GetUserProfile/` (Query+Handler)
- `src/Oksis.Application/Modules/Identity/DTOs/UserProfileDto.cs`
- `tests/Oksis.Application.UnitTests/Modules/Identity/Commands/SoftDeleteUserCommandHandlerTests.cs`
- `src/Oksis.Application/Common/Abstractions/IRefreshTokenStore.cs` (+`RefreshValidationResult`)
- `src/Oksis.Infrastructure/Identity/RefreshTokenStore.cs`, `src/Oksis.Infrastructure/Identity/InMemoryRefreshTokenStore.cs`

**Files (EDİT):**
- `src/Oksis.Api/Controllers/V1/UsersController.cs` — `GET /me` (~:162-168), `PUT /{id}` (~:183-191), `DELETE /{id}` (~:193-201) action'ları + ilgili using'ler; `UpdateUserBody` record'u (bulunduğu contract dosyasında)
- `src/Oksis.Infrastructure/DependencyInjection.cs` — IRefreshTokenStore kayıtları (~:216, :241, :255)

- [ ] **Step 1:** `git rm` + controller action'ları + DI satırları + `UpdateUserBody` sil.
- [ ] **Step 2:** `dotnet build` — FAIL veren dosya beklenmedik tüketici: DOKUNULMAZ setindeyse yalnız silinen-tip referansını temizle, kararsızsan BLOCKED.
- [ ] **Step 3:** Tam `dotnet test` (Docker up) → bilinen FK fail'i dışında yeşil. Grep doğrulama: `IRefreshTokenStore|UserProfileDto|SoftDeleteUser|UpdateUserCommand` üretimde sıfır; **`db.Users` üretimde SIFIR** (Faz 5 ön-kapı kanıtı) — kalan varsa listele, beklenmedikse BLOCKED.
- [ ] **Step 4:** `dotnet format` + commit: `2026-07-02 refactor: Tüketicisiz UpdateUser/SoftDeleteUser/GetUserProfile uçları ve ölü IRefreshTokenStore portu söküldü (Faz 4, amendman-4a/4d).`

### Task 4: Kapanış — E2E + PR (stacked) + docs

- [ ] **Step 1:** API'yi bu branch'ten başlat (`nohup dotnet run --project src/Oksis.Api > /tmp/oksis-api-faz4.log 2>&1 &`) + web dev (`legacy-user-faz3-davet` branch'inde, `npm run oksis:dev`). **Chrome E2E:** admin login → Kullanıcılar → bir kullanıcıyı **"Pasife al"** → ağda `POST /users/{id}/deactivate` **204** (artık 404 değil) → pasife alınan hesabın kimlik bilgisiyle login dene → **reddedilir** (Account.Suspend → EnsureActive) → listede durum Pasif/Inactive. Curl: `PUT /users/<guid>` → 404/405, `GET /users/me` → 404, `DELETE /users/<guid>` → 404/405.
- [ ] **Step 2:** PR: `gh pr create --base legacy-user-faz3-davet --head legacy-user-faz4-crud` (stacked; Faz 3 merge olunca base master'a çevrilir). Body: özet + amendman-4 + E2E kanıtı + "merge sırası: web#64 → api#33 → bu PR" + footer.
- [ ] **Step 3:** Docs: identity `completion_status.md` Faz 4 kaydı (404 fix + UpdatedBy fix vurgulu) + README `Last Updated`; ledger; memory güncelle. Workspace commit+push.
