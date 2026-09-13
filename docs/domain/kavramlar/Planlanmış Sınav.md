---
aliases: [ScheduledExam, HourRequest, ExamPlacementReminder, Planlı Sınav, Ödünç Saat İsteği, Saat İsteği]
tags: [domain/academic]
table: academic.scheduled_exams
status: active
last-synced: 2026-09-13 (294ffe6)
---

# Planlanmış Sınav

<!-- generated:start -->

> Not defteri sütunu olan sınav türü için [[Sınav Türü]]; bu not, takvimdeki somut sınav satırıdır.

## Nedir

Bir [[Sınav Penceresi]]'nde bir şubenin bir dersten gireceği tek sınav — **pencere × şube × ders** koordinatı. Sınavın zamanı serbest bir saat değil, zil ızgarasında bir hücredir: gün + ders saati.

**Tembel doğar.** Öğretmen ilk kez yerleştirene kadar tabloda karşılığı yoktur. Bir pencerede hangi sınavların **beklendiği** dönemin canlı [[Ders Programı]]'ndan türetilir: programda yer alan her şube × ders çifti beklenen bir sınavdır, yazılmış satırlarla birleştirilir. Program sonradan değişse de yazılmış satır bu kümeden düşmez — sınav kaydı bir olgudur. Pano, sayaçlar, yayın kapısı, hatırlatma ve kelebek oturumu kurma aynı tanımı kullanır (`TB-119`).

İki kişi taşır: **sahip** sınavı kuran ve notunu girecek öğretmendir; **uygulayan** o saatte sınıfta duran öğretmendir. Kendi saatinde ikisi aynıdır, ödünç saatte uygulayan ev sahibidir, kelebek oturumunda uygulayan boştur (sınıfta duran kişi dersliğin gözetmenidir).

İki yardımcı kayıt bu notun içinde yaşar: **ödünç saat isteği** (aşağıda) ve **yerleştirme hatırlatması** kaydı.

## Yaşam döngüsü

Satır iki bağımsız eksen taşır:

- **Yerleşim:** `Unplaced` (saati yok ya da saati elinden gitti) · `Placed` (hücreye oturdu) · `Moved` (yayınlanmış takvimde ev sahibi hücre programdan kalktı).
- **Saat isteği:** `NotNeeded` · `Pending` · `Accepted` · `Declined` · `Expired`.

Yerleştirmenin üç yolu vardır:

1. **Kendi saati** (ders saati modu) — hücre öğretmenin o şubedeki iptal edilmemiş dersiyse sınav anında `Placed` olur.
2. **Ödünç saat** (ders saati modu) — hücre başka öğretmenin dersiyse saat ve ev sahibi hücre yazılır ama sınav `Unplaced` kalır, istek `Pending` olur. **Bekleyen istek yerleşim sayılmaz.**
3. **Oturumda** (oturum modu) — gün ve ders saati [[Sınav Oturumu]]'ndan gelir, sınav `Placed` olur; ev sahibi hücre ve uygulayan bilinçli olarak boş kalır.

**Taşındı işareti.** Günlük iş, yayınlanmış ve kilitli pencerelerde ev sahibi hücresi olan yerleşmiş sınavları programla karşılaştırır. Hücre kalkmış, iptal edilmiş ya da başka bir ders saatine kaymışsa sınav `Moved` olur: **silinmez**, program değiştirilmez, şubeye ve sahibe bildirim gider. Oturum sınavlarının ev sahibi hücresi yoktur, bu taramaya girmezler. Taşınmış sınav tarihini taşıdığı için sayaçlarda yerleşmiş sayılır; ama takvim yayını bildiriminden, not sütunu tarih beslemesinden ve "yarın sınav var" bildiriminden düşer.

**Taşıma.** Yalnız saati olan sınav taşınır — saati olmayan yerleştirilir. Yalnız ders saati modunda: kelebekte tek sınav tek başına taşınamaz, oturumun bütün şubeleri aynı hücrede kalır. Takvim yayındaysa gerekçe zorunludur, pencere revize edilir ve bir revizyon kaydı yazılır. Hedef hücre başka öğretmenin dersiyse yeni bir ödünç saat isteği doğar; eski hücredeki bekleyen istek düşürülür. Duyuru payının altına düşen taşıma engellenmez, uyarı döner.

**Oturumdan çıkma.** Şube kelebek oturumundan çıkarıldığında satır silinmez: oturum bağı çözülür, saati geri alınır ve satır `Unplaced`'a döner.

## Kurallar

- **Tekillik:** bir pencerede bir şubenin bir dersten tek sınavı olur (veritabanı kısıtı). Aynı çifti iki sekmeden yerleştirmek ikinci satır açmaz.
- **Sahiplik:** yerleştirme ve saat isteği yalnız satırın sahibine açıktır. Satır yazılmamışsa sahiplik ders programından gelir: çifti okutmayan öğretmen için sınav yoktur (404). Satır başkasınınsa kapsam reddi (403).
- **Kural denetimi ev sahibi üzerinden yapılır:** "bu saat kimin dersi" sorusunun cevabı ödünç saatte ev sahibidir (`EX-H03`). Aynı denetim şubenin günlük sınav sınırını (`EX-H01`, sert) ve komşu gün sınavını (`EX-S01`, uyarı) ölçer. Yumuşak ihlal işlemi durdurmaz, yanıtla birlikte uyarı olarak döner.
- Pencere kapısı iki modda ortaktır: kilitli pencerede ve pencerenin tarih aralığı dışındaki bir güne yerleştirme yoktur.
- Bir sınav aynı anda tek oturuma bağlıdır; başka oturuma geçmek için önce bağı çözülür.
- Kilitli olmayan bir pencerede satırı olan ders silinemez ([[Ders]] silme kapısı).

## Ödünç saat isteği

Bir öğretmen, sınavını başka bir öğretmenin o şubedeki ders saatine koymak istediğinde doğan kayıt. **Saat öğretmenindir:** kararı yalnız ev sahibi verir; isteyen öğretmen de, izin taşıyan yönetici de geçemez.

- Durumlar: `Pending → Accepted | Declined | Expired`. Tek cevap alınır.
- **Kabul** sınavı `Placed` yapar. **Ret** ya da **süre dolması** sınavın saatini temizler ve sınavı `Unplaced`'a döndürür.
- **İstenen hücre istekle birlikte yazılır, sınavdan türetilmez:** ret sonrası sınavın saati silindiğinde "hangi saati kim reddetti" sorusunun cevabı istekte kalır. Ret notu isteğe bağlıdır.
- Gelen/giden yönü kolon değildir; bakan kişiye göre hesaplanır.
- **Cevapsız istek düşer:** pencerenin taslak tamamlanma tarihi geçince günlük işte, kilitli pencerede bile — aksi hâlde panoda sonsuza kadar "bekliyor" gösteren ölü bir satır kalırdı.
- Kilitli pencerede cevap verilemez. Cevap anında kurallar yeniden denetlenmez; aradan geçen sürede dolan günlük sınır yayın kapısında yakalanır.
- Kendi saati için istek gönderilmez. **Oturum modunda istek hiç doğmaz** — oturumun saati serbesttir, ödünç alınacak bir saat yoktur.
- Bekleyen istek takvim yayınını gerekçeyle bile geçilemez biçimde durdurur (`EX-H09`). Bekleyen isteği olan şube kelebek oturumuna bağlanamaz.
- Bildirim: istek ev sahibine; sonuç (kabul, ret, süre dolması — tek tür) isteyene.

## Yerleştirme hatırlatması

"Sınav saatini henüz seçmedin" dürtmesinin kaydı ve **günlük tekrar kapısı** — pencere × öğretmen × okulun yerel günü için tek kayıt.

- Kayıt sınav satırında değil ayrı tablodadır, çünkü hatırlatma tam olarak satırı **olmayan** sınavlar için gider.
- Günlük iş yalnız taslak ve hafta duyurusu yapılmış pencerelerde, taslak tamamlanma tarihinden okul ayarındaki gün kadar önce başlar; **üst sınırı yoktur**. Takvim yayınlandıktan sonra hatırlatma değil revizyon söz konusudur.
- Sorumlu öğretmen: satır yazılmışsa sahibi, yazılmamışsa çifti okutan herkes. Bekleyen isteği olan çift hatırlatılmaz — öğretmen işini yaptı, karar ev sahibinde.
- Öğretmen başına tek bildirim gider, gövdesinde eksik sınav sayısı yazar. Hesabı çözülemeyen öğretmen için kayıt yazılmaz.
- Yönetici panodan seçtiği öğretmenlere not ekleyerek elle gönderebilir; aynı günlük kapıdan geçer ve gönderen yönetici kaydedilir (günlük işin gönderdiğinde gönderen boştur). Kilitli pencereye gönderilmez; kimseye gidemediyse "bugün zaten gönderildi" ile "gönderilecek kimse yok" ayrı cümlelerle reddedilir.

## İlişkiler

- [[Sınav Penceresi]] — satırın penceresi; mod, kilit ve tarih aralığı oradan
- [[Şube]] / [[Ders]] — koordinat eksenleri
- [[Kişi]] — sahip, uygulayan, ev sahibi ve isteyen öğretmen
- [[Ders Programı]] — beklenen sınavlar, ev sahibi hücre, taşındı taraması; yalnız okunur
- [[Zil Çizelgesi]] — ders saatinin saate karşılığı
- [[Sınav Oturumu]] — kelebekte satırın çatısı
- [[Değerlendirme]] — yerleşmiş sınavın tarihi not sütununa yazılır
- [[Sınav Türü]] — pencere üzerinden

## Geçtiği modüller

- [[Sınav Takvimi]] — kavramın sahibi
- [[Notlar]] — not sütununun sınav tarihi bu satırdan beslenir
- [[Müfredat]] — ders silme kapısı kilitli olmayan penceredeki sınav satırına bakar

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- Taşındı taraması sistem tarafından yapıldığı için olayda taşıyan kişi boş Guid; hedef hücre de eski hücrenin aynısı yazılıyor, çünkü sınav yeni bir hücreye gitmedi. Bildirim gövdesi bu hâli "yeni saat duyurulacak" diye mi anlatmalı, "taşındı" diye mi?
- Yönetici yolunda bir şube × dersi birden çok öğretmen okutuyorsa sahip, kimliği en küçük olan öğretmen olarak belirlenimci seçiliyor. Ürün kararı mı, yoksa geçici bir seçim mi?
