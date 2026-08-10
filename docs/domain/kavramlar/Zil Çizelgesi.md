---
aliases: [BellSchedule, Ders Saatleri, Zil Programı]
tags: [domain/academic]
table: school.school_bell_schedules
status: active
last-synced: 2026-08-10 (2270867)
---

# Zil Çizelgesi

<!-- generated:start -->

## Nedir

Okulun günlük zaman düzeni: kaçıncı ders kaçta başlar, teneffüs ne kadar, öğle arası nerede. Her satır bir slottur ve tipi vardır — ders saati, teneffüs veya ara.

Bu kavram [[Ders Programı]]'nın zaman tarafını taşıdığı için haritada merkezî: programda saat tutulmaz, **ders sırası** tutulur ("3. ders"). O sıranın gerçek saate karşılığı buradan okunur. Ayrımın pratik faydası şu — okul zil saatlerini kaydırdığında hiçbir ders programı yeniden yazılmaz, yalnız bu çizelge değişir.

Aynı sebeple ders programının günlük istisnaları arasında "saat değişikliği" diye bir tür yoktur: zaman zaten programın değil zil çizelgesinin işidir.

## Yaşam döngüsü

Okul ayarı olarak kurulur ve güncellenir; tekil veya toplu tanımlanabilir. Farklı gün düzenleri için şablon anahtarı taşır: **tam gün** ve **yarım gün**.

## Gün-şablon ataması

Haftanın her günü ayrı bir kayıtla bir şablona bağlanır. **Şablonu olmayan gün kapalıdır** — o gün okul yoktur. Tenant başına yedi kayıt bulunur ve gün başına yalnız bir atama olabilir.

## Kurallar

- Ders sırası 1-20 aralığındadır — [[Ders Programı]]'ndaki ders saati sınırıyla aynı aralık.
- Bitiş saati başlangıçtan sonra olmalıdır.
- Yalnız "ders" tipindeki slotlar programın ders saatlerini oluşturur; teneffüs ve öğle arası sıralamaya girmez.
- Çizelge okula özeldir.
- Bir güne şablon atanmamışsa o gün kapalıdır.

## İlişkiler

- [[Ders Programı]] — ders sırasının zamana çevrildiği yer
- [[Yoklama Oturumu]] — oturumun başlangıç ve bitiş saati buradan gelir
- [[Okul Ayarları]] — aynı ayar yüzeyinde yönetilir, ayrı kayıttır
- [[Dönem]] — dolaylı; çizelge okula ait olduğu için döneme bağlı değildir

## Geçtiği modüller

- [[Okul Yönetimi]] — kavramın sahibi; ders saatleri ve gün-şablon ataması
- [[Ders Programı Yönetimi]] — tüketici görünümlerinde ders saatlerini etiketlemek için okunur
- [[Yoklama ve Devamsızlık]] — oturumun saat aralığı

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- Çizelge döneme veya sezona bağlı değil, doğrudan okula ait. Dönem ortasında zil düzeni değişirse geçmiş günlerin ders saatleri geriye dönük olarak yeni saatlerle mi görünecek?
- ~~Hangi günün hangi şablonu kullanacağını belirleyen kural bulunamadı.~~ → **Cevaplandı:** ayrı bir gün-şablon ataması kaydı var; şablonsuz gün kapalı sayılıyor.
- Gün kapalı işaretlendiğinde o güne ait ders programı yerleşimlerine ve yoklama oturumlarına ne oluyor? Üretim bu ayarı okuyor mu?
