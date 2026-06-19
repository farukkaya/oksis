# Nöbet Çizelgesi Çekirdeği — Frontend Implementation Plan (Faz 4 / Dilim 2a)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the admin **Nöbet & Vekâlet Yönetimi** screen (3 tabs: Çizelge grid, Vekâlet placeholder, Bölgeler & Politika) and the **read-only teacher duty view** in `oksis-web`, faithfully porting the design handoff and wiring it to the Dilim 2a backend endpoints.

**Architecture:** New admin portal area `src/portals/admin/duties/` mirrors the `schedule_avail` (AvailabilityScreen) pattern — `PageHeader` → `aca-tabs` (3 tabs) → body. The handoff JSX (`duty_admin.jsx`, `duty_admin_more.jsx`) is ported component-by-component into TSX, with local mock data replaced by React Query hooks over `/api/v1/duties`. A separate teacher view ports the nöbet/yancı part of `schedule_duty.jsx`. Server state lives only in React Query (tenant-scoped keys); the roster editor keeps a local buffered draft replayed on Save (same pattern as the schedule editor).

**Tech Stack:** React + Vite + TypeScript (strict), shadcn/ui (Radix) + Tailwind, TanStack React Query v5, Zustand, RHF + Zod, axios, i18next, Vitest + Testing Library.

**Design doc:** `.claude/specs/ders-programi-faz4-dilim2a-nobet-cizelge-design.md`
**Backend plan (provides APIs):** `.claude/specs/ders-programi-faz4-dilim2a-nobet-cizelge-plan-be.md`
**Handoff (faithful port):** `oksis-layout/project/app/duty_admin.jsx`, `duty_admin_more.jsx`, `schedule_duty.jsx` (+ `.css`), `screenshots/01-04-duty.png`.

## Global Constraints

- Working dir: `oksis-web/`. All paths relative to `oksis-web/`. Commands: `npm run dev`, `npm run build`, `npm run test`, `npx tsc --noEmit`.
- **Faithful-port mandate** (project rule, [[feedback_handoff_faithful_port]]): port the handoff JSX structure + CSS verbatim, wiring to real hooks — do NOT re-invent layouts. The handoff is the visual source of truth; this plan is the wiring/test contract.
- **Yancılık gate (K-2a-5):** when `DutiesRelieverEnabled` is **false**, every reliever (yancı) surface is entirely unrendered — grid yancı row, "Yancı Ata" menu, teacher-view yancı summary/rows, legend item. Drive this from a single `relieverEnabled` boolean threaded from settings.
- **Müsaitlik is NOT shown anywhere in duty UI (K-2a-2).** No availability colors/warnings/inputs in any duty screen.
- Server state lives only in React Query — never duplicate to Zustand. Every query key carries the tenant prefix via `tenantScopedKey` (`src/shared/config/tenant.ts`). `schoolId` from `useAuthStore((s) => s.user?.schoolId)`.
- No hardcoded Turkish — all copy via i18next keys in the new `duties` namespace (tr + en parity).
- axios via `src/shared/api/httpClient.ts` (base `/api/v1`, bearer, refresh). API responses are `{ data: T }` envelopes — unwrap `res.data.data`.
- Permission gating: `usePermission`/`RequirePermission` from `src/shared/hooks/usePermission.ts` & `src/shared/components/auth/RequirePermission.tsx`. Admin writes → `duties.manage`; read → `duties.view`; teacher view → `duties.view` (self).
- Skeletons for loading (never spinner for full-page).
- shadcn components under `src/app/components/ui/`. `PageHeader` from `src/shared/components/PageHeader/PageHeader.tsx` (props: `title`, `breadcrumb: {label,to?}[]`, `breadcrumbLabel`, `subtitle`, `aside`, `actions`).
- Named exports only (no default export). `cn` from `src/lib/utils`.
- Tests: `__tests__/<name>.test.tsx` next to component; wrap with `createTestWrapper()` from `src/test/utils.tsx`; `import "../../../../shared/i18n"` at top so `useTranslation` resolves (adjust `../` depth to reach `src/shared/i18n`).
- Backend endpoints (design §5, base `/api/v1` is in httpClient): `GET/POST /duties/locations`, `PUT/DELETE /duties/locations/{id}`, `GET/POST /duties/exemptions`, `DELETE /duties/exemptions/{id}`, `GET /duties/roster?termId=`, `PUT /duties/roster?termId=`, `POST /duties/roster/reliever`, `POST /duties/roster/publish`, `GET /duties/roster/versions?termId=`, `GET /duties/summary?termId=`, `GET /duties/available-relievers?termId=&day=&locationId=`, `GET /duties/me?termId=`, `PUT /schools/settings/duties`.
- Commit format: `YYYY-MM-DD <type>[,type]: Türkçe özet.` date `2026-06-19`.

---

## File Structure

**New — admin duty screen (`src/portals/admin/duties/`)**
- `types.ts` — all DTO reflections + view-models (locations, exemptions, roster, assignment, version, summary, reliever candidate, my-duties, policy).
- `keys/dutyKeys.ts` — tenant-scoped React Query key factory (design §6.5).
- `api/dutiesApi.ts` — all endpoint calls (locations/exemptions/roster/reliever/publish/versions/summary/available-relievers/me/settings).
- `hooks/useDutyData.ts` — roster + summary + locations + exemptions + versions queries; `useDutyContext()` (term/academicYear/teachers/days/relieverEnabled).
- `hooks/useDutyMutations.ts` — saveDraft, assignReliever, publish, location CRUD, exemption CRUD, updatePolicy.
- `hooks/useAvailableRelievers.ts` — lazy reliever-candidate query for the assign popover.
- `hooks/useMyDuties.ts` — teacher self query (shared with teacher view).
- `schemas/duty.schema.ts` — Zod schemas (region, exemption, policy).
- `components/DtaAvatar.tsx` — initials avatar (port from handoff helper).
- `components/DutyGrid.tsx` — gün×bölge grid (port `DtaCizelge` grid section) + `slotKey`.
- `components/DtaCellMenu.tsx` — assign/remove popover (port `DtaCellMenu`).
- `components/FairnessPanel.tsx` — Yük & Adalet (port `dta-fair`).
- `components/DutySummaryBar.tsx` — özet metrik şeridi + toolbar.
- `components/DtaVersionDrawer.tsx` — sürüm geçmişi (port).
- `components/DtaPublishModal.tsx` — yayın/supersede modal (port).
- `components/DtaTeacherPreview.tsx` — öğretmen görünümü önizleme modal (port).
- `components/PolitikaTab.tsx` — bölge + muafiyet CRUD + politika (port `DtaPolitika`).
- `components/DtaRegionModal.tsx`, `components/DtaMuafModal.tsx`, `components/DtaConfirm.tsx` — port modals.
- `components/VekaletPlaceholder.tsx` — 2b empty-state tab.
- `DutyAdminPage.tsx` — shell: PageHeader + tabs + tab routing + dialogs/toasts.
- `duties.css` — ported from handoff `duty_admin.css` (+ relevant bits).
- `index.ts` — re-export `DutyAdminPage`.
- `__tests__/DutyGrid.test.tsx`, `__tests__/DtaCellMenu.test.tsx`, `__tests__/DtaPublishModal.test.tsx`, `__tests__/PolitikaTab.test.tsx`, `__tests__/DutyAdminPage.test.tsx`.

**New — teacher duty view (`src/portals/teacher/duties/`)**
- `TeacherDutyPage.tsx` — port `schedule_duty.jsx` `TeacherDuty` (nöbet/yancı only).
- `components/DutyWeek.tsx` — weekly calendar (port `DutyWeek`).
- `teacher-duty.css` — ported styles.
- `__tests__/TeacherDutyPage.test.tsx`.

**Modify**
- `src/app/routes.tsx` — add admin `schedule/duties` route + teacher `duties` route.
- `src/shared/i18n/index.ts` — register `duties` namespace (tr/en) — add import, add to `ns` array + both `resources`.
- New i18n files: `src/shared/i18n/locales/{tr,en}/duties.json`.

---

## Task 1: i18n keys (`duties` namespace) + registration

**Files:**
- Create: `src/shared/i18n/locales/tr/duties.json`
- Create: `src/shared/i18n/locales/en/duties.json`
- Modify: `src/shared/i18n/index.ts`

**Interfaces:**
- Produces the `duties.*` keys consumed by every later task. Root key is `duties` (the JSON file wraps everything under one `"duties": { ... }` object, matching the `timetable.json` → `timetableTr.timetable` registration pattern).

- [ ] **Step 1: Create `tr/duties.json`**

Wrap all keys under a single root `duties` object. Include (copy Turkish copy verbatim from the handoff):
```json
{
  "duties": {
    "title": "Nöbet & Vekâlet Yönetimi",
    "subtitle": "Nöbet çizelgesini ders programıyla çakışmadan kurun, gelmeyen öğretmen için adil vekil görevlendirin; bölge, muafiyet ve yancılık politikasını yönetin.",
    "breadcrumb": { "academic": "Akademik", "schedule": "Ders Programı", "self": "Nöbet & Vekâlet" },
    "tabs": { "roster": "Nöbet Çizelgesi", "substitution": "Vekâlet (Bugün)", "policy": "Bölgeler & Politika" },
    "actions": { "teacherView": "Öğretmen Görünümü", "publish": "Çizelgeyi Yayınla", "save": "Kaydet", "autoDistribute": "Adil Otomatik Dağıt", "dutyLog": "Nöbet Defteri", "export": "Dışa Aktar" },
    "info": { "dayBasedTitle": "Nöbet gün-bazlıdır — ders saatine yazılmaz", "dayBasedBody": "Nöbet, öğretmenin o gün belirli bir kat/bölgenin nöbetçisi olmasıdır; aktif gözetim teneffüs, öğle ve giriş-çıkış pencerelerinde olur. Sistem ders ve çakışmaları engeller; dağıtımı adalet için dengeler." },
    "summary": { "assignments": "haftalık nöbet ataması", "range": "kişi başı nöbet aralığı", "exempt": "muaf öğretmen", "conflicts": "çakışma uyarısı" },
    "legend": { "duty": "Nöbetçi öğretmen", "reliever": "Yancı · öğle arası gözetim devri", "conflict": "Çakışma — ders/müsaitlik", "empty": "Boş — atama bekliyor" },
    "grid": { "regionCol": "Bölge", "regionSub": "gün boyu · teneffüs/öğle", "today": "Bugün", "assign": "Ata", "conflictTag": "Çakışma", "relieverTag": "Yancı" },
    "cellMenu": { "assignTitle": "nöbetçi ata", "changeTitle": "nöbetçiyi değiştir", "search": "Öğretmen ara…", "pickNew": "Yeni nöbetçi seç", "pick": "Nöbetçi öğretmen", "empty": "Eşleşen öğretmen yok", "assigned": "Atanmış", "busyDay": "O gün dolu", "remove": "Atamayı kaldır" },
    "fairness": { "title": "Yük & Adalet", "sub": "Bu dönem · kişi başı nöbet dağılımı", "subWithReliever": "Bu dönem · kişi başı nöbet + yancı dağılımı", "balanced": "Dengeli", "unbalanced": "Dengesiz", "spread": "fark", "duty": "nöbet", "reliever": "yancı" },
    "version": { "barFrom": "{{date}}’ten beri yürürlükte", "history": "Sürüm geçmişi", "drawerTitle": "Sürüm Geçmişi", "drawerSub": "Yürürlük tarihli çizelge sürümleri", "note": "Sezon-ortası değişiklikte çizelge silinmez; yeni sürüm yürürlüğe girer, eskisi o tarihte kapanır. Geçmiş korunur.", "active": "Yürürlükte", "closed": "Kapandı", "view": "Bu sürümü görüntüle", "relieverOff": "Yancılık kapalı" },
    "publish": { "title": "Çizelgeyi yayınla — yeni sürüm", "sub": "Yürürlük tarihli sürüm oluşturulur; mevcut sürüm o tarihte kapanır.", "effLabel": "Yürürlük başlangıcı", "effHint": "Yeni çizelge bu tarihten itibaren geçerli olur. Bu tarihe kadar mevcut sürüm yürürlükte kalır.", "closes": "kapanır", "fromDate": "{{date}} itibarıyla", "newActive": "yürürlükte", "fromDateNew": "{{date}}’ten itibaren", "note": "Geçmiş silinmez — kayıtlar korunur. Etkilenen öğretmenlere bildirim gönderilir.", "doneTitle": "v{{v}} yayınlandı", "doneBody": "{{date}}’ten itibaren yürürlükte. Önceki sürüm kapandı ve geçmişte korunuyor; öğretmenlere bildirim gönderildi.", "footNote": "Sürümle — silme yok", "cancel": "Vazgeç", "confirm": "Yayınla", "ok": "Tamam" },
    "teacherView": { "title": "Öğretmen Görünümü · Önizleme", "sub": "Seçili öğretmenin kendi portalında gördüğü salt-okunur ekran", "banner": "Bu, öğretmenin kendi portalında gördüğü ekranın önizlemesidir. Nöbet ve yancı salt-okunurdur.", "dutyCount": "bu hafta nöbetin", "relieverCount": "öğle arası yancılığın", "emptyTitle": "Bu hafta nöbetin yok", "emptyBody": "Bu öğretmene yürürlükteki çizelgede görev atanmamış.", "weeklyTasks": "Haftalık görevlerin", "dutyType": "Nöbet", "relieverType": "Yancı", "viewOnly": "Görüntüleme", "dutyWindow": "Gün boyu · teneffüs / öğle / giriş-çıkış", "relieverWindow": "Öğle arası · kısa gözetim devri", "close": "Kapat" },
    "region": { "listTitle": "Nöbet Bölgeleri", "listSub": "Okula özel · gözetim noktaları", "add": "Bölge ekle", "addTitle": "Yeni nöbet bölgesi", "addSub": "Okula özel gözetim noktası tanımlayın", "editTitle": "Bölgeyi düzenle", "name": "Bölge adı", "namePlaceholder": "örn. 4. Kat Koridoru", "type": "Tür", "icon": "Simge", "capacity": "Eşzamanlı nöbetçi", "capacitySub": "Paralel gözetim", "activeOn": "Bölge aktif", "activeOff": "Bölge pasif", "activeOnSub": "Çizelgede nöbetçi atanabilir.", "activeOffSub": "Çizelgede görünmez, atama yapılmaz.", "create": "Bölge ekle", "update": "Güncelle", "counter": "{{count}} nöbetçi", "counterParallel": "{{count}} nöbetçi (paralel)", "delTitle": "Bölgeyi sil", "delBody": "{{name}} bölgesi silinsin mi? Bu bölgeye bağlı nöbet atamaları çizelgeden kaldırılır. Bu işlem geri alınamaz.", "delConfirm": "Bölgeyi sil" },
    "exemption": { "listTitle": "Muafiyetler", "listSub": "Nöbetten muaf tutulan öğretmenler", "add": "Muafiyet ekle", "addTitle": "Muafiyet ekle", "addSub": "Öğretmeni nöbet dağıtımının dışında tutar", "teacher": "Öğretmen", "type": "Muafiyet türü", "permanent": "Sürekli", "temporary": "Geçici", "dateRange": "Tarih aralığı", "dateRangePlaceholder": "örn. 10–24 Kas", "reason": "Sebep", "reasonPlaceholder": "örn. İdari görev · sağlık · yarı zamanlı", "submit": "Muafiyet ekle", "note": "Muaf öğretmen dağıtıma alınmaz", "allExemptTitle": "Tüm öğretmenler zaten muaf", "allExemptBody": "Eklenebilecek başka öğretmen yok." },
    "policy": { "title": "Nöbet Politikası", "sub": "Okul bazlı · dağıtımı yönlendirir", "frequency": "Haftalık nöbet sıklığı", "frequencySub": "Öğretmen kadrosuna göre kişi başı nöbet günü sayısı.", "freqTwice": "2 gün / hafta", "freqOnce": "1 gün / hafta", "freqBiweekly": "2 haftada 1", "dayPattern": "Gün düzeni", "dayPatternSub": "Nöbet günleri ardışık mı verilsin, yoksa haftaya yayılsın mı?", "consecutive": "Ardışık günler", "spread": "Haftaya yayılı", "reliever": "Öğle arası yancılığı", "relieverSub": "Nöbetçi öğle yemeğindeyken (15–20 dk) bölgesine bakacak yancı öğretmen planlansın mı? Kapalıysa kavram hiçbir ekranda görünmez.", "relieverOn": "Yancılık görevi açık", "relieverOff": "Yancılık görevi kapalı", "relieverOnSub": "Nöbetlere yancı atanır ve çizelge, öğretmen görünümü ve bildirimlerde gösterilir.", "relieverOffSub": "Yancı ataması ve gösterimi yapılmaz.", "note": "Muaf öğretmenler dağıtıma alınmaz. Politika değişiklikleri yalnızca yeni dağıtımı etkiler — yayınlanmış çizelge korunur.", "saved": "Politika kaydedildi — değişiklikler yeni dağıtımda geçerli", "unsaved": "Kaydedilmemiş değişiklikleriniz bulunmaktadır" },
    "substitution": { "placeholderTitle": "Vekâlet iş akışı yakında", "placeholderBody": "Gelmeyen öğretmen için adil vekil önerisi ve görevlendirme Dilim 2b’de eklenecek." },
    "teacher": { "title": "Nöbet & Vekâlet", "next": "Sıradaki görev", "weekDuties": "bu hafta nöbet", "weekRelievers": "bu hafta yancı", "list": "Liste", "calendar": "Takvim", "upcoming": "Yaklaşan görevler", "weekly": "Haftalık takvim", "emptyTitle": "Bu hafta nöbet veya vekâletin yok", "emptyBody": "Şu an sana atanmış bir görev bulunmuyor. Yeni bir görev atandığında burada görünür.", "dutyType": "Nöbet", "relieverType": "Yancı", "viewOnly": "Görüntüleme", "legend": { "duty": "Nöbet", "reliever": "Yancı" } },
    "state": { "loading": "Yükleniyor", "error": "Nöbet verisi yüklenemedi.", "retry": "Yeniden dene", "emptyTitle": "Henüz nöbet bölgesi tanımlı değil", "emptyBody": "Nöbet çizelgesi kurabilmek için önce okulunuza özel nöbet bölgelerini tanımlayın.", "defineRegion": "Bölge Tanımla", "selectTeacher": "Bir öğretmen seçin" },
    "toast": { "assigned": "nöbetçi atandı", "updated": "güncellendi", "removed": "Atama kaldırıldı — boş bırakıldı", "relieverOn": "Yancılık açıldı", "relieverOff": "Yancılık kapatıldı", "regionAdded": "bölgesi eklendi", "regionUpdated": "güncellendi", "regionDeleted": "bölgesi silindi", "exemptionAdded": "muaf olarak eklendi", "exemptionRemoved": "Muafiyet kaldırıldı", "published": "yayınlandı" }
  }
}
```

- [ ] **Step 2: Create `en/duties.json`**

Same key structure under root `duties`, English values (e.g. `title` = "Duty & Substitution Management", `tabs.roster` = "Duty Roster", `policy.reliever` = "Lunch-break relief", etc.). Keep identical key paths for parity.

- [ ] **Step 3: Register the namespace in `src/shared/i18n/index.ts`**

Add imports near the other locale imports:
```typescript
import dutiesTr from './locales/tr/duties.json';
import dutiesEn from './locales/en/duties.json';
```
Add `'duties'` to the `ns: [...]` array. Add to both `resources.tr` and `resources.en`:
```typescript
duties: dutiesTr.duties,   // in resources.tr
duties: dutiesEn.duties,   // in resources.en
```

- [ ] **Step 4: Verify parity + load**

Run: `npx tsc --noEmit` (JSON imports compile).
Then: `node -e "const t=require('./src/shared/i18n/locales/tr/duties.json');const e=require('./src/shared/i18n/locales/en/duties.json');const f=(o,p='')=>Object.entries(o).flatMap(([k,v])=>typeof v==='object'?f(v,p+k+'.'):[p+k]);const a=f(t.duties),b=f(e.duties);const miss=a.filter(x=>!b.includes(x)).concat(b.filter(x=>!a.includes(x)));console.log(miss.length?'MISMATCH '+miss.join(','):'PARITY OK')"`
Expected: `PARITY OK`.

- [ ] **Step 5: Commit**

```bash
git add src/shared/i18n/locales/tr/duties.json src/shared/i18n/locales/en/duties.json src/shared/i18n/index.ts
git commit -m "2026-06-19 feat: Nöbet & Vekâlet i18n anahtarları (duties tr/en) ve namespace kaydı eklendi."
```

---

## Task 2: Types + query keys + API layer

**Files:**
- Create: `src/portals/admin/duties/types.ts`
- Create: `src/portals/admin/duties/keys/dutyKeys.ts`
- Create: `src/portals/admin/duties/api/dutiesApi.ts`

**Interfaces:**
- Produces:
  - Enums/types: `DutyLocationType` (0..5), `DutyRosterStatus` (0..2), `DutyExemptionType` (0|1), `DutyWeeklyFrequency` (0|1|2), `DutyDayPattern` (0|1).
  - DTOs: `DutyLocationDto`, `DutyExemptionDto`, `DutyAssignmentDto`, `DutyRosterDto`, `DutyVersionDto`, `DutyHubSummaryDto`, `AvailableRelieverDto`, `MyDutyItemDto`, `MyDutiesDto`, `DutyPolicyDto`.
  - Inputs: `SaveRosterBody`, `AssignRelieverBody`, `PublishRosterBody`, `UpsertLocationBody`, `CreateExemptionBody`, `UpdatePolicyBody`.
  - `dutyKeys.*` factory.
  - `dutiesApi.*` calls.

- [ ] **Step 1: Write `types.ts`**

```typescript
// Nöbet & Vekâlet (Dilim 2a) — backend DTO yansımaları. Müsaitlik buraya HİÇ girmez (K-2a-2).
export type DutyLocationType = 0 | 1 | 2 | 3 | 4 | 5; // Floor/Canteen/Garden/Gate/Hall/Other
export type DutyRosterStatus = 0 | 1 | 2; // Draft/Published/Superseded
export type DutyExemptionType = 0 | 1; // Permanent/Temporary
export type DutyWeeklyFrequency = 0 | 1 | 2; // Twice/Once/Biweekly
export type DutyDayPattern = 0 | 1; // Spread/Consecutive

export interface DutyLocationDto {
  id: string;
  name: string;
  type: DutyLocationType;
  icon: string | null;
  capacity: number;
  isActive: boolean;
}

export interface DutyExemptionDto {
  id: string;
  teacherId: string;
  teacherName: string;
  type: DutyExemptionType;
  from: string | null; // ISO date
  to: string | null;
  reason: string;
}

export interface DutyAssignmentDto {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherBranch: string;
  day: number; // DayOfWeek 0..6
  locationId: string;
  relieverId: string | null;
  relieverName: string | null;
  conflict: string | null; // ileriye dönük uyarı metni (AS-2a-1)
}

export interface DutyRosterDto {
  rosterId: string;
  termId: string;
  status: DutyRosterStatus;
  version: number;
  effectiveFrom: string | null;
  assignments: DutyAssignmentDto[];
}

export interface DutyVersionDto {
  rosterId: string;
  version: number;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  status: DutyRosterStatus;
  createdByName: string;
  createdAt: string;
  note: string | null;
}

export interface DutyHubSummaryDto {
  totalAssignments: number;
  minDuty: number;
  maxDuty: number;
  exemptCount: number;
  conflictCount: number;
}

export interface AvailableRelieverDto {
  id: string;
  name: string;
  branch: string | null; // BE: string? Branch
  currentDutyLoad: number; // BE: CurrentDutyLoad — handoff shows the load count next to each candidate
}

export interface MyDutyItemDto {
  day: number;
  locationId: string;
  locationName: string;
  kind: "duty" | "reliever";
}

export interface MyDutiesDto {
  termId: string;
  version: number;
  effectiveFrom: string | null;
  items: MyDutyItemDto[];
}

export interface DutyPolicyDto {
  relieverEnabled: boolean;
  weeklyFrequency: DutyWeeklyFrequency;
  dayPattern: DutyDayPattern;
}

// --- write inputs ---
export interface RosterAssignmentInput {
  teacherId: string;
  day: number;
  locationId: string;
  relieverId: string | null; // full-state save preserves reliever links (BE DutyAssignmentInput.RelieverId)
}
export interface SaveRosterBody {
  termId: string;
  academicYearId: string;
  assignments: RosterAssignmentInput[];
}
export interface AssignRelieverBody {
  rosterId: string; // BE AssignRelieverCommand.RosterId (editor holds it from DutyRosterDto.rosterId)
  assignmentId: string;
  relieverId: string | null; // null → kaldır
}
export interface PublishRosterBody {
  termId: string;
  effectiveFrom: string; // ISO date
}
export interface UpsertLocationBody {
  name: string;
  type: DutyLocationType;
  icon: string | null;
  capacity: number;
  isActive: boolean;
}
export interface CreateExemptionBody {
  teacherId: string;
  type: DutyExemptionType;
  from: string | null;
  to: string | null;
  reason: string;
}
export interface UpdatePolicyBody {
  relieverEnabled: boolean;
  weeklyFrequency: DutyWeeklyFrequency;
  dayPattern: DutyDayPattern;
}

/** Hücre anahtarı: `${day}-${locationId}`. */
export const cellKey = (day: number, locationId: string) => `${day}-${locationId}`;
```

- [ ] **Step 2: Write `keys/dutyKeys.ts`**

```typescript
import { tenantScopedKey } from "../../../../shared/config/tenant";

/** Nöbet & Vekâlet sorguları için tenant-scope'lu React Query key fabrikası (design §6.5). */
export const dutyKeys = {
  all: (schoolId: string | null | undefined) =>
    tenantScopedKey(schoolId, ["duties"] as const),
  locations: (schoolId: string | null | undefined) =>
    tenantScopedKey(schoolId, ["duties", "locations"] as const),
  exemptions: (schoolId: string | null | undefined) =>
    tenantScopedKey(schoolId, ["duties", "exemptions"] as const),
  roster: (schoolId: string | null | undefined, termId: string) =>
    tenantScopedKey(schoolId, ["duties", "roster", termId] as const),
  summary: (schoolId: string | null | undefined, termId: string) =>
    tenantScopedKey(schoolId, ["duties", "summary", termId] as const),
  versions: (schoolId: string | null | undefined, termId: string) =>
    tenantScopedKey(schoolId, ["duties", "versions", termId] as const),
  availableRelievers: (schoolId: string | null | undefined, termId: string, day: number, locationId: string) =>
    tenantScopedKey(schoolId, ["duties", "available-relievers", termId, day, locationId] as const),
  my: (schoolId: string | null | undefined, termId: string) =>
    tenantScopedKey(schoolId, ["duties", "my", termId] as const),
  policy: (schoolId: string | null | undefined) =>
    tenantScopedKey(schoolId, ["duties", "policy"] as const),
};
```

- [ ] **Step 3: Write `api/dutiesApi.ts`**

```typescript
import { httpClient } from "../../../../shared/api/httpClient";
import type {
  AvailableRelieverDto, AssignRelieverBody, CreateExemptionBody, DutyExemptionDto,
  DutyHubSummaryDto, DutyLocationDto, DutyPolicyDto, DutyRosterDto, DutyVersionDto,
  MyDutiesDto, PublishRosterBody, SaveRosterBody, UpdatePolicyBody, UpsertLocationBody,
} from "../types";

interface ApiEnvelope<T> { data: T; }
const unwrap = <T>(r: { data: ApiEnvelope<T> }) => r.data.data;

export const dutiesApi = {
  listLocations: async (signal?: AbortSignal) =>
    unwrap(await httpClient.get<ApiEnvelope<DutyLocationDto[]>>("/duties/locations", { signal })),
  createLocation: async (body: UpsertLocationBody) =>
    unwrap(await httpClient.post<ApiEnvelope<DutyLocationDto>>("/duties/locations", body)),
  updateLocation: async (id: string, body: UpsertLocationBody) =>
    unwrap(await httpClient.put<ApiEnvelope<DutyLocationDto>>(`/duties/locations/${id}`, body)),
  deleteLocation: async (id: string) => { await httpClient.delete(`/duties/locations/${id}`); },

  listExemptions: async (signal?: AbortSignal) =>
    unwrap(await httpClient.get<ApiEnvelope<DutyExemptionDto[]>>("/duties/exemptions", { signal })),
  createExemption: async (body: CreateExemptionBody) =>
    unwrap(await httpClient.post<ApiEnvelope<DutyExemptionDto>>("/duties/exemptions", body)),
  deleteExemption: async (id: string) => { await httpClient.delete(`/duties/exemptions/${id}`); },

  getRoster: async (termId: string, signal?: AbortSignal) =>
    unwrap(await httpClient.get<ApiEnvelope<DutyRosterDto>>(`/duties/roster?termId=${termId}`, { signal })),
  saveRoster: async (termId: string, body: SaveRosterBody) =>
    unwrap(await httpClient.put<ApiEnvelope<DutyRosterDto>>(`/duties/roster?termId=${termId}`, body)),
  assignReliever: async (body: AssignRelieverBody) => { await httpClient.post("/duties/roster/reliever", body); },
  publishRoster: async (body: PublishRosterBody) =>
    unwrap(await httpClient.post<ApiEnvelope<DutyVersionDto>>("/duties/roster/publish", body)),

  getVersions: async (termId: string, signal?: AbortSignal) =>
    unwrap(await httpClient.get<ApiEnvelope<DutyVersionDto[]>>(`/duties/roster/versions?termId=${termId}`, { signal })),
  getSummary: async (termId: string, signal?: AbortSignal) =>
    unwrap(await httpClient.get<ApiEnvelope<DutyHubSummaryDto>>(`/duties/summary?termId=${termId}`, { signal })),
  getAvailableRelievers: async (termId: string, day: number, locationId: string, signal?: AbortSignal) =>
    unwrap(await httpClient.get<ApiEnvelope<AvailableRelieverDto[]>>(
      `/duties/available-relievers?termId=${termId}&day=${day}&locationId=${locationId}`, { signal })),
  getMyDuties: async (termId: string, signal?: AbortSignal) =>
    unwrap(await httpClient.get<ApiEnvelope<MyDutiesDto>>(`/duties/me?termId=${termId}`, { signal })),

  getPolicy: async (signal?: AbortSignal) =>
    unwrap(await httpClient.get<ApiEnvelope<DutyPolicyDto>>("/schools/settings/duties", { signal })),
  updatePolicy: async (body: UpdatePolicyBody) =>
    unwrap(await httpClient.put<ApiEnvelope<DutyPolicyDto>>("/schools/settings/duties", body)),
};
```
> Confirmed against the BE plan (Task 14): `GET /schools/settings/duties` → `GetDutiesConfigurationQuery` returns `DutyPolicyDto`, and `PUT /schools/settings/duties` returns the updated `DutyPolicyDto`. Field names/casing match (`relieverEnabled`, `weeklyFrequency`, `dayPattern`; enums as ints).

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/portals/admin/duties/types.ts src/portals/admin/duties/keys/dutyKeys.ts src/portals/admin/duties/api/dutiesApi.ts
git commit -m "2026-06-19 feat: Nöbet tipleri, query key'leri ve API katmanı eklendi."
```

---

## Task 3: React Query hooks

**Files:**
- Create: `src/portals/admin/duties/hooks/useDutyData.ts`
- Create: `src/portals/admin/duties/hooks/useDutyMutations.ts`
- Create: `src/portals/admin/duties/hooks/useAvailableRelievers.ts`
- Create: `src/portals/admin/duties/hooks/useMyDuties.ts`
- Test: `src/portals/admin/duties/__tests__/useDutyData.test.tsx`

**Interfaces:**
- Consumes: `dutiesApi`, `dutyKeys`, `useAuthStore`.
- Produces:
  - `useDutyLocations()`, `useDutyExemptions()`, `useDutyRoster(termId)`, `useDutySummary(termId)`, `useDutyVersions(termId)`, `useDutyPolicy()` queries.
  - `useDutyMutations(termId)` → `{ saveRoster, assignReliever, publishRoster, createLocation, updateLocation, deleteLocation, createExemption, deleteExemption, updatePolicy }` (each invalidates the right keys).
  - `useAvailableRelievers(termId, day, locationId, enabled)` lazy query.
  - `useMyDuties(termId)` (shared with teacher view).

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createTestWrapper } from "../../../../test/utils";
import { useDutyLocations } from "../hooks/useDutyData";
import { dutiesApi } from "../api/dutiesApi";

vi.mock("../api/dutiesApi");

describe("useDutyLocations", () => {
  it("fetches the location catalogue", async () => {
    vi.mocked(dutiesApi.listLocations).mockResolvedValue([
      { id: "l1", name: "1. Kat", type: 0, icon: "building", capacity: 1, isActive: true },
    ]);
    const { result } = renderHook(() => useDutyLocations(), { wrapper: createTestWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
  });
});
```
> `useAuthStore` returns `undefined` schoolId in tests → keys still resolve (`"anonymous"`), queries are `enabled` only when `schoolId` truthy. For this test, mock the store or assert via `isSuccess` after enabling. If `schoolId` gates the query, add `vi.mock("../../../../shared/store/authStore", ...)` returning a fixed `schoolId`. Mirror how `useHubData.test` (if present) or other timetable hook tests set this up.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- useDutyData`
Expected: FAIL — hook not defined.

- [ ] **Step 3: Implement `hooks/useDutyData.ts`**

```typescript
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../../../shared/store/authStore";
import { dutyKeys } from "../keys/dutyKeys";
import { dutiesApi } from "../api/dutiesApi";

const useSchoolId = () => useAuthStore((s) => s.user?.schoolId);

export function useDutyLocations() {
  const schoolId = useSchoolId();
  return useQuery({
    queryKey: dutyKeys.locations(schoolId),
    queryFn: ({ signal }) => dutiesApi.listLocations(signal),
    enabled: Boolean(schoolId),
  });
}

export function useDutyExemptions() {
  const schoolId = useSchoolId();
  return useQuery({
    queryKey: dutyKeys.exemptions(schoolId),
    queryFn: ({ signal }) => dutiesApi.listExemptions(signal),
    enabled: Boolean(schoolId),
  });
}

export function useDutyRoster(termId: string | null) {
  const schoolId = useSchoolId();
  return useQuery({
    queryKey: dutyKeys.roster(schoolId, termId ?? ""),
    queryFn: ({ signal }) => dutiesApi.getRoster(termId!, signal),
    enabled: Boolean(schoolId) && Boolean(termId),
  });
}

export function useDutySummary(termId: string | null) {
  const schoolId = useSchoolId();
  return useQuery({
    queryKey: dutyKeys.summary(schoolId, termId ?? ""),
    queryFn: ({ signal }) => dutiesApi.getSummary(termId!, signal),
    enabled: Boolean(schoolId) && Boolean(termId),
  });
}

export function useDutyVersions(termId: string | null) {
  const schoolId = useSchoolId();
  return useQuery({
    queryKey: dutyKeys.versions(schoolId, termId ?? ""),
    queryFn: ({ signal }) => dutiesApi.getVersions(termId!, signal),
    enabled: Boolean(schoolId) && Boolean(termId),
  });
}

export function useDutyPolicy() {
  const schoolId = useSchoolId();
  return useQuery({
    queryKey: dutyKeys.policy(schoolId),
    queryFn: ({ signal }) => dutiesApi.getPolicy(signal),
    enabled: Boolean(schoolId),
  });
}
```

- [ ] **Step 4: Implement `hooks/useAvailableRelievers.ts`**

```typescript
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../../../shared/store/authStore";
import { dutyKeys } from "../keys/dutyKeys";
import { dutiesApi } from "../api/dutiesApi";

export function useAvailableRelievers(
  termId: string | null, day: number | null, locationId: string | null, enabled: boolean,
) {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  return useQuery({
    queryKey: dutyKeys.availableRelievers(schoolId, termId ?? "", day ?? -1, locationId ?? ""),
    queryFn: ({ signal }) => dutiesApi.getAvailableRelievers(termId!, day!, locationId!, signal),
    enabled: enabled && Boolean(schoolId) && Boolean(termId) && day !== null && Boolean(locationId),
  });
}
```

- [ ] **Step 5: Implement `hooks/useMyDuties.ts`**

```typescript
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../../../shared/store/authStore";
import { dutyKeys } from "../keys/dutyKeys";
import { dutiesApi } from "../api/dutiesApi";

export function useMyDuties(termId: string | null) {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  return useQuery({
    queryKey: dutyKeys.my(schoolId, termId ?? ""),
    queryFn: ({ signal }) => dutiesApi.getMyDuties(termId!, signal),
    enabled: Boolean(schoolId) && Boolean(termId),
  });
}
```

- [ ] **Step 6: Implement `hooks/useDutyMutations.ts`**

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../../../shared/store/authStore";
import { dutyKeys } from "../keys/dutyKeys";
import { dutiesApi } from "../api/dutiesApi";
import type {
  AssignRelieverBody, CreateExemptionBody, PublishRosterBody, SaveRosterBody,
  UpdatePolicyBody, UpsertLocationBody,
} from "../types";

export function useDutyMutations(termId: string | null) {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const qc = useQueryClient();
  const tid = termId ?? "";
  const invRoster = () => {
    void qc.invalidateQueries({ queryKey: dutyKeys.roster(schoolId, tid) });
    void qc.invalidateQueries({ queryKey: dutyKeys.summary(schoolId, tid) });
  };

  return {
    saveRoster: useMutation({
      mutationFn: (body: SaveRosterBody) => dutiesApi.saveRoster(tid, body),
      onSuccess: invRoster,
    }),
    assignReliever: useMutation({
      mutationFn: (body: AssignRelieverBody) => dutiesApi.assignReliever(body),
      onSuccess: invRoster,
    }),
    publishRoster: useMutation({
      mutationFn: (body: PublishRosterBody) => dutiesApi.publishRoster(body),
      onSuccess: () => {
        invRoster();
        void qc.invalidateQueries({ queryKey: dutyKeys.versions(schoolId, tid) });
      },
    }),
    createLocation: useMutation({
      mutationFn: (body: UpsertLocationBody) => dutiesApi.createLocation(body),
      onSuccess: () => void qc.invalidateQueries({ queryKey: dutyKeys.locations(schoolId) }),
    }),
    updateLocation: useMutation({
      mutationFn: (v: { id: string; body: UpsertLocationBody }) => dutiesApi.updateLocation(v.id, v.body),
      onSuccess: () => void qc.invalidateQueries({ queryKey: dutyKeys.locations(schoolId) }),
    }),
    deleteLocation: useMutation({
      mutationFn: (id: string) => dutiesApi.deleteLocation(id),
      onSuccess: () => { void qc.invalidateQueries({ queryKey: dutyKeys.locations(schoolId) }); invRoster(); },
    }),
    createExemption: useMutation({
      mutationFn: (body: CreateExemptionBody) => dutiesApi.createExemption(body),
      onSuccess: () => void qc.invalidateQueries({ queryKey: dutyKeys.exemptions(schoolId) }),
    }),
    deleteExemption: useMutation({
      mutationFn: (id: string) => dutiesApi.deleteExemption(id),
      onSuccess: () => void qc.invalidateQueries({ queryKey: dutyKeys.exemptions(schoolId) }),
    }),
    updatePolicy: useMutation({
      mutationFn: (body: UpdatePolicyBody) => dutiesApi.updatePolicy(body),
      onSuccess: () => void qc.invalidateQueries({ queryKey: dutyKeys.policy(schoolId) }),
    }),
  };
}
```

- [ ] **Step 7: Run test + typecheck**

Run: `npm run test -- useDutyData` → PASS.
Run: `npx tsc --noEmit` → no errors.

- [ ] **Step 8: Commit**

```bash
git add src/portals/admin/duties/hooks/ src/portals/admin/duties/__tests__/useDutyData.test.tsx
git commit -m "2026-06-19 feat: Nöbet React Query hook'ları (queries + mutations) eklendi."
```

---

## Task 4: `duties.css` + `DtaAvatar`

**Files:**
- Create: `src/portals/admin/duties/duties.css`
- Create: `src/portals/admin/duties/components/DtaAvatar.tsx`
- Test: `src/portals/admin/duties/__tests__/DtaAvatar.test.tsx`

**Interfaces:**
- Produces: `DtaAvatar({ name, size?, className? })` (initials + deterministic color); `avInitials(name)`, `avColor(name)` helpers.

- [ ] **Step 1: Port the CSS**

Copy `oksis-layout/project/app/duty_admin.css` into `src/portals/admin/duties/duties.css` verbatim, then: (a) replace any hard-coded colors that have design tokens with the existing CSS variables already used by the timetable screens (`--accent`, `--accent-bright`, `--warning`, `--danger`, `--success`, `--line`, `--surface`, `--text-body`, `--text-faint`, etc. — grep `src/portals/admin/timetable/*.css` for the exact token names); (b) keep all `.dta-*` / `.tdy-*` class names unchanged so the ported JSX matches.

- [ ] **Step 2: Write the failing test**

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DtaAvatar, avInitials } from "../components/DtaAvatar";

describe("DtaAvatar", () => {
  it("renders 2-letter initials", () => {
    render(<DtaAvatar name="Ahmet Yılmaz" />);
    expect(screen.getByText("AY")).toBeInTheDocument();
  });
  it("avInitials handles single word", () => {
    expect(avInitials("Ahmet")).toBe("A");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test -- DtaAvatar`
Expected: FAIL — component not defined.

- [ ] **Step 4: Implement `DtaAvatar.tsx`** (port handoff `dtaAv`/`dtaIni`/`DtaAvatar`)

```typescript
import { cn } from "../../../../lib/utils";

const COLORS = ["#2F4DA0", "#A93B62", "#5B45B0", "#0C6B66", "#2E7D36", "#92600F", "#146C94", "#5F6B16", "#B45A0C", "#28617A"];

export const avColor = (name: string) => COLORS[(name.charCodeAt(0) + name.length) % COLORS.length];
export const avInitials = (name: string) =>
  name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

interface Props { name: string; size?: number; className?: string; }

export function DtaAvatar({ name, size = 26, className }: Props) {
  return (
    <span className={cn("av", className)} style={{ background: avColor(name), width: size, height: size }}>
      {avInitials(name)}
    </span>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- DtaAvatar` → PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add src/portals/admin/duties/duties.css src/portals/admin/duties/components/DtaAvatar.tsx src/portals/admin/duties/__tests__/DtaAvatar.test.tsx
git commit -m "2026-06-19 feat: Nöbet ekranı stilleri (duties.css) ve DtaAvatar bileşeni port edildi."
```

---

## Task 5: DutyGrid + DtaCellMenu (core grid + assign popover)

**Files:**
- Create: `src/portals/admin/duties/components/DutyGrid.tsx`
- Create: `src/portals/admin/duties/components/DtaCellMenu.tsx`
- Test: `src/portals/admin/duties/__tests__/DutyGrid.test.tsx`
- Test: `src/portals/admin/duties/__tests__/DtaCellMenu.test.tsx`

**Interfaces:**
- Consumes: `DutyLocationDto`, `DutyAssignmentDto`, `cellKey`, `DtaAvatar`, `relieverEnabled` flag.
- Produces:
  - `DutyGrid({ days, locations, assignments, relieverEnabled, today, onCellClick })` — renders gün×bölge grid; each active location is a row, each `(day,location)` a cell. Empty cell → "Ata"; filled → teacher (+ yancı row if `relieverEnabled` and `relieverName`); conflict → red border + tag.
  - `DtaCellMenu({ location, day, assignments, teachers, busyTeacherIds, currentTeacherId, anchor, onAssign, onRemove, onClose })` — search + sorted teacher list; teachers already on duty that day are disabled ("O gün dolu"); exempt teachers excluded by caller. `busyTeacherIds: Set<string>`.

- [ ] **Step 1: Write the failing `DutyGrid` test**

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "../../../../shared/i18n";
import { DutyGrid } from "../components/DutyGrid";
import type { DutyAssignmentDto, DutyLocationDto } from "../types";

const days = [0, 1, 2, 3, 4];
const locations: DutyLocationDto[] = [
  { id: "kat1", name: "1. Kat", type: 0, icon: "building", capacity: 1, isActive: true },
];
const assignments: DutyAssignmentDto[] = [
  { id: "a1", teacherId: "t1", teacherName: "Ahmet Yılmaz", teacherBranch: "Matematik", day: 0, locationId: "kat1", relieverId: "t2", relieverName: "Murat Eren", conflict: null },
];

describe("DutyGrid", () => {
  it("renders an assigned teacher in the cell", () => {
    render(<DutyGrid days={days} locations={locations} assignments={assignments} relieverEnabled today={1} onCellClick={() => {}} />);
    expect(screen.getByText("Ahmet Yılmaz")).toBeInTheDocument();
  });

  it("shows the reliever row when relieverEnabled is true", () => {
    render(<DutyGrid days={days} locations={locations} assignments={assignments} relieverEnabled today={1} onCellClick={() => {}} />);
    expect(screen.getByText("Murat Eren")).toBeInTheDocument();
  });

  it("HIDES the reliever row when relieverEnabled is false (K-2a-5)", () => {
    render(<DutyGrid days={days} locations={locations} assignments={assignments} relieverEnabled={false} today={1} onCellClick={() => {}} />);
    expect(screen.queryByText("Murat Eren")).not.toBeInTheDocument();
  });

  it("calls onCellClick for an empty cell", () => {
    const onCellClick = vi.fn();
    render(<DutyGrid days={days} locations={locations} assignments={assignments} relieverEnabled today={1} onCellClick={onCellClick} />);
    // (day 1, kat1) is empty
    fireEvent.click(screen.getByTestId("duty-cell-1-kat1"));
    expect(onCellClick).toHaveBeenCalledWith(1, locations[0]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- DutyGrid`
Expected: FAIL — component not defined.

- [ ] **Step 3: Implement `DutyGrid.tsx`** (port `DtaCizelge` grid section from `duty_admin.jsx` lines ~268-321)

Port the `dta-gridwrap`/`dta-grid` markup. Replace the local `Icon` with `lucide-react` icons (map handoff icon names: `building`→`Building2`, `utensils`→`Utensils`, `sun`→`Sun`, `door-open`→`DoorOpen`, `map-pin`→`MapPin`, `book`→`BookOpen`, `plus`→`Plus`, `alert-triangle`→`AlertTriangle`, `coffee`→`Coffee`). Build a `Map<cellKey, DutyAssignmentDto[]>` (capacity → array per cell, K-2a-3). Each cell `data-testid={`duty-cell-${day}-${location.id}`}`. Render the yancı sub-row ONLY when `relieverEnabled && a.relieverName`. Cell with `conflict` gets `.conflict` class + tag. The `t` from `useTranslation("duties")`.

Key shape:
```tsx
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Building2, BookOpen, Coffee, DoorOpen, MapPin, Plus, Sun, Utensils } from "lucide-react";
import { cn } from "../../../../lib/utils";
import { DtaAvatar } from "./DtaAvatar";
import { cellKey, type DutyAssignmentDto, type DutyLocationDto } from "../types";
import "../duties.css";

const ICONS: Record<string, typeof Building2> = { building: Building2, utensils: Utensils, sun: Sun, "door-open": DoorOpen, "map-pin": MapPin, book: BookOpen };
const DAY_SHORT = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
const DAY_LONG = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

interface Props {
  days: number[];
  locations: DutyLocationDto[];
  assignments: DutyAssignmentDto[];
  relieverEnabled: boolean;
  today: number | null;
  onCellClick: (day: number, location: DutyLocationDto) => void;
}

export function DutyGrid({ days, locations, assignments, relieverEnabled, today, onCellClick }: Props) {
  const { t } = useTranslation("duties");
  const byCell = useMemo(() => {
    const m = new Map<string, DutyAssignmentDto[]>();
    for (const a of assignments) {
      const k = cellKey(a.day, a.locationId);
      (m.get(k) ?? m.set(k, []).get(k)!).push(a);
    }
    return m;
  }, [assignments]);
  const active = locations.filter((l) => l.isActive);
  // ... port grid markup: corner header, day headers, region rows, cells (empty → "Ata"; filled → DtaAvatar + name + branch + optional conflict tag + optional yancı row when relieverEnabled)
}
```
Render the full grid following the handoff structure exactly; use `DAY_SHORT`/`DAY_LONG` for headers and `t("grid.today")` for the `today` column.

- [ ] **Step 4: Run `DutyGrid` test → PASS**

Run: `npm run test -- DutyGrid`
Expected: PASS (4 tests).

- [ ] **Step 5: Write the failing `DtaCellMenu` test**

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "../../../../shared/i18n";
import { DtaCellMenu } from "../components/DtaCellMenu";

const teachers = [
  { id: "t1", name: "Ahmet Yılmaz", branch: "Matematik" },
  { id: "t2", name: "Burak Tekin", branch: "Matematik" },
];

describe("DtaCellMenu", () => {
  it("disables a teacher already on duty that day", () => {
    render(
      <DtaCellMenu
        location={{ id: "kat1", name: "1. Kat", type: 0, icon: "building", capacity: 1, isActive: true }}
        day={1} dayLabel="Salı" teachers={teachers} busyTeacherIds={new Set(["t2"])}
        currentTeacherId={null} anchor={{ left: 0, top: 0, bottom: 0, right: 0, width: 0 }}
        onAssign={vi.fn()} onRemove={vi.fn()} onClose={vi.fn()}
      />,
    );
    const burak = screen.getByRole("button", { name: /Burak Tekin/ });
    expect(burak).toBeDisabled();
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npm run test -- DtaCellMenu`
Expected: FAIL — component not defined.

- [ ] **Step 7: Implement `DtaCellMenu.tsx`** (port handoff `DtaCellMenu`, lines ~110-190)

Port verbatim, replacing local data with props: `teachers: {id,name,branch}[]` (caller passes non-exempt teachers), `busyTeacherIds: Set<string>` (caller computes from current-day assignments excluding this cell), `currentTeacherId`. Disable+skip-onAssign for busy (non-current) teachers; show "Atanmış"/"O gün dolu"/load badge. Search filters by name/branch (`toLocaleLowerCase("tr")`). Use `t("cellMenu.*")`. Keep the popover positioning logic (`anchor`, viewport clamp, flip-up).

- [ ] **Step 8: Run test + typecheck**

Run: `npm run test -- DtaCellMenu` → PASS.
Run: `npx tsc --noEmit` → no errors.

- [ ] **Step 9: Commit**

```bash
git add src/portals/admin/duties/components/DutyGrid.tsx src/portals/admin/duties/components/DtaCellMenu.tsx src/portals/admin/duties/__tests__/DutyGrid.test.tsx src/portals/admin/duties/__tests__/DtaCellMenu.test.tsx
git commit -m "2026-06-19 feat: Nöbet ızgarası (DutyGrid) ve hücre atama popover'ı (DtaCellMenu) port edildi."
```

---

## Task 6: FairnessPanel + DutySummaryBar (özet + toolbar + lejant)

**Files:**
- Create: `src/portals/admin/duties/components/FairnessPanel.tsx`
- Create: `src/portals/admin/duties/components/DutySummaryBar.tsx`
- Test: `src/portals/admin/duties/__tests__/FairnessPanel.test.tsx`

**Interfaces:**
- Consumes: `DutyAssignmentDto[]`, `relieverEnabled`, `DutyHubSummaryDto`.
- Produces:
  - `computeLoad(assignments, relieverEnabled)` → `Array<{ teacherId; name; branch; duty; reliever }>` sorted desc by duty (port `dtaCounts`/`fairRows`).
  - `FairnessPanel({ assignments, relieverEnabled })` — bars + balanced/unbalanced pill.
  - `DutySummaryBar({ summary, relieverEnabled, version, effectiveFrom, onOpenHistory, onOpenAuto, onOpenDefter, onExport })` — 4 stat cards + toolbar (term selector placeholder, version bar, Nöbet Defteri **disabled**, Dışa Aktar, Adil Otomatik Dağıt **disabled**) + legend.

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "../../../../shared/i18n";
import { FairnessPanel, computeLoad } from "../components/FairnessPanel";
import type { DutyAssignmentDto } from "../types";

const a = (teacherId: string, name: string, day: number): DutyAssignmentDto => ({
  id: `${teacherId}-${day}`, teacherId, teacherName: name, teacherBranch: "Mat", day, locationId: "kat1", relieverId: null, relieverName: null, conflict: null,
});

describe("FairnessPanel", () => {
  it("computeLoad counts duties per teacher", () => {
    const rows = computeLoad([a("t1", "Ahmet", 0), a("t1", "Ahmet", 1), a("t2", "Burak", 0)], false);
    expect(rows.find((r) => r.teacherId === "t1")?.duty).toBe(2);
    expect(rows.find((r) => r.teacherId === "t2")?.duty).toBe(1);
  });

  it("renders the fairness title", () => {
    render(<FairnessPanel assignments={[a("t1", "Ahmet", 0)]} relieverEnabled={false} />);
    expect(screen.getByText("Yük & Adalet")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- FairnessPanel`
Expected: FAIL.

- [ ] **Step 3: Implement `FairnessPanel.tsx`** (port `dta-fair` section + `dtaCounts`)

`computeLoad` aggregates per-teacher `{duty, reliever}` (reliever counted only when `relieverEnabled`, from `relieverId`). Render bars (`width = duty/maxDuty*100%`), hi/lo classes, spread pill (`t("fairness.balanced"/"unbalanced")`). The fairness sub uses `t("fairness.sub")` / `t("fairness.subWithReliever")` per `relieverEnabled`.

- [ ] **Step 4: Implement `DutySummaryBar.tsx`** (port `dta-summary` + `dta-toolbar` + `dta-legend`)

Stat cards from `DutyHubSummaryDto` (`totalAssignments`, `minDuty`–`maxDuty`, `exemptCount`, `conflictCount`). Toolbar: version bar (`t("version.barFrom", { date: effectiveFrom })`, `onOpenHistory`), reliever-off badge when `!relieverEnabled`, **Nöbet Defteri button `disabled` with title "Dilim 2d"**, Dışa Aktar (`onExport`), **Adil Otomatik Dağıt button `disabled` with title "Dilim 2c"**. Legend hides the reliever item when `!relieverEnabled`.

- [ ] **Step 5: Run test + typecheck**

Run: `npm run test -- FairnessPanel` → PASS.
Run: `npx tsc --noEmit` → no errors.

- [ ] **Step 6: Commit**

```bash
git add src/portals/admin/duties/components/FairnessPanel.tsx src/portals/admin/duties/components/DutySummaryBar.tsx src/portals/admin/duties/__tests__/FairnessPanel.test.tsx
git commit -m "2026-06-19 feat: Yük & Adalet paneli ve nöbet özet/araç çubuğu (2c/2d butonları disabled) port edildi."
```

---

## Task 7: DtaVersionDrawer + DtaPublishModal + DtaTeacherPreview

**Files:**
- Create: `src/portals/admin/duties/components/DtaVersionDrawer.tsx`
- Create: `src/portals/admin/duties/components/DtaPublishModal.tsx`
- Create: `src/portals/admin/duties/components/DtaTeacherPreview.tsx`
- Test: `src/portals/admin/duties/__tests__/DtaPublishModal.test.tsx`

**Interfaces:**
- Consumes: `DutyVersionDto[]`, `DutyAssignmentDto[]`, `DutyLocationDto[]`, `relieverEnabled`, current version.
- Produces:
  - `DtaVersionDrawer({ versions, onClose })` — port `DtaVersionDrawer`.
  - `DtaPublishModal({ currentVersion, onClose, onPublish })` — date picker + supersede preview (vN closes → vN+1 active) + success state. `onPublish(effectiveFromIso: string)`.
  - `DtaTeacherPreview({ teachers, assignments, locations, relieverEnabled, version, effectiveFrom, onClose })` — read-only per-teacher preview (port `DtaTeacherPreview` + `dtaTeacherItems`). `teachers: {id,name,branch}[]`.

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "../../../../shared/i18n";
import { DtaPublishModal } from "../components/DtaPublishModal";

describe("DtaPublishModal", () => {
  it("shows the supersede preview (current closes, next active)", () => {
    render(<DtaPublishModal currentVersion={2} onClose={() => {}} onPublish={() => {}} />);
    expect(screen.getByText(/v2/)).toBeInTheDocument();
    expect(screen.getByText(/v3/)).toBeInTheDocument();
  });

  it("calls onPublish with the effective date ISO", () => {
    const onPublish = vi.fn();
    render(<DtaPublishModal currentVersion={2} onClose={() => {}} onPublish={onPublish} />);
    fireEvent.click(screen.getByRole("button", { name: /Yayınla/ }));
    expect(onPublish).toHaveBeenCalledWith(expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- DtaPublishModal`
Expected: FAIL.

- [ ] **Step 3: Implement the three components** (port handoff `DtaVersionDrawer`, `DtaPublishModal`, `DtaTeacherPreview` + `dtaTeacherItems`)

Port verbatim. `DtaPublishModal`: `useState` date default to today ISO (`new Date().toISOString().slice(0,10)` — acceptable in component runtime). On confirm call `onPublish(dateIso)` then show success state; localize via `t("publish.*")`. `DtaTeacherPreview`: derive each teacher's items from `assignments` (their duties) + relievers (only when `relieverEnabled`); the `dta-tp-picker` `<select>` lists `teachers`. `DtaVersionDrawer`: render `versions` with active/superseded badges; "Bu sürümü görüntüle" is a no-op stub for 2a (read-only history view deferred — wire to a toast or omit the button action). Map all `Icon name=...` to lucide imports.

- [ ] **Step 4: Run test + typecheck**

Run: `npm run test -- DtaPublishModal` → PASS.
Run: `npx tsc --noEmit` → no errors.

- [ ] **Step 5: Commit**

```bash
git add src/portals/admin/duties/components/DtaVersionDrawer.tsx src/portals/admin/duties/components/DtaPublishModal.tsx src/portals/admin/duties/components/DtaTeacherPreview.tsx src/portals/admin/duties/__tests__/DtaPublishModal.test.tsx
git commit -m "2026-06-19 feat: Sürüm geçmişi drawer, yayın (supersede) modalı ve öğretmen önizleme port edildi."
```

---

## Task 8: Bölgeler & Politika tab (region + exemption CRUD + policy)

**Files:**
- Create: `src/portals/admin/duties/schemas/duty.schema.ts`
- Create: `src/portals/admin/duties/components/DtaConfirm.tsx`
- Create: `src/portals/admin/duties/components/DtaRegionModal.tsx`
- Create: `src/portals/admin/duties/components/DtaMuafModal.tsx`
- Create: `src/portals/admin/duties/components/PolitikaTab.tsx`
- Test: `src/portals/admin/duties/__tests__/PolitikaTab.test.tsx`

**Interfaces:**
- Consumes: `DutyLocationDto[]`, `DutyExemptionDto[]`, `DutyPolicyDto`, teacher list, `useDutyMutations`.
- Produces:
  - Zod: `regionSchema`, `exemptionSchema`, `policySchema` (design §6.6).
  - `DtaConfirm`, `DtaRegionModal({ initial, onClose, onSave })`, `DtaMuafModal({ existingTeacherIds, teachers, onClose, onSave })`.
  - `PolitikaTab({ locations, exemptions, policy, teachers, mutations, relieverEnabled, onRelieverToggle, fire })` — left region+exemption catalogues, right policy panel. Drives reliever toggle (updates policy).

- [ ] **Step 1: Write `schemas/duty.schema.ts`**

```typescript
import { z } from "zod";

export const regionSchema = z.object({
  name: z.string().min(2),
  type: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  icon: z.string().nullable(),
  capacity: z.number().int().min(1).max(4),
  isActive: z.boolean(),
});
export type RegionForm = z.infer<typeof regionSchema>;

export const exemptionSchema = z.object({
  teacherId: z.string().uuid(),
  type: z.union([z.literal(0), z.literal(1)]),
  from: z.string().nullable(),
  to: z.string().nullable(),
  reason: z.string().min(3),
}).refine((v) => v.type === 0 || (!!v.from && !!v.to), { message: "Geçici muafiyet tarih aralığı gerektirir", path: ["from"] });
export type ExemptionForm = z.infer<typeof exemptionSchema>;

export const policySchema = z.object({
  relieverEnabled: z.boolean(),
  weeklyFrequency: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  dayPattern: z.union([z.literal(0), z.literal(1)]),
});
export type PolicyForm = z.infer<typeof policySchema>;
```

- [ ] **Step 2: Write the failing test**

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "../../../../shared/i18n";
import { PolitikaTab } from "../components/PolitikaTab";

const noop = vi.fn();
const baseMutations = {
  createLocation: { mutate: vi.fn() }, updateLocation: { mutate: vi.fn() }, deleteLocation: { mutate: vi.fn() },
  createExemption: { mutate: vi.fn() }, deleteExemption: { mutate: vi.fn() }, updatePolicy: { mutate: vi.fn() },
} as never;

describe("PolitikaTab", () => {
  it("renders the region and policy panels", () => {
    render(
      <PolitikaTab
        locations={[{ id: "kat1", name: "1. Kat", type: 0, icon: "building", capacity: 1, isActive: true }]}
        exemptions={[]} policy={{ relieverEnabled: true, weeklyFrequency: 0, dayPattern: 0 }}
        teachers={[{ id: "t1", name: "Ahmet", branch: "Mat" }]} mutations={baseMutations}
        relieverEnabled onRelieverToggle={noop} fire={noop}
      />,
    );
    expect(screen.getByText("Nöbet Bölgeleri")).toBeInTheDocument();
    expect(screen.getByText("Nöbet Politikası")).toBeInTheDocument();
  });

  it("calls onRelieverToggle when the yancılık switch is clicked", () => {
    const onRelieverToggle = vi.fn();
    render(
      <PolitikaTab locations={[]} exemptions={[]} policy={{ relieverEnabled: true, weeklyFrequency: 0, dayPattern: 0 }}
        teachers={[]} mutations={baseMutations} relieverEnabled onRelieverToggle={onRelieverToggle} fire={noop} />,
    );
    fireEvent.click(screen.getByTestId("reliever-switch"));
    expect(onRelieverToggle).toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test -- PolitikaTab`
Expected: FAIL.

- [ ] **Step 4: Implement the modals + tab** (port `DtaConfirm`, `DtaRegionModal`, `DtaMuafModal`, `DtaPolitika` from `duty_admin_more.jsx`)

Port verbatim, wiring to props/mutations instead of local state. `DtaRegionModal` uses RHF + `regionSchema`; `type`/`icon` segment + step capacity 1..4. `DtaMuafModal` uses `exemptionSchema`; `teachers` filtered by `existingTeacherIds`. `PolitikaTab`: left = region list (toggle active → `updateLocation.mutate`, edit → modal, delete → `DtaConfirm` → `deleteLocation.mutate`) + exemption list (add → `DtaMuafModal` → `createExemption.mutate`, remove → `deleteExemption.mutate`); right = policy panel (frequency segment, dayPattern segment, **reliever toggle** with `data-testid="reliever-switch"` → `onRelieverToggle`). Saving frequency/dayPattern/reliever calls `updatePolicy.mutate`. All copy via `t("region.*"|"exemption.*"|"policy.*")`.

- [ ] **Step 5: Run test + typecheck**

Run: `npm run test -- PolitikaTab` → PASS.
Run: `npx tsc --noEmit` → no errors.

- [ ] **Step 6: Commit**

```bash
git add src/portals/admin/duties/schemas/duty.schema.ts src/portals/admin/duties/components/DtaConfirm.tsx src/portals/admin/duties/components/DtaRegionModal.tsx src/portals/admin/duties/components/DtaMuafModal.tsx src/portals/admin/duties/components/PolitikaTab.tsx src/portals/admin/duties/__tests__/PolitikaTab.test.tsx
git commit -m "2026-06-19 feat: Bölgeler & Politika sekmesi — bölge/muafiyet CRUD + politika (yancılık/sıklık/düzen) port edildi."
```

---

## Task 9: DutyAdminPage shell + Vekâlet placeholder + route + permission gate

**Files:**
- Create: `src/portals/admin/duties/components/VekaletPlaceholder.tsx`
- Create: `src/portals/admin/duties/DutyAdminPage.tsx`
- Create: `src/portals/admin/duties/index.ts`
- Modify: `src/app/routes.tsx`
- Test: `src/portals/admin/duties/__tests__/DutyAdminPage.test.tsx`

**Interfaces:**
- Consumes: all hooks/components above, `PageHeader`, `useDutyContext`.
- Produces: route `/admin/schedule/duties` → `DutyAdminPage`. Holds tab state, buffered roster draft op-log (Save replays via `saveRoster`), dialog/toast state. `useDutyContext()` returns `{ termId, academicYearId, teachers, days, today }`.

- [ ] **Step 1: Implement `VekaletPlaceholder.tsx`**

```typescript
import { useTranslation } from "react-i18next";
import { UserX } from "lucide-react";

export function VekaletPlaceholder() {
  const { t } = useTranslation("duties");
  return (
    <div className="dta-state">
      <div className="se-ico warn"><UserX size={28} /></div>
      <h3>{t("substitution.placeholderTitle")}</h3>
      <p>{t("substitution.placeholderBody")}</p>
    </div>
  );
}
```

- [ ] **Step 2: Write the failing page test**

```typescript
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "../../../../shared/i18n";
import { createTestWrapper } from "../../../../test/utils";
import { DutyAdminPage } from "../DutyAdminPage";

describe("DutyAdminPage", () => {
  it("renders the page title and tabs", () => {
    render(<DutyAdminPage />, { wrapper: createTestWrapper() });
    expect(screen.getByText("Nöbet & Vekâlet Yönetimi")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Nöbet Çizelgesi/ })).toBeInTheDocument();
  });

  it("shows the Vekâlet placeholder on the substitution tab", () => {
    render(<DutyAdminPage />, { wrapper: createTestWrapper() });
    fireEvent.click(screen.getByRole("button", { name: /Vekâlet/ }));
    expect(screen.getByText("Vekâlet iş akışı yakında")).toBeInTheDocument();
  });
});
```
> Queries are disabled without `schoolId`/`termId`, so the page must render its shell (PageHeader + tabs) even while data is loading/empty — assert on static chrome. If the page hard-depends on a term, provide a loading/empty variant that still shows the header+tabs (it must, per Global Constraints state variants).

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test -- DutyAdminPage`
Expected: FAIL — page not defined.

- [ ] **Step 4: Implement `DutyAdminPage.tsx`** (port `DutyAdminScreen` shell from `duty_admin.jsx` lines ~714-856)

Compose: `PageHeader` (breadcrumb `[{label:t("breadcrumb.academic")},{label:t("breadcrumb.schedule"),to:"/admin/schedule"},{label:t("breadcrumb.self")}]`, title `t("title")`, subtitle `t("subtitle")`, actions: on policy tab → Kaydet (dirty) ; else → Öğretmen Görünümü + Çizelgeyi Yayınla). `aca-tabs` with 3 tabs (counts: roster = assignment count, substitution = 0/hidden, policy = location count). Body switch:
- `roster` → info banner + `DutySummaryBar` + `DutyGrid` + `FairnessPanel`, with `DtaCellMenu` opened on cell click (compute non-exempt teachers + `busyTeacherIds` from current-day assignments). Cell assign/remove updates a local **draft op-log**; the header **Kaydet/Yayınla** flushes via `saveRoster`/opens `DtaPublishModal`.
- `substitution` → `<VekaletPlaceholder />`.
- `policy` → `<PolitikaTab .../>`.
Dialogs: `DtaVersionDrawer`, `DtaPublishModal` (onPublish → `publishRoster.mutate({termId, effectiveFrom})` + toast), `DtaTeacherPreview`. Toast via local `fire(msg, kind)` (port `sch-toast`). `relieverEnabled` from `useDutyPolicy().data?.relieverEnabled ?? false`.
Empty state: when no locations → `dta-state` "Henüz nöbet bölgesi tanımlı değil" → CTA switches to policy tab. Loading → skeletons.

`useDutyContext()` (bottom of file): source `termId`/`academicYearId` from the active-season the timetable portal uses (read `src/portals/admin/timetable/hooks/useHubData.ts` — it derives `termId`/`academicYearId` from `academicSessionsApi.current()`; reuse the same `current-session` query or extract a shared `useActiveTerm()` hook). Source `teachers` from the existing teachers lookup the autogen drawer uses (`useAutoGenLookups` exposes teachers — reuse). Source `days` from school-settings `WeeklyLessonDays` (or the bell-schedule lookup the editor uses); `today` = `new Date().getDay()`. **Read `useHubData.ts` + the autogen lookups hook before wiring; do not hardcode.**

- [ ] **Step 5: Write `index.ts`**

```typescript
export { DutyAdminPage } from "./DutyAdminPage";
```

- [ ] **Step 6: Add the route**

In `src/app/routes.tsx`: import `import { DutyAdminPage } from "../portals/admin/duties";` (near the other timetable imports, ~line 51-53). Add, next to `{ path: "schedule/availability", ... }` (~line 258):
```typescript
{ path: "schedule/duties", Component: DutyAdminPage },
```
Gate the screen with permission: wrap the page content's write actions with `RequirePermission permission="duties.manage"` (buttons/toolbars), and guard the route render for `duties.view` (mirror how other admin pages gate — if routes are not permission-guarded centrally, gate inside the page: if `!usePermission("duties.view")` render a 403/empty state).

- [ ] **Step 7: Run test + typecheck**

Run: `npm run test -- DutyAdminPage` → PASS.
Run: `npx tsc --noEmit` → no errors.

- [ ] **Step 8: Commit**

```bash
git add src/portals/admin/duties/DutyAdminPage.tsx src/portals/admin/duties/index.ts src/portals/admin/duties/components/VekaletPlaceholder.tsx src/app/routes.tsx src/portals/admin/duties/__tests__/DutyAdminPage.test.tsx
git commit -m "2026-06-19 feat: Nöbet & Vekâlet admin ekranı (3 sekme + vekâlet placeholder) ve rota eklendi."
```

---

## Task 10: Teacher duty view (read-only nöbet/yancı)

**Files:**
- Create: `src/portals/teacher/duties/components/DutyWeek.tsx`
- Create: `src/portals/teacher/duties/TeacherDutyPage.tsx`
- Create: `src/portals/teacher/duties/teacher-duty.css`
- Modify: `src/app/routes.tsx`
- Test: `src/portals/teacher/duties/__tests__/TeacherDutyPage.test.tsx`

**Interfaces:**
- Consumes: `useMyDuties(termId)`, `useDutyPolicy()` (or `relieverEnabled` from the my-duties payload if the BE includes it), `useDutyContext`/active-term.
- Produces: route `/teacher/duties` → `TeacherDutyPage`. Read-only summary + list + weekly calendar (port `TeacherDuty` nöbet/yancı parts; vekâlet omitted for 2a).

- [ ] **Step 1: Port `teacher-duty.css`**

Copy the relevant `.tdy-*` styles from `oksis-layout/project/app/schedule_duty.css` into `src/portals/teacher/duties/teacher-duty.css` (keep class names).

- [ ] **Step 2: Write the failing test**

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "../../../../shared/i18n";
import { createTestWrapper } from "../../../../test/utils";
import { TeacherDutyPage } from "../TeacherDutyPage";
import { useMyDuties } from "../../../admin/duties/hooks/useMyDuties";

vi.mock("../../../admin/duties/hooks/useMyDuties");

describe("TeacherDutyPage", () => {
  it("shows the empty state when no duties", () => {
    vi.mocked(useMyDuties).mockReturnValue({ data: { termId: "t", version: 1, effectiveFrom: null, items: [] }, isLoading: false, isError: false } as never);
    render(<TeacherDutyPage />, { wrapper: createTestWrapper() });
    expect(screen.getByText("Bu hafta nöbet veya vekâletin yok")).toBeInTheDocument();
  });
});
```
> Adjust the mock path to wherever `useMyDuties` lives; if the teacher view should not import from the admin folder, move `useMyDuties` + `dutiesApi`/`dutyKeys` to a shared `src/modules/duties/` location in Task 2 instead and update imports. Default: reuse from `admin/duties/hooks` (acceptable — hooks are portal-agnostic).

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test -- TeacherDutyPage`
Expected: FAIL.

- [ ] **Step 4: Implement `DutyWeek.tsx` + `TeacherDutyPage.tsx`** (port `TeacherDuty` + `DutyWeek`, nöbet/yancı only)

Port the summary strip (`bu hafta nöbet`, `bu hafta yancı` when `relieverEnabled`, `Sıradaki görev`), the list/calendar sub-segment toggle, and `DutyWeek`. Build items from `useMyDuties().data.items` (`kind: "duty"|"reliever"`). **Omit** the vekâlet list rows, the conflict strip, the approve/object actions, and `DutyObjectModal` (those are 2b). State variants: loading (skeletons), empty (`t("teacher.emptyTitle")`), error. `relieverEnabled` gates yancı items/summary. Map icons to lucide.

- [ ] **Step 5: Add the teacher route**

In `src/app/routes.tsx`, under the teacher portal children (near `{ path: "schedule", Component: TeacherSchedule }`, ~line 315):
```typescript
{ path: "duties", Component: TeacherDutyPage },
```
Import `import { TeacherDutyPage } from "../portals/teacher/duties/TeacherDutyPage";` near the other teacher imports.

- [ ] **Step 6: Run test + typecheck**

Run: `npm run test -- TeacherDutyPage` → PASS.
Run: `npx tsc --noEmit` → no errors.

- [ ] **Step 7: Commit**

```bash
git add src/portals/teacher/duties/ src/app/routes.tsx
git commit -m "2026-06-19 feat: Öğretmen nöbet/yancı görünümü (salt-okunur, liste + takvim) port edildi."
```

---

## Task 11: Full suite + typecheck + docs

**Files:**
- Modify: `.claude/docs/modules/timetable/completion_status.md`, `ui-flows.md` (+ new `Duties` module docs if the module-doc set is created in the BE plan).

- [ ] **Step 1: Run everything**

Run: `npm run build && npm run test && npx tsc --noEmit`
Expected: build OK, all tests green, no type errors. Fix any i18n key gaps, missing imports, or `relieverEnabled`-gating leaks (grep for `relieverName`/`yancı` rendering not guarded by `relieverEnabled`).

- [ ] **Step 2: Update module docs**

- `completion_status.md`: add 2a frontend ✅ rows; bump `Güncel` date 2026-06-19; under **⚠️ Spec Dışına Çıkılanlar** note FE consequences of K-2a-2 (no müsaitlik in duty UI) and K-2a-5 (reliever fully gated).
- `ui-flows.md`: add the Nöbet & Vekâlet admin screen flow (3 tabs, publish/supersede) + teacher duty view flow.

- [ ] **Step 3: Commit**

```bash
git add .claude/docs/modules/timetable/
git commit -m "2026-06-19 docs: Nöbet Çizelgesi (Faz 4/Dilim 2a) frontend — modül dokümanları güncellendi."
```

---

## Self-Review

**Spec coverage** (design doc §6/§7):
- §6.1 PageTop → Task 9 ✓ (breadcrumb/title/actions; Kaydet on policy / Öğretmen Görünümü+Yayınla else)
- §6.2 Çizelge tab (grid, cell menu, yancı row, fairness, version drawer, publish modal, teacher preview) → Tasks 5,6,7,9 ✓
- §6.3 Vekâlet placeholder (2b) → Task 9 ✓
- §6.4 Bölgeler & Politika → Task 8 ✓
- §6.5 React Query keys → Task 2 ✓
- §6.6 Zod → Task 8 ✓
- §7 Teacher view → Task 10 ✓
- §9 i18n tr/en → Task 1 ✓
- K-2a-5 reliever gate → Tasks 5 (grid test), 6 (legend), 8 (toggle), 10 (teacher) ✓
- K-2a-2 no müsaitlik in UI → enforced by omission; called out in Task 11 grep ✓
- 2c/2d disabled buttons → Task 6 ✓
- Permissions (`duties.manage`/`view`) → Task 9 ✓

**Placeholder scan:** New plumbing files (Tasks 1-3) and schemas/tests carry complete code. Port tasks (4-10) reference the exact handoff file + component + line range with concrete wiring instructions (props, hooks, lucide icon mapping, testids) and full test code — these are named-file ports with a stated mirror, not vague TODOs. Three explicit "read first" lookups remain: `useDutyContext` term/teacher/day sources (Task 9, mirrors `useHubData`/`useAutoGenLookups`), the `getPolicy` GET shape (Task 2, confirm against BE plan), and the `useMyDuties` mock path (Task 10). Flagged inline.

**Type consistency:** `cellKey(day, locationId)` identical across `types.ts`, `DutyGrid`, page. `relieverEnabled: boolean` threaded uniformly (grid, fairness, summary bar, politika, teacher, preview). `DutyVersionDto`/`DutyRosterDto`/`DutyHubSummaryDto` field names consistent between `types.ts`, `api`, hooks, components. Mutation names (`saveRoster`/`assignReliever`/`publishRoster`/`createLocation`/...) consistent between `useDutyMutations` (Task 3) and `PolitikaTab`/`DutyAdminPage` (Tasks 8,9). API routes match design §5.

**Dependency note:** All FE tasks depend on the BE plan's endpoints (design §5). Tasks 1-8 build against the documented contract and can proceed once endpoints exist; Tasks 9-10 (page + teacher view) compose them. Recommended order: BE endpoints → FE Tasks 1-8 → FE Tasks 9-10 → Task 11 docs.

---

## Execution Handoff

Frontend plan complete. Combined with the backend plan, Dilim 2a is fully specified. Recommended overall order: **BE Tasks → FE Tasks 1-8 → FE Tasks 9-10 → docs.**
