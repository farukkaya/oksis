# School Settings — Open Questions

Modülün açık kalan, sonradan karara/eyleme bağlanması gereken konuları.

---

## Test Borcu — Query Hook'ları (Issue #26)

**Durum:** ✅ Hook'lar yazıldı (commit `8f18255`), ❗ testler ertelendi.

Issue #26'nın **Acceptance Criteria** listesinde test maddesi yer almıyordu;
ancak **Test Requirements** advisory bölümünde aşağıdaki testler isteniyor:

1. `api.get` çağrılarını MSW (Mock Service Worker) handler'ı ile mock'la.
2. `useSchoolSettings` döndüğünde `SchoolSettingsDto` şekline uyumu doğrula.
3. `useHolidays(2026)` çağrısının `?year=2026` query string'ini gönderdiğini
   doğrula.

**Erteleme gerekçesi:**
- Projede henüz Vitest + MSW test altyapısı kurulu değil.
- Tek bir hook için altyapı kurmak scope'u şişiriyor; daha verimli yol, modül
  içindeki tüm hook'lar (queries + mutations) yazıldıktan sonra toplu bir
  "test setup + ilk testler" sprint'i açmak.

**Eylem maddesi (gelecek):**
- [ ] Vitest + `@testing-library/react` + MSW kurulumu.
- [ ] `school-settings.queries.test.ts` — 3 test (#26).
- [ ] `school-settings.mutations.test.ts` — mutation hook'ları (#27, #28).
- [ ] Zod şema unit testleri (#30):
  - `bellScheduleSchema.safeParse({ startTime: "09:00", endTime: "08:00", ... })` → `endTime` üzerinde hata.
  - `holidaySchema.safeParse({ holidayDate: "2026-01-05", endDate: "2026-01-01", ... })` → `endDate` üzerinde hata.
  - `notificationConfigSchema.safeParse({ absenceWarningThreshold: 10, absenceCriticalThreshold: 5, ... })` → `absenceCriticalThreshold` üzerinde hata.
- [ ] `SchoolSettingsTabs` component testi (#32):
  - Mock tab listesi ile render.
  - "Zil Programı" tab tıklaması → `/admin/settings/bell-schedule` navigasyonu.
  - Location'a göre doğru tab'ın `aria-current="page"` aldığını doğrula.
- [ ] `BasicInfoSection` form testleri (#33):
  - Valid `data` prop ile render.
  - Boş `name` ile submit → required validation hatası.
  - Küçük harfli `code` ile submit → regex hatası.
  - Numeric olmayan `taxNumber` → regex hatası.
  - Valid form submit → `useUpdateBasicInfo` doğru payload ile çağrılır.
  - Mutation success → toast tetiklenir.
- [ ] `ContactInfoSection` form testleri (#34):
  - Valid `data.contactInfo` prop ile render → alanlar doluyor.
  - Geçersiz email → email format hatası.
  - Geçersiz URL → URL format hatası.
  - Valid form submit → `useUpdateContactInfo` doğru payload ile çağrılır
    (boş input'lar `null` olarak gönderilir).
  - Mutation success → toast tetiklenir.
- [ ] `ColorPickerField` + `ThemeSection` testleri (#35):
  - `ColorPickerField` `value="#2563eb"` ile render → swatch ve text input
    bu değeri yansıtıyor.
  - Text input'a `#ZZZZZZ` yaz → Zod regex hatası alanın altında görünür.
  - Text input'a `#ff0000` yaz → swatch kırmızıya döner.
  - Valid `ThemeSection` submit → `useUpdateTheme` mutation çağrılır.
  - Mutation success → toast tetiklenir.
- [ ] `LogoUploadCard` testleri (#36):
  - `currentUrl=null` ile render → drop zone + placeholder görünür.
  - `currentUrl="https://.../logo.png"` ile render → preview img + remove
    butonu görünür.
  - 2 MB üzeri dosya drop → error toast tetiklenir, `useUploadLogo` çağrılmaz.
  - Geçersiz MIME (örn. `application/pdf`) drop → error toast, mutation yok.
  - Geçerli PNG drop → `useUploadLogo` `File` payload ile çağrılır.
  - Remove butonu tıklama → `useDeleteLogo` çağrılır.
  - Upload sırasında `Skeleton` overlay görünür (spinner değil).
- [ ] `GeneralSettingsTab` montaj testleri (#37):
  - `useSchoolSettings` pending → `SettingsSkeleton` görünür.
  - `useSchoolSettings` fail → hata kartı + "Tekrar Dene" butonu görünür.
  - Retry butonu tıklama → `refetch` çağrılır.
  - Data yüklendiğinde Basic + Contact + Theme bölümleri sıralı render edilir.
  - Tema bölümü içinde `LogoUploadCard` `currentUrl={data.theme.logoUrl}`
    ile render edilir.
- [ ] `AcademicStructureTab` testleri (#38):
  - Skeleton (pending) ve error+retry kartı render.
  - Dropdown'lar i18n label'larıyla doluyor.
  - `weeklyLessonCount: 0` ile submit → Zod validation hatası.
  - Valid submit → `useUpdateAcademicStructure` çağrılır, toast tetiklenir.

**Referans:**
- Issue'ler: #26, #27, #28, #30, #32, #33, #34, #35, #36, #37, #38
- Genel test stratejisi: `.claude/docs/testing-rules.md`

---

## i18n Borcu — KAPATILDI (Issue #31)

**Durum:** ✅ Çözüldü. `react-i18next` + `i18next` projeye eklendi, modül
namespace'i kayıt edildi, mutation hook toast'ları `t(key)` çağrısına geçti.

**Kapatma detayı:**
- `src/shared/i18n/index.ts` bootstrap'i `tr` (varsayılan) ve `en`
  locale'lerini birlikte kayıt ediyor. Issue out-of-scope listesinde EN
  vardı, ancak kapsamı bu sprint'te tamamlayalım kararıyla EN locale de
  bu issue altında oluşturuldu.
- `src/shared/i18n/locales/tr/school-settings.json` ve
  `src/shared/i18n/locales/en/school-settings.json` namespace dosyaları
  oluşturuldu.
- `main.tsx` içinden side-effect import (`import './shared/i18n'`) ile
  init tetikleniyor.
- Mutation hook'ları `useTranslation('school-settings')` üzerinden tüm
  toast mesajlarını key ile çağırıyor; örn. `t('basic-info.save-success')`,
  `t('errors.save-failed')`.
- Şema hata mesajları (`school-settings.errors.*`) form layer'da
  `t(error.message)` ile tüketilmek üzere zaten key formatında; ilgili
  form/component issue'larında bağlanacak.

**Açık kalan ufak iş (form/component issue'larında ele alınacak):**
- Form'lar Zod hata `message` alanını `t()` ile çevirmeli — bu modülün
  form component'leri yazıldığında (sonraki issue'ler) doğal olarak gelecek.
- Proje genelinde diğer modüllerde (örn. AnnouncementsList) kalan
  hardcoded TR string'ler için ayrı bir sweep ticket'ı gerekiyor.

**Referans:**
- Issue: https://github.com/farukkaya/oksis-web/issues/31
