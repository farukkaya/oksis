# Paylaşımlı PageHeader Componenti — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admin portalının dağınık 4 header uygulamasını, esnek slotlu tek paylaşımlı `PageHeader` componentine indirip 3 pilot ekranı (Öğrenciler, Öğretmenler, Kullanıcılar) buna geçirmek.

**Architecture:** `src/shared/components/PageHeader/` altında named-export bir React componenti + kendi `page-header.css`'i (global theme token'larıyla, sayfa kapsamından bağımsız). API: `title` (zorunlu) + opsiyonel `breadcrumb`, `subtitle`, `aside` (sol grup — sezon seçici), `actions` (sağ — butonlar/sayaçlar). Pilot sayfalar kendi `*PageHead` componentlerini bu componentle değiştirir; aksiyon butonları slot olarak geçer ve sayfa kök sarmalayıcısı (`.stu`) içinde render edildiğinden mevcut `.btn` stili çalışmaya devam eder.

**Tech Stack:** React 18 + TypeScript (strict), Vite, CSS (theme token'ları), react-router `Link`, lucide-react ikonları, i18next, Vitest + @testing-library/react.

**Spec:** `docs/superpowers/specs/2026-06-11-shared-page-header-design.md`

---

## Dosya Yapısı

- **Create** `oksis-web/src/shared/components/PageHeader/PageHeader.tsx` — component (named export) + tipler.
- **Create** `oksis-web/src/shared/components/PageHeader/index.ts` — re-export.
- **Create** `oksis-web/src/shared/styles/page-header.css` — global `.page-header` stilleri.
- **Create** `oksis-web/src/shared/components/PageHeader/__tests__/PageHeader.test.tsx` — birim test.
- **Modify** `oksis-web/src/portals/admin/students/StudentsPage.tsx` — `StudentsPageHead` → `PageHeader`.
- **Delete** `oksis-web/src/portals/admin/students/components/StudentsPageHead.tsx`.
- **Modify** `oksis-web/src/portals/admin/teachers/TeachersPage.tsx` — `TeachersPageHead` → `PageHeader`.
- **Delete** `oksis-web/src/portals/admin/teachers/components/TeachersPageHead.tsx`.
- **Modify** `oksis-web/src/portals/admin/users/UsersPage.tsx` — `UsersPageHead` → `PageHeader`.
- **Delete** `oksis-web/src/portals/admin/users/components/UsersPageHead.tsx`.

> Tüm komutlar `oksis-web/` dizininden çalıştırılır.

---

## Task 1: PageHeader componenti + CSS + test

**Files:**
- Create: `oksis-web/src/shared/components/PageHeader/PageHeader.tsx`
- Create: `oksis-web/src/shared/components/PageHeader/index.ts`
- Create: `oksis-web/src/shared/styles/page-header.css`
- Test: `oksis-web/src/shared/components/PageHeader/__tests__/PageHeader.test.tsx`

- [ ] **Step 1: Failing test'i yaz**

Create `oksis-web/src/shared/components/PageHeader/__tests__/PageHeader.test.tsx`:

```tsx
import { MemoryRouter } from "react-router";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageHeader } from "../PageHeader";

describe("PageHeader", () => {
  it("renders the title as an h1", () => {
    render(
      <MemoryRouter>
        <PageHeader title="Öğrenciler" />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Öğrenciler");
  });

  it("renders breadcrumb items; an item with `to` becomes a link", () => {
    render(
      <MemoryRouter>
        <PageHeader
          title="Öğrenciler"
          breadcrumb={[{ label: "Okul", to: "/admin" }, { label: "Öğrenciler" }]}
        />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: "Okul" })).toHaveAttribute("href", "/admin");
    expect(screen.getByText("Öğrenciler", { selector: "span" })).toBeInTheDocument();
  });

  it("renders subtitle, aside and actions slots", () => {
    render(
      <MemoryRouter>
        <PageHeader
          title="Öğrenciler"
          subtitle="1.248 aktif öğrenci"
          aside={<div data-testid="aside">sezon</div>}
          actions={<button type="button">Yeni</button>}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText("1.248 aktif öğrenci")).toBeInTheDocument();
    expect(screen.getByTestId("aside")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Yeni" })).toBeInTheDocument();
  });

  it("omits breadcrumb/subtitle/aside/actions when not provided", () => {
    const { container } = render(
      <MemoryRouter>
        <PageHeader title="Sadece başlık" />
      </MemoryRouter>,
    );
    expect(container.querySelector(".ph-breadcrumb")).toBeNull();
    expect(container.querySelector(".ph-sub")).toBeNull();
    expect(container.querySelector(".ph-aside")).toBeNull();
    expect(container.querySelector(".ph-actions")).toBeNull();
  });
});
```

- [ ] **Step 2: Test'i çalıştır, fail ettiğini doğrula**

Run: `npm run test -- src/shared/components/PageHeader`
Expected: FAIL — `Failed to resolve import "../PageHeader"` (henüz yok).

- [ ] **Step 3: CSS'i yaz**

Create `oksis-web/src/shared/styles/page-header.css`:

```css
/* Paylaşımlı sayfa başlığı (üst bağlam barı).
   Değerler classrooms/students handoff'undan birebir; global theme token'larıyla
   (--foreground*, --line) sayfa kapsamından bağımsız çalışır. */
.page-header {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  margin-bottom: 22px;
  flex-wrap: wrap;
}
.page-header .ph-left {
  flex: 1;
  display: flex;
  align-items: flex-end;
  gap: 16px;
  flex-wrap: wrap;
}
.page-header .ph-text {
  min-width: 200px;
}
.page-header .ph-breadcrumb {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12.5px;
  color: var(--foreground-faint);
  font-weight: 600;
  margin-bottom: 7px;
}
.page-header .ph-breadcrumb a,
.page-header .ph-breadcrumb span {
  color: inherit;
  text-decoration: none;
}
.page-header .ph-breadcrumb a:hover {
  color: var(--foreground-muted);
}
.page-header .ph-sep {
  color: var(--line);
  flex: none;
}
.page-header h1 {
  font-size: 27px;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--foreground);
  margin: 0;
}
.page-header .ph-sub {
  font-size: 14.5px;
  color: var(--foreground-muted);
  margin: 5px 0 0;
}
.page-header .ph-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}
```

- [ ] **Step 4: Component'i yaz**

Create `oksis-web/src/shared/components/PageHeader/PageHeader.tsx`:

```tsx
import { Fragment, type ReactNode } from "react";
import { Link } from "react-router";
import { ChevronRight } from "lucide-react";
import { cn } from "../../../lib/utils";
import "../../styles/page-header.css";

export interface PageHeaderBreadcrumbItem {
  /** Görünen metin. */
  label: string;
  /** Verilirse <Link to>, yoksa düz <span>. */
  to?: string;
}

export interface PageHeaderProps {
  /** Zorunlu — <h1> olarak render edilir. */
  title: string;
  /** Üst kırıntı yolu; aralara ChevronRight ayracı konur. */
  breadcrumb?: PageHeaderBreadcrumbItem[];
  /** Başlık altı açıklama. */
  subtitle?: ReactNode;
  /** Text bloğunun hemen sağındaki sol grup (ör. sezon seçici). */
  aside?: ReactNode;
  /** En sağdaki grup (ör. özet sayaçlar + aksiyon butonları). */
  actions?: ReactNode;
  /** Ekstra sınıf. */
  className?: string;
}

/**
 * Admin portalı için paylaşımlı üst bağlam barı: breadcrumb + başlık + subtitle
 * (sol) ve opsiyonel `aside` (sol grup) + `actions` (sağ grup) slotları.
 */
export function PageHeader({
  title,
  breadcrumb,
  subtitle,
  aside,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("page-header", className)}>
      <div className="ph-left">
        <div className="ph-text">
          {breadcrumb && breadcrumb.length > 0 ? (
            <nav className="ph-breadcrumb" aria-label="breadcrumb">
              {breadcrumb.map((item, i) => (
                <Fragment key={`${item.label}-${i}`}>
                  {i > 0 && <ChevronRight size={13} className="ph-sep" aria-hidden />}
                  {item.to ? <Link to={item.to}>{item.label}</Link> : <span>{item.label}</span>}
                </Fragment>
              ))}
            </nav>
          ) : null}
          <h1>{title}</h1>
          {subtitle ? <p className="ph-sub">{subtitle}</p> : null}
        </div>
        {aside ? <div className="ph-aside">{aside}</div> : null}
      </div>
      {actions ? <div className="ph-actions">{actions}</div> : null}
    </header>
  );
}
```

- [ ] **Step 5: index.ts'i yaz**

Create `oksis-web/src/shared/components/PageHeader/index.ts`:

```ts
export { PageHeader } from "./PageHeader";
export type { PageHeaderProps, PageHeaderBreadcrumbItem } from "./PageHeader";
```

- [ ] **Step 6: Test'i çalıştır, geçtiğini doğrula**

Run: `npm run test -- src/shared/components/PageHeader`
Expected: PASS (4 test).

- [ ] **Step 7: Tip kontrolü + build**

Run: `npm run build`
Expected: build başarılı (TypeScript hatası yok).

- [ ] **Step 8: Commit**

```bash
git add src/shared/components/PageHeader src/shared/styles/page-header.css
git commit -m "2026-06-11 feat: Paylaşımlı PageHeader componenti eklendi."
```

---

## Task 2: Öğrenciler ekranını PageHeader'a geçir

**Files:**
- Modify: `oksis-web/src/portals/admin/students/StudentsPage.tsx`
- Delete: `oksis-web/src/portals/admin/students/components/StudentsPageHead.tsx`

> Refactor (sunum) — yeni birim test yok; doğrulama build + mevcut testlerdir.

- [ ] **Step 1: StudentsPage import'larını güncelle**

`StudentsPage.tsx` başındaki import bloğunda `StudentsPageHead` satırını kaldır ve şu importları ekle (icon'lar artık sayfada kullanılacak, `PageHeader` eklenir):

Kaldır:
```tsx
import { StudentsPageHead } from "./components/StudentsPageHead";
```
Ekle (mevcut react-i18next import'unun altına uygun yere):
```tsx
import { FileText, Plus } from "lucide-react";
import { PageHeader } from "../../../shared/components/PageHeader";
```

- [ ] **Step 2: `<StudentsPageHead .../>` çağrısını `<PageHeader>` ile değiştir**

`StudentsPage.tsx` içindeki şu blok:
```tsx
        <StudentsPageHead
          activeCount={statsQuery.data?.active ?? totalCount}
          season={selectedSeason?.name ?? ""}
          onExport={handleExport}
          onNew={() => setModal({ kind: "enroll" })}
          exporting={exporting}
          seasonSelector={
            <SeasonSelector
              options={seasonOptions}
              value={seasonId}
              loading={seasonsQuery.isLoading}
              onChange={(v) => patchParams({ season: v || null }, true)}
            />
          }
        />
```
şununla değiştirilir:
```tsx
        <PageHeader
          breadcrumb={[
            { label: t("breadcrumb.school") },
            { label: t("breadcrumb.students") },
          ]}
          title={t("title")}
          subtitle={t("subtitle", {
            count: statsQuery.data?.active ?? totalCount,
            season: selectedSeason?.name ?? "",
          })}
          aside={
            <SeasonSelector
              options={seasonOptions}
              value={seasonId}
              loading={seasonsQuery.isLoading}
              onChange={(v) => patchParams({ season: v || null }, true)}
            />
          }
          actions={
            <>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleExport}
                disabled={exporting}
              >
                <FileText size={17} /> {t("actions.export")}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setModal({ kind: "enroll" })}
              >
                <Plus size={18} strokeWidth={2.2} /> {t("actions.new")}
              </button>
            </>
          }
        />
```

> Not: `t` `useTranslation("students")` ile zaten sayfada mevcut. Değilse, `StudentsPage` zaten `useTranslation`'ı kullanıyor — namespace `"students"` olduğundan emin ol; eğer sayfada `t` farklı namespace ise `const { t } = useTranslation("students");` satırının var olduğunu doğrula (mevcut StudentsPageHead `useTranslation("students")` kullanıyordu, anahtarlar bu ns'e ait).

- [ ] **Step 3: Eski component'i sil**

```bash
git rm src/portals/admin/students/components/StudentsPageHead.tsx
```

- [ ] **Step 4: `t` namespace doğrula (gerekirse ekle)**

Run: `grep -n "useTranslation" src/portals/admin/students/StudentsPage.tsx`
Beklenen: `useTranslation("students")` çağrısı mevcut. Yoksa StudentsPage'in mevcut `t`'sinin `"students"` ns olduğunu doğrula; değilse PageHeader bloğunda kullanılacak anahtarlar için sayfaya `const { t } = useTranslation("students");` ekle (mevcut bir `t` varsa onu kullan).

- [ ] **Step 5: Build + test**

Run: `npm run build && npm run test -- src/portals/admin/students`
Expected: build başarılı; mevcut students testleri PASS.

- [ ] **Step 6: Commit**

```bash
git add src/portals/admin/students/StudentsPage.tsx
git commit -m "2026-06-11 refactor: Öğrenciler ekranı paylaşımlı PageHeader'a geçirildi."
```

---

## Task 3: Öğretmenler ekranını PageHeader'a geçir

**Files:**
- Modify: `oksis-web/src/portals/admin/teachers/TeachersPage.tsx`
- Delete: `oksis-web/src/portals/admin/teachers/components/TeachersPageHead.tsx`

- [ ] **Step 1: Import'ları güncelle**

`TeachersPage.tsx` başında `TeachersPageHead` import'unu kaldır, şunları ekle:

Kaldır:
```tsx
import { TeachersPageHead } from "./components/TeachersPageHead";
```
Ekle:
```tsx
import { RotateCcw, FileText, UserPlus } from "lucide-react";
import { PageHeader } from "../../../shared/components/PageHeader";
import { DebtBadge } from "../../../shared/components/DebtBadge";
```
> Not: `DebtBadge` zaten TeachersPage'de import'lu olabilir; ikon import'ları için TeachersPage'de mevcut bir `lucide-react` satırı varsa oraya ekle (çift import satırı oluşturma). Önce `grep -n "lucide-react\|DebtBadge" src/portals/admin/teachers/TeachersPage.tsx` ile kontrol et.

- [ ] **Step 2: `<TeachersPageHead .../>` çağrısını değiştir**

Şu blok:
```tsx
        <TeachersPageHead
          totalCount={statsQuery.data?.total ?? totalCount}
          onExport={handleExport}
          exporting={exporting}
          onNew={() => setShowHire(true)}
          onCopySeason={() => copySeason.mutate(undefined)}
          copyingSeason={copySeason.isPending}
        />
```
şununla değiştirilir:
```tsx
        <PageHeader
          breadcrumb={[
            { label: t("breadcrumb.school") },
            { label: t("breadcrumb.teachers") },
          ]}
          title={t("title")}
          subtitle={t("subtitle", { count: statsQuery.data?.total ?? totalCount })}
          actions={
            <>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => copySeason.mutate(undefined)}
                disabled={copySeason.isPending}
              >
                <RotateCcw size={17} /> {t("actions.copySeason")} <DebtBadge small />
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleExport}
                disabled={exporting}
              >
                <FileText size={17} /> {t("actions.export")}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowHire(true)}
              >
                <UserPlus size={18} strokeWidth={2.2} /> {t("actions.new")}
              </button>
            </>
          }
        />
```
> `t` `useTranslation("teachers")` olmalı. `grep -n "useTranslation" src/portals/admin/teachers/TeachersPage.tsx` ile doğrula; yoksa `const { t } = useTranslation("teachers");` ekle.

- [ ] **Step 3: Eski component'i sil**

```bash
git rm src/portals/admin/teachers/components/TeachersPageHead.tsx
```

- [ ] **Step 4: Build + test**

Run: `npm run build && npm run test -- src/portals/admin/teachers`
Expected: build başarılı; mevcut teachers testleri PASS.

- [ ] **Step 5: Commit**

```bash
git add src/portals/admin/teachers/TeachersPage.tsx
git commit -m "2026-06-11 refactor: Öğretmenler ekranı paylaşımlı PageHeader'a geçirildi."
```

---

## Task 4: Kullanıcılar ekranını PageHeader'a geçir

**Files:**
- Modify: `oksis-web/src/portals/admin/users/UsersPage.tsx`
- Delete: `oksis-web/src/portals/admin/users/components/UsersPageHead.tsx`

- [ ] **Step 1: Import'ları güncelle**

`UsersPage.tsx` başında `UsersPageHead` import'unu kaldır, şunları ekle:

Kaldır:
```tsx
import { UsersPageHead } from "./components/UsersPageHead";
```
Ekle:
```tsx
import { FileText, UserPlus } from "lucide-react";
import { PageHeader } from "../../../shared/components/PageHeader";
```
> `grep -n "lucide-react" src/portals/admin/users/UsersPage.tsx` ile mevcut bir lucide import satırı varsa ikonları oraya ekle.

- [ ] **Step 2: `<UsersPageHead .../>` çağrısını değiştir**

Şu satır:
```tsx
        <UsersPageHead onExport={onExport} onNew={() => setModal({ kind: "invite" })} exporting={exporting} />
```
şununla değiştirilir:
```tsx
        <PageHeader
          breadcrumb={[
            { label: t("breadcrumb.system") },
            { label: t("breadcrumb.usersShort") },
          ]}
          title={t("screen.title")}
          subtitle={t("screen.subtitle")}
          actions={
            <>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={onExport}
                disabled={exporting}
              >
                <FileText size={17} /> {t("actions.export")}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setModal({ kind: "invite" })}
              >
                <UserPlus size={18} strokeWidth={2.2} /> {t("actions.create")}
              </button>
            </>
          }
        />
```
> `t` `useTranslation("users")` olmalı. `grep -n "useTranslation" src/portals/admin/users/UsersPage.tsx` ile doğrula; yoksa `const { t } = useTranslation("users");` ekle.

- [ ] **Step 3: Eski component'i sil**

```bash
git rm src/portals/admin/users/components/UsersPageHead.tsx
```

- [ ] **Step 4: Build + test**

Run: `npm run build && npm run test -- src/portals/admin/users`
Expected: build başarılı; mevcut users testleri PASS.

- [ ] **Step 5: Tüm test paketini bir kez çalıştır**

Run: `npm run test`
Expected: tüm paket yeşil (silinen `*PageHead` componentlerine referans kalmadığını da doğrular).

- [ ] **Step 6: Commit**

```bash
git add src/portals/admin/users/UsersPage.tsx
git commit -m "2026-06-11 refactor: Kullanıcılar ekranı paylaşımlı PageHeader'a geçirildi."
```

---

## Doğrulama (plan sonu)

- [ ] `npm run build` yeşil.
- [ ] `npm run test` yeşil.
- [ ] `grep -rn "PageHead" src/portals/admin` yalnızca Parents (`ParentsPageHead`) referansını döndürür — diğer üçü silinmiş.
- [ ] `npm run dev` ile görsel kontrol: Öğrenciler / Öğretmenler / Kullanıcılar header'ları öncekiyle birebir aynı; Öğrenciler'de sezon seçici başlığın sağında doğru konumda.

## Kapsam dışı (sonraki tur — bu planda YOK)

- Kalan 7 ekran (Gösterge Paneli, Akademik Takvim, Veliler, Sezon Yönetimi, Roller, Ayarlar, Sınıflar) migrasyonu.
- Eski `app/layouts/PageHeader.tsx` ve inline header'ların kaldırılması.
- `.stu .page-head` CSS'inin students.css'ten silinmesi (Veliler hâlâ kullanıyor).
- Paylaşımlı `.btn` / Button componenti.
