# Adil Otomatik Nöbet Dağıtımı (Faz 4 / Dilim 2c) — Frontend Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nöbet admin ekranındaki (DutyAdminPage) disabled "Adil Otomatik Dağıt" butonunu, BE 2c uçlarına (`enqueue → poll → apply`) bağlı bir sihirbaz drawer'ıyla aktifleştirir.

**Architecture:** Faz 3 ders-programı `AutoGenDrawer` + `useAutoGenerate` (enqueue→poll 1200ms→apply) deseninin Duties karşılığı. Yeni `DutyAutoDistributeDrawer` + `useAutoDistribute` hook + `dutiesApi`/`dutyKeys` genişletmesi. Sonuç önizlemesi mevcut `DutyGrid` görsel modelini yeniden kullanır. `DutyWeeklyFrequency = OnceEveryTwoWeeks` (enum int `2`) iken buton disabled + tooltip (K-2c-3).

**Tech Stack:** React + Vite + TS strict, TanStack Query v5, Zustand (authStore → schoolId), shadcn/ui + Tailwind, i18next, axios. Test: Vitest + @testing-library/react.

## Global Constraints

- **Bağlayıcı spec:** `.claude/specs/ders-programi-faz4-dilim2c-otomatik-dagitim-design.md` (`K-2c-1..10`). Aykırılıkta dur, madde no ile bildir.
- **Server state yalnız React Query** — Zustand'a kopyalanmaz. Tüm key'ler `tenantScopedKey(schoolId, [...])` ile tenant-prefix taşır (`src/shared/config/tenant.ts`).
- **Hardcoded Türkçe yok** — tüm string `duties.autoDistribute.*` i18n key (tr + en parité).
- **Permission gate:** `duties.manage` olmayan kullanıcı butonu görmez/kullanamaz (UX gate; gerçek yetki BE'de).
- **Named export** (default export yok). `any` yok (TS strict).
- **Full-page loading'de skeleton** (spinner değil) — drawer içi "dağıtılıyor" durumu hariç (kısa async, ilerleme göstergesi uygun).
- **Çalışma dizini:** `oksis-web/`. Test: `npm run test`. Build: `npm run build`.
- **Commit formatı:** `YYYY-MM-DD <type>: Türkçe özet.` Tarihi `date +%F` ile al.

---

## Dosya Yapısı (oluşturulacak / değiştirilecek)

- Modify `src/shared/i18n/locales/tr/duties.json` + `src/shared/i18n/locales/en/duties.json` — `autoDistribute.*` namespace
- Modify `src/portals/admin/duties/api/dutiesApi.ts` — 3 yeni fonksiyon
- Modify `src/portals/admin/duties/keys/dutyKeys.ts` — `autoDistributeJob` key
- Create `src/portals/admin/duties/autodistribute/types.ts` — DTO tipleri
- Create `src/portals/admin/duties/autodistribute/useAutoDistribute.ts` — hook
- Create `src/portals/admin/duties/autodistribute/DutyAutoDistributeDrawer.tsx` — sihirbaz
- Modify `src/portals/admin/duties/components/DutySummaryBar.tsx` — butonu aktifleştir + biweekly gate
- Modify `src/portals/admin/duties/DutyAdminPage.tsx` — drawer state + `onOpenAuto` bağla
- Create tests under `src/portals/admin/duties/__tests__/`:
  - `useAutoDistribute.test.tsx`, `DutyAutoDistributeDrawer.test.tsx`, `DutySummaryBar.autodistribute.test.tsx`

---

### Task 1: i18n — `autoDistribute.*` namespace (tr/en)

**Files:**
- Modify: `src/shared/i18n/locales/tr/duties.json`
- Modify: `src/shared/i18n/locales/en/duties.json`

**Interfaces:**
- Produces: `duties.autoDistribute.*` anahtarları (sonraki task'lar `t("autoDistribute.*")` ile tüketir; namespace `duties`).

- [ ] **Step 1: Add TR keys**

`tr/duties.json` içinde mevcut kök objeye `autoDistribute` ekle:

```json
"autoDistribute": {
  "title": "Adil Otomatik Dağıt",
  "subtitle": "Nöbet çizelgesini politikana göre dengeli kur.",
  "mode": {
    "label": "Uygulama modu",
    "fromScratch": "Sıfırdan kur",
    "fromScratchHint": "Mevcut taslağı sil, baştan kur.",
    "fillEmpty": "Boşları doldur",
    "fillEmptyHint": "Elle atadıklarını koru, yalnız boş hücreleri doldur."
  },
  "policy": {
    "title": "Mevcut politika",
    "frequency": "Haftalık sıklık",
    "dayPattern": "Gün düzeni",
    "reliever": "Yancılık"
  },
  "start": "Dağıt",
  "distributing": "Dağıtılıyor…",
  "result": {
    "title": "Önerilen çizelge",
    "assigned": "Atanan",
    "missing": "Eksik",
    "balance": "Denge (min–maks)",
    "apply": "Uygula",
    "applying": "Uygulanıyor…"
  },
  "hints": {
    "title": "Tam doldurulamadı",
    "not-enough-teachers": "Yeterli uygun öğretmen yok.",
    "capacity-too-high": "Bölge kapasiteleri yüksek olabilir.",
    "too-many-exemptions": "Muafiyet sayısı fazla.",
    "availability-too-restrictive": "Müsaitlik kısıtları çok dar."
  },
  "biweeklyUnsupported": "İki haftada bir sıklığı otomatik dağıtımda henüz desteklenmiyor.",
  "errorTitle": "Dağıtım başarısız",
  "errorBody": "Otomatik dağıtım tamamlanamadı. Tekrar dene."
}
```

- [ ] **Step 2: Add EN keys (parité)**

`en/duties.json` içine aynı yapı, İngilizce değerlerle (`"title": "Fair Auto-Distribute"`, `"start": "Distribute"`, hint kodları aynı anahtarlarla İngilizce metin, vb.).

- [ ] **Step 3: Verify i18n loads (typecheck/build)**

Run: `npm run build`
Expected: PASS (JSON parse hatası yok).

- [ ] **Step 4: Commit**

```bash
D=$(date +%F)
git add src/shared/i18n/locales/tr/duties.json src/shared/i18n/locales/en/duties.json
git commit -m "$D feat: nöbet otomatik dağıtım i18n anahtarları (autoDistribute.*) eklendi."
```

---

### Task 2: Tipler + query key + API wrapper

**Files:**
- Create: `src/portals/admin/duties/autodistribute/types.ts`
- Modify: `src/portals/admin/duties/keys/dutyKeys.ts`
- Modify: `src/portals/admin/duties/api/dutiesApi.ts`

**Interfaces:**
- Consumes: `tenantScopedKey` (`src/shared/config/tenant.ts`), mevcut axios `api` instance (dutiesApi'nin kullandığı — dosyadan doğrula).
- Produces:
  - `types.ts`: `DutyDistributionMode = "FromScratch" | "FillEmpty"`; `AutoDistributeAssignment`, `AutoDistributeMissing`, `AutoDistributeTeacherLoad`, `AutoDistributeMetrics`, `AutoDistributeResult`, `AutoDistributeStatus` (BE DTO'larıyla birebir; `day: number`).
  - `dutyKeys.autoDistributeJob(schoolId, jobId)` → `tenantScopedKey(schoolId, ["duties", "auto-distribute", jobId])`.
  - `dutiesApi.enqueueAutoDistribute(body)`, `dutiesApi.getAutoDistributeStatus(jobId, signal?)`, `dutiesApi.applyAutoDistribute(jobId)`.

- [ ] **Step 1: Write the types**

```typescript
// src/portals/admin/duties/autodistribute/types.ts
export type DutyDistributionMode = "FromScratch" | "FillEmpty";

export type DutyDistributionStatus =
  | "Queued" | "Running" | "Done" | "NoSolution" | "Failed";

export interface AutoDistributeAssignment {
  teacherId: string;
  day: number; // 0=Sunday..6 (DayOfWeek); Mon=1..Fri=5
  locationId: string;
  relieverId: string | null;
}

export interface AutoDistributeMissing {
  day: number;
  locationId: string;
}

export interface AutoDistributeTeacherLoad {
  teacherId: string;
  dutyCount: number;
  relieverCount: number;
}

export interface AutoDistributeMetrics {
  assigned: number;
  missing: number;
  minLoad: number;
  maxLoad: number;
  loadVariance: number;
  perTeacher: AutoDistributeTeacherLoad[];
}

export interface AutoDistributeResult {
  assignments: AutoDistributeAssignment[];
  missing: AutoDistributeMissing[];
  metrics: AutoDistributeMetrics;
  noSolution: boolean;
}

export interface AutoDistributeStatus {
  status: DutyDistributionStatus;
  mode: DutyDistributionMode;
  result: AutoDistributeResult | null;
  hints: string[] | null;
  failureReason: string | null;
}

export interface EnqueueAutoDistributeBody {
  academicYearId: string;
  academicTermId: string;
  mode: DutyDistributionMode;
}
```

- [ ] **Step 2: Add the query key**

`dutyKeys.ts` mevcut objesine ekle (yapıyı dosyadaki diğer key'lerden doğrula):

```typescript
autoDistributeJob: (schoolId: string | null | undefined, jobId: string) =>
  tenantScopedKey(schoolId, ["duties", "auto-distribute", jobId]),
```

- [ ] **Step 3: Add the API wrappers**

`dutiesApi.ts`'e ekle (mevcut `api`/axios çağrı desenini dosyadan birebir izle — base path `/duties` zaten kullanılıyorsa onu kullan):

```typescript
enqueueAutoDistribute: async (body: EnqueueAutoDistributeBody): Promise<string> => {
  const { data } = await api.post<ApiResponse<string>>("/duties/auto-distribute", body);
  return data.data; // mevcut ApiResponse unwrap desenini doğrula
},

getAutoDistributeStatus: async (
  jobId: string,
  signal?: AbortSignal,
): Promise<AutoDistributeStatus> => {
  const { data } = await api.get<ApiResponse<AutoDistributeStatus>>(
    `/duties/auto-distribute/${jobId}`,
    { signal },
  );
  return data.data;
},

applyAutoDistribute: async (jobId: string): Promise<string> => {
  const { data } = await api.post<ApiResponse<string>>(
    `/duties/auto-distribute/${jobId}/apply`,
    {},
  );
  return data.data;
},
```
> `ApiResponse`/`api` import'larını ve unwrap (`data.data` vs `data`) şeklini `dutiesApi.ts`'in mevcut fonksiyonlarından **birebir** doğrula. `EnqueueAutoDistributeBody` ve dönüş tiplerini `../autodistribute/types` ile import et.

- [ ] **Step 4: Typecheck/build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
D=$(date +%F)
git add src/portals/admin/duties/autodistribute/types.ts \
        src/portals/admin/duties/keys/dutyKeys.ts \
        src/portals/admin/duties/api/dutiesApi.ts
git commit -m "$D feat: nöbet otomatik dağıtım FE tipleri + query key + API wrapper'ları eklendi."
```

---

### Task 3: `useAutoDistribute` hook (enqueue → poll → apply)

**Files:**
- Create: `src/portals/admin/duties/autodistribute/useAutoDistribute.ts`
- Test: `src/portals/admin/duties/__tests__/useAutoDistribute.test.tsx`

**Interfaces:**
- Consumes: `dutiesApi` (Task 2), `dutyKeys.autoDistributeJob`, `useAuthStore` (schoolId), React Query.
- Produces:
  - `UseAutoDistributeResult { jobId: string | null; status: AutoDistributeStatus | undefined; isEnqueuing: boolean; isPolling: boolean; enqueue: (body: EnqueueAutoDistributeBody) => void; apply: () => Promise<string>; isApplying: boolean; reset: () => void; }`
  - Poll `refetchInterval`: status `Queued`/`Running` iken `1200`, aksi `false`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/portals/admin/duties/__tests__/useAutoDistribute.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useAutoDistribute } from "../autodistribute/useAutoDistribute";
import { dutiesApi } from "../api/dutiesApi";

vi.mock("../api/dutiesApi", () => ({
  dutiesApi: {
    enqueueAutoDistribute: vi.fn(),
    getAutoDistributeStatus: vi.fn(),
    applyAutoDistribute: vi.fn(),
  },
}));

// authStore schoolId — mevcut test mock desenini diğer duty hook testlerinden kopyala
vi.mock("../../../../shared/stores/authStore", () => ({
  useAuthStore: (sel: (s: { user: { schoolId: string } }) => unknown) =>
    sel({ user: { schoolId: "school-1" } }),
}));

const wrapper = ({ children }: { children: ReactNode }) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
};

describe("useAutoDistribute", () => {
  beforeEach(() => vi.clearAllMocks());

  it("enqueues and exposes jobId", async () => {
    vi.mocked(dutiesApi.enqueueAutoDistribute).mockResolvedValue("job-1");
    vi.mocked(dutiesApi.getAutoDistributeStatus).mockResolvedValue({
      status: "Done", mode: "FromScratch",
      result: { assignments: [], missing: [], metrics: { assigned: 0, missing: 0, minLoad: 0, maxLoad: 0, loadVariance: 0, perTeacher: [] }, noSolution: false },
      hints: null, failureReason: null,
    });

    const { result } = renderHook(() => useAutoDistribute(), { wrapper });
    act(() => result.current.enqueue({ academicYearId: "y1", academicTermId: "t1", mode: "FromScratch" }));

    await waitFor(() => expect(result.current.jobId).toBe("job-1"));
    await waitFor(() => expect(result.current.status?.status).toBe("Done"));
  });

  it("calls apply with the job id", async () => {
    vi.mocked(dutiesApi.enqueueAutoDistribute).mockResolvedValue("job-9");
    vi.mocked(dutiesApi.getAutoDistributeStatus).mockResolvedValue({
      status: "Done", mode: "FillEmpty", result: null, hints: null, failureReason: null,
    });
    vi.mocked(dutiesApi.applyAutoDistribute).mockResolvedValue("roster-1");

    const { result } = renderHook(() => useAutoDistribute(), { wrapper });
    act(() => result.current.enqueue({ academicYearId: "y1", academicTermId: "t1", mode: "FillEmpty" }));
    await waitFor(() => expect(result.current.jobId).toBe("job-9"));

    const rosterId = await result.current.apply();
    expect(rosterId).toBe("roster-1");
    expect(dutiesApi.applyAutoDistribute).toHaveBeenCalledWith("job-9");
  });
});
```

> authStore mock yolunu/şeklini mevcut `useAutoGenerate` veya `useDutyData` testinden doğrula ve birebir kopyala.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- useAutoDistribute`
Expected: FAIL — hook yok.

- [ ] **Step 3: Write the hook**

```typescript
// src/portals/admin/duties/autodistribute/useAutoDistribute.ts
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../../../shared/stores/authStore"; // yolu doğrula
import { dutiesApi } from "../api/dutiesApi";
import { dutyKeys } from "../keys/dutyKeys";
import type { AutoDistributeStatus, EnqueueAutoDistributeBody } from "./types";

const POLL_INTERVAL_MS = 1200;

export interface UseAutoDistributeResult {
  jobId: string | null;
  status: AutoDistributeStatus | undefined;
  isEnqueuing: boolean;
  isPolling: boolean;
  enqueue: (body: EnqueueAutoDistributeBody) => void;
  apply: () => Promise<string>;
  isApplying: boolean;
  reset: () => void;
}

export function useAutoDistribute(): UseAutoDistributeResult {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const queryClient = useQueryClient();
  const [jobId, setJobId] = useState<string | null>(null);

  const enqueueMutation = useMutation({
    mutationFn: (body: EnqueueAutoDistributeBody) => dutiesApi.enqueueAutoDistribute(body),
    onSuccess: (id) => setJobId(id),
  });

  const statusQuery = useQuery({
    queryKey: jobId ? dutyKeys.autoDistributeJob(schoolId, jobId) : ["duties", "auto-distribute", "idle"],
    queryFn: ({ signal }) => dutiesApi.getAutoDistributeStatus(jobId!, signal),
    enabled: jobId !== null,
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      return s === "Queued" || s === "Running" ? POLL_INTERVAL_MS : false;
    },
  });

  const applyMutation = useMutation({
    mutationFn: () => dutiesApi.applyAutoDistribute(jobId!),
    onSuccess: () => {
      // çizelge/özet invalidate (mevcut dutyKeys.all desenini kullan)
      queryClient.invalidateQueries({ queryKey: dutyKeys.all(schoolId) });
    },
  });

  const isPolling =
    jobId !== null &&
    (statusQuery.isLoading ||
      statusQuery.data?.status === "Queued" ||
      statusQuery.data?.status === "Running");

  return {
    jobId,
    status: statusQuery.data,
    isEnqueuing: enqueueMutation.isPending,
    isPolling,
    enqueue: (body) => enqueueMutation.mutate(body),
    apply: () => applyMutation.mutateAsync(),
    isApplying: applyMutation.isPending,
    reset: () => setJobId(null),
  };
}
```
> `dutyKeys.all` ve authStore selector şeklini mevcut hook'lardan doğrula. `useAutoGenerate.ts`'i yan referans olarak aç.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- useAutoDistribute`
Expected: PASS (2 test).

- [ ] **Step 5: Commit**

```bash
D=$(date +%F)
git add src/portals/admin/duties/autodistribute/useAutoDistribute.ts \
        src/portals/admin/duties/__tests__/useAutoDistribute.test.tsx
git commit -m "$D feat,test: useAutoDistribute hook'u (enqueue→poll→apply) eklendi."
```

---

### Task 4: `DutyAutoDistributeDrawer` sihirbazı

**Files:**
- Create: `src/portals/admin/duties/autodistribute/DutyAutoDistributeDrawer.tsx`
- Test: `src/portals/admin/duties/__tests__/DutyAutoDistributeDrawer.test.tsx`

**Interfaces:**
- Consumes: `useAutoDistribute` (Task 3), `DutyGrid` (`../components/DutyGrid`), i18n `autoDistribute.*`.
- Produces:
  - `DutyAutoDistributeDrawer({ academicYearId, academicTermId, locations, days, relieverEnabled, onClose, onApplied })`
    - `onApplied: () => void` — uygula başarılı olunca (drawer kapanır, sayfa çizelge sekmesini tazeler).
  - Aşamalar: **settings** (mod toggle `FromScratch`/`FillEmpty` + politika rozetleri + "Dağıt") → **distributing** (`isPolling`) → **result** (`DutyGrid` önizleme + metrikler + hints + "Uygula") / **error** (`status==="Failed"`).

- [ ] **Step 1: Write the failing test**

```tsx
// src/portals/admin/duties/__tests__/DutyAutoDistributeDrawer.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "../../../../shared/i18n";
import { DutyAutoDistributeDrawer } from "../autodistribute/DutyAutoDistributeDrawer";
import * as hookModule from "../autodistribute/useAutoDistribute";

const baseLocations = [{ id: "kat1", name: "1. Kat", type: 0, icon: null, capacity: 1, isActive: true }];

function mockHook(overrides: Partial<ReturnType<typeof hookModule.useAutoDistribute>>) {
  vi.spyOn(hookModule, "useAutoDistribute").mockReturnValue({
    jobId: null, status: undefined, isEnqueuing: false, isPolling: false,
    enqueue: vi.fn(), apply: vi.fn().mockResolvedValue("r1"), isApplying: false, reset: vi.fn(),
    ...overrides,
  });
}

describe("DutyAutoDistributeDrawer", () => {
  it("shows settings stage with mode toggle and start button", () => {
    mockHook({});
    render(
      <DutyAutoDistributeDrawer
        academicYearId="y1" academicTermId="t1" locations={baseLocations}
        days={[1, 2, 3, 4, 5]} relieverEnabled={false} onClose={vi.fn()} onApplied={vi.fn()}
      />,
    );
    expect(screen.getByText("Adil Otomatik Dağıt")).toBeInTheDocument();
    expect(screen.getByText("Sıfırdan kur")).toBeInTheDocument();
    expect(screen.getByText("Boşları doldur")).toBeInTheDocument();
  });

  it("calls enqueue with selected mode on start", () => {
    const enqueue = vi.fn();
    mockHook({ enqueue });
    render(
      <DutyAutoDistributeDrawer
        academicYearId="y1" academicTermId="t1" locations={baseLocations}
        days={[1, 2, 3, 4, 5]} relieverEnabled={false} onClose={vi.fn()} onApplied={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Dağıt" }));
    expect(enqueue).toHaveBeenCalledWith({ academicYearId: "y1", academicTermId: "t1", mode: "FromScratch" });
  });

  it("shows result metrics and hints when status Done with missing", () => {
    mockHook({
      jobId: "j1",
      status: {
        status: "Done", mode: "FromScratch",
        result: {
          assignments: [], missing: [{ day: 2, locationId: "kat1" }],
          metrics: { assigned: 3, missing: 1, minLoad: 0, maxLoad: 1, loadVariance: 0.2, perTeacher: [] },
          noSolution: false,
        },
        hints: ["not-enough-teachers"], failureReason: null,
      },
    });
    render(
      <DutyAutoDistributeDrawer
        academicYearId="y1" academicTermId="t1" locations={baseLocations}
        days={[1, 2, 3, 4, 5]} relieverEnabled={false} onClose={vi.fn()} onApplied={vi.fn()}
      />,
    );
    expect(screen.getByText("Yeterli uygun öğretmen yok.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Uygula" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- DutyAutoDistributeDrawer`
Expected: FAIL — bileşen yok.

- [ ] **Step 3: Write the component**

```tsx
// src/portals/admin/duties/autodistribute/DutyAutoDistributeDrawer.tsx
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { DutyGrid } from "../components/DutyGrid";
import { useAutoDistribute } from "./useAutoDistribute";
import type { DutyDistributionMode } from "./types";
// DutyLocationDto / DutyAssignmentDto tiplerini mevcut duties tip dosyasından import et

interface Props {
  academicYearId: string;
  academicTermId: string;
  locations: DutyLocationDto[];
  days: number[];
  relieverEnabled: boolean;
  onClose: () => void;
  onApplied: () => void;
}

export function DutyAutoDistributeDrawer({
  academicYearId, academicTermId, locations, days, relieverEnabled, onClose, onApplied,
}: Props) {
  const { t } = useTranslation("duties");
  const [mode, setMode] = useState<DutyDistributionMode>("FromScratch");
  const { status, isPolling, enqueue, apply, isApplying } = useAutoDistribute();

  const start = () => enqueue({ academicYearId, academicTermId, mode });

  const handleApply = async () => {
    await apply();
    onApplied();
    onClose();
  };

  const result = status?.result ?? null;
  const isFailed = status?.status === "Failed";
  const isDone = status?.status === "Done" || status?.status === "NoSolution";

  return (
    <div className="duty-autodist-drawer" role="dialog" aria-label={t("autoDistribute.title")}>
      <header>
        <h2>{t("autoDistribute.title")}</h2>
        <p>{t("autoDistribute.subtitle")}</p>
        <button onClick={onClose} aria-label={t("actions.close", "Kapat")}>×</button>
      </header>

      {/* SETTINGS */}
      {!status && !isPolling && (
        <section>
          <fieldset>
            <legend>{t("autoDistribute.mode.label")}</legend>
            <label>
              <input type="radio" name="mode" checked={mode === "FromScratch"}
                onChange={() => setMode("FromScratch")} />
              {t("autoDistribute.mode.fromScratch")}
              <span>{t("autoDistribute.mode.fromScratchHint")}</span>
            </label>
            <label>
              <input type="radio" name="mode" checked={mode === "FillEmpty"}
                onChange={() => setMode("FillEmpty")} />
              {t("autoDistribute.mode.fillEmpty")}
              <span>{t("autoDistribute.mode.fillEmptyHint")}</span>
            </label>
          </fieldset>
          <button onClick={start}>{t("autoDistribute.start")}</button>
        </section>
      )}

      {/* DISTRIBUTING */}
      {isPolling && <section aria-busy="true">{t("autoDistribute.distributing")}</section>}

      {/* ERROR */}
      {isFailed && (
        <section>
          <h3>{t("autoDistribute.errorTitle")}</h3>
          <p>{t("autoDistribute.errorBody")}</p>
        </section>
      )}

      {/* RESULT */}
      {isDone && result && (
        <section>
          <h3>{t("autoDistribute.result.title")}</h3>
          <dl className="duty-autodist-metrics">
            <div><dt>{t("autoDistribute.result.assigned")}</dt><dd>{result.metrics.assigned}</dd></div>
            <div><dt>{t("autoDistribute.result.missing")}</dt><dd>{result.metrics.missing}</dd></div>
            <div><dt>{t("autoDistribute.result.balance")}</dt>
              <dd>{result.metrics.minLoad}–{result.metrics.maxLoad}</dd></div>
          </dl>

          {status?.hints && status.hints.length > 0 && (
            <div className="duty-autodist-hints">
              <strong>{t("autoDistribute.hints.title")}</strong>
              <ul>
                {status.hints.map((code) => (
                  <li key={code}>{t(`autoDistribute.hints.${code}`, code)}</li>
                ))}
              </ul>
            </div>
          )}

          <DutyGrid
            days={days}
            locations={locations}
            assignments={result.assignments.map((a) => ({
              // AutoDistributeAssignment → DutyAssignmentDto şekli (DutyGrid'in beklediği alanlar)
              teacherId: a.teacherId, day: a.day, locationId: a.locationId, relieverId: a.relieverId,
              // teacherName/relieverName: DutyGrid bunları nasıl alıyor? — Step 3 NOT
            }))}
            relieverEnabled={relieverEnabled}
            today={null}
            onCellClick={() => {}}
          />

          <button onClick={handleApply} disabled={isApplying}>
            {isApplying ? t("autoDistribute.result.applying") : t("autoDistribute.result.apply")}
          </button>
        </section>
      )}
    </div>
  );
}
```
> **Step 3 NOT'ları:**
> - `DutyLocationDto`/`DutyAssignmentDto` tiplerini mevcut duties tip dosyasından import et (DutyGrid imzasıyla uyumlu olmalı).
> - **DutyGrid teacherName eşlemesi:** `DutyGrid` öğretmen adını nasıl çözüyor? `DutyGrid.tsx`'i aç — `assignments` içinde `teacherName` mi bekliyor yoksa ayrı bir teacher lookup mı? Eğer `teacherName` bekliyorsa, drawer'a `teachers` (id→ad) prop'u ekle (`useDutyContext().teachers`) ve map'te adı doldur. Bu, görsel önizleme için gereklidir; testte ad gösterimi zorlanmıyor ama gerçek kullanımda gerekli.
> - shadcn Drawer/Sheet primitive'ini mevcut duty modallarının kullandığı şekilde sar (`DtaPublishModal`/`DtaVersionDrawer` desenine bak); yukarıdaki düz `<div>` iskelet — gerçek shadcn sarmalayıcıyla değiştir, CSS sınıflarını `duties.css`'e ekle.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- DutyAutoDistributeDrawer`
Expected: PASS (3 test).

- [ ] **Step 5: Commit**

```bash
D=$(date +%F)
git add src/portals/admin/duties/autodistribute/DutyAutoDistributeDrawer.tsx \
        src/portals/admin/duties/__tests__/DutyAutoDistributeDrawer.test.tsx
git commit -m "$D feat,test: DutyAutoDistributeDrawer sihirbazı (ayar→dağıt→sonuç→uygula) eklendi."
```

---

### Task 5: DutySummaryBar butonunu aktifleştir + biweekly gate + DutyAdminPage wiring

**Files:**
- Modify: `src/portals/admin/duties/components/DutySummaryBar.tsx` (disabled kaldır, biweekly gate)
- Modify: `src/portals/admin/duties/DutyAdminPage.tsx` (drawer state + `onOpenAuto` + `onApplied`)
- Test: `src/portals/admin/duties/__tests__/DutySummaryBar.autodistribute.test.tsx`

**Interfaces:**
- Consumes: `DutyAutoDistributeDrawer` (Task 4), `useDutyContext` (termId, academicYearId, relieverEnabled, weeklyFrequency, dayPattern), mevcut `onOpenAuto` prop'u.
- Produces: DutySummaryBar "Adil Otomatik Dağıt" butonu — `weeklyFrequency === 2` (OnceEveryTwoWeeks) ise `disabled` + `title={t("autoDistribute.biweeklyUnsupported")}`, aksi tıklanınca `onOpenAuto()`. DutyAdminPage drawer'ı açar; `onApplied` → çizelge sekmesine geç + `dutyKeys` invalidate (hook zaten yapıyor).

- [ ] **Step 1: Write the failing test (biweekly gate)**

```tsx
// src/portals/admin/duties/__tests__/DutySummaryBar.autodistribute.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "../../../../shared/i18n";
import { DutySummaryBar } from "../components/DutySummaryBar";

// DutySummaryBar'ın gerçek prop'larını mevcut dosyadan doğrula; aşağıdaki minimum set örnektir.
function renderBar(props: Partial<React.ComponentProps<typeof DutySummaryBar>>) {
  const base = {
    onOpenAuto: vi.fn(),
    weeklyFrequency: 1, // OncePerWeek
    // ...diğer zorunlu prop'lar (totalAssigned, missing, vb.) — mevcut imzadan doldur
  };
  render(<DutySummaryBar {...(base as React.ComponentProps<typeof DutySummaryBar>)} {...props} />);
  return base;
}

describe("DutySummaryBar auto-distribute button", () => {
  it("enabled and calls onOpenAuto when frequency not biweekly", () => {
    const base = renderBar({ weeklyFrequency: 1 });
    const btn = screen.getByRole("button", { name: "Adil Otomatik Dağıt" });
    expect(btn).not.toBeDisabled();
    fireEvent.click(btn);
    expect(base.onOpenAuto).toHaveBeenCalled();
  });

  it("disabled with tooltip when frequency is biweekly (K-2c-3)", () => {
    renderBar({ weeklyFrequency: 2 }); // OnceEveryTwoWeeks
    const btn = screen.getByRole("button", { name: "Adil Otomatik Dağıt" });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute("title", "İki haftada bir sıklığı otomatik dağıtımda henüz desteklenmiyor.");
  });
});
```

> DutySummaryBar'ın mevcut prop imzasını dosyadan doğrulayıp `renderBar` base'ini gerçek zorunlu prop'larla doldur. `weeklyFrequency` prop'u yoksa ekle (kaynağı `useDutyContext`/`useDutyPolicy`).

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- DutySummaryBar.autodistribute`
Expected: FAIL — buton disabled sabit / `weeklyFrequency` prop yok.

- [ ] **Step 3: Update DutySummaryBar button**

`DutySummaryBar.tsx` (mevcut satır 173–181) butonunu değiştir:

```tsx
<button
  className="btn btn-primary"
  disabled={weeklyFrequency === 2 /* OnceEveryTwoWeeks */}
  title={weeklyFrequency === 2 ? t("autoDistribute.biweeklyUnsupported") : undefined}
  aria-label={t("actions.autoDistribute")}
  onClick={onOpenAuto}
>
  <Sparkles size={16} /> {t("actions.autoDistribute")}
</button>
```
`weeklyFrequency: number` prop'unu bileşen Props arayüzüne ekle. (`actions.autoDistribute` zaten "Adil Otomatik Dağıt" — i18n'de mevcut.)

- [ ] **Step 4: Wire DutyAdminPage**

`DutyAdminPage.tsx`:
- `const [autoOpen, setAutoOpen] = useState(false);`
- `useDutyContext()`'ten `weeklyFrequency` (ve `academicYearId`, `termId`, `relieverEnabled`, `days`) al; `DutySummaryBar`'a `weeklyFrequency={weeklyFrequency}` ve `onOpenAuto={() => setAutoOpen(true)}` geç.
- Locations: `useDutyLocations()` (aktif olanlar) — DutyGrid önizlemesi için.
- Render:
```tsx
{autoOpen && (
  <DutyAutoDistributeDrawer
    academicYearId={academicYearId}
    academicTermId={termId}
    locations={activeLocations}
    days={days}
    relieverEnabled={relieverEnabled}
    onClose={() => setAutoOpen(false)}
    onApplied={() => setActiveTab("roster")} // çizelge sekmesine dön; hook invalidate ediyor
  />
)}
```
> `setActiveTab`/sekme state adını mevcut DutyAdminPage'den doğrula. `activeLocations`/`days`/context alanlarını mevcut hook'lardan al.

- [ ] **Step 5: Run tests + build**

Run:
```bash
npm run test -- DutySummaryBar.autodistribute
npm run build
```
Expected: PASS (2 test); build temiz.

- [ ] **Step 6: Commit**

```bash
D=$(date +%F)
git add src/portals/admin/duties/components/DutySummaryBar.tsx \
        src/portals/admin/duties/DutyAdminPage.tsx \
        src/portals/admin/duties/__tests__/DutySummaryBar.autodistribute.test.tsx
git commit -m "$D feat,test: nöbet 'Adil Otomatik Dağıt' butonu aktifleştirildi + drawer bağlandı + biweekly gate eklendi."
```

---

### Task 6: Tam paket + doküman (ui-flows + completion_status FE)

**Files:**
- Modify: `.claude/docs/modules/timetable/ui-flows.md` (otomatik dağıtım akışı)
- Modify: `.claude/docs/modules/timetable/completion_status.md` (Faz 4/Dilim 2c FE girdisi)

- [ ] **Step 1: Run full web suite**

Run:
```bash
npm run test
npm run build
```
Expected: tüm vitest yeşil (yeni 7 test dahil: useAutoDistribute 2 + drawer 3 + summaryBar 2); build temiz.

- [ ] **Step 2: Document the flow**

`ui-flows.md`'e nöbet otomatik dağıtım akışını ekle: buton (biweekly disabled) → drawer (mod seç → Dağıt) → poll → sonuç (DutyGrid önizleme + metrik + hints) → Uygula → çizelge sekmesi tazelenir.

- [ ] **Step 3: Update completion_status.md (FE girdisi)**

Faz 4/Dilim 2c FE'yi "✅ Tamamlanan Yapılar" altına ekle (drawer + hook + buton aktivasyonu + biweekly gate + test sayıları + tam paket sonucu). İlerleme/`Güncel` tarihini bump et.

- [ ] **Step 4: Commit**

```bash
D=$(date +%F)
git add .claude/docs/modules/timetable/
git commit -m "$D docs: Nöbet otomatik dağıtım (Faz 4/Dilim 2c) FE — ui-flows + completion_status güncellendi."
```

---

## Self-Review (plan yazarı tarafından koşuldu)

**Spec coverage:**
- K-2c-3 biweekly disabled → Task 5 (gate testi `weeklyFrequency === 2`). ✅
- K-2c-5 iki mod toggle → Task 4 (mod radio + enqueue body). ✅
- K-2c-8 tek öneri → drawer tek `result` gösterir (aday listesi yok). ✅
- K-2c-9 öner≠uygula → Task 3 hook (enqueue→poll→apply) + Task 4 "Uygula". ✅
- Sonuç önizleme + eksik/hints → Task 4 (DutyGrid + metrik + hints). ✅
- Tenant-scope key → Task 2 (`tenantScopedKey`). ✅

**Placeholder scan:** "doğrula" notları gerçek referans dosyalarına işaret eder (DutyGrid teacherName eşlemesi, DutySummaryBar prop imzası, authStore mock yolu, shadcn Drawer sarmalayıcı). Kod adımları gerçek JSX/TS içerir.

**Type consistency:** `DutyDistributionMode` ("FromScratch"|"FillEmpty") hook + drawer + body'de aynı; `AutoDistributeStatus`/`AutoDistributeResult` Task 2'de tanımlı, Task 3/4'te aynı kullanılır; `day: number` BE ile hizalı.

**Bilinçli sınırlar:** DutyGrid önizleme öğretmen-adı eşlemesi (teachers lookup) Task 4 NOT'ta işaretli — DutyGrid'in gerçek imzasına göre bağlanacak. shadcn Drawer sarmalayıcı mevcut duty modal desenine uyarlanacak.
