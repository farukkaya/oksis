---
aliases: [StoredFile, Dosya, Yüklenen Dosya]
tags: [domain/platform]
table: files.stored_files
status: active
last-synced: 2026-09-13 (294ffe6)
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
- İki fazlı akışta beyan edilen boyuta güvenilmez: onay adımında depodan **gerçek boyut** okunur; beyanla uyuşmazsa onay reddedilir ve dosya bekleyen durumda kalır. **Sağlama toplamını ise istemci beyan eder**, çünkü sunucu bu akışta byte'ları hiç görmez. İçerikle karşılaştırma tarama işinde yapılır; uyuşmazlık dosyayı bulaşık sayar ve karantinada bırakır. Tek adımlı yüklemede sağlama toplamını sunucu, yükleme sırasında kendisi hesaplar.
- Sağlama toplamının biçimi domain'de de doğrulanır — çağırana körü körüne güvenilmez.
- Aynı dosya ikinci kez silinemez.
- **Dosya silinince bütün bağları da kalkar.** Silme, dosyanın bağlı olduğu kayıtların **hepsine** yazma erişimi ister; bağlardan biri bile çağıranın kapsamı dışındaysa istek 404 döner. Aksi hâlde birden çok kayda bağlı bir dosyada, tek bağa erişimi olan kişi dosyayı öteki kayıtlardan da silebilirdi. Hiç bağı olmayan dosyada kapsam kurulamadığı için okul içinde olmak ve silme izni yeter.
- **Nesne anahtarı iş anlamı taşımaz.** Anahtar sezon, kategori, ay ve rastgele bir kimlikten oluşur; kişi, şube, ödev gibi iş hiyerarşisi anahtara gömülmez, dolayısıyla kaydın iş bağlamı değişince depoda bir şey taşınmaz. **Özgün dosya adı asla anahtara girmez**: yalnız uzantısı alınır, ad indirmede geri verilir. Türkçe karakter, çakışma ve enjeksiyon sorunları böylece hiç doğmaz.
- Aynı içerik ikinci kez yüklenirse ayrı bir kayıt olur; tekilleştirme bilinçli olarak kapalıdır — bkz. [[0011-dosya-tekillestirmesi-kapali]].
- Her dosya bir **kategoriye** aittir ve kategorisinin kurallarına tabidir (bkz. [[Dosya Kategorisi]]).

## Önizleme dosyaları

Bir dosyanın küçük önizlemesi **ayrı bir saklı dosya kaydı** olarak üretilir ve üst dosyaya işaret eder. Sahiplik kurulmaz, yalnız işaret edilir — böylece önizleme, sürümleme veya tekilleştirme gibi başka kavramlarla karışmaz. Önizleme kullanıcı yüklemesi olmadığı için taramaya girmez; kaynağı zaten taranmış bir dosyadır.

## İlişkiler

- [[Dosya Bağı]] — dosyayı bir iş kaydına bağlar; çok biçimli
- [[Dosya Kategorisi]] — izinli tür, boyut, tarama ve saklama kuralları
- [[Okul]] — dosyalar okulun kendi depolama alanında yaşar; alan okul başınadır ve adı okul kimliğinden türetilir (bkz. [[0010-okul-basina-depolama-alani]])

## Geçtiği modüller

- [[Dosya Yönetimi]] — kavramın sahibi
- [[Yoklama ve Devamsızlık]] — mazeret belgesi
- [[Okul Yönetimi]] — okul logosu
- [[Duyurular]] — duyuru eki
- [[Ödevler]] — öğretmen eki ve öğrenci teslimi; ödev modülü dosya depolamaz, yalnız kimliğini bağlar

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- **Önizleme dosyaları sahipsiz kalıyor:** üst dosya silindiğinde veya imha edildiğinde önizleme temizlenmiyor, kendi saklama süresi de yok. Kod bunu borç olarak işaretlemiş.
- Sezon kimliği burada da eski `AcademicYearId` adıyla taşınıyor.
- Nesne anahtarındaki sezon önekinin gerekçesi "eski bir sezonun dosyalarını önek bazında topluca arşivlemek veya imha etmek"ti. Bugün öneki kullanan bir toplu yol yok; saklama süresi dosya dosya işliyor. Önek hâlâ bu amaç için mi tutuluyor? (2026-09-13)
