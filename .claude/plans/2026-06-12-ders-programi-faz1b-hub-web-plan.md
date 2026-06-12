# Ders Programı Faz 1B — Admin Hub (Web) Implementation Plan

> **For agentic workers:** Inline TDD execution by the active session. Steps use checkbox (`- [ ]`) syntax. Tasarım dokümanı: `2026-06-12-ders-programi-faz1b-hub-web.md`. Bağlayıcı spec: `.claude/specs/ders-programi-modulu-spec.md`.

**Goal:** `/admin/schedule` rotasında, gerçek `/api/v1/timetable` API'sine bağlı, spec §9.1 uyumlu Admin Hub ekranı (Sınıf merceği) — eski `ScheduleManagement.tsx`'in yerine.

**Architecture:** subjects/classrooms modül deseni (`src/portals/admin/timetable/`). Server state React Query (tenant-scoped key), URL state React Router `useSearchParams`. BranchId→sınıf adı/kademe classrooms join'inden; dönem academic-sessions'tan. Faz 2/3 öğeleri disabled + "Yakında".

**Tech Stack:** React + TS · @tanstack/react-query · react-router · httpClient (axios) · vitest + Testing Library · ported CSS (`timetable.css`).

---

## Dosya yapısı

```
src/portals/admin/timetable/
  ScheduleHubPage.tsx · types.ts · index.ts · timetable.css
  api/timetableApi.ts · keys/timetableKeys.ts
  hooks/useHubData.ts · hooks/useProgramMutations.ts
  lib/derive.ts
  components/ SummaryStrip.tsx · LensTabs.tsx · ClassProgramsTable.tsx · HubToolbar.tsx
             StatusDot.tsx · NewProgramModal.tsx · RowMenu.tsx · states/EmptyState.tsx
  __tests__/ derive.test.ts · ScheduleHubPage.test.tsx · NewProgramModal.test.tsx
```
Modify: `src/app/routes.tsx` (yeni `ScheduleHubPage`, eski `ScheduleManagement` importu kaldır). `src/app/pages/admin/ScheduleManagement.tsx` → sil.

---

### Task 1: types + keys + api iskeleti (kırmızı→yeşil yok, derleme temeli)

**Files:** Create `types.ts`, `keys/timetableKeys.ts`, `api/timetableApi.ts`.

- [ ] **types.ts** — backend DTO yansımaları + Hub view-modeli:
```ts
export type ScheduleProgramStatus = "Draft" | "Revising" | "Published";
export interface ClassProgramListItemDto {
  id: string; academicTermId: string; branchId: string;
  status: ScheduleProgramStatus; placementCount: number;
}
export interface HubSummaryDto { totalPrograms: number; draftCount: number; publishedCount: number; }
export interface CreateProgramInput { academicYearId: string; academicTermId: string; branchId: string; }
/** Branch (classrooms) join'iyle zenginleşmiş Hub satırı. */
export interface ProgramRowVM extends ClassProgramListItemDto {
  className: string;      // "9-A" (join yoksa kısa id fallback)
  gradeLevel: number | null;
}
```
- [ ] **keys/timetableKeys.ts** — `tenantScopedKey` ile:
```ts
import { tenantScopedKey } from "../../../../shared/config/tenant";
export const timetableKeys = {
  all: (s?: string | null) => tenantScopedKey(s, ["timetable"] as const),
  programs: (s: string | null | undefined, termId: string | null, page: number) =>
    tenantScopedKey(s, ["timetable", "programs", termId ?? "all", page] as const),
  summary: (s: string | null | undefined, termId: string | null) =>
    tenantScopedKey(s, ["timetable", "summary", termId ?? "all"] as const),
};
```
- [ ] **api/timetableApi.ts** — httpClient (rooms.queries deseni, `ApiEnvelope<T> = { data: T }`):
```ts
import { httpClient } from "../../../../shared/api/httpClient";
import type { ClassProgramListItemDto, HubSummaryDto, CreateProgramInput } from "../types";
interface ApiEnvelope<T> { data: T; }
const qs = (termId: string | null, page?: number) => {
  const p = new URLSearchParams();
  if (termId) p.set("termId", termId);
  if (page) p.set("page", String(page));
  const s = p.toString(); return s ? `?${s}` : "";
};
export const timetableApi = {
  listPrograms: async (termId: string | null, page = 1, signal?: AbortSignal) =>
    (await httpClient.get<ApiEnvelope<ClassProgramListItemDto[]>>(`/timetable/programs${qs(termId, page)}`, { signal })).data.data,
  getSummary: async (termId: string | null, signal?: AbortSignal) =>
    (await httpClient.get<ApiEnvelope<HubSummaryDto>>(`/timetable/summary${qs(termId)}`, { signal })).data.data,
  createProgram: async (input: CreateProgramInput) =>
    (await httpClient.post<ApiEnvelope<string>>(`/timetable/programs`, input)).data.data,
};
```
> Not: httpClient baseURL'i `/api/v1` öneki içeriyor mu — implementasyonda `rooms.queries.ts`'in `/rooms` çağrısına bakıp doğrula (orada `/rooms` kullanılıyor → baseURL `/api/v1` dahil; biz `/timetable/...` kullanırız).
- [ ] **Commit:** `2026-06-12 feat: timetable Hub veri katmanı iskeleti (types+keys+api).`

---

### Task 2: derive.ts — saf join/filtre fonksiyonları (TDD)

**Files:** Create `lib/derive.ts`, Test `__tests__/derive.test.ts`.

- [ ] **Step 1 — Failing test** (`derive.test.ts`): join + filtre + arama (tr-locale):
```ts
import { describe, it, expect } from "vitest";
import { joinPrograms, filterRows } from "../lib/derive";
const branches = [{ id: "b1", name: "9-A", gradeLevel: 9 }, { id: "b2", name: "10-B", gradeLevel: 10 }];
const programs = [
  { id: "p1", academicTermId: "t", branchId: "b1", status: "Draft" as const, placementCount: 12 },
  { id: "p2", academicTermId: "t", branchId: "b2", status: "Published" as const, placementCount: 30 },
];
it("BranchId'yi sınıf adı/kademeye bağlar", () => {
  const rows = joinPrograms(programs, branches);
  expect(rows[0]).toMatchObject({ className: "9-A", gradeLevel: 9 });
});
it("bilinmeyen branch'te kısa-id fallback", () => {
  const rows = joinPrograms([{ ...programs[0], branchId: "x" }], branches);
  expect(rows[0].className).toBe("x".slice(0, 8));
});
it("kademe + durum + arama filtreler (tr)", () => {
  const rows = joinPrograms(programs, branches);
  expect(filterRows(rows, { q: "", levels: [9], status: "" }).map(r => r.id)).toEqual(["p1"]);
  expect(filterRows(rows, { q: "", levels: [], status: "Published" }).map(r => r.id)).toEqual(["p2"]);
  expect(filterRows(rows, { q: "10-b", levels: [], status: "" }).map(r => r.id)).toEqual(["p2"]);
});
```
- [ ] **Step 2 — Run, expect fail** (`npm run test -- derive`): FAIL (modül yok).
- [ ] **Step 3 — Implement** `lib/derive.ts`:
```ts
import type { ClassProgramListItemDto, ProgramRowVM } from "../types";
interface BranchLite { id: string; name: string; gradeLevel: number | null; }
export interface RowFilter { q: string; levels: number[]; status: string; }
export function joinPrograms(programs: ClassProgramListItemDto[], branches: BranchLite[]): ProgramRowVM[] {
  const byId = new Map(branches.map((b) => [b.id, b]));
  return programs.map((p) => {
    const b = byId.get(p.branchId);
    return { ...p, className: b?.name ?? p.branchId.slice(0, 8), gradeLevel: b?.gradeLevel ?? null };
  });
}
export function filterRows(rows: ProgramRowVM[], f: RowFilter): ProgramRowVM[] {
  const needle = f.q.toLocaleLowerCase("tr");
  return rows.filter((r) => {
    if (f.levels.length && (r.gradeLevel === null || !f.levels.includes(r.gradeLevel))) return false;
    if (f.status && r.status !== f.status) return false;
    if (needle && !r.className.toLocaleLowerCase("tr").includes(needle)) return false;
    return true;
  });
}
```
- [ ] **Step 4 — Run, expect pass.**
- [ ] **Step 5 — Commit:** `2026-06-12 feat,test: Hub join+filtre saf fonksiyonları (derive).`

---

### Task 3: data hook'ları (programs + summary + branch/term join)

**Files:** Create `hooks/useHubData.ts`, `hooks/useProgramMutations.ts`.

- [ ] **useHubData.ts** — aktif dönem + branch listesi + programs + summary; React Query, `enabled: Boolean(schoolId)`, key tenant-scoped. Dönem/sezon kaynağı: academic-sessions `useSeasonsQuery`/aktif sezon + classrooms `useSectionsQuery(sessionId)` (implementasyonda academicSessionsApi okunup termId↔sessionId netleştirilecek; aktif dönem yoksa `termId=null` → tüm programlar). Branch listesini `{id,name,gradeLevel}` lite'a indir; `joinPrograms` ile birleştir; `loading/error/rows/summary` döndür.
- [ ] **useProgramMutations.ts** — `useCreateProgram()` → `timetableApi.createProgram`, başarıda `queryClient.invalidateQueries({ queryKey: timetableKeys.all(schoolId) })`.
- [ ] **Commit:** `2026-06-12 feat: Hub veri hook'ları — programs/summary + branch join + create mutation.`

---

### Task 4: sunum bileşenleri (StatusDot, SummaryStrip, LensTabs, RowMenu, HubToolbar, EmptyState)

**Files:** Create ilgili `components/*.tsx`. `schedule.jsx`/`schedule.css` görselinden uyarlanır; `timetable.css`'e gerekli `sch-*` sınıfları portlanır (paylaşılan `.stu*/.btn*/.modal*` yeniden kullanılır).

- [ ] **StatusDot.tsx** — Draft/Revising/Published rozet (Taslak/Revize/Yayın).
- [ ] **LensTabs.tsx** — Sınıf (aktif) · Öğretmen · Derslik (`disabled` + `title="Yakında · Faz 2"`).
- [ ] **SummaryStrip.tsx** — Yayında/Taslak (summary DTO). Çakışma/Eksik **render edilmez** (Debt-FE-1).
- [ ] **HubToolbar.tsx** — arama input + kademe chip'leri + durum filtresi; değerler prop, değişim callback (URL state üst bileşende).
- [ ] **RowMenu.tsx** — "Editörde Aç" (aktif) + "Yayınla/Çoğalt/PDF" (`disabled` "Yakında").
- [ ] **states/EmptyState.tsx** — boş (CTA) + sonuç-yok varyantları.
- [ ] **Commit:** `2026-06-12 feat: Hub sunum bileşenleri (durum/sekme/özet/araç çubuğu/menü/boş durum).`

---

### Task 5: ClassProgramsTable + NewProgramModal (modal TDD)

**Files:** Create `ClassProgramsTable.tsx`, `NewProgramModal.tsx`, Test `__tests__/NewProgramModal.test.tsx`.

- [ ] **ClassProgramsTable.tsx** — kolonlar: Sınıf/Şube · Kademe · Durum · Yerleşim (`placementCount`) · aksiyon (Aç + RowMenu). Satır tıklama → `onOpen(row)`.
- [ ] **NewProgramModal test (failing):** sınıf seç → "Editöre Geç" `onCreate(branchId)` çağırır; seçim yokken buton disabled.
- [ ] **NewProgramModal.tsx** — şube listesi (programsız olanlar önce), seçim, disabled-gate; paylaşılan `Modal` deseni.
- [ ] **Run tests → pass. Commit:** `2026-06-12 feat,test: Hub tablo + Yeni Program modalı.`

---

### Task 6: ScheduleHubPage + URL state + durum varyantları (TDD)

**Files:** Create `ScheduleHubPage.tsx`, `index.ts`, Test `__tests__/ScheduleHubPage.test.tsx`.

- [ ] **Test (failing):** `useHubData` mock'lanarak — (a) loading→skeleton, (b) error→ProblemDetails mesajı, (c) boş→CTA, (d) dolu→satırlar; arama yazınca `useSearchParams`'a `q` yazılır.
- [ ] **ScheduleHubPage.tsx** — `useSearchParams` ile `q/levels/status/page`; `useHubData`; `filterRows`; PageHeader + aksiyonlar (Yeni Program aktif, Otomatik Oluştur disabled "Yakında · Faz 3"); SummaryStrip + LensTabs + HubToolbar + ClassProgramsTable + EmptyState; "Yeni Program"→modal→`useCreateProgram`→`navigate('/admin/schedule/'+id+'/edit')`.
- [ ] **index.ts:** `export { ScheduleHubPage } from "./ScheduleHubPage";`
- [ ] **Run tests → pass. Commit:** `2026-06-12 feat,test: ScheduleHubPage — URL state + dört durum varyantı.`

---

### Task 7: routing + editör seam placeholder + eski sayfa temizliği

**Files:** Modify `src/app/routes.tsx`; Create `src/portals/admin/timetable/ScheduleEditorPlaceholder.tsx`; Delete `src/app/pages/admin/ScheduleManagement.tsx`.

- [ ] `routes.tsx`: `import { ScheduleHubPage } from "../../portals/admin/timetable"`; `{ path: "schedule", Component: ScheduleHubPage }`; yeni `{ path: "schedule/:id/edit", Component: ScheduleEditorPlaceholder }`; eski `ScheduleManagement` importu + satırı kaldır. (Eski `schedule-builder`/`ScheduleBuilder` route'u dokunmadan bırak — sonraki oturum editörle değişecek.)
- [ ] **ScheduleEditorPlaceholder.tsx** — "Program Editörü · Yapım aşamasında (Faz 1B-2)" + Hub'a dönüş; programId'yi gösterir.
- [ ] `ScheduleManagement.tsx` sil.
- [ ] **Run `npm run build` → temiz; tüm testler yeşil. Commit:** `2026-06-12 feat: /admin/schedule yeni Hub'a bağlandı; editör seam placeholder; eski sayfa kaldırıldı.`

---

### Task 8: dokümantasyon + Debt kaydı

**Files:** Modify `.claude/docs/modules/timetable/completion_status.md` (+ gerekiyorsa `ui-flows.md`).

- [ ] completion_status: ilerleme yüzdesi + ✅/⏳ taşıma + **Debt-FE-1** (Hub çakışma/eksik rozeti yok — DTO zenginleştirme Faz 2) + **Debt-FE-2** (sürüm/son-güncelleme kolonları yok).
- [ ] **Commit:** `2026-06-12 docs: timetable completion_status — Faz 1B Hub + FE Debt kayıtları.`

---

## Self-review notları
- Spec §9.1 Hub gereksinimleri (liste, durum, filtre, URL params, 4 varyant) → Task 5/6 karşılar. Çakışma/eksik rozeti → Debt (§11 bağlayıcı kabulde yok).
- Tenant kuralı: tüm key'ler `tenantScopedKey` (Task 1/3).
- Kütüphane eklenmiyor (dnd-kit editör oturumunda); gerçek API rooms desenini izliyor.
- termId↔sessionId eşlemesi Task 3'te academicSessionsApi okunarak netleştirilecek (tek açık nokta — implementasyonda çözülür, plan akışını tıkamaz).
