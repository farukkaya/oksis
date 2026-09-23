# Branş–ders uygunluğu: yan branş kalkıyor, okul düzeyi uygunluk kuralı geliyor — tasarım ve kararlar

> **Ne bu dosya:** Altınay kurulumunda eğitimci geri bildirimiyle çıkan iki işin tasarımı.
> 2026-09-23 salt okuma ölçümüyle çıkarıldı; kullanıcı kararları kesindir, tasarım kararları
> gerekçeleriyle burada bağlanır.
>
> Kapsam: **(1)** "yan branş" kavramının sistemden kaldırılması (`TB-245`'in kapanışı),
> **(2)** okulun MEB eşleşmesinin ÜSTÜNE kendi branş–ders uygunluk kuralını ekleyebilmesi
> (`TB-240`'ın okul tarafındaki çıkış yolu), **(3)** uygunluğu hesaplayan tek merkez,
> **(4)** görevlendirme çekmecesinde iki seçenekli alan-dışı uyarısı ve yeni "Branş–Ders
> Uygunluğu" ekranı.
>
> Depolar: `oksis-api` + `oksis-ui`, ikisi de mevcut `feat/meb-kaynakli-katalog` dalında (karar 16).
> Mobil kapsam dışı.
>
> Uygulama planı: `2026-09-23-brans-ders-uygunlugu-plan.md`.

## Ölçümden çıkan dayanaklar

1. **Yan branş yalnız okunuyor, hiç yazılmıyor** (`TB-245`). `TeacherProfile.SecondaryBranchIds`
   JSON primitive-collection kolonu (`identity.profiles.teacher_secondary_branch_ids`) ve
   `SetSecondaryBranchIds` var; ürün kodunda tek çağıranı yok — yalnız testler ve
   `TimetableDevSeederTests` sahnesi çağırıyor. `IdentityDevSeeder` bile "dev seed'de ikincil
   branş yok" diye geçiyor. Okuyan 12 yer: `SubjectBranchMatch`, `AssignmentProjections`,
   yedi görevlendirme handler'ı, `DeleteBranchCommandHandler`, `BranchFitResolver` +
   `GetAvailableSubstitutesQueryHandler`, `TimetableDevSeeder`. **Tel üzerinde de yaşıyor:**
   `TeacherDutyDto.SecondaryBranches`, `AssignedTeacherCardDto.TeacherSecondaryBranches`,
   `TeacherDutiesDto.SecondaryBranches`, `TeacherDutySummaryDto.SecondaryCount` ve `Match`
   alanının `"SecondaryBranch"` değeri istemciye serileşiyor; istemci `MatchKind`,
   `MATCH_TONE.yan`, `BranchTags`, `buildCandidateGroups`'un "Yan branş" grubu ve
   `"{n} yan branş"` sayacıyla bunları tüketiyor. `packages/core/src/duty/constants.ts`'teki
   `BRANCH_FIT_META.near.label = "Yan Branş"` ise **başka bir kavramın** (vekâlette `Near` =
   ortak alan) etiketi; yan branş verisini okumuyor, yalnız adı yanıltıcı.

2. **Uygunluk KATALOG uzayında hesaplanıyor ve elle açılmış branş hiçbir zaman eşleşemiyor.**
   `AssignmentProjections.LoadSubjectBranchesAsync` okul dersini `SubjectCatalogTranslation` ile
   çekirdeğe çevirip `master.subject_branches`'ten **katalog** branş kimliklerini döner;
   öğretmenin tenant branşı `LoadCatalogBranchIdsAsync` ile `MebBranchId` üzerinden kataloğa
   çevrilir ve karşılaştırma orada yapılır. `MebBranchId` boş olan okul branşı (Altınay'da
   "Rehberlik") sözlüğe girmez → o branşlı öğretmen **yapısal olarak** alan dışıdır. Okul dersinin
   çekirdek karşılığı yoksa küme boştur → alan dışı. İki mimari bekçi bu uzayı koruyor:
   `BranchCatalogTranslationTests` (çözücü çağıran dosya çeviri yardımcısı da çağırmalı) ve
   `SubjectCatalogTranslationTests` (`db.SubjectBranches` okuyan dosya ders çevirisi yapmalı).
   Bir kural değişikliği bu iki bekçiyi de güncellemek zorundadır.

3. **`TB-240`:** Anadolu Lisesi çizelgesinde 4 ortak + 12 seçmeli dersin `master.subject_branches`'te
   bağı yok (Birinci Yabancı Dil, Görsel Sanatlar/Müzik, İnkılap Tarihi…). Kök neden platform
   içe aktarımındaki ad eşleştirmesi; okulun bugün hiçbir çıkış yolu yok. Bu tasarım kök nedeni
   çözmez, okula çıkış yolu verir.

4. **İzin modeli.** Komut/sorgu üstünde `[RequirePermission("slug")]` + `[Tenancy(TenancyMode.Required)]`;
   katalog `PermissionSeedData.Rows()` (`HasData`), rol eşlemesi `RolePermissionSeedData.Rows()`
   (`HasData`), kimlikler `MasterSeedIds` + `SeedGuid.From("perm:<slug>")`. Rol kodu
   **`SCHOOL_ADMIN`** (`SchoolLevelRoles.SchoolAdminCode`, `MasterSeedIds.Roles.SchoolAdmin`).
   "Yalnız SchoolAdmin" kalıbı hazır: `AllPermissionIds()` listesine GİRMEYEN izin SuperAdmin'e
   gitmez; `AssignmentsCopySeason`, `DutiesManage`, `ExamsManage` böyle. Seed değişince EF göçü
   `InsertData` satırlarını kendisi üretir (`20260912_exams_place_school_admin` emsali).
   `RequirePermissionSeedCoverageTests` slug'ı seed'de olmayan izni kırmızıya düşürür.
   Görevlendirme okuma izni `assignments.view` — 2026-09-01'den beri TEACHER'da yok; fiilen
   SCHOOL_ADMIN + SUPER_ADMIN.

5. **Denetim kaydı = yapılandırılmış log.** `IAuditLogger.LogAsync(action, entityType, entityId,
   before, after, ct)` → `StructuredAuditLogger` (Serilog, tablo değil). Tüketicileri müfredat
   kaynak hattı handler'ları. Aynı arayüz kullanılır; yeni tablo açılmaz.

6. **Silme davranışı.** Depoda silme `SoftDeleteInterceptor` ile soft-delete'e çevrilir; FK'ler
   `Restrict` ama fiilen hiç tetiklenmez. Branş silme kapısı öğretmen kullanımına bakar
   (`DeleteBranchCommandHandler`); ders silme kapısı `SubjectUsageInspector` + mimari test
   `SubjectUsageCoverageTests` (`SubjectId` taşıyan her varlık ya kapıda ya gerekçeli istisnada).

7. **İstemci.** `GET /auth/me/context` → `ContextView.Permissions` (efektif izin slug'ları)
   zaten dönüyor ama **web'de hiçbir yer okumuyor**; ilk tüketici bu iş olacak. Ayarlar ›
   Akademik Yapı › Kataloglar kartı (`catalog-card.tsx`) üç sekmeli (`ders`/`brans`/`sinav`),
   Branş Kataloğu satırları zaten `ABadge` ile **MEB / Okul** rozetini kullanıyor.
   Görevlendirme çekmecesi (`drawer.tsx`) alan-dışı seçimde tek gerekçe alanı gösteriyor;
   aday DTO'su branş **adı** taşıyor, kimliği değil. Mobilde görevlendirme yönetimi **yok**
   (`apps/mobile` altında `assignments` geçmiyor).

8. **Entegrasyon takımı (`TB-231`).** `SubjectTeacherAssignmentTests.SeedAsync` dersleri
   tenant'sız `CreateDbContext()` ile ekliyor → `Cannot insert Subject without tenant context`.
   Bu turda dokunulan entegrasyon dosyalarında ders/kademe eklemesi tenant bağlamlı context'e
   taşınır; yeni testler baştan öyle yazılır.

## Bağlanan kararlar

| # | Konu | Karar | Kaynak |
|---|---|---|---|
| 1 | Yan branş | Kavram **kalkar**. Uyum iki değerli: `Matched` / `OutOfField` | kullanıcı |
| 2 | Kolon düşürme | Göç önce dolu satır sayar; 0 değilse durur (`THROW`) | kullanıcı |
| 3 | Kural anahtarı | **Okul kimlikleri**: `school.branches.id × school.subjects.id`; tenant entity | kullanıcı + §2 |
| 4 | MEB ilişkisi | Okul MEB eşleşmesinin üstüne **ekler**; MEB'i kapatamaz; kendi eklediğini geri alabilir | kullanıcı |
| 5 | Kural doğası | Kalıcı, öğretmenden bağımsız, okunurken hesaplanır; eski gerekçe metinleri dokunulmaz | kullanıcı |
| 6 | Yazma yetkisi | Yeni izin **`assignments.manage-branch-rules`**, yalnız `SCHOOL_ADMIN` (AllPermissionIds dışı) | kullanıcı + §4 |
| 7 | Okuma yetkisi | **`assignments.view`** — uyum rozetini görebilen, rozeti üreten kuralı da görür | kullanıcı + §4 |
| 8 | Açıklama | Zorunlu, 1–500 karakter; sunucu (validator + domain) zorlar; ekleyen + tarih audit alanlarından okunur | kullanıcı |
| 9 | İçerik sınırı | Yok; Matematik→Türkçe de eklenebilir | kullanıcı |
| 10 | Denetim | `IAuditLogger` ile `subject-branch-rules.added` / `.removed` | kullanıcı |
| 11 | Tek merkez | Yeni `SubjectBranchEligibility` yardımcısı; karşılaştırma **tenant branş uzayına** taşınır | §3 |
| 12 | Ekran yeri | Ayarlar › Akademik Yapı › Kataloglar kartına **4. sekme** "Branş–Ders Uygunluğu" | §6 |
| 13 | Silme | Kural **engel değil**; ders/branş silinince kuralları aynı işlemde soft-delete edilir | §5 |
| 14 | Sıralama | Önce yan branş kaldırılır, sonra çözücü ve tüketiciler; istemci tek codegen'le | plan |
| 15 | Vekâlet uyumu | `BranchFit` iki değerli: `Same` → **"Uyumlu Branş"**, `Different` → **"Uyumsuz Branş"**. `Near` kategorisi **kalkar** (ad değiştirilmez, kavram silinir); bugün Near alan aday Uyumsuz olur | kullanıcı (2026-09-23) |
| 16 | Dal | Yeni dal açılmaz; `feat/meb-kaynakli-katalog` üstünde devam | kullanıcı (2026-09-23) |
| 17 | Açık noktalar 2–3 | Silinmiş ders/branşın kuralı görünmez; MEB sonradan kapsarsa okul kuralı otomatik silinmez | tasarım önerisi, kullanıcı itiraz etmedi |

## 1 · Yan branşın kaldırılması

**Sunucu:** `TeacherProfile.SecondaryBranchIds` + `SetSecondaryBranchIds` silinir,
`TeacherProfileConfiguration`'daki `PrimitiveCollection` eşlemesi kalkar, `BranchMatchKind`
`{ Matched = 0, OutOfField = 1 }` olur, `SubjectBranchMatch.Resolve(Guid? mainBranchId,
IReadOnlySet<Guid> subjectBranchIds)` ve `BranchFitResolver.Resolve(candidateBranchId,
candidateSubjects, absentSubjectId, absentSubjectBranchIds)` imzaları daralır. DTO alanları
(`SecondaryBranches`, `TeacherSecondaryBranches`, `SecondaryCount`) **silinir** — istemci
`dto.secondaryBranches ?? []` yazdığı için ara dönemde kırılmaz, ama şekil değiştiği için
`generated/schema.ts` aynı turda yeniden üretilir ve `MatchKind` daraltılır (typecheck kalan her
tüketiciyi gösterir).

**Göç `20260923_drop_teacher_secondary_branch_ids`:** `DropColumn` öncesi ölçüm:

```sql
IF EXISTS (SELECT 1 FROM identity.profiles
           WHERE teacher_secondary_branch_ids IS NOT NULL
             AND teacher_secondary_branch_ids <> '[]')
    THROW 50001, 'teacher_secondary_branch_ids dolu satır içeriyor; göç durduruldu (TB-245 varsayımı bozuldu).', 1;
```

Kolon `TB-245`'e göre her satırda boş; ölçüm bunu **varsaymaz, doğrular**.

**İstemci:** `MatchKind = "Matched" | "OutOfField"`, `MatchTone = "ok" | "no"`, `BranchTags`
yalnız ana branş, aday grupları iki, öğretmen özet şeridi iki sayaç.

**Vekâlet (karar 15):** `BranchFit` `{ Same, Different }` olur; `BranchFitResolver`'daki `Near`
dalı silinir (sunucu enum'u + `duty/constants.ts` eşlemesi + `BRANCH_FIT_META` + `cls: "yan"`
stili). Etiketler: `same` → "Uyumlu Branş", `different` → "Uyumsuz Branş". `Near` tel üzerinde
string olarak serileşiyor — sunucu ve istemci aynı turda değişir.

## 2 · Kural modeli — `SubjectBranchRule`

```
Domain  : Oksis.Domain.Modules.Academics.Entities.SubjectBranchRule : TenantEntity
Tablo   : school.subject_branch_rules
Alanlar : Id, SchoolId, SubjectId (→ school.subjects), BranchId (→ school.branches),
          Reason (nvarchar 500, zorunlu) + TenantEntity audit (CreatedBy = Account.Id, CreatedAt,
          IsDeleted, DeletedBy/At, RowVersion)
Tekillik: ux_school_subject_branch_rules (school_id, subject_id, branch_id) WHERE is_deleted = 0
Fabrika : Create(schoolId, subjectId, branchId, reason) — boş kimlik ve boş/500+ açıklama
          AcademicsDomainException
```

"Kim ekledi" `CreatedBy`'dan `AssignmentProjections.LoadCreatorNamesAsync` ile (Account → Person)
çözülür; görevlendirme kartındaki "Atayan" ile aynı yol. Geri alma soft-delete'tir: satır
`is_deleted = 1` ile kalır (kim/ne zaman sildi audit alanlarında), filtreli tekil indeks aynı
ikilinin yeniden eklenmesine izin verir.

**Neden okul kimlikleri (karar 3), alternatifler neden reddedildi:**

- *Katalog kimlikleriyle (master.subject × master.branch) tenant satırı:* elle açılmış branşın
  (`MebBranchId = null`) ve okulun kendi dersinin (`MasterSubjectId = null`) katalog karşılığı
  yok → tam da kuralı en çok gerektiren iki durum modellenemezdi.
- *Öğretmen düzeyinde "bu öğretmen bu dersi okutabilir":* bu zaten görevlendirmenin kendisidir
  (gerekçeli alan-dışı atama). Kullanıcı isteği öğretmenden bağımsız, kalıcı kural.
- *Hesaplanmış uyumu kayıtta saklamak:* uyum bugün hiçbir yerde saklanmıyor; saklansaydı kural
  ekleme/geri alma geçmiş kayıtları elden geçirmeyi gerektirirdi. Okunurken hesap, "eski gerekçe
  metinleri kalır" kararını bedavaya verir.
- *`master.subject_branches`'e okul satırı eklemek:* platform tablosuna tenant verisi yazmak
  `TB-191`'in geri alınması olurdu.

## 3 · Tek merkez — `SubjectBranchEligibility`

`src/Oksis.Application/Modules/Academics/Assignments/Internal/SubjectBranchEligibility.cs`
(**public static** — `TimetableDevSeeder` Infrastructure'da, `InternalsVisibleTo` yok).

```
LoadEntriesAsync(db, subjectIds, ct) → Dictionary<subjectId, IReadOnlyList<EligibleBranch>>
LoadAsync(db, subjectIds, ct)        → Dictionary<subjectId, IReadOnlySet<Guid>>   (tenant branş id)
None                                  → paylaşılan boş küme

EligibleBranch(Guid BranchId, BranchEligibilitySource Source, Guid? RuleId)
BranchEligibilitySource { Meb, School }
```

Algoritma: okul dersi → çekirdek ders (`SubjectCatalogTranslation`) → `master.subject_branches`
→ katalog branş → **okulun kendi kopyası** (`db.Branches WHERE MebBranchId IN (...)`, tenant
süzgeçli; `ux_school_branches_meb` sayesinde katalog→okul eşlemesi tekildir) → `Meb` girdileri;
sonra `db.SubjectBranchRules WHERE SubjectId IN (...)` → `School` girdileri (aynı ikili MEB'de
zaten varsa eklenmez; MEB kazanır). Eşlemesi olmayan ders sözlükte **boş** kümeyle bulunur.

**Karşılaştırma uzayı tenant branşına döner.** Bugün öğretmen tarafı kataloğa çevriliyordu;
artık ders tarafı okula çevrilir. Sebep: kural okul kimliğiyle tutuluyor ve elle açılmış branşın
katalog karşılığı yok — katalog uzayında kalınsaydı kural hiç eşleşemezdi. Sonuç: tüketiciler
`TeacherProfile.BranchId`'yi **çevirmeden** verir; `LoadCatalogBranchIdsAsync`, `ToCatalogIds`,
`LoadSubjectBranchesAsync`, `LoadTeacherBranchesAsync` silinir; yerine
`AssignmentProjections.LoadTeacherBranchIdsAsync` (öğretmen → tenant `BranchId?`). Okulun içe
aktarmadığı MEB branşı kümede yer almaz — o branşı taşıyan öğretmen zaten olamaz.

Bekçiler yeniden yazılır: `BranchCatalogTranslationTests` → "çözücü çağıran dosya
`SubjectBranchEligibility.` de çağırmalı" (tek kaynak kuralı); `SubjectCatalogTranslationTests`
`_translationHelpers` listesinde `LoadSubjectBranchesAsync` yerine `SubjectBranchEligibility`.

Tüketiciler (hepsi yardımcıdan okur, kural ikinci kez yazılmaz): `AssignSubjectTeachers`,
`ListAssignableCandidates`, `ListCoursesWithCoverage`, `ListTeachersWithDutyCount`,
`GetCourseAssignments`, `GetAssignmentSummary`, `GetTeacherDuties`, `GetAvailableSubstitutes`
(`BranchFitResolver` — `Near` hesabı da tenant kümeleriyle çalışır), `TimetableDevSeeder`,
`AddSubjectBranchRule` ("MEB zaten kapsıyor" kontrolü), `ListSubjectBranchRules`.

## 4 · Komutlar, sorgu, izin, uçlar

| Uç | Komut/Sorgu | İzin | Sonuç |
|---|---|---|---|
| `GET  /api/v1/subject-branch-rules` | `ListSubjectBranchRulesQuery` | `assignments.view` | `SubjectBranchRulesDto` (branşa göre gruplu; MEB + Okul satırları) |
| `POST /api/v1/subject-branch-rules` | `AddSubjectBranchRuleCommand(SubjectId, BranchId, Reason)` | `assignments.manage-branch-rules` | 201 + `Guid` |
| `DELETE /api/v1/subject-branch-rules/{id}` | `RemoveSubjectBranchRuleCommand(Id)` | `assignments.manage-branch-rules` | 204 |

**Sunucuda zorlanan kurallar** (ekran yalnız yansıtır):

- Açıklama zorunlu: FluentValidation `NotEmpty` + `MaximumLength(500)` (400) ve domain fabrikası.
- Ders/branş okulun (tenant süzgeci) ve silinmemiş; yoksa 422 (`subject-branch-rules.subject-not-found`
  / `.branch-not-found`, Türkçe cümleli `Error`).
- MEB eşleşmesi zaten kapsıyorsa **409** `subject-branch-rules.errors.already-covered-by-meb` —
  MEB satırının silme ucu yok (`RuleId` boş), yani MEB kapatılamaz.
- Aynı okul kuralı varsa **409** `subject-branch-rules.errors.already-exists`; yarışta indeks
  ihlali de aynı koda çevrilir.
- Denetim: ekleme sonrası `LogAsync("subject-branch-rules.added", nameof(SubjectBranchRule), id,
  after: { SubjectId, SubjectName, BranchId, BranchName, Reason })`; geri almada `.removed`
  `before:` aynı şekil. Log başarısızsa istisna yukarı çıkar (mevcut sözleşme).

Yeni iki anahtar `ErrorMessageCatalog`'a girer (`ErrorMessageCatalogTests` zorlar).

**Ek tel alanları (istemcinin kural kurabilmesi için):** `AssignableCandidateDto.BranchId`
(ders modunda adayın tenant branş id'si, öğretmen modunda `null`) ve `TeacherDutyDto.BranchId`.
Bugün yalnız ad dönüyordu; kural kimlik ister.

## 5 · Silme davranışı (karar 13)

Kural, dersin ve branşın **katalog tanımının parçasıdır** (`SubjectGradeLevel` ile aynı sınıf),
bir okulun onları "kullanması" değil. Bu yüzden:

- **Engel üretmez.** `SubjectUsageCoverageTests._catalogDefinitionTypes`'a gerekçeli eklenir;
  `DeleteBranchCommandHandler` yan branş kontrolünü kaybeder, kural kontrolü **eklenmez**.
- **Sahibiyle birlikte gider.** `DeleteBranchCommandHandler` ve `DeleteSubjectCommandHandler`,
  kapı geçildikten sonra ilgili `SubjectBranchRules` satırlarını aynı `SaveChanges` içinde
  `RemoveRange` ile soft-delete eder. Sebep: silme soft olduğu için FK asla tetiklenmez; temizlik
  yapılmazsa "sahipsiz kural" satırı sessizce kalır, sonra branş aynı adla yeniden açılsa bile
  kural ona bağlanmaz (yeni kimlik) — kullanıcı için anlaşılmaz bir hayalet.
- **Pasife alma dokunmaz.** Pasif ders/branş kuralı korur; ekran satırı soluk gösterir. Aktife
  dönünce kural kendiliğinden yeniden geçerli — pasife almanın anlamı "geçici" olduğu için.
- FK'ler depo standardı `Restrict`; DB düzeyinde ikinci savunma hattı.

## 6 · Ekranlar (web)

### 6.1 Görevlendirme çekmecesi — iki seçenek

Alan-dışı seçim varken tek gerekçe alanı yerine iki seçenekli blok:

1. **"Yalnız bu atama için gerekçe yaz"** (varsayılan) — bugünkü davranış; gerekçe opsiyonel,
   rozet alan-dışı kalır.
2. **"Bu branş bu dersi her zaman okutabilir"** — yalnız `assignments.manage-branch-rules` iznine
   sahip oturumda görünür (`useMyContext().data.permissions`). Seçilince oluşacak kural(lar)
   listelenir (ders modunda: seçilen alan-dışı öğretmenlerin **farklı branşları × bu ders**;
   öğretmen modunda: öğretmenin branşı × seçilen alan-dışı dersler), tek **zorunlu** açıklama alanı
   açılır. "Görevlendir" → `ConfirmDialog` (`components/shared/confirm-dialog.tsx`): her kural
   için *"Bundan sonra branşı **X** olan her öğretmen **Y** için uygun sayılacak."* Onayda önce
   kurallar tek tek `POST /subject-branch-rules`, ardından atama gerekçesiz gönderilir. Kural
   isteği düşerse atama yapılmaz, hata `mutationErrorDesc` ile gösterilir.

Kural mutasyonu hem `qk.subjectBranchRules.all()` hem `qk.teacherAssignments.all()`'ı geçersiz
kılar — uyum okunurken hesaplandığı için kartlar kendiliğinden "Uyumlu"ya döner.

### 6.2 Yeni ekran — Ayarlar › Akademik Yapı › Kataloglar › **Branş–Ders Uygunluğu**

**Yer kararı (karar 12):** Kataloglar kartı zaten okulun kalıcı, sezondan bağımsız tanımlarını
(Ders / Branş / Sınav Türü) aynı kabukta topluyor ve Branş Kataloğu satırları **MEB / Okul**
rozetini bugün kullanıyor; kural da bu ailedendir (branş × ders, kalıcı). Görevlendirmeler sayfası
ise sezona bağlı, iki eksenli operasyonel bir ekran — kalıcı kural editörünü oraya koymak "bu
sezon" anlamını bulandırırdı. Ayarlar zaten yönetici footer nav'ında (`WEB_FOOTER_NAV_BY_ROLE.admin`)
olduğu için okuma iznini `assignments.view`'e hizalamak ekranda kimseyi dışarıda bırakmaz;
sunucu tarafında ise doğru soruya bağlar ("uyum rozetini kim görüyorsa kuralı da o görür").
Çekmecedeki onay penceresi ekrana `/settings?tab=structure&catalog=uygunluk` ile bağlanır
(`CatalogCard` başlangıç sekmesini `catalog` sorgu parametresinden okur).

**İçerik:** Branş başına grup (ad + MEB/Okul rozeti + "n ders"); grup içinde satırlar: ders adı ·
kod · kaynak rozeti **MEB** (kilit, salt okunur, ipucu "MEB öğretmenlik alanları kararı") /
**Okul** (açıklama · ekleyen · tarih · SchoolAdmin'de "Geri al"). Hiç dersi olmayan branş
"Bu branş henüz hiçbir dersi okutmuyor" satırıyla görünür (Altınay "Rehberlik"). Araç çubuğu:
arama (branş/ders adı), kaynak süzgeci (Tümü/MEB/Okul), **"Yeni Kural"** (yalnız yetkili):
branş `SelectBox` (aktif branşlar) + ders `SelectBox` (aktif dersler) + açıklama. Geri alma
`ConfirmDialog`: *"Bundan sonra branşı X olan öğretmenler Y için yeniden alan dışı sayılacak;
mevcut görevlendirmelerin gerekçe metinleri silinmez."*

Görevlendirme çekmecesinden eklenen kurallar burada aynı listede görünür — tek sorgu, tek kaynak.

### 6.3 Mobil

Kapsam dışı: `apps/mobile` altında görevlendirme yönetimi yok (ölçüldü); yan branş gösteren bir
yüzey de yok. Mobil yalnız `MatchKind` daralmasından etkilenmiyor çünkü tipi tüketmiyor.

## 7 · Testler

| Katman | Test |
|---|---|
| `Oksis.Domain.UnitTests` | `SubjectBranchRule.Create`: alanlar · trim · boş açıklama/500+ reddi · boş kimlik reddi; `TeacherProfileTests`'ten üç yan branş testi silinir |
| `Oksis.Application.UnitTests` | `SubjectBranchMatchTests` iki değerli; `BranchFitResolverTests` yan branş testi silinir; **`SubjectBranchEligibilityTests`** (MockQueryable): MEB bağı → okul branşı · elle açılmış branş kuralla eşleşir · eşlemesiz ders boş küme · MEB'in kapsadığı ikilide kural yinelenmez · içe aktarılmamış MEB branşı düşer; **`SubjectBranchRuleHandlerTests`**: MEB kapsıyorsa 409 · aynı kural 409 · ders/branş yok 422 · başarıda audit çağrısı · geri alma audit + Remove · silme handler'ları kuralları RemoveRange eder |
| `Oksis.Api.UnitTests` | `SubjectBranchRulesControllerTests`: route/Authorize/üç uç |
| `Oksis.Tests` (mimari) | `SubjectUsageCoverageTests` istisna satırı; `BranchCatalogTranslationTests` → tek kaynak kuralı; `SubjectCatalogTranslationTests` yardımcı listesi; `RequirePermissionSeedCoverageTests` yeni slug'ı görür; `MigrationsMatchModelTests` |
| `Oksis.Infrastructure.IntegrationTests` | `SubjectTeacherAssignmentTests`: yan branş senaryosu kalkar, **elle açılmış branş + kural → `Matched`** eklenir, ders eklemesi tenant bağlamına taşınır (`TB-231`); **`SubjectBranchRuleTests`**: filtreli tekil indeks gerçek DB'de (yarış → `DbUpdateException` → Conflict) · geri al + yeniden ekle serbest · tenant izolasyonu (A'nın kuralı B'de görünmez); `BranchTenantIsolationTests` yan branş testi silinir; `TimetableDevSeederTests` yan branş sahnesi kalkar |
| `packages/core` (vitest) | `buildCandidateGroups` iki grup; `hasSelectedOutOfField` değişmez; `subject-branch-rules/logic`: `canManageBranchRules` · `filterRuleGroups` · `isRuleFormValid` · `buildPendingRules` (çekmecedeki kural türetimi) |
| Ekran ölçümü | Plan Task 9: dev DB göçü, Altınay "Rehberlik" senaryosu uçtan uca |

## Kapsam dışı (bilinçli)

- **`TB-240`'ın kök nedeni** (platform içe aktarımında çizelge adı → karar adı eşlemesi). Bu
  tasarım okula çıkış yolu verir; platform düzeltmesi ayrı iş.
- **Kart üzerinden kural ekleme** (detaydaki alan-dışı gerekçe bloğuna "kural yap" kısayolu) —
  kullanıcı isteği çekmecedeki uyarı; ekran ölçümünde ihtiyaç çıkarsa ayrı tur.
- **Mobil** (§6.3).
- **Kural düzenleme** (açıklama değiştirme) — geri al + yeniden ekle yeterli; iz daha temiz kalır.
- **Öğretmen profilinde yan branş seçimi** (`TB-245`'in eski kapatma önerisi) — kavram kalktı.

## Açık noktalar (kullanıcı kararı gerektirir)

1. **Dal:** her iki depoda `feat/meb-kaynakli-katalog` hâlâ açık ve bu iş onun üstüne biniyor
   (TB-243 vb.). Plan yeni `feat/brans-ders-uygunlugu` dalını oradan açar; master'a ayrı PR mı,
   aynı dalın devamı mı — kullanıcı seçer.
2. **Kural silinmiş ders/branş için görünmez kalsın mı, "arşiv" olarak listelensin mi?** Tasarım
   görünmez (soft-delete + inner join). Denetim izi log'da.
3. **MEB eşleşmesi sonradan gelirse** (platform içe aktarımı `TB-240`'ı kapatınca) aynı ikili için
   okul kuralı gereksizleşir; ekran o satırı MEB olarak gösterir, okul kuralı listede kaybolur ama
   tabloda kalır. Otomatik temizlik yapılmıyor — istenirse ayrı iş.
4. ~~`near.label` "Yakın Alan"~~ → karar 15 ile bağlandı: `Near` kalkar, iki etiket.
