---
aliases: [CurriculumVersion, EducationProgram, CurriculumEntry, Eğitim Programı, MEB Çizelge Sürümü]
tags: [domain/academic]
table: master.curriculum_versions, master.education_programs, master.curriculum_entries
status: active
last-synced: 2026-09-18 (f33ea43a)
---

# Müfredat Sürümü

<!-- generated:start -->

## Nedir

MEB haftalık ders çizelgesinin belirli bir akademik yıl ve eğitim programı için yayımlanmış, **değişmez** hâli. Zincir üç halkadır: **eğitim programı** (ör. ortaokul genel, lise) → o programın bir akademik yıla ait **sürümü** (karar numarası ve tarihiyle) → sürümün **satırları** (sınıf seviyesi × ders × varsayılan haftalık saat, zorunlu/seçmeli). Platform geneldir; okula ait değildir.

## Yaşam döngüsü

Sürüm `Draft` olarak doğar. `Draft → Published` yayımdır; `Published → Superseded` yerini yenisine bırakmadır; `Draft → Rejected` reddedilmedir. Başka geçiş yoktur.

Yeni bir resmî karar **yeni bir sürüm** üretir; yayımlanmış sürümün satırları güncellenmez. Eski sezonlar bu yüzden kendi sürümlerine ya da snapshot'larına bakmaya devam eder.

Dilim 1'de sürüme yazan bir ürün yüzeyi yoktur; sürümler yalnız seed ve göçle gelir. MEB sayfasından keşif, belge saklama, ayrıştırma ve merkez onayı Dilim 2–4'tür.

## Kurallar

- Her eğitim kademesinin tek bir **varsayılan** eğitim programı vardır; okulun sezon taslağı bu programa bağlanır.
- Sürüm tekilliği: (program, akademik yıl, kod). Satır tekilliği: (sürüm, seviye, çekirdek ders).
- Satırın varsayılan saati sıfırdan büyüktür (0 yalnız okul kararında anlamlıdır).
- Satırlar dersin **çekirdek** kimliğiyle anahtarlanır; okulun ders satırına `MasterSubjectId` üzerinden çevrilir (`TB-191`).
- Akademik yıl kodu `YYYY-YYYY` biçimindedir; sezonla eşleşmesi sezon **tarihlerinden** türetilir (başlangıç yılı–bitiş yılı), sezon adından değil.
- Bir okulun taslağı, yılı tam eşleşen **tek** yayımlı sürüme bağlanır; yoksa manuel açılır, birden fazlaysa sezon açılışı reddedilir.

## İlişkiler

- [[Haftalık Ders Saati]] — satırlar MEB katmanını verir
- [[Sezon Müfredat Snapshotı]] — taslak bir sürüme bağlanır; snapshot hangi sürümden dondurulduğunu taşır
- [[Ders]] — satır dersin çekirdek kimliğini taşır
- [[Sınıf Seviyesi]] — satırın seviyesi

## Geçtiği modüller

- [[Müfredat]] — kavramın sahibi

<!-- generated:end -->

## Notlar

Bugünkü iki sürüm (`LEGACY-2025.04-MIDDLE`, `LEGACY-2025.04-HIGH`, ikisi de `2025-2026`) eski sürümsüz şablonun birebir taşımasıdır; **resmî TTKB verisi değildir.** `Published` durumu burada "uyumluluk için kullanılabilir" demektir, onaylı demek değildir. Lise sürümünün karar alanı açıkça "Doğrulanmadı — MEB çizelgesi bekleniyor" der (`E-16`). Gerçek çizelge yeni sürüm olarak gelecek; bu satırlar değişmeyecek.

## Açık Sorular

- `Published` durumu resmî onaylı sürümle uyumluluk sürümünü ayırmıyor; Dilim 2–4'te okul ekranı "MEB onaylı" gösterirken bu ayrım nereden okunacak?
