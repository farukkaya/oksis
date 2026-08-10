---
aliases: [ScheduleProgram, Haftalık Ders Programı, Şube Programı]
tags: [domain/academic]
table: academic.schedule_programs
status: active
last-synced: 2026-08-10 (2270867)
---

# Ders Programı

<!-- generated:start -->

## Nedir

Bir [[Şube]]'nin bir [[Dönem]]'deki haftalık ders programının tamamı. Okulun duvarına asılan "10-A haftalık ders programı" çizelgesinin karşılığıdır.

İçindeki tek satıra **yerleşim** denir ve dört şeyden oluşur: [[Ders]], öğretmen, isteğe bağlı [[Derslik]] ve zaman dilimi (gün + kaçıncı ders saati). Yerleşimler programın parçasıdır, tek başlarına yaşamazlar.

Zaman burada saat olarak değil **sıra** olarak tutulur: "3. ders saati". O sıranın kaçta başlayıp bittiğini [[Zil Çizelgesi]] söyler. Bu yüzden okul zil saatlerini değiştirdiğinde program yeniden yazılmaz.

⚠️ **Adlandırma tuzağı:** Kodda şubeye burada `Branch` deniyor (`BranchId` → `class_rooms`). Aynı isim müfredat tarafında **branş** anlamına gelir ([[Branş]]). İkisi ayrı tablolardır; hangi `Branch` olduğuna bakmadan sorgu yazma.

## Yaşam döngüsü

`Taslak → Yayında ⇄ Revize`

- **Taslak** — serbestçe düzenlenir ve **hiçbir kaynağı rezerve etmez**. Bu yüzden birden çok taslak aynı öğretmeni aynı saate koyabilir; çakışma sayılmaz.
- **Yayında** — yayınlanmış canlı program. Yerleşimleri öğretmeni, dersliği ve şubeyi o saat için **rezerve eder**.
- **Revize** — yayındaki bir programa ilk düzenleme kaydedildiğinde otomatik olarak buraya geçilir. Salt görüntüleme tetiklemez. Revize de canlıdır: rezervasyonlar korunur, ama tüketici hâlâ **son yayın kopyasını** görür — yeniden yayınlanana kadar.

Silme yerleşimleri pasifleştirir; kayıt fiziksel silinmez ama slotlar serbest kalır.

## Kurallar

- **Bir şube aynı saatte iki ders göremez** — aggregate içinde zorlanır.
- **Öğretmen ve derslik çakışması aggregate sınırını aşar** (başka şubenin programını ilgilendirir). Bu yüzden iki katmanlı korunur: uygulama katmanında doluluk ön kontrolü, veritabanında filtreli tekil index. Index yalnız **rezerve eden** yerleşimleri kapsar — taslakların çakışmaması bu yüzdendir.
- **Blok ders** en az iki yerleşimden oluşur, aynı günde ve ardışık saatlerde olmalıdır.
- **Boş program yayınlanamaz.** Yayınlayan kullanıcı bilgisi zorunludur.
- Yayın sürümü dışarıdan verilir (yayın geçmişinden türetilir) — böylece yeniden yayında sürüm tekilliği bozulmaz.
- Ders saati sırası 1-20 aralığındadır.
- Laboratuvar gerektiren ders yalnız uygun türde dersliğe atanabilir.
- Yeni bir program yayınlanırken canlı kardeşi taslağa indirilir (silinmez); yerleşimleri kalır, rezervasyonları temizlenir.

## Denormalize istatistikler

Program üzerinde üç sayı taşınır: başka şubelerin canlı programlarıyla çakışan yerleşim sayısı, müfredata göre yerleştirilmemiş saat, ve öğretmenin "müsait değil" dediği slota düşen yerleşim sayısı. Üçü de **domain tarafından hesaplanmaz** — aggregate sınırını aştıkları için uygulama katmanı hesaplayıp yazar, program yalnız saklar. Hub listesi bunları okur.

## İlişkiler

- [[Şube]] — programın sahibi olan sınıf; kodda `Branch` adıyla geçer
- [[Dönem]] — program bir döneme aittir
- [[Ders]] / [[Derslik]] — yerleşimin ders ve mekân ayakları
- [[Profil]] — yerleşimin öğretmeni
- [[Zil Çizelgesi]] — ders saati sırasının zamana karşılığı
- [[Program Sürümü]] — yayın anının değişmez kopyası
- [[Öğretmen Müsaitliği]] — yerleştirmede uyarı ve engel kaynağı
- [[Program İstisnası]] — tek güne özel sapma; programı değiştirmez
- [[Şube Ders Görevlendirmesi]] — hangi öğretmenin hangi dersi vereceği buradan gelir; değiştiğinde program senkron kalsın diye olay yayınlanır

## Geçtiği modüller

- [[Ders Programı Yönetimi]] — kavramın sahibi
- [[Nöbetler]] — vekâlet, yayınlanmış programın üstüne katman yazar

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- Durum enum'unun açıklamasında "Yayında sonraki fazda devreye girer" yazıyor, oysa yayın uçları ve tüketici ekranları çalışıyor. Bayat faz notu mu?
- Üç denormalize istatistiğin her mutasyondan sonra yeniden hesaplandığı bu taramada doğrulanamadı. Yeniden hesabı kim tetikliyor, bayatlayabilir mi?
- Sezon kimliği hâlâ eski `AcademicYearId` adıyla taşınıyor (bu kavramda ve kardeşlerinde). Kalıntı mı?
