---
tags: [decision, domain/clubs]
date: 2026-08-29
status: accepted
---

# 0014 — Kulüp başvurusu ve üyeliği tek kayıttır

## Bağlam

Bir öğrenci kulübe iki yoldan girer: onaylı kulüpte önce başvurur, danışman ya da idare karar verir; açık kulüpte doğrudan üye olur. "Başvuru" ve "üyelik" iki ayrı şey gibi görünür ve ekranda iki ayrı liste vardır (başvurular, üyeler). Sunucuda bunların iki ayrı kayıt mı, yoksa tek bir kaydın iki hâli mi olacağı kararlaştırılmalıydı.

## Karar

Başvuru ve üyelik tek [[Kulüp Üyeliği]] kaydıdır. Başvuru `Pending` olarak doğar ve onaylanınca aynı satır `Active`'e geçer. Başvuru listesi ile üye listesi aynı satırlardan iki ayrı süzgeçle üretilir. Terminal hâlden (reddedildi, ayrıldı) çıkış yoktur: yeniden başvuru yeni satır açar.

## Değerlendirilen alternatifler

- **Ayrı başvuru ve üyelik tabloları.** Onay anında satırın bir tablodan ötekine taşınması gerekirdi. Yarıda kalan bir taşıma öğrenciyi iki listede birden ya da hiçbirinde bırakırdı.
- **Ayrı bir "başvur" ucu.** İstemcinin kulübün katılım modunu tahmin edip doğru ucu seçmesi gerekirdi. Tek katılma komutu doğum durumunu kulübün modundan kendisi türetir.
- **Terminal satırı yeniden `Pending`'e çevirmek.** İlk reddin tarihi ve gerekçesi silinirdi. "Geçen dönem reddedildi, bu dönem yine başvurdu" bilgisi danışmanın kararına girdi olmalıdır.

## Sonuçları

- Tekillik filtrelidir: bir öğrencinin bir kulüpte yalnız bir **canlı** satırı olabilir, terminal hâller indeks dışında kalır. Yeni bir hâl eklenirken terminal mi canlı mı olduğu indeks filtresine işlenmelidir.
- Başvuru listesindeki "onaylandı" satırı, karar anı dolu olan `Active` satırdır. Açık kulübe doğrudan katılan öğrencinin karar anı boştur ve başvuru listesine düşmez.
- `Left` satırı iki listede de görünmez. Onaylanıp sonra ayrılan öğrenci başvuru listesinden kaybolur (bkz. [[Kulüp Üyeliği]] açık soruları).
- Karşıt kalıp [[Etkinlik Katılımı]]'dır. Etkinlik tek bir andır, bu yüzden katılımın tekilliği koşulsuzdur ve geri çekilmiş satır yeni satır açmadan yeniden kayda döner. Üyelikte ise tarihçe korunur.
- İleride ayrı bir başvuru yaşam döngüsü istenirse (bekleme listesi, kararı geri alma), karar komutundaki onay bayrağı bir karar türüne dönüştürülmelidir.

## İlgili

- [[Kulüp Üyeliği]]
- [[Kulüp]]
- [[Etkinlik Katılımı]]
- [[Kulüpler]]
