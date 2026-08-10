---
aliases: [Duties, api/v1/duties, Nöbet, Vekâlet]
tags: [domain/academic, module]
status: completed
last-synced: 2026-08-10 (2270867)
---

# Nöbetler

<!-- generated:start -->

## Ne yapar

Okulun nöbet düzenini kuran modül: nöbet bölgeleri tanımlanır, muaf öğretmenler işaretlenir, dönemin çizelgesi elle ya da otomatik dağıtımla hazırlanır, yayınlanır ve yıl içinde sürüm sürüm güncellenir. Öğretmen kendi nöbetlerini ve yükünü buradan görür; yönetici okul genelindeki yük dağılımını raporlar.

Modülün kurucu fikri **adalettir**. Nöbet sahada en çok tartışılan yüktür; otomatik dağıtımın hedefi hızlı çizelge üretmek değil, yükü ölçülebilir biçimde dengelemektir — bu yüzden sonuç metriklerle birlikte döner ve yönetici uygulamadan önce görür.

İkinci fikir **sürüm zinciridir**: çizelge güncellenmez, yenisi yayınlanır. "Geçen ay kim nöbetçiydi" sorusunun cevabı hiçbir zaman kaybolmaz.

## Ayrıca burada: vekâlet

Modülde nöbet olmayan bir alan daha yaşıyor — **ders vekâleti** (öğretmen gelmediğinde derse kimin gireceği). Aynı izin ailesinde ve aynı uçta durur, çünkü ürün olarak aynı kişinin aynı sabah yaptığı iştir. Kayıt ise nöbete değil ders programına aittir: [[Program İstisnası]].

## Kullandığı kavramlar

- [[Nöbet Çizelgesi]] — modülün ana aggregate'i; atamalar içinde yaşar
- [[Nöbet Bölgesi]] — nöbetin tutulduğu yer; kapasite kuralının kaynağı
- [[Nöbet Muafiyeti]] — dağıtımı ve atamayı engelleyen kayıt
- [[Program İstisnası]] — vekâletin ve etüdün yazıldığı kayıt
- [[Dönem]] — çizelge bir döneme aittir
- [[Profil]] — nöbetçi, yancı ve vekil; öğretmen profili
- [[Branş]] / [[Ders]] — vekil adayının uyum sıralaması

## Ana akışlar

1. **Bölge kataloğu** — Okul kendi nöbet bölgelerini platform şablonlarından kopyalayarak ya da sıfırdan tanımlar. Kapasite, o bölgede aynı gün kaç kişinin paralel nöbet tutacağıdır ve dağıtımın hücre sınırıdır.

2. **Muafiyet** — Sürekli veya tarih aralıklı muafiyet verilir; gerekçe zorunludur. Muaf öğretmen ne dağıtım havuzuna girer ne de elle atanabilir.

3. **Çizelge hazırlama** — Dönemin taslağı üzerinde öğretmen, gün ve bölge seçilerek atama yapılır. Dört kural aggregate içinde zorlanır: muaf öğretmene atama yok, aynı öğretmene aynı gün ikinci nöbet yok, bölge kapasitesi aşılmaz, yancı nöbetçinin kendisi olamaz ve o gün başka nöbette görevli olamaz.

4. **Otomatik dağıtım** — Kuyruğa alınan bir iş olarak çalışır ve üç aşamalıdır: (1) **önce kapsama** — her aktif hücreye en az bir nöbetçi, en az yüklü öğretmenden başlayarak; (2) **sonra fazlalık** — haftalık hedefine ulaşmamış öğretmenler boş kapasiteye dengeli yayılır; (3) **yancı** — okul ayarı açıksa her nöbete en az yüklü uygun yancı. Hücre sırası deterministiktir, yani aynı girdi aynı çizelgeyi üretir.

   İki kipte çalışır: sıfırdan üretme, ya da mevcut atamaları koruyup boşlukları doldurma. Sonuç doğrudan uygulanmaz — iş `Kuyrukta → Çalışıyor → Bitti | Çözüm Yok | Başarısız` durumlarından geçer, yönetici önizler ve ayrı bir adımla uygular. Çözüm bulunamazsa neyin engellediğine dair ipuçları döner.

5. **Adalet ölçümü** — Dağıtım sonucu yalnız atamaları değil metrikleri de taşır: en az ve en çok yük, ortalama, varyans ve öğretmen başına nöbet/yancılık sayısı. Kararı yönetici verir, sistem yükü görünür kılar.

6. **Yayın ve sürümleme** — Boş çizelge yayınlanamaz. Yayın anında etkilenen öğretmenlere bildirim gider; aynı çizelge ve sürüm için tekrar gönderilmez. Değişiklik gerektiğinde canlı sürüm bitiş tarihiyle kapatılır ve atamaları kopyalanmış yeni bir taslak doğar. Silme yoktur.

7. **Vekâlet** — Bir öğretmen gelmediğinde o günün dersi için vekil atanır. Adaylar branş uyumuna göre üç kovada sunulur (aynı, yakın, farklı). Uygunluk hesabı **yalnızca yapısal ders yerleşimlerine ve mevcut vekâletlere** bakar; öğretmen müsaitlik kayıtları kasıtlı olarak dışarıda tutulur. Vekil bulunamazsa ders etüde çevrilir. Geri alma yumuşaktır ve yayınlanmış programı kirletmez.

8. **Yük raporu ve kişisel görünüm** — Yönetici dönem aralığında sürüm-doğru yük raporunu alır; öğretmen kendi nöbetlerini ve kendi yükünü görür. Rapor sık sorulduğu için kısa ömürlü önbelleğe alınır.

**Yetki:** Okuma `duties.view`, yönetim `duties.manage`, yük raporu `duties.view-load`, vekâlet `duties.substitute`. Nöbet düzeninin tamamı yönetim iznine bağlıdır; öğretmenin gördüğü tek şey kendi nöbetleri ve kendi yüküdür.

**Okul ayarları:** Yancılık açık mı, haftalık nöbet sıklığı ne, nöbet günleri haftaya yayılı mı ardışık mı — üçü de [[Okul Ayarları]] kaydında tutulur ve dağıtımın girdisidir.

## Kapsam dışı

- **Nöbet tutuldu mu takibi.** Modül planı üretir; nöbetin fiilen tutulup tutulmadığına dair bir yoklama kaydı yoktur.
- **Ders yoklaması.** Nöbetçi öğretmenin ders yoklamasıyla bir bağı yoktur. Vekâlet yoklamayı etkiler ama bu [[Program İstisnası]] üzerinden olur, nöbet çizelgesi üzerinden değil — bkz. [[Yoklama ve Devamsızlık]].
- **Ders programının kendisi.** Vekâlet programın üstüne bir katman yazar; programı bu modül kurmaz.

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- **Nöbet bölgesi silinirken kullanımda kontrolü yok.** [[Derslik]] silinirken "bir şube kullanıyor" diye engelleniyor; nöbet bölgesi doğrudan siliniyor. Yayınlanmış çizelgede o bölgeye ait atamalar varsa beklenen davranış ne?
- Çizelge sezon kimliğini eski `AcademicYearId` adıyla taşıyor; diğer modüller `AcademicSessionId`'ye taşındı. Kalıntı mı?
- Haftalık nöbet sıklığı ve gün deseni ayarları kodda "şimdilik etkisiz, sonraki fazın dağıtım girdisi" diye işaretli, ama yazılabiliyor ve dağıtım haftalık hedef kullanıyor. Bu politikalar artık bağlı mı, hâlâ etkisiz mi?
- Vekil uygunluğu öğretmen müsaitlik kayıtlarına bakmıyor ve bu kod içinde açık bir kural olarak duruyor. Gerekçesi ne?
- Yancı aday sorgusu `duties.manage` ile korunuyor, benzer okuma sorguları `duties.view` ile. Bilinçli mi?
- Yayınlanmış çizelgede nöbetçi olan öğretmene sonradan muafiyet verilirse mevcut atamalara ne oluyor? Muafiyet tarafında bir denetim görünmüyor.
