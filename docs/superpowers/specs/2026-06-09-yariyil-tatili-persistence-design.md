# Yarıyıl Tatili Kalıcılaştırma (DebtBadge Kapatma) — Tasarım Dokümanı

> **Tarih:** 2026-06-09 · **Modül:** academic-sessions (api + web)
> **Rol:** School_Admin · **Bağlam:** Sezon Açılış Sihirbazı — Dönem Geçişi (Step 2)
> **İlgili kurallar:** `business-rules.md` BR-AS-004, `domain-model.md` (AcademicTerm/AcademicSession), CLAUDE.md Absolute Rule #6

---

## 1. Problem

Sihirbazın "Dönem Geçişi" adımındaki **Yarıyıl Tatili** satırı şu an:
- **türetilmiş** (1. dönem bitişi +1 gün → 2. dönem başlangıcı −1 gün),
- **salt-okunur** (kullanıcı düzenleyemez),
- **kaydedilmiyor** (backend dönem yapısı yalnızca T1/T2 saklar).

Bu durum bir `DebtBadge` ("D" rozeti) ile işaretli (teknik borç). Borcu kapatmak =
yarıyıl tatilini **düzenlenebilir + kalıcı** yapmak.

## 2. Spec uyumu (kritik)

İlk akla gelen "3. AcademicTerm" yaklaşımı **bağlayıcı maddelerle çelişir** (Absolute Rule #6):
- `domain-model.md` → `AcademicTerm` invariant: *"(AcademicSessionId, TermTypeId) unique — bir sezonda T1 ve T2 birer kez."*
- `domain-model.md` → `AcademicSession.Create(...)` *"iki AcademicTerm otomatik oluşturur (T1, T2)."*
- `business-rules.md` BR-AS-004: *"Term1.EndDate < Term2.StartDate (T1 ve T2 arası **tatil olabilir**, ama çakışmazlar)"* — yarıyıl tatili modelde **iki dönem arasındaki boşluk**.

**Spec-uyumlu çözüm:** Tatili bir **`Holiday`** (canlı tenant tatil entity'si) olarak,
yeni bir **`SemesterBreak`** türüyle sakla. 2-dönem modeli korunur.

## 3. Mevcut durum (envanter)

| Yapı | Durum |
|---|---|
| Canlı tatil entity'si `Holiday` (`Modules/Schools`), `DbSet<Holiday>`, `AcademicSessionId`, `HolidayType` | ✅ Var |
| `Schools.Enums.HolidayType` değerleri: `PublicHoliday, SchoolEvent, ClosedDay` | ⚠️ `SemesterBreak` **yok** |
| `HolidayType` EF saklama: `HasConversion<string>()` | ✅ String → **enum değeri eklemek migration gerektirmez** |
| `GetSchoolHolidaysForSession` `db.Holidays`'i sezona göre döndürür | ✅ Var (okuma yolu hazır) |
| `OpenSeasonFromDraftCommandHandler:236` tatil yazımı | ❌ TODO Task 8 — **hiç tatil yazmıyor** |
| Kullanılmayan ikiz `SchoolHoliday` entity + `AcademicSessions.Enums.HolidayType(SemesterBreak=3)` | ⚠️ Dormant — **dokunulmaz** (ayrı temizlik) |
| Frontend `HolidayType` union | `'PublicHoliday' \| 'SchoolEvent' \| 'ClosedDay'` — `SemesterBreak` eklenecek |

## 4. Kapsam

**Dahil:** Yarıyıl tatilinin uçtan uca düzenlenebilir + kalıcı hâle gelmesi
(enum + sihirbaz formu + draft + OpenSeasonFromDraft persist + DebtBadge kaldırma).

**Dahil değil (YAGNI):**
- Genel okul tatili kopyalama (OpenSeasonFromDraft Task 8 TODO'su) — yalnızca yarıyıl
  tatili ele alınır; genel kopya ayrı iş.
- Dormant `SchoolHoliday` entity / `AcademicSessions.Enums.HolidayType` temizliği.

## 5. Backend tasarımı (oksis-api)

### 5.1 Enum
`src/Oksis.Domain/Modules/Schools/Enums/HolidayType.cs` → `SemesterBreak` değeri eklenir
(en sona; string saklandığı için sıra/numara önemsiz, mevcut satırlar etkilenmez).

### 5.2 `OpenSeasonFromDraftCommandHandler`
- İç `TermDates` record'una `DateOnly? BreakStart`, `DateOnly? BreakEnd` eklenir
  (termDatesJson'dan `PropertyNameCaseInsensitive` ile parse).
- Sezon `AcademicSession.Create(...)` ile oluşturulduktan sonra, break tarihleri **ikisi de doluysa**:
  - **Doğrulama** (cross-aggregate, handler'da): `T1End < BreakStart` ve `BreakStart ≤ BreakEnd`
    ve `BreakEnd < T2Start`. İhlalde `Result<Guid>.Failure(new Error("academic-sessions.errors.break-invalid", "..."))` (sezon yaratılmaz; transaction geri alınır).
  - `Holiday.Create(schoolId, session.Id, "Yarıyıl Tatili", BreakStart.Value, BreakEnd.Value,
    HolidayType.SemesterBreak, isRecurring: false, description: null)` → `db.Holidays.Add(...)`.
- Satır 236 yorum bloğu güncellenir: yarıyıl tatili artık yazılıyor; genel tatil kopyalama TODO olarak kalır.
- Break tarihleri yoksa (örn. eski taslak) sessizce atlanır (opsiyonel — geriye dönük uyum).

### 5.3 Backend testleri (Infrastructure.IntegrationTests)
- `OpenSeasonFromDraft_CreatesSemesterBreakHoliday`: termDatesJson'da geçerli break olan taslak
  → yeni sezona bağlı, `HolidayType.SemesterBreak`, doğru tarihli tek `Holiday` üretilir.
- `OpenSeasonFromDraft_RejectsBreakOutsideTerms`: `BreakEnd ≥ T2Start` (veya `BreakStart ≤ T1End`)
  → Failure; sezon ve holiday yaratılmaz.
- (Mevcut OpenSeasonFromDraft testleri regresyon olarak yeşil kalmalı.)

## 6. Frontend tasarımı (oksis-web)

### 6.1 `seasonWizardSchema`
- `terms` objesine `breakStart: isoDate`, `breakEnd: isoDate` eklenir.
- `terms` üzerinde `superRefine`: sınır alanları (`t1End`, `t2Start`, `breakStart`, `breakEnd`)
  dolu ve geçerli ISO ise: `t1End < breakStart`, `breakStart ≤ breakEnd`, `breakEnd < t2Start`
  zorunlu. İhlalde `ctx.addIssue({ path: ['breakStart'], message: 'wizard.errors.break-range' })`.
  Boş/eksik alanlarda atla (zaten ayrı isoDate hataları yakalar).
- `toSaveDraftInput`: `TermDatesJsonShape`'e `BreakStart`, `BreakEnd` eklenir; form değerlerinden doldurulur.
- `fromDraftDto`: `td.BreakStart ?? ''`, `td.BreakEnd ?? ''` okunur.

### 6.2 `StepTerms`
- Yarıyıl Tatili satırındaki iki input artık `register('terms.breakStart')` / `register('terms.breakEnd')`
  ile forma bağlı, **editable** (`disabled`/`readOnly` ve türetilmiş `breakStart`/`breakEnd` hesabı kaldırılır).
- **`DebtBadge` importu ve kullanımı kaldırılır.**
- **Default türetme:** mevcut copy-fill effect'ine eklenir — kopyalama ON ve t1/t2 doldurulduğunda
  `terms.breakStart = addDays(t1End, 1)`, `terms.breakEnd = addDays(t2Start, -1)`. Kopyalama OFF iken
  (mevcut temizleme kuralı) break de temizlenir (`''`).
- Break input'ları altında hata gösterimi (mevcut name-hatası deseniyle aynı: kırmızı kenarlık + `text-xs text-[#991B1B]`),
  `formState.errors.terms?.breakStart?.message` üzerinden.
- 3px köşeli yeşil nokta korunur.

### 6.3 `types/index.ts`
`HolidayType` union'ına `'SemesterBreak'` eklenir.

### 6.4 i18n
`wizard.errors.break-range` (tr + en):
- tr: "Yarıyıl tatili 1. dönem bitişi ile 2. dönem başlangıcı arasında olmalı."
- en: "The mid-term break must fall between the end of term 1 and the start of term 2."

### 6.5 Frontend testleri (vitest)
- `seasonWizardSchema.test`: geçerli break; sınır-dışı break → `break-range`; sınırda
  (`breakStart = t1End+1`, `breakEnd = t2Start-1`) geçerli; draft round-trip break taşır
  (`toSaveDraftInput` ↔ `fromDraftDto`).
- `StepTerms.test`: kopyalama ON → break otomatik türetilir (input değerleri dolu); kopyalama OFF
  → break boş; `DebtBadge` (D rozeti) render edilmez.

## 7. Veri akışı

```
StepTerms break input'ları
  → form terms.breakStart / breakEnd
  → Taslağı Kaydet: toSaveDraftInput → termDatesJson { …, BreakStart, BreakEnd } → SeasonDraft
  → Sezonu Aç: OpenSeasonFromDraft → termDatesJson parse → Holiday.Create(SemesterBreak, yeni sezon) → db.Holidays
  → GetSchoolHolidaysForSession → takvim/liste
Taslağa devam: fromDraftDto → break geri yüklenir.
```

## 8. Dokümantasyon güncellemeleri

- `business-rules.md` BR-AS-004: yarıyıl tatilinin `Holiday(SemesterBreak)` olarak kalıcılaştığı notu.
- `domain-model.md`: `HolidayType` enum'una `SemesterBreak` eklendiği notu (canlı `Holiday` entity'si).
- `completion_status.md`: "Yarıyıl tatili DebtBadge borcu kapatıldı (Holiday(SemesterBreak) persist)" — çözülen borç olarak (Spec Dışı değil).

## 9. Açık sorular

Yok. Dormant `SchoolHoliday`/`AcademicSessions.Enums.HolidayType` temizliği bilinçli olarak kapsam dışı.
