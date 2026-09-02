---
tags: [decision, domain/academic]
date: 2026-08-31
status: accepted
---

# 0001 — Sınav ağırlığı okulun politikasında yaşar, sınav türünde değil

## Bağlam

Sınav ağırlığı iki ayrı yerde tanımlıydı: [[Sınav Türü]] master kaydında tür başına yüzde, [[Okul Ayarları]]'ndaki akademik politikada yazılı/performans ağırlığı (toplamı 100, doğrulayıcısı var). İkisinin de tüketicisi yoktu. [[Notlar]] modülü geldiğinde iki rakip tanım hazır bekliyor olacaktı ve hangisinin yetkili olduğuna dair yazılı karar yoktu. Bulgu defterinde TB-46 olarak kaydedildi; karar K-12 §C3.

## Karar

Ağırlık okulun politikasında yaşar; sınav türündeki ağırlık kolonu kaldırıldı (migration 2026-08-31).

## Değerlendirilen alternatifler

- **Sınav türünde tutmak** — tablo master veridir, tüm okullarda ortaktır; ağırlık ise okulun kararıdır. Aynı sınav türü iki okulda farklı ağırlıkta olabilir. Master veri okul kararını taşımamalıdır.
- **İkisini de tutup birini yetkili ilan etmek** — ölü alan sözleşmede kalır ve yeni geleni yanıltır.

## Sonuçları

Sınav türü artık yalnız ad, kod, dönem sırası ve görüntü sırası taşır. Ağırlık hesabı yapılacaksa girdi okul ayarlarından okunur. Not: bugün dönem içi ders ortalaması **ağırlıksızdır**; ağırlıkların gerçek tüketicisi (karne / dönem sonu notu) henüz yazılmadı. Karne modülü geldiğinde okul politikasındaki iki alan yeter mi, yoksa tür bazlı ağırlık okula özel bir tabloyla geri mi gelir — o gün bakılacak.

## İlgili

- [[Sınav Türü]]
- [[Okul Ayarları]]
- [[Notlar]]
- [[Müfredat]]
