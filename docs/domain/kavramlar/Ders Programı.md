---
aliases: [ScheduleProgram, Haftalık Ders Programı, Şube Programı]
tags: [domain/academic]
table: academic.schedule_programs
status: active
last-synced: 2026-09-13 (294ffe6)
---

# Ders Programı

<!-- generated:start -->

## Nedir

Bir [[Şube]]'nin bir [[Dönem]]'deki haftalık ders programının tamamı. Okulun duvarına asılan "10-A haftalık ders programı" çizelgesinin karşılığıdır.

İçindeki tek satıra **yerleşim** denir ve dört şeyden oluşur: [[Ders]], öğretmen, isteğe bağlı [[Derslik]] ve zaman dilimi (gün + kaçıncı ders saati). Yerleşimler programın parçasıdır, tek başlarına yaşamazlar.

Zaman burada saat olarak değil **sıra** olarak tutulur: "3. ders saati". O sıranın kaçta başlayıp bittiğini [[Zil Çizelgesi]] söyler. Bu yüzden okul zil saatlerini değiştirdiğinde program yeniden yazılmaz.

Gün değeri gerçek takvim günüdür (Pazartesi=1 … Cuma=5); gerçek bir tarihle karşılaştırma dönüşümsüz doğru çalışır. Bkz. [[0013-gun-degeri-gercek-system-dayofweek]].

Program yayınlandığında **fiili yükün tek kaynağı** olur: öğretmenin hangi şubede haftada kaç saat ders verdiği, öğretmenin ders listesi ve öğretmen yükü yayınlanmış yerleşimlerden türetilir; elle tutulan bir kopyası yoktur.

⚠️ **Adlandırma tuzağı:** Kodda şubeye burada `Branch` deniyor (`BranchId` → `class_rooms`). Aynı isim müfredat tarafında **branş** anlamına gelir ([[Branş]]). İkisi ayrı tablolardır; hangi `Branch` olduğuna bakmadan sorgu yazma.

## Yaşam döngüsü

`Taslak → Yayında ⇄ Revize`

- **Taslak** — serbestçe düzenlenir ve **hiçbir kaynağı rezerve etmez**. Bu yüzden birden çok taslak aynı öğretmeni aynı saate koyabilir; çakışma sayılmaz.
- **Yayında** — yayınlanmış canlı program. Yerleşimleri öğretmeni, dersliği ve şubeyi o saat için **rezerve eder**.
- **Revize** — yayındaki bir programa ilk düzenleme kaydedildiğinde otomatik olarak buraya geçilir. Salt görüntüleme tetiklemez. Revize de canlıdır: rezervasyonlar korunur, ama tüketici hâlâ **son yayın kopyasını** görür — yeniden yayınlanana kadar.

Silme yerleşimleri pasifleştirir ve programı **yumuşak siler**; programın bütün [[Program Sürümü]] ve [[Program İstisnası]] kayıtları da birlikte yumuşak silinir. Slotlar serbest kalır, dönemdeki kardeş programların istatistikleri yeniden hesaplanır ve şubenin öğrenci ile velilerine "program kaldırıldı" bildirimi gider.

## Kurallar

- **Bir şube aynı saatte iki ders göremez** — aggregate içinde zorlanır.
- **Öğretmen ve derslik çakışması aggregate sınırını aşar** (başka şubenin programını ilgilendirir). Bu yüzden iki katmanlı korunur: uygulama katmanında doluluk ön kontrolü, veritabanında filtreli tekil index. Index yalnız **rezerve eden** yerleşimleri kapsar — taslakların çakışmaması bu yüzdendir.
- **Blok ders** en az iki yerleşimden oluşur, aynı günde ve ardışık saatlerde olmalıdır.
- **Boş program yayınlanamaz.** Yayınlayan kullanıcı bilgisi zorunludur.
- Müfredata göre eksik saati olan program ancak **bilinçli onayla** ("eksik saatle yayınla") yayınlanır. Öğretmen kapasite aşımı ve [[Dağıtım Kısıtı]] ihlali yalnız uyarıdır, yayını engellemez.
- Yayın sürümü dışarıdan verilir (yayın geçmişinden türetilir) — böylece yeniden yayında sürüm tekilliği bozulmaz.
- Ders saati sırası 1-20 aralığındadır.
- Laboratuvar gerektiren ders yalnız uygun türde dersliğe atanabilir.
- Yeni bir program yayınlanırken canlı kardeşi taslağa indirilir (silinmez); yerleşimleri kalır, rezervasyonları temizlenir.

## Denormalize istatistikler

Program üzerinde üç sayı taşınır: başka şubelerin canlı programlarıyla çakışan yerleşim sayısı, müfredata göre yerleştirilmemiş saat, ve öğretmenin "müsait değil" dediği slota düşen yerleşim sayısı. Üçü de **domain tarafından hesaplanmaz** — aggregate sınırını aştıkları için uygulama katmanı hesaplayıp yazar, program yalnız saklar. Hub listesi bunları okur. Öğretmen müsaitliği kaydedildiğinde ve bir program silindiğinde dönemdeki programların istatistikleri yeniden hesaplanır.

## İlişkiler

- [[Şube]] — programın sahibi olan sınıf; kodda `Branch` adıyla geçer
- [[Dönem]] — program bir döneme aittir
- [[Ders]] / [[Derslik]] — yerleşimin ders ve mekân ayakları
- [[Profil]] — yerleşimin öğretmeni
- [[Zil Çizelgesi]] — ders saati sırasının zamana karşılığı
- [[Program Sürümü]] — yayın anının değişmez kopyası
- [[Öğretmen Müsaitliği]] — yerleştirmede uyarı ve engel kaynağı
- [[Program İstisnası]] — tek güne özel sapma; programı değiştirmez
- [[Ders Görevlendirmesi]] — otomatik üretimin ve eksik saat hesabının öğretmen kaynağı (yetkinlik); şube programı üretilen sınıftır
- [[Haftalık Ders Saati]] — üretimde ve eksik saat hesabında haftalık saatin kaynağı
- [[Dağıtım Kısıtı]] — üretimi yönlendiren yönetici niyeti; programa doğrudan yazmaz, ihlali yayın önizlemesinde ölçülür
- [[Şube Ders Görevlendirmesi]] — eski kaynak; 2026-08-18'de kaldırıldı

## Geçtiği modüller

- [[Ders Programı Yönetimi]] — kavramın sahibi
- [[Nöbetler]] — vekâlet, yayınlanmış programın üstüne katman yazar; yancı ve vekil adaylığında fiili ders doluluğu buradan okunur
- [[Görevlendirmeler]] — öğretmen yükü ve öğretmenin ders listesi canlı yerleşimlerden türetilir
- [[Notlar]] — not defteri kapsamının **tek kaynağı**: "bu öğretmen bu şubede bu dersi okutuyor mu" sorusu programdaki yerleşimden cevaplanır; görevlendirme kullanılmaz, vekâlet kapsama girmez
- [[Ödevler]] — ödev **oluşturma** kapsamı aynı yerden; var olan ödevde soru kapsam değil sahipliktir, program değişse de öğretmen kendi ödevini kapatır

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- Durum enum'unun açıklamasında "Yayında sonraki fazda devreye girer" yazıyor, oysa yayın uçları ve tüketici ekranları çalışıyor. Bayat faz notu mu?
- Üç denormalize istatistik öğretmen müsaitliği kaydedildiğinde ve program silindiğinde yeniden hesaplanıyor. Diğer mutasyonlarda (yerleştirme, taşıma, öğretmen/derslik atama, blok, yayın, sürüme dönüş, üretim uygulama) da yeniden hesaplanıyor mu, yoksa bu yollarda bayatlayabilir mi?
- Sezon kimliği hâlâ eski `AcademicYearId` adıyla taşınıyor (bu kavramda ve kardeşlerinde). Kalıntı mı?
