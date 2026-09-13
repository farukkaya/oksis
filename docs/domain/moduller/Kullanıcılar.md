---
aliases: [Users, api/v1/users]
tags: [domain/people, module]
status: completed
last-synced: 2026-09-13 (294ffe6)
---

# Kullanıcılar

<!-- generated:start -->

## Ne yapar

Okuldaki insanların kaydını tutar: kim var, ne rolde, kiminle bağlı, sisteme nasıl girdi, neyi onayladı. Okul yöneticisi öğrenciyi/öğretmeni/veliyi buradan açar, profilini tanımlar, veli-öğrenci bağını kurar, sezon rolünü verir ve davet gönderir. Kişinin kendisi de kendi kaydını ve rızalarını buradan görür.

Modülün merkezinde tek bir fikir var: **rol ayrı bir kayıt değil, kişiye takılan bir profildir**. Öğretmen aynı zamanda veliyse iki kişi kaydı değil, iki profili olur. Yıl açılışında yeniden kurulan şey kişi değil, o kişinin o sezondaki rolüdür.

Modül tek kimlik modeli üzerinde çalışır; eski tek satırlık kullanıcı kaydı 2026-07-02'de kaldırıldı ([[0009-tek-kimlik-modeli]]). "Kullanıcı" adı arayüzde ve uç adlarında yaşar ama arkasında ayrı bir varlık yoktur: uç ailesinde kullanıcı listesi ve detayı **hesap ekseni** (`/users`), kişi uçları **kişi ekseni**dir (`/users/persons`).

## Kullandığı kavramlar

- [[Kişi]] — modülün ana aggregate'i; yaşam döngüsünün sahibi
- [[Profil]] — kişinin rol verisi; dört tip
- [[Veli-Öğrenci İlişkisi]] — veli bağı ve yetki bayrakları
- [[Rol Ataması]] — sezona bağlı yetkilendirme
- [[Davet]] — sisteme giriş akışı
- [[Rıza Kaydı]] / [[Rıza Paketi]] — KVKK onayları ve sürümleri
- [[Sistem Rolü]] / [[İzin]] — atanabilir roller ve yetki matrisi
- [[Sezon]] — rol ataması ve davet sezona bağlıdır
- [[Şube]] — öğrenci profilinin güncel şube bağı

## Ana akışlar

1. **Kişi açma** — yönetici kişiyi `Draft` olarak açar, en az bir profil ekler, aktive eder. Kimlik numarası verilirse hash'lenip şifrelenerek saklanır; açık değer hiçbir katmanda tutulmaz.
2. **Davet ve kabul** — kişiye hedef rol + sezon ile davet açılır (kişi `Invited`'a geçer), bildirim kuyruğa girer. Kabul tek bir işlemde yürür: hesap üretilir, kişi aktive edilir, rol ataması ve rıza kayıtları yazılır, davet `Accepted`'a çekilir. Herhangi bir adım düşerse hiçbiri kalmaz.
3. **Toplu içe aktarma** — Excel dosyası önce **önizlenir**: satırlar doğrulanır, hatalı olanlar raporlanır, geçerli satırlar önbelleğe alınır. Onay sonrası arka plan işi satırları partiler hâlinde işler. Kısmi başarı kabul edilir — hatalı satır, başarılı satırları geri almaz; iş sonunda "tamamlandı / hatalarla tamamlandı / başarısız" olarak kapanır.
4. **Veli bağı kurma** — veli profilli kişi ile öğrenci profilli kişi arasında, yetki bayraklarıyla birlikte ilişki açılır. Sonlandırma silme değil, gerekçeli kapatmadır.
5. **Rol atama** — kişiye sezon bazında sistem rolü verilir. Atayanın seviyesi hedef rolden yüksek olmak zorundadır; kendi yetkisini yükseltme reddedilir. Elle iptal kişinin oturumunu keser; süre dolumu ve yeni atama yalnız izin sürümünü artırır ([[Rol Ataması]]).
6. **Yaşam döngüsü işlemleri** — askıya alma, yeniden aktive etme, mezun etme, nakil, arşivleme. Her biri gerekçe veya hedef ister ve geçersiz durumda reddedilir.
7. **Dışa aktarma** — filtrelenmiş kişi listesi dosyaya aktarılır; sonuç kümesi üst sınırı aşarsa iş reddedilir (`USERS_EXPORT_TOO_LARGE`).
8. **Kendi kaydı** — kişi kendi profilini günceller, rızalarını görür ve geri çeker.

## Arka plan işleri

- Süresi geçen davetleri `Expired`'a çeken sweep
- Süresi dolan rol atamalarını `Expired`'a çeken sweep
- Excel içe aktarma işi

## Kapsam dışı

- Okula özel rol/izin matrisi override'ı — MVP'de platform matrisi tüm okullar için yetkili.
- Yönetici ekranından KVKK metni yayınlama — seed'li tek yürürlükteki sürüm yeterli görüldü.
- Nakilde hedef okulda kişi kopyası oluşturma — nakil yalnız kaynak okuldaki kaydı kapatır.
- Okullar arası ortak kimlik — iki okulda çalışan kişi her okulda ayrı [[Kişi]] kaydıdır.
- MVP dışı roller (okul personeli, sekreter, muhasebeci) — [[0007-mvp-rol-seti-bes-rol]].

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- Eski `User` varlığı kaldırıldı ama `api/v1/users` uç adları ve "kullanıcı" isimlendirmesi duruyor. Bu ad kalıcı mı, yoksa uçlar hesap/kişi eksenine göre yeniden mi adlandırılacak?
