# Ders (Subjects) — Tamamlanma Durumu

> Bu dosya modülün ne ölçüde tamamlandığını ve spec dışına çıkılan
> durumları raporlar. İlgili her geliştirmede ANINDA güncellenir.
> Status snapshot'tır, kural deposu değil (tam kurallar `business-rules.md`).

**İlerleme:** `████████░░` %80   ·   Status: subjects backend-bağlı; branş GERÇEK (master.branches + öğretmen branchId FK); /admin/subjects silindi; **weeklyHours GERÇEK (B0.2H — seviye-bazlı CurriculumHourTemplate/override, D4 ezildi)**   ·   Güncel: 2026-06-26

> Web **Dersler & Branşlar** ekranı (sekmeli: Dersler / Branşlar) frontend-first
> teslim edildi (tasarıma hi-fi sadık). **FE-S2 (2026-06-24):** Subjects veri katmanı
> mock→gerçek `/academics/subjects`'e bağlandı (global master, spec D1); levels
> backend `gradeLevelIds` ile eşlenir; weeklyHours/branş Debt. Branşlar hâlâ mock
> (D6). **BE-S1 (2026-06-24):** Subject CRUD kademeleri
> (`subject_grade_levels` tam-replace) + `Description` yönetir; `SubjectDto` levels +
> description + hasAssignments döndürür (spec `subjects-cekirdek-genisletme-spec.md`).

---

## ✅ Tamamlanan Yapılar

- **Web — Dersler & Branşlar ekranı** (`oksis-web/src/portals/admin/subjects/`, route `/admin/subjects`):
  - Sekmeli tek ekran: **Dersler** (tablo + arama/branş/seviye/tür filtreleri + boş/filtre-boş durumları) ve **Branşlar** (tablo + bağlı ders/öğretmen sayaçları + boş durum).
  - **CourseDrawer** (ders ekle/düzenle, "Kaydet ve Yeni Ekle" art arda giriş) + **BranchModal** (paylaşılan `Modal` ile).
  - Branş rozeti, tür/seviye/durum rozetleri, 3-nokta satır menüsü (pasife al/sil-kilidi).
  - Veri katmanı (subjects): **GERÇEK** `/academics/subjects` (manage/create/update/status) + React Query **global** key'ler (D1, tenant prefix YOK — `subjectKeys.subjects()`); düz başarı toast'ı (mock-suffix yok).
  - Veri katmanı (branşlar): hâlâ tipli mock store + tenant-scoped key + "(mock)" Debt toast (D6).
  - i18n `subjects` namespace (tr/en). 18 birim/entegrasyon testi (derive, RowMenu, CourseDrawer, BranchModal, SubjectsPage, useSubjectMutations save-path).

## ✅ FE-S2 (2026-06-24) — subjectsApi mock→gerçek (frontend)

- **api:** `subjectsApi.listSubjects/createSubject/updateSubject/setSubjectStatus` → `utils/api` ile gerçek `/academics/subjects[/manage|/{id}|/{id}/status]`. Branş işlemleri mock kaldı (D6).
- **keys:** subjects key'leri **global** (`["subjects",...]`, tenant prefix YOK — D1); branş key'i tenant-scope mock.
- **hooks:** `useSubjectsQuery` subjects + `useMasterGradeLevels`'i birleştirir; `SubjectDto → Subject` eşler. `gradeLevelId (Guid) → Level`: master lookup `code` ("5".."12") → `Number`. `useSaveSubject` `Level → gradeLevelId`: `String(level) → code → id`. Eşleme **hook katmanında** (raw api fonksiyonlarında değil).
- ~~**Debt (gösterimli):** `recommendedWeeklyHours = null` (D4 — kolon başlığı "(Debt)")~~ → **GERÇEK (B0.2H, 2026-06-26):** haftalık saat seviye-bazlı `CurriculumHourTemplate`/`SchoolWeeklyHourOverride`'a bağlandı (D4 ezildi). Saat ders global kaydında değil, okul+sezon override'ında; Ders Düzenle drawer'ında seviye×saat tablosu (kendi "Saatleri Kaydet"i) + katalog kolonunda effective min–max aralığı. `(Debt)` rozeti kalktı. ~~`branchId = ""` (D6)~~ → branş gerçek (`master.branches` + öğretmen `branchId` FK). Bkz. "Spec Dışına Çıkılanlar".
- **Tüketiciler:** Akademik Yapı "Ders Kataloğu" kartı `(Debt)` rozeti **kaldırıldı** (gerçek artık); Haft. Saat kolonu Debt işaretli. `SubjectsPage` Dersler sekmesi gerçek; Branşlar sekmesi mock.
- **Test:** build + tsc (yeni hata yok, baseline ~60) + `subjects` vitest yeşil + `StructureTab` vitest yeşil.
- **Sidebar:** Yeni **Akademik** grubu (Dersler & Branşlar aktif; Görevlendirmeler "Yakında" pasif; Ders Programı + Nöbet Yönetimi "Okul"dan buraya taşındı).

## ✅ BE-S1 (2026-06-24) — Subject çekirdek genişletme (backend)

- **Domain:** `Subject.Create/Update` artık `description` alır + `Description` (nullable) yönetir; trim/null-normalize. Kademeler entity çocuğu DEĞİL — handler-managed (spec D3, UpsertBellDayAssignments deseni).
- **Application:** `CreateSubjectCommand`/`UpdateSubjectCommand` `GradeLevelIds: Guid[]` + `Description` alır; Category komuttan KALDIRILDI (D2). Handler'lar `subject_grade_levels`'ı tam-replace yazar (SubjectId scope'lu; Subject GLOBAL master, tenant yok). Geçersiz GradeLevelId → Conflict.
- **DTO:** `SubjectDto` → `GradeLevelIds`, `Description`, `HasAssignments` (D7, aktif Published/Revising programdaki placement; DeleteSubject guard'ıyla aynı sinyal). `Category` korundu (D2). `GetSubjectsQueryHandler` join + hasAssignments'ı N+1'siz projekte eder.
- **Infra:** `Subject.Description` map (nvarchar(500)) + migration `20260624_subjects_description` (yalnız `description` kolonu; join tablosuna dokunmaz). `subject_grade_levels` zaten vardı.
- **Test:** Domain 427 yeşil (SubjectTests: description normalize/clear), Application 1156 yeşil (create/update kademe + description + category-preserve + unknown-gradeLevel reject).

## ⏳ Eksik / Bekleyen Yapılar

- **Ders silme:** tasarım gereği her zaman disabled (pasife-al öncelikli); gerçek hard-delete yok (zaten hard-delete yasağı var). FE delete-kilidi `hasAssignments` sinyaline güvenir (D7).
- **Backend (Debt):** `Branch` domain entity/CRUD — yok (spec D6, kapsam dışı). ~~`recommendedWeeklyHours` persist yok (D4)~~ → **YAPILDI (B0.2H, 2026-06-26):** `SetSubjectWeeklyHoursCommand` (bulk reconcile) + `GetSubjectWeeklyHoursQuery` + `GetCatalogWeeklyHoursQuery` + `curriculum-hours.override` izni. Müfredat-saat dokümanı `modules/teachers/*`'te (çekirdek orada).
- **İzinler (Debt):** `subjects.*` izinleri yok; `/admin/subjects` geçici olarak `class-rooms.view` ile gate'li (timetable rooms-first precedent'i gibi).
- **Doküman içeriği:** domain-model / api-contracts / database-schema / business-rules / permissions hâlâ `{{TBD}}` — teknik analizden doldurulacak (veri modeli: branslar/dersler/ders_seviye/ogretmen_brans/gorevlendirmeler).
- **Öğretmen↔branş (ana/yan) yönetimi:** bu ekranda yok; spec §5.6 gereği Öğretmen detayında (burada yalnız türetilen öğretmen sayacı, mock).
- **Görevlendirmeler ekranı:** yapılmadı (aşağıdaki karara bakınız).
- Mobile: ekran yok.

## ⚠️ Spec Dışına Çıkılanlar / Kararlar

- **2026-06-26 (spec D4 EZİLDİ — kullanıcı onayı, B0.2H)** — Orijinal D4 "recommendedWeeklyHours bu spec'te DEBT; tek-değer ↔ seviye-bazlı uyuşmazlığı nedeniyle persist edilmez, müfredat-saat entegrasyonu ayrı iş" diyordu. **Uygulandı:** haftalık saat **seviye-bazlı** modele bağlandı — mevcut `CurriculumHourTemplate` (MEB master) + `SchoolWeeklyHourOverride` (okul/sezon, **TenantEntity**) + reconcile (effective hedef master'a eşit → override sil/varsayılana dön, farklı → upsert). Yeni `SubjectGradeLevel.WeeklyHours` kolonu EKLENMEDİ (3. çelişkili kaynak olmasın diye — Option A). Tek `recommendedWeeklyHours` alanı UI'dan kaldırıldı; saat **dersin global Kaydet'inden AYRI** (ders global master, saat okul+sezon override). Backend: `SetSubjectWeeklyHoursCommand` (+validator) + `GetSubjectWeeklyHoursQuery` (drawer) + `GetCatalogWeeklyHoursQuery` (liste min–max) + `curriculum-hours.override` izni (SchoolAdmin; SuperAdmin salt-oku) + migration. FE: Ders Düzenle drawer'ında seviye×{MEB,okul,effective} tablosu + "Saatleri Kaydet"; yeni derste 2-adım (önce dersi kaydet); katalog kolonu "(Debt)" → effective aralık ("4–6 sa"). Sezon: aktif sezona pinli (A1.2 deseni). **Not:** B0.2H ayrıca `gorevlendirme-hub-spec.md` S-6 "override yazma yolu yok" ifadesini geçersiz kılar (Müfredat Saati modülünü §8'e göre başlatır — çakışma değil). **Onay:** kullanıcı (bug-temizleme planı B0.2H). **Etki:** weeklyHours gerçek; Müfredat Saati çekirdeği artık yazılabilir. Detay: oturum `2026-06-26-b0.2h-plan.md`; müfredat-saat dokümanı `modules/teachers/*`.
- **2026-06-26 (spec D6/D9/FE-S2 EZİLDİ — kullanıcı onayı)** — Orijinal D6 "bağımsız Branch entity/CRUD eklenmez, `/admin/subjects` Branşlar sekmesi mock kalır" diyordu. **Uygulandı (master'a merge):** (1) `/admin/subjects` route+ekran+mock **silindi** — tek ders kaynağı Akademik Yapı katalogu (`master.subjects`, global, D1). (2) Yeni **`master.branches`** global lookup tablosu (16 MEB branşı seed) + CRUD (`api/v1/branches`) + Akademik Yapı'da **"Branş Kataloğu"** kartı. (3) Öğretmen branşı **`branchId` FK** (`teacher.branchId` + `secondaryBranchIds`; legacy string alanlar drop migration ile kaldırıldı); görevlendirme/vekalet eşleşmesi FK→ad resolve'a uyarlandı. **AS-1/D8 KORUNDU** (ders katalogu branşsız; Branch ayrı katalog). **Onay:** kullanıcı (bug-temizleme planı A1.1+A1.4). **Etki:** Branch artık gerçek backend; subjects spec D6/FE-S2 + okul-ayarları akışı güncellendi. Detay: oturum `2026-06-26-branch-katalogu-acceptance-and-followup-fixes.md`. İlgili: `modules/teachers/completion_status.md`.
- **2026-06-26 (B0.2 — kullanıcı onayı)** — Yeni Ders create: FE `displayOrder=0` + boş `code` gönderdiğinden 400 dönüyordu. **Backend `CreateSubjectCommand`'dan `DisplayOrder` kaldırıldı**, handler mevcut max+10 ile otomatik atar (validator `>0` kalktı); FE Kısa Kod **zorunlu** yapıldı. **Etki:** create çalışır; DisplayOrder tek kaynak (backend).
- **2026-06-24 (AS-Q1, spec D2)** — UI Category göndermediğinden `SubjectCategory` enum'una nötr **`Other = 11`** değeri eklendi; yeni dersler create'te `Other` ile oluşur, update Category'yi korur. **Neden güvenli:** Duties yerine-öğretmen eşleştirmesi (`BranchFitResolver`) kategoriyi **tam-eşitlikle** karşılaştırır (`s.Category == absentCategory`) → `Other` hiçbir spesifik branşla eşleşmez, mevcut seed dersler kendi kategorisini korur, davranış değişmez. Category string-stored (HasConversion<string>) → şema değişmedi. **Onay:** spec D2/AS-Q1 önerisi. **Etki:** Category korundu (silinmedi).
- **2026-06-24 (spec BE-S1 madde, küçük sapma)** — Spec "aggregate `subject_grade_levels` çocuklarını yönetir" diyor; modelde Subject→SubjectGradeLevel navigation YOK (`HasOne<Subject>().WithMany()` navigation'sız M:N, SubjectGradeLevel kendi MasterEntity'si). Bu yüzden kademeler **handler-managed tam-replace** ile yönetildi (UpsertBellDayAssignments deseni) — entity çocuk koleksiyonu yapılmadı. Sonuç spec D3 niyetiyle birebir (tam-replace, SubjectId scope). **Etki:** yok; davranış aynı.
- **2026-06-11** — Tasarım brief'indeki **sınıf-merkezli "Görevlendirmeler" ekranı yapılmadı.** Bağlayıcı spec `oksis-admin-ekranlari-mimari-spec.md` §5.7 görevlendirmeyi (`TeachingAssignment`) **öğretmen-merkezli** ve Öğretmen detayında konumlandırıyor; brief'in ayrı sınıf-merkezli düzenleme ekranı bu sahiplik sınırıyla çelişiyordu. **Karar:** spec'e sadık kalındı; Görevlendirmeler menüde "Yakında" pasif. **Onay:** kullanıcı. **Etki:** bu round yalnız Dersler & Branşlar; görevlendirme ileride Öğretmen detayında ele alınır.
- **2026-06-11** — Ekran **frontend-first** teslim edildi (Frontend-First Debt deseni): görünüm tasarıma birebir, backend borçlu. **Etki:** veri kalıcı değil (oturum-ömürlü mock); izin gate'i geçici `class-rooms.view`.
- **2026-06-11** — Branş varlığı kod adı **`Branch`** olarak belirlendi (UI "Branş"); ders **`Subject`**. Branş şimdilik subjects modülünde belgelenir (Öğretmenler tüketici).
- **2026-06-11** — CourseDrawer/BranchModal form state RHF yerine local useState (web kuralı #3 RHF önerir); handoff'a sadık imperatif "Kaydet ve Yeni Ekle" reset davranışı + FE-first hız için bilinçli. Borç: ileride RHF+zod'a taşınabilir.
