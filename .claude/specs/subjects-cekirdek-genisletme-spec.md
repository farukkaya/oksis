# Subjects (Dersler) Çekirdek Genişletme — Bağlayıcı Spec

> Durum: **bağlayıcı anlaşma** (CLAUDE.md Absolute Rules #6). Numaralı maddeler
> (D1, F1…) non-negotiable tasarım kararlarıdır. Aykırılıkta dur, hangi madde ile
> çakıştığını Türkçe bildir.
>
> Bağlam: Okul Ayarları → Akademik Yapı "Ders Kataloğu" Debt'i ve `/admin/subjects`
> "Dersler" sekmesinin gerçek backend'e bağlanması. Tetik: 2026-06-24 UI-Debt
> denetimi — katalog Debt'i incelenirken subjects backend'inin yüzeye çıkmadığı
> görüldü. İlgili: `okul-ayarlari-tasarim-yenileme-spec.md` (AS-1), modül dokümanı
> `.claude/docs/modules/subjects/`.

## 1. Mevcut Durum (doğrulanmış)

- **Subject = GLOBAL MASTER** veri: `Subject : MasterEntity` (SchoolId taşımaz,
  tenant-agnostik). `master.subjects` tablosu + tam CRUD **gerçek ve canlı**:
  `GET /academics/subjects` (lookup), `GET /academics/subjects/manage?isActive=`,
  `POST/PUT /academics/subjects[/{id}]`, `PUT …/{id}/status`, `DELETE …/{id}`.
  Subject alanları: `Code, Name, Category (SubjectCategory enum), IsElective,
  IsActive, DisplayOrder`.
- **`master.subject_grade_levels`** (Subject↔GradeLevel M2M) entity + EF config
  **var** ama Subject CRUD'u bunu **okumuyor/yazmıyor** (Create/Update levels
  almıyor, GetSubjects/SubjectDto levels döndürmüyor). **Tek gerçek backend boşluğu.**
- **Haftalık saat** ayrı bir sistem: `CurriculumHourTemplate` (seviye-bazlı MEB
  müfredat saati) + `SchoolWeeklyHourOverride` (okul katmanı). Frontend'in tek
  `recommendedWeeklyHours` değeri bu seviye-bazlı modelle 1:1 eşleşmez.
- **Category çapraz-modül kullanılıyor:** `Duties/Substitution` (yerine öğretmen
  eşleştirme — BranchFitResolver, GetAvailableSubstitutes) + `Teachers/
  TeachingAssignments`. **Silinemez.**
- **Frontend** `oksis-web/.../subjects` ekranı + Akademik Yapı katalog kartı:
  veri katmanı **tamamen mock** (`subjectsApi` oturum-ömürlü store, `isMock:true`),
  cache key'leri yanlışlıkla **tenant-scoped** (global master'ı per-school sanıyor).

## 2. Bağlayıcı Kararlar

- **D1 — Subjects GLOBAL master'dır.** Frontend dersleri okula-özel DEĞİL, tüm
  okullarca paylaşılan master veri olarak ele alır. React Query key'leri **global**
  olur (tenant prefix YOK — bu, subjects için multi-tenant kuralının istisnası
  değil; veri zaten tenant-agnostik master). Per-school override modeli **bu spec
  kapsamı DIŞI** (gerekirse ayrı spec).
- **D2 — Category KORUNUR.** Çapraz-modül bağımlılığı (Duties/Teachers) nedeniyle
  ne entity'den ne DTO'dan silinir. Frontend Category'yi göstermez/göndermez.
  `POST` (create) Category almadığından backend **varsayılan** atar: `SubjectCategory`
  enum'unun ilk/`Other` benzeri nötr değeri (uygulamada netleştir, deviation logla).
  `PUT` (update) Category'yi mevcut değerinde **korur** (frontend göndermez → handler
  değiştirmez).
- **D3 — Levels (kademeler) gerçek bağlanır.** Subject Create/Update `gradeLevelIds:
  Guid[]` alır ve `subject_grade_levels`'ı tam-replace yazar. `SubjectDto` + GetSubjects
  `levels`/`gradeLevelIds` döndürür (M2M join okunur).
- **D4 — recommendedWeeklyHours bu spec'te DEBT.** Tek-değer ↔ seviye-bazlı
  `CurriculumHourTemplate` uyuşmazlığı nedeniyle backend'e bağlanmaz; frontend'de
  gösterilirse `(Debt)` işaretli, persist edilmez. Müfredat-saat entegrasyonu ayrı iş.
- **D5 — description**: Subject'e nullable `Description` kolonu eklenir (frontend
  alanı gerçek persist olur). Küçük, D3 ile aynı migration'da.
- **D6 — Branch (branş) bu spec KAPSAMI DIŞI.** `subject.branchId` ve bağımsız
  Branch entity/CRUD eklenmez; `/admin/subjects` "Branşlar" sekmesi mock+Debt kalır.
  AS-1 gereği Akademik Yapı katalogu zaten **branşsız** — katalog Branch'a ihtiyaç
  duymaz.
- **D7 — inuse/hasAssignments**: Ders, aktif ders programı/görevlendirmede
  kullanılıyorsa silinemez (pasife alınır). Backend `DeleteSubject` guard'ı varsa
  korunur; `SubjectDto.hasAssignments` mümkünse `TeachingAssignment`/`LessonPlacement`
  agregasyonundan döndürülür, değilse bu alan **Debt** (FE delete-kilidi yalnız 409'a
  güvenir).
- **D8 — AS-1 korunur.** Akademik Yapı "Ders Kataloğu" branşsız; Branch kolonu/alanı
  göstermez. (Bağlayıcı: `okul-ayarlari-tasarim-yenileme-spec.md` AS-1.)

## 3. Fazlı Plan

### BE-S1 — Subject levels + description (backend, TDD)
- Domain: `Subject.Create/Update` imzasına `IEnumerable<Guid> gradeLevelIds` +
  `string? description`; aggregate `subject_grade_levels` çocuklarını yönetir
  (tam-replace), `Description` set eder. `Category` Create'te varsayılan, Update'te
  korunur (D2).
- Application: `CreateSubjectCommand`/`UpdateSubjectCommand` + validator'lar
  `GradeLevelIds` (geçerli master GradeLevel id'leri) + `Description`. Handler'lar
  join'i yazar. `SubjectDto`'ya `gradeLevelIds: Guid[]` (veya `levels`) + `description`
  + (mümkünse) `hasAssignments`. `GetSubjectsQuery`/`ListSubjects` join'i okur.
- Infrastructure: `Subject` config + migration (`Description` kolonu;
  `subject_grade_levels` zaten var). Idempotent.
- Test: Domain (levels replace, validation), Application (create/update levels +
  description, category default/preserve), gerekli Api/Integration. `dotnet build` +
  `dotnet test` yeşil. `dotnet format`.

### FE-S2 — subjectsApi mock→gerçek (frontend, ayrı dilim, sonra)
- `subjectsApi` subjects işlemleri (list/manage/create/update/status/delete) gerçek
  `/academics/subjects`'e bağlanır (httpClient); **global** key'ler (D1). `isMock`/
  mockToast subjects için kaldırılır. Branch işlemleri mock kalır (D6).
- Subject ↔ backend eşleme: type↔IsElective, status↔IsActive, levels↔gradeLevelIds,
  description; weeklyHours **Debt** (D4); category gönderilmez (D2).
- Tüketiciler: Akademik Yapı katalog kartı (branşsız, AS-1) + `SubjectsPage`
  "Dersler" sekmesi gerçeğe bağlanır, `(Debt)` rozeti kaldırılır. "Branşlar" sekmesi
  + weeklyHours Debt kalır.
- Test: save-path (create/update doğru payload incl. gradeLevelIds), build, ilgili
  vitest yeşil.

## 4. Kapsam Dışı / Debt (bilinçli)
- Branch (branş) backend + `subject.branchId` (D6).
- recommendedWeeklyHours backend persist (D4 — CurriculumHourTemplate entegrasyonu).
- Per-school subject override modeli (D1).
- hasAssignments tam agregasyonu belirsizse (D7).

## 5. Açık Sorular
- AS-Q1: `SubjectCategory` create varsayılanı hangi enum değeri? (D2 — uygulamada
  netleştir, Duties substitute-matching'i bozmayacak nötr bir değer.)
- AS-Q2: `SubjectDto.hasAssignments` agregasyonu BE-S1'de fizibıl mı yoksa Debt mı? (D7)
