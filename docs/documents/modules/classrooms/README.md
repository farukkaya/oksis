# Sınıf / Şube (Classrooms)

> Bu modülün **tek kaynak gerçek** dokümantasyonu. Diğer dosyalar bu modülün alt başlıklarını detaylandırır.

---

## Amaç

Sınıf / Şube modülü, OKSİS'te ... işlevini sağlar.

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

- **Slug:** classrooms
- **Status:** in-progress (web dashboard teslim edildi — bkz. completion_status.md)
- **Sprint:** Sprint 1
- **Owner:** {{TBD}}
- **Created:** 2026-05-15
- **Last Updated:** 2026-06-28
- **Files:**
  - [x] README.md
  - [x] domain-model.md (iskelet)
  - [x] api-contracts.md (şube arşivleme + kalıcı silme ucu eklendi)
  - [x] database-schema.md
  - [x] permissions.md (class-rooms.archive + class-rooms.delete eklendi)
  - [x] notifications.md (iskelet)
  - [x] ui-flows.md (admin dashboard akışı + şube arşivleme + kalıcı silme)
  - [x] business-rules.md (şube arşivleme + kalıcı silme kuralları)
  - [x] open-questions.md (iskelet)
  - [x] completion_status.md
