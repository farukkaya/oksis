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

## Commit Requirement (ZORUNLU)

> ?? Bu b�l�m her generated issue'da **aynen** yer almak zorundadir. Issue tamamlandiginda **ayri bir commit** atilmadik�a issue "Done" sayilmaz.

- [ ] Issue tamamlandiginda **yalnizca bu issue'a ait dosyalar** stage edilir (`git add <path>`); baska issue'larin degisiklikleri ayni commit'e karismaz.
- [ ] Commit, **OKSIS commit kuralina** uygun formatta atilir: `YYYY-MM-DD <type>[,type]: T�rk�e �zet.` � kanonik kural `.claude/docs/git-commit-rules.md`.
- [ ] Issue-linked commit prefix'i kullanilir: `Issue #<no> YYYY-MM-DD <type>: ...` (issue numarasi `gh issue list` veya dosya adindan alinir, �r. `issue-7.md` ? `Issue #7`).
- [ ] Commit **dogru repoda** atilir: API issue'lari ? `oksis-api`, web issue'lari ? `oksis-web`, mobile issue'lari ? `oksis-mobile`. Workspace root (`oksis/`) repo'sunda **kod commit'i atilmaz**.
- [ ] Husky `commit-msg` hook (`oksis-api`) formati zorlar; `--no-verify` **YASAK**. Hook fail olursa root cause'u d�zelt, sonra yeniden commit at � `--amend` ile ge�mis commit'i degistirme; yeni commit at.
- [ ] **Bir issue = bir commit**. Ayni issue i�inde test + implementation ayni commit'e girer (type: `feat,test`). Birden fazla issue tek commit'e birlestirilmez; "mod�l� bitirince hepsini tek commit yapayim" yaklasimi YASAK.
- [ ] Commit mesajinin body'sinde (opsiyonel) Acceptance Criteria'dan tamamlanan kalemler madde madde �zetlenebilir; uzun a�iklamalar PR description'ina birakilir.

**�rnek (tek issue commit'i):**

```
Issue #7 2026-05-24 feat,test: ChangePasswordCommand ve unit testleri eklendi.

- Mevcut parola BCrypt.Verify ile dogrulanir
- PasswordPolicy.Validate �agrisi yeni parola i�in zorunlu
- Basarili degisimde t�m refresh token'lar revoke edilir
- 3 handler testi + 1 validator testi yesil
```

**Kabul edilmeyen anti-pattern'ler:**

- ? 12 API issue'sunu tek "users mod�l� backend" commit'inde toplamak.
- ? Birden fazla repoya tek bir summary commit atmak.
- ? `update stuff` / `WIP` / T�rk�e olmayan / tarihsiz / nokta'siz mesaj.
- ? `--no-verify` veya hook bypass.
