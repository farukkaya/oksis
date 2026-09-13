---
aliases: [NotificationConfig, NotificationRuleConfig, NotificationPreference, Bildirim Ayarları, Sessiz Saat]
tags: [domain/platform]
table: school.notification_rule_configs
status: active
last-synced: 2026-09-13 (294ffe6)
---

# Bildirim Yapılandırması

<!-- generated:start -->

## Nedir

Okulun bildirim tercihlerini tutan ayar: hangi kanallar açık (push, e-posta, SMS) ve hangi olay hangi kanaldan gidiyor.

İki okul katmanı ve bir kişi katmanı vardır. **Kanal anahtarları** okul genelinde kabaca açar/kapatır ve **sessiz saati** taşır; ana kapama anahtarı "en az bir kanal açık mı" sorusundan türetilir, kullanıcı doğrudan onu yönetmez. **Kural matrisi** olay bazında incelik sağlar ve [[Bildirim Türü]]'nün ayarlar kataloğundan beslenir. **Kişisel tercih**, bir hesabın tek tek olaylar için push'u kendisi kapatmasıdır.

Kural matrisi okul açılışında varsayılanlarla üretilir. Kanal anahtarlarının tutulduğu satır ise okul ayarı ilk kez kaydedilene kadar yoktur; o süre boyunca push ve e-posta kapalı, uygulama içi açık sayılır.

## Teslimata etkisi

Ayarlar gönderim anında okunur (TB-43). Her kanal kendi kapılarını ucuzdan pahalıya doğru sırayla uygular:

- **Uygulama içi:** okulun ana anahtarı, ardından olayın portal kararı. Kapsam listesinde olmayan olayda bu kapılar uygulanmaz: matriste satırı olmayan bir olayı sessizce düşürmek, ekranda hiç görünmeyen bir sebeple bildirim kaybetmek olurdu.
- **Push:** kapsam listesi → okulun push anahtarı → olayın push kararı → kişinin tercihi → sessiz saat → cihaz.
- **E-posta:** kapsam listesi → okulun e-posta anahtarı → olayın e-posta kararı → alıcının birincil e-posta adresi. Sessiz saat kapısı bilinçli olarak yoktur (gece gelen e-posta telefonu titretmez). Kişisel tercih kapısı da yoktur, çünkü tercih bugün yalnız push'u taşır.
- **SMS:** anahtarı ve kotası tutulur ama kanal yoktur; SMS'i açmak hiçbir gönderim üretmez.

**Olay kuralı satırı yoksa olay kapalı sayılmaz**, katalog varsayılanına düşülür. Ayar ekranı da aynı varsayılanı gösterir; aksi hâlde yönetici ekranda açık gördüğü bir olayın hiç gitmediğini fark edemezdi (TB-24). **Kapsam listesi push ve e-posta için ortaktır:** listede olmayan olay (duyurular, devamsızlık eşiği gibi) matriste e-postası açık görünse bile e-posta üretmez.

## Sessiz saat

Okulun saat diliminde bir başlangıç–bitiş aralığıdır ve **yalnız push'u** etkiler. Aralığa düşen push, aralık bitince gönderilmek üzere ertelenir; uygulama içi satır anında yazılır. **Varsayılan olarak kapalıdır.** Aralık gece yarısını aşabilir. Ayar bozuksa (sınırlardan biri boşsa ya da ikisi eşitse) hiçbir şey ertelenmez; şüphede her şeyi ertelemek, yanlış yapılandırılmış bir okulun bütün bildirimlerini sessizce geciktirirdi. Ertelenen gönderimde cihazlar gönderim anında yeniden aranır, çünkü arada çıkış yapılmış olabilir. Kapılar ise yeniden okunmaz: gece yapılan bir ayar değişikliği geçmişe uygulanmaz. Öncelik kavramı ve olay başına "sessiz saati deler" işareti yoktur — ilke için [[0012-bildirim-ilkeleri]].

## Kişisel tercih

Bir hesap, kapsam listesindeki her olay için push'u kendisi kapatabilir. **Satır yoksa tercih açıktır:** varsayılanı kapalı saymak yeni eklenen bir olayda kimsenin bildirim almaması demekti; her hesaba baştan satır üretmek ise ölü satır biriktirirdi. Tercih yalnız kapsam listesindeki olaylar için yazılabilir, böylece hiçbir şeye bağlı olmayan bir düğme üretilmez. Güncelleme kısmidir: gövdede geçmeyen olayların tercihi korunur, kullanıcının kapattığı bir bildirim sessizce yeniden açılmaz.

## Kurallar

- Ana anahtar elle yönetilmez; kanal tercihlerinden türetilir.
- SMS'in uygulanamadığı bir olayda SMS varsayılanı açık bırakılamaz.
- SMS kanalı ayrıca bir kota ile sınırlıdır ve kota ayrı sorgulanır.
- Devamsızlık eşikleri burada tutulmaz; tek sahibi akademik politikadır. Eskiden burada da eşik alanları vardı ama hiçbir tüketicileri yoktu, bu yüzden kaldırıldılar (TB-35).

## İlişkiler

- [[Okul Ayarları]] — aynı ayar yüzeyinde yönetilir, ayrı kayıttır
- [[Bildirim Türü]] — kural matrisi ayarlar kataloğundan beslenir
- [[Devamsızlık Özeti]] — devamsızlık eşik uyarısının eşikleri **burada değil**, okul ayarlarındaki akademik politikadadır
- [[Hesap]] — kişisel push tercihinin sahibi

## Geçtiği modüller

- [[Okul Yönetimi]] — kavramın sahibi; kanal ve kural yönetimi
- [[Bildirimler]] — ayarları gönderim anında okur; kişisel tercih de bu modülün ucundan yazılır

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- Kural matrisi okul açılışında üretiliyor ama kanal anahtarları ile sessiz saat satırı, yönetici ayarı ilk kez kaydedene kadar yok. O süre boyunca push ve e-posta kapalı sayılıyor, yani yeni açılan okul hiç push almıyor. Bu asimetri bilinçli mi? (2026-09-13)
- İlke olarak sessiz saat varsayılan olarak geçerli sayılıyor ([[0012-bildirim-ilkeleri]]), ama kodda varsayılanı kapalı. Varsayılan açılacak mı? (2026-09-13)
- Sessiz saatin bitiş anı, şu anki saat farkı sabit kalacak varsayımıyla hesaplanıyor. Türkiye sabit UTC+3 olduğu için bugün bir etkisi yok; yaz saati uygulayan bir saat dilimi eklenirse saatin değiştiği gece erteleme bir saat kayar. (2026-09-13)
