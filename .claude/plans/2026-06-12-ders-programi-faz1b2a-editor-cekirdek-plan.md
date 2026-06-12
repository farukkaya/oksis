# Ders Programı Faz 1B-2a — Editör Çekirdeği (Web) Implementation Plan

> **For agentic workers:** Inline TDD execution. Steps use checkbox (`- [ ]`). Tasarım: `2026-06-12-ders-programi-faz1b2a-editor-cekirdek.md`. Spec §9.2.

**Goal:** `/admin/schedule/:id/edit`'te gerçek editör çekirdeği — bell schedule grid + yan panelden sürükle-yerleştir (place) + taşı (move) + sil (remove) + taslak kaydet, çakışmada hücre kırmızı + sebep.

**Architecture:** `timetable/editor/` alt-modülü. Server state React Query (tenant-key'li); dnd-kit (`@dnd-kit/core`) sürükle-bırak; drop→komut çözümü ve çakışma yorumu saf fonksiyonlarda (`editorDerive`, TDD). İsimler subjects/teachers/rooms lookup join'inden.

**Tech Stack:** React + TS · @dnd-kit/core · @tanstack/react-query · react-router · httpClient · vitest.

---

### Task 1: bağımlılık + types + keys + api uçları

**Files:** `package.json` (dnd-kit), `src/portals/admin/timetable/types.ts`, `keys/timetableKeys.ts`, `api/timetableApi.ts`.

- [ ] **Step 1:** `npm i @dnd-kit/core` (kullanıcı onaylı). Doğrula: `package.json` dependencies'de görünür.
- [ ] **Step 2:** `types.ts`'e ekle (Faz 1A DTO yansımaları):
```ts
export interface PlacementDto {
  id: string; day: number; period: number;
  subjectId: string; teacherId: string; roomId: string | null;
  isBlock: boolean; blockGroupId: string | null;
}
export interface ProgramForEditDto {
  id: string; academicYearId: string; academicTermId: string; branchId: string;
  status: ScheduleProgramStatus; version: number; placements: PlacementDto[];
}
export interface UnplacedLessonDto {
  subjectId: string; teacherId: string;
  requiredHours: number; placedHours: number; remainingHours: number;
}
export interface PlaceLessonInput { day: number; period: number; subjectId: string; teacherId: string; roomId?: string | null; }
export interface MoveLessonInput { day: number; period: number; }
/** Lookup birleşik isim haritası. */
export interface NameLookups {
  subjects: Map<string, { name: string; code: string }>;
  teachers: Map<string, string>;
  rooms: Map<string, string>;
}
```
- [ ] **Step 3:** `keys/timetableKeys.ts`'e ekle:
```ts
  program: (s: string | null | undefined, id: string) =>
    tenantScopedKey(s, ["timetable", "program", id] as const),
  unplaced: (s: string | null | undefined, id: string) =>
    tenantScopedKey(s, ["timetable", "unplaced", id] as const),
```
- [ ] **Step 4:** `api/timetableApi.ts`'e editör metotları ekle:
```ts
  getProgram: async (id: string, signal?: AbortSignal): Promise<ProgramForEditDto> =>
    (await httpClient.get<ApiEnvelope<ProgramForEditDto>>(`/timetable/programs/${id}`, { signal })).data.data,
  getUnplaced: async (id: string, signal?: AbortSignal): Promise<UnplacedLessonDto[]> =>
    (await httpClient.get<ApiEnvelope<UnplacedLessonDto[]>>(`/timetable/programs/${id}/unplaced`, { signal })).data.data,
  placeLesson: async (id: string, body: PlaceLessonInput): Promise<string> =>
    (await httpClient.post<ApiEnvelope<string>>(`/timetable/programs/${id}/placements`, body)).data.data,
  moveLesson: async (id: string, pid: string, body: MoveLessonInput): Promise<void> => {
    await httpClient.put(`/timetable/programs/${id}/placements/${pid}/move`, body);
  },
  removeLesson: async (id: string, pid: string): Promise<void> => {
    await httpClient.delete(`/timetable/programs/${id}/placements/${pid}`);
  },
  saveDraft: async (id: string): Promise<void> => {
    await httpClient.post(`/timetable/programs/${id}/draft`);
  },
```
- [ ] **Step 5:** `npm run build` derlenir. **Commit:** `2026-06-12 feat: editör veri katmanı (dnd-kit + types/keys/api uçları).`

---

### Task 2: editorDerive.ts — saf fonksiyonlar (TDD)

**Files:** Create `editor/lib/editorDerive.ts`, Test `editor/__tests__/editorDerive.test.ts`.

- [ ] **Step 1 — Failing test:**
```ts
import { describe, it, expect } from "vitest";
import { buildCellMap, resolveDrop, interpretConflict } from "../lib/editorDerive";
import type { PlacementDto } from "../../types";

const p: PlacementDto = { id: "pl1", day: 0, period: 1, subjectId: "s1", teacherId: "t1", roomId: null, isBlock: false, blockGroupId: null };

it("buildCellMap day-period anahtarlar", () => {
  const m = buildCellMap([p]);
  expect(m.get("0:1")?.id).toBe("pl1");
  expect(m.get("1:2")).toBeUndefined();
});
it("resolveDrop: unplaced kaynak → place", () => {
  expect(resolveDrop("unplaced:s1:t1", "cell:2:3", new Map())).toEqual({
    kind: "place", subjectId: "s1", teacherId: "t1", day: 2, period: 3,
  });
});
it("resolveDrop: placement kaynak → move", () => {
  expect(resolveDrop("placement:pl1", "cell:2:3", new Map())).toEqual({
    kind: "move", placementId: "pl1", day: 2, period: 3,
  });
});
it("resolveDrop: dolu hücreye düşürme → reddedilir (null)", () => {
  const occ = new Map([["2:3", p]]);
  expect(resolveDrop("unplaced:s1:t1", "cell:2:3", occ)).toBeNull();
});
it("interpretConflict: rowversion → reload; diğer → conflict", () => {
  expect(interpretConflict("timetable.errors.concurrency").kind).toBe("reload");
  expect(interpretConflict("timetable.errors.slot-occupied").kind).toBe("conflict");
});
```
- [ ] **Step 2 — Run, expect fail** (`npm run test -- editorDerive`).
- [ ] **Step 3 — Implement** `editor/lib/editorDerive.ts`:
```ts
import type { PlacementDto } from "../../types";

export type CellMap = Map<string, PlacementDto>;
export const cellKey = (day: number, period: number) => `${day}:${period}`;

export function buildCellMap(placements: PlacementDto[]): CellMap {
  return new Map(placements.map((p) => [cellKey(p.day, p.period), p]));
}

export type DropAction =
  | { kind: "place"; subjectId: string; teacherId: string; day: number; period: number }
  | { kind: "move"; placementId: string; day: number; period: number };

/** dnd-kit active/over id'lerinden komutu çözer; over dolu hücreyse null (reddet). */
export function resolveDrop(activeId: string, overId: string, occupied: CellMap): DropAction | null {
  if (!overId.startsWith("cell:")) return null;
  const [, dStr, pStr] = overId.split(":");
  const day = Number.parseInt(dStr, 10);
  const period = Number.parseInt(pStr, 10);
  if (occupied.has(cellKey(day, period))) return null;
  if (activeId.startsWith("unplaced:")) {
    const [, subjectId, teacherId] = activeId.split(":");
    return { kind: "place", subjectId, teacherId, day, period };
  }
  if (activeId.startsWith("placement:")) {
    const [, placementId] = activeId.split(":");
    return { kind: "move", placementId, day, period };
  }
  return null;
}

export type ConflictKind = { kind: "reload" } | { kind: "conflict"; code: string };
export function interpretConflict(code: string | undefined): ConflictKind {
  if (code && code.includes("concurrency")) return { kind: "reload" };
  return { kind: "conflict", code: code ?? "timetable.errors.slot-occupied" };
}
```
- [ ] **Step 4 — Run, expect pass.**
- [ ] **Step 5 — Commit:** `2026-06-12 feat,test: editör saf fonksiyonları (cellMap/resolveDrop/interpretConflict).`

---

### Task 3: data + mutation hook'ları

**Files:** Create `editor/hooks/useEditorData.ts`, `editor/hooks/useEditorMutations.ts`.
**Önce oku:** `BellScheduleDto` şekli (`src/portals/admin/settings/api/*types*`), subject lookup (`/academics/subjects` → SubjectLookupDto), teacher persons lookup (teachersApi). Bu 3 şekli okuyup `NameLookups` map'lerini ve period grid'i (gün listesi sabit Pzt–Cum; period sayısı bell'den) kur.

- [ ] **useEditorData(programId):** React Query'ler — `getProgram`, `getUnplaced`, `useBellSchedules`, subjects/teachers/rooms lookup. `NameLookups` map'leri + `periods: number[]` (bell'den; yoksa `[1..8]` fallback) + `days` (0..4) döndür. `loading/error/program/unplaced/lookups/periods`. Key'ler tenant-scope'lu (`timetableKeys.program/unplaced`).
- [ ] **useEditorMutations(programId):** `place/move/remove/saveDraft` mutation'ları; başarıda `invalidateQueries(program/unplaced)`. Hata 409 ProblemDetails kodu yüzeye taşınır (apiError mevcut helper).
- [ ] **Commit:** `2026-06-12 feat: editör veri + mutation hook'ları (program/unplaced/lookup/bell + place/move/remove/draft).`

---

### Task 4: sunum bileşenleri + i18n + css

**Files:** Create `editor/components/{LessonChip,GridCell,WeekGrid,UnplacedPanel,EditorToolbar}.tsx`, `editor/components/states/EditorStates.tsx`, `editor/editor.css`; ekle `shared/i18n/locales/{tr,en}/timetable.json` editör anahtarları (`editor.*`, `errors.*`).

- [ ] **i18n:** `editor.title/save/saving/saved/unplacedTitle/emptyGrid/conflict/concurrencyReload/back` + `errors.slot-occupied/teacher-busy/room-busy/concurrency/generic` tr/en.
- [ ] **LessonChip.tsx** — `useDraggable({ id: 'unplaced:'+subjectId+':'+teacherId })`; ders adı + öğretmen + kalan saat (handoff `.sed-chip`).
- [ ] **GridCell.tsx** — `useDroppable({ id: 'cell:'+day+':'+period })`; dolu ise `useDraggable({ id: 'placement:'+pid })`; ders adı/öğretmen/derslik (lookup). `flash` prop'u kırmızı animasyon (`.sed-cell.flash-error`).
- [ ] **WeekGrid.tsx** — gün × period tablosu; `cellMap`'ten hücreleri render; `flashKey` state'i ilet.
- [ ] **UnplacedPanel.tsx** — `unplaced` çipleri (kalan saat>0); başlık + sayaç.
- [ ] **EditorToolbar.tsx** — başlık (sınıf adı) + Taslak Kaydet butonu (saving/saved durumu).
- [ ] **EditorStates.tsx** — loading (skeleton grid) / error / concurrency banner.
- [ ] **editor.css** — `schedule_editor.css`'ten gerekli alt küme (sed-chip, sed-cell, grid, flash). Inline style yok.
- [ ] **Commit:** `2026-06-12 feat: editör sunum bileşenleri + i18n + editor.css.`

---

### Task 5: ScheduleEditorPage + dnd-kit orkestrasyonu (TDD)

**Files:** Create `ScheduleEditorPage.tsx`, Test `editor/__tests__/ScheduleEditorPage.test.tsx`.

- [ ] **Step 1 — Failing test:** `useEditorData`/`useEditorMutations` mock'lanır — loading→skeleton, error→mesaj, boş program→grid+panel, dolu→ders adı; Taslak Kaydet → saveDraft.mutate çağrılır.
- [ ] **Step 2 — Run, expect fail.**
- [ ] **Step 3 — Implement** `ScheduleEditorPage.tsx`: `useParams` id; `useEditorData`/`useEditorMutations`; `DndContext` (PointerSensor+KeyboardSensor); `buildCellMap`; `onDragEnd` → `resolveDrop` → place/move mutate; `onError` → `interpretConflict` → `flashCell` + toast / concurrency banner; `WeekGrid`+`UnplacedPanel`+`EditorToolbar`; durum varyantları (`EditorStates`).
- [ ] **Step 4 — Run, expect pass.**
- [ ] **Step 5 — Commit:** `2026-06-12 feat,test: ScheduleEditorPage — dnd-kit place/move/remove + çakışma flaş + taslak kaydet.`

---

### Task 6: routing + placeholder temizliği + doğrulama

**Files:** Modify `src/app/routes.tsx`; Delete `src/portals/admin/timetable/ScheduleEditorPlaceholder.tsx`.

- [ ] `routes.tsx`: `ScheduleEditorPlaceholder` importu/satırını `ScheduleEditorPage` ile değiştir (`schedule/:id/edit`).
- [ ] `ScheduleEditorPlaceholder.tsx` sil.
- [ ] **Run:** `npm run build` temiz + tam `npm run test` yeşil. **Commit:** `2026-06-12 feat: editör rotaya bağlandı; placeholder kaldırıldı.`

---

### Task 7: dokümantasyon + Debt

**Files:** Modify `.claude/docs/modules/timetable/completion_status.md` (+ README Last Updated).

- [ ] completion_status: ilerleme + ✅ 1B-2a editör çekirdeği + **Debt-FE-3** (bell→kademe eşlemesi: ilk/tek bell kullanıldı). 1B-2b kalanları ⏳.
- [ ] **Commit:** `2026-06-12 docs: timetable completion_status — Faz 1B-2a editör çekirdeği + Debt-FE-3.`

---

## Self-review
- Spec §9.2 çekirdek: grid (T3/T4), sürükle-yerleştir/taşı/sil (T2/T5), taslak kaydet (T4/T5), yan panel unplaced (T4), çakışma kırmızı (T2/T5), 409 reload (T2/T5), durum varyantları (T4/T5) → kapsanıyor. Öğretmen/derslik ata + blok + eksik-saat raporu + canlı precheck → 1B-2b (kapsam dışı, kasıtlı).
- Tenant: tüm key'ler `tenantScopedKey` (T1/T3).
- DRY: lookup join Hub deseni; `editorDerive` saf+test.
- Tip tutarlılığı: `PlaceLessonInput/MoveLessonInput`, `cellKey`, `resolveDrop`/`interpretConflict` task'lar arası tutarlı.
- Açık nokta: bell→kademe (T3'te ilk bell + Debt-FE-3); i18n çakışma kodları (T4'te bilinenler + generic fallback).
