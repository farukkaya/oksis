---
aliases: [ScheduleException, Ders Vekâleti, Derse Girme, Etüt]
tags: [domain/academic]
table: academic.schedule_exceptions
status: active
last-synced: 2026-08-10 (2270867)
---

# Program İstisnası

<!-- generated:start -->

## Nedir

Yayınlanmış bir ders programının **tek güne özel** geçici değişikliği. Üç işi görür: dersin iptali, **öğretmen vekâleti** (derse başkasının girmesi) ve derslik değişikliği.

Kurgunun özü şudur: yayınlanmış program **kirletilmez**. İstisna ayrı bir kayıttır ve yalnız kendi gününde programın üstüne bir katman olarak biner. Böylece "asıl program neydi" ile "o gün ne oldu" soruları ayrı ayrı cevaplanabilir.

Kaydın sahibi [[Ders Programı Yönetimi]]'dir; ama vekâlet yüzü [[Nöbetler]] modülünden de yönetilir — öğretmen gelmediğinde yerine kimin gireceğini bulmak nöbet ekranının işidir. İki modül aynı kayda iki farklı kapıdan yazar.

## Yaşam döngüsü

Oluşturulur ve geri alınır. Geri alma **yumuşaktır**: kayıt silinmez, geri alındığı işaretlenir ve o günün katmanından düşer.

## Kurallar

- İstisna yalnız **yayınlanmış ya da revize edilen** bir programa yazılabilir.
- Hedef, programdaki belirli bir ders yerleşimidir; yerleşim programda yoksa veya pasifse işlem reddedilir.
- Aynı gün, aynı saat diliminde başka bir vekâlette görevli olan öğretmen aday listesinden elenir.
- **Vekil uygunluğu yalnız yapısal yerleşimlere ve mevcut vekâletlere bakar** — öğretmen müsaitlik kayıtları bu hesaba kasıtlı olarak dahil edilmez.
- Vekil bulunamadığında ders **etüde** çevrilebilir; bu da bir istisna kaydıdır.
- Gerekçe alınır.
- **İstisna yoklamayı doğrudan etkiler.** O günün [[Yoklama Oturumu]] üretilirken istisnaya bakılır: iptal istisnası varsa oturum satırı yine üretilir ama doğrudan iptal durumunda doğar; vekâlet istisnası varsa oturumun **efektif öğretmeni vekile çevrilir** ve yoklamayı vekil alır.

## Vekil adayının branş uyumu

Aday öğretmenler üç kovaya ayrılır: **aynı** (aday zaten o dersi veriyor ya da branş adı ders adıyla eşleşiyor), **yakın** (adayın verdiği derslerden biri aynı ders kategorisinde), **farklı** (hiçbir örtüşme yok). Branş adı ile ders adının karşılaştırılması, [[Ders Görevlendirmesi]]'ndeki uyum hesabıyla aynı mekanizmadır.

## İlişkiler

- [[Ders Programı]] — istisnanın üstüne bindiği program; hedef yerleşim oradadır
- [[Program Sürümü]] — tüketici görünümü snapshot + o günün istisnalarıyla katmanlanır
- [[Nöbetler]] — vekâlet yüzünün yönetildiği ikinci modül
- [[Dönem]] — istisna bir döneme aittir
- [[Ders]] — vekâlet edilen dersin branş uyumu buradan hesaplanır
- [[Branş]] — aday sıralamasının diğer tarafı
- [[Profil]] — asıl öğretmen ve vekil
- [[Derslik]] — derslik değişikliği yüzünde hedef oda

Ders programı, yerleşim ve yayın kavramlarının notu henüz yok.

## Geçtiği modüller

- [[Ders Programı Yönetimi]] — kavramın sahibi; üç tipin tamamı, önizleme, listeleme, geri alma
- [[Nöbetler]] — vekâlet oluşturma, etüde çevirme, geri alma, günün vekâlet panosu
- [[Yoklama ve Devamsızlık]] — oturum üretiminde istisnayı okur; iptal ve vekâlet oturuma yansır

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- Vekil uygunluğu öğretmen müsaitlik kayıtlarını **açıkça sorgulamıyor** — kodda bu bir kural olarak yazılı. Gerekçesi koddan çıkmıyor: müsaitlik verisi güvenilmez olduğu için mi, yoksa vekâlet zaten olağanüstü bir durum olduğu için mi?
- Bu kayıt üç farklı işi (iptal, vekâlet, derslik değişikliği) tek tipte topluyor ve iki ayrı modülden yazılıyor. Yazma kuralları iki kapıda aynı mı — nöbet tarafındaki uygunluk kısıtları ders programı tarafından da uygulanıyor mu?
