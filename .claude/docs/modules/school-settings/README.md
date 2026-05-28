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
| `SchoolAdmin` | Tüm ayarları görüntüler ve düzenler (7 sekme — bkz. aşağıda) |
| `SuperAdmin` | Public branding hariç müdahale etmez; okul kurulum sırasında ön-doldurma yapar |
| Diğer roller | Sadece public branding (`/api/v1/school-settings/public`) anonim erişim |
| **Diğer modüller** (en önemli tüketici) | `academic-sessions`, `timetable`, `attendance`, `marks`, `report-cards` — hepsi bu modüldeki ayarları okur |

---

## Sekme Yapısı (7 sekme)

> Spec'in ilk 4 sekmesi (Genel Bilgi / İletişim / Adres / Tema) tek **Genel** sekmesinde
> 4 `FormSection` olarak birleştirildi (UX kararı, 2026-05-27). Bölüm bazlı
> permission ve endpoint'ler değişmedi.

| # | Sekme | Path | Permission | Durum |
|---|---|---|---|---|
| 1 | Genel | `/admin/settings/general` | `update-basic`, `update-contact`, `update-address`, `update-theme`, `upload-logo` (her bölüm kendi mutation'ı) | ✅ Mevcut (4 spec sekmesinden birleştirildi) |
| 2 | Akademik Yapı | `/admin/settings/academic` | `update-academic-structure` ⭐ | 🔄 Güncellendi (sınıf kademesi multi-select) |
| 3 | Akademik Politikalar | `/admin/settings/academic-policy` | `update-academic-policy` ⭐ | 🆕 YENİ |
| 4 | Zil Programı | `/admin/settings/bell-schedule` | `manage-bell` | ✅ Mevcut |
| 5 | Tatiller | `/admin/settings/holidays` | `manage-holidays` | 🔄 Güncellendi (academic_session_id) |
| 6 | Bildirimler | `/admin/settings/notifications` | `manage-notifications` | ✅ Mevcut |
| 7 | Modüller | `/admin/settings/modules` | `manage-modules` | ✅ Mevcut |

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
- **Status:** `mvp-ready` ✅ (21 baseline + 5 yeni endpoint live; tüm Sprint 1 hedefleri tamamlandı, 2026-05-28 QA turu geçildi)

**Sprint 1 — Tamamlandı:**
- [x] `school_grade_levels` junction tablosu + migration + seed
- [x] `school_grade_level_scales` junction tablosu + migration
- [x] `school_settings` tablosuna 5 yeni kolon (grade_scale_id, passing_score, 3 parametrik)
- [x] `school_holidays` tablosuna `academic_session_id` nullable kolon
- [x] "Akademik Politikalar" sekmesi + `PUT /academic-policy` + permission
- [x] "Akademik Yapı" sekmesine sınıf kademesi multi-select + `GET/PUT /grade-levels`
- [x] 2 yeni permission seed: `update-academic-structure`, `update-academic-policy`
- [x] `UpdateAcademicStructure` endpoint permission'ını `update-academic-structure`'a taşıdı
- [x] Q6 multi `school_types` (JSON kolon) — tam stack
- [x] Q-Plan-Modules — `master.plan_modules` kataloğu + `IPlanModuleResolver`
- [x] Bildirim kanal toggle'ları (push/email/sms/late-arrival) DB'de kalıcı
- [x] `SeedDefaultModuleConfigsHandler` (yeni okul için modül seed) + DEV-OKUL backfill migration

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
- **Status:** `mvp-ready`
- **Sprint:** Sprint 1 (tamamlandı)
- **Owner:** Faruk Kaya
- **Last Updated:** 2026-05-28 — **mvp-ready** ✅ (10-maddelik QA tamamlandı; Q6 multi `school_types` + Q-Plan-Modules + bildirim kanal toggle'ları tam stack uygulandı; multi-tenant izolasyon ikinci tenant ile doğrulandı)