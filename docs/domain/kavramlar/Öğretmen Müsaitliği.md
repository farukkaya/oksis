---
aliases: [TeacherAvailability, Müsaitlik, Öğretmen Tercihi]
tags: [domain/academic]
table: academic.teacher_availabilities
status: active
last-synced: 2026-09-13 (294ffe6)
---

# Öğretmen Müsaitliği

<!-- generated:start -->

## Nedir

Bir öğretmenin bir [[Dönem]]'deki haftalık uygunluk ve tercih tablosu. Hangi saatlerde ders veremeyeceğini ya da vermeyi tercih etmediğini söyler.

İki farklı ağırlıkta işaret taşır ve fark önemlidir: **"tercih etmiyorum"** yumuşaktır — otomatik üretim bundan kaçınmaya çalışır ama gerekirse yerleştirir. **"müsait değilim"** serttir — engeldir, yalnız yönetici bilerek aşabilir.

Kayıt **seyrektir**: yalnız bu iki işaretten biri konmuş saatler saklanır. Satırın yokluğu "müsait" demektir. Bu yüzden tablo, haftanın tüm saatlerini değil yalnız istisnaları tutar.

## Yaşam döngüsü

Dönem başına kurulur ve güncellenir. Bir saati "müsait"e çevirmek kayıt eklemez, var olan satırı **siler** — seyrek depolamanın gereği.

**Müsaitlik değişince mevcut yerleşimler taşınmaz.** Kaydetme yalnız dönemdeki programların "müsait değil slota düşen yerleşim" sayaçlarını yeniden hesaplar; programı düzeltmek yöneticinin kararıdır.

## Kurallar

- Yalnız "tercih etmiyorum" ve "müsait değilim" saklanır; "müsait" girişleri sessizce yok sayılır.
- Ders saati sırası geçerli aralıkta olmalıdır (1-20).
- Gün değeri gerçek takvim günüdür. Sistem yalnız hafta içini kullanır, ancak kayıt doğrulaması bugün 0-6 aralığını kabul ediyor — hafta sonu girişini engelleyen bir kural yok ([[0013-gun-degeri-gercek-system-dayofweek]]).
- Aynı gün ve saat için ikinci bir işaret üzerine yazılır, çoğalmaz.
- **Tek yazma yüzeyi yöneticidir.** Öğretmen kendi müsaitliğini doğrudan düzenlemez; öğretmenin kendi girişi kapsam dışıdır.
- [[Ders Programı]] üzerinde "müsait değil" işaretli slota düşen yerleşimler sayılır ve program üzerinde bir uyarı sayacı olarak taşınır.
- **İhlal yayını engellemez.** Yayını engelleyenler boş program ve — bilinçli onay verilmedikçe — müfredata göre eksik saattir. Müsaitlik ihlali yalnız sayaçta görünür.

## Nöbette nasıl okunuyor

Nöbet tarafında iki farklı davranış vardır ve ikisi de bilinçlidir:

- **Otomatik nöbet dağıtımı müsaitliği gün seviyesinde okur.** Bir günde tek bir "müsait değil" saati o günün tamamını otomatik nöbete kapatır (sert); tek bir "tercih etmiyorum" saati o güne ceza puanı ekler (yumuşak). Saat bazındaki kaydı güne indirgemek bilinçli bir MVP sadeleştirmesidir. Yönetici elle atamayla yine o güne nöbet koyabilir — sert eleme yalnız otomatik yerleştirmededir.
- **Elle nöbet ataması, yancı adayı ve vekil adayı müsaitliğe hiç bakmaz.** Müsaitlik ders saatlerinin planlama girdisidir. Yancı ve vekil için sorulan soru ise "bu öğretmen o saatte fiilen derste mi" sorusudur ve yayınlanmış yerleşimlerden cevaplanır. Vekâlet ayrıca tepkiseldir: öğretmen gelmediği sabah dakikalar içinde karar verilir, önceden girilmiş bir tercih o anın boşluk sorusunu cevaplamaz.

## İlişkiler

- [[Profil]] — müsaitliğin öznesi; öğretmen profili
- [[Dönem]] — müsaitlik bir döneme aittir
- [[Ders Programı]] — yerleştirmede uyarı ve engel kaynağı, ihlal sayacının girdisi
- [[Nöbet Çizelgesi]] — otomatik dağıtımda gün seviyesinde girdi; elle atamada girdi değil
- [[Program İstisnası]] — vekil adaylığında bilinçli olarak okunmaz

## Geçtiği modüller

- [[Ders Programı Yönetimi]] — kavramın sahibi; işaretleme ve otomatik üretim girdisi
- [[Nöbetler]] — otomatik nöbet dağıtımında gün seviyesinde okunur; elle atama, yancılık ve vekâlette okunmaz

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- Öğretmen kendi müsaitliğini göremiyor/giremiyor; tek yüzey yönetici. Bu bilinçli bir kısıt mı, yoksa henüz yapılmamış bir ekran mı?
