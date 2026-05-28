# Okul Ayarları — UI Flows (Güncellenmiş)

> **Toplam 7 sekme.** Spec'in ilk 4 sekmesi (Genel Bilgi / İletişim / Adres / Tema) tek
> `GeneralSettingsTab` içinde **4 `FormSection` bölümü** olarak birleştirildi (UX kararı,
> 2026-05-27). Diğer sekmeler spec ile birebir eşleşir.

---

## Sayfa Lokasyonu

Frontend: `oksis-web/src/portals/admin/settings/`

```
settings/
├── pages/
│   └── SchoolSettingsPage.tsx         (kabuk: PageHeader + Tabs + <Outlet/>)
├── tabs/
│   ├── GeneralSettingsTab.tsx         (Basic + Contact + Address + Theme → tek sekmede 4 FormSection)
│   ├── AcademicStructureTab.tsx       (🔄 güncellendi)
│   ├── AcademicPolicyTab.tsx          (🆕 YENİ)
│   ├── BellScheduleTab.tsx            (mevcut)
│   ├── HolidaysTab.tsx                (mevcut)
│   ├── NotificationConfigTab.tsx      (mevcut)
│   └── ModuleConfigTab.tsx            (mevcut)
├── components/
│   ├── SchoolSettingsTabs.tsx         (yatay sekme çubuğu, React Router <Link>)
│   ├── GradeLevelScalePanel.tsx       (🆕 — AcademicPolicyTab alt component)
│   ├── AddressFields.tsx, ColorPickerField.tsx, LogoUploadCard.tsx,
│   │   BellScheduleGrid.tsx, BellScheduleFormModal.tsx,
│   │   HolidayList.tsx, HolidayFormModal.tsx,
│   │   ModuleToggleCard.tsx, NotificationThresholdSection.tsx,
│   │   PassingScoreField.tsx, SettingsSkeleton.tsx, …
├── api/ (queries, mutations, keys)
├── schemas/ (zod)
└── types/
```

**URL:** `/admin/settings` (index → `/admin/settings/general`'a redirect)
**Sekme state:** path-based, query param **değil**:
`/admin/settings/{general|academic|academic-policy|bell-schedule|holidays|notifications|modules}`

---

## Güncellenen Sekmeler

### 5. Akademik Yapı (🔄 güncellendi)

**Permission:** `school-settings.view` + `school-settings.update-academic-structure` ⚠️ (eski: `update-basic`)

**Mevcut alanlar (değişmez):**
- Okul tipi (`SchoolType`) — artık çoklu seçim destekli (multi-select dropdown veya checkbox group: Anaokulu, İlkokul, Ortaokul, Lise)
- Eğitim dili (`EducationLanguage`)
- Haftalık ders günleri (`WeeklyLessonDays`) — checkbox group (Pazartesi-Cuma default)
- Günlük ders sayısı (`DailyLessonCount`)
- Öğrenci no prefix + uzunluk
- Timezone

**Yeni alan — Sınıf Kademeleri (multi-select):**

```
┌─────────────────────────────────────────────────┐
│  Aktif Sınıf Kademeleri                         │
│                                                 │
│  Anaokulu                                       │
│  ☐ Anaokulu                                     │
│                                                 │
│  İlkokul                                        │
│  ☑ 1. Sınıf  ☑ 2. Sınıf  ☑ 3. Sınıf  ☑ 4. Sınıf │
│                                                 │
│  Ortaokul                                       │
│  ☑ 5. Sınıf  ☑ 6. Sınıf  ☑ 7. Sınıf  ☑ 8. Sınıf │
│                                                 │
│  Lise                                           │
│  ☑ 9. Sınıf  ☑ 10. Sınıf ☑ 11. Sınıf ☑ 12. Sınıf│
│                                                 │
│  ⚠ En az bir sınıf kademesi aktif olmalıdır    │
└─────────────────────────────────────────────────┘
```

- **Salt-görünüm (2026-05-28 güncellemesi):** Kademeler kullanıcı tarafından tek tek seçilmez; seçili okul tür(ler)inden otomatik türetilir ve yalnızca seçili türlere ait gruplar gösterilir (info bar ile açıklanır). Gerekçe yasal — bkz. BR-SS-014.
- Master `grade_levels` eğitim seviyesine göre gruplu, salt-görünüm işaretiyle listelenir (düzenlenemez).
- Hiç okul türü seçili değilse "önce okul türü seçin" ipucu; en az bir tür zorunlu.
- Save: "Akademik Yapı" formunun Kaydet'i hem yapıyı hem seçili türlerin TÜM kademelerini `PUT /grade-levels` ile gönderir → `SchoolGradeLevelsChangedEvent`.

---

### 6. Akademik Politikalar (🆕 YENİ SEKME)

**Permission:** `school-settings.view` + `school-settings.update-academic-policy`

**Yapı — iki bölüm:**

```
┌─────────────────────────────────────────────────┐
│  📊 NOT SİSTEMİ                                │
│                                                 │
│  Varsayılan Not Skalası                         │
│  [▾ 100'lük Sistem          ]                   │
│                                                 │
│  Varsayılan Geçme Notu                          │
│  [ 50 ]  (0-100 arası)                          │
│                                                 │
│  ─── Seviye Bazlı Not Skalası ──────────────── │
│                                                 │
│  │ Sınıf Seviyesi │ Not Skalası    │ Geçme Notu│ │
│  │ 1. Sınıf       │ 5'lik Sistem   │ 3         │ │
│  │ 2. Sınıf       │ 5'lik Sistem   │ 3         │ │
│  │ 3. Sınıf       │ 5'lik Sistem   │ 3         │ │
│  │ 4. Sınıf       │ 5'lik Sistem   │ 3         │ │
│  │ 5. Sınıf       │ 100'lük Sistem │ —         │ │
│  │ ...            │ ...            │ ...       │ │
│  │ 12. Sınıf      │ 100'lük Sistem │ —         │ │
│                                                 │
│  "—" = varsayılan geçme notu kullanılır         │
│  [Seviye Bazlı Skalayı Kaydet]                  │
│                                                 │
├─────────────────────────────────────────────────┤
│  ⚙️ İŞ AKIŞI AYARLARI                          │
│                                                 │
│  Şube Oluşturma Onayı                           │
│  [ ] Şube oluşturulduğunda onay gereksin        │
│                                                 │
│  Karne Yayın Politikası                         │
│  [●] Dönem kapanınca otomatik yayınla           │
│  [○] Dönem kapanınca taslak olarak oluştur      │
│                                                 │
│  Mezun Veri Saklama Süresi                      │
│  [ 5 ] yıl  (min 1, max 30)                    │
│  ℹ 5 yıldan fazla seçim ek ücrete tabi olabilir │
│                                                 │
├─────────────────────────────────────────────────┤
│  📋 DEVAMSIZLIK EŞİKLERİ (Sprint 2)            │
│  Bu bölüm henüz aktif değil.                    │
│  Devamsızlık modülü açıldığında kullanılabilir. │
│                                                 │
│  [Kaydet]                                       │
└─────────────────────────────────────────────────┘
```

**Form alanları:**

| Alan | Tip | Validation | Default |
|---|---|---|---|
| Varsayılan Not Skalası | Select (master `grade_scales`) | Master'da mevcut | null (seçilmemiş) |
| Varsayılan Geçme Notu | Number | Skala min/max aralığında (BR-SS-012) | 50 |
| Şube Oluşturma Onayı | Checkbox | — | false |
| Karne Yayın Politikası | Radio (otomatik / taslak) | — | otomatik (true) |
| Mezun Veri Saklama | Number + suffix "yıl" | 1-30 | 5 |

**Seviye bazlı skala paneli (`GradeLevelScalePanel`):**
- DataGrid: sadece `school_grade_levels`'ta aktif seviyeler listelenir
- Her satırda: seviye adı (read-only), skala (select), geçme notu (number, nullable)
- "—" (null) = varsayılan geçme notu kullanılır
- Skala değiştiğinde geçme notu input sınırları dinamik güncellenir
- Save: `PUT /grade-level-scales`

**Save akışı:** İki ayrı kaydet butonu (üst bölüm `PUT /academic-policy`, alt bölüm `PUT /grade-level-scales`). Sebebi: bağımsız endpoint'ler, partial save destekli.

**Edge case'ler:**
- Hiç sınıf kademesi aktif değilse → seviye bazlı skala paneli boş, "Önce Akademik Yapı sekmesinden sınıf kademelerini aktive edin" bilgilendirmesi
- Skala seçilmemiş → "Not girişi yapabilmek için lütfen bir not skalası seçin" info banner (uyarı değil engel değil)
- Sprint 2'ye bırakılan devamsızlık bölümü → disabled, gri, "Yakında" badge

---

### 8. Tatiller (🔄 güncellendi — minor)

**Tek değişiklik:** `CreateHoliday` ve `UpdateHoliday` modal'larına `academic_session_id` otomatik eklenir (backend handler `ICurrentSessionProvider` ile atar). Frontend'de sezon seçimi gösterilmez — otomatik. Aktif sezon yoksa null kalır (geçiş dönemi, BR-SS-013).

Mevcut takvim/DataGrid toggle, resmi tatil read-only badge, `HolidayFormModal` — hepsi değişmez.

---

## Mevcut Sekmeler (değişmez)

| # | Sekme (kod) | Path | İçerik |
|---|---|---|---|
| 1 | **Genel** (`GeneralSettingsTab`) | `/admin/settings/general` | Tek sekme içinde 4 `FormSection`: **Temel Bilgiler**, **İletişim Bilgileri**, **Adres Bilgileri**, **Görünüm** (tema/logo). Her bölümün kendi Kaydet butonu, kendi mutation'ı (`useUpdateBasicInfo`, `useUpdateContactInfo`, `useUpdateAddress`, `useUpdateTheme`). |
| 4 | Zil Programı | `/admin/settings/bell-schedule` | değişmez |
| 6 | Bildirimler | `/admin/settings/notifications` | değişmez |
| 7 | Modüller | `/admin/settings/modules` | değişmez |

> i18n: `school-settings.tabs.general = "Genel Bilgiler"`; bölüm başlıkları
> `school-settings.sections.{basic-info,contact-info,address,theme}` altında.

---

## Mobile Flow

Mobile uygulamada okul ayarları **salt-okunur** (admin paneli web-only). Mobile'da:
- ✅ Okul bilgileri görüntüleme (profil ekranında)
- ✅ Aktif sezon/dönem bilgisi (banner)
- ❌ Ayar düzenleme (web-only)

---

## i18n Key'leri (yeni eklenenler)

| Key | TR |
|---|---|
| `school-settings.tabs.academic-structure` | Akademik Yapı |
| `school-settings.tabs.academic-policy` | Akademik Politikalar |
| `school-settings.grade-levels.title` | Aktif Sınıf Kademeleri |
| `school-settings.grade-levels.min-one` | En az bir sınıf kademesi aktif olmalıdır |
| `school-settings.grade-levels.auto-update-confirm` | Okul tipi değişti. Sınıf kademelerini otomatik güncellemek ister misiniz? |
| `school-settings.policy.grade-scale` | Varsayılan Not Skalası |
| `school-settings.policy.passing-score` | Varsayılan Geçme Notu |
| `school-settings.policy.level-scales` | Seviye Bazlı Not Skalası |
| `school-settings.policy.level-scales.default-hint` | "—" = varsayılan geçme notu kullanılır |
| `school-settings.policy.approval-toggle` | Şube oluşturulduğunda onay gereksin |
| `school-settings.policy.report-card-auto` | Dönem kapanınca otomatik yayınla |
| `school-settings.policy.report-card-draft` | Dönem kapanınca taslak olarak oluştur |
| `school-settings.policy.retention` | Mezun Veri Saklama Süresi |
| `school-settings.policy.retention-warning` | 5 yıldan fazla seçim ek ücrete tabi olabilir |
| `school-settings.policy.absence-coming-soon` | Bu bölüm henüz aktif değil |
| `school-settings.policy.no-scale-info` | Not girişi yapabilmek için lütfen bir not skalası seçin |
| `school-settings.policy.no-grades-info` | Önce Akademik Yapı sekmesinden sınıf kademelerini aktive edin |