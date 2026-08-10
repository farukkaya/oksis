---
aliases: [AttendanceSession, Ders Oturumu, Yoklama]
tags: [domain/academic]
table: academic.attendance_sessions
status: active
last-synced: 2026-08-10 (2270867)
---

# Yoklama Oturumu

<!-- generated:start -->

## Nedir

[[Ders Programı]]'ndaki bir dersin **belirli bir güne inmiş hâli** — yoklamanın bağlandığı birim. "10-A'nın 12 Kasım Salı 3. saat matematik dersi" bir oturumdur.

Oturum programdan **türetilir ama ona bağlı kalmaz**: üretildiği anda dersin, öğretmenin, saatin ve [[Program Sürümü]]'nün bilgileri kaydın içine dondurulur. Sonraki program revizyonları geçmiş oturumları değiştirmez — geçen ayın yoklaması bugünkü programa göre yeniden yorumlanmaz. Tarihsel doğruluğun tek güvencesi budur.

İçindeki tek satır bir öğrencinin o dersteki durumudur: **var, yok, geç, izinli, raporlu**. Bu satırlar oturumun parçasıdır ve yalnız oturum üzerinden yazılır.

## Yaşam döngüsü

`Bekliyor → Açık → Tamamlandı`, yanı sıra `Alınmadı` ve `İptal`.

- **Bekliyor** — ders saati henüz gelmedi.
- **Açık** — öğretmen yoklamayı başlattı. Fiilen alan kişi burada kaydedilir; vekil olabilir.
- **Tamamlandı** — yoklama gönderildi. Toplu ikinci gönderim kabul edilmez, tekil düzeltme yolu ayrıdır.
- **Alınmadı** — ders saati geçti, yoklama girilmedi. Gün sonu işi bu geçişi yapar.
- **İptal** — terminal; üzerine yoklama girilemez.

**Retro giriş**: `Alınmadı` durumundaki bir oturum idare tarafından sonradan tamamlanabilir. Bu durumda oturum "geriye dönük girildi" diye işaretlenir ve rapora şerh düşer. İşaret, çağıranın gönderdiği bayrağa değil **geçişten önceki gerçek duruma** bakar — açık bir oturuma yanlışlıkla retro gönderilse bile şerh düşmez.

## Kurallar

- İptal edilmiş oturuma yoklama girilemez.
- Yoklama girmeden önce oturum açılmalıdır.
- `Alınmadı` durumundan yalnız retro gönderimle çıkılır.
- Aynı öğrenci için tek gönderimde iki kayıt olamaz.
- Tamamlanmış oturuma **aynı içerik** ikinci kez gönderilirse işlem sessizce geçer (idempotent); **farklı içerik** gönderilirse reddedilir — düzeltme tekil kayıt üzerinden yapılır.
- Tekil düzeltme bir **zaman penceresine** bağlıdır. Pencere kapandıktan sonra yalnız idare düzeltebilir; öğretmenin yolu [[Düzeltme Talebi]]'dir. Sınır anı (tam pencere sonu) hâlâ izinlidir.
- Bir yerleşim + tarih ikilisi için yalnız bir oturum olabilir; tekil index korur.
- İptal, tamamlanmış veya zaten iptal edilmiş oturum dışında her durumdan yapılabilir.

## Oturumlar nasıl doğar

Oturumlar elle açılmaz, yayınlanmış programdan **materialize** edilir. Üretim bugünü de kapsayan dar bir telafi penceresiyle sınırlıdır ve bu sınır bilinçlidir: üretim penceresi ile gün sonu kapatma penceresi **aynı** tutulur. Ayrışsalardı sistem kapatamayacağı satırlar üretirdi — pencere dışında doğan bir oturum sonsuza dek `Bekliyor` kalır, `Alınmadı`'ya hiç geçemez ve retro giriş de yalnız oradan kabul edildiği için asla düzeltilemezdi.

## Ders programı istisnalarıyla ilişkisi

[[Program İstisnası]] oturumu doğrudan etkiler:

- **İptal** istisnası varsa oturum satırı yine üretilir ama doğrudan `İptal` durumunda doğar.
- **Vekâlet** istisnası varsa oturumun beklenen öğretmeni **vekile çevrilir**. Yoklamayı vekil açar, kayıt onun üzerine yazılır; vekillik yalnız bir rozet olarak taşınır.
- Oturumu yalnız efektif öğretmeni görebilir; başkasına "bulunamadı" döner (yetkisiz değil — varlığı sızdırmamak için).

Nöbetin yoklama ile bir bağı yoktur; nöbetçi öğretmen bu yolla bir sınıfın yoklamasına erişmez.

## Gün içi izin

Öğrenci gün ortasında ayrıldığında verilen izin, o periyottan sonraki derslerde **izinli** varsayılanını üretir. İzin kaydı yalnız izni taşır; kayıtlara yansıtma uygulama katmanında yapılır ve etkilenen satırlar "izin nedeniyle varsayıldı" diye işaretlenir. Ayrı bir kavram notu yoktur.

## Hatırlatma

Ders saati geçtiği hâlde yoklama girilmemişse otomatik hatırlatma gider; bu hatırlatma oturum başına bir kezdir ve **durumu değiştirmez** — öğretmen hâlâ girebilir. İdare ayrıca elle hatırlatabilir.

## İlişkiler

- [[Ders Programı]] / [[Program Sürümü]] — oturumun türediği kaynak; alanlar yazım anında dondurulur
- [[Program İstisnası]] — iptal ve vekâlet oturumu doğrudan değiştirir
- [[Şube]] / [[Ders]] / [[Dönem]] — oturumun bağlamı
- [[Profil]] — beklenen ve fiilen alan öğretmen; kayıttaki öğrenci
- [[Zil Çizelgesi]] — oturumun başlangıç ve bitiş saati buradan gelir
- [[Mazeret]] — onaylandığında geçmiş kayıtları çevirir
- [[Düzeltme Talebi]] — pencere kapandıktan sonraki düzeltme yolu
- [[Devamsızlık Özeti]] — kayıtların toplandığı projeksiyon
- `AttendanceRecord` — sahiplik (owned); tek öğrenci satırı, ayrı not değil

## Geçtiği modüller

- [[Yoklama ve Devamsızlık]] — kavramın sahibi

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- "Hatırlat" eylemi guard taşımıyor; idare butona arka arkaya basabiliyor. Ardışık basışlar tek bildirimde kalıyor ama **eşzamanlı** iki basışta iki bildirim gidebilir — kod bunu kendi içinde borç olarak işaretlemiş. Kabul edilmiş risk mi?
- Oturumun kilitlenme damgası (`LockedAt`) tanımlı ama bu taramada hiçbir yerde yazılmıyor. Dönem kapanışında kilitleme planlanıyor mu?
