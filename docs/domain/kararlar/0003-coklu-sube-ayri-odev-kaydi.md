---
tags: [decision, domain/academic]
date: 2026-08-27
status: accepted
---

# 0003 — Çoklu şubeye verilen ödev, şube başına ayrı kayıttır

## Bağlam

Öğretmen aynı ödevi üç şubeye birden verebilir; ekran bunu tek formla yapar. Sunucuda bunun tek [[Ödev]] kaydı + üç hedef mi, yoksa üç ayrı ödev mi olacağı kararlaştırılmalıydı.

## Karar

Her şube için ayrı bir ödev kaydı doğar; ödevin koordinatı dönem × şube × ders × sahip öğretmendir.

## Değerlendirilen alternatifler

- **Tek kayıt + şube listesi** — bir şubenin son teslim tarihini değiştirmek diğer ikisini de değiştirirdi; şubelerin takvimleri ve mevcutları farklıdır, kapatma ve iptal de şube başına verilir.

## Sonuçları

Yoğunluk panosu ve okul geneli liste şube başına doğru sayar; kapatma, iptal ve takip ızgarası şube bağımsızdır. Bedeli: "aynı ödev" bilgisi kayıtlar arasında taşınmaz — üç kaydı birbirine bağlayan bir alan yoktur, ekler ve açıklama üç kez saklanır. İleride "üçünü birden düzenle" istenirse bu bağ eklenmelidir.

## İlgili

- [[Ödev]]
- [[Ödevler]]
- [[Şube]]
