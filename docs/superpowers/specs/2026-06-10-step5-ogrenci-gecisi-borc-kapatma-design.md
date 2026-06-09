# Step 5 (Öğrenci Geçişi) Borç Kapatma — Tasarım Dokümanı

> **Tarih:** 2026-06-10 · **Modül:** academic-sessions (api + web)
> **Rol:** School_Admin · **Bağlam:** Sezon Açılış Sihirbazı — Öğrenci Geçişi (Step 5)
> **İlgili:** `GetSeasonRolloverPreview`, `SeasonRolloverMapCalculator`, `PromoteStudentsCommandHandler`

---

## 1. Problem

Sihirbazın "Öğrenci Geçişi" adımı (`StepStudents.tsx`) **4 adet `DebtBadge`** taşıyor ve
3 sabit mock sayıya dayanıyor:

```
MOCK_ACTIVE_TOTAL  = 1248   // üst uyarı: "{{active}} aktif öğrenci"
MOCK_PROMOTE_COUNT = 1193   // "terfi edecek" satırı
MOCK_PASSIVE_COUNT = 16     // "pasif öğrencileri hariç tut" satırı
```

DebtBadge gerekçesi (`counts-debt-reason`): *"sihirbaz için canlı öğrenci aggregate ucu
henüz yok"*. Bu **kısmen eskimiş** — Tatiller adımındaki durumla aynı: veri kısmen mevcut.

## 2. Borç ayrıştırması (envanter)

`GetSeasonRolloverPreview` (Step 3'te kullanılan `useRolloverPreviewQuery`) kaynak sezonun
**aktif** öğrencilerini şube bazında zaten sayıyor:
`SeasonRolloverMapCalculator.cs:67` → `StudentCount = c.Students.Count(s => s.LeftAt == null)`,
ve `Summary.GraduatingStudents` veriyor.

| Mock değer | Anlam | Mevcut veriden türetilebilir mi? | Durum |
|---|---|---|---|
| `graduating` (zaten canlı, fallback 55) | mezun olacak | ✅ `summary.graduatingStudents` | Zaten bağlı |
| `MOCK_PROMOTE_COUNT` | terfi edecek | ✅ `rows` `Kind==='Promote'` `studentCount` toplamı | **Sahte borç** → A (frontend) |
| `MOCK_ACTIVE_TOTAL` | toplam aktif | ✅ Promote + Graduate satırları toplamı | **Sahte borç** → A (frontend) |
| `MOCK_PASSIVE_COUNT` | hariç tutulacak pasif | ❌ Preview yalnız `LeftAt == null` (aktif) sayıyor | **Gerçek eksik** → B (backend) |

**Sonuç:** 3 mock sayıdan 2'si rollover preview'de zaten var (sadece okunmuyor); **tek gerçek
backend eksiği pasif öğrenci sayısı.**

## 3. Pasif tanımı (otoriter kaynak)

Sayım, gerçek rollover'ın (`PromoteStudentsCommandHandler.cs:99-107, 122-126`) dışladığıyla
**birebir** olmalı:

> Pasif = kaynak sezonda **aktif kayıtlı** (`ClassRoomStudent.LeftAt == null`) ama ilgili
> `Person.LifecycleState != PersonLifecycleState.Active` olan öğrenciler.
> (Active dışı: Draft, Invited, Suspended, Graduated, Transferred, Archived.)

`ExcludePassive=true` olduğunda bu öğrenciler `skipped` edilir. Önizleme bu sayıyı göstermeli.

## 4. Kapsam

**Dahil (A):** `StepStudents`'in `active` ve `promote` sayılarını `useRolloverPreviewQuery`'den
türetmesi; o iki DebtBadge'in kaldırılması.
**Dahil (B):** Rollover preview özetine `PassiveStudents` alanı eklenmesi (kaynak sezonda
aktif-kayıtlı ∩ non-Active person sayımı); 3. DebtBadge'in kaldırılması; mock'ların silinmesi.

**Dahil değil (YAGNI):** Yeni endpoint (mevcut preview ucu genişletilir); öğrenci listesi/
detay aggregate'i; pasif öğrencilerin kademe-bazında dağılımı; `copy.assignments` (sayı yok,
DebtBadge yok — dokunulmaz).

## 5. Backend tasarımı (oksis-api)

### 5.1 DTO genişletme
`SeasonRolloverSummaryDto`'ya **dördüncü** alan eklenir (mevcut sıra korunur, sona eklenir):
```csharp
public sealed record SeasonRolloverSummaryDto(
    int PromotedBranches,
    int GraduatingStudents,
    int NewBottomBranches,
    int PassiveStudents);   // YENİ — kaynak sezonda aktif-kayıtlı ∩ non-Active person
```

### 5.2 Calculator hesaplaması
`SeasonRolloverMapCalculator.CalculateAsync` içinde, satırlar üretildikten sonra pasif sayım
eklenir. Gerçek rollover'la tutarlı tek sorgu:
```csharp
var passiveStudents = await db.ClassRooms
    .AsNoTracking()
    .Where(c => c.AcademicSessionId == sourceSessionId && c.Status == ClassRoomStatus.Active)
    .SelectMany(c => c.Students)
    .Where(s => s.LeftAt == null)
    .Join(
        db.Persons.AsNoTracking().Where(p => p.LifecycleState != PersonLifecycleState.Active),
        s => s.StudentId,
        p => p.Id,
        (s, p) => s.StudentId)
    .Distinct()
    .CountAsync(cancellationToken);
```
`new SeasonRolloverSummaryDto(..., NewBottomBranches: ..., PassiveStudents: passiveStudents)`.
Tenant global query filter `ClassRooms` ve `Persons` üzerinde uygulanır → çapraz-tenant sızıntı yok.

### 5.3 Backend testleri (IntegrationTests)
`SeasonRolloverPreviewTests`'e yeni `[Fact]`:
- Kaynak sezonda 1 şube, 4 aktif öğrenci; bunlardan 1'inin `Person.LifecycleState = Suspended`
  (veya Archived) → `Summary.PassiveStudents == 1`. Diğer aktifler sayılmaz.
- Mevcut iki test (`Rows_MapToCorrectKind...`, `Rows_EntryGrade...`): `PassiveStudents == 0`
  assert'i eklenir (seed'lerinde person yok → hepsi pasif sayılmaz; 0 beklenir). **Davranış
  regresyonu yok.**

> Not: Mevcut testler `AssignStudent(Guid.NewGuid(), ...)` ile rastgele StudentId kullanıyor;
> karşılık gelen `Person` satırı yok. `Join` eşleşmesi olmadığından bu öğrenciler pasif
> sayılmaz → `PassiveStudents == 0`. Yeni test, Person satırı **seed ederek** pasif yolu test eder.

## 6. Frontend tasarımı (oksis-web)

### 6.1 Tip
`types/index.ts` → `SeasonRolloverSummaryDto`'ya `passiveStudents: number;` eklenir.

### 6.2 StepStudents
- `MOCK_ACTIVE_TOTAL`, `MOCK_PROMOTE_COUNT`, `MOCK_PASSIVE_COUNT` sabitleri **silinir**.
- `useRolloverPreviewQuery(sourceSessionId)` zaten kullanılıyor; ondan türet:
  ```ts
  const rows = preview?.rows ?? [];
  const promoteCount = rows.filter(r => r.kind === 'Promote').reduce((a, r) => a + r.studentCount, 0);
  const graduating = preview?.summary.graduatingStudents ?? 0;
  const activeTotal = promoteCount + graduating;   // tüm aktif kayıtlar
  const passiveCount = preview?.summary.passiveStudents ?? 0;
  ```
- `warning`: `{ active: activeTotal, graduating }`.
- `promote-desc`: `{ count: promoteCount }`. `exclude-passive-desc`: `{ count: passiveCount }`.
- **4 `DebtBadge` importu + kullanımı kaldırılır**; `counts-debt-reason` anahtarı kullanımdan kalkar
  (anahtar silinebilir veya bırakılabilir).
- `graduating` eski fallback `55` → `0`. Preview yüklenirken sayılar `0` görünür (kabul edilir;
  skeleton/flicker YAGNI).

### 6.3 Frontend testleri (vitest)
`StepStudents` testi (yoksa oluştur):
- MSW rollover preview döndürür (Promote satırları + `summary.passiveStudents`) → gerçek sayılar
  render; **DebtBadge yok** (`counts-debt-reason` metni görünmez).
- `sourceSessionId` yok/preview boş → sayılar `0`, çökme yok.

## 7. Veri akışı

```
StepStudents → form sourceSessionId
  → useRolloverPreviewQuery(sourceSessionId)   [Step 3 ile paylaşılan query]
  → GET rollover-preview → SeasonRolloverMapCalculator
  → SeasonRolloverPreviewDto { rows, summary{ ..., passiveStudents } }
  → türet: promoteCount, activeTotal, passiveCount → çipler/uyarı
Sezon açılınca: PromoteStudents(ExcludePassive) aynı pasif tanımıyla bu öğrencileri skip eder.
```

## 8. Dokümantasyon

- `academic-years/api-contracts.md`: rollover-preview yanıtına `summary.passiveStudents` eklendi.
- `academic-years/completion_status.md`: "Step 5 Öğrenci Geçişi mock/DebtBadge borcu kapatıldı —
  active/promote rollover preview'den türetildi, summary'ye passiveStudents eklendi" (çözülen borç,
  spec dışı değil).

## 9. Açık sorular

Yok. Pasif tanımı `PromoteStudentsCommandHandler` ile sabitlendi; yeni endpoint/persistence
kapsam dışı.
