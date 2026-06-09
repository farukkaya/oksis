# Akademik Takvim Rol Bazlı Ortaklaştırma — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Akademik Takvim ekranını `src/modules/academic-calendar/`'a taşıyıp Öğretmen/Öğrenci/Veli portallerinde salt-okunur, Admin'de tam-yetkili olacak şekilde capability bazlı (`academic-calendar.manage`) rol gating ile dört portalde aç.

**Architecture:** Tek `AcademicCalendarPage` bileşeni dört portal route'undan da render edilir. Yönetim aksiyonları (Etkinlik Ekle, Dışa Aktar, SeasonAxisBar, Sezon Yönetimi yolları, AddEventModal) `canManage = usePermission('academic-calendar.manage')` türev değeriyle koşullanır; `canManage === false` iken DOM'da hiç render edilmez ve takvim aktif sezona sabitlenir. Backend yetki kaynağı değişmez (UI gate UX-only).

**Tech Stack:** React 18 + TypeScript (strict), Vite, React Query v5, React Router v6, Zustand (`authStore`), i18next, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-06-09-akademik-takvim-rol-bazli-design.md`

---

## File Structure

**Taşınacak (git mv ile):** `src/portals/admin/academic-calendar/` → `src/modules/academic-calendar/`
Tüm alt klasörler korunur: `api/`, `components/`, `hooks/`, `keys/`, `lib/`, `pages/`, `schemas/`, `types/`, `__tests__/`, `index.ts`.

**Değiştirilecek (mevcut):**
- `src/modules/academic-calendar/**` — taşıma sonrası relative import düzeltmeleri (Task 1)
- `src/shared/auth/permissions.constants.ts` — yeni `ACADEMIC_CALENDAR_MANAGE` sabiti (Task 2)
- `src/modules/academic-calendar/pages/AcademicCalendarPage.tsx` — rol gating mantığı (Task 3)
- `src/modules/academic-calendar/__tests__/AcademicCalendarPage.test.tsx` — auth setup + yeni gating testleri (Task 3)
- `src/shared/i18n/locales/tr/academic-calendar.json`, `.../en/academic-calendar.json` — `subtitleReadonly` (Task 4)
- `src/app/routes.tsx` — import path + 3 yeni portal route'u (Task 1 + Task 5)
- `src/app/layouts/TeacherLayout.tsx`, `ParentLayout.tsx`, `StudentLayout.tsx` — nav linki (Task 6)

**Workspace docs (oksis repo):**
- `.claude/docs/permission-matrix.md`, `.claude/docs/modules/academic-years/{permissions.md,ui-flows.md,completion_status.md}` (Task 7)

---

## Task 1: Modülü `src/modules/academic-calendar/`'a taşı ve import path'leri düzelt

**Files:**
- Move: `oksis-web/src/portals/admin/academic-calendar/` → `oksis-web/src/modules/academic-calendar/`
- Modify (relative paths): tüm taşınan `.ts`/`.tsx` dosyalar
- Modify: `oksis-web/src/app/routes.tsx:75`

Taşıma `src/portals/admin/academic-calendar/` (4. derinlik) → `src/modules/academic-calendar/` (3. derinlik) olduğundan, modül içindeki dışa dönük relative path'ler bir seviye kısalır. İki desen tüm vakaları kapsar:
- `../../../../` → `../../../` (shared, lib, test'e gidenler)
- `../../academic-sessions` → `../../../portals/admin/academic-sessions` (admin'de kalan academic-sessions'a gidenler)

- [ ] **Step 1: Çalışan testlerin taşımadan ÖNCE yeşil olduğunu doğrula (baseline)**

Run (cwd `oksis-web`): `npm run test -- academic-calendar`
Expected: PASS (mevcut tüm akademik takvim testleri geçer).

- [ ] **Step 2: Klasörü git mv ile taşı**

```bash
cd oksis-web
mkdir -p src/modules
git mv src/portals/admin/academic-calendar src/modules/academic-calendar
```

- [ ] **Step 3: `../../../../` → `../../../` desenini taşınan dosyalarda düzelt**

```bash
cd oksis-web
grep -rl '\.\./\.\./\.\./\.\.' src/modules/academic-calendar | while read -r f; do
  sed -i '' 's#\.\./\.\./\.\./\.\./#../../../#g' "$f"
done
```

- [ ] **Step 4: `../../academic-sessions` → `../../../portals/admin/academic-sessions` desenini düzelt**

```bash
cd oksis-web
grep -rl '\.\./\.\./academic-sessions' src/modules/academic-calendar | while read -r f; do
  sed -i '' 's#\.\./\.\./academic-sessions#../../../portals/admin/academic-sessions#g' "$f"
done
```

- [ ] **Step 5: `routes.tsx` import path'ini güncelle**

`src/app/routes.tsx:75` satırını şuna çevir:

```tsx
// AcademicCalendar modülü — Akademik Takvim sayfası (modules/, 4 portalde paylaşılır)
import { AcademicCalendarPage } from "../modules/academic-calendar";
```

- [ ] **Step 6: Kalan kırık referans var mı kontrol et**

Run (cwd `oksis-web`): `grep -rn "portals/admin/academic-calendar\|\.\./\.\./\.\./\.\./" src/modules/academic-calendar; grep -rn "portals/admin/academic-calendar" src/app`
Expected: Hiç sonuç yok (boş çıktı).

- [ ] **Step 7: Typecheck ve testlerle doğrula**

Run (cwd `oksis-web`): `npx tsc --noEmit && npm run test -- academic-calendar`
Expected: tsc hatasız; tüm akademik takvim testleri PASS (taşıma davranışı değiştirmedi).

- [ ] **Step 8: Commit**

```bash
cd /Users/farukkaya/Projects/oksis/oksis-web
git add -A
git commit -m "$(cat <<'EOF'
2026-06-09 refactor: Akademik Takvim modules/academic-calendar'a taşındı (4 portal ortaklaştırma).

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: `academic-calendar.manage` izin sabitini ekle

**Files:**
- Modify: `oksis-web/src/shared/auth/permissions.constants.ts`

- [ ] **Step 1: PERMISSIONS objesine sabiti ekle**

`permissions.constants.ts` içinde `ACADEMIC_SESSIONS_CLOSE_TERM` satırından hemen sonra, `// Class rooms` yorumundan önce ekle:

```ts
  // Academic calendar — Akademik Takvim ekranında yönetim aksiyonları (etkinlik
  // ekle, dışa aktar, Sezon Yönetimi yolları). Salt-okunur roller bu izne sahip
  // değildir; ekran tüm rollerde görünür ama yönetim aksiyonları gate'lenir.
  ACADEMIC_CALENDAR_MANAGE: 'academic-calendar.manage',
```

- [ ] **Step 2: Typecheck**

Run (cwd `oksis-web`): `npx tsc --noEmit`
Expected: Hatasız.

- [ ] **Step 3: Commit**

```bash
cd /Users/farukkaya/Projects/oksis/oksis-web
git add src/shared/auth/permissions.constants.ts
git commit -m "$(cat <<'EOF'
2026-06-09 feat: academic-calendar.manage izin sabiti eklendi.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Sayfaya capability bazlı rol gating ekle (TDD)

**Files:**
- Modify: `oksis-web/src/modules/academic-calendar/pages/AcademicCalendarPage.tsx`
- Test: `oksis-web/src/modules/academic-calendar/__tests__/AcademicCalendarPage.test.tsx`

Mevcut sayfa her şeyi koşulsuz render ediyor. Hedef: `canManage` türev değeri ile yönetim öğelerini gizle, non-admin'de aktif sezona sabitle.

- [ ] **Step 1: Mevcut testin auth setup'ını manage izniyle güncelle (regression baseline)**

`__tests__/AcademicCalendarPage.test.tsx` içindeki `beforeEach`'te `permissions: []` → admin yetkisini verecek şekilde değiştir. İmportlara `PERMISSIONS`'ı ekle:

```tsx
import { PERMISSIONS } from '../../../shared/auth/permissions.constants';
```

`beforeEach` gövdesi:

```tsx
beforeEach(() => {
  __resetMockCalendar();
  useAuthStore.setState({
    user: { id: 'u1', schoolId: 's1', firstName: 'A', lastName: 'B', email: 'a@b.c', role: 'SchoolAdmin', firstLoginRequired: false, permissions: [PERMISSIONS.ACADEMIC_CALENDAR_MANAGE] },
  } as never);
});
```

- [ ] **Step 2: Salt-okunur (non-admin) davranışı için failing testler ekle**

Aynı dosyanın sonundaki `describe` bloğunun içine ekle. `renderPage` aynen kullanılır; sadece izinsiz kullanıcı state'i kurulur:

```tsx
function setReadonlyUser() {
  useAuthStore.setState({
    user: { id: 'u2', schoolId: 's1', firstName: 'C', lastName: 'D', email: 'c@d.e', role: 'Parent', firstLoginRequired: false, permissions: [] },
  } as never);
}

describe('AcademicCalendarPage — salt-okunur roller', () => {
  it('manage izni yokken Etkinlik Ekle ve Dışa Aktar butonları render edilmez', async () => {
    setReadonlyUser();
    renderPage();
    await waitFor(() => expect(screen.getAllByText('2025–2026').length).toBeGreaterThan(0));
    expect(screen.queryByRole('button', { name: 'Etkinlik Ekle' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Dışa Aktar' })).not.toBeInTheDocument();
  });

  it('manage izni yokken sezon ekseni (SeasonAxisBar) render edilmez', async () => {
    setReadonlyUser();
    renderPage();
    await waitFor(() => expect(screen.getAllByText('2025–2026').length).toBeGreaterThan(0));
    // SeasonAxisBar yalnız admin'de "Sezon Yönetimi" promote butonunu içerir.
    expect(screen.queryByText('Sezon Yönetimi')).not.toBeInTheDocument();
  });

  it('manage izni varken Etkinlik Ekle butonu görünür (regression)', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Etkinlik Ekle' })).toBeInTheDocument());
  });
});
```

- [ ] **Step 3: Testleri çalıştır, kırmızı olduklarını doğrula**

Run (cwd `oksis-web`): `npm run test -- AcademicCalendarPage`
Expected: FAIL — yeni "salt-okunur" testleri başarısız (butonlar/aksiyonlar hâlâ render ediliyor).

- [ ] **Step 4: Sayfaya gating mantığını ekle**

`AcademicCalendarPage.tsx` başına import ekle:

```tsx
import { usePermission } from '../../../shared/hooks/usePermission';
import { PERMISSIONS } from '../../../shared/auth/permissions.constants';
```

`useTranslation`/`useNavigate` satırlarının hemen altına türev değeri ekle:

```tsx
  const canManage = usePermission(PERMISSIONS.ACADEMIC_CALENDAR_MANAGE);
```

`selectedSeasonId` / `currentSeasonId` mantığını non-admin için aktif sezona sabitle. Mevcut:

```tsx
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);
  const currentSeasonId = selectedSeasonId ?? activeSeason?.id;
```

şununla değiştir:

```tsx
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);
  // Salt-okunur rollerde sezon ekseni gizli → daima aktif sezon.
  const currentSeasonId = canManage ? (selectedSeasonId ?? activeSeason?.id) : activeSeason?.id;
```

`readonly` türevini izinle birleştir. Mevcut:

```tsx
  const readonly = currentSeason?.status === 'archive';
```

şununla değiştir:

```tsx
  const readonly = !canManage || currentSeason?.status !== 'active';
```

`draftQuery` yalnız admin'de gereklidir; mevcut `const draftQuery = useSeasonDraftQuery();` satırını koşullu enable'a çevir (hook'un `enabled` opsiyonu varsa onu kullan, yoksa sonucu yalnız `canManage` dalında tüket — Step 6'da SeasonAxisBar zaten yalnız `canManage` ile render edildiği için `draftQuery.data` kullanımı oraya taşınır). Bu task kapsamında basit tutmak için satırı şöyle bırak:

```tsx
  const draftQuery = useSeasonDraftQuery();
```

ve `hasDraft` değeri yalnız `canManage` dalındaki `SeasonAxisBar`'a gider (Step 6).

- [ ] **Step 5: Başlık aksiyon butonlarını `canManage` ile sar**

Mevcut `<div className="flex gap-2">...</div>` bloğunu şununla değiştir:

```tsx
        {canManage && (
          <div className="flex gap-2">
            <button type="button" disabled className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-400">{t('actions.export')}</button>
            <button
              type="button"
              disabled={readonly}
              onClick={() => setModalDate(monthFirstIso)}
              className="rounded-lg bg-[#1B2B5E] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {t('actions.addEvent')}
            </button>
          </div>
        )}
```

- [ ] **Step 6: SeasonAxisBar'ı `canManage` ile sar**

Mevcut bloğu:

```tsx
      {currentSeasonId && (
        <SeasonAxisBar
          seasons={seasons}
          selectedSeasonId={currentSeasonId}
          hasDraft={Boolean(draftQuery.data)}
          onSelect={(id) => { setSelectedSeasonId(id); setView(null); }}
          onManage={goWizard}
        />
      )}
```

şununla değiştir:

```tsx
      {canManage && currentSeasonId && (
        <SeasonAxisBar
          seasons={seasons}
          selectedSeasonId={currentSeasonId}
          hasDraft={Boolean(draftQuery.data)}
          onSelect={(id) => { setSelectedSeasonId(id); setView(null); }}
          onManage={goWizard}
        />
      )}
```

- [ ] **Step 7: AddEventModal'ı `canManage` ile sar**

Mevcut `<AddEventModal ... />` bloğunu şununla değiştir:

```tsx
      {canManage && (
        <AddEventModal
          open={modalDate !== null}
          defaultDate={modalDate ?? monthFirstIso}
          seasonName={currentSeason?.name}
          submitting={addMutation.isPending}
          onSubmit={handleSubmit}
          onClose={() => setModalDate(null)}
        />
      )}
```

- [ ] **Step 8: Alt başlığı `canManage`'e göre türet**

Mevcut alt başlık satırı:

```tsx
          <p className="text-sm text-slate-500">{t('subtitle')}{currentSeason ? ` · ${currentSeason.name}` : ''}</p>
```

şununla değiştir:

```tsx
          <p className="text-sm text-slate-500">{canManage ? t('subtitle') : t('subtitleReadonly')}{currentSeason ? ` · ${currentSeason.name}` : ''}</p>
```

- [ ] **Step 9: Testleri çalıştır, yeşil olduklarını doğrula**

Run (cwd `oksis-web`): `npm run test -- AcademicCalendarPage`
Expected: PASS (hem salt-okunur hem regression testleri).

- [ ] **Step 10: Tüm modül testleri + typecheck**

Run (cwd `oksis-web`): `npx tsc --noEmit && npm run test -- academic-calendar`
Expected: tsc hatasız; tüm testler PASS.

- [ ] **Step 11: Commit**

```bash
cd /Users/farukkaya/Projects/oksis/oksis-web
git add src/modules/academic-calendar/pages/AcademicCalendarPage.tsx src/modules/academic-calendar/__tests__/AcademicCalendarPage.test.tsx
git commit -m "$(cat <<'EOF'
2026-06-09 feat,test: Akademik Takvim capability bazlı rol gating (academic-calendar.manage).

Salt-okunur rollerde Etkinlik Ekle/Dışa Aktar/SeasonAxisBar/AddEventModal render
edilmez; takvim aktif sezona sabitlenir. Regression + salt-okunur testleri eklendi.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: `subtitleReadonly` i18n anahtarını ekle

**Files:**
- Modify: `oksis-web/src/shared/i18n/locales/tr/academic-calendar.json`
- Modify: `oksis-web/src/shared/i18n/locales/en/academic-calendar.json`
- Test: `oksis-web/src/modules/academic-calendar/__tests__/i18n.test.ts`

- [ ] **Step 1: i18n testine subtitleReadonly beklentisi ekle (failing)**

`__tests__/i18n.test.ts` içindeki mevcut anahtar kontrollerinin yanına ekle (dosyadaki mevcut `t('academic-calendar:subtitle')` deseniyle aynı stilde):

```ts
  it('subtitleReadonly anahtarı tanımlı ve subtitle ile aynı değilse', () => {
    const ro = i18n.t('academic-calendar:subtitleReadonly');
    expect(ro).toBe('Eğitim-öğretim yılı etkinlikleri');
  });
```

> Not: i18n.test.ts'in mevcut import/yapısını koru; yalnızca yeni `it` bloğunu uygun `describe` içine ekle. Dosyada `i18n` import'u zaten var (`import { i18n } from '../../../shared/i18n';`).

- [ ] **Step 2: Testi çalıştır, kırmızı olduğunu doğrula**

Run (cwd `oksis-web`): `npm run test -- academic-calendar/__tests__/i18n`
Expected: FAIL — anahtar tanımlı değil (key string'in kendisi döner).

- [ ] **Step 3: TR locale'e anahtarı ekle**

`src/shared/i18n/locales/tr/academic-calendar.json` içinde `"academic-calendar"` objesindeki mevcut `"subtitle"` anahtarının hemen ardına ekle:

```json
    "subtitleReadonly": "Eğitim-öğretim yılı etkinlikleri",
```

(Mevcut `"subtitle"` değeri "Sezon yönetimi ve eğitim-öğretim yılı etkinlikleri" olarak kalır.)

- [ ] **Step 4: EN locale'e anahtarı ekle**

`src/shared/i18n/locales/en/academic-calendar.json` içinde aynı konuma ekle:

```json
    "subtitleReadonly": "Academic year events",
```

- [ ] **Step 5: Testi çalıştır, yeşil olduğunu doğrula**

Run (cwd `oksis-web`): `npm run test -- academic-calendar/__tests__/i18n`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
cd /Users/farukkaya/Projects/oksis/oksis-web
git add src/shared/i18n/locales/tr/academic-calendar.json src/shared/i18n/locales/en/academic-calendar.json src/modules/academic-calendar/__tests__/i18n.test.ts
git commit -m "$(cat <<'EOF'
2026-06-09 feat,test: Akademik Takvim salt-okunur alt başlık i18n anahtarı (subtitleReadonly).

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Üç portal route'unu ekle (teacher / parent / student)

**Files:**
- Modify: `oksis-web/src/app/routes.tsx`

`AcademicCalendarPage` zaten import edilmiş (Task 1, Step 5). Dört portalde de aynı bileşen render edilir. Süperadmin'e eklenmez.

- [ ] **Step 1: Teacher route'unu ekle**

`teacher` portalinin `children` dizisinde, `{ index: true, Component: TeacherDashboard },` satırının hemen ardına ekle:

```tsx
          { path: "academic-calendar", Component: AcademicCalendarPage },
```

- [ ] **Step 2: Parent route'unu ekle**

`parent` portalinin `children` dizisinde, `{ index: true, Component: ParentHome },` satırının hemen ardına ekle:

```tsx
          { path: "academic-calendar", Component: AcademicCalendarPage },
```

- [ ] **Step 3: Student route'unu ekle**

`student` portalinin `children` dizisinde, `{ index: true, Component: StudentHome },` satırının hemen ardına ekle:

```tsx
          { path: "academic-calendar", Component: AcademicCalendarPage },
```

- [ ] **Step 4: Route testleri + typecheck**

Run (cwd `oksis-web`): `npx tsc --noEmit && npm run test -- routes`
Expected: tsc hatasız; route testleri PASS (varsa). Test yoksa yalnız tsc yeterli.

- [ ] **Step 5: Commit**

```bash
cd /Users/farukkaya/Projects/oksis/oksis-web
git add src/app/routes.tsx
git commit -m "$(cat <<'EOF'
2026-06-09 feat: Akademik Takvim teacher/parent/student portal route'ları eklendi.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Üç portal sidebar'ına "Akademik Takvim" linkini ekle

**Files:**
- Modify: `oksis-web/src/app/layouts/TeacherLayout.tsx`
- Modify: `oksis-web/src/app/layouts/ParentLayout.tsx`
- Modify: `oksis-web/src/app/layouts/StudentLayout.tsx`

Link handoff'a göre "Genel" grubunda, ikon `CalendarDays`.

- [ ] **Step 1: TeacherLayout — import + nav linki**

`lucide-react` import satırına `CalendarDays` ekle:

```tsx
import { LayoutDashboard, ClipboardCheck, GraduationCap, FileText, Users, CalendarDays } from "lucide-react";
```

"Genel" grubundaki `items` dizisini şununla değiştir:

```tsx
        items: [
          { label: "Ana Sayfa", icon: LayoutDashboard, href: "/teacher", end: true },
          { label: "Akademik Takvim", icon: CalendarDays, href: "/teacher/academic-calendar" },
        ],
```

- [ ] **Step 2: ParentLayout — import + nav linki**

`lucide-react` import satırına `CalendarDays` ekle:

```tsx
import { Home, GraduationCap, ClipboardCheck, Calendar, FileText, Megaphone, CalendarDays } from "lucide-react";
```

"Genel" grubundaki `items` dizisini şununla değiştir:

```tsx
        items: [
          { label: "Ana Sayfa", icon: Home, href: "/parent", end: true },
          { label: "Akademik Takvim", icon: CalendarDays, href: "/parent/academic-calendar" },
        ],
```

- [ ] **Step 3: StudentLayout — import + nav linki**

`lucide-react` import satırına `CalendarDays` ekle:

```tsx
import { Home, GraduationCap, ClipboardCheck, FileText, Calendar, CalendarDays } from "lucide-react";
```

"Genel" grubundaki `items` dizisini şununla değiştir:

```tsx
        items: [
          { label: "Ana Sayfa", icon: Home, href: "/student", end: true },
          { label: "Akademik Takvim", icon: CalendarDays, href: "/student/academic-calendar" },
        ],
```

- [ ] **Step 4: Typecheck**

Run (cwd `oksis-web`): `npx tsc --noEmit`
Expected: Hatasız.

- [ ] **Step 5: Commit**

```bash
cd /Users/farukkaya/Projects/oksis/oksis-web
git add src/app/layouts/TeacherLayout.tsx src/app/layouts/ParentLayout.tsx src/app/layouts/StudentLayout.tsx
git commit -m "$(cat <<'EOF'
2026-06-09 feat: Akademik Takvim linki teacher/parent/student sidebar'larına eklendi.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Workspace dokümantasyonunu güncelle

**Files (oksis repo, `/Users/farukkaya/Projects/oksis`):**
- Modify: `.claude/docs/permission-matrix.md`
- Modify: `.claude/docs/modules/academic-years/permissions.md`
- Modify: `.claude/docs/modules/academic-years/ui-flows.md`
- Modify: `.claude/docs/modules/academic-years/completion_status.md`

- [ ] **Step 1: `academic-years/permissions.md` — yeni izin satırı**

`## Permission Listesi` tablosunda `academic-sessions.*` bloğunun ardına (uygun konuma) ekle:

```markdown
| `academic-calendar.manage` | Akademik Takvim'de yönetim aksiyonları (etkinlik ekle, dışa aktar, Sezon Yönetimi yolları). Ekran tüm rollerde görünür; bu izin yalnız yönetim öğelerini açar |
```

`## Rol Matrisi` tablosuna satır ekle (`academic-sessions.close-term` satırının ardına):

```markdown
| `academic-calendar.manage` | ✅ | ✅ | ⚙️ | ❌ | ❌ | ❌ | ❌ |
```

`## Davranışsal Notlar` bölümüne ekle:

```markdown
### `academic-calendar.manage` ve salt-okunur roller

Akademik Takvim ekranı **süperadmin hariç tüm rollerde** görünür (Admin + Öğretmen + Öğrenci + Veli). Yönetim aksiyonları (etkinlik ekle, dışa aktar, sezon ekseni, Sezon Yönetimi yolları) yalnız `academic-calendar.manage` iznine sahip rollere açılır; diğer roller takvimi salt-okunur görür ve yalnız **aktif sezonu** görüntüler. UI gizleme UX içindir; backend yetkilendirmesi ayrıca uygulanır (Default Deny).
```

- [ ] **Step 2: `permission-matrix.md` — kanonik matrise satır ekle**

`permission-matrix.md` içindeki ilgili akademik/sezon izin tablosuna `academic-calendar.manage` satırını ekle (academic-sessions satırlarıyla aynı rol kolonları: SchoolAdmin ✅, SchoolStaff ⚙️, diğerleri ❌). Dosyadaki mevcut tablo başlık/kolon düzenine birebir uy.

- [ ] **Step 3: `academic-years/ui-flows.md` — rol bazlı görünürlük notu**

Akademik Takvim akışının olduğu bölüme (yoksa yeni `### Akademik Takvim — Rol Bazlı Görünürlük` başlığı altında) ekle:

```markdown
### Akademik Takvim — Rol Bazlı Görünürlük

- Ekran 4 portalde de görünür (süperadmin hariç): `/admin`, `/teacher`, `/parent`, `/student` → `…/academic-calendar`.
- Tek bileşen (`modules/academic-calendar`) tüm portallerde render edilir.
- `academic-calendar.manage` izni olan (Admin/Müdür, ⚙️ Müd. Yrd.): tam yetki — etkinlik ekle, dışa aktar, sezon ekseni (arşiv/aktif/planlama), Sezon Yönetimi yolları.
- İzni olmayan (Öğretmen/Öğrenci/Veli): salt-okunur; sezon ekseni gizli, yalnız aktif sezon; alt başlık "Eğitim-öğretim yılı etkinlikleri".
```

- [ ] **Step 4: `academic-years/completion_status.md` — güncelle**

`Güncel`/`Last Updated` tarihini `2026-06-09` yap. Akademik Takvim'in rol bazlı ortaklaştırmasını tamamlananlar (✅) bölümüne tek satır ekle:

```markdown
- ✅ Akademik Takvim 4 portalde (süperadmin hariç) salt-okunur açıldı; `modules/academic-calendar`'a taşındı, `academic-calendar.manage` capability gate'i eklendi (2026-06-09).
```

- [ ] **Step 5: Commit (oksis docs repo)**

```bash
cd /Users/farukkaya/Projects/oksis
git add .claude/docs/permission-matrix.md .claude/docs/modules/academic-years/permissions.md .claude/docs/modules/academic-years/ui-flows.md .claude/docs/modules/academic-years/completion_status.md
git commit -m "$(cat <<'EOF'
2026-06-09 docs: academic-calendar.manage izni + Akademik Takvim rol bazlı görünürlük dokümante edildi.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Self-Review Notları (plan doğrulaması)

- **Spec kapsamı:** Kod taşıma (Task 1), capability gating (Task 2+3), non-admin aktif-sezon (Task 3), routing (Task 5), nav (Task 6), i18n subtitle (Task 4), doküman (Task 7) — spec'in 8 bölümü de bir task'a bağlandı. Test bölümü Task 3+4'e gömülü.
- **Tip tutarlılığı:** `canManage` (boolean), `readonly = !canManage || status !== 'active'`, `usePermission(string) → boolean` imzası (mevcut hook overload'una uygun), `PERMISSIONS.ACADEMIC_CALENDAR_MANAGE` tüm task'larda aynı isimle kullanıldı.
- **Bağımlılık sırası:** Task 1 (taşıma) tüm sonraki path'lerin önkoşulu; Task 2 (sabit) Task 3'ten önce. Diğerleri Task 1+2 sonrası bağımsız.
- **Relative path doğrulaması:** Taşıma 4→3 derinlik; `../../../../`→`../../../` ve `../../academic-sessions`→`../../../portals/admin/academic-sessions` iki sed deseni tüm dışa dönük import'ları kapsar (modül içi `../` importlar yapı korunduğu için değişmez). i18n locale'leri `shared/`'da olduğundan taşımadan etkilenmez.
