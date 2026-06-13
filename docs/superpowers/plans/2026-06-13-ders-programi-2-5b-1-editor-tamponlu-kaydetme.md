# Ders Programı 2.5B-1 — Editör Tamponlu Kaydetme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Editörü "her aksiyonda anında sunucuya yaz" modelinden, tasarımdaki **tamponlu (buffered) Kaydet** modeline geçir: değişiklikler yerel tutulur, "Kaydet" disabled/dirty-dot/saving/saved durumlarıyla çalışır, Kaydet'e basınca biriken değişiklikler sunucuya yazılır, kaydetmeden çıkışta uyarı verilir (Kaydet ve Çık seçeneğiyle).

**Architecture:** Editör artık sunucu yerleşimlerinden değil, saf bir **draft buffer**'dan render eder: `foldOps(baseline, ops)`. `baseline` = sunucudaki son hâl; `ops` = kullanıcının yaptığı sıralı işlemler (place/move/remove/assignTeacher/assignRoom/setBlock). Sürükle-bırak ve hücre menüsü aksiyonları **sunucuya gitmez**, yalnız `ops`'a eklenir. "Kaydet" op-log'unu **kullanıcı aksiyon sırasıyla** mevcut endpoint'lere replay eder (yeni yerleşimler için temp-id → gerçek-id eşlemesiyle), başarıda program/unplaced refetch edilir (yeni baseline, ops sıfırlanır). `isDirty = ops.length > 0`. Çıkış koruması React Router 7 `useBlocker` (data router) + `beforeunload` ile.

**Tech Stack:** React 18 + TS strict · Vitest + Testing Library · @dnd-kit/core · TanStack React Query v5 · React Router 7.13 (data router) · i18next (tr/en).

---

## Neden op-log replay (yeni backend ucu YOK)

`resolveDrop` dolu hücreye bırakmayı zaten reddediyor (`editor/lib/editorDerive.ts:29`) → editörde **her taşıma boş hücreye** yapılır, takas (swap) tek hamlede mümkün değil. Bu nedenle op-log'u **kullanıcı aksiyon sırasıyla** sunucuya replay etmek doğru sonuç verir (ara durumda sınıf-slot çakışması oluşmaz). Mevcut (yayınlanmış snapshot'taki) yerleşimlerin id'leri move/assign'da korunur; yalnız **yeni eklenen** dersler flush'ta gerçek id alır — bunlar zaten geçici-değişiklik (2.5B-2) hedefi olamaz. Dolayısıyla:

- **Backend değişikliği yok** (atomik batch `POST /draft/apply` = gelecekteki **debt**).
- **Kabul edilen sınır (debt):** Flush sırasında bir op çakışmayla (409) reddedilirse, o op ve sonrası uygulanmaz; buffer sunucu gerçeğine resetlenir (uygulanmış op'lar kalıcı olur, uygulanmamışlar kullanıcı tarafından tekrar yapılır). Çakışmalar drop anında (dolu hücre engeli + precheck uyarısı) büyük ölçüde önlendiğinden bu yol nadirdir. `completion_status`'a debt olarak yazılır.

## Spec uyumu (Kural #6)

Bu dilim spec'in **çakışma modelini değiştirmez**: öğretmen/derslik/sınıf tekilliği **katı (engelleyici)** kalır; spec §7'deki "yetkili doğrulama Place/Save anında" ifadesi artık **Kaydet (flush) anında** sunucu komutu + DB filtreli unique backstop ile karşılanır. Çakışmayı "yalnız yayına engel" yapma talebi **kapsam dışı** (kullanıcı 2026-06-13 geri çekti).

## File Structure

**Create:**
- `oksis-web/src/portals/admin/timetable/editor/lib/editorDraft.ts` — saf draft modeli: op tipleri, `initDraft`, reducer'lar (`applyPlace/Move/Remove/AssignTeacher/AssignRoom/SetBlock`), `foldOps`, `isDirty`, `resetDraft`, `executeFlush` (api enjekte edilir).
- `oksis-web/src/portals/admin/timetable/editor/lib/__tests__/editorDraft.test.ts` — saf modül birim testleri.
- `oksis-web/src/portals/admin/timetable/editor/hooks/useEditorDraft.ts` — `useReducer` ile draft state + flush orkestrasyonu (timetableApi replay + React Query invalidation) + `saving`/`saved`/`flushError` durumları.
- `oksis-web/src/portals/admin/timetable/editor/components/LeaveGuardDialog.tsx` — kaydedilmemiş değişiklik diyaloğu (Kaydet ve Çık / Kaydetmeden Çık / Vazgeç).

**Modify:**
- `oksis-web/src/portals/admin/timetable/ScheduleEditorPage.tsx` — draft'tan render; aksiyonlar → draft reducer'ları; Kaydet → flush; `useBlocker` + `beforeunload` çıkış koruması.
- `oksis-web/src/portals/admin/timetable/editor/components/EditorToolbar.tsx` — Kaydet: clean iken disabled, dirty iken turuncu nokta; saving/saved durumları (mevcut prop'lar genişler).
- `oksis-web/src/portals/admin/timetable/editor/hooks/useEditorMutations.ts` — **silinir** (artık per-aksiyon mutasyon yok; replay `editorDraft.executeFlush` içinde).
- `oksis-web/src/shared/i18n/locales/tr/timetable.json` + `.../en/timetable.json` — `editor.save` → "Kaydet"/"Save", `editor.saved` → "Kaydedildi"/"Saved", yeni `editor.unsavedAria`, `editor.saveFailed`, `editor.leave.*`.
- `oksis-web/src/portals/admin/timetable/editor/__tests__/ScheduleEditorPage.test.tsx` — data router'a (`createMemoryRouter`+`RouterProvider`) taşı; tamponlu davranış assertion'ları.
- `.claude/docs/modules/timetable/completion_status.md` — 2.5B-1 tamamlandı + Debt-FE-5 ilerleme + debt notları.

---

### Task 1: Saf draft modeli — tipler, init, reducer'lar, foldOps, isDirty, resetDraft

**Files:**
- Create: `oksis-web/src/portals/admin/timetable/editor/lib/editorDraft.ts`
- Test: `oksis-web/src/portals/admin/timetable/editor/lib/__tests__/editorDraft.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// editor/lib/__tests__/editorDraft.test.ts
import { describe, it, expect } from "vitest";
import {
  initDraft,
  applyPlace,
  applyMove,
  applyRemove,
  applyAssignTeacher,
  applyAssignRoom,
  applySetBlock,
  foldOps,
  isDirty,
  resetDraft,
} from "../editorDraft";
import type { PlacementDto } from "../../../types";

const p = (over: Partial<PlacementDto>): PlacementDto => ({
  id: "r1", day: 0, period: 1, subjectId: "s1", teacherId: "t1",
  roomId: null, isBlock: false, blockGroupId: null, ...over,
});

describe("editorDraft", () => {
  it("initDraft → temiz, dirty değil, fold = baseline", () => {
    const base = [p({ id: "r1" })];
    const d = initDraft(base);
    expect(isDirty(d)).toBe(false);
    expect(foldOps(d)).toEqual(base);
  });

  it("applyPlace → temp id'li yerleşim ekler, dirty olur", () => {
    let d = initDraft([]);
    d = applyPlace(d, { day: 1, period: 2, subjectId: "s2", teacherId: "t2", roomId: null });
    expect(isDirty(d)).toBe(true);
    const folded = foldOps(d);
    expect(folded).toHaveLength(1);
    expect(folded[0].id).toMatch(/^tmp:/);
    expect(folded[0]).toMatchObject({ day: 1, period: 2, subjectId: "s2", teacherId: "t2" });
  });

  it("applyMove → hedef yerleşimin slotunu günceller", () => {
    let d = initDraft([p({ id: "r1", day: 0, period: 1 })]);
    d = applyMove(d, "r1", 3, 4);
    expect(foldOps(d)[0]).toMatchObject({ id: "r1", day: 3, period: 4 });
  });

  it("applyRemove → yerleşimi fold'dan düşürür", () => {
    let d = initDraft([p({ id: "r1" }), p({ id: "r2", period: 2 })]);
    d = applyRemove(d, "r1");
    const folded = foldOps(d);
    expect(folded).toHaveLength(1);
    expect(folded[0].id).toBe("r2");
  });

  it("applyAssignTeacher / applyAssignRoom → ilgili alanı günceller", () => {
    let d = initDraft([p({ id: "r1", teacherId: "t1", roomId: null })]);
    d = applyAssignTeacher(d, "r1", "t9");
    d = applyAssignRoom(d, "r1", "room9");
    expect(foldOps(d)[0]).toMatchObject({ teacherId: "t9", roomId: "room9" });
  });

  it("applySetBlock → seçilenleri isBlock + ortak sentetik blockGroupId yapar", () => {
    let d = initDraft([p({ id: "r1", period: 1 }), p({ id: "r2", period: 2 })]);
    d = applySetBlock(d, ["r1", "r2"]);
    const folded = foldOps(d);
    expect(folded.every((x) => x.isBlock)).toBe(true);
    expect(folded[0].blockGroupId).toBe(folded[1].blockGroupId);
    expect(folded[0].blockGroupId).toMatch(/^blk:/);
  });

  it("place-sonra-move (temp) → fold son slotu yansıtır, ops uzunluğu 2", () => {
    let d = initDraft([]);
    d = applyPlace(d, { day: 0, period: 1, subjectId: "s1", teacherId: "t1", roomId: null });
    const tempId = foldOps(d)[0].id;
    d = applyMove(d, tempId, 2, 3);
    expect(d.ops).toHaveLength(2);
    expect(foldOps(d)[0]).toMatchObject({ day: 2, period: 3 });
  });

  it("resetDraft → ops temizlenir, yeni baseline geçerli olur", () => {
    let d = initDraft([p({ id: "r1" })]);
    d = applyRemove(d, "r1");
    expect(isDirty(d)).toBe(true);
    const next = resetDraft(d, [p({ id: "r9", period: 5 })]);
    expect(isDirty(next)).toBe(false);
    expect(foldOps(next)).toEqual([p({ id: "r9", period: 5 })]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd oksis-web && npx vitest run src/portals/admin/timetable/editor/lib/__tests__/editorDraft.test.ts`
Expected: FAIL — `Cannot find module '../editorDraft'`.

- [ ] **Step 3: Write minimal implementation**

```ts
// editor/lib/editorDraft.ts
import type { PlacementDto } from "../../types";

/** Kullanıcının editördeki sıralı işlemleri. `id` gerçek ya da temp (`tmp:N`) olabilir. */
export type DraftOp =
  | { kind: "place"; tempId: string; day: number; period: number; subjectId: string; teacherId: string; roomId: string | null }
  | { kind: "move"; id: string; day: number; period: number }
  | { kind: "remove"; id: string }
  | { kind: "assignTeacher"; id: string; teacherId: string }
  | { kind: "assignRoom"; id: string; roomId: string | null }
  | { kind: "setBlock"; ids: string[]; groupId: string };

export interface DraftState {
  baseline: PlacementDto[];
  ops: DraftOp[];
  /** temp/blok id üretimi için artan sayaç. */
  seq: number;
}

export function initDraft(baseline: PlacementDto[]): DraftState {
  return { baseline, ops: [], seq: 0 };
}

export function isDirty(state: DraftState): boolean {
  return state.ops.length > 0;
}

/** Başarılı flush sonrası: yeni sunucu hâlini baseline yap, op-log'u temizle. */
export function resetDraft(state: DraftState, baseline: PlacementDto[]): DraftState {
  return { baseline, ops: [], seq: state.seq };
}

function push(state: DraftState, op: DraftOp, seqDelta = 0): DraftState {
  return { ...state, ops: [...state.ops, op], seq: state.seq + seqDelta };
}

export interface PlaceArgs {
  day: number;
  period: number;
  subjectId: string;
  teacherId: string;
  roomId: string | null;
}

export function applyPlace(state: DraftState, args: PlaceArgs): DraftState {
  const tempId = `tmp:${state.seq}`;
  return push(state, { kind: "place", tempId, ...args }, 1);
}

export function applyMove(state: DraftState, id: string, day: number, period: number): DraftState {
  return push(state, { kind: "move", id, day, period });
}

export function applyRemove(state: DraftState, id: string): DraftState {
  return push(state, { kind: "remove", id });
}

export function applyAssignTeacher(state: DraftState, id: string, teacherId: string): DraftState {
  return push(state, { kind: "assignTeacher", id, teacherId });
}

export function applyAssignRoom(state: DraftState, id: string, roomId: string | null): DraftState {
  return push(state, { kind: "assignRoom", id, roomId });
}

export function applySetBlock(state: DraftState, ids: string[]): DraftState {
  const groupId = `blk:${state.seq}`;
  return push(state, { kind: "setBlock", ids, groupId }, 1);
}

/** baseline + ops → o anki yerleşimler (render kaynağı). Saf. */
export function foldOps(state: DraftState): PlacementDto[] {
  const map = new Map<string, PlacementDto>(state.baseline.map((p) => [p.id, { ...p }]));
  for (const op of state.ops) {
    switch (op.kind) {
      case "place":
        map.set(op.tempId, {
          id: op.tempId, day: op.day, period: op.period, subjectId: op.subjectId,
          teacherId: op.teacherId, roomId: op.roomId, isBlock: false, blockGroupId: null,
        });
        break;
      case "move": {
        const p = map.get(op.id);
        if (p) map.set(op.id, { ...p, day: op.day, period: op.period });
        break;
      }
      case "remove":
        map.delete(op.id);
        break;
      case "assignTeacher": {
        const p = map.get(op.id);
        if (p) map.set(op.id, { ...p, teacherId: op.teacherId });
        break;
      }
      case "assignRoom": {
        const p = map.get(op.id);
        if (p) map.set(op.id, { ...p, roomId: op.roomId });
        break;
      }
      case "setBlock":
        for (const id of op.ids) {
          const p = map.get(id);
          if (p) map.set(id, { ...p, isBlock: true, blockGroupId: op.groupId });
        }
        break;
    }
  }
  return [...map.values()];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd oksis-web && npx vitest run src/portals/admin/timetable/editor/lib/__tests__/editorDraft.test.ts`
Expected: PASS (8 test).

- [ ] **Step 5: Commit**

```bash
cd oksis-web && git add src/portals/admin/timetable/editor/lib/editorDraft.ts src/portals/admin/timetable/editor/lib/__tests__/editorDraft.test.ts
git commit -m "2026-06-13 feat: Ders programı editör draft buffer saf modeli (op-log + foldOps)."
```

---

### Task 2: Flush executor — op-log'u sıralı replay et (temp→gerçek id eşlemesi)

**Files:**
- Modify: `oksis-web/src/portals/admin/timetable/editor/lib/editorDraft.ts`
- Test: `oksis-web/src/portals/admin/timetable/editor/lib/__tests__/editorDraft.test.ts`

- [ ] **Step 1: Write the failing test (mevcut test dosyasına ekle)**

```ts
// editorDraft.test.ts — sona ekle
import { executeFlush, type FlushApi } from "../editorDraft";
import { vi } from "vitest";

describe("executeFlush", () => {
  it("op'ları sırayla çağırır, temp id'leri gerçek id'lerle eşler", async () => {
    const calls: string[] = [];
    const api: FlushApi = {
      placeLesson: vi.fn(async () => { calls.push("place"); return "R1"; }),
      moveLesson: vi.fn(async () => { calls.push("move"); }),
      removeLesson: vi.fn(async () => { calls.push("remove"); }),
      assignTeacher: vi.fn(async () => { calls.push("assignTeacher"); }),
      assignRoom: vi.fn(async () => { calls.push("assignRoom"); }),
      setBlock: vi.fn(async () => { calls.push("setBlock"); }),
    };
    let d = initDraft([]);
    d = applyPlace(d, { day: 0, period: 1, subjectId: "s1", teacherId: "t1", roomId: null });
    const tempId = foldOps(d)[0].id;
    d = applySetBlock(d, [tempId, "realB"]);

    await executeFlush(api, "prog1", d.ops);

    expect(calls).toEqual(["place", "setBlock"]);
    // setBlock, temp id yerine gerçek "R1" almalı
    expect(api.setBlock).toHaveBeenCalledWith("prog1", ["R1", "realB"]);
  });

  it("move/assign çağrılarında temp id gerçek id'ye çözülür", async () => {
    const api: FlushApi = {
      placeLesson: vi.fn(async () => "R2"),
      moveLesson: vi.fn(async () => {}),
      removeLesson: vi.fn(async () => {}),
      assignTeacher: vi.fn(async () => {}),
      assignRoom: vi.fn(async () => {}),
      setBlock: vi.fn(async () => {}),
    };
    let d = initDraft([]);
    d = applyPlace(d, { day: 0, period: 1, subjectId: "s1", teacherId: "t1", roomId: null });
    const tempId = foldOps(d)[0].id;
    d = applyMove(d, tempId, 2, 3);
    d = applyAssignTeacher(d, tempId, "t5");

    await executeFlush(api, "prog1", d.ops);

    expect(api.moveLesson).toHaveBeenCalledWith("prog1", "R2", { day: 2, period: 3 });
    expect(api.assignTeacher).toHaveBeenCalledWith("prog1", "R2", "t5");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd oksis-web && npx vitest run src/portals/admin/timetable/editor/lib/__tests__/editorDraft.test.ts`
Expected: FAIL — `executeFlush` / `FlushApi` export edilmiyor.

- [ ] **Step 3: Write minimal implementation (editorDraft.ts sonuna ekle)**

```ts
/** executeFlush'ın ihtiyaç duyduğu API yüzeyi — timetableApi bunu birebir karşılar. */
export interface FlushApi {
  placeLesson(programId: string, body: { day: number; period: number; subjectId: string; teacherId: string; roomId: string | null }): Promise<string>;
  moveLesson(programId: string, pid: string, body: { day: number; period: number }): Promise<void>;
  removeLesson(programId: string, pid: string): Promise<void>;
  assignTeacher(programId: string, pid: string, teacherId: string): Promise<void>;
  assignRoom(programId: string, pid: string, roomId: string | null): Promise<void>;
  setBlock(programId: string, placementIds: string[]): Promise<void>;
}

/**
 * Op-log'u kullanıcı aksiyon sırasıyla sunucuya replay eder. `place` gerçek id döndürür;
 * sonraki op'larda temp id bu gerçek id'ye çözülür. Bir op hata fırlatırsa (ör. 409),
 * exception yukarı taşınır — çağıran refetch + uyarı yapar (kalan op'lar uygulanmaz).
 */
export async function executeFlush(api: FlushApi, programId: string, ops: DraftOp[]): Promise<void> {
  const idMap = new Map<string, string>();
  const resolve = (id: string): string => idMap.get(id) ?? id;
  for (const op of ops) {
    switch (op.kind) {
      case "place": {
        const realId = await api.placeLesson(programId, {
          day: op.day, period: op.period, subjectId: op.subjectId,
          teacherId: op.teacherId, roomId: op.roomId,
        });
        idMap.set(op.tempId, realId);
        break;
      }
      case "move":
        await api.moveLesson(programId, resolve(op.id), { day: op.day, period: op.period });
        break;
      case "remove":
        await api.removeLesson(programId, resolve(op.id));
        break;
      case "assignTeacher":
        await api.assignTeacher(programId, resolve(op.id), op.teacherId);
        break;
      case "assignRoom":
        await api.assignRoom(programId, resolve(op.id), op.roomId);
        break;
      case "setBlock":
        await api.setBlock(programId, op.ids.map(resolve));
        break;
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd oksis-web && npx vitest run src/portals/admin/timetable/editor/lib/__tests__/editorDraft.test.ts`
Expected: PASS (10 test).

- [ ] **Step 5: Commit**

```bash
cd oksis-web && git add src/portals/admin/timetable/editor/lib/editorDraft.ts src/portals/admin/timetable/editor/lib/__tests__/editorDraft.test.ts
git commit -m "2026-06-13 feat: Ders programı editör draft flush executor (sıralı replay + temp id eşleme)."
```

---

### Task 3: `useEditorDraft` hook — state + flush orkestrasyonu + React Query invalidation

**Files:**
- Create: `oksis-web/src/portals/admin/timetable/editor/hooks/useEditorDraft.ts`

> Not: Hook'un kendisi için ayrı birim test yazılmaz; saf mantık Task 1-2'de, entegrasyon Task 7 (sayfa testi) ile kapsanır. Bu görev yalnız hook'u oluşturur.

- [ ] **Step 1: Hook'u yaz**

```ts
// editor/hooks/useEditorDraft.ts
import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../../../../shared/store/authStore";
import { getApiErrorCode } from "../../../../../shared/api/apiError";
import { timetableApi } from "../../api/timetableApi";
import { timetableKeys } from "../../keys/timetableKeys";
import {
  applyAssignRoom, applyAssignTeacher, applyMove, applyPlace, applyRemove, applySetBlock,
  executeFlush, foldOps, initDraft, isDirty, resetDraft,
  type DraftState, type PlaceArgs,
} from "../lib/editorDraft";
import type { PlacementDto } from "../../types";

type Action =
  | { type: "reset"; baseline: PlacementDto[] }
  | { type: "place"; args: PlaceArgs }
  | { type: "move"; id: string; day: number; period: number }
  | { type: "remove"; id: string }
  | { type: "assignTeacher"; id: string; teacherId: string }
  | { type: "assignRoom"; id: string; roomId: string | null }
  | { type: "setBlock"; ids: string[] };

function reducer(state: DraftState, action: Action): DraftState {
  switch (action.type) {
    case "reset": return resetDraft(state, action.baseline);
    case "place": return applyPlace(state, action.args);
    case "move": return applyMove(state, action.id, action.day, action.period);
    case "remove": return applyRemove(state, action.id);
    case "assignTeacher": return applyAssignTeacher(state, action.id, action.teacherId);
    case "assignRoom": return applyAssignRoom(state, action.id, action.roomId);
    case "setBlock": return applySetBlock(state, action.ids);
  }
}

export interface EditorDraft {
  placements: PlacementDto[];
  dirty: boolean;
  saving: boolean;
  saved: boolean;
  flushError: string | null;
  place: (args: PlaceArgs) => void;
  move: (id: string, day: number, period: number) => void;
  remove: (id: string) => void;
  assignTeacher: (id: string, teacherId: string) => void;
  assignRoom: (id: string, roomId: string | null) => void;
  setBlock: (ids: string[]) => void;
  /** Op-log'u sunucuya yazar; başarıyı döndürür. Çağıran çıkış-koruması için await edebilir. */
  flush: () => Promise<boolean>;
  clearFlushError: () => void;
}

/**
 * Editör tamponlu kaydetme: sunucu yerleşimleri `serverPlacements` ile senkron baseline,
 * kullanıcı aksiyonları yerel op-log. `flush` op'ları replay eder ve query'leri tazeler.
 */
export function useEditorDraft(programId: string, serverPlacements: PlacementDto[]): EditorDraft {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const queryClient = useQueryClient();
  const [state, dispatch] = useReducer(reducer, serverPlacements, initDraft);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [flushError, setFlushError] = useState<string | null>(null);

  const dirty = isDirty(state);

  // Sunucu verisi değişince (refetch / ilk yükleme) yalnız temizken baseline'ı senkronla.
  // Dirty iken ezme — kullanıcının bekleyen değişiklikleri korunur.
  useEffect(() => {
    if (!dirty) dispatch({ type: "reset", baseline: serverPlacements });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverPlacements]);

  const placements = useMemo(() => foldOps(state), [state]);

  const flush = useCallback(async (): Promise<boolean> => {
    if (state.ops.length === 0) return true;
    setSaving(true);
    setFlushError(null);
    try {
      await executeFlush(timetableApi, programId, state.ops);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: timetableKeys.program(schoolId, programId) }),
        queryClient.invalidateQueries({ queryKey: timetableKeys.unplaced(schoolId, programId) }),
      ]);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
      return true;
    } catch (err) {
      setFlushError(getApiErrorCode(err) ?? "timetable.errors.generic");
      // Buffer'ı sunucu gerçeğine resetle (uygulanmış op'lar baseline'a gelir).
      await queryClient.invalidateQueries({ queryKey: timetableKeys.program(schoolId, programId) });
      return false;
    } finally {
      setSaving(false);
    }
  }, [programId, queryClient, schoolId, state.ops]);

  return {
    placements,
    dirty,
    saving,
    saved,
    flushError,
    place: (args) => dispatch({ type: "place", args }),
    move: (id, day, period) => dispatch({ type: "move", id, day, period }),
    remove: (id) => dispatch({ type: "remove", id }),
    assignTeacher: (id, teacherId) => dispatch({ type: "assignTeacher", id, teacherId }),
    assignRoom: (id, roomId) => dispatch({ type: "assignRoom", id, roomId }),
    setBlock: (ids) => dispatch({ type: "setBlock", ids }),
    flush,
    clearFlushError: () => setFlushError(null),
  };
}
```

- [ ] **Step 2: Tip kontrolü**

Run: `cd oksis-web && npx tsc --noEmit`
Expected: PASS (hata yok). (Hook henüz kullanılmıyor; sayfa Task 6'da bağlanır.)

- [ ] **Step 3: Commit**

```bash
cd oksis-web && git add src/portals/admin/timetable/editor/hooks/useEditorDraft.ts
git commit -m "2026-06-13 feat: Ders programı editör useEditorDraft hook'u (tamponlu state + flush)."
```

---

### Task 4: i18n — Kaydet/Saved metinleri + dirty/leave/saveFailed anahtarları

**Files:**
- Modify: `oksis-web/src/shared/i18n/locales/tr/timetable.json:189-191`
- Modify: `oksis-web/src/shared/i18n/locales/en/timetable.json:189-191`

- [ ] **Step 1: tr — `editor` bloğunda `save`/`saved`'ı değiştir, yeni anahtarlar ekle**

`tr/timetable.json` içinde (satır ~189):

```json
      "save": "Kaydet",
      "saving": "Kaydediliyor…",
      "saved": "Kaydedildi",
      "unsavedAria": "Kaydedilmemiş değişiklik var",
      "saveFailed": "Bazı değişiklikler kaydedilemedi. Lütfen tekrar deneyin.",
```

ve `editor` bloğunun içine (örn. `weekdays`'ten önce) `leave` alt-bloğunu ekle:

```json
      "leave": {
        "title": "Kaydedilmemiş değişiklikler",
        "body": "Bu programda kaydedilmemiş değişiklikler var. Çıkmadan önce kaydetmek ister misiniz?",
        "saveExit": "Kaydet ve Çık",
        "discard": "Kaydetmeden Çık",
        "cancel": "Vazgeç"
      },
```

- [ ] **Step 2: en — aynı anahtarların İngilizcesi**

`en/timetable.json` içinde (satır ~189):

```json
      "save": "Save",
      "saving": "Saving…",
      "saved": "Saved",
      "unsavedAria": "You have unsaved changes",
      "saveFailed": "Some changes could not be saved. Please try again.",
```

ve `leave` bloğu:

```json
      "leave": {
        "title": "Unsaved changes",
        "body": "This program has unsaved changes. Do you want to save before leaving?",
        "saveExit": "Save & Exit",
        "discard": "Leave without saving",
        "cancel": "Cancel"
      },
```

- [ ] **Step 3: JSON geçerliliğini doğrula**

Run: `cd oksis-web && node -e "require('./src/shared/i18n/locales/tr/timetable.json'); require('./src/shared/i18n/locales/en/timetable.json'); console.log('ok')"`
Expected: `ok` (parse hatası yok).

- [ ] **Step 4: Commit**

```bash
cd oksis-web && git add src/shared/i18n/locales/tr/timetable.json src/shared/i18n/locales/en/timetable.json
git commit -m "2026-06-13 feat: Ders programı editör Kaydet/çıkış-koruması i18n anahtarları (tr/en)."
```

---

### Task 5: LeaveGuardDialog bileşeni

**Files:**
- Create: `oksis-web/src/portals/admin/timetable/editor/components/LeaveGuardDialog.tsx`

- [ ] **Step 1: Bileşeni yaz**

```tsx
// editor/components/LeaveGuardDialog.tsx
import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";

interface Props {
  saving: boolean;
  onSaveExit: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}

/** Kaydedilmemiş değişiklikle çıkışta onay diyaloğu (useBlocker tetikler). */
export function LeaveGuardDialog({ saving, onSaveExit, onDiscard, onCancel }: Props) {
  const { t } = useTranslation("timetable");
  return (
    <>
      <div className="drawer-scrim" onClick={saving ? undefined : onCancel} />
      <div className="sed-leave" role="alertdialog" aria-modal="true" aria-label={t("editor.leave.title")}>
        <div className="sed-leave-ic"><AlertTriangle size={22} /></div>
        <h4>{t("editor.leave.title")}</h4>
        <p>{t("editor.leave.body")}</p>
        <div className="sed-leave-foot">
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={saving}>
            {t("editor.leave.cancel")}
          </button>
          <div className="grow" />
          <button type="button" className="btn btn-ghost" onClick={onDiscard} disabled={saving}>
            {t("editor.leave.discard")}
          </button>
          <button type="button" className="btn btn-primary" onClick={onSaveExit} disabled={saving}>
            {saving ? <span className="btn-spin" /> : null} {t("editor.leave.saveExit")}
          </button>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Stil ekle (`editor/editor.css` sonuna)**

```css
/* Kaydedilmemiş değişiklik diyaloğu */
.sed-leave {
  position: fixed; z-index: 60; top: 50%; left: 50%; transform: translate(-50%, -50%);
  width: min(440px, calc(100vw - 32px)); background: var(--surface, #fff);
  border: 1px solid var(--line, #e5e7eb); border-radius: 14px; padding: 22px;
  box-shadow: 0 20px 48px rgba(15, 23, 42, 0.18); text-align: center;
}
.sed-leave-ic { display: inline-flex; padding: 10px; border-radius: 999px; background: #fff7ed; color: #ea580c; }
.sed-leave h4 { margin: 12px 0 6px; }
.sed-leave p { color: var(--text-faint, #64748b); margin: 0 0 18px; }
.sed-leave-foot { display: flex; align-items: center; gap: 8px; }
.sed-leave-foot .grow { flex: 1; }
```

- [ ] **Step 3: Tip kontrolü**

Run: `cd oksis-web && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
cd oksis-web && git add src/portals/admin/timetable/editor/components/LeaveGuardDialog.tsx src/portals/admin/timetable/editor/editor.css
git commit -m "2026-06-13 feat: Ders programı editör çıkış-koruması diyaloğu (LeaveGuardDialog)."
```

---

### Task 6: EditorToolbar — dirty-aware Kaydet (disabled/turuncu nokta)

**Files:**
- Modify: `oksis-web/src/portals/admin/timetable/editor/components/EditorToolbar.tsx`

- [ ] **Step 1: Props'a `dirty` ekle, Kaydet butonunu güncelle**

`Props` arayüzüne ekle (satır ~18 civarı, `onToggleBlockMode` yanına):

```tsx
  dirty: boolean;
```

İmza parametrelerine `dirty` ekle ve Kaydet butonunu (satır ~87-106) şununla değiştir:

```tsx
          <button
            type="button"
            className={cn("btn btn-primary sed-save", saving && "disabled")}
            disabled={saving || (!dirty && !saved)}
            onClick={onSave}
          >
            {dirty && !saving && !saved && (
              <span className="sed-save-dot" aria-label={t("editor.unsavedAria")} />
            )}
            {saving ? (
              <>
                <span className="btn-spin" /> {t("editor.saving")}
              </>
            ) : saved ? (
              <>
                <Check size={17} /> {t("editor.saved")}
              </>
            ) : (
              <>
                <Save size={17} /> {t("editor.save")}
              </>
            )}
          </button>
```

- [ ] **Step 2: Turuncu nokta stili (`editor/editor.css` sonuna)**

```css
.sed-save { position: relative; }
.sed-save-dot {
  position: absolute; top: -4px; right: -4px; width: 10px; height: 10px;
  border-radius: 999px; background: #f59e0b; border: 2px solid var(--surface, #fff);
}
```

- [ ] **Step 3: Tip kontrolü (sayfa henüz prop'u geçmiyor → beklenen hata)**

Run: `cd oksis-web && npx tsc --noEmit`
Expected: FAIL — `ScheduleEditorPage.tsx`'te `EditorToolbar`'a `dirty` prop'u verilmiyor. (Task 6 commit'i Task 7 ile birlikte yeşile döner; bu adımda yalnız toolbar değişir.)

- [ ] **Step 4: Commit (sayfa Task 7'de bağlanacak)**

```bash
cd oksis-web && git add src/portals/admin/timetable/editor/components/EditorToolbar.tsx src/portals/admin/timetable/editor/editor.css
git commit -m "2026-06-13 feat: Ders programı editör toolbar dirty-aware Kaydet (disabled + turuncu nokta)."
```

---

### Task 7: ScheduleEditorPage — draft'a bağla + çıkış koruması

**Files:**
- Modify: `oksis-web/src/portals/admin/timetable/ScheduleEditorPage.tsx`
- Delete: `oksis-web/src/portals/admin/timetable/editor/hooks/useEditorMutations.ts`

- [ ] **Step 1: Import'ları güncelle**

Üstte `useEditorMutations` import'unu kaldır, yerine ekle:

```tsx
import { useBlocker } from "react-router";
import { useEditorDraft } from "./editor/hooks/useEditorDraft";
import { LeaveGuardDialog } from "./editor/components/LeaveGuardDialog";
```

- [ ] **Step 2: Mutasyon hook'unu draft hook'uyla değiştir**

`const { place, move, remove, saveDraft, assignTeacher, assignRoom, setBlock } = useEditorMutations(id);` satırını sil. Bunun yerine, `data` tanımının ardından:

```tsx
  const draft = useEditorDraft(id, data.program?.placements ?? []);
```

`const placements = data.program?.placements ?? [];` satırını şununla değiştir:

```tsx
  const placements = draft.placements;
```

`saved` local state'ini ve `handleSave`'i sil; aşağıdaki yeni handler/efektlerle değiştir (Step 3-5).

- [ ] **Step 3: Drag/menü/blok aksiyonlarını draft'a yönlendir**

`handleDragEnd` içindeki `place.mutate(...)` / `move.mutate(...)` bloklarını şununla değiştir:

```tsx
    if (action.kind === "place") {
      draft.place({
        day: action.day, period: action.period,
        subjectId: action.subjectId, teacherId: action.teacherId, roomId: null,
      });
    } else {
      draft.move(action.placementId, action.day, action.period);
    }
```

`handleAssignTeacher` / `handleAssignRoom` gövdelerini şununla değiştir:

```tsx
  const handleAssignTeacher = (pid: string, teacherId: string) => draft.assignTeacher(pid, teacherId);
  const handleAssignRoom = (pid: string, roomId: string | null) => draft.assignRoom(pid, roomId);
```

`createBlock`'u şununla değiştir:

```tsx
  const createBlock = () => {
    draft.setBlock([...selectedIds]);
    setSelectMode(false);
    setSelectedIds(new Set());
  };
```

`WeekGrid`'in `onRemove` prop'unu güncelle:

```tsx
                onRemove={(pid) => draft.remove(pid)}
```

> Not: Artık per-aksiyon 409 hata akışı yok (`onCmdError` yalnız flush'ta kullanılır). `onCmdError`, `conflictCode`, `concurrency` state'leri flush hatası için kalır (Step 5).

- [ ] **Step 4: Kaydet + çıkış koruması (handler + blocker + beforeunload)**

`handleSave`'in yerine ve component gövdesine ekle:

```tsx
  const handleSave = () => {
    void draft.flush();
  };

  // Router içi geçişlerde kaydedilmemiş değişiklik koruması
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      draft.dirty && currentLocation.pathname !== nextLocation.pathname,
  );

  // Sekme kapatma / yenileme koruması
  useEffect(() => {
    if (!draft.dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [draft.dirty]);

  const leaveSaveExit = async () => {
    const ok = await draft.flush();
    if (ok) blocker.proceed?.();
  };
```

> `useEffect` zaten import'lu değil — dosya başındaki `import { useMemo, useRef, useState } from "react";` satırını `import { useEffect, useMemo, useRef, useState } from "react";` yap.

- [ ] **Step 5: Flush hatasını banner'a bağla**

Mevcut `conflictCode` banner'ı (satır ~326) yanında flush hatasını göster. `conflictCode &&` banner bloğundan hemen sonra ekle:

```tsx
              {draft.flushError && (
                <div className="sed-concurrency" role="alert">
                  {t(draft.flushError.replace(/^timetable\./, ""), { defaultValue: t("editor.saveFailed") })}
                </div>
              )}
```

- [ ] **Step 6: Toolbar'a dirty + saving/saved'i draft'tan geç**

`EditorToolbar` kullanımını güncelle:

```tsx
      <EditorToolbar
        className={data.className}
        status={data.status}
        version={data.version}
        saving={draft.saving}
        saved={draft.saved}
        dirty={draft.dirty}
        onSave={handleSave}
        verifyOpen={verifyOpen}
        onValidate={() => setVerifyOpen((o) => !o)}
        onPublish={() => setPublishOpen(true)}
        blockMode={selectMode}
        onToggleBlockMode={toggleBlockMode}
      />
```

- [ ] **Step 7: LeaveGuardDialog'u render et (return'ün en sonuna, kapanış `</div>`'inden önce)**

```tsx
      {blocker.state === "blocked" && (
        <LeaveGuardDialog
          saving={draft.saving}
          onSaveExit={() => void leaveSaveExit()}
          onDiscard={() => blocker.proceed?.()}
          onCancel={() => blocker.reset?.()}
        />
      )}
```

- [ ] **Step 8: useEditorMutations'ı sil**

```bash
cd oksis-web && git rm src/portals/admin/timetable/editor/hooks/useEditorMutations.ts
```

- [ ] **Step 9: Tip kontrolü + build**

Run: `cd oksis-web && npx tsc --noEmit`
Expected: PASS (mevcut sayfa testi hariç — o Task 8'de onarılır; tsc test dosyalarını da kapsıyorsa testteki eski mock'lar tip hatası verebilir → Task 8 ile birlikte yeşile döner).

- [ ] **Step 10: Commit**

```bash
cd oksis-web && git add -A src/portals/admin/timetable
git commit -m "2026-06-13 feat: Ders programı editör tamponlu kaydetme + çıkış koruması bağlandı."
```

---

### Task 8: Sayfa testini data router'a taşı + tamponlu davranış assertion'ları

**Files:**
- Modify: `oksis-web/src/portals/admin/timetable/editor/__tests__/ScheduleEditorPage.test.tsx`

- [ ] **Step 1: Mock'ları ve router'ı güncelle**

`useEditorMutations` mock'unu sil. `usePrecheck` mock'u kalsın. `timetableApi`'yi mock'la (flush bunu çağırır) ve QueryClientProvider + data router ekle. Dosyanın üst kısmını şununla değiştir:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "../../../../../shared/i18n";
import { ScheduleEditorPage } from "../../ScheduleEditorPage";
import type { EditorData } from "../hooks/useEditorData";
import type { NameLookups, PlacementDto } from "../../types";

const mockData = vi.fn<() => EditorData>();
const removeLesson = vi.fn(async () => {});
const setBlock = vi.fn(async () => {});

vi.mock("../hooks/useEditorData", async (orig) => ({
  ...(await orig<typeof import("../hooks/useEditorData")>()),
  useEditorData: () => mockData(),
}));
vi.mock("../hooks/usePrecheck", () => ({
  usePrecheck: () => ({ drop: null, check: vi.fn(), clear: vi.fn() }),
}));
vi.mock("../../api/timetableApi", () => ({
  timetableApi: {
    removeLesson: (...a: unknown[]) => removeLesson(...a),
    setBlock: (...a: unknown[]) => setBlock(...a),
    placeLesson: vi.fn(async () => "R1"),
    moveLesson: vi.fn(async () => {}),
    assignTeacher: vi.fn(async () => {}),
    assignRoom: vi.fn(async () => {}),
  },
}));

const lookups: NameLookups = {
  subjects: new Map([["s1", "Matematik"], ["s2", "Fen"]]),
  teachers: new Map([["t1", "Ahmet Yılmaz"]]),
  rooms: new Map(),
};

const base: EditorData = {
  program: { id: "p1", academicYearId: "y", academicTermId: "tm", branchId: "b1", status: "Draft", version: 1, placements: [] },
  unplaced: [], lookups, days: [0, 1, 2, 3, 4],
  gridRows: [
    { kind: "lesson", period: 1, start: "08:40", end: "09:20" },
    { kind: "lesson", period: 2, start: "09:30", end: "10:10" },
  ],
  progress: { placed: 0, total: 0, pct: 0 },
  className: "9-A", status: "Draft", version: 1,
  isLoading: false, isError: false, error: null, refetch: vi.fn(),
};

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(
    [{ path: "/admin/schedule/:id/edit", element: <ScheduleEditorPage /> }],
    { initialEntries: ["/admin/schedule/p1/edit"] },
  );
  return render(
    <QueryClientProvider client={qc}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  mockData.mockReset();
  removeLesson.mockClear();
  setBlock.mockClear();
});
```

- [ ] **Step 2: Test gövdelerini tamponlu modele uyarla**

`describe` bloğunu şununla değiştir (loading/error/empty/full korunur; Kaydet ve Blok testleri tamponlu davranışa göre yenilenir):

```tsx
describe("ScheduleEditorPage", () => {
  it("yükleniyor → iskelet grid", () => {
    mockData.mockReturnValue({ ...base, isLoading: true });
    const { container } = renderPage();
    expect(container.querySelector(".sed-skel")).not.toBeNull();
  });

  it("hata → yükleme hatası", () => {
    mockData.mockReturnValue({ ...base, isError: true });
    renderPage();
    expect(screen.getByText("Program yüklenemedi.")).toBeInTheDocument();
  });

  it("görevlendirme yok → boş durum mesajı", () => {
    mockData.mockReturnValue({ ...base });
    renderPage();
    expect(screen.getByText("Bu sınıf için görevlendirme yok.")).toBeInTheDocument();
  });

  it("dolu → yerleşim ders adıyla görünür", () => {
    const p: PlacementDto = { id: "pl1", day: 0, period: 1, subjectId: "s1", teacherId: "t1", roomId: null, isBlock: false, blockGroupId: null };
    mockData.mockReturnValue({ ...base, program: { ...base.program!, placements: [p] } });
    renderPage();
    expect(screen.getByText("Matematik")).toBeInTheDocument();
  });

  it("değişiklik yokken Kaydet disabled", () => {
    mockData.mockReturnValue({ ...base });
    renderPage();
    expect(screen.getByRole("button", { name: /Kaydet/ })).toBeDisabled();
  });

  it("dersi kaldır → Kaydet aktifleşir → Kaydet flush'ta removeLesson çağırır", async () => {
    const p: PlacementDto = { id: "pl1", day: 0, period: 1, subjectId: "s1", teacherId: "t1", roomId: null, isBlock: false, blockGroupId: null };
    mockData.mockReturnValue({ ...base, program: { ...base.program!, placements: [p] } });
    renderPage();
    fireEvent.click(screen.getByLabelText("Hücre menüsü"));
    fireEvent.click(screen.getByText("Kaldır"));
    const saveBtn = screen.getByRole("button", { name: /Kaydet/ });
    expect(saveBtn).toBeEnabled();
    fireEvent.click(saveBtn);
    await waitFor(() => expect(removeLesson).toHaveBeenCalledWith("p1", "pl1"));
  });

  it("Doğrula → eksik-saat paneli açılır ve Hücreye git satırları gösterir", () => {
    mockData.mockReturnValue({ ...base });
    renderPage();
    fireEvent.click(screen.getAllByRole("button", { name: /Doğrula/ })[0]);
    expect(screen.getByText(/10 sorun/)).toBeInTheDocument();
    expect(screen.getAllByText(/Hücreye git/).length).toBeGreaterThan(0);
  });

  it("Blok modu → iki hücre seç → Blok oluştur (yerel) → Kaydet flush'ta setBlock çağırır", async () => {
    const pl1: PlacementDto = { id: "pl1", day: 0, period: 1, subjectId: "s1", teacherId: "t1", roomId: null, isBlock: false, blockGroupId: null };
    const pl2: PlacementDto = { id: "pl2", day: 0, period: 2, subjectId: "s2", teacherId: "t1", roomId: null, isBlock: false, blockGroupId: null };
    mockData.mockReturnValue({ ...base, program: { ...base.program!, placements: [pl1, pl2] } });
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /Blok modu/ }));
    fireEvent.click(screen.getByText("Matematik"));
    fireEvent.click(screen.getByText("Fen"));
    fireEvent.click(screen.getByRole("button", { name: /Blok oluştur/ }));
    fireEvent.click(screen.getByRole("button", { name: /Kaydet/ }));
    await waitFor(() => expect(setBlock).toHaveBeenCalledWith("p1", ["pl1", "pl2"]));
  });
});
```

> Not: "Hücre menüsü" ve "Kaldır" metinleri `editor.cellMenu.open`/`editor.cellMenu.remove` (tr: "Hücre menüsü"/"Kaldır"). Menü Radix Popover ise `fireEvent.click` ile açılır; açılmazsa `CellMenu`'nün tetikleyici `aria-label`'ı `editor.cellMenu.open` ile eşleştiğini doğrula.

- [ ] **Step 3: Testi çalıştır**

Run: `cd oksis-web && npx vitest run src/portals/admin/timetable/editor/__tests__/ScheduleEditorPage.test.tsx`
Expected: PASS (8 test). Menü etkileşimi seçici sorun çıkarırsa `CellMenu.tsx`'teki tetikleyici `aria-label`'ı teyit edip testteki `getByLabelText` argümanını ona göre düzelt.

- [ ] **Step 4: Commit**

```bash
cd oksis-web && git add src/portals/admin/timetable/editor/__tests__/ScheduleEditorPage.test.tsx
git commit -m "2026-06-13 test: Ders programı editör sayfa testi tamponlu modele uyarlandı (data router)."
```

---

### Task 9: Tam doğrulama + dokümantasyon güncellemesi

**Files:**
- Modify: `.claude/docs/modules/timetable/completion_status.md`

- [ ] **Step 1: Tüm timetable testlerini çalıştır**

Run: `cd oksis-web && npx vitest run src/portals/admin/timetable src/modules/timetable src/app/pages/shared`
Expected: PASS — tümü yeşil (editorDraft 10 + sayfa 8 + mevcut editör/hub/publish/consumer testleri).

- [ ] **Step 2: Tam paket + build + lint**

Run: `cd oksis-web && npm run test && npm run build`
Expected: Tüm test paketi yeşil; `vite build` temiz (tip hatası yok).

- [ ] **Step 3: Tarayıcı smoke (manuel)**

Run: `cd oksis-web && npm run dev`
Doğrula (Türkçe açıklama):
- `/admin/schedule/:id/edit` aç → Kaydet **disabled** (değişiklik yok).
- Bir dersi kaldır/taşı → Kaydet **aktif + turuncu nokta** belirir.
- Kaydet → "Kaydediliyor…" → "Kaydedildi"; nokta kaybolur; grid sunucu hâliyle tutarlı.
- Değişiklik yapıp Hub'a dönmeyi dene → **çıkış uyarısı** çıkar (Kaydet ve Çık / Kaydetmeden Çık / Vazgeç).
- Sekmeyi kapatmayı dene (dirty iken) → tarayıcı "ayrılmak istiyor musunuz" uyarısı.

- [ ] **Step 4: completion_status.md güncelle**

`completion_status.md`:
- Başlık satırında ilerleme/`Güncel`'i koru veya bir tık artır; üst özet bloğuna ekle: **"Faz 2.5B-1 Editör tamponlu kaydetme tamamlandı: yerel op-log + foldOps + flush replay; Kaydet disabled/dirty-dot/saving/saved; useBlocker + beforeunload çıkış koruması; per-aksiyon anlık yazma kaldırıldı. N timetable vitest yeşil; npm run build temiz."**
- **⏳ Eksik / Bekleyen** altına debt notu ekle:
  - **Debt-FE-6 (flush atomik değil):** Kaydet, op-log'u mevcut uçlara sıralı replay eder; bir op 409 ile reddedilirse o op ve sonrası uygulanmaz, buffer sunucu gerçeğine resetlenir (uygulanmamış değişiklikler kullanıcı tarafından tekrar yapılır). Atomik batch `POST /draft/apply` ucu sonraki iş.
  - **Debt-FE-7 (precheck stale):** Tamponlu düzenlemede `precheck` sunucu occupancy'sini kullanır; aynı program içindeki kaydedilmemiş taşımalar occupancy'ye yansımadığından öğretmen/derslik precheck'i kaydedilmemiş hamleleri hesaba katmaz (sınıf-slot tekilliği yerel `cellMap` ile doğru). Kesin doğrulama Kaydet (flush) anında sunucu + DB unique backstop ile yapılır.
- **⚠️ Spec Dışına Çıkılanlar** altına ekle:
  - **2026-06-13 · Editör per-aksiyon yazma → tamponlu Kaydet:** Faz 1B editörü her aksiyonu anında sunucuya yazıyordu; tasarım handoff'undaki "Kaydet" butonu (değişiklik yoksa disabled, varsa dirty-dot) modeline geçildi. Tüketiciye yansıma zaten yalnız yayınlanmış snapshot'tan olduğu için kullanıcıya etki yok; editör veri bütünlüğü/UX iyileşir. Onay: kullanıcı (2026-06-13). Etki: spec §7 "Place/Save anında yetkili doğrulama" artık Kaydet anında karşılanır; çakışma modeli (katı) değişmedi.

- [ ] **Step 5: Commit (workspace repo'su)**

```bash
cd /Users/farukkaya/Projects/oksis && git add .claude/docs/modules/timetable/completion_status.md docs/superpowers/plans/2026-06-13-ders-programi-2-5b-1-editor-tamponlu-kaydetme.md
git commit -m "2026-06-13 docs: Ders programı 2.5B-1 editör tamponlu kaydetme — completion_status + plan + Debt-FE-6/7."
```

---

## Self-Review

**Spec coverage (kullanıcı kararı):**
- Kaydet butonu disabled/dirty-dot/saving/saved → Task 4/6/8. ✅
- Değişiklikler buffered, anlık yazma yok → Task 1-3/7. ✅
- Kaydetmeden çıkışta uyarı + Kaydet ve Çık → Task 5/7. ✅
- Yayınlanana kadar kullanıcıya yansımaması → mimaride zaten garanti (consumer'lar snapshot okur); ek iş yok, plan girişinde belirtildi. ✅
- Çakışma modeli değişmedi (katı) → "Neden op-log replay" + "Spec uyumu" notları. ✅

**Placeholder taraması:** Tüm kod blokları gerçek; TBD/TODO yok. ✅

**Tip tutarlılığı:** `DraftState`/`DraftOp`/`PlaceArgs`/`FlushApi` Task 1-2'de tanımlı, Task 3 hook'unda ve Task 7 sayfasında aynı imzalarla kullanılıyor. `timetableApi` metod imzaları `FlushApi`'yi birebir karşılıyor (placeLesson→Promise<string>, diğerleri→Promise<void>). `useBlocker` (RR7) `blocker.state`/`proceed`/`reset` ile kullanılıyor. ✅

**Bağımlılık sırası:** 1→2 (saf modül), 3 (hook, 1-2'ye bağlı), 4 (i18n bağımsız), 5 (diyalog, i18n'e bağlı), 6 (toolbar, i18n'e bağlı), 7 (sayfa, 3+5+6'ya bağlı), 8 (test, 7'ye bağlı), 9 (doğrulama+docs). Task 6 tek başına tsc-fail bırakır (sayfa prop'u Task 7'de verilir) — bu kasıtlı ve not düşüldü.
