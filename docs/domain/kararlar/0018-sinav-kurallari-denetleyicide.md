---
tags: [decision, domain/academic]
date: 2026-09-08
status: accepted
last-synced: 2026-09-13 (294ffe6)
---

# 0018 — Sınav kuralları entity'de değil tek denetleyicide yaşar; ihlaller üç kademelidir

<!-- generated:start -->

## Bağlam

Sınav takviminin kurallarının çoğu tek bir kaydın içinden görülemez. Şubenin o günkü diğer sınavları, program hücresinin kime ait olduğu, aynı saatte başka bir oturumun aynı dersliği ya da gözetmeni kullanıp kullanmadığı birden çok satıra ve modüle bakar. Aynı kuralların üç yerde doğru çalışması gerekiyordu: yazma anında (yerleştirme, gözetmen yazma), yayın ön izlemesinde ve yayının kendisinde.

Kuralların hepsi de aynı ağırlıkta değil. Bazıları fiziksel bir imkânsızlık anlatıyor (aynı saatte iki sınavda oturan öğrenci). Bazıları yönetimin bilerek alabileceği bir karar (duyuru payının altında yayın). Bazıları yalnız bir işaret (kapasite aşımı). Ayrıca bir kural ekranda hesaplandığında (gözetmensiz derslik istemcide sayılıyor ve sahte bir kod basıyordu) sunucu onu bilmiyor, ikinci bir tüketici de unutuyordu.

## Karar

Kuralların **tek yeri bir kural denetleyicisidir.** Denetleyici kod ve sertlik işaretli bir ihlal listesi üretir, satır okumaz; olguları sayaç okuyuculardan alır. Yayın ön izlemesi ile yayın kapısı **aynı** listeyi kullanır. Sertliğe göre ne yapılacağına çağıran karar verir, ve ihlal istisna olarak değil **409 sonucu** olarak döner. Üç kademe var:

1. **Geçilemez sert** — `EX-H01`, `EX-H05`, `EX-H06`, `EX-H09`, `EX-H10`, `EX-H11`, `EX-H12`. Gerekçe bunların hiçbirini var etmez.
2. **Gerekçeyle geçilen** — `EX-H08` (duyuru payı), `EX-S05` (saati seçilmemiş sınav). Gerekçe en az 15 karakterdir ve pencerede saklanır.
3. **Yalnız görünen** — `EX-S04` (karışmamış derslik), `EX-S06` (kapasite aşımı). Ne engeller ne gerekçe ister.

Entity yalnız kendi içinden görebildiğini korur: tarih sırası, durum geçişleri, gerekçe uzunluğu, ders saatinin ızgara aralığı, sıra numarasının pozitifliği. Sınırlar (günlük sınav, duyuru payı) sabit değil okul ayarından okunur. Kod numaraları kalıcıdır: hiç yazılmamış bir kuralın numarası başka bir kurala verilmez (R47).

## Değerlendirilen alternatifler

- **Kuralları entity invariantı yapmak** — pencere, sınav satırı ya da oturum kendi aggregate'inin dışındaki satırları göremez; kuralların çoğu tam olarak onlara bakar.
- **Veritabanı kısıtı** — derslik çakışması (`EX-H11`) benzersiz dizin olsaydı bir dersin oturumu kapasite için ikiye bölünemezdi. Kısıt yalnız gerçekten mutlak olan yerde kaldı: pencere × şube × ders tekilliği.
- **İhlalde istisna fırlatmak** — sert ihlal bir hata değil beklenen bir iş sonucudur; ekran onu mesajıyla çizer. Domain istisnası yalnız veri ve durum geçişi hataları için kaldı.
- **Kuralı ekranda hesaplamak** — mobil, dışa aktarım, bildirim gibi ikinci bir tüketici aynı kararı yeniden verir ve biri unutur. Sunucunun bilmediği kural yok sayılır.
- **Kapasiteyi sert kural yapmak** — kapasitesi dar bir okul kelebek düzenini hiç kuramazdı; kapasite aşımı yalnız renk olarak kaldı.
- **Boş kalan numaraları yeni kurallara vermek** — eski bir kayıt, ekran ya da belge bugünkü ihlali dünkü cümleyle anlatırdı. Yeni kural sıradaki numarayı alır (`EX-H12` böyle doğdu).

## Sonuçları

Aynı kod bağlama göre farklı sertlik taşıyabilir: `EX-H08` yayında gerekçeyle geçilen serttir; taşımada yalnız uyarıdır, çünkü tarih zaten duyurulmuştur ve işlemi durdurmak öğretmeni yanlış tarihte bırakırdı. Mod ayrımı da denetleyicidedir: `EX-H03` yalnız ders saati modunda uygulanır, böylece ikinci bir yazma yolu açıldığında kural orada da doğru davranır.

Yazma yollarında yalnız sert ihlal engeller; yumuşak ihlaller işlem yapıldıktan sonra yanıtla birlikte uyarı olarak döner. Kelebek oturumu yazılırken günlük sınav sınırı ölçülmez, yayın kapısında ölçülür: şube başına reddetmek yarım bir kelebek bırakırdı.

"Hangi kodlar geçilemez" listesi yayın komutunda tek yerdedir; yeni bir sert kural eklendiğinde bu liste de güncellenmelidir, aksi hâlde kural sessizce gerekçeyle geçilebilir hâle gelir. Kural denetleyicisinde hiç görünmeyen iki eski numaranın (`EX-H02`, `EX-H07`) karşılığı başka yerlerde yaşar: biri veritabanı tekilliği, öteki pencere kurulurken yapılan reddir. İkisi de ihlal listesine girmez.

Geri dönülürse dokunulacak yerler: kural denetleyicisi, yayın komutundaki geçilemez kod listesi ve sayaç okuyucusu.

## İlgili

- [[Sınav Penceresi]]
- [[Planlanmış Sınav]]
- [[Sınav Oturumu]]
- [[Sınav Takvimi]]

<!-- generated:end -->
