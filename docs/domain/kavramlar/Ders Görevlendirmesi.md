---
aliases: [SubjectTeacherAssignment, Görevlendirme v2, Yetkinlik Ataması, Yetkinlik Kaydı]
tags: [domain/academic]
table: academic.subject_teacher_assignments
status: active
last-synced: 2026-09-13 (294ffe6)
---

# Ders Görevlendirmesi

<!-- generated:start -->

## Nedir

"Bu öğretmen bu sezon bu dersi vermeye yetkilidir" cümlesinin kaydı. Öğretmen ile [[Ders]] arasında, bir [[Sezon]]'a bağlı olarak kurulur.

Görevlendirmenin **tek kanonik kaydıdır**. "Görevlendirme" kelimesi aslında üç ayrı soruyu karşılar ve yalnız birincisi elle tutulur:

1. **Yetkinlik** — kim hangi dersi verebilir? → bu kayıt. Programdan türetilemez, çünkü program bu bilgiden üretilir.
2. **Dağıtım niyeti** — "9-A Matematik'i Ayşe versin", "Ali bu dersi almasın" → isteğe bağlı [[Dağıtım Kısıtı]].
3. **Fiili yük** — kim hangi şubede haftada kaç saat veriyor? → yayınlanmış [[Ders Programı]]'ndan türetilir, hiçbir yerde elle yazılmaz.

Fiili yükü elle tutan eski model ([[Şube Ders Görevlendirmesi]], "v1") programla senkron kalamadı ve 2026-08-18'de kaldırıldı. Kodda bu kayda hâlâ "Görevlendirme v2" denmesinin sebebi budur; artık yanında ikinci bir nesil yoktur.

Kavramın belirleyici kararı **ne taşımadığıdır**: haftalık saat yoktur, şube yoktur. İkisi de program üretilirken türetilir (aşağıda). Sınıf seviyesi de saklanmaz; dersin kademe bağlarından türetilir.

## Yaşam döngüsü

`Active → Closed`. Kapatma yıl-içi devir içindir ve **silme değildir**: kayıt tarihlenir, kapatan kişi, tarih ve gerekçe yazılır, iz kalıcı olarak görünür kalır. Aynı kaydı ikinci kez kapatmak işlem üretmez. Öğretmenin görev geçmişi bu kayıtlardan okunur; kapatılan satır listede kalır.

Sezon sert sınırdır: yeni sezonda yeni kayıt açılır, eskisi geçmişte kalır.

## Kurallar

- Aynı (öğretmen, ders, sezon) üçlüsü için yalnız bir **aktif** kayıt olabilir; filtreli unique index ile korunur. Aynı istekte zaten aktif olan ikililer atlanır.
- Ders aktif olmalıdır. Ders havuzu okulun **aktif kademeleriyle** süzülür — lise okulu ortaokula özgü dersleri görmez; okul hiç kademe tanımlamamışsa bütün aktif dersler görünür. Seviye türetimi de aynı kesişimle yapılır.
- **Branşsız öğretmene atama yapılamaz** — sert engeldir, gerekçeyle aşılamaz.
- **Alan-dışı atama engellenmez.** Öğretmenin branşı derse uymuyorsa yumuşak uyarı verilir ve serbest metin gerekçe taşınır. Karar okulundur, sistem yalnız iz bırakır.
- Uyum üç değerlidir: branş-içi, yan branş, alan-dışı. Gerekçe yalnız alan-dışında anlamlıdır ve yalnız orada gösterilir.
- Uyum **hesaplanır, saklanmaz** — her okumada yeniden türetilir, bu yüzden branş eşlemesi değişince kendiliğinden güncellenir.
- Kapatılmış kaydın gerekçesi değiştirilemez; iz dokunulmazdır.
- Onay iş akışı yoktur. Yerine öz-denetim ve denetim izi vardır: atayan kişi ve tarih otomatik damgalanır.
- Değişimde olay yayınlanır ama **dinleyen yoktur**: görevlendirme değişince mevcut programa hiçbir şey olmaz; yeni yetkinliği yalnız bir sonraki otomatik üretim görür.
- Diğer aggregate'lere yalnız ID ile bağlanır.

## Branş uyumu nasıl hesaplanıyor

Karşılaştırma **ad değil kimlik** üzerinden yapılır (`X-04`). Her dersin "bu dersi okutabilen branşlar" eşlemesi vardır; öğretmenin ana branşı bu kümedeyse branş-içi, yan branşlarından biri bu kümedeyse yan branş, değilse alan-dışı sayılır. Öğretmenin branşı yoksa ya da dersin hiç branş eşlemesi yoksa sonuç alan-dışıdır — bilinmeyen bir şeyi "uyumlu" göstermemek için.

Öğretmen profili okulun kendi branş kaydını taşır; karşılaştırmadan önce katalog branşına çevrilir, aksi hâlde iki farklı uzaydaki kimlikler hiç kesişmez ve her şey alan-dışı çıkar.

Neden ad değil: ad karşılaştırması ölçümde derslerin kayda değer bir kısmını **kalıcı olarak alan-dışı** düşürüyordu (Matematik branşlı öğretmen "İleri Matematik" dersine) ve bir branşın ya da dersin adını değiştirmek bütün sonuçları sessizce değiştiriyordu. Aynı eşleştirici vekil aday sıralamasında da kullanılır ([[Program İstisnası]]).

## Programı nasıl besliyor

Otomatik ders programı üretimi ve yayın önizlemesindeki eksik saat hesabı, "şube × ders × saat × öğretmen" satırlarını bu kayıttan **türetir**; hiçbir şey yazmaz. Ders programı görevlendirmeyi tüketir, üretmez.

- **Şube** = programı üretilen sınıfın kendisi.
- **Haftalık saat** = kademenin müfredatı ([[Haftalık Ders Saati]]); ders o kademede verilmiyorsa hiç aday olmaz.
- **Öğretmen** = o sezonda derse yetkin aktif kayıtlar arasından seçilir. Tek aday varsa odur. Birden çok aday varsa kademedeki şubeler sabit sırayla (kademe → şube adı) dolaşılır ve her şube, o an **göreli doluluğu** (verilecek saat dâhil / haftalık kapasite) en düşük adaya verilir; eşitlikte kimlik sırası kazanır. Kural durum tutmaz: aynı girdi her zaman aynı çıktıyı verir. Kapasiteler eşitken sonuç dönüşümlü dağıtımla birebir aynıdır; 15 saatlik yarı zamanlı öğretmen orantılı olarak daha az şube alır (`K-13/2`).
- **Haftalık kapasite** öğretmen profilinde tutulur (1-40 saat). Boşsa okul varsayılanı (30) geçerlidir; boş olmak eksik değil, "idare özel değer girmedi" bilgisidir. Mevcut öğretmenlere değer yazılmadı, herkes varsayılanda doğar (`K-13/3`). Kapasite **yumuşaktır**: dolsa da dağıtım durmaz, aşım yayın önizlemesinde uyarı olarak görünür.
- [[Dağıtım Kısıtı]] seçimden önce uygulanır: pin hücrenin öğretmenini doğrudan belirler, hariç tutma adayı havuzdan düşürür.
- Derse yetkin öğretmen yoksa satır üretilmez ve ders "yerleşmemiş" görünür — uydurma bir öğretmen atamak sessiz bir yalan olurdu.

## Sezon kopyalama

Kaynak sezonun aktif (ders, öğretmen) çiftleri hedef sezona kopyalanır. Satır atlanır: öğretmen işten ayrılmışsa, ders pasifse, hedefte aynı çift zaten aktifse — sonuncusu işlemi tekrar çalıştırmayı güvenli kılar. Sezon aktivasyonunda bu kopya, bağlı sezon taslağındaki tercihe göre (tercih yoksa varsayılan açık) çalışır. [[Dağıtım Kısıtı]] kayıtları kopyalanmaz.

## İlişkiler

- [[Ders]] — görevlendirmenin bir ucu; branş eşlemesi uyumun girdisi
- [[Branş]] — uyumun hesaplandığı katalog
- [[Profil]] — diğer uç; öğretmen profili, ana/yan branşları ve haftalık kapasitesi
- [[Sezon]] — sert sınır; her görevlendirme bir sezona aittir
- [[Haftalık Ders Saati]] — üretimde saatin kaynağı
- [[Dağıtım Kısıtı]] — yetkinliğin üstüne binen isteğe bağlı dağıtım niyeti
- [[Ders Programı]] — bu kayıttan üretilen ve fiili yükün türediği program
- [[Şube Ders Görevlendirmesi]] — kaldırılan eski nesil

## Geçtiği modüller

- [[Görevlendirmeler]] — kavramın sahibi; atama, kapatma, kapsama, sezon kopyalama, görev geçmişi
- [[Müfredat]] — kayıt kod tarafında bu modülde yaşar; ders ve branş katalogları oradan gelir
- [[Ders Programı Yönetimi]] — otomatik üretimin ve eksik saat hesabının öğretmen kaynağı
- [[Nöbetler]] — vekil adaylarının branş uyumu sıralamasında yetkinlik okunur (sezona bağlı)
- [[Sezon Yönetimi]] — aktivasyonda kopyalanır; görevlendirmesi olan kurulum sezonu geri alınamaz

## Açık Sorular (koddan doğrulanamayan)

- Öğretmen profilinde yan branş alanı var ve uyum onu okuyor, ama uygulama katmanında yan branşı **yazan** bir komut bulunamadı. Yan branş ayağı pratikte hep boş mu?
- Değişim olayının dinleyicisi yok. Bir öğretmenin yetkinliği kapatıldığında yayındaki programda o öğretmenin dersleri durmaya devam ediyor. Bu durum bir uyarıya dönüşmeli mi?

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- (Şu an açık soru yok.)
