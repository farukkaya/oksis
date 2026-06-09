# Resmi Tatil Tarih-Aralığı Endpoint'i (Tatiller DebtBadge Kapatma) — Tasarım Dokümanı

> **Tarih:** 2026-06-09 · **Modül:** academic-sessions (api + web)
> **Rol:** School_Admin · **Bağlam:** Sezon Açılış Sihirbazı — Tatiller (Step 4)
> **İlgili:** `GetSchoolHolidaysForSession`, `OfficialHoliday` master entity

---

## 1. Problem

Sihirbazın "Tatiller" adımındaki **resmi tatiller** bölümü, gerçek veriyi değil
i18n'deki **sabit mock liste**yi (`wizard.steps.holidays.official-list`) gösteriyor ve
bir `DebtBadge` taşıyor (reason: `official-debt-reason`, "backend'de henüz üretilmiyor").

Bu yorum **eskimiş**: backend resmi tatilleri zaten üretiyor —
- `OfficialHoliday` master entity (ulusal sabit tarihli tatiller: `Name + Month + Day`),
  master'da seed'li (6 kayıt).
- `GetSchoolHolidaysForSession`, her resmi tatil için sezon yıl aralığındaki gerçek
  `DateOnly`'yi üretip aralığa düşenleri `source="OFFICIAL"` olarak döndürüyor.

**Borcu kapatmak** = StepHolidays'i gerçek resmi tatil verisine bağlamak.

## 2. Engel ve çözüm

Mevcut endpoint (`GET /school-holidays?sessionId=`) bir **sessionId** ister; sihirbazdaki
**yeni sezon henüz yok** (taslak). Ancak resmi tatiller yalnızca **tarih aralığına** bağlı
(sabit ay/gün) ve yeni sezonun aralığı (`sessionStart..sessionEnd`) Step 2'den formda mevcut.

**Çözüm:** Tarih-aralığı bazlı bir resmi-tatil endpoint'i ekle; StepHolidays formdaki
sezon tarihleriyle çağırsın. **Sadece gösterim** — persistence yok: yeni sezon açılınca
`GetSchoolHolidaysForSession` aynı resmi tatilleri zaten otomatik üretir.

## 3. Mevcut durum (envanter)

| Yapı | Durum |
|---|---|
| `OfficialHoliday` master entity (`Name/Month/Day/IsAnnual/...`) | ✅ Var (`Modules/Academics`) |
| `master.official_holidays` seed | ✅ 6 kayıt |
| Resmi-tatil çözümleme (Month/Day → yıl aralığı → DateOnly → filtre) | ✅ `GetSchoolHolidaysForSession` içinde **gömülü** |
| `HolidayCalendarDto (Id, Name, StartDate, EndDate, Type, IsRecurring, Source)` | ✅ Var |
| Tarih-aralığı bazlı resmi-tatil query/endpoint | ❌ Yok — bu iş |
| `StepHolidays` resmi tatil kaynağı | ❌ i18n mock liste + DebtBadge |

## 4. Kapsam

**Dahil:** Tarih-aralığı resmi-tatil query/endpoint + çözümleme helper'ının ortaklaştırılması;
StepHolidays'in gerçek veriye bağlanması + DebtBadge/mock kaldırma.

**Dahil değil (YAGNI):** Resmi tatillerin sezona persist edilmesi (gerekmez — read'de türetilir);
okul tatili (tenant) kopyalama akışı (ayrı, mevcut); resmi tatil CRUD.

## 5. Backend tasarımı (oksis-api)

### 5.1 Ortak çözümleme helper'ı
`Modules/AcademicSessions/Shared/OfficialHolidayResolver.cs` (yeni) — **saf, DB-bağımsız** static:
```
static List<HolidayCalendarDto> ResolveForRange(
    IReadOnlyList<(string Name, int Month, int Day)> official,
    DateOnly start, DateOnly end)
```
Mantık (mevcut handler'dan taşınır): her tatil için `start.Year..end.Year` döngüsü,
`DateOnly.TryParse($"{year:0000}-{Month:00}-{Day:00}")` (geçersiz tarih atlanır — örn. artık
olmayan 29 Şubat), `start..end` filtresi, `new HolidayCalendarDto(null, Name, date, date,
"PublicHoliday", true, "OFFICIAL")`.

### 5.2 Mevcut handler refactor
`GetSchoolHolidaysForSessionQueryHandler`: gömülü resmi-tatil bloğu, master'dan `(Name,Month,Day)`
çekip `OfficialHolidayResolver.ResolveForRange(..., session.StartDate, session.EndDate)` çağrısıyla
değiştirilir. Davranış **birebir aynı** (regresyon testleriyle korunur).

### 5.3 Yeni query + endpoint
- `Queries/GetOfficialHolidaysInRange/GetOfficialHolidaysInRangeQuery(DateOnly Start, DateOnly End)`
  + handler: master `OfficialHolidays`'tan `(Name,Month,Day)` çekip helper'ı çağırır,
  `HolidayCalendarDto[]` (StartDate sıralı, hepsi `OFFICIAL`) döner.
- **Doğrulama:** `Start <= End` değilse `Failure("academic-sessions.errors.invalid-range")`
  (handler guard; geniş-aralık koruması YAGNI).
- **Endpoint:** yeni `OfficialHolidaysController` (`[Route("api/v1/official-holidays")]`),
  `[HttpGet("")]` `?start=YYYY-MM-DD&end=YYYY-MM-DD` (DateOnly model binding),
  `[RequirePermission(...ACADEMIC_SESSIONS_VIEW)]` (tüketici sihirbazla aynı yetki).
  Yanıt zarfı `ApiResponse<HolidayCalendarDto[]>`.

### 5.4 Backend testleri
- **UnitTests (saf helper):** yıl-sınırı aşan aralık (2026-09-15 → 2027-06-13) → 2026 ve 2027'deki
  tatiller doğru tarihle üretilir, aralık-dışı elenir; geçersiz tarih atlanır.
- **IntegrationTests:** `GetOfficialHolidaysInRange` master seed'ten beklenen sayıda OFFICIAL döndürür;
  `Start > End` → Failure. Mevcut `GetSchoolHolidaysForSession` testleri (varsa) yeşil kalır.

## 6. Frontend tasarımı (oksis-web)

### 6.1 API + hook
- `academicSessionsApi.officialHolidays(start: string, end: string): Promise<HolidayCalendarDto[]>`
  → `GET /official-holidays?start=&end=` (envelope unwrap).
- `useOfficialHolidaysQuery(start?: string, end?: string)` — `enabled: !!start && !!end`,
  tenant-scoped query key.
- TS tip: `HolidayCalendarDto` (`{ id: string|null; name; startDate; endDate; type; isRecurring; source }`)
  `types/index.ts`'e eklenir (yoksa).

### 6.2 StepHolidays
- `sessionStart`/`sessionEnd`'i `useWatch` ile oku; `useOfficialHolidaysQuery(sessionStart, sessionEnd)`.
- Resmi tatil çiplerini **gerçek veriden** render et (ad + `dayjs(date).format('D MMM YYYY')`),
  mevcut yeşil-nokta çip stili korunur; "Otomatik eklendi" rozeti kalır.
- **`DebtBadge` importu + kullanımı kaldırılır**; mock `official-list` ve `official-debt-reason`
  i18n anahtarları artık kullanılmaz (anahtarlar silinebilir veya bırakılabilir — kullanım kaldırılır).
- `sessionStart/sessionEnd` boşsa: kısa bilgi notu ("önce dönem tarihlerini belirleyin"); query disabled.
- Query hata/boş: sessiz boş + opsiyonel küçük hata notu.

### 6.3 Frontend testleri (vitest)
- `StepHolidays`: MSW official-holidays döndürür → gerçek tatil adları render; **DebtBadge yok**.
- `sessionStart` boşken: query çağrılmaz, bilgi notu görünür.

## 7. Veri akışı

```
StepHolidays → form sessionStart/sessionEnd (Step 2)
  → useOfficialHolidaysQuery(start, end)  [enabled iff ikisi dolu]
  → GET /official-holidays?start&end
  → GetOfficialHolidaysInRange → OfficialHolidayResolver.ResolveForRange
  → HolidayCalendarDto[] (OFFICIAL) → çipler
Yeni sezon açılınca: GetSchoolHolidaysForSession aynı helper'la resmi tatilleri üretir (ekstra iş yok).
```

## 8. Dokümantasyon

- `academic-years/api-contracts.md`: yeni `GET /official-holidays?start&end` endpoint'i.
- `academic-years/completion_status.md`: "Tatiller resmi-tatil DebtBadge borcu kapatıldı —
  tarih-aralığı endpoint + StepHolidays gerçek veriye bağlandı" (çözülen borç, spec dışı değil).

## 9. Açık sorular

Yok. İzin `ACADEMIC_SESSIONS_VIEW` olarak sabitlendi; persistence kapsam dışı.
