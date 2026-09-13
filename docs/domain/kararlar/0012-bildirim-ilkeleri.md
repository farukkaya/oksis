---
tags: [decision, domain/messaging]
date: 2026-09-13
status: accepted
---

# 0012 — Bildirim ilkeleri: alıcı etkilenen kişidir, uygulama içi her zaman, push seçilerek, sessiz saat varsayılan

## Bağlam

Nöbet, ders programı ve sezon modülleri "kim, neyi, ne zaman öğrenir" sorusunu ayrı ayrı cevaplasaydı, kullanıcı aynı üründe üç farklı bildirim tonuyla karşılaşırdı. Push kanalı açılınca hangi olayın telefonu titreteceğine de karar vermek gerekiyordu. Bu dört ilke olay bazındaki matrisin ortak omurgasıdır ve yeni bir olay eklendiğinde de uygulanır. Olay olay matris [[K-01 - Bildirim Matrisi]]'ndedir.

## Karar

- **O1 — Alıcı bir rol değil, etkilenen kişidir.** "Öğretmenlere gider" denmez, "bu atamanın iki tarafına gider" denir.
- **O2 — Uygulama içi her zaman, push seçilerek.** Her olay bir uygulama içi bildirim üretir. Push yalnız kaçırılmaması gereken olaylarda açılır.
- **O3 — Anlık mı, özet mi: aksiyon gerekiyor mu?** Kullanıcı bir şey yapmak zorundaysa anlık, yalnız bilmesi yetiyorsa özet.
- **O4 — Sessiz saat varsayılan olarak geçerlidir.** Kritik olmayan push, sessiz saat bitene kadar ertelenir; uygulama içi satır her durumda anında yazılır. Sessiz saati delmek ayrı bir öncelik sözlüğüyle değil, olay başına "deler / delmez" işaretiyle ifade edilir.

## Değerlendirilen alternatifler

- **Rol bazlı yayın ("öğretmenlere", "velilere").** İlgisiz kişiye giden her bildirim, bildirimin değerini düşürür; kullanıcı bir süre sonra hepsini kapatır.
- **Her olayı push'la göndermek.** Gürültü üretir. Ayrıca tek işlemde binlerce alıcıya giden olaylar, toplu gönderim kısıtlaması (throttle) olmadan push'a açılamaz.
- **Ayrı bir öncelik sözlüğü (kritik / normal / düşük).** Olay sayısı az olduğu için olay başına "sessiz saati deler" işareti yeterli görüldü.

## Sonuçları

Uygulama içi satır aynı zamanda denetim izidir. Push kapsamı bilinçli bir liste olarak tutulur; bir olayı bu listeye eklemek, fan-out büyüklüğüne bakılarak verilen bir karardır.

**Uygulama durumu (2026-09-13, kodla ölçüldü):**

- **O2 kısmen uygulanıyor.** Push ve e-posta yalnız kapsam listesindeki olaylarda çalışır; listede olmayan olaylar (duyurular dahil) yalnız uygulama içi gider. Listedeki olaylarda okul, olay bazındaki portal anahtarıyla uygulama içi satırı da kapatabilir. Yani "uygulama içi her zaman" koşulsuz değildir.
- **O4 kısmen uygulanıyor.** Sessiz saat kapısı yalnız push'ta var: push'u erteler, uygulama içi satıra dokunmaz. Ancak okulun sessiz saati **varsayılan olarak kapalıdır**; okul ayarı açmadıkça hiçbir push ertelenmez. E-postada sessiz saat kapısı bilinçli olarak yoktur.
- **Olay başına "sessiz saati deler" işareti kodda yok**, öncelik kavramı da yok. Bugün sessiz saat açıksa kapsamdaki bütün push'lar ertelenir.
- **O3'ün özet tarafı olaya göre değişiyor.** Günlük yoklama özeti ve eksik ödev özeti var; ders programı değişiklikleri için gün sonu özet toplayıcı yok.

## İlgili

- [[K-01 - Bildirim Matrisi]]
- [[Bildirim]]
- [[Bildirim Yapılandırması]]
- [[Bildirimler]]
