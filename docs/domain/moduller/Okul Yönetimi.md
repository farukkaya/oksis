---
aliases: [Schools, api/v1/school-settings, Okul Ayarları Modülü]
tags: [domain/platform, module]
status: completed
last-synced: 2026-08-10 (2270867)
---

# Okul Yönetimi

<!-- generated:start -->

## Ne yapar

Okulun kendisini ve okulun kendi kurallarını yöneten modül. Kurum kimliği, iletişim, marka teması, akademik yapı ve politika, günlük zaman düzeni, tatil takvimi, hangi modüllerin açık olduğu ve bildirim tercihleri buradan ayarlanır.

Modülün haritadaki yeri özeldir: **diğer modüllerin davranışı buradan besleniyor.** Devamsızlık eşiği, yoklama düzeltme penceresi, nöbet politikası, duyuru moderasyonu, şube açarken onay istenip istenmemesi — hepsi burada tutulan birer ayar. Bir modülün "neden böyle davrandı" sorusuna cevap ararken ilk bakılacak yer burasıdır.

## Kullandığı kavramlar

- [[Okul]] — tenant'ın kendisi; yaşam döngüsü ve plan
- [[Okul Ayarları]] — kurum bilgisi ve politikaların tamamı
- [[Modül Yapılandırması]] — hangi modül açık, plan neyi kilitliyor
- [[Bildirim Yapılandırması]] — kanal tercihleri ve kural matrisi
- [[Zil Çizelgesi]] — günlük zaman düzeni ve gün-şablon ataması
- [[Okul Tatili]] — okul takvimi
- [[Sınıf Seviyesi]] — okulun fiilen çalıştığı kademeler ve ölçek override'ları

## Ana akışlar

1. **Okul yaşam döngüsü** — Okul kurulum durumunda doğar, sihirbaz bitince aktifleşir; lisans sorununda gerekçeli olarak askıya alınır, kapanışta arşivlenir. Arşiv terminaldir.

2. **Kurulum sihirbazı** — Okul oluşturulduğunda altı adımlık durum kaydı otomatik açılır ve yönetici yarıda bıraktığı yerden devam eder. Tamamlanmış adım geri alınmaz.

3. **Kurum kimliği ve iletişim** — Resmî ad, MEB kodu, mülkiyet türü, kuruluş yılı, iletişim ve adres ayrı ayrı güncellenir; her biri kendi iznine bağlıdır. Kurum yetkilisini yalnız süper admin düzenler.

4. **Marka teması ve logo** — Renkler ve favicon tema kaydında; logo ise yönetilen bir dosya olarak yüklenir ve silinir. Public bir logo ucu vardır — giriş öncesi ekranlar (davet önizlemesi gibi) buradan besleneceği için anonim erişime açıktır.

5. **Akademik yapı** — Okulun çalıştığı türler, eğitim dili, haftalık ders günleri, öğrenci numarası biçimi. Öğrenci numarası ön eki değiştirilirken idareciden onay alınır ve onay değişmez bir kanıt satırı olarak yazılır.

6. **Sunulan kademeler** — Okulun fiilen çalıştığı sınıf kademeleri işaretlenir. Bu liste şube açmada ve ders kademesi gösteriminde filtre olarak uygulanır; **en az bir kademe açık kalmalıdır**. Kademe bazında not ölçeği override'ı verilebilir.

7. **Akademik politika** — Not ölçeği, geçme notu, yuvarlama, sınav sayıları ve ağırlıkları, devamsızlık sınırları, teşekkür/takdir eşikleri. Değişiklik olay yayınlar.

8. **Zil düzeni** — Ders saatleri, teneffüsler ve aralar tanımlanır; tekil veya toplu kurulabilir. Ayrıca haftanın her günü bir şablona bağlanır (tam gün / yarım gün) ve şablonsuz gün **kapalı** demektir.

9. **Tatil takvimi** — Okulun tatil günleri tanımlanır; resmî, etkinlik veya eğitime kapalı gün olabilir, tekrarlı işaretlenebilir ve varsa aktif sezona bağlanır.

10. **Modül ve bildirim ayarları** — Modüller tek tek açılıp kapatılır (çekirdek olanlar hariç), plan durumu ayrıca sorgulanır. Bildirim kanalları ve kural matrisi ayarlanır; SMS kotası ayrı okunur.

**Yetki:** Okuma `school-settings.view`. Yazma alan bazında ayrılmıştır — `update-basic`, `update-contact`, `update-address`, `manage-authority`, `update-theme`, `upload-logo`, `update-academic-structure`, `update-academic-policy`, `manage-bell`, `manage-holidays`, `manage-modules`, `manage-notifications`. Bu ayrıştırma bilinçlidir: kurum yetkilisi bilgisi ile marka rengi aynı yetkiyle değişmemeli.

## Kapsam dışı

- **Okul oluşturma ve askıya alma uçları.** Domain davranışları burada ama süper admin yüzeyi bu taramada görünmedi.
- **Abonelik sağlayıcısı entegrasyonu.** Plan ve yenileme tarihi bugün elle yönetiliyor.
- **Bildirimin gönderilmesi.** Burada yalnız tercih tutulur; üretim ve gönderim [[Bildirimler]]'in işidir — ama o modül bugün bu tercihleri **okumuyor**.

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- **Devamsızlık eşiği iki ayrı ekranda tanımlanıyor.** Bildirim yapılandırmasındaki eşik alanlarının hiçbir tüketicisi yok; motor akademik politikadaki alanları okuyor. Hangisi kalmalı?
- **İki zaman dilimi alanı var:** okul kaydında IANA, ayarlarda Windows biçimi. Hangisi yetkili?
- Tatil tarafında iki ayrı sınıf duruyor; biri hiç bağlanmamış (bkz. [[Okul Tatili]]).
- Modül kapatmanın sunucu tarafında gerçekten kapı ürettiği doğrulanamadı.
