# Sınıf / Şube — UI Flows

> Bu modülün frontend ekranları, kullanıcı akışları, state management.

> Genel UI/UX kuralları için bkz. `frontend/ui-ux-rules.md` ve `frontend/component-rules.md`.
> Tasarım kaynağı: Claude Design handoff `design_handoff_classes_screen` (classes_v2)
> + ihtiyaç analizi dokümanı (Sınıflar & Şubeler Modülü, v1.0 — 10 Haziran 2026).

---

## Ekranlar

### Sınıflar & Şubeler Dashboard — `/admin/classrooms`

**Portal:** admin
**Permission:** `class-rooms.view` (route gate `RequirePermission`)
**Component:** `ClassroomsPage`
**Konum:** `oksis-web/src/portals/admin/classrooms/ClassroomsPage.tsx`

Üç katmanlı master–detail dashboard (handoff §6 — "CRUD ekranı değil, sezon geçiş motoru"):

1. **Üst bağlam barı** — breadcrumb + başlık, sezon seçici (`SeasonSwitcher`),
   özet sayaçlar (toplam şube / öğrenci / ort. doluluk), "Şube Ekle" split
   (`AddSplitButton`: tekil B1-B2 / toplu) ve "Sihirbazı Başlat"
   (→ `/admin/academic-sessions`).
2. **Master (sol)** — arama + Dışa Aktar toolbar'ı; Kademe → Seviye → Şube ağacı
   (`KademeSection` → `GradeRow` → `SectionTile`). Şube kartı: gradient rozet,
   rehber satırı (rehbersiz = amber uyarı), doluluk barı (`OccupancyBar`,
   >%100 çizgili taşma) + K/E etiketi. Her seviye sonunda kesikli "Şube ekle" kartı.
3. **Detay (sağ, 392px)** — `DetailPanel`: gradient başlık + Mevcut/Kapasite/Doluluk
   istatistikleri, Şube Bilgileri (ad / kapasite / durum), rehber öğretmen,
   cinsiyet dağılımı, öğrenci listesi + dağıtım bekleyen havuz + taşı, sticky
   footer (Derslik + Rehber Ata).

**State:**
- Server: React Query — `useSeasonsQuery`, `useSectionsQuery(seasonId)`,
  `useGradeLevelsQuery`, `useTeachersQuery`, `useStudentPoolQuery` (hepsi
  `classroomKeys` ile tenant-scope'lu).
- Local: `seasonId`, `selId` (seçili şube), `query` (arama), `modal`
  (discriminated union `ModalState`).

**Arşiv sezon (salt-okunur) modu:** sezon seçiciden arşiv sezon seçilince tüm
ekran kilitlenir — Şube Ekle ve seviye "Şube ekle" kartları gizlenir/devre dışı,
detay inputları `disabled`, master + detay amber banner gösterir, kartlar soluk,
detay footer'ı tek "Salt-okunur görünüm" butonuna iner (FR-08, bulgu #3).

**Kapasite soft limittir:** aşımda bar çizgili taşma + uyarı metni; hiçbir akışta
engelleme yok (FR / bulgu #6).

**Modallar** (paylaşılan `shared/components/modal/Modal` shell):
- `NewSectionModal` — tekil şube (B1/B2): seviye + harf (dolu işaretli, sıradaki
  önerilir) + kapasite + opsiyonel derslik (DEBT) + rehber.
- `BulkSectionModal` — toplu açma (bulgu #1): otomatik harf (kullanılanı atlar)
  veya serbest ad (virgüllü), canlı önizleme chip'leri. Create ucunun ardışık çağrısı.
- `AssignHomeroomModal` — öğretmen arama + seçim; çoklu şube rehberliği soft uyarı.
- `AssignClassroomModal` — derslik atama (**DEBT** — rooms Sprint 2, mock katalog).
- `AssignStudentModal` — bekleyen havuzdan (classroomId=null) şubeye atama.
- `MoveStudentModal` — kaynak sabit, hedef doluluk bilgili liste; dolu hedef soft uyarı.
- `ExportSectionsModal` — xlsx/csv/pdf + kapsam (**DEBT** — uç yok).

**Veri eşlemesi / DEBT işaretleri:** gerçek uçlar `api/classroomsApi.ts`'te;
backend karşılığı olmayanlar `api/classroomsDebtApi.ts`'te `attemptRealThenMock`
ile (UI'da `DebtBadge` "D"): şube adı düzenleme, Aktif→Taslak durum geçişi,
cinsiyet dağılımı, derslik, dışa aktarma. Ayrıntı: `completion_status.md`.

**Edge Case'ler:**
- Aktif sezon yok → `NO_ACTIVE_SESSION` banner'ı (Sezon Yönetimi'ne yönlendirme metni).
- Arama sonuçsuz → arama ikonlu boş durum ("Sonuç bulunamadı").
- Sezonun hiç şubesi yok → "Şube Ekle ile başlayın" boş durumu.
- Yükleme → skeleton kartlar (`clx-skeleton`, spinner yok).
- ≤1080px → detay paneli master'ın altına iner.

**Stil:** `classrooms.css` — handoff `classes_v2.css` + `classes.css`
(occ/gender imza sistemi) portu; tüm kurallar `.clx` altında scope'lu, handoff
token adları alias bloğu ile `theme.css` token'larına eşlenir.

---

## Kullanıcı Akışı

```
[Dashboard] ── sezon seç (arşiv → tüm ekran salt-okunur)
     │
     ├─ "Şube Ekle ▾" ─ Tekil şube → [NewSectionModal] → create → liste yenile
     │                └ Toplu aç   → [BulkSectionModal] → N × create → liste yenile
     │
     ├─ kart tıkla → [DetailPanel]
     │       ├─ ad/kapasite/durum düzenle (ad+durum DEBT, kapasite gerçek)
     │       ├─ "Rehber Ata" → [AssignHomeroomModal] → PUT homeroom
     │       ├─ "Öğrenci Ata"/"Dağıt" → [AssignStudentModal] → POST students
     │       ├─ satırda ↗ → [MoveStudentModal] → POST transfer (geçmiş korunur)
     │       └─ "Derslik" → [AssignClassroomModal] (DEBT)
     │
     └─ "Sihirbazı Başlat" → /admin/academic-sessions (Sezon Yönetimi)
```

---

## Mobil Notları

- Ekran admin-only (mobil kapsam dışı — mobil portallar Teacher/Parent/Student).

---

## i18n Key'leri

Namespace: `classrooms` (`shared/i18n/locales/{tr,en}/classrooms.json`).
Tüm ekran ve modal kopyaları bu namespace'tedir; tr kaynağı handoff'taki birebir
üretim kopyasıdır (`classrooms.title` = "Sınıflar & Şubeler" vb.).

---

## Yasaklar

- ❌ Spinner (Skeleton kullan).
- ❌ Hardcoded Türkçe string (i18n key zorunlu).
- ❌ Form'da Zod olmadan validation.
- ❌ `getByTestId` testlerde (Role + Text bazlı sorgular).

> Detay: `frontend/component-rules.md`, `frontend/form-validation-rules.md`.
