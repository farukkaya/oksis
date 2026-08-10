---
aliases:
  - Announcements
  - announcements
tags:
  - domain/messaging
  - module
status: completed
last-synced: 2026-08-10 (238f5e1)
---

# Duyurular

<!-- generated:start -->

## Ne yapar

Okulun kitlesel iletişim modülü. Yönetim ve öğretmenler buradan duyuru yazar, kime gideceğini katman katman seçer (tüm okul, rol, kademe, sınıf düzeyi, şube, ders, tek kişi), yayınlar ya da ileri bir tarihe zamanlar; veli, öğrenci ve öğretmenler kendi gelen kutularından okur. Yayınlanmış duyuru düzeltilebilir, geri çekilebilir, geri çekme geri alınabilir — ama **silinemez**.

Modülün iki karakteristik özelliği var. Birincisi iki katmanlı yetki kurgusu: bir izin anahtarı ucu **açar**, handler içindeki kapı hangi **kayda** dokunulabileceğini söyler. İkincisi kayıtların kendini anlatması: imza, hedef etiketleri ve alıcının rolü yayın anında dondurulur, böylece yıllar sonra okunduğunda duyuru kimden kime gittiğini kendi kelimeleriyle söyler.

## Kullandığı kavramlar

- [[Duyuru]] — modülün merkezi; yaşam döngüsü, imza ve invariant'lar
- [[Duyuru Şablonu]] — kişisel hazır metin defteri; ayrı aggregate, silinebilir
- [[Sezon]] — her duyuru okulun aktif sezonuna bağlanır; aktif sezon yoksa oluşturma reddedilir

Ayrı notu olmayan üç yardımcı kayıt: **hedef** (yayın anında dondurulan katman, anahtar, rol kovası ve insan okunur etiket), **alıcı** (yayın anında materyalize edilen tek satır, okundu damgasının taşıyıcısı) ve **denetim izi satırı** (değiştirilemez işlem geçmişi, güncelleme metodu yoktur). Üçü de kökün içinde yaşar, bağımsız yaşam döngüleri yoktur.

## Ana akışlar

1. **Oluşturma ve yayınlama** — Tek istekte tek transaction: hedefler dondurulur, alıcılar materyalize edilir, sayı mühürlenir, olay yayılır. Fan-out bilinçli olarak arka plana atılmaz; yayın cevabındaki alıcı sayısı doğru olmak zorundadır, çünkü ekrandaki açık onay adımı ona dayanır. Ek dosya da aynı transaction'dadır: hata durumunda duyuru hiç yayınlanmaz. Etiketi çözülemeyen hedef seçimi tamamen elenir — ne dondurulur, ne alıcı üretir, ne erişim kapsamını etkiler.

2. **Zamanlanmış yayın** — Gelecek tarihli duyuruda hedefler donar ama alıcılar **materyalize edilmez**; liste yayın anında sabitlenir, zamanlama anında değil, çünkü arada sınıf mevcudu değişebilir. Dakikalık bir sweep vadesi gelenleri yayınlar. Hedef yayın anında kimseye çözülmezse duyuru **yayınlanmaz**, beklemede kalır ve yayınlayana ayrı bir bildirim gider — sıfır alıcıyla "yayınlandı" demek gönderim raporunda kimsenin fark etmeyeceği bir yalan üretirdi. Job'ın kendi oturumu yoktur; duyurunun **yayınlayanının** yönetim yetkisi ayrıca çözülür ve hesabı bağlanamayan yayınlayan güvenli tarafa, kapsamı daraltılmış hâline düşürülür.

3. **Eşikli moderasyon** — Okul ayarı eşikliyse öğretmenin velilere giden duyurusu onay kuyruğuna düşer; öğrencilere gidenler serbest yayınlanır. Karar rol kovasına bakar, hedef katmanına değil, ve yalnız **hayatta kalan** seçimlere uygulanır — elenmiş bir veli seçimi duyuruyu kuyruğa sokmaz. Onay duyuruyu yayınlar; red taslağa döndürür ve gerekçe yalnız denetim iziyle bildirimde yaşar.

4. **Yayın sonrası düzeltme** — Yalnız yayındaki duyuruda, yalnız başlık ve gövde. Hedef **alınmaz** (INV-2). Sessiz seçeneği "Güncellendi" rozetini açmaz, ama rozet bir kez açıldıysa kapanmaz.

5. **Geri çekme ve geri alma** — Duyuru silinemediği için geri çekme, bir kaydı emekliye ayırmanın tek yoludur; bu yüzden kapı zamanlanmış duyuruya da açıktır — aksi hâlde hedefi boşalmış zamanlanmış bir duyuru ne düzeltilebilir, ne yayınlanabilir, ne silinebilir, ne geri çekilebilir bir kilitlenmeye düşerdi. Geri alma önceki statüye döner ve olay yaymaz: alıcı duyuruyu zaten görmüştü, geri gelmesi yeni bir haber değildir.

6. **Süre dolumu** — Günlük sweep, geçerlilik tarihi geçmiş yayındaki duyuruları arşive çeker. Hiçbir olay yaymaz; duyuru okuyucu yüzeyinde "süresi doldu" olarak görünmeye devam eder.

7. **Gelen kutusu ve okundu** — Alıcı listesi üzerinden **sunucuda** kesilir; istemci tarafında daraltma yapılmaz. Sayfalıdır. Veli çok çocukluysa çocuk sekmesiyle daraltabilir; okul geneli duyuru bilinçli olarak çocuksuz kaydedildiği için her sekmede görünür. Alıcı olmayan çağıranın okundu isteği 404 alır — "yetkin yok" demek duyurunun varlığını sızdırırdı.

8. **Hedef havuzu** — Seçicinin katmanlarını çağıranın kapsamına göre üretir; öğretmen yalnız kendi şube ve derslerini görür. Kademe farkındalıklı bir kural, anaokulu ve ilkokul **öğrencilerini** kapsam dışı bırakır (veliler kalır) ve seçicide bunu anlatan bir Türkçe uyarı üretir — müdür 400 kişiye gönderdiğini sanıp 260 kişiye göndermesin diye.

9. **Şablon defteri** — Çağıranın kendi hazır metinleri: listeleme, oluşturma, düzenleme, silme. Modülün **tek** silme ucu buradadır ve ayrı bir controller'da durması bilinçlidir: duyuru yüzeyindeki "sıfır DELETE" bekçisi, duyurunun silinmezliğinin API katmanındaki tek otomatik kanıtıdır. Duyuru oluştururken verilen şablon bağı yalnız kullanım sayacı içindir.

10. **Raporlar ve denetim izi** — Gönderim raporu kanal kırılımını kasten gizler: tek satır döner, çünkü sunucuda kayıtlı tek teslim kanalı uygulama içidir; birden çok satır göstermek olmayan bir kanal ölçümü uydururdu. Denetim izi eskiden yeniye, değiştirilemez. İkisine de öğretmen yalnız kendi duyurusu için erişir.

**Yetki — iki katman.** İzin anahtarları ucu açar: görüntüleme (liste, tekil kayıt, gelen kutusu), oluşturma (+ hedef havuzu + moderasyon modunu **okuma**), düzeltme, geri çekme (ve geri alma), onay (onay/red **ve** "yönetim yetkisi var mı" sorusunun tek cevabı), moderasyon modunu değiştirme, şablon yönetimi, rapor görüntüleme (+ denetim izi). Seed'de yönetimde hepsi; öğretmende görüntüleme, oluşturma, düzeltme, geri çekme, rapor ve şablon yönetimi; veli ve öğrencide yalnız görüntüleme; platform hesabında yalnız görüntüleme — okul adına duyuru yayınlayamaz.

Handler içindeki ikinci katman farklı bir soru sorar: (a) *envanter mi gelen kutusu mu* — görüntüleme izni velide de vardır, envanteri ayıran oluşturma iznidir; (b) *hangi kayda* — yönetim hepsine, öğretmen yalnız kendi yayınladığına; (c) *hangi şablona* — sahiplik hesap kimliğiyle ölçülür; (d) *acil işareti* — yalnız yönetimde; (e) öğretmenin **açık** okul geneli kapsam isteği bir güvenlik sınırıdır ve reddedilir, ama parametre hiç gelmezse sessizce kendi kayıtlarına düşürülür. Rol **hiç sorulmaz** — bu depoda JWT'ye rol claim'i yazılmaz, tüm yetki soruları izinden çözülür.

## Kapsam dışı

- **Push ve e-posta teslimi.** Kanal enum'unda tanımlıdırlar ama kayıtlı tek teslim kanalı uygulama içi bildirimdir; alıcı uygulamayı açmazsa duyuru telefonuna düşmez. Bilinçli MVP sınırı — kanal geldiğinde fan-out akışı değişmez, kanal eklenir.
- **Acil duyurunun bir kısıtı delmesi.** Acil işareti bugün yalnız bildirim başlığına ön ek koyar, süzgeç ve özet sayacına girer, denetim izine damga düşer. Bildirim önceliği ve sessiz saat kavramı bu depoda yoktur.
- **Duyuru silme.** Uç yoktur ve yazılmayacaktır.
- **Yayın sonrası hedef değiştirme.** Yanlış hedeflenen duyuru geri çekilip yeniden yayınlanır.
- **Şablon geçmişi.** Şablon değişikliği denetim izine yazılmaz; denetim izi bir duyurunun geçmişidir ve sahte bir duyuru kimliği uydurmak izi kirletirdi.
- **Sekreter rolü.** Kurumsal imzanın arkasındaki "gerçek yazar" alanı sekreter senaryosu için tasarlanmıştır, ama bu rol MVP seed'inde henüz yoktur.

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- **Kalıcılaşmış taslağın çıkışı yok** (bkz. [[Duyuru]]): kök taslaktan üç çıkış tanımlıyor ama üçünün de tek çağıranı oluşturma handler'ı ve üçü de aynı transaction içinde. Reddedilen duyuru da oraya düşüyor. Taslak yüzeyi ayrı bir fazda mı planlandı?
- Onay izni tek başına dört ayrı kuralı taşıyor: onay kuyruğunda karar verme, yayınlayan kapsamı, kayıt sahipliği ve acil işareti. Kodda gerekçesi yazılı bilinçli bir seçim, ama izin matrisi ileride ayrışırsa dört kural birden kayar. Ayrı bir anahtar düşünüldü mü?
- Zamanlanmış yayın job'ında hesabı bağlanamayan yayınlayan güvenli tarafa düşürülüyor; kabul edilen maliyet, ayrılmış bir yöneticinin okul geneli duyurusunun sıfır alıcıyla kalıp yayınlayana **yanlış** bir "hedefin boş kaldı" bildirimi göndermesi. Bu durumun sahada bir izleme karşılığı var mı?
- Moderasyon modu okul ayarları satırında yaşıyor: o satır yoksa güncelleme 404 dönüyor, okuma ise sessizce "serbest"e düşüyor. İki ucun farklı davranması bilinçli mi?
