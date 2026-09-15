# OKSİS — Süper Yönetici İzleri Envanteri (K-27 ön kazıması)

| | |
|---|---|
| **Belge türü** | Ölçüm / envanter — plan değil, planın girdisi |
| **Kapsam** | `oksis-api` @ `4fb82833` · `oksis-ui` @ `aecfd09` (web + mobil) · `oksis/docs` |
| **Tarih** | 15 Eylül 2026 |
| **Neden** | `K-27` kararı **(a) ayrı platform hesabı** yönünde verildi. Planlamaya geçmeden önce bugün "SuperAdmin" adıyla kodda, seed'de, testte ve belgede ne varsa **doğru/yanlış ayırmadan** çıkarıldı; çünkü rolün tanımı değişti ([[0008-super-yonetici-platform-roludur]]) ve kod büyük ölçüde eski tanıma göre yazılmış. |
| **Bağlı** | [[OKSİS - Yapısal Kararlar ve Eksikler]] `K-27` · [[OKSİS - Bulgu Kayıt Defteri]] `TB-139`, `E-24`, `TB-162`, `TB-164`, `TB-165`, `TB-166` |

---

## 0. Yöntem ve sayılar

Desen: `super_?admin | süper ?yönetici | super ?yonetici | superadmin` (büyük/küçük harf duyarsız). Üç depo: `oksis-api`, `oksis-ui`, `oksis/docs`. `bin/`, `obj/`, `node_modules/`, `.git` dışlandı.

| Depo | Eşleşen satır | Dosya | Not |
|---|---|---|---|
| `oksis-api` | 706 | 312 | 256 satır / 177 dosya EF `Designer.cs` + `ModelSnapshot` — hepsi aynı iki `HasData` satırının kopyası (`Code = "SUPER_ADMIN"` ve `files.policies.manage` açıklaması). Kalan **450 satır / 135 dosya** gerçek envanter. |
| `oksis-ui` (web + mobil) | 17 | 13 | Yarısı yorum; bir MSW mock'u, bir dev hızlı giriş sabiti, K5 kartı |
| `oksis/docs` | 124 | 29 | 47'si zaten bu konuyu işleyen defter/arşiv/karar notu; **kalan 77 satır 25 kural ve belge dosyasında eski tanımı anlatıyor** |

---

## 1. Eski tanımın kodda yaşadığı üç varsayım

Her iz aşağıdaki üç varsayımdan birine (bazen ikisine) dayanıyor. Yeni tanım üçünü de bozuyor.

| Kod | Varsayım | Yeni tanımda |
|---|---|---|
| **V1 — Okul-bağlı kişi** | Süper yönetici bir okulun `Person`'ıdır; rolü `RoleAssignment` ile (kişi + sezon) atanır; hesabı `Account.Create` ile bir okula açılır; girişte kişinin okuluna geçer. | Platform hesabı okulsuzdur; `Person`/`RoleAssignment`/`school_id` zinciri ona uymaz. |
| **V2 — Tüm-tenant muafiyeti** | `IsSuperAdmin == true` ise küresel süzgeç düşer, yazma sınırı kalkar, seviye/alt küme kuralları uygulanmaz, `Required` tenancy bile geçer. | Muafiyet yok. Tenant verisi ancak **onaylı üstlenme** ile ve tek okul kapsamında görünür. |
| **V3 — JWT rol talebi** | Süper yöneticilik `User.IsInRole("SuperAdmin")` ile, yani token'daki rol talebiyle bilinir. | Token'a rol talebi hiç yazılmıyor (2026-09-13 ölçümü). Ayrı kimlikte "süper yöneticilik" bir rol talebi değil, **token'ın türü** olur. |

---

## 2. Katman katman envanter — `oksis-api`

### 2.1 Gerçek kod dalı olan yerler (yorum değil, davranış)

| # | Dosya | Satır | Ne yapıyor | Varsayım |
|---|---|---|---|---|
| 1 | `Infrastructure/Identity/TenantContext.cs` | 25–34 | `IsSuperAdmin => User.IsInRole("SuperAdmin")`; `OverrideForSuperAdmin` süper değilse `SecurityException` | V2, V3 |
| 2 | `Api/Middleware/TenantContextMiddleware.cs` | 22–25 | Süper yönetici `school_id` talebi olmadan geçer; başkası 403 | V2, V3 |
| 3 | `Application/Common/Behaviors/TenantContextBehavior.cs` | 24–27 | `Required` modu `CurrentSchoolId == null && !IsSuperAdmin` ise reddeder → süper yönetici okulsuz da `Required` komut çalıştırabilir; `SuperAdminOnly` modu | V2 |
| 4 | `Application/Common/Attributes/TenancyAttribute.cs` | 13 | `TenancyMode.SuperAdminOnly` tanımlı — **hiçbir komut/sorgu kullanmıyor** | V2 |
| 5 | `Application/Common/Abstractions/ITenantContext.cs` | 6, 8 | `IsSuperAdmin`, `OverrideForSuperAdmin(Guid)` sözleşmesi | V2 |
| 6 | `Infrastructure/Persistence/OksisDbContext.cs` | 225, 307, 314 | Küresel süzgeç: `IsSuperAdmin \|\| (CurrentSchoolId.HasValue && e.SchoolId == CurrentSchoolId)` — 90 varlık (`TB-139`) | V2 |
| 7 | `Infrastructure/Persistence/Interceptors/TenantSaveChangesInterceptor.cs` | 37, 47 | Ekleme/güncelleme/silme okul sınırı `!IsSuperAdmin` şartına bağlı | V2 |
| 8 | `Infrastructure/Persistence/OksisDbContextFactory.cs` | 48–49 | Tasarım zamanı bağlamı `IsSuperAdmin => true` (EF aracı, ürün yolu değil) | V2 |
| 9 | `Application/Modules/Documents/Security/SchoolEntityScopeResolver.cs` | 61 | `School` varlığına dosya **yazma**: `IsSuperAdmin \|\| upload-logo izni` | V2 |
| 10 | `Application/Modules/Documents/Commands/ProvisionSchoolBucket/…Handler.cs` | 31 | Başka okulun bucket'ını yalnız süper yönetici açabilir | V2 |
| 11 | `Application/Modules/Users/Queries/ListAssignableRoles/…Handler.cs` | 37 | Süper yönetici seviye + alt küme kuralından muaf → **tüm roller** (SUPER_ADMIN dâhil) atanabilir listesinde | V2, V1 |
| 12 | `Application/Modules/Users/Queries/ListRolePermissions/…Handler.cs` | 37 | Seviye görünürlük süzgeci süper yöneticiye uygulanmaz | V2 |
| 13 | `Application/Modules/Users/Commands/CreateRoleAssignment/…Handler.cs` | 75 | Atamada seviye + alt küme kuralı süper yöneticiye uygulanmaz | V2, V1 |
| 14 | `Application/Modules/Notifications/Commands/RegisterDevice/…Handler.cs` | 55–61 | "Süper yönetici token'ında okul yok" diye açık `CurrentSchoolId is null → Forbidden` kapısı | V2 |
| 15 | `Application/Modules/Notifications/Commands/UpdateNotificationPreferences/…Handler.cs` | 22–30 | Aynı kapı | V2 |
| 16 | `Api/Controllers/V1/NotificationsController.cs` | 100, 133 | Aynı kapının 403 belgesi (`<remarks>`) | V2 |
| 17 | `Domain/Modules/Identity/Enums/UserRole.cs` | 8 | Eski enum: `SuperAdmin = 1` — 18 dosyada hâlâ akıyor (aşağıda §2.3) | V1 |
| 18 | `Domain/Modules/Identity/Enums/PortalType.cs` | 10 | `Platform = 0` — XML açıklaması "Süper admin tarafı — **tüm tenantlara erişim**" | V2 |
| 19 | `Infrastructure/Identity/AccountPermissionResolver.cs` | 53–67, 72–90 | İzinler kişinin `RoleAssignment`'larından çözülür; aktif profil varsa **portal süzgeci** rolün `PortalType`'ına bakar — `Platform` hiçbir profile eşlenmiyor, o portalın izinleri **elenir** | V1 |
| 20 | `Application/Modules/Identity/Commands/CreateUser/CreateUserCommandValidator.cs` | 25–26 | `Role != UserRole.SuperAdmin` (hata: `identity.errors.cannot-assign-superadmin`) | V1 |
| 21 | `Api/Errors/ErrorMessageCatalog.cs` | 200 | "Süper yönetici rolü buradan atanamaz." | V1 |
| 22 | `Infrastructure/Identity/PermissionService.cs` | 23 | `UserRole.SuperAdmin → MasterSeedIds.Roles.SuperAdmin` eşlemesi (eski izin servisi) | V1 |
| 23 | `Application/Modules/Identity/Queries/Shared/AccountUserProjection.cs` | 126 | `UserRole.SuperAdmin => "SUPER_ADMIN"` (eski kullanıcı listesi rozeti) | V1 |
| 24 | `Application/Modules/Identity/Resources/UserExportLabels.cs` | 27 | Dışa aktarımda "Süper Yönetici" etiketi | V1 |

**Gerçek dal sayısı: 24 nokta, 13'ü V2 (muafiyet).** Bunların hiçbiri bugün ürün yolunda çalışmıyor — §3.

### 2.2 Seed ve göç (veritabanına giren tanım)

| Dosya | Satır | İçerik | Varsayım |
|---|---|---|---|
| `Persistence/Seed/MasterData/SystemRoleSeedData.cs` | 11 | `SUPER_ADMIN` · "Süper Admin" · `PortalType.Platform` · seviye **100** · açıklama **"Platform sahibi — tüm tenantlara erişim."** | V2 |
| `Persistence/Seed/MasterData/MasterSeedIds.cs` | 13, 129, 201 | Rol GUID'i; "K5 yalnız SuperAdmin'e"; "files.* SuperAdmin'e upload/delete verilmez" | — |
| `Persistence/Seed/MasterData/RolePermissionSeedData.cs` | 7–13 | **`AllPermissionIds()` kataloğunun tamamı SUPER_ADMIN'e** (okul yöneticisiyle aynı küme) | V2 |
| aynı dosya | 21–25, 43, 90, 338, 372, 398, 426, 435, 444 | Katalogdan bilinçli çıkarılan yazma izinleri (`attendance.manage`, `duties.manage`, `homework.write/manage`, `announcements.create…`, `curriculum-hours.override`, `clubs.manage`, `grades.write/publish`) — "platform hesabı okul adına … yapamaz" gerekçesiyle. Yani **izin kümesi "hepsi eksi istisnalar"** olarak kurulu; 0008 tersini istiyor | V2 |
| aynı dosya | 109–111 | `school-settings.manage-authority` (K5 Kurum Yetkilisi) **yalnız SUPER_ADMIN** | — |
| aynı dosya | 232–247 | `files.view / download / quota.view / policies.manage` SUPER_ADMIN'e | — |
| `Persistence/Seed/MasterData/PermissionSeedData.cs` | 174 | `files.policies.manage` açıklaması "SuperAdmin-only, kod-içi registry" — **izni okuyan hiçbir handler yok** | — |
| `Persistence/Migrations/20260523222901_…global_seed_master_data.cs` | 527 | Rol satırının ilk `HasData`'sı (aynı açıklama metniyle) | V2 |
| `Persistence/Migrations/20260605…roles_manage_permission.cs`, `20260704…files_permissions.cs` | 12, 25 | Yorum + izin satırı | — |
| 175 `*.Designer.cs` + `OksisDbContextModelSnapshot.cs` | — | `HasData` kopyaları; rol açıklaması değişirse **yeni göç** gerekir (snapshot değişir) | — |
| `infra/scripts/identity-dev-seed.sql` | 4, 34–38 | **Ölü dosya.** Var olmayan `users` tablosuna, `school_id = @SchoolId` ile `superadmin@oksis.local` yazıyor — eski tanımın (okul-bağlı süper yönetici) en saf hâli. Snapshot'ta `users` tablosu yok | V1 |
| `Api/Program.cs` 305, `Infrastructure/DependencyInjection.cs` 464 | | Yorumlar "1 SuperAdmin + 2 SchoolAdmin …" diyor; `IdentityDevSeeder` **süper yönetici hesabı üretmiyor** (başlığı: müdür, müdür yardımcısı, öğretmen, öğrenci, veli) | bayat |

**Sonuç:** Rol veritabanında **var**, izin kümesi **dolu**, ama hiçbir seed onu hiçbir kişiye **atamıyor** (`Roles.SuperAdmin` kullanan tek üretim kodu `PermissionService._roleMap`). → `TB-164`.

### 2.3 Eski `UserRole` enum'unun akışı (V1 mirası)

`UserRole.SuperAdmin = 1` şu 18 dosyada yaşıyor: `UserRole.cs`, `IPermissionService`, `ICreateUserService`, `UserExportLabels`, `ExportUsersQuery(+Handler)`, `AccountUserQuery`, `AccountUserProjection`, `ListUsersQuery(+Validator)`, `UserListDto`, `UserDetailDto`, `CreateUserCommand(+Validator)`, `PersonUserCreationService`, `CreateUserBody`, `UsersController` (`POST api/v1/users`, satır 148–155 — uç **canlı**), `PermissionService`. Postman/curl referansı bu numaraları belgeliyor (`postman/kimlik/*`: "role: 1 SuperAdmin reddedilir").

### 2.4 Yalnız yorum/XML-doc'ta geçenler (davranış yok, ama niyet taşıyor)

Hepsi `TB-139` savunması: "küresel süzgeç süper yönetici oturumunda düşer, o yüzden okul yüklemi açık yazıldı". Muafiyet kalkınca bu yüklemler **gereksiz değil** (kapsam tutar, `M17`), ama gerekçe cümleleri bayatlar.

- **Exams (17):** `ExamCaller`, `ExamReviewReader`, `ExamPlacementCounter` (4 yer), `ExamOccupancyReader`, `ExamPeriodLabeller`, `ExamRoomDeriver:114`, `GetInvigilatorSchedule`, `GetExamBadges:226`, `GetExamBoard:51`, `GetInvigilatorCandidates:58,78`, `GetRoomCandidates:51,76`, `ListHourRequests:53`, `GetMyExamSchedule:274`, `GetMyExamDuties:36`, `OpenExamReview:21`, `GetExamSession:65,78`
- **Attendance (4):** `AttendanceCallerResolver:9`, `DecideExcuseCommand:8` ("SchoolAdmin-only, SuperAdmin hariç"), `DecideAmendmentRequestCommandHandler:50`, `SubmitAttendanceCommandHandler:41`
- **Announcements (1):** `AnnouncementCallerResolver:16,39` ("IsInRole ölü kod")
- **Users/Teachers/AcademicSessions (3):** `PersonAccessGuard:15`, `GetTeacherWorkloadQuery:33`, `ArchivedSeasonAccess:24`
- **Documents (2):** `FileAccessIntent:8`, `ProvisionSchoolBucketCommand:10–16` ("SuperAdmin onboarding endpoint'i eklenirse tenancy niteliği o zaman karara bağlanmalı")
- **Schools/Events (5):** `SchoolCreatedEventHandler:21`, `SchoolCreatedOnboardingStatusHandler:17`, `SeedDefaultNotificationRulesHandler:20`, `SeedSchoolGradeLevelsHandler:32`, `SeedDefaultModuleConfigsHandler:29` — hepsi "handler SuperAdmin/system bağlamında çalışabilir" varsayımıyla `IgnoreQueryFilters` kullanıyor. **Okul açma komutu bu olayları tetikleyeceği için K-27 uygulamasının doğrudan içinde.**
- **Domain (3):** `SystemRole.cs:36` (seviye seed'i), `SchoolSettings.cs:273` (`season.archive.view` SuperAdmin/SchoolAdmin), `SchoolAuthority.cs:6` (K5 yalnız süper yönetici)
- **Infrastructure (4):** `SessionMaterializer:217–220` ("IsSuperAdmin burada muafiyet değildir"), `PushNotificationChannel:50`, `SoftDeletePurgeJob:22`, `HangfireSetup:151` + `Program.cs:253` ("dashboard prod'a SuperAdmin auth filtresi yazılmadan açılmaz")
- **Api (2):** `SchoolSettingsController:142` (K5), `NotificationsController` (yukarıda)

### 2.5 Testler

| Küme | Dosya / sayı | Ne varsayıyor |
|---|---|---|
| Sahte tenant bağlamları | 28 test dosyasında yerel `FakeTenantContext`/`FixedTenantContext` (`IsSuperAdmin => false/true/CurrentSchoolId is null`, `OverrideForSuperAdmin` boş ya da `CurrentSchoolId = schoolId`) | `ITenantContext` sözleşmesi — üye kalkarsa **28 dosya** derlenmez |
| Ortak fixture | `IntegrationTests/Fixtures/DatabaseFixture.cs:102` `CreateSuperAdminDbContext(schoolId)`; `Oksis.Tests/Common/Fixtures/SqlServerTestFixture.cs:78` `CreateDbContext(…, isSuperAdmin: true)` "to bypass the global tenant filter" | V2 — süzgeci düşürmek için |
| Süzgeç düşükken okul sınırını ölçen testler | Exams: `ExamBoardSessionViewTests:152,170`, `ExamTenantScopeTests:98`, `ExamSessionRuleTests:537`, `ExamCandidateQueryTests:501,535`, `SeatMaintenanceCommandHandlerTests:769,1230`, `GetMyExamDutiesQueryHandlerTests:169,197`, `GetExamSessionQueryHandlerTests:614`, `ExamSessionPublishGateTests:532`, `ExamBadgeSessionModeTests:159`, `ExamReviewWindowTests`; `AttendanceTenantScopeTests` — 13'ü `db.IsSuperAdmin.Should().BeTrue("ölçülen hâl SÜZGECİN DÜŞTÜĞÜ hâldir")` ile başlıyor | V2 — muafiyet kalkınca bu testlerin **ön koşulu** kaybolur; kapsam yüklemi testleri başka bir "süzgeçsiz" bağlama taşınmalı |
| Muafiyet davranışını doğrudan ölçenler | `CreateRoleAssignmentCommandHandlerTests:174` (bypass), `ProvisionSchoolBucketCommandHandlerTests:90`, `SchoolEntityScopeResolverTests:73`, `RoleAuthorizationEngineTests:305` (tam matris), `PersonUserCreationServiceTests:129` | V2 — davranış değişince **kırılır** |
| Seed değişmezleri | `MasterRoleSeedTests:55` (seviye 100), `:94` ("SuperAdmin ve SchoolAdmin **tüm** izin kataloğunu alır" + istisna listesi), `AttendancePermissionSeedTests:106`, `HomeworkPermissionSeedTests:101`, `ClubPermissionSeedTests:104`, `AnnouncementPermissionSeedTests:80`, `FilesPermissionSeedTests`, `RequirePermissionSeedCoverageTests` | V2 — izin kümesi tersine kurulunca **yeniden yazılır** |
| Mimari bekçi | `Oksis.Tests/Architecture/SeederRawSqlColumnTests.cs:130` | sözleşme |

---

## 3. Bugün gerçekte ne çalışıyor? (ölçüm)

`SUPER_ADMIN` rolü: veritabanında **var**, izinleri **var**, hiçbir kişiye **atanmamış**, token'a rol talebi **yazılmıyor**. Bu dört gerçek şu ölü noktaları üretiyor:

| Ölü nokta | Neden |
|---|---|
| `IsSuperAdmin` | Üründe her zaman `false` (`TB-139` ölçümü) |
| `OverrideForSuperAdmin` | Üretim kodunda **hiç çağrılmıyor**; çağrılsa `SecurityException` |
| `TenancyMode.SuperAdminOnly` | Hiçbir istek türü işaretli değil |
| `PUT school-settings/authority` (K5, `UpdateSchoolAuthorityCommand`) | İzin yalnız SUPER_ADMIN'de; rol kimsede yok → **uç erişilemez**. Rol bir kişiye atansa bile `AccountPermissionResolver` portal süzgeci `Platform` portalını hiçbir profile eşlemediği için izin düşer → `TB-165` |
| `files.policies.manage` | İzni okuyan handler yok |
| Hangfire dashboard yetkisi | "SuperAdmin filtresi yazılınca açılır" notu — yazılacak bir kimlik yok |

---

## 4. `oksis-ui` ve mobil

| Dosya | Satır | İçerik |
|---|---|---|
| `apps/web/mocks/permissions-handlers.ts` | 12–31 | MSW mock'u rolü **`code: "SuperAdmin"`, `displayName: "Kurum Yetkilisi"`, `level: 0`, `portalType: "Super"`** diye tanımlıyor — backend'de `SUPER_ADMIN` / "Süper Admin" / 100 / `Platform`. Dört alan da yanlış; "Kurum Yetkilisi" K5'in adıdır, rolün değil → `TB-166` |
| `packages/core/src/roles/roles.ts` | 3 | `ROLE_KEYS = ["admin","teacher","student","parent"]` — platform anahtarı yok |
| `packages/core/src/dev-quick-login/constants.ts` | 8–15 | `SUPER_ADMIN` hızlı girişte bilinçli gösterilmiyor (`logic.test.ts:51` bunu ölçüyor) |
| `packages/api/src/client/mutation-error.ts` | 50 (+test 146, 158) | "This operation requires SuperAdmin privileges." İngilizce sabit 403 ailesi — `TenantContextBehavior` metni |
| `apps/web/features/settings/settings-page.tsx` | 138–139 | `const sup = false` — "süper yönetici ayrı akıştan girer" |
| `apps/web/features/settings/parts.tsx`, `general-tab.tsx` 491–506, `packages/core/src/school-settings/types.ts:49`, `packages/ui/src/styles/screens.css:5257` | | K5 Kurum Yetkilisi kartı salt-okunur; "yalnız süper yönetici düzenler" |
| `apps/mobile/src/features/school-settings/components/school-identity-screen.tsx` | 234, 256 | Aynı K5 metni |
| `packages/core/src/academic-sessions/logic.ts:784`, `apps/web/app/(dashboard)/announcements/[id]/page.tsx:19` | | Seed'e atıf yorumları |

Web'de platform rotası, platform kabuğu, platform giriş ekranı **yok**.

---

## 5. `oksis/docs` — eski tanımı hâlâ anlatan belgeler

| Dosya | Satır | Ne diyor |
|---|---|---|
| `teknik/mimari/multi-tenant-rules.md` | 23–49, 85, 97–98, 129–138, 179–195, 210, 233, 268, 306, 309, 379–380 | Kural kaynağı: `IsSuperAdmin` süzgeç muafiyeti, `OverrideForSuperAdmin` "impersonate", "SuperAdmin dashboard → `IgnoreQueryFilters()`", "SuperAdmin hariç kimse başka tenant path'ine erişemez", Hangfire işleri `OverrideForSuperAdmin` ile |
| `teknik/mimari/security-rules.md` | 15, 34, 97, 153–157, 261 | §3.4 "**Tüm permission'ları var** … impersonate mode … banner"; JWT `school_id` "SuperAdmin'de yok"; rol listesi 8 rol |
| `teknik/mimari/background-job-rules.md` | 79, 172–173, 195, 257, 275 | Worker `OverrideForSuperAdmin(args.SchoolId)`; "SuperAdmin global job"; dashboard SuperAdmin'e açık |
| `teknik/mimari/notification-rules.md` | 317 | Critical fail → SuperAdmin alert |
| `teknik/kurallar/backend/domain-model-rules.md` | 15, 58, 70, 302 | `User.SchoolId` "SuperAdmin için null"; e-posta "SuperAdmin için global unique" — **eski `User` modeli** |
| `teknik/kurallar/backend/api-design-rules.md` | 419 | `X-Tenant-Override` başlığı "sadece SuperAdmin" — kodda yok |
| `teknik/kurallar/backend/logging-error-rules.md` | 313, 336, 381 | "SuperAdmin: tüm okullar", cross-tenant audit |
| `teknik/kurallar/backend/database-rules.md` | 84 | SuperAdmin admin paneli |
| `teknik/kurallar/ortak/api-sozlesmesi.md` | 130, 208, 246 | Claim listesi "rol (`SuperAdmin`)"; `school_id` istisnası |
| `teknik/kurallar/ortak/analysis_standards.md` | 533 | 8 rollü liste |
| `teknik/ortamlar/seed-runbook.md` | 190 | "SuperAdmin hesabının nasıl oluşturulacağı … runbook yok: {{TBD}}" |
| `postman/kimlik/*` | 11, 138, 151, 224, 271, 303 | `UserRole` numaraları, "role:1 reddedilir" |
| `genel/urun-tanimi.md` | 27, 52 | **Yeni tanımla uyumlu** ("okulun iç verisini değil sistemdeki varlığını yönetir") ama "Web paneli … süper yönetici portalı" diyor — portal yok |
| `genel/mvp-kapsami.md` | 119 | "SuperAdmin çoklu tenant analytics — Sprint 5+" |
| `domain/kavramlar/Sistem Rolü.md`, `domain/kararlar/0007-…`, `domain/moduller/Kimlik Doğrulama.md`, `domain/kavramlar/İzin.md`, `Dosya Bağı.md`, `_indeks.md` | | Beş rol, seviye 100, K5 — büyük ölçüde nötr |
| `teknik-analizler/notlar/*`, `kulupler/*`, `gecici/planlar/2026-09-13-…faz2b.md`, `raporlar/…Sınav Takvimi…Durum Raporu.md` | | Modül analizlerinde "platform hesabı … yapamaz" istisna gerekçeleri ve `TB-139` atıfları |

---

## 6. Planlama girdisi: (a) altında her grup ne olur

Bu bölüm karar değil, envanterin planlamaya çevrilecek özetidir.

| Grup | İzler | (a) ayrı platform hesabında |
|---|---|---|
| **Kimlik çekirdeği** | §2.1 #1, #2, #3, #5; `AccountTokenIssuer`; `Account.Create` okul zorunluluğu; `AccountLoginCommandHandler` kişi→okul çözümü | Yeni kimlik varlığı + ayrı giriş ucu + `school_id`'siz token türü. `IsSuperAdmin`'in yerini "platform token'ı mı" sorusu alır; `IsInRole` tümden kalkar |
| **Muafiyet dalları** | #6, #7, #9–#13, #4 | Kısa devre silinir (`TB-139` yolu (a)); rol atama/görünürlük muafiyetleri okul yöneticisi kurallarıyla aynı kalıba iner ya da platform yüzeyine taşınır; `SuperAdminOnly` → platform komutları için yeni bir tenancy modu |
| **Okulsuz-`Required` sızıntısı** | #14–#16 | Platform token'ı tenant komutlarına hiç ulaşmayınca bu kapılar gereksizleşir |
| **Rol seed'i** | §2.2 | Açıklama metni, seviye, `PortalType.Platform` ve **izin kümesi tersine** kurulur (sıfırdan platform modülü: `schools.*`, `tenants.*`, `support.*`); `HasData` değiştiği için göç gerekir; `identity-dev-seed.sql` silinir |
| **Eski `UserRole` yolu** | §2.3 | `UserRole.SuperAdmin` anlamsızlaşır; en azından validator/etiket/rozet/eşleme satırları, ideali eski `POST /users` ucunun emekliliği (ayrı karar) |
| **Okul açılış olayları** | §2.4 Schools/Events | Okul açma komutu bunları platform bağlamında tetikleyecek; "SuperAdmin/system context" varsayımı "kurulum bağlamı" (`SetForLoginFlow` emsali) olarak yeniden yazılır |
| **Testler** | §2.5 | 28 sahte bağlam derleme kırılması; 13 "süzgeç düşük" ön koşullu test yeniden kurgulanır; seed değişmezleri baştan yazılır |
| **Web** | §4 | Platform kabuğu, giriş, `ROLE_KEYS` genişlemesi ya da ayrı uygulama; MSW mock'u düzeltilir |
| **Belgeler** | §5 | `multi-tenant-rules`, `security-rules`, `background-job-rules`, `domain-model-rules`, `api-sozlesmesi`, `api-design-rules`, `logging-error-rules` yeni tanıma göre yeniden yazılır |
| **Yorum temizliği** | §2.4 Exams/Attendance | Davranış değişmez; gerekçe cümleleri "muafiyet vardı" yerine "kapsam yüklemi" diliyle düzeltilir (ayrı, düşük öncelikli tur) |

**Alt soru bağlandı (2026-09-15):** ilk platform hesabı `PlatformBootstrap` ayarından tek seferlik doğar.

### 6.1 İlk dilimde uygulananlar (2026-09-15, `oksis-api` `e91711bd`…`74427aa3`)

| Grup | Uygulanan | Kalan |
|---|---|---|
| Kimlik çekirdeği | `PlatformAccount` (`platform.accounts`), ayrı giriş ucu, `token_kind=platform` taşıyan `school_id`'siz token; middleware'deki `IsInRole("SuperAdmin")` kalktı | `TenantContext.IsSuperAdmin` hâlâ `IsInRole` okuyor (hep `false`) |
| Muafiyet dalları | Tenant kapısında `Required` muafiyeti kalktı, `SuperAdminOnly` → `PlatformOnly` | #6, #7, #9–#13 dokunulmadı; `TB-139` kısa devresi duruyor |
| Okulsuz-`Required` sızıntısı | Platform token'ı ve okulsuz istek `Required`'da reddediliyor; #14–#16 kapıları savunma olarak kaldı | — |
| Rol seed'i | — | `SUPER_ADMIN` adı, açıklaması, izin kümesi (`0019`); `identity-dev-seed.sql` (`TB-164`) |
| Eski `UserRole` yolu | — | Ayrı karar |
| Okul açılış olayları | `CreateSchoolCommand` okulu platform bağlamında açıp kurulum bağlamına geçiyor | Olaylardaki "SuperAdmin/system context" yorumları |
| Web | `/platform/login`, `/platform/schools` | `ROLE_KEYS`, MSW mock'u (`TB-166`) |
| Belgeler | `api-sozlesmesi`, `multi-tenant-rules` | `security-rules`, `background-job-rules`, `domain-model-rules`, `api-design-rules`, `logging-error-rules` |

---

## 7. Bu kazımada açılan bulgular

- `TB-164` — `infra/scripts/identity-dev-seed.sql` ölü ve yanıltıcı; `Program.cs`/`DependencyInjection.cs` yorumları olmayan süper yönetici seed'ini vadediyor.
- `TB-165` — K5 Kurum Yetkilisi ucu üründe erişilemez: izin yalnız atanmamış rolde, portal süzgeci `Platform`'u eliyor.
- `TB-166` — Web MSW mock'u süper yönetici rolünü dört alanda backend'den farklı tanımlıyor.

Ayrıntı: [[OKSİS - Bulgu Kayıt Defteri]] §12.
