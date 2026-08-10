---
aliases: [Notifications, api/v1/notifications, Bildirim Dağıtımı]
tags: [domain/messaging, module]
status: completed
last-synced: 2026-08-10 (2270867)
---

# Bildirimler

<!-- generated:start -->

## Ne yapar

Sistemde olan biteni ilgili kişiye ulaştıran modül. Duyuru yayınlanınca, nöbet çizelgesi çıkınca, çocuk derse gelmeyince, devamsızlık eşiğe yaklaşınca bildirim buradan gider.

Modül **kendi başına bir şey söylemez** — yalnız taşır. İçeriği üreten, olayın sahibi modüldür; buranın işi doğru alıcıyı bulmak, mükerrer göndermemek ve teslim etmektir.

Haritadaki yeri şu yüzden özel: haritalanmış neredeyse her modülün çıkış ucu buraya bağlanır. Bir bildirimin neden gitmediğini araştırırken zincir hep buradan geçer.

## Kullandığı kavramlar

- [[Bildirim]] — modülün ana kaydı; zil menüsündeki kalıcı satır
- [[Bildirim Türü]] — bildirimin ne olduğunu söyleyen kod *(kodda üç ayrı temsili var)*
- [[Hesap]] — alıcı bir hesaptır, kişi değil
- [[Bildirim Yapılandırması]] — okulun kanal tercihleri *(bugün teslimatı etkilemiyor)*

## Ana akışlar

1. **Olay yakalama** — Bir modül işini bitirir ve olay yayınlar. O modülün kendi bildirim işleyicisi olayı karşılar, içeriği (başlık, gövde, derin bağlantı) **kendi** üretir ve dağıtıma verir. Metin üretimi bu modülün işi değildir.

2. **Alıcı çözümleme** — Kapsam kişi kimliklerinden hesap kimliklerine çevrilir: şubenin öğrencileri, onların velileri, ilgili öğretmen. Çevirim sırasında **bağlı hesabı olmayan kişiler sessizce atlanır** — hesabı olmayan kişiye bildirim üretilmez. Tenant kapsamı her sorguda açıkça uygulanır, yalnız genel filtreye güvenilmez.

3. **Fan-out ve mükerrer koruması** — Dağıtım motoru kayıtlı her kanal × her alıcı için döner. Her teslimden önce "bu olay bu alıcıya bu kanaldan gitti mi" diye bakılır; gitmediyse gönderilir ve teslim kaydı yazılır. Tekillik veritabanında da korunur.

   Garanti **en fazla bir kez**tir. İki bilinen pencere borç olarak işaretli: eşzamanlı gönderimlerde ön kontrol yarışabilir (tekil index yakalar) ve kanal gönderimi ile teslim kaydı arasında çökme olursa yeniden deneme mükerrer üretir. Kesin çözüm için giden-kutusu deseni planlanmış.

4. **Teslim — tek kanal** — Bugün kayıtlı tek kanal uygulama içi bildirimdir: önce kalıcı satır yazılır, sonra alıcının canlı bağlantısına anlık gönderim yapılır. E-posta, SMS ve push kanallarının **uygulaması yoktur**.

5. **Okuma** — Kullanıcı kendi bildirimlerini listeler, okunmamış sayısını sorgular, tekil veya toplu okundu işaretler. Okundu idempotenttir; ilk okunma zamanı korunur.

## Kapsam dışı

- **İçerik üretimi.** Başlık ve gövdeyi olayın sahibi modül yazar. Bu modül metin üretmez.
- **Sessiz saat ve öncelik.** Bu depoda öncelik kavramı yoktur ve hiçbir bildirim gönderilirken sessiz saate bakılmaz. Acil duyuru bile teslim davranışını değiştirmez — yalnız başlığa ön ek koyar.
- **Kullanıcı bazlı tercih.** Ayarlar okul düzeyindedir; kişinin "bana e-posta gönderme" diyebileceği bir yer yok.

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- **Bildirim ayarlarının teslimata hiçbir etkisi yok.** Olay×kanal matrisi de, kanal anahtarları da, ana kapama anahtarı da dağıtım motorunda hiç okunmuyor. Yönetici üç kanallı bir matris dolduruyor ama kayıtlı tek kanal in-app; matris kapatılsa bile bildirim gidiyor.
- Dağıtım master kataloğunun tüketicisi yok; fiilen kullanılan üçüncü bir enum var (bkz. [[Bildirim Türü]]).
- Bildirimlerin saklama süresi ve temizliği tanımlı değil.
- Teslim kaydı büyümeye devam ediyor; arşivleme veya budama planı görünmüyor.
