# Akademik Sezon — UI Flows

> Bu modülün frontend ekranları, kullanıcı akışları, state management.

> Genel UI/UX kuralları için bkz. `frontend/ui-ux-rules.md` ve `frontend/component-rules.md`.

---

## Sprint 1 Kapsam Kararı

Sprint 1'de **sihirbaz YOK**. Sadece basit liste + form akışı yeterli — çünkü ilk pilot okul ilk yılında olacak; yıl-geçişi senaryosu yaşanmayacak.

Sihirbaz UI (5 adımlı, autosave'li, taşıma otomasyonlu) **Sprint 4** kapsamındadır (Pilot Hazırlığı).

---

## Web Flow

### Sayfa Lokasyonu

Frontend: `oksis-web/src/portals/admin/academic-sessions/`

```
academic-sessions/
├── pages/
│   ├── AcademicSessionListPage.tsx
│   ├── AcademicSessionDetailPage.tsx
│   └── AcademicSessionFormPage.tsx
├── components/
│   ├── ActiveSessionCard.tsx
│   ├── SessionStatusBadge.tsx
│   ├── ClassRoomGrid.tsx
│   ├── ClassRoomFormModal.tsx
│   ├── StudentAssignmentPanel.tsx
│   ├── TransferStudentModal.tsx
│   └── HolidayList.tsx
├── hooks/
│   ├── useAcademicSessionsQuery.ts
│   ├── useCurrentSessionQuery.ts
│   ├── useClassRoomsQuery.ts
│   └── ... (TanStack Query)
└── schemas/
    └── academicSessionSchema.ts   (Zod)
```

---

### Ekranlar

#### 1. Sezon Listesi — `/admin/academic-sessions`

**Portal:** admin
**Permission:** `season.list.read`
**Component:** `AcademicSessionListPage`

**Yapı:**
- **Üst:** Aktif sezon kartı (büyük, `ActiveSessionCard`)
  - Sezon adı, aktif dönem, şube sayısı, öğrenci sayısı, öğretmen sayısı
  - "Sezon Detayı" + "Dönem Geçişi" butonları (Dönem geçişi Sprint 3'te aktive)
- **Orta:** Eylem butonu — "Yeni Sezon Başlat" (sağ üst)
- **Alt:** Geçmiş sezonlar tablosu — adı, tarih aralığı, durum (Archived), şube sayısı, "Görüntüle" butonu

**State:**
- Server: `useAcademicSessionsQuery` + `useCurrentSessionQuery`
- Local: yok

**Edge Case'ler:**
- Aktif sezon yok → büyük CTA: "Henüz bir akademik sezon başlatmadınız. İlk sezonunuzu oluşturmak için 'Yeni Sezon Başlat'a tıklayın." → EmptyState
- Hata → ErrorState + retry
- Loading → Skeleton (Spinner değil)

---

#### 2. Yeni Sezon Formu — `/admin/academic-sessions/new`

**Portal:** admin
**Permission:** `season.draft.create`
**Component:** `AcademicSessionFormPage`

**Form alanları:**
- Sezon adı (text, regex `^\d{4}-\d{4}$`, placeholder "2025-2026")
- Sezon başlangıç tarihi (DatePicker)
- Sezon bitiş tarihi (DatePicker)
- 1. Dönem başlangıç ve bitiş tarihleri
- 2. Dönem başlangıç ve bitiş tarihleri

**Validation (Zod):**
```ts
const sessionSchema = z.object({
  name: z.string().regex(/^\d{4}-\d{4}$/, "Format: 2025-2026"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  term1StartDate: z.coerce.date(),
  term1EndDate: z.coerce.date(),
  term2StartDate: z.coerce.date(),
  term2EndDate: z.coerce.date(),
}).refine(d => d.startDate < d.endDate, "Bitiş başlangıçtan sonra olmalı")
  .refine(d => d.term1EndDate < d.term2StartDate, "1. dönem 2. dönemden önce bitmeli");
```

**Submit:**
- `POST /api/v1/academic-sessions` → sezon `Setup` statüde oluşturulur
- Toast "Sezon taslak olarak kaydedildi"
- Yönlendirme: `/admin/academic-sessions/{id}` (detay sayfası)

**Edge Case'ler:**
- 409 (duplicate name) → form hatası "Bu sezon adı zaten kullanılıyor"

---

#### 3. Sezon Detay — `/admin/academic-sessions/:id`

**Portal:** admin
**Permission:** `season.detail.read`
**Component:** `AcademicSessionDetailPage`

**Yapı (sekmeli):**
- **Sekme 1: Genel Bakış**
  - Sezon bilgileri (adı, tarihler, durum)
  - Dönem listesi (T1, T2 — statü, tarihler, "Aktive Et" / "Kapat" butonları)
  - Eğer `Status = Setup`: "Sezonu Yayınla" CTA
  - Eğer `Status = Active`: "Manuel Arşivle" butonu (gizli, advanced)
  - Eğer `Status = Archived`: read-only banner
- **Sekme 2: Şubeler** (`ClassRoomGrid`)
  - Sınıf seviyesine göre gruplu grid (Anaokulu / İlkokul / Ortaokul / Lise)
  - Her grup içinde şube kartları (FullName, kapasite, öğrenci sayısı, rehber öğretmen)
  - "Yeni Şube Ekle" butonu (her grup üstünde)
  - Şube kartına tıklayınca → Şube detay (öğrenci listesi, atama paneli)
- **Sekme 3: Tatiller** (`HolidayList`)
  - Sezon-scope'lu `school_holidays` listesi
  - "Yeni Tatil Ekle" + tatil düzenleme/silme
  - Master `official_holidays` salt-okunur, gri badge

---

#### 4. Şube Detay (modal veya alt-rota)

**Permission:** `class-rooms.view-detail`

**Yapı:**
- Şube bilgisi (FullName, GradeLevel, Section, Capacity, HomeroomTeacher)
- "Düzenle" + "Rehber Öğretmen Ata/Değiştir" butonları
- "Arşivle" butonu (sezon Active ise; aktif öğrenci varsa disabled + tooltip "Önce öğrencileri taşıyın")
- Öğrenci listesi (`StudentAssignmentPanel`)
  - DataGrid: Öğrenci No, Ad Soyad, Atanma Tarihi, Eylemler (Şube Değiştir, Çıkar)
  - Sağ üst: "Öğrenci Ekle" butonu → modal
- Geçmiş atamalar (collapse, default kapalı): bu şubeden ayrılan öğrenciler listesi

---

#### 5. Şube Oluşturma Modal (`ClassRoomFormModal`)

**Permission:** `class-rooms.create`

**Form alanları:**
- Sınıf seviyesi (Select, master `grade_levels` listesinden)
- Şube harfi (text, max 3, uppercase)
- Kapasite (number, 1-100)
- Rehber öğretmen (Select, opsiyonel)

**Davranış (BR-AS-008):**
- Eğer `school_settings.require_approval_for_classroom_creation = true`:
  - Submit sonrası şube `PendingApproval` olur
  - Toast "Şube onay bekliyor"
  - Listede sarı "Onay Bekliyor" badge'i
- Aksi halde direkt `Active`

**Edge Case'ler:**
- 409 duplicate → "Bu sezonda 9-A zaten var"
- 403 archived session → modal açılmaz (button disabled)

---

#### 6. Onay Bekleyen Şubeler

Listede yatay banner: "X şube onayınızı bekliyor" → filtreli liste

**Permission:** `class-rooms.approve`

**Aksiyon:** Şube kartında "Onayla" butonu → `POST /api/v1/class-rooms/{id}/approve` → toast "Şube onaylandı, aktif" → cache invalidate.

---

#### 7. Öğrenci Şube Değiştirme (`TransferStudentModal`)

**Permission:** `class-rooms.transfer-student`

**Form:**
- Hedef şube (Select, sadece aynı sezon, kapasite uygun şubeler)
- Notlar (text, opsiyonel — neden taşındı)

**Bilgi banner'ı:**
"Bu işlem öğrencinin mevcut şubedeki geçmiş verilerini (notlar, devamsızlık) korur. Yeni şubede yeni kayıtlar başlar."

**Submit:** `POST .../transfer` → toast "Öğrenci taşındı".

---

### Web Kullanıcı Akışı

```
[Sezon Listesi]
       │
       ├── Aktif sezon yok ──→ EmptyState ──→ "Yeni Sezon Başlat" ──→ [Form] ──→ POST ──→ [Detay (Setup)]
       │                                                                                       │
       └── Aktif sezon var ──→ [Detay] (sezon kartına tıkla)                                  │
                                  │                                                            │
                                  ├── Sekme: Genel Bakış ──→ "Sezonu Yayınla" (Setup ise) ──→ [Confirm Modal] ──→ POST activate
                                  │                                                                                       │
                                  │                                                                            ┌──────────┴── eski varsa
                                  │                                                                            │  Arşivlendi banner
                                  │                                                                            └──→ Aktif sezon
                                  │
                                  ├── Sekme: Şubeler ──→ "Yeni Şube" ──→ [Modal] ──→ POST
                                  │                                                    │
                                  │                                          ┌─────────┴── approval gerekli?
                                  │                                          │  Yes: PendingApproval
                                  │                                          │  No:  Active direkt
                                  │
                                  │                  ──→ Şube tıkla ──→ [Şube Detay] ──→ "Öğrenci Ekle" / "Taşı" / "Çıkar"
                                  │
                                  └── Sekme: Tatiller ──→ "Yeni Tatil" ──→ [Modal]
```

---

## Sezon Listesi (landing) — Web (2026-06-09)

> `/admin/academic-sessions` artık doğrudan sihirbazı değil bu landing ekranını açar. Sihirbaz `…/new` alt-route'una taşındı.

### Route Ayrımı

| Route | Component | Amaç |
|---|---|---|
| `/admin/academic-sessions` (index) | `SeasonListPage` | Landing — aktif/taslak/arşiv listesi |
| `/admin/academic-sessions/new` | `SeasonWizardPage` | 6 adımlı sezon rollover sihirbazı (değişmedi) |

### Sayfa Lokasyonu

```
academic-sessions/
├── pages/
│   ├── SeasonListPage.tsx          (yeni — landing)
│   └── SeasonWizardPage.tsx        (taşındı → /new)
├── components/list/
│   ├── ActiveSeasonHero.tsx        (aktif sezon hero kartı)
│   ├── DraftSeasonCard.tsx         (taslak kartı)
│   ├── ArchiveSeasonGrid.tsx       (arşiv ızgarası)
│   ├── DiscardDraftDialog.tsx      (taslak çakışma modalı)
│   └── DeleteDraftDialog.tsx       (taslak silme modalı)
└── hooks/
    └── useSeasonListData.ts        (aktif/taslak/arşiv türetme hook'u)
```

### Ekran Bölümleri

#### A — Aktif Sezon (`ActiveSeasonHero`)

- Brand-gradient sol panel: sezon adı, tarih aralığı, "Aktif Sezon" badge'i (yeşil pulse dot).
- Sağ panel: 3 stat kartı (Aktif dönem / Aktif öğrenci sayısı / Dönem bitişine kalan gün).
  - **Geri sayım stat'ı negatife düşerse** (bitiş tarihi geçmiş): eksi gösterilmez; "`{n} gün önce`" değeri + "Sezon bitti" etiketiyle gösterilir (`list.stat-days-ago` + `list.term-flow.ended`).
- Dönem ilerleme bar'ı (`computeTermProgress` — 0–100%).
- "Akademik Takvime Git" butonu → `/admin/academic-calendar`.
- **Boş durum:** Aktif sezon yoksa dashed kart + bilgi metni.

#### B — Taslak Sezonlar (`DraftSeasonCard`)

- Taslak varsa: ad + "Taslak" badge + adım ilerleme metni + mini ilerleme bar; "Taslağa Devam Et" + "Sil" butonları.
- Taslak yokken: dashed boş durum + açıklama metni.
- **"Sil" butonu** → `DeleteDraftDialog` açılır.

#### C — Arşiv Sezonlar (`ArchiveSeasonGrid`)

- Responsive auto-fill grid; her kart: sezon adı + "Arşiv" badge + tarih aralığı + öğrenci/mezun sayıları + "Salt-okunur" etiketi + "Görüntüle" butonu.
- Boş durum: tek satır mesaj.

### "Yeni Sezon Aç" Davranışı

```
Kullanıcı "Yeni Sezon Aç"a tıklar
       │
       ├── Taslak VAR → DiscardDraftDialog açılır (3 aksiyon):
       │       ├── Vazgeç          → modal kapanır, sayfa kalır
       │       ├── Taslağa Devam Et → modal kapanır, navigate('new') (mevcut taslaktan devam)
       │       └── Sil ve Yeni Aç  → DELETE /season-drafts/current → navigate('new')
       │
       └── Taslak YOK → doğrudan navigate('new')
```

### Taslak "Sil" Akışı

```
"Sil" butonuna tıkla → DeleteDraftDialog açılır (2 aksiyon):
       ├── Vazgeç    → modal kapanır
       └── Taslağı Sil → DELETE /season-drafts/current → modal kapanır, sayfa güncellenir
```

### Sihirbaz Geri Dönüşü

Sihirbaz header "geri" butonu → `/admin/academic-sessions` (landing).  
Sihirbaz "Başarı" ekranı "Bitti" → `/admin/academic-sessions` (landing).

---

## Akademik Takvim (Ekran 1) — Web (2026-06-09, mock servis)

> Design handoff "Akademik Takvim & Sezon Yönetimi" Ekran 1'in uygulaması. **Tamamen
> mock servisle** çalışır; gerçek backend bekliyor (bkz. `completion_status.md`).

### Sayfa Lokasyonu

Frontend: `oksis-web/src/portals/admin/academic-calendar/`

```
academic-calendar/
├── pages/AcademicCalendarPage.tsx          (kompozisyon kökü)
├── components/  SeasonAxisBar · CalendarKpiRow · MonthCalendar
│               · TermStructurePanel · UpcomingEventsPanel · EventTypeLegend · AddEventModal
├── api/         calendarApi.ts (VITE_USE_MOCK seçici) · calendarApi.mock.ts (oturum-içi bellek)
│               · calendarApi.real.ts (httpClient stub) · calendarMockData.ts (seed)
├── hooks/       useCalendarSeasonsQuery · useCalendarEventsQuery · useAddEventMutation
├── schemas/calendarEventSchema.ts (Zod) · lib/eventTypes.ts (renk/soft/i18n meta)
├── keys/calendarKeys.ts (tenant-scoped) · types/index.ts
```

### Ekran — `/admin/academic-calendar`

**Portal:** admin · **Permission:** `season.list.read` · **Sol menü:** *Genel → Akademik Takvim* (ikon `CalendarDays`)
**i18n namespace:** `academic-calendar` (tr/en).

**Yapı (üstten alta):**
1. **Page head** — breadcrumb (`Genel › Akademik Takvim`), başlık + alt metin (+ seçili sezon adı); sağda **Dışa Aktar** (şimdilik disabled) + **Etkinlik Ekle** (arşiv sezonunda disabled).
2. **Sezon ekseni** (`SeasonAxisBar`) — Arşiv / Aktif (seçili ring) / Planlama kartları + gradyan "Sezon Yönetimi" butonu. Rozet: aktif=Aktif, arşiv=Arşiv, planlama= taslak varsa "Taslak" yoksa "Planlanmamış" (`seasonDraftApi.get()`).
3. **KPI şeridi** (`CalendarKpiRow`) — 4 kart (Aktif Dönem / Dönem Bitişine / Bu Ay Etkinlik / Sezon Etkinliği). *Mock fazda* `termEndsInDays`/`seasonEvents` placeholder.
4. **Gövde** — sol: `MonthCalendar` (Pzt-başı ızgara, çok-günlü bant, hücre başına max 3 pill + "+N daha", bugün vurgusu); sağ: `TermStructurePanel` + `UpcomingEventsPanel` + `EventTypeLegend`.

**State (sayfa lokal):** `selectedSeasonId` (gezinme — topbar global sezonu **etkilemez**), `view {year,month}`, `modalDate`. Türetilen: `readonly = (sezon.status==='archive')`, `activeView = view ?? sezon.endDate ayı`.

**Davranışlar:**
- **Sezon kartı seç** → takvim o sezona döner (ay sezon bitişine resetlenir). **Planlama kartı / gradyan buton** → `navigate('/admin/academic-sessions')` (mevcut Sezon Rollover sihirbazı; taslak varsa kaldığı adımdan devam).
- **Ay navigasyonu** (‹ › / Bugün), hücre "+" veya header butonu → **Etkinlik Ekle modalı** (`AddEventModal`, RHF+Zod). Kaydet → mock store'a eklenir (oturum-içi), takvim eklenen etkinliğin ayına atlar, query invalidate + toast.
- **Arşiv sezonu** → salt-okunur ("Arşiv · salt-okunur" şeridi, ekleme kapalı), Yaklaşan paneli "Sezon Etkinlikleri" + göreli zaman yerine "Geçti", tüm dönemler "Tamamlandı".

**Mock kontrat (gelecekteki gerçek backend):** `GET /academic-sessions` (sezon ekseni, status eşlemesi Setup→planning/Active→active/Archived→archive), `GET /academic-sessions/{id}/events?year=&month=`, `GET /academic-sessions/{id}/terms`, `POST /academic-sessions/{id}/events`.

### Akademik Takvim — Rol Bazlı Görünürlük (2026-06-09)

- Ekran 4 portalde de görünür (süperadmin hariç): `/admin`, `/teacher`, `/parent`, `/student` → `…/academic-calendar`.
- Tek bileşen (`oksis-web/src/modules/academic-calendar`) tüm portallerde render edilir (eskiden `portals/admin/` altındaydı, ortaklaştırma kapsamında taşındı).
- `academic-calendar.manage` izni olan (Admin/Müdür; ⚙️ Müd. Yrd.): tam yetki — etkinlik ekle, dışa aktar, sezon ekseni (arşiv/aktif/planlama), Sezon Yönetimi yolları.
- İzni olmayan (Öğretmen/Öğrenci/Veli): salt-okunur; sezon ekseni gizli, yalnız aktif sezon; alt başlık "Eğitim-öğretim yılı etkinlikleri".

### Üst Bar Bağlam Seçici — Rol Bazlı Modlar (`SeasonTermSwitcher`) (2026-06-22)

Topbar sezon·dönem seçicisi (`oksis-web/src/app/components/shell/SeasonTermSwitcher.tsx`) `portalKey`'den (`config.key`) **mod** türetir. Her rol zamanda farklı yerde yaşar (handoff `sezon_baglam` analizi); seçici buna göre farklılaşır:

| portalKey | mode | Davranış |
|---|---|---|
| `admin` | `full` | Yıl (Aktif + Arşiv) + dönem menüsü; seçim `useSeasonStore`'a yazılır. **Değişmedi.** |
| `student` | `now` | "Şimdi"ye **kilitli** rozet (`lock` ikonu, `Şimdi · {dönem}`, chevron yok, "kilitli" mini etiket). Tıklayınca seçim menüsü değil, bilgi notu (`.tb-season-lock`): bağlam değiştirme yok, sistem her zaman aktif yıl + güncel dönem gösterir. `setTerm`/`setSeason` çağrılmaz. |
| `teacher` | `teacher` | **Salt-okunur** rozet (`{sezon adı} · {dönem}`, kilit görünümü, "kilitli" etiket). Tıklayınca bilgi notu: "Yıl aktife kilitli. Dönem seçimi not girişi ve karne ekranlarında açılır." `setTerm`/`setSeason` çağrılmaz. |
| `parent` + diğer | `default` | Mevcut dönem-only menü (dönemi tüm roller seçer; yıl yalnız admin). C1'de dokunulmadı; veli mode'u (çocuk seçici) C2'de gelecek. |

- Boş/yükleniyor durumları (`SeasonPill` paritesi) tüm modlarda korunur: aktif sezon yoksa admin'e "Başlat" butonu, diğerlerine bilgi.
- **DEBT (öğretmen):** Handoff'ta öğretmen dönem *seçebiliyor* (yalnız not & karne için). Marks/ReportCard ekranları henüz olmadığından dönem seçimi kasıtlı ertelendi; öğretmene şimdilik salt-okunur rozet gösterilir. Ekranlar gelince `mode === 'teacher'` dalı tam dönem menüsüne genişletilecek.
- i18n: `auth.shell.*` (`locked`, `now-locked-trigger`, `now-locked-title/body`, `teacher-locked-title/body`) — tr + en. Stil: `shell.css` `.tb-season-btn.locked`, `.tbs-locked-tag`, `.tb-season-lock`, `.tbs-lock-ic/.tbs-lock-tx`.

---

## Mobile Flow

### Sayfa Lokasyonu

Mobile: `oksis-mobile/src/features/academic-sessions/`

### Karar: Mobile salt-okunur

Mobile uygulamada **idare paneli minimaldir**. Bu modül için mobile:
- ✅ Aktif sezon/dönem bilgisini gösterme (her ekran üstünde session badge)
  - Sezonun bitiş tarihi geçmiş ama hâlâ aktif işaretliyse, üst bardaki `SeasonPill` kehribar uyarı tonuna döner ve metne "· Bitti" eki gelir (`season-pill--ended` + `shell.ended-suffix`).
- ✅ Şube listesi (rehber öğretmen kendi şubesinin öğrenci listesini görür — Sprint 2)
- ❌ Sezon oluşturma / yayınlama (web-only)
- ❌ Şube CRUD (web-only)
- ❌ Öğrenci atama / taşıma (web-only)

**Gerekçe:** Mobile cihazda çok adımlı veri girişi sürtünmeli. İdare bilgisayardan sezon kurar, mobilde sadece referans bilgisi okur.

### Ekranlar

#### Aktif Sezon Banner (her admin ekranının üstünde)

**Component:** `SessionContextBanner.tsx`
**State:** `useCurrentSessionQuery` (cached, tenant prefix key)

Görsel:
```
┌──────────────────────────────────────────┐
│  2025-2026 · 1. Dönem aktif              │
└──────────────────────────────────────────┘
```

Tıklanırsa session detay bottom-sheet açılır (salt-okunur).

**Mobil-Spesifik Notlar:**
- Çok küçük (yüksekliği 36px). SafeAreaView altında değil, header'a entegre.
- Offline cache: TanStack Query persistance ile 24 saat geçerli.

---

## i18n Key'leri

| Key | TR |
|---|---|
| `academic-sessions.title` | Akademik Sezonlar |
| `academic-sessions.empty.title` | Henüz akademik sezon yok |
| `academic-sessions.empty.description` | İlk sezonunuzu oluşturmak için "Yeni Sezon Başlat"a tıklayın |
| `academic-sessions.actions.create` | Yeni Sezon Başlat |
| `academic-sessions.actions.activate` | Sezonu Yayınla |
| `academic-sessions.actions.archive` | Manuel Arşivle |
| `academic-sessions.errors.name-format` | Sezon adı 2025-2026 formatında olmalı |
| `academic-sessions.errors.dates-invalid` | Tarihler tutarsız |
| `academic-sessions.status.setup` | Taslak |
| `academic-sessions.status.active` | Aktif |
| `academic-sessions.status.archived` | Arşivlenmiş |
| `academic-sessions.terms.t1` | 1. Dönem |
| `academic-sessions.terms.t2` | 2. Dönem |
| `academic-sessions.term-actions.activate` | Dönemi Aktive Et |
| `academic-sessions.term-actions.close` | Dönemi Kapat |
| `academic-sessions.term-close.confirm` | Bu işlem geri alınamaz. Notlar kilitlenir ve karneler üretilir. |
| `class-rooms.title` | Şubeler |
| `class-rooms.actions.create` | Yeni Şube |
| `class-rooms.actions.assign-student` | Öğrenci Ekle |
| `class-rooms.actions.transfer` | Şube Değiştir |
| `class-rooms.status.pending-approval` | Onay Bekliyor |
| `class-rooms.status.active` | Aktif |
| `class-rooms.archive-blocked` | Önce {{count}} öğrenciyi başka şubeye taşıyın |
| `class-rooms.transfer.info` | Bu işlem öğrencinin mevcut şubedeki geçmiş verilerini korur |
| `school-holidays.title` | Tatiller |
| `school-holidays.official-badge` | Resmi Tatil |

---

## Yasaklar

- ❌ Spinner (Skeleton kullan).
- ❌ Hardcoded Türkçe string (i18n key zorunlu).
- ❌ Form'da Zod olmadan validation.
- ❌ Mobile'da CRUD ekranları (yukarıda karar).
- ❌ "Sezonu Yayınla" butonunu çift onay diyaloğu olmadan tetiklemek (geri alınamaz operasyon).
- ❌ "Dönemi Kapat" butonunu çift onay + acknowledgment checkbox olmadan tetiklemek.
- ❌ Arşivlenmiş sezona ait form alanlarını editable bırakmak (UI'da disable, backend zaten reddeder).

> Detay: `frontend/component-rules.md`, `frontend/form-validation-rules.md`.