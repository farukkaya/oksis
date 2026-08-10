---
aliases: [ModuleConfig, PlanModule, Modül Ayarı, Plan Kısıtı]
tags: [domain/platform]
table: school.school_module_configs
status: active
last-synced: 2026-08-10 (2270867)
---

# Modül Yapılandırması

<!-- generated:start -->

## Nedir

Bir okulda hangi modüllerin açık olduğunu tutan kayıt. Okul yoklamayı kullanır ama mesajlaşmayı kapatabilir; nöbet modülünü açar ama ödevi kapalı tutar.

Açık/kapalı kararı **iki kapıdan** geçer: okulun kendi tercihi ve abonelik planı. Plan kapısı okulun elinde değildir — planın kapsamadığı bir modül arayüzde kilitli görünür.

## Plan kataloğu

Hangi planın hangi modülleri kapsadığı platform genelinde tek bir katalogda durur ve tenant'a bağlı değildir; tüm okullar aynı listeyi paylaşır. Bu yüzden [[Okul]]'un planı değiştiğinde kapsam **kendiliğinden** güncellenir — okul ayarlarında ayrıca bir işlem gerekmez.

Bir modülün kilitli görünmesinin tanımı basittir: okulun mevcut planı ile modül anahtarı katalogda eşleşmiyorsa modül plan dışıdır.

## Modül sınıfları

Dört sınıf vardır ve davranışları farklıdır:

- **Çekirdek** — kilitli açık, kapatılamaz.
- **Beta** — erken erişim, serbestçe açılıp kapanır.
- **Standart** — ücretsiz ya da plan dahilinde.
- **Plan kısıtlı** — üst plan gerektirir.

## Kurallar

- **Çekirdek modüller devre dışı bırakılamaz.**
- Güncellemede yalnız açık/kapalı değişir; modülün sınıfı ve plan kısıtlılığı değiştirilemez — bunlar okulun değil platformun kararıdır.
- Plan kataloğu okula özelleştirilemez.
- Değişiklik olay yayınlar.

## İlişkiler

- [[Okul]] — planın sahibi; plan değişimi kapsamı doğrudan etkiler
- [[Okul Ayarları]] — aynı ayar yüzeyinde yönetilir ama ayrı kayıttır

## Geçtiği modüller

- [[Okul Yönetimi]] — kavramın sahibi

Kapının arkasındaki modüllerin tamamı bu ayardan etkilenir.

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- Modül kapatıldığında ilgili uçların gerçekten reddedildiği bu taramada doğrulanamadı. Kapatma yalnız arayüzü mü gizliyor, yoksa sunucu tarafında da bir kapı var mı?
- Plan düşürüldüğünde (premium → ücretsiz) o modüldeki mevcut veriye ne oluyor? Salt-okunur mu kalıyor, erişilemez mi oluyor?
