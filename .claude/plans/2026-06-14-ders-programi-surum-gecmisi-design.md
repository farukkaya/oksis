# Ders Programı — Sürüm Geçmişi (B grubu B-1) — Tasarım

**Tarih:** 2026-06-14
**Katman:** `oksis-api` + `oksis-web` (full-stack vertical slice — Faz 1A gibi)
**Tasarım kaynağı:** `Oksis Layout-handoff (1).zip` → `app/schedule_more_actions.jsx`
(`VersionHistoryDrawer`, satır 170-269) + README §7 (editör "daha fazla" menüsü).
**Bağlayıcı spec:** `.claude/specs/ders-programi-modulu-spec.md` — sürüm/snapshot Faz 2
yol-haritasında; madde-seviye çakışma YOK. Sapmalar completion_status'a yazılır.

---

## 0. Kapsam & yönetişim kararları (kullanıcı onaylı — 2026-06-14)

- **D1 — B grubu sıralaması:** Çoğalt **iptal edildi** (öğretmen-tekilliği `UX_Placement_Teacher_Slot`
  ile çatışıyor: sadık tam-kopya hep reddedilir, `TeacherId` zorunlu → iskelet-klon model değişikliği
  gerektirir; kullanıcı kapsam dışı bıraktı). B-1 = **yalnız Sürüm Geçmişi**. (PDF/Sil sonraki dilimler.)
- **D2 — Kapsam:** Liste + diff (karşılaştır) + **geri yükle** (tam).
- **D3 — Backend:** Gerçek vertical slice (domain + 3 uç + test). Frontend-first stub değil.

### Dahil
- BE: `ListScheduleVersions` (liste), `GetScheduleVersionDiff` (vN vs vN-1), `RestoreScheduleVersion`
  (snapshot → aktif programa Draft) + `ScheduleProgram.RestoreFrom(snapshot)` domain davranışı.
- FE: `VersionHistoryDrawer` + Hub `RowMenu` "Sürüm geçmişi" item + editör toolbar "daha fazla" menüsü.

### Hariç (bu dilimde değil)
- Çoğalt (iptal), PDF dışa aktar, Programı sil (sonraki dilimler).
- Keyfi iki-sürüm karşılaştırması (yalnız ardışık vN↔vN-1).
- Restore bildirim dağıtımı (event fırlatılır; dağıtım Faz 2.6 — Debt).

---

## 1. Mevcut yapı (yeniden kullanım)

- **`ScheduleVersion`** (entity, var): `ProgramId, BranchId, AcademicYearId/TermId, Version, PublishedAt,
  PublishedBy (Guid), Note, SnapshotJson, PlacementCount`. Yayında her publish bir kayıt yazar
  (`(school_id, program_id, version)` unique).
- **`PublishedScheduleSnapshot`** (DTO, var) = `{ ..., Version, PublishedAt, Placements[] }`;
  `PublishedLessonPlacementSnapshot` = `{ PlacementId, Day, Period, SubjectId, TeacherId, RoomId?,
  IsBlock, BlockGroupId? }`. `PublishProgramCommandHandler.BuildSnapshot` serialize eder;
  `PublishedScheduleQueryHandler.TryDeserialize` okur. **Diff + restore bu snapshot'tan beslenir.**
- `TryDeserialize` + `JsonSerializerOptions(Web)` paylaşılan bir helper'a (`ScheduleSnapshotSerializer`)
  çıkarılır (publish + published-query + yeni diff/restore tek noktadan kullanır — DRY).

---

## 2. Backend — domain

### 2.1 `ScheduleProgram.RestoreFrom(snapshotPlacements)`
Yeni davranış: mevcut **aktif** placement'ları pasifleştirir (`is_active=0`), snapshot'taki her
placement'ı yeniden yerleştirir (yeni `LessonPlacement`, aynı Day/Period/Subject/Teacher/Room/Block),
`Status` → `Revising` (Published'dan geri yüklemede) veya `Draft` kalır. INV-1/INV-2 korunur
(snapshot zaten geçerli bir yayından geldiği için sınıf-içi tekillik sağlanır). `Version` artmaz
(restore yeni yayın değil; sonraki publish'te artar). `ScheduleProgramRestoredEvent(programId, version)`.

> Çapraz-kaynak (öğretmen/derslik) çakışması: snapshot aynı sınıfın geçmiş yayını olduğundan
> öğretmenler programın kendisine aittir; mevcut aktifler önce pasifleştiği için kendi slotları serbest
> kalır. Yayından beri **başka** program o öğretmeni/dersliği o slota almışsa restore DB filtreli unique
> index'e takılır → handler 409 döndürür, transaction geri alınır (kısmi restore yok).

### 2.2 Persistence
Yeni tablo YOK. `RestoreFrom` mevcut `lesson_placements` üzerinde çalışır (pasifleştir + ekle).
Occupancy index senkronu mevcut komutlardaki desenle (release eski, reserve yeni). Migration gerekmez
(yeni alan yok). `ScheduleProgramRestoredEvent` outbox'a düşer (mevcut interceptor).

---

## 3. Backend — application (3 slice)

`Oksis.Application/Modules/Timetable/` altında:

| Slice | Tip | İzin | Davranış |
|---|---|---|---|
| `ListScheduleVersions` | Query | `timetable.manage` | `ScheduleVersion`'ları ProgramId'ye göre (version desc) → `ScheduleVersionListItemDto { version, publishedAt, publishedByName, note, placementCount }`. `PublishedBy` Guid → kişi adı (`users/persons` lookup'u; çözülemezse "—"). |
| `GetScheduleVersionDiff` | Query | `timetable.manage` | vN ve v(N-1) snapshot'larını deserialize, slot'a göre eşle → `ScheduleVersionDiffDto { rows: [{ day, period, slotLabel, was, now }] }`. v1 → "ilk yayın" tek satır. Saf diff fonksiyonu (`ComputeVersionDiff`) ayrı + test. İsim çözümü (subject/teacher/room) handler'da. |
| `RestoreScheduleVersion` | Command | `timetable.manage` | Program sahiplik + tenant; hedef sürümün snapshot'ı → `program.RestoreFrom(...)`; transaction; çakışma → 409. Döner `{ programId, restoredFromVersion, status }`. |

Occupancy: restore handler eski aktifleri release + yeni placement'ları reserve eder (AssignRoom
"önce release" deseniyle uyumlu). Pipeline OKSİS standardı (Validation→Tenant→Auth→Transaction).

---

## 4. Backend — API (SchedulingController)

```
GET  /api/v1/timetable/programs/{id}/versions                       → timetable.manage
GET  /api/v1/timetable/programs/{id}/versions/{version}/diff        → timetable.manage
POST /api/v1/timetable/programs/{id}/versions/{version}/restore     → timetable.manage
```
Hatalar ProblemDetails + correlationId. Restore çakışması 409; sürüm yoksa 404.

---

## 5. Frontend (oksis-web)

### 5.1 Tipler + API (`types.ts` + `timetableApi.ts`)
- `ScheduleVersionListItemDto`, `ScheduleVersionDiffDto`/`ScheduleVersionDiffRow`, `RestoreVersionResultDto`.
- `timetableApi.listVersions(programId)`, `getVersionDiff(programId, version)`, `restoreVersion(programId, version)`.
- Tenant-scope React Query key'leri: `["timetable","versions",programId]`, `["timetable","versionDiff",programId,version]`.

### 5.2 `VersionHistoryDrawer` (prototip 1:1)
- Sağ çekmece (`drawer-scrim` + `.vh-drawer`), başlık + sürüm sayısı + kapat.
- Zaman çizelgesi: BE listesi (yayın sürümleri). Program `Draft/Revising` ise **en üste sentetik
  "Aktif çalışma" satırı** (program.Status + "şu an düzenleniyor"; diff/restore yok). `Published` ise
  en üst yayın sürümü zaten odur.
- Her sürüm satırı: pill `v{n}` + durum + kim/rol/ne zaman + not. Aksiyonlar:
  - **Karşılaştır** toggle → lazy `getVersionDiff(version)` → satırlar (`was → now`).
  - **Geri yükle** → inline teyit ("aktif taslağın üzerine yazılır, kaydedilmemiş değişiklikler
    kaybolur") → `restoreVersion` mutation → başarıda program/versions invalidate + drawer kapan.
- Durum varyantları: yükleniyor (skeleton), hata (retry), boş (yalnız "Aktif çalışma" / "henüz yayın yok").
- Tüm string i18n `timetable.versions.*` (tr/en).

### 5.3 Tetikleyiciler
- **Hub `RowMenu`:** `IconName`'e `history` eklenir; `ClassProgramsTable` satır menüsüne "Sürüm geçmişi"
  item'ı (drawer'ı programId ile açar).
- **Editör toolbar:** yeni küçük **`EditorMoreMenu`** (Radix Popover, `.stu` portal — CellMenu deseni) ⋯
  butonu + "Sürüm geçmişi" item. (PDF/Sil bu dilimde render edilmez.)

---

## 6. Test (TDD)

**Backend:**
- Domain: `RestoreFrom` (snapshot'tan placement'ları kurar, eskileri pasifler, INV korunur) — birim.
- Saf: `ComputeVersionDiff(prevPlacements, curPlacements)` (eklenen/değişen/kaldırılan slot) — birim.
- Handler: `ListScheduleVersions` (sıra + isim çöz), `GetScheduleVersionDiff` (vN vs vN-1, v1 ilk-yayın),
  `RestoreScheduleVersion` (başarı + sahiplik 404 + çakışma 409) — integration/handler.
- Permission seed coverage (yeni izin yok; `timetable.manage` zaten seed'li → ek seed gerekmez).

**Frontend:**
- `VersionHistoryDrawer` (liste render, "Aktif çalışma" satırı, Karşılaştır lazy diff, Geri yükle teyit→mutation).
- `timetableApi` versions wrapper'ları (mock httpClient).
- `RowMenu`/`EditorMoreMenu` "Sürüm geçmişi" item render + onClick.

**Kapı:** BE `dotnet build` + timetable testleri yeşil; FE tam paket yeşil + `npm run build` temiz.

---

## 7. Sapma / Debt (completion_status'a)

- **Sapma (2026-06-14):** Çoğalt iptal (öğretmen-tekilliği + zorunlu TeacherId). Onay: kullanıcı.
- **Debt-BE (restore bildirimi):** `ScheduleProgramRestoredEvent` fırlatılır; dağıtım Faz 2.6 (K0.5).
- **Sınır:** Diff yalnız ardışık (vN↔vN-1); "kim" adı users/persons lookup'undan, yoksa "—".

---

## 8. Kabul kriterleri

- [ ] `GET versions` sürümleri (desc) kim/ne zaman/not/sayı ile döndürür; tenant-filtreli, `timetable.manage`.
- [ ] `GET versions/{v}/diff` vN vs vN-1 satır-satır farkı döndürür; v1 ilk-yayın.
- [ ] `POST versions/{v}/restore` snapshot'ı aktif programa Draft/Revising olarak yazar; çakışma 409, atomik.
- [ ] `ScheduleProgram.RestoreFrom` domain testi yeşil (kurar + eskileri pasifler + INV).
- [ ] `VersionHistoryDrawer` Hub RowMenu ve editör ⋯ menüsünden açılır; liste/diff/geri-yükle çalışır.
- [ ] Tüm string i18n (tr/en); FE tam paket + `npm run build` temiz; BE timetable testleri + build yeşil.
- [ ] completion_status: ilerleme + sapma (Çoğalt iptal) + Debt (restore bildirimi) güncel.
