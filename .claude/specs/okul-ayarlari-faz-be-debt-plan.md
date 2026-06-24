# Okul Ayarları — Faz BE (Backend Debt Tamamlama) · Full-Stack Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Implementer'lar **Opus 4.8** ([[feedback-implementer-opus]]).

**Goal:** Faz C'de Debt bırakılan backend alanlarını/domainlerini gerçekten kazandırmak (oksis-api: domain + EF config + migration + CQRS + permission + test) ve her dilimde ilgili FE sekmesinde Debt rozetini kaldırıp alanı payload'a bağlamak (full-stack).

**Architecture:** Her dilim bağımsız, review-edilebilir bir CQRS slice'tır. Backend deseni `/tmp` recon referansındaki house pattern'i izler: Command(record `: ICommand`, `[Tenancy(Required)]` + `[RequirePermission]`) → Validator(FluentValidation) → Handler(`IApplicationDbContext`, domain metodu, `SaveChangesAsync`) → DTO → Mapster `IRegister` → Controller endpoint (`ISender.Send` + `ToHttpResult`). Migration: `dotnet ef migrations add` (Infrastructure/Persistence/Migrations), yeni kolonlar **nullable + default**, idempotent seed/backfill, K2 DROP'ları hariç. Tenant izolasyonu global query filter + `TenantSaveChangesInterceptor` ile otomatik.

**Tech Stack:** .NET 10 · EF Core 10 (SQL Server) · MediatR · FluentValidation · Mapster · xUnit + NSubstitute + FluentAssertions (unit), IntegrationTestBase (integration). FE: React + RHF/Zod + React Query.

## Konvansiyonlar / Kısıtlar (her dilim)
- **Multi-tenant asla bypass edilmez** (`IgnoreQueryFilters` yalnız sistem-context seed'de, gerekçeli). Mark=not, Grade=sınıf seviyesi; "Derslik"=fiziksel `Room`, `Class` değil.
- Repository wrapper YOK (doğrudan `IApplicationDbContext`); AutoMapper YOK (Mapster); `async void`/`.Result`/`.Wait()` YOK.
- Migration: yeni kolon nullable+default; mevcut tenant'lar için idempotent backfill (SchoolCreatedEvent seed handler'ı da güncelle); **prod'da auto-migrate yok** (yalnız `migrations add` + build doğrula; integration test fixture uygular).
- Yeni izinler `permissions` + `role_permissions` seed migration'ı; `permission-matrix.md` güncellenir.
- Commit: OKSİS formatı `YYYY-MM-DD <type>: Türkçe özet.` (oksis-api'de husky commit-msg hook zorlar). Backend commit'leri `oksis-api` repo'sunda; FE commit'leri `oksis-web` repo'sunda; doküman `oksis` workspace'inde.
- Test: handler unit testleri (NSubstitute, DB gerektirmez) zorunlu; integration testleri DB (docker compose) gerektirir — DB yoksa unit + `dotnet build` ile doğrula, integration testini yaz ama "DB gerekli" not düş.
- **FE un-Debt:** dilim bir alanı persist edilebilir yapınca, ilgili FE sekmesinde `BackendDebtBadge` kaldırılır, alan RHF formuna + save payload'una bağlanır, DTO/adapter/types güncellenir, sekme testi güncellenir.
- Her dilim sonunda: `oksis-api` `dotnet build` + ilgili `dotnet test` yeşil; `oksis-web` `npm run build` + `npx vitest run src/portals/admin/settings` yeşil.

---

### BE-1: İzinler + permission-matrix uyumu (foundation)
**Amaç:** Sonraki dilimlerin gating'i için izin tabanını netle. Backend-only.
- Yeni izin `school-settings.manage-authority` (Kurum Yetkilisi — K5, yalnız **SüperAdmin** rolüne seed; Sekreter/Admin'e verilmez).
- K3: mevcut `school-settings.view` iznini **Sekreter** rolüne ata (zaten 10 izin Sekreter'e atanmış olabilir — recon'a göre 2026-05-24 migration Sekreter'e atadı; DOĞRULA, eksikse ekle).
- `class-rooms.*`: RoomsTab `class-rooms.update` kullanıyor. Backend'de bu slug var mı doğrula; yoksa **`class-rooms.view` + `class-rooms.manage`** seed et (Admin'e; rooms CRUD bunları kullanacak — BE-3'te endpoint'lere bağlanır) VEYA mevcut timetable iznine hizala. Kararı recon bulgusuna göre ver, `permission-matrix.md`'ye işle.
- `permission-matrix.md` doc: `update-academic-policy`, `update-academic-structure` (zaten seed'li) + yeni `manage-authority` + `class-rooms.*` satırlarını ekle.
**Files:** yeni migration `<ts>_add_authority_and_room_permissions.cs` (permissions + role_permissions insert); `permission-matrix.md` (workspace doc).
**Test:** migration build; (varsa) bir permission seed integration testi.
**Commit (oksis-api):** `feat: school-settings.manage-authority + class-rooms izinleri ve Sekreter view ataması seed edildi.`

---

### BE-2: SchoolSettings kimlik alanları + recordInfo + K2 DROP + Kurum Yetkilisi (büyük, tek aggregate)
**Amaç:** Genel Bilgiler'in Debt alanlarını kazandır + ölü kolonları temizle.
**Domain (`SchoolSettings.cs` + VO'lar):**
- Ekle: `DisplayName` (string?, max 200), `OwnershipType` (yeni enum `SchoolOwnershipType { Private=Özel, State=Devlet, Foundation=Vakıf }`, nullable), `FoundingYear` (int?).
- Yeni owned VO `SchoolAuthority(FullName?, Title?, Email?)` (ContactInfo deseni) + `SchoolSettings.Authority`.
- `UpdateBasicInfo` imzasından `taxNumber`/`taxOffice` çıkar; `DisplayName`/`OwnershipType`/`FoundingYear` ekle. Yeni `UpdateAuthority(SchoolAuthority)` metodu.
- **K2 DROP:** `SchoolTheme` → yalnız `LogoUrl` (+ `FaviconUrl` kalsın) bırak; `PrimaryColor`/`SecondaryColor` KALDIR. `ContactInfo` → `Fax` KALDIR. `SchoolSettings` → `TaxNumber`/`TaxOffice` KALDIR.
- ⚠️ **Usage sweep (zorunlu):** drop'tan önce `PrimaryColor`/`SecondaryColor`/`Fax`/`TaxNumber`/`TaxOffice` tüm kullanımlarını ara (özellikle public branding endpoint'i + `update-theme` command + contact command). Public branding renk döndürüyorsa: sabit/kaldır kararını uygula, kırma. `UpdateThemeCommand` artık yalnız logo/favicon ile çalışsın (renk parametreleri kaldırılsın) veya update-theme tamamen logo'ya indirgensin.
**CQRS:**
- `UpdateSchoolBasicInfoCommand`: yeni alanlar (DisplayName/OwnershipType/FoundingYear), tax kaldırıldı.
- Yeni `UpdateSchoolAuthorityCommand` (+ `[RequirePermission("school-settings.manage-authority")]`) + Handler + Validator.
- `GetSchoolSettingsQuery` + `SchoolSettingsDetailDto`: ekle `displayName`, `ownershipType`, `foundingYear`, `authority{fullName,title,email}`, **`recordInfo{ institutionCode (School.Code türevi), createdAt, updatedAt, updatedByName }`** (UpdatedBy → user adı çöz: Users tablosundan). Kaldır: tax/fax/theme renk alanları.
**Migration:** add `display_name`, `ownership_type`, `founding_year`, `authority_full_name/title/email`; DROP `theme primary_color/secondary_color`, `contact fax`, `tax_number`, `tax_office`. (Down: geri ekle.) `CreateDefault` + SchoolCreated seed güncelle.
**FE un-Debt (GeneralSettingsTab):** Görünen Ad / Kurum Türü / Kuruluş Yılı / Kurum Yetkilisi / Kayıt Bilgisi'nden `BackendDebtBadge` kaldır; bunları DTO/adapter/types'a bağla; Kaydet payload'una ekle (yetkili ayrı `manage-authority` mutation'ı, yalnız SüperAdmin'de aktif). Önizleme gerçek değerleri kullanır.
**Test:** UpdateBasicInfo + UpdateAuthority handler unit testleri; GetSchoolSettings recordInfo testi; FE GeneralSettingsTab testini un-Debt'e göre güncelle.
**Commit:** BE `feat: SchoolSettings DisplayName/OwnershipType/FoundingYear + SchoolAuthority + recordInfo; tema renk/vergi/faks kolonları kaldırıldı (K2).` · FE `feat: Genel Bilgiler yeni alanlar backend'e bağlandı (Debt kaldırıldı).`

---

### BE-3: Derslik tipi 4→7 + Room.Note + class-rooms izin bağlama
**Domain:** `RoomType` enum'a ekle: `SportsHall`, `ConferenceHall`, `Library` (4→7; mevcut Classroom/Laboratory/Workshop/Other korunur). `Room`'a `Note` (string?, max 500) ekle.
**CQRS:** Create/UpdateRoomCommand + Validator + RoomDto'ya `note` + `roomType` 7 değer; RoomsController endpoint'lerine `[RequirePermission("class-rooms.view"/.manage")]` bağla (BE-1 seed'i).
**Migration:** add `rooms.note`; RoomType string conversion zaten string ise enum değeri eklemek migration gerektirmeyebilir (DOĞRULA — int ise kolon değişmez, sadece kabul edilen değerler artar).
**FE un-Debt (RoomsTab/RoomFormDrawer):** Tip select'inde 7 tip; "missing 3 tip" Debt notu kaldır; Not alanı persist (Debt kaldır), payload'a `note` ekle; `room.schema` + types güncelle.
**Test:** Room create/update handler unit testleri (7 tip + note); FE RoomsTab/drawer testleri güncelle.
**Commit:** BE `feat: RoomType 7 tipe çıkarıldı + Room.Note eklendi + class-rooms izin bağlama.` · FE `feat: Derslikler 7 tip + not alanı backend'e bağlandı (Debt kaldırıldı).`

---

### BE-4: Akademik Politika genişlemesi + INV-POL
**Domain (`SchoolSettings` academic policy):** ekle `RoundingRule` (enum `None/Nearest/Up`), `WrittenExamCount` (1..3), `PerformanceCount` (1..3), `WrittenWeight`+`PerformanceWeight` (toplam=100), `UnexcusedAbsenceLimit`, `TotalAbsenceLimit`, `WarningAbsenceThreshold`, `ParentNotifyOnThreshold` (bool), `HonorThreshold`, `ThanksThreshold` (1..100). `UpdateAcademicPolicy` imzası genişler.
**Invariant'lar (domain + Validator çift kontrol):** INV-POL-1 `WrittenWeight+PerformanceWeight=100`; INV-POL-2 `TotalAbsenceLimit>UnexcusedAbsenceLimit>WarningAbsenceThreshold`; INV-POL-3 `HonorThreshold>ThanksThreshold`, ikisi 1..100; INV-POL-4 `DefaultPassingScore` skala aralığında.
**DTO:** SchoolSettingsDetailDto'ya yeni politika alanları. **AS-5: sezon parametresi yok (tenant-geneli).**
**Migration:** kolonlar + default'lar (MEB varsayılanları: passing 50, rounding Nearest, written 2, perf 2, weights 60/40, unexcused 10, total 30, warning 5, honor 85, thanks 70, parentNotify true). SchoolCreated seed güncelle.
**FE un-Debt (AcademicPolicyTab):** Yuvarlama/yazılı/perf/ağırlıklar/devamsızlık/takdir-teşekkür/parentNotify alanlarından Debt kaldır; payload'a bağla; MEB reset sunucu sabitiyle hizalı kalır.
**Test:** UpdateAcademicPolicy handler unit testleri (her INV-POL ihlali reddedilir); FE testini güncelle.
**Commit:** BE `feat: Akademik Politika alanları (yuvarlama/sınav/ağırlık/devamsızlık/belge) + INV-POL eklendi.` · FE `feat: Akademik Politikalar tüm alanlar backend'e bağlandı (Debt kaldırıldı).`

---

### BE-5: Zil şablon (TemplateKey) + BellDayAssignment
**Domain:** `BellSchedule`'a `TemplateKey` (enum `FullDay/HalfDay`, default FullDay) ekle. Yeni entity `BellDayAssignment(DayOfWeek, TemplateKey)` (gün→şablon; `Closed` için ayrı enum değeri veya nullable). Sistem DayOfWeek konvansiyonuna hizala (`gun-konvansiyonu` spec'i — DOĞRULA).
**CQRS:** BulkCreate/Update bell schedule `templateKey` ile gruplu; yeni `PUT /school-settings/bell-day-assignments` command + handler; `GET /bell-schedules` templateKey ile döner. INV-ZIL bulk save'de doğrulanır (end>start, çakışma yok).
**Migration:** `bell_schedules.template_key`; yeni `bell_day_assignments` tablosu (tenant scope).
**FE un-Debt (BellScheduleTab):** Tam/Yarım şablon + gün atamaları Debt kaldır; her iki şablon ve gün atamaları persist; üretici parametreleri AS-7 client-only kalır (Debt).
**Test:** bell bulk + day-assignment handler unit testleri (INV-ZIL); FE testini güncelle.
**Commit:** BE `feat: Zil şablon (TemplateKey) + BellDayAssignment + çakışma doğrulaması eklendi.` · FE `feat: Zil şablon + gün atamaları backend'e bağlandı (Debt kaldırıldı).`

---

### BE-6: Tatil — AraTatil enum + sezon-scope + birleşik kaynak (kısmi)
**Domain:** `HolidayType`'a `IntermediateBreak (AraTatil)` ekle (AS-4). (`SemesterBreak` zaten var = yarıyıl.)
**CQRS:** `GET /holidays?seasonId=` (AcademicSessionId scope; mevcut year-bazlı geriye uyumlu kalsın) — sezon parametresi opsiyonel. Create/Update/Delete yalnız okul-türü tatilleri (resmî/ara/yarıyıl kilitli kaynaklı). **Birleşik kaynak** (official MEB katalog + sezon yarıyıl feed): bu feed'ler ayrı modüllere bağlı; bu dilimde **GET response'a `source`+`locked` bayrakları** eklenir, official katalog kaynağı yoksa Debt olarak bırakılır (kısmi).
**Migration:** HolidayType enum string ise migration yok (yeni değer kabul); seasonId zaten var.
**FE un-Debt (HolidaysTab):** AraTatil türü artık geçerli enum → taksonomi tam; locked türler `source`/`locked` bayrağından gelir; sezon özeti gerçek scope.
**Test:** holiday create/update/get handler testleri (AraTatil + scope); FE testini güncelle.
**Commit:** BE `feat: HolidayType AraTatil + sezon-scope GET + source/locked bayrakları.` · FE `feat: Tatil taksonomisi (AraTatil) backend'e bağlandı.`

---

### BE-7: Bildirim matrisi + sessiz saatler + günlük SMS limiti + SMS kotası
**Domain:** `NotificationConfig`'e `QuietHoursEnabled` (bool), `QuietHoursStart`/`QuietHoursEnd` (TimeOnly?), `DailySmsLimit` (int?). Yeni matris modeli: `notification_types` master kataloğu (event key + grup + smsNa) + per-event kanal config (event×kanal). Aggregate veya owned koleksiyon kararı handler'da; en sade: `NotificationRuleConfig(EventKey, Portal, Email, Sms)` tenant tablosu.
**CQRS:** `GET /school-settings/notification-config` (matris + tercihler) + genişletilmiş `PUT`; `GET /school-settings/sms-quota` (AS-6: **statik/okuma kaynağı** — sağlayıcı entegrasyonu yoksa sabit/placeholder döndür, Debt). Bildirim olay kataloğu backend'den.
**Migration:** notification config yeni kolonlar (quiet_hours_*, daily_sms_limit); `notification_types` seed; `notification_rule_configs` tablosu + SchoolCreated seed (varsayılan matris).
**FE un-Debt (NotificationConfigTab):** Matris + sessiz saatler + SMS limiti Debt kaldır, persist; SMS kotası kartı gerçek `sms-quota` GET'ten (AS-6 statik kaynak) — yine Debt notu kalabilir.
**Test:** notification config + matris handler testleri; FE testini güncelle.
**Commit:** BE `feat: Bildirim olay×kanal matrisi + sessiz saatler + günlük SMS limiti + sms-quota okuma eklendi.` · FE `feat: Bildirim matrisi + tercihleri backend'e bağlandı (Debt kaldırıldı).`

---

### BE-8: Modül Tier + seed 6→10 + plan yenileme tarihi
**Domain:** `ModuleConfig`'e `ModuleTier`/`Tag` enum (`Core/Beta/PlanGated/Standard`) — veya master `PlanModule`/yeni `ModuleCatalog` master tablosunda tut. Seed 6→10: ekle `students`(Core), `timetable`, `finance`, `eokul`(Beta), `transport`(PlanGated), `cafeteria`, `library` (FE moduleCatalog ile hizala — 10 modül). Plan yenileme tarihi: `School`'a abonelik/yenileme alanı yoksa Debt veya `School.PlanRenewalDate` (DateOnly?) ekle.
**CQRS:** `GET /module-configs` (10 modül + tag bayrakları + isAvailableInPlan); `GET /school-settings/plan-status` (plan adı + yenileme tarihi). PATCH toggle Core/PlanGated hariç.
**Migration:** ModuleTier kolon/master; seed 6→10 backfill (her tenant); plan renewal kolonu.
**FE un-Debt (ModuleConfigTab):** moduleCatalog Debt bayrakları gerçek backend tag'lerinden; 4 yeni modül artık persist; PlanStatusCard yenileme tarihi gerçek.
**Test:** module config + plan-status handler testleri; FE testini güncelle.
**Commit:** BE `feat: ModuleTier + 10 modül seed + plan-status (yenileme tarihi) eklendi.` · FE `feat: Modüller tag/seed/plan-durumu backend'e bağlandı (Debt kaldırıldı).`

---

### BE-9: Akademik Yapı — Subjects CRUD + kademe şube agregasyonu + BranchNamingPattern
**Domain/CQRS:** Subjects (Academics) CRUD: `POST/PUT/DELETE /subjects` (master veri; AS-1 branşsız ders yönetimi) + inuse guard (aktif ders programında kullanılıyorsa silinemez, pasife). Kademe şube sayısı: `GET /academic-structure/levels` (Class agregasyonu — her kademe/seviye için aktif şube sayısı, AS-3). BranchNamingPattern: K6 statik kaldı — backend GEREKMEZ (atla).
**Migration:** subjects soft-delete/durum alanı gerekiyorsa ekle (DOĞRULA — Subject master, status var mı).
**FE un-Debt (AcademicStructureTab):** Ders Kataloğu CRUD gerçek (inuse guard); şube sayısı gerçek agregasyondan (Debt kaldır).
**Test:** subjects CRUD + inuse guard testleri; levels aggregation testi; FE testini güncelle.
**Commit:** BE `feat: Subjects CRUD (inuse guard) + academic-structure/levels şube agregasyonu eklendi.` · FE `feat: Akademik Yapı ders kataloğu + şube sayısı backend'e bağlandı (Debt kaldırıldı).`

---

## Yürütme Sırası ve Notlar
- Sıra: BE-1 (izin tabanı) → BE-2 → BE-3 → BE-4 → BE-5 → BE-6 → BE-7 → BE-8 → BE-9. Her dilim subagent-driven: implementer (Opus) → task-review → fix → commit (BE repo + FE repo ayrı commit'ler).
- Her dilimde **usage-sweep** (özellikle BE-2 drop'ları) zorunlu; kırılan tüketici varsa düzelt.
- Integration testleri DB (docker compose) ister; yoksa unit + build ile doğrula, integration testini yaz + "DB gerekli" not düş.
- `completion_status.md` her dilim sonunda güncellenir; Debt envanterinden tamamlanan kalem çıkarılır.
- Faz kapanışı: full backend test + web test + her iki build yeşil; final whole-branch review.

## Self-Review Notları
- Bu plan, .NET CQRS house-pattern'ini recon referansından izler; her dilim "hangi dosyalar + hangi alan/kural/imza + FE un-Debt + test" verir (tam C# transkripsiyonu yerine — pattern dokümante). Implementer pattern'i çoğaltır.
- Spec çakışma kontrolü: `oksis-admin-ekranlari-mimari-spec.md` + `gun-konvansiyonu` (BE-5 DayOfWeek) + `sezon-baglam` (BE-6 seasonId) ile hizalı yürütülür; çakışma çıkarsa durup kullanıcıya madde no ile bildir.
