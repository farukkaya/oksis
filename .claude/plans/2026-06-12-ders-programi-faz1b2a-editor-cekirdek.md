# Ders Programı — Faz 1B-2a (Admin Editör Çekirdeği, Web) — Tasarım

**Katman:** `oksis-web` · **Bağlayıcı spec:** `.claude/specs/ders-programi-modulu-spec.md §9.2`
**Önkoşul:** Faz 1A backend (PR #23) ✅ · Faz 1B-1 Hub (PR #53) ✅
**Tarih:** 2026-06-12 · **Kapsam:** Editör **çekirdeği**. Zenginleştirme (1B-2b) ayrı oturum.

> Brainstorming kararları (kullanıcı onaylı, 2026-06-12):
> 1. **İki dilim** — bu oturum = çekirdek (1B-2a).
> 2. **Precheck = bırakınca doğrula:** drop → place; çakışma varsa hücre kırmızı + sebep, yoksa normal yerleşir. Hover/sürükleme-anı canlı kontrol YOK.
> 3. **dnd-kit** (`@dnd-kit/core`).
> 4. Konum `timetable/editor/` alt-klasör; bell schedule period kaynağı settings `useBellSchedules`.

---

## 1. Kapsam

### ✅ Dahil (1B-2a)
- Haftalık grid (gün × period, bell schedule'dan) + yerleşik dersleri gösterir.
- Yan panel: yerleşmemiş dersler (gerçek — `GET /unplaced`), sürüklenebilir çipler.
- **Place:** çipi boş hücreye sürükle → `POST /placements`.
- **Move:** yerleşik hücreyi başka hücreye sürükle → `PUT /placements/:pid/move`.
- **Remove:** hücreden sil → `DELETE /placements/:pid`.
- **Taslak Kaydet:** `POST /draft`.
- Çakışma (409 + i18n kod) → hedef hücre kırmızı flaş + sebep toast, yerleşim oluşmaz.
- Eşzamanlılık (rowversion 409) → "program değişti, yeniden yükle".
- Durum varyantları: yükleniyor / hata / boş program / kaydediliyor / kaydedildi / çakışma / eşzamanlılık.

### ⛔ Hariç (1B-2b)
- Öğretmen/derslik yeniden ata (`PUT .../teacher|room`), blok ders (`SetBlock`), eksik-saat raporu paneli, canlı hover precheck. (Backend uçları hazır; FE sonraki oturum.)

## 2. Konum & yapı (timetable modülü içinde)

```
src/portals/admin/timetable/
  ScheduleEditorPage.tsx           # route bileşeni — ScheduleEditorPlaceholder yerine
  editor/
    components/
      WeekGrid.tsx · GridCell.tsx · UnplacedPanel.tsx · LessonChip.tsx · EditorToolbar.tsx
      states/EditorStates.tsx
    hooks/ useEditorData.ts · useEditorMutations.ts
    lib/ editorDerive.ts
    editor.css                     # schedule_editor.css handoff port (gerekli alt küme)
    __tests__/ editorDerive.test.ts · ScheduleEditorPage.test.tsx
  types.ts                         # editör DTO'ları eklenir (ProgramForEdit/Placement/Unplaced)
  api/timetableApi.ts              # editör uçları eklenir
  keys/timetableKeys.ts            # program(id)/unplaced(id) key'leri eklenir
```
Modify: `src/app/routes.tsx` (`schedule/:id/edit` → `ScheduleEditorPage`). `ScheduleEditorPlaceholder.tsx` silinir.

## 3. Veri katmanı (gerçek API)

| İhtiyaç | Uç / kaynak |
|---|---|
| Program + yerleşimler | `GET /api/v1/timetable/programs/:id` → `ProgramForEditDto` |
| Yerleşmemiş dersler | `GET /api/v1/timetable/programs/:id/unplaced` → `UnplacedLessonDto[]` (gerçek) |
| Period grid | settings `useBellSchedules` → `BellScheduleDto[]` (gün×period). Kademe→bell eşlemesi impl'de çözülür; tek bell varsa onu kullan. |
| Ders adı | `/academics/subjects` (SubjectLookupDto) |
| Öğretmen adı | persons lookup (teachersApi mevcut) |
| Derslik kodu | `/rooms` → `RoomDto` (id→code) |

- Yeni React Query key'leri: `timetableKeys.program(schoolId, id)`, `timetableKeys.unplaced(schoolId, id)` (tenant-scope'lu).

## 4. Mutasyonlar (`useEditorMutations`)
- `usePlaceLesson(programId)` → `POST /programs/:id/placements {day,period,subjectId,teacherId,roomId?}`.
- `useMoveLesson(programId)` → `PUT /programs/:id/placements/:pid/move {day,period}`.
- `useRemoveLesson(programId)` → `DELETE /programs/:id/placements/:pid`.
- `useSaveDraft(programId)` → `POST /programs/:id/draft`.
- Başarıda `invalidateQueries(timetableKeys.program/unplaced)`. Hata: 409 → ProblemDetails i18n kodu yüzeye taşınır.

## 5. dnd-kit
- `@dnd-kit/core` (+ PointerSensor, KeyboardSensor) kurulur.
- **Draggable:** `LessonChip` (id `unplaced:{subjectId}:{teacherId}`) ve dolu `GridCell` (id `placement:{pid}`).
- **Droppable:** her hücre (id `cell:{day}:{period}`).
- `onDragEnd(active, over)` → `resolveDrop()` saf fonksiyonu komutu çözer: kaynak unplaced→place, kaynak placement→move; over boş değilse (dolu hücre) drop reddi.

## 6. Çakışma & hata UX (bırakınca doğrula)
- Drop → mutasyon. Başarı → grid invalidate. **Çakışma (409, i18n kod):** `flashCell(day,period,'error')` (kısa kırmızı animasyon) + sebep toast (kod→i18n metin; bilinmeyen kod → genel "slot dolu"). Yerleşim oluşmaz; çip panelde kalır.
- **Eşzamanlılık (rowversion 409):** ayrı kod → "Program değiştirildi" banner + "Yeniden yükle" (refetch).

## 7. Durum varyantları
yükleniyor (skeleton grid) · hata (ProblemDetails + retry) · boş program (grid boş, panel dolu) · kaydediliyor (toolbar) · kaydedildi (toast) · çakışma (kırmızı flaş+toast) · eşzamanlılık (banner).

## 8. Test (TDD)
- `editorDerive.test.ts`: `buildCellMap(placements)` (day-period→placement), `joinNames(placements, lookups)`, `resolveDrop(activeId, overId)` (place/move/red), `interpretConflict(errorCode)` (i18n kod→mesaj/eşzamanlılık ayrımı).
- `ScheduleEditorPage.test.tsx`: durum varyantları (loading/error/empty/dolu) + saveDraft tetikleme (mutation mock).

## 9. ⚠️ Debt / açık nokta
- **AS-2 (bell→kademe):** Period grid için kademe-bazlı bell seçimi; Faz 1B-2a'da tek/ilk bell schedule kullanılır, kademe eşlemesi netleşince sıkılaşır (completion_status'a Debt-FE-3).
- i18n çakışma kodları: bilinen kodlar (`timetable.errors.slot-occupied` + occupancy reason kodları) eşlenir; bilinmeyen → genel mesaj.

## 10. Kabul kriterleri (bu oturum)
- [ ] `/admin/schedule/:id/edit` gerçek editör; placeholder kaldırıldı.
- [ ] Grid bell schedule period'larından; yerleşik dersler isimleriyle görünür.
- [ ] Yan panelden çip sürükle → boş hücreye yerleşir (place); hücre→hücre taşınır (move); silinir (remove); taslak kaydedilir.
- [ ] Çakışmada hedef kırmızı + sebep; yerleşim oluşmaz. 409 rowversion → yeniden yükle.
- [ ] Dört+ durum varyantı; `editorDerive` saf fonksiyon testleri + sayfa render testi yeşil.
- [ ] `npm run build` temiz; tam test paketi yeşil.
- [ ] `timetable/completion_status.md`: 1B-2a + Debt-FE-3 güncel.
