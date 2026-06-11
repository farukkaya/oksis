# Okul Ayarları Hizalama — Plan 2: Modüller Sekmesi Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modüller sekmesini tasarım handoff'una (10 modül kartı grid + Plan Durumu yan kartı + kirli-durum save bar) birebir hizalamak; backend verisi olmayan modülleri `(Debt)` olarak işaretlemek.

**Architecture:** Frontend-first / Debt ilkesi (bkz. spec madde 3). Sunum bir **frontend modül kataloğu sabiti** ile sürülür (10 modül: ikon, etiket türü core/beta/free/enterprise, debt bayrağı). Backend `moduleConfigs` (`attendance`, `marks`, `announcements` eşleşir) `moduleKey` ile katalog üzerine bindirilir; eşleşmeyen 7 modül `(Debt)` fixture'dan render edilir. Toggle'lar lokal (kirli) durumda tutulur; **Kaydet** yalnız gerçek (debt olmayan) modüllerin değişimi için `useToggleModule` mutation'ı tetikler.

**Tech Stack:** React 18 + TS strict, shadcn/ui + Tailwind, react-i18next, lucide-react, vitest + @testing-library/react. Plan 1'de eklenen `SettingsSaveBar` primitive'i tüketilir.

> **Bağlam — frontend-first/Debt kararı:** Backend modül kataloğu yalnız 6 anahtar içerir (`attendance, marks, announcements, homework, messaging, reports`). Tasarım 10 farklı modül gösterir. Kullanıcı kararı (faruk, 2026-06-11): **FrontEnd birebir aktarılır, backend borçlu kalabilir; yeni tablo gerektiren işler ertelenir ve `(Debt)` işaretlenir.** Bu plan yeni tablo açmaz — saf frontend. Backend'de olup tasarımda olmayan `homework/messaging/reports` bu ekranda gösterilmez (debt olarak `completion_status.md`'ye not düşülür).

---

## Dosya Yapısı

- **Create:** `src/portals/admin/settings/components/BackendDebtBadge.tsx` — "(Debt)" rozeti (backend henüz bağlı değil işaretleyici).
- **Create:** `src/portals/admin/settings/components/__tests__/BackendDebtBadge.test.tsx`
- **Create:** `src/portals/admin/settings/constants/moduleCatalog.ts` — 10 modülün sunum metadatası (key, ikon adı, tag türü, debt bayrağı).
- **Create:** `src/portals/admin/settings/constants/__tests__/moduleCatalog.test.ts`
- **Create:** `src/portals/admin/settings/components/PlanStatusCard.tsx` — Plan Durumu yan kartı (plan adı + N/10; yenileme/upgrade Debt).
- **Create:** `src/portals/admin/settings/components/__tests__/PlanStatusCard.test.tsx`
- **Modify:** `src/portals/admin/settings/components/ModuleToggleCard.tsx` — ikon + footer etiket + debt rozeti + kontrollü (lokal) toggle.
- **Modify:** `src/portals/admin/settings/components/__tests__/` (yeni ModuleToggleCard testi)
- **Modify:** `src/portals/admin/settings/tabs/ModuleConfigTab.tsx` — katalog+backend merge, grid + yan kart + kirli-durum save bar + batch save.
- **Modify:** `src/portals/admin/settings/components/index.ts` — yeni export'lar.
- **Modify:** `src/shared/i18n/locales/tr/school-settings.json` + `en/...` — yeni modül başlık/açıklamaları, etiket adları, plan-status & debt anahtarları.

---

## Task 1: BackendDebtBadge primitive

**Files:**
- Create: `src/portals/admin/settings/components/BackendDebtBadge.tsx`
- Test: `src/portals/admin/settings/components/__tests__/BackendDebtBadge.test.tsx`
- Modify: `src/shared/i18n/locales/tr/school-settings.json`, `src/shared/i18n/locales/en/school-settings.json`
- Modify: `src/portals/admin/settings/components/index.ts`

- [ ] **Step 1: Write the failing test**

`src/portals/admin/settings/components/__tests__/BackendDebtBadge.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BackendDebtBadge } from '../BackendDebtBadge';
import '../../../../../shared/i18n';

describe('BackendDebtBadge', () => {
  it('Debt etiketini gösterir', () => {
    render(<BackendDebtBadge />);
    expect(screen.getByText('Debt')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- BackendDebtBadge`
Expected: FAIL — module not found.

- [ ] **Step 3: Add i18n keys**

`src/shared/i18n/locales/tr/school-settings.json` — `school-settings` kök objesine yeni `debt` objesi ekle (mevcut `common`'ın yanına):
```json
"debt": {
  "label": "Debt",
  "tooltip": "Backend henüz bağlı değil — tasarım önizlemesi (teknik borç)."
}
```
`src/shared/i18n/locales/en/school-settings.json` — `school-settings` kök objesine:
```json
"debt": {
  "label": "Debt",
  "tooltip": "Backend not wired yet — design preview (tech debt)."
}
```

- [ ] **Step 4: Write the component**

`src/portals/admin/settings/components/BackendDebtBadge.tsx`:
```tsx
import { useTranslation } from 'react-i18next';
import { Badge } from '../../../../app/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../../app/components/ui/tooltip';

/**
 * Backend verisi henüz bağlı olmayan (frontend fixture'dan beslenen) öğeleri
 * işaretleyen rozet. Frontend-first/Debt ilkesi: tasarım birebir gösterilir,
 * eksik backend görünür kalır. Mali öğrenci borcuyla ilgisi yoktur.
 */
export function BackendDebtBadge() {
  const { t } = useTranslation('school-settings');
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className="border-dashed border-amber-300 bg-amber-50 text-amber-700"
          >
            {t('debt.label')}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>{t('debt.tooltip')}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
```

- [ ] **Step 5: Export from barrel**

`src/portals/admin/settings/components/index.ts` — ekle:
```ts
export { BackendDebtBadge } from './BackendDebtBadge';
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm run test -- BackendDebtBadge`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/portals/admin/settings/components/BackendDebtBadge.tsx \
  src/portals/admin/settings/components/__tests__/BackendDebtBadge.test.tsx \
  src/portals/admin/settings/components/index.ts \
  src/shared/i18n/locales/tr/school-settings.json \
  src/shared/i18n/locales/en/school-settings.json
git commit -m "2026-06-11 feat: Ayarlar BackendDebtBadge (teknik borç işaretleyici) eklendi."
```

---

## Task 2: Modül kataloğu sabiti

**Files:**
- Create: `src/portals/admin/settings/constants/moduleCatalog.ts`
- Test: `src/portals/admin/settings/constants/__tests__/moduleCatalog.test.ts`

- [ ] **Step 1: Write the failing test**

`src/portals/admin/settings/constants/__tests__/moduleCatalog.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { MODULE_CATALOG, type ModuleCatalogEntry } from '../moduleCatalog';

describe('MODULE_CATALOG', () => {
  it('tasarımdaki 10 modülü tanımlar', () => {
    expect(MODULE_CATALOG).toHaveLength(10);
  });

  it('moduleKey benzersizdir', () => {
    const keys = MODULE_CATALOG.map((m) => m.moduleKey);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('çekirdek modüller students ve attendance', () => {
    const core = MODULE_CATALOG.filter((m) => m.tag === 'core').map((m) => m.moduleKey);
    expect(core).toEqual(['students', 'attendance']);
  });

  it('backend gerçek modülleri debt değildir, diğerleri debt', () => {
    const real = MODULE_CATALOG.filter((m) => !m.isDebt).map((m) => m.moduleKey);
    expect(real.sort()).toEqual(['announcements', 'attendance', 'marks']);
  });

  it('e-okul beta, servis enterprise', () => {
    const find = (k: string) => MODULE_CATALOG.find((m) => m.moduleKey === k) as ModuleCatalogEntry;
    expect(find('eokul').tag).toBe('beta');
    expect(find('transport').tag).toBe('enterprise');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- moduleCatalog`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the catalog**

`src/portals/admin/settings/constants/moduleCatalog.ts`:
```ts
import {
  Users,
  ClipboardCheck,
  GraduationCap,
  CalendarClock,
  Megaphone,
  Wallet,
  Network,
  Bus,
  UtensilsCrossed,
  BookOpen,
  type LucideIcon,
} from 'lucide-react';

/** Modül kartının footer etiket türü (tasarım: Çekirdek / Beta / Kurumsal / serbest). */
export type ModuleTag = 'core' | 'beta' | 'enterprise' | 'free';

export type ModuleCatalogEntry = {
  /** i18n + backend eşleşme anahtarı. */
  moduleKey: string;
  /** Kart ikonu (Lucide). */
  icon: LucideIcon;
  /** Footer etiket türü. */
  tag: ModuleTag;
  /**
   * Backend `moduleConfigs`'te karşılığı yok mu? true ise kart frontend
   * fixture'dan render edilir + BackendDebtBadge gösterir, toggle persist etmez.
   */
  isDebt: boolean;
};

/**
 * Modüller sekmesinin sunum kataloğu (tasarım handoff: 10 modül, sabit sıra).
 * Frontend-first/Debt: backend yalnız attendance/marks/announcements döndürür;
 * kalan 7 modül tasarıma birebir gösterilir ama `(Debt)` işaretlidir.
 * Çekirdek (core) modüller kilitli AÇIK render edilir.
 */
export const MODULE_CATALOG: readonly ModuleCatalogEntry[] = [
  { moduleKey: 'students', icon: Users, tag: 'core', isDebt: true },
  { moduleKey: 'attendance', icon: ClipboardCheck, tag: 'core', isDebt: false },
  { moduleKey: 'marks', icon: GraduationCap, tag: 'free', isDebt: false },
  { moduleKey: 'timetable', icon: CalendarClock, tag: 'free', isDebt: true },
  { moduleKey: 'announcements', icon: Megaphone, tag: 'free', isDebt: false },
  { moduleKey: 'finance', icon: Wallet, tag: 'free', isDebt: true },
  { moduleKey: 'eokul', icon: Network, tag: 'beta', isDebt: true },
  { moduleKey: 'transport', icon: Bus, tag: 'enterprise', isDebt: true },
  { moduleKey: 'cafeteria', icon: UtensilsCrossed, tag: 'free', isDebt: true },
  { moduleKey: 'library', icon: BookOpen, tag: 'free', isDebt: true },
] as const;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- moduleCatalog`
Expected: PASS (5 tests). Eğer bir Lucide ikon adı kurulu sürümde yoksa build aşamasında yakalanır; doğru adı bul ve değiştir (raporla).

- [ ] **Step 5: Commit**

```bash
git add src/portals/admin/settings/constants/moduleCatalog.ts \
  src/portals/admin/settings/constants/__tests__/moduleCatalog.test.ts
git commit -m "2026-06-11 feat: Modüller sunum kataloğu sabiti (10 modül, core/beta/debt) eklendi."
```

---

## Task 3: ModuleToggleCard redesign (ikon + etiket + debt + kontrollü toggle)

**Files:**
- Modify: `src/portals/admin/settings/components/ModuleToggleCard.tsx`
- Create: `src/portals/admin/settings/components/__tests__/ModuleToggleCard.test.tsx`
- Modify: `src/shared/i18n/locales/tr/school-settings.json`, `src/shared/i18n/locales/en/school-settings.json`

**Yeni davranış:** Kart artık kendi mutation'ını ÇAĞIRMAZ — kontrollü hale gelir (`checked` + `onToggle` props). Üst bileşen (Tab) lokal kirli durumu yönetir. Çekirdek (core) modüller kilitli AÇIK (switch checked + disabled). Debt modüllerinde `BackendDebtBadge` + switch disabled. Enterprise/plan dışı (`isAvailableInPlan=false`) kilit + tooltip korunur.

- [ ] **Step 1: Write the failing test**

`src/portals/admin/settings/components/__tests__/ModuleToggleCard.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Users, GraduationCap } from 'lucide-react';
import { ModuleToggleCard } from '../ModuleToggleCard';
import '../../../../../shared/i18n';

const base = {
  moduleKey: 'marks',
  icon: GraduationCap,
  tag: 'free' as const,
  isDebt: false,
  checked: true,
  isAvailableInPlan: true,
  requiredPlan: null as string | null,
  onToggle: vi.fn(),
};

describe('ModuleToggleCard', () => {
  it('serbest modülde toggle çağrılır', async () => {
    const onToggle = vi.fn();
    render(<ModuleToggleCard {...base} onToggle={onToggle} />);
    await userEvent.click(screen.getByRole('switch'));
    expect(onToggle).toHaveBeenCalledWith(false);
  });

  it('çekirdek modül kilitli AÇIK (checked + disabled)', () => {
    render(<ModuleToggleCard {...base} moduleKey="students" icon={Users} tag="core" isDebt checked />);
    const sw = screen.getByRole('switch');
    expect(sw).toBeChecked();
    expect(sw).toBeDisabled();
  });

  it('debt modülünde Debt rozeti gösterilir ve toggle disabled', () => {
    render(<ModuleToggleCard {...base} moduleKey="timetable" isDebt checked={false} />);
    expect(screen.getByText('Debt')).toBeInTheDocument();
    expect(screen.getByRole('switch')).toBeDisabled();
  });

  it('plan dışı modülde switch disabled', () => {
    render(<ModuleToggleCard {...base} moduleKey="transport" tag="enterprise" isAvailableInPlan={false} requiredPlan="Premium" checked={false} />);
    expect(screen.getByRole('switch')).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- ModuleToggleCard`
Expected: FAIL — kart hâlâ eski mutation-tabanlı API'de (`module` prop), yeni props yok.

- [ ] **Step 3: Add i18n tag labels**

`src/shared/i18n/locales/tr/school-settings.json` — `school-settings.modules` objesine ekle:
```json
"tags": {
  "core": "Çekirdek",
  "beta": "Beta",
  "enterprise": "Kurumsal Plan",
  "active": "Aktif",
  "passive": "Kapalı"
},
"core-locked": "Çekirdek modül — her zaman açık.",
"students": { "title": "Öğrenci Yönetimi", "description": "Kayıt, sınıf ve veli yönetimi — sistemin çekirdeği." },
"timetable": { "title": "Ders Programı", "description": "Haftalık program ve derslik planlaması." },
"finance": { "title": "Ödemeler & Finans", "description": "Taksit, tahsilat ve finans raporları." },
"eokul": { "title": "e-Okul Entegrasyonu", "description": "MEB e-Okul ile çift yönlü veri aktarımı." },
"transport": { "title": "Servis Takibi", "description": "Güzergah, araç ve biniş bildirimleri." },
"cafeteria": { "title": "Yemekhane", "description": "Aylık menü ve yemek yoklaması." },
"library": { "title": "Kütüphane", "description": "Katalog, ödünç verme ve gecikme takibi." }
```
(`modules.attendance/marks/announcements` başlık/açıklamaları zaten mevcutsa dokunma; yoksa tasarım metniyle ekle: Devamsızlık "Ders bazlı yoklama ve devamsızlık takibi.", Notlar & Karne "Not girişi, ortalama ve karne üretimi.", Duyurular "Hedefli duyuru ve bilgilendirme akışı.")
`src/shared/i18n/locales/en/school-settings.json` — `school-settings.modules` objesine karşılıkları ekle:
```json
"tags": { "core": "Core", "beta": "Beta", "enterprise": "Enterprise Plan", "active": "Active", "passive": "Off" },
"core-locked": "Core module — always on.",
"students": { "title": "Student Management", "description": "Enrollment, class and parent management — the system core." },
"timetable": { "title": "Timetable", "description": "Weekly schedule and room planning." },
"finance": { "title": "Payments & Finance", "description": "Installments, collection and finance reports." },
"eokul": { "title": "e-Okul Integration", "description": "Two-way data sync with MEB e-Okul." },
"transport": { "title": "Transport Tracking", "description": "Routes, vehicles and boarding notifications." },
"cafeteria": { "title": "Cafeteria", "description": "Monthly menu and meal attendance." },
"library": { "title": "Library", "description": "Catalog, lending and overdue tracking." }
```

- [ ] **Step 4: Rewrite the component**

`src/portals/admin/settings/components/ModuleToggleCard.tsx` — dosyanın tamamını şununla değiştir:
```tsx
import { Lock, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '../../../../app/components/ui/badge';
import { Switch } from '../../../../app/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../../app/components/ui/tooltip';
import { BackendDebtBadge } from './BackendDebtBadge';
import type { ModuleTag } from '../constants/moduleCatalog';

type ModuleToggleCardProps = {
  moduleKey: string;
  icon: LucideIcon;
  tag: ModuleTag;
  /** Backend verisi yok → fixture; toggle persist etmez, Debt rozeti gösterilir. */
  isDebt: boolean;
  /** Switch'in görsel durumu (üst bileşenin lokal kirli durumundan). */
  checked: boolean;
  /** Okulun planı bu modülü kapsıyor mu (enterprise/plan kilidi). */
  isAvailableInPlan: boolean;
  /** Plan dışıysa açan en düşük plan kodu. */
  requiredPlan: string | null;
  /** Kullanıcı switch'i değiştirdiğinde yeni değer. Kilitliyse çağrılmaz. */
  onToggle: (next: boolean) => void;
};

/**
 * Tek modül kartı — sunum kontrollü (mutation üst bileşende). Tasarım: ikon,
 * başlık, açıklama, footer etiket. Çekirdek (core) modüller kilitli AÇIK;
 * debt modülleri BackendDebtBadge + kilitli; plan dışı modüller kilit + tooltip.
 */
export function ModuleToggleCard({
  moduleKey,
  icon: Icon,
  tag,
  isDebt,
  checked,
  isAvailableInPlan,
  requiredPlan,
  onToggle,
}: ModuleToggleCardProps) {
  const { t } = useTranslation('school-settings');

  const title = t(`modules.${moduleKey}.title`, {
    defaultValue: t('modules.fallback.title', { key: moduleKey }),
  });
  const description = t(`modules.${moduleKey}.description`, {
    defaultValue: t('modules.fallback.description'),
  });

  const isCore = tag === 'core';
  const isPlanLocked = !isAvailableInPlan;
  // Kilit: çekirdek (her zaman açık), plan dışı, veya debt (henüz bağlı değil).
  const isLocked = isCore || isPlanLocked || isDebt;
  const visualChecked = isCore ? true : checked;

  const footerTag = (() => {
    if (tag === 'core') return { label: t('modules.tags.core'), cls: 'bg-slate-100 text-slate-700' };
    if (tag === 'beta') return { label: t('modules.tags.beta'), cls: 'bg-violet-100 text-violet-700' };
    if (tag === 'enterprise') return { label: t('modules.tags.enterprise'), cls: 'bg-amber-100 text-amber-700' };
    return visualChecked
      ? { label: t('modules.tags.active'), cls: 'bg-emerald-100 text-emerald-700' }
      : { label: t('modules.tags.passive'), cls: 'bg-slate-100 text-slate-500' };
  })();

  const handleToggle = (next: boolean) => {
    if (isLocked) return;
    onToggle(next);
  };

  const switchControl = (
    <Switch
      checked={visualChecked}
      onCheckedChange={handleToggle}
      disabled={isLocked}
      aria-label={title}
    />
  );

  const lockTooltip = isPlanLocked && requiredPlan
    ? t('modules.plan-locked', { plan: requiredPlan })
    : isCore
      ? t('modules.core-locked')
      : '';

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--surface,#EEF1FA)] text-[var(--accent,#1B2B5E)]">
            <Icon size={18} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-sm font-semibold">{title}</h3>
              {isDebt ? <BackendDebtBadge /> : null}
            </div>
            <p className="mt-1 text-xs text-[var(--foreground-muted)]">{description}</p>
          </div>
        </div>
        {lockTooltip ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex items-center gap-1">
                  {isPlanLocked ? <Lock className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" /> : null}
                  {switchControl}
                </span>
              </TooltipTrigger>
              <TooltipContent>{lockTooltip}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          switchControl
        )}
      </div>
      <div>
        <Badge variant="outline" className={`border-transparent ${footerTag.cls}`}>
          {footerTag.label}
        </Badge>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- ModuleToggleCard`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add src/portals/admin/settings/components/ModuleToggleCard.tsx \
  src/portals/admin/settings/components/__tests__/ModuleToggleCard.test.tsx \
  src/shared/i18n/locales/tr/school-settings.json \
  src/shared/i18n/locales/en/school-settings.json
git commit -m "2026-06-11 feat: ModuleToggleCard tasarıma hizalandı (ikon, etiket, debt, kontrollü toggle)."
```

---

## Task 4: PlanStatusCard yan kartı

**Files:**
- Create: `src/portals/admin/settings/components/PlanStatusCard.tsx`
- Test: `src/portals/admin/settings/components/__tests__/PlanStatusCard.test.tsx`
- Modify: `src/portals/admin/settings/components/index.ts`
- Modify: `src/shared/i18n/locales/tr/school-settings.json`, `src/shared/i18n/locales/en/school-settings.json`

**Davranış:** Plan adı + "N/10 modül aktif" gerçek (props'tan). **Yenileme tarihi + "Planı Yükselt"** backend abonelik verisi olmadığından `(Debt)` — `BackendDebtBadge` ile işaretli, buton disabled.

- [ ] **Step 1: Write the failing test**

`src/portals/admin/settings/components/__tests__/PlanStatusCard.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PlanStatusCard } from '../PlanStatusCard';
import '../../../../../shared/i18n';

describe('PlanStatusCard', () => {
  it('aktif/toplam modül sayısını ve plan adını gösterir', () => {
    render(<PlanStatusCard planName="Standart" activeCount={7} totalCount={10} />);
    expect(screen.getByText('7/10')).toBeInTheDocument();
    expect(screen.getByText('Standart')).toBeInTheDocument();
  });

  it('yenileme/upgrade alanını Debt olarak işaretler', () => {
    render(<PlanStatusCard planName="Standart" activeCount={7} totalCount={10} />);
    expect(screen.getByText('Debt')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Planı Yükselt/ })).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- PlanStatusCard`
Expected: FAIL — module not found.

- [ ] **Step 3: Add i18n keys**

`src/shared/i18n/locales/tr/school-settings.json` — `school-settings` köküne `planStatus` objesi ekle:
```json
"planStatus": {
  "title": "Plan Durumu",
  "active": "modül aktif",
  "currentPlan": "Mevcut plan",
  "renewal": "Yenileme",
  "upgrade": "Planı Yükselt"
}
```
`src/shared/i18n/locales/en/school-settings.json`:
```json
"planStatus": {
  "title": "Plan Status",
  "active": "modules active",
  "currentPlan": "Current plan",
  "renewal": "Renewal",
  "upgrade": "Upgrade Plan"
}
```

- [ ] **Step 4: Write the component**

`src/portals/admin/settings/components/PlanStatusCard.tsx`:
```tsx
import { useTranslation } from 'react-i18next';
import { Button } from '../../../../app/components/ui/button';
import { BackendDebtBadge } from './BackendDebtBadge';

type PlanStatusCardProps = {
  /** Okulun planı (ör. "Standart"). */
  planName: string;
  /** Aktif (plan içinde + açık) modül sayısı. */
  activeCount: number;
  /** Toplam modül sayısı (katalog uzunluğu). */
  totalCount: number;
};

/**
 * Modüller sekmesi yan kartı: plan adı + aktif/toplam modül. Tasarımdaki
 * "Yenileme" tarihi + "Planı Yükselt" backend abonelik verisi henüz olmadığından
 * (Debt) işaretli ve buton pasiftir (frontend-first/Debt ilkesi).
 */
export function PlanStatusCard({ planName, activeCount, totalCount }: PlanStatusCardProps) {
  const { t } = useTranslation('school-settings');
  return (
    <aside className="space-y-4 rounded-2xl border border-[var(--border)] bg-white p-5">
      <h3 className="text-sm font-semibold">{t('planStatus.title')}</h3>
      <div>
        <div className="text-3xl font-bold text-[var(--accent,#1B2B5E)]">
          {activeCount}/{totalCount}
        </div>
        <div className="text-xs text-[var(--foreground-muted)]">{t('planStatus.active')}</div>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-[var(--foreground-muted)]">{t('planStatus.currentPlan')}</span>
        <span className="font-semibold">{planName}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 text-[var(--foreground-muted)]">
          {t('planStatus.renewal')} <BackendDebtBadge />
        </span>
        <span className="text-[var(--foreground-faint,#9AA3B2)]">—</span>
      </div>
      <Button type="button" variant="outline" className="w-full" disabled>
        {t('planStatus.upgrade')}
      </Button>
    </aside>
  );
}
```

- [ ] **Step 5: Export from barrel**

`src/portals/admin/settings/components/index.ts` — ekle:
```ts
export { PlanStatusCard } from './PlanStatusCard';
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm run test -- PlanStatusCard`
Expected: PASS (2 tests).

- [ ] **Step 7: Commit**

```bash
git add src/portals/admin/settings/components/PlanStatusCard.tsx \
  src/portals/admin/settings/components/__tests__/PlanStatusCard.test.tsx \
  src/portals/admin/settings/components/index.ts \
  src/shared/i18n/locales/tr/school-settings.json \
  src/shared/i18n/locales/en/school-settings.json
git commit -m "2026-06-11 feat: Modüller Plan Durumu yan kartı (yenileme/upgrade Debt) eklendi."
```

---

## Task 5: ModuleConfigTab yeniden inşa (grid + yan kart + save bar + batch save)

**Files:**
- Modify: `src/portals/admin/settings/tabs/ModuleConfigTab.tsx`
- Modify: `src/portals/admin/settings/tabs/__tests__/` (yeni ModuleConfigTab testi — yoksa oluştur: `src/portals/admin/settings/tabs/__tests__/ModuleConfigTab.test.tsx`)

**Davranış:** `MODULE_CATALOG` üzerinde dönülür; her modülün backend durumu `data.moduleConfigs` içinden `moduleKey` ile bulunur (yoksa `isAvailableInPlan=true, isEnabled=false, requiredPlan=null` fixture). Toggle'lar **lokal state**'te tutulur (kirli durum). `SettingsSaveBar` (Plan 1) kirliyse görünür; **Kaydet** yalnız debt OLMAYAN ve değişen modüller için `useToggleModule.mutate` çağırır, sonra lokal state'i senkronlar. `PlanStatusCard` aktif sayısını lokal state'ten hesaplar. Plan adı backend'de bu yanıt içinde yoksa `(Debt)`/"—" — şimdilik `requiredPlan` mantığından bağımsız sabit `"Standart"` yerine, mevcutsa kullan; yoksa PlanStatusCard'a `planName="—"` geçilir (plan adı backend genişlemesi ayrı debt).

- [ ] **Step 1: Write the failing test**

`src/portals/admin/settings/tabs/__tests__/ModuleConfigTab.test.tsx`:
```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, beforeEach } from 'vitest';
import { server } from '../../../../../test/mswServer';
import { useAuthStore } from '../../../../../shared/store/authStore';
import { UserRole } from '../../../../../modules/identity/types/user.types';
import { ADMIN_PERMISSIONS } from '../../../../../test/authFixtures';
import { ModuleConfigTab } from '../ModuleConfigTab';
import '../../../../../shared/i18n';

const BASE = 'http://localhost:5112/api/v1';

function wrap(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{ui}</QueryClientProvider>;
}

beforeEach(() => {
  useAuthStore.setState({
    user: {
      id: 'u1', schoolId: 'school-1', firstName: 'T', lastName: 'U',
      email: 'a@b.c', role: UserRole.SchoolAdmin, firstLoginRequired: false,
      permissions: ADMIN_PERMISSIONS,
    },
    accessToken: 'jwt', firstLoginRequired: false,
  });
  server.use(
    http.get(`${BASE}/school-settings`, () =>
      HttpResponse.json({
        basicInfo: {}, contactInfo: {}, address: {}, theme: {},
        academicStructure: {}, academicPolicy: {}, notificationConfig: null,
        moduleConfigs: [
          { moduleKey: 'attendance', isEnabled: true, isAvailableInPlan: true, requiredPlan: null },
          { moduleKey: 'marks', isEnabled: true, isAvailableInPlan: true, requiredPlan: null },
          { moduleKey: 'announcements', isEnabled: false, isAvailableInPlan: true, requiredPlan: null },
        ],
      })
    )
  );
});

describe('ModuleConfigTab', () => {
  it('10 modül kartını ve Plan Durumu kartını render eder', async () => {
    render(wrap(<ModuleConfigTab />));
    await waitFor(() => expect(screen.getByText('Öğrenci Yönetimi')).toBeInTheDocument());
    expect(screen.getAllByRole('switch')).toHaveLength(10);
    expect(screen.getByText('Plan Durumu')).toBeInTheDocument();
  });

  it('debt modülleri (örn. Ders Programı) Debt rozetiyle gösterir', async () => {
    render(wrap(<ModuleConfigTab />));
    await waitFor(() => expect(screen.getByText('Ders Programı')).toBeInTheDocument());
    // 7 debt modülü + PlanStatusCard yenileme = en az 8 Debt rozeti
    expect(screen.getAllByText('Debt').length).toBeGreaterThanOrEqual(8);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- ModuleConfigTab`
Expected: FAIL — eski tab yeni kart API'sini kullanmıyor, PlanStatusCard yok.

- [ ] **Step 3: Rewrite the tab**

`src/portals/admin/settings/tabs/ModuleConfigTab.tsx` — tamamını şununla değiştir:
```tsx
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../../app/components/ui/button';
import { Skeleton } from '../../../../app/components/ui/skeleton';
import { ModuleToggleCard } from '../components/ModuleToggleCard';
import { PlanStatusCard } from '../components/PlanStatusCard';
import { SettingsSaveBar } from '../components/SettingsSaveBar';
import { MODULE_CATALOG } from '../constants/moduleCatalog';
import { useSchoolSettings, useToggleModule } from '../api';
import type { ModuleConfigDto } from '../types';

/** Katalog girdisi + backend (veya fixture) durumunun birleşimi. */
type ResolvedModule = (typeof MODULE_CATALOG)[number] & {
  isAvailableInPlan: boolean;
  requiredPlan: string | null;
  savedEnabled: boolean;
};

function resolveModules(configs: ModuleConfigDto[]): ResolvedModule[] {
  const byKey = new Map(configs.map((c) => [c.moduleKey, c]));
  return MODULE_CATALOG.map((entry) => {
    const cfg = byKey.get(entry.moduleKey);
    return {
      ...entry,
      isAvailableInPlan: cfg?.isAvailableInPlan ?? true,
      requiredPlan: cfg?.requiredPlan ?? null,
      savedEnabled: cfg?.isEnabled ?? false,
    };
  });
}

/**
 * Modüller sekmesi. Tasarım: 10 modül kart grid + Plan Durumu yan kartı + kirli
 * durum save bar. Frontend-first/Debt: backend yalnız bir kısmını döndürür;
 * eksikler `(Debt)` ile gösterilir ve kaydedilmez. Toggle'lar lokal kirli
 * durumda; Kaydet yalnız gerçek (debt olmayan) değişimleri persist eder.
 */
export function ModuleConfigTab() {
  const { data, isPending, isError, refetch } = useSchoolSettings();
  const { t } = useTranslation('school-settings');
  const toggleMutation = useToggleModule();
  const [draft, setDraft] = useState<Record<string, boolean> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const resolved = useMemo(
    () => (data ? resolveModules(data.moduleConfigs) : []),
    [data]
  );

  if (isPending) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 md:p-6">
        <p className="text-sm text-destructive">{t('errors.save-failed')}</p>
        <Button type="button" variant="outline" className="mt-3" onClick={() => refetch()}>
          {t('retry')}
        </Button>
      </div>
    );
  }

  const currentChecked = (key: string, savedEnabled: boolean) =>
    draft?.[key] ?? savedEnabled;

  const handleToggle = (key: string, next: boolean) => {
    setDraft((prev) => ({ ...(prev ?? {}), [key]: next }));
  };

  const dirtyRealKeys = resolved.filter(
    (m) => !m.isDebt && draft && draft[m.moduleKey] !== undefined && draft[m.moduleKey] !== m.savedEnabled
  );
  const isDirty = !!draft && resolved.some(
    (m) => draft[m.moduleKey] !== undefined && draft[m.moduleKey] !== m.savedEnabled
  );

  const handleRevert = () => setDraft(null);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      for (const m of dirtyRealKeys) {
        await toggleMutation.mutateAsync({
          moduleKey: m.moduleKey,
          isEnabled: draft![m.moduleKey],
        });
      }
      setDraft(null);
    } finally {
      setIsSaving(false);
    }
  };

  const activeCount = resolved.filter((m) => {
    if (m.tag === 'core') return true;
    return m.isAvailableInPlan && currentChecked(m.moduleKey, m.savedEnabled);
  }).length;

  const planName = data.moduleConfigs.find((c) => c.requiredPlan)?.requiredPlan ?? '—';

  return (
    <>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {resolved.map((m) => (
            <ModuleToggleCard
              key={m.moduleKey}
              moduleKey={m.moduleKey}
              icon={m.icon}
              tag={m.tag}
              isDebt={m.isDebt}
              checked={currentChecked(m.moduleKey, m.savedEnabled)}
              isAvailableInPlan={m.isAvailableInPlan}
              requiredPlan={m.requiredPlan}
              onToggle={(next) => handleToggle(m.moduleKey, next)}
            />
          ))}
        </div>
        <PlanStatusCard
          planName={planName}
          activeCount={activeCount}
          totalCount={resolved.length}
        />
      </div>
      <SettingsSaveBar
        isDirty={isDirty}
        isSaving={isSaving}
        isValid
        onRevert={handleRevert}
        onSave={handleSave}
      />
    </>
  );
}
```

> Not: `useToggleModule` mutation'ının `mutateAsync` desteklediğini doğrula (React Query mutation'ları varsayılan olarak destekler). Eğer mevcut `useToggleModule` imzası farklıysa (`{ moduleKey, isEnabled }` almıyorsa), `src/portals/admin/settings/api/school-settings.mutations.ts`'i oku ve çağrıyı ona uyarla — değiştirme, sadece uyumlu çağır.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- ModuleConfigTab`
Expected: PASS (2 tests).

- [ ] **Step 5: Full settings suite + build**

Run: `npm run test -- settings && npm run build`
Expected: tüm settings testleri yeşil, build TS hatasız. (Eski `useSchoolSettings` boş objelerle dönen mock'larda diğer tab testleri etkilenmemeli; etkilenen varsa minimal düzelt ve raporla.)

- [ ] **Step 6: Commit**

```bash
git add src/portals/admin/settings/tabs/ModuleConfigTab.tsx \
  src/portals/admin/settings/tabs/__tests__/ModuleConfigTab.test.tsx
git commit -m "2026-06-11 feat: Modüller sekmesi tasarıma hizalandı (10 kart grid + Plan Durumu + save bar, debt işaretli)."
```

---

## Self-Review Notları

- **Spec coverage:** Spec "8 · Modüller" sekmesi: kart grid (ikon/ad/açıklama/toggle/footer tag) ✅, Çekirdek kilitli ON ✅, Beta tag ✅, Kurumsal Plan kilitli OFF + tooltip ✅, Plan Durumu yan kartı ✅. Frontend-first/Debt (spec madde 3) uygulanır: 7 modül + yenileme/upgrade `(Debt)`.
- **Backend debt kaydı:** Plan tamamlanınca `.claude/docs/modules/school-settings/completion_status.md`'ye debt notu eklenecek (controller/insan tarafından): (1) 7 modül (students, timetable, finance, eokul, transport, cafeteria, library) backend kataloğunda yok — frontend fixture; (2) plan adı + yenileme tarihi + upgrade akışı backend abonelik verisi yok; (3) backend'de var olan homework/messaging/reports tasarım gridinde gösterilmiyor.
- **Tip tutarlılığı:** `ModuleTag`, `ModuleCatalogEntry` Task 2'de tanımlı; `ModuleToggleCard` (Task 3) ve `ModuleConfigTab` (Task 5) aynı tipi kullanır. `ModuleToggleCard` artık `module` prop almaz (kontrollü API) — tüm çağıranlar Task 5'te güncellendi.
- **YAGNI:** Save bar batch save yalnız debt olmayan + değişen modülleri persist eder; debt toggle'ları kilitli olduğundan kirli duruma giremez (UI seviyesinde `onToggle` çağrılmaz).
- **Risk:** `useToggleModule` imzası — Task 5 Step 3 notu doğrulamayı zorunlu kılar.
