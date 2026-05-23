# Kimlik Doğrulama (Identity)

> Bu modülün **tek kaynak gerçek** dokümantasyonu. Diğer dosyalar bu modülün alt başlıklarını detaylandırır.

---

## Amaç

Kimlik Doğrulama modülü, OKSİS'te ... işlevini sağlar.

**Sorduğu temel soru:** {{TBD}}
**Çözmediği şey:** {{TBD}} (kapsam dışı, başka modülde)

---

## Paydaşlar / Roller

Bu modülü hangi rol(ler) kullanır?

| Rol | Kullanım Şekli |
|---|---|
| {{TBD}} | {{TBD}} |

> Tam yetki matrisi için bkz. `permissions.md` (bu klasörde) ve `permission-matrix.md` (proje kökü).

---

## Akış Özeti

Modülün ana akışı:

1. {{TBD}}
2. {{TBD}}
3. {{TBD}}

> Detaylı UI akışları için bkz. `ui-flows.md`.
> Domain akışı (event flow) için bkz. `notifications.md`.

---

## İlişkili Modüller

Bu modül hangi modüllerle konuşur?

| Modül | İlişki |
|---|---|
| {{TBD}} | {{TBD}} |

> Örnek: `attendance` modülü `students` ve `classrooms` modüllerini okur, `notifications`'a domain event gönderir.

---

## Mevcut Durum

- Hangi sprint'te? → **Sprint 1**
- MVP scope'unda mı? → **Evet**
- Hangi parçaları yapıldı / kaldı?
  - ✅ Master tablolar: `system_roles` (7), `permissions` (32), `role_permissions` (66)
  - ✅ Deterministik MD5 GUID seed üreteci (`SeedGuid` + `MasterSeedIds`)
  - ✅ Default rol-yetki matrisi seed edildi
  - ⏳ `User` / `UserRole` / `RefreshToken` tenant entity'leri
  - ⏳ JWT issuer + refresh rotation handler'ları
  - ⏳ Login/Logout/Refresh/Invite/PasswordReset endpoint'leri
  - ⏳ Frontend login + protected route + permission gate

> Açık sorular için bkz. `open-questions.md`.

---

## Metadata

- **Slug:** identity
- **Status:** in-progress
- **Sprint:** Sprint 1
- **Owner:** {{TBD}}
- **Created:** 2026-05-15
- **Last Updated:** 2026-05-24
- **Files:**
  - [x] README.md
  - [x] domain-model.md
  - [x] api-contracts.md (iskelet)
  - [x] database-schema.md
  - [x] permissions.md
  - [x] notifications.md (iskelet)
  - [x] ui-flows.md (iskelet)
  - [x] business-rules.md (iskelet)
  - [x] open-questions.md (iskelet)
