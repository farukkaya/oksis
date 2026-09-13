---
aliases: [Timetable, Scheduling, api/v1/timetable]
tags: [domain/academic, module]
status: completed
last-synced: 2026-09-13 (294ffe6)
---

# Ders Programı Yönetimi

<!-- generated:start -->

## Ne yapar

Okulun haftalık ders programını kuran, çakışmasız tutan, yayınlayan ve tüketiciye ulaştıran modül. Yönetici her şube için programı elle örer ya da otomatik ürettirir, çakışmaları ve eksik saatleri görür, hazır olunca yayınlar. Öğretmen, öğrenci ve veli kendi programını buradan okur. Günlük sapmalar (iptal, vekâlet, derslik değişikliği) programı bozmadan üstüne biner.

Modülün taşıyıcı fikri **rezervasyon**: bir yerleşim ancak programı canlıysa öğretmeni, dersliği ve şubeyi o saat için tutar. Taslaklar hiçbir şey tutmaz — bu yüzden aynı öğretmeni aynı saate koyan beş taslak yan yana durabilir ve kimse çakışma görmez. Çakışma yalnız yayına çıkıldığında gerçek olur.

İkinci fikir **snapshot**: tüketici programın canlı hâlini değil son yayınlanmış kopyasını görür. Yönetici düzenlemeye başladığında kimsenin ekranı anında değişmez.

Üçüncü fikir **tek kaynak**: program görevlendirmeyi tüketir, üretmez. Kimin hangi dersi verebileceği [[Ders Görevlendirmesi]]'nden, kaç saat verileceği müfredattan gelir; yayınlanan program da öğretmen yükünün tek kaynağı olur. Aynı soruya elle tutulan ikinci bir kayıttan cevap verilmez.

## Kullandığı kavramlar

- [[Ders Programı]] — modülün ana aggregate'i; yerleşimler içinde yaşar
- [[Program Sürümü]] — yayın anının değişmez kopyası; tüketicinin gördüğü şey
- [[Program İstisnası]] — tek güne özel sapma
- [[Öğretmen Müsaitliği]] — yerleştirmede uyarı ve engel
- [[Zil Çizelgesi]] — ders sırasının saate karşılığı
- [[Şube]] — programın sahibi sınıf *(kodda `Branch` adıyla)*
- [[Ders]] / [[Derslik]] / [[Profil]] — yerleşimin ders, mekân ve öğretmen ayakları; profil ayrıca haftalık kapasiteyi taşır
- [[Dönem]] — program bir döneme aittir
- [[Ders Görevlendirmesi]] — hangi öğretmenin hangi dersi verebileceğinin kaynağı (yetkinlik)
- [[Haftalık Ders Saati]] — üretimde ve eksik saat hesabında haftalık saatin kaynağı
- [[Dağıtım Kısıtı]] — yöneticinin üretime verdiği pin / hariç tutma niyeti

## Ana akışlar

1. **Program kurma** — Şube ve dönem için taslak açılır. Boş başlar, ya elle örülür ya otomatik üretimden doldurulur.

2. **Yerleştirme ve düzenleme** — Ders bir güne ve ders saatine konur, taşınır, öğretmeni veya dersliği değiştirilir, kaldırılır. Kaldırma pasifleştirmedir; kayıt durur ama slot serbest kalır. Yayındaki bir programa ilk düzenleme kaydedildiğinde program kendiliğinden **Revize**'ye geçer — salt bakmak tetiklemez.

3. **Çakışma koruması iki katmanlı** — Şubenin aynı saatte iki ders görememesi aggregate içinde kesindir. Öğretmen ve derslik çakışması ise başka şubelerin programını ilgilendirdiği için aggregate sınırını aşar: uygulama katmanı doluluk ön kontrolü yapar, son sözü veritabanındaki filtreli tekil index söyler. Index yalnız rezerve eden yerleşimleri kapsar.

4. **Blok ders** — En az iki yerleşim, aynı günde ve ardışık saatlerde bloklanır. Blok bütünlüğü aggregate içinde korunur.

5. **Ön kontrol ve yayın önizlemesi** — Yayından önce yerleştirilmemiş saatler, çakışmalar ve müsaitlik ihlalleri listelenir; bu üç sayı program üzerinde denormalize olarak da taşınır ve hub listesini besler. Yayın önizlemesi sonucu üç ağırlıkta verir:
   - **Engeller:** boş program.
   - **Onay ister:** müfredata göre eksik saat — yönetici "eksik saatle yayınla" demedikçe yayın reddedilir. Eksik saat derse göre sayılır, (ders, öğretmen) çiftine göre değil: öğretmeni değiştirmek dolu bir slotu eksik göstermez.
   - **Uyarır, engellemez:** öğretmen kapasite aşımı (taslaktaki saatler + aynı dönemin diğer şubelerindeki canlı saatler, kişisel kapasiteye karşı; ders dışı yük bu hesaba girmez) ve [[Dağıtım Kısıtı]] ihlali. İkisi de bilinçli olarak yumuşaktır: "görünür olsun, kilitlemesin".
   
   Önizleme ayrıca etkilenen öğretmen, öğrenci ve veli sayısını gösterir.

6. **Otomatik üretim** — Kuyruğa alınan bir iş olarak çalışır; kapsamı tek şube, bir kademenin tüm şubeleri ya da görevlendirmesi olan tüm sınıflar olabilir. Talepler önce "en az yerleştirme seçeneği olan önce" diye sıralanır, sonra tek geçişte açgözlü yerleştirilir. **Üç farklı slot tercih stratejisi** ayrı ayrı çalıştırılır (sabah önce, öğretmen boşluğunu azaltan, günlere dengeleyen) ve üç aday üretilir. Adaylar önce eksik saate, sonra puana göre sıralanır; ilki "önerilen" olur. Katı kipte en iyi aday bile eksik bırakıyorsa çözüm yok denir ve **gevşetme önerileri** döner.

   - **Talebin kaynağı:** her şube için şube × ders × saat × öğretmen satırları yetkinlik kaydından ve müfredattan türetilir. Birden çok yetkin öğretmen varsa şubeler kapasiteye göre dengeli ve deterministik dağıtılır; [[Dağıtım Kısıtı]] bu seçimden önce uygulanır. Ayrıntı: [[Ders Görevlendirmesi]] → Programı nasıl besliyor.
   - **Çok şubeli kapsam tek ortak çözümdür.** Kapsamdaki bütün şubelerin talepleri tek havuzda toplanır; öğretmen ve derslik şubeler arasında ortak kaynaktır ve kapsamdaki şubeler birbirini ortak doluluk üzerinden dışlar. Kapsam dışındaki canlı programlar dış doluluk olarak girer. Şubeleri sırayla üretip öncekini dolu girdi yapmak **reddedildi**: sıra önyargısı yaratır.
   - **Aynı dersten günde en fazla 2 saat** — sert kısıttır, ağırlık ayarından kapatılabilir.
   - **2'li blok eğilimi** — Türk okul deseni ikili derstir; talep ikili bloklara bölünür ve aynı dersin yanındaki slot tercih edilir. Yumuşaktır: kapsamı düşürmez. Üretim blok işaretini kendisi koymaz.
   - **Uygulama:** sonuç doğrudan uygulanmaz. Yönetici bir aday seçer; seçilen aday kapsamdaki **her şube için ayrı yeni bir taslak** açar ve mevcut programlara dokunmaz. Çok şubeli kipte şube başına ayrı aday seçimi yoktur — ortak çözüm şubeleri birbirine bağladığı için bir şubenin adayını değiştirmek diğerlerinin geçerliliğini bozardı. Uygulama iş + şube başına **idempotenttir**: aynı işten aynı şubeye ikinci uygulama yeni taslak açmaz, mevcut olanı döner.

7. **Dağıtım kısıtları** — Yönetici şube × ders hücresine "şu öğretmen versin" (pin) ya da "şu öğretmen vermesin" (hariç tutma) niyeti koyar, günceller, kaldırır. Kısıt programa yazmaz; yalnız bir sonraki üretimi yönlendirir ve yayın önizlemesinde ihlali ölçülür.

8. **Yayın** — Boş program yayınlanamaz. Yayın anında bir [[Program Sürümü]] yazılır ve yerleşimler rezerve etmeye başlar. Aynı şube için canlı bir kardeş program varsa o taslağa indirilir (silinmez), rezervasyonları bırakır. Yayın ekranında bildirim seçeneği açıksa şubenin öğrenci ve velilerine bildirim gider; **ilk yayın ve yeniden yayın farklı metin** alır ve aynı sürüm için bildirim tekrar gönderilmez. Yayın öğretmen yükü önbelleğini tazeler.

9. **Sürüm geçmişi ve geri dönüş** — Sürümler listelenir, karşılaştırılır, geçmiş bir sürüme dönülebilir. Dönüş programı o snapshot'tan yeniden kurar ve **Revize** durumunda bırakır; yayınlamak ayrı adımdır. Dönüş **bildirim üretmez**: yeni sürüm doğmaz, tüketici değişikliği sonraki yayınla görür.

10. **Günlük istisna** — Yayınlanmış programa dokunmadan tek gün için iptal, vekâlet veya derslik değişikliği yazılır. Önizlemesi vardır, geri alınması yumuşaktır. Oluşturma şubenin öğrenci ve velilerine ve ilgili öğretmenlere, geri alma şubenin öğrenci ve velilerine bildirilir. Vekâlet yüzü [[Nöbetler]] modülünden de yönetilir.

11. **Tüketici görünümleri** — Şube haftalık, öğretmenin kendi haftalık ve günlük programı, öğrencinin kendi programı, velinin çocuğunun programı. Hepsi yayın snapshot'ı üzerinden beslenir ve o günün istisnalarıyla katmanlanır; ders saatleri [[Zil Çizelgesi]]'nden etiketlenir. Gün değeri gerçek takvim günü olduğu için "bugünün dersleri" dönüşümsüz doğru gün seçer ([[0013-gun-degeri-gercek-system-dayofweek]]).

12. **Silme** — Önizlemesi vardır. Silme tüm aktif yerleşimleri pasifleştirir ve programı yumuşak siler; programın **bütün sürümleri ve istisnaları da** birlikte yumuşak silinir. Tekil index'ler yalnız aktif yerleşimleri kapsadığı için slotlar serbest kalır; dönemdeki kardeş programların çakışma sayaçları yeniden hesaplanır. Şubenin öğrenci ve velilerine "program kaldırıldı" bildirimi gider.

**Yetki:** Düzenlemenin tamamı `timetable.manage` — dağıtım kısıtı yazma dahil; kısıt listesi `timetable.view-all`. Yayın `timetable.publish`, silme `timetable.delete`, tüm sınıfları görme `timetable.view-all` ile ayrılmış. Yerleştirme, taşıma, öğretmen atama ve istisna işlemleri ayrıca `timetable.override` tanır — sert kısıtın (öğretmen "müsait değil" demiş) yönetici tarafından bilerek aşılabilmesi için. Derslik kataloğu bu modülde yaşar ama izni [[Sınıflar ve Şubeler]] ailesindedir (`class-rooms.manage`).

## Kapsam dışı

- **Saat değişikliği istisnası.** Zaman programın değil [[Zil Çizelgesi]]'nin işi olduğu için böyle bir istisna türü yok.
- **Otomatik üretimde blok grubu.** Üretim ikili yan yana yerleşim eğilimi taşır ama blok grubu kurmaz; uygulanan taslakta bloklar elle işaretlenir.
- **Öğretmenin kendi müsaitliğini girmesi.** Tek yazma yüzeyi yönetici.
- **Görevlendirme yazmak.** Program yetkinlik kaydını ve kısıtları okur; hiçbirini üretmez.

## Açık Sorular (koddan doğrulanamayan)

- Çift kuşak (sabahçı-öğlenci), seçmeli ders grupları, birleştirilmiş ders ve anaokulu etkinlik programı kodda karşılıksız görünüyor. Bunlar bilinçli olarak kapsam dışı mı, yoksa henüz ele alınmadı mı?
- Yayın önizlemesindeki çakışma sayısı hesaplanmıyor, sabit 0 dönüyor (`TB-77` bu kısmı bilerek dışarıda bıraktı). Programlar arası öğretmen/derslik çakışmasını yayın anında yalnız veritabanı index'i mi yakalıyor?
- Otomatik üretim işinde müsaitlik girdisi "Faz 4'e kadar etkisiz" diye yorumlanmış, oysa müsaitlik okunup çözücüye veriliyor. Yorum bayat mı, çözücü müsaitliği gerçekten kullanıyor mu?

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- **Otomatik üretimin hedefi ile beklenti çelişiyor olabilir.** Üç slot stratejisinin ikisi dersleri güne yayacak şekilde sıralıyor, puanlayıcı da günlere dengeli dağılımı ödüllendiriyor (tek güne yığılma en kötü denge sayılıyor). Yani "dersler haftaya yayılıyor" bir yan etki değil, **hedefin kendisi**. Beklenen davranış farklıysa bu bir hata düzeltmesi değil hedef değişikliğidir.
- Aday seçimi eksik saat ve puana bakıyor; görsel/pedagojik eksen bir seçim ölçütü değil. Ölçüt eklenmeli mi?
- Durum enum'unun açıklaması "Yayında sonraki fazda devreye girer" diyor, oysa yayın ve tüketici akışları çalışıyor — bayat faz notu.
- Program üzerindeki üç denormalize istatistik müsaitlik kaydında ve program silmede yeniden hesaplanıyor. Diğer mutasyonlarda (yerleştirme, taşıma, öğretmen/derslik atama, blok, yayın, sürüme dönüş, üretim uygulama) da yeniden hesaplandığı henüz yazılı değil. Bayatlarsa hub listesi yanlış gösterir.
- Sezon kimliği modülün dört varlığında da hâlâ eski `AcademicYearId` adıyla taşınıyor.
