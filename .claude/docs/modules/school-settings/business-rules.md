# Okul Ayarları — Business Rules (Güncellenmiş)

> Modüle özel iş kuralları.

---

## Mevcut Kurallar (değişmez)

### BR-SS-001 — Tenant başına tek SchoolSettings
Bir okul için tam olarak bir `school_settings` satırı. `SchoolCreatedEvent` → idempotent insert.

### BR-SS-002 — Adres lookup FK opsiyonel
Adres FK'leri nullable; okul kurulum sihirbazının ilk adımında boş kalabilir.

### BR-SS-003 — Logo dosyası 2 MB üst sınır
`UploadLogo` endpoint'i `[RequestSizeLimit(2_097_152)]`.

### BR-SS-004 — Modül kataloğu seed önceliği
6 modül satırı seed. PlanRestricted modüller SchoolAdmin tarafından açılamaz.

### BR-SS-005 — Bell schedule sıralama tutarlılığı
`BulkCreateBellSchedules` sıra çakışmasına izin vermez.

### BR-SS-006 — PATCH module endpoint yalnızca toggle
Body yalnızca `{ isEnabled: bool }` kabul eder.

### BR-SS-007 — Tatil günü ile resmi tatil ayrımı
`school_holidays` (tenant) vs `official_holidays` (global). Admin sadece tenant tatillerini düzenler.

### BR-SS-008 — Tema renkleri hex doğrulama
`#RRGGBB` formatı. PrimaryColor zorunlu, SecondaryColor opsiyonel.

### BR-SS-009 — Public branding endpoint scope'u
Anonim erişimde sadece okul adı + tema renkleri + logo URL döner. Hassas veri dönmez.

---

## Yeni Kurallar (2026-05-25 İhtiyaç Analizi)

### BR-SS-010 ⭐ — Sınıf kademesi konfigürasyonu zorunlu

**Kural:** Her okul en az bir sınıf kademesini aktif etmelidir (`school_grade_levels` tablosunda en az 1 satır `is_active = true`).

**Sebep:** `academic-sessions` modülü şube oluştururken sınıf kademesi dropdown'ını bu tablodan filtreler. Boş olursa şube oluşturulamaz.

**Uygulama:**
- Backend: `UpdateSchoolGradeLevelsCommand` handler, aktif kademe sayısı 0'a düşmeyi engeller (`AtLeastOneGradeLevelRequiredException`).
- Frontend: Son checkbox unchecked yapıldığında disabled + tooltip "En az bir sınıf kademesi aktif olmalı".
- Seed: Okul oluşturulduğunda `school_type`'a göre otomatik seed.

**Test:** `SchoolGradeLevelTests.CannotDeactivateLastGradeLevel`

---

### BR-SS-011 ⭐ — Seviye bazlı not skalası fallback zinciri

**Kural:** Not girişinde skalanın belirleme sırası:
1. `school_grade_level_scales` tablosunda öğrencinin sınıf seviyesi için özel skala varsa → onu kullan
2. Yoksa → `school_settings.default_grade_scale_id` + `default_passing_score`
3. O da null ise → master `grade_scales` TR_100 (hardcoded fallback)

**Sebep:** İlkokul 5'lik, lise 100'lük kullanır. Ama her okul bunu konfigüre etmeyebilir — default mantıklı olmalı.

**Uygulama:**
- Backend: `IGradeScaleResolver.ResolveAsync(schoolId, gradeLevelId)` → fallback chain
- Cache: Redis, tenant + grade_level bazlı key. TTL: 24 saat. Invalidation: `SchoolSettingsUpdatedEvent("AcademicPolicy")`, `SchoolGradeLevelScaleChangedEvent`

**Test:** `GradeScaleResolverTests.FallbackChain_Level_Then_Default_Then_Master`

---

### BR-SS-012 ⭐ — Geçme notu sınırları

**Kural:** `passing_score` (hem default hem seviye bazlı) skala aralığında olmalıdır:
- TR_100 → 0-100 arası (genelde 45-60)
- TR_5 → 1-5 arası (genelde 2-3)
- HARFLI → seçenek listesinden (A/B/C/D/F → karşılığı sayısal olmadığı için özel validasyon)

**Sebep:** "100'lük sistemde geçme notu 200" gibi mantıksız giriş engellenmeli.

**Uygulama:**
- Backend: `UpdateAcademicPolicyCommand` handler, `grade_scales.min_value` / `max_value` aralığını kontrol eder.
- Frontend: Skala değiştiğinde geçme notu input'unun min/max'ı dinamik güncellenir.

---

### BR-SS-013 ⭐ — Tatil takviminde sezon bağlantısı

**Kural:** Yeni oluşturulan `school_holidays` kaydı aktif sezon varsa otomatik `academic_session_id` alır. Aktif sezon yoksa `null` kalır.

**Sebep:** Geçiş dönemi. Eski tatil kayıtları sezonsuz yaşayabilir. Sprint 4+'ta tüm kayıtlar sezon-scope'lu olacak.

**Uygulama:**
- Backend: `CreateHolidayCommand` handler, `ICurrentSessionProvider.GetCurrentSessionIdOrNull()` ile otomatik atar.
- Migration (Sprint 4+): `NULL` kayıtları en yakın sezona bağla, sonra kolon `NOT NULL` yap.

---

### BR-SS-014 — Eğitim seviyesi çoklu seçim

**Kural:** `school_type` enum artık tek değil — birden fazla eğitim seviyesi seçilebilir (örn. bir K12 okul hem İlkokul hem Ortaokul hem Lise).

**Uygulama seçenekleri:**
- (A) `school_type` kolonunu koru, **informational** olarak bırak (backend validation yok); asıl kapsam `school_grade_levels` junction'dan gelsin.
- (B) `school_education_levels` junction tablosu oluştur.

**Karar:** (A) — Yeni tablo oluşturmak gereksiz. `school_type` "genel profil" bilgisi olarak kalır; gerçek kademe filtresi `school_grade_levels`'tan gelir. Frontend'de "Okul Tipi" multi-select gösterilebilir, ama backend'de zorlama yok.

> `school_grade_levels` junction + seed zaten school_type'a göre çalışıyor. Eğer admin ilkokul + ortaokul seçtiyse → 1-8 seed edilir.

**UI politikası güncellemesi (2026-05-28):** Kademeler frontend'de **kullanıcı tarafından tek tek seçilmez**; tamamen seçili okul tür(ler)inden **türetilir**. Gerekçe yasal: Ortaokul seçen bir okul 5–8. sınıfların hepsini açmak zorundadır; kullanıcı yanlışlıkla bir kademeyi atlayıp eksik yapı kuramamalı (okul müdürü geri bildirimi). Bu yüzden "Aktif Sınıf Kademeleri" kartı **salt-görünümdür** (info bar ile açıklanır), ve `school_grade_levels` PUT'u "Akademik Yapı" formunun Kaydet'iyle birlikte, seçili türlerin **tüm** kademeleriyle gönderilir. Önceki "admin kademeleri fine-tune eder" yaklaşımı bu nedenle terk edildi.

---

### BR-SS-015 — Akademik Yapı permission ayrımı

**Kural:** `UpdateAcademicStructure` endpoint'i artık `school-settings.update-basic` yerine **`school-settings.update-academic-structure`** permission'ı kullanır.

**Sebep:** Temel bilgiler (MEB kodu, vergi no) ve akademik yapı (ders günleri, ders sayısı, sınıf kademeleri) farklı hassasiyet düzeyinde. Bir müdür yardımcısına akademik yapı düzenleme yetkisi verilip vergi bilgisi düzenleme yetkisi verilmeyebilir.

**Uygulama:**
- Backend: `UpdateAcademicStructure` endpoint `[HasPermission("school-settings.update-academic-structure")]`
- Migration: Yeni permission satırı seed + SCHOOL_ADMIN role mapping
- **Breaking change:** Mevcut SCHOOL_ADMIN rolüne otomatik eklenir; diğer rollerde manual ekleme gerekir.

---

### BR-SS-016 — Akademik Politikalar sekmesi

**Kural:** "Akademik Politikalar" sekmesi şu ayarları içerir:

| Ayar | Kolon | Default | Açıklama |
|---|---|---|---|
| Not skalası (default) | `default_grade_scale_id` | null (seçilmemiş) | Master `grade_scales`'tan |
| Geçme notu (default) | `default_passing_score` | 50 | Skala aralığına göre |
| Seviye bazlı skala | junction tablo | — | İlkokul/lise ayrımı |
| Veri saklama süresi | `graduated_data_retention_years` | 5 | Min 1, max 30 |
| Şube onay akışı | `require_approval_for_classroom_creation` | false | Parametrik |
| Karne otomatik yayın | `auto_publish_report_cards` | true | Parametrik |
| Devamsızlık uyarı eşiği | `absence_warning_threshold` | 5 | Sprint 2'de aktive |
| Devamsızlık kritik eşik | `absence_critical_threshold` | 10 | Sprint 2'de aktive |
| Devamsızlık max eşik | `absence_max_threshold` | 20 | Sprint 2'de aktive |
| Geç gelme dönüşümü | `count_late_as_absence` | false | Sprint 2'de aktive |
| Geç gelme oranı | `late_to_absence_ratio` | 3 | Sprint 2'de aktive |

Sprint 1'de sadece ilk 6 satır aktif; devamsızlık ayarları Sprint 2'de `attendance` modülü ile birlikte.

---

## Sınır Durumlar

| Senaryo | Beklenen Davranış |
|---|---|
| Okul yeni kuruldu, skala seçilmemiş | `default_grade_scale_id = null`. Not girişi yapılmak istendiğinde `marks` modülü uyarı verir: "Lütfen okul ayarlarından not skalasını seçin" |
| İlkokul için 5'lik skala seçilmişken geçme notu 50 girilirse | BR-SS-012: 5'lik skala aralığı (1-5), 50 reddedilir. Frontend skala değişince input sınırlarını günceller |
| Tüm sınıf kademeleri deaktive edilmeye çalışılırsa | BR-SS-010: son kademe deaktive edilemez |
| `school_holidays` kaydı sezon olmadan oluşturulursa | BR-SS-013: `academic_session_id = null` kabul edilir (geçiş dönemi) |
| Mevcut okulun `school_type`'ı değiştirilirse | `school_grade_levels` otomatik güncellenmez — admin kademe checkbox'larını manuel düzenler |

---

## Tarihsel Notlar

| Tarih | Değişiklik |
|---|---|
| Sprint 1 başlangıcı | 9 iş kuralı (BR-SS-001 → BR-SS-009), 21 endpoint, 10 permission |
| 2026-05-25 | 7 yeni iş kuralı (BR-SS-010 → BR-SS-016), 2 yeni tablo, 5 yeni kolon, 2 yeni permission |