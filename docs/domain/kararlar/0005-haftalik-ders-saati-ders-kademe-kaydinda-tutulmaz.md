---
tags: [decision, domain/academic]
date: 2026-09-13
status: accepted
last-synced: 2026-09-13 (294ffe6)
---

# 0005 — Haftalık ders saati ders–kademe kaydında tutulmaz; MEB'e eşit okul değeri silinir

<!-- generated:start -->

## Bağlam

Bir [[Ders]]'in bir [[Sınıf Seviyesi]]'nde haftada kaç saat okutulacağı zaten iki katmanda tutuluyordu: platform genelindeki sürümlü MEB şablonu ve okulun sezon bazlı override'ı ([[Haftalık Ders Saati]]). Ders kataloğu genişletilirken, dersin kademe bağına — hangi kademede okutulduğunu söyleyen ders–kademe eşlemesine — doğrudan bir haftalık saat alanı eklemek gündeme geldi (D4). Saatin hangi kayıtta yaşayacağı ve okulun MEB değerine geri dönmesinin nasıl ifade edileceği kararlaştırılmalıydı.

## Karar

Haftalık saat yalnız MEB şablonu ile sezon bazlı okul override'ında tutulur; ders–kademe eşlemesi saat taşımaz, ve okulun gönderdiği saat MEB değerine eşitse override kaydı yazılmaz, varsa silinir (B0.2H).

## Değerlendirilen alternatifler

- **Ders–kademe eşlemesine saat alanı eklemek** — aynı soruya üçüncü bir kaynak doğururdu. Eşleme platform geneli master kayıt olduğu için okula özgü bir saati de taşıyamazdı; MEB şablonuyla zamanla ayrışan ikinci bir "MEB değeri" olurdu ve "hedef saat nereden geliyor" sorusunun cevabı belirsizleşirdi.
- **MEB'e eşit okul değerini de override olarak saklamak** — "MEB değerine dön" ayrı bir silme işlemi gerektirirdi; ayrıca MEB şablonu yeni bir sürümle değiştiğinde eski değeri tekrarlayan override yeni değeri sessizce gölgelerdi.

## Sonuçları

Hedef saat tek bir zincirden çözülür: override varsa o, yoksa MEB şablonu, hiçbiri yoksa hedef yok. Yazma tek komuttur: okul saatleri gönderir, sunucu override'ı açar, günceller ya da siler; override yalnız dersin atanmış kademeleri için yazılabilir. Var olan her override gerçekten MEB'den sapan bir değerdir, bu yüzden "okul nerede MEB'den ayrılıyor" sorusu doğrudan kayıtlardan okunur.

Zorlaştırdığı: okul "MEB'le aynı ama bilinçli teyit ettim" bilgisini ve gerekçesini saklayamaz — değer MEB'e eşitlenince override ile birlikte gerekçesi de gider. Ders–kademe eşlemesi yalnız "bu ders bu kademede okutulur mu" sorusunu cevaplar.

İleride geri dönülürse dokunulacak yerler: haftalık saat uzlaştırma komutu ve etkin saati çözen okuma tarafı.

## İlgili

- [[Haftalık Ders Saati]]
- [[Ders]]
- [[Sınıf Seviyesi]]
- [[Müfredat]]

<!-- generated:end -->
