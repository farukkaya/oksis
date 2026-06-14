# Ders Programı — Programı Sil (B grubu B-2) — Tasarım

**Tarih:** 2026-06-14
**Katman:** `oksis-api` + `oksis-web` (full-stack vertical slice — B-1 gibi)
**Tasarım kaynağı:** `Oksis Layout-handoff (1).zip` → `app/schedule_more_actions.jsx`
(`DeleteScheduleModal`, satır 384-445) + editör/Hub "daha fazla" menüsü.
**Bağlayıcı spec:** `.claude/specs/ders-programi-modulu-spec.md` — silme spec'te ayrı
madde değil; §8 izin listesi ile **çakışma var** (aşağıda D2, onaylı sapma).

---

## 0. Kapsam & yönetişim kararları (kullanıcı onaylı — 2026-06-14)

- **D1 — B grubu sıralaması:** Çoğalt iptal (B-1 notu), Sürüm geçmişi tamam (B-1),
  **Sil = bu dilim (B-2)**, PDF sonraki dilim.
- **D2 — İzin (§8 sapması):** Spec §8 izin listesini *"mevcut — değişmez"* sayar ve
  `timetable.delete` o listede **yoktur**. Kullanıcı kararı (2026-06-14): silme için
  **yeni `timetable.delete` izni** tanımlanır + seed + migration. `timetable.publish`/
  `timetable.override` eklemelerine benzer onaylı sapma → completion_status'a yazılır.
- **D3 — Silme tarzı:** OKSİS soft-delete deseni (`SoftDeleteInterceptor`). Kullanıcıya
  "Kalıcı Olarak Sil / geri yüklenemez" (uygulamada UI geri-alma yok); altyapıda denetim
  satırı `is_deleted=1` kalır.
- **D4 — Etki sayıları:** Yeni `delete-preview` ucu (publish-preview ayna).
- **D5 — Occupancy:** Silmede slotlar **şimdi release** edilir (Debt yok).
- **D6 — Backend:** Gerçek vertical slice (domain + 2 uç + test). Stub değil.

### Dahil
- BE: `ScheduleProgram.Delete()` domain davranışı + `DeleteScheduleProgram` command +
  `GetDeleteProgramPreview` query + 2 uç (`delete-preview`, `DELETE`) + yeni `timetable.delete` izni/seed/migration.
- FE: `DeleteScheduleModal` (handoff 1:1) + Hub `RowMenu` "Programı Sil" item + editör `EditorMoreMenu` "Programı Sil" item + editörden silmede Hub'a yönlendirme.

### Hariç (bu dilimde değil)
- PDF dışa aktar (sonraki dilim).
- Silinen programı UI'dan geri getirme (çöp kutusu / restore görünümü).
- Silme bildirim dağıtımı (event fırlatılır; dağıtım Faz 2.6 — Debt).

---

## 1. Mevcut yapı (yeniden kullanım)

- **`ScheduleProgram`** (aggregate, var): `Status (Draft/Revising/Published)`, `Version`,
  owned `LessonPlacement` koleksiyonu (`is_active` bayraklı). `Remove(placementId)` zaten
  yerleşimi pasifler (`is_active=0`).
- **`ScheduleVersion`** (entity, var): yayın snapshot'ları; `(school_id, program_id, version)`
  filtreli unique + soft-delete filtreli.
- **`ScheduleException`** (entity, var): geçici değişiklikler; soft-revoke + soft-delete.
- **Filtreli unique index'ler (spec §4.2):** `UX_Placement_Class/Teacher/Room_Slot`,
  hepsi `WHERE is_active=1` (program'ın `is_deleted` alanını **görmez** — bkz. 2.1 kritik nokta).
- **`SoftDeleteInterceptor`:** `db.X.Remove(entity)` → otomatik `IsDeleted=true, DeletedAt`.
  `ISoftDeletable` olan entity'lerde çalışır; hard delete yapılmaz.
- **`IOccupancyIndex`** (Redis): reserve/release; AssignRoom "önce release" deseni mevcut.
- **`GetPublishPreview`** (query, var): etkilenen öğretmen sayısı gerçek; öğrenci/veli `0` (Debt-BE-1).
  `delete-preview` bu deseni ayna alır.

---

## 2. Backend — domain

### 2.1 `ScheduleProgram.Delete()` (yeni davranış)

**Kritik nokta:** Filtreli unique index'ler `WHERE is_active=1` üzerindedir ve programın
`IsDeleted` alanını **görmez**. Program soft-delete edilse bile placement'lar `is_active=1`
kalırsa: (a) aynı `(SchoolId, AcademicTermId, BranchId)`'ye yeni program açılamaz
(`UX_Placement_Class_Slot` çakışır), (b) öğretmen/derslik slotları DB'de dolu görünür.
Ayrıca owned placement'lar program **soft-delete** (UPDATE) edildiği için EF cascade-DELETE
tetiklemez → kendiliğinden temizlenmezler.

`Delete()` davranışı:
- Tüm **aktif** placement'ları `is_active=false` yapar (mevcut deactivate semantiği).
- `ScheduleProgramDeletedEvent(programId, branchId, version, status)` fırlatır (outbox → Faz 2.6 bildirim).

### 2.2 Persistence
Yeni tablo/alan YOK → şema migration'ı gerekmez. (Sadece izin seed migration'ı — bkz. 4.)
`Delete()` mevcut `lesson_placements` üzerinde çalışır. `ScheduleProgramDeletedEvent` mevcut
outbox interceptor'ına düşer.

---

## 3. Backend — application (1 command + 1 query)

`Oksis.Application/Modules/Timetable/` altında:

| Slice | Tip | İzin | Davranış |
|---|---|---|---|
| `GetDeleteProgramPreview` | Query | `timetable.delete` | Program + aktif placement sayısı → `DeleteProgramPreviewDto { status, version, versionCount, teacherCount, studentCount, parentCount }`. `versionCount` = `ScheduleVersion` sayısı (gerçek); `teacherCount` = aktif yerleşimlerdeki ayrık öğretmen (gerçek); `studentCount`/`parentCount` = `0` (Debt-BE-1, publish-preview ile aynı). Taslakta FE etki kutularını gizler. |
| `DeleteScheduleProgram` | Command | `timetable.delete` | Sahiplik + tenant; adım sırası ↓. Transaction. Döner `{ programId, branchId }`. |

**`DeleteScheduleProgramCommandHandler` akışı:**
1. Program + placements yükle (Include).
2. `program.Delete()` (aktif placement'ları pasifle + event).
3. `db.SchedulePrograms.Remove(program)` → interceptor `IsDeleted=true`.
4. Bu programın `ScheduleVersions`'ını yükle → `RemoveRange` (soft-delete) → tüketici sorguları
   NotFound → "sınıf programsız" (tasarımla birebir).
5. Bu programın **aktif** `ScheduleExceptions`'ını yükle → `RemoveRange` (soft-delete).
6. **Occupancy release (D5):** programın her (aktif idi) placement'ı için teacher/room slotunu
   `IOccupancyIndex.Release` ile temizle.
7. `SaveChanges` (pipeline transaction). Pipeline: Validation→Tenant→Auth→Transaction.

---

## 4. Backend — izin + API

### 4.1 Yeni izin `timetable.delete` (D2 sapması)
- `MasterSeedIds` + `PermissionSeedData` + `RolePermissionSeedData` → admin rolleri (SuperAdmin/SchoolAdmin).
- Migration `20260614_add_timetable_delete_permission` (publish/override izin migration'ları deseniyle).

### 4.2 API (SchedulingController)
```
GET    /api/v1/timetable/programs/{id}/delete-preview   → timetable.delete
DELETE /api/v1/timetable/programs/{id}                  → timetable.delete
```
Hatalar ProblemDetails + correlationId. Program yoksa/tenant dışıysa 404.

---

## 5. Frontend (oksis-web)

### 5.1 Tipler + API (`types.ts` + `timetableApi.ts`)
- `DeleteProgramPreviewDto`, `DeleteProgramResultDto`.
- `timetableApi.getDeletePreview(programId)`, `timetableApi.deleteProgram(programId)`.
- Tenant-scope React Query key: `["timetable","deletePreview",programId]`.
  Silme başarısında `timetable.all(schoolId)` invalidate (Hub liste/özet tazelenir).

### 5.2 `DeleteScheduleModal` (prototip 1:1)
- `Modal` kabuğu, `trash-2` danger ikon, başlık "Programı Sil", alt başlık sınıf+sürüm+durum.
- **İki kademeli teyit:**
  - **Taslak (düşük risk):** sadece onay kutusu. Uyarı: "geri alınamaz, kimse etkilenmez". Etki kutuları gizli.
  - **Yayında (yüksek risk):** onay kutusu **+** etki kutuları (Sürüm/Öğrenci/Öğretmen/Veli, `delete-preview`'den)
    **+** sınıf adını yazarak teyit. Uyarı: "yayını ve tüm sürüm geçmişini kaldırır — sınıf programsız kalır".
- Buton "Kalıcı Olarak Sil" — `ready` (onay + (taslak değilse) ad eşleşmesi) olana dek disabled; siliniyor durumu.
- Modal açılınca `getDeletePreview` çek (yayında iken anlamlı). `deleteProgram` mutation → başarıda invalidate.
- **Editörden silinince → Hub'a yönlendir** (`/admin/schedule`) + toast. Hub'dan silinince satır kaybolur + toast.

### 5.3 Tetikleyiciler
- **Hub `RowMenu`:** `IconName`'e `trash` eklenir; "Programı Sil" item (danger ton) → modal'ı row meta ile açar.
- **Editör `EditorMoreMenu`:** mevcut ⋯ menüsüne (Sürüm geçmişi'nin yanına) "Programı Sil" item (danger).

### 5.4 i18n
- `timetable.delete.*` (tr/en): başlık, alt başlıklar (taslak/yayında), uyarı metinleri, etki etiketleri,
  onay kutusu metinleri, teyit input etiketi, buton, başarı toast, `deleteFailed`.

---

## 6. Test (TDD)

**Backend:**
- Domain: `Delete()` aktif placement'ları pasifler + `ScheduleProgramDeletedEvent` fırlatır — birim.
- Handler: `DeleteScheduleProgram` (program + versions + exceptions soft-delete, occupancy release çağrılır,
  sahiplik/tenant 404) — handler test; `GetDeleteProgramPreview` (versionCount/teacherCount gerçek,
  studentCount/parentCount=0) — handler test.
- Integration: **silinen programın `(SchoolId, AcademicTermId, BranchId)`'sine yeni program açılabilir**
  (unique index serbest); silinen programın öğretmeni o slotta yeni programda kullanılabilir.
- Permission seed coverage: `timetable.delete` admin rollerinde seed'li.

**Frontend:**
- `DeleteScheduleModal`: taslak (sadece onay kutusu → buton aktif) vs yayında (onay + ad yazımı → aktif);
  yanlış ad → disabled; mutation+invalidate.
- `timetableApi` deleteProgram/getDeletePreview wrapper'ları (mock httpClient).
- `RowMenu`/`EditorMoreMenu` "Programı Sil" item render + onClick.
- Editörden silmede Hub'a yönlendirme.

**Kapı:** BE `dotnet build` + timetable testleri yeşil; FE tam paket yeşil + `npm run build` temiz.

---

## 7. Sapma / Debt (completion_status'a)

- **Sapma (2026-06-14, §8):** Yeni `timetable.delete` izni — spec §8 "değişmez" izin listesi dışı.
  Onay: kullanıcı. Etki: silme uçları gerçek izinle korunur.
- **Debt-BE (silme bildirimi):** `ScheduleProgramDeletedEvent` fırlatılır; dağıtım Faz 2.6 (K0.5).
  Silinen yayında program tüketicilere sessizce "programsız" yansır.
- **Sınır (etki sayısı):** `delete-preview` öğrenci/veli sayısı `0` (Debt-BE-1 ile aynı read-model borcu);
  öğretmen + sürüm sayısı gerçek.

---

## 8. Kabul kriterleri

- [ ] `ScheduleProgram.Delete()` domain testi yeşil (aktif placement'lar pasif + event).
- [ ] `DELETE programs/{id}` programı + versions + exceptions soft-delete eder, occupancy release eder; tenant-filtreli, `timetable.delete`.
- [ ] `GET programs/{id}/delete-preview` sürüm + öğretmen sayısını gerçek döndürür; öğrenci/veli 0.
- [ ] Integration: silinen programın sınıf+dönemine yeni program açılabilir; öğretmen slotu serbest.
- [ ] `timetable.delete` izni seed'li (admin rolleri) + migration.
- [ ] `DeleteScheduleModal` Hub RowMenu ve editör ⋯ menüsünden açılır; iki kademeli teyit çalışır; editörden silmede Hub'a yönlendirir.
- [ ] Tüm string i18n (tr/en); FE tam paket + `npm run build` temiz; BE timetable testleri + build yeşil.
- [ ] completion_status: ilerleme + sapma (timetable.delete §8) + Debt (silme bildirimi) güncel.
