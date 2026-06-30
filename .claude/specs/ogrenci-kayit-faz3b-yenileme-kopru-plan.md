# Öğrenci Kayıt Faz 3B (Yenileme + Rollover Köprüsü) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 3A'da toplanan yenileme niyetini (`Renewing`) gerçek bir gelecek-sezon taslak kaydına ve sınıf terfisine köprüle: dönem bayrağı + RenewEnrollment + PromoteStudents taslak-sürücülü gating + FE.

**Architecture:** İki backend modülü (`academic-sessions` slug=`academic-years/`, `students`) + FE (`oksis-web`). academic-sessions'a nullable `RenewalPeriodOpenedAt` bayrağı + `OpenRenewalPeriod` komutu eklenir; students'a `RenewEnrollmentCommand` (Renewing→Type=Renewal Draft taslak) + `EnrollmentRenewedEvent` eklenir; `PromoteStudents` dönem açıkken yalnız taslaklı öğrenciyi terfi eder (gating). FE "Yenilemeyi Başlat" akışını etkinleştirir.

**Tech Stack:** .NET 10, MediatR, FluentValidation, EF Core 10, Mapster, Hangfire/outbox bildirim; React + Vite + TS, React Query, RHF/Zod, shadcn/ui, i18next.

## Global Constraints

- Bağlayıcı spec: `.claude/specs/ogrenci-kayit-enrollment-spec.md` — E6.2, E6.3, E8, E10, E11.6, E4.2/E4.3 maddeleri non-negotiable. Tasarım: `.claude/specs/ogrenci-kayit-faz3b-yenileme-kopru-design.md` (S1-S6 + K1-K4).
- Multi-tenant izolasyonu asla bypass edilmez (global query filter + TenantSaveChangesInterceptor; React Query key tenant-scoped).
- Mapster (AutoMapper YASAK); repository wrapper YASAK; DbContext controller'da YASAK (MediatR üzerinden); `async void`/`.Result`/`.Wait()` YASAK.
- Hardcoded Türkçe YASAK (i18n). FE handoff portu **`.scr-*` global sistemini** kullanır (`.stu-*` DEĞİL — 3A f70bbb9 dersi).
- Component/identifier İngilizce PascalCase; UI metni Türkçe.
- Commit formatı: `YYYY-MM-DD <type>: Türkçe özet.` + `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` + `Claude-Session:` trailer. Bugün: 2026-07-01.
- Branch: `student-faz3b` ← `student-faz3a` (her iki kod reposu).
- StudentNumber değişmez (E4.4.2); Renewal taslağı `Status=Draft` + Setup sezonda (E11.6).

## Dosya haritası

**oksis-api:**
- `src/Oksis.Domain/Modules/AcademicSessions/Entities/AcademicSession.cs` — `RenewalPeriodOpenedAt` + `OpenRenewalPeriod()` (modify)
- `src/Oksis.Infrastructure/Persistence/...Migrations/..._renewal_period.cs` — migration (create)
- `src/Oksis.Application/Modules/AcademicSessions/Commands/OpenRenewalPeriod/*` — komut+handler+validator (create)
- `src/Oksis.Application/Modules/AcademicSessions/Commands/ReopenSeasonToDraft|CancelSetupSeason/*Handler.cs` — guard genişletme (modify)
- `src/Oksis.Api/Controllers/V1/AcademicSessionsController.cs` (veya mevcut) — `open-renewal-period` ucu (modify)
- `src/Oksis.Domain/Modules/Students/Events/EnrollmentRenewedEvent.cs` (create)
- `src/Oksis.Application/Modules/Students/Commands/RenewEnrollment/*` (create)
- `src/Oksis.Application/Modules/Students/Queries/ListRenewalCandidates/*` — `classRoomId?` (modify)
- `src/Oksis.Application/Modules/Students/Commands/PromoteStudents/PromoteStudentsCommandHandler.cs` — gating (modify)
- `src/Oksis.Api/Controllers/V1/EnrollmentsController.cs` — `:renew` (modify)
- Bildirim: recipient resolver + i18n şablonu (mevcut Notifications altyapısı deseni)
- İzin seed: `season.renewal.open` (mevcut season.* seed migration deseni)

**oksis-web:**
- `src/modules/.../renewal/renewalApi.ts` + hooks (modify/create)
- `src/portals/admin/students/RenewalPage.*` (modify) + `renewal.css`
- i18n `renewal.*` (tr+en)

**oksis (workspace docs):** `students/*`, `academic-years/*`, `permission-matrix.md`

---

## Task 0: Branch kurulumu

**Files:** yok (git).

- [ ] **Step 1:** oksis-api'de `student-faz3a` üzerinden `student-faz3b` aç.

Run: `cd /Users/farukkaya/Projects/oksis/oksis-api && git checkout student-faz3a && git checkout -b student-faz3b`
Expected: "Switched to a new branch 'student-faz3b'"

- [ ] **Step 2:** oksis-web'de aynısı.

Run: `cd /Users/farukkaya/Projects/oksis/oksis-web && git checkout student-faz3a && git checkout -b student-faz3b`
Expected: yeni branch.

---

## Task 1: AcademicSession.RenewalPeriodOpenedAt + OpenRenewalPeriod + migration (oksis-api)

**Files:**
- Modify: `src/Oksis.Domain/Modules/AcademicSessions/Entities/AcademicSession.cs`
- Test: `tests/Oksis.Domain.UnitTests/Modules/AcademicSessions/AcademicSessionTests.cs`
- Create: EF migration `..._renewal_period`

**Interfaces:**
- Produces: `AcademicSession.RenewalPeriodOpenedAt : DateTimeOffset?` (get; private set), `void OpenRenewalPeriod(DateTimeOffset now)`.

- [ ] **Step 1: Failing domain tests.** `OpenRenewalPeriod` sadece `Status==Setup`'ta `RenewalPeriodOpenedAt` set eder; `Active`/`Archived`'da `DomainException` (mevcut `Activate`/`Archive` test desenini izle); zaten açıksa ikinci çağrı no-op (timestamp değişmez). Mevcut `AcademicSessionTests` dosyasındaki Create→Setup kurulumunu kullan.

- [ ] **Step 2:** `dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~RenewalPeriod"` → FAIL (metot yok).

- [ ] **Step 3:** Entity'ye `RenewalPeriodOpenedAt` + `OpenRenewalPeriod(now)` ekle: `if (Status != Setup) throw new DomainException(...); if (RenewalPeriodOpenedAt is null) RenewalPeriodOpenedAt = now;`. Hata mesajı mevcut DomainException deseniyle.

- [ ] **Step 4:** EF config (`AcademicSessionConfiguration` varsa) nullable kolon; migration üret:
Run: `dotnet ef migrations add 20260701_renewal_period --project src/Oksis.Infrastructure --startup-project src/Oksis.Api`
Migration adını dosya prefiksinden bağımsız `renewal_period` tut; sadece `renewal_period_opened_at` nullable kolon eklediğini doğrula (başka tablo değişikliği olmamalı; varsa migration'ı temizle).

- [ ] **Step 5:** `dotnet test ...~RenewalPeriod` → PASS; `dotnet build` temiz.

- [ ] **Step 6: Commit** (`2026-07-01 feat,test: AcademicSession yenileme dönemi bayrağı (RenewalPeriodOpenedAt + OpenRenewalPeriod, yalnız Setup) + migration.`)

---

## Task 2: OpenRenewalPeriodCommand + REST + season.renewal.open izni (oksis-api)

**Files:**
- Create: `src/Oksis.Application/Modules/AcademicSessions/Commands/OpenRenewalPeriod/{OpenRenewalPeriodCommand,OpenRenewalPeriodCommandHandler,OpenRenewalPeriodCommandValidator}.cs`
- Modify: AcademicSessions controller; permission seed migration (yeni `season.renewal.open`)
- Test: `tests/Oksis.Application.UnitTests/...OpenRenewalPeriod...` veya Infrastructure.IntegrationTests (sibling `ActivateAcademicSession` testi deseni)

**Interfaces:**
- Consumes: Task 1 `OpenRenewalPeriod(now)`.
- Produces: `OpenRenewalPeriodCommand(Guid SessionId) : ICommand<Unit>` (veya `OpenRenewalPeriodResult`); REST `POST /api/v1/academic-sessions/{id}/open-renewal-period`.

- [ ] **Step 1: Failing handler/integration test.** Setup sezonda komut → `RenewalPeriodOpenedAt != null`; Active sezon → 409/`DomainException`; olmayan sezon → 404; tenant-izolasyon (başka okul sezonu 404); izinsiz → 403. `ActivateAcademicSessionCommandHandler` testini şablon al.

- [ ] **Step 2:** test → FAIL.

- [ ] **Step 3:** Komut+handler+validator yaz. Attribute'lar: `[Tenancy(TenancyMode.Required)]`, `[RequirePermission("season.renewal.open")]`. Handler: `db.AcademicSessions` (tenant filter otomatik) → bul (yoksa `Result`/exception 404) → `session.OpenRenewalPeriod(clock.Now)` → `SaveChanges`. Validator `SessionId.NotEmpty()`. Controller'a ince uç ekle (`ToHttpResult`). Mevcut `ActivateAcademicSession` slice'ını birebir desen al.

- [ ] **Step 4:** Yeni izin seed migration: mevcut `season.*` izinlerini ekleyen seed migration'ı bul; `season.renewal.open`'ı **default-deny** (hiçbir role atanmadan) ekle. Migration üret.

- [ ] **Step 5:** testler PASS; `dotnet build` + `dotnet format`.

- [ ] **Step 6: Commit** (`2026-07-01 feat,test: OpenRenewalPeriodCommand + REST (POST .../open-renewal-period) + season.renewal.open izni (default-deny).`)

---

## Task 3: Reopen/Cancel guard genişletmesi (BR-AS-015 veri-kaybı fix) (oksis-api)

**Files:**
- Modify: `ReopenSeasonToDraftCommandHandler.cs`, `CancelSetupSeasonCommandHandler.cs`
- Test: ilgili integration/unit test dosyaları

**Interfaces:**
- Consumes: Task 1 `RenewalPeriodOpenedAt`; `StudentEnrollment` (Type=Renewal taslak).

- [ ] **Step 1: Failing test.** Hedef Setup sezonda `RenewalPeriodOpenedAt != null` → reopen/cancel **409** (veya mevcut `reopen-has-data` guard exception tipi). Ayrıca sezonda `Type=Renewal` taslak enrollment varsa → 409. Mevcut guard'ı tetikleyen test deseni (şube verisi) referans.

- [ ] **Step 2:** FAIL.

- [ ] **Step 3:** Her iki handler'daki mevcut guard koşuluna ekle: `RenewalPeriodOpenedAt != null` **veya** `db.StudentEnrollments.Any(e => e.AcademicSessionId == sessionId && e.Type == EnrollmentType.Renewal && e.Status == Draft)` → reddet. Mevcut guard mesaj/exception tipini koru.

- [ ] **Step 4:** PASS; build.

- [ ] **Step 5: Commit** (`2026-07-01 feat,test: Reopen/cancel guard yenileme dönemi + Renewal taslak varlığını da reddetsin (BR-AS-015 sessiz veri kaybı fix).`)

---

## Task 4: EnrollmentRenewedEvent + StudentEnrollment Renewal taslak desteği (oksis-api)

**Files:**
- Create: `src/Oksis.Domain/Modules/Students/Events/EnrollmentRenewedEvent.cs`
- Modify (gerekiyorsa): `StudentEnrollment.cs` — Renewal/Draft Create yolu + `Activate(Guid classRoomId)` aşırı yüklemesi (gating'de Draft→Active+ClassRoomId için)
- Test: `tests/Oksis.Domain.UnitTests/.../StudentEnrollmentTests.cs`

**Interfaces:**
- Produces: `EnrollmentRenewedEvent(Guid EnrollmentId, Guid SchoolId, Guid StudentPersonId, Guid AcademicSessionId, Guid SourceEnrollmentId, IReadOnlyList<Guid> GuardianPersonIds) : IDomainEvent` (OccurredAt). `StudentEnrollment` Renewal Draft factory + classroom-aktivasyon davranışı.

- [ ] **Step 1: Failing domain test.** (a) `StudentEnrollment.Create(Type=Renewal, Draft, ClassRoomId=null)` mevcut factory ile mümkün mü doğrula; değilse Renewal yolu için test yaz. (b) Draft kaydı `ClassRoomId` ile aktive eden davranış (`Activate` ya da yeni `PlaceInClassRoom(classRoomId, now)`): `Status Draft→Active`, `ClassRoomId` set. Geçersiz geçiş (Active'ten tekrar) → exception. `StudentEnrolledEvent` deseninden event şeklini al.

- [ ] **Step 2:** FAIL.

- [ ] **Step 3:** `EnrollmentRenewedEvent` kaydını oluştur (StudentEnrolledEvent.cs yapısını izle). Gerekliyse `StudentEnrollment`'a Draft→Active+ClassRoomId davranışı ekle (E1.3: ClassRoomId mirror). Renewal Create yolu zaten varsa dokunma.

- [ ] **Step 4:** PASS; build.

- [ ] **Step 5: Commit** (`2026-07-01 feat,test: EnrollmentRenewedEvent + StudentEnrollment Renewal taslak aktivasyon davranışı (Draft→Active+ClassRoomId).`)

---

## Task 5: RenewEnrollmentCommand + event + veli bildirimi + REST (oksis-api)

**Files:**
- Create: `src/Oksis.Application/Modules/Students/Commands/RenewEnrollment/{RenewEnrollmentCommand,Handler,Validator}.cs`
- Modify: `EnrollmentsController.cs` (`enrollments:renew`)
- Create: `INotificationRecipientResolver<EnrollmentRenewedEvent>` impl + i18n bildirim şablonu (mevcut bir resolver'ı şablon al, örn. StudentEnrolledEvent resolver'ı)
- Test: Infrastructure.IntegrationTests (Renewal sliceları yanına)

**Interfaces:**
- Consumes: Task 4 event + Renewal Create; Task 1 sezon.
- Produces: `RenewEnrollmentCommand(Guid TargetSessionId) : ICommand<RenewEnrollmentResult>`; `RenewEnrollmentResult(int Created, int Skipped)`; REST `POST /api/v1/enrollments:renew`.

- [ ] **Step 1: Failing integration tests.**
  - Cari aktif sezonda `Intent==Renewing` + `Status==Active` olanlar için hedef Setup sezonda `Type=Renewal, Status=Draft, ClassRoomId=null, GradeLevel=kaynak+1` taslak oluşur; `Created` doğru.
  - `Undecided`/`Leaving`/`null` intent → taslak YOK.
  - Terminal sınıf (üst aktif seviye yok) Renewing → atlanır (`Skipped`).
  - İdempotent: ikinci çağrı yeni taslak açmaz (`Created=0`, `Skipped` artar).
  - Her taslak için `EnrollmentRenewedEvent` outbox'a yazılır (outbox satır sayısı = Created).
  - StudentNumber değişmez.
  - Hedef sezon Setup değilse 409; tenant-izolasyon; izinsiz 403.

- [ ] **Step 2:** FAIL.

- [ ] **Step 3:** Handler yaz. Attribute: `[Tenancy(Required)]`, `[RequirePermission("students.renew")]`. Akış tasarım §4.1: aktif sezon bul → Renewing/Active enrollment'lar → eleme (mevcut taslak / terminal sınıf via `SchoolGradeLevels.IsActive`) → `StudentEnrollment.Create(Renewal, Draft, ...)` → event raise (guardian id'leri `GuardianLink`/parents modülünden çöz; StudentEnrolledEvent resolver desenini izle) → tek `SaveChanges`. Validator `TargetSessionId.NotEmpty()`. Controller ucu (`ToHttpResult`). Recipient resolver + i18n bildirim şablonu ("renewal.notification.renewed" — sınıfsız).

- [ ] **Step 4:** PASS; `dotnet build` + `dotnet format`.

- [ ] **Step 5: Commit** (`2026-07-01 feat,test: RenewEnrollmentCommand (Renewing→Type=Renewal Draft taslak) + EnrollmentRenewedEvent veli bildirimi + REST enrollments:renew.`)

---

## Task 6: PromoteStudents taslak-sürücülü gating (E6.3) (oksis-api)

**Files:**
- Modify: `src/Oksis.Application/Modules/Students/Commands/PromoteStudents/PromoteStudentsCommandHandler.cs`
- Test: Infrastructure.IntegrationTests (mevcut PromoteStudents testi yanına)

**Interfaces:**
- Consumes: Task 1 `RenewalPeriodOpenedAt`; Task 4 Draft→Active+ClassRoomId.

- [ ] **Step 1: Failing tests.**
  - **Dönem AÇIK** (`target.RenewalPeriodOpenedAt != null`): yalnız hedef sezonda `Type=Renewal` taslağı olan öğrenci koltuğa yerleşir; taslağı yoksa atlanır (`Skipped`); yerleşen öğrencinin taslağı `Draft→Active` + `ClassRoomId` set. Mezuniyet (terminal) korunur.
  - **Dönem KAPALI** (`== null`): mevcut legacy davranış **aynen** — tüm roster terfi/mezun, `StudentEnrollment`'a dokunulmaz (yeni taslak aktive edilmez). Mevcut PromoteStudents testleri yeşil kalmalı.
  - İdempotent: ikinci çağrı çift koltuk/çift aktivasyon yapmaz.

- [ ] **Step 2:** FAIL.

- [ ] **Step 3:** Handler'a koşul ekle: hedef sezonu yükle; `RenewalPeriodOpenedAt != null` ise — kaynak roster öğrencisini hedef sezondaki Renewal Draft enrollment'la eşle (StudentPersonId); eşleşeni yerleştir (mevcut `AssignStudent` mantığı) **+** o enrollment'ı Draft→Active+ClassRoomId; eşleşmeyeni atla. `== null` ise mevcut blok değişmez. Idempotency mevcut "zaten aktif mi" kontrolüyle korunur.

- [ ] **Step 4:** PASS (yeni + mevcut PromoteStudents/Rollover testleri); build.

- [ ] **Step 5: Commit** (`2026-07-01 feat,test: PromoteStudents E6.3 gating — dönem açıksa yalnız Renewal taslaklı terfi (Draft→Active+ClassRoomId); kapalıysa legacy korunur.`)

---

## Task 7: ActivateSeasonRollover uçtan uca doğrulama (oksis-api)

**Files:**
- Test: `tests/Oksis.Infrastructure.IntegrationTests/.../ActivateSeasonRollover...` (yeni senaryo)

**Interfaces:** Consumes: Task 6 gating (imza değişmez).

- [ ] **Step 1: Failing/yeni test.** Senaryo: hedef Setup sezon + `RenewalPeriodOpenedAt` açık + bazı Renewing taslaklar + bazı Renewing-olmayan roster. `ActivateSeasonRollover` çağır → yalnız taslaklılar terfi (Promoted), taslaksızlar Skipped; görevlendirme/rol kopyaları bozulmadan çalışır; sezon Active olur. Dönem-kapalı senaryosu legacy sayıları korur.

- [ ] **Step 2:** FAIL (gating bağlanmamışsa) / doğrula.

- [ ] **Step 3:** Orkestratör kodu **değişmez** beklenir (gating PromoteStudents içinde). Test geçmiyorsa sebebi bul (sıra/transaction) ve düzelt.

- [ ] **Step 4:** PASS; tüm `dotnet test` yeşil; build+format.

- [ ] **Step 5: Commit** (`2026-07-01 test: ActivateSeasonRollover gated promote uçtan uca (dönem açık yalnız taslak terfi; kapalı legacy).`)

---

## Task 8: ListRenewalCandidates classRoomId filtresi (oksis-api)

**Files:**
- Modify: `ListRenewalCandidatesQuery.cs` + handler
- Test: mevcut ListRenewalCandidates testi yanına

**Interfaces:** Produces: `ListRenewalCandidatesQuery`'ye `Guid? ClassRoomId = null` param.

- [ ] **Step 1: Failing test.** `ClassRoomId` verilince yalnız o şubedeki adaylar döner; KPI dağılımı filtreli kümeye göre; null → tüm sezon (mevcut davranış).

- [ ] **Step 2:** FAIL.

- [ ] **Step 3:** Query'ye `Guid? ClassRoomId = null` ekle; handler where: `(classRoomId == null || e.ClassRoomId == classRoomId)`.

- [ ] **Step 4:** PASS; build.

- [ ] **Step 5: Commit** (`2026-07-01 feat,test: ListRenewalCandidates classRoomId filtresi (FE sınıf-bazlı filtre için).`)

---

## Task 9: FE yenileme hook'ları + api (oksis-web)

**Files:**
- Modify/Create: `renewalApi.ts` (+ `openRenewalPeriod`, `renewEnrollment` çağrıları), hooks `useOpenRenewalPeriodMutation`, `useRenewEnrollmentMutation`
- Test: ilgili vitest hook testleri

**Interfaces:**
- Consumes: BE `POST .../open-renewal-period`, `POST /enrollments:renew`.
- Produces: iki mutation hook'u (stabil `mutateAsync`); başarıda `renewal-candidates` invalidate (tenant-scoped key).

- [ ] **Step 1: Failing tests.** `useRenewEnrollmentMutation` doğru endpoint+body (`{targetSessionId}`) çağırır, başarıda invalidate eder; `useOpenRenewalPeriodMutation` `{sessionId}` ile çağırır. Mevcut `useSetRenewalIntentMutation` testini şablon al.

- [ ] **Step 2:** FAIL.

- [ ] **Step 3:** api fonksiyonları + hook'lar (mevcut renewal hook deseni; axios; tenant-scoped key). Mutasyon nesnesini deps'e koyma.

- [ ] **Step 4:** `npm run test` ilgili dosyalar PASS.

- [ ] **Step 5: Commit** (`2026-07-01 feat,test: FE yenileme hook'ları — useOpenRenewalPeriodMutation + useRenewEnrollmentMutation + api.`)

---

## Task 10: FE RenewalPage "Yenilemeyi Başlat" + hedef-sezon + classRoom filtre + i18n (oksis-web)

**Files:**
- Modify: `RenewalPage.*`, `renewal.css`, i18n `tr/en` `renewal.start.*`
- Test: vitest RenewalPage testleri

**Interfaces:** Consumes: Task 9 hooks; Task 8 classRoomId.

- [ ] **Step 1: Failing tests.**
  - "Yenilemeyi Başlat" artık aktif (notReadyHint yok); tıklayınca önce open-renewal-period, sonra renew-enrollment sıralı çağrılır; sonuç (created/skipped) gösterilir.
  - Sezon köprüsü gerçek hedef Setup sezonunu + dönem açık/kapalı durumunu gösterir; hedef sezon yoksa boş-durum.
  - `classRoomId` filtresi listeyi daraltır.
  - İzin yoksa buton gate'li.

- [ ] **Step 2:** FAIL.

- [ ] **Step 3:** RenewalPage'i bağla: handoff `reenroll.jsx` Başlat akışı; **`.scr-*` sınıfları** (renewal.css'te tanımlı; `.stu-*` kullanma); i18n anahtarları; classRoom filtresi `classRoomId` query param'ına. Hedef-sezon academic-sessions query'sinden.

- [ ] **Step 4:** `npm run test` RenewalPage PASS; `npm run build` temiz.

- [ ] **Step 5: Commit** (`2026-07-01 feat,test: RenewalPage 'Yenilemeyi Başlat' etkin (open+renew), gerçek hedef-sezon bağlama, classRoom filtre, i18n.`)

---

## Task 11: Doküman güncellemeleri (oksis workspace)

**Files:** `students/{domain-model,business-rules,api-contracts,completion_status}.md`, `academic-years/{business-rules,api-contracts,completion_status}.md`, `permission-matrix.md`

- [ ] **Step 1:** students/domain-model.md: `Intent: string?` ↔ `RenewalIntent?` çakışmasını ayrıştır; bayat "Faz 2 ... henüz yok" satırını düzelt; `SetRenewalIntent`+`RenewEnrollment`+aktivasyon davranışları; `EnrollmentRenewedEvent`'i events tablosuna ekle.
- [ ] **Step 2:** students/business-rules.md: BR-students-004 (taslak-sürücülü gating, terminal eleme, idempotency, S2/S3). academic-years/business-rules.md: E6.3 yansıması + reopen-guard genişletme (BR-AS-015).
- [ ] **Step 3:** api-contracts (her iki modül): `open-renewal-period`, `enrollments:renew`, `classRoomId?` param.
- [ ] **Step 4:** completion_status (her iki modül): ilerleme + "⚠️ Spec Dışına Çıkılanlar" (terminal-sınıf eleme & legacy-promote-enrollment-boşluğu notları). permission-matrix.md: `season.renewal.open` (default-deny).
- [ ] **Step 5:** README metadata bump (Last Updated/Files) her iki modül.
- [ ] **Step 6: Commit** (oksis workspace; remote yok — local). (`2026-07-01 docs: students+academic-sessions Faz 3B — köprü/gating/dönem dokümante; BR-students-004, E6.3 yansıması, permission-matrix season.renewal.open.`)

---

## Task 12: Chrome E2E ekran testi + final review + PR

**Files:** yok (doğrulama + git).

- [ ] **Step 1:** oksis-api'yi `student-faz3b`'de çalıştır (`:5112`), oksis-web vite (`:5173`). Dev DB'de hedef Setup sezon + Renewing niyetler hazırla (gerekirse 3A akışıyla).
- [ ] **Step 2:** Chrome MCP ile `/admin/students/renewal`: stilleri gözle doğrula (`.scr-*` bozuk değil); "Yenilemeyi Başlat" → open+renew; created/skipped geri bildirimi; classRoom filtresi; hedef-sezon köprüsü gerçek sezonu gösteriyor. (Opsiyonel) rollover ile gated promote koltuk dolumu. Console: ilgisiz SignalR/extension hataları tolere; gerçek hata yok.
- [ ] **Step 3:** opus whole-branch final review (code-reviewer subagent) — multi-tenant/IDOR, spec uyumu (E6.2/E6.3/E11.6), gating doğruluğu, idempotency. Bulguları düzelt + commit.
- [ ] **Step 4:** `dotnet build`+`dotnet test`+`dotnet format` (api) ve `npm run build`+`npm run test` (web) tümü yeşil — kanıtla.
- [ ] **Step 5:** finishing-a-development-branch: push `student-faz3b` (her iki repo) + PR aç (base `master`). PR gövdesinde 3A bağımlılığı (PR #28/#59 üstüne) + DoD + spec maddeleri notu. 🤖 trailer.

---

## Self-Review (plan ↔ spec)

- E6.2 → Task 4/5 (RenewEnrollment Renewing→Renewal Draft, köprü). ✔
- E6.3 → Task 6/7 (gating + rollover) + Task 11 (academic-sessions BR yansıması). ✔
- E8 → Task 5 (`:renew`), Task 2 (open-renewal-period). ✔
- E10 → Task 4/5 (EnrollmentRenewedEvent + Hangfire bildirim). ✔
- E11.6 → Task 4/5 (Draft taslak, Setup sezon). ✔
- S5 izni → Task 2 (`season.renewal.open` default-deny) + Task 11 (matrix). ✔
- BR-AS-015 fix → Task 3. ✔
- FE (D) → Task 8/9/10. ✔ Doc borcu (E) → Task 11. ✔
- Branch/DoD/E2E → Task 0/12. ✔
- Placeholder taraması: kod adımları kardeş-desen referanslı (mevcut codebase kuralı); test niyetleri somut. Tip tutarlılığı: `RenewalPeriodOpenedAt`, `EnrollmentRenewedEvent`, `RenewEnrollmentResult(Created,Skipped)`, `season.renewal.open` tüm görevlerde tutarlı. ✔
