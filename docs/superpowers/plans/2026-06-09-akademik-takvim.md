# Akademik Takvim (Ekran 1) + Mock Servis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `oksis-web` admin portalına, tamamen mock servisle çalışan Akademik Takvim ekranını (`/admin/academic-calendar`) ekle; gerçek .NET backend sonra yapılacak.

**Architecture:** Mevcut `academic-sessions` modülünün dosya deseni izlenir. Veri katmanı `VITE_USE_MOCK` flag ile `calendarApi.mock.ts` (oturum-içi bellek) ↔ `calendarApi.real.ts` (httpClient) arasında seçilir. React Query key'leri tenant-scoped. Sezon ekseni mevcut sihirbaza (`/admin/academic-sessions`) ve `seasonDraftApi`'ye bağlanır; topbar aktif sezonu değiştirilmez.

**Tech Stack:** React 18 + TS · Vite · TanStack Query v5 · Zustand (authStore) · RHF + Zod · React Router v6 · i18next · shadcn/ui + Tailwind · Vitest + Testing Library + MSW.

**Spec:** `docs/superpowers/specs/2026-06-09-akademik-takvim-design.md`

---

## Notlar (tüm task'lar için geçerli)

- **Çalışma dizini:** `oksis-web/`. Tüm yollar bu repodan görelidir.
- **Test koşumu:** `npm run test -- <path>` (vitest run).
- **schoolId kaynağı:** `useAuthStore((s) => s.user?.schoolId)` (bkz. `teachers/hooks`).
- **Named export zorunlu** (default export yasak). **Inline style yasak** (Tailwind/`cn`). **`any` yasak**.
- **Hardcoded Türkçe yasak** — tüm metinler `academic-calendar` i18n namespace'inden.
- **Commit formatı:** `2026-06-09 <type>: Türkçe özet.` + `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. Her task sonunda commit.
- **İzin:** Bu fazda yeni izin eklenmez; route guard `PERMISSIONS.ACADEMIC_SESSIONS_VIEW` kullanır.

---

## File Structure

```
src/portals/admin/academic-calendar/
  index.ts                       # named re-export: AcademicCalendarPage
  types/index.ts                 # CalendarEventType, SeasonAxisStatus, CalendarEventDto, CreateCalendarEventInput, SeasonAxisItem
  lib/eventTypes.ts              # EVENT_TYPE_META (renk/soft/i18n key) + bant boyama önceliği
  keys/calendarKeys.ts           # tenant-scoped query key fabrikası
  api/calendarApi.ts             # CalendarApi interface + VITE_USE_MOCK flag seçici
  api/calendarApi.real.ts        # httpClient impl (backend gelince çalışır)
  api/calendarApi.mock.ts        # oturum-içi bellek store impl
  api/calendarMockData.ts        # seed sezonlar + etkinlikler + dönemler
  schemas/calendarEventSchema.ts # Zod (add-event formu)
  hooks/useCalendarSeasonsQuery.ts
  hooks/useCalendarEventsQuery.ts
  hooks/useAddEventMutation.ts
  components/SeasonAxisBar.tsx
  components/CalendarKpiRow.tsx
  components/MonthCalendar.tsx
  components/TermStructurePanel.tsx
  components/UpcomingEventsPanel.tsx
  components/EventTypeLegend.tsx
  components/AddEventModal.tsx
  pages/AcademicCalendarPage.tsx
  __tests__/*.test.{ts,tsx}
src/shared/i18n/locales/{tr,en}/academic-calendar.json   # yeni namespace
src/shared/i18n/index.ts                                  # namespace kaydı (modify)
src/app/routes.tsx                                        # route ekleme (modify)
src/app/layouts/AdminLayout.tsx                           # "Akademik Takvim" nav item (modify)
```

---

### Task 1: Tipler, event-type meta ve query key fabrikası

**Files:**
- Create: `src/portals/admin/academic-calendar/types/index.ts`
- Create: `src/portals/admin/academic-calendar/lib/eventTypes.ts`
- Create: `src/portals/admin/academic-calendar/keys/calendarKeys.ts`
- Test: `src/portals/admin/academic-calendar/__tests__/calendarKeys.test.ts`

- [ ] **Step 1: Tipleri yaz**

`types/index.ts`:
```ts
/** Akademik takvim etkinlik türleri (handoff §Etkinlik Türü Paleti). */
export type CalendarEventType =
  | 'term' | 'exam' | 'holiday' | 'meeting' | 'activity' | 'admin';

/** Sezon ekseni durum eşlemesi (backend status → eksen durumu). */
export type SeasonAxisStatus = 'active' | 'archive' | 'planning';

export interface CalendarEventDto {
  id: string;
  academicSessionId: string;
  type: CalendarEventType;
  title: string;
  startDate: string;          // ISO yyyy-MM-dd
  endDate: string | null;     // çok-günlü ise dolu, değilse null
  time: string | null;        // 'HH:mm' opsiyonel
  isMultiDay: boolean;
  source: 'system' | 'user';
}

export interface CreateCalendarEventInput {
  type: CalendarEventType;
  title: string;
  startDate: string;
  endDate: string | null;
  time: string | null;
}

export interface SeasonAxisItem {
  id: string;
  name: string;               // '2025–2026'
  status: SeasonAxisStatus;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}
```

- [ ] **Step 2: Event-type meta + boyama önceliğini yaz**

`lib/eventTypes.ts`:
```ts
import type { CalendarEventType } from '../types';

export interface EventTypeMeta {
  /** i18n key: academic-calendar:eventTypes.<key> */
  labelKey: string;
  color: string;
  soft: string;
}

export const EVENT_TYPE_META: Record<CalendarEventType, EventTypeMeta> = {
  term:     { labelKey: 'eventTypes.term',     color: '#1B2B5E', soft: '#E7EAF5' },
  exam:     { labelKey: 'eventTypes.exam',     color: '#991B1B', soft: '#FCE7E7' },
  holiday:  { labelKey: 'eventTypes.holiday',  color: '#0E7A5A', soft: '#D7F5EC' },
  meeting:  { labelKey: 'eventTypes.meeting',  color: '#4F6BFF', soft: '#E6EAFF' },
  activity: { labelKey: 'eventTypes.activity', color: '#B05A0A', soft: '#FCEFDB' },
  admin:    { labelKey: 'eventTypes.admin',    color: '#5B21B6', soft: '#EDE7FB' },
};

export const EVENT_TYPE_ORDER: CalendarEventType[] =
  ['term', 'exam', 'holiday', 'meeting', 'activity', 'admin'];

/** Çok-günlü bant hücre boyama önceliği (büyük = öncelikli). */
const BAND_PRIORITY: Record<CalendarEventType, number> = {
  holiday: 6, exam: 5, term: 4, admin: 3, meeting: 2, activity: 1,
};

/** Bir hücredeki çok-günlü etkinlikler arasından zemini boyayacak türü seçer. */
export function dominantBandType(
  types: CalendarEventType[],
): CalendarEventType | null {
  if (types.length === 0) return null;
  return types.reduce((best, t) =>
    BAND_PRIORITY[t] > BAND_PRIORITY[best] ? t : best,
  );
}
```

- [ ] **Step 3: Key fabrikası testini yaz (failing)**

`__tests__/calendarKeys.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { calendarKeys } from '../keys/calendarKeys';

describe('calendarKeys', () => {
  it('tüm key''ler schoolId prefix''i taşır', () => {
    expect(calendarKeys.seasons('s1')[0]).toBe('s1');
    expect(calendarKeys.events('s1', 'sess1', 2026, 6)[0]).toBe('s1');
    expect(calendarKeys.terms('s1', 'sess1')[0]).toBe('s1');
  });

  it('events key ay/yıl ayrımı yapar', () => {
    const a = calendarKeys.events('s1', 'sess1', 2026, 6);
    const b = calendarKeys.events('s1', 'sess1', 2026, 7);
    expect(a).not.toEqual(b);
  });

  it('schoolId yoksa anonymous prefix''i kullanır', () => {
    expect(calendarKeys.seasons(null)[0]).toBe('anonymous');
  });
});
```

- [ ] **Step 4: Testi koş — fail etmeli**

Run: `npm run test -- src/portals/admin/academic-calendar/__tests__/calendarKeys.test.ts`
Expected: FAIL — `calendarKeys` modülü yok.

- [ ] **Step 5: Key fabrikasını yaz**

`keys/calendarKeys.ts`:
```ts
import { tenantScopedKey } from '../../../../shared/config/tenant';

/**
 * Akademik takvim sorguları için tenant-scope'lu React Query key fabrikası.
 * Tüm key'ler schoolId prefix'i taşır (cache cross-tenant karışmaz).
 */
export const calendarKeys = {
  all: (schoolId: string | null | undefined) =>
    tenantScopedKey(schoolId, ['academic-calendar'] as const),
  seasons: (schoolId: string | null | undefined) =>
    tenantScopedKey(schoolId, ['academic-calendar', 'seasons'] as const),
  events: (
    schoolId: string | null | undefined,
    seasonId: string,
    year: number,
    month: number,
  ) =>
    tenantScopedKey(
      schoolId,
      ['academic-calendar', 'events', seasonId, year, month] as const,
    ),
  terms: (schoolId: string | null | undefined, seasonId: string) =>
    tenantScopedKey(schoolId, ['academic-calendar', 'terms', seasonId] as const),
};
```

- [ ] **Step 6: Testi koş — geçmeli**

Run: `npm run test -- src/portals/admin/academic-calendar/__tests__/calendarKeys.test.ts`
Expected: PASS (3 test).

- [ ] **Step 7: Commit**

```bash
git add src/portals/admin/academic-calendar/types src/portals/admin/academic-calendar/lib src/portals/admin/academic-calendar/keys src/portals/admin/academic-calendar/__tests__/calendarKeys.test.ts
git commit -m "2026-06-09 feat,test: Akademik Takvim tip/meta/query-key katmanı eklendi." -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Mock seed verisi + mock API (oturum-içi bellek)

**Files:**
- Create: `src/portals/admin/academic-calendar/api/calendarMockData.ts`
- Create: `src/portals/admin/academic-calendar/api/calendarApi.mock.ts`
- Test: `src/portals/admin/academic-calendar/__tests__/calendarApi.mock.test.ts`

Mevcut `AcademicTermDto` tipi `academic-sessions/types`'tan import edilir.

- [ ] **Step 1: Seed verisini yaz**

`api/calendarMockData.ts`:
```ts
import type { AcademicTermDto } from '../../academic-sessions/types';
import type { CalendarEventDto, SeasonAxisItem } from '../types';

export const SESSION_ARCHIVE = 'sess-2024-2025';
export const SESSION_ACTIVE = 'sess-2025-2026';
export const SESSION_PLANNING = 'sess-2026-2027';

export const seedSeasons: SeasonAxisItem[] = [
  { id: SESSION_ARCHIVE, name: '2024–2025', status: 'archive',
    startDate: '2024-09-01', endDate: '2025-06-30', isCurrent: false },
  { id: SESSION_ACTIVE, name: '2025–2026', status: 'active',
    startDate: '2025-09-01', endDate: '2026-06-30', isCurrent: true },
  { id: SESSION_PLANNING, name: '2026–2027', status: 'planning',
    startDate: '2026-09-01', endDate: '2027-06-30', isCurrent: false },
];

const term = (
  id: string, sessionId: string, termTypeId: string,
  start: string, end: string, status: AcademicTermDto['status'],
): AcademicTermDto => ({
  id, academicSessionId: sessionId, termTypeId,
  startDate: start, endDate: end, status, closedAt: null,
});

export const seedTerms: Record<string, AcademicTermDto[]> = {
  [SESSION_ACTIVE]: [
    term('t-act-1', SESSION_ACTIVE, 'first',  '2025-09-08', '2026-01-16', 'Closed'),
    term('t-act-2', SESSION_ACTIVE, 'second', '2026-02-02', '2026-06-26', 'Active'),
  ],
  [SESSION_ARCHIVE]: [
    term('t-arc-1', SESSION_ARCHIVE, 'first',  '2024-09-08', '2025-01-16', 'Closed'),
    term('t-arc-2', SESSION_ARCHIVE, 'second', '2025-02-02', '2025-06-26', 'Closed'),
  ],
};

const ev = (
  id: string, sessionId: string, type: CalendarEventDto['type'],
  title: string, startDate: string,
  endDate: string | null = null, time: string | null = null,
): CalendarEventDto => ({
  id, academicSessionId: sessionId, type, title,
  startDate, endDate, time, isMultiDay: endDate !== null, source: 'system',
});

/** Seed etkinlikler. Aktif sezon Haziran 2026 yoğun (handoff ekran görüntüsü). */
export const seedEvents: CalendarEventDto[] = [
  ev('e1', SESSION_ACTIVE, 'exam',     'Bilim Şenliği Sınavı', '2026-06-05', null, '09:00'),
  ev('e2', SESSION_ACTIVE, 'exam',     'LGS Sınavı',           '2026-06-07', null, '09:30'),
  ev('e3', SESSION_ACTIVE, 'exam',     'Yıl Sonu Sınavları',   '2026-06-08', '2026-06-12'),
  ev('e4', SESSION_ACTIVE, 'meeting',  'Sınıf Yükseltme',      '2026-06-10', null, '14:00'),
  ev('e5', SESSION_ACTIVE, 'admin',    'Ödeme Hatırlatma',     '2026-06-16'),
  ev('e6', SESSION_ACTIVE, 'activity', 'Karne Hazırlık',       '2026-06-19'),
  ev('e7', SESSION_ACTIVE, 'meeting',  'Veli Bilgilendirme',   '2026-06-22', null, '18:00'),
  // Arşiv sezon (salt-okunur)
  ev('a1', SESSION_ARCHIVE, 'holiday', 'Kurban Bayramı',       '2025-06-26', '2025-06-30'),
  ev('a2', SESSION_ARCHIVE, 'exam',    'LGS Sınavı',           '2025-06-07', null, '09:30'),
  ev('a3', SESSION_ARCHIVE, 'exam',    'Yıl Sonu Sınavları',   '2025-06-08', '2025-06-12'),
];
```

- [ ] **Step 2: Mock API testini yaz (failing)**

`__tests__/calendarApi.mock.test.ts`:
```ts
import { describe, expect, it, beforeEach } from 'vitest';
import { mockCalendarApi, __resetMockCalendar } from '../api/calendarApi.mock';
import { SESSION_ACTIVE } from '../api/calendarMockData';

beforeEach(() => __resetMockCalendar());

describe('mockCalendarApi', () => {
  it('listSeasons sezon eksenini status ile döndürür', async () => {
    const seasons = await mockCalendarApi.listSeasons();
    expect(seasons.find((s) => s.status === 'active')?.isCurrent).toBe(true);
    expect(seasons.map((s) => s.status)).toContain('planning');
  });

  it('listEvents sadece istenen ayın etkinliklerini döndürür', async () => {
    const june = await mockCalendarApi.listEvents(SESSION_ACTIVE, 2026, 6);
    expect(june.length).toBeGreaterThan(0);
    const may = await mockCalendarApi.listEvents(SESSION_ACTIVE, 2026, 5);
    expect(may).toHaveLength(0);
  });

  it('çok-günlü etkinlik kapsadığı her ayda görünür', async () => {
    const events = await mockCalendarApi.listEvents(SESSION_ACTIVE, 2026, 6);
    expect(events.some((e) => e.title === 'Yıl Sonu Sınavları')).toBe(true);
  });

  it('addEvent etkinliği ekler ve sonraki listEvents döndürür', async () => {
    const created = await mockCalendarApi.addEvent(SESSION_ACTIVE, {
      type: 'meeting', title: 'Yeni Toplantı',
      startDate: '2026-06-15', endDate: null, time: '10:00',
    });
    expect(created.id).toBeTruthy();
    expect(created.source).toBe('user');
    const june = await mockCalendarApi.listEvents(SESSION_ACTIVE, 2026, 6);
    expect(june.some((e) => e.id === created.id)).toBe(true);
  });

  it('listTerms sezona ait dönemleri döndürür', async () => {
    const terms = await mockCalendarApi.listTerms(SESSION_ACTIVE);
    expect(terms).toHaveLength(2);
  });
});
```

- [ ] **Step 3: Testi koş — fail etmeli**

Run: `npm run test -- src/portals/admin/academic-calendar/__tests__/calendarApi.mock.test.ts`
Expected: FAIL — `calendarApi.mock` yok.

- [ ] **Step 4: Mock API'yi yaz**

`api/calendarApi.mock.ts`:
```ts
import type { AcademicTermDto } from '../../academic-sessions/types';
import type {
  CalendarEventDto, CreateCalendarEventInput, SeasonAxisItem,
} from '../types';
import type { CalendarApi } from './calendarApi';
import { seedEvents, seedSeasons, seedTerms } from './calendarMockData';

/** Oturum-içi mutable store. __resetMockCalendar() ile testlerde sıfırlanır. */
let events: CalendarEventDto[] = [...seedEvents];
let seq = 0;

export function __resetMockCalendar(): void {
  events = [...seedEvents];
  seq = 0;
}

const delay = <T,>(value: T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), 120));

/** Etkinlik verilen yıl/ayla kesişiyor mu (çok-günlü dahil). */
function intersectsMonth(e: CalendarEventDto, year: number, month: number): boolean {
  const start = new Date(e.startDate);
  const end = e.endDate ? new Date(e.endDate) : start;
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0);
  return start <= monthEnd && end >= monthStart;
}

export const mockCalendarApi: CalendarApi = {
  listSeasons: (): Promise<SeasonAxisItem[]> => delay([...seedSeasons]),

  listTerms: (seasonId: string): Promise<AcademicTermDto[]> =>
    delay(seedTerms[seasonId] ?? []),

  listEvents: (
    seasonId: string, year: number, month: number,
  ): Promise<CalendarEventDto[]> =>
    delay(
      events.filter(
        (e) => e.academicSessionId === seasonId && intersectsMonth(e, year, month),
      ),
    ),

  addEvent: (
    seasonId: string, input: CreateCalendarEventInput,
  ): Promise<CalendarEventDto> => {
    const created: CalendarEventDto = {
      id: `user-ev-${++seq}`,
      academicSessionId: seasonId,
      type: input.type,
      title: input.title,
      startDate: input.startDate,
      endDate: input.endDate,
      time: input.time,
      isMultiDay: input.endDate !== null,
      source: 'user',
    };
    events = [...events, created];
    return delay(created);
  },
};
```

- [ ] **Step 5: Testi koş — geçmeli**

Run: `npm run test -- src/portals/admin/academic-calendar/__tests__/calendarApi.mock.test.ts`
Expected: PASS (5 test).

> Not: `CalendarApi` interface'i Task 3'te `calendarApi.ts` içinde tanımlanacak; bu import şu an çözülemeyebilir. Task 3 ile birlikte yeşile döner. Bu task'ı commit'lemeden önce Task 3'ün interface'ini de ekleyebilirsin VEYA Task 3 testini de aynı anda koş. Sıralı çalış: Task 3'ü tamamla, sonra ikisini birlikte commit et.

- [ ] **Step 6: Commit (Task 3 ile birlikte — aşağıya bakın)**

Bu task'ın commit'i Task 3'ün `calendarApi.ts` interface'i yazıldıktan sonra atılır.

---

### Task 3: API interface + gerçek API stub + flag seçici

**Files:**
- Create: `src/portals/admin/academic-calendar/api/calendarApi.real.ts`
- Create: `src/portals/admin/academic-calendar/api/calendarApi.ts`
- Test: `src/portals/admin/academic-calendar/__tests__/calendarApi.selector.test.ts`

- [ ] **Step 1: Gerçek API stub'ını yaz**

`api/calendarApi.real.ts` (envelope unwrap deseni `academicSessionsApi` ile aynı):
```ts
import { httpClient } from '../../../../shared/api/httpClient';
import type { AcademicTermDto } from '../../academic-sessions/types';
import type {
  CalendarEventDto, CreateCalendarEventInput, SeasonAxisItem,
} from '../types';
import type { CalendarApi } from './calendarApi';

interface ApiEnvelope<T> {
  data: T;
  errors?: Array<{ code: string; message: string }> | null;
}
const unwrap = <T,>(e: ApiEnvelope<T>): T => e.data;

/**
 * Gerçek backend uygulaması. Endpoint'ler handoff README "Veri ihtiyaçları"
 * bölümüne göredir; backend hazır olunca VITE_USE_MOCK=false ile devreye girer.
 */
export const realCalendarApi: CalendarApi = {
  listSeasons: async (): Promise<SeasonAxisItem[]> => {
    const res = await httpClient.get<ApiEnvelope<SeasonAxisItem[]>>(
      '/academic-sessions',
    );
    return unwrap(res.data);
  },
  listTerms: async (seasonId: string): Promise<AcademicTermDto[]> => {
    const res = await httpClient.get<ApiEnvelope<AcademicTermDto[]>>(
      `/academic-sessions/${seasonId}/terms`,
    );
    return unwrap(res.data);
  },
  listEvents: async (
    seasonId: string, year: number, month: number,
  ): Promise<CalendarEventDto[]> => {
    const res = await httpClient.get<ApiEnvelope<CalendarEventDto[]>>(
      `/academic-sessions/${seasonId}/events`,
      { params: { year, month } },
    );
    return unwrap(res.data);
  },
  addEvent: async (
    seasonId: string, input: CreateCalendarEventInput,
  ): Promise<CalendarEventDto> => {
    const res = await httpClient.post<ApiEnvelope<CalendarEventDto>>(
      `/academic-sessions/${seasonId}/events`,
      input,
    );
    return unwrap(res.data);
  },
};
```

- [ ] **Step 2: Interface + seçiciyi yaz**

`api/calendarApi.ts`:
```ts
import type { AcademicTermDto } from '../../academic-sessions/types';
import type {
  CalendarEventDto, CreateCalendarEventInput, SeasonAxisItem,
} from '../types';
import { mockCalendarApi } from './calendarApi.mock';
import { realCalendarApi } from './calendarApi.real';

export interface CalendarApi {
  listSeasons(): Promise<SeasonAxisItem[]>;
  listTerms(seasonId: string): Promise<AcademicTermDto[]>;
  listEvents(
    seasonId: string, year: number, month: number,
  ): Promise<CalendarEventDto[]>;
  addEvent(
    seasonId: string, input: CreateCalendarEventInput,
  ): Promise<CalendarEventDto>;
}

/**
 * Mock ↔ gerçek seçimi. Varsayılan MOCK (flag set edilmemişse). Gerçek backend
 * hazır olunca `.env` içinde VITE_USE_MOCK=false ile geçilir.
 */
export const calendarApi: CalendarApi =
  import.meta.env.VITE_USE_MOCK === 'false' ? realCalendarApi : mockCalendarApi;
```

- [ ] **Step 3: Seçici testini yaz**

`__tests__/calendarApi.selector.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { calendarApi } from '../api/calendarApi';

describe('calendarApi seçici', () => {
  it('CalendarApi şeklini sağlar', () => {
    expect(typeof calendarApi.listSeasons).toBe('function');
    expect(typeof calendarApi.listEvents).toBe('function');
    expect(typeof calendarApi.listTerms).toBe('function');
    expect(typeof calendarApi.addEvent).toBe('function');
  });

  it('test ortamında mock''a düşer (VITE_USE_MOCK !== ''false'')', async () => {
    const seasons = await calendarApi.listSeasons();
    expect(seasons.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 4: Task 2 + Task 3 testlerini birlikte koş — geçmeli**

Run: `npm run test -- src/portals/admin/academic-calendar/__tests__/calendarApi.mock.test.ts src/portals/admin/academic-calendar/__tests__/calendarApi.selector.test.ts`
Expected: PASS (7 test toplam).

- [ ] **Step 5: Commit (Task 2 + Task 3 birlikte)**

```bash
git add src/portals/admin/academic-calendar/api src/portals/admin/academic-calendar/__tests__/calendarApi.mock.test.ts src/portals/admin/academic-calendar/__tests__/calendarApi.selector.test.ts
git commit -m "2026-06-09 feat,test: Akademik Takvim mock+gerçek API katmanı ve VITE_USE_MOCK seçici eklendi." -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Etkinlik formu Zod şeması

**Files:**
- Create: `src/portals/admin/academic-calendar/schemas/calendarEventSchema.ts`
- Test: `src/portals/admin/academic-calendar/__tests__/calendarEventSchema.test.ts`

- [ ] **Step 1: Şema testini yaz (failing)**

`__tests__/calendarEventSchema.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import {
  calendarEventSchema, toCreateInput,
} from '../schemas/calendarEventSchema';

const base = {
  type: 'meeting' as const,
  title: 'Veli Toplantısı',
  startDate: '2026-06-15',
  endDate: '',
  time: '',
};

describe('calendarEventSchema', () => {
  it('geçerli minimum girdiyi kabul eder', () => {
    expect(calendarEventSchema.safeParse(base).success).toBe(true);
  });

  it('boş başlığı reddeder', () => {
    expect(calendarEventSchema.safeParse({ ...base, title: '' }).success).toBe(false);
  });

  it('bitiş < başlangıç ise reddeder', () => {
    const r = calendarEventSchema.safeParse({
      ...base, startDate: '2026-06-15', endDate: '2026-06-10',
    });
    expect(r.success).toBe(false);
  });

  it('toCreateInput boş endDate/time''ı null''a çevirir ve isMultiDay türetir', () => {
    const single = toCreateInput(calendarEventSchema.parse(base));
    expect(single.endDate).toBeNull();
    expect(single.time).toBeNull();

    const multi = toCreateInput(
      calendarEventSchema.parse({ ...base, endDate: '2026-06-18' }),
    );
    expect(multi.endDate).toBe('2026-06-18');
  });
});
```

- [ ] **Step 2: Testi koş — fail etmeli**

Run: `npm run test -- src/portals/admin/academic-calendar/__tests__/calendarEventSchema.test.ts`
Expected: FAIL — şema yok.

- [ ] **Step 3: Şemayı yaz**

`schemas/calendarEventSchema.ts`:
```ts
import { z } from 'zod';
import type { CreateCalendarEventInput } from '../types';

const EVENT_TYPES = ['term', 'exam', 'holiday', 'meeting', 'activity', 'admin'] as const;

export const calendarEventSchema = z
  .object({
    type: z.enum(EVENT_TYPES),
    title: z.string().trim().min(1, { message: 'validation.titleRequired' }),
    startDate: z.string().min(1, { message: 'validation.startRequired' }),
    endDate: z.string(),   // boş string = tek günlük
    time: z.string(),      // boş string = saat yok
  })
  .refine(
    (v) => v.endDate === '' || v.endDate >= v.startDate,
    { path: ['endDate'], message: 'validation.endBeforeStart' },
  );

export type CalendarEventFormValues = z.infer<typeof calendarEventSchema>;

/** Form değerlerini API girdisine dönüştürür (boş string → null). */
export function toCreateInput(
  v: CalendarEventFormValues,
): CreateCalendarEventInput {
  return {
    type: v.type,
    title: v.title.trim(),
    startDate: v.startDate,
    endDate: v.endDate === '' ? null : v.endDate,
    time: v.time === '' ? null : v.time,
  };
}
```

- [ ] **Step 4: Testi koş — geçmeli**

Run: `npm run test -- src/portals/admin/academic-calendar/__tests__/calendarEventSchema.test.ts`
Expected: PASS (4 test).

- [ ] **Step 5: Commit**

```bash
git add src/portals/admin/academic-calendar/schemas src/portals/admin/academic-calendar/__tests__/calendarEventSchema.test.ts
git commit -m "2026-06-09 feat,test: Etkinlik Ekle formu Zod şeması eklendi." -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: i18n namespace (academic-calendar)

**Files:**
- Create: `src/shared/i18n/locales/tr/academic-calendar.json`
- Create: `src/shared/i18n/locales/en/academic-calendar.json`
- Modify: `src/shared/i18n/index.ts`
- Test: `src/portals/admin/academic-calendar/__tests__/i18n.test.ts`

- [ ] **Step 1: TR sözlüğünü yaz**

`src/shared/i18n/locales/tr/academic-calendar.json`:
```json
{
  "academic-calendar": {
    "title": "Akademik Takvim",
    "subtitle": "Sezon yönetimi ve eğitim-öğretim yılı etkinlikleri",
    "breadcrumb": { "root": "Genel", "current": "Akademik Takvim" },
    "actions": { "export": "Dışa Aktar", "addEvent": "Etkinlik Ekle", "today": "Bugün" },
    "season": {
      "active": "Aktif", "archive": "Arşiv",
      "unplanned": "Planlanmamış", "draft": "Taslak",
      "manage": "Sezon Yönetimi",
      "manageHint": "Yeni sezon aç ve geçişleri yönet",
      "plannedByActive": "Aktif sezona göre planlanır",
      "draftContinue": "Taslak · kaldığın yerden devam et",
      "readonly": "Arşiv · salt-okunur"
    },
    "kpi": {
      "activeTerm": "Aktif Dönem", "termEndsIn": "Dönem Bitişine",
      "eventsThisMonth": "Bu Ay Etkinlik", "seasonEvents": "Sezon Etkinliği",
      "daysSuffix": "gün"
    },
    "termStructure": {
      "title": "Dönem Yapısı",
      "completed": "Tamamlandı", "active": "Devam ediyor", "upcoming": "Yaklaşıyor",
      "todayProgress": "Bugün · %{{percent}}", "endsInDays": "Bitişine {{count}} gün"
    },
    "upcoming": {
      "title": "Yaklaşan Etkinlikler", "archiveTitle": "Sezon Etkinlikleri",
      "today": "Bugün", "tomorrow": "Yarın", "inDays": "{{count}} gün", "passed": "Geçti",
      "empty": "Bu sezon için etkinlik yok"
    },
    "legend": { "title": "Etkinlik Türleri" },
    "eventTypes": {
      "term": "Dönem", "exam": "Sınav", "holiday": "Tatil",
      "meeting": "Toplantı", "activity": "Etkinlik", "admin": "İdari"
    },
    "modal": {
      "title": "Etkinlik Ekle",
      "type": "Tür", "eventTitle": "Başlık", "start": "Başlangıç",
      "end": "Bitiş", "endHint": "Çok günlü için doldurun", "time": "Saat",
      "save": "Kaydet", "cancel": "İptal"
    },
    "validation": {
      "titleRequired": "Başlık zorunludur",
      "startRequired": "Başlangıç tarihi zorunludur",
      "endBeforeStart": "Bitiş, başlangıçtan önce olamaz"
    },
    "toast": { "added": "Etkinlik eklendi", "addError": "Etkinlik eklenemedi" },
    "moreEvents": "+{{count}} daha"
  }
}
```

- [ ] **Step 2: EN sözlüğünü yaz (aynı anahtarlar)**

`src/shared/i18n/locales/en/academic-calendar.json`:
```json
{
  "academic-calendar": {
    "title": "Academic Calendar",
    "subtitle": "Season management and academic-year events",
    "breadcrumb": { "root": "General", "current": "Academic Calendar" },
    "actions": { "export": "Export", "addEvent": "Add Event", "today": "Today" },
    "season": {
      "active": "Active", "archive": "Archive",
      "unplanned": "Not planned", "draft": "Draft",
      "manage": "Season Management",
      "manageHint": "Open a new season and manage transitions",
      "plannedByActive": "Planned from the active season",
      "draftContinue": "Draft · continue where you left off",
      "readonly": "Archive · read-only"
    },
    "kpi": {
      "activeTerm": "Active Term", "termEndsIn": "Term ends in",
      "eventsThisMonth": "Events This Month", "seasonEvents": "Season Events",
      "daysSuffix": "days"
    },
    "termStructure": {
      "title": "Term Structure",
      "completed": "Completed", "active": "In progress", "upcoming": "Upcoming",
      "todayProgress": "Today · {{percent}}%", "endsInDays": "{{count}} days to end"
    },
    "upcoming": {
      "title": "Upcoming Events", "archiveTitle": "Season Events",
      "today": "Today", "tomorrow": "Tomorrow", "inDays": "{{count}} days", "passed": "Passed",
      "empty": "No events for this season"
    },
    "legend": { "title": "Event Types" },
    "eventTypes": {
      "term": "Term", "exam": "Exam", "holiday": "Holiday",
      "meeting": "Meeting", "activity": "Activity", "admin": "Administrative"
    },
    "modal": {
      "title": "Add Event",
      "type": "Type", "eventTitle": "Title", "start": "Start",
      "end": "End", "endHint": "Fill for multi-day", "time": "Time",
      "save": "Save", "cancel": "Cancel"
    },
    "validation": {
      "titleRequired": "Title is required",
      "startRequired": "Start date is required",
      "endBeforeStart": "End cannot be before start"
    },
    "toast": { "added": "Event added", "addError": "Could not add event" },
    "moreEvents": "+{{count}} more"
  }
}
```

- [ ] **Step 3: index.ts'e namespace kaydını ekle**

`src/shared/i18n/index.ts` — import bloğuna ekle (academicSessions import'larının yanına):
```ts
import academicCalendarTr from './locales/tr/academic-calendar.json';
import academicCalendarEn from './locales/en/academic-calendar.json';
```
`ns` dizisine `'academic-calendar'` ekle:
```ts
  ns: ['school-settings', 'identity', 'users', 'invitations', 'common', 'academic-sessions', 'academic-calendar', 'students', 'teachers', 'parents', 'auth', 'errors'],
```
`resources.tr` ve `resources.en` bloklarına ekle:
```ts
      'academic-calendar': academicCalendarTr['academic-calendar'],
```
```ts
      'academic-calendar': academicCalendarEn['academic-calendar'],
```

- [ ] **Step 4: i18n testini yaz**

`__tests__/i18n.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import '../../../../shared/i18n';
import { i18n } from '../../../../shared/i18n';

describe('academic-calendar i18n', () => {
  it('TR namespace yüklendi', () => {
    expect(i18n.t('academic-calendar:title')).toBe('Akademik Takvim');
  });

  it('EN namespace yüklendi', () => {
    expect(i18n.t('academic-calendar:eventTypes.exam', { lng: 'en' })).toBe('Exam');
  });
});
```

- [ ] **Step 5: Testi koş — geçmeli**

Run: `npm run test -- src/portals/admin/academic-calendar/__tests__/i18n.test.ts`
Expected: PASS (2 test).

- [ ] **Step 6: Commit**

```bash
git add src/shared/i18n src/portals/admin/academic-calendar/__tests__/i18n.test.ts
git commit -m "2026-06-09 feat,test: academic-calendar i18n namespace (tr/en) eklendi." -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: Query/mutation hook'ları

**Files:**
- Create: `src/portals/admin/academic-calendar/hooks/useCalendarSeasonsQuery.ts`
- Create: `src/portals/admin/academic-calendar/hooks/useCalendarEventsQuery.ts`
- Create: `src/portals/admin/academic-calendar/hooks/useAddEventMutation.ts`
- Test: `src/portals/admin/academic-calendar/__tests__/hooks.test.tsx`

- [ ] **Step 1: Hook testini yaz (failing)**

`__tests__/hooks.test.tsx`:
```tsx
import { describe, expect, it, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { createTestWrapper } from '../../../../test/utils';
import { useAuthStore } from '../../../../shared/store/authStore';
import { useCalendarSeasonsQuery } from '../hooks/useCalendarSeasonsQuery';
import { useCalendarEventsQuery } from '../hooks/useCalendarEventsQuery';
import { useAddEventMutation } from '../hooks/useAddEventMutation';
import { __resetMockCalendar } from '../api/calendarApi.mock';
import { SESSION_ACTIVE } from '../api/calendarMockData';

beforeEach(() => {
  __resetMockCalendar();
  useAuthStore.setState({
    user: { id: 'u1', schoolId: 's1', fullName: 'A', roles: [], permissions: [] },
  } as never);
});

describe('academic-calendar hooks', () => {
  it('useCalendarSeasonsQuery sezonları getirir', async () => {
    const { result } = renderHook(() => useCalendarSeasonsQuery(), {
      wrapper: createTestWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.length).toBe(3);
  });

  it('useCalendarEventsQuery seasonId yoksa pasif', async () => {
    const { result } = renderHook(
      () => useCalendarEventsQuery(undefined, 2026, 6),
      { wrapper: createTestWrapper() },
    );
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('useAddEventMutation etkinlik ekler', async () => {
    const { result } = renderHook(
      () => useAddEventMutation(SESSION_ACTIVE),
      { wrapper: createTestWrapper() },
    );
    await act(async () => {
      await result.current.mutateAsync({
        type: 'meeting', title: 'X',
        startDate: '2026-06-15', endDate: null, time: null,
      });
    });
    expect(result.current.isSuccess).toBe(true);
  });
});
```

- [ ] **Step 2: Testi koş — fail etmeli**

Run: `npm run test -- src/portals/admin/academic-calendar/__tests__/hooks.test.tsx`
Expected: FAIL — hook'lar yok.

- [ ] **Step 3: Hook'ları yaz**

`hooks/useCalendarSeasonsQuery.ts`:
```ts
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../../shared/store/authStore';
import { calendarApi } from '../api/calendarApi';
import { calendarKeys } from '../keys/calendarKeys';

export function useCalendarSeasonsQuery() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  return useQuery({
    queryKey: calendarKeys.seasons(schoolId),
    queryFn: () => calendarApi.listSeasons(),
    enabled: Boolean(schoolId),
    staleTime: 5 * 60 * 1000,
  });
}
```

`hooks/useCalendarEventsQuery.ts`:
```ts
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../../shared/store/authStore';
import { calendarApi } from '../api/calendarApi';
import { calendarKeys } from '../keys/calendarKeys';

/** seasonId verilen ay (1-12) için etkinlikler. seasonId yoksa pasif. */
export function useCalendarEventsQuery(
  seasonId: string | undefined, year: number, month: number,
) {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  return useQuery({
    queryKey: calendarKeys.events(schoolId, seasonId ?? '', year, month),
    queryFn: () => calendarApi.listEvents(seasonId!, year, month),
    enabled: Boolean(schoolId) && Boolean(seasonId),
    placeholderData: keepPreviousData,
  });
}
```

`hooks/useAddEventMutation.ts`:
```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../../../shared/store/authStore';
import { calendarApi } from '../api/calendarApi';
import { calendarKeys } from '../keys/calendarKeys';
import type { CreateCalendarEventInput } from '../types';

/** Aktif sezona etkinlik ekler; başarıda o sezonun event query''lerini tazeler. */
export function useAddEventMutation(seasonId: string) {
  const { t } = useTranslation('academic-calendar');
  const qc = useQueryClient();
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  return useMutation({
    mutationFn: (input: CreateCalendarEventInput) =>
      calendarApi.addEvent(seasonId, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: calendarKeys.all(schoolId) });
      toast.success(t('toast.added'));
    },
    onError: () => toast.error(t('toast.addError')),
  });
}
```

- [ ] **Step 4: Testi koş — geçmeli**

Run: `npm run test -- src/portals/admin/academic-calendar/__tests__/hooks.test.tsx`
Expected: PASS (3 test).

> `toast` (sonner) ve `useTranslation` test ortamında mevcut (diğer modüllerde kullanılıyor); ek mock gerekmez.

- [ ] **Step 5: Commit**

```bash
git add src/portals/admin/academic-calendar/hooks src/portals/admin/academic-calendar/__tests__/hooks.test.tsx
git commit -m "2026-06-09 feat,test: Akademik Takvim React Query hook''ları (sezon/etkinlik/ekleme) eklendi." -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 7: SeasonAxisBar bileşeni

**Files:**
- Create: `src/portals/admin/academic-calendar/components/SeasonAxisBar.tsx`
- Test: `src/portals/admin/academic-calendar/__tests__/SeasonAxisBar.test.tsx`

Bileşen presentational'dır: veriyi prop alır, navigate'i prop callback ile dışarı verir (test edilebilirlik).

- [ ] **Step 1: Testi yaz (failing)**

`__tests__/SeasonAxisBar.test.tsx`:
```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '../../../../shared/i18n';
import { SeasonAxisBar } from '../components/SeasonAxisBar';
import type { SeasonAxisItem } from '../types';

const seasons: SeasonAxisItem[] = [
  { id: 'arc', name: '2024–2025', status: 'archive', startDate: '2024-09-01', endDate: '2025-06-30', isCurrent: false },
  { id: 'act', name: '2025–2026', status: 'active',  startDate: '2025-09-01', endDate: '2026-06-30', isCurrent: true },
  { id: 'pln', name: '2026–2027', status: 'planning', startDate: '2026-09-01', endDate: '2027-06-30', isCurrent: false },
];

function setup(over: Partial<Parameters<typeof SeasonAxisBar>[0]> = {}) {
  const onSelect = vi.fn();
  const onManage = vi.fn();
  render(
    <SeasonAxisBar
      seasons={seasons}
      selectedSeasonId="act"
      hasDraft={false}
      onSelect={onSelect}
      onManage={onManage}
      {...over}
    />,
  );
  return { onSelect, onManage };
}

describe('SeasonAxisBar', () => {
  it('taslak yoksa planlama kartı "Planlanmamış" gösterir', () => {
    setup({ hasDraft: false });
    expect(screen.getByText('Planlanmamış')).toBeInTheDocument();
  });

  it('taslak varsa "Taslak" gösterir', () => {
    setup({ hasDraft: true });
    expect(screen.getByText('Taslak')).toBeInTheDocument();
  });

  it('arşiv kartı tıklanınca onSelect çağrılır', () => {
    const { onSelect } = setup();
    fireEvent.click(screen.getByText('2024–2025'));
    expect(onSelect).toHaveBeenCalledWith('arc');
  });

  it('planlama kartı tıklanınca onManage çağrılır (onSelect değil)', () => {
    const { onSelect, onManage } = setup();
    fireEvent.click(screen.getByText('2026–2027'));
    expect(onManage).toHaveBeenCalled();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('"Sezon Yönetimi" butonu onManage çağırır', () => {
    const { onManage } = setup();
    fireEvent.click(screen.getByText('Sezon Yönetimi'));
    expect(onManage).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Testi koş — fail etmeli**

Run: `npm run test -- src/portals/admin/academic-calendar/__tests__/SeasonAxisBar.test.tsx`
Expected: FAIL — bileşen yok.

- [ ] **Step 3: Bileşeni yaz**

`components/SeasonAxisBar.tsx`:
```tsx
import { useTranslation } from 'react-i18next';
import { cn } from '../../../../shared/lib/cn';
import type { SeasonAxisItem } from '../types';

interface SeasonAxisBarProps {
  seasons: SeasonAxisItem[];
  selectedSeasonId: string;
  hasDraft: boolean;
  onSelect: (seasonId: string) => void;
  onManage: () => void;
}

export function SeasonAxisBar({
  seasons, selectedSeasonId, hasDraft, onSelect, onManage,
}: SeasonAxisBarProps) {
  const { t } = useTranslation('academic-calendar');

  const badge = (s: SeasonAxisItem): { label: string; tone: string } => {
    if (s.status === 'active') return { label: t('season.active'), tone: 'bg-emerald-100 text-emerald-700' };
    if (s.status === 'archive') return { label: t('season.archive'), tone: 'bg-slate-100 text-slate-600' };
    return hasDraft
      ? { label: t('season.draft'), tone: 'bg-indigo-100 text-indigo-700' }
      : { label: t('season.unplanned'), tone: 'bg-amber-100 text-amber-700' };
  };

  return (
    <div className="flex flex-wrap gap-3">
      {seasons.map((s) => {
        const selected = s.id === selectedSeasonId;
        const b = badge(s);
        const handleClick = () =>
          s.status === 'planning' ? onManage() : onSelect(s.id);
        return (
          <button
            key={s.id}
            type="button"
            onClick={handleClick}
            className={cn(
              'min-w-[210px] rounded-xl border bg-white p-4 text-left transition',
              selected ? 'border-[#1B2B5E] ring-2 ring-[#EEF1FA]' : 'border-slate-200 hover:border-slate-300',
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-base font-extrabold text-slate-900">{s.name}</span>
              <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', b.tone)}>
                {b.label}
              </span>
            </div>
            <div className="mt-2 text-sm text-slate-500">
              {s.status === 'active' && t('season.readonly') === '' /* placeholder */}
              {s.status === 'archive'
                ? t('season.readonly')
                : s.status === 'planning'
                  ? (hasDraft ? t('season.draftContinue') : t('season.plannedByActive'))
                  : `${s.startDate} – ${s.endDate}`}
            </div>
          </button>
        );
      })}

      <button
        type="button"
        onClick={onManage}
        className="ml-auto min-w-[210px] rounded-xl bg-gradient-to-br from-[#1B2B5E] to-[#4F6BFF] p-4 text-left text-white transition hover:brightness-110"
      >
        <div className="text-base font-extrabold">{t('season.manage')}</div>
        <div className="mt-1 text-sm text-white/80">{t('season.manageHint')}</div>
      </button>
    </div>
  );
}
```

> Not: `cn` helper'ı `src/shared/lib/cn.ts`'tedir (projede mevcut; teyit et: `grep -r "export.*cn" src/shared/lib`). Yoksa `clsx` + `tailwind-merge` ile yerel sarmalı kullan.

- [ ] **Step 4: Testi koş — geçmeli**

Run: `npm run test -- src/portals/admin/academic-calendar/__tests__/SeasonAxisBar.test.tsx`
Expected: PASS (5 test).

> Step 3'teki `t('season.readonly') === ''` satırı yanlışlıkla bırakılmış bir placeholder'dır — implementasyonda **bu satırı silin**. Aktif sezon alt metni için `s.startDate – s.endDate` zaten else dalında gösterilir.

- [ ] **Step 5: Commit**

```bash
git add src/portals/admin/academic-calendar/components/SeasonAxisBar.tsx src/portals/admin/academic-calendar/__tests__/SeasonAxisBar.test.tsx
git commit -m "2026-06-09 feat,test: SeasonAxisBar (sezon ekseni + taslak rozeti + sihirbaz yönlendirme) eklendi." -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 8: MonthCalendar bileşeni

**Files:**
- Create: `src/portals/admin/academic-calendar/components/MonthCalendar.tsx`
- Test: `src/portals/admin/academic-calendar/__tests__/MonthCalendar.test.tsx`

Pazartesi-başı 7-sütun ay ızgarası. Hücre başına max 3 pill + "+N daha". Bugün vurgusu. Çok-günlü etkinlikler kapsadıkları her günde görünür.

- [ ] **Step 1: Testi yaz (failing)**

`__tests__/MonthCalendar.test.tsx`:
```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '../../../../shared/i18n';
import { MonthCalendar } from '../components/MonthCalendar';
import type { CalendarEventDto } from '../types';

const events: CalendarEventDto[] = [
  { id: 'e1', academicSessionId: 'act', type: 'exam', title: 'LGS Sınavı', startDate: '2026-06-07', endDate: null, time: '09:30', isMultiDay: false, source: 'system' },
  { id: 'e2', academicSessionId: 'act', type: 'exam', title: 'Yıl Sonu', startDate: '2026-06-08', endDate: '2026-06-12', isMultiDay: true, source: 'system', time: null },
];

describe('MonthCalendar', () => {
  it('ay başlığını gösterir', () => {
    render(<MonthCalendar year={2026} month={6} events={events} readonly={false} onPrev={vi.fn()} onNext={vi.fn()} onToday={vi.fn()} onAddOnDay={vi.fn()} />);
    expect(screen.getByText(/Haziran 2026/i)).toBeInTheDocument();
  });

  it('tek-günlü etkinliği gününde gösterir', () => {
    render(<MonthCalendar year={2026} month={6} events={events} readonly={false} onPrev={vi.fn()} onNext={vi.fn()} onToday={vi.fn()} onAddOnDay={vi.fn()} />);
    expect(screen.getByText('LGS Sınavı')).toBeInTheDocument();
  });

  it('çok-günlü etkinlik başlangıç gününde görünür', () => {
    render(<MonthCalendar year={2026} month={6} events={events} readonly={false} onPrev={vi.fn()} onNext={vi.fn()} onToday={vi.fn()} onAddOnDay={vi.fn()} />);
    expect(screen.getByText('Yıl Sonu')).toBeInTheDocument();
  });

  it('readonly modda "Arşiv · salt-okunur" şeridi gösterir', () => {
    render(<MonthCalendar year={2026} month={6} events={events} readonly onPrev={vi.fn()} onNext={vi.fn()} onToday={vi.fn()} onAddOnDay={vi.fn()} />);
    expect(screen.getByText(/salt-okunur/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Testi koş — fail etmeli**

Run: `npm run test -- src/portals/admin/academic-calendar/__tests__/MonthCalendar.test.tsx`
Expected: FAIL — bileşen yok.

- [ ] **Step 3: Bileşeni yaz**

`components/MonthCalendar.tsx`:
```tsx
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../../shared/lib/cn';
import { EVENT_TYPE_META } from '../lib/eventTypes';
import type { CalendarEventDto } from '../types';

interface MonthCalendarProps {
  year: number;
  month: number;            // 1-12
  events: CalendarEventDto[];
  readonly: boolean;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onAddOnDay: (isoDate: string) => void;
}

const MAX_PILLS = 3;
const DOW = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

function isoOf(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Pazartesi-başı ızgara için 1. günün ofseti (0=Pzt..6=Paz). */
function leadingBlanks(year: number, month: number): number {
  const jsDow = new Date(year, month - 1, 1).getDay(); // 0=Paz
  return (jsDow + 6) % 7;
}

function eventsOnDay(events: CalendarEventDto[], iso: string): CalendarEventDto[] {
  return events.filter((e) => {
    const end = e.endDate ?? e.startDate;
    return e.startDate <= iso && iso <= end;
  });
}

export function MonthCalendar({
  year, month, events, readonly, onPrev, onNext, onToday, onAddOnDay,
}: MonthCalendarProps) {
  const { t } = useTranslation('academic-calendar');
  const todayIso = useMemo(() => {
    const d = new Date();
    return isoOf(d.getFullYear(), d.getMonth() + 1, d.getDate());
  }, []);

  const daysInMonth = new Date(year, month, 0).getDate();
  const blanks = leadingBlanks(year, month);
  const cells: (number | null)[] = [
    ...Array.from({ length: blanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <button type="button" onClick={onPrev} aria-label="prev" className="h-8 w-8 rounded-lg border border-slate-200">‹</button>
        <span className="text-base font-extrabold text-slate-900">{MONTHS[month - 1]} {year}</span>
        <button type="button" onClick={onNext} aria-label="next" className="h-8 w-8 rounded-lg border border-slate-200">›</button>
        <button type="button" onClick={onToday} className="ml-2 rounded-lg border border-slate-200 px-3 py-1 text-sm">{t('actions.today')}</button>
        {readonly && (
          <span className="ml-auto rounded-lg bg-slate-100 px-3 py-1 text-sm text-slate-600">🔒 {t('season.readonly')}</span>
        )}
      </div>

      <div className="grid grid-cols-7 border-b border-slate-100 pb-1">
        {DOW.map((d) => (
          <div key={d} className="text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          if (day === null) return <div key={`b${idx}`} className="min-h-[116px] border-b border-r border-slate-100 bg-slate-50/40" />;
          const iso = isoOf(year, month, day);
          const dayEvents = eventsOnDay(events, iso);
          const visible = dayEvents.slice(0, MAX_PILLS);
          const overflow = dayEvents.length - visible.length;
          const isToday = iso === todayIso;
          return (
            <div
              key={iso}
              className={cn('min-h-[116px] border-b border-r border-slate-100 p-1.5', isToday && 'bg-[#1B2B5E]/5 ring-2 ring-inset ring-[#1B2B5E]')}
            >
              <div className="flex items-center justify-between">
                <span className={cn('text-sm tabular-nums', isToday ? 'font-bold text-[#1B2B5E]' : 'text-slate-700')}>{day}</span>
                {!readonly && (
                  <button type="button" aria-label={`add-${iso}`} onClick={() => onAddOnDay(iso)} className="text-slate-300 hover:text-slate-600">+</button>
                )}
              </div>
              <div className="mt-1 space-y-1">
                {visible.map((e) => {
                  const meta = EVENT_TYPE_META[e.type];
                  return (
                    <div key={e.id} className="truncate rounded px-1 py-0.5 text-[11px]" style={{ backgroundColor: meta.soft, color: meta.color }}>
                      {e.title}
                    </div>
                  );
                })}
                {overflow > 0 && (
                  <div className="text-[11px] text-slate-400">{t('moreEvents', { count: overflow })}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

> Bu bileşende event pill zemin rengi `style` ile veriliyor (dinamik token rengi — inline style yasağının makul istisnası, çünkü renk veri-bağımlı; alternatif olmadığı için kullanıcıya not düşülür). Eğer ekip inline style'ı kesin yasaklıyorsa, `EVENT_TYPE_META` renklerini Tailwind safelist'e taşıyıp class map kullanın — bu durumda Task öncesi kullanıcıya sorun.

- [ ] **Step 4: Testi koş — geçmeli**

Run: `npm run test -- src/portals/admin/academic-calendar/__tests__/MonthCalendar.test.tsx`
Expected: PASS (4 test).

- [ ] **Step 5: Commit**

```bash
git add src/portals/admin/academic-calendar/components/MonthCalendar.tsx src/portals/admin/academic-calendar/__tests__/MonthCalendar.test.tsx
git commit -m "2026-06-09 feat,test: MonthCalendar aylık ızgara (Pzt-başı, çok-günlü, +N daha, bugün) eklendi." -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 9: TermStructurePanel + UpcomingEventsPanel + EventTypeLegend

**Files:**
- Create: `src/portals/admin/academic-calendar/components/TermStructurePanel.tsx`
- Create: `src/portals/admin/academic-calendar/components/UpcomingEventsPanel.tsx`
- Create: `src/portals/admin/academic-calendar/components/EventTypeLegend.tsx`
- Test: `src/portals/admin/academic-calendar/__tests__/sidePanels.test.tsx`

`AcademicTermDto` `academic-sessions/types`'tan gelir (`status: 'NotStarted'|'Active'|'Closed'`).

- [ ] **Step 1: Testi yaz (failing)**

`__tests__/sidePanels.test.tsx`:
```tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import '../../../../shared/i18n';
import { TermStructurePanel } from '../components/TermStructurePanel';
import { UpcomingEventsPanel } from '../components/UpcomingEventsPanel';
import { EventTypeLegend } from '../components/EventTypeLegend';
import type { AcademicTermDto } from '../../academic-sessions/types';
import type { CalendarEventDto } from '../types';

const terms: AcademicTermDto[] = [
  { id: 't1', academicSessionId: 'act', termTypeId: 'first', startDate: '2025-09-08', endDate: '2026-01-16', status: 'Closed', closedAt: '2026-01-16T00:00:00Z' },
  { id: 't2', academicSessionId: 'act', termTypeId: 'second', startDate: '2026-02-02', endDate: '2026-06-26', status: 'Active', closedAt: null },
];

const events: CalendarEventDto[] = [
  { id: 'e1', academicSessionId: 'act', type: 'exam', title: 'LGS', startDate: '2026-06-07', endDate: null, time: '09:30', isMultiDay: false, source: 'system' },
];

describe('side panels', () => {
  it('TermStructurePanel kapalı dönemi "Tamamlandı" gösterir', () => {
    render(<TermStructurePanel terms={terms} archived={false} />);
    expect(screen.getByText('Tamamlandı')).toBeInTheDocument();
  });

  it('UpcomingEventsPanel aktif sezonda "Yaklaşan Etkinlikler" başlığı', () => {
    render(<UpcomingEventsPanel events={events} archived={false} />);
    expect(screen.getByText('Yaklaşan Etkinlikler')).toBeInTheDocument();
  });

  it('UpcomingEventsPanel arşivde "Sezon Etkinlikleri" başlığı', () => {
    render(<UpcomingEventsPanel events={events} archived />);
    expect(screen.getByText('Sezon Etkinlikleri')).toBeInTheDocument();
  });

  it('EventTypeLegend 6 türü listeler', () => {
    render(<EventTypeLegend />);
    ['Dönem', 'Sınav', 'Tatil', 'Toplantı', 'Etkinlik', 'İdari'].forEach((label) =>
      expect(screen.getByText(label)).toBeInTheDocument(),
    );
  });
});
```

- [ ] **Step 2: Testi koş — fail etmeli**

Run: `npm run test -- src/portals/admin/academic-calendar/__tests__/sidePanels.test.tsx`
Expected: FAIL — bileşenler yok.

- [ ] **Step 3: TermStructurePanel'i yaz**

`components/TermStructurePanel.tsx`:
```tsx
import { useTranslation } from 'react-i18next';
import { cn } from '../../../../shared/lib/cn';
import type { AcademicTermDto } from '../../academic-sessions/types';

interface TermStructurePanelProps {
  terms: AcademicTermDto[];
  archived: boolean;
}

export function TermStructurePanel({ terms, archived }: TermStructurePanelProps) {
  const { t } = useTranslation('academic-calendar');

  const statusLabel = (term: AcademicTermDto): string => {
    if (archived || term.status === 'Closed') return t('termStructure.completed');
    if (term.status === 'Active') return t('termStructure.active');
    return t('termStructure.upcoming');
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <h3 className="mb-3 text-base font-extrabold text-slate-900">{t('termStructure.title')}</h3>
      <ul className="space-y-3">
        {terms.map((term, i) => {
          const done = archived || term.status === 'Closed';
          const active = !archived && term.status === 'Active';
          return (
            <li key={term.id} className="flex items-start gap-3">
              <span className={cn('mt-1 h-2.5 w-2.5 rounded-full',
                done ? 'bg-emerald-500' : active ? 'bg-[#1B2B5E]' : 'bg-slate-300')} />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-800">{i + 1}. {t('termStructure.title')}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{statusLabel(term)}</span>
                </div>
                <div className="text-xs text-slate-500 tabular-nums">{term.startDate} – {term.endDate}</div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
```

- [ ] **Step 4: UpcomingEventsPanel'i yaz**

`components/UpcomingEventsPanel.tsx`:
```tsx
import { useTranslation } from 'react-i18next';
import { EVENT_TYPE_META } from '../lib/eventTypes';
import type { CalendarEventDto } from '../types';

interface UpcomingEventsPanelProps {
  events: CalendarEventDto[];
  archived: boolean;
}

function daysFromToday(iso: string): number {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(iso); target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function UpcomingEventsPanel({ events, archived }: UpcomingEventsPanelProps) {
  const { t } = useTranslation('academic-calendar');

  const relative = (iso: string): string => {
    if (archived) return t('upcoming.passed');
    const d = daysFromToday(iso);
    if (d <= 0) return t('upcoming.today');
    if (d === 1) return t('upcoming.tomorrow');
    return t('upcoming.inDays', { count: d });
  };

  const sorted = [...events].sort((a, b) => a.startDate.localeCompare(b.startDate));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <h3 className="mb-3 text-base font-extrabold text-slate-900">
        {archived ? t('upcoming.archiveTitle') : t('upcoming.title')}
      </h3>
      {sorted.length === 0 ? (
        <p className="text-sm text-slate-400">{t('upcoming.empty')}</p>
      ) : (
        <ul className="space-y-3">
          {sorted.map((e) => {
            const meta = EVENT_TYPE_META[e.type];
            return (
              <li key={e.id} className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: meta.color }} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-slate-800">{e.title}</div>
                  <div className="text-xs text-slate-500">{t(meta.labelKey)}{e.time ? ` · ${e.time}` : ''}</div>
                </div>
                <span className="text-xs text-slate-500">{relative(e.startDate)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 5: EventTypeLegend'i yaz**

`components/EventTypeLegend.tsx`:
```tsx
import { useTranslation } from 'react-i18next';
import { EVENT_TYPE_META, EVENT_TYPE_ORDER } from '../lib/eventTypes';

export function EventTypeLegend() {
  const { t } = useTranslation('academic-calendar');
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <h3 className="mb-3 text-base font-extrabold text-slate-900">{t('legend.title')}</h3>
      <div className="grid grid-cols-2 gap-2">
        {EVENT_TYPE_ORDER.map((type) => {
          const meta = EVENT_TYPE_META[type];
          return (
            <div key={type} className="flex items-center gap-2">
              <span className="h-3 w-3 rounded" style={{ backgroundColor: meta.color }} />
              <span className="text-sm text-slate-700">{t(meta.labelKey)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Testi koş — geçmeli**

Run: `npm run test -- src/portals/admin/academic-calendar/__tests__/sidePanels.test.tsx`
Expected: PASS (4 test).

- [ ] **Step 7: Commit**

```bash
git add src/portals/admin/academic-calendar/components/TermStructurePanel.tsx src/portals/admin/academic-calendar/components/UpcomingEventsPanel.tsx src/portals/admin/academic-calendar/components/EventTypeLegend.tsx src/portals/admin/academic-calendar/__tests__/sidePanels.test.tsx
git commit -m "2026-06-09 feat,test: Dönem Yapısı, Yaklaşan Etkinlikler ve Etkinlik Türleri yan panelleri eklendi." -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 10: CalendarKpiRow bileşeni

**Files:**
- Create: `src/portals/admin/academic-calendar/components/CalendarKpiRow.tsx`
- Test: `src/portals/admin/academic-calendar/__tests__/CalendarKpiRow.test.tsx`

Saf presentational; değerleri prop alır (hesaplama sayfada yapılır → test edilebilir).

- [ ] **Step 1: Testi yaz (failing)**

`__tests__/CalendarKpiRow.test.tsx`:
```tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import '../../../../shared/i18n';
import { CalendarKpiRow } from '../components/CalendarKpiRow';

describe('CalendarKpiRow', () => {
  it('4 KPI değerini gösterir', () => {
    render(
      <CalendarKpiRow
        activeTermLabel="2. Dönem"
        termEndsInDays={18}
        eventsThisMonth={11}
        seasonEvents={37}
      />,
    );
    expect(screen.getByText('2. Dönem')).toBeInTheDocument();
    expect(screen.getByText(/18/)).toBeInTheDocument();
    expect(screen.getByText('11')).toBeInTheDocument();
    expect(screen.getByText('37')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Testi koş — fail etmeli**

Run: `npm run test -- src/portals/admin/academic-calendar/__tests__/CalendarKpiRow.test.tsx`
Expected: FAIL — bileşen yok.

- [ ] **Step 3: Bileşeni yaz**

`components/CalendarKpiRow.tsx`:
```tsx
import { useTranslation } from 'react-i18next';

interface CalendarKpiRowProps {
  activeTermLabel: string;
  termEndsInDays: number;
  eventsThisMonth: number;
  seasonEvents: number;
}

export function CalendarKpiRow({
  activeTermLabel, termEndsInDays, eventsThisMonth, seasonEvents,
}: CalendarKpiRowProps) {
  const { t } = useTranslation('academic-calendar');
  const cards = [
    { label: t('kpi.activeTerm'), value: activeTermLabel },
    { label: t('kpi.termEndsIn'), value: `${termEndsInDays} ${t('kpi.daysSuffix')}` },
    { label: t('kpi.eventsThisMonth'), value: String(eventsThisMonth) },
    { label: t('kpi.seasonEvents'), value: String(seasonEvents) },
  ];
  return (
    <div className="grid grid-cols-2 gap-3.5 md:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-xl font-extrabold text-slate-900">{c.value}</div>
          <div className="mt-1 text-sm text-slate-500">{c.label}</div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Testi koş — geçmeli**

Run: `npm run test -- src/portals/admin/academic-calendar/__tests__/CalendarKpiRow.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/portals/admin/academic-calendar/components/CalendarKpiRow.tsx src/portals/admin/academic-calendar/__tests__/CalendarKpiRow.test.tsx
git commit -m "2026-06-09 feat,test: CalendarKpiRow (4 KPI kartı) eklendi." -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 11: AddEventModal bileşeni

**Files:**
- Create: `src/portals/admin/academic-calendar/components/AddEventModal.tsx`
- Test: `src/portals/admin/academic-calendar/__tests__/AddEventModal.test.tsx`

RHF + zodResolver + `calendarEventSchema`. Mevcut shadcn `Dialog` (`src/app/components/ui/dialog`) kullanılır — teyit: `ls src/app/components/ui/dialog*`. Yoksa basit overlay `div` ile sarmal.

- [ ] **Step 1: Testi yaz (failing)**

`__tests__/AddEventModal.test.tsx`:
```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '../../../../shared/i18n';
import { AddEventModal } from '../components/AddEventModal';

function setup(over: Partial<Parameters<typeof AddEventModal>[0]> = {}) {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  const onClose = vi.fn();
  render(
    <AddEventModal
      open
      defaultDate="2026-06-15"
      submitting={false}
      onSubmit={onSubmit}
      onClose={onClose}
      {...over}
    />,
  );
  return { onSubmit, onClose };
}

describe('AddEventModal', () => {
  it('başlık boşken submit engellenir (validation)', async () => {
    const { onSubmit } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Kaydet' }));
    await waitFor(() =>
      expect(screen.getByText('Başlık zorunludur')).toBeInTheDocument(),
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('geçerli formda onSubmit CreateCalendarEventInput ile çağrılır', async () => {
    const { onSubmit } = setup();
    fireEvent.change(screen.getByLabelText('Başlık'), { target: { value: 'Veli Toplantısı' } });
    fireEvent.click(screen.getByRole('button', { name: 'Kaydet' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Veli Toplantısı', startDate: '2026-06-15', endDate: null }),
    );
  });
});
```

- [ ] **Step 2: Testi koş — fail etmeli**

Run: `npm run test -- src/portals/admin/academic-calendar/__tests__/AddEventModal.test.tsx`
Expected: FAIL — bileşen yok.

- [ ] **Step 3: Bileşeni yaz**

`components/AddEventModal.tsx`:
```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import {
  calendarEventSchema, toCreateInput, type CalendarEventFormValues,
} from '../schemas/calendarEventSchema';
import { EVENT_TYPE_ORDER, EVENT_TYPE_META } from '../lib/eventTypes';
import type { CreateCalendarEventInput } from '../types';

interface AddEventModalProps {
  open: boolean;
  defaultDate: string;
  submitting: boolean;
  onSubmit: (input: CreateCalendarEventInput) => Promise<void>;
  onClose: () => void;
}

export function AddEventModal({
  open, defaultDate, submitting, onSubmit, onClose,
}: AddEventModalProps) {
  const { t } = useTranslation('academic-calendar');
  const {
    register, handleSubmit, formState: { errors },
  } = useForm<CalendarEventFormValues>({
    resolver: zodResolver(calendarEventSchema),
    defaultValues: { type: 'meeting', title: '', startDate: defaultDate, endDate: '', time: '' },
  });

  if (!open) return null;

  const submit = handleSubmit(async (values) => {
    await onSubmit(toCreateInput(values));
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" role="dialog" aria-modal="true">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl bg-white p-6">
        <h2 className="mb-4 text-lg font-extrabold text-slate-900">{t('modal.title')}</h2>

        <label className="mb-1 block text-sm font-medium text-slate-700">{t('modal.type')}</label>
        <select {...register('type')} className="mb-3 w-full rounded-lg border border-slate-200 px-3 py-2">
          {EVENT_TYPE_ORDER.map((type) => (
            <option key={type} value={type}>{t(EVENT_TYPE_META[type].labelKey)}</option>
          ))}
        </select>

        <label htmlFor="ev-title" className="mb-1 block text-sm font-medium text-slate-700">{t('modal.eventTitle')}</label>
        <input id="ev-title" {...register('title')} className="mb-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
        {errors.title && <p className="mb-2 text-xs text-red-600">{t(errors.title.message ?? '')}</p>}

        <div className="mb-3 grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="ev-start" className="mb-1 block text-sm font-medium text-slate-700">{t('modal.start')}</label>
            <input id="ev-start" type="date" {...register('startDate')} className="w-full rounded-lg border border-slate-200 px-3 py-2" />
          </div>
          <div>
            <label htmlFor="ev-end" className="mb-1 block text-sm font-medium text-slate-700">{t('modal.end')}</label>
            <input id="ev-end" type="date" {...register('endDate')} className="w-full rounded-lg border border-slate-200 px-3 py-2" />
          </div>
        </div>
        {errors.endDate && <p className="mb-2 text-xs text-red-600">{t(errors.endDate.message ?? '')}</p>}

        <label htmlFor="ev-time" className="mb-1 block text-sm font-medium text-slate-700">{t('modal.time')}</label>
        <input id="ev-time" type="time" {...register('time')} className="mb-4 w-full rounded-lg border border-slate-200 px-3 py-2" />

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm">{t('modal.cancel')}</button>
          <button type="submit" disabled={submitting} className="rounded-lg bg-[#1B2B5E] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{t('modal.save')}</button>
        </div>
      </form>
    </div>
  );
}
```

> `@hookform/resolvers/zod` projede mevcut (diğer formlarda kullanılıyor; teyit: `grep -r "@hookform/resolvers" package.json`).

- [ ] **Step 4: Testi koş — geçmeli**

Run: `npm run test -- src/portals/admin/academic-calendar/__tests__/AddEventModal.test.tsx`
Expected: PASS (2 test).

- [ ] **Step 5: Commit**

```bash
git add src/portals/admin/academic-calendar/components/AddEventModal.tsx src/portals/admin/academic-calendar/__tests__/AddEventModal.test.tsx
git commit -m "2026-06-09 feat,test: AddEventModal (RHF+Zod etkinlik ekleme formu) eklendi." -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 12: AcademicCalendarPage kompozisyonu + route + nav

**Files:**
- Create: `src/portals/admin/academic-calendar/pages/AcademicCalendarPage.tsx`
- Create: `src/portals/admin/academic-calendar/index.ts`
- Modify: `src/app/routes.tsx`
- Modify: `src/app/layouts/AdminLayout.tsx`
- Test: `src/portals/admin/academic-calendar/__tests__/AcademicCalendarPage.test.tsx`

- [ ] **Step 1: Sayfa testini yaz (failing)**

`__tests__/AcademicCalendarPage.test.tsx`:
```tsx
import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '../../../../shared/i18n';
import { useAuthStore } from '../../../../shared/store/authStore';
import { AcademicCalendarPage } from '../pages/AcademicCalendarPage';
import { __resetMockCalendar } from '../api/calendarApi.mock';

beforeEach(() => {
  __resetMockCalendar();
  useAuthStore.setState({
    user: { id: 'u1', schoolId: 's1', fullName: 'A', roles: [], permissions: [] },
  } as never);
});

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <AcademicCalendarPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AcademicCalendarPage', () => {
  it('başlık ve aktif sezon kartını render eder', async () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Akademik Takvim' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('2025–2026')).toBeInTheDocument());
  });

  it('aktif sezon etkinliklerini takvimde gösterir', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('LGS Sınavı')).toBeInTheDocument());
  });
});
```

- [ ] **Step 2: Testi koş — fail etmeli**

Run: `npm run test -- src/portals/admin/academic-calendar/__tests__/AcademicCalendarPage.test.tsx`
Expected: FAIL — sayfa yok.

- [ ] **Step 3: Sayfayı yaz**

`pages/AcademicCalendarPage.tsx`:
```tsx
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useSeasonDraftQuery } from '../../academic-sessions/hooks/useSeasonWizard';
import { useCalendarSeasonsQuery } from '../hooks/useCalendarSeasonsQuery';
import { useCalendarEventsQuery } from '../hooks/useCalendarEventsQuery';
import { useAddEventMutation } from '../hooks/useAddEventMutation';
import { useTermsForSessionQuery } from '../../academic-sessions/hooks/useAcademicSessionsQuery';
import { SeasonAxisBar } from '../components/SeasonAxisBar';
import { CalendarKpiRow } from '../components/CalendarKpiRow';
import { MonthCalendar } from '../components/MonthCalendar';
import { TermStructurePanel } from '../components/TermStructurePanel';
import { UpcomingEventsPanel } from '../components/UpcomingEventsPanel';
import { EventTypeLegend } from '../components/EventTypeLegend';
import { AddEventModal } from '../components/AddEventModal';
import type { CreateCalendarEventInput } from '../types';

export function AcademicCalendarPage() {
  const { t } = useTranslation('academic-calendar');
  const navigate = useNavigate();

  const seasonsQuery = useCalendarSeasonsQuery();
  const seasons = useMemo(() => seasonsQuery.data ?? [], [seasonsQuery.data]);
  const activeSeason = seasons.find((s) => s.isCurrent) ?? seasons[0];

  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);
  const currentSeasonId = selectedSeasonId ?? activeSeason?.id;
  const currentSeason = seasons.find((s) => s.id === currentSeasonId);
  const readonly = currentSeason?.status === 'archive';

  const initialMonth = useMemo(() => {
    const base = currentSeason ? new Date(currentSeason.endDate) : new Date();
    return { year: base.getFullYear(), month: base.getMonth() + 1 };
  }, [currentSeason]);
  const [view, setView] = useState<{ year: number; month: number } | null>(null);
  const activeView = view ?? initialMonth;

  const eventsQuery = useCalendarEventsQuery(currentSeasonId, activeView.year, activeView.month);
  const termsQuery = useTermsForSessionQuery(currentSeasonId);
  const draftQuery = useSeasonDraftQuery();
  const events = eventsQuery.data ?? [];
  const terms = termsQuery.data ?? [];

  const addMutation = useAddEventMutation(currentSeasonId ?? '');
  const [modalDate, setModalDate] = useState<string | null>(null);

  const shiftMonth = (delta: number) => {
    const d = new Date(activeView.year, activeView.month - 1 + delta, 1);
    setView({ year: d.getFullYear(), month: d.getMonth() + 1 });
  };

  const handleSubmit = async (input: CreateCalendarEventInput) => {
    const created = await addMutation.mutateAsync(input);
    const d = new Date(created.startDate);
    setView({ year: d.getFullYear(), month: d.getMonth() + 1 });
    setModalDate(null);
  };

  const goWizard = () => navigate('/admin/academic-sessions');

  return (
    <div className="mx-auto max-w-[1320px] space-y-4 px-6 py-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-slate-400">{t('breadcrumb.root')} › {t('breadcrumb.current')}</div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{t('title')}</h1>
          <p className="text-sm text-slate-500">{t('subtitle')}{currentSeason ? ` · ${currentSeason.name}` : ''}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" disabled className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-400">{t('actions.export')}</button>
          <button type="button" disabled={readonly} onClick={() => setModalDate(`${activeView.year}-${String(activeView.month).padStart(2, '0')}-01`)}
            className="rounded-lg bg-[#1B2B5E] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {t('actions.addEvent')}
          </button>
        </div>
      </div>

      {currentSeasonId && (
        <SeasonAxisBar
          seasons={seasons}
          selectedSeasonId={currentSeasonId}
          hasDraft={Boolean(draftQuery.data)}
          onSelect={(id) => { setSelectedSeasonId(id); setView(null); }}
          onManage={goWizard}
        />
      )}

      <CalendarKpiRow
        activeTermLabel={terms.find((x) => x.status === 'Active') ? '2. Dönem' : '—'}
        termEndsInDays={0}
        eventsThisMonth={events.length}
        seasonEvents={events.length}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(310px,1fr)]">
        <MonthCalendar
          year={activeView.year}
          month={activeView.month}
          events={events}
          readonly={readonly ?? false}
          onPrev={() => shiftMonth(-1)}
          onNext={() => shiftMonth(1)}
          onToday={() => { setSelectedSeasonId(activeSeason?.id ?? null); setView(null); }}
          onAddOnDay={(iso) => setModalDate(iso)}
        />
        <div className="space-y-4">
          <TermStructurePanel terms={terms} archived={readonly ?? false} />
          <UpcomingEventsPanel events={events} archived={readonly ?? false} />
          <EventTypeLegend />
        </div>
      </div>

      <AddEventModal
        open={modalDate !== null}
        defaultDate={modalDate ?? `${activeView.year}-${String(activeView.month).padStart(2, '0')}-01`}
        submitting={addMutation.isPending}
        onSubmit={handleSubmit}
        onClose={() => setModalDate(null)}
      />
    </div>
  );
}
```

> **Bağımlılık teyidi:** `useSeasonDraftQuery` ve `useTermsForSessionQuery` hook adlarını implementasyondan ÖNCE doğrula:
> `grep -rn "useSeasonDraftQuery\|useTermsForSessionQuery\|seasonDraftApi" src/portals/admin/academic-sessions/hooks`.
> `useSeasonDraftQuery` yoksa, `seasonDraftApi.get()`'i saran küçük bir query'yi bu modülde (`hooks/useCalendarSeasonDraft.ts`) yaz ve onu kullan. Bu durumda Step 3 import'unu ona göre güncelle.

- [ ] **Step 4: index.ts re-export**

`index.ts`:
```ts
export { AcademicCalendarPage } from './pages/AcademicCalendarPage';
```

- [ ] **Step 5: Route ekle**

`src/app/routes.tsx` — import bloğuna (SeasonWizardPage import'unun yanına):
```ts
import { AcademicCalendarPage } from "../portals/admin/academic-calendar";
```
`admin` children'ında, `academic-sessions` route'unun yanına ekle:
```tsx
          {
            path: "academic-calendar",
            Component: () => (
              <RequirePermission permission={PERMISSIONS.ACADEMIC_SESSIONS_VIEW} />
            ),
            children: [{ index: true, Component: AcademicCalendarPage }],
          },
```

- [ ] **Step 6: Nav item ekle**

`src/app/layouts/AdminLayout.tsx` — "Genel" section'ının `items` dizisine, "Gösterge Paneli"den sonra:
```tsx
          { label: "Akademik Takvim", icon: CalendarDays, href: "/admin/academic-calendar" },
```
`CalendarDays` ikonunu `lucide-react` import'una ekle (dosyanın üstündeki icon import satırına `CalendarDays` ekle; zaten `Calendar`, `CalendarRange` import ediliyor).

- [ ] **Step 7: Sayfa testini koş — geçmeli**

Run: `npm run test -- src/portals/admin/academic-calendar/__tests__/AcademicCalendarPage.test.tsx`
Expected: PASS (2 test).

- [ ] **Step 8: Tüm modül testlerini + build + tip kontrolünü koş**

Run: `npm run test -- src/portals/admin/academic-calendar`
Expected: PASS (tüm task testleri).
Run: `npm run build`
Expected: TypeScript hatasız derleme.

- [ ] **Step 9: Commit**

```bash
git add src/portals/admin/academic-calendar/pages src/portals/admin/academic-calendar/index.ts src/app/routes.tsx src/app/layouts/AdminLayout.tsx src/portals/admin/academic-calendar/__tests__/AcademicCalendarPage.test.tsx
git commit -m "2026-06-09 feat,test: Akademik Takvim sayfası kompozisyonu + route + sol menü girişi eklendi." -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 13: Modül dokümanı güncelle (completion_status)

**Files:**
- Modify: `.claude/docs/modules/academic-years/completion_status.md` (workspace root repo)
- Modify: `.claude/docs/modules/academic-years/ui-flows.md` (Akademik Takvim ekran akışı)

> Bu dosyalar **workspace root** repo'sundadır (`oksis/`), `oksis-web` değil. Commit'i orada at.

- [ ] **Step 1: completion_status.md güncelle**

`Güncel` tarihini `2026-06-09` yap; "✅ Tamamlananlar" altına ekle:
`- Akademik Takvim (Ekran 1) frontend + mock servis (VITE_USE_MOCK). Gerçek backend bekliyor.`
"⚠️ Spec Dışına Çıkılanlar" altına (varsa) ekle:
`- 2026-06-09: Takvim etkinlikleri için backend henüz yok; frontend mock servisle (oturum-içi bellek) çalışıyor. Gerçek `GET/POST /academic-sessions/{id}/events` sonra. Onay: kullanıcı. Etki: yalnız frontend.`

- [ ] **Step 2: ui-flows.md'e Akademik Takvim akışını ekle**

Kısa bölüm: ekran amacı, sezon ekseni → sihirbaz bağlantısı, etkinlik ekleme akışı, salt-okunur arşiv davranışı (handoff README §Ekran 1 özetinden).

- [ ] **Step 3: Commit (workspace root repo)**

```bash
cd /Users/farukkaya/Projects/oksis
git add .claude/docs/modules/academic-years/completion_status.md .claude/docs/modules/academic-years/ui-flows.md
git commit -m "2026-06-09 docs: Akademik Takvim (Ekran 1) frontend+mock tamamlandı; completion_status ve ui-flows güncellendi." -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review

**1. Spec coverage:**
- §1 Kapsam (yeni ekran, route, sezon ekseni, KPI, takvim, dönem yapısı, yaklaşan, legend, modal, mock) → Task 1-12 ✅
- §2 Token paleti → Task 1 (EVENT_TYPE_META) ✅
- §3 Dosya yapısı → tüm task'lar dosya yollarıyla ✅
- §4 Mock stratejisi (flag) → Task 3 ✅
- §5 Mock kontrat + tipler → Task 1, 2, 3 ✅
- §6 Veri akışı/state → Task 12 (sayfa state, invalidate, etkinliğin ayına atlama) ✅
- §7 Sezon entegrasyonu (planlama→sihirbaz, taslak rozeti, topbar bağı yok) → Task 7 + Task 12 ✅
- §8 Ekran davranışları (active/archive readonly/modal) → Task 8, 9, 11, 12 ✅
- §9 Test stratejisi → her task TDD ✅
- §10 Açık notlar (token sorma, inline style istisnası) → Task 8 notu ✅

**2. Placeholder scan:** Task 7 Step 3'te kasıtlı bir hatalı satır (`t('season.readonly') === ''`) var; Step 4 notu onu silmeyi açıkça söylüyor. Başka TBD/placeholder yok.

**3. Type consistency:** `CalendarApi` (listSeasons/listTerms/listEvents/addEvent) Task 2/3 tutarlı. `CalendarEventDto`, `CreateCalendarEventInput`, `SeasonAxisItem` Task 1'de tanımlı, sonraki task'larda aynı imzalarla kullanılıyor. `__resetMockCalendar`, `SESSION_ACTIVE` export'ları Task 2'de tanımlı, testlerde aynı adla. `calendarEventSchema`/`toCreateInput`/`CalendarEventFormValues` Task 4 ↔ Task 11 tutarlı. `EVENT_TYPE_META`/`EVENT_TYPE_ORDER`/`dominantBandType` Task 1 ↔ 8/9/11 tutarlı.

**Belirsizlik / doğrulama noktaları (implementasyon sırasında ilk adımda teyit):**
- `cn` helper yolu (`src/shared/lib/cn`) — Task 7 notu.
- `useSeasonDraftQuery` / `useTermsForSessionQuery` adları — Task 12 notu (yoksa yerel hook).
- `@hookform/resolvers/zod`, `sonner` toast — mevcut (diğer modüller kullanıyor).
- `lucide-react` `CalendarDays` ikonu — Task 12 Step 6.
- MonthCalendar event-pill renginde `style` kullanımı — inline style yasağına makul istisna; ekip katıysa Tailwind safelist'e taşı (Task 8 notu, gerekirse kullanıcıya sor).
