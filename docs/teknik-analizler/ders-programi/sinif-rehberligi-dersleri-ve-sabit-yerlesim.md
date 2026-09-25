---
tags: [teknik-analiz, ders-programi, mufredat]
tarih: 2026-09-25
durum: onaylandı (2026-09-25) — uygulanıyor, dal feat/sinif-rehberligi-dersleri
karar: Y-05
---

# Sınıf Rehberliği Dersleri ve Sabit Yerleşim Kuralları — Tasarım

> **Karar:** `Y-05` ([[OKSİS - Yapısal Kararlar ve Eksikler]]) · **Bulgular:** `E-32`, `TB-253`
> · **İlgili:** `Y-04` (alan bazlı müfredat), `K-10` (program görevlendirmeyi tüketir), `K-14`
> (dağıtım kısıtları), `B9.4` (Altınay ders programı)

## 1. Sorun

Altınay'da üç saat türü var: **Deneme** (9–12, 2 saat), **Koçluk** (9–10, 1 saat), **Rehberlik**
(MEB'in beyan ettiği rehberlik ve yönlendirme saati, 1 saat). Üçüne de **o şubenin sınıf rehber
öğretmeni** girer. Bugün hiçbiri programa gelmiyor:

- Programın talep listesi müfredat × öğretmen yetkinliğinden türüyor (`CompetencyAssignmentSource`).
  Deneme ve Koçluk'un yetkinlik görevlendirmesi yok. Rehberlik müfredatta ders satırı değil,
  toplam beyanı (`MebGuidanceHours`).
- Şubedeki öğretmeni üretici kapasite ağırlıklı dağıtımla seçiyor; `ClassRoom.HomeroomTeacherId`
  ders programının hiçbir yerinde okunmuyor.
- Tek elle yol: her rehber öğretmene alan dışı yetkinlik + her şube × ders için öğretmen sabitlemesi
  (`K-14` Pin). Altınay'da yaklaşık 30 kayıt; rehber öğretmen değişince sabitleme eski kişide kalır.
- Okul bu saatleri **belirli gün ve saatte** istiyor (Rehberlik Cuma son ders, Koçluk Cuma 7. ders,
  Deneme Salı son iki ders blok). "Dersi şu gün şu saate koy" kavramı yok: Pin yalnız öğretmeni
  sabitliyor. Üretici her çalıştırmada programı sıfırdan kurduğu için elle konan yerleşimler de kalıcı değil.

## 2. Kararlar (2026-09-25, kullanıcı)

1. Bu dersler **not almaz**, not ve karne ekranlarında görünmez; **yoklaması tutulur**.
2. Rehberlik saati **MEB'in beyan ettiği saattir**; okul dersi olarak eklenmez.
3. Asıl araç **sabit yerleşim kuralı**; hücre menüsünden elle yerleştirme istisna ve düzeltme içindir.
4. **Deneme tüm şubelerde aynı anda** yapılır (okul geneli etkinlik).
5. Bir öğretmenin birden fazla şubenin rehber öğretmeni olabilmesi **kalır**. Altınay'da 9-B'ye
   ayrı öğretmen atanacak (kullanıcı ekrandan). Çakışma yine de tasarımda ele alınır (§5).

## 3. Model

### 3.1 Ders türü: "Sınıf rehberliği dersi"

Katalogdaki derse (`Subject`) bir **öğretim türü** eklenir: `Branch` (varsayılan, bugünkü davranış)
ya da `Homeroom` ("Sınıf rehberliği dersi"). `Homeroom` üç şey demektir, ayrı ayrı açılmaz:

| Davranış | Anlamı |
|---|---|
| Öğretmen | Şubenin sınıf rehber öğretmeni. Yetkinlik görevlendirmesi gerekmez, istenmez. |
| Not | Not defteri açılmaz; not, karne ve not takip ekranlarında görünmez. |
| Yoklama | Tutulur (diğer derslerle aynı). |

Neden tek tür: üç davranış Altınay'daki her örnekte birlikte geliyor; ayrı anahtarlar kombinasyon
sayısını ve yanlış yapılandırma ihtimalini artırır. İleride ayrışırsa tür ikiye bölünür.

Katalog formunda "Sınıf rehberliği dersi (şubenin rehber öğretmeni girer, not almaz)" seçeneği.
MEB kaynaklı derste de seçilebilir (ör. MEB'in rehberlik dersi).

### 3.2 Rehberlik saati programa girer

MEB'in rehberlik beyanı (`CurriculumGradeTotal.GuidanceHours`) programın talep listesine
**bir satır** olarak girer: ders = okulun katalogdaki rehberlik dersi (türü `Homeroom`), saat =
beyan. **Uygulandı (2026-09-25):** ders katalogda türü `Homeroom`, aktif ve adı "Rehberlik ve Yönlendirme"
olan ders olarak aranır (Türkçe büyük/küçük harf duyarsız). Yoksa **otomatik açılmaz** (talep okuması yan
etkisiz kalmalı): satır "Katalogda rehberlik dersi yok" gerekçesiyle yerleşmemiş kalır, yayın önizlemesi
eksik saat sayar. Açma katalog ekranındandır. Ada bağlılık kırılgan; ileride sabit işaret ya da okul ayarı.
Müfredat tablosundaki mevcut "Rehberlik ve Yönlendirme" bilgi satırı değişmez; toplamlar
değişmez (zaten dahil).

*Doğrulanacak:* rehberlik beyanı olan her seviye (9–12) için satır; beyanı olmayan seviyede satır yok.

### 3.3 Sabit yerleşim kuralı

Yeni kayıt, sezona bağlı: **`FixedPlacementRule`**

| Alan | Açıklama |
|---|---|
| Ders | Katalogdaki ders (tür şartı yok; branş dersi için de kullanılabilir) |
| Gün | Pazartesi…Cuma |
| Başlangıç saati | Sayı (7. ders) ya da **göreli: "son ders"** |
| Uzunluk | 1 ya da 2; 2 = **blok** (ardışık, tek blok olarak işaretlenir) |
| Kapsam | Tüm şubeler · seviye(ler) · şube(ler) |

"Son ders" sayı olarak saklanmaz: o günün zil şablonundaki (`BellDayAssignment` → şablon)
son `Lesson` satırı. Cuma şablonu değişirse kural kendiliğinden izler. Göreli değer ve uzunluk
birlikte çalışır: "son ders, uzunluk 2" = son iki ders.

Bir şube + ders için en fazla bir kural geçerlidir; daha dar kapsam genişi ezer (şube > seviye >
tüm şubeler). Böylece "Rehberlik tüm şubelerde Cuma son ders, 9-B'de Cuma 7. ders" yazılabilir.

Altınay'ın kuralları:

| Ders | Gün | Saat | Uzunluk | Kapsam |
|---|---|---|---|---|
| Rehberlik | Cuma | son ders | 1 | Tüm şubeler |
| Koçluk | Cuma | 7 | 1 | 9, 10 |
| Deneme | Salı | son ders | 2 (blok) | Tüm şubeler |

## 4. Üretici ve editör

### 4.1 Talep (demand)

`CompetencyAssignmentSource` iki kaynaktan beslenir:
- **Branş dersleri:** bugünkü gibi (müfredat × yetkinlik × dağıtım + K-14 kısıtları).
- **Sınıf rehberliği dersleri:** müfredattaki `Homeroom` türü dersler + §3.2 rehberlik satırı;
  öğretmen = `ClassRoom.HomeroomTeacherId`. Rehber öğretmeni yoksa satır "öğretmensiz" olarak
  yerleşmemiş kalır ve gerekçesi yazılır: "Şubenin rehber öğretmeni yok".
- **Uygulandı:** öğretmen sırası şube bazlı Pin → rehber öğretmen → öğretmensiz (gerekçeli). Exclude bu
  satırlara uygulanmaz. Talep satırı gerekçe taşır (`AssignmentLine.UnassignedReason`, `IsPlaceable`);
  yerleşmemiş dersler ucu ve editör gerekçeyi gösterir, üretici yerleştirilemeyen satırı atlar.

### 4.2 Sıra: önce sabitler

1. **Sabit yerleşim:** her şube için geçerli kurallar çözülür ve hücreler **kesin** olarak basılır
   (öğretmen müsaitliği `Unavailable` ise ve şube dışı çakışma varsa §5).
2. Kuralın kapsadığı saat müfredat saatinden düşülür; kalan saat normal akışa girer
   (Deneme 2 saat + kural 2 saat → kalan 0).
3. **Normal çözüm:** kalan talep mevcut açgözlü çözücüyle yerleşir; sabit hücreler dolu sayılır.

Kurallar her çalıştırmada yeniden uygulandığı için "üretici elle konanı siliyor" sorunu bu
saatlerde ortadan kalkar. Sabit hücreler ızgarada kilit işaretiyle görünür.

Altınay'da ızgara 40/40 dolu; sabitlerin önce yerleşmesi çözücünün en zor kısmını (sona kalan tek
saatlik dersler) da rahatlatır.

### 4.3 Uyum denetimi (kural ↔ müfredat)

| Durum | Sonuç |
|---|---|
| Kural saati = müfredat saati | Tamam |
| Kural saati < müfredat saati | Kalan saat normal dağıtılır |
| Kural saati > müfredat saati | Kural kaydında uyarı; fazla hücre basılmaz |
| Ders o şubenin müfredatında yok | Kural o şubede uygulanmaz, önizlemede bilgi |
| Kural hücresi zil şablonunda ders saati değil | Kayıt reddedilir |

### 4.4 Editör (hücre menüsü)

- **Boş hücre menüsü (yeni):** tıklanınca o şubenin yerleşmemiş talebi listelenir (yan panelle aynı
  kaynak); sınıf rehberliği dersleri de listede, öğretmenleri hazır.
- **Dolu hücre menüsü:** "değiştir" aynı listeyi kullanır.
- **Sabit hücre:** menüde "Rehberlik kuralından (Cuma son ders)"; taşıma/silme uyarı ile yapılır ve
  yalnız bu program sürümünü etkiler (kural değişmez).
- `TB-253` ile birlikte: elle yerleştirme sunucuda "ders bu şubenin müfredatında yok" diye reddeder;
  sınıf rehberliği dersinde öğretmen rehber öğretmen değilse alan dışı gibi gerekçe ister.

## 5. Çakışmalar

- **Aynı öğretmen iki şubenin rehber öğretmeni** (Altınay 9-A/9-B bugün): tüm şubelere aynı saat
  kuralı öğretmeni iki sınıfa koyar. Üretici **sessizce çözmez**: ilk şube yerleşir, diğer hücre boş
  kalır; önizlemede "9-B: Rehberlik Cuma son ders — rehber öğretmen aynı saatte 9-A'da". Çözüm şube
  bazında: o şubeye dar kapsamlı kural (farklı saat) ya da o şubede öğretmen sabitlemesi (K-14, gerekçeli).
- **Deneme (okul geneli, aynı anda):** her şubede rehber öğretmen gözetmen. Aynı çakışma kuralı geçerli.
- **Öğretmen müsait değil** (`Unavailable`): sabit hücre basılmaz, önizlemede gerekçe; `PrefersNot`
  engellemez.
- **Şube dışı meşguliyet** (öğretmen başka şubenin canlı programında o saatte): basılmaz, gerekçe.

## 6. Not ve yoklama

- Not defteri ve karne, ders programı yerleşimlerinden türüyor (`GradeBookResolver` →
  `ITeachingSlotReader`). `Homeroom` türü dersler bu türetmede **süzülür**: not defteri açılmaz,
  not takip, karne ve veli/öğrenci not ekranlarında görünmez.
- Yoklama değişmez; ders saati olarak tutulur. **Ölçüldü (2026-09-25):** yoklama oturumu ders programı
  yerleşiminden açılır (`AttendanceRosterBuilder`, `session.PlacementId`); ders programa girince yoklaması
  kendiliğinden tutulur, ek iş yok.
- Not tarafında `ITeachingSlotReader` çok okuyuculu (not defteri, not takip, karne, veli notları, hatırlatma,
  sınav beklentisi, ödev kapsamı). Süzgeç **tek yerde** uygulanır, ekran ekran değil.
- **Uygulandı:** tek tanım `GradedPlacements.WhereGraded`; Grades süzülmüş `IGradedTeachingSlotReader`'ı
  kullanır, mimari bekçi (`GradedPlacementGuardTests`) süzülmemiş okuyucuyu Grades'te yakalar. Exams'te sınav
  beklentisi ve sınav yerleştirme kapısı süzülür; sınav saati ızgarası ve gözetmen türetimi süzülmez (öğretmen
  o saatte meşgul). **Ödev süzülmez** (bu derslere ödev verilebilir). Açık: notu girilmiş ders sonradan
  `Homeroom` yapılırsa eski not karnede kalır — tür değişiminde notlu deftere karşı koruma gerekebilir.
- Öğretmen haftalık yükü: bu saatler rehber öğretmenin ders yüküne sayılır (programdaki her hücre gibi).

## 7. Ekranlar

- **Ayarlar › Akademik Yapı › Dersler:** ders formunda öğretim türü seçimi.
- **Ders Programı › Sabit Yerleşim Kuralları (yeni):** liste + form (ders, gün, saat/son ders, blok,
  kapsam). Satırda uyum durumu (§4.3).
- **Editör:** boş hücre menüsü, kilitli hücre gösterimi, önizlemede kural ihlalleri.

## 7a. Uygulama notları (dilim 3–4, 2026-09-25)

- **Kayıt:** `academic.fixed_placement_rules` + `fixed_placement_rule_targets` (göç `20260925_fixed_placement_rules`).
  Kapsam 1 tümü · 2 seviye · 3 şube (sayı = darlık sırası); hedef kimlikleri ayrı tabloda. "Son ders" `start_period = NULL`,
  okumada zil şablonundan çözülür (kapalı gün 0 ders; ataması olmayan gün Tam Gün sayılır). Uçlar
  `/api/v1/timetable/fixed-placement-rules`, izin K-14 ile aynı (`timetable.manage` / `timetable.view-all`).
- **Çakışan kural:** aynı kapsam düzeyinde hedefleri kesişen iki kural aynı dersi taşıyorsa ya da aynı gün ve kesişen
  saatlere düşüyorsa kayıt reddedilir. Farklı düzeylerde farklı dersler aynı hücreyi isterse dar kapsam basılır, diğeri
  "hücre daha dar kapsamlı başka kuralla dolu" ihlali alır.
- **Üretici:** `FixedPlacementPlanner` çözümden önce basar; şubeler seviye → ad sırasıyla. Basılamayan hücre boş kalır,
  saat başka yere taşınmaz, eksik saate sayılır. Nedenler: öğretmen yok, `Unavailable`, başka şubenin kural hücresinde,
  şube dışı canlı programda meşgul, derslik meşgul. Uzunluk 2 hücreleri Apply'da blok işaretlenir.
- **İşaret:** `LessonPlacement.FixedRuleId` (FK yok). Hücre taşınınca bağ kopar, öğretmen değişince kalır.
  Açık: yayın snapshot'ı/geri yükleme bu bağı taşımıyor (geri yüklenen sürümde kilit kaybolur).
- **Önizleme:** `fixed-rule-violation` / `-warning` / `-info`; örnek "9-B: … Cuma son ders — öğretmen aynı saatte 9-A
  şubesinde". Yayın çekmecesi artık "yayına hazır" durumdaki yumuşak uyarıları da listeler (K-14 ve kapasite dahil).
- **Uyum özeti:** liste ucunda kural başına `ok` / `warning` / `info` / `inactive`, uygulandığı şube sayısı, ezilen
  şubeler, şube bazında gerekçe.
- **TB-253:** `PlaceLesson` ve `AssignTeacher` dersi şubenin talebinde de müfredatında da yoksa reddeder
  (`subject-not-in-curriculum`); alan dışı öğretmende (branşta yetkinlik yok / sınıf rehberliği dersinde rehber değil)
  ≥15 karakter gerekçe ister, `LessonPlacement.OutOfFieldReason`'a yazar. Taşıma kapısız (ders/öğretmen değişmez).
  `available-teachers?subjectId` öğretmene `recommended` / `in-field` / `out-of-field` işareti koyar.
- **Editör:** boş hücre menüsü, kilit rozeti ve "… kuralından (Cuma son ders)" satırı, kural hücresini taşıma/silmede
  ekranda onay (sunucuda bayrak yok; sonuç önizlemede ihlal), öğretmen listesi Önerilen / Alan içi / Alan dışı,
  alan dışı gerekçe diyaloğu. Kural ekranı `/schedule/fixed-rules` (Ders Programı hub kartından).
- **Hatırlatma (§5):** tüm şubelere yazılan kural, öğretmeni ortak olan şubelerde yapısal olarak tek şubeye basılır.
  Deneme ancak her şubenin rehber öğretmeni ayrıysa bütün şubelerde yerleşir.

## 8. Kapsam dışı / açık

- Kuralın döneme özel olması (1. dönem / 2. dönem farklı): ilk sürümde sezon geneli.
- Haftalık değişen deneme takvimi (bazı haftalar yok): ilk sürümde her hafta aynı; takvim etkinliği ayrı konu.
- Bir öğretmenin birden fazla şubenin rehber öğretmeni olabilmesi: kalır (kullanıcı kararı); ileride kaldırılabilir.

## 9. Uygulama dilimleri (öneri)

1. **Ders türü** (`Subject.TeachingMode`) + katalog formu + not/karne süzgeci + testler.
2. **Talep:** sınıf rehberliği dersleri ve rehberlik satırı `CompetencyAssignmentSource`'a; öğretmen
   rehber öğretmen; eksikse gerekçe.
3. **Sabit yerleşim kuralı:** kayıt, uçlar, ekran; üreticide ön yerleşim; önizleme ihlalleri.
4. **Editör:** boş hücre menüsü, kilit gösterimi; `TB-253` sunucu denetimleri.
