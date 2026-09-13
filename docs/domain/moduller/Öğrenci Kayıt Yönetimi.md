---
aliases: [Students, api/v1/students, api/v1/enrollments, Kayıt Modülü]
tags: [domain/people, module]
status: completed
last-synced: 2026-09-13 (294ffe6)
---

# Öğrenci Kayıt Yönetimi

<!-- generated:start -->

## Ne yapar

Öğrencinin okula girişini ve okuldan çıkışını yöneten modül. Yeni kayıt alınır, nakil gelen öğrenci kaydedilir, yıl içinde kayıt dondurulur ya da sonlandırılır, yıl sonunda kimin devam edeceği sorulur ve devam edenler için gelecek yılın kaydı hazırlanır.

Modül zincirin **başlangıcıdır**: kayıt → şube yerleşimi → yoklama → devamsızlık. Diğer üç halka olmadan bu modül anlamlı, ama bu halka olmadan diğerlerinin öznesi yoktur.

Taşıyıcı fikir **kişi ile kaydın ayrılması**: kişi kalıcıdır, kayıt sezona bağlıdır. Öğrenci mezun olunca kişi silinmez; her yıl yeni bir kayıt açılır ve geçmiş kayıtlar okunabilir kalır.

## Kullandığı kavramlar

- [[Öğrenci Kaydı]] — modülün ana aggregate'i
- [[Öğrenci Numarası]] — kayıt açılırken üretilen kalıcı numara
- [[Öğrenci Belgesi]] — kayıt dosyasındaki evrak ve eksik listesi
- [[Kişi]] / [[Profil]] — kaydın öznesi; kayıt akışı ikisini de üretir
- [[Hesap]] — orta ve lise öğrencisinin giriş hesabı; kayıtla birlikte açılır
- [[Sezon]] — kayıt bir sezona aittir
- [[Şube]] — yerleşim ve kapasite görünümü
- [[Sınıf Seviyesi]] — kademe ve terfi hedefi
- [[Veli-Öğrenci İlişkisi]] — kayıt sırasında veli bağı kurulur

## Ana akışlar

1. **Kayıt alma** — Tek bir işlem birden çok şey üretir: [[Kişi]] kaydı, öğrenci [[Profil]]'i, [[Öğrenci Numarası]], veli bağları ve gerekiyorsa öğrenci hesabı. Kayıt yalnız aktif sezonda alınır ve aynı işlemde aktifleşir. Kimlik numarası verilmişse mükerrer kontrolü yapılır; dolu şubeye kayıt alınmaz (bkz. [[Şube]]). İşlem **idempotenttir**: istemci bir istek kimliği taşır; aynı kimlikle gelen ikinci çağrı yeni kişi üretmez, öncekini döndürür. Bu koruma, akışın çok şey üretmesi yüzünden gerekli.
   - **Öğrenci hesabı kademeye bağlıdır.** Anaokulu ve ilkokulda öğrenci hesabı açılmaz; bu yaşta sisteme veli girer. Ortaokul ve lisede hesap kayıtla birlikte açılır: geçici parola üretilir ve yanıtta bir kez döner, ilk girişte parola değişimi zorunludur. Kişinin zaten bir hesabı varsa ikincisi açılmaz.
   - Öğrenci hesabına **öğrenci numarasıyla** girilir. Numara yalnız okul içinde tekil olduğu için bu girişte okul ipucu gerekir (bkz. [[Kimlik Doğrulama]]).

2. **Nakil geliş** — Kayıt alma ile aynı akış, ama geldiği okul zorunludur. Önceki okulun devamsızlığı ayrıca [[Devamsızlık Özeti]]'ne devreden kayıt olarak girilebilir.

3. **Mükerrer ve kapasite kontrolü** — Kayıt öncesi kimlik numarası mükerrerliği ve şube doluluk durumu ayrı uçlardan sorgulanabilir; veli araması da buradan yapılır.

4. **Yıl içi durum değişiklikleri** — Dondurma ve çözme (geçici ayrılma), ayrılma, nakil çıkış, mezuniyet. Her geçiş yalnız kendi başlangıç durumundan ve yalnız cari sezonun kaydında yapılır. Her biri kayıt durumunu, Kişi yaşam döngüsünü ve şube koltuğunu birlikte değiştirir; dondurmada koltuk korunur. İki eksenden biri beklenen durumda değilse istek 409 ile reddedilir (ayrıntı: [[Öğrenci Kaydı]]).

5. **Yenileme niyeti** — Yıl sonunda cari sezondaki her aktif kayda niyet işaretlenir: yenileniyor, kararsız, ayrılıyor. Toplu işaretlenebilir. Aday listesi ayrı bir uçtan okunur. Boş niyet "kararsız" sayılmaz; "ayrılıyor" ve "kararsız" otomatik ayrılış üretmez.

6. **Yenileme taslağı** — Niyeti "yenileniyor" olan kayıtlar için hedef sezonda şubesiz taslak açılır ve veliye bildirim gider. İki eleme vardır: hedefte zaten taslağı olan atlanır (işlem tekrar çalıştırılabilir), bir üst kademe okulca sunulmuyorsa atlanır — o öğrenci mezun olacaktır. Öğrenci numarası değişmez.

7. **Terfi ve yerleşim** — Yeni sezonun şubeleri köken bağıyla eşleşir ve öğrenciler taşınır. **Yenileme dönemi açıksa** yalnız taslağı olan öğrenci koltuğa oturur ve taslak aynı anda aktifleşir; taslağı olmayan atlanır. Dönem kapalıysa eski davranış sürer: koltuk taşınır ama yeni sezonda kayıt açılmaz. Terminal kademedeki öğrencinin yalnız şube ataması mezuniyetle kapanır; kayıt ve kişi durumu bu yolda değişmez (bkz. [[Sezon Yönetimi]]). İşlem idempotenttir: zaten hedef şubede olan atlanır.

8. **Kayıt geçmişi ve belge takibi** — Öğrencinin geçmiş kayıtları listelenir; dosyasındaki evrak eksik/yüklendi/onaylı olarak izlenir.

**Yetki:** Okuma `students.view` ve `students.view-detail`, kayıt açma `students.create`, durum değişiklikleri `students.manage`, yenileme `students.renew`. Terfi ayrı bir aileden korunuyor (`season.student.promote`) — sezon geçişinin parçası olduğu için.

## Kapsam dışı

- **Şubeye atama kuralları.** Kayıt kimin okuduğunu söyler; hangi şubede oturduğunu [[Sınıflar ve Şubeler]] yönetir ve doğruluk kaynağı oradaki atama defteridir.
- **Veli hesabı ve daveti.** Kayıt sırasında veli bağı kurulur ama hesap üretimi [[Kullanıcılar]] tarafındadır.
- **Belge saklama.** Belge kaydı burada, dosyanın kendisi dosya yönetimi tarafında olmalı — bugün bu tam oturmamış (bkz. [[Öğrenci Belgesi]] açık soruları).
- **Başvuru hunisi.** Aday / ön kayıt / değerlendirme aşaması yoktur; kayıt alındığı anda aktiftir. Taslak durumu yalnız yenilemede kullanılır.
- **Ücret ve sözleşme.** Kaydın ticari tarafının modülde karşılığı yoktur.
- **Toplu içe aktarma.** Elle numara doğrulaması içe aktarmada da kullanılacak biçimde kurulmuş, ama içe aktarma akışı yok.
- **Kayıt arşivleme.** Kavramda arşiv geçişi tanımlı, onu çalıştıran bir akış yok.

## Açık Sorular (senkron)

- Son dört kapsam dışı madde (başvuru hunisi, ücret/sözleşme, toplu içe aktarma, kayıt arşivleme) kodda yok; bunların bilinçli bir ürün kararı mı yoksa henüz yapılmamış iş mi olduğu koddan anlaşılamıyor.

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- Öğrencinin şubesi üç ayrı yerde tutuluyor ve yalnız ikisi otomatik senkron; yıl içi transferde kayıttaki ayna bayatlıyor.
- Dondurulmuş kaydın yoklama, devamsızlık ve ders programı tarafında nasıl ele alındığı izlenemedi.