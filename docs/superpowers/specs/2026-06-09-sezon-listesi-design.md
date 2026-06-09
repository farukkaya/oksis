# Sezon Listesi (Season List) — Tasarım Dokümanı

> **Tarih:** 2026-06-09 · **Modül:** academic-sessions (web) / AcademicSessions (api)
> **Rol:** School_Admin · **Faz:** Sezon Yönetimi — landing ekranı
> **Kaynak handoff:** `Oksis Layout Sezon Listesi.zip` → `design_handoff_oksis_sezon_yonetimi/`
> **İlgili spec:** `.claude/specs/oksis-admin-ekranlari-mimari-spec.md` (§1.2 sezon modeli)

---

## 1. Problem

Menüde **Sezon Yönetimi**'ne tıklanınca şu an doğrudan 6 adımlı sihirbaz açılıyor
(`/admin/academic-sessions` index → `SeasonWizardPage`). Bu yanlış: önce mevcut **aktif
sezon**, varsa **taslak**, ve **arşiv sezonlar** bir liste ekranında gösterilmeli; yeni sezon
açma yalnızca açık bir **"Yeni Sezon Aç"** aksiyonuyla sihirbaza yönlendirmeli.

Handoff, bu landing ekranını (Sezon Listesi) ve liste→sihirbaz geçişini pixel düzeyinde
tanımlar. Sihirbazın kendisi (6 adım, draft persistence, rollover) **zaten mevcut ve
değişmiyor**.

## 2. Kapsam

**Dahil:**
- Yeni **Sezon Listesi** landing ekranı (Aktif hero + Taslak kartı/boş durum + Arşiv grid).
- Liste ↔ sihirbaz **ayrı route** ayrımı.
- İki modal: taslak-çakışma (3 aksiyon) + taslak-silme (2 aksiyon).
- Backend: liste ekranının ihtiyacı olan **sayım alanları** (aktif öğrenci, arşiv öğrenci/mezun).

**Dahil değil (YAGNI):**
- Sihirbazın 6 adımı, `SeasonDraft` persistence, rollover-preview, promote-students,
  copy-assignments — hepsi mevcut, dokunulmaz.
- Eski kullanılmayan `src/app/pages/admin/SeasonManagement.tsx` (151KB, route'a bağlı değil)
  — ayrı temizlik konusu, bu işin parçası değil.

## 3. Mevcut durum (envanter)

| Yapı | Durum |
|---|---|
| 6 adımlı `SeasonWizardPage` | ✅ Var (`pages/SeasonWizardPage.tsx`) |
| `SeasonDraft` backend (GET/PUT/DELETE `/season-drafts/current`) | ✅ Var (`SeasonDraftsController`) |
| `rollover-preview`, `open-from-draft`, `promote-students`, `copy-assignments` | ✅ Var |
| `useAcademicSessionsQuery` / `useCurrentSessionQuery` / `useSeasonDraftQuery` | ✅ Var |
| **Sezon Listesi landing ekranı** | ❌ Yok — bu iş |
| **Liste/sihirbaz route ayrımı** | ❌ Yok (index doğrudan sihirbaz) |
| **Aktif öğrenci / arşiv öğrenci+mezun sayıları (DTO)** | ❌ Yok — backend dilimi |

## 4. Mimari kararlar

- **Geçiş yapısı:** Ayrı React Router route'ları (handoff'taki internal `view` state yerine) —
  OKSİS-web URL-state konvansiyonu; paylaşılabilir URL, çalışan geri tuşu.
- **Veri boşluğu:** Backend DTO'ları önce genişletilir (mock değil). İlerleme % ve kalan gün
  frontend'de dönem tarihinden türetilir.

## 5. Frontend tasarım

### 5.1 Dosya yerleşimi
```
src/portals/admin/academic-sessions/
  pages/
    SeasonListPage.tsx          ← YENİ landing (index route)
    SeasonWizardPage.tsx        ← mevcut → /new route
  components/list/              ← YENİ
    ActiveSeasonHero.tsx        ← brand-gradient hero kart (bölüm A)
    DraftSeasonCard.tsx         ← taslak kartı / boş durum (bölüm B)
    ArchiveSeasonGrid.tsx       ← arşiv grid (bölüm C) + ArchiveSeasonCard
    DiscardDraftDialog.tsx      ← 3-aksiyonlu taslak-çakışma modalı
    DeleteDraftDialog.tsx       ← 2-aksiyonlu taslak-silme modalı
  hooks/
    useSeasonListData.ts        ← YENİ: aktif+draft+arşiv derleme + türetme (%, kalan gün)
```

### 5.2 Route değişikliği (`src/app/routes.tsx`)
```
path: "academic-sessions"
  children: [
    { index: true,  Component: SeasonListPage },   // landing
    { path: "new",  Component: SeasonWizardPage },  // sihirbaz
  ]
```
- "Yeni Sezon Aç" / "Taslağa Devam Et" → `navigate('new')`.
- Sihirbazdaki "← Sezon Listesi" / başarı "Sezon Listesine Dön" → `navigate('/admin/academic-sessions')`.

### 5.3 Ekran düzeni (yukarıdan aşağı)
- **Sayfa başlığı:** breadcrumb `Yönetim › Sezon Yönetimi`, `<h1>Sezon Yönetimi</h1>`, alt başlık.
  Sağ aksiyonlar: `Akademik Takvim` (ghost) + `Yeni Sezon Aç` (primary, `plus` ikonu).
- **A. Aktif Sezon (1)** — `ActiveSeasonHero`: 2-kolon grid (270px / 1fr).
  - Sol panel: brand-gradient zemin, beyaz metin — "Aktif Sezon" pill (glow dot), yıl 32px/800,
    tarih aralığı.
  - Sağ panel: 3 stat tile (aktif dönem · aktif öğrenci · dönem bitişine kalan gün), ilerleme
    bloğu (gradient bar, %), "Akademik Takvime Git" ghost buton.
- **B. Taslak Sezonlar (0/1)** — `DraftSeasonCard`:
  - **Taslak varsa:** info-tint kart, `pencil` ikon tile, taslak adı + "Taslak" badge,
    "Adım n/6 · {adım etiketi} · kaynak {sezon}", ince ilerleme bar (`(step+1)/6`), aksiyonlar:
    ghost "Sil" (hover'da danger) + primary "Taslağa Devam Et" (`play`).
  - **Taslak yoksa:** dashed-border boş durum + açıklama.
- **C. Arşiv Sezonlar (n)** — `ArchiveSeasonGrid`: responsive grid (`minmax(248px,1fr)`) `ArchiveSeasonCard`:
  - yıl + "Arşiv" badge; tarih aralığı (`calendar`); "{studentCount} öğrenci / {graduateCount} mezun"
    (`graduation-cap`, `award`); footer: "Salt-okunur" lock + "Görüntüle →" link.

### 5.4 Veri kaynakları (hepsi mevcut hook)
- Aktif hero → `useCurrentSessionQuery` (+ yeni `activeStudentCount`).
- Taslak → `useSeasonDraftQuery`.
- Arşiv → `useAcademicSessionsQuery`, `status === 'Archived'` filtresi (+ yeni `studentCount`/`graduateCount`).
- `useSeasonListData` bunları derler ve türetilen değerleri hesaplar.

### 5.5 Türetilen değerler (backend gerekmez)
- Dönem ilerleme % = `clamp((bugün − term.start) / (term.end − term.start), 0..1)`.
- Kalan gün = `dayjs(term.endDate).diff(today,'day')`; aktif dönem yoksa sezon bitişine geri düş
  (mevcut `SeasonWizardPage`'deki `daysUntil` mantığı buraya taşınır).

## 6. Modal davranışı (çekirdek gereksinim)

**"Yeni Sezon Aç" tıklanınca:**
- **Taslak varsa** → `DiscardDraftDialog` (ikon `alert-triangle`, tone `warning`). Gövde: seçimlerin
  **kalıcı silineceği** uyarısı + mini taslak kartı (ad + "Adım n/6" + %). 3 aksiyon:
  - **Vazgeç** (ghost) → kapat.
  - **Taslağa Devam Et** (ghost, `play`) → `navigate('new')` (taslak yüklenir).
  - **Sil ve Yeni Aç** (danger, `trash-2`) → `deleteDraft` → `navigate('new')` (temiz başlar).
- **Taslak yoksa** → doğrudan `navigate('new')`, modal yok.

**Taslak kartı "Sil"** → `DeleteDraftDialog` (ikon `trash-2`, tone `danger`). "Geri alınamaz, aktif
sezon etkilenmez" uyarısı. Vazgeç (ghost) + Taslağı Sil (danger) → `deleteDraft` → boş duruma döner.

**Altyapı:** shadcn `Dialog` (Radix) — `Esc` ve scrim tıklama kapatır. `iconTone` → semantik renkli
ikon tile.

## 7. Tasarım token'ları / i18n

- Renkler `brand.css` token'larıyla birebir (navy `#1B2B5E`, brand-gradient, `--info/--success/
  --warning/--danger` + `-bg` çiftleri) — hardcode hex yerine mevcut Tailwind token'ları; eksik
  brand-gradient utility bir kez tanımlanır. Hiçbir renk/ikon/uyarı metni handoff'tan sapmaz.
- İkonlar lucide (`plus`, `pencil`, `play`, `trash-2`, `calendar`, `graduation-cap`, `award`,
  `alert-triangle`, `lock`, `arrow-right`, `archive`).
- Tüm metinler `academic-sessions.json` (tr/en) → yeni `list.*` ve `dialogs.*` anahtarları. Hardcode
  Türkçe yok.

## 8. Backend dilimi (oksis-api)

Mevcut `AcademicSessions` modülüne sayım alanları (yeni endpoint yok):
- **`CurrentSessionDto`** `+ int activeStudentCount` — aktif sezonda `LeftAt == null` distinct
  `ClassRoomStudent` sayısı.
- **`AcademicSessionDto`** (list) `+ int studentCount, + int graduateCount` — sezona bağlı toplam
  enrollment + `AssignmentReason.Graduation` sayısı.

Sayımlar handler'da `IApplicationDbContext` üzerinden `GroupBy`/`CountAsync`; global query filter
`SchoolId` izolasyonunu sağlar. Frontend `types/index.ts` bu alanlarla güncellenir.

## 9. Test stratejisi (TDD)

- **Backend (Application.UnitTests):** `activeStudentCount` / `graduateCount` doğru sayım +
  tenant izolasyonu (başka okulun öğrencisi sayılmaz).
- **Frontend (vitest):**
  - `useSeasonListData` türetme: %, kalan gün, biten/negatif dönem geri-düşüş.
  - `SeasonListPage`: taslak var/yok dallanması, boş durum.
  - `DiscardDraftDialog`: 3 aksiyon doğru çağrılar (continue→navigate, delete→deleteDraft+navigate).
  - `DeleteDraftDialog`: confirm → `deleteDraft`.
  - Route ayrımı: index→list, `/new`→wizard.

## 10. Dokümantasyon güncellemeleri

- `academic-years/ui-flows.md` — liste→sihirbaz akışı.
- `academic-years/api-contracts.md` — yeni DTO alanları.
- `academic-years/completion_status.md` — ilerleme + tarih.

## 11. Açık sorular

Yok — handoff ve mevcut backend boşlukları kararlaştırıldı.
