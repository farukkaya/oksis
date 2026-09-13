---
tags: [decision, domain/academic]
date: 2026-09-13
status: accepted
last-synced: 2026-09-13 (294ffe6)
---

# 0013 — Gün değeri gerçek takvim günüdür (System.DayOfWeek: Pazartesi=1 … Cuma=5)

<!-- generated:start -->

## Bağlam

Ders programı, nöbet çizelgesi, öğretmen müsaitliği ve program istisnası "haftanın günü" bilgisini taşır. Gün alanı kodda baştan beri .NET'in `DayOfWeek` tipindeydi (Pazar=0, Pazartesi=1 … Cumartesi=6), ama saklanan değer **sıfır tabanlıydı**: arayüz Pazartesi için 0 gönderiyor, sunucu bunu olduğu gibi gün tipine çeviriyordu. Tip "Pazar" diyor, anlam "Pazartesi" idi.

Editör, ızgara ve yazma-okuma yolu kendi içinde tutarlı olduğu için bu çalışıyor görünüyordu. Kusur, **gerçek bir tarih** devreye girdiği her yerde bir gün kayma olarak çıktı:

- Pazartesi günü için program istisnası hiç oluşturulamıyordu — istisnanın günü tarihin gerçek günüyle karşılaştırılıyor ve hiç eşleşmiyordu.
- "Bugünün dersleri" bir gün kaymış ya da boş dönüyordu.
- Vekâlet panosu ve vekil adayı sorguları aynı kaymayı taşıyordu.
- Nöbet dağıtımı bir ara sıfır tabanlı çalışma günleriyle "düzeltilmişti"; bu da kusuru ortadan kaldırmak yerine ikinci bir yere taşımıştı.

Kodda gerçek günü sıraya çeviren hiçbir yardımcı yoktu; olsa bile her yeni tarih karşılaştırması onu hatırlamak zorunda kalacaktı.

## Karar

Saklanan bütün gün değerleri gerçek takvim günü semantiğine hizalandı — Pazartesi=1, Salı=2, Çarşamba=3, Perşembe=4, Cuma=5 — ve mevcut veri, **yayınlanmış program sürümlerinin snapshot içindeki gün değerleri dahil**, tek seferde +1 kaydırıldı. Görüntü sırası değişmedi: ızgara yine Pazartesi'den başlar; görüntü sırası ile sayısal değer ayrı şeylerdir.

## Değerlendirilen alternatifler

- **Sıfır tabanlı saklamayı koruyup her tarih karşılaştırmasına dönüşüm yardımcısı eklemek** — kusur sınıfını yok etmez, her yeni kesişim noktasında yeniden doğmasına izin verirdi. "Unutulan dönüşüm" hatası tam olarak yaşanan hataydı.
- **Gün alanını düz tamsayıya çevirmek** — tip `DayOfWeek` olarak kalınca gerçek tarihle karşılaştırma dönüşümsüz doğru çalışıyor; tamsayı tipi bu doğal doğruluğu kaybettirirdi.
- **Yalnız yeni kayıtları gerçek güne yazmak, eskileri bırakmak** — aynı kolonda iki anlam yan yana dururdu; özellikle değişmez snapshot'lar tüketicide yanlış güne düşerdi.
- **Kod ve veri taşımasını ayrı zamanlarda yayına almak** — ara durumda eski veri + yeni kod (ya da tersi) kaymayı tersinden üretirdi; ikisi birlikte teslim edildi.

## Sonuçları

- Gerçek tarihle yapılan her karşılaştırma (istisna günü, "bugün", vekâlet panosu, vekil adayı) **dönüşümsüz doğru** çalışır; kayma sınıfı yapısal olarak ortadan kalktı. Nöbet dağıtımı ve ders programı üretimi çalışma günlerini doğal Pazartesi-Cuma değerleriyle kurar.
- Tarayıcıdaki tarih günü de aynı sayılandırmayı kullandığı için arayüzde "bugün" vurgusu ek eşleme gerektirmez.
- **Açık borç — hafta içi sınırı doğrulamada korunmuyor.** Karar "sistem yalnız Pazartesi-Cuma kullanır, Cumartesi ve Pazar program ya da nöbet gününe atanamaz" diyordu ve doğrulamanın buna göre güncellenmesi öngörülmüştü. Kodda bugün müsaitlik kaydı, nöbet taslağı kaydı ve boştaki öğretmen sorgusu günü **0-6** aralığında kabul ediyor; ders yerleştirme ve taşımanın gün için ayrı bir doğrulaması yok, zaman dilimi değer nesnesi yalnız ders saati sırasını denetliyor. Yani hafta sonu değeri API'den yazılabilir. Arayüz göndermediği için pratikte oluşmuyor, ama kural sunucuda zorlanmıyor.
- Geri dönülürse dokunulacak yerler: bütün gün kolonları, yayınlanmış snapshot'ların içindeki gün değerleri ve arayüzdeki gün sabitleri — biri eksik kalırsa kayma geri gelir. Taşımanın geri alma adımı -1 uygular.

## İlgili

- [[Ders Programı]]
- [[Program Sürümü]]
- [[Program İstisnası]]
- [[Nöbet Çizelgesi]]
- [[Öğretmen Müsaitliği]]
- [[Ders Programı Yönetimi]]
- [[Nöbetler]]

<!-- generated:end -->
