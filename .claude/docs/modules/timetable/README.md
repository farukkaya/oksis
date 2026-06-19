# Ders Programı (Timetable)

> Bu modülün **tek kaynak gerçek** dokümantasyonu. Diğer dosyalar bu modülün alt başlıklarını detaylandırır.

---

## Amaç

Ders Programı modülü, OKSİS'te bir okulun haftalık ders çizelgesinin **kurulması, yayınlanması, görüntülenmesi ve sezon içi değişikliklerinin yönetilmesi** işlevini sağlar. Şube × ders × öğretmen × derslik × zaman matrisini tek bir versiyonlu kaynaktan yönetir; yoklama, ödev ve duyuru modülleri bu kaynağı referans alır.

**Sorduğu temel soru:** "Bir öğretmen / bir şube / bir öğrenci, hangi gün hangi saatte, hangi dersi, hangi derslikte yapacak?"
**Çözmediği şey:**
- Yoklama kaydı (`attendance` modülünde — sadece `ScheduleId` referansı verir)
- Etüt, sınav takvimi, veli toplantısı planlama (Faz 2; ayrı `events` modülü düşünülüyor)
- Servis ve yemekhane planı (yalnızca okul başlangıç/bitiş saatini referans verir)
- Müfredat içerik planı / yıllık plan (`curriculum` modülünde, Faz 2)

---

## Paydaşlar / Roller

| Rol | Kullanım Şekli |
|---|---|
| SchoolAdmin / Akademik Koordinatör | Sezon başında programı kurar, sezon ortasında günceller, yayınlar. Derslik ve istisnaları yönetir. |
| Teacher | Kendi haftalık programını ve günlük dersleri görüntüler; değişiklik / yerine geçme bildirimi alır. |
| Parent | Çocuğunun (veya çocuklarının) haftalık programını görüntüler; günlük ders ve değişiklik bildirimi alır. |
| Student | Kendi haftalık ve günlük programını görüntüler; değişiklik bildirimi alır. |
| Secretary | Veli toplantısı / etkinlik planlarken derslik müsaitlik sorgusu (read-only). |
| SuperAdmin | Doğrudan müdahale etmez; audit log incelemesi için read-only. |

> Tam yetki matrisi için bkz. `permissions.md` (bu klasörde) ve `permission-matrix.md` (proje kökü).

---

## Akış Özeti

Modülün ana akışı:

1. **Önkoşul tanımları:** Akademik yıl/dönem, şubeler, dersler, öğretmenler, derslikler, zil saatleri ve tatil günleri tamam olmadan program yayınlanamaz.
2. **Taslak hazırlama:** Akademik koordinatör matris ekranında sürükle-bırak ile şube × zaman dilimine ders + öğretmen + derslik atar. Sistem gerçek zamanlı çakışma uyarısı verir (HARD kurallar engeller, SOFT kurallar uyarır).
3. **Yayınlama:** SchoolAdmin onayı ile taslak Published statüsüne geçer; etkilenen tüm Teacher/Parent/Student'a yayın bildirimi gider (digest formatında).
4. **Sezon ortası değişiklik:** Yapısal değişiklikler yeni versiyon (Schedule) olarak yazılır, eski versiyona `EffectiveTo` set edilir; yoklama referansları korunur. Etkilenen kullanıcılara değişiklik bildirimi gider.
5. **Tek günlük istisna (override):** İptal, yerine geçme, derslik değişikliği, saat değişikliği — `ScheduleOverride` kaydı olarak tutulur, orijinal program değişmez; o günkü etkilenen kullanıcılara anlık push gider.
6. **Görüntüleme:** Web'de admin matrisi + şube/öğretmen/derslik bazlı; mobile'da öğretmen/veli/öğrenci için bugün + bu hafta ekranı.
7. **Yoklama entegrasyonu:** Öğretmen yoklamaya girdiğinde `ScheduleId` üzerinden hangi şube + ders + zaman olduğu otomatik bilinir.

> Detaylı UI akışları için bkz. `ui-flows.md`.
> Domain akışı (event flow) için bkz. `notifications.md`.

---

## İlişkili Modüller

| Modül | İlişki |
|---|---|
| `school-settings` | Zil saati (`bell_schedules`), tatil günleri (`school_holidays`), günlük ders sayısı bilgilerini okur. |
| `academic-years` | `AcademicYearId` + `AcademicTermId` zorunlu referans; aktif sezon dışı program kurulamaz. |
| `branches` | Şube listesi; her Schedule satırı bir `BranchId` referansı taşır. |
| `subjects` (courses) | Ders tanımı ve haftalık önerilen saat (`WeeklyHour`) bilgisi. |
| `teachers` | Öğretmen ve branş bilgisi; çakışma + soft warning (branş dışı atama) için. |
| `attendance` | Her yoklama kaydı `ScheduleId` taşır; Schedule fiziksel silinemez, sadece arşivlenir. |
| `marks` | "Bu dersin öğretmeni" sorgusu için Schedule üzerinden öğretmen çözünürlüğü. |
| `homework` | "Bu derse ait ödev" filtresi için. |
| `messaging` | "Bu dersin öğretmenine mesaj" kısayolu. |
| `notifications` | `SchedulePublished`, `ScheduleChanged`, `ScheduleOverrideCreated` event'leri. |
| `students` | Öğrencinin şubesi → şubenin programı zinciri. |
| `parents` | Velinin çocukları → her çocuğun şubesi → şubenin programı zinciri. |

---

## Mevcut Durum

- Hangi sprint'te? → **Sprint 2** (MVP — pilot okul için zorunlu modül)
- MVP scope'unda mı? → **Evet** (HARD çakışma kontrolü + manuel matris UI + mobile görüntüleme)
- Hangi parçaları yapıldı / kaldı?
  - ✅ Mevcut `Schedules` tablo iskeleti (Sprint 1) — `room_id`, versiyon alanları için **migration gerekecek**
  - ⏳ `rooms` tablosu (yeni — Sprint 2)
  - ⏳ `schedule_overrides` tablosu (yeni — Sprint 3)
  - ⏳ Schedule CRUD + çakışma kontrolü endpoint'leri
  - ⏳ Şube / öğretmen / derslik bazlı haftalık görünüm endpoint'leri
  - ⏳ Excel import (Sprint 4'ten Sprint 2'ye çekilmesi önerildi)
  - ⏳ Web matris UI (sürükle-bırak)
  - ⏳ Mobile bugün + hafta ekranları (3 portal)
  - ❗ Müfredat kotası (`curriculum_plans`) → Faz 2 (open question'da kalıyor)
  - ✅ Otomatik solver (Faz 3 Dilim-1, tek-sınıf) — `IScheduleSolver` + 3 puanlı aday + üret≠uygula; **sınıf-bazlı sıfırdan + Hub header tetik + yeni Taslak** (2026-06-16, K5/K6)
  - ✅ Çok-taslak program modeli — tek canlı (Yayında/Revize) + çok Taslak; publish-swap; rezervasyon yalnız canlı (2026-06-16, K1/K8/K9/K10/K11)
  - ✅ Otomatik solver Dilim-2 (kademe/tümü çok-sınıf) — joint solver + seçmeli/toplu apply + idempotency (2026-06-17, K-D2-1…6)

> Açık sorular için bkz. `open-questions.md`.

---

## Metadata

- **Slug:** timetable
- **Status:** in-progress
- **Sprint:** Sprint 2
- **Owner:** {{TBD}}
- **Created:** 2026-05-15
- **Last Updated:** 2026-06-20
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
