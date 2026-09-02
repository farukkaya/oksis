---
aliases: [FileCategoryPolicy, FileCategories, Dosya Politikası]
tags: [domain/platform]
table: "-"
status: active
last-synced: 2026-09-03 (b72c819)
---

# Dosya Kategorisi

<!-- generated:start -->

## Nedir

Bir dosyanın **ne tür bir dosya olduğu** ve buna bağlı kuralları. Her [[Saklı Dosya]] bir kategoriye aittir ve kategorinin kuralları o dosyaya uygulanır.

Kavramın varlık sebebi tek cümlede duruyor: **kurallar koda dağıtılmaz, tek kayıt defterinde yaşar.** "Ödev teslimi en fazla 20 MB olur, PDF veya Word kabul edilir, taranır ve bir yıl saklanır" cümlesi tek bir yerde tanımlıdır; yükleme, indirme ve imha yolları hep oraya bakar.

Kategori defteri veritabanında değil kodda sabit veri olarak durur.

## Her kategori ne söyler

Beş şey: hangi uzantılar ve içerik tipleri kabul edilir, azami boyut nedir, virüs taraması gerekir mi, indirme doğrudan mı yoksa süreli imzalı bağlantıyla mı olur, ve **ne kadar saklanır**.

## Bugünkü kategoriler

Ödev teslimi, ödev eki, sınav belgesi, sanal kitap, okul logosu, kulüp belgesi, duyuru eki, mazeret belgesi ve önizleme.

Ödev teslimi ile ödev eki **bilinçli olarak iki ayrı kategoridir:** öğrencinin teslimi ile öğretmenin çalışma kâğıdının saklama ve tarama politikaları farklıdır; tek kategori olsaydı öğrenci, öğretmenin ekini kendi teslimi diye bağlayabilirdi.

Sınırlar kategoriye göre ciddi biçimde değişir — sanal kitap yarım gigabayta kadar çıkar ve parçalı yüklemeye izin verir, okul logosu iki megabaytla sınırlıdır. Yalnız sanal kitap imzalı bağlantı zorunlu tutar.

## Saklama süresi ve imha

Saklama süresi **sezon bitişinden itibaren** işler ve günlük çalışan bir iş süresi dolan dosyaları yumuşak siler. Süresi tanımsız olan kategoriler bu işin kapsamı dışındadır: okul logosu süresizdir, sanal kitap sözleşme süresine bağlıdır ve ayrı bir ayrılış imhasıyla ele alınır.

Bu alan KVKK tarafının doğrudan karşılığıdır; mazeret belgesinin süresi devamsızlık itirazlarının dayanabileceği süreye göre seçilmiş ve kodda **teyit bekleyen taslak** olarak işaretlenmiştir.

## Kurallar

- Kategorisi tanınmayan bir dosya yüklenemez.
- Kategori kuralları yükleme anında uygulanır; kategori sonradan değiştirilmez.
- Tarama gerektirmeyen kategoride dosya doğrudan aktif doğar.

## İlişkiler

- [[Saklı Dosya]] — her dosya bir kategoriye aittir
- [[Dosya Bağı]] — kategori ile hedef kayıt tipi ayrı defterlerdir; ikisi birebir örtüşmez

## Geçtiği modüller

- [[Dosya Yönetimi]] — kavramın sahibi; kural uygulama ve imha
- [[Ödevler]] — teslim ve ek kategorileri; yükleme kapısı kategoriyi doğrular

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- **Üç kategorinin bağlanabileceği kayıt tipi yok:** sınav belgesi, sanal kitap ve kulüp belgesi tanımlı ama [[Dosya Bağı]] onları tanımıyor; yüklense de bir kayda bağlanamaz. Ödev teslimi ve ödev eki 2026-08-27'de bağlandı ([[Ödevler]]).
- **Öğrenci belgesi kategorisi hiç tanımlı değil** — o taraf kendi ham dosya adresini tutuyor (bkz. [[Öğrenci Belgesi]]).
- Mazeret belgesinin saklama süresi kodda "KVKK teyidi bekleyen taslak" diye işaretli. Teyit alındı mı?
- Kategori defteri kodda sabit. Okulun kendi kategorisini tanımlaması gerekirse ne olacak?
