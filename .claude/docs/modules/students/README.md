# Öğrenci (Students)

> Bu modülün **tek kaynak gerçek** dokümantasyonu. Diğer dosyalar bu modülün alt başlıklarını detaylandırır.

---

## Amaç

Öğrenci modülü, OKSİS'te ... işlevini sağlar.

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

- Hangi sprint'te? → {{TBD}}
- MVP scope'unda mı? → {{TBD}}
- Hangi parçaları yapıldı / kaldı? → {{TBD}}

> Açık sorular için bkz. `open-questions.md`.

---

## Metadata

- **Slug:** students
- **Status:** planning
- **Sprint:** Sprint 1
- **Owner:** {{TBD}}
- **Created:** 2026-05-15
- **Last Updated:** 2026-07-01 (Faz 3B: yenileme + rollover köprüsü — RenewEnrollment/EnrollmentRenewedEvent canlı; BR-students-004 eklendi)
- **Files:**
  - [x] README.md
  - [x] enrollment-needs-analysis.md (kayıt ihtiyaç + altyapı uygunluk analizi, 2026-06-28)
  - [x] domain-model.md (Faz 3B: Intent/RenewalIntent naming notu + güncel davranışlar + EnrollmentRenewedEvent ile dolduruldu)
  - [x] api-contracts.md (Faz 1A+1B+2A+2B+3A+3B dolu)
  - [x] database-schema.md (iskelet)
  - [x] permissions.md (iskelet)
  - [x] notifications.md (iskelet)
  - [x] ui-flows.md (Faz 1B sihirbaz akışı dolu)
  - [x] business-rules.md (BR-001..004 dolu)
  - [x] open-questions.md (iskelet)
  - [x] completion_status.md
