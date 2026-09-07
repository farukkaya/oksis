---
aliases: [ClubAnnouncement]
tags: [domain/clubs, domain/messaging]
table: school.club_announcements
status: active
last-synced: 2026-09-02 (f5d6777)
---

# Kulüp Duyurusu

<!-- generated:start -->

## Nedir

Danışmanın (ya da idarenin) kulüp üyelerine kısa haberi — toplantı yeri, malzeme listesi, sıra. [[Duyuru]]'nun **kardeşidir ama bir örneği değildir**: ayrı tablo, ayrı olay, ayrı kurallar. Kulübün çocuğu değil kendi köküdür; kulübe yalnız kimlikle bağlanır ve sezon kolonu taşımaz.

| | [[Duyuru]] | Kulüp Duyurusu |
|---|---|---|
| Hedefleme | katman katman (okul, rol, kademe, şube, kişi) | yalnız kulübün üyeleri |
| Durum makinesi | taslak, zamanlama, onay, geri çekme, süre dolumu | **yok** — tek adım yayın |
| Moderasyon | eşikli | yok |
| Şablon, ek dosya, acil işareti | var | yok |
| Silinebilir mi | hayır (geri çekilir) | hayır (geri çekilemez de) |
| Bildirim alıcısı | alıcı listesi | üyeler; **veliye gitmez** |

Kurumsal duyuru modülünü genişletmek (hedef boyutu olarak "kulüp" eklemek) değerlendirilip reddedildi: kulüp içi haber moderasyondan geçmez, geri çekilmez, şablonu yoktur.

## Yaşam döngüsü

Yoktur. Fabrika satırı doğrudan yayınlanmış hâlde açar; taslak, zamanlama, düzenleme, geri çekme ve silme yoktur. Bu yüzden durum alanı da yoktur; yayın anı zorunludur ve listenin sıralama alanıdır (yeniden eskiye).

## Kurallar

- **Silinmez.** Soft delete alanlarını taşımaz; silinebilen duyuru hiç yayınlanmamış duyuruyla aynı şeydir. Yanlış yazılan duyurunun düzeltme yolu **yeni bir duyurudur**.
- **İmza yayın anında donar.** Yayınlayanın görünen adı satıra yazılır; öğretmen okuldan ayrılsa ya da adı değişse bile imza tarihsel kalır. Yayınlayan gövdeden alınmaz, çağırandan çözülür — imza sahtelenemez. İmza zorunludur; imzasız satır arşivde "kim yayınladı" sorusunu cevapsız bırakırdı.
- **Başlık ve içerik boş olamaz ve kırpılmaz, reddedilir** (etkinlikten bilinçli sapma): kısaltılmış başlık okuyucuya yayınlayanın niyetini gizli bir kararla değiştirilmiş sunardı.
- **Tek okuma yüzü vardır:** danışman, idare, üye öğrenci ve velisi aynı uçtan okur. Ayrı bir öğrenci/veli ucu açılmadı — iki uç aynı duyuruyu iki farklı şekille döndürme riski taşırdı. Kapsam kararı izinde değil, handler'ın kapı sırasındadır.
- **Yazma yetkisi kulübün danışmanına ya da idareye özgüdür**; izin anahtarı tek başına yetmez.
- **Bildirim yalnız üyelere (aktif + duraklatılmış) gider, veliye gitmez.** Kulüp içi duyuru iç işleyiştir, veli için gürültüdür. Etkinlik iptali bu kuralın istisnasıdır çünkü plan ve ulaşımı etkiler. Duyuru ya da kulüp okunamıyorsa bildirim sessizce düşer.
- Liste sayfalama yapmaz ve süzgeci yoktur (sözleşme tanımlamıyor).

## İlişkiler

- [[Kulüp]] — sahibi; sezon süzgeci kulüp kapısından gelir
- [[Duyuru]] — kardeş kavram; imza dondurma ve silinmezlik gerekçesi oradan devralındı
- [[Kişi]] — yayınlayan; yalnız kimlik, etiket ayrıca donar
- [[Bildirim]] — yayın olayı; alıcı yalnız üyeler

## Geçtiği modüller

- [[Kulüpler]] — yayınlama ve listeleme; okuma yüzü dört rol için ortak

<!-- generated:end -->

## Notlar

<El yazısı alan. Senkron buraya dokunmaz.>

## Açık Sorular

- Düzenleme ve silme yok; "yanlış saati duyurdum" senaryosunda danışman yeni duyuru yayınlar ve giden push geri çekilmez. Kabul edilmiş MVP sınırı; iki dakikalık "yazdım-sildim" penceresi bir gün istenir mi?
- Bildirim başlık ve gövdeleri handler içinde sabit Türkçe dize (kurumsal duyuru modülüyle aynı borç). Çok dillilik gelirse iki modül birlikte taşınır.
