# Legacy User Emeklilik — Faz 5 (Final Emeklilik) Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Legacy `identity.User` modelini kalıntısız emekliye ayırmak: `User.cs` entity + `UserConfiguration` + `DbSet<User>` + 5 tüketicisiz `User*` domain event'i + 2 legacy testi silinir; `[identity].[users]` tablosu drop migration'ıyla düşürülür; ADR-001/OQ-identity-001 kapatılır.

**Architecture:** Tasarım `legacy-user-emeklilik-design.md` §3 "Faz 5" bağlayıcı. Yalnız oksis-api. Üretim kodunda `db.Users` tüketimi Faz 4'te ZERO'landı — bu faz mekanik söküm + tek şema-drop migration'ı. **Stacked branch:** `legacy-user-faz5-emeklilik` ← `legacy-user-faz4-crud` (@c3650ee; Faz 3+4 PR'ları henüz merge edilmedi — kullanıcı kararı). Faz 3+4 merge olunca bu PR master'a sadeleşir.

**Tech Stack:** .NET 10, EF Core 10; migration şema değiştirir veri taşımaz (`users` DROP).

## Global Constraints

- Spec `legacy-user-emeklilik-design.md` §3 "Faz 5 — Emeklilik" + §4 "Veri ve şema" bağlayıcı.
- **`TreatWarningsAsErrors=true`** (Directory.Build.props:6) — silinen `User` tipine kalan `<see cref>` doc referansları CS1574 ile build'i KIRAR; hepsi düzeltilmeli.
- **YAŞAYAN, DOKUNULMAZ tipler** (User entity'sinden ayrışır, silinmez): `UserRole` enum (`Domain/Modules/Identity/Enums/UserRole.cs` — ListUsers/ExportUsers/CreateUser/ImportUsers/UserListDto/UserDetailDto/AccountUserProjection/PersonUserCreationService yüzeyinin tümü kullanıyor), `UserStatus` enum (`Domain/Enums/UserStatus.cs`), Identity `InvitationStatus` enum (UserListDto kullanıyor), `Account`/`Person`/`RoleAssignment` ve tüm auth koleksiyonu.
- **Migration Designer.cs snapshot'ları TARİHSEL — dokunulmaz.** Yalnız `OksisDbContextModelSnapshot.cs` (güncel model) EF tarafından drop migration'ıyla otomatik güncellenir.
- Commit: OKSİS formatı + `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`; `dotnet format` FOREGROUND (bekle, arka plana ALMA; ilgisiz BOM/whitespace değişikliklerini revert et).
- Bilinen pre-existing fail: `PersonDirectoryChildrenIntegrationTests` FK (Faz 5 kapsamı dışı).
- Prod'da auto-migrate yok (mevcut kural); migration `--idempotent` script üretilebilir olmalı.

---

### Task 1: Legacy `User` entity + config + DbSet + event söküm (build green)

**Goal:** `User` tipini ve yalnız-ona-bağlı 5 event'i + 2 testi silmek, `DbSet<User>`'ı iki context'ten kaldırmak, kırılacak 2 doc cref'ini düzeltmek. Bu görev sonunda çözüm derlenir ve testler yeşildir (henüz migration YOK — model artık `User`'ı içermez, snapshot Task 2'de güncellenecek).

**Files (SİLİNİR — `git rm`):**
- `src/Oksis.Domain/Modules/Identity/Entities/User.cs`
- `src/Oksis.Infrastructure/Persistence/Configurations/Identity/UserConfiguration.cs`
- `src/Oksis.Domain/Modules/Identity/Events/UserCreatedEvent.cs`
- `src/Oksis.Domain/Modules/Identity/Events/UserPasswordChangedEvent.cs`
- `src/Oksis.Domain/Modules/Identity/Events/UserLockedOutEvent.cs`
- `src/Oksis.Domain/Modules/Identity/Events/UserDeletedEvent.cs`
- `src/Oksis.Domain/Modules/Identity/Events/UserActivatedEvent.cs`
- `tests/Oksis.Domain.UnitTests/Modules/Identity/Entities/UserTests.cs`
- `tests/Oksis.Infrastructure.IntegrationTests/Persistence/UserTenantFilterTests.cs`

**Files (EDİT):**
- `src/Oksis.Application/Common/Abstractions/IApplicationDbContext.cs` — satır ~45-46: `// Identity tenant data` yorumu + `DbSet<User> Users { get; }` satırını sil (üstteki gruplama yorumu artık boşsa onu da temizle; alttaki `// Identity Account aggregate` bloğu kalır).
- `src/Oksis.Infrastructure/Persistence/OksisDbContext.cs` — satır ~53: `public DbSet<User> Users => Set<User>();` satırını sil.
- `src/Oksis.Application/Modules/Identity/DTOs/UserListDto.cs` — iki kırık cref:
  - `<see cref="Domain.Modules.Identity.Entities.User.LastLoginAt"/>` → `<see cref="Domain.Modules.Identity.Entities.Account.LastLoginAt"/>` (alan artık Account'tan gelir; `Account.LastLoginAt` mevcut).
  - `<see cref="Domain.Modules.Identity.Entities.User.Role"/>` → düz metne çevir: `birincil hesap rolü (<c>UserRole</c>)` (User.Role artık yok; UserRole enum'ı yaşar).
  - `Domain.Modules.Identity.Entities.User` kullanan başka cref kalmadığını dosya-içi doğrula.

- [ ] **Step 1:** Branch: `cd oksis-api && git checkout legacy-user-faz4-crud && git checkout -b legacy-user-faz5-emeklilik`
- [ ] **Step 2 (ön-doğrulama):** 5 event'in tüketicisiz olduğunu teyit et — her biri için `grep -rln "\b<EventName>\b" src/ tests/ --include="*.cs"` yalnız kendi tanım dosyasını (ve `User.cs`'i) döndürmeli. Beklenmedik tüketici çıkarsa BLOCKED (event'i silme, kullanıcıya bildir). Not: `UserCreatedEvent` `UserRole` kullanır — bu event silindiği için sorun değil, ama `UserRole` enum'ı SİLİNMEZ.
- [ ] **Step 3:** `git rm` ile 9 dosyayı sil; iki context'ten `DbSet<User>` satırlarını + IApplicationDbContext'teki artık-boş gruplama yorumunu kaldır; UserListDto'daki 2 cref'i düzelt.
- [ ] **Step 4:** `dotnet build` → **PASS** (TreatWarningsAsErrors aktif; CS1574 dahil sıfır uyarı). FAIL veren beklenmedik `User` tüketicisi çıkarsa: DOKUNULMAZ setteyse yalnız silinen-tip referansını temizle, kararsızsan BLOCKED.
- [ ] **Step 5:** Tam `dotnet test` (Docker up) → bilinen `PersonDirectoryChildrenIntegrationTests` FK fail'i DIŞINDA yeşil. `User` domain/integration testleri silindiği için ilgili sayımlar düşer — beklenen.
- [ ] **Step 6:** `dotnet format` (FOREGROUND) + commit: `2026-07-02 refactor: Legacy User entity + config + DbSet + tüketicisiz User* event'leri emekliye ayrıldı (legacy User emeklilik Faz 5, tasarım §3).`

### Task 2: `[identity].[users]` drop migration

**Goal:** Task 1'de modelden çıkan `User`'ı yansıtan tek şema-drop migration'ı üretmek; `Up()` `[identity].[users]` tablosunu düşürür, `Down()` geri kurar. Veri taşınmaz.

**Files (OLUŞUR — EF üretir):**
- `src/Oksis.Infrastructure/Persistence/Migrations/<ts>_20260702_drop_users.cs` (+ `.Designer.cs`)
- `src/Oksis.Infrastructure/Persistence/Migrations/OksisDbContextModelSnapshot.cs` (EF otomatik günceller — `User` entity'si snapshot'tan düşer)

- [ ] **Step 1:** Docker up (SQL Server) + dev DB güncel migration'da olsun. Migration üret:
  `dotnet ef migrations add 20260702_drop_users --project src/Oksis.Infrastructure --startup-project src/Oksis.Api`
- [ ] **Step 2 (doğrulama):** Üretilen migration'ı OKU: `Up()` YALNIZ `migrationBuilder.DropTable(name: "users", schema: "identity")` içermeli (başka tablo/kolon DEĞİŞMEMELİ — değişiyorsa model kirlenmesi var, BLOCKED). `Down()` tabloyu identity şemasında geri kurmalı. Snapshot'tan `Modules.Identity.Entities.User` bloğunun kalktığını doğrula.
- [ ] **Step 3:** Migration'ı dev DB'ye uygula: `dotnet ef database update --project src/Oksis.Infrastructure --startup-project src/Oksis.Api` → başarı. `[identity].[users]` tablosunun düştüğünü doğrula (ör. `dotnet ef migrations script` idempotent üretilebilirlik kontrolü VEYA DB sorgusu).
- [ ] **Step 4:** `dotnet build && dotnet test` → yeşil (bilinen FK hariç). `dotnet format` (FOREGROUND) + commit: `2026-07-02 refactor: [identity].[users] tablosu final drop migration ile düşürüldü — legacy User emekli (Faz 5, tasarım §4).`

### Task 3: Kalıntı-sıfır doğrulama + smoke E2E + docs kapanışı + PR (stacked)

**Goal:** Solution-geneli legacy-tip kalıntısının sıfır olduğunu kanıtlamak, tüm auth akışlarını canlı smoke-test etmek, ADR-001/OQ-identity-001'i kapatmak, stacked PR açmak.

- [ ] **Step 1 (kalıntı-sıfır grep — üretim + test):** Aşağıdakilerin tümü ÜRETİMDE sıfır olmalı (doc-yorumu `<c>db.Users</c>` metin referansları hariç — onlar tarihsel açıklama, kalabilir ama listele):
  - `grep -rn "Entities\.User\b" src/ --include="*.cs"` → yalnız Migration `*.Designer.cs` tarihsel snapshot'ları (dokunulmaz) + `OksisDbContextModelSnapshot` artık İÇERMEMELİ. Aktif kod (Application/Api/Infrastructure config) SIFIR.
  - `grep -rn "DbSet<User>\|User\.Create\|new User(\|IEntityTypeConfiguration<User>" src/ tests/ --include="*.cs"` → SIFIR.
  - 5 event adı (`UserCreatedEvent|UserPasswordChangedEvent|UserLockedOutEvent|UserDeletedEvent|UserActivatedEvent`) `src/` + `tests/` → SIFIR.
  - Kalan varsa listele; beklenmedikse BLOCKED.
- [ ] **Step 2 (smoke E2E, canlı dev — Chrome):** API'yi bu branch'ten başlat (`nohup dotnet run --project src/Oksis.Api > /tmp/oksis-api-faz5.log 2>&1 &`) + web dev (`legacy-user-faz3-davet` branch'inde `npm run oksis:dev`). Akışlar: (a) admin login (Müdür quick-login) → korumalı sayfa (Kullanıcılar listesi 200, hesaplar görünür) → logout 204; (b) Kullanıcılar ekranı yüklenir (ListUsers Account⋈Person yolundan, `users` tablosu artık YOK — sorgu Account'tan gelmeli). Ağda `[identity].[users]`'a giden sorgu OLMAMALI. RHF form otomasyonu takılırsa curl fallback (login + /users list) ile kanıtla.
- [ ] **Step 3 (docs kapanışı):**
  - `.claude/specs/adr-001-legacy-user-kaldirma.md` → durum **"Uygulandı"** + Aşama 2 sapması notu (idempotent migration script şartı yerine dev reseed — bilinçli sapma).
  - `.claude/docs/modules/identity/open-questions.md` → **OQ-identity-001 KAPATILDI** (legacy User emekli; çözüm = Account/Person modeli, Faz 0-5 tamam).
  - `.claude/docs/modules/identity/completion_status.md` → Faz 5 kaydı (entity+tablo drop, kalıntı-sıfır) + "⚠️ Spec Dışına Çıkılanlar"a Aşama 2 sapma satırı + progress/`Güncel` tarih.
  - `.claude/docs/modules/identity/README.md` → `Last Updated` + "Mevcut Durum"da `User` tabanlı akış satırını "emekli" olarak güncelle.
- [ ] **Step 4 (PR — stacked):** `git push -u origin legacy-user-faz5-emeklilik` + `gh pr create --base legacy-user-faz4-crud --head legacy-user-faz5-emeklilik` (stacked; Faz 3+4 merge olunca base master'a çevrilir). Body: özet + tasarım §3/§4 + kalıntı-sıfır kanıtı + smoke E2E + "merge sırası: web#64 → api#33 → api#34 → bu PR" + `🤖 Generated with [Claude Code]` footer.
- [ ] **Step 5:** Workspace docs commit+push (identity docs + ADR + OQ + bu plan) + memory `project_legacy_user_retirement.md` güncelle (Faz 5 TAMAM, 4 PR zinciri, göç kapandı).
