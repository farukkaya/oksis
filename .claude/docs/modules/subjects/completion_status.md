# Ders (Subjects) — Tamamlanma Durumu

> Bu dosya modülün ne ölçüde tamamlandığını ve spec dışına çıkılan
> durumları raporlar. İlgili her geliştirmede ANINDA güncellenir.
> Status snapshot'tır, kural deposu değil (tam kurallar `business-rules.md`).

**İlerleme:** `████░░░░░░` %40   ·   Status: backend kısmen + frontend-first   ·   Güncel: 2026-06-24

> Web **Dersler & Branşlar** ekranı (sekmeli: Dersler / Branşlar) frontend-first
> teslim edildi (tasarıma hi-fi sadık). Veri katmanı hâlâ **mock** (FE-S2'de gerçeğe
> bağlanacak). **BE-S1 (2026-06-24):** Subject CRUD artık kademeleri
> (`subject_grade_levels` tam-replace) + `Description` yönetir; `SubjectDto` levels +
> description + hasAssignments döndürür (spec `subjects-cekirdek-genisletme-spec.md`).

---

## ✅ Tamamlanan Yapılar

- **Web — Dersler & Branşlar ekranı** (`oksis-web/src/portals/admin/subjects/`, route `/admin/subjects`):
  - Sekmeli tek ekran: **Dersler** (tablo + arama/branş/seviye/tür filtreleri + boş/filtre-boş durumları) ve **Branşlar** (tablo + bağlı ders/öğretmen sayaçları + boş durum).
  - **CourseDrawer** (ders ekle/düzenle, "Kaydet ve Yeni Ekle" art arda giriş) + **BranchModal** (paylaşılan `Modal` ile).
  - Branş rozeti, tür/seviye/durum rozetleri, 3-nokta satır menüsü (pasife al/sil-kilidi).
  - Veri katmanı: tipli mock store + API + React Query (tenant-scoped keys) + **Debt mutasyonları** ("(mock)" toast).
  - i18n `subjects` namespace (tr/en). 16 birim/entegrasyon testi (derive, RowMenu, CourseDrawer, BranchModal, SubjectsPage).
- **Sidebar:** Yeni **Akademik** grubu (Dersler & Branşlar aktif; Görevlendirmeler "Yakında" pasif; Ders Programı + Nöbet Yönetimi "Okul"dan buraya taşındı).

## ✅ BE-S1 (2026-06-24) — Subject çekirdek genişletme (backend)

- **Domain:** `Subject.Create/Update` artık `description` alır + `Description` (nullable) yönetir; trim/null-normalize. Kademeler entity çocuğu DEĞİL — handler-managed (spec D3, UpsertBellDayAssignments deseni).
- **Application:** `CreateSubjectCommand`/`UpdateSubjectCommand` `GradeLevelIds: Guid[]` + `Description` alır; Category komuttan KALDIRILDI (D2). Handler'lar `subject_grade_levels`'ı tam-replace yazar (SubjectId scope'lu; Subject GLOBAL master, tenant yok). Geçersiz GradeLevelId → Conflict.
- **DTO:** `SubjectDto` → `GradeLevelIds`, `Description`, `HasAssignments` (D7, aktif Published/Revising programdaki placement; DeleteSubject guard'ıyla aynı sinyal). `Category` korundu (D2). `GetSubjectsQueryHandler` join + hasAssignments'ı N+1'siz projekte eder.
- **Infra:** `Subject.Description` map (nvarchar(500)) + migration `20260624_subjects_description` (yalnız `description` kolonu; join tablosuna dokunmaz). `subject_grade_levels` zaten vardı.
- **Test:** Domain 427 yeşil (SubjectTests: description normalize/clear), Application 1156 yeşil (create/update kademe + description + category-preserve + unknown-gradeLevel reject).

## ⏳ Eksik / Bekleyen Yapılar

- **FE-S2 (Debt):** `subjectsApi` mock→gerçek `/academics/subjects`; global key'ler (D1); FE eşleme (levels/description) — yapılmadı.
- **Ders silme:** tasarım gereği her zaman disabled (pasife-al öncelikli); gerçek hard-delete yok (zaten hard-delete yasağı var).
- **Backend (Debt):** `Branch` domain entity/CRUD — yok (spec D6, kapsam dışı). `recommendedWeeklyHours` persist yok (spec D4, CurriculumHourTemplate entegrasyonu ayrı iş).
- **İzinler (Debt):** `subjects.*` izinleri yok; `/admin/subjects` geçici olarak `class-rooms.view` ile gate'li (timetable rooms-first precedent'i gibi).
- **Doküman içeriği:** domain-model / api-contracts / database-schema / business-rules / permissions hâlâ `{{TBD}}` — teknik analizden doldurulacak (veri modeli: branslar/dersler/ders_seviye/ogretmen_brans/gorevlendirmeler).
- **Öğretmen↔branş (ana/yan) yönetimi:** bu ekranda yok; spec §5.6 gereği Öğretmen detayında (burada yalnız türetilen öğretmen sayacı, mock).
- **Görevlendirmeler ekranı:** yapılmadı (aşağıdaki karara bakınız).
- Mobile: ekran yok.

## ⚠️ Spec Dışına Çıkılanlar / Kararlar

- **2026-06-24 (AS-Q1, spec D2)** — UI Category göndermediğinden `SubjectCategory` enum'una nötr **`Other = 11`** değeri eklendi; yeni dersler create'te `Other` ile oluşur, update Category'yi korur. **Neden güvenli:** Duties yerine-öğretmen eşleştirmesi (`BranchFitResolver`) kategoriyi **tam-eşitlikle** karşılaştırır (`s.Category == absentCategory`) → `Other` hiçbir spesifik branşla eşleşmez, mevcut seed dersler kendi kategorisini korur, davranış değişmez. Category string-stored (HasConversion<string>) → şema değişmedi. **Onay:** spec D2/AS-Q1 önerisi. **Etki:** Category korundu (silinmedi).
- **2026-06-24 (spec BE-S1 madde, küçük sapma)** — Spec "aggregate `subject_grade_levels` çocuklarını yönetir" diyor; modelde Subject→SubjectGradeLevel navigation YOK (`HasOne<Subject>().WithMany()` navigation'sız M:N, SubjectGradeLevel kendi MasterEntity'si). Bu yüzden kademeler **handler-managed tam-replace** ile yönetildi (UpsertBellDayAssignments deseni) — entity çocuk koleksiyonu yapılmadı. Sonuç spec D3 niyetiyle birebir (tam-replace, SubjectId scope). **Etki:** yok; davranış aynı.
- **2026-06-11** — Tasarım brief'indeki **sınıf-merkezli "Görevlendirmeler" ekranı yapılmadı.** Bağlayıcı spec `oksis-admin-ekranlari-mimari-spec.md` §5.7 görevlendirmeyi (`TeachingAssignment`) **öğretmen-merkezli** ve Öğretmen detayında konumlandırıyor; brief'in ayrı sınıf-merkezli düzenleme ekranı bu sahiplik sınırıyla çelişiyordu. **Karar:** spec'e sadık kalındı; Görevlendirmeler menüde "Yakında" pasif. **Onay:** kullanıcı. **Etki:** bu round yalnız Dersler & Branşlar; görevlendirme ileride Öğretmen detayında ele alınır.
- **2026-06-11** — Ekran **frontend-first** teslim edildi (Frontend-First Debt deseni): görünüm tasarıma birebir, backend borçlu. **Etki:** veri kalıcı değil (oturum-ömürlü mock); izin gate'i geçici `class-rooms.view`.
- **2026-06-11** — Branş varlığı kod adı **`Branch`** olarak belirlendi (UI "Branş"); ders **`Subject`**. Branş şimdilik subjects modülünde belgelenir (Öğretmenler tüketici).
- **2026-06-11** — CourseDrawer/BranchModal form state RHF yerine local useState (web kuralı #3 RHF önerir); handoff'a sadık imperatif "Kaydet ve Yeni Ekle" reset davranışı + FE-first hız için bilinçli. Borç: ileride RHF+zod'a taşınabilir.
