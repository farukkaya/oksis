---
aliases: [Notifications, api/v1/notifications, Bildirim Dağıtımı]
tags: [domain/messaging, module]
status: completed
last-synced: 2026-09-13 (294ffe6)
---

# Bildirimler

<!-- generated:start -->

## Ne yapar

Sistemde olan biteni ilgili kişiye ulaştıran modül. Duyuru yayınlanınca, nöbet çizelgesi çıkınca, çocuk derse gelmeyince, devamsızlık eşiğe yaklaşınca bildirim buradan gider.

Modül **kendi başına bir şey söylemez** — yalnız taşır. İçeriği üreten, olayın sahibi modüldür; buranın işi doğru alıcıyı bulmak, mükerrer göndermemek ve teslim etmektir.

Haritadaki yeri şu yüzden özel: haritalanmış neredeyse her modülün çıkış ucu buraya bağlanır. Bir bildirimin neden gitmediğini araştırırken zincir hep buradan geçer.

## Kullandığı kavramlar

- [[Bildirim]] — modülün ana kaydı; zil menüsündeki kalıcı satır
- [[Bildirim Türü]] — bildirimin ne olduğunu söyleyen kod *(enum ve ayarlar kataloğu: iki ayrı temsil)*
- [[Hesap]] — alıcı bir hesaptır, kişi değil
- [[Bildirim Yapılandırması]] — okulun kanal ve olay anahtarları, sessiz saat, kişisel push tercihi; gönderim anında okunur

İlkeler (alıcı etkilenen kişidir, uygulama içi her zaman, push seçilerek, sessiz saat): [[0012-bildirim-ilkeleri]].

## Ana akışlar

1. **Olay yakalama** — Bir modül işini bitirir ve olay yayınlar. O modülün kendi bildirim işleyicisi olayı karşılar, içeriği (başlık, gövde, derin bağlantı) **kendi** üretir ve dağıtıma verir. Metin üretimi bu modülün işi değildir. Dağıtım işi kaynak işlem commit edildikten sonra kuyruğa alınır; geri alınan işlem bildirim üretmez.

2. **Alıcı çözümleme** — Kapsam kişi kimliklerinden hesap kimliklerine çevrilir: şubenin öğrencileri, onların velileri, ilgili öğretmen. Çevirim sırasında **bağlı hesabı olmayan kişiler sessizce atlanır** — hesabı olmayan kişiye bildirim üretilmez. Tenant kapsamı her sorguda açıkça uygulanır, yalnız genel filtreye güvenilmez.

3. **Fan-out ve mükerrer koruması** — Dağıtım motoru kayıtlı her kanal × her alıcı için döner. Her teslimden önce "bu olay bu alıcıya bu kanaldan gitti mi" diye bakılır; gitmediyse gönderilir ve kanal "ulaştı" derse teslim kaydı yazılır. Tekillik veritabanında da korunur.

   Garanti **en fazla bir kez**tir. İki bilinen pencere borç olarak işaretli: eşzamanlı gönderimlerde ön kontrol yarışabilir (tekil index yakalar) ve kanal gönderimi ile teslim kaydı arasında çökme olursa yeniden deneme mükerrer üretir. Uygulama içi kanal için bu düşük zarar sayılıp kabul edildi; kesin çözüm için giden-kutusu deseni planlanmış.

4. **Teslim — üç kanal** — Kayıt sırasıyla uygulama içi, push, e-posta. Uygulama içi önce kalıcı satırı yazar, sonra alıcının canlı bağlantısına anlık gönderir; push o satırın kimliğini okuduğu için sıra önemlidir. Push ve e-posta **yalnız kapsam listesindeki olaylarda** ve okulun anahtarları ile olay kararları açıksa gider; push ayrıca kişinin tercihine ve okulun sessiz saatine bakar. Sessiz saatte push ertelenir ve aralık bitince ayrı bir iş tarafından gönderilir. Kapıların ayrıntısı [[Bildirim Yapılandırması]]'nda.

5. **Okuma** — Kullanıcı kendi bildirimlerini listeler, okunmamış sayısını sorgular, tekil veya toplu okundu işaretler. Okundu idempotenttir; ilk okunma zamanı korunur.

6. **Kişisel tercih** — Hesap, kapsam listesindeki olaylar için push'u kendisi kapatır. Satır yoksa tercih açıktır; güncelleme kısmidir.

## Kapsam dışı

- **İçerik üretimi.** Başlık ve gövdeyi olayın sahibi modül yazar. Bu modül metin üretmez.
- **Öncelik.** Öncelik kavramı ve olay başına "sessiz saati deler" işareti yoktur; okulun sessiz saati açıksa kapsamdaki bütün push'lar ertelenir. Acil duyuru teslim davranışını değiştirmez, yalnız başlığa ön ek koyar.
- **E-posta için kişisel tercih.** Kişi yalnız push'u kapatabilir.
- **SMS teslimi.** Anahtarı ve kotası var, kanalı yok.
- **Toplu gönderim kısıtlaması (throttle).** Yok. Bu yüzden tek işlemde çok büyük kitleye giden olaylar (ders programı yayını, sınav penceresi yayını) bilinçli olarak push kapsamına alınmadı.

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- Bildirimlerin saklama süresi ve temizliği tanımlı değil.
- Teslim kaydı büyümeye devam ediyor; arşivleme veya budama planı görünmüyor.
