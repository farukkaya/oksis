---
aliases: [AttendanceAmendmentRequest, Yoklama Düzeltme Talebi]
tags: [domain/academic]
table: academic.attendance_amendment_requests
status: active
last-synced: 2026-08-10 (2270867)
---

# Düzeltme Talebi

<!-- generated:start -->

## Nedir

Öğretmenin, **düzeltme penceresi kapandıktan sonra** tek bir yoklama kaydı için idareden istediği değişiklik.

Varlık sebebi bir denge: yoklama geç düzeltilebilir olursa kayıt güvenilmez olur, hiç düzeltilemezse gerçek hatalar donar. Çözüm, kısa bir serbest pencere ve sonrasında **izne bağlı** bir yol açmaktır. Pencere içindeyken öğretmen doğrudan düzeltir; kapandıktan sonra talep eder.

## Yaşam döngüsü

`Bekliyor → Onaylandı | Reddedildi`. [[Mazeret]] ile aynı karar durumunu paylaşır. Onay uygulandığında ilgili kayıt idare yetkisiyle düzeltilir; bu adım uygulama katmanında yapılır.

## Kurallar

- **Gerekçe öğretmen için de zorunludur** (2026-07-21 ürün kararı). Talep sessizce açılamaz.
- Kaydın **talep anındaki durumu** ayrıca dondurulur. Sebep: onaydan sonra kaydın güncel durumu istenen duruma eşit olacağından "öncesi" bilgisi başka hiçbir yerden güvenilir okunamaz — üstelik kayıt talep ile karar arasında başka bir yoldan (idarenin doğrudan düzeltmesi gibi) değişmiş olabilir.
- Karar bir kez verilir; ikinci karar denemesi reddedilir.

## İlişkiler

- [[Yoklama Oturumu]] — talebin hedefi olan kayıt oradadır; düzeltme penceresi kuralı da orada
- [[Mazeret]] — kardeş akış; aynı karar durumunu paylaşır
- [[Kişi]] — talep eden öğretmen, karar veren idare, konusu olan öğrenci

## Geçtiği modüller

- [[Yoklama ve Devamsızlık]] — kavramın sahibi

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- Aynı kayıt için birden çok açık talep olabilir mi? Tekillik kuralı görünmüyor.
- Talep reddedilirse öğretmen yeniden talep açabiliyor mu, yoksa yol kapanıyor mu?
