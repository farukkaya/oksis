# Editör "Öğretmen Görünümü" (Faz 5 / Dilim-0) — FE Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admin editöründe (`ScheduleEditorPage`) "Öğretmen görünümü" toggle'ını etkinleştir; açık olan tek programı seçilen öğretmen gözünden salt-okunur önizle.

**Architecture:** Tamamen FE (`oksis-web`). Saf `deriveTeacherView`/`distinctTeachers` + salt-okunur `TeacherPreviewGrid` + seçici/rozet sarmalı `TeacherViewPanel` + `EditorToolbar` toggle + `ScheduleEditorPage` glue. Veri zaten client'ta: `draft.placements` (tampon), `data.lookups`, `occQ.data` (externalOccupancy). Yeni BE yok.

**Tech Stack:** React + TypeScript, Vitest + @testing-library/react, react-i18next, lucide-react. Tasarım sistemi mevcut `editor.css` sınıfları.

## Global Constraints

- **FE-only:** Yeni BE endpoint / izin / migration **yok** (spec `ders-programi-faz5-dilim0-ogretmen-gorunumu-design.md` D2).
- **Salt-okunur:** Öğretmen görünümünde sürükle-bırak / hücre menüsü / precheck / blok-modu **yok** (D6).
- **Tampon yansıması:** Grid `draft.placements` (foldOps çıktısı) kullanır — kaydedilmemiş değişiklikler önizlemede görünür (D7).
- **i18n:** Hardcoded Türkçe yasak — tüm string'ler `timetable` namespace'inde `tr` + `en` (CLAUDE.md hard-ban).
- **Gün konvansiyonu:** `day` = System.DayOfWeek (1=Pzt..5=Cuma); gün etiketleri `editor.weekdays(Short).{day}` anahtarlarından (mevcut).
- **Veri tipleri (mevcut, değişmez):**
  - `PlacementDto { id, day, period, subjectId, teacherId, roomId, isBlock, blockGroupId }` (`timetable/types.ts:55`).
  - `ExternalOccupancy { teacherSlots: Set<string>; roomSlots: Set<string> }`, anahtar `${teacherId}:${day}:${period}` (`editor/lib/editorDerive.ts:181`).
  - `NameLookups { subjects/teachers/rooms: Map<string,string> }`.
  - `cellKey(day,period) = `${day}:${period}`` (`editorDerive.ts:6`); `BlockRole = "start" | "cont"`.
- **Commit formatı:** `YYYY-MM-DD <type>[,type]: Türkçe özet.` (bugün 2026-06-20). Her commit sonunda:
  ```
  Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01Jz2yaansFj615jCrtKkoQq
  ```
- **Çalışma dizini:** Tüm `npm`/`git` komutları `oksis-web/` içinde. Başlamadan: `master`/`main` üzerindeyse `git checkout -b feature/ders-programi-faz5-dilim0-ogretmen-gorunumu`.

---

### Task 1: Saf çekirdek — `deriveTeacherView` + `distinctTeachers`

**Files:**
- Create: `oksis-web/src/portals/admin/timetable/editor/lib/teacherView.ts`
- Test: `oksis-web/src/portals/admin/timetable/editor/lib/__tests__/teacherView.test.ts`

**Interfaces:**
- Consumes: `PlacementDto` (`../../types`), `ExternalOccupancy` + `BlockRole` + `cellKey` (`../editorDerive`).
- Produces:
  - `export type EditorViewMode = "class" | "teacher"`
  - `export type TeacherViewCell = { kind: "lesson"; placement: PlacementDto; blockRole?: BlockRole } | { kind: "elsewhere" }`
  - `distinctTeachers(placements: PlacementDto[], teachers: Map<string,string>): { id: string; name: string }[]`
  - `deriveTeacherView(placements: PlacementDto[], occ: ExternalOccupancy, teacherId: string, blockRoles: Map<string, BlockRole>): Map<string, TeacherViewCell>`

- [ ] **Step 1: Write the failing test**

```ts
// oksis-web/src/portals/admin/timetable/editor/lib/__tests__/teacherView.test.ts
import { describe, it, expect } from "vitest";
import { deriveTeacherView, distinctTeachers } from "../teacherView";
import type { ExternalOccupancy, BlockRole } from "../editorDerive";
import type { PlacementDto } from "../../../types";

const pl = (o: Partial<PlacementDto> & { id: string; day: number; period: number; teacherId: string }): PlacementDto => ({
  subjectId: "s1", roomId: "r1", isBlock: false, blockGroupId: null, ...o,
});
const emptyOcc: ExternalOccupancy = { teacherSlots: new Set(), roomSlots: new Set() };
const noBlocks = new Map<string, BlockRole>();

describe("distinctTeachers", () => {
  it("returns distinct teacher ids with names, sorted by name (tr)", () => {
    const placements = [
      pl({ id: "p1", day: 1, period: 1, teacherId: "t2" }),
      pl({ id: "p2", day: 1, period: 2, teacherId: "t1" }),
      pl({ id: "p3", day: 2, period: 1, teacherId: "t2" }),
    ];
    const names = new Map([["t1", "Bülent"], ["t2", "Ahmet"]]);
    expect(distinctTeachers(placements, names)).toEqual([
      { id: "t2", name: "Ahmet" },
      { id: "t1", name: "Bülent" },
    ]);
  });
  it("falls back to em dash for unknown teacher name", () => {
    const placements = [pl({ id: "p1", day: 1, period: 1, teacherId: "tX" })];
    expect(distinctTeachers(placements, new Map())).toEqual([{ id: "tX", name: "—" }]);
  });
});

describe("deriveTeacherView", () => {
  it("places this-program lessons for the selected teacher only", () => {
    const placements = [
      pl({ id: "p1", day: 1, period: 1, teacherId: "t1", subjectId: "s1", roomId: "r1" }),
      pl({ id: "p2", day: 1, period: 2, teacherId: "t2" }),
    ];
    const view = deriveTeacherView(placements, emptyOcc, "t1", noBlocks);
    expect(view.get("1:1")).toEqual({ kind: "lesson", placement: placements[0], blockRole: undefined });
    expect(view.has("1:2")).toBe(false);
  });
  it("marks elsewhere from external occupancy for the selected teacher", () => {
    const occ: ExternalOccupancy = { teacherSlots: new Set(["t1:3:4"]), roomSlots: new Set() };
    const view = deriveTeacherView([], occ, "t1", noBlocks);
    expect(view.get("3:4")).toEqual({ kind: "elsewhere" });
  });
  it("prefers this-program lesson over elsewhere on the same cell", () => {
    const placements = [pl({ id: "p1", day: 3, period: 4, teacherId: "t1" })];
    const occ: ExternalOccupancy = { teacherSlots: new Set(["t1:3:4"]), roomSlots: new Set() };
    const view = deriveTeacherView(placements, occ, "t1", noBlocks);
    expect(view.get("3:4")?.kind).toBe("lesson");
  });
  it("ignores other teachers' occupancy", () => {
    const occ: ExternalOccupancy = { teacherSlots: new Set(["t2:1:1"]), roomSlots: new Set() };
    expect(deriveTeacherView([], occ, "t1", noBlocks).size).toBe(0);
  });
  it("attaches block role to lesson cells", () => {
    const placements = [pl({ id: "p1", day: 1, period: 1, teacherId: "t1", isBlock: true, blockGroupId: "g1" })];
    const blocks = new Map<string, BlockRole>([["p1", "start"]]);
    const view = deriveTeacherView(placements, emptyOcc, "t1", blocks);
    expect(view.get("1:1")).toMatchObject({ kind: "lesson", blockRole: "start" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/portals/admin/timetable/editor/lib/__tests__/teacherView.test.ts`
Expected: FAIL — `Cannot find module '../teacherView'`.

- [ ] **Step 3: Write minimal implementation**

```ts
// oksis-web/src/portals/admin/timetable/editor/lib/teacherView.ts
import { cellKey, type BlockRole, type ExternalOccupancy } from "./editorDerive";
import type { PlacementDto } from "../../types";

export type EditorViewMode = "class" | "teacher";

export type TeacherViewCell =
  | { kind: "lesson"; placement: PlacementDto; blockRole?: BlockRole }
  | { kind: "elsewhere" };

/** Programdaki yerleşimlerde geçen distinct öğretmenler, ada göre (tr) sıralı. Ad yoksa "—". */
export function distinctTeachers(
  placements: PlacementDto[],
  teachers: Map<string, string>,
): { id: string; name: string }[] {
  const ids = new Set(placements.map((p) => p.teacherId));
  return [...ids]
    .map((id) => ({ id, name: teachers.get(id) ?? "—" }))
    .sort((a, b) => a.name.localeCompare(b.name, "tr"));
}

/**
 * Seçilen öğretmenin haftası (yalnız bu program):
 *  - bu programdaki dersi → lesson hücre (blok rolü ile),
 *  - başka sınıfta meşgul (externalOccupancy) → elsewhere,
 *  - aynı hücrede ikisi varsa lesson önceliklidir.
 */
export function deriveTeacherView(
  placements: PlacementDto[],
  occ: ExternalOccupancy,
  teacherId: string,
  blockRoles: Map<string, BlockRole>,
): Map<string, TeacherViewCell> {
  const out = new Map<string, TeacherViewCell>();
  for (const p of placements) {
    if (p.teacherId !== teacherId) continue;
    out.set(cellKey(p.day, p.period), { kind: "lesson", placement: p, blockRole: blockRoles.get(p.id) });
  }
  for (const slot of occ.teacherSlots) {
    const [tid, dStr, pStr] = slot.split(":");
    if (tid !== teacherId) continue;
    const k = `${dStr}:${pStr}`;
    if (out.has(k)) continue;
    out.set(k, { kind: "elsewhere" });
  }
  return out;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/portals/admin/timetable/editor/lib/__tests__/teacherView.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/portals/admin/timetable/editor/lib/teacherView.ts src/portals/admin/timetable/editor/lib/__tests__/teacherView.test.ts
git commit -m "$(cat <<'EOF'
2026-06-20 feat,test: Editör öğretmen görünümü saf çekirdeği (deriveTeacherView + distinctTeachers).

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Jz2yaansFj615jCrtKkoQq
EOF
)"
```

---

### Task 2: Salt-okunur `TeacherPreviewGrid` + i18n `elsewhere` + CSS

**Files:**
- Create: `oksis-web/src/portals/admin/timetable/editor/components/TeacherPreviewGrid.tsx`
- Test: `oksis-web/src/portals/admin/timetable/editor/components/__tests__/TeacherPreviewGrid.test.tsx`
- Modify: `oksis-web/src/shared/i18n/locales/tr/timetable.json` + `.../en/timetable.json` (editor altına `teacherPreview.elsewhere`)
- Modify: `oksis-web/src/portals/admin/timetable/editor/editor.css` (read-only + elsewhere stilleri)

**Interfaces:**
- Consumes: `TeacherViewCell` (`../lib/teacherView`), `GridRow` + `cellKey` + `subjectColorClass` (`../lib/editorDerive`), `NameLookups` (`../../types`).
- Produces: `TeacherPreviewGrid(props: { days: number[]; gridRows: GridRow[]; view: Map<string, TeacherViewCell>; lookups: NameLookups; className: string })`.

- [ ] **Step 1: Add i18n key `editor.teacherPreview.elsewhere`**

`tr/timetable.json` → `editor` nesnesi içine (örn. `teacherView` satırının hemen altına) ekle:
```json
"teacherPreview": { "elsewhere": "Başka sınıf" },
```
`en/timetable.json` → `editor` nesnesine:
```json
"teacherPreview": { "elsewhere": "Other class" },
```

- [ ] **Step 2: Write the failing test**

```tsx
// oksis-web/src/portals/admin/timetable/editor/components/__tests__/TeacherPreviewGrid.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "../../../../../../shared/i18n";
import { TeacherPreviewGrid } from "../TeacherPreviewGrid";
import type { TeacherViewCell } from "../../lib/teacherView";
import type { GridRow } from "../../lib/editorDerive";

const lookups = {
  subjects: new Map([["s1", "Matematik"]]),
  teachers: new Map([["t1", "Ahmet Yılmaz"]]),
  rooms: new Map([["r1", "B-201"]]),
};
const gridRows: GridRow[] = [
  { kind: "lesson", period: 1, start: "08:40", end: "09:20" },
  { kind: "lesson", period: 2, start: "09:30", end: "10:10" },
];

describe("TeacherPreviewGrid", () => {
  it("renders lesson (subject+class+room), elsewhere marker, and no interactive controls", () => {
    const view = new Map<string, TeacherViewCell>([
      ["1:1", { kind: "lesson", placement: { id: "p1", day: 1, period: 1, subjectId: "s1", teacherId: "t1", roomId: "r1", isBlock: false, blockGroupId: null } }],
      ["2:2", { kind: "elsewhere" }],
    ]);
    render(<TeacherPreviewGrid days={[1, 2]} gridRows={gridRows} view={view} lookups={lookups} className="9-A" />);
    expect(screen.getByText("Matematik")).toBeTruthy();
    expect(screen.getByText("9-A")).toBeTruthy();
    expect(screen.getByText("B-201")).toBeTruthy();
    expect(screen.getByText("Başka sınıf")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test -- src/portals/admin/timetable/editor/components/__tests__/TeacherPreviewGrid.test.tsx`
Expected: FAIL — `Cannot find module '../TeacherPreviewGrid'`.

- [ ] **Step 4: Write the component**

```tsx
// oksis-web/src/portals/admin/timetable/editor/components/TeacherPreviewGrid.tsx
import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import { Coffee, UtensilsCrossed, MapPin } from "lucide-react";
import { cellKey, subjectColorClass, type GridRow } from "../lib/editorDerive";
import type { TeacherViewCell } from "../lib/teacherView";
import type { NameLookups } from "../../types";

interface Props {
  days: number[];
  gridRows: GridRow[];
  view: Map<string, TeacherViewCell>;
  lookups: NameLookups;
  className: string;
}

/** Salt-okunur haftalık ızgara: seçilen öğretmenin bu programdaki dersleri + "Başka sınıf" işaretleri. */
export function TeacherPreviewGrid({ days, gridRows, view, lookups, className }: Props) {
  const { t } = useTranslation("timetable");
  return (
    <div className="sed-cal readonly">
      <div className="sed-grid">
        <div className="sed-gh time" />
        {days.map((d) => (
          <div key={`h${d}`} className="sed-gh day">
            <span className="d">{t(`editor.weekdaysShort.${d}`)}</span>
            <span className="n">{t(`editor.weekdays.${d}`)}</span>
          </div>
        ))}

        {gridRows.map((row, idx) =>
          row.kind === "break" ? (
            <div key={`b${idx}`} className={`sed-break${row.lunch ? " lunch" : ""}`}>
              <span className="ln" />
              <span className="lbl">
                {row.lunch ? <UtensilsCrossed size={12} /> : <Coffee size={12} />}
                {row.label}
              </span>
              <span className="ln" />
            </div>
          ) : (
            <Fragment key={`p${row.period}`}>
              <div className="sed-time">
                <span className="p">{row.period}</span>
                {row.start && (
                  <span className="h">
                    {row.start}
                    <br />
                    {row.end}
                  </span>
                )}
              </div>
              {days.map((d) => {
                const k = cellKey(d, row.period);
                const cell = view.get(k);
                if (!cell) return <div key={k} className="sed-cell empty ro" />;
                if (cell.kind === "elsewhere") {
                  return (
                    <div key={k} className="sed-cell elsewhere ro">
                      <span className="el">{t("editor.teacherPreview.elsewhere")}</span>
                    </div>
                  );
                }
                const p = cell.placement;
                const subjectName = lookups.subjects.get(p.subjectId) ?? "—";
                const roomCode = p.roomId ? lookups.rooms.get(p.roomId) : null;
                const cont = cell.blockRole === "cont";
                return (
                  <div
                    key={k}
                    className={`sed-cell filled ro ${subjectColorClass(p.subjectId)}${
                      cell.blockRole ? ` block-${cell.blockRole}` : ""
                    }`}
                  >
                    <span className="cc-name">{subjectName}</span>
                    {!cont && <span className="cc-meta">{className}</span>}
                    {!cont && roomCode && (
                      <span className="cc-room">
                        <MapPin size={11} />
                        {roomCode}
                      </span>
                    )}
                    {cell.blockRole && <span className="block-tag">BLOK</span>}
                  </div>
                );
              })}
            </Fragment>
          ),
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Add CSS (read-only + elsewhere)**

`editor.css` sonuna ekle:
```css
/* Faz 5/Dilim-0 — Öğretmen görünümü (salt-okunur) */
.sed-cal.readonly .sed-cell.ro { cursor: default; }
.sed-cal.readonly .sed-cell.ro:hover { box-shadow: none; }
.sed-cell.elsewhere {
  display: flex; align-items: center; justify-content: center;
  color: var(--muted, #64748b); font-size: 12px; font-weight: 500;
  background: repeating-linear-gradient(135deg, transparent, transparent 6px, rgba(100,116,139,.06) 6px, rgba(100,116,139,.06) 12px);
}
.sed-cell.elsewhere .el { opacity: .75; }
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm run test -- src/portals/admin/timetable/editor/components/__tests__/TeacherPreviewGrid.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 7: Commit**

```bash
git add src/portals/admin/timetable/editor/components/TeacherPreviewGrid.tsx src/portals/admin/timetable/editor/components/__tests__/TeacherPreviewGrid.test.tsx src/shared/i18n/locales/tr/timetable.json src/shared/i18n/locales/en/timetable.json src/portals/admin/timetable/editor/editor.css
git commit -m "$(cat <<'EOF'
2026-06-20 feat,test: Salt-okunur TeacherPreviewGrid + "Başka sınıf" i18n/CSS.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Jz2yaansFj615jCrtKkoQq
EOF
)"
```

---

### Task 3: `TeacherViewPanel` (seçici + rozet + boş durum) + i18n + CSS

**Files:**
- Create: `oksis-web/src/portals/admin/timetable/editor/components/TeacherViewPanel.tsx`
- Test: `oksis-web/src/portals/admin/timetable/editor/components/__tests__/TeacherViewPanel.test.tsx`
- Modify: `tr/timetable.json` + `en/timetable.json` (`editor.teacherPreview` → `selectorLabel`, `readonlyBadge`, `emptyState`)
- Modify: `editor.css` (bar/rozet/boş durum stilleri)

**Interfaces:**
- Consumes: `TeacherPreviewGrid` (Task 2), `TeacherViewCell` (`../lib/teacherView`), `GridRow` (`../lib/editorDerive`), `NameLookups`.
- Produces: `TeacherViewPanel(props: { teachers: { id: string; name: string }[]; selectedTeacherId: string; onSelect: (id: string) => void; view: Map<string, TeacherViewCell>; days: number[]; gridRows: GridRow[]; lookups: NameLookups; className: string })`.

- [ ] **Step 1: Add i18n keys**

`tr/timetable.json` → `editor.teacherPreview` nesnesini şu hale getir:
```json
"teacherPreview": {
  "elsewhere": "Başka sınıf",
  "selectorLabel": "Öğretmen",
  "readonlyBadge": "Salt-okunur · {{name}} merceği",
  "emptyState": "Önizleme için önce ders yerleştirin."
},
```
`en/timetable.json` → `editor.teacherPreview`:
```json
"teacherPreview": {
  "elsewhere": "Other class",
  "selectorLabel": "Teacher",
  "readonlyBadge": "Read-only · {{name}} lens",
  "emptyState": "Place lessons first to preview."
},
```

- [ ] **Step 2: Write the failing test**

```tsx
// oksis-web/src/portals/admin/timetable/editor/components/__tests__/TeacherViewPanel.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "../../../../../../shared/i18n";
import { TeacherViewPanel } from "../TeacherViewPanel";

const lookups = { subjects: new Map(), teachers: new Map(), rooms: new Map() };
const base = { view: new Map(), days: [1], gridRows: [], lookups, className: "9-A" };

describe("TeacherViewPanel", () => {
  it("shows empty state when there are no teachers", () => {
    render(<TeacherViewPanel teachers={[]} selectedTeacherId="" onSelect={() => {}} {...base} />);
    expect(screen.getByText(/önce ders yerleştirin/i)).toBeTruthy();
  });
  it("renders selector + read-only lens badge and emits onSelect on change", () => {
    const onSelect = vi.fn();
    render(
      <TeacherViewPanel
        teachers={[{ id: "t1", name: "Ahmet" }, { id: "t2", name: "Bülent" }]}
        selectedTeacherId="t1"
        onSelect={onSelect}
        {...base}
      />,
    );
    expect(screen.getByText(/9-A merceği/)).toBeTruthy();
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "t2" } });
    expect(onSelect).toHaveBeenCalledWith("t2");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test -- src/portals/admin/timetable/editor/components/__tests__/TeacherViewPanel.test.tsx`
Expected: FAIL — `Cannot find module '../TeacherViewPanel'`.

- [ ] **Step 4: Write the component**

```tsx
// oksis-web/src/portals/admin/timetable/editor/components/TeacherViewPanel.tsx
import { useTranslation } from "react-i18next";
import { Eye } from "lucide-react";
import { TeacherPreviewGrid } from "./TeacherPreviewGrid";
import type { TeacherViewCell } from "../lib/teacherView";
import type { GridRow } from "../lib/editorDerive";
import type { NameLookups } from "../../types";

interface Props {
  teachers: { id: string; name: string }[];
  selectedTeacherId: string;
  onSelect: (id: string) => void;
  view: Map<string, TeacherViewCell>;
  days: number[];
  gridRows: GridRow[];
  lookups: NameLookups;
  className: string;
}

/** Öğretmen görünümü: öğretmen seçici + salt-okunur mercek rozeti + önizleme ızgarası. */
export function TeacherViewPanel({
  teachers,
  selectedTeacherId,
  onSelect,
  view,
  days,
  gridRows,
  lookups,
  className,
}: Props) {
  const { t } = useTranslation("timetable");
  if (teachers.length === 0) {
    return <div className="sed-tv-empty">{t("editor.teacherPreview.emptyState")}</div>;
  }
  return (
    <>
      <div className="sed-tv-bar">
        <label className="sed-tv-sel">
          <span className="lbl">{t("editor.teacherPreview.selectorLabel")}</span>
          <select value={selectedTeacherId} onChange={(e) => onSelect(e.target.value)}>
            {teachers.map((tch) => (
              <option key={tch.id} value={tch.id}>
                {tch.name}
              </option>
            ))}
          </select>
        </label>
        <span className="sed-tv-badge">
          <Eye size={13} /> {t("editor.teacherPreview.readonlyBadge", { name: className })}
        </span>
      </div>
      <TeacherPreviewGrid days={days} gridRows={gridRows} view={view} lookups={lookups} className={className} />
    </>
  );
}
```

- [ ] **Step 5: Add CSS**

`editor.css` sonuna ekle:
```css
.sed-tv-bar { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
.sed-tv-sel { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; }
.sed-tv-sel select { padding: 6px 8px; border: 1px solid var(--border, #e2e8f0); border-radius: 8px; background: #fff; }
.sed-tv-badge { display: inline-flex; align-items: center; gap: 5px; color: var(--muted, #64748b); font-size: 12px; }
.sed-tv-empty { padding: 32px; text-align: center; color: var(--muted, #64748b); }
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm run test -- src/portals/admin/timetable/editor/components/__tests__/TeacherViewPanel.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 7: Commit**

```bash
git add src/portals/admin/timetable/editor/components/TeacherViewPanel.tsx src/portals/admin/timetable/editor/components/__tests__/TeacherViewPanel.test.tsx src/shared/i18n/locales/tr/timetable.json src/shared/i18n/locales/en/timetable.json src/portals/admin/timetable/editor/editor.css
git commit -m "$(cat <<'EOF'
2026-06-20 feat,test: TeacherViewPanel — öğretmen seçici + salt-okunur mercek rozeti + boş durum.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Jz2yaansFj615jCrtKkoQq
EOF
)"
```

---

### Task 4: `EditorToolbar` toggle'ını etkinleştir

**Files:**
- Modify: `oksis-web/src/portals/admin/timetable/editor/components/EditorToolbar.tsx` (props + `sed-seg` butonları, ~satır 8-26 ve ~71-76)
- Test: `oksis-web/src/portals/admin/timetable/editor/components/__tests__/EditorToolbar.test.tsx` (yeni)

**Interfaces:**
- Consumes: `EditorViewMode` (`../lib/teacherView`).
- Produces: `EditorToolbar` Props'a eklenir: `viewMode: EditorViewMode; onChangeView: (mode: EditorViewMode) => void`.

- [ ] **Step 1: Write the failing test**

```tsx
// oksis-web/src/portals/admin/timetable/editor/components/__tests__/EditorToolbar.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "../../../../../../shared/i18n";
import { EditorToolbar } from "../EditorToolbar";

function setup(viewMode: "class" | "teacher" = "class") {
  const onChangeView = vi.fn();
  render(
    <MemoryRouter>
      <EditorToolbar
        className="9-A"
        status="Revising"
        version={4}
        saving={false}
        saved={false}
        dirty={false}
        onSave={() => {}}
        verifyOpen={false}
        onValidate={() => {}}
        onPublish={() => {}}
        blockMode={false}
        onToggleBlockMode={() => {}}
        onOpenHistory={() => {}}
        onDelete={() => {}}
        viewMode={viewMode}
        onChangeView={onChangeView}
      />
    </MemoryRouter>,
  );
  return { onChangeView };
}

describe("EditorToolbar view toggle", () => {
  it("enables the teacher-view button and emits onChangeView('teacher')", () => {
    const { onChangeView } = setup();
    const btn = screen.getByRole("button", { name: /Öğretmen görünümü/i });
    expect((btn as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(btn);
    expect(onChangeView).toHaveBeenCalledWith("teacher");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/portals/admin/timetable/editor/components/__tests__/EditorToolbar.test.tsx`
Expected: FAIL — TS/prop error (`viewMode`/`onChangeView` yok) veya buton `disabled`.

- [ ] **Step 3: Add props to the interface**

`EditorToolbar.tsx` — import ve `interface Props` güncelle:
```tsx
import type { EditorViewMode } from "../lib/teacherView";
```
`interface Props { ... onDelete: () => void; }` içine ekle:
```tsx
  viewMode: EditorViewMode;
  onChangeView: (mode: EditorViewMode) => void;
```
Fonksiyon parametre destructuring'ine (`onDelete,` yanına) ekle: `viewMode,` ve `onChangeView,`.

- [ ] **Step 4: Replace the static segment buttons**

`EditorToolbar.tsx` — mevcut `<div className="sed-seg">…</div>` bloğunu şununla değiştir:
```tsx
          <div className="sed-seg">
            <button
              type="button"
              className={cn(viewMode === "class" && "on")}
              onClick={() => onChangeView("class")}
            >
              <LayoutGrid size={15} /> {t("editor.classView")}
            </button>
            <button
              type="button"
              className={cn(viewMode === "teacher" && "on")}
              onClick={() => onChangeView("teacher")}
            >
              <User size={15} /> {t("editor.teacherView")}
            </button>
          </div>
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- src/portals/admin/timetable/editor/components/__tests__/EditorToolbar.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 6: Commit**

```bash
git add src/portals/admin/timetable/editor/components/EditorToolbar.tsx src/portals/admin/timetable/editor/components/__tests__/EditorToolbar.test.tsx
git commit -m "$(cat <<'EOF'
2026-06-20 feat,test: Editör toolbar Sınıf/Öğretmen görünümü toggle'ı etkinleştirildi.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Jz2yaansFj615jCrtKkoQq
EOF
)"
```

---

### Task 5: `ScheduleEditorPage` entegrasyonu (state + koşullu render)

**Files:**
- Modify: `oksis-web/src/portals/admin/timetable/ScheduleEditorPage.tsx`

**Interfaces:**
- Consumes: `TeacherViewPanel` (Task 3), `deriveTeacherView` + `distinctTeachers` + `EditorViewMode` (Task 1).
- Produces: (yok — terminal entegrasyon).

> **Not (test kapsamı):** Sayfa-seviyesi entegrasyon birim testle kapsanmaz (useEditorData/useEditorDraft/occQ/router/query-client mock yükü orantısız). Mantık Task 1-4'te testli; bu task `tsc` + `npm run build` + tam test paketi + manuel tarayıcı smoke ile doğrulanır (silent gap yok).

- [ ] **Step 1: Add imports**

`ScheduleEditorPage.tsx` import bloğuna ekle (mevcut editör importlarının yanına):
```tsx
import { TeacherViewPanel } from "./editor/components/TeacherViewPanel";
import { deriveTeacherView, distinctTeachers, type EditorViewMode } from "./editor/lib/teacherView";
```
`useEffect` React importunda yoksa ekle: `import { useEffect, useMemo, useState } from "react";` (mevcut React importuna `useEffect` ekle).

- [ ] **Step 2: Add state + derived values**

`const placements = draft.placements;` satırından sonra ekle:
```tsx
  const [viewMode, setViewMode] = useState<EditorViewMode>("class");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");

  const teacherOptions = useMemo(
    () => distinctTeachers(placements, data.lookups.teachers),
    [placements, data.lookups.teachers],
  );

  useEffect(() => {
    if (viewMode !== "teacher" || teacherOptions.length === 0) return;
    if (!teacherOptions.some((o) => o.id === selectedTeacherId)) {
      setSelectedTeacherId(teacherOptions[0].id);
    }
  }, [viewMode, teacherOptions, selectedTeacherId]);

  const teacherView = useMemo(
    () => deriveTeacherView(placements, occQ.data ?? EMPTY_OCC, selectedTeacherId, blockRoles),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [placements, occQ.data, selectedTeacherId, blockRoles],
  );
```
> `EMPTY_OCC` ve `blockRoles` zaten yukarıda tanımlı (`ScheduleEditorPage.tsx:232`, `:226`). `EMPTY_OCC`'in `teacherView`'dan ÖNCE tanımlı olduğundan emin ol; değilse `EMPTY_OCC` tanımını state bloğunun üstüne taşı.

- [ ] **Step 3: Pass props to EditorToolbar**

`<EditorToolbar ... />` JSX'ini bul (dönen ağacın başında). Prop listesine ekle:
```tsx
            viewMode={viewMode}
            onChangeView={setViewMode}
```

- [ ] **Step 4: Conditionally render teacher view inside `sed-main`**

`<div className="sed-main" ref={mainRef}>` içeriğini koşullu yap. Mevcut içerik (TempChangesPanel + selectMode/note + flushError + WeekGrid) `viewMode === "class"` dalına alınır:
```tsx
            <div className="sed-main" ref={mainRef}>
              {viewMode === "teacher" ? (
                <TeacherViewPanel
                  teachers={teacherOptions}
                  selectedTeacherId={selectedTeacherId}
                  onSelect={setSelectedTeacherId}
                  view={teacherView}
                  days={data.days}
                  gridRows={data.gridRows}
                  lookups={data.lookups}
                  className={data.className}
                />
              ) : (
                <>
                  <TempChangesPanel
                    temps={tc.state}
                    onUndo={handleTempUndo}
                    onPublish={() => setTempPublishOpen(true)}
                    onGoCell={gotoCellByPlacement}
                  />
                  {/* ↓↓↓ mevcut selectMode/note + flushError + <WeekGrid …/> bloğu aynen buraya ↓↓↓ */}
                </>
              )}
            </div>
```
> Mevcut `TempChangesPanel`, `selectMode ? … : …`, `draft.flushError && …` ve `<WeekGrid … />` JSX'ini olduğu gibi `class` dalının `<>…</>` içine taşı (tekrar yazma — taşı). Hiçbir prop'unu değiştirme.

- [ ] **Step 5: Run typecheck + full test suite + build**

Run: `npm run build`
Expected: TS hatasız, build temiz.

Run: `npm run test`
Expected: Tüm paket yeşil (yeni 4 dosya dahil; mevcut testler kırılmadı).

- [ ] **Step 6: Manuel tarayıcı smoke**

`npm run dev` → bir programı editörde aç → toolbar'da **Öğretmen görünümü**'ne tıkla → seçici + "Salt-okunur · {sınıf} merceği" rozeti + salt-okunur grid görünür; öğretmen değiştir → grid değişir; başka sınıfta meşgul saatte "Başka sınıf" işareti; **Sınıf görünümü**'ne dön → editör normal çalışır (DnD/menü). Console error yok.

- [ ] **Step 7: Commit**

```bash
git add src/portals/admin/timetable/ScheduleEditorPage.tsx
git commit -m "$(cat <<'EOF'
2026-06-20 feat: Editör öğretmen görünümü entegrasyonu (seçici + salt-okunur önizleme).

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Jz2yaansFj615jCrtKkoQq
EOF
)"
```

---

### Task 6: Dokümantasyon — completion_status düzeltmesi + dilim kapanışı

**Files:**
- Modify: `.claude/docs/modules/timetable/completion_status.md` (workspace repo)

> Bu dosya `oksis` workspace repo'sundadır (oksis-web değil). Commit ayrı repo'da; OKSİS formatı aynı.

- [ ] **Step 1: 5-0 maddesini FE-only olarak düzelt**

"⏳ Eksik / Bekleyen Yapılar" → "Dilim 5-0" bloğunda **5-0.1 (BE) yeni query** alt maddesini kaldır; dilimi **FE-only (yeni BE yok — design D2)** olarak işaretle ve TAMAMLANDI durumuna taşı (tarih 2026-06-20, branch adı, "deriveTeacherView + TeacherPreviewGrid + TeacherViewPanel + toolbar toggle + sayfa entegrasyonu; externalOccupancy'den 'Başka sınıf'; salt-okunur"). İlerleme notu + `Güncel` tarihini koru.

- [ ] **Step 2: Commit (workspace repo)**

```bash
git -C /Users/farukkaya/Projects/oksis add .claude/docs/modules/timetable/completion_status.md .claude/specs/ders-programi-faz5-dilim0-ogretmen-gorunumu-design.md .claude/specs/ders-programi-faz5-dilim0-ogretmen-gorunumu-plan-fe.md
git -C /Users/farukkaya/Projects/oksis commit -m "$(cat <<'EOF'
2026-06-20 docs: Faz 5/Dilim-0 öğretmen görünümü FE-only tamamlandı; spec+plan eklendi.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Jz2yaansFj615jCrtKkoQq
EOF
)"
```

---

## Self-Review

**Spec coverage:** D1 (veri kaynakları) → Task 1+5; D2 (FE-only) → Global Constraints + Task 6; D3 (toggle) → Task 4+5; D4 (seçici/varsayılan/boş) → Task 3+5; D5 (lesson/elsewhere/empty + öncelik) → Task 1+2; D6 (salt-okunur) → Task 2 (handler yok); D7 (tampon) → Task 5 (`draft.placements`); §4 dosya planı → Task 1-5; §5 test → her task; §7 completion_status → Task 6. **Kapsam tam.**

**Placeholder taraması:** TBD/TODO yok; her kod adımı tam içerik. Task 5 Step 4 "mevcut bloğu taşı" — kod tekrarı yerine bilinçli taşıma talimatı (mevcut JSX'i yeniden üretmek hataya açık).

**Tip tutarlılığı:** `TeacherViewCell`/`EditorViewMode`/`deriveTeacherView`/`distinctTeachers` imzaları Task 1'de tanımlı, Task 2-5'te aynı isim/şekille tüketiliyor. `ExternalOccupancy.teacherSlots` anahtar formatı (`tid:day:period`) Task 1 split mantığıyla tutarlı. `cellKey` formatı (`day:period`) grid + derive ile aynı.
