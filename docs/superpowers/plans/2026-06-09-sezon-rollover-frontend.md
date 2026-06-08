# Sezon Yönetimi Sihirbazı (Frontend) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** oksis-web admin portalında 6 adımlı **Sezon Yönetimi sihirbazını** kurmak — sunucu taraflı taslak (SeasonDraft) ile, önceki sezondan kopyalayarak yeni sezonu "Sezonu Aç" ile Setup olarak oluşturan akış.

**Architecture:** `src/portals/admin/academic-sessions/` modülüne eklenir. Veri katmanı: axios `httpClient` + React Query (tenant-scoped keys). Form: tek bir RHF + Zod form (`useForm`) tüm sihirbaz state'ini taşır; adımlar bu formun alanlarını okur/yazar. Taslak kalıcılığı **backend** `/season-drafts/current` (Save/Get/Delete) ile — `localStorage` YOK. "Sezonu Aç" → `POST /academic-sessions/open-from-draft` → başarı ekranı. Düzen: kalıcı **stepper** (üst yatay adım çubuğu) + tam genişlik panel.

**Tech Stack:** React + Vite + TypeScript · shadcn/ui (Radix) + Tailwind · TanStack React Query · React Hook Form + Zod · axios · i18next · sonner (toast) · Vitest + Testing Library + MSW.

**Tasarım kaynağı:** Handoff `seasonwizard.jsx`/`seasonwizard.css` + `README.md` (Ekran 2). Backend tasarımı: `docs/superpowers/specs/2026-06-08-sezon-rollover-design.md`. Backend uçları HAZIR (`api-contracts.md` → "Sezon Rollover (Sihirbaz)").

**Kapsam:** Yalnızca sihirbaz (Sezonu Aç'a kadar). "Aktifleştir" (`activate-rollover`) ve Akademik Takvim ekranı (Ekran 1) bu planın DIŞINDA.

---

## Mevcut pattern referansları (uygulamadan önce OKU)
- API: `src/portals/admin/academic-sessions/api/academicSessionsApi.ts` (`httpClient`, `ApiEnvelope<T>`, `unwrap`).
- Query keys: `.../hooks/queryKeys.ts` (`tenantPrefix()` → `tenant:{schoolId}:` zorunlu).
- Hooks: `.../hooks/useAcademicSessionsQuery.ts` (useQuery/useMutation + `invalidateQueries`).
- Schema: `.../schemas/academicSessionSchema.ts` + testi `.../schemas/__tests__/`.
- Types: `.../types/index.ts` (DTO'lar backend ile birebir).
- Component testi (MSW + RTL + authStore seed): `.../components/__tests__/SchoolHolidaysPanel.test.tsx`.
- Route kaydı: `src/app/routes.tsx` (admin children, satır ~230 `academic-sessions`).
- i18n kaydı: `src/shared/i18n/index.ts` (ns listesi + tr/en locale import) ve `src/shared/i18n/locales/{tr,en}/academic-sessions.json`.
- Brand token/stil: handoff `brand.css` (accent lacivert `#1B2B5E`, gradient, radius). Tailwind config token'larıyla eşleştir; mevcut bileşenlerdeki sınıf kullanımını taklit et.

**Genel kurallar:** Server state yalnız React Query'de. Hardcoded Türkçe YOK → i18n key. Tüm query key'leri tenant-prefix taşır. Her task sonunda `npm run test -- <ilgili>` yeşil + `npm run build` temiz. Commit (OKSİS): `2026-06-09 <type>: Türkçe özet.` + `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. Çalışma dizini: `oksis-web/`.

**Bağımlılık sırası:** T1 (tipler+api+hooks) → T2 (schema) → T3 (primitives) → T4–T8 (adımlar, T3'e bağlı, aralarında paralel) → T9 (sayfa orkestrasyonu + route + i18n, hepsine bağlı).

---

## Task 1: Veri katmanı — tipler, API, query keys, hooks

**Files:**
- Modify: `src/portals/admin/academic-sessions/types/index.ts` (yeni tipler ekle)
- Create: `src/portals/admin/academic-sessions/api/seasonDraftApi.ts`
- Modify: `src/portals/admin/academic-sessions/hooks/queryKeys.ts`
- Create: `src/portals/admin/academic-sessions/hooks/useSeasonWizard.ts`
- Test: `src/portals/admin/academic-sessions/hooks/__tests__/useSeasonWizard.test.tsx`

- [ ] **Step 1: Tipleri ekle** — `types/index.ts` sonuna:

```ts
// ── Sezon Rollover Sihirbazı (backend: api-contracts "Sezon Rollover") ──
export interface SeasonDraftDto {
  id: string;
  name: string;
  sourceSessionId: string;
  currentStep: number;
  copyTerms: boolean;
  copyBranches: boolean;
  copyHolidays: boolean;
  copyAssignments: boolean;
  copySchedule: boolean;
  excludePassiveStudents: boolean;
  termDatesJson: string | null;
  branchMapJson: string | null;
  holidaysJson: string | null;
}

export type RolloverRowKind = 'Promote' | 'Graduate' | 'NewBranch';

export interface SeasonRolloverPreviewRowDto {
  sourceClassRoomId: string | null;
  fromLabel: string;
  studentCount: number;
  toGradeLevelId: string | null;
  toSection: string | null;
  kind: RolloverRowKind;
}

export interface SeasonRolloverSummaryDto {
  promotedBranches: number;
  graduatingStudents: number;
  newBottomBranches: number;
}

export interface SeasonRolloverPreviewDto {
  rows: SeasonRolloverPreviewRowDto[];
  summary: SeasonRolloverSummaryDto;
}
```

- [ ] **Step 2: Failing hook test** — `hooks/__tests__/useSeasonWizard.test.tsx`

```tsx
import { describe, expect, it, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { server } from '../../../../../test/mswServer';
import { useAuthStore } from '../../../../../shared/store/authStore';
import { UserRole } from '../../../../../modules/identity/types/user.types';
import { ADMIN_PERMISSIONS } from '../../../../../test/authFixtures';
import { useSeasonDraftQuery, useSaveSeasonDraftMutation } from '../useSeasonWizard';

const wrapper = ({ children }: { children: ReactNode }) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
};

beforeEach(() => {
  useAuthStore.setState({
    user: { id: 'u1', schoolId: 'school-1', firstName: 'T', lastName: 'U', email: 'a@b.c',
      role: UserRole.SchoolAdmin, firstLoginRequired: false, permissions: ADMIN_PERMISSIONS },
    accessToken: 'jwt', firstLoginRequired: false,
  });
});

describe('useSeasonWizard', () => {
  it('loads the current draft', async () => {
    server.use(
      http.get('*/season-drafts/current', () =>
        HttpResponse.json({ data: { id: 'd1', name: '2026-2027', sourceSessionId: 's1',
          currentStep: 2, copyTerms: true, copyBranches: true, copyHolidays: true,
          copyAssignments: true, copySchedule: true, excludePassiveStudents: true,
          termDatesJson: null, branchMapJson: null, holidaysJson: null } })),
    );
    const { result } = renderHook(() => useSeasonDraftQuery(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.currentStep).toBe(2);
  });

  it('saves (upserts) a draft', async () => {
    let received: unknown = null;
    server.use(
      http.put('*/season-drafts/current', async ({ request }) => {
        received = await request.json();
        return HttpResponse.json({ data: 'd1' });
      }),
    );
    const { result } = renderHook(() => useSaveSeasonDraftMutation(), { wrapper });
    await result.current.mutateAsync({
      name: '2026-2027', sourceSessionId: 's1', currentStep: 3,
      copyTerms: true, copyBranches: false, copyHolidays: true, copyAssignments: true,
      copySchedule: true, excludePassiveStudents: false,
      termDatesJson: null, branchMapJson: null, holidaysJson: null,
    });
    expect((received as { currentStep: number }).currentStep).toBe(3);
  });
});
```

- [ ] **Step 3: Run → FAIL**

Run: `npm run test -- useSeasonWizard`
Expected: FAIL (module `useSeasonWizard` yok).

- [ ] **Step 4: API katmanı** — `api/seasonDraftApi.ts`

```ts
import { httpClient } from '../../../../shared/api/httpClient';
import type { SeasonDraftDto, SeasonRolloverPreviewDto } from '../types';

interface ApiEnvelope<T> { data: T; errors?: Array<{ code: string; message: string }> | null; }
const unwrap = <T,>(e: ApiEnvelope<T>): T => e.data;

export interface SaveSeasonDraftInput {
  name: string;
  sourceSessionId: string;
  currentStep: number;
  copyTerms: boolean;
  copyBranches: boolean;
  copyHolidays: boolean;
  copyAssignments: boolean;
  copySchedule: boolean;
  excludePassiveStudents: boolean;
  termDatesJson: string | null;
  branchMapJson: string | null;
  holidaysJson: string | null;
}

export const seasonDraftApi = {
  get: async (): Promise<SeasonDraftDto | null> => {
    const res = await httpClient.get<ApiEnvelope<SeasonDraftDto | null>>('/season-drafts/current');
    return unwrap(res.data);
  },
  save: async (input: SaveSeasonDraftInput): Promise<string> => {
    const res = await httpClient.put<ApiEnvelope<string>>('/season-drafts/current', input);
    return unwrap(res.data);
  },
  delete: async (): Promise<void> => {
    await httpClient.delete('/season-drafts/current');
  },
  rolloverPreview: async (sourceSessionId: string): Promise<SeasonRolloverPreviewDto> => {
    const res = await httpClient.get<ApiEnvelope<SeasonRolloverPreviewDto>>(
      `/academic-sessions/${sourceSessionId}/rollover-preview`,
    );
    return unwrap(res.data);
  },
  openFromDraft: async (): Promise<{ id: string; status: string }> => {
    const res = await httpClient.post<ApiEnvelope<{ id: string; status: string }>>(
      '/academic-sessions/open-from-draft', {},
    );
    return unwrap(res.data);
  },
};
```

- [ ] **Step 5: Query keys** — `hooks/queryKeys.ts` sonuna ekle:

```ts
export const seasonWizardKeys = {
  all: () => [...tenantPrefix(), 'season-wizard'] as const,
  draft: () => [...seasonWizardKeys.all(), 'draft'] as const,
  rolloverPreview: (sourceSessionId: string) =>
    [...seasonWizardKeys.all(), 'rollover-preview', sourceSessionId] as const,
};
```

- [ ] **Step 6: Hooks** — `hooks/useSeasonWizard.ts`

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { seasonDraftApi, type SaveSeasonDraftInput } from '../api/seasonDraftApi';
import { seasonWizardKeys, academicSessionsKeys } from './queryKeys';

export const useSeasonDraftQuery = () =>
  useQuery({
    queryKey: seasonWizardKeys.draft(),
    queryFn: () => seasonDraftApi.get(),
    retry: false,
  });

export const useRolloverPreviewQuery = (sourceSessionId: string | undefined) =>
  useQuery({
    queryKey: seasonWizardKeys.rolloverPreview(sourceSessionId ?? ''),
    queryFn: () => seasonDraftApi.rolloverPreview(sourceSessionId!),
    enabled: !!sourceSessionId,
  });

export const useSaveSeasonDraftMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SaveSeasonDraftInput) => seasonDraftApi.save(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: seasonWizardKeys.draft() }),
  });
};

export const useDeleteSeasonDraftMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => seasonDraftApi.delete(),
    onSuccess: () => qc.invalidateQueries({ queryKey: seasonWizardKeys.draft() }),
  });
};

export const useOpenSeasonFromDraftMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => seasonDraftApi.openFromDraft(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: seasonWizardKeys.draft() });
      qc.invalidateQueries({ queryKey: academicSessionsKeys.all() });
    },
  });
};
```

- [ ] **Step 7: Run → PASS**

Run: `npm run test -- useSeasonWizard`
Expected: PASS (2 tests).

- [ ] **Step 8: Commit**

```bash
git add src/portals/admin/academic-sessions/types/index.ts \
        src/portals/admin/academic-sessions/api/seasonDraftApi.ts \
        src/portals/admin/academic-sessions/hooks/queryKeys.ts \
        src/portals/admin/academic-sessions/hooks/useSeasonWizard.ts \
        src/portals/admin/academic-sessions/hooks/__tests__/useSeasonWizard.test.tsx
git commit -m "$(printf '2026-06-09 feat: sezon sihirbazı veri katmanı (tipler, API, hooks) eklendi.\n\nCo-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>')"
```

---

## Task 2: Wizard form şeması (Zod) + term-date / branch-map serileştirme

**Files:**
- Create: `src/portals/admin/academic-sessions/schemas/seasonWizardSchema.ts`
- Test: `src/portals/admin/academic-sessions/schemas/__tests__/seasonWizardSchema.test.ts`

Sihirbaz tek bir RHF form değeri taşır. Backend `termDatesJson`/`branchMapJson` JSON string saklar; bu task form değerini ↔ `SaveSeasonDraftInput` JSON'larına çeviren saf yardımcıları da tanımlar.

- [ ] **Step 1: Failing test** — `schemas/__tests__/seasonWizardSchema.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import {
  seasonWizardSchema, toSaveDraftInput, fromDraftDto,
  type SeasonWizardForm,
} from '../seasonWizardSchema';

const base: SeasonWizardForm = {
  name: '2026-2027', sourceSessionId: 's1',
  copy: { terms: true, branches: true, holidays: true, assignments: true, schedule: true },
  excludePassiveStudents: true,
  terms: { t1Start: '2026-09-07', t1End: '2027-01-22', t2Start: '2027-02-08', t2End: '2027-06-25' },
  sessionStart: '2026-09-07', sessionEnd: '2027-06-25',
  branchMap: [],
  holidays: [],
};

describe('seasonWizardSchema', () => {
  it('accepts a valid wizard form', () => {
    expect(seasonWizardSchema.safeParse(base).success).toBe(true);
  });

  it('rejects name not matching YYYY-YYYY', () => {
    const r = seasonWizardSchema.safeParse({ ...base, name: 'bad' });
    expect(r.success).toBe(false);
  });

  it('toSaveDraftInput serializes term dates + branch map to JSON', () => {
    const input = toSaveDraftInput(base, 3);
    expect(input.currentStep).toBe(3);
    expect(input.copyBranches).toBe(true);
    expect(JSON.parse(input.termDatesJson!)).toMatchObject({ T1Start: '2026-09-07' });
  });

  it('fromDraftDto rehydrates a form from a persisted draft', () => {
    const input = toSaveDraftInput(base, 2);
    const form = fromDraftDto({
      id: 'd1', name: '2026-2027', sourceSessionId: 's1', currentStep: 2,
      copyTerms: true, copyBranches: false, copyHolidays: true, copyAssignments: true,
      copySchedule: true, excludePassiveStudents: false,
      termDatesJson: input.termDatesJson, branchMapJson: '[]', holidaysJson: null,
    });
    expect(form.copy.branches).toBe(false);
    expect(form.excludePassiveStudents).toBe(false);
    expect(form.terms.t1Start).toBe('2026-09-07');
  });
});
```

- [ ] **Step 2: Run → FAIL**

Run: `npm run test -- seasonWizardSchema`
Expected: FAIL (modül yok).

- [ ] **Step 3: Schema + helpers** — `schemas/seasonWizardSchema.ts`

```ts
import { z } from 'zod';
import type { SeasonDraftDto } from '../types';
import type { SaveSeasonDraftInput } from '../api/seasonDraftApi';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'wizard.errors.date-format');

export const branchMapEntrySchema = z.object({
  sourceClassRoomId: z.string().nullable(),
  toGradeLevelId: z.string().nullable(),
  toSection: z.string().nullable(),
  capacity: z.number().int().min(1).max(100),
  kind: z.enum(['Promote', 'Graduate', 'NewBranch']),
});

export const holidayEntrySchema = z.object({
  name: z.string().min(1),
  startDate: isoDate,
  endDate: isoDate.nullable(),
});

export const seasonWizardSchema = z.object({
  name: z.string().regex(/^\d{4}-\d{4}$/, 'wizard.errors.name-format'),
  sourceSessionId: z.string().min(1, 'wizard.errors.source-required'),
  copy: z.object({
    terms: z.boolean(), branches: z.boolean(), holidays: z.boolean(),
    assignments: z.boolean(), schedule: z.boolean(),
  }),
  excludePassiveStudents: z.boolean(),
  sessionStart: isoDate,
  sessionEnd: isoDate,
  terms: z.object({ t1Start: isoDate, t1End: isoDate, t2Start: isoDate, t2End: isoDate }),
  branchMap: z.array(branchMapEntrySchema),
  holidays: z.array(holidayEntrySchema),
});

export type SeasonWizardForm = z.infer<typeof seasonWizardSchema>;
export type BranchMapEntryForm = z.infer<typeof branchMapEntrySchema>;
export type HolidayEntryForm = z.infer<typeof holidayEntrySchema>;

/** Backend TermDates JSON şekli (PascalCase — System.Text.Json record alanlarıyla eşleşir). */
interface TermDatesJsonShape {
  Start: string; End: string;
  T1Start: string; T1End: string; T2Start: string; T2End: string;
}

export function toSaveDraftInput(form: SeasonWizardForm, currentStep: number): SaveSeasonDraftInput {
  const termDates: TermDatesJsonShape = {
    Start: form.sessionStart, End: form.sessionEnd,
    T1Start: form.terms.t1Start, T1End: form.terms.t1End,
    T2Start: form.terms.t2Start, T2End: form.terms.t2End,
  };
  return {
    name: form.name,
    sourceSessionId: form.sourceSessionId,
    currentStep,
    copyTerms: form.copy.terms,
    copyBranches: form.copy.branches,
    copyHolidays: form.copy.holidays,
    copyAssignments: form.copy.assignments,
    copySchedule: form.copy.schedule,
    excludePassiveStudents: form.excludePassiveStudents,
    termDatesJson: JSON.stringify(termDates),
    branchMapJson: JSON.stringify(
      form.branchMap.map((b) => ({
        SourceClassRoomId: b.sourceClassRoomId,
        ToGradeLevelId: b.toGradeLevelId,
        ToSection: b.toSection,
        Capacity: b.capacity,
        Kind: b.kind,
      })),
    ),
    holidaysJson: form.holidays.length ? JSON.stringify(form.holidays) : null,
  };
}

export function fromDraftDto(d: SeasonDraftDto): SeasonWizardForm {
  let td: Partial<TermDatesJsonShape> = {};
  try { td = d.termDatesJson ? (JSON.parse(d.termDatesJson) as TermDatesJsonShape) : {}; } catch { td = {}; }
  let branchMap: BranchMapEntryForm[] = [];
  try {
    branchMap = d.branchMapJson
      ? (JSON.parse(d.branchMapJson) as Array<Record<string, unknown>>).map((b) => ({
          sourceClassRoomId: (b.SourceClassRoomId as string | null) ?? null,
          toGradeLevelId: (b.ToGradeLevelId as string | null) ?? null,
          toSection: (b.ToSection as string | null) ?? null,
          capacity: (b.Capacity as number) ?? 30,
          kind: (b.Kind as BranchMapEntryForm['kind']) ?? 'Promote',
        }))
      : [];
  } catch { branchMap = []; }
  let holidays: HolidayEntryForm[] = [];
  try { holidays = d.holidaysJson ? (JSON.parse(d.holidaysJson) as HolidayEntryForm[]) : []; } catch { holidays = []; }

  return {
    name: d.name,
    sourceSessionId: d.sourceSessionId,
    copy: {
      terms: d.copyTerms, branches: d.copyBranches, holidays: d.copyHolidays,
      assignments: d.copyAssignments, schedule: d.copySchedule,
    },
    excludePassiveStudents: d.excludePassiveStudents,
    sessionStart: td.Start ?? '',
    sessionEnd: td.End ?? '',
    terms: {
      t1Start: td.T1Start ?? '', t1End: td.T1End ?? '',
      t2Start: td.T2Start ?? '', t2End: td.T2End ?? '',
    },
    branchMap,
    holidays,
  };
}
```

- [ ] **Step 4: Run → PASS**

Run: `npm run test -- seasonWizardSchema`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/portals/admin/academic-sessions/schemas/seasonWizardSchema.ts \
        src/portals/admin/academic-sessions/schemas/__tests__/seasonWizardSchema.test.ts
git commit -m "$(printf '2026-06-09 feat: sezon sihirbazı Zod şeması ve taslak serileştirme yardımcıları eklendi.\n\nCo-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>')"
```

---

## Task 3: Wizard primitifleri — Stepper, WizSwitch, SeasonFlowStrip

**Files:**
- Create: `src/portals/admin/academic-sessions/components/wizard/WizardStepper.tsx`
- Create: `src/portals/admin/academic-sessions/components/wizard/WizSwitch.tsx`
- Create: `src/portals/admin/academic-sessions/components/wizard/SeasonFlowStrip.tsx`
- Create: `src/portals/admin/academic-sessions/components/wizard/wizardSteps.ts`
- Test: `src/portals/admin/academic-sessions/components/wizard/__tests__/WizardStepper.test.tsx`

Handoff `seasonwizard.jsx` `.wiz-stepper` / `WSwitch` / `.season-flow` referans. shadcn yoksa Radix `Switch`'i kullan; mevcut `components/ui/*` altında `switch` var mı kontrol et, varsa onu sar.

- [ ] **Step 1: Adım tanımları** — `wizard/wizardSteps.ts`

```ts
export const WIZARD_STEP_KEYS = [
  'info', 'terms', 'branches', 'holidays', 'students', 'review',
] as const;
export type WizardStepKey = (typeof WIZARD_STEP_KEYS)[number];

/** i18n key tabanı: `academic-sessions:wizard.steps.<key>.{label,title,desc}` */
export const WIZARD_STEP_COUNT = WIZARD_STEP_KEYS.length;
```

- [ ] **Step 2: Failing test** — `wizard/__tests__/WizardStepper.test.tsx`

```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '../../../../../../shared/i18n';
import { WizardStepper } from '../WizardStepper';

describe('WizardStepper', () => {
  it('renders 6 steps and marks completed/active', () => {
    render(<WizardStepper current={2} onStepClick={() => {}} />);
    // 6 adım numarası/etiketi
    expect(screen.getAllByRole('button').length).toBe(6);
  });

  it('calls onStepClick when a step is clicked', () => {
    const onStepClick = vi.fn();
    render(<WizardStepper current={2} onStepClick={onStepClick} />);
    fireEvent.click(screen.getAllByRole('button')[0]);
    expect(onStepClick).toHaveBeenCalledWith(0);
  });
});
```

- [ ] **Step 3: Run → FAIL**

Run: `npm run test -- WizardStepper`
Expected: FAIL.

- [ ] **Step 4: WizSwitch** — `wizard/WizSwitch.tsx`

```tsx
interface WizSwitchProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function WizSwitch({ checked, onChange, label, disabled }: WizSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={[
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
        checked ? 'bg-[#1B2B5E]' : 'bg-gray-300',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
      ].join(' ')}
    >
      <span
        className={[
          'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0.5',
        ].join(' ')}
      />
    </button>
  );
}
```
> Eğer `src/app/components/ui/switch.tsx` (shadcn Switch) mevcutsa onu kullan; bu özel buton yalnız o yoksa. Önce kontrol et.

- [ ] **Step 5: WizardStepper** — `wizard/WizardStepper.tsx`

```tsx
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { WIZARD_STEP_KEYS } from './wizardSteps';

interface WizardStepperProps {
  current: number;
  onStepClick: (index: number) => void;
}

export function WizardStepper({ current, onStepClick }: WizardStepperProps) {
  const { t } = useTranslation('academic-sessions');
  return (
    <nav className="flex items-center gap-2 overflow-x-auto py-2" aria-label={t('wizard.stepper-aria')}>
      {WIZARD_STEP_KEYS.map((key, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onStepClick(i)}
            className={[
              'flex items-center gap-2 rounded-full px-3 py-1.5 text-sm whitespace-nowrap transition',
              active ? 'bg-[#EEF1FA] text-[#1B2B5E] font-semibold ring-2 ring-[#1B2B5E]/20' : '',
              done ? 'text-[#0E7A5A]' : 'text-gray-500',
            ].join(' ')}
          >
            <span className={[
              'flex h-6 w-6 items-center justify-center rounded-full text-xs',
              done ? 'bg-[#0E7A5A] text-white' : active ? 'bg-[#1B2B5E] text-white' : 'bg-gray-200',
            ].join(' ')}>
              {done ? <Check size={14} strokeWidth={3} /> : i + 1}
            </span>
            {t(`wizard.steps.${key}.label`)}
          </button>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 6: SeasonFlowStrip** — `wizard/SeasonFlowStrip.tsx`

```tsx
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';

interface SeasonFlowStripProps {
  sourceLabel: string;
  newName: string;
}

export function SeasonFlowStrip({ sourceLabel, newName }: SeasonFlowStripProps) {
  const { t } = useTranslation('academic-sessions');
  return (
    <div className="flex items-center gap-4 rounded-xl bg-gradient-to-br from-[#1B2B5E] to-[#4F6BFF] px-6 py-4 text-white">
      <div className="flex flex-col">
        <span className="text-[11px] uppercase tracking-wide opacity-80">{t('wizard.flow.source')}</span>
        <span className="text-lg font-bold">{sourceLabel}</span>
      </div>
      <ArrowRight size={19} strokeWidth={2.4} className="opacity-80" />
      <div className="flex flex-col">
        <span className="text-[11px] uppercase tracking-wide opacity-80">{t('wizard.flow.new')}</span>
        <span className="text-lg font-bold">{newName}</span>
        <span className="text-xs opacity-80">{t('wizard.flow.draft-will-be-created')}</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Run → PASS** (i18n key'leri Task 9'da eklenecek; test `i18n` import'u ile render eder, eksik key fallback anahtarı gösterir — test sayıya bakar, metne değil)

Run: `npm run test -- WizardStepper`
Expected: PASS (2 tests). Eğer test eksik i18n key nedeniyle metin assert'i yapıyorsa sayı tabanlı assert'e çevir (yukarıdaki gibi).

- [ ] **Step 8: Commit**

```bash
git add src/portals/admin/academic-sessions/components/wizard/
git commit -m "$(printf '2026-06-09 feat: sezon sihirbazı primitifleri (Stepper, WizSwitch, SeasonFlowStrip) eklendi.\n\nCo-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>')"
```

---

## Task 4: Adım 1 — Sezon Açılışı (StepInfo)

**Files:**
- Create: `src/portals/admin/academic-sessions/components/wizard/steps/StepInfo.tsx`
- Test: `src/portals/admin/academic-sessions/components/wizard/steps/__tests__/StepInfo.test.tsx`

Alanlar: Yeni Sezon Adı (input), Kaynak Sezon (select — aktif+arşiv sezon listesi `useAcademicSessionsQuery`), "Kopyalanacak bağlam" 5 toggle (terms/branches/holidays/assignments/schedule, varsayılan hepsi AÇIK). Tüm alanlar RHF `useFormContext<SeasonWizardForm>()` ile bağlanır.

- [ ] **Step 1: Failing test** — toggles + name binding

```tsx
import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '../../../../../../../shared/i18n';
import { server } from '../../../../../../../test/mswServer';
import { seedAdminAuth } from '../../../../../../../test/authFixtures'; // varsa; yoksa inline seed (bkz. SchoolHolidaysPanel.test)
import { StepInfo } from '../StepInfo';
import type { SeasonWizardForm } from '../../../../schemas/seasonWizardSchema';

function Harness() {
  const methods = useForm<SeasonWizardForm>({
    defaultValues: {
      name: '2026-2027', sourceSessionId: '', copy: { terms: true, branches: true, holidays: true, assignments: true, schedule: true },
      excludePassiveStudents: true, sessionStart: '', sessionEnd: '',
      terms: { t1Start: '', t1End: '', t2Start: '', t2End: '' }, branchMap: [], holidays: [],
    },
  });
  return <FormProvider {...methods}><StepInfo /></FormProvider>;
}

it('toggles a copy flag off', async () => {
  // seed auth + QueryClient + MSW academic-sessions list (en az 1 aktif sezon)
  server.use(http.get('*/academic-sessions', () => HttpResponse.json({ data: [
    { id: 's1', name: '2025-2026', startDate: '2025-09-01', endDate: '2026-06-30', status: 'Active', isCurrent: true, activatedAt: null, archivedAt: null },
  ] })));
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={qc}><Harness /></QueryClientProvider>);
  const switches = await screen.findAllByRole('switch');
  expect(switches.length).toBeGreaterThanOrEqual(5);
  fireEvent.click(switches[1]); // branches off
  expect(switches[1]).toHaveAttribute('aria-checked', 'false');
});
```
> Auth seed için `SchoolHolidaysPanel.test.tsx`'teki `seedAdmin` desenini birebir kopyala (useAuthStore.setState + ADMIN_PERMISSIONS).

- [ ] **Step 2: Run → FAIL**

Run: `npm run test -- StepInfo`
Expected: FAIL.

- [ ] **Step 3: StepInfo** — `wizard/steps/StepInfo.tsx`

```tsx
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useAcademicSessionsQuery } from '../../../hooks/useAcademicSessionsQuery';
import { WizSwitch } from '../WizSwitch';
import type { SeasonWizardForm } from '../../../schemas/seasonWizardSchema';

const COPY_AREAS = ['terms', 'branches', 'holidays', 'assignments', 'schedule'] as const;

export function StepInfo() {
  const { t } = useTranslation('academic-sessions');
  const { register, control } = useFormContext<SeasonWizardForm>();
  const { data: sessions = [] } = useAcademicSessionsQuery();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-gray-700">{t('wizard.steps.info.name-label')} *</span>
          <input className="rounded-md border border-gray-200 px-3 py-2" placeholder="2026-2027" {...register('name')} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-gray-700">{t('wizard.steps.info.source-label')}</span>
          <select className="rounded-md border border-gray-200 px-3 py-2" {...register('sourceSessionId')}>
            <option value="">—</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>{s.name} · {t(`status.${s.status}`)}</option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <div className="mb-2 text-sm font-medium text-gray-700">{t('wizard.steps.info.copy-context')}</div>
        <div className="space-y-2">
          {COPY_AREAS.map((area) => (
            <Controller
              key={area}
              control={control}
              name={`copy.${area}` as const}
              render={({ field }) => (
                <div className={['flex items-center justify-between rounded-lg border px-4 py-3',
                  field.value ? 'border-[#1B2B5E]/20 bg-[#EEF1FA]' : 'border-gray-200'].join(' ')}>
                  <div>
                    <div className="text-sm font-semibold text-gray-800">{t(`wizard.copy-areas.${area}.title`)}</div>
                    <div className="text-xs text-gray-500">{t(`wizard.copy-areas.${area}.desc`)}</div>
                  </div>
                  <WizSwitch checked={field.value} onChange={field.onChange} label={t(`wizard.copy-areas.${area}.title`)} />
                </div>
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run → PASS**

Run: `npm run test -- StepInfo`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/portals/admin/academic-sessions/components/wizard/steps/StepInfo.tsx \
        src/portals/admin/academic-sessions/components/wizard/steps/__tests__/StepInfo.test.tsx
git commit -m "$(printf '2026-06-09 feat: sihirbaz Adım 1 (Sezon Açılışı) eklendi.\n\nCo-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>')"
```

---

## Task 5: Adım 2 — Dönem Geçişi (StepTerms)

**Files:**
- Create: `src/portals/admin/academic-sessions/components/wizard/steps/StepTerms.tsx`
- Test: `src/portals/admin/academic-sessions/components/wizard/steps/__tests__/StepTerms.test.tsx`

"Önceki sezonun dönemlerini +1 yıl kaydırarak kopyala" toggle (`copy.terms`); 3 satır (1. Dönem / Yarıyıl arası gösterimi / 2. Dönem) tarih inputları (`terms.t1Start`, vb.) + `sessionStart`/`sessionEnd`. Toggle açıkken, kaynak sezonun dönemlerinden (`useTermsForSessionQuery(sourceSessionId)`) +1 yıl kaydırılmış tarihler **bir kez** doldurulur (kullanıcı düzenleyebilir).

- [ ] **Step 1: Failing test** — tarih inputları render + +1 yıl doldurma

```tsx
// FormProvider harness (Task 4 deseni). sourceSessionId='s1', MSW:
// GET /academic-sessions/s1/terms → 2 dönem (2025-09-08..2026-01-16, 2026-02-02..2026-06-26).
// "Kopyala" toggle açıkken inputlar +1 yıl kaymış değerlerle dolar (2026-09-08 vb.).
import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
// ... (harness + msw + auth seed)
it('fills +1 year shifted dates when copy is on', async () => {
  // assert: t1Start input değeri "2026-09-08"
  await waitFor(() => {
    expect((screen.getByLabelText(/1\. dönem.*başlangıç/i) as HTMLInputElement).value).toBe('2026-09-08');
  });
});
```
> Tam test kodu için Task 4 harness'ını kopyala; MSW handler ekle (`GET /academic-sessions/:id/terms`). Tarih input'larına `aria-label` ver (aşağıda).

- [ ] **Step 2: Run → FAIL**

Run: `npm run test -- StepTerms`
Expected: FAIL.

- [ ] **Step 3: StepTerms** — `wizard/steps/StepTerms.tsx`

```tsx
import { useEffect, useRef } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useTermsForSessionQuery } from '../../../hooks/useAcademicSessionsQuery';
import { WizSwitch } from '../WizSwitch';
import type { SeasonWizardForm } from '../../../schemas/seasonWizardSchema';

function shiftYear(iso: string, delta: number): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${Number(y) + delta}-${m}-${d}`;
}

export function StepTerms() {
  const { t } = useTranslation('academic-sessions');
  const { control, register, watch, setValue, getValues } = useFormContext<SeasonWizardForm>();
  const sourceSessionId = watch('sourceSessionId');
  const copyTerms = watch('copy.terms');
  const { data: sourceTerms } = useTermsForSessionQuery(copyTerms ? sourceSessionId : undefined);
  const filledRef = useRef(false);

  useEffect(() => {
    if (!copyTerms || !sourceTerms || sourceTerms.length < 2 || filledRef.current) return;
    if (getValues('terms.t1Start')) { filledRef.current = true; return; }
    const ordered = [...sourceTerms].sort((a, b) => a.startDate.localeCompare(b.startDate));
    setValue('terms.t1Start', shiftYear(ordered[0].startDate, 1));
    setValue('terms.t1End', shiftYear(ordered[0].endDate, 1));
    setValue('terms.t2Start', shiftYear(ordered[1].startDate, 1));
    setValue('terms.t2End', shiftYear(ordered[1].endDate, 1));
    setValue('sessionStart', shiftYear(ordered[0].startDate, 1));
    setValue('sessionEnd', shiftYear(ordered[1].endDate, 1));
    filledRef.current = true;
  }, [copyTerms, sourceTerms, setValue, getValues]);

  const rows = [
    { key: 't1', label: t('wizard.steps.terms.term1'), startName: 'terms.t1Start', endName: 'terms.t1End' },
    { key: 't2', label: t('wizard.steps.terms.term2'), startName: 'terms.t2Start', endName: 'terms.t2End' },
  ] as const;

  return (
    <div className="space-y-6">
      <Controller
        control={control}
        name="copy.terms"
        render={({ field }) => (
          <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
            <div>
              <div className="text-sm font-semibold text-gray-800">{t('wizard.steps.terms.copy-title')}</div>
              <div className="text-xs text-gray-500">{t('wizard.steps.terms.copy-desc')}</div>
            </div>
            <WizSwitch checked={field.value} onChange={field.onChange} />
          </div>
        )}
      />
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.key} className="grid grid-cols-1 items-end gap-3 md:grid-cols-3">
            <span className="text-sm font-medium text-gray-700">{r.label}</span>
            <input type="date" aria-label={`${r.label} ${t('wizard.steps.terms.start')}`}
              className="rounded-md border border-gray-200 px-3 py-2" {...register(r.startName)} />
            <input type="date" aria-label={`${r.label} ${t('wizard.steps.terms.end')}`}
              className="rounded-md border border-gray-200 px-3 py-2" {...register(r.endName)} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run → PASS**

Run: `npm run test -- StepTerms`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/portals/admin/academic-sessions/components/wizard/steps/StepTerms.tsx \
        src/portals/admin/academic-sessions/components/wizard/steps/__tests__/StepTerms.test.tsx
git commit -m "$(printf '2026-06-09 feat: sihirbaz Adım 2 (Dönem Geçişi) eklendi.\n\nCo-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>')"
```

---

## Task 6: Adım 3 — Şubeler (StepBranches, terfi haritası tablosu)

**Files:**
- Create: `src/portals/admin/academic-sessions/components/wizard/steps/StepBranches.tsx`
- Test: `src/portals/admin/academic-sessions/components/wizard/steps/__tests__/StepBranches.test.tsx`

"Şube yapısını kopyala" toggle (`copy.branches`). Açıkken `useRolloverPreviewQuery(sourceSessionId)` → terfi haritası tablosu (Kaynak Şube → Hedef + işlem rozeti: Terfi/Mezuniyet/Yeni Şube + mevcut sayı). Önizleme geldiğinde form `branchMap` alanı **bir kez** doldurulur (admin override edebilir — hedef section input). Özet: terfi/mezun/yeni şube sayıları (`summary`). Kapalıyken warning.

- [ ] **Step 1: Failing test** — preview tablosu + summary + branchMap doldurma

```tsx
// Harness (FormProvider + QueryClient + MSW). sourceSessionId='s1', copy.branches=true.
// MSW: GET /academic-sessions/s1/rollover-preview → rows: 6-A→7 Promote(29), 8-A Graduate(28); summary.
// assert: "6-A" satırı + "Terfi" rozeti görünür; "Mezuniyet" görünür; özet "28" mezun.
import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
it('renders the promotion map from the preview', async () => {
  await waitFor(() => expect(screen.getByText('6-A')).toBeInTheDocument());
  expect(screen.getByText(/mezuniyet/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run → FAIL**

Run: `npm run test -- StepBranches`
Expected: FAIL.

- [ ] **Step 3: StepBranches** — `wizard/steps/StepBranches.tsx`

```tsx
import { useEffect, useRef } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { useRolloverPreviewQuery } from '../../../hooks/useSeasonWizard';
import { WizSwitch } from '../WizSwitch';
import type { SeasonWizardForm } from '../../../schemas/seasonWizardSchema';
import type { RolloverRowKind } from '../../../types';

const KIND_BADGE: Record<RolloverRowKind, string> = {
  Promote: 'bg-gray-100 text-gray-700',
  Graduate: 'bg-[#D7F5EC] text-[#0E7A5A]',
  NewBranch: 'bg-[#EEF1FA] text-[#1B2B5E]',
};

export function StepBranches() {
  const { t } = useTranslation('academic-sessions');
  const { control, watch, setValue, getValues } = useFormContext<SeasonWizardForm>();
  const sourceSessionId = watch('sourceSessionId');
  const copyBranches = watch('copy.branches');
  const { data: preview, isLoading } = useRolloverPreviewQuery(copyBranches ? sourceSessionId : undefined);
  const filledRef = useRef(false);

  useEffect(() => {
    if (!copyBranches || !preview || filledRef.current) return;
    if (getValues('branchMap').length) { filledRef.current = true; return; }
    setValue('branchMap', preview.rows.map((r) => ({
      sourceClassRoomId: r.sourceClassRoomId,
      toGradeLevelId: r.toGradeLevelId,
      toSection: r.toSection,
      capacity: 30,
      kind: r.kind,
    })));
    filledRef.current = true;
  }, [copyBranches, preview, setValue, getValues]);

  return (
    <div className="space-y-5">
      <Controller
        control={control}
        name="copy.branches"
        render={({ field }) => (
          <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
            <div>
              <div className="text-sm font-semibold text-gray-800">{t('wizard.steps.branches.copy-title')}</div>
              <div className="text-xs text-gray-500">{t('wizard.steps.branches.copy-desc')}</div>
            </div>
            <WizSwitch checked={field.value} onChange={field.onChange} />
          </div>
        )}
      />

      {!copyBranches ? (
        <div className="flex items-center gap-2 rounded-lg bg-[#FEF3C7] px-4 py-3 text-sm text-[#B05A0A]">
          <AlertTriangle size={15} /> {t('wizard.steps.branches.copy-off-warning')}
        </div>
      ) : isLoading ? (
        <div className="h-32 animate-pulse rounded-lg bg-gray-100" />
      ) : preview ? (
        <>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-gray-400">
                <th className="py-2">{t('wizard.steps.branches.col-source')}</th>
                <th>{t('wizard.steps.branches.col-current')}</th>
                <th></th>
                <th>{t('wizard.steps.branches.col-target')}</th>
                <th>{t('wizard.steps.branches.col-action')}</th>
              </tr>
            </thead>
            <tbody>
              {preview.rows.map((r, i) => (
                <tr key={`${r.sourceClassRoomId ?? 'new'}-${i}`} className="border-t border-gray-100">
                  <td className="py-2 font-medium">{r.fromLabel}</td>
                  <td className="tabular-nums">{r.studentCount}</td>
                  <td><ArrowRight size={16} className="text-gray-300" /></td>
                  <td>{r.kind === 'Graduate' ? '—' : (r.toSection ?? '')}</td>
                  <td><span className={`rounded-full px-2 py-0.5 text-xs ${KIND_BADGE[r.kind]}`}>
                    {t(`wizard.kind.${r.kind}`)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="grid grid-cols-3 gap-3">
            <Summary value={preview.summary.promotedBranches} label={t('wizard.steps.branches.sum-promoted')} />
            <Summary value={preview.summary.graduatingStudents} label={t('wizard.steps.branches.sum-graduated')} />
            <Summary value={preview.summary.newBottomBranches} label={t('wizard.steps.branches.sum-new')} />
          </div>
        </>
      ) : null}
    </div>
  );
}

function Summary({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-lg border border-gray-200 p-3 text-center">
      <div className="text-xl font-extrabold text-[#1B2B5E]">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}
```

- [ ] **Step 4: Run → PASS**

Run: `npm run test -- StepBranches`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/portals/admin/academic-sessions/components/wizard/steps/StepBranches.tsx \
        src/portals/admin/academic-sessions/components/wizard/steps/__tests__/StepBranches.test.tsx
git commit -m "$(printf '2026-06-09 feat: sihirbaz Adım 3 (Şubeler — terfi haritası) eklendi.\n\nCo-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>')"
```

---

## Task 7: Adım 4 (Tatiller) + Adım 5 (Öğrenci Geçişi)

**Files:**
- Create: `src/portals/admin/academic-sessions/components/wizard/steps/StepHolidays.tsx`
- Create: `src/portals/admin/academic-sessions/components/wizard/steps/StepStudents.tsx`
- Test: `src/portals/admin/academic-sessions/components/wizard/steps/__tests__/StepHolidays.test.tsx`
- Test: `src/portals/admin/academic-sessions/components/wizard/steps/__tests__/StepStudents.test.tsx`

**Adım 4 (Tatiller):** "Resmi Tatiller" salt-okunur bilgi notu (backend resmi tatil üretimi henüz yok → "aktivasyonda otomatik eklenir" notu); "Okul tatillerini kopyala" toggle (`copy.holidays`) + `holidays` listesi (RHF `useFieldArray`): ad + tarih, "Kaldır" ve "Tatil Ekle" (dashed) butonları. **Adım 5 (Öğrenci Geçişi):** warning bilgi notu (kişiler silinmez, aktivasyonda terfi); 3 toggle: "Aktif öğrencileri terfi ettir" (salt-okunur AÇIK, bilgi), "Pasif öğrencileri hariç tut" (`excludePassiveStudents`), "Öğretmen görevlendirmelerini kopyala" (`copy.assignments`).

- [ ] **Step 1: Failing tests** (iki dosya) — StepHolidays: "Tatil Ekle" satır ekler; StepStudents: `excludePassiveStudents` toggle çalışır.

```tsx
// StepHolidays.test: copy.holidays=true; "Tatil Ekle" tıkla → yeni ad inputu görünür.
// StepStudents.test: 'pasif öğrenci' switch'i tıkla → aria-checked değişir.
```
> Harness için Task 4 desenini kopyala (FormProvider + i18n).

- [ ] **Step 2: Run → FAIL**

Run: `npm run test -- StepHolidays StepStudents`
Expected: FAIL.

- [ ] **Step 3: StepHolidays** — `wizard/steps/StepHolidays.tsx`

```tsx
import { Controller, useFieldArray, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Plus, Star, X, Info } from 'lucide-react';
import { WizSwitch } from '../WizSwitch';
import type { SeasonWizardForm } from '../../../schemas/seasonWizardSchema';

export function StepHolidays() {
  const { t } = useTranslation('academic-sessions');
  const { control, register, watch } = useFormContext<SeasonWizardForm>();
  const copyHolidays = watch('copy.holidays');
  const { fields, append, remove } = useFieldArray({ control, name: 'holidays' });

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-2 rounded-lg bg-[#D7F5EC] px-4 py-3 text-sm text-[#0E7A5A]">
        <Info size={15} className="mt-0.5" /> {t('wizard.steps.holidays.official-note')}
      </div>
      <Controller
        control={control}
        name="copy.holidays"
        render={({ field }) => (
          <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
            <div>
              <div className="text-sm font-semibold text-gray-800">{t('wizard.steps.holidays.copy-title')}</div>
              <div className="text-xs text-gray-500">{t('wizard.steps.holidays.copy-desc')}</div>
            </div>
            <WizSwitch checked={field.value} onChange={field.onChange} />
          </div>
        )}
      />
      {copyHolidays && (
        <div className="space-y-2">
          {fields.map((f, i) => (
            <div key={f.id} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
              <Star size={16} className="text-[#0E7A5A]" />
              <input className="flex-1 rounded-md border border-gray-200 px-2 py-1.5 text-sm"
                aria-label={t('wizard.steps.holidays.name')} {...register(`holidays.${i}.name` as const)} />
              <input type="date" className="rounded-md border border-gray-200 px-2 py-1.5 text-sm"
                aria-label={t('wizard.steps.holidays.start')} {...register(`holidays.${i}.startDate` as const)} />
              <button type="button" onClick={() => remove(i)} aria-label={t('common:remove', 'Kaldır')}>
                <X size={15} className="text-gray-400" />
              </button>
            </div>
          ))}
          <button type="button"
            onClick={() => append({ name: '', startDate: '', endDate: null })}
            className="flex items-center gap-1 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-600">
            <Plus size={14} /> {t('wizard.steps.holidays.add')}
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: StepStudents** — `wizard/steps/StepStudents.tsx`

```tsx
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { WizSwitch } from '../WizSwitch';
import type { SeasonWizardForm } from '../../../schemas/seasonWizardSchema';

export function StepStudents() {
  const { t } = useTranslation('academic-sessions');
  const { control } = useFormContext<SeasonWizardForm>();
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-2 rounded-lg bg-[#FEF3C7] px-4 py-3 text-sm text-[#B05A0A]">
        <AlertTriangle size={15} className="mt-0.5" /> {t('wizard.steps.students.warning')}
      </div>
      {/* Aktif öğrencileri terfi ettir — salt-okunur (her zaman AÇIK), bilgi amaçlı */}
      <div className="flex items-center justify-between rounded-lg border border-[#1B2B5E]/20 bg-[#EEF1FA] px-4 py-3">
        <div>
          <div className="text-sm font-semibold text-gray-800">{t('wizard.steps.students.promote-title')}</div>
          <div className="text-xs text-gray-500">{t('wizard.steps.students.promote-desc')}</div>
        </div>
        <WizSwitch checked onChange={() => {}} disabled />
      </div>
      <Controller
        control={control}
        name="excludePassiveStudents"
        render={({ field }) => (
          <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
            <div>
              <div className="text-sm font-semibold text-gray-800">{t('wizard.steps.students.exclude-passive-title')}</div>
              <div className="text-xs text-gray-500">{t('wizard.steps.students.exclude-passive-desc')}</div>
            </div>
            <WizSwitch checked={field.value} onChange={field.onChange} />
          </div>
        )}
      />
      <Controller
        control={control}
        name="copy.assignments"
        render={({ field }) => (
          <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
            <div>
              <div className="text-sm font-semibold text-gray-800">{t('wizard.steps.students.copy-assignments-title')}</div>
              <div className="text-xs text-gray-500">{t('wizard.steps.students.copy-assignments-desc')}</div>
            </div>
            <WizSwitch checked={field.value} onChange={field.onChange} />
          </div>
        )}
      />
    </div>
  );
}
```

- [ ] **Step 5: Run → PASS**

Run: `npm run test -- StepHolidays StepStudents`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/portals/admin/academic-sessions/components/wizard/steps/StepHolidays.tsx \
        src/portals/admin/academic-sessions/components/wizard/steps/StepStudents.tsx \
        src/portals/admin/academic-sessions/components/wizard/steps/__tests__/StepHolidays.test.tsx \
        src/portals/admin/academic-sessions/components/wizard/steps/__tests__/StepStudents.test.tsx
git commit -m "$(printf '2026-06-09 feat: sihirbaz Adım 4 (Tatiller) ve Adım 5 (Öğrenci Geçişi) eklendi.\n\nCo-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>')"
```

---

## Task 8: Adım 6 (Özet & Onay) + Başarı ekranı

**Files:**
- Create: `src/portals/admin/academic-sessions/components/wizard/steps/StepReview.tsx`
- Create: `src/portals/admin/academic-sessions/components/wizard/WizSuccessScreen.tsx`
- Test: `src/portals/admin/academic-sessions/components/wizard/steps/__tests__/StepReview.test.tsx`

**Adım 6:** 4 özet kartı (Sezon ad/kaynak, Dönem Yapısı tarihleri, Şubeler terfi/mezun/yeni, Tatiller) — form değerlerinden okunur; warning: "Sezon taslak olarak oluşturulur; Aktifleştir'e kadar mevcut sezon etkilenmez". **Başarı ekranı:** yeşil check + "{ad} sezonu oluşturuldu" + butonlar: "Akademik Takvime Git" (şimdilik liste/detay sayfasına) + "Bitti".

- [ ] **Step 1: Failing test** — özet kartları form değerlerini gösterir

```tsx
// FormProvider defaultValues (name 2026-2027, branchMap özet sayıları) → StepReview render.
// assert: "2026-2027" görünür; warning metni görünür.
it('shows the summary cards and draft warning', () => {
  expect(screen.getByText('2026-2027')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run → FAIL**

Run: `npm run test -- StepReview`
Expected: FAIL.

- [ ] **Step 3: StepReview** — `wizard/steps/StepReview.tsx`

```tsx
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ShieldAlert } from 'lucide-react';
import type { SeasonWizardForm } from '../../../schemas/seasonWizardSchema';

export function StepReview() {
  const { t } = useTranslation('academic-sessions');
  const { watch } = useFormContext<SeasonWizardForm>();
  const v = watch();
  const promoted = v.branchMap.filter((b) => b.kind === 'Promote').length;
  const graduated = v.branchMap.filter((b) => b.kind === 'Graduate').length;
  const newBranches = v.branchMap.filter((b) => b.kind === 'NewBranch').length;

  const cards = [
    { title: t('wizard.review.season'), lines: [['ad', v.name], ['kaynak', v.sourceSessionId || '—']] },
    { title: t('wizard.review.terms'), lines: [['1. Dönem', `${v.terms.t1Start} – ${v.terms.t1End}`], ['2. Dönem', `${v.terms.t2Start} – ${v.terms.t2End}`]] },
    { title: t('wizard.review.branches'), lines: [['terfi', String(promoted)], ['yeni/mezun', `${newBranches} / ${graduated}`]] },
    { title: t('wizard.review.holidays'), lines: [['okul tatili', v.copy.holidays ? String(v.holidays.length) : '—']] },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {cards.map((c) => (
          <div key={c.title} className="rounded-lg border border-gray-200 p-4">
            <h4 className="mb-2 text-sm font-bold text-gray-800">{c.title}</h4>
            {c.lines.map(([k, val]) => (
              <div key={k} className="flex justify-between py-0.5 text-sm">
                <span className="text-gray-500">{k}</span><span className="font-medium">{val}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-start gap-2 rounded-lg bg-[#FEF3C7] px-4 py-3 text-sm text-[#B05A0A]">
        <ShieldAlert size={15} className="mt-0.5" /> {t('wizard.review.draft-warning')}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: WizSuccessScreen** — `wizard/WizSuccessScreen.tsx`

```tsx
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';

interface WizSuccessScreenProps {
  seasonName: string;
  onGoToCalendar: () => void;
  onDone: () => void;
}

export function WizSuccessScreen({ seasonName, onGoToCalendar, onDone }: WizSuccessScreenProps) {
  const { t } = useTranslation('academic-sessions');
  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center">
      <div className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-[#D7F5EC] text-[#0E7A5A]">
        <Check size={34} strokeWidth={2.6} />
      </div>
      <h2 className="text-xl font-extrabold text-gray-800">{t('wizard.success.title', { name: seasonName })}</h2>
      <p className="max-w-md text-sm text-gray-500">{t('wizard.success.body')}</p>
      <div className="flex gap-3">
        <button type="button" onClick={onGoToCalendar} className="rounded-md border border-gray-200 px-4 py-2 text-sm">
          {t('wizard.success.go-calendar')}
        </button>
        <button type="button" onClick={onDone} className="rounded-md bg-[#1B2B5E] px-4 py-2 text-sm text-white">
          {t('wizard.success.done')}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run → PASS**

Run: `npm run test -- StepReview`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/portals/admin/academic-sessions/components/wizard/steps/StepReview.tsx \
        src/portals/admin/academic-sessions/components/wizard/WizSuccessScreen.tsx \
        src/portals/admin/academic-sessions/components/wizard/steps/__tests__/StepReview.test.tsx
git commit -m "$(printf '2026-06-09 feat: sihirbaz Adım 6 (Özet & Onay) ve başarı ekranı eklendi.\n\nCo-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>')"
```

---

## Task 9: Sayfa orkestrasyonu + route + i18n

**Files:**
- Create: `src/portals/admin/academic-sessions/pages/SeasonWizardPage.tsx`
- Modify: `src/portals/admin/academic-sessions/index.ts` (export)
- Modify: `src/app/routes.tsx` (route + lazy export)
- Modify: `src/shared/i18n/locales/tr/academic-sessions.json` ve `.../en/academic-sessions.json` (`wizard.*` blok)
- Test: `src/portals/admin/academic-sessions/pages/__tests__/SeasonWizardPage.test.tsx`

Sayfa: tek RHF form (`useForm<SeasonWizardForm>` + `zodResolver(seasonWizardSchema)`), `FormProvider` ile sarar. Açılışta `useSeasonDraftQuery` → varsa `fromDraftDto` ile `reset(form)` + `setStep(draft.currentStep)`. Page head: breadcrumb + "Panele Dön" (ghost, `navigate('/admin')`) + "Taslağı Kaydet" (`useSaveSeasonDraftMutation` → `toSaveDraftInput(getValues(), step)`; başarıda 1.8s toast/check). `SeasonFlowStrip`. `WizardStepper`. Aktif adım paneli (`switch(stepKey)` → ilgili Step bileşeni). Alt çubuk: Geri / İleri; son adımda **Sezonu Aç** (`useOpenSeasonFromDraftMutation` → başarıda `done=true` → `WizSuccessScreen`). Hata → sonner toast.

- [ ] **Step 1: i18n blokları** — `tr/academic-sessions.json` içindeki `"academic-sessions"` objesine `"wizard"` anahtarı ekle (en az kullanılan tüm key'ler). Örnek (tr):

```json
"wizard": {
  "title": "Sezon Yönetimi",
  "subtitle": "Yeni eğitim-öğretim sezonunu önceki sezondan kopyalayarak açın.",
  "back-to-panel": "Panele Dön",
  "save-draft": "Taslağı Kaydet",
  "draft-saved": "Taslak kaydedildi",
  "next": "İleri", "prev": "Geri", "open-season": "Sezonu Aç",
  "step-of": "Adım {{current}} / {{total}}",
  "stepper-aria": "Sihirbaz adımları",
  "open-error": "Sezon açılamadı.",
  "flow": { "source": "Kaynak", "new": "Yeni", "draft-will-be-created": "Taslak oluşturulacak" },
  "steps": {
    "info":   { "label": "Sezon Açılışı", "title": "Yeni Sezon Açılışı", "desc": "Sezonu adlandırın ve hangi sezondan bağlam kopyalanacağını seçin.", "name-label": "Yeni Sezon Adı", "source-label": "Kaynak Sezon", "copy-context": "Kopyalanacak bağlam" },
    "terms":  { "label": "Dönem Geçişi", "title": "Dönem Yapısı & Geçiş", "desc": "1. ve 2. dönem tarihlerini belirleyin.", "copy-title": "Önceki sezonun dönem yapısını kopyala", "copy-desc": "Tarihler +1 yıl kaydırılarak doldurulur", "term1": "1. Dönem", "term2": "2. Dönem", "start": "Başlangıç", "end": "Bitiş" },
    "branches": { "label": "Şubeler", "title": "Yeni Sezon Şubeleri", "desc": "Şube yapısını kopyalayın; yükseltme ve mezuniyeti gözden geçirin.", "copy-title": "Şube yapısını kopyala", "copy-desc": "Tüm kademe ve şubeler bir üst sınıfa yükseltilir", "copy-off-warning": "Şube kopyalama kapalı — yeni sezonda şubeleri elle oluşturmanız gerekir.", "col-source": "Kaynak Şube", "col-current": "Mevcut", "col-target": "Hedef", "col-action": "İşlem", "sum-promoted": "Şube terfi eder", "sum-graduated": "Öğrenci mezun", "sum-new": "Yeni şube" },
    "holidays": { "label": "Tatiller", "title": "Yeni Sezon Tatilleri", "desc": "Resmi tatiller otomatik; okul tatillerini taşıyın.", "official-note": "Resmi tatiller sezon aktifleştirildiğinde otomatik eklenir.", "copy-title": "Okul tatillerini kopyala", "copy-desc": "Yarıyıl ve ara tatilleri önceki sezondan taşınır", "name": "Tatil adı", "start": "Tarih", "add": "Tatil Ekle" },
    "students": { "label": "Öğrenci Geçişi", "title": "Öğrenci Geçişi (Sezon Terfisi)", "desc": "Aktif öğrencileri yeni sezon kayıtlarına taşıyın.", "warning": "Aktif öğrenciler için yeni sezon kaydı oluşturulur; kişiler silinmez. Terfi sezon aktifleştirildiğinde gerçekleşir.", "promote-title": "Aktif öğrencileri terfi ettir", "promote-desc": "Bir üst sınıfa yükselir (aktivasyonda)", "exclude-passive-title": "Pasif öğrencileri hariç tut", "exclude-passive-desc": "Pasif kayıtlar yeni sezona taşınmaz", "copy-assignments-title": "Öğretmen görevlendirmelerini kopyala", "copy-assignments-desc": "Branş ve sınıf görevleri şablon olarak taşınır" },
    "review": { "label": "Özet & Onay", "title": "Özet & Onay", "desc": "Seçimleri gözden geçirin ve sezonu taslak olarak açın." }
  },
  "copy-areas": {
    "terms": { "title": "Dönem Yapısı", "desc": "1./2. dönem ve yarıyıl tatili (+1 yıl)" },
    "branches": { "title": "Sınıflar & Şubeler", "desc": "Şube yapısı ve sınıf yükseltme haritası" },
    "holidays": { "title": "Okul Tatilleri", "desc": "Tekrar eden okul ve ara tatilleri" },
    "assignments": { "title": "Öğretmen Görevlendirmeleri", "desc": "Branş ve sınıf görevlendirmeleri şablonu" },
    "schedule": { "title": "Ders Programı Şablonu", "desc": "Haftalık ders programı iskeleti" }
  },
  "kind": { "Promote": "Terfi", "Graduate": "Mezuniyet", "NewBranch": "Yeni Şube" },
  "review": { "season": "Sezon", "terms": "Dönem Yapısı", "branches": "Şubeler", "holidays": "Tatiller", "draft-warning": "Sezon taslak olarak oluşturulur. \"Aktifleştir\" ile canlıya alınana kadar mevcut sezon etkilenmez." },
  "success": { "title": "{{name}} sezonu oluşturuldu", "body": "Sezon taslak olarak açıldı. Yıl başında \"Aktifleştir\" ile canlıya alabilirsiniz.", "go-calendar": "Akademik Takvime Git", "done": "Bitti" },
  "errors": { "name-format": "Sezon adı 'YYYY-YYYY' biçiminde olmalı.", "source-required": "Kaynak sezon zorunludur.", "date-format": "Tarih biçimi geçersiz." }
}
```
`en/academic-sessions.json`'a aynı anahtar yapısının İngilizce çevirisini ekle (özdeş anahtarlar; değerler İngilizce).

- [ ] **Step 2: Failing page test** — `pages/__tests__/SeasonWizardPage.test.tsx`

```tsx
// MSW: GET /season-drafts/current → null; GET /academic-sessions → [aktif sezon].
// render SeasonWizardPage (QueryClient + MemoryRouter + i18n + authStore seed + Toaster).
// assert: başlık "Sezon Yönetimi" görünür; stepper 6 adım; "Sezonu Aç" başlangıçta GÖRÜNMEZ (son adımda görünür).
// "İleri"ye 5 kez tıkla → "Sezonu Aç" butonu görünür.
import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
it('navigates to the last step and shows Sezonu Aç', async () => {
  // ... setup
  for (let i = 0; i < 5; i++) fireEvent.click(screen.getByRole('button', { name: /ileri/i }));
  await waitFor(() => expect(screen.getByRole('button', { name: /sezonu aç/i })).toBeInTheDocument());
});
```

- [ ] **Step 3: Run → FAIL**

Run: `npm run test -- SeasonWizardPage`
Expected: FAIL.

- [ ] **Step 4: SeasonWizardPage** — `pages/SeasonWizardPage.tsx`

```tsx
import { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { ChevronRight, ChevronLeft, Check, FileText } from 'lucide-react';
import { seasonWizardSchema, toSaveDraftInput, fromDraftDto, type SeasonWizardForm } from '../schemas/seasonWizardSchema';
import { WIZARD_STEP_KEYS, WIZARD_STEP_COUNT } from '../components/wizard/wizardSteps';
import { WizardStepper } from '../components/wizard/WizardStepper';
import { SeasonFlowStrip } from '../components/wizard/SeasonFlowStrip';
import { WizSuccessScreen } from '../components/wizard/WizSuccessScreen';
import { StepInfo } from '../components/wizard/steps/StepInfo';
import { StepTerms } from '../components/wizard/steps/StepTerms';
import { StepBranches } from '../components/wizard/steps/StepBranches';
import { StepHolidays } from '../components/wizard/steps/StepHolidays';
import { StepStudents } from '../components/wizard/steps/StepStudents';
import { StepReview } from '../components/wizard/steps/StepReview';
import { useSeasonDraftQuery, useSaveSeasonDraftMutation, useOpenSeasonFromDraftMutation } from '../hooks/useSeasonWizard';
import { useAcademicSessionsQuery } from '../hooks/useAcademicSessionsQuery';

const DEFAULTS: SeasonWizardForm = {
  name: '', sourceSessionId: '',
  copy: { terms: true, branches: true, holidays: true, assignments: true, schedule: true },
  excludePassiveStudents: true, sessionStart: '', sessionEnd: '',
  terms: { t1Start: '', t1End: '', t2Start: '', t2End: '' }, branchMap: [], holidays: [],
};

export function SeasonWizardPage() {
  const { t } = useTranslation('academic-sessions');
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [savedTick, setSavedTick] = useState(false);

  const methods = useForm<SeasonWizardForm>({ defaultValues: DEFAULTS, resolver: zodResolver(seasonWizardSchema) });
  const { data: draft } = useSeasonDraftQuery();
  const { data: sessions = [] } = useAcademicSessionsQuery();
  const saveDraft = useSaveSeasonDraftMutation();
  const openSeason = useOpenSeasonFromDraftMutation();

  // Taslaktan devam et (bir kez)
  useEffect(() => {
    if (draft) { methods.reset(fromDraftDto(draft)); setStep(Math.min(draft.currentStep, WIZARD_STEP_COUNT - 1)); }
  }, [draft, methods]);

  // Kaynak sezon seçili değilse aktif sezonu öner
  useEffect(() => {
    if (!methods.getValues('sourceSessionId')) {
      const active = sessions.find((s) => s.isCurrent) ?? sessions[0];
      if (active) methods.setValue('sourceSessionId', active.id);
    }
  }, [sessions, methods]);

  const stepKey = WIZARD_STEP_KEYS[step];
  const isLast = step === WIZARD_STEP_COUNT - 1;
  const sourceLabel = sessions.find((s) => s.id === methods.watch('sourceSessionId'))?.name ?? '—';
  const newName = methods.watch('name') || t('wizard.flow.new');

  const handleSaveDraft = async () => {
    await saveDraft.mutateAsync(toSaveDraftInput(methods.getValues(), step));
    setSavedTick(true);
    setTimeout(() => setSavedTick(false), 1800);
  };

  const handleOpen = async () => {
    try {
      // Önce taslağı güncelle, sonra aç (backend taslaktan materyalize eder)
      await saveDraft.mutateAsync(toSaveDraftInput(methods.getValues(), step));
      await openSeason.mutateAsync();
      setDone(true);
    } catch {
      toast.error(t('wizard.open-error'));
    }
  };

  if (done) {
    return (
      <div className="mx-auto max-w-[1320px] px-6 py-8">
        <WizSuccessScreen
          seasonName={methods.getValues('name')}
          onGoToCalendar={() => navigate('/admin/academic-sessions')}
          onDone={() => { setDone(false); setStep(0); methods.reset(DEFAULTS); }}
        />
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <div className="mx-auto max-w-[1320px] space-y-5 px-6 py-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">{t('wizard.title')}</h1>
            <p className="text-sm text-gray-500">{t('wizard.subtitle')}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => navigate('/admin')}
              className="flex items-center gap-1 rounded-md border border-gray-200 px-3 py-2 text-sm">
              <ChevronLeft size={17} /> {t('wizard.back-to-panel')}
            </button>
            <button type="button" onClick={handleSaveDraft}
              className="flex items-center gap-1 rounded-md border border-gray-200 px-3 py-2 text-sm">
              {savedTick ? <Check size={17} className="text-[#0E7A5A]" /> : <FileText size={17} />}
              {savedTick ? t('wizard.draft-saved') : t('wizard.save-draft')}
            </button>
          </div>
        </div>

        <SeasonFlowStrip sourceLabel={sourceLabel} newName={newName} />
        <WizardStepper current={step} onStepClick={setStep} />

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-1 text-lg font-extrabold text-gray-900">{t(`wizard.steps.${stepKey}.title`)}</div>
          <div className="mb-4 text-sm text-gray-500">{t(`wizard.steps.${stepKey}.desc`)}</div>
          {stepKey === 'info' && <StepInfo />}
          {stepKey === 'terms' && <StepTerms />}
          {stepKey === 'branches' && <StepBranches />}
          {stepKey === 'holidays' && <StepHolidays />}
          {stepKey === 'students' && <StepStudents />}
          {stepKey === 'review' && <StepReview />}

          <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
            <button type="button" disabled={step === 0} onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-1 rounded-md border border-gray-200 px-3 py-2 text-sm disabled:opacity-40">
              <ChevronLeft size={17} /> {t('wizard.prev')}
            </button>
            <span className="text-xs text-gray-400">{t('wizard.step-of', { current: step + 1, total: WIZARD_STEP_COUNT })}</span>
            {isLast ? (
              <button type="button" onClick={handleOpen} disabled={openSeason.isPending}
                className="flex items-center gap-1 rounded-md bg-[#1B2B5E] px-4 py-2 text-sm text-white disabled:opacity-50">
                <Check size={17} strokeWidth={2.3} /> {t('wizard.open-season')}
              </button>
            ) : (
              <button type="button" onClick={() => setStep((s) => s + 1)}
                className="flex items-center gap-1 rounded-md bg-[#1B2B5E] px-4 py-2 text-sm text-white">
                {t('wizard.next')} <ChevronRight size={17} strokeWidth={2.3} />
              </button>
            )}
          </div>
        </div>
      </div>
    </FormProvider>
  );
}
```

- [ ] **Step 5: Export + route**
  - `academic-sessions/index.ts`'e `export { SeasonWizardPage } from './pages/SeasonWizardPage';` ekle.
  - `src/app/routes.tsx`: üstteki academic-sessions import bloğuna `SeasonWizardPage` ekle; admin children'da `academic-sessions` children listesine yeni route ekle: `{ path: "season-management", Component: SeasonWizardPage },` (sıralama: `new`'den sonra, `:id`'den ÖNCE — `:id` segment'i `season-management`'i yakalamasın diye spesifik path önce gelmeli).

```tsx
// routes.tsx içinde academic-sessions children:
{ index: true, Component: AcademicSessionListPage },
{ path: "new", Component: AcademicSessionFormPage },
{ path: "season-management", Component: SeasonWizardPage }, // YENİ — :id'den önce
{ path: ":id", Component: AcademicSessionDetailPage },
{ path: "class-rooms/:id", Component: ClassRoomDetailPage },
```

- [ ] **Step 6: Run → PASS**

Run: `npm run test -- SeasonWizardPage`
Expected: PASS.

- [ ] **Step 7: Tüm sihirbaz testleri + build + lint**

Run: `npm run test -- season && npm run build`
Expected: ilgili testler yeşil, build temiz. (Gerekirse `npm run lint`.)

- [ ] **Step 8: Commit**

```bash
git add src/portals/admin/academic-sessions/pages/SeasonWizardPage.tsx \
        src/portals/admin/academic-sessions/index.ts \
        src/app/routes.tsx \
        src/shared/i18n/locales/tr/academic-sessions.json \
        src/shared/i18n/locales/en/academic-sessions.json \
        src/portals/admin/academic-sessions/pages/__tests__/SeasonWizardPage.test.tsx
git commit -m "$(printf '2026-06-09 feat: Sezon Yönetimi sihirbazı sayfası, rota ve i18n eklendi.\n\nCo-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>')"
```

---

## Açık uçlar / uygulama sırasında doğrulanacaklar
1. **shadcn primitifleri:** `src/app/components/ui/` altında `switch`, `button`, `input`, `select`, `table` var mı? Varsa özel Tailwind yerine onları kullan (WizSwitch/inputlar). Plan, primitif yoksa düz Tailwind veriyor — mevcutsa adapte et.
2. **Liste sayfasına giriş:** `AcademicSessionListPage`'e "Sezon Yönetimi" CTA'sı eklemek isteyebilirsin (bu plan dışında; kullanıcıya sor). Şimdilik route `/admin/academic-sessions/season-management`.
3. **Resmi tatil:** Backend resmi-tatil üretimi henüz yok (Task #10 ertelendi) → Adım 4 yalnız "aktivasyonda otomatik eklenir" notu gösterir; salt-okunur çip listesi yok.
4. **"Akademik Takvime Git":** Ekran 1 (Akademik Takvim) henüz yok → başarı ekranı şimdilik sezon listesine yönlendirir.
5. **Auth/permission:** Route admin guard altında; uçlar `academic-sessions.create` ister (admin'de var). Test authStore seed'i `ADMIN_PERMISSIONS` kullanır.
6. **i18n eksik key:** Testler `shared/i18n` import eder; eksik key fallback olarak key'i gösterir — metin assert'lerini kritik, sabit metinlerle değil rol/aria ile yapmayı tercih et.
