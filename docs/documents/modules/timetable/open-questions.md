# Ders Programı — Açık Sorular

> Henüz cevaplanmamış, takım kararı bekleyen veya araştırılması gereken konular. Karar verilince **diğer ilgili dosyaya taşınır** ve buradan silinir.

---

## OQ-timetable-001: Müfredat kotası (`CurriculumPlans`) MVP'de mi, Faz 2'de mi?

**Soru:** "9. sınıfta haftada 6 matematik" gibi şube × ders × dönem kotası tablosunu (`curriculum_plans`) Sprint 2 MVP'sine dahil edelim mi, yoksa Faz 2'ye atayalım mı?

**Bağlam:** İhtiyaç analizinde önerildi (BR-TT-007 olarak da yazıldı). Şu an karar olarak "tablo Faz 2, kural pasif" alındı (business-rules.md). Ama pilot okullar "matematik 6 saat atadık mı?" sorusunu **sezon başında** soracak. Tablo olmadan UI'da gösterilemez.

**Seçenekler:**
- **A)** Faz 2 (mevcut karar)
  - Artısı: MVP scope sıkı kalır, Sprint 2 zamanında yetişir
  - Eksisi: Pilot okul sezon başında "kotamı tutturdum mu" sorusunu Excel'de takip etmek zorunda kalır
- **B)** MVP'ye dahil et (basit haliyle — sadece tablo + Publish öncesi uyarı listesi)
  - Artısı: Pilot deneyimi tam olur, soft warning entegre çalışır
  - Eksisi: +1-2 hafta efor (tablo + UI + seed mantığı + import)
- **C)** Hibrit — tablo MVP'de, UI Faz 2'de (sadece backend uyarı)
  - Artısı: Veri yapısı hazır, kullanıcı görmüyor ama backend log'lar
  - Eksisi: Yarım iş hissi

**Bağımlılıklar:** `subjects` modülünün `Course.WeeklyHour` alanı zaten var; kotanın bununla ilişkisi netleşmeli (tek doğru kaynak hangisi?).

**Etkilenecek dosyalar (karar verilince güncellenecek):**
- `database-schema.md` — `curriculum_plans` tablosu eklenir/eklenmez
- `api-contracts.md` — `/curriculum/plans` endpoint'leri (B/C seçeneğinde)
- `business-rules.md` — BR-TT-007 aktif/pasif notu
- `permissions.md` — `timetable.manage-curriculum` izni (B seçeneği)
- README.md — sprint listesi

**Sorulacak kişi(ler):** Akademik koordinatör (pilot okul), Product Owner

**Hedef karar tarihi:** Sprint 2 planning toplantısı

---

## OQ-timetable-002: Öğretmen müsaitlik tercihleri MVP'de mi?

**Soru:** "Ahmet Hoca pazartesi gelmiyor", "Ayşe Hoca sabah ilk ders istemiyor" gibi öğretmen tercihlerini sistemde model lemeli miyiz?

**Bağlam:** Saha gerçeği — koordinatörler bu bilgiyi Excel'de tutuyor, sürükle-bırak yaparken kafalarında uyguluyorlar. Sistem bilirse:
- Sürükleme anında uyarı ("Bu slot öğretmenin tercih dışı")
- Otomatik öneri motoru (Faz 2 solver) için input

**Seçenekler:**
- **A)** MVP'de yok — koordinatör Excel mantığını OKSİS matriste de manuel uygular
  - Artısı: Sprint 2 hızlı, karmaşıklık az
  - Eksisi: "Sistem benim için neden hatırlamıyor?" memnuniyetsizliği
- **B)** MVP'ye basit hâli — `TeacherAvailability(teacherId, dayOfWeek, startTime, endTime, type=Preferred|Unavailable)`
  - Artısı: Soft warning ile entegre, koordinatör değer görür
  - Eksisi: +3-4 gün efor; UI ekran lazım

**Bağımlılıklar:** Yok (öğretmen modülü mevcut).

**Etkilenecek dosyalar:**
- `domain-model.md` — `TeacherAvailability` value object/entity
- `database-schema.md` — `teacher_availabilities` tablosu
- `api-contracts.md` — `/teachers/{id}/availability` endpoint'leri
- `ui-flows.md` — öğretmen profil sayfasında tercih girişi

**Sorulacak kişi(ler):** Pilot okul koordinatörleri (saha araştırması)

**Hedef karar tarihi:** Sprint 2 planning

---

## OQ-timetable-003: Çift kuşak (sabahçı / öğlenci) okul desteği gerekecek mi?

**Soru:** Pilot okullarımız tek kuşak mı çift kuşak mı? Çift kuşak (örn. sabah 1-4. sınıf, öğlen 5-8. sınıf) bir okulda Schedule modelimiz yeter mi?

**Bağlam:** Bazı Anadolu şehir okulları çift kuşak çalışır (kapasite zorlaması). Bizim mevcut model `dayOfWeek + startTime + endTime` ile çoklu kuşağı destekler, ancak zil saatleri `school-settings.bell-schedules` tek küme olarak tutuluyor — çift kuşak için **iki ayrı zil seti** lazım. Bu Schedule'ı değil, school-settings'i etkiler.

**Seçenekler:**
- **A)** Pilot okullar tek kuşak — MVP olduğu gibi
  - Artısı: Mevcut model değişmez
  - Eksisi: Çift kuşağa giriş yapamayız (pazara giriş engeli)
- **B)** Çift kuşak için `school-settings.bell-schedules`'a `shift (Morning|Afternoon)` alanı + Schedule'a `shift` alanı
  - Artısı: Pazara açıklık
  - Eksisi: school-settings + bu modül + UI + import hepsi etkilenir; Sprint 2'de kapsam dışı

**Bağımlılıklar:** Pilot okul kararı.

**Etkilenecek dosyalar:**
- `school-settings/*` — bell schedule shift modeli
- `database-schema.md` (timetable) — `schedules.shift` kolonu
- `ui-flows.md` — matris kuşak filtresi

**Sorulacak kişi(ler):** Satış/Pilot lead

**Hedef karar tarihi:** Sprint 2 başlamadan netleşmeli (model etkilenirse migration pahalı)

---

## OQ-timetable-004: Seçmeli/karma sınıflar nasıl modellenir?

**Soru:** 9-A şubesinin yarısı seçmeli müzik, yarısı seçmeli görsel sanatlar alırsa — bunu Schedule'da nasıl temsil ediyoruz? Mevcut BR-TT-002 (şube çakışması) bunu engeller.

**Bağlam:** Lise (9-12) ve bazı ortaokullarda seçmeli ders normal kalıp. MVP'de "tek şube = tek ders" varsayımı var. Seçmelide:
- Şube parçalanır → "9-A-Müzik grubu" + "9-A-Sanat grubu"
- Veya: Schedule'a `studentGroupId` (opsiyonel) eklenir

**Seçenekler:**
- **A)** MVP'de yok — seçmeli dersler manuel "geçici şube" olarak tanımlanır (saha hack)
  - Artısı: Model basit
  - Eksisi: Veri tutarsızlığı, yoklama karışır
- **B)** `student_groups` tablosu + `schedules.student_group_id` (nullable, branch_id ile birlikte)
  - Artısı: Doğru modelleme
  - Eksisi: Şube + grup ikili sorgu karmaşıklığı; UI'da seçici eklenir

**Bağımlılıklar:** Lise modülünün gelmesi (`students/grades/subjects`).

**Etkilenecek dosyalar:**
- `domain-model.md` — `StudentGroup` aggregate
- `database-schema.md` — `student_groups` tablosu + `schedules.student_group_id`
- `api-contracts.md` — yeni endpoint'ler
- `business-rules.md` — BR-TT-002 revize (şube + grup birlikte çakışma kontrolü)

**Sorulacak kişi(ler):** Pilot okul (lise var mı?), eğitim danışmanı

**Hedef karar tarihi:** Lise modülü planlanmadan netleşmeli (Faz 2 muhtemelen)

---

## OQ-timetable-005: Blok ders (lab, edebiyat metin) modellemesi yeterli mi?

**Soru:** Mevcut `isBlockLesson` flag + `blockGroupId` modeli yeterli mi, yoksa `BlockLesson` ayrı aggregate root olmalı mı?

**Bağlam:** Lise fizik laboratuvarı 2 saat ardışık, edebiyat metin incelemesi 2 saat ardışık olur. Mevcut model:
- 2 ayrı Schedule satırı, aynı `blockGroupId`
- `isBlockLesson = true`
- UI matrisde tek "büyük kart" olarak göster

Alternatif:
- `BlockLesson` aggregate (`Id, ScheduleIds[]`) — 1:N ilişki
- Daha açık ama complexity artar

**Seçenekler:**
- **A)** Mevcut model (group_id flag) — basit, yeterli
- **B)** Ayrı aggregate — daha açık, ama Schedule N:1 BlockLesson'a referans verir; çakışma kontrolü gruba göre değişir

**Bağımlılıklar:** Yok.

**Etkilenecek dosyalar:**
- `domain-model.md`
- `database-schema.md`
- `api-contracts.md` — blok oluşturma endpoint'i

**Sorulacak kişi(ler):** Backend lead

**Hedef karar tarihi:** Sprint 2 implementasyon başlangıcında

---

## OQ-timetable-006: Birleştirilmiş ders (köy okulu mantığı) desteklenecek mi?

**Soru:** Bazı küçük özel okullarda 2 farklı şube aynı dersi aynı öğretmenle aynı derslikte alabilir (örn. 3. ve 4. sınıf birlikte müzik). Bu MVP'de gerekecek mi?

**Bağlam:** Özel okul pazarında nadir ama anaokulu + ilkokul birleşik etkinliklerinde yaygın. BR-TT-002 + BR-TT-003 mevcut hâliyle engeller (şube ve derslik çakışması).

**Seçenekler:**
- **A)** MVP'de yok, pazara giriş bu segmentten değil
- **B)** `CombinedScheduleGroup` modeli (birden fazla branch_id paylaşan tek "etkinlik")
- **C)** Mevcut çakışma kurallarını "aynı `combined_group_id` varsa atla" şeklinde gevşet

**Bağımlılıklar:** Anaokulu modülü.

**Sorulacak kişi(ler):** Pilot okul (anaokulu+ilkokul var mı?), ürün

**Hedef karar tarihi:** Anaokulu modülü planlamasıyla birlikte (muhtemelen Faz 2)

---

## OQ-timetable-007: Anaokulu programı aynı modülde mi yönetilir yoksa ayrı bir "etkinlik takvimi" modülü mü?

**Soru:** Anaokulu programı "ders" değil "etkinlik" temellidir (serbest oyun, müzik etkinliği, drama, açık hava). Ders saatleri yoktur (sabah 09:00-12:00 blok). Bunu mevcut `Schedule` modelinde tutmak doğru mu yoksa ayrı bir `events` modülü mü?

**Bağlam:** Anaokulu kullanıcılarımız (henüz pilot kapsamında değil) bu modeli "yapay" bulacak. Schedule modeli ders/öğretmen/derslik temelli; etkinlik modeli aktivite/kazanım/materyal temelli.

**Seçenekler:**
- **A)** Aynı modülde tut, `Course`'u "etkinlik" gibi de davrandırabilecek esneklik ekle (örn. `course_type = Lesson|Activity`)
  - Artısı: Tek model, tek UI
  - Eksisi: Anaokulu UX'i tatmin etmez
- **B)** Ayrı `activity_schedules` modülü, anaokulu portalında bu modül kullanılır
  - Artısı: Doğru ayrım
  - Eksisi: İki paralel modül bakımı
- **C)** Faz 2'ye ertele — şu an pilot K-12 lise/ortaokul; anaokulu sonra

**Sorulacak kişi(ler):** Anaokulu pedagojik danışmanı (eğer/öyle bir paydaş varsa), ürün

**Hedef karar tarihi:** Anaokulu pilotu planlanmadan önce

---

## Karar Verilenler (Arşiv)

> Soruya cevap geldi, henüz ilgili dosyaya taşınmadı (bir sonraki güncellemede taşınacak).

### OQ-timetable-100 [RESOLVED 2026-05-26]

**Soru:** Versiyonlama modeli — tek satır + audit log mu, EffectiveFrom/To'lu temporal model mi?

**Karar:** **Temporal model** (EffectiveFrom + EffectiveTo + PreviousVersionId + Version). Yoklama referans bütünlüğü için Schedule satırı silinmez veya yeniden yazılmaz, **supersede** edilir.

**Taşındığı dosyalar:**
- ✅ `domain-model.md` — Schedule entity properties + Supersede method
- ✅ `database-schema.md` — schedules tablosunda effective_from/to/version/previous_version_id
- ✅ `business-rules.md` — BR-TT-008, BR-TT-009

---

### OQ-timetable-101 [RESOLVED 2026-05-26]

**Soru:** Derslik (Rooms) modeli MVP'ye girecek mi?

**Karar:** **Evet, MVP'ye girer.** `Schedules.ClassroomName` string olarak deprecated; `RoomId` (nullable FK) eklenir. Migration ile mevcut string'ler manuel eşleştirilir. Derslik çakışma kontrolü (BR-TT-003) aktif.

**Taşındığı dosyalar:**
- ✅ `domain-model.md` — Room aggregate root
- ✅ `database-schema.md` — rooms tablosu + schedules.room_id
- ✅ `api-contracts.md` — Room CRUD endpoint'leri (#16-20)
- ✅ `permissions.md` — `timetable.view-rooms`, `timetable.manage-rooms`
- ✅ `business-rules.md` — BR-TT-003

---

### OQ-timetable-102 [RESOLVED 2026-05-26]

**Soru:** Müfredat kotası zorunlu mu? Şube'ye 5 matematik atanmışken yayınlamaya izin verecek miyiz?

**Karar:** **Soft warning + force-publish hakkı.** SchoolAdmin uyarıyı görür, "yine de yayınla" diyebilir. (Kotanın MVP'de tablo olarak gelip gelmeyeceği ise hâlâ OQ-timetable-001'de açık.)

**Taşındığı dosyalar:**
- ✅ `business-rules.md` — BR-TT-007 SOFT olarak işaretli
- ✅ `api-contracts.md` — `POST /publish` response'unda warnings[]
- ✅ `ui-flows.md` — Yayın modal'ında uyarı listesi + "yine de" butonu

> Bir sonraki güncellemede yukarıdaki RESOLVED kayıtlar tamamen kaldırılacak.
