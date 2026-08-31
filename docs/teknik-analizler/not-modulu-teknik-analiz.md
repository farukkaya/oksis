# OKSİS — Not (Grades) Modülü · Teknik Analiz (Faz A)

| | |
|---|---|
| **Belge türü** | Teknik analiz (mimari + uygulama tasarımı) |
| **Kapsam** | `oksis-api` (Domain / Application / Infrastructure / Api) + `oksis-ui` (web + mobil sözleşme ve bileşen ağacı) |
| **Girdi** | `claude/not-modulu-ihtiyac-analizi-2026-08-18.html` (K-1…K-12, BR-GR-01…17, §6 yetki, §8 ekran envanteri) |
| **Tarih** | 18 Ağustos 2026 |
| **Durum** | Görüşe açık → onaylanınca dilimlere bölünüp geliştirmeye başlanır |
| **Faz A dışı** | Karne / dönem sonu sonucu (Faz B), push kanalı (ayrı paket), ödev entegrasyonu (V2) |

> **Format notu:** `analysis_standards.md` teknik analizler için `.docx` şart koşuyor; kullanıcı bu belge için açıkça markdown istedi. Kurumsal arşive girecekse `.docx` türevi ayrıca üretilmelidir.

> **Doğrulama notu:** Bu analiz, oturum içinde taranan repo yapısına dayanır. Oturumun ilerleyen kısmında cihaz dosya erişimi (`untrusted_device`) kapandığı için bazı dosyaların gövdesi tekrar okunamadı. Böyle noktalar **`[D]` = doğrulanacak** etiketiyle işaretlendi; geliştirmeye başlamadan önce kapatılmalıdır.

---

## 1. Yönetici Özeti (teknik)

Not modülü **yeni bir altyapı gerektirmiyor**. Yoklama ve Duyuru modüllerinin oturttuğu kalıpların üzerine kuruluyor: Clean Architecture + CQRS + MediatR, sezon/tenant sınırlı sorgular, `PermissionRequirement` + handler-içi kapsam kapısı, domain event → `HangfireNotificationEnqueuer` → `DispatchNotificationJob` zinciri, Hangfire ile dönem kapanış işleri.

Getirdiği yeni şeyler dört başlıkta toplanıyor:

1. **Yeni bir domain modülü** — `Grades`: iki aggregate (`GradeBook`, `Assessment`), bir child entity (`Mark`), bir append-only denetim tablosu (`MarkAmendment`), dört durumlu bir durum makinesi.
2. **Politika çözümleme katmanı** — K-2 kararının teknik karşılığı: ağırlık ve skala artık tek bir yerden, önbelleklenmiş bir `GradePolicySnapshot` üzerinden okunuyor; `ExamType.WeightPercent` hesaptan çıkıyor.
3. **Kapsam kapısı (`IGradeScopeGuard`)** — "hangi öğretmen hangi deftere yazabilir" sorusunun tek yetkili cevabı; RBAC'in üstünde, handler seviyesinde zorunlu.
4. **Üç yeni bildirim olay tipi** ve mevcut `GRADE_PUBLISHED`'in gerçekten üretilmesi.

Tahmini yüzey: **~4 entity, ~11 komut, ~9 sorgu, ~16 endpoint, 3 migration, 4 domain event handler, 2-3 Hangfire job, ~20 web/mobil bileşen.**

---

## 2. Mimari Yerleşim

Modül, mevcut dikey dilim (vertical slice) düzenine birebir uyar. Yeni klasörler:

```
src/Oksis.Domain/Modules/Grades/
├── Entities/           GradeBook.cs · Assessment.cs · Mark.cs · MarkAmendment.cs
├── Enums/              AssessmentStatus.cs · MarkSpecialValue.cs · MarkSource.cs · AmendmentActorKind.cs
├── Events/             AssessmentPublishedEvent.cs · AssessmentUnpublishedEvent.cs · AssessmentLockedEvent.cs
│                       AssessmentUnlockedEvent.cs · MarkAmendedEvent.cs · MarkPublishedLateEvent.cs
├── Exceptions/         GradesDomainException.cs (+ 6 özel türev)
├── Services/           TermAverageCalculator.cs   (saf, bağımlılıksız)
└── ValueObjects/       GradeBookId.cs · AssessmentId.cs · MarkId.cs · GradeScaleSpec.cs · MarkValue.cs

src/Oksis.Application/Modules/Grades/
├── Abstractions/       IGradePolicyResolver.cs · IGradeScopeGuard.cs · IGradeBookRosterReader.cs
│                       IGradeExporter.cs · GradePolicySnapshot.cs
├── Commands/           <KomutAdı>/{Command, CommandHandler, CommandValidator}.cs
├── Queries/            <SorguAdı>/{Query, QueryHandler, Dto}.cs
├── DTOs/               ortak okuma modelleri
├── Events/Notifications/  4 adet bildirim üreten event handler
├── Events/              AcademicTermClosedGradeLockHandler.cs
├── Internal/           GradeScopeGuard.cs · AssessmentSetDeriver.cs · GradeProjections.cs
└── Common/             GradesSeasonScope.cs

src/Oksis.Infrastructure/Grades/
├── GradePolicyResolver.cs      (Redis önbellekli)
├── GradeExporter.cs            (ClosedXML / mevcut xlsx aracı)
└── Dapper/GradeOverviewReader.cs

src/Oksis.Infrastructure/Persistence/Configurations/Grades/  → 4 EF konfigürasyonu
src/Oksis.Api/Controllers/V1/GradesController.cs
```

Ayrıca **mevcut modüllere dokunuşlar**:

| Modül | Dokunuş | Gerekçe |
|---|---|---|
| `Domain/Modules/Academics/Entities/ExamType.cs` | `Category` (Written/Performance) alanı eklenir; `WeightPercent` `[Obsolete]` işaretlenir, okunmaz | K-2 |
| `Domain/Modules/Schools/Entities/SchoolSettings.cs` | `GradeAmendmentWindowHours`, `ShowClassAverageToFamilies` alanları + `UpdateAcademicPolicy` imzası | K-6, K-9 |
| `Domain/Modules/Schools/Entities/` | Yeni `SchoolEducationLevelPolicy` (SchoolId × EducationLevel → `StudentGradeVisibility`) | K-5 |
| `Domain/Modules/Notifications/Enums/NotificationKind.cs` | 3 yeni değer | §8 |
| `Persistence/Seed/MasterData/PermissionSeedData.cs` + `RolePermissionSeedData.cs` + `MasterSeedIds.cs` | `grades.manage`, `grades.report` | §7 |
| `Persistence/Seed/MasterData/NotificationEventTypeSeedData.cs` | `GRADE_PUBLISHED.delivered = true` + 3 yeni satır | §8 |
| `Persistence/Seed/MasterData/ExamTypeSeedData.cs` | `Category` kolonu doldurulur | K-2 |

**Bağımlılık yönü** — Grades tüketicidir, hiçbir mevcut modül Grades'e bağımlı olmaz:

```
Grades ──okur──> Academics (Subject, ExamType, GradeScale, GradeLevel)
       ──okur──> Schools (SchoolSettings, SchoolGradeLevelScale, EducationLevelPolicy)
       ──okur──> AcademicSessions (AcademicTerm, ClassRoom, ClassRoomStudent)
       ──okur──> Timetable (TeacherCourseLoadProjection — X-16 düzeltmesi)
       ──okur──> Users (Person, ParentStudentRelationship)
       ──yazar─> Notifications (event üzerinden, doğrudan değil)
       <──dinler─ AcademicSessions.AcademicTermClosedEvent
```

Cross-aggregate referanslar **yalnız ID iledir** (mevcut konvansiyon). Navigation property açılmaz.

---

## 3. Domain Modeli

### 3.1 Aggregate sınırları ve gerekçesi

| Aggregate | Root mu? | İçindekiler | Neden böyle |
|---|---|---|---|
| `GradeBook` | ✅ | yalnız koordinatlar | Durum taşımaz (ihtiyaç analizi §3). Tembel oluşturulur. İnce tutulması, iki öğretmenin farklı sütunlarda çakışmamasını sağlar. |
| `Assessment` | ✅ | `Mark` koleksiyonu | **Yayın birimi budur (K-3).** Yayınlama tek aggregate içinde tek durum geçişi + tüm hücrelerin görünürlüğünün aynı anda değişmesi demektir. 30 satırlık yük kabul edilebilir. |
| `MarkAmendment` | ✅ | — | Append-only denetim kaydı. Aggregate'e dahil edilseydi her defter açılışında gereksiz yüklenirdi; ayrı root olarak yalnız denetim panelinde okunur. |

> **Kritik tasarım sonucu:** Bir notun görünürlüğü kendi alanı değil, **bağlı olduğu `Assessment`'in durumudur**. BR-GR-06'nın ("yayından sonra girilen hücre doğrudan yayınlanır") bedava gelmesinin sebebi budur — `Mark` eklenirken parent `Published` ise ek bir kural gerekmez, yalnız tekil bildirim olayı yükseltilir.

### 3.2 Entity taslakları

**`GradeBook` : TenantEntity**

- `AcademicSessionId`, `AcademicTermId`, `ClassRoomId`, `SubjectId` (hepsi Guid, cross-aggregate ID)
- `CreateLazy(schoolId, sessionId, termId, classRoomId, subjectId)` — ilk not girişinde üretilir
- Invariant: (SchoolId, SessionId, TermId, ClassRoomId, SubjectId) tekildir → DB filtered unique index

**`Assessment` : TenantEntity**

- `GradeBookId`, `ExamTypeId`, `Status` (`AssessmentStatus`), `ExamDate` (`DateOnly?`)
- `PublishedAt/PublishedBy`, `UnpublishedAt/UnpublishedBy/UnpublishReason`, `LockedAt`, `UnlockedAt/UnlockedBy/UnlockReason`
- `RowVersion` (byte[]) — yayın/kilit yarışları için iyimser kilit
- `IReadOnlyCollection<Mark> Marks`
- Davranışlar: `SetMark(...)`, `SetMarks(...)`, `Publish(actorId, clock)`, `Unpublish(actorId, reason)`, `Lock()`, `Unlock(actorId, reason)`, `ClearDraft()`, `SetExamDate(...)`

**`Mark` (child)**

- `AssessmentId`, `StudentPersonId`, `Value` (`decimal?`), `LetterValue` (`string?`, harf skalası), `SpecialValue` (`MarkSpecialValue`), `Source` (`MarkSource`)
- `EnteredAt/EnteredBy`, `LastAmendedAt/LastAmendedBy`, `AmendmentCount`
- `SetValue(decimal? value, string? letter, MarkSpecialValue special, GradeScaleSpec spec, Guid actorId)` — skala doğrulaması VO içinde

**`MarkAmendment` : TenantEntity**

- `MarkId`, `AssessmentId`, `StudentPersonId`, `OldValueDisplay`, `NewValueDisplay`, `Reason`, `ActorKind` (`AmendmentActorKind`), `ActorId`, `Platform` (`web`/`mobile`), `CorrelationId`

### 3.3 Durum makinesi

```
                 ilk not girilir
   [Empty] ──────────────────────► [Draft]
      ▲                               │
      │  tüm notlar silinir           │ Publish()   (grades.publish + kapsam + dönem açık)
      └───────────────────────────────┤
                                      ▼
                                 [Published] ──── Unpublish() (grades.manage + gerekçe) ──► [Draft]
                                      │
                                      │ AcademicTermClosedEvent  ·  Lock()
                                      ▼
                                  [Locked] ──── Unlock() (grades.manage + gerekçe, sezon arşivde değilse) ──► [Published]
```

Geçersiz her geçiş `GradesDomainException` fırlatır — durum kontrolü **handler'da değil domain'de** yaşar.

### 3.4 Invariant'lar (BR-GR eşlemesi)

| Kod | Invariant | Nerede zorlanır |
|---|---|---|
| INV-GR-01 | Defter (school, session, term, classRoom, subject) için tekil | DB filtered unique index + handler idempotency |
| INV-GR-02 | Assessment (bookId, examTypeId) için tekil | DB filtered unique index |
| INV-GR-03 | Mark (assessmentId, studentPersonId) için tekil | DB filtered unique index |
| INV-GR-04 | Not değeri kademeye çözülen skalanın aralığında | `MarkValue` VO + `GradeScaleSpec` |
| INV-GR-05 | `SpecialValue != None` ise `Value` ve `LetterValue` null | `Mark.SetValue` |
| INV-GR-06 | Yayın için en az bir not girilmiş olmalı | `Assessment.Publish` |
| INV-GR-07 | `Published`/`Locked` durumda değer değişimi gerekçesiz olamaz (min 5 karakter) | `Assessment.SetMark` + validator |
| INV-GR-08 | Pencere dışında öğretmen yazamaz | `IGradeScopeGuard` + `Assessment` (pencere değeri parametre olarak girer) |
| INV-GR-09 | `Locked` durumda yalnız `Unlock` çağrılabilir | `Assessment` |
| INV-GR-10 | Arşiv sezonda hiçbir yazma geçmez | `ActiveSeasonWritePolicy` (API) + handler ikinci kontrol |
| INV-GR-11 | Ortalama yalnız `Published`/`Locked` notlardan; G/M hariç | `TermAverageCalculator` |
| INV-GR-12 | Pasif (şubeden ayrılmış) öğrenciye yeni not girilemez | handler + roster okuma |

### 3.5 Hata sözleşmesi (ProblemDetails / RFC 9457)

| `errorCode` | HTTP | Ne zaman |
|---|---|---|
| `Grades.Scope.NotAssigned` | 403 | Öğretmenin bu şube×ders için aktif görevlendirmesi yok |
| `Grades.Scope.ChildNotLinked` | 403 | Veli–öğrenci bağı yok veya `CanViewInfo=false` |
| `Grades.Assessment.NotDraft` | 409 | Taslak olmayan sütunda taslak işlemi |
| `Grades.Assessment.Locked` | 409 | Kilitli sütunda yazma |
| `Grades.Assessment.Empty` | 409 | Boş sütun yayınlanmaya çalışıldı |
| `Grades.Assessment.AlreadyPublished` | 409 | Çift yayın (idempotent yanıt tercih edilirse 200) |
| `Grades.Mark.OutOfScale` | 400 | Skala dışı değer |
| `Grades.Mark.ConcurrentUpdate` | 409 | İyimser kilit çakışması |
| `Grades.Amendment.WindowExpired` | 403 | Pencere dolmuş, aktör öğretmen |
| `Grades.Amendment.ReasonRequired` | 400 | Gerekçe boş/kısa |
| `Grades.Term.Closed` | 409 | Dönem kapalı |

---

## 4. Politika Çözümleme (K-2'nin teknik karşılığı)

### 4.1 `GradePolicySnapshot`

Tek okuma modeli; tüm hesap ve doğrulama bunu tüketir:

```
GradePolicySnapshot
├── GradeScaleSpec  { Min, Max, AllowedLetters[], PassValue, IsLetterScale }
├── PassingScore            decimal
├── RoundingRule            GradeRoundingRule
├── WrittenWeight           int      (INV-POL-1: + PerformanceWeight = 100)
├── PerformanceWeight       int
├── WrittenExamCount        int      (1-3)
├── PerformanceCount        int      (1-3)
├── AmendmentWindowHours    int      (1-72)
├── StudentGradeVisibility  enum     (Hidden | SameAsParent)  — EducationLevel bazlı
└── ShowClassAverageToFamilies bool
```

### 4.2 Çözümleme zinciri

```
(schoolId, gradeLevelId) verildiğinde:

skala & geçme notu:
  SchoolGradeLevelScale(schoolId, gradeLevelId)     ← 1. öncelik (BR-SS-011)
  → SchoolSettings.DefaultGradeScaleId / DefaultPassingScore
  → master GradeScale varsayılanı (TR_100)

ağırlık & sayı & pencere & kıyas:
  SchoolSettings                                     ← tek kaynak (K-2)

öğrenci görünürlüğü:
  SchoolEducationLevelPolicy(schoolId, educationLevel)
  → varsayılan: Primary=Hidden, Secondary/HighSchool=SameAsParent
```

`gradeLevelId` → `EducationLevel` dönüşümü mevcut `EducationLevelClassifier` ile yapılır.

**`ExamType.WeightPercent` hiçbir kod yolunda okunmaz.** Kaldırılmaz ama `[Obsolete("K-2: ağırlık okul politikasından çözülür", error: false)]` işaretlenir; mimari testte "Grades katmanı bu property'ye referans veremez" kuralı yazılır.

### 4.3 Ortalama hesabı — `TermAverageCalculator` (saf domain servisi)

```
Girdi : Mark[] (yalnız Published/Locked, G/M hariç), her birinin ExamType.Category'si,
        GradePolicySnapshot, beklenen sütun seti
Çıktı : { Value decimal?, IsProvisional bool, MissingBuckets[] }

1. Notları kovaya ayır: Written, Performance
2. Her kova için ortalama al
3. Ağırlıklandır:  ort = Σ (kovaAğırlığı/100 × kovaOrtalaması)
4. Bir kovada hiç yayınlanmış not yoksa:
   → o kovanın ağırlığı, not içeren kovalar arasında oranlı dağıtılır
   → IsProvisional = true
5. Beklenen tüm sütunlar yayınlanmadıysa IsProvisional = true
6. RoundingRule yalnız sunum anında uygulanır; ara hesap yuvarlanmaz
```

> **Karar T-1 (yeni):** Eksik kovanın ağırlığı **yeniden dağıtılır**, sıfır sayılmaz. Sıfır saymak, henüz performans notu girilmemiş bir öğrencinin ortalamasını yapay olarak düşürür ve veli tarafında yanlış alarm üretir. Sonuç `IsProvisional` ile etiketlendiği için ekranlarda "geçici" ibaresi zorunludur. Faz B'de karne ortalaması bu davranışı **kullanmaz** — orada eksik sütun idare kararına düşer.

### 4.4 Önbellek

`IGradePolicyResolver` → Redis, anahtar `grades:policy:{schoolId}:{educationLevel}:{gradeLevelId}`, TTL 15 dk.
Geçersizleme: mevcut `AcademicPolicyUpdatedEvent` ve `SchoolGradeLevelScaleChangedEvent` handler'ları anahtar önekini siler. `SchoolSettings` sürüm damgası anahtara eklenerek yarış durumu kapatılır.

---

## 5. Kalıcılık (Persistence)

### 5.1 Tablolar ve indeksler

| Tablo | Anahtar indeksler |
|---|---|
| `grade_books` | UQ filtered `(SchoolId, AcademicSessionId, AcademicTermId, ClassRoomId, SubjectId) WHERE IsDeleted = 0` · IX `(SchoolId, AcademicTermId, ClassRoomId)` |
| `assessments` | UQ filtered `(GradeBookId, ExamTypeId) WHERE IsDeleted = 0` · IX `(SchoolId, AcademicTermId, Status, ExamDate)` — tamamlanma panosu için · `RowVersion` |
| `marks` | UQ filtered `(AssessmentId, StudentPersonId) WHERE IsDeleted = 0` · IX `(StudentPersonId, AssessmentId)` — öğrenci/veli okuma yolu |
| `mark_amendments` | IX `(MarkId, CreatedAt DESC)` · IX `(SchoolId, AssessmentId)` |
| `school_education_level_policies` | UQ `(SchoolId, EducationLevel)` |

Tüm tablolar `TenantEntity` → global query filter ile `SchoolId` + soft delete otomatik uygulanır (mevcut interceptor).

### 5.2 Tip kararları

- `Mark.Value` → `decimal(5,2)` (100'lük ve 5'lik skala; virgüllü not ihtimali için)
- `Mark.LetterValue` → `nvarchar(2)`
- `MarkAmendment.Reason` → `nvarchar(500)`, zorunlu
- `Assessment.RowVersion` → `rowversion`

### 5.3 Migration planı

| # | Migration | İçerik |
|---|---|---|
| 1 | `AddExamTypeCategory` | `exam_types.Category` + seed güncellemesi (`ExamTypeSeedData`) |
| 2 | `AddGradePolicyFields` | `school_settings`: `GradeAmendmentWindowHours` (default 48), `ShowClassAverageToFamilies` (default 0) + `school_education_level_policies` tablosu ve seed'i |
| 3 | `AddGradesModule` | 4 tablo + indeksler |
| 4 | `SeedGradesPermissionsAndNotificationTypes` | `grades.manage`, `grades.report`, 3 bildirim olay tipi, `GRADE_PUBLISHED.delivered = true` |

Migration'lar geri alınabilir olmalı; `AddGradesModule` down'ı tabloları düşürür (veri henüz üretimde yok).

### 5.4 Dapper kullanımı

Proje kuralı: Dapper yalnız karmaşık/yüksek performanslı sorgular için. Not modülünde **iki yer** için izin verilir, gerekçesiyle:

1. **`GetGradeEntryOverview`** (idare tamamlanma panosu) — şube × ders × sütun matrisi, okul genelinde yüzlerce satırın agregasyonu. EF ile yazıldığında çoklu `GroupBy` + `LEFT JOIN` ağacı üretiyor ve N+1 riski taşıyor.
2. **`GetStudentTermTranscript`** (öğrenci/veli tüm dersler görünümü) — tek öğrenci için ders × sütun düzleştirmesi; sık çağrılan mobil uç.

Diğer tüm sorgular EF Core + `AsNoTracking()` + projeksiyon (`GradeProjections`) ile yazılır. Mapster yalnız DTO dönüşümlerinde; AutoMapper kullanılmaz.

---

## 6. Uygulama Katmanı — Komut ve Sorgu Envanteri

### 6.1 Komutlar

| # | Komut | İzin | Kapsam | Notlar |
|---|---|---|---|---|
| C-01 | `SetMark` | `grades.write` | yazma | Tek hücre. Taslakta serbest; yayınlanmışta gerekçe zorunlu (amend yoluna düşer); boş hücreye yayın sonrası giriş `MarkPublishedLateEvent` yükseltir |
| C-02 | `SetMarksBulk` | `grades.write` | yazma | Izgara/liste toplu kayıt; kısmi başarı **yok** — tek transaction, tümü ya da hiçbiri |
| C-03 | `AmendMark` | `grades.write` (pencere içi) / `grades.manage` (dışı) | yazma | Gerekçe zorunlu, `MarkAmendment` yazar, `MarkAmendedEvent` yükseltir |
| C-04 | `PublishAssessment` | `grades.publish` | yazma | `Draft → Published`; `AssessmentPublishedEvent` |
| C-05 | `UnpublishAssessment` | `grades.manage` | okul geneli | Gerekçe zorunlu; `AssessmentUnpublishedEvent` |
| C-06 | `LockAssessment` | `grades.manage` / sistem | — | Dönem kapanışında job üzerinden toplu |
| C-07 | `UnlockAssessment` | `grades.manage` | okul geneli | Gerekçe zorunlu; arşiv sezonda reddedilir |
| C-08 | `SetAssessmentExamDate` | `grades.write` | yazma | Gecikme hesabının ve bildirim metninin girdisi |
| C-09 | `ClearAssessmentDraft` | `grades.write` | yazma | Yalnız `Draft`; yıkıcı, onay UI'da |
| C-10 | `SendGradeEntryReminder` | `grades.manage` | okul geneli | Tekil ve toplu; `GRADE_ENTRY_REMINDER` üretir |
| C-11 | `ExportGradeBook` | `grades.read` | okuma | Öğretmen tek defter; senkron xlsx |
| C-12 | `ExportSchoolGrades` | `grades.manage` | okul geneli | Hangfire job + `Files` modülüne yazar |

Her komut klasöründe `Command.cs`, `CommandHandler.cs`, `CommandValidator.cs` (FluentValidation) bulunur. Tüm handler'lar `async` ve `CancellationToken` alır.

### 6.2 Sorgular

| # | Sorgu | İzin | Kim | Döndürdüğü |
|---|---|---|---|---|
| Q-01 | `GetMyGradeBooks` | `grades.read` | Öğretmen | Defter listesi + sütun durumları + ilerleme + gecikme bayrağı |
| Q-02 | `GetGradeBook` | `grades.read` | Öğretmen / idare / rehber öğrt. | Roster + sütunlar + hücreler + `GradePolicySnapshot` + kalan pencere |
| Q-03 | `GetAssessmentAudit` | `grades.manage` | İdare | Denetim izi zaman çizelgesi |
| Q-04 | `GetGradeEntryOverview` | `grades.report` | İdare | Tamamlanma matrisi (Dapper) |
| Q-05 | `GetGradeEntrySummary` | `grades.report` | İdare | Dashboard kartı: %, geciken, bekleyen öğretmen |
| Q-06 | `GetStudentTermGrades` | `grades.read` | Öğrenci / veli / idare / öğretmen(kapsamlı) | Ders × sütun + ders ortalaması (`IsProvisional`) (Dapper) |
| Q-07 | `GetStudentSubjectDetail` | `grades.read` | aynı | Tek ders detayı + yayın/güncelleme zamanları |
| Q-08 | `GetClassAverageForFamilies` | `grades.read` | Öğrenci / veli | **Yalnız `ShowClassAverageToFamilies = true` ise**; kapalıysa handler `null` döner, uç 200 + boş |
| Q-09 | `GetTeacherPendingGradeEntries` | `grades.read` | Öğretmen | Anasayfa görev kartı sayacı |

### 6.3 Kritik handler akışları

**`PublishAssessmentCommandHandler`**

```
1. Assessment'i Marks ile yükle (tracking)
2. IGradeScopeGuard.EnsureCanWriteAsync(bookId)         → 403
3. Dönem/sezon kontrolü (AcademicTerm.Status)           → 409
4. assessment.Publish(actorId, clock)                    → domain invariant'lar
5. SaveChanges (RowVersion çakışması → 409)
6. AssessmentPublishedEvent → MediatR notification
7. Handler bildirim alıcılarını çözer, TEK Hangfire job kuyruğa alır
```

**`SetMarksBulkCommandHandler`**

```
1. Kapsam kontrolü
2. GradePolicySnapshot çöz (önbellek)
3. Roster oku → gönderilen studentId'ler roster'da mı, pasif mi
4. Her değer için MarkValue doğrulaması → ilk hatada tüm işlem reddedilir,
   hatalı satırlar ProblemDetails.extensions["invalidMarks"] içinde döner
5. Assessment Published ise: değişen hücreler amend yoluna girer (gerekçe zorunlu),
   yeni hücreler MarkPublishedLateEvent yükseltir
6. Tek transaction
```

> **Karar T-2 (yeni):** Toplu girişte **kısmi kayıt yok.** Otomatik kaydetmenin debounce'ı istemci tarafında; sunucuda "28'i kaydedildi, 2'si hatalı" durumu üretmiyoruz. Gerekçe: ızgara ekranında kısmi başarı, öğretmenin hangi hücrenin gerçekten yazıldığını bilememesine yol açar ve not gibi hukuki sonuçlu bir veride kabul edilemez.

---

## 7. Yetki Modeli — Uygulama Tasarımı

### 7.1 Dört katman, dört ayrı mekanizma

| Katman | Mekanizma | Nerede |
|---|---|---|
| 1. RBAC | `[Authorize(Policy = "grades.write")]` → `PermissionRequirement` → `IPermissionReader` (Redis + DB) | API attribute |
| 2. Kapsam | `IGradeScopeGuard` | Application handler — **her komut ve sorguda zorunlu** |
| 3. Durum | Domain durum makinesi | `Assessment` entity |
| 4. Zaman | `AmendmentWindowHours` karşılaştırması | `Assessment.SetMark` (pencere parametre olarak girer) |

### 7.2 Yeni izin kodları

`PermissionSeedData` + `MasterSeedIds.Permissions` + `RolePermissionSeedData`:

| Kod | Modül/Aksiyon | Roller |
|---|---|---|
| `grades.manage` | GRADES / MANAGE | **yalnız** `SCHOOL_ADMIN` |
| `grades.report` | GRADES / REPORT | `SCHOOL_ADMIN`, `SUPER_ADMIN` |

`AllPermissionIds()` kataloğu (SuperAdmin) için öneri: `GradesRead` + `GradesReport` kalır, **`GradesWrite` ve `GradesPublish` çıkarılır** — `attendance.manage` için 2026-07-22'de verilen "platform hesabı okul içi karar veremez" ilkesiyle tutarlı. `grades.manage` zaten katalog dışında. *(Açık soru 1 — onayınıza bağlı; onaylanmazsa seed değişmez.)*

### 7.3 `IGradeScopeGuard` sözleşmesi

```
EnsureCanWriteBookAsync(bookId, ct)
EnsureCanWriteBookAsync(classRoomId, subjectId, termId, ct)   // defter henüz yokken
EnsureCanReadBookAsync(bookId, ct)
EnsureCanReadStudentAsync(studentPersonId, ct)
GetWritableBookFilterAsync(ct)     // liste sorguları için IQueryable predicate
```

> [!warning] X-16 · Bu bölüm 2026-08-31'de DÜZELTİLDİ — analiz emekli bir tabloya dayanıyordu
> Kapsam kaynağı burada `TeachingAssignment` yazıyordu. **`src/Oksis.Domain` altında öyle
> bir entity YOK:** `X-15` kapatılırken (`b278415` — *"K-10 v1 teaching_assignments emekli
> edildi"*, **18 Ağustos**, yani bu analizin yazıldığı gün) tablo düşürüldü. Analiz o
> merge'den önceki repoyu taramıştı.
>
> **Bugünkü tek kaynak `TeacherCourseLoadProjection`'dır** — *"hangi öğretmen hangi şubede
> hangi dersi kaç saat veriyor?"* sorusunun tek cevabı — ve **canlı ders programının
> yerleşimlerinden** türer (`IsActive && IsReserving`), sezon değil **dönem** kapsamlıdır.
> Analizde tarif edilen `RevokedAt` süzgeci artık anlamsızdır.
>
> **Bağlayıcı ürün kararı (`K-12` §C8):** yazma yetkisi **yayınlanmış programa bağlıdır**.
> Taslak program slot rezerve etmez (`IsReserving == false`), dolayısıyla programını
> yayınlamamış bir okulda **hiçbir öğretmen not giremez** ve bu **bilinçli bir kuraldır**.
> İkinci bir kapsam kaynağı (`subject_teacher_assignments` yetkinliği) kabul EDİLMEDİ.
> ⚠️ Kuralın sonucu **ekranda görünmek zorundadır**: öğretmen "not giremiyorum" dediğinde
> sebebini okuyabilmelidir, yoksa `X-17`'nin şikâyet ettiği yanlış teşhis kalıbı not
> modülünde yeniden doğar.
>
> **Defterin kimliği** kalıcı bir satır değil, bileşik anahtardır
> (`TeacherCourseLoadProjection.CourseKey(classRoomId, subjectId)`); `GradeBook`'un
> koordinatlarıyla (`classRoomId`, `subjectId`, `termId`) birebir örtüşür ama biçim **tek
> yerde** yaşamalıdır ([[serilesmis-sekil-sozlesmedir]]).

Uygulama kuralları:

| Aktör | Yazma | Okuma |
|---|---|---|
| Öğretmen | `TeacherCourseLoadProjection.ForTeacherAsync(...)` — **canlı ders programının yerleşimlerinden** türer (`IsActive && IsReserving`), **dönem** kapsamlı (`R-09`) | aynı defterler + geçmiş dönemlerdeki aynı dersler |
| Rehber öğretmen | yalnız kendi verdiği dersler | `ClassRoom.HomeroomTeacherId = me` → şubenin tüm derslerinin **yalnız `Published`/`Locked`** notları |
| Okul yöneticisi | `grades.manage` gerektiren uçlarda okul geneli | okul geneli, taslaklar dahil |
| Veli | — | `ParentStudentRelationship` aktif **ve** `CanViewInfo = true` |
| Öğrenci | — | `PersonId = studentPersonId` **ve** `StudentGradeVisibility != Hidden` |

> **Not:** Veli tarafında route seviyesinde mevcut `ChildScopeRequirement` (ABAC) kullanılır; sorgu seviyesinde `IGradeScopeGuard` ikinci kez doğrular. Çift kontrol bilinçlidir — route parametresi olmayan uçlarda (aktif çocuk session'dan geliyor) ilki devreye girmez.

> **`[D]` Doğrulanacak:** `NotificationRecipientResolver.ResolveGuardianAccountsAsync` `CanViewInfo` süzüyor mu? Süzmüyorsa bildirim yolu kapsam kapısını atlar ve KVKV ihlali üretir. Bu, geliştirmeye başlamadan önce kapatılması gereken tek **bloklayıcı** maddedir.

---

## 8. Bildirimler

### 8.1 Olay tipleri

| `EventKey` | Durum | Grup | Kanal (varsayılan) | Tetik |
|---|---|---|---|---|
| `GRADE_PUBLISHED` | seed'li, `delivered: false` → **`true` yapılacak** | Academic | portal + e-posta | `AssessmentPublishedEvent`, `MarkPublishedLateEvent` |
| `GRADE_UPDATED` | **yeni** | Academic | portal + e-posta | `MarkAmendedEvent` |
| `GRADE_UNPUBLISHED` | **yeni** | Academic | portal + e-posta | `AssessmentUnpublishedEvent` |
| `GRADE_ENTRY_REMINDER` | **yeni** | Academic | portal | `SendGradeEntryReminder` |
| `REPORT_CARD_PUBLISHED` | seed'li | Academic | — | Faz B, dokunulmaz |

`NotificationKind` enum'una karşılık gelen değerler eklenir.

### 8.2 Fan-out ve idempotency

Bir sütun yayınlandığında: 30 öğrenci × ~1.6 veli + 30 öğrenci ≈ **~80 bildirim**.

- **Tek Hangfire job** kuyruğa alınır (`DispatchGradePublishedJob(assessmentId)`), 80 ayrı job değil. Mevcut `HangfireNotificationEnqueuer` bu şekilde kullanılır.
- Alıcı çözümleme job içinde yapılır — komut transaction'ını uzatmaz.
- **Idempotency:** yalnız `Draft → Published` geçişi olay yükseltir; ayrıca `NotificationDeliveryLog` üzerinde dedupe anahtarı `grade:assessment:{id}:published:{recipientId}`. Job yeniden denenirse ikinci bildirim gitmez.
- **Sessiz saatler** okul `NotificationConfig`'inden dispatcher'da uygulanır. *(Bilinen boşluk: bugün config gönderim yolunda okunmuyor — bildirim teslim paketiyle birlikte kapanmalı; kapanmazsa yayın gece yarısı veliye ulaşır.)*
- **Metin kuralı:** bildirim gövdesinde **not değeri geçmez** (R5). Şablon: `"{Ders} — {Sınav} notunuz yayınlandı."`

### 8.3 Gürültü

Aynı akşam 5 ders yayınlarsa veli 5 bildirim alır. Faz A'da kabul; ölçüm için `NotificationDeliveryLog` üzerinden "veli başına günlük bildirim" metriği toplanır. Birleştirme (günlük özet) Faz B adayı — yoklamadaki `DailySummaryJob` emsali kullanılır.

---

## 9. Arka Plan İşleri, Gerçek Zaman, Önbellek

### 9.1 Hangfire

| Job | Tetik | İş |
|---|---|---|
| `LockAssessmentsOnTermCloseJob` | `AcademicTermClosedEvent` | Dönemin tüm `Published` sütunlarını `Locked` yapar; toplu, sayfalı |
| `DispatchGradeNotificationJob` | Komut handler'ları | Alıcı çözümleme + kanal dağıtımı |
| `SchoolGradeExportJob` | `ExportSchoolGrades` | Okul geneli xlsx üretir, `Files` modülüne yazar, hazır olunca bildirim |
| `GradeEntryReminderSweepJob` *(opsiyonel)* | Günlük cron | Sınav tarihi +N gün geçmiş Boş/Taslak sütunlar için öğretmene hatırlatma |

> **Öneri:** `GradeEntryReminderSweepJob` **Faz A'da yazılmaz**. Manuel "Hatırlat" yeterli; otomatik süpürme, sınav tarihi opsiyonel olduğu için yanlış pozitif üretir. *(Açık soru 3.)*

### 9.2 SignalR

Faz A'da **gerekli değil**. İki öğretmenin aynı deftere yazması nadir; çözüm iyimser kilit + `Grades.Mark.ConcurrentUpdate` (409) ve istemcide "yenile" uyarısı. Canlı ızgara senkronizasyonu maliyeti değerinden yüksek. *(Açık soru 5.)*

### 9.3 Redis

- `GradePolicySnapshot` — TTL 15 dk, olayla geçersizleme
- `IPermissionReader` — mevcut, dokunulmaz
- Roster (`ClassRoomStudent`) önbelleklenmez; nakil anında yanlış liste göstermek riskli

---

## 10. Gözlemlenebilirlik

**Serilog, yapılandırılmış, `Console.WriteLine` yok.** Her yazma yolunda zorunlu alanlar:

```csharp
_logger.LogInformation(
    "{Class}.{Method} published assessment {AssessmentId} for {GradeBookId} " +
    "with {MarkCount} marks by {ActorId} in {SchoolId}",
    className, methodName, assessmentId, gradeBookId, markCount, actorId, schoolId);
```

- Correlation ID mevcut middleware'den taşınır; `MarkAmendment.CorrelationId` alanına da yazılır — bir düzeltmenin hangi istekten geldiği Kibana'da izlenebilir.
- **Log ≠ denetim izi.** `mark_amendments` hukuki kayıttır ve saklama politikasına tabidir; Serilog yalnız teşhis içindir. İkisi karıştırılmaz.
- Metrikler: yayın sayısı, düzeltme oranı, kapsam reddi (403) sayısı, ortalama giriş süresi (istemci telemetrisi), bildirim/veli/gün.

---

## 11. Frontend Sözleşmesi ve Bileşen Ağacı

### 11.1 Sözleşme stratejisi

Sözleşme otoritesi `packages/api/src/generated/schema.ts` (codegen). Backend uçları merge edilene kadar **mock-first** kalıbı:

```
packages/api/src/grades/contract.ts        ← module augmentation (declare module "../generated/schema")
packages/api-mocks/grades-handlers.ts      ← MSW, path'ler */api/v1/grades/...
packages/api-mocks/grades-data.ts
packages/core/src/grades/                  ← ASSESSMENT_STATUS_CONFIG, etiketler, tip yardımcıları
```

> **Uyarı (yoklamadan alınan ders):** Attendance'ta el yazımı `contract.ts` augmentation'ları ve seed'de olmayan izinler kaldı. Grades için **çıkış kriteri**: codegen geldiği gün `grades/contract.ts` silinir ve izinler seed'den doğrulanır. Bu, dilim tanımına yazılır, "sonra bakarız" listesine değil.

### 11.2 Web (`apps/web`)

```
app/(dashboard)/grades/page.tsx              → rol ayrımı: öğretmen listesi | idare panosu
app/(dashboard)/grades/[bookId]/page.tsx     → defter ızgarası
features/grades/
├── grade-books-page.tsx          W-01
├── grade-book-grid.tsx           W-02  (sticky ilk sütun + sticky ortalama sütunu)
├── grade-cell.tsx                W-02  (7 hücre state'i)
├── assessment-status-chip.tsx    ortak bileşen
├── publish-dialog.tsx            W-03
├── amend-dialog.tsx              W-04
├── overview-page.tsx             W-05  (tablo + ısı haritası sekmesi)
├── admin-book-view.tsx           W-06
├── audit-panel.tsx               W-06
├── grades-labels.ts              Türkçe metinler
└── index.ts
```

Ek dokunuşlar: `features/students/` → Notlar sekmesi (W-07) · `features/settings/policy-tab.tsx` → 3 alan (W-08) · `features/permissions/permissions-labels.ts` (W-09) · `features/dashboard/` → Not Girişi kartı (W-10).

### 11.3 Mobil (`apps/mobile`)

```
src/app/(tabs)/grades.tsx                 → rol ayrımı (öğretmen | öğrenci | veli)
src/app/grades/[bookId].tsx               M-02
src/app/grades/course/[id].tsx            M-06 / M-08
src/features/grades/
├── components/teacher-books-screen.tsx   M-01
├── components/grade-entry-screen.tsx     M-02  (sayısal klavye + aksesuar çubuğu)
├── components/publish-sheet.tsx          M-03
├── components/amend-sheet.tsx            M-04
├── components/student-grades-screen.tsx  M-05
├── components/course-detail-screen.tsx   M-06
├── components/parent-grades-screen.tsx   M-07  (çocuk seçici + M-05)
├── components/status-chip.tsx
├── lib/grade-toast.ts
└── index.ts
```

Ek dokunuşlar: bildirim satırları (M-09), öğretmen/öğrenci anasayfa blokları (M-10/M-11), akademik politika ekranı (M-13), yönetici özet kartı (M-14). Veli anasayfası **değişmez** (M-12).

### 11.4 Performans notu

Web ızgarası 30 satır × 6 sütun = 180 kontrollü input. Her tuş vuruşunda tüm ızgaranın render olmaması için hücre state'i **hücre bazında izole** tutulur (uncontrolled input + ref, ya da satır bazlı memo). Otomatik kaydetme 600 ms debounce, sütun bazında toplu PATCH.

---

## 12. Test Stratejisi

| Katman | Kapsam | Örnek |
|---|---|---|
| **Domain unit** | Durum makinesi tam matrisi (4 durum × 6 geçiş), skala doğrulaması, G/M dışlaması, pencere hesabı | `Publish_WhenEmpty_Throws`, `SetMark_WhenLocked_Throws` |
| **Domain unit** | `TermAverageCalculator`: eksik kova yeniden dağıtımı, G/M, yuvarlama, harf skalası | `Average_WhenPerformanceBucketEmpty_RedistributesWeight` |
| **Application unit** | Her handler: mutlu yol + kapsam reddi + durum reddi + doğrulama reddi | `PublishAssessment_WhenNotAssigned_Throws403` |
| **Integration** | Tenant izolasyonu, filtered unique index davranışı, iyimser kilit çakışması | `Publish_Concurrent_SecondFails` |
| **Integration** | Yayın → `notifications` + `notification_delivery_logs` satırları; **çift yayın tek bildirim** | `Publish_Twice_DoesNotDuplicateNotifications` |
| **Integration** | **IDOR:** veli B'nin çocuğunun notunu veli A okuyamaz; `CanViewInfo=false` bildirim de almaz | `GetStudentGrades_ForUnlinkedParent_Returns403` |
| **Integration** | Dönem kapanışı → tüm sütunlar `Locked` | `TermClose_LocksAllAssessments` |
| **Architecture** | Grades Domain'i Infrastructure'a referans vermez; `ExamType.WeightPercent` Grades'te okunmaz | mevcut `Oksis.Tests/Architecture` |
| **E2E (yeni)** | Öğretmen girer → yayınlar → veli görür | Playwright; **projedeki ilk E2E** — altyapı kurulumu dilime dahil |

Backend hedefi mevcut disiplinle uyumlu: her handler için en az bir mutlu yol + bir ret senaryosu.

---

## 13. Dilimleme ve Bağımlılıklar

| Dilim | İçerik | Bağımlı | Çıkış kriteri |
|---|---|---|---|
| **G-0** | `ExamType.Category`, izin seed'leri, `SchoolSettings` 3 alan, `SchoolEducationLevelPolicy`, bildirim tipleri | — | Migration'lar geçti, seed doğrulandı |
| **G-1** | Domain: entity'ler, durum makinesi, VO'lar, `TermAverageCalculator` + domain testleri | G-0 | Durum matrisi testleri yeşil |
| **G-2** | Persistence: EF konfigürasyonları, migration, indeksler | G-1 | Integration testleri yeşil |
| **G-3** | `IGradePolicyResolver` + Redis + geçersizleme | G-0 | Politika değişimi önbelleği düşürüyor |
| **G-4** | `IGradeScopeGuard` + kapsam testleri | G-2 | IDOR testleri yeşil |
| **G-5** | Okuma uçları: Q-01, Q-02 | G-3, G-4 | Öğretmen defterini API'den görüyor |
| **G-6** | Yazma uçları: C-01, C-02, C-08, C-09 | G-5 | Toplu giriş çalışıyor |
| **G-7** | Yayın + bildirim: C-04, event handler, job | G-6 | Yayın sonrası bildirim satırı oluşuyor |
| **G-8** | Düzeltme + denetim: C-03, Q-03 | G-7 | Pencere kuralı ve iz doğrulandı |
| **G-9** | İdare: C-05, C-06, C-07, C-10, Q-04, Q-05 | G-8 | Pano gerçek veriyle |
| **G-10** | Aile okuma: Q-06, Q-07, Q-08 + görünürlük politikası | G-7 | Gizli kademede öğrenci göremiyor |
| **G-11** | Dışa aktarım: C-11, C-12 | G-9 | xlsx üretiliyor |
| **G-12** | Web UI (W-01…W-10) | G-9, tasarım | Izgara klavye akışı kabul edildi |
| **G-13** | Mobil UI (M-01…M-14) | G-10, tasarım | Öğretmen mobil girişi kabul edildi |
| **G-14** | E2E + sertleştirme + `contract.ts` temizliği | G-12, G-13 | Codegen tek otorite |

Kritik yol: **G-0 → G-1 → G-2 → G-4 → G-5 → G-6 → G-7**. Tasarım (Claude Design çıktısı) G-12/G-13'ü besler ve paralel ilerleyebilir.

---

## 14. Riskler (teknik)

| Risk | Etki | Önlem |
|---|---|---|
| `NotificationRecipientResolver` `CanViewInfo` süzmüyorsa | Bildirim yolu kapsam kapısını atlar → KVKK ihlali | **`[D]` bloklayıcı**: G-0 öncesi doğrula, gerekirse resolver'a süzgeç ekle + integration testi |
| İki ağırlık kaynağının kodda kalması | Farklı ortalama sonuçları | `[Obsolete]` + mimari testi (G-1 çıkış kriteri) |
| Izgara render performansı | 180 input, tuş başına tam render → öğretmen yavaşlık hisseder | Hücre bazlı izolasyon + debounce; G-12'de ölçüm |
| Bildirim fan-out'unun transaction'ı uzatması | Yayın butonu geç yanıt verir | Alıcı çözümleme job içinde, komut yalnız job kuyruğa alır |
| Politika değişiminin geriye dönük ortalama kayması | Veli aynı notta farklı ortalama görür | BR-GR-02/04: yalnız `Empty` sütunlar yeniden türetilir; Faz B karnede politika snapshot'ı alınır |
| Mock-first drift (attendance tekrarı) | Sözleşme iki yerde yaşar | G-14 çıkış kriteri: `contract.ts` silinmeden dilim kapanmaz |
| Push kanalının gecikmesi | "Veli bildirim alıyor" kriteri yarım kalır | E-posta ile ara çözüm; kanal paketi paralel planlanır |

---

## 15. Açık Teknik Sorular

| # | Soru | Öneri |
|---|---|---|
| T-Q1 | `Mark` hangi kimliği referanslar — `PersonId` mi, `StudentProfile`/`ClassRoomStudent` id mi? | **`PersonId`** — `ParentStudentRelationship.StudentPersonId` ve `NotificationRecipientResolver` aynı kimliği kullanıyor; tutarlılık için. **`[D]`** |
| T-Q2 | `NotificationRecipientResolver` `CanViewInfo` süzüyor mu? | Doğrulanacak; süzmüyorsa süzgeç eklenir (bloklayıcı) |
| T-Q3 | SuperAdmin'den `grades.write/publish` alınsın mı? | Evet — `attendance.manage` kararıyla tutarlı |
| T-Q4 | Sınav tarihi zorunlu mu? | Opsiyonel; girildiyse gecikme hesabı ve bildirim metni kullanır |
| T-Q5 | Öğrenci görünürlüğü `SchoolSettings` kolonları mı, ayrı tablo mu? | Ayrı tablo (`school_education_level_policies`) — `EducationLevel` büyüyebilir (Anaokulu) |
| T-Q6 | Dönem yeniden açma (reopen) akışı bugün var mı? | **`[D]`** Yoksa kilit tek yönlü olur; `UnlockAssessment` bunu telafi eder ama dönem seviyesinde bir "yeniden aç" gerekebilir |
| T-Q7 | Excel dışa aktarımda taslak sütunlar dahil mi? | Öğretmen dosyasında dahil ("taslak" işaretli), idare okul-geneli dosyasında hariç |
| T-Q8 | Nakil gelen öğrencinin önceki notları (BR-GR-16) | Faz A'da manuel giriş, `MarkSource.Transfer` işaretiyle; otomasyon V2 |

---

## 16. Sonraki Adım

1. **`[D]` maddelerini kapat** (özellikle T-Q2 — bloklayıcı) ve T-Q3'ü onayla.
2. Bu belge onaylanınca **G-0 dilimi** açılır: master data + politika alanları + izin/bildirim seed'leri. Tek başına düşük riskli, geri alınabilir ve sonraki her dilimin önkoşulu.
3. Tasarım tarafı paralel yürür: Claude Design çıktısı `handoff-web` / `handoff-mobile` skill'lerinden geçirilir; token ve tip ölçeği uyumu handoff kapılarında denetlenir.
4. Modül backend'i tamamlandığında `domain-map` skill'i çalıştırılır — `Not Defteri`, `Değerlendirme`, `Not` kavramları vault'a işlenir.
