# Öğrenci Kayıt (Enrollment) Modülü — Şemsiye Mimari Spec

> **Tür:** Bağlayıcı anlaşma (`bağlayıcı anlaşma`) — CLAUDE.md Absolute Rule #6.
> Numaralı maddeler (`E1.1`, `E2.3` …) non-negotiable tasarım kararlarıdır. Aykırılıkta
> dur, hangi madde ile çakıştığını Türkçe bildir, kullanıcının kararını bekle.
>
> **Durum:** Onaylı (brainstorming, 2026-06-29) · **Kapsam:** `students` modülü — domain,
> CQRS, orkestrasyon, REST, izin, event, FE port · **Sprint:** Sprint 2+ iş paketi girdisi
>
> **Kaynaklar (girdi):**
> - Backend teknik analiz: `~/Documents/Claude/Projects/oksis/ogrenci_kayit_teknik_analiz.docx`
> - UI tasarımı: `Oksis Layout - Enrollment.zip` → `enroll_wizard.jsx`, `reenroll.jsx`, `students.jsx`
> - İhtiyaç/gap analizi: `.claude/docs/modules/students/enrollment-needs-analysis.md`
> - Üst mimari spec (öğrenci §4): `.claude/specs/oksis-admin-ekranlari-mimari-spec.md`
> - Mevcut kural: `business-rules.md` BR-students-001 (şube tek doğruluk kaynağı)

---

## E1. Amaç ve sınır

- **E1.1** Bu spec, sezona bağlı öğrenci kaydını (Enrollment) uçtan uca tanımlar: yeni
  kayıt, nakil gelen, kayıt yenileme, dönem geçişi, yaşam döngüsü, belge, aday.
- **E1.2** Mevcut olgun altyapı **korunur ve yeniden kullanılır**: `Person`, `Profile`
  (TPH), `StudentProfile`, `ParentStudentRelationship`, `Account`, `Invitation`,
  `ClassRoomStudent`, `AssignStudentToClassRoom`, `TransferStudent`, `PromoteStudents`,
  `StudentClassroomSyncInterceptor`. Eksik olan altyapı değil; **orkestrasyon + sezona
  bağlı kayıt (Enrollment) katmanıdır** (gap analizi G1–G4).
- **E1.3 Sınır kuralı (korunur):** Şube üyeliğinin tek doğruluk kaynağı `ClassRoomStudent`
  defteridir (BR-students-001). `StudentEnrollment` idari/sezon katmanını ekler, **defteri
  değiştirmez**. `StudentEnrollment.ClassRoomId` aktif `ClassRoomStudent` ile tutarlı tutulur.

---

## E2. Bağlayıcı kararlar

- **E2.1 (Kapsam)** Modül tüm iş paketlerini (P0–P7) kapsar; **fazlara bölünerek** uygulanır
  (bkz. E3). Bu spec şemsiyedir; her faz kendi `writing-plans` planını alır.
- **E2.2 (G8 — legacy User kaldırılır)** Kayıt akışı **yalnız** `Person`/`Account`/`Profile`
  hattını yazar. Legacy `User` entity yeni kayıtta **yazılmaz**; tek-seferlik
  `User → Person/Account` migration sonrası `User` ve eski uçları **kaldırılır**. Karar
  ADR ile kilitlenir (bkz. `.claude/specs/adr-001-legacy-user-kaldirma.md`); **ADR koddan
  önce onaylanır** (P0).
- **E2.3 (D1 — Öğrenci no kişiye sabit)** Öğrenci numarası **kişiye atanır ve mezun olana
  kadar değişmez** (sezon-bazlı değil). `StudentProfile.StudentNumber` kalıcı kimliktir;
  `StudentEnrollment`'ta **ayrı `EnrollmentNo` alanı YOKTUR**. Numara yalnız ilk kayıtta
  `IStudentNumberGenerator` ile üretilir; terfi/yenileme/nakil-içi geçişte değişmez.
- **E2.4 (D2)** TCKN **opsiyonel**; yabancı uyruklu için pasaport/alternatif kimlik alanı.
  Tekillik: TCKN varsa tenant-scoped zorunlu tekil (`ux_persons_national_id_hash`).
- **E2.5 (D3)** Aday/ön kayıt **minimal**: `StudentEnrollment.Status=Draft` ile temsil edilir;
  tam başvuru hunisi (değerlendirme/kontenjan/dönüşüm) Faz 5'e ertelenir (G5).
- **E2.6 (D6)** Küçük kademede yalnız **veli** hesabı açılır; öğrenci hesabı opsiyoneldir.
- **E2.7 (invite-first + öğrenci istisnası)** Yönetici şifre belirlemez. **Veli** davet alır
  (Email/SMS/WhatsApp). **Öğrenci** istisnası: kullanıcı adı = öğrenci no, geçici şifre
  üretilir, ilk girişte zorunlu değişim (üst spec madde 121-122 ile birebir).

---

## E3. Faz kırılımı

| Faz | Paket | İçerik | Gap |
|---|---|---|---|
| **P0 · ADR** (önce) | — | G8 `User` kaldırma kararı + migration stratejisi | G8 |
| **Faz 1 · Çekirdek** | P1+P2 | Domain (`StudentEnrollment` + enum'lar + `StudentDocument` modeli + `StudentNumber` generator + migration) · `EnrollStudent` orkestrasyon + idempotency + `StudentEnrolledEvent` · sihirbaz query'leri (`CheckNationalId`/`BranchCapacity`/`SearchGuardians`) · **FE: 5 adımlı sihirbaz (Yeni+Nakil) + başarı** | G1,G2,G3,G7 |
| **Faz 2 · Liste & Yaşam döngüsü** | P3+P4 | `ListStudents`/`GetStudentDetail`/`GetEnrollmentHistory` + drawer cross-read · `TransferIn`/`Freeze`/`Resume`/`Withdraw`/`Archive` · **FE: liste + drawer + satır/toplu aksiyon + lifecycle** | G2,G3 |
| **Faz 3 · Yenileme** | P5 | `ListRenewalCandidates`/`SetIntent`/`BulkSetIntent`/`RenewEnrollment` → `PromoteStudents` köprüsü · **FE: reenroll ekranı** | G4 |
| **Faz 4 · Import** | P6 | `ImportStudents` (validasyonlu toplu) · FE | — |
| **Faz 5 · Belge & Aday** | P7 | `StudentDocument` UI + checklist · aday/başvuru hunisi · FE | G5,G6 |

- **E3.1** Uygulama sırası: **P0 (ADR) → Faz 1 → Faz 2 → Faz 3 → Faz 4 → Faz 5.** P0 ve
  Faz-1 domain'i ilk koddan önce kilitlenir.
- **E3.2** Her faz tamamında ilgili modül dokümanı (`completion_status.md` vb.) **anında**
  güncellenir (CLAUDE.md Module Documentation System).

---

## E4. Domain modeli

### E4.1 `StudentEnrollment` (yeni aggregate — çekirdek)
Bir öğrencinin bir akademik sezondaki **idari kaydı**. Sezon başına bir satır; geçmiş asla
üzerine yazılmaz. `ClassRoomStudent` fiziksel yerleştirmeyi, `StudentEnrollment` idari kaydı
(tür/durum/tarih/niyet) tutar.

Alanlar: `Id`, `SchoolId` (tenant), `StudentPersonId` (→Person), `AcademicSessionId`
(→sezon), `GradeLevel`, `ClassRoomId?` (yerleştirilen şube), `EnrollmentDate`,
`Type` (EnrollmentType), `Status` (EnrollmentStatus), `PreviousSchool?` (nakil gelende
zorunlu), `Intent?` (RenewalIntent — yalnız yenileme sürecinde). **`EnrollmentNo` YOK (E2.3).**

- **E4.2 State machine:** `Draft → Active → (Frozen | TransferredOut | Withdrawn |
  Graduated) → Archived`. Geçerli geçişler: Draft→Active · Active↔Frozen · Active→TransferredOut
  · Active→Withdrawn · Active→Graduated · {Graduated,Withdrawn,TransferredOut}→Archived.
  Geçersiz geçiş → `DomainException`/`Result.Fail`.

### E4.3 Enum'lar
- `EnrollmentType { New=1, TransferIn=2, Renewal=3 }`
- `EnrollmentStatus { Draft=1, Active=2, Frozen=3, TransferredOut=4, Withdrawn=5, Graduated=6, Archived=7 }`
- `RenewalIntent { Renewing=1, Undecided=2, Leaving=3 }`

### E4.4 `StudentNumber` politikası (E2.3 / G7)
- **E4.4.1** `IStudentNumberGenerator` — format `{SezonYılı}{5-hane-sıra}`, tenant bazlı
  atomik sıra (SQL sequence veya tablo + UPDLOCK).

  > **⚠️ AMENDMENT (2026-07-01):** Bu madde **süperseded** — format artık **yılsız**:
  > `{prefix?}{sıra}` (`prefix` opsiyonel okul ayarı; `sıra` = minimum genişlik/sıfır-dolgu,
  > tavan değil). Ayar boşsa: öneksiz, min 3 hane, **100'den** başlar (`100, 101, … 999, 1000, …` —
  > tükenmez). Sayaç artık yıla göre anahtarlanmaz (okul-ömür-boyu tek monoton sıra).
  > Bağlayıcı detay/kararlar: `.claude/specs/ogrenci-numarasi-format-design.md`
  > (bu mini-spec E4.4.1'i geçersiz kılar/süpersede eder; onay: kullanıcı, 2026-07-01).
  > E4.4.2 (ilk-kayıtta üretim, sonradan immutable) **değişmedi** — bkz. aşağıda.
- **E4.4.2** Yalnız **ilk kayıtta** (Person'ın `StudentProfile.StudentNumber`'ı boşsa)
  üretilir; sonradan **değişmez**, mezuniyete kadar aynı.

### E4.5 `StudentDocument` (G6 — model Faz 1, UI Faz 5)
Alanlar: `Id`, `SchoolId`, `StudentPersonId`, `EnrollmentId?`, `Type`
(Nufus|Foto|Diploma|Saglik|Sozlesme|Diger), `Status` (Missing|Uploaded|Approved|Rejected),
`FileUrl?`, `ExpiryDate?`.

---

## E5. EnrollStudent orkestrasyonu

- **E5.1** Tek `EnrollStudentCommand` → tek DB transaction (`TransactionBehavior`, pipeline #5).
  Sıra: (1) Person çöz (TCKN hash; varsa `DuplicateEnrollmentException`) → yoksa `Person.Create`
  + `StudentProfile`; (2) `StudentNumber` üret (E4.4); (3) `StudentEnrollment.Create` Type +
  `Draft→Activate()`, aktif sezona bağlı; (4) `AssignStudentToClassRoom` (Reason=NewEnrollment),
  **kapasite hard-check**; (5) her veli için Person bul/oluştur + `ParentStudentRelationship`
  + bayraklar (velisizse atla → `HasGuardianWarning=true`); (6) invite ise davet **transaction
  dışına** kuyrukla; (7) `StudentEnrolledEvent` (commit sonrası).
- **E5.2 Yan etki transaction dışında:** davet/SMS/FCM **transaction içinde yapılmaz** →
  `StudentEnrolledEvent` → handler → `INotificationService.Enqueue` → Hangfire. Commit
  başarısızsa davet gitmez.
- **E5.3 Idempotency:** `EnrollStudentCommand` bir `ClientRequestId` taşır; aynı key ikinci
  kez işlenmez (çift "Kaydet" → mükerrer öğrenci yok).
- **E5.4** `TransferInStudentCommand` = EnrollStudent türevi: `Type=TransferIn`,
  `PreviousSchool` zorunlu, ara sınıfa yerleştirme.

---

## E6. Yenileme akışı (Faz 3)

- **E6.1** `SetRenewalIntentCommand`/`BulkSetRenewalIntentCommand`: mevcut sezon
  `StudentEnrollment.Intent` = Renewing/Undecided/Leaving.
- **E6.2** `RenewEnrollmentCommand`: `Intent=Renewing` olanlar için **hedef (taslak) sezonda**
  yeni `StudentEnrollment(Type=Renewal)` açar → `PromoteStudents` köprülenir (terfi onaydan
  sonra otomatik uygulanır). `Leaving` → Withdraw/mezun; `Undecided` → takip.
- **E6.3 `PromoteStudents` davranış değişimi:** Yenileme dönemi açıldıysa **yalnız "Renewing"**
  terfi eder; **açılmadıysa** mevcut "tüm aktif öğrenciyi terfi et" davranışı **korunur**
  (geriye uyum). Bu değişiklik `academic-sessions` BR'lerine de yansıtılır.

---

## E7. CQRS envanteri

**Komutlar:** `EnrollStudent`, `TransferInStudent`, `UpdateStudent`, `LinkGuardian`,
`UnlinkGuardian`, `SetRenewalIntent`, `BulkSetRenewalIntent`, `RenewEnrollment`,
`FreezeEnrollment`, `ResumeEnrollment`, `WithdrawStudent`, `ArchiveEnrollment`, `ImportStudents`.

**Query'ler:** `ListStudents` (sayfalı+filtre+arama, server-side, cache'siz),
`GetStudentDetail`, `GetEnrollmentHistory`, `CheckNationalIdDuplicate`, `GetBranchCapacity`
(`[Cacheable]` key `master:{schoolId}:branch-cap:{sessionId}`), `SearchGuardians`,
`ListRenewalCandidates`, `GetStudentDocuments`.

---

## E8. REST API sözleşmesi

Plural, kebab-case, `/api/v1/`; ince controller → `mediator.Send(...).ToHttpResult()`.

| Method + Yol | Komut/Query | İzin |
|---|---|---|
| `POST /api/v1/students:enroll` | EnrollStudent | students.create |
| `POST /api/v1/students:transfer-in` | TransferInStudent | students.create |
| `GET  /api/v1/students` | ListStudents | students.view |
| `GET  /api/v1/students/{id}` | GetStudentDetail | students.view-detail |
| `PUT  /api/v1/students/{id}` | UpdateStudent | students.update |
| `GET  /api/v1/students/{id}/enrollments` | GetEnrollmentHistory | students.view-detail |
| `GET  /api/v1/students/check-national-id` | CheckNationalIdDuplicate | students.create |
| `GET  /api/v1/branches/capacity` | GetBranchCapacity | students.create |
| `GET  /api/v1/guardians:search` | SearchGuardians | students.create |
| `POST /api/v1/students/{id}/guardians` | LinkGuardian | students.update |
| `DELETE /api/v1/students/{id}/guardians/{rid}` | UnlinkGuardian | students.update |
| `GET  /api/v1/enrollments/renewal-candidates` | ListRenewalCandidates | students.renew |
| `POST /api/v1/enrollments:set-intent` | BulkSetRenewalIntent | students.renew |
| `POST /api/v1/enrollments:renew` | RenewEnrollment | students.renew |
| `POST /api/v1/students/{id}:withdraw` | WithdrawStudent | students.manage |
| `POST /api/v1/students/{id}:freeze` · `:resume` | Freeze/ResumeEnrollment | students.manage |
| `POST /api/v1/students:import` | ImportStudents | students.import |

---

## E9. İzinler (default deny)

`students.view`, `students.view-detail`, `students.create`, `students.update`,
`students.renew`, `students.manage`, `students.import`, `students.export`. Yeni izin tüm
rollere **kapalı** doğar. İzin yok → 403; kapsam dışı kaynak → 404; cross-tenant → 403 +
Critical log.

---

## E10. Domain event'ler (geçmiş zaman; handler kuyruklar, senkron iş yapmaz)

`StudentEnrolledEvent`, `StudentTransferredInEvent`, `GuardianLinkedEvent`,
`EnrollmentRenewedEvent`, `StudentWithdrawnEvent`. Tümü Hangfire üzerinden bildirim/SignalR.

---

## E11. Validasyon (FluentValidation, pipeline #2)

- **E11.1** TCKN: varsa 11 hane + algoritma; tenant-scoped tekil; mükerrerde 409 + UI'da
  "mevcut kaydı aç" linki. (E2.4 ile: TCKN opsiyonel.)
- **E11.2** Ad/Soyad zorunlu, trim, min 2 karakter.
- **E11.3** `Type==TransferIn ⇒ PreviousSchool` zorunlu.
- **E11.4** Şube kapasitesi: **HARD** (dolu şubeye yerleştirme reddedilir), **SOFT** (%90+ uyarı).
- **E11.5** Veli opsiyonel; velisiz kayıtta `HasGuardianWarning=true`.
- **E11.6** Yalnız **aktif** `AcademicSession`'a `Active` enrollment; pasif/taslak reddedilir.
- **E11.7** `invite==true ⇒ kanal ∈ {Email,SMS,WhatsApp}` ve ilgili iletişim alanı dolu.

---

## E12. FE port eşlemesi

Teslim alınan tasarım **gerçek hook'lara bağlanarak birebir port** edilir (handoff port kuralı):
- **E12.1** `enroll_wizard.jsx` → 5 adımlı sihirbaz (Yeni/Nakil), kapasite grid, TCKN mükerrer,
  çoklu veli + bayraklar, özet, başarı (kimlik kutusu + davet) → `students:enroll`/`transfer-in`
  + sihirbaz query'leri.
- **E12.2** `reenroll.jsx` → kayıt yenileme ekranı (KPI, Yeniler/Kararsız/Ayrılıyor segment,
  terfi-yenileme görsel ayrımı) → renewal uçları.
- **E12.3** Mevcut "Öğrenciler" liste/drawer gerçek `students` uçlarına bağlanır;
  **mock+D borcu kaldırılır** (`studentsDebtApi` ve `DebtBadge` temizlenir).
- **E12.4** Stack: shadcn/ui + Tailwind + React Query (tenant-scoped key) + RHF/Zod + Axios.

---

## E13. Açık kararlar (kalan — uygulama sırasında netleşir)

| # | Karar | Öneri |
|---|---|---|
| D2 | Pasaport alanı `Person`'a mı, ayrı VO mu? | `NationalId` VO'su tip alanıyla genişletilir |
| D4 | Belge yükleme depolaması | Mevcut S3/Blob soyutlaması (Faz 5) |
| D5 | Ücret/sözleşme bağı | MVP dışı; `StudentEnrollment`'a sonradan FK alanı |
| — | Aday hunisi UI detayı | Faz 5 kendi tasarımını alır |

---

## E14. Riskler

- **R1** Çift Kaydet → mükerrer öğrenci → **idempotency key zorunlu** (E5.3).
- **R2** Yan etki transaction içinde → tutarsızlık → **event→Hangfire zorunlu** (E5.2).
- **R3** `User`/`Person` çift yazımı → **G8 ADR kilidi** (E2.2, P0).
