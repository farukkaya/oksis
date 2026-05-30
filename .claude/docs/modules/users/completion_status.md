# Kullanıcı Yönetimi (Users) — Tamamlanma Durumu

> Bu dosya modülün ne ölçüde tamamlandığını ve spec dışına çıkılan
> durumları raporlar. İlgili her geliştirmede ANINDA güncellenir.
> Status snapshot'tır, kural deposu değil (tam kurallar `business-rules.md`).

**İlerleme:** `▓▓▓▓▓▓░░░░` %58   ·   Status: in-progress (ISSUE-03 Person/Profile API commit'li)   ·   Güncel: 2026-05-30

> Temel: Doküman büyük ölçüde dolu (≈7 `{{TBD}}`). Web'de admin `users` sayfası mevcut;
> backend kullanıcı yetenekleri `identity` modülü üzerinden gelir (bu modül onunla örtüşür).
> Backend kapsamı README'ye göre genişletilecek.

---

## 🧭 Faz-0 Geçiş Kararları (2026-05-30)

OKSMVP-2 (16 issue, 296 SP) implementasyonu öncesi kapatılan çekirdek kararlar. Detay rationale `open-questions.md` arşivinde; kalıcı kural haline gelecekler ISSUE-01 sırasında `business-rules.md`/`domain-model.md`'ye işlenecek.

| # | Konu | Karar |
|---|---|---|
| K1 | Mimari geçiş şekli | **Sıfırdan**: eski Identity user-management modeli emekliye; yeni `Modules/Users` ayrı açılır. Prod veri yok → drop/recreate serbest. |
| K2 | Rol modeli geçişi | **Köprü dönemi**: `User.Role` enum bir süre yaşar, `RoleAssignment` paralel kurulur; cut-over Faz-4'te. |
| K3 | OQ-009 Person↔Account | **Tek Person ↔ Tek Account** (`LinkedAccountId` tekil nullable). Person çok profil taşır; tek login + web/mobil **profil değiştirici (switch)** ile profiller arası geçiş. JWT kişinin tüm rollerini/profillerini taşır, aktif profil istemci context'i. |
| K4 | OQ-005 Kimlik no | **Tek alan + `IdType` enum** (`Tckn`/`Ykn`/`Passport`); tek `national_id_hash`/`encrypted` çifti, validation idType'a göre dallanır. |
| K5 | Kripto anahtar | **Tenant-scoped salt** (hash) + **app-level AES-GCM key** (deployment secret/KeyVault). Cross-tenant kimlik eşleştirme (OQ-006) MVP dışı. |
| K6 | Davet çakışması | **Yeni `Invitation` aggregate** `Modules/Users`'ta; mevcut Identity invitation handler'ları + web `modules/invitations` cleanup commit'iyle emekliye. |
| K7 | Davet TTL | **7 gün**; resend = eski token revoke + yeni token + yeni 7 gün. |
| K8 | OQ-001 Sezon rol kopya | **Hibrit akıllı default**: `TerminatedAt = null` personel otomatik kopyalanır, ayrılanlar atlanır; öğrenciler `classrooms`'tan gelir. |
| K9 | OQ-003 Consent metni | **Minimal `consent_bundle_versions` tablosu** (seed'li current version + hash); tam admin yayın CRUD'u sonraya. |
| K10 | OQ-007 Veli adresi | **`IsPaymentResponsible = true` ise zorunlu**, diğer velilerde opsiyonel. |

**Park edilenler (blocker değil, varsayılan ile):** OQ-002 13-yaş profil değişikliği (Sprint 5, default: 13 altı hesap yok / 13+ kendi düzenler) · OQ-004 retention (Sprint 5-6, açık) · OQ-006 MasterIdentity cross-tenant (post-MVP, K5 ile "eklenmesin") · OQ-008 alumni portal (post-MVP, Graduated state işaretlenir portal yok) · OQ-010 OTP/passwordless (Sprint 4, ISSUE-07 zaten parola zorunlu).

**K3'ün scope etkisi:** Profil değiştirici (web+mobil) ve JWT çoklu-rol, 16 issue'da net kapsanmıyor — küçük ek kalemler (bkz. aşağıda).

---

## ✅ Tamamlanan Yapılar

- **Doküman:** büyük ölçüde dolu (≈7 `{{TBD}}`).
- **Web:** `portals/admin/pages/users` (frontend mock/iskelet hazır).
- **Backend (identity üzerinden):** kullanıcı + davet handler'ları `Modules/Identity` içinde (K1/K6 ile emekliye ayrılacak).
- **ISSUE-01 — Domain model foundations (2026-05-30):** `Oksis.Domain/Modules/Users` oluşturuldu.
  - Aggregate/entity: `Person` (yaşam döngüsü state machine), `Profile` (abstract, TPH) + `Student/Teacher/Parent/StaffProfile`.
  - VO: `PersonName`, `Email`, `PhoneNumber`, `Address`, `EmergencyContact`, `NationalId` (yalnız hash+encrypted, plain TCKN domain'e girmez).
  - Enum (11): lifecycle, profile, gender, relation, access-level, role-assignment-status, invitation-status/channel, consent-type/status, **`IdType` (K4)**.
  - Person event (8): created/activated/profileAttached/suspended/reactivated/graduated/transferred/archived.
  - `UsersDomainException`. **Users domain testleri 50 yeşil** (theory case'leri dahil; tüm domain paketi 158 yeşil); yaşam döngüsü geçişleri, profil invariant'ları, VO normalizasyonu, event emisyonu. Domain build + `dotnet format` temiz. Commit `452b80d` + test fix `65199c0` (branch: `users`, henüz push edilmedi).
  - **Konvansiyon notu:** event'ler `IDomainEvent` (`OccurredAt` taşır) implement eder — projede `DomainEvent` base record yok. VO'lar `record` (projede `ValueObject` base yok). `Profile.SchoolId` insert'te `TenantSaveChangesInterceptor` ile dolar, domain'de set edilmez.
- **ISSUE-02 — API persistence + kimlik güvenliği (2026-05-30):** EF Core mapping + migration + TCKN koruma servisi.
  - **EF config:** `Configurations/Users/` altında `Person` + `Profile` (TPH) + 4 alt tip + owned VO map'leri. `users` şeması (`ToUsersTable`). `Person.NationalId` owned VO → `national_id_type/hash/encrypted`; `PrimaryEmail/PrimaryPhone` value-converter; `PersonName` owned (`first_name/last_name`); `ParentProfile.Address` JSON owned kolon.
  - **Güvenlik (K5):** `INationalIdProtector` (Application abstraction) + `NationalIdProtector` (Infrastructure): tenant-scoped HMAC-SHA256 deterministik hash + AES-256-GCM şifreleme (`nonce||tag||cipher`). Açık TCKN domain'e hiç girmez. Anahtarlar `NationalIdProtection` config bölümü (dev keys Mac/Win-Development.json; prod env/KeyVault).
  - **Migration:** `20260530123902_AddUsersPersonsAndProfiles` — `persons` + `profiles` (TPH) tabloları, tüm index'ler model-bazlı. Tenant-scoped unique index'ler: `ux_persons_national_id_hash`, `ux_profiles_school_id_student_number/teacher_employee_number/staff_employee_number`.
  - **Test:** 5 persistence integration (TPH round-trip, tenant izolasyonu, TCKN hash-only saklama, kimlik+öğrenci no tekillik) + 5 `NationalIdProtector` birim (round-trip, deterministik hash, okullar-arası farklı hash, non-deterministik şifreleme, tenant zorunluluğu). **Tüm solüsyon 1129 test yeşil** (Api 78, Application 229, Domain 158, Infrastructure 586, Tests 78). Build + `dotnet format` temiz. Commit `7383003` (branch `users`, henüz push edilmedi).

- **ISSUE-03 — Person/Profile API'leri (2026-05-30):** `Oksis.Application/Modules/Users` + `PersonsController` (`api/v1/users/persons`).
  - **CQRS:** Komutlar — `CreatePerson` (Draft + opsiyonel başlangıç profili), `UpdatePerson` (demografi+iletişim), `DeletePerson` (soft delete), `AttachProfile`, `UpdateProfile`, yaşam döngüsü: `SuspendPerson`/`ReactivatePerson`/`GraduatePerson`/`TransferPerson`/`ArchivePerson`. Sorgular — `ListPersons` (sayfalı, filtre: search≥2 / profileType / lifecycleState / sort, max pageSize=100), `GetPersonDetail`. Hepsi `[Tenancy(Required)]` + dokümante `[RequirePermission]`.
  - **Güvenlik:** TCKN açık değeri `INationalIdProtector` ile hash+şifreliye çevrilir; tenant-içi hash tekilliği create'te 409 (`USERS_PERSON_DUPLICATE_NATIONAL_ID`); öğrenci/personel no tekilliği 409. Açık TCKN hiçbir response'da dönmez (detayda yalnız `hasNationalId` + `nationalIdType`).
  - **Envelope + hata kodları:** `ResultExtensions.MapStatusCode` `USERS_*` kodlarını eşler (NOT_FOUND→404, DUPLICATE→409, diğer→400). Geçersiz yaşam döngüsü geçişi `USERS_LIFECYCLE_INVALID_TRANSITION` (400).
  - **Domain:** Person'a additive `UpdateDemographics(name, birthDate, gender)` eklendi (ISSUE-01 izolasyonunu bozmadan).
  - **Permission seed + migration:** 4 yeni izin `users.suspend/graduate/transfer/archive` (`PermissionSeedData` + `MasterSeedIds` + `RolePermissionSeedData` → SuperAdmin/SchoolAdmin otomatik). Migration `20260530150027_20260530_add_users_lifecycle_permissions`. permission-matrix.md güncellendi.
  - **Test:** Application 49 yeni (handler happy path, TCKN/öğrenci no çakışması, lifecycle invalid-transition, validator'lar, permission-attribute sözleşmesi) + Integration 3 (gerçek SQL duplicate hash/öğrenci no 409 + tenant izolasyonu). Tüm projeler yeşil: Domain 158, Application 454, Api 70, Tests 22, Integration 64. Build + `dotnet format` temiz.

## ⏳ Eksik / Bekleyen Yapılar

- Kalan doküman `{{TBD}}` alanları (≈7).
- Backend kullanıcı yönetimi kapsamının genişletilmesi (README notu).
- Web users sayfasının gerçek API'ye bağlanması (mock → live).

## ➕ Karar Kaynaklı Ek Kapsam (16 issue dışı)

- **Profil değiştirici (K3):** web + mobilde tek login sonrası profiller arası switch UI'ı. Issue 11-16'da yok → eklenecek (~küçük).
- **JWT çoklu-rol (K3):** Identity JWT üretimi kişinin tüm aktif RoleAssignment'larını claim'e koymalı → ISSUE-05/ISSUE-10 + Identity auth dokunuşu.
- **Sezon rol aktarım wizard'ı (K8):** hibrit kopya + manuel override UI'ı; `seasons` modülü/ISSUE-05 sınırında.

## ⚠️ Spec Dışına Çıkılanlar

- **2026-05-30 — Ayrı `PersonsController` (`api/v1/users/persons`) (ISSUE-03):** Eski Identity tabanlı `UsersController` (`api/v1/users`) köprü döneminde (K1/K2) paralel yaşadığından yeni Person API'leri alt kaynak `persons` altında ayrı controller olarak açıldı; route çakışması yok (`{id:guid}` ≠ `persons` literal). Cut-over Faz-4'te. Geri dönülebilir.
- **2026-05-30 — `currentRoles` + `seasonId` no-op (ISSUE-03):** Liste/detay DTO'larında `currentRoles` (RoleAssignment) ve `ListPersons.seasonId` filtresi api-contracts'ta var ama RoleAssignment ISSUE-03 kapsamı dışı; alanlar dönmüyor / parametre no-op. Rol atama issue'sunda tamamlanacak.
- **2026-05-30 — `UpdatePerson`/`UpdateProfile` domain mutator'larıyla sınırlı (ISSUE-03):** `UpdatePerson` yalnız demografi+iletişim günceller (TCKN değişimi ayrı güvenli akışa bırakıldı). `UpdateProfile` ISSUE-01 domain metotlarının izin verdiği alanlarla sınırlı: Student→sınıf/aktiflik, Teacher/Staff→`TerminatedAt`, Parent→adres/ödeme sorumlusu. Öğrenci no / branş gibi alanların düzenlenmesi domain'de mutator gerektirir (sonraya).
- **2026-05-30 — Açık TCKN response'ta hiç dönmüyor (ISSUE-03):** api-contracts maskelenmiş gösterimden söz ediyor; ancak "full-field" reveal için tanımlı bir permission seed'i yok. MVP'de detay yalnız `hasNationalId` + `nationalIdType` döner; yetkili açık gösterim akışı (INationalIdProtector.Reveal + yeni permission) sonraya bırakıldı. Yasak kuralıyla (plain TCKN response/log) uyumlu.

- **Modül örtüşmesi:** `users` ile `identity` doc modülleri kapsamca örtüşüyor; backend kullanıcı/yetki kodu `Modules/Identity` altında tek noktada. K1/K6 ile çözülüyor: user-management + davet `Modules/Users`'a taşınır, `Modules/Identity` yalnız auth (login/refresh/JWT) olarak kalır (bkz. [[identity]] completion_status).
- **Eski user-management batık maliyeti:** `Admin.Users-v1.Finished` (Identity user-CRUD + web users mock + `modules/invitations`) K1 gereği değiştirilecek; harcanan efor kayıp olarak kabul edildi.
- **2026-05-30 — Strongly-typed ID kullanılmadı (ISSUE-01):** `domain-model-rules.md §3` PK'lerde strongly-typed ID'yi (`record struct PersonId`) zorunlu kılıyor; ancak `Common/Entity` base'i `Guid Id` veriyor ve mevcut **çalışan** `User` entity'si de plain `Guid` kullanıyor (`UserId` struct tanımlı ama atıl). Base refactor'ü tüm entity'leri etkileyeceğinden kapsam dışı bırakıldı; `Person`/`Profile` mevcut çalışan pattern'e uyup `Guid Id` kullanıyor. **Gerekçe:** çalışan kodla tutarlılık + ISSUE-01 izolasyonu. Geri dönülebilir (henüz EF map/DTO yok). Onay: kullanıcı (greenfield kararı bağlamında). Etki: domain event'ler `Guid` taşıyor.
- **2026-05-30 — Email/PhoneNumber VO çoğaltıldı:** generic `Email`/`PhoneNumber` VO'ları hâlâ `Modules/Identity/ValueObjects`'ta da var. Modül sınırını korumak için (K6 — Identity yalnız auth) `Modules/Users/ValueObjects` altında kendi kopyaları oluşturuldu. İleride `Common`'a terfi edilebilir.
- **2026-05-30 — Profiller TPH tek tabloda (ISSUE-02):** `database-schema.md` her profil tipi için ayrı tablo (`student_profiles`, `teacher_profiles` ...) tarif ediyor; ancak ISSUE-01 domain'i bir kalıtım hiyerarşisi (`Profile` abstract + alt tipler) olarak commit'lendiğinden EF TPH ile tek `users.profiles` tablosu + `profile_type` discriminator kullanıldı. Ortak kolonlar (employee_number/hire_date/terminated_at) tip çakışmasını önlemek için `teacher_`/`staff_` ön ekli. **Gerekçe:** domain modeliyle tutarlılık, daha az join. **Etki:** doc'taki per-tablo şema artık tek tabloyu yansıtmıyor (database-schema.md'ye not düşüldü). Geri dönülebilir (TPT'ye geçiş migration ile).
- **2026-05-30 — `national_id_hash` global unique (school_id'siz) (ISSUE-02):** doc `ux_persons_school_id_national_id_hash` (composite) öngörüyor; hash tenant-scoped HMAC olduğundan (K5) okullar-arası çakışma imkânsız, bu yüzden owned-VO kolonunda `ux_persons_national_id_hash` (global, `national_id_hash IS NOT NULL` filtreli) kullanıldı — EF owned-type + owner kolonu birleşik index'i fluent ile desteklemiyor. Soft-delete'li satır da hash'i tutar (doc `is_deleted=0` filtresi tam karşılanmıyor; düşük riskli, retention hard-delete ile çözülecek). Onay: greenfield bağlamı.
- **2026-05-30 — TPH derived index'leri `OnModelCreating`'de (ISSUE-02):** profil tekillik unique index'leri alt-tip config'leri yerine `OksisDbContext.OnModelCreating`'de (ApplyConfigurations sonrası) tanımlandı; `ApplyConfigurationsFromAssembly` base/derived sırası garanti etmediğinden derived-type index'leri `EnsureCreated`'da düşüyordu (integration test ile yakalandı).
