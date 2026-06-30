# Öğrenci Kayıt — Faz 2A (Liste & Okuma) Tasarım Dokümanı

> **Tür:** Faz tasarım dokümanı (şemsiye spec'e bağlı). Bağlayıcı kaynak
> `.claude/specs/ogrenci-kayit-enrollment-spec.md` (E1.3, E4.1, E4.2, E7, E8, E9). Bu
> doküman onların **uygulama tasarımıdır**; yeni bağlayıcı karar koymaz.
>
> **Durum:** Onaylı (brainstorming, 2026-06-30) · **Kapsam:** `students` modülü —
> okuma sorguları (Liste/Detay/Kayıt Geçmişi) + REST + FE okuma swap.
>
> **Faz 2 dilimlemesi (kullanıcı kararı 2026-06-30):** Faz 2 = P3 (okuma) + P4 (lifecycle).
> İki dilime bölündü: **Faz 2A = okuma (bu doküman)**, **Faz 2B = lifecycle** (sonra).

---

## 1. Amaç ve kapsam

Faz 1A/1B'de öğrenci listesi/detayı/lifecycle'ı **eski Person-bazlı** uçlara (`/users/persons*`)
bağlıydı (çalışıyor). Faz 2A, **liste/detay/kayıt-geçmişi okumalarını yeni enrollment-bazlı
(sezon-eksenli) uçlara taşır** (spec E1.3: `StudentEnrollment` sezon idari kaydı). Lifecycle
komutları (Freeze/Withdraw/…) Faz 2B'ye bırakılır.

### 1.1 Kapsam İÇİ
- BE: `ListStudentsQuery`, `GetStudentDetailQuery`, `GetEnrollmentHistoryQuery` + handler + DTO.
- REST: `GET /api/v1/students`, `GET /api/v1/students/{id}`, `GET /api/v1/students/{id}/enrollments`.
- FE: `studentsApi.list/detail/enrollmentHistory` → yeni uçlar; "Durum" filtresi `EnrollmentStatus`'a;
  drawer "Kayıt Geçmişi" sekmesi gerçek veriyle dolar; lifecycle satır-aksiyonları **pasifleştirilir** (2B'de bağlanacak).

### 1.2 Kapsam DIŞI (2B / sonra)
- Lifecycle komutları: `FreezeEnrollment`/`ResumeEnrollment`/`WithdrawStudent`/`ArchiveEnrollment` → **Faz 2B**.
- AssignClass / PromoteStudents (mock+D), Belge sekmesi, Hesap sekmesi, akademik düzenleme formu → sonraki fazlar.
- Eski `/users/persons*` uçları **kaldırılmaz** (Kullanıcılar ekranı tüketmeye devam eder); yalnız öğrenci ekranı çağırmayı bırakır.

### 1.3 Karar kayıtları (brainstorming 2026-06-30)
- **D1 — Sezon-bazlı liste:** Bir satır = seçili sezonda (default aktif) enrollment'ı olan öğrenci;
  "Durum" = `StudentEnrollment.Status`. O sezonda enrollment'ı olmayan öğrenci o listede çıkmaz.
- **D2 — Geçiş aksiyonları:** 2A'da liste/detay/geçmiş yeni okumaya swap edilir; lifecycle
  satır-aksiyonları **geçici pasif** (notReadyHint "2B"), 2B'de enrollment komutlarına bağlanır.
  (Tutarsızlık önlenir: yeni liste enrollment-status gösterirken eski Person-komutları çağrılmaz.)

---

## 2. Mimari yaklaşım

**Enrollment-primary, sezon-scoped:** Sorgular `StudentEnrollment`'ı birincil alır (tenant global
filter + `AcademicSessionId`), `Person`/`StudentProfile`/`ClassRoom`/birincil veliye **tek projeksiyon
sorgusuyla** join eder (N+1 yok). Sezon başına bir enrollment (E4.1) → mükerrer satır yok.

**Cross-module okuma:** Sorgular Students modülünde ama `db.Persons`, `db.Profiles`,
`db.AcademicSessions`, `db.ClassRooms`, `db.ParentStudentRelationships`'e **doğrudan** erişir
(tek `IApplicationDbContext`, dikey-dilim deseni). `IPersonDirectory` portu yalnız Identity↔Users
izolasyonu içindi; okuma sorgusu için ayrı port gerekmez.

**Migration gerekmez** — yalnız okuma + FE; yeni tablo/kolon yok.

---

## 3. `ListStudentsQuery`

İzin: **`students.view`** (E9, seed'li). Server-side, sayfalı, **cache'siz** (E7).

### 3.1 Girdi
```
ListStudentsQuery {
  SeasonId?      // verilmezse aktif AcademicSession
  Page, PageSize
  Search?        // ad VEYA öğrenci no VEYA veli adı
  Status?        // EnrollmentStatus filtresi
  Gender?
  GradeLevel?    // int
  Sort?          // default: ad artan
}
```

### 3.2 Kaynak (projeksiyon)
```
db.StudentEnrollments  (tenant filter + AcademicSessionId == seasonId)
  → Person            [p.Id == e.StudentPersonId]   : ad, cinsiyet
  → StudentProfile    [profile.PersonId == e.StudentPersonId] : öğrenci no
  → ClassRoom?        [c.Id == e.ClassRoomId]        : şube adı
  → birincil veli?    (ParentStudentRelationship.IsPrimaryContact && RevokedAt==null → Person) : ad, telefon
```
Default sezon: `SeasonId` boşsa `AcademicSessions` içinde `Status==Active` olan.

### 3.3 Çıktı — `StudentListItemDto`
Mevcut `PersonListItemDto`/FE `StudentListItem` ile **uyumlu** (FE map/komponent değişmez):
```
StudentPersonId, StudentNumber, FullName, Gender,
ClassName?, GradeLevel, Status (EnrollmentStatus), EnrollmentDate,
PrimaryGuardianName?, PrimaryGuardianPhone?, HasGuardianWarning
```
`HasGuardianWarning` = aktif veli ilişkisi yok.

### 3.4 Filtre eşlemesi
| Filtre | Eşleme |
|---|---|
| `Status` | `StudentEnrollment.Status` (Active/Frozen/Withdrawn/Graduated/TransferredOut/Archived/Draft) — *eski `Person.LifecycleState` yerine* |
| `Gender` | `Person.Gender` |
| `GradeLevel` | `StudentEnrollment.GradeLevel` |
| `Search` | `Person.Name` (ad/soyad) **veya** `StudentProfile.StudentNumber` **veya** birincil veli adı |
| `SeasonId` | boşsa aktif sezon |

### 3.5 Davranış
`WHERE` + arama + `ORDER BY` (default `Person.Name` artan) + `Skip/Take`. Sonuç:
`{ Items: StudentListItemDto[], TotalCount }`. Sayfalama server-side; cache yok (canlı durum).

---

## 4. `GetStudentDetailQuery` + `GetEnrollmentHistoryQuery`

### 4.1 `GetStudentDetailQuery(StudentPersonId)` → `StudentDetailDto`
İzin: **`students.view-detail`**. Drawer General/Guardians/Academic sekmeleri.
```
StudentPersonId, StudentNumber, FullName, Gender, BirthDate,
NationalIdMasked?,        // düz TCKN AÇILMAZ — maskeli/var-yok (mevcut PersonDetailDto deseni)
PhotoUrl?,                // foto Debt → null
CurrentEnrollment: { SeasonId, SeasonName, GradeLevel, ClassName?, Status, Type, EnrollmentDate },
Guardians: [{ PersonId, FullName, RelationType, Phone?, Email?, IsPrimaryContact, CanViewInfo,
              CanMakeDecisions, IsPaymentResponsible, CanPickup }],
HasGuardianWarning
```
- `CurrentEnrollment` = aktif sezon enrollment'ı (yoksa null).
- Mevcut `PersonDetailDto` ile uyumlu → drawer minimum değişir.

### 4.2 `GetEnrollmentHistoryQuery(StudentPersonId)` → `EnrollmentHistoryItemDto[]`
İzin: **`students.view-detail`**. Drawer "Kayıt Geçmişi" sekmesi (şu an stub `[]`).
```
[ { EnrollmentId, SeasonId, SeasonName, GradeLevel, ClassName?,
    Type (New/TransferIn/Renewal),
    Status (Active/Frozen/Withdrawn/Graduated/TransferredOut/Archived/Draft),
    EnrollmentDate, PreviousSchool? } ]
```
- Kişinin **tüm sezonlardaki** kayıtları; **en yeni sezon üstte** (cross-read, sezon sınırı aşılır).
- FE `useEnrollmentHistoryQuery` + drawer Enrollment tab zaten hazır; gerçek veriyle dolar.

### 4.3 Güvenlik
- Düz TCKN **hiçbir** detail/history yanıtında dönmez (E11.1/güvenlik). NationalId şifreli saklanır;
  detail yalnız maskeli/var-yok gösterir.
- 404 vs 403: kapsam dışı (başka tenant) kaynak → 404; izin yok → 403 (E9 deseni).
- Tenant: global query filter tüm sorgularda otomatik (cross-tenant okuma `IgnoreQueryFilters` YOK).

---

## 5. REST (E8)

| Method + Yol | Query | İzin |
|---|---|---|
| `GET /api/v1/students` | ListStudents | `students.view` |
| `GET /api/v1/students/{id}` | GetStudentDetail | `students.view-detail` |
| `GET /api/v1/students/{id}/enrollments` | GetEnrollmentHistory | `students.view-detail` |

İnce controller → `mediator.Send(...).ToHttpResult()`. Query string: `seasonId/page/pageSize/search/status/gender/gradeLevel/sort`.

---

## 6. FE swap (oksis-web)

| Mevcut | 2A sonrası |
|---|---|
| `studentsApi.list()` → `/users/persons?profileType=Student` | → **`GET /students`**; `StudentListItemDto`→`StudentListItem` map |
| `studentsApi.detail(id)` → `/users/persons/{id}` | → **`GET /students/{id}`** |
| `studentsApi.enrollmentHistory(id)` → stub `[]` | → **`GET /students/{id}/enrollments`** (gerçek) |

- **"Durum" filtresi:** değerleri `PersonLifecycleState` → `EnrollmentStatus` (Aktif/Dondurulmuş/Ayrıldı/
  Mezun/Nakil/Arşiv); dropdown + i18n (tr+en) güncellenir.
- **Lifecycle satır-aksiyonları** (`StudentRowActions`/`useStudentActions`): Mezun Et · Kaydı Dondur ·
  Yeniden Etkinleştir · Nakil Çıkışı · Pasife Al → **pasif + `notReadyHint` "2B"** (mevcut AssignClass/Düzenle
  pasif deseniyle birebir). **Detay** ve **Veli Bağla** çalışır kalır.
- Eski `studentsApi.suspend/graduate/transferOut/deactivate/reactivate` çağrıları students ekranından kaldırılır
  (fonksiyonlar/uçlar durur, Kullanıcılar ekranı tüketir).
- Tenant-scoped React Query key'leri korunur (`studentKeys`).

---

## 7. Test stratejisi (TDD)

### 7.1 BE entegrasyon (DatabaseFixture, çok-sezonlu seed)
- `ListStudents`: sezon-scope (yalnız seçili sezon), filtre (status/gender/grade), arama (ad/no/veli),
  sayfalama (totalCount + skip/take), sıralama; cross-tenant izolasyon (başka okul satırı sızmaz).
- `GetStudentDetail`: kimlik + aktif-sezon `CurrentEnrollment` + veliler; **düz TCKN dönmez** assert;
  başka tenant id → 404.
- `GetEnrollmentHistory`: çok-sezon kayıtları, en-yeni-üstte sıralama; kayıtsız kişi → boş liste.

### 7.2 FE birim (vitest)
- `studentsApi` mapping testleri: 3 yeni uç + DTO→view map (envelope unwrap).
- Liste/drawer yeni veriyle render; **lifecycle aksiyonları pasif** assert; "Durum" filtresi yeni değerler.
- `enrollmentHistory` tab dolu render (stub kaldırıldı).

---

## 8. Spec uyum matrisi

| Madde | Karşılanma |
|---|---|
| E7 (ListStudents/GetStudentDetail/GetEnrollmentHistory; cache'siz) | §3, §4 |
| E8 (REST: GET /students, /{id}, /{id}/enrollments + izinler) | §5 |
| E1.3 (enrollment idari sezon katmanı; ClassRoomStudent defteri değişmez) | §2 (yalnız okuma) |
| E4.1 (sezon başına bir enrollment) | §3.2 (mükerrer satır yok) |
| E4.2 (durum makinesi) | §3.4 (Status filtresi/gösterimi; geçiş 2B) |
| E9 (students.view / view-detail) | §5 (seed'li izinler) |
| Rule #1 (tenant) | §4.3 (global filter) |
| Güvenlik (düz TCKN) | §4.3 |

---

## 9. Riskler

- **R1 — DTO uyumsuzluğu FE'yi kırar:** `StudentListItemDto`/`StudentDetailDto` mevcut FE şekliyle hizalı
  tutulur; mapping testleri (§7.2) korur.
- **R2 — Filtre eksen değişimi (Person→Enrollment) kullanıcı şaşırtır:** "Durum" değerleri net i18n + 2B'de
  lifecycle aksiyonları tamamlanınca tam oturur.
- **R3 — Çok-sezon join performansı:** tek projeksiyon + index'li `AcademicSessionId`/`StudentPersonId`;
  sayfalama server-side.
- **R4 — Geçiş tutarsızlığı:** D2 ile giderildi (lifecycle aksiyonları 2A'da pasif).
