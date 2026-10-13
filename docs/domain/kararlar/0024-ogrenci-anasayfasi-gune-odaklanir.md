---
tags: [decision, domain/home, mobile]
date: 2026-10-13
status: accepted
---

# 0024 — Öğrenci anasayfası "şimdi"ye değil güne odaklanır (telefon okulda teslim edilir)

## Bağlam

Öğretmen anasayfası 2026-10-13'te bir "şimdi" kartıyla yeniden tasarlandı: süren ders, süre çubuğu ("3 dk kaldı"), teneffüs ve yoklama düğmesi. Aynı dil öğrenci anasayfasına da uygulandı.

Ancak öğrencilerin çoğu telefonunu okul girişinde teslim eder. Öğrenci uygulamayı ders sırasında değil, sabah okula girmeden önce, okuldan çıkınca, akşam ve hafta sonu açar. O saatlerde "şimdi" kartı ya sıradaki günün ilk dersini tek satırla söylüyordu ya da boş kalıyordu. Ekranın en büyük alanı öğrencinin görmediği ana ayrılmıştı. Ders şeridi de akşam bitmiş dersleri soluk gösteriyordu.

## Karar

**Varsayım:** öğrenci telefonunu okulda teslim eder. Bu varsayım öğrenci yüzeyinin tasarım girdisidir.

Öğrenci anasayfasının odağı **gün**dür:

- **Bugün** — bugün okul günüyse ve son ders bitmediyse (sabah ve okul saati). Kart günün ders sayısını, saat aralığını ve bugün teslim edilecek ödevleri ve sınavları gösterir.
- **Sıradaki okul günü** — bugünün dersleri bittiyse ya da bugün tatil veya hafta sonuysa ("Yarın", "Pazartesi"). Kart o günün çanta listesini gösterir: ders sayısı, saatler, o gün teslim edilecek ödevler, o günkü sınavlar. Ders şeridi de o günün dersleridir.
- Süre çubuğu ve "dk kaldı" öğrencide yoktur. Okul saatinde yalnız "N. ders sürüyor" yazar.
- Akşamın soruları karşılanır:
  - Bugün yok ya da geç yazıldıysa selamlamanın yanında etiket çıkar (`students/{id}/today`).
  - Bugün girilen not "YENİ" işaretlidir.

Öğretmen anasayfası "şimdi" kartında kalır. Öğretmen telefonu okulda kullanır ve kartın asıl işi yoklama düğmesidir.

## Değerlendirilen alternatifler

- **Öğretmenle aynı "şimdi" kartı.** Tutarlı görünür, ama öğrencinin bakmadığı anı anlatır. Reddedildi.
- **Ayrı "Bugün okulda" kartı (devamsızlık, not, duyuru).** Not ve duyuru zaten kendi bölümlerinde ve kısayol rozetinde görünüyor; ayrı kart ekranı taşırırdı. Yalnız devamsızlık etiket olarak eklendi, not "YENİ" işaretiyle karşılandı.
- **Yeni bir sunucu ucu ("öğrencinin günü").** Gerekmedi. Haftalık program, ödev, sınav, not ve bugünün yoklaması mevcut uçlardan geliyor.

## Sonuçları

- Odak günü `useHomeFocusDay` (mobil, `features/home/use-home-now.ts`) seçer. "Bugün" sorgusu dünün günüyle kalmışsa (uygulama gece açık kaldıysa) bugünün dersleri haftalık programdan okunur ve sorgu tazelenir.
- Veli anasayfası henüz bu bakışla gözden geçirilmedi. Veli telefonu okulda teslim etmez, ama çocuğun "şimdi"si veliye de ancak gün sonunda anlamlıdır. Ayrı bir değerlendirme konusudur.
