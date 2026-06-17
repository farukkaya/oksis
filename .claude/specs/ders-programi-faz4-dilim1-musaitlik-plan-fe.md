# Öğretmen Müsaitlik & Tercih — Frontend Implementation Plan (Faz 4 / Dilim 1)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the admin Teacher Availability screen (`AvailabilityScreen`, 3-state Day×Period grid) and integrate availability into the existing autogen drawer, schedule editor, and Hub table in `oksis-web`.

**Architecture:** New screen lives under the existing `timetable` admin portal (breadcrumb "Akademik › Ders Programı › Öğretmen Müsaitliği"). A pure `AvailabilityGrid` component cycles each cell through Müsait→Tercih Etmez→Müsait Değil. Data flows through React Query (tenant-scoped keys) over the backend `/timetable/availability` endpoints. Existing autogen/editor/Hub components are **modified**, not rebuilt.

**Tech Stack:** React + Vite + TypeScript, shadcn/ui (Radix) + Tailwind, TanStack React Query, Zustand, RHF + Zod, axios, i18next, Vitest + Testing Library.

**Design doc:** `.claude/specs/ders-programi-faz4-dilim1-musaitlik-design.md`
**Backend plan (provides APIs):** `.claude/specs/ders-programi-faz4-dilim1-musaitlik-plan-be.md`
**Handoff:** `.claude/design-handoffs/schedule_avail/` — especially `source/schedule_avail.jsx` (`AvailabilityScreen`), screenshots `01-availability-main.png`..`04-hub-badge.png`.

## Global Constraints

- Working dir: `oksis-web/`. All paths relative to `oksis-web/`. Commands: `npm run dev`, `npm run build`, `npm run test`, `npx tsc --noEmit`.
- **3 statuses are fixed everywhere** (color + icon): `available`=0 (neutral/green, `check`), `prefersNot`=1 (amber, `minus`, soft), `unavailable`=2 (red, `ban`, hard). Numeric values match backend `AvailabilityStatus`.
- Server state lives only in React Query — never duplicate to Zustand. Every query key carries the tenant prefix via `tenantScopedKey` (`src/shared/config/tenant.ts`). `schoolId` from `useAuthStore((s) => s.user?.schoolId)`.
- No hardcoded Turkish — all copy via i18next keys in the `timetable` namespace.
- axios via `src/shared/api/httpClient.ts` (already configured: base `/api/v1`, bearer, refresh). API responses are `{ data: T }` envelopes — unwrap `res.data.data`.
- Lists use hand-rendered shadcn `<table className="stu-tbl">` (no grid library) — mirror `ClassProgramsTable.tsx`.
- Skeletons for loading (never spinner for full-page).
- shadcn components under `src/app/components/ui/` (AlertDialog, Dialog, Badge, Button, Tooltip, Input, Skeleton, Select all exist).
- Tests: `__tests__/<name>.test.tsx` next to component; wrap with `createTestWrapper()` from `src/test/utils.tsx`; `import "../../../../shared/i18n"` at top so `useTranslation` resolves.
- Backend endpoints (from BE plan Task 11): `GET /timetable/availability/teachers/{teacherId}?termId=`, `GET /timetable/availability?termId=`, `PUT /timetable/availability/teachers/{teacherId}` body `{ academicYearId, termId, slots: [{day,period,status}] }`.
- Commit format: `YYYY-MM-DD <type>[,type]: Türkçe özet.` date `2026-06-17`.

---

## File Structure

**New — availability screen (`src/portals/admin/timetable/availability/`)**
- `types.ts` — `AvailabilityStatusValue`, `AvailabilitySlotDto`, `TeacherAvailabilityDto`, `TermTeacherAvailabilityDto`, `SaveAvailabilityBody`, teacher-picker view-model.
- `api/availabilityApi.ts` — 3 endpoint calls.
- `hooks/useTeacherAvailability.ts` — single-teacher query + term-map query + save mutation.
- `components/AvailabilityGrid.tsx` — pure 3-state Day×Period grid (cycle on click).
- `components/TeacherPicker.tsx` — left search + branch chips + teacher list with "Tanımlı/—" badge.
- `TeacherAvailabilityPage.tsx` — PageHeader + picker + grid + save + status variants.
- `availability.css` — screen styles (mirror `timetable.css` tokens).
- `__tests__/AvailabilityGrid.test.tsx`, `__tests__/TeacherAvailabilityPage.test.tsx`.

**Modify**
- `src/app/routes.tsx` — add `schedule/availability` route.
- Query keys: extend `src/portals/admin/timetable/keys/timetableKeys.ts` with `availability` entries.
- i18n: `src/shared/i18n/locales/{tr,en}/timetable.json` — add `availability.*`, `autogen.weights.preference*`, `editor.availability.*`, `table.availability`.
- Autogen: `src/portals/admin/timetable/autogen/types.ts` (+`respectTeacherPreference`), `autogen/AutoGenDrawer.tsx` (WeightState + default + payload + new `WeightSeg`).
- Hub: `src/portals/admin/timetable/components/ClassProgramsTable.tsx` (+ column + `SchCount`), `src/portals/admin/timetable/types.ts` (row DTO + `availabilityViolationCount`).
- Editor: `src/portals/admin/timetable/editor/` — availability data load, `GridCell` visuals, override `AlertDialog`, `allowUnavailable` wiring, validation rows (Task 8 enumerates exact files).

---

## Task 1: i18n keys (timetable namespace)

**Files:**
- Modify: `src/shared/i18n/locales/tr/timetable.json`
- Modify: `src/shared/i18n/locales/en/timetable.json`

**Interfaces:**
- Produces keys consumed by all later tasks: `availability.*`, `autogen.weights.preferenceTitle/preferenceSub`, `editor.availability.*`, `table.availability`.

- [ ] **Step 1: Add the TR keys**

In `tr/timetable.json`, add under the root `timetable` object (alongside existing `table`, `editor`, `autogen`):
```json
"availability": {
  "title": "Öğretmen Müsaitliği & Tercihleri",
  "subtitle": "Öğretmenlerin uygun olmadığı ve tercih etmediği saatleri belirleyin; otomatik üretim ve editör bunları dikkate alır.",
  "breadcrumb": "Öğretmen Müsaitliği",
  "import": "Toplu İçe Aktar",
  "searchTeacher": "Öğretmen ara…",
  "defined": "Tanımlı",
  "undefined": "—",
  "status": { "available": "Müsait", "prefersNot": "Tercih Etmez", "unavailable": "Müsait Değil" },
  "statusHint": { "prefersNot": "yumuşak uyarı", "unavailable": "kesin engel" },
  "counts": { "unavailable": "{{count}} müsait değil", "prefersNot": "{{count}} tercih etmez" },
  "save": "Kaydet",
  "saved": "Kaydedildi",
  "saving": "Kaydediliyor…",
  "current": "Güncel",
  "dirty": "Kaydedilmemiş değişiklik",
  "bulk": { "allAvailable": "Tüm haftayı Müsait yap", "copyDay": "Başka güne kopyala", "copyTerm": "Önceki dönemden kopyala", "fillDay": "Günü tek durumla doldur" },
  "empty": { "noBell": "Bu dönem için ders saati (zil programı) tanımlı değil.", "selectTeacher": "Soldan bir öğretmen seçin." },
  "error": "Müsaitlik yüklenemedi.",
  "retry": "Yeniden dene"
},
```
Add the preference weight keys inside the existing `autogen.weights` object:
```json
"preferenceTitle": "Öğretmen tercihlerine uy",
"preferenceSub": "Öğretmenin tercih etmediği saatlerden kaçınır",
```
Add inside the existing `editor` object:
```json
"availability": {
  "unavailableTitle": "Öğretmen bu saatte müsait değil",
  "unavailableBody": "{{teacher}} · {{day}} {{period}}. ders. Yine de yerleştirmek istiyor musunuz?",
  "cancel": "Vazgeç",
  "confirm": "Yine de yerleştir",
  "overrideBadge": "Müsaitlik aşılarak yerleştirildi",
  "prefersNotHint": "Öğretmen bu saati tercih etmiyor",
  "violation": "Müsaitlik ihlali",
  "violationHard": "müsait değil (aşılarak yerleştirildi)",
  "violationSoft": "bu saati tercih etmiyor (yumuşak)",
  "legendPrefersNot": "Tercih edilmez",
  "summaryViolations": "{{count}} müsaitlik ihlali"
},
```
Add inside the existing `table` object:
```json
"availability": "Müsaitlik",
```

- [ ] **Step 2: Add the EN keys**

In `en/timetable.json`, add the same key structure with English values (e.g. `availability.title` = `"Teacher Availability & Preferences"`, `status.available/prefersNot/unavailable` = `"Available"/"Prefers not"/"Unavailable"`, `autogen.weights.preferenceTitle` = `"Respect teacher preferences"`, etc.). Keep identical key paths so parity holds.

- [ ] **Step 3: Verify parity + load**

Run: `npm run test -- i18n` if a parity test exists; else `npx tsc --noEmit` (JSON import compiles) and grep both files for `"availability"` to confirm both namespaces have it.
Expected: both files parse; identical key sets.

- [ ] **Step 4: Commit**

```bash
git add src/shared/i18n/locales/tr/timetable.json src/shared/i18n/locales/en/timetable.json
git commit -m "2026-06-17 feat: Müsaitlik & tercih i18n anahtarları (tr/en) eklendi."
```

---

## Task 2: Types + query keys + API layer

**Files:**
- Create: `src/portals/admin/timetable/availability/types.ts`
- Modify: `src/portals/admin/timetable/keys/timetableKeys.ts`
- Create: `src/portals/admin/timetable/availability/api/availabilityApi.ts`

**Interfaces:**
- Produces:
  - `type AvailabilityStatusValue = 0 | 1 | 2` (Available/PrefersNot/Unavailable).
  - `interface AvailabilitySlotDto { day: number; period: number; status: AvailabilityStatusValue }`
  - `interface TeacherAvailabilityDto { teacherId: string; termId: string; slots: AvailabilitySlotDto[] }`
  - `interface TermTeacherAvailabilityDto { termId: string; teachers: TeacherAvailabilityDto[] }`
  - `interface SaveAvailabilityBody { academicYearId: string; termId: string; slots: AvailabilitySlotDto[] }`
  - `timetableKeys.availabilityTeacher(schoolId, teacherId, termId)`, `timetableKeys.availabilityTerm(schoolId, termId)`
  - `availabilityApi.getTeacher(teacherId, termId, signal)`, `availabilityApi.getTerm(termId, signal)`, `availabilityApi.save(teacherId, body)`

- [ ] **Step 1: Write the types**

`availability/types.ts`:
```typescript
// Öğretmen müsaitlik/tercih — backend DTO yansımaları. Status: 0=Müsait, 1=Tercih Etmez, 2=Müsait Değil.
export type AvailabilityStatusValue = 0 | 1 | 2;

export const AVAILABILITY_STATUS = {
  available: 0,
  prefersNot: 1,
  unavailable: 2,
} as const;

export interface AvailabilitySlotDto {
  day: number; // DayOfWeek (0=Pazar..6=Cumartesi)
  period: number; // 1..N
  status: AvailabilityStatusValue;
}

export interface TeacherAvailabilityDto {
  teacherId: string;
  termId: string;
  slots: AvailabilitySlotDto[];
}

export interface TermTeacherAvailabilityDto {
  termId: string;
  teachers: TeacherAvailabilityDto[];
}

export interface SaveAvailabilityBody {
  academicYearId: string;
  termId: string;
  slots: AvailabilitySlotDto[];
}

/** Sol panel öğretmen satırı view-model. */
export interface TeacherPickItem {
  id: string;
  name: string;
  branch: string;
  hasAvailability: boolean;
}
```

- [ ] **Step 2: Extend the query keys**

In `keys/timetableKeys.ts`, add inside the `timetableKeys` object:
```typescript
availabilityTeacher: (schoolId: string | null | undefined, teacherId: string, termId: string) =>
  tenantScopedKey(schoolId, ["timetable", "availability", "teacher", teacherId, termId] as const),
availabilityTerm: (schoolId: string | null | undefined, termId: string) =>
  tenantScopedKey(schoolId, ["timetable", "availability", "term", termId] as const),
```

- [ ] **Step 3: Write the API layer**

`availability/api/availabilityApi.ts`:
```typescript
import { httpClient } from "../../../../../shared/api/httpClient";
import type { SaveAvailabilityBody, TeacherAvailabilityDto, TermTeacherAvailabilityDto } from "../types";

interface ApiEnvelope<T> { data: T; }

export const availabilityApi = {
  getTeacher: async (teacherId: string, termId: string, signal?: AbortSignal) => {
    const res = await httpClient.get<ApiEnvelope<TeacherAvailabilityDto>>(
      `/timetable/availability/teachers/${teacherId}?termId=${termId}`,
      { signal },
    );
    return res.data.data;
  },
  getTerm: async (termId: string, signal?: AbortSignal) => {
    const res = await httpClient.get<ApiEnvelope<TermTeacherAvailabilityDto>>(
      `/timetable/availability?termId=${termId}`,
      { signal },
    );
    return res.data.data;
  },
  save: async (teacherId: string, body: SaveAvailabilityBody) => {
    await httpClient.put(`/timetable/availability/teachers/${teacherId}`, body);
  },
};
```
> Verify the relative depth of the `httpClient` import (`../../../../../shared/...`) by matching an existing file at the same nesting (`autogen/` is one level shallower — adjust the `../` count so it resolves to `src/shared/api/httpClient.ts`).

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/portals/admin/timetable/availability/types.ts \
        src/portals/admin/timetable/availability/api/availabilityApi.ts \
        src/portals/admin/timetable/keys/timetableKeys.ts
git commit -m "2026-06-17 feat: Müsaitlik tipleri, query key'leri ve API katmanı eklendi."
```

---

## Task 3: React Query hooks

**Files:**
- Create: `src/portals/admin/timetable/availability/hooks/useTeacherAvailability.ts`
- Test: `src/portals/admin/timetable/availability/__tests__/useTeacherAvailability.test.tsx`

**Interfaces:**
- Consumes: `availabilityApi`, `timetableKeys`, `useAuthStore`.
- Produces: `useTeacherAvailability(teacherId, termId)` (query), `useTermAvailability(termId)` (query), `useSaveAvailability()` (mutation; invalidates both keys on success).

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createTestWrapper } from "../../../../../test/utils";
import { useTeacherAvailability } from "../hooks/useTeacherAvailability";
import { availabilityApi } from "../api/availabilityApi";

vi.mock("../api/availabilityApi");

describe("useTeacherAvailability", () => {
  it("fetches a teacher's slots", async () => {
    vi.mocked(availabilityApi.getTeacher).mockResolvedValue({
      teacherId: "t1", termId: "term1",
      slots: [{ day: 1, period: 1, status: 2 }],
    });

    const { result } = renderHook(() => useTeacherAvailability("t1", "term1"), {
      wrapper: createTestWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.slots).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- useTeacherAvailability`
Expected: FAIL — hook not defined.

- [ ] **Step 3: Implement the hooks**

`availability/hooks/useTeacherAvailability.ts`:
```typescript
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../../../../shared/store/authStore";
import { timetableKeys } from "../../keys/timetableKeys";
import { availabilityApi } from "../api/availabilityApi";
import type { SaveAvailabilityBody } from "../types";

export function useTeacherAvailability(teacherId: string | null, termId: string | null) {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  return useQuery({
    queryKey: timetableKeys.availabilityTeacher(schoolId, teacherId ?? "", termId ?? ""),
    queryFn: ({ signal }) => availabilityApi.getTeacher(teacherId!, termId!, signal),
    enabled: !!teacherId && !!termId,
  });
}

export function useTermAvailability(termId: string | null) {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  return useQuery({
    queryKey: timetableKeys.availabilityTerm(schoolId, termId ?? ""),
    queryFn: ({ signal }) => availabilityApi.getTerm(termId!, signal),
    enabled: !!termId,
  });
}

export function useSaveAvailability(teacherId: string, termId: string) {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: SaveAvailabilityBody) => availabilityApi.save(teacherId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: timetableKeys.availabilityTeacher(schoolId, teacherId, termId) });
      void queryClient.invalidateQueries({ queryKey: timetableKeys.availabilityTerm(schoolId, termId) });
    },
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- useTeacherAvailability`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/portals/admin/timetable/availability/hooks/useTeacherAvailability.ts \
        src/portals/admin/timetable/availability/__tests__/useTeacherAvailability.test.tsx
git commit -m "2026-06-17 feat: Müsaitlik React Query hook'ları (query + save) eklendi."
```

---

## Task 4: AvailabilityGrid component (3-state cycle)

**Files:**
- Create: `src/portals/admin/timetable/availability/components/AvailabilityGrid.tsx`
- Create: `src/portals/admin/timetable/availability/availability.css`
- Test: `src/portals/admin/timetable/availability/__tests__/AvailabilityGrid.test.tsx`

**Interfaces:**
- Consumes: `AvailabilityStatusValue`.
- Produces: `AvailabilityGrid({ days, periods, value, onCycle })` where `value: Map<string, AvailabilityStatusValue>` keyed `"${day}-${period}"`, `onCycle(day, period)` advances Available→PrefersNot→Unavailable→Available. Exposes helper `slotKey(day, period)`.

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "../../../../../shared/i18n";
import { AvailabilityGrid, slotKey } from "../components/AvailabilityGrid";

describe("AvailabilityGrid", () => {
  it("cycles a cell available→prefersNot on click", () => {
    const onCycle = vi.fn();
    render(
      <AvailabilityGrid
        days={[1, 2]}
        periods={[1, 2]}
        value={new Map()}
        onCycle={onCycle}
      />,
    );
    // first cell (day 1, period 1)
    fireEvent.click(screen.getByTestId(`av-cell-${slotKey(1, 1)}`));
    expect(onCycle).toHaveBeenCalledWith(1, 1);
  });

  it("renders unavailable cell with the unavailable class", () => {
    render(
      <AvailabilityGrid
        days={[1]}
        periods={[1]}
        value={new Map([[slotKey(1, 1), 2]])}
        onCycle={() => {}}
      />,
    );
    expect(screen.getByTestId(`av-cell-${slotKey(1, 1)}`).className).toContain("unavail");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- AvailabilityGrid`
Expected: FAIL — component not defined.

- [ ] **Step 3: Implement the component**

`availability/components/AvailabilityGrid.tsx`:
```typescript
import { useTranslation } from "react-i18next";
import { Ban, Check, Minus } from "lucide-react";
import { cn } from "../../../../../lib/utils";
import type { AvailabilityStatusValue } from "../types";
import "./availability.css";

export const slotKey = (day: number, period: number) => `${day}-${period}`;

const TONE: Record<AvailabilityStatusValue, string> = { 0: "available", 1: "prefer", 2: "unavail" };

interface Props {
  days: number[];
  periods: number[];
  value: Map<string, AvailabilityStatusValue>;
  onCycle: (day: number, period: number) => void;
}

export function AvailabilityGrid({ days, periods, value, onCycle }: Props) {
  const { t } = useTranslation("timetable");
  return (
    <div className="av-grid" style={{ gridTemplateColumns: `48px repeat(${days.length}, 1fr)` }}>
      <div className="av-gh time" />
      {days.map((d) => (
        <div key={`h${d}`} className="av-gh day">{t(`editor.weekdaysShort.${d}`)}</div>
      ))}
      {periods.map((p) => (
        <div className="av-row" key={`r${p}`} style={{ display: "contents" }}>
          <div className="av-time">{p}</div>
          {days.map((d) => {
            const status = value.get(slotKey(d, p)) ?? 0;
            const tone = TONE[status];
            const icon = status === 2 ? <Ban size={12} /> : status === 1 ? <Minus size={12} strokeWidth={3.4} /> : <Check size={12} />;
            return (
              <button
                type="button"
                key={slotKey(d, p)}
                data-testid={`av-cell-${slotKey(d, p)}`}
                className={cn("av-cell", tone)}
                title={t(`availability.status.${status === 2 ? "unavailable" : status === 1 ? "prefersNot" : "available"}`)}
                onClick={() => onCycle(d, p)}
              >
                {icon}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
```

`availability/availability.css` (mirror token palette from `timetable.css`):
```css
.av-grid { display: grid; gap: 4px; }
.av-gh { font-size: 12px; font-weight: 600; color: var(--text-muted, #6B7280); text-align: center; padding: 6px 0; }
.av-time { font-size: 12px; color: var(--text-faint, #9AA3B2); display: flex; align-items: center; justify-content: center; }
.av-cell { display: flex; align-items: center; justify-content: center; height: 34px; border: 1px solid var(--line, #E6E9F2); border-radius: var(--r-sm, 8px); background: #fff; cursor: pointer; }
.av-cell.available { color: #0E7A5A; }
.av-cell.prefer { background: #FEF3C7; border-color: #FCE3A0; color: #B05A0A; }
.av-cell.unavail { background: #FEE2E2; border-color: #F6C6C6; color: #991B1B; }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- AvailabilityGrid`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/portals/admin/timetable/availability/components/AvailabilityGrid.tsx \
        src/portals/admin/timetable/availability/availability.css \
        src/portals/admin/timetable/availability/__tests__/AvailabilityGrid.test.tsx
git commit -m "2026-06-17 feat: 3-durumlu AvailabilityGrid bileşeni (cycle) eklendi."
```

---

## Task 5: TeacherAvailabilityPage + TeacherPicker + route

**Files:**
- Create: `src/portals/admin/timetable/availability/components/TeacherPicker.tsx`
- Create: `src/portals/admin/timetable/availability/TeacherAvailabilityPage.tsx`
- Modify: `src/app/routes.tsx`
- Test: `src/portals/admin/timetable/availability/__tests__/TeacherAvailabilityPage.test.tsx`

**Interfaces:**
- Consumes: `useTermAvailability`, `useTeacherAvailability`, `useSaveAvailability`, `AvailabilityGrid` + `slotKey`, `PageHeader`, teacher list source + bell-schedule period source.
- Produces: route `/admin/schedule/availability` → `TeacherAvailabilityPage`. Page holds buffered (dirty) grid state, Save via mutation, status variants.

- [ ] **Step 1: Implement TeacherPicker**

`availability/components/TeacherPicker.tsx`:
```typescript
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "../../../../../lib/utils";
import type { TeacherPickItem } from "../types";

interface Props {
  teachers: TeacherPickItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function TeacherPicker({ teachers, selectedId, onSelect }: Props) {
  const { t } = useTranslation("timetable");
  const [q, setQ] = useState("");
  const filtered = teachers.filter((x) => x.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="av-picker">
      <input className="av-search" placeholder={t("availability.searchTeacher")} value={q} onChange={(e) => setQ(e.target.value)} />
      <ul className="av-tlist">
        {filtered.map((tc) => (
          <li key={tc.id}>
            <button type="button" className={cn("av-titem", selectedId === tc.id && "on")} onClick={() => onSelect(tc.id)}>
              <span className="nm">{tc.name}</span>
              <span className="br">{tc.branch}</span>
              <span className={cn("av-defb", tc.hasAvailability ? "on" : "off")}>
                {tc.hasAvailability ? t("availability.defined") : t("availability.undefined")}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 2: Write the failing page test**

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "../../../../../shared/i18n";
import { createTestWrapper } from "../../../../../test/utils";
import { TeacherAvailabilityPage } from "../TeacherAvailabilityPage";

describe("TeacherAvailabilityPage", () => {
  it("renders the page title", () => {
    render(<TeacherAvailabilityPage />, { wrapper: createTestWrapper() });
    expect(screen.getByText("Öğretmen Müsaitliği & Tercihleri")).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test -- TeacherAvailabilityPage`
Expected: FAIL — page not defined.

- [ ] **Step 4: Implement the page**

`availability/TeacherAvailabilityPage.tsx`:
```typescript
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "../../../../shared/components/PageHeader/PageHeader";
import { AvailabilityGrid, slotKey } from "./components/AvailabilityGrid";
import { TeacherPicker } from "./components/TeacherPicker";
import { useSaveAvailability, useTeacherAvailability, useTermAvailability } from "./hooks/useTeacherAvailability";
import type { AvailabilityStatusValue, TeacherPickItem } from "./types";
// Source the active term + academicYearId + teacher list + bell-schedule periods from the
// same hooks the editor/autogen use (e.g. useAutoGenLookups / a season selector). See Step 5 note.

export function TeacherAvailabilityPage() {
  const { t } = useTranslation("timetable");

  // --- context: term, academic year, teacher list, grid shape ---
  const { termId, academicYearId, teachers, days, periods } = useAvailabilityContext(); // helper below
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const termQuery = useTermAvailability(termId);
  const detailQuery = useTeacherAvailability(selectedId, termId);
  const save = useSaveAvailability(selectedId ?? "", termId ?? "");

  const [draft, setDraft] = useState<Map<string, AvailabilityStatusValue>>(new Map());
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const map = new Map<string, AvailabilityStatusValue>();
    detailQuery.data?.slots.forEach((s) => map.set(slotKey(s.day, s.period), s.status as AvailabilityStatusValue));
    setDraft(map);
    setDirty(false);
  }, [detailQuery.data]);

  const cycle = (day: number, period: number) => {
    setDraft((prev) => {
      const next = new Map(prev);
      const cur = next.get(slotKey(day, period)) ?? 0;
      const adv = ((cur + 1) % 3) as AvailabilityStatusValue;
      if (adv === 0) next.delete(slotKey(day, period));
      else next.set(slotKey(day, period), adv);
      return next;
    });
    setDirty(true);
  };

  const counts = useMemo(() => {
    let u = 0, p = 0;
    draft.forEach((v) => (v === 2 ? u++ : v === 1 ? p++ : null));
    return { u, p };
  }, [draft]);

  const onSave = () => {
    if (!selectedId || !termId || !academicYearId) return;
    const slots = [...draft.entries()].map(([k, status]) => {
      const [day, period] = k.split("-").map(Number);
      return { day, period, status };
    });
    save.mutate({ academicYearId, termId, slots }, { onSuccess: () => setDirty(false) });
  };

  const teacherItems: TeacherPickItem[] = teachers.map((tc) => ({
    ...tc,
    hasAvailability: termQuery.data?.teachers.some((x) => x.teacherId === tc.id && x.slots.length > 0) ?? false,
  }));

  return (
    <div className="av-page">
      <PageHeader
        title={t("availability.title")}
        breadcrumb={[{ label: t("title") }, { label: t("availability.breadcrumb") }]}
        subtitle={t("availability.subtitle")}
      />
      <div className="av-body">
        <TeacherPicker teachers={teacherItems} selectedId={selectedId} onSelect={setSelectedId} />
        <section className="av-main">
          {!selectedId ? (
            <div className="av-empty">{t("availability.empty.selectTeacher")}</div>
          ) : detailQuery.isLoading ? (
            <div className="av-skel" />
          ) : detailQuery.isError ? (
            <div className="av-empty">{t("availability.error")}</div>
          ) : periods.length === 0 ? (
            <div className="av-empty">{t("availability.empty.noBell")}</div>
          ) : (
            <>
              <div className="av-headbar">
                <span className="av-counts">
                  {t("availability.counts.unavailable", { count: counts.u })} · {t("availability.counts.prefersNot", { count: counts.p })}
                </span>
                <span className="av-savestate">
                  {save.isPending ? t("availability.saving") : dirty ? t("availability.dirty") : t("availability.current")}
                </span>
                <button type="button" className="av-savebtn" disabled={!dirty || save.isPending} onClick={onSave}>
                  {t("availability.save")}
                </button>
              </div>
              <AvailabilityGrid days={days} periods={periods} value={draft} onCycle={cycle} />
            </>
          )}
        </section>
      </div>
    </div>
  );
}
```
> `useAvailabilityContext()` is a thin helper this task adds at the bottom of the page file: it returns `{ termId, academicYearId, teachers, days, periods }`. Source `termId`/`academicYearId` from the active-season store the rest of the timetable portal uses (check `ScheduleHubPage.tsx` for how it reads the active term). Source `teachers` from the existing teachers lookup (the autogen drawer's `useAutoGenLookups` exposes teachers; reuse it). Source `days`/`periods` from the bell-schedule the editor grid uses (`editorDerive`/lookups) — **read `ScheduleHubPage.tsx` + `useAutoGenLookups.ts` first** and wire these to the real sources; do not hardcode. If a clean lookup isn't exposed, add a small `useAvailabilityLookups(termId)` hook mirroring `useAutoGenLookups`.

- [ ] **Step 5: Add the route**

In `src/app/routes.tsx`, alongside the existing `{ path: "schedule", ... }`, add:
```typescript
{ path: "schedule/availability", Component: TeacherAvailabilityPage },
```
Import it at top with the other lazy/portal imports, matching the file's existing import style.

- [ ] **Step 6: Run test + typecheck**

Run: `npm run test -- TeacherAvailabilityPage` → PASS.
Run: `npx tsc --noEmit` → no errors.

- [ ] **Step 7: Commit**

```bash
git add src/portals/admin/timetable/availability/TeacherAvailabilityPage.tsx \
        src/portals/admin/timetable/availability/components/TeacherPicker.tsx \
        src/app/routes.tsx \
        src/portals/admin/timetable/availability/__tests__/TeacherAvailabilityPage.test.tsx
git commit -m "2026-06-17 feat: Öğretmen Müsaitliği ekranı (picker + ızgara + kayıt) ve rota eklendi."
```

---

## Task 6: AutoGen weight row "Öğretmen tercihlerine uy"

**Files:**
- Modify: `src/portals/admin/timetable/autogen/types.ts`
- Modify: `src/portals/admin/timetable/autogen/AutoGenDrawer.tsx`
- Test: `src/portals/admin/timetable/autogen/__tests__/AutoGenWeights.test.tsx` (or extend existing autogen test)

**Interfaces:**
- Consumes: existing `AutoGenWeights`, `WeightState`, `WeightSeg`.
- Produces: `respectTeacherPreference: AutoGenWeightLevel` flows from UI → `EnqueueAutoGenerateBody.weights`.

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "../../../../../shared/i18n";
import { createTestWrapper } from "../../../../../test/utils";
import { AutoGenDrawer } from "../AutoGenDrawer";

describe("AutoGenDrawer weights", () => {
  it("renders the teacher-preference weight row", () => {
    render(<AutoGenDrawer open onClose={() => {}} /* + required props */ />, { wrapper: createTestWrapper() });
    expect(screen.getByText("Öğretmen tercihlerine uy")).toBeInTheDocument();
  });
});
```
> Fill `AutoGenDrawer`'s required props from its current prop interface (read the component header). If the drawer needs heavy context, instead unit-test the `WeightSeg` row addition by rendering the settings section, or assert via the existing autogen test file.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- AutoGenWeights`
Expected: FAIL — row text absent.

- [ ] **Step 3: Add to the type**

In `autogen/types.ts`, add to `AutoGenWeights` (after `dailyBalance`):
```typescript
  /** Öğretmenin tercih etmediği saatlerden kaçınma ağırlığı. */
  respectTeacherPreference: AutoGenWeightLevel;
```

- [ ] **Step 4: Wire the drawer**

In `AutoGenDrawer.tsx`:
- Add to `WeightState` (after `dailyBalance`): `respectTeacherPreference: AutoGenWeightLevel;`
- Add to the `useState<WeightState>({...})` default (line ~82): `respectTeacherPreference: "Mid",`
- Add to the `payload: AutoGenWeights = {...}` (line ~156): `respectTeacherPreference: weights.respectTeacherPreference,`
- Add a new `<WeightSeg>` right after the `minimizeGaps` one (gaps row, ~line 521), before `dailyBalance`:
```tsx
<WeightSeg
  icon={<UserCheck size={17} />}
  title={t("autogen.weights.preferenceTitle")}
  sub={t("autogen.weights.preferenceSub")}
  value={weights.respectTeacherPreference}
  onChange={(v) => onWeight("respectTeacherPreference", v)}
/>
```
Import `UserCheck` from `lucide-react` in the existing icon import line.

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- AutoGenWeights` → PASS.
Run: `npx tsc --noEmit` → no errors (the `respectTeacherPreference` is now required on `AutoGenWeights`; confirm no other `AutoGenWeights` literal is missing it — grep `morningHardSubjects:` to find them).

- [ ] **Step 6: Commit**

```bash
git add src/portals/admin/timetable/autogen/types.ts \
        src/portals/admin/timetable/autogen/AutoGenDrawer.tsx \
        src/portals/admin/timetable/autogen/__tests__/AutoGenWeights.test.tsx
git commit -m "2026-06-17 feat: Otomatik üretim — 'Öğretmen tercihlerine uy' ağırlık satırı eklendi."
```

---

## Task 7: Hub SchAvail badge column

**Files:**
- Modify: `src/portals/admin/timetable/types.ts` (Hub row DTO)
- Modify: `src/portals/admin/timetable/components/ClassProgramsTable.tsx`
- Test: extend `src/portals/admin/timetable/__tests__/ClassProgramsTable.test.tsx` (create if absent)

**Interfaces:**
- Consumes: existing `SchCount` (renders `<span className="sch-count ${tone}">value`), Hub row type.
- Produces: row DTO gains `availabilityViolationCount: number`; table gains a "Müsaitlik" column with amber/zero `SchCount`.

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "../../../../shared/i18n";
import { ClassProgramsTable } from "../components/ClassProgramsTable";

const row = {
  id: "9A", className: "9-A", gradeLevel: 9, status: "pub",
  conflictCount: 0, missingHours: 0, availabilityViolationCount: 3,
  placementCount: 28, lastUpdatedAt: new Date().toISOString(), version: 4,
} as const;

describe("ClassProgramsTable availability", () => {
  it("renders the availability violation count", () => {
    render(<ClassProgramsTable rows={[row] as never} onOpen={() => {}} onPublish={() => {}} />);
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("Müsaitlik")).toBeInTheDocument();
  });
});
```
> Match `ClassProgramsTable`'s real required props (read its prop interface; supply minimal stubs).

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- ClassProgramsTable`
Expected: FAIL — column/field absent.

- [ ] **Step 3: Extend the row DTO**

In `src/portals/admin/timetable/types.ts`, add to the Hub class-program list item interface (the one with `conflictCount`/`missingHours`):
```typescript
  availabilityViolationCount: number;
```
Ensure the mapping from the API response (where `ClassProgramListItemDto` is built) carries `availabilityViolationCount` (the backend Hub list now returns it — add to the DTO type + any mapper). Grep `conflictCount` in `types.ts`/`api/timetableApi.ts` and mirror for `availabilityViolationCount`.

- [ ] **Step 4: Add the column**

In `ClassProgramsTable.tsx`:
- Header: after the `missing` `<th>` (line 27):
```tsx
<th>{t("table.availability")}</th>
```
- Cell: after the missing `<td>` (line 58-64):
```tsx
<td>
  <SchCount
    tone={r.availabilityViolationCount > 0 ? "warn" : "zero"}
    value={r.availabilityViolationCount}
  />
</td>
```
(`SchCount` already supports the `warn` tone — same as missing-hours amber.)

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- ClassProgramsTable` → PASS.

- [ ] **Step 6: Commit**

```bash
git add src/portals/admin/timetable/types.ts \
        src/portals/admin/timetable/components/ClassProgramsTable.tsx \
        src/portals/admin/timetable/__tests__/ClassProgramsTable.test.tsx
git commit -m "2026-06-17 feat: Hub — Müsaitlik ihlali sütunu (SchAvail rozeti) eklendi."
```

---

## Task 8: Editor integration — availability visuals + override

**Files (read each before editing — these are existing editor internals):**
- `src/portals/admin/timetable/editor/hooks/useEditorData.ts` (add availability fetch)
- `src/portals/admin/timetable/editor/lib/editorDerive.ts` (derive per-cell availability tone)
- `src/portals/admin/timetable/editor/components/GridCell.tsx` (red/yellow cell + override badge)
- `src/portals/admin/timetable/editor/components/WeekGrid.tsx` (pass availability sets down — mirrors existing `conflictIds: Set<string>`)
- `src/portals/admin/timetable/editor/hooks/useEditorDraft.ts` (`allowUnavailable` on Place/Move/AssignTeacher mutations)
- `src/portals/admin/timetable/ScheduleEditorPage.tsx` (override `AlertDialog` + validation rows)
- Test: `src/portals/admin/timetable/editor/__tests__/availabilityIntegration.test.tsx`

**Interfaces:**
- Consumes: `useTermAvailability(termId)` (Task 3), `slotKey` (Task 4), `GridCell` props, the existing `conflictIds: Set<string>` mechanism, the editor draft mutations.
- Produces: editor shows `unavailable` (red) + `prefersNot` (yellow) cell tones per the selected/placed teacher; dropping onto an `unavailable` slot opens an override `AlertDialog`; confirming calls the placement mutation with `allowUnavailable: true`; override cells get an `av-badge`; the Doğrula panel lists "Müsaitlik ihlali" rows.

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "../../../../../shared/i18n";
import { GridCell } from "../components/GridCell";

describe("GridCell availability", () => {
  it("applies prefers-not tone when slot is disliked", () => {
    render(
      <table><tbody><tr>
        <GridCell day={1} period={1} availabilityTone="prefer" /* + minimal required props */ />
      </tr></tbody></table>,
    );
    // the rendered cell should carry the prefer class
    expect(document.querySelector(".avail-prefer")).not.toBeNull();
  });
});
```
> Fill `GridCell`'s required props from its current interface. The new prop is `availabilityTone?: "prefer" | "unavail"`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- availabilityIntegration`
Expected: FAIL — `availabilityTone` not handled.

- [ ] **Step 3: Fetch availability in the editor**

In `useEditorData.ts`, call `useTermAvailability(termId)` and expose a derived `Map<teacherId, Map<slotKey, status>>`. Build it once from the term response: for each teacher, map `slotKey(day,period) → status`.

- [ ] **Step 4: Derive per-cell tone**

In `editorDerive.ts`, when building each `GridCell`'s view-model, look up the cell's teacher (placement teacher, or — for an empty target during drag — the dragged chip's teacher) in the availability map. Set `availabilityTone`: `2`→`"unavail"`, `1`→`"prefer"`, else undefined. Also expose, for the drag drop-state, whether the target slot is `unavailable` (→ blocked unless override) or `prefersNot` (→ `drop-warn`, allowed).

- [ ] **Step 5: Render the tone + badge in GridCell**

In `GridCell.tsx`, add `availabilityTone?: "prefer" | "unavail"` and `overridden?: boolean` props. Apply class `avail-prefer` (yellow) / `avail-unavail` (red) and, when `overridden`, render the badge:
```tsx
{overridden && (
  <span className="av-badge" title={t("editor.availability.overrideBadge")}>
    <AlertTriangle size={10} strokeWidth={2.8} />
  </span>
)}
```
Add the matching CSS (`.avail-prefer`, `.av-badge`) to the editor stylesheet, reusing the amber/red tokens from Task 4's `availability.css`.
Extend the drag `dropState` handling: when target is `prefersNot` use a `drop-warn` (yellow) class in addition to the existing `ok`/`bad`.

- [ ] **Step 6: Override AlertDialog + mutation flag**

In `useEditorDraft.ts`, add an optional `allowUnavailable?: boolean` to the Place/Move/AssignTeacher mutation inputs and include it in the request body (the backend command now accepts it — BE plan Task 10).
In `ScheduleEditorPage.tsx`, when a drop targets an `unavailable` slot, instead of placing immediately, open an `AlertDialog`:
```tsx
<AlertDialog open={!!pendingOverride} onOpenChange={(o) => !o && setPendingOverride(null)}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>{t("editor.availability.unavailableTitle")}</AlertDialogTitle>
      <AlertDialogDescription>
        {t("editor.availability.unavailableBody", { teacher: pendingOverride?.teacher, day: pendingOverride?.day, period: pendingOverride?.period })}
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>{t("editor.availability.cancel")}</AlertDialogCancel>
      <AlertDialogAction onClick={confirmOverride}>{t("editor.availability.confirm")}</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```
`confirmOverride` calls the placement mutation with `allowUnavailable: true`. If the server responds 403 (no `timetable.override`), surface the existing error toast.

- [ ] **Step 7: Validation panel rows + legend**

In the Doğrula panel (the issues list in `ScheduleEditorPage.tsx`), add "Müsaitlik ihlali" rows derived from placements whose slot is `unavailable` (hard, red — overridden) or `prefersNot` (soft, yellow) for their teacher, each with a "Hücreye git" action (reuse the existing go-to-cell handler). Add the amber summary pill `t("editor.availability.summaryViolations", { count })` and the legend item `t("editor.availability.legendPrefersNot")`.

- [ ] **Step 8: Run test + typecheck + full editor tests**

Run: `npm run test -- availabilityIntegration` → PASS.
Run: `npm run test -- editor` → existing editor tests still green.
Run: `npx tsc --noEmit` → no errors.

- [ ] **Step 9: Commit**

```bash
git add src/portals/admin/timetable/editor/ src/portals/admin/timetable/ScheduleEditorPage.tsx
git commit -m "2026-06-17 feat: Editör — müsaitlik renkleri, override onayı ve doğrulama satırları eklendi."
```

---

## Task 9: Full suite + typecheck + docs

**Files:**
- Modify: `.claude/docs/modules/timetable/completion_status.md`, `ui-flows.md`

- [ ] **Step 1: Run everything**

Run: `npm run build && npm run test && npx tsc --noEmit`
Expected: build OK, all tests green, no type errors. Fix any `AutoGenWeights` literals missing `respectTeacherPreference` and any Hub mapper missing `availabilityViolationCount`.

- [ ] **Step 2: Update module docs**

- `completion_status.md`: mark D1 frontend items ✅; bump `Güncel` date 2026-06-17.
- `ui-flows.md`: add the Öğretmen Müsaitliği screen flow + editor override flow.

- [ ] **Step 3: Commit**

```bash
git add .claude/docs/modules/timetable/
git commit -m "2026-06-17 docs: Müsaitlik & tercih (Faz 4/Dilim 1) frontend — modül dokümanları güncellendi."
```

---

## Self-Review

**Spec coverage** (design doc):
- §6 admin screen `schedule_avail` → Tasks 2,3,4,5 ✓ (3-state grid, picker, status variants, save, route)
- §4.3 autogen weight row → Task 6 ✓
- §5 editor visuals + override + validation → Task 8 ✓ (consumes BE Task 10's `allowUnavailable`)
- §7 Hub badge → Task 7 ✓
- §9 i18n tr/en → Task 1 ✓ (+ per-task keys)
- Tests → every task TDD ✓.

**Placeholder scan:** New files (Tasks 2-7) carry complete code. Three explicit "read the named existing file first" lookups remain — all in Task 8 (editor internals: `GridCell` props, `useEditorDraft` mutation inputs, the Doğrula panel location) and Task 5's `useAvailabilityContext` (term/teacher/period sources). These are real, named-file integrations with a stated mirror pattern (`conflictIds` Set; `useAutoGenLookups`), not vague TODOs — acceptable per "follow established patterns." Flagged here so the executor allocates a read step.

**Type consistency:** `AvailabilityStatusValue` 0/1/2 and `slotKey(day,period)` are identical across Grid (Task 4), Page (Task 5), and editor (Task 8). `respectTeacherPreference: AutoGenWeightLevel` consistent in `types.ts` and `AutoGenDrawer.tsx` (Task 6). `availabilityViolationCount` consistent in Hub DTO + table (Task 7). API routes match the backend plan (`/timetable/availability/...`).

**Dependency note:** Tasks 7 (Hub badge data) and 8 (editor override) depend on backend endpoints/fields shipping first — Hub badge needs `availabilityViolationCount` on the list DTO (BE Task 9 + the Hub list query), editor override needs `allowUnavailable` accepted (BE Task 10). Sequence backend before these two FE tasks; Tasks 1-6 (screen + autogen UI) can proceed against the GET/PUT availability endpoints (BE Task 11) independently.

---

## Execution Handoff

Frontend plan complete. Combined with the backend plan, D1 is fully specified. Recommended overall order: **BE Tasks 1-11 → FE Tasks 1-6 → FE Tasks 7-8 → both Task 12/9 docs.**
