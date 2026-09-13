---
aliases: [Schools, api/v1/school-settings, Okul Ayarları Modülü]
tags: [domain/platform, module]
status: completed
last-synced: 2026-09-13 (294ffe6)
---

# Okul Yönetimi

<!-- generated:start -->

## Ne yapar

Okulun kendisini ve okulun kendi kurallarını yöneten modül. Kurum kimliği, iletişim, logo ve favicon, akademik yapı ve politika, günlük zaman düzeni, tatil takvimi, hangi modüllerin açık olduğu ve bildirim tercihleri buradan ayarlanır.

Modülün haritadaki yeri özeldir: **diğer modüllerin davranışı buradan besleniyor.** Devamsızlık eşiği, yoklama düzeltme penceresi, nöbet politikası, duyuru moderasyonu, şube açarken onay istenip istenmemesi — hepsi burada tutulan birer ayar. Bir modülün "neden böyle davrandı" sorusuna cevap ararken ilk bakılacak yer burasıdır.

## Kullandığı kavramlar

- [[Okul]] — tenant'ın kendisi; yaşam döngüsü ve plan
- [[Okul Ayarları]] — kurum bilgisi ve politikaların tamamı
- [[Modül Yapılandırması]] — hangi modül açık, plan neyi kilitliyor
- [[Bildirim Yapılandırması]] — kanal tercihleri ve kural matrisi
- [[Zil Çizelgesi]] — günlük zaman düzeni ve gün-şablon ataması
- [[Okul Tatili]] — okul takvimi
- [[Resmî Tatil]] — platform listesi; okul değiştiremez, takvimde birlikte görünür
- [[Sınıf Seviyesi]] — okulun fiilen çalıştığı kademeler ve ölçek override'ları

## Ana akışlar

1. **Okul yaşam döngüsü** — Okul kurulum durumunda doğar, sihirbaz bitince aktifleşir; lisans sorununda gerekçeli olarak askıya alınır, kapanışta arşivlenir. Arşiv terminaldir.

2. **Kurulum sihirbazı** — Okul oluşturulduğunda altı adımlık durum kaydı otomatik açılır ve yönetici yarıda bıraktığı yerden devam eder. Tamamlanmış adım geri alınmaz. Aynı olayla varsayılan ayarlar, depolama alanı, modül yapılandırması, bildirim kuralları ve okul türünden türetilen kademeler de üretilir.

3. **Kurum kimliği ve iletişim** — Resmî ad, MEB kodu, mülkiyet türü, kuruluş yılı, iletişim ve adres ayrı ayrı güncellenir; her biri kendi iznine bağlıdır. Kurum yetkilisini yalnız süper admin düzenler.

4. **Logo ve favicon** — Favicon tema kaydında; logo yönetilen bir dosya olarak yüklenir ve silinir. Marka renkleri 2026-06-24'te kaldırıldı (K2). Giriş öncesi ekranlar (davet önizlemesi gibi) için anonim bir marka ucu vardır ve yalnız okul adı ile logoyu verir.

5. **Akademik yapı** — Okulun çalıştığı türler, eğitim dili, haftalık ders günleri, öğrenci numarası biçimi. Öğrenci numarası ön eki değiştirilirken idareciden onay alınır ve onay değişmez bir kanıt satırı olarak yazılır.

6. **Sunulan kademeler** — Okulun fiilen çalıştığı sınıf kademeleri işaretlenir; okul oluşurken türden türetilir, sonra serbestçe değişir. Liste görevlendirmenin ders havuzunda ve sezon geçişinde okunur; **şube açmada sunucu bu listeye bakmaz**. **En az bir kademe açık kalmalıdır**. Kademe bazında not ölçeği override'ı verilebilir.

7. **Akademik politika** — Not ölçeği, geçme notu, yuvarlama, sınav sayıları ve ağırlıkları, devamsızlık sınırları, teşekkür/takdir eşikleri. Eşikler sıralı değişmezlerle korunur ve geçme notu seçili ölçeğin aralığında olmalıdır (bkz. [[Okul Ayarları]]). Politika sezondan bağımsız tek kayıttır. Değişiklik olay yayınlar.

8. **Zil düzeni** — Ders saatleri, teneffüsler ve aralar tanımlanır; tekil veya toplu kurulabilir. Ayrıca haftanın her günü bir şablona bağlanır (tam gün / yarım gün) ve şablonsuz gün **kapalı** demektir.

9. **Tatil takvimi** — Okul yalnız **okul etkinliği** ve **eğitime kapalı gün** yönetir; resmî tatil, yarıyıl ve ara tatil kilitlidir. Kayıt varsa aktif sezona bağlanır. Sezon geçişinde okul günleri bir yıl kaydırılarak yeni sezona kopyalanabilir.

10. **Modül ve bildirim ayarları** — Modüller tek tek açılıp kapatılır: çekirdek modüller kapatılamaz, plan dışı modül açılamaz, kapatma her zaman serbesttir. Plan durumu ayrıca sorgulanır. Bildirim kanalları ve kural matrisi ayarlanır; SMS kotası ayrı okunur.

**Yetki:** Okuma `school-settings.view`. Yazma alan bazında ayrılmıştır — `update-basic`, `update-contact`, `update-address`, `manage-authority`, `update-theme`, `upload-logo`, `update-academic-structure`, `update-academic-policy`, `manage-bell`, `manage-holidays`, `manage-modules`, `manage-notifications`. Bu ayrıştırma bilinçlidir: kurum yetkilisi bilgisi ile logo aynı yetkiyle değişmemeli.

## Kapsam dışı

- **Okul oluşturma ve askıya alma uçları.** Domain davranışları burada ama süper admin yüzeyi bu taramada görünmedi.
- **Abonelik sağlayıcısı entegrasyonu.** Plan ve yenileme tarihi bugün elle yönetiliyor.
- **Bildirimin gönderilmesi.** Burada yalnız tercih ve olay × kanal kural matrisi tutulur; üretim ve gönderim [[Bildirimler]]'in işidir — kanallar teslimat anında bu matrisi okur.
- **Kademeye göre farklı zil düzeni.** Zil çizelgesi okul geneldir.
- **Resmî tatil listesinin okulca değiştirilmesi.** Millî ve dini bayramlar platform listesindedir; okul yalnız kendi günlerini ekler.
- **Okul türünün kademeleri sınırlaması.** Tür yalnız ilk kademe listesini üretir; sonrasında listeyi kısıtlamaz.

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- (Şu an açık soru yok.)
