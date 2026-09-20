---
aliases: [CurriculumVersion, EducationProgram, CurriculumEntry, CurriculumHourOption, CurriculumProvenance, Eğitim Programı, MEB Çizelge Sürümü]
tags: [domain/academic]
table: master.curriculum_versions, master.education_programs, master.curriculum_entries, master.curriculum_hour_options, master.curriculum_provenances
status: active
last-synced: 2026-09-20 (445eaa6a)
---

# Müfredat Sürümü

<!-- generated:start -->

## Nedir

MEB haftalık ders çizelgesinin belirli bir akademik yıl ve eğitim programı için yayımlanmış, **değişmez** hâli. Zincir üç halkadır: **eğitim programı** (ör. ortaokul genel, lise) → o programın bir akademik yıla ait **sürümü** (karar numarası ve tarihiyle) → sürümün **satırları** (sınıf seviyesi × ders × varsayılan haftalık saat, zorunlu/seçmeli). Platform geneldir; okula ait değildir.

## Yaşam döngüsü

Sürüm `Draft` olarak doğar. `Draft → Published` yayımdır; `Published → Superseded` yerini yenisine bırakmadır; `Draft → Rejected` reddedilmedir. Başka geçiş yoktur.

Yeni bir resmî karar **yeni bir sürüm** üretir; yayımlanmış sürümün satırları güncellenmez. Eski sezonlar bu yüzden kendi sürümlerine ya da snapshot'larına bakmaya devam eder.

Sürüm artık merkez hattından doğar (Dilim 2): [[MEB Kaynak Belgesi]] seti → [[Müfredat İçe Aktarma]] → merkez onayı → yayım. Yayım tek işlemde sürümü, satırlarını, saat seçeneklerini ve kaynak izlerini yazar; aynı program ve akademik yıl için önceki yayımlı sürüm `Superseded` olur. MEB sayfasından otomatik keşif ve PDF ayrıştırma Dilim 3'tür.

## Kurallar

- Her eğitim kademesinin tek bir **varsayılan** eğitim programı vardır; okulun sezon taslağı bu programa bağlanır.
- Sürüm tekilliği: (program, akademik yıl, kod). Satır tekilliği: (sürüm, seviye, çekirdek ders).
- Satırın varsayılan saati sıfırdan büyüktür (0 yalnız okul kararında anlamlıdır).
- Satırlar dersin **çekirdek** kimliğiyle anahtarlanır; okulun ders satırına `MasterSubjectId` üzerinden çevrilir (`TB-191`).
- Akademik yıl kodu `YYYY-YYYY` biçimindedir; sezonla eşleşmesi sezon **tarihlerinden** türetilir (başlangıç yılı–bitiş yılı), sezon adından değil.
- Bir okulun taslağı, yılı tam eşleşen **tek** yayımlı sürüme bağlanır; yoksa manuel açılır, birden fazlaysa sezon açılışı reddedilir.
- Sürüm kodu karar numarasından türer ve (program, yıl) içinde tekildir; aynı karar ikinci kez yayımlanamaz.
- Yayımlanmış sürüm ve satırları **değiştirilemez**; kural kayıt anında zorlanır. Tek istisna `Published → Superseded` geçişidir.
- Satır ayrık saat seçenekleri taşıyabilir ("1 veya 2 saat"); varsayılan saat en küçük seçenektir.
- Her satır kaynağına bağlıdır (belge + sayfa) — kaynak izi yayımda yazılır.

## İlişkiler

- [[Haftalık Ders Saati]] — satırlar MEB katmanını verir
- [[MEB Kaynak Belgesi]] — sürümün dayandığı hukuki kaynak
- [[Müfredat İçe Aktarma]] — sürümü üreten merkez çalışması
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
