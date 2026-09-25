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

**Sıradaki boş ID:** `B-78` · `D-35` · `V-05` · `X-23` · `TB-256` · `E-34` · `ENG-04`
*(`K-##` karar sayacı: sıradaki `K-30` — `K-16`…`K-26` modül belgelerinde kullanılmış.)*
*(`E-##` sayacı [[OKSİS - Yapısal Kararlar ve Eksikler]] ile ortaktır.)*

**Yazma kuralı:** yeni ID vermeden önce hem bu dosyada hem
[[OKSİS - Yapısal Kararlar ve Eksikler]]'de, hem de [[OKSİS - Bulgu Arşivi]]'nde `grep` at —
sayaçlar üçü arasında ortak.

---

## Özet

| Öncelik | Adet | Kapsam |
|---|---|---|
| 🔴 Kritik | 10 | Tenant izolasyonu · veri/çıktı kaybı · akışı bütünüyle bloklayan |
| 🟠 Yüksek | 38 | İşlev yanlış çalışıyor, veri/yetki güveni zedeleniyor |
| 🟡 Orta | 49 | İşlev eksik ama alternatif yol var; borç birikiyor |
| ⚪🟢 Düşük | 36 | Kozmetik, temizlik, adlandırma |
| ❓ Netleşmemiş | 0 | — |
| **Toplam** | **133** | |

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

**Modül dağılımı:** Notlar 5 · Ödevler 4 · Bildirimler 6 · Nöbet 1 · Çapraz kesen 50 (sınav, okul açılışı ve platform kimliği maddeleri dahil)

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

### `TB-19` · Geçici muafiyetin TÜKETİM noktası yok 🟡 *(dağıtım ayağı kapandı — 2026-08-31)*

✅ **Kapanan yarı (2026-08-31, `oksis-api` @ `8ed7024`).** Dağıtım işi muafiyeti
`CoversDay(today)` — **yöneticinin butona bastığı gün** — ile süzüyordu; koddaki yorum
ise baştan beri *"dönem-kapsayan Temporary"* diyordu. Canlıda ölçülen tablo (2026-08-12)
tam olarak bu ayrışmaydı: 3–14 Ağustos dönemi 12 Ağustos'ta koşturulunca 11–13 Ağustos
muafiyetli öğretmen havuzdan düştü, 13–14 Ağustos muafiyetli düşmedi.
`DutyExemption.CoversPeriod` eklendi: haftalık-tekrarlı çizelgeden çıkarma ölçütü
**dönemin tamamını** kapsayan muafiyettir. Naif "kesişiyor mu" düzeltmesi testle birlikte
elendi — beş aylık dönemde iki gün muaf olanı 20 haftalık nöbetten muaf tutardı
(`duty_assignments` tarih değil `day_of_week` taşır). İki nöbet okuma ucunun "bugün"ü de
UTC'den **okulun gününe** çevrildi.

⬜ **Açık kalan yarı — bir YÜZEY gerekiyor, bir düzeltme değil.** `K-12` §C2 kararı
*"öğretmen çizelgede kalsın, o tarihlerde yerine vekil geçsin"* diyor. Bunun için
**"3 Kasım'da hangi bölgede kim nöbetçi?"** diye soran bir tüketim noktası şart ve bugün
yok: çizelge `day_of_week` taşıyor, `GetMyDuties` tarihsiz dönüyor. Model hazır
(`DutyAssignment.RelieverId` var), eksik olan tarih eksenli sorgu ve onu gösteren ekran.

🚫 **Uç yazılıp ekran yazılmadı ve bu bilinçli:** bu tur aynı deseni üç kez ölçtü
(`E-22`, `TB-100`, `TB-82`) — *çağrılmayan uç, arkasındaki kusuru da saklar*. Yüzey
kararı verildiğinde ikisi birlikte yazılmalı.

➕ **2026-09-16 · sunucu ayağı kapandı, madde EKRAN için açık kalıyor (gece turu, commit bekliyor).**
Tarih eksenli tüketim yüzeyi yazıldı: `GetOnDutyForDateQuery` → `GET duties/on-duty?date=…`
(`duties.view`, yeni izin ve göç gerekmedi). Kurallar: sürüm seçimi `Published ∪ Superseded` +
`EffectiveFrom <= date <= EffectiveTo` ve **kapanış gününde ardıl sürüm kazanır** (yayın, canlı sürümü
ardılın `EffectiveFrom`'uyla kapattığı için o gün iki sürüme birden düşüyor — testle ölçüldü); muafiyet
ölçütü tüketim anı metodu `CoversDay` (dağıtımın `CoversPeriod`'u değil) ve muaf öğretmen çizelgeden
**düşmüyor**, satırda işaretleniyor; vekâlet `RelieverId` ile çözülüyor, yancı da muafsa ya da okul
parametresi kapalıysa satır `uncovered` — açık nöbet sessizce kaybolmuyor. **`ISchoolCalendarService`
Duties'e ilk kez bağlandı:** tatilde "kimse nöbetçi değil" ile "o gün okul yok" artık ayrı (ikinci bir
tatil okuyucusu yazılmadı, `TB-176`/`TB-177` sonrası tek kaynak). Testler: 4 senaryo yeşil (geçmiş tarih
doğru sürümden, muaf → yancı, yancılık kapalı → uncovered, tatil), Api 444 · Application 2711 yeşil.
⬜ **Açık kalan:** ucun **tüketicisi yok** — ekran yazılmadı ve oksis-ui codegen'i çalıştırılmadı.
Defterin kendi dersi gereği (çağrılmayan uç arkasındaki kusuru saklar) madde yüzey gelene kadar kapanmaz.

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

### `TB-106` · Akademik politikanın not alanları tüketicisiz 🟡

`TB-46` ağırlığı tek yere indirdi ama tüketici gelmedi: `WrittenWeight` /
`PerformanceWeight` politika ucunda (`GET /grades/policy`) istemciye dönüyor, hiçbir
hesaba girmiyor — dönem içi ders ortalaması bilinçli olarak ağırlıksız (`GradeMath`).
`WrittenExamCount` / `PerformanceCount` (1–3 doğrulayıcılı) ve `RoundingRule` de
okunmuyor; sütun kataloğu master sınav türlerinden geliyor, "üç yazılı" seçen okul üçüncü
sütunu açamıyor. ⬜ Bu alanların gerçek tüketicisi karne / dönem sonu notu; o modül
gelene kadar ekranda "çalışıyormuş gibi görünen" üç ayar var. Ya ayar yüzeyinden gizlenir
ya da karne kararına bağlanır.

### `TB-107` · Not yayın bildirimi kademe kapısını şubenin ilk öğrencisinden okuyor ⚪

`AssessmentPublishedNotificationHandler` "öğrenciye bildirim gitsin mi" sorusunu
`students[0].GradeLevel` ile tek kez cevaplıyor. Şube tek kademeli olduğu sürece doğru;
karma kademeli şube modelde yasak değil. Bugün belirti üretmez, varsayım koda yazılmamış.

✅ **2026-09-16 · kapandı (gece turu, commit bekliyor).** Politika `GradeVisibilityResolver.ReadPolicyAsync` ile
**tek sorguda** okunuyor, eleme bellekte **öğrenci başına** yapılıyor (öğrenci başına sorgu atan yol seçilmedi,
N+1 olurdu). Üç test: karma şube iki sırayla (`InlineData` — "ilk öğrenci" kusurunun şansa geçmemesi için) ve
tüm kademeler gizliyken öğrenci çözümünün hiç çağrılmaması.

### `TB-108` · Harf ölçeği seçilebiliyor ama not girişi harf kabul etmiyor 🟡

Master katalogda `HARFLI` ölçek var ve okul onu varsayılan seçebiliyor. Not girişi
`MarkValue.FromWire` ile yalnız sayı ve `G`/`M` tanıyor; harf ölçeğinin `MaxValue`'su
boş olduğundan üst sınır sessizce 100'e düşüyor. Harf sistemi seçen okulda öğretmen "A"
girince 400 alır, "85" girince kabul edilir. ⬜ Ya harf ölçeği katalogdan/seçimden
kaldırılır ya da harfli giriş ve ortalama kuralı tasarlanır ([[Not Ölçeği]] açık sorusu).

### `TB-113` · Not modülü "bugün"ü sunucu saatinden okuyor, okul takviminden değil ⚪

Gecikme rozeti (`GradeMath.IsOverdue`) ve yazma sonrası DTO'daki tarih
`DateTimeOffset.Now.LocalDateTime` ile hesaplanıyor (`ListMyGradeBooksQueryHandler` ve
altı yer daha). Ödev modülü aynı hesabı `ISchoolCalendarService.GetLocalNowAsync` ile
yapıyor ve kendi ARCHITECTURE notunda bunu "Grades'te bilinen sapma" diye işaretlemiş
ki "diğer modül böyle yapıyor" gerekçesiyle geri alınmasın. Bugün UTC+3'te tek okul
varken belirti üretmez; sunucu UTC'de koşarsa gece 00:00–03:00 arasında sütunlar bir
gün erken/geç "gecikmiş" görünür. ⬜ Yedi çağrı yeri tek servise bağlanır.

---

✅ **`TB-113` · 2026-09-16 kapandı (gece turu, commit bekliyor).** Notlar modülünün gün kararı artık okul
takviminden geliyor: yeni `Grades/Internal/GradeCalendar.SchoolTodayAsync` (Ödevler'deki kardeşinin birebir
eşi), **8 çağrı yeri** bağlandı. Bunlardan biri defterde sayılmamıştı ama taşınması zorunluydu:
`SendGradeEntryReminders` `clock.Today` kullanıyordu ve pano "bugün hatırlatıldı" rozetini `SentOn == today` ile
okuyor — yalnız panoyu çevirmek, yazan uçla okuyan ucun farklı gün kullanmasına ve düğmenin gece yarısından
sonra bir gün yanlış durumda kalmasına yol açardı ([[besleyen-yuzey-olculmeden-kapanmaz]]). UTC damgalar
(`PublishedAt`, denetim izi, göreli etiket) bilinçli olarak UTC kaldı: **gün kararı yerel, mutlak an mutlak.**
Test saat dilimi farkını gerçekten ölçüyor (aynı an, okul UTC+3'te ertesi güne geçmiş → gecikme eşiği aşılıyor).

## 10. Ödevler 🟡

Kaynak: domain-map taraması, `oksis-api` @ `b72c819` (2026-09-03). Modülün haritası
[[Ödevler]] notunda. Dört madde de kodun kendi ARCHITECTURE notunda "açık madde" olarak
duruyordu ama defterde kaydı yoktu; ikisi ürün kararı bekliyor.

### `TB-109` · Vekâleten yayınlanan ödevin sahibi ayrılmış öğretmen kalıyor 🟡

Uç 4 (`:publish-for`) ayrılmış öğretmenin taslağını idare adına yayınlıyor ama
`OwnerTeacherPersonId`'yi değiştirmiyor. Takip ızgarasını işaretleme ve toplu tamamlama
`HomeworkWriteGate`'ten (sahip-only) geçtiği için **idare kendi yayınladığı ödevin
ızgarasını işaretleyemez**; kapatma ve iptal de sahibinindir. Teknik analiz §3 sahiplik
devri demiyor, spec'e uyuldu — ama ayrılmış öğretmen bir daha giriş yapmayacağı için o
ödev sonsuza dek "işaretlenmemiş" kalır ve kontrol bekleyenler panosunda yaşar.
⬜ Ürün kararı: sahiplik idareye mi devredilir, yoksa yönetme izni işaretleme kapısını
da açar mı? İkincisi Kulüpler'deki "kendi kulübüne bakan müdür yardımcısı danışman
görür" kalıbının kardeşidir.

✅ **Karar (2026-09-16, kullanıcı): yönetme izni işaretleme kapısını da açar.** Sahiplik devredilmez — ödevi kimin
yazdığı bilgisi bozulmadan kalır; ödev yönetme izni taşıyan idare, sahibi olmasa da işaretleme ve kapatma
yapabilir. Kulüplerdeki danışman kalıbının kardeşi.

✅ **Uygulandı — 2026-09-16 (doğrulama sürüyor, commit bekliyor).** Kapı tek yerde: `HomeworkWriteGate.OpenAsync`
artık **varsayılanı olmayan zorunlu** bir erişim kipi parametresi alıyor (`OwnerOnly` / `OwnerOrManager`) — isteğe
bağlı olsaydı yeni bir yazma ucu hiçbir şey yazmadan kapıyı sessizce gevşetebilirdi; zorunlu olması yedi çağrı
noktasının hepsini yüzeye çıkardı ve politika tek `grep`'le denetlenebilir hâle geldi. İdare kolu
`homework.manage` ile açılıyor; sıra "önce sahiplik", kapsam dışı hâlâ 404. **Sahiplik devredilmiyor**, denetim izi
işlemi gerçekten yapanı (idareyi) yazıyor ve `GET homework/{id}/audit` orada gösteriyor.

➕ **Karar (2026-09-16, kullanıcı) — kapsam genişledi:**
1. **İptal de idareye açılır** (`OwnerOnly` → `OwnerOrManager`); bulgu metni zaten "kapatma ve iptal de
   sahibinindir" diye şikâyet ediyordu.
2. **İdari kapatma denetim izine yazılır** — bugün kapatma hiçbir yerde iz bırakmıyor; yeni bir denetim türü
   değeri gerekiyor (enum sonuna eklenir, göç gerekmez).
3. **İdare ödeve başka bir öğretmen atayabilmeli** — ayrılan öğretmenin ödevi yeni bir sahibe geçebilsin.
   Bu ayrı bir özellik: `E-28`.

✅ **Genişleyen kapsam da uygulandı — 2026-09-16 (commit bekliyor).** İptal `OwnerOrManager` oldu: vekâleten
yayınlanmış ya da sahibi ayrılmış ödevde **yanlış verilmiş bir ödevi geri çekebilecek kimse kalmıyordu**,
idarenin tek aracı kapatmaktı ve kapatma öğrenciye açıklama bırakmaz. İdari kapatma için yeni denetim türü
`ClosedByManager` (enum **sonuna** eklendi; göç gerekmediği ölçüldü — kolon düz `int`, check constraint yok ve
`TB-121` bekçisi değişiklikten sonra yeşil koştu). **Yalnız sahibi olmayan kapattığında** satır yazılıyor:
sahibinin kapatmasında "kim" sorusunun cevabı zaten belli, her kapatmaya satır yazmak denetim ekranını bilgi
taşımayan satırlarla doldurup `Cancelled`/`SubmissionRemoved` gibi gerçekten bakılması gereken satırları boğardı
(emsal `PublishedOnBehalf`). Testler: Domain 108 · Application 302 · Api 42 (süzgeçli) yeşil.
⬜ **Arayüz borcu:** denetim ekranı yeni `"closed-by-manager"` etiketini tanımıyorsa satırı ham gösterir; ayrıca
idarenin **iptal düğmesini görüp görmediği** ölçülmedi — sunucu artık izin veriyor ama ekran düğmeyi sahip-only
gizliyor olabilir.

### `TB-110` · İdari teslim kaldırma kapanmış ödevde 409 🟡

Uç 23 (`AdminRemoveHomeworkSubmission`) Faz 3'ün `Homework.RemoveSubmission`
sarmalayıcısından geçiyor ve o, ödev `Published` değilken `SubmissionClosedException`
atıyor. Sonuç: idare kapanmış ya da iptal edilmiş ödevin yanlış yüklenmiş (KVKK'ya
aykırı, başkasına ait) dosyasını kaldıramaz; tek yol ödevi yeniden açmak, o da yok.
Kural bilinçli olarak gevşetilmedi — ikinci bir kaldırma yolu aynı kuralı iki yerde
ayrıştırırdı. ⬜ Domain metoduna "idari" kolu eklenir (gerekçeli kaldırma durum kapısını
atlar) ya da kapanmış ödevde kaldırma ürün olarak kabul edilir.

✅ **Karar (2026-09-16, kullanıcı): idari kaldırma açılır.** Kapanmış ödevde de ödev yönetme izni taşıyan idare
teslim dosyasını kaldırabilir. Gerekçe KVKK: başkasına ait ya da yanlış yüklenmiş bir dosya bugün kalıcı kalıyor
ve ödevi yeniden açmanın yolu da yok. Domain metoduna gerekçeli **idari kol** eklenecek; durum kapısı yalnız bu
kol için atlanacak, öğretmenin kendi yolu değişmeyecek. Kaldırma zaten denetim izine yazılıyor (`TB-112`'nin ucu
onu gösteriyor).

✅ **Uygulandı — 2026-09-16 (commit bekliyor).** `Homework.RemoveSubmission` artık **varsayılanı olmayan zorunlu**
bir `removal` parametresi alıyor (`Self` | `Administrative`) — `TB-109`'un kapı kalıbının aynısı; isteğe bağlı
olsaydı yeni bir kaldırma yolu kapıyı sessizce atlayabilirdi. Durum kapısı **yalnız `Self`** kolunda uygulanıyor,
yani öğrencinin kendi yolu kapanmış ödevde hâlâ reddediliyor. Gevşeyen tek şey durum kapısı: soft-delete, zorunlu
gerekçe, ikinci kaldırmanın reddi, kapsam kapısı (başkasının satırında 404) ve denetim satırı aynen duruyor.
Enum kalıcı değil — kolon değil, metot parametresi; ikinci bir gerçek üretilmedi. 11 test yeşil.

### `TB-111` · Son teslim tarihi ileri alınan ödev ikinci kez hatırlatılmaz 🟡

`HomeworkTracking.DueReminderSentAt` satır başına idempotency damgası; `UpdateContent`
`DueDate`'i değiştirse bile sıfırlanmıyor. Öğretmen teslimi bir hafta ertelerse yeni
tarihin öncesinde hatırlatma gitmez. Sıfırlamak tersini yapardı: tarih bir gün
kaydırılınca herkese ikinci bildirim. ⬜ Ürün kararı; orta yol "tarih en az N gün
ileri alındıysa sıfırla" da mümkün.

✅ **`TB-111` karar (2026-09-16, kullanıcı): her erteleme yeniden hatırlatsın.** Son teslim tarihi değiştiğinde
`DueReminderSentAt` damgası sıfırlanır ve yeni tarihin öncesinde hatırlatma yeniden gider. Eşik konmadı: kullanıcı
öngörülebilirliği seçti, yani öğretmen saati düzeltse bile bildirim gider. **Ölçülecek yan etki:** aynı ödevde
arka arkaya yapılan küçük düzeltmeler bildirim yığını üretebilir; sahada gözlenip gerekirse eşik sonradan eklenir.

✅ **Uygulandı — 2026-09-16 (commit bekliyor).** Son teslim tarihi **değiştiyse** (ileri ya da geri) bütün takip
satırlarının hatırlatma damgası sıfırlanıyor; tarih değişmediyse damga duruyor.
**Besleyen yüzey ölçülüp düzeltildi** ([[besleyen-yuzey-olculmeden-kapanmaz]]): `UpdateHomework` kapıyı
`includeTracking: false` ile açıyordu, yani koleksiyon yüklenmediği için sıfırlama boş liste üzerinde dönüp
**sessizce hiç olmayacaktı**. Hatırlatmanın gerçekten yeniden gittiği üç kapıda ayrı ayrı ölçüldü: satır süzgeci
(`Unmarked && DueReminderSentAt == null`), hatırlatma penceresinin yeni tarihe taşınması ve bildirim
tekilleştirme anahtarının farklı güne düşmesi. Tamamlamış öğrenciye ikinci hatırlatma yine gitmiyor. 6 + 3 test.
⬜ **Ölçüm borcu:** `includeTracking: true` değişikliği birim testiyle yakalanamıyor (mock agregatın koleksiyonu
zaten dolu geliyor); gerçek koruma entegrasyon koşusu, o da bu makinede bellek yüzünden koşturulamadı.

### `TB-112` · Ödev denetim kaydı yazılıyor, okuyan uç yok ⚪

`HomeworkAuditEntry` beş olay tipiyle yazılıyor (yayın, adına yayın, iptal, toplu
tamamlama, idari kaldırma); sözleşmede `/homework/{id}/audit` bildirilmediği için hiçbir
ekranda görünmüyor. Not modülünün denetim ucu emsal (`grades.manage`). Çağrılmayan uç
arkasındaki kusuru da saklar — ucu yazmadan satırların şekli doğrulanamaz.

---

✅ **`TB-112` · 2026-09-16 kapandı (gece turu, commit bekliyor).** Notlar'daki `GetGradeBookAudit` kalıbı birebir
Homework'e taşındı: yeni `Homework/Queries/GetHomeworkAudit/` + `GET homework/{id}/audit`, izin **mevcut**
`homework.manage` (yeni izin açılmadı, göç gerekmedi), okul süzgeci açıkça yazılı, başka okulun ödevi 404.
Dört test: sıralama ve alan eşlemesi, **başka okulun satırının sızmaması**, yabancı ödevde 404, okul bağlamı
yokken 403.

### `E-28` · Ayrılan öğretmenin ödevi başka bir öğretmene atanamıyor 🟡

Kullanıcı isteği (2026-09-16, `TB-109` karar turunda): *"İdare, denetim yetkisiyle birlikte ayrılan öğretmenin
yerine başka bir öğretmen de atayabilsin."*

`TB-109` sahipliğin **devredilmemesine** karar verdi — "kim yazdı" bilgisi bozulmasın diye. Ama okul gerçeğinde
öğretmen ayrıldığında ödevin bir sahibi olmalı: bugün ödev, artık okulda olmayan bir kişinin üstünde kalıyor ve
yeni öğretmen onu kendi listesinde görmüyor. `TB-109`'un açtığı idari kapı (`homework.manage` ile işaretleme,
kapatma, iptal) bu boşluğu yönetsel olarak kapatıyor ama **öğretmen tarafını** kapatmıyor.

⬜ Tasarlanacak: ödevin sorumlu öğretmenini idarenin değiştirebildiği bir yol.
- Sahiplik geçmişi korunmalı: "kim yazdı" ile "kim sorumlu" ayrı iki bilgi olabilir (`TB-109`'un kararıyla
  çelişmemeli).
- Denetim izine yazılmalı (kim, ne zaman, kimden kime).
- Öğrenciye bildirim gitmeli mi, ödev listesi/panosu nasıl güncellenir — ürün kararı.
- Aynı sınıfın kardeşi: vekâleten yayınlama (`:publish-for`) ve nöbet vekâleti; oradaki dil ve kalıp emsal alınmalı.
- Öğretmen ayrılışının kendisi bir olay mı (toplu devir), yoksa ödev ödev mi yapılır — ölçülmeli.

✅ **Tasarlandı ve kararları bağlandı — 2026-09-16.** Plan: [[2026-09-16-odev-devri-e28]]. Uygulama sürüyor.
**Ölçümden iki dayanak:** (1) vekâleten yayın bugün sahibe **hiç dokunmuyor**, "kim yaptı" bilgisini denetim satırı
taşıyor; ders vekâleti de devri ayrı bir kayıtta tutup öğretmeni devretmiyor — yani OKSİS'te "başkası adına iş"
sahipliği ezerek değil **ikinci bir olgu eklenerek** taşınıyor. (2) **Öğretmen ayrılışının kodda olayı yok**
(`Terminate` düz bir setter, olay yayınlamıyor), yani "ayrıldı → hepsini devret" otomatiği olmayan bir olayı icat
etmeyi gerektirirdi → toplu devir kapsam dışı.
**Kullanıcı kararları:** sorumlu ayrı nullable alan (`OwnerTeacherPersonId` dokunulmaz, `TB-109` ile çelişmez) ·
devri yalnız idare yapar · **yeni sorumlu tam sahip yetkisi alır** (taslağı düzeltip kendi yayınlayabilir) ·
yalnız `Draft`/`Published` · **gerekçe koşullu: ödevi yazan öğretmen hâlâ çalışıyorsa zorunlu, ayrılmışsa isteğe
bağlı** (çalışan birinin ödevini elinden almak açıklama ister) · denetim kaydına **kimden/kime** kolonları + göç ·
ders programı kontrolü zorunlu değil (yerine geçen öğretmen programa işlenmeden önce devri imkânsız kılardı) ·
v1'de bildirim yok · **öğrenci ve veli ekranında yeni sorumlu görünür, ayrı bir alanla** (mevcut alanın anlamını
değiştirmek `TB-188`'in "tek alanda iki politika" hatasının kardeşi olurdu) · geri alma aynı uçta `null` ile.

✅ **Uygulandı ve kapandı — 2026-09-16 (commit edildi ve push edildi).** Sunucu ve yüzey **aynı turda**
(`TB-188`'in dersi). Domain: nullable sorumlu alanı, etkin sorumlu türetmesi tek yerde; sahibine geri verme alanı
**boşaltıyor** — "hiç devredilmemiş" ile "geri verilmiş" tek durum, ikinci gerçek doğmuyor.
**Kaçınılmaz ikiz ve bekçisi:** EF-Ignore property sunucu sorgusuna konulamaz ama "Ödevlerim" soruyu veritabanına
sormak zorunda; SQL yüklemi ayrı yazıldı ve ikisinin ayrışmasını bir test çarpım gezerek kilitliyor, ayrıca
property EF-Ignore bekçisinin listesine eklendi — **bu bekçi ilk kez gerçek bir işte konuştu** (bkz. aşağıdaki
yanlış pozitif notu).
Kapı: üçüncü erişim kipi ve kip eşlemesi **birlikte** yazıldı; eşleme unutulsaydı detay ucu çalışma zamanında
patlardı, iki bekçi testi bunu kilitliyor. Devirden sonra ödevi yazan artık sahip değil (testle kilitli).
Gerekçe kuralı handler'da (öğretmenin çalışma durumu DB'den okunuyor), doğrulayıcı yalnız biçimi denetliyor;
arayüzdeki koşullu alan **aynı kaynaktan** besleniyor ve sunucunun reddini olduğu gibi gösteriyor.
Uç yanıtı bilinçli olarak detay DTO'su **değil**: uç taslakta da çalışıyor, oysa detay ucu taslağı idareye 404
veriyor — detay dönseydi başarılı bir devir istemciye hata gibi görünürdü.
Testler: Domain 121 · Application 363 · Api 44 (ödev süzgeçli) · `Oksis.Tests` 65/65 · core 46 · api-mocks 137.
⬜ **Kalan iki ayak:** denetim kaydının "kimden/kime" alanları istemciye bağlanmadı — çünkü **ödev denetim izinin
hiç tüketicisi yok** (`TB-112`'nin devamı); ve ödev yönetme izni olan biri ödevi kendi yazdıysa detay ekranında
devir düğmesini görmüyor (idare listesinde görüyor) — yönü güvenli, kayıtlı.
➕ **Yol boyunca iki kusur düzeltildi:** yeni test dosyası hiç derlenmediği için beş ölçümü bir kez bile
koşmamıştı (`TB-190`), ve EF-Ignore bekçisi bir **yanlış pozitif** verdi — erişim sorguda değil, sorguyu açan
`if` koşulundaydı; bekçiye muafiyet eklemek yerine erişim ayrı deyime alındı, yani bekçi delinmedi.

### `TB-251` · Ödev şeması testi sabit teslim tarihine bağlı — tarih geçince kırmızıya düştü ⚪

`E-29` doğrulamasında çıktı (2026-09-24). `packages/core/src/homework/schemas.test.ts` geçerli formu
`dueDate: "2026-09-18"` ile kuruyor. Şema geçmiş teslim tarihini reddettiği için tarih geçince iki test kırmızıya düştü
("geçerli formu kabul eder", "tek şube ile seçili öğrenciyi kabul eder"). Değişikliksiz tabanda da kırmızı (ölçüldü).
Ürün kodu doğru, test zamana bağlı.

⬜ Kapatma yolu: tarihi test anına göre üret (ör. bugün + 7 gün) ya da şemaya saat enjekte et. Aynı sabit tarih
kalıbı başka şema testlerinde de var mı, taranmalı.

## 11. Bildirimler 🟠

Kaynak: `oksis-api` @ `61808d25` bildirim altyapısı taraması (2026-09-10). Zincirin
kendisi (olay → Hangfire → dispatcher → kanal → teslim kaydı) ayakta; bulgular
**ayar yüzeyi ile teslimat arasındaki kopukluk** üzerinde toplanıyor — `TB-43`'ün
kapattığı sahte toggle sınıfının kalan hâli.

### `TB-125` · Okulun bildirim ana anahtarı ve Portal kararı, kapsam eşlemesi dışındaki tiplerde hiç uygulanmıyor 🟠

`InAppNotificationChannel` iki kapısını da (`NotificationConfig.IsEnabled` ana anahtarı
ve `NotificationRuleConfig.PortalEnabled`) `PushEventKeyMap.TryGetEventKey` **başarılı
olursa** çalıştırıyor; eşlemede karşılığı olmayan tip `if` bloğunu atlıyor ve satır
koşulsuz yazılıyor. Eşlemede bugün 14 tip var, `NotificationKind` 39 değer taşıyor.

Kodun gerekçesi "eşlemede olmayan tipin matriste satırı da yoktur" — **bu artık doğru
değil.** Katalogda satırı olan ve gerçekten bildirim üreten beş olay eşlemenin dışında:
`ATT_THRESHOLD`, `ATT_DAILY_SUMMARY`, `ANNOUNCEMENT`, `HOMEWORK_MISSING`,
`EXAM_WINDOW_PUBLISHED`. Yönetici bu beşinin Portal sütununu kapatıyor, bildirim yine
düşüyor. Aynı sebeple **"bildirimleri tümden kapat" düğmesi** bu tipler ve eşleme dışı
kalan 20 tip (ders programı, nöbet, mazeret, düzeltme, izin, duyurunun sekiz hâli,
kayıt yenileme) için de çalışmıyor — kapının tek durağı in-app kanalıydı.

⬜ Kapı eşlemeden bağımsızlaştırılmalı: ana anahtar her tipte, Portal kararı ise
katalogda satırı olan her olayda uygulanmalı. `PushEventKeyMap` push kapsamının kaynağı
olarak kalır; matris kapısının kaynağı olmaktan çıkar.

✅ **2026-09-16 · `TB-175` ile birlikte kapandı (gece turu, commit bekliyor).** Ana anahtar kapısı
`TryGetEventKey` bloğunun dışına alındı — eşlemede olmayan ~25 tip de kapıya uyuyor. Portal kararının
kaynağı yeni `NotificationEventKeyMap` (katalogda satırı olan 22 tip), `PushEventKeyMap` yalnız push
kapsamı olarak kaldı; e-posta ve push kanallarına da ana anahtar kapısı eklendi ve `config is null` dalı
"kapalı" yerine varsayılana düşüyor. Uygulama içi kanal dış kanal anahtarlarına bakmıyor. Ölçüm ve
varsayımlar `TB-175` bloğunda. `TB-126` bilinçli olarak kapsam dışı: e-posta kanalının kapsam kapısını
`NotificationEventKeyMap`'e çevirmek bazı olaylarda **gerçekten e-posta göndermeye başlamak** demek —
teslimat davranışı değişikliği, ayrı ürün kararı.

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

### `TB-127` · Kulübün dört katalog satırı hâlâ `delivered: false`, üreticileri var ⚪ *(kapandı — 2026-09-16)*

`NotificationEventTypeSeedData` dört `CLUB_*` satırını `delivered: false` ile yazıyor ve
yorumu "handler'lar Faz 5'te yazıldığında bayrak kendi migration'ıyla `true`'ya çevrilir"
diyor. Faz 5 geldi: dört bildirim handler'ı da (`ClubActivityPublished`,
`ClubActivityCancelled`, `ClubAnnouncementPublished`, `ClubApplicationDecided`) yazılı ve
`PushEventKeyMap` kapısı da açık. Bayrağı çeviren migration yazılmamış — model
snapshot'ta dördü hâlâ `IsDelivered = false`.

Zararı `TB-24`'ün tersi yönde: ekran çalışan bir bildirimi "henüz teslim edilmiyor" diye
gösteriyor. ⬜ Tek satırlık seed düzeltmesi + migration (emsal: `20260828130231`).

✅ **2026-09-16 · kapandı (gece turu, commit bekliyor).** Önce açık olduğu ölçüldü (dev DB'de dördü de
`is_delivered = 0`, buna karşılık dört üretici de yazılı ve `PushEventKeyMap`'te dört anahtar da açık), sonra seed
bayrağı çevrildi ve göç `20260916051021_20260916_club_event_types_delivered` dev DB'ye uygulandı (`Up()` yalnız
dört `UpdateData`, şema komutu sıfır — sızıntı iki eksende kontrol edildi). `default_push_enabled` değişmedi,
yalnız teslim bayrağı çevrildi. **Bekçi ters yöndeydi:** `NotificationMatrixPushTests` dördünün teslim
edilmediğini zorluyordu; iddia tersine çevrildi ve komşu testin bayat docblock'u düzeltildi. Sözleşme
değişmediği için arayüzde "henüz teslim edilmiyor" rozeti kendiliğinden düşecek.

### `TB-170` · Davet kabulündeki "Duyuru bildirimleri" ve "Fotoğraf kullanım izni" anahtarları hiçbir şeye bağlı değil 🟡

Altınay saha testinde (B1.3, müdür davet kabulü, 2026-09-15) soruldu, `oksis-api` @ `60e65caf`
ve `oksis-ui` @ `1bf6a51` üzerinde ölçüldü. Onay adımı iki isteğe bağlı anahtarı **rolden
bağımsız** herkese gösteriyor (`invite-screen.tsx:415-450`, mobil `invite-accept-screen.tsx:180-186`)
ve `buildConsentGrants` bunları rıza kaydına çeviriyor:

| Anahtar | Yazılan kayıt | Okuyan kod |
|---|---|---|
| Duyuru bildirimleri | `ConsentRecord` · `Marketing` | **Yok** |
| Fotoğraf kullanım izni | `ConsentRecord` · `PhotoUsage` | **Yok** |

API'de `ConsentRecords`'u okuyan her yol yalnız `DataProcessing`'e bakıyor (`ConsentGate`,
giriş akışı) ya da kaydı listeliyor (`GetMyConsents`/`GetPersonConsents`). Sonuç:

- **Duyuru anahtarı kapatılsa da duyuru bildirimi düşer.** Duyurunun teslimatı rızaya değil
  bildirim zincirine bağlı; kişi bazlı tercihin gerçek yeri `NotificationPreference` ve o
  yalnız push için, yalnız `PushEventKeyMap` anahtarlarında okunuyor
  (`PushNotificationChannel.cs:172`) — `ANNOUNCEMENT` eşlemede yok, duyuru bugün yalnız in-app.
- **Eşleme anlamca yanlış.** `Marketing` ticari elektronik ileti rızasıdır; kurumsal duyuru
  rıza konusu değil tercih konusudur. İstemci kodunun kendi yorumu da "ayrı rıza tipi yok, en
  yakını budur" diyor (`packages/core/src/invitations/logic.ts:254`).
- **Açıklama olmayan kanal vaat ediyor:** "e-posta/SMS bildirimleri" — SMS kanalı yok (`E-23`).
- **Fotoğraf rızası ölü veri.** "Hayır" kayda geçiyor ama ürünün hiçbir yüzeyi ona bakmıyor;
  öğrenci için rızayı kimin vereceği (veli) de tanımlı değil.

`TB-43`/`TB-44`'ün kapattığı sahte toggle sınıfının davet ekranındaki hâli.
✅ **Karar (2026-09-15, kullanıcı):** iki anahtar da davetten **kaldırılır**. Bir rıza tipi
ancak onu okuyan bir tüketiciyle birlikte geri gelir.

🔄 **Kodda kaldırıldı, commit bekliyor:** `oksis-ui` dalı `fix/davet-olu-riza-anahtarlari`.
`buildConsentGrants` yalnız `DataProcessing` gönderiyor; web `invite-screen.tsx` ve mobil
`invite-accept-screen.tsx` iki satırı kaybetti, `preference-row.tsx` silindi, şemalar ve iki dilin
sözlüğü temizlendi, 2. adım başlığı "Onaylar". Web + core + mobil typecheck, üç lint ve core
testleri (551) geçti. Backend'e dokunulmadı (`ConsentType` enum'u rıza kaydının sözleşmesi olarak
kalır). Kapanış: merge + Altınay B6.3 öğretmen davetinde ekranda ölçüm.

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

---

### `B-53` · Kullanıcı Oluştur ekranı rol sormuyordu; her hesap sessizce Yönetici doğuyordu 🟠

**Belirti (kullanıcı, 2026-09-20):** *"Kullanıcı Oluşturma ekranında Rol sorulmuyor ve
oluşturulan kullanıcı otomatik Yönetici olarak oluşturuluyor."*

**Kök neden — sunucu kusursuzdu, kural ekranda kayboluyordu.** `POST /api/v1/users` rolü
zaten gövdede alıyor ve `PersonUserCreationService` dört rolü (SchoolAdmin/Teacher/Parent/
Student) hedef sistem rolüne + minimal profile haritalıyor. Ekran tarafında ise
`packages/core/src/users/constants.ts` içinde `CREATE_USER_ROLE = "SchoolAdmin"` **sabit**
yazılıydı ve form şemasında rol alanı hiç yoktu — hangi hesap davet edilirse edilsin istek
`SchoolAdmin` gönderiyordu. Ekranın kendi notu bunu "bu ekrandan yalnız yönetici davet edilir"
diye bir tasarım kararı gibi anlatıyordu; kullanıcı için bu bir kısıt değil, **sessiz yetki
yükseltmesiydi**: öğretmen davet ettiğini sanan yönetici, okulun tamamına yetkili bir hesap
açıyordu.

- ✅ **KAPANDI** *(`oksis-ui`, 2026-09-20)*: rol seçici zorunlu alan olarak eklendi,
  **varsayılanı yok** (varsayılan vermek aynı kusurun tıklamayla atlanabilen hâli olurdu).
  Liste keyfi değil, sunucunun gerçekten kurabildiği dört rol; Sekreter/Muhasebe bilinçli
  olarak yok çünkü `SystemRole` seed'inde de yok (MVP 5 rol seti) — ekrana koymak sunucunun
  reddedeceği seçenek sunmak olurdu. Öğretmen/veli/öğrenci seçilince hesabın hangi eksikle
  doğacağı (branşsız / çocuk bağı yok / kaydı yok) ekranda yazıyor. Mock uç de artık rolü
  gövdeden okuyor; sabit `SchoolAdmin` yazması, ekranın seçimi göndermeyi unutmasını mock'lu
  koşumda görünmez kılıyordu.
- ✅ **Canlı uçta ölçüldü** *(Altınay, `mudur` hesabı)*: ekrandan **Öğretmen** seçilerek davet
  gönderildi; veritabanında kişi `TEACHER` sistem rolü + `Teacher` profiliyle doğdu (önceki
  iki hesap `SCHOOL_ADMIN`). Bulgu bu koşumla kapandı.

---

### `TB-164` · Ölü SQL seed'i okul-bağlı bir süper yönetici vadediyor ⚪

`K-27` ön kazımasında ölçüldü (2026-09-15, `oksis-api` @ `4fb82833`;
[[super-admin-izleri-envanteri]] §2.2). `infra/scripts/identity-dev-seed.sql` var olmayan
`users` tablosuna (`OksisDbContextModelSnapshot`'ta sıfır geçiş) `school_id = @SchoolId` ile
`superadmin@oksis.local` yazıyor — süper yöneticinin **bir okulun kullanıcısı** olduğu eski
tanımın en saf hâli. Dosya başlığı "tercih edilen yol `IdentityDevSeeder`" diyor; o seeder
ise süper yönetici hesabı hiç üretmiyor (başlığı: müdür, müdür yardımcısı, öğretmen,
öğrenci, veli). Buna rağmen `Program.cs:305` ve `DependencyInjection.cs:464` yorumları
hâlâ "1 SuperAdmin + 2 SchoolAdmin + …" vadediyor.

Zarar: yeni gelen "süper yönetici seed'i var" sanıp bulamıyor ya da SQL dosyasını
çalıştırıp tablo-yok hatasıyla karşılaşıyor.

⬜ SQL dosyası silinir, iki yorum `IdentityDevSeeder`'ın gerçek kadrosuna göre düzeltilir.
`K-27 (a)` uygulamasında platform hesabının dev seed'i ayrıca tasarlanır.

✅ **2026-09-16 · kapandı (gece turu, commit bekliyor).** `infra/scripts/identity-dev-seed.sql` silindi;
`Program.cs` ve `DependencyInjection.cs` yorumları `IdentityDevSeeder`'ın gerçek kadrosuna göre yazıldı
(okul başına müdür + müdür yardımcısı, 15 öğretmen — 5'i aynı zamanda veli —, 60 öğrenci, 50 veli; süper
yönetici ya da platform hesabı **seed edilmez**). Belgedeki atıflar da düzeltildi
(`teknik/ortamlar/seed-runbook.md`). Kalan iki atıf tarihsel kayıt niteliğinde
(`super-admin-izleri-envanteri`, `gecici/planlar/2026-09-15-…`), dokunulmadı.

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

### `TB-239` · Seçmeli ders havuzunun tamamı şubenin zorunlu haftalık yükü sayılıyor 🟠

Altınay B4.2 yeniden ölçümünde çıktı (2026-09-22). Okulun kilitli müfredatı (TTK 2025/05
Anadolu Lisesi, 4 kademe) çizelgedeki **her seçmeli dersi MEB varsayılan saatiyle** taşıyor.
Ölçülen değerler şöyle:

| Kademe | Ortak | Seçmeli satır | Snapshot toplamı | `required-total` (canlı) |
|---|---|---|---|---|
| 9 | 12 ders · 32 saat | 20 | 57 | **57** |
| 10 | 12 · 33 | 27 | 65 | **65** |
| 11 | 7 · 19 | 41 | 91 | **91** |
| 12 | 5 · 15 | 37 | 86 | **86** |

`Y-03` ölçümüne göre çizelgede seçilecek saat 9'da 7, 10'da 6, 11'de 20, 12'de 24. Yani
şubenin gerçek yükü **her kademede 39 saat** olmalı. Ürün 57–91 arası diyor.

Toplamı okuyan iki yer var:
- `RequiredHoursResolver` → `GET curriculum-hours/required-total`. Bugün çağıranı yok
  (`TB-236`), yani kusur ekranda henüz görünmüyor.
- `CurriculumWeeklyHourProvider`, yani **ders programı üreticisinin tek saat kaynağı**
  (`K-10`). Yalnız saati 0 olan satırı eliyor. Böylece her 9. sınıf şubesi için 20 seçmeli
  dersin hepsi talep olarak üretilir: 57 saatlik bir hafta. `B9.4` bu hâliyle üretilemez.

Okulun elinde çıkış yolu yok. Saat 0 kararı ("bu yıl okutulmuyor") yalnız `Setup`
sezonda yazılabiliyor (`SessionCurriculum.ResolveForWriteAsync`). Altınay'ın sezonu
2026-09-22'de 18:53:44'te açılıp 18:54:34'te aktifleştirildi, yani hazırlıkta 50 saniye
kaldı; snapshot kilitli. Hazırlıkta kalınsaydı bile okul kademe başına 20–40 seçmeliyi
tek tek sıfırlamak zorunda kalırdı. Varsayılan yön ters: çizelge seçmelileri **seçenek**
olarak sayıyor, ürün **zorunlu** sayıyor.

Sınıf: `TB-234` ile aynı. Kilitli snapshot'ı düzeltmenin ürün içi yolu yok.

⬜ Karar gerekiyor. (a) Seçmeli satırlar snapshot'a 0 saatle girer ve okul hazırlıkta
okutacaklarını açar. (b) Seçmeliler "okulun sunduğu havuz" olarak ayrı tutulur, şubeye
atanınca yüke girer (Y-03'ün şube alanıyla birlikte). (c) Toplam, ortak ders + çizelgenin
seçmeli kotası olarak hesaplanır, havuz ayrıca tutulur. Hangisi seçilirse seçilsin,
**Altınay'ın kilitli snapshot'ı için ayrıca bir yol** gerekir (backfill ya da aktif sezonda
seçmeli saatini düzenleme).

➕ **Üretimle ölçüldü — B9.4'ün engeli bu (2026-09-23).** 9-A için otomatik üretim uygulanmadan
çalıştırıldı (`POST timetable/auto-generate`, tek şube): iş `Done`, 3 aday, önerilen aday "skor 96,
eksik 5 saat". Hafta 40 ders saati (5 gün × 8, zil çizelgesi). Müfredatın 9. sınıf talebi 57 saat
(32 ortak + 25 seçmeli). Üretici seçmelilerden **15 saat** yerleştirdi, **ortak derslerden 7 saati
dışarıda bıraktı**: Birinci Yabancı Dil 4/0, Görsel Sanatlar/Müzik 2/0, Matematik 6/5. Yani program
ortak dersi eksik, seçmeliyi fazla veren bir hafta; okul için kullanılamaz. MEB'e göre gerçek yük
32 + 7 = 39 saat ve 40 saate sığıyor — engel yalnız bu kusur. Karar hâlâ bekliyor; ders programı
turu (B9.4) bu karar uygulanmadan ilerleyemez.
### `TB-240` · Anadolu Lisesi'nin dört ortak dersi branşsız; atama alan dışı sayılıyor 🟠

Altınay B4.3 ölçümünde çıktı (2026-09-22). `TB-238`'in "ayrı kalan" notuna ID verildi.
Anadolu Lisesi çizelgesinde **15 ortak dersin 4'ünün**, **45 seçmelinin 12'sinin**
`master.subject_branches`'te hiç bağı yok:

- Ortak: **Birinci Yabancı Dil**, **Görsel Sanatlar/Müzik**, **T.C. İnkılap Tarihi ve
  Atatürkçülük**, **Beden Eğitimi ve Spor/Görsel Sanatlar/Müzik**
- Seçmeli: Seçmeli Birinci / İkinci Yabancı Dil, Kur'an-ı Kerim (+ Anlam Dünyası),
  Peygamberimizin Hayatı, Temel Dinî Bilgiler, Klasik Ahlak Metinleri, Adabımuaşeret,
  Proje Tasarımı ve Uygulamaları, Sanat Eğitimi, Spor Eğitimi, Hedef Temelli Destek Eğitimi

Sebep ad eşleştirmesi: çizelge genel ad ("Birinci Yabancı Dil") ve birleşik hücre
("Görsel Sanatlar/Müzik") kullanıyor, öğretmenlik alanları kararı somut adlar ("İngilizce",
"Müzik", "Görsel Sanatlar") sayıyor. Branşların kendisi okulda var: Altınay'da 110 branş,
İngilizce, Almanca, Müzik, Görsel Sanatlar, Tarih ve Rehberlik dahil.

Zarar: `LoadSubjectBranchesAsync` bağsız dersi boş kümeyle döndürüyor. Bu yüzden İngilizce
öğretmeni "Birinci Yabancı Dil"e, tarih öğretmeni İnkılap Tarihi'ne atanırken
`SubjectBranchMatch` **OutOfField** diyor ve her atama gerekçe istiyor. Vekâlet önerisi de
(`GetAvailableSubstitutes`) aynı dersler için alan içi aday bulamıyor. Engel değil ama her
okulun her dil ve sanat dersinde yanlış uyarı üretir.

⬜ Kapatma yolu: çizelge adı → karar adı eşleme tablosu (genel ad → somut diller, birleşik
hücre → bileşen branşlar) içe aktarmada uygulanır. Karar gerekir: birleşik hücre
"Görsel Sanatlar/Müzik" tek ders mi kalır, yoksa iki branşa birden mi bağlanır?

➕ **2026-09-23 · okul tarafı çıkış yolu açıldı:** okul artık MEB eşleşmesinin üstüne kalıcı branş–ders
kuralı ekleyebiliyor (*Ayarlar › Akademik Yapı › Branş–Ders Uygunluğu*, yalnız SchoolAdmin;
`oksis-api` `d9cbc041`/`52aae106`, `oksis-ui` `a745c33`). Altınay'da ekranda ölçüldü: İngilizce →
Birinci Yabancı Dil kuralı eklenince Bahadır Baba'nın görevi "Uyumlu"ya döndü, geri alınınca yeniden
alan dışı oldu (kural geri alındı, veri test öncesi hâlinde). **Kök neden (platform içe aktarımında ad
eşleşmesi) açık kalıyor** — madde bu yüzden kapanmıyor.
### `TB-241` · Katalog ders adlarında kesme işaretinden sonra büyük harf: "Kur’An-I Kerim" ⚪

Altınay B4.2 ölçümünde görüldü (2026-09-22). `master.subjects`'te iki satır bozuk:
`Kur’An-I Kerim` ve `Kur’An-I Kerim’İn Anlam Dünyası`. Sebep:
`MasterSubjectCode.cs:36` adı `TextInfo.ToTitleCase` ile yeniden yazıyor. Tipografik
kesme (’) ve kısa çizgi kelime ayırıcı sayılıyor, ekler büyüyor (`-ı` → `-I`, `’in` → `’İn`).
Aynı çağrı `MebProgramIdentity.ToTitleCase`'te de var. Ad, okulun ekranına ve karneye
böyle iner. Branş eşleşmesini de zorlaştırması olası (`TB-240`; eşleşme adla yapılıyor).

⬜ Kapatma yolu: kesme işareti ve kısa çizgiden sonra gelen eki küçük bırakan bir başlık
dönüştürücü; mevcut iki satır için düzeltme.

### `D-24` · Davet ekranı okulun resmî adını gösteriyor, görünen adını değil ⚪

Altınay B6 turunda görüldü (2026-09-23). Davet önizlemesinde "Okul" satırı **"Altınay Eğitim
Kurumları"** diyor (`School.Name`). Okulun kendi paneli, sidebar ve künye ise görünen adı
**"Özel Altınay Anadolu Lisesi"** kullanıyor. `GetInvitationByTokenQueryHandler` ayarlardaki
`DisplayName`'i okumuyor. Aynı kurum adı altında iki okul olan Altınay'da davetli, hangi okula
katıldığını bu satırdan ayırt edemiyor (`ALTINAY-SBL` da "Altınay Eğitim Kurumları").

⬜ Kapatma yolu: önizleme görünen adı döner (boşsa resmî ada düşer). Logo sorgusu aynı
ayar satırını zaten okuyor.

### `B-56` · Kayıt sihirbazında "Nakil Gelen" kaydı hiç yapılamıyordu 🔴

Altınay B7 turunda ölçüldü (2026-09-23). Ekran kayıt türünü `"Transfer"` gönderiyordu, backend
enum'u ise `EnrollmentType.TransferIn`. Gövde çözümlemesinde 400 dönüyordu (`$.type` çevrilemedi),
yani ekrandan yapılan **hiçbir nakil kaydı** sunucuya ulaşmıyordu. Canlı istekle ölçüldü.

✅ **Kapandı (2026-09-23, commit bekliyor).** `packages/api/src/students/endpoints.ts` eşlemesi
`TransferIn` oldu; gövde testi kilitliyor. Altınay'da 5 nakil kaydı ekrandan yapıldı, geldiği okul
yazıldı.

### `B-57` · Kayıt sihirbazı öğrenci e-postası sormuyor; gövdeye sabit `null` gidiyordu 🟠

Altınay B7 (2026-09-23). `EnrollStudentCommand.Email` backend'de vardı ve kişiye yazılıyordu;
ekranda alan yoktu ve istemci `email: null` gönderiyordu. Öğrenci yalnız öğrenci numarasıyla
giriş yapabiliyordu.

✅ **Kapandı (2026-09-23, commit bekliyor).** 2. adımda isteğe bağlı *E-posta* alanı (biçim
denetimi `isValidOptionalEmail`, sunucu da `Email.Create` ile denetliyor), özette görünüyor,
gövdeye gidiyor. 85 öğrenci `ad.soyad@altinay.test` ile kaydedildi ve bu adresle giriş yaptı.

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

### `B-58` · Kayıt sihirbazıyla eklenen veliler hiç davet alamıyordu 🔴

Altınay B7 (2026-09-23). Ekran "Davetli" gösterdi ama Mailpit'e e-posta gelmedi, davet tablosunda
satır yoktu. API günlüğü: `Veli daveti oluşturulamadı … USERS_INVITATION_PERSON_INVALID_STATE`.
Kök neden: `EnrollStudentCommandHandler` yeni veliyi `Activate()` ile **Active** doğuruyordu;
`InvitationCreationHelper` yalnız `Draft/Invited/Suspended` kişiyi davet edebiliyor. Sonuç:
sihirbazla kaydedilen **hiçbir veli** davet almıyor, hesap açamıyor, velinin uygulaması hiç
kullanılamıyordu. Kabul akışı da (`person.Activate()` yalnız Draft/Invited'dan) aynı veliyi
kabul edemezdi.

✅ **Kapandı (2026-09-23, commit bekliyor).** Yeni veli Draft doğuyor, davet `Invited`'e, kabul
`Active`'e taşıyor (Kullanıcılar modülüyle aynı yaşam döngüsü). Entegrasyon testi gerçek SQL'de
zinciri kilitliyor (`Enroll_creates_new_guardian_as_draft_so_it_can_be_invited`).
Altınay'da ilk öğrencinin eski hatayla Active doğan iki velisi SQL ile Draft'a çekilip ürünün
davet ucuyla davet edildi. Sonrasında **135 velinin 135'i** davet aldı ve Mailpit'teki
bağlantıdan kabul etti.
⬜ Başka okullarda eski hatayla Active doğmuş hesapsız veliler varsa onarım gerekir (seed okulları
ölçülmedi).

### `B-59` · Kişi aramasında ad-soyad birlikte yazılınca sonuç boş dönüyordu 🟠

Altınay B7 (2026-09-23). Kardeş kaydında velinin tam adıyla ("Ad Soyad") arama yapılınca veli bulunamadı.
`ListPersonsQueryHandler` adı ve soyadı **ayrı ayrı** eşliyordu: yalnız ad ya da yalnız soyad buluyor,
tam ad hiçbir kolonda geçmediği için boş dönüyordu. Bu uç Kullanıcılar, Öğrenciler,
Veliler listelerini ve sihirbazın veli havuzunu besliyor; yani ad-soyadla her arama boştu.
Veli adıyla öğrenci bulma alt sorgusu da aynı kusuru taşıyordu.

✅ **Kapandı (2026-09-23, commit bekliyor).** Birleşik ad eşlemesi eklendi (iki yerde); gerçek
SQL entegrasyon testi (`Search_MatchesFullName_AndParentFullName_OnRealSqlServerAsync`).
Altı kardeş ailesinin ikinci çocuğu mevcut veliye aramayla bağlandı.

### `B-60` · Kayıt sihirbazında "Anneanne" ve "Babaanne" seçilince kayıt 400 alıyordu 🟠

Altınay B7 (2026-09-23). Sihirbaz iki seçeneği `Grandparent` diye gönderiyordu. Backend
`RelationType` enum'unda bu üye yok (Mother/Father/Guardian/Other, DB CHECK kısıtı da bu dördü).
Gövde çözümlemesi 400 veriyordu. Veliler modülü aynı konuyu zaten karara bağlamıştı:
"Grandparent gerçek değil, Other'a katlanır" (`parents/constants.ts`).

✅ **Kapandı (2026-09-23, commit bekliyor).** İki seçenek `Other`'a gidiyor; her seçeneğin gerçek
bir backend üyesine eşlendiğini kilitleyen test (`students/constants.test.ts`).
⚪ Not: büyükanne "Diğer" olarak saklanıyor; ayrım gerekirse enum + göç gerekir (karar).

### `B-61` · İlk girişte zorunlu parola değişimi yer tutucuydu: parola değişmiyor, herkes yönetici paneline gidiyordu 🔴

Altınay B7 (2026-09-23). Giriş ekranındaki `ForcePasswordView` hiçbir uç çağırmıyordu:
`window.setTimeout(onDone, 800)`. Sonra `setRedirectRole("admin")` ile herkesi yönetici rotasına
yönlendiriyordu. Etkisi: kayıtla açılan her öğrenci hesabı geçici parolada kalıyor, her girişte
aynı ekranı görüyor ve parolasını değiştirdiğini sanıyor; üstelik öğrenci yönetici paneline
yönleniyordu. Backend ucu (`POST /auth/account/change-password`) hazırdı ve bağlanmamıştı.

✅ **Kapandı (2026-09-23, commit bekliyor).** Görünüm uca bağlandı (`changeAccountPassword`,
`useChangeAccountPassword`); sunucu refresh token'ları iptal ettiği için yeni parolayla yeniden
giriş yapılıyor ve yönlendirme o girişin gerçek profilinden çözülüyor; hata bandı eklendi.
Canlı ölçüm: yeni parolayla giriş `requirePasswordChange=false`, profil `Student`; eski geçici
parola `invalid-credentials`.

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

### `B-63` · Sihirbazdaki "Birincil veli mi?" seçimi sunucuya gitmiyor 🟠

Altınay B7 (2026-09-23). Veli adımında iki ayrı kavram var: *Birincil veli mi? (Evet/Hayır)* ve
yetki olarak *Birincil İletişim*. `toGuardianInput` yalnız yetkiyi (`isPrimaryContact`)
gönderiyor; "Birincil veli" seçimi yalnız ekranda yaşıyor (rozet ve özet). Sonuç ölçüldü: 85
öğrencinin **33'ünde** birincil iletişim ya **0** ya **2** (21 kayıtta Birincil seçilen veli
yetkiyi taşımıyor, 26 kayıtta iki velinin ikisi de taşıyor). Listedeki "birincil veli" sütunu bu
yetkiden besleniyor.

⬜ Kapatma yolu: iki kavram birleşir. "Birincil veli" seçimi `isPrimaryContact`'i belirler ve
öğrenci başına tekillik sunucuda uygulanır. Ya da biri kaldırılır (karar).

### `D-25` · Öğrencinin ilk girişi "KVKK onayınız geri çekilmiş, yönetime başvurun" diyor 🟡

Altınay B7 (2026-09-23). Kayıt komutu öğrenci için rıza kaydı açmıyor. Öğrenci ilk girişte
rıza ekranına düşüyor ve ekran *"onay geri çekilmiş ya da metin güncellenmiş; okul yönetimine
başvurun"* diyor. Oysa öğrenci hiç onay vermedi ve aynı ekrandaki *"Okudum, kabul ediyorum"*
düğmesi sorunu kendisi çözüyor; 85 öğrencinin hepsi bu yoldan geçti.
Ürün sorusu da var: reşit olmayan öğrencinin KVKK rızasını kim verir (veli mi, öğrenci mi)?

⬜ Kapatma yolu: ilk onay ile geri çekilmiş onay ayrı metinle anlatılır; rızanın sahibi kararı.

### `B-64` · Görevlendirmeler: hiçbir ders seçmeli değil — "Seçmeli" süzgeci hep boş, seçmeliler "Zorunlu" rozetiyle 🟠

Altınay B9.2 genel kontrolü (2026-09-23). *Derslere göre* görünümde 65 dersin **hepsi**
"ZORUNLU" grubunda; *Seçmeli Birinci Yabancı Dil*, *Kur'an-ı Kerim*, *Proje Tasarımı ve
Uygulamaları* gibi seçmeliler de "Zorunlu" rozeti taşıyor ve *Seçmeli* süzgeci boş dönüyor.
Ölçüm: `school.subjects.is_elective` Altınay'ın 67 dersinin hepsinde 0, `master.subjects`'te de
0. MEB kaynaklı katalog seçmeliliği dersin kendisine değil **çizelge satırına** yazıyor
(`curriculum_entries.course_type` Common/Elective; `TB-211` gereği aynı ders bir sınıfta ortak,
başka sınıfta seçmeli olabiliyor). Görevlendirme uçları (`assignments/courses`, `by-teacher`)
ise dersin `IsElective` bayrağını okuyor.

⬜ Kapatma yolu: ortak/seçmeli bilgisi sezonun müfredatından türetilir (kademeye göre; iki türde
de geçen ders ikisini de gösterir). Dersin `IsElective` bayrağı MEB kataloğunda anlamını
yitirdi — kaldırılması ya da türetilmesi kararı.

✅ **Kapandı — 2026-09-23 (kullanıcı onayı, B yolu; commit bekliyor).**
- **Tek çözücü** `SessionCourseTypes` (Application › Curriculum): sezonun müfredat satırlarından
  (`SessionCurriculum.LoadItemsAsync` — hazırlıkta taslak, başlamış sezonda snapshot) ve satırın
  kaynak çizelge türünden ders başına **Common / Elective / Both** üretir. Saati 0 olan satır da
  türünü taşır. Okulun kataloğunda duran ama sezonun müfredatında olmayan MEB dersi türünü
  **yayımlanmış** çizelgelerin tamamından alır (ortak çeviri yardımcısıyla, `TB-191`). Yalnız
  okulun kendi eklediği ders dersin bayrağına düşer.
- **Sözleşme:** görevlendirme DTO'larında `bool IsElective` → `string CourseType`
  (`CourseCoverageDto`, `CourseAssignmentsDto`, `TaughtCourseCardDto`); `SubjectDto`'ya
  `CourseType` eklendi. Aday listesinin alt satırı da çözücüden ("Zorunlu + Seçmeli" dahil).
- **Ekran:** Görevlendirmeler'de gruplama/rozet/süzgeç `courseType` okuyor. "İkisi" olan ders
  ayrı grupta ve **iki süzgeçte de** görünüyor. Ders Kataloğu'nda rozet türden geliyor; çekirdek
  derste kilitli anahtar yerine salt okunur tür rozeti (kullanıcı kararı: anahtar yalnız okulun
  kendi dersinde; domain kilidi `Subject.MasterSourced.Immutable` zaten vardı).
- **Ölçüm (Altınay, canlı):** 65 ders → 48 seçmeli, 17 ortak (önce 65'i de "Zorunlu"). "Seçmeli"
  süzgeci 48, "Zorunlu" 17 getiriyor. İngilizce öğretmeninin kartları "Birinci Yabancı Dil · Zorunlu",
  "Seçmeli Birinci Yabancı Dil · Seçmeli". Katalogda 48 "Seçmeli" rozeti.
- **Testler:** `SessionCourseTypesTests` 4 senaryo (ortak/seçmeli/ikisi, saat 0, kendi ders
  bayrağı, müfredat dışı MEB dersi yayımlanmış çizelgeden; taslak sürüm yok sayılır). Core
  `logic.test.ts` (gruplama, "ikisi" iki süzgeçte). Birim takımlarının tamamı ve bekçiler 53/53
  yeşil. `SubjectTeacherAssignmentTests`'in 17 kırmızısı HEAD'de de aynı 17 (ayrı çalışma
  kopyasında ölçüldü) — `TB-231` ailesi, bu değişiklikten değil.
➕ Mimari bekçi (`SubjectCatalogTranslationTests`) ilk sürümü yakaladı: çizelge satırı kimliğiyle
okuma çevirisiz görünüyordu. İkinci kaynak eklenince dosya ortak çeviri yardımcısını kullanır hâle
geldi ve muafiyet gerekmedi.

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

### `D-26` · "Görevi kapat (devret)" onay istemiyor ve gerekçeyi sabit metinle yazıyor 🟡

Altınay B9.2 (2026-09-23). Satır menüsündeki kırmızı *Görevi kapat (devret)* tek tıkla
çalışıyor: onay penceresi yok, kapatma gerekçesi her zaman sabit metin (*"Yıl içi kapatıldı —
görev devredilebilir."*). Kapatılan görev iz kaydına düşüyor ve geri açma yolu yok. Yanlış
satıra basan idareci görevi geri alamıyor, iz kaydında da gerçek sebep yazmıyor.

⬜ Kapatma yolu: onay penceresi + gerekçe alanı (sabit metin öneri olarak kalabilir).

### `D-27` · Görevlendirme çekmecesi kayıt hatasında kapanıyor, hata başarı bildirimi gibi görünüyor 🟡

Altınay B9.2 kod kontrolü (2026-09-23). `drawer.tsx` `save()` hata kolunda `onSaved(mutationErrorDesc(err))`
çağırıyor. Sayfa bu çağrıda çekmeceyi kapatıp mesajı başarı bildirimiyle aynı yerde gösteriyor.
Kullanıcı seçimini ve yazdığı gerekçeyi kaybediyor, hatayı başarı sanabiliyor.
Kardeşi `CopyModal`: hata kolu sunucunun gerekçesini yutup sabit *"Kopyalama başarısız oldu."*
yazıyor (`X-01` kalıbı).

⬜ Kapatma yolu: hata çekmecenin içinde gösterilir, çekmece açık kalır; kopyalamada sunucu cümlesi
geçirilir.

### `D-28` · Arşiv sezonda Görevlendirmeler'de satır menüsü tamamen gizleniyor ⚪

Altınay B9.2 kod kontrolü (2026-09-23). `detail.tsx`'te `RowMenu` bütünüyle `h.canWrite` koşuluna
bağlı. Arşiv sezonda salt-okur ekranda yalnız *Görevi kapat* değil, **gezinme** öğeleri de
(*Öğretmen profilini aç*, *Dersi aç*) kayboluyor. Okuma yetkisi olan kullanıcı eksenler arası
geçiş yapamıyor.

⬜ Kapatma yolu: yalnız yazma öğesi koşula bağlanır.

### `TB-244` · Logosu olmayan okulda her sayfa açılışında logo ucu 404 dönüyor ⚪

Altınay B7–B9 turlarında her sayfada ölçüldü (2026-09-23): `GET /api/v1/public/schools/{id}/logo` →
404, konsolda *Failed to load resource*. Altınay'ın logosu yok; istemci logonun varlığını
bilmeden isteği atıyor. Zararsız ama gerçek hataları konsolda gürültüye gömüyor (B7 turunda
403'ler ayıklanırken bu satır da her seferinde çıktı).

⬜ Kapatma yolu: okul ayarı logo yokken URL üretmez (istemci yer tutucuya düşer) ya da uç 204
döner.

### `B-66` · Ders programı üretimi öğretmensiz dersi talepten sessizce düşürüyor; "eksik saat" göstergesi yanıltıcı 🟠

Altınay B9.4 ölçümü (2026-09-23). 9-A için otomatik üretimde önerilen aday "eksik **5** saat, skor 96,
Önerilen" diyor; `hints` ve `failureReason` boş. Müfredatla karşılaştırınca gerçek eksik **17** saat:
göstergeye yalnız görevlendirmesi olan derslerin açığı giriyor. Görevlendirmesi olmayan dokuz ders
(9. sınıfta 12 saat; aralarında **ortak** ders Görsel Sanatlar/Müzik) talebe hiç girmiyor, yani
programda yokluğu hiçbir yerde söylenmiyor. İdareci "5 saat eksik" görüp uygulayabilir; ortak bir
dersin haftada hiç okutulmadığı ancak derslik/öğrenci şikâyetiyle fark edilir.

⬜ Kapatma yolu: öğretmensiz ders talepte kalır ve "yerleştirilemedi — öğretmen atanmamış" olarak
ayrı raporlanır. Gösterge müfredata karşı toplam açığı verir. Ortak derste öğretmen yoksa aday
"önerilen" olarak işaretlenmez ya da üretim başlamadan ön denetim uyarır.

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

### `E-30` · Öğrencinin pansiyon (yatılı) durumu üründe tutulmuyor 🟡

Altınay B7 (2026-09-23). e-Okul listesinde 12/A'daki bir öğrenci **Yatılı** işaretli. OKSİS'te
bu bilginin karşılığı yok: sihirbazda alan yok, öğrenci profilinde ve kayıtta kolon yok, kodda
"pansiyon/yatılı/boarding" kavramı hiç geçmiyor. Öğrenci pansiyon bilgisi olmadan kaydedildi.

⬜ Karar gerekiyor: kapsam içi mi? İçindeyse öğrenci kaydında (sezonluk) bir alan olur; yoklama,
nöbet ve veli bildirimleri ileride bunu okuyabilir.

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

### `TB-238` · Öğretmenlik alanları ayrıştırıcısı bir sayfayı sessizce düşürüyor, bir adı ikiye bölüyor 🔴

`TB-237` kapandıktan sonra kullanıcı sordu: *"bu branşa sahip öğretmenlerin hangi derslere
girebileceği bilgisi PDF'de var mıydı?"* Var — kararın dördüncü sütunu tam olarak o. Ama
kontrol edilince okulun **çekirdek dersi "Türk Dili ve Edebiyatı" branşsızdı**; sebebi
aranınca ayrıştırıcıda iki ayrı kusur çıktı.

**Kusur 1 · Mükerrer sütun çizgisi bütün sayfayı düşürüyor.** `ColumnsOf` dikey çizgileri
0,1'e yuvarlayıp `Distinct()` ediyor ve sütunları **sıraya göre** okuyor (`xs[1..3]`).

```
s42/43/45 :  43,3 · 75,7 · 176,4 · 367,7 · 367,8 · 578,6        → 6 değer, doğru
s44       :  43,3 · 75,7 · 176,2 · 176,4 · 367,7 · 367,8 · 578,6 → 7 değer, hepsi kayıyor
```

Aynı sınır 0,2 punto kayma ile iki kez çizilmiş. Ders sütununun solu `367,7` yerine `176,4`
okunuyor, satırlar çözülemiyor ve **sayfanın tamamı düşüyor**. Hata yok, uyarı yok — belge
bütün hâlde ayrıştırılınca öteki sayfalar iş gördüğü için sonuç "0 uyarı" görünüyor.
[[eksik-ekran-eksik-yetkiyi-gizler]] ile aynı sınıf: sessiz eksik.

Kayıp: 49 sayfanın 1'i (s44) ve içindeki dört alan — **Türkçe (83), Türk Dili ve Edebiyatı
(84)**, Uçak Elektroniği, Uçak Bakım.

**Kusur 2 · Hücre içi ayraç satırı ikiye bölüyor.** Satır ayıracı sütun başına ayrı parçalar
hâlinde çiziliyor. s14'te `y=485,4`'teki çizgi yalnız program ve ders sütunlarını kat ediyor,
ALAN sütununda parçası yok — yani satır sınırı değil, hücre içi ayraç. `BandsOf` ayrım
yapmadığı için "Din Kültürü ve Ahlâk Bilgisi" satırı ortadan kesiliyordu:

- katalogda **"Bilgisi"** adlı çöp branş açılıyor (15 ders bağıyla),
- gerçek branş **"Din Kültürü ve Ahlâk"** diye eksik adla açılıyor.

**Neden fixture yakalamadı:** golden dosya 2014 kararıydı; iki düzen de yalnız 2025
belgesinde var. `TB-226`'nın haber verdiği risk sınıfı, bu kez öğretmenlik alanları
tarafında gerçekleşti.

✅ **2026-09-22 · kapandı.**
- `ColumnsOf` artık yakın çizgileri **kümeliyor** (2 punto eşik) — yuvarlayıp saymıyor.
  `367,7/367,8` çiftinin gizli kırılganlığı da böylece kapandı; bugüne kadar şans eseri
  doğru yere düşüyordu.
- Bant sınırı olmak için çizginin **ALAN sütununu kat etmesi** şart. Satır ayıracı her zaman
  eder (ad o sütunda yazılı), hücre içi ayraç etmez.
- 2025 kararının s14 + s44'ü golden fixture oldu
  (`ogretmenlik-alanlari-2025-129.words.json`); üç test kuralı kilitliyor.

**Ölçülen sonuç:** 107 → **110 alan**. "Türkçe" 14 ders, "Türk Dili ve Edebiyatı" 16 ders,
"Din Kültürü ve Ahlâk Bilgisi" 16 ders; "Bilgisi" ve kesik "Din Kültürü ve Ahlâk" yok oldu.
2014 fixture'ı bozulmadı (40/40).

⬜ **Canlı veri bayat:** kullanıcı düzeltmeden ÖNCE içe aktardı; `master.branches` hâlâ 107
satır ve içinde "Bilgisi" ile kesik "Din Kültürü ve Ahlâk" var, üç gerçek branş eksik.
Yeniden işlemek eksikleri ekler ama **çöp satırları silmez** — içe aktarma idempotent ekleme
yapar, temizlik yapmaz. Bayat satırların ne olacağı karar ister.

⬜ **Ayrı kalan:** ad eşleştirme kuralları (`TB-240`, bu maddenin dışında). Okulun 24
branşsız dersinin bir kısmı bu kusurdan değil: çizelge birleşik hücre ("Beden Eğitimi ve
Spor/Görsel Sanatlar/Müzik"), seviye öneki ("Hazırlık Sınıfı Matematik") ve genel ad
("Birinci Yabancı Dil") kullanıyor; karar bunları ayrı/düz/somut adlarla sayıyor.

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

⬜ Ders Programı ve Ders Kataloğu yüzeyleri yazılırken bu üçü bağlanır. `snapshot`'ın
gerçekten gerekli olup olmadığı ayrıca kararlaştırılır — gereksizse silinmesi, çağrılmayan
uç olarak durmasından iyidir.

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

⬜ Ders Programı ve Ders Kataloğu yüzeyleri yazılırken bu üçü bağlanır. `snapshot`'ın
gerçekten gerekli olup olmadığı ayrıca kararlaştırılır — gereksizse silinmesi, çağrılmayan
uç olarak durmasından iyidir.

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

### `TB-166` · Web MSW mock'u süper yönetici rolünü dört alanda yanlış tanımlıyor ⚪

`oksis-ui/apps/web/mocks/permissions-handlers.ts:12-31` rolü `code: "SuperAdmin"`,
`displayName: "Kurum Yetkilisi"`, `level: 0`, `portalType: "Super"` diye veriyor. Backend:
`SUPER_ADMIN` / "Süper Admin" / **100** / `Platform` (`SystemRoleSeedData.cs:11`). Dosya
başlığı "portalType değerleri gerçek backend'inkilerle aynı" diyor — değil. "Kurum
Yetkilisi" K5'in adıdır, rolün değil; mock'la geliştiren biri iki kavramı karıştırır.
Seviye 0 ise "en yetkisiz" demek (yüksek = yetkili).

⬜ `K-27 (a)` web kabuğu yazılırken mock backend satırına eşitlenir; o güne kadar en azından
seviye ve kod düzeltilir.

✅ **2026-09-16 · kodda düzeltildi (gece turu, `oksis-ui`, commit bekliyor).** Mock satırı seed'e eşitlendi
(`SUPER_ADMIN` / "Süper Admin" / 100 / `Platform`), başlık yorumu düzeltildi. Eşitleme **gerçek bir kusuru** açığa
çıkardı: `packages/core/src/permissions/constants.ts` `BACKEND_PORTAL_TO_KEY` `Platform` portalını tanımıyordu ve
sessizce "school"a düşürüyordu (`platform: "system"` eklendi, testli). `0019` platform rol modeli gelince satır
yeniden gözden geçirilecek.

### `TB-168` · Sezonsuz okulda pano "Devamsızlık riski yüklenemedi" diyor 🟡

`K-27` ilk dilim senaryosunda ölçüldü (2026-09-15, platformdan açılan okulun müdürü ilk
girişte). `AttendanceRiskCard` (`oksis-ui/apps/web/features/dashboard/attendance-risk-card.tsx:49`)
aktif sezonu okuyan sorgu 404 dönünce ya da dönem kimliği yoksa **hata durumu** çiziyor:
"Devamsızlık riski yüklenemedi · Tekrar dene". Oysa ortada hata yok; okulun henüz sezonu
yok ve bu, platformdan açılan **her** okulun ilk günü. "Tekrar dene" hiçbir zaman başarıya
dönmez. Seed'li okullarda sezon hep olduğu için görünmüyordu (`E-24`'ün "seed gerçek yolu
ölçmüyor" kalıbı).

Aynı ekranın yan kartları doğru davranıyor ("Aktif sezon yok", "Bugün ders günü değil").
Alternatif yol var, müdür sezonu açınca kart düzelir. Bu yüzden 🟡.
Kanıt: `kanit/k27-mudur-ilk-ekran.png`.

⬜ Kapatma yolu: sezon/dönem yokluğu hata değil **boş durum** olarak ayrılsın ("Aktif sezon
yok, sezon açıldığında risk burada görünür"). Kural tek kartın değil, sezona bağlı bütün pano
kartlarının; [[yamalama-kabul-degil]] gereği sezon-yok durumu ortak bir bileşene çekilmeli.

✅ **Karar (2026-09-16, kullanıcı): ortak boş durum bileşeni.** Sezona bağlı bütün yüzeyler tek bir
"sezon yok / kurulumda" bileşenine bağlanacak — pano kartları, topbar seçicisi, mobil başlık ve tatil
ekranı aynı dili konuşacak. Sunucu tarafındaki sözleşme çelişkisi de hizalanacak: aynı kök durum için bir
uç `404`, benzeri `200` + boş DTO dönüyor. **En az dört durum var:** sezon yok · sezon kurulumda (`Setup`)
· sezon aktif ama dönem yok · sezon ve dönem aktif. `TB-173` ve `D-20`'nin "— Sezonu" başlığı bu kararla
kapanır.

✅ **İstemci ayağı uygulandı — 2026-09-16 (commit bekliyor).** Durum tek çözücüde:
`packages/core/src/academic-sessions/season-state.ts` → `resolveSeasonState` (dört durum, testli) + kanca
`useSeasonState`. **`setup` ile `noSeason` ayrımı yalnız sezon listesi ucundan çıkıyor** — `current` ucu `Setup`
sezonu hiç döndürmüyor. Yüzey bileşeni `SeasonStateEmpty`: `EmptyState`i sarıyor, kendi markup'ını yazmıyor, yeni
CSS yok; **"Tekrar dene" asla sunmuyor** (hiçbir zaman başarıya dönmeyecek bir eylemdi), gerçek ağ/500 hatası hâlâ
hata olarak çiziliyor. Bağlanan yüzeyler: devamsızlık riski (asıl bulgu), canlı yoklama, bugünkü devam KPI, not
girişi, sezon geri sayımı, topbar seçicisi, tatil ekranı başlığı, mobil başlık ve bağlam modalı.
Topbar'da üç yeni davranış: **kurulumdaki sezon artık yöneticiye kilitli satır + "Kurulumda" rozetiyle listeleniyor**
(eski "taslak yıl hiç listelenmez" kararı, müdürün sezonu açtığı hâlde "—" görmesinin sebebiydi), seçiciye
"Sezon Aç / Aktifleştir" yolu eklendi (bugüne dek tek giriş panodaki geri sayım kartıydı), durum noktası renk taşıyor.
Ayrıca `seasonHeaderLine` core'dan **silindi** — sezon yokken `null` döndürüyordu, mobil başlık satırının kaybolma
sebebi oydu. core 628 test yeşil (yeni 13), typecheck ve lint 6 pakette temiz.

⬜ **Sunucu hizalaması açık ve sıraya alındı.** Aynı kök durum için **altı farklı sözleşme** ölçüldü: `current` 404,
sezon listesi 200+`[]`, dönem listesi 200+`[]`, `attendance/risk` 404, `grades/summary` 200+boş DTO, `attendance/board`
200+bayrak; ayrıca sınıf listesi `warning` alanı, dosya yükleme 422, kullanıcı/duyuru 409. İstemci artık bu
dağınıklığa **bağışık** (durumu cevabın şeklinden değil sezon verisinden türetiyor), yani hizalama istemciyi
kırmaz. Ölçümden çıkan iki somut kusur ayrı madde oldu: `TB-185`, `TB-186`.

✅ **Sunucu ayağı da kapandı — 2026-09-16 (commit bekliyor).** Ölçüm: `AttendanceTermResolver` dönem
çözemediğinde üç yoklama rapor ucu **404** dönüyordu; not modülünün altı ucu aynı kök durumda **200 + boş**
dönüyor. Üç ucun da "dönem var ama veri yok" hâlinde **zaten** 200 + boş cevabı var, yani boş cevap o uçların
meşru şekli. Hiçbir test 404 beklemiyordu ve istemcide bu uçların **404 kolu yoktu** — 404 doğrudan hata
durumuna düşüyordu, `TB-168`'in "Devamsızlık riski yüklenemedi · Tekrar dene" belirtisi tam olarak buydu.
Üç ucun "dönem yok" dalı boş başarı cevabına çekildi; **kıran değişiklik değil** (yeni şekil yok, alan
kaldırılmadı, yalnız hata dalı tanımlı duruma bağlandı). Yazma yolu 404 olarak **bırakıldı** — dönemsiz yazmak
gerçekten mümkün değil. `SeasonlessReadContractTests` 2 test. `oksis-ui`'de değişiklik gerekmedi.
⬜ Tablodaki iki sözleşme bilerek dokunulmadan kaldı: sınıf listesinin `warning` alanı (zaten 200) ve dosya
yüklemenin 422'si (yazma yolu).

➕ **2026-09-15 · Altınay saha testi, pano kartı envanteri** (`oksis-ui` @ `1bf6a51`, sezonsuz
PLT-DOGRULAMA ve seed `s1` müdürüyle canlı GET): panonun 11 kartından
- **sezondan bağımsız 2:** öğrenci ve öğretmen KPI (`student-stats`/`teacher-stats`, gerçek sıfır),
- **doğru boş durum çizen 4:** sezon geri sayımı ("Aktif sezon yok", `summary-kpis.tsx:75`),
  bugünkü devam ve canlı yoklama (`board` → `isSchoolDay:false`), not girişi (`grades/summary`
  dönem yoksa 200 + boş DTO),
- **yanlış hata çizen 1:** devamsızlık riski (bu madde),
- **sabit örnek veri 4 (`K-09` rozeti):** son etkinlikler, bekleyen işlemler, yaklaşan takvim,
  bugünkü nöbet (`dashboard-static.ts:46/111/155/193`). Nöbet ve bekleyen işlemler için
  gerçek hook'lar var ama kartlara bağlı değil; etkinlik akışı ve takvim için uç yok.

Aynı kök durum (dönem yok) için **sunucu sözleşmesi de ikiye ayrık**: `GetRiskStudentsQueryHandler:36`
`NotFound` (404), `grades/summary` `Success` + boş DTO. İstemcide üç ayrı strateji var (sabit
"—" metni, `isSchoolDay` bayrağı, `termId` yoksa hata dalı). Merkezi bir "sezonsuz" bileşeni ya da
kapısı yok. Topbar ve mobil başlığın aynı eksikliği: `TB-173`.

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

### `TB-173` · Sezonsuz okulda topbar sezon seçicisi "—", mobil başlık satırı hiç yok 🟡

Altınay saha testinde (2026-09-15) müdürün ilk ekranında görüldü, kodla ve sezonsuz
PLT-DOGRULAMA müdürüyle canlı ölçüldü (`academic-sessions/current` **404** `NO_ACTIVE_SESSION`,
`academic-sessions` ve `terms` **200 `[]`**).

| Yüzey | Bugün | Neden |
|---|---|---|
| Web seçici, kapalı | `● 📅 — ⌄` | `season-context-picker.tsx:138` ad zincirinin sonu `"—"`; nokta durum göstermiyor, sabit aksan |
| Web seçici, yıl bölümü | Yalnız başlık, satır yok | Boş liste için metin tanımlı değil |
| Web seçici, dönem bölümü | "Bu yıla ait dönem bulunmuyor." (`:318`) | Yıl yokken "bu yıl" diyor |
| Web seçici, bilgi kutusu | "Tam yetki… hazırlanmakta olan yıl sezon sihirbazından yönetilir." | Sezon var/yok ayrımı yapmıyor; sihirbaza bağlantı yok |
| Mobil başlık | Bağlam satırı **tamamen kayboluyor** | `seasonHeaderLine(null)` → `null`, `app-header.tsx:103` satırı çizmiyor |
| Mobil bağlam modalı | Yıl listesi boş, dönem bölümü gizli | Boş durum metni yok |

Sezonu açma yolu seçicide yok; tek yol panodaki "Sezon geri sayımı" kartına tıklamak
(`summary-kpis.tsx:76` → `/academic-sessions`). Her yeni okulun ilk ekranı → 🟡.
Aynı sınıfın pano ayağı `TB-168`; ikisi aynı merkezi "sezonsuz" kuralıyla kapanmalı
([[yamalama-kabul-degil]]).

⬜ Kapatma yolu: pano ve bağlam seçicisi için ortak sezonsuz durum kararı (ürün kararı bekliyor).

✅ **Karar (2026-09-16, kullanıcı):** `TB-168` ile ortak — sezona bağlı bütün yüzeyler tek bir boş durum
bileşenine bağlanır, dört durum ayrılır (yok · kurulumda · aktif-dönemsiz · aktif). İkisi tek turda kapanacak.

✅ **İstemci ayağı uygulandı — 2026-09-16 (commit bekliyor).** Ayrıntı `TB-168` bloğunda. Bu maddenin tablosundaki
altı yüzeyin hepsi kapandı: seçici kapalı hâli, yıl bölümü boş metni, dönem bölümünün "bu yıl" yanlışı, bilgi
kutusunun durum körlüğü, **mobil başlığın tamamen kaybolması** ve mobil modalın boş durumu. Sezonu açma yolu da
seçiciye eklendi.

➕ **2026-09-16 · ara durum ölçüldü:** Altınay'da sezon açıldı ama `Setup` (henüz aktifleştirilmedi). `academic-sessions/current`
yalnız `Active` sezonu döndürdüğü için topbar seçicisi hâlâ **"—"**; Redis'te `current-session` `NO_ACTIVE_SESSION` önbellekte.
Yani önerilen üç kademeli kurala dördüncü bir durum eklenmeli: **"Sezon kurulumda"** (var, aktifleştirilmemiş) — kullanıcı
az önce sezonu açtığı hâlde ekran "sezon yok" gibi davranıyor.

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

### `D-19` · Zil programı ekranı: boşken "Yeniden Üret", çarpısı stilsiz modal, Enter ile ilerlemiyor 🟡

Altınay saha testi (B2.3, 2026-09-15), `oksis-ui` @ `1bf6a51` üzerinde ölçüldü.

| Gözlem | Bugün | Neden |
|---|---|---|
| Buton metni | Hiç satır yokken de "Çizelgeyi Yeniden Üret"; modal "mevcut **0** satırın üzerine yazar" | `bell-schedule-tab.tsx:354` sabit metin; `:446` 0 satır durumunu ayırmıyor |
| Onay modalı çarpısı | Sol üstte çıplak | `AModal` (`features/settings/parts.tsx:598-650`) yalnız ayarlar ekranına özel; `className="ayr-mx"` (`:583`, `:626`) için **hiç CSS kuralı yok** |
| Enter tuşu | Saat alanlarında hiçbir şey yapmıyor | `bell-schedule-tab.tsx:213-230` `onKeyDown` yok; sayfada `<form>` yok |

Çarpı tek ekranın sorunu değil: uygulamada 25'ten fazla özellik kendi kapatma sınıfını yazmış
(`.snf-mclose`, `.dx`, `.grv-drawer-x`, `.gb-x` …), paylaşılan bir `Dialog` yok. Bileşen envanteri
`ConfirmDialog` ve `FormDialog`'u zaten **⬜ planned** olarak listeliyor (`frontend/bilesenler/_envanter.md:20-21`).
Enter ile hücreden hücreye geçişin tek emsali ekrana gömülü: `grade-grid-screen.tsx:511-554` `onCellKey`.

⬜ Kapatma yolu ([[yamalama-kabul-degil]]): `ConfirmDialog` paylaşılan bileşen olarak yazılır, `AModal`
ona geçer (diğer modallar kademeli); Enter ile ilerleme ortak bir hook'a çekilir (`onCellKey` deseninden);
buton/modal metni satır sayısına göre "Çizelge Oluştur" / "Yeniden Üret" ayrılır.

✅ **2026-09-16 · kodda düzeltildi (gece düzeltme turu, `oksis-ui` `fix/davet-olu-riza-anahtarlari`, commit bekliyor).**
Paylaşılan `Dialog` + `ConfirmDialog` (`apps/web/components/shared/`, `packages/ui/src/styles/dialog.css`); `AModal`
ve `ADrawer` artık `Dialog` sarmalayıcısı (6 çağrı yeri prop değişmeden; çekmece çarpısı da aynı stilsizlikteydi).
Enter ile ilerleme ortak `useGridEnterNav` (`packages/ui/src/hooks/use-grid-enter-nav.ts`: başlangıç → bitiş → sonraki
satır; son hücrede yeni satır açar, Shift+Enter geri). Satır yokken "Çizelge Oluştur" onaysız, varken "Çizelgeyi Yeniden
Üret" + `ConfirmDialog` "mevcut 15 satır". Altınay'da kaydetmeden tarayıcıda ölçüldü; core 580/580, typecheck temiz.
Açık kalan: 25+ özel modal kademeli taşınacak (envanterde not), `FormDialog` ⬜; `grade-grid-screen` `onCellKey` farklı
anlamda (Enter aşağı, G/M/ok tuşları) olduğu için hook'a taşınmadı. Madde merge ile arşive gider.

### `B-51` · Zil programında teneffüs ve öğle arası elle eklenemiyor 🟡

Altınay saha testi (B2.3, 2026-09-15). "+ Ders Ekle" (`bell-schedule-tab.tsx:87-100` `addRow`) satırı
sabit `type: "ders"` ile açıyor; satırın tipini sonradan değiştiren bir kontrol yok (rozet tıklanamayan
`<span>`). Teneffüs ve öğle arası yalnız otomatik üreticiyle doğuyor — elle çizelge kuran okul molasını
giremiyor. Sunucu engel değil: `BulkCreateBellScheduleCommandValidator` `Lesson`/`Break`/`LunchBreak`
üçünü de kabul ediyor. Saf istemci eksikliği.

⬜ Kapatma yolu: satıra tip seçici (mevcut `ASeg`) ya da "+ Ders / + Teneffüs / + Öğle Arası" ekleme
seçenekleri. Öğle arasının tüketicileri var (`GetAvailableRelievers`, `AutoDistributeDutyJob`) — elle
girilen öğle arası da onlara doğru ulaşmalı (`TB-174` tüketici düzeltmesiyle birlikte ölçülür).

✅ **2026-09-16 · kodda düzeltildi (commit bekliyor).** Her satırda Ders / Teneffüs / Öğle Arası `ASeg`'i; ekleme
butonu "Satır Ekle". Tip değişimi ve varsayılan süre `packages/core` `changeBellRowType`/`bellRowDefaultDuration`
(testli). Tarayıcıda kaydetmeden ölçüldü (Teneffüs 10 dk, Öğle Arası 60 dk). Mobil zil ekranı salt-okunur, kusuru
taşımıyor. `TB-174`'ün ekran ayağı da aynı turda: Gün Atamaları'nda ders satırı olmayan şablona atanmış gün ⚠ ve
"O gün ders oturumu açılmaz ve yoklama alınamaz" bandı (web + mobil; Altınay'da Cuma canlı görünüyor). Sunucu hâlâ
satırsız şablona atamayı reddetmiyor — `TB-174` sunucu ayağında değerlendirilir.

### `E-25` · Zil şablonları sabit ikili (Tam Gün / Yarım Gün); güne göre adlandırılmış program yok 🟡

Altınay saha testi (B2.3, 2026-09-15). Okul Pazartesi–Perşembe bir, Cuma farklı bir zil programı
uyguluyor. Şablon hem sunucuda (`BellTemplateKey` enum) hem istemcide
(`packages/core/src/bell-schedule/{types,constants}.ts`) yalnız `FullDay`/`HalfDay`; `BellDayAssignment`
her güne bu ikiliden birini ya da "kapalı" atıyor. Üçüncü ya da adlandırılmış şablonun yolu yok.

Ölçüm: `TB-174` düzeltilince Cuma'yı "Yarım Gün" şablonuna atamak **hesapça** güvenli — devamsızlığın
yarım gün eşiği (`HalfDayLessonThresholdPercent`, `AbsenceDayEquivalenceCalculator:29-56`) şablon adına
değil o günün gerçek oturum oranına bakıyor. Sorun **anlam**: Cuma programı yarım gün değil; ekranda,
raporda ve öğretmenin programında "Yarım Gün" yazması yanlış bilgi.

⬜ Ürün kararı bekliyor: (a) şablonlar okulun adlandırdığı serbest kayıtlara dönüşür (ör. "Pzt–Per",
"Cuma"), gün ataması onlara bağlanır; (b) ikili kalır, yalnız etiketler nötrleşir ("Program A / B");
(c) bugünkü gibi kalır, Cuma "Yarım Gün" olarak kullanılır.

### `TB-175` · Okul açılışında bildirim ana ayarı tohumlanmıyor; ilk "Kaydet" okulun bütün bildirimlerini kapatıyor 🟠

Altınay saha testi (B2.2, 2026-09-15). `SchoolCreated` handler'ları modül ayarlarını
(`SeedDefaultModuleConfigsHandler`), olay kurallarını (`SeedDefaultNotificationRulesHandler`, 27 satır)
ve kademeleri tohumluyor — **okulun bildirim ana ayarını (`NotificationConfig`) tohumlayan yok.** Satırı
yalnız `UpdateNotificationConfigCommandHandler:50-62` müdür ilk kez kaydedince yaratıyor.

DB ölçümü (`school.school_notification_configs`): Altınay ve PLT-DOGRULAMA'da **satır yok**; seed
okullarından yalnız `ATA-AL`'da var.

Satır yokken üç yüzey üç farklı şey söylüyor:

| Yüzey | Satır yokken |
|---|---|
| Ayar ekranı (`GetNotificationConfigQueryHandler:75-78`) | Ana anahtar, e-posta, push **kapalı** (`?? false`) |
| E-posta ve push kanalları (`EmailNotificationChannel:76`, `PushNotificationChannel:137`) | `config is null` → **gönderilmez** |
| Uygulama içi kanal (`InAppNotificationChannel:56`) | `config is not null && !IsEnabled` → satır yokken **engellenmez, gönderilir** |

Müdür ekranda "bildirimler kapalı" görüyor, kullanıcılar zile yine bildirim alıyor. E-posta ve push ise
müdür bu sekmeyi bir kez kaydetmeden hiçbir okulda çalışmıyor — kimse bunun gerektiğini bilmiyor.

**Bayat ipucu:** Sessiz saatlerin yanında "Hazırlanıyor — gönderim henüz bu aralığa bakmıyor"
(`notification-tab.tsx:227`, `TB-45` dönemi). Artık doğru değil: push kanalı aralığı uyguluyor ve
bildirimi aralık sonuna erteliyor (`PushNotificationChannel.cs:186-190`, `PushQuietHours`). Uygulama içi
ve e-posta kanalları bakmıyor.

⬜ Kapatma yolu: `SchoolCreated`'a varsayılan `NotificationConfig` tohumu (ana anahtar + uygulama içi açık;
e-posta/push varsayılanı ürün kararı) + mevcut satırsız okullar için göç/backfill; ipucu "yalnız push
bildirimlerini erteler" olarak düzeltilir.

➕ **2026-09-15 · ilk kaydın zinciri ölçüldü → 🟠.** Ekranda (web ve mobil) okulun kanal ana
anahtarlarını düzenleyen **hiçbir kontrol yok**; `buildNotificationPayload`
(`packages/core/src/notifications/logic.ts`) `pushEnabled`/`emailEnabled`/`smsEnabled`/`lateArrivalNotify`'ı
formdan değil **okunan matristen aynen geri yolluyor** (echo). Satır yokken okuma dördünü `false`
döndürdüğü için ilk PUT dördünü `false` gönderiyor → `UpdateNotificationConfigCommandHandler:50-62`
satırı yaratıyor → `NotificationConfig.Create:70` `IsEnabled = push || email || sms || lateArrival` =
**`false`** → `InAppNotificationChannel:56` artık `config is not null && !IsEnabled` dalına giriyor →
**uygulama içi bildirim de kesilir.**

| An | E-posta | Push | Uygulama içi |
|---|---|---|---|
| Okul açıldı, ayar hiç kaydedilmedi | ❌ | ❌ | ✅ |
| Müdür Bildirim Ayarları'nda bir kez **Kaydet** (matris, sessiz saat — ne değişirse) | ❌ | ❌ | ❌ |
| Sonrası | Açacak kontrol yok | Açacak kontrol yok | Açacak kontrol yok |

Yani ekran matriste "Portal ✅" gösterirken okul sessizce tamamen bildirimsiz kalıyor ve bunu geri
alacak bir yüzey yok. Seed okullarında görünmüyordu: `ATA-AL`'ın satırı seed'den `1/1/1` geliyor,
diğerlerinde ekran hiç kaydedilmemiş.

⬜ Kapatma yolu genişledi: (1) `SchoolCreated`'a varsayılan satır tohumu + satırsız okullara backfill;
(2) `IsEnabled` "en az bir kanal açık" türevinden çıkarılıp gerçek ana anahtara dönüşür **ya da** uygulama
içi kanal bu türevi okumayı bırakır (uygulama içi, dış kanalların kapalı olmasıyla susmamalı);
(3) kanal ana anahtarları ya ekrana gelir ya da echo'dan çıkarılır — ekranın göstermediği bir alanı
kör geri yazmak bu hatayı üretiyor.

✅ **Karar (2026-09-15, kullanıcı):** geçici DB düzeltmesi yapılmaz; madde Altınay düzeltme turuna girer ve
**C1 (sezon yaşam döngüsü) başlamadan kapanır**. Altınay'ın `is_enabled=0` satırı o düzeltmenin
backfill'iyle onarılır.

✅ **2026-09-16 · kapandı, canlı doğrulandı (gece turu, commit bekliyor).** Beş ayak da yazıldı:
1. **`IsEnabled` gerçek ana anahtar** — `push || email || sms || lateArrival` türevi kaldırıldı; `Update` üç durumlu
   (`null` = dokunma).
2. **`TB-125` ile birlikte kapandı** — ana anahtar kapısı `TryGetEventKey` bloğunun dışına çıktı, eşlemede olmayan
   ~25 tip de kapıya uyuyor; Portal kararının kaynağı yeni `NotificationEventKeyMap` (katalogda satırı olan 22 tip),
   `PushEventKeyMap` yalnız push kapsamı olarak kaldı. **Uygulama içi kanal artık dış kanallara bakmıyor** — okulun
   push'u kapatması zili susturmuyor.
3. **Tohum + backfill** — `SeedDefaultNotificationConfigHandler` (`SchoolCreated`) + göç
   `20260916004157_20260916_notification_config_seed_backfill` (yalnız veri; `Up()` boş üretildi, gövdeye iki
   `migrationBuilder.Sql` yazıldı). Dev DB ölçümü: **öncesi 6 okul / 2 satır** (`ALTINAY-AL` `0/0/0/0/0`,
   `ATA-AL` `1/1/1/0/1`), **sonrası 6 satır**, hepsi `1/1/1/0/1`; 4 tohum + 1 onarım, echo kurbanı kalmadı.
   `ATA-AL`'a dokunulmadı (koşul dört kanalın da 0 olmasını şart koşuyor → okulun bilinçli kararı ezilmiyor).
   **Altınay onarıldı: `1/1/1/0/1`.**
4. **Echo kaldırıldı** — `buildNotificationPayload` kanal ana anahtarlarını göndermiyor, sunucu `null` gelince mevcut
   değeri koruyor.
5. **Bayat sessiz saat ipucu** düzeltildi (web + mobil): aralık yalnız push'u erteler.

Canlı ölçüm (seed müdürü): gövdesinde kanal anahtarı olmayan `PUT` → 204, ardından `GET` → `isEnabled: true`,
push/e-posta açık; DB `1/1/1/0/1`. **"Kaydet" artık okulu kapatmıyor** — maddenin kapanış ölçütü.
Testler: Application 2671 · Api 435 · mimari 7 yeşil; bildirim entegrasyon testleri 4/4; core 602; UI typecheck ve
lint temiz (codegen elle düzeltmeyle birebir aynı çıktı).

**Varsayım (ürün kararı, tek dönüş noktası):** e-posta/push varsayılanı `ATA-AL`'ın satırıyla hizalandı — ana anahtar
açık, push açık, e-posta açık, **SMS kapalı** (`E-23`: uygulaması yok), geç gelme açık. Tersi seçilirse yalnız
`src/Oksis.Domain/Modules/Schools/NotificationConfigDefaults.cs` değişir (tohum, backfill, okuma yüzü ve üç kanal
aynı sabitleri okuyor) + bir düzeltme SQL'i.

✅ **Karar (2026-09-16, kullanıcı):** varsayım **onaylandı** — okul açılışında ana anahtar açık, push açık,
e-posta açık, SMS kapalı, geç gelme açık. Kodda uygulanan hâli geçerli.
**Operasyonel not:** göç DB'ye doğrudan yazdığı için Redis `notification-config` anahtarı bayat kaldı; ekran ilk
`PUT`'a kadar eski değeri gösterdi. Göçle veri değiştiren her turda ilgili önbellek anahtarı temizlenmeli.

### `TB-176` · Sezonsuz eklenen okul tatili ayar ekranında görünmüyor, silinemiyor — ama yoklama takvimi onu tatil sayıyor 🟠

Altınay saha testi (B2.4, 2026-09-15), web'den canlı ölçüldü. Sezonu olmayan okulda Ayarlar → Tatil
Takvimi → "Yeni Tatil" ile "Saha Testi Tatili (silinecek)" (2–3 Kasım 2026) eklendi: ekran "Yeni okul
tatili eklendi" dedi, liste **"Kayıt yok · 0"** kaldı. DB:
`academic.school_holidays` → `holiday_type=ClosedDay`, **`academic_session_id = NULL`**.

Neden: `CreateHolidayCommandHandler:52` sezonu `GetCurrentSessionIdOrNullAsync` ile çözüyor, sezon yoksa
`null` yazıyor. Okuyucular bu kaydı iki farklı biçimde görüyor:

| Okuyucu | Süzgeç | Sezonsuz kayıt |
|---|---|---|
| Ayar listesi `GetHolidaysQueryHandler:45` | `AcademicSessionId == seasonId` | **Görünmez** — düzenlenemez, silinemez |
| Sezon tatil sorgusu `GetSchoolHolidaysForSessionQueryHandler:29` | `AcademicSessionId == session.Id` | **Görünmez** |
| Takvim okuyucusu `HolidayCalendarReader:42` (yoklama `SchoolCalendarService`, program istisnası planlayıcısı, yayınlı program) | `SchoolId == schoolId` | **Tatil sayılır** |

Ekranda hiç görünmeyen ve silinemeyen bir kayıt, o günleri yoklamada ders dışı gün yapar. Sezonu sonradan
açmak kaydı sezona bağlamaz. Aynı durum sezon açıldıktan sonra ise olmaz — her yeni okulun **ilk
gününe** özgü, ama müdürün tatil takvimini sezondan önce doldurması doğal bir sıra.

⬜ Kapatma yolu: sezonsuz okulda tatil oluşturma reddedilir ("önce sezonu açın") **ya da** tarih hangi
sezona düşüyorsa ona bağlanır / sezon açılışında sezonsuz tatiller sezona devralınır; okuyucuların sezon
süzgeci tek kurala çekilir. Mevcut sezonsuz satırlar için veri düzeltmesi.
**Altınay notu:** deneme satırı (`432b4adc-…`) B3 sezon açılışında görünürlüğü ölçmek için bilerek
bırakıldı; C1'den önce silinmeli, yoksa 2–3 Kasım yoklamada tatil sayılır.

➕ **2026-09-16 · sezon açıldıktan sonra ölçüldü:** Altınay'da `2026-2027` sezonu açıldı; deneme satırı hâlâ
`academic_session_id = NULL` — sezon açılışı sezonsuz tatilleri devralmıyor. Ayar listesi sezon kimliğiyle süzdüğü için
kayıt görünmez kalıyor, takvim okuyucusu okul kimliğiyle okuduğu için yoklamada tatil sayılacak. Madde doğrulandı.

✅ **2026-09-16 · kapandı (gece turu, commit bekliyor).** Sezon artık **tatilin tarihinden** çözülüyor: yeni
`HolidaySeasonResolver` (tek kural, iki yazma yolu da onu çağırır). `Setup` sezon kabul (müdürün takvimi sezon
açılmadan doldurması doğal); **arşivlenmiş sezon reddedilir**; hiçbir sezona düşmüyorsa istek reddedilir —
`school-settings.errors.holiday.no-season-for-date`. Güncellemede tarih değişirse `Holiday.RebindSeason` ile bağ
tazeleniyor (yoksa taşınan tatil eski sezonda kalıp aynı maddeyi üretiyordu). Okuyucu tek kurala çekildi:
`HolidayCalendarReader` artık `AcademicSessionId != null` süzüyor — **müdürün göremediği kayıt devamsızlığı da
etkileyemez.** Göç `20260916015053_20260916_holiday_session_backfill` sezonsuz satırları tarihini kapsayan arşiv-dışı
sezona bağlıyor (resolver'la birebir aynı kural; hiçbirine düşmeyen `NULL` kalıyor, okuyucu onları zaten saymıyor).
Yan kazanç: aktif sezon varken *gelecek* sezona ait tarihe girilen tatil de artık doğru sezona bağlanıyor. Ayrıca
`CreateHolidayCommandHandler`'da yıllardır duran ve **her zaman `false` dönen** `IsDateInArchivedAcademicYear` stub'ı
silindi; sözlükteki `holiday.archived-year` anahtarı ilk kez gerçekten üretiliyor.
Ölçüm: dev DB'de sezonsuz canlı satır **1 → 0**; testler 4199 birim yeşil (28 yeni), `dotnet format` temiz.
**Altınay deneme satırı (`432b4adc-…`) silindi** — önce göçün yükleminin onu `2026-2027`'ye bağladığı önizlemeyle
doğrulandı, sonra SQL ile soft-delete edildi (müdür parolası bilinmediği için ürün yolu kullanılamadı); 2–3 Kasım
artık tatil değil, Altınay'ın diğer üç tatili bozulmadı. **C1 engeli kalktı.**
**Tuzak notu:** `dotnet ef database update --no-build` bayat DLL yükleyip `EXIT=0` ve "Done." dedi, hiçbir şey
yapmadan — göç assembly'de yoktu. Temiz derlemeyle tekrarlandı. Bu bayrak göç uygularken kullanılmamalı.

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

### `E-26` · Ara tatil girilemiyor: okul oluşturamıyor, onu üreten kaynak da yok 🟡

Altınay saha testi (B2.4). Tatil ekranı "Resmî, ara tatil ve yarıyıl kayıtları MEB takviminden gelir
ve kilitlidir — yalnızca Okul kategorisi düzenlenebilir" diyor ve "Ara Tatil" çipi taşıyor. Ölçüm:
`HolidayType.IntermediateBreak` kilitli tip (`HolidaySourceClassifier`), okul oluşturamıyor; ama bu tipte
satır **üreten tek bir kod yok**. Yarıyıl tatili (`SemesterBreak`) yalnız sezon sihirbazında taslakta
tarih verilirse yazılıyor (`OpenSeasonFromDraftCommandHandler:307-335`); ara tatil için sihirbazda alan da
yok. Resmî tatil kataloğunda da ara tatil/yarıyıl kategorisi yok (yalnız `NATIONAL`/`RELIGIOUS`).

Sonuç: Kasım ve Nisan ara tatilleri OKSİS'e "ara tatil" olarak girilemiyor; "Ara Tatil" çipi her okulda
kalıcı olarak 0. Tek yol okul kategorisinde "kapalı gün" eklemek — bu da raporda ve takvimde yanlış tür.

➕ **Düzeltme (2026-09-15, B3):** "sihirbazda ara tatil için alan yok" ifadesi yanlıştı. Sihirbazın 4. adımında
serbest tatil listesi **var** ("Tatil Ekle"), ama yazılmıyor (`TB-178`). Ara tatilin doğal girişi bu liste;
`TB-178` kapanınca `E-26`'nın (a) seçeneği fiilen gerçekleşir. Ölçülen takvim (MEB 2026/68): 16–20 Kasım 2026 ve
8–12 Mart 2027 (2. dönem ara tatili Mart'ta, Nisan'da değil).

⬜ Ürün kararı bekliyor: (a) sezon sihirbazına ara tatil aralıkları eklenir; (b) MEB çalışma takvimi
(ara tatil + yarıyıl) yıllık katalog olarak platformdan beslenir; (c) okul ara tatili kendisi girebilir
(tip kilidi kalkar).

### `D-20` · Tatil Takvimi sezonsuz okulda: "— Sezonu", sabit "Aktif" rozeti, açılır açılmaz hata gösteren form 🟡

Altınay saha testi (B2.4), ekran görüntüsüyle ölçüldü.
- Kart başlığı "**— Sezonu Tatilleri**" (`holiday-tab.tsx:80,100`), yan kart "Sezon: —".
- "Sezon Özeti" rozeti koşulsuz yeşil **"Aktif"** (`holiday-tab.tsx:235`) — ortada sezon yokken.
- `useHolidays` sezon yokken hiç çalışmıyor (`enabled: Boolean(seasonId)`): resmî tatiller de gösterilmiyor,
  eklenen tatil de (`TB-176`).
- Boş durum "Tümü" seçiliyken de "**Bu kategoride** tatil kaydı bulunmuyor" (`:140-142`).
- "Yeni Okul Tatili" penceresi açılır açılmaz kırmızı "En az 2 karakter" ve "Başlangıç tarihi zorunludur"
  gösteriyor: ayar formlarına `D-09` ile getirilen "dokunulduktan sonra göster" kuralı pencere formunda yok.
  Çarpı yine sol üstte stilsiz (`D-19`).

⬜ Kapatma yolu: sezonsuz durum `TB-168`/`TB-173` ortak kararına bağlanır; `D-09` kuralı `AModal` formlarına
da uygulanır; rozet sezon durumundan türer.

➕ **2026-09-16:** sezon açıldıktan sonra başlık "2026-2027 Sezonu Tatilleri" oldu, ama sezon **`Setup`** iken "Sezon Özeti"
rozeti hâlâ **"Aktif"** — rozetin sezon durumundan türemediği canlı ölçüldü.

✅ **2026-09-16 · ekran ayağı kodda düzeltildi (gece turu, `oksis-ui`, commit bekliyor).** Rozet `sessionStatusBadge`
(`packages/core/src/academic-sessions/constants.ts`) ile sezon durumundan türüyor (`Setup` → "Hazır", sezon yoksa rozet
hiç çizilmiyor); boş durum ortak `EmptyState`/`AEmpty` `filtered` desenine geçti ("Tümü"nde artık "bu kategoride"
demiyor); **`D-09` kuralı merkezîleşti**: `AModal`/`ADrawer` bir `FieldRevealContext` sağlıyor, `AFld` hatayı blur ya da
gönderim denemesine dek gizliyor, yeni `ASubmit` geçersiz formda tıklanabilir ama istek atmıyor — derslik çekmecesindeki
yerel kopya da bu yola taşındı. Yan düzeltme: `Dialog` odağı `autoFocus`'tan çalıyordu, artık çalmıyor ve kapanışta açan
düğmeye dönüyor. "Toplam N gün" sayacı `countHolidayDays` ile farklı takvim günlerinin birleşimi (çok günlü aralık uçlar
dahil; yarım gün alanı sözleşmede yok, `TB-177` ile gelince tek dokunuş noktası). core 598 test yeşil.
**Kapsam dışı kalanlar:** "— Sezonu" başlığı ve sezonsuz görünüm (`TB-168`/`TB-173` kararı), sunucu ayağı
(`TB-176`/`TB-177`). **Canlı doğrulama borcu:** Chrome uzantısı bu turda sayfaya betik enjekte edemedi (bekleyen izin
istemi olabilir), ekran ölçümü kullanıcı uyanınca yapılmalı.

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

### `ENG-03` · İlk sezon açılamıyor — kaynak sezon altı katmanda zorunlu 🟠

Altınay saha testi (B3.1, 2026-09-15). Platformdan açılan, hiç sezonu olmayan okulda müdür sihirbazı
kaynak sezon seçmeden doldurdu; `PUT season-drafts/current` **400**:
`$.sourceSessionId: The JSON value could not be converted…` (gövdede `"sourceSessionId": ""`).
**Her yeni okulun ilk sezonu açılamıyor** — seed okullarında sezon hep önceden var olduğu için hiç görünmedi.

Kaynak sezonu zorunlu tutan katmanlar (`oksis-api` @ `60e65caf`, `oksis-ui` @ `1bf6a51`):

| Katman | Yer |
|---|---|
| Sihirbaz | `wizard.tsx:186` "Kaynak Sezon *", `:189-197` yalnız mevcut sezonları listeleyen `<select>` |
| Taslak yükü | `packages/core/src/academic-sessions/logic.ts:593` boş dizeyi aynen yolluyor |
| Komut | `SaveSeasonDraftCommand` `Guid SourceSessionId` (boş olamaz) → model binding 400 |
| Doğrulayıcı | `SaveSeasonDraftCommandValidator:17` `NotEmpty` |
| Domain | `SeasonDraft.Create:54`, `UpdateProgress:83` `Guid.Empty` → istisna |
| DB | `SeasonDraftConfiguration:21` `IsRequired`, `academic.season_drafts.source_session_id NOT NULL` |

Açılış işleyicisi de kaynağı varsayıyor: `CopyBranches=true` ve harita boşsa şube haritasını kaynak sezondan
hesaplıyor (`OpenSeasonFromDraftCommandHandler:170-190`) → kaynaksız okulda "Şube haritası boş" hatası.

⬜ Kapatma yolu: kaynak sezon isteğe bağlı (`Guid?`, göç); kopyalama bayraklarından biri açıksa zorunlu
(doğrulayıcı + domain); sihirbazda kaynak yokken kopyalama anahtarları kapalı ve devre dışı.

🔄 **Kodda düzeltildi, merge bekliyor (2026-09-16):** `oksis-api` dalı `fix/ilk-sezon-acilisi` + `oksis-ui` dalı
`fix/davet-olu-riza-anahtarlari`. `SeasonDraft.SourceSessionId` `Guid?`; kural tek yerde
(`SeasonDraft.RequiresSourceSession`: kopyalama bayrağı açıksa kaynak zorunlu, `Guid.Empty` reddedilir); doğrulayıcı
aynı kuralı okuyor; göç `20260915203011_20260915_season_draft_source_optional` dev DB'ye uygulandı (kolon nullable,
`has-pending-model-changes` temiz). `OpenSeasonFromDraft` kaynağa dayanan dalları kaynak yokken çalıştırmıyor
(`source-required`). Aktivasyon (`ActivateSeasonRollover`, `PromoteStudents`, `SetupSeasonReverter`) taslağın kaynağını
okumuyor — değişiklik gerekmedi. `generated/schema.ts` elle düzenlendi; canlı API'den üretilen şemayla karşılaştırıldı,
yalnız satır bölme farkı var.
Doğrulama: `dotnet build` 0 · `test-changed.sh` 0 (Domain 1067 · Application 2658 · Api 435 · mimari 7) ·
entegrasyon `--filter Draft` 77/77 · web/core/api `tsc` 0 · core vitest 559/559 · api vitest 6/6 · eslint/prettier 0.
API yeniden başlatıldı; tarayıcıda Altınay'da ölçüldü: sihirbaz "Kaynak yok · İlk sezon", açılır listede "Kaynak sezon yok
(ilk sezon)", 1. adımın beş kopyalama anahtarı kapalı + soluk + "Kaynak sezon seçilmedi — kopyalanacak önceki sezon yok".
Kapanış: müdürün sihirbazla sezonu uçtan uca açması (B3.1).

✅ **Uçtan uca ölçüldü (2026-09-16):** Altınay müdürü kaynak sezonsuz sihirbazı doldurdu, sezon açıldı. DB: `2026-2027`
`Setup` (14.09.2026–25.06.2027), iki dönem `NotStarted` (14.09.2026–22.01.2027, 08.02.2027–25.06.2027), taslak
`source_session_id=NULL`, kopyalama bayrakları 0, `opened_session_id` sezona bağlı; şube/kayıt 0. Başlangıcın geçmiş tarih
olması engel olmadı. Arşive taşıma: merge sonrası.

### `TB-178` · Sihirbazda girilen okul tatilleri sezon açılınca hiç yazılmıyor; liste "kopyala" anahtarına bağlı 🟠

Altınay saha testi (B3). Sihirbazın 4. adımında "Tatil Ekle" ile satır girilebiliyor (müdür 1. ve 2. dönem ara
tatillerini girdi) ve satırlar taslağa `HolidaysJson` olarak kaydediliyor. Ama **`HolidaysJson`'u okuyan tek bir
kod yok**: `grep` yalnız domain alanı, DTO, komut ve kaydetme işleyicisini buluyor; `OpenSeasonFromDraftCommandHandler`
yarıyılı (`TermDates.BreakStart/End`) ve `CopyHolidays` ile kaynak sezonun okul tatillerini yazıyor, listeyi hiç
okumuyor. Girilen tatiller sezon açılınca sessizce kaybolur.

İkinci kusur: liste ekranda ve yükte "Okul tatillerini kopyala" anahtarına bağlı (`wizard.tsx:493`
`{form.copyHolidays && …}`, `logic.ts:581-582`). Kopyalanacak önceki sezonu olmayan okul, kendi tatilini girmek için
anlamsız bir "kopyala" anahtarını açmak zorunda.

⬜ Kapatma yolu: açılış işleyicisi `HolidaysJson` satırlarını yeni sezona bağlı `Holiday` olarak yazar; liste
kopyalama anahtarından ayrılır.

✅ **Karar (2026-09-15, kullanıcı):** sihirbaz tatilleri **`IntermediateBreak` (Ara Tatil), kilitli** olarak yazılır;
Tatil Takvimi'nde "Ara Tatil" çipinde görünür, ayarlardan düzenlenmez.

🔄 **Kodda düzeltildi, merge bekliyor (2026-09-16):** `OpenSeasonFromDraftCommandHandler` 8c adımı `HolidaysJson`'u okuyor:
adı/başlangıcı boş satır atlanır, bitiş boşsa tek gün; okunamayan tarih `holidays-invalid`, bitiş < başlangıç
`holiday-range-invalid`, sezon dışı `holiday-outside-session` (mesaj tatil adını içerir); geçerli satır
`IntermediateBreak` ve yeni sezona bağlı yazılır; yarıyılla aynı aralık ikinci kez yazılmaz; `holidays:reader:{schoolId}`
önbelleği temizlenir. Sihirbazda liste kopyalama anahtarından bağımsız ve "Ara Tatil olarak yazılır" diyor.
Entegrasyon testleri: iki satır `IntermediateBreak` + doğru sezon; sezon dışı tarih reddi. Kalan not: adı boş ama tarihi
dolu satır sunucuda sessizce atlanıyor, istemcide satır doğrulaması yok.

✅ **Uçtan uca ölçüldü (2026-09-16):** Altınay sezon açılışında `academic.school_holidays`: "1. Ara Tatil" 16–20.11.2026 ve
"2. Ara Tatil" 08–12.03.2027 `IntermediateBreak`, "Yarıyıl Tatili" 25.01–05.02.2027 `SemesterBreak` — üçü de yeni sezona
bağlı. Arşive taşıma: merge sonrası.

### `D-22` · Sezon sihirbazı: kaynaksızken kopyalama anahtarları açık, kilitli anahtar kilitli görünmüyor, tarih doğrulaması kopyalamaya bağlı 🟡

Altınay saha testi (B3).
- **Kopyalama anahtarları:** kaynak sezon yokken de 1. adımdaki "Kopyalanacak Bağlam" anahtarları, 2. adımdaki
  "Önceki sezonun dönem yapısını kopyala", 4. adımdaki "Okul tatillerini kopyala" ve 5. adımdaki "Öğretmen
  görevlendirmelerini kopyala" açılabiliyor (`wizard.tsx:201-213`, `:270-276`, `:486-490`, `:578-583`). Varsayılanda
  `copyBranches` ve `copyHolidays` açık (`logic.ts:533`).
- **Kilitli anahtar:** 5. adımda "Aktif öğrencileri terfi ettir" `on locked` sabit (`wizard.tsx:565-570`); `SznToggle`
  `.locked`/`.lock` sınıfı ekliyor ama bu sınıflar için CSS kuralı yok — anahtar tıklanabilir görünüyor, değişmiyor.
  İlk sezonda "0 aktif öğrenci için yeni sezon kaydı… 0 öğrenci mezun edilir" şeridi de anlamsız.
- **Tarih doğrulaması:** `next()` ve `submit()` dönem tarihlerini yalnız `form.copyTerms` açıkken doğruluyor
  (`wizard.tsx:747`, `:781`). Tarihleri elle giren okulun hatalı tarihi istemcide yakalanmıyor.

⬜ Kapatma yolu: kaynak yokken kopyalama anahtarları kapalı + devre dışı + açıklamalı; kilitli anahtar stili;
tarih doğrulaması koşulsuz.

🔄 **Kodda düzeltildi, merge bekliyor (2026-09-16):** kaynak yokken 1./2./3./4./5. adımlardaki kopyalama ve terfi anahtarları
kapalı + `disabled`/`aria-disabled` + açıklamalı; kaynak kaldırılınca bayraklar `false`'a çekilir (`sourceSessionPatch`);
`SznToggle` devre dışı görünümü (`screens.css` `.szn-toggle` bölümü, soluk + `not-allowed`); dönem tarihi doğrulaması
`next()` ve `submit()`'te koşulsuz; kaynak yokken terfi önizlemesi çağrılmıyor; 5. adım ilk sezon şeridi ("öğrenciler sezon
açıldıktan sonra Öğrenciler ekranından aktarılır", `E-27` geçici). 1. adım tarayıcıda ölçüldü. Kalan not: kaynaksızken
"Pasif öğrencileri hariç tut" ekranda kapalı görünse de yükte `true` gidiyor (kopyalama bayrağı değil, aktivasyon zaten
pasifleri hariç tutuyor).

### `E-27` · İlk sezonda sihirbazın Öğrenciler adımı işlevsiz 🟡

Altınay saha testi (B3). Kaynak sezonu olmayan okulda 5. adım yalnız terfi ve görevlendirme kopyalama anahtarlarını
gösteriyor; hepsi önceki sezonu varsayıyor. Kullanıcının beklentisi: ilk sezonda bu adımda öğrencilerin Excel'den
yüklenmesi.

✅ **Karar (2026-09-15, kullanıcı):** ilk sezonda sihirbaza **Excel ile öğrenci yükleme adımı** eklenir. Ayrı iş olarak
tasarlanır (sezon henüz yokken kayıt/şube sırası çözülmeli). Geçici: `ENG-03` düzeltmesinde 5. adım kaynaksız sezonda
kopyalama anahtarlarını devre dışı bırakıp öğrencilerin sezon açıldıktan sonra aktarılacağını söyler; Altınay öğrencileri
B7'de yüklenir.

### `B-52` · Sezon sihirbazı tarih yazılırken resmî tatil sorgusunu her tuşta, yarım yılla atıyor (422 seli) 🟡

Altınay saha testi (B3, 2026-09-16), müdürün DevTools ekran görüntüsüyle: 2. dönem bitişi yazılırken
`GET official-holidays?start=2026-09-14&end=0002-06-25`, `…0020-06-25`, `…0202-06-25` istekleri tekrar tekrar
**422**, sonunda `…2027-06-25` 200. Tarayıcının `<input type="date">`'i yıl yazılırken biçimce geçerli ara değerler
bildiriyor; `useOfficialHolidays` yalnız "değer boş değil" kapısıyla (`enabled: Boolean(start) && Boolean(end)`)
çalışıyor, sihirbaz iki yerde (`Step4` ve sihirbaz gövdesi) ham form tarihini veriyordu.

🔄 **Kodda düzeltildi, merge bekliyor (2026-09-16, `oksis-ui` dalı `fix/davet-olu-riza-anahtarlari`):**
- `packages/core/src/date/tr-date.ts`: `isCompleteIsoDate` (YYYY-MM-DD, 1900–2999, takvimde var olan gün) ve
  `isIsoDateRange`; testleri `iso-date-validity.test.ts`.
- `packages/api` `useOfficialHolidays` `enabled: isIsoDateRange(start, end)` — kapı kancada, iki çağrı yeri birden.
- `packages/ui/src/hooks/use-debounced-value.ts`: paylaşılan `useDebouncedValue` (paketin ilk kancası); sihirbaz iki
  çağrıda tarihleri 400 ms gecikmeli veriyor.
- Doğrulama: core/api/ui/web `tsc` 0 · core tarih testleri 14/14 · eslint 0 · prettier 0. Tarayıcıda Altınay'da ölçüldü:
  bitiş `25062027` tuş tuş yazıldı → **tek istek**, `end=2027-06-25`, 200.
- Aday (düzeltilmedi): veliler araması kendi `setTimeout` debounce'unu yazıyor (`parents-page.tsx:45-48`); paylaşılan
  kancaya geçirilebilir.

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

### `TB-191` · Ders kataloğu GLOBAL — okul yöneticisinin ders eklemesi bütün okullara yansıyor 🔴

Altınay B4 ölçümünde çıktı (2026-09-16). `POST /api/v1/academics/subjects` okul yöneticisinin izniyle
(`school-settings.update-academic-structure`, `[Tenancy(Required)]`) korunuyor — **ama handler `master.subjects`'e
yazıyor.** Tablo `school_id` taşımıyor (`Subject : MasterEntity`), tenant süzgeci yok, ders kodu benzersizliği
(`ux_subjects_code`) **global**. Aynı durum güncelleme, silme ve durum değiştirme uçlarında da geçerli;
`UpdateSubjectCommandHandler`'ın kendi yorumu bunu kabul ediyor: *"Subject GLOBAL master olduğundan tenant
filtresi yok."*

Sonuçları:
- Bir okulun müdürü ders eklerse **bütün tenantlar** o dersi görür; pasifleştirirse **hepsinden** kalkar.
- Bir okul "MAT" kodunu aldıysa başka okul aynı kodu **kullanamaz**.
- Platform tarafında katalog yönetimi için ayrı bir uç **yok**, yani bu yetki başka yere taşınmış da değil.

Tenant ihlali deponun kırmızı çizgisidir (`CLAUDE.md`); üstelik bu, izin kapısının doğru ama **veri sahipliğinin
yanlış** olduğu bir sınıf — `TB-139`'un kardeşi.

⬜ Kapatma yolu: ders kataloğu ya okul kapsamına taşınır (master satırları çekirdek, okul kendi satırını ekler —
branşlardaki `school.branches` + `import-meb` deseni birebir emsal) ya da yazma uçları okul yöneticisinden alınıp
platform yüzeyine taşınır. Karar verilmeden uçlar açık bırakılmamalı.

✅ **Karar (2026-09-16, kullanıcı): okul kapsamına taşınır.** Master katalog **çekirdek** olarak kalır, okul kendi
dersini kendi tablosuna ekler, içe aktarımla başlar — yani branşlardaki desenin aynısı. Gerekçe: okulun kendi
dersini ekleme ihtiyacı gerçek (Altınay'ın edebiyat ve müzik dersleri `TB-192` yüzünden katalogda yok) ve yazma
yetkisini platforma almak o ihtiyacı karşılamazdı. Ders kodu benzersizliği **okul içine** iner.
**Bu karar `TB-192`'yi de güvenli kılıyor:** eksik dersleri eklemek artık başka okulları etkilemeyecek.
Uygulama sürüyor; mevcut kataloğun okullara devri göçle yapılacak — hiçbir okul ders kaybetmemeli.

✅ **Kapandı — 2026-09-16 (commit edildi ve push edildi).** Master katalog `MasterSubject` olarak **çekirdek**
kaldı (tablo, satırlar, kimlikler, seed aynen; `subject_branches` ve `curriculum_hour_templates` dokunulmadan
geçerli kaldı); `Subject` artık tenant varlığı, benzersizlik **okul içine** indi.
**Branş emsalinde olmayan ayak:** kademe eşlemesi de tenant'a taşındı — eski kod onu master'da **tam-replace**
ediyordu, yani bir okulun kademe düzenlemesi bütün okulların eşlemesini siliyordu. Sızıntının en sessiz ayağı buydu.
**Düzenlenebilirlik bilinçli olarak branştan ayrışıyor:** branşta MEB satırı tamamen kilitli, derste yalnız katalog
kimliği donduruldu (kod/ad/kategori/seçmelilik); sıra, açıklama, kademeler, aktiflik ve silme okulun kararı —
aksi hâlde içe aktarılan 21 dersin hepsi kalıcı kilitlenir ve okul kendi kataloğunu düzenleyemezdi. Kural
handler'da değil **domain'de**.
**Merkezî çözüm:** veri kümesi adı korunduğu için dersi okuyan **45 sorgu değişmeden** tenant süzgecine girdi;
çekirdek kimlikte kalan iki tablo için çeviri tek yerde toplandı, sekiz çağrı yeri ona bağlandı ve bir bekçi
çevirisiz okumayı yasakladı.
**Göç üretilirken EF'in iki kusuru yakalandı:** bir yapılandırma satırı eski tipi işaret ettiği için master
tablosunun yabancı anahtarı **sessizce okul tablosuna kaydırılıyordu**, ve `Down()` `Up()`'ın hiç dokunmadığı bir
kısıtı düşürüyordu. İkisi de düzeltildi — üretilen göç okunmadan uygulansaydı şema sessizce bozulacaktı.
**Ölçüm:** altı okulun her birinde **21 ders** (Altınay dahil), okul tablosunda 126 ders + 816 kademe eşlemesi,
master tabloları değişmedi, **çapraz tenant satır 0**, hiçbir okul ders kaybetmedi.
**Kanıt testleri:** gerçek SQL Server'a karşı 6 tenant izolasyon testi — bir okulun dersi öbüründe **görünmüyor**,
iki okul **aynı kodu kullanabiliyor**. Mimari bekçiler 11/11, ders süzgeçli 71 birim testi, arayüzde 314 test.
**Bonus:** katalog artık tenant varlığı olduğu için önbellek temizleme kapısından geçiyor; eskiden hiçbir yazma o
anahtarı düşüremiyordu, tek emniyet 24 saatlik ömürdü.
➕ Arayüzde iki gerçek hata çıktı: ders yönetimi ekranı **arama ucunu** çağırıp yönetim verisi sanıyordu (gerçek
API'de bütün dersler pasif ve seviyesiz görünecekti; yalnız zengin mock verisi gizliyordu) ve aynı kanca ders
programı editörünü de besliyordu — hepsini yönetim ucuna yöneltmek o ekranı 403'e düşürürdü.

➕ **Push kapısı üç testi yakaladı — ve kırılma öğretici.** Ders süzgeçli koşu (71/71) yeşildi ama **tam takım
kırmızıydı**: süzgeç, çeviriyi *tüketen* müfredat saat testlerini adı eşleşmediği için hiç koşturmuyordu.
Asıl mesele eksik sahtelik değildi: testler şablona ve okul override'ına **aynı ders kimliğini** veriyordu, yani
çevirinin köprü kurduğu iki kimlik uzayını hiç ayırmamışlardı — **o hâlleriyle çeviri tümüyle silinse bile
geçerlerdi.** Kurulum gerçeğe uyduruldu (okulun ders satırı kendi kimliğiyle ve çekirdek bağıyla kuruluyor),
beklenen değerler gevşetilmedi ve çeviri **sahtelenip atlanmadı** — atlansaydı bu maddenin kapattığı "override
sessizce yok sayılır" hatası bir daha hiç yakalanamazdı. Sonuç: Application 2827/2827, Api 448, Domain 1094,
bekçiler 66/66. Bu, `TB-184`/`TB-187`/`TB-190` ailesinin dördüncü örneği: **dar süzgeç, yeşil görünen gerçek.**

### `TB-192` · Lise müfredatında Türk Dili ve Edebiyatı yok; saat şablonu kendini "doğrulanmadı" ilan ediyor 🟠

Altınay B4 ölçümünde çıktı (2026-09-16). `master.curriculum_hour_templates` lise için 9–12 × 11 ders taşıyor,
her kademe toplam **30 saat**. Ama:
- **Türk Dili ve Edebiyatı katalogda yok.** Yalnız `TR` "Türkçe" var ve o **1–8**'e bağlı. Aynı şekilde **Müzik ve
  Görsel Sanatlar da yalnız 1–8**'de. Yani Anadolu Lisesi'nin edebiyat ve müzik öğretmenine verilecek ders
  katalogda **bulunmuyor**.
- Her satırın `meb_decision` sütunu **"Doğrulanmadı — MEB çizelgesi bekleniyor"** diyor; şablon kendi doğruluğunu
  garanti etmiyor. Toplam 30 saat duruyor, MEB ortaöğretim çizelgesinin 2026–2027 kırılımı **doğrulanmalı**.

Belirtisi somut: Altınay ders kataloğunu ekrandan tamamlamak zorunda kalacak — ve bugün o ekleme `TB-191`
yüzünden bütün okulları etkiliyor.

⬜ Kapatma yolu: lise müfredat şablonu MEB çizelgesine göre tamamlanıp doğrulanmış olarak işaretlenir; eksik
dersler kademe eşlemeleriyle birlikte katalogda yerini alır.

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

### `TB-200` · Branş ekranındaki "MEB'den Getir" düğmesi hiçbir uç çağırmıyor; boş listede "hepsi zaten var" diyor 🟠

Altınay B4 turunda **kullanıcı ölçtü** (2026-09-16): Altınay'da branş listesi boş, "MEB'den Getir"e basınca
*"MEB branş listesi güncel — yeni kayıt bulunamadı"* çıkıyor; başka okullarda liste dolu görünüyor.

Ölçüm: düğme hiçbir istek atmıyor — `subject-area-catalog.tsx` yalnız o toast'ı yazıyordu
(`onClick={() => api.toast("MEB branş listesi güncel — yeni kayıt bulunamadı")}`). Sunucu tarafı **hazırdı**:
`POST /api/v1/branches/import-meb` (`ImportMebBranchesCommand`, idempotent, `added`/`skipped` döner,
izin `school-settings.update-academic-structure`) ve OpenAPI şemasında kayıtlı
(`ApiResponseOfImportMebResult`). Web'in `packages/api/src/branches/endpoints.ts` dosyası bu ucu hiç
bağlamamış; dosya başı yorumu da yalnız `GET/POST /branches + PUT /{id} + PUT /{id}/status` sayıyor.

İki kat zarar: **(a)** ekran kullanıcıya yanlış bilgi veriyor — liste boşken "hepsi zaten var" diyor, yani boşluğun
sebebi tohumlama eksikliği (`TB-193`) iken kullanıcı "içe aktarım çalıştı, MEB'de branş yok" sonucuna varıyor;
**(b)** `TB-193`'ün kullanıcı kararı ("düğmeyi ekrandan kendim kullanacağım") uygulanamıyordu.

Sınıf olarak bu, `eksik-ekran-eksik-yetkiyi-gizler` kalıbının tersi: uç yazılmış, ekran onu hiç çağırmamış ve
**çağırmış gibi** cevap vermiş. Aynı dosyada ölçülen ikinci bir boşluk: `GET /api/v1/branches/meb` (MEB kataloğunu
listeleyen uç) da web'de hiç kullanılmıyor.

✅ **Kapatıldı — 2026-09-16.** `importMebBranches` ucu + `useImportMebBranches` kancası yazıldı, düğme gerçek
mutasyona bağlandı ve toast artık sunucudan dönen sayıları söylüyor (ders kataloğunun `runImport` deseni). Boş
liste metni de düzeltildi: "Henüz tanımlı branş yok" yerine ne yapılacağını söyleyen metin.
⬜ **Canlı doğrulama kullanıcıda:** Altınay'da düğmeye basıp 15 branşın gelmesi görülecek.

### `TB-194` · Müfredat saat kataloğu okulun kademelerini yok sayıyor 🟡

Altınay B4 ölçümünde çıktı (2026-09-16). `GetCatalogWeeklyHoursQueryHandler` bütün `subject_grade_levels`
satırlarını okuyup ders başına **global** min–max veriyor; okulun `school_grade_levels` listesi süzgeç olarak
kullanılmıyor ve uçta `gradeLevelCode` parametresi **tanımlı bile değil** (gönderilse sessizce yok sayılır).

Canlı ölçüm (lise okulu): katalog **Türkçe 5, Fen Bilimleri 4, Sosyal Bilgiler 3, Müzik, Görsel Sanatlar** döndü —
hepsi ortaokul satırları. Yani Ders Kataloğu ekranı lisede ortaokul saatlerini gösteriyor.

⬜ Kapatma yolu: katalog sorgusu okulun kademe listesiyle süzsün; kademe parametresi ya sözleşmeye girsin ya da
kaldırılsın (bugün ikisi de değil).

✅ **Kapandı — 2026-09-16 (commit edildi, `6cefeed8`).** Sorgu okulun aktif kademe listesiyle süzüyor;
`TB-191`'in çeviri katmanı olduğu gibi kullanıldı, **ikinci bir çeviri yazılmadı**. Kademe parametresi
**sözleşmeye alındı** (kaldırmak seçenek değildi: tanımlı değildi ama gönderilince sessizce yok sayılıyordu);
artık gerçekten süzüyor ve okulun listesinde olmayan kod boş liste döndürüyor. 2 yeni test.
➕ **Kusurun neden fark edilmediği kayda değer:** gösterilen sayılar "yanlış" değildi, **başka okul türünün doğru
sayılarıydı** — lise ekranında ortaokul saatleri. Yanlış veri değil, yanlış bağlam.

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

### `E-33` · Ders programı ekranında seçilenleri yayınla / sil yok 🟠

2026-09-25 kullanıcı isteği (Altınay B9.4). Liste ekranı programları tek tek yayınlatıyor/sildiriyor; 11 şubede toplu üretimden sonra
her birini ayrı açmak gerekiyor. Varsayılanlar (kullanıcıya bildirildi): toplu silme **yalnız taslak**; toplu yayın **ya hep ya hiç**
(seçilenler yayındakilerle ve birbirleriyle çakışma denetiminden geçer; biri takılırsa hiçbiri yayınlanmaz, neden gösterilir);
eksik saat tek onayla kabul edilir (`B-77`); taslak silme bildirim üretmez (`B-76`).

🟡 **Kodda yapıldı, commit bekliyor** (dal `feat/sinif-rehberligi-dersleri`): uçlar `GET timetable/programs/bulk-publish-preview`,
`POST …/bulk-publish` (tek transaction, ya hep ya hiç; engelde 409 `bulk-publish-blocked`), `POST …/bulk-delete` (yalnız taslak,
aksi 409 `bulk-delete-drafts-only`); yabancı/silinmiş kimlik 400 `bulk-unknown-programs`. Çakışma denetimi tek yerde
(`PublishConflictDetector`: yayındakiler + seçilenler arası, seçilen şubenin kendi canlısı hariç); yayın/silme adımları
`ProgramPublisher`/`ProgramDeletion`'a taşındı, tekli handler'lar da onları kullanıyor. Ekran: satır seçimi, eylem çubuğu,
toplu önizleme penceresi (durum, engel, seçilenler arası çakışma, eksik saat onayı, bildirim/not), toplu silme onayı.
21 birim testi; ATA-AL'de uç + ekran ölçüldü, temizlendi. **Yan etki (düzeltme):** master'da `PublishReadiness.ConflictCount`
sabit `0`'dı — tekli yayın yayındaki programla çakışmayı HİÇ engellemiyordu; artık gerçek değer, çakışan yayın 409 `publish-conflicts`.

### `E-32` · "Şubenin sınıf rehber öğretmeni girer" diye bir ders kuralı yok (Deneme, Koçluk, Rehberlik) 🟠

Altınay'da 2026-09-25'te soruldu (kullanıcı: deneme saati, koçluk ve rehberliğe ilgili şubenin rehber öğretmeni girer).
Koddan ölçüldü:
- Görevlendirme **yetkinliktir** (öğretmen × ders, sezon; `SubjectTeacherAssignment`), şubeye bağlı değil. Şubedeki
  öğretmeni ders programı üreticisi kapasite ağırlıklı dağıtımla seçer (`CompetencyAssignmentSource`).
  `ClassRoom.HomeroomTeacherId` bu seçimde hiç kullanılmıyor.
- Bugünkü tek yol elle: her rehber öğretmene Deneme/Koçluk yetkinliği (alan dışıysa gerekçe) + her şube×ders için
  K-14 **Pin** (alan dışı pin'de ≥15 karakter gerekçe). Altınay'da 11 şube × 2–3 ders ≈ 30 pin; sınıf öğretmeni
  değişince pin eski öğretmende kalır.
- Rehberlik MEB çizelgesinde ders satırı değil, toplam beyanıdır (`MebGuidanceHours`); müfredat satırı olmadığı için
  ders programı talebine girmiyor (koddan; üretici çalıştırılarak ölçülmedi).
- Altınay verisi: Deneme 2 saat (9–12, her profil), Koçluk 1 saat (9–10) okul dersi; üçüne de görevlendirme yok.

⬜ Öneri (karar bekliyor): katalogdaki derse "sınıf rehber öğretmeni okutur" niteliği; üretici o dersin şube saatlerini
`HomeroomTeacherId`'ye verir (yetkinlik ve pin gerekmez, öğretmen değişince kendiliğinden izler). Rehberlik saati aynı
nitelikle programa girer; Cuma son saat sabit yerleşimi (`B9.4` notu) ayrı konu. Deneme'nin ders olarak
modellenmesi doğru; açık soru: bu derslerin not/karne ve yoklama davranışı.

✅ **Kararlar (2026-09-25, kullanıcı):** (1) Deneme, Koçluk, Rehberlik **not almaz**, not ve karne ekranlarında
görünmez; **yoklaması tutulur**. (2) Rehberlik saati **MEB'in beyan ettiği saattir** (`MebGuidanceHours`), okul
dersi olarak eklenmez. Ek istek: hücre menüsünden bu dersler elle yerleştirilebilsin; otomatik yerleştirmede
ders → gün + saat sabit kuralı (ör. Rehberlik her Cuma son saat, Koçluk Cuma 7. saat, Deneme Salı son iki saat
blok) tanımlanabilsin.

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

### `TB-196` · Şube açarken okulun kendi kademe listesi denetlenmiyor 🟡

Altınay B4/B5 ölçümünde çıktı (2026-09-16). `CreateClassRoomCommandHandler` `GradeLevelId`'yi **master'daki 13
kademeye** karşı doğruluyor, okulun `school_grade_levels` listesine karşı değil. Yani Anadolu Lisesi olan
Altınay'da **"2-A" şubesi açılabilir**. `SchoolGradeLevel` entity belgesi "bu liste filtre olarak kullanılır"
diyor; kod bunu yapmıyor.

İkinci ayak (Altınay'ı etkilemiyor, ama aynı eşleşme kusuru): `SeedSchoolGradeLevelsHandler` anaokulu için `"AN"`
kodunu arıyor, master'da anaokulunun kodu `"0"` → **saf anaokulu açılışında sıfır kademe** tohumlanır, sessizce.

⬜ Kapatma yolu: şube oluşturma okulun kademe listesini süzgeç olarak kullansın; kademe kodu eşlemesi tek yerden
okunsun.

✅ **Kapandı — 2026-09-16 (commit edildi, `6cefeed8`).** Şube oluşturma artık okulun **aktif** kademe listesiyle
süzüyor (açık `SchoolId`); pasifleştirilmiş kademe de dışarıda kalıyor, master yalnız kod için join'leniyor.
İkinci ayak için **tek kaynak** çıkarıldı: okul türü → kademe kodu eşlemesi artık tek bir kuralda yaşıyor ve
tohumlama handler'ındaki kopya kaldırıldı — yamalama değil merkezî çözüm, ikinci bir çağıran aynı yanlışı
kopyalayamaz. 3 test: liste dışı kademe reddedilir, pasif kademe reddedilir, saf anaokulu açılışı kademesini alır.

### `TB-197` · Rehber öğretmen doğrulaması stub — daima "var" diyor 🟡

Altınay B5 ön ölçümünde çıktı (2026-09-16). Şube oluşturmada rehber öğretmenin varlığını denetleyen
`TeacherExistsAsync` **gövdesi sabit `true` dönen bir stub**. Yani var olmayan ya da başka okulun öğretmeni
rehber olarak atanabilir; kusur ancak o öğretmenden veri okunmaya çalışıldığında görünür.

⬜ Kapatma yolu: kontrol gerçekten okulun öğretmen profillerine baksın (açık `SchoolId` yüklemiyle — `TB-141`'in
kapattığı kalıp), ya da alan zorunlu değilse kontrol kaldırılıp beklenti belgeye yazılsın. Bugünkü hâli
"kontrol var" yanılgısı üretiyor.

✅ **Kapandı — 2026-09-16 (commit edildi, `6cefeed8`).** Kontrol artık okulun öğretmen profillerine **açık
`SchoolId` yüklemiyle** bakıyor ve görevi sona ermiş öğretmeni reddediyor; ölçüt kardeş komutla (`SetHomeroom`)
aynı. Alan zorunlu olmadığı için boş bırakmak geçerli kalıyor, yalnız **verilen** kimlik doğrulanıyor. Hata
mesajı da gerçeği söyleyecek biçimde düzeltildi. 3 test: başka okulun öğretmeni reddedilir, ayrılmış öğretmen
reddedilir, okulun aktif öğretmeni kabul edilir.
➕ Test kurulumunda **`TB-190` dersi uygulandı**: sahte bağlamda tenant alanı yansımayla kuruldu — kurulmasaydı
sorgu boş küme döner ve test iş kuralını değil kurulumun eksikliğini ölçerdi. Gerekçe test dosyasında yazılı.

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

### `TB-188` · `canEdit` iki politikayı tek boolean'da topluyor — idarenin yeni yetkileri hiçbir ekranda görünmüyor 🟠

`TB-109`/`TB-110` turunun hemen ardından ölçüldü (2026-09-16). Sunucu artık `homework.manage` taşıyan idarenin
ödevi **iptal etmesine, kapatmasına ve işaretlemesine** izin veriyor. Ama okuma yüzü açılmadı:

| Alan | Bugünkü hesap | Sonuç |
|---|---|---|
| `GetHomeworkQueryHandler:79` `canEdit` | `isOwner && status is Draft or Published` | idare için **hep `false`**, `readOnlyReason = "adminView"` |
| `GetHomeworkQueryHandler:80` / `GetHomeworkTrackingQueryHandler:113` `canMark` | `isOwner` / `resolvedView == Owner` | idare ızgarayı işaretleyemiyor |

Web (`homework-detail-screen.tsx:89`) ve mobil (`:389`) bütün eylem bloğunu `detail.canEdit` ile sarıyor;
işaretleme `tracking.canMark`'a, toplu tamamlama `!readOnly`'ye bağlı. Yani **kural sunucuda var, yüzeyde yok** —
`TB-32`'nin tersi. `TB-109`'un çözdüğü "ödev sonsuza dek kontrol bekliyor" durumu kullanıcı açısından **hâlâ
duruyor**; düzeltmenin faydası hiçbir ekrana ulaşmıyor.

**Dikkat — `canEdit`'i idareye açmak yanlış çözüm.** O alan iki ayrı politikayı tek boolean'da topluyor:
düzenleme/yayın/silme (`OwnerOnly`) ile iptal/kapatma (`OwnerOrManager`); üstelik `isReadOnly = !canEdit` ondan
türüyor. `true` yapmak idareye düzenleme ve yayın affordance'larını da açar ve salt-okunur bandını kaldırır.

⬜ Kapatma yolu: yetenek alanları **politika başına** ayrılır ve **yazma kapısının kendisiyle aynı kaynaktan**
türer (`HomeworkWriteGate`'in erişim kipi); `canMark` `OwnerOrManager`'a çekilir; `readOnlyReason`/`isReadOnly`
yeni ayrıma göre gözden geçirilir (idare "salt-okunur" değil, **sınırlı yetkili**). İstemci mock'ları ve onları
kilitleyen testler **aynı turda** güncellenmeli — yoksa mock'lu arayüzde görünen ama gerçek API'de görünmeyen
düğme doğar.

✅ **Kapandı — 2026-09-16 (commit bekliyor).** Tek kaynak: yeni `HomeworkCapabilities`; her alan **yazma kapısının
kendi erişim kipinden** türüyor, yani okuma yüzü ile kapı aynı gerçeği söylüyor. `canEdit`'in **değeri değişmedi**,
yalnız anlamı daraldı (sahip-only kol: düzenleme, yayın, taslak silme); `canCancel` ve `canClose` eklendi, `canMark`
`OwnerOrManager`'a çekildi. `isReadOnly` artık `!canEdit` değil, **"hiçbir yazma yeteneği yok"**; `readOnlyReason`'a
additive olarak `managerView` eklendi — idare yayındaki ödevde salt-okunur değil, **sınırlı yetkili**; kapanmış
ödevde `adminView` almaya devam ediyor. Bir bekçi testi idareye düzenlemenin **hâlâ kapalı** olduğunu kilitliyor.
**Asıl sürpriz yüzeyde çıktı:** web'de idare `activeRole === "admin"` ile **ayrı bir ekrana** gidiyor ve orada
"Kapat" düğmesi **hiç yoktu**, "İptal et" ekranın kendi durum tahminine bağlıydı, takip ızgarası sabit
salt-okunur bırakılmıştı. Yalnız sunucuyu düzeltmek hiçbir düğme üretmeyecekti. Mock'lar ve onları kilitleyen
testler aynı turda hizalandı. Ölçümler: `dotnet build` 0, Homework süzgeçli 318 test, api-mocks 273, core 633,
typecheck beş pakette temiz.
⬜ **Kalan iki ayak:** mobilde "Kapat" eylemi sahip için de yok ve idarenin mobil ödev yüzeyi hiç bulunmuyor;
ayrıca ödev ekranlarının hiç render testi yok, görünürlük yalnız alan düzeyinde kilitlendi.

➕ **Aynı turda bulunan ikinci kusur (düzeltildi):** `packages/core/src/homework/types.ts` içindeki
`HomeworkAuditKind` birleşimi, sözleşme yazılmadan önce **uydurulmuş** camelCase bir tahmindi
(`statusMarked`, `exemptSet`, `recordAddedAfterPublish`…) ve sunucunun `ToWire` eşlemesindeki **hiçbir değerle
eşleşmiyordu**; tüketicisi olmadığı için yıllarca sessizce yanlış kaldı ([[serilesmis-sekil-sozlesmedir]]).
Değerler sunucuya birebir çekildi, bilinmeyen tür için "Diğer işlem" yedeği eklendi (satır gizlenmiyor, ham tel
değeri basılmıyor). **Ödev denetim izinin kendisinin hâlâ hiçbir ekranı yok** — uç dün gece açıldı, tüketicisi
yazılmadı (`TB-112`'nin devamı).

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

### `TB-186` · `isSchoolDay` sezonun durumuna bakmıyor — kurulumdaki sezonun günleri ders günü sayılabiliyor 🟡

`TB-168` sunucu ölçümünde çıktı (2026-09-16). `SchoolCalendarService` (`:31-45`) bir günün ders günü olup olmadığını
yalnız `AcademicTerm` **tarih aralığından** çözüyor; sezonun ya da dönemin **durumuna bakmıyor**. Sonuç: henüz
aktifleştirilmemiş (`Setup`) bir sezonun dönemleri bugünü kapsıyorsa gün "okul günü" sayılır ve `SessionMaterializer`
o gün için yoklama oturumu üretmeye çalışır.

Aynı kalıp `TB-179`'un (c) ayağının kardeşi: **tarih ekseni ile durum ekseni iki ayrı gerçek üretiyor.**

⬜ Kapatma yolu: ders günü çözümü sezon/dönem durumunu da okusun (tek kural, tek yer); `TB-179`'un dönem çözümüyle
birlikte ele alınmalı. Önce ölçülmeli: `SessionMaterializer` dönem durumuna ayrıca bakıyor mu, yani belirti bugün
gerçekten oluşuyor mu.

✅ **Kapandı — 2026-09-16 (commit bekliyor).** **Ölçüm önce yapıldı:** `SessionMaterializer` dönem/sezon durumuna
ayrıca bakmıyor (tek kapı `IsSchoolDayAsync`) ve günlük süpürme işi bütün okulları geziyor; ama oturum üretimi
ayrıca **yayınlanmış bir program** istiyor, o yüzden yeni açılmış okulda oturum doğmuyor. Buna karşılık **bugün
yanlış cevap veren beş yüzey** var: canlı pano, gün ders saatleri, tarih eksenli nöbet, kaydedilmemiş oturumlar ve
günlük kapatma işi — hepsi aynı kapıyı okuyor, yani kurulumdaki sezonun günleri "ders günü" sayılıyor.
**Kapı sezonun durumu oldu (`Active`), dönemin değil.** Gerekçe: dönem durumunu kapı yapmak, `TB-179`'un açık
ayağı yüzünden (2. dönemi başlatacak günlük iş henüz yok) 2. dönem elle başlatılana kadar yoklamayı **tamamen
durdururdu** — ölçülmemiş bir kural için çalışan bir yüzeyi kırmak olurdu. Sezon `Active` değilken okul günü
olmadığı ise tartışmasız.
Kural yeni `AcademicCalendarRules`'ta: tarih kapsama cümlesi tek yerde yaşıyor ve **`TB-179`'un aktivasyon yolu ile
okuma yolu aynı cümleyi okuyor** — tarih ekseni ile durum ekseni artık yapısal olarak ayrışamıyor. 6 test, içlerinde
"dönem `NotStarted` olsa da `Active` sezon ders günü üretir" regresyon bekçisi var.

### `TB-185` · Sezonsuzluk cevabı bir saat önbellekte yapışıyor; sezonu açan yollar anahtarı temizlemiyor 🟡

`TB-168` sunucu ölçümünde çıktı (2026-09-16). `GetCurrentSession` sorgusu `[Cacheable]` ve **başarısız sonuç da
önbelleğe yazılıyor** (`CachingBehavior`), yani `NO_ACTIVE_SESSION` 404'ü `tenant:{schoolId}:current-session`
anahtarında **1 saat** duruyor. Anahtarı yalnız dört domain olayı temizliyor; **sezon oluşturma, taslaktan açma,
kurulumu iptal ve yeniden adlandırma temizlemiyor.**

Belirti: müdür sezonu açar, ekran bir saate kadar "sezon yok" demeye devam eder. Gece turunda iki kez ısırdı
(bildirim göçünden sonra `notification-config`, tatil düzeltmesinden sonra `holidays:*` elle temizlenmek zorunda
kaldı) — bu, `TB-183`'ün kardeşi ve aynı sınıfın üçüncü örneği.

İkinci ayak: `/current` ucunun 404'ü controller'a gömülü özel bir dal; `NO_ACTIVE_SESSION` kodunu
`ResultExtensions.MapStatusCode` **tanımıyor** — aynı kodu başka bir handler döndürürse 422 alır.

⬜ Kapatma yolu: sezonun durumunu değiştiren **her** yol anahtarı düşürsün (tercihen tek bir yerden, olay
listesine güvenmek yerine); başarısız sonucun önbelleğe yazılıp yazılmayacağı bilinçli bir kural olsun; hata kodu
merkezî eşlemeye taşınsın.

✅ **Kapandı — 2026-09-16 (canlı doğrulama sürüyor, commit bekliyor).** Üç kusurun üçü de kapatıldı:
1. **Temizlik olaya değil, yazılan satıra bağlandı.** Yeni `CacheInvalidationInterceptor` (EF
   `SaveChangesInterceptor`): değişiklik kümesi `SavingChangesAsync`'te toplanıyor (kayıttan sonra `ChangeTracker`
   "ne değişti"yi bilmez), anahtarlar `SavedChangesAsync`'te düşüyor — başarısız `SaveChanges` hiçbir anahtar
   düşürmüyor. Eşleme tek yerde (`CacheInvalidationRules`). **Bu kapıyı atlamak için EF'i baypas etmek gerekir**;
   eski beyaz liste yaklaşımı yerine seçilmesinin sebebi bu. Anahtar tenant'ı satırın kendisinden alıyor, ambient
   bağlamdan değil — arka plan işleri okuldan okula gezerken doğru okul satırdadır. Eski olay handler'ı silindi;
   iki mekanizma bırakmak yamalama olurdu.
2. **Başarısız sonuç artık bilinçli kural:** `[Cacheable]`'a `CacheFailures` eklendi, **varsayılan `false`**.
   Gerekçe belgede: bir sorgunun başarısızlığı neredeyse her zaman durumsaldır ve kullanıcının bir sonraki
   hamlesiyle değişir; başarısızlığı saklamak, kullanıcıya **kendi yaptığı değişikliği göstermemektir**.
3. `NO_ACTIVE_SESSION` merkezî `MapStatusCode`'a taşındı, controller'daki özel dal kaldırıldı; cevap gövdesi aynı.

Testler: `CachingBehaviorFailureTests` 3, `CacheInvalidationRulesTests` 4, `ResultExtensionsAcademicSessionsTests` 2.
⬜ **`TB-183` bu turda kapanmadı, ölçüldü:** tatil okuyucusu hâlâ `IMemoryCache` kullanıyor, yeni kapı Redis
anahtarlarını düşürüyor — süreç içi önbelleğe dokunmuyor. Okuyucu `ICacheService`'e geçirilirse
`CacheInvalidationRules`'a tek satır eklemek yetecek; iskelet buna hazır.
⬜ **Göç ya da elle SQL bu kapıdan geçmez** — "veriyi göçle değiştiren turda anahtarı elle temizle" kuralı
geçerliliğini koruyor (interceptor belgesinde yazılı).

✅ **Canlı doğrulandı (2026-09-16).** Seed okulda ürünün kendi yollarıyla ölçüldü: anahtar `GET current` ile
oluşuyor (tenant'ı kendisi taşıyor, TTL 3600); **sezon oluşturma** (eski listenin kaçırdığı birinci yol) anahtarı
düşürdü, sonraki okuma taze değeri yazdı; **yeniden adlandırma** (dördüncü yol) yine düşürdü. Eski kodda bu anahtar
bir saat yerinde kalırdı. Sezonsuz okulda (`PLT-DOGRULAMA`) iki `GET current` çağrısı yapıldı → **sıfır anahtar**,
yani `CacheFailures=false` canlıda çalışıyor; 404 da artık **merkezî eşlemeden** geliyor. Elle SQL'in interceptor'ı
tetiklemediği de canlı görüldü (belgelenmiş sınırın örneği). Altınay'a dokunulmadı.
**Bilinçli yan etki:** kural "sezon/dönem satırına dokunan her yazma" olduğu için temizlik muhafazakâr — güncel
olmayan bir sezon değişse de anahtar düşüyor. Bedeli bir fazladan okuma, kazancı "asla bayat cevap".

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

### `TB-183` · Tatil önbelleği iki ayrı depoda: okuyucu süreç içi, temizleme Redis'te 🟡

`TB-176`/`TB-177` düzeltmesinde ölçüldü (2026-09-16). `HolidayCalendarReader` okuduğunu **`IMemoryCache`**'e
(süreç içi) yazıyor; tatil CRUD handler'ları ise değişiklikten sonra **`ICacheService` (Redis)** üzerinden
`holidays:reader:{schoolId}` anahtarını siliyor. İki ayrı depo olduğu için **bu temizleme okuyucunun önbelleğini
hiç boşaltmıyor**; tutarlılığı sağlayan tek şey okuyucunun 5 dakikalık TTL'i.

Görünen belirti: müdür tatil ekleyip sildikten sonra yoklama takvimi 5 dakikaya kadar eski cevabı verebilir.
Aynı sınıfın kardeşi bu gece iki kez daha çıktı: bildirim göçünden sonra Redis `notification-config` bayat kaldı,
tatil göçünden sonra hem Redis hem süreç içi önbellek elle temizlenmek zorunda kaldı.

⬜ Kapatma yolu: okuyucu ile temizleyen taraf **aynı önbellek soyutlamasını** kullansın (tercihen `ICacheService`,
çok örnekli çalışmada süreç içi önbellek zaten yanlış cevap verir); anahtar adı tek yerde tanımlansın. Ayrıca
veriyi göçle değiştiren her turda ilgili anahtarların temizlenmesi kural hâline gelmeli.

✅ **Kapandı — 2026-09-16 (commit bekliyor), üstelik iki kusur daha çıktı ve aynı satırla kapandı.**
Okuyucu `ICacheService`'e geçti, anahtar tek yerde tanımlandı (`tenant:{schoolId}:holidays:reader`, tenant'ı
kendisi taşıyor). Temizleme `TB-185`'in interceptor iskeletine bağlandı — **anahtar değil önek ile**, çünkü
tatilden beslenen ikinci tüketicinin anahtarı parametreli; tek tek saymak yine beyaz liste olurdu. Altı
handler'daki elle silmeler kaldırıldı (iki mekanizma bırakmak yamalama olurdu) ve o adla hiçbir yere yazılmayan
**hayalet silmeler** temizlendi.
**Ölçümde çıkan iki kusur:**
1. Ayar ekranının tatil listesi anahtarı (TTL **24 saat**) hiç düşürülmüyordu — müdürün eklediği tatil ayar
   listesinde **bir güne kadar** görünmeyebiliyordu.
2. Önbellek, **istenen aralığa göre çözülmüş** resmî tatilleri saklıyordu; başka aralıklı ikinci bir çağrı kendi
   yılının resmî tatillerini göremiyordu (gizil kusur). Artık aralıktan bağımsız ham satırlar saklanıyor, çözüm
   her çağrıda yapılıyor — bu şekil hatası yapısal olarak imkânsız.
**TTL 5 dk → 1 saat:** 5 dakika bir *tutarlılık* mekanizmasıydı (bayatlığın üst sınırı); artık tutarlılığı yazma
yolu sağlıyor, TTL yalnız emniyet ağı — resmî tatil kataloğu `MasterEntity` olduğu için interceptor'dan geçmiyor,
göç ve elle SQL de geçmiyor.
**Maliyet ölçüldü:** tüketiciler günü gün **döngüde** soruyor (bir rapor ucu 7–31 çağrı, günlük kapatma işi okul ×
gün). Süreç içi önbelleği kaldırmak her çağrıyı ayrı Redis turuna çevirirdi; okuyucuya **istek ömürlü memo**
kondu — iş birimi başına okul başına tek tur, iki istek arasında bayat cevap üretmiyor.
**Canlı ölçüm** (seed okul): tatil eklenince anahtar düşüyor ve aynı uç **anında** yeni cevabı veriyor, silince de
öyle; başka okulun anahtarı etkilenmiyor. 78 birim testi + 65 mimari bekçi yeşil.
⬜ **Kalan:** resmî tatil kataloğunun kendisi hâlâ kapı dışında (emniyet ağı 1 saatlik TTL); entegrasyon takımı
bellek kısıtı yüzünden koşulmadı, sadeleşen iki test ilk gerçek koşuda gözden geçirilmeli.

### `TB-182` · Entegrasyon fixture'ı `IPlatformContext`'i kaydetmiyor — 22 test kırmızı 🟠

`TB-175` düzeltmesinin entegrasyon koşusunda ölçüldü (2026-09-16): **1453 testten 22'si kırmızı**, hepsi aynı
istisnayla — `Unable to resolve service for type 'IPlatformContext' while attempting to activate 'TenantContextBehavior'`.
Kırmızıların tamamı `SchoolSettingsAcademicEndpointsTests` ve iki akademik politika testi; hiçbiri o turda değişen
koda dokunmuyor.

**Kök neden:** `K-27` platform dilimi (`28366cca`) `TenantContextBehavior`'a `IPlatformContext` bağımlılığı ekledi;
entegrasyon fixture'ı bu servisi **hiç kaydetmiyor** (`grep` ile doğrulandı). Yani üretim hattı doğru, testin kurduğu
kap eksik. Düşüş `master`'a merge edilmiş durumda ve gece turundaki her entegrasyon koşusunda tekrarlandı.

Aynı sınıfın dersi `TB-180`'de de çıktı: **koşulmayan ya da kalıcı kırmızı bırakılan bekçi, bekçi değildir** — 22
kırmızı, gerçek bir düşüşü de gürültüye gömer.

⬜ Kapatma yolu: entegrasyon fixture'ına `IPlatformContext` kaydı (üretimdeki kayıtla aynı ömür ve davranış; okul
bağlamıyla koşan testlerde platform bağlamı boş olmalı). `K-27` dilimini yazan oturuma yönlendirilmeli.

✅ **2026-09-16 · kapandı (gece turu, commit bekliyor).** İki harness (`NotificationMatrixEndpointsTests`,
`SchoolSettingsAcademicEndpointsTests`) yalnız `AddApplication()` çağırıyordu; ikisine de üretimdekiyle **aynı ömürde
(scoped)** `FakePlatformContext` kaydı eklendi (`IsPlatformRequest = false`, `PlatformAccountId = null`).
Entegrasyon takımı **22 kırmızıdan 1'e** indi; kalan tek kırmızı bu iki dosyayla ilgisiz (`TB-184`).

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

### `TB-150` · Devamsızlık'ın resmî yazı kuralı TÜM uygulamanın çıktısını gizliyor 🔴

Ekran testinde yakalandı (2026-09-14, A7): sınav takviminin *"Yazdır"* düğmesi tarayıcı
önizlemesini açıyor ama önizleme **bembeyaz** — tek boş A4, altında `localhost:3000/exams 1/1`.
Oysa diyaloğun arkasındaki ekranda kâğıt doğru çizilmiş durumda.

**Kök sebep — başka bir modülün kapsamsız baskı kuralı.** `threshold-letter.css`
(Devamsızlık › Eşik Aşımı Resmî Yazısı) şunu taşıyor:

```css
@media print {
  body > *:not(.tl-print-root) { display: none !important; }
}
```

Resmî yazı `document.body`'e portal atıldığı için kabuğu boşaltması doğrudur — **ama kural
o ekranın açık olmasına bağlı değil.** `globals.css` tüm stilleri tek pakette yüklüyor, yani
bu satır **her sayfada** yürürlükte. Uygulama kabuğu da `body`'nin doğrudan çocuğu
(`body > div.shell`). Sonuç: **hangi ekrandan basılırsa basılsın `.shell` `display:none`
oluyor** ve kâğıda hiçbir şey düşmüyor.

**Tarayıcıda ölçüldü** (Playwright, `emulateMedia({media:'print'})`, yönetici oturumu,
1. Sınav panosu → Yazdır görünümü):

| Ölçüm | Düzeltmeden önce | Sonra |
|---|---|---|
| `.shell` `display` | **`none`** | `block` |
| Belge yüksekliği | 823 px (tek görüntü alanı) | 2271 px |
| `.ex-pr-sheet` sayısı | 5 (DOM'da var, kâğıtta yok) | 5 |
| Üretilen PDF | boş | **5 sayfa, şube başına bir sayfa** |

**Kapsam tek modül değil.** Kural genel olduğu için yazdırma stili olan her yüzeyi
vuruyordu: sınav takviminin dört çıktısı (şube takvimi · kapı listesi · oturma planı ·
gözetmen çizelgesi) ve **Ders Programım** (`schedule-read.css`). İkisi de kendi
`@media print` bloğunu doğru yazmıştı; hiçbiri iş görmüyordu.

**Neden bugüne kadar görülmedi:** her iki ekranda da "yazdır" bir ÖNİZLEME görünümü açıyor
ve önizleme ekranda doğru çiziliyor. Doğrulama orada durmuş, **kâğıt hiç üretilmemişti**
(krş. [[besleyen-yuzey-olculmeden-kapanmaz]]). Bu, modülün Faz 1 çıktısının da hiç
çalışmamış olduğu anlamına gelir.

**İkinci, daha küçük kusur aynı turda ölçüldü:** kabuk `body { overflow: hidden }` ile
kilitli (ızgara `100vh`, kaydırma `.main`'de) ve gövdedeki taşma bildirimi CSS gereği
görüntü alanına yayılıp baskıda belgeyi tek sayfaya kırpıyor. Kabuk gizlenmeseydi bile
çıktı tek sayfada kalacaktı.

✅ **Düzeltildi** (`oksis-ui`, 2026-09-14):

1. `threshold-letter.css` kuralı sahibine bağlandı —
   `body:has(.tl-print-root) > *:not(.tl-print-root)`. Resmî yazı açıkken davranış
   birebir aynı (portal `body`'nin doğrudan çocuğu), kapalıyken kural hiç yok.
2. `shell.css`e tek bir **baskı tabanı** kuruldu: `html, body { overflow: visible;
   height: auto }`, ızgaranın çözülmesi, gezinme parçalarının gizlenmesi. `exam.css` ve
   `schedule-read.css` kopyaladıkları kabuk ezmelerini bıraktı, yalnız kendi parçalarını
   gizliyor. Blok dosyanın SONUNDADIR — `.shell { display: grid }` ile aynı özgüllükte
   olduğu için ondan sonra gelmek zorunda (başa konduğunda ızgara kazanıyordu, bu da
   ölçüldü).

Merkezî kapanış, [[yamalama-kabul-degil]] gereği.

✅ **Kalan ayak ölçüldü (2026-09-15).** Kapsam daraltmasının davranışı değiştirmediği
`emulateMedia({media:'print'})` altında İKİ YÖNDE birden doğrulandı:

| Durum | `.shell` | `.tl-print-root` |
|---|---|---|
| Baskı · resmî yazı KAPALI | `block` — kâğıda düşer | — |
| Baskı · resmî yazı AÇIK | `none` — gizlenir | `block` — kâğıda düşer |
| Ekran | `grid` | — |

Uygulanan kural sayfadan okundu: `body:has(.tl-print-root) > :not(.tl-print-root)
{ display: none !important }`. Yani resmî yazı açıkken kabuk eskisi gibi boşalıyor,
kapalıyken kural hiç yok.

⬜ **Yine de ölçülmeyen bir şey kaldı ve sebebi ürün değil VERİ:** yazının kendi
gövdesinin kâğıttaki dizilimi. "Resmî Yazı (PDF)" düğmesi yalnız eşik AŞILMIŞ öğrencide
açılıyor (`thresholdLevel(...).level === "over"`) ve dev verisinde böyle bir öğrenci yok —
en yüksek devamsızlık **1 gün**, sınır **30**. `absence_summaries` satırını elle
büyütmek de işe yaramıyor: `unexcusedDays` özet satırından değil,
`AbsenceDayBreakdownResolver.CalculateAbsentDaysAsync` ile yoklama KAYITLARINDAN canlı
hesaplanıyor; düğmeyi açmak için ~31 gerçek devamsızlık kaydı uydurmak gerekir.

**Bu kendi başına bir tohum boşluğudur** ve `TB-143`'ün sınav tarafında yaptığının aynısını
yapıyor: kural değil, kuralın DOĞRULANABİLİRLİĞİ kapalı. Devamsızlık tohumuna eşik aşmış
tek bir öğrenci eklemek, resmî yazının bütün yüzeyini teste açar.

**Ders:** bir modülün `@media print` kuralı `body > *` gibi kökten seçici kullanıyorsa,
kendi kökünün varlığına bağlanmadıkça **uygulamanın tamamının** kuralıdır.

✅ **2026-09-16 · veri ayağı da yazıldı (gece turu, commit bekliyor).** Eşik mektubunu gösterecek öğrenci artık
dev seed'den geliyor: yeni `AttendanceThresholdDevSeeder` yalnız `DEV-OKUL`'a, şubesi olan ilk aktif öğrenciye,
okulun kendi `UnexcusedAbsenceLimit + 1` kadar hafta içi gününe `Completed` oturum ve `Absent` kayıt üretiyor
(şubenin geri kalanı `Present`). Özet satırını elle büyütmek **işe yaramıyordu**: `unexcusedDays` canlı olarak
yoklama kayıtlarından hesaplanıyor. Idempotent (sentetik `PlacementId` + tekil indeks), yan etkisiz (üretilen
domain olayları kaydetmeden düşürülüyor → seed veli bildirimi göndermiyor), gelecek tarihli oturum üretmiyor,
**Altınay dâhil diğer okullara dokunmuyor**. Entegrasyon testi ürünün kendi gün-eşdeğeri hesabıyla sınırın
aşıldığını, ikinci koşumun satır eklemediğini ve verilmeyen okula yazmadığını birlikte ölçüyor — yeşil.
⬜ **Kalan:** dev DB yeniden seed edilmedi; seeder bir sonraki dev API açılışında kendiliğinden koşacak. Resmî
yazının kâğıttaki dizilimi ancak ondan sonra gözle ölçülebilir.

### `TB-142` · Alt-eylem (`:fiil`) yolu bir konumda yönlenmiyor — sessiz 404 ⚪

Faz 2b'nin uçtan uca doğrulamasında ölçüldü (2026-09-13, çalışan API):

| Yol | Ham iki nokta | `%3A` |
|---|---|---|
| `POST exams/windows/{id}:publish-window` | ✅ yönleniyor (422 = handler'a ulaştı) | — |
| `POST exams/windows/{id}:open-review` | ✅ yönleniyor | — |
| `POST exams/review-comments/{id}:resolve` | ❌ **404, `Content-Length: 0`** (yönlendirme 404'ü, handler'ın değil) | ✅ 200 |

İkisi de aynı kalıpta (`{param:guid}` + literal `:fiil`) yazılmıştı; biri yönleniyor,
öteki yönlenmiyor. **Neden ölçülmedi** — fark ya `review-comments` literalindeki tireden
ya da rota ağacındaki konumdan geliyor olabilir; iki hipotez de denenmedi.

**Ürün etkisi gerçekti:** istemci iki noktayı kodlamadan gönderir (`openapi-fetch` yol
parametresini yerine koyar, literali kodlamaz), yani uç üründe **ölü** olurdu. Birim
testleri yakalayamazdı: onlar `fetch`'i taklit ediyor, rota ağacını değil.

✅ Kapatıldı 2026-09-13: yol düz alt-kaynağa çevrildi
(`review-comments/{id}/resolve`). Alt-eylem kalıbı pencere komutlarında olduğu gibi
KALIR — orada ölçülmüş biçimde çalışıyor.

✅ **Açık soru kapandı (2026-09-15) — ve cevap bulgunun kendisini hükümsüz kıldı.**
Eski rota geçici olarak geri konup gerçek sunucuda denendi:

| Yol | Sonuç |
|---|---|
| `review-comments/{id:guid}:resolve` | **401** — yönleniyor |
| `hour-requests/{id:guid}:answer` | **401** — tireli literal de suçsuz |
| `windows/{id:guid}:publish-window` | 401 |

**404'ün sebebi rota ağacı değil KABUKTU.** zsh'de `$id:resolve` yazıldığında `:r` bir
parametre düzenleyicisidir ("uzantıyı at") ve URL `<guid>esolve`ye dönüşür — var olmayan
yol, yönlendirme 404'ü. `:publish-window` ve `:open-review` bozulmamıştı çünkü `:p` ve `:o`
düzenleyici değil; `%3A`'nın "çalışması" da aynı sebeple, iki nokta kalmıyordu. İki
hipotez de (tireli literal / rota ağacındaki konum) yanlıştı.

Düz alt-kaynak yolu **yine de korunuyor**: istemci ve sözleşme ona geçti, geri döndürmek
bedava değil. Değişen tek şey gerekçe.

**Ders:** kabuk değişkeniyle kurulan URL'de iki nokta varsa `${}` ile sarmalanmalı;
sarmalanmazsa ölçüm sunucuyu değil kabuğu ölçer. `oksis-api` `f399c8ea`.

---
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

### `TB-123` · "Canlı program" yüklemi depoda on yerde elle yazılı 🟡

"Bu yerleşim geçerli mi" sorusunun cevabı — `IsActive && IsReserving` — kod tabanında **on
ayrı yerde** elle yazılıyor. Ortak bir yüklem, uzantı metodu ya da okuyucu yok.

Semantik bugün her yerde doğru; bulgu davranış değil **dayanıklılık**. Yükleme üçüncü bir
koşul eklendiğinde (ör. taslak program sürümü, geçici değişiklik penceresi) on çağrı yerinin
onunu da bulmak gerekiyor ve biri atlanırsa sessizce yanlış sonuç doğar — hata değil,
**eksik satır**.

Sınıfı tanıdık: `TB-119` aynı şeydi. Orada "hangi şube hangi dersi alıyor" iki yerde ayrı
tanımlanmıştı; sayaçlar çatallandı ve boş bir sınav penceresi yayın kapısından geçti. Bu
madde 2026-09-09'da Faz 2a Görev 2.4'ün gözden geçirmesinde sayıldı — o görev yüklemi
`ExamExpectationReader`'dan birebir aldığı için **on birinci kopya açılmadı**.

⬜ Kapatma yolu: yüklemi tek bir yere çıkarmak (`LessonPlacement` üzerinde bir `static
Expression<Func<LessonPlacement, bool>> IsLive` ya da paylaşılan bir uzantı) ve on çağrı
yerini ona bağlamak. Mekanik ama geniş; ayrı bir tur ister. Ara koruma olarak, ham
`IsReserving` kullanımını sayan bir mimari bekçi testi ucuz olur.

✅ **2026-09-16 · kapandı (gece turu, commit bekliyor).** `LessonPlacement` üzerinde EF'in çevirebildiği
`static Expression<Func<LessonPlacement,bool>> IsLive` + **aynı ifadeden derlenen** `IsLiveNow(...)` (bellekteki
koleksiyonlar için; yüklem ikinci kez yazılmıyor). **Site sayısı defterdekinden fazla çıktı: 10 değil 15** —
`TeachingSlotReader` tek başına dört sorgu taşıyor ve `AutoGenerateScheduleJob` hiç sayılmamıştı; 15'in 15'i
bağlandı. Dokunulmayan tek yer `ExamExpectationReader.ReadExcludedAsync`: orası yüklemin **negatifi** ve ayrım
bilinçli olarak bellekte yapılıyor — bekçide gerekçeli muafiyet. Ara koruma da yazıldı: `LivePlacementPredicateTests`
ham `IsReserving` kullanımını üç muaf dosya dışında yasaklıyor. `X-06` dersine karşılık, ifadenin gerçekten SQL'e
indiği **gerçek sağlayıcı** testiyle ölçüldü (`ScheduleProgramStatsRecomputer`'daki riskli `AsQueryable().Where(...)`
çevirisi dâhil yeşil).

---
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

---
### `TB-121` · Göçler hiçbir testte koşmuyor — entegrasyon fixture'ı modeli kuruyor ⚪

`DatabaseFixture` veritabanını `EnsureCreatedAsync()` ile kuruyor: şema **EF modelinden**
üretiliyor, göç dosyalarından değil. Sonucu şu — 1070 entegrasyon testinin hiçbiri göçün
`Up()` gövdesini koşturmuyor, `Down()` ise hiç koşturulmuyor.

Pratik anlamı: modelle göç arasında bir sapma (elle düzeltilmiş bir göç, unutulmuş bir kolon,
yanlış `DeleteBehavior`) **bütün testlerden geçer** ve yalnız gerçek veritabanında ortaya
çıkar. Bugün açığı kapatan tek şey, geliştiricinin `dotnet ef database update` çalıştırması —
ki o da otomatik değil ([[Göçler otomatik uygulanmıyor]], 2026-09-09'da yine elle koşuldu).

2026-09-09'da Faz 2a Görev 1.3'ün gözden geçirmesinde ölçüldü: "dizin testi göçü değil modeli
doğruluyor". O turda göç gerçek geliştirme veritabanına uygulandı, yani `Up()` fiilen koştu;
kanıtsız kalan `Down()` ve genel olarak model↔göç eşitliği.

⬜ Kapatma yolu tek değil, bu yüzden karar gerekiyor: (a) fixture'ı `MigrateAsync()`'e çevirmek —
şemayı göçlerden kurar, sapmayı imkânsızlaştırır, ama 1070 testin kurulum süresini uzatır;
(b) tek bir "model ile göç eşit mi" bekçi testi — `dotnet ef migrations has-pending-model-changes`
karşılığı, ucuz ama `Down()`'ı yine kapsamaz. **Tercih verilmeden başlamak yanlış.**

✅ **Karar (2026-09-16, kullanıcı): (b) bekçi testi.** "Model ile göçler eşit mi" sorusunu soran ucuz bir bekçi
eklenecek; 1400+ entegrasyon testinin kurulum süresi uzamayacak. `Down()` tarafının sınanmadığı **bilinçli olarak
kabul edildi** ve bu maddenin açık ayağı olarak kalır.

✅ **Uygulandı — 2026-09-16 (commit bekliyor).** `tests/Oksis.Tests/Architecture/MigrationsMatchModelTests.cs`:
`Database.HasPendingModelChanges()` (EF Core 10'un gerçek public API'si, belgeden doğrulandı) sahte bağlantı
dizgisiyle kurulan bağlamda çalışıyor — **veritabanı istemiyor**, bağlantı hiç açılmıyor. Konum bilinçli:
`test-changed.sh` `Oksis.Tests`'i yalnız `--integration` ile seçiyor **ama** `Architecture/` altındaki bekçileri
her koşumda ayrıca süzgeçle çalıştırıyor. `UseSnakeCaseNamingConvention()` zorunluydu; olmasaydı bekçi gerçek
sapma olmadan her tabloyu farklı sayardı.
**Kırmızı kanıtı alındı** (bekçi, kanıtlanmadan bekçi sayılmaz): modele geçici bir gölge kolon eklendiğinde
takım **1 kırmızı** verdi ve mesaj ne yapılacağını söyledi — "EF modeli ile göç dosyaları AYRIŞTI… Entegrasyon
testleri bunu YAKALAMAZ… `dotnet ef migrations add` … ardından üretilen göçü OKUYUN". Gölge kolon geri alınınca
yeşile döndü; depoda sonda izi kalmadı. Mimari bekçi sayısı 9 → 10.

---
### `TB-120` · Şubenin dersliği zorunlu değil, türetme yapan her yer boşa düşüyor ⚪

`ClassRoom.RoomId` **nullable**. Şubenin fiziksel dersliği tanımlanmamış olabiliyor ve bunu
zorlayan bir kural yok — ne oluşturmada, ne şube sihirbazında, ne de okul kurulumunda.

Bugün bunun iki görünen sonucu var: sınav takvimi etiketleri `roomName: null` dönüyor
(Faz 1'de kapatılmadı), ve kelebek oturumunun derslik kümesi şubelerin kendi sınıflarından
türediği için (2026-09-09 kararı) derslik tanımsız olan şube oturuma derslik getiremiyor.
Türetmenin dayandığı alan isteğe bağlı olduğu sürece bu sınıf bulgu her yeni tüketicide
tekrar doğar.

Kullanıcı kararı (2026-09-09): **kural şubenin dersliğinin zorunlu olması yönünde**, ama iş
sınav takvimi modülünün içinde YAPILMAYACAK — modül bitince kendi turunda ele alınacak.

⬜ Kapatma yolu: alanın zorunluya çevrilmesi (göç + mevcut boş satırların doldurulması),
şube oluşturma/düzenleme akışlarında kapı, ve türetme yapan tüketicilerin (`Exams`,
`Timetable`) boş hâl dallarının kaldırılması. Kelebek oturumu bu kapanana kadar eksik
derslik için yöneticiye elle ekleme sunar — geçici köprü, kalıcı çözüm değil.

- 🔍 **Kullanıcı bulgusu turu (2026-09-20)**: *"Şube eklerken derslik sorulmuyor, sadece edit
  panelde seçilebiliyor; ekleme sırasında seçilebilmeli hatta zorunlu olmalı."* Aynı bulgunun
  ekran ayağı; kullanıcı kapsamı **tam TB-120** olarak onayladı.
- 🔍 **Ölçüm bulgunun tahmininden ağırdı** *(dev DB, 2026-09-20)*: 96 şubenin **71'i**
  dersliksizdi ve iki okulda atanacak oda bile yoktu (24 şube / **0** oda; 29 şube / 5 oda).
  Yani "mevcut odalardan birini ata" diye bir göç yolu yoktu — göç odayı da üretmek zorundaydı.
- ✅ **KAPANDI** *(`oksis-api` + `oksis-ui`, 2026-09-20)*:
  - **Kural tipe taşındı:** `ClassRoom.RoomId` artık `Guid` (nullable değil), `Create` derslik
    almadan çağrılamıyor, `RemoveRoom()` **silindi** (boşaltma yolu şubeyi geçersiz hâle
    sokardı), kolon `NOT NULL`. Boşaltan uç (`DELETE /class-rooms/{id}/room`) ve
    `RemoveClassRoomRoomCommand` kaldırıldı; `PUT .../room` artık "ata" değil "değiştir".
  - **Göç veriyi de üretiyor:** dersliksiz her şube ETİKETİ için (okul + `full_name`) bir oda
    açılır, aynı etiketi taşıyan bütün sezonların şubeleri o odaya bağlanır; aynı kodla oda
    varsa yenisi üretilmez. EF'in yazdığı `defaultValue: Guid.Empty` **bilinçli kaldırıldı** —
    sıfır GUID, FK'yi bozan ya da var olmayan dersliği gösteren "dolu" satır üretirdi.
  - **Yazma yollarının tamamı kapandı:** `POST /class-rooms` artık `roomId` istiyor ve odayı
    doğruluyor (bu okulun mu, aktif mi — `SetClassRoomRoom` ile aynı ölçüt); sezon devri hedef
    şubenin dersliğini kaynak sezondan çözüyor (önce aynı ETİKET, sonra kaynak şubenin odası;
    çözülemezse sezon açılmaz ve şube adıyla söylenir); dev seeder şube başına oda üretiyor.
  - **Boş hâl dalları kalktı:** `ExamRoomDeriver.DerivationResult.ClassRoomsWithoutRoom`,
    besteleme raporundaki karşılığı, "ev dersliği tanımlı olmayan şubeler…" uyarısı ve oturum
    DTO'sundaki `classRoomsWithoutRoom` alanı (FE tipiyle birlikte) silindi. Elle derslik
    ekleme **duruyor** — o kapasite içindir, dersliksiz şube köprüsü değildi.
  - **Ekran:** Yeni Şube ve Toplu Şube Aç formlarında derslik seçici; toplu açmada derslik
    şube BAŞINA sorulur (tek odayı hepsine dayatmak fiziksel olarak yanlış veri üretirdi).
- 🔍 **Uygulama sırasında yakalanan tuzak (aynı gün):** sezon devrinde derslik, hedef şubenin
  ETİKETİNDEN çözülüyor. İlk yazımda anahtar `ToUpperInvariant()` ile kuruluyordu; oysa
  `ClassRoom.NormalizeSection` yalnız **tek harfli** adları büyütür, serbest adlar ("Papatya")
  olduğu gibi saklanır. Kaçak veritabanında görünmezdi (collation harf duyarsız) — yalnız
  bellekteki sözlükte olurdu ve serbest adlı şubesi olan okulda devir "dersliği çözülemedi"
  diye dururdu. Anahtar iki tarafta da büyütülerek kapatıldı.

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

---

### `TB-205` · İndirme başlığı kontrol karakterini süzmüyordu — dosya adı başlığı ikiye bölebiliyordu 🟠

Müfredat Dilim 2'de merkez belgesinin imzalı indirme adresi üretilirken ölçüldü (2026-09-20).
`ContentDispositionBuilder.BuildAttachment` ASCII yedeğini üretirken süzgeci `c < 128` idi;
CR, LF ve NUL da ASCII olduğu için **geçiyordu**. `karar\r\nx-injected: 1.pdf` adlı bir dosya
`Content-Disposition` başlığını ikiye bölebilir (header injection). Kurucu yalnız müfredatta
değil, **okul dosyalarının indirme yolunda da** kullanılıyor
(`GetFileDownloadUrlQueryHandler`, `S3CompatibleStorageService`).

Ölçüm: aynı adla imzalı adres istendiğinde depo (Garage) isteği **400** ile reddetti — yani kırık
başlık gerçekten dışarı çıkıyordu. Dosya adı kullanıcı girdisidir (yükleme sırasında serbest
metin), dolayısıyla bu bir teorik risk değildi.

✅ **Kapandı** (aynı gün, `oksis-api` `a6da46d5`, dal `feat/mufredat-belge-onay`). Süzgeç
`c is >= ' ' and < (char)127` oldu; kontrol karakterleri `_` ile değişiyor. Kanıt:
`ContentDispositionBuilderTests.Control_characters_never_reach_the_header` (CR/LF, NUL, DEL) ve
`CurriculumSourceStorageTests.File_name_cannot_inject_headers` (gerçek Garage üzerinden).
Türkçe ad yolu korunuyor: ASCII yedek + RFC 5987 `filename*=UTF-8''` birlikte veriliyor.

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

### `TB-204` · `ExpireStaleInvitationsJobTests` koşu sırasına bağlı — iş paylaşılan DB'deki bütün okulların davetini sayıyor ⚪

`TB-203` teşhisinde ayrı görüldü (2026-09-18). `ExpireStaleInvitationsJobTests.cs:85` 2 bekliyor, 5
görüyor: iş paylaşılan fixture veritabanındaki **tüm** okulların süresi geçmiş davetlerini tarıyor, sonuç
önceki testlerin bıraktığı davetlere bağlı. Birleştirmeyle ilgisi yok; üretim davranışı doğru (iş zaten
tüm okulları taramalı).

⬜ Test `expiredCount` toplamını değil, yalnız kendi oluşturduğu davetlerin durumunu doğrulasın.

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

### `TB-207` · Rehberlik saati ortaöğretim çizelgesinde müfredat satırı olarak görünmüyor ⚪

Müfredat Dilim 3 ayrıştırıcısı, MEB çizelgesinin "REHBERLİK VE YÖNLENDİRME" satırını iki
çizelge ailesinde farklı sınıflandırıyor ve bu **kaynağın kendisinden** geliyor: ilköğretim
çizelgesinde satır zorunlu ders bloğunun içinde (ders), ortaöğretimde toplam bloğunun bir
bileşeni (beyan). Ayıran şey konum, ve ayrım doğru — ama sonucunda ortaöğretimde haftada
1 saatlik rehberlik ara alana **satır olarak girmiyor**.

Bugün bunun görünür bir zararı yok: sezon toplam saati snapshot'tan okunuyor ve okul o saati
kendi ek dersi olarak yazabiliyor. Ama "MEB 40 saat diyor, bizde 39 görünüyor" sorusu er geç
gelir.

⬜ Ürün kararı: rehberlik saati bir müfredat satırı mı, yoksa ayrı bir kavram mı? Karar
verildikten sonra ayrıştırıcı ya satırı üretsin ya da fark ekranı bu bir saati açıkça
göstersin.

### `TB-208` · `IAuditLogger`'ın hiç uygulaması yoktu; API açılmıyordu 🟢

Arayüz deponun **ilk commit'inden** beri `Oksis.Application/Common/Abstractions` altında
duruyordu ama hiçbir uygulaması ve DI kaydı yoktu — kimse enjekte etmediği için fark
edilmemişti. Müfredat Dilim 2 ilk tüketicisi oldu; `ValidateOnBuild` açılışta patladı ve
**API hiç başlamadı**. Dilim 2, 3 ve 4'ün bütün handler'ları etkileniyordu.

Birim testleri arayüzü mock'ladığı için sessizdi; entegrasyon testleri de kendi sahtesini
veriyordu. Kusuru gösteren tek şey **uygulamayı ayağa kaldırmak** oldu. Bu, defterin
"çağrılmayan uç arkasındaki kusuru saklar" dersinin bir üst basamağı: burada ekran da yoktu,
uç da çağrılmamıştı, üstelik uygulama hiç çalıştırılmamıştı.

Deponun denetim deseni modül bazlı ve **tenant kapsamlı** tablolardır (`GradeAuditEntry`,
`HomeworkAuditEntry`, `AnnouncementAuditEntry`); müfredat kaynak hattı ise platform
(tenant'sız) bir yüzeydir ve onlara yazamaz. Tasarım §9 kapsamı zaten **log** olarak
tanımlıyor, §8 de operasyon loglarına 5 yıl saklama veriyor.

✅ `StructuredAuditLogger` (Serilog, yapılandırılmış alanlar) yazıldı ve DI'a kaydedildi
(oksis-api `1f7966fe`). Denetim izinin kalıcı bir tabloya taşınması gerekirse ayrı karar.

### `TB-209` · Depodan gelen PDF ayrıştırılamıyordu; hata da sessizce yutuluyordu 🟢

Obje deposu (S3/Garage) içeriği `Content-Length` ile birlikte **ileri-yönlü bir ağ akışı**
olarak veriyor (`CanSeek = false`). PDF biçimi ise sondaki xref tablosundan başlayıp geriye
atlıyor, yani rastgele erişim istiyor. Tamponlama olmadan PdfPig daha ilk adımda patlıyor ve
uç `CURRICULUM_SOURCE_NOT_PARSABLE` diyordu — belge gayet ayrıştırılabilirken.

İki kat sinsiydi: (1) birim testleri `MemoryStream` ile besliyordu, yani her zaman
aranabilir; (2) çıkarıcı istisnayı sessizce yutuyordu, bu yüzden günlükte **hiçbir iz yoktu**.
Gerçek sebebi bulmak için depo istemcisinin dönüş tipine bakmak gerekti.

✅ Aranamayan akış belleğe alınıyor (boyut zaten 25 MB ile sınırlı), istisna günlüğe yazılıyor
ve `ForwardOnlyStream` ile bir birim testi eklendi (oksis-api `1f7966fe`).

### `TB-210` · Çekirdek ders kataloğu liseyi kapsamıyor: gerçek içe aktarmada 146 ders çözülmedi ⚪

2026-09-20 uçtan uca koşusunda gerçek MEB belgesi (2025/05 sayılı karar, Anadolu Lisesi
çizelgesi) ara alana alındı: **161 satır, 0 hata**, ama ders eşlemesi yalnız **15**'inde
öneri üretti; **146'sı `Unresolved`** kaldı. Öneri üretenler dev seed'de var olan dersler
(Tarih, Coğrafya, Matematik, Fizik, Kimya, Biyoloji, Felsefe); kalanlar lise seçmelileri
(Seçmeli Türk Dili ve Edebiyatı, Astronomi ve Uzay Bilimleri, Kur'an-ı Kerim, Proje Tasarımı…).

Davranış **tasarıma uygun**: bilinmeyen ders otomatik master ders açmaz, çalışma
`NeedsReview`'e düşer. Ama pratik sonucu şu: ilk gerçek yayım 146 elle karar demek.

**2026-09-20 · eşleme ekranıyla yeniden ölçüldü.** Karar yükü satır bazında değil **ders
bazındadır**: 142 satır / 123 çözülmemiş satır, yalnız **52 ayrık ders / 45 çözülmemiş ders**.
Ekran kararı ders bazında topluyor (aynı ham ad dört sınıfta dört satır üretiyor), yani 123
değil 45 karar. Asıl darboğaz bu değil, **katalog**: çekirdekte **21 ders** var, karara
bağlanacak **45**. Yani çoğunun bağlanacağı bir karşılık **yok**; operatörün elinde tek
seçenek "kapsam dışı bırak" kalıyor ve bu, çizelgeyi budayarak yayımlamak demek.

⬜ Ürün kararı: çekirdek ders kataloğu MEB lise ders listesiyle önceden beslenecek mi, yoksa
ilk içe aktarmada toplu "yeni ders aç" akışı mı eklenecek? İkincisi tasarımın "bilinmeyen ders
otomatik açmaz" kuralını gevşetmeden, ayrı ve bilinçli bir komutla yapılabilir. **Bu karar
verilmeden eşleme ekranı işlevsel olarak tamamlanamaz.**

### `TB-211` · Aynı ders aynı sınıfta hem ortak hem seçmeli olabiliyor; tekillik kuralımız bunu yasaklıyordu 🟢

Merkez müfredat ekranı gerçek belgeyle denenirken çıktı (2026-09-20). 2025/05 sayılı kararın
**Fen Lisesi** çizelgesinde `BİLİŞİM TEKNOLOJİLERİ VE YAZILIM` 9 ve 10. sınıfta **iki kez**
geçiyor: bir kez **ORTAK** ders olarak (2 saat), bir kez **SEÇMELİ** olarak (1/(1)(2)…).
Belgenin görüntüsüyle doğrulandı — kaynak doğru, ikisi farklı şeydir: zorunlu saat ile
isteğe bağlı ek saat.

Bizim ara alan tekilliğimiz `(çalışma, seviye, ders adı)` idi; ders TÜRÜ anahtarın dışındaydı.
Sonuç: bu çizelge ara alana **hiç giremiyor**, uç `500` veriyordu (`ux_curriculum_import_entries_source_row`
ihlali). Ayrıştırıcı ve doğrulayıcı doğruydu; yanlış olan **varsayımdı**.

Master tarafında da aynı kusur vardı (`ux_curriculum_entries_active`): ara alan düzeltilse
bile YAYIM adımı aynı kısıtla patlardı.

✅ İki tekil indeks de ders türünü içerecek şekilde düzeltildi, doğrulayıcı anahtarı
güncellendi, göç yazıldı ve mimari bekçilerdeki beyan yenilendi (oksis-api `b6189c76`).
Doğrulandı: Fen Lisesi çizelgesi artık **163 satır, 0 hata** ile geçiyor.

⬜ Tasarım belgesindeki "Aynı seviye ve ders için iki satır olamaz" kuralı (§Dilim 2) gerçek
veriyle çeliştiği için güncellenmeli.

### `TB-212` · Kategori süpürme sessizce hiçbir şey indirmiyordu 🟢

Ekran kontrolünde çıktı (2026-09-20). "Yeni belgeleri indir" düğmesi `202` dönüyor, ekran
"Tarama başlatıldı" diyor ve kullanıcı bekliyor — ama **hiçbir belge inmiyordu**.

Sebep: `MebCatalogSweepJob`, `FetchSourceDocumentCommand`'ı MediatR üzerinden çağırıyordu.
Komut `[Tenancy(PlatformOnly)]` taşır ve arka plan işinin `HttpContext`'i, dolayısıyla
platform kimliği yoktur. Her indirme `ForbiddenException` ile düşüyor, iş de tek tek hataları
yutup "süpürme tamamlandı" diye kapanıyordu.

Bu, defterdeki [[arka-plan-isinde-izin-kapisi]] dersinin birebir tekrarı: **izin/kapı taşıyan
bir komut arka plan işinden çağrılamaz.** Ders kayıtlıydı ve yine de tekrar edildi — çünkü
sweep işinin testi `ISender`'ı sahteliyordu ve sahte kapıyı hiç görmüyordu.

✅ Kapı kullanıcı yüzeyinde bırakıldı; iş sistem aktörü olarak ortak `CurriculumSourceFetcher`
servisini doğrudan çağırıyor (parmak izi/virüs/revizyon hâlâ tek nüsha). Testler artık gerçek
servisle koşuyor (oksis-api `f3488976`). Doğrulandı: süpürme sonrası **30 belge / 24 MB**
indirildi, önce 1 taneydi.

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

### `TB-214` · Bugünkü katalogla yayım, müfredatı 44 satırdan 15 satıra düşürüyor 🟠

Onay/yayım ekranı uçtan uca denendi (2026-09-20) ve `TB-210`'un bedeli **ölçülebilir** hâle
geldi. Anadolu Lisesi çizelgesi (161 satır) ara alana alındı; çekirdek katalogda karşılığı
olan **15** satır bağlandı, kalan **146** satır kapsam dışı bırakıldı (başka seçenek yoktu).
Yayım sonucu:

```text
sürüm 2025-05 · 15 satır · 15 kaynak izi · 0 saat seçeneği
LEGACY-2025.04-HIGH (44 satır) → Superseded
```

Yani yayım, lise programının **44 satırlık yer tutucu sürümünü 15 satırlık bir sürümle
değiştirdi**. Hat teknik olarak doğru çalışıyor — sağlama tuttu, iki kişi kuralı işledi, izler
yazıldı — ama sonuç, gerçek çizelgeden daha fakir bir müfredat.

Saat seçeneğinin sıfır çıkması da aynı sebepten: seçenekli hücreler (`(1)(2)`) hep seçmeli
derslerde ve seçmelilerin hiçbirinin katalogda karşılığı yok.

⬜ `TB-210` kararı verilmeden **yayım yapılmamalı**. Karar verilene kadar ekran bu riski
gösteriyor ("146 satır atlandı") ama engellemiyor; engellemek gerekip gerekmediği de o kararın
parçası.

### `TB-218` · Aynı kararın ikinci çizelgesi ara alana taşınamıyor 🟠

2026-09-20'de ölçüldü (`oksis-api` @ `f3488976`, `oksis-ui` merkez müfredat yüzeyi).
"Ara alana taşı" dialogu **her çizelge için yeni bir belge seti açıyor**
(`packages/api/src/platform-curriculum/queries.ts:117`). Set benzersizliği ise
(karar numarası + başlık) ikilisinde (`CreateDocumentSetCommandHandler.cs:20`).

Dialog set başlığını belge başlığıyla dolduruyor ve karar numarası da aynı — çünkü
belgedeki bütün çizelgeler **tek karara** ait. Dolayısıyla ikinci çizelge
`409 CURRICULUM_SOURCE_SET_DUPLICATE` alıyor. Arayüz bunu biliyor ve kullanıcıya
"Farklı bir set başlığı verin" diyor (`start-import-dialog.tsx`, `describe()`).

Ölçülen belgede (2025/05 sayılı karar, `20144001_202505.pdf`) sayfa 2–7 altı ayrı
eğitim programının çizelgesi. Altısını da taşımak için kullanıcının **altı uydurma
set başlığı** yazması gerekiyor.

Zarar: tasarımın en temel kuralı deliniyor — bir kurul kararı tek hukuki kaynaktır
(tasarım kararı 1). Altı sete bölünen karar, kaynak izini altı ayrı yere dağıtıyor ve
uydurulan başlıklar kalıcı kayıt oluyor. Pratikte merkez kullanıcısı bir belgenin
yalnız ilk çizelgesini taşıyabiliyor.

⬜ Belge başına tek set; kapaktan okunan karar bilgisiyle açılır ve belgedeki bütün
çizelgeler o setin altına girer. Modal tamamen kalkar. Tasarım:
[[meb-kaynakli-katalog-tasarimi]] §6.2.

### `TB-219` · Ayrıştırıcı kategori bandını ders adına taşırıyor 🟡

Aynı ölçümde çıktı (dev veritabanı, `curriculum_import_entries`). Çizelgenin sol
sütunundaki seçmeli ders bandı bazı satırlarda ders adının içine karışıyor:

| Ara alanda kayıtlı ad | Olması gereken | Bandı |
|---|---|---|
| `KÜLTÜR, VE SPOR SANAT TÜRK KÜLTÜR VE MEDENİYET TARİHİ` | `TÜRK KÜLTÜR VE MEDENİYET TARİHİ` | KÜLTÜR, SANAT VE SPOR |
| `İNSAN, TOPLUM VE DEMOKRASİ VE İNSAN HAKLARI` | `DEMOKRASİ VE İNSAN HAKLARI` | İNSAN, TOPLUM VE BİLİM |

Band adı iki satıra bölünmüş olarak yazıldığında (`KÜLTÜR, SANAT` / `VE SPOR`)
sütun sınırı kayıyor ve bant metni ders hücresine sızıyor. `CategoryBands.cs`
bandı çözüyor ama hücre okuması bandın kapladığı yatay alanı dışlamıyor.

Zarar: bozulan ad, ders eşlemesinin **anahtarı**. Bu satırlar hiçbir zaman eşleşemez
ve elle bağlansa bile yanlış adla kayıtlı kalır.

✅ **2026-09-20 · aynı gün kapandı — aslında hiç açık değildi.** Plan yazılırken yeniden
ölçüldü: kusuru `TB-217` çalışması (`CategoryBands`, henüz commit edilmemiş çalışma ağacında)
zaten kapatmış. Kategori sütunu artık cetvel çizgisinden çözülüyor ve ayraç ders adının sol
sınırını veriyor; sınıfın kendi belgesi bu hata sınıfını adıyla anıyor.

Kanıt — `anadolu-2025-05.expected.json` golden çıktısı:

| Ad | Golden'da geçiş |
|---|---|
| `KÜLTÜR, VE SPOR SANAT …` (çöp) | **0** |
| `İNSAN, TOPLUM VE DEMOKRASİ …` (çöp) | **0** |
| `TÜRK KÜLTÜR VE MEDENİYET TARİHİ` (doğru) | 6 |
| `DEMOKRASİ VE İNSAN HAKLARI` (doğru) | 6 |

Dev veritabanındaki bozuk satırlar `TB-217` öncesi koşulardan kalma **bayat veriydi**;
ölçümü koda değil veriye dayandırmak yanılttı ([[karar-oncesi-yeniden-olcum]]). Veritabanı
[[meb-kaynakli-katalog-tasarimi]] §8 ile zaten sıfırlanacak. ID iz bıraksın diye silinmedi;
bir sonraki kapanış turunda arşive taşınır.

---

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

### `TB-220` · Derslik hatalarının Türkçe karşılığı kataloğa yazılmamış 🟠

2026-09-21'de ölçüldü. `de7ced5e` (derslik zorunlu hâle getirme) iki hata anahtarı ekledi
ama `ErrorMessageCatalog.cs`'e cümlelerini yazmadı:
`academic-sessions.errors.branch-room-unresolved` (`OpenSeasonFromDraftCommandHandler.cs:354`)
ve `class-rooms.errors.invalid-room` (`CreateClassRoomCommandHandler.cs:118`).

Zarar iki katlı: kullanıcı gerekçe yerine nötr bir cümle görüyordu (`X-14`), **ve**
`ErrorMessageCatalogTests` kırmızıya düştüğü için **master'ın push kapısı kapalıydı** —
`Oksis.Api.UnitTests` 462/463.

✅ **2026-09-21 · kapandı** (`89c459b1`). İki cümle kataloğa yazıldı; 463/463 yeşil.

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

### `TB-225` · Karara bağlanmamış öneri satırları yayımda atlanıyor 🟠

2026-09-21'de ekran testinde ölçüldü. Yayım kapısı `Confirmed` ya da yayımda açılan
(`Unresolved`) satırları alıyor; **`Suggested` ikisine de girmiyor** ve satır sessizce
düşüyor.

Ölçüm — 2025/24 sayılı kararın çizelgesi, ekrandan onaylanıp yayımlandı:

| | Satır |
|---|---|
| Ara alana taşınan | 270 |
| Yayımlanan | **168** |
| `Suggested` (önerisi var, onaylanmamış) | **87** |
| `Unresolved` + sınıfı çözülemeyen | 15 |

Yani satırların **%32'si** yalnız "öneri" olduğu için yayıma girmedi. Davranışın kendisi
savunulabilir — bir tahmin karar değildir ve onaysız yazmak yanlış müfredat üretirdi — ama
iki şey yanlıştı:

1. **Ekran onaydan önce söylemiyordu.** Üst şerit `Suggested`'ı "karara bağlandı" sayıyordu
   (`decided = groups.length - unresolved`), yani kullanıcı 87 satırın düşeceğini
   bilemiyordu.
2. Yayım bildirimi "102 satır atlandı (kapsam dışı ya da eksik)" diyordu; gerekçe belirsizdi.

✅ **Ekran ayağı kapandı** (2026-09-21, `oksis-ui`): üç hâl ayrıldı — `Unresolved` (yayımda
açılacak), `Suggested` (yayımlanmayacak, turuncu uyarı), karara bağlanmış. Yayım bildiriminin
gerekçesi de açıldı.

⬜ **Açık kalan ürün kararı:** yüksek güvenli bir öneri yayıma girmeli mi? Şu an %95 güvenle
eşleşmiş bir ders bile insan onayı olmadan düşüyor. Seçenekler: (a) olduğu gibi kalsın, ekran
artık uyarıyor; (b) belirli bir güven eşiğinin üstü otomatik `Confirmed` sayılsın; (c) yayım
bu satırları da açsın (öneriyi yok sayıp yeni ders açmak) — sonuncusu ikiz ders üretir,
muhtemelen yanlış.

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

---

---

### `TB-247` · Müfredat seçmeli dersleri seçtirmiyor; sezon, MEB toplamını tutmayan müfredatla açılabiliyor 🔴

2026-09-24'te kullanıcı Altınay müfredat ekranında buldu. Gerçek hayatta okul, sezona başlarken
MEB'in (ttkb.meb.gov.tr) seçmeli dersler bölümünden kendine uygun dersleri **seçer**; yalnız
seçtikleri kataloğa girer. Ekran ise ortak ve seçmeli dersleri **kategorisiz, karışık** ve MEB
saatleriyle listeliyor. Müdür seçmediği her dersin okul saatini sezon açılmadan önce tek tek
sıfıra çekmek zorunda. Unutursa sistem 9. sınıfın 59 saat okutulacağını varsayar ve bütün
derslere görevlendirme bekler.

Ölçüm (koddan + dev DB):

1. Veri **var**: her satırın türü (`course_type` Common/Elective) ve MEB kategorisi
   (`source_category`: Din, Ahlak ve Değer · İnsan, Toplum ve Bilim · Kültür, Sanat ve Spor ·
   Akademik Çalışmalar) saklanıyor. Akademik Çalışmalar yalnız 11–12. sınıf satırlarında.
2. MEB'in çizelgede **beyan ettiği toplamlar saklanmıyor**. Çizelge sınıf başına
   `ORTAK + SEÇİLEBİLECEK + REHBERLİK = TOPLAM` (9. sınıf 32+7+1=40) diyor; ayrıştırıcı bunu
   yalnız sağlama için kullanıp atıyor (`MebChartChecksums`). Ekranın "MEB toplamı" bu yüzden
   bütün satırların toplamı (9. sınıf 59) — MEB'in beyanı değil.
3. Aktifleştirmede **hiçbir toplam denetimi yok**; "Sezon başlarsa ne donacak?" önizlemesi
   9. sınıf için 32 saati uyarısız donduruyor.
4. Yan etki (2026-09-24 bölme kararı): "Görsel Sanatlar/Müzik" ayrı derslere bölününce okulun
   ortak toplamı MEB beyanını aşıyor (9: 34/32, 10: 35/33, 11: 21/19, 12: 19/15). Toplam
   denetimi gelirse hiçbir okul bu dersler arasından seçim yapmadan sezon açamaz.

İstek: tablo en üstte ortak dersler, altında seçmeli dersler (kategori başına grup, seçilebilir);
MEB PDF'indeki gibi dip toplamlar (Ortak Ders Toplamı, Seçilen Seçmeli Ders Toplamı…);
aktifleştirmede herhangi bir seviyede fark varsa uyarı ve **engel**.

🟢 **Uygulandı (2026-09-24), kullanıcı ekran doğrulaması bekliyor.** Tasarım ve kararlar:
`gecici/planlar/2026-09-24-mufredat-secmeli-ve-sezon-acilis-kontrol-listesi.md`.
- MEB beyan toplamları saklanıyor (`master.curriculum_grade_totals`; 6 sürüm saklı PDF'ten dolduruldu).
- Seçmeli dersler varsayılan seçilmemiş; "Birini seçin" grupları; sınıf başına iki açık onay (satır değişince düşer).
- Tablo MEB PDF düzeninde, dip toplamlar beyana göre.
- Sezon Açılış Kontrol Listesi tek değerlendiriciden; engel varsa sunucu aktifleştirmeyi reddeder (önceki sezonun arşivi dahil hiçbir şey yazılmaz).
- Görevlendirme kapsamı sezon müfredatından (saat > 0).
- Commit'ler: oksis-api `9cdd1645`, `12ced2f0` · oksis-ui `0451028`.

### `B-67` · Ders Programı, Nöbet, Şubeler ve Görevlendirmeler web ekranları kurulumdaki sezonu hedeflemiyor 🟠

2026-09-24 sezon–menü ön incelemesinde ölçüldü
([[sezon-durumuna-gore-menu-erisimi]] §3.2). Bu dört ekran sezon **kurulumunun** araçlarıdır ve
backend kurulumdaki sezonu kabul ediyor: şube ve nöbet yalnız arşivi reddeder
(`CreateClassRoomCommandHandler.cs:46-49`, `SaveDutyRosterDraftCommandHandler.cs:21-34`),
program ve görevlendirme sezon id'sini açıkça alır. Web tarafı ise:

1. `schedule-page.tsx:63-72` dönemi `useCurrentSession()`'dan alıyor; bu yalnız **aktif**
   sezonu döndürür. İlk sezonda dönem `null`, program listesi sorgusu çalışmıyor, "Yeni" ile
   program `academicTermId: ""` gönderilerek oluşturuluyor (:133). Aynı kalıp
   `availability-page.tsx:58-69`, `editor-page.tsx:160-191`, `duty-page.tsx:69-84`.
2. Şubeler (`sections-page.tsx:56-62`) ve Görevlendirmeler (`teacher-assignments-page.tsx:56-65`)
   `myContext.activeSeasonId`'yi kullanıyor. Kurulumdaki sezon seçilemediği için
   (`season-context-picker.tsx:325-327`) bu ekranlar onu hiç gösteremiyor.

Sonuç: sezon geçişinde (eski sezon aktif) bu ekranlar **eski** sezona yazıyor; ilk sezonda
hiçbiri kurulumdaki sezonla çalışmıyor. Müfredat ekranı doğru emsaldir: `sessionId`
verilmediğinde sunucu kurulumdaki sezonu kullanır (`curriculum-page.tsx:45-51`).


🔎 **Altınay'da ölçüldü (2026-09-24, kullanıcı ekran görüntüsüyle bildirdi):** Görevlendirmeler "Aramaya uyan öğretmen
yok" gösteriyor, sayaçlar 0/0/0. Üst çubuk "2026-2027 · Kurulumda" diyor ama müdürün oturum bağlamında
`activeSeasonId = null` (`auth/me/context`). Sayfa sezonsuz istek atıyor, sunucu `IsCurrent` sezona düşüyor, Altınay'ın
tek sezonu `Setup`/`is_current=0` olduğu için liste boş dönüyor. Aynı uç (`GET assignments/teachers`):
**sezonsuz 0 öğretmen, `sessionId=42C3DFCF…` ile 13 öğretmen.** Etki: Altınay B6.2'nin son ölçümü ve B9 görevlendirme
turu bu ekrandan yapılamıyor.

🔄 **Kısmi karar ve uygulama (2026-09-24, kullanıcı):** Görevlendirmeler ve yöneticinin Ders Programı aktif sezon yokken
**menüde ve rotada kilitli** (`oksis-ui` `a5f719c` + `47dff02`, master'da `5a37114`; `nav-config.ts` `requiresActiveSeason`).
Programın gerekçesi: program görevlendirmelerden üretiliyor. Altınay'da ölçüldü: menüde soluk; doğrudan adres
"Sezon kurulumda" ekranını ve "Sezonu Aktifleştir" düğmesini gösteriyor. Core nav testleri 40/40.
**Nöbet (aynı gün, ikinci karar):** Nöbet & Vekâlet de kilitli. Sezondan bağımsız kısmı (bölgeler, politika,
muafiyet) **Ayarlar › Nöbet Bölge Ayarları** sekmesine taşındı (`DutyZonesSettings`). Nöbet ekranı iki sekmeye indi,
boş bölge durumu Ayarlar'a yönlendiriyor. Altınay'da ölçüldü: kurulumdaki sezonda sekme çiziliyor, menüde üç öğe de
devre dışı. Core nav testleri yeşil.
⬜ **Açık kalan:** Sınıflar & Şubeler hâlâ açık ve kurulumdaki sezonu hedefleyemiyor. Aynı karar mı uygulanacak,
yoksa ekran sezon seçebilir mi olacak? Karar bekliyor. Ek olarak kilit, okulun sezonu açmadan
görevlendirme planlamasını engelliyor. Bilinçli bir sıra kısıtı: önce sezon aktifleştirilir.
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

### `B-68` · Katalogda açılan okul dersinin haftalık saatini girecek yer yok 🟠

Altınay'da 2026-09-24'te çıktı (kullanıcı sorusu). Ayarlar › Akademik Yapı › Dersler'de 11 ve 12. sınıfa
bağlanan altı okul dersi (TYT Türkçe, Coğrafya, Kimya, Biyoloji, Matematik, Fizik) hiçbir ekranda saat
alamıyordu. Katalog formu "seviye bazlı haftalık saat Akademik › Müfredat'ta düzenlenir" diyor; Müfredat ise
yalnız müfredatta **satırı olan** dersi çiziyordu. MEB karşılığı olmayan ders, saati girilene kadar satırsız
kaldığı için tabloda hiç görünmüyordu. Döngü kapalıydı: satır yok, saat yok. Sunucunun saat yazma ucu okul
dersini müfredata eklemeyi zaten destekliyordu; eksik olan ekrandaki giriş noktasıydı.

🟡 **Kodda düzeltildi, commit bekliyor** (`oksis-api` + `oksis-ui` dal `feat/alan-bazli-mufredat-profili`).
Hazırlıktaki sezonda, katalogda seviyeye bağlı okul dersleri o seviyenin **her profilinde** "Okul Dersleri"
bölümüne 0 saatle eklenir (`CurriculumGradeStates`; yalnız görünüm, çözücüye/snapshot'a/ders programına
girmez). Satır soluk ve "saat girilmedi" etiketli; saat yazılınca gerçek müfredat satırı olur. 0 saatlik satır
"okul dersi" sayacına ve "MEB saatlerine dön" koşuluna girmez (`core` `isTaughtCustomCourse`). Canlı API'de
ölçüldü: altı ders dört profilde de 0 saatle döndü. Birim testleri yeşil.

➕ **Aynı gün ikinci ayak (kullanıcı bulgusu):** ilk düzeltme yalnız okulun kendi dersini (MEB karşılığı yok)
kapsıyordu. MEB'den gelen Felsefe (çizelgede 10–11) katalogda 12'ye de bağlanmıştı ama 12'de görünmüyordu.
Kural katalogda seviyeye bağlı **her derse** genişletildi: MEB satırı olmayan seviyede ders okul dersi olarak
0 saatle gelir; MEB satırı olan seviyede çift çıkmaz (testli). Canlı API'de ölçüldü: 12'nin dört profilinde
Felsefe `Custom`, 0 saat.

➕ **Üçüncü ayak — kök neden (2026-09-24/25):** ikinci ayak katalogdaki bütün MEB bağlarını ekrana açınca
eski içe aktarma artıkları (bölünmeden önceki birleşik "Görsel Sanatlar/Müzik", Fen Lisesi eşlemesinden gelen
"Fizik/Kimya/Biyoloji/Coğrafya/Matematik 11–12" vb.) bütün sınıflarda "Okul" dersi olarak sızdı. Kök neden:
`SubjectCatalogImporter` okul açılışında (sezon/sürüm yokken) seviye bağlarını platformun **bütün programlarının
birleşik** eşlemesinden (`master.subject_grade_levels`) kopyalıyor. Düzeltme: bağ artık kaynağını taşır
(`school.subject_grade_levels.source`: `School`/`Import`, göç `20260924_subject_grade_link_source` mevcut satırları
"dersle aynı anda ya da sistem yazdıysa içe aktarma" kuralıyla sınıflandırdı); sezon müfredatı kurulurken ve
yeniden tabanlamada `SyncImportedGradeLinksAsync` içe aktarma bağlarını okulun programının güncel sürümüne
eşitler — okulun formda düzenlediği derse ve saat girdiği seviyeye dokunmaz. Müfredat görünümü de kaynağa bakar:
okul bağı her zaman, içe aktarma bağı yalnız güncel çizelgede varsa görünür. Altınay'da kullanıcı onayıyla
eşitleme çalıştırıldı: tam onaylanan liste, **50 bağ** (21'i 9–12'de, 29'u Hazırlık) yumuşak silindi; hiçbir
profilde saat ya da toplam değişmedi, okutulan ders düşmedi. Okulun beyanı olan "İkinci Yabancı Dil (Almanca)"
(güncel adı "Seçmeli İkinci Yabancı Dil (Almanca)") 9–12'de okul dersi olarak görünür; pasife almak okulun kararı.
Ders: [[genisletilen-kural-tum-veride-olculur]] — ikinci ayak tek örnekle genişletilmiş, yalnız hedef satırda doğrulanmıştı.

### `B-74` · Şube şube otomatik üretim diğer şubelerin taslaklarını görmüyor — aynı öğretmen aynı saatte iki şubede 🔴

2026-09-25 Altınay B9.4 testinde çıktı (kullanıcı ekran bulgusundan ölçüldü). 9-A, 9-B, 10-A, 10-B ayrı üretimlerle (her biri
kendi `generation_job`) kuruldu. Üretici dış meşguliyeti yalnız **canlı** programlardan topluyor
(`AutoGenerateScheduleJob.GatherExternalOccupancyAsync`, K12 `owner != demand.ClassRoomId`); aynı dönemin diğer
**taslakları** dolu sayılmıyor. Ölçüldü: Eylem Adıgüzel Pazartesi 5–6'da hem 10-A hem 10-B'de, Salı 5–6'da hem 9-A hem 9-B'de
Tarih'te. Programların `conflict_count` değeri 0 — çakışma sessiz. "Şube üretiminde boşluk kalmıyor" görüntüsünün sebebi bu.

### `B-75` · Toplu üretim (seviye/tümü) sıkışınca onarmıyor — boş hücre varken ders yerleşmemiş kalıyor 🟠

Aynı testte: 11-A, 11-B, 11-C tek üretimde (`A7249FB4…`) kuruldu, çakışma yok ama 11-B'de 2 saat eksik (Eylem Adıgüzel'in
Tarih ve Seçmeli Tarih'i). 11-B'nin boş hücreleri (Çarşamba 7, Cuma 7) Eylem'in 11-A (Tarih) ve 9-A (Koçluk) saatleri;
Eylem'in boş olduğu saatlerde 11-B dolu. Açgözlü çözücü (`GreedySolver`) yerleşimi geri almıyor/takas etmiyor; tek bir
takas (11-B'deki başka dersi boş hücreye kaydırıp açılan saate Tarih) eksiği kapatırdı. Izgara 40/40 dolu okulda sık görülür.

⬜ Kapatma yolu (kullanıcı onayı 2026-09-25, "düzeltmeye geç"): (1) şube üretimi aynı dönemin diğer şube taslaklarını dolu
sayar; önizleme taslaklar arası çakışmayı gösterir; (2) çözücüye yerleşmemiş ders için takas/onarım adımı; bulunamazsa
gerekçeli yerleşmemiş.

🧪 **Aday çözüm denendi, kararı bekliyor (2026-09-25):** kullanıcı önce görmek, sonra başka bir çözümü konuşmak istedi. Uygulanan
aday (çalışma kopyasında, commit yok; geri alma yaması `scratchpad/b74-b75-oksis-{api,ui}.patch`, geri alınabilirlik doğrulandı):
`CurrentProgramOccupancy` (şubenin canlısı varsa o, yoksa en son taslağı) üretimde, sayaçta, önizlemede, editörde dolu sayılır;
taslaklar arası çakışma yayını engellemeyen uyarı, canlıyla çakışma engel; `GreedyRepair` (boş hücre → tek takas → derinlik 2
zincir, aynı şube, sabit kural hücresi ve blok korunur, deterministik) + gerekçeli yerleşmemiş. Ölçüm: ATA-AL şube şube üretimde
çakışan hücre 81 → 0; Altınay 11-A/B/C verisiyle çevrimdışı 5 sıralamada eksik saat 1,2,4,1,0 → 0,0,0,0,0. Ayrıca
`ScheduleProgramStatsRecomputer` Cuma'yı saymıyordu (`(int)Day is 0..4`, günler 1–5) → dolu ızgarada `missing_hours` hep 8;
bu düzeltme de aynı yamada. Açık: saklı `missing_hours` ızgara boşluğunu, önizleme müfredat eksiğini sayıyor (iki tanım).

✅ **Karar (2026-09-25, kullanıcı):** yalnız **yayındaki** programlar dış çakışma denetimine girer — bu doğru davranış, bozulmaz;
başka şubelerin taslakları dolu sayılmaz, tekil üretim değişmez. **Toplu üretimde** o an üretilen şubeler (yayındakilerin yanı sıra)
kendi içinde çakışmasız olur — Altınay 11-A/B/C tek işte 0 çakışma, yani mevcut kod bunu zaten yapıyor. Bu yüzden **B-74 hata
değil, tasarım gereği** (tek tek üretilen taslaklar arası çakışma yayın kapısında yakalanır). Aday çözümün taslak doluluğu kısmı
geri alındı (arşiv `~/oksis-yedek/yamalar/b74-b75-aday-cozum-*.patch`); **tutulanlar:** B-75 onarım adımı, `missing_hours`
Cuma düzeltmesi, üretim ekranında eksik saat + gerekçe. Yayın önizlemesine taslak çakışması bilgisi eklenmez.

🟡 **B-75 kodda düzeltildi, commit bekliyor** (dal `feat/sinif-rehberligi-dersleri`): `GreedyRepair` (boş hücre → aynı şubede
tek takas → derinlik ≤2 zincir; sabit kural hücresi ve blok korunur; her adım `SlotFeasibility.CanPlace`: yayındakiler + aynı
üretimin kardeşleri) + gerekçeli yerleşmemiş (`UnplacedReasonText`, üretim ekranında "N saat eksik" + satırlar); `missing_hours`
Cuma düzeltmesi. Taslaklar dolu sayılmıyor (entegrasyon testiyle kilitli). Birim 3370 yeşil; `AutoGenerateScheduleJobTests` 7/7
(dosyanın tohumundaki kiracısız `Subject` eklemesi de düzeltildi). Altınay 11-A/B/C çevrimdışı: eksik 1,2,4,1,0 → 0; rastgele
40 toplu girdide toplam eksik 281 → 110. Açık: sabit kuralın basılamayan saati eksiğe sayılıyor ama gerekçe satırı üretmiyor
(ATA-AL 9-B: etiket 20, satırlar 18) — Y-05 kapsamında.

### `B-77` · Eksik saatli ders programı ekrandan yayınlanamıyor — onay seçeneği yok 🟠

2026-09-25 Y-05 ekran testinde (ATA-AL 9-A). Sunucu eksik saat varsa `requiresAllowMissingHours=true` döner ve yayını
`allowMissingHours` onayıyla kabul eder; önizleme `canPublish=false` der (`GetPublishPreviewQueryHandler:41`). Yayın ekranı
(`publish-drawer.tsx`) "Yayınla"yı `canPublish` ile kapatıyor ve onay kutusu göstermiyor; gönderdiği `allowMissingHours`
hiç ulaşılamıyor. Sonuç: tek bir saati eksik (ör. sabit kural çakışmasıyla boş kalan hücre) program ekrandan yayınlanamaz.
Uçtan (`allowMissingHours: true`) 200 döndüğü ölçüldü. Master'da da aynı.

⬜ Kapatma yolu: eksik saatte "N saat eksik; bilerek yayınla" onay kutusu, işaretlenince "Yayınla" açılır (çakışma ve boş program
engel kalır).
🟡 **Kodda düzeltildi, commit bekliyor:** tekli yayın penceresinde onay kutusu (kapı mantığı `core/schedule/bulk.ts`), toplu yayında
tek onay. Ekranda ölçüldü.

### `D-32` · Ders programı kartında "BLOK" ve "KURAL" rozetleri ders adının üstüne biniyor 🟡

Aynı testte 9-A Salı 7–8: "Proje Tasarımı ve Uygulamaları" adı rozetlerin altında kalıp kesiliyor. ⬜ Rozetler başlıkla aynı
akışta (sağda, sarmadan) ya da başlığın altında yer almalı.

### `D-33` · Üretim önizlemesinde yerleşmeyen ders satırı: başlık ve gerekçe bitişikti, liste çok uzundu 🟡

Aynı testte: `UnplacedReasons` `pr-issue-row` stilini kullanıyordu, `.t`/`.s` satır içi olduğu için "…yerleşmedişubenin haftalık…"
bitişik; şube başına 17–20 kart açık geliyordu. 🟡 **Kodda düzeltildi:** `.pr-issue-row .it .t/.s` blok (yayın ekranı da
düzelir); liste kapalı özet ("17 ders · 26 saat yerleşmedi") + açılınca sıkı satırlar. Ekranda ölçüldü.
Ayrıca yayın önizlemesinde 15 kez aynı "Eksik ders saati var" başlığı → sunucu başlığı ders, saat ve öğretmenle kuruyor
("Tarih — 2 saat eksik (Melike Şen)"; çözülemeyen satırda gerekçe sona eklenir). Ekranda ölçüldü.

### `B-76` · Hiç yayınlanmamış taslak program silinince öğrenci ve velilere "Ders programı kaldırıldı" bildirimi gidiyor 🟠

2026-09-25'te ölçüldü. Altınay'da 11 taslak ürün ucuyla (`DELETE timetable/programs/{id}`) silinince 262 uygulama içi
"📅 Ders programı kaldırıldı" bildirimi üretildi (okunmamış; push ve e-posta yok, okulda kayıtlı cihaz yok). ATA-AL'de 12 taslak
silinince 184 bildirim. Taslak öğrenci/veliye hiç görünmediği için "kaldırıldı" haberi yanlış ve gürültü. Ayrıca üretim işlerini
(`schedule_generation_jobs`) silen ürün ucu yok.

⬜ Kapatma yolu: bildirim yalnız canlı (yayınlanmış) program kaldırılınca üretilsin; taslak silme sessiz.
🟡 **Kodda düzeltildi, commit bekliyor:** `ScheduleProgramDeletedEvent.WasLive`; handler canlı olmayanda bildirim üretmez (tekli ve
toplu silme aynı yoldan). ATA-AL'de ölçüldü: taslak toplu silmede 0, canlı tekli silmede 16 bildirim.

### `B-73` · MEB'den aktarılan uzun kodlu dersler düzenlenemiyor — doğrulayıcı 20, kolon 120 🟠

2026-09-25 Y-05 ekran testinde çıktı (ATA-AL, "Proje Tasarımı ve Uygulamaları"ı sınıf rehberliği dersi yaparken).
İçe aktarım dersin kodunu adından türetiyor (`PROJE-TASARIMI-VE-UYGULAMALARI`, 30 karakter); kolon 120 alıyor ama
`CreateSubject`/`UpdateSubject` doğrulayıcıları `MaximumLength(20)`. Düzenleme formu kodu değiştirmese de gönderdiği
için her kayıt 400 ("'Code', 20 karakterden küçük veya eşit olmalıdır. 30 karakter girdiniz"). Ölçüldü: Altınay'da 79
dersin **33**'ü (en uzun `BEDEN-EGITIMI-VE-SPOR-GORSEL-SANATLAR-MUZIK` 43); ATA-AL, DEV-OKUL, OKSOSYAL'de 33, ALTINAY-SBL'de 30.
Y-05'in yeni `REHBERLIK-VE-YONLENDIRME` kodu da 24. Sonuç: okul bu derslerin türünü, seviyesini, adını, durumunu değiştiremiyor.

🟡 **Kodda düzeltildi, commit bekliyor** (dal `feat/sinif-rehberligi-dersleri`): sınır tek sabit `Subject.CodeMaxLength = 120`;
kolon yapılandırması ve iki doğrulayıcı onu okuyor (şema değişmedi). Birim testi: 30 karakterlik aktarılmış kod
kabul, 121 red.

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

### `D-34` · Ders programı listesi bozuk: seçim sütunu eklenince "İşlem" alt satıra kaydı — stil iki dosyada kopya 🟠

2026-09-25 kullanıcı bulgusu (E-33 sonrası, master'da `89efad2`). E-33 `schedule.css`'teki `.pr-thead, .pr-trow` şablonunu 11 sütuna çıkardı;
ama `screens.css`'te ders programı stillerinin eski bir kopyası (90 `.pr-*` kuralı, 72'si birebir aynı, 2'si farklı, 16'sı yalnız orada)
duruyordu ve CSS paketlemesi aynı seçicileri birleştirirken eski 10 sütunlu kuralı tuttu (tarayıcıya giden CSS'te yalnız eski kural
vardı, ölçüldü). Sonuç: seçim kutusu geniş ilk sütuna düştü, "İşlem" alt satıra taştı. Aynı kopya `--grid-line` belirtecini de
eziyordu. R12 ("bir liste iki yerde tanımlanmaz") ihlalinin stil karşılığı.

🟡 **Kodda düzeltildi, commit bekliyor:** `screens.css`'teki ders programı bloğu kaldırıldı; yalnız orada olan 16 kural (`.pr-summary`,
`.pr-sum*`) `schedule.css`'e taşındı; ders programı stilleri tek dosyada. Ekranda ölçüldü: şablon 11 sütun, satır tek satır,
editör ızgarası değişmedi.

### `D-30` · Ders düzenleme penceresi sunucu hatasını göstermiyor 🟡

Aynı ölçümde: `PUT academics/subjects/{id}` 400 döndü, pencere hiçbir mesaj göstermeden açık kaldı (`B-73`'ün
kullanıcıya görünmemesinin sebebi). Kullanıcı "Kaydet"e basar, hiçbir şey olmaz. `apiErrorDesc` sözleşmesinin
("dönüş asla boş değildir") burada kullanılmadığı görülüyor.

🟡 **Pencere kısmı kodda düzeltildi, commit bekliyor:** kaydetme hatası pencerede `mutationErrorDesc` ile gösteriliyor. ⬜ Katalog satırındaki simge düğmelerinin
erişilebilir adı da yok (`aria-label` boş) — aynı turda.

### `B-72` · Kurulumdaki sezonda duyuru yazılamıyor — hedef havuzu ve oluşturma "Aktif sezon bulunamadı" 🟠

Altınay'da 2026-09-25'te incelendi (kullanıcı sorusu; salt okunur ajan incelemesi, kök neden elle doğrulandı).
`AnnouncementCallerResolver.ResolveActiveSessionIdAsync` yalnız `Status == Active` sezonu kabul ediyor
(`Announcements/Common/AnnouncementCallerResolver.cs:80-85`). İki çağıran: `GetAudiencePoolQueryHandler` ve
`CreateAnnouncementCommandHandler` → `Announcements.Session.NotFound`. Ölçüldü: `GET announcements/audience?scope=school`
→ **409** "Aktif sezon bulunamadı." Aktif sezonu olmayan okul hiç duyuru oluşturamıyor.

Yan etkiler (ekran): havuz hatası compose'a iletilmiyor, hedef ızgarası sessizce boş, yalnız "Henüz hedef seçilmedi"
yazıyor (`announcements-page.tsx:310,745`, `compose.tsx:535,560`; öğretmen sayfası `:208`). KVKK ad taraması
parametresiz `useStudents()` ile aktif sezona düşüyor, kurulumda 0 öğrenci (ölçüldü; sezonla 101) — metinde öğrenci
adı geçse uyarı çıkmaz (`announcements-page.tsx:328`, `teacher-announcements-page.tsx:210`). Liste süzgeci
`activeSeasonId` null olduğundan süzgeçsiz gidiyor (`:252`).

Engel olmayanlar (kanıtlı): hedef kitle çözücüsü verilen sezonla çalışıyor ve kurulum sezonunda doluyor (101 öğrenci,
163 veli bağı, 13 öğretmen); yayın/zamanlama/onay duyurunun kendi sezon kimliğini kullanıyor (Setup → Active'de
kimlik aynı); bildirim zinciri sezon istemiyor; müdürün yetkisi sezonsuz. Öğretmen havuzu yayınlanmış ders programı
ister (K-10), kurulumda boş kalır — ürün kararı.

⬜ Kapatma yolu (öneri): sunucuda tek "çalışma sezonu" kuralı (aktif varsa o, yoksa kurulumdaki, arşiv asla) —
B-70'in `workingSeasonId`'sinin sunucu karşılığı; duyuru çözücüsü ve aynı `Status == Active` kalıbını taşıyan diğer
okuyucular (ListStudents varsayılanı, GetStudentDetail, ClubReader, HomeworkAdminReader vb.) buna devreder. Ekranda
havuz hatası kullanıcıya söylenir. Kurulumdaki okulun veli/öğrenciye duyuru göndermesinin istenip istenmediği ürün kararı.

✅ **Karar (2026-09-25, kullanıcı): yalnız duyurular için uygula.** Diğer okuyucular aktif sezonda kalır.
🟡 **Kodda düzeltildi, commit bekliyor.** `oksis-api`: `AnnouncementCallerResolver.ResolveWorkingSessionIdAsync` —
aktif sezon, yoksa kurulumdaki (en erken başlayan), arşiv asla; hata mesajı "Okulun aktif ya da kurulumdaki sezonu
yok." (kod aynı). Üç birim testi (kurulum, aktif öncelikli, arşiv null). `oksis-ui`: duyuru sayfası sezonu ve KVKK
öğrenci listesini `useWorkingSeason`'dan alır; havuz hatası compose'da "Hedef listesi yüklenemedi: …" olarak
gösterilir (yönetici ve öğretmen sayfası). Ölçüldü: `GET announcements/audience?scope=school` 409 → 200, Tüm okul
265 (151 veli, 13 öğretmen, 101 öğrenci; 11 şube); Yeni duyuru ekranında "Tüm okul — 265 kişi" görünüyor
(yayın yapılmadı). Öğretmen sayfasının KVKK listesi değişmedi (öğretmende sezon listesi yetkisi ölçülmedi).
Duyuru entegrasyon testleri ölçülemedi: 287'den 241'i fikstürde, duyuru koduna varmadan test veritabanında ders
kaydı olmadığı için düşüyor (`AnnouncementAudienceFixture.cs:310`, tohum eksiği; TB-252 ailesi).

### `B-71` · Kişi güncelleme ucu cinsiyeti zorunlu tutuyor; sihirbazın cinsiyetsiz açtığı veli güncellenemiyor 🟡

Altınay'da 2026-09-25'te çıktı (Dil şubelerinin 16 velisine e-posta yazılırken). Kayıt sihirbazı veliyi
cinsiyet sormadan açıyor (`persons.gender` NULL). `PUT users/persons/{id}` gövdesi `UpdatePersonBody.Gender`
**non-nullable** (`PersonsController.cs:286`), oysa komut `UpdatePersonCommand.Gender` nullable. Cinsiyeti boş
kişinin e-postasını ya da telefonunu değiştirmek için cinsiyet uydurmak gerekiyor; boş gönderilince 400
(`$.gender` çevrilemedi). Ölçüldü: 16 velinin 16'sı 400; öğrencilerde (cinsiyet dolu) 204.
Altınay'da cinsiyet, seçilen ilişkiden verildi (Anne → Kadın, Baba → Erkek).

⬜ Kapatma yolu: gövdede `Gender?` (komutla aynı); ya da sihirbaz veliden cinsiyet istesin. Karar bekliyor.

### `B-70` · Kurulumdaki sezona ekrandan şube ya da öğrenci eklenemiyor 🟠

Altınay'da 2026-09-25'te çıktı (kullanıcı isteği: aktifleştirmeden önce 11 ve 12 Yabancı Dil şubesi aç,
öğrenci kaydet). Sınıflar & Şubeler (`sections-page.tsx`, `myContext.activeSeasonId`) ve Öğrenci Kayıt
Sihirbazı (`useCurrentSession`) yalnız **aktif** sezonla çalışıyor; aktif sezon yokken ikisi de boş açılıyor.
Kurulumdaki sezona şube eklemenin tek ekran yolu Sezon Yönetimi › "Düzenle": sezonu sihirbaza geri alıyor ve
açılışta oluşturulan şubeleri siliyor (Altınay'da 9 şube, 85 öğrenci). Sunucu ucu (`CreateClassRoom`, sezon
kimliğiyle) kurulumda şube açmayı destekliyor; eksik olan ekran. `B-67` ailesi: kurulum aracı sezonu oturum
bağlamından okuyor.

✅ **Karar (2026-09-25, kullanıcı):** şubeler kurulumdaki sezonla da oluşturulabilmeli.
🟡 **Şube ekranı kodda düzeltildi, commit bekliyor** (`oksis-ui`): `core` `sectionsSeasonId` — oturumun baktığı
sezon yoksa kurulumdaki sezon; başlık "Kurulumdaki 2026-2027 sezonu…" der, yeni şube penceresinin "Aktif
sezona" ifadesi kaldırıldı. Playwright ile ölçüldü: 9 şube / 85 öğrenci listelendi, yeni şube penceresinde
Yabancı Dil alanı seçilebiliyor (kayıt yapılmadı).
🟡 **Kayıt sihirbazı da düzeltildi (aynı gün, kullanıcı onayı):** sunucuda `EnrollStudent` yalnız arşiv sezonu
reddeder (E11.6 kuralı "aktif değilse ret"ten "arşivse ret"e gevşedi; entegrasyon testi kurulumdaki sezona
kaydı ölçer). Ekranda sihirbaz sezonu ve şube listesini `useWorkingSeason` (web) → `workingSeasonId` (core)
üzerinden alır; "kurulumdaki sezon" etiketi gösterilir. Playwright ile ölçüldü: 11. sınıfta 11-A/11-B
listelendi (kayıt yapılmadı, öğrenci sayısı 85'te kaldı).
🟡 **Öğrenciler listesi de bağlandı (aynı gün):** `useStudents(seasonId)` sunucunun var olan `SeasonId`
parametresini geçer; Öğrenciler ekranı `useWorkingSeason` kullanır. Diğer ekranlar (devamsızlık, duyuru,
etkinlik) parametresiz çağırır, davranışları değişmedi. Playwright ile ölçüldü: liste 0 yerine 85 öğrenci.

### `B-69` · Kural değişince eski müfredat onayı sapmayı kapsamadığı hâlde "onaylandı" görünüyordu 🟡

Altınay'da 2026-09-25'te çıktı (kullanıcı ekranı). 9. sınıfta okul zorunlu dersi "Deneme" 2 saat. Okul
dersleri kotaya sayılınca (Y-04, aynı gün kararı) ortak toplam 34 oldu, MEB 32 istiyor. 9'un ortak onayı
24 Eylül'de, eski kurala göre (sapma yokken) verilmişti; "bilerek onay" kaydı yoktu. Kontrol listesi engel
verdi ama tablo onayı "verildi" gösterdiği için müdür yeniden onaylayıp sapmayı kabul edemiyordu: çıkışsız engel.

🟡 **Kodda düzeltildi, commit bekliyor** (`oksis-api` dal `feat/alan-bazli-mufredat-profili`).
`CurriculumGradeStates`: bugün sapma var ama onay onu bilerek kabul etmemişse onay geçersiz sayılır (ortak ve
seçmeli için ayrı). Tablo onay düğmesini yeniden gösterir, müdür sapma penceresiyle onaylar. Altınay'da
önce/sonra ölçüldü: 10 profilden yalnız 9. sınıfın ortak onayı düştü, diğer kalemler değişmedi.

### `TB-255` · Veri yazan göç Redis önbelleğini düşürmüyor — yeni ders 24 saat listede görünmüyor ⚪

2026-09-25 Altınay testinde çıktı (kullanıcı: "rehberlik dersi sabit kural modalında ders listesinde yok").
`ListSubjectsQuery` `[Cacheable(86_400, "academics:subjects")]` (okul başına anahtar). Y-05 göçü
`20260925_guidance_master_subject` rehberlik dersini SQL ile okul kataloglarına yazdı; önbellek düşürme yalnız komut
hattında (`CacheInvalidationRules`) çalıştığı için göç atlandı. Ölçüldü: Altınay ucu 77 ders döndü, rehberlik yok; ATA-AL'da
bir ders düzenlendiği için anahtar düşmüş, orada görünüyordu. Üç okulun `tenant:*:academics:subjects` anahtarı elle silindi
→ Altınay 78 ders, rehberlik listede.

⬜ Kapatma yolu: veri yazan göçten sonra ilgili önbellek anahtarları düşmeli — ör. API açılışında uygulanan göç varsa
etkilenen önbellek önekleri temizlenir, ya da önbellek anahtarı şema/göç sürümünü taşır. Tek seferlik elle silme kalıcı çözüm değil.

### `TB-254` · `CurriculumVersioningMigrationTests.Cutover_…` kırmızı: eski göç noktasında güncel model `track` kolonunu okuyor ⚪

2026-09-25'te Y-05 doğrulamasında çıktı (ajan ölçümü). Test göçleri eski bir noktaya kadar kurup veriyi güncel
kodla okuyor; `SessionCurriculum.LoadItemsAsync` Y-04'ün `track` kolonunu seçtiği için `Invalid column name 'track'`.
Y-04 (`14b1f130`, master) ile başladı; Y-05 değişikliğiyle ilgisi yok. Ürün kodu doğru; test, ara göç şemasında
güncel sorguyu çalıştırıyor.

⬜ Kapatma yolu: testin okuma adımı hedef göç noktasının şemasıyla uyumlu kalsın (ham SQL) ya da test kesme noktasını
güncel göçe taşısın. `TB-252` ailesi (entegrasyon testi ortam varsayımı).

### `TB-253` · Ders programında elle yerleştirme ve öğretmen değiştirme ders/yetkinlik denetlemiyor ⚪

2026-09-25 ders programı keşfinde çıktı (E-32 bağlamı; salt okunur inceleme, iddia elle doğrulandı).
`PlaceLessonCommandHandler` ve `AssignTeacherCommandHandler` yalnız müsaitlik (Unavailable → `timetable.override`)
ve slot/öğretmen/derslik çakışmasına bakıyor; dersin o şubenin müfredatında olup olmadığı ve öğretmenin o derse
yetkin olup olmadığı sunucuda denetlenmiyor (`ScheduleProgram.Place` yalnız slot tekilliği). Tek kapı ekranın
veri kaynağı: yan panel `CompetencyAssignmentSource`'tan besleniyor. Ama "öğretmeni değiştir" listesi
(`GetAvailableTeachersQueryHandler.cs:44-65`) yetkinliğe bakmadan her aktif öğretmeni gösteriyor. Alan dışı
atama meşru olabilir (K-14 gerekçe ister); burada gerekçesiz ve izsiz geçiyor. [[kural-ekranda-degil-sunucuda]]

⬜ Kapatma yolu: E-32 tasarımıyla birlikte ele alınmalı (sınıf rehber öğretmeni dersleri yetkinlik istemeyecek);
elle yerleştirmede "müfredatta yok" reddi, alan dışında gerekçe.

🟡 **Kodda düzeltildi, commit bekliyor** (dal `feat/sinif-rehberligi-dersleri`, Y-05 dilim 4): `PlaceLesson` ve
`AssignTeacher` müfredatta olmayan dersi reddeder, alan dışı öğretmende ≥15 karakter gerekçe ister ve yerleşime yazar;
öğretmen listesi sunucuda `recommended` / `in-field` / `out-of-field` işaretli. Tohum okulunda uçla ölçüldü (422, 422,
gerekçeyle 201). Kapanış için ekranda gerçek yerleştirmeyle ölçülecek.

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
