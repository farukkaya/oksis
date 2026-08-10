---
aliases: [Timetable, Scheduling, api/v1/timetable]
tags: [domain/academic, module]
status: completed
last-synced: 2026-08-10 (2270867)
---

# Ders Programı Yönetimi

<!-- generated:start -->

## Ne yapar

Okulun haftalık ders programını kuran, çakışmasız tutan, yayınlayan ve tüketiciye ulaştıran modül. Yönetici her şube için programı elle örer ya da otomatik ürettirir, çakışmaları ve eksik saatleri görür, hazır olunca yayınlar. Öğretmen, öğrenci ve veli kendi programını buradan okur. Günlük sapmalar (iptal, vekâlet, derslik değişikliği) programı bozmadan üstüne biner.

Modülün taşıyıcı fikri **rezervasyon**: bir yerleşim ancak programı canlıysa öğretmeni, dersliği ve şubeyi o saat için tutar. Taslaklar hiçbir şey tutmaz — bu yüzden aynı öğretmeni aynı saate koyan beş taslak yan yana durabilir ve kimse çakışma görmez. Çakışma yalnız yayına çıkıldığında gerçek olur.

İkinci fikir **snapshot**: tüketici programın canlı hâlini değil son yayınlanmış kopyasını görür. Yönetici düzenlemeye başladığında kimsenin ekranı anında değişmez.

## Kullandığı kavramlar

- [[Ders Programı]] — modülün ana aggregate'i; yerleşimler içinde yaşar
- [[Program Sürümü]] — yayın anının değişmez kopyası; tüketicinin gördüğü şey
- [[Program İstisnası]] — tek güne özel sapma
- [[Öğretmen Müsaitliği]] — yerleştirmede uyarı ve engel
- [[Zil Çizelgesi]] — ders sırasının saate karşılığı
- [[Şube]] — programın sahibi sınıf *(kodda `Branch` adıyla)*
- [[Ders]] / [[Derslik]] / [[Profil]] — yerleşimin ders, mekân ve öğretmen ayakları
- [[Dönem]] — program bir döneme aittir
- [[Şube Ders Görevlendirmesi]] — hangi öğretmenin hangi dersi vereceğinin ve haftalık saatin kaynağı

## Ana akışlar

1. **Program kurma** — Şube ve dönem için taslak açılır. Boş başlar, ya elle örülür ya otomatik üretimden doldurulur.

2. **Yerleştirme ve düzenleme** — Ders bir güne ve ders saatine konur, taşınır, öğretmeni veya dersliği değiştirilir, kaldırılır. Kaldırma pasifleştirmedir; kayıt durur ama slot serbest kalır. Yayındaki bir programa ilk düzenleme kaydedildiğinde program kendiliğinden **Revize**'ye geçer — salt bakmak tetiklemez.

3. **Çakışma koruması iki katmanlı** — Şubenin aynı saatte iki ders görememesi aggregate içinde kesindir. Öğretmen ve derslik çakışması ise başka şubelerin programını ilgilendirdiği için aggregate sınırını aşar: uygulama katmanı doluluk ön kontrolü yapar, son sözü veritabanındaki filtreli tekil index söyler. Index yalnız rezerve eden yerleşimleri kapsar.

4. **Blok ders** — En az iki yerleşim, aynı günde ve ardışık saatlerde bloklanır. Blok bütünlüğü aggregate içinde korunur.

5. **Ön kontrol ve eksikler** — Yayından önce yerleştirilmemiş saatler, çakışmalar ve müsaitlik ihlalleri listelenir. Bu üç sayı program üzerinde denormalize olarak da taşınır ve hub listesini besler.

6. **Otomatik üretim** — Kuyruğa alınan bir iş olarak çalışır; kapsamı tek şube, bir kademenin tüm şubeleri ya da görevlendirmesi olan tüm sınıflar olabilir. Talepler önce "en az yerleştirme seçeneği olan önce" diye sıralanır, sonra tek geçişte açgözlü yerleştirilir. **Üç farklı slot tercih stratejisi** ayrı ayrı çalıştırılır (sabah önce, öğretmen boşluğunu azaltan, günlere dengeleyen) ve üç aday üretilir. Adaylar önce eksik saate, sonra puana göre sıralanır; ilki "önerilen" olur. Katı kipte en iyi aday bile eksik bırakıyorsa çözüm yok denir ve **gevşetme önerileri** döner. Sonuç doğrudan uygulanmaz — yönetici seçip ayrı adımla uygular, ve uygulama yalnız boş bir taslağa yapılır.

7. **Yayın** — Boş program yayınlanamaz. Yayın anında bir [[Program Sürümü]] yazılır ve yerleşimler rezerve etmeye başlar. Aynı şube için canlı bir kardeş program varsa o taslağa indirilir (silinmez), rezervasyonları bırakır.

8. **Sürüm geçmişi ve geri dönüş** — Sürümler listelenir, karşılaştırılır, geçmiş bir sürüme dönülebilir. Dönüş programı o snapshot'tan yeniden kurar ve **Revize** durumunda bırakır; yayınlamak ayrı adımdır.

9. **Günlük istisna** — Yayınlanmış programa dokunmadan tek gün için iptal, vekâlet veya derslik değişikliği yazılır. Önizlemesi vardır, geri alınması yumuşaktır. Vekâlet yüzü [[Nöbetler]] modülünden de yönetilir.

10. **Tüketici görünümleri** — Şube haftalık, öğretmenin kendi haftalık ve günlük programı, öğrencinin kendi programı, velinin çocuğunun programı. Hepsi yayın snapshot'ı üzerinden beslenir ve o günün istisnalarıyla katmanlanır; ders saatleri [[Zil Çizelgesi]]'nden etiketlenir.

11. **Silme** — Önizlemesi vardır. Silme tüm aktif yerleşimleri pasifleştirir; tekil index'ler yalnız aktif yerleşimleri kapsadığı için slotlar bu sayede serbest kalır.

**Yetki:** Düzenlemenin tamamı `timetable.manage`. Yayın `timetable.publish`, silme `timetable.delete`, tüm sınıfları görme `timetable.view-all` ile ayrılmış. Yerleştirme, taşıma, öğretmen atama ve istisna işlemleri ayrıca `timetable.override` tanır — sert kısıtın (öğretmen "müsait değil" demiş) yönetici tarafından bilerek aşılabilmesi için. Derslik kataloğu bu modülde yaşar ama izni [[Sınıflar ve Şubeler]] ailesindedir (`class-rooms.manage`).

## Kapsam dışı

- **Saat değişikliği istisnası.** Zaman programın değil [[Zil Çizelgesi]]'nin işi olduğu için böyle bir istisna türü yok.
- **Otomatik üretimde blok ders.** İlk dilimde kapalı; bloklar elle kuruluyor.
- **Öğretmenin kendi müsaitliğini girmesi.** Tek yazma yüzeyi yönetici.

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- **Otomatik üretimin hedefi ile beklenti çelişiyor olabilir.** Üç slot stratejisinin ikisi dersleri güne yayacak şekilde sıralıyor, puanlayıcı da günlere dengeli dağılımı ödüllendiriyor (tek güne yığılma en kötü denge sayılıyor). Yani "dersler haftaya yayılıyor" bir yan etki değil, **hedefin kendisi**. Beklenen davranış farklıysa bu bir hata düzeltmesi değil hedef değişikliğidir.
- Aday seçimi eksik saat ve puana bakıyor; görsel/pedagojik eksen bir seçim ölçütü değil. Ölçüt eklenmeli mi?
- Durum enum'unun açıklaması "Yayında sonraki fazda devreye girer" diyor, oysa yayın ve tüketici akışları çalışıyor — bayat faz notu.
- Program üzerindeki üç denormalize istatistiğin her mutasyondan sonra yeniden hesaplandığı doğrulanamadı. Bayatlarsa hub listesi yanlış gösterir.
- Sezon kimliği modülün dört varlığında da hâlâ eski `AcademicYearId` adıyla taşınıyor.
