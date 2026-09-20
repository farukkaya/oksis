---
aliases: [SchoolCurriculumSnapshot, SchoolCurriculumSnapshotItem, SchoolCurriculumDraft, SchoolAcademicProgram, Sezon Müfredat Taslağı, Okul Akademik Programı]
tags: [domain/academic]
table: academic.school_curriculum_snapshots, academic.school_curriculum_drafts, academic.school_academic_programs
status: active
last-synced: 2026-09-20 (736c6ba5)
---

# Sezon Müfredat Snapshotı

<!-- generated:start -->

## Nedir

Bir okulun bir [[Sezon]]'da hangi seviyede hangi dersi haftada kaç saat okuttuğunun kaydı. İki evresi vardır: sezon hazırlıktayken **taslak** (okul değiştirebilir), sezon başladığında **snapshot** (değişmez). "O yıl ne okutuldu" sorusunun tek cevabıdır.

Yapı: sezon × eğitim kademesi başına bir **okul akademik programı** (hangi [[Müfredat Sürümü]] programına bağlı), onun altında seviye başına bir **taslak** (hangi sürümü taban aldığı), taslağın altında okul kararları ([[Haftalık Ders Saati]]). Sezon başlarken her seviye için bir **snapshot** ve satırları üretilir.

## Yaşam döngüsü

1. **Hazırlık** — Sezon açılırken (doğrudan ya da sihirbazla) okulun açık kademeleri için program bağı ve seviye başına taslak kendiliğinden kurulur; eksik çekirdek dersler okul kataloğuna içe aktarılır. İşlem idempotenttir. Yılı tam eşleşen yayımlı sürüm yoksa taslak **manuel** açılır (sürümsüz, yalnız okulun ek dersleri) ve sezon açılışı bloklanmaz. Kurulum **varsayılan** programı verir; okul dilerse başka bir programa geçer (aşağıda).
2. **Önizleme** — Sezonu başlatmak müfredatı geri alınamaz biçimde dondurur, bu yüzden aktivasyondan önce neyin dondurulacağı salt okunur biçimde görülebilir. Açık olduğu hâlde taslağı olmayan bir sınıf seviyesi burada **engel** olarak çıkar: sezon o hâliyle başlarsa o seviye yıl boyunca müfredatsız kalırdı.
3. **Aktivasyon** — `Setup → Active` geçişinde taslak çözülür ve snapshot yazılır; snapshot sezonun aktivasyonuyla **aynı kayıtta** yazılır. Bir hata olursa önceki sezonun arşivlenmesi dahil her şey geri alınır — okul yürürlükte sezonsuz kalmaz.
4. **Başlamış / arşiv** — snapshot okunur, yazılmaz.

Sezon hazırlıktan geri alınırsa (taslağa dönüş, iptal) program, taslak ve okul kararları silinir.

## Okulun karar yüzeyi

Okul hazırlıktaki sezonda dört şey yapabilir:

- **Eğitim programını seçmek.** Kurulum varsayılanı verir; okul Fen Lisesi ile Anadolu Lisesi arasında geçiş yapabilir. Program değişince taslaklar yeni programın yayımlı sürümüne taşınır ve okulun saat kararları **yeniden tabanlamayla aynı** kuraldan geçer — iki ayrı taşıma mantığı yoktur.
- **Farkı görmek.** MEB saati, okul saati ve fark yan yana okunur. Fark bir uyarı değil bilgidir; sıfır saatli ders listede kalır çünkü "bu dersi okutmuyorum" bir karardır. Okulun kendi eklediği dersin MEB karşılığı ve farkı **boştur** — sıfır yazmak "fark yok" demek olurdu.
- **Saat yazmak ve geri almak.** Seviye bazında bütün kararlar tek komutla MEB'e döndürülebilir; okulun kendi eklediği dersler bu işlemde **silinmez**.
- **Güncel sürüme taşınmak (rebase).** Yeni bir MEB sürümü yayımlanması taslağı kendiliğinden değiştirmez; taşıma okulun kararıdır ve önce önizlenebilir. Önizleme ile uygulama aynı hesaptan geçer, tek fark uygulanıp uygulanmadığıdır.

Başlamış sezonda bunların hiçbiri açık değildir; yalnız snapshot okunur.

## Kurallar

- Okul, sezon ve kademe başına **tek** program: bir okul aynı yılda iki lise programı kullanamaz (veritabanı tekilliği).
- Seviye başına tek taslak ve tek snapshot.
- Snapshot oluşturulduktan sonra **değiştirilemez ve silinemez**; kural kayıt anında zorlanır (varlıkta setter olmaması yetmez).
- Snapshot silme kavramı taşımaz; soft-delete alanı yoktur.
- Aktivasyon tekrarında ikinci snapshot üretilmez. Kısmi küme sessizce tamamlanmaz, `CURRICULUM_SNAPSHOT_PARTIAL` ile reddedilir.
- Saat 0 kararı da snapshot'a yazılır (tarihsel karar); çalışma zamanı okuyucusu onu talebe koymaz.
- Okul kataloğunda karşılığı olmayan MEB satırı snapshot'a yazılmaz ("hayalet ders" yok).
- Snapshot, MEB referans saatini ve hangi sürümden dondurulduğunu taşır; sonradan yayımlanan sürüm onu değiştirmez.
- Ders programı saat sağlayıcısı ve gerekli toplam saat hesabı: başlamış sezonda snapshot, hazırlıktaki sezonda taslak okur; master sürüm tablolarını doğrudan okumaz (mimari bekçi).
- Tenant izolasyonu: program, taslak, okul kararı ve snapshot okul kapsamlıdır.
- Program seçimi, saat yazma, sıfırlama ve yeniden tabanlama yalnız **hazırlıktaki** sezonda çalışır.
- Yeniden tabanlamada eşleme **çekirdek ders kimliği** üzerinden yapılır; okul kimliğiyle eşleştirmek sessizce "hiç eşleşme yok" üretir ve bütün kararları kaybettirirdi ([[Ders]] iki kimlik uzayı).
- Yeni sürümde artık olmayan ders **sessizce silinmez**; inceleme listesine taşınır ve kararı okul verir.
- Seçilen programda o yıl için yayımlı sürüm yoksa taslak manuel kalır; bu bir hata değildir.

## İlişkiler

- [[Sezon]] — sezona bağlıdır; aktivasyon dondurur
- [[Müfredat Sürümü]] — taslağın tabanı, snapshot'ın kaynağı
- [[Haftalık Ders Saati]] — okul kararları taslakta yaşar
- [[Sınıf Seviyesi]] — seviye başına taslak/snapshot
- [[Ders Programı]] — eksik saat ve otomatik üretim buradan okur

## Geçtiği modüller

- [[Müfredat]] — kavramın sahibi
- [[Sezon Yönetimi]] — sezon açılışı taslağı kurar, aktivasyon snapshot'ı dondurur, geri alma taslağı siler
- [[Ders Programı Yönetimi]] — saat talebinin kaynağı

<!-- generated:end -->

## Notlar

Eski sürümsüz modelden geçiş göçü (`20260918_curriculum_version_cutover`) her sezonun **tarihsel** seviye kapsamını sezonun şubelerinden ve eski kararlardan çıkarır; bugün kapatılmış ama geçmişte okutulmuş seviye de snapshot alır. Göçte eşleşen yıl yoksa taslak `LEGACY-2025.04-*` uyumluluk sürümüne bağlanır — eski sistemin her sezona uyguladığı tek sürüm buydu. Bu geri düşüş yalnız göçtedir; çalışma zamanı manuel açar.

## Açık Sorular

- Taslağı yeni yayımlanan sürüme taşıma (rebase) ve fark gösterimi Dilim 4'te; o gelene kadar hazırlıktaki bir sezon, sonradan yayımlanan sürümü görmez.
- Başlamış sezonda fark edilen bir saat hatası için düzeltme yolu yok (dönem içi düzeltme/bildirim kapsam dışı).
