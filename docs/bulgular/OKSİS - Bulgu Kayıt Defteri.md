# OKSİS — Bulgu Kayıt Defteri

> **Ne bu dosya:** ölçülmüş ve **hâlâ açık** olan bulgular. Bir madde kapandığında
> bloğu [[OKSİS - Bulgu Arşivi]]'ne taşınır; burada iz bırakmaz.
> **Kapanmış her şey:** [[OKSİS - Bulgu Arşivi]] — kanıtlar, commit'ler, kapanış turları.
> Aşağıdaki metinlerde geçen kapanmış madde ID'leri (`B-20`, `TB-88`, `X-15` gibi) orada aranır.
> **Karar bekleyenler:** [[OKSİS - Yapısal Kararlar ve Eksikler]]
> **Son kapanış:** 2026-09-24 — `E-29` + `TB-249` + `TB-250` kapandı, Altınay B6.4 ✅ ([[OKSİS - Bulgu Arşivi]] §60).
>
> **Önceki kapanış turu:** 2026-09-15 — sınav takvimi kapanış turu: **10 madde kapandı**
> ([[OKSİS - Bulgu Arşivi]] §48). Altı ürün kararı bağlandı. İkisi (`TB-124`, `TB-129`'un bir
> ayağı) kod yazılmadan, ÖLÇÜLEREK kapandı. `TB-152` de aynı gün tamamlandı (eleme `EX-S09`
> ile görünür + sihirbazda dipnot) — **11 madde**. Defter **30**.
>
> **Önceki düzeltme:** 2026-09-15 (kapanış turu ön ölçümü) — defterdeki her madde koda karşı
> ölçüldü. `TB-147`, `TB-149` ve `TB-146` **kodda zaten kapalıydı**, defter satırları
> yazılmamıştı; üçü de arşive taşındı ([[OKSİS - Bulgu Arşivi]] §46). `TB-124` yarıya indi:
> `EX-H07` yazılmış (`CreateExamWindowCommandHandler:48`), yalnız `EX-H02` kaldı.
> Ayrıca defterin kendi kuralı işletildi: **kapanmış 15 madde** arşive taşındı
> ([[OKSİS - Bulgu Arşivi]] §47) — kapanmış maddenin açık listesinde durması, listeyi
> okunmaz hâle getiriyordu. Defter **39**.
>
> **Son ekleme:** 2026-09-21 (MEB kaynaklı katalog — hazırlık ve kademe turu) — `TB-222`
> (hazırlık saatleri sessizce yayımlanmıyor) ve `TB-223` (1-8 çizelgesi tek program üretiyor)
> **kullanıcı kararıyla kapandı**, ikisi de arşive taşındı ([[OKSİS - Bulgu Arşivi]] §51).
> Aynı koşuda `TB-224` (bozuk metin katmanlı belge kataloğa çöp program adı yazıyor 🟠)
> açıldı. Ekran turunda ayrıca `TB-225` (karara bağlanmamış öneri satırları yayımda
> atlanıyor 🟠 — ekran ayağı aynı gün kapandı) ve `TB-226` (ayrıştırıcı yalnız 2025 çizelge
> düzenini tanıyor 🟠) açıldı. Manuel ekran turunda ayrıca `TB-227` (içe aktarma ekranı
> hangi programın müfredatı olduğunu söylemiyor 🟠) ve `TB-228` (dipnot işareti saklanıyor,
> açıklaması atılıyor 🟡) ve `TB-229` (reddedilen çizelge bir daha içe aktarılamıyor 🔴).
> Defter **102** (🔴 4 · 🟠 25 · 🟡 41 · ⚪🟢 32).
>
> **Son kapanış:** 2026-09-22 (`K-28` kurum yetkilisi turu) — `TB-171`, `TB-165` ve `TB-172`
> arşive taşındı ([[OKSİS - Bulgu Arşivi]] §52). Kurum yetkilisi artık okul açılışında sorulup
> platformdan düzenleniyor; okul tarafındaki uç ve `school-settings.manage-authority` izni
> silindi. `TB-165`'in altındaki boşluk **kapanmadı, ayrıldı**: `TB-230` (izin çözücü
> `Platform` portalını tanımıyor 🟡) ve `TB-231` (entegrasyon takımının yarısı master'da
> kırmızı, push kapısının dışında 🟠) açıldı. Aynı turda `K-29` karara bağlandı: dersin kod
> alanı kalkar, tekillik türetilmiş ad anahtarına geçer. Defter **101** (🔴 4 · 🟠 26 · 🟡 40 · ⚪🟢 31).
>
> **Aşama 8 manuel turu (2026-09-22):** kullanıcının *"böyle bir ekran yok"* sorusu üç madde
> açtı ve **ikisi aynı gün kapandı**. `TB-233` 🔴 (yürürlükteki müfredat yanlış seçiliyor,
> çizelge sessizce inmiyor) → [[OKSİS - Bulgu Arşivi]] §53. `TB-232` 🟠 (okulun müfredat/
> haftalık saat yüzeyi hiç yok — 13 uç, sıfır çağıran) → §54: Akademik › Müfredat ekranı
> yazıldı, 13 ucun tamamı çağıran kazandı, canlı veride 162 satır doğrulandı.
> `TB-234` (müfredatı boş doğan sezondan çıkış yolu yok 🟠) **ölçüm hatası çıktı ve kapandı**
> — `reopen-to-draft` ve `cancel-setup` uçları vardı, ikisi de Sezon Yönetimi ekranında
> (arşiv §56). Yeni ekranın kullanıcı soruları
> `TB-235`'i açtı (program değişimi okul kapsamlı tercihi bırakıyor: hazırlık müfredatsız
> kalıyor, değişim gelecek sezon geri alınıyor 🟠) ve **aynı gün kapattı** —
> [[OKSİS - Bulgu Arşivi]] §55, `K-30` ile birlikte.
> Sayım düzeltmesi: `TB-232`'nin kapanış notu "13 ucun tamamı çağıran kazandı" diyordu,
> ölçülünce dördünün hâlâ çağıransız olduğu görüldü → `TB-236` 🟡.
> Aşama 10 öncesi kullanıcı sorusu `TB-237` 🔴'ı açtı (branş kataloğu boş: seed silindi,
> yerine geçecek yüzey yazılmadı) — merkez ayağı aynı gün kapandı.
> Ardından `TB-238` 🔴 (ayrıştırıcı bir sayfayı sessizce düşürüyor, bir adı ikiye bölüyor)
> açıldı ve **aynı gün kapandı**.
> Defter **104** (🔴 6 · 🟠 26 · 🟡 41 · ⚪🟢 31).
>
> **Altınay B4.2/B4.3 yeniden ölçümü (2026-09-22):** katalog MEB kaynaklı hâliyle ölçüldü.
> `TB-192`'nin eksik dersleri geldi, `TB-194`'ün kademe süzgeci canlıda doğrulandı. Altınay'da
> 110 branş var, Rehberlik dahil. Üç madde açıldı: `TB-239` 🟠 (seçmeli havuzun tamamı
> zorunlu yük sayılıyor, 9. sınıf 57 saat), `TB-240` 🟠 (dört ortak ders branşsız),
> `TB-241` ⚪ (kesme sonrası büyük harf). Defter **107** (🔴 6 · 🟠 28 · 🟡 41 · ⚪🟢 32).
>
> **Altınay B6 kadro turu (2026-09-23):** 13 öğretmen ürün yolundan davet edilip kabul edildi.
> Davet sihirbazı artık öğretmenin branşını soruyor (kural sunucuda). `fix/polish` dalları
> birleştirildi, sicil numaraları backfill'le 2026001–2026013 dağıtıldı. Üç madde açıldı:
> `TB-242` 🟡 (kapasite sütunu yükü olmayan öğretmende kişisel değeri göstermiyor; toplu
> varsayılan yok), `B-55` 🟠 (mobil davette branş adımı yok), `D-24` ⚪ (davet okulun resmî
> adını gösteriyor). Aynı gün kullanıcı kararıyla kapasite varsayılanı koddan 30 → 40 yapıldı ve
> kalıcı çözüm `TB-243` 🟠 olarak açıldı (okul ayarından, sınıf/branş öğretmeni için ayrı varsayılan).
> Defter **111** (🔴 6 · 🟠 30 · 🟡 42 · ⚪🟢 33).
>
> **B-55 kapandı (2026-09-23):** mobil davet kabulüne branş adımı eklendi (`oksis-ui` `8870969`),
> blok arşive taşındı ([[OKSİS - Bulgu Arşivi]] §57).
>
> **TB-243 ve TB-242 kapandı (2026-09-23):** kapasite varsayılanları okul ayarında (branş öğretmeni;
> ilkokul açıksa Sınıf Öğretmenliği branşı için ayrı değer), tek çözücüden okunuyor. Yük özeti
> kadronun tamamının kapasitesini taşıdığı için `TB-242` de kapandı (`oksis-api` `ee2ee4a9`,
> `oksis-ui` `228db6e`). İkisi arşive taşındı ([[OKSİS - Bulgu Arşivi]] §58).
>
> **Altınay B6.2 sorusu (2026-09-23):** yan branşı yazan hiçbir yol yok, okuyan dört özellik boş
> veriyle çalışıyor → `TB-245` 🟠 açıldı.
>
> **Branş–ders uygunluğu (2026-09-23):** eğitimci geri bildirimiyle yan branş kavramı **kaldırıldı**
> (`TB-245` bu yolla kapandı, arşiv §59). Okul MEB eşleşmesinin üstüne kalıcı branş–ders kuralı
> ekleyebiliyor; vekil önerisi iki etiketli (Uyumlu/Uyumsuz Branş). `TB-240`'a okul tarafı çıkış yolu notu düşüldü.
>
> **Altınay B7 öğrenci kaydı turu (2026-09-23):** 85 öğrenci ve 135 veli *Öğrenciler › Yeni
> Öğrenci* sihirbazıyla kaydedildi; veliler Mailpit'teki davetle, öğrenciler ilk girişte
> parolasını `Oksis1234!` yaptı. On madde açıldı, altısı aynı gün kapandı: `B-56` 🔴 (nakil
> kaydı imkânsız), `B-58` 🔴 (veliler davet alamıyor), `B-61` 🔴 (zorunlu parola ekranı yer
> tutucu), `B-57`, `B-59`, `B-60`. Açık kalanlar: `V-04` 🟠 (içe aktarmada numara/sayaç),
> `B-62` 🟡 (nakil devamsızlığı), `B-63` 🟠 (birincil veli), `D-25` 🟡 (ilk giriş KVKK metni),
> `E-30` 🟡 (pansiyon alanı yok). Defter **124** blok (`grep '^### \`'` ile sayıldı; aynı gün
> kapanan altı madde arşive taşınmadı, commit sonrası taşınacak).
>
> **Altınay B9.2 Görevlendirmeler genel kontrolü (2026-09-23):** varsayılan eksen kullanıcı
> kararıyla *Öğretmenlere göre* yapıldı ve seçicide sola alındı. Sayaçlar tutarlı (6 alan-dışı =
> detay toplamı). Altı madde açıldı: `B-64` 🟠 (hiçbir ders seçmeli değil), `B-65` 🟡 (kopyalama
> kaynağı), `D-26` 🟡 (görevi kapat onaysız), `D-27` 🟡 (çekmece hatada kapanıyor), `D-28` ⚪,
> `TB-244` ⚪. Bilinen alan-dışı eşleşme kusurları (`TB-240`) kullanıcı kararıyla bu turda ele
> alınmadı. Aynı gün `B-64` kullanıcı onayıyla kapatıldı (tür sezonun müfredatından); ölçüm
> sırasında `D-29` 🟡 (katalogda adsız, onaysız satır düğmeleri) açıldı.
>
> **Önceki ekleme:** 2026-09-20 (Altınay `B6` kadro turu — iki madde) — 11 öğretmen ürün
> ekranlarından davet edilip kabul edildi; kadro 14'e tamamlandı. `B-54` (öğretmen panosu
> yöneticinin panosunu çiziyor, beş uç 403 🟠) ve `D-23` (Kullanıcılar ekranı `Staff` profilini
> "—" gösteriyor ⚪) açıldı; ikisi de §12. Defter **94**.
>
> **Önceki ekleme:** 2026-09-20 (kullanıcı bulgusu turu — iki madde) — `B-53` (Kullanıcı Oluştur
> ekranı rol sormuyordu, her hesap sessizce Yönetici doğuyordu 🟠) **aynı gün kapandı**;
> `TB-120` (şubenin dersliği zorunlu değil) de **kapandı** — 2026-09-09 kullanıcı kararı bu
> turda uygulandı. Ayrıca `TB-220` (ödev form testi sabit tarihle yazılmış, takvim geçince
> kendiliğinden kırmızıya döndü ⚪) açıldı. Üçü de §12. Defter **92**.
>
> **Önceki ekleme:** 2026-09-20 (MEB kaynaklı katalog tasarımı, kod + veri ölçümü) — `TB-218`
> (aynı kararın ikinci çizelgesi ara alana taşınamıyor; set benzersizliği kullanıcıyı uydurma
> başlık yazmaya zorluyor 🟠) ve `TB-219` (ayrıştırıcı kategori bandını ders adına taşırıyor 🟡)
> açıldı; `TB-219` **aynı gün kapandı** — plan yazılırken koda karşı ölçülünce `TB-217`'nin
> zaten çözdüğü görüldü, bulgu bayat dev verisinden çıkarılmıştı. İkisi de §12. Sayaç düzeltildi: `TB-216`/`TB-217` kullanılmış
> ama "Sıradaki boş ID" `TB-215`'te kalmıştı. Defter **90** (sayaç yeniden sayıldı).
>
> **Önceki ekleme:** 2026-09-20 (MEB müfredatı Dilim 2) — `TB-205` (indirme başlığı kontrol
> karakterini süzmüyordu 🟠) açıldı ve **aynı gün kapandı**; kurucu okul dosyalarının indirme
> yolunda da kullanılıyordu. Defter **73**.
>
> **Önceki kapanış:** 2026-09-18 — MEB müfredatı Dilim 1: `TB-201` ve `TB-202` kapandı
> ([[OKSİS - Bulgu Arşivi]] §50; kod `feat/mufredat-surum-snapshot` dalında, merge bekliyor). Defter **73**.
>
> **Son ekleme:** 2026-09-18 (MEB müfredatı Dilim 1 uygulaması, entegrasyon koşusu) — `TB-203`
> (entegrasyon paketinin 676/1479'u master'da kırmızı; üç tenant'laştırma commit'i fixture'ları
> güncellemedi, üretimde karşılığı yok 🟠) ve `TB-204` (davet süresi işinin testi koşu sırasına bağlı ⚪),
> ikisi de §12. Sayaç düzeltildi: `TB-201`/`TB-202` kullanılmış ama "Sıradaki boş ID" güncellenmemişti.
> Defter **75**.
> **Önceki:** 2026-09-17 (MEB çizelge entegrasyonu ön değerlendirmesi, kod ölçümü) — `TB-201`
> (müfredat saat sağlayıcısı sürümü süzmüyor; ikinci MEB sürümü yazıldığı an ders programı üretimi
> `ArgumentException` ile durur 🟡) ve `TB-202` (MEB saat şablonu sezona bağlı değil; bir saat değişikliği
> kapanmış sezonların gerekli saatini de geriye dönük değiştirir 🟡), ikisi de §12. İkisi birlikte
> "MEB'den veri çek/güncelle" fikrinin **önkoşulu**: sürüm süzgeci ve sezon çivilemesi olmadan ilk
> güncelleme yazması üretimi kırar. `E-16` bu iki maddeye bağlandı. Defter **73**.
> **Önceki:** 2026-09-16 (Altınay B4, kullanıcı ölçümü) — `TB-200` (branş ekranındaki "MEB'den Getir"
> düğmesi hiçbir uç çağırmıyor, boş listede "hepsi zaten var" diyor 🟠), §12. Aynı turda kapatıldı (uç + kanca
> + düğme); canlı doğrulama kullanıcıda. `TB-193`'ün kullanıcı kararı ancak bu düzeltmeyle uygulanabilir hâle
> geldi. Defter **71**.
> **Önceki:** 2026-09-16 (Ayarlar ekran revizyonu) — `TB-199` (ikon adı tipi hiçbir şeyi
> korumuyor; olmayan ada sessizce boş ikon çiziliyor ⚪), §12. Bulgu, Akademik Yapı'nın katalog
> sekme şeridinde `icon: "doc"` adının aylardır ikonsuz çizilmesiyle görüldü; o ayak aynı turda
> düzeltildi, tipin kendisi açık kaldı. Defter **70**.
> **Önceki:** 2026-09-16 (gece düzeltme turu, kullanıcı uyurken) — Altınay saha testinde işaretlenen
> bulgular ve defterin karar-dışı maddeleri toplu olarak kapatıldı. **Kapanan 20 madde** (hepsi kodda,
> **commit bekliyor**; dallar `oksis-api` `fix/ilk-sezon-acilisi`, `oksis-ui` `fix/davet-olu-riza-anahtarlari`):
> `TB-174` · `TB-175` · `TB-125` · `TB-176` · `TB-177` · `D-19` · `B-51` · `D-20` (ekran ayağı) · `TB-166` ·
> `TB-180` · `TB-163 (a)` · `TB-164` · `TB-169` · `TB-107` · `TB-112` · `TB-150` (veri ayağı) · `TB-113` ·
> `TB-123` · `TB-141` · `TB-182` · `TB-172` · `TB-127`; ayrıca `TB-171`'in görünen ad ayağı. **Açılan 5 madde:** `TB-180` (aynı turda düzeltildi), `TB-181` (karar),
> `TB-182` (aynı turda düzeltildi), `TB-183`, `TB-184`. Altınay'ın iki somut engeli kalktı: bildirim satırı
> onarıldı (`1/1/1/0/1`) ve 2–3 Kasım'ı tatil sayan görünmez kayıt silindi. Ağacın son hâli: `dotnet build`
> **EXIT=0**, birim testler tamamen yeşil (Domain 1072 · Application 2711 · Api 442 · `Oksis.Tests` 64),
> entegrasyon **1456/1457** (kalan tek kırmızı `TB-184`, izole koşuda yeşil). Karar bekleyen maddeler ve
> onlara bağlı olanlar bilerek atlandı; `K-28` için uygulama planı çıkarıldı
> ([[2026-09-16-kurum-yetkilisi-k28]]). Defter **69**.
> Önceki: 2026-09-15 (gece) — Altınay saha testi B1.3 (müdür davet kabulü): `TB-170`
> (davetteki duyuru ve fotoğraf anahtarları hiçbir şeye bağlı değil 🟡), §11 · B2.1: `TB-171` (platformdan
> açılan okulda görünen ad ve kurum yetkilisi boş 🟡), §12 · B1.2: `TB-172` (okul kodu tekilliği DB'de
> zorlanmıyor ⚪), §12 · ilk ekran: `TB-173` (sezonsuz topbar seçici "—", mobil başlık satırı yok 🟡) +
> `TB-168`'e pano kartı envanteri eklendi. Kararlar: `TB-170` kaldırma (kodda, merge bekliyor) ·
> `TB-171` → `K-28` (a) · B2.3: `TB-174` (Yarım Gün zil şablonu hiçbir okulda kaydedilemiyor, 500 🟠; Cuma yoklaması sessizce
> üretilmeyecek), `D-19` (zil ekranı: boşken "Yeniden Üret", stilsiz modal çarpısı, Enter akışı 🟡), `B-51`
> (elle teneffüs/öğle arası yok 🟡), `E-25` (güne göre adlandırılmış zil şablonu yok 🟡, karar bekliyor) · B2.2:
> `TB-175` (bildirim ana ayarı tohumlanmıyor; ilk "Kaydet" uygulama içi dahil bütün bildirimleri kapatıyor,
> geri açacak kontrol yok — 🟡'dan 🟠'ye), `X-20`'ye istemci menüsü ölçümü · B2.4: `TB-176` (sezonsuz eklenen
> tatil görünmez/silinemez ama yoklamada tatil sayılır 🟠), `TB-177` (tatil listesi dini bayramları 5× gösteriyor 🟡),
> `E-26` (ara tatil girilemiyor 🟡, karar), `D-20` (tatil ekranı sezonsuz/form hataları 🟡) · `D-21` (liste
> ekranları `D-10`'u uygulamıyor 🟡, kodda düzeltildi) · B3: **`ENG-03` (ilk sezon açılamıyor — kaynak sezon zorunlu
> 🟠, engel)**, `TB-178` (sihirbaz tatilleri hiç yazılmıyor 🟠), `D-22` (sihirbaz anahtarları/doğrulama 🟡), `E-27`
> (ilk sezonda öğrenci adımı işlevsiz 🟡, karar); `E-26` düzeltildi. Defter **62**.
> Önceki (gece): `K-27` **ilk dilim uygulandı** (`oksis-api` `e91711bd`…`74427aa3`,
> `oksis-ui` `bd8d0f6`/`47d6059`): platformdan okul açma ve sezonsuz müdür daveti. **Kapandı:** `E-24`, `TB-162`, bir de
> senaryoda bulunup aynı gün düzeltilen `TB-167` (web davet kabulü rıza göndermiyordu, her kabul
> 400) → [[OKSİS - Bulgu Arşivi]] §49. **Açıldı:** `TB-168` (sezonsuz okulda pano kartı hata
> çiziyor 🟡), `TB-169` (platform girişinde hız sınırı yok ⚪). `TB-165`'e not düşüldü. Defter **44**.
> Önceki (akşam): `K-27` **(a) ayrı platform hesabı** olarak bağlandı;
> planlama öncesi süper yönetici izleri üç depoda kazındı
> ([[super-admin-izleri-envanteri]]). Kazımadan üç madde: `TB-164` (ölü SQL seed ⚪),
> `TB-165` (K5 ucu erişilemez, portal süzgeci `Platform`'u eliyor 🟡), `TB-166` (web mock
> rol satırı yanlış ⚪), üçü de §12. Defter **44**.
> Önceki: 2026-09-15 — Altınay Anadolu Lisesi sıfırdan açılış hazırlığı: `E-24`
> (yeni okul açmanın yolu yok 🟠) ve `TB-162` (taze okulda kademe oluşmuyor 🟡), ikisi de §12.
> Kapatma yolu platform kimliği kararına bağlı: [[OKSİS - Yapısal Kararlar ve Eksikler]] `K-27` ⬜.
> Aynı gün önce: sınav takvimi ekran testi (Bölüm B, görüş penceresi ve ilk
> gerçek push turu): `TB-154`…`TB-158`. Kapananlar: `TB-155` (tarih/saat bitişikliği),
> `TB-157` (mükerrer push + yanıltıcı sıra gövdesi). `TB-158` yarı kapandı: kanal kuruldu
> ve ölçüldü, gösterim belirtisi sürüyor.
> Açık kalanlar: `TB-154` (karar bekliyor), `TB-156`. Önceki gün `TB-143`…`TB-153`.
> Ek olarak `TB-159` (kelebek oturumu taşınamıyor). Bir de `TB-160` (gözetmen çizelgesi ters koşul, kapandı). Ve `TB-161` (serpiştirme oturumdan oturuma değişiyor, kapandı). Defter **55**.
> Önceki: 2026-09-13 — Faz 2b ön ölçümü (`oksis-api` @ `20ab14bd`): `TB-140` açıldı
> (çağıran çözümleyicilerinin Attendance/Announcements ikizleri) ve `TB-139`'a kısa devrenin
> bugün erişilemez olduğu ölçümü eklendi. `TB-140` aynı gün kapandı
> (`oksis-api` @ `1905abbc`). Defter **35**.
> **Son yeniden düzenleme:** 2026-09-13 — belge merkezi yeniden yapılandırması
> (`oksis-api` @ `294ffe6`): `X-21` kapandı ([[OKSİS - Bulgu Arşivi]] §45); özet tablosu ve
> sıradaki boş ID başlıklar sayılarak yeniden hesaplandı. Defter **35**.
> Önceki: 2026-09-11 — sınav bildirim dilimi
> (`oksis-api` @ `7f716bb6`): Faz 2a Görev 6.1 ve 8.2 — `TB-128`…`TB-131` ve `X-21` eklendi.
> Defter **28**.
> Önceki: 2026-09-10 — bildirim altyapısı taraması
> (`oksis-api` @ `61808d25`): §11 Bildirimler açıldı, `TB-125`/`TB-126`/`TB-127` ve
> `E-23` eklendi. Defter **23**.
> Önceki: 2026-09-03 — Notlar ve Ödevler domain-map taramaları
> (`oksis-api` @ `b72c819`): `TB-105`…`TB-113` ve `X-20` eklendi. Defter **12**.
> Önceki: 2026-09-01 — `TB-48`/`X-03` bayat çıktı ([[OKSİS - Bulgu Arşivi]] §39); `K-12 §A1` hükümsüz.

**Sıralama mantığı:** modül bazlı gruplandı, modüller risk ağırlığına göre sıralandı
(aktif çalışılan ve akış bloklayan modül en üstte).

**ID şeması** (yeni partilerde devam eder):
- `B-##` → Fonksiyonel bulgu
- `D-##` → Tasarım / UX bulgusu
- `V-##` → Validasyon & iş kuralı bulgusu
- `X-##` → Çapraz kesen iş
- `TB-##` → Teknik borç (kod taramasından)
- `E-##` → Eksik özellik · `ENG-##` → Engel
- Tam sözlük (açılımlar, öncelik işaretleri, karıştırılmaması gereken kodlar): [[CLAUDE]]

**Sıradaki boş ID:** `B-102` · `D-46` · `V-05` · `X-25` · `TB-265` · `E-36` · `ENG-04` *(`B-93` arşivde kullanılmış, sayaç atlamıştı)*
*(`K-##` karar sayacı: sıradaki `K-30` — `K-16`…`K-26` modül belgelerinde kullanılmış.)*
*(`E-##` sayacı [[OKSİS - Yapısal Kararlar ve Eksikler]] ile ortaktır.)*

**Yazma kuralı:** yeni ID vermeden önce hem bu dosyada hem
[[OKSİS - Yapısal Kararlar ve Eksikler]]'de, hem de [[OKSİS - Bulgu Arşivi]]'nde `grep` at —
sayaçlar üçü arasında ortak.

---

## Özet

| Öncelik | Adet | Kapsam |
|---|---|---|
| 🔴 Kritik | 4 | Tenant izolasyonu · veri/çıktı kaybı · akışı bütünüyle bloklayan |
| 🟠 Yüksek | 29 | İşlev yanlış çalışıyor, veri/yetki güveni zedeleniyor |
| 🟡 Orta | 42 | İşlev eksik ama alternatif yol var; borç birikiyor |
| ⚪🟢 Düşük | 30 | Kozmetik, temizlik, adlandırma |
| ❓ Netleşmemiş | 1 | `TB-261` |
| **Toplam** | **106** | |

> **2026-10-01 (Altınay saha testi — öğretmenlerin bugünkü yoklama görevleri):** 17 öğretmen, 84 oturum; web + mobil (Expo web) +
> API. Mutlu yol, sahiplik (404), hatalı gövdeler, idempotent gönderim, düzeltme, gün içi izin ve pano doğru çalıştı. Açılan: `B-92` 🟠
> (gelecek ders/gün yoklaması), `B-94` 🟠 (eksik/boş liste "tamamlandı"), `B-95` 🟠 (pencere dışı + yayın öncesi üretim),
> `B-96` 🟠 (zil değişimi kapanmış günü yeniden açıyor, yinelenen hatırlatma), `B-97` 🟡 (gün içi izin doğrulaması/iptali),
> `TB-264` 🟡 (eşzamanlı gönderimde 500), `D-41` ⚪. Toplam **104**.
> Aynı gün kulüp saati (9-A/9-B/10-A/10-B, 8. saat, 6 kulüp): `B-98` 🟠 (zil değişimi kulüp saatini ikizledi, eski etkinliğe
> girilen yoklama devamsızlığa yazılmıyor), `D-42` 🟡; `B-92`'ye kulüp ayağı eklendi. Kapalı `TB-259`'un ("sınır olarak kabul")
> sahadaki sonucu ölçüldü: boş kalan bir kulübün 5 üyesinin 8. saati iz bırakmadı, hiçbir hatırlatma gitmedi. Toplam **106**.

> **2026-10-02 (ders saati testi):** `B-92` (gün içi 5 dk sınırı + web/mobil kilit), `D-41`, `B-97` (iptal penceresi) sahada ölçüldü; dün ölçülen `B-94`, `B-95`, `TB-264` ile birlikte **6 madde kapandı**, arşive taşındı ([[OKSİS - Bulgu Arşivi]] §75). `Y-07` ders saatinde zil kilidi sahada doğrulandı; yeni `D-43` ⚪. Açık kalan: `B-96`, `B-98` (sahada zil değişimi), `D-42` (mobil, Perşembe). Toplam **101**.

> **2026-10-02 (öğleden önce, kullanıcı veri değiştiren testlere izin verdi):** `D-43` düzeltildi ve kapandı (arşiv §75). `Y-07` yayın reddi sahada (API + web) ölçüldü. `B-97` iptali ekrandan uçtan uca doğrulandı. Yeni: `X-24` 🟡 (hata iki kez — ekranlar geneli), `D-44` ⚪. Toplam **102**.

> **2026-10-02 (öğrenci ve veli pencerelerinden devamsızlık ölçümü):** 12 öğrenci, öğrenci + veli hesabı, özet/aylık kayıt/bugün uçları ve mobil veli ekranı. API değerleri beklenen hesapla birebir; öğrenci ve veli aynı veriyi görüyor, başka öğrencinin verisi 404. Kuralın kendisinde üç kusur: `B-99` 🟠 (payda yalnız alınmış dersler), `B-100` 🟠 (özürlü "gün" aslında ders sayısı), `B-101` 🟠 (geç birikimi veli özetinde yok), `D-45` ⚪. Toplam **106**.
> **2026-09-28 (öğleden sonra):** yönetici devamsızlık ekranında yoklamasını tamamlamış öğretmen "bekliyor" görününce `B-90` 🔴 açıldı — yeniden yayınlanan program eski sürümün önceden üretilmiş oturumlarını temizlemiyor; Altınay'da bugün 80 fazladan oturum, bir kısmında çift yoklama kaydı. Toplam **94**.

> **2026-09-30 (`B-90` ekran testi + düzeltme turu):** `B-90`'ın üç kararı bağlandı ve kodda düzeltildi (commit/merge bekliyor); ilk commit'in göçü hiç çalışamazdığı için silinip yeniden yazıldı, dev DB'ye uygulandı. Aynı testte `B-91` 🟠 (açık mobil uygulama silinen oturum kimliğini tutuyor), `TB-262` 🟠 (yayından sonra ilk pano açılışında 500 — kodda düzeltildi), `TB-263` 🟡 (dev DB'de koddan olmayan codex B-90 göçü) ve `D-40` ⚪ açıldı. Ardından iki depoda commit + master'a birleştirme: `B-90` kapandı, arşive taşındı ([[OKSİS - Bulgu Arşivi]] §73). Toplam **97**.

> **Gece turu (2026-09-28, kullanıcı uyurken — karar gerektirmeyen maddeler):** iki depoda tek dal `fix/gece-defter-turu`
> (**merge bekliyor**; `oksis-api` 26, `oksis-ui` 24 commit). Önce master'a çoktan girmiş **58 eski kapanış** arşive taşındı
> (Arşiv §70; 149 → 91). Sonra kodda kapananlar (bloklarında ✅ 2026-09-28 notu; merge + gerekiyorsa ekran ölçümüyle arşive gider):
> nöbet `B-85` (dört ayak), `B-86` (tüm açık ayaklar), `B-88`, `B-89`, `D-38` (1–2); ayarlar/görevlendirme `D-23`, `D-26`, `D-27`,
> `D-28`, `D-29`, `B-65`, `D-37`, `D-31` (67 native select + eslint kapısı), `TB-199`, `E-31`; sunucu `D-24`, `TB-141`, `TB-169`
> (ForwardedHeaders hariç), `TB-179` (ayak 1), `TB-193`, `TB-227`, `TB-241` (veri düzeltmesi hariç), `TB-226` (a, b), `TB-244`;
> test altyapısı `TB-203`, `TB-231` (1), `TB-256`, `TB-221`, `TB-184`/`TB-204`, `TB-252`, `TB-254`, `TB-213`/`TB-187`, `TB-190`,
> `TB-180`, `TB-251`/`TB-258`/`TB-220` — **entegrasyon takımı 675 kırmızıdan 1'e** (kalan `TB-261`, karar). `TB-181` için ara
> koruma (deterministik sıra). `TB-257` belge düzeltmesiyle kapandı. Yeni: `TB-260` (göç FK), `TB-261` (karar). Dokunulmayanlar
> karar bekleyen ya da kararlı olanlar (`V-04`, `B-62`, `B-63`, `D-25`, `E-30`, `TB-240`, `TB-105/106/108`, `E-23`, `TB-126`, `X-20`,
> `X-22`, `X-23`, `TB-139`, `TB-198` vb.) ve çok günlük işler (`X-06`, `TB-163 (b)`).

> **2026-09-27 (Altınay C2.1):** nöbet bölgeleri ekrandan kurulurken `D-38` açıldı; bölge silinirken `B-84` açıldı ve kodda düzeltildi; ilk yayında `B-85` açıldı; `D-39` açılıp kodda kapatıldı; yayın sonrası uçtan uca kontrolde `B-86`, `B-87`, `B-88` açıldı; `B-87` kodda düzeltilip ölçülürken `B-89` açıldı. Toplam **149**.
>
> **Kapanış (2026-09-27, ikinci tur):** `B-81` ve `TB-253` ekranda uçtan uca ölçülüp arşive taşındı (Arşiv §63). Ölçümde üç
> yeni madde açıldı: `B-82`, `B-83`, `D-36`. `B-82`, `B-83` ve `D-36` aynı gün master'a merge edilip arşive taşındı. `D-32` (kart rozetlerinin ders adına binmesi)
> kullanıcı kararıyla kabul edilen durum sayıldı ve defterden silindi; ID yeniden kullanılmaz. `B-67` kuruluma geçiş kararıyla
> kapandı (Arşiv §64). `B-80` okul çapında yük dengesiyle kapandı (Arşiv §65).
> `B-74` kullanıcı kararıyla tasarım gereği kapandı (Arşiv §66). `E-35` (şube alt grubu) kullanıcı kararıyla MVP dışı
> bırakıldı (Arşiv §67). `E-34` kullanıcı kararlarıyla uygulandı (Arşiv §68); kalan sınırı `TB-259` olarak açıldı.
> Ekran ölçümünde `D-37` açıldı. `TB-239` ve `TB-247` ölçülerek kapandı (Arşiv §69). Yeniden sayım: **141** blok.
>
> **Arşiv turu (2026-09-27):** ders programının master'da doğrulanan 3 maddesi arşive taşındı (Arşiv §62: `B-66`, `B-78`,
> `TB-123`). `TB-236` defterde birebir iki kez yazılmıştı; kopya silindi. Sayılar `grep '^### \`'` ile yeniden sayıldı: **149**
> blok. Tablo önceki turda 148 diyordu ama gerçek sayı 153'tü (sonradan eklenen `B-80`, `B-81`, `TB-258` vb. sayaca işlenmemişti).
> **Açık sorun:** `TB-220` iki farklı maddeye verilmiş (§10 Ödevler ve §12 derslik hataları); yeniden numaralandırılmadı.

> **Arşiv turu (2026-09-26):** master'a merge edilen 13 madde arşive taşındı (Arşiv §61: `B-68`, `B-69`, `B-70`,
> `B-72`, `B-73`, `B-75`, `B-76`, `B-77`, `D-30`, `D-33`, `D-34`, `E-32`, `E-33`). Sayılar `grep '^### \`'` ile yeniden
> sayıldı. **Bug temizliği yapacak oturuma not:** `B-79` çözüldü (commit bekliyor, dokunma); `TB-253` yalnız ekran
> ölçümü bekliyor. "Kodda düzeltildi / commit bekliyor" yazan **eski** maddeler (2026-09-16 turu vb.) bu turda
> doğrulanmadı — kapatmadan önce commit'leri master'da aranmalı.

> **Sayaç düzeltmesi (2026-09-24):** tablo 98 diyordu; `grep '^### \`'` ile yeniden sayıldı: **133** blok
> (`E-29`, `TB-249`, `TB-250` arşive taşındıktan sonra). Sapmanın sebebi değişmedi: eklemelerde sayaç elle
> güncellenmiyor.

> **Sayaç düzeltmesi (2026-09-20):** tablo 74 diyordu, `grep '^### \`'` ile gerçek blok sayısı
> **88**'di; bugünkü iki madde eklenince **90**. Defterin kendi kuralı işletilerek öncelik
> dağılımı da yeniden sayıldı (🔴 3 · 🟠 18 · 🟡 40 · ⚪🟢 29). Sapmanın sebebi öncekiyle aynı:
> gün içindeki eklemelerde sayaç elle güncelleniyor. Bu sayı "açık iş" değil, **defterdeki blok**
> sayısıdır; kapanmış maddeler bir sonraki turda arşive taşınacak.
>
> **Sayaç düzeltmesi (2026-09-16):** tablo 76 diyordu, defterdeki gerçek blok sayısı **65**'ti — gün içindeki
> hızlı eklemelerde sayaç elle artırıldığı için şişmişti. Sayılar `grep '^### \`'` ile **yeniden sayılarak**
> hizalandı; bugünkü dokuz yeni madde de bu gerçek sayımın üstüne eklendi. Kapanmış maddeler hâlâ defterde
> duruyor (merge sonrası arşive taşınacak), yani bu sayı "açık iş" değil "defterdeki blok" sayısıdır.

**Modül dağılımı:** Notlar 5 · Ödevler 7 · Bildirimler 5 · Nöbet 1 · Çapraz kesen 124 (sınav, okul açılışı, platform kimliği ve ders programı maddeleri dahil)

> **2026-09-16 gece düzeltme turu sürüyor.** Kodda düzeltilip **commit bekleyen** maddeler (dallar
> `oksis-api` `fix/ilk-sezon-acilisi`, `oksis-ui` `fix/davet-olu-riza-anahtarlari`): `TB-174`, `D-19`,
> `B-51`, `D-20` (ekran ayağı), `TB-166`, `TB-180`. Bloklarında ✅ notu var; merge edilince arşive
> taşınacaklar. Karar bekleyenler ve onlara bağlı olanlar bu turda bilerek atlandı.

**Senin kararını bekleyenler:** `TB-109` (vekâleten yayında sahiplik devri) ve `TB-111`
(tarihi ileri alınan ödevin yeniden hatırlatılması) ürün kararıdır; teknik borç olarak
kaydedildi çünkü ikisinin de kodda bilinçli bir "yapılmadı" gerekçesi var.

`K-13`/`K-14`/`K-15` 2026-09-01'de bağlandı — kayıt: [[OKSİS - Yapısal Kararlar ve Eksikler]].
Önceki tur: [[K-12 - Defter Sıfırlama Karar Turu]].

**Zincirler — hangi madde hangisini bekliyor**

```
X-06  ──►  ortak koşum kurulmadan yazılan her handler yeni borç ekler
```
*(Önceki turların zincirleri kapanan maddelerle birlikte arşive taşındı.)*

---

## 8. Nöbet & Vekalet 🟠

### `B-85` · Kaydedilmemiş (ve sunucunun reddettiği) değişiklikle "Çizelgeyi Yayınla" sessizce ESKİ taslağı yayınlıyor; ekran yayından sonra da olmayan atamayı gösteriyor 🟠

Altınay saha testi (C2.1, 2026-09-27), müdür hesabıyla Playwright. Otomatik dağıtım uygulandı (20 atama, taslak). Sonra
Çarşamba › Bahçe'nin boş ikinci yerine, **o gün aynı hücrede yancı olan** öğretmen nöbetçi seçildi.

1. **Seçim penceresi engellemiyor.** "O gün dolu" rozeti yalnız o gün **nöbetçi** olanları işaretliyor
   (`packages/core/src/duty/logic.ts:82` `dutyBusyOnDay` yalnız `teacherId`'ye bakıyor); o gün **yancı** olan 4 öğretmen
   seçilebilir. Yancı seçimi için doğru küme zaten var (`dutyActiveOnDay`, :93), nöbetçi seçiminde kullanılmıyor.
2. **Kaydet 409 alıyor, mesaj yanıltıcı:** `PUT duties/roster` → *"Seçilen yancı o gün başka bir nöbette görevli."*
   Kullanıcı yancı seçmedi, nöbetçi seçti. Sunucu kuralı doğru koruyor (taslak yeniden kurulurken yancı ataması düşüyor),
   ama mesaj kullanıcının yaptığı işi anlatmıyor. Reddedilen atama ekranda kalıyor, "Kaydet" duruyor.
3. **Asıl kusur — sessiz yanlış yayın:** "Çizelgeyi Yayınla" kaydedilmemiş değişiklik varken de açılıyor
   (`duty-page.tsx:169-176` düğme `draftCount`'a bakmıyor; `PublishModal` yalnız `hasAssignments` alıyor). Pencere
   uyarmıyor, "Yayınla" **sunucudaki eski taslağı** yayınlıyor (`POST duties/roster/publish` → 200). Yayın sonrası ekran
   **"21 nöbet · v1 · 28.09.2026'dan beri yürürlükte"** diyor ve yayınlanmamış atamayı hücrede göstermeye devam ediyor;
   "Kaydet" de duruyor. Sebep: yerel taslak yalnız sunucu çizelgesinin imzası değişince sıfırlanıyor
   (`use-duty-editor.ts:72-78`), yayın atamaları değiştirmediği için imza aynı kalıyor. Sayfa yenilenince 20'ye dönüyor.
   DB: yayınlanan sürüm `13b49377-…` v1, 20 atama, o hücrede yalnız ilk nöbetçi. **Öğretmenlere giden yayın bildirimi
   ekrandaki çizelgeyi değil sunucudakini anlatıyor; yönetici ise ekranda başka bir şey görüyor.**

⬜ Kapatma yolu: (a) seçim penceresi `dutyActiveOnDay` ile o gün yancı olanı da "o gün dolu" işaretlesin; (b) kaydedilmemiş
değişiklik varken yayın ya engellensin ya da "önce kaydet" adımı zorunlu olsun (en azından pencere uyarsın); (c) kaydetme
hatasında yerel taslak geri alınabilsin ("değişiklikleri at"); (d) 409 mesajı rolü doğru anlatsın ("X o gün bu bölgede yancı").
Test: yancı ile aynı güne nöbetçi seçimi → rozet; kirli taslakla yayın → engel/uyarı.

✅ **2026-09-28 · (d) sunucu ayağı kodda (gece turu, `oksis-api` `fix/gece-defter-turu` `8b81acdb`):** o gün yancı olanı nöbetçi seçmek artık ayrı anahtarla reddediliyor — `duties.errors.duty-teacher-is-reliever-same-day`: "Nöbetçi seçilen öğretmen o gün yancı olarak da görevli; bir öğretmen aynı gün hem nöbetçi hem yancı olamaz. Önce o günkü yancılığını değiştirin." Çift yancılık `reliever-already-busy`'de kaldı, cümlesi yalnız onu anlatıyor; kural gevşemedi. Altınay senaryosu entegrasyon testinde yeşil.

✅ **2026-09-28 · (a)(b)(c) istemci ayakları kodda (gece turu, `oksis-ui` `fix/gece-defter-turu` `5394140`, merge bekliyor, ekranda ölçülmedi):** (a) `dutyTeacherBusyOnDay` o gün başka hücrede nöbetçi **ya da yancı** olanı "O gün dolu" işaretliyor, ipucu nedenini söylüyor (eski `dutyBusyOnDay` kaldırıldı); (b) kaydedilmemiş değişiklik varken yayın penceresi "Yayınla"yı kilitliyor, nedenini yazıyor ve "Önce Kaydet" sunuyor (kapı core'da, `dutyPublishBlock`); (c) onaylı "Değişiklikleri At" düğmesi, yayın başarısında yerel taslak imza değişmese de sıfırlanıyor. Dört ayak da kodda — madde merge + ekran ölçümüyle kapanır.

📺 **2026-09-28 · ekranda ölçüldü** (dal kodu: API 5113 + web 3005, Altınay, yalnız okuma): (a) seçim penceresinde o gün başka hücrede nöbetçi ya da yancı olan öğretmenler "O gün dolu" (Pzt: 7 öğretmen); düzenlenen hücrenin kendi yancısı işaretlenmiyor — doğru, nöbetçi değişince o yancı zaten düşüyor (`use-duty-editor.ts:119`). (b)(c) kaydedilmemiş değişiklik gerektirdiği için gerçek veride denenmedi. Not: seçim penceresi Escape ile kapanmıyor (yalnız dış tıklama).

### `D-39` · Nöbet çizelgesi ve Yük Raporu'nda "2026-2027" seçicisi işlevsiz ⚪

Altınay saha testi (C2.1, 2026-09-27). Çizelge araç çubuğunda takvim simgesi + sezon adı + aşağı ok taşıyan bir düğme
(`cizelge-tab.tsx:96-99`), Yük Raporu'nda aynısı (`report-page.tsx:69-71`); ikisinde de `onClick` yok. Seçici gibi
görünüyor, hiçbir şey açmıyor. Ayrıca çizelge **döneme** bağlı olduğu hâlde **sezon** adını yazıyordu.

✅ **2026-09-27 kodda kaldırıldı (`oksis-ui` `feat/nobet-yuk-sekmesi`, commit bekliyor, kullanıcı kararı):** iki düğme ve
artık kullanılmayan `periodLabel` prop'u silindi; ekranda ölçüldü. Dönem bilgisi üst çubuktaki sezon/dönem seçicisinde.
⬜ **Açık kalan (ayrı iş, karar gerekir):** nöbet sayfası hep yürürlükteki dönemi açıyor → **2. dönemin çizelgesi dönem
başlamadan hazırlanamıyor** (geçici muafiyetler de ancak o çizelgede işe yarar). Gerçek dönem seçici; yayın tarihi,
"bugün" göstergesi ve vekâlet sekmesinin hangi dönemi okuyacağı kararlarıyla birlikte ele alınmalı.

✅ **Karar (2026-09-28, kullanıcı):** nöbet ekranları **üst çubuktaki sezon/dönem seçicisine bağlanır**; yönetici 2. dönemi seçip çizelgeyi önceden hazırlayabilir. Uygulanacak.

### `B-86` · Öğretmen kendi nöbetini hiçbir ekranda göremiyor; yayın bildirimi "Yetkiniz yok"a götürüyor 🟠

Altınay saha testi (C2.1, 2026-09-27), çizelge v2 yayınlandıktan sonra öğretmen hesabıyla (Playwright) ölçüldü.

- **Web:** öğretmen menüsünde nöbet sayfası yok (Panel, Yoklama, Notlar, Ödevler, Ders Programı, Sınav Takvimi, Duyurular,
  Mesajlar, Kulüplerim). "📋 Nöbet çizelgesi güncellendi" bildirimi `/duties` → istemci `/duty`'ye çeviriyor → **"Yetkiniz
  yok · Öğretmen rolü /duty sayfasını görüntüleyemez."**
- **Mobil:** `MOBILE_MORE_SCHOOL_BY_ROLE.teacher` içinde "Nöbetlerim" öğesinin `href`'i yok; mobilde nöbet rotası da yok
  (`navigate-to-target.ts:47` bunu kendisi not ediyor).
- **Pano:** gerçek nöbet bilgisi yok; "BUGÜNKÜ NÖBET · ÖRNEK VERİ · Hakan Yüce · Ana Giriş · Kapı" gibi `K-09` örnek kartı
  (bkz. `B-54`).
- **Sunucu hazır:** `GET duties/me?termId=` öğretmen belirteciyle 200 ve doğru (örnek öğretmen: Pzt Bahçe nöbet, Per/Cum
  2. Kat yancı — DB ile birebir); istemci kancası `useMyDuties` (`packages/api/src/duty/queries.ts:189`) var, **tüketicisi
  yok**. `duties/on-duty?date=` de öğretmene 200 dönüyor (`TB-19`'un ekransız ucu).

Sonuç: yayın öğretmene bildirim gönderiyor ama öğretmen hangi gün, nerede, nöbetçi mi yancı mı olduğunu göremiyor.
⬜ Kapatma yolu: öğretmen için "Nöbetlerim" yüzeyi (web + mobil) `useMyDuties` üstüne; bildirim bağlantısı role göre o yüzeye;
panodaki örnek nöbet kartı gerçek veriye (`K-09`).

✅ **2026-09-28 web ayağı kodda (`oksis-ui` `feat/ogretmen-nobetlerim`, commit bekliyor):** öğretmen menüsüne "Nöbetlerim"
(`/duty`, `requiresActiveSeason`) eklendi; `duty-page.tsx` rolü okuyup öğretmene `TeacherDutyScreen`, yöneticiye mevcut ekranı
veriyor (`/exams` deseni, varsayılan dal yok — `B-34`). Ekran `useMyDuties` üstünde: yürürlükteki sürüm ve tarih, "Bugün"
şeridi ve satır vurgusu, nöbet/yancı sayıları, haftalık liste (yönetici önizlemesinin görsel dili, E-05), yayında çizelge yokken
ve görev yokken boş durum, "Nöbet nasıl işler?" penceresi. Dönem çözümü üç ekranda tek kancaya (`usePlanningTermId`) toplandı.
Ekranda ölçüldü (Altınay, 28.09 Pazartesi): bir öğretmen Pzt Bahçe nöbet (Bugün vurgulu) + Per/Cum 2. Kat yancı — DB ile birebir;
yayın bildirimine tıklayınca "Yetkiniz yok" yerine Nöbetlerim açılıyor; muaf öğretmende boş durum; müdür yönetici ekranını görüyor.
⬜ **Açık kalan:** mobil "Nöbetlerim" (öğe `href`'siz, mobilde rota yok); öğretmenin vekâlet görevleri (`GET duties/substitution/me`
var, istemci kancası yok); muaf öğretmene "muafsın" demek yerine genel boş durum gösteriliyor (uç muafiyet bilgisi taşımıyor);
panodaki `K-09` örnek nöbet kartı.

✅ **2026-09-28 pano kartı gerçek veriye bağlandı (`oksis-ui` `feat/pano-bugunku-nobet`, commit bekliyor, kullanıcı isteği):**
"Bugünkü Nöbet" `K-09` örnek kartı (uydurma adlar) silindi; yerine `today-duty-card.tsx` → `GET duties/on-duty?date=bugün` (`TB-19`
ucunun ilk tüketicisi): bölge, o gün fiilen bakan öğretmen, yancı; muafiyet varsa "X muaf · yerine bakıyor", kimse yoksa "Açık nöbet"
ve başlıkta açık sayısı; okul günü değil / yürürlükte çizelge yok / atama yok boş durumları. Kapı `DASHBOARD_WIDGET_RULES.todayDuty`
(`duties.view` + `/duty` erişimi) → yönetici ve öğretmen görür, öğrenci/veli görmez. Kart sağ sütunun başına, "Bekleyen İşlemler"in
üstüne alındı. Ekranda ölçüldü (28.09 Pzt): beş nöbetçi ve yancıları v2 ile birebir; öğretmende düğme "Nöbetlerim". Muaf/açık
nöbet satırı canlı veride yok, ekranda ölçülmedi. Panonun diğer `K-09` kartları (Bekleyen İşlemler'deki "Boşta kalan nöbet
bölgesi" dahil) hâlâ örnek veri.

✅ **2026-09-28 · vekâlet ve mobil ayakları kodda (gece turu, `oksis-ui` `fix/gece-defter-turu` `d021419`, `cd27d16`, merge bekliyor):** web Nöbetlerim'de "Vekâlet derslerim" (`GET duties/substitution/me`, bugün vurgulu, geçmiş katlanır); mobilde `/duty` ekranı, "Daha fazla › Nöbetlerim" satırı ve `duties` bildiriminin yönlendirmesi; ortak mantık core'da testli (`buildMyDutyWeek`, `splitMySubstitutions`). Web Altınay'da öğretmenle ölçüldü (vekâlet listesi canlıda boş, boş durum doğru). ⬜ Açık: muafiyet bilgisi için `duties/me` alanı (sunucu), mobil ekran ölçümü.

✅ **2026-09-28 · muafiyet için sunucu ayağı kodda (gece turu, `oksis-api` `fix/gece-defter-turu` `95fbb0e1`):** `duties/me` → `exemptions[]` (yalnız çağıranın, açık okul yüklemiyle; sürekli + dönemle kesişen geçici; `coversWholeTerm` = `CoversPeriod`; canlı çizelge yokken de dolu). 3 entegrasyon testi, sınıf 6/6.

✅ **2026-09-28 · muafiyet yüzeyi kodda (gece turu, `oksis-ui` `fix/gece-defter-turu` `2ebabd9`):** web `TeacherDutyScreen` ve mobil `MyDutyScreen` dönemi tamamen kapsayan muafiyette genel boş durum yerine "Nöbetten muafsınız" + tür/tarih/gerekçe, kısmi muafiyette atamaların üstünde bilgi şeridi (`describeMyDutyExemptions`, core'da testli). Böylece defterdeki dört açık ayağın hepsi kodda; madde merge + mobil ekran ölçümüyle kapanır.

📺 **2026-09-28 · ekranda ölçüldü** (dal kodu: API 5113 + web 3005, Altınay, yalnız okuma): öğretmen Nöbetlerim: Pzt 1. Kat nöbet (Bugün), Per yemekhane yancı, Cum 2. Kat nöbet — çizelgeyle birebir; "Vekâlet derslerim" boş durumu. Sürekli muaf öğretmende "Nöbetten muafsınız · Sürekli muafiyet · Gerekçe: İdari Görev". 2. dönemde geçici muafiyeti olan öğretmende 1. dönem ekranı muafiyet göstermiyor (doğru). Mobil ölçülmedi.

### `B-89` · Otomatik dağıtımda yancı seçimi nöbet yükünü saymıyor — toplam yük 1–3 (ideal 2–3) 🟡

Altınay saha testi (C2.1, 2026-09-28), `B-87` düzeltmesinden sonra ölçüldü. 18 öğretmene 20 nöbet + 20 yancı = 40 görev
düşüyor; dengeli dağılım 14 kişiye 2, 4 kişiye 3 görev (aralık **2–3**). Çözücü **1–3** üretti: 6 öğretmen 3 görev (ikisi
2 nöbet + 1 yancı), iki öğretmen yalnız 1 nöbet, 0 yancı. Kök neden `DutySolver` adım (3): yancı adayı yalnız
`relieverCount`'a göre sıralanıyor (`OrderBy(r => relieverCount[r]).ThenBy(r => r)`), öğretmenin o haftaki **nöbet sayısı**
hesaba katılmıyor; eşitlik GUID sırasıyla bozuluyor. Adalet metriği de (`MinLoad`/`MaxLoad`, ekrandaki "Denge 1–2") yalnız
nöbeti sayıyor, yancıyı saymıyor — ekran "dengeli" derken Yük & Adalet sekmesi "dengesiz" gösteriyor.
⬜ Kapatma yolu: yancı seçiminde birincil ölçüt toplam görev (nöbet + yancı), ikincil yancı sayısı; adalet metriği yancılık
açıkken toplam görevi ölçsün. Test: 18 öğretmen × 20 hücre senaryosunda toplam yük aralığı ≤ 1.

✅ **2026-09-28 · kodda düzeltildi (gece turu, `oksis-api` `fix/gece-defter-turu` `ab467c95`, merge bekliyor):** `DutySolver.AssignRelievers` yancı adayını üç ölçütle sıralıyor — toplam görev (nöbet + yancı) → yancı sayısı → döner sıra (GUID'e dizilmiş havuzda son seçilenden sonraki; deterministik, eşitlik hep aynı öğretmene düşmüyor). `DutyFairnessScorer` yancılık açıkken nöbet + yancıyı, kapalıyken yalnız nöbeti ölçüyor. 6 yeni test (18 öğretmen × 20 hücrede toplam yük 2–3; öğle meşguliyetli varyantı; iki nöbetliye yancılık verilmez; metrik = gerçek yük), eski kodda 5'i kırmızı. ⬜ Altınay önizlemesinde yeniden ölçülmedi; ekrandaki "Denge x–y" etiketi artık toplam görevi gösterecek.

### `B-88` · Nöbet yayın bildirimi: "etkilenen" = yeni çizelgedeki bütün nöbetçiler — değişmeyene gidiyor, yalnız yancıya ve görevden çıkarılana gitmiyor 🟡

Altınay saha testi (C2.1, 2026-09-27). v1 → v2'de görevi (nöbet ya da yancılık) değişen öğretmen **6**, "📋 Nöbet çizelgesi
güncellendi" bildirimi alan **18**. Kaynak `DutyRoster.Publish` (`DutyRoster.cs:105-107`): `AffectedTeacherIds =
_assignments.Select(a => a.TeacherId).Distinct()` — önceki sürümle fark alınmıyor, `RelieverId` hiç katılmıyor.
Sonuçlar: (a) değişmeyen herkese gürültü; (b) **yalnız yancı** olan öğretmen hiç haber almıyor; (c) yeni sürümde görevi
kaldırılan öğretmen haber almıyor. Yayın penceresi "Etkilenen öğretmenlere otomatik bildirim gönderilir" diyor.
Ayrıca: teslim yalnız `in-app` (36/36); okulun e-posta/push anahtarları açık ama bu olay için o kanallarda kayıt yok —
tasarım mı eksik mi ölçülmedi.
⬜ Kapatma yolu: önceki canlı sürümle (nöbetçi + yancı) fark alınıp yalnız değişenlere; ilk yayında nöbetçi ∪ yancı.

✅ **2026-09-28 · kodda düzeltildi (gece turu, `oksis-api` `fix/gece-defter-turu` `da83b009`, merge bekliyor):** `DutyRoster.Publish(…, previousLive)` önceki canlı sürümle öğretmen başına (gün, bölge, nöbetçi/yancı) görev kümesi farkını alıyor: eklenen, çıkarılan ya da kümesi değişen öğretmen etkilenir; ilk yayında nöbetçi ∪ yancı; kimsenin görevi değişmediyse bildirim gitmez. 6 domain + 1 entegrasyon testi (eski kodda kırmızı). ⬜ E-posta/push kanalında kayıt olmaması sorusu ölçülmedi, açık.

### `D-38` · Bölge penceresinde "Simge" seçicisi "Tür"ün kopyası; stepper ve tür çiplerinin erişilebilir adı/durumu yok; şablon hiç sunulmuyor 🟡

Altınay saha testi (C2.1, 2026-09-27), müdür hesabıyla *Ayarlar › Nöbet Bölge Ayarları › Bölge ekle*
penceresinden 9 bölge Playwright'la girilirken ölçüldü.

1. **Simge seçicisi ayrı bir alan değil.** Pencerede "Tür" ve "Simge" diye iki satır var; simge düğmesine tıklamak
   **türü** değiştiriyor (`apps/web/features/duty/region-modal.tsx:93-97`, `onClick={() => setType(k)}`). İstemci
   `icon: null` gönderiyor (`packages/api/src/duty/endpoints.ts:108-134`, "icon türden türetildiği için null");
   `academic.duty_locations.icon` tüm DB'de 0 dolu satır. Kullanıcı, ayrı seçtiğini sandığı simgeyle türünü
   farkında olmadan değiştirebilir; `icon` kolonu ve DTO alanı ölü.
2. **Erişilebilirlik:** kapasite "−"/"+" düğmelerinin adı yok (yalnız SVG, `class` da yok); tür ve simge çiplerinde
   seçili durum yalnız `on` CSS sınıfıyla taşınıyor, `aria-pressed` yok. Otomasyonun "+" yerine "Aktif" anahtarına
   basıp bölgeyi pasif kaydetmesi bu yüzden oldu — ekran okuyucu kullanıcısı için de aynı tuzak.
3. **Şablon sunulmuyor:** domain notu ([[Nöbet Bölgesi]] §Şablonlar) okulun bölgeyi platform şablonundan
   kopyalayabileceğini söylüyor, `master.duty_location_templates` 6 satır; ama istemci her zaman `templateId: null`
   gönderiyor, pencerede şablon seçimi yok. Tür listesi (Koridor, Yemekhane, Açık Alan, Kapı, Salon, Diğer) şablon
   listesiyle (Kapı, Koridor, Kantin, Bahçe, Spor Salonu, Merdiven) de örtüşmüyor.

⬜ Kapatma yolu: Simge satırı kaldırılır (ya da gerçekten ayrı alan olur ve gönderilir); `icon` kolonu için karar;
stepper düğmelerine `aria-label`, çiplere `aria-pressed`; şablon ya pencereye eklenir ya domain notundan düşülür.

✅ **2026-09-28 · 1. ve 2. ayak kodda (gece turu, `oksis-ui` `fix/gece-defter-turu` `2daa11b`, merge bekliyor, ekranda ölçülmedi):** Simge satırı kaldırıldı; kapasite −/+ düğmelerine `aria-label`, tür çiplerine `aria-pressed`, Aktif anahtarına `role=switch`. ⬜ 3. ayak (`icon` kolonu, şablon) karar bekliyor.

📺 **2026-09-28 · ekranda ölçüldü** (dal kodu: API 5113 + web 3005, Altınay, yalnız okuma): "Bölge ekle" penceresinde Simge satırı yok; tür çipleri `aria-pressed`, "Kapasiteyi azalt/artır", Aktif `role=switch`. Kaydedilmedi. Not: Nöbet Bölge Ayarları listesindeki "Aç/Kapa · Düzenle · Sil" düğmelerinin adında bölge adı yok (`D-29` kalıbının burada uygulanmamış kardeşi).

✅ **Karar (2026-09-28, kullanıcı):** 3. ayak: **`icon` kolonu ve bölge şablonları kaldırılır** (kolon + DTO alanı göçle, şablon tablosu ve domain notundaki vaat). Uygulanacak.

---

## 9. Notlar 🟡

Kaynak: domain-map taraması, `oksis-api` @ `b72c819` (2026-09-03). Modülün haritası
[[Notlar]] notunda; dört madde de oradaki "Açık Sorular"dan deftere taşındı.

### `TB-105` · Kademe bazlı not ölçeği override'ının tüketicisi yok 🟡

Okul ayarlarında kademe başına ölçek seçilebiliyor ("ilkokul 5'lik, lise 100'lük") ve
bunu çözen bir servis yazılmış (`IGradeScaleResolver`, BR-SS-011 zinciri, Redis cache'li).
**Sembol referansıyla ölçüldü:** servisin kod tabanında tek tüketicisi yok — yalnız kendi
uygulaması ve DI kaydı. Not girişi (`GradeWriteContextFactory.ReadScaleMaxAsync`) ve
politika ucu doğrudan `SchoolSettings.DefaultGradeScaleId`'yi okuyor. Sonuç: override
ekranda seçiliyor, hiçbir davranışı değiştirmiyor; 5'lik ilkokulda üst sınır 100 kalıyor.
⬜ İki yol var: servisi not modülüne bağlamak (öğrencinin kademesi roster'dan biliniyor)
ya da override'ı ayar yüzeyinden kaldırmak. Geçme notu zinciri de aynı serviste ve aynı
şekilde ölü.

✅ **Karar (2026-09-28, kullanıcı):** kademe ölçeği **not girişine bağlanır** (`IGradeScaleResolver` not girişi ve politika ucunda; kademeye göre üst sınır ve geçme notu). Uygulanacak.

### `TB-106` · Akademik politikanın not alanları tüketicisiz 🟡

`TB-46` ağırlığı tek yere indirdi ama tüketici gelmedi: `WrittenWeight` /
`PerformanceWeight` politika ucunda (`GET /grades/policy`) istemciye dönüyor, hiçbir
hesaba girmiyor — dönem içi ders ortalaması bilinçli olarak ağırlıksız (`GradeMath`).
`WrittenExamCount` / `PerformanceCount` (1–3 doğrulayıcılı) ve `RoundingRule` de
okunmuyor; sütun kataloğu master sınav türlerinden geliyor, "üç yazılı" seçen okul üçüncü
sütunu açamıyor. ⬜ Bu alanların gerçek tüketicisi karne / dönem sonu notu; o modül
gelene kadar ekranda "çalışıyormuş gibi görünen" üç ayar var. Ya ayar yüzeyinden gizlenir
ya da karne kararına bağlanır.

✅ **Karar (2026-09-28, kullanıcı):** **olduğu gibi kalır** (karne modülü gelene kadar).

### `TB-108` · Harf ölçeği seçilebiliyor ama not girişi harf kabul etmiyor 🟡

Master katalogda `HARFLI` ölçek var ve okul onu varsayılan seçebiliyor. Not girişi
`MarkValue.FromWire` ile yalnız sayı ve `G`/`M` tanıyor; harf ölçeğinin `MaxValue`'su
boş olduğundan üst sınır sessizce 100'e düşüyor. Harf sistemi seçen okulda öğretmen "A"
girince 400 alır, "85" girince kabul edilir. ⬜ Ya harf ölçeği katalogdan/seçimden
kaldırılır ya da harfli giriş ve ortalama kuralı tasarlanır ([[Not Ölçeği]] açık sorusu).

✅ **Karar (2026-09-28, kullanıcı):** harfli ölçek **katalogdan/seçimden kaldırılır**. Uygulanacak.

## 10. Ödevler 🟡

Kaynak: domain-map taraması, `oksis-api` @ `b72c819` (2026-09-03). Modülün haritası
[[Ödevler]] notunda. Dört madde de kodun kendi ARCHITECTURE notunda "açık madde" olarak
duruyordu ama defterde kaydı yoktu; ikisi ürün kararı bekliyor.

### `TB-251` · Ödev şeması testi sabit teslim tarihine bağlı — tarih geçince kırmızıya düştü ⚪

`E-29` doğrulamasında çıktı (2026-09-24). `packages/core/src/homework/schemas.test.ts` geçerli formu
`dueDate: "2026-09-18"` ile kuruyor. Şema geçmiş teslim tarihini reddettiği için tarih geçince iki test kırmızıya düştü
("geçerli formu kabul eder", "tek şube ile seçili öğrenciyi kabul eder"). Değişikliksiz tabanda da kırmızı (ölçüldü).
Ürün kodu doğru, test zamana bağlı.

⬜ Kapatma yolu: tarihi test anına göre üret (ör. bugün + 7 gün) ya da şemaya saat enjekte et. Aynı sabit tarih
kalıbı başka şema testlerinde de var mı, taranmalı.

✅ **2026-09-28 · kodda (gece turu, `oksis-ui` `fix/gece-defter-turu` `58253db`, merge bekliyor):** test saati 2026-09-10'a sabitlendi; core/api/api-mocks takımları 2028'e sabitlenmiş saatle koşuldu, başka tarih bombası çıkmadı. core 868/868. `TB-258` ve §12'deki `TB-220` aynı kusurun kopyası, birlikte kapandı.

### `TB-258` · Ödev form şeması testi sabit tarihe bağlı; tarih geçince kırmızıya döndü 🟡

2026-09-27'de `oksis-ui` `packages/core` tam koşusunda ölçüldü, `master`'da da aynı (değişiklik kenara alınarak
doğrulandı). `src/homework/schemas.test.ts` içindeki "geçerli form" örneği teslim tarihini sabit `2026-09-18` veriyor.
Şema geçmiş tarihi reddettiği için o günden beri iki test düşüyor ("geçerli formu kabul eder", "tek şube ile seçili
öğrenciyi kabul eder"). Kod doğru; test takvime bağlı. Kırmızı takım gerçek bir kırılmayı gizler.

⬜ Kapatma yolu: testte saati sabitle (`vi.useFakeTimers()` + `vi.setSystemTime`) ya da teslim tarihini "bugün + N gün"
diye üret. Aynı desen başka tarih doğrulamalı testlerde de aranmalı.

✅ **2026-09-28:** `TB-251` ile aynı commit'te kapandı (`58253db`).

## 11. Bildirimler 🟠

Kaynak: `oksis-api` @ `61808d25` bildirim altyapısı taraması (2026-09-10). Zincirin
kendisi (olay → Hangfire → dispatcher → kanal → teslim kaydı) ayakta; bulgular
**ayar yüzeyi ile teslimat arasındaki kopukluk** üzerinde toplanıyor — `TB-43`'ün
kapattığı sahte toggle sınıfının kalan hâli.

### `TB-126` · Katalogda `email: true` seed edilen üç olay e-posta üretmiyor 🟡

`EmailNotificationChannel`'ın 1. kapısı da aynı eşlemedir: `PushEventKeyMap`'te olmayan
tip e-posta atmaz. Seed ise `ATT_THRESHOLD`, `HOMEWORK_MISSING` ve `ANNOUNCEMENT_URGENT`
satırlarını `email: true` ile yazıyor — yani "uyarı eşiği aşıldı e-postaya da gider"
kararı her okulun `notification_rule_configs` tablosunda yazılı, karşılığı yok.
`HOMEWORK_MISSING`'in kendi seed yorumu bunu ayrıca vurguluyor ("e-posta YALNIZ burada
açık: velinin kaçırmaması gereken tek ödev haberi").

Fiilen e-posta üreten tek katalog varsayılanı `GRADE_PUBLISHED`. Kalan 13 eşlemeli olay
e-postayı okul açarsa gönderir. `ANNOUNCEMENT_URGENT` zaten `delivered: false` ile
işaretli, diğer ikisi `true` — yani ekran onları "çalışıyor" diye gösteriyor.
⬜ `TB-125` ile aynı kapı düzeltmesine bağlı.

✅ **Karar (2026-09-28, kullanıcı):** e-posta kanalı kapsamını **katalogdan** (`NotificationEventKeyMap`) alır; üç olay gerçekten e-posta göndermeye başlar (okul kapatabilir). Uygulanacak.

### `E-23` · SMS kanalının hiçbir uygulaması yok; matris sütunu, okul ayarı ve kota kartı sahte yüzey 🟡

`ISmsSender` bir arayüz olarak duruyor ("MVP'de concrete provider yok"), `Infrastructure`
altında implementasyonu ve DI kaydı **yok**; tek çağıranı da yorum satırı
(`RequestLoginOtpCommandHandler`). `INotificationChannel` uygulayan üç sınıfın hiçbiri
SMS değil. Buna karşılık sunucu yüzeyi SMS'i tam ciddiyetle taşıyor:
`NotificationChannel` enum'unda `Sms = 4`, katalogda `SupportsSms` + `DefaultSmsEnabled`,
altı olayda `supportsSms: true`, `PAYMENT_REMINDER`'da `sms: true` varsayılan,
`UpdateNotificationConfig`'te `SmsEnabled` + `DailySmsLimit`, ve `GET /schools/sms-quota`
sabit bir kota kartı döndürüyor (`IsPlaceholder: true`, 1000 kontör, gönderici başlığı
"OKUL").

`K-06` (2026-08-16) davet kanalı için "SMS/WhatsApp seçilemez" demişti ama matris sütunu
o kararla birlikte kaldırılmadı. ⬜ İki yoldan biri: sağlayıcı (Netgsm/İletimerkezi)
bağlanıp `SmsNotificationChannel` yazılır, ya da sütun ayar yüzeyinden gizlenip
`SupportsSms` katalogda `false`'a çekilir. Arada kalan hâl, yöneticiye kontör harcadığını
düşündüren bir toggle.

✅ **Karar (2026-09-28, kullanıcı):** SMS **yüzeyden gizlenir** — matris sütunu, okul ayarı ve kota kartı; katalogda `SupportsSms=false`. Sağlayıcı seçilince geri gelir. Uygulanacak.

## 12. Çapraz Kesen İşler ✳️

Tek bir ekranın değil, bir **sınıfın** işi. Kapanışları da merkezî olmak zorunda
([[yamalama-kabul-degil]]).

### `TB-220` · Ödev form testi sabit tarihle yazılmış; takvim geçince kendiliğinden kırmızıya döndü ⚪

`packages/core/src/homework/schemas.test.ts` geçerli formu sabit `dueDate: "2026-09-18"` ile
kuruyor. Şema teslim tarihinin **gelecekte** olmasını istediği için test 18 Eylül'den sonra
kendiliğinden düşüyor: 2026-09-20 koşumunda `homeworkFormSchema > geçerli formu kabul eder`
ve `tek şube ile seçili öğrenciyi kabul eder` kırmızı (core paketi 645/647).

Kusur şemada değil testte: "gelecek tarih" kuralı **bugüne göreli** olmalı
(`new Date()` + n gün), sabit bir güne çakılmamalı. Sabit tarihli her test bir zaman
bombasıdır — düştüğü gün ilgisiz bir işin ortasında düşer ve o işin kırmızısı sanılır
(bugün tam olarak böyle oldu: `B-53`/`TB-120` turunda çıktı).

⬜ Kapatma yolu: `valid` kurgusundaki tarih bugüne göreli üretilir; aynı dosyadaki diğer
sabit tarihler de taranır. Depodaki benzer kalıplar için tek geçiş yapılmalı.

✅ **2026-09-28:** `TB-251` ile aynı commit'te kapandı (`58253db`).

---

### `TB-231` · Entegrasyon takımının yarısı master'da kırmızı; push kapısının dışında olduğu için sessizce birikti 🟠

`K-28` turunda tesadüfen ölçüldü (2026-09-22).

**Ölçüm:**

| Nerede | Sonuç |
|---|---|
| `feat/meb-kaynakli-katalog` · tüm takım | **688 kırmızı / 1531** (%45) |
| `master` (`de7ced5e`) · `StudentAttendanceViewsTests` | **5 kırmızı / 11** — aynı hata, aynı satır |

Master ölçümü ayrı bir worktree'de yapıldı; yani kırmızılar **dalın getirdiği bir şey değil,
master'da duruyor.**

Hâkim hata: `System.Security.SecurityException: Cannot insert Subject without tenant context`
(`TenantSaveChangesInterceptor:31`). Sebebi kusurlu ürün kodu DEĞİL — ders kataloğu
`TB-191` ile okul kapsamına taşındı ve `Subject` tenant varlığı oldu; testler ise dersi hâlâ
bağlamsız bir `DbContext` ile ekliyor. `7d9302b7` (taşıma commit'i) **hiçbir entegrasyon
testine dokunmamış**.

**Asıl bulgu testlerin kendisi değil, neden fark edilmediği:** push kapısı
(`.githooks/pre-push`) build + Domain + Application + **Api** birim takımlarını koşuyor.
`Oksis.Infrastructure.IntegrationTests` kapının **dışında**. Aynı sınıf hata bu dalda ikinci
kez yaşandı: `Oksis.Tests` de kapı dışındaydı ve yedi kırmızıyla bulunmuştu
([[OKSİS - Bulgu Arşivi]] §51). Kapı dışındaki takım, kırmızıya düştüğünü kimseye
söylemiyor; ne zaman koşturulursa o zaman öğreniliyor.

**Zarar:** entegrasyon takımı bugün bir güvence üretmiyor. %45'i kırmızıyken yeni bir gerçek
regresyon gürültünün içinde kaybolur — takımın varlık sebebi ortadan kalkmış olur.

⬜ İki ayrı iş: **(1)** testleri tenant bağlamı kuracak şekilde düzelt (fixture'da ortak bir
`SeedSubjectAsync` yardımcısı, tek noktadan); **(2)** takım yeşile dönünce push kapısına ya da
en azından bir CI adımına bağla — yoksa aynı şey üçüncü kez olur.

⚠️ Docker gerektirdiği için kapıya doğrudan eklemek pahalı olabilir; o hâlde kapı yerine
ayrı bir zamanlanmış koşu + kırmızıda uyarı da kabul edilir. Karar gerektirir.

✅ **2026-09-28 · (1) kodda (gece turu, `oksis-api` `fix/gece-defter-turu` `e2aad5a0`, `af322046` ve devamı, merge bekliyor):** entegrasyon takımı **1595 testte 675 kırmızı → 1 kırmızı** (tam koşu, kırmızı ad kümeleri `comm` ile karşılaştırıldı, yeni kırmızı 0; Garage/ClamAV ortam kırmızısı çıkmadı). Merkez `DatabaseFixture`: okul açılışının tek ortak yolu (`CreateSchoolAsync` → okul bağlamında ders + sınav türü kataloğu içe aktarımı), `ImportSchoolCatalogsAsync`, `SeedSubjectAsync` (okul bağlamında ders), `SchoolSubjectIdAsync` (çekirdek → okul kimliği), `OpenGradeLevelsAsync` (kademe + eğitim programı tercihi), `Activated` (sezon). Duyuru kitlesi fixture'ı, 18 sınav dosyası, 9 dosyadaki bağlamsız ders yazımı ve sezon testleri bağlandı; branş kataloğu bilerek içe aktarılmadı (testler branşı kendi adıyla yazıyor). Kalan tek kırmızı `TB-261`. ⬜ **(2) push kapısı / CI kararı** artık verilebilir: takım neredeyse yeşil.

✅ **Karar (2026-09-28, kullanıcı):** (2) push kapısı hızlı kalır; **merge öncesi `./scripts/test-changed.sh --integration` zorunlu adım** olarak CLAUDE.md/AGENTS.md ve commit kurallarına yazılır. Uygulanacak.

### `TB-241` · Katalog ders adlarında kesme işaretinden sonra büyük harf: "Kur’An-I Kerim" ⚪

Altınay B4.2 ölçümünde görüldü (2026-09-22). `master.subjects`'te iki satır bozuk:
`Kur’An-I Kerim` ve `Kur’An-I Kerim’İn Anlam Dünyası`. Sebep:
`MasterSubjectCode.cs:36` adı `TextInfo.ToTitleCase` ile yeniden yazıyor. Tipografik
kesme (’) ve kısa çizgi kelime ayırıcı sayılıyor, ekler büyüyor (`-ı` → `-I`, `’in` → `’İn`).
Aynı çağrı `MebProgramIdentity.ToTitleCase`'te de var. Ad, okulun ekranına ve karneye
böyle iner. Branş eşleşmesini de zorlaştırması olası (`TB-240`; eşleşme adla yapılıyor).

⬜ Kapatma yolu: kesme işareti ve kısa çizgiden sonra gelen eki küçük bırakan bir başlık
dönüştürücü; mevcut iki satır için düzeltme.

✅ **2026-09-28 · kodda (gece turu, `oksis-api` `fix/gece-defter-turu` `2213cefe`, merge bekliyor):** ders ve program adı tek Türkçe başlık dönüştürücüsünden geçiyor (`Parsing/TurkishTitleCase.cs`; `MasterSubjectCode` ve `MebProgramIdentity` bağlı): kesme (’ ' ʼ ‘) ve harfe bağlı kısa çizgiden sonraki ek küçük; nokta, eğik çizgi ve parantez yeni kelime; Roma rakamı büyük ("Programı-I" ünlüden sonra rakam, "Kur’an-ı" ünsüzden sonra ek). 21 vaka. **İkiz satır riski ölçüldü, yok:** tekillik görüntü adına değil ham addan türeyen koda bağlı (`MasterSubjectCode.From`/`Fold`), eski ve yeni ad aynı koda katlanıyor (testli). ⬜ **Mevcut veri kendiliğinden düzelmez** (yayım var olan kodda adı yeniden yazmıyor): `master.subjects` 2 satır + `school.subjects` 10 satır için tek seferlik ad düzeltmesi — master'da `code` üzerinden, okul kopyalarında yalnız adı hâlâ bozuk olan satırlar (`name = N'Kur’An-I Kerim'`) ki okulun elle verdiği ad ezilmesin. Gerçek veri olduğu için yapılmadı, kullanıcı onayı bekliyor.

✅ **Karar (2026-09-28, kullanıcı):** mevcut bozuk adlar **göçle** düzeltilir (her ortamda aynı; okulun elle değiştirdiği adlara dokunulmaz, önbellek temizlenir). Uygulanacak.

### `D-24` · Davet ekranı okulun resmî adını gösteriyor, görünen adını değil ⚪

Altınay B6 turunda görüldü (2026-09-23). Davet önizlemesinde "Okul" satırı **"Altınay Eğitim
Kurumları"** diyor (`School.Name`). Okulun kendi paneli, sidebar ve künye ise görünen adı
**"Özel Altınay Anadolu Lisesi"** kullanıyor. `GetInvitationByTokenQueryHandler` ayarlardaki
`DisplayName`'i okumuyor. Aynı kurum adı altında iki okul olan Altınay'da davetli, hangi okula
katıldığını bu satırdan ayırt edemiyor (`ALTINAY-SBL` da "Altınay Eğitim Kurumları").

⬜ Kapatma yolu: önizleme görünen adı döner (boşsa resmî ada düşer). Logo sorgusu aynı
ayar satırını zaten okuyor.

✅ **2026-09-28 · kodda (gece turu, `oksis-api` `fix/gece-defter-turu` `b453124a`, merge bekliyor):** önizleme okul adını görünen ad → ayarlardaki resmî ad → `School.Name` sırasıyla veriyor (oturum bağlamı `GetCurrentContext` ile aynı sıra); ek sorgu yok. 3 birim testi.

### `V-04` · Öğrenci numarası: öneksiz okulda elle girişte "en az 100" şartı; sayaç elle girilen numarayı atlamıyor 🟠

Altınay B7 (2026-09-23). Rapor e-Okul numarasıyla (1–222) girişi öneriyordu; numarası 100'ün
altında olan ilk öğrenci `students.errors.student-number-invalid-format` ile reddedildi.
`StudentNumberValidator`: ön ek yoksa değer ≥ 100. Gerekçe belgelenmemiş; domain notu yalnız
kuralı söylüyor (sayacın 100'den başlamasının yansıması gibi).
İkinci ve daha sinsi kusur: `StudentNumberGenerator` sayacı 100'den artırıyor ve **elle
girilmiş numaraları atlamıyor**. Elle 102 girilmiş bir okulda sayaç 102'ye geldiğinde kayıt
tekillik indeksine çarpar ve `duplicate-enrollment` ile düşer. Yani kural ters korumadır: güvenli
olan <100 numaraları reddediyor, sayaçla çakışabilecek ≥100 numaraları kabul ediyor.

**Kullanıcı kararı (2026-09-23):** öğrenci numarası **her zaman otomatik** üretilir; sihirbaz
numara **sormaz**. Uygulandı: alan formdan kalktı, gövde `studentNumber: null` gönderiyor (test).
Altınay'ın 85 öğrencisi 100–184 aralığında numara aldı; e-Okul numarası OKSİS'te tutulmuyor.
⬜ **Açık kalan:** Excel içe aktarma (`ImportColumns` `OgrenciNo`) elle numara yolunu hâlâ açık
tutuyor ve sayaç çakışması orada yaşıyor. Karar gerekiyor: içe aktarmada da numara kalkar mı,
yoksa sayaç dolu numarayı atlar mı? Domain notu (`Öğrenci Numarası.md`) karara göre güncellenmeli.

✅ **Karar (2026-09-28, kullanıcı):** Excel içe aktarmada da **numara otomatik** — `OgrenciNo` sütunu yok sayılır/kaldırılır, tek kaynak sayaç; e-Okul numarası tutulmaz. Domain notu (`Öğrenci Numarası.md`) güncellenecek. Uygulanacak.

### `B-62` · Nakil öğrencinin devreden devamsızlığı hiçbir yere yazılmıyor 🟡

Altınay B7 (2026-09-23). Sihirbaz nakil kaydında *Özürsüz/Özürlü Gün Sayısı* soruyor ve özette
gösteriyor, ama değerler gövdeye **hiç konmuyor**. Altınay'daki 5 nakil kaydından sonra
`academic.absence_carry_overs` = 0 satır. Backend'de ayrı bir devir ucu var
(`POST attendance/carry-overs`, `attendance.manage`) ve kendi yorumu "kayıt akışına henüz
bağlanmadı" diyor.
Model de uyuşmuyor: sihirbaz **özürsüz/özürlü gün**, devir kaydı **devamsızlık + geç kalma
sayısı** tutuyor.

⬜ Karar gerekiyor: (a) sihirbaz alanları devir ucuna bağlanır (model uyumu kararıyla birlikte);
(b) alanlar kaldırılır ve devir ayrı ekrandan girilir. Bugün kullanıcıya veri alıyormuş gibi
görünüp sessizce atıyor.

✅ **Karar (2026-09-28, kullanıcı):** **sihirbaz devir ucuna bağlanır** — devir kaydı özürsüz/özürlü gün modeline genişletilir (e-Okul nakil belgesi gibi), sihirbaz değerleri kayıtla birlikte yazar. Uygulanacak.

### `B-63` · Sihirbazdaki "Birincil veli mi?" seçimi sunucuya gitmiyor 🟠

Altınay B7 (2026-09-23). Veli adımında iki ayrı kavram var: *Birincil veli mi? (Evet/Hayır)* ve
yetki olarak *Birincil İletişim*. `toGuardianInput` yalnız yetkiyi (`isPrimaryContact`)
gönderiyor; "Birincil veli" seçimi yalnız ekranda yaşıyor (rozet ve özet). Sonuç ölçüldü: 85
öğrencinin **33'ünde** birincil iletişim ya **0** ya **2** (21 kayıtta Birincil seçilen veli
yetkiyi taşımıyor, 26 kayıtta iki velinin ikisi de taşıyor). Listedeki "birincil veli" sütunu bu
yetkiden besleniyor.

⬜ Kapatma yolu: iki kavram birleşir. "Birincil veli" seçimi `isPrimaryContact`'i belirler ve
öğrenci başına tekillik sunucuda uygulanır. Ya da biri kaldırılır (karar).

✅ **Karar (2026-09-28, kullanıcı):** iki kavram **birleşir**: "Birincil veli" seçimi Birincil İletişim'i belirler, öğrenci başına tam bir birincil sunucuda zorlanır. **Onarım:** 0 ya da 2 birincili olan öğrencilerde **ilk eklenen veli** birincil olur. Uygulanacak.

### `D-25` · Öğrencinin ilk girişi "KVKK onayınız geri çekilmiş, yönetime başvurun" diyor 🟡

Altınay B7 (2026-09-23). Kayıt komutu öğrenci için rıza kaydı açmıyor. Öğrenci ilk girişte
rıza ekranına düşüyor ve ekran *"onay geri çekilmiş ya da metin güncellenmiş; okul yönetimine
başvurun"* diyor. Oysa öğrenci hiç onay vermedi ve aynı ekrandaki *"Okudum, kabul ediyorum"*
düğmesi sorunu kendisi çözüyor; 85 öğrencinin hepsi bu yoldan geçti.
Ürün sorusu da var: reşit olmayan öğrencinin KVKK rızasını kim verir (veli mi, öğrenci mi)?

⬜ Kapatma yolu: ilk onay ile geri çekilmiş onay ayrı metinle anlatılır; rızanın sahibi kararı.

✅ **Karar (2026-09-28, kullanıcı):** reşit olmayan öğrencinin KVKK rızasını **veli verir**; öğrenci yalnız aydınlatma metnini görür; ilk onay ve geri çekilmiş onay ayrı metinle anlatılır. Uygulanacak.

### `B-65` · "Önceki Sezondan Kopyala" kaynak sezonu yanlış seçebilir (gizli) 🟡

Altınay B9.2 kod kontrolü (2026-09-23). `teacher-assignments-page.tsx`:
`prevSeason = seasons.find(s => s.id !== current && !s.isArchived)`. Kaynak "arşivlenmemiş
başka **herhangi bir** sezon"; tarih sırası ya da durum denetlenmiyor. Bugün Altınay'da tek sezon
olduğu için düğme görünmüyor. Ama gelecek yılın **taslak** (Setup) sezonu açıldığı an, aktif
sezondayken "önceki sezondan kopyala" **gelecek sezonu** kaynak alır ve boş ya da yarım taslağı
aktif sezona kopyalamayı önerir. Ters yönde de, taslak sezonda bakarken aktif sezonun yerine
başka bir taslak seçilebilir.

⬜ Kapatma yolu: kaynak, hedeften önce başlayan en yakın sezon olarak (başlangıç tarihine göre)
seçilir; tercihen sunucu belirler.

✅ **2026-09-28 · kodda (gece turu, `oksis-ui` `fix/gece-defter-turu` `fb00cc5`, merge bekliyor):** kaynak saf ve testli `copySourceSeason`: hedeften önce başlayan en yakın sezon (`SeasonOption.startDate`). **Varsayım:** arşivlenmiş önceki sezon da kaynak olabiliyor (eski kod dışlıyordu; sunucu kısıtlamıyor) — istenmezse tek satır.

✅ **Karar (2026-09-28, kullanıcı):** gece turunun varsayımı onaylandı — **arşivlenmiş sezon da kaynak olabilir**.

### `D-26` · "Görevi kapat (devret)" onay istemiyor ve gerekçeyi sabit metinle yazıyor 🟡

Altınay B9.2 (2026-09-23). Satır menüsündeki kırmızı *Görevi kapat (devret)* tek tıkla
çalışıyor: onay penceresi yok, kapatma gerekçesi her zaman sabit metin (*"Yıl içi kapatıldı —
görev devredilebilir."*). Kapatılan görev iz kaydına düşüyor ve geri açma yolu yok. Yanlış
satıra basan idareci görevi geri alamıyor, iz kaydında da gerçek sebep yazmıyor.

⬜ Kapatma yolu: onay penceresi + gerekçe alanı (sabit metin öneri olarak kalabilir).

✅ **2026-09-28 · kodda (gece turu, `oksis-ui` `fix/gece-defter-turu` `abb1185`, merge bekliyor):** kapatma `ConfirmDialog` istiyor, gerekçe alanı sabit metinle ön dolu (kırpılır, boşsa null, ≤1000); sunucu reddi pencerede.

📺 **2026-09-28 · ekranda ölçüldü** (dal kodu: API 5113 + web 3005, Altınay, yalnız okuma): "Görevi kapat (devret)" → "Görev kapatılsın mı?" penceresi, öğretmen — ders, gerekçe alanı ön dolu; Vazgeç ile kapatıldı.

### `D-27` · Görevlendirme çekmecesi kayıt hatasında kapanıyor, hata başarı bildirimi gibi görünüyor 🟡

Altınay B9.2 kod kontrolü (2026-09-23). `drawer.tsx` `save()` hata kolunda `onSaved(mutationErrorDesc(err))`
çağırıyor. Sayfa bu çağrıda çekmeceyi kapatıp mesajı başarı bildirimiyle aynı yerde gösteriyor.
Kullanıcı seçimini ve yazdığı gerekçeyi kaybediyor, hatayı başarı sanabiliyor.
Kardeşi `CopyModal`: hata kolu sunucunun gerekçesini yutup sabit *"Kopyalama başarısız oldu."*
yazıyor (`X-01` kalıbı).

⬜ Kapatma yolu: hata çekmecenin içinde gösterilir, çekmece açık kalır; kopyalamada sunucu cümlesi
geçirilir.

✅ **2026-09-28 · kodda (gece turu, `oksis-ui` `fix/gece-defter-turu` `fab4132`, merge bekliyor):** hata çekmecenin içinde, çekmece açık kalıyor; `CopyModal` sunucu cümlesini gösteriyor.

### `D-28` · Arşiv sezonda Görevlendirmeler'de satır menüsü tamamen gizleniyor ⚪

Altınay B9.2 kod kontrolü (2026-09-23). `detail.tsx`'te `RowMenu` bütünüyle `h.canWrite` koşuluna
bağlı. Arşiv sezonda salt-okur ekranda yalnız *Görevi kapat* değil, **gezinme** öğeleri de
(*Öğretmen profilini aç*, *Dersi aç*) kayboluyor. Okuma yetkisi olan kullanıcı eksenler arası
geçiş yapamıyor.

⬜ Kapatma yolu: yalnız yazma öğesi koşula bağlanır.

✅ **2026-09-28 · kodda (gece turu, `oksis-ui` `fix/gece-defter-turu` `1fd3f2e`, merge bekliyor):** satır menüsü her zaman çiziliyor; yalnız "Görevi kapat" `canWrite`'a bağlı.

### `TB-244` · Logosu olmayan okulda her sayfa açılışında logo ucu 404 dönüyor ⚪

Altınay B7–B9 turlarında her sayfada ölçüldü (2026-09-23): `GET /api/v1/public/schools/{id}/logo` →
404, konsolda *Failed to load resource*. Altınay'ın logosu yok; istemci logonun varlığını
bilmeden isteği atıyor. Zararsız ama gerçek hataları konsolda gürültüye gömüyor (B7 turunda
403'ler ayıklanırken bu satır da her seferinde çıktı).

⬜ Kapatma yolu: okul ayarı logo yokken URL üretmez (istemci yer tutucuya düşer) ya da uç 204
döner.

🔎 **2026-09-28 · istemci tek başına kapatamaz (ölçüldü):** logonun varlığı yalnız `SchoolSettingsDetailDto.logoUrl` (yönetici izinli) ve `school-settings/public` (`X-Tenant-Code` istiyor) cevaplarında; oturum bağlamı `auth/me/context` logo taşımıyor. Kapatma: sunucu `ContextView.schoolLogoUrl: string | null` (ya da logo yokken 204), sonra istemci `null`'da istek atmaz.

✅ **2026-09-28 · sunucu ayağı kodda (gece turu, `oksis-api` `fix/gece-defter-turu` `774c9c43`):** `auth/me/context` → `schoolLogoUrl` (mevcut `ISchoolLogoUrlBuilder`; logo yoksa `null`, ek sorgu yok), 3 test.

✅ **2026-09-28 · istemci ayağı kodda (gece turu, `oksis-ui` `fix/gece-defter-turu` `fc759f8`, merge bekliyor):** web `active-role.tsx` ve mobil `use-portal-header.ts` (+ mobil kimlik ekranı) logoyu tek çözücüden (`resolveSchoolLogoSrc`/`resolveSchoolLogoUrl`) alıyor: bağlamdaki `schoolLogoUrl` (yöneticide okul ayarlarının `logoUrl`'i öncelikli); `null` iken istek atılmıyor, baş harfler gösteriliyor. Tarayıcıda ölçülmedi. Madde iki dal birleşince (ve codegen yeniden koşunca) ekranda 404'ün kalktığı ölçülerek kapanır.

📺 **2026-09-28 · ekranda ölçüldü** (dal kodu: API 5113 + web 3005, Altınay, yalnız okuma): müdür panosu ve diğer sayfalarda logo isteği hiç atılmıyor, 404 yok.

### `D-29` · Katalog satırındaki simge düğmelerinin adı yok; pasife alma tek tık ve onaysız 🟡

Altınay `B-64` ekran ölçümünde yaşandı (2026-09-23). *Ayarlar › Akademik Yapı › Ders Kataloğu*
satırında iki simge düğmesi var (kalem = düzenle, güç = aktif/pasif). İkisinin de erişilebilir adı
(`aria-label`/`title`) yok; ad yalnız fareyle üzerine gelince çıkan ipucunda. Pasife alma da onay
istemiyor. Otomasyon "satırın son düğmesi = düzenle" varsayımıyla bastı ve **Kur'an-ı Kerim**
dersini pasife aldı. Aynı düğmeyle hemen geri alındı; dersin görevlendirmesi yoktu, başka veri
etkilenmedi (DB ile doğrulandı). Ekran okuyucu kullanıcısı iki düğmeyi ayırt edemez; fareyle yanlış
tıklayan idareci ise dersi uyarısız pasife alır.
Aynı kalıp muhtemelen Branş ve Sınav Türü kataloglarında da var (ölçülmedi).

⬜ Kapatma yolu: simge düğmelerine ad; pasife alma için onay (dersin görevlendirme/program
kullanımı varsa onu da söyleyerek).

✅ **2026-09-28 · kodda (gece turu, `oksis-ui` `fix/gece-defter-turu` `ec6aba8`, merge bekliyor):** ortak `AIconBtn` — satır bağlamlı `aria-label` (Ders, Branş, Sınav Türü kataloglarında ve aynı kalıbı taşıyan Zil/Tatil satırlarında); pasife alma / listeden düşürme onaylı; Sınav Türü onayı kullanımı (`isInUse`) söylüyor, ders/branşta kullanım verisi olmadığı için onay yalın.

📺 **2026-09-28 · ekranda ölçüldü** (dal kodu: API 5113 + web 3005, Altınay, yalnız okuma): Ders Kataloğu satır düğmeleri "Tarih — Düzenle" / "Tarih — Pasife al" adlarını taşıyor. Pasife almanın `ConfirmDialog`'dan geçtiği kodda doğrulandı (`course-catalog.tsx:126`); gerçek veride tıklanmadı.

### `TB-237` · Branş kataloğu boş: seed silindi, yerine geçecek yüzey yazılmadı 🔴

Kullanıcı sordu (2026-09-22): *"Merkez platform sadece dersleri getirmez, branşları getirmek
için de bir altyapı kurulmuş olması lazım. Bunu ne merkez platformunda ne de okul
platformunda görüntüleyemiyorum."* Ölçüm onu doğruladı.

**Kök neden bir regresyon:** `d30d2bb7` (2026-09-21) *"ders, branş ve ders↔branş seed'leri
silindi"*. Gerekçesi: *"branş ve bağ öğretmenlik alanları kararı işlenince [doğar]"*. Ders
tarafında bu gerçekleşti (çizelge yayımlanınca 67 ders geldi); **branş tarafında hiç
gerçekleşmedi**, çünkü kararı işleyecek yüzey yazılmamıştı. Seed, yerine geçeni hazır
olmadan silinmiş.

| Halka | Durum (ölçüm) |
|---|---|
| Kapak tanıyıcı `MebCoverParser` | ✅ `TeachingFields` türünü tanıyor |
| Ayrıştırıcı `MebTeachingFieldsParser` | ✅ var, birim testli (2014 fixture'ı) |
| `POST .../documents/{id}/teaching-fields` | ✅ var (`apply` önizle/uygula) · ❌ **0 çağıran** |
| Keşif | ⚠️ yalnız TTKB **kategori 7**; karar kategori listesinde DEĞİL |
| `master.branches` · `master.subject_branches` | ❌ **0 · 0** |
| `school.branches` (tüm okullar) | ❌ **0** — seed okulları dâhil |
| Okul ekranı Ayarlar › Branş Kataloğu | ✅ var, düğme gerçek uca bağlı (`TB-200`) |

**Zarar `TB-193`'ün ölçtüğü zincirin aynısı, bir kat daha derini:** branş yok → öğretmene
branş atanamaz → görevlendirme yapılamaz (`assignments.teacher-no-branch`) → ders programı
üretilemez. Kadro/sınıf turu (Aşama 10) bu yüzden ilk adımda tıkanırdı.

Sinsi tarafı: okulun "MEB'den Getir" düğmesi **çalışıyor**, yalnız boş kaynaktan boş
getiriyor. `TB-200` tam bu yanlış-güven sorununu kapatmıştı; şimdi bir katman yukarıda
yeniden oluştu.

**Karar belgesinin yeri ölçüldü:** TTKB'de bir kategori listesinde değil, kendi içerik
sayfasında — `/www/ogretmenlik-alanlari-atama-ve-ders-okutma-esaslari/icerik/807`. Güncel PDF
`2025_12/23100922_9_cizelgeveesaslar.pdf` (49 sayfa). Yani keşif oraya **hiç ulaşamaz**;
mekanizma kategori ajax'ı üzerine kurulu.

**Ayrıştırıcı canlı belgede denendi** (fixture 2014 kararı, canlı belge Aralık 2025 —
`TB-226` sınıfı bir risk vardı): kapak `TeachingFields` tanındı, 49 sayfa, **107 alan, 0
uyarı**. Düzen değişmemiş.

✅ **Merkez ayağı kapandı (2026-09-22).**
- `SourceDocumentDto`'ya `Kind` eklendi — ekran indirdiği belgeye hangi işlemi sunacağını
  bilemiyordu.
- MEB Kaynakları ekranına **adresten getir** kutusu: keşfin ulaşamadığı belgeler için.
- Belge `TeachingFields` ise **Öğretmenlik alanları** paneli: önizle → branş kataloğuna işle.
  Önizlemeden uygulanamaz (düğme kilitli).
- Uçtan uca gerçek API ile doğrulandı: getir → `kind=TeachingFields` → önizleme
  **107 branş · 93 ders-branş bağı · 137 eşleşmeyen ders**; `master.branches` önizlemeden
  sonra hâlâ 0 (yazmadı).

⬜ **Açık kalan:** uygulama düğmesine **kullanıcı basacak** — `TB-193`'ün 2026-09-16
kararının aynısı: *"saha testinin amacı gerçek kullanıcı yolunu ölçmek; veriyi arkadan
doldurmak o ölçümü yok ederdi."* Ayrıca `TB-193`'ün kalıcı ayağı (okul açılışında branş
tohumu + mevcut boş okullara backfill) hâlâ açık ve ancak `master.branches` dolunca anlamlı.

⬜ Merkez ekranı görsel olarak doğrulanmadı: platform ayrı hesap ve kullanıcının okul
oturumunu düşürme riski vardı. HTTP zinciri ve tip/lint kapısı yeşil.

### `TB-236` · Dört müfredat saati ucu hâlâ çağıransız 🟡

`TB-232` kapanırken sayım yapıldı ve kapanış notundaki *"13 ucun tamamı çağıran kazandı"*
iddiası **yanlış çıktı**. Müfredat ekranı 7 uca çağıran getirdi, biri `K-30` ile silindi;
**dördü hâlâ çağıransız**:

| Uç | Nereye ait | Neden bu ekranda değil |
|---|---|---|
| `curriculum-hours/required-total` | Ders Programı | Şubenin haftalık yükünün tamam olup olmadığını çizelge ekranı sorar |
| `curriculum-hours/subject/{id}` GET | Ders Kataloğu | Ders bazlı saat çekmecesi — müfredat ekranı seviye×ders hücresinden düzenliyor |
| `curriculum-hours/catalog` | Ders Kataloğu | Liste için ders başına min–max saat sütunu |
| `curriculum/snapshot` | — | `diff` kilitli sezonda zaten snapshot'tan okuyor; bu uç `LockedAt` ve seviye başına dondurulan sürümü ek olarak veriyor |

Üçü **henüz yazılmamış ekran yüzeylerine** ait, dolayısıyla bu bir gecikme; ama aynı sınıfın
kusuru `TB-232` ve `TB-233`'te iki kez ısırdı: [[eksik-ekran-eksik-yetkiyi-gizler]] —
çağrılmayan uç arkasındaki kusurları da saklar. Bu yüzden sohbette bırakılmıyor.

➕ **2026-09-27 (TB-239 kapanış ölçümü):** `required-total` yalnız `gradeLevelCode` alıyor, şubenin alanını (profil) almıyor.
Altınay'da 9 → 39, 10 → 39 doğru; 11 → 21, 12 → 23 dönüyor çünkü alansız "Genel" profili okunuyor (alanlı şubelerin gerçek
yükü 39; Genel profili kullanan şube yok). Uç bağlanırken şube ya da alan parametresi eklenmeli; üretici
(`CurriculumWeeklyHourProvider`) zaten şubenin alanını okuyor.

⬜ Ders Programı ve Ders Kataloğu yüzeyleri yazılırken bu üçü bağlanır. `snapshot`'ın
gerçekten gerekli olup olmadığı ayrıca kararlaştırılır — gereksizse silinmesi, çağrılmayan
uç olarak durmasından iyidir.

✅ **Karar (2026-09-28, kullanıcı):** **`curriculum/snapshot` silinir**; diğer üç uç ait oldukları ekranlar yazılırken bağlanır (`required-total` şube/alan parametresiyle). Uygulanacak.

### `TB-234` · Müfredatı boş doğan sezondan ürün içinde çıkış yolu yok 🟠

`TB-233` düzeltilirken görüldü: düzeltme **açılış anına** etki ediyor, bootstrapper idempotent
olduğu için var olan taslağı yeniden bağlamıyor. Zaten açılmış sezonun boş müfredatını
kurtaracak bir yol ürün içinde yok:

- `AcademicSessionsController`'da **silme ucu yok** — hazırlık (`Setup`) aşamasındaki sezon
  bile silinemiyor. Domain'de yalnız `Setup → Active → Archived` var, geri dönüş yok.
- `POST curriculum/rebase` tam bu iş için vardı **ama ekranı yoktu** (`TB-232`).
  `TB-232` 2026-09-22'de kapandı ve düğme Akademik › Müfredat ekranına geldi; artık
  hazırlıktaki sezon ürün içinde kurtarılabiliyor. **Açık kalan:** taşıma yalnız
  hazırlıktaki sezona yazar — zaten başlamış bir sezonun boş snapshot'ı hâlâ
  kurtarılamıyor ve `Setup`'a dönüş yok.

Sonuç: müfredatı boş doğan okulun tek çıkışı okulu yeniden açmak. Kullanıcı testinde
fiilen bu yaşandı.

✅ **Yarısı kapandı (2026-09-22).** `TB-232` ekranı yazıldı ve rebase düğmesini taşıyor
([[OKSİS - Bulgu Arşivi]] §54): **hazırlıktaki** sezon artık ürün içinde kurtarılabiliyor.

⬜ **Açık kalan iki ayak:**
1. Başlamış sezonun boş snapshot'ı hâlâ kurtarılamıyor — rebase yalnız `Setup` sezona
   yazar, `Active → Setup` dönüşü yok. Bu okul için ekranın söyleyebileceği tek şey
   "sezon başladığında müfredatınız boştu".
2. Hazırlık aşamasındaki sezonun silinebilmesi ayrı bir soru — karar gerektirir.

✅ **2026-09-28 · 2. ayak çözülmüş (ölçüldü):** "silme ucu yok" ifadesi yanlıştı — `cancel-setup` (`32ccead6`) hazırlıktaki sezonu siliyor, `reopen-to-draft` (`3cf3999b`) var, web'de silme penceresi `academic-sessions-page.tsx:575-582`. ⬜ 1. ayak (başlamış sezonun boş snapshot'ını kurtarma) açık.

### `TB-230` · İzin çözücü `Platform` portalını tanımıyor; platform rolü hiçbir izin taşıyamaz 🟡

`TB-165` kapanırken ayrıldı (`K-28`, 2026-09-22): o madde **ucun kendisi silindiği için**
kapandı, altındaki boşluk çözüldüğü için değil. Boşluk ölçülmüş hâliyle duruyor.

`AccountPermissionResolver.MapProfileToPortal` (`:72-90`) `Platform` portalını **hiçbir
profile eşlemiyor**. Aktif profil varken portal süzgeci, `Platform` portalındaki bir rolün
bütün izinlerini eler. Yani bir platform rolü bugünkü izin çözümü üzerinden hiçbir izin
taşıyamaz.

**Bugün neden patlamıyor:** platform istekleri bu çözücüden hiç geçmiyor. Kapı
`TenantContextBehavior`'ın `PlatformOnly` kolu; platform komutları `[RequirePermission]`
taşımıyor ve `AuthorizationBehavior` izin listesi boşsa doğrudan `next()` diyor. Okul
oturumunda platform rolünün izinlerinin elenmesi de **doğru** davranış.

**Ne zaman patlayacak:** `0019`'un üç platform rolü (`PLATFORM_ADMIN` / `PLATFORM_OPERATIONS`
/ `PLATFORM_SUPPORT`) gerçek izin denetimi isteyince. Destek rolünün "salt-okunur" olması bir
izin ayrımıdır ve bugünkü çözücüyle ifade edilemez; üç rol de aynı şeyi yapabilir hâle gelir.

⬜ Kapanış `0019` ile: platform tarafına **ayrı bir izin çözücü**. `MapProfileToPortal`
o güne kadar DEĞİŞTİRİLMEMELİ — okul oturumundaki eleme kasıtlıdır.

### `TB-169` · Platform giriş ucunda hız sınırı politikası yok ⚪

`K-27` ilk diliminde bilinçli olarak dışarıda bırakıldı ve plan gereği deftere yazıldı.
`POST api/v1/platform/auth/login` okul girişindeki `UseRateLimiter` politikasına bağlı değil.
Hesap kilidi var: 5 hatalı denemede 15 dakika (`PlatformAccount.MaxFailedAttempts`), yani tek
hesaba kaba kuvvet sınırlı. Ama IP bazlı sınır yok ve bilinmeyen e-postalar sayaca girmiyor,
dolayısıyla hesap avı sınırsız. Şimdilik yalnız bir platform hesabı olduğu ve dev ortamında
koştuğu için ⚪.

⬜ Kapatma yolu: okul girişinin politikası platform ucuna da uygulanır. `0019` rolleri gelip
platform hesap sayısı artmadan yapılmalı.

✅ **2026-09-16 · kapandı (gece turu, commit bekliyor) — ve bulgu sanılandan genişti.** Ölçüm: depoda
**tek bir `[EnableRateLimiting]` yoktu**, yani `Program.cs`'teki üç politika tanımlıydı ama hiçbir uca bağlı
değildi; **okul girişi de korumasızdı**. Ayrıca `authenticated`/`anonymous` politikaları **bölümlenmemiş tek
kova**ydı: okul girişine bağlansaydı tek saldırgan bütün okulun girişini kilitlerdi. Bu yüzden yeni
`Api/Extensions/RateLimitingSetup.cs` ile **IP bölümlü** iki politika yazıldı: `school-login` (60/dk/IP) ve
`platform-login` (10/dk/IP, ayrı kova). Bağlananlar: okul girişi, parola unuttum ve sıfırlama (üçü de anonim ve
hesap hedefli), bir de platform girişi. Ret yanıtı standart `ApiResponse` zarfı (`RATE_LIMITED`) + `Retry-After`.
Test: gerçek Kestrel üzerinde sınır 2'ye indirilip 3. istekte 429 ve iki kovanın ayrı olduğu ölçüldü (6 test).
⬜ **Açık kalan:** `ForwardedHeaders` kurulu değil — API bir ters vekil arkasında koşarsa tüm istekler tek IP
görünür ve bölümleme fiilen tekleşir (kodda yorumla işaretli, ayrı iş). Davet kabulü için yazılmış
`invitation-public` politikası da hâlâ bağsız.

✅ **2026-09-28 · `invitation-public` bağlandı (gece turu, `oksis-api` `fix/gece-defter-turu` `b98bcb17`):** davet önizleme (`GET by-token/{token}`) ve kabul (`POST accept`) uçları ortak, IP bölümlü, girişten ayrı kovada; sınır yapılandırmaya taşındı (`RateLimiting:InvitationPublic`, varsayılan 10/dk). Gerçek HTTP testinde 429 + `Retry-After`, davet kovası tükenince giriş kilitlenmiyor. **Not:** 10/dk/IP okulun ortak ağından toplu kabulde dar kalabilir, yapılandırmadan değişir. ⬜ Açık: yalnız `ForwardedHeaders` (dağıtım kararı).

✅ **2026-09-28 · istemci ayağı kodda (gece turu, `oksis-ui` `fix/gece-defter-turu` `34cecc4`, `2983c22`):** merkezî `ApiError.retryAfterSec` (`Retry-After` saniye ya da HTTP tarihi); `apiErrorDesc` 429'u "Çok fazla deneme yapıldı. N saniye sonra tekrar deneyin." diye anlatıyor, sorgular 429'u yeniden denemiyor; davet önizleme/kabul ekranları (web + mobil) ayrı "ratelimited" durumu gösteriyor; giriş ekranı sabit 60 sn yerine sunucunun süresini sayıyor. ⬜ **Yeni ayak:** CORS yalnız `X-Correlation-Id`'yi açığa veriyor (`Program.cs:185`) — web API'ye başka kökenden giderse `Retry-After` okunamaz; `WithExposedHeaders`'a eklenmeli.

✅ **2026-09-28 · CORS ayağı kodda (gece turu, `oksis-api` `fix/gece-defter-turu` `2dbaac65`):** `WithExposedHeaders("X-Correlation-Id", "Retry-After")`. Açık kalan yalnız `ForwardedHeaders`.

### `TB-174` · Yarım Gün zil şablonu hiçbir okulda kaydedilemiyor — tekil indeks şablonu kapsamıyor (500) 🟠

Altınay saha testinde (B2.3, 2026-09-15) müdür Tam Gün çizelgesini kaydettikten sonra Yarım
Gün'e geçip kaydedince `POST school-settings/bell-schedules/bulk` **500 `InternalError`** döndü
(correlationId `683a5b14…`). Sunucu günlüğü:
`SqlException: Cannot insert duplicate key row … unique index 'ux_school_bell_schedules_school_order'. The duplicate key value is (b38c8595-…, 6)`.

**Kök neden:** `5a1250af` (2026-06-24, "Zil şablon (TemplateKey) + BellDayAssignment") şablon
kolonunu ekledi ama tekil indeksi eski hâlinde bıraktı: `(school_id, lesson_order)`, süzgeç
`is_deleted = 0` (`BellScheduleConfiguration.cs:57-60`). `BulkCreateBellScheduleCommandHandler:40-42`
yalnız **gelen şablonun** satırlarını siliyor, sonra 1'den başlayan `lessonOrder`'larla ekliyor →
Tam Gün satırları aynı sıraları tuttuğu için çakışıyor. DB ölçümü: **beş okulun hiçbirinde tek bir
`HalfDay` satırı yok** — özellik yazıldığı günden beri hiç çalışmamış. İhlal okunur bir hataya
eşlenmediği için ekrana 500 düşüyor.

**Yalnız indeksi düzeltmek yetmez — şablona bakmayan beş tüketici var:**

| Tüketici | Bugün | Yarım Gün satırı yazılınca |
|---|---|---|
| `GetTodaysSubstitutionBoardQueryHandler` (Step 4) | `ToDictionary(LessonOrder)` | Aynı anahtar iki kez → `ArgumentException` → **vekâlet panosu 500** |
| `GetMySubstitutionsQueryHandler` (Step 5) | `ToDictionary(LessonOrder)` | Aynı → **"vekâletlerim" 500** |
| `GetAvailableRelieversQueryHandler` | Öğle arası sıraları şablon karışık toplanıyor | Yanlış öğretmen meşgul sayılır |
| `AutoDistributeDutyJob` | Aynı öğle arası birleşimi | Nöbet dağıtımı yanlış çakışma görür |
| `BellScheduleProvider.GetPeriodCountAsync` | Tüm `Lesson` satırlarını sayıyor | Günlük ders sayısı iki şablonun toplamı olur |

Şablonu gün atamasıyla çözen tüketiciler doğru: `AttendanceDayLessons`, `SessionMaterializer`,
`ExamPeriodLabeller`, `PublishedScheduleQueryHandler`.

⬜ Kapatma yolu: indeks `(school_id, template_key, lesson_order)` + göç; şablon çözümü tek bir
yardımcıya çekilip (gün → `BellDayAssignment` → şablon) beş tüketici ona bağlanır; kısıt ihlali
okunur bir koda eşlenir. Tüketiciler düzelmeden indeks değişirse vekâlet ekranları kırılır — ikisi
aynı commit'te gitmeli.

➕ **Sessiz ikinci etki (DB ölçümü):** Altınay'ın gün atamaları kaydedildi — Pzt–Per `FullDay`,
**Cuma `HalfDay`** — ama `HalfDay` şablonunda satır yok. Gün atama komutu satırsız şablona atamayı
reddetmiyor. `SessionMaterializer.GetLessonBellsAsync` (`:265-296`) ve `AttendanceDayLessons` şablonu
gün atamasından çözdüğü için Cuma'nın ders listesi **boş** döner → Cuma günleri yoklama oturumu
hatasız ve sessizce hiç üretilmez (koddan çıkarıldı; sezon açılınca C1.1'de ölçülecek).
⬜ Ek kapatma: satırı olmayan şablona gün atanamasın ya da ekran uyarsın.

✅ **2026-09-16 · sunucu ayağı kodda düzeltildi (gece turu, `oksis-api` `fix/ilk-sezon-acilisi`, commit bekliyor).**
Göç `20260915222342_20260916_bell_schedule_template_order_index`: indeks `(school_id, template_key, lesson_order)`,
`is_deleted = 0` süzgeci korundu — dev DB'ye uygulandı, `sys.indexes`'te doğrulandı. Şablon çözümü tek yardımcıda:
`Application/Modules/Schools/Common/BellDayTemplates.cs` (gün → `BellDayAssignment` → şablon → o şablonun zilleri,
1..N ordinal ders listesi, haftalık ızgara şablonu) + `BellScheduleIndex.cs` (indeks adından ihlal tanıma).
Bağlanan tüketiciler: defterdeki beşi, **ayrıca envanterde çıkan iki kırık daha** — `PublishedScheduleQueryHandler`
(defterde "doğru" sayılmıştı, şablona bakmıyordu) ve `GetSchoolSettingsQueryHandler.DailyLessonCount`; doğru çalışan üçü
(`AttendanceDayLessons`, `SessionMaterializer`, `ExamPeriodLabeller`) davranışları korunarak aynı yardımcıya geçti.
İki açık politika: yoklama/oturum üretimi yalnız açık atamayı şablon sayar, saat/öğle/ızgara okuyanlar atama yoksa Tam
Gün'e düşer. Gün bilgisi olmayan bağlamlar (ders sayısı, yayınlı ızgara) "haftaya atanmış en uzun şablon"u okur — gün
bazlı ızgara sözleşme değişikliği ister, `E-25` kararına bırakıldı. Ayrıca vekâlet panosu ham `lesson_order` ile
eşliyordu, teneffüs sıra tükettiğinde saat kayıyordu; artık ordinal eşleme. Kısıt ihlali bulk'ta `ConflictException`
(409 + katalog cümlesi) — başarısız `Result` dönseydi `ExecuteDeleteAsync` COMMIT edilip şablon boşalırdı.
Canlı ölçüm (seed okul `TST-AL`, Altınay'a dokunulmadı): FullDay 204 → **HalfDay 204** (bulgudaki 500 kapandı) →
tekrar 204; Cuma=HalfDay atamasıyla vekâlet panosu gün bazlı saat döndürdü; `dailyLessonCount` 8 (iki şablonun toplamı
12 değil). Ölçüm verisi geri alındı. Birim: Domain 1067 · Application 2663 · Api 435 · mimari 7 yeşil.
**Açık:** entegrasyon koşusunun özeti alınamadı (ClamAV testi ortam kaynaklı düşüyor, madde dışı), `dotnet format`
koşulmadı, "satırsız şablona gün atanamasın" sunucu kuralı yazılmadı — ekran uyarısı var (`B-51` notu).

➕ **2026-10-01 · `E-25` yalnız etiket olarak kapandı** ("1. Program / 2. Program", okul ad vermiyor), yani yukarıda ona bırakılan
**gün bazlı ızgara** işi artık bu maddede açık. Altınay'da somutlaştı: Cuma 2. programda (08:55–15:25, öğle 6. dersten sonra),
Pzt–Per 1. programda; iki şablon da 8 ders olduğu için gün bilgisi olmayan bağlamlar (yayınlı haftalık ızgara, ders sayısı) tek
şablon okur ve **Cuma sütununda Pzt–Per saatleri** görünebilir. Yoklama, vekâlet ve nöbet gün bazlı okuduğu için doğru. Ekranda
ölçülmedi; B9.5/B10.2 rol gezintisinde bakılacak.

✅ **Karar (2026-09-28, kullanıcı):** satırsız şablona gün ataması **sunucuda 409 ile reddedilir**. Uygulanacak.

### `TB-177` · Tatil Takvimi resmî tatilleri yıl ve bitiş tarihine bakmadan birleştiriyor — her dini bayram 5 kez 🟡

Seed okulu `s1` (sezon 2026-09-15 → 2027-06-13) ile canlı ölçüldü: `GET school-settings/holidays?seasonId=…`
25 resmî kayıt döndürüyor; **Ramazan Bayramı, arifesi, Kurban Bayramı ve arifesi dörder değil beşer kez**
(ör. Ramazan Bayramı: 2027-02-04, 02-14, 02-26, 03-09, 03-19). Hepsinde `endDate = null`.

Neden: katalog (`master.official_holidays`) dini bayramları **yıla özgü satırlar** olarak tutuyor
(2026–2030, `year` dolu, `is_annual=0`, çok günlülerde `end_month/end_day`, arifede `is_half_day=1`).
`GetHolidaysQueryHandler:83-110` yalnız `Id, Name, Month, Day` seçip her satırı sezonun her yılına
yansıtıyor: `Year`, `EndMonth/EndDay`, `IsHalfDay`, `IsAnnual` yok sayılıyor. Böylece 2026, 2028, 2029 ve
2030'un bayram tarihleri de 2027'ye düşüyor; çok günlü bayram tek gün, arife tam gün görünüyor.

Yoklamanın okuduğu `HolidayCalendarReader:60`, `GetSchoolHolidaysForSession:46` ve
`GetOfficialHolidaysInRange:27` bu alanların hepsini okuyor — yani **devamsızlık hesabı doğru, müdürün
gördüğü tatil listesi yanlış.** Aynı kavramın iki birleştirme mantığı var.

⬜ Kapatma yolu: ayar listesi resmî tatilleri kendi döngüsüyle değil `HolidayCalendarReader`/ortak
çözücüyle üretir; tek kaynak.

✅ **2026-09-16 · kapandı (gece turu, commit bekliyor).** `GetHolidaysQueryHandler` kendi döngüsünü bıraktı,
yoklamanın okuduğu **aynı** `OfficialHolidayResolver.ResolveForRange`'i kullanıyor; çözücüye eksik alanlar taşındı
(`Id`, `IsAnnual`, `IsHalfDay`). Sözleşme: `HolidayDto` ve `HolidayCalendarDto` artık `isHalfDay` taşıyor (arife tipi
`PublicHoliday` kalıyor — `HalfDay` yazmak istemcinin kategori eşlemesini bozup arifeyi "düzenlenebilir" gösterirdi).
Canlı ölçüm (seed `s1`, önbellek temizlendikten sonra): **25 resmî kayıt → 9**, tekrar yok; Ramazan 8–11 Mart 2027,
Kurban 15–19 Mayıs 2027, arifeler yarım gün; `isRecurring` artık katalogdan (millî `true`, dinî `false`).
Arayüzde `countHolidayDays` yarım günleri saymıyor, yeni `formatHolidayDuration` arifeyi "Yarım gün" yazıyor
(web + mobil); core 605 test yeşil, typecheck ve lint temiz.
**Varsayım (onay bekliyor):** yan karttaki "Toplam N gün" *tam kapalı* gün sayısıdır, arife eklenmiyor (okul o gün
açık). 0,5 saymak da savunulabilirdi.

✅ **Karar (2026-09-16, kullanıcı) — varsayım DEĞİŞTİ:** yarım gün (arife) toplam süreye **0,5 gün** olarak
girer: `Toplam gün = tam gün sayısı + (yarım gün sayısı × 0,5)`. Kullanıcının koyduğu ayrım da yüzeye taşınacak:
**"kaç tarih tatil"** ile **"toplam tatil süresi"** aynı şey değildir (3 yarım gün = 3 kayıt ama 1,5 gün).
Gösterim Türkçe ondalıkla ("11,5 gün"). Uygulama `oksis-ui`'de yapılıyor.

✅ **Uygulandı — 2026-09-16 (commit bekliyor).** Çekirdek tek yerde: `holidayWeightsByDay()` takvim günü → ağırlık
haritası kuruyor (yarım gün 0,5, tam gün 1); **çakışan günler iki kez sayılmıyor, en yüksek ağırlık kazanıyor** (arifenin
üstüne okul tatili girilmişse o gün 1'dir, 1,5 değil). Dört soru dört ayrı alan oldu: kaç kayıt · kaç tarih · kaçı yarım
gün · toplam kaç gün süre (`countHolidayDates` yeni). Biçimlendirme tek yerde (`formatDayCount`): "11,5 gün", tam sayıda
",0" kuyruğu yok; `toLocaleString` kullanılmadı (core'un RN/Hermes gerekçeli mevcut kuralı). Yan kart artık "Tatil Günü
13 tarih · Yarım Gün 3 tarih · Toplam Süre 11,5 gün" gösteriyor, aynı üç satır mobil ekrana da eklendi (orada daha önce
hiç toplam yoktu). core 615 test yeşil (tatil mantığı 13 → 23), typecheck ve lint üç pakette temiz.
**Varsayım:** `isHalfDay` kayıt düzeyinde tek bir bayrak olduğu için çok günlü bir yarım gün kaydında bütün günler 0,5
sayılır; arife katalogda zaten kendi tek günlük kaydı olduğundan bu durum pratikte oluşmuyor.
**Altınay ekranında yeniden ölçüm yapılmadı** — müdür parolası bilinmiyor; aynı katalog ve çözücü Altınay'a da
uygulandığı için "Resmî 25 / Toplam 47 gün" sayaçlarının düzelmesi bekleniyor, uyanınca ekrandan teyit edilmeli.

➕ **2026-09-16 · Altınay ekranında ölçüldü** (sezon `2026-2027` açıldıktan sonra Ayarlar → Tatil Takvimi): "Resmî 25";
Ramazan Bayramı ve arifesi 3–4 Şubat, 13–14 Şubat, 25–26 Şubat, 8–9 Mart, 18–19 Mart; Kurban Bayramı ve arifesi 13–14 Nisan,
23–24 Nisan, 4–5 Mayıs, 15–16 Mayıs, 25–26 Mayıs. Doğrusu (MEB/İstanbul takvimi ve katalogun 2027 satırı) yalnız Ramazan
8–11 Mart, Kurban 15–19 Mayıs. Yan kartın **"Toplam 47 gün"** sayacı bu sahte satırlarla şişiyor.

🔎 **2026-09-28 · kod çözülmüş (ölçüldü):** `GetHolidaysQueryHandler.cs:102` → `OfficialHolidayResolver` (`425160d4`); seed `s1`'de 9 resmî kayıt, tekrar yok. Altınay'daki "25" ölçümü büyük olasılıkla eski API'ye karşı alınmış; yalnız Altınay ekranında "Resmî 9" teyidi kaldı.

### `D-21` · Liste ekranları "hiç kayıt yok" ile "filtreyle eşleşme yok"u ayırmıyor (`D-10` yalnız ayarlarda uygulanmış) 🟡

Altınay saha testi (2026-09-15): kaydı olmayan okulda Öğrenciler ekranı, hiçbir arama/filtre yokken
"Sonuç bulunamadı · Arama veya filtre ölçütlerinizle eşleşen öğrenci yok · Filtreleri Temizle" gösterdi.
`D-10`'un kuralı yalnız ayarlara özel `AEmpty`'de (`features/settings/parts.tsx`); boş durum JSX'i Öğrenciler
(`students-page.tsx:235-254`), Öğretmenler (`teachers-page.tsx:288-307`), Veliler (`parents-page.tsx:193-213`)
ve Kullanıcılar/Davetler/Etkinlikler'de ayrı ayrı kopyalanmış, hepsi koşulsuz "Sonuç bulunamadı". Envanterde
`EmptyState` hâlâ `⬜ planned`. Liste arama kutularında erişilebilir etiket yok.

Aynı denetimde ürün kararı bekleyen veli ekranı noktaları (düzeltmeye alınmadı): arama placeholder'ı
"telefon" ve "öğrenci" vaat ediyor ama `ListPersonsQueryHandler:55-76` telefonla ve öğrenci→veli yönünde
aramıyor; "Yakınlık" ve "Sınıf" filtreleri sunucuya gitmiyor, yalnız ekrandaki sayfada süzüyor.

🔄 **Kodda düzeltildi, merge bekliyor (2026-09-15):** `apps/web/components/shared/empty-state.tsx`
(`filtered` sözleşmesi, `page`/`compact` varyantı, yeni CSS yok). Yedi ekran geçti: Öğrenciler, Öğretmenler,
Veliler, Kullanıcılar, Davetler, Etkinlikler, Dağıtım Kısıtları. Ayarların `AEmpty`'si artık onun ince sarmalayıcısı.
Arama kutularına `aria-label`. Envanterde `EmptyState` ✅, `bilesen-ve-stil-kurallari.md` §5 güncellendi.
Web `tsc`/`eslint`/`prettier` temiz. Tarayıcıda Altınay'da (kayıt yok) ölçüldü: Öğrenciler "Henüz öğrenci
kaydı yok · Yeni Öğrenci", Veliler "Henüz veli kaydı yok", filtre temizle düğmesi yok; Veliler'de arama
("zzqx", 300 ms debounce sonrası) "Sonuç bulunamadı · Filtreleri Temizle" dalına geçti.
Aynı düzeltmede kapanan iki yan hata: Etkinlikler "Yaklaşan" sekmesi boşken sezonda etkinlik olsa da
"Bu sezonda etkinlik tanımlanmamış" diyordu; Davetler davet yokken temizlenemeyen filtre dalına düşebiliyordu.

➕ **Ölçülmemiş aday:** `apps/web/features/attendance/session-roster-page.tsx:487` `visible.length === 0`'da filtre
olup olmadığına bakmadan "Öğrenci bulunamadı · Filtreleri Temizle" çiziyor. Döküm hiç öğrenci tutmuyorsa
aynı `D-10` ihlali; C1.1 yoklama testinde ekranda ölçülecek.

### `E-27` · İlk sezonda sihirbazın Öğrenciler adımı işlevsiz 🟡

Altınay saha testi (B3). Kaynak sezonu olmayan okulda 5. adım yalnız terfi ve görevlendirme kopyalama anahtarlarını
gösteriyor; hepsi önceki sezonu varsayıyor. Kullanıcının beklentisi: ilk sezonda bu adımda öğrencilerin Excel'den
yüklenmesi.

✅ **Karar (2026-09-15, kullanıcı):** ilk sezonda sihirbaza **Excel ile öğrenci yükleme adımı** eklenir. Ayrı iş olarak
tasarlanır (sezon henüz yokken kayıt/şube sırası çözülmeli). Geçici: `ENG-03` düzeltmesinde 5. adım kaynaksız sezonda
kopyalama anahtarlarını devre dışı bırakıp öğrencilerin sezon açıldıktan sonra aktarılacağını söyler; Altınay öğrencileri
B7'de yüklenir.

### `TB-179` · Sezon aktifleşince tarihi gelmiş dönem başlamıyor — topbar "1. Dönem", sunucu "yürürlükte dönem yok" 🟡

Altınay saha testi (B3.3, 2026-09-16). Müdür sezonu aktifleştirdi (`ActivateSeasonRollover` 200, günlükte hata yok): sezon
`Active`/`is_current=1`, taslak silindi, müdürün sezonsuz `SCHOOL_ADMIN` ataması aktif. Ama iki dönem de **`NotStarted`**
kaldı — 1. dönemin başlangıcı (14.09.2026) iki gün önce geçmiş olmasına rağmen.

Dönem durumu tasarım gereği yöneticinin elinde: `AcademicTerm.Activate` yalnız `ActivateAcademicTermCommandHandler:40`'tan
çağrılıyor (`POST academic-sessions/{sessionId}/terms/{termId}/activate`, web Sezon Yönetimi'nde "… etkinleştirilsin mi?"
onayı). Kusur iki yerde:

| Yüzey | Dönemi nasıl çözüyor | Altınay'da bugün |
|---|---|---|
| Topbar seçici (`season-context-picker.tsx:114-148`, `resolvePlanningTerm` `logic.ts:69-85`) | **Tarih aralığı** | "2026-2027 · **1. Dönem**" |
| `GetCurrentSessionQueryHandler:38-42` | **`Status == Active`** | `CurrentTerm: null` |
| Yoklama `AttendanceTermResolver:89` | **`Status == Active`** | Dönem yok → yoklama dönem çözemez |

Sonuç: müdür topbar'da "1. Dönem"i görüp dönemin yürürlükte olduğunu sanıyor; sunucu ve yoklama ise dönem yok diyor. Sezon
aktivasyonu, başlangıç tarihi geçmiş dönemi etkinleştirmeyi ne öneriyor ne hatırlatıyor. Seed okullarında dönemler seed'le
`Active` geldiği için görünmüyordu.

⬜ Kapatma yolu (ürün kararı): (a) sezon aktivasyonunda başlangıcı geçmiş dönem otomatik `Active` olur; (b) aktivasyon
sonrası ve panoda "1. dönemi başlatın" uyarısı; (c) dönem çözümü tek kurala çekilir (topbar da `Status` okur ya da sunucu da
tarih okur) — iki gerçek kalmamalı.

✅ **Karar (2026-09-16, kullanıcı): (a) otomatik başlatma.** Sezon aktifleşirken başlangıç tarihi gelmiş dönem
kendiliğinden `Active` olur; müdürün ek adımı kalmaz ve topbar ile sunucu aynı şeyi söyler. Elle etkinleştirme
yolu duruyor (erken ya da geç başlatmak isteyen okul için). Kural `ActivateAcademicTerm`'ün iş kuralıyla ortak bir
yere çekilecek, kopyalanmayacak; gün kararı okul yerel takviminden okunacak. Altınay'ın 1. dönemi sezon zaten
`Active` olduğu için yeni kuralın dışında kalıyor, ayrıca onarılacak. Uygulama sürüyor.

✅ **(a) uygulandı — 2026-09-16 (commit bekliyor).** Kural tek yerde: yeni `AcademicSessions/Shared/AcademicTermStarter.cs`
(`SetupSeasonReverter` kalıbı; `SaveChanges` çağırmaz). **Elle etkinleştirme yolu da artık aynı çekirdeği çağırıyor**,
yani ön koşullar, idempotanslık ve olay yayını tek yerde. Sezon aktifleşirken yalnız **bugünü kapsayan** dönem başlar;
bitmiş dönem `NotStarted` bırakılır — `Close()` yalnız `Active` dönemde çalışıyor ve `AcademicTermClosedEvent` ile
**otomatik karne üretimini** tetikliyor (BR-AS-009), yani hiç işlenmemiş dönemi kapatmak karne üretmek olurdu. Sezonda
zaten aktif bir dönem varsa dokunulmaz; kapsayan dönem `Closed` ise aktivasyon hata vermez. Gün okul-yerel
(`ISchoolCalendarService.GetLocalNowAsync`), sunucunun UTC günü değil. 13 yeni test (UTC'de hâlâ dünken okul gününde
dönemin başladığı vakası dâhil); Application 2721 · Api 444 · Domain 1072 yeşil.

**Altınay düzeltmesi:** 1. dönem zaten `Active` idi — SQL'de `updated_by` müdürün kimliği, damga 2026-09-15 21:58 UTC,
yani **kullanıcı ürünün kendi komutuyla elle başlatmıştı**. Göç ya da elle veri düzeltmesi gerekmedi; Redis
`current-session` anahtarı yine de temizlendi.

⬜ **Açık kalan iki ayak:**
1. **2. dönem kendiliğinden başlamıyor.** Ölçüldü: Hangfire'daki 18 yinelenen işin hiçbiri sezon/dönem yaşam
   döngüsüne dokunmuyor ve mevcut bir işe iliştirmek yanlış sahiplik olurdu (`ExamDailySweepJob` sınav modülünün işi).
   Doğru çözüm aynı iskelette ~60 satırlık kardeş bir günlük süpürme işi; gövdesi yine `AcademicTermStarter`.
   O gelene kadar 2. dönem elle başlatılır. Diğer okullarda da bayat dönem durumu var (`DEV-OKUL`, `ATA-AL`, `TST-AL`).
2. **(c) iki gerçek sürüyor:** topbar dönemi tarih aralığından, sunucu `Status`'tan çözüyor. Bu düzeltme ikisini
   *aktivasyon anında* hizalıyor, kalıcı olarak birleştirmiyor — 8 Şubat 2027'de topbar "2. Dönem" derken sunucu hâlâ
   1. dönemi aktif görecek.

✅ **2026-09-28 · açık ayak 1 kodda (gece turu, `oksis-api` `fix/gece-defter-turu` `e3497537`, merge bekliyor):** sistem komutu `StartDueAcademicTerms` (izinsiz, `Tenancy.Required`, açık okul yüklemi, okul-yerel gün) + günlük iş `academic-sessions.term-daily-sweep` (05:40 İstanbul; sınav 06:00 ve yoklama 07:00 süpürmelerinden önce); gövde yine `AcademicTermStarter`. 7 birim testi + kayıt bekçisi. **Korunan ön koşul:** sezonda aktif dönem varken başlatıcı dokunmuyor, yani 1. dönem kapatılmadan (karne) 2. dönem kendiliğinden başlamaz — olağan akışta sorun değil, 1. dönemi hiç kapatmayan okulda 2. dönem yine elle başlar. ⬜ Ayak 2 (topbar ile sunucunun iki dönem gerçeği) açık.

✅ **Karar (2026-09-28, kullanıcı):** 1. dönem kapatılmadan 2. dönemin başlangıç günü gelirse günlük iş **başlatmaz, uyarır** (pano + yönetici: "1. dönemi kapatın, 2. dönem başlayamıyor"); karne otomatiği tetiklenmez. Uygulanacak.

### `TB-193` · Platformdan açılan okulun branş kataloğu boş doğuyor 🟠

Altınay B4 ölçümünde çıktı (2026-09-16). Altınay `school.branches` = **0 satır**; seed okullarının her birinde
15 satır var. Sebep ölçüldü: `SchoolCreated` akışı **kademeleri tohumluyor ama branşları tohumlamıyor**; seed'deki
15 satır dev seeder'dan geliyor, açılış akışından değil. `PLT-DOGRULAMA`'da da 0 satır — yani **platformdan açılan
her okul** branşsız doğuyor.

Etkisi zincirleme: branş olmadan öğretmene branş atanamaz, branşsız öğretmene de görevlendirme yapılamıyor
(`assignments.teacher-no-branch`). Yani kusur B6'da değil, **B9'da** patlıyor.

İyi haber: branş tarafı ders tarafının tersine doğru kurgulanmış — `school.branches` tenant kapsamlı ve
**`POST /api/v1/branches/import-meb`** idempotent toplu aktarım var.

⬜ Kapatma yolu: `SchoolCreated` branşları da tohumlasın (MEB içe aktarımının aynısını açılışta çalıştırmak
yeterli). Mevcut boş okullar için backfill.

✅ **Karar (2026-09-16, kullanıcı): Altınay'ın engeli ürünün kendi yolundan kalkacak** — kullanıcı "MEB branşlarını
içe aktar" düğmesini **ekrandan kendisi** kullanacak, Rehberlik'i de elle ekleyecek. Gerekçe: saha testinin amacı
gerçek kullanıcı yolunu ölçmek; veriyi arkadan doldurmak o ölçümü yok ederdi.
⬜ **Madde açık kalıyor:** açılış akışı hâlâ branşları tohumlamıyor, yani **bundan sonra açılan her okul** yine
branşsız doğacak. Kalıcı düzeltme (açılışta tohum + mevcut boş okullara backfill) sıradaki turlarda yapılacak.
⚠️ **Kararın dayandığı yol fiilen yoktu:** "kullanıcı düğmeye kendisi basacak" derken ekrandaki düğmenin hiçbir uç
çağırmadığı görülmemişti — bkz. `TB-200`. Düğme aynı gün gerçek uca bağlandı; karar ancak bundan sonra
uygulanabilir hâle geldi.

✅ **2026-09-28 · kalıcı ayak kodda (gece turu, `oksis-api` `fix/gece-defter-turu` `e1529723`, merge bekliyor):** yeni tek yol `BranchCatalogImporter` (`TB-195` kalıbı); "MEB'den Getir" düğmesi ve okul açılışı (`CreateSchoolCommandHandler`, sınav türü tohumundan sonra) aynı sınıfı çağırıyor. `master.branches` boşsa açılış durmuyor, bilinçli ve yorumlu. Entegrasyon testi: açılan okulun branşları aktif master branş sayısına eşit. ⬜ Açık: mevcut branşsız okullar için backfill (göç yazılmadı).

### `TB-195` · Sınav türü kataloğu global ve okul tarafından değiştirilemiyor 🟠

Altınay B4 ölçümünde çıktı (2026-09-16). `master.exam_types` 8 satır ve `ExamType : MasterEntity` — `school_id`
yok. Okulun kendi sınav türünü eklemesi için komut ya da uç **yok**; tür yalnız master tabloya satır eklenerek
doğuyor.

**Canlı kanıt:** `VZ5` "3. Sınav" 2026-09-12'de **bir seed okulu için elle** eklenmiş; tablo global olduğu için o
satır bugün **Altınay'da da duruyor**. Yani Altınay 2. dönemde üç yazılı görüyor, kimse istemeden.

`TB-191` ile aynı sınıf: katalog global, yazma yolu ya yanlış yerde ya hiç yok.

⬜ Kapatma yolu: sınav türleri okul kapsamına taşınır (master çekirdek + okul eklemesi) ya da değiştirme yetkisi
açıkça platforma verilir. Global tabloya elle satır eklemek bugün **bütün okulların** sınav yapısını değiştiriyor.

✅ **Katalog ayağı kapandı — 2026-09-16 (commit edildi, `6cefeed8`).** `TB-191`'in deseni birebir uygulandı:
çekirdek tablo, satırları ve kimlikleri **aynen** korundu; okul kapsamlı tablo geldi, benzersizlik okul içine
indi, içe aktarım tek yerde ve açılışta tohumlanıyor (`TB-193` dersi: dev okulları ham SQL'le doğduğu için o yola
da bağlandı). **Tip adı ve oluşturma imzası korunduğu için türü okuyan ~20 sorgu değişmeden** tenant süzgecine
girdi.
**Çeviri katmanı gerekmedi ve gerekçesi yazıldı:** türü anahtarlayan iki tablonun ikisi de tenant tablosu, göç
onları okulun kimliklerine çevirdi — yani iki kimlik uzayı ürün kodunda bir arada yaşamıyor. Derste çeviri şarttı
çünkü orada iki **platform** tablosu çekirdek kimlikte kalmıştı.
Göç ölçümü: altı okulun her birinde **8 tür** (Altınay dâhil), çekirdek 8 satır kaldı, 4 sınav penceresi ve 18
değerlendirme kendi okulunun satırına bağlandı, **çapraz tenant satır 0**.

✅ **Yönetim ayağı da kapandı — 2026-09-16.** Dört komut + liste sorgusu (`ExamsController` üzerinde, yeni izin
yok: okuma `school-settings.view`, yazma `school-settings.update-academic-structure`). Pencere formunun listesi
**dokunulmadı**; yönetim listesi ondan üç noktada bilinçli ayrılıyor (pasif türler görünür, dönemsiz türler
görünür, kullanılan tür düşmez) — yönetim listesi bir seçim kutusu değil, kataloğun kendisi.
**Çekirdek–okul ayrımı:** `IsMasterSourced` satırda `Code`, `Name` **ve `TermOrder`** donuk; `DisplayOrder`,
`Description`, `IsActive` ve silme okulun kararı. Dönemin de donması `TB-191`'den bilinçli ayrılış: derste
**kademe** okula bırakılmıştı çünkü aynı ders okuldan okula farklı kademede okutulur; sınav türünde dönem
**adın kendisidir** ("1. Sınav" = birinci dönemin ilk yazılısı) ve seçenek listesi yalnız `TermOrder` ile
süzüldüğü için serbest bırakılsaydı kullanıcı bunu ancak yanlış dönemde beliren yanlış adlı bir seçenek olarak
görürdü. Kural **domainde** (`ExamType.Update`), handler yalnız 409'a çeviriyor.
**Silme ve pasifleştirme ayrı:** silme `ExamTypeUsageInspector` kapısından geçer (kullanımdaysa 409), pasifleştirme
her zaman serbest — kullanımdaki tür de düşürülebilir, satır durur ve eski pencereler adını okumaya devam eder.
Kapıda durum süzgeci **yok** ve bu bilinçli: tüketici pencerenin kendisi, kilitli pencere de türünün adını
gösteriyor. Bekçi: `ExamTypeUsageCoverageTests` — `ExamTypeId` taşıyan yeni kalıcı varlık kapıya eklenmezse kırmızı.
**Arayüz:** Ayarlar › Akademik Yapı › **Sınav Türü Kataloğu** sekmesi (liste, arama, "Çekirdekten Getir", yeni tür,
düzenleme çekmecesi — çekirdek satırda kilitli alanlar ipucuyla, pasife al/yeniden aç, iki adımlı silme), mock'lar
ve onları kilitleyen testler aynı turda (`TB-188` dersi).
⬜ **İki borç:** (a) tenant izolasyonu gerçek SQL'e karşı ölçülmedi — `IgnoreQueryFilters()` yok ve hepsi
`db.ExamTypes` üzerinden gidiyor ama bellek içi test DB kısıtını zorlamaz; (b) ekran tarayıcıda gezilmedi.
⬜ **Doğrulanmamış ürün farkı:** yönetim uçları `ExamsController`'da olduğu için `active-season-write` politikasına
tabi — **arşiv sezonda katalog yazılamıyor**, oysa ders kataloğu (`AcademicsController`) bu kısıta tabi değil.

✅ **Karar (2026-09-28, kullanıcı):** sınav türü yönetimi **ders kataloğuyla eşitlenir** — `active-season-write` politikası olmayan controller'a taşınır; gerçek SQL tenant izolasyon testi yazılır. Uygulanacak.

### `E-31` · Kişinin adı ve soyadı hesap açıldıktan sonra düzeltilemiyor — uç var, ekran yok 🟡

Altınay B6.5 ölçümünde çıktı (2026-09-24). Ad ve soyadı değiştirebilen **tek yüzey davet kabul ekranı**
(`invite-screen.tsx`). Salih'in "Soyad" yer tutucusu oradan "Demir" olarak düzeltilmiş: kişi kaydının güncellenme
zamanı oluşturulmasından 2 saniye sonra, yani kabul anı. Kabulden sonra hiçbir yol yok:
- `PUT api/v1/users/persons/{id}` (`UpdatePersonCommand`, ad + soyad + cinsiyet + doğum tarihi + iletişim,
  `users.update`) sunucuda var ama **hiçbir istemci çağırmıyor**. `packages/api`'de karşılığı yok.
- Web'de ad alanı yalnız Kullanıcı Oluştur ve öğrenci kayıt sihirbazında var. İkisi de oluşturma ekranı.
- `UpdateMyProfileCommand` yalnız e-posta ve telefon alıyor, kişi kendi adını da değiştiremiyor.

Altınay'da somut: Hale Kübra'nın soyadı "Soyad" olarak kalmıştı ve ekrandan düzeltilemiyordu. 2026-09-24'te kullanıcının
verdiği gerçek adlar (Hale Kübra **Öztürk**, Salih **Demirci**) ve yeni e-postalar, ekran olmadığı için **doğrudan uca**
(`PUT users/persons/{id}`, müdür yetkisiyle) gönderildi. Uç çalıştı: 204, yeni e-postayla giriş 200, eski adres 401.
Bu B6.5'i kapattı; madde ekran eksiği olarak açık kalıyor. İkincil etki: Salih'in giriş e-postası
`salih.soyad@altinay.test` olarak kaldı. Bu kendi başına kusur değil, e-posta ayrı bir alan; ama ad değişince
e-postanın değişmediği bilinmeli.

⬜ Kapatma yolu: Öğretmenler (ve Kullanıcılar) çekmecesinde ad/soyad düzenleme, mevcut uca bağlanır. Aynı ekran
öğrenci ve veliyi de kapsamalı. [[eksik-ekran-eksik-yetkiyi-gizler]] kalıbı: çağrılmayan uçta izin ve doğrulama
da ölçülmemiş durumda.

✅ **2026-09-28 · kodda (gece turu, `oksis-ui` `fix/gece-defter-turu` `7a93ac8`, merge bekliyor, ekranda ölçülmedi):** Kullanıcılar, Öğretmenler, Öğrenciler ve Veliler çekmecelerinde ad/soyad düzeltme penceresi (`users.update`). Uç **tam değiştirme** yaptığı için pencere önce kişiyi okuyup yalnız adı/soyadı değiştiriyor, öteki alanları aynen geri gönderiyor; istemci şeması sunucu doğrulayıcısının aynısı (2–100, harf/boşluk/kesme/tire). ⬜ Cinsiyeti boş kişide düzenleme kapalı ve nedeni yazılı (`B-71`); geri gönderilen telefon sunucu desenine uymazsa red olası (ölçülmedi); MSW'de `GET/PUT users/persons/{id}` yok.

📺 **2026-09-28 · ekranda ölçüldü** (dal kodu: API 5113 + web 3005, Altınay, yalnız okuma): çekmecede "Adı düzelt" → pencere ad/soyadı dolu açılıyor; müdürün cinsiyet kaydı boş olduğu için "değer uydurulmadan ad şu an düzeltilemez" uyarısı görünüyor (`B-71`). Kaydedilmedi.

### `TB-198` · `school_onboarding_status` ölü tablo — açılış ilerlemesi hiçbir yerde görünmüyor ⚪

Altınay ölçümünde çıktı (2026-09-16). Tablo Altınay'da **6 satır** taşıyor, hepsi `Pending`. Satırları yaratan
handler var; **okuyan sorgu, ilerleten komut ve uç yok**. Yani okul açılış sihirbazının ilerlemesi ne görünüyor ne
de hiçbir zaman ilerliyor.

⬜ Kapatma yolu: ya tüketicisi yazılır (açılış kontrol listesi ekranı — yeni okulun ilk gününde işe yarar) ya da
tablo ve onu yazan handler kaldırılır. Bugünkü hâli, var olmayan bir özelliğin veri izini biriktiriyor.

➕ **İş büyüklüğü ölçüldü (2026-09-16):** *(A) tüketicisini yazmak* — okuma sorgusu + DTO, üç ilerletme komutu
(domainde `MarkInProgress`/`MarkCompleted`/`Skip` **hazır**), uçlar, **yeni izin** (seed + göç + rol eşlemesi), bir
de ekran. Ama asıl iş bunlar değil: **altı adımın "tamamlandı" ölçütü bir ürün kararıdır** — otomatik ilerleyecekse
altı ayrı olay kancası gerekir, elle işaretlenecekse ekran + yetki kuralı. *(B) temizlik* — 5 dosya (192 satır) +
iki bağlam satırı + bir göç; tüketici, izin, test ve arayüz referansı olmadığı için yayılım yok, 30-45 dakika.
Bugünkü iz: dev veritabanında 12 satır, hepsi `Pending` (6'sı Altınay).

⬜ **Karar (2026-09-16, kullanıcı): daha geniş çerçevede düşünülecek; madde açık iş olarak kalıyor.** Yani ne
temizlenecek ne de bugünkü hâliyle tüketici yazılacak. Çerçeve sorusu şu: **okulun OKSİS'i teslim alma süreci
ürün içinde görünür bir şey mi olmalı?** Altınay saha testi bunun canlı örneği — B1'den B10'a kadar giden sıra
(ayarlar → sezon → katalog → şube → kadro → öğrenci) bugün yalnız bu belgede yaşıyor, üründe karşılığı yok.
Karar verilirken birlikte düşünülmesi gerekenler: `TB-193` (yeni okul branşsız doğuyor), `TB-192` (lise kataloğu
eksik), `E-24`'ün "seed gerçek yolu ölçmüyor" kalıbı ve bu turda ölçülen "yeni okulun ilk günü" kusurları
(`TB-168`, `TB-173`, `TB-185`). Ölü tablo bu tartışmanın **sonucuna** göre ya doldurulur ya kaldırılır.

⏸️ **Karar (2026-09-28, kullanıcı): askıda kalır** (daha geniş çerçeve kararı bekliyor).

### `TB-190` · Sahte bağlamla yazılan testte tenant alanı boş kalıyor; okul süzen sorgular sessizce "hepsi reddedildi" ölçüyor 🟡

`E-28` uygulamasında ölçüldü (2026-09-16) ve **beş testi birden yanlış yoldan geçiriyordu**.

`Profile.AssignTo` yalnız `PersonId` kuruyor; `SchoolId`'yi gerçek koşuda insert sırasında
`TenantSaveChangesInterceptor` dolduruyor. Sahte `DbContext`'te interceptor **yok**, alan `Guid.Empty` kalıyor —
dolayısıyla `pr.SchoolId == schoolId` süzen her sorgu **boş küme** döndürüyor. Test yazan kişi bunu görmez:
handler beklenen hata mesajını verir, iddia geçer ya da "reddedildi" dalında doğrulanır; oysa ölçülen şey iş
kuralı değil, **kurulumun eksikliğidir**.

Somut belirti: ödev devri testlerinde her devir *"Yeni sorumlu, bu okulda görevi süren bir öğretmen olmalıdır."*
ile reddediliyordu; kod doğruydu, kurulum yanlıştı. Dosya o güne dek hiç derlenmediği için bu beş ölçüm **bir kez
bile koşmamıştı**, yani kusur ancak derleme düzelince görünür oldu.

Sınıf olarak [[bellek-ici-test-db-kisitini-zorlamaz]] dersinin kardeşi: bellek içi bağlam yalnız DB kısıtlarını
değil, **interceptor'ların doldurduğu alanları da** taklit etmiyor. `TB-184` ve `TB-187` ile birlikte aynı aile —
test altyapısının sessiz yanlışları.

⬜ Kapatma yolu: profil/kişi kuran **ortak bir test fixture'ı** tenant alanını da kursun (bugün her testte elle,
yansımayla yapılıyor ve çoğu test hiç yapmıyor). Yamalama yerine merkezî çözüm: aynı kalıbın kullanıldığı diğer
test dosyaları da ona bağlanmalı.

✅ **2026-09-28 · kapandı (kodda (gece turu, `oksis-api` `fix/gece-defter-turu` `68f6a3d8`):** ortak yardımcı `TenantTestEntities.InSchool()`; elle yansıma yapan 6 dosya ona bağlandı.

### `TB-189` · Seed sezon verisi ürünün üretebildiği durumları temsil etmiyor ⚪

`TB-185` canlı ölçümünde ortaya çıktı (2026-09-16), ölçümün kendisi iki kez buna takıldı.

1. **Seed DB'de `Setup` durumundaki bütün sezonlar soft-delete'li** (`is_deleted = 1`; `DEV-OKUL` ve `TST-AL`).
   Küresel süzgeç onları gizlediği için **görünür hiçbir sezon yeniden adlandırılamıyor** (`Rename` yalnız
   `Setup`'ta izinli) ve **"kurulumdaki sezon" yüzeyleri seed veriyle hiç ölçülemiyor** — oysa `TB-168`/`TB-173`
   kararının dört durumundan biri tam olarak budur. Sezonsuzluk yüzeylerini seed'le sınamak isteyen herkes aynı
   duvara çarpar.
2. **`DEV-OKUL` ve `TST-AL`'de aynı adı (`2026-2027`) taşıyan iki sezon satırı var**; biri silinmiş olduğu için
   tekil ad kuralı bugün patlamıyor. Yani kısıt, verinin şu anki hâli sayesinde sessiz.

Belirti ürün değil **test verisi**: seed, ürünün üretebileceği durum uzayını örneklemiyor, bu yüzden o durumlara
bağlı kusurlar ancak sahada görülüyor (`E-24`'ün "seed gerçek yolu ölçmüyor" kalıbının kardeşi).

⬜ Kapatma yolu: dev seed'inde **canlı bir `Setup` sezon** bulunsun (ve sezonsuz bir okul kalmaya devam etsin);
silinmiş satırların ad çakışması temizlensin ya da tekil ad kuralının silinmişleri nasıl saydığı bilinçli yazılsın.

### `TB-187` · Mapster'ın paylaşılan yapılandırması paralel test koşumunda çöküyor ⚪

`TB-109` doğrulamasında ölçüldü (2026-09-16). `GetSchoolSettingsQueryHandlerTests` tam takım koşumunda
`InvalidOperationException: Collection was modified` ile düştü; yığının tamamı Mapster'ın içinde
(`SettingStore.Apply` → `TypeAdapterConfig.GetMergedSettings`). İki bağımsız kanıt belirtinin **paralellikten**
geldiğini gösterdi: izole koşuda 8/8 yeşil, ikinci tam koşuda 2731/0 yeşil.

Sebep: paylaşılan `TypeAdapterConfig` önbelleği xUnit'in paralel iş parçacıklarınca **eşzamanlı** derleniyor.
Ürün kodunda tek süreçli ısınma olduğu için bugün yalnız testte görünüyor — ama aynı yapı, uygulama açılışında
eşzamanlı ilk isteklerde de kuramsal olarak kırılgan.

Sınıfı `TB-184` ile aynı: **sıraya bağlı kırmızı**, gerçek bir düşüşü gürültüye gömer.

⬜ Kapatma yolu: eşleme yapılandırması uygulama/test açılışında **bir kez** ve deterministik biçimde derlensin
(ısınma adımı), ya da testlerde koleksiyon paylaşımı kapatılsın. Önce hangisinin doğru olduğu ölçülmeli.

✅ **2026-09-28 · `TB-213` ile aynı commit'te kapandı (`d5638537`).**

### `TB-184` · Entegrasyon testi paylaşılan DB'de küresel sayı bekliyor — takımla koşunca kırmızı ⚪

Gece turunun son doğrulamasında ölçüldü (2026-09-16). `ExpireStaleInvitationsJobTests.Run_ShouldExpire_OnlyActiveAndStale…`
**takımla koşunca kırmızı** ("beklenen 2, bulunan 4"), **tek başına yeşil** (izole koşu: 1/1, 978 ms — ölçüldü).

Kök neden: test süpürme işini `SystemTenantContext` ile koşturuyor (`CurrentSchoolId = null`, `IsSuperAdmin = true`),
yani küresel tenant süzgeci düşüyor ve iş **paylaşılan veritabanındaki bütün** eskimiş aktif davetleri süpürüyor.
Test ise kendi yazdığı 4 satıra bakıp **kesin küresel sayı 2** bekliyor. Kirleten satırlar `K-27` platform diliminden:
`CreateSchoolCommandHandlerTests` bilerek terminal olmayan bir davet bırakıyor.

Belirti ürün değil **test altyapısı**: aynı sınıf, sıraya bağlı kırmızılar üretir ve gerçek bir regresyonu gürültüye
gömer (`TB-182`'nin 22 kırmızısında yaşandı).

⬜ Kapatma yolu: testin iddiası küresel sayı yerine **kendi yazdığı kayıtların kimliğine** bağlansın (ya da süpürme
tek okula kapsanıp öyle ölçülsün). Testi gevşetmek değil, ölçüyü kendi verisine bağlamak.

✅ **2026-09-28 · kapandı (kodda (gece turu, `oksis-api` `fix/gece-defter-turu` `02205f44`):** test kendi dört davetinin son durumunu ölçüyor; toplam sayı için yalnız alt sınır (`>= 2`) kaldı. `TB-204` aynı madde.

### `TB-181` · Hesabın birden çok okulda kişisi varsa giriş hangi okulu seçeceğini garanti etmiyor ⚪

`TB-141` düzeltmesinde ölçüldü (2026-09-16). `PersonDirectory.FindByAccountIdAsync`
(`Infrastructure`) küresel tenant süzgecini bilerek atlıyor (`IgnoreQueryFilters`): giriş ve
belirteç yenileme anında tenant bağlamı **henüz yoktur**, kişi bulunur ve okul sonra
`Person.SchoolId`'den türetilir (`BR-identity-001`). Tasarım doğru — ama sorgu, aynı hesaba bağlı
**birden çok kişi** olduğunda hangisini döndüreceğini tanımlamıyor.

Bugün zararsız görünüyor: dev verisinde ve saha testinde bir hesabın tek okulda kişisi var. Ama
ürün "aynı e-posta iki okulda öğretmen" senaryosunu yasaklamıyor; o gün kullanıcı hangi okula
düşeceğini şansa bırakır ve bu, yanlış okulun verisini gören bir oturum demektir.

`TB-141`'in mimari bekçisi bu dosyayı gerekçeli muafiyet olarak listeliyor — yani kopya değil,
bilinçli tek istisna.

⬜ Ürün kararı gerekiyor: (a) bir hesap yalnız bir okulda kişi olabilir (kısıt + göç); (b) giriş
çok kişi bulduğunda okul seçtirir; (c) kod bugünkü örtük "ilk kayıt" davranışını açıkça yazar ve
belgelendirir. Karar verilene kadar sorgunun determinist bir sıralaması olmalı.

🟡 **2026-09-28 · ara koruma kodda (gece turu, `oksis-api` `fix/gece-defter-turu` `50d9fab5`):** karar gelene kadar `PersonDirectory` sıralaması deterministik — en eski kişi (`CreatedAt`), sonra `Id`; kodda "ürün kararı değil, geçici sabit" diye belgeli, gerçek SQL'de 2 testle kilitli. ⬜ Ürün kararı (a/b/c) açık.

🔴 **2026-09-28 · ekran ölçümü gece turundaki ara korumayı geri çevirdi:** Altınay'da bir öğretmenin e-postası test dışı ALTINAY-SBL'de de kayıtlı (dev DB'de tek çakışan e-posta; hesaba bağlı çift kişi 0). "En eski kişi" kuralı o öğretmenin girişini **SBL'ye** çevirdi — yönetici ekranı ve boş nöbet bölgesiyle açıldı. Master'da sırasız sorgu fiilen birincil anahtar sırasıyla dönüyor (`Include` + küme taraması) ve Altınay'a düşüyordu. Düzeltme (`oksis-api` `24469bac`): açık sıra **en küçük Id** — mevcut davranış sabitlendi, kimsenin girdiği okul değişmiyor; test oluşturulma zamanının sırayı değiştirmediğini kilitliyor. Ekranda yeniden ölçüldü: öğretmen Altınay'a giriyor. ⬜ Ürün kararı hâlâ açık — ve artık somut bir örneği var: aynı e-posta iki okulda.

✅ **Karar (2026-09-28, kullanıcı):** **tek okul kısıtı** — bir e-posta/hesap yalnız bir okulda kişi olabilir (kısıt + göç). Mevcut tek çakışma: ALTINAY-SBL'deki kaydın e-postası `@altinaysbl.test` alanına çekilir (kayıt silinmez). Uygulanacak.

### `TB-180` · Rol seed bekçisi dört gündür kırmızı; günlük test döngüsü onu hiç koşmuyor 🟡

`TB-174` düzeltmesi sırasında entegrasyon koşusunda ortaya çıktı (2026-09-16, dal `fix/ilk-sezon-acilisi`,
HEAD `60e65caf`). `MasterRoleSeedTests.Should_GrantFullCatalogToAdminRoles` düşüyordu: `SCHOOL_ADMIN`'de
"fazladan" `exams.place` var diyordu. Ölçüm, düşüşün gece turundaki değişikliklerle ilgisi olmadığını gösterdi —
testin girdisi yalnız EF model seed'i (`GetSeedData`), ilgili seed dosyaları 31 Temmuz'dan beri değişmemiş.

**Kök neden:** `RolePermissionSeedData.cs:59-77` `exams.place`'i **2026-09-12'de bilerek** `SCHOOL_ADMIN`'e verdi
(Faz 2a Görev 7.9: yönetici kelebek oturumunu elle kurarken yerleştirme ızgarasını `GetPlacementSlots`'tan
okuyamıyor, şubenin okulda olmadığı saate oturum kurabiliyordu). Ama aynı turda **iki yer güncellenmedi**:
bekçi testinin `roleSpecificCodes` kümesi ("yalnız TEACHER alır") ve `AllPermissionIds()` üstündeki katalog
yorumu ("hiçbir yönetici rolüne gitmez"). Yani seed değişti, onu koruyan bekçi ve yanındaki yorum eski niyeti
anlatmaya devam etti.

**Asıl mesele bekçinin görünmezliği:** `./scripts/test-changed.sh` "mimari bekçiler" adımında `Oksis.Tests`'i
**süzgeçle** (7 test) koşuyor; projenin tam takımı (62 test) yalnız o proje değişen koda bağlı sayıldığında ya da
`--integration` ile çalışıyor. Bu yüzden kırmızı bekçi dört gün, günlük döngüde hiç görünmeden durdu.

✅ **Düzeltildi (2026-09-16, commit bekliyor):** `exams.place` testte `roleSpecificCodes`'tan çıkarılıp
`schoolAdminOnlyCodes`'a taşındı (SuperAdmin katalogda olmadığı için almaz, SchoolAdmin alır) ve iki yere de
2026-09-12 gerekçesi yazıldı; `RolePermissionSeedData`'nın bayat katalog yorumu düzeltildi.
⬜ **Açık ayak:** günlük döngü `Oksis.Tests`'in tam takımını koşmuyor. Süzgeç kapsamı genişletilmeli ya da bu
projenin tamamı her koşuda çalışmalı — bekçi, koşulmadığı sürece bekçi değildir.

✅ **2026-09-28 · açık ayak kapandı (kodda (gece turu, `oksis-api` `fix/gece-defter-turu` `c814af5d`):** `Oksis.Tests`'te Docker isteyen tek sınıf (`SchoolSettingsTenantTests`) `Category=RequiresDocker`; günlük döngü artık `Category!=RequiresDocker` ile **110 testi** (eskiden 54 mimari bekçi) ~6 sn'de koşuyor, kalan 2 Docker testi `--integration`'da.

### `TB-158` · Push tepsiye düşüyor ama ekranı uyandırmıyor 🟡

Aynı testte ölçüldü (2026-09-15): push telefona **düştü** ama **ekran uyanmadı**, bildirim
üste çıkmadı — kilit ekranında sessizce bekliyordu.

Android 8'den (API 26) beri bir bildirimin sesini, titreşimini ve üste çıkıp çıkmayacağını
**payload değil KANAL** belirler. İki uçta birden eksikti:

| Yer | Eksik |
|---|---|
| Sunucu (`FcmSender`) | Mesajda `AndroidConfig` **hiç yoktu** — öncelik, kanal kimliği, ses belirtilmiyordu; `ApnsConfig` de yoktu |
| Mobil | Kanal **hiç oluşturulmuyordu**; manifest'te `default_notification_channel_id` meta-verisi de yoktu |

Kanal yokken FCM kendi yedek kanalını kullanıyor ve onun önem derecesi düşük.

🟡 **YARI KAPANDI — belirti sürüyor.** Aşağıdaki iki uç da yapıldı ve ölçüldü, ama
**ekran hâlâ uyanmıyor, ses ve titreşim yok** (2026-09-15, Redmi M2003J15SC / MIUI).
Bildirim tepsiye düşüyor, üste çıkmıyor.

Kesin olan (ölçüldü):

| Ölçüm | Sonuç |
|---|---|
| Kanal cihazda var mı | ✅ `dumpsys notification` → `mId='oksis-default'`, **`mImportance=4`** (HIGH), `mOriginalImp=4`, `mUserLockedFields=0`, `mVibrationEnabled=true`, ses tanımlı |
| Sunucu gönderdi mi | ✅ `push_deliveries` → `Sent`, `error_code` boş |
| Bildirim sayısı | ✅ **tek** — mükerrerlik yok |

Yani Android'in kendi kayıtlarına göre kanal doğru, öncelik doğru, teslim başarılı; **kalan
şey gösterim.** Sınanmamış ilk şüpheli: MIUI'nin kanal önem derecesinin ÜSTÜNE binen kendi
"kayan bildirim" anahtarı — yeni kurulan uygulamalarda varsayılan kapalıdır ve Android'in
`mImportance` değerini değiştirmeden davranışı bastırır. **Doğrulanmadı**; sıradaki iş
cihazın uygulama bildirim ayarlarını açıp kanalın MIUI tarafındaki hâline bakmak, sonra
aynı yükü ikinci bir (MIUI olmayan) cihazda denemek. Kullanıcı kararı: bulgu açık kalsın,
sonra dönülecek.

Yapılan ve yerinde duran (kapatmanın ön koşulu, tek başına yetmedi) — tek kimlikle
(`oksis-default`):
- `FcmSender`: `AndroidConfig` (`Priority.High` + `ChannelId`) ve `ApnsConfig`
  (`apns-priority: 10`, `Sound = "default"`). Kimlik `FcmSender.AndroidChannelId` sabitinde.
- `apps/mobile/plugins/with-notification-channel.js`: `MainApplication.onCreate`'te
  `IMPORTANCE_HIGH` kanalını oluşturur, manifest'e varsayılan kanal meta-verisini yazar.
  **Config plugin olmak zorunda** — `android/` üretilir ve gitignore'dadır (`TB-90`).
  `expo prebuild` koşturularak çıktı doğrulandı.

**İki kimlik ayrışırsa sessizce gerilenir:** sunucu var olmayan bir kanal ister ve yine
yedek kanala düşülür — hata değil, sessiz kayıp. İkisi de kendi dosyasında bu gerekçeyle
yorumlandı.

⬜ **Kalan:** iOS'tan bugüne kadar **hiç cihaz kaydı gelmemiş** (17 kaydın 17'si Android).
Bu ayrı bir arıza ve muhtemelen Apple hesabı eksikliğine dayanıyor
([[magaza-hesaplari-yok]]); ayrıca ölçülmeli.

### `TB-141` · Çağıran çözümü depo genelinde okul süzmüyor — kalıbın kendisi 🟡

`TB-140` iki ORTAK çözümleyiciyi (Attendance, Announcements) düzeltti. Ama kalıp ortak bir
metotta yaşamıyor: **elle kopyalanmış** hâlleri sekiz modüle yayılmış.

Ölçüldü (2026-09-13, `oksis-api` @ `1905abbc` sonrası):
`src/Oksis.Application` içinde `p.LinkedAccountId == currentUser.Id` biçimli **17** çözüm
var; **16'sı okul yüklemi taşımıyor** (tek yüklemli olan `TB-140`'ta düzeltilen
`AttendanceCallerResolver`).

| Modül | Yüklemsiz | Nerede |
|---|---|---|
| Users | 5 | `PersonAccessGuard`, `GetMyProfile`, `UpdateMyProfile`, `GetMyConsents`, `RevokeMyConsent` |
| Duties | 3 | `GetMyDuties`, `GetMyDutyLoad`, `GetMySubstitutions` |
| Clubs | 2 | `ClubScope`, `ClubFamilyScope` |
| **Exams** | **2** | `PublishExamWindow`, `PublishExamSchedule` |
| Grades | 1 | `GradeBookScope` |
| Announcements | 1 | `AnnouncementLifecycleGuard` |
| Homework | 1 | `HomeworkScope` |
| Documents | 1 | `StudentDocumentEntityScopeResolver` |

**Turun asıl dersi burada.** `TB-130` sınav modülünü kapattı sayılıyordu; oysa kapattığı şey
`ExamCaller`'ın ÇAĞIRANLARIYDI. Yukarıdaki iki sınav handler'ı `ExamCaller`'ı hiç
çağırmıyor, kalıbın kendi kopyasını taşıyordu — yani **ortak metodun çağıranlarını taramak,
kalıbı taramak değildir**. Ölçüm bir sonraki turda sembolden değil **şekilden** yapılmalı.

✅ **Sınav modülünün ikisi hemen kapatıldı** (2026-09-13, Faz 2b Görev 1.2 turunda
bulunduğu yerde): iki handler `ExamCaller.ResolveAsync(db, currentUser, schoolId, ct)`
kullanıyor ve pencere okumaları açık `SchoolId` yüklemi taşıyor.

⬜ **Kalan 14 çağrı yedi modülde** açık. Kapanış merkezî olmalı
([[yamalama-kabul-degil]]): her modülün kendi `*Scope`/`*Guard` sınıfı zaten var, çözüm
oralara tek seferde girer. Bugün sızdırmıyor — `IsSuperAdmin` üründe hiçbir zaman `true`
olmuyor (`TB-139`) — ama yüklem aynı zamanda sorgunun kapsamını tutar (`M17`).

✅ **2026-09-16 · kapandı (gece turu, commit bekliyor).** Kalıbın tek sahibi oldu:
`Application/Common/Security/CallerPerson.cs`. Üç emsal çözücü (`ExamCaller`, `AttendanceCallerResolver`,
`AnnouncementCallerResolver`) de artık aynı sorguya delege ediyor — modül docblock'ları kendi bağlamını anlatmaya
devam ediyor ama **sorgu tek**. 13 çağrı yeri bağlandı (Users 5, Duties 2, Clubs 2, Grades 1, Announcements 1 —
`AnnouncementLifecycleGuard` imzasına `schoolId` eklendi, 8 çağıran güncellendi —, Homework 1, Documents 1).
Exams'in iki yeri zaten kapalıydı, kodla doğrulandı. Depodaki ham kalıp **17 → 3**'e indi.
**Bekçi kopyanın kendisini yasaklıyor**, "her kopyada yüklem var mı"yı değil: ikincisi kopyayı meşrulaştırır ve bir
sonraki kopya yüklemsiz doğar — `TB-140`'ın yaşadığı tam olarak buydu (`CallerPersonSchoolPredicateTests`,
üç gerekçeli muafiyet).
⬜ **Açık kalan iki ayak:** (1) `GetMySubstitutions` o sırada başka bir turdaydı (`TB-174`), hâlâ yüklemsiz —
bekçide **geçici** muafiyet ve randevu notu var. (2) `PersonDirectory.FindByAccountIdAsync` bilinçli olarak
tenant süzgeci dışı (giriş akışı, `BR-identity-001`); oradan çıkan belirsizlik ayrı madde: `TB-181`.

✅ **2026-09-28 · açık ayak (1) kapandı (gece turu, `oksis-api` `fix/gece-defter-turu` `6d718b8d`):** `GetMySubstitutions` `CallerPerson.ResolveIdAsync`'e bağlandı, bekçideki geçici muafiyet silindi; ham kalıp 3 → 2 (`CallerPerson` + gerekçeli `PersonDirectory`). Entegrasyon testi: hesabın başka okuldaki kişisi bu okulda çağıran sayılmıyor. Kalan (2) `TB-181`'de. Madde merge ile arşive gider.

### `TB-139` · Küresel tenant süzgeci süper yöneticiyi BÜTÜN okullara açıyor 🔴

**Kullanıcı kararı (2026-09-13) rolü şöyle tarif etti:**

> Süper Yönetici rolü aslında OKSİS'in kendi personeli olacak. Yeni okul kaydı, mevcut
> okullar, destek paneli yönetimi gibi konularda aktif olacak; **okulların tamamını
> görebilen bir üst rol değildir. Okulların iç işlerindeki süreçleri görmeyecekler.**

Kod bunun tersini yapıyor. `OksisDbContext.ApplyTenantFilter`:

```csharp
IsSuperAdmin || (CurrentSchoolId.HasValue && e.SchoolId == CurrentSchoolId)
```

`IsSuperAdmin` süzgeci **tamamen kısa devre ediyor**. Ölçüldü:

- Süzgeç `IHasTenant` uygulayan HER varlığa takılıyor; `TenantEntity`/`PermanentTenantEntity`
  türeten **90 varlık** var — pratikte okul veri modelinin tamamı.
- `IsSuperAdmin` yalnız JWT'deki `SuperAdmin` rol talebidir.
- `OverrideForSuperAdmin(schoolId)` bir okulu "üstlenmeyi" sağlıyor ama **`IsSuperAdmin`
  true kalıyor**, yani üstlenme kapsamı DARALTMIYOR: süper yönetici bir okulu üstlenmişken
  de doksan varlığın hepsinde bütün okulların satırlarını görmeye devam ediyor.
- Yazma tarafında da aynı muafiyet var:
  `TenantSaveChangesInterceptor` → `!tenantContext.IsSuperAdmin && entry.Entity.SchoolId != ...`

**Bu bulgu `TB-130`, `TB-131` ve `TB-133`'ün kök nedenidir.** O üçü "açık `SchoolId` yüklemi
yok" diye işlenmişti; yüklemin neden gerektiği ise bu satır. Üçünü kapatmak doğru ve
gereklidir (yüklem aynı zamanda sorgunun KAPSAMINI tutar — `M17` dersi), ama sınav modülünü
düzeltmek sorunu çözmez: aynı açık diğer modüllerde de duruyor ve oralarda hiç aranmadı.

**Kaldırmanın önündeki engel ölçüldü, sanıldığı kadar büyük değil:**
`School` varlığı `IHasTenant` DEĞİL (`AggregateRoot, IAuditableEntity`), yani okul listesi
ve platform yüzeyi kısa devre kalkınca da çalışır. Arka plan işleri zaten
`CurrentSchoolId`'yi okula eşitliyor (`SessionMaterializer` notu: "IsSuperAdmin burada bir
muafiyet değildir"). Göç aracının tasarım zamanı bağlamı (`OksisDbContextFactory`)
`IsSuperAdmin => true` sabitliyor; o EF aracıdır, ürün yolu değil.

⚠️ **Ölçüm eklendi (2026-09-13, `oksis-api` @ `20ab14bd`) — kısa devre bugün ERİŞİLEMEZ.**
`TenantContext.IsSuperAdmin` tek bir şeye bakıyor: `User.IsInRole("SuperAdmin")`. Token'ı
üreten tek yer `AccountTokenIssuer` ve o JWT'ye **hiçbir rol talebi yazmıyor** (claim listesi:
`sub`, `jti`, `person_id`, `school_id`, `perms_ver`, `require_password_change`,
`active_profile_type`, `available_profiles`, `active_child_id?`, `active_season_id?`).
Depoda rol talebi yazan ikinci bir yol yok. Sonuçları:

- Çalışan üründe `IsSuperAdmin` **her zaman `false`** — yani bugün kısa devreden geçen
  canlı bir sızıntı yok; açık **gizil**dir.
- `OverrideForSuperAdmin` her çağrıda `SecurityException` atar: bugün "okul üstlenme"
  akışı hiç yok, kaldırılacak bir kullanım da yok.
- Kısa devreyi kaldırmanın maliyeti bu yüzden sanılandan **düşük**: kaldırma, bugün hiçbir
  isteğin girmediği bir dalı siler. Riski, üstlenmenin ürün tarafını kurmadan rol talebini
  eklemektir.
- Buna karşılık sınıfın kendisi gerçektir: `TB-130`/`TB-131`/`TB-133` ve `TB-140` rol talebi
  eklendiği gün aynı anda açılır. Yüklem ayrıca sorgunun kapsamını tutar (`M17` dersi).

**Kararlar alındı (2026-09-13):**
- Yol **(a)**: kısa devre kalkacak; süper yönetici tenant verisini ancak bir okulu
  ÜSTLENEREK görecek.
- **Üstlenme okulun ONAYINA bağlı olacak:** okul yöneticisi "destek erişimi aç" demeden
  OKSİS personeli okulun iç verisine giremez. Üstlenme sessiz bir metot değil, gerekçeli ve
  izli bir olaydır.
- **Zamanlama:** Faz 2a kapanışından sonra, kendi turunda. Faz 2a'nın içine alınmadı.

Rol tanımı [[0008-super-yonetici-platform-roludur]] karar notuna yazıldı (ilk yazıldığı
`permission-matrix.md` 2026-09-13'te belge merkezi yeniden yapılandırılırken kaldırıldı).

⬜ Turun ilk adımı ÖLÇÜMDÜR, kod değil: bugün süper yönetici kimliğiyle koşan ve **birden
çok okula** dokunan akışların çıkarılması (destek paneli, platform raporları, okullar arası
sweep'ler) ve `IgnoreQueryFilters()` kullanan yerlerin taranması. Kısa devre bunlar
bilinmeden kaldırılırsa sessizce boş dönen ekranlar üretir.

⬜ İkinci adım izin kümesinin TERSİNE kurulması: bugün "hepsi eksi 24". Doğrusu sıfırdan
başlayıp platformun işinin gerektirdiğini eklemek — bunun için önce **platform izin modülü**
açılmalı (`schools.*`, `tenants.*`, `support.*`); bugün katalogda hiç yok.

Kaldırmadan önce ölçülmesi gerekenler: bugün süper yönetici kimliğiyle koşan ve **birden
çok okula** dokunan akışlar (destek paneli, platform raporları, okullar arası sweep'ler)
ve `IgnoreQueryFilters()` kullanan yerler.

### `TB-114` · KPI kartlarının değişim/eğilim verisi hiçbir uçta yok ⚪

Claude Design'ın KPI kart kataloğu (`Oksis KPI Kartlari.dc.html`) her karoda üç alan
tanımlıyor: bir önceki döneme göre **değişim rozeti** ("+12 · bu ay", "%1,4 · geçen aya
göre"), yedi noktalı **eğilim çizgisi** (sparkline) ve **oran çubuğu**. Sunucuda üçünün
de karşılığı yok: `StudentStatsDto` yalnız `total`/`active`/`newThisMonth`,
`TeacherStatsDto` `total`/`active`, `UserStatsDto` beş anlık sayaç döndürüyor —
hiçbiri önceki dönemi ya da zaman serisini taşımıyor.

Port sırasında (2026-09-04, `oksis-ui`) kartlar bu üç alan **çizilmeden** teslim edildi:
uydurma delta göstermek `K-09`'un yasakladığı yer tutucu veriyi geri getirirdi. Bileşen
(`apps/web/components/shared/kpi-card.tsx`) `delta` prop'unu ve `kpi.css` `.dl` bloğunu
taşıyor ama hiçbir ekran doldurmuyor — uç açıldığında tek yerden bağlanır.

⬜ Kapatma yolu: sayaç uçlarına önceki dönem karşılaştırması eklenmesi (delta için tek
bir `previous` alanı yeter; sparkline ayrı bir zaman serisi ucu ister). Oran çubuğu için
payda gerekiyor — "hedef" kavramı finans dışında tanımlı değil.

### `TB-122` · "Aktif mevcut" yüklemi iki yerde ayrı yazılı, ortak bir okuyucu yok 🟡

"Bu şubede şu an kim var" sorusunun cevabı iki yerde bağımsız tanımlanıyor:

- `AttendanceRosterBuilder` (Attendance) — `ClassRoomStudent.LeftAt == null` **ve**
  `StudentEnrollment.Status == Active`. Kanonik tanım budur.
- `ExamSeatingReader` (Exams, 2026-09-09) — aynı yüklemi **aynalayarak** uyguluyor.

Aynalama bilinçliydi ve gerekçesi kayıtlı: `AttendanceRosterBuilder` şube başına üç sorgu
atıyor (çok şubeli kelebek oturumunda N+1 olurdu) ve kurucusunda üç Attendance sağlayıcısı
istiyor. Sınıf dokümantasyonuna kanonik tanımın orası olduğu ve **sapmada oranın kazandığı**
yazıldı. Yani bugün doğru, ama koruması yalnız bir yorum.

Neden kayıtlı: bu, `TB-119`'un birebir sınıfı. Orada "hangi şube hangi dersi alıyor" iki
yerde ayrı tanımlanmıştı; sayaçlar sessizce çatallandı ve boş bir sınav penceresi yayın
kapısından geçti. Yüklem üçüncü bir tüketici kazandığında ya da kayıt durumlarına yeni bir
değer eklendiğinde (izinli, nakil bekliyor) aynı çatallanma tekrar doğar.

⬜ Kapatma yolu: yüklemi tek bir paylaşılan okuyucuya çıkarmak — ama nereye ait olduğu açık
değil (Attendance mı, AcademicSessions mı, ortak bir `Internal` mi) ve iki çağıranın sorgu
şekli farklı (biri tek şube, diğeri çok şube). **Yer kararı verilmeden başlamak yanlış.**
Ara koruma olarak, iki yüklemin eşitliğini ölçen tek bir bekçi testi ucuz olur.

✅ **Karar (2026-09-28, kullanıcı):** tek paylaşılan okuyucu **AcademicSessions altında `Internal`** (tek şube + çok şube imzası); yoklama, sınav oturma ve sınav yerleşim sayacı ona bağlanır. Uygulanacak.

---
### `TB-163` · Biçim kapısı ~6000 adlandırma satırının altında boğuluyor ⚪

`CLAUDE.md` `dotnet format`'ı **pre-commit zorunlu** ilan ediyor. Kapı bugün işletilemez:
`--verify-no-changes` çözüm genelinde **5988 `IDE1006` satırı** döndürüyor ve
`dotnet format` bunların HİÇBİRİNİ düzeltemiyor — adlandırma kuralları otomatik
düzeltilmez, yalnız raporlanır. `TB-117`'nin asıl kökü budur: gerçek `IMPORTS` borcu
altı bin satırın içinde görünmüyordu (bu gece onu bulmak için `head` ile kesmek gerekti
ve ilk turda gözden kaçtı).

Ölçüldü (2026-09-15, tek proje — `Oksis.Api`): **114 satır, 57 benzersiz konum**, iki sınıf:

| Sınıf | Örnek | Durum |
|---|---|---|
| `private const` / `private static readonly`, PascalCase | `private const string PermissionPrefix = "perm:";` | **Kural fazla geniş.** `.editorconfig:53` `applicable_kinds = field` diyor ve `const`/`static readonly`'yi dışlamıyor; oysa ikisi de .NET sözleşmesinde PascalCase'dir ve depo da öyle yazıyor |
| `Async` ekiyle bitmeyen `async` metot | `public async Task<IActionResult> RemoveExemption(...)` | **Gerçek ihlal** — deponun kendi kuralı (`.editorconfig:59`) |

Yani altı binin bir kısmı kuralın kendi kusuru, bir kısmı gerçek borç; ikisi ayrılmadan
kapı açılamaz.

**Kapı ayrıca HİÇBİR YERDE işletilmiyor:** `.githooks/` altında yalnız `pre-push` var ve o
derleme + birim testi koşuyor, `dotnet format` çalıştırmıyor. Yani CLAUDE.md'nin "zorunlu"
dediği adım bugün ne otomatik ne de pratikte uygulanabilir durumda.

⬜ **Karar gerekiyor, iki ayrı iş:**
- **(a) Kuralı daralt** — `.editorconfig`'e `const` ve `static readonly` için PascalCase
  istisnası ekle. Depo genelinde bir stil kararıdır; tek satırlık değil, öncelik sırası da
  düşünülmeli.
- **(b) `Async` eksiklerini kapat** — gerçek borç; sayısı (a) ayıklandıktan sonra ölçülür.

✅ **(a) yapıldı — 2026-09-16 gece turu (commit bekliyor).** `.editorconfig`'e `private const` ve
`private static readonly` için PascalCase istisnası eklendi. Ölçüm (gerçek koşu, `IDE1006`):
**2995 → 2264 satır**; "eksik ön ek" ihlali **731 → 0**, kalanın tamamı gerçek `Async` borcu, yani **(b)**.
İstisnalar bilinçli olarak `suggestion` düzeyinde: depoda 81 `private const _camelCase` ve 549
`private static readonly _camelCase` alan var, `warning` yapmak 630 yeni ihlal üretirdi — o, (b) ile
birlikte verilecek ayrı bir stil kararı. **`TB-117` (repo geneli format) yapılmadı:** ağaçta commit
edilmemiş iş varken depo geneli biçimlendirme onu boğardı.
  Metot adı değişikliği çağıranları da etkiler.

İkisi bitmeden `dotnet format --verify-no-changes`'i pre-commit kapısı yapmak, her commit'i
bloke etmek olur.

✅ **Karar (2026-09-28, kullanıcı):** (b) `Async` son eki kuralı **suggestion'a indirilir**; yeniden adlandırma yapılmaz. Uygulanacak.

---
### `TB-117` · Depoda biriken biçim borcu her görevde commit'e sızıyor ⚪

`dotnet format` (pre-commit zorunlu) sınav takvimi görevlerinde **dokunulmamış** dosyalarda da
değişiklik üretiyor: `SchoolSettingsController.cs` using sırası ve
`20260907_grade_entry_reminders.cs` dosya kapsamlı namespace (IDE0161). Ayrıca `dotnet format
--verify-no-changes` depo genelinde `tests/Oksis.Tests/**` altındaki eski dosyalar yüzünden
IDE1006 ile kırmızı; bu 2026-09-07'de de görülmüş ve o turda da kapsam dışı bırakılmıştı.

Sonuç: her görevde uygulayıcı ya ilgisiz dosyaları commit'ine katıyor ya da elle geri alıyor
(2026-09-08, Görev 1.3'te geri alındı). İkisi de yanlış: birincisi commit'i bulandırır,
ikincisi borcu bir sonraki tura devreder.

⬜ Kapatma yolu: tek seferlik `dotnet format` turu, kendi commit'inde, kod değişikliği
içermeden. `tests/Oksis.Tests` IDE1006 ihlalleri ya düzeltilir ya da `.editorconfig`'te
gerekçesiyle susturulur — sessizce kırmızı bırakmak kapıyı işlevsiz kılıyor.

---
### `X-20` · Modül yapılandırması sunucuda hiçbir ucu kapılamıyor 🟠

[[Modül Yapılandırması]] notunun açık sorusu ("kapatma yalnız arayüzü mü gizliyor?")
bu taramada ölçüldü: **sunucuda modül kapısı yok.** `ModuleConfigurations` tablosunu
`Schools` dışında hiçbir modül okumuyor; pipeline'da `RequireModule` benzeri bir davranış
ya da attribute tanımlı değil. Okulun kapattığı ya da planının kapsamadığı modülün uçları
API'den aynen çalışır — plan kısıtı yalnız arayüzde bir kilit ikonudur. Notlar özelinde
bir de ad uyumsuzluğu var: seed anahtarı `marks`, rota ve izin ailesi `grades`. Ödevler
için seed'de anahtar **hiç yok** — okul ödev modülünü ayarlardan kapatamaz bile;
kapı geldiğinde anahtar kataloğu da modül listesiyle hizalanmalı.
⬜ Merkezî çözüm: `[RequirePermission]` ile aynı katmanda bir modül kapısı davranışı
(anahtar → modül eşlemesi tek yerde) — modül modül `if` yazmak [[yamalama-kabul-degil]]
sınıfına girer. Arşivdeki `moduleConfigs: []` ölçümüyle (2026-08-16) birlikte okunmalı:
satır da yok, kapı da yok.

➕ **2026-09-15 · Altınay saha testi (B2.2):** satır sorunu platformdan açılan okulda kapandı —
`SeedDefaultModuleConfigsHandler` 11 satır yazıyor (`transport` plan kilitli, `eokul` kapalı/Beta).
Kapı sorunu sürüyor ve **istemcide de yok**: `useModuleConfigs` yalnız ayar ekranlarında
çağrılıyor (web `module-tab.tsx:73`, mobil `modules-screen.tsx:208` ve ayar hub'ı); web menüsü ve
mobil sekmeler modül ayarını okumuyor. Bir modülü kapatmak bugün ne menüden gizliyor ne ucu
kapatıyor — ekranda tutulan bir tercih.

✅ **Karar (2026-09-28, kullanıcı):** **menü + API kapısı** — kapalı modül menüden gizlenir, uçları tek `RequireModule` davranışıyla 403; seed anahtarları modül listesiyle hizalanır (ödev anahtarı eklenir, `marks`/`grades` adı birleşir). Uygulanacak.

### `X-06` geniş ayağı · Sorgu çevirisi 92 handler'da doğrulanmıyor 🟠

**Dar ayak kapandı** — EF-`Ignore` edilmiş hesaplanan property'lerin sorguya sızması
artık `EfIgnoredPropertyQueryTests` mimari testiyle yakalanıyor (`oksis-api` @ `329ba30`,
kanıt arşivde). Geniş ayak açık ve **artık ölçülü**:

| | Adet |
|---|---|
| Toplam query handler | 150 |
| Gerçek sağlayıcıya karşı en az bir testi olan | 58 |
| **Hiç doğrulanmamış** | **92** |

Sebep yapısal: handler birim testleri `MockQueryable` (LINQ-to-Objects) üzerinde koşuyor,
yani **çeviri hatalarına kör**. Bu deseni tam üç kez ısırdık (`B-15`, `X-07`, `X-04`):
**test yeşil, gerçek çağrı kırık.**

Neden kapatılmadı: 92 handler'a entegrasyon testi yazmak bir düzeltme değil, ayrı bir iş
kalemi. Kapatma yolu da tek değil — her handler'a test mi, yoksa birim testleri gerçek
sağlayıcıya çeviren ortak bir koşum mu? İkincisi tercih edilirse 92'nin tamamı tek hamlede
kapanır. ⬜ **Bu tercihi vermeden başlamak yanlış.**

✅ **Karar (2026-09-16, kullanıcı): ortak koşum.** Birim testleri gerçek SQL sağlayıcısına çeviren paylaşılan
bir koşum yazılacak; borç tek hamlede kapanır ve bundan sonra yazılan her sorgu işleyicisi otomatik kapsanır.
Çok günlük bir iş kalemi: önce koşum altyapısı + pilot bir modül, sonra kademeli geçiş. **Ölçüm güncellendi:**
tarama sırasında sayı 150/92 idi, gece turunda 218 işleyicinin 132'si ölçüldü — oran sabit, mutlak borç büyüyor.

⏸️ **Karar (2026-09-28, kullanıcı): ertelendi.**

### `TB-199` · İkon adı tipi hiçbir şeyi korumuyor; olmayan ada sessizce boş ikon çiziliyor ⚪

Ayarlar ekran revizyonunda ölçüldü (2026-09-16, `oksis-ui`). `OksisIcon` bilinmeyen bir ad aldığında
**sessizce `null` döner** (`packages/ui/src/components/icon.tsx`: `const shapes = SHAPES[name]; if (!shapes)
return null`). Tip katmanı bunu yakalayamıyor: `OksisIconName = keyof typeof SHAPES` ve `SHAPES`
`Record<string, Shape[]>` olarak yazılmış — yani `keyof` **`string`'e** çözülüyor; üstüne
`OksisIconProps.name` de zaten `string`. Sonuç: ikon adı üç katmanda da denetimsiz.

Somut belirti: Akademik Yapı › Kataloglar sekme şeridinde "Ders Kataloğu" sekmesi `icon: "doc"` diyordu;
`SHAPES`'te `doc` diye bir ad yok, sekme ikonsuz çiziliyordu ve ne tip denetimi ne lint bunu gördü.

✅ **Bu turda düzeltilen ayak:** sekme sabiti tipli bir arayüze (`ACardTab<T>`) bağlandı ve adlar var
olanlarla değiştirildi (`notlar`, `karne`). Tip hâlâ `string` olduğu için düzeltme **yalnız o dosya için**
geçerli — kalıbın kendisi açık.

⬜ **Kapatma yolu:** `SHAPES` `Record<string, …>` açıklaması yerine `satisfies` ile yazılsın (ya da açıklama
kaldırılsın) — `keyof typeof SHAPES` o zaman gerçek birleşim tipine çözülür; `OksisIconProps.name` de
`OksisIconName` olsun. Depoda bilinmeyen adla çizilen başka ikon olup olmadığı **şu an bilinmiyor**; ancak bu
değişiklikten sonra ölçülebilir.

✅ **2026-09-28 · kodda (gece turu, `oksis-ui` `fix/gece-defter-turu` `b80dec5`, merge bekliyor):** `SHAPES` `satisfies` ile, `name` tipi `OksisIconName`; core'dan `string` gelen 3 yer `isOksisIconName` koruyucusuyla. Tipin yakaladığı ve **boş çizilen** altı ad düzeltildi: `close`→`x`, `wallet`→`para`, `hand`→`userCheck`, `msg`→`mesaj`, `inbox`→`box` (3 yer), `undo`→`move`.

---

### `TB-203` · Entegrasyon paketinin yarısı master'da kırmızı — üç tenant'laştırma commit'i test fixture'larını güncellemedi 🟠

MEB müfredatı Dilim 1 uygulamasında ölçüldü (2026-09-18). `tests/Oksis.Infrastructure.IntegrationTests`
tam koşusu `b7f8baaf` (master) üzerinde **676 / 1479** başarısız. Birleştirmenin ilk ebeveyni
`60e65caf`'de aynı 79 testlik alt küme 79/79 yeşil, `b7f8baaf`'de 64'ü kırmızı. Kırmızıların kaynağı Altınay
birleştirmesinin ikinci ebeveynindeki üç commit:

| Sınıf | Adet | Commit | Neden |
|---|---|---|---|
| R1 | 338 | `7d9302b7` (TB-191) | `Subject` artık `TenantEntity`; fixture'lar okulu `School.Create` ile açıp ders kataloğunu içe aktarmıyor. 269 test `AnnouncementAudienceFixture.cs:310` `Subjects.FirstAsync`'te boş sonuç alıyor, 67'si "Cannot insert Subject without tenant context", 2'si dev seeder testi. |
| R2 | 303 | `6cefeed8` (TB-195) | `ExamType` artık `TenantEntity`; sınav fixture'larında `ExamTypes…FirstAsync` boş (289 "Sequence contains no elements", 14 "Index out of range", `MergeExamSessions:694`). |
| R3 | 34 | `15edc440` (TB-186) | `IsSchoolDay` sezonun `Active` olmasını istiyor (`AcademicCalendarRules.cs:61`); yoklama fixture'ları sezonu etkinleştirmiyor. |

**Üretimde karşılığı yok:** gerçek okul açılışı iki kataloğu da içe aktarıyor
(`CreateSchoolCommandHandler.cs:136/141`, dev seed `ClassRoomDevSeeder.cs:101/112`), TB-186 kuralı da
bilinçli. Sorun yalnız test altyapısında. Ama bedeli ağır: push kapısı yalnız birim testleri koşturduğu
için kırmızı fark edilmedi, ve paket bu hâldeyken **yeni bir entegrasyon kırmızısı gürültünün içinde
kaybolur**. Müfredat dalı bunu yeni-eski başarısız test adı kümelerini `comm` ile karşılaştırarak aşıyor;
bu bir geçici çözüm, kapanış değil.

- 🔁 **İkinci kez ölçüldü ve `comm` yöntemi ikinci kez işe yaradı** *(2026-09-20, `TB-120` turu)*:
  `ClassRoom|OpenSeasonFromDraft|Exams` süzgeci taban (`f3488976`) üzerinde **304/397** kırmızı,
  TB-120 değişiklikleriyle **301/393**. Kırmızı test ADI kümeleri karşılaştırıldığında
  (`comm -13`) **yeni kırmızı sıfır**; üç fark, TB-120 ile artık üretilemeyen "dersliksiz şube"
  hâlini ölçtüğü için silinen testler (üçü de tabanda da kırmızıydı). Hata imzaları R2 sınıfıyla
  birebir örtüştü (289 "Sequence contains no elements" + 14 "Index out of range"). Bulgunun
  "yeni bir entegrasyon kırmızısı gürültünün içinde kaybolur" uyarısı doğrulandı: değişikliğin
  masumiyeti ancak taban çizgisi alınarak gösterilebildi ve bu tek başına ~12 dakika sürdü.

⬜ Merkezî düzeltme ([[yamalama-kabul-degil]]): fixture'ların okulu açtığı tek bir yardımcı, tenant
bağlamında `SubjectCatalogImporter` + `ExamTypeCatalogImporter` çağırsın ve sezonu etkinleştirebilsin;
ders yazan testler `CreateDbContext(schoolId)` kullansın; `MasterSeedIds.Subjects` ile karşılaştıran testler
`MasterSubjectId` üzerinden çevrilsin (içe aktarılan ders yeni kimlik alıyor). Kapanış kanıtı: tam koşu
yeşil. Teşhis raporu (fixture satırları ve komutlarla):
[[2026-09-18 Entegrasyon Paketi Kırmızı Teşhisi]].

🔎 **Yeniden ölçüm — 2026-09-24 (`E-29` dalı, taban `f07eb5ea`, Docker açık).** Takım **1545 testin 724'ü
kırmızı**. Dal ile taban karşılaştırıldı: kırmızı kümesi birebir aynı, dal 4 testi fazladan yeşile çeviriyor
(yeni testler), **yeni kırmızı 0**. Mesaj dağılımı: 555 "Sequence contains no elements" (en çok sınav oturumu,
aday, yerleşim ve duyuru sınıfları; sınav türü tohumu `TB-195` sonrası boş), 54 "Cannot insert Subject without
tenant context", 47 Garage ve 4 ClamAV konteyneri ayakta değil, 14 "Index out of range", 12 "Middle kademesi
için eğitim programı tercihi tanımlı değil". Karşılaştırmalı ölçüm olmadan bu takımda "yeşil mi?" sorusunun
cevabı hâlâ yok.

✅ **2026-09-28 · kapandı (kodda, merge bekliyor):** R1 (ders), R2 (sınav türü) ve R3 (sezon aktivasyonu) imzalarının tamamı sıfırlandı — ayrıntı ve sayılar `TB-231` bloğunda (675 → 1). Tarafta gizli kalmış iki kök de düzeltildi: 13 sezon testi eğitim programı tercihi eksikliğinden düşüyordu; `OpenSeasonFromDraftTests` 2026-09-22 yürürlük kuralından önceki "2026-2027 → Manual" beklentisini taşıyordu (Master + 2025-2026 uyumluluk sürümüne çekildi).

### `TB-204` · `ExpireStaleInvitationsJobTests` koşu sırasına bağlı — iş paylaşılan DB'deki bütün okulların davetini sayıyor ⚪

`TB-203` teşhisinde ayrı görüldü (2026-09-18). `ExpireStaleInvitationsJobTests.cs:85` 2 bekliyor, 5
görüyor: iş paylaşılan fixture veritabanındaki **tüm** okulların süresi geçmiş davetlerini tarıyor, sonuç
önceki testlerin bıraktığı davetlere bağlı. Birleştirmeyle ilgisi yok; üretim davranışı doğru (iş zaten
tüm okulları taramalı).

⬜ Test `expiredCount` toplamını değil, yalnız kendi oluşturduğu davetlerin durumunu doğrulasın.

✅ **2026-09-28 · `TB-184` ile aynı commit'te kapandı (`02205f44`).**

### `TB-206` · PdfPig sürümü kanonik görünmüyor; kararlı sürüme sabitlenmeli ⚪

Müfredat Dilim 3'te PDF metin çıkarımı için `UglyToad.PdfPig` eklendi (Apache-2.0). Ama bu
makinedeki NuGet beslemesi paket için yalnız iki sürüm gösteriyor: `0.1.9-alpha001-patch1` ve
`1.7.0-custom-5`. Kullanılan `1.7.0-custom-5`'in nuspec'inde `description` alanı "Package
Description", lisans metadata'sı boş — **kanonik bir yayın etiketi gibi durmuyor**. Çalışıyor ve
gerçek MEB PDF'lerinden Türkçe metni doğru çıkarıyor (testlerle ölçüldü), ama sürüm kimliği
doğrulanmadı.

Riski sınırlayan şey, kütüphanenin `IPdfTextExtractor` arkasında olması: değişirse yalnız
Infrastructure'daki tek adaptör değişir, çizelge ayrıştırıcısı saf ve bağımsız kalır.

⬜ Gerçek nuget.org beslemesinde PdfPig'in kararlı sürümü doğrulansın ve
`src/Oksis.Infrastructure/Oksis.Infrastructure.csproj` ona sabitlensin.

### `TB-213` · `GetSchoolSettingsQueryHandlerTests` tam koşuda kararsız (Mapster genel yapılandırması) ⚪

2026-09-20 tam koşusunda düştü, **tek başına 8/8 geçti**, ikinci tam koşuda yine yeşil geldi.
Hata: `TypeAdapter.Adapt was already called, please clone or create new TypeAdapterConfig`
(`SchoolSettingsMappings.Register`). Yani testler paylaşılan **global Mapster yapılandırmasını**
kullanıyor ve başka bir test önce `Adapt` çağırdığında kayıt yapılamıyor — koşu sırasına /
paralelliğe bağlı.

Müfredat çalışmasıyla ilgisi yok (Schools modülü; dosyaya en son dokunan commit'ler bu
oturumdan önce). Ama kararsız test, gerçek bir kırmızıyı gürültüye boğar.

⬜ Test kendi `TypeAdapterConfig`'ini kursun (global olanı paylaşmasın) ya da kayıt idempotent
olsun.

✅ **2026-09-28 · kapandı (kodda (gece turu, `oksis-api` `fix/gece-defter-turu` `d5638537`):** ölçüm — handler'lar `.Adapt<T>()` ile küresel yapılandırmayı okuyor, testin kendi `TypeAdapterConfig`'i handler'a ulaşmaz. Doğru yol tek seferlik kayıt: beş test `ApplicationMappings.EnsureConfigured()` ile `AddApplication()`'daki kilitli, bir kez çalışan kurulumu (`TB-51`) çağırıyor; paylaşılan ayara kilitsiz yazma kalmadı. `TB-187` aynı madde.

### `B-54` · Öğretmen panosu yöneticinin panosunu çiziyor; beş uç 403 dönüyor 🟠

**Ölçüm (Altınay saha testi, 2026-09-20, `B6.3` turu):** yeni kabul edilen öğretmen
hesabıyla (`TEACHER` rolü, tek profil) giriş yapıldı. Kenar çubuğu doğru daraldı — Panel,
Yoklama, Notlar, Ödevler, Ders Programı, Sınav Takvimi, Duyurular, Mesajlar, Kulüplerim.
**Ama panonun gövdesi yöneticinin panosu:** "Okul geneline hızlı bakış", Öğrenci/Öğretmen
sayaçları, "Kilitli hesap · Şifre sıfırlama bekliyor", "Yanıt bekleyen davet", Raporlar ve
Davetler'e giden "Git" düğmeleri. Öğretmenin göremeyeceği veriyi isteyen beş uç arka arkaya
**403** döndü:

```
GET /api/v1/users/persons/teacher-stats        403
GET /api/v1/users/persons/student-stats        403
GET /api/v1/attendance/board?date=…            403
GET /api/v1/attendance/risk?termId=…           403
GET /api/v1/grades/summary                     403
```

Ekranda karşılığı dört ayrı "… yüklenemedi · Tekrar dene" kutusu; öğretmen için bu, yetkisi
olmadığı için değil **bozuk olduğu için** yüklenmemiş gibi görünüyor.

**Kök neden:** `apps/web/features/dashboard/dashboard-page.tsx` (86 satır) içinde **tek bir
rol dalı yok**; pano herkese aynı kart kümesini kuruyor. Kenar çubuğu rolü biliyor, pano
bilmiyor — yetki kapısı yalnız gezinmede, içerikte değil.

⬜ **Kapatma yolu:** panonun kart kümesi de portal/rol ile seçilmeli (öğretmen için: bugünkü
dersleri, yoklama bekleyenleri, kendi ödev/not işleri). Kısa vadede en azından yetkisiz
kartların hiç istenmemesi gerekir — 403'ü "Tekrar dene" ile göstermek kullanıcıyı boşa
uğraştırıyor. `K-09` örnek veri kartları bu panoda öğretmene de görünüyor; sezonsuzluk
kararıyla (`TB-168`/`TB-173`) aynı turda ele alınmalı.

---

➕ **Genişleme — öğrenci ve veli de aynı panoya düşüyor (Altınay B7, 2026-09-23).** Kullanıcı
öğrenci girişinde *"Bu işlem için yetkiniz yok"* uyarısını ekran görüntüsüyle bildirdi. Ağ
trafiği kaydedilerek üç rolle ölçüldü (Playwright, `/login` → yönlendirme):

| Rol | Vardığı adres | 403 dönen uçlar |
|---|---|---|
| Öğrenci | `/` (yönetici panosu) | `academic-sessions/current`, `academic-sessions`, `academic-sessions/terms`, `users/persons/student-stats`, `users/persons/teacher-stats`, `grades/summary`, `attendance/board` |
| Veli | `/` | `student-stats`, `teacher-stats`, `grades/summary`, `attendance/board`, `attendance/risk` |
| Öğretmen | `/` | aynı beş uç (ilk ölçümle aynı) |

İki yeni ayak:
- **Öğrenci aktif sezonu bile okuyamıyor:** `academic-sessions/current` öğrenciye 403. Üst
  çubuğun sezon seçicisi ve sezona bağlı her ekran öğrencide boş kalır. Uyarıyı büyük olasılıkla
  bu üretiyor (yalnız öğrencide görülüyor).
- **Giriş ekranı rolü söylüyor ama yönlendirmiyor:** `RedirectView` her rolü `router.push("/")`
  ile aynı yere gönderiyor; ekranda ise *"Öğrenci portalına yönlendiriliyorsunuz"* yazıyor. Web'de
  öğrenci ve veli portalı yok (uygulama gruplarında yalnız `(dashboard)`, `(auth)`, `(platform)`).

Etki: 85 öğrenci ve 135 velinin her biri ilk girişte yönetici panosunu ve yetki hatalarını
görüyor. Öncelik bu yüzden 🟠'de kalıyor ama kapsamı öğretmenden **üç role** çıktı.
⬜ Karar gerekiyor: web'de öğrenci/veli yüzeyi olacak mı (yoksa bu roller yalnız mobil mi
kullanılacak ve web girişi onları mobil uygulamaya yönlendirecek mi)? Pano rol dalı ve
öğrencinin sezon okuma izni bu karara bağlı.

🟡 **Öğretmen ayağı kapandı, master'da (2026-09-26, oksis-ui `9500b25`, merge `04c41e1`).** Pano kartları artık çağırdıkları
ucun sunucu izniyle kapılı (`packages/core/src/dashboard/widgets.ts` · `DASHBOARD_WIDGET_RULES`, izinler `[RequirePermission]`'dan:
`users.view`, `season.current.read`, `attendance.manage`, `attendance.report`, `grades.report`). İzni olmayan kart mount edilmez,
sorgusu atılmaz; "Git" düğmeleri `canAccessRoute` ile kapılı. Öğretmene yeni "Bugünkü Derslerim" kartı (`attendance/sessions/my`,
yeni uç yok). Canlı ölçüm (Playwright, Altınay, worktree web 3005 + API 5113; 3000'deki master'da önce ölçülmemişti, kullanıcı fark etti): öğretmende 403 yok (yalnız bilinen logo 404'ü, `TB-244`), müdür panosu değişmedi.
⬜ Açık: öğrenci/veli web yüzeyi kararı ve öğrencinin `academic-sessions/current` 403'ü (canlı ölçülmedi); K-09 örnek kartları.

💬 **2026-09-28 · ayrıca konuşulacak (kullanıcı).** Ölçüm: web'de öğrenci/veli portalı yok; `login-screen.tsx:447` `RedirectView` her rolü `/`'a gönderiyor ama ekranda "… portalına yönlendiriliyorsunuz" yazıyor. 403'ler gitti (kartlar izinle kapılı), ama K-09 örnek kartları (`ActivityFeedCard`, `PendingTasksCard`, `UpcomingCalendarCard`) rol kapısız — öğrenci/veli "Kilitli hesap" gibi yönetici örnek içeriği görüyor.

### `D-23` · Kullanıcılar ekranı idari personelin bağlı profilini "—" gösteriyor ⚪

**Ölçüm (Altınay, 2026-09-20):** 14 hesaplık listede müdür ve müdür yardımcısının **Bağlı
Profil** sütunu "—", yani hiç profili yokmuş gibi. Oysa ikisinin de `identity.profiles`
satırı var (`profile_type = Staff`) ve sunucu bunu **dosdoğru söylüyor**:

```
GET /api/v1/users → METİN KABACA   linkedProfileType: "Staff", linkedPersonId: VAR
                    HİLAL KAHVECİOĞLU linkedProfileType: "Staff", linkedPersonId: VAR
```

**Kök neden:** `apps/web/features/users/users-labels.ts:41` içindeki
`PROFILE_TYPE_LABEL: Record<UserProfileType, string>` yalnız `teacher` · `parent` · `student`
taşıyor; istemci sözleşmesindeki `UserProfileType` de `staff`'ı hiç tanımıyor. Sunucunun
öncelik listesi ise (`AccountUserProjection._primaryProfilePriority`) `Staff`'ı **en başa**
koyuyor — yani idari personel için gelen tek değer, ekranın çeviremediği değer.

⬜ **Kapatma yolu:** `staff` istemci tipine ve etiket tablosuna eklenmeli ("İdari Personel").
Bugünkü hâliyle sütun, "profil bağlanmamış" ile "profili ekranın tanımadığı tipte" durumunu
ayırt edilemez kılıyor — [[serilesmis-sekil-sozlesmedir]] ile aynı sınıftan bir sessiz kayıp.

✅ **2026-09-28 · kodda (gece turu, `oksis-ui` `fix/gece-defter-turu` `78fe886`, merge bekliyor):** `staff` istemci tipine ve etiketlere "İdari Personel" olarak girdi; modül ekranı olmadığı için profile git düğmesi çizilmiyor.

📺 **2026-09-28 · ekranda ölçüldü** (dal kodu: API 5113 + web 3005, Altınay, yalnız okuma): Kullanıcılar'da müdürün Bağlı Profil sütunu "İdari Personel".

### `TB-221` · Ders kataloğu okul kapsamına taşınınca dev seed testi kaldı ⚪

Aynı turda ölçüldü. `TimetableDevSeederTests` → "K-10: dev seed yetkinlik üretir ve dersleri
müfredattan türetir" kırmızı: `competencies` boş.

Ölçülen sebep: `SubjectGradeLevel` bir **TenantEntity**'dir
(`school.subject_grade_levels`, `TB-191` ile okul kapsamına taşındı), test okulu ise ham
kayıtla doğuyor ve ders kataloğunu hiç içe aktarmıyor. `TimetableDevSeeder`
`SchoolGradeLevels × SubjectGradeLevels` kesişimini boş buluyor ve erken dönüyor.

Testi en son elleyen commit `de7ced5e`. Müfredat Dilim 7-10 çalışması bu dosyalara
dokunmuyor: aynı turda program/ders/branş kataloğu değişti ama okulun ders kataloğu
tohumlama yoluna hiç girilmedi ve müfredat entegrasyon testlerinin 49/50'si yeşil.

⬜ Test kendi öncülünü kurmalı: okulu açtıktan sonra `SubjectCatalogImporter` ile ders
kataloğunu içe aktarmalı. Kusur üründe değil, testin öncülünde.

✅ **2026-09-28 · ölçüldü, kapalı:** davranış `919d22b3` ile zaten düzelmiş, test tabanda yeşildi; `e2aad5a0` ile ortak okul açılış yardımcısına bağlandı.

### `TB-227` · İçe aktarma ekranı hangi programın müfredatı olduğunu söylemiyor 🟠

2026-09-21'de kullanıcı manuel ekran testi yaparken sordu: "hangisi hazırlık sınıfı
içeriyor, nasıl anlayacağım?" Cevap: **anlaşılmıyor.**

`İçe aktarmalar` listesinin sütunları `Akademik yıl · Durum · Satır · Oluşturulma · İşlem`.
**Program sütunu yok.** 2025/05 kararının altı çalışması ekranda şöyle görünüyor:

| Akademik yıl | Durum | Satır |
|---|---|---|
| 2025-2026 | İnceleme bekliyor | 162 |
| 2025-2026 | İnceleme bekliyor | 142 |
| 2025-2026 | İnceleme bekliyor | **168** |
| 2025-2026 | İnceleme bekliyor | 163 |
| 2025-2026 | İnceleme bekliyor | **168** |
| 2025-2026 | İnceleme bekliyor | 161 |

Altı satırı ayıran tek şey satır sayısı — ve **ikisi aynı** (Hazırlık Sınıfı Bulunan Anadolu
Lisesi ile Hazırlık Sınıfı Bulunan Fen Lisesi, ikisi de 168). Yani geçici çözüm bile
çalışmıyor.

Detay ekranı da söylemiyor: `ImportRunDetailDto` ve `ImportRunListItemDto`
`EducationProgramId` taşıyor ama **yalnız Guid**; program adı hiçbir DTO'da yok ve ekran
Guid'i de basmıyor.

Zarar: onay iki kişi kuralına bağlı gerçek bir kapıdır ve merkez kullanıcısı **hangi
programın müfredatını onayladığını bilmeden** onaylıyor. Yanlış çalışmayı onaylamak sessiz
bir hata üretir — yayımlanan sürüm doğru programa gider (bağ sunucuda kurulu), ama insan
"Fen Lisesi'ni onaylıyorum" sanıp Anadolu'yu onaylamış olabilir ve ne onayladığını
denetleyemez.

⬜ Program adı iki DTO'ya da eklenmeli ve listede sütun olmalı. Çizelge sayfa numarası
(`SourcePageNumber`) da yardımcı olur: kullanıcı MEB Kaynakları ekranında `s3` kartını
görüp aynı numarayı burada arayabilir.

✅ **2026-09-28 · sunucu ayağı kodda (gece turu, `oksis-api` `fix/gece-defter-turu` `7d325952`):** `ImportRunListItemDto` ve `ImportRunDetailDto`'ya `EducationProgramName` ve `EducationProgramSourcePageNumber` eklendi (ekleme türü sözleşme); entegrasyon testi yeşil. ⬜ İstemcide program sütunu.

✅ **2026-09-28 · istemci ayağı kodda (gece turu, `oksis-ui` `fix/gece-defter-turu` `e138272`):** merkez İçe aktarmalar listesinde ilk sütun Program ("ad · s3"), eşleme ekranının üst çubuğunda program adı ve sayfa. Madde merge ile kapanır.

### `TB-228` · Dipnot işareti saklanıyor, açıklaması atılıyor 🟡

2026-09-21'de kullanıcı manuel ekran testinde sordu: "bazı derslerin yanında `*`, bazılarında
`(2)`, `(3)` var, bunlar ne?"

Bunlar MEB çizelgesinin **kendi dipnot işaretleri** ve ders adının yanında aynen korunuyor —
bu doğru, kaynağın ifadesi değiştirilmiyor. Sorun, **işaretin gösterilip açıklamasının hiç
okunmaması.**

Ölçüm (2025/05 kararı, altı çizelge):

| | |
|---|---|
| Ara alan satırı | 964 |
| **Dipnot işareti taşıyan satır** | **701** (%73) |
| Ayrık ders adı | 67 |
| **Dipnot taşıyan ayrık ders** | **47** (%70) |

Dağılım: `(1)` 305 satır · `(2)` 149 · `(4)` 133 · `(3)` 90 · `*` 24.

**Açıklama metni belgede VAR ve okunabiliyor** — ayrıştırıcı o sayfalara hiç bakmıyor.
Belge 10 sayfa; ayrıştırıcı 7'sini okuyup 3'ünü sessizce atıyor:

| Sayfa | İçerik | Okunuyor mu |
|---|---|---|
| s1 | Karar kapağı (künye) | ✅ |
| s2-s7 | Altı haftalık ders çizelgesi | ✅ |
| **s8** | Çizelgelerin **dipnot açıklamaları** | ❌ |
| **s9** | "Çizelgelerin uygulanması ile ilgili açıklamalar" | ❌ |
| **s10** | "Okutulacak derslerde uygulanacak öğretim programları" | ❌ |

Zarar: dipnotlar çoğu zaman **gerçek iş kuralı** taşıyor. s9'un ilk cümlesi bile öyle:
"Öğrencilerin 9 ve 10. sınıf seviyelerinde 'insan, toplum ve bilim', 'din, ahlak ve değer'
ile 'kültür, sanat ve spor' seçmeli ders gruplarından her bir gruptan en az birer ders…"
— bu bir seçmeli ders seçim kısıtı ve OKSİS'te hiçbir yerde yok. Merkez kullanıcısı ekranda
`(2)` görüyor, ne demek olduğunu öğrenmek için PDF'i açmak zorunda.

⬜ Karar gerekiyor: (a) dipnot metinleri ayrıştırılıp işaretle eşleştirilsin ve ekranda
üzerine gelince gösterilsin; (b) yalnız ham metin olarak belgeye bağlı saklansın, kullanıcı
okusun; (c) kapsam dışı kalsın ve bu bilinçli olarak yazılsın. Seçmeli ders grubu kısıtının
kendisi ayrı ve daha büyük bir iş — bu bulgu yalnız "açıklama hiç okunmuyor" kısmını kapsıyor.

✅ **Karar (2026-09-28, kullanıcı):** dipnot metinleri **ayrıştırılıp işaretle eşleşir**, merkez ekranında üzerine gelince gösterilir. Seçmeli grup kısıtı ayrı iş. Uygulanacak.

### `TB-229` · Reddedilen çizelge bir daha içe aktarılamıyor 🔴

2026-09-21'de kullanıcı manuel ekran testinde "Reddet'e basarsam ne olur?" diye sorunca
koddan izlendi. Cevap: **o çizelge kalıcı olarak kilitlenir.**

Zincir üç halkadan oluşuyor ve üçü birlikte çıkmaz üretiyor:

1. `Reject` ve `Quarantine` çalışmayı **terminal** duruma alıyor
   (`CurriculumImportRun.IsTerminal` → `Published | Rejected | Quarantined`). Sonraki her
   çağrı `EnsureOpen()` ile `CurriculumImportRun.Terminal` istisnasına çarpıyor.
2. Kullanıcı aynı belgeyi yeniden "Ara alana taşı" derse, `StartImportRunCommandHandler`
   var olan çalışmayı `(MebDocumentSetId, EducationProgramId, AcademicYearCode,
   PayloadSha256)` anahtarıyla buluyor ve **durumu süzmüyor**. Reddedilmiş çalışmayı
   `AlreadyExisted: true` ile geri döndürüyor; **yeni çalışma açılmıyor.**
3. Geri alma yolu **yok**: `PlatformCurriculumImportsController` üzerinde silme, sıfırlama
   ya da yeniden açma ucu bulunmuyor. Belge seti de belge başına tek
   (`EnsureDocumentSetAsync`), yani ikinci bir set açarak kaçılamıyor.

Sonuç: PDF'in içeriği değişmediği sürece (hash aynı kaldığı sürece) o çizelge o program ve
akademik yıl için **bir daha asla** yayımlanamaz. Tek çıkış veritabanına elle müdahale.

Ret geri alınamaz bir karardır ve bu doğrudur; yanlış olan, **yanlışlıkla basılan bir retten
sonra doğru yolun kapanması.** Ekran "bu karar terminaldir; geri alınamaz" diyor ama
"bu çizelgeyi bir daha içe aktaramazsın" demiyor — kullanıcı "reddederim, düzeltip yeniden
taşırım" diye düşünüyor.

⚠️ Ölçüm **koddan** yapıldı, canlı denenmedi: denemek kullanıcının açık çalışmalarından
birini kalıcı olarak kilitlerdi.

⬜ Seçenekler: (a) tekilleştirme sorgusu terminal çalışmaları dışlasın — reddedilen çizelge
yeniden taşınabilsin, yeni bir çalışma açılsın (eski ret denetim izinde kalır); (b) ret
kararına "yeniden taşımaya izin ver" seçeneği eklensin; (c) en azından ekran, ret onayında
sonucun ne olduğunu açıkça yazsın. (a) en doğrusu gibi: ret "bu içe aktarma yanlıştı"
demektir, "bu çizelge sonsuza dek yasak" demek değil.

✅ **Karar (2026-09-28, kullanıcı):** reddedilen çizelge **yeniden taşınabilir** — tekilleştirme sorgusu ve benzersiz dizin bitmiş (reddedilmiş/karantina) çalışmaları saymaz; eski ret denetim izinde kalır. Uygulanacak.

### `TB-226` · Ayrıştırıcı yalnız 2025 çizelge düzenini tanıyor 🟠

Aynı koşuda ölçüldü. Otuz belgenin tamamı indirilince, 2025 dışındaki düzenler üç ayrı
biçimde bozuluyor:

| Belge | Sonuç |
|---|---|
| `202235gslmuzik…` (2022/35), `2023-42_Spor_Liseleri` (2023/42) | Çalışmaların tamamı **karantinaya** düştü — "hiçbir seviye kodu tanınmadı" |
| `05103529_202524` (2025/24) | 270 satırın 30'unda sınıf kodu **`DERS`** — tablo başlığı sınıf sütunu sanılmış |
| `05103557_202525`, `05103624_202526` | Ara alana taşıma `Validation` hatasıyla düşüyor; gerekçe loglanmıyor |

`DERS` satırlarının sınıfı çözülemediği için yayımda da atlanıyorlar; yani tek bir yanlış
sütun başlığı otuz satırı götürüyor.

Karantina davranışı **doğru** (tasarım §6.1: hiçbir seviye tanınmadıysa tek tek düzeltmek
anlamsızdır) ama sonucu şu: katalog pratikte yalnız 2025 kararlarından besleniyor. Eski
kararlar arşiv değil — okul hâlâ 2023 çizelgesine bağlı bir sezon açabilir.

⬜ Üç ayrı iş: (a) `DERS` gibi sayısal olmayan ve hazırlık da olmayan sütun başlıkları sınıf
sayılmamalı; (b) `Validation` hatasının gerekçesi kullanıcıya ve loga yazılmalı — şu an
"neden taşınamadı" hiçbir yerde yok; (c) eski çizelge düzenlerinin desteklenip
desteklenmeyeceği karara bağlanmalı. Ölçüm hazır: 28 çizelge belgesinin 3'ü sorunsuz taşındı.

✅ **2026-09-28 · (a) ve (b) kodda (gece turu, `oksis-api` `fix/gece-defter-turu`, merge bekliyor):** **(a)** `8767d1bd` — 2025/24 PDF'i yeniden ayrıştırılarak kök ölçüldü: başlıktaki "DERS" hazırlık sütununun tam üstünde duruyor ve eşit öncelikte "HAZIRLIK" etiketini yeniyordu. `MebChartParser` sütun adı önceliği sayı > hazırlık > başka metin > SINIF; en az bir sütun tanınıyorsa sayı/hazırlık olmayan sütun sınıf sayılmıyor ama geometriden de atılmıyor (atılsa ad sınırı kayardı). Hiç sütun tanınmıyorsa davranış aynı — eski düzenlerin karantina sinyali (c) kararına kadar korunuyor. Fixture `ozel-fen-2025-24.words.json` + 3 test, golden testler aynen. **(b)** `80152104` — kök neden doğrulayıcının program kodunu 50 karakterle sınırlaması (kolon 120; 2025/25 kodu 52 karakter), hizalandı. Ayrıca tek sayfanın doğrulama hatası artık bütün belgeyi düşürmüyor: sayfa `SkippedCharts[].Reason`'da "Doğrulama hatası: …" ile raporlanıyor, kalanlar taşınıyor, Warning logu belge/sayfa/kod/gerekçeyle. 4 test. ⬜ (c) karar bekliyor. Yan gözlemler: 2025/24'te `SUM_MISMATCH` sürüyor; 2025/25 başlığındaki "TASLAK" filigranı program adına giriyor (`TB-224` ailesi).

✅ **2026-09-28 · (b) yüzeyi ölçüldü:** `platform-curriculum-page.tsx` taşıma sonucunu zaten "Taşınamayan N sayfa: s{N} ({reason})" diye hata tonunda bildiriyor; sunucu düzeltmesiyle doğrulama gerekçesi değişiklik gerekmeden ekrana düşer.

✅ **Karar (2026-09-28, kullanıcı):** (c) **yalnız okulların fiilen bağlı olduğu eski kararlar** için ayrıştırıcı genişletilir; diğerleri karantinada kalır. Uygulanacak.

### `TB-224` · Bozuk metin katmanlı belge kataloğa çöp program adı yazıyor 🟠

2026-09-21'de taze veritabanında keşif süpürmesi otuz belgenin tamamını indirince ölçüldü.
Program kataloğu belge indirilir indirilmez çizelge başlığından doğuyor (tasarım §2.2) ve
**hiçbir kalite kapısı yok**: başlık ne çıkarsa katalog satırı o oluyor.

`21173451_ort_ogrtm_hdc_2018.pdf` (2018 tarihli Ortaöğretim Kurumları HDÇ) belgesinin metin
katmanı bozuk. Ondan doğan yedi programın altısı hatalı:

| Katalogtaki ad | Olması gereken |
|---|---|
| Anadolu İmam Hatip **Lise6i** Seçmeli Dersleri (A Grubu) 10. 11. 12. | … Lisesi Seçmeli Dersleri (A Grubu) |
| Uluslararası Anadolu İmam Hatip Lisesi Seçmeli **Derslerø** 11. 12. | … Seçmeli Dersleri |
| T.C. Millî Eğitim **Baklanlığı** Anadolu İmam Hatip Lisesi | … Bakanlığı … |
| Mesleki Ve Teknik Anadolu Lisesi Anadolu Meslek Programı **……………** | … Anadolu Meslek Programı |

İki ayrı kusur var ve ikisi de aynı kapısızlıktan besleniyor:

1. **Harf bozulması** (`s`→`6`, `i`→`ø`, `Bakanlığı`→`Baklanlığı`) belgenin kendi gömülü
   yazı tipinden geliyor; ayrıştırıcının düzeltebileceği bir şey değil, ama kataloğa
   yazmadan önce **fark edilebilir**.
2. **Sınıf etiketleri başlığa sızıyor** ("… (A Grubu) 10. 11. 12."). `StripSuffix` yalnız
   "HAFTALIK DERS ÇİZELGESİ" ekini kesiyor; bu başlıklar o ekle bitmediği için ham hâliyle
   ada dönüşüyor. Aynı sebeple "Uluslararası Bakalorya Programı-I **Haftalık Ders Çizelgesi**
   (Kas…)" adında ek hiç kesilmemiş.

Zarar ölçüldü, kuramsal değil: dev seed'de iki okul (`OKSİS Dev Okulu`, `Atatürk Anadolu
Lisesi`) bu bozuk programlardan birine bağlandı. Kullanıcı bunu ancak okul açılış ekranında
gördüğünde anlar ve düzeltemez — katalog satırı belgeden doğar, elle düzenlenemez.

⬜ Türetmenin bir eşiği olmalı. Seçenekler: (a) başlıkta rakam/kontrol karakteri varsa
program açılmaz, belge "başlık okunamadı" diye işaretlenir; (b) programlar da ders satırları
gibi ara alandan geçer ve merkez onaylar; (c) çizelgenin sınıf etiketleri başlıktan çıkarılır
ve sözlük dışı harf dizisi taşıyan başlık reddedilir. Ölçüm hazır: aynı belge otuzun içinde
tek bozuk olan, yani eşik yirmi dokuz belgeyi geçirmeli.

✅ **Karar (2026-09-28, kullanıcı):** program adı belgeden doğrudan kataloğa yazılmaz; **ara alanda önerilir, merkez düzeltip onaylar** ("TASLAK" filigranı örneği dahil). Uygulanacak.

---

---

### `X-22` · İlk sezonda kullanıcı oluşturma, dosya yükleme ve öğrenci kaydı aktif sezon istiyor 🟠

2026-09-24 sezon–menü ön incelemesinde ölçüldü
([[sezon-durumuna-gore-menu-erisimi]] §3.3). Okulun ilk sezonu kurulumdayken aktif sezon
yoktur; şu yazma yolları bu yüzden düşüyor:

- Kullanıcı oluşturma/içe aktarma: `identity.errors.no-active-season` (409),
  `PersonUserCreationService.cs:104-107`, `UserErrors.cs:91-93`.
- Dosya ve okul logosu yükleme: `FILES_NO_ACTIVE_SESSION`,
  `InitiateFileUploadCommandHandler.cs:84-88`, `UploadFileCommandHandler.cs:77-81`,
  `UploadSchoolLogoCommandHandler.cs:44`.
- Öğrenci kaydı: `students.errors.session-not-active`, `EnrollStudentCommandHandler.cs:67-74`.

İlk sezonunu kuran okul öğretmen hesabı açamıyor, logosunu yükleyemiyor, öğrenci
kaydedemiyor; oysa bunlar sezon açılmadan yapılması beklenen işler. Davet yolu kurulumdaki
sezonla çalışıyor (`SeasonScopeRule.cs:13-25`) — kullanıcı oluşturmanın farklı davranması
tutarsız. Karar gerekiyor: bu yollar kurulumdaki sezonu mu hedeflemeli, sezonsuz mu
çalışmalı? Sezon geçişinde aynı yollar eski (aktif) sezona yazar; o da ayrıca ölçülmeli.

✅ **Karar (2026-09-28, kullanıcı):** ölçüm: öğrenci kaydı kurulumdaki sezonda zaten açık (`6647bbd3`). Kalan iki yol: **kullanıcı oluşturma kurulumdaki sezona yazar** (davet yolu gibi), **logo ve dosya yükleme sezondan bağımsız** çalışır. Uygulanacak.

### `TB-248` · Aktif sezonda dönem yokken ekranlar varsayılan dönemi üç ayrı kuralla seçiyor 🟡

2026-09-24 sezon–menü ön incelemesinde ölçüldü
([[sezon-durumuna-gore-menu-erisimi]] §3.4). Yarıyılda (1. dönem kapandı, 2. başlamadı) ve sezon
sonunda (son dönem kapandı, sezon arşivlenmedi) aktif dönem yoktur; dönemin `isCurrent` bayrağı
yalnız `Active` dönemde doğrudur (`ListTermsForPickerQueryHandler.cs:71`). Ekranlar bu durumda
farklı yedeklere düşüyor:

1. Web sezon bağlamı (`season-context.tsx:142-145`) → `terms[0]`. Notlar, Sınav Takvimi,
   Devamsızlık Karnesi yarıyılda 1. dönemi gösteriyor (doğru), sezon sonunda da 1. dönemi
   (son dönem olmalı).
2. `resolvePlanningTerm` (`packages/core/src/academic-sessions/logic.ts:68-84`) → tarihi
   gelmemiş ilk dönem. Raporlar yarıyılda başlamamış 2. dönemin devamsızlık raporunu, yani boş
   tabloyu gösteriyor (`attendance-reports.tsx:88-104`).
3. Backend `AttendanceTermResolver.cs:79-96` → yalnız `Active` dönem; dönem id'si verilmezse
   devamsızlık özeti ve riski boş.

Öneri: okuma ekranları en son kapanan dönemi, planlama ekranları başlamamış ilk dönemi
varsayılan alır; kural core'da tek fonksiyon olur. Backend okuma uçlarının id'siz davranışı
karar bekliyor.

✅ **Karar (2026-09-28, kullanıcı):** **okuma ekranları son kapanan dönemi, planlama ekranları başlamamış ilk dönemi** varsayılan alır; kural core'da tek fonksiyon, backend'in id'siz okuması da aynı kuralı uygular. Uygulanacak.

### `X-24` · Hata iki kez gösteriliyor: genel hata yüzeyi + ekranın kendi hata kolu (ekranlar genelinde) 🟡

2026-10-02, Altınay saha testi. `D-43` kök nedeni (ön yüz ajanı ölçtü): uygulamanın genel hata yüzeyi (`apps/web` `query-client.ts`
MutationCache) `useMutation` tanımında `onError` yoksa kırmızı bildirimi basıyor; ekranlar ise hatayı `mutate(..., { onError })` ile
ayrıca gösterince aynı mesaj iki kez çıkıyor. Zil sekmesinde düzeltildi (`6c111fa`). **Aynı çift gösterim sahada ikinci kez ölçüldü:**
Ders Programı › Yayınla penceresinde 409 `DuringLessonHours` hem pencere üstünde "Yayınlanamadı. …" şeridinde hem alttaki
bildirimde çıktı (09:42). `apps/web/features` altında `onError` + toast deseni ~54 yerde var (ayarlar sekmeleri: tatil, genel, modül,
bildirim, ders/alan/sınav türü katalogları, kademe kartı…) — hepsi tek tek ölçülmedi.
⬜ Öneri (merkezî, [[yamalama-kabul-degil]]): ekran kendi hatasını gösteriyorsa mutasyon `meta.errorHandled` ile genel yüzeyi
bastırsın (`useGrantDailyLeave` kalıbı) ya da genel yüzey `mutate` seviyesindeki `onError`'u da görsün; tek kural, lint ya da test ile
korunur.

### `D-44` · Yayın penceresi ders saatinde "Yayına hazır" diyor, ret ancak düğmeye basınca geliyor ⚪

2026-10-02 09:42, Altınay saha testi (`Y-07`). Ders saatinde 10-A için *Yayınla* penceresi yeşil "Yayına hazır. Çakışma yok." gösteriyor,
`publish-preview` `canPublish: true` dönüyor; kullanıcı ancak "Onayla ve Yayınla"dan sonra 409 alıyor. Onay adımında "ertesi okul
gününden geçerli" bilgisi var ama ders saati yasağı yok. ⬜ Öneri: önizleme `Y-07` penceresini bilsin (`canPublish=false` + gerekçe
"Ders saatlerinde yayınlanamaz; 15:25'ten sonra"), pencere bunu yeşil kutu yerine gösterip Yayınla'yı kilitlesin.

### `B-99` · Günlük devamsızlık paydası yalnız yoklaması alınmış dersler: tek ders gelmeyen öğrenciye "1 gün özürsüz" yazılıyor 🟠

2026-10-02, Altınay saha testi (öğrenci ve veli pencereleri, 12 öğrenci). Gün-eşdeğeri `AbsenceDayBreakdownResolver` (veli/öğrenci özeti)
ve eşik motoru (`AbsenceCalculator`) **yalnız `Completed` oturumlarda kaydı olan dersleri** payda sayıyor; günün programındaki ama
yoklaması alınmamış (Bekliyor/Alınmadı) dersler hesaba girmiyor. Sonuç (API + mobil veli ekranı ile ölçüldü):
- 10-A'dan bir öğrenci bugün yalnız 1. derse gelmedi; günün diğer 7 dersinin yoklaması henüz alınmamış → özet **1 gün özürsüz**,
  veli ekranı "Özürsüz devamsızlık 1 / 10 gün". Gün ilerleyip dersler alındıkça değer kendiliğinden düşecek (1/8 → 0).
- 11-A'dan bir öğrenci 30 Eylül'de yalnız 1 dersi alınmış günde o derse gelmedi → **1 gün**.
- 11-A'dan bir öğrenci 1 Ekim'de günün 8 dersinden yoklaması alınan 4'üne gelmedi (5–8. dersler "Alınmadı") → **1 gün** (8 derslik günde 4 ders).
Neden önemli: veliye ve eşik uyarılarına giden resmî sayı, öğretmenlerin yoklamayı ne kadar aldığına göre oynuyor; yoklaması
eksik alınan günler devamsızlığı şişiriyor, gün içinde veli yanlış alarm görüyor.
⬜ Karar gerekiyor: payda (a) günün programlı ders sayısı (iptal hariç; alınmamış ders "geldi" mi sayılır, hesap dışı mı?) (b) gün
kapanmadan (21:45) gün-eşdeğeri hesaplanmaz, gün içinde yalnız ders sayısı gösterilir (c) bugünkü hâli. Öneri (a)+(b).

### `B-100` · "İzinli/Raporlu Gün" ve uyarı yazısındaki özürlü gün aslında ders sayısı 🟠

2026-10-02, Altınay saha testi. `StudentAttendanceSummaryDto.ExcusedDays` = `TotalExcusedCount + TotalMedicalReportCount` — **ders kaydı
sayısı**. Ön yüz çekirdek tipi aynı alanı "izinli + raporlu gün karşılığı" diye tanımlıyor (`packages/core/src/attendance/types.ts:243`);
mobil öğrenci ve veli ekranı "İzinli/Raporlu Gün", web sorgu sekmesi "{n} gün" (`query-tab.tsx:304`) gösteriyor. 1 Ekim'de 2 dersi raporlu
olan öğrenci için ekranlar **2 gün** diyor. Veliye gönderilen devamsızlık uyarı yazısı (`threshold-letter.tsx:145`) toplamı
`unexcusedDays + excusedDays + carryOverDays` ile kuruyor — gün ile ders sayısını topluyor. Dönem raporundaki "özürlü" sütunu da ders sayısı.
⬜ Öneri: özürlü devamsızlık da özürsüzle aynı gün-eşdeğeri kuralıyla (izinli/raporlu dersler üzerinden) hesaplanıp `excusedDays` gün
olarak dönsün; ders sayısı ayrı alanda (`excusedLessons`). MEB toplam sınırı (okul ayarı `total_absence_limit` = 30) özette hiç yok.

### `B-101` · Geç kalma birikimi öğrenci/veli özetine girmiyor; dönem raporu ve eşik uyarısı sayıyor 🟠

2026-10-02, Altınay saha testi. Okul ayarı `late_to_half_day_count = 3` (3 geç = 0,5 gün özürsüz). Bir 11-B öğrencisinin 1 Ekim'deki üç dersi
müdür hesabıyla "geç geldi"ye düzeltildi (ölçümden sonra geri alındı): **dönem raporu özürsüz 0,5**, öğrenci ve veli özeti **0 gün** (mobil
veli ekranı "Özürsüz devamsızlık 0 / 10 gün · 3 Geç Kalma"). Kod: `GetStudentSummaryQueryHandler` yalnız `AbsenceDayBreakdownResolver`
(gelmedi günleri) kullanıyor; `AttendanceReportMath.CalculateTotalUnexcusedDays` (geç birikimi + devreden dahil) dönem raporu,
`AbsenceDaysBatchReader` ve eşik motoru `AbsenceCalculator`'da. Veli "0 gün" görürken eşik uyarısı 0,5 üzerinden çalışır; ekrandaki eşik
halkası (core `thresholdLevel`) da geçleri bilmiyor.
⬜ Öneri: özet de `AttendanceReportMath`'ten (tek kaynak) dönsün; `unexcusedDays` içinde geç birikimi ayrı alan olarak da gösterilsin.

### `D-45` · Veli ekranı ders başladıktan sonra "Henüz bilgi yok — İlk ders 08:55'da başlayacak" diyor ⚪

2026-10-02 10:23, mobil veli ekranı (11-B öğrencisinin velisi). Öğrencinin 1. dersinin yoklaması alınmamışken kart "Bugün ilk ders: Henüz bilgi
yok · İlk ders 08:55'da başlayacak" gösteriyor — saat geçmiş, ders başlamış; ek de yanlış ("08:55'te"). ⬜ Öneri: ilk ders saati geçtiyse "İlk
dersin yoklaması henüz girilmedi"; ek için core'daki `tr-ablative` yardımcısı kullanılsın.

### `B-96` · Zil değişince "bugün"ün kapanmış oturumları da silinip "Bekliyor" olarak yeniden doğuyor; gece yarısı 87 yinelenen hatırlatma 🟠

2026-10-01, Altınay saha testi (DB + bildirim tablosu). 30 Eylül'ün 87 oturumu 21:45'teki gün sonu işiyle `NotTaken` oldu ve
hatırlatmaları 20:28–20:50 arasında gitti. Aynı gece **23:37**'de zil değiştirildi (`B-93` canlı ölçümü); `PendingSessionPurge`'ün
sınırı "okulun bugünü" olduğu için **30 Eylül'ün 87 `NotTaken` oturumu** yumuşak silindi ve 23:48'de **`Pending`** olarak
yeniden üretildi. 23:50'de hatırlatma işi bunları yeni oturum sayıp **87 "yoklama alınmadı" hatırlatmasını ikinci kez** gönderdi
(`notifications`, tür 10, 23:xx). Bugün öğle saatinde de 30 Eylül hâlâ 87 `Pending` — bu akşamki kapanışa kadar yönetici
"Alınmayanlar"da dünü "bekliyor" görüyor.

Kural (`B-93` kararı) "bugün ve sonrası tarihli **bekleyen** (`Pending`/`NotTaken`)" diyor; gün içinde de geçerli: zil öğlen
değişirse sabah dersleri — saati geçmiş, hatırlatması gitmiş, alınmamış — yeni kimlikle `Pending` doğar, hatırlatma tekrarlanır.
⬜ Öneri: silme sınırı "bugün" değil "henüz başlamamış ders" (`date > bugün` ya da `date == bugün && start_time > şimdi`);
`NotTaken` hiç silinmez. `B-91` ile aynı aile (yeniden üretim kimlik değiştiriyor).

✅ **2026-10-01 · kodda düzeltildi** (`oksis-api` `fix/yoklama-saha-2026-10-01` ← `dafeab1c`): silme yalnız başlamamış `Pending`; `NotTaken`/`Open` hiç silinmez; yayıncı (B-90) da aynı kurala ve okul yerel saatine geçti (B-93'teki UTC notu kapandı). Entegrasyon testi 23:37 zil değişimini canlandırıyor. **Kalan ölçüm:** sahada zil değişimi yapılmadı.

### `B-98` · Zil değişince kulüp saati etkinliği ikizleniyor; eski saatteki etkinliğe girilen yoklama devamsızlığa hiç yazılmıyor 🟠

2026-10-01, Altınay saha testi (9-A/9-B/10-A/10-B, Perşembe 8. saat kulüp saati; 6 kulüp, 34 üye). Her kulübün bugün **iki**
"Kulüp saati" etkinliği var, ikisi de `Published`: **15:10–15:50** (28 Eylül'de eski zille açılmış) ve **15:00–15:30** (bugün
11:39'da yeni zille açılmış). Web'de *Kulüplerim › Etkinlikler* ve mobilde *Etkinlikler* ikisini de "Yoklama al" ile sunuyor.
Ders başlayınca (15:03) gerçek etkinlik **"Geçmiş"** sekmesine düşüyor, **"Yaklaşan"da yalnız eski 15:10 etkinliği** kalıyor —
ders sırasında yoklama açan danışman büyük olasılıkla yanlış olanı seçer.

Ölçüldü: Kütüphanecilik danışmanı eski 15:10 etkinliğine 5 üyeyi işaretledi → **200**, kulüp listesinde "katıldı" görünüyor,
ama `attendance_sessions`'a **hiçbir şey yazılmadı**. `ClubHourAttendanceRecorder` zili etkinlik aralığına düşen kulüp saati
dersini arıyor (`b.Start >= from && b.End <= to`); 8. ders 15:00'te başladığı için 15:10–15:50'ye sığmıyor ve kaydedici
`Success(empty)` dönüyor — hata yok, uyarı yok. Sonuç: o kulübün 5 öğrencisinin 8. saatinde devamsızlık kaydı yok
(`TB-259` sınırı yüzünden de kimse fark etmez).

Kök neden iki parça: (1) `OpenClubHourActivitiesCommandHandler` tekilliği **kulüp × başlangıç** ile kuruyor; başlangıç değişince
eskisini bulmuyor, yenisini açıyor; (2) `B-93`'ün `PendingSessionPurge`'ü zil değişiminde yalnız yoklama oturumlarını yeniliyor,
kulüp saati etkinliklerine dokunmuyor. ⬜ Öneri: zil/gün ataması değişince başlamamış kulüp saati etkinlikleri yeni zile **taşınır**
(katılım satırlarıyla), ikiz açılmaz; kaydedici eşleşen ders bulamazsa sessiz başarı yerine hata verir.
**Test artığı:** 6 eski 15:10 etkinliği duruyor; Kütüphanecilik'inkinde 5 "katıldı" işareti var.

✅ **2026-10-01 · kodda düzeltildi** (`oksis-api` `fix/yoklama-saha-2026-10-01` ← `d77d3d4b`, göç `20261001132811_…club_hour_twin_cleanup` dev DB'de, **5 ikiz** yumuşak silindi): başlamamış kulüp saati yeni zile taşınır (`ClubHourActivitySync`, `RescheduleClubHour`), beş zil komutu hizalamayı tetikler, eşleşmeyen yoklama 409 `Attendance.ClubHour.NoMatchingPeriod`. Sahada ölçüldü: her kulübün tek kulüp saati var; bayat etkinliğe işaret 409. **Karar bekliyor:** Kütüphanecilik'in işaretli bayat 15:10 etkinliği (`90E2D7C4…`, 5 "katıldı") korunuyor.

### `D-42` · Danışmanın ekranları kulüp saatini göstermiyor: günlük listede "Boş", kulüp kartında "0 etkinlik" 🟡

2026-10-01, Altınay saha testi. Çevre ve Kimya danışmanı (aynı zamanda 10-B Kimya öğretmeni) mobilde *Yoklama › Bugünkü
Derslerim*'de 8. saati (15:00–15:30) **"Boş"** görüyor; o saatte kulüp yoklaması alması gerektiğini söyleyen hiçbir şey yok,
*Daha fazla › Kulüplerim › kulüp › Etkinlikler*'e kendisi gitmeli. Aynı kulübün kartı hem webde hem mobilde **"0 etkinlik"**
diyor (web özet kartı "Toplam etkinlik 0"); kulübün içindeki sekme "Etkinlikler 2" gösteriyor — sayaç kulüp saati türünü
saymıyor. `TB-259` kararıyla hatırlatma da gitmediği için danışmanı kulüp saatine götüren tek yol hafızası. ⬜ Öneri: günlük listede
kulüp saati satırı ("Kulüp saati · <kulüp> · Yoklama al"), kart sayacı tüm türleri saysın.

✅ **Karar (2026-10-01, kullanıcı):** öneri kabul — web ve mobil günlük ders listesinde kulüp saati satırı, doğrudan kulüp
yoklamasına götürür; kart sayacı tüm etkinlik türlerini sayar.

✅ **2026-10-01 · kodda düzeltildi** (`oksis-ui` `fix/yoklama-ekran-kurallari` ← `a76c07b`; sayaç `oksis-api` `fix/yoklama-saha-2026-10-01` ← `6f3c530d`). Sahada ölçüldü: web'de danışmanın 8. saati "Kulüp saati · Müzik Kulübü · 6 üye · Yoklama Al"; `/clubs/mine` `activityCount` 1. **Kalan ölçüm:** mobil.

### `B-91` · Açık mobil uygulama, yeniden yayında silinen yoklama oturumunun kimliğini tutuyor — "Sınıf listesi yüklenemedi" 🟠

2026-09-30, `B-90` ekran testi (Android, `com.oksis.mobile.dev`, öğretmen Zuhal Karaca Kaya). 11-A yeniden yayınlandıktan
sonra *Bugünkü Derslerim*'de 2. derse dokunmak **"Sınıf listesi yüklenemedi"** verdi: istemci
`GET attendance/sessions/e69dd755…/roster` istiyor, **404**. `e69dd755` v2'nin oturumu; v3 yayınında silinip yerine yeni
kimlikli oturum üretilmişti. Aşağı çekip yenilemek düzeltmedi: `sessions/my` 20:50 ve 20:56'da 200 döndü (sunucu doğru
kimliği — `4dfcce79` — veriyor, aynı uç öğretmen belirteciyle ayrıca çağrılarak ölçüldü), ama dokunuş yine eski kimliğe
gitti. Uygulama **tamamen kapatılıp açılınca** doğru kimlik geldi (200).

Neden önemli: `B-90` düzeltmesi her yeniden yayında şubenin bekleyen oturumlarını yeni kimlikle yeniden üretir; içerik
değişmese bile. Açık uygulamadaki her öğretmen o günün kalan derslerine giremez. Aynı bayatlık yoklama hatırlatma
bildirimlerindeki oturum kimliklerinde de var (API açılışında 88 hatırlatma gönderildi).

Kök neden **bulunamadı**: `useMyDailySessions` düz `useQuery` (kalıcı önbellek yok, `staleTime` 30 sn), satırlar
`useMemo` ile yanıttan kuruluyor, yanıt başlığında önbellek yönergesi yok. İki yön: (a) mobilin eski listeyi nereden
tuttuğu (yönlendirme yığını / `router.push` aynı rotayı mı yeniden kullanıyor) ölçülmeli; (b) sunucu tarafında içerik
değişmeyen yerleşimin bekleyen oturumu korunabilir (kimlik değişmez) — `ProgramPublisher` şu an hepsini siliyor.

### `TB-262` · Yayından sonraki ilk pano açılışında `attendance/unrecorded` 500 — gün üretiminde yarış koruması yok 🟠

2026-09-30, `B-90` ekran testi. İki yeniden yayının ikisinde de webde *Devamsızlık* açılır açılmaz
`GET /api/v1/attendance/unrecorded` **500** döndü; ikinci çağrı 200. Günlük: `Cannot insert duplicate key row …
ux_attendance_sessions_school_placement_date`. Pano ile "Alınmayan Yoklamalar" aynı günü aynı anda üretmeye çalışıyor;
`SessionMaterializer.MaterializeForDateAsync`'te — `GetOrCreateAsync`'in aksine — yarış koruması **hiç yoktu**. `B-90`
yayında bekleyen oturumları sildiği için yayından sonraki ilk açılışta bu yarış **her seferinde** yaşanıyor.

✅ **2026-09-30 · kodda düzeltildi** (`oksis-api` master `0582af31`): indeks ihlalinde kaybedenin
satırları `Detach` edilir, kazananın ürettiği gün okunup döner (`GetOrCreateAsync` kalıbı). Entegrasyon testi yarışı
kaybedenin `SaveChanges` anına bir yakalayıcıyla kazananı sokarak **deterministik** kuruyor
(`MaterializeForDateAsync_RaceLoss_ReturnsWinnersSessionsWithoutThrowing`). 

**2026-09-30 · canlı ölçüm (API master `0582af31` ile yeniden başlatıldı):** panonun tarih seçicisi yalnız bugün ve geçmiş iki günü
sunuyor, yani ekrandan yeni gün açılamıyor (yarış ekranda yalnız yeniden yayınla kurulur). Ölçüm panonun çağırdığı iki uçla,
oturumu olmayan günlerde yapıldı. Altı eşzamanlı istek (`board` + `unrecorded`, 5 Ekim): **iki istek slot indeksi ihlaline
düştü, ikisi de yakalanıp 200 döndü** (düzeltme öncesi 500). Ama bir `board` isteği **deadlock kurbanı** oldu (SQL 1205,
`SessionMaterializer.cs:123`) → 500. Kurbanın işlemi sunucuda tümüyle geri alındığından "yakala + yeniden oku" burada işe
yaramaz; işlemin yeniden denenmesi gerekir (`TransactionBehavior` içinde EF yürütme stratejisi / yeniden deneme). İki eşzamanlı
istekle 6 günde (6–13 Ekim) hepsi 200, ama o denemelerde istekler çakışmadı; kanıt sayılmaz.
✅ **2026-09-30 · deadlock kolu da kodda kapandı** (`oksis-api` master `d251036a`): `MaterializeForDateAsync` yazacak satır
varsa kendi transaction'ını açıp `sp_getapplock` ile **okul×gün kilidi** alıyor, dolu slotları kilit altında yeniden okuyup
yalnız eksikleri yazıyor; ikinci istek bekliyor ve hiçbir şey yazmıyor (yazacak satır yoksa kilit hiç alınmıyor). İndeks
ihlali yakalaması kilit almayan `GetOrCreateAsync`'e karşı ikinci savunma olarak kaldı. Testler: ikinci üretimin kilitte
beklediği `sys.dm_tran_locks`'tan ölçülerek kuruluyor; yoklama/ders programı/okul entegrasyon takımı 286/286.
Canlı ölçüm **yapılmadı**: 23:36'da başka bir oturum ana ağaçtan (kilitsiz kodla) 5112'de API başlatmıştı; ona karşı 5 günde
6'şar eşzamanlı istek yine 500 verdi — eski davranışın teyidi, yeni kodun ölçümü değil. İkinci API açmak arka plan işlerini
yineleyeceği için açılmadı. **Arşive gitmek için:** yeni ikiliyle eşzamanlı istek ölçümü.

### `TB-263` · Dev veritabanında koddan olmayan bir B-90 göçü uygulanmış (`…b90_attendance_supersession`) 🟡

2026-09-30. `oksis_dev`'in `__EFMigrationsHistory`'sinde `20260928201835_20260928_b90_attendance_supersession` var ama
`fix/b-90-yeniden-yayin-slot-gate`'te bu göç yok; `codex/b90-attendance-republish` dalından (ve `stash@{0}`
"b-90-codex-fix") kalmış. Eklediği `superseded_at`, `superseded_by_session_id`, `superseded_reason` sütunları
`academic.attendance_sessions`'ta duruyor, hiçbir satırda dolu değil, bu dalın modelinde yok. Şimdilik zararsız (sütunlar
boş kabul ediyor). Ama iki dal birleşirse ya da dev DB'den şema karşılaştırması yapılırsa çakışır.
✅ **2026-09-30 · karar (kullanıcı): atılır.** `codex/b90-attendance-republish` dalı (master'da olmayan commit yoktu) ve
`stash@{0}` "b-90-codex-fix" (karma `0c33da6c`, 32 dosya) silindi. `stash@{1}` ("dersProgramıv1tov2_fix_codex", başka iş)
duruyor. ⬜ **Kalan:** dev DB'de `superseded_*` sütunları ve `__EFMigrationsHistory` satırı hâlâ duruyor; elle kaldırılmalı.
Kullanıcı kaldırmayı onayladı (2026-09-30) ama otomatik izin denetimi veritabanı yazımını engelledi; komut kullanıcıya verildi.
Ölçüm: üç sütun da boş, bağlı indeks/FK/varsayılan yok; codex göçünün yeniden kurduğu `placement` indeksini
`20260930182147` zaten düşürdü.

### `D-40` · Program editörü açılışta başlıkta şube adı yerine şube kimliği gösteriyor ⚪

2026-09-30, `B-90` ekran testi. Revize durumdaki 11-A programı `/schedule/<id>` ile doğrudan açılınca yükleme bittikten
sonra başlık bir an **`15c03917-848b-4941-a8b5-394d52cac67e`** (şubenin kimliği) oldu; birkaç saniye sonra "11-A"ya
döndü. Bir kez görüldü; şube adı sorgusu gelmeden başlık kimliğe düşüyor gibi.

### `TB-256` · Yoklama maddileştirme ve pano entegrasyon testlerinin 17'si master'da kırmızı (ders kataloğu hatasından ayrı) 🟡

2026-09-26, `Y-06` entegrasyon koşusunda ölçüldü. `SessionMaterializerTests` + `AttendanceBoardAndJobsTests`: **17 kırmızı / 27**.
Aynı iki sınıf `HEAD` (`d6598101`) üzerinde ayrı bir worktree'de koşturuldu: **yine 17 / 27** — dal getirmedi. Hata `TB-231`'in
"Cannot insert Subject" hatası değil: oturum hiç üretilmiyor ("Expected sessions to contain 1 item(s), but found 0"),
`board.IsSchoolDay` false, `Open` NotFound. Tarih/okul günü çözümüne bağlı görünüyor (ölçüm günü Cumartesi; testlerin bir kısmı
"bugün"e bakıyor). 
**2026-09-27 ölçümü (E-34 dalı):** `FullyQualifiedName~Attendance` süzgeciyle master'da **40 kırmızı / 155**, dal aynı 40'ı
veriyor (liste birebir aynı). Kökler iki: (1) **`TB-186`** okul gününü yalnız AKTİF sezonun öğretim döneminde sayıyor, test
tohumları `AcademicSession.Create` sonrası `Activate` çağırmıyor → `IsSchoolDayAsync` false, oturum üretilmiyor, `Open` NotFound,
pano `IsSchoolDay` false. Yeni `ClubHourAttendanceTests` tohumunda sezon aktifleştirilince aynı zincir yeşil koştu. (2) 5 test
`TB-231`'in "Cannot insert Subject without tenant context" hatası. ⬜ Kapatma yolu: yoklama test tohumlarında sezonu aktifleştirmek.

✅ **2026-09-28 · kapandı (kodda (gece turu, `oksis-api` `fix/gece-defter-turu` `af322046`, merge bekliyor):** beş yoklama dosyası sezonu `DatabaseFixture.Activated` ile etkinleştiriyor (`StudentAttendanceViewsTests`'te yalnız "bugün" sezonu — okulda tek aktif sezon kısıtı); yoklama kırmızıları sıfır.

### `X-23` · `Oksis.Infrastructure` derlemesi 5–6 dakika: 227 göç Designer dosyası (≈3,4 milyon satır) her derlemede analiz ediliyor 🟡

2026-09-26, `Y-06` çalışması. Altyapı projesine dokunan her değişiklikten sonra `dotnet build src/Oksis.Api` 4:51–6:02 sürdü
(önceki artımlı derlemeler 15–50 sn). `Persistence/Migrations` altında 227 `*.Designer.cs`, toplam ≈3,4 M satır; her yeni göç
≈1 MB ekliyor. Derleyici sunucusu 4,7 GB bellek ve %600 CPU'da çalışıyor; bir kez kilitlendiğinde `ef migrations` komutları
10 dakikalık zaman aşımına düştü. Günlük döngüyü ve ajan oturumlarını yavaşlatıyor. ⬜ Seçenekler: eski göçleri tek bir taban
göçte birleştirmek (squash), Designer dosyalarını analizörlerden dışlamak (`.editorconfig` `generated_code = true`) ya da göçleri
ayrı bir derlemeye taşımak. Karar gerektirir.

✅ **Karar (2026-09-28, kullanıcı):** göç **Designer dosyaları analizden çıkarılır** (`generated_code = true`), kazanç ölçülür. Uygulanacak.

### `D-37` · Mazeret Kaydı penceresi açıklamayı "isteğe bağlı" gösteriyor, sunucu zorunlu tutuyor; red sessizce yutuluyor 🟡

2026-09-27, `E-34` ekran ölçümünde (Altınay'ın veritabanı kopyasında, müdür hesabı) görüldü. *Devamsızlık › Mazeret Kaydı*
penceresinde "Açıklama · ops." yazıyor; açıklamasız "Kaydet ve Onayla" `POST attendance/excuses` 400 dönüyor
(`CreateExcuseCommandValidator`: `Description` `NotEmpty` → `attendance.errors.reason-required`). Pencere hiçbir cümle
göstermiyor: `create-excuse-modal.tsx` `createExcuse.mutate(…, { onSuccess })` çağırıyor, hata kolu yok; kullanıcı düğmeye
bastığında hiçbir şey olmuyor sanıyor. Aynı pencerede "Raporlu" seçilince belge zorunluluğu istemci doğrulamasıyla görünüyor
(o kol çalışıyor).

⬜ Kapatma yolu: kural tek yerde — ya açıklama gerçekten isteğe bağlı olur (sunucu gevşer) ya da alan zorunlu işaretlenir ve
istemci şeması aynı kuralı uygular; her iki durumda da pencere sunucu hatasını (`mutationErrorDesc`) göstermeli.

✅ **2026-09-28 · kodda (gece turu, `oksis-ui` `fix/gece-defter-turu` `8c180e1`, merge bekliyor):** kural sunucuda olduğu için istemci ona uyuldu: açıklama zorunlu (ortak şema, web + mobil), sunucu reddi pencerede, MSW 400'ü aynalıyor.

📺 **2026-09-28 · ekranda ölçüldü** (dal kodu: API 5113 + web 3005, Altınay, yalnız okuma): Mazeret Kaydı penceresinde "Açıklama" artık "ops." değil; "Belge · ops." kalıyor.

### `D-31` · Native `<select>` yasağı delinmiş: web uygulamasında ~69 native seçim kutusu 🟠

2026-09-25'te kullanıcı bulgusu (Y-05 sabit kural formu native select ile yazılmıştı). Kural `FilterDropdown`
dosya başında ve kullanıcı bulgularında yazılı: native `<select>` kullanılmaz, form alanında `SelectBox`. Ölçüldü
(`grep -rn "<select" apps/web`): 69 satır, birkaçı yorum. En çok: `sections/modals.tsx` 6, `homework-admin-screen.tsx` 6,
`platform/school-wizard.tsx` 5, `settings/classroom-tab.tsx` 4, `schedule/constraints-page.tsx` 4, `settings/general-tab.tsx` 3.
Yasak yalnız yorumda; makine zorlaması (lint) yok, bu yüzden her yeni ekranda yeniden deliniyor.

🟡 **Kısmen (commit bekliyor, dal `feat/sinif-rehberligi-dersleri`):** `FilterDropdown`'a `searchable` (varsayılan kapalı,
Türkçe katlamalı arama; ortak `core` `foldTurkish`) ve `block` (form alanında tam genişlik; `SelectBox`'ta varsayılan açık)
eklendi. Sabit kural formu (ders aramalı, gün, başlangıç) ve editörün öğretmen görünümü seçimi (aramalı) `SelectBox`'a geçti.
Ekranda ölçüldü: kutu kap genişliğine eşit (251/251), "rehb" → Rehberlik, "turk dılı" → 3 ders, eşleşme yoksa "Sonuç yok",
Enter tek sonucu seçer, gün menüsünde arama yok.
⬜ Kalan: diğer ~65 native select'in `SelectBox`'a taşınması ve bir eslint kuralı (JSX `select` yasağı) ile kalıcı kapı.

✅ **2026-09-28 · kodda (gece turu, `oksis-ui` `fix/gece-defter-turu` `0a9061a`…`b136c67`, merge bekliyor):** web'deki 67 native `<select>` ortak `SelectBox`/`FilterDropdown`'a taşındı; bileşen seçilemeyen madde, grup başlığı, `id`/`htmlFor`, alan + değer söyleyen erişilebilir ad, ↑/↓/Home/End ve odak dönüşü kazandı; uzun listeler aramalı. **Kalıcı kapı:** `packages/eslint-config/next.js`'te JSX `select` yasak (deneme dosyasında lint hatası ölçüldü). Davranış değişikliği: ders programı üretiminde "Seviye seçin…"e dönmek artık 0. seviye değil seçimsizlik yazıyor. Ekranda yalnız DEV hızlı giriş ölçüldü, diğer 38 ekran gezilmedi.

📺 **2026-09-28 · ekranda ölçüldü** (dal kodu: API 5113 + web 3005, Altınay, yalnız okuma): giriş ekranındaki DEV seçiciler ve Kullanıcılar süzgeçleri yeni bileşenle çalışıyor; Mazeret penceresinde native select yok.

### `B-71` · Kişi güncelleme ucu cinsiyeti zorunlu tutuyor; sihirbazın cinsiyetsiz açtığı veli güncellenemiyor 🟡

Altınay'da 2026-09-25'te çıktı (Dil şubelerinin 16 velisine e-posta yazılırken). Kayıt sihirbazı veliyi
cinsiyet sormadan açıyor (`persons.gender` NULL). `PUT users/persons/{id}` gövdesi `UpdatePersonBody.Gender`
**non-nullable** (`PersonsController.cs:286`), oysa komut `UpdatePersonCommand.Gender` nullable. Cinsiyeti boş
kişinin e-postasını ya da telefonunu değiştirmek için cinsiyet uydurmak gerekiyor; boş gönderilince 400
(`$.gender` çevrilemedi). Ölçüldü: 16 velinin 16'sı 400; öğrencilerde (cinsiyet dolu) 204.
Altınay'da cinsiyet, seçilen ilişkiden verildi (Anne → Kadın, Baba → Erkek).

⬜ Kapatma yolu: gövdede `Gender?` (komutla aynı); ya da sihirbaz veliden cinsiyet istesin. Karar bekliyor.

✅ **Karar (2026-09-28, kullanıcı):** **sihirbaz veliden cinsiyet sorsun** (zorunlu alan). Güncelleme ucu cinsiyeti zorunlu tutmaya devam eder; ⚠️ mevcut cinsiyetsiz kayıtlar (Altınay velileri, müdür) bu kararla düzeltilebilir hâle gelmez — ayrıca ele alınmalı. Uygulanacak.

### `TB-255` · Veri yazan göç Redis önbelleğini düşürmüyor — yeni ders 24 saat listede görünmüyor ⚪

2026-09-25 Altınay testinde çıktı (kullanıcı: "rehberlik dersi sabit kural modalında ders listesinde yok").
`ListSubjectsQuery` `[Cacheable(86_400, "academics:subjects")]` (okul başına anahtar). Y-05 göçü
`20260925_guidance_master_subject` rehberlik dersini SQL ile okul kataloglarına yazdı; önbellek düşürme yalnız komut
hattında (`CacheInvalidationRules`) çalıştığı için göç atlandı. Ölçüldü: Altınay ucu 77 ders döndü, rehberlik yok; ATA-AL'da
bir ders düzenlendiği için anahtar düşmüş, orada görünüyordu. Üç okulun `tenant:*:academics:subjects` anahtarı elle silindi
→ Altınay 78 ders, rehberlik listede.

⬜ Kapatma yolu: veri yazan göçten sonra ilgili önbellek anahtarları düşmeli — ör. API açılışında uygulanan göç varsa
etkilenen önbellek önekleri temizlenir, ya da önbellek anahtarı şema/göç sürümünü taşır. Tek seferlik elle silme kalıcı çözüm değil.

✅ **Karar (2026-09-28, kullanıcı):** **API açılışında** son uygulanan göç değişmişse tenant önbellek önekleri temizlenir (göç kimliği Redis'te). Uygulanacak.

### `TB-254` · `CurriculumVersioningMigrationTests.Cutover_…` kırmızı: eski göç noktasında güncel model `track` kolonunu okuyor ⚪

2026-09-25'te Y-05 doğrulamasında çıktı (ajan ölçümü). Test göçleri eski bir noktaya kadar kurup veriyi güncel
kodla okuyor; `SessionCurriculum.LoadItemsAsync` Y-04'ün `track` kolonunu seçtiği için `Invalid column name 'track'`.
Y-04 (`14b1f130`, master) ile başladı; Y-05 değişikliğiyle ilgisi yok. Ürün kodu doğru; test, ara göç şemasında
güncel sorguyu çalıştırıyor.

⬜ Kapatma yolu: testin okuma adımı hedef göç noktasının şemasıyla uyumlu kalsın (ham SQL) ya da test kesme noktasını
güncel göçe taşısın. `TB-252` ailesi (entegrasyon testi ortam varsayımı).

✅ **2026-09-28 · kapandı (kodda (gece turu, `oksis-api` `fix/gece-defter-turu` `f47ebdd3`):** okuma adımı kesme noktasının şemasına uygun ham SQL'e alındı. Göç zincirini sona kadar sürmek ayrı bir kusur gösterdi → `TB-260`.

### `TB-252` · Müfredat entegrasyon testi paylaşılan veritabanındaki yayımlanmış sürüme bağlı — çalışma sırasına göre kırmızı ⚪

`Y-04` (alan bazlı müfredat profili) doğrulamasında çıktı (2026-09-24, `oksis-api` `cc4a2aa3` tabanı).
`CurriculumSnapshotActivationTests.Manual_draft_yields_empty_snapshot`, 2033 yılında MEB master'ı **olmadığını**
varsayıyor ve snapshot'ın `Manual` olmasını bekliyor. Aynı paylaşılan test veritabanına
`CurriculumPublishTests` "2033-2034" sürümünü yayımlıyor ve silmiyor. O test daha önce koştuysa taslak
`Master` kaynaklı doğuyor ve test kırmızıya düşüyor (`Expected Manual, found Master`). Tek başına koşuda da
kırmızı çünkü satır veritabanında kalıcı. Ürün kodu doğru; test ortam durumuna bağlı. `Y-04` değişikliğiyle
ilgisi yok: snapshot kaynak türünü taslaktan alıyor, o yol değişmedi.

⬜ Kapatma yolu: "master'ı olmayan yıl"ı test içinde garanti et (ör. hiçbir testin yayımlamadığı ve
çalışma anında boş olduğu doğrulanan bir yıl) ya da `CurriculumPublishTests` kendi yayımladığı sürümü
temizlesin. `TB-184` ailesi: paylaşılan veritabanında küresel duruma bakan test.

✅ **2026-09-28 · kapandı (kodda (gece turu, `oksis-api` `fix/gece-defter-turu` `03005e56`, `fc4b718c`):** manuel taslak testi çalışma anında yayımlı en eski yılın öncesini seçip öncülünü doğruluyor (sabit 2033 ayrıca 2026-09-22 yürürlük kuralıyla da kırmızıydı). `CurriculumPublishTests` paylaşılan DB'deki "Matematik/Türkçe" adlı başka derslerle "ambiguous" eşleşiyordu; fixture'ın iki dersine bağlandı ve payload ders kodunu taşıyor. Yan etki düzeltildi: `Preview_matches_the_snapshot` karşılaştırması saatli satırlara çekildi (önizleme 0 saatlik satırı saymıyor, snapshot yazıyor). ⚠️ **İz:** paylaşılan test DB'sinde MIDDLE-GENERAL için 2031/2033/2035 sürümleri kalıyor; ileri yıl testi kırmızıya düşerse ilk bakılacak yer.

### `TB-260` · `education_program_from_document` göçü, cutover'ın snapshot satırlarının bağlı olduğu tohum müfredat satırlarını silerken FK'ye takılıyor 🟡

2026-09-28 gece turunda `TB-254` düzeltilirken ölçüldü (`CurriculumVersioningMigrationTests`, göç zinciri sona kadar sürüldü).
`20260921 education_program_from_document` göçü tohum müfredat satırlarını siliyor; cutover'ın ürettiği snapshot satırları bu
satırlara `source_entry_id` ile bağlıysa silme yabancı anahtara takılıyor ve göç düşüyor. Göç testinde tekrarlanabilir. Dev
veritabanı bu noktayı çoktan geçtiği için bugün belirti yok; ama cutover sırasında aktif sezonu olan **eski bir veritabanında**
(üretime ilk kurulum ya da eski yedekten geri dönüş) göç zinciri kırılabilir.

⬜ Kapatma yolu: göç silmeden önce snapshot satırlarının `source_entry_id` bağını boşaltsın ya da yeni satıra taşısın (hangi
anlamın doğru olduğu snapshot'ın kaynak izi sözleşmesine göre seçilmeli); göç testi zinciri sona kadar yeşil koşmalı.

✅ **Karar (2026-09-28, kullanıcı):** göç silmeden önce snapshot'ın `source_entry_id` bağını **boşaltır**, sonra siler (veri kaybı yok, yalnız kaynak izi kopar). Uygulanacak.

### `TB-261` · Sezon devri önizlemesi: yalnız hazırlık, 9 ve 10'u açık okulda 10-A "Mezun" çıkıyor, test "Terfi" bekliyor ❓

2026-09-28 gece turunda entegrasyon takımı 675 → 1 kırmızıya indirildiğinde kalan tek kırmızı
(`SeasonRolloverPreviewTests.Rows_Preparatory_PromotesToNinthGradeAsync`; tabanda da kırmızıydı). Önizleme hesabı okulun **kendi
kademe listesine** bakıyor: okulda 11. sınıf açık olmadığı için 10-A'nın bir üst kademesi yok ve satır "Graduate" dönüyor. Test
ise 10-A'nın terfi etmesini bekliyor. Hangisi doğru, ürün sorusu: kademe listesi eksik açılmış (henüz 11'i olmayan yeni) bir okulda
10. sınıf mezun mu sayılır, yoksa MEB kademe sırasına göre 11'e mi terfi eder (ve 11 kademesi açılması mı istenir)?

⬜ Karar gerekiyor; kod ve test ona göre hizalanır.

✅ **Karar (2026-09-28, kullanıcı):** **terfi + uyarı** — 10. sınıf MEB sırasına göre 11'e terfi eder; önizleme "11. sınıf kademesi açık değil" uyarısı verir ve devir o kademe açılmadan tamamlanmaz. Uygulanacak.

## Not

`TB-##` maddeleri **kod taramasından** çıktı; bir kısmının kullanıcıya görünen belirtisi
olmayabilir — borç oldukları için kayıtlılar. `B-##` · `D-##` · `V-##` · `E-##` maddeleri
ise **ekranda ya da uçta ölçüldü**.

Defterin kendi dersleri (kapanmış turlardan damıtıldı, tamamı [[OKSİS - Bulgu Arşivi]]'nde):

- **Çağrılmayan uç, arkasındaki kusuru da saklar.** Ekran yazılır yazılmaz izin eksiği,
  çeviri anahtarı, katalog boşluğu arka arkaya dökülüyor.
- **Ekranın uyguladığı kural, sunucunun bilmediği kuraldır** — ekran değişirse ya da ikinci
  bir istemci gelirse kural yoktur.
- **İsim bir sözleşme taşımıyorsa**, yanlış seçim hata değil *sessiz eksilme* üretir.
- **Ekran bazlı yama değil, sınıfı kapatan merkezî çözüm** ([[yamalama-kabul-degil]]).
