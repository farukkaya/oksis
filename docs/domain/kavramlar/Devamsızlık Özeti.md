---
aliases: [AbsenceSummary, AbsenceCarryOver, Devamsızlık Toplamı, Devreden Devamsızlık]
tags: [domain/academic]
table: academic.absence_summaries
status: active
last-synced: 2026-08-10 (2270867)
---

# Devamsızlık Özeti

<!-- generated:start -->

## Nedir

Bir öğrencinin bir [[Dönem]]'deki devamsızlık toplamlarını tutan **projeksiyon**. Ham kayıtlar [[Yoklama Oturumu]]'nda yaşar; burada onların dönem düzeyindeki özeti durur: kaç yok, kaç geç, kaç izinli, kaç raporlu.

MEB bağlamında bu satır kritik bir eşiğe bakar — **özürsüz devamsızlık sınırı**. Sınıf tekrarı bu sayıya bağlı olduğu için hesabın nasıl yapıldığı domainin en hassas kurallarından biridir.

## Gün eşdeğerliği — hesabın çekirdeği

Devamsızlık ders saati olarak değil **gün** olarak sayılır ve dönüşüm şöyledir:

- Günün **tüm** dersleri "yok" ise → 1 gün.
- "Yok" oranı okul eşiğine eşit veya üzerinde ama %100'den az ise → yarım gün.
- Eşiğin altındaysa → o gün toplama hiç katkı yapmaz. *(Ham sayaçlar ayrıca ve bağımsız tutulur.)*

Buna **geç kalma birikimi** eklenir: her N geç kayıt yarım güne dönüşür, tamamlanmamış grup sayılmaz. Birikim eşiği sıfırsa özellik tamamen kapalıdır.

Toplam = gün eşdeğeri + geç birikimi + devreden devamsızlık.

Bu hesap saf matematiktir; veritabanına, kiracıya veya kimliğe hiç dokunmaz. Okul ayarlarını okumak, kayıtları çekmek ve bildirim kuyruğa almak ayrı bir katmanın işidir — ayrım bilinçli.

## Devreden devamsızlık

Nakil gelen öğrencinin önceki okulundaki devamsızlığı ayrı bir kayıt olarak girilir ve toplama **dönemin başlangıç değeri** gibi eklenir. Ayrı kavram notu yoktur.

Önemli ayrıntı: devreden sayılar dönemin kendi sayaçlarına **karıştırılmaz**, ayrı tutulur. Devreden geç kayıtları yine de aynı geç birikimine katılır; devreden devamsızlık ise zaten gün cinsinden olduğu için doğrudan eklenir, yüzde hesabından geçmez.

## Yaşam döngüsü

Kendi durumu yoktur. Yeniden hesaplandığında **tamamen değiştirilir** — artımlı güncelleme yapılmaz. Bu, kayıt düzeltmeleri ve mazeret onayları sonrası tutarlılığı garanti eder.

## Eşik uyarısı

Öğrenci uyarı ya da sınır seviyesine geldiğinde bildirim üretilir. Seviye kararı `>=` mantığıyla verilir: tam sınırda yüksek seviye kazanır.

Kararın kendisi bu kayıtta verilmez — çağıran katman "bildirim gönderilmeli" kararıyla gelir, kayıt yalnız damgayı vurur ve olayı taşır. Mükerrer bildirimi önlemek iki katmanlıdır: hızlı bir önbellek kapısı ve onun arkasında bu kayıttaki kalıcı damga. İkincisi olmadan önbellek kesintisinde "hangi seviyede bildirildi" bilgisi kaybolur ve bir üst seviyeye tırmanma yanlışlıkla bastırılırdı.

## Kurallar

- Sayaçların hiçbiri negatif olamaz.
- Devreden sayılar dönemin kendi sayaçlarına toplanmaz.
- Yeniden hesaplama tam değiştirmedir.
- Eşik damgası, seviyesiyle **birlikte** yazılır; ikisi ayrı düşerse tırmanma mantığı bozulur.

## İlişkiler

- [[Yoklama Oturumu]] — ham kayıtların kaynağı
- [[Mazeret]] — onay toplamları değiştirir
- [[Dönem]] — özet dönem başınadır
- [[Kişi]] — özetin öznesi öğrenci
- [[Okul Ayarları]] — eşikler, gün-eşdeğerliği yüzdesi ve geç birikimi parametreleri buradan okunur

## Geçtiği modüller

- [[Yoklama ve Devamsızlık]] — kavramın sahibi; hesap, eşik uyarısı, raporlar ve risk listesi

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- Eşik bildirimi önbellek kesintisinde **açık kalacak şekilde** (fail-open) davranıyor; kesinti anında mükerrer uyarı gidebilir. Kabul edilmiş risk mi, yoksa kapalı kalması mı gerekir?
- Gün eşdeğerliği hesabı yalnız "yok" kayıtlarına bakıyor. Yarım gün eşiği için izinli/raporlu saatler paydadan düşmeli mi?
- Devreden devamsızlık dönem başına giriliyor. Öğrenci yıl ortasında ikinci kez nakil olursa ikinci bir devreden kayıt açılıyor mu, üzerine mi yazılıyor?
