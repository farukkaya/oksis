---
aliases: [StoredFile, Dosya, Yüklenen Dosya]
tags: [domain/platform]
table: files.stored_files
status: active
last-synced: 2026-08-10 (2270867)
---

# Saklı Dosya

<!-- generated:start -->

## Nedir

Sisteme yüklenmiş **fiziksel bir dosyanın kaydı**: adı, tipi, boyutu, sağlama toplamı, nerede durduğu ve hangi durumda olduğu.

Kurucu ilke şu: **nesne deposu yalnızca bir byte deposudur; gerçeğin kaynağı bu kayıttır.** Depoda bir şey varken burada kaydı yoksa o dosya sistem için yoktur.

İkinci ayrım da bunun kadar belirleyici: dosyanın kendisi ile bir iş kaydına bağlanması **ayrı kavramlardır**. Bağ [[Dosya Bağı]]'ndadır. Aynı dosya birçok kayda bağlanabilir; bağ silinse bile dosya silinmez.

## Yaşam döngüsü

`Yükleme Bekliyor → Karantina → Aktif → Silindi`

- **Yükleme Bekliyor** — iki fazlı akışta oturum açıldı, dosya henüz onaylanmadı. 24 saat içinde onaylanmazsa temizlenir.
- **Karantina** — byte'lar geldi ama virüs taraması bekliyor; **indirilemez**.
- **Aktif** — taramadan temiz çıktı ya da kategorisi tarama gerektirmiyor.
- **Silindi** — yumuşak silme. 30 gün sonra fiziksel imha edilir.

Virüs taraması dört durumludur: bekliyor, temiz, **bulaşık**, atlandı. Bulaşık dosya karantinada kalır ve olay yayınlanır. "Atlandı" yalnız iki durumda meydana gelir — kategori tarama gerektirmiyorsa ya da operatör taramayı bilinçli kapattıysa. Tarayıcının arızalanması "atlandı" saymaz; iş yeniden denenir.

## Kurallar

- **İndirme yalnız aktif ve taraması temiz/atlanmış dosyada serbesttir.** Karantinadaki dosya indirilemez.
- Tarama sonucu yalnız karantinadaki bekleyen dosyaya yazılabilir.
- İki fazlı akışta beyan edilen boyut güvenilmezdir; onay adımında depodan okunan **gerçek boyut ve sağlama toplamı** yazılır.
- Sağlama toplamının biçimi domain'de de doğrulanır — çağırana körü körüne güvenilmez.
- Aynı dosya ikinci kez silinemez.
- Her dosya bir **kategoriye** aittir ve kategorisinin kurallarına tabidir (bkz. [[Dosya Kategorisi]]).

## Önizleme dosyaları

Bir dosyanın küçük önizlemesi **ayrı bir saklı dosya kaydı** olarak üretilir ve üst dosyaya işaret eder. Sahiplik kurulmaz, yalnız işaret edilir — böylece önizleme, sürümleme veya tekilleştirme gibi başka kavramlarla karışmaz. Önizleme kullanıcı yüklemesi olmadığı için taramaya girmez; kaynağı zaten taranmış bir dosyadır.

## İlişkiler

- [[Dosya Bağı]] — dosyayı bir iş kaydına bağlar; çok biçimli
- [[Dosya Kategorisi]] — izinli tür, boyut, tarama ve saklama kuralları
- [[Okul]] — dosyalar okulun kendi depolama alanında yaşar

## Geçtiği modüller

- [[Dosya Yönetimi]] — kavramın sahibi
- [[Yoklama ve Devamsızlık]] — mazeret belgesi
- [[Okul Yönetimi]] — okul logosu
- [[Duyurular]] — duyuru eki

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- **Önizleme dosyaları sahipsiz kalıyor:** üst dosya silindiğinde veya imha edildiğinde önizleme temizlenmiyor, kendi saklama süresi de yok. Kod bunu borç olarak işaretlemiş.
- Sezon kimliği burada da eski `AcademicYearId` adıyla taşınıyor.
- Aynı içeriğin ikinci kez yüklenmesinde tekilleştirme (dedup) yapılıyor mu? Sağlama toplamı tutuluyor ama kullanan bir yol görünmüyor.
