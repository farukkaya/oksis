---
aliases: [ScheduleException, Ders Vekâleti, Derse Girme, Etüt]
tags: [domain/academic]
table: academic.schedule_exceptions
status: active
last-synced: 2026-09-13 (294ffe6)
---

# Program İstisnası

<!-- generated:start -->

## Nedir

Yayınlanmış bir ders programının **tek güne özel** geçici değişikliği. Üç işi görür: dersin iptali, **öğretmen vekâleti** (derse başkasının girmesi) ve derslik değişikliği.

Kurgunun özü şudur: yayınlanmış program **kirletilmez**. İstisna ayrı bir kayıttır ve yalnız kendi gününde programın üstüne bir katman olarak biner. Böylece "asıl program neydi" ile "o gün ne oldu" soruları ayrı ayrı cevaplanabilir.

Kaydın sahibi [[Ders Programı Yönetimi]]'dir; ama vekâlet yüzü [[Nöbetler]] modülünden de yönetilir — öğretmen gelmediğinde yerine kimin gireceğini bulmak nöbet ekranının işidir. İki modül aynı kayda iki farklı kapıdan yazar.

**Vekâlet planlı değil tepkiseldir.** Bir öğretmen gelmediğinde o saatteki ders boş kalmasın diye, o an boşta olan başka bir öğretmen görevlendirilir; karar genelde nöbetçi müdür yardımcısınındır ve dakikalar içinde verilir. Bu yüzden **öğretmen devamsızlığı ayrı bir kayıt olarak tutulmaz**: ekran o öğretmenin o günkü derslerini yayınlanmış programdan türetir, kalıcı olan yalnız ortaya çıkan istisna kayıtlarıdır. Kodda öğretmen devamsızlık ya da izin kaydı yoktur.

## Yaşam döngüsü

Oluşturulur ve geri alınır. Geri alma **yumuşaktır**: kayıt silinmez, geri alındığı işaretlenir ve o günün katmanından düşer.

Programın kendisi silinirse o programın bütün istisnaları programla birlikte yumuşak silinir.

## Kurallar

- İstisna yalnız **yayınlanmış ya da revize edilen** bir programa yazılabilir.
- Hedef, programdaki belirli bir ders yerleşimidir; yerleşim programda yoksa veya pasifse işlem reddedilir.
- İstisnanın günü, tarihin gerçek takvim günüyle aynı olmalıdır. Gün değeri gerçek takvim günü olduğu için bu karşılaştırma dönüşümsüz doğrudur ([[0013-gun-degeri-gercek-system-dayofweek]]).
- Vekil adayı o saatte **canlı** bir programda (yayında ya da revize) dersi olmayan öğretmendir; taslaklar doluluk sayılmaz. Yoklayan öğretmen ve aynı tarih + aynı ders saatinde zaten vekil olan öğretmen adaylıktan elenir.
- **Vekil uygunluğu öğretmen müsaitlik kayıtlarına bakmaz.** Müsaitlik ders programını planlarken kullanılan bir tercihtir; vekâletin sorduğu soru ise "bu öğretmen şu an fiilen boşta mı" sorusudur ve yalnız yayınlanmış yerleşimlerle mevcut vekâletlerden cevaplanır.
- **Aday sıralaması:** branş uyumu (aynı → yakın → farklı), sonra o haftaki vekâlet yükü (az olan önce), sonra ad. Yük sıralamaya girer ki vekâlet hep aynı kişiye düşmesin.
- Vekil bulunamadığında ders **etüde** çevrilebilir; bu da bir istisna kaydıdır.
- Gerekçe alınır.
- **İstisna yoklamayı doğrudan etkiler.** O günün [[Yoklama Oturumu]] üretilirken istisnaya bakılır: iptal istisnası varsa oturum satırı yine üretilir ama doğrudan iptal durumunda doğar; vekâlet istisnası varsa oturumun **efektif öğretmeni vekile çevrilir** ve yoklamayı vekil alır.
- **Bildirim:** oluşturma, şubenin öğrenci ve velilerine ve ilgili öğretmenlere (asıl öğretmen ve varsa vekil) bildirilir; iptal ayrı bir bildirim türüyle gider. Geri alma şubenin öğrenci ve velilerine bildirilir. Aynı istisna için bildirim tekrar gönderilmez.
- Aynı olay [[Nöbetler]]'deki nöbet yükü hesabına vekâlet adedi olarak girer.

## Vekil adayının branş uyumu

Aday öğretmenler üç kovaya ayrılır:

- **aynı** — aday bu sezon o derse yetkindir ([[Ders Görevlendirmesi]]) ya da ana veya yan branşı o dersi okutabilen branşlardan biridir;
- **yakın** — aynı değil, ama adayın yetkin olduğu derslerden biri yoklayan dersle aynı ders kategorisindedir;
- **farklı** — hiçbir örtüşme yok.

Karşılaştırma ad değil **branş kimliği** üzerinden yapılır ve görevlendirmedeki uyum hesabıyla **aynı eşleştiriciyi** kullanır; önceden iki ayrı ve ada dayalı kopya vardı. Yetkinlik okuması programın **sezonuyla** süzülür: süzülmezse geçen sezonun kaydı bugünkü sıralamaya sızar ve bu sezon o dersi vermeye yetkili olmayan aday "aynı" görünür.

## Kapsam dışı

- **Öğretmen itirazı.** Öğretmen vekâleti görür; itiraz ya da red akışı yoktur, ayrı bir işe ertelendi.
- **Öğretmen devamsızlık kaydı.** Yukarıda — vekâlet tepkisel olduğu için yalnız sonucu saklanır.

## İlişkiler

- [[Ders Programı]] — istisnanın üstüne bindiği program; hedef yerleşim oradadır
- [[Program Sürümü]] — tüketici görünümü snapshot + o günün istisnalarıyla katmanlanır
- [[Nöbetler]] — vekâlet yüzünün yönetildiği ikinci modül; nöbet yükü hesabı vekâletleri sayar
- [[Dönem]] — istisna bir döneme aittir
- [[Ders]] — vekâlet edilen dersin branş eşlemesi ve kategorisi buradan gelir
- [[Branş]] — aday sıralamasının diğer tarafı
- [[Ders Görevlendirmesi]] — "aynı" ve "yakın" kovalarının yetkinlik kaynağı
- [[Profil]] — asıl öğretmen ve vekil
- [[Derslik]] — derslik değişikliği yüzünde hedef oda

## Geçtiği modüller

- [[Ders Programı Yönetimi]] — kavramın sahibi; üç tipin tamamı, önizleme, listeleme, geri alma
- [[Nöbetler]] — vekâlet oluşturma, etüde çevirme, geri alma, günün vekâlet panosu
- [[Yoklama ve Devamsızlık]] — oturum üretiminde istisnayı okur; iptal ve vekâlet oturuma yansır

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- Bu kayıt üç farklı işi (iptal, vekâlet, derslik değişikliği) tek tipte topluyor ve iki ayrı modülden yazılıyor. Yazma kuralları iki kapıda aynı mı — nöbet tarafındaki uygunluk kısıtları ders programı tarafından da uygulanıyor mu?
