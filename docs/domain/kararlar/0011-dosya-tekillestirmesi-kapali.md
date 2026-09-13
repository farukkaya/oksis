---
tags: [decision, domain/platform]
date: 2026-09-13
status: accepted
---

# 0011 — Aynı içerik iki kez yüklenirse iki ayrı dosya kaydı olur; tekilleştirme MVP'de kapalı

## Bağlam

Her dosyanın sağlama toplamı tutulduğu için, aynı içerik ikinci kez yüklendiğinde yeni kayıt açmak yerine var olan dosyaya işaret etmek (tekilleştirme) mümkündü. Yer tasarrufu mu, basit silme mi öncelikli olacaktı?

## Karar

Tekilleştirme yapılmaz: her yükleme kendi dosya kaydını ve byte'larını oluşturur. Sağlama toplamı yine her dosyada saklanır (K2).

## Değerlendirilen alternatifler

- **İçerik bazlı tekilleştirme.** Silmeyi bir referans sayımı problemine çevirirdi: bir dosyayı silmeden önce onu paylaşan başka kayıt kalıp kalmadığını bilmek gerekirdi. KVKK imhası ve kota hesabı bu sayıya bağımlı hâle gelirdi.

## Sonuçları

"Aynı dosya birçok yerde" ihtiyacını zaten [[Dosya Bağı]] karşılar: tek dosya birçok kayda bağlanır, kopya oluşmaz. Kaybedilen yalnız, farklı kişilerin aynı içeriği ayrı ayrı yüklemesinden gelecek tasarruftur.

Karar geri alınabilir. Sağlama toplamı saklandığı ve okul ile sağlama toplamı üzerinde bir dizin bulunduğu için, okul içi tekilleştirme ileride mevcut veriye de uygulanabilir. Dikkat edilecek nokta: iki fazlı yüklemede sağlama toplamını istemci beyan eder; içerikle karşılaştırma tarama işinde yapılır ve uyuşmazlık dosyayı karantinaya alır. Tekilleştirme açılırsa, taramadan geçmemiş beyan edilmiş değere güvenilmemelidir.

## İlgili

- [[Saklı Dosya]]
- [[Dosya Bağı]]
- [[Dosya Yönetimi]]
