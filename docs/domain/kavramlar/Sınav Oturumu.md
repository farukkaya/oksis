---
aliases: [ExamSession, ExamRoom, ExamSeat, Kelebek Oturumu, Sınav Dersliği, Sınav Sırası, Oturma Planı, Gözetmen]
tags: [domain/academic]
table: academic.exam_sessions
status: active
last-synced: 2026-09-13 (294ffe6)
---

# Sınav Oturumu

<!-- generated:start -->

## Nedir

Kelebek sınav düzeninin birimi: **tek ders, tek gün, tek ders saati, çok şube**. Aynı dersin birden çok şubesi aynı saatte sınava girer ve öğrenciler, kimsenin yanında kendi şubesinden biri oturmayacak biçimde dersliklere serpiştirilir. Yalnız oturum modundaki bir [[Sınav Penceresi]]'nde vardır.

Bir oturumda iki farklı dersin sınavı olamaz. Oturumda iki seviye görünmesinin sebebi, bir öğretmenin iki seviyeye girmesidir.

**Oturumun sahibi yoktur.** Sorumlu öğretmenler, oturuma bağlı [[Planlanmış Sınav]] satırlarının sahiplerinden türer. Oturumu kuran kişi yalnız iz olarak saklanır. Üç öğretmenin oturumu birleştiğinde üç sorumlu kendiliğinden çıkar.

Oturumun iki alt kaydı bu notun içinde yaşar, ayrı kavram değildir: **oturum dersliği** (`ExamRoom` — oturum × fiziksel oda, gözetmeniyle) ve **sıra** (`ExamSeat` — derslik × öğrenci, sıra numarasıyla). İkisi de her yeniden bestelemede oturumdan türetilir.

## Yaşam döngüsü

**Doğuş — iki yol, tek sonuç:**

- **Öğretmenden:** öğretmen oturum modundaki pencerede sınavını bir güne ve ders saatine yerleştirir. Saat serbesttir, kendi dersi olmak zorunda değildir (`EX-H03` uygulanmaz). Varsayılan olarak öğretmenin o dersteki bütün şubeleri girer; öğretmen yalnız kendi okuttuğu şubelerden bir alt küme de seçebilir. Aynı pencere × ders × gün × saatte oturum varsa en eskisine katılır.
- **Yöneticiden:** yönetici tarih, ders saati, ders ve şube listesiyle oturum açar. Listede o dersi almayan şube reddedilir. Sahip ders programından gelir; o şubede dersi okutan öğretmen yoksa şube reddedilir.

Engeller topluca bildirilir ve biri bile varsa **hiçbir şey yazılmaz**: başka bir oturuma bağlı şube, bekleyen ödünç saat isteği olan şube, sahibi belirlenemeyen şube.

**Ömür:** oturum ilk şube bağlandığında doğar, **son şubesi çıktığında derslikleri ve sıralarıyla birlikte silinir** — pencere yayınlanmış olsa bile. Yayındaki fark silinip silinmemesi değil, silmenin nasıl olduğudur: gerekçe, revizyon kaydı ve bildirim zorunludur. Boş kabuk ayakta bırakılmaz; panoda sahipsiz bir kart olarak kalırdı.

**Değişiklikler:** yönetici şube ekler ve çıkarır, aynı hücredeki iki oturumu birleştirir, derslik ekler ve çıkarır, gözetmen yazar ya da boşaltır, iki sıranın öğrencisini takas eder, yerleşimi yeniden ürettirir. Takvim yayındaysa her biri gerekçe ister ve pencereyi revize eder.

**Sürüm:** oturum sürüm 1 ile doğar. Sürüm **yalnız takvim yayındayken** ve **yalnız okuma yüzünü gerçekten değiştiren** bir değişiklikte, istek başına en fazla bir kez artar (R27). Aynı şubeleri yeniden yerleştirmek, zaten görevdeki öğretmeni "elle sabitlemek" ya da hiçbir öğrencinin yerini oynatmayan bir yeniden üretim sürümü artırmaz.

## Kurallar

- **Tekillik yoktur ve bu bilinçlidir:** aynı pencerede aynı dersin aynı hücrede ikinci oturumu olabilir — kapasiteyi aşan bir dersin ikinci bir derslik kümesiyle bölünmesi. Çakışamayan şey oturum değil, üç kaynaktır: aynı derslik (`EX-H11`), aynı öğrenci (`EX-H05`), aynı gözetmen (`EX-H06`). Farklı öğretmenlerin farklı dersleri aynı saatte yan yana durabilir.
- **Birleştirme** yalnız aynı pencere, ders, gün ve ders saatindeki iki oturum arasında yapılır. Kaynağın şubeleri hedefe geçer, kaynak silinir, hedef bütün havuz üzerinden yeniden bestelenir — öğrenciler gerçekten karışır. Yerleşim yeniden yazılmaz, çünkü hücre zaten aynıdır.
- **Oturumdaki tek sınav tek başına taşınamaz.** Oturumun saatini değiştiren bir komut yoktur.
- **Şube çıkarmak sınav satırını silmez;** satır yerleşmemişe döner ve yayın kapısında yeniden sayılır.
- Pencerenin kilidi ve tarih aralığı bütün oturum komutlarında ortak kapıdır; oturum modunda olmayan pencerede hiçbir oturum komutu çalışmaz.
- **Günlük sınav sınırı (`EX-H01`) oturum yazılırken ölçülmez:** oturum bir şube kümesini aynı anda yazar ve kuralı şube başına uygulamak yarım bir kelebek bırakırdı. Sınır yayın kapısında ölçülür.
- Yayın için oturumdaki her dersliğin gözetmeni olmalı (`EX-H10`) ve her öğrenci bir sıraya oturmuş olmalıdır (`EX-H12`); ikisi de gerekçeyle geçilmez.

## Derslik, gözetmen ve sıra

Üçü **besteleme** ile, tek giriş noktasından ve sabit sırada üretilir: derslik → gözetmen → yerleşim. Sıra pazarlığa kapalıdır: gözetmen dersliksiz, yerleşim dersliksiz türeyemez. Besteleme her üyelik, derslik ya da gözetmen değişikliğinde ve "yeniden üret" ile koşar. Neden türetildikleri: [[0017-kelebek-derslik-ve-gozetmen-turetilir]].

**Derslik.** Oturumun derslikleri **giren şubelerin ev dersliklerinden** türer; boş derslik aranmaz. Aynı odayı ev dersliği seçmiş iki şube tek derslik satırı üretir. Ev dersliği tanımsız şube derslik üretemez ve raporlanır. Yöneticinin eli iki işaretle korunur:

- **Elle eklenen derslik** (ör. konferans salonu) hiçbir şubenin ev dersliği olmasa da türetmede silinmez.
- **Çıkarılan derslik silinmez, işaretlenir;** yeniden türetme onu geri getirmez — şubesi oturumdan çıkıp geri dönse bile. Çıkarmak gözetmeni de boşaltır; geri eklemek gözetmeni geri getirmez, derslik yeniden türetmenin kapsamına döner.
- Bütün derslikleri çıkarılmış oturum ayakta kalır (oturumun varlığı şubeye bağlıdır); "aktif derslik yok" ayrıca bildirilir.

**Gözetmen.** Atanmaz, türer: pencerenin döneminde, oturumun haftanın günü ve ders saatinde, dersliğin sahibi şubeye canlı [[Ders Programı]]'nda dersi olan öğretmen. **Derslik başına tek gözetmen.** Gözetmen ve kaynağı (türetilmiş ya da elle) birlikte yazılır, birlikte boşalır.

- **Elle yazılan gözetmen korunur** ve öğretmenin o saatini kapatır; türetme aynı kişiyi ikinci bir dersliğe koyamaz.
- Türetilmiş gözetmen her bestelemede yeniden hesaplanır; program değiştiyse boşalır. Bulunamazsa derslik **delik** olur. Aynı öğretmen iki dersliğe düşecekse şube sırasına göre ilk derslik kazanır, ikincisi delik kalır.
- Elle yazılan kişi okulda tanımlı bir kişi olmalıdır; öğretmen profili ayrıca aranmaz, çünkü türetme de profile bakmaz. O kişi aynı gün ve saatte — başka bir oturumda bile — başka dersliğin gözetmeniyse yazma reddedilir (`EX-H06`). Çıkarılmış dersliğe gözetmen yazılamaz.
- Elle yazılanı boşaltmak dersliği türetmeye geri verir; aynı istekte türetme yeniden bir öğretmen koyabilir. Değişikliğin ölçüsü satırın kaynağı değil, **görevdeki kişidir**.
- Gözetmene sınav modülünde yazma yetkisi verilmez.

**Sıra.** Öğrencinin dersliği ve derslik içinde 1'den başlayan **düz** sıra numarası; numara derslik içinde tekildir. Dersliğin sıra × sütun düzeni modellenmez: öğrencinin yanı her zaman farklı şubedendir, arkası bazen aynı şubeden çıkabilir — bilinen sınır.

- **Kim oturur:** şubeye ataması açık **ve** kaydı aktif öğrenci — dondurulmuş öğrenci sıra kaplamaz. Tanım yoklama listesininkiyle aynıdır; sapma olursa yoklamanınki kazanır.
- **Serpiştirme oransaldır:** şubeler sınıf seviyesinin görüntü sırası ve şube adıyla, öğrenciler şube içinde okul numarasıyla sıralanır. Her öğrenci şubesi içindeki sırasına göre `(2i+1)/2n` kesrini alır ve herkes bu kesre göre tek diziye dizilir. Eşit mevcutlu şubelerde sonuç düz dönüşümlü dağıtımın aynısıdır; farklı mevcutta kuyrukta tek şubeden blok yığılmaz.
- **Derslik payı kapasiteyle orantılıdır;** yuvarlamadan artanlar kesri en büyük dersliklere dağılır. Toplam mevcut toplam kapasiteyi aşarsa yerleşim durmaz, bütün derslikler oransal aşar (`EX-S06`, yalnız görünür).
- Kapasitesi girilmemiş derslik (sıfır) aşılmış sayılmaz ama pay da almaz. Bütün derslikler kapasitesizse yerleşim boş çıkar ve öğrenciler sırasız kalır (`EX-H12`).
- **Belirlenimcidir:** aynı girdi her zaman aynı sıra dizisini verir; yeniden üretimde yalnız değişen kısım oynar.
- **Takas** iki sıranın **öğrencilerini** yer değiştirir; sıra numarası ve derslik yerinde kalır. İki sıra aynı oturumda olmalıdır. İkisi de elle takas işaretlenir; takas besteleme çağırmaz.
- **Yeniden besteleme bütün sıraları siler ve yeniden yazar:** elle takaslar korunmaz, silinen takas sayısı yöneticiye raporlanır. Elle derslik ve elle gözetmen korunur. Yeniden üretimde değişiklik ölçülür: hiçbir öğrencinin yeri oynamadıysa revizyon ve bildirim yoktur; oynadıysa bildirim yalnız yeri değişen öğrenciye gider.

## İlişkiler

- [[Sınav Penceresi]] — oturum modundaki pencere; kilit, tarih aralığı ve dönem oradan
- [[Planlanmış Sınav]] — oturuma bağlı şube × ders satırları; sorumlu öğretmenler buradan türer
- [[Ders]] — oturumun tek dersi
- [[Şube]] — ev dersliği kelebek dersliğinin kaynağı
- [[Derslik]] — fiziksel oda ve kapasitesi
- [[Ders Programı]] — gözetmenin tek kaynağı; yalnız okunur
- [[Öğrenci Kaydı]] — oturuma yalnız aktif kayıtlı öğrenci girer
- [[Sınıf Seviyesi]] / [[Öğrenci Numarası]] — serpiştirmenin sıralama anahtarları
- [[Kişi]] — gözetmen ve oturumu kuran yönetici

## Geçtiği modüller

- [[Sınav Takvimi]] — kavramın sahibi; kurma, besteleme, düzenleme, yayın
- [[Müfredat]] — ders silme kapısı kilitli olmayan penceredeki oturuma bakar

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- **Kelebekte yoklama.** Bir şube birden çok dersliğe ve gözetmene bölünür; [[Yoklama Oturumu]] tek bir "yoklamayı alan" alanı taşır ve teslim akışı tek kişi varsayar. Gözetmen yoklamayı nasıl alacak? Faz 2b'nin ilk kararı.
- **Oturumun saati nasıl değişir?** Oturumu başka hücreye taşıyan bir komut yok; birleştirme reddi ise "birini önce aynı güne ve ders saatine taşıyın" diyor.
- **Gözetmensiz derslik uçtan uca ekranda üretilemedi.** Türetme o saatte yayınlanmış dersi olmayan şubelerin dersliklerine bile gözetmen türetti. `EX-H10` entegrasyon testlerinde ölçülü; türetmenin kaynağı gerçekten yalnız canlı program mı, yoksa başka bir yerleşim de sayılıyor mu?
