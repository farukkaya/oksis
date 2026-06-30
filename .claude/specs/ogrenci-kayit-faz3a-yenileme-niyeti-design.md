# Öğrenci Kayıt — Faz 3A (Yenileme Niyeti Toplama) Tasarım Dokümanı

> **Tür:** Tasarım dokümanı (faz uygulama girdisi). Şemsiye **bağlayıcı** spec:
> `.claude/specs/ogrenci-kayit-enrollment-spec.md` (E6.1, E7, E8, E9, E12.2). Bu doküman
> o spec'in **Faz 3** paketini (P5) **3A** alt-fazına böler; spec maddeleriyle çakışmaz,
> onları somutlaştırır.
>
> **Durum:** Onaylı (brainstorming, 2026-06-30) · **Kapsam:** `students` modülü — yenileme
> niyeti toplama (BE query + bulk komut + REST + FE reenroll ekranı birebir port).
> **Faz:** 3A (3B ayrı tasarım+plan turu alır).
>
> **Kaynaklar (girdi):**
> - Şemsiye spec: `.claude/specs/ogrenci-kayit-enrollment-spec.md` (E6 Yenileme akışı)
> - Backend teknik analiz: `~/Documents/Claude/Projects/oksis/ogrenci_kayit_teknik_analiz.docx` (§5.1, §5.2, §8, §9, §13/P5)
> - UI handoff: `Oksis Layout - Ennrollment.zip → app/reenroll.jsx` (213 satır) + `app/flows.css` (`.reenroll`/`.re-bridge`/`.concept-split`/`.re-kpi`/`.ren-seg` stilleri)
> - Modül dokümanları: `students/{api-contracts,business-rules,domain-model,completion_status}.md`

---

## 1. Amaç

Aktif sezonun sonunda, gelecek (taslak) sezona geçiş için **veli yenileme niyetini**
(`Renewing` / `Undecided` / `Leaving`) öğrenci başına toplamak. Bu, sezon yenileme
(rollover) akışının **ön-adımıdır**: niyet toplanır; fiziksel sınıf terfisi/koltuk
yerleştirme **Faz 3B**'de (`RenewEnrollment` + `PromoteStudents` köprüsü) yapılır.

> Tek cümle: **3A yalnız niyeti toplar; hiçbir enrollment açmaz, hiçbir koltuk değiştirmez.**

---

## 2. Mevcut Durum (doğrulanmış — keşif 2026-06-30)

**Hazır (yeniden kullanılır):**
- `StudentEnrollment.Intent : RenewalIntent?` alanı + `SetRenewalIntent(RenewalIntent)` metodu — **Faz 1A'dan mevcut** (`Oksis.Domain/Modules/Students/Entities/StudentEnrollment.cs:20,102`).
- `RenewalIntent { Renewing=1, Undecided=2, Leaving=3 }` enum mevcut.
- `EnrollmentType.Renewal=3` mevcut.
- `students.renew` izni **Faz 1A seed'inde mevcut** (`20260628235823_20260629_students_permissions`).
- Faz 2A okuma altyapısı (`ListStudentsQuery` deseni, `StudentListItemDto`, enrollment-bazlı sayfalı sorgu) — taban olarak alınır.

**Sıfırdan yazılacak (3A):**
- `ListRenewalCandidatesQuery` + handler + `RenewalCandidateDto` (+ meta dağılımı).
- `BulkSetRenewalIntentCommand` + handler + validator.
- 2 REST ucu (`GET /enrollments/renewal-candidates`, `POST /enrollments:set-intent`).
- FE `ReEnrollPage` (reenroll.jsx birebir port) + hook'lar + i18n.

**3A dışı — Faz 3B (ayrı tur):** `OpenRenewalPeriod` (academic-sessions migration+komut),
`RenewEnrollment`, `PromoteStudents` E6.3 gating, `ActivateSeasonRollover` entegrasyonu,
`EnrollmentRenewedEvent`, SourceClassRoomId-tabanlı gerçek terfi projeksiyonu.

---

## 3. Kilitlenen Mimari Kararlar (brainstorming 2026-06-30)

- **K1 — Yenileme = rollover'ın ön-adımı (spec E6.2/E6.3 uyumlu).** Admin önce hedef Setup
  sezonu açar → aktif sezonda niyet toplar (3A) → `RenewEnrollment` Renewing olanlara hedef
  sezonda `Type=Renewal` **taslak** enrollment (`ClassRoomId=null`, koltuk YOK) açar (3B) →
  `ActivateSeasonRollover`/`PromoteStudents` koltuğu **aktivasyonda** doldurur (3B). E1.3
  korunur: enrollment defteri (`ClassRoomStudent`) değiştirmez.
- **K2 — "Yenileme dönemi açıldı" temsili = hedef sezonda explicit bayrak + komut** (3B'de:
  `AcademicSession.RenewalPeriodOpenedAt?` + `OpenRenewalPeriodCommand`). `PromoteStudents`
  bu işarete bakıp "yalnız Renewing mi / tüm aktif mi" karar verir (E6.3). academic-sessions
  modülüne dokunur — **3B kapsamı**.
- **K3 — Köprü tetik noktası ayrışması: spec E6.3 izlenir, docx §5.1 değil.** docx §5.1
  "RenewEnrollment doğrudan PromoteStudents tetikler" der; spec E6.3 "PromoteStudents,
  `ActivateSeasonRollover` içinde yenileme-dönemi gating'i ile" der. **Rule #6: spec
  bağlayıcı, docx girdi** → spec izlenir. (3B'yi etkiler; completion_status'a not düşülür.)
- **K4 — Faz 3 ikiye bölünür: 3A (niyet) + 3B (yenileme+köprü).** Bu doküman 3A'dır.

---

## 4. Backend Tasarımı (`oksis-api`)

Vertical slice; `Modules/Students/Queries/ListRenewalCandidates` ve
`Modules/Students/Commands/BulkSetRenewalIntent` klasörleri. Handler'lar
`IApplicationDbContext`'e bağlanır (repository yok). MediatR pipeline standart.

### 4.1 `ListRenewalCandidatesQuery` (Query)

**Amaç:** Yenileme ekranını besleyen, cari sezondaki **aktif** öğrenci kayıtları + mevcut
niyetleri. Önbelleksiz (sık değişir), tenant-izole.

**İmza (öneri):**
```csharp
public sealed record ListRenewalCandidatesQuery(
    Guid? SessionId,        // null → aktif sezon
    int? GradeLevel,
    RenewalIntent? Intent,
    string? Search,         // ad/soyad veya öğrenci no, min 2 karakter
    int Page = 1,
    int PageSize = 20
) : IQuery<PagedResult<RenewalCandidateDto>>;
```

**Aday tanımı:** `StudentEnrollment.Status == Active` **ve** `AcademicSessionId == (SessionId ?? aktif sezon)`.
Diğer durumlar (Frozen/Withdrawn/…) yenileme adayı değildir.

**`RenewalCandidateDto`:**
| Alan | Tip | Kaynak |
|---|---|---|
| `enrollmentId` | Guid | StudentEnrollment.Id |
| `studentId` | Guid | StudentEnrollment.StudentId (Person) |
| `studentNumber` | string | StudentEnrollment.StudentNumber |
| `firstName` / `lastName` | string | Person |
| `gender` | string | Person |
| `gradeLevel` | int | StudentEnrollment.GradeLevel |
| `classRoomId` | Guid? | StudentEnrollment.ClassRoomId |
| `classRoomName` | string? | ClassRoom |
| `currentIntent` | RenewalIntent? | StudentEnrollment.Intent |

> **"Terfi sonrası" sütunu BE'de DÖNMEZ** — FE `gradeLevel+1` display tahmini üretir
> (karar D1). Gerçek hedef şube 3B'de SourceClassRoomId ile belirlenir.

**Meta (KPI için — karar D2):** `PagedResult` meta'sına tüm aday kümesi (sayfa değil)
üzerinden dağılım eklenir:
```
meta: { page, pageSize, totalItems, totalPages,
        renewingCount, undecidedCount, leavingCount }
```
> `Intent == null` olanlar "Kararsız" (Undecided) sayılmaz; **ayrı `pendingCount` gerekmez**
> — UI segmenti "Kararsız"ı yalnız açıkça `Undecided` işaretliler için gösterir. Niyet hiç
> verilmemiş (`null`) kayıtlar segmentte boş (hiçbir buton `on` değil) görünür; KPI'ya
> dahil edilmez. (Niyet `null` vs `Undecided` ayrımı için bkz. §9 R3.)

**İzin:** `students.renew`. **Hata:** 403 (izin yok) · 404 (`SessionId` verilmiş ama okulda yok).

### 4.2 `BulkSetRenewalIntentCommand` (Command)

**Amaç:** Bir veya çok enrollment'ın `Intent`'ini set eder (tek-satır segment tıklaması =
tek elemanlı liste; karar D3).

**İmza (öneri):**
```csharp
public sealed record BulkSetRenewalIntentCommand(
    IReadOnlyList<Guid> EnrollmentIds,
    RenewalIntent Intent
) : ICommand<BulkSetRenewalIntentResult>;   // Result: UpdatedCount
```

**Handler:** Verilen id'lerin tenant-içi + cari sezon + `Status==Active` enrollment'larını
çeker; her birine `enrollment.SetRenewalIntent(intent)` uygular; `SaveChanges`.
Tek transaction (`TransactionBehavior`). Bulunamayan/uygun olmayan id'ler **atlanır**
(`UpdatedCount` gerçek güncellenen sayıyı döner) — kısmi başarı 200; tümü geçersizse 0.

**Validator (FluentValidation):**
- `EnrollmentIds` — boş olamaz, max 500 (toplu işaretleme üst sınırı).
- `Intent` — geçerli enum.

**İzin:** `students.renew`. **Hata:** 403.

> **Not — neden Active zorunlu:** Yenileme niyeti yalnız aktif kayıt için anlamlıdır;
> Frozen/terminal kayıtlara niyet set edilmez (sessizce atlanır, sayıma girmez).

### 4.3 REST (spec E8 birebir)

| Method + Yol | Komut/Query | İzin | Yanıt |
|---|---|---|---|
| `GET /api/v1/enrollments/renewal-candidates` | ListRenewalCandidates | `students.renew` | 200 `PagedResult<RenewalCandidateDto>` (meta'da KPI) |
| `POST /api/v1/enrollments:set-intent` | BulkSetRenewalIntent | `students.renew` | 200 `{ updatedCount }` |

İnce controller → `mediator.Send(...).ToHttpResult()`. Envelope standart (`data/meta/errors/correlationId`).

**`:set-intent` body:**
```json
{ "enrollmentIds": ["..."], "intent": "Renewing" }
```

### 4.4 Domain event

**Yok (3A).** `EnrollmentRenewedEvent` yalnız `RenewEnrollment` (3B) ile tetiklenir. Niyet
set etmek bildirim üretmez.

---

## 5. Frontend Tasarımı (`oksis-web`)

`reenroll.jsx` **birebir port** (handoff faithful-port kuralı; E12.2) — gerçek hook'lara
bağlanarak. Stack: shadcn/ui + Tailwind + React Query (tenant-scoped key) + Axios + i18next.

### 5.1 Bileşen
- `ReEnrollPage` (İngilizce PascalCase — component-rules §20). `portals/admin/students/`
  altında, mevcut öğrenci ekranı desenleriyle uyumlu.
- Handoff yapısı birebir: PageTop (breadcrumb + başlık + aksiyonlar) · **sezon köprüsü**
  (mevcut → hedef Setup sezonu) · **kavram ayrımı** (Yenileme=veli taahhüdü vs Terfi=akademik)
  · **KPI** (Yenileyen/Kararsız/Ayrılıyor/Tahmini doluluk) · toolbar (arama + Sınıf + Durum
  filtreleri) · seçim barı (toplu işaretle) · tablo (Öğrenci / Mevcut Sınıf / Terfi Sonrası /
  Yenileme Durumu segment / detay) · loading-skeleton / error / empty / pager.
- `flows.css`'teki `.reenroll`/`.re-bridge`/`.concept-split`/`.re-kpi`/`.ren-seg`/`.promo-chip`
  stilleri scoped olarak port edilir (Faz 1B'deki `.enroll-sheet` CSS-port dersine uygun:
  paylaşılan stillerin ekrana uygulandığından emin ol).

### 5.2 Veri bağlama
- `useRenewalCandidatesQuery(params)` → `GET /enrollments/renewal-candidates`; tenant-scoped
  React Query key (`renewalKeys`); filtre/arama/sayfa URL search-param'larından.
- `useSetRenewalIntentMutation()` → `POST /enrollments:set-intent`; başarıda
  `renewal-candidates` invalidate. **Tek-satır segment** ve **toplu bar** aynı mutation'ı
  kullanır (tek-satır → `enrollmentIds:[id]`). Optimistic update opsiyonel (segment anında
  görünsün; hata → rollback). Mutasyon nesnesini hook deps'ine koyma (memory: stabil
  `mutateAsync`).
- **KPI'lar BE meta'dan** okunur (handoff client-side hesabı yerine — karar D2). "Tahmini
  doluluk" meta sayılarından FE'de hesaplanır (handoff formülü: `(ren + und*0.5)/total`).
- **"Terfi Sonrası"** = `gradeLevel+1` + aynı şube harfi (handoff `promote()` birebir,
  display-only — karar D1).
- Sezon köprüsü: hedef Setup sezonu academic-sessions'tan **salt-okur** gösterilir; taslak
  sezon yoksa köprü "hedef sezon yok" notuyla gösterilir (boş-durum metni handoff'taki
  "Yenileme dönemi henüz açılmadı" ile uyumlu).

### 5.3 3B'ye ertelenen (pasif port — karar D4)
- **"Yenilemeyi Başlat"** butonu (PageTop + empty-state) → `notReadyHint="3B"` ile pasif
  (OpenRenewalPeriod + RenewEnrollment 3B). 2A lifecycle deseni.
- **"Dışa Aktar"** → pasif (export paritesi sonraya).

### 5.4 Giriş noktası
`/admin/students` ekranından "Kayıt Yenileme" navigasyonu (mevcut students ekranına
buton/route eklenir). Route: `/admin/students/renewal` (öneri).

### 5.5 i18n
`renewal.*` anahtarları (tr + en). Hardcoded Türkçe yasak.

---

## 6. Testler

**BE (Application.UnitTests):**
- `ListRenewalCandidates`: aktif sezon varsayımı; yalnız `Active` enrollment döner;
  filtre (gradeLevel/intent/search) doğru; **meta KPI dağılımı** doğru (sayfa değil, tüm küme);
  tenant-izolasyon (başka okulun kaydı dönmez); geçersiz `SessionId` → 404.
- `BulkSetRenewalIntent`: çok id güncelleme; tek id güncelleme; cari-sezon-dışı/Active-olmayan
  id atlanır (`UpdatedCount` doğru); tenant-izolasyon; geçersiz intent / boş liste → validation.
- İzin: `students.renew` olmadan 403 (Api.UnitTests veya integration).

**FE (vitest):**
- `ReEnrollPage` render (loading/error/empty/normal); KPI meta'dan; segment tek-satır set →
  mutation çağrısı; toplu bar → çok id; filtre/arama; "Terfi Sonrası" projeksiyonu; pasif 3B
  butonları `notReadyHint`.
- Hook'lar: query key tenant-scoped; mutation invalidate.

---

## 7. Baked-in Kararlar (onaylı 2026-06-30)

| # | Karar | Gerekçe |
|---|---|---|
| **D1** | "Terfi Sonrası" = `gradeLevel+1` display-only (handoff birebir) | Gerçek yerleştirme 3B'de SourceClassRoomId ile; 3A academic-sessions'a dokunmaz |
| **D2** | KPI sayıları BE meta'dan (handoff client-side'dan **sapma**) | Sayfalama ile client-side sayım yanlış olur; doğru toplam gerekli → completion_status'a not |
| **D3** | Tek `:set-intent` endpoint (bulk); tek-satır = 1 id; ayrı `SetRenewalIntent` tekil komutu açılmaz | Spec E8 tek endpoint tanımlar; DRY |
| **D4** | "Yenilemeyi Başlat" + "Dışa Aktar" 3B'ye ertelenir (pasif `notReadyHint`) | OpenRenewalPeriod/RenewEnrollment 3B; export paritesi sonraya |

---

## 8. Spec Dışına Çıkılanlar (completion_status'a işlenecek)

- **docx §5.1 yerine spec E6.3 izlenir** (köprü tetik noktası) — K3. Onay: kullanıcı.
- **D2:** KPI dağılımı BE meta'dan (handoff client-side hesabından sapma). Onay: kullanıcı.
- **D3:** `SetRenewalIntent` tekil komutu ayrı açılmaz, `BulkSetRenewalIntent` tek-id ile
  karşılar. Onay: kullanıcı. (Spec E7 envanterinde ikisi de listeli; tek endpoint E8 ile
  uyumlu kalır.)

---

## 9. Riskler

- **R1 — Sayfalama + KPI tutarsızlığı:** KPI sayfa-bazlı hesaplanırsa yanıltır → D2 (meta)
  ile çözülür; testle doğrulanır.
- **R2 — Hedef Setup sezonu yokken ekran:** Sezon köprüsü "hedef sezon yok" durumunu zarifçe
  göstermeli (boş-durum). 3A'da niyet toplama yine de cari sezonda mümkündür.
- **R3 — Niyet `null` vs Undecided karışması:** `null` (hiç işaretlenmemiş) ≠ `Undecided`
  (açıkça kararsız) — KPI ve segment davranışı net tanımlı (§4.1).

---

## 10. Faz 3A Bitiş Tanımı (DoD)

- 2 query/komut + 2 REST ucu canlı; BE + FE testleri yeşil; `dotnet build`/`dotnet format`
  + `npm run build`/`vitest` temiz.
- `ReEnrollPage` `/admin/students/renewal`'da gerçek uçlara bağlı; niyet tekil + toplu set
  çalışıyor; KPI doğru.
- Modül dokümanları güncel (`api-contracts.md` 3A uçları, `completion_status.md` 3A + Spec
  Dışına Çıkılanlar, gerekiyorsa `business-rules.md` BR-students-003 yenileme niyeti kuralı).
- Tarayıcı E2E (Chrome) ile niyet toplama doğrulanmış.
