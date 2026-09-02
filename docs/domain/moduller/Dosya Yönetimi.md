---
aliases: [Documents, api/v1/files, Dosyalar]
tags: [domain/platform, module]
status: completed
last-synced: 2026-09-03 (b72c819)
---

# Dosya Yönetimi

<!-- generated:start -->

## Ne yapar

Sisteme yüklenen her dosyanın tek adresi. Mazeret raporu, okul logosu, duyuru eki — hepsi buradan geçer. Modül dosyayı alır, virüsten tarar, bir iş kaydına bağlar, indirmeyi yetkiye göre açar, okulun kotasını izler ve süresi dolan dosyaları imha eder.

Taşıyıcı ilke: **nesne deposu yalnızca byte deposudur; gerçeğin kaynağı veritabanındaki kayıttır.** Depoda duran ama kaydı olmayan bir dosya sistem için yoktur — bu, yarım kalmış yüklemelerin ve yetim byte'ların temizlenebilmesini mümkün kılar.

İkinci ilke, tüketici modüllerin işini kolaylaştırır: **dosya ile bağ ayrıdır.** Yeni bir modül dosya kullanmak istediğinde dosya tarafında şema değişikliği gerekmez; tek yapması gereken kendi erişim çözümleyicisini yazmaktır.

## Kullandığı kavramlar

- [[Saklı Dosya]] — modülün ana aggregate'i
- [[Dosya Bağı]] — dosya ile iş kaydı arasındaki çok biçimli bağ
- [[Dosya Kategorisi]] — izinli tür, boyut, tarama ve saklama kuralları
- [[Okul]] — her okulun kendi depolama alanı vardır

## Ana akışlar

1. **Yükleme — iki yol.** Küçük dosyalar tek adımda sunucu üzerinden geçer. Büyük dosyalar için iki fazlı akış vardır: önce oturum açılır ve istemciye imzalı bir adres verilir, istemci doğrudan depoya yazar, sonra onay adımında sunucu depodan **gerçek boyutu ve sağlama toplamını** okuyup kaydı tamamlar. Beyan edilen boyuta güvenilmez.

2. **Kategori kapısı.** Yükleme, dosyanın kategorisine bakar: uzantı ve içerik tipi izinli mi, boyut sınırı aşılıyor mu, tarama gerekiyor mu. Kategorisi tanınmayan dosya kabul edilmez.

3. **Virüs taraması ve karantina.** Tarama gerektiren dosya **karantinada doğar** ve indirilemez. Arka plan işi tarar: temizse aktifleşir, bulaşıksa karantinada kalır ve olay yayınlanır. Tarayıcı arızalanırsa dosya atlanmış sayılmaz — iş yeniden denenir. "Atlandı" yalnız kategori tarama istemiyorsa veya operatör taramayı bilinçle kapattıysa yazılır.

4. **Bağlama ve çözme.** Dosya bir iş kaydına bağlanır; aynı dosya birçok kayda bağlanabilir. Bağ kaldırmak dosyayı silmez.

5. **İndirme.** Yalnız aktif ve taraması temiz dosya indirilebilir. Erişim, dosyanın bağlı olduğu kaydın erişim kuralına devredilir — her kayıt tipi için ayrı bir çözümleyici karar verir. **Tanınmayan kayıt tipi doğrudan reddedilir** ve "bulunamadı" olarak döner; kaynağın varlığı sızdırılmaz.

6. **Kota.** Okulun kullandığı toplam alan izlenir ve bir sınırla karşılaştırılır. Sayaç hızlı olsun diye önbellekte tutulur, belirli aralıklarla veritabanı toplamıyla yeniden hesaplanır.

7. **Önizleme üretimi.** Görsel dosyalar için arka planda küçük bir önizleme üretilir; bu da ayrı bir dosya kaydıdır ve üst dosyaya işaret eder.

8. **Temizlik ve imha — dört ayrı iş.** Onaylanmamış yükleme oturumları 24 saat sonra silinir. Yumuşak silinen dosya 30 gün sonra fiziksel olarak imha edilir. Kategorisinin saklama süresi dolan dosyalar günlük olarak yumuşak silinir. Yeni okul açıldığında depolama alanı otomatik hazırlanır.

**Yetki:** Yükleme `files.upload`, görüntüleme `files.view`, indirme `files.download`, silme `files.delete`, kota görüntüleme `files.quota.view`. İzin ucu açar; **kaynağa erişim ayrıca** bağlı kaydın kuralından geçer — iki katmanlı koruma.

## Kapsam dışı

- **İş anlamı.** Modül dosyanın ne olduğunu bilmez, yalnız kategorisini bilir. "Bu rapor geçerli mi" sorusu tüketici modülün işidir.
- **Sürümleme ve tekilleştirme.** Alanlar mevcut (sürüm numarası, sağlama toplamı) ama akışları bu taramada görünmedi.
- **Okuldan ayrılış imhası.** Sözleşme süresine bağlı kategoriler (sanal kitap) günlük imha işinin kapsamı dışında; ayrı bir ayrılış akışına bırakılmış.

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- Önizleme dosyaları hiçbir imha işinin kapsamına girmiyor; üst dosya gidince sahipsiz kalıyorlar.
- Kota sayacı atomik değil; eşzamanlı yüklemelerde sınır sessizce aşılabilir.
- Kategori defterinde tanımlı üç kategorinin (sınav, sanal kitap, kulüp) bağlanabileceği bir kayıt tipi henüz yok. Ödev eki ve teslimi 2026-08-27'de bağlandı ([[Ödevler]]).
- Öğrenci belgesi bu modülü hiç kullanmıyor, kendi ham dosya adresini tutuyor.
