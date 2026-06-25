# Branş Kataloğu — Bağlayıcı Spec (Design)

> Durum: **bağlayıcı anlaşma** (CLAUDE.md Absolute Rules #6). Numaralı kararlar (D1, D2…)
> non-negotiable tasarım kararlarıdır. Aykırılıkta dur, hangi madde ile çakıştığını Türkçe bildir.
>
> Tarih: 2026-06-26 · Kaynak: brainstorming oturumu (Ayarlar bug-temizleme planı A1.4).
> İlgili: `.claude/sessions/2026-06-25-ayarlar-bug-temizleme-plani.md` (A1.4),
> `subjects-cekirdek-genisletme-spec.md` (**bu spec onun D6/D8/FE-S2'sini EZER**).

## 1. Bağlam ve Amaç

Branş (öğretmen alan-branşı) şu an iki tutarsız frontend mock'a dayanıyor (`/admin/subjects`
"Branşlar" 16'lık seed + `HireTeacherDialog` 11'lik hardcoded). Backend'de bağımsız Branch
entity yok; öğretmen branşı serbest `string` (`TeacherProfile.Branch`/`SecondaryBranches`),
ders adıyla ve `SubjectCategory` enum'uyla eşleşiyor. Bu spec branşı **gerçek, iki-katmanlı bir
backend modeline** çıkarır, **okula özel** yönetilebilir kılar ve `/admin/subjects` ekranını siler.

## 2. Bağlayıcı Kararlar

- **D1 — İki katmanlı model.**
  - **`master.branches`** = GLOBAL master (tenant-agnostik, `SchoolId` YOK). MEB-standart branş
    referansı. 16 branşla seed. İleride aylık MEB/e-Okul besleme job'ı tazeler (**kapsam dışı**).
  - **`school.branches`** = okula özel (tenant-scoped, `IHasTenant`, `SchoolId`). Okulun çalışma listesi.
- **D2 — Tenancy + şema.** `school.branches` **school şemasında** (şemasız tablo YOK — proje kuralı);
  tenant-scoped; EF global query filter + `TenantSaveChangesInterceptor` uygulanır; React Query key'leri
  **tenant prefix'li**. `master.branches` master şemada, global (filter yok).
- **D3 — Kaynak ayrımı (`MebBranchId` FK).** `branches.MebBranchId` (nullable FK → `master.branches`):
  `null` = özel branş; dolu = MEB-kaynaklı. **MEB-kaynaklı satırın `Name`/`MebCode`'u değiştirilemez**
  (entity-seviyesi guard). Özel satır düzenlenebilir. İleriki refresh job bu FK ile eşler.
- **D4 — "MEB'den getir".** `master.branches`'ten okul listesine **toplu** kopyalar; `MebBranchId`
  (mebBranchId) ile dedupe (mevcutları atla); **idempotent**; mevcut/düzenlenmiş kayda dokunmaz.
- **D5 — Katalog CRUD.** Branş Kataloğu: MEB'den getir + özel ekle/düzenle (özel-only) + aktif/pasif
  (her ikisi) + **sil (in-use guard:** öğretmende kullanılıyorsa 409, kullanılmıyorsa siler; her ikisi).
- **D6 — Öğretmen FK.** `TeacherProfile.Branch`(string)→`BranchId: Guid?` FK→`school.branches`;
  `SecondaryBranches`(string[])→`SecondaryBranchIds` (M2M join → `school.branches`). `BranchId == null` →
  görevlendirme hard-block (korunur). Aynı okulun branşlarına bağlanır (tenant tutarlılığı).
- **D7 — Eşleşme semantiği korunur.** `SubjectBranchMatch` (Matched/SecondaryBranch/OutOfField) ve
  `BranchFitResolver` (Same/Near/Different) **ad-bazlı** çalışmaya devam eder; handler `branchId`→branş
  adını resolve edip mevcut mantığa verir. `BranchMatching` (tr-TR normalize) değişmez.
- **D8 — Greenfield seed.** Mevcut öğretmen string branş verisi taşınmaz; seed `branchId`'li yeniden
  üretilir (pilot/pre-launch). Dev seed akışı: okul → MEB import → öğretmen seed (branchId'li).
- **D9 — `/admin/subjects` silinir.** Route + `SubjectsPage` + `src/portals/admin/subjects/` (mock dahil)
  + sidebar "Dersler & Branşlar" linki kaldırılır. Tek subjects UI'ı = Akademik Yapı > Ders Kataloğu
  (**branşsız**, AS-1 korunur). Branş yönetimi = Branş Kataloğu kartı.
- **D10 — API: `BranchesController`.** Tüm branch uçları ayrı thin `BranchesController`'da (`ISender`
  delege), route **`api/v1/branches`**. Application yeri `Modules/Academics/Branches`.
- **D11 — Spec override.** `subjects-cekirdek-genisletme-spec.md` **D6** (Branch entity/CRUD eklenmez),
  **FE-S2** (SubjectsPage backend'e bağlanır), **D8** (branşsız katalog — bu KORUNUR) bağlamında: artık
  bağımsız Branch entity + per-school + master ref VAR. Uygulama anında o spec güncellenir +
  `modules/subjects/completion_status.md` & `modules/teachers/completion_status.md` "Spec Dışına
  Çıkılanlar" notu (tarih/sebep/onay).

## 3. Veri Modeli

**`master.branches`** (global, `MasterEntity`): `Id` (Guid PK), `Name` (string), `MebCode` (string?,
Japonca'da yok), `IsActive` (bool), `DisplayOrder` (int). 16 MEB branşıyla seed.

**`school.branches`** (tenant, `Entity, IHasTenant`): `Id` (Guid PK), `SchoolId` (Guid, interceptor),
`Name` (string), `MebCode` (string?), `MebBranchId` (Guid? FK→`master.branches`; null=özel),
`IsActive` (bool), `DisplayOrder` (int).
- **Filtered** unique **(SchoolId, MebBranchId) WHERE MebBranchId IS NOT NULL** → MEB dedupe (çoklu
  null/özel branş çakışmaz — SQL Server çoklu NULL'ı duplicate sayar, bu yüzden filtered); Unique
  **(SchoolId, Name)** → ad çiftlenmez (özel + MEB hepsi).
- Guard: `MebBranchId != null` → `Name`/`MebCode` immutable.

**`TeacherProfile`** (identity.profiles): `BranchId` (Guid? FK→`school.branches`), `SecondaryBranchIds`
(M2M join `identity.teacher_secondary_branches` (TeacherId, BranchId→`school.branches`)). Eski
`teacher_branch`/`teacher_secondary_branches`(json) düşer. *(Join tablosu da şemalı — identity.)*

## 4. Backend (oksis-api)

- **Domain** `Modules/Academics/Entities`: `MasterBranch : MasterEntity`; `Branch : Entity, IHasTenant`
  (Create/Update + guard); `TeacherProfile` FK alanları + `Assign*` güncellemesi.
- **Application** `Modules/Academics/Branches/{Commands,Queries,Dtos}`:
  - Queries: `GetSchoolBranches` (manage, `isActive` filtre), `GetMebBranches`.
  - Commands: `CreateBranch`, `UpdateBranch` (özel-only, guard), `SetBranchStatus`, `DeleteBranch`
    (in-use guard), `ImportMebBranches` (toplu + dedupe + idempotent).
  - FluentValidation + Mapster. In-use guard: `TeacherProfile.BranchId`/`SecondaryBranchIds` referansı.
- **Eşleşme uyarlaması:** `AssignSubjectTeachersCommandHandler` + `GetAvailableSubstitutesQueryHandler`
  → `branchId`→ad resolve → mevcut `SubjectBranchMatch`/`BranchFitResolver`'a verir (D7).
- **Infrastructure:** EF config (MasterBranch **master** şema; Branch **school** şema + global query
  filter; TeacherProfile FK); `SecondaryBranchIds` → `identity.teacher_secondary_branches` join;
  migration (`master.branches` + 16 seed; `school.branches`; identity.profiles FK dönüşümü); idempotent.
  **Şemasız tablo üretilmez** (D2).
- **API:** `BranchesController` (`api/v1/branches`): `GET ?includeInactive`, `GET /meb`, `POST`,
  `PUT /{id}`, `PUT /{id}/status`, `DELETE /{id}`, `POST /import-meb`. İzin: akademik-yapı yönetim izni.

## 5. Branş Kataloğu UI (oksis-web)

- **Konum:** Akademik Yapı sekmesi (`StructureTab`), Ders Kataloğu yanına "Branş Kataloğu" kartı.
- **Düzen:** Başlık "Branş Kataloğu · N branş" + "MEB'den getir" + "Yeni Branş"; shadcn DataTable
  kolonlar `BRANŞ · MEB KODU · KAYNAK (MEB/Özel rozeti) · DURUM`.
- **Satır aksiyonları:** Düzenle (özel-only; MEB satırı kilitli + tooltip), Aktif/Pasif, Sil (in-use engelli).
- **Aksiyonlar:** "MEB'den getir" → `POST /import-meb` + sonuç toast'ı (idempotent); "Yeni Branş" → drawer
  (`Ad*`, `MEB Kodu ops.`, `Aktif`) → `POST /branches`.
- **Veri:** React Query tenant-scoped key'ler; yeni `src/portals/admin/settings/api/branches/`
  (keys/queries/mutations, rooms ile paralel); i18n-keyed (tr/en).

## 6. Öğretmen Entegrasyonu (oksis-web + api)

- Öğretmen işe alım (`HireTeacherDialog`) + düzenleme: branş seçici `GET /api/v1/branches` (aktif) ile
  beslenir. Ana branş tek seçim (`BranchId`); yan branşlar çoklu (`SecondaryBranchIds`).
- İki mock liste (HireTeacherDialog 11 + subjects seed 16) **kalkar**.
- Liste/detayda branş **adı** (branchId→ad); "⚠ Branş eksik" `branchId == null`. Görevlendirme rozeti
  + `branchColor.ts` (ada göre renk) **değişmez**.
- **Bağımlılık notu:** Teacher `POST /teachers` ucu mock'tu; bu iş yalnız branş alanını FK lookup'a bağlar;
  teacher kaydet-yolu ayrı konu, BE ucu gelince FK alanları doğal oturur.

## 7. `/admin/subjects` Silme (D9)

- Sil: route + `SubjectsPage` + `src/portals/admin/subjects/` (mock dahil) + sidebar linki.
- **Silmeden önce:** `portals/admin/subjects`'ten dışarıya import grep doğrulaması (teacher/assignments
  kendi kaynağını kullanır — branş seçici artık `/branches` lookup'tan, mock'a bağımlılık yok).

## 8. Test Stratejisi (TDD)

- **Domain.UnitTests:** Branch guard (MEB-kaynaklı name/code immutable); Create/Update.
- **Application.UnitTests:** ImportMebBranches (dedupe + idempotent); CreateBranch; UpdateBranch
  (MEB reddeder); SetBranchStatus; DeleteBranch (in-use guard); **eşleşme regresyonu** (resolve-adla
  SubjectBranchMatch Matched/Secondary/OutOfField; BranchFitResolver Same/Near/Different; hard-block null).
- **Infrastructure.IntegrationTests:** **tenant izolasyonu** (Okul A ≠ Okul B branşları — global query
  filter) [Kural #1]; master.branches global; migration; teacher FK + join.
- **Frontend (vitest):** Branş Kataloğu (liste; MEB satırı kilitli; import toast; özel ekle; aktif/pasif;
  sil in-use); öğretmen branş seçici (lookup'tan; ana tek + yan çoklu); i18n key varlığı.
- **Doğrulama kapısı:** `dotnet build`+`test`+`format`, `npm run build`+`test` — yeşil.
- **Final kabul (kullanıcı istedi):** Tüm iş bitince **DevTools ile ekran + etki testleri** yeniden
  yapılır (Branş Kataloğu CRUD, MEB import, öğretmen branş seçici, `/admin/subjects`'in gittiği,
  görevlendirme rozetleri) — bu oturumun başındaki ekran/etki test yöntemiyle.

## 9. Kapsam Dışı (bilinçli)

- `master.branches` aylık MEB/e-Okul refresh job'ı (kaynak sonra kararlaşır).
- Haftalık saat seviye-bazlı entegrasyonu (plan B0.2H — ayrı iş).
- Subject↔Branch ilişkisi (Ders Kataloğu branşsız kalır — AS-1).
- Teacher `POST/PUT` backend create/update ucu (ayrı iş).

## 10. Açık Sorular

- Yok (brainstorming'de tüm kararlar netleşti).
