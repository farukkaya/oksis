# Görevlendirme — İş İhtiyacı ve Domain Analizi

> **Tarih:** 2026-09-01 · **Talep:** teknik implementasyondan bağımsız, "görevlendirme"
> kavramının iş ihtiyacını ve doğru domain modelini netleştirmek.
> **Bağlam:** `K-10` (2026-08-16) + `X-15` uygulaması (2026-08-18) + `K-12 §A1`
> düzeltmesi ([[OKSİS - Bulgu Arşivi]] §39). Bu belge o kararların ÜSTÜNE, iş
> ihtiyacı düzleminde yazıldı.

---

## 1. "Görevlendirme" tek kavram değil — üç ayrı soru

Karmaşanın kökü, üç farklı sorunun aynı adla çağrılması:

| # | Soru | Doğası | Zaman ekseni | Örnek |
|---|---|---|---|---|
| **S1 — Yetkinlik** | Kim **ne verebilir**? | Girdi (katalog kararı) | Sezon | "Ayşe Hoca bu sezon Matematik verebilir" |
| **S2 — Dağıtım** | Kim **nerede kaç saat verecek**? | Karar / niyet | Dönem | "9-A Matematik 6 saat → Ayşe" |
| **S3 — Fiili yük** | Kim nerede kaç saat **veriyor, ne zaman**? | Çıktı (ölçüm) | Hafta/gün | "Ayşe: Pzt 1-2 9-A Mat, ... toplam 24 saat" |

Tereddüdün tam adresi **S2**: elle mi yönetilmeli, programdan mı türemeli?
S1 ve S3 için tereddüt yok:

- **S1 türetilemez** — program, "kim ne verebilir" bilgisinden ÜRETİLİR; o bilgi
  programdan çıkarılamaz (tavuk-yumurta).
- **S3 türetilmek zorundadır** — elle tutulan bir "fiili yük" kaydı, programın
  her değişiminde bayatlar. Eski v1 `teaching_assignments` tam olarak buydu:
  elle tutulan bir S3 kopyası; kimse yazmıyordu, herkes okuyordu, sessizce
  yalan söylüyordu (`X-15` ölçümü).

## 2. Varsayım denetimi

| Varsayım | Durum |
|---|---|
| Branş kataloğu okul bazlı | ✔ Var — `Branch`; öğretmende `PrimaryBranch` + `SecondaryBranchIds` |
| Öğretmen profili branşla açılır | ✔ Var |
| **Haftalık ders kapasitesi profilde tanımlanır** | ❌ **YOK.** Kapasite bugün tek sabit: `TeacherWorkloadDefaults.WeeklyCapacity = 30`. Profilde alan yok; yük yüzdesi herkes için /30 hesaplanıyor. İhtiyaç gerçek, sistemde karşılığı henüz yok. |
| "Program oluştuğu anda dağıtım bilgisi ortaya çıkar" | ⚠️ Kısmen. Program bir yerden üretilir; üreticinin girdisi S1 + müfredat saatidir. Türetme yaklaşımı S1'i ortadan kaldırmaz, zorunlu kılar. |
| (örtük) "Öğretmenin tüm yükü programda görünür" | ❌ Ders DIŞI yükler var: nöbet, kulüp danışmanlığı, rehberlik, etüt/kurs, idari görev. Timetable'dan türetilemezler ama toplam yükün parçasıdırlar. Bugünkü yük ekranı bunları saymıyor. |
| (örtük) "Dağıtım kararını makine verebilir" | ⚠️ Teknik olarak evet (solver bugün veriyor), ama dağıtım okullarda pedagojik/politik bir karardır: kıdem, devamlılık ("9-A'yı geçen yılki hocası okutsun"), zümre dengesi. Makine seçtiğinde yöneticinin tek düzeltme dili "programı elle düzelt" olur. |
| "Users tablosunda oluşturulur" | ℹ️ Tarihsel not: `User` kavramı emekli (`TB-07`); bugün `Person` + `Account` + `Profiles`. İş analizini etkilemez. |

Türkiye bağlamında kapasite ayrıca **yasal bantlıdır**: maaş karşılığı 15 saat
(branş) / 18 (sınıf öğrt.), zorunlu + ihtiyari ek dersle ~30'a kadar; özel
okullarda sözleşmeye göre değişir. Yani kapasite tek sayı değil, öğretmen
tipine/sözleşmeye bağlı bir alan olmalı.

## 3. Eğitim kurumlarında yaygın yaklaşımlar

- **MEB pratiği (devlet):** Her eylülde **"ders dağıtım çizelgesi"** hazırlanır —
  kim hangi şubede kaç saat. Bu çizelge **programdan ÖNCE** onaylanır ve e-Okul'a
  girilir; ders programı bu çizelgeye göre YERLEŞTİRİLİR. Norm kadro da ders yükü
  toplamından türetilir. Yani gelenek: **S2 açık bir belgedir ve S3'ten önce gelir.**
  Ek ders bordrosu fiilen girilen saatten (S3) hesaplanır.
- **aSc Timetables / Untis:** Girdi "lessons" tanımıdır: sınıf × ders × öğretmen ×
  haftalık saat — S2 **açık girdidir**; solver esasen ZAMANA yerleştirir. Untis'te
  öğretmen "?" bırakılıp dağıtım da optimizasyona verilebilir — yani S2, "elle sabitle
  ya da makineye bırak" diye hücre hücre seçilebilir.
- **SIS'ler (PowerSchool ailesi):** "Section" (şube-ders bölümü) öğretmene atanır;
  master schedule builder dağıtımı da optimize edebilir ama atama ayrı varlıktır.

**Ortak desen:** S2 kavramsal olarak hep vardır; ürünler yalnız *onu kimin
doldurduğunda* ayrışır (insan / makine / hücre hücre karışık).

## 4. Görevlendirme ↔ ders programı ilişkisi

**Sözleşme–gerçekleşme ilişkisi:** S1+S2 sözleşme (niyet), program o sözleşmenin
zaman düzlemine izdüşümü, S3 gerçekleşme.

```
S1 Yetkinlik (sezon)     ┐
Müfredat saati (kademe)  ├──► SOLVER ──► Taslak program ──► YAYIN ──► S3 Fiili yük
S2 Dağıtım kısıtı (ops.) ┘                    ▲ elle düzeltme              │
                                                                          ▼
                                              vekâlet/iptal (ScheduleException) overlay
```

Oksis bugün (K-10 sonrası) S2'yi **tamamen kaldırmış** durumda: solver S1 +
müfredattan hem dağıtımı hem yerleşimi tek adımda üretir; S3 yayınlanmış
programdan tek noktada ölçülür (`TeacherCourseLoadProjection`). Aşağı akış
tüketicilerinin hangi soruyu sorduğu:

| Tüketici | Sorduğu soru |
|---|---|
| Ders programı üretimi | S1 + müfredat |
| Öğretmen yükü KPI | S3 / kapasite |
| Duyuru hedefleme ("kendi şubelerim") | S3 (yayınlanmış program) |
| Vekâlet aday havuzu | S1 (+ S3 çakışma kontrolü) |
| Not defteri kapsamı | S3 (yayınlanmış program, `is_reserving`) |
| Sezon devri | S1 kopyalanır; S3 yeni programla yeniden doğar |

Bu modelin **bilinen üç bedeli** (X-15 kapanışında da kayıtlı):
1. **Yayın öncesi boşluk** — program yayınlanana dek duyuru havuzu/yük boş.
2. **Dağıtım kontrolü dolaylı** — yönetici "9-A'yı Ali alsın" niyetini ancak
   taslağı elle düzelterek ifade edebilir; niyet kayıt altına alınamaz.
3. **Ders dışı yük kapsam dışı** — nöbet/kulüp/rehberlik yük ekranında yok.

## 5. Ayrı model mi, türetme mi? — Değerlendirme

Soru ikili değil üçlü; S1 ve S3'ün cevabı sabit, seçim yalnız S2'de:

| | (a) S2 yok — bugünkü Oksis | (b) S2 zorunlu elle (gelenek/v1) | (c) S2 opsiyonel **kısıt** |
|---|---|---|---|
| Tek doğruluk kaynağı | ✔ | ❌ programla senkron sorunu (v1'in battığı yer) | ✔ kısıt bayatlamaz, yalnız ihlal edilir — ihlal ölçülür |
| Yönetici dağıtım kontrolü | ❌ yalnız program editörü | ✔ tam | ✔ istediği hücrede |
| Veri girişi yükü | ✔ sıfır | ❌ şube × ders × öğretmen elle | ✔ yalnız umursanan hücreler |
| Yayın öncesi işlerlik | ❌ | ✔ | ⚠️ kısıt girilen kadar |
| MEB çizelge uyumu | ⚠️ rapor olarak türetilebilir | ✔ doğal | ✔ rapor + niyet birlikte |
| Dönem ortası değişim | ✔ versiyon + vekâlet | ❌ iki yerde güncelle | ✔ aynı mekanizma |

**Değerlendirmem:** Sezgin doğru — **fiili görevlendirme (S3) türetilmelidir** ve
sistem bunu zaten yapıyor; v1'i geri getirmek (b) yoluna dönmek olur ve `X-15`'in
ölçtüğü çift-kaynak kusurunu yeniden üretir. Ama "türetme"nin **S2'yi tamamen
yok etmesi şart değil**: dağıtım *niyeti* meşru bir iş kavramıdır ve en sağlıklı
biçimi **solver'a verilen opsiyonel kısıt**tır (c) — Untis'in "sabitle ya da ?
bırak" modeli. Kısıt bir gerçekleşme kaydı olmadığı için türetme modelinin tek
kaynak ilkesini bozmaz.

## 6. Önerilen domain modeli

Mevcut yapının üstüne **üç ekleme**, sıfır geri dönüş:

| Varlık | Durum | Rol |
|---|---|---|
| `Branch` katalog + profil branşları | var | S1'in ham maddesi |
| `SubjectTeacherAssignment` (v2, sezon bağlı) | var | **S1** — yetkinlik |
| `CurriculumHourTemplate` + `SchoolWeeklyHourOverride` | var | Talep: şube×ders×saat |
| **`TeacherProfile.WeeklyCapacityHours`** | **YOK → eklenmeli** | Yük yüzdesinin paydası; MEB tipleri preset, okul/sözleşme bazlı geçersiz kılma. Sabit 30 kalkar. |
| **`DistributionConstraint`** (S2, opsiyonel) | **YOK → eklenmeli** | Dönem bazlı; şube×ders → {sabit öğretmen \| hariç tut \| saat bölüşümü}. Tek tüketicisi solver + uyum raporu. Programı DOĞRUDAN etkilemez, üretimi yönlendirir. |
| `ScheduleProgram` / `LessonPlacement` (yayın) | var | S3'ün kaynağı |
| `TeacherCourseLoadProjection` | var | S3 türetiminin tek noktası |
| **Ders dışı yük görünümü** | **YOK → eklenmeli** | Nöbet + kulüp danışmanlığı (+ ileride etüt/kurs) kayıtlarından türetilen `NonTeachingLoad`; toplam yük raporda birleşir, veri modelinde birleşmez |
| **"Ders dağıtım çizelgesi" raporu** | türetilebilir | MEB/e-Okul ihtiyacı: yayınlanmış programdan S3 çıktısı olarak üretilir — geleneksel belgenin türetme modelindeki karşılığı |

**Değişmez kurallar (invariant):**
1. Programa giren her yerleşim bir S1 kaydına dayanır (bugün de böyle).
2. S2 kısıtı ihlal edilerek yayın yapılamaz — ya kısıt gevşetilir ya taslak düzeltilir; ihlal listesi yayın önizlemesinde görünür.
3. S3 asla elle yazılmaz; tek türetme noktası korunur.

## 7. Alternatifler — artı/eksi özeti

- **(a) Saf türetme (bugünkü):** en az kavram, en az giriş; dağıtım niyeti dilsiz.
  Küçük okul / tam otomasyona güvenen okul için yeterli.
- **(b) Zorunlu elle dağıtım:** MEB alışkanlığıyla birebir; çift kaynak riski,
  giriş yükü, senkron sorunu. v1 deneyimi bunun sahada çürüdüğünü gösterdi
  (yazan ekran yokken bile 10 okuma yolu ona bağlanmıştı).
- **(c) Türetme + opsiyonel kısıt (önerilen):** (a)'nın tek-kaynak disiplini +
  (b)'nin kontrol ihtiyacı; maliyeti bir kısıt varlığı ve solver'da uyum.
- **(d) Çift yönlü senkron** (program değişince atama tablosu otomatik güncellenir):
  reddedilir — iki kaynağın en kötü hâli; senkron kodu sonsuz bakım borcu.

## Sonuç

1. **"Görevlendirme ayrı modül mü, türetme mi?"** → *Fiili* görevlendirme türetilir
   (bugünkü model doğru); *yetkinlik* zaten ayrı ve kalmalı; *dağıtım niyeti*
   isteğe bağlı bir üretim kısıtı olarak modele girmeli.
2. Kaçırılan üç gerçek ihtiyaç: **kapasite alanı** (bugün sabit 30),
   **dağıtım kısıtı** (pinleme), **ders dışı yük görünürlüğü**.
3. Bu üçü "görevlendirme modülünü geri getir" değildir; türetme modelinin üstüne
   üç bağımsız, ayrı ayrı takvimlenebilir eklemedir.

> İlgili: [[OKSİS - Yapısal Kararlar ve Eksikler]] `K-10` · [[OKSİS - Bulgu Arşivi]] §39 ·
> `X-15` kapanışı (arşiv §"K-10'un ikinci ayağı")
