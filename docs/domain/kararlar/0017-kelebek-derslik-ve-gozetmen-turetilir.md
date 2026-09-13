---
tags: [decision, domain/academic]
date: 2026-09-09
status: accepted
last-synced: 2026-09-13 (294ffe6)
---

# 0017 — Kelebek oturumunda derslik ve gözetmen atanmaz, türetilir; yöneticinin eli satırdaki işaretle korunur

<!-- generated:start -->

## Bağlam

Kelebek düzeninde birden çok şubenin öğrencileri aynı ders saatinde dersliklere karışık dağıtılır. Üç sorunun cevabı gerekiyordu: öğrenciler hangi dersliklere oturacak, her derslikte kim gözetmen olacak, bir şube dersliklere nasıl bölünecek.

İlk tasarım bunları yöneticinin elle yapacağı işler olarak kurmuştu: boş derslik seçip tahsis etmek, şubeyi numara sırasıyla ardışık dilimlere bölmek, bir gözetmen havuzundan atama yapmak, gözetmen yükü dengesizliğini uyarıyla izlemek. Bu, onlarca şube için ayrı bir planlama işi ve üç ayrı tablo demekti.

## Karar

Oturumun **derslikleri, giren şubelerin kendi ev dersliklerinden türer.** **Gözetmen, o gün o saatte o sınıfa dersi olan öğretmendir.** Öğrenciler dersliklere **oransal serpiştirmeyle** yerleşir. Üçü her üyelik değişiminde tek giriş noktasından, sabit sırada yeniden üretilir.

Yöneticinin müdahalesi silinmez, satırın üstünde işaret olarak yaşar: elle eklenen derslik türetmede silinmez; çıkarılan derslik silinmez, işaretlenir ve geri gelmez; elle yazılan gözetmen üzerine yazılmaz. Türetmenin dolduramadığı gözetmen deliğini yönetici elle doldurur ve delik kalırsa takvim yayınlanmaz.

## Değerlendirilen alternatifler

- **Boş derslik arayıp tahsis etmek** — kelebeğin kazancı yer açmak değil, öğrencinin yanındaki komşuyu değiştirmektir. Sınava giren şubelerin kendi sınıfları zaten yeterlidir.
- **Gözetmen havuzu ve atama ekranı** — o saatte o sınıfa dersi olan öğretmen zaten oradadır; onu boşa çıkarıp yeniden dağıtmanın karşılığı yoktur. Atama olmayınca "gözetmen yükü dengesizliği" kuralı da anlamsızlaştı ve yazılmadı (`EX-S03`). "Öğretmen kendi öğrencisinin dersliğinde gözetmen" uyarısı da düştü (`EX-S02`): türetmede bu beklenen durumdur ve her doğru kurulumda uyarı basardı.
- **Şubeyi ardışık dilimlere bölmek** ("9-A'nın 1–15'i") — dilimde on beş öğrenci hâlâ kendi şubesiyle yan yana oturuyordu. Düz dönüşümlü dağıtım da eşit olmayan mevcutta kuyrukta tek şubeden uzun bir blok bırakıyordu; oransal serpiştirme ikisini de çözüyor.
- **Derslik başına birden çok gözetmen** — derslik satırını bire-çok bir tabloya çevirirdi; türetme zaten tek isim veriyor ve bugün karşılığı olan bir ihtiyaç yok.
- **Çıkarılan dersliği silmek** — şube oturumdan çıkıp geri döndüğünde yerine temiz bir satır türer ve yöneticinin kararı, kimse geri almadan buharlaşırdı. Çıkarmak dersliğin kendi hâlidir, ayrı bir dışlama tablosu da açılmadı.
- **Elle yazılan gözetmeni yeniden türetmede ezmek** — oturuma dokunan ilk besteleme yöneticinin işini sessizce silerdi.

## Sonuçları

İlk tasarımın iki tablosu (derslik tahsis grubu, gözetmen ataması) hiç doğmadı: gözetmen dersliğin bir alanına, "hangi öğrenci hangi dersliğe" bilgisi doğrudan sıra satırına indi.

Türetme **yıkıcıdır ve tek kapıdan geçmek zorundadır**: besteleme sırası (derslik → gözetmen → yerleşim) tek yerde yazılıdır; ters sırada yerleşim henüz olmayan dersliklere bakar ve hata vermeden boş çıkar. **Sıra takasları korunmaz** — öğrenci kümesi değişince eski takas anlamsızdır — ve silinen takas sayısı yöneticiye raporlanır.

Ev dersliği tanımsız şube derslik üretemez; şube dersliğinin zorunlu olmasına kadar köprü, yöneticinin elle derslik eklemesidir (`TB-120`). İki şube aynı ev dersliğini paylaşabildiği için derslik çakışması türetilmiş satırlarda da doğabilir. Bu yüzden `EX-H11` bir sorgu kuralıdır, veritabanı tekilliği değildir — tekillik olsaydı bir dersin oturumu kapasite için bölünemezdi.

Bir yan etkisi de gözlemlendi: türetme dışarıdan belirlenimci biçimde boş düşürülemediği için gözetmen deliği ekrandan üretilemedi. Kural yalnız testlerde ölçülü.

Geri dönülürse dokunulacak yerler: oturum dersliği satırındaki gözetmen alanı ve kaynağı, gözetmen türeticisi, besteleme giriş noktası ve yayın kapısındaki `EX-H10`.

## İlgili

- [[Sınav Oturumu]]
- [[Sınav Takvimi]]
- [[Derslik]]
- [[Şube]]
- [[Ders Programı]]

<!-- generated:end -->
