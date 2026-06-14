# Görevlendirme Hub'ı (Sınıf-Merkezli) — Tasarım Spec'i

**Kapsam:** Akademik / Görevlendirmeler sınıf-merkezli hub ekranı + okuma tarafı + sezon kopyalama
**Hedef katmanlar:** `oksis-api` + `oksis-web`
**Modüller:** `teachers` (TeachingAssignment), `subjects/curriculum` (Müfredat Saati — çekirdek), `timetable` (bağıntı — değişmez)
**Durum:** Tasarım kararları (v1) — kullanıcı onaylı (2026-06-14)
**Mimari bağlam:** Modular Monolith · Vertical Slice · CQRS/MediatR · Clean Architecture · Multi-tenant
**Kaynaklar:** Görevlendirme Teknik Analizi (docx, 2026-06) · Müfredat Saati Teknik Analizi (docx, 2026-06) · Design handoff (`handoff_gorevlendirmeler_kademe/`) · admin-ekranlari-mimari-spec §5.7 · ders-programi-modulu-spec §10/K0.6
**Tarih:** 2026-06-14

> Bu dosya `.claude/specs/` altındadır → **bağlayıcı anlaşma** (CLAUDE.md Absolute Rule #6).
> Numaralı maddeler pazarlık dışıdır. Aykırılıkta dur, madde no ile bildir.

---

## 0. İlke ve mevcut durum

Görevlendirme çekirdeği **zaten mevcuttur ve korunur:**

| Mevcut parça | Konum |
|---|---|
| `TeachingAssignment` entity (teacher×classroom×subject + weeklyHours, soft-delete `RevokedAt`) | `Domain/Modules/Teachers/Entities/` |
| EF config + `academic.teaching_assignments` tablosu + filtreli unique index | `Infrastructure/.../Teachers/` |
| `TeachingAssignmentChangedEvent` (Assigned/Unassigned) | `Domain/Modules/Teachers/Events/` |
| `AssignSubjectClassCommand` / `UnassignSubjectClassCommand` | `Application/Modules/Teachers/Commands/` |
| `GetTeacherAssignmentsQuery` / `GetAssignmentHistoryQuery` | `Application/Modules/Teachers/Queries/` |
| Controller `api/v1/teachers/{teacherId}/assignments` | `Api/Controllers/V1/` |
| İzinler `teaching-assignments.view` / `.assign` | seed |
| Timetable portu `ITeachingAssignmentSource` | `Application/Modules/Timetable/Ports/` |
| FE öğretmen detay `TeacherAssignmentsTab` + `AddAssignmentDialog` | `oksis-web/.../admin/teachers/` |
| Homeroom (sınıf öğretmenliği) — `ClassRoom.HomeroomTeacherId` + `AssignHomeroom`/`RemoveHomeroom` + event | `Domain/Modules/AcademicSessions/` |

**K0.1 — Sahiplik sınırı değişmez.** Görevlendirme = arz ("kim hangi dersi kaç saat"), Ders Programı = çizelge ("hangi gün/saat"). Program görevlendirmeyi tüketir, üretmez (admin spec §5.7, ders-programı §10). Bu dilim bu sınırı **değiştirmez.**

**K0.2 — Yeniden kullanım.** Bu dilim yeni bir aggregate/yazma yolu **eklemez**; yalnız okuma tarafı + sezon kopyalama + yeni hub ekranı ekler. "Yeni Görevlendirme" modalı mevcut `assign`/`unassign` endpoint'lerini çağırır.

---

## 1. Docx'ten onaylı sapmalar (Rule #6)

- **S-1:** Docx'in `HomeroomAssignment` entity'si **YAPILMAZ.** Homeroom zaten `ClassRoom.HomeroomTeacherId`'de mevcut (classrooms modülünün sorumluluğu). `teaching-assignments.set-homeroom` izni de eklenmez.
- **S-2:** Docx'in "TeachingAssignment rename + migration Debt"i **geçersiz** — entity zaten doğru adda; rename gerekmez.
- **S-3:** `BranchMatch` entity'de **persist edilmez**; query-time hesaplanır (öğretmen branşı değişince bayatlamasın).
- **S-4:** Docx'in ayrı `GetTeacherWorkloadQuery` + `view-workload` izni **eklenmez**; öğretmen yükü mevcut `GetTeacherAssignmentsQuery` (teacher-centric, `.view` izni) ile zaten karşılanıyor.

---

## 2. Backend (oksis-api)

`Oksis.Application/Modules/Teachers/TeachingAssignments/` altında (mevcut Teachers dilimiyle yan yana).

### 2.1 Yeni query'ler (EF Core projection — `IApplicationDbContext` + `.AsNoTracking()` + `.Join`)

> **Not (kullanıcı kararı 2026-06-14):** Dapper kullanılmaz — projede yüklü değil ve daha önce de vazgeçildi (timetable Hub sorguları da EF projection'a ertelendi). Tüm okumalar mevcut `GetTeacherAssignmentsQueryHandler` desenindeki gibi EF Core projection ile yapılır.

| Query | Girdi | Çıktı |
|---|---|---|
| `GetAssignmentSummaryQuery` | `sessionId` | `{ totalAssignments, missingClasses, mismatchedAssignments }` (üst metrikler 102/9/1) |
| `ListAssignmentClassesQuery` | `sessionId` | sol panel: `[{ classRoomId, fullName, gradeLevelCode, educationLevel, subjectCount, totalWeeklyHours, targetHours, fillStatus }]` |
| `ListClassAssignmentsQuery` | `classRoomId, sessionId` | sağ panel: `[{ id, subjectId, subjectName, teacherId, teacherName, teacherBranch, branchMatch, weeklyHours }]` |

- **`branchMatch`** (`Uyumlu`/`YanBrans`): `TeacherProfile.Branch` ile `Subject.Name` normalize (`Trim().ToUpperInvariant()`, harf/boşluk normalizasyonu) string karşılaştırması. Eşitse `Uyumlu`, değilse `YanBrans`. Query-time, persist yok (S-3). **Normalizasyon SQL'e çevrilemeyeceği için:** handler ham alanları (`teacherBranch`, `subjectName`) projeksiyonla çeker, `branchMatch`'i `ToArrayAsync` sonrası **bellekte** hesaplar.
- **`mismatchedAssignments`** = aktif görevlendirmelerden `branchMatch == YanBrans` sayısı.
- **`fillStatus`**: `targetHours == 0` (müfredat tanımsız) → `Undefined`(gri); aksi halde `totalWeeklyHours` vs `targetHours` → `Below`(amber) / `OnTarget`(yeşil) / `Over`(kırmızı). `totalWeeklyHours == 0` (hiç atama) yine gri (`Empty`).
- **`missingClasses`** = `targetHours > 0 && totalWeeklyHours < targetHours` olan sezon-aktif şube sayısı (hedefi tanımsız sınıflar sayılmaz).
- **`targetHours`**: §2.2 `IRequiredHoursResolver.RequiredTotalHours(sessionId, gradeLevelCode)` ile; seed yoksa 0 → `Undefined`.

### 2.2 targetHours — Müfredat Saati çekirdeği (GERÇEK kaynak, borç değil)

`targetHours` artık **stub değil**; Müfredat Saati modülünün çekirdeği bu spec'te geliştirilir (kullanıcı kararı 2026-06-14: "borç olarak alma, bu spec'te geliştir"). Müfredat Saati Teknik Analizi'nin (docx) **yalnız çekirdeği** alınır; tam yönetim ekranı/override-UI/import/INV-3 **ayrı işe** kalır (§5 Ertelenenler).

**K2.2 — MEB gerçeği:** Hedef toplam saat sabit 30 değildir; kademeye/seviyeye göre değişir (ilkokul 30, ortaokul 35, lise sınıfa göre ~). Bu yüzden hedef `RequiredTotalHours(grade)` ile hesaplanır, sabit kodlanmaz.

**Entity'ler** (`Domain/Modules/Academics/Curriculum/` — Subjects ile yan yana):

```
// MASTER — MEB Haftalık Ders Çizelgesi (tenant-agnostik, sürümlü) : MasterEntity
CurriculumHourTemplate {
  EducationLevel EducationLevel   // çekirdekte kademe ekseni (Primary/Middle/High)
  string         GradeLevelCode   // "5","9"... (GradeLevel.Code ile hizalı)
  Guid           SubjectId
  int            WeeklyHours      // zorunlu/seçmeli saat
  bool           IsElective
  string         MebDecision      // "2025/04 TTK"
  string         Version          // aktif sürüm sabiti (çekirdek: tek aktif sürüm)
}

// OVERRIDE — Okula özel (tenant) : TenantEntity
SchoolWeeklyHourOverride {
  Guid SchoolId; Guid AcademicSessionId;
  string GradeLevelCode; Guid SubjectId;
  int WeeklyHours; string? Reason;
}
```

> **S-5 (çekirdek sadeleştirmesi):** Analizdeki ince `SchoolKind` (AnadoluLisesi/FenLisesi/İmamHatip…) çekirdekte **EducationLevel**'a indirgenir (Primary/Middle/High) — `GradeLevel.EducationLevel` zaten var. `School.SchoolType` → ince çizelge seçimi tam modüle ertelenir.
>
> **S-6 (override yazma yolu yok):** Override **entity + tablo + resolver katmanı** bu spec'te var; ancak override **oluşturma UI/command'i ertelenir**. Resolver override'ı okur (şimdilik boş → master'a düşer). Bu, resolver'ı geleceğe hazır tutar, çift implementasyon gerektirmez.

**Persistence — master/tenant şema uyumu (zorunlu):**
- `CurriculumHourTemplate` → **MASTER**: `MasterEntity` (SchoolId YOK), EF config `ToMasterTable("curriculum_hour_templates")` (`OksisSchemas.Master`). Standart: audit + `IsDeleted` default false + `RowVersion` `IsRowVersion()` + `Ignore(DomainEvents)` + enum `HasConversion<string>()` + unique index `HasFilter("is_deleted = 0")`. Seed `HasData(...)` + **deterministik** `SeedGuid`/`MasterSeedIds` (Subject/GradeLevel deseni birebir).
- `SchoolWeeklyHourOverride` → **TENANT**: `TenantEntity` (SchoolId zorunlu + tenant query filter), `ToAcademicTable("school_weekly_hour_overrides")` (`academic`). Seed yok.
- **Katman ayrımı (sıfır-km seed kuralı):** master SchoolId taşımaz; tenant SchoolId zorunlu. Yanlış katman = cross-tenant açık.

**Resolver (Application abstraction `IRequiredHoursResolver`, Infrastructure impl):**
- `Effective(sessionId, gradeLevelCode, subjectId)` = override varsa onun saati, yoksa aktif `CurriculumHourTemplate`.
- `RequiredTotalHours(sessionId, gradeLevelCode)` = o seviyedeki tüm effective saatlerin toplamı (zorunlu+seçmeli). Hub'ın `targetHours`'u budur.
- Hub query'leri (summary/classes) bu resolver'ı **toplu** çağırır (sezondaki tüm seviyeler için dict). Redis uzun TTL cache (`curriculum:{level}:{version}:{grade}`); override değişince ilgili anahtar (ileride) temizlenir.

**Query:** `GetRequiredTotalHoursQuery(sessionId, gradeLevelCode)` → `int` (Müfredat ekranı gelene kadar tek dışa açık uç; `.view` korumalı).

**Seed:** `MebCurriculumSeed_2025_04` — Müfredat Saati Analizi §8'in doğrulanmış değerleri (kademe toplamları + ortaokul tam set + çekirdek dersler). Tam TTK per-seviye listesi **follow-up seed işi** (kod borcu değil; model gerçek). Seed eksik olan seviyelerde resolver 0 dönerse hub o sınıfı "hedef tanımsız" (gri) gösterir — yanlış toplam üretmez.

**İzin:** `curriculum-hours.view` (SuperAdmin oku, SchoolAdmin tam, Teacher oku). `.override` / `.import-template` izinleri tam modülde eklenir.

### 2.3 Yeni command

**`CopyAssignmentsToNewSeasonCommand(sourceSessionId, targetSessionId)`** → `Result<CopyAssignmentsResult>`:
- Kaynak sezonun **aktif** görevlendirmelerini hedef sezona kopyalar.
- **Sınıf eşlemesi:** hedef `ClassRoom.SourceClassRoomId == kaynak.ClassRoomId` üzerinden (Sezon Rollover köken bağı). Eşleşmeyen kaynak şube atlanır.
- **Atlama kuralları:** `TeacherProfile.IsTerminated` → atla; hedef şube arşiv (`Archived`) → atla; hedefte aynı (classRoomId, subjectId) aktif atama varsa → atla (idempotency).
- **Çıktı:** `{ copiedCount, skipped: [{ reason, classRoomId, subjectId, teacherId }] }`.
- Her kopyalanan kayıt için `TeachingAssignmentChangedEvent(Assigned)`; bitişte `AssignmentsCopiedEvent(sourceSessionId, targetSessionId, copiedCount)` yayar.
- Workload cache (`teachers:workload:*`) invalidate edilir.

### 2.4 Mevcut `AssignSubjectClassCommand` geliştirmesi

- **Branşsız öğretmene atama hard-block:** `TeacherProfile.Branch is null/whitespace` → `Result.Failure` ("Branşı olmayan öğretmene görevlendirme yapılamaz."). (Mevcut handler'da yoksa eklenir.)
- **"İzinli öğretmen" engeli:** leave-status modellenmediği için **Debt-BE** (şimdilik atlanır, completion_status'a not).

### 2.5 İzinler

- **İki yeni izin:**
  - `teaching-assignments.copy-season` (SCHOOL_ADMIN; SuperAdmin yok).
  - `curriculum-hours.view` (SuperAdmin oku, SCHOOL_ADMIN tam, Teacher oku) — Müfredat çekirdeği okuma.
- Her ikisi de Migration + seed + RolePermission ile eklenir.
- `view` (summary/list okuma) ve `assign` (modal yazma) **mevcut**, yeniden kullanılır.
- `curriculum-hours.override` / `.import-template` → tam Müfredat modülünde (ertelendi).

### 2.6 Yeni controller

`api/v1/teaching-assignments`:

| Uç | İzin |
|---|---|
| `GET /summary?sessionId=` | `teaching-assignments.view` |
| `GET /classes?sessionId=` | `teaching-assignments.view` |
| `GET /by-class/{classRoomId}?sessionId=` | `teaching-assignments.view` |
| `POST /copy-season` (body: source/target sessionId) | `teaching-assignments.copy-season` |

Yazma (assign/unassign) mevcut `api/v1/teachers/{teacherId}/assignments`'tan devam. Controller tek satır (`mediator.Send` + `ToHttpResult`). Hatalar ProblemDetails.

### 2.7 Kademe

`GradeLevel.EducationLevel` enum'undan (Preschool/Primary/Middle/High) türetilir; yeni config yok. Sol panel grupları bu eksene göre.

---

## 3. Frontend (oksis-web)

Yeni sayfa `src/portals/admin/assignments/` (mevcut `teachers/` deseni: `pages/ components/ hooks/ keys/ api/ types/ schemas/`).

### 3.1 Ekran (handoff `assignments.jsx` + screenshot referans)
- **Master-detail.** Üst şerit: breadcrumb (Akademik > Görevlendirmeler), sezon seçici (aktif rozet), 3 özet metrik (Görevlendirme / Eksik Sınıf / Uyumsuz Atama), aksiyonlar ("Önceki Sezondan Kopyala" + "+ Yeni Görevlendirme").
- **Sol panel:** sınıf arama + **kademe-gruplu seviye filtresi** (`ORTAOKUL [5..8]` / `LİSE [9..12]`, boş gruplar elenir), sınıf listesi + doluluk rozeti (amber/yeşil/kırmızı/gri).
- **Sağ panel:** seçili şubenin tablosu (shadcn `DataTable` wrapper): DERS · ÖĞRETMEN (avatar+ad+branş) · BRANŞ UYUMU (Uyumlu/Yan branş rozeti) · HAFTALIK SAAT. Başlıkta "9-A — Görevlendirmeler · N ders · hedef X saat/hafta" + "Y/X saat" rozeti.

### 3.2 Standartlar
- Server state **yalnız** React Query; tenant-prefixed key factory:
  - `['teaching-assignments','summary',schoolId,sessionId]`
  - `['teaching-assignments','classes',schoolId,sessionId]`
  - `['teaching-assignments','class',schoolId,classId,sessionId]`
- **Yeni Görevlendirme** modalı: **RHF + Zod** (handoff'taki manuel `useState` yerine standart pattern). Şema: `{ classId, subjectId, teacherId, weeklyHours: int 1..40 }`. Mevcut `assign` endpoint'ini çağırır.
- Seçili sınıf + sezon → URL search params + hafif Zustand store.
- İzin gate'leri: `usePermission` / `RequirePermission` (izin yoksa buton render edilmez).
- Durum varyantları (hepsi Türkçe): boş (pozitif çerçeve), yükleniyor (skeleton — spinner yasak), hata (ProblemDetails), dolu. Doluluk rozeti `Undefined` (hedef tanımsız → gri) durumunu da kapsar.
- Named export; inline style yasak; `any` yasak.
- Sidebar'da "Görevlendirmeler" route'u (`assignments`) bağlanır.

### 3.3 Mobil
Bu dilim kapsamı dışı (mobil yalnız okuma; ayrı iş).

---

## 4. Test (TDD)

- **Domain/handler:** `CopyAssignmentsToNewSeason` (SourceClassRoomId eşleme, terminated/archived/duplicate atlama, idempotency, rapor); branşsız hard-block; `AssignmentsCopiedEvent`.
- **Müfredat çekirdeği:** `IRequiredHoursResolver` — Effective (override > master), `RequiredTotalHours` toplamı, seed eksik seviyede 0 dönüşü; seed sanity testi (kademe toplamları analiz §8 ile tutarlı).
- **Query (EF Core projection, integration, tenant-filtreli):** summary sayımları, branchMatch hesaplama (Uyumlu/YanBrans), fillStatus eşikleri (Undefined dahil), missingClasses (hedefsiz sınıf sayılmaz).
- **FE (vitest):** hub render + durum varyantları (boş/yükleniyor/hata/dolu/hedef tanımsız), kademe gruplama (tek/çok kademe), izin gate, modal RHF+Zod validasyonu, branş-uyum + doluluk rozeti.

---

## 5. Kabul kriterleri

- [ ] `GetAssignmentSummaryQuery` / `ListAssignmentClassesQuery` / `ListClassAssignmentsQuery` çalışır, tenant-filtreli, `.view` korumalı.
- [ ] `branchMatch` query-time hesaplanır; `YanBrans` sayısı summary `mismatchedAssignments` ile tutarlı.
- [ ] `CopyAssignmentsToNewSeasonCommand` SourceClassRoomId ile eşler, atlama kurallarını uygular, idempotent, rapor döner, `.copy-season` korumalı.
- [ ] `teaching-assignments.copy-season` + `curriculum-hours.view` izinleri migration + seed + RolePermission ile eklenir.
- [ ] Müfredat çekirdeği: `CurriculumHourTemplate` + `SchoolWeeklyHourOverride` entity/tablo/seed + `IRequiredHoursResolver` çalışır; hub `targetHours` gerçek (seed varsa) / `Undefined` (seed yoksa).
- [ ] `AssignSubjectClassCommand` branşsız öğretmeni hard-block eder.
- [ ] FE hub: master-detail, kademe gruplama, özet metrikler, doluluk rozetleri (Undefined dahil), branş-uyum rozetleri, RHF+Zod modal, durum varyantları; mevcut assign/unassign ile uçtan uca çalışır.
- [ ] `teachers/completion_status.md`: ilerleme + Debt-BE (izinli-öğretmen engeli) + ⚠️ Spec Dışına Çıkılanlar (S-1 HomeroomAssignment iptal, S-2 rename gereksiz, S-5 SchoolKind→EducationLevel, S-6 override yazma ertelendi) güncel.

---

## 5b. Ertelenenler (ayrı/sonraki iş — bu spec kapsamı DIŞI)

- **Müfredat Saati tam modülü:** yönetim ekranı (web `curriculum-hours/`), `UpsertSchoolHourOverride` + override UI, `ImportMebTemplate` (master sürüm yükleme), `GetEffectiveWeeklyHours`/`ListGradeCurriculum` query'leri, `.override`/`.import-template` izinleri.
- **Timetable INV-3 entegrasyonu:** yerleşim sayısı vs effective saat doğrulaması (ders-programı modülünün işi).
- **İnce `SchoolKind` çözümü** (AnadoluLisesi/FenLisesi…) ve `School.SchoolType` → çizelge seçimi.
- **Tam TTK per-seviye seed** (tüm dersler/seviyeler) — model gerçek, veri yüklemesi follow-up.
- **İzinli öğretmen engeli** (leave-status modellenince) — **Debt-BE**.

---

## 6. Açık sorular / riskler

- **AS-1:** Seed eksikliği → bazı seviyelerde `targetHours == 0` (`Undefined`); hub bunu gri/"hedef tanımsız" gösterir, yanlış toplam üretmez. Tam TTK seed gelince kapanır.
- **AS-2:** `CopyAssignmentsToNewSeason` yalnız Rollover ile köken bağı kurulmuş (`SourceClassRoomId`) şubeleri eşler; manuel açılmış yeni şubeler eşleşmez → raporda "eşleşmeyen şube" olarak listelenmeli.
- **AS-3:** branchMatch serbest-metin `TeacherProfile.Branch` ile `Subject.Name` karşılaştırmasına dayanır; isim varyasyonları (örn. "Türk Dili ve Edebiyatı" vs "Edebiyat") yanlış `YanBrans` üretebilir → normalizasyon kuralları test edilecek, gerekirse eşanlamlı haritası sonraki iş.
- **AS-4:** `RequiredTotalHours` toplamı yalnız o seviye için seed **tam** ise doğrudur; kısmi seed yanlış toplam vermesin diye seed seviye-bazında ya tam ya hiç yüklenir (resolver kısmi seviyeyi `Undefined` saymalı mı? → seed'de seviye tamlık bayrağı yerine, eksik seviye hiç seed edilmez kuralı benimsenir).

---

*Oksis — Görevlendirme Hub Tasarım Spec · v1 · 2026-06-14*
