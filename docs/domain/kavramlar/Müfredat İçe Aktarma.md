---
aliases: [CurriculumImportRun, CurriculumImportEntry, CurriculumImportSubjectMatch, Ara Alan, Staging]
tags: [domain/academic]
table: master.curriculum_import_runs, master.curriculum_import_entries, master.curriculum_import_subject_matches
status: active
last-synced: 2026-09-20 (79636476)
---

# Müfredat İçe Aktarma

<!-- generated:start -->

## Nedir

Bir [[MEB Kaynak Belgesi]] setinden üretilen **ara alan** (staging) ve onun operasyon kaydı.
Çizelgenin satırları önce burada, kaynaktaki ham hâliyle yaşar: ham ders adı, ham sınıf seviyesi
kodu, saat ve sayfa numarası. Master veri ancak merkez onayından sonra bu ara alandan doğar.

Bu ayrımın nedeni: ayrıştırma, doğrulama ya da eşleme hatası **yayımlanmış hiçbir sürümü
etkilemesin**. Yanlış okunmuş bir çizelge ara alanda kalır; okulların çalışan müfredatına
dokunmaz.

## Yaşam döngüsü

```text
Draft → Validated → Approved → Published
   ↘ NeedsReview ↗      ↘ Rejected
   ↘ Quarantined
```

- **Validated** — doğrulama temiz, onaya hazır.
- **NeedsReview** — uyarı, hata ya da çözülmemiş ders eşlemesi var; insan bakmalı.
- **Quarantined** — belge hiç anlaşılmamış (satır yok ya da hiçbir sınıf seviyesi tanınmadı);
  tek tek düzeltmek anlamsızdır.
- **Published / Rejected / Quarantined** terminaldir.

Satırlar merkez tarafından düzeltilebilir (seviye, saat, ders türü) ve her satır bir **ders eşleme
kararı** taşır.

## Ara alan nasıl doldurulur

İki yol vardır ve **ikisi de aynı sözleşmeyi** üretir: platform kullanıcısının yapılandırılmış
veriyle (JSON) doldurması, ya da bir [[MEB Kaynak Belgesi]] PDF'inin ayrıştırılması.

Ayrıştırma **salt okunur bir sorgudur**: belgedeki çizelgeleri çıkarır ve hiçbir şey yazmaz.
Ara alana taşımak ayrı, bilinçli bir komuttur. Bu ayrım bir niyet değil yapısal bir kapıdır —
ayrıştırıcının onay kapısını dolanması mümkün değildir, çünkü yazma yolu doğrulayıcıdan ve
iki kişi kuralından geçer.

Tek PDF birden çok çizelge taşıyabilir (2025/05 sayılı kararda sayfa 2-7 altı ayrı eğitim
programıdır). **Hangi sayfanın hangi eğitim programına karşılık geldiğini merkez kullanıcısı
söyler**; başlık metninden tahmin etmek sessizce yanlış programa müfredat yazmaya yol açardı.

Ayrıştırıcının çıktısı ara alana çevrilirken: "okutulmaz" (tire) hücresi **satır üretmez** —
olmayan bir dersi sıfır saatle yazmak müfredata hayalet ders eklerdi. Saat seçeneği taşıyan
hücre (`(2)(4)`) doğrudan saat seçeneklerine düşer; dipnot işaretleri (`*`, `(2)`) ders adından
ayrılır ama not olarak korunur.

## Drift: ayrıştırıcı bozulursa nasıl anlaşılır

MEB çizelgesi **kendi sağlamasını taşıyor**: her sınıf sütunu için beyan edilen toplamlar
birbirini tutar (ortaöğretimde `ORTAK + SEÇİLEBİLECEK + REHBERLİK = TOPLAM`, ilköğretimde
`ZORUNLU + SEÇMELİ + SERBEST = TOPLAM`). Ayrıca ortak ders satırlarının toplamı, beyan edilen
ortak toplamı vermelidir.

Bu yüzden "düzen değişti mi" sorusu tahmin değil **ölçümdür**. Satırlar kayarsa toplam tutmaz
ve çizelge yayımlanabilir sayılmaz. Sağlaması hiç bulunamayan çizelge de yayımlanabilir
sayılmaz: karşılaştıracak beyanı olmayan bir tablo, yanlış ayrıştırılmış olsa bile temiz
görünürdü — sessiz geçmek en tehlikeli durumdur.

Taranmış (metin katmanı olmayan) belge açık bir hatayla reddedilir ve elle giriş yoluna
yönlendirilir. OCR bilinçli olarak kapsam dışıdır: yanlış okunan bir saat, sessizce yanlış bir
müfredat yayımlamaya kadar gider.

## Kurallar

- İçe aktarma **idempotenttir**: aynı belge seti + program + akademik yıl + aynı içerik parmak izi
  ikinci bir çalışma açmaz.
- Satırın saati ya tek değerdir ya da **en az iki seçenek** ("1 veya 2 saat"); tek seçenek zaten
  tek değerdir. MEB saati sıfırdan büyüktür — 0 okulun kararıdır, çizelgenin değil.
- Aynı seviye ve ders için iki satır olamaz.
- Ders eşleme **önerisi** karar değildir: kod ya da ad birebir eşleşse bile satır `Suggested`
  doğar; `Confirmed` yalnız bir kullanıcının kararıyla olur.
- Belirsiz eşleşme öneri üretmez (iki ders aynı normalize ada düşüyorsa).
- **Bilinmeyen ders master katalog açmaz**: onay var olan bir çekirdek derse bağlanır ya da satır
  kapsam dışı bırakılır.
- Çözülmemiş eşleme varken içe aktarma **onaylanamaz**.
- **İki kişi kuralı**: ara alanı düzelten kullanıcı aynı içe aktarmayı onaylayamaz
  ([[0022-mufredat-yayimi-iki-kisi-kurali]]).
- Terminal durumda düzeltme ve geçiş kapalıdır.

## Neye yarıyor

"Bu çizelge sisteme nasıl girdi, kim neyi düzeltti, kim onayladı" sorusunun cevabıdır. Yayımlanan
sürüm bu çalışmaya, çalışma da belge setine bağlıdır.

## İlişkiler

- [[MEB Kaynak Belgesi]] — ara alanın dayandığı hukuki kaynak
- [[Müfredat Sürümü]] — onaylanan çalışmanın yayım çıktısı
- [[Ders]] — eşleme çekirdek katalogdaki derse bağlanır
- [[Sınıf Seviyesi]] — satırın seviyesi çözülür ya da incelemeye düşer

## Geçtiği modüller

- [[Müfredat]] — merkez içe aktarma yüzeyinin sahibi

<!-- generated:end -->

## Notlar

Ara alanda elle girişe özel hiçbir alan yoktur: PDF ayrıştırıcısı da aynı şekli üretir.

Ayrıştırıcı iki farklı çizelge ailesiyle doğrulandı — ortaöğretim (sınıf sütunlu, tek katman
başlık) ve ilköğretim (İLKOKUL/ORTAOKUL üst başlığı altında 1-8 sınıf sütunları). Aynı satır
iki çizelgede farklı şey olabiliyor: "Rehberlik ve Yönlendirme" ilköğretimde gerçek bir zorunlu
ders, ortaöğretimde toplam bloğunun bir bileşenidir; ayıran şey konumdur.

## Açık Sorular

- İçe aktarma tek platform hesabıyla uçtan uca denenemez (iki kişi kuralı ikinci hesap ister).
  İkinci platform hesabı açma yolu 0019 dilimine bağlı.
- Ortaöğretim çizelgesindeki "Rehberlik ve Yönlendirme" saati bugün ara alana **satır olarak
  girmiyor** (toplam bloğunun bileşeni sayılıyor). Bu saatin müfredat satırı mı yoksa ayrı bir
  kavram mı olduğu ürün kararıdır; Dilim 4'te netleşmeli.
- Dipnot metinlerinin (açıklama sayfaları) anlamlandırılması yapılmıyor; işaretler ham olarak
  saklanıyor. Kural çözümlemesi `CurriculumSelectionRule` ile birlikte ertelendi.
- DOCX/XLSX belgeler yüklenebiliyor ama ayrıştırılmıyor.
