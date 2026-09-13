---
aliases: [Exams, api/v1/exams, Sınav Modülü, Kelebek Sınav Sistemi]
tags: [domain/academic, module]
status: in-progress
last-synced: 2026-09-13 (294ffe6)
---

# Sınav Takvimi

<!-- generated:start -->

## Ne yapar

Okulun sınav haftasını planlar ve duyurur: "hangi şube, hangi dersten, ne zaman, nerede, kiminle sınava girecek" sorusunu cevaplar. **Yönetici** dönem ve sınav türü için bir [[Sınav Penceresi]] kurar, haftayı duyurur, panodan eksikleri ve ihlalleri izler, takvimi yayınlar, yayından sonra gerekçeyle değiştirir. **Öğretmen** kendi şube × ders sınavlarını yerleştirir, gerekirse başka bir öğretmenin ders saatini ister ya da gelen isteği cevaplar, kendi takvimini ve gözetmenlik görevlerini görür. **Öğrenci ve veli** kendi (çocuğunun) takvimini, kelebek düzeninde dersliğini ve sıra numarasını görür.

Modül **tek omurga üzerinde iki düzen** taşır ve düzen pencere başına seçilir:

- **Ders saati modu** — sınav dersin kendi saatinde, şubenin kendi sınıfında yapılır; sınavı öğretmen yerleştirir. Sıra numarası yoktur.
- **Oturum (kelebek) modu** — bir dersin birden çok şubesi aynı ders saatinde sınava girer, öğrenciler dersliklere serpiştirilir, derslik ve gözetmen ders programından türetilir; birimi [[Sınav Oturumu]]'dur.

Üç ilke modülün karakterini belirler. **Yayın birimi penceredir** ve yayın iki adımlıdır: önce hafta, sonra ayrıntı. **Ders programına dokunulmaz:** sınav program hücresinin üstüne bir etiket olarak biner; ders yerinde kalır, program istisnası üretilmez. **Kararlar sunucuda verilir:** kural ihlalleri, görünürlük ve "okulun bugünü" istemcide türetilmez ([[0018-sinav-kurallari-denetleyicide]]).

## Kullandığı kavramlar

- [[Sınav Penceresi]] — dönem × sınav türü; yayın birimi; `Draft → WindowPublished → SchedulePublished → Locked`
- [[Planlanmış Sınav]] — pencere × şube × ders satırı; tembel doğar; ödünç saat isteği ve yerleştirme hatırlatması içinde
- [[Sınav Oturumu]] — kelebek birimi: tek ders, tek ders saati, çok şube; derslik, gözetmen ve sıra içinde
- [[Sınav Türü]] — pencerenin hangi sınav için açıldığı; yalnız dönem sınavı türleri pencere taşır
- [[Dönem]] / [[Sezon]] — pencere bir döneme aittir ve o dönemin tarihlerine sığmak zorundadır
- [[Şube]] / [[Ders]] — sınav satırının koordinatı; şubenin ev dersliği kelebek dersliğinin kaynağı
- [[Ders Programı]] — beklenen sınavların, ev sahibi hücrenin ve gözetmenin tek kaynağı; yalnız okunur
- [[Derslik]] — kelebekte fiziksel oda ve kapasitesi
- [[Zil Çizelgesi]] — ders saati bir sıra numarasıdır; saate karşılığı buradan okunur
- [[Öğrenci Kaydı]] — oturuma yalnız ayrılmamış ve kaydı aktif öğrenci girer
- [[Değerlendirme]] / [[Not Defteri]] — takvim yayını not sütununun sınav tarihini besler
- [[Okul Ayarları]] — sınav politikasının beş alanı
- [[Kişi]] — sahip öğretmen, ev sahibi öğretmen, gözetmen, işlemi yapan yönetici hep kişi kimliğidir
- [[İzin]] — dört anahtar
- [[Bildirim]] / [[Bildirim Türü]] — sekiz sınav türü

## Ana akışlar

1. **Politika** — Okul başına beş ayar [[Okul Ayarları]] kaydında durur ve bu modülün ucundan yönetilir: duyuru payı (1–60 gün, varsayılan 7), şubeye günlük sınav sınırı (1–8, varsayılan 2), yerleştirme hatırlatmasının taslak tarihinden kaç gün önce başlayacağı (1–90, varsayılan 14), görüş penceresi süresi (1–30, varsayılan 3 — bugün hiçbir akış kullanmıyor) ve yeni pencerenin öntanımlı modu. Ayar satırı yoksa kurallar bu varsayılanlara düşer.

2. **Pencere kurma ve hafta duyurusu** — Yönetici dönem, sınav türü, tarih aralığı, mod ve taslak tamamlanma tarihini girer. Yayınlandığında öğrenci ve veli yalnız haftayı görür; sorumlu öğretmenlere "yerleştirme açıldı" haberi gider.

3. **Ders saati modunda yerleştirme** — Öğretmen kendi beklenen şube × ders listesinden bir sınava pencere içinde bir gün ve ders saati seçer. Saat kendi dersiyse sınav anında yerleşir. Başkasının dersiyse [[Planlanmış Sınav]] üzerinde bir ödünç saat isteği doğar ve karar yalnız ev sahibi öğretmenindir. Taslak tarihine kadar cevaplanmayan istek düşer. Yerleştirme taslak pencerede de açıktır; kapı yalnız kilit ve pencerenin tarih aralığıdır.

4. **Kelebek modunda oturum** — Oturum iki yoldan doğar: öğretmen yerleştirdiğinde (varsayılan olarak o dersteki bütün şubeleri girer) ya da yönetici şube listesiyle kurduğunda. Her üyelik, derslik ya da gözetmen değişikliğinde oturum **yeniden bestelenir**: derslik → gözetmen → yerleşim, sabit sırada. Yönetici şube ekler/çıkarır, aynı hücredeki oturumları birleştirir, derslik ekler/çıkarır, gözetmen deliğini doldurur, iki sıranın öğrencisini takas eder ya da yerleşimi yeniden ürettirir.

5. **Kural denetimi ve takvim yayını** — Yayın ön izlemesi ile yayın kapısı aynı ihlal listesini kullanır. Geçilemez sert ihlal varken yayın reddedilir; duyuru payı ya da yerleşmemiş sınav varsa en az 15 karakterlik gerekçe istenir; kapasite aşımı ve karışmamış derslik yalnız görünür. Yayınla birlikte tarih, ders saati ve derslik görünür olur; oturumdaki öğrenci derslik ve sırasını taşıyan kişisel bildirim alır.

6. **Yayın sonrası değişiklik** — Takvim yayındayken her değişiklik gerekçe ister, pencerenin sürümünü artırır ve etkilenen her sınav satırı için değişmez bir revizyon kaydı yazar; bildirim yalnız etkilenenlere gider. Ders saati modunda tek sınav taşınır; kelebekte tek sınav taşınamaz, oturum bir bütün olarak kalır.

7. **Günlük iş** — Her gün 06:00'da, her okul için o okulun yerel gününe göre ve **sırayla** beş adım: (1) taslak tarihi geçmiş bekleyen saat isteklerini düşür, (2) ev sahibi hücresi programdan kalkmış sınavları "taşındı" işaretle, (3) yerleştirme hatırlatmalarını gönder, (4) yarın sınavı olanlara bildir, (5) bitiş tarihi geçmiş pencereleri kilitle. Sıra bilinçlidir: düşen isteğin sınavı aynı turda hatırlatmaya girer; kilit en sondadır. Bir okulun hatası diğer okulların turunu durdurmaz.

8. **Not defterine tarih beslemesi** — Takvim yayınlandığında o dönem × sınav türünün **var olan** not sütunlarına yerleşmiş sınavın tarihi yazılır; sütun üretilmez, kilitli sütun atlanır. Sütun sonradan doğarsa tarihini yayınlanmış pencereden alır. Yayınlanmış pencere varken aynı dönem × sınav türü için elle sınav tarihi girmek reddedilir.

9. **Okuma yüzleri** — Yönetici panosu (beklenen, yerleşmiş, bekleyen istek, ihlal, şube × gün yığılması, oturum görünümü). Öğrenci/veli takvimi üç hâl döner — boş, yalnız hafta, yayınlanmış — ve tek pencereye bakar: henüz bitmemiş en yakın pencere, hepsi bittiyse en son biten. Ders programı etiketi yalnız takvimi yayınlanmış ya da kilitli pencerelerden üretilir; taşınmış sınav "güncellendi" işaretiyle kalır; etiketin dersi sınavın dersidir. Öğrenci ve veli yalnız kendi (çocuğunun) şubesinin etiketini sorabilir. Öğretmen gözetmenlik görevlerini yalnız kendisi için görür.

## Kural kodları

Kodların tek yeri kural denetleyicisidir; sertlik ayrımını çağıran uygular ([[0018-sinav-kurallari-denetleyicide]]).

| Kod | Sertlik | Kural |
|---|---|---|
| `EX-H01` | Sert · geçilemez | Şubeye aynı gün en çok N sınav (okul ayarı). Ders saati modunda yerleştirmede, her iki modda yayında ölçülür. |
| `EX-H03` | Sert | Seçilen saat, sahibin (ödünç saatte ev sahibinin) o şubedeki iptal edilmemiş dersi olmalı — **yalnız ders saati modunda**. |
| `EX-H05` | Sert · geçilemez | Bir öğrenci aynı gün ve saatte tek oturumda, tek derslikte, tek sırada. |
| `EX-H06` | Sert · geçilemez | Bir öğretmen aynı gün ve saatte tek derslikte gözetmen; elle gözetmen yazarken ve yayında ölçülür. |
| `EX-H08` | Yayında sert, gerekçeyle geçilir · taşımada uyarı | Takvim yayını ile ilk sınav arasında en az duyuru payı kadar gün. |
| `EX-H09` | Sert · geçilemez | Cevaplanmamış ödünç saat isteği varken yayın yok. |
| `EX-H10` | Sert · geçilemez | Oturum dersliğinin gözetmeni yok. |
| `EX-H11` | Sert · geçilemez | Bir derslik aynı gün ve saatte tek oturumda. |
| `EX-H12` | Sert · geçilemez | Oturumda sıraya oturamamış öğrenci var. |
| `EX-S01` | Yumuşak | Şubenin bir önceki ya da sonraki gün de sınavı var; yerleştirmede uyarı. |
| `EX-S04` | Yumuşak | Bir dersliğe tek şubeden öğrenci düştü (karışım olmadı); oturum kapsamında görünür, yayın listesine girmez. |
| `EX-S05` | Yumuşak · gerekçeyle geçilir | Saati seçilmemiş şube × ders var — hiç dokunulmamış çiftler dahil. |
| `EX-S06` | Yumuşak · yalnız görünür | Derslikte kapasite aşıldı; kapasitesi girilmemiş derslik aşılmış sayılmaz. |

`EX-H02`, `EX-H04`, `EX-H07`, `EX-S02`, `EX-S03` kural denetleyicisinde **hiç yazılmadı** ve numaraları başka kurala verilmez (R47). `EX-H04` (kapasite sert) ve `EX-S03` (gözetmen yük dengesi) bilinçle yazılmayacak; `EX-S02` (öğretmen kendi öğrencisinin dersliğinde gözetmen) kelebekte beklenen durum olduğu için yazılmayacak.

## Yetki

- `exams.read` — takvim, etiket, politika okuma. Öğretmen, öğrenci, veli.
- `exams.place` — kendi sınavını yerleştirme, ödünç saat isteme ve cevaplama, yerleştirme saatleri. Öğretmen; **okul yöneticisinde de vardır** (2026-09-12): kelebek oturumu kurarken hangi saatlerde şubenin okulda olduğunu gösteren ızgara bu izinle okunur. Yöneticinin sahip olduğu sınav olmadığı için yerleştirme ve istek uçları onu sahiplik kapısında reddeder.
- `exams.manage` — pencere, yayın, pano, oturum komutları, gözetmen, takas, yeniden üretim, politika, hatırlatma. Okul yöneticisi.
- `exams.report` — okul yöneticisinde tanımlı; hiçbir uç istemiyor (açık soru).

Taşımanın izin kapısı iki yollu: `exams.manage` herhangi bir sınavı, `exams.place` yalnız sahibi olduğu sınavı taşır. Ödünç saat isteğini yalnız ev sahibi öğretmen cevaplar; izin taşıyan başka kimse (yönetici dahil) cevaplayamaz.

## Bildirimler

Sekiz tür; "değişti" diyen her bildirim yalnız takvim yayındayken gider — yayınlanmamış takvimde kimse eski hâli görmemiştir. Veli tarafında bilgi kısıtı süzgeci uygulanmaz: takvim bir bilgi değil, şubenin planıdır.

- **Pencere yayınlandı** — beklenen şubelerin öğrenci ve velileri + sorumlu öğretmenler. Push yok, yalnız zil.
- **Yerleştirme hatırlatması** — saati seçilmemiş sınavı olan öğretmen; öğretmen başına tek bildirim, eksik sayısıyla.
- **Saat istendi** — ev sahibi öğretmen.
- **Saat isteği sonuçlandı** — isteyen öğretmen; kabul, ret ve süre dolması tek tür.
- **Takvim yayınlandı** — yerleşmiş sınavı olan şubelerin öğrenci ve velileri + sahip öğretmenler; oturuma oturmuş öğrenci derslik ve sırasını taşıyan kişisel satır alır ve toplu satırdan düşülür.
- **Sınav taşındı** — üç olayın ortak türü: tek sınavın taşınması (şube + sahip öğretmen), oturumun şube üyeliğinin değişmesi (çıkan, giren, kalan şube için üç ayrı gövde) ve oturma planının değişmesi (yalnız yeri gerçekten oynayan öğrenci ve velileri).
- **Yarın sınav var** — yayınlanmış ya da kilitli pencerede yarın yerleşmiş sınavı olan şubenin öğrenci ve velileri + sahip öğretmen; taşınmış sınav dışarıda.
- **Gözetmenlik değişti** — görevi giden ve görevi gelen öğretmen; öğrenciye gitmez.

## Kapsam dışı

- **Sınav notu** — [[Notlar]] modülünündür; bu modül yalnız tarihi besler.
- **Sınav kâğıdı, soru, içerik; telafi ve mazeret sınavı planlama; gözetmen ek ders ücreti; okul dışı merkezi sınavlar** — bilinçle dışarıda.
- **Ders programını askıya almak** — sınav program hücresine yazılmaz; program istisnası üretilmez, yerleşim değiştirilmez.
- **Kapı listesi, oturma planı ve gözetmen çizelgesi çıktıları; gözetmenin yoklama alması; öğretmen görüş penceresi** — sonraki faz (Faz 2b). Görüş penceresinin alanları ve ayarı var ama hiçbir akış kullanmıyor.
- **Derslik ve gözetmeni öneren otomatik dağıtıcı** — Faz 3.
- **Derslik müsaitliği, derslik başına ikinci gözetmen, dersliğin sıra × sütun düzeni, şubenin ev dersliğinin zorunlu olması** — bu fazda yapılmayacak; ev dersliği eksikliği için köprü, yöneticinin elle derslik eklemesidir (`TB-120`).

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- **`exams.report` hiçbir uçta kullanılmıyor.** Seed'de "okul geneli sınav panosu" diye okul yöneticisine veriliyor; pano ise `exams.manage` istiyor. İzin artık gereksiz mi, yoksa salt okur bir rapor rolü için mi bekliyor?
- **Görüş penceresi yarım duruyor.** Pencerenin görüş tarihleri ve onları yazan metot var, okul ayarında süresi var; hiçbir komut çağırmıyor. Faz 2b'de doldurulacak mı, yoksa kaldırılacak mı?
- **Kelebekte yoklama.** Bir şube birden çok dersliğe ve birden çok gözetmene bölünüyor; [[Yoklama Oturumu]] ise tek "yoklamayı alan" alanı taşıyor. Kelebek saatinde yoklamayı kim alır ve nasıl kaydedilir? Faz 2b'nin ilk karar noktası.
- **`EX-S04` yalnız oturum kapsamında.** Yayın listesine girmiyor; pencere kapsamında aynı oda iki oturumda birleşince uyarı yanlış yerde susuyor. Olgu sözleşmesi değişecek mi?
- **Bilinen fark — "hiç yazılmadı" denen iki kuralın karşılığı kodda var.** Kural denetleyicisinin başlığı ve modül belgeleri `EX-H02` ile `EX-H07`'yi yazılmamış sayıyor. Oysa şube × ders × pencere tekilliği veritabanında korunuyor, aynı dönemde tarihleri çakışan ikinci pencere de pencere kurulurken (kod yorumunda `EX-H07` adıyla) reddediliyor. İkisi de ihlal listesine girmiyor. Kodların durumu nasıl kayda geçmeli?
- **Bilinen fark — okul ayarındaki öntanımlı mod yorumu bayat.** Yorum "oturum modu seçilse bile pencere oluşturulamaz" diyor; o kapı 2026-09-11'de kaldırıldı ve iki mod da kuruluyor.
- **Pencerenin modu değişebilir mi?** Modu ya da tarih aralığını değiştiren bir komut yok, yani mod fiilen pencere ömrü boyunca sabit. Ama oturum komutlarının kapıları "mod geri alınmışsa" diye savunuyor ve revizyon türlerinden biri "tarih aralığı, mod" değişikliğini anlatıyor. Sabitlik bir kural mı, yoksa henüz yazılmamış bir düzenleme komutunun eksikliği mi?
- **Oturumun saati değiştirilemiyor, ama birleştirme hatası bunu öneriyor.** Farklı hücredeki iki oturumu birleştirme reddi "birini önce aynı güne ve ders saatine taşıyın" diyor; oturumu taşıyan bir komut yok ve tek sınav taşıması kelebekte reddediliyor. Doğru yol şubeleri çıkarıp yeni saate yerleştirmek mi?
