# Faz 2.5C — Geçici Değişiklikler Tepsisi + 3 Katmanlı Geri-Al — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Editör hücre menüsünden zengin Vekil/İptal modallarıyla geçici değişiklik taslakları üret, grid üstündeki tepside topla, "Geçici Yayınla" ile P25'e yaz ve üç katmanlı geri-al sun — kalıcı haftalık programa dokunmadan.

**Architecture:** Frontend-only (oksis-web). Geçici-değişiklik taslakları **yalnızca FE state** (`useTempChanges`, saf reducer'lar). "Geçici Yayınla" mevcut Faz 2.5A uçlarını kullanır: P25 `createException` (toplu, Debt-FE-11), P26 `listExceptions` (yayınlanmışları yükle), P27 `revokeException` (geri-al). PublishDrawer + `useTempActions` **dokunulmaz**; yeni akış ayrı store/komponentlerle eklenir (coexistence — tasarım dokümanı §6).

**Tech Stack:** React 18 + TS strict · React Query v5 · Radix Popover · dnd-kit (mevcut) · vitest + Testing Library · i18next (ns `timetable`, JSON `src/shared/i18n/locales/{tr,en}/timetable.json` kökünde `timetable` objesi).

**Tasarım kaynağı (birebir port):** `/tmp/oksis_ders_v2/oksis-layout/project/app/schedule_temp_changes.jsx` (+ `.css`). Satır aralıkları aşağıda referanslı. **Toast altyapısı yok** → prototipteki toast'lar atlanır (mevcut kod inline state kullanır).

**Tasarım dokümanı:** `.claude/plans/2026-06-14-ders-programi-faz2-5c-gecici-tepsi-design.md`.

---

## Genel kurallar (her task)

- TDD: önce kırmızı test, sonra minimal implementasyon, sonra yeşil.
- `any` yasak; inline style yasak (`cn()` + CSS); default export yasak (named export).
- Tüm string i18n (`t("temp.…")`), hardcoded Türkçe yasak.
- Test komutu: `npm run test -- <path>` (vitest run). Tam paket: `npm run test`. Build: `npm run build`.
- Commit formatı (oksis-web reposunda): `2026-06-14 feat: …` / `test: …`. **Fix değil, planlı geliştirme → her task sonunda commit serbest** (bu plan onaylı iş; [[feedback_no_autocommit_fixes]] yalnız ad-hoc fix'ler içindir).
- Çalışma dizini: `oksis-web/`.

---

## Dosya Yapısı

**Yeni:**
- `src/portals/admin/timetable/editor/lib/tempChanges.ts` — saf store modeli + reducer'lar + `resolveDate` + `toExceptionBody` + türevler.
- `src/portals/admin/timetable/editor/lib/__tests__/tempChanges.test.ts`
- `src/portals/admin/timetable/editor/hooks/useTempChanges.ts` — hook sarmalı.
- `src/portals/admin/timetable/editor/components/SubstituteModal.tsx`
- `src/portals/admin/timetable/editor/components/CancelLessonModal.tsx`
- `src/portals/admin/timetable/editor/components/TempChangesPanel.tsx`
- `src/portals/admin/timetable/editor/components/TempPublishModal.tsx`
- İlgili `__tests__/*.test.tsx` (4 komponent).
- `src/portals/admin/timetable/editor/tempChanges.css`

**Değişen:**
- `src/portals/admin/timetable/types.ts` — `ScheduleExceptionDto` (P26 yansıması) ekl.
- `src/portals/admin/timetable/api/timetableApi.ts` — `listExceptions` (P26) + `revokeException` (P27).
- `src/portals/admin/timetable/editor/components/CellMenu.tsx` — temp item'ları inline submenü yerine modal açar.
- `src/portals/admin/timetable/editor/components/GridCell.tsx` — VEKİL/İPTAL/yayınlanmış işaretleri.
- `src/portals/admin/timetable/editor/components/WeekGrid.tsx` — temp-change map + modal-aç callback'leri geçir.
- `src/portals/admin/timetable/ScheduleEditorPage.tsx` — yeni store + modallar + tepsi + publish modal; guard'ları yeni store'a bağla.
- `src/shared/i18n/locales/tr/timetable.json` + `en/timetable.json` — `temp.*` anahtarları.

---

## Task 1: P26/P27 API tipleri ve wrapper'ları

**Files:**
- Modify: `src/portals/admin/timetable/types.ts` (sona ekle, 217. satırdan sonra)
- Modify: `src/portals/admin/timetable/api/timetableApi.ts`
- Test: `src/portals/admin/timetable/api/__tests__/exceptionsApi.test.ts` (yeni)

- [ ] **Step 1: types.ts'e P26 DTO ekle**

`src/portals/admin/timetable/types.ts` sonuna:

```ts
/** `GET /programs/:id/exceptions` satırı (backend ScheduleExceptionDto yansıması). */
export interface ScheduleExceptionDto {
  id: string;
  programId: string;
  branchId: string;
  date: string; // "YYYY-MM-DD"
  type: ScheduleExceptionType;
  targetPlacementId: string;
  day: number;
  period: number;
  originalTeacherId: string;
  originalTeacherName: string;
  newTeacherId: string | null;
  newTeacherName: string | null;
  originalRoomId: string | null;
  originalRoomName: string | null;
  newRoomId: string | null;
  newRoomName: string | null;
  reason: string;
  isActive: boolean;
  revokedAt: string | null;
  createdAt: string;
}
```

- [ ] **Step 2: Failing test yaz**

`src/portals/admin/timetable/api/__tests__/exceptionsApi.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { httpClient } from "../../../../../shared/api/httpClient";
import { timetableApi } from "../timetableApi";

vi.mock("../../../../../shared/api/httpClient", () => ({
  httpClient: { get: vi.fn(), post: vi.fn() },
}));

describe("timetableApi exceptions (P26/P27)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("listExceptions calls GET with from/to/includeRevoked and unwraps data", async () => {
    (httpClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { data: [{ id: "e1", type: "Cancellation" }] },
    });
    const res = await timetableApi.listExceptions("p1", { from: "2026-06-15", to: "2026-06-19" });
    expect(httpClient.get).toHaveBeenCalledWith(
      "/timetable/programs/p1/exceptions",
      expect.objectContaining({ params: { from: "2026-06-15", to: "2026-06-19", includeRevoked: false } }),
    );
    expect(res).toEqual([{ id: "e1", type: "Cancellation" }]);
  });

  it("revokeException posts reason to revoke route", async () => {
    (httpClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({});
    await timetableApi.revokeException("p1", "e1", "geri alındı");
    expect(httpClient.post).toHaveBeenCalledWith(
      "/timetable/programs/p1/exceptions/e1/revoke",
      { reason: "geri alındı" },
    );
  });
});
```

- [ ] **Step 3: Test'i çalıştır (kırmızı)**

Run: `npm run test -- src/portals/admin/timetable/api/__tests__/exceptionsApi.test.ts`
Expected: FAIL — `timetableApi.listExceptions is not a function`.

- [ ] **Step 4: timetableApi'ye ekle**

`timetableApi.ts` içinde `createException`'dan sonra, kapanış `}` öncesi:

```ts
  listExceptions: async (
    programId: string,
    opts?: { from?: string; to?: string; includeRevoked?: boolean },
    signal?: AbortSignal,
  ): Promise<ScheduleExceptionDto[]> => {
    const res = await httpClient.get<ApiEnvelope<ScheduleExceptionDto[]>>(
      `/timetable/programs/${programId}/exceptions`,
      {
        params: {
          from: opts?.from,
          to: opts?.to,
          includeRevoked: opts?.includeRevoked ?? false,
        },
        signal,
      },
    );
    return res.data.data;
  },

  revokeException: async (programId: string, eid: string, reason: string): Promise<void> => {
    await httpClient.post(`/timetable/programs/${programId}/exceptions/${eid}/revoke`, { reason });
  },
```

`types.ts` import listesine `ScheduleExceptionDto` ekle (mevcut `import type { … } from "../types";` bloğuna).

- [ ] **Step 5: Test yeşil**

Run: `npm run test -- src/portals/admin/timetable/api/__tests__/exceptionsApi.test.ts`
Expected: PASS (2 test).

- [ ] **Step 6: Commit**

```bash
git add src/portals/admin/timetable/types.ts src/portals/admin/timetable/api/timetableApi.ts src/portals/admin/timetable/api/__tests__/exceptionsApi.test.ts
git commit -m "2026-06-14 feat,test: Timetable P26 listExceptions + P27 revokeException FE wrapper'ları + DTO."
```

---

## Task 2: `tempChanges.ts` saf store modeli + reducer'lar

**Files:**
- Create: `src/portals/admin/timetable/editor/lib/tempChanges.ts`
- Test: `src/portals/admin/timetable/editor/lib/__tests__/tempChanges.test.ts`

**Veri tipleri (tasarım dokümanı §3 ile birebir):**

- [ ] **Step 1: Failing test yaz**

`.../lib/__tests__/tempChanges.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  initTempChanges, addSub, addCancel, removeDraft, markPublished,
  undoAllPublished, draftKeys, draftCount, pubCount, hasTempChanges,
  resolveDate, toExceptionBody, type TempChange,
} from "../tempChanges";

const base = {
  key: "pl1", dayIdx: 0, period: 3, subName: "Matematik",
  origTeacher: "A. Yılmaz", when: "this" as const, dateLabel: "15 Haz",
  date: "2026-06-15", reason: "Rapor", notify: { t: true, s: true, p: true },
};

describe("tempChanges store", () => {
  it("addSub adds a draft substitution keyed by placement", () => {
    const s = addSub(initTempChanges(), { ...base, type: "sub", teacher: "B. Şen", newTeacherId: "t2", published: false });
    expect(draftKeys(s)).toEqual(["pl1"]);
    expect(s["pl1"].type).toBe("sub");
    expect(s["pl1"].published).toBe(false);
  });

  it("addCancel replaces an existing draft for the same placement", () => {
    let s = addSub(initTempChanges(), { ...base, type: "sub", teacher: "B", newTeacherId: "t2", published: false });
    s = addCancel(s, { ...base, type: "cancel", makeup: true, published: false });
    expect(draftKeys(s)).toEqual(["pl1"]);
    expect(s["pl1"].type).toBe("cancel");
  });

  it("removeDraft drops a draft entry", () => {
    const s = removeDraft(addCancel(initTempChanges(), { ...base, type: "cancel", published: false }), "pl1");
    expect(hasTempChanges(s)).toBe(false);
  });

  it("markPublished flips drafts to published with exception ids", () => {
    let s = addCancel(initTempChanges(), { ...base, type: "cancel", published: false });
    s = markPublished(s, { pl1: "ex-1" });
    expect(s["pl1"].published).toBe(true);
    expect(s["pl1"].exceptionId).toBe("ex-1");
    expect(draftCount(s)).toBe(0);
    expect(pubCount(s)).toBe(1);
  });

  it("undoAllPublished removes the entries published in the last batch", () => {
    let s = markPublished(addCancel(initTempChanges(), { ...base, type: "cancel", published: false }), { pl1: "ex-1" });
    s = undoAllPublished(s, ["pl1"]);
    expect(hasTempChanges(s)).toBe(false);
  });

  it("resolveDate computes ISO from week + dayIdx (now injected)", () => {
    // 2026-06-14 is a Sunday; 'this' week Monday(0)=15, next week=22
    const now = new Date("2026-06-14T10:00:00Z");
    expect(resolveDate("this", 0, now)).toBe("2026-06-15");
    expect(resolveDate("next", 0, now)).toBe("2026-06-22");
    expect(resolveDate("this", 4, now)).toBe("2026-06-19");
  });

  it("toExceptionBody maps a sub change to P25 body", () => {
    const c: TempChange = { ...base, type: "sub", teacher: "B", newTeacherId: "t2", published: false };
    expect(toExceptionBody(c)).toEqual({
      date: "2026-06-15", type: "TeacherSubstitution", targetPlacementId: "pl1",
      newTeacherId: "t2", newRoomId: null, reason: "Rapor",
    });
  });

  it("toExceptionBody maps a cancel change to P25 body", () => {
    const c: TempChange = { ...base, type: "cancel", published: false };
    expect(toExceptionBody(c)).toEqual({
      date: "2026-06-15", type: "Cancellation", targetPlacementId: "pl1",
      newTeacherId: null, newRoomId: null, reason: "Rapor",
    });
  });
});
```

- [ ] **Step 2: Test kırmızı**

Run: `npm run test -- src/portals/admin/timetable/editor/lib/__tests__/tempChanges.test.ts`
Expected: FAIL — modül yok.

- [ ] **Step 3: tempChanges.ts implement**

```ts
import type { CreateExceptionInput } from "../../types";

export type TempKind = "sub" | "cancel";
export type WhenWeek = "this" | "next";

export interface TempChange {
  key: string; // placementId
  type: TempKind;
  dayIdx: number; // 0..4 (Pzt..Cum)
  period: number;
  subName: string;
  color?: string;
  origTeacher: string;
  when: WhenWeek;
  dateLabel: string;
  date: string; // ISO "YYYY-MM-DD" (P25 için)
  reason: string;
  teacher?: string; // sub: vekil adı
  newTeacherId?: string; // sub: P25 için
  makeup?: boolean; // cancel: telafi (UI-only Debt)
  notify: { t: boolean; s: boolean; p: boolean };
  published: boolean;
  exceptionId?: string; // publish sonrası P25'ten döner
}

export type TempChangeState = Record<string, TempChange>;

export function initTempChanges(): TempChangeState {
  return {};
}

export function hasTempChanges(s: TempChangeState): boolean {
  return Object.keys(s).length > 0;
}

export function draftKeys(s: TempChangeState): string[] {
  return Object.keys(s).filter((k) => !s[k].published);
}

export function draftCount(s: TempChangeState): number {
  return draftKeys(s).length;
}

export function pubCount(s: TempChangeState): number {
  return Object.keys(s).filter((k) => s[k].published).length;
}

export function addSub(s: TempChangeState, c: TempChange): TempChangeState {
  return { ...s, [c.key]: { ...c, type: "sub" } };
}

export function addCancel(s: TempChangeState, c: TempChange): TempChangeState {
  return { ...s, [c.key]: { ...c, type: "cancel" } };
}

export function removeDraft(s: TempChangeState, key: string): TempChangeState {
  const { [key]: _drop, ...rest } = s;
  return rest;
}

/** Taslakları yayınlanmış işaretle (key→exceptionId eşlemesiyle). */
export function markPublished(s: TempChangeState, ids: Record<string, string>): TempChangeState {
  const next: TempChangeState = { ...s };
  for (const [key, exceptionId] of Object.entries(ids)) {
    if (next[key]) next[key] = { ...next[key], published: true, exceptionId };
  }
  return next;
}

/** Verilen key'leri state'ten düşür (yayın-sonrası undo-all veya tek revoke). */
export function undoAllPublished(s: TempChangeState, keys: string[]): TempChangeState {
  const next: TempChangeState = { ...s };
  for (const k of keys) delete next[k];
  return next;
}

/** P26 yanıtından (aktif istisnalar) yayınlanmış tepsi satırları üret. */
export function loadPublished(
  items: { id: string; targetPlacementId: string; type: string; date: string; day: number; period: number; subjectName?: string; originalTeacherName: string; newTeacherName?: string | null; reason: string }[],
  dateLabelOf: (iso: string) => string,
): TempChangeState {
  const out: TempChangeState = {};
  for (const it of items) {
    out[it.targetPlacementId] = {
      key: it.targetPlacementId,
      type: it.type === "Cancellation" ? "cancel" : "sub",
      dayIdx: it.day,
      period: it.period,
      subName: it.subjectName ?? "—",
      origTeacher: it.originalTeacherName,
      when: "this",
      dateLabel: dateLabelOf(it.date),
      date: it.date,
      reason: it.reason,
      teacher: it.newTeacherName ?? undefined,
      notify: { t: true, s: true, p: true },
      published: true,
      exceptionId: it.id,
    };
  }
  return out;
}

/** "this"/"next" hafta + dayIdx(0=Pzt..4=Cum) → ISO tarih. `now` enjekte edilir (test). */
export function resolveDate(when: WhenWeek, dayIdx: number, now: Date): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dow = d.getUTCDay(); // 0=Sun..6=Sat
  const isoDow = dow === 0 ? 7 : dow; // 1=Mon..7=Sun
  const mondayOffset = 1 - isoDow; // bu haftanın Pazartesi'sine offset
  d.setUTCDate(d.getUTCDate() + mondayOffset + dayIdx + (when === "next" ? 7 : 0));
  return d.toISOString().slice(0, 10);
}

export function toExceptionBody(c: TempChange): CreateExceptionInput {
  return c.type === "cancel"
    ? { date: c.date, type: "Cancellation", targetPlacementId: c.key, newTeacherId: null, newRoomId: null, reason: c.reason }
    : { date: c.date, type: "TeacherSubstitution", targetPlacementId: c.key, newTeacherId: c.newTeacherId ?? null, newRoomId: null, reason: c.reason };
}
```

- [ ] **Step 4: Test yeşil**

Run: `npm run test -- src/portals/admin/timetable/editor/lib/__tests__/tempChanges.test.ts`
Expected: PASS (8 test).

- [ ] **Step 5: Commit**

```bash
git add src/portals/admin/timetable/editor/lib/tempChanges.ts src/portals/admin/timetable/editor/lib/__tests__/tempChanges.test.ts
git commit -m "2026-06-14 feat,test: Geçici değişiklik tepsisi saf store modeli (tempChanges) + reducer'lar + resolveDate/toExceptionBody."
```

---

## Task 3: `useTempChanges` hook

**Files:**
- Create: `src/portals/admin/timetable/editor/hooks/useTempChanges.ts`
- Test: `src/portals/admin/timetable/editor/hooks/__tests__/useTempChanges.test.tsx`

- [ ] **Step 1: Failing test**

```tsx
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTempChanges } from "../useTempChanges";

const draft = {
  key: "pl1", type: "cancel" as const, dayIdx: 0, period: 3, subName: "Mat",
  origTeacher: "A", when: "this" as const, dateLabel: "15 Haz", date: "2026-06-15",
  reason: "Rapor", notify: { t: true, s: true, p: true }, published: false,
};

describe("useTempChanges", () => {
  it("adds, marks published, and reports counts", () => {
    const { result } = renderHook(() => useTempChanges());
    act(() => result.current.addCancel(draft));
    expect(result.current.hasTemp).toBe(true);
    expect(result.current.draftCount).toBe(1);
    act(() => result.current.publishLocally({ pl1: "ex-1" }));
    expect(result.current.pubCount).toBe(1);
    expect(result.current.draftCount).toBe(0);
  });

  it("removes a draft", () => {
    const { result } = renderHook(() => useTempChanges());
    act(() => result.current.addCancel(draft));
    act(() => result.current.remove("pl1"));
    expect(result.current.hasTemp).toBe(false);
  });
});
```

- [ ] **Step 2: Test kırmızı**

Run: `npm run test -- src/portals/admin/timetable/editor/hooks/__tests__/useTempChanges.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
import { useState, useCallback, useMemo } from "react";
import {
  initTempChanges, addSub, addCancel, removeDraft, markPublished, undoAllPublished,
  loadPublished, hasTempChanges, draftCount, pubCount, draftKeys,
  type TempChange, type TempChangeState,
} from "../lib/tempChanges";

export function useTempChanges() {
  const [state, setState] = useState<TempChangeState>(initTempChanges);

  const addSubstitute = useCallback((c: TempChange) => setState((s) => addSub(s, c)), []);
  const addCancelLesson = useCallback((c: TempChange) => setState((s) => addCancel(s, c)), []);
  const remove = useCallback((key: string) => setState((s) => removeDraft(s, key)), []);
  const publishLocally = useCallback((ids: Record<string, string>) => setState((s) => markPublished(s, ids)), []);
  const undoBatch = useCallback((keys: string[]) => setState((s) => undoAllPublished(s, keys)), []);
  const loadFromServer = useCallback(
    (items: Parameters<typeof loadPublished>[0], dateLabelOf: Parameters<typeof loadPublished>[1]) =>
      setState((s) => ({ ...loadPublished(items, dateLabelOf), ...filterDrafts(s) })),
    [],
  );

  return useMemo(
    () => ({
      state,
      hasTemp: hasTempChanges(state),
      draftCount: draftCount(state),
      pubCount: pubCount(state),
      draftKeys: draftKeys(state),
      addSubstitute,
      addCancel: addCancelLesson,
      remove,
      publishLocally,
      undoBatch,
      loadFromServer,
    }),
    [state, addSubstitute, addCancelLesson, remove, publishLocally, undoBatch, loadFromServer],
  );
}

/** loadFromServer çağrısında yerel taslaklar korunur (yalnız published'lar sunucudan tazelenir). */
function filterDrafts(s: TempChangeState): TempChangeState {
  const out: TempChangeState = {};
  for (const k of Object.keys(s)) if (!s[k].published) out[k] = s[k];
  return out;
}
```

- [ ] **Step 4: Test yeşil**

Run: `npm run test -- src/portals/admin/timetable/editor/hooks/__tests__/useTempChanges.test.tsx`
Expected: PASS (2 test).

- [ ] **Step 5: Commit**

```bash
git add src/portals/admin/timetable/editor/hooks/useTempChanges.ts src/portals/admin/timetable/editor/hooks/__tests__/useTempChanges.test.tsx
git commit -m "2026-06-14 feat,test: useTempChanges hook (taslak ekle/sil/yayınla-yerel/undo-batch/sunucudan yükle)."
```

---

## Task 4: i18n anahtarları (`temp.*`)

**Files:**
- Modify: `src/shared/i18n/locales/tr/timetable.json`
- Modify: `src/shared/i18n/locales/en/timetable.json`

- [ ] **Step 1: tr/timetable.json kök `timetable` objesine `temp` ekle**

`timetable` objesinin içine (mevcut `publish`/`editor` kardeşi olarak) ekle:

```json
"temp": {
  "panel": {
    "title": "{{count}} geçici değişiklik",
    "thisWeek": "bu hafta",
    "drafts": "{{count}} taslak",
    "published": "{{count}} yayında",
    "publish": "Geçici Yayınla",
    "publishN": "Geçici Yayınla ({{count}})",
    "statusDraft": "Taslak",
    "statusPub": "Yayında",
    "undo": "Geri al",
    "rowSub": "Vekil: {{teacher}} · {{reason}} · {{date}}",
    "rowCancel": "İptal · {{reason}} · {{date}}",
    "rowCancelMakeup": "İptal · {{reason}} · telafi planlı · {{date}}",
    "rowTitle": "{{day}} · {{period}}. ders — {{subject}}"
  },
  "when": {
    "label": "Hangi gün için?",
    "this": "Bu hafta",
    "next": "Gelecek hafta"
  },
  "reasonLabel": "Sebep",
  "subReasons": { "report": "Rapor", "leave": "İzinli", "duty": "Görevlendirme", "unpaid": "Ücretsiz izin", "other": "Diğer" },
  "cancelReasons": { "noTeacher": "Öğretmen yok", "holiday": "Resmi tatil", "event": "Okul etkinliği", "exam": "Sınav", "other": "Diğer" },
  "notify": {
    "label": "Kimler bilgilendirilsin?",
    "teachers": "İlgili öğretmenler",
    "teachersSub": "Asıl ve vekil öğretmen",
    "students": "Öğrenciler",
    "parents": "Veliler"
  },
  "sub": {
    "title": "Vekil Öğretmen Ata",
    "subtitle": "{{subject}} · {{day}} · {{period}}. ders",
    "origTitle": "{{teacher}}",
    "origSub": "Asıl öğretmen · gelemiyor",
    "permTag": "Kalıcı program korunur",
    "pickLabel": "Vekil öğretmen",
    "pickHint": "branşa uygun önerilir",
    "sameBranch": "aynı branş",
    "free": "Bu saat boş",
    "busy": "Meşgul",
    "apply": "Geçici Olarak Ata",
    "cancel": "Vazgeç",
    "note": "Bu değişiklik yalnızca {{day}} {{date}} için geçerlidir. Haftalık kalıcı program {{teacher}} ile devam eder.",
    "loading": "Müsait öğretmenler yükleniyor…",
    "empty": "Bu saat için müsait öğretmen bulunamadı.",
    "loadFailed": "Müsait öğretmenler yüklenemedi."
  },
  "cancel": {
    "title": "Dersi İptal Et",
    "subtitle": "{{subject}} · {{day}} · {{period}}. ders",
    "origTitle": "{{subject}} · {{teacher}}",
    "origSub": "Bu gün için işlenmeyecek",
    "permTag": "Kalıcı program korunur",
    "makeupTitle": "Telafi dersi planla",
    "makeupSub": "İptal sonrası boş bir saate telafi önerilir",
    "apply": "Dersi İptal Et",
    "cancelBtn": "Vazgeç",
    "note": "Ders yalnızca {{day}} {{date}} için iptal edilir; sonraki haftalarda normal işlenir."
  },
  "publishFlow": {
    "title": "Geçici Yayınla",
    "subtitle": "{{count}} değişiklik · bu hafta",
    "note": "Geçici yayın kalıcı sürümü değiştirmez — yeni sürüm numarası üretmez. Yalnızca seçili günlerde geçerlidir.",
    "publish": "Yayınla",
    "cancel": "Vazgeç",
    "publishingTitle": "Geçici Yayınlanıyor",
    "publishingSub": "Günlük değişiklikler uygulanıyor…",
    "doneTitle": "Geçici Değişiklik Yayında",
    "doneSub": "{{count}} geçici değişiklik bu hafta için yayında",
    "doneBody": "Yalnızca ilgili günlerde geçerli; kalıcı haftalık program değişmedi.",
    "undoTitle": "Bu yayını geri alabilirsiniz",
    "undoSub": "Değişiklikler taslağa döner · {{count}}sn kaldı",
    "undo": "Geri Al",
    "undoExpiredTitle": "Geri alma süresi doldu",
    "undoExpiredSub": "Değişiklik için tepsiden tek tek geri alabilirsiniz",
    "ok": "Tamam",
    "students": "Öğrenci",
    "teachers": "Öğretmen",
    "parents": "Veli",
    "applyFailed": "Geçici değişiklik uygulanamadı."
  },
  "cell": { "subBadge": "VEKİL", "cancelBadge": "İPTAL" }
}
```

- [ ] **Step 2: en/timetable.json'a aynı yapıda İngilizce karşılıklar ekle**

(Aynı anahtarlar; örnek: `"sub": { "title": "Assign Substitute Teacher", … }`, `"cell": { "subBadge": "SUB", "cancelBadge": "CANCELLED" }`, vb. Mevcut `en/timetable.json`'daki ton ile.)

- [ ] **Step 3: JSON geçerliliği + build**

Run: `npm run build`
Expected: hata yok (JSON parse + tip kontrolü temiz).

- [ ] **Step 4: Commit**

```bash
git add src/shared/i18n/locales/tr/timetable.json src/shared/i18n/locales/en/timetable.json
git commit -m "2026-06-14 feat: Geçici değişiklik tepsisi/modallar için timetable.temp.* i18n (tr/en)."
```

---

## Task 5: `SubstituteModal` bileşeni

**Files:**
- Create: `src/portals/admin/timetable/editor/components/SubstituteModal.tsx`
- Test: `src/portals/admin/timetable/editor/components/__tests__/SubstituteModal.test.tsx`
- **Port kaynağı:** `schedule_temp_changes.jsx:106-170` (`SubstituteFlow`) + ortak parçalar `:48-104`.

**Props sözleşmesi:**
```ts
interface SubstituteModalProps {
  ctx: { placementId: string; dayIdx: number; period: number; subName: string; color?: string; origTeacher: string };
  /** P28 sonucu (id→ad); null = yükleniyor/devre dışı. */
  available: Map<string, string> | null;
  availableLoading: boolean;
  availableError: boolean;
  /** when değişince çağrılır → ScheduleEditorPage resolveDate ile dateLabel/date hesaplar. */
  resolveWhen: (when: "this" | "next", dayIdx: number) => { date: string; dateLabel: string };
  onClose: () => void;
  onApply: (change: import("../lib/tempChanges").TempChange) => void;
}
```

> **Not:** Prototipteki `TC_SUBS_BY_BRANCH` mock'u DEĞİL, gerçek P28 `available` haritası kullanılır. "aynı branş" işareti P28 zaten branş-uygun döndürdüğü için tüm satırlara uygulanmaz; uygunluk = `available` listesinde olmak (hepsi `free`). Busy ayrımı backend'de yok → bu modelde tüm öneriler seçilebilir (Debt-BE-5 notu geçerli).

- [ ] **Step 1: Failing test**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "../../../../../shared/i18n";
import { SubstituteModal } from "../SubstituteModal";

const ctx = { placementId: "pl1", dayIdx: 0, period: 3, subName: "Matematik", origTeacher: "A. Yılmaz" };
const resolveWhen = () => ({ date: "2026-06-15", dateLabel: "15 Haz" });

describe("SubstituteModal", () => {
  it("apply is disabled until a substitute is picked, then emits a sub TempChange", () => {
    const onApply = vi.fn();
    render(
      <SubstituteModal ctx={ctx} available={new Map([["t2", "B. Şen"]])} availableLoading={false}
        availableError={false} resolveWhen={resolveWhen} onClose={() => {}} onApply={onApply} />,
    );
    const applyBtn = screen.getByRole("button", { name: /Geçici Olarak Ata/i });
    expect(applyBtn).toBeDisabled();
    fireEvent.click(screen.getByText("B. Şen"));
    expect(applyBtn).not.toBeDisabled();
    fireEvent.click(applyBtn);
    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({ key: "pl1", type: "sub", teacher: "B. Şen", newTeacherId: "t2", published: false, date: "2026-06-15" }),
    );
  });

  it("shows loading and empty states", () => {
    const { rerender } = render(
      <SubstituteModal ctx={ctx} available={null} availableLoading resolveWhen={resolveWhen}
        availableError={false} onClose={() => {}} onApply={() => {}} />,
    );
    expect(screen.getByText(/yükleniyor/i)).toBeInTheDocument();
    rerender(
      <SubstituteModal ctx={ctx} available={new Map()} availableLoading={false} availableError={false}
        resolveWhen={resolveWhen} onClose={() => {}} onApply={() => {}} />,
    );
    expect(screen.getByText(/müsait öğretmen bulunamadı/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Test kırmızı**

Run: `npm run test -- src/portals/admin/timetable/editor/components/__tests__/SubstituteModal.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement** — `SubstituteModal.tsx`

Tasarım: prototip `SubstituteFlow` (satır 106-170). Mevcut proje modal kabuğu yok → PublishDrawer'daki `DrawerShell` deseni yerine basit bir merkezi modal kabuğu kullan: `<div className="drawer-scrim"/>` + `<div className="tc-modal stu">…</div>` (CSS Task 9'da). İçerik:

- Başlık `t("temp.sub.title")` + alt başlık `t("temp.sub.subtitle", { subject, day, period })`.
- `origTeacher` kartı (avatar baş harfleri + "Asıl öğretmen · gelemiyor" + kilit etiketi).
- **When seg** (`temp.when.this/next`) → seçilince `resolveWhen(when, dayIdx)` ile `dateLabel`/`date` güncelle (local state).
- **Reason çipleri** `temp.subReasons.*` (varsayılan `report`). Seçili değer reason metni olarak saklanır (i18n karşılığı, ör. `t("temp.subReasons.report")`).
- **Vekil listesi:** `available` haritasından `[...available].map`; satır tıklanınca `setSub({ id, name })`. Yükleniyor/empty/error durumları (`availableLoading`/`available.size===0`/`availableError`).
- **Bildirim toggle'ları** (`temp.notify.*`), varsayılan `{t:true,s:true,p:true}`.
- Footer: Vazgeç (`onClose`) + **Geçici Olarak Ata** (`disabled = !sub`). Tıklayınca:
```ts
onApply({
  key: ctx.placementId, type: "sub", dayIdx: ctx.dayIdx, period: ctx.period,
  subName: ctx.subName, color: ctx.color, origTeacher: ctx.origTeacher,
  when, dateLabel, date, reason, teacher: sub.name, newTeacherId: sub.id,
  notify, published: false,
});
```
- Alt not `t("temp.sub.note", { day: t(weekdays.dayIdx), date: dateLabel, teacher: origTeacher })`.

Gün adı: `t(\`editor.weekdays.${ctx.dayIdx}\`)`. Avatar yardımcıları (baş harf/renk) bu dosyada küçük saf fonksiyon. **Inline style yok** (avatar rengi gerekiyorsa `data-*` + CSS veya sınıf paleti; prototipteki `style={{background}}` yerine CSS sınıf paleti `tc-av-0..5` kullan — `cn()` ile `tc-av-${idx}`).

- [ ] **Step 4: Test yeşil**

Run: `npm run test -- src/portals/admin/timetable/editor/components/__tests__/SubstituteModal.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/portals/admin/timetable/editor/components/SubstituteModal.tsx src/portals/admin/timetable/editor/components/__tests__/SubstituteModal.test.tsx
git commit -m "2026-06-14 feat,test: Vekil Öğretmen Ata zengin modalı (when/reason/P28 vekil/bildirim → TempChange)."
```

---

## Task 6: `CancelLessonModal` bileşeni

**Files:**
- Create: `src/portals/admin/timetable/editor/components/CancelLessonModal.tsx`
- Test: `.../__tests__/CancelLessonModal.test.tsx`
- **Port kaynağı:** `schedule_temp_changes.jsx:172-219` (`CancelLessonFlow`).

**Props:**
```ts
interface CancelLessonModalProps {
  ctx: { placementId: string; dayIdx: number; period: number; subName: string; color?: string; origTeacher: string };
  resolveWhen: (when: "this" | "next", dayIdx: number) => { date: string; dateLabel: string };
  onClose: () => void;
  onApply: (change: import("../lib/tempChanges").TempChange) => void;
}
```

- [ ] **Step 1: Failing test**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "../../../../../shared/i18n";
import { CancelLessonModal } from "../CancelLessonModal";

const ctx = { placementId: "pl1", dayIdx: 2, period: 5, subName: "Fizik", origTeacher: "N. Güneş" };
const resolveWhen = () => ({ date: "2026-06-17", dateLabel: "17 Haz" });

describe("CancelLessonModal", () => {
  it("emits a cancel TempChange with makeup flag when toggled", () => {
    const onApply = vi.fn();
    render(<CancelLessonModal ctx={ctx} resolveWhen={resolveWhen} onClose={() => {}} onApply={onApply} />);
    fireEvent.click(screen.getByText(/Telafi dersi planla/i));
    fireEvent.click(screen.getByRole("button", { name: /Dersi İptal Et/i }));
    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({ key: "pl1", type: "cancel", makeup: true, published: false, date: "2026-06-17" }),
    );
  });
});
```

- [ ] **Step 2: Test kırmızı**

Run: `npm run test -- src/portals/admin/timetable/editor/components/__tests__/CancelLessonModal.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement** — SubstituteModal ile aynı kabuk; farklar:
- İkon/ton `warning`, başlık `temp.cancel.title`.
- `origTeacher` kartı iptal varyantı (yasak ikonu).
- When seg + reason çipleri (`temp.cancelReasons.*`, varsayılan `noTeacher`).
- **Telafi planla toggle** (`temp.cancel.makeupTitle/Sub`), `makeup` state.
- Bildirim toggle'ları.
- Footer: Vazgeç + **Dersi İptal Et** (`btn btn-warn`, her zaman aktif). `onApply`:
```ts
onApply({
  key: ctx.placementId, type: "cancel", dayIdx: ctx.dayIdx, period: ctx.period,
  subName: ctx.subName, color: ctx.color, origTeacher: ctx.origTeacher,
  when, dateLabel, date, reason, makeup, notify, published: false,
});
```

- [ ] **Step 4: Test yeşil**

Run: `npm run test -- src/portals/admin/timetable/editor/components/__tests__/CancelLessonModal.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/portals/admin/timetable/editor/components/CancelLessonModal.tsx src/portals/admin/timetable/editor/components/__tests__/CancelLessonModal.test.tsx
git commit -m "2026-06-14 feat,test: Dersi İptal Et zengin modalı (when/reason/telafi/bildirim → TempChange)."
```

---

## Task 7: `TempChangesPanel` (tepsi)

**Files:**
- Create: `src/portals/admin/timetable/editor/components/TempChangesPanel.tsx`
- Test: `.../__tests__/TempChangesPanel.test.tsx`
- **Port kaynağı:** `schedule_temp_changes.jsx:221-258` (`TempChangesPanel`).

**Props:**
```ts
interface TempChangesPanelProps {
  temps: import("../lib/tempChanges").TempChangeState;
  onUndo: (key: string) => void;     // taslak: yerel sil · yayında: P27 revoke (parent ayırır)
  onPublish: () => void;             // Geçici Yayınla → TempPublishModal aç
  onGoCell: (key: string) => void;   // satıra tıkla → hücreye git
}
```

- [ ] **Step 1: Failing test**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "../../../../../shared/i18n";
import { TempChangesPanel } from "../TempChangesPanel";
import type { TempChangeState } from "../../lib/tempChanges";

const temps: TempChangeState = {
  pl1: { key: "pl1", type: "sub", dayIdx: 0, period: 3, subName: "Mat", origTeacher: "A",
    when: "this", dateLabel: "15 Haz", date: "2026-06-15", reason: "Rapor", teacher: "B. Şen",
    notify: { t: true, s: true, p: true }, published: false },
  pl2: { key: "pl2", type: "cancel", dayIdx: 2, period: 5, subName: "Fizik", origTeacher: "N",
    when: "this", dateLabel: "17 Haz", date: "2026-06-17", reason: "Sınav",
    notify: { t: true, s: true, p: true }, published: true, exceptionId: "ex-2" },
};

describe("TempChangesPanel", () => {
  it("renders draft and published rows with counts and publish button", () => {
    render(<TempChangesPanel temps={temps} onUndo={() => {}} onPublish={() => {}} onGoCell={() => {}} />);
    expect(screen.getByText(/Taslak/)).toBeInTheDocument();
    expect(screen.getByText(/Yayında/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Geçici Yayınla/i })).toBeInTheDocument();
  });

  it("fires onUndo and onGoCell", () => {
    const onUndo = vi.fn(); const onGoCell = vi.fn();
    render(<TempChangesPanel temps={temps} onUndo={onUndo} onPublish={() => {}} onGoCell={onGoCell} />);
    fireEvent.click(screen.getAllByRole("button", { name: /Geri al/i })[0]);
    expect(onUndo).toHaveBeenCalled();
    fireEvent.click(screen.getByText(/Mat/));
    expect(onGoCell).toHaveBeenCalledWith("pl1");
  });

  it("renders nothing when empty", () => {
    const { container } = render(<TempChangesPanel temps={{}} onUndo={() => {}} onPublish={() => {}} onGoCell={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });
});
```

- [ ] **Step 2: Test kırmızı**

Run: `npm run test -- src/portals/admin/timetable/editor/components/__tests__/TempChangesPanel.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement** (prototip 221-258 birebir; mock yerine props):
- `entries.length === 0` → `return null`.
- Başlık: `t("temp.panel.title", { count })` + `· bu hafta` + alt satır taslak/yayında sayıları (`draftCount`/`pubCount`).
- `draftCount > 0` ise **Geçici Yayınla** butonu (`onPublish`), etiket `temp.panel.publishN` (count>1) / `temp.panel.publish`.
- Satırlar: ikon (sub=UserCheck, cancel=CalendarX) + `temp.panel.rowTitle` + özet (`rowSub`/`rowCancel`/`rowCancelMakeup`) + durum rozeti (`statusDraft`/`statusPub`) + **Geri al** butonu (`onUndo(key)`). Satır gövdesi tıklanınca `onGoCell(key)`.

- [ ] **Step 4: Test yeşil**

Run: `npm run test -- src/portals/admin/timetable/editor/components/__tests__/TempChangesPanel.test.tsx`
Expected: PASS (3 test).

- [ ] **Step 5: Commit**

```bash
git add src/portals/admin/timetable/editor/components/TempChangesPanel.tsx src/portals/admin/timetable/editor/components/__tests__/TempChangesPanel.test.tsx
git commit -m "2026-06-14 feat,test: Geçici değişiklikler tepsisi (taslak/yayında satırları + satır geri-al + Geçici Yayınla)."
```

---

## Task 8: `TempPublishModal` (onay → yayınlanıyor → başarı + geri-al penceresi)

**Files:**
- Create: `src/portals/admin/timetable/editor/components/TempPublishModal.tsx`
- Test: `.../__tests__/TempPublishModal.test.tsx`
- **Port kaynağı:** `schedule_temp_changes.jsx:260-343` (`TempPublishFlow`).

**Props:**
```ts
interface TempPublishModalProps {
  drafts: import("../lib/tempChanges").TempChange[]; // published=false olanlar
  onClose: () => void;
  /** Yayınla'ya basınca: P25 toplu create; key→exceptionId döner (Debt-FE-11: sıralı). */
  onPublish: () => Promise<Record<string, string>>;
  /** done sonrası markPublished çağrısı için (parent state). */
  onPublished: (ids: Record<string, string>) => void;
  /** Geri-al penceresinde "Geri Al": P27 revoke + state'ten düş. */
  onUndoAll: () => void;
}
```

- [ ] **Step 1: Failing test** (fake timer ile sayaç akışı):

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "../../../../../shared/i18n";
import { TempPublishModal } from "../TempPublishModal";
import type { TempChange } from "../../lib/tempChanges";

const drafts: TempChange[] = [
  { key: "pl1", type: "cancel", dayIdx: 0, period: 3, subName: "Mat", origTeacher: "A",
    when: "this", dateLabel: "15 Haz", date: "2026-06-15", reason: "Sınav",
    notify: { t: true, s: true, p: true }, published: false },
];

describe("TempPublishModal", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("confirm → publishing → done, then exposes undo window", async () => {
    const onPublish = vi.fn().mockResolvedValue({ pl1: "ex-1" });
    const onPublished = vi.fn();
    render(<TempPublishModal drafts={drafts} onClose={() => {}} onPublish={onPublish}
      onPublished={onPublished} onUndoAll={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /^Yayınla$/i }));
    await act(async () => { await Promise.resolve(); vi.advanceTimersByTime(1300); });
    await waitFor(() => expect(onPublished).toHaveBeenCalledWith({ pl1: "ex-1" }));
    expect(screen.getByText(/Bu yayını geri alabilirsiniz/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Test kırmızı**

Run: `npm run test -- src/portals/admin/timetable/editor/components/__tests__/TempPublishModal.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement** (prototip 260-343 uyarlaması; `window.Modal` yerine yerel modal kabuğu, `SuccessBody` yerine inline):
- `step` state: `confirm | publishing | done`.
- **confirm:** not satırı + taslak listesi (her satır gün/period/branş + özet + tarih) + etki kutuları (öğrenci/öğretmen/veli — sabit/`drafts`'tan türet: `students=24` mock yerine **etki bilinmiyor → sade say**; tasarım mock'u yerine `drafts.length` ve tip sayıları gösterilebilir; gerçek etki backend preview gerektirir → **Debt-BE-2 notu**). Footer Vazgeç + **Yayınla** → `setStep("publishing")`.
- **publishing:** spinner + metin; `useEffect` → `onPublish()` çağır, dönen ids'i sakla, `onPublished(ids)`, `setStep("done")`. Hata olursa `setStep("confirm")` + hata satırı (`temp.publishFlow.applyFailed`).
- **done:** başarı başlığı + body; `undo` sayaç state (8'den 0'a, `useEffect` setTimeout). `undo>0` → halka SVG (R=13, çevre hesabı prototipteki gibi) + `temp.publishFlow.undoSub` + **Geri Al** (`onUndoAll(); onClose()`). `undo===0` → "süre doldu" kutusu. Footer: **Tamam** (`onClose`).

> SVG `strokeDashoffset` hesabı prototip 291. satırdaki gibi: `const R=13, C=2*Math.PI*R, off=C*(1-undo/8)`. `Math.PI` kullanımı serbest (yalnız `Math.random`/`Date.now` yasak değil — burada yok).

- [ ] **Step 4: Test yeşil**

Run: `npm run test -- src/portals/admin/timetable/editor/components/__tests__/TempPublishModal.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/portals/admin/timetable/editor/components/TempPublishModal.tsx src/portals/admin/timetable/editor/components/__tests__/TempPublishModal.test.tsx
git commit -m "2026-06-14 feat,test: Geçici Yayınla modalı (onay→yayınlanıyor→başarı + geri-al penceresi halka sayaç)."
```

---

## Task 9: CSS — `tempChanges.css`

**Files:**
- Create: `src/portals/admin/timetable/editor/tempChanges.css`
- Modify: `src/portals/admin/timetable/ScheduleEditorPage.tsx` (import satırı — Task 10'da birlikte)
- **Port kaynağı:** `schedule_temp_changes.jsx` ile gelen `schedule_temp_changes.css` (aynı klasör).

- [ ] **Step 1: CSS'i port et**

`tempChanges.css` içine prototip `schedule_temp_changes.css`'teki sınıfları taşı; sınıf adlarını mevcut editör diline (`.sed-*`, `.tc-*`) uydur. Kapsanması gereken sınıflar (komponentlerde kullanılanlarla birebir): `.tc-modal`, `.tc-field`, `.tc-dateseg/.tc-dateopt`, `.tc-reasons/.tc-reason`, `.tc-sublist/.tc-suboption`, `.tc-orig`, `.tc-perm-tag`, `.tc-makeup`, `.tc-panel*`, `.tc-row*`, `.tc-pub-*`, `.tc-undowin/.ring`, avatar paleti `.tc-av-0..5`, hücre rozetleri `.sed-cell.temp-sub`, `.sed-cell.temp-cancel`, `.sed-cell .tc-cell-badge`, yayınlanmış yeşil nokta `.sed-cell .tc-pub-dot`. **Inline style yok** — renkler token/sınıf.

- [ ] **Step 2: Build doğrula**

Run: `npm run build`
Expected: CSS import edilince hata yok (import Task 10'da eklenir; bu adımda yalnız dosya geçerliliği — boş import edilebilir).

- [ ] **Step 3: Commit**

```bash
git add src/portals/admin/timetable/editor/tempChanges.css
git commit -m "2026-06-14 feat: Geçici değişiklik tepsisi/modal/hücre rozeti CSS'i (handoff port)."
```

---

## Task 10: CellMenu — temp item'ları modal açacak şekilde değiştir

**Files:**
- Modify: `src/portals/admin/timetable/editor/components/CellMenu.tsx`
- Test: mevcut `editor/__tests__/*` + yeni davranış; `.../__tests__/CellMenu.test.tsx` yoksa ekle.

**Değişiklik:** CellMenu'deki **inline "substitute" submenüsü kaldırılır**. Temp item'lar (`canTemp` bloğu) artık doğrudan parent callback'leri çağırır:
- "Vekil Öğretmen Ata" → `onOpenSubstituteModal()` (parent modalı açar; submenü YOK).
- "Dersi İptal Et" → `onOpenCancelModal()` (parent modalı açar; anında cancel YOK).

Props değişimi (CellMenu `Props`):
- **Kaldır:** `onOpenSubstitute`, `onSubstitute`, `onCancelLesson`, `availableTeachers`, `availableLoading`, `availableError` (vekil submenüsü gittiği için P28 artık modalda).
- **Ekle:** `onOpenSubstituteModal: () => void`, `onOpenCancelModal: () => void`.
- `sub` state tipinden `"substitute"` çıkar.

- [ ] **Step 1: Failing test** — `editor/components/__tests__/CellMenu.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import * as Popover from "@radix-ui/react-popover";
import { createRef } from "react";
import "../../../../../shared/i18n";
import { CellMenu } from "../CellMenu";
import type { PlacementDto, NameLookups } from "../../../types";

const placement: PlacementDto = { id: "pl1", day: 0, period: 3, subjectId: "s1", teacherId: "t1", roomId: null, isBlock: false, blockGroupId: null };
const lookups: NameLookups = { subjects: new Map([["s1", "Mat"]]), teachers: new Map([["t1", "A"]]), rooms: new Map() };

function setup(props: Partial<React.ComponentProps<typeof CellMenu>> = {}) {
  const onOpenSubstituteModal = vi.fn();
  const onOpenCancelModal = vi.fn();
  render(
    <Popover.Root open>
      <Popover.Anchor />
      <CellMenu open onOpenChange={() => {}} cellRef={createRef()} placement={placement} lookups={lookups}
        permLocked={false} canTemp branchTeachers={new Map([["t1", "A"]])}
        onAssignTeacher={() => {}} onAssignRoom={() => {}} onRemove={() => {}}
        onOpenSubstituteModal={onOpenSubstituteModal} onOpenCancelModal={onOpenCancelModal} {...props} />
    </Popover.Root>,
  );
  return { onOpenSubstituteModal, onOpenCancelModal };
}

describe("CellMenu temp items", () => {
  it("opens substitute modal (no inline submenu)", () => {
    const { onOpenSubstituteModal } = setup();
    fireEvent.click(screen.getByText(/Vekil Öğretmen Ata/i));
    expect(onOpenSubstituteModal).toHaveBeenCalled();
    expect(screen.queryByText(/Müsait/i)).not.toBeInTheDocument();
  });

  it("opens cancel modal", () => {
    const { onOpenCancelModal } = setup();
    fireEvent.click(screen.getByText(/Dersi İptal Et/i));
    expect(onOpenCancelModal).toHaveBeenCalled();
  });

  it("hides temp items when canTemp is false", () => {
    setup({ canTemp: false });
    expect(screen.queryByText(/Vekil Öğretmen Ata/i)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Test kırmızı**

Run: `npm run test -- src/portals/admin/timetable/editor/components/__tests__/CellMenu.test.tsx`
Expected: FAIL (eski props/submenü).

- [ ] **Step 3: CellMenu'yu düzenle**
- `Props`'tan vekil/cancel ilgili eski alanları kaldır, yeni iki callback ekle (yukarıdaki sözleşme).
- `sub` union'dan `"substitute"` kaldır; `sub === "substitute"` bloğunu sil.
- `canTemp` bloğundaki iki butonu:
```tsx
<button type="button" className="sed-cmenu-item" onClick={() => { onOpenSubstituteModal(); close(); }}>
  <UserCheck size={15} /> {t("editor.cellMenu.substitute")}
</button>
<button type="button" className="sed-cmenu-item danger" onClick={() => { onOpenCancelModal(); close(); }}>
  <CalendarX size={15} /> {t("editor.cellMenu.cancelLesson")}
</button>
```
- Kullanılmayan importları (`ChevronRight` hâlâ teacher/room submenüde kullanılıyor — kalsın) temizle.

- [ ] **Step 4: Test yeşil + mevcut editör testleri**

Run: `npm run test -- src/portals/admin/timetable/editor`
Expected: PASS (CellMenu yeni + diğerleri etkilenmeden).

- [ ] **Step 5: Commit**

```bash
git add src/portals/admin/timetable/editor/components/CellMenu.tsx src/portals/admin/timetable/editor/components/__tests__/CellMenu.test.tsx
git commit -m "2026-06-14 feat,test: Hücre menüsü temp item'ları inline submenü yerine zengin modal açar."
```

---

## Task 11: GridCell + WeekGrid — VEKİL/İPTAL/yayınlanmış işaretleri ve modal callback'leri

**Files:**
- Modify: `src/portals/admin/timetable/editor/components/GridCell.tsx`
- Modify: `src/portals/admin/timetable/editor/components/WeekGrid.tsx`
- Test: `.../__tests__/GridCell.tempMark.test.tsx` (yeni)

**GridCell Props değişimi:**
- `isTemp: boolean` → **kaldır**; yerine `tempMark?: { type: "sub" | "cancel"; teacher?: string; published: boolean }`.
- CellMenu'ye giden vekil/cancel prop'ları `onOpenSubstituteModal`/`onOpenCancelModal`'a çevrilir; `availableTeachers/...` GridCell'den de kaldırılır (artık modalda).
- Render: `tempMark` varsa hücreye sınıf (`temp-sub`/`temp-cancel`) + rozet (`t("temp.cell.subBadge")` teal / `t("temp.cell.cancelBadge")` kırmızı taramalı) + sub ise asıl öğretmen üstü çizili + yeni vekil adı + `published` ise yeşil nokta (`.tc-pub-dot`).

**WeekGrid Props değişimi:**
- `tempIds: Set<string>` → **kaldır**; yerine `tempMarks: Map<string /*placementId*/, { type: "sub"|"cancel"; teacher?: string; published: boolean }>`.
- `availableTeachers/availableLoading/availableError/onOpenSubstitute/onSubstitute/onCancelLesson` → **kaldır**.
- Ekle: `onOpenSubstituteModal: (placementId: string, day: number, period: number) => void`, `onOpenCancelModal: (placementId: string, day: number, period: number) => void`.
- GridCell'e `tempMark={placement ? tempMarks.get(placement.id) : undefined}` geçir; modal callback'lerini `() => onOpenSubstituteModal(placement!.id, d, row.period)` ile bağla.

- [ ] **Step 1: Failing test** — `GridCell.tempMark.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DndContext } from "@dnd-kit/core";
import "../../../../../shared/i18n";
import { GridCell } from "../GridCell";
import type { PlacementDto, NameLookups } from "../../../types";

const placement: PlacementDto = { id: "pl1", day: 0, period: 3, subjectId: "s1", teacherId: "t1", roomId: null, isBlock: false, blockGroupId: null };
const lookups: NameLookups = { subjects: new Map([["s1", "Mat"]]), teachers: new Map([["t1", "A. Yılmaz"]]), rooms: new Map() };

function renderCell(tempMark?: React.ComponentProps<typeof GridCell>["tempMark"]) {
  render(
    <DndContext>
      <GridCell day={0} period={3} placement={placement} lookups={lookups} flash={null}
        onAssignTeacher={() => {}} onAssignRoom={() => {}} onRemove={() => {}} canTemp permLocked={false}
        branchTeachers={new Map()} onOpenSubstituteModal={() => {}} onOpenCancelModal={() => {}}
        isConflict={false} tempMark={tempMark} />
    </DndContext>,
  );
}

describe("GridCell temp marks", () => {
  it("renders VEKİL badge for a substitution", () => {
    renderCell({ type: "sub", teacher: "B. Şen", published: false });
    expect(screen.getByText("VEKİL")).toBeInTheDocument();
  });
  it("renders İPTAL badge for a cancellation", () => {
    renderCell({ type: "cancel", published: true });
    expect(screen.getByText("İPTAL")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Test kırmızı**

Run: `npm run test -- src/portals/admin/timetable/editor/components/__tests__/GridCell.tempMark.test.tsx`
Expected: FAIL.

- [ ] **Step 3: GridCell + WeekGrid implement** (yukarıdaki props değişimi). CellMenu çağrısı yeni prop'larla; `tempMark` render bloğu eklenir.

- [ ] **Step 4: Test yeşil**

Run: `npm run test -- src/portals/admin/timetable/editor/components/__tests__/GridCell.tempMark.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/portals/admin/timetable/editor/components/GridCell.tsx src/portals/admin/timetable/editor/components/WeekGrid.tsx src/portals/admin/timetable/editor/components/__tests__/GridCell.tempMark.test.tsx
git commit -m "2026-06-14 feat,test: Hücre VEKİL/İPTAL/yayınlanmış işaretleri + modal-aç callback'leri (GridCell/WeekGrid)."
```

---

## Task 12: ScheduleEditorPage entegrasyonu (store + modallar + tepsi + publish + guard'lar)

**Files:**
- Modify: `src/portals/admin/timetable/ScheduleEditorPage.tsx`
- Test: `src/portals/admin/timetable/editor/__tests__/ScheduleEditorPage.test.tsx` (mevcut — temp akışı senaryosu ekle)

**Değişiklikler (özet):**
1. Import: `useTempChanges`, `SubstituteModal`, `CancelLessonModal`, `TempChangesPanel`, `TempPublishModal`, `timetableApi`, `tempChanges.css`, `resolveDate`, `toExceptionBody`.
2. `const tc = useTempChanges();` (mevcut `temp = useTempActions()` **KALIR** — PublishDrawer bağımsız).
3. Guard'ları yeni store'a bağla: `const permLocked = tc.hasTemp;` (eski `temp.hasTemp` yerine). `canTemp = isPublished && !tempLocked` aynı.
4. Modal state: `const [subCtx, setSubCtx] = useState<CtxOrNull>(null);` ve `const [cancelCtx, setCancelCtx] = useState<CtxOrNull>(null);` ve `const [tempPublishOpen, setTempPublishOpen] = useState(false);`
5. `resolveWhen`: `(when, dayIdx) => { const date = resolveDate(when, dayIdx, new Date()); return { date, dateLabel: formatDateLabel(date) }; }` (`formatDateLabel` = gün+ay TR kısa; dayjs varsa onunla).
6. Hücre menüsü callback'leri:
   - `onOpenSubstituteModal(placementId, day, period)`: ilgili placement'tan ctx kur (`subName`, `origTeacher` lookup) → `setSubCtx(ctx)` + `setSubSlot({day,period})` (P28 fetch tetikle — mevcut `availQ` korunur, sonucu modala `available` olarak ver).
   - `onOpenCancelModal(placementId, day, period)`: ctx → `setCancelCtx(ctx)`.
7. Modal `onApply` → `tc.addSubstitute(change)` / `tc.addCancel(change)` + modal kapat.
8. `tempMarks` map: `tc.state` → `Map(key → { type, teacher, published })` (WeekGrid'e geçir). `permLocked`/`canTemp` aynen.
9. Grid üstüne (note/blockbar bloğunun hemen üstüne) `<TempChangesPanel temps={tc.state} onUndo={handleTempUndo} onPublish={() => setTempPublishOpen(true)} onGoCell={(k)=>gotoCellByPlacement(k)} />`.
10. `handleTempUndo(key)`: `tc.state[key].published` ise `await timetableApi.revokeException(id, exceptionId, reason)` sonra `tc.undoBatch([key])`; değilse `tc.remove(key)`.
11. `TempPublishModal` (tempPublishOpen iken): `drafts = Object.values(tc.state).filter(c=>!c.published)`; `onPublish` = sıralı P25 (`for (const c of drafts) { const r = await timetableApi.createException(id, toExceptionBody(c)); ids[c.key]=r.id; }` → `return ids`); `onPublished=(ids)=>tc.publishLocally(ids)`; `onUndoAll` = batch revoke + `tc.undoBatch(draftKeysJustPublished)`.
12. Editör açılışında P26 yükle: `useQuery` (`listExceptions(id, { from: weekStart, to: weekEnd })`) → `tc.loadFromServer(items, formatDateLabel)` (yalnız aktif olanlar; subjectName için lookups join). Tenant-scope key.
13. `data.refetch` gerekmez temp için (yerel state).

- [ ] **Step 1: Failing test** — mevcut `ScheduleEditorPage.test.tsx`'e senaryo ekle:

```tsx
it("opens substitute modal from cell menu and adds a tray row", async () => {
  // Arrange: Published program + 1 placement mock; render page.
  // Act: hücreye tıkla → menü → "Vekil Öğretmen Ata" → modalda öğretmen seç → Ata.
  // Assert: tepside "1 geçici değişiklik" görünür, hücrede VEKİL rozeti.
  // (Mevcut testteki mock kurulum desenini izle — useEditorData/useTempChanges gerçek; api mock.)
});
```

> Not: Mevcut test dosyasının mock kurulumunu (httpClient/react-query wrapper) izle; tam senaryo kodu mevcut testlerdeki helper'larla yazılır.

- [ ] **Step 2: Test kırmızı**

Run: `npm run test -- src/portals/admin/timetable/editor/__tests__/ScheduleEditorPage.test.tsx`
Expected: FAIL (yeni senaryo).

- [ ] **Step 3: ScheduleEditorPage entegrasyonunu yaz** (yukarıdaki 1-13).

- [ ] **Step 4: Test yeşil**

Run: `npm run test -- src/portals/admin/timetable/editor/__tests__/ScheduleEditorPage.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/portals/admin/timetable/ScheduleEditorPage.tsx src/portals/admin/timetable/editor/__tests__/ScheduleEditorPage.test.tsx
git commit -m "2026-06-14 feat,test: Editör entegrasyonu — geçici değişiklik store + modallar + tepsi + Geçici Yayınla + 3 katmanlı geri-al; P26 yükleme."
```

---

## Task 13: Tam paket + build + completion_status + sapma/Debt kaydı

**Files:**
- Modify: `.claude/docs/modules/timetable/completion_status.md` (workspace `oksis` reposu)
- Modify: `.claude/docs/modules/timetable/api-contracts.md` (P26/P27 FE tüketimi notu — gerekiyorsa)

- [ ] **Step 1: Tam test paketi**

Run: `npm run test`
Expected: tüm paket yeşil (yeni testler dahil; PublishDrawer testleri **değişmeden** geçer).

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: temiz (TS strict + vite).

- [ ] **Step 3: completion_status güncelle** (workspace `oksis` reposu)
- İlerleme bumpla (%93 → ~%95), Güncel: 2026-06-14.
- ✅'a Faz 2.5C özeti ekle (tepsi + 3 katmanlı geri-al; P25/P26/P27/P28 yeniden kullanım; PublishDrawer korundu).
- ⚠️ Spec Dışına Çıkılanlar'a: "2026-06-14 · Geçici değişiklik UX tepsi-merkezli (drawer yolu korundu, aktif yazma tepside). Onay: kullanıcı."
- ⏳/Debt'e ekle: **Debt-FE-yeni (telafi UI-only)**, **Debt-D2 (taslak yenilemede uçar)**; Debt-BE-3/Debt-FE-11 referansla.

- [ ] **Step 4: Commit (workspace repo)**

```bash
cd /Users/farukkaya/Projects/oksis
git add .claude/docs/modules/timetable/completion_status.md .claude/docs/modules/timetable/api-contracts.md
git commit -m "2026-06-14 docs: Ders Programı Faz 2.5C tamam — geçici tepsi + 3 katmanlı geri-al; sapma + Debt kaydı."
```

- [ ] **Step 5: oksis-web değişikliklerini son commit/PR durumunu doğrula**

Run: `cd /Users/farukkaya/Projects/oksis/oksis-web && git log --oneline -8`
Expected: Task 1-12 commit'leri sırada.

---

## Self-Review Notları (yazım sonrası)

- **Spec coverage:** Tasarım §1-§10 → Task eşlemesi: §2 backend reuse→T1; §3 model→T2/T3; §4 bileşenler→T5-T8; §5 3-katman undo→T8/T12; §6 coexistence→T10/T12 (useTempActions korunur); §7 i18n→T4; §8 test→her task + T13; §9 Debt/sapma→T13. ✅
- **Tip tutarlılığı:** `TempChange` alanları T2'de tanımlı, T5/T6/T7/T8/T11/T12'de aynı isimlerle kullanılıyor; `toExceptionBody` → `CreateExceptionInput` (types.ts mevcut). `ScheduleExceptionDto` T1'de eklenip T1/T12'de kullanılır. ✅
- **Placeholder taraması:** Component port task'larında (T5/T6/T8/T9) "port kaynağı" satır-aralıklı somut prototip + tam props + tam test + i18n anahtar listesi verildi; vague TODO yok. T12 entegrasyon test senaryosu mevcut test helper'larına referansla (kod tabanına özgü, executor mevcut deseni izler). ✅
- **Bilinen sınır:** Etki kutuları (öğrenci/öğretmen/veli sayısı) gerçek değil — Debt-BE-2 (preview veli sayısı 0) ile aynı; T8'de sade gösterim + Debt notu.
</content>
