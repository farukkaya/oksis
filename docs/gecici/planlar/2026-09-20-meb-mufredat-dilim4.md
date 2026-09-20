# MEB Müfredatı — Dilim 4: Okul Yönetim API Sözleşmeleri Uygulama Planı

**Goal:** Okulun müfredatını *yönetebildiği* yüzeyi tamamlamak: hangi eğitim programını
kullandığını seçmek, MEB ile kendi kararı arasındaki farkı görmek, taslağı güncel MEB
sürümüne taşımak (rebase), sezonu açmadan önce sonucu önizlemek ve başlamış sezonun kilitli
müfredatını okumak. Dilim 1 modeli, Dilim 2–3 ise master veriyi kurdu; burada eksik olan
**okulun karar verme yüzeyidir**.

**Architecture:** Yeni tablo yok. Var olan tenant varlıkları (`SchoolAcademicProgram`,
`SchoolCurriculumDraft`, `SchoolCurriculumOverride`, `SchoolCurriculumCustomCourse`,
`SchoolCurriculumSnapshot`) üzerine komut ve sorgu eklenir. Taslak çözümü
`ICurriculumDraftResolver`, taslak/snapshot ayrımı `SessionCurriculum` üzerinden yapılır —
"hazırlıkta taslak, başlamış sezonda snapshot" kuralı tek yerde kalır (Dilim 1).

**Tech Stack:** .NET 10 / C# 13, EF Core 10 + SQL Server 2022, MediatR, FluentValidation,
Mapster, xUnit + FluentAssertions + NSubstitute + Testcontainers.

**Spec:** `docs/teknik-analizler/mufredat/meb-haftalik-ders-cizelgesi-entegrasyonu-tasarimi.md`
(onaylı, 2026-09-18) — §5.3, §5.4, §6.2, §6.3, §6.4, §6.5, §7, §11 "Dilim 4".
**Önceki dilimler:** Dilim 1 `c89c22bf`, Dilim 2 `db1c11b1`, Dilim 3 `1f0f60af` (hepsi master'da).

---

## Koddan ölçülen başlangıç durumu

Plan yazılmadan önce var olan yüzey sayıldı — "yok" sanılan bir şeyi ikinci kez yazmamak için:

| Yetenek | Durum |
|---|---|
| Sezon açılışında taslak kurulumu | **Var** (`CurriculumDraftBootstrapper`) |
| Taslağın katmanlı çözümü (override > MEB, + özel ders) | **Var** (`ICurriculumDraftResolver`, `ResolvedCurriculumItem`) |
| Ders başına saat yazma (override **ve** özel ders, silme dâhil) | **Var** (`SetSubjectWeeklyHours`) |
| Seviye hedef saati / ders saati / katalog özeti okuma | **Var** (3 sorgu + `CurriculumHoursController`) |
| Aktivasyonda snapshot dondurma | **Var** (`ICurriculumSnapshotMaterializer`) |
| **Eğitim programı seçimi** | **Yok** — kurucu her kademeye `IsDefault` programı otomatik veriyor |
| **MEB–okul fark görünümü** | **Yok** — veri `ResolvedCurriculumItem`'da hazır ama uç yok |
| **Yeniden tabanlama (rebase)** | **Yok** |
| **Aktivasyon önizlemesi** | **Yok** |
| **Snapshot okuma ucu** | **Yok** — snapshot yazılıyor ama okul okuyamıyor |

`SchoolCurriculumOverride` hem `CurriculumEntryId` hem `SubjectId` taşıyor. Rebase bu yüzden
mümkün: override, yeni sürümdeki aynı dersin satırına **ders kimliği üzerinden** yeniden
bağlanabiliyor.

---

## Global Constraints

- Bu plan yalnız **Dilim 4** içindir. Ekranlar (`oksis-ui`) bu dilimin dışındadır; tasarım
  §3'te de "UI ekranlarının bu backend diliminde uygulanması" kapsam dışıdır.
- Kod yalnız `/Users/farukkaya/Repositories/oksis-api`; plan, rapor ve domain notu yalnız
  `/Users/farukkaya/Repositories/oksis/docs`.
- Başlangıç dalı `master` (`1f0f60af`), uygulama dalı `feat/mufredat-okul-yonetimi`
  (worktree `.claude/worktrees/mufredat-okul-yonetimi`).
- **Yeni tablo ve göç yok.** Model Dilim 1'de kuruldu; bu dilim yalnız sözleşme ekler.
  Model değişikliği gerekirse önce tasarım güncellenir.
- **Tenant kırmızı çizgisi:** bütün yeni uçlar `TenancyMode.Required`; okuma
  `curriculum-hours.view`, yazma `curriculum-hours.override`. `IgnoreQueryFilters()` yok.
- **Başlamış sezona yazılmaz.** Program seçimi, rebase ve saat yazma yalnız hazırlıktaki
  (`Setup`) sezonda çalışır; aktif ve arşiv sezon yalnız snapshot okur (karar 0021).
- **Fark engel değildir.** MEB toplamına göre alt/üst sınır uygulanmaz; okul saati sıfıra
  indirebilir ve toplamı serbestçe değiştirebilir (tasarım §5.3).
- **Sessiz silme yok.** Rebase'te kaldırılan MEB dersinin okul override'ı silinmez; inceleme
  listesine taşınır ve kullanıcı karar verir.
- **Önizleme yazmaz.** Aktivasyon önizlemesi ve rebase önizlemesi salt okunurdur.
- AutoMapper, repository wrapper, lazy loading, controller `DbContext`, `async void`,
  `.Result`, `.Wait()` kullanılmaz.
- Her davranış değişikliği kırmızı testle başlar. Günlük kapı `./scripts/test-changed.sh`;
  SQL Server entegrasyonu `--integration` (Docker yalnız o sırada açık, sonra kapatılır).

---

## Veri sözleşmesi (kilitli)

### Fark görünümü — `CurriculumDiffDto`

```text
CurriculumDiffDto
  SessionId, SessionStatus            # Setup | Active | Archived
  IsLocked                            # true ise satırlar snapshot'tan okundu
  Grades[]:
    GradeLevelId, GradeLevelCode, GradeLevelName
    BaseVersion: { Id?, Code?, DecisionNumber?, AcademicYearCode?, SourceType }  # Master | Manual
    Rows[]:
      SubjectId, SubjectName
      MebHours?          # master referansı; özel derste null
      SchoolHours        # okulun uygulayacağı saat
      Difference?        # SchoolHours - MebHours; MebHours yoksa null
      IsCustomCourse, IsOverridden
    Totals: { MebTotal?, SchoolTotal, Difference? }
```

`Difference` **bilgi**dir, uyarı değil. Sıfır saatli MEB dersi satırda kalır ve `SchoolHours = 0`
görünür — okulun "bu dersi okutmuyorum" kararı görünür olmalıdır.

### Rebase raporu — `CurriculumRebaseReport`

```text
CurriculumRebaseReport
  FromVersionId?, ToVersionId, AcademicYearCode
  Grades[]:
    GradeLevelCode
    PreservedOverrides[]   # { SubjectId, SubjectName, WeeklyHours }
    AddedSubjects[]        # { SubjectId, SubjectName, MebHours }
    RemovedForReview[]     # { SubjectId, SubjectName, SchoolHours, WasOverridden }
  IsApplied                # önizlemede false
```

### Aktivasyon önizlemesi — `ActivationPreviewDto`

```text
ActivationPreviewDto
  SessionId, CanActivate
  Blockers[]: { Code, Message, GradeLevelCode? }
  Grades[]: { GradeLevelCode, ItemCount, TotalWeeklyHours, CustomCourseCount, SourceType }
```

### Yeni hata kodları

| Kod | HTTP | Ne demek |
|---|---|---|
| `CURRICULUM_PROGRAM_NOT_FOUND` | 404 | Eğitim programı yok ya da etkin değil |
| `CURRICULUM_PROGRAM_LEVEL_MISMATCH` | 400 | Program başka bir kademeye ait |
| `CURRICULUM_PROGRAM_ALREADY_SELECTED` | 200 | Aynı program yeniden seçildi (no-op, hata değil) |
| `CURRICULUM_REBASE_NO_TARGET` | 409 | Bu program ve yıl için yayımlanmış sürüm yok |
| `CURRICULUM_REBASE_SAME_VERSION` | 200 | Taslak zaten en güncel sürümde (no-op) |
| `CURRICULUM_SNAPSHOT_NOT_FOUND` | 404 | Sezonun kilitli müfredatı yok (henüz başlamamış) |

Var olan `CURRICULUM_SESSION_LOCKED`, `CURRICULUM_DRAFT_SESSION_REQUIRED`,
`CURRICULUM_DEFAULT_PROGRAM_MISSING` ve `CURRICULUM_PUBLISHED_VERSION_AMBIGUOUS` yeniden
kullanılır; yeni eşanlamlı kod üretilmez.

---

## Görevler

### T1 — Eğitim programı listesi ve seçimi

Bugün kurucu her kademeye `IsDefault` programı veriyor; okul Fen Lisesi ile Anadolu Lisesi
arasında seçim yapamıyor. Bu, tasarımın "okulun tek lise eğitim programı seçilir" (§6.2 adım 1)
maddesinin eksik kalan yarısı.

Kırmızı: program listesi okulun **açık kademeleriyle** sınırlıdır ve her program için o sezonun
akademik yılına ait yayımlı sürüm olup olmadığını söyler; başka kademenin programı seçilemez;
başlamış sezonda seçim reddedilir; aynı program yeniden seçilirse taslak yeniden kurulmaz.
Yeşil: `ListEducationProgramsQuery`, `SelectSchoolAcademicProgramCommand`,
`GET/PUT /curriculum/programs`.

**Kabul:** Program değişince o kademenin taslakları yeni programın yayımlı sürümüne bağlanır;
override'lar T4'teki **aynı** eşleme kuralıyla taşınır — iki ayrı taşıma mantığı yazılmaz.

### T2 — MEB–okul fark görünümü

Kırmızı: hazırlıktaki sezon taslaktan, başlamış sezon snapshot'tan okunur ve `IsLocked` bunu
söyler; özel dersin `MebHours`'u ve `Difference`'ı boştur; sıfır saatli satır listede kalır;
toplamlar satırlarla tutarlıdır; başka okulun sezonu 404 alır.
Yeşil: `GetCurriculumDiffQuery` + `GET /curriculum/diff`.

**Kabul:** Tek sorgu hem hazırlık hem başlamış sezonu yanıtlar; çağıranın hangi kaynaktan
okuduğunu bilmesi gerekmez (`SessionCurriculum` kuralı).

### T3 — Seviyeyi MEB'e döndürme

Rebase ve program değişiminden sonra gerçek bir ihtiyaç: "bu seviyede ne yaptıysam geri al".

Kırmızı: yalnız hazırlıktaki sezonda çalışır; seviyenin bütün override'ları silinir ve saatler
MEB'e döner; **özel dersler silinmez** ve sonuçta kaç tanesinin durduğu raporlanır; ikinci
çağrı no-op'tur.
Yeşil: `ResetGradeLevelToMebCommand` + `POST /curriculum/grades/{code}/reset`.

**Kabul:** Özel dersin sessizce silinmediği testle kanıtlanır — "geri al" komutunun okulun
kendi eklediği dersi de süpürmesi veri kaybı olurdu.

### T4 — Yeniden tabanlama (rebase)

Kırmızı: yalnız hazırlıktaki sezonda; hedef sürüm yoksa `REBASE_NO_TARGET`; taslak zaten güncel
sürümdeyse no-op; aynı dersin override'ı **korunur** ve yeni sürümün satırına bağlanır; yeni MEB
dersi MEB saatiyle görünür; kaldırılan ders **silinmez**, `RemovedForReview`'a düşer; özel
dersler değişmez; önizleme hiçbir şey yazmaz.
Yeşil: `RebaseCurriculumDraftCommand`, `GetRebasePreviewQuery`, ortak `CurriculumRebasePlan`
(saf hesap), `POST /curriculum/rebase`, `GET /curriculum/rebase/preview`.

**Kabul:** Önizleme ile uygulamanın raporu **birebir aynı** hesap sınıfından gelir; ikisi
ayrışırsa kullanıcı gördüğünden başka bir şeyi onaylamış olurdu.

### T5 — Aktivasyon önizlemesi

Kırmızı: açık olduğu hâlde taslağı olmayan seviye bir `Blocker` üretir ve `CanActivate = false`
olur; belirsiz yayımlı sürüm ve eksik varsayılan program da blocker'dır; temiz sezonda
`Blockers` boştur ve seviye başına satır sayısı/toplam saat gerçek taslakla tutar; önizleme
**hiçbir şey yazmaz**.
Yeşil: `GetActivationPreviewQuery` + `GET /academic-sessions/{id}/curriculum-preview`.

**Kabul:** Önizlemenin ürettiği seviye satırları, aktivasyon sonrası snapshot'la sayı ve toplam
olarak eşleşir (entegrasyon testiyle ölçülür).

### T6 — Snapshot okuma

Kırmızı: başlamamış sezon `SNAPSHOT_NOT_FOUND`; başlamış sezon kilitli satırları döner ve
kaynak sürüm künyesini (kod, karar numarası) taşır; sonradan yayımlanan yeni MEB sürümü yanıtı
**değiştirmez**; başka okulun snapshot'ı görünmez.
Yeşil: `GetSeasonCurriculumSnapshotQuery` + `GET /curriculum/snapshot`.

**Kabul:** "Yeni sürüm geçmişi değiştirmez" iddiası testte yeni bir sürüm yayımlanarak ölçülür,
varsayılmaz (karar 0021).

### T7 — Uçlar, yetki ve sözleşme bütünlüğü

- Yeni controller `SchoolCurriculumController` (`api/v1/curriculum`); saat uçları
  `CurriculumHoursController`'da kalır (kırmayalım).
- `ResultExtensions` eşlemeleri; `Tenancy` ve `RequirePermission` bütün uçlarda.
- Mimari bekçi: yeni tenant sorgularının `IgnoreQueryFilters` kullanmadığı doğrulanır.

### T8 — Doğrulama, Postman ve belgeler

- `./scripts/test-changed.sh --all` yeşil; Docker açık → `--integration` (müfredat süzgeci) →
  Docker kapalı.
- Statik tarama: kapsamda `TODO/NotImplementedException` yok.
- `docs/postman/mufredat/` altına **okul yüzeyi** koleksiyonu + curl referansı (merkez
  koleksiyonundan ayrı: farklı token, farklı kullanıcı).
- Domain notları: `Müfredat Sürümü`, `Sezon Müfredat Snapshotı`, `Müfredat` modül notu.
- Kalan borç ve açık sorular bulgu defterine.

---

## Kabul matrisi

| # | Beklenen davranış | Görev | Nasıl doğrulanır |
|---|---|---|---|
| 1 | Program listesi okulun açık kademeleriyle sınırlı | T1 | Birim |
| 2 | Başka kademenin programı seçilemez | T1 | Birim |
| 3 | Başlamış sezonda program değişmez | T1 | Birim |
| 4 | Program değişiminde override'lar taşınır | T1+T4 | Birim (ortak hesap) |
| 5 | Fark görünümü hazırlıkta taslak, başlamışta snapshot okur | T2 | Birim + entegrasyon |
| 6 | Özel dersin MEB saati ve farkı boştur | T2 | Birim |
| 7 | Sıfır saatli ders listede kalır | T2 | Birim |
| 8 | Seviye sıfırlama özel dersi silmez | T3 | Birim |
| 9 | Rebase override'ı korur | T4 | Birim |
| 10 | Rebase yeni dersi ekler | T4 | Birim |
| 11 | Rebase kaldırılan dersi incelemeye taşır | T4 | Birim |
| 12 | Önizleme ile uygulama aynı raporu verir | T4 | Birim |
| 13 | Rebase hedefi yoksa hata | T4 | Birim |
| 14 | Taslağı olmayan açık seviye aktivasyonu engeller | T5 | Birim |
| 15 | Önizleme sayıları snapshot'la eşleşir | T5 | Entegrasyon |
| 16 | Snapshot yeni sürümden etkilenmez | T6 | Entegrasyon |
| 17 | Tenant izolasyonu | T1-T6 | Entegrasyon |

---

## Kapsam dışı (bilinçli)

- **Ekranlar.** `oksis-ui` tarafı ayrı planlanır; bu dilim sözleşmeyi verir.
- **Seçim kuralları** (`CurriculumSelectionRule`): kategori asgarisi, önkoşul, dışlama.
  Gerçek dipnot metinleriyle birlikte tasarlanacak.
- **Aktif sezona MEB cascade'i.** Karar 0021 gereği yok.
- **Okul kullanıcısının master veriyi değiştirmesi.** Hiçbir uç bunu açmaz.
- **Şube ve öğrenci bazlı farklılıklar.** Müfredat okula/şubeye/öğrenciye doğrudan bağlanmaz
  (tasarım kararı 4-5); bu katman okul ders planıdır ve ayrı iştir.
