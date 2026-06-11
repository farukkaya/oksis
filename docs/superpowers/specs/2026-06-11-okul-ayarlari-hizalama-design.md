# OKSİS Ayarlar — Backend ↔ Frontend Hizalama Tasarımı

> **Tarih:** 2026-06-11 · **Durum:** Onaylandı (faruk) · **Kapsam:** 8 sekme, uçtan uca
> **Kaynak tasarım:** `Oksis Layout - Okul Ayarları.zip` (design_handoff_oksis_ayarlar) — high-fidelity, pixel-for-pixel hedef.
> **İlke:** Tasarım birebir uygulanır; backend frontend'e hizalanır.

## Amaç

Claude Design'ın ürettiği **Yönetim portalı → Sistem › Ayarlar** ekranını (8 sekme) hedef kod tabanına (`oksis-web` + `oksis-api`) birebir taşımak. Mevcut `school-settings` modülü %100 mvp-ready (21+ endpoint, 7 sekme) ama tasarım daha geniş: 4+ backend modülüne (`school-settings`, `academics`/subjects, `timetable`/rooms, ayrıca marks/attendance/report-cards politika alanları) yayılıyor. Bu spec tüm boşlukları ve uygulama dilimlerini tanımlar.

## Alınan kararlar (bağlayıcı)

1. **Akademik Politikalar veri sahipliği:** Tüm politika alanları **school-settings'te, şimdi**. marks/attendance/report-cards bu değerleri school-settings'ten okur. Q7 (sınav ağırlığı) ve Q8 (harfli skala) erteleme kararları **iptal**.
2. **Ders Kataloğu:** Master `Subject` salt-okunur kalır; yeni **okul × ders override** junction tablosu haftalık saat + aktif/pasif tutar. "Yeni Ders" = katalogdan master'dan ekleme.
3. **Frontend-first / Debt ilkesi (2026-06-11, faruk — TÜM planları yönetir):** FrontEnd tasarımı **birebir aktarılır**; backend **borçlu kalabilir**. Yeni tablo/entity gerektiren backend işi **ertelenir** ve frontend'de **`(Debt)`** rozeti + `// DEBT:` yorumu ile işaretlenir (veri frontend fixture'dan beslenir). Mali "borç" (debt-badge.css = öğrenci ödeme borcu) ile karıştırma. Her debt ilgili modülün `completion_status.md`'sine yazılır. → Bu, spec'teki "Dilim B/C backend remodel" işlerini *frontend exact + backend debt* önceliğine kaydırır; saf-additive (yeni tablo gerektirmeyen) backend işleri yine yapılabilir.

## Mevcut durum (doğrulanmış)

- `SchoolSettings`: OfficialName, MebCode, TaxNumber/Office, ContactInfo, Address, Theme, SchoolTypes (çoklu kademe), EducationLanguage, WeeklyLessonDays, DailyLessonCount, StudentNumberPrefix/Length, Timezone, GraduatedDataRetentionYears, RequireApprovalForClassRoomCreation, AutoPublishReportCards, DefaultGradeScaleId, DefaultPassingScore.
- `Holiday`: Title, HolidayDate, EndDate, HolidayType, IsRecurring, Description, AcademicSessionId. Enum: PublicHoliday, SchoolEvent, ClosedDay, SemesterBreak.
- `BellSchedule`: LessonOrder, Label, SlotType (Lesson/Break/LunchBreak), StartTime, EndTime. **Şablon/gün kavramı yok.**
- `NotificationConfig`: AbsenceWarningThreshold, AbsenceCriticalThreshold, IsEnabled, Push/Email/SmsEnabled, LateArrivalNotify. **Tek config — event×kanal matrisi değil.**
- `Timetable.Room` (= `academic.rooms`): Code, Location, Capacity, IsActive. Endpoint: GET/POST/PUT (DELETE yok). RoomType/Block/Floor/Name yok.
- `Academics.Subject` (master/seed): Code, Name, Category, IsElective, DisplayOrder + `SubjectGradeLevel`. Yalnız `ListSubjects` query (yazma yok).
- Modüller: plan-aware kataloğu teslim (Q-Plan-Modules) — eşleşiyor.

## Yaklaşım & sıralama

Tek master spec, risk sırasına göre dilimlenir:

- **Dilim A — Saf frontend yeniden inşa** (backend hazır, düşük risk): Modüller, Genel Bilgiler'in çoğu.
- **Dilim B — Eklemeli backend alanları** (additive, orta): Genel Bilgiler ekstra alanlar, Akademik Politikalar alanları, Şube adlandırma, Room tip/blok/kat + DELETE.
- **Dilim C — Yeniden modelleme** (remodel, yüksek — her biri ayrı): Zil Programı (şablon+gün), Bildirim (event×kanal matrisi), Ders Kataloğu (override tablosu), Holiday (tip+kilit).

## Sekme bazında tasarım

### 1 · Genel Bilgiler — Dilim A + küçük B
**Backend (B):** `SchoolSettings`'e ekle: `FoundingYear (int?)`, `InstitutionType` (enum: Özel/Devlet/…), `PrincipalName`, `PrincipalTitle`, `PrincipalEmail`. `UpdateBasicInfo` (+ gerekirse yeni "Yetkili" alt-update) genişler. Çoklu `SchoolTypes` (kademe) ayrı kalır — tasarımdaki **"Kurum Türü"** ayrı bir kurumsal tür alanıdır.
**Frontend (A):** Kartlar — Kurum Kimliği (logo image-slot, resmî ad*, görünen ad*, kurum türü, kuruluş yılı, MEB kodu kilitli), İletişim (telefon, e-posta, web, il/ilçe, adres), Yetkili (ad soyad*, unvan, e-posta). Yan kartlar: Önizleme + Kayıt Bilgisi (Kurum ID, oluşturulma, son güncelleme — mevcut audit alanlarından). Dirty-state save bar; e-posta format validation.

### 2 · Akademik Yapı — Dilim B + C
**Backend (B):** `SectionNamingPattern` enum (Letter/Number) → SchoolSettings + `UpdateAcademicStructure`. Kademeler `GET/PUT /grade-levels` mevcut; şube sayısı kademe başına türetilir (Classes/ClassRoom count).
**Backend (C) — Ders Kataloğu:** master `Subject` salt-okunur; yeni `school_subjects` junction (`SchoolId, SubjectId, WeeklyHours, IsActive`, tenant-scoped). Endpoint'ler: katalog `GET /subjects` (override join), `POST /subjects` (master'dan ekle), `PUT /subjects/{id}` (saat/aktif), `DELETE /subjects/{id}` (timetable/marks'ta kullanımdaysa kilit + tooltip).
**Frontend:** Kademe satırları (toggle, şube sayısı, kullanımda kilidi) + Şube Adlandırma kartı (Harf/Sayı, canlı önizleme) + Ders Kataloğu tablosu (ad, kod, kademe chips, haftalık saat, durum) + "Yeni Ders" drawer + "Nerede Kullanılır" yan kartı. Kademe/adlandırma → save bar; katalog → drawer + toast.

### 3 · Akademik Politikalar — Dilim B (hepsi school-settings, şimdi)
**Backend:** `AcademicPolicy` (SchoolSettings) genişler:
- Not Sistemi: `RoundingRule` (enum), `DefaultPassingScore` (mevcut), `DefaultGradeScaleId` (mevcut). 100'lük skala tablosu (Pekiyi→Geçmez) skala'dan türetilir.
- Sınav & Değerlendirme: `WrittenExamCount`, `PerformanceTaskCount`, `WrittenWeight`, `PerformanceWeight` (∑=100).
- Devamsızlık: `UnexcusedLimit`, `TotalLimit`, `WarningThreshold`, `ParentNotifyOnAbsence` (bool).
- Belgeler: `AppreciationThreshold` (takdir), `ThanksThreshold` (teşekkür), `AutoGenerateDocuments` (bool).
`PUT /academic-policy` genişler. **Live validation:** ağırlık ∑100, toplam>özürsüz, uyarı<özürsüz, takdir≥, teşekkür<takdir; hata save bar'ı kilitler. "MEB varsayılanlarına dön" hepsini sıfırlar.
**Migration notu:** Devamsızlık eşikleri bugün `NotificationConfig`'te (`AbsenceWarningThreshold/CriticalThreshold`) → **AcademicPolicy'ye taşınır**; NotificationConfig sadeleşir.
**Çapraz bağımlılık:** marks/attendance/report-cards bu değerleri school-settings'ten okur (bu sprint o modüllerde kod değişikliği yok; okuma adaptasyonu ileride).
**Frontend:** 4 kart + always-live validation + MEB defaults reset.

### 4 · Derslikler — Dilim B (`Timetable.Room`)
**Backend:** Room'a ekle: `Name`, `RoomType` enum (Sınıf/Atölye/Laboratuvar/Diğer), `Block` + `Floor` (bugünkü tek `Location`'ı ayır/migrate). Yeni **`DELETE /rooms/{id}`** + kullanım-kilidi (timetable'da kullanımdaysa silinemez, pasife alma confirm ile). Pasife alma = `PUT IsActive=false`. GET/POST/PUT mevcut.
**Frontend:** Students ekranı sistemi yeniden kullanılır — toolbar (arama, Tüm Tipler + Durum filtre, filtre chip'leri, Tablo/Kart toggle), sıralanabilir tablo (ad+kod, tip badge per-type ikon/renk, kapasite, konum "Blok · Kat", durum, hover row-actions), 8/sayfa pager. Yeni/Düzenle drawer + DeactivateDialog. Veri durumları: yükleniyor (skeleton), boş, hata, sonuç yok.

### 5 · Zil Programı — Dilim C (remodel)
**Backend:** Yeni `BellScheduleTemplate` (`SchoolId, Type: FullDay/HalfDay`, parametreler: startTime, lessonDuration, breakDuration, lessonCount, lunchPosition, lunchDuration). `BellSchedule` satırları template'e bağlanır (`TemplateId` ekle). Yeni `DayAssignment` (`SchoolId, Weekday, TemplateType|Closed`). "Otomatik üret" client-side hesaplanır → bulk save. Endpoint'ler: `GET/PUT /bell-schedule-templates`, `GET/PUT /day-assignments`; mevcut bulk-create satırlar için korunur.
**Frontend:** Tam Gün/Yarım Gün segmented switch + parametre satırı + görsel gün barı (ders/teneffüs/öğle blokları) + düzenlenebilir satır tablosu (tip, etiket, başlangıç–bitiş). Satır validation: bitiş>başlangıç, çakışma yok → hata save'i kilitler. Gün atamaları: her gün → Tam Gün/Yarım Gün/Kapalı. Save bar.

### 6 · Tatil Takvimi — Dilim C
**Backend:** `HolidayType`'a `MidtermBreak` (Ara Tatil) ekle. Kilit için `Source` enum (Meb/Season/School) alanı: Resmî (PublicHoliday) + Ara Tatil = MEB kaynaklı kilitli; Yarıyıl (SemesterBreak) = Sezon Yönetimi'nden, kilitli; yalnız **Okul** (SchoolEvent) tatili bu ekranda CRUD. CreateHoliday aktif-sezon otomasyonu mevcut.
**Frontend:** Tip filtre segmentleri (Tümü/Resmî/Ara/Yarıyıl/Okul) + aya gruplu liste (tarih aralığı, gün sayısı, tip badge, kilit tooltip) + "Okul Tatili Ekle" drawer (ad*, başlangıç*, bitiş≥başlangıç, not, canlı gün sayısı) + Sezon Özeti yan kartı (toplam tatil günü, tip dağılımı).

### 7 · Bildirim Ayarları — Dilim C (remodel)
**Backend:** Tek config yerine **event × kanal matrisi**. Yeni `NotificationEventConfig` (`SchoolId, EventKey, PortalEnabled, EmailEnabled, SmsEnabled`) sabit event kataloğu (8 event, grup: Devamsızlık/Akademik/Ödeme&Finans/Duyurular). Olası event key'leri notifications modülü outbox event tipleriyle hizalanır (mevcut key'ler doğrulanacak; eksikse N/A "—"). Yeni `NotificationPreferences` (`QuietHoursEnabled`, `QuietHoursStart`, `QuietHoursEnd`, `DailySmsLimit`). SMS kotası = okuma (kullanım/başlık/sağlayıcı; mevcut bir kaynaktan ya da yeni `GET /sms-quota`). Endpoint'ler: matris `GET/PUT`, tercihler `GET/PUT`, kota `GET`.
**Frontend:** Event×kanal toggle chip matrisi (check=on, "—"=N/A) + Gönderim Tercihleri (sessiz saatler toggle + saat aralığı, günlük SMS limiti) + SMS Kotası kartı (kullanım barı, başlık operator-locked, sağlayıcı) + Nerede Kullanılır. Save bar.

### 8 · Modüller — Dilim A
**Backend:** Değişmez (plan-aware kataloğu hazır). `GET /module-configs`, `PATCH /modules/{moduleKey}` mevcut.
**Frontend:** Modül kartları grid (ikon, ad, açıklama, toggle, footer tag) — Çekirdek kilitli ON, Beta tag, Kurumsal Plan kilitli OFF (upgrade tooltip), serbest Aktif/Kapalı. Plan Durumu yan kartı (N/10 aktif, plan, yenileme, "Planı Yükselt"). Save bar.

## Çapraz kesen kurallar

- **Routing:** her sekme kendi route'u (`/ayarlar/genel`, `/ayarlar/yapi`, `/ayarlar/politika`, `/ayarlar/derslikler`, `/ayarlar/zil`, `/ayarlar/tatil`, `/ayarlar/bildirim`, `/ayarlar/moduller`) — deep-linkable.
- **Rol kapısı:** Yönetici = tam düzenleme; Sekreter = salt-okunur (RO banner accent-soft + tüm input/toggle/buton disabled). Gerçek RBAC permission'larına map (server-side enforce; UI gate yalnız UX).
- **Ortak desenler:** dirty-state save bar (Vazgeç/Kaydet, spinner, invalid'de disabled), sağ drawer (brand-gradient `.form-head`), `.fld` alan deseni (label*/opsiyonel, error+alert-triangle, hint+info), kilit affordance + tooltip, toast (bottom-center, 2.6s).
- **Design token'ları:** oksis-web'de shadcn/ui + Tailwind mevcut; brand gradient, neutrals, semantic, admin accent, radius, type (Plus Jakarta Sans) `brand.css`'ten alınır. CSS değerleri ve yapısı tasarımdan birebir.
- **Multi-tenant:** tüm yeni tablo/sorgu/cache `SchoolId` scoped (`school_subjects`, `bell_schedule_templates`, `day_assignments`, `notification_event_configs`, `notification_preferences`).
- **MVP scope:** politika alanları onaylı kapsam genişlemesi (Q7/Q8 iptal kararı bu spec'le resmîleşti) — `school-settings/completion_status.md` "⚠️ Spec Dışına Çıkılanlar"a işlenecek.

## Doküman güncellemeleri (uygulama sırasında)

`.claude/docs/modules/school-settings/` (+ ilgili modüller): `api-contracts.md` (yeni endpoint'ler), `database-schema.md` (yeni tablo/kolon), `domain-model.md`, `permissions.md`, `business-rules.md` (politika validation kuralları), `notifications.md` (event kataloğu), `ui-flows.md`, `completion_status.md` (kapsam genişlemesi + Q7/Q8 iptali). `permission-matrix.md` yeni permission'larla.

## Kapsam dışı (bu spec'te değil)

- marks/attendance/report-cards modüllerinin school-settings'ten okuma adaptasyonu (değerler yazılır; okuyan taraf ayrı iş).
- SuperAdmin plan kataloğu UI (v2).
- Karne template seçimi + dil (Sprint 3).
- "ÖNİZLEME" pill (handoff aracı — shipping değil).
