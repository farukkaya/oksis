---
aliases: [TeacherAvailability, Müsaitlik, Öğretmen Tercihi]
tags: [domain/academic]
table: academic.teacher_availabilities
status: active
last-synced: 2026-08-10 (2270867)
---

# Öğretmen Müsaitliği

<!-- generated:start -->

## Nedir

Bir öğretmenin bir [[Dönem]]'deki haftalık uygunluk ve tercih tablosu. Hangi saatlerde ders veremeyeceğini ya da vermeyi tercih etmediğini söyler.

İki farklı ağırlıkta işaret taşır ve fark önemlidir: **"tercih etmiyorum"** yumuşaktır — otomatik üretim bundan kaçınmaya çalışır ama gerekirse yerleştirir. **"müsait değilim"** serttir — engeldir, yalnız yönetici bilerek aşabilir.

Kayıt **seyrektir**: yalnız bu iki işaretten biri konmuş saatler saklanır. Satırın yokluğu "müsait" demektir. Bu yüzden tablo, haftanın tüm saatlerini değil yalnız istisnaları tutar.

## Yaşam döngüsü

Dönem başına kurulur ve güncellenir. Bir saati "müsait"e çevirmek kayıt eklemez, var olan satırı **siler** — seyrek depolamanın gereği.

## Kurallar

- Yalnız "tercih etmiyorum" ve "müsait değilim" saklanır; "müsait" girişleri sessizce yok sayılır.
- Ders saati sırası geçerli aralıkta olmalıdır (1-20).
- Aynı gün ve saat için ikinci bir işaret üzerine yazılır, çoğalmaz.
- **Tek yazma yüzeyi yöneticidir.** Öğretmen kendi müsaitliğini doğrudan düzenlemez.
- [[Ders Programı]] üzerinde "müsait değil" işaretli slota düşen yerleşimler sayılır ve program üzerinde bir uyarı sayacı olarak taşınır.

## Nerede kullanılmıyor

Nöbet vekâleti aday arayışı bu kayıtlara **kasıtlı olarak bakmaz** — kod bunu açık bir kural olarak yazar ve yalnız yapısal ders yerleşimleriyle mevcut vekâletleri dikkate alır. Gerekçesi koddan çıkmıyor; bkz. [[Nöbetler]] açık soruları.

## İlişkiler

- [[Profil]] — müsaitliğin öznesi; öğretmen profili
- [[Dönem]] — müsaitlik bir döneme aittir
- [[Ders Programı]] — yerleştirmede uyarı ve engel kaynağı, ihlal sayacının girdisi

## Geçtiği modüller

- [[Ders Programı Yönetimi]] — kavramın sahibi; işaretleme ve otomatik üretim girdisi
- [[Nöbetler]] — nöbet dağıtımında gün seviyesinde okunur, vekâlette okunmaz

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- Öğretmen kendi müsaitliğini göremiyor/giremiyor; tek yüzey yönetici. Bu bilinçli bir kısıt mı, yoksa henüz yapılmamış bir ekran mı?
- Nöbet dağıtımı müsaitliği **gün seviyesine** indirgiyor (bir günde herhangi bir engelli saat varsa günün tamamı işaretleniyor). Ders programı ise saat bazında okuyor. İki farklı yorum bilinçli mi?
