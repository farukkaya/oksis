---
tags: [decision, domain/academic]
date: 2026-09-18
status: accepted
---

# 0021 — Başlamış sezonun müfredatı snapshot'tan okunur

## Bağlam

Haftalık saat, sürümsüz bir MEB şablonu ile sezona bağlı okul override'ının o anki birleşimiyle çözülüyordu. İki kusur ölçüldü: ders programı sağlayıcısı sürümü hiç süzmüyordu, ikinci bir MEB sürümü yazıldığı an aynı ders iki satır döndürüp programı çökertecekti (`TB-201`); şablon sezona bağlı olmadığından bir saat değişikliği kapanmış sezonların gerekli saatini geriye dönük değiştiriyordu (`TB-202`). "MEB'den veri çek" fikrinin ilk yazması üretimi kıracaktı.

## Karar

MEB çizelgesi değişmez sürümler olarak tutulur; okulun kararı sezon taslağında yaşar; sezon başlarken taslak değişmez bir snapshot'a dondurulur ve **başlamış ya da arşiv sezonda ders programı, eksik saat ve saat ekranları yalnız snapshot'ı okur.** Hazırlıktaki sezon, kendi sürümüne çivili taslağı okur.

## Değerlendirilen alternatifler

- **Sezona sürüm kimliği çivilemek, saati her okumada hesaplamak** — okulun kararı ve MEB satırı yine canlı kalırdı; override silinirse ya da satır düzeltilirse geçmiş değişirdi. "O yıl ne okutuldu" sorusunun değişmez cevabı olmazdı.
- **Şablonu salt-ekleme yapmak (eski satır hiç silinmez)** — `TB-201`'in süzgecini şart koşar ama okul kararının geçmişini korumaz.
- **Hazırlıktaki sezonun da yalnız snapshot okuması** (planın ilk hâli) — snapshot aktivasyonda doğduğu için sezon sihirbazının ders programı kopyası ve hazırlıkta kurulan her program gerekli saati boş görürdü. Reddedildi; hazırlıkta taslak okunur (2026-09-18, uygulama sırasında verilen karar).

## Sonuçları

- Yeni bir MEB sürümü hiçbir başlamış sezonu etkilemez; iki sürüm birlikte hiçbir okuyucuya gelmez.
- Snapshot değişmez olduğu için başlamış sezonda bir saat hatası düzeltilemez; dönem içi düzeltme ayrı bir karar gerektirir.
- Hazırlıktaki taslak sonradan yayımlanan sürümü kendiliğinden görmez; taslağı yeni sürüme taşıma (rebase) Dilim 4'e kaldı.
- Snapshot hatası istisna olarak yükselir: aktivasyon önceki sezonu arşivleyip kaydettikten sonra snapshot üretir ve `TransactionBehavior` başarısız `Result`'ta commit eder; istisna, arşiv dahil her şeyi geri aldırır.
- Akademik yıl eşleşmesi sezon adından değil tarihlerinden türetilir (ad serbest metindir).
- Geri dönülürse: `SessionCurriculum` tek okuma kuralıdır; ders programı sağlayıcısı ve gerekli saat hesabı ondan geçer, mimari bekçi (`CurriculumRuntimeReadGuardTests`) master tablolara doğrudan dönüşü engeller.

## İlgili

- [[Sezon Müfredat Snapshotı]]
- [[Müfredat Sürümü]]
- [[Haftalık Ders Saati]]
- [[Müfredat]]
