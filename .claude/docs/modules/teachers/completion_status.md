# Öğretmen (Teachers) — Tamamlanma Durumu

> Bu dosya modülün ne ölçüde tamamlandığını ve spec dışına çıkılan
> durumları raporlar. İlgili her geliştirmede ANINDA güncellenir.
> Status snapshot'tır, kural deposu değil (tam kurallar `business-rules.md`).

**İlerleme:** `█████████░` %85   ·   Status: in-progress   ·   Güncel: 2026-06-26 (öğretmen branşı **string→branchId FK**, master.branches; bkz. Spec Dışına 2026-06-26) · 2026-06-25 (Görevlendirme **v2 BE+FE CANLI doğrulandı** — DevTools uçtan-uca (okuma+drawer+yazma+invalidation+iki eksen); fix'ler: atayan adı (Account→Person), kategori i18n, secondaryBranches null-guard, **kademe filtresi** (seviye+ders havuzu okul SchoolGradeLevel'ı ile); eski v1 `assignments/` silindi. 12 domain + 9 integration + 3 FE testi yeşil.)

> 2026-06-25 (fix/test): **Görevlendirme v2 canlı doğrulama + düzeltmeler.** API (docker SQL Server) + FE dev
> üzerinde Chrome DevTools ile uçtan-uca test edildi (müdür login → okuma 200, drawer adayları, çoklu atama
> POST 200, React Query invalidation, ders↔öğretmen eksen geçişi). Bulgu/düzeltmeler: (1) **Atayan adı** "—"
> çıkıyordu — `CreatedBy`=Account.Id, Person.Id değil → `LoadCreatorNamesAsync` Account→PersonId→Person köprüsü.
> (2) **Kademe filtresi** (AS-2 çözümü): Lise okulu ortaokul seviyelerini (5-8) ve ortaokul-özel derslerini
> (Fen Bilimleri, Sosyal Bilgiler…) görüyordu → seviye türetimi + ders havuzu okulun aktif `SchoolGradeLevel`'ı
> ile kesiştirildi (`LoadSubjectLevelsAsync` ∩ kademe, `LoadSchoolScopedSubjectIdsAsync`); kademe tanımsızsa
> geri-uyum (tüm dersler). Doğrulandı: Lise 22→16 ders, Almanca 5-12→9-12. (3) **secondaryBranches null-guard**:
> migration öncesi öğretmen satırları NULL kolon → EF null → FE crash; BE DTO'da `[]` coalesce + FE `BranchTags`
> null-dayanıklı. (4) **FE kategori i18n**: ders kategorileri (Math/Science…) Türkçe (Matematik/Fen…). (5) Eski
> v1 sınıf-merkezli `oksis-web/.../admin/assignments/` (21 dosya) silindi; route v2'de. Commit'ler: feat (önceki)
> + fix (ef0582a api, 1216bd9 web).

> 2026-06-25: **Görevlendirme v2 BACKEND (oksis-api).** Teknik analiz `Gorevlendirmeler-v2-Teknik-Analiz.docx`
> esas alındı; kullanıcı kararları: aggregate `SubjectTeacherAssignment`, izin prefix `assignments.*` (yeni),
> `TeacherProfile.SecondaryBranches` eklendi (AS-3, üçlü uyum), ders havuzu `Subject.IsActive` global (AS-2),
> türetim **server-side** (6 zengin sorgu). **Domain:** `SubjectTeacherAssignment` (sezon-scope, saat/şube YOK,
> soft-close + denetim izi) + `SubjectAssignmentChangedEvent` + `AssignmentStatus`; mevcut `TeachingAssignment`
> DOKUNULMADI (downstream tüketici). **Persistence:** `academic.subject_teacher_assignments` (filtreli unique
> `(Session,Subject,Teacher)` WHERE Active + 2 kapsayıcı index) + `teacher_secondary_branches` JSON kolonu;
> migration `20260625_subject_teacher_assignments`. **İzinler:** `assignments.{view,assign,copy-season}` seed
> (SchoolAdmin tam, Teacher view, copy-season SchoolAdmin-only). **Application:** komutlar AssignSubjectTeachers
> (çoklu, branşsız hard-block, alan-dışı gerekçe), Close (soft-close), UpdateJustification, CopyFromPreviousSeason;
> sorgular Summary / CoursesWithCoverage / TeachersWithDutyCount / GetCourseAssignments / GetTeacherDuties /
> ListAssignableCandidates (EF projection, üçlü uyum tr-TR bellekte). **Controller:** `api/v1/assignments` (10 uç).
> **Test:** 12 domain (xUnit) + 9 integration (gerçek SQL Server — SecondaryBranches JSON round-trip, üçlü uyum,
> tüm sorgular, Assign/Close) yeşil. Sapma: bkz. ⚠️ Spec Dışına Çıkılanlar 2026-06-25. **Kalan:** FE'yi gerçek
> uçlara bağlama (stub→HTTP, izin sabitleri, server-derived DTO'lara refactor) + doküman.

> 2026-06-24: **Görevlendirme v2 FE yeniden tasarımı (yalnız oksis-web).** Spec `.claude/specs/gorevlendirme-hub-spec.md`
> **v2'ye yükseltildi** (kullanıcı onaylı 2026-06-24) — v1 sınıf×saat/doluluk modelini geçersiz kılar. Yeni ekran yalnız
> **yetkin öğretmen ↔ ders** eşlemesi üretir; **haftalık saat/şube YOK** (KARAR 1/3), iki eksen (Derslere/Öğretmenlere göre),
> metrik = kapsama boşluğu, uyum **üçlü** (içi/yan/dışı + öğretmen yan branşları), yaşam döngüsü **soft-close + denetim izi**
> (`by/at/gerekçe`, kayıt silinmez). İzole klasör `src/portals/admin/assignments-new/` (academic-sessions deseni: types/seed/
> derivations(+test)/keys/api/hooks/components/pages/styles). Handoff `handoff_gorevlendirmeler_v2/` birebir port edildi
> (kapsama kapsülü, görev özeti şeridi, gerekçe/iz bloğu, seçim drawer'ı; shadcn Sheet değil — drawer `.asg-body` içinde
> absolute; PageHeader stats + Popover satır menüsü). **Yaklaşım: frontend-first / backend Debt** — `assignmentsApi` §3.2
> v2 kontratını döndüren **stub** (seed); gerçek backend gelince yalnız adaptör değişir. 17 vitest yeşil (13 türetim + 4 sayfa
> render), modülde 0 tip hatası. **Henüz swap edilmedi:** mevcut v1 `assignments/` + route korunuyor; `/admin/assignments`
> hâlâ v1 gösteriyor (kullanıcı doğrulaması sonrası swap + v1 silme). Debt-BE-1..4 (saat'siz görevlendirme entity'si, audit/
> soft-close alanları, üçlü uyum+yan branş, kopyala v2 semantiği) ayrı backend işi. Sapma: bkz. ⚠️ Spec Dışına Çıkılanlar 2026-06-24.

> 2026-06-14: **Görevlendirme Hub'ı (sınıf-merkezli) + Müfredat Saati çekirdeği (oksis-api + oksis-web).**
> Spec `.claude/specs/gorevlendirme-hub-spec.md` (bağlayıcı). Mevcut `TeachingAssignment` çekirdeği
> korundu; eklenen: (1) **Müfredat Saati çekirdeği** — `CurriculumHourTemplate` (master) +
> `SchoolWeeklyHourOverride` (tenant) + filtreli unique index + MEB seed (şu an yalnız ortaokul 5,
> toplam 29) + `IRequiredHoursResolver` (override > master). `CurriculumVersions.Active = "2025.04"`.
> (2) **Hub okuma query'leri** (EF projection, Dapper DEĞİL): `GetAssignmentSummary`
> (total/missing/mismatched; arşiv şubeler hariç), `ListAssignmentClasses` (sol panel, fillStatus,
> kademe = EducationLevel), `ListClassAssignments` (sağ panel, branchMatch bellekte `BranchMatching`
> ile tr-TR kültür normalize). (3) **`CopyAssignmentsToNewSeasonCommand`** (§2.3: SourceClassRoomId
> eşleme, atlama sebepleri teacher-terminated/no-target-class/class-archived/already-exists, idempotent,
> `AssignmentsCopiedEvent`). Mevcut `AcademicSessions POST .../copy-assignments` ucu da bu komuta evrildi
> (CopyAssignmentsResult döner). (4) `AssignSubjectClass` artık branşsız öğretmeni hard-block eder. (5)
> Yeni controller `api/v1/teaching-assignments` (`GET /summary|/classes|/by-class/{id}`, `POST /copy-season`).
> Yeni izinler `teaching-assignments.copy-season` (yalnız SchoolAdmin) + `curriculum-hours.view`
> (SuperAdmin/SchoolAdmin/Teacher), migration `20260614_gorevlendirme_hub`. **FE:** yeni admin sayfası
> `src/portals/admin/assignments/` (master-detail hub: kademe-gruplu sidebar + doluluk rozeti + özet
> metrikler + branş-uyum rozetleri + RHF+Zod yeni-görevlendirme modalı + sezon kopyala + sezon seçici),
> route `/admin/assignments` (`teaching-assignments.view`), sidebar "Görevlendirmeler" etkin, `assignments`
> i18n namespace (tr/en). Sapmalar: bkz. ⚠️ Spec Dışına Çıkılanlar 2026-06-14.

> 2026-06-08: **Öğretmenler design-handoff 1:1 boşluk kapatma (oksis-web).** Mevcut ekran zaten tasarım sistemine oturuyordu; tasarımda olup eksik olan parçalar eklendi: (1) **"Yeni Öğretmen" (Hire) modalı** (`HireTeacherDialog`, ad/soyad + görev tipi segment + branş çoklu seçim, paylaşılan `shared/components/modal/Modal` + `shared/styles/modal.css`); (2) page-head'e **"Sezon Görevini Kopyala"** + selection-bar'da etkinleştirme; (3) drawer'da tasarım imzası **hero yük göstergesi** (başlıkta beyaz varyant) + **footer** (Görevlendir → Görevlendirmeler sekmesi, Düzenle) + `wide` genişlik. **Backend ucu OLMAYANLAR mock fallback + "D" rozeti** (`shared/api/debtFallback.attemptRealThenMock`): Hire (`POST /teachers`), Sezon Kopyala (`POST /teachers/copy-season`), Düzenle (`PUT /teachers/{id}`). Mevcut GERÇEK uçlar korundu: liste/stats/yük/homeroom/atama/export. Mock-only kontrol mantığı `teachersDebtApi`/`useTeacherDebt`'te izole; "Düzenle" mutasyonu test-izolasyonu için page'de tutulur (drawer prop `onEdit`). 66 teachers+users vitest yeşil, tam paket 463 yeşil, build yeşil. Sapma: bkz. Spec Dışına Çıkılanlar 2026-06-08 "Teachers DEBT mock-fallback".

> Temel: doküman iskeleti `{{TBD}}`. Admin Öğretmenler **liste ekranı** (greenfield
> spec §5) kuruldu: ISSUE-01 (liste/arama/filtre/tablo iskeleti) + ISSUE-02 (KPI
> şeridi) + ISSUE-03 (`TeachingAssignment` domaini + Görevlendirmeler sekmesi) +
> ISSUE-04 (haftalık yük/kapasite) + ISSUE-05 (sınıf öğretmenliği).
> **ISSUE-06: detay drawer §5.6 sekme seti kuruldu** (8 sekme); **ISSUE-07: satır (…)
> menüsü + toplu seçim çubuğu (§5.5) kuruldu; ISSUE-08: edge-case/koruma kuralları +
> çift-eksen yaşam döngüsü (§5.8/§6.3) kuruldu — teachers-spec-audit issue seti BİTTİ.**

---

## ✅ Tamamlanan Yapılar

- 9 dosyalık doküman iskeleti oluşturuldu (içerik doldurulmadı).
- **ISSUE-01 (web §5/§5.3/§5.4):** `/admin/teachers` route + menü; `portals/admin/teachers/`
  (Öğrenciler desenini referans alır, `.stu*` CSS yeniden kullanılır). `profileType=Teacher`
  listesi: ad/sicil/branş arama + durum/branş/görev-tipi filtreleri + sayfalama +
  skeleton/empty/error. §5.4 kolon iskeleti; kaynaksız kolonlar (Verdiği Dersler,
  Sınıf Öğretmenliği, Haftalık Yük) "—". tr/en i18n (`teachers` namespace).
- **ISSUE-01 (api):** `ListPersonsQuery` aramasına TeacherProfile sicil/branş dalı;
  `PersonListItemDto`'ya Branch/EmployeeNumber/HireDate.
- **ISSUE-02 (web/api §5.2):** `TeachersKpiStrip` (Toplam · Aktif Görevli · Ortalama Yük ·
  Branş Açığı); `GetTeacherStats` query + `GET /users/persons/teacher-stats`. Ortalama Yük
  (ISSUE-04) + Branş Açığı (Ders Programı) kaynaksız → "—".
- **ISSUE-03 (api §5.1/§5.7/§1.2):** `TeachingAssignment` aggregate (Teacher[Person.id] ×
  ClassRoom × Subject + haftalık saat, sezona bağlı, soft-revoke = görev geçmişi). Komutlar
  `AssignSubjectClass`/`UnassignSubjectClass` + `TeachingAssignmentChangedEvent` (§5.9, Ders
  Programı senkronu için Assigned/Unassigned). Sorgular `GetTeacherAssignments` (aktif sezon +
  toplam yük) / `GetAssignmentHistory`. EF config (filtered unique aktif tekillik, weekly_hours
  1–40 check), migration, DbSet, permission/role seed (`teaching-assignments.view/.assign`).
  Yardımcı: `GET /academics/subjects` lookup. §5.8 guard: ayrılmış öğretmene/arşiv şubeye atama
  reddi. 11 unit test.
- **ISSUE-03 (web §5.6/§5.7):** `TeacherAssignmentsTab` (ekranın kalbi) — aktif sezon
  görevlendirmeleri haftalık saatiyle, ekle (`AddAssignmentDialog`: şube/ders/saat)/kaldır,
  toplam yük başlıkta. `useTeacherAssignments` (query + mutasyonlar, invalidate). tr/en i18n.
  4 web test. **Detay drawer'a mount ISSUE-06 işi** (sekme self-contained, dışa export'lu).
- **ISSUE-04 (api §5.2/§5.4/§5.7/§5.8/§5.9):** `GetTeacherWorkload` query — sezon bazında
  öğretmen başına aktif görevlendirme saatleri toplamı + kapasite doluluğu + ortalama (§5.2).
  `[Cacheable]` ile sezon bazlı Redis cache (`teachers:workload:{SessionId}`, §5.9);
  assign/unassign komutları cache prefix'ini geçersiz kılar. `IsOverloaded` yumuşak uyarı (§5.8).
  `GET /users/persons/teacher-workload`. Kapasite kaynağı spec'te tanımsız → sabit
  `TeacherWorkloadDefaults.WeeklyCapacity = 30`. 3 unit test.
- **ISSUE-04 (web §5.2/§5.4/§5.8):** `useTeacherWorkloadQuery` + `teachersApi.workload`;
  satırlara teacherId üzerinden yük birleştirilir → "Haftalık Yük" kolonu "X / Y saat" +
  doluluk barı (ekranın imzası). Aşırı yük rozeti + sarı bar (engellemez). KPI "Ortalama
  Haftalık Yük" `averageFillPercent` ile beslenir. Yük barı CSS'i `students.css`'e eklendi.
  3 web test (tablo bar/aşırı yük + adaptör map).
- **ISSUE-05 (api §5.7/§5.8):** `ClassRoom.RemoveHomeroom()` + `ClassRoomHomeroomRemovedEvent`
  (§5.8 "rehbersiz"). `SetHomeroom`/`RemoveHomeroom` command'ları → `PUT`/`DELETE
  /class-rooms/{id}/homeroom`. §5.7 "bir öğretmen aynı sezonda ≤1 şube" tenant-geneli kontrolle;
  §5.8 ayrılmış öğretmen (TeacherProfile.IsTerminated) + arşivli şube engeli. Domain +2, app +5 test.
- **ISSUE-05 (web §5.4/§5.5/§5.6/§5.7/§5.8):** Tablo "Sınıf Öğretmenliği" kolonu homeroom
  haritasından (şube adı / "—"). Satır aksiyonu "Sınıf öğretmeni ata/kaldır" (`TeacherRowActions`,
  `class-rooms.update` gate). `HomeroomDialog`: mevcut sorumlu şube + öğrenci listesi köprüsü
  (`/admin/students?class={id}`, §5.6), rehbersiz/dolu şube ayrımı, tek-şube önden engel (dolu
  şube option disabled). `teachersApi.homeroomMap/setHomeroom/removeHomeroom` + `useHomeroom`
  hook (query + mutasyonlar, invalidate). tr/en i18n. 5 web test (dialog 3, rowActions 2, table +1).
- **ISSUE-06 (web §5.6):** `TeacherDetailDrawer` — §5.6 sekiz sekmeli detay drawer (Genel ·
  Görevlendirmeler · Ders Programı · Nöbet · Sınıf Öğretmenliği · Görev Geçmişi · Belgeler ·
  Hesap). Görevlendirmeler ISSUE-03 `TeacherAssignmentsTab`'ı, Sınıf Öğretmenliği ISSUE-05
  homeroom haritasını mount eder (sorumlu şube + öğrenci listesine köprü). Kaynaksız sekmeler
  (Ders Programı/Nöbet/Görev Geçmişi/Belgeler) dürüstçe "—"; Hesap sahiplik sınırı (§3) gereği
  yalnız Kullanıcılar'a köprü (`/admin/users/{id}`). TeachersPage satır açılışı drawer'ı mount
  eder (eski no-op kaldırıldı). tr/en i18n (`drawer` bloğu). 7 web test.
- **ISSUE-07 (web §5.5/§1.3):** `TeacherRowActions` satır (…) overflow menüsü §5.5 setini
  durum-duyarlı sunar (Detay · Düzenle · Ders/sınıf görevlendir · Sınıf öğretmeni ata/kaldır ·
  Ders programını görüntüle · İzin başlat/döndür · Pasife al). İzin/Pasife Person.id ekseninde
  gerçek uçlara bağlı (suspend/reactivate/archive); Pasife al = soft archive (§1.3). Mesleki
  Düzenle + Ders Programı köprüsü kaynak yok → görünür-ama-pasif. `useTeacherActions` hook +
  `teachersApi.putOnLeave/returnFromLeave/deactivate`. `TeachersSelectionBar` toplu çubuğu +
  tabloya onay-kutusu seçim kolonu. tr/en i18n (`rowActions`/`selection`). 6+3+1 web test.
- **ISSUE-08 (web §5.8/§6.3):** edge-case/koruma kuralları + çift-eksen yaşam döngüsü. Saf
  `lib/lifecycle.ts` helper'ları (`isTerminalStatus`/`hasBranch`/`dutyState`/`assignmentBlockReason`)
  tablo, detay drawer ve görevlendirme sekmesi arasında paylaşılır (DRY). §5.8: branşsız öğretmende
  "branş eksik" uyarı rozeti (tablo branş hücresi + detay Genel) ve görevlendir aksiyonu pasif +
  gerekçe; izinli/ayrılmış öğretmene yeni görev atama engeli (`TeacherAssignmentsTab` add butonu
  disabled + uyarı bandı); görevlendirme kaldırma onayına Ders Programı bağımlılık uyarısı (Timetable
  yok → yumuşak metin). §6.3 çift eksen: istihdam (Aktif/İzinli/Ayrıldı/Pasif) + görev
  (Görevli/Görevsiz, yükten türetilir) tabloda alt etiket + detayda ayrı fact satırları ("Aktif ama
  Görevsiz" mümkün). CSS `.branch-missing`/`.dual-axis`/`.duty-tag` students.css'e eklendi. tr/en
  i18n (`row.branchMissing*`, `duty.*`, `employment.label`, `assignments.blocked.*`,
  `assignments.removeConfirmDependency`). 17 yeni web test (lifecycle 8, edge-cases 5, assignments +4).

- **Görevlendirme Hub + Müfredat Saati çekirdeği (2026-06-14, BE+FE):**
  - **Müfredat çekirdeği (api):** `CurriculumHourTemplate` (master, `master.curriculum_hour_templates`) +
    `SchoolWeeklyHourOverride` (tenant, `academic.school_weekly_hour_overrides`) + filtreli unique index
    (`ux_curriculum_hour_templates_ver_grade_subject` / `ux_school_weekly_hour_overrides_active`) +
    `MebCurriculumSeed_2025_04` (şu an yalnız ortaokul 5, zorunlu toplam 29) + `IRequiredHoursResolver`
    (override > master, seviye toplamı; seed yoksa o seviye dict dışı → hub `Undefined`/gri).
    `CurriculumVersions.Active = "2025.04"`. Migration `20260614_gorevlendirme_hub`.
  - **Hub query'leri (api, EF projection — Dapper değil):** `GetAssignmentSummaryQuery`
    (totalAssignments/missingClasses/mismatchedAssignments; `Archived` şubeler hariç),
    `ListAssignmentClassesQuery` (sol panel: fillStatus Below/OnTarget/Over/Undefined/Empty, kademe =
    `GradeLevel.EducationLevel`), `ListClassAssignmentsQuery` (sağ panel: branchMatch Uyumlu/YanBrans).
    `branchMatch` query-time, `BranchMatching` ile (`Trim` + `ToUpper(tr-TR)` + boşluk temizliği),
    `ToArrayAsync` sonrası bellekte (persist yok, S-3).
  - **Command (api):** `CopyAssignmentsToNewSeasonCommand` (SourceClassRoomId eşleme, atlama:
    teacher-terminated/no-target-class/class-archived/already-exists, idempotent, `CopyAssignmentsResult`
    raporu + `AssignmentsCopiedEvent`). Mevcut `AcademicSessions POST .../copy-assignments` ucu da bu
    komuta evrildi. `AssignSubjectClass` branşsız öğretmeni hard-block (`teaching-assignments.errors.teacher-no-branch`).
  - **API (api):** yeni controller `api/v1/teaching-assignments` — `GET /summary`, `GET /classes`,
    `GET /by-class/{classRoomId}` (`teaching-assignments.view`), `POST /copy-season`
    (`teaching-assignments.copy-season`). Ayrıca `GetRequiredTotalHoursQuery` + thin
    `CurriculumHoursController` — `GET /api/v1/curriculum-hours/required-total?sessionId=&gradeLevelCode=`
    (`curriculum-hours.view`; resolver üzerinden hedef saat, seed yoksa/sezon yoksa 0).
  - **İzinler:** `teaching-assignments.copy-season` (yalnız SchoolAdmin) + `curriculum-hours.view`
    (SuperAdmin oku / SchoolAdmin tam / Teacher oku) — seed + RolePermission + migration.
  - **FE (web):** `src/portals/admin/assignments/` master-detail hub — kademe-gruplu sidebar + doluluk
    rozeti (amber/yeşil/kırmızı/gri-Undefined) + 3 özet metrik + branş-uyum rozetleri + RHF+Zod
    yeni-görevlendirme modalı (mevcut `assign` ucunu çağırır) + "Önceki Sezondan Kopyala" + sezon seçici.
    Route `/admin/assignments` (`teaching-assignments.view`), sidebar "Görevlendirmeler" etkin,
    `assignments` i18n namespace (tr/en). Tenant-scope React Query key'leri.

## ⏳ Eksik / Bekleyen Yapılar

- Doküman içeriği (≈110 `{{TBD}}` alanı) — spec doldurulmadı.
- Mobile: öğretmen rolü ekranları (yok).
- **Debt-BE (izinli öğretmen engeli):** "İzinli öğretmen" görevlendirme engeli leave-status modeli
  olmadığından şimdilik atlandı (§2.4). Leave-status modeli gelince `AssignSubjectClass`/copy-season'a eklenir.
- **Debt-BE (tam TTK müfredat seed):** Şu an yalnız ortaokul 5 seed'li; eksik seviyeler resolver'da
  hedef Undefined (gri) gösterilir, yanlış toplam üretilmez. Tam TTK per-seviye seed (ilkokul/ortaokul 6-8/lise)
  follow-up veri işi (model gerçek). Ayrıca: Müfredat tam modülü (override UI/import/INV-3) ertelendi (§5b).

## 🗺️ Görevlendirme v2 — Yol Haritası (2026-06-25)

> v2 çekirdeği master'da CANLI ve DevTools ile uçtan-uca doğrulandı (BE+FE; bkz. 2026-06-25 günlük girdisi).
> Aşağıdaki boşluklar kod üzerinden teyitlidir; öncelik sırasıyla.

**Boşluklar (kod-teyitli):**
- **G1 🔴 Yan branş yönetim ucu yok** — `TeacherProfile.SetSecondaryBranches`'i çağıran komut/UI yok; öğretmen yan branşı hiç set edilmiyor → üçlü uyumun **YanBrans ayağı pratikte ölü** (gerçekte yalnız Uyumlu/Alan-dışı çıkar). v2'nin çekirdek tasarım kararlarından biri yarım.
- **G2 🟠 `SubjectAssignmentChangedEvent` tüketicisi yok** — event atılıyor ama dinleyen yok → downstream Şube Dağıtımı / Ders Programı senkronu + bildirim eksik.
- **G3 🟠 Teacher portalı ekranı yok (GRV-İ-11)** — BE'de `assignments.view` var ama öğretmen kendi görevlerini göremiyor (FE ekranı yok).
- **G4 🟡 Copy-season canlı test edilmedi** — komut + dialog var; FE kaynak-sezon seçimi sezgisel (`previousSessionId`), uçtan-uca doğrulanmadı.
- **G5 🟡 Kademe yapılandırma bağımlılığı** — okul `SchoolGradeLevel` tanımlamazsa kademe filtresi fallback'e düşer (tüm dersler).
- **G6 🟡 Branş-isim normalizasyonu (AS-5)** — serbest metin `Branch` ↔ `Subject.Name` eşitlik; eşanlamlı (Edebiyat↔Türk Dili) haritası yok → bazı uyumlar yanlış Alan-dışı.
- **G7 ⚪ Housekeeping** — FE test kapsamı dar (3 render); handoff materyalleri untracked; ayrı `modules/assignments` doküman klasörü yok (teachers altında).

**Faz planı:**
- **Kısa vade:** G1 (yan branş yönetimi — komut + öğretmen detay çoklu branş seçimi; **en yüksek değer**) · G3 (teacher portalı read-only) · G4 (kaynak-sezon seçici + canlı doğrulama).
- **Orta vade:** G2 (`INotificationHandler<SubjectAssignmentChangedEvent>` + downstream Şube Dağıtımı/Ders Programı senkronu, analiz §5.1) · G5 (okul kurulumunda kademe zorunluluğu).
- **Uzun vade / ayrı iş:** G6 (eşanlamlı haritası) · Mobil (§4.4) · Müfredat Saati modülü (D-1, koparıldı) · Şube Dağıtımı modülü (zincirin downstream'i).
- **Housekeeping:** G7.

## ⚠️ Spec Dışına Çıkılanlar

- **2026-06-26 (öğretmen branşı string → `branchId` FK) — kullanıcı onayı:** Öğretmen branşı eskiden serbest string (`TeacherProfile.Branch` + `SecondaryBranches` string[]) idi. Yeni `master.branches` global lookup tablosuyla birlikte öğretmen branşı **FK'ye taşındı**: `teacher.branchId` (Guid? → master.branches) + `secondaryBranchIds` (Guid[]); **legacy string alanları drop-column migration ile kaldırıldı** + mevcut veri normalize-ad eşleşmesiyle FK'ye taşındı. Görevlendirme + vekalet eşleşmesi (`SubjectBranchMatch`/`BranchFitResolver`/`BranchMatching`) artık branş adını FK'den **resolve edip** ad-bazlı eşleştiriyor (semantik aynı, kaynak FK). Branş picker'ı (HireTeacher/edit) `api/v1/branches` lookup'ından beslenir (eski iki mock liste kaldırıldı). subjects spec **D6 ezildi** (artık bağımsız Branch entity + teacher FK var). **Etki:** öğretmen branş kaynağı tek + gerçek; branşsız öğretmene görevlendirme hard-block `branchId==null` ile çalışır. Detay: `modules/subjects/completion_status.md` 2026-06-26 + oturum `2026-06-26-branch-katalogu-acceptance-and-followup-fixes.md`.
- **2026-06-24 (spec v1 → v2) — Görevlendirme modeli kökten değişti:** v1 sınıf×saat/doluluk modeli
  (`fillStatus`, `targetHours`, `ListAssignmentClasses/ListClassAssignments`) Görevlendirme ekranından **geçersiz**;
  v2 ders↔öğretmen yetkinlik eşlemesi (saat/şube yok, üçlü uyum, soft-close+audit). Onay: kullanıcı (2026-06-24).
  Etki: yeni bağlayıcı spec v2; backend v2'yi karşılamadığı için **frontend-first + Debt-BE** (Debt-BE-1..4).
- **2026-06-24 (D-1) — Müfredat Saati çekirdeği Görevlendirme'den koparıldı (yerinde kalır):** v1'de Görevlendirme'yi
  besleyen `CurriculumHourTemplate`/`SchoolWeeklyHourOverride`/`IRequiredHoursResolver`/`curriculum-hours.view` backend'de
  **dokunulmadan** duruyor; v2 ekran bunları artık kullanmaz (KARAR 1/3 saat'i kaldırdı). Onay: kullanıcı (2026-06-24,
  "yerinde kalsın, dokunma"). Etki: çekirdek ileride kendi modülünde yaşar; Görevlendirme bağı koptu.
- **2026-06-24 (frontend-first) — v2 backend Debt-BE:** v2 modelini besleyecek backend bu işte yazılmadı; FE `assignmentsApi`
  stub'ı §3.2 kontratını döndürür. Açık sorular AS-1..5 (saat'siz entity, v1 veri köprüsü, yan branş modeli, kopyala v2 anlamı).
  Onay: kullanıcı (2026-06-24). Etki: gerçek backend gelince yalnız adaptör değişir; UI sözleşmesi sabit.
- **2026-06-25 (AS-1 çözüm) — typed-ID value object atlandı:** Aggregate adı `SubjectTeacherAssignment`; analiz
  `SubjectTeacherAssignmentId` value object öneriyordu ama kardeş `TeachingAssignment` ham `Guid Id` kullandığından
  tutarlılık + EF sadeliği için typed-ID kullanılmadı. Onay: kullanıcı (2026-06-25, AS-1 "ben öneririm"). Etki: minör; kimlik ham Guid.
- **2026-06-25 (AS-4 → son mesaj) — izin prefix `assignments.*`:** Analiz `course-assignments.*` önermişti; kullanıcı
  "course-assignments olmasın, sadece assignments, yeni izin" dedi → yeni `assignments.{view,assign,copy-season}`. Onay: kullanıcı (2026-06-25).
- **2026-06-25 (AS-2 → ÇÖZÜLDÜ) — ders havuzu + seviye okul kademesine göre:** İlk uygulamada ders havuzu = tüm aktif
  master Subject (sezon/okul filtresi yok) idi → Lise okulu ortaokul derslerini/seviyelerini görüyordu. Kullanıcı bunu
  yanlış buldu (2026-06-25); **düzeltildi:** seviye türetimi (`LoadSubjectLevelsAsync`) ve ders havuzu
  (`LoadSchoolScopedSubjectIdsAsync`) okulun aktif `SchoolGradeLevel`'larıyla kesiştirilir; kademe tanımsızsa geri-uyum
  (tüm dersler). Onay: kullanıcı (2026-06-25). Etki: Lise yalnız 9-12 + Lise derslerini görür (canlı doğrulandı 22→16).

- **2026-06-14 (S-1) — `HomeroomAssignment` entity iptal:** Docx'in `HomeroomAssignment`'ı yapılmadı;
  homeroom zaten `ClassRoom.HomeroomTeacherId`'de (classrooms sorumluluğu). `set-homeroom` izni de eklenmedi.
  Onay: kullanıcı (2026-06-14). Etki: yok (mevcut yapı yeniden kullanıldı).
- **2026-06-14 (S-2) — `TeachingAssignment` rename gereksiz:** Docx'in rename + migration Debt'i geçersiz —
  entity zaten doğru adda. Onay: kullanıcı (2026-06-14). Etki: yok.
- **2026-06-14 (S-5) — `SchoolKind` → `EducationLevel`:** Analizin ince `SchoolKind` (AnadoluLisesi/FenLisesi…)
  ekseni çekirdekte `EducationLevel` (Primary/Middle/High) ile sadeleştirildi (`GradeLevel.EducationLevel` zaten var).
  İnce çizelge seçimi tam modüle ertelendi. Onay: kullanıcı (2026-06-14). Etki: çekirdek seviye-bazlı hedef yeterli.
- **2026-06-14 (S-6) — Override yazma yolu ertelendi:** `SchoolWeeklyHourOverride` entity+tablo+resolver var,
  ama override oluşturma UI/command'i ertelendi; resolver override okur (şimdilik boş → master'a düşer). Onay:
  kullanıcı (2026-06-14). Etki: resolver geleceğe hazır; çift implementasyon yok.
- **2026-06-14 (spec §2.1) — Hub okumaları Dapper yerine EF projection:** Spec §2.1 EF projection diyordu
  (Dapper projede kurulu değil, timetable Hub'da da ertelenmişti); tüm hub query'leri EF Core projection +
  `AsNoTracking`. Onay: kullanıcı (2026-06-14). Etki: yok (kontrat aynı).
- **2026-06-14 (spec §2.1 yazım düzeltmesi) — branchMatch tr-TR kültürü:** Spec metni bir yerde
  `ToUpperInvariant` yazımı içeriyordu; İ/ı doğruluğu için normalizasyon `ToUpper(tr-TR)` kültürüyle yapıldı
  (spec §2.1'in açık niyeti). Onay: kullanıcı (2026-06-14). Etki: Türkçe branş/ders adı karşılaştırması doğru.
- **2026-06-14 (spec §2.5) — SuperAdmin copy-season hariç:** `teaching-assignments.copy-season` yalnız
  SchoolAdmin'e verildi; SuperAdmin'e verilmedi (§2.5 kuralı). `MasterRoleSeedTests` SuperAdmin-her-izin
  invaryantına bu izin için istisna eklendi. Onay: kullanıcı (2026-06-14). Etki: sezon kopyalama tenant-admin işi.
- **2026-06-08 — Teachers DEBT mock-fallback: backend'siz aksiyonlar gerçek istek atar ama mock döner + "D" rozeti (oksis-web, bu oturum):** Design-handoff 1:1 boşlukları kapatılırken backend ucu **henüz açılmamış** öğretmen işlemleri `shared/api/debtFallback.attemptRealThenMock` ile sarıldı: **önce gerçek uca istek atılır**, 404/405/network → kısa gecikmeli **mock** döner (`isMock:true`; toast'a "(mock)" eki), UI'da `shared/components/DebtBadge` ("D"). Kapsam: **Yeni Öğretmen / Hire** (`POST /teachers`), **Sezon Görevini Kopyala** (`POST /teachers/copy-season`, head + selection-bar), **Düzenle** (drawer footer, `PUT /teachers/{id}`). **Gerçek (rozetsiz):** liste/stats/yük/homeroom/görevlendirme(assign,unassign)/export. **Gerekçe:** kullanıcı talimatı — "backend karşılığı olmayanlar için mock servis yaz (istek atsın ama mock dönsün), D ile işaretle". Önceki ISSUE-07'deki Sezon Kopyala "görünür-ama-pasif" yaklaşımı **mock+D ile etkin** hale getirildi (TeachersSelectionBar testi buna göre güncellendi). **Etki & geçiş:** uç açılınca `attemptRealThenMock` gerçek cevabı döndürür → tek dosyada (`teachersDebtApi`) mock kalkar + ilgili DebtBadge silinir; UI dokunulmaz. Ortak Modal sistemi `shared/components/modal/Modal` + `shared/styles/modal.css`'e taşındı (Kullanıcılar ile paylaşımlı; Öğrenciler de kullanacak).
- **2026-06-08 (ISSUE-01/02):** §5.4 Verdiği Dersler/Sınıflar · Sınıf Öğretmenliği ·
  Haftalık Yük ve §5.2 Ortalama Yük / Branş Açığı **kaynaksız** olduğundan UI'da "—"
  ile degrade edildi. Sapma değil, dürüst tasarım — spec §5.2 "başta —" der; kaynak
  ISSUE-03/04 (TeachingAssignment + workload) ve Ders Programı modülü ile beslenecek.
  Etki: yok (görsel iskelet, yanlış veri yok). **Güncelleme:** Haftalık Yük + Ortalama Yük
  ISSUE-04'te dolduruldu; Sınıf Öğretmenliği ISSUE-05'te dolduruldu; "—" yalnız Verdiği
  Dersler/Sınıflar (Ders Programı özeti) + Branş Açığı (Ders Programı) için kaldı.
- **2026-06-08 (ISSUE-04):** §5.4 "24 / 30 saat" örneğindeki kapasite üst sınırının (30)
  kaynağı spec'te tanımsız (okul ayarı mı sabit mi belirsiz). Okul ayarları modülünde
  öğretmen kapasite alanı yok + ders programı/okul ayarı genişletmesi Out of Scope →
  kapasite tek sabit (`TeacherWorkloadDefaults.WeeklyCapacity = 30`) olarak ele alındı.
  İleride school-settings alanı eklenirse sabit fallback olur. Etki: tüm öğretmenler için
  aynı kapasite; per-okul/per-öğretmen özelleştirme yok.
- **2026-06-08 (ISSUE-06):** §5.6 "Ders Programı" (Timetable modülü yok), "Nöbet" (Duties read
  sorgusu yok — DutyManagement web sayfası lokal mock state), "Görev Geçmişi" (`GetAssignmentHistory`
  ucu var ama tüketilmedi), "Belgeler" (`UploadDocument` ucu yok) sekmeleri kaynaksız → dürüstçe
  "—"/boş-durum ile degrade. Sapma değil, dürüst tasarım (öğrenci drawer deseni). Etki: yok
  (yanlış veri yok); kaynak modüller geldikçe sekmeler beslenir.
- **2026-06-08 (ISSUE-07):** §5.5 "İzin/ayrılış işle" için ayrı istihdam-ekseni slice'ları
  (`PutOnLeave`/`ReturnFromLeave`/`Terminate`, §5.9) yok → en yakın Person ucuna eşlendi (İzin
  başlat = suspend, döndür = reactivate, Pasife al = archive). §5.5 toplu "sezon görevlendirme
  taşıma" için `CopyAssignmentsToNewSeason` ucu yok → görünür-ama-pasif + ipucu. Mesleki "Düzenle"
  formu + "Ders programını görüntüle" köprüsü kaynak yok → pasif. Gerekçe: §5.5 setini eksiksiz/
  durum-duyarlı göstermek ama çalışmayan butonla yalan söylememek (users/students ISSUE deseni).
  Etki: çalışan aksiyonlar gerçek; eksikler net pasif, backend uçları gelince aktifleşir.
- **2026-06-08 (ISSUE-08):** §5.8 "Ders Programı'nda kullanılan görevlendirme silinmek istenince
  bağımlılık uyarısı" — Timetable modülü yok, dolayısıyla gerçek bağımlılık verisi (bu görevlendirme
  çizelgede kullanılıyor mu?) sorgulanamıyor. Karar (çatal — durmadan ilerlendi): bağımlılık uyarısı
  kaldırma onay diyaloğuna **yumuşak metin** olarak gömüldü (her kaldırmada "Ders Programı'nda
  kullanılıyorsa etkilenir" uyarısı), sert engel değil (spec "aşırı yük yumuşak uyarı" tonuyla
  tutarlı). Timetable gelince koşullu (yalnız gerçekten kullanılanlarda) uyarıya dönüştürülür. Etki:
  kullanıcı her kaldırmada bilgilendirilir; yanlış-pozitif yumuşak metin olduğundan zararsız.
