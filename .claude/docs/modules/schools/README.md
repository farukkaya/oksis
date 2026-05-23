# Okul / Tenant Yönetimi (Schools)

> Bu modülün **tek kaynak gerçek** dokümantasyonu. Diğer dosyalar bu modülün alt başlıklarını detaylandırır.

---

## Amaç

Okul / Tenant Yönetimi modülü, OKSİS'te ... işlevini sağlar.

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
  - ✅ `School` aggregate (Setup→Active↔Suspended→Archived yaşam döngüsü)
  - ✅ `OnboardingStatus` tenant entity + 2 enum (Step, StepStatus)
  - ✅ `SchoolCreatedOnboardingStatusHandler` — yeni okul oluşumunda 6 adım otomatik insert
  - ✅ Layer 2 tenant init: `SchoolSettings` + `school_module_configs` + `school_onboarding_status` üçü `SchoolCreatedEvent` üzerinden tetiklenir
  - ⏳ Okul kurulum sihirbazı UI (Adım 1-6)
  - ⏳ Dashboard "Kurulumunu Tamamla" widget

> Açık sorular için bkz. `open-questions.md`.

---

## Metadata

- **Slug:** schools
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
  - [x] permissions.md (iskelet)
  - [x] notifications.md (iskelet)
  - [x] ui-flows.md (iskelet)
  - [x] business-rules.md (iskelet)
  - [x] open-questions.md (iskelet)
