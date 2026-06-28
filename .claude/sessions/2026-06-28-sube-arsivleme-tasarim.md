# Şube Arşivleme — Tasarım Dokümanı

> Tarih: 2026-06-28 · Modül: `classrooms` (Sınıflar & Şubeler) · Portal: admin
> Ekran: `oksis-web/src/portals/admin/classrooms/ClassroomsPage.tsx`
> Durum: TASARIM (kod yazılmadı). Bu doküman uygulama öncesi bağlayıcı plandır.

---

## 1. Amaç & Kapsam

"Sınıflar & Şubeler" ekranında bir şubeyi (ClassRoom / section) **arşivleme**
(soft-delete) yeteneğini frontend'e eklemek. Bugün ekranda şube oluşturma,
yeniden adlandırma, kapasite/durum/rehber/derslik düzenleme ve öğrenci
ata/taşı aksiyonları var; **şube kaldırma yok**. Müdür yanlış açılmış veya
artık kullanılmayacak bir şubeyi listeden çıkarmak istediğinde bir yol yok.

**Karar — arşivle, silme:** Backend'de hard delete **yoktur**. Şube
`ClassRoom.Archive(reason)` ile soft-delete edilir (status → `Archived`).
Dolayısıyla UI etiketi ve davranışı "Arşivle" üzerine kurulur, kalıcı silme
ima edilmez. Veri (geçmiş yoklama/not/atama kayıtları) korunur.

**Kapsam içi:**
- DetailPanel'de "Arşivle" aksiyonu + onay modalı (sebep girişi).
- `useArchiveSection` mutation hook'u + React Query invalidation.
- "Aktif öğrencisi olan şube arşivlenemez" kuralının UX'te ele alınması.
- i18n anahtarları (tr + en) ve 409 hata mesajının kullanıcı-dostu gösterimi.
- İzin kapısı (`class-rooms.archive`).

**Kapsam dışı (bu iş değil):**
- Arşivlenmiş şubeyi geri alma (unarchive / restore) — backend ucu yok; Açık Soru #3.
- Hard delete — backend'de yok, MVP dışı.
- Bulk (toplu) arşivleme — tekil aksiyon yeterli.

---

## 2. Backend Kontratı (HAZIR)

| Özellik | Değer |
|---|---|
| Method + Path | `POST /api/v1/class-rooms/{id:guid}/archive` |
| İzin | `class-rooms.archive` |
| Body | `{ "reason": "string" }` — **zorunlu**, max **500** karakter |
| Başarı | `201 Created` (gövde yok / önemsiz) |
| Bulunamadı | `404 Not Found` |
| Çakışma | `409 Conflict` — aktif öğrenci, veya zaten arşivli |

**Domain kuralı (`ClassRoom.Archive()`):**
- `reason` zorunlu + max 500 karakter (boş/uzun → domain validation hatası).
- Zaten arşivliyse `EnsureNotArchived()` → 409.
- Aktif öğrenci ataması varsa `ClassRoomHasActiveStudentsException`.

**409 — aktif öğrenci hatası:**

| Alan | Değer |
|---|---|
| `code` | `ClassRoom.HasActiveStudents` |
| `message` | `"Şube {ad} arşivlenemez: {N} aktif öğrenci ataması mevcut. Önce öğrencileri başka bir şubeye taşıyın."` (backend Türkçe, hazır) |

> NOT: OKSİS API hata zarfı: `{ data: null, errors: [{ code, message, field }] }`.
> Frontend `errors[0].code` ve `errors[0].message`'a `src/shared/api/apiError.ts`
> üzerinden erişir (`getApiErrorCode`, `getApiErrorMessage`). Bu kuralda
> backend zaten Türkçe okunabilir mesaj döndürdüğü için 409'da **backend mesajını
> doğrudan göstermek** en doğru yaklaşımdır (öğrenci sayısı N dinamik).

**Frontend API adaptörü zaten mevcut:**
`classroomsApi.archive(id, reason)` → `POST /class-rooms/{id}/archive` body `{ reason }`
şeklinde **zaten tanımlı** (`api/classroomsApi.ts:271-274`). Bu katmanda ek iş yok.

---

## 3. UX Akışı

### Giriş noktası
DetailPanel'in **alt aksiyon barı** (`detail-foot`, `DetailPanel.tsx:302-325`).
Bugün burada arşiv-değilken "Derslik" (ghost) + "Rehber Ata" (primary) var.
"Arşivle" buraya **destructive/ghost** stilinde 3. buton olarak eklenir
(veya başlık `dh-x` yanına; öneri: alt bar, daha keşfedilebilir).
Arşiv sezonda (salt-okunur) buton **hiç gösterilmez** (mevcut `archived` koşulu).

### Akış
1. Kullanıcı şubeyi seçer → DetailPanel açılır.
2. `class-rooms.archive` izni varsa "Arşivle" butonu görünür (izin yoksa render edilmez).
3. Tıklayınca **onay modalı** (`ArchiveSectionModal`) açılır:
   - Şube adı + uyarı metni ("Bu şube arşivlenecek, listeden kalkacak; veri korunur").
   - **Sebep alanı** (`textarea`, max 500, sayaç). Backend zorunlu → UX'te de **zorunlu** (boşken buton disabled).
   - Footer: "Vazgeç" (ghost) + "Arşivle" (destructive/primary, sebep boşsa disabled).
4. Onayla → `useArchiveSection.mutateAsync({ id, reason })`.
   - **Başarı:** toast `t("toast.archived")`, modal kapanır, liste invalidate olur, seçili şube listeden düşer (`selId` artık eşleşmez → ClassroomsPage `useEffect` ilk şubeyi seçer).
   - **Hata:** aşağıdaki iki alt-seçenekten birine göre.

### Aktif öğrenci kuralı — iki alt-seçenek

**Seçenek A — Buton disabled + tooltip (proaktif):**
`section.studentCount > 0` ise "Arşivle" butonu disabled, üzerine gelince
tooltip: `t("archiveModal.hasStudentsTooltip")` ("Önce öğrencileri başka bir
şubeye taşıyın"). Kullanıcı hatayı hiç tetiklemez.
- Artı: temiz, hatayı baştan keser; "öğrenci taşı" zihinsel modeline yönlendirir.
- Eksi: `studentCount` (= `activeStudentCount`) frontend'de güncel olmayabilir
  (havuz sorgusu 200 kayıt sınırı). Yine de backend nihai otoritedir.

**Seçenek B — Her zaman tıklanır, 409'da uyarı toast (reaktif):**
Buton hep aktif; backend 409 dönerse `getApiErrorMessage(err, fallback)` ile
backend'in Türkçe mesajı (N öğrenci sayısı dahil) `toast.error` olarak gösterilir.
- Artı: tek doğruluk kaynağı backend; frontend sayaç tutarsızlığına bağımlı değil.
- Eksi: kullanıcı modalı açıp sebep yazıp sonra reddediliyor (sürtünme).

**ÖNERİ — A + B birlikte (hibrit, kademeli savunma):**
- `studentCount > 0` iken butonu **disabled + tooltip** yap (Seçenek A) — UX iyi, sürtünme yok.
- Buna **rağmen** mutation `onError`'da `code === "ClassRoom.HasActiveStudents"`
  ise backend mesajını toast'la (Seçenek B) — sayaç bayatsa / yarış durumunda
  güvenli düşüş. Generic hatada `t("toast.archiveError")`.

> Bu, "permission gate UI = UX, backend = otorite" ilkesiyle birebir uyumlu.

---

## 4. Frontend Değişiklik Listesi

> ÖNEMLİ DÜZELTME: Brief'te "classroomsApi.archive() YOK" deniyor ama uçta
> **zaten var** (`classroomsApi.ts:271-274`). API katmanında değişiklik gerekmez.
> Eksik olan: **hook + UI + i18n**.

### 4.1 `hooks/useClassroomMutations.ts` — `useArchiveSection` ekle
Mevcut pattern birebir (örn. `useTransferStudent`, `useApproveSection`):
```
export function useArchiveSection() {
  const { t } = useTranslation("classrooms");
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (vars: { id: string; reason: string }) =>
      classroomsApi.archive(vars.id, vars.reason),
    onSuccess: () => { toast.success(t("toast.archived")); invalidate(); },
    onError: (err) => {
      // Hibrit: aktif öğrenci 409'unda backend'in dinamik Türkçe mesajını göster.
      if (getApiErrorCode(err) === "ClassRoom.HasActiveStudents") {
        toast.error(getApiErrorMessage(err, t("toast.archiveError")));
        return;
      }
      toast.error(t("toast.archiveError"));
    },
  });
}
```
- Yeni import: `import { getApiErrorCode, getApiErrorMessage } from "../../../../../shared/api/apiError";`
  (yol DetailPanel/modals derinliğine göre `apiError.ts`'e göre ayarlanır).
- **Invalidation:** `useInvalidate()` zaten `classroomKeys.all(schoolId)`
  (= `["classrooms"]` prefix) invalidate eder. Bu prefix **list**, **student-pool**,
  **rooms** alt-key'lerini kapsar → ayrı key gerekmez. (`keys/classroomKeys.ts`,
  `useClassroomMutations.ts:15-22`).

### 4.2 `components/modals/ArchiveSectionModal.tsx` — YENİ dosya
Mevcut modal pattern (`MoveStudentModal.tsx` referans): paylaşımlı `Modal` +
`SuccessBody` (`shared/components/modal/Modal`), `useTranslation("classrooms")`,
`mutateAsync` + `done` state, footer ghost+primary.
- İçerik: uyarı bloğu + `textarea.inp` (sebep, `maxLength={500}`, karakter sayacı), `req` yıldız.
- "Arşivle" butonu: `disabled={!reason.trim() || archive.isPending}`, destructive stil.
- Başarıdan sonra `SuccessBody` veya direkt kapanış + toast (MoveStudentModal'daki
  iki-fazlı `done` ekranı opsiyonel; bu aksiyon için tek toast + kapanış da yeterli).

### 4.3 `components/DetailPanel.tsx` — Arşivle butonu + izin kapısı
- `detail-foot` (`:302-325`) içine, `archived` değilken, 3. buton:
  ```
  {canArchive && (
    <button type="button" className="btn btn-danger"
      disabled={s.studentCount > 0}
      title={s.studentCount > 0 ? t("archiveModal.hasStudentsTooltip") : undefined}
      onClick={() => onAction({ type: "archive", section: s })}>
      <Archive size={16} /> {t("detail.archiveButton")}
    </button>
  )}
  ```
- İzin: `const canArchive = usePermission("class-rooms.archive");`
  (`shared/hooks/usePermission`). İzin yoksa buton hiç render edilmez.
- Lucide `Archive` ikonu import'a eklenir (`DetailPanel.tsx:2-14`).
- `btn-danger` sınıfı yoksa `classrooms.css`'e eklenir (destructive ton).

### 4.4 `types/index.ts` — ModalState'e archive variant
`ModalState` discriminated union'a (`types/index.ts:108-116`):
```
| { type: "archive"; section: SectionVM }
```

### 4.5 `ClassroomsPage.tsx` — modal render dalı
Modal blokları arasına (`:255-305`):
```
{modal?.type === "archive" && (
  <ArchiveSectionModal section={modal.section} onClose={() => setModal(null)} />
)}
```
+ import satırı.

### 4.6 SectionTile.tsx — değişiklik GEREKMEZ
Brief'te listelendi ama aksiyon DetailPanel'de toplanıyor (mevcut tasarım
ilkesi: kart sadece seçim, aksiyonlar sağ panelde). Tile'a buton eklenmez.

---

## 5. i18n Anahtarları

`src/shared/i18n/locales/tr/classrooms.json` (+ `en/classrooms.json` aynı yapı).

### 5.1 `detail.*` (mevcut blok içine)
| Anahtar | TR | EN |
|---|---|---|
| `detail.archiveButton` | "Arşivle" | "Archive" |

### 5.2 `toast.*` (mevcut blok içine)
| Anahtar | TR | EN |
|---|---|---|
| `toast.archived` | "Şube arşivlendi." | "Section archived." |
| `toast.archiveError` | "Şube arşivlenemedi." | "Section could not be archived." |

### 5.3 `archiveModal.*` (YENİ blok)
| Anahtar | TR | EN |
|---|---|---|
| `archiveModal.title` | "Şubeyi Arşivle" | "Archive Section" |
| `archiveModal.sub` | "{{section}} listeden kaldırılacak" | "{{section}} will be removed from the list" |
| `archiveModal.warning` | "Bu şube arşivlenecek ve aktif listede görünmeyecek. Geçmiş yoklama, not ve atama kayıtları korunur; işlem kalıcı silme değildir." | "This section will be archived and hidden from the active list. Past attendance, mark and assignment records are kept; this is not a permanent delete." |
| `archiveModal.reason` | "Arşiv sebebi" | "Archive reason" |
| `archiveModal.reasonPlaceholder` | "Örn. yanlış açıldı / sezon planı değişti…" | "e.g. created by mistake / season plan changed…" |
| `archiveModal.reasonRequired` | "Sebep zorunludur." | "Reason is required." |
| `archiveModal.reasonTooLong` | "En fazla 500 karakter." | "Max 500 characters." |
| `archiveModal.hasStudentsTooltip` | "Aktif öğrencisi olan şube arşivlenemez — önce öğrencileri başka bir şubeye taşıyın." | "A section with active students cannot be archived — move the students to another section first." |
| `archiveModal.archive` | "Arşivle" | "Archive" |
| `archiveModal.successTitle` | "Şube Arşivlendi" | "Section Archived" |
| `archiveModal.successText` | "{{section}} arşivlendi ve aktif listeden kaldırıldı." | "{{section}} has been archived and removed from the active list." |

> 409 (`ClassRoom.HasActiveStudents`) için **ayrı i18n metni eklenmez** — backend
> zaten dinamik Türkçe mesaj (N öğrenci sayısıyla) döndürür ve `getApiErrorMessage`
> ile doğrudan toast'lanır. `toast.archiveError` yalnız fallback'tir.

---

## 6. Modül Dokümanı Güncellemeleri

`.claude/docs/modules/classrooms/` altında:

### 6.1 `api-contracts.md` (OUTDATED — düzelt)
- Üstteki tablo hâlâ `/api/v1/classrooms` (tek kelime) + `classrooms.delete`
  satırlarını gösteriyor (`:13-17`); gerçek uç `/api/v1/**class-rooms**`
  (tireli) ve **arşiv** `class-rooms.archive`. En azından **archive satırı eklenmeli**:
  ```
  | POST | /api/v1/class-rooms/{id}/archive | class-rooms.archive |
    Şube arşivle (soft-delete). Body {reason} zorunlu ≤500. 409: aktif öğrenci
    (ClassRoom.HasActiveStudents) / zaten arşivli (canlı) |
  ```
- Eski `classrooms.delete` / `classrooms` satırlarının arşiv yaklaşımıyla
  güncellenmesi ayrı bir temizlik borcu (bu iş kapsamında not düşülür).

### 6.2 `business-rules.md` (TBD — doldur)
Şu an tüm kurallar `{{TBD}}`. Yeni kural ekle:
- **BR-classrooms-00X: Aktif öğrencisi olan şube arşivlenemez.**
  - Kural: `activeStudentCount > 0` olan şube arşivlenemez; önce öğrenciler taşınır.
  - Sebep: yoklama/not bütünlüğü; öksüz öğrenci ataması kalmamalı.
  - Uygulama → Backend: `ClassRoom.Archive()` + `ClassRoomHasActiveStudentsException`;
    Frontend: buton disabled + tooltip + 409 toast (hibrit).
- **BR-classrooms-00Y: Arşivleme sebebi zorunlu (≤500 karakter).**
  - Backend domain invariant; Frontend zorunlu textarea.

### 6.3 `ui-flows.md`
- "Şube Arşivleme" akışını ekle: giriş noktası (DetailPanel alt bar),
  onay modalı (`ArchiveSectionModal`), izin `class-rooms.archive`, aktif öğrenci
  engeli + 409 davranışı, başarı sonrası seçim sıçraması.

### 6.4 `permissions.md` + kök `permission-matrix.md`
- `permission-matrix.md`'de `class-rooms.archive` **satırı yok** (sadece
  `class-rooms.view` `:104` ve `class-rooms.manage` `:105` var). Backend seed'de
  slug mevcutsa (Açık Soru #4) matris'e satır eklenir:
  `| class-rooms.archive | ✅(SuperAdmin) | ✅(SchoolAdmin) | 🚫 | … |`
  (rename/status'la aynı yetki seviyesi — yalnız admin rolleri).

### 6.5 `completion_status.md`
- Arşivleme'yi ⏳→✅'e taşı (FE), `Güncel` tarih + ilerleme çubuğu güncelle.

---

## 7. Açık Sorular

1. **Sebep UX'te zorunlu mu?** → ÖNERİ: **Evet, zorunlu** (backend zaten zorunlu).
   Buton sebep boşken disabled. (Brief'te de "backend zorunlu, max500" deniyor.)
2. **Etiket "Arşivle" mi "Sil" mi?** → ÖNERİ: **"Arşivle"**. Hard delete yok;
   "Sil" yanıltıcı olur. Modal metni veri korunduğunu açıkça söyler.
3. **Arşivlenmiş şube nerede görünür / geri alınabilir mi?** Bugün liste yalnız
   aktif şubeleri gösteriyor (arşiv sezon ayrı). Arşivlenen şubenin **aktif sezon
   içinde** tekrar görünmesi/geri alınması için backend `unarchive` ucu **yok**.
   → Bu işte kapsam dışı; geri alma gerekirse ayrı BE+FE işi olarak açılır.
   Kullanıcıya modal'da "geri alma için yönetici" notu mu eklensin? (karar bekliyor)
4. **`class-rooms.archive` izin matriste tanımlı mı?** → **Tanımlı DEĞİL**
   (`permission-matrix.md`'de yok). Backend seed `AllPermissionIds()` kataloğunda
   slug'ın gerçekten var olduğu **doğrulanmalı**; varsa matrise satır eklenir,
   yoksa BE'de seed'e eklenmesi gerekir (FE bunsuz 403 alır).
5. **Aktif öğrenci engeli A mı B mi?** → ÖNERİ: **hibrit (A+B)** — §3.

---

## 8. Uygulama Adımları (sıralı, TDD)

> Memory `feedback_default_workflow`: brainstorming → plan → TDD+incremental →
> review → commit. Fix değil yeni özellik olduğundan commit kullanıcı onayıyla.

1. **İzin doğrulama (blocker):** `class-rooms.archive` slug'ı backend seed'de
   var mı? `usePermission` ile gate çalışır mı? (Açık Soru #4) — yoksa önce bu çözülür.
2. **i18n:** `tr/classrooms.json` + `en/classrooms.json`'a §5 anahtarlarını ekle
   (en küçük, bağımsız adım; testsiz).
3. **Hook (TDD):** `useArchiveSection` için test —
   (a) başarı: `archive` çağrılır + invalidate, (b) 409 `ClassRoom.HasActiveStudents`:
   `getApiErrorMessage` toast'lanır, (c) generic hata: `toast.archiveError`.
   Sonra hook'u yaz (`useClassroomMutations.ts`).
4. **types:** `ModalState`'e `{ type: "archive"; section }` ekle.
5. **Modal (TDD):** `ArchiveSectionModal` —
   render test (sebep boşken buton disabled, 500 üstü uyarı, submit `mutateAsync`).
   Sonra bileşeni yaz (MoveStudentModal pattern).
6. **DetailPanel:** Arşivle butonu + `usePermission` gate + `studentCount>0`
   disabled/tooltip + `onAction({type:"archive"})`. Render testleri:
   izinsiz → buton yok; öğrencili → disabled+tooltip.
7. **ClassroomsPage:** modal render dalı + import.
8. **Manuel doğrulama:** `npm run dev` — boş şube arşivle (başarı),
   öğrencili şube (disabled), 409 yarış senaryosu, izinsiz rol (buton yok).
9. **Modül dokümanları:** §6 güncellemeleri (api-contracts archive satırı,
   business-rules iki kural, ui-flows akış, permissions+matrix, completion_status).
10. **Review + commit** (onayla): `npm run build` + `npm run test` yeşil;
    OKSİS commit formatı `2026-06-XX feat: Sınıflar & Şubeler — şube arşivleme (soft-delete) eklendi.`

---

### Dosya Referans Özeti
| Dosya | İş |
|---|---|
| `api/classroomsApi.ts:271-274` | `archive()` **zaten var** — değişiklik yok |
| `hooks/useClassroomMutations.ts:15-22, +yeni` | `useArchiveSection` + `useInvalidate` (mevcut) |
| `keys/classroomKeys.ts` | `all()` prefix yeterli — yeni key yok |
| `components/DetailPanel.tsx:2-14, 302-325` | import `Archive`, alt barda buton + gate |
| `components/modals/ArchiveSectionModal.tsx` | YENİ |
| `types/index.ts:108-116` | ModalState `archive` variant |
| `ClassroomsPage.tsx:255-305` | modal render dalı + import |
| `shared/api/apiError.ts` | `getApiErrorCode` / `getApiErrorMessage` (mevcut, kullanılır) |
| `shared/hooks/usePermission.ts` | `usePermission("class-rooms.archive")` (mevcut) |
| `i18n/locales/{tr,en}/classrooms.json` | §5 anahtarları |
