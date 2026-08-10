---
aliases: [CurriculumHourTemplate, SchoolWeeklyHourOverride, Haftalık Ders Çizelgesi, Müfredat Saati]
tags: [domain/academic]
table: master.curriculum_hour_templates
status: active
last-synced: 2026-08-10 (2270867)
---

# Haftalık Ders Saati

<!-- generated:start -->

## Nedir

Bir [[Ders]]'in belirli bir [[Sınıf Seviyesi]]'nde haftada kaç saat okutulacağı. MEB'in **Haftalık Ders Çizelgesi** kararının karşılığıdır: 9. sınıfta matematik altı saat, felsefe iki saat.

Kavram iki katmanlıdır ve bu ayrım belirleyicidir:

- **MEB şablonu** — platform genelinde, okuldan bağımsız, **sürümlü**. Hangi MEB kararına dayandığını ve hangi sürüm olduğunu üzerinde taşır.
- **Okul override'ı** — okulun kendi sezonunda o dersin saatini değiştirmesi. Gerekçe taşıyabilir.

Çözüm sırası nettir: **override varsa o, yoksa MEB şablonu.** Hiçbiri yoksa o seviye için hedef saat yoktur.

## Yaşam döngüsü

MEB şablonu seed verisiyle gelir ve sürüm etiketiyle yaşar; bugün tek bir aktif sürüm sabit olarak tanımlıdır, sürüm seçimi ileriye bırakılmış.

Okul override'ı sezona bağlıdır: açılır, saati ve gerekçesi güncellenir.

## Kurallar

- MEB şablonunda haftalık saat 1-40 aralığındadır.
- Okul override'ında **alt sınır sıfırdır** — okul bir dersi o seviyede hiç okutmama seçeneğine sahiptir; şablonda bu mümkün değildir.
- Şablon zorunlu/seçmeli ayrımını taşır.
- Sürüm etiketi zorunludur; hangi MEB kararından geldiği kayıtlıdır.
- Kademe burada **kod** olarak taşınır (kimlik değil) — [[Sınıf Seviyesi]]'nin kısa koduyla eşleşir.

## Neye yarıyor

Bir şubenin ders programı kurulurken "bu sınıfın haftada kaç saat dersi olmalı" sorusunun cevabı buradan gelir. [[Ders Programı]]'ndaki **eksik saat** göstergesi, yerleştirilmiş saatler ile bu hedef arasındaki farktır.

## İlişkiler

- [[Ders]] — saatin bağlı olduğu ders
- [[Sınıf Seviyesi]] — hangi kademede kaç saat
- [[Sezon]] — okul override'ı sezona bağlıdır
- [[Ders Programı]] — hedef saat ile yerleşen saat farkı buradan hesaplanır
- [[Şube Ders Görevlendirmesi]] — görevlendirmedeki haftalık saatle **ayrı** alanlardır

## Geçtiği modüller

- [[Müfredat]] — kavramın sahibi; şablon ve override yönetimi
- [[Ders Programı Yönetimi]] — eksik saat hesabının girdisi

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- Görevlendirmedeki haftalık saat ile buradaki hedef saat **birbirini doğrulamıyor** görünüyor. Bir öğretmene müfredat hedefinden fazla saat verilirse bir uyarı çıkıyor mu?
- Aktif MEB sürümü kodda sabit. Yeni bir çizelge kararı çıktığında geçmiş sezonların hesabı nasıl korunacak — sürüm seçimi geldiğinde eski sezonlar eski sürümde mi kalacak?
- Okul override'ının açıklaması "bu spec'te yazma yolu yok" diyor ama yazma komutu ve kendi izni var; açıklama bayat.
