# Kimlik Doğrulama (Identity)

> Bu modülün **tek kaynak gerçek** dokümantasyonu. Diğer dosyalar bu modülün alt başlıklarını detaylandırır.
> Kaynak teknik analiz: *Login ve Profile Switch · Teknik Analiz (Sürüm 1.0, 30 Mayıs 2026)* — `~/Downloads/oksis-login-switch-teknik-analiz-v1.md`.

---

## Amaç

Kimlik Doğrulama modülü, OKSİS'te **authentication (kimlik doğrulama)**, **context resolution (bağlam çözümleme)** ve **switch orkestrasyonu** (profil / çocuk / sezon değiştirme) işlevini sağlar. Token yönetimi (JWT access + rotating refresh), oturum güvenliği (lockout, brute-force, blacklist), parola kurtarma ve audit logging bu modülün sorumluluğundadır.

**Sorduğu temel soru:** "Bu kişi kim, hangi bağlamda (profil/çocuk/sezon) çalışıyor ve hangi yetkilere sahip?"
**Çözmediği şey:** Person/Profile/RoleAssignment/ParentStudentRelationship **yazma** tasarımı (→ `users` modülü), permission tanım/atama yönetimi UI (→ `permissions` modülü), cross-tenant master identity / SSO (post-MVP). Identity bunları yalnızca **read-port** üzerinden okur, sahiplenmez.

---

## Paydaşlar / Roller

| Rol | Kullanım Şekli |
|---|---|
| Tüm roller (Teacher/Parent/Student/Admin/Counselor) | Login, parola değiştirme, kendi oturumunu yönetme |
| Parent (çok çocuklu / çok profilli) | Profile switch (Parent↔Teacher), Child switch, birleşik dashboard |
| Tüm roller | Season switch (geçmiş sezonu salt-okunur görüntüleme) |
| SchoolAdmin / VicePrincipal | Hesap kilidi açma (admin unlock), oturum sonlandırma |
| SuperAdmin | Cross-tenant erişim (`X-Tenant-Override` + audit) |

> Tam yetki matrisi için bkz. `permissions.md` (bu klasörde) ve `permission-matrix.md` (proje kökü).

---

## Akış Özeti

Modülün ana akışı (login + context resolution):

1. **Identifier çözümleme** — identifier (email/telefon) `users.persons` üzerinden aranır, `LinkedAccountId` köprüsüyle `identity.accounts`'a geçilir (TCKN login'de tip düzeyinde reddedilir).
2. **Parola doğrulama + kapılar** — lockout/rate-limit guard → parola verify → lifecycle gate (Active?) → consent gate (KVKK) → policy gate (RequirePasswordChange).
3. **Context resolution** — aktif profil / aktif çocuk / aktif sezon çözülür; gerekiyorsa profil seçim ekranı (`409 NEEDS_PROFILE_SELECTION`).
4. **Token + oturum** — permission cache build → JWT (access 15 dk) + refresh token (rotation) issue → `LoginSucceeded` event → audit.
5. **Switch** — profile/child/season switch endpoint'leri JWT yenileme, cache invalidation, server-side child session ve audit yan etkilerini orkestre eder.

> Detaylı UI akışları için bkz. `ui-flows.md`. Domain event akışı için bkz. `notifications.md`. Sıralı akışlar teknik analiz Bölüm 18'de.

---

## İlişkili Modüller

| Modül | İlişki |
|---|---|
| `users` | **Read-only, tek yönlü** (TR-auth-001). `IPersonDirectory` / `IUsersReadFacade` read-port üzerinden Person/Profile/ConsentRecord/LifecycleState okur. Ters bağımlılık (Users→Identity) yasaktır. |
| `permissions` | Efektif permission hesaplama (permission cache build) için okunur. |
| `schools` | `School.CurrentSeason` (default sezon) ve okul timezone (quiet hours) için okunur. |
| `notifications` | Audit/güvenlik event'leri (`LoginSucceeded`, `AccountLocked`, `SuspiciousTokenReuse`...) MediatR `INotification` olarak yayınlanır. |

---

## Mevcut Durum

- Hangi sprint'te? → **Sprint 1–6** (teknik analiz Bölüm 22 sprint kırılımı). Foundation Sprint 1.
- MVP scope'unda mı? → **Evet** (login + switch çekirdeği). OTP/2FA Sprint 5–6.
- Hangi parçaları yapıldı / kaldı?
  - ✅ Master tablolar: `system_roles` (7), `permissions` (32), `role_permissions` (66) + deterministik seed
  - ✅ Mevcut `User` tabanlı login/refresh/invite/password-reset akışı (`Oksis.Application/Modules/Identity` ≈77 cs)
  - ⏳ **`Account` aggregate** (auth/session sahibi) — teknik analiz hedef modeli; mevcut `User` ile uzlaştırma kararı bekliyor (bkz. `open-questions.md` OQ-identity-001)
  - ⏳ Context resolution (`IContextResolver`), identifier resolver (`IIdentifierResolver` / `IPersonDirectory`)
  - ⏳ Switch (profile/child/season) + permission cache (Redis) + `perms_ver`
  - ⏳ Refresh rotation + reuse detection, access token blacklist
  - ⏳ ABAC (`ChildScopeRequirement`), `ActiveSeasonWritePolicy`
  - ⏳ Audit → Elasticsearch, SignalR forced logout, Hangfire cleanup/retention job'ları
  - ⏳ OTP / 2FA iskeleti (Sprint 5–6)

> Açık sorular ve verilmesi gereken teknik kararlar (TQ-auth-001…007) için bkz. `open-questions.md`.

---

## Metadata

- **Slug:** identity
- **Status:** in-progress
- **Sprint:** Sprint 1–6
- **Owner:** {{TBD}}
- **Created:** 2026-05-15
- **Last Updated:** 2026-06-05
- **Files:**
  - [x] README.md
  - [x] domain-model.md
  - [x] api-contracts.md
  - [x] database-schema.md
  - [x] permissions.md
  - [x] notifications.md
  - [x] ui-flows.md
  - [x] business-rules.md
  - [x] open-questions.md
  - [x] completion_status.md
