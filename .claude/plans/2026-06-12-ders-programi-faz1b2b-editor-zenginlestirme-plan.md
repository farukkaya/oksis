# Ders Programı Faz 1B-2b — Editör Zenginleştirme Implementation Plan

> **For agentic workers:** Inline TDD. Steps use checkbox (`- [ ]`). Tasarım:
> `2026-06-12-ders-programi-faz1b2b-editor-zenginlestirme.md`. Spec §6/§7/§9.2.
> Handoff: `.claude/docs/modules/timetable/_handoff/`.

**Goal:** Editöre hücre bağlam menüsü (öğretmen/derslik yeniden ata + kaldır), blok ders
oluşturma (çoklu seçim + toolbar), canlı ön-kontrol (sürüklerken yeşil/kırmızı + sebep) ve
Doğrula çubuğu + eksik-saat paneli ("Hücreye git" flash) eklemek.

**Architecture:** Saf türev fonksiyonları `editorDerive.ts`'e eklenir (TDD); API/mutation
katmanı genişler; sunum `CellMenu` (Radix Popover, portal) + `ValidationBar` (sed-valbar)
+ blok-mod + GridCell zenginleştirme; orkestrasyon `ScheduleEditorPage`. Backend uçları hazır.

**Tech Stack:** React + TS · @dnd-kit/core · @radix-ui/react-popover · @tanstack/react-query · vitest.

**Backend gerçeği:** Kalıcı çakışma Faz 1'de oluşamaz (DB filtreli unique) → Doğrula çakışma
bölümü render edilir ama uyumaz; eksik-saat aktif. Bloğu böl backend'i yok → kapsam dışı (Debt).

---

### Task 1: types + api uçları (assignTeacher/assignRoom/setBlock/precheck)

**Files:** Modify `src/portals/admin/timetable/types.ts`, `api/timetableApi.ts`.

- [ ] **Step 1:** `types.ts`'e ekle:
```ts
/** `POST /programs/:id/precheck` yanıtı (ConflictResult). */
export interface PrecheckResult {
  ok: boolean;
  reason: string | null;
  warnings: string[];
}

export interface PrecheckInput {
  day: number;
  period: number;
  teacherId: string;
  roomId?: string | null;
}
```

- [ ] **Step 2:** `api/timetableApi.ts` import listesine `PrecheckInput, PrecheckResult` ekle ve metotları ekle (saveDraft'tan sonra):
```ts
  assignTeacher: async (id: string, pid: string, teacherId: string): Promise<void> => {
    await httpClient.put(`/timetable/programs/${id}/placements/${pid}/teacher`, { teacherId });
  },

  assignRoom: async (id: string, pid: string, roomId: string | null): Promise<void> => {
    await httpClient.put(`/timetable/programs/${id}/placements/${pid}/room`, { roomId });
  },

  setBlock: async (id: string, placementIds: string[]): Promise<void> => {
    await httpClient.post(`/timetable/programs/${id}/blocks`, { placementIds });
  },

  precheck: async (id: string, body: PrecheckInput, signal?: AbortSignal): Promise<PrecheckResult> => {
    const res = await httpClient.post<ApiEnvelope<PrecheckResult>>(
      `/timetable/programs/${id}/precheck`,
      body,
      { signal },
    );
    return res.data.data;
  },
```

- [ ] **Step 3:** `npm run build` derlenir.
- [ ] **Step 4: Commit:** `2026-06-12 feat: editör 1B-2b veri katmanı (teacher/room/block/precheck API uçları + tipler).`

---

### Task 2: editorDerive — deriveBlocks / deriveMissingCells / precheckKey (TDD)

**Files:** Modify `editor/lib/editorDerive.ts`, `editor/__tests__/editorDerive.test.ts`.

- [ ] **Step 1 — Failing test** (mevcut test dosyasının sonuna ekle):
```ts
import { deriveBlocks, deriveMissingCells, precheckKey } from "../lib/editorDerive";
import type { GridRow } from "../lib/editorDerive";

describe("deriveBlocks", () => {
  it("aynı blockGroupId'de min period = start, diğerleri cont", () => {
    const ps: PlacementDto[] = [
      { id: "a", day: 0, period: 1, subjectId: "s", teacherId: "t", roomId: null, isBlock: true, blockGroupId: "g1" },
      { id: "b", day: 0, period: 2, subjectId: "s", teacherId: "t", roomId: null, isBlock: true, blockGroupId: "g1" },
      { id: "c", day: 1, period: 1, subjectId: "s", teacherId: "t", roomId: null, isBlock: false, blockGroupId: null },
    ];
    const m = deriveBlocks(ps);
    expect(m.get("a")).toBe("start");
    expect(m.get("b")).toBe("cont");
    expect(m.get("c")).toBeUndefined();
  });
});

describe("deriveMissingCells", () => {
  const rows: GridRow[] = [
    { kind: "lesson", period: 1, start: "", end: "" },
    { kind: "break", label: "Teneffüs", lunch: false },
    { kind: "lesson", period: 2, start: "", end: "" },
  ];
  it("ders periyotlarındaki boş hücreleri day:period olarak döner (ara satırları hariç)", () => {
    const filled: PlacementDto = { id: "x", day: 0, period: 1, subjectId: "s", teacherId: "t", roomId: null, isBlock: false, blockGroupId: null };
    const cm = buildCellMap([filled]);
    const missing = deriveMissingCells(cm, rows, [0, 1]);
    // 2 gün × 2 ders periyodu = 4 hücre; 1 dolu → 3 boş
    expect(missing.sort()).toEqual(["0:2", "1:1", "1:2"]);
  });
});

describe("precheckKey", () => {
  it("slot+teacher+room birleşik anahtar; room null normalize", () => {
    expect(precheckKey(0, 1, "t1", null)).toBe("0:1:t1:-");
    expect(precheckKey(0, 1, "t1", "r1")).toBe("0:1:t1:r1");
  });
});
```

- [ ] **Step 2 — Run, expect fail:** `npm run test -- editorDerive`
- [ ] **Step 3 — Implement** `editor/lib/editorDerive.ts` sonuna ekle:
```ts
export type BlockRole = "start" | "cont";

/** blockGroupId grubunda en küçük period = start, diğerleri cont. Bloksuzlar haritada yer almaz. */
export function deriveBlocks(placements: PlacementDto[]): Map<string, BlockRole> {
  const groups = new Map<string, PlacementDto[]>();
  for (const p of placements) {
    if (!p.isBlock || !p.blockGroupId) continue;
    const arr = groups.get(p.blockGroupId) ?? [];
    arr.push(p);
    groups.set(p.blockGroupId, arr);
  }
  const roles = new Map<string, BlockRole>();
  for (const arr of groups.values()) {
    const sorted = [...arr].sort((a, b) => a.period - b.period);
    sorted.forEach((p, i) => roles.set(p.id, i === 0 ? "start" : "cont"));
  }
  return roles;
}

/** Bell ders periyotlarındaki boş hücreler (day:period). Faz 1: tüm ders periyotları zorunlu (Debt-FE-4). */
export function deriveMissingCells(cellMap: CellMap, gridRows: GridRow[], days: number[]): string[] {
  const periods = gridRows.filter((r): r is Extract<GridRow, { kind: "lesson" }> => r.kind === "lesson");
  const out: string[] = [];
  for (const d of days) {
    for (const r of periods) {
      const k = cellKey(d, r.period);
      if (!cellMap.has(k)) out.push(k);
    }
  }
  return out;
}

/** Precheck cache anahtarı: slot + teacher + room (null → "-"). */
export function precheckKey(day: number, period: number, teacherId: string, roomId: string | null | undefined): string {
  return `${day}:${period}:${teacherId}:${roomId ?? "-"}`;
}
```

- [ ] **Step 4 — Run, expect pass.**
- [ ] **Step 5 — Commit:** `2026-06-12 feat,test: editör türevleri (deriveBlocks/deriveMissingCells/precheckKey).`

---

### Task 3: mutation hook'ları (assignTeacher/assignRoom/setBlock)

**Files:** Modify `editor/hooks/useEditorMutations.ts`.

- [ ] **Step 1 — Implement** `useEditorMutations`'a ekle (remove'dan sonra, return'den önce):
```ts
  const assignTeacher = useMutation<void, unknown, { pid: string; teacherId: string }>({
    mutationFn: ({ pid, teacherId }) => timetableApi.assignTeacher(programId, pid, teacherId),
    onSuccess: invalidate,
  });

  const assignRoom = useMutation<void, unknown, { pid: string; roomId: string | null }>({
    mutationFn: ({ pid, roomId }) => timetableApi.assignRoom(programId, pid, roomId),
    onSuccess: invalidate,
  });

  const setBlock = useMutation<void, unknown, string[]>({
    mutationFn: (placementIds) => timetableApi.setBlock(programId, placementIds),
    onSuccess: invalidate,
  });
```
return satırını güncelle: `return { place, move, remove, saveDraft, assignTeacher, assignRoom, setBlock };`

- [ ] **Step 2:** `npm run build` derlenir.
- [ ] **Step 3 — Commit:** `2026-06-12 feat: editör mutation'ları (assignTeacher/assignRoom/setBlock).`

---

### Task 4: usePrecheck hook (debounce + cache)

**Files:** Create `editor/hooks/usePrecheck.ts`.

- [ ] **Step 1 — Implement:**
```ts
// src/portals/admin/timetable/editor/hooks/usePrecheck.ts
import { useCallback, useRef, useState } from "react";
import { timetableApi } from "../../api/timetableApi";
import { precheckKey } from "../lib/editorDerive";

export interface DropState {
  key: string; // "day:period"
  ok: boolean;
  reason: string | null;
}

/** Drag sırasında hedef hücre için occupancy ön-kontrolü; (slot,teacher,room) cache'li. */
export function usePrecheck(programId: string) {
  const [drop, setDrop] = useState<DropState | null>(null);
  const cache = useRef<Map<string, { ok: boolean; reason: string | null }>>(new Map());
  const reqId = useRef(0);

  const check = useCallback(
    (day: number, period: number, teacherId: string, roomId: string | null) => {
      const ck = precheckKey(day, period, teacherId, roomId);
      const cellK = `${day}:${period}`;
      const cached = cache.current.get(ck);
      if (cached) {
        setDrop({ key: cellK, ok: cached.ok, reason: cached.reason });
        return;
      }
      const my = ++reqId.current;
      // İyimser: yanıt gelene dek yeşil göster
      setDrop({ key: cellK, ok: true, reason: null });
      void timetableApi
        .precheck(programId, { day, period, teacherId, roomId })
        .then((r) => {
          cache.current.set(ck, { ok: r.ok, reason: r.reason });
          if (my === reqId.current) setDrop({ key: cellK, ok: r.ok, reason: r.reason });
        })
        .catch(() => {
          /* ağ hatasında engelleme yok; drop anında DB backstop reddeder */
        });
    },
    [programId],
  );

  const clear = useCallback(() => {
    reqId.current += 1;
    setDrop(null);
  }, []);

  return { drop, check, clear };
}
```

- [ ] **Step 2:** `npm run build` derlenir.
- [ ] **Step 3 — Commit:** `2026-06-12 feat: editör canlı ön-kontrol hook'u (precheck + cache).`

---

### Task 5: CellMenu (Radix Popover) — öğretmen/derslik değiştir + kaldır

**Files:** Create `editor/components/CellMenu.tsx`. Önce oku: `src/app/components/ui/` altında popover wrapper var mı (`ls`); yoksa Radix primitive doğrudan kullan.

- [ ] **Step 1 — Implement** `editor/components/CellMenu.tsx` (Radix Popover, portal'lı):
```tsx
import { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { useTranslation } from "react-i18next";
import { User, MapPin, Trash2, ChevronRight, Check } from "lucide-react";
import type { NameLookups, PlacementDto } from "../../types";

interface Props {
  placement: PlacementDto;
  lookups: NameLookups;
  onAssignTeacher: (teacherId: string) => void;
  onAssignRoom: (roomId: string | null) => void;
  onRemove: () => void;
}

/** Dolu hücre bağlam menüsü: Öğretmen değiştir › / Derslik değiştir › / Kaldır. Trigger `cc-more` ⋯. */
export function CellMenu({ placement, lookups, onAssignTeacher, onAssignRoom, onRemove }: Props) {
  const { t } = useTranslation("timetable");
  const [open, setOpen] = useState(false);
  const [sub, setSub] = useState<null | "teacher" | "room">(null);

  const close = () => { setOpen(false); setSub(null); };

  return (
    <Popover.Root open={open} onOpenChange={(o) => { setOpen(o); if (!o) setSub(null); }}>
      <Popover.Trigger asChild>
        <button type="button" className="cc-more" aria-label={t("editor.cellMenu.open")}
          onClick={(e) => e.stopPropagation()}>
          <span aria-hidden>⋯</span>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content className="sed-cmenu" align="end" sideOffset={4} onClick={(e) => e.stopPropagation()}>
          {sub === "teacher" ? (
            <div className="sed-cmenu-sub">
              <div className="h">{t("editor.cellMenu.pickTeacher")}</div>
              {[...lookups.teachers].map(([id, name]) => (
                <button key={id} type="button"
                  className={"sed-cmenu-opt" + (id === placement.teacherId ? " on" : "")}
                  onClick={() => { onAssignTeacher(id); close(); }}>
                  {name}
                  {id === placement.teacherId && <Check size={14} className="ck" />}
                </button>
              ))}
            </div>
          ) : sub === "room" ? (
            <div className="sed-cmenu-sub">
              <div className="h">{t("editor.cellMenu.pickRoom")}</div>
              <button type="button" className={"sed-cmenu-opt" + (!placement.roomId ? " on" : "")}
                onClick={() => { onAssignRoom(null); close(); }}>
                {t("editor.cellMenu.noRoom")}
                {!placement.roomId && <Check size={14} className="ck" />}
              </button>
              {[...lookups.rooms].map(([id, name]) => (
                <button key={id} type="button"
                  className={"sed-cmenu-opt" + (id === placement.roomId ? " on" : "")}
                  onClick={() => { onAssignRoom(id); close(); }}>
                  <MapPin size={14} /> {name}
                  {id === placement.roomId && <Check size={14} className="ck" />}
                </button>
              ))}
            </div>
          ) : (
            <>
              <button type="button" className="sed-cmenu-item" onClick={() => setSub("teacher")}>
                <User size={15} /> {t("editor.cellMenu.changeTeacher")} <ChevronRight size={14} className="chev" />
              </button>
              <button type="button" className="sed-cmenu-item" onClick={() => setSub("room")}>
                <MapPin size={15} /> {t("editor.cellMenu.changeRoom")} <ChevronRight size={14} className="chev" />
              </button>
              <div className="sed-cmenu-sep" />
              <button type="button" className="sed-cmenu-item danger" onClick={() => { onRemove(); close(); }}>
                <Trash2 size={15} /> {t("editor.cellMenu.remove")}
              </button>
            </>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
```

- [ ] **Step 2:** `npm run build` derlenir (Radix popover importu çözülür).
- [ ] **Step 3 — Commit:** `2026-06-12 feat: editör hücre bağlam menüsü (CellMenu — öğretmen/derslik değiştir + kaldır).`

---

### Task 6: GridCell zenginleştirme (CellMenu + blok + drop precheck + seçim)

**Files:** Modify `editor/components/GridCell.tsx`.

- [ ] **Step 1 — Implement** `GridCell.tsx`'i güncelle. Yeni props ve davranışlar:
  - `blockRole?: "start" | "cont"` → `block-start`/`block-cont` sınıfı + "BLOK" etiketi (cont'ta meta gizli).
  - `dropState?: { ok: boolean; reason: string | null }` → boş hücrede `drop-ok`/`drop-bad` + `drop-tip` (reason). `flash` (accent) "hücreye git" için.
  - `selectMode?: boolean`, `selected?: boolean`, `onToggleSelect?: (pid) => void` → blok modunda dolu hücre tıklanınca seçim toggle (menü açmaz); `selected` → `is-selected` sınıfı.
  - dolu hücrede `CellMenu` (selectMode kapalıyken) — `onAssignTeacher/onAssignRoom/onRemove` proplarından.
```tsx
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { MapPin, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "../../../../../lib/utils";
import { cellKey, subjectColorClass, type BlockRole } from "../lib/editorDerive";
import { CellMenu } from "./CellMenu";
import type { NameLookups, PlacementDto } from "../../types";

interface Props {
  day: number;
  period: number;
  placement: PlacementDto | undefined;
  lookups: NameLookups;
  flash: boolean;
  blockRole?: BlockRole;
  dropState?: { ok: boolean; reason: string | null } | null;
  selectMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (pid: string) => void;
  onAssignTeacher: (pid: string, teacherId: string) => void;
  onAssignRoom: (pid: string, roomId: string | null) => void;
  onRemove: (pid: string) => void;
}

export function GridCell({
  day, period, placement, lookups, flash, blockRole, dropState,
  selectMode, selected, onToggleSelect, onAssignTeacher, onAssignRoom, onRemove,
}: Props) {
  const { t } = useTranslation("timetable");
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: `cell:${day}:${period}` });
  const { setNodeRef: setDragRef, listeners, attributes, isDragging } = useDraggable({
    id: `placement:${placement?.id ?? cellKey(day, period)}`,
    disabled: !placement || selectMode,
  });

  const subjectName = placement ? (lookups.subjects.get(placement.subjectId) ?? "—") : "";
  const teacherName = placement ? (lookups.teachers.get(placement.teacherId) ?? "—") : "";
  const roomCode = placement?.roomId ? lookups.rooms.get(placement.roomId) : null;
  const colorClass = placement ? subjectColorClass(placement.subjectId) : "";

  return (
    <div
      ref={setDropRef}
      className={cn(
        "sed-cell",
        placement ? "filled" : "empty",
        colorClass,
        blockRole === "start" && "block-start",
        blockRole === "cont" && "block-cont",
        isOver && !dropState && "over",
        isDragging && "dragging",
        dropState && (dropState.ok ? "drop-ok" : "drop-bad"),
        selected && "is-selected",
        flash && "flash",
      )}
      onClick={
        placement && selectMode && onToggleSelect
          ? () => onToggleSelect(placement.id)
          : undefined
      }
    >
      {placement ? (
        <>
          <div ref={setDragRef} className="cc-grab" {...listeners} {...attributes}>
            <span className="cc-name">{subjectName}</span>
            {blockRole !== "cont" && <span className="cc-meta">{teacherName}</span>}
            {blockRole !== "cont" && roomCode && (
              <span className="cc-room"><MapPin size={11} />{roomCode}</span>
            )}
          </div>
          {blockRole && <span className="block-tag">BLOK</span>}
          {!selectMode && (
            <CellMenu
              placement={placement}
              lookups={lookups}
              onAssignTeacher={(tid) => onAssignTeacher(placement.id, tid)}
              onAssignRoom={(rid) => onAssignRoom(placement.id, rid)}
              onRemove={() => onRemove(placement.id)}
            />
          )}
        </>
      ) : (
        <>
          {dropState?.reason && (
            <div className={cn("drop-tip", dropState.ok && "ok")}>
              {t(dropState.reason.replace(/^timetable\./, ""), { defaultValue: t("errors.generic") })}
            </div>
          )}
          <div className="cc-empty">
            <Clock size={15} />
            <span className="e1">{t("editor.cellEmpty")}</span>
            <span className="e2">{t("editor.cellWaiting")}</span>
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2:** `npm run build` — WeekGrid'in GridCell çağrısı yeni zorunlu proplar nedeniyle Task 7'de güncellenene dek hata verir; Task 7 ile birlikte derlenir.
- [ ] **Step 3 — Commit (Task 7 ile birlikte):** bu task tek başına commit edilmez; Task 7'nin sonunda.

---

### Task 7: WeekGrid prop geçişi + ScheduleEditorPage orkestrasyonu (TDD)

**Files:** Modify `editor/components/WeekGrid.tsx`, `ScheduleEditorPage.tsx`, `editor/__tests__/ScheduleEditorPage.test.tsx`.

- [ ] **Step 1 — WeekGrid.tsx:** Props'a ekle ve GridCell'e geçir:
```ts
interface Props {
  days: number[];
  gridRows: GridRow[];
  cellMap: CellMap;
  lookups: NameLookups;
  flashKey: string | null;
  blockRoles: Map<string, import("../lib/editorDerive").BlockRole>;
  dropState: { key: string; ok: boolean; reason: string | null } | null;
  selectMode: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (pid: string) => void;
  onAssignTeacher: (pid: string, teacherId: string) => void;
  onAssignRoom: (pid: string, roomId: string | null) => void;
  onRemove: (pid: string) => void;
}
```
GridCell çağrısına ekle (mevcut props + ):
```tsx
                  blockRole={cellMap.get(cellKey(d, row.period)) ? blockRoles.get(cellMap.get(cellKey(d, row.period))!.id) : undefined}
                  dropState={dropState?.key === cellKey(d, row.period) ? { ok: dropState.ok, reason: dropState.reason } : null}
                  selectMode={selectMode}
                  selected={(() => { const p = cellMap.get(cellKey(d, row.period)); return p ? selectedIds.has(p.id) : false; })()}
                  onToggleSelect={onToggleSelect}
                  onAssignTeacher={onAssignTeacher}
                  onAssignRoom={onAssignRoom}
```
(`onRemove` zaten var.)

- [ ] **Step 2 — ScheduleEditorPage failing test:** `editor/__tests__/ScheduleEditorPage.test.tsx`'e ekle. `useEditorData`/`useEditorMutations` mock'lu. Yeni davranışlar:
```tsx
it("Doğrula → eksik-saat paneli açılır ve sorun sayısını gösterir", async () => {
  // boş program + 2 ders periyotlu grid → eksik hücreler > 0
  // (mock useEditorData: gridRows 1 lesson period, days [0,1], program.placements [])
  renderPage();
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: /Doğrula/i }));
  expect(screen.getByText(/sorun/i)).toBeInTheDocument();
  expect(screen.getAllByText(/Hücreye git/i).length).toBeGreaterThan(0);
});

it("Blok modu → iki hücre seç → Blok oluştur setBlock.mutate çağırır", async () => {
  // mock: program 2 dolu bitişik hücre (0-1, 0-2)
  renderPage();
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: /Blok modu/i }));
  await user.click(screen.getByText("Matematik")); // 0-1 hücresi
  await user.click(screen.getByText("Fen")); // 0-2 hücresi
  await user.click(screen.getByRole("button", { name: /Blok oluştur/i }));
  expect(setBlockMock).toHaveBeenCalledWith(["pl1", "pl2"]);
});
```
> Not: Mevcut test mock yapısına (`useEditorData`/`useEditorMutations` mock'ları) uydur; setBlockMock'u `useEditorMutations` mock'una ekle. Eksik-saat testi için mock gridRows'a ≥1 lesson period ve days ver.

- [ ] **Step 3 — Run, expect fail.**

- [ ] **Step 4 — Implement** `ScheduleEditorPage.tsx`:
  - `usePrecheck(id)` → `drop, check, clear`.
  - `useEditorMutations`'tan `assignTeacher, assignRoom, setBlock` al.
  - `blockRoles = useMemo(() => deriveBlocks(data.program?.placements ?? []), [data.program])`.
  - `missingCells = useMemo(() => deriveMissingCells(cellMap, data.gridRows, data.days), [cellMap, data.gridRows, data.days])`.
  - State: `verifyOpen`, `selectMode`, `selectedIds: Set<string>`.
  - `handleDragOver(e)`: `e.over` cell ise → sürüklenen öğenin teacher/room'unu çöz (unplaced çip → teacherId; placement → o placement'ın teacher/room) → boş hücreyse `check(day, period, teacherId, roomId ?? null)`; değilse `clear()`.
  - `handleDragEnd`: mevcut + `clear()`.
  - `flashTo(day, period)`: `setFlashKey(cellKey)` + ilgili hücreye `scrollIntoView` (querySelector `[data-... ]` yerine `cellRef` map veya `document.getElementById`); flash ~1.4s sonra temizle. (Hücreye `id={"cell-"+cellKey}` ekle — WeekGrid/GridCell'e `data-cell` veya id ver.)
  - Blok modu: toolbar/blok-bar; `onToggleSelect(pid)` → selectedIds set; "Blok oluştur" → `setBlock.mutate([...selectedIds], { onError: 409 → toast })` başarıda `setSelectMode(false); setSelectedIds(new Set())`.
  - Doğrula: `EditorToolbar`/`ValidationBar`'daki Doğrula → `setVerifyOpen(o => !o)`.
  - `ValidationBar` (Task 8) render: `missingCells`, `conflicts=[]` (Faz 1 boş), `verifyOpen`, `onToggleVerify`, `onGotoCell={flashTo}`.
  - DragOverlay + DndContext'e `onDragOver={handleDragOver}`.
  - WeekGrid'e yeni proplar geçir.
  - `onAssignTeacher/onAssignRoom`: ilgili mutate + `onError` 409 → `flash + toast` (mevcut `onError` deseni).

  > Bu büyük adım; mevcut `ScheduleEditorPage.tsx` (165 satır) üzerine kurulur. `flashTo` için hücreye stabil id ver: GridCell sarmalına `data-cell={cellKey(day,period)}` ekle (WeekGrid'de) ve `mainRef.current.querySelector('[data-cell="..."]').scrollIntoView({behavior:"smooth", block:"center"})`.

- [ ] **Step 5 — Run, expect pass:** `npm run test -- ScheduleEditorPage`
- [ ] **Step 6 — Commit:** `2026-06-12 feat,test: editör orkestrasyonu — canlı precheck + hücre menüsü + blok modu + Doğrula paneli.`

---

### Task 8: ValidationBar (sed-valbar + sed-issues) + EditorToolbar Doğrula etkin

**Files:** Create `editor/components/ValidationBar.tsx`; Modify `editor/components/EditorToolbar.tsx` (Doğrula enable); `ScheduleEditorPage.tsx` (EditorFooter → ValidationBar). Delete `editor/components/EditorFooter.tsx`.

- [ ] **Step 1 — Implement** `editor/components/ValidationBar.tsx`:
```tsx
import { useTranslation } from "react-i18next";
import { CheckCircle2, Clock, AlertTriangle, ShieldCheck, ArrowRight } from "lucide-react";
import { cn } from "../../../../../lib/utils";

export interface IssueRow {
  cellKey: string; // "day:period"
  day: number;
  period: number;
  kind: "bad" | "warn";
  title: string;
  sub: string;
}

interface Props {
  missingCount: number;
  conflictCount: number;
  issues: IssueRow[];
  verifyOpen: boolean;
  onToggleVerify: () => void;
  onGotoCell: (day: number, period: number) => void;
}

/** Alt doğrulama çubuğu: açılır sorun paneli + durum pill'leri + legend + Doğrula. */
export function ValidationBar({ missingCount, conflictCount, issues, verifyOpen, onToggleVerify, onGotoCell }: Props) {
  const { t } = useTranslation("timetable");
  const clean = missingCount === 0 && conflictCount === 0;

  return (
    <div className="sed-valbar">
      {verifyOpen && (
        <div className="sed-issues">
          <div className="sed-issues-h">{t("editor.validatePanel.title", { count: issues.length })}</div>
          {clean ? (
            <div className="sed-issue-ok"><CheckCircle2 size={18} /> {t("editor.validatePanel.clean")}</div>
          ) : (
            issues.map((it) => (
              <button key={it.cellKey} type="button" className={cn("sed-issue", it.kind)}
                onClick={() => onGotoCell(it.day, it.period)}>
                <span className="ii">{it.kind === "bad" ? <AlertTriangle size={16} /> : <Clock size={16} />}</span>
                <span className="it"><span className="t">{it.title}</span><span className="s">{it.sub}</span></span>
                <span className="go">{t("editor.validatePanel.goToCell")} <ArrowRight size={13} /></span>
              </button>
            ))
          )}
        </div>
      )}
      <div className="sed-valbar-main">
        <div className="sed-status">
          {conflictCount > 0 && (
            <span className="pill bad"><AlertTriangle size={15} /> {t("editor.conflictCount", { count: conflictCount })}</span>
          )}
          {missingCount > 0 && (
            <span className="pill warn"><Clock size={15} /> {t("editor.missingHours", { count: missingCount })}</span>
          )}
          {clean && <span className="pill ok"><CheckCircle2 size={15} /> {t("editor.ready")}</span>}
        </div>
        <div className="sed-val-grow" />
        <div className="sed-legend">
          <span className="sed-leg ok"><span className="sw" /> {t("editor.legendOk")}</span>
          <span className="sed-leg bad"><span className="sw" /> {t("editor.legendConflict")}</span>
          <span className="sed-leg warn"><span className="sw" /> {t("editor.legendEmpty")}</span>
          <span className="sed-leg lock"><span className="sw" /> {t("editor.legendUnavailable")}</span>
        </div>
        <button type="button" className={cn("sed-doverify", verifyOpen && "on")} onClick={onToggleVerify}>
          <ShieldCheck size={16} /> {t("editor.validate")}
          {!clean && <span style={{ fontWeight: 800 }}> · {issues.length}</span>}
        </button>
      </div>
    </div>
  );
}
```
> Not: tek inline `style` (font-weight) yerine css sınıfı tercih et — `editor.css`'e `.sed-doverify .cnt{font-weight:800}` ekleyip `<span className="cnt">` kullan (web kuralı: inline style yasak).

- [ ] **Step 2 — EditorToolbar.tsx:** Props'a `onValidate: () => void` ve `verifyOpen: boolean` ekle; Doğrula butonunu etkinleştir:
```tsx
          <button type="button" className={cn("btn btn-ghost", verifyOpen && "active")} onClick={onValidate}>
            <ShieldCheck size={16} /> {t("editor.validate")}
          </button>
```
(disabled/`soonPhase2` kaldırılır; Yayınla disabled kalır.)

- [ ] **Step 3 — ScheduleEditorPage.tsx:** `EditorFooter` yerine `ValidationBar` kullan; `issues` türet:
```ts
const issues: IssueRow[] = missingCells.map((k) => {
  const [d, p] = k.split(":").map(Number);
  return { cellKey: k, day: d, period: p, kind: "warn",
    title: t("editor.validatePanel.missingTitle", { day: t(`editor.weekdays.${d}`), period: p }),
    sub: t("editor.validatePanel.missingSub") };
});
```
EditorToolbar'a `verifyOpen`+`onValidate={() => setVerifyOpen(o=>!o)}` geçir.

- [ ] **Step 4:** `EditorFooter.tsx` sil.
- [ ] **Step 5:** `npm run build` + `npm run test -- ScheduleEditorPage` yeşil.
- [ ] **Step 6 — Commit:** `2026-06-12 feat: editör doğrulama çubuğu (ValidationBar + Doğrula etkin + eksik-saat paneli).`

---

### Task 9: editor.css — yeni sınıflar (cmenu/valbar/issues/drop/flash/block/selection)

**Files:** Modify `editor/editor.css`. Handoff `_handoff/schedule_editor.css`'ten ilgili blokları uyarlayarak ekle (token isimleri mevcut editor.css ile aynı). Eklenecekler (mevcut olmayanlar):

- [ ] **Step 1 — Ekle:** `.sed-cmenu`, `.sed-cmenu-item`(+`.danger`,`.chev`), `.sed-cmenu-sep`, `.sed-cmenu-sub`(+`.h`), `.sed-cmenu-opt`(+`.on`,`.ck`) — handoff satır 193-212.
- [ ] **Step 2 — Ekle:** `.sed-valbar`, `.sed-valbar-main`, `.sed-status`, `.sed-status .pill`(+ok/bad/warn) — handoff 214-223. (mevcut `.sed-footer` korunur ya da kaldırılır; ValidationBar `.sed-valbar` kullanır.)
- [ ] **Step 3 — Ekle:** `.sed-issues`, `.sed-issues-h`, `.sed-issue`(+bad/warn,`.ii`,`.it`,`.go`), `.sed-issue-ok` — handoff 238-250.
- [ ] **Step 4 — Ekle:** `.sed-cell.drop-ok`, `.drop-bad`, `.drop-tip`(+ok,::after) — handoff 174-187. (`transl` yazım hatasını düzelt → `translate`.)
- [ ] **Step 5 — Ekle:** `.sed-cell.flash` + `@keyframes sed-flash` — handoff 190-191.
- [ ] **Step 6 — Ekle:** `.sed-cell.block-start`, `.block-cont`(+cc-name), `.block-tag` — handoff 156-160.
- [ ] **Step 7 — Ekle:** `.sed-cell.conflict`(+cc-name,.cf) — handoff 163-168 (Faz 1'de uyumaz ama hazır).
- [ ] **Step 8 — Ekle:** seçim vurgusu: `.sed-cell.is-selected { box-shadow: 0 0 0 2px var(--accent-bright); border-color: var(--accent-bright); }`.
- [ ] **Step 9 — Ekle:** `.sed-doverify .cnt { font-weight: 800; }` (inline style yerine).
- [ ] **Step 10:** `npm run build` temiz.
- [ ] **Step 11 — Commit:** `2026-06-12 feat: editör 1B-2b stilleri (cmenu/valbar/issues/drop/flash/block/selection).`

---

### Task 10: i18n anahtarları (tr + en)

**Files:** Modify `src/shared/i18n/locales/{tr,en}/timetable.json`.

- [ ] **Step 1 — tr** `timetable.editor`'a ekle:
```json
"cellMenu": {
  "open": "Hücre menüsü", "changeTeacher": "Öğretmen değiştir", "changeRoom": "Derslik değiştir",
  "pickTeacher": "Öğretmen seç", "pickRoom": "Derslik seç", "noRoom": "Derslik yok", "remove": "Kaldır"
},
"blockMode": { "enter": "Blok modu", "exit": "Çık", "create": "Blok oluştur", "selected": "{{count}} hücre seçili", "hint": "Aynı gün ardışık ≥2 hücre seçin." },
"validatePanel": {
  "title": "Doğrulama · {{count}} sorun", "clean": "Sorun yok — program temiz.",
  "goToCell": "Hücreye git", "missingTitle": "Eksik saat · {{day}} · {{period}}. ders", "missingSub": "Boş bırakıldı — bir ders yerleştirin"
},
"conflictCount": "{{count}} çakışma",
"blockCreated": "Blok ders oluşturuldu",
"reassigned": "Güncellendi"
```
- [ ] **Step 2 — tr** `timetable.errors`'a gerçek backend kodlarını ekle:
```json
"class-slot-occupied": "Bu sınıf o saatte zaten dolu.",
"teacher-slot-occupied": "Öğretmen o saatte başka bir sınıfta meşgul.",
"room-slot-occupied": "Derslik o saatte başka bir sınıfta kullanılıyor.",
"block-needs-two": "Blok ders en az 2 ardışık saatten oluşmalı.",
"block-same-day": "Blok dersin saatleri aynı günde olmalı.",
"block-consecutive": "Blok dersin saatleri ardışık olmalı.",
"invalid-period": "Geçersiz ders saati.",
"placement-not-found": "Yerleşim bulunamadı."
```
- [ ] **Step 3 — en:** Aynı anahtarların İngilizce karşılıkları (`en/timetable.json` ilgili bloklara).
- [ ] **Step 4:** `npm run build` + `npm run test` tam paket yeşil.
- [ ] **Step 5 — Commit:** `2026-06-12 feat: editör 1B-2b i18n anahtarları (hücre menüsü/blok/doğrulama/hata kodları, tr+en).`

---

### Task 11: dokümantasyon + Debt

**Files:** Modify `.claude/docs/modules/timetable/completion_status.md` (+ README Last Updated).

- [ ] **Step 1 — completion_status:** ilerleme bar'ı (%70 → ~%80) + Güncel tarih; ✅'a "Faz 1B-2b editör zenginleştirme" (hücre menüsü teacher/room ata + kaldır, blok oluştur çoklu-seçim, canlı precheck §6, Doğrula paneli + Hücreye git flash); ⏳'dan 1B-2b satırını kaldır; ⚠️'a **Debt-FE-4** (hücre-bazlı eksik modeli; mandatory/optional period ayrımı yok — tüm ders periyotları zorunlu sayıldı) + **Bloğu böl backend'i yok → menüden çıkarıldı**.
- [ ] **Step 2 — README:** `Last Updated` bump.
- [ ] **Step 3 — Commit:** `2026-06-12 docs: timetable completion_status — Faz 1B-2b editör zenginleştirme + Debt-FE-4.`

---

## Self-review
- Spec §9.2 kapsamı: öğretmen/derslik ata (T1/T3/T5/T6), blok (T1/T2/T3/T7), canlı precheck §6/§7 (T1/T4/T6/T7), Doğrula + eksik-saat paneli + Hücreye git (T2/T7/T8), legend/pill (T8) → kapsanıyor. Bloğu böl + öğretmen görünümü + yayınla bilinçli kapsam dışı (A/C kararı).
- Backend gerçeği: kalıcı çakışma yok (DB unique) → conflicts=[] sabit, panel eksik-saat odaklı; precheck'te geçici çakışma drop-bad. Belgelendi.
- Tenant: yeni precheck/mutation'lar `programId` üzerinden; React Query key'leri değişmedi (mevcut tenant-scope'lu key'ler invalidate edilir).
- Tip tutarlılığı: `PrecheckResult/PrecheckInput`, `BlockRole`, `DropState`, `IssueRow`, `deriveBlocks/deriveMissingCells/precheckKey` task'lar arası tutarlı.
- İnline style: ValidationBar'daki font-weight → `.cnt` sınıfı (T8 not + T9/Step9). UnplacedPanel'deki mevcut `style={{width}}` progress bar dışında inline yok.
- Açık nokta: blok modu UI handoff'ta yok (kullanıcı Q2 kararı çoklu-seçim) — toolbar "Blok modu" toggle + grid seçim; handoff'un CellMenu blok-oluşturma yerine bu kullanılır.
