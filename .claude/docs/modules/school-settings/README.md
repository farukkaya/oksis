# Okul Ayarları (School Settings)

> Bu modülün **tek kaynak gerçek** dokümantasyonu. Diğer dosyalar bu modülün alt başlıklarını detaylandırır.

---

## Amaç

Okul Ayarları modülü, bir tenant'ın (okulun) tüm yapılandırma alanlarını tek noktadan yönetir:

- **Kurumsal kimlik:** resmi ad, MEB kodu, vergi bilgileri, iletişim, adres
- **Görsel tema:** logo, renkler, favicon (public branding dahil)
- **Akademik yapı:** sınıf kademeleri, ders günleri, günlük ders sayısı, zil/ders saati programı
- **Akademik politikalar:** not skalası, geçme notu, devamsızlık eşikleri, karne yayın politikası, şube onay akışı, veri saklama süresi ⭐ YENİ
- **Tatil takvimi:** okul-spesifik tatiller (sezon-scope'lu) + resmi tatiller (global, salt-okunur)
- **Modül yönetimi:** feature toggle (attendance, marks, announcements, homework, messaging, reports)
- **Bildirim tercihleri:** kanal/cooldown/quiet-hours override

**Sorduğu temel soru:** "Bu okulun yapılandırması hangi değerlerle çalışmalı?"

**Çözmediği şey:**
- Tenant yaşam döngüsü (Setup → Active → Suspended → Archived) → `schools` modülü
- Kullanıcı/rol/izin yönetimi → `identity` modülü
- Sezon/dönem yönetimi → `academic-sessions` modülü (tatil verisi artık orada, UI burada render edilir)

---

## ⚠️ Güncellenme Notu (2026-05-25)

Bu modül önceki sürümünden şu farkları içerir:

1. **Akademik Politikalar sekmesi (9. sekme) eklendi** — not skalası, geçme notu, devamsızlık eşikleri, parametrik iş akışı ayarları
2. **Sınıf kademesi konfigürasyonu eklendi** — `school_grade_levels` junction tablosu, Akademik Yapı sekmesinde multi-select
3. **Seviye bazlı not skalası desteklendi** — `school_grade_level_scales` junction tablosu (ilkokul 5'lik, lise 100'lük)
4. **`school_type` çoklu seçim desteklendi** — tekil enum'dan `school_education_levels` junction'a geçiş
5. **`school_holidays.academic_session_id` eklendi** — nullable geçiş dönemi, Sprint 4+'ta zorunlu
6. **2 yeni permission eklendi** — `school-settings.update-academic-structure` (ayrıldı), `school-settings.update-academic-policy`
7. **`academic-sessions` modülünden gelen 3 parametrik kolon** — BR-AS-007/008/009

---

## Paydaşlar / Roller

| Rol | Kullanım Şekli |
|---|---|
| `SchoolAdmin` | Tüm ayarları görüntüler ve düzenler (10 sekme) |
| `SuperAdmin` | Public branding hariç müdahale etmez; okul kurulum sırasında ön-doldurma yapar |
| Diğer roller | Sadece public branding (`/api/v1/school-settings/public`) anonim erişim |
| **Diğer modüller** (en önemli tüketici) | `academic-sessions`, `timetable`, `attendance`, `marks`, `report-cards` — hepsi bu modüldeki ayarları okur |

---

## Sekme Yapısı (10 sekme)

| # | Sekme | Permission | Durum |
|---|---|---|---|
| 1 | Genel Bilgi | `update-basic` | ✅ Mevcut |
| 2 | İletişim | `update-contact` | ✅ Mevcut |
| 3 | Adres | `update-address` | ✅ Mevcut |
| 4 | Tema | `update-theme` + `upload-logo` | ✅ Mevcut |
| 5 | Akademik Yapı | `update-academic-structure` ⭐ | 🔄 Güncellendi (sınıf kademesi, eğitim seviyesi multi-select) |
| 6 | Akademik Politikalar | `update-academic-policy` ⭐ | 🆕 YENİ |
| 7 | Zil Programı | `manage-bell` | ✅ Mevcut |
| 8 | Tatiller | `manage-holidays` | 🔄 Güncellendi (academic_session_id) |
| 9 | Modüller | `manage-modules` | ✅ Mevcut |
| 10 | Bildirimler | `manage-notifications` | ✅ Mevcut |

---

## İlişkili Modüller

| Modül | İlişki | Detay |
|---|---|---|
| `schools` | 1:1 | `SchoolCreatedEvent` → varsayılan `school_settings` insert |
| `identity` | Permission seed | 12 permission SCHOOL_ADMIN rolüne seed |
| `academic-sessions` | Veri kaynağı + tatil sahipliği | Tatil verisi `academic-sessions` domain'inde, UI burada. Sınıf kademesi + not skalası şube oluşturma/not girişi için |
| `timetable` (Sprint 2) | Okuyucu | `weekly_lesson_days`, `daily_lesson_count`, `school_bell_schedules`, `school_grade_levels` |
| `attendance` (Sprint 2) | Okuyucu | Devamsızlık eşikleri, geç gelme dönüşüm kuralı |
| `marks` (Sprint 2-3) | Okuyucu | `grade_scale_id`, `passing_score`, `school_exam_type_overrides`, `school_grade_level_scales` |
| `report-cards` (Sprint 3) | Okuyucu | `auto_publish_report_cards`, karne template, dil |
| `notifications` | Override | `school_notification_configs` global kataloğu override |
| `subjects` | Okuyucu | Günlük ders sayısı, ders günleri |

---

## Verilen Kararlar (2026-05-25 İhtiyaç Analizi)

| # | Soru | Karar |
|---|---|---|
| 1 | Seviye bazlı farklı not skalası? | ✅ Desteklensin → `school_grade_level_scales` junction (ilkokul 5'lik, lise 100'lük) |
| 2 | `school_type` birden fazla seçilebilir mi? | ✅ Birden fazla seçilebilir → ama asıl kapsam `school_grade_levels` junction'dan gelsin, `school_type` informational |
| 3 | Akademik Yapı + Politikalar ayrı mı birleşik mi? | ✅ 2 ayrı sekme. Yapı = okulu tanımlar (değişmez), Politika = kuralları belirler (ayarlanabilir) |
| 4 | `school_holidays.academic_session_id` nullable mı? | ✅ Migration geçişi: nullable. Sprint 4+'ta zorunlu |
| 5 | Akademik Yapı için ayrı permission? | ✅ `school-settings.update-academic-structure` ayrı slug (eski: `update-basic` ile paylaşıyordu) |

---

## Mevcut Durum

- **Sprint:** Sprint 1
- **Status:** `in-progress` (mevcut 21 endpoint live; genişletme devam ediyor)

**Sprint 1 — Yapılacaklar (genişletme):**
- [ ] `school_grade_levels` junction tablosu + migration + seed
- [ ] `school_grade_level_scales` junction tablosu + migration
- [ ] `school_settings` tablosuna 5 yeni kolon (grade_scale_id, passing_score, 3 parametrik)
- [ ] `school_holidays` tablosuna `academic_session_id` nullable kolon
- [ ] "Akademik Politikalar" sekmesi (9→6. sıra) + `PUT /academic-policy` + permission
- [ ] "Akademik Yapı" sekmesine sınıf kademesi multi-select + `GET/PUT /grade-levels`
- [ ] 2 yeni permission seed: `update-academic-structure`, `update-academic-policy`
- [ ] `UpdateAcademicStructure` endpoint permission'ını `update-basic`'ten `update-academic-structure`'a taşı

**Sprint 2'ye bırakılan:**
- Devamsızlık eşik ayarları (attendance modülü ile)
- Sınav ağırlığı override (`school_exam_type_overrides`)
- Bildirim frekansı enum'u
- Geç gelme → devamsızlık dönüşüm kuralı

**Sprint 3'e bırakılan:**
- Karne template seçimi + dil + davranış notu ayarı
- PDF antetli kağıt ayarı

---

## Metadata

- **Slug:** `school-settings`
- **Status:** `in-progress`
- **Sprint:** Sprint 1
- **Owner:** Faruk Kaya
- **Last Updated:** 2026-05-28