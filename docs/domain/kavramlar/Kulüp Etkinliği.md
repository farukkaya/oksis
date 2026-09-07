---
aliases: [ClubActivity, Etkinlik, Kulüp Faaliyeti]
tags: [domain/clubs]
table: school.club_activities
status: active
last-synced: 2026-09-02 (f5d6777)
---

# Kulüp Etkinliği

<!-- generated:start -->

## Nedir

Bir kulübün düzenlediği tek faaliyet — atölye, gezi, turnuva. **Saati vardır**: ödevden ayrıldığı nokta budur; tarih + başlangıç/bitiş saati okulun saat dilimiyle birleştirilip zaman damgası olarak saklanır. Kulübün çocuğu değil, kendi köküdür; kulübe yalnız kimlikle bağlanır ve **sezon kolonu taşımaz** — sezonunu kulüp üzerinden alır.

Adı bilinçli olarak "etkinlik"tir, "olay" değil: bu depoda `…Event` soneki domain olayı demektir.

**[[Etkinlik Yoklaması]] ile karıştırılmamalı.** O, gezi ve törenin güvenlik sayımıdır ("otobüste 42 kişi var mı"), katılım zorunludur ve devamsızlığa girmez. Kulüp etkinliği "kim katıldı" sorusunu tek satırla cevaplar ve katılım gönüllüdür. İkisi ayrı kalır; ders saatiyle çakışan kulüp etkinliğinin devamsızlık köprüsü MVP dışıdır — saatin tutulması o köprüyü ileride mümkün kılar.

## Yaşam döngüsü

```
  (yeni) ──► Draft ──(:publish)──► Published ──(gece işi, bitiş geçti)──► Completed
                                       └──────(:cancel, gerekçe)────────► Cancelled
```

- **Draft** — danışman ve idare görür; öğrencinin uçlarında çıkmaz, detayı 404. Yayın ayrı bir jesttir. Taslak silme ucu bugün yoktur.
- **Published** — öğrencilerin ekranında görünür, kayıt açıktır. Yayın yalnız taslaktan çalışır; zaten yayındaki satırda ikinci çağrı sessiz dönmez, hata verir — ikinci yayın ikinci bildirim demek olurdu.
- **Cancelled** — terminal. Gerekçe zorunludur, kolonda saklanır ve bildirimle taşınır. Katılım satırları korunur ("kim kayıtlıydı" görünsün diye). Taslak iptal edilemez.
- **Completed** — terminal ama **etikettir, kilit değil**. Bitiş anı geçmiş yayındaki etkinlikleri her gece 23:00'te (Europe/Istanbul) bir zamanlanmış iş bu hâle çeker; okul okul, seri ve idempotent. Öğretmen ertesi gün de yoklama işaretleyebilir; kilit koymak onu bir "yeniden aç" ucuna muhtaç ederdi.

İki terminal hâlden de çıkış yoktur: iptal edilmiş etkinliği yeniden yayınlamak ya da tamamlanmışı yayına almak geçmişin ekranda değişmesidir.

## Kurallar

- **Doğum durumu daima taslaktır** (kulübün danışmandan türeyen doğum durumundan farklı): danışmanın gözden geçirme fırsatı "taslak, sonra yayın" iki adımıyla çözülür. Oluşturma olayı yayılmaz — taslak kimseye ulaşmaz.
- **Başlangıç geçmişte olamaz, bugün olabilir** (gün içi akşam etkinliği); karşılaştırma tam anla yapılır, gün değil. Bitiş başlangıçtan sonra olmalıdır; aynı gün serbesttir.
- **Kayıt yalnız yayındaki etkinliğe** alınır; kapı domain'dedir, handler'a emanet edilmez.
- **Katılımcı sayacı denormalizedir, tek yazarı etkinliğin metotlarıdır** ve yalnız **kontenjan tutan** satırları sayar: kayıtlı, geldi ve gelmedi tutar; geri çekilmiş tutmaz. Kontenjan kapısı burada durur; sürüm damgası kontenjan yarışının birinci savunmasıdır, tekil indeks üçüncüsü. Azaltmada durum kontrolü yoktur (iptal edilmiş etkinliğin kaydını yönetici temizleyebilmeli); eksiye düşme istisnadır.
- **Sayaç bağı ile katılım satırı iki ayrı aggregate'tir, tek işlemde yazılır**: önce sayaç kapısı (etkinlik), sonra satır (katılım). Bkz. [[Etkinlik Katılımı]].
- **Yayın anında toplu katılım satırı doğmaz.** 24 üyeli kulübün 3 kişilik atölyesinde 21 anlamsız satır üretirdi. Roster (yoklama listesi) ilk açıldığında kulübün üye listesinden "kayıtlı" varsayılanıyla **türetilir**, fiziksel satır açılmaz.
- **Roster kaydı delta davranışlıdır:** gövdedeki her satırın hâli yazılır, gövdede olmayan satırlara dokunulmaz. Tamamlanmış ve iptal edilmiş etkinlikte de roster yazılabilir.
- **Kontenjan:** boş = sınırsız; sıfır ve negatif reddedilir. Türetilmiş "dolu mu" değeri kolon değildir ve sorgu içinde kullanılamaz — kod derlenir, ilk gerçek çağrıda 500 verir.
- **Öğrencinin kapsamı üyelikten gelir, kimlikten değil.** Yalnız üyesi olduğu (aktif ya da duraklatılmış) kulübün yayındaki etkinliğini görür; bekleyen başvuru üye sayılmaz; üye olmayanın kayıt denemesi 404'tür ("bu etkinlik senin için yok"). Öğrencinin yaklaşan listesi yalnız yayında + başlangıcı okul saatine göre gelecekte olanları döner; geçmiş etkinlik listesi MVP'de öğrenciye yoktur.
- **Bildirim:** yayın **üyelere (aktif + duraklatılmış) ve velilerine** gider — etkinlik okul saatleri dışına taşabilir, ücret veya ulaşım gerektirebilir. İptal **yalnız kayıtlı katılımcılara ve velilerine** gider; gerekçe olduğu gibi taşınır. Etkinlik ya da kulüp okunamıyorsa bildirim sessizce düşer. Tamamlanma olayı yayılır ama tüketicisi yoktur (bilinçli).
- İptal gerekçesinin uzunluk sınırı (15–500) doğrulayıcıdadır; domain yalnız boşu reddeder, üstünü kırpar — iş sınırı değişse domain kalır.

## İlişkiler

- [[Kulüp]] — sahibi; sezon süzgeci kulüp birleşiminden gelir
- [[Etkinlik Katılımı]] — etkinlik × öğrenci; ayrı kök, sayaç bağı buradan
- [[Kulüp Üyeliği]] — öğrencinin görme ve kaydolma kapsamı üyelikten türer
- [[Kişi]] — iptal eden danışman/idare; yalnız kimlik
- [[Okul]] — saat dilimi (tarih/saat çevirimi) ve "okulun bugünü" (yaklaşan/geçmiş süzgeci)
- [[Bildirim]] — yayın ve iptal olayları; alıcı kümeleri farklıdır
- [[Etkinlik Yoklaması]] — komşu kavram, **aynı şey değil**

## Geçtiği modüller

- [[Kulüpler]] — oluşturma, yayın, iptal, roster, öğrencinin yaklaşan listesi, geçmiş sayaçları, gece tamamlama işi

<!-- generated:end -->

## Notlar

<El yazısı alan. Senkron buraya dokunmaz.>

## Açık Sorular

- Öğrenci ve veli detayındaki `activityCount` "kulübün yaklaşan etkinliği" olarak seçildi, "öğrencinin katıldığı" değil. Sözleşme belirtmiyor; ekranın hangi anlamı istediği kararlaştırılmadı, tek satırla değişir.
- Saat dilimi iki yerden okunuyor: okul takvimi servisi yalnız "okulun şu anı"nı veriyor, etkinlik oluşturma ise okulun saat dilimini doğrudan veritabanından okuyor. İkisi bir gün ayrışabilir; ortak okuyucu ikinci ihtiyaçla birlikte doğacak.
- Roster kaydının delta davranışı sözleşmede "tam liste" diye yazıyor; ekranın tam liste mi delta mı gönderdiği ölçülmedi. Yanlış varsayım "gözden kaybolan yoklama"ya dönüşebilir.
- Etkinlik ve katılım tablolarının migration'ı hiç koşmadı; entegrasyon testleri şemayı modelden kuruyor. Faz 3'ün 13 entegrasyon iddiası Docker'lı ortamda henüz ölçülmedi.
- Gece işinin iki-okul idempotency iddiası yalnız mock ile ölçüldü; gerçek SQL'de tenant filtresinin turları ayırdığını gösteren test yok.
