---
tags: [decision, domain/academic]
date: 2026-09-20
status: accepted
---

# 0022 — Müfredat yayımı iki kişi ister ve ara alandan geçer

## Bağlam

MEB çizelgesinin sisteme girmesi tek adımda yapılabilirdi: belgeyi oku, satırları master tabloya
yaz. Bu yolun iki sorunu var. Birincisi, yanlış okunmuş ya da eksik bir çizelge doğrudan
okulların çalışan müfredatına girerdi ve hata ancak ders programı bozulunca fark edilirdi.
İkincisi, aynı kişi hem satırı düzeltip hem onaylayabilirdi; yanlış bir ders eşlemesi tek bir
dikkatsizlikle yayımlanırdı ve yayımlanan sürüm değişmez olduğu için geri dönüşü yeni bir sürümdür.

## Karar

Master veri yalnız **onaylanmış bir içe aktarmadan** doğar. Satırlar önce ara alanda (staging) ham
hâliyle yaşar; ders eşlemeleri **öneri** olarak üretilir, onay insandan gelir; ve **ara alanı
düzelten kullanıcı aynı çalışmayı onaylayamaz**.

## Değerlendirilen alternatifler

- **Doğrudan master'a yazma** — en kısa yol; ayrıştırma/doğrulama hatası yayımlanmış sürümü
  bozardı ve "bu satır nereden geldi" sorusunun cevabı kalmazdı.
- **Güven eşiği üstü otomatik eşleme** (ör. %90 üstü kendiliğinden onay) — yanlış eşlenen bir ders
  sessizce yayımlanır, okulların çizelgesine geçer ve ancak ders programında fark edilirdi.
  Benzerlik yalnız öneri üretir.
- **İki kişi kuralını yalnız yönergeye bırakmak** — kuralın kodda değil belgede yaşaması, ilk
  yoğun günde unutulur. Kural durum geçişinin içindedir; çağıranın hatırlamasına bırakılmaz.
- **Bilinmeyen dersi otomatik master katalog açmak** — çizelgedeki yazım hatası kalıcı bir ders
  kaydına dönüşürdü. Bilinmeyen ders ya elle bağlanır ya satır kapsam dışı kalır.

## Sonuçları

- Hatalı çizelge ara alanda kalır; yayımlanmış sürümler ve okulların sezon snapshot'ları
  etkilenmez.
- Her yayımlanan satır kaynağına bağlıdır (belge + sayfa), "bu saat nereden çıktı" sorusu
  cevaplanabilir.
- Tek platform hesabıyla uçtan uca akış denenemez: onay için ikinci bir hesap gerekir. Bu bilinçli
  bir maliyettir.
- Yayımlanan sürüm ve satırları değişmezdir; düzeltmenin yolu yeni bir sürüm yayımlamaktır
  ([[0021-aktif-sezon-mufredati-snapshottan-okur]] ile aynı ilke).
- Geri dönülürse: kural `CurriculumImportRun` durum geçişlerinde ve
  `PublishedCurriculumImmutabilityInterceptor`'da yaşar.

## İlgili

- [[Müfredat İçe Aktarma]]
- [[MEB Kaynak Belgesi]]
- [[Müfredat Sürümü]]
- [[Müfredat]]
