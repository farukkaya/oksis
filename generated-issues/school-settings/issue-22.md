# WEB-22 — `SchoolSettingsTabs` 10 sekme + URL param + i18n + e2e smoke test

## Description
`SchoolSettingsTabs.tsx` navigasyonunu 9 sekmeden 10 sekmeye genişlet (yeni `policy` sekmesi `structure` ile `bell` arasına). URL search param destekle. Tüm yeni i18n anahtarlarını ekle. End-to-end smoke test yaz.

## Scope
- `oksis-web/src/portals/admin/settings/components/SchoolSettingsTabs.tsx` — güncelleme
- `oksis-web/src/portals/admin/settings/pages/SchoolSettingsPage.tsx` — URL param sync
- `oksis-web/src/shared/i18n/locales/tr/school-settings.json` (veya mevcut konum) — yeni anahtarlar
- `oksis-web/src/portals/admin/settings/__tests__/SchoolSettingsPage.test.tsx` — smoke test

## Implementation

### Tab sırası (10 sekme)

| # | key | label key |
|---|---|---|
| 1 | basic | `tabs.basic` |
| 2 | contact | `tabs.contact` |
| 3 | address | `tabs.address` |
| 4 | theme | `tabs.theme` |
| 5 | structure | `tabs.academic-structure` |
| 6 | **policy** ⭐ | `tabs.academic-policy` |
| 7 | bell | `tabs.bell` |
| 8 | holidays | `tabs.holidays` |
| 9 | modules | `tabs.modules` |
| 10 | notifications | `tabs.notifications` |

> Mevcut tab keys değişmez; sadece `policy` araya eklenir.

### URL sync

```ts
const [searchParams, setSearchParams] = useSearchParams();
const activeTab = searchParams.get('tab') ?? 'basic';
const setActiveTab = (tab: string) => setSearchParams({ tab }, { replace: true });
```

### Yeni i18n anahtarları

`ui-flows.md` § "i18n Key'leri (yeni eklenenler)" tablosundaki tüm anahtarlar:

- `school-settings.tabs.academic-structure`
- `school-settings.tabs.academic-policy`
- `school-settings.grade-levels.title`
- `school-settings.grade-levels.min-one`
- `school-settings.grade-levels.auto-update-confirm`
- `school-settings.policy.grade-scale`
- `school-settings.policy.passing-score`
- `school-settings.policy.level-scales`
- `school-settings.policy.level-scales.default-hint`
- `school-settings.policy.approval-toggle`
- `school-settings.policy.report-card-auto`
- `school-settings.policy.report-card-draft`
- `school-settings.policy.retention`
- `school-settings.policy.retention-warning`
- `school-settings.policy.absence-coming-soon`
- `school-settings.policy.no-scale-info`
- `school-settings.policy.no-grades-info`
- `school-settings.policy.save-success`
- `school-settings.policy.error.scale-out-of-range` (BR-SS-012)
- `common.errors.save-failed` (eğer yoksa)

## Acceptance Criteria
- [ ] `SchoolSettingsTabs` 10 sekme render eder, sıra spec ile birebir
- [ ] `?tab=policy` URL → AcademicPolicyTab aktif
- [ ] Sekme değişimi URL'i `replace: true` ile günceller (geri tuşu hub'a düşer)
- [ ] Tüm yeni i18n anahtarları TR locale dosyasında mevcut
- [ ] Default lang TR olarak çalışır; hardcoded Türkçe string yok
- [ ] Permission gate: kullanıcı `update-academic-policy` permission'ına sahip değilse `policy` sekmesi disabled (UI hint, backend gate'i ISSUE-14)
- [ ] E2E smoke: login → /admin/settings → 10 sekme görünür → policy sekmesine tıkla → form render edilir → field doldur → save → success toast
- [ ] `npm run test` yeşil
- [ ] `npm run build` warnings yok

## Test Requirements
- `SchoolSettingsTabs_Renders10Tabs_InCorrectOrder`
- `SchoolSettingsPage_UrlParam_ActivatesCorrectTab`
- `SchoolSettingsPage_TabChange_UpdatesUrl`
- E2E smoke: `tests/e2e/school-settings.spec.ts` (Playwright veya mevcut e2e setup)

## Out of Scope
- Mobile (kapsam dışı)
- Backend (ISSUE-1..14 bağımlılık)
- DevExtreme custom theming