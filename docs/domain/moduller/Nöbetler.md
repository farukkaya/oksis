---
aliases: [Duties, api/v1/duties, Nöbet, Vekâlet]
tags: [domain/academic, module]
status: completed
last-synced: 2026-09-13 (294ffe6)
---

# Nöbetler

<!-- generated:start -->

## Ne yapar

Okulun nöbet düzenini kuran modül: nöbet bölgeleri tanımlanır, muaf öğretmenler işaretlenir, dönemin çizelgesi elle ya da otomatik dağıtımla hazırlanır, yayınlanır ve yıl içinde sürüm sürüm güncellenir. Öğretmen kendi nöbetlerini ve yükünü buradan görür; yönetici okul genelindeki yük dağılımını raporlar.

Modülün kurucu fikri **adalettir**. Nöbet sahada en çok tartışılan yüktür; otomatik dağıtımın hedefi hızlı çizelge üretmek değil, yükü ölçülebilir biçimde dengelemektir — bu yüzden sonuç metriklerle birlikte döner ve yönetici uygulamadan önce görür.

İkinci fikir **sürüm zinciridir**: çizelge güncellenmez, yenisi yayınlanır. "Geçen ay kim nöbetçiydi" sorusunun cevabı hiçbir zaman kaybolmaz — ve nöbet yükü bu zincir sayesinde sürüm-doğru hesaplanır.

Üçüncü fikir **nöbetin birimi gün + bölgedir**, ders saati değil. Gözetim teneffüs, öğle ve giriş-çıkış pencerelerinde yapılır; nöbet ile ders saati arasında çakışma kavramı yoktur.

## Ayrıca burada: vekâlet

Modülde nöbet olmayan bir alan daha yaşıyor — **ders vekâleti** (öğretmen gelmediğinde derse kimin gireceği). Aynı izin ailesinde ve aynı uçta durur, çünkü ürün olarak aynı kişinin aynı sabah yaptığı iştir. Kayıt ise nöbete değil ders programına aittir: [[Program İstisnası]].

## Kullandığı kavramlar

- [[Nöbet Çizelgesi]] — modülün ana aggregate'i; atamalar içinde yaşar
- [[Nöbet Bölgesi]] — nöbetin tutulduğu yer; kapasite kuralının kaynağı
- [[Nöbet Muafiyeti]] — dağıtımı ve atamayı engelleyen kayıt
- [[Program İstisnası]] — vekâletin ve etüdün yazıldığı kayıt; nöbet yükünde vekâlet adedinin kaynağı
- [[Öğretmen Müsaitliği]] — yalnız otomatik dağıtımda, gün seviyesinde girdi
- [[Zil Çizelgesi]] — yancı kontrolündeki öğle penceresinin kaynağı
- [[Dönem]] — çizelge bir döneme aittir
- [[Profil]] — nöbetçi, yancı ve vekil; öğretmen profili
- [[Branş]] / [[Ders]] / [[Ders Görevlendirmesi]] — vekil adayının uyum sıralaması

## Ana akışlar

1. **Bölge kataloğu** — Okul kendi nöbet bölgelerini platform şablonlarından kopyalayarak ya da sıfırdan tanımlar. Kapasite, o bölgede aynı gün kaç kişinin paralel nöbet tutacağıdır ve dağıtımın hücre sınırıdır. **Yayınlanmış bir çizelgede kullanılan bölge silinemez** (`TB-16`) — silinseydi atama satırı kalır, bölgesi boş okunurdu; taslakta kullanılan bölgenin silinmesi ise meşru bir düzenleme akışı sayılır.

2. **Muafiyet** — Sürekli veya tarih aralıklı muafiyet verilir; gerekçe zorunludur. Hangi yüzeyin hangi muafiyeti okuduğu farklıdır: elle taslak ve yancı listesi yalnız sürekli muafiyete, otomatik dağıtım dönemle örtüşen geçici muafiyete de bakar (ayrıntı: [[Nöbet Muafiyeti]]).

3. **Çizelge hazırlama** — Dönemin taslağı üzerinde öğretmen, gün ve bölge seçilerek atama yapılır. Dört kural aggregate içinde zorlanır: muaf öğretmene atama yok, aynı öğretmene aynı gün ikinci nöbet yok, bölge kapasitesi aşılmaz, yancı nöbetçinin kendisi olamaz ve o gün başka nöbette görevli olamaz. **Elle atama öğretmen müsaitliğine bakmaz.** Yancı adayı o gün öğle penceresinde fiilen dersi olmayan öğretmendir; okul öğle arası tanımlamamışsa bu kontrol atlanır. Yancı listesi müsaitliğe de bakmaz.

4. **Otomatik dağıtım** — Kuyruğa alınan bir iş olarak çalışır ve üç aşamalıdır: (1) **önce kapsama** — her aktif hücreye en az bir nöbetçi, en az yüklü öğretmenden başlayarak; (2) **sonra fazlalık** — haftalık hedefine ulaşmamış öğretmenler boş kapasiteye dengeli yayılır; (3) **yancı** — okul ayarı açıksa her nöbete en az yüklü uygun yancı. Hücre sırası deterministiktir, yani aynı girdi aynı çizelgeyi üretir.

   Dağıtımın kuralları sert ve yumuşak diye ayrılır — kapsama serttir, adalet yumuşaktır:
   - **Kapsama (sert):** her aktif gün × bölge hücresine en az bir nöbetçi. Dolmayan hücre hata değildir; eksik işaretlenir ve gevşetme ipuçları döner.
   - **Kapasite bir tavandır, talep değildir:** hücredeki gerçek nöbetçi sayısını öğretmen arzı ve haftalık hedef belirler.
   - **Sıklık (yumuşak):** okul ayarındaki sıklık öğretmen başına haftalık hedef nöbet günüdür — haftada iki kez için 2, haftada bir için 1. Kapsama gerektirirse öğretmen hedefin üstüne çıkabilir.
   - **"İki haftada bir" desteklenmez:** tek haftalık tekrar eden şablonda A/B hafta dönüşümü gerektirirdi. Bu sıklık seçiliyken iş kuyruğa alınmadan reddedilir.
   - **Gün düzeni (yumuşak):** "yayılı" nöbet günlerini birbirinden uzak, "ardışık" komşu tercih eder. Sıralamada kapsamadan ve öğretmenin kendi "tercih etmiyorum"undan sonra gelir; desen bir tercihtir, tutturulamadığı hafta hücreyi boş bırakmamalı. (`TB-18`: ayar önceden sonuna kadar taşınıyor ama çözücü ona hiç bakmıyordu.)
   - **Müsaitlik:** gün seviyesinde okunur — bir günde tek bir "müsait değil" saati o günü otomatik nöbete kapatır (sert), "tercih etmiyorum" ceza puanıdır (yumuşak).
   - **Havuz:** ayrılmamış, aktif öğretmenler; sürekli muafiyeti ve dönemle örtüşen geçici muafiyeti olanlar çıkarılır. Yalnız aktif bölgeler hücre olur; çalışma günleri Pazartesi-Cuma.
   - **Tek öneri:** ders programındaki üç aday modeli kullanılmaz; nöbet problemi daha küçük, çoklu strateji marjinal fayda.

   İki kipte çalışır: sıfırdan üretme, ya da mevcut taslak atamalarını koruyup boşlukları doldurma. Sonuç doğrudan uygulanmaz — iş `Kuyrukta → Çalışıyor → Bitti | Çözüm Yok | Başarısız` durumlarından geçer, yönetici önizler ve ayrı bir adımla taslağa uygular; yayın yine ayrı adımdır.

5. **Adalet ölçümü** — Dağıtım sonucu yalnız atamaları değil metrikleri de taşır: en az ve en çok yük, ortalama, varyans ve öğretmen başına nöbet/yancılık sayısı. Kararı yönetici verir, sistem yükü görünür kılar.

6. **Yayın ve sürümleme** — Boş çizelge yayınlanamaz. Yayın anında etkilenen öğretmenlere bildirim gider; aynı çizelge ve sürüm için tekrar gönderilmez. Değişiklik gerektiğinde canlı sürüm bitiş tarihiyle kapatılır ve atamaları kopyalanmış yeni bir taslak doğar. Silme yoktur.

7. **Vekâlet** — Bir öğretmen gelmediğinde o günün dersi için vekil atanır. Vekâlet **planlı değil tepkiseldir**: karar genelde nöbetçi müdür yardımcısınındır ve dakikalar içinde verilir; öğretmen devamsızlığı ayrı bir kayıt olarak tutulmaz. Adaylar o saatte canlı programda dersi olmayan, aynı saatte başka vekâleti olmayan öğretmenlerdir; **müsaitlik kayıtlarına bakılmaz**, çünkü soru "şu an fiilen boşta mı" sorusudur. Sıralama: branş uyumu (aynı → yakın → farklı), sonra o haftaki vekâlet yükü (az olan önce), sonra ad. Vekil bulunamazsa ders etüde çevrilir. Geri alma yumuşaktır ve yayınlanmış programı kirletmez.

8. **Nöbet yükü raporu ve kişisel görünüm** — Aşağıdaki bölüm.

**Yetki:** Okuma `duties.view`, yönetim `duties.manage`, yük raporu `duties.view-load`, vekâlet `duties.substitute`. Nöbet düzeninin tamamı yönetim iznine bağlıdır; öğretmenin gördüğü tek şey kendi nöbetleri ve kendi yüküdür.

**Okul ayarları:** Yancılık açık mı, haftalık nöbet sıklığı ne, nöbet günleri haftaya yayılı mı ardışık mı — üçü de [[Okul Ayarları]] kaydında tutulur. Yancılık ayarı her nöbet yüzeyini kapatıp açar; sıklık ve gün düzeni otomatik dağıtımın girdisidir.

## Nöbet yükü

Adalet iddiasının ölçüsüdür. **Bir kayıt değildir:** tablosu ve yazma yolu yoktur; yayına girmiş çizelgelerden, muafiyetlerden ve vekâlet istisnalarından her sorguda yeniden hesaplanır. Ayrı bir kavram notu açılmadı — kendi kimliği ve yaşam döngüsü yok, yalnız bu modülde hesaplanıyor.

- **Sürüm-doğru toplama.** Dönemle kesişen, yayına girmiş **her** çizelge sürümü sayılır: canlı olan da, yerine yenisi geçmiş kapanmış olan da. Hiç yayınlanmamış taslak sayılmaz. Bir sürümün katkısı = o sürümdeki haftalık atama sayısı × (sürümün yürürlük penceresi ∩ rapor aralığı) içindeki hafta sayısı. Hafta takvim haftasıdır; kısmi hafta tam sayılır. Gerekçe: dönem ortasında çizelge değiştiğinde eski haftaların yükü kaybolmasın.
- **Toplam = nöbet günü + yancılık + vekâlet adedi.** Vekâlet **adet** olarak girer: aynı gün aynı öğretmenin yerine girilen ardışık dersler tek olaydır. Saat ayrıca gösterilir (her istisna bir ders saati). Geri alınmış ve rapor aralığı dışındaki vekâletler sayılmaz. Hesap tek noktadadır; ağırlıklı yük istenirse sözleşme değişmeden değişebilir.
- **Muaf öğretmen** yük tablosundan çıkar ve ayrı muafiyet listesinde görünür: sürekli muafiyeti ya da rapor aralığıyla örtüşen geçici muafiyeti olanlar — ataması olup sonradan muaf edilen öğretmen dahil.
- **Dengeli** = en yüksek toplam − en düşük toplam ≤ 2. Satır etiketi: toplam, yuvarlanmış ortalamanın 1'den fazla üstündeyse "yüksek", 1'den fazla altındaysa "düşük", aksi "normal".
- **Yancılık kapalıysa** yancı verisi gizlenmez, **hiç üretilmez**: yancı sayıları sıfırdır ve yalnız yancılık yapmış öğretmen tabloya girmez.
- **Aralık** verilmezse dönemin başı ve sonu kullanılır.
- **Görünürlük.** Yönetici tam raporu `duties.view-load` ile alır; rapor 120 saniyelik önbellektedir. Öğretmen `duties.view` ile **yalnız kendi satırını ve okulun anonim ortalamasını** görür: sunucu ortalamayı tüm kadrodan hesaplar ama başka öğretmenin satırını döndürmez. Öğretmenin toplamı ortalamanın 1'den fazla üstündeyse "ortalamanın üstünde" işaretlenir; hiç yükü yoksa sıfır satır döner.
- **Dışa aktarım yok** — Excel/PDF bilinçli olarak ertelendi.
- **Farklı bir sayıyla karıştırma:** [[Görevlendirmeler]]'deki öğretmen yükü ekranı, **canlı** çizelgedeki nöbet günü sayısını okul katsayısıyla (varsayılan gün başına 2 saat) ders dışı yük saatine çevirir. O sayı yalnız bilgi amaçlıdır, kapasiteye girmez ve sürüm geçmişine, yancılığa, vekâlete bakmaz. İki sayı farklı soruları cevaplar; eşit olmaları beklenmez.

## Kapsam dışı

- **Nöbet tutuldu mu takibi.** Modül planı üretir; nöbetin fiilen tutulup tutulmadığına dair bir yoklama kaydı yoktur.
- **Ders yoklaması.** Nöbetçi öğretmenin ders yoklamasıyla bir bağı yoktur. Vekâlet yoklamayı etkiler ama bu [[Program İstisnası]] üzerinden olur, nöbet çizelgesi üzerinden değil — bkz. [[Yoklama ve Devamsızlık]].
- **Ders programının kendisi.** Vekâlet programın üstüne bir katman yazar; programı bu modül kurmaz.
- **İki haftada bir nöbet sıklığında otomatik dağıtım.** Yukarıda — A/B hafta dönüşümü gerektirir.
- **Öğretmen devamsızlık kaydı ve vekâlete itiraz.** Vekâlet tepkiseldir, yalnız sonucu saklanır; öğretmen vekâleti görür ama itiraz akışı yoktur.
- **Nöbet yükünün dışa aktarımı.** Ertelendi.

## Açık Sorular (koddan doğrulanamayan)

- Yük raporundaki hafta sayımı tatilleri hesaba katmıyor: tatil haftası da tam hafta sayılıyor. Uzun tatili kesen bir sürüm penceresi yükü şişirir. Bu bilinçli bir kabul mü, yoksa tatil-duyarlı sayıma geçilecek mi?
- Yük raporu önbelleği yayın, vekâlet, muafiyet ya da yancılık ayarı değiştiğinde temizlenmiyor; yalnız 120 saniyelik süreyle tazeleniyor. Değişiklikten hemen sonra eski rapor görmek kabul edilebilir mi?
- Elle taslak geçici muafiyeti uygulamıyor (yalnız sürekli). Geçici muaf öğretmen elle atanırsa muafiyet tarihlerinde yayındaki çizelgede nöbetçi görünmeye devam mı ediyor?

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- Çizelge sezon kimliğini eski `AcademicYearId` adıyla taşıyor; diğer modüller `AcademicSessionId`'ye taşındı. Kalıntı mı?
- Yancı aday sorgusu `duties.manage` ile korunuyor, benzer okuma sorguları `duties.view` ile. Bilinçli mi?
- Yayınlanmış çizelgede nöbetçi olan öğretmene sonradan muafiyet verilirse mevcut atamalara ne oluyor? Muafiyet tarafında bir denetim görünmüyor.
