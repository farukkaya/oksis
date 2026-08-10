---
aliases: [Students, api/v1/students, api/v1/enrollments, Kayıt Modülü]
tags: [domain/people, module]
status: completed
last-synced: 2026-08-10 (2270867)
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
- [[Sezon]] — kayıt bir sezona aittir
- [[Şube]] — yerleşim ve kapasite görünümü
- [[Sınıf Seviyesi]] — kademe ve terfi hedefi
- [[Veli-Öğrenci İlişkisi]] — kayıt sırasında veli bağı kurulur

## Ana akışlar

1. **Kayıt alma** — Tek bir işlem birden çok şey üretir: [[Kişi]] kaydı, öğrenci [[Profil]]'i, [[Öğrenci Numarası]], veli bağları ve gerekiyorsa öğrenci hesabı. Kimlik numarası verilmişse mükerrer kontrolü yapılır. İşlem **idempotenttir**: istemci bir istek kimliği taşır; aynı kimlikle gelen ikinci çağrı yeni kişi üretmez, öncekini döndürür. Bu koruma, akışın çok şey üretmesi yüzünden gerekli.

2. **Nakil geliş** — Kayıt alma ile aynı akış, ama geldiği okul zorunludur. Önceki okulun devamsızlığı ayrıca [[Devamsızlık Özeti]]'ne devreden kayıt olarak girilebilir.

3. **Mükerrer ve kapasite kontrolü** — Kayıt öncesi kimlik numarası mükerrerliği ve şube doluluk durumu ayrı uçlardan sorgulanabilir; veli araması da buradan yapılır.

4. **Yıl içi durum değişiklikleri** — Dondurma ve çözme (geçici ayrılma), ayrılma, nakil çıkış, mezuniyet. Her geçiş yalnız kendi başlangıç durumundan yapılır; yanlış durumdan çağrı reddedilir.

5. **Yenileme niyeti** — Yıl sonunda her aktif kayda niyet işaretlenir: yenileniyor, kararsız, ayrılıyor. Toplu işaretlenebilir. Aday listesi ayrı bir uçtan okunur.

6. **Yenileme taslağı** — Niyeti "yenileniyor" olan kayıtlar için hedef sezonda şubesiz taslak açılır ve veliye bildirim gider. İki eleme vardır: hedefte zaten taslağı olan atlanır (işlem tekrar çalıştırılabilir), bir üst kademe okulca sunulmuyorsa atlanır — o öğrenci mezun olacaktır. Öğrenci numarası değişmez.

7. **Terfi ve yerleşim** — Yeni sezonun şubeleri köken bağıyla eşleşir ve öğrenciler taşınır. **Yenileme dönemi açıksa** yalnız taslağı olan öğrenci koltuğa oturur ve taslak aynı anda aktifleşir; taslağı olmayan atlanır. Dönem kapalıysa eski davranış sürer. Terminal kademedeki öğrenci mezun edilir. İşlem idempotenttir: zaten hedef şubede olan atlanır.

8. **Kayıt geçmişi ve belge takibi** — Öğrencinin geçmiş kayıtları listelenir; dosyasındaki evrak eksik/yüklendi/onaylı olarak izlenir.

**Yetki:** Okuma `students.view` ve `students.view-detail`, kayıt açma `students.create`, durum değişiklikleri `students.manage`, yenileme `students.renew`. Terfi ayrı bir aileden korunuyor (`season.student.promote`) — sezon geçişinin parçası olduğu için.

## Kapsam dışı

- **Şubeye atama kuralları.** Kayıt kimin okuduğunu söyler; hangi şubede oturduğunu [[Sınıflar ve Şubeler]] yönetir ve doğruluk kaynağı oradaki atama defteridir.
- **Veli hesabı ve daveti.** Kayıt sırasında veli bağı kurulur ama hesap üretimi [[Kullanıcılar]] tarafındadır.
- **Belge saklama.** Belge kaydı burada, dosyanın kendisi dosya yönetimi tarafında olmalı — bugün bu tam oturmamış (bkz. [[Öğrenci Belgesi]] açık soruları).

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- Öğrencinin şubesi üç ayrı yerde tutuluyor ve yalnız ikisi otomatik senkron; yıl içi transferde kayıttaki ayna bayatlıyor.
- Dondurulmuş kaydın yoklama, devamsızlık ve ders programı tarafında nasıl ele alındığı izlenemedi.
- Mezuniyet hem burada (kayıt durumu) hem [[Kişi]] tarafında (yaşam döngüsü) hem de şube atama defterinde (kapanış sebebi) temsil ediliyor. Üçü birlikte mi ilerliyor, ayrışabilir mi?
