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
  önerilir) + kapasite + opsiyonel derslik + rehber.
- `BulkSectionModal` — toplu açma (bulgu #1): otomatik harf (kullanılanı atlar)
  veya serbest ad (virgüllü), canlı önizleme chip'leri. Create ucunun ardışık çağrısı.
- `AssignHomeroomModal` — öğretmen arama + seçim; çoklu şube rehberliği soft uyarı.
- `AssignClassroomModal` — derslik atama (rooms-first dilimi, gerçek uç: GET /rooms + PUT /class-rooms/{id}/room).
- `AssignStudentModal` — bekleyen havuzdan (classroomId=null) şubeye atama.
- `MoveStudentModal` — kaynak sabit, hedef doluluk bilgili liste; dolu hedef soft uyarı.
- `ExportSectionsModal` — xlsx/csv indirme (gerçek uç: GET /class-rooms/export).
  PDF + kapsam segmenti bilinçli kapsam dışı (bkz. completion_status sapma kaydı).
- `ArchiveSectionModal` (2026-06-28) — şube arşivleme (soft-delete). Zorunlu sebep
  textarea (≤500, sayaç), "geri alma yok" notu; gerçek uç: POST /class-rooms/{id}/archive.
- `DeleteSectionModal` (2026-06-28) — şube kalıcı silme (hard delete). Sebep YOK;
  "geri alınamaz" uyarısı; gerçek uç: DELETE /class-rooms/{id}.

### Şube Arşivleme akışı (2026-06-28)

**İzin:** `class-rooms.archive` — izin yoksa "Arşivle" butonu hiç render edilmez.
**Giriş noktası:** DetailPanel alt aksiyon barı (`detail-foot`), arşiv sezonda
(salt-okunur) gösterilmez.

Akış:
1. Şube seçili → DetailPanel'de "Arşivle" (destructive) butonu görünür.
2. Aktif öğrencisi olan şubede (`studentCount > 0`) buton **disabled + tooltip**
   ("önce öğrencileri başka bir şubeye taşıyın") — BR-classrooms-archive-active.
3. Tıklayınca `ArchiveSectionModal`: uyarı metni (veri korunur, kalıcı silme değil,
   geri-alma yok), zorunlu sebep textarea (≤500). Sebep boşken "Arşivle" disabled.
4. Onayla → `useArchiveSection.mutateAsync({ id, reason })` → POST .../archive.
   - **Başarı:** `toast.archived`, modal kapanır, liste invalidate olur; seçili şube
     listeden düştüğü için seçim ilk şubeye sıçrar (ClassroomsPage `useEffect`).
   - **409 (`ClassRoom.HasActiveStudents`):** backend'in dinamik Türkçe mesajı toast'lanır
     (sayaç bayatsa güvenli düşüş — hibrit). Generic hata → `toast.archiveError`.

> Geri alma (unarchive) backend ucu yok — kapsam dışı; modal kullanıcıya not gösterir.

### Şube Silme akışı (2026-06-28)

**İzin:** `class-rooms.delete` — izin yoksa "Sil" butonu hiç render edilmez.
**Giriş noktası:** DetailPanel alt aksiyon barı (`detail-foot`), "Arşivle"nin yanında
(danger stil; "Arşivle" ghost stile geçti), arşiv sezonda (salt-okunur) gösterilmez.

Akış:
1. Şube seçili → DetailPanel'de "Sil" (danger) butonu görünür.
2. Aktif öğrencisi olan şubede (`studentCount > 0`) buton **disabled + tooltip**
   ("önce öğrencileri başka bir şubeye taşıyın") — BR-classrooms-delete-active.
3. Tıklayınca `DeleteSectionModal`: kalıcı/geri alınamaz uyarısı (arşivden farkı:
   slot serbest kalır, aynı isim yeniden açılabilir). **Sebep alınmaz.**
4. Onayla → `useDeleteSection.mutateAsync({ id })` → DELETE /class-rooms/{id}.
   - **Başarı:** silindi toast'ı, modal kapanır, liste invalidate olur; seçili şube
     listeden düştüğü için seçim ilk şubeye sıçrar (ClassroomsPage `useEffect`).
   - **409 (`ClassRoom.HasActiveStudents`):** backend'in dinamik Türkçe mesajı
     toast'lanır (sayaç bayatsa güvenli düşüş — hibrit). Generic hata → hata toast'ı.

> Hard delete geri alınamaz — modal bunu açıkça uyarır; arşivlemeden farkı slotu
> serbest bırakmasıdır (aynı isimli şube yeniden açılabilir).

**Veri eşlemesi:** ekranın TÜM aksiyonları `api/classroomsApi.ts` üzerinden
gerçek uçlara bağlıdır (2026-06-10 — DEBT katmanı kaldırıldı, sıfır borç).
Şube adı `PUT {id}/section`, durum `PUT {id}/status` (iki yönlü), cinsiyet
kırılımı DTO `girlsCount/boysCount`, export `GET /class-rooms/export`.
Ayrıntı: `completion_status.md`.

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
     │       ├─ ad/kapasite/durum düzenle (PUT section/status — hepsi gerçek)
     │       ├─ "Rehber Ata" → [AssignHomeroomModal] → PUT homeroom
     │       ├─ "Öğrenci Ata"/"Dağıt" → [AssignStudentModal] → POST students
     │       ├─ satırda ↗ → [MoveStudentModal] → POST transfer (geçmiş korunur)
     │       ├─ "Derslik" → [AssignClassroomModal] → PUT room
     │       ├─ "Arşivle" (izin: class-rooms.archive; öğrencili → disabled)
     │       │      → [ArchiveSectionModal] → POST archive → liste yenile, seçim sıçrar
     │       └─ "Sil" (izin: class-rooms.delete; öğrencili → disabled)
     │              → [DeleteSectionModal] → DELETE {id} → liste yenile, seçim sıçrar
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
