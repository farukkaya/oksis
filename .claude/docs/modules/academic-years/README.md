# Akademik Sezon (AcademicSessions)

> Bu modülün **tek kaynak gerçek** dokümantasyonu. Diğer dosyalar bu modülün alt başlıklarını detaylandırır.

---

## ⚠️ Naming Notu (önemli)

Bu modülün aggregate root adı **`AcademicSession`**'dır (önceki taslakta `AcademicYear` geçmişti). Karar gerekçesi: kurs sezonu / yaz okulu gibi *yan akademik akışların* önünü açık tutmak. Şu an Sprint 1'de sadece **standart eğitim yılı** akışı çalışacak; "ek sezon" özelliği bilinçli olarak kapsam dışıdır ama isim ileride genişlemeye uygundur.

Etkilenenler:
- Modül slug: `academic-sessions` (eski: `academic-years`)
- Aggregate root: `AcademicSession`
- Tablo adı: `academic_sessions`
- Permission prefix: `academic-sessions.*`
- API path: `/api/v1/academic-sessions`

> **Aksiyon:** `naming-conventions.md` ve `_MODULE_GUIDE.md`'de `AcademicYear` → `AcademicSession` güncellemesi yapılmalı. Mevcut `.claude/docs/modules/academic-years/` klasörü `academic-sessions/` olarak yeniden adlandırılmalı.

---

## Amaç

Akademik Sezon modülü, OKSİS'te **tüm akademik veriye zaman boyutu kazandıran** çatıyı sağlar. Bir okulun eğitim yılını, dönemlerini, şubelerini ve şube-öğrenci atamalarını yıl-bazlı olarak izole eder; geçmiş yıl verilerini salt-okunur arşive alır.

**Sorduğu temel soru:** "Bu veri (yoklama, not, şube, atama) hangi yıla ve döneme ait?"

**Çözmediği şey:**
- Ders programı oluşturma → `timetable` modülü
- Karne PDF üretimi → `report-cards` modülü (sadece `TermClosedEvent` tetikleyicisini bu modül üretir)
- Yaz okulu / kurs sezonu → kapsam dışı, ileri sprint
- Tatil takvimi UI'ı → `school-settings` modülü altında render edilir (ama veri buradan beslenir)

---

## Paydaşlar / Roller

| Rol | Kullanım Şekli |
|---|---|
| `SchoolAdmin` (Müdür, Müdür Yrd.) | Sezon açar, dönem geçirir, şube oluşturur, öğrenci-şube atar, sezonu arşivler |
| `Teacher` | Aktif sezon/dönem bilgisini pasif tüketir; rehber öğretmen ise kendi şubesinin öğrenci listesini görür |
| `Parent` / `Student` | Sadece aktif sezon/dönem etiketini görür ("2025-2026, 1. Dönem") |
| Diğer modüller | `timetable`, `attendance`, `marks`, `homework`, `report-cards` — her biri `AcademicSessionId` + `AcademicTermId` taşır |

> Tam yetki matrisi için bkz. `permissions.md` (bu klasörde) ve proje kökündeki `permission-matrix.md`.

---

## Akış Özeti

Modülün üç ana senaryosu vardır:

1. **Senaryo 1 — Yeni Sezon Açma** (Eylül başı). En ağır akış; tüm yıl yapısı kurulur.
2. **Senaryo 2 — Dönem Geçişi** (Ocak/Şubat). Notlar kilitlenir, sayaçlar sıfırlanır, şubeler değişmez.
3. **Senaryo 3 — Yıl İçi Değişiklikler**. Anlık işlemler: öğrenci şube değiştirme, yeni şube ekleme, şube kapatma, yıl içi yeni kayıt.

**Sprint 1 kapsamı:** Sadece **basit liste + form** akışı. Sihirbaz değil. İlk pilot okul ilk yılında olacağı için "yıl geçişi" Sprint 4'e (Pilot Hazırlığı) bırakılmıştır.

> Detaylı UI akışları: `ui-flows.md`. Domain event akışı: `notifications.md`.

---

## İlişkili Modüller

| Modül | İlişki | Detay |
|---|---|---|
| `users` (Student) | Yazma | Yeni öğrenci → `ClassRoomStudent` insert |
| `users` (Teacher) | Okuma | Rehber öğretmen + şube-ders öğretmen ataması |
| `school-settings` | Okuma + Yazma | Tatil takvimi (`school_holidays`), zil programı, **yeni parametrik ayarlar** (bkz. `business-rules.md` BR-AS-007/008/009) |
| `subjects` (master) | Okuma | Şube-ders ataması müfredattan (`subject_grade_levels`) beslenir |
| `classrooms` | **Bu modüle taşındı** | `ClassRoom` aggregate'i artık bu modülün parçası (klasör adı için bkz. *Yapısal Karar* aşağıda) |
| `timetable` (Sprint 2) | Tüketici | `AcademicSessionId` + `AcademicTermId` taşır |
| `attendance` (Sprint 2) | Tüketici | Her yoklama `AcademicSessionId` + `AcademicTermId` + `ClassRoomId` taşır |
| `marks` / `report-cards` (Sprint 2-3) | Tüketici + Tetiklenen | `TermClosedEvent` → karne üretim job'ı (otomatik, manuel müdahale destekli — BR-AS-010) |
| `notifications` | Event yayıcı | `AcademicSessionActivated`, `TermClosed`, `StudentTransferred`, `StudentAssignedToClassRoom` |

### Yapısal Karar: Classroom Modülü Eritildi mi?

`classrooms` ayrı bir modül olarak duruyordu. Ama:
- `ClassRoom` yıl-scope'lu (her sezon kendi şubelerine sahip)
- `ClassRoomStudent` history-aware atama (sadece bu modül anlamlı)
- Şubesiz sezon, sezonsuz şube anlamsız

Bu yüzden `ClassRoom` aggregate'i ve `ClassRoomStudent` entity'si **bu modülün altında** tutulur. `.claude/docs/modules/classrooms/` klasörü:
- **Seçenek A** (önerilen): Klasör korunur ama içerik referans-only; tüm asıl dokümantasyon buraya taşınır.
- **Seçenek B**: Klasör tamamen silinir.

Karar kullanıcıya bırakılmıştır.

---

## Verilen Kararlar (önceki ihtiyaç analizinden)

| # | Soru | Karar |
|---|---|---|
| 1 | "Tam yıl şube" desteği? | ✅ `AcademicTermId` şubeden çıkarıldı. Şube sadece `AcademicSessionId` taşır. Dönem-bağlı olanlar: notlar, devamsızlık, karne. |
| 2 | Çoklu eğitim seviyesi tek okul? | ✅ Tek `AcademicSession` tüm seviyeleri kapsar (Anaokulu + İlkokul + Ortaokul + Lise). |
| 3 | Mezun veri saklama süresi? | ✅ Default 5 yıl, **parametrik** (`school-settings` → `GraduatedDataRetentionYears`). 6. yıla başlarken hard-delete onay akışı (ileri sprint, kapsam dışı). 5 yıldan fazla ücretli (faturalama, kapsam dışı). |
| 4 | Şube açılışına onay? | ✅ Parametrik (`school-settings` → `RequireApprovalForClassRoomCreation`, default `false`). Açıksa: müdür yrd. oluşturur, müdür onaylar. |
| 5 | Karne otomatik üretim? | ✅ Otomatik (`TermClosedEvent` → background job), **manuel müdahaleye açık** (regenerate, edit, force-publish). Detay: `report-cards` modülü, Sprint 3. |
| 6 | Ek sezon (yaz okulu, kurs) desteği? | ⏸ Şu an kapsam dışı. Ama isim `AcademicSession` seçildi → ileri sprint için önü açık. |

---

## Mevcut Durum

- **Sprint:** Sprint 1 — Foundation
- **MVP scope:** ✅ Evet (Sprint 1 zorunlu)
- **Status:** `planning` → bir sonraki adımda `in-progress`

**Yapılacaklar (Sprint 1):**
- [ ] `AcademicSession` + `AcademicTerm` + `ClassRoom` + `ClassRoomStudent` domain entity'leri
- [ ] EF Core configurations + migration (mevcut master tabloları bozmadan)
- [ ] CQRS handler'lar: Create/Update/Activate/Archive AcademicSession; Create/Update/Archive ClassRoom; Assign/Transfer Student
- [ ] "Aktif sezon/dönem" sorgulama endpoint'i (cache'li — Redis)
- [ ] `school-settings` modülüne 3 yeni parametre ekle (BR-AS-007, 008, 009)
- [ ] Frontend: liste + basit form (sihirbaz değil)

**Sonraya bırakıldı:**
- Yıl açma sihirbazı (5 adımlı, autosave'li) → Sprint 4
- Dönem geçişi sihirbazı + karne kilitleme → Sprint 3
- "Geçen yıldan üst sınıfa otomatik taşı" → Sprint 5+
- Excel'den şube/öğrenci toplu import → Sprint 4
- Şube birleştirme akışı → Sprint 5+
- Mezun veri hard-delete onay akışı → ileri sprint (5 yıl dolmadan gerek yok)

> Açık sorular için bkz. `open-questions.md`.

---

## Metadata

- **Slug:** `academic-sessions`
- **Status:** `planning`
- **Sprint:** Sprint 1
- **Owner:** {{TBD}}
- **Created:** 2026-05-15
- **Last Updated:** 2026-05-25
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
