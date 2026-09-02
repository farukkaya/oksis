---
aliases: [StudentEnrollment, Kayıt, Kayıt Yenileme]
tags: [domain/people]
table: academic.student_enrollments
status: active
last-synced: 2026-09-03 (b72c819)
---

# Öğrenci Kaydı

<!-- generated:start -->

## Nedir

Bir öğrencinin **bir [[Sezon]]'daki okul kaydı**. MEB dilinde "kayıt" denen şey budur: çocuk bu yıl bu okulda okuyor mu, hangi sınıf seviyesinde, ne zaman kaydolmuş, kaydı hangi durumda.

[[Kişi]] kalıcıdır, kayıt **sezona bağlıdır**. Öğrenci mezun olsa da kişi kaydı silinmez; her yıl için ayrı bir öğrenci kaydı açılır. Bu ayrım modelin kurucu fikridir ve [[Şube Ders Görevlendirmesi]]'ndeki "öğretmen ≠ görevlendirme" ayrımının öğrenci tarafındaki karşılığıdır.

Kayıt üç yoldan doğar: **yeni kayıt**, **nakil geliş** (geldiği okul zorunlu) ve **yenileme** (bir önceki yılın kaydının devamı).

## Yaşam döngüsü

`Taslak → Aktif`, sonra dört çıkış: `Dondurulmuş`, `Ayrıldı`, `Nakil Çıkış`, `Mezun`. Son üçünden `Arşiv`'e geçilir.

- **Taslak** — kayıt açıldı ama henüz yürürlükte değil. Yenileme taslakları bu durumda bekler.
- **Aktif** — öğrenci okuyor.
- **Dondurulmuş** — geçici ayrılma; yalnız aktif kayıt dondurulur, yalnız dondurulmuş kayıt çözülür.
- **Ayrıldı / Nakil Çıkış / Mezun** — üçü de yalnız aktif kayıttan çıkılır.
- **Arşiv** — yalnız bu üç sonuçtan girilir.

Geçişler tek yönlüdür ve her biri kendi durumundan başlamak zorundadır; aksi hâlde reddedilir.

## Kurallar

- **Bir öğrencinin bir sezonda tek kaydı olabilir** — tekil index korur.
- Nakil gelişte **geldiği okul zorunludur**.
- Kayıt açma **idempotenttir**: istemci bir istek kimliği taşır, aynı kimlikle ikinci çağrı yeni kayıt üretmez, öncekini döndürür. Kayıt akışı kişi + profil + numara + hesap ürettiği için tekrarın maliyeti yüksektir.
- Sınıf seviyesi burada **master kimliği değil sayı** olarak tutulur ve kademe sıralamasıyla aynı sayı uzayında olduğu varsayılır. Terfi ve terminal-kademe kararları bu varsayıma dayanır.
- Yenileme taslağı **yeni öğrenci numarası üretmez**; mevcut numara korunur.

## Şube bağı — dikkat

Kayıttaki şube alanı bir **ayna**dır, doğruluk kaynağı değildir. Öğrencinin gerçek şubesi [[Şube]] içindeki atama defterinde yaşar.

Bu alan yalnız **terfi akışında** yazılır. Yıl içi şube transferi defteri ve öğrenci [[Profil]]'ini günceller ama bu alana dokunmaz — dolayısıyla yıl ortasında şube değiştiren öğrencinin kaydı eski şubede kalabilir.

## Kayıt yenileme

Yıl sonunda okul, gelecek yıl kimin devam edeceğini sorar. Her aktif kayda bir **niyet** işaretlenir: yenileniyor, kararsız, ayrılıyor. Niyeti "yenileniyor" olanlar için hedef sezonda şubesiz bir **taslak** açılır.

Taslak açmada iki eleme vardır: hedef sezonda o öğrenci için zaten bir yenileme kaydı varsa atlanır (işlem tekrar çalıştırılabilir), ve bir üst kademe okulca sunulmuyorsa atlanır — o öğrenci mezun olacaktır.

Taslak, terfi sırasında bir şubeye yerleştirilerek aktifleşir. **Yenileme dönemi açıksa** yalnız taslağı olan öğrenci koltuğa oturur; taslağı olmayan atlanır. Dönem kapalıysa eski davranış sürer ve tüm şube listesi terfi eder.

## İlişkiler

- [[Kişi]] / [[Profil]] — kaydın öznesi; öğrenci profili ve numarası
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
