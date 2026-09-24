---
tags: [teknik-analiz, mufredat, ders-programi]
tarih: 2026-09-24
durum: backend + ekran uygulandı (iki depoda dal feat/alan-bazli-mufredat-profili, commit yok)
karar: Y-04
---

# Alan Bazlı Müfredat Profili — Tasarım

> **Karar:** `Y-04` ([[OKSİS - Yapısal Kararlar ve Eksikler]]) · **Kaynak:** Altınay AL ders
> programı raporu (aSc çıktısı, 13.09.2026) · **İlgili:** `Y-03` (şube alanı), `TB-239`, `TB-247`

## 1. Sorun

11. sınıftan sonra okullar şubeleri **alana göre** açar: Sayısal, Eşit Ağırlık, Sözel, Dil. Bir
seviyenin bütün şubeleri aynı alanda olabilir ya da seviyede farklı alanlar yan yana bulunabilir.
Her alanın seçmeli ders seti farklıdır:

| Ders | 11 Sayısal | 11 Eşit Ağırlık |
|---|---|---|
| Seçmeli Matematik | 6 | 6 |
| Seç. Fizik / Kimya / Biyoloji | 4 / 4 / 4 | — |
| Seç. Tarih / Coğrafya | — | 4 / 4 |
| Türk Dili ve Edebiyatı | — | 4 |

MEB çizelgesinde (TTK 09/05/2025-05) "alan" kelimesi geçmez: seçmeli havuz tektir, öğrenci seçer
(`Y-03`). Alan, okulun organizasyon kavramıdır. Ama saat kararının **birimi** olarak gerçektir.

OKSİS bugün müfredatı **sınıf seviyesi** başına tutuyor. Taslağın anahtarı `(okul programı,
seviye)`. `ClassRoom.Track` var (`Y-03`), ancak müfredat onu okumuyor. Sonuç:

- 11. sınıfın tek seçmeli kararı her 11 şubesine uygulanır. 11-A Sayısal ile 11-B EA aynı talebi
  alır, ders programı üreticisi iki şubeye de Seç. Fizik ve Seç. Tarih koymaya çalışır.
- Okulun alan bazlı ortak ders farkları da ifade edilemez (Altınay'da TDE Sayısal'da yok, EA'da var).

## 2. Karar (`Y-04`)

1. **Müfredat profili `(seviye, alan)` başına tutulur.** Alan boşsa profil seviye profilidir
   (bugünkü davranış). Alan profili yalnız alan tanımlanabilen seviyelerde açılabilir
   (`ClassRoom.TrackEligibleGradeLevelCodes` = 11, 12).
2. **Tam profil:** alan profili ortak + seçmeli + okul dersi satırlarının tamamını taşır.
   Ortak dersler de alana göre değişebilir. Seviye ve alan profilleri arasında miras **yoktur**.
   Profil açılırken seviye profilinden kopyalanır, sonra bağımsız yaşar.
3. **Ortak derste MEB'den sapma**, seçmelideki gibi **bilerek onayla** kabul edilir. Sapma bir
   engel değildir; uyarı + onay penceresidir (Müzik MEB 2 → okul 1).

**Neden tam profil (yalnız seçmeli değil):** Override, okul dersi, iki onay, sapma onayı, MEB
seçmeli grup kuralı ve açılış kontrol listesi bugün **taslak başına** çalışıyor. Anahtar
genişlediğinde hepsi alan profilinde değişmeden işler. "Seviye ortak + alan seçmeli" iki katmanlı
bir çözümleme kuralı gerektirirdi ve Altınay'ın alan bazlı ortak farkını yine ifade edemezdi.
Bedeli: ortak ders değişikliği her profile ayrı yazılır. **Kullanıcı kararı (2026-09-24):** ekranda
"diğer profillere de uygula" kolaylığı **yoktur** — her alan müfredatı yalnız kendi profiline yazılır.

## 3. Kavram

**Müfredat profili** = sezonun okul programında bir `(seviye, alan?)` çifti için taslak (hazırlıkta)
ya da snapshot (başlamış sezonda).

- 9–10: yalnız seviye profili (`alan = null`).
- 11–12: seviye profili her zaman vardır (kurulum onu açar). Okul kullandığı her alan için bir
  alan profili açar.
- **Şubenin profili:** `(şube.seviye, şube.alan)`. Alanı boş şube seviye profilini kullanır.
- **Geri düşüş yok:** alanı Sayısal olan şubenin Sayısal profili yoksa sessizce seviye profiline
  düşülmez. Seviye profili o şubenin gerçek müfredatı değildir; yanlış talep üretmek sessiz bir
  yalandır. Eksiklik açılış kontrol listesinde **engel** olarak çıkar (§5), aktif sezonda ise
  oluşamaz (§7).

## 4. Veri modeli

### 4.1 Şema

| Tablo | Değişiklik |
|---|---|
| `academic.school_curriculum_drafts` | `track nvarchar(20) NULL` (enum metin olarak, `ClassRoom.Track` emsali) · `common_deviation_acknowledged bit NOT NULL DEFAULT 0` |
| `academic.school_curriculum_snapshots` | `track nvarchar(20) NULL` |
| `ux_school_curriculum_drafts_active` | `(school_id, school_academic_program_id, grade_level_id, track)` · filtre `is_deleted = 0` |
| `ux_school_curriculum_snapshots_key` | `(school_id, school_academic_program_id, grade_level_id, track)` |

SQL Server tekil indeksinde `NULL` bir değer olarak sayılır. Bu yüzden seviye başına **tek** seviye
profili kuralını indeks kendisi korur, ek filtre gerekmez.

> ⚠️ **Uygulamada yakalanan tuzak:** EF SQL Server, boş bırakılabilir kolonlu tekil indekse
> kendiliğinden `[track] IS NOT NULL` süzgeci ekliyor. Süzgeci olmayan snapshot indeksinde bu, seviye
> profilini tekillik dışında bırakırdı. Yapılandırmada `HasFilter(null)` bilinçli olarak yazıldı;
> mimari bekçi (`CurriculumModelGuardTests`) süzgecin `null` olduğunu, entegrasyon testi de ikinci
> seviye profilinin gerçek SQL'de reddedildiğini ölçüyor.

**Göç:** mevcut satırlar `track = NULL` alır, yani hepsi seviye profilidir. Veri dönüşümü yoktur;
davranış değişmez. Override ve okul dersi tablolarına dokunulmaz: ikisi de taslağa bağlıdır, profil
taslağın kendisidir.

### 4.2 Domain

- `SchoolCurriculumDraft.Track` (`Track?`). `Create(..., Track? track, string gradeLevelCode)`:
  alan verildiyse seviye kodu `ClassRoom.TrackEligibleGradeLevelCodes` içinde olmalı. Aksi hâlde
  `SchoolCurriculumDraft.Track.NotEligibleGrade`. Kapının tek kaynağı ClassRoom'daki liste.
- `SchoolCurriculumDraft.CommonDeviationAcknowledged` +
  `ConfirmCommonReview(actor, now, deviationAcknowledged)`. `InvalidateReviews()` bunu da düşürür.
- `SchoolCurriculumSnapshot.Track` (`Track?`), `Create`'e parametre.
- `ResolvedCurriculumItem`'a `Track? Track` eklenir. Snapshot üreticisi satırları taslağa
  `(seviye, alan)` ile eşler; bugün yalnız seviyeyle eşliyor ve iki profil aynı seviyede olunca
  satırlar karışırdı.

## 5. Çözümleme ve tüketiciler

Ortak okuyucu `SessionCurriculum.LoadItemsAsync` **profil anahtarı** alır:
`IReadOnlyCollection<CurriculumProfileKey>` (`GradeLevelId`, `Track?`). Taslak çözücü
(`CurriculumDraftResolver`) ve snapshot okuması aynı anahtarla süzer. Yalnız seviye listesi
isteyen çağıranlar için `ForGrades(gradeIds)` yardımcısı o seviyelerin **bütün** profillerini döner.

| Tüketici | Dosya | Bugün | Yeni |
|---|---|---|---|
| Ders programı saat talebi | `Infrastructure/Timetable/CurriculumWeeklyHourProvider.cs` | şubenin seviyesi | şubenin `(seviye, alan)` profili. Profil yoksa boş talep (kontrol listesi zaten engeller). Eksik saat uyarısı ve üretim aynı porttan okuduğu için tek değişiklik noktası burası. |
| Okutulan dersler (görevlendirme kapsamı) | `CurriculumTaughtSubjects.cs`, `AssignmentProjections.cs` | seviye | seviyenin **bütün profillerinin birleşimi** (bir ders herhangi bir alanda okutuluyorsa seviyede okutuluyordur) |
| Gerekli toplam saat | `RequiredHoursResolver.cs` | seviye → toplam | **seviye profilinin** toplamı (alan profilleri toplanmaz, yoksa iki profilli seviye iki kat saat bildirirdi). Çağıranı yok (`TB-236`); profil başına toplam gerekirse sözleşme o gün genişler |
| Dersin seviye saatleri (ders bazlı düzenleyici) | `GetSubjectWeeklyHoursQueryHandler.cs` | seviye | **seviye profili** — yazma ucu `Track`'siz olduğunda seviye profiline yazar; alan profilleri müfredat tablosunda profil profil düzenlenir |
| Katalog saat aralığı | `GetCatalogWeeklyHoursQueryHandler.cs` | seviye | seviyenin **bütün profilleri** (aralık hepsini kapsar) |
| Şube alanı / alanlı şube açma | `SetClassRoomTrackCommandHandler.cs`, `CreateClassRoomCommandHandler.cs` | — | başlamış sezonda snapshot'ı olmayan alana 409 (`CurriculumProfiles.CanAssignTrackAsync`) |
| Sınıf durumu / onay / kontrol listesi | `CurriculumGradeStates.cs`, `SeasonActivationReadiness.cs` | seviye başına durum | **profil başına** durum; `GradeCurriculumState`'e `Track` |
| Snapshot üretimi | `Infrastructure/Academics/CurriculumSnapshotMaterializer.cs` | taslak başına, satır seviyeyle eşlenir | taslak başına, satır `(seviye, alan)` ile eşlenir; kısmi küme kontrolü üçlü anahtarla |
| Taslak kurulumu | `CurriculumDraftBootstrapper.cs` | seviye başına taslak | değişmez: yalnız seviye profillerini kurar. Alan profilini okul açar. |
| Yeniden tabanlama | `RebaseCurriculumDraftCommandHandler.cs` | seviyenin taslağı | seviyenin **bütün** profilleri (sürüm seviyeye aittir, profiller aynı sürümde kalır) |

## 6. Uçlar (eklemeli, geriye uyumlu)

`track` her yerde isteğe bağlıdır. Verilmezse seviye profili hedeflenir; bugünkü istemci
değişmeden çalışır. Değer `Track` enum adıdır (`Numerical`, `EqualWeight`, `Verbal`,
`ForeignLanguage`).

| Uç | Değişiklik |
|---|---|
| `GET curriculum/diff` | `grades` dizisi artık **profil başına bir kayıt** taşır (seviye profili önce, alan profilleri ardından). Kayda eklenen alanlar: `track`, `profileName`, `isTrackEligible`, `commonDeviates`, `commonDeviationAcknowledged`. `?track=` tek profili süzer. |
| `POST curriculum/grades/{code}/profiles` **(yeni)** | gövde `{ track, sessionId? }`. Seviye profilinden kopyalar: ortak override'lar, "Birini seçin" seçimleri ve okul dersleri kopyalanır; **seçmeli seçimler kopyalanmaz** (alan kararı). Onaylar boş başlar. Yalnız `Setup`. Aynı profil varsa 409 `curriculum.errors.profile-exists`. |
| `DELETE curriculum/grades/{code}/profiles/{track}` **(yeni)** | yalnız `Setup`. Sezonun aktif bir şubesi bu alandaysa 409 `curriculum.errors.profile-in-use`. Taslak ve override'ları yumuşak silinir. |
| `POST curriculum/grades/{code}/reset` | `?track=` |
| `POST curriculum/grades/{code}/alternatives` | gövdeye `track` |
| `POST curriculum/grades/{code}/review` | gövdeye `track`. `Part=Common` artık `AcknowledgeDeviation` da kabul eder (§8). |
| `PUT curriculum-hours/subjects/{id}` | her `Item`'a `track` eklenir. Uç birden çok profil kalemini kabul eder, ama ekran her zaman yalnız seçili profilin kalemini gönderir (kullanıcı kararı). |
| `GET curriculum/snapshot` | `?track=` süzgeci; yanıtta profil başına `track` |
| `GET curriculum/activation-preview` | durumlar profil başına; kontrol listesi kalemine `track` eklenir |

İzinler değişmez: okuma `curriculum-hours.view`, yazma `curriculum-hours.override`.

## 7. Açılış kontrol listesi ve aktif sezon

### 7.1 Kontrol listesi (`SeasonActivationReadiness`)

Bugünkü kalemlerin hepsi (`M1`–`M4`, `Y2`, `Y3`, `W_*`) **profil başına** değerlendirilir. Mesaj
profil adıyla başlar: "11 Sayısal: seçmeli ders kararı onaylanmadı." `ReadinessItem`'a `Track`
eklenir. `Y1_NO_CLASSROOM` ve `Y4_EMPTY_CLASSROOMS` seviye başına kalır.

**Kullanılan profil:** Sezonun aktif şubelerinin `(seviye, alan)` kümesi. 9–10'da seviye profili
her zaman kullanılır.

| Kod | Ağırlık | Koşul |
|---|---|---|
| `M5_TRACK_PROFILE_MISSING` **(yeni)** | 🔴 engel | Aktif bir şubenin alanı var ama o `(seviye, alan)` profili yok. Mesaj şubeleri sayar: "11-A, 11-C Sayısal; 11 Sayısal müfredatı açılmadı." |
| `W_UNUSED_TRACK_PROFILE` **(yeni)** | 🟡 uyarı | Alan profili var ama hiçbir aktif şube o alanda değil. Snapshot'a yine girer; ileride şube o alana geçebilir. |
| `W_COMMON_DEVIATION` **(yeni)** | 🟡 uyarı | Ortak toplam tutuyor ama satırlar MEB'den farklı ve okul bunu bilerek onayladı; sapan satırlar MEB → okul olarak mesajda. |
| `M1`–`M4`, `Y2`, `Y3` | 🔴 → **kullanılmayan profilde atlanır** | 11–12'de bütün şubeler alanlıysa seviye profili kullanılmaz. Onu onaylatmak anlamsız bir tıklama olur, bu yüzden engel üretilmez. Snapshot'a yine yazılır. |
| `M4_COMMON_TOTAL_MISMATCH` | 🔴 → **onaylandıysa 🟡** | §8 |

### 7.2 Aktif sezonda şube alanı

Snapshot donduktan sonra yeni profil açılamaz. Bu yüzden `Active` sezonda:

- `SetClassRoomTrack` ve alanlı şube oluşturma, hedef `(seviye, alan)` için snapshot yoksa 409
  `ClassRoom.Track.NoCurriculumProfile` döner ("11 Sözel müfredatı bu sezon açılmadı"). Kapı
  uygulama katmanındadır, çünkü DB'ye bakmak gerekir.
- Alanı temizlemek (`null`) serbesttir: seviye profili her zaman vardır.
- `Setup` sezonda kapı yoktur; eksik profil kontrol listesinde `M5` olarak engellenir.

## 8. Ortak derste MEB'den sapma

**Bugün:** `Common` onayı yalnız ortak **toplam** MEB beyanına eşitse verilir. Değilse 409 döner
ve açılış `M4` ile kilitlenir. Toplamı değiştirmeyen kaydırma (Müzik −1, Matematik +1) hiç
yakalanmaz.

**Yeni:**

- **Sapma, satır bazındadır:** herhangi bir ortak satırda okul saati MEB saatinden farklıysa
  (`IsOverridden`) ya da ortak toplam beyandan farklıysa profil sapıyor sayılır
  (`GradeCurriculumState.CommonDeviates`). "Birini seçin" grubundan seçim yapmak sapma değildir.
- `review` + `Part=Common`: grup seçimi eksikse 409 `alternatives-pending` (değişmez, engel kalır).
  Sapma varsa ve `AcknowledgeDeviation=false` ise 409 `curriculum.errors.common-deviation`. Ekran
  bu hatayı onay penceresine çevirir: sapan satırlar MEB saati → okul saati olarak listelenir.
  `true` ise onay `CommonDeviationAcknowledged = true` ile kaydedilir.
- Kontrol listesinde `M4` onaylanmış profilde 🟡 uyarı olur ("Okul bu farkı bilerek onayladı"),
  onaylanmamışsa 🔴 engel olarak kalır.
- Sapmalı onay, override'ın gerekçe alanını zorunlu kılmaz. Onayı kimin verdiği zaten kaydedilir.

## 8a. Seçenekli ders grubu: hiçbiri, biri ya da birkaçı (kullanıcı kararları, 2026-09-24)

MEB'in bölü işaretli satırından ("Beden Eğitimi ve Spor/Görsel Sanatlar/Müzik") okul **hiçbirini, birini
ya da birkaçını** okutabilir. İlk karar "en fazla bir, hiçbiri de olur" idi; aynı gün Altınay'ın 12 DİL
grubunda hem Beden Eğitimi hem Müzik okutulduğu görülünce (ders programı raporu) seçim sayısı sınırı kalktı.

- Gruptaki her ders seçmeli ders gibi **tek tek** seçilir: seçmek MEB saatini yazar, bırakmak 0. Yazma saat
  ucundan (`SetSubjectWeeklyHours`) ve yalnız seçili profile gider. Eski tek seçim ucu (`alternatives`,
  `SubjectId` boş = hiçbiri) sözleşmede kalır, ekran artık onu kullanmaz.
- Seçim sayısı **engel değildir**: `M1_ALTERNATIVES_PENDING` ve `alternatives-pending` artık üretilmez
  (kodlar eski istemciler için sözleşmede kalır).
- Tam bir seçimden sapan grup (hiçbiri ya da birden fazlası) **ortak derste MEB sapması** sayılır
  (`CommonDeviates`); ortak onay bilerek verilir. Onay penceresi grubu "hiçbiri okutulmuyor" ya da
  "N ders birlikte okutuluyor" diye listeler.
- Ekranda grup başlığı **"Seçenekli ders: …"**. Katlı hâlde seçilen bütün dersler görünür ("Değiştir"
  yalnız ilkinde); hiçbiri seçili değilse "Hiçbiri — okutulmuyor" satırı MEB saatini, okul 0'ı ve farkı
  gösterir. "Değiştir" ile açılan grupta onay kutuları vardır; seçim anında kaydedildiği için grup
  kendiliğinden katlanmaz, "Kapat" ile katlanır.

## 8b. Tablo düzeni: okul dersleri MEB dersleriyle birlikte (kullanıcı kararı, 2026-09-24)

Ayrı "Okul Dersleri" bölümü kalktı. Okulun **zorunlu** dersi (katalogda seçmeli değil) MEB ortak dersleriyle
**Ortak Dersler** bölümünde, okulun **seçmeli** dersi Seçmeli Dersler altında **"Okul Seçmelileri"**
kategorisinde durur. Her satırda kaynak etiketi var: **MEB** ya da **Okul**. Sunucu satıra
`isSchoolElective`'i (katalogdaki seçmeli işareti) taşır. Bölüm dip toplamı MEB satırları ile o bölümdeki okul
derslerinin toplamıdır; okul payı "Okul dersleri dahil: N saat" ipucuyla ayrıca yazılır.

⚠️ **Açık soru:** MEB sapma hesabı (ortak toplam, seçmeli "seçilebilecek" toplamı, `M3`/`M4`) hâlâ
**yalnız MEB satırlarını** sayıyor; ekrandaki dip toplam ise okul derslerini de içeriyor. Okul seçmelisi
MEB'in seçmeli kotasını doldurur mu, karar gerekiyor.

## 9. Ekran (oksis-ui)

> **Adlandırma (kullanıcı kararı, 2026-09-24):** seviye profilinin ekrandaki adı **"Temel Müfredat"**
> (çipte "Temel"). "Genel" reddedildi: "her alanda geçerli" diye okunuyordu, oysa alanlar ondan bir kez
> kopyalanır. "Ham" reddedildi: okulun kararlarını taşır; dokunulmamış MEB hâli tablodaki MEB Saati kolonudur.

> **Uygulandı (2026-09-24), sapmalar:** "Diğer profillere de uygula" önce profil çubuğunda tek anahtar
> olarak yapıldı, sonra kullanıcı kararıyla **kaldırıldı**: saat her zaman yalnız seçili profile yazılır.
> Açılan "Birini seçin" grubuna **"Vazgeç"** eklendi (seçim
> değiştirilmeden yeniden katlanır). Şube ekranındaki alan seçicisinin pasifleştirilmesi **yapılmadı**:
> başlamış sezonda sunucu 409 ile reddediyor ve mesaj Türkçe gösteriliyor. Alan etiketleri `core`'a
> taşındı (`SECTION_TRACK_LABEL`); sunucunun "Dil" etiketi şube ekranıyla aynı olsun diye "Yabancı Dil" oldu.
> **Ekranda ölçüldü (Altınay, Playwright):** alan ekleme (şubesi olan alanlar önde), kopyalama kuralı
> (Müzik 2→1 geldi, seçmeli gelmedi), ortak sapma onayı ve "MEB'den farklı" rozeti, yayılma (Sayısal'da
> TDE 5→4 Temel'e de yazıldı; geri alındı), onayın satır değişince düşmesi, kontrol listesinde `M5` ve
> profil etiketleri, şubesi olan alanın silinmesinin 409 ile reddi.


- Müfredat sayfasında 11 ve 12 sekmelerinde profil çipleri: `Temel · Sayısal · Eşit Ağırlık ·
  + Alan müfredatı ekle`. Çipte durum rozeti (onaylı / eksik). Kullanılmayan profil soluk
  gösterilir.
- "Alan müfredatı ekle" penceresi: seviyenin açık şubelerinden alanları önerir (profili olmayanlar
  önce), kopyalamanın kuralını tek cümleyle söyler ("Ortak dersler ve okul dersleri Temel müfredattan
  gelir; seçmeli kararı bu alan için ayrıca verilir").
- ~~"Diğer profillere de uygula" kutusu~~ — kullanıcı kararıyla kaldırıldı (2026-09-24); her profil
  yalnız kendine yazar.
- Ortak sapma onay penceresi: seçmeli sapma penceresinin kardeşi.
- **"Birini seçin" grubu (kullanıcı isteği, 2026-09-24 — bütün profillerde, seviye profili dahil):**
  seçim yapılmamışken grup bugünkü gibi seçenekleriyle açık görünür. Seçim yapıldıktan sonra grup
  **tek satıra** katlanır: seçilen ders + saati, yanında metin biçimli **"Değiştir"** butonu.
  "Değiştir" seçenekleri yeniden açar; yeni seçim yapılınca satır tekrar katlanır. Seçilmeyen
  seçenekler (0 saat) katlanmış hâlde listelenmez. Sunucu tarafında değişiklik gerekmez: grup
  anahtarı (`alternativeGroup`) ve seçili bilgisi (`isSelected`) diff yanıtında zaten var.
- Kontrol listesinde kalemler profil etiketiyle gösterilir; `M5` kalemi "Alan müfredatı ekle"ye
  bağlanır.
- Şube detayında alan seçicisi: aktif sezonda snapshot'ı olmayan alanlar pasif, ipucuyla.

## 10. Uygulama dilimleri

1. **Model ve göç:** domain alanları + kapı, iki kolon + indeksler, `ResolvedCurriculumItem.Track`,
   profil anahtarlı `LoadItemsAsync` / çözücü / snapshot üreticisi. Davranış değişmez; bütün
   profiller `null`.
2. **Profil uçları:** oluştur/sil, bütün yazma uçlarına `track`, diff/snapshot yanıtı profil listesi.
3. **Kontrol listesi + ortak sapma:** profil başına durum, `M5`, `W_UNUSED_TRACK_PROFILE`,
   kullanılmayan profil kuralı, `CommonDeviates` + onay.
4. **Tüketiciler:** ders programı saat sağlayıcısı, okutulan dersler birleşimi, `SetClassRoomTrack`
   kapısı.
5. **Ekran** (oksis-ui).

Her dilim `./scripts/test-changed.sh` ile yeşil kapanır. 1 ve 4, yeni SQL indeksi ve çözümleme
nedeniyle `--integration` ile de koşar ([[bellek-ici-test-db-kisitini-zorlamaz]]).

## 11. Test planı

- **Domain:** 9. seviyede alanlı taslak → `NotEligibleGrade`. `InvalidateReviews` ortak sapma
  onayını düşürür.
- **Çözücü:** aynı seviyede iki profil, satırlar karışmaz. Snapshot üreticisi iki profil için iki
  snapshot yazar; kısmi küme (`CURRICULUM_SNAPSHOT_PARTIAL`) üçlü anahtarla.
- **Profil oluşturma:** ortak override ve okul dersi kopyalanır, seçmeli seçim kopyalanmaz, onaylar
  boş. İkinci kez → 409. Kullanımdaki profili silme → 409.
- **Kontrol listesi:** Sayısal şube + profil yok → `M5` engel. Bütün 11 şubeleri alanlı → seviye
  profili için `M2`/`M3` yok. Kullanılmayan alan profili → uyarı.
- **Ortak sapma:** Müzik 2→1 onaysız → 409 `common-deviation`. Onaylı → `M4` uyarı. Toplamı koruyan
  kaydırma da sapma sayılır.
- **Ders programı:** 11-A Sayısal ve 11-B EA aynı seviyede, talep kümeleri farklı. Alanı boş şube
  seviye profilini alır.
- **Aktif sezon:** snapshot'ı olmayan alana `SetTrack` → 409. Temizleme serbest.
- **Entegrasyon (gerçek SQL):** `NULL`'lı tekil indeks seviye başına ikinci seviye profilini reddeder.

## 12. Kapsam dışı

- **Şube içi alt gruplar (Altınay 11 DİL / 12 DİL):** DİL öğrencileri e-Okul'da 11-A / 12-C
  listesinde, 30 saat şubeyle birlikte ve 10 saat ayrı ders alıyor. Bu öğrenci düzeyinde **ders
  grubu** ister; yoklama, not ve ödev kapsamını da değiştirir. Ayrı bir karar konusudur. Bu tasarım
  onu engellemez: ders grubu geldiğinde talebini bir alan profilinden okuyabilir.
- **Aynı alanda farklı müfredat (Altınay 12-B / 12-C, ikisi de EA):** önce okula sorulacak (S-03).
  Gerçekten gerekiyorsa şube bazlı istisna olarak sonraki bir dilimde ele alınır.
- **Sezon devrinde profil kopyalama:** yeni sezon bugün de önceki sezonun saat kararlarını
  kopyalamıyor, alan profilleri de kopyalanmaz. Tutarlı; ayrı bir iş olarak açılabilir.

## 13. Açık sorular

- ~~Alan profili alan dışı seçmelileri gizlesin mi?~~ **Kapandı (2026-09-24, kullanıcı):**
  gizlenmez. Sayısal profilinde Seç. Tarih de seçilebilir; hangi alanın hangi dersi alacağını okul
  belirler.
- ~~Kopyalamada "Birini seçin" seçimleri gelsin mi?~~ **Kapandı (2026-09-24, kullanıcı):** seçili
  gelir, gerekirse profilde değiştirilir.
