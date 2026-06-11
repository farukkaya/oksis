# Okul Ayarları Hizalama — Plan 1: Kabuk & Ortak Desenler Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ayarlar ekranının ortak kabuğunu (8-sekme şeridi pill+ikon stili, salt-okunur banner, dirty-state save bar) tasarım handoff'una hizalamak ve Derslikler sekmesi için route iskeletini açmak.

**Architecture:** Mevcut `SchoolSettingsPage` (route-bazlı sekme kabuğu) korunur; sekme şeridi tasarımdaki pill stiline + Lucide ikonlarına taşınır. İki yeni paylaşılan presentational primitive eklenir (`ReadOnlyBanner`, `SettingsSaveBar`) — sonraki sekme planları bunları tüketir. Derslikler için route + placeholder sekme açılır (içerik Plan 5'te dolar).

**Tech Stack:** React 18 + TS (strict), shadcn/ui (Radix) + Tailwind, react-router v7, react-i18next, vitest + @testing-library/react. Named export zorunlu, inline style yasak, `any` yasak.

> **Plan seti (9 plan):** 1) Kabuk & ortak desenler ◀ *bu plan* · 2) Modüller · 3) Genel Bilgiler · 4) Akademik Politikalar · 5) Derslikler · 6) Akademik Yapı (Ders Kataloğu) · 7) Zil Programı · 8) Tatil Takvimi · 9) Bildirim Ayarları. Kaynak spec: `docs/superpowers/specs/2026-06-11-okul-ayarlari-hizalama-design.md`.

---

## Dosya Yapısı

- **Create:** `src/portals/admin/settings/components/ReadOnlyBanner.tsx` — Sekreter salt-okunur uyarı şeridi (eye ikonu, accent-soft).
- **Create:** `src/portals/admin/settings/components/__tests__/ReadOnlyBanner.test.tsx`
- **Create:** `src/portals/admin/settings/components/SettingsSaveBar.tsx` — kirli-durum sabit alt kaydet çubuğu (Vazgeç/Kaydet, spinner, invalid'de disabled).
- **Create:** `src/portals/admin/settings/components/__tests__/SettingsSaveBar.test.tsx`
- **Create:** `src/portals/admin/settings/tabs/RoomsTab.tsx` — Derslikler sekmesi placeholder (içerik Plan 5).
- **Create:** `src/portals/admin/settings/components/__tests__/SchoolSettingsTabs.test.tsx`
- **Modify:** `src/portals/admin/settings/components/SchoolSettingsTabs.tsx` — sekme tipine `icon?` ekle, pill stiline geç.
- **Modify:** `src/portals/admin/settings/pages/SchoolSettingsPage.tsx` — sekmelere ikon + `rooms` sekmesi (4. sıra).
- **Modify:** `src/portals/admin/settings/components/index.ts` — yeni primitive export'ları.
- **Modify:** `src/portals/admin/settings/tabs/index.ts` — `RoomsTab` export.
- **Modify:** `src/app/routes.tsx:266-272` — `rooms` child route.
- **Modify:** `src/shared/i18n/locales/tr/school-settings.json` + `.../en/school-settings.json` — `tabs.rooms`, `common.readOnlyBanner`, `common.saveBar.*`.

---

## Task 1: ReadOnlyBanner primitive

**Files:**
- Create: `src/portals/admin/settings/components/ReadOnlyBanner.tsx`
- Test: `src/portals/admin/settings/components/__tests__/ReadOnlyBanner.test.tsx`
- Modify: `src/shared/i18n/locales/tr/school-settings.json`, `src/shared/i18n/locales/en/school-settings.json`
- Modify: `src/portals/admin/settings/components/index.ts`

- [ ] **Step 1: Write the failing test**

`src/portals/admin/settings/components/__tests__/ReadOnlyBanner.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ReadOnlyBanner } from '../ReadOnlyBanner';
import '../../../../../shared/i18n';

describe('ReadOnlyBanner', () => {
  it('salt-okunur uyarı mesajını status rolüyle gösterir', () => {
    render(<ReadOnlyBanner />);
    const banner = screen.getByRole('status');
    expect(banner).toHaveTextContent('Sekreter rolünde bu sekme salt-okunurdur');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- ReadOnlyBanner`
Expected: FAIL — "Cannot find module '../ReadOnlyBanner'".

- [ ] **Step 3: Add i18n keys**

`src/shared/i18n/locales/tr/school-settings.json` — `school-settings.common` objesine ekle:
```json
"readOnlyBanner": "Sekreter rolünde bu sekme salt-okunurdur — değişiklik yapamazsınız.",
"saveBar": {
  "label": "Kaydetme çubuğu",
  "message": "Kaydedilmemiş değişiklikleriniz var",
  "revert": "Vazgeç",
  "save": "Kaydet"
}
```
`src/shared/i18n/locales/en/school-settings.json` — `school-settings.common` objesine ekle:
```json
"readOnlyBanner": "This tab is read-only for the Secretary role — you cannot make changes.",
"saveBar": {
  "label": "Save bar",
  "message": "You have unsaved changes",
  "revert": "Discard",
  "save": "Save"
}
```

- [ ] **Step 4: Write the component**

`src/portals/admin/settings/components/ReadOnlyBanner.tsx`:
```tsx
import { Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Sekreter (salt-okunur) rolünde sekme başlığının altında görünen uyarı şeridi.
 * Tasarım: accent-soft zemin + eye ikonu. İçeriği render eden taraf rol kontrolünü yapar.
 */
export function ReadOnlyBanner() {
  const { t } = useTranslation('school-settings');
  return (
    <div
      role="status"
      className="flex items-center gap-2 rounded-lg bg-[var(--accent-soft,#EEF1FA)] px-4 py-2.5 text-sm text-[var(--accent,#1B2B5E)]"
    >
      <Eye className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{t('common.readOnlyBanner')}</span>
    </div>
  );
}
```

- [ ] **Step 5: Export from barrel**

`src/portals/admin/settings/components/index.ts` — mevcut export listesine ekle:
```ts
export { ReadOnlyBanner } from './ReadOnlyBanner';
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm run test -- ReadOnlyBanner`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/portals/admin/settings/components/ReadOnlyBanner.tsx \
  src/portals/admin/settings/components/__tests__/ReadOnlyBanner.test.tsx \
  src/portals/admin/settings/components/index.ts \
  src/shared/i18n/locales/tr/school-settings.json \
  src/shared/i18n/locales/en/school-settings.json
git commit -m "2026-06-11 feat: Ayarlar ReadOnlyBanner ortak primitive eklendi."
```

---

## Task 2: SettingsSaveBar primitive

**Files:**
- Create: `src/portals/admin/settings/components/SettingsSaveBar.tsx`
- Test: `src/portals/admin/settings/components/__tests__/SettingsSaveBar.test.tsx`
- Modify: `src/portals/admin/settings/components/index.ts`

> i18n `common.saveBar.*` anahtarları Task 1 Step 3'te zaten eklendi.

- [ ] **Step 1: Write the failing test**

`src/portals/admin/settings/components/__tests__/SettingsSaveBar.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SettingsSaveBar } from '../SettingsSaveBar';
import '../../../../../shared/i18n';

const baseProps = {
  isDirty: true,
  isSaving: false,
  isValid: true,
  onRevert: vi.fn(),
  onSave: vi.fn(),
};

describe('SettingsSaveBar', () => {
  it('isDirty=false iken hiçbir şey render etmez', () => {
    const { container } = render(<SettingsSaveBar {...baseProps} isDirty={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('kirli durumda Vazgeç ve Kaydet butonlarını gösterir', () => {
    render(<SettingsSaveBar {...baseProps} />);
    expect(screen.getByRole('button', { name: 'Vazgeç' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Kaydet' })).toBeEnabled();
  });

  it('isValid=false iken Kaydet disabled olur', () => {
    render(<SettingsSaveBar {...baseProps} isValid={false} />);
    expect(screen.getByRole('button', { name: 'Kaydet' })).toBeDisabled();
  });

  it('butonlar callback tetikler', async () => {
    const onRevert = vi.fn();
    const onSave = vi.fn();
    render(<SettingsSaveBar {...baseProps} onRevert={onRevert} onSave={onSave} />);
    await userEvent.click(screen.getByRole('button', { name: 'Vazgeç' }));
    await userEvent.click(screen.getByRole('button', { name: 'Kaydet' }));
    expect(onRevert).toHaveBeenCalledOnce();
    expect(onSave).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- SettingsSaveBar`
Expected: FAIL — "Cannot find module '../SettingsSaveBar'".

- [ ] **Step 3: Write the component**

`src/portals/admin/settings/components/SettingsSaveBar.tsx`:
```tsx
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../../app/components/ui/button';

type SettingsSaveBarProps = {
  /** Geçerli değerler kaydedilmiş değerlerden farklı mı. */
  isDirty: boolean;
  /** Kaydetme isteği sürüyor mu (spinner + butonlar kilitli). */
  isSaving: boolean;
  /** Form geçerli mi (false ise Kaydet disabled). */
  isValid: boolean;
  onRevert: () => void;
  onSave: () => void;
};

/**
 * Form-stili sekmeler için kirli-durum sabit alt kaydet çubuğu. `isDirty=false`
 * iken render edilmez. Tasarım: alttan kayan çubuk, "Kaydedilmemiş değişiklikleriniz
 * var" + Vazgeç (ghost) + Kaydet (primary, kaydederken spinner).
 */
export function SettingsSaveBar({
  isDirty,
  isSaving,
  isValid,
  onRevert,
  onSave,
}: SettingsSaveBarProps) {
  const { t } = useTranslation('school-settings');
  if (!isDirty) {
    return null;
  }
  return (
    <div
      role="region"
      aria-label={t('common.saveBar.label')}
      className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-4 border-t border-[var(--border)] bg-[var(--background)] px-6 py-3 shadow-[0_-2px_12px_rgba(0,0,0,0.06)]"
    >
      <span className="text-sm text-[var(--foreground-body)]">
        {t('common.saveBar.message')}
      </span>
      <div className="flex items-center gap-2">
        <Button type="button" variant="ghost" onClick={onRevert} disabled={isSaving}>
          {t('common.saveBar.revert')}
        </Button>
        <Button type="button" onClick={onSave} disabled={!isValid || isSaving}>
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          ) : null}
          {t('common.saveBar.save')}
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Export from barrel**

`src/portals/admin/settings/components/index.ts` — ekle:
```ts
export { SettingsSaveBar } from './SettingsSaveBar';
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- SettingsSaveBar`
Expected: PASS (4 test).

- [ ] **Step 6: Commit**

```bash
git add src/portals/admin/settings/components/SettingsSaveBar.tsx \
  src/portals/admin/settings/components/__tests__/SettingsSaveBar.test.tsx \
  src/portals/admin/settings/components/index.ts
git commit -m "2026-06-11 feat: Ayarlar SettingsSaveBar kirli-durum çubuğu eklendi."
```

---

## Task 3: Sekme şeridini pill + ikon stiline taşı

**Files:**
- Modify: `src/portals/admin/settings/components/SchoolSettingsTabs.tsx`
- Modify: `src/portals/admin/settings/pages/SchoolSettingsPage.tsx`
- Create: `src/portals/admin/settings/components/__tests__/SchoolSettingsTabs.test.tsx`

- [ ] **Step 1: Write the failing test**

`src/portals/admin/settings/components/__tests__/SchoolSettingsTabs.test.tsx`:
```tsx
import { MemoryRouter } from 'react-router';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SchoolSettingsTabs } from '../SchoolSettingsTabs';

describe('SchoolSettingsTabs', () => {
  it('ikonlu sekmeleri render eder ve aktif sekmeyi işaretler', () => {
    render(
      <MemoryRouter initialEntries={['/admin/settings/general']}>
        <SchoolSettingsTabs
          tabs={[
            { path: '/admin/settings/general', label: 'Genel', icon: <svg data-testid="ic-general" /> },
            { path: '/admin/settings/rooms', label: 'Derslikler', icon: <svg data-testid="ic-rooms" /> },
          ]}
        />
      </MemoryRouter>
    );
    expect(screen.getByTestId('ic-general')).toBeInTheDocument();
    expect(screen.getByTestId('ic-rooms')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Genel/ })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: /Derslikler/ })).not.toHaveAttribute('aria-current');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- SchoolSettingsTabs`
Expected: FAIL — `icon` tipi `SchoolSettingsTab`'ta yok (TS) ve ikon render edilmiyor.

- [ ] **Step 3: SchoolSettingsTabs'i güncelle**

`src/portals/admin/settings/components/SchoolSettingsTabs.tsx` — dosyanın tamamını şununla değiştir:
```tsx
import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router';

export type SchoolSettingsTab = {
  /** `/admin/settings` altındaki tam yol (örn. `/admin/settings/rooms`). */
  path: string;
  /** Tab başlığı; çağıran taraf `t(...)` ile çevrilmiş string geçirir. */
  label: string;
  /** Sekme pili içinde başlığın solunda gösterilen Lucide ikonu (17px). */
  icon?: ReactNode;
};

type SchoolSettingsTabsProps = {
  tabs: SchoolSettingsTab[];
};

/**
 * School Settings için yatay pill sekme şeridi (tasarım: beyaz segmented kart,
 * aktif pill accent zemin + beyaz metin). Aktif sekme `useLocation` ile URL'e
 * göre belirlenir; navigasyon `<Link>` üzerinden.
 */
export function SchoolSettingsTabs({ tabs }: SchoolSettingsTabsProps) {
  const { pathname } = useLocation();

  return (
    <nav
      aria-label="School Settings"
      className="flex gap-1 overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--card,#fff)] p-1.5 shadow-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {tabs.map((tab) => {
        const isActive =
          pathname === tab.path || pathname.startsWith(`${tab.path}/`);
        const className = [
          'flex shrink-0 items-center gap-2 rounded-[9px] px-3.5 py-2 text-[13.5px] font-semibold transition-colors',
          isActive
            ? 'bg-[var(--accent,#1B2B5E)] text-white shadow-sm'
            : 'text-[var(--foreground-muted)] hover:bg-[var(--surface,#EEF1FA)]',
        ].join(' ');

        return (
          <Link
            key={tab.path}
            to={tab.path}
            aria-current={isActive ? 'page' : undefined}
            className={className}
          >
            {tab.icon ? (
              <span className="flex h-[17px] w-[17px] items-center justify-center" aria-hidden="true">
                {tab.icon}
              </span>
            ) : null}
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 4: SchoolSettingsPage'e ikonları + rooms sekmesini ekle**

`src/portals/admin/settings/pages/SchoolSettingsPage.tsx` — import satırlarının altına Lucide ikon import'u ekle:
```tsx
import {
  Building2,
  Layers,
  ShieldCheck,
  DoorOpen,
  Clock,
  CalendarDays,
  Bell,
  LayoutGrid,
} from 'lucide-react';
```
ve `tabs` dizisini (satır 20-37) şununla değiştir (tasarım sırası; Derslikler 4.):
```tsx
  const tabs = useMemo<SchoolSettingsTab[]>(
    () => [
      { path: `${SETTINGS_ROOT}/general`, label: t('tabs.general'), icon: <Building2 size={17} /> },
      { path: `${SETTINGS_ROOT}/academic`, label: t('tabs.academic-structure'), icon: <Layers size={17} /> },
      { path: `${SETTINGS_ROOT}/academic-policy`, label: t('tabs.academic-policy'), icon: <ShieldCheck size={17} /> },
      { path: `${SETTINGS_ROOT}/rooms`, label: t('tabs.rooms'), icon: <DoorOpen size={17} /> },
      { path: `${SETTINGS_ROOT}/bell-schedule`, label: t('tabs.bell-schedule'), icon: <Clock size={17} /> },
      { path: `${SETTINGS_ROOT}/holidays`, label: t('tabs.holidays'), icon: <CalendarDays size={17} /> },
      { path: `${SETTINGS_ROOT}/notifications`, label: t('tabs.notifications'), icon: <Bell size={17} /> },
      { path: `${SETTINGS_ROOT}/modules`, label: t('tabs.modules'), icon: <LayoutGrid size={17} /> },
    ],
    [t]
  );
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- SchoolSettingsTabs`
Expected: PASS.

- [ ] **Step 6: Run typecheck**

Run: `npm run build`
Expected: TS hatası yok (yeni `rooms` i18n anahtarı Task 4'te eklenecek; `t('tabs.rooms')` runtime'da çözülür, build'i kırmaz).

- [ ] **Step 7: Commit**

```bash
git add src/portals/admin/settings/components/SchoolSettingsTabs.tsx \
  src/portals/admin/settings/components/__tests__/SchoolSettingsTabs.test.tsx \
  src/portals/admin/settings/pages/SchoolSettingsPage.tsx
git commit -m "2026-06-11 feat: Ayarlar sekme şeridi pill+ikon stiline hizalandı, Derslikler sekmesi eklendi."
```

---

## Task 4: Derslikler route iskeleti (placeholder)

**Files:**
- Create: `src/portals/admin/settings/tabs/RoomsTab.tsx`
- Modify: `src/portals/admin/settings/tabs/index.ts`
- Modify: `src/app/routes.tsx` (satır 268-269 civarı, settings children)
- Modify: `src/shared/i18n/locales/tr/school-settings.json`, `src/shared/i18n/locales/en/school-settings.json`
- Test: `src/portals/admin/settings/tabs/__tests__/RoomsTab.test.tsx`

- [ ] **Step 1: Write the failing test**

`src/portals/admin/settings/tabs/__tests__/RoomsTab.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RoomsTab } from '../RoomsTab';
import '../../../../../shared/i18n';

describe('RoomsTab (placeholder)', () => {
  it('Derslikler başlığını render eder', () => {
    render(<RoomsTab />);
    expect(screen.getByRole('heading', { name: 'Derslikler' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- RoomsTab`
Expected: FAIL — "Cannot find module '../RoomsTab'".

- [ ] **Step 3: i18n `tabs.rooms` anahtarını ekle**

`src/shared/i18n/locales/tr/school-settings.json` — `school-settings.tabs` objesine ekle:
```json
"rooms": "Derslikler"
```
`src/shared/i18n/locales/en/school-settings.json` — `school-settings.tabs` objesine ekle:
```json
"rooms": "Rooms"
```

- [ ] **Step 4: RoomsTab placeholder'ı oluştur**

`src/portals/admin/settings/tabs/RoomsTab.tsx`:
```tsx
import { useTranslation } from 'react-i18next';

/**
 * Derslikler sekmesi (fiziksel mekânlar). Bu plan yalnız route iskeletini açar;
 * tam içerik (toolbar, tablo/kart, drawer, veri durumları) Plan 5'te uygulanır.
 */
export function RoomsTab() {
  const { t } = useTranslation('school-settings');
  return (
    <section aria-labelledby="rooms-heading" className="space-y-2">
      <h2 id="rooms-heading" className="text-lg font-semibold text-[var(--foreground)]">
        {t('tabs.rooms')}
      </h2>
      <p className="text-sm text-[var(--foreground-muted)]">
        {t('tabs.rooms')} — {/* Plan 5 */}
      </p>
    </section>
  );
}
```

- [ ] **Step 5: tabs barrel export'una ekle**

`src/portals/admin/settings/tabs/index.ts` — ekle:
```ts
export { RoomsTab } from './RoomsTab';
```

- [ ] **Step 6: Route'u kaydet**

`src/app/routes.tsx` — import bloğuna (satır 62-68 arası, diğer tab import'larıyla) `RoomsTab` ekle:
```tsx
  RoomsTab,
```
ve settings children dizisinde (satır 268, `academic-policy` route'unun hemen altına) ekle:
```tsx
                  { path: "rooms", Component: RoomsTab },
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npm run test -- RoomsTab`
Expected: PASS.

- [ ] **Step 8: Full settings test + build doğrulaması**

Run: `npm run test -- settings && npm run build`
Expected: settings testleri yeşil, build TS hatasız.

- [ ] **Step 9: Commit**

```bash
git add src/portals/admin/settings/tabs/RoomsTab.tsx \
  src/portals/admin/settings/tabs/__tests__/RoomsTab.test.tsx \
  src/portals/admin/settings/tabs/index.ts \
  src/app/routes.tsx \
  src/shared/i18n/locales/tr/school-settings.json \
  src/shared/i18n/locales/en/school-settings.json
git commit -m "2026-06-11 feat: Derslikler sekmesi route iskeleti (placeholder) eklendi."
```

---

## Self-Review Notları

- **Spec coverage:** Bu plan spec'in "Çapraz kesen kurallar → routing (8 route), ortak desenler (RO banner, save bar), tab strip pill+ikon" ve "Derslikler route shell" kısımlarını kapsar. Save bar/drawer/field/toast desenlerinin geri kalanı (drawer, `.fld`, toast) sekme planlarında tüketilir; toast için `sonner` zaten mevcut, drawer için shadcn `drawer`/`sheet` mevcut — yeni primitive gerekmez.
- **Rol kapısı (server-side):** Sekreter salt-okunur davranışı bu planda yalnız görsel banner primitive'i olarak hazırlanır; gerçek RBAC permission gate'leri ilgili sekme planlarında (mutation izinleri) uygulanır.
- **Tip tutarlılığı:** `SchoolSettingsTab.icon?: ReactNode` Task 3'te tanımlı, Task 3 Step 4'te ve Task 1/2 primitive'lerinde tutarlı kullanılır.
- **lucide-react:** shadcn/ui kurulumu lucide-react'ı zaten getirir; ayrı kurulum yok. İkon adları doğrulanmalı (Building2, Layers, ShieldCheck, DoorOpen, Clock, CalendarDays, Bell, LayoutGrid — hepsi lucide-react'ta mevcut).
