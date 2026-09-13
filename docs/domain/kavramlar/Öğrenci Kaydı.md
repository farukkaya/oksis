---
aliases: [StudentEnrollment, Kayıt, Kayıt Yenileme]
tags: [domain/people]
table: academic.student_enrollments
status: active
last-synced: 2026-09-13 (294ffe6)
---

# Öğrenci Kaydı

<!-- generated:start -->

## Nedir

Bir öğrencinin **bir [[Sezon]]'daki okul kaydı**. MEB dilinde "kayıt" denen şey budur: çocuk bu yıl bu okulda okuyor mu, hangi sınıf seviyesinde, ne zaman kaydolmuş, kaydı hangi durumda.

[[Kişi]] kalıcıdır, kayıt **sezona bağlıdır**. Öğrenci mezun olsa da kişi kaydı silinmez; her yıl için ayrı bir öğrenci kaydı açılır. Bu ayrım modelin kurucu fikridir ve [[Şube Ders Görevlendirmesi]]'ndeki "öğretmen ≠ görevlendirme" ayrımının öğrenci tarafındaki karşılığıdır.

Kayıt üç yoldan doğar: **yeni kayıt**, **nakil geliş** (geldiği okul zorunlu) ve **yenileme** (bir önceki yılın kaydının devamı).

## Terfi ≠ yenileme

İkisi sık karıştırılır ama farklı şeylerdir:

- **Terfi** akademik ve topludur: sezon geçişinde şube koltukları bir üst kademeye taşınır. Okulun kararıdır, tek tek öğrenciye sorulmaz.
- **Yenileme** velinin iradesidir ve ticari bir taahhüt taşır: aile, çocuğun gelecek yıl bu okulda devam edeceğini beyan eder.

Terfi yenilemeye bakabilir (yenileme dönemi açıksa yalnız yenileme taslağı olanı yerleştirir), ama yenileme kendi başına kimseyi terfi ettirmez.

## Yaşam döngüsü

`Taslak → Aktif`, sonra dört çıkış: `Dondurulmuş`, `Ayrıldı`, `Nakil Çıkış`, `Mezun`. Son üçünden `Arşiv`'e geçilir.

- **Taslak** — kayıt açıldı ama henüz yürürlükte değil. Bugün bu durumu yalnız yenileme taslakları kullanır; yeni kayıt ve nakil geliş aynı işlemde aktifleşir.
- **Aktif** — öğrenci okuyor.
- **Dondurulmuş** — geçici ayrılma; yalnız aktif kayıt dondurulur, yalnız dondurulmuş kayıt çözülür.
- **Ayrıldı / Nakil Çıkış / Mezun** — üçü de yalnız aktif kayıttan çıkılır.
- **Arşiv** — yalnız bu üç sonuçtan girilir. Geçiş kavramda tanımlı, ama bugün onu çağıran bir akış yok.

Geçişler tek yönlüdür ve her biri kendi durumundan başlamak zorundadır; aksi hâlde reddedilir.

### İki eksen birlikte değişir

Kayıt durumu tek başına değişmez. Yıl içi her durum değişikliği aynı işlemde üç şeye birden dokunur: **kayıt durumu**, [[Kişi]] **yaşam döngüsü** ve **şube koltuğu**.

- **Dondurma** — kayıt dondurulur, kişi askıya alınır, **koltuk korunur** (öğrenci döndüğünde yeri hazırdır).
- **Çözme** — kayıt aktifleşir, kişi yeniden etkinleşir.
- **Ayrılma** — kayıt kapanır, kişi askıya alınır, koltuk kapanır.
- **Nakil çıkış** — kayıt kapanır, kişi nakle geçer, koltuk kapanır.
- **Mezuniyet** — kayıt kapanır, kişi mezun olur, koltuk kapanır.

İki eksen de işlemden **önce** kontrol edilir: kayıt beklenen durumda değilse ya da kişinin yaşam döngüsü beklenen durumda değilse istek 409 ile reddedilir. Böylece yarım geçiş (kayıt kapandı ama kişi aktif kaldı gibi) oluşmaz. Bu işlemler yalnız cari sezonun kaydı üzerinde çalışır.

İstisna: sezon geçişindeki terminal kademe mezuniyeti bu üçlüyü birlikte değiştirmez, yalnız koltuğu kapatır (bkz. [[Sezon Yönetimi]]).

## Kurallar

- **Bir öğrencinin bir sezonda tek kaydı olabilir** — tekil index korur.
- Nakil gelişte **geldiği okul zorunludur**.
- Yeni kayıt yalnız `Active` sezonda açılır.
- Kayıt açma **idempotenttir**: istemci bir istek kimliği taşır, aynı kimlikle ikinci çağrı yeni kayıt üretmez, öncekini döndürür. Kayıt akışı kişi + profil + numara + hesap ürettiği için tekrarın maliyeti yüksektir.
- Sınıf seviyesi burada **master kimliği değil sayı** olarak tutulur ve kademe sıralamasıyla aynı sayı uzayında olduğu varsayılır. Terfi ve terminal-kademe kararları bu varsayıma dayanır.
- Yenileme taslağı **yeni öğrenci numarası üretmez**; mevcut numara korunur.

## Şube bağı — dikkat

Kayıttaki şube alanı bir **ayna**dır, doğruluk kaynağı değildir. Öğrencinin gerçek şubesi [[Şube]] içindeki atama defterinde yaşar.

Bu alan yalnız **terfi akışında** yazılır. Yıl içi şube transferi defteri ve öğrenci [[Profil]]'ini günceller ama bu alana dokunmaz — dolayısıyla yıl ortasında şube değiştiren öğrencinin kaydı eski şubede kalabilir.

## Kayıt yenileme

Yıl sonunda okul, gelecek yıl kimin devam edeceğini sorar. Her aktif kayda bir **niyet** işaretlenir: yenileniyor, kararsız, ayrılıyor. Niyeti "yenileniyor" olanlar için hedef sezonda şubesiz bir **taslak** açılır.

- Niyet yalnız **cari (aktif) sezondaki aktif kayda** işlenir; toplu işaretlemede bu koşula uymayan kayıtlar atlanır.
- **Boş niyet "kararsız" değildir.** Hiç işaretlenmemiş kayıt hiçbir niyet sayacına girmez; "kararsız" ancak açıkça işaretlenmiş kayıttır.
- "Ayrılıyor" ve "kararsız" **hiçbir otomatik ayrılış veya durum değişikliği üretmez**. Yalnız "yenileniyor" bir sonuç doğurur: taslak açılması. Ayrılış ancak yıl içi durum değişikliği olarak elle yapılır.

Taslak açmada iki eleme vardır: hedef sezonda o öğrenci için zaten bir yenileme kaydı varsa atlanır (işlem tekrar çalıştırılabilir), ve bir üst kademe okulca sunulmuyorsa atlanır — o öğrenci mezun olacaktır.

Taslak, terfi sırasında bir şubeye yerleştirilerek aktifleşir. **Yenileme dönemi açıksa** yalnız taslağı olan öğrenci koltuğa oturur; taslağı olmayan atlanır. Dönem kapalıysa eski davranış sürer ve tüm şube listesi terfi eder — ama bu yolda yeni sezonda kayıt açılmaz, yalnız koltuk taşınır.

## İlişkiler

- [[Kişi]] / [[Profil]] — kaydın öznesi; öğrenci profili ve numarası. Kişinin yaşam döngüsü kayıt durumuyla birlikte değişir
- [[Sezon]] — kayıt bir sezona aittir
- [[Şube]] — kaydın şube ayna alanı; gerçek kaynak atama defteridir
- [[Sınıf Seviyesi]] — kademe; burada sayı olarak tutulur
- [[Öğrenci Numarası]] — kayıt açılırken üretilir
- [[Öğrenci Belgesi]] — kayda bağlanabilen evrak

## Geçtiği modüller

- [[Öğrenci Kayıt Yönetimi]] — kavramın sahibi
- [[Sınıflar ve Şubeler]] — terfi ve şube yerleşimi
- [[Sezon Yönetimi]] — sezon geçişinde yenileme dönemi ve terfi
- [[Yoklama ve Devamsızlık]] — risk ve dönem raporları kayıt üzerinden süzülür
- [[Notlar]] — defterin öğrenci listesi ve yazılabilirlik kayıt durumundan gelir: aktif ve dondurulmuş yazılabilir, şubeden ayrılanın notu görünür ama kilitli ve sayaçlara girmez
- [[Ödevler]] — yayın anındaki mevcut hedefi belirler; sonradan katılan öğrencinin satırı okurken sentezlenir, ayrılanın satırı ızgarada kalır

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- Şube bilgisi üç yerde tutuluyor (atama defteri, öğrenci profili, bu kayıt) ve yalnız ikisi otomatik senkron. Ayna alan gerçekten gerekli mi, yoksa kaldırılıp defterden mi okunmalı?
- Sınıf seviyesi sayısı kademe sıralamasıyla aynı uzayda varsayılıyor. Sıralama değişirse mevcut kayıtlar sessizce kayar — bu bağ neden kimlik üzerinden kurulmadı?
- Dondurulmuş kaydın yoklama ve devamsızlık hesabına nasıl girdiği bu taramada izlenemedi.
