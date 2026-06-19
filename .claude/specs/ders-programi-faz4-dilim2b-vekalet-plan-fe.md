# Vekâlet (Faz 4 / Dilim 2b) — Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use `- [ ]` checkboxes.

**Goal:** Replace the `VekaletPlaceholder` in the Duties admin screen with the real Vekâlet (substitution) workflow — absent-teacher → affected lessons → ranked substitute suggestions → assign / study-hall / revoke — and add a read-only substitution section to the teacher duty view, all over the existing Faz 2.5 `ScheduleException` backend.

**Architecture:** Extends the shipped 2a duties FE (`src/portals/admin/duties/`). New substitution types/keys/api/hooks; ported handoff components (`DtaVekalet`, `DtmLesson`, `DtmCandidate`); the DutyAdminPage Vekâlet tab swaps the placeholder for `DtaVekalet`. Teacher view (`src/portals/teacher/duties/`) gains a read-only vekâlet list. Itiraz/object is OUT (Dilim `schedule_requests`).

**Tech Stack:** React + Vite + TS strict, shadcn/ui + Tailwind, TanStack Query, RHF/Zod (where forms apply), axios, i18next, Vitest + Testing Library.

**Design doc:** `.claude/specs/ders-programi-faz4-dilim2b-vekalet-design.md`
**Handoff:** `.claude/design-handoffs/schedule_duty/duty_admin_more.jsx` (`DtaVekalet`/`DtmLesson`/`DtmCandidate`), `schedule_duty.jsx` (teacher vekâlet part), `*.css` (`.dta-*`/`.tdy-*`).

## Global Constraints

- Working dir: `oksis-web/`. Commands: `npm run build`, `npm run test`. (Project `tsc --noEmit` is unreliable — gate on build + vitest.)
- **ABSOLUTE: zero hardcoded Turkish.** Every visible string + `title`/`placeholder`/`aria-label` via `useTranslation("duties")` (`duties.substitution.*`). **Each task's final step is a grep for non-ASCII Turkish in touched files** (2a leaked this repeatedly — do not skip).
- **ABSOLUTE: no inline `style={{}}`** — Tailwind/`cn`. Only dynamic runtime values (none expected here) are exceptions.
- **K-2a-2:** NO availability concept anywhere in the vekâlet UI (no colors/warnings/imports referencing müsaitlik/availability).
- No `any` (use proper types / `TFunction<"duties">`). Named exports only (no default). Server state only in React Query; every key via `dutyKeys`/`tenantScopedKey`. `schoolId` from `useAuthStore((s) => s.user?.schoolId)`.
- axios via `src/shared/api/httpClient.ts`; responses are `{ data: T }` — unwrap with the existing `unwrap` helper in `dutiesApi.ts`.
- Skeletons for loading (never full-page spinner). shadcn components under `src/app/components/ui/`. `cn` from `src/lib/utils`.
- Permission: Vekâlet tab + all write actions gated by `duties.substitute` (`usePermission("duties.substitute")`). Read also requires `duties.substitute` (vekâlet is an admin-action surface).
- Tests next to code in `__tests__/`; `import "../../../../shared/i18n"` at top (adjust depth); wrap with `createTestWrapper()` from `src/test/utils.tsx`. ~7 pre-existing flaky failures (rooms.queries, useAccountLogin, StepStudents, AcademicCalendarPage, BellScheduleTab, SubjectsPage, SeasonWizardPage) are unrelated — introduce ZERO new failures.
- API contract = design §5 (BE plan implements). DTO field names must match the BE plan exactly.
- Commit format: `2026-06-19 <type>[,type]: Türkçe özet.` + the repo's Co-Authored-By/Claude-Session trailers (see `git log -1 --format=%B`).

---

## File Structure

**Modify (extend 2a):**
- `src/portals/admin/duties/types.ts` — add substitution DTOs + bodies + `BranchFit`.
- `src/portals/admin/duties/keys/dutyKeys.ts` — add `substitutionBoard`, `substitutionCandidates`.
- `src/portals/admin/duties/api/dutiesApi.ts` — add 5 substitution methods.
- `src/portals/admin/duties/DutyAdminPage.tsx` — Vekâlet tab renders `DtaVekalet` (gated) instead of `VekaletPlaceholder`.
- `src/shared/i18n/locales/{tr,en}/duties.json` — add `substitution.*`.
- `src/portals/teacher/duties/TeacherDutyPage.tsx` (+ helpers) — read-only vekâlet section.
- `src/portals/admin/duties/duties.css` — any missing `.dta-vk-*`/`.dta-abs-*`/`.dta-cand*`/`.dta-lesson*`/`.dta-sugg*` classes from the handoff `duty_admin.css` not yet ported in 2a; teacher `.tdy-*` vekâlet classes from `schedule_duty.css`.

**Create:**
- `src/portals/admin/duties/hooks/useSubstitution.ts` — `useSubstitutionBoard`, `useAvailableSubstitutes`, `useSubstitutionMutations`.
- `src/portals/admin/duties/components/DtmCandidate.tsx`
- `src/portals/admin/duties/components/DtmLesson.tsx`
- `src/portals/admin/duties/components/DtaVekalet.tsx`
- `__tests__/` for each new component + the hooks.

**Remove (after wiring):** `VekaletPlaceholder.tsx` import usage (keep the file or delete — Task 5 decides; if deleted, drop the `substitution.placeholderTitle/Body` keys too).

---

## Task 1: i18n `duties.substitution.*` (tr/en)

**Files:** Modify `src/shared/i18n/locales/tr/duties.json`, `.../en/duties.json`

**Interfaces:** Produces keys consumed by Tasks 4-6: `substitution.*` (daybar, absentCard, lesson statuses, candidate badges, actions, teacher view, states).

- [ ] **Step 1: Add TR keys** under the root `duties` object, alongside the existing `substitution` group (which today holds only `placeholderTitle`/`placeholderBody` from 2a):
```json
"substitution": {
  "tabTitle": "Vekâlet (Bugün)",
  "daybar": { "today": "Bugün · {{date}}", "summary": "{{teachers}} öğretmen gelmedi · {{lessons}} ders etkilendi", "open": "açık", "covered": "kapatıldı", "studyHall": "etüt" },
  "addAbsent": "Gelmeyen öğretmen ekle",
  "absentPicker": { "teacher": "Öğretmen", "reason": "Devamsızlık nedeni", "reasonPh": "örn. Rapor · tüm gün", "add": "Ekle", "cancel": "Vazgeç" },
  "info": { "title": "Boş ders = vekâlet adayı (nöbetten farklı)", "body": "Gelmeyen öğretmenin dersini, o saatte dersi olmayan bir öğretmen doldurur. Öneriler branş uyumu ve adil yük (bu haftaki vekâlet sayısı) sırasına göre dizilir. Derste olan öğretmene aynı saate vekâlet atanamaz." },
  "absentReason": "{{reason}}",
  "lesson": { "open": "Açık", "covered": "Vekil atandı", "studyHall": "Etüt / serbest" },
  "covered": { "assigned": "{{branch}} · vekil olarak görevlendirildi", "notified": "Bildirildi", "undo": "Geri al", "studyHallTitle": "Etüt / serbest çalışma", "studyHallBody": "Vekil atanmadı — sınıf etüt olarak geçecek" },
  "suggest": { "title": "Önerilen vekiller", "why": "o saatte boşta · branş uyumu + adalet sırası", "showMore": "Diğer {{count}} aday", "showLess": "Daha az göster", "studyHall": "Etüt/serbest yap", "empty": "Uygun vekil adayı yok" },
  "candidate": { "recommended": "Önerilen", "assign": "Ata", "load": "bu hafta {{count}} vekâlet", "fit": { "same": "Aynı branş", "near": "Yan branş", "different": "Farklı branş" } },
  "toast": { "assigned": "{{name}} vekil atandı — öğretmene ve sınıfa bildirim gönderildi", "studyHall": "{{cls}} · etüt/serbest olarak işaretlendi", "undone": "Vekâlet kaldırıldı — ders yeniden açık" },
  "empty": "Bugün gelmeyen öğretmen eklenmedi. Yukarıdan ekleyin.",
  "error": "Vekâlet verisi yüklenemedi.",
  "teacher": { "section": "Bu haftaki vekâletlerin", "inPlaceOf": "{{name}} yerine", "viewOnly": "Görüntüleme", "empty": "Sana atanmış vekâlet yok." }
}
```
Keep `placeholderTitle`/`placeholderBody` only if Task 5 keeps `VekaletPlaceholder`; otherwise remove them.

- [ ] **Step 2: Add EN keys** — identical key paths, English values (`daybar.today` = "Today · {{date}}", `candidate.fit.same/near/different` = "Same branch / Related branch / Different branch", etc.).

- [ ] **Step 3: Verify parity** — both files parse; identical key sets (run any i18n parity test, else grep both for `"substitution"` and diff key paths). `npm run build`.

- [ ] **Step 4: Commit** — `2026-06-19 feat: Vekâlet i18n anahtarları (duties.substitution tr/en) eklendi.`

---

## Task 2: Substitution types + query keys + API

**Files:** Modify `types.ts`, `keys/dutyKeys.ts`, `api/dutiesApi.ts`

**Interfaces:**
- Produces: `BranchFit`, `SubstituteCandidateDto`, `SubstitutionLessonDto`, `AbsentTeacherBoardDto`, write bodies (`CreateSubstitutionBody`, `StudyHallBody`, `RevokeSubstitutionBody`); `dutyKeys.substitutionBoard`, `dutyKeys.substitutionCandidates`; `dutiesApi.{getSubstitutionBoard,getAvailableSubstitutes,createSubstitution,markStudyHall,revokeSubstitution}`.

- [ ] **Step 1: Types** — append to `types.ts`:
```typescript
export type BranchFit = "same" | "near" | "different";
// CONFIRMED vs BE plan: BE emits `BranchFit` as INT (Same=0, Near=1, Different=2).
// dutiesApi.getAvailableSubstitutes maps int→this string union at the boundary (see Step 3).
export const BRANCH_FIT_BY_INT: Record<number, BranchFit> = { 0: "same", 1: "near", 2: "different" };

export interface SubstituteCandidateDto {
  id: string;
  name: string;
  branch: string | null;
  fit: BranchFit;
  currentWeekSubstitutionLoad: number;
}

export type SubstitutionLessonStatus = "open" | "covered" | "study-hall";

export interface SubstitutionLessonDto {
  programId: string;
  placementId: string;
  day: number;       // DayOfWeek 0..6 (0=Pzt convention)
  period: number;
  time: string | null;       // bell-schedule start, may be null
  className: string;
  subjectName: string;
  room: string | null;
  status: SubstitutionLessonStatus;
  substituteId: string | null;
  substituteName: string | null;
  substituteBranch: string | null;
  exceptionId: string | null; // present when covered/study-hall (for revoke)
}

// Server DTO from GET /duties/substitution/board — matches BE `SubstitutionBoardDto` exactly.
// NOTE: `reason` is NOT here — it's ad-hoc local state (K-2b-1), held by DtaVekalet's selected-teacher
// list ({ teacherId, reason }[]) and merged into the card at render time.
export interface AbsentTeacherBoardDto {
  absentTeacherId: string;
  absentTeacherName: string;
  absentTeacherBranch: string | null;
  date: string; // ISO
  lessons: SubstitutionLessonDto[];
}

export interface CreateSubstitutionBody {
  programId: string;
  targetPlacementId: string;
  date: string;          // ISO date
  substituteTeacherId: string;
  reason: string;
}
export interface StudyHallBody {
  programId: string;
  targetPlacementId: string;
  date: string;
  reason: string;
}
export interface RevokeSubstitutionBody { reason: string; }

// Teacher read-only view — from BE `GetMySubstitutions` (BE plan Task 4), NOT a MyDutiesDto extension
// (MyDutyItemDto is location-based nöbet/yancı; substitutions are class/subject/date-based).
export interface MySubstitutionDto {
  date: string;        // ISO date
  day: number;         // 0=Pzt
  period: number;
  time: string | null;
  className: string;
  subjectName: string;
  room: string | null;
  originalTeacherId: string;
  originalTeacherName: string; // "{name} yerine"
}
```
> Teacher-view vekâlet data comes from a dedicated BE query `GET /duties/substitution/me?termId=` → `MySubstitutionDto[]` (BE plan Task 4). NOT folded into `MyDutiesDto` (its `MyDutyItemDto` is location-based for nöbet/yancı; substitutions need class/subject/date).

- [ ] **Step 2: Keys** — add to `dutyKeys`:
```typescript
substitutionBoard: (schoolId: string | null | undefined, termId: string, date: string, teacherId: string) =>
  tenantScopedKey(schoolId, ["duties", "substitution", "board", termId, date, teacherId] as const),
substitutionCandidates: (schoolId: string | null | undefined, programId: string, date: string, day: number, period: number, absentTeacherId: string) =>
  tenantScopedKey(schoolId, ["duties", "substitution", "candidates", programId, date, day, period, absentTeacherId] as const),
mySubstitutions: (schoolId: string | null | undefined, termId: string) =>
  tenantScopedKey(schoolId, ["duties", "substitution", "me", termId] as const),
```

- [ ] **Step 3: API** — add to `dutiesApi` (use the existing `unwrap`):
```typescript
getSubstitutionBoard: async (termId: string, date: string, teacherId: string, signal?: AbortSignal) =>
  unwrap(await httpClient.get<ApiEnvelope<AbsentTeacherBoardDto>>(
    `/duties/substitution/board?termId=${termId}&date=${date}&teacherId=${teacherId}`, { signal })),
getAvailableSubstitutes: async (programId: string, date: string, day: number, period: number, absentTeacherId: string, signal?: AbortSignal) => {
  // BE sends `fit` as int (0/1/2); map to the BranchFit string union at the boundary.
  const raw = unwrap(await httpClient.get<ApiEnvelope<Array<Omit<SubstituteCandidateDto, "fit"> & { fit: number }>>>(
    `/duties/substitution/candidates?programId=${programId}&date=${date}&day=${day}&period=${period}&absentTeacherId=${absentTeacherId}`, { signal }));
  return raw.map((c) => ({ ...c, fit: BRANCH_FIT_BY_INT[c.fit] ?? "different" }) satisfies SubstituteCandidateDto);
},
// my substitutions (teacher read-only view) — BE GetMySubstitutions (Task 4)
getMySubstitutions: async (termId: string, signal?: AbortSignal) =>
  unwrap(await httpClient.get<ApiEnvelope<MySubstitutionDto[]>>(
    `/duties/substitution/me?termId=${termId}`, { signal })),
createSubstitution: async (body: CreateSubstitutionBody) =>
  unwrap(await httpClient.post<ApiEnvelope<{ exceptionId: string }>>("/duties/substitution", body)),
markStudyHall: async (body: StudyHallBody) =>
  unwrap(await httpClient.post<ApiEnvelope<{ exceptionId: string }>>("/duties/substitution/study-hall", body)),
revokeSubstitution: async (exceptionId: string, body: RevokeSubstitutionBody) => {
  await httpClient.post(`/duties/substitution/${exceptionId}/revoke`, body);
},
```
Add the new type imports to the `import type {...}` block.

- [ ] **Step 4:** `npm run build` → success. **Step 5: Commit** — `2026-06-19 feat: Vekâlet tipleri, query key'leri ve API katmanı eklendi.`

---

## Task 3: Substitution hooks

**Files:** Create `hooks/useSubstitution.ts`, `__tests__/useSubstitution.test.tsx`

**Interfaces:**
- `useSubstitutionBoard(termId, date, teacherId, enabled)` — query (lazy via `enabled` since the absent-teacher list is ad-hoc).
- `useAvailableSubstitutes(programId, date, day, period, absentTeacherId, enabled)` — lazy query (only when a lesson row is "open" and expanded).
- `useSubstitutionMutations(termId, date)` — `{ createSubstitution, markStudyHall, revokeSubstitution }`; each `onSuccess` invalidates `dutyKeys.all(schoolId)` (covers board + candidates + summary/my, race-safe — same pattern 2a adopted).
- `useMySubstitutions(termId)` — query for the teacher read-only view; `enabled: Boolean(schoolId && termId)`; calls `dutiesApi.getMySubstitutions`, key `dutyKeys.mySubstitutions`. (Consumed by Task 6.)

- [ ] **Step 1: Failing test** — mock `dutiesApi`; assert `useSubstitutionBoard` returns the board on success when enabled, and is disabled (no fetch) when `enabled=false`. (Mirror 2a `useDutyData.test.tsx` authStore mock.)
- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement** — mirror `useDutyData.ts` (`useSchoolId` selector, `enabled: Boolean(schoolId && termId && teacherId && enabled)`, `{ signal }` threaded). Mutations: `useMutation` with `onSuccess: () => void qc.invalidateQueries({ queryKey: dutyKeys.all(schoolId) })`.
- [ ] **Step 4: Run → PASS.** `npm run build`.
- [ ] **Step 5: Commit** — `2026-06-19 feat: Vekâlet React Query hook'ları (board + candidates + mutations) eklendi.`

---

## Task 4: DtmCandidate + DtmLesson

**Files:** Create `components/DtmCandidate.tsx`, `components/DtmLesson.tsx`, tests. Modify `duties.css` (port any missing `.dta-cand*`/`.dta-lesson*`/`.dta-sugg*`/`.dta-covered`/`.dta-lst-pill` classes from handoff `duty_admin.css`).

**Interfaces:**
- `DtmCandidate({ candidate, best, onAssign })` — avatar + name + fit badge (`candidate.fit.{same|near|different}`) + load (`candidate.load` count) + "Önerilen" when `best` + Ata button. Uses `DtaAvatar` (2a).
- `DtmLesson({ lesson, candidates, candidatesLoading, onExpand, onAssign, onStudyHall, onRevoke })` — status pill; when `open`: suggestions block (first candidate + "Diğer N aday" expand → calls `onExpand` to enable the candidates query; "Etüt/serbest yap"); when `covered`/`study-hall`: `dta-covered` with "Bildirildi" + "Geri al".

- [ ] **Step 1: Failing tests** (per handoff behavior + brief):
  - `DtmCandidate`: renders fit badge text for each `fit`; shows "Önerilen" when `best`; `onAssign` fires on Ata.
  - `DtmLesson`: open lesson shows the suggestions header; clicking "Etüt/serbest yap" fires `onStudyHall`; a `covered` lesson shows substitute name + "Geri al" → `onRevoke`; **no availability text anywhere**.
- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement** — faithfully port handoff `DtmCandidate`/`DtmLesson` markup (`.dta-cand`/`.dta-lesson`/`.dta-sugg`/`.dta-covered` classes). All copy via `t("substitution.*")`. lucide icons (map handoff `Icon name`: `check`→Check, `circle-dot`→CircleDot, `minus`→Minus, `shield`→Shield, `sparkles`→Sparkles, `user-check`→UserCheck, `book`→BookOpen, `bell`→Bell, `rotate-ccw`→RotateCcw, `map-pin`→MapPin, `alert-triangle`→AlertTriangle, `users-round`→UsersRound, `chevron-down`→ChevronDown). Fit→icon/class via a typed `Record<BranchFit, ...>`. The "Diğer N aday" toggle calls `onExpand()` (parent enables the candidates query) then renders all `candidates`; loading → skeleton. No `any`; named exports.
- [ ] **Step 4: Run → PASS.** `npm run build`.
- [ ] **Step 5: GREP** the two files for hardcoded Turkish + inline `style={{` → must be none.
- [ ] **Step 6: Commit** — `2026-06-19 feat: Vekil aday satırı (DtmCandidate) ve ders satırı (DtmLesson) port edildi.`

---

## Task 5: DtaVekalet + wire into DutyAdminPage (replace placeholder)

**Files:** Create `components/DtaVekalet.tsx`, `__tests__/DtaVekalet.test.tsx`. Modify `DutyAdminPage.tsx`. Modify `duties.css` (`.dta-vk-daybar`/`.dta-vk-cpill`/`.dta-abs-card`/`.dta-abs-head`/`.dta-abs-reason`/`.dta-absent`).

**Interfaces:**
- `DtaVekalet({ termId, date, teachers, canManage })` — manages the **local list of selected absent teachers** (ad-hoc, K-2b-1); a day-bar with the add-absent-teacher control (teacher picker from `teachers` (useDutyContext) + reason input) and counts; one `dta-abs-card` per selected teacher fed by `useSubstitutionBoard(termId, date, teacherId, enabled)`; each card renders the teacher's lessons via `DtmLesson`, wiring `useAvailableSubstitutes` (lazy, per expanded open lesson) + `useSubstitutionMutations`. Toasts on assign/study-hall/undo.
- Consumed by `DutyAdminPage` Vekâlet tab.

- [ ] **Step 1: Failing test** — render `DtaVekalet` with mocked hooks + a `teachers` fixture; assert: empty state (`substitution.empty`) when no absent teacher added; adding a teacher via the picker shows their card; the info banner (`substitution.info.title`) renders; no availability text.
- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement** — port handoff `DtaVekalet` (day-bar + info banner + `dta-absent` list). Absent-teacher selection is local state (`useState<{teacherId,reason}[]>`); the add control is a small picker (shadcn Select/Combobox + Input) — all labels i18n. Counts (open/covered/study-hall) derived from the loaded boards. Each card: `useSubstitutionBoard` per teacherId (enabled once added). Mutations via `useSubstitutionMutations(termId, date)`; `date` = today (from `useDutyContext().today`-derived ISO or a date the page provides). Gate all write affordances on `canManage` (here `canManage` = `duties.substitute`).
- [ ] **Step 4: Wire DutyAdminPage** — replace:
```tsx
if (activeTab === "substitution") {
  return <VekaletPlaceholder />;
}
```
with a `duties.substitute`-gated render:
```tsx
if (activeTab === "substitution") {
  return canSubstitute
    ? <DtaVekalet termId={termId} date={todayIso} teachers={teachers} canManage={canSubstitute} />
    : <NoPermissionState />; // or the existing empty/permission pattern
}
```
Add `const canSubstitute = usePermission("duties.substitute");` near `canManage`. Source `todayIso` from the active date (today). Remove the `VekaletPlaceholder` import (and delete the file + its i18n keys) if no longer used. Also gate the Vekâlet **tab** visibility/enable by `canSubstitute` consistent with how the roster tab gates writes.
- [ ] **Step 5: Run tests → PASS** (DtaVekalet + DutyAdminPage existing tests still green; update the DutyAdminPage test that asserted the placeholder text — it should now assert the gated DtaVekalet shell or the permission state).
- [ ] **Step 6: GREP** touched files for hardcoded Turkish + inline `style={{` → none. `npm run build`.
- [ ] **Step 7: Commit** — `2026-06-19 feat: Vekâlet (Bugün) sekmesi — gelmeyen öğretmen + vekil öneri/atama akışı (placeholder kaldırıldı).`

---

## Task 6: Teacher view — read-only vekâlet section

**Files:** Modify `src/portals/teacher/duties/TeacherDutyPage.tsx` (+ helpers/DutyWeek if needed), tests. Modify `duties.css`/teacher css for `.tdy-*` vekâlet classes from `schedule_duty.css`.

**BE dependency / contract (CONFIRMED vs BE plan):** the teacher's substitutions come from a **dedicated** query `GET /duties/substitution/me?termId=` → `MySubstitutionDto[]` (BE plan Task 4) — consumed via `useMySubstitutions(termId)` (Task 3). This is NOT a `MyDutiesDto` extension: `MyDutyItemDto` is location-based (nöbet/yancı), whereas substitutions are class/subject/date-based, so they get their own DTO/query. `useMyDuties` (2a) stays unchanged for nöbet/yancı.

- [ ] **Step 1: Consume `useMySubstitutions(termId)`** in `TeacherDutyPage` (alongside the existing `useMyDuties`). `MySubstitutionDto` is already defined in `types.ts` (Task 2). Do NOT widen `MyDutyItemDto`.
- [ ] **Step 2: Failing test** — render `TeacherDutyPage` with a mocked `useMySubstitutions` returning one `MySubstitutionDto`; assert it appears in the "Bu haftaki vekâletlerin" section (`substitution.teacher.section`) with "{{name}} yerine" (originalTeacherName) + a **view-only** marker; assert NO approve/object button (K-2b-7) and no availability text.
- [ ] **Step 3: Run → FAIL.**
- [ ] **Step 4: Implement** — faithfully port the nöbet/yancı list/summary already present; add the vekâlet items (port `schedule_duty.jsx` vekâlet rows but **omit** the approve/object actions + `DtaObjectModal`). Vekâlet items render read-only (`substitution.teacher.viewOnly`). Summary count can include "bu hafta vekâlet" if the design's teacher summary shows it. Reuse `.tdy-*` classes; port any missing vekâlet ones from `schedule_duty.css`. All copy i18n; no `any`; `TFunction` for any `t` props.
- [ ] **Step 5: Run → PASS.** **Step 6: GREP** → no hardcoded Turkish / inline style. `npm run build`.
- [ ] **Step 7: Commit** — `2026-06-19 feat: Öğretmen görünümüne salt-okunur vekâlet bölümü eklendi (itiraz yok — 2b).`

---

## Task 7: Full suite + docs

**Files:** Modify `.claude/docs/modules/timetable/{completion_status.md,ui-flows.md}` (workspace repo).

- [ ] **Step 1:** `npm run build` (success) + `npm run test` (full). Report counts; only the ~7 known pre-existing flaky may fail — ZERO new failures, all duty tests green. If a NEW duty failure → STOP/BLOCKED.
- [ ] **Step 2:** Update docs (workspace repo): `ui-flows.md` — add the Vekâlet admin flow (absent teacher ad-hoc → suggestions → assign/study-hall/revoke) + teacher read-only vekâlet view; `completion_status.md` — Dilim 2b FE ✅, note itiraz deferral (K-2b-7) and `duties.substitute` now exercised.
- [ ] **Step 3: Commit** (workspace repo) — `2026-06-19 docs: Vekâlet (Faz 4/Dilim 2b) frontend — ui-flows + completion_status güncellendi.`

---

## Self-Review

**Spec coverage (design §6/§7):** Vekâlet admin tab (daybar + ad-hoc absent + DtaVekalet/DtmLesson/DtmCandidate) → Tasks 4-5 ✓; suggestions ranked by fit+load with badges → Tasks 2,4 (data from BE) ✓; assign/study-hall/revoke → Tasks 3-5 ✓; teacher read-only vekâlet (no itiraz, K-2b-7) → Task 6 ✓; permission gate `duties.substitute` → Task 5 ✓; i18n → Task 1 ✓; tests every task ✓.

**Constraint guards:** every task ends with a hardcoded-Turkish + inline-style grep (2a's recurring leak). K-2a-2 (no availability) asserted in Tasks 4,5,6 tests. No `any`, named exports, tenant-scoped keys throughout.

**Type consistency (RECONCILED vs BE plan):** `SubstituteCandidateDto`, `SubstitutionLessonDto` (incl. `programId`/`time`/`room`/`substituteId`/`substituteName`/`substituteBranch`), `AbsentTeacherBoardDto` (= BE `SubstitutionBoardDto`: `absentTeacherId/Name/Branch`, `date`, `lessons`), `MySubstitutionDto`, and the bodies all match the BE plan field names/casing. `BranchFit` is emitted by BE as **int**, mapped to the string union in `dutiesApi.getAvailableSubstitutes`.

**Resolved cross-plan decisions:**
1. **`BranchFit` serialization** — BE emits int 0/1/2; FE maps via `BRANCH_FIT_BY_INT` in `dutiesApi` (Task 2). ✓
2. **Teacher-view substitution source** — dedicated BE query `GET /duties/substitution/me` → `MySubstitutionDto[]` (BE plan Task 4), consumed via `useMySubstitutions` (Task 3); NOT a `MyDutiesDto` extension. ✓
3. **`SubstitutionBoardDto` granularity** — assumed one `AbsentTeacherBoardDto` per `(date, teacherId)` (ad-hoc, FE keeps the selected-teacher list locally). Matches design AS-2b-1; confirm BE returns per-teacher board.
4. **`programId` for candidates** — each lesson row carries its `programId` (the absent teacher's class program for that lesson), passed to the candidates query (design AS-2b-2).
5. **Date** — board/mutations use "today" (ISO) from the page; a date picker is out of scope for 2b (ad-hoc, today-focused per handoff). If past-date substitution is needed, add a date control later.

---

## Execution Handoff
Frontend plan complete. Recommended order: **BE plan first** (provides board/candidates/create/study-hall/revoke + my-duties substitution extension) → **FE Tasks 1-3** (plumbing) → **FE 4-5** (admin) → **FE 6** (teacher) → **FE 7** (docs). Sequence the BE before FE 4-6 (they consume the contract).
