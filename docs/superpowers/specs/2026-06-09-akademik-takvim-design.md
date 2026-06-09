# Akademik Takvim (Ekran 1) + Mock Servis — Tasarım

**Tarih:** 2026-06-09
**Durum:** Onaylandı (brainstorming)
**Repo:** `oksis-web`
**Kaynak handoff:** `Oksis Layout Akademik Takvim Sezon Yönetimi.zip` →
`design_handoff_oksis_takvim_sezon/` (README, screenshots, calendar.jsx/css, brand.css)
**Bağlayıcı spec referansı:** `.claude/specs/oksis-admin-ekranlari-mimari-spec.md`
(§1.2 sezon=zaman ekseni, §6). Handoff README'deki "Veri ihtiyaçları (production)"
bölümü gelecekteki gerçek backend kontratının temelidir.

---

## 1. Amaç ve Kapsam

Handoff'taki **Ekran 1 — Akademik Takvim**'i `oksis-web` admin portalına, **tamamen mock
servis** üzerinden çalışacak şekilde uygula. Gerçek .NET backend sonra yapılacak; bu görev
yalnızca frontend + mock veri katmanıdır.

Sezon Yönetimi sihirbazı (Ekran 2) **tamamlanmış durumdadır** (`portals/admin/academic-sessions/`)
ve bu görevde **iç mantığı değiştirilmez** — yalnızca takvimden ona bağlanılır.

### Kapsam içi
- Yeni admin ekranı: route `/admin/academic-calendar`, sol menü *Genel → Akademik Takvim*.
- Sezon ekseni (3 kart: Arşiv / Aktif / Planlama) + takvimin gösterdiği sezonu değiştirme.
- KPI şeridi (4 kart), aylık takvim ızgarası, Dönem Yapısı zaman çizelgesi, Yaklaşan
  Etkinlikler paneli, Etkinlik Türleri legend, Etkinlik Ekle modalı.
- Mock servis: ayrı dosya + `VITE_USE_MOCK` flag; oturum-içi bellekte etkinlik ekleme.
- Sezon ekseni → sihirbaz entegrasyonu (planlama kartı → wizard, taslak rozeti).

### Kapsam dışı
- Gerçek .NET backend (sonraki iş).
- Sihirbaz iç mantığı (tamamlandı).
- Gerçek "Dışa Aktar" (export) — buton görünür ama no-op/disabled.
- Çok-tenant gerçek izolasyonu mock seviyesinde tam emüle edilmez; query key'ler yine
  tenant-scoped yazılır (gerçek backend'e geçişte hazır olsun).

---

## 2. Tasarım Sistemi / Token'lar

Kaynak: handoff `brand.css`. Admin vurgusu **lacivert**. Token'lar mevcut Tailwind/shadcn
sistemine eşlenir (yeni token icat edilmez; eşleşmeyen değerler Tailwind config'e eklenmeden
önce kullanıcıya sorulur). Etkinlik türü paleti (renk / soft zemin):

| key | Etiket | Renk | Soft |
|---|---|---|---|
| `term` | Dönem | `#1B2B5E` | `#E7EAF5` |
| `exam` | Sınav | `#991B1B` | `#FCE7E7` |
| `holiday` | Tatil | `#0E7A5A` | `#D7F5EC` |
| `meeting` | Toplantı | `#4F6BFF` | `#E6EAFF` |
| `activity` | Etkinlik | `#B05A0A` | `#FCEFDB` |
| `admin` | İdari | `#5B21B6` | `#EDE7FB` |

Çok-günlü bant hücre boyama önceliği: `holiday > exam > term > admin > meeting > activity`.

---

## 3. Dosya Yapısı

`src/portals/admin/academic-calendar/` (mevcut `academic-sessions` modülünün dosya
deseniyle birebir tutarlı):

```
academic-calendar/
  index.ts                         (named re-export: AcademicCalendarPage)
  pages/
    AcademicCalendarPage.tsx
  components/
    SeasonAxisBar.tsx              (3 sezon kartı + "Sezon Yönetimi" gradyan butonu)
    CalendarKpiRow.tsx             (4 KPI kartı)
    MonthCalendar.tsx              (ay nav + DOW başlığı + ay ızgarası + hücre)
    TermStructurePanel.tsx         (Dönem Yapısı dikey timeline)
    UpcomingEventsPanel.tsx        (Yaklaşan / arşivde "Sezon Etkinlikleri")
    EventTypeLegend.tsx            (6 tür legend)
    AddEventModal.tsx              (tür seçici + form)
  api/
    calendarApi.ts                 (interface + VITE_USE_MOCK flag seçici)
    calendarApi.real.ts            (httpClient impl — backend gelince çalışır)
    calendarApi.mock.ts            (oturum-içi bellek store impl)
    calendarMockData.ts           (aktif + arşiv sezon seed etkinlikleri)
  hooks/
    useCalendarSeasonsQuery.ts
    useCalendarEventsQuery.ts
    useAddEventMutation.ts
  schemas/
    calendarEventSchema.ts         (Zod: add-event form + runtime parse)
  types/
    index.ts                       (CalendarEventDto, EventType, SeasonAxisItem...)
  keys/
    calendarKeys.ts                (tenant-scoped query key factory)
  __tests__/                       (her birim için test)
```

i18n: yeni namespace `academic-calendar.json` (`shared/i18n/locales/{tr,en}/`). Tüm metinler
key'li — hardcoded Türkçe yasak.

---

## 4. Mock Servis Stratejisi

Seçilen yaklaşım: **ayrı mock api dosyası + flag**.

```ts
// calendarApi.ts
import { realCalendarApi } from './calendarApi.real';
import { mockCalendarApi } from './calendarApi.mock';

export interface CalendarApi {
  listSeasons(): Promise<SeasonAxisItem[]>;
  listEvents(seasonId: string, year: number, month: number): Promise<CalendarEventDto[]>;
  listTerms(seasonId: string): Promise<AcademicTermDto[]>;
  addEvent(seasonId: string, input: CreateCalendarEventInput): Promise<CalendarEventDto>;
}

export const calendarApi: CalendarApi =
  import.meta.env.VITE_USE_MOCK === 'false' ? realCalendarApi : mockCalendarApi;
```

- Dev'de varsayılan **mock açık** (flag set edilmemişse mock).
- `calendarApi.real.ts`: `httpClient` ile §5'teki endpoint'leri çağırır (envelope unwrap
  deseni mevcut `academicSessionsApi` ile aynı). Backend gelince yalnızca flag değişir.
- `calendarApi.mock.ts`: modül-seviyesi mutable array (oturum-içi bellek). Eklenen etkinlik
  store'a push edilir, sayfa yenilenince seed'e döner (kalıcılık yok — onaylı).
- Sezon taslak rozeti için mevcut `seasonDraftApi.get()` aynen kullanılır (yeniden yazılmaz).

---

## 5. Mock Kontrat (gelecekteki gerçek backend)

| Endpoint | Açıklama | Dönen |
|---|---|---|
| `GET /academic-sessions` | sezon ekseni | `SeasonAxisItem[]` (status map: Setup→`planning`, Active→`active`, Archived→`archive`) |
| `GET /academic-sessions/{id}/events?year=&month=` | aya ait etkinlikler | `CalendarEventDto[]` |
| `GET /academic-sessions/{id}/terms` | dönem yapısı | `AcademicTermDto[]` (mevcut tip) |
| `POST /academic-sessions/{id}/events` | etkinlik oluştur | `CalendarEventDto` |
| `seasonDraftApi.get()` (mevcut) | taslak durumu | `SeasonDraftDto \| null` |

### Tipler

```ts
export type CalendarEventType =
  | 'term' | 'exam' | 'holiday' | 'meeting' | 'activity' | 'admin';

export type SeasonAxisStatus = 'active' | 'archive' | 'planning';

export interface CalendarEventDto {
  id: string;
  academicSessionId: string;
  type: CalendarEventType;
  title: string;
  startDate: string;          // ISO yyyy-MM-dd
  endDate: string | null;     // çok-günlü ise dolu
  time: string | null;        // 'HH:mm' opsiyonel
  isMultiDay: boolean;
  source: 'system' | 'user';  // seed vs kullanıcı eklemesi
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

Mevcut `AcademicSessionDto`/`AcademicTermDto`/`SeasonDraftDto` tipleri
(`academic-sessions/types`) yeniden kullanılır; bu modül yalnızca takvime özel tipleri
(`CalendarEventDto`, `SeasonAxisItem`) ekler.

---

## 6. Veri Akışı & State

- **React Query key'leri** tenant-scoped (`calendarKeys`):
  - `calendarKeys.seasons(tenantId)`
  - `calendarKeys.events(tenantId, seasonId, year, month)`
  - `calendarKeys.terms(tenantId, seasonId)`
- **Sayfa lokal state** (`AcademicCalendarPage`): `selectedSeasonId`, `view {year, month}`,
  `modalOpen`. Türetilen: `readonly = (season.status === 'archive')`.
- **Add-event mutation** başarıyla dönünce ilgili `events` query'sini invalidate eder ve
  `view`'i eklenen etkinliğin ayına ayarlar (takvim o aya atlar).
- Açılışta `selectedSeasonId` = aktif (`isCurrent`) sezon; yoksa ilk sezon.

---

## 7. Sezon Ekseni Entegrasyonu

- **SeasonAxisBar** girişleri: `SeasonAxisItem[]` + `seasonDraftApi.get()` sonucu.
- 3 kart: Arşiv (`archive`) · Aktif (`active`, seçili ring) · Planlama (`planning`).
- **Planlama kartı rozeti:** taslak yoksa "Planlanmamış" (warning), taslak varsa "Taslak"
  (info). **Tıklama → `navigate('/admin/academic-sessions')`** (mevcut sihirbaz; taslak varsa
  kaldığı adımdan devam — bu davranış sihirbazda zaten mevcut).
- Diğer kartlar (Arşiv/Aktif) tıklanınca yalnızca `selectedSeasonId`'yi değiştirir.
- Sondaki **"Sezon Yönetimi → Yeni sezon aç"** gradyan butonu da sihirbaza gider.
- **Topbar bağı yok (onaylı):** takvim sezon seçimi tamamen lokaldir; topbar'daki global
  aktif sezon (`activeSeasonStore` / `SeasonPill`) **değiştirilmez**.

---

## 8. Ekran Davranışları (handoff README §"Sezon durumları")

- **active** → tam etkileşimli takvim, canlı Dönem Yapısı ilerlemesi, Yaklaşan Etkinlikler.
- **archive** → salt-okunur ("Arşiv · salt-okunur" şeridi, Etkinlik Ekle disabled), Yaklaşan
  paneli başlığı "Sezon Etkinlikleri" + göreli zaman yerine "Geçti", tüm dönemler "Tamamlandı".
- **planning** → takvim göstermek yerine kart tıklaması sihirbaza yönlendirir (takvim bu sezon
  için etkinlik göstermez; mock bu sezonu seçilebilir kart olarak değil, yalnızca eksen kartı
  olarak sunar).
- **Etkinlik Ekle modalı:** Tür (6 ikon-kartı), Başlık (zorunlu), Başlangıç (date),
  Bitiş (opsiyonel/çok-günlü), Saat (opsiyonel). Kaydet → mock store'a eklenir, takvim o aya
  atlar. Arşiv sezonunda buton disabled.

---

## 9. Test Stratejisi (TDD)

Her birim için önce test:

1. **calendarApi.mock** — `addEvent` sonrası aynı ay için `listEvents` eklenen etkinliği
   döndürür; başka ay döndürmez. `listSeasons` status map'i doğru (Setup→planning vb.).
2. **calendarEventSchema (Zod)** — başlık zorunlu; `endDate` doluysa `endDate >= startDate`;
   `isMultiDay` türetimi doğru.
3. **SeasonAxisBar** — taslak yokken "Planlanmamış", varken "Taslak"; planlama kartı/gradyan
   buton tıklaması navigate çağırır; arşiv kartı seçimi readonly tetikler.
4. **MonthCalendar** — etkinlikleri doğru güne render eder; hücrede max 3 pill + "+N daha";
   bugün hücresi vurgulu; çok-günlü bant boyaması.
5. **TermStructurePanel** — aktif fazda ilerleme %; arşivde tümü "Tamamlandı".
6. **AddEventModal** — submit `addEvent` mutation'ını çağırır; arşivde tetiklenemez.

---

## 10. Açık Notlar

- Token eşleşmesi: handoff renklerinden Tailwind/shadcn'de karşılığı olmayan değer çıkarsa,
  config'e eklemeden önce kullanıcıya sorulur (yeni token sessizce eklenmez).
- Gerçek backend kontratı netleştiğinde (yeni `calendar`/`academic-calendar` modül dokümanı)
  `calendarApi.real.ts` endpoint'leri ve `CalendarEventDto` o dokümanla hizalanır.
