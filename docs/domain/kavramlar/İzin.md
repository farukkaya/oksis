---
aliases: [Permission, RolePermission, Yetki]
tags: [domain/people]
table: identity.permissions
status: active
last-synced: 2026-08-10 (2270867)
---

# İzin

<!-- generated:start -->

## Nedir

"Ne yapabilir" sorusunun en küçük birimi. `modül.aksiyon` biçiminde tek bir kodla ifade edilir — `users.read`, `users.view-all`, `grades.publish` gibi. Uçlarda yetki kontrolü rol adına değil bu koda bakar; rol yalnızca izinleri paketleyen bir kaptır.

İzinler [[Sistem Rolü]]'ne **rol-izin matrisi** üzerinden bağlanır. Matris platform genelinde tanımlıdır ve MVP'de tüm okullar için tek yetkili kaynaktır; okula özel özelleştirme ileri sürüm konusudur.

## Yaşam döngüsü

Seed verisiyle gelir; çalışma anında oluşturulmaz. Matris değiştiğinde ilgili [[Hesap]]'ların izin sürümü artırılır ve önbellekteki eski izin kümesi geçersizleşir.

## Kurallar

- İzin kodu tekildir ve küçük harfe normalize edilir; modül ve aksiyon adları büyük harfe.
- İzinler jetona **basılmaz**; her istekte hesabın aktif sezondaki [[Rol Ataması]]'ndan çözülür (önbellekten okunur).
- Rol adına dayalı kontrol yazılmaz — kaynak-seviyesi kapsam kontrolü bile çözülmüş izin koduna bakar (örn. `users.view-all`).
- RBAC izni geçtikten sonra ayrıca kaynak kapsamı (ABAC) kontrol edilir: kendi kaydı, veli bağı olan çocuk, öğretmenin kendi şubesi.
- Reddedilen yetki denemesi olay olarak yayınlanır ve denetim kaydına düşer.

## İlişkiler

- [[Sistem Rolü]] — izinleri paketleyen kap; bağ rol-izin matrisidir
- [[Rol Ataması]] — çalışma anında izinlerin çözüldüğü kaynak
- [[Hesap]] — izin sürümü ve önbellek geçersizleştirme burada tutulur

## Geçtiği modüller

- [[Kimlik Doğrulama]] — kavramın sahibi; izin çözümleme, önbellek, sürüm kapısı
- [[Kullanıcılar]] — rol-izin matrisinin listelenmesi, kişi erişim kapsamı

İzin kodu tüketen ama henüz notu olmayan modüller: pratikte tüm modüller.

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- Okula özel izin matrisi override'ı (tenant customization) ne zaman ve nasıl açılacak? Şu an tablo tüm okullar için ortak.
- İzin kodlarının tam listesi seed verisinde duruyor; kanonik yetki matrisi dokümanı ile senkron kalması nasıl garanti edilecek?
