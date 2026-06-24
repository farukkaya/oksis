# settings-new — Backend İhtiyaç Dokümanı (sekme-sekme)

> **Tür:** Analiz / iş planı girdisi (bağlayıcı spec değil). Mühendisin bu dokümanla dilim çıkarabilmesi hedeflenir.
> **Oluşturma:** 2026-06-24 · **Kapsam:** Admin portalı · `/admin/settings-new` · 8 sekme.

## Giriş

`/admin/settings-new` ekranı handoff'tan **birebir, tamamen mock** portlandı: sekmelerdeki tüm form/CRUD etkileşimleri yalnızca `useState` + `setTimeout(650)` taklit kaydetmesidir; **hiçbir backend çağrısı yoktur**. Bu doküman, ekranın gerçeğe bağlanması için sekme-sekme backend ihtiyacını listeler.

Burada **Debt yoktur**: handoff'un tamamı backend ister. İşaretleme: **✅ zaten var (dokunmadan bağlanır)** · **🟠 mevcut, genişletilecek** · **🔴 sıfırdan**.

> **Önemli doğrulama notu:** Mevcut backend, spec §5'in tahmin ettiğinden **daha olgun**. `school-settings` modülünde 26 endpoint canlı (bell-schedules, holidays, module-configs, notification-config, academic-policy, grade-levels dahil). Aşağıda spec §5 ile çelişen yerler **[Spec §5 farkı]** ile not düşüldü. Modül completion_status'lar güncel olmayabildiğinden bazı kalemler **(doğrulanmalı)** işaretlidir — gerçek kontrol `api-contracts.md` + controller kaynağıdır.

İzin tabanı: backend `SCHOOL_SETTINGS` modülünde 13 izin seed'li; `school-settings.manage-authority` hariç tümü SCHOOL_ADMIN'e otomatik atanır. Derslikler için `class-rooms.view/.manage` ayrı modülde tanımlı.

---

## Sekme 1 — Genel Bilgiler (`GeneralTab.tsx`)

### 1. Okuma (GET) modeli
Tek GET ile yüklenir: `GET /api/v1/school-settings`.
- Kurum kimliği: `resmiAd` (OfficialName ✅), `gorunenAd` (DisplayName 🔴), `tur` = Özel/Devlet/Vakıf (OwnershipType 🔴), MEB kodu (MebCode ✅, salt-okunur), `kurulus` (FoundingYear 🔴), logo (Theme.LogoUrl ✅).
- İletişim: `tel`, `eposta`, `web` (ContactInfo ✅), `il`/`ilce`/`adres` (Address ✅).
- Kurum Yetkilisi kartı: `mudur`/`unvan`/`mudurEposta` (SchoolAuthority VO 🔴) — salt-okunur gösterim.
- Kayıt Bilgisi kartı: Kurum ID + oluşturulma + son güncelleme + güncelleyen ad (recordInfo projeksiyonu 🟠 — audit alanları domain'de var, GET DTO'ya eklenmeli, `UpdatedBy`→ad çözümü gerek).
- İl/ilçe/tür seçenek listeleri: statik FE (backend lookup gerekmez).

### 2. Yazma işlemleri
Tek "Kaydet" çubuğu, ama backend zaten alan-grubu bazında ayrı PUT'lar sunuyor (FE bunlara dağıtmalı veya birleşik PUT eklenmeli):
- `PUT /school-settings/basic-info` ✅ — {officialName, mebCode (salt), + yeni: displayName, ownershipType, foundingYear}. **Not:** mevcut basic-info `taxNumber`/`taxOffice` taşıyor → K2 ile kaldırılacak.
- `PUT /school-settings/contact-info` ✅ — {phone, email, website}. **K2: `fax` kaldırılır.**
- `PUT /school-settings/address` ✅ — {province, district, fullAddress}.
- Logo: `POST /school-settings/logo` ✅, `DELETE /school-settings/logo` ✅.
- Kurum Yetkilisi: yeni `PUT /school-settings/authority` 🔴 {name, title, email} — **yalnız SüperAdmin** (K5).

### 3. Yeni entity / kolon / enum
- 🔴 `SchoolSettings.DisplayName` (nullable string)
- 🔴 `SchoolSettings.OwnershipType` (enum: Özel/Devlet/Vakıf) — **`SchoolType`/`SchoolTypes` (kademe) ile karıştırma**
- 🔴 `SchoolSettings.FoundingYear` (int?)
- 🔴 `SchoolAuthority` owned VO (Name/Title/Email) — ContactInfo deseni
- 🟠 GET DTO'ya `recordInfo` bloğu (audit + UpdatedBy ad çözümü)
- **Kaldırılacak (K2):** `theme_primary_color`/`theme_secondary_color` kolonları + `PUT /theme` renk kısmı, `tax_number`, `tax_office`, `contact_info_fax` (UI + domain + migration). `theme_logo_url` korunur.

### 4. Invariant / doğrulama
- `resmiAd`, `gorunenAd` boş olamaz (FE'de var; FluentValidation'a taşı).
- `eposta`/`mudurEposta` e-posta format.
- MEB kodu immutable (sunucu reddetmeli).
- `foundingYear` makul aralık (ör. 1900..şimdi).

### 5. İzin
- Okuma: `school-settings.view` ✅
- basic/contact/address: `school-settings.update-basic` / `.update-contact` / `.update-address` ✅
- Logo: `school-settings.upload-logo` ✅
- Kurum Yetkilisi: `school-settings.manage-authority` ✅ (matrix'te tanımlı, yalnız SüperAdmin) — endpoint'e bağlanmalı.

**Durum:** Kısmi — iletişim/adres/logo/MEB ✅ hazır; DisplayName + OwnershipType + FoundingYear + SchoolAuthority VO + recordInfo + ölü-alan temizliği BE işi (en kritik eksik: SchoolAuthority VO + authority endpoint/izin).

---

## Sekme 2 — Akademik Yapı (`StructureTab.tsx`)

### 1. Okuma (GET) modeli
- Kademeler listesi (Anaokulu/İlkokul/Ortaokul/Lise): aç/kapat + **şube sayısı** + "kullanımda" kilidi. Kaynak: `GET /school-settings/grade-levels` ✅ (aktif kademeler) + her kademe için **şube sayısı** `Class`/`ClassRoom` agregasyonu 🔴 (DTO'da yok).
- Şube adlandırma kuralı (harf "5-A" / sayı "5-1"): **statik FE** (K6) — backend kaydı yok.
- Ders Kataloğu: ad, kod, kademeler[], haftalık saat, durum, inuse. Kaynak: `GET /api/v1/subjects` ✅ (master katalog 22 ders + 148 kademe eşlemesi seed'li).
  - **[Spec §5 farkı]** Spec "branş bağlantısı gösterilmez" der; mock'ta da yok — uyumlu. Ancak mock'taki `kademeler[]` = `subject_grade_levels` (M:N) ✅ zaten var.

### 2. Yazma işlemleri
- Kademe aç/kapat + sıralama: `PUT /school-settings/grade-levels` ✅ (aktif kademe ID dizisi).
- Şube adlandırma: yazma **yok** (statik, K6).
- Ders Kataloğu CRUD:
  - `POST /api/v1/subjects` 🟠 — {ad, kod, kademeler[], haftalıkSaat, durum} (scaffold var, gövde `{{TBD}}` — doğrulanmalı)
  - `PUT /api/v1/subjects/{id}` 🟠 (aynı)
  - `PUT /api/v1/subjects/{id}` durum (Aktif/Pasif toggle) — update ile
  - `DELETE /api/v1/subjects/{id}` 🟠 (soft) — **inuse guard 409 eksik** 🔴

### 3. Yeni entity / kolon / enum
- ✅ `Subject` master + `SubjectCategory` enum + `subject_grade_levels` zaten var.
- 🟠 `Subject` üzerinde **haftalık saat** (defaultWeeklyHours int?) — mock'ta var; master'da yok (doğrulanmalı). Tenant-bazlı saat ileride `classroom_subjects`'a gidebilir.
- 🔴 Kademe **şube sayısı** agregasyon sorgusu (`ClassRoom` count, AS-3).
- **[Spec §5 farkı / AS-2]** Akademik Yapı'dan kaldırılacaklar (timezone, öğrenci no prefix/uzunluk, haftalık ders günleri) `school_settings`'te kolon olarak var → domain+migration temizliği 🟠. **Korunur:** `daily_lesson_count`, `education_language`.

### 4. Invariant / doğrulama
- Ders adı boş olamaz; en az 1 kademe; haftalık saat 1..40 (FE'de var → FluentValidation).
- Kod büyük harf (tr) normalize.
- Aktif sezonda şubesi olan kademe **kapatılamaz** (FE kilidi → BE guard, AS-3).
- inuse ders (aktif programda) **silinemez** → 409.

### 5. İzin
- Okuma kademe/ders: `school-settings.view` ✅ + `subjects.view` ✅.
- Kademe güncelle: `school-settings.update-academic-structure` ✅.
- Ders CRUD: `subjects.create/.update/.delete` ✅ (modül izinleri var; **permission-matrix.md'de `subjects.*` satırı eksik** → eklenmeli).

**Durum:** Kısmi — kademe okuma/yazma + ders katalog okuma ✅; Subjects CRUD scaffold 🟠 (gövde doğrulanmalı + inuse guard 🔴), kademe şube-sayısı agregasyonu 🔴 en kritik eksik.

---

## Sekme 3 — Akademik Politikalar (`PoliciesTab.tsx`)

### 1. Okuma (GET) modeli
`GET /school-settings` içinden (academic-policy GET ayrı yok, doğrulanmalı):
- `gecme` (DefaultPassingScore ✅), `yuvarlama` (RoundingRule 🔴), karne skalası (statik FE, MEB sabit).
- `yazili`/`perf` sayıları 🔴, `wYazili`/`wPerf` ağırlıkları 🔴.
- Devamsızlık: `ozursuz`/`toplam`/`esik` + `bildirim` 🔴.
- `takdir`/`tesekkur` eşikleri 🔴 + `otoBelge` (AutoPublishReportCards ✅).

### 2. Yazma işlemleri
- `PUT /school-settings/academic-policy` 🟠 — mevcut alanlar (DefaultPassingScore, DefaultGradeScaleId, AutoPublishReportCards, GraduatedDataRetentionYears, RequireApprovalForClassRoomCreation) ✅; payload **genişletilecek**: roundingRule, examCounts, weights, absence{ozursuz,toplam,esik,bildirim}, takdir/tesekkur eşikleri 🔴.
- "MEB Varsayılanlarına Dön": FE reset ✅ (sunucu sabiti opsiyonel).

### 3. Yeni entity / kolon / enum (hepsi `school_settings` veya `academic_policy` üzerinde)
- 🔴 `RoundingRule` enum (Yok/EnYakın/DaimaYukarı)
- 🔴 `WrittenExamCount` / `PerformanceCount` (1..3)
- 🔴 `WrittenWeight` / `PerformanceWeight` (toplam 100)
- 🔴 Devamsızlık: `UnexcusedLimit`, `TotalLimit`, `WarningThreshold`, `AutoNotifyParent` (bit)
- 🔴 `MeritThreshold` (takdir), `ThanksThreshold` (teşekkür)
- ✅ `DefaultPassingScore`, `AutoPublishReportCards` mevcut.
- **[Spec §5 farkı]** Devamsızlık eşikleri için spec "Sprint 2'de `absence_warning_threshold`" planlı diyor — bu kalemler kısmen tasarlanmış; gerçek migration doğrulanmalı.

### 4. Invariant / doğrulama (sunucu — FluentValidation + domain)
- INV-POL-1: `wYazili + wPerf = 100`.
- INV-POL-2: `toplam > ozursuz > esik` (sıralama).
- INV-POL-3: `takdir > tesekkur`, ikisi de 1..100.
- INV-POL-4: `gecme` 1..100.
- Scope (AS-5): **tenant-geneli, sezondan bağımsız** — sezon parametresi YOK.

### 5. İzin
- Okuma: `school-settings.view` ✅.
- Yazma: `school-settings.update-academic-policy` ✅.

**Durum:** Kısmi — sadece geçme notu + otoBelge bağlanabilir; yuvarlama/sınav sayıları/ağırlıklar/devamsızlık/takdir-teşekkür alanları (~10 kolon + 4 invariant) sıfırdan BE genişletmesi gerek (en kritik eksik: ağırlık+devamsızlık+takdir invariant'lı alan seti).

---

## Sekme 4 — Derslikler (`RoomsTab.tsx` + `DerslikForm.tsx`)

### 1. Okuma (GET) modeli
- Liste: ad, kod, **tip (7)**, kapasite, blok, kat, durum, inuse. Kaynak: `GET /api/v1/rooms?sessionId=` ✅.
- Arama + tip/durum filtre + tablo/kart + sayfalama (8/9): client-side ✅ (mevcut endpoint listeyi döndürüyor; sunucu sayfalama opsiyonel).

### 2. Yazma işlemleri
- `POST /api/v1/rooms` ✅ — {ad, kod, tip, kapasite, blok, kat, durum, aciklama}.
- `PUT /api/v1/rooms/{id}` ✅ — aynı.
- Pasife al / aktif et: `PUT /rooms/{id}` status alanı ✅ (drawer + DeactivateDialog).
- Sil: `DELETE` — **mevcut yalnız soft-delete (Status=Passive); inuse 409 guard yok** 🔴 (FE inuse'da sil butonunu disable ediyor; sunucu da reddetmeli).

### 3. Yeni entity / kolon / enum
- 🟠 `RoomType` enum **uyumsuz**: backend 8 değer (Classroom/Lab/Gym/Music/Art/Auditorium/Workshop/Other) ↔ handoff 7 tip (Sınıf/Laboratuvar/Atölye/Spor Salonu/Konferans/Kütüphane/Diğer). **[Spec §5 farkı]** Spec "4→7" diyor; gerçekte **8 değer var ama eşleşmiyor** (eksik: Kütüphane; fazla: Music/Art/Gym ayrı). → enum **yeniden eşleme/genişletme** + i18n.
- 🔴 `Room.Note` (açıklama) kolonu — mock'ta var, backend'de yok (`features` JSON var ama amaç farklı).
- ✅ `code` unique (filtered index) zaten var.

### 4. Invariant / doğrulama
- Ad boş olamaz; ad benzersiz (FE dup kontrolü → BE unique guard).
- Tip zorunlu; kapasite ≥ 0 (backend CHECK 1..200 — 0 izni doğrulanmalı, mock 0'a izin veriyor).
- inuse derslik **silinemez** → 409 🔴; pasif derslik program atamasında listelenmez.

### 5. İzin
- Okuma: `class-rooms.view` ✅.
- CRUD: `class-rooms.manage` (matrix) / endpoint'te `class-rooms.update` geçici eşleme ✅.

**Durum:** Tama yakın — CRUD/okuma ✅ canlı; en kritik eksikler: `RoomType` 7-tip eşlemesi 🟠, `Room.Note` kolonu 🔴, silme 409 guard 🔴.

---

## Sekme 5 — Zil Programı (`BellScheduleTab.tsx`)

### 1. Okuma (GET) modeli
- İki şablon (Tam Gün / Yarım Gün), her biri satır listesi: tip(ders/teneffüs/öğle) + start/end. Kaynak: `GET /school-settings/bell-schedules` ✅ (ama **düz liste — şablon ayrımı yok**).
- Gün atamaları (Pzt..Paz → tam/yarım/kapalı) 🔴.
- Otomatik üretici parametreleri (start/ders/ten/count/öğle): **client-only, persist edilmez** (AS-7).

### 2. Yazma işlemleri
- Çizelge satır kaydı: `POST /school-settings/bell-schedules/bulk` ✅ + `POST`/`PUT /{id}`/`DELETE /{id}` ✅.
  - Ancak mevcut yapı **tek düz liste**; iki şablon için `template_key` ayrımı 🔴 (veya iki ayrı bulk çağrısı + filtre).
- Gün atamaları kaydı: yeni `BellDayAssignment` tablosu + endpoint 🔴.

### 3. Yeni entity / kolon / enum
- ✅ `BellSchedule` child entity (slot_type, start_time, end_time, display_order) var.
- 🔴 `BellSchedule.TemplateKey` enum (Tam/Yarım) — şablon başına satır gruplama.
- 🔴 `BellDayAssignment` tablosu: {dayOfWeek, template: tam/yarım/kapalı}.
- Üretici parametreleri: persist **yok** (AS-7) — kolon eklenmez.

### 4. Invariant / doğrulama
- INV-ZIL: satır içi `end > start`; ardışık satırlar **çakışmaz** (start[i] ≥ end[i-1]) — FE'de var, bulk save'de BE doğrulamalı 🔴.
- slot_type döngüsü (ders↔teneffüs/öğle) tutarlılığı.

### 5. İzin
- Okuma: `school-settings.view` ✅.
- Yazma: `school-settings.manage-bell` ✅ (gün atamaları yeni endpoint de bunu kullanır).

**Durum:** Kısmi — düz çizelge CRUD ✅ bağlanır; iki-şablon (`TemplateKey`) + gün atamaları (`BellDayAssignment`) + bulk çakışma doğrulaması sıfırdan BE işi (en kritik eksik: TemplateKey + BellDayAssignment).

---

## Sekme 6 — Tatil Takvimi (`HolidaysTab.tsx`)

### 1. Okuma (GET) modeli
- Sezon tatil listesi: ad, tür(resmi/ara/yarıyıl/okul), başlangıç, bitiş. Kaynak: `GET /api/v1/school-holidays` ✅ (academic-years modülü; `academic_session_id` NOT NULL ✅).
- Sezon özeti (toplam gün + tür kırılımı): client agregasyon ✅.
- **[Spec §5 farkı]** Spec endpoint'i `GET /holidays?seasonId=` diye anar; gerçek path `/api/v1/school-holidays` ve session FK zaten zorunlu (year-bazlı değil) — sezon-scope **zaten var**, ekleme gerekmez.

### 2. Yazma işlemleri (yalnız "Okul Tatili" türü düzenlenebilir; resmi/ara/yarıyıl kilitli)
- `POST /api/v1/school-holidays` ✅ — {ad, tür: okul, bas, bit, not}.
- `PUT /api/v1/school-holidays/{id}` ✅.
- `DELETE /api/v1/school-holidays/{id}` ✅.

### 3. Yeni entity / kolon / enum
- 🟠 `HolidayType` enum **uyumsuz**: backend 4 değer (PublicHoliday/SchoolEvent/ClosedDay/SemesterBreak) ↔ handoff 4 tür (Resmî/Ara/Yarıyıl/Okul). **Eksik: "Ara Tatil"** (AS-4 → `AraTatil` ekle + taksonomi hizala + migration). `description` kolonu ✅ zaten var (mock'taki "not").
- 🔴 (Debt) Birleşik kaynak: resmî(MEB global katalog) + yarıyıl(Sezon) otomatik besleme — şimdilik FE kilit tooltip; gerçek otomatik dolum sonraki faz. `official_holidays` master (6 satır) + `GET /api/v1/official-holidays?start=&end=` ✅ önizleme için var.

### 4. Invariant / doğrulama
- Ad boş olamaz; başlangıç zorunlu; bitiş ≥ başlangıç (FE'de var → FluentValidation).
- Yalnız `okul` türü create/update/delete edilebilir; kilitli türlere yazma reddi 🔴.
- Tatil aralığı sezon sınırları içinde (doğrulanmalı).

### 5. İzin
- Okuma: `school-holidays.view` ✅.
- CRUD: `school-holidays.create/.update/.delete` ✅. **Not:** Ekran `school-settings.manage-holidays` izninden de bahsediyor; iki izin paralel — hangisinin uygulanacağı netleştirilmeli (doğrulanmalı).

**Durum:** Tama yakın — okul tatili CRUD + sezon-scope ✅ canlı; en kritik eksik: `HolidayType`'a `AraTatil` ekleme + kilitli-tür yazma reddi.

---

## Sekme 7 — Bildirim Ayarları (`SystemTabs.tsx` → `BildirimAyarlariTab`)

### 1. Okuma (GET) modeli
- Olay × kanal matrisi: ~8 olay (4 grup) × 3 kanal (Portal/E-posta/SMS) + smsNa. Kaynak: `notification_types` master (9 tip ✅) + `school_notification_configs` per-tip override (channels flag + is_enabled ✅). **GET endpoint yok** 🔴 (config sadece `GET /school-settings` içinde olabilir — doğrulanmalı; matris için ayrı GET gerek).
- Sessiz saatler (toggle + başlangıç/bitiş): `school_notification_configs.quiet_hours_start_hour/end_hour` ✅ (kolon var ama **hour bazlı int**; mock "HH:MM" → dönüşüm).
- Günlük SMS limiti 🔴, SMS kotası kartı (kullanım/başlık/sağlayıcı) 🔴 (statik/Debt, AS-6).
- **[Spec §5 farkı]** Spec "notification_types kataloğu + per-event config yok, büyük Debt" der; gerçekte **master katalog + per-tip override + quiet hours ZATEN VAR** → iş büyük ölçüde GET projeksiyonu + kanal eşlemesi, sıfırdan domain değil.

### 2. Yazma işlemleri
- Matris kaydı: `PUT /school-settings/notification-config` 🟠 — mevcut (4 kanal genel toggle + 2 eşik). Per-tip × per-kanal matris için **payload genişletilecek** (notificationTypeId başına channels flag + isEnabled). Kanal eşlemesi: Portal→InApp/Push, E-posta→Email, SMS→Sms.
- Sessiz saatler + SMS limiti aynı PUT içinde.

### 3. Yeni entity / kolon / enum
- ✅ `notification_types` master (9), `school_notification_configs` (channels flag, is_enabled, cooldown_minutes, quiet_hours_*) var.
- 🟠 Mock 8 olayı (devamsızlık/akademik/ödeme/duyuru) ↔ master 9 tip eşlemesi (Ödeme&Finans tipleri master'da yok olabilir → eksik tip seed 🔴, doğrulanmalı).
- 🔴 `daily_sms_limit` kolonu.
- 🔴 (Debt/statik) SMS kotası: kullanım/başlık/sağlayıcı — sağlayıcı kaynaklı, `GET /school-settings/sms-quota` ileride.
- 🟠 `smsNa` (bir olay için SMS yok): master `channels` flag'ında SMS bit'inin olmamasıyla türetilebilir ✅.

### 4. Invariant / doğrulama
- Günlük SMS limiti ≥ 1 (FE'de var).
- Sessiz saat aralığı geçerli; acil duyuru sessiz saatleri **deler** (kritik priority bypass — dispatcher zaten destekliyor).
- Per-tip kanal seçimi master `channels` flag'ı ile sınırlı (master'da SMS yoksa SMS seçilemez).

### 5. İzin
- Okuma: `school-settings.view` ✅.
- Yazma: `school-settings.manage-notifications` ✅.

**Durum:** Kısmi — master katalog + per-tip override + quiet hours ✅ var (spec'in sandığından çok daha hazır); eksik: matris GET projeksiyonu 🔴, ödeme/finans olay tipleri seed 🔴, `daily_sms_limit` 🔴, SMS kotası (statik/Debt). En kritik eksik: matris okuma/yazma DTO'sunun per-tip×per-kanal'a genişletilmesi.

---

## Sekme 8 — Modüller (`SystemTabs.tsx` → `ModullerTab`)

### 1. Okuma (GET) modeli
- 10 modül kartı: ad, açıklama, ikon, etiket(çekirdek/beta/plan/normal), aç/kapat durumu. Kaynak: `GET /school-settings/module-configs` ✅ (mevcut **6 satır/tenant**).
- Plan Durumu kartı: aktif/toplam sayısı, plan adı (Standart), yenileme tarihi. Kaynak: `master.plan_modules` katalog ✅ + abonelik (yenileme tarihi 🔴/Debt).

### 2. Yazma işlemleri
- Modül aç/kapat: `PATCH /school-settings/modules/{moduleKey}` ✅ {isEnabled}.
- Çekirdek modül (kilitli) ve plan-kilitli modül: yazma reddedilir (FE kilidi → BE guard).

### 3. Yeni entity / kolon / enum
- ✅ `school_module_configs` + `master.plan_modules` (plan×module katalog, `isAvailableInPlan` resolver) var.
- 🟠 Seed **6 modül → 10**: handoff'ta ogrenci/yoklama/notlar/program/duyuru/odeme/eokul/servis/yemek/kutup. Master'da attendance/marks/announcements/homework/messaging/reports (6) → eşleme + 4 yeni modül seed 🔴 (servis/yemek/kütüphane/e-okul karşılığı).
- 🟠 `ModuleTier` enum (çekirdek/beta/plan/normal) — FE'de tag var; BE'de Tier yok → enum/kolon 🔴 (veya FE-tag yeterli sayılır).
- 🔴 (Debt) Plan yenileme tarihi (abonelik kaynağı).

### 4. Invariant / doğrulama
- Çekirdek modül (ogrenci/yoklama) **kapatılamaz** → BE guard.
- Plan-kilitli modül (servis) mevcut planda etkinleştirilemez → `isAvailableInPlan` kontrolü ✅.

### 5. İzin
- Okuma: `school-settings.view` ✅.
- Yazma: `school-settings.manage-modules` ✅.

**Durum:** Kısmi — FE neredeyse hazır + toggle endpoint ✅; eksik: seed 6→10 + modül eşleme 🔴, `ModuleTier` enum 🟠, plan yenileme tarihi (Debt). En kritik eksik: 10-modül katalog hizalaması.

---

## Konsolide yeni backend işi (🔴/🟠, modül bazında, efor S/M/L)

### school-settings / schools
| İş | İşaret | Efor | Sekme |
|---|---|---|---|
| `DisplayName`, `OwnershipType`(enum), `FoundingYear` kolonları | 🔴 | S | 1 |
| `SchoolAuthority` owned VO + `PUT /authority` + authority izin bağlama | 🔴 | M | 1 |
| GET'e `recordInfo` projeksiyonu (audit + UpdatedBy→ad) | 🟠 | S | 1 |
| Ölü alan temizliği (tema renk, taxNumber, taxOffice, fax) UI+domain+migration | 🟠 | S | 1 |
| Akademik Yapı ölü alanları (timezone, öğrenci no prefix/uzunluk, ders günleri) temizliği | 🟠 | S | 2 |
| AcademicPolicy genişletme: RoundingRule, exam counts, weights, absence×4, takdir/teşekkür | 🔴 | L | 3 |
| AcademicPolicy invariant'ları (INV-POL 1-4) FluentValidation + domain | 🔴 | M | 3 |
| Bell `TemplateKey` enum + iki-şablon ayrımı | 🔴 | M | 5 |
| `BellDayAssignment` tablosu + endpoint | 🔴 | M | 5 |
| Bell bulk save çakışma/süre doğrulaması (INV-ZIL) | 🔴 | S | 5 |
| NotificationConfig matris GET + per-tip×per-kanal PUT genişletme | 🟠 | M | 7 |
| Ödeme/Finans `notification_types` seed (eksik tipler) | 🔴 | S | 7 |
| `daily_sms_limit` kolonu | 🔴 | S | 7 |
| Modül seed 6→10 + eşleme + `ModuleTier` enum | 🔴 | M | 8 |

### timetable (Room)
| İş | İşaret | Efor | Sekme |
|---|---|---|---|
| `RoomType` enum 7-tip handoff eşlemesine hizala (Kütüphane ekle vb.) + i18n | 🟠 | S | 4 |
| `Room.Note` (açıklama) kolonu | 🔴 | S | 4 |
| Room silme 409 guard (inuse) | 🔴 | S | 4 |

### subjects (Ders Kataloğu)
| İş | İşaret | Efor | Sekme |
|---|---|---|---|
| Subjects CRUD gövdelerini somutla (POST/PUT/DELETE `{{TBD}}`) | 🟠 | M | 2 |
| Subject `defaultWeeklyHours` alanı | 🟠 | S | 2 |
| Subject inuse silme 409 guard | 🔴 | S | 2 |
| Kademe şube-sayısı agregasyon sorgusu (`ClassRoom` count) | 🔴 | S | 2 |
| `subjects.*` izinlerini permission-matrix.md'ye ekle | 🟠 | S | 2 |

### academic-years (Holiday)
| İş | İşaret | Efor | Sekme |
|---|---|---|---|
| `HolidayType`'a `AraTatil` ekle + taksonomi hizala + migration (AS-4) | 🟠 | S | 6 |
| Kilitli-tür (resmi/ara/yarıyıl) yazma reddi guard | 🔴 | S | 6 |

### Debt / sonraki faz (statik veya büyük kaynak)
- SMS kotası kartı (kullanım/başlık/sağlayıcı — sağlayıcı kaynaklı, AS-6) — statik.
- Tatil birleşik kaynak otomatik besleme (MEB katalog + sezon yarıyıl).
- Bell üretici parametre persist (AS-7 — saklanmaz).
- Plan yenileme tarihi (abonelik kaynağı).

---

## Zaten hazır (✅ — dokunmadan bağlanabilir)

| Endpoint / yapı | Sekme | Not |
|---|---|---|
| `GET /school-settings` (+ `/public`) | 1,2,3,7 | Çoğu okuma alanı buradan |
| `PUT /school-settings/basic-info`, `/contact-info`, `/address` | 1 | Mevcut alanlar |
| `POST`/`DELETE /school-settings/logo` | 1 | Logo korunur (K2) |
| `GET`/`PUT /school-settings/grade-levels` | 2 | Kademe aç/kapat |
| `GET /api/v1/subjects` (+ master 22 ders + 148 kademe eşlemesi) | 2 | Ders katalog okuma |
| `PUT /school-settings/academic-policy` (mevcut alanlar) | 3 | gecme + otoBelge |
| `GET`/`POST`/`PUT`/`DELETE /api/v1/rooms` | 4 | Derslik CRUD canlı |
| `GET`/`POST`/`PUT`/`DELETE /school-settings/bell-schedules` (+ `/bulk`) | 5 | Düz çizelge CRUD |
| `GET`/`POST`/`PUT`/`DELETE /api/v1/school-holidays` (+ session FK) | 6 | Okul tatili CRUD + sezon-scope |
| `GET /api/v1/official-holidays?start=&end=` | 6 | Resmî tatil önizleme |
| `notification_types` master (9) + `school_notification_configs` (channels, is_enabled, cooldown, quiet_hours) | 7 | Matris altyapısı + sessiz saatler |
| `PUT /school-settings/notification-config` | 7 | Genel kanal/eşik yazma |
| `GET /school-settings/module-configs` + `PATCH /modules/{key}` + `master.plan_modules` | 8 | Modül toggle + plan resolver |
| 13 `school-settings.*` izni + `class-rooms.view/.manage` + `subjects.*` + `school-holidays.*` seed | tümü | İzin tabanı hazır |

---

## Genel değerlendirme

- **Sıfırdan denecek sekme yok.** Her sekmenin okuma/yazma çekirdeği canlı.
- **En ağır BE işleri:** Sekme 3 (Akademik Politika alan seti + invariant — L) ve Sekme 5/7 (Bell şablon+gün-atama; Notification matris genişletme — M).
- **En hafif:** Sekme 4 (Derslik) ve Sekme 6 (Tatil) — birkaç S kalem.
- **Spec §5 ile en büyük farklar:** (a) Notification matris altyapısı (master katalog + per-tip override + quiet hours) **zaten var**, "büyük Debt" değil; (b) `RoomType` 4 değil **8 değer** (ama yanlış eşleşiyor); (c) Holiday sezon-scope **zaten zorunlu**, eklemeye gerek yok; (d) school-settings endpoint sayısı 21→26, academic-policy/grade-levels dahil çoğu uç hazır.
