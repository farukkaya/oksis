# Okul Ayarları — Faz A (Shell + PageHeader + Ortak Desenler) · FE Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Okul Ayarları ekranının dış kabuğunu, handoff tasarımına uygun şekilde standart `PageHeader` (breadcrumb + subtitle + first-class tabs + actions) üzerine taşımak ve sonraki sekme fazlarının tükettiği ortak shell bileşenlerini (header-action slot, 2-kolon yerleşim, yan kart, "Nerede Kullanılır" kartı) kurmak.

**Architecture:** `SchoolSettingsPage` artık ayrı pill nav (`SchoolSettingsTabs`) yerine standart `PageHeader.tabs`'ı route-güdümlü kullanır; aktif sekme `useLocation` segmentinden türetilir, `onChange` → `navigate`. Sekmelerin birincil butonu (Kaydet / Yeni Derslik) `#set-head-actions` portalı yerine bir React context (`SettingsHeaderAction`) ile `PageHeader.actions`'a enjekte edilir. Handoff'un kart/yerleşim stilleri scoped `settings.css`'e port edilir (subjects.css emsali); bileşenler `className` ile bunları kullanır.

**Tech Stack:** React 18 + TypeScript (strict) · React Router v6 (`useLocation`/`useNavigate`/`Outlet`) · i18next · Vitest + @testing-library/react · Tailwind + scoped CSS. Bağlayıcı spec: `.claude/specs/okul-ayarlari-tasarim-yenileme-spec.md`.

## Global Constraints

- **Named export zorunlu** — sayfa/bileşende default export YASAK (web CLAUDE.md #4).
- **Inline style yasak** — `style={}` kullanma; Tailwind utility / `cn` / scoped `settings.css` className (web #5).
- **`any` yasak** — `unknown` + type guard veya `z.parse()` (web #6).
- **Hardcoded Türkçe string yasak** — tüm metin i18n key (`school-settings` namespace).
- **Server state yalnız React Query** — bu fazda veri çekimi yok; shell veri-bağımsızdır.
- **Tasarım token'ları `src/styles/theme.css`'te mevcut** (navy/electric/surface/line/radii/Plus Jakarta Sans) — yeni token tanımlama, var olanı kullan.
- Çalışma dizini: `oksis-web/`. Test: `npx vitest run <path>`. Tip: `npm run build` (tsc dahil).

---

## File Structure

- `src/portals/admin/settings/components/SettingsHeaderActionContext.tsx` — provider + slot okuyucu + kayıt hook'u (portal yerine).
- `src/portals/admin/settings/pages/SchoolSettingsPage.tsx` — **yeniden yazılır**: PageHeader shell + provider.
- `src/portals/admin/settings/components/SchoolSettingsTabs.tsx` — **silinir** (PageHeader.tabs devralır).
- `src/portals/admin/settings/settings.css` — handoff kart/yerleşim/savebar/banner stilleri (scoped).
- `src/portals/admin/settings/components/SettingsTwoColumn.tsx` — `gnl-grid` (main + side) yerleşim sarmalayıcı.
- `src/portals/admin/settings/components/SettingsSideCard.tsx` — `gnl-card` ikon-başlık-gövde kartı.
- `src/portals/admin/settings/components/WhereUsedCard.tsx` — "Nerede Kullanılır" kartı (SettingsSideCard üzerine).
- `src/shared/i18n/locales/{tr,en}/school-settings.json` — `subtitles.*` + `breadcrumb.system` eklenir.
- İlgili `__tests__/` dosyaları her görevde.

---

### Task 1: Subtitle + breadcrumb i18n anahtarları

**Files:**
- Modify: `src/shared/i18n/locales/tr/school-settings.json`
- Modify: `src/shared/i18n/locales/en/school-settings.json`
- Test: `src/portals/admin/settings/__tests__/settingsI18n.test.ts`

**Interfaces:**
- Produces: i18n anahtarları `breadcrumb.system`, `subtitles.{general,academic-structure,academic-policy,rooms,bell-schedule,holidays,notifications,modules}` (tr+en). Sonraki görevler `t(...)` ile tüketir.

- [ ] **Step 1: Failing test yaz**

```ts
// src/portals/admin/settings/__tests__/settingsI18n.test.ts
import { describe, expect, it } from 'vitest';
import tr from '../../../../shared/i18n/locales/tr/school-settings.json';

const TAB_SUBTITLE_KEYS = [
  'general', 'academic-structure', 'academic-policy', 'rooms',
  'bell-schedule', 'holidays', 'notifications', 'modules',
];

describe('school-settings i18n shell anahtarları', () => {
  it('breadcrumb.system tanımlı', () => {
    expect((tr as Record<string, unknown>).breadcrumb).toMatchObject({ system: expect.any(String) });
  });
  it('her sekme için subtitle tanımlı', () => {
    const subtitles = (tr as { subtitles?: Record<string, string> }).subtitles ?? {};
    for (const k of TAB_SUBTITLE_KEYS) {
      expect(subtitles[k], `subtitles.${k} eksik`).toEqual(expect.any(String));
    }
  });
});
```

- [ ] **Step 2: Testi çalıştır, FAIL gör**

Run: `npx vitest run src/portals/admin/settings/__tests__/settingsI18n.test.ts`
Expected: FAIL — `subtitles` undefined / `breadcrumb.system` yok.

- [ ] **Step 3: tr JSON'a anahtarları ekle**

`src/shared/i18n/locales/tr/school-settings.json` köküne ekle (mevcut `tabs` bloğunu bozmadan):

```json
  "breadcrumb": { "system": "Sistem" },
  "subtitles": {
    "general": "Okulun kimlik, iletişim ve yetkili bilgileri — giriş ekranında, raporlarda ve resmî yazışmalarda kullanılır.",
    "academic-structure": "Okulun kademe iskeleti, şube adlandırma kuralı ve ders kataloğu — Sınıflar, Sezon Sihirbazı ve Ders Programı bu tanımları kullanır.",
    "academic-policy": "Not, sınav, devamsızlık ve belge kuralları — Notlar & Karne ile Devamsızlık ekranları bu politikalara göre hesap yapar.",
    "rooms": "Okuldaki fiziksel mekânlar — ders programı kurulurken bu listeden seçilir.",
    "bell-schedule": "Ders, teneffüs ve öğle arası saatleri — Ders Programı ve Yoklama ekranları bu çizelgeye göre çalışır.",
    "holidays": "Aktif sezonun ders yapılmayan günleri — Akademik Takvim, Yoklama ve Ders Programı bu listeyi kullanır.",
    "notifications": "Hangi olay, kime, hangi kanaldan bildirilsin — portal, e-posta ve SMS kuralları.",
    "modules": "Okulda kullanılan OKSİS modülleri — kapatılan modül menüden kalkar, verisi silinmez."
  },
```

- [ ] **Step 4: en JSON'a karşılıklarını ekle**

`src/shared/i18n/locales/en/school-settings.json` köküne:

```json
  "breadcrumb": { "system": "System" },
  "subtitles": {
    "general": "The school's identity, contact and authority details — used on the sign-in screen, reports and official correspondence.",
    "academic-structure": "The school's level structure, branch naming rule and course catalog — Classes, the Season Wizard and the Timetable consume these definitions.",
    "academic-policy": "Grade, exam, absence and document rules — the Marks & Report Card and Absence screens calculate according to these policies.",
    "rooms": "Physical spaces in the school — selected from this list when building the timetable.",
    "bell-schedule": "Lesson, break and lunch times — the Timetable and Attendance screens run on this schedule.",
    "holidays": "Non-teaching days of the active season — the Academic Calendar, Attendance and Timetable use this list.",
    "notifications": "Which event is sent to whom and through which channel — portal, email and SMS rules.",
    "modules": "OKSİS modules used by the school — a disabled module disappears from the menu; its data is not deleted."
  },
```

- [ ] **Step 5: Testi çalıştır, PASS gör**

Run: `npx vitest run src/portals/admin/settings/__tests__/settingsI18n.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/shared/i18n/locales/tr/school-settings.json src/shared/i18n/locales/en/school-settings.json src/portals/admin/settings/__tests__/settingsI18n.test.ts
git commit -m "2026-06-24 feat: Okul Ayarları shell için subtitle + breadcrumb i18n anahtarları eklendi."
```

---

### Task 2: SettingsHeaderAction context (portal yerine)

**Files:**
- Create: `src/portals/admin/settings/components/SettingsHeaderActionContext.tsx`
- Test: `src/portals/admin/settings/components/__tests__/SettingsHeaderActionContext.test.tsx`

**Interfaces:**
- Produces:
  - `SettingsHeaderActionProvider({ children }: { children: ReactNode })` — sağlayıcı.
  - `useSettingsHeaderActionSlot(): ReactNode` — kayıtlı aksiyon düğümünü okur (shell tüketir).
  - `useSettingsHeaderAction(node: ReactNode, deps: unknown[]): void` — sekme, birincil butonunu kaydeder; unmount'ta temizler.

- [ ] **Step 1: Failing test yaz**

```tsx
// src/portals/admin/settings/components/__tests__/SettingsHeaderActionContext.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  SettingsHeaderActionProvider,
  useSettingsHeaderAction,
  useSettingsHeaderActionSlot,
} from '../SettingsHeaderActionContext';

function Slot() {
  return <div data-testid="slot">{useSettingsHeaderActionSlot()}</div>;
}
function Registrar() {
  useSettingsHeaderAction(<button type="button">Kaydet</button>, []);
  return null;
}

describe('SettingsHeaderAction', () => {
  it('kayıtlı aksiyonu slota yansıtır', () => {
    render(
      <SettingsHeaderActionProvider>
        <Slot />
        <Registrar />
      </SettingsHeaderActionProvider>
    );
    expect(screen.getByTestId('slot')).toHaveTextContent('Kaydet');
  });

  it('registrar unmount olunca slot temizlenir', () => {
    function Wrapper({ show }: { show: boolean }) {
      return (
        <SettingsHeaderActionProvider>
          <Slot />
          {show ? <Registrar /> : null}
        </SettingsHeaderActionProvider>
      );
    }
    const { rerender } = render(<Wrapper show />);
    expect(screen.getByTestId('slot')).toHaveTextContent('Kaydet');
    rerender(<Wrapper show={false} />);
    expect(screen.getByTestId('slot')).toBeEmptyDOMElement();
  });
});
```

- [ ] **Step 2: Testi çalıştır, FAIL gör**

Run: `npx vitest run src/portals/admin/settings/components/__tests__/SettingsHeaderActionContext.test.tsx`
Expected: FAIL — modül yok.

- [ ] **Step 3: Context'i yaz**

```tsx
// src/portals/admin/settings/components/SettingsHeaderActionContext.tsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

type ContextValue = {
  action: ReactNode;
  setAction: (node: ReactNode) => void;
};

const SettingsHeaderActionCtx = createContext<ContextValue | null>(null);

export function SettingsHeaderActionProvider({ children }: { children: ReactNode }) {
  const [action, setAction] = useState<ReactNode>(null);
  return (
    <SettingsHeaderActionCtx.Provider value={{ action, setAction }}>
      {children}
    </SettingsHeaderActionCtx.Provider>
  );
}

function useCtx(): ContextValue {
  const ctx = useContext(SettingsHeaderActionCtx);
  if (!ctx) {
    throw new Error('SettingsHeaderAction hook must be used within SettingsHeaderActionProvider');
  }
  return ctx;
}

/** Shell tarafı: kayıtlı birincil aksiyon düğümünü okur. */
export function useSettingsHeaderActionSlot(): ReactNode {
  return useCtx().action;
}

/** Sekme tarafı: birincil butonunu PageHeader actions yuvasına kaydeder. */
export function useSettingsHeaderAction(node: ReactNode, deps: unknown[]): void {
  const { setAction } = useCtx();
  useEffect(() => {
    setAction(node);
    return () => setAction(null);
    // node, deps üzerinden yeniden hesaplanır
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
```

- [ ] **Step 4: Testi çalıştır, PASS gör**

Run: `npx vitest run src/portals/admin/settings/components/__tests__/SettingsHeaderActionContext.test.tsx`
Expected: PASS (iki test).

- [ ] **Step 5: Commit**

```bash
git add src/portals/admin/settings/components/SettingsHeaderActionContext.tsx src/portals/admin/settings/components/__tests__/SettingsHeaderActionContext.test.tsx
git commit -m "2026-06-24 feat: Okul Ayarları sekme aksiyonu için SettingsHeaderAction context eklendi."
```

---

### Task 3: SchoolSettingsPage shell'ini PageHeader'a taşı

**Files:**
- Modify (rewrite): `src/portals/admin/settings/pages/SchoolSettingsPage.tsx`
- Test: `src/portals/admin/settings/__tests__/SchoolSettingsShell.test.tsx`

**Interfaces:**
- Consumes: `PageHeader` (`shared/components/PageHeader`), Task 1 i18n anahtarları, Task 2 context.
- Produces: `SchoolSettingsPage()` — provider sarmalı PageHeader shell + `<Outlet />`. Sekme `value` = pathname segmenti; `onChange` → `navigate('/admin/settings/<key>')`.

- [ ] **Step 1: Failing test yaz**

```tsx
// src/portals/admin/settings/__tests__/SchoolSettingsShell.test.tsx
import { MemoryRouter, Route, Routes } from 'react-router';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SchoolSettingsPage } from '../pages/SchoolSettingsPage';
import { useSettingsHeaderAction } from '../components/SettingsHeaderActionContext';
import '../../../../shared/i18n';

function RoomsStub() {
  useSettingsHeaderAction(<button type="button">Yeni Derslik</button>, []);
  return <div>rooms-content</div>;
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/admin/settings" element={<SchoolSettingsPage />}>
          <Route path="rooms" element={<RoomsStub />} />
          <Route path="general" element={<div>general-content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('SchoolSettingsPage shell', () => {
  it('aktif sekme subtitle ve sekme şeridini gösterir', () => {
    renderAt('/admin/settings/rooms');
    expect(screen.getByRole('heading', { name: 'Okul Ayarları' })).toBeInTheDocument();
    expect(screen.getByText(/fiziksel mekânlar/i)).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Derslikler/i })).toHaveAttribute('aria-selected', 'true');
  });

  it('sekmeye tıklayınca ilgili route render edilir', () => {
    renderAt('/admin/settings/rooms');
    expect(screen.getByText('rooms-content')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: /Genel Bilgiler/i }));
    expect(screen.getByText('general-content')).toBeInTheDocument();
  });

  it('aktif sekmenin birincil butonu PageHeader actions içinde görünür', () => {
    renderAt('/admin/settings/rooms');
    expect(screen.getByRole('button', { name: 'Yeni Derslik' })).toBeInTheDocument();
  });
});
```

> Not: `PageHeader.tabs` öğeleri `role="tab"` ve aktifte `aria-selected` üretir (bkz. `PageHeader.test.tsx`). Etiket adları `tabs.*` çevirilerinden gelir (ör. "Derslikler", "Genel Bilgiler").

- [ ] **Step 2: Testi çalıştır, FAIL gör**

Run: `npx vitest run src/portals/admin/settings/__tests__/SchoolSettingsShell.test.tsx`
Expected: FAIL — eski sayfa `SchoolSettingsTabs` kullanıyor, subtitle/actions yok.

- [ ] **Step 3: SchoolSettingsPage'i yeniden yaz**

```tsx
// src/portals/admin/settings/pages/SchoolSettingsPage.tsx
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { PageHeader } from '../../../../shared/components/PageHeader';
import {
  SettingsHeaderActionProvider,
  useSettingsHeaderActionSlot,
} from '../components/SettingsHeaderActionContext';
import '../settings.css';

const SETTINGS_ROOT = '/admin/settings';

const TAB_KEYS = [
  'general', 'academic', 'academic-policy', 'rooms',
  'bell-schedule', 'holidays', 'notifications', 'modules',
] as const;
type TabKey = (typeof TAB_KEYS)[number];

const TAB_LABEL_KEY: Record<TabKey, string> = {
  general: 'tabs.general',
  academic: 'tabs.academic-structure',
  'academic-policy': 'tabs.academic-policy',
  rooms: 'tabs.rooms',
  'bell-schedule': 'tabs.bell-schedule',
  holidays: 'tabs.holidays',
  notifications: 'tabs.notifications',
  modules: 'tabs.modules',
};
const SUBTITLE_KEY: Record<TabKey, string> = {
  general: 'subtitles.general',
  academic: 'subtitles.academic-structure',
  'academic-policy': 'subtitles.academic-policy',
  rooms: 'subtitles.rooms',
  'bell-schedule': 'subtitles.bell-schedule',
  holidays: 'subtitles.holidays',
  notifications: 'subtitles.notifications',
  modules: 'subtitles.modules',
};

function activeTabKey(pathname: string): TabKey {
  const seg = pathname.replace(`${SETTINGS_ROOT}/`, '').split('/')[0];
  return (TAB_KEYS as readonly string[]).includes(seg) ? (seg as TabKey) : 'general';
}

function SchoolSettingsShell() {
  const { t } = useTranslation('school-settings');
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const active = activeTabKey(pathname);
  const action = useSettingsHeaderActionSlot();

  const items = useMemo(
    () => TAB_KEYS.map((k) => ({ key: k, label: t(TAB_LABEL_KEY[k]) })),
    [t]
  );

  return (
    <div className="scr">
      <PageHeader
        breadcrumb={[{ label: t('breadcrumb.system') }, { label: t('title') }]}
        title={t('title')}
        subtitle={t(SUBTITLE_KEY[active])}
        actions={action}
        tabs={{
          value: active,
          onChange: (key) => navigate(`${SETTINGS_ROOT}/${key}`),
          items,
          ariaLabel: t('title'),
        }}
      />
      <div className="scr-inner">
        <Outlet />
      </div>
    </div>
  );
}

export function SchoolSettingsPage() {
  return (
    <SettingsHeaderActionProvider>
      <SchoolSettingsShell />
    </SettingsHeaderActionProvider>
  );
}
```

> `t('title')` mevcut ("Okul Ayarları"). `settings.css` Task 5'te oluşturulur; bu görevde import satırı dosya henüz yoksa derlemeyi kırar — Task 5 ile birlikte yürütülürse sorun yok. Sıra korunursa: bu görevde `import '../settings.css';` satırını **Task 5 tamamlanana dek ekleme**; Task 5'in son adımında ekle. (Aşağıda Step 4 buna göre.)

- [ ] **Step 4: `settings.css` importunu geçici devre dışı bırak**

Bu görev tek başına çalışacaksa `import '../settings.css';` satırını **ekleme** (Task 5 ekleyecek). Shell test'i CSS'e bağımlı değildir.

- [ ] **Step 5: Testi çalıştır, PASS gör**

Run: `npx vitest run src/portals/admin/settings/__tests__/SchoolSettingsShell.test.tsx`
Expected: PASS (üç test).

- [ ] **Step 6: Regresyon — mevcut sayfa testini çalıştır**

Run: `npx vitest run src/portals/admin/settings/__tests__/SchoolSettingsPage.test.tsx`
Expected: PASS (sayfa hâlâ render oluyor; eski test PageHeader başlığını/Outlet'i bekliyorsa geçer). Kırılırsa: test eski `SchoolSettingsTabs` DOM'una (pill nav) bağlıysa Task 4'te güncellenir — burada not düş, Task 4'e taşı.

- [ ] **Step 7: Commit**

```bash
git add src/portals/admin/settings/pages/SchoolSettingsPage.tsx src/portals/admin/settings/__tests__/SchoolSettingsShell.test.tsx
git commit -m "2026-06-24 feat: Okul Ayarları kabuğu standart PageHeader (tabs+subtitle+actions) üzerine taşındı."
```

---

### Task 4: Eski SchoolSettingsTabs bileşenini kaldır

**Files:**
- Delete: `src/portals/admin/settings/components/SchoolSettingsTabs.tsx`
- Delete: `src/portals/admin/settings/components/__tests__/SchoolSettingsTabs.test.tsx`
- Modify (gerekirse): `src/portals/admin/settings/components/index.ts` (export kaldır)

**Interfaces:**
- Consumes: yok. Produces: yok (temizlik).

- [ ] **Step 1: Kalan referansları bul**

Run: `grep -rn "SchoolSettingsTabs" src/`
Expected: yalnız silinecek dosyalar + `components/index.ts` (varsa) görünmeli. Başka tüketici çıkarsa önce o güncellenir.

- [ ] **Step 2: Dosyaları sil ve export'u kaldır**

```bash
git rm src/portals/admin/settings/components/SchoolSettingsTabs.tsx \
       src/portals/admin/settings/components/__tests__/SchoolSettingsTabs.test.tsx
```

`components/index.ts` içinde `SchoolSettingsTabs` / `SchoolSettingsTab` re-export satırı varsa kaldır.

- [ ] **Step 3: Tip kontrolü + tüm settings testleri**

Run: `npm run build`
Expected: PASS (kullanılmayan import / eksik export hatası yok).

Run: `npx vitest run src/portals/admin/settings`
Expected: PASS (tüm settings testleri). `SchoolSettingsPage.test.tsx` eski pill nav'a bağımlıysa burada PageHeader tab'larına göre güncelle (ör. `getByRole('tab', ...)`).

- [ ] **Step 4: Commit**

```bash
git add -A src/portals/admin/settings
git commit -m "2026-06-24 refactor: Okul Ayarları eski SchoolSettingsTabs kaldırıldı (PageHeader.tabs devraldı)."
```

---

### Task 5: Scoped settings.css + SettingsTwoColumn yerleşimi

**Files:**
- Create: `src/portals/admin/settings/settings.css`
- Create: `src/portals/admin/settings/components/SettingsTwoColumn.tsx`
- Test: `src/portals/admin/settings/components/__tests__/SettingsTwoColumn.test.tsx`
- Modify: `src/portals/admin/settings/pages/SchoolSettingsPage.tsx` (Task 3'te ertelenen `import '../settings.css';` eklenir)

**Interfaces:**
- Produces:
  - `settings.css` sınıfları: `gnl-grid`, `gnl-main`, `gnl-side`, `gnl-card`, `gnl-card-head`, `gh-ico`, `gnl-card-body`, `gnl-savebar` (savebar stili sonraki fazlar için hazır). Handoff `settingsGeneral.css` deseninden token'larla port.
  - `SettingsTwoColumn({ children, side }: { children: ReactNode; side: ReactNode })` — sol `gnl-main` + sağ `gnl-side` iki kolon.

- [ ] **Step 1: Failing test yaz**

```tsx
// src/portals/admin/settings/components/__tests__/SettingsTwoColumn.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SettingsTwoColumn } from '../SettingsTwoColumn';

describe('SettingsTwoColumn', () => {
  it('ana ve yan içerikleri ayrı bölgelerde render eder', () => {
    render(
      <SettingsTwoColumn side={<div>side</div>}>
        <div>main</div>
      </SettingsTwoColumn>
    );
    const main = screen.getByText('main').parentElement;
    const side = screen.getByText('side').parentElement;
    expect(main).toHaveClass('gnl-main');
    expect(side).toHaveClass('gnl-side');
  });
});
```

- [ ] **Step 2: Testi çalıştır, FAIL gör**

Run: `npx vitest run src/portals/admin/settings/components/__tests__/SettingsTwoColumn.test.tsx`
Expected: FAIL — modül yok.

- [ ] **Step 3: settings.css'i oluştur (token'larla port)**

```css
/* src/portals/admin/settings/settings.css
   Okul Ayarları sekmelerinin paylaşımlı kart/yerleşim/savebar stilleri.
   handoff settingsGeneral.css deseninden global theme token'larıyla port. */

.gnl-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 20px;
  align-items: start;
}
@media (max-width: 1080px) {
  .gnl-grid { grid-template-columns: 1fr; }
}
.gnl-main, .gnl-side { display: flex; flex-direction: column; gap: 16px; min-width: 0; }

.gnl-card {
  background: var(--card, #fff);
  border: 1px solid var(--line, #E6E9F2);
  border-radius: var(--radius-card, 12px);
  box-shadow: var(--sh-sm, 0 1px 2px rgba(16, 24, 40, 0.04));
  overflow: hidden;
}
.gnl-card-head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 18px;
  border-bottom: 1px solid var(--line-soft, #EFF1F8);
}
.gnl-card-head h3 { margin: 0; font-size: 15px; font-weight: 700; letter-spacing: -0.01em; color: var(--foreground, #111827); }
.gnl-card-head .s { margin-top: 2px; font-size: 13px; color: var(--foreground-muted, #6B7280); }
.gh-ico {
  display: inline-flex; align-items: center; justify-content: center;
  width: 38px; height: 38px; flex: none;
  border-radius: var(--radius-sm, 8px);
  background: var(--surface, #EEF1FA);
  color: var(--electric, #4F6BFF);
}
.gnl-card-body { padding: 18px; display: flex; flex-direction: column; gap: 14px; }

.gnl-savebar {
  position: sticky; bottom: 16px; z-index: 5;
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  margin-top: 18px; padding: 12px 16px;
  background: var(--card, #fff);
  border: 1px solid var(--line, #E6E9F2);
  border-radius: var(--radius-card, 12px);
  box-shadow: var(--sh-lg, 0 8px 24px rgba(16, 24, 40, 0.12));
}
```

> Not: `--sh-sm/--sh-lg` tanımlı değilse fallback değerler devrede (yukarıda inline fallback). Token varsa onları kullanır.

- [ ] **Step 4: SettingsTwoColumn'u yaz**

```tsx
// src/portals/admin/settings/components/SettingsTwoColumn.tsx
import type { ReactNode } from 'react';

export interface SettingsTwoColumnProps {
  children: ReactNode;
  side: ReactNode;
}

/** Handoff `gnl-grid` deseni: solda ana içerik, sağda yan kartlar (dar viewport'ta tek kolon). */
export function SettingsTwoColumn({ children, side }: SettingsTwoColumnProps) {
  return (
    <div className="gnl-grid">
      <div className="gnl-main">{children}</div>
      <div className="gnl-side">{side}</div>
    </div>
  );
}
```

- [ ] **Step 5: SchoolSettingsPage'e settings.css importunu ekle**

`src/portals/admin/settings/pages/SchoolSettingsPage.tsx` üst importlarına (Task 3'te ertelenmişti):

```tsx
import '../settings.css';
```

- [ ] **Step 6: Testi + build çalıştır**

Run: `npx vitest run src/portals/admin/settings/components/__tests__/SettingsTwoColumn.test.tsx`
Expected: PASS.
Run: `npm run build`
Expected: PASS (CSS import çözülüyor).

- [ ] **Step 7: Commit**

```bash
git add src/portals/admin/settings/settings.css src/portals/admin/settings/components/SettingsTwoColumn.tsx src/portals/admin/settings/components/__tests__/SettingsTwoColumn.test.tsx src/portals/admin/settings/pages/SchoolSettingsPage.tsx
git commit -m "2026-06-24 feat: Okul Ayarları paylaşımlı settings.css + SettingsTwoColumn yerleşimi eklendi."
```

---

### Task 6: SettingsSideCard bileşeni

**Files:**
- Create: `src/portals/admin/settings/components/SettingsSideCard.tsx`
- Test: `src/portals/admin/settings/components/__tests__/SettingsSideCard.test.tsx`

**Interfaces:**
- Consumes: Task 5 `gnl-card` stilleri.
- Produces: `SettingsSideCard({ icon, title, subtitle?, children }: SettingsSideCardProps)` — ikon-başlık-gövde kartı.

- [ ] **Step 1: Failing test yaz**

```tsx
// src/portals/admin/settings/components/__tests__/SettingsSideCard.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SettingsSideCard } from '../SettingsSideCard';

describe('SettingsSideCard', () => {
  it('başlık, alt başlık ve gövdeyi render eder', () => {
    render(
      <SettingsSideCard icon={<svg data-testid="ico" />} title="Önizleme" subtitle="Menüdeki görünüm">
        <div>body</div>
      </SettingsSideCard>
    );
    expect(screen.getByRole('heading', { name: 'Önizleme' })).toBeInTheDocument();
    expect(screen.getByText('Menüdeki görünüm')).toBeInTheDocument();
    expect(screen.getByText('body')).toBeInTheDocument();
    expect(screen.getByTestId('ico')).toBeInTheDocument();
  });

  it('subtitle yoksa alt açıklama render etmez', () => {
    render(<SettingsSideCard icon={<svg />} title="Kayıt Bilgisi"><span>x</span></SettingsSideCard>);
    expect(screen.queryByText('Menüdeki görünüm')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Testi çalıştır, FAIL gör**

Run: `npx vitest run src/portals/admin/settings/components/__tests__/SettingsSideCard.test.tsx`
Expected: FAIL — modül yok.

- [ ] **Step 3: SettingsSideCard'ı yaz**

```tsx
// src/portals/admin/settings/components/SettingsSideCard.tsx
import type { ReactNode } from 'react';

export interface SettingsSideCardProps {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  children: ReactNode;
}

/** handoff `gnl-card`: ikon + başlık + opsiyonel alt açıklama + gövde. */
export function SettingsSideCard({ icon, title, subtitle, children }: SettingsSideCardProps) {
  return (
    <section className="gnl-card">
      <div className="gnl-card-head">
        <span className="gh-ico" aria-hidden="true">{icon}</span>
        <div>
          <h3>{title}</h3>
          {subtitle ? <div className="s">{subtitle}</div> : null}
        </div>
      </div>
      <div className="gnl-card-body">{children}</div>
    </section>
  );
}
```

- [ ] **Step 4: Testi çalıştır, PASS gör**

Run: `npx vitest run src/portals/admin/settings/components/__tests__/SettingsSideCard.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/portals/admin/settings/components/SettingsSideCard.tsx src/portals/admin/settings/components/__tests__/SettingsSideCard.test.tsx
git commit -m "2026-06-24 feat: Okul Ayarları paylaşımlı SettingsSideCard kartı eklendi."
```

---

### Task 7: WhereUsedCard ("Nerede Kullanılır") bileşeni

**Files:**
- Create: `src/portals/admin/settings/components/WhereUsedCard.tsx`
- Test: `src/portals/admin/settings/components/__tests__/WhereUsedCard.test.tsx`
- Modify: `src/portals/admin/settings/components/index.ts` (yeni shell bileşenlerini re-export et)

**Interfaces:**
- Consumes: Task 6 `SettingsSideCard`.
- Produces: `WhereUsedCard({ title, items }: WhereUsedCardProps)` where `WhereUsedItem = { icon: ReactNode; title: string; description: string }`. Sekmelerin sağ sütunundaki "Nerede Kullanılır" listesi.

- [ ] **Step 1: Failing test yaz**

```tsx
// src/portals/admin/settings/components/__tests__/WhereUsedCard.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WhereUsedCard } from '../WhereUsedCard';

describe('WhereUsedCard', () => {
  it('verilen tüketici öğelerini listeler', () => {
    render(
      <WhereUsedCard
        title="Nerede Kullanılır"
        items={[
          { icon: <svg />, title: 'Ders Programı', description: 'Hücre saatleri' },
          { icon: <svg />, title: 'Yoklama', description: 'Ders pencereleri' },
        ]}
      />
    );
    expect(screen.getByRole('heading', { name: 'Nerede Kullanılır' })).toBeInTheDocument();
    expect(screen.getByText('Ders Programı')).toBeInTheDocument();
    expect(screen.getByText('Yoklama')).toBeInTheDocument();
    expect(screen.getByText('Hücre saatleri')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Testi çalıştır, FAIL gör**

Run: `npx vitest run src/portals/admin/settings/components/__tests__/WhereUsedCard.test.tsx`
Expected: FAIL — modül yok.

- [ ] **Step 3: WhereUsedCard'ı yaz**

```tsx
// src/portals/admin/settings/components/WhereUsedCard.tsx
import type { ReactNode } from 'react';
import { Link2 } from 'lucide-react';
import { SettingsSideCard } from './SettingsSideCard';

export interface WhereUsedItem {
  icon: ReactNode;
  title: string;
  description: string;
}

export interface WhereUsedCardProps {
  title: string;
  items: WhereUsedItem[];
  /** Opsiyonel alt not metni (i18n'den geçilir). */
  note?: string;
}

/** handoff "Nerede Kullanılır" yan kartı: bu tanımları tüketen ekranlar listesi. */
export function WhereUsedCard({ title, items, note }: WhereUsedCardProps) {
  return (
    <SettingsSideCard icon={<Link2 size={18} />} title={title}>
      <ul className="yap-uses">
        {items.map((it) => (
          <li className="yap-use" key={it.title}>
            <span className="ico" aria-hidden="true">{it.icon}</span>
            <span className="tx">
              <span className="t">{it.title}</span>
              <span className="s">{it.description}</span>
            </span>
          </li>
        ))}
      </ul>
      {note ? <p className="gnl-note">{note}</p> : null}
    </SettingsSideCard>
  );
}
```

- [ ] **Step 4: settings.css'e `yap-uses` stillerini ekle**

`src/portals/admin/settings/settings.css` sonuna:

```css
.yap-uses { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
.yap-use { display: flex; gap: 10px; align-items: flex-start; }
.yap-use .ico {
  display: inline-flex; align-items: center; justify-content: center;
  width: 30px; height: 30px; flex: none;
  border-radius: var(--radius-sm, 8px);
  background: var(--surface, #EEF1FA); color: var(--electric, #4F6BFF);
}
.yap-use .tx { display: flex; flex-direction: column; }
.yap-use .tx .t { font-size: 13.5px; font-weight: 600; color: var(--foreground, #111827); }
.yap-use .tx .s { font-size: 12.5px; color: var(--foreground-muted, #6B7280); }
.gnl-note {
  margin: 12px 0 0; padding: 10px 12px;
  font-size: 12.5px; color: var(--foreground-muted, #6B7280);
  background: var(--surface, #EEF1FA); border-radius: var(--radius-sm, 8px);
}
```

- [ ] **Step 5: index.ts re-export'larını ekle**

`src/portals/admin/settings/components/index.ts` içine:

```ts
export { SettingsTwoColumn } from './SettingsTwoColumn';
export { SettingsSideCard } from './SettingsSideCard';
export { WhereUsedCard } from './WhereUsedCard';
export {
  SettingsHeaderActionProvider,
  useSettingsHeaderAction,
  useSettingsHeaderActionSlot,
} from './SettingsHeaderActionContext';
```

- [ ] **Step 6: Test + build çalıştır**

Run: `npx vitest run src/portals/admin/settings/components/__tests__/WhereUsedCard.test.tsx`
Expected: PASS.
Run: `npm run build`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/portals/admin/settings/components/WhereUsedCard.tsx src/portals/admin/settings/components/__tests__/WhereUsedCard.test.tsx src/portals/admin/settings/settings.css src/portals/admin/settings/components/index.ts
git commit -m "2026-06-24 feat: Okul Ayarları paylaşımlı WhereUsedCard kartı eklendi."
```

---

## Faz Kapanışı

- [ ] **Tüm settings testlerini çalıştır:** `npx vitest run src/portals/admin/settings` → tümü PASS.
- [ ] **Tip + derleme:** `npm run build` → PASS.
- [ ] **completion_status.md güncelle:** `.claude/docs/modules/school-settings/completion_status.md`'ye "Faz A — shell + PageHeader + ortak desenler" satırı; "⚠️ Spec Dışına Çıkılanlar" gerekmez (Faz A spec-içi). K4 (PageHeader'a geçiş, `SchoolSettingsTabs` kaldırıldı) tek satır not.

---

## Self-Review Notları (spec kapsamı)

- **K4 (standart PageHeader):** Task 3–4 ✅ (PageHeader.tabs + SchoolSettingsTabs kaldırıldı).
- **Head-action portal yerine context:** Task 2 ✅ (`useSettingsHeaderAction`).
- **Ortak yan kartlar / 2-kolon / savebar stili:** Task 5–7 ✅ (SettingsTwoColumn, SettingsSideCard, WhereUsedCard, settings.css savebar dahil).
- **subtitle/breadcrumb:** Task 1 ✅.
- **Kapsam dışı (sonraki fazlar):** ReadOnlyBanner entegrasyonu = Faz B; sekme içeriklerinin yeniden tasarımı = Faz C+. Bu plan yalnız shell + ortak bileşenleri üretir; mevcut sekme içerikleri `<Outlet />` ile çalışmaya devam eder.
