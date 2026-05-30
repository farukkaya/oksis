# Kullanıcı Yönetimi (Users) — Tamamlanma Durumu

> Bu dosya modülün ne ölçüde tamamlandığını ve spec dışına çıkılan
> durumları raporlar. İlgili her geliştirmede ANINDA güncellenir.
> Status snapshot'tır, kural deposu değil (tam kurallar `business-rules.md`).

**İlerleme:** `▓▓▓▓░░░░░░` %40   ·   Status: planning (Faz-0 kararları kapandı)   ·   Güncel: 2026-05-30

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

## ⏳ Eksik / Bekleyen Yapılar

- Kalan doküman `{{TBD}}` alanları (≈7).
- Backend kullanıcı yönetimi kapsamının genişletilmesi (README notu).
- Web users sayfasının gerçek API'ye bağlanması (mock → live).

## ➕ Karar Kaynaklı Ek Kapsam (16 issue dışı)

- **Profil değiştirici (K3):** web + mobilde tek login sonrası profiller arası switch UI'ı. Issue 11-16'da yok → eklenecek (~küçük).
- **JWT çoklu-rol (K3):** Identity JWT üretimi kişinin tüm aktif RoleAssignment'larını claim'e koymalı → ISSUE-05/ISSUE-10 + Identity auth dokunuşu.
- **Sezon rol aktarım wizard'ı (K8):** hibrit kopya + manuel override UI'ı; `seasons` modülü/ISSUE-05 sınırında.

## ⚠️ Spec Dışına Çıkılanlar

- **Modül örtüşmesi:** `users` ile `identity` doc modülleri kapsamca örtüşüyor; backend kullanıcı/yetki kodu `Modules/Identity` altında tek noktada. K1/K6 ile çözülüyor: user-management + davet `Modules/Users`'a taşınır, `Modules/Identity` yalnız auth (login/refresh/JWT) olarak kalır (bkz. [[identity]] completion_status).
- **Eski user-management batık maliyeti:** `Admin.Users-v1.Finished` (Identity user-CRUD + web users mock + `modules/invitations`) K1 gereği değiştirilecek; harcanan efor kayıp olarak kabul edildi.
- **2026-05-30 — Strongly-typed ID kullanılmadı (ISSUE-01):** `domain-model-rules.md §3` PK'lerde strongly-typed ID'yi (`record struct PersonId`) zorunlu kılıyor; ancak `Common/Entity` base'i `Guid Id` veriyor ve mevcut **çalışan** `User` entity'si de plain `Guid` kullanıyor (`UserId` struct tanımlı ama atıl). Base refactor'ü tüm entity'leri etkileyeceğinden kapsam dışı bırakıldı; `Person`/`Profile` mevcut çalışan pattern'e uyup `Guid Id` kullanıyor. **Gerekçe:** çalışan kodla tutarlılık + ISSUE-01 izolasyonu. Geri dönülebilir (henüz EF map/DTO yok). Onay: kullanıcı (greenfield kararı bağlamında). Etki: domain event'ler `Guid` taşıyor.
- **2026-05-30 — Email/PhoneNumber VO çoğaltıldı:** generic `Email`/`PhoneNumber` VO'ları hâlâ `Modules/Identity/ValueObjects`'ta da var. Modül sınırını korumak için (K6 — Identity yalnız auth) `Modules/Users/ValueObjects` altında kendi kopyaları oluşturuldu. İleride `Common`'a terfi edilebilir.
