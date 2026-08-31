# OKSİS — Bulgu Arşivi (kapanmış maddeler)

> **Ne bu dosya:** [[OKSİS - Bulgu Kayıt Defteri]]'nde 2026-08-08 … 2026-08-31 arasında
> açılıp **kapanmış** bulguların tam kaydı — kanıtlar, ölçümler, commit'ler, ekran
> görüntüleri ve kapanış turlarının anlatısı. Ana defterden 2026-08-30'da buraya taşındı.
> **Açık bulgular burada yok**; onlar ana defterde. Bu dosyaya yeni madde yazılmaz —
> ana defterde bir madde kapandığında bloğu buraya, ait olduğu bölümün altına taşınır.
> **İlgili:** [[OKSİS - Bulgu Kayıt Defteri]] · [[OKSİS - Yapısal Kararlar ve Eksikler]]

> [!warning] Bu dosya **Multi-Column Markdown** eklentisi ister
> Ayarlar → Community plugins → Browse → **"Multi-Column Markdown"** (ckRobinson) → Install → Enable.
> Eklenti kurulu değilse içerik kaybolmaz, sadece iki sütun yan yana değil alt alta görünür.
> *(Yalnızca [Netleştirme Bekleyenler](#netleştirme-bekleyenler-) bölümü iki sütunlu.)*

**Kaynak partiler (kronolojik):**

| # | Parti | Tarih | Damga |
|---|---|---|---|
| 1 | İlk bakış testi, 1. parti | 2026-08-08 | ham not: `Bulgular.md` |
| 2 | Kod taraması — domain-map | 2026-08-10 | `oksis-api` @ `2270867` |
| 3 | Kod taraması — duyurular/acil kavşağı | 2026-08-10 | `TB-22`…`TB-26` |
| 4 | Çalışma zamanı hata kaydı | 2026-08-10 | `B-15` · `X-06` |
| 5 | Uçtan uca ekran testi (kurulum→mezuniyet) | 2026-08-16 | `oksis-api` @ `7667084` · `oksis-ui` @ `2325383` |
| 6 | Düzeltme turu + açık bulgu turu (38 kapanış) | 2026-08-16/17 | §13 · §14 |
| 7 | `ENG-02` tasarım alımı, ekran ve cihaz turları | 2026-08-17/18 | §15 … §19 |
| 8 | `K-10` uygulama denetimi | 2026-08-18 | §20 |
| 9 | Not modülü kod taraması, portu ve uçtan uca testi | 2026-08-19 … 08-25 | §21 · §22 · §24 |
| 10 | Depo hijyeni | 2026-08-23 | §23 |
| 11 | Ödev modülü kod taraması ve portu | 2026-08-26 … 08-29 | §25 |
| 12 | Kulüp modülü test hazırlığı | 2026-08-30 | §27 |
| 13 | Bulgu kapanış turu — A–D blokları | 2026-08-31 | §29 · 12 madde |

**ID şeması:** `B-##` fonksiyonel · `D-##` tasarım/UX · `V-##` validasyon ·
`X-##` çapraz kesen · `TB-##` teknik borç · `E-##` eksik özellik · `ENG-##` engel.
Sayaçlar ana defterle ortaktır; yeni ID ana defterden alınır.

---

## Özet — 1. parti panosu (tarihsel)

> Aşağıdaki sayılar ve "açık kalanlar" satırları **2026-08-12 tarihindeki** durumu
> anlatıyor; olduğu gibi bırakıldı. Bugünkü açık liste için [[OKSİS - Bulgu Kayıt Defteri]].

| Öncelik | Adet | Kapsam |
|---|---|---|
| 🔴 Kritik | 7 | Akışı bloklıyor veya iş kuralı ihlali üretiyor |
| 🟠 Yüksek | 4 | İşlev yanlış çalışıyor, veri/yetki güveni zedeleniyor |
| 🟡 Orta | 8 | İşlev eksik ama alternatif yol var |
| ⚪ Düşük | 7 | Kozmetik / temizlik |
| **Toplam** | **26** | 17 fonksiyonel + 8 tasarım + 1 validasyon |

**Kapananlar:** `B-02` · `B-03` · `B-04` · `B-04a` · `B-08` · `B-09` · `B-10` · `B-11` · `B-06` · `B-12` · `B-13` · `B-14` · `B-15` · `B-16` · `B-17` · `B-18` · `D-02` · `D-03` · `D-05` · `D-07` · `D-08` · `TB-20` · `TB-22` · `TB-23` · `TB-25` — `X-01`, `X-02`, `X-07` ve `X-06`'nın dar ayağı da kapandı.
**Yeni açılanlar:** `B-16` (kimlik/oturum 🔴) · `D-08` (`B-14`'ün artığı) · `X-07` (çapraz kesen — açıldığı gün kapandı) · `X-09` (mobilde `X-01` yaygınlaştırması atlanmış, lint `master`'da kırmızı — 2026-08-12) · `TB-53` (ders silmenin kullanımda kapısı dar — `B-10` taramasından) · `TB-54` (giriş hata mesajı çevrilmemiş i18n anahtarı — `B-16` turundan) · `X-10` (rota kapısı rol yüklenirken geçirgen — `B-17` turundan) · `B-18` + `E-01` (rıza reddi yanlış ekrana düşüyor / rıza yenileme ekranı yok — `TB-10` turundan) · `B-19` (askıya alma ekranındaki tek düğme ölü — `B-18` turundan) · `B-20` + `TB-55` (içe aktarmada davet bayrağı ölü / iki ayrı içe aktarma yolu — `TB-20` turundan), hepsi 2026-08-12.
**Kalan (bu dosyada, TB kuyruğu hariç):** 4 — 2026-08-12 turunda `B-04`, `B-06`, `B-10`, `B-13`, `B-16`, `B-17`, `B-18` ve `D-08` kapandı (ayrıca `TB-35`, `TB-10`, `TB-20`).
**Açık kalanlar:** `TB-76` (yayın bildirimi seçimi süs 🔴 — **ürün kararı bekliyor**) · `TB-77` (yayın önizlemesi sabit sayı gösteriyor 🔴) · `V-01` (nöbet çizelgesi sezon yaşam döngüsü) · `D-04` (hedefi bulunamadı, netleştirme bekliyor) · `B-19` (ölü düğme — **karar bekliyor**) · `B-20` (içe aktarmada davet üretilmiyor 🟠) · `E-01` (rıza yenileme ekranı — **kapsam kararı bekliyor**) — ayrıca çapraz kesenler `X-03`/`X-05`/`X-06 geniş ayak`/`X-10`/`X-11 (CI ayağı)`.

---

### 2026-08-16 · Uçtan uca ekran testi partisi (28 yeni madde)

| Öncelik | Adet | Maddeler |
|---|---|---|
| 🔴 Kritik | 11 | `E-11` (hiç e-posta gitmiyor) · `E-12` (kapanış yüzeyleri yok) · `B-30` (devir sonrası öğrenci kayboluyor) · `B-31` (yarım mezuniyet) · `B-21` (sessiz veri kaybı) · `B-22` (rol sütunu/süzgeci ölü) · `B-24` (olmayan SMS "gönderildi") · `B-26` (iki görevlendirme kaynağı) · `B-27` (mobil oturum kalıcı değil) · `X-12` (uydurma veri) · `X-13` (sessiz hata) |
| 🟠 Yüksek | 5 | `B-23` (sabit kayıt tarihi) · `B-25` (artık taslak + sessiz 409) · `B-28` (öğretmene yönetici ekranı, 403 yanlış anlatılıyor) · `B-32` (ölü buton + onaysız devir) · `E-13` (dini bayramlar şemada yok) |
| 🟡 Orta | 3 | `B-29` (modül ekranı ölü) · `E-15` (modül envanteri üretilmiyor) · `E-14` (rehber öğretmen devri) |
| ⚪ Düşük | 9 | `V-02` · `V-03` · `D-09` … `D-14` · `TB-56` |
| **Toplam** | **28** | 12 fonksiyonel + 6 tasarım + 5 eksik özellik + 2 çapraz kesen + 2 validasyon + 1 teknik borç |

---

### 2026-08-17/18 · `ENG-02` ekran + cihaz turları partisi (13 yeni madde)

`ENG-02` **kapandıktan sonra** aynı yüzeyde ölçülenler. Turun dersi tek cümlede:
*ekranın var olması, ekranın doğru olduğu anlamına gelmiyor.*

| Öncelik | Adet | Maddeler |
|---|---|---|
| 🔴 Kritik | 4 | `TB-65` (iki dönemin dersi aynı hücrede çakışıyor) · `TB-71` (mobil ekran uygulama kabuğunun dışında) · `TB-74` ("Yoklamaya git" çıkmaza gidiyor) · `TB-76` (bildirim seçimi süs — "gönderme" denince de gidiyor) |
| 🟠 Yüksek | 3 | `TB-72` (`/planned` çıkışsız ekran) · `TB-73` (kısayol var olan ekranı "yakında" gösteriyor) · `TB-77` (yayın önizlemesinin sayıları sabit) |
| ⚪ Düşük | 6 | `TB-66` · `TB-67` · `TB-68` (iç içe dokunma hedefi) · `TB-69` (ham ISO tarih) · `TB-70` (etiket iki yerde) · `TB-75` (yayın damgası + saat dilimi kopyası) |
| **Toplam** | **13** | hepsi teknik borç; **11'i kapandı**, `TB-76` ve `TB-77` **karar bekliyor** |

Bölümler: [17. Ekran Testi Turu](#17-eng-02-ekran-testi-turu-2026-08-17-gece) ·
[18. Cihaz Turu](#18-cihaz-turu--ders-programı-yüzeyi-2026-08-18) ·
[19. Mobil Öğrenci Ölçümü](#19-mobil-öğrenci-ölçümü-ve-yayın-ekranının-sayıları-2026-08-18)

**Bu turda ✅ doğrulanan kapanışlar:** `B-16`/`ENG-01` · `B-13` · `B-04` akışı · `TB-35` · `X-04`
· tenant izolasyonu · yetki matrisi · web→mobil duyuru zinciri.

**En kısa yol haritası (zincire göre):** `E-11` tek başına kadro kurulumunu açar ·
`E-12` → `B-30`'un kök nedeni, ikisi birlikte çözülmeli · `B-31` tek satırlık uç değişimi ·
`X-12` + `X-13` ekran ekran değil tek kural olarak ele alınmalı.

**Katman dağılımı:** BE 10 · FE 9 · Her ikisi 5

**Çapraz kesen 6 iş** (`X-01` … `X-06`) mevcut bulgulardan türetildi, sayıma dahil değil — bkz. [Çapraz Kesen İşler](#10-çapraz-kesen-i̇şler-).

---

## 1. Sezon Yönetimi 🔴

Bu modül şu an **yeni sezon açma akışını bloklıyor**. Diğer her şeyden önce kapanmalı.

### B-04 · Sezon açma 6. adımda validasyona takılıyor
- **Belirti:** "Sezonu aç" butonu `"Adım 0-5 arasında olmalı."` hatası veriyor. Kullanıcı 6. (Özet) adımda sezonu açabilmeli.
- **Katman:** BE + FE · **Öncelik:** 🔴 Kritik
- **Kök neden (BE):** `SaveSeasonDraftCommandValidator.CurrentStep` kuralı `InclusiveBetween(0, 5)` — özet adımı aralık dışında kalıyor.
- ✅ **Backend düzeltmesi COMMIT EDİLDİ** — `oksis-api` @ `238f5e1` *"sezon sihirbazi adim araligi 0-6ya genisletildi"*. Doğrulandı (2026-08-12): `SaveSeasonDraftCommandValidator` bugün `InclusiveBetween(0, 6)` diyor. Buradaki eski *"henüz commit edilmedi"* notu **bayattı** ve düzeltildi.
- 🔍 **ÖLÇÜM DEFTERİ DÜZELTTİ — iki değil ÜÇ yerde yazılıymış** *(2026-08-12)*: `packages/core/.../constants.ts` → `WIZARD_STEP_COUNT = 6`, `academic-sessions-page.tsx` → **ayrı bir literal** `TOTAL_WIZARD_STEPS = 6`, BE validator → `InclusiveBetween(0, 6)`. Yani `oksis-ui`'nin kendi içinde de bir kopya vardı; `wizard.tsx` core'u kullanıyordu, sayfa kullanmıyordu.
- 🔄 **TEŞHİS DEĞİŞTİ — "iki repoyu tek sabite bağla" yapılabilir bir şey değil, üstelik yanlış hedef.** Ölçüm: `CurrentStep` sunucuda **saf geçiş verisi** — hiçbir handler ona dallanmıyor, yalnız saklanıp DTO ile geri veriliyor (*"kaldığın yer"* imleci). Dolayısıyla BE'deki tavan bir iş kuralı değil, **istemcinin UI şeklinin aynası**. Asimetri ölçüldü:

| Tavan istemcinin adım sayısından… | Sonuç |
|---|---|
| **küçükse** | akış bloklanır — **B-04'ün ta kendisi** |
| eşitse | her yeni adımda iki repo birlikte değişmek zorunda; unutulursa yukarıdaki satır |
| **büyükse** | hiçbir şey olmaz (sunucu bu değere dallanmıyor) |

  ➡️ Doğru tavan *"adım sayısına eşit"* değil, *"hiçbir sihirbaz şeklini bloklamayacak kadar geniş, çöp değeri eleyecek kadar dar"*. **Aynalamanın kendisi ayrışma üreticisiydi**; kaldırılan şey doğrulama değil, iki repo arasındaki gereksiz bağ.
- ✅ **KAPANDI** *(`oksis-api` @ `9f38698` + `oksis-ui` @ `b19e47f`, 2026-08-12)*:
  - **BE:** literal kalktı, sınır `SeasonDraft.MaxStep` (= 50) domain sabiti. Dosyanın kendi deseni zaten buydu — ad uzunlukları da `SeasonDraft.MinNameLength`'ten geliyordu; adım sınırının literal kalması bir tutarsızlıktı.
  - **BE ikinci ayak — domain ile validator hemfikir değildi:** `UpdateProgress` yalnız negatifi kırpıyor, tavanı **hiç bilmiyordu**; tavan SADECE validator'da yaşıyordu. Komut dışından çağıran biri 999 yazabilirdi. Artık iki uç da domainde kırpılıyor.
  - **FE:** sayı artık hiçbir yerde **yazılmıyor, sayılıyor** — adım listesi (`SEASON_WIZARD_STEPS`) core'a taşındı (emsali yanındaki `SEASON_COPY_ITEMS`), `WIZARD_STEP_COUNT = SEASON_WIZARD_STEPS.length`. Yeni adım eklemek tek bir diziye satır eklemek demek; sayının ayrışması artık **mümkün değil**, unutulabilir bir ikinci yer yok.
- 🔎 **EKRAN TESTİ BEKLENMEYEN İKİNCİ AYAK ÇIKARDI ve düzeltmemin açığını gösterdi:** Uç ölçümü için taslağı `currentStep = 50` ile kaydettikten sonra sezon listesine bakınca kart **"Adım 50/6"** yazıyordu. Kırpmayı yalnız sihirbaz girişine koymuştum; oysa imleci **üç yüzey** okuyor (taslak kartı, vazgeç modalı, sihirbaz). Üçünü tek tek kırpmak tam da düzeltmeye çalıştığım deseni geri getirirdi. Kırpma **DTO'nun istemci tipine dönüştüğü tek sınıra** taşındı (`packages/api` → `toSeasonDraft`), ekran kodundan tamamen çıkarıldı.
- ✅ **Canlı uçta beş ölçüm** *(`mudur.s1`, `PUT /api/v1/season-drafts/current`)*:

| `currentStep` | HTTP | Mesaj | DB'de saklanan |
|---|---|---|---|
| 5 | 200 | — | 5 |
| **6** | **200** | — | **6** |
| 50 | 200 | — | 50 |
| 51 | 400 | *"Adım 0-50 arasında olmalı."* | değişmedi |
| −1 | 400 | *"Adım 0-50 arasında olmalı."* | değişmedi |

- ✅ **EKRAN KANITI — bulgunun tam senaryosu:** Sezon Yönetimi → Taslağa Devam Et → kart artık **"Adım 6/6"** (50 değil) → sihirbaz 1→6 kesintisiz ilerledi → 6. adımda **"Sezonu Aç"** → `POST /api/v1/academic-sessions/open-from-draft` **201 Created**, ekranda *"Sezon açıldı · 2026-2027 sezonu oluşturuldu"*. Bulgunun şikâyet ettiği `"Adım 0-5 arasında olmalı."` hatası **hiç görünmedi**. ![[B-04-sonra-6-adimda-sezon-acildi.png]]
- ♻️ **Ortam geri alındı:** ölçüm için `s1`'de açılan Setup sezon `cancel-setup` (204) ile iptal edildi, test taslağı silindi; okul tek Aktif sezonla ve taslaksız eski hâline döndü.
- 🧪 **Testler ve boş-yere-yeşil kontrolü:** BE'de 6 vakalık kırpma teorisi + tavanın adım sayısına yapışmadığını kilitleyen test; FE'de core (imleç kırpma + sayının listeden türediği) ve `packages/api` sınır testleri. **İki tarafta da RED kanıtlandı:** BE'de eski kırpma satırı geri konunca yalnız aralık dışı iki vaka düştü (mevcut davranış korunuyor), FE'de eski `Number(...) || 1` geri konunca sınır testinin 2/4'ü düştü. BE 695 + 1562 yeşil, `packages` 144+103+288 yeşil, typecheck temiz.
- ⬜ **Bir sonraki adım eklendiğinde ne olacak:** hiçbir şey. FE'de diziye satır eklenir, BE hiç değişmez. `B-04`'ü doğuran koşul artık kurulamıyor.

### B-04a · Validasyon uyarısı ekranda doğru gösterilmiyor
- **Belirti:** BE'den dönen validasyon mesajı kullanıcıya düzgün yansımıyor; kullanıcı neden takıldığını ekrandan anlayamıyor.
- **Katman:** FE · **Öncelik:** 🟠 Yüksek
- **Not:** B-09 ile **aynı kök problem** — BE validasyon/hata mesajlarının notify katmanına taşınması. İkisi tek işte çözülmeli. -Proje Genelinde bu sorun var gibi genel bir çözüm bulunmalı yamalama kabul değil -
- ✅ **KAPANDI — `X-01` yaygınlaştırmasının içinde** *(`oksis-ui` @ `a674b97`, 2026-08-11)*: Kök neden `academic-sessions/wizard.tsx`'te ölçüldü — sezon açma `catch { onToast("Sezon açılamadı.") }` ile yakalanıyordu; backend'in validasyon cümlesi buraya kadar geliyor ama sabit metinle **örtülüyordu**. Artık `mutationErrorDesc(err)` geçiyor.
- 📌 **Kullanıcının şartı karşılandı:** *"yamalama kabul değil"* — düzeltme bu ekrana özel değil; 31 `onError` + 5 `catch` yeri birlikte bağlandı ve sapmayı yakalayan lint kuralı kuruldu.

### B-07 · Sezon devrinde görevlendirmeler aktarılmıyor
- **Belirti:** Yeni sezon başlatılırken "Görevlendirmeler aktarılsın" seçilmesine rağmen aktarım gerçekleşmedi.
- **Katman:** BE · **Öncelik:** 🔴 Kritik
- **Kontrol edilecek:** Seçim bayrağı komuta taşınıyor mu, rollover handler'ında görevlendirme dalı var mı, tenant/sezon filtresi kaynak kayıtları eliyor mu.
- **Bağlantı:** B-05 (branşsız öğretmen) aktarımı sessizce düşürüyor olabilir.
- ❌ **HİPOTEZ ELENDİ:** Bağlantı `B-05` DEĞİLMİŞ. Kopyalama öğretmenin branşına hiç bakmıyor (`CopyAssignmentsToNewSeasonCommandHandler`); atlama gerekçeleri yalnız ayrılmış öğretmen, hedef şube yokluğu, arşiv şube ve mükerrer kayıt. Branşsızlık *görevlendirme oluşturmayı* engelliyor, *kopyalamayı* değil.
- 🔍 **Ölçüm:** Aktarım dalı **vardı** ve seed verisinde **çalışıyordu** (`s2`/`s3` 2026-2027 sezonlarında 8 şubenin 6'sı kaynak-bağlı, 60 görevlendirme kopyalanmış; kopyalanmayan 20 satır giriş kademesi şubelerine ait ve **atlanmaları doğru** — o şubeler bilinçli olarak kaynaksız üretiliyor). Yani kod "hiç kopyalamıyor" değildi. Sorun **üç ayrı yerde bilginin düşmesiydi:**

| # | Nerede | Ne düşüyordu |
|---|---|---|
| 1 | `ActivateSeasonRolloverCommandHandler` | Sihirbazdaki **`CopyAssignments` tercihi hiç okunmuyordu**. Taslak yalnız SİLMEK için, üstelik kopyalamadan SONRA yükleniyordu. Kutu **ölüydü**: kapatsanız da kopyalıyordu. |
| 2 | Aynı handler | Alt handler'ın ürettiği **gerekçeli atlama listesi atılıyordu** — yalnız `CopiedCount` alınıyordu. |
| 3 | `packages/api` `activateSeasonRollover` | Dönüş `Promise<void>` ilan edilmişti; **özetin tamamı çöpe gidiyordu.** |

- ➡️ **Belirtinin açıklaması:** kullanıcı kutuyu işaretliyor, devir çalışıyor, kopyalanacak satırlar (ör. yeni açılan kademe şubeleri) `no-target-class` ile atlanıyor ve ekranda **hiçbir şey yazmıyor**. "Aktarım gerçekleşmedi" algısı buradan doğuyor.
- ✅ **KAPANDI** *(`oksis-api` @ `9a92c20` + `oksis-ui` @ `9ad6017`, 2026-08-11)*:
  - Taslak **kopyalamadan önce** okunuyor; `CopyAssignments` tercihi artık uygulanıyor. Taslak yoksa kopyalanır — kaydı olmayan bir tercihi "hayır" saymak, kullanıcının hiç vermediği kararı onun adına vermek olurdu.
  - Atlama gerekçeleri sonuca taşındı (`ActivateSeasonRolloverResult.AssignmentsSkipped`).
  - İstemci sonucu döndürüyor; cümleyi **core kuruyor** (`seasonRolloverSummary`) ve devir sonunda toast olarak görünüyor.
- ⚠️ **YOLDA BİR REGRESYON ÜRETİP YAKALADIM:** ilk düzeltmede rol atamalarının kopyalanmasını (`CopyRoleAssignmentsAsync`) da tercihe bağlamıştım. Yanlıştı — kutu *"öğretmen görevlendirmeleri kopyalansın mı"* diye sorar, **personelin yetkisiyle ilgili değildir**. Bağlı kalsaydı kutuyu kapatan müdür açtığı sezonda kendini kilitler ve tüm yönetim ekranları 403 dönerdi (kodun kendi notu bu riski zaten yazmış). Kapı ayrıldı ve **ayrı kaldığını kilitleyen bir test** yazıldı.
- 🧪 3 yeni entegrasyon testi (`ActivateSeasonRolloverTests` → **9/9**) + 5 core testi; `packages` 526/526, typecheck ve lint temiz.
- 📌 **Sıfır kopyalama artık İKİ farklı cümle:** atlama listesi doluysa gerekçeleri sayılarak yazılıyor (*"3 görevlendirme aktarılmadı (2 yeni sezonda karşılığı olan şube yok, 1 öğretmen ayrılmış)"*), liste de boşsa *"aktarılacak görevlendirme yoktu"*. Bilinmeyen gerekçe kodu **yutulmaz**, ham hâliyle geçer.
- ⬜ **Canlı devir ekran testi YAPILMADI ve bu bilinçli:** gerçek bir sezon devri `s1`'deki aktif sezonu arşivler — dev verisinde geri alınması zor bir durum değişikliği. Ölçüm entegrasyon testleriyle (gerçek SQL Server) yapıldı. İstenirse `s1`'de uçtan uca devir koşulabilir.

---

## 2. Nöbet & Vekalet 🔴

En yoğun bulgu barındıran modül. B-12 ve B-13 muhtemelen **tek kök nedene** bağlı.

### B-13 · Sürekli muafiyetli öğretmene otomatik nöbet atanıyor
- **Belirti:** Öğretmene sürekli muafiyet tanımlı olmasına rağmen adil otomatik dağıtımda nöbet ataması yapıldı.
- **Katman:** BE · **Öncelik:** 🔴 Kritik (iş kuralı ihlali)
- **Hipotez:** Muafiyet kaydı ya hiç persist olmuyor (bkz. B-12) ya da dağıtım algoritması muafiyet tablosunu hiç sorgulamıyor. **Önce B-12 çözülüp muafiyetin DB'ye yazıldığı doğrulanmalı**, sonra algoritma incelenmeli.
- 🔍 **İkinci hipotez ELENDİ** *(kod taraması, 2026-08-10 @ `2270867`)*: Algoritma muafiyeti **sorguluyor**. Sürekli muafiyetli öğretmen üç ayrı noktada dışlanıyor — dağıtım işi öğretmen havuzunu kurarken, çizelge taslağı kaydedilirken ve otomatik sonuç uygulanırken. Çizelge aggregate'i de muaf öğretmene atamayı reddediyor.
- ➡️ **Kalan tek yol B-12:** Muafiyet kaydı DB'ye hiç yazılmıyorsa (401) hiçbir filtre onu göremez. **B-12 kapanmadan B-13'ün algoritma tarafında aranacak bir şey yok.**
- ⚠️ **Ama dikkat:** Yukarıdaki filtrelerin hepsi **sürekli** muafiyet içindir. Geçici muafiyet için ayrı bir boşluk var — bkz. `TB-19`.
- ✅ **KAPANDI — canlı A/B ölçümüyle, kod değişikliği GEREKMEDİ** *(2026-08-12, `mudur.s2` · Atatürk Anadolu Lisesi · dönem 2026-08-03 → 08-14)*. Kod okumak yetmezdi; dağıtım gerçekten koşturuldu.
  - **Senaryo:** çizelgede **2 nöbeti olan** bir öğretmen (Tuğçe Avcı) seçildi, sürekli muafiyet tanımlandı (uç **201**, DB'de doğrulandı), `FromScratch` adil dağıtım koşturuldu. Sonra **muafiyet kaldırılıp aynı dağıtım tekrar** koşturuldu — tek değişken muafiyet.

| Sürekli muafiyet | Öğretmen **nöbetçi** olarak | Öğretmen **vekil** olarak | Farklı nöbetçi sayısı |
|---|---|---|---|
| **VAR** | **0** | **0** | 13 |
| **YOK** | **2** | **3** | 14 |

  - ➡️ **Algoritma muafiyete uyuyor ve iki rolde birden uyuyor** — yalnız nöbetçi havuzundan değil, **vekil havuzundan da** çıkarıyor. Kod taramasının *"üç noktada dışlanıyor"* bulgusu canlıda doğrulandı.
- 🔍 **Belirtinin gerçek açıklaması `B-12`/`X-07`:** Kullanıcı muafiyeti işaretlediğinde **POST 401 ile patlıyordu** (istemcinin 401-retry hattı gövdeli isteklerde kırıktı) ve **muafiyet hiç kaydedilmiyordu**. Dağıtım da kaydı olmayan bir muafiyeti göremeyeceği için öğretmene nöbet yazıyordu. `B-12`'nin kendi cümleleri bunu birebir anlatıyor: *"işaretleme sorunsuz"* (GET'ler) · *"ekleme aşamasında patlıyor"* (POST). **Yani `B-13` bağımsız bir hata değil, `X-07`'nin görünen yüzüydü** — `X-07` kapandığı için de artık üretilemiyor.
- ♻️ **Ortam korundu:** öneri işleri yalnız üretildi, **`/apply` hiç çağrılmadı**; test muafiyetleri silindi. Çizelge 30 atamayla, o öğretmen 2 nöbetiyle ölçüm öncesi hâlinde.
- ⚠️ **Kapanış YALNIZ sürekli muafiyet içindir.** Aynı ölçüm turunda geçici muafiyetin gerçekten kırık olduğu canlıda gösterildi → `TB-19`.

### B-12 · Muafiyet eklemede 401 Unauthorized
- **Belirti:** Bölgeler & Politika sekmesinde muafiyet eklenirken 401 alınıyor. İşaretleme sorunsuz, ekleme aşamasında patlıyor.
- **Katman:** BE (yetki) · **Öncelik:** 🟠 Yüksek
- ❓ **Netleştirme gerekli:** "Sürekli işaretlendiğinde sorun yok ama sürekli eklendiğinde" ifadesi iki farklı okumaya açık — (a) *sürekli muafiyet tipi* eklenirken mi, (b) *arka arkaya defalarca* eklerken mi? Tekrar denenip hangi endpoint'in 401 döndüğü network sekmesinden alınmalı.
- **Kontrol edilecek:** Muafiyet create endpoint'inde permission attribute'u eksik/yanlış olabilir; 401 (401 ≠ 403) olması token yenileme sorununa da işaret edebilir.
- ✅ **KÖK NEDEN BULUNDU ve KAPANDI** *(ekran testi turu, 2026-08-11 · `oksis-ui` @ `<pending>`)* — **token yenileme hipotezi doğru çıktı, yetki hipotezi elendi.**
  - **Yetki ayağı elendi:** Uç ekrandan çağrıldı → **201 Created**. Ardından iki okuma da doğrudan denendi: 8 farklı öğretmene arka arkaya (okuma **b**) ve aynı öğretmene 4 kez üst üste — **12 POST'un hepsi 201**. `duties.manage` izni yerinde, endpoint sağlam.
  - **Gerçek kök neden — istemcinin 401-retry hattı gövdeli isteklerde kırık:** `packages/api/src/client/auth-refresh.ts` içindeki `authMiddleware.onResponse`, 401 alınca token'ı yeniliyor ve isteği `request.clone()` ile bir kez daha deniyordu. Ama `Request.clone()` **yalnız gövde tüketilmeden önce** çalışır; istek çoktan gönderilmiştir.
  - **Tarayıcıda ölçüldü** *(aynı sayfada, aynı motor)*: gövdeli istek → `clone()` **`Failed to execute 'clone' on 'Request': Request body is already used`**; gövdesiz (GET) istek → `clone()` **başarılı**.
  - ➡️ **Belirtinin birebir açıklaması:** *"İşaretleme sorunsuz"* = GET'ler; token süresi dolsa bile sessizce yenilenip yeniden deneniyor. *"Ekleme aşamasında patlıyor"* = POST; retry `clone()`'da patlıyor ve kullanıcı 401'i görüyor. *"Sayfa yenilenince düzeliyor"* = yeniden yüklemede token taze.
  - 🚫 **Bu tek ekranın bulgusu DEĞİL:** kırık olan ortak istemci hattı. **Token süresi dolduktan sonraki ilk yazma işlemi (POST/PUT/PATCH) uygulamanın her yerinde patlıyordu.** Çapraz kesen boyutu → `X-07`.
  - **Düzeltme (merkezi):** Bozulmamış kopya artık **`onRequest`'te**, gövde tüketilmeden alınıyor ve `WeakMap` ile isteğe bağlanıyor; `onResponse` retry'da o kopyayı kullanıyor. Tek nokta, ekran yaması yok.
- 📌 **`B-13` için sonuç:** Muafiyet kaydı **DB'ye yazılıyor** (12/12 201). Yani *"muafiyet hiç kaydedilmiyor, o yüzden dağıtım göremiyor"* zinciri **koptu** — `B-13`'ün açıklaması bu değil. Algoritma tarafı da daha önce temize çıkmıştı; geriye `TB-19` (geçici muafiyet) ve yeniden üretim kalıyor.

### B-11 · Bölge pasif olarak eklenemiyor
- **Belirti:** Bölgeler & Politika sekmesinde bölge pasif durumda oluşturulamıyor; güncellemede sorun yok.
- **Katman:** BE · **Öncelik:** 🟡 Orta
- **Kök neden adayı:** Create handler'ı `IsActive` alanını yok sayıp sabit `true` atıyor.
- ✅ **Kök neden DOĞRULANDI** *(kod taraması, 2026-08-10 @ `2270867`)*: Oluşturma komutu `IsActive` parametresini **hiç almıyor**; domain fabrikası kaydı sabit `IsActive = true` ile kuruyor. Ayrı `Activate()` / `Deactivate()` davranışları var ama oluşturma yolu bunları çağırmıyor — güncellemenin çalışması bu yüzden. **Düzeltme:** komuta `IsActive` eklenip fabrikaya taşınmalı.
- ➕ **İkinci ayak — istemci de bayrağı düşürüyordu** *(ekran testi turu, 2026-08-11)*: `oksis-ui` → `packages/api/src/duty/endpoints.ts` içindeki `createDutyLocation` gövdeye `isActive`'i **bilinçli olarak koymuyordu** (yorumu: *"backend yeni bölgeyi aktif kabul eder"*). Yani yalnız backend düzeltilseydi ekranda hiçbir şey değişmezdi — bulgu iki depoda birden yaşıyordu.
- ✅ **KAPANDI — ekran testi turu** *(`oksis-api` @ `dd54194` + `oksis-ui` @ `4ac0c93`, 2026-08-11)*:
  - **BE:** `DutyLocation.Create(..., bool isActive = true)` — bayrak fabrikaya taşındı; `CreateDutyLocationCommand` ve handler bunu geçiriyor. Varsayılan `true` olduğu için 13 mevcut çağıran (testler dahil) etkilenmedi.
  - **FE:** `createDutyLocation` artık `isActive`'i gönderiyor; OpenAPI şeması yeniden üretildi.
  - **Ekran kanıtı:** Nöbet & Vekâlet → Bölgeler & Politika → Bölge Ekle, "Bölge aktif" anahtarı **kapalı** ![[B-11-modal-pasif-anahtari.png]] → kayıt **pasif** olarak listeye düştü ![[B-11-sonra-pasif-bolge.png]]
  - **DB kanıtı:** `SELECT name, is_active FROM academic.duty_locations WHERE name LIKE 'B-11%'` → `is_active=0`.

### B-02 · Nöbet/Vekalet ↔ Yoklama ilişkisi
- **Belirti:** İki modül arasında ilişkisel sorun gözlendi.
- **Katman:** Belirsiz · **Öncelik:** 🟠 Yüksek
- ❓ **Netleştirme gerekli:** Bulgu şu haliyle aksiyona dönüşmüyor. Somutlaştırılması gereken: vekalet edilen derste yoklamayı kim açabiliyor / yoklama kime yazılıyor / nöbetçi öğretmen yoklama listesinde görünüyor mu?
- **Not:** Netleşene kadar iş kalemine dönüştürülmedi.
- ✅ **Üç sorunun ÜÇÜ DE koddan cevaplandı** *(kod taraması, 2026-08-10 @ `2270867`)*:
  1. **Yoklamayı kim açar?** Vekâlet varsa **vekil öğretmen**. Oturum programdan üretilirken o güne yazılmış vekâlet istisnasına bakılıp "efektif öğretmen" çözülüyor; oturumun beklenen öğretmeni doğrudan vekil oluyor.
  2. **Yoklama kime yazılır?** Fiilen alan kişiye. Vekillik yalnız görüntü amaçlı bir rozet; kaydın sahibi vekildir.
  3. **Nöbetçi öğretmen listede görünür mü?** **Hayır — nöbetin yoklama ile hiçbir bağı yok.** Oturum yalnız ders programı istisnasına bakıyor; nöbet çizelgesi hiç sorgulanmıyor.
- ➕ **Ayrıca bulundu:** Ders programındaki **iptal** istisnası oturumu üretip doğrudan `İptal` durumunda doğuruyor — üzerine yoklama girilemiyor. Oturumu yalnız efektif öğretmeni görebiliyor; başkasına 403 değil **404** dönüyor (varlık sızdırmama, modülün genel deseni).
- ➡️ **Sonuç:** Ortada bir "ilişkisel sorun" değil, muhtemelen bir **kavram karışıklığı** var: nöbet ile vekâlet farklı şeyler ve yoklamayı yalnız vekâlet etkiliyor.
- ✅ **KAPANDI — 2026-08-11, kullanıcı onayıyla.** *"Kavram karışıklığıymış, kapat."* Nöbet ile vekâletin ayrı kavramlar olduğu beklenmiyordu; kod doğru çalışıyor, ortada bir hata yok. **Kod değişikliği yapılmadı.**
- 📌 **Kalan iz:** Bu karışıklık bir kullanıcıda doğduysa başkasında da doğar. Ürün tarafında nöbet ve vekâletin farkını ekranda anlatan bir ipucu düşünülebilir — bulgu değil, ürün notu.

### V-01 · Nöbet çizelgesi sezon yaşam döngüsüne bağlanmalı
- **Kural:** Çizelge yalnızca aktif sezon aralığında oluşturulabilmeli. Sezon bitiş tarihinde ve **yeni sezon açıldığında (taslak değil, açılmış sezon)** mevcut çizelge otomatik pasife alınmalı.
- **Katman:** BE · **Öncelik:** 🟠 Yüksek
- **Not:** Bu bir bulgudan çok **eksik iş kuralı**. Sezon açma akışına (B-04, B-07) bağlı olduğu için o iş bittikten sonra ele alınmalı.

---

## 3. Öğretmenler & Görevlendirmeler 🔴

### B-05 · Mevcut öğretmenin branşı hiçbir yerden belirlenemiyor
- **Belirti:** Kayıtlı bir öğretmenin branşını atayacak/değiştirecek ekran yok.
- **Katman:** BE + FE · **Öncelik:** 🔴 Kritik
- **Neden kritik:** Zincirin en üstünde. Branşsız öğretmen → görevlendirme yapılamıyor (B-09) → ders programı üretilemiyor (B-14) → sezon devrinde görevlendirme aktarımı boş kalıyor (B-07). **Bu modüldeki ilk iş bu olmalı.**
- 🔗 **İkinci ayak — `TB-20`** *(kod taraması, 2026-08-10)*: Ekran eksikliği sorunun yarısı. Toplu içe aktarma ve davet yolları da branşı katalog kimliğine **çözmüyor**; kod pilot için boş bırakılmasını kabul ediyor. Yalnız ekran eklenirse toplu eklenen öğretmenler yine branşsız doğar.
- 🔍 **Ölçüm bulguyu BÜYÜTTÜ: eksik olan yalnız ekran değildi, yazma yolunun KENDİSİYDİ** *(2026-08-11)*. `TeacherProfile.SetBranch` repo genelinde **tek bir yerden** çağrılıyordu: dev seeder (`IdentityDevSeeder.cs:266`). Hiçbir komut, hiçbir uç onu yazmıyordu. Yani ekran eklemek yetmezdi — arkasında çağrılacak bir şey yoktu.
- 🔍 **Ekran engeli gösteriyor, çözümü sunmuyordu:** öğretmen çekmecesi *"Branş eksik — bu öğretmene ders/sınıf görevlendirmesi yapılamaz"* uyarısını basıp görevlendirmeyi kilitliyordu. Kullanıcıya kaldıramayacağı bir engel gösteriliyordu. ![[B-05-once-brans-eksik-atama-alani.png]]
- ✅ **KAPANDI** *(`oksis-api` @ `6159942` + `oksis-ui` @ `a30a69f`, 2026-08-11)*:
  - **Yeni komut AÇILMADI** — var olan `UpdateProfileCommand` genişletildi. Öğretmenin diğer profil alanı (`TerminatedAt`) zaten oradaydı; ikinci bir yazma yüzeyi aynı kaydı iki kapıdan güncellenebilir yapardı. Uç de yeni değil: `PUT /users/persons/{id}/profiles/{type}`.
  - Öğretmen kolundaki `when request.TerminatedAt.HasValue` koruması kaldırıldı — o koruma kolu **tek alanlı** tutuyordu; artık iki alan aynı istekte gelebiliyor.
  - **İki kapı eklendi:** branş katalogda yoksa → *"Seçilen branş bulunamadı."*; pasifse → *"'X' branşı pasif durumda; öğretmene atanamaz."* Pasif kapısının emsali `B-11`: pasif kayda atama sessiz hatadır, kayıt oluşur ama listelerde görünmez. Gerekçe branşın **adıyla** döner ki kullanıcı hangisini aktifleştireceğini bilsin.
  - **`null` = değiştirme, "sil" değil.** Branş temizleme bilinçli olarak yok: branşsız öğretmen görevlendirilemediği için sessiz temizleme var olan görevlendirmeleri sahipsiz bırakırdı.
  - FE: çekmecede branş seçici + Ata/Değiştir. Seçenekler **yalnız aktif** branşlar; hata gerekçesi yine de basılıyor çünkü seçimle kaydetme arasında branş pasife alınabilir.
- ✅ **Canlı uçta dört senaryo** *(`mudur.s2`)*: branşsız öğretmen → uydurma branş ID'si **400** *"Seçilen branş bulunamadı."* (branş `null` kaldı) → gerçek aktif branş **204** (branş `Matematik` oldu) → pasife alınmış branş **400** *"'Biyoloji' branşı pasif durumda; öğretmene atanamaz."* (branş `null` kaldı). Pasife alınan branş test sonrası geri aktif edildi.
- ✅ **Ekran testi uçtan uca** *(Furkan Polat, branşsız)*: çekmecede seçici 15 aktif branş listeledi → "Kimya" seçilip **Ata**'ya basıldı → künye `Kimya` oldu, **"Branş eksik" uyarısı kayboldu**, buton `Değiştir`e döndü ve **arkadaki liste satırı da tazelendi**. Diğer öğretmenler hâlâ "Branş eksik" — değişiklik hedefe özel. ![[B-05-sonra-brans-atandi.png]]
- ✅ **Zincirin bir alt halkası ölçülerek açıldı:** Görevlendirmeler sekmesindeki *"Branş atanmadan görevlendirme yapılamaz"* engeli kalktı, "Ders/Sınıf Görevlendir" etkin. Bulgunun *"zincirin en üstünde"* iddiası doğrulandı.
- 🧪 5 birim testi (`UpdateProfileBranchTests`) + `Oksis.Application.UnitTests` **1562/1562 yeşil**; `oksis-ui` 521/521, typecheck ve lint temiz.
- ⬜ **`TB-20` AÇIK KALIYOR ve bu bilinçli.** Bu iş *mevcut* öğretmenin branşını atama yolunu açtı. Toplu içe aktarma ve davet akışında branş adının katalog kimliğine çözülmesi **hâlâ yok** (`ProfileBuilder.cs`'teki TODO duruyor) — yani toplu eklenen öğretmenler yine branşsız doğar, ama artık **tek tek düzeltilebilirler**. `B-05`'in kapanması `TB-20`'yi kapatmaz.
- ✅ **Zincirin ikinci ayağı da kapandı** *(2026-08-12)*: içe aktarma artık branş adını katalog kimliğine çözüyor, `ProfileBuilder`'daki TODO gitti — [[#TB-20 · Öğretmen branşı davet ve içe aktarma akışında atanmıyor 🟠]]. Öğretmen artık branşlı doğuyor; elle N tıklama kalktı.

### B-09 · Branşsız öğretmen seçilince BE mesajı bildirilmiyor
- **Belirti:** Görevlendirmelerde branşsız öğretmen seçildiğinde backend anlamlı bir mesaj dönüyor ama kullanıcıya notify edilmiyor.
- **Katman:** FE · **Öncelik:** 🟡 Orta
- **Not:** B-04a ile aynı kök problem → bkz. **X-01 · BE mesaj hattı**. Tek tek yamalanmayacak.
- ✅ **KAPANDI — ekran kanıtlı** *(`oksis-ui` @ `a674b97`, 2026-08-11)*: Kök neden `teacher-assignments/drawer.tsx` → `catch { onSaved("Görevlendirme kaydedilemedi.") }`. Backend **422** ile *"Branşı olmayan öğretmene görevlendirme yapılamaz."* döndürüyordu; sabit metin bunu örtüyordu.
- **Ekran testi:** Görevlendirmeler → Almanca → İlk Öğretmeni Ata → branşsız öğretmen (Eren Şen) → Görevlendir. **Önce:** modal kapanıyor, sayaç değişmiyor, hiçbir açıklama yok. **Sonra:** ![[B-09-sonra-be-mesaji-gorunuyor.png]]

---

## 4. Ders Programı 🟠

### B-15 · "Müsait öğretmen" ucu her çağrıda 500 dönüyor 🔴
- **Belirti:** `GET /api/v1/timetable/programs/{id}/available-teachers` → 500. Kayıt: `[21:32:14 ERR] Unhandled exception CorrelationId=fbe06603d7d44724bea4f90575e08faf`. İstisna: `System.InvalidOperationException: The LINQ expression … could not be translated`.
- **Katman:** BE · **Öncelik:** 🔴 Kritik
- **Etki:** Ders programında **vekil öğretmen seçimi tamamen ölü**. Veri koşuluna bağlı değil — sorgu SQL'e çevrilirken, tek satır okunmadan patlıyor; okul/dönem/slot ne olursa olsun uç %100 hata veriyor. Ekran boş liste bile alamıyor.
- **Kök neden — doğrulandı** *(çalışan API'nin tam yığın izinden, 2026-08-10)*, `Timetable/Queries/GetAvailableTeachers/GetAvailableTeachersQueryHandler.cs:52-58`:
  - `PersonName.FullName` hesaplanan bir property ve EF'te **açıkça yok sayılı**: `Persistence/Configurations/Users/PersonConfiguration.cs:33` → `name.Ignore(n => n.FullName)`. Kolon karşılığı yok, çevrilemez.
  - Handler bunu sunucu tarafı sorgunun içinde kullanıyor: `.Select(p => new AvailableTeacherDto(p.Id, p.Name.FullName)).OrderBy(t => t.Name).ToListAsync()`.
  - Patlayan operatör **`OrderBy`** — EF projeksiyonu sıralama ifadesinin içine geri gömüyor: `OrderBy(p => new AvailableTeacherDto(p.Id, EF.Property<PersonName>(p, "Name").FullName).Name)`. Tek başına `Select` son projeksiyonda istemci tarafında değerlendirilebilirdi; `OrderBy` bunu zorunlu çeviriye sokuyor.
- **Ne zamandır kırık:** Doğduğundan beri. Hatalı projeksiyon ucun **ilk commit'inde** var (`231f3e8`, 2026-06-13); `94ac5e1` (aynı gün) dokunmamış. Yani bu uç hiç çalışmadı — bugüne kadar çağrılmamış.
- **Çözüm yönü:** Depoda bu iş için **zaten yerleşik bir desen var** — önce `.Select(p => new { p.Id, p.Name }).ToListAsync()`, sonra bellekte `.FullName` ve sıralama. `GetAvailableRelievers`, `GetDutyRosterVersions`, `ListDutyExemptions`, `GetDutyRosterForEdit`, `ListScheduleExceptions`, `PublishedScheduleQueryHandler` hepsi bunu uyguluyor ve başlarında `FULLNAME PATTERN ALERT` yorumu taşıyor. `src/` altında `.Name.FullName` geçen **21 çağrı yerinden tek ihlal eden bu handler** — yani yama değil, desenin kendisi uygulanacak.
- 🙃 **Neden gözden kaçtı:** `GetAvailableRelievers`'daki uyarı yorumu deseni tarif ederken *"Same pattern as GetAvailableTeachers"* diye referans veriyor — referans gösterilen dosyanın kendisi deseni uygulamıyor.
- 🧪 **Testler neden yakalamadı:** `GetAvailableTeachersQueryHandlerTests` üç testle yeşil. `MockQueryable` LINQ-to-Objects üzerinde çalıştığı için `FullName`'i sorunsuz değerlendiriyor; bu sınıf hata **yalnız gerçek sağlayıcıda** doğuyor. Yapısal boyutu → `X-06`.
- ✅ **KAPANDI — ekran testi turu** *(`oksis-api` @ `dd54194`, 2026-08-11)*: Handler depodaki `FULLNAME PATTERN`'e geçirildi — önce `.Select(p => new { p.Id, p.Name }).ToListAsync()`, sonra bellekte `.FullName` + `OrderBy`. Yama değil, zaten var olan desenin uygulanması.
  - **RED kanıtı** *(düzeltmeden önce, çalışan API)*: `GET /api/v1/timetable/programs/310BB8B6…/available-teachers?day=1&period=1` → **HTTP 500**, gövde `{"code":"InternalError"}`, CorrelationId `3387c71c…`; sunucu logunda `InvalidOperationException: The LINQ expression … could not be translated`.
  - **GREEN kanıtı** *(aynı uç, düzeltmeden sonra)*: **HTTP 200**, 8 öğretmen ada göre sıralı döndü.
  - **Ekran kanıtı:** Ders Programı → 9-A → hücre menüsü → **Öğretmen Değiştir** alt menüsü artık doluyor: ![[B-15-sonra-ogretmen-listesi.png]] *(menünün kendisi: ![[B-15-hucre-menusu.png]])*
  - ⬜ **Sınıf hâlâ açık:** Bu tek handler kapandı, ihlali doğuran boşluk kapanmadı → `X-06`.

### B-14 · Otomatik program oluşturucu dersleri yanlış eksende yerleştiriyor
- **Belirti:** Dersler sağa doğru (gün ekseninde) yayılıyor; aşağı doğru (saat/ders ekseninde) yerleşmeli.
- **Katman:** BE (yerleştirme algoritması) · **Öncelik:** 🟠 Yüksek
- **Etki:** Üretilen program pedagojik olarak kullanılamaz halde çıkıyor.
- 🔄 **YENİDEN ÇERÇEVELENDİ — bu bir döngü hatası değil, algoritmanın hedefi** *(kod taraması, 2026-08-10 @ `2270867`)*:
  - Üretici üç ayrı **slot tercih stratejisi** çalıştırıp üç aday üretiyor. İkisi doğrudan güne yayıyor: biri "önce 1. saatler, tüm günlerde" diye sıralıyor, diğeri sınıfın **en az yüklü gününü** tercih ediyor ("haftaya yay"). Yalnız üçüncüsü gün-öncelikli, yani aşağı doğru dolduran.
  - Puanlayıcı da yayılmayı **ödüllendiriyor**: dersler tek güne yığılırsa denge puanı açıkça "en kötü" (0) veriliyor.
  - Aday seçimi **eksik saat**e, eşitlikte toplam puana bakıyor. Görsel/pedagojik eksen bir seçim ölçütü **değil**.
- ➡️ **Sonuç:** Kod "haftaya yay" diye tasarlanmış ve bunu yapıyor. Beklenen davranış bunun tersiyse yapılacak şey hata düzeltmesi değil **hedef değişikliği** — strateji ağırlıkları ya da yeni bir puan boyutu.
- 🔄 **ÖNCEKİ TEŞHİS EKSİKTİ — düzeltme (2026-08-11, gerçek program görseli geldikten sonra):** Yukarıdaki *"kod haftaya yay diye tasarlanmış ve bunu yapıyor"* okuması strateji/puanlayıcı için doğru ama **eksik**. Depoda **blok altyapısı zaten var** ve üç ayrı yerden birden devre dışı — aşağıda ölçüldü. Yani bu tam bir "hedef değişikliği" değil, **yarım kalmış bir özelliğin tamamlanması**.
- ✅ **NETLEŞTİ — 2026-08-11.** Cevap sorulan iki seçeneğin de dışında çıktı; ikisi de yanlış çerçeveymiş:
  - **İstenen ne "haftaya yay" ne "tek güne yığ" — istenen BLOK yerleştirme.** Bir ders haftada birden çok saat alıyorsa saatler **aynı gün içinde ardışık ikili bloklar** hâlinde konmalı, bloklar da farklı günlere dağıtılmalı.
  - **Kullanıcının verdiği örnek:** *3 saat* → bir güne **ardışık 2**, başka bir güne **1**. *4 saat* → iki ayrı güne **2+2 ardışık**.
  - **Bugünkü davranış:** 3 saat → Pzt 1, Sal 1, Çar 1 (her gün tek saat, hiç blok yok). Gerçek okul programı böyle kurulmuyor.
- ➡️ **Sonuç: bu bir hedef değişikliği, hata düzeltmesi değil.** Puanlayıcıya bugün **hiç olmayan** bir boyut ekleniyor: *aynı dersin aynı gün ardışık saatlerde olması ödüllendirilir.* Mevcut "haftaya yay" boyutu kaldırılmıyor, blok boyutuyla birlikte tartılıyor — çünkü bloklar da farklı günlere dağılmalı. İki hedef çelişmiyor, **iç içe**: gün ekseninde dağıt, gün içinde blokla.
- 🔗 **Bağlantı:** `TB-49` (müfredat saat sağlayıcısı stub) bu işin girdisini etkiler — bir dersin haftalık saatinin ne olduğu bugün yalnız elle yazılan `WeeklyHours`'tan geliyor.

#### Gerçek program görselinden çıkarılan hedef *(9B, aSc Ders Dağıtım, 2026-03-29)*

Kullanıcı gerçek bir okul programı iletti. Ölçülen desen:

| Ders | Haftalık saat | Yerleşim |
|---|---|---|
| Matematik | 6 | Pzt 3-4 · Sal 1-2 · Per 3-4 → **2+2+2, üç ayrı gün** |
| Türk Dili Ed. | 5 | Pzt 5-6 · Sal 6-7 · Sal 3 → **2+2+1** |
| Yabancı Dil | 4 | Pzt 7-8 · Çar 1-2 → **2+2, iki ayrı gün** |
| Kulüp · Sağlık Bil. · Adabı Muaşeret · Koçluk · Rehberlik | 1 | hepsi günün **kuyruğunda** (7. / 8. saat) |

- **Kural:** Haftalık saat ikili ardışık bloklara bölünür, bloklar farklı günlere dağıtılır. Tek kalan saat ayrı bir güne konur ve **ardışık bir bloğun arasına giremez** — bloğun önüne veya arkasına yerleşir. Tek saatlik dersler günün sonuna toplanır.
- ⚠️ **Eksen NOT'u:** Görselde saatler yatay, günler dikey; OKSİS'te tersi. **Kullanıcı bunu değiştirmek istemiyor** — `B-14` ızgara ekseniyle ilgili değil, bu okuma kesin olarak elendi.

#### Kod ölçümü: blok altyapısı VAR, üç yerden birden kapalı *(2026-08-11)*

1. **Ekranda varsayılan kapalı.** `oksis-ui` → `packages/core/src/schedule/constants.ts:183` → `preferBlockPairing: false`. Yani kullanıcı bu özelliği hiç açık görmemiş olabilir. (`limitDailySameSubject: true` ve sınır **günde 2** — blokla çelişmiyor, tam tersine ikili bloğa izin verip üçlüyü engelliyor.)
2. **Açık olsa bile blok atomik yerleştirilmiyor.** `LessonDemandBuilder` haftalık saati **tek tek saatlere** açıyor (`for i < WeeklyHours`). `GreedySolver` her saati bağımsız yerleştiriyor; `PreferBlockPairing` yalnız *"aynı dersin yanındaki slot önce denensin"* diyen **yumuşak bir sıralama**. Matematik'in 1. saati Pzt 1'e konduktan sonra, 2. saati sıraya gelene kadar araya başka dersler girip Pzt 2'yi kapatabiliyor — komşuluk kaçıyor. Gözlenen *"her güne bir saat"* tam olarak bu.
3. **Blok kavramı veri modelinde taşınıyor ama doldurulmuyor.** `PlannedPlacement` `IsBlock` ve `BlockGroupSeq` alanlarını taşıyor; üretici ikisini de sabit `false`/`0` yazıyor. `LessonDemandBuilder`'ın docblock'u bunu açıkça söylüyor: *"Blok üretimi bu dilimde KAPALI — BlockGroupSeq her zaman 0 (Debt-AG-8)."*
- ➡️ **Sonuç:** Yapılacak iş sıfırdan bir hedef değişikliği değil, **`Debt-AG-8`'in kapatılması**: (a) talep üretimi haftalık saati bloklara bölsün, (b) solver bloğu **atomik** yerleştirsin (bloğun tüm saatleri aynı gün ardışık ve hepsi feasible olmalı), (c) ekranda varsayılan açılsın.

#### ✅ Kod tarafı yapıldı *(`oksis-api` @ `<pending>`, 2026-08-11)*

Üç ayak da kapatıldı:

1. **`LessonDemandBuilder`** haftalık saati bloklara bölüyor (`SplitIntoBlocks`): 6→2+2+2, 5→2+2+1, 4→2+2, 3→2+1, 2→2, 1→1. Aynı bloğun saatleri ortak `BlockGroupSeq` taşıyor. **`BlockGroupSeq = 0` artık "blok değil" demek** — blok kapalıyken her saat 0 taşır, eski sözleşme ve mevcut testler bozulmadı.
2. **`GreedySolver` bloğu atomik yerleştiriyor.** Talepler blok gruplarına toplanıyor; bir grup için aynı gün içinde `size` kadar **ardışık ve hepsi feasible** slot dizisi aranıyor (`BuildRun` + `CanPlaceRun`). Günlük aynı-ders sınırı artık **blok bütünü için toplu** kontrol ediliyor — tek tek bakılsa sınır aşılabilirdi.
   - **Geri düşüş bilinçli:** blok bütün hâlinde sığmazsa saatler tek tek yerleştiriliyor. Kapsam bloktan önce gelir; aksi hâlde blok modu eksik saat üretir ve aday sıralaması (*önce eksik saat*) blok üreten adayı cezalandırırdı.
3. **`IsBlock` / `BlockGroupSeq` gerçekten dolduruluyor** (eskiden sabit `false`/`0`). Izgara blokları birleşik çizebilir.
4. **Ekran varsayılanı açıldı** — `oksis-ui` `AUTOGEN_DEFAULT_WEIGHTS.preferBlockPairing: false → true`. Backend'in `SolverWeights.Default`'u zaten `true` idi; **ekran ile backend ayrışmıştı**, kullanıcı özelliği hiç açık görmemiş olabilir.
5. **`AutoGenerateScheduleJob`** ağırlıkları artık talep üretiminden **önce** çözüyor (blok kararı üretim anında gerekli).

**Testler** — `BlockPlacementTests`, 10/10 yeşil. Hedef desen birebir ölçülüyor: `[Theory]` ile 6→2+2+2, 5→2+2+1, 4→2+2, 3→2+1; ayrıca kullanıcının cümlesinin karşılığı olan ayrı bir test (*"3 saat iki güne dağılmalı — her güne bir saat DEĞİL, ikili blok ardışık olmalı"*), blok işaretinin dolduğu, **eski davranışın kapalıyken birebir korunduğu** ve ızgara ikili bloğu barındıramadığında kapsamın düşmediği.

#### ✅ EKRAN KANITI ALINDI — `B-14` KAPANDI *(2026-08-11)*

Ders Programı → Otomatik Oluştur → 9-A → Taslak Üret → Önerileni Editörde Aç. Üretilen ızgara:

| Ders | Haftalık saat | Üretilen yerleşim | Beklenen desen |
|---|---|---|---|
| Matematik | 6 | Pzt 5-6 · Sal 4-5 · Çar 5-6 | **2+2+2** ✅ |
| Türk Dili (Türkçe) | 5 | Per 1-2 · Cum 1-2 · Çar 2 | **2+2+1** ✅ |
| Fen Bilimleri | 4 | Pzt 1-2 · Sal 1-2 | **2+2** ✅ |
| İngilizce | 4 | Per 3-4 · Cum 3-4 | **2+2** ✅ |
| Sosyal Bilgiler | 3 | Per 5-6 · Cum 5 | **2+1** ✅ |
| Beden Eğitimi · Din Kültürü · Müzik | 2 | Pzt 3-4 · Çar 3-4 · Sal 6-7 | **2** ✅ |

**"Bu programın tüm dersleri yerleşti."** — 0 çakışma, 0 eksik saat, tercih uyumu %100.
![[B-14-sonra-blok-yerlesim.png]]

- 🔎 **Kalan tek sapma — tek saatlik dersler günün kuyruğuna düşmüyor.** Gerçek programda Kulüp/Koçluk/Rehberlik 7-8. saatteydi; üretilen ızgarada Görsel Sanatlar Çar **1**, Bilgisayar Sal **3**'e düştü. Bloklar erken saatleri kaptığı için tek saatliklerin sona düşmesi bir **yan etki** olarak umulmuştu — olmadı, çünkü tek saatlikler MRV sırasında erken geliyor. Bu ayrı bir puan boyutu (*"1 saatlik dersi günün sonuna it"*) gerektiriyor.
- ➡️ **Yeni madde açıldı:** `D-08` — kapsamı dar, kozmetik/pedagojik; `B-14`'ün ana hedefi (blok) karşılandığı için bu madde `B-14`'ü açık tutmuyor.

### D-08 · Tek saatlik dersler günün kuyruğuna itilmiyor ✅
- **Belirti:** Otomatik üretimde haftada **1 saat** olan dersler (Görsel Sanatlar, Bilgisayar) günün başına düşüyor — üretilen 9-A ızgarasında Çar 1. ve Sal 3. saatte.
- **Beklenen:** Gerçek okul programında tek saatlik dersler (Kulüp, Koçluk, Rehberlik, Sağlık Bilgisi) günün **sonuna** toplanıyor — kullanıcının ilettiği 9B programında hepsi 7-8. saatte.
- **Katman:** BE (puanlayıcı) · **Öncelik:** ⚪ Düşük
- **Kaynak:** `B-14` blok yerleştirmesinin ekran testi, 2026-08-11.
- **Kök neden adayı:** Bloklar erken saatleri kapınca tek saatliklerin sona düşeceği umulmuştu; olmadı çünkü tek saatlik talepler MRV sırasında (en az feasible slot) **erken** geliyor ve `MorningFirst` stratejisi onları 1. saate çekiyor.
- **Çözüm yönü:** Puanlayıcıya *"blok olmayan tek saatlik dersi günün sonuna it"* boyutu, ya da talep sıralamasında tek saatlikleri bloklardan sonraya alma. Ayrı ekran yaması değil, tek noktada puan/sıra ayarı.
- 🔗 `B-14`'ün artığı; ana hedef (blok) karşılandı, bu madde onu açık tutmuyor.
- ✅ **KAPANDI** *(`oksis-api` @ `8154dc0`, 2026-08-12)*. Çözüm **slot sırası** tarafında yapıldı, puanlayıcıda değil: aday slotlar tek saatlik bir talep için ders saatine göre **tersten** sıralanıyor.
- 📌 **Üç stratejiye ayrı ayrı yazılmadı.** `MorningFirst` / `GapMinimizing` / `BalanceFirst`'ün üçü de kendi `OrderBy`'ını kuruyor; kuralı üçüne de eklemek üç kopya demekti. Kural, slot sırasının **uygulandığı tek noktaya** kondu (`GreedySolver`, `PreferBlockPairing` ile aynı yer). `OrderByDescending` LINQ'te kararlı olduğu için stratejilerin **gün tercihi korunuyor** — yalnız "hangi ders saati" ekseni ters çevriliyor, çeşitlilik kaybolmuyor.
- 📌 **"Tek saatlik ders" sözleşmeye alan eklenerek DEĞİL, talep listesinden türetiliyor:** talep listesi zaten haftalık saatin açılmış hâli, dolayısıyla (şube, ders) çifti listede bir kez geçiyorsa o dersin haftalık saati birdir.
- ⚠️ **Ayrım şart ve teste bağlandı:** 5 saatlik bir dersin **artan** tek saati (2+2+1) burada kastedilen şey **değildir** — o, bloğunun yanında kalmalı. Ayrı bir test bu ayrımı kilitliyor; kural saat sayısına değil **talep sayısına** bakıyor.
- 📌 **Yumuşak sıralama, kısıt değil:** geç slot feasible değilse döngü erken slotlara devam ediyor, yani **kapsam düşmüyor**. Tek günlük 2 saatlik ızgarada iki tek saatlik dersin ikisinin de yerleştiğini ölçen ayrı bir test var.
- 📌 **Bayrağa bağlanmadı ve bu bilinçli:** kullanıcının ilettiği gerçek programda tek saatlikler istisnasız kuyrukta; ayrıca yeni bir ekran-varsayılanı eklemek `B-04`'te ölçülen *"aynı sayı iki repoda ayrı yazılı"* ayrışmasını bir kez daha üretirdi.
- ✅ **CANLI ÜRETİMDE İSPAT** *(`mudur.s2` · 10-A · `POST /timetable/auto-generate`, önerilen aday, 2026-08-12)*. Okulun zil programında **6 ders saati var (1-6)**:

| Ders (haftalık saat) | Üretilen yerleşim |
|---|---|
| 6 saat | Pzt 1-2 · Sal 1-2 · Çar 1-2 |
| 5 saat | Pzt 5 · Çar 5-6 · Per 5-6 |
| 4 saat | Pzt 3-4 · Sal 3-4 |
| 4 saat | Per 3-4 · Cum 3-4 |
| 3 saat | Sal 5 · Cum 5-6 |
| 2 saat ×3 | Per 1-2 · Cum 1-2 · Çar 3-4 |
| **1 saat** | **Pzt 6** |
| **1 saat** | **Sal 6** |

  ➡️ Tek saatlik iki dersin ikisi de **6. saate**, yani **günün son saatine** düştü. `B-14`'ün ekran testinde bunlar Çar **1**. ve Sal **3**. saatteydi. Bloklar da bozulmadı (2+2+2, 2+2+1, 2+2 desenleri duruyor), 30 saatin tamamı yerleşti.
- 🧪 **4 yeni test + boş-yere-yeşil kontrolü:** tek saatlik son saate gidiyor · çok saatlik dersin artan saati kuyruğa **itilmiyor** · birden çok tek saatlik kuyruğu dolduruyor ve kapsam düşmüyor · kuyruk doluysa erken saate düşüyor. Kural devre dışı bırakıldığında **yalnız iki kuyruk testi** kırmızıya düştü, iki koruma testi yeşil kaldı. `Timetable` 188/188, BE 695 + 1563 + 251 yeşil, build 0 uyarı.

### D-07 · Öğretmen Görünümü sekmesi bozuk genişlikte açılıyor ✅
- **Belirti (2026-08-11'de kullanıcı tarafından DÜZELTİLDİ — bkz. aşağıdaki not):** Yönetici ders programı **editöründe**, bir programı tek bir öğretmenin haftalık dağılımı olarak görmek için eklenmiş **Öğretmen Görünümü** sekmesine tıklanınca çizelge bozuk genişlikte açılıyor.
- **Katman:** FE · **Öncelik:** 🟡 Orta
- 📌 **Kapsam notları (kullanıcı, 2026-08-11):** Bu ekranın **responsive olma hedefi yok**. İleride bir de **Şube Görünümü** eklenecek.
- ⚠️ **BULGU BAŞTA YANLIŞ YAZILMIŞTI ve ben de yanlış okudum.** Eski başlık *"Öğretmen görünümü mobilde bozuk"*, açıklaması *"mobil ekrana göre tasarlanmış ama responsive değil"*di. Ben bunu **öğretmen ROLÜNÜN** ekranı sanıp `ogretmen.s2.01` ile girip 390 px'te ölçtüm ve alakasız bir yere vardım. Gerçek konu **yöneticinin editöründeki sekme**ymiş; mobil ve responsive işin içinde hiç yok. Yanlış okumanın ürünü olan `ENG-02` yeniden çerçevelendi (aşağıya bakınız).
- 🔍 **Doğru ekranda kök neden ölçüldü ve tek satırdı** *(`mudur.s2`, 10-A editörü, 2026-08-11)*:

| Görünüm | `.pr-ed-shell` sütunları | Izgara genişliği | Sağda kalan boşluk |
|---|---|---|---|
| Sınıf | `1492px` (tek sütun) | **1492 px** | 24 px |
| **Öğretmen (ÖNCE)** | `300px  1176px` | **300 px** | **1216 px** |
| Öğretmen (SONRA) | `1492px` (tek sütun) | **1492 px** | 24 px |

- 🔍 **Mekanizma:** Kabuk iki sütunlu bir grid (`300px minmax(0,1fr)`) ve yan panel (`.pr-side`) DOM'da `.pr-ed-main`'den sonra yazılıp `order: -1` ile birinci sütuna çekiliyor. Öğretmen görünümünde panel **hiç çizilmiyor** — ama kabuğu tek sütuna indiren `side-collapsed` sınıfı `view === "sinif" && !sideOpen` koşuluna bağlıydı, yani öğretmen görünümünde **hiç uygulanmıyordu**. `order: -1` taşıyan öğe ortadan kalkınca `.pr-ed-main` birinci sütuna, yani **300 px'lik olana** düşüyor; `1fr` sütunu bomboş kalıyor. Gün başlıkları bile kesiliyordu: *"Pazart"*, *"Çarşa"*, *"Perşe"*. ![[D-07-once-ogretmen-gorunumu-300px.png]]
- ✅ **KAPANDI** *(`oksis-ui` @ `341ab18`, 2026-08-11)*: iki koşul **tek türetilmiş boolean'a** bağlandı — `sidePanelVisible = view === "sinif" && sideOpen`. Panel onunla çiziliyor, kabuk onun **değiliyle** tek sütuna iniyor. İki karar artık ayrışamaz; asıl hata da zaten ayrışmalarıydı.
- ✅ **Üç durumda doğrulandı:** (1) sınıf + panel açık → `300px | 1176px`, ızgara x=600'de panelin sağında; (2) **öğretmen görünümü, panel override'ı açıkken** → tek sütun, ızgara 1492 px, x=284 — bulgunun tam senaryosu; (3) sınıfa dönüş → yine iki sütun, durum korunuyor. Gün adları eksiksiz (`Pazartesi … Cuma`), hiçbir başlık kesilmiyor. ![[D-07-sonra-ogretmen-gorunumu-tam-genislik.png]]
- 🔮 **Gelecek Şube Görünümü için:** yeni sekme de panelsiz olacaksa `sidePanelVisible` türetimine dâhil edilmesi yeter; ayrıca bir CSS kuralı gerekmez.

### B-17 · Öğretmen ve öğrenci ders programının yönetim konsolunu görüyor
- **Belirti:** `/schedule` üç rolde de aynı ekranı çiziyor — öğretmen ve öğrenci, okulun **bütün şubelerinin** programını "oluşturun, doğrulayın ve yayınlayın" diyen konsola düşüyor; `Yeni Program` birincil buton olarak duruyor. ![[B-17-ogrenci-yonetim-konsolu.png]]
- **Katman:** FE · **Öncelik:** 🟠 Yüksek (rol yüzeyi ihlali)
- ✅ **Veri sızıntısı YOK — ölçüldü:** sayfanın attığı beş yönetim isteğinin **beşi de 403**: `timetable/programs`, `school-settings/grade-levels`, `users/persons?profileType=Teacher`, `class-rooms` (×2). Sunucu kapısı sağlam; sorun tamamen yüzeyde — kullanıcıya sahip olmadığı bir yetenek duyuruluyor.
- 🔍 **Kök neden üç satır:** (1) `/schedule` core nav'da admin **+ teacher + student** menüsünde; (2) `schedule-page.tsx` içinde `activeRole` **hiç okunmuyor**, tek dal yok; (3) öğretmen/öğrenci için yazılmış bir çizelge ekranı ne web'de ne mobilde var.
- 📌 **Emsal koddadır:** duyurular modülü aynı işi doğru yapıyor — `AnnouncementsScreen` rolü okuyup öğretmeni kendi yüzeyine, veli/öğrenciyi ayrı duruma ayırıyor. Ders programında o ayrım hiç kurulmamış.
- 📌 **`D-07` ile İLGİSİ YOK.** Bu bulgu, `D-07`'yi yanlış okuyup öğretmen ROLÜYLE giriş yaptığım turda **kazara** ortaya çıktı. `D-07` yöneticinin editöründeki bir sekmeydi ve ayrıca kapandı; buradaki ise bağımsız ve kendi ölçümüyle ayakta duran bir yüzey ihlali.
- ✅ **KULLANICI KARARI VERİLDİ — 2026-08-12: Seçenek B, menüden kaldırılacak.** Öğretmen/öğrenci ders programı ekranı bu turda **yazılmayacak**; `/schedule` yalnız yönetici menüsünde kalacak.
- ⚠️ **Kararın bilinen bedeli (kayda geçsin):** Sunucu ayağı hazır olmasına rağmen öğretmen kendi haftalık programını, öğrenci kendi şubesinin programını **hiçbir yerden göremeyecek**. Bu bir ürün eksiği olarak sürüyor; menü budaması ihlali kapatıyor, ihtiyacı değil. Ekran ileride yazıldığında menü satırı geri açılacak.
- ✅ **KAPANDI** *(`oksis-ui` @ `c030022`, 2026-08-12)*: `/schedule` `teacherGroups` ve `studentGroups` nav setlerinden çıkarıldı; yönetici setinde duruyor. Kaldırılan satırın yerine **neden kaldırıldığı ve hangi koşulda geri geleceği** yazıldı — ileride "eksik" sanılıp geri eklenmesin.
- 🔎 **ÖLÇÜM BENİ DÜZELTTİ — menüyü kaldırmak rotayı da kapattı, ayrıca sayfa kapısı GEREKMEDİ.** Önce `schedule-page.tsx`'e `activeRole !== "admin"` dalı eklemiştim. Ekranda ölçünce çizilenin benim bileşenim değil **var olan `RouteGuard`** olduğu görüldü: `canAccessRoute` **nav'ın kendisini** kaynak alıyor ve kendi yorumu bunu zaten söylüyor — *"menüde yok ama rota açık durumu tekrar oluşamaz"*. Eklediğim dal geri alındı; merkezî mekanizmanın üstüne ikinci bir kapı koymak tam da kaçındığımız desendi.
- ✅ **Ekran kanıtı — üç rolde ölçüldü** *(2026-08-12)*:

| Rol | Menüde `/schedule` | `/schedule` adresi elle yazılınca | Yönetim konsolu |
|---|---|---|---|
| Öğretmen | **yok** | *"Bu sayfaya erişemezsiniz"* | çizilmiyor |
| Öğrenci | **yok** | *"Bu sayfaya erişemezsiniz"* | çizilmiyor |
| Yönetici | var | konsol açılıyor (7 program satırı) | **regresyon yok** |

  ![[B-17-sonra-ogretmen-konsol-yok.png]]
- 📌 **Mobile dokunulmadı ve bu ölçülerek karar verildi:** `MOBILE_MORE_SCHOOL_BY_ROLE` içinde öğretmen/öğrenci için "Program"/"Programım" kutucukları var **ama `href` taşımıyorlar** — tip yorumunun dediği gibi *"yoksa satır 'yakında' ekranına düşer"*. Yani mobil zaten dürüst davranıyor, olmayan bir yeteneği duyurmuyor. `B-17` mobilde yok.
- ⚠️ **Kararın bedeli sürüyor:** öğretmen kendi programını, öğrenci kendi şubesinin programını hâlâ hiçbir yerden göremiyor. Sunucu ayağı hazır; eksik olan yalnız ekran → [[ENG-02 - Ogretmen ve ogrenci ders programi yuzeyi hic yok]] açık kalıyor.
- 🔎 **Yolda ÇIKAN YENİ BULGU:** ölçüm sırasında öğrencinin `/schedule` yüklemesinde **beş yönetim isteğinin yine atıldığı** (hepsi 403) görüldü — `RouteGuard` rol çözülene kadar geçirgen, o pencerede konsol kısa süreliğine mount oluyor. Yalnız bu ekranın değil **her korumalı rotanın** meselesi → `X-10`.

### D-05 · Önizleme metriklerinde yuvarlama yok
- **Belirti:** "Tüm sınıflar için oluştur" önizleme adımında ortalama vb. alanlar ham gösteriliyor; virgülden sonra **2 hane** olacak şekilde yuvarlanmalı.
- **Katman:** FE · **Öncelik:** ⚪ Düşük
- ✅ **Kod tarafı KAPANDI** *(`oksis-ui` @ `4ff222f`, 2026-08-11)*: `avgTeacherGap` ve `preferencePercent` doğrudan basılıyordu. Yuvarlama **her ekranda tek tek değil** `packages/core/src/format/tr-number.ts` içinde tek noktada: yeni `formatTrDecimal(value, maxFractionDigits = 2)` — en fazla 2 basamak, Türkçe ondalık ayırıcı (virgül), sondaki gereksiz sıfırlar atılır. Modülün "`toLocaleString` kullanma, Hermes'te ICU garanti değil" kuralına uyuyor, yani mobil de aynı yardımcıyı kullanabilir.
- ✅ **EKRANDA DOĞRULANDI — KAPANDI** *(2026-08-11)*: `B-14`'ün ekran testi sırasında otomatik üretim çalıştırıldı ve önizleme adımı kesirli metrik üretti. Taslak C'de **"Ort. boş saat `0,22`"** — yuvarlanmış ve Türkçe ondalık ayırıcıyla. Düzeltmeden önce `0.2222222222222222` basılacaktı. ![[D-05-sonra-yuvarlama.png]]

---

## 5. Duyurular & Bildirimler 🟠

### B-01 · Gönderim Raporu başlığı öğrenci/veliye görünüyor
- **Belirti:** Öğrenci ve Öğretmen duyuru detay ekranında "Gönderim Raporu" başlığı görünüyor.
- **Katman:** FE (+ BE kontrolü) · **Öncelik:** 🟠 Yüksek
- **Neden yüksek:** Bu yönetici bilgisi. **Sadece başlığı gizlemek yetmez** — BE'nin bu rollere gönderim raporu verisini DTO'da hiç göndermediği doğrulanmalı, yoksa network sekmesinden okunabilir kalır.
- ✅ **BE AYAĞI DOĞRULANDI — sızıntı YOK** *(çalışan API'den uç ölçümü, 2026-08-11)*. Defterin şart koştuğu kontrol yapıldı ve tablo temiz çıktı:

| Rol | `GET /announcements/{id}` | `GET /announcements/{id}/delivery-report` |
|---|---|---|
| `ogrenci.s1.001` | 200 | **403** |
| `veli.s1.001` | 404 | **403** |
| `ogretmen.s1.01` *(yayınlayan DEĞİL)* | 404 | **403** |
| `mudur.s1` | 200 | 200 |

  Kapı `AnnouncementLifecycleGuard.CanActOn` = `IsManager || PublisherId == caller`. Rapor **ayrı bir uçtur**, duyuru DTO'sunun içinde taşınmıyor — yani "network sekmesinden okunabilir kalır" riski gerçekleşmiyor. Ham çıktı: [[B-01-be-403-olcumu.txt]]
- 🔍 **Gerçek kök neden BAŞKAYDI:** sızan veri değil **başlıktı**. Mobil duyuru detayı (`apps/mobile/.../announcement-detail-screen.tsx`) **dört rolün de tek yüzeyi** ve raporu yalnız `hasDeliveryReport`e (= "duyuru yayınlandı mı") bakarak çiziyordu. Öğrenci yayında bir duyuruyu açınca "GÖNDERİM RAPORU" başlığı + boş iskelet görüyor, ardından 403 dönüyor ve altı boş kalıyordu — **olmayan bir yönetim yeteneği duyuruluyordu**. Web'de sorun yok: `AnnouncementsScreen` veli/öğrenciyi zaten ayrı yüzeye ayırıyor.
- ✅ **KAPANDI** *(`oksis-ui` @ `bf41f07`, 2026-08-11)*:
  - Karar core'a alındı: `showsDeliveryReport(row, role)` = `hasDeliveryReport(row) && announcementRoleSurface(role) !== "inbox"`.
  - **Elle rol listesi yazılmadı** — cevap zaten var olan rol→yüzey tablosundan türetiliyor. Yarın beşinci rol eklenirse güncellenecek ikinci bir liste yok; test bu bağı kilitliyor (`ROLE_KEYS` üzerinde dönüp tabloyla aynı fikirde olduğunu doğruluyor).
  - Aynı kapı sorguyu da kesiyor: gelen kutusu rolünde istek **hiç atılmıyor** (boşuna 403 yok).
  - 4 yeni test + `packages/core` 278/278 yeşil, `apps/web` ve `apps/mobile` typecheck temiz.
- ⚠️ **Bilinçli kalıntı (sızıntı değil):** öğretmen derin bağlantıyla **başkasının** duyurusunu açarsa başlık çizilir ama uç 403 döner ve bölüm boş kalır. İstemci bunu önden bilemez — oturumda `personId` yok (`sessionSchema` yalnız `userId` = hesap kimliği taşır), yani sahiplik karşılaştırması istemcide **yapılamaz**. Sunucu kapısı sağlam; kalan şey yalnız boş bir bölüm. Kesin çözüm DTO'ya `canViewDeliveryReport` alanı eklemek olurdu → 12 eşleme çağrısını (4'ü komut, çağıran kimliği elde değil) dolaşırdı; oransız bulundu, `TB-52` olarak not edildi.

### B-06 · Duyurularda sezon filtresi yok ✅
- **Belirti:** Duyurular ekranında sezon filtresi bulunmuyor.
- **Katman:** BE + FE · **Öncelik:** 🟡 Orta
- ✅ **"Bildirimlerde de var mı?" sorusu CEVAPLANDI** *(ekran testi, 2026-08-11)*: **Yok.** Bildirimler ekranında yalnız durum filtreleri (`Tümü` / `Onay bekliyor`) var, sezon seçici hiç yok.
- ⚠️ **Ama iki ekran aynı işin parçası DEĞİL — bildirimler tarafı çok daha derin:** `Notification` varlığının **hiç sezon/dönem alanı yok** (`RecipientAccountId`, `Kind`, `Title`, `Body`, `DeepLink`, `IsRead`, `ReadAt` — hepsi bu). Yani duyurularda filtre eklemek bir sorgu+ekran işiyken, bildirimlerde önce **şema değişikliği** (sezon/dönem kolonu + geriye dönük veri) gerekiyor.
- ➡️ **Kapsam ayrıldı:** Duyurular sezon filtresi kendi başına ilerleyebilir; bildirimler ayrı ve daha büyük bir iş. İkisini tek işe bağlamak duyurular tarafını gereksiz yere bloklar.
- ❓ **Kalan tek soru kullanıcıya:** Geçmiş sezon bildirimleri hiç gösterilmeli mi, yoksa yalnız aktif sezon mu? Cevap "yalnız aktif sezon" ise şema değişikliği yerine **kayıt tarihine göre kesme** yetebilir ve iş küçülür.
- ✅ **DUYURULAR AYAĞI KAPANDI** *(`oksis-api` @ `a578cf7` + `oksis-ui` @ `e169148`, 2026-08-11)*. Kapsam ayrımı doğru çıktı: `Announcement.AcademicSessionId` **zaten vardı**, eksik olan yalnız sorgunun onu kullanmasıydı — şema değişikliği gerekmedi.
- 📌 **Varsayılan kararı ve nedeni:** uca `sessionId` **isteğe bağlı** eklendi ve **boş bırakılırsa tüm sezonlar** dönüyor. Sunucuda varsayılanı "aktif sezon" yapmak, süzgeci hiç bilmeyen çağıranların (mobil, derin bağlantı, ileride bir rapor) gördüğü veriyi **habersiz kırpardı**. Varsayılanı seçmek ekranın işi: envanter **aktif sezonu seçili açıyor**, "Tüm sezonlar" bilinçli bir tercih olarak duruyor. ![[B-06-sonra-sezon-secici.png]]
- 📌 **Seçim `AnnouncementFilters` İÇİNE KONMADI** ve bu bilinçli: o nesne "Filtreleri temizle" ile sıfırlanıyor, sezon ise bir filtre değil **kapsam** seçimi. Temizle'ye basan kullanıcının baktığı sezondan fırlaması sürpriz olurdu.
- ✅ **Ekran testi:** `mudur.s2` (iki sezonlu) → seçici `Tüm sezonlar · 2026-2027 · 2025-2026` listeliyor, **aktif sezon seçili geliyor**; sezon değiştirilince istek gerçekten değişiyor (ağda ölçüldü: `?scope=school&sessionId=eb4228ed…` → `…sessionId=fe987de6…`). `mudur.s1` (tek sezonlu) → varsayılanla **17 satır**, "Tüm sezonlar" ile de **17 satır**: yeni varsayılan **hiçbir veriyi gizlemiyor**.
- 🧪 2 yeni entegrasyon testi (`GetAnnouncementsTests` → **22/22**): süzgeç verilince yalnız o sezon dönüyor, verilmeyince daraltma yapılmıyor. `packages` 526/526, typecheck ve lint temiz.
- ⚠️ **Bilinen küçük kalıntı (ölçüldü, kabul edildi):** aktif sezon sorgusu çözülene kadar ilk liste isteği **süzgeçsiz** gidiyor; sezon gelince ikinci istek süzgeçle atılıyor. Kullanıcı açısından kısa bir "önce hepsi, sonra daralt" akışı — liste `keepPreviousData` ile yerinde kalıyor, veri kaybı yok. Bastırmak `useAnnouncements`e `enabled` kapısı eklemeyi gerektirirdi; kazanandan fazlasını maliyet olarak yazardı. Kod yorumunda da bu hâliyle yazılı.
- ✅ **KULLANICI KARARI VERİLDİ — 2026-08-12: yalnız aktif sezon.** Geçmiş sezon bildirimleri gösterilmeyecek.
- 📌 **Kararın iş üzerindeki etkisi:** şema değişikliği **gerekmiyor**. `Notification`'a sezon kolonu eklemek, migration yazmak ve mevcut satırları geriye dönük doldurmak yerine, bildirim **kayıt tarihi** aktif sezonun tarih aralığına göre kesilecek. Bulgunun *"bildirimler tarafı çok daha derin"* teşhisi karar sayesinde geçersizleşti — iş duyurular ayağı kadar küçüldü.
- ⚠️ **Kabul edilen bedel:** sezon aralığı dışında üretilmiş eski bildirimler listeden düşer (silinmez, yalnız görünmez).
- ✅ **BİLDİRİMLER AYAĞI KAPANDI** *(`oksis-api` @ `ed1d8f2`, 2026-08-12)*. Kesme tek noktada yaşıyor: `Modules/Notifications/Common/NotificationSeasonScope.cs`.
- 📌 **Kesme HEM listeye HEM okunmamış sayacına uygulanıyor** ve bu bilinçli: ikisi ayrışırsa rozet *"5 okunmamış"* derken liste 2 satır gösterir, kullanıcı **bulamadığı bir rozeti kovalar**. İki sorguyu ayrı ayrı süzmek yerine ortak yardımcı yazıldı; ayrışmayı yakalayan ayrı bir test var (*"Sayaç listeyle AYNI sezon kesmesini uygular"*).
- 📌 **Yalnız ALT sınır uygulanıyor — bu ölçülerek karar verildi, ihtiyatla değil.** Dev verisinde `s1` okulunun **aktif** sezonunun bitiş tarihi **geçmişte** (2025-09-15 → 2026-06-13) ama bildirimlerin tamamı 2026-08 tarihli, yani sezon bittikten sonra üretilmiş. Üst sınır da uygulansaydı o okulun kullanıcıları **534 bildirimin tamamını** kaybederdi. Canlı uçta doğrulandı: `ogretmen.s1.01` **10/10** bildirimini görüyor.
- 📌 **Aktif sezon yoksa daraltma yapılmaz.** Kurulum aşamasındaki ya da sezonlar arası bir okulda hiçbir şey göstermemek, kullanıcının gerçek bildirimlerini sessizce gizlemek olurdu.
- 📌 **Sınır TARİHTİR, an değil:** sezon başlangıcı gün başına çekiliyor, aksi hâlde sezonun ilk günü sabah üretilen bildirim sessizce düşerdi. Ayrı bir test bunu kilitliyor.
- ✅ **Canlı uçta kanıt** *(sınırın iki yanında da bildirimi olan gerçek bir hesap seçildi — `ogretmen.s3.02`, okul `s3`, aktif sezon **10 Ağu**'da başlıyor)*:

| | Değer |
|---|---|
| DB'deki toplam | **18** (4'ü sezon öncesi, 14'ü sezon içi) |
| Uçtan dönen liste toplamı | **14** |
| Okunmamış rozeti | **14** — listeyle **aynı** |
| Dönen en eski bildirim | `2026-08-10T12:12` — sezon başlangıcının içinde |

- 🧪 **4 yeni test + boş-yere-yeşil kontrolü:** sezon öncesi gizleniyor · ilk gün kapsamda kalıyor · aktif sezon yoksa daraltma yok · sayaç listeyle aynı kesmeyi uyguluyor. Kesme devre dışı bırakıldığında **yalnız iki kesme testi** kırmızıya düştü, diğerleri ve mevcut testler yeşil kaldı. BE 695 + 1559 + 251 yeşil, build 0 uyarı.
- 🔎 **Ölçüm sırasında çıkan ortam notu:** iki profili olan hesaplar (`ogretmen.s3.02` → Teacher + Parent) girişte **409** ile profil seçimi istiyor; uç ölçümünde `profileType` verilmeli. Hata değil, akışın kendisi.
- ⬜ **Ekran ayağı bilinçli olarak yapılmadı:** bu kesme sunucu tarafında yaşıyor ve istemci bir şey göndermiyor, dolayısıyla ekranda **süzgeç eklenmedi** — duyurulardaki gibi bir "sezon seçici" burada olamaz, çünkü seçilebilecek ikinci bir sezon yok (karar *"yalnız aktif sezon"*).


---

## 6. Sınıflar & Öğrenciler 🟡

### B-08 · Sınıflar & Şubeler ekranında öğrenci sayısı "-" görünüyor
- **Belirti:** Öğrenciler bölümü değer yerine `-` gösteriyor.
- **Katman:** BE (projection'da sayı alanı) · **Öncelik:** 🟡 Orta
- 🔍 **Belirti ekranda netleşti** *(ekran testi turu, 2026-08-11)*: Sorun **sayaçta değil künyede**. Sayaçlar doğru (`8/40`, `60 öğrenci`); "—" basan şey şube detay panelindeki **öğrenci satırının kendisi** — ad ve numara yerine `—` / `No: —`. ![[B-08-once-ogrenci-tire.png]]
- ✅ **Kök neden DOĞRULANDI ve KAPANDI** *(`oksis-api` @ `7835ec6` + `oksis-ui` @ `4ff222f`, 2026-08-11)*:
  - Şube detay DTO'su künyede yalnız `studentId` döndürüyordu; istemci adı ve numarayı **sayfalı** `GET /api/v1/students` listesinden eşleştiriyordu. O uç **varsayılan `pageSize=50`** ile dönüyor, okulda ise **60 öğrenci** var → ilk sayfaya sığmayan öğrenciler eşleşmiyor ve `name = meta?.name ?? "—"` satırı devreye giriyordu.
  - **Yama olurdu:** istemcinin `pageSize`'ı büyütmesi — okul 200 öğrenciye çıkınca aynı hata geri gelirdi.
  - **Yapılan:** ad ve numara **sözleşmeye taşındı** — `ClassRoomStudentDto.FullName` + `StudentNumber`. Künye kapasiteyle sınırlı bir liste; adını taşıması doğal yeri. Ad çözümü `FULLNAME PATTERN` ile yapıldı, yani `B-15`'in sınıf hatası burada baştan önlendi.
  - **Ekran kanıtı:** aynı panel, `—` yerine **Yiğit Tunç · No: 202610027** ![[B-08-sonra-ogrenci-adi.png]]

### D-03 · Öğrenciler ekranındaki "Sezon Yenileme" butonu işlevsiz
- **Karar:** Kaldırılacak.
- **Katman:** FE · **Öncelik:** ⚪ Düşük
- ✅ **KAPANDI** *(`oksis-ui` @ `4ff222f`, 2026-08-11)*: Buton yalnız *"Sezon Yenileme ayrı bir ekranda yürütülür"* diyen bir toast basıyordu; kaldırıldı. Sezon devri Sezon Yönetimi ekranında yaşıyor, buradaki kopya yanıltıcıydı.
- **Ekran kanıtı:** aksiyon çubuğunda yalnız "Dışa Aktar" + "Yeni Öğrenci" ![[D-03-sonra-buton-kaldirildi.png]]

---

## 7. Kullanıcılar & Kimlik 🟡

### B-03 · "Bağlı Profil" alanında GUID gösteriliyor
- **Belirti:** Kullanıcılar ekranında bağlı profil alanı ham GUID basıyor.
- **Katman:** BE (DTO'ya görünen ad alanı) + FE · **Öncelik:** 🟡 Orta
- ✅ **Kök neden DOĞRULANDI ve KAPANDI** *(`oksis-ui` @ `4ff222f`, 2026-08-11)*: Backend zaten doğru davranıyordu — `UserListDto.LinkedProfileRef` insan-okunur referansı (öğrenci no / personel no) taşıyor, yoksa `null` dönüyor. Hata **istemcideki geri düşüş**teydi: `profileRef: dto.linkedProfileRef ?? dto.linkedPersonId`. Yani referans yoksa ekrana **kimlik** basılıyordu.
- **Neden hep veliler:** `ResolveProfileRef` yalnız `StudentProfile.StudentNumber`, `TeacherProfile`/`StaffProfile.EmployeeNumber` biliyor. **`ParentProfile`'ın böyle bir numarası hiç yok** — dolayısıyla her veli satırı GUID'e düşüyordu. Rastgele değil, sistematik.
- **Yapılan:** GUID'e düşüş kaldırıldı, `profileRef` nullable yapıldı; iki render yeri (tablo + drawer) referans yoksa yalnız profil tipini gösteriyor.
- **Ekran kanıtı:** öğrencilerde `Öğrenci · 202610029`, velilerde yalnız `Veli` — listede hiç GUID yok ![[B-03-sonra-bagli-profil.png]]
- ➡️ **`TB-07` ile kavşak kapandı:** bulgunun "hangi uçta düzeltilecek" belirsizliği yoktu; `users` ucu zaten doğru veriyi veriyordu.

### B-20 · İçe aktarmada "davet gönder" seçeneği hiçbir şey yapmıyor 🟠
- **Belirti:** Toplu kişi içe aktarma onayı `sendInvitations` bayrağını kabul ediyor, iş "Tamamlandı" diyor — ama **hiç davet üretilmiyor.** İçe aktarılan kişiler `Draft` durumunda kalıyor, yani hiçbiri sisteme giremiyor.
- **Katman:** BE · **Öncelik:** 🟠 Yüksek · **Tip:** Sessiz yalan (istek kabul ediliyor, karşılığı yok)
- **Nasıl bulundu:** `TB-20` ölçümünde, `sendInvitations: true` ile 5 öğretmen içe aktarılırken (2026-08-12).
- **Ölçüm:** İş `Completed`, `succeededRows: 5`; ardından `SELECT COUNT(*) FROM identity.invitations` (bu 5 kişi için) → **0**. Beş kişinin beşi de `lifecycle_state = 'Draft'`.
- **Ölçülen kök neden:** `StartImportCommandHandler` bayrağı `ImportJob.SendInvitations` kolonuna yazıyor, `ImportJobConfiguration` onu `IsRequired()` yapıyor — ve **okuyan kimse yok.** `SendInvitations` repo genelinde 6 yerde geçiyor, hepsi yazma/taşıma; `ImportPersonsJob` alanı hiç sormuyor.
- **Neden yalnız eksik özellik değil:** uç bayrağı **kabul ediyor** ve iş **başarılı** raporluyor. Kullanıcı "davetler gitti" sanıp bekler; kimse gelmediğinde arayacağı bir hata kaydı da yok.
- 🔗 Diğer içe aktarma yolu (`POST /users/import`, `Ad/Soyad/Email/Rol`) davet **üretiyor** — aynı işin iki uygulaması var, bkz. [[#TB-55 · İki ayrı toplu içe aktarma yolu yan yana yaşıyor 🟡]].

---

## 7b. Kimlik & Oturum 🔴

### B-16 · Açık oturum varken başka okulun hesabıyla giriş 500 veriyor
- **Belirti:** Tarayıcıda A okulunun oturumu açıkken B okulunun hesabıyla giriş denenince "Giriş yap" **hiçbir şey yapmıyor** — ekranda ne hata, ne uyarı. Arka planda `POST /api/v1/auth/account/login` → **500**.
- **Katman:** BE (kimlik/tenant) · **Öncelik:** 🔴 Kritik
- **Nasıl bulundu:** Ekran testi turunda (2026-08-11) `B-15`'i asıl veri bulunan okulda test etmek için okul değiştirilmek istendi; giriş sessizce patladı.
- **Kök neden — doğrulandı** *(çalışan API'nin yığın izi + izole `curl` tekrarı)*: `SetForLoginFlow` gelen isteğin `school_id` claim'ine bakıp farklı tenant'a geçişi `SecurityException` ile reddediyor (`Infrastructure/Identity/TenantContext.cs:38-52`). Tarayıcı giriş isteğine de eski JWT'yi eklediği için claim doluyor. İstisna domain hatası olmadığından `ExceptionHandlingMiddleware` onu 500'e çeviriyor.
- **%100 deterministik:** Aynı istek `Authorization` başlığı olmadan **200**, başlıkla **500**. Tek değişken başlık; veriye bağlı değil.
- **Etki:** Ortak bilgisayarda okul değiştiren kullanıcı parolasını yanlış yazdığını sanıp tekrar deniyor → giriş koruması hesabı kilitleyebilir. Kullanıcı, kendi hatası olmayan bir şey yüzünden hesabını kilitletiyor.
- 🚫 **Kısıt:** Tek uca `try/catch` koymak yama olur. Kural şu olmalı: *bir giriş isteği tanım gereği anonimdir, taşıdığı eski kimliği miras almaz.* → çözüm yönü ve iki adayın karşılaştırması engel dosyasında.
- 📄 **Ayrıntılı anlatım, yeniden üretim adımları ve çözüm adayları:** [[ENG-01 - Farkli okula giris 500 veriyor]]
- ➡️ **Ayrıca:** `SecurityException`'ın 500'e düşmesi başlı başına yanlış — `X-01`'in (BE mesaj hattı) sunucu tarafı ayağıyla aynı aile.
- ✅ **KAPANDI — ENG-01'in tavsiye ettiği (b) yolu uygulandı** *(`oksis-api` @ `a79b391`, 2026-08-12)*.
- 🔍 **Ölçüm bulguyu BÜYÜTTÜ — tek uç değil, altı akış:** `SetForLoginFlow`'u HTTP anonim akışlarından **altı** yer çağırıyor: giriş, token yenileme, parola unuttum, parola sıfırlama, çıkış ve **davet kabul**. Sonuncusu birebir aynı tuzağı taşıyor: A okulunda oturumu açık olan biri B okulunun davetini kabul ederse **aynı 500** doğar. Yani tek uca `try/catch` altı kez yanlış olurdu. *(Kalan ~25 çağıran arka plan işi ve seeder — orada `HttpContext` hiç yok, koruma zaten no-op.)*
- 🚫 **(a) yolu neden reddedildi:** `SetForLoginFlow`'un korumasını gevşetmek. O metot parola **doğrulanmadan önce** çağrılıyor; koruma kalksaydı A okulunun geçerli token'ını taşıyan biri yalnızca *deneyerek* istek boyunca tenant bağlamını B okuluna çevirebilirdi. **Koruma yerinde duruyor; kaldırılan şey onu boş yere tetikleyen miras kimlik.**
- ✅ **Uygulanan çözüm — `AnonymousEndpointIdentityMiddleware`:** `[AllowAnonymous]` bir uç için `HttpContext.User` boş principal'a çekiliyor. `UseAuthentication`'dan **sonra**, `UseAuthorization`'dan **önce**.
- 📌 **Kapsam elle liste DEĞİL, `[AllowAnonymous]` metadata'sından türetiliyor** — `B-04`'te ölçülen "aynı bilgi iki yerde" deseni burada tekrarlanmasın diye. Kural okunabilir bir cümleye oturuyor: *bir uç kimlik gerektirmediğini beyan ettiyse, ona sessizce bağımlı da olamaz.* Depodaki **dokuz** anonim ucun tamamı tek tek ölçüldü, hiçbiri tenant claim'ine bağlı değil: davet uçları zaten `SetForLoginFlow` ile davetin okuluna sabitleniyor, rıza paketi tenant'sız bir `MasterEntity`, `school-settings/public` okulu `X-Tenant-Code` **başlığından** çözüyor, `health` veriye hiç dokunmuyor.
- ✅ **İkinci ayak da kapandı:** `SecurityException` artık **403** + Türkçe cümle dönüyor (*"Bu işlem açık olan oturumun okuluyla eşleşmiyor. Önce çıkış yapıp tekrar deneyin."*). İstisnanın kendi metni sızdırılmıyor. Koruma bir daha tetiklenirse kullanıcı artık bir şey görecek.
- 🔎 **Yolda çıkan ve bulguyu açıklayan ayrıntı:** ilk yeniden üretme denemem **200** verdi, yani hatayı üretemedim. Sebep: elimdeki token bayatlamıştı ve süresi dolmuş token claim üretmediği için çakışma da doğmuyor. **Access token ömrü 15 dakika** (ENG-01'de *60 dakika* yazıyordu — düzeltildi). Bu, belirtinin neden "bazen oluyor bazen olmuyor" göründüğünü de açıklıyor: hata yalnız **taze** bir oturum varken çıkıyor.
- ✅ **Canlı uçta RED → GREEN:**

| Ölçüm | Düzeltmeden ÖNCE | Düzeltmeden SONRA |
|---|---|---|
| `s1` token **taşıyarak** `s3`'e giriş | **500** `{"code":"InternalError"}` | **200**, dönen token gerçekten `s3`'ün (`school_id=bb4118c3…`) |
| Token **olmadan** aynı istek | 200 | 200 |
| **Yanlış parola**, token taşıyarak | — | **401** — kimlik doğrulama zayıflamadı |

- ✅ **Regresyon (aynı turda ölçüldü):** korumalı uç **200** · token yenileme (anonim uç, eski token taşıyarak, çerezli gerçek web akışı) **200** ve yeni token doğru okulla üretildi · çıkış **204** · davet ön-izleme, `public` marka ucu ve rıza paketi **handler'a ulaştı** (404'ler geçersiz token / bilinmeyen tenant kodu / kayıt yokluğu kaynaklı, kimlikle ilgisiz).
- 🧪 **3 middleware testi + boş-yere-yeşil kontrolü:** anonim uçta kimlik düşüyor, **korumalı uçta düşmüyor** (bu ikincisi olmadan düzeltme sessizce tüm yetkilendirmeyi boşaltabilirdi), kimliksiz anonim istek değişmiyor. Koşul devre dışı bırakıldığında **yalnız hedef test kırmızıya düştü**, iki sınır testi yeşil kaldı. `Oksis.Api.UnitTests` **251/251**, build 0 uyarı.
- ⬜ **Kalan iz (bulgu değil, not):** yanlış parola yanıtının mesajı `identity.errors.invalid-credentials` — çevrilmemiş bir i18n anahtarı kullanıcıya kadar geliyor. `X-01` ailesinden; ayrı madde olarak `TB-54`'e yazıldı.

### B-18 · Rıza reddi kullanıcıya "hesabınız askıya alındı" diye gösteriliyor 🟠
- **Belirti:** Rızası geri çekilmiş (ya da rıza paketi sürümü değişmiş) kullanıcı giriş yapmaya çalıştığında **"Hesap askıya alındı — Okul yönetimine yaz"** ekranını görüyor. Hesabı askıya alınmış değil; eksik olan rıza.
- **Katman:** FE (web + mobil) · **Öncelik:** 🟠 Yüksek
- **Nasıl bulundu:** `TB-10` düzeltmesinin ardından "peki kullanıcı bu 403'ü nasıl görüyor?" diye bakılırken (2026-08-12).
- **Ölçülen kök neden:** giriş ekranı **hata kodunu hiç okumuyor**, yalnız HTTP statüsüne bakıyor — `apps/web/features/auth/login-screen.tsx:102` ve `apps/mobile/src/features/auth/components/login-screen.tsx:115`, ikisi de `if (error.status === 403) setView('suspended')`. Backend'in gönderdiği `identity.account.consent-required` kodu okunmadan atılıyor. Askıya alma (`identity.account.suspended`) ile rıza reddi **tek ekrana** düşüyor.
- **Neden yalnız ekran metni sorunu değil:** verilen tavsiye de yanlış. Kullanıcı okul yönetimini arıyor, oysa yapması gereken rıza metnini yeniden onaylamak. Yönetimin bu durumda yapabileceği bir şey de yok.
- 🚫 **Yamalama uyarısı:** iki ekranda aynı satır — düzeltme "web'de bir `if` daha" olmamalı. 403'ün gerekçesini koda göre ayıran ortak bir eşleme `packages/core` tarafında durmalı, iki uygulama da onu okumalı. `X-01` ailesiyle aynı desen.
- ➡️ Düzeltilse bile kullanıcının çıkışı yok: [[#E-01 · Rıza yenileme ekranı yok — 403 çıkışsız 🟠]].

#### ✅ KAPANDI — oksis-ui @ `2325383` + oksis-api @ `47c1f2b`, 2026-08-12

**Canlı ekran ölçümü** (`ogretmen.s1.01`, kendi `DataProcessing` rızası geri çekilmiş, web 3000 → API 5112):

| Senaryo | Sunucu | ÖNCE ekranda | SONRA ekranda |
|---|---|---|---|
| Rıza geri çekilmiş | 403 `identity.account.consent-required` | **"Hesap askıya alındı — Okul yönetimine yaz"** ![[B-18-once-riza-reddi-askiya-alindi-diyor.png]] | **"KVKK onayı gerekiyor"** ![[B-18-sonra-kvkk-onayi-gerekiyor.png]] |
| Hesap gerçekten kapalı *(regresyon)* | 403 `identity.account.suspended` | "Hesap askıya alındı" | **"Hesap askıya alındı"** ![[B-18-regresyon-gercek-askiya-alma.png]] |
| Rıza yerinde *(regresyon)* | 200 | panele giriyor | **panele giriyor** |

- ✅ **Merkezî çözüm — karar ekranlardan çıktı:** `packages/api/src/client/login-error.ts` → `classifyLoginError(error)` tek karar noktası; iki giriş ekranı da yalnız sonucu görsele bağlıyor. Yeni bir 403 gerekçesi eklendiğinde değişecek **tek dosya** var. `apiErrorDesc`'in (`X-08`) yanına, aynı klasöre kondu.
- 🔄 **Defterdeki "`packages/core`'da durmalı" cümlesi düzeltildi:** eşleme `ApiError` zarfını okur, `ApiError` ise `packages/api`'de yaşar ve `core` `api`'ye bağımlı değil (bağımlılık ters yönde: `api → core`). Emsal de orada. Doğru adres `packages/api`.
- 🔍 **403'ü kodla ikiye bölmek neden güvenli (ölçüldü):** `AccountLoginCommandHandler` her iki 403'ü de **parola doğrulandıktan SONRA** döndürüyor. Bu noktaya gelen çağıran hesabın sahibi olduğunu zaten kanıtlamış; gerekçeyi ayırmak hesap sayımına yeni bilgi vermiyor. Kimlik/parola hatası TR-auth-004 gereği uniform 401 ve bu koldan hiç geçmiyor.
- 🔍 **Backend özeti yanlıştı, ölçüm düzeltti:** `AccountErrors.ConsentRequired`'ın XML özeti *"hesap aktif değil ya da consent gate"* diyordu. `!account.IsActive` dalı **`Suspended`** döndürüyor — bu kod **yalnızca** rıza kapısından çıkıyor, yani 1:1 eşleme mümkün. Aynı özetteki *"kullanıcıya gösterilen mesaj aynıdır"* cümlesi de artık geçerli değil; ikisi de `47c1f2b` ile düzeltildi.
- 🔎 **ÖLÇÜM İKİNCİ AYAK ÇIKARDI — aynı hata deseni, farklı vaka:** backend kapalıyken giriş ekranı **"Giriş bilgileri hatalı"** diyordu; kullanıcı doğru parolayı defalarca yazıp duruyor. İlk teşhisim *"ağ hatası kolu eksik"*ti; **ölçüm çürüttü** — web istekleri Next `rewrites` proxy'sinden geçtiği için ağ hatası tarayıcıya **500** olarak dönüyor, yani `ApiError`. Mobil doğrudan API host'una konuştuğu için aynı arıza orada `TypeError`. Tek kola indirgemek iki uygulamadan birinde yanlış cümleyi garanti ederdi; `server` ve `unreachable` ayrı tutuldu. Sonuç: **"Sunucu yanıt vermiyor — sorun sizin bilgilerinizde değil"** ![[B-18-sonra-sunucu-yanit-vermiyor.png]]
- ⛔ **Bilinçli olarak yapılmayan:** rıza ekranına "yeniden onayla" düğmesi konmadı. Öyle bir akış hiçbir uygulamada yok ([[#E-01 · Rıza yenileme ekranı yok — 403 çıkışsız 🟠]], kapsam kararı bekliyor); olmayan bir düğme kullanıcıyı boş sayfaya götürürdü. Metin bugün gerçekten işleyen tek yolu söylüyor.
- 🧪 **7 test + boş-yere-yeşil kontrolü:** rıza kodu ↔ askıya alma ayrımı, tanınmayan 403'ün askıya almaya düşmesi, kodun zarfın ilk maddesinde olmaması, 423/429, 5xx ayrımı, `ApiError` olmayan hata. Rıza kolu `suspended`e sabitlendiğinde **yalnız ilgili 2 test kırmızıya düştü**, diğerleri yeşil kaldı. `packages/api` **151/151**, üç paket typecheck + lint temiz, `dotnet build` 0 uyarı.
- ⬜ **Mobil ayağı ekranla değil kodla kanıtlandı:** mobil artık aynı `classifyLoginError`'ı çağırıyor ve typecheck'ten geçiyor, ama Expo istemcisi bu turda çalıştırılmadı (makine yükü). Ekran kanıtı yalnız web için var.
- ⬜ **Turdan çıkan bulgu:** askıya alma ekranındaki **"Okul yönetimine yaz" düğmesi hiçbir şey yapmıyor** (`onClick` yok) — [[#B-19 · Askıya alma ekranındaki tek eylem düğmesi ölü ⚪]].


---

## 8. Genel Kabuk & Navigasyon ⚪

### D-01 · Uzun okul adında logo sıkışıyor
- **Katman:** FE · **Öncelik:** ⚪ Düşük
- 🔍 **Ekranda BİREBİR üretildi** *(ekran testi, `mudur.s2`, 2026-08-11)*. Seed'deki "Atatürk Anadolu Lisesi" (22 karakter) sorunu göstermiyor — okul adı üçnoktayla kısalıyor ve marka sağlam. Gerçek uzunluklarla ölçünce ortaya çıktı:

| Okul adı | `.logo` kutusu | içeriği | wordmark sağ kenarı | ayraç sol kenarı | sonuç |
|---|---|---|---|---|---|
| 22 karakter | 82 px | 82 px | 98 | 106 | temiz |
| 55 karakter | **47 px** | 77 px | **93** | **71** | **wordmark ayracın içinde** |
| 76 karakter | **38 px** | 77 px | **93** | **62** | daha beter |

- 🔍 **Kök neden:** `.side-head` bir flex satırı; `.logo` ise `min-width: 0` + varsayılan `flex-shrink: 1` taşıyordu, yani **daralabiliyordu**. Ama daralması KISALTMAYA dönüşemez — `.wordmark` `white-space: nowrap` ve hiçbir atası `overflow`u kesmiyor. Sonuç: kutu küçülüyor, yazı olduğu yerde kalıyor ve **ayracın içinden geçip okul rozetinin altına giriyor**. Baskıyı emmesi gereken taraf zaten donanımlıydı (`.school-name`/`.school-sub` üçnokta) ama o da aynı anda daralıyordu; ikisi genişliği paylaşınca marka kaybediyordu. ![[D-01-once-logo-eziliyor.png]]
- ✅ **KAPANDI** *(`oksis-ui` @ `5c41b95`, 2026-08-11)*: `.logo` → `flex: none` (marka kimliği sabit boyutludur, daralmaz), `.school-logo` → `flex: 1 1 auto; min-width: 0` (kalan alanı alır ve baskıyı ÜÇNOKTAYLA emer). İki satır CSS, ekrana özel yama yok.
- ✅ **Doğrulandı:** 22 · 55 · **76** karakterlik adların üçünde de `.logo` **92 px'te sabit**, wordmark ayraca hiç girmiyor, okul adı kısalarak yer açıyor, başlıktan taşma yok. ![[D-01-sonra-logo-daralmiyor.png]]
- ✅ **Daraltılmış kenar çubuğunda regresyon yok:** wordmark genişliği 0, okul bloğu ve ayraç `display:none`, logo 40 px, taşma yok.

### D-02 · Etkinlik Tanımlama modalında buton ekran dışında kalıyor
- **Belirti:** Sorumlu Öğretmenler listesi uzayınca "Etkinliği Oluştur ve İşaretle" butonu görünmez oluyor.
- **Katman:** FE · **Öncelik:** 🟡 Orta (işlem tamamlanamıyor)
- **Çözüm yönü:** Modal gövdesi scroll'lansın, aksiyon çubuğu sabit (sticky footer) kalsın. Tek modal değil, bileşen seviyesinde → **X-02**.
- ✅ **KAPANDI — `X-02` varsayılanının içinde** *(`oksis-ui` @ `6817806`, 2026-08-11)*. Bu modala özel bir satır yazılmadı; temel `.att-modal` kuralı düzeltildiği için `D-02` kendiliğinden kapandı. Ölçüm ve gerekçe `X-02`'de.
- ✅ **CANLI VERİYLE EKRAN TESTİ YAPILDI** *(2026-08-11)*: İlk denemede `s1` okulunda adım 1'i geçemedim — bugünün tarihi o okulun sezonunun dışında kalıyor ve sihirbaz ilerlemiyor. **Kullanıcı `mudur.s2`'nin sezon içinde olduğunu söyledi**; o hesapla girilince akış uçtan uca çalıştı.
  - **Senaryo:** Etkinlikler → Etkinlik Tanımla → ad + 3 şube → adım 3 → **15 öğretmenin tamamı seçildi**.
  - **Ölçüm:** gövde içeriği 1002 px, görünen alan 565 px → **gövde kendi içinde kayıyor**; modal 760 px'de sınırlı; aksiyon çubuğu 830 ≤ 900 → **görünür**.
  - **Kanıt:** *"Etkinliği Oluştur ve İşaretle"* butonu — bulgunun kaybolduğunu söylediği buton — ekranda duruyor: ![[D-02-sonra-aksiyon-cubugu-gorunur.png]]
- 📌 **Ortam notu:** Okulların sezon durumu farklı — `s2` sezon içinde, `s3` sezon başlamamış, `s1` sezon dışı. Tarihe bağlı akışların ekran testi `mudur.s2` ile yapılmalı.

### D-06 · Breadcrumb tıklanabilir değil
- **Belirti:** `Akademik › Ders Programı › 10-A` yolunda ara kırılımlar tıklanamıyor.
- **Katman:** FE · **Öncelik:** ⚪ Düşük (global davranış)
- 🔍 **Doğrulandı ve İKİ ara kırılımın AYRI şeyler olduğu ölçüldü** *(ekran testi, 2026-08-11)*. Kırılımın üçü de `<span>`dı, ama ikisi aynı sebeple değil:
  - **`Ders Programı`** — gerçek bir rotası VAR (`resolved.item.href` = `/schedule`). Bunun bağlanmaması düpedüz eksikti. **Bulgunun kendisi budur.**
  - **`Akademik`** — rotası **YOK**. Core'daki `NavGroup` `{id, label, items}`tır, `href` alanı hiç bulunmuyor; "Akademik" bir sayfa değil, kenar çubuğu bölüm başlığı. Bağlanabilir yapmak için grubun ilk öğesini hedef **uydurmak** gerekirdi ve kullanıcı tıkladığı yazının söylemediği bir sayfaya düşerdi.
- ✅ **KAPANDI** *(`oksis-ui` @ `5c41b95`, 2026-08-11)*: ara kırılım `pathname !== resolved.item.href` iken `<Link>` olarak çiziliyor — yani nav öğesinin **kendi** rotasındayken bağlantı yok (kendine giden bağlantı ölü tıklamadır), **alt rotadayken** var. Hedef uydurulmuyor, zaten çözülmüş olan gerçek rota kullanılıyor. Kategori kolu bilinçli olarak düz metin kaldı ve gerekçesi koda yazıldı ki ileride "eksik" sanılıp uydurma hedefle kapatılmasın.
- ✅ **Ekranda kanıtlandı** — `/schedule` (kendi rotası): `<a>` sayısı **0**. `/schedule/4cd37519…` (alt rota): `Akademik›`**`Ders Programı`**`›10-A`, `<a class="crumb-link" href="/schedule">`, `cursor: pointer`; bağlantıya tıklandı ve adres `/schedule`e döndü. ![[D-06-sonra-kirilim-baglanti.png]]
- 🎨 Görsel dil: bağlantı durağan hâlde düz metinle aynı görünür (breadcrumb satırı mavi bağlantılarla bölünmesin), tıklanabilirliğini imleç + hover alt çizgisiyle söyler; `:focus-visible` halkası klavye için eklendi.

---

## 9. Master Data ✅

### B-10 · "Rehberlik" branş listesinden kaldırılması
- **Karar:** Rehberlik bir branş değil → master data'dan silindi.
- ✅ **Migration COMMIT EDİLDİ** — `oksis-api` @ `9e96a4f` *"rehberlik dersi master katalogdan kaldirildi"*; dosya adı `20260810123433_20260810_remove_counseling_subject`. Buradaki eski *"çalışma ağacında hazır, henüz commit edilmedi"* notu (ve eski migration damgası) **bayattı**, düzeltildi (2026-08-12).
- 🔍 **Terim düzeltmesi (ölçümle):** Rehberlik bir **branş** değil **ders** kaydıydı — `master.subjects`, `code = REH`, `category = Counseling`, id `26e189bc-…`. Migration onu ve 12 `subject_grade_levels` satırını sildi. Bulgunun başlığındaki *"branş listesi"* ifadesi yanıltıcı: `master.branches` kataloğunda **Rehberlik hiç yoktu** (bugün 16 branş var, hiçbiri Rehberlik değil). Yani branş listesinde silinecek bir şey zaten yoktu.
- ✅ **BAĞIMLILIK TARAMASI YAPILDI — artık kayıt YOK** *(canlı `oksis_dev`, üç tenant, 2026-08-12)*. Silinen ders kimliğine işaret eden satır sayısı, `subject_id` taşıyan **yedi tablonun hepsinde 0**: `attendance_sessions` · `lesson_placements` · `school_weekly_hour_overrides` · `subject_teacher_assignments` · `teaching_assignments` · `curriculum_hour_templates` · `subject_grade_levels`.
- ✅ **Örneğe değil SINIFA bakıldı:** yalnız Rehberlik değil, **herhangi** bir yetim referans arandı (var olmayan bir derse/branşa işaret eden satır) — yedi tablo + `identity.profiles.teacher_branch_id`, **hepsi 0**. `master.subjects` içinde `Counseling` kategorili ders de kalmamış. Seed tarafında da iz yok: `SubjectSeedData.cs` *"Rehberlik (REH) bir ders değildir — katalogdan çıkarıldı"* notunu taşıyor.
- ✅ **KAPANDI** *(2026-08-12, kod değişikliği gerekmedi)*: migration zaten commit'liydi (`oksis-api` @ `9e96a4f`), taramada temizlenecek artık bulunmadı. Bulgu *"kalmış olabilir"* diyordu; ölçüm *"kalmamış"* dedi.
- ⚠️ **AMA TEMİZLİK ŞANSTANDI, KORUMADAN DEĞİL** — tarama sırasında bir sınıf riski ölçüldü ve ayrı madde açıldı: `TB-53`. Bugün veri temiz olduğu için `B-10` kapanıyor; bir dahaki master-data silmesinde aynı şey kendiliğinden temiz olmayacak.

### TB-53 · Ders silmenin kullanımda kapısı yedi tüketicinin yalnız birine bakıyor 🟠
- **Nereden çıktı:** `B-10` bağımlılık taraması, 2026-08-12. Rehberlik temiz çıktı ama **neden temiz olduğu** ölçülünce koruma değil şans olduğu görüldü.
- 🔍 **İki ayak ölçüldü:**
  1. **Veritabanı ayağı — `master.subjects`'e FK veren TEK tablo var:** `master.subject_grade_levels`. Oysa `subject_id` taşıyan yedi tablo var; kalan altısı (`teaching_assignments`, `subject_teacher_assignments`, `lesson_placements`, `attendance_sessions`, `school_weekly_hour_overrides`, `curriculum_hour_templates`) **kısıtsız**. FK'lerin genel olarak yokluğu değil bu: `teaching_assignments`'ın `academic_sessions` ve `class_rooms`'a FK'si **var**, yalnız master kataloğuna yok. Yani master satırı gidince veritabanı hiçbir şey söylemez.
  2. **Uygulama ayağı — `DeleteSubjectCommandHandler`'da kullanımda kapısı VAR ama dar:** yalnız **`Published`/`Revising`** durumundaki ders programı yerleşimlerine bakıyor. Görevlendirme (v1 **ve** v2), müfredat saat şablonu, okul saat override'ı, yoklama oturumu ve **`Taslak` durumdaki programlar** kapının dışında.
- ➡️ **Sonuç:** Bir okulun aktif olarak görevlendirme yaptığı ders, ders programında yayınlanmamışsa **silinebiliyor** ve ona bağlı satırlar sessizce sahipsiz kalıyor.
- 🔍 **Sessizliğin biçimi ölçüldü:** `db.Subjects.Remove()` `SoftDeleteInterceptor` tarafından **soft delete**'e çevriliyor; satır durur, global query filter onu eler. Yani FK kırılmaz, **okuma boş döner** — hata değil, boş sonuç. `TB-48`'in *"hepsi sessiz"* deseniyle birebir aynı aile.
- ⚠️ **İki silme yolu farklı davranıyor:** migration'daki `DeleteData` doğrudan SQL `DELETE`'tir, interceptor'ı **atlar** — Rehberlik satırı gerçekten yok. Uygulamadan silinen ders ise sadece gizlenir. Aynı fiilin iki farklı kalıcılık davranışı var ve bu yazılı değil.
- 📌 **Emsal koddadır:** `TB-16` aynı tutarsızlığı nöbet bölgesi için yazıyor (*"derslik silinirken kullanımda kontrolü var, nöbet bölgesi doğrudan siliniyor"*). Burada kapı **var ama eksik** — üçüncü bir varyant.
- 🚫 **Kısıt:** Kapıya tek tek `if` eklemek yama olur; sorulacak soru *"bu master kaydını hangi tablolar tüketiyor"* ve cevabın tek yerde durması gerekir.
- ⬜ **Açık.**

### TB-54 · Giriş hata mesajı çevrilmemiş i18n anahtarı olarak dönüyor ⚪
- **Belirti:** Yanlış parolayla giriş denendiğinde sunucu **401** ile `message: "identity.errors.invalid-credentials"` dönüyor — cümle değil, **ham anahtar**.
- **Nasıl bulundu:** `B-16` doğrulama turu, 2026-08-12 (yanlış parola regresyon ölçümünde).
- **Katman:** BE · **Öncelik:** ⚪ Düşük
- 🔗 **`X-01` ailesi:** merkezî istemci eşleyicisi 401'de zaten kendi Türkçe cümlesini koyuyor, bu yüzden kullanıcıya bugün ham anahtar **muhtemelen ulaşmıyor**. Ama sözleşme yanlış: `message` alanının insan-okunur olması gerekiyor ve mesajı olduğu gibi geçiren her çağıran (mobil, ileride bir rapor) anahtarı basar.
- ⬜ **Doğrulanacak:** başka kaç uç `identity.errors.*` biçiminde ham anahtar dönüyor? Bu ölçümde yalnız giriş yolu görüldü.


---

## 10. Çapraz Kesen İşler ✳️

Tek bir ekranın bulgusu değil, **proje geneline yayılmış** yapısal sorunlar. Ayrı ayrı yamalanırsa aynı hata yeni ekranlarda tekrar doğar.

### X-01 · BE mesajlarının notify hattı yok
- **Belirti:** Backend'in ürettiği validasyon/hata mesajları kullanıcıya ulaşmıyor veya bozuk ulaşıyor.
- **Görüldüğü yerler:** `B-04a` (sezon açma validasyonu), `B-09` (branşsız öğretmen uyarısı) — **muhtemelen tüm ekranlarda var.**
- **Öncelik:** 🟠 Yüksek · **Katman:** FE (+ BE hata sözleşmesi)
- 🚫 **Kısıt:** *Proje genelinde geçerli tek bir çözüm kurulacak — ekran ekran yamalama kabul değil.*
- **Çözüm yönü:** BE'de tek tip hata/validasyon yanıt sözleşmesi (`ProblemDetails` + alan bazlı hata listesi) → FE'de tek bir interceptor bu sözleşmeyi okuyup toast/inline hataya çevirsin. Ekranlar tek tek mesaj yakalamasın.
- ✅ **ENVANTER YAPILDI — "önce yapılacak" maddesi kapandı** *(ekran testi turu, 2026-08-11)*. Üç ayak ayrı ayrı ölçüldü ve tablo sanılandan iyi çıktı:

**1. BE sözleşmesi — ZATEN TEK TİP** ✅
Her yanıt `ApiResponse<T>` zarfı: `{ data, meta, errors: [{ code, message, field }], correlationId }`. Çalışan API'den ölçüldü; validasyon hatası **alan bazlı** geliyor (`field: "Capacity"`), HTTP 400. Yani *"sözleşme de mi dağınık?"* sorusunun cevabı **hayır** — `ProblemDetails`'e geçmeye gerek yok, sözleşme hazır.

**2. FE merkezi eşleyici — ZATEN VAR** ✅
`oksis-ui` → `packages/api/src/client/mutation-error.ts`. Ekran ekran yakalama yok; mutasyon reddini tek cümleye indiren ortak bir katman var ve statü-farkında yazılmış: 400/409/422'de sunucunun cümlesi **olduğu gibi** geçer, 401/404/5xx'te altyapı sabiti yerine Türkçe cümle konur, 403 ise hata koduna göre ikiye ayrılır. Ölçülerek yazılmış (2026-08-10).

**3. GERÇEK BOŞLUK — validator mesajlarının üçte biri İngilizce** ❌
Eşleyici 400'de mesajı olduğu gibi geçiriyor çünkü *"bu cümleyi validator kendi Türkçesiyle yazmıştır"* diye varsayıyor. **Varsayım tutmuyordu:** 122 validator'ın **41'inde hiç `.WithMessage()` yok** ve FluentValidation'ın İngilizce varsayılanı kullanıcıya kadar gidiyordu.
- **Ölçülen örnek** *(nöbet bölgesi oluşturma, düzeltmeden önce)*: `'Name' must not be empty.` · `'Capacity' must be between 1 and 4. You entered 99.`
- ✅ **KAPANDI — merkezi çözüm** *(`oksis-api` @ `<pending>`)*: 41 dosyaya tek tek `.WithMessage()` eklemek yama olurdu (42.'sini hiçbir şey engellemezdi). Bunun yerine `AddApplication` içinde **tek satır**: `ValidatorOptions.Global.LanguageManager.Culture = new CultureInfo("tr")`. Kuralın **kendisi** Türkçeleşiyor, yani bundan sonra yazılacak validator'lar da varsayılan olarak Türkçe konuşuyor. Kendi cümlesini yazanlar etkilenmiyor — `.WithMessage()` dil yöneticisini her zaman ezer.
- **Aynı istek, düzeltmeden sonra:** `'Name' boş olmamalı.` · `'Capacity', 1 ve 4 arasında olmalı. 99 değerini girdiniz.`
- **Testle kilitlendi:** `ValidationMessageLanguageTests` — (a) yerleşik kural mesajı İngilizce kalıntı içermemeli, (b) kendi cümlesini yazan validator (`SaveSeasonDraft` → *"Adım 0-6 arasında olmalı."*) etkilenmemeli. Tam takım 1557 Application testi yeşil, kültür değişikliği hiçbir testi kırmadı.

- ⬜ **Kalan tek eksik — alan adları hâlâ İngilizce token:** Mesaj Türkçeleşti ama alan adı ham C# property adı olarak kalıyor (`'Capacity', 1 ve 4 arasında olmalı.`). İki yol var ve **karar gerekiyor**:
  1. **BE'de global `DisplayNameResolver`** + Türkçe property-ad sözlüğü. Tek nokta, ama küratörlük isteyen bir çeviri tablosu; yanlış etiket nötr token'dan kötüdür.
  2. **FE'de alan→etiket eşlemesi** *(önerilen)*: `field` zaten hata gövdesinde geliyor ve **formu render eden taraf etiketi zaten biliyor** ("Kapasite", "Bölge adı"). Doğru mimari bu — BE kod+alan gönderir, ekran kendi etiketini koyar. `X-01`'in "tek interceptor" hedefiyle de tutarlı.
**4. ASIL İŞ — hat kurulu ama YAYGINLAŞTIRILMAMIŞ** ❌ *(ölçüldü 2026-08-11)*
Merkezi eşleyici var, ama ekranların neredeyse tamamı onu **kullanmıyor**:
- `mutationErrorDesc` yalnız **3 özellik ekranında** çağrılıyor (`announcements` ×2, `settings/notification-tab`). Duyurular C-fazında yazılmış ve oraya bırakılmış.
- Buna karşılık **31 çağrı yerinde `onError: () => …`** var — yani handler `err` parametresini **hiç almıyor**, sunucunun cümlesini okuma imkânı bile yok; yerine sabit bir metin basılıyor: *"İşlem başarısız oldu"*, *"Kaydetme sırasında bir hata oluştu"*, *"Müsaitlik kaydedilemedi."*
- 30 özellik dosyası `onError` kullanıyor; kapsam dışı kalanlar `duty`, `sections`, `students`, `users`, `schedule`, `teachers`, `academic-sessions` — yani **B-04a ve B-09'un yaşadığı ekranların hepsi**.
- **Somut örnek:** `features/duty/bolge-tab.tsx` → `onError: () => pushToast(L.toast.error, "warn")`. Backend *"Kapasite 1 ile 4 arasında olmalıdır."* dese bile kullanıcı sabit bir hata metni görüyor.

- ➡️ **`B-04a` ve `B-09` için sonuç:** Teşhis düzeltildi. *"BE mesaj hattı yok"* **yanlış** — hat var. Doğrusu: **hat 31 yerde bilinçli olarak baypas ediliyor.** İki madde de bu yaygınlaştırmanın içinde kapanacak, ayrı ayrı değil.
**5. ✅ YAYGINLAŞTIRMA YAPILDI** *(`oksis-ui` @ `a674b97`, 2026-08-11)*
- **31 `onError: () =>`** çağrı yeri eşleyiciye bağlandı: `onError: (err) => …mutationErrorDesc(err)`.
- 🔎 **Süpürme sırasında İKİNCİ bir biçim çıktı:** `catch { }` — hata **bağlanmadan** yakalanıyor, yani lint kuralının kapsamı dışında. **5 yer** bu şekildeydi ve ikisi tam da aradığımız ekranlardı:
  - `teacher-assignments/drawer.tsx` → *"Görevlendirme kaydedilemedi."* = **`B-09`**
  - `academic-sessions/wizard.tsx` → *"Sezon açılamadı."* = **`B-04a`**
- **Hiç mesaj göstermeyen iki yer** için hata yüzeyi eklendi (bunlar en kötü hâliydi — kullanıcı reddi hiç görmüyordu):
  - `schedule/publish-drawer.tsx`: yayın reddedilince yalnız forma dönülüyordu → uyarı bandı eklendi.
  - `attendance/event-wizard.tsx`: yalnız gönderim durumu sıfırlanıyordu → ekranın kendi `stepError` yüzeyine yazılıyor.
- `use-duty-editor` hook'unun `onError` imzası `(err: unknown) => void` olarak genişletildi — hook mutasyonun hatasını zaten alıyordu ama **tip onu düşürüyordu**.
- 🛡️ **32.'sini engelleyen kural kuruldu:** `packages/eslint-config/base.js` → `no-restricted-syntax` ile sıfır parametreli `onError` arrow'u **hata**. Kural tam **31 ihlal** yakaladı (grep sayımıyla birebir), düzeltme sonrası **0**.
- ⬜ **Kalan boşluk (dürüstlük notu):** Lint kuralı `catch { }` biçimini **yakalamıyor** — `CatchClause[param=null]` seçicisi meşru kullanımları da (ör. `JSON.parse` etrafındaki yutucu catch) kırmızıya düşürürdü. Bugün `features` altında 17 çıplak `catch` var, 5'i mesaj yüzeyine dokunuyordu ve düzeltildi; kalan 12'si mesaj basmıyor. **Bu biçim için otomatik koruma yok** — 6.'sı yazılırsa lint susar.

- 📊 **Durum:** sözleşme ✅ · eşleyici ✅ · validator dili ✅ · yaygınlaştırma ✅ (31/31 + 5 catch) · `catch` koruması ⬜
- ✅ **`B-04a` ve `B-09` KAPANDI.** `B-09` ekran kanıtı: branşsız öğretmene görevlendirme → backend **422** döner; eskiden hiçbir şey görünmüyordu, artık toast **"Branşı olmayan öğretmene görevlendirme yapılamaz."** gösteriyor ![[B-09-sonra-be-mesaji-gorunuyor.png]]

### X-02 · Uzun içerikte aksiyon butonlarının kaybolması
- **Belirti:** Modal/panel içeriği uzayınca aksiyon butonu görünür alanın dışında kalıyor.
- **Görüldüğü yer:** `D-02` (Etkinlik Tanımlama modalı) — aynı desen diğer uzun modallarda da beklenir.
- **Öncelik:** 🟡 Orta · **Katman:** FE
- **Çözüm yönü:** Modal bileşeninde gövde scroll + sticky footer'ı **varsayılan** yap; tek tek modal düzeltme yerine bileşen seviyesinde çöz.
- 🔎 **Ölçüm — desen zaten 3 kez kopyalanmış** *(2026-08-11)*: Ortak bir modal **bileşeni yok**; 39 ekran kendi markup'ını kuruyor, ortaklık **CSS sınıfında** (`.att-modal`). Temel kural "küçük onay diyalogları için" yazılmış ve **`max-height`/`overflow` taşımıyordu**. İçeriği uzayan her modal bunu tek tek yamalamış:
  - `.att-modal.dvt-wiz` (Toplu Davet sihirbazı)
  - `.att-modal.attm-retro` (Geriye dönük yoklama) — yorumu açıkça *"aynı `.dvt-wiz` kalıbı burada da uygulanır"* diyor
  - `.att-modal.act-modal-wide` (Etkinlikler)
  Yani varsayılan yanlış olduğu için üç kopya doğmuş; **`D-02` yamalanmayan dördüncüsü.**
- ✅ **KAPANDI** *(`oksis-ui` @ `6817806`, 2026-08-11)*: Kural **varsayılan** yapıldı — `.att-modal` flex-column + `max-height: min(760px, calc(100vh - 64px))`, `.att-modal-body` kalan alanı yutup kendi içinde kayıyor, `.att-modal-head/-foot` küçülmüyor. Üç kopya kaldırıldı; geriye yalnız o modala özgü olanlar (genişlik, ayırıcı çizgi) kaldı.
  - ⚠️ **Tuzak not:** `min-height: 0` şart. Flex öğesinin varsayılan `min-height: auto` değeri içerik yüksekliğini taban yapıyor ve `overflow` **hiç devreye girmiyor** — bu satır olmadan düzeltme sessizce çalışmaz.
  - `act-modal-wide`'ın sabit `max-height: min(62vh, 560px)` değeri de kalktı; modal artık viewport'a göre esniyor, kısa ekranda gereksiz daralmıyor.
- 📏 **Ölçülen kanıt** *(1280×900 viewport, 60 satırlık liste):*

| | modal yüksekliği | aksiyon çubuğu | sonuç |
|---|---|---|---|
| **Önce** | 2968 px | ekranın **2068 px altında** | ❌ görünmüyor |
| **Sonra** | 760 px | 830 ≤ 900 | ✅ görünür, gövde kendi içinde kayıyor |

  Kısa içerikte davranış değişmiyor (470 px, gövde kaymıyor). Regresyon kontrolü: Etkinlik Tanımlama ve Yeni Şube modalları ekranda doğrulandı.


### X-04 · Branş uyumu katalog kimliği yerine ad karşılaştırmasıyla hesaplanıyor ✅
- **Belirti:** Öğretmenin branş **adı** ile dersin **adı** normalize edilip (tr-TR, boşluklar atılarak) karşılaştırılıyor. Öğretmen profilinde branş katalog kimliği dururken kullanılmıyor.
- **Görüldüğü yerler:** Görevlendirme uyumu (branş-içi / yan branş / alan-dışı) **ve** vekâlet aday sıralaması (aynı / yakın / farklı) — **iki modül aynı mekanizmayı kullanıyor.**
- **Katman:** BE · **Öncelik:** 🟡 Orta
- **Etkisi:** Ad birebir tutmadığında uyum yanlış çıkar. "Matematik" branşlı öğretmen "İleri Matematik" dersine **alan-dışı** düşer ve gereksiz gerekçe ister. Branş veya ders adının yeniden adlandırılması sessizce tüm uyum sonuçlarını değiştirir.
- 🚫 **Kısıt:** Tek tek ekran düzeltmesi değil — karşılaştırma mantığı tek noktada, kimlik üzerinden çözülmeli.
- 🔎 **ÖLÇÜM BULGUYU BÜYÜTTÜ — "kimlik üzerinden çöz" bugünkü modelde YAPILAMIYORDU** *(2026-08-12)*: `Subject`'in **hiçbir branş bağı yoktu** (`master.subjects`'te `branch_id` kolonu bile yok). Öğretmen tarafında kimlik zaten duruyordu (`TeacherProfile.BranchId` + `SecondaryBranchIds`); kod onu **kullanımdan bir adım önce ada çeviriyordu**, çünkü ders tarafında karşılaştırılacak bir kimlik yoktu. Vekâlet tarafındaki kodun kendi yorumu bunu itiraf ediyordu: *"ad-tabanlı BranchFitResolver için adı çöz"*.
- 🔎 **Bedeli ölçüldü ve sanılandan büyüktü:** dev kataloğundaki **21 dersin 9'u (%43)** hiçbir branşın adıyla birebir tutmuyor, yani **kalıcı olarak alan-dışı** düşüyordu — Bilgisayar · Din Kültürü · Fen Bilimleri · Fransızca · İleri Matematik · Matematik (TYT/AYT) · Sosyal Bilgiler · T.C. İnkılap Tarihi · Türkçe. Öğretmenini doğru atayan yönetici her seferinde gereksiz gerekçe yazıyordu.
- 🔎 **"İki modül aynı mekanizmayı kullanıyor" da eksikti — aynı fikrin İKİ AYRI UYGULAMASI vardı:** görevlendirmede üç değerli `SubjectBranchMatch.Resolve` (8 çağrı yeri), vekâlette iki değerli `BranchMatching.IsMatch` (4 çağrı yeri). İkisi ayrı ayrı bakım istiyordu.
- ✅ **KAPANDI** *(`oksis-api` @ `fba5a8e`, 2026-08-12)*:
  - **Eksik ilişki kuruldu:** `SubjectBranch` (ders ↔ branş), **çoka-çok**. Tek FK yetmezdi: "Fen Bilimleri"ni Fizik+Kimya+Biyoloji, "Sosyal Bilgiler"i Tarih+Coğrafya okutabilir; tek FK ilk çakışmada keyfî seçim yapmaya zorlardı.
  - **Eşleştirici kimliğe geçti**, ad normalizasyonu (tr-TR, boşluk atma) tamamen kalktı.
  - **İki uygulama teke indi:** `BranchMatching.IsMatch` kullanımdan kalktı, `BranchFitResolver` ortak eşleştiriciyi çağırıyor. **Yan branş artık vekâlette de sayılıyor** — eski iki değerli kopya yalnız ana branşa bakıyordu.
- 📌 **Fransızca bilinçli olarak EŞLENMEDİ:** katalogda Fransızca branşı yok (dil branşları: İngilizce, Almanca, Japonca). Uydurma bir eşleme, yanlış öğretmeni *"uyumlu"* göstererek bugünkü dürüst *"alan-dışı"* cevabından **daha kötü** olurdu. Doğru çözüm branş kataloğuna Fransızca eklemek — **karar gerektirir**, sessizce yapılmadı.
- 📌 **Eşleme tablosu bir İÇERİK kararıdır** ve `SubjectBranchSeedData`'da gerekçeleriyle duruyor (23 satır, MEB alan karşılıklarına göre). Okulun tercihi farklıysa düzeltilecek yer orası.
- ⚠️ **İKİ HATAYI ÖLÇÜM YAKALADI, TESTLER DEĞİL — ikisi de bu turun dersi:**
  1. **FK önce yanlış tabloya verildi.** Depoda **iki branş tablosu** var: `master.branches` (16, MEB kataloğu) ve `school.branches` (45, tenant kopyası, `meb_branch_id` ile katalogla bağlı). Eşleme platform bilgisidir → kataloğa ait. İlk denemede tenant tablosuna bağlanmıştı ve **veritabanı migration'ı `547` ile reddetti**.
  2. **Dört handler çeviriyi atlıyordu.** Öğretmen profili **tenant** branşını taşır, eşleme **katalog** branşına bağlıdır. `LoadTeacherBranchesAsync` çeviriyi yapıyordu ama kendi sorgusunu yazan dört handler ham tenant kimliğini geçiriyordu → canlı uçta **her şey alan-dışı** çıktı. **Birim testleri bu sınıfa yapısal olarak kördü**, çünkü eşleştiriciyi zaten çevrilmiş kimliklerle sınıyorlar — `X-06`/`X-07`'nin *"test yeşil, gerçek çağrı kırık"* deseninin bir kez daha tekrarı. Çeviri tek yardımcıya (`LoadCatalogBranchIdsAsync`) alındı.
- ✅ **CANLI UÇTA KANIT** *(`mudur.s2`, aday öğretmen uyum dağılımı)*:

| Ders | Ad karşılaştırmasıyla | Kimlikle |
|---|---|---|
| Matematik *(adı zaten tutuyordu)* | Matched | **Matched** |
| **İleri Matematik** *(bulgunun kendi örneği)* | **OutOfField** | **Matched** |
| Fransızca *(eşlemesi yok)* | OutOfField | **OutOfField** ✅ doğru |

- 🧪 **9 yeni eşleştirici testi + vekâlet testleri kimliğe taşındı.** Kaldırılan test: *"ad normalizasyonu büyük/küçük harf duyarsız"* — kimlik karşılaştırmasında tr-TR İ/ı sorunu, boşluk ve büyük/küçük harf diye bir **hata sınıfı kalmadı**. BE 695 + 1572 + 251 yeşil, build 0 uyarı.

### X-06 · EF'te yok sayılan hesaplanan property'leri hiçbir otomatik koruma tutmuyor
- **Belirti:** `PersonName.FullName` gibi EF-`Ignore` edilmiş hesaplanan property'lerin sorgu içinde kullanılmaması **yalnız yorum satırıyla** korunuyor (`FULLNAME PATTERN ALERT`). Kuralı çiğneyen kod derleniyor, testlerden geçiyor ve ilk gerçek çağrıda 500 veriyor.
- **Görüldüğü yer:** `B-15` (müsait öğretmen ucu — doğduğu günden beri kırık, iki ay fark edilmedi). `src/` altındaki 21 çağrı yerinden şu an yalnız biri ihlal ediyor; **22.'sini engelleyen hiçbir şey yok.**
- **Katman:** BE (+ test altyapısı) · **Öncelik:** 🟠 Yüksek
- 🚫 **Kısıt:** Tek handler'ı düzeltmek bulguyu kapatır, sınıfı kapatmaz. *Yamalama kabul değil.*
- **Kök yapısal boşluk — iki ayak:**
  1. **Derleme/analiz ayağı:** Yok sayılan property'nin `IQueryable` ifadesi içinde kullanımını yakalayan bir kural yok. Seçenekler: `FullName`'i sorgudan erişilemez kılmak (ör. `PersonName` üzerinde değil, bir uzantı metodunda tutmak — `IQueryable` içinde çağrılırsa zaten çevrilemez ama hata **derleme/analiz** anında görünür olur), ya da bir Roslyn analyzer / mimari testi (`NetArchTest` benzeri) ile ihlali test zamanında kırmızıya düşürmek.
  2. **Test ayağı:** Query handler'ların birim testleri `MockQueryable` (LINQ-to-Objects) üzerinde koştuğu için **çeviri hatalarına yapısal olarak kör**. Aynı desen tüm modüllerdeki query handler testleri için geçerli — yani bu tek uca özgü değil, *sorgu çevirisi hiçbir birim testinde doğrulanmıyor*. Gerçek sağlayıcıya (Testcontainers MSSQL, `Oksis.Infrastructure.IntegrationTests`) karşı en az bir "sorgu derleniyor mu" testi olmayan her handler aynı riski taşıyor.
- ✅ **KARAR VERİLDİ — 2026-08-11:** **Önce mimari test (dar ve kesin) kurulacak.** Gerekçe: bugün kanayan yara tam olarak bu property sınıfı; mimari test ucuz, hızlı ve ihlali test zamanında kırmızıya düşürüyor. Entegrasyon testi ayağı iptal değil, **ertelendi** — kapsamı geniş ama her handler için ayrı emek istiyor, ayrı bir dilim olarak ele alınacak.
- ✅ **DAR AYAK KAPANDI** *(`oksis-api` @ `329ba30`, 2026-08-11)*: `tests/Oksis.Tests/Architecture/EfIgnoredPropertyQueryTests.cs`.
  - **Nasıl ölçüyor:** kaynak deyim (statement) sınırlarında bölünür; bir deyimde hem sorgu kökü (`db.X`), hem sonlandırıcı (`ToListAsync` vb.), hem de yasak erişim (`.Name.FullName`) varsa ihlaldir. Doğru desende property sorgu materyalize edildikten **sonra** ayrı bir deyimde okunur — aynı deyimde buluşmazlar.
  - **Boş yere yeşil değil:** `B-15`'in hatası geçici olarak geri konuldu, test **dosya + satır vererek kırmızıya düştü** (`GetAvailableTeachersQueryHandler.cs:50`) ve doğru deseni hata mesajında gösterdi; sonra geri alındı ve tekrar yeşile döndü.
  - Yeni bir EF-`Ignore`'lu property eklenirse `IgnoredComputedAccessors` dizisine yazılması yeterli.
- ⬜ **Geniş ayak ERTELENDİ (iptal değil):** her query handler için gerçek sağlayıcıya karşı "sorgu çevriliyor mu" entegrasyon testi. Ayrı bir dilim; bu test onun yerine geçmiyor — dar ayak *bu* hatayı, geniş ayak *tüm çeviri hatalarını* yakalar.

### X-07 · Token süresi dolduktan sonraki ilk YAZMA işlemi her ekranda patlıyordu
- **Belirti:** Access token'ın ömrü dolduktan sonra yapılan ilk `POST`/`PUT`/`PATCH` başarısız oluyor ve kullanıcıya **401** olarak yansıyor. Okumalar (GET) etkilenmiyor — sessizce yenilenip yeniden deneniyor.
- **Görüldüğü yer:** `B-12` (muafiyet ekleme). Ama **kırık olan ortak istemci hattı**, dolayısıyla kaydet/oluştur/güncelle içeren **her ekran** aynı riski taşıyordu.
- **Katman:** FE (`@workspace/api` istemci ara katmanı) · **Öncelik:** 🟠 Yüksek
- **Kök neden — tarayıcıda ölçüldü:** `authMiddleware.onResponse` retry için `request.clone()` çağırıyordu. `Request.clone()` yalnız gövde tüketilmeden önce çalışır; 401 geldiğinde istek çoktan gönderilmiş ve gövdesi tüketilmiştir. Gövdesiz istekte (GET) klon çalışıyor, gövdeli istekte `TypeError: Request body is already used` fırlıyor.
- 🧪 **Testler neden yakalamadı — `X-06` ile birebir aynı desen:** Yeniden deneme testi `client.GET(...)` kullanıyordu (gövdesiz → klon çalışır); tek `POST` testi ise login yolundaydı ve `UNAUTHENTICATED_PATHS` erken dönüşü yüzünden klon satırına **hiç ulaşmıyordu**. Yani retry hattının gövdeli hâli **hiçbir testte koşulmamıştı**.
- ✅ **KAPANDI** *(`oksis-ui` @ `<pending>`, 2026-08-11)*: Bozulmamış kopya `onRequest`'te, gövde tüketilmeden alınıp `WeakMap` ile isteğe bağlanıyor; retry o kopyayı kullanıyor. Regresyon testi eklendi (*"gövdeli isteği yenile ve payload'ı koru"*) ve **boş yere yeşil olmadığı doğrulandı**: eski satır geri konulduğunda test `TypeError: unusable` ile kırmızıya düştü, diğer dört test yeşil kaldı.
- 📌 **Ders:** İki bulgu (`X-06`, `X-07`) aynı kök yapıyı paylaşıyor — *test yeşil, gerçek çağrı kırık*. İkisinde de sebep, testin gerçek yolu değil kolay yolu koşması.

### X-09 · `X-01` yaygınlaştırması mobil uygulamayı atladı — lint kuralı `master`'da kırmızı ✅
- **Belirti:** `oksis-ui` kökünde `npm run lint` **başarısız**: `apps/mobile` altında `X-01` kuralının **6 ihlali** var. Yani depo bugün lint-kırmızı durumda ve bu fark edilmemiş.
- **Katman:** FE (mobil) · **Öncelik:** 🟠 Yüksek
- **Nasıl bulundu:** `B-04` doğrulaması sırasında (2026-08-12). Kendi değişikliğimden mi diye kontrol ettim — **`git stash` ile değişiklikler çıkarıldığında da altı ihlal duruyor**, yani `master`'da zaten var, benim ürünüm değil.
- 🔍 **Ölçülen altı yer:** `app/activities/new.tsx:71` · `attendance/excuse-create-screen.tsx:165` · `attendance/history-detail.tsx:186` ve `:204` · `attendance/roster-screen.tsx:127` · `school-settings/school-contact-edit-screen.tsx:99`.
- ➡️ **`X-01`'in kapanış iddiasını daraltıyor:** `X-01` *"31 çağrı yeri eşleyiciye bağlandı + 32.'sini engelleyen kural kuruldu"* diyerek kapanmıştı. Ölçüm gösteriyor ki tarama **`apps/web` ile sınırlıymış**; kural sonradan `apps/mobile`'ı da kapsayınca orada altı ihlal ortaya çıktı ve kırmızı bırakıldı. Yani kullanıcının *"mobilde de backend'in cümlesi gizleniyor"* durumu sürüyor.
- 🚫 **Kısıt:** Altı yeri düzeltmek yama değil — uygulanacak çözüm zaten merkezî (`mutationErrorDesc`/`apiErrorDesc`), yalnız bir uygulamaya hiç uğramamış. Ama kuralın **neden kırmızıyken commit edilebildiği** ayrı bir soru: CI lint'i tüm workspace'leri koşuyor mu?
- ✅ **KAPANDI** *(`oksis-ui` @ `5bd435a`, 2026-08-12)*. Depo genelinde **lint 6/6, typecheck 6/6** — `master` artık kırmızı değil.
- 🔎 **Altı ihlal sadece lint gürültüsü değilmiş — beşi kullanıcıya YANLIŞ ŞEY söylüyordu:** sabit metinler *"bağlantınızı kontrol edip tekrar deneyin"* / *"bağlantı sorunu oluştu"* diyordu. Oysa ret **403** veya **422** da olabilir ve o durumda kullanıcı kaç kez denerse denesin sonuç değişmez. `X-08`'in web'de ölçtüğü *"403'ü ağ arızası diye göstermek"* hatasının mobildeki hâli. Cümleyi artık `mutationErrorDesc` **statüye bakarak** seçiyor; bağlam cümlesi (*"Mazeret gönderilemedi."*) korundu — web'deki `X-08` biçimi.
- 🔎 **Altıncısı bambaşka bir biçimdi:** `school-contact-edit-screen` metin değil **bayrak** tutuyordu (`hasSaveFailed: boolean`) ve şerit sabit bir cümle basıyordu. Bayrak *"hata oldu mu"* sorusunu taşır, *"hata NE"* sorusunu taşıyamaz — `X-08`'de duyuru özet şeridinde ölçülen desenin **birebir aynısı** (`summaryFailed: boolean` → `summaryError: unknown`). Artık hatanın kendisi taşınıyor.
- 📌 **Doğru olan güvence KORUNDU:** şeritteki *"Değişiklikleriniz korunuyor, tekrar deneyebilirsiniz"* cümlesi hatanın türünden bağımsız olarak doğru (form state'i ekranda duruyor) ve kullanıcının en çok merak ettiği şey o — silinmedi, gerekçenin yanına eklendi. Aynı ilke `X-08`'de de uygulanmıştı.
- ✅ **AÇIK OLAN SORU CEVAPLANDI ve cevap rahatsız edici:** *"CI lint'i tüm workspace'leri koşuyor mu?"* → **Hiçbir CI lint koşmuyor.** `oksis-ui`'da `.github` **hiç yok**, husky yok, `core.hooksPath` ayarsız, örnek dışı git hook yok. `oksis-api`'de `.github/workflows` var ama ikisi de **ajan** iş akışı (`01-architect`, `04-reviewer`) — derleme/lint/test kapısı değil. Yani `X-01`'in *"32.'sini engelleyen kural kuruldu"* iddiası **yalnız kuralı yazan kişi `npm run lint` koşturursa** geçerli. Mobilin altı ihlali tam olarak böyle geçti. Sınıf boyutu → `X-11`.


### X-11 · Kurulan hiçbir koruma otomatik koşmuyor — ne CI ne git kancası var
- **Belirti:** Depolarda **derleme/lint/test kapısı yok**. Kırmızı bir `master` push edilebiliyor ve kimse duymuyor.
- **Katman:** Altyapı · **Öncelik:** 🟠 Yüksek
- **Nasıl bulundu:** `X-09` kapanışı, 2026-08-12 — *"kural neden kırmızıyken commit edilebildi"* sorusunun peşine düşülünce.
- 🔍 **Ölçüm:**

| Depo | CI | git kancası | Sonuç |
|---|---|---|---|
| `oksis-ui` | `.github` **hiç yok** | husky yok, `core.hooksPath` ayarsız, örnek dışı hook yok | **hiçbir kapı yok** |
| `oksis-api` | `.github/workflows` var ama **ikisi de ajan** iş akışı (`01-architect`, `04-reviewer`) | aynı — yok | derleme/test kapısı **yok** |

- ➡️ **Bu, tek tek kurulmuş korumaların hepsini etkiliyor.** Bugüne kadar yazılan koruma katmanları — `X-01`'in ESLint kuralı, `X-06`'nın mimari testi (`EfIgnoredPropertyQueryTests`), `X-07`'nin retry testi, `B-04`'ün türetme testleri, `B-06`'nın rozet-liste ayrışma testi — **yalnız biri elle koşturursa** koruma sağlıyor. Hepsi "bir dahakini engeller" gerekçesiyle yazıldı; oysa engelleyen mekanizma yok.
- 📌 **Kanıt zaten yaşandı:** `X-01` *"32. ihlali engelleyen kural kuruldu"* diyerek kapanmıştı; kural mobilde **altı** ihlali gördü ve hiçbir şey olmadı. `TB-51`'deki tekrarlanamayan kırmızılar da aynı boşluğun başka yüzü — CI olmadığı için "gerçek regresyon mu gürültü mü" sorusu hiç sorulmuyor.
- 🚫 **Kısıt:** Yeni koruma yazmak bu boşluğu kapatmaz, büyütür. Her yeni kural, koşturulmadıkça yalnızca *"korunuyoruz"* yanılgısını güçlendiriyor.
- ⏸️ **KAPSAM KARARI GEREKİYOR (kendi başıma kurulmadı):** CI kurmak altyapı kararıdır — hangi sağlayıcı, hangi runner, hangi adımlar (build + lint + typecheck + unit; entegrasyon testleri Docker istiyor), PR zorunluluğu olacak mı. En küçük anlamlı adım bile (`push`'ta lint + typecheck + unit) ekip akışını değiştirir.
- 💡 **Ara çözüm olarak önerilebilecek en ucuz şey:** her iki depoda tek bir `pre-push` git kancası — CI kadar güçlü değil ama bugünkü **sıfır**dan iyi ve kimseden onay istemez.
- 🟡 **KISMEN KAPANDI — kullanıcı kararıyla pre-push kancası kuruldu** *(`oksis-ui` @ `3e4fb62` + `oksis-api` @ `03137e2`, 2026-08-12)*.
  - `oksis-ui` → `npm run lint` + `npm run typecheck`
  - `oksis-api` → `dotnet build` (0 uyarı) + Domain/Application/Api birim takımları
  - Kancalar `.githooks/` altında, yani **versiyonlu**; klonlayan bir kez `git config core.hooksPath .githooks` diyor (`README.md` ve `CLAUDE.md`'ye yazıldı).
- ✅ **Kancanın gerçekten durdurduğu KANITLANDI, kurup varsayılmadı:** `apps/mobile`'a kasıtlı bir `X-01` ihlali sokulup push denendi → kanca lint'te kırmızıya düştü ve **push reddedildi** (`failed to push some refs`). İhlal geri alındıktan sonra aynı push geçti (turbo cache ile 31 ms).
- 📌 **Kapsam bilinçli olarak dar:** amaç *"`master` hiçbir zaman kırmızı olmasın"*, tam doğrulama değil. Yavaşlayan kanca ilk işten sonra `--no-verify` ile atlanmaya başlar ve hiç yokmuş gibi olur.
- 📌 **Entegrasyon testleri kancada YOK ve bu ölçülmüş bir karar:** SQL Server/ClamAV konteyneri istiyorlar; Docker kapalıyken kanca yanlışlıkla kırmızıya düşerdi. Bu oturumda birebir yaşandı — makine yeniden başlayınca bütün konteynerler durmuştu.
- ⬜ **AÇIK KALAN — asıl çözüm hâlâ CI:** kanca yerelde çalışır, `--no-verify` ile atlanabilir ve **kancayı kurmamış** bir geliştiriciyi hiç etkilemez. Sağlayıcı / adımlar / PR zorunluluğu kararı verilmedi.

### X-05 · `Branch` identifier'ı iki ayrı kavramı gösteriyor
- **Belirti:** Aynı isim iki farklı şeyi, iki farklı tabloyu işaret ediyor:
  - **Ders programı modülünde** `Branch` = **şube** → `ScheduleProgram.BranchId`, `LessonPlacement.BranchId`, `ScheduleException.BranchId` hepsi `class_rooms` tablosuna gider. Uç adı bile `timetable/branches/{branchId}/weekly`.
  - **Müfredat/öğretmen tarafında** `Branch` = **branş** → `school.branches`, `TeacherProfile.BranchId`.
- **Katman:** BE · **Öncelik:** 🟠 Yüksek
- **Neden yüksek:** Sessiz veri hatası üretir. Bir `BranchId` gören geliştirici hangi tabloya join atacağını isimden bilemiyor; yanlış join derlenir, çalışır ve **yanlış sonuç döner**. Otomatik üretim solver'ı da aynı adı şube anlamında kullanıyor, dolayısıyla hata yüzeyi geniş.
- **Çözüm yönü:** Ders programı tarafında `Branch` → `ClassRoom` olarak yeniden adlandırılmalı (ya da tersi). Geçiş sırasında eski ad silinmeyip *deprecated* işaretlenmeli, yoksa iki isim yan yana daha da karıştırır.
- ⬜ **Not:** Domain haritasında iki kavram notuna da karşılıklı uyarı yazıldı; ama bu dokümantasyonla kapanacak bir şey değil, isim düzeltmesi gerekiyor.

### X-08 · Sorgu hata ekranları gerekçeyi sormuyor — 403 "ağ arızası" diye gösteriliyordu
- **Belirti:** Öğretmen `/schedule`e girince beş uçtan da **403** alıyor, ekranda ise *"Sunucuya ulaşılamadı. Bağlantınızı kontrol edip yeniden deneyin."* yazıyordu. Kullanıcıya internetinin bozuk olduğu söyleniyor; kaç kez denerse denesin sonuç değişmiyor. *(Ekran testinde `B-17` ölçülürken çıktı, 2026-08-11.)*
- **Katman:** FE · **Öncelik:** 🟠 Yüksek
- 🔗 **`X-01`'in ÖRTMEDİĞİ ayak.** `X-01` mutasyonları kapattı (`onError` → `mutationErrorDesc(err)`) ve ESLint kuralı da yalnız `onError`'a bakıyor. **Sorgu** hata durumları o taramanın dışında kaldı ve kendi sabit cümlelerini yazmayı sürdürdü.
- 🔍 **Asıl ironi ölçüldü:** merkezî eşleyici 403'ü **zaten doğru çeviriyordu** (`NO_PERMISSION_DESC` → "Bu işlem için yetkiniz yok."). Eksik olan mantık değil, **soru**: ekranlar ona hiç sormuyordu. Sebebi adıydı — `mutationErrorDesc` "bu mutasyonlar içindir" diye okunuyor, oysa fonksiyon **statüye** bakar, isteğin türüne değil.
- ✅ **KAPANDI** *(`oksis-ui` @ `5bb5ef5`, 2026-08-11)*:
  - Fonksiyon `apiErrorDesc` olarak yeniden adlandırıldı — adı artık ne yaptığını söylüyor. `mutationErrorDesc` **alias olarak duruyor**, yani 19+ çağrı yeri churn'lenmedi ve gerekçe eski adın üstünde yazılı kaldı.
  - `ScheduleError` artık `error` alıyor ve gerekçeyi `apiErrorDesc(error)` ile basıyor; `schedule-labels.ts`teki sabit `errorBody` **silindi** (yerine neden silindiğini anlatan not kondu).
  - Ağ hatası kolu kaybolmadı: aynı fonksiyon `ApiError` olmayan hatada zaten bağlantı tavsiyesi veriyor. Yani doğru cümle **her iki durumda da** tek yerden geliyor.
- ✅ **Ekranda doğrulandı** — öğretmen oturumu, aynı sayfa: *"Programlar yüklenemedi. **Bu işlem için yetkiniz yok.**"* ![[X-08-sonra-yetki-mesaji.png]] · `packages/api` 140/140 yeşil, `apps/web` typecheck temiz.
- ✅ **KALAN EKRANLAR DA ÇEKİLDİ — tarama artık temiz** *(`oksis-ui` @ `fd74070`, 2026-08-11)*: yoklama oturum sayfası, ayarlar hata kutusu (**sekiz sekmenin hepsi**), moderasyon kartı, sezon yönetimi, duyuru özet şeridi, rol-izin matrisi, nöbet çizelgesi ve nöbet yük raporu. 18 dosya; `packages` 521/521 yeşil, `apps/web` typecheck ve lint temiz.
- 🔍 **Yolda çıkan doğrulayıcı kanıt:** iki ekran bu deliği zaten hissetmiş ve **cümleyi belirsizleştirerek** yamamıştı. `settings/notification-tab` içindeki yorum birebir şöyleydi: *"Metin TEK bir nedene bağlanamaz: sorgu 403 dışında ağ hatası ya da 5xx ile de buraya düşer — cümle üçünü de kapsar."* Yani doğru teşhis konmuş ama çare olarak **daha az şey söylemek** seçilmişti. Merkezî eşleyici üçünü statüden ayırdığı için o belirsizliğe artık gerek yok; iki ekranın da hedge cümlesi kaldırıldı.
- 📌 **Bayrak yerine hatanın kendisi taşınıyor:** duyuru envanterinde prop `summaryFailed: boolean` idi ve gerekçeyi taşıyamazdı; `summaryError: unknown` oldu. Aynı desende "hata oldu mu" sorusu yerine "hata NE" sorusu taşınıyor.
- 📌 **Doğru olan güvenceler KORUNDU:** "Kaydedilmiş ayarlarınız etkilenmez" ve "Liste etkilenmedi" cümleleri hatanın türünden bağımsız olarak doğru — silinmedi, gerekçenin yanına eklendi.
- ⬜ **Kural boşluğu:** ESLint kuralı sorgu hata yüzeylerini yakalamıyor. Sabit hata cümlelerini yasaklayan ikinci bir selektör düşünülmeli, yoksa aynı delik yeni ekranlarda geri açılır.

---

## 11. Kod Taraması Bulguları (Domain Map) 🔧

> **Kaynak:** `oksis-api` domain haritası çıkarma taramaları (2026-08-10, commit `2270867`).
> Kapsam: Kullanıcılar & Profiller · Sınıflar & Şubeler · Görevlendirmeler · Nöbetler.
> **İkinci parti (`TB-22 … TB-26`), 2026-08-10, commit `2270867`:** Duyurular modülü — acil işareti (`Urgent`) ve yayın kavşağı taraması.
> **Üçüncü parti (`TB-27 … TB-29`), 2026-08-10, commit `2270867`:** Ders programı modülü taraması. Ayrıca `X-05` ve `B-14`'ün yeniden çerçevelenmesi bu partiden çıktı.
> **Dördüncü parti (`TB-30 … TB-33`), 2026-08-10, commit `2270867`:** Yoklama & Devamsızlık + Etkinlikler taraması. `B-02`'nin üç sorusu da bu partide cevaplandı.
> **Beşinci parti (`TB-34 … TB-36`), 2026-08-10, commit `2270867`:** Okul & Okul Ayarları taraması.
> **Altıncı parti (`TB-37 … TB-39`), 2026-08-10, commit `2270867`:** Öğrenci Kayıt taraması.
> **Yedinci parti (`TB-40 … TB-42`), 2026-08-10, commit `2270867`:** Dosya Yönetimi taraması.
> **Sekizinci parti (`TB-43 … TB-45`), 2026-08-10, commit `2270867`:** Bildirimler taraması. Acil duyuru zincirinin (`TB-22…26`) son halkası burada kapandı.
> **Dokuzuncu parti (`TB-46 … TB-47`), 2026-08-10, commit `2270867`:** Müfredat taraması. **Bu partiyle kodda gerçek karşılığı olan modüllerin tamamı taranmış oldu** — geriye yalnız beş boş klasör kalıyor (`TB-13`).
> Bunlar ekran testinden değil **koddan** çıktı; kullanıcıya görünen bir belirtisi olmayabilir ama hepsi ya tutarsızlık ya yarım kalmış geçiş.

| Öncelik | Adet |
|---|---|
| 🟠 Yüksek | 9 |
| 🟡 Orta | 22 |
| ⚪ Düşük | 10 |
| **Toplam** | **41** (+ `X-03`, `X-04`, `X-05` çapraz kesen) |

> ## 🔬 Bayat TB Taraması — 2026-08-12
>
> **Neden yapıldı:** Bu turda `B-04`, `B-10`, `TB-47` ve `TB-27` bayat çıkmıştı; kuyruğun ne kadarının
> çoktan düzelmiş olduğu bilinmeden hangi TB'ye başlansa körlemesine olurdu. Açık **40 TB maddesinin
> tamamı** bugünkü koda karşı tek tek yoklandı (iddiaların kendisi test edildi, başlıklar değil).
>
> **Sonuç — hipotezim çürüdü, kuyruk güvenilir:** 40 maddenin **38'i hâlâ geçerli**. Beklediğim
> "bir sürü madde çoktan düzelmiştir" tablosu çıkmadı. Bu turda bayat çıkanlar (`B-04`, `B-10`)
> aslında *düzeltilmiş ama deftere işlenmemiş* maddelerdi — sessizce düzelmiş TB'ler değil.
>
> | Sonuç | Adet | Maddeler |
> |---|---|---|
> | Hâlâ geçerli | **38** | aşağıdaki tüm açık TB'ler |
> | **Yarı bayat** | **1** | `TB-10` — başlığı yanlış, sonucu doğru |
> | Açık sorusu cevaplandı | **1** | `TB-28` |
>
> **En değerli bulgu — `TB-10` yarı bayat:** KVKK rıza kapısı artık **stub değil**, gerçek ve giriş
> akışına bağlı. Ama bulgunun *sonucu* (*"rızası geri çekilenin oturumu kapanmıyor"*) **hâlâ doğru**,
> çünkü kapı yalnız **girişte** soruluyor; `account/refresh` kapıyı hiç sormuyor ve rıza geri
> çekilince refresh zinciri iptal edilmiyor. **Başlığa bakıp kapatsaydım gerçek bir KVKK açığını
> gizlemiş olacaktım** — taramanın asıl kazancı bu.
>
> ✅ **Devamı:** `TB-10` aynı gün canlıda RED→GREEN ölçümüyle **kapatıldı** (`oksis-api` @ `c2bd0bf`).
> Taramanın öngördüğü iki iş de yapıldı; üstüne iki yeni bulgu (`B-18`, `E-01`) çıktı. Yani "yarı bayat"
> teşhisi doğruydu: bayat olan başlıktı, açık gerçekti.
>
> **Ölçüm notu:** Yoklamalar iddiaya özel yapıldı (ör. `TB-21` için modül taraması yetmedi, izni
> kullanan gerçek sorgu `GetTeacherWorkloadQuery` bulunana kadar arandı; ilk bakışta "bayat" görünüyordu).
> Bu turda ayrıca canlı olarak doğrulananlar: `TB-19` (geçici muafiyet, gerçekten kırık) ve
> `TB-34` (ölü `SchoolHoliday` sınıfı, gerçekten duruyor).

### TB-07 · Eski `User` kavramının emekliliği yarım kaldı 🟠
Kullanıcı oluşturma artık kişi + davet üretiyor, ama `users` ve `persons` uçları aynı veriyi iki farklı kabukla sunmaya devam ediyor. Hangisinin kanonik olduğu belirsiz. **Etkisi:** `B-03` (bağlı profilde GUID) gibi bulgular hangi uçta düzeltileceği belli olmadan kapatılamaz.

### TB-08 · İki ayrı `InvitationStatus` enum'u 🟡
Kullanıcılar tarafında altı değerli (`Created/Sent/Opened/Accepted/Expired/Revoked`), kimlik tarafında dört değerli (`Pending/Accepted/Expired/Revoked`) iki ayrı enum var. Hangisinin yürürlükte olduğu koddan çıkmıyor. Davet akışında yanlış olanın okunması sessiz hata üretir.

### TB-09 · `RelationshipAccessLevel` enum'u ölü görünüyor ⚪
Veli yetki seviyesi (yalnız bilgi / karar / ödeme) enum'u tanımlı, ama veli-öğrenci ilişkisi bunun yerine beş ayrı bayrak kullanıyor. Enum hiçbir yerde okunmuyor.

### TB-10 · KVKK rıza kapısı — başlık BAYAT, sonuç HÂLÂ GEÇERLİ 🟠
Giriş akışındaki rıza kontrolü "her zaman izin ver" döndüren bir stub. **Veri işleme rızası geri çekilen kullanıcının oturumu kapanmıyor.** Rıza kaydı, geri çekme ve kanıt zinciri tam çalışıyor — eksik olan yalnızca kapının bağlanması. Mevzuat açısından en riskli açık.

- ❌ **BAŞLIK BAYAT** *(bayat TB taraması, 2026-08-12)*: *"boş iskelet stub"* **artık doğru değil.** `Infrastructure/Identity/ConsentGate.cs` gerçek bir implementasyon, DI'da kayıtlı (`AddScoped<IConsentGate, ConsentGate>`) ve `AccountLoginCommandHandler:164`'ten çağrılıyor. Üç ayrı ret üretiyor: `no-consent`, `consent-revoked`, `bundle-version-mismatch`. `NoopConsentGate` yalnız bir `<see cref>` kalıntısı olarak duruyor.
- ✅ **AMA BULGUNUN SONUCU HÂLÂ GEÇERLİ — üstelik mekanizması bulgunun anlattığından farklı.** *"Rızası geri çekilen kullanıcının oturumu kapanmıyor"* cümlesi bugün de doğru; sebebi *"kapı bağlanmamış"* değil, **kapının yalnız GİRİŞTE sorulması**:

| Akış | Rıza kapısını soruyor mu |
|---|---|
| `account/login` | **evet** |
| `account/refresh` | **hayır** |
| `RevokeConsentCommandHandler` | token/refresh **iptal etmiyor** |

  ➡️ Rızası geri çekilen kullanıcı **giriş yapamaz** ama **var olan oturumunu token yenileyerek süresiz sürdürebilir** — hiç giriş ekranına düşmediği için kapıya da hiç uğramaz.
- 🚫 **Bu yüzden madde KAPATILMADI.** Başlığı düzeltip kapatmak, kalan gerçek KVKK açığını gizlerdi.
- ⬜ **Kalan iş net ve dar:** (a) `AccountRefreshTokenCommandHandler` rıza kapısını sorsun, (b) rıza geri çekilince refresh token zinciri iptal edilsin (`AccountLogout` deseninde zaten var). Bulgunun ilk hâlindeki *"kapıyı bağla"* işi ise **yapılmış**.

#### ✅ KAPANDI — `oksis-api` @ `c2bd0bf`, 2026-08-12

**Önce canlıda ölçüldü** (`ogretmen.s2.01@oksis.local`, API 5112, taze derleme). Aynı üç adım düzeltmenin öncesinde ve sonrasında birebir koşturuldu:

| Adım | ÖNCE | SONRA |
|---|---|---|
| `POST users/self/consents/{id}/revoke` | 204 | 204 |
| Refresh zinciri (DB, `revoked_reason`) | dokunulmadı | **7 satır `consent_revoked`** |
| `POST auth/account/refresh` *(aynı token)* | **200 + yepyeni access token** | **403 `identity.account.consent-required`** |
| `POST auth/account/login` *(sıfırdan)* | 403 | 403 |
| Rıza yerindeyken `refresh` *(regresyon)* | 200 | **200** |

➡️ Bulgunun cümlesi ("rızası geri çekilen kullanıcının oturumu kapanmıyor") **ölçümle kanıtlandı ve ölçümle kapatıldı**: ön kapı kilitliyken yan kapı açıktı, kullanıcı token yenileyerek oturumu süresiz sürdürüyordu.

**İki taraflı düzeltme — ikisi de gerekli, biri diğerinin yerine geçmez:**
1. **Kapı her tazelenişte sorulur** — `AccountRefreshTokenCommandHandler` artık `IConsentGate`'i çağırıyor, login ile **aynı kararı ve aynı hata kodunu** üretiyor. Merkezî olan bu: rızanın nasıl düştüğü (yönetici çekti, kişi kendi çekti, paket sürümü değişti) fark etmez, hepsi tek yerden yakalanır. Kapı token üretiminden **önce** sorulur — sonra sorulsa reddedilen kullanıcının zinciri de döndürülüp elindeki token boşuna geçersizleşirdi.
2. **Rıza düşünce oturum anında düşer** — `ConsentRevocationSessionApplier` (yeni, `Modules/Users/Common/`) refresh zincirini iptal eder. Aksi hâlde 1. madde ancak access token'ın ömrü dolunca (≤15 dk) devreye girerdi.

**Neden ayrı bir sınıf, neden iki handler'a kopyalanmadı:** rızayı geri çeken **iki** yol var (yönetici `RevokeConsentCommandHandler`, kişinin kendisi `RevokeMyConsentCommandHandler`). Kopyalamak, üçüncü yol eklendiğinde sessizce açıkta kalacak bir yama olurdu.

**Neden `ConsentRevokedEvent` için bir MediatR handler'ı DEĞİL** *(cazip görünen yol — domain event zaten var ve `IsDataProcessing` bayrağını tam bu amaçla taşıyor)*: event'ler `DomainEventInterceptor` içinde EF Core'un `SavedChangesAsync` post-save hook'undan dispatch ediliyor ve EF Core aynı `DbContext` üzerinde **reentrant** `SaveChangesAsync`'e izin vermiyor — bir notification handler'ı token iptalini **kalıcı hale getiremezdi**. Repo bu dersi daha önce almış: `AbsenceSummaryRecalculator` aynı gerekçeyle düz statik metot. Desen ondan alındı.

**Yalnız `DataProcessing`:** `ConsentGate` yalnız bu türe bakıyor. Her rıza geri çekilişinde oturumu düşürmek, pazarlama iznini kapatan kullanıcıyı sebepsiz sistemden atardı — test bunu ayrıca koruyor.

**Yan bulgu:** domain'de `LogoutReason.ConsentRevoked` ilk günden beri duruyordu ama **hiçbir çağıran onu geçirmiyordu** — tasarım niyeti vardı, bağlantısı yoktu. Artık geçiriliyor.

**Testler:** 4 yeni test. *Boşuna yeşil değil* kontrolü yapıldı — düzeltme geçici olarak etkisizleştirilince (`if (false && …)` / `if (true || …)`) **tam olarak o 4 test kırmızıya döndü, diğer 13'ü etkilenmedi**. Paketler: Domain 695 ✅ · Application 1578 ✅ · Api 251 ✅ · `dotnet build` 0 uyarı.

**Kapsanmayan artık (bilinçli):** hâlihazırda dağıtılmış *access* token ömrü dolana kadar (≤15 dk) geçerli kalır. `IAccessTokenBlacklist` yalnız `jti` bazlı; yönetici bir başkasının rızasını geri çekerken o kişinin `jti`'sini bilmez, dolayısıyla iki yolu **simetrik** kapatacak bir mekanizma bugün yok. Asıl açık — *sınırsız* oturum uzatma — kapandı.

➡️ Bu turda **iki yeni bulgu** çıktı, ikisi de bölüm 7b'de: **B-18** (rıza reddi kullanıcıya "hesabınız askıya alındı" diye gösteriliyor) ve **E-01** (rıza yenileme ekranı yok — 403 çıkışsız).

### TB-11 · Rıza sürümü iki farklı tipte tutuluyor 🟡
Hesap üzerinde sayısal (`int`), rıza kaydında metin (`v2026.05.01` biçimi). İkisi aynı şeyi anlatıyorsa karşılaştırma yapılamaz; anlatmıyorsa adlandırma yanıltıcı. Yeni sürüm yayınlandığında yeniden onay istemek bu alana bağlı olacak.

### TB-12 · İki adımlı doğrulama bayrağının karşılığı yok ⚪
Hesapta `TwoFactorEnabled` alanı ve açma/kapama davranışları var, ama giriş akışında bu bayrağı okuyan bir dal görünmüyor. OTP altyapısı da "sonraki sürümde etkinleşecek" notuyla bekliyor.

### TB-13 · Uygulama katmanında beş boş modül klasörü duruyor ⚪
`Classes` klasörü var ama içinde yalnız `.gitkeep` bulunuyor; şube işlerinin tamamı `AcademicSessions` altında yaşıyor. Yeni gelen buraya bakıp kayboluyor.
- ➕ **Kapsam genişledi** *(2026-08-10)*: Aynı durumda **beş** klasör var — `Classes`, `Grades`, `Homework`, `Messaging`, `Dashboard`. Hepsi yalnız `.gitkeep` içeriyor; domain tarafında da karşılıkları yok (0 entity).
- **Etkisi:** Klasör listesi "bu modüller var" izlenimi veriyor. `Classes` yanıltıcı çünkü işlev **başka yerde** yaşıyor; diğer dördü ise **hiç yazılmamış** — ikisi çok farklı durum ama klasöre bakınca ayırt edilemiyor.
- **Çözüm yönü:** `Classes` silinsin (işlevi `AcademicSessions`'ta). Yazılmamış dördü ya silinsin ya da içine niyeti anlatan bir `README` konsun.
- ✅ **KAPANDI — defterin yazdığı yol birebir uygulandı** *(`oksis-api` @ `9b1259c`, 2026-08-11)*. Önce ölçüldü: beş klasörün beşi de yalnız `.gitkeep` içeriyordu, kod tabanında **hiçbir referansı yoktu** (`Modules.Classes|Grades|Homework|Messaging|Dashboard` → 0 eşleşme) ve `Oksis.Domain/Modules/` altında karşılıkları da yoktu.
  - `Classes` **silindi** — yanıltıcıydı, işlevi gerçekten var ama `AcademicSessions` altında yaşıyor.
  - Kalan dördüne `README.md` kondu: "bu klasör boştur ve bilinçli olarak boştur, modül yazıldığında bu dosya silinir". Böylece **iki durum artık klasöre bakınca ayırt ediliyor** — bulgunun asıl şikâyeti buydu.
  - `dotnet build` temiz (0 uyarı, 0 hata).

### TB-14 · Silinen şubenin geçmiş atamaları sahipsiz kalıyor 🟡
Şube silindiğinde kayıt işaretlenerek kaldırılıyor ve (sezon, seviye, şube adı) slotu **serbest kalıyor** — aynı ad yeniden açılabiliyor. Ama o şubeye ait kapanmış öğrenci atamaları silinen şubeye asılı kalıyor. Aynı adla yeni şube açılırsa öğrenci geçmişinin hangi şubeye ait okunacağı belirsiz.

### TB-15 · Atama sebebi türetimi sezon değil tenant geneline bakıyor 🟡
Öğrenci bir şubeye atanırken sebep otomatik seçiliyor: daha önce kapanmış kaydı varsa "yıl içi yeni kayıt", yoksa "ilk atama". Bu bakış **tenant genelinde** yapılıyor, sezona göre değil. Yeni sezonda terfi eden her öğrenci "yıl içi yeni kayıt" olarak etiketleniyor olabilir. Rapor ve geçmiş okumalarını bozar.

### TB-16 · Nöbet bölgesi silinirken kullanımda kontrolü yok 🟠
Derslik silinirken "bir şube bunu kullanıyor" diye engelleniyor; **nöbet bölgesi doğrudan siliniyor.** Yayınlanmış çizelgede o bölgeye ait atamalar varsa sahipsiz kalıyor. İki benzer katalog, iki farklı davranış — tutarsızlık.

### TB-17 · Sezon kimliği bazı modüllerde eski adla taşınıyor ⚪
Diğer modüller `AcademicSessionId`'ye taşındı; nöbet çizelgesi hâlâ `AcademicYearId` kullanıyor.
- ➕ **Kapsam genişledi** *(kod taraması, 2026-08-10)*: Yalnız nöbette değil — **ders programı modülünün dört varlığında da** (program, sürüm, üretim işi, öğretmen müsaitliği) eski ad duruyor.
- ➕ **Üçüncü modül:** dosya yönetiminde `StoredFile.AcademicYearId` de aynı eski adı taşıyor. Yeniden adlandırma geçişi üç modülde yarım kalmış — tek noktada değil, hepsinde birlikte temizlenmeli.

### TB-18 · Nöbet politikaları yazılabiliyor ama "etkisiz" işaretli 🟡
Haftalık nöbet sıklığı ve gün deseni (yayılı/ardışık) okul ayarı olarak kaydedilebiliyor, ama kodda "şimdilik etkisiz, sonraki fazın dağıtım girdisi" notu duruyor. Yönetici ayarı değiştirdiğinde bir şeyin değiştiğini sanıyor. Ya bağlanmalı ya arayüzden gizlenmeli.


### TB-20 · Öğretmen branşı davet ve içe aktarma akışında atanmıyor 🟠
Toplu içe aktarma ve davet yolunda branş **adı** katalog kimliğine çözülmüyor; kod pilot için boş bırakılmasını kabul ediyor. Buna karşılık **branşsız öğretmene görevlendirme yapılamıyor** (sert engel).
- 🔗 **`B-05` ile aynı zincir:** "Mevcut öğretmenin branşı hiçbir yerden belirlenemiyor" bulgusunun ikinci ayağı bu. Ekran eksikliği tek başına çözüm değil — **içe aktarma ve davet yolları da branşı çözmeli**, yoksa toplu eklenen her öğretmen görevlendirilemez doğar.
- 📌 **`B-05` kapandı ama bu madde AÇIK** *(2026-08-11)*: artık *mevcut* bir öğretmene branş atanabiliyor (`UpdateProfileCommand.BranchId`). Ama `ProfileBuilder.cs`'teki TODO **duruyor** — davet/içe aktarma hâlâ branş **adını** katalog kimliğine çözmüyor. Yani toplu eklenen öğretmenler yine branşsız doğuyor; fark şu ki artık tek tek düzeltilebiliyorlar. Toplu ekleme yapan bir okulda bu, elle N tıklama demek.

#### ✅ KAPANDI — oksis-api @ `7667084`, 2026-08-12

**Canlı uç ölçümü** (`mudur.s2`, s2 okulu · `POST /api/v1/users/imports/preview` → `POST /api/v1/users/imports` → SQL'de `identity.profiles.teacher_branch_id`). Ekran kanıtı yok, çünkü **içe aktarmanın arayüzü yok** — bkz. aşağıdaki not.

| Dosyada `Brans` | ÖNCE önizleme | ÖNCE veritabanında | SONRA önizleme | SONRA veritabanında |
|---|---|---|---|---|
| `Kimya` (birebir) | geçerli | **`NULL` — branşsız** | geçerli | **`Kimya`** |
| `kimya` (küçük harf) | geçerli | `NULL` | geçerli | **`Kimya`** |
| `MATEMATİK` (Türkçe büyük) | geçerli | `NULL` | geçerli | **`Matematik`** |
| `Kimyaa` (yazım hatası) | **geçerli** | `NULL` | **reddedildi** `branch-unknown` | *(satır hiç işlenmedi)* |
| *(boş)* | geçerli | `NULL` | geçerli | `NULL` *(kabul)* |

- 🎯 **Zincirin diğer ucu da ölçüldü:** içe aktarılan öğretmene görevlendirme denemesi ÖNCE **`409 teaching-assignments.errors.teacher-no-branch`**, SONRA **`201 Created`**. Bulgunun *"görevlendirilemez doğuyor"* iddiası varsayım değildi; sert engel canlıda görüldü ve kalktı.
- ✅ **Merkezî çözüm — ad→kimlik çevirisi tek yerde:** `Application/Modules/Users/Common/BranchNameLookup.cs`. Dört yazma yolu da onu çağırıyor: içe aktarma önizlemesi, arka plan içe aktarma işi, `CreatePerson`, `AttachProfile`. Ekran/uç başına `if` eklenmedi.
- 🔒 **Unutulması derleme hatası oldu:** `ProfileBuilder.Build` artık `Guid? teacherBranchId` parametresini **zorunlu** alıyor (varsayılanı yok). TB-20 tam olarak bu parametrenin yokluğuydu; varsayılan verilseydi yeni bir çağıran yine sessizce branşsız öğretmen üretirdi. Beş çağıranın hepsi "bu yolda branş var mı" sorusunu yanıtlamak zorunda kaldı.
- 🔍 **Karşılaştırma neden SQL'de değil bellekte (ölçülerek seçildi):** `MATEMATİK` ↔ `Matematik` eşleşmesi yalnız **tr-TR** büyütme kuralıyla doğru; invariant kültür `Matematik` → `MATEMATIK` üretir ve eşleşme kaçar. SQL'e bırakılsaydı sonuç veritabanı collation'ına bağlı olurdu ve dört yol farklı davranabilirdi. Katalog okul başına birkaç yüz satır; iş başına **bir** kez okunuyor (satır başına sorgu 5.000 satırda 5.000 gidiş-dönüş demekti).
- 🛑 **Yazım hatası artık onaydan ÖNCE yakalanıyor:** eskiden `Kimyaa` önizlemeden `validRows: 5, invalidRows: 0` diye geçiyor, hata ancak iş bittikten sonra branşsız öğretmen olarak görünüyordu. Onay düğmesine basılan yer önizleme; hata orada söylenmezse bedeli N kişiyi tek tek düzeltmek.
- 🔀 **"Yok" ile "pasif" ayrı gerekçe** (`branch-unknown` / `branch-inactive`, tekil uçta ad taşıyan Türkçe cümle). `B-05`'te aynı ayrım yapılmıştı: kullanıcı hücreyi mi düzeltecek yoksa branşı mı aktifleştirecek, ancak böyle bilir.
- 🧪 **17 test + boş-yere-yeşil kontrolü:** 12 birim (çözümleme + önizleme), 2 entegrasyon (gerçek SQL üzerinde kolonun kendisine bakıyor), 3 mevcut import testi korundu. tr-TR büyütme `ToUpperInvariant`'a çevrildiğinde **yalnız ilgili 1 test kırmızıya düştü**, 12'si yeşil kaldı. Application 1595/1595, entegrasyon import 4/4, `dotnet build` 0 uyarı.
- ⬜ **Kalan ayak — "davet yolu" bilinçli olarak dokunulmadı, çünkü ortada çözülecek bir ad yok:** tekil davet (`CreateUserCommand`) ve `Ad/Soyad/Email/Rol` başlıklı toplu kullanıcı içe aktarma **branş sormuyor** — ne komutta ne şablonda böyle bir alan var. Web'deki "kullanıcı ekle" ekranı zaten yalnız *Okul Yöneticisi* davet ediyor. Alan/sütun eklemek yeni özellik = **kapsam kararı**; bugünkü davranış kodda gerekçesiyle yazılı (`PersonUserCreationService`).
- ⬜ **Ekran ayağı yok (kanıt bu yüzden uç ölçümü):** `POST /users/imports` ailesinin **arayüzü hiç yok** — `apps/web` içinde şablon indirme / önizleme / onay çağrısı sıfır eşleşme. Yani bu düzeltme bugün yalnız API'yi kullananlara ulaşıyor.
- ➕ **Turdan çıkan iki bulgu:** [[#B-20 · İçe aktarmada "davet gönder" seçeneği hiçbir şey yapmıyor 🟠]] · [[#TB-55 · İki ayrı toplu içe aktarma yolu yan yana yaşıyor 🟡]].

### TB-21 · Öğretmen yükü sorgusu farklı izin ailesiyle korunuyor ⚪
Görevlendirme sorguları kendi izin aileleriyle korunurken, öğretmen yük özeti `users.view` istiyor. Yetki matrisinde bilinçli bir istisna mı, kopyala-yapıştır kalıntısı mı belirsiz.

### TB-27 · Ders programı durum enum'unda bayat faz notu ⚪
`ScheduleProgramStatus` açıklamasında *"Faz 1'de yalnız Taslak/Revize egzersiz edilir; Yayında Faz 2'de devreye girer"* yazıyor. Oysa yayın uçları, yayın snapshot'ı ve tüketici ekranları (öğretmen/öğrenci/veli programı) çalışır durumda. Yorum yeni geleni yanlış yönlendiriyor.
- ✅ **KAPANDI** *(`oksis-api` @ `9b1259c`, 2026-08-11)*. Notun bayat olduğu **ölçülerek** doğrulandı: `PublishProgram` komutu ve `POST /{id}/publish` ucu var, `ScheduleVersion` snapshot'ı yazılıyor, `GetPublishedSchedules` · `ListScheduleVersions` · `GetScheduleVersionDiff` sorguları ondan okuyor. Yorum düzeltildi ve **neden değiştiği** de yazıldı ki aynı cümle geri gelmesin.
- ➕ **Aynı sınıftan ikinci bir bayat not bulundu ve o da düzeltildi:** `ScheduleVersion` docblock'u *"Tüketici ekranları Faz 2'de … beslenecek"* diyordu — gelecek zaman, oysa bugün besleniyor.
- ⚠️ **Ama "tüketici ekranları çalışır durumda" cümlesi YALNIZ backend için doğru.** Öğretmen/öğrenci web yüzeyi **yok** — bkz. `B-17` ve [[ENG-02 - Ogretmen ve ogrenci ders programi yuzeyi hic yok]].

### TB-28 · Program istatistiklerinin tazeliği garanti değil 🟡
Ders programı üzerinde üç denormalize sayı taşınıyor — çakışan yerleşim sayısı, yerleştirilmemiş saat, müsaitlik ihlali. Üçünü de domain hesaplamıyor; uygulama katmanı hesaplayıp yazıyor, program yalnız saklıyor. Hub listesi bu sayıları okuyor.
- ✅ **AÇIK SORU CEVAPLANDI** *(bayat TB taraması, 2026-08-12)*: yeniden hesap **`IScheduleProgramStatsRecomputer`** ile yapılıyor ve ders programı komutlarının **19'undan 12'sine** enjekte edilmiş. Yerleşimi değiştiren yolların hepsi kapsamda: `PlaceLesson` · `MoveLesson` · `RemoveLesson` · `SetBlock` · `AssignTeacher` · `AssignRoom` · `ApplyAutoGenerateDraft` · `PublishProgram` · `RestoreScheduleVersion` · `CreateProgram` · `DeleteScheduleProgram` · `SaveTeacherAvailability`.
- 🔎 **Kapsam dışı kalan 7 komut ve değerlendirmesi:** `CreateRoom` / `UpdateRoom` / `DeleteRoom` (derslik kataloğu — yerleşimi değiştirmez) ve `EnqueueAutoGenerate` (yalnız kuyruğa atar) **zararsız**. Geriye şu üçü kalıyor ve **doğrulanmadı**: `CreateScheduleException`, `RevokeScheduleException`, `SaveDraft`. İlk ikisi tarihe özel istisna yazar (sayaçları etkilemiyor olabilir), üçüncüsü taslak kaydeder. Bunlar bakılmadıkça bulgu tam kapanmaz.
- 📌 **Bulgunun korkusu (hiç tetiklenmiyor) doğrulanmadı** — mekanizma kurulu ve yaygın; kalan risk üç dar komutta.
- **Bağlantı:** `B-08` (öğrenci sayısı `-` görünüyor) da bir sayaç/projeksiyon sorunu; aynı desenin başka yüzü olabilir.


### TB-30 · Etkinlikte grup devri turlardaki öğretmeni güncellemiyor 🟡
Etkinlik sayım turu oluşturulurken grubun sorumlu öğretmeni **tura da kopyalanıyor**. Sonra grup sorumluluğu devredilince yalnız gruptaki alan güncelleniyor; turdaki kopya **eski öğretmende kalıyor**.
- **Etkisi:** Aynı bilgi iki yerde tutuluyor ve devirden sonra ayrışıyor. Tur listesi eski sorumluyu gösteriyor olabilir — güvenlik sayımında "bu turdan kim sorumluydu" sorusu yanlış cevaplanır.
- **Çözüm yönü:** Turdaki kopya kaldırılıp okuma anında gruptan çözülmeli. `ActivityGroup` zaten "adı değil kimliği sakla, ad bayatlar" ilkesini uyguluyor — aynı ilke burada da geçerli, ama uygulanmamış.


### TB-32 · "Hatırlat" eyleminde guard yok ⚪
İdare, yoklama girmemiş öğretmene hatırlatma gönderirken guard uygulanmıyor; butona tekrar basılabiliyor. **Ardışık** basışlar deterministik idempotency anahtarı sayesinde tek bildirimde kalıyor, ama **eşzamanlı** iki basışta ön kontrol atomik olmadığı için iki bildirim gidebiliyor.
- Kod bu pencereyi kendi içinde borç olarak işaretlemiş; pratikte arayüzdeki "gönderim sırasında devre dışı" butonuyla korunuyor.
- **Not:** Arayüze dayanan bir koruma sunucu tarafında koruma değildir.

### TB-33 · Etkinlik iptal alanında tek/çift "l" tuzağı ⚪
Aynı kavram iki farklı yazımla taşınıyor: arayüz sözleşmesi ve veritabanı kolonu tek "l" (`canceled`), backend hata kodu çift "l" (`Cancelled`). Bilinçli bir sözleşme ama yanlış yazması çok kolay ve derleyici yakalamaz.

### TB-34 · Ölü `SchoolHoliday` sınıfı ve çift `HolidayType` enum'u 🟡
Tatil için iki ayrı domain sınıfı var ve **biri hiçbir yere bağlı değil**:
- **Canlı:** `Schools.Holiday` — `DbSet`'i, EF konfigürasyonu var, `academic.school_holidays` tablosuna yazıyor, tüm handler'lar onu kullanıyor.
- **Ölü:** `AcademicSessions.SchoolHoliday` — konfigürasyonu yok, `DbSet`'i yok, hiçbir handler tipini kullanmıyor. Kendi doğrulamaları (ad/açıklama uzunlukları) ve kendi istisna sınıfı var ama hiçbiri çalışmıyor.
- Sezon tatili uçlarının **adı** `SchoolHoliday` ama gövdeleri `Holiday` üzerinden çalışıyor — isimden yanlış sınıfa gitmek çok kolay.
- Ayrıca iki ayrı `HolidayType` enum'u var (`AcademicSessions` ve `Schools`).
- **Etkisi:** Ölü sınıfa bakıp kural çıkaran biri (uzunluk sınırı, sezon zorunluluğu) çalışmayan bir sözleşmeye güvenir. Domain haritasındaki `Okul Tatili` notu da bu ölü sınıfa bağlıydı — düzeltildi.
- **Çözüm yönü:** Ölü sınıf ve istisna silinsin; enum tek noktada birleşsin.

### TB-35 · Devamsızlık eşiği iki ayrı yerde tanımlanıyor, biri hiçbir şey yapmıyor ✅
Yönetici devamsızlık uyarı eşiğini **iki farklı yerden** girebiliyor:
- **Akademik politika** (okul ayarları) → `WarningAbsenceThreshold`, `UnexcusedAbsenceLimit`, `TotalAbsenceLimit`
- **Bildirim yapılandırması** → `AbsenceWarningThreshold`, `AbsenceCriticalThreshold`

İkincisi yazılıyor, 1-60 aralığında **doğrulanıyor**, DTO ile ekrana dönüyor — ama **hiçbir tüketicisi yok**. Devamsızlık eşik motoru yalnız akademik politikadaki alanları okuyor.
- **Etkisi:** Yönetici bildirim ekranından eşiği ayarlayıp "uyarı kuruldu" sanıyor; hiçbir uyarı tetiklenmiyor. Kullanıcıya görünen sessiz bir yalan.
- ✅ **KULLANICI KARARI VERİLDİ — 2026-08-12: Akademik Politika kazanıyor.** Bildirim yapılandırmasındaki `AbsenceWarningThreshold` / `AbsenceCriticalThreshold` alanları **kaldırılacak**; eşik motoru zaten yalnız akademik politikayı okuyor, yani ekran gerçeğe uydurulacak.
- 📌 **Gerekçe:** eşiği taşımak, akademik politikadaki diğer iki alanla (`UnexcusedAbsenceLimit`, `TotalAbsenceLimit`) aynı kavramı iki ekrana bölerdi. Kaldırma hem daha az iş hem de *"kullanıcıya görünen sessiz yalan"*ı bitiren yol.
- ✅ **KAPANDI** *(`oksis-api` @ `954c3f6` + `oksis-ui` @ `3465370`, 2026-08-12)*.
- ✅ **"Tüketicisi yok" iddiası ÖLÇÜLEREK doğrulandı:** `NotificationConfig.AbsenceWarningThreshold` / `AbsenceCriticalThreshold`, kendi query/command/DTO'ları **dışında** repo genelinde hiç okunmuyordu. Karşı taraf ise capcanlı: akademik politikadaki `WarningAbsenceThreshold`'u eşik motoru (`AbsenceCalculator`), risk öğrenciler, dönem raporu ve öğrenci özeti okuyor.
- 🔎 **AMA BULGUNUN ETKİ CÜMLESİ FAZLA GENİŞMİŞ — düzeltildi:** Bulgu *"Yönetici bildirim ekranından eşiği ayarlayıp 'uyarı kuruldu' sanıyor"* diyordu. Ölçüm: **web ve mobil arayüzde bu eşikler için giriş alanı HİÇ YOK.** Ekrandaki tek *"Uyarı eşiği"* Ayarlar → Politika sekmesinde ve akademik politikaya bağlı, yani **doğru olana**. İstemcide alanlar yalnız *"echo"* olarak taşınıyordu (sunucudan al, PUT'ta geri yolla). Yani ortada kullanıcıya görünen bir yalan değil, **ölü sözleşme + ölü doğrulama + ölü kolon** vardı. `TB-##` maddelerinin kod taramasından çıktığı ve *"kullanıcıya görünen bir belirtisi olmayabilir"* uyarısı burada birebir geçerliymiş.
- ✅ **Kaldırılanlar:** domain alanları, `Create`/`Update` imzaları, iki DTO, komut alanları, 1-60 aralığı ve **BR-SS-003** doğrulamaları, EF property'leri, `ck_notification_critical_gte_warning` check constraint'i, istemci tipleri, `clampThreshold` yardımcısı ve mock verisi. Migration kolonları **ve kısıtı** düşürüyor.
- 🔎 **Migration İLK SEFERDE EKSİKTİ ve bunu entegrasyon fixture'ı yakaladı:** kolonlar düşürülüp check constraint modelde bırakılınca `EnsureCreated` **`Invalid column name 'absence_critical_threshold'`** ile patladı (`SchoolSettingsTenantTests` 2 test kırmızı). Kısıt kaldırılıp migration yeniden üretildi; iki test yeşile döndü. Birim testleri bu sınıfa **kördü** — `X-06`/`X-07`'nin *"test yeşil, gerçek yol kırık"* deseninin tersi: burada gerçek sağlayıcıya karşı koşan test hatayı yakaladı.
- ✅ **Canlı doğrulama:** migration dev veritabanına uygulandı → `absence_*` kolonları **yok**, check constraint **yok**, akademik politika eşikleri **korundu** (5/10). Uçlar: bildirim yapılandırması okuma **200** (sözleşmede eşik alanı yok), eşiksiz yazma **204** ve kayıt DB'ye düştü.
- 📌 **Veri kaybı sıfır:** `school_notification_configs` tablosu üç okulda da **boştu** — alanların hiç yazılmadığının ayrı bir kanıtı.
- 🧪 BE 695 + 1555 + 251 + **40/40** yeşil (sonuncusu düzeltmeden önce 2 kırmızıydı), build 0 uyarı; `packages` 144+103+288 yeşil, typecheck temiz, OpenAPI şeması yeniden üretildi.
- 🔎 **Yolda çıkan ortam notu:** dev veritabanı **iki migration geride**ydi — `B-10`'un `remove_counseling_subject` migration'ı (önceki oturumda commit edilmiş) hiç uygulanmamıştı. `B-10`'un ölçümü yine de geçerli: Rehberlik zaten daha eski bir migration'la (`20260808_remove_counseling_subject`) silinmişti, yani aynı işi yapan **iki** migration var. Yenisi uygulandığında sıfır satır etkiledi.

### TB-36 · İki zaman dilimi alanı, iki farklı format 🟡
Aynı tenant için iki ayrı zaman dilimi alanı tutuluyor:
- `School.TimeZone` → **IANA** biçimi (`Europe/Istanbul`), sistemde tanımlı olduğu doğrulanıyor, "tüm tenant zaman hesaplamalarının kaynağı" diye belgelenmiş.
- `SchoolSettings.Timezone` → **Windows** biçimi (`Turkey Standard Time`), varsayılanı sabit.
- **Etkisi:** Zamanlanmış işler, sessiz saatler ve raporlar hangisini okuyorsa diğeri sessizce yanlış kalır. İki format birbirine otomatik çevrilmiyor; biri değiştirilip diğeri unutulursa fark ancak saat kaymasıyla anlaşılır.
- ⬜ **Doğrulanacak:** Hangi alan fiilen okunuyor? Yetkili olan kalsın, diğeri kaldırılsın.

### TB-37 · Öğrencinin şubesi üç ayrı yerde tutuluyor, biri yıl içi transferde bayatlıyor 🟠
Aynı gerçek — "bu öğrenci hangi şubede" — üç kayıtta duruyor:
1. **`ClassRoomStudent` defteri** → doğruluk kaynağı.
2. **`StudentProfile.CurrentClassroomId`** → ayna; defter her değiştiğinde interceptor'la **aynı transaction içinde** otomatik türetiliyor. Sağlam.
3. **`StudentEnrollment.ClassRoomId`** → ayna; ama **yalnız terfi akışında** yazılıyor.

Yıl içi şube transferi (`TransferStudent`) defteri ve profili günceller, üçüncüsüne **hiç dokunmaz** — `AcademicSessions` tarafındaki hiçbir komut `StudentEnrollment`'a yazmıyor (tek istisna `SetupSeasonReverter`, o da temizlik).
- **Etkisi:** Yıl ortasında şube değiştiren öğrencinin kaydı eski şubede kalıyor. Kayıt üzerinden şube okuyan her rapor/ekran yanlış gösterir ve fark yalnız iki kaynağı karşılaştırınca anlaşılır.
- **Çözüm yönü:** Ya ayna alan kaldırılıp defterden okunsun, ya profil aynasıyla **aynı interceptor** mekanizmasına bağlansın. Mekanizma zaten var — kayıt onun dışında bırakılmış.


### TB-39 · Kayıttaki sınıf seviyesi kimlik değil sayı ⚪
`StudentEnrollment.GradeLevel` bir `int`; sistemin geri kalanında kademe master kaydına FK ile bağlanıyor. Kod bu sayının `GradeLevel.DisplayOrder` ile **aynı sayı uzayında** olduğunu varsayıyor ve terfi ile terminal-kademe kararları (`GradeLevel + 1` sunuluyor mu?) bu varsayıma dayanıyor.
- Varsayım belgelenmiş, ama kırılgan: kademe sıralama numaraları değişirse mevcut kayıtlar sessizce kayar ve yanlış öğrenciler mezun edilir.
- **Not:** Bu tercih bilinçli olabilir (denormalize kademe numarası). Kırılganlığın kabul edilip edilmediği yazılı değil.

### TB-40 · Önizleme dosyaları hiçbir imha işinin kapsamında değil 🟡
Görsel dosyalar için üretilen önizleme (thumbnail) **ayrı bir dosya kaydıdır** ve üst dosyaya işaret eder. Ama:
- Üst dosya silindiğinde veya süresi dolup imha edildiğinde önizleme **temizlenmiyor**.
- Önizleme kategorisinin kendi saklama süresi `null`, yani günlük imha işinin de kapsamı dışında.
- Sonuç: her önizleme, üstü gittikten sonra sonsuza dek depoda kalıyor ve okulun kotasını yiyor.
- Kod bunu açıkça borç olarak işaretlemiş ("ömür parent'a bağlıdır, ayrı retention yerine parent silindiğinde temizlenmesi backlog").
- **Çözüm yönü:** ya imha işi üst dosyayı takip edip önizlemeyi de silsin, ya önizlemeye kendi süresi verilsin.

### TB-41 · Depolama kotası sayacı atomik değil 🟡
Okulun kullandığı alan hızlı olsun diye önbellekte tutuluyor; güncelleme **oku-sonra-yaz** biçiminde ve atomik değil. Sapma 15 dakikada bir veritabanı toplamıyla sıfırlanıyor.
- **Etkisi:** Eşzamanlı yüklemelerde sayaç eksik kalabilir ve kota sessizce aşılabilir. Kotanın amacı maliyet kontrolü olduğu için aşım fark edilmeden büyür.
- Kısıt kodda açıkça yazılı ("atomiklik yok"), yani bilinen bir kabul. Kabul sınırının ne olduğu (ne kadar sapma tolere edilebilir) yazılı değil.


### TB-44 · Bildirim türünün üç ayrı temsili var, biri ölü 🟡
Aynı kavram üç yerde:
1. **`NotificationKind`** (enum, 23+ değer) — **fiilen kullanılan**. Üretilen her bildirim satırı bunu taşır.
2. **`NotificationType`** (master tablo: `ATT_ABSENT`, `GRADE_PUBLISHED`…) — dağıtım kataloğu. Seed'li, `DbSet`'i var, belgesinde "MVP'de bu satırlar yetkilidir" yazıyor — ama **hiçbir kod okumuyor**.
3. **`NotificationEventType`** (master tablo) — ayarlar matrisi kataloğu; yalnız ayar ekranını besliyor.

- İki katalog arasındaki ilişki kodda "ortak kodlar üzerinden uzlaştırılabilir" diye anlatılmış ve borç olarak işaretlenmiş; fiilen kullanılan enum ile **ikisi arasında da eşleme yok**.
- Ayarlar kataloğu, dağıtım karşılığı olmayan olayları (taksit, ödeme, karne, acil duyuru) **yer tutucu** olarak taşıyor — yani ekranda görünen bir olay gerçekten gönderilen bir bildirim olmayabilir.
- **Çözüm yönü:** Ölü katalog kaldırılsın ya da dağıtım gerçekten ona bağlansın; yer tutucu olaylar ekranda işaretlensin.

### TB-45 · Öncelik ve sessiz saat kavramı yok 🟡
Bu depoda bildirim önceliği diye bir kavram yok ve **hiçbir bildirim gönderilirken sessiz saate bakılmıyor** — kod bunu açıkça yazıyor.
- **Acil duyuru bile teslim davranışını değiştirmiyor:** acil işareti yalnız bildirim başlığına "Acil duyuru: …" ön eki koyuyor. Olay `Urgent` alanını taşıyor ki ileride bir kanal eklendiğinde handler değişmeden bağlanabilsin — yani boşluk bilinçli ve yer hazırlanmış.
- **Bağlantı:** `TB-22 … TB-26` acil duyuru zincirinin son halkası bu. O partide "acil işaretinin kapısı yok" deniyordu; burada görülüyor ki **kapı olsa bile teslimde karşılığı yok**. Acil duyuruyu uçtan uca anlamlı kılmak için üç iş birden gerekiyor: kapı (`TB-22`), kanal (`TB-43`), öncelik (`TB-45`).


### TB-47 · Haftalık saat override'ının kod açıklaması bayat ⚪
`SchoolWeeklyHourOverride` açıklamasında *"bu spec'te yazma yolu YOK (S-6); yalnız resolver okur. Yönetim UI'ı tam Müfredat modülünde gelir"* yazıyor.
Oysa yazma komutu (`SetSubjectWeeklyHours`) **ve** kendi izni (`curriculum-hours.override`) mevcut. Açıklama, kaydın salt-okunur olduğu izlenimi veriyor.
- ✅ **KAPANDI** *(`oksis-api` @ `9b1259c`, 2026-08-11)*. Yazma yolu ölçülerek doğrulandı: `SetSubjectWeeklyHoursCommand` + `[RequirePermission("curriculum-hours.override")]` + `CurriculumHoursController` ucu. Docblock düzeltildi ve komutun **reconcile** davranışı da yazıldı (verilen saat master ile aynıysa override kaydı silinir) — eski not bunu hiç söylemiyordu.

---

> **İkinci parti — Duyurular / acil işareti kavşağı** *(2026-08-10, `oksis-api` @ `2270867`)*
> Beşinin de ölçümü koddadır. `TB-22`, `TB-25` ve `TB-26` spec §17'de de izleniyor (`C5-5`, C5 kapanış maddesi `(ooo)`, yeni `C6-2`); defterde tekrarlanmalarının sebebi zincirin burada görünür olması. Ayrıntılı gerekçe tek yerde: `oksis/docs/superpowers/specs/2026-08-02-duyurular-uctan-uca-design.md` §17.
> **Beşi de tek plana bağlandı:** `oksis/docs/superpowers/plans/2026-08-10-duyurular-c6-acil-yetki-ve-yayin-kapilari.md`.

### TB-22 · Acil işareti yalnız OLUŞTURMA anında sorgulanıyor 🟠
`Urgent = true` bir ayrıcalıktır (bildirim başlığına "Acil duyuru: " ön eki, denetim izine warning damgası, envanter süzgeci, özet sayacı) ve yetki kapısı yalnız `CreateAnnouncementCommandHandler`'da. Oysa `Announcement.Publish()`'in **üç çağıranından ikisi** kapıyı hiç görmüyor: `ApproveAnnouncementCommandHandler` ve `PublishScheduledAnnouncementsJob` dosyalarında `Urgent` kelimesi **0 kez** geçiyor.
- **İki delik ölçüldü:** (1) kapı 2026-08-10'da eklendi — ondan önce yazılmış `scheduled`/`pendingApproval` kayıtlar yayına acil olarak çıkar; (2) kapı oluşturma anındaki yetkiyi ölçer, oysa duyuru günler sonra yayınlanır — yayınlayanın rol ataması bu arada sona ererse (`ExpireRoleAssignmentsJob`) acil yine çıkar. **İkinci delik bugün de canlı**, eski kayıt gerektirmiyor.
- 🔗 **`TB-24` ile aynı zincir** — bugün etkisi kozmetik, D fazında kanal tırmanmasına dönüşür.
- ✅ **KAPANDI — C6** *(`oksis-api` @ `5a3bf23`, 2026-08-11)*: kapı **yayın anına** taşındı. `Announcement.RevokeUrgent()` + saf `AnnouncementUrgentGuard`, iki yayın yolunda da `Publish()` **öncesinde** çağrılıyor (`ApproveAnnouncementCommandHandler`, `PublishScheduledAnnouncementsJob`). Bayrak reddedilmez, **düşürülür** ve denetim izine warning tonlu kayıt geçer. Bekleyen kayıtlar için günlük `SweepUnauthorizedUrgentAnnouncementsJob`. İkinci delik (izin oluşturma ile yayın arasında geri alınıyor) de kapandı — yetki artık yayın anında sorulur.

### TB-23 · Onay gerektiren duyuru ZAMANLANINCA onay kuyruğunu atlıyor 🟠
`CreateAnnouncementCommandHandler`'da dallanma sırası şöyle: taslak → **zamanlama** → moderasyon. Zamanlama kolu `return` ile çıktığı için eşikli modda öğretmenin velilere gönderdiği duyuru, ileri tarihe zamanlandığında onay kuyruğuna **hiç düşmüyor**; job vakti gelince doğrudan yayınlıyor. Validator'da öğretmenin zamanlamasını kısıtlayan bir kural yok.
- **INV-5** *"pendingApproval yalnız thresholded + öğretmen→veli"* diyor; fiiliyatta yazılı olmayan bir *"…ve zamanlanmamışsa"* şartı var.
- ⬜ **Doğrulama notu:** dallanma sırasından okundu, çalıştırılarak doğrulanmadı. Hiçbir backlog tablosunda yoktu — bu taramada bulundu.
- ✅ **KAPANDI — C6** *(`oksis-api` @ `27b2352`, 2026-08-11)*: bulgu uygulama sırasında **çalıştırılarak da doğrulandı** (RED: kapı yokken duyuru sessizce zamanlanıyordu). Kullanıcı kararı K2: **zamanlamayı reddet** — `Announcements.Schedule.RequiresApproval` → 400, *"Onay gerektiren duyuru zamanlanamaz; önce onaya gönderin."* Moderasyon kontrolü zamanlama kolunun içine taşındı; sıra değişmedi (hedefler orada henüz kaydedilmemiş olmalı).
- ⚠️ **Ürün sonucu:** eşikli modda öğretmen artık velilere duyuru **zamanlayamıyor**, önce onaya göndermeli. K2'nin bilinçli daralması; akış tasarımında bilinmeli.

### TB-24 · "Acil duyuru" seed'de e-posta kanalıyla işaretli ama hiçbir kod okumuyor 🟠
`NotificationEventTypeSeedData` iki duyuru olayı tohumluyor: `ANNOUNCEMENT` (`email: false`) ve `ANNOUNCEMENT_URGENT` (`email: true`). Her okul kurulurken `SeedDefaultNotificationRulesHandler` bunlardan tenant satırları (`NotificationRuleConfig`) üretiyor — yani **"acil duyuru e-postaya da gider" kararı veritabanında zaten yazılı**. Aynı şey sessiz saatte de geçerli: `NotificationConfig.QuietHoursEnabled/Start/End` kalıcı ve ayarlar ekranından düzenlenebiliyor, hiçbir teslim yolu okumuyor.
- **Eksik halka:** `AnnouncementPublished` bildirimini bu iki olay türünden hangisine eşleyeceğini söyleyen **hiç kod yok** — `ANNOUNCEMENT_URGENT` sabitinin seed dışında tüketicisi sıfır.
- **Etkisi:** bugün acil yalnız başlık ön ekidir. K-2 (push/e-posta) kanalları bağlandığı gün acil = **kanal tırmanması** + sessiz saatin doğal istisnası olur. `NotificationKind` docblock'u niyeti açıkça yazıyor: *"ileride bir teslim kanalı eklenirse bu handler değişmeden bağlanabilir."*
- 🔗 **`TB-22`'nin ağırlığını belirleyen madde.** Yetkisiz yazılmış her acil bayrağı, o gün yetkisiz bir kanal tırmanmasına dönüşür — yani `TB-22` **D fazının ön koşuludur**, ayrı bir temizlik işi değil.

### TB-25 · Şablon acil işaretinin sunucu kapısı yok 🟡
`CreateAnnouncementTemplateCommandHandler` ve `UpdateAnnouncementTemplateCommandHandler` `request.Urgent`'ı **koşulsuz** kabul ediyor; öğretmene acil anahtarını gizleyen yalnızca istemci. Bir öğretmen uca doğrudan istek atıp acil şablon yazabilir.
- **Tırmanma bugün duruyor:** "Bu şablonla oluştur" bayrağı forma tohumlar, duyuru kapısı 403 ile keser. Ama depoda sahibi öğretmen olan acil şablonlar birikebilir ve kullanıcı hiç kuramayacağı bir şablonla karşılaşır.
- ✅ **KAPANDI — C6** *(`oksis-api` @ `8acdaec`, 2026-08-11)*: her iki şablon handler'ına `announcements.approve` kapısı — `Announcements.Template.Urgent.Forbidden` → 403. Cümle duyuru kapısıyla **aynı** (ortak `AnnouncementPublisherAuthority.UrgentForbiddenMessage` sabiti; testler kasıtlı olarak literali kullanmaya devam eder, aksi hâlde mutasyon yakalanmazdı). Güncelleme kolu da kapılı — aksi hâlde acil olmayan şablon oluşturup hemen acile çevirmek kapıyı delerdi.

### TB-26 · Onay kuyruğu acil rozetini göstermiyor 🟡
`oksis-ui` → `apps/web/features/announcements/approval-queue-tab.tsx` içinde `urgent` kelimesi **0 kez** geçiyor. Onaylayan yönetici, acil işaretli bir duyuruyu onayladığını ekranda göremiyor.
- **Neden `TB-22`'yi ağırlaştırıyor:** *"yönetim onayladıysa acili de onaylamıştır"* savunması bu yüzden tutmuyor — müdür gördüğünü onaylamıyor. `TB-22` yetkisiz durumu kapatsa bile **yetkili** acil duyuruda rozet hâlâ eksik. **`oksis-ui` maddesi.**
- 🔶 **AÇIK KALDI (C6 sonrası):** C6 backend'i kapattı; rozet hâlâ yok. Spec §17'de `C6-2` olarak izleniyor.

> **C6 kapanış özeti** *(2026-08-11, `oksis-api` @ `5a3bf23`, 12 commit)*: `TB-22`, `TB-23`, `TB-25` **kapandı**. `TB-24` (D fazı ön koşulu) ve `TB-26` (`oksis-ui` rozeti) **açık**. Dilimin tam backlog'u spec §17 "C6'da ölçülerek eklenen backlog" (10 madde). Doğrulama: 3402 test / 0 düşen, build 0 uyarı, şema değişmedi.
>
> **C6'nın ürettiği, adlandırılmamış ürün sahnesi** *(kararın lafzıyla tutarlı, kusur değil)*: `Reject()` kaydı `PendingApproval`'dan **`Draft`**'a döndürür ve sahibi öğretmendir — taslak mahremiyeti sonrası **reddedilen duyuru yöneticinin hiçbir yüzeyinde görünmez** (ne envanter, ne `Draft` sayacı, ne onay kuyruğu). Pilotta *"reddettiğim duyuru nereye gitti"* sorusu gelebilir. Spec §17 `C6-6`. Karar gerektiriyorsa karar panosuna taşınmalı.

---

> **Üçüncü parti — Görevlendirme v1'in kazınabilirliği** *(2026-08-10, `oksis-api` @ `2270867` + `oksis-ui` @ `59f8010`)*
> Tetikleyici: "Şube Ders Görevlendirmesi ekrandan kaldırılmıştı, backend'i kalmış, kazıyalım" talebi. Tarama sonucu talebi **çürüttü** — aşağıdaki ölçüm, silme işlemine girişilmeden önce yapıldı ve iş durduruldu. `X-03`'ün "hangisi kanonik" sorusu bu partide cevaplandı.


### TB-49 · Ders programının müfredat saat sağlayıcısı hâlâ stub, oysa müfredat kaynağı geldi 🟠

Ders programında haftalık saatin **iki ayrı kaynağı** olması tasarlanmış:
- **Norm** — müfredatın (kademe, ders) için söylediği zorunlu saat: `CurriculumHourTemplate` + `SchoolWeeklyHourOverride`.
- **Dağıtım** — okulun o şubede o öğretmene fiilen verdiği saat: `TeachingAssignment.WeeklyHours`.

İkisinin karşılaştırılması **INV-3** (eksik/fazla saat uyarısı) olarak tanımlanmış ve arkasına `IWeeklyHourRequirementProvider` portu açılmış. Ama `DependencyInjection.cs:440` hâlâ `StubWeeklyHourRequirementProvider` bağlıyor — **boş liste dönen** bir stub. Yani INV-3 bugün no-op.

- **Stub'ın gerekçesi bayatlamış:** docblock *"müfredat haftalık-saat kaynağı (Subjects curriculum hours) henüz yok"* diyor. Var: `CurriculumHourTemplate` seed'i, okul override'ı, yazma komutu (`SetSubjectWeeklyHours`), kendi izni ve **gerçek çözücüsü** (`IRequiredHoursResolver` → `RequiredHoursResolver`, aynı dosyada satır 106'da kayıtlı). Bağlanmamış olan tek şey portun kendisi. `TB-47` ile aynı aile.
- **Etkisi:** Ders programının güvendiği tek saat rakamı, görevlendirme ekranında **elle yazılan** `WeeklyHours`. MEB çizelgesine karşı hiçbir denetim yok — 6 saatlik matematiğe 4 saat görevlendirme yazılırsa program eksik örülür ve kimse uyarmaz.
- 🔗 **`TB-48`'in 2. yolunu doğrudan ilgilendiriyor:** "saati görevlendirmeden kaldıralım, müfredattan türetelim" tartışması ancak bu port gerçek çözücüye bağlandıktan sonra veriyle yapılabilir.

### TB-50 · Yerleşimin öğretmenini değiştirmek dersi "yerleşmemiş"e döndürüyor 🟠

Yerleşmiş saat **(ders, öğretmen) çiftine göre** sayılıyor — `GetUnplacedLessonsQueryHandler:44` ve `PublishReadiness:23` aynı ifadeyi kullanıyor:
`program.ActivePlacements.Count(p => p.SubjectId == line.SubjectId && p.TeacherId == line.TeacherId)`

Oysa `AssignTeacherCommand` (uç: `PUT /timetable/programs/{id}/placements/{pid}/teacher`; `oksis-ui` → `features/schedule/editor-page.tsx:328` "öğretmeni değiştir") yalnız **yerleşimi** güncelliyor, `teaching_assignments` satırına dokunmuyor.

- **Sonuç:** 9-A matematiğinin bir saatini Ahmet'ten Mehmet'e çevirdiğinde o hücre artık Ahmet'in görevlendirme satırıyla eşleşmiyor. Yan panelde *"Matematik · Ahmet Kaya · kalan 1"* geri beliriyor, yayın kontrolünde **"eksik ders saati"** uyarısı çıkıyor — oysa slot dolu.
- Mehmet'in yerleşimi hiçbir görevlendirme satırıyla eşleşmediği için **hiç sayılmıyor**: ne panelde görünüyor ne kapsama hesabına giriyor.
- Aynı desen `AutoGenClassResolver` ve `GetAutoGenClasses` için de geçerli.
- ⬜ **Doğrulama notu:** eşleşme ifadesinden okundu, çalıştırılarak doğrulanmadı.
- 🔗 **`TB-48`'in 2. yolu lehine kanıt:** bugünkü model programın öğretmen değişikliğini kabul ediyor ama görevlendirmeyle senkron tutmuyor. İki yazma yüzeyi var, tek doğru kaynak yok.

### TB-51 · Mapster yapılandırması süreç-genelinde tek mutable statik — paralel testlerde yarış 🟡

`src/Oksis.Application/DependencyInjection.cs` Mapster'ı `TypeAdapterConfig.GlobalSettings` üzerinden kuruyor ve `Scan(assembly)` ile `IRegister` implementasyonlarını topluyor. Bu, süreç ömrü boyunca yaşayan **tek bir mutable statik** demek; `GetDynamicMapFunction` üzerinde paralel yük altında bir yarış yapısal olarak mümkün.

- **Nasıl bulundu:** C6 dilimi sırasında bir Schools/Mapster testi tam takım koşusunda düştü, izole koşuda ve değişiklikler stash'liyken 8/8 geçti; değişikliklerle art arda üç koşu yeşil kaldı. Yani **flaky**, C6'nın ürünü değil.
- **Neden C6'ya yüklenmedi:** C6'nın eklediği tipler `IRegister` uygulamıyor, Mapster'ın map derlemesine hiç girmiyor; Schools tiplerine dokunamaz.
- **Etkisi:** CI'da tekrarlanamayan kırmızılar. Bir sonraki koşuda (2026-08-11 tam doğrulama, 3402 test) **tekrarlamadı** — yani düşük frekanslı.
- ⬜ **Doğrulanacak:** yarışın gerçekten `GlobalSettings` mutasyonundan mı yoksa test paralelliğinden mi doğduğu; çözüm adayı tenant/test başına yalıtılmış `TypeAdapterConfig`.
- **Kaynak:** C6 dilimi inceleme turu, `oksis-api` @ `c39391b` (2026-08-10).
- ➕ **İkinci bir yük-kaynaklı kırmızı ölçüldü** *(ekran testi turu, 2026-08-11)*: Tam takım koşusunda (3402 test) `ClamAvScannerIntegrationTests` → *"ClamAV sunucusuna ulaşılamadı (localhost:3310)"* ile düştü. Konteyner ayakta ve sağlıklıydı; makine o sırada **load ~40** altındaydı. **İzole koşuda 4/4 geçti.** Yani `TB-51` tekil bir Mapster meselesi değil, daha geniş bir desenin bir örneği: *tam takım koşusu makineyi doyurunca zaman aşımına dayanan entegrasyon testleri tekrarlanamayan kırmızılar üretiyor.* CI'da bu, gerçek regresyonla gürültüyü ayırt etmeyi zorlaştırır.
- ⬜ **Eklenen doğrulama:** dış servise (ClamAV, MSSQL testcontainer) bağlanan testlerin zaman aşımı sınırları yük altında yeterli mi; yoksa takım koşu paralelliği sınırlanmalı mı?

### TB-52 · İstemci "bu duyurunun raporunu görebilir miyim" sorusunu sunucuya soramıyor ⚪
- **Nereden çıktı:** `B-01` kapanışı. Sunucu kapısı `IsManager || PublisherId == caller`; istemci ise oturumda **`personId` taşımadığı için** (`sessionSchema` yalnız `userId` = hesap kimliği) ikinci koşulu hesaplayamıyor.
- **Bugünkü sonucu:** öğretmen derin bağlantıyla başkasının duyurusunu açarsa "GÖNDERİM RAPORU" bölümü çizilir, uç 403 döner, bölüm boş kalır. **Veri sızmaz** — yalnız boş bir bölüm görünür.
- **Kesin çözüm:** `AnnouncementDto`'ya `canViewDeliveryReport` alanı; aynı guard metodundan hesaplanırsa drift edemez. `B-01`'de yapılmadı çünkü `AnnouncementMapper.ToDto` **12 çağrı yerinden** besleniyor ve bunların 4'ü çağıran kimliğinin elde olmadığı komut handler'ları — düzeltmenin boyutu, düzelttiği şeyle (boş bir başlık) oransız.
- ➕ **Aynı ölçümde çıkan ikinci tutarsızlık:** aynı uç 403'ü **iki farklı hata koduyla** dönüyor — `ogrenci`/`veli` için `"Forbidden"`, `ogretmen` için `"Error.Forbidden"`. İki ayrı ret yolu (yetki pipeline'ı vs. handler kapısı) aynı sözleşme alanını farklı dolduruyor; istemci koda göre dallanmak isterse yanılır. Bkz. [[B-01-be-403-olcumu.txt]].

---

## Netleştirme Bekleyenler ❓

Bu maddeler şu haliyle iş kalemine dönüşemiyor. **Sol sütun eksik olan bilgi, sağ sütun senin cevap alanın.**
Cevabı yazdığında **Durum**'u `✅ Netleşti` yap ve aşağıdaki panoyu güncelle.

**Netleşen: 4 / 4**

| ID | Konu | Durum | Tarih |
|:--|:--|:--|:--|
| **B-02** | Nöbet/Vekalet ↔ Yoklama ilişkisi | ✅ Netleşti → **kapatıldı** (kavram karışıklığı) | 2026-08-11 |
| **B-12** | Muafiyet eklemede 401 | ✅ Netleşti → **kapandı** (kök neden `X-07`) | 2026-08-11 |
| **B-06** | Bildirimlerde sezon filtresi | ✅ Netleşti → **yalnız aktif sezon**; iki ayak da kapandı | 2026-08-12 |
| **B-14** | Otomatik program oluşturucunun hedefi | ✅ Netleşti → **blok yerleştirme**, hedef değişikliği | 2026-08-11 |

---

### B-02 · Nöbet/Vekalet ↔ Yoklama ilişkisi

--- start-multi-column: B-02
```column-settings
number of columns: 2
largest column: standard
border: off
```

### 📄 Eksik bilgi

Bulgu şu haliyle aksiyona dönüşmüyor: *"iki modül arasında ilişkisel sorun var"* — hangi senaryoda, hangi ekranda?

**Somutlaşması gereken sorular** — *üçü de koddan cevaplandı (2026-08-10), kalan tek soru en alttaki*
- ~~Vekalet edilen derste yoklamayı **kim** açabiliyor?~~ → **Vekil.** Oturum üretilirken efektif öğretmen vekile çevriliyor.
- ~~Yoklama **kimin üzerine** yazılıyor?~~ → **Vekilin.** Vekillik yalnız rozet.
- ~~Nöbetçi öğretmen yoklama listesinde görünüyor mu?~~ → **Hayır.** Nöbet yoklamayı hiç etkilemiyor; yalnız ders programı vekâleti etkiliyor.
- **Hâlâ açık:** Hata mı veriyordu, yanlış veri mi gösteriyordu? Kod beklendiği gibi çalışıyor görünüyor — gözlenen davranış buna rağmen yanlışsa somut senaryo gerekiyor.

**Olası açıklama:** Nöbet ile vekâletin ayrı kavramlar olduğu beklenmiyordu. Nöbetçi öğretmenin yoklamaya erişmesi bekleniyorsa bu bir **eksik özellik**, bulgu değil.

**Öncelik:** 🟠 Yüksek · **Katman:** Belirsiz

--- column-break ---

### ✍️ Netleştirme Alanı

**Durum:** ⬜ Bekliyor
**Tarih:**

**Yeniden üretme adımları**
> 1.
> 2.
> 3.

**Beklenen davranış**
>

**Gözlenen davranış**
>

**Aksiyona dönüştü mü?**
- [ ] Evet → yeni bulgu ID:
- [ ] Hayır → sorun değil, kapatıldı

--- end-multi-column

---

### B-12 · Muafiyet eklemede 401 Unauthorized

--- start-multi-column: B-12
```column-settings
number of columns: 2
largest column: standard
border: off
```

### 📄 Eksik bilgi

*"Sürekli işaretlendiğinde sorun yok ama sürekli eklendiğinde"* ifadesi iki okumaya açık:
- **(a)** *Sürekli muafiyet tipi* eklenirken mi?
- **(b)** Arka arkaya **defalarca** eklerken mi?

**Gereken**
- 401 dönen **endpoint adı** (network sekmesi)
- Kaçıncı denemede patlıyor?
- Sayfa yenilenince düzeliyor mu? *(düzeliyorsa token yenileme sorunu)*

**Neden önemli:** `B-13` (muafiyetliye nöbet atanıyor) muhtemelen bunun sonucu — muafiyet hiç kaydedilmiyorsa dağıtım onu göremez.

**Öncelik:** 🟠 Yüksek · **Katman:** BE (yetki)

--- column-break ---

### ✍️ Netleştirme Alanı

**Durum:** ⬜ Bekliyor
**Tarih:**

**Hangi okuma doğru?** *(a / b / ikisi de)*
>

**401 dönen endpoint**
> `POST /api/...`

**Kaçıncı denemede patlıyor**
>

**Sayfa yenileyince düzeliyor mu?**
- [ ] Evet → token yenileme sorunu
- [ ] Hayır → permission eksikliği

**B-13 ile aynı kök neden mi?**
- [ ] Evet
- [ ] Hayır → ayrı incele

--- end-multi-column

---

### B-06 · Bildirimler ekranında sezon filtresi

--- start-multi-column: B-06
```column-settings
number of columns: 2
largest column: standard
border: off
```

### 📄 Eksik bilgi

Duyurular ekranında sezon filtresi olmadığı **doğrulandı**. Bildirimler ekranı için aynı kontrol **henüz yapılmadı**.

**Kontrol edilecek**
- Bildirimler ekranında sezon filtresi var mı?
- Yoksa, aynı iş kapsamına mı alınsın?
- Geçmiş sezon bildirimleri hiç gösterilmeli mi, yoksa sadece aktif sezon mu?

**Öncelik:** 🟡 Orta · **Katman:** BE + FE

--- column-break ---

### ✍️ Netleştirme Alanı

**Durum:** ⬜ Bekliyor
**Tarih:**

**Bildirimlerde sezon filtresi var mı?**
- [ ] Var → sorun yok
- [ ] Yok → aynı işe dahil

**Varsayılan davranış ne olmalı?**
- [ ] Sadece aktif sezon
- [ ] Tüm sezonlar, filtre ile daralt

**Notlar**
>

--- end-multi-column

---

### B-14 · Otomatik program oluşturucunun hedefi

--- start-multi-column: B-14
```column-settings
number of columns: 2
largest column: standard
border: off
```

### 📄 Eksik bilgi

Kod taraması gösterdi ki *"dersler sağa doğru yayılıyor"* bir hata değil, **algoritmanın hedefi**: üç slot stratejisinin ikisi güne yayacak şekilde sıralıyor ve puanlayıcı tek güne yığılmayı en kötü denge sayıyor.

Bu yüzden bulgu şu haliyle bir düzeltme işine dönüşemez — önce hangi davranışın istendiği netleşmeli.

**Ayrılması gereken iki soru**
- Beklenti **dağılımın kendisi** mi? Yani bir dersin haftalık saatleri aynı güne mi toplanmalı? *(Bu hedef değişikliğidir ve pedagojik olarak tartışılmalı — 6 saat matematik aynı gün.)*
- Yoksa beklenti **ızgaranın doldurulma/görünme sırası** mı? *(Bu tamamen farklı ve muhtemelen çok daha küçük bir iş.)*

**Faydalı olurdu**
- Beklenen çıktının bir ekran görüntüsü veya elle çizilmiş örneği
- "Kullanılamaz halde" derken hangi kuralın ihlal edildiği *(aynı ders üst üste mi geliyor, boşluk mu kalıyor, öğretmen mi çakışıyor?)*

**Öncelik:** 🟠 Yüksek · **Katman:** BE (hedef/ağırlık)

--- column-break ---

### ✍️ Netleştirme Alanı

**Durum:** ⬜ Bekliyor
**Tarih:**

**Hangi soru doğru?**
- [ ] Dağılım hedefi değişmeli
- [ ] Yalnız ızgara doldurma/çizim sırası
- [ ] İkisi de değil → başka bir şey:
>

**Beklenen dağılım** *(bir dersin 4 saati nasıl yerleşmeli?)*
> 

**Gözlenen çıktıda asıl rahatsız eden**
>

**Karara dönüştü mü?**
- [ ] Evet → hedef değişikliği, karar panosuna taşı
- [ ] Hayır → mevcut davranış doğru, bulgu kapatıldı

--- end-multi-column

---

## Bağımlılık Zincirleri

Sıralamayı bunlar belirlemeli:

```
B-05 (branş atanamıyor)
  └─> B-09 (branşsız uyarısı)
  └─> B-14 (program üretimi)
  └─> B-07 (sezon devrinde görevlendirme aktarımı)

B-12 (muafiyet kaydedilemiyor / 401)
  └─> B-13 (muafiyetliye nöbet atanıyor)   ← algoritma temize çıktı, tek yol bu

B-04 + B-07 (sezon akışı)
  └─> V-01 (çizelgenin sezona bağlanması)

B-04a + B-09  →  ortak iş: BE mesajlarının notify hattı

── kod taramasından eklenenler ──────────────────────

X-03 (görevlendirme v1/v2 ikiliği)   ← ÖNCE KARAR
  └─> B-07 (sezon devrinde aktarım)  hangi kopyalama komutu çağrılıyor?

B-05 (branş ekranı yok)                            ✅ kapandı 2026-08-11
  └─> TB-20 (içe aktarma da branşı çözmüyor)       ✅ kapandı 2026-08-12
        └─> B-09, B-14, B-07                        zincir açıldı

B-20 (içe aktarmada davet üretilmiyor)
  └─> TB-55 (iki ayrı içe aktarma yolu)   ← ÖNCE KARAR: hangisi kalacak?

TB-19 (geçici muafiyet uygulanmıyor)   ← B-13'ten ayrı, bağımsız açık

── duyurular / acil kavşağı ─────────────────────────

TB-24 (acil = e-posta kanalı, seed'de yazılı ama tüketicisi yok)
  └─> TB-22 (acil kapısı yalnız oluşturmada)   ← K-02 push AÇILMADAN ÖNCE kapanmalı
        ├─> TB-25 (şablon kapısı yok)          ← aynı izin ekseni, bir adım geride
        └─> TB-26 (onay kuyruğunda rozet yok)  ← yetkili acilde de eksik

TB-23 (zamanlanmış duyuru onay kuyruğunu atlıyor)   ← TB-22 ile AYNI erken dönüş kolunda

── ders programı ────────────────────────────────────

X-05 (Branch = hem şube hem branş)     ← isim düzeltmesi; ders programı ve
  └─> yanlış join riski                   görevlendirme sorgularının tamamı maruz

B-14 (üretici ekseni)   ← ÖNCE NETLEŞTİR: hedef mi, çizim sırası mı?
  └─> netleşmeden algoritmaya dokunma; mevcut davranış bilinçli

TB-28 (istatistik tazeliği)   ← doğrulanmalı; bayatsa "çakışma yok" yalanı üretir

── yoklama & devamsızlık ────────────────────────────

B-02 (nöbet/vekâlet ↔ yoklama)   ← ÜÇ SORU DA CEVAPLANDI
  └─> kalan: gözlenen davranış neydi? kavram karışıklığı olabilir

TB-31 (eşik bildiriminde fail-open)   ← karar: kesintide bildirim gitsin mi?
TB-30 (etkinlik devri ↔ tur öğretmeni)  ← iki yerde tutulan aynı bilgi ayrışıyor

── okul ayarları ────────────────────────────────────

TB-35 (eşik iki ekranda, biri ölü)   ← ÖNCE KARAR; hangisi kalacak?
  └─> devamsızlık uyarısının hiç tetiklenmemesi buradan gelebilir

TB-36 (iki zaman dilimi alanı)  ← saat kayması sessizdir; hangisi yetkili?
TB-34 (ölü SchoolHoliday)       ← temizlik; yanlış sınıfa bakma riski

── öğrenci kayıt ────────────────────────────────────

TB-37 (şube üç yerde, biri bayat)   ← mekanizma zaten var, kayıt dışarıda bırakılmış
  └─> B-08 (öğrenci sayısı "-")      aynı ailedeki sayaç/projeksiyon sorunu olabilir

TB-38 (iki belge akışı)   ← karar: öğrenci belgesi saklı dosyaya taşınsın mı?
  └─> önce KATEGORİ + saklama süresi kararı gerekiyor (KVKK)
TB-39 (kademe sayı, FK değil)  ← sıralama değişirse yanlış öğrenci mezun olur

── dosya yönetimi ───────────────────────────────────

TB-40 (önizleme sahipsiz kalıyor)  ← kotayı sessizce yiyor
TB-41 (kota sayacı atomik değil)   ← kabul edilmiş ama sınırı yazılı değil
TB-42 (kategori var, tüketici yok) ← karar: defterden çıkar mı, işaretlensin mi?

── bildirimler ──────────────────────────────────────

TB-43 (ayarlar teslimatı etkilemiyor)   ← ÖNCE KARAR: ayar mı bağlanacak, ekran mı sadeleşecek?
  └─> TB-44 (üç katalog, biri ölü)         hangi katalog kanonik olacak buna bağlı

acil duyuru zinciri — üçü birden gerekli:
  TB-22 (kapı yok) + TB-43 (kanal yok) + TB-45 (öncelik yok)
  └─> üçü tamamlanmadan "acil duyuru" işareti kozmetik kalır

── müfredat / notlandırma ───────────────────────────

TB-46 (ağırlık iki yerde, tüketici yok)  ← KARAR not modülünden ÖNCE verilmeli
  └─> yoksa ilk not hesabında iki rakip tanım çakışır
```

---

## Rol Bazlı Çapraz İndeks

| Rol | Etkilenen bulgular |
|---|---|
| Okul Müdürü / Yönetici | B-04, B-04a, B-07, B-11, B-12, B-13, B-14, B-15, B-08, B-03, B-05, B-09, V-01, D-02, D-05 |
| Öğretmen | B-01, B-13, D-07, B-02 |
| Öğrenci | B-01 |
| Veli | B-01, D-04 |
| Tüm roller (kabuk) | D-01, D-06, B-06 |

---

## İzlenebilirlik

| Yeni ID | Kaynak |
|---|---|
| B-01 … B-14 | `Bulgular.md` → ana liste 1–14 (numaralar birebir korundu) |
| B-04a | `Bulgular.md` → 4.1 alt maddesi |
| D-01 … D-07 | `Bulgular.md` → "Tasarımsal Bulgular" 1–7 |
| V-01 | `Bulgular.md` → "Validasyonlar" 8 |
| X-03, X-04 · TB-07 … TB-21 | Kod taraması — `oksis-api` @ `2270867` (2026-08-10). Taranan alanlar: Kullanıcılar & Profiller, Sınıflar & Şubeler, Görevlendirmeler, Nöbetler |
| TB-22 … TB-26 | Kod taraması — `oksis-api` @ `2270867` + `oksis-ui` @ `59f8010` (2026-08-10). Taranan alan: Duyurular — acil işareti (`Urgent`) ve yayın kavşağı. Ayrıntılı gerekçe spec §17'de; plan: `oksis/docs/superpowers/plans/2026-08-10-duyurular-c6-acil-yetki-ve-yayin-kapilari.md` |
| X-05 · TB-27 … TB-29 | Kod taraması — `oksis-api` @ `2270867` (2026-08-10). Taranan alan: Ders Programı (`Timetable`). `B-14` bu partide yeniden çerçevelendi ve netleştirmeye taşındı |
| TB-30 … TB-33 | Kod taraması — `oksis-api` @ `2270867` (2026-08-10). Taranan alan: Yoklama & Devamsızlık + Etkinlikler (`Attendance`). `B-02`'nin üç sorusu da bu partide cevaplandı |
| TB-34 … TB-36 | Kod taraması — `oksis-api` @ `2270867` (2026-08-10). Taranan alan: Okul & Okul Ayarları (`Schools`) |
| TB-37 … TB-39 | Kod taraması — `oksis-api` @ `2270867` (2026-08-10). Taranan alan: Öğrenci Kayıt (`Students`) |
| TB-40 … TB-42 | Kod taraması — `oksis-api` @ `2270867` (2026-08-10). Taranan alan: Dosya Yönetimi (`Documents`) |
| TB-43 … TB-45 | Kod taraması — `oksis-api` @ `2270867` (2026-08-10). Taranan alan: Bildirimler (`Notifications`) |
| TB-46 … TB-47 | Kod taraması — `oksis-api` @ `2270867` (2026-08-10). Taranan alan: Müfredat (`Academics`). **Son modül** — kodda karşılığı olan tüm modüller tarandı |
| B-15 · X-06 | Çalışma zamanı hata kaydı — `oksis-api` @ `4852544` (2026-08-10 21:32, CorrelationId `fbe06603d7d44724bea4f90575e08faf`). Kullanıcının çalışan API'sinden alınan tam yığın izi + kod doğrulaması. Hatalı kod ucun ilk commit'inden beri yerinde (`231f3e8`, 2026-06-13) |
| TB-48 … TB-50 | Hedefli tarama — `oksis-api` @ `2270867` + `oksis-ui` @ `59f8010` (2026-08-10). Kapsam: Görevlendirme v1 (`teaching_assignments`) kazınabilir mi? **Cevap: hayır.** `X-03`'ün kanoniklik sorusu bu partide cevaplandı. `TB-49` "saat gerçekten gerekli mi" tartışması sırasında çıktı. Tarama `oksis-api` içinde ayrı bir worktree'de yapıldı, kod değiştirilmedi |

*Kod taraması notlarının kendisi ayrı bir vault'ta duruyor: `~/Repositories/oksis/docs/domain/` (domain haritası). Buradan wikilink verilmiyor — iki ayrı vault.*

**Not:** `TB-##` ve `X-##` sayaçları [[OKSİS - Yapısal Kararlar ve Eksikler]] dosyasıyla ortaktır — orada `TB-01…TB-06` ve `X-01…X-02` kullanılmış, ilk kod taraması partisi `TB-07` ve `X-03`'ten, duyurular partisi `TB-22`'den, ders programı partisi `TB-27` ve `X-05`'ten, yoklama partisi `TB-30`'dan, okul ayarları partisi `TB-34`'ten, öğrenci kayıt partisi `TB-37`'den, dosya yönetimi partisi `TB-40`'tan, bildirimler partisi `TB-43`'ten, müfredat partisi `TB-46`'dan, görevlendirme kazıma taraması `TB-48`'den devam etti, çalışma zamanı hata kaydı partisi `B-15` ve `X-06`'yı aldı, C6 dilimi kapanışı `TB-51`'i aldı, ekran testi turu `B-16`, `TB-52`, `B-17`, `X-08` ve `ENG-02`'yi aldı, `B-04` kapanış turu `X-09`'u, `B-10` taraması `TB-53`'ü, `B-16` turu `TB-54`'ü, `B-17` turu `X-10`'u, `X-09` kapanışı `X-11`'i aldı, **uçtan uca ekran testi turu (2026-08-16)** `B-21`…`B-32`,
`D-09`…`D-14`, `V-02`·`V-03`, `X-12`·`X-13`, `E-11`…`E-15` ve `TB-56`'yı aldı.
`E-##` sayacı da ortaktır: `E-01`…`E-10` Yapısal Kararlar dosyasında kullanılmıştı.
**Sıradaki boş ID: `TB-57`, `X-14`, `B-33`, `D-15`, `V-04`, `E-16`, `ENG-03`.**

**Engel dosyaları** (`Engeller/`): bir bulguyu kapatmaya çalışırken çıkan ve kendisi ayrı bir iş olan tıkanmalar buraya ayrı belge olarak yazılır; ana maddeden `[[wikilink]]` ile adreslenir.
- [[ENG-01 - Farkli okula giris 500 veriyor]] → `B-16`

**Karara dönüşmesi gerekenler** *(bu dosyada değil, karar panosunda yaşamalı)*: `X-03` + `TB-48` (görevlendirme v1/v2 — kanoniklik cevaplandı, **onarım yönü kararı açık**), vekil uygunluğunun öğretmen müsaitlik kayıtlarına kasıtlı olarak bakmaması *(gerekçe koddan çıkmıyor)*, `B-14` netleştikten sonra çıkabilecek hedef değişikliği.

---

## 12. Uçtan Uca Ekran Testi — Kurulumdan Mezuniyete (2026-08-16) 🔴

> **Kaynak:** Uçtan uca ekran testi, 2026-08-16 · `oksis-api` @ `7667084` · `oksis-ui` @ `2325383`
> **Kapsam:** 8 faz — sıfırdan okul kurulumu → kadro/davet → sezon açılışı → sezon içi operasyon →
> mobil (4 rol, Android cihaz) → sezon kapanışı/devir/mezuniyet → çapraz kesen kontroller.
> **Yöntem:** Web Playwright ile, mobil `adb` ile sürüldü; **her iddia ayrıca API ucundan ve/veya
> doğrudan veritabanından ölçüldü.** "Ekranda öyle görünüyor" tek başına kanıt sayılmadı.
> **Test okulu:** `s4` = **OKSİS Test Lisesi** — `DevDataSeeder`'a eklenen 4. dev okulu.
> Kadro ve yürürlükteki sezon seed'lenir, **yapı (kademe/şube/zil/görevlendirme) seed'lenmez**
> (`BareSchools`); böylece kurulum ekranları gerçekten boş bir okulda ölçülebildi.
> **Not:** Bulunan hatalar bu turda **düzeltilmedi** (kullanıcı kararı) — yalnız ölçülüp kaydedildi.

**Bu partide açılan ID'ler:** `B-21`…`B-31` · `D-09`…`D-14` · `V-02`·`V-03` · `X-12`·`X-13` ·
`E-11`…`E-15` · `TB-56`

### Turun tek cümlelik özeti
Yaşam döngüsünün **iki ucu kırık**: okul kadrosunu kuramıyorsunuz (hiçbir e-posta gönderilmiyor),
sezonu devrettikten sonra öğrenciler öğrenci ekranlarından kayboluyor. Arada kalan akışların
çoğu (sezon sihirbazı, ders programı üretimi, nöbet dağıtımı, duyuru yayını, yetki kapıları)
**çalışıyor**.

---

### E-11 · Hiçbir e-posta gönderilmiyor — davet akışı uçtan uca ölü 🔴
- **Belirti:** `/users` → "Kullanıcı Oluştur" modalı *"Yeni hesap için davet e-postası gönderilir"*
  diyor; işlem başarılı görünüyor. Davet edilen kişi hiçbir zaman hesabına ulaşamıyor.
- **Katman:** BE · **Öncelik:** 🔴 Kritik
- **Ölçüm zinciri:**
  1. `POST /api/v1/users` → **201**.
  2. `GET /api/v1/users/invitations` → kayıt var, `"status":"Created"`, **`"sentAt": null`**.
  3. Mailpit (`localhost:8025`, SMTP 1025 — `appsettings.Development.json`'da tanımlı, konteyner
     ayakta) → **`total: 0`**. Tek bir e-posta yok.
  4. `grep -rn UserInvitedEvent src tests` → olay `Invitation.cs:226`'da **yayınlanıyor**,
     **hiçbir handler yok** (yalnız tanım + iki birim testi). Plain token hiçbir yere akmıyor.
  5. Token DB'de yalnız SHA-256 hash olarak duruyor (`Invitation.TokenHash`) →
     gönderilmemiş bir davetin linki **geri getirilemez**. Davet kalıcı olarak ulaşılamaz.
- **İkinci ayak — şifre sıfırlama da göndermiyor:** `POST /auth/account/forgot-password` → 202,
  ama `Infrastructure/Identity/PasswordResetEmailSender.cs` içindeki `PasswordResetEmailJob.SendAsync`
  gövdesi yalnız `logger.LogInformation(...)` + **`_ = rawToken;`** — token bilerek çöpe atılıyor.
- **Üçüncü ayak:** `IEmailSender` / `SmtpEmailSender` **hiçbir yerden çağrılmıyor**
  (`grep -rn IEmailSender src tests` → yalnız arayüz, implementasyon, DI kaydı).
  SMTP altyapısı hazır, hiçbir şeye bağlanmamış.
- **Etkisi:** Yeni okulda kadro kurulamaz; şifresini unutan kimse geri dönemez.
  Bu tur **Faz 2'yi (kadro/davet) bloklayan tek madde**.
- **İlgili:** `B-24` (SMS ayağı) · `B-20` (içe aktarmada davet bayrağı ölü — aynı boşluğun
  başka bir yüzü, 2026-08-12'de açılmıştı).

### E-12 · Sezon kapanış yaşam döngüsünün 7 ucu hiçbir ekranda yok 🔴
- **Belirti:** Müdür ekrandan kayıt yenileme dönemi açamıyor, veliden yenileme niyeti toplayamıyor,
  dönemi elle kapatamıyor, görevlendirmeleri yeni sezona kopyalayamıyor.
- **Katman:** FE · **Öncelik:** 🔴 Kritik (kullanıcının istediği "kapanış" akışının çoğu yok)
- **Ölçüm:** `packages/api/src` içinde (üretilmiş `schema.ts` **hariç**) elle yazılmış istemci sayısı:

| Uç | İstemci | Ekran |
|---|---|---|
| `academic-sessions/{id}/open-renewal-period` | **0** | yok |
| `enrollments/renewal-candidates` | **0** | yok |
| `enrollments:set-intent` | **0** | yok |
| `enrollments:renew` | **0** | yok |
| `academic-sessions/{id}/promote-students` | **0** | yok |
| `academic-sessions/{id}/copy-assignments` | **0** | yok |
| `academic-sessions/{sessionId}/terms/{termId}/close` | **0** | yok |
| `academic-sessions/{id}/activate-rollover` | 1 | ✓ "Aktifleştir" |

- **Sezon ekranı bunu şöyle açıklıyor:** *"Dönem Geçişi — takvime göre otomatik ilerler,
  geçişte manuel işlem gerekmez."* Doğru değil: kayıt yenileme takvimle ilerleyen bir şey değil.
- **Zincir:** `E-12` → `B-30`'un kök nedeni (yenileme dönemi açılamadığı için devir "legacy"
  yolda çalışıyor ve `StudentEnrollment` yazılmıyor).

### B-30 · Devir sonrası öğrenciler şubelerde var, "Öğrenciler" ekranında yok 🔴
- **Belirti:** Sezon aktifleştirildikten hemen sonra `/sections` **46 öğrenci** gösteriyor,
  `/students` **0 öğrenci** diyor. Aynı okul, aynı sezon, aynı an.
- **Katman:** BE + FE · **Öncelik:** 🔴 Kritik
- **Ölçüm (s1, 2025-2026 → 2026-2027):**
  - `/sections`: "8 şube · **46 öğrenci**" (10.sınıf 16 · 11.sınıf 16 · 12.sınıf 14 · 9.sınıf 0)
  - `/students` ve `GET /api/v1/students`: **`totalCount: 0`**
  - DB: yeni sezonda `class_room_students` → **46 aktif**; `student_enrollments` → **0 satır**
- **Kök neden:** `PromoteStudentsCommandHandler` özeti: *"Dönem KAPALI ise (`RenewalPeriodOpenedAt`
  null) legacy davranış aynen korunur: tüm roster terfi eder, **StudentEnrollment'a dokunulmaz**"*.
  Enrollment aynası yalnız **kayıt yenileme dönemi açıkken** yazılıyor; o dönemi açacak ekran yok
  (`E-12`) → varsayılan yol **her zaman** legacy yol.
- **İkinci ayak (aynı kök, devirden bağımsız):** `s4`'te 60 öğrenci profili + hesabı var
  (`/users` onları "Öğrenci · 202640050" diye listeliyor) ama `student_enrollments` boş olduğu için
  `/students` "0 Toplam" diyor ve şube "Öğrenci Ata" modalı "Dağıtım bekleyen öğrenci yok" diyor.
  Kayıtsız öğrenci profili için ekranlarda ortak bir dil yok.
- **Tip notu:** Asıl teknik borç `ClassRoomStudent` ↔ `StudentEnrollment` **çift doğruluk kaynağı**.

### B-31 · "Mezun Et" ekranı yanlış uca bağlı — öğrenci yarı mezun kalıyor 🔴
- **Belirti:** `/students` satır menüsü → "Mezun Et" → onaylandı; öğrenci listede **hâlâ "Aktif"**.
- **Katman:** FE · **Öncelik:** 🔴 Kritik (mezuniyet resmî kayıt)
- **Ölçüm (Jale Ay, 12-A, `b5388322…`):**
  - `identity.persons.lifecycle_state` → **Graduated** ✓
  - `academic.student_enrollments.status` → **Active**, `grade_level` 12, şube ataması duruyor ✗
  - `GET /api/v1/students` → `"status":"Active"`, `"className":"12-A"` ✗
  - Devir önizlemesi onu hâlâ **mezun adayı** sayıyor ✗
- **Kök neden:** `packages/api/src/students/endpoints.ts:111` → `graduateStudent()`
  **`POST /api/v1/users/persons/{id}/graduate`** çağırıyor (Users modülü, yalnız kişi yaşam döngüsü).
  Öğrenci tarafının kendi komutu **`POST /api/v1/students/{id}:graduate`**
  (`GraduateStudentCommand` · `StudentGraduatedEvent` · `GraduatedStudentReenrollmentException`)
  **hiç çağrılmıyor**.
- **Doğru uç ölçüldü (Nazlı Doğan, `a9f4b335…`):** `POST /students/{id}:graduate` → **204**;
  sonrasında enrollment **Graduated**, kişi **Graduated**, `/students`'ta **"Graduated"**,
  aktif öğrenci 60 → 59 ✓. **Sunucu tarafı çalışıyor; ekran yanlış komutu çağırıyor.**

### B-21 · Ayarlar'da iki bölüm birden kaydedilince biri sessizce kayboluyor 🔴
- **Belirti:** `/settings` → Genel Bilgiler'de hem Kurum Kimliği hem Adres değiştirilip
  **Kaydet** → ekran başarılı gibi kapanıyor, alanlardan biri kaydedilmiyor.
- **Katman:** FE · **Öncelik:** 🔴 Kritik (sessiz veri kaybı)
- **Ölçüm (iki kez yeniden üretildi):**
  - 1. deneme: `PUT /school-settings/basic-info` → **500**, `PUT /school-settings/address` → 204
  - 2. deneme: `basic-info` → 204, `address` → **500** (yazdığım adres kayboldu)
  - Sunucu: `DbUpdateConcurrencyException: expected to affect 1 row(s), but actually affected 0`
    (`UpdateSchoolBasicInfoCommandHandler.cs:54`)
- **Kök neden:** Tek "Kaydet" iki ayrı uca **paralel** PUT atıyor; iki komut da aynı
  `school.school_settings` satırını yükleyip güncelliyor → `row_version` yarışı → kaybeden 500 alıyor.
- **Uçlar sağlam:** Aynı gövdeler tek tek gönderilince s1/s2/s3/s4'te **hepsi 204**.
  Sorun uçta değil, ekranın kaydetme stratejisinde.
- **İkinci yarısı `X-13`:** 500 ekranda **hiç görünmüyor**.
- **Kanıt:** ![[e2e-02-ayarlar-kaydet-500-sessiz.png]]

### B-22 · Kullanıcılar ekranında "Roller" sütunu hep boş, rol süzgeci hiçbir şey bulmuyor 🔴
- **Belirti:** `/users` (127 hesap) → ROLLER sütunu **her satırda "—"**; "Rol: Öğretmen"
  süzgeci **"Sonuç bulunamadı"** diyor — oysa okulda 15 öğretmen var.
- **Katman:** FE · **Öncelik:** 🔴 Kritik (rol bazlı kullanıcı yönetimi çalışmıyor)
- **Ölçüm:** `GET /api/v1/users` → `"roleNames":["Öğrenci"]`, `["Öğretmen"]` — uç rolleri
  **Türkçe ad** olarak dönüyor.
- **Kök neden:** `packages/core/src/users/constants.ts:26` →
  `BACKEND_ROLE_NAME_TO_KEY = { SchoolAdmin, Accountant, Secretary, Teacher, Parent, Student }`
  yani **İngilizce PascalCase** anahtar bekliyor. `packages/api/src/users/endpoints.ts:39`
  `mapRoles()` eşleşmeyenleri `.filter(Boolean)` ile **sessizce atıyor** → boş dizi.
- **Aynı desen komşuda:** `mapStatus()` bilinmeyen durumu `?? "active"` ile **aktif** sayıyor.
  Sözleşme uyuşmazlığı hata üretmiyor, veriyi yutuyor.
- **Kanıt:** ![[e2e-04-kullanicilar-rol-suzgeci-bos.png]]

### B-23 · Kayıt tarihi sabit `2026-07-11` olarak veritabanına yazılıyor 🟠
- **Belirti:** Yeni öğrenci kaydında "Kayıt Tarihi" alanına dokunulmasa bile özet ve kayıt
  **11 Tem 2026** diyor (test günü **16 Ağustos 2026**).
- **Katman:** FE · **Öncelik:** 🟠 Yüksek (resmî veri bozulması)
- **Ölçüm:** Kayıt sonrası `GET /api/v1/students` → `"enrollmentDate":"2026-07-11"` — kalıcı.
- **Kök neden:** `features/students/enroll/enroll-wizard.tsx:28` → `enrollmentDate: "2026-07-11"`
  (form başlangıç değeri sabit).

### B-24 · Kayıt başarı ekranı "SMS ile davet gönderildi" diyor — SMS diye bir şey yok 🔴
- **Belirti:** Öğrenci kaydı tamamlanınca ekran "Aktif · **Davetli**" rozeti ve
  **"SMS ile davet gönderildi"** yazıyor. (Kanal seçilmemişti.)
- **Katman:** FE + BE · **Öncelik:** 🔴 Kritik
- **Ölçüm:** `ISmsSender` arayüzü var, **implementasyonu yok**, DI'a kayıtlı değil
  (`grep -rn ISmsSender` → arayüz + iki yorum satırı). E-posta da gitmiyor (`E-11`).
  WhatsApp için hiçbir kod yok — oysa sihirbaz üç kanalı da sunuyor.
- **Etkisi:** Geçici şifre ekranda **bir kez** gösteriliyor; kapatılınca öğrenci/veli
  sisteme hiç giremiyor, üstelik müdür haber gittiğini sanıyor.

### B-25 · Sezon açıldıktan sonra taslak silinmiyor; ikinci açılış 409 alıyor ve ekran susuyor 🟠
- **Belirti:** Sihirbaz tamamlanıp sezon açıldıktan sonra listede **aynı sezon iki kutuda**:
  "Taslak Sezonlar → 2026-2027 TASLAK · Taslağa Devam Et" **ve**
  "Hazır Sezon → 2026-2027 HAZIR · Aktifleştir".
- **Katman:** BE + FE · **Öncelik:** 🟠 Yüksek
- **Ölçüm:** `POST open-from-draft` → 201; sonrasında `GET /season-drafts/current` → taslak
  **hâlâ duruyor** (`currentStep: 6`). "Taslağa Devam Et" → "Sezonu Aç" →
  `POST open-from-draft` → **409 Conflict**, ekranda **hiçbir mesaj yok**
  (`[role=status]`/`[role=alert]`/toast sayısı **0**).
- **Sistematik:** `s4` ve `s1`'de ayrı ayrı tekrarlandı.
- **Kanıt:** ![[e2e-05-sezon-409-sessiz.png]]

### B-26 · İki görevlendirme kaynağı canlı — ders programı ekranda görünmeyen görevlendirmelerden üretiliyor 🔴
- **Belirti:** Müdür Görevlendirmeler ekranında 15 kayıt görüyor; otomatik üretilen ders programı
  bambaşka derslerden oluşuyor.
- **Katman:** BE · **Öncelik:** 🔴 Kritik
- **Ölçüm (aynı okul, aynı sezon, aynı an):**
  - v2 → `GET /api/v1/assignments/summary` → `totalActive: **15**`, `outOfField: 4`, `unassigned: 0`
  - v1 → `GET /api/v1/teaching-assignments/summary` → `totalAssignments: **60**`,
    `mismatchedAssignments: **36**`, `missingClasses: 2`
  - `/teacher-assignments` ekranı **v2**'yi okuyor; otomatik program **v1**'i okuyor:
    `GetAutoGenClassesQueryHandler.cs:41` → `db.TeachingAssignments`
- **Görünür sonucu:** Bir **lise** 10. sınıfına **Türkçe, Fen Bilimleri, Sosyal Bilgiler**
  yerleşti — bunların hiçbiri Görevlendirmeler ekranındaki 15 kayıtta yok. Ders↔kademe
  uygunluğu üretimde denetlenmiyor.
- **Bağlantı:** `X-03` + `TB-48`'in (görevlendirme v1/v2) **ölçülmüş kullanıcı etkisi**.
  Göç kararı artık "temizlik" değil, yanlış program üretiyor.

### B-27 · Mobil oturum kalıcı değil — "Beni hatırla" işaretliyken bile her açılışta çıkış 🔴
- **Belirti:** Telefonda giriş yapıldı, uygulama kapatılıp açıldı → **giriş ekranı**
  (yalnız e-posta hatırlanmış). İki kez yeniden üretildi.
- **Katman:** FE (mobil) · **Öncelik:** 🔴 Kritik
- **Ölçüm:**
  1. Sözleşme (`AuthController.cs:34-36`): *"Web (varsayılan): refresh token httpOnly `oksis_rt`
     cookie'sinde · **Mobile (`X-Client-Type: mobile`)**: refresh token gövdede döner"*;
     `AuthController.cs:88-92` → başlık yoksa cookie'ye yazılır ve gövdeden **temizlenir**.
  2. `grep -rn "X-Client-Type" packages apps` → **hiçbir eşleşme yok**. Mobil istemci bu başlığı
     **hiç göndermiyor**.
  3. Ölçülen login yanıtı: `"refreshToken":""`.
  4. `apps/mobile/src/lib/auth-bridge.ts` refresh token'ı SecureStore'a yazmaya hazır
     (`KEY_REFRESH`) — **yazacak token gelmiyor**.
- **İkinci sonucu:** 15 dakikalık access token dolunca yenileme yapılamıyor; mobil oturum
  ortada ölüyor. (Web'de aynı süre dolduğunda uçlar 401 döndü, ekran hiçbir uyarı vermeden
  bayat veri göstermeye devam etti — sayfa yenilenince cookie'den toparladı. Bkz. `X-13`.)

### B-28 · Öğretmen "Canlı Yoklama" ekranını açabiliyor; 403 hatası "bağlantı kurulamadı" diye gösteriliyor 🟠
- **Belirti (mobil):** Öğretmen oturumunda Canlı Yoklama →
  *"Pano yüklenemedi · Canlı bağlantı kurulamadı. Lütfen tekrar deneyin."* + "Tekrar Dene".
- **Katman:** FE (mobil) + yetki yüzeyi · **Öncelik:** 🟠 Yüksek
- **Ölçüm (sunucu günlüğü, aynı saniye):** `GET /attendance/unrecorded` → **403** ·
  `GET /attendance/board` → **403** · `Authorization denied attendance.manage …
  ListUnrecordedSessionsQuery` → `ForbiddenException`.
- **İki ayrı sorun:** (1) yönetici ekranı öğretmene açık; (2) **yetki hatası ağ hatası gibi**
  sunuluyor ve asla başarılı olamayacak bir "Tekrar Dene" öneriliyor.
- **Karşılaştırma:** Web aynı durumu doğru yapıyor — öğretmenle `/settings` açıldığında
  *"Yetkiniz yok · Öğretmen rolü /settings sayfasını görüntüleyemez…"* + "Panele dön".
  Yani doğru desen üründe zaten var. `X-09`'un kapsamadığı yol.

### B-29 · Modüller ekranı hiçbir okulda çalışmıyor — modül envanteri hiç oluşturulmuyor 🟡
- **Belirti:** `/settings` → Modüller → *"Modül bulunamadı — Bu okul için tanımlı OKSİS modülü yok"*,
  "PLAN DURUMU 0 / 0 modül aktif". Mobilde de aynı.
- **Katman:** BE + FE · **Öncelik:** 🟡 Orta
- **Ölçüm:** `GET /school-settings` → `moduleConfigs: []` **dört okulda da**.
  DB: `school.school_module_configs` = **0 satır**, `master.plan_modules` = **15 satır**.
- **Kök neden:** Ekran yalnız mevcut config satırlarını listeliyor; okul açılırken plan
  modüllerinden satır üretilmiyor. `UpdateModuleConfigCommandHandler` satır **oluşturabiliyor**
  (`_db.ModuleConfigs.Add`) ama ekranda tetikleyecek yüzey yok.
- **Yan etki:** Ekran "Nerede kullanılır: Kenar çubuğu menüsü, Roller ve İzinler matrisi" diyor;
  oysa menü modül konfigüne bağlı değil — 0 aktif modülle bile tüm menü görünüyor.
- **İlgili:** `E-15`.

### X-12 · Yer tutucu veri gerçek veri gibi sunuluyor (web + mobil, 5 ayrı yüzey) 🔴
- **Ne:** Ürünün birden çok ekranı tasarımdan gelen sabit değerleri **canlı veri gibi** gösteriyor;
  hiçbirinde "örnek veri" işareti yok. Tek tek ekran yaması değil, **tek bir kural** gerekiyor:
  *bağlanmamış widget ya görünmez ya da açıkça "örnek" etiketlidir.*
- **Öncelik:** 🔴 Kritik (kullanıcı yanlış bilgiye göre karar veriyor)
- **Ölçülen yüzeyler:**

| Yüzey | Gösterdiği | Gerçek | Kaynak |
|---|---|---|---|
| Web gösterge paneli | "336 Öğrenci · 12 şube · Ortaokul + Lise", "41 Öğretmen", "66 gün" | Yeni açılan `s4`'te 0 şube, 60 kişi; aynı sayılar **her okulda aynı** | `features/dashboard/dashboard-static.ts` |
| Mobil anasayfa (4 rol) | "Bugün **2 kritik**, 7 uyarı", "%92 yoklama", "34 devamsız", öğrenciye "78.4 ortalama", veliye olmayan iki çocuk | Test günü **Pazar**; s2'de bugün tek yoklama oturumu yok | `apps/mobile/src/features/home/fixtures/home-fixtures.ts` |
| Kenar çubuğu | okul adı yoksa **"Atlas Koleji"**, ilçe yoksa **"Kadıköy"** | `school-settings` → `districtName: null` | `components/app-shell.tsx:124,137` |
| Öğrenci kayıt sihirbazı | başlık **"2025-2026 · Atlas Koleji"** | Okul "OKSİS Test Lisesi"; sezon adı da sabit | `enroll-wizard.tsx:99` · `enroll-labels.ts:46` |
| Öğrenciler KPI | "Bu Ay Yeni Kayıt · **Temmuz 2026**" | Bugün 16 Ağustos 2026 | `features/students/parts.tsx:26` |

- **Aynı uygulamada çelişki (mobil, aynı oturum):**

| Rol | Anasayfa (sabit) | Gerçek ekran |
|---|---|---|
| Öğretmen | "Yoklama bekliyor · 9-A · **Bugün 16:00**" | Yoklama sekmesi: **"Bugün dersiniz yok"** |
| Öğrenci | "Dönem ortalaman **78.4**", "Devamsızlık **3 gün**" | Notlarım: **"Bu ekran henüz boş"** · Devamsızlığım: **0/10** |
| Veli | Çocuklar: "Faruk · 11-A", "Zeynep · **6-B**" | Gerçek çocuk **"Tolga Özdemir"** (üstelik okul bir **lise**) |

- **Doğru desen üründe zaten var:** Duyuru oluşturma ekranı *"Push bildirim — yakında —
  bu sürümde gönderilmiyor"*, SMS kotası kartı *"Geçici veri"* diyor. Kural bu kartlardan
  çıkarılıp panellere uygulanabilir.

### X-13 · Yazma işlemi hata alıyor, ekran hiçbir şey söylemiyor 🔴
- **Ne:** Sunucu isteği reddediyor, kullanıcı bunu **hiçbir biçimde** öğrenmiyor; işlem
  başarılıymış gibi devam ediyor. `X-01` (Türkçe validasyon mesajları) ve `X-09` (mobilde
  gerekçe gösterimi) bu ailenin daha dar ayaklarıydı; bu tur **üç yeni yol** ölçüldü:

| Yer | Sunucu | Ekranda görünen |
|---|---|---|
| Ayarlar → Kaydet (`B-21`) | **500** `DbUpdateConcurrencyException` | hiçbir şey — kaydedildi sanılıyor, veri kayboluyor |
| Sezon → "Sezonu Aç" ikinci kez (`B-25`) | **409** Conflict | hiçbir şey — buton çalışmıyor, sebep yok |
| Mobil canlı yoklama (`B-28`) | **403** Forbidden | *"Canlı bağlantı kurulamadı, tekrar deneyin"* (yanlış sebep) |
| Web oturum süresi dolunca (`B-27` yan ayak) | **401** × 5 uç | hiçbir şey — bayat veri gösterilmeye devam |

- **Önerilen çözüm yönü:** ekran ekran yama değil; yazma mutasyonları için **ortak bir hata
  yüzeyi** (toast/inline) + "sessiz başarısızlık" durumunu imkânsız kılan bir sözleşme.


### E-14 · Devirde sınıf rehber öğretmenleri taşınmıyor 🟡
- **Ölçüm:** s1 devri sonrası `/sections` → 8 şubenin **tamamı "Rehbersiz"**.
- Sihirbazın 5. adımındaki "Öğretmen görevlendirmelerini kopyala" seçeneği homeroom atamasını
  kapsamıyor; `copy-assignments` ucunun da ekranı yok (`E-12`).

### E-15 · Yeni okulda modül envanteri üretilmiyor 🟡
- `master.plan_modules` (15 satır) okul açılışında `school_module_configs`'a hiç yansımıyor.
  `SchoolCreatedEvent` 6 adımlık `OnboardingStatus` üretiyor ama modül config üretmiyor.
- **İlgili:** `B-29` (ekran ayağı).

### B-32 · Sezon aktifleştirmede ölü buton + onaysız yıkıcı işlem 🟠
- **Ölçüm:** `/academic-sessions` sayfasında **iki** "Aktifleştir" butonu var. Birincisine
  tıklamak **hiçbir ağ isteği üretmiyor**, hiçbir geri bildirim yok. İkincisi çalışıyor.
- **Ayrıca:** Çalışan buton **onay istemeden** sezonu değiştirdi — 59 öğrenciyi taşıyan,
  eski sezonu arşive alan, geri dönüşsüz bir işlem. (Duyuru yayınlama bile "101 kişiye
  gönderilecek" onayı istiyor.)

### V-02 · TC Kimlik No alanı "Geçerli" diyor ama yalnız mükerrerliğe bakıyor ⚪
- Kayıt sihirbazı Adım 2'de **11111111111** girildiğinde altında yeşil
  **"Geçerli — mükerrer kayıt yok"** çıkıyor. Bu numara TC algoritmasına göre **geçersiz**.
  Ekran yalnız `students/check-national-id` ile mükerrerlik soruyor.

### V-03 · Kayıt sihirbazı okulun açık olmayan kademelerini listeliyor ⚪
- Adım 3 "Kademe / Seviye" listesi **Ana Sınıfı + 1–12. Sınıf** tamamını gösteriyor; oysa
  `s4`'te yalnız **Lise (9–12)** açık. Lise için "2. Sınıf" seçilebiliyor; ekran ancak şube
  adımında dolaylı engelliyor.
- **Doğru uygulama aynı üründe var:** "Toplu Şube Aç" sihirbazı yalnız okulun açık kademelerini
  listeliyor.

### D-09 · Boş formlar açılır açılmaz kırmızı validasyon gösteriyor ⚪
- `/settings` → Genel Bilgiler yeni okulda "Görünen ad zorunludur" ile açılıyor;
  Derslikler → "Yeni Derslik" modalı açılır açılmaz "Derslik adı zorunludur", "Kod zorunludur".
- Doğrusu: alan dokunulduktan (touched/blur) sonra ya da gönderim denemesinde göstermek.
  Form bileşeni seviyesinde tek çözüm.

### D-10 · "Hiç kayıt yok" ile "filtreyle eşleşme yok" ayrışmamış ⚪
- Derslik envanteri bomboşken *"Derslik bulunamadı — **Arama veya filtre ölçütleriyle eşleşen
  kayıt yok**"* diyor; oysa arama da filtre de uygulanmamıştı.
- **Doğru örnek aynı üründe:** kayıt sihirbazı şube adımı *"Bu seviyede aktif sezonda tanımlı
  şube yok. Şubeler, Sınıflar & Şubeler ekranından açılır."* diyor.

### D-11 · Devir haritasında hedef sütunu şube harfini gösteriyor, hedef sınıfı değil ⚪
- Sezon sihirbazı Adım 3: "KAYNAK ŞUBE **9-A** · MEVCUT 1 öğr. · **HEDEF: A** · İŞLEM Terfi".
  Hedef "10-A" olmalı. (12. sınıflarda "Mezun" yazması doğru.)

### D-12 · "Okulun tüm şubeleri" seçilince uygun olmayan şubeler sessizce atlanıyor ⚪
- `/schedule` → Otomatik Oluştur → Kapsam **"Tümü"** → 6 taslak üretildi (10-A…12-B).
  `GET /class-rooms?sessionId=…` → **8 aktif şube** (9-A, 9-B de var).
- `autogen-drawer.tsx:59`: *"Yalnız görevlendirmesi hazır sınıflar listelenir"*. Tek sınıf /
  kademe kapsamında boş liste için yönlendirme var; **"Tümü" kapsamında eleme sessiz**.

### D-13 · Parametresiz açılan bazı mobil rotalar bomboş ekran veriyor ⚪
- `/attendance/roster` ve `/attendance/event-count` derin bağlantıyla açıldığında ekranda
  **tek bir metin bile yok** (uiautomator dökümü boş) — ne hata, ne yönlendirme.

### D-14 · İl adları Başlık Biçimi, ilçe adları TAMAMEN BÜYÜK ⚪
- `/settings` → İl "İstanbul"/"Ankara" · İlçe "KADIKÖY"/"ÇANKAYA"/"ADALAR".
  Kaynak veri (`locations/districts`) büyük harf döndürüyor; okul adresi ekranlarda böyle çıkıyor.

### TB-56 · `dev:device:android` betiği cihaz hem USB hem Wi-Fi bağlıyken çöküyor
- `npm run dev:device:android` → `▸ Cihaz hazır: 205f65af0409` … sonra
  **`adb: more than one device/emulator`** → exit 1.
- Betik cihazı doğru tespit ediyor ama sonraki `adb reverse` çağrılarını **`-s <seri>` olmadan**
  yapıyor. Kablosuz hata ayıklama açıkken tek cihazlı varsayım bozuluyor.
- **Geçici çözüm:** `ANDROID_SERIAL=<seri> npm run dev:device:android` (bu turda böyle koşuldu).

---

### Bu turda ✅ doğrulanan kapanışlar (regresyon)
- **`B-16` / `ENG-01` kapalı:** Açık `s4` oturumu varken hem uçtan (`Bearer` başlıklı login)
  hem tarayıcıdan `mudur.s2` girişi başarılı; eski **500** yeniden üretilemedi.
- **`B-13` yeniden üretilemedi:** s2'de tek muafiyet Rabia Acar (sürekli, "sağlık").
  "Adil Otomatik Dağıt" → 30 atama üretildi; muaf öğretmen **nöbetçi 0, yancı 0**;
  "Uygula" sonrası çizelgede de yok.
- **`B-04` akışı çalışıyor:** 6 adımlı sezon sihirbazı `s4` ve `s1`'de uçtan uca tamamlandı.
- **`TB-35` temiz:** Bildirim Ayarları'nda devamsızlık eşiği alanı yok; eşikler yalnız
  Akademik Politikalar'da.
- **`X-04` ekranda görünür:** Görevlendirmeler alan-dışı atamayı gerekçesiyle işaretliyor.
- **Tenant izolasyonu sağlam:** `s4` müdürüyle `s1`'in öğrencisi / sezonu / şubesi → **3'ünde de 404**.
- **Yetki matrisi tutarlı:** öğretmen `users`/`school-settings` → 403, `students` → 200;
  öğrenci ve veli yönetim uçlarının hepsinde 403.
- **Web → mobil uçtan uca:** Web'de yayınlanan duyuru mobilde öğrenci hesabında içeriği,
  yayıncısı ve zaman damgasıyla doğru göründü.

### Bu turda ölçülen ve doğru çalışan akışlar
- Sezon sihirbazı: dönem tarihleri **+1 yıl** doğru kaydı, terfi haritası doğru
  (9→10, 10→11, 11→12, 12→**Mezuniyet**), resmî tatiller taşındı, sezon **taslak** açıldı.
- Devir aktifleştirmesi: yeni sezon Active+current, eski sezon **otomatik Archived**,
  `class_room_students` → **Graduation 13 / Transfer 46**, yeni şubelerde `source_class_room_id`
  doğru (10–12 dolu, 9 NULL), `promote-students` idempotent.
- Ders programı otomatik üretimi: 6 şube için **0 çakışmalı** taslak, kalite ölçüleriyle
  (tercih uyumu %95–100). Blok ders ve müsaitlik kısıtları uygulanıyor.
- Nöbet: öneri → önizleme → uygula akışı, adalet dengesi (2–3), yancı eşleştirmesi.
- Akademik politikalar: `INV-POL-1` (ağırlık toplamı 100) ve `INV-POL-2` (eşik sıralaması)
  hem ekranda hem uçta, Türkçe ve invariant kodlu.
- Duyuru yayını: hedef kitle sayacı (101 kişi), onay iletişimi, denetim izi, sezon süzgeci.
- Zil çizelgesi otomatik üretici ("üzerine yazılacak" uyarısıyla), gün atamaları.
- Yetki reddi ekranı (web): rol adıyla Türkçe açıklama + çıkış yolu.

---

## 13. Düzeltme Turu — Ekran Testi Bulguları (2026-08-16) 🔧

> **Kapsam:** §12'de kaydedilen maddelerin düzeltilmesi. Kullanıcı kararı: önce
> veriyi bozanlar, sonra merkezî yüzeyler, sonra kilit açanlar.
> **Yöntem:** Her düzeltmeden sonra **bulgunun ölçüldüğü şey yeniden ölçüldü**;
> "kod değişti" tek başına kapanış sayılmadı. Her madde ayrı commit.

### Kapatılanlar

| Madde | Düzeltme | Yeniden ölçüm | Commit |
|---|---|---|---|
| `B-31` 🔴 | Dört yaşam-döngüsü işlemi de öğrenci modülünün uçlarına bağlandı (`:graduate` · `:freeze` · `:resume` · `:withdraw`) | Uçlar tek tek 204; freeze→resume `Active`'e dönüyor, withdraw `Withdrawn` bırakıyor | `oksis-ui` `ff2bdc9` |
| `B-22` 🔴 | `UserListDto`'ya `RoleCodes` eklendi; istemci eşlemesi görünen ad yerine koda bağlandı | ROLLER sütunu dolu; "Rol: Öğretmen" süzgeci **15 kayıt** (bulgudaki gerçek sayı) | `oksis-api` `0292294` · `oksis-ui` `7c28650` |
| `B-23` 🟠 | `todayIsoDate()` / `currentIsoMonth()` core'a eklendi; sabit tarih ve sabit ay kaldırıldı | KPI alt etiketi "Ağustos 2026" | `oksis-ui` `cdf164b` |
| `B-21` 🔴 | Üç bölüm **sırayla** kaydediliyor; ayrıca `DbUpdateConcurrencyException` → **409** | Kurum Kimliği + Adres tek "Kaydet"te birlikte kalıcı; sunucu günlüğünde çakışma yok | `oksis-api` `0474a24` · `oksis-ui` `4ae2df1` |
| `X-13` 🔴 | `MutationCache.onError` ile **sahipsiz** yazma hataları uygulama düzeyindeki toast yüzeyine düşüyor; sahiplenme `onError` ya da `meta.errorHandled` ile tanınıyor | Var olan e-postayla davet → önceden **hiçbir şey**; şimdi `role="alert"` toast | `oksis-ui` `8a71cf6` |
| `E-11` 🔴 | `UserInvitedEvent` dinleyicisi + `InvitationEmailJob` + şifre sıfırlama işi gerçekten gönderiyor; eksik olan `/reset-password` ekranı yazıldı | Mailpit'te davet ve sıfırlama postaları; davet `Sent`+`sentAt`; bağlantı doğru önizlemeyi açıyor; şifre gerçekten değişti (eski 401 / yeni 200) | `oksis-api` `f40927a` · `oksis-ui` `2d06147` |
| `B-24` 🔴 | Kanal listesi gerçekten gönderim yapan tek kanalla sınırlandı; başarı ekranı kaç veliye gittiğini/gidemediğini söylüyor | Seçicide SMS/WhatsApp `disabled` + "yakında"; velisiz kayıtta "Davetli" rozeti ve "gönderildi" satırı çıkmıyor | `oksis-ui` `18a9fac` |
| `B-25` 🟠 | Açılmış taslak artık "devam edilen taslak" sorgusundan dönmüyor (kayıt duruyor, tanım daraldı) | s4'te "Taslak Sezonlar **0**", "Hazır Sezon 1", tek "Aktifleştir" butonu | `oksis-api` `874a176` |
| `E-14` 🟡 | Devirde kaynak şubenin rehber öğretmeni hedef şubeye taşınıyor; ayrılmış öğretmen taşınmıyor | s4'te gerçek devir: 9-A'nın rehberi 10-A'ya geçti; kaynağı olmayan şubeler boş kaldı | `oksis-api` `35a54f7` |
| `B-29`+`E-15` 🟡 | Envanterin otoritesi katalog oldu; okulun satırı yalnız *override*. Plan sayacı da aynı kaynaktan | 6 modül Türkçe adlarıyla listeleniyor, "PLAN DURUMU **6 / 6**" | `oksis-api` `4a28bb6` · `oksis-ui` `f960ca0` |
| `B-26` 🔴 | Üretim v2 yetkinlikleri + müfredattan türetiliyor; ders↔kademe uygunluğu **yapısal** (master ders bağlarıyla kesişim); öğretmen dağıtımı deterministik round-robin | s2, gerçek üretim, 10. kademe: Bilgisayar / Beden Eğitimi / İngilizce / Din Kültürü / Matematik — **hepsi lise dersi**. Türkçe, Fen Bilimleri, Sosyal Bilgiler artık yok. Şube listesi 6 → **8** | `oksis-api` `688efcb` |
| `E-12`+`B-30` 🔴 | Kayıt yenileme ekranı yazıldı (dönemi aç → niyet topla → kayıtları aç), dönem kapatma yüzeyi eklendi, `season.renewal.open` izni okul yöneticisine verildi | s4 uçtan uca: dönem açıldı → öğrenci "Yenileniyor" → 1 kayıt açıldı (DB: `Type=Renewal/Draft`) → devir → **`/students`'ta öğrenci GÖRÜNÜYOR** (Aktif, 10-A). Dönem kapatma: onay → `status=Closed` | `oksis-api` `1d34a54` · `oksis-ui` `5553346`·`af5d78e` |
| `B-27` 🔴 | `X-Client-Type: mobile` her isteğe ekleniyor (login, refresh, 401 sonrası yeniden deneme) | Uçta: başlıksız `refreshToken` **0** karakter, başlıkla **86**. Cihazda: force-stop → yeniden açıldı, **giriş ekranı gelmedi** | `oksis-ui` `2f96ec0` |
| `B-28` 🟠 | Yetki reddi doğru gerekçeyle gösteriliyor (`QueryErrorState`), pano öğretmene kapalı (`ForbiddenState` + rol kapısı) | Cihazda derin bağlantı: *"Bu pano okul yönetimine ait. Öğretmen rolü görüntüleyemez"* + "Anasayfaya dön" | `oksis-ui` `10380f3` |
| `D-13`+`TB-56` ⚪ | Parametresiz rotalar `MissingParamState` gösteriyor (4 rota); `adb` hedefi `ANDROID_SERIAL` ile sabitlendi | Cihazda: *"Ekran açılamadı · … · Geri dön"*. `adb`: serisiz "more than one device", serili exit 0 | `oksis-ui` `0208124` |
| `V-02`+`V-03` ⚪ | TC algoritması (NVİ) core'a eklendi; kademe listesi okulun açık kademelerinden besleniyor | `11111111111` artık geçersiz; kademe seçici yalnız okulun kademelerini listeliyor | `oksis-ui` `eea8e36` |
| `X-12` 🔴 | Okul kimliği bağlam ucunda (her role açık); sabit sezon/okul adı kaldırıldı; kalan yer tutuculara **"örnek veri"** rozeti (karar `K-09`) | Öğretmen kabuğunda kenar çubuğu "Atatürk AL" (önce "Atlas Koleji"); panelde 7 rozet; mobilde tek şerit | `oksis-api` `e115e0b` · `oksis-ui` `ad3eae1` |
| `D-09`·`D-10`·`D-11`·`D-12`·`D-14` ⚪ | Dokunulmamış alanda hata yok; boş liste ↔ filtre ayrımı; hedef sütunu şube adı; kapsam özeti; yer adı biçimi | Alan boşaltıldı → **0 hata**, focusout → 1 hata. İlçeler "Adalar · Arnavutköy · Ataşehir" | `oksis-api` `6c53ffd` · `oksis-ui` `43d4b9f` |

**Kanıt:** ![[fix-b22-rol-suzgeci.png]] · ![[fix-x13-merkezi-hata-yuzeyi.png]] · ![[fix-e11-davet-baglantisi.png]] · ![[fix-b24-davet-kanali.png]] · ![[fix-b25-taslak-tek-kart.png]] · ![[fix-b29-modul-envanteri.png]] · ![[fix-b30-devir-sonrasi-ogrenci.png]] · ![[fix-x12-ornek-veri-rozeti.png]]

### Turun kapanışı

**§12'nin 28 maddesinden 26'sı kapandı.** Kalanlar:

| Madde | Neden açık |
|---|---|
| `E-13` 🟠 | Dini bayram tatil şeması — karar `K-08` ile **ertelendi** (ayrı iş olarak planlanacak) |
| `X-14` 🟠 | Sunucunun çeviri anahtarı göndermesi — istemci artık sızdırmıyor ama **198 anahtarın Türkçeleştirilmesi** sunucu tarafında duruyor |

**Bu turda açılan yeni bulgular:** `X-14` · `TB-57` · `E-16` — üçü de düzeltme
sırasında ölçüldü, üçü de kod değil **veri/kapsam** işi.

**Geri çekilen:** `B-32` (ölçüm hatası).

**Test durumu (2026-08-16 kapanış):** birim testleri üç projede de yeşil
(695 + 1602 + 40); istemci paketlerinde 172 + 298 + 103. Entegrasyon paketinde
`TB-57`'nin 5 kırmızısı **bu turdan önce de** kırmızıydı ve açık duruyor.

### Düzeltme sırasında çıkan yeni bulgular

#### `B-31` ikinci ayağı · "Pasife Al" butonu hiçbir zaman çalışamıyormuş 🔴 *(aynı commit'te kapatıldı)*
- **Ölçüm:** `POST /users/persons/{aktif-öğrenci}/archive` → **400**
  `USERS_LIFECYCLE_INVALID_TRANSITION` — *"'Archive' işlemi 'Active' durumundaki bir kişide geçersiz."*
- Alan modeli net: `Archived`, kayıt yaşam döngüsünde ancak **mezun / ayrılmış / nakil**
  bir kayıttan SONRA gelen saklama adımı. Aktif öğrencinin karşılığı `Withdrawn`.
- İşlem `:withdraw`'a bağlandı, gerekçe zorunlu oldu (backend validator zaten istiyordu),
  onay modali artık sonucu söylüyor ("Kayıt 'Ayrılmış' olur, şube koltuğu boşalır").
- **Not:** Etiket "Pasife Al" olarak kaldı ama ürettiği durum "Ayrılmış". Adlandırma
  kullanıcı onayı bekliyor.

#### `X-14` · Sunucu hata mesajı olarak çeviri anahtarı gönderiyor (198 anahtar) 🟠 *(kapandı — aşağıda)*
- **Nasıl bulundu:** `X-13`'ün merkezî yüzeyi kurulur kurulmaz ilk ölçümde ekrana
  **`identity.errors.email-exists`** çıktı. Hata artık görünüyordu ama okunmuyordu.
- **Katman:** BE · **Öncelik:** 🟠 Yüksek
- **Ölçüm:** `grep -rhoE '"[a-z]+\.(errors|error)\.[a-z0-9-]+"' src` → **198 ayrı anahtar**
  (`attendance.errors.*`, `duties.errors.*`, `students.errors.*`, `timetable.errors.*`,
  `users.errors.*`, `identity.errors.*` …). Sözleşme 400/409/422'de mesajın kullanıcıya
  dönük **Türkçe cümle** olmasını söylüyor; bu modüller oraya anahtar yazıyor.
- **Bu turda yapılan (yarım çözüm, bilinçli):** İstemci artık anahtar biçimini tanıyıp
  ham basmıyor, gerekçesiz-red cümlesine düşüyor — *kod sızmıyor ama gerekçe de kayboluyor.*
- **Kalan iş:** 198 anahtarın Türkçeleştirilmesi. Doğru yeri **sunucu**: ya handler'lar
  cümle yazacak ya da API sınırında tek bir anahtar→cümle sözlüğü olacak.
  Ekran ekran çözülemez.
- **Emsal:** Dosya modülü bunu kendi içinde çözmüş (`files/mutation-error.ts`,
  `fileAwareMutationErrorDesc`) — yani desen biliniyor, yaygınlaştırılmamış.
- **İlgili:** `X-01` (Türkçe validasyon mesajları) · `TB-54` (giriş hata mesajı anahtarı).

##### ✅ KAPANDI — `oksis-api` @ `68023cc`, 2026-08-17

**Kapanışta yapılan tam tarama sayıyı büyüttü: 198 değil 223 anahtar.** Çözüm turun kuralına
uygun oldu — ekran ekran değil, **sözleşmenin kurulduğu yerde**: `src/Oksis.Api/Errors/ErrorMessageCatalog.cs`,
API sınırında tek anahtar→cümle sözlüğü. `Humanize` yalnız iki noktadan çağrılır:
`ExceptionHandlingMiddleware` (NotFound / Forbidden / Conflict / TenantRequired) ve
`ResultExtensions` (`ToHttpResult`). Handler kendi cümlesini yazmışsa ona dokunulmaz.

**Neden handler'lara cümle yazılmadı:** 223 çağrı yerine tek tek cümle yazmak hem çok büyük
hem de kodu makine-okunur olmaktan çıkarırdı. Bulgunun kendi ifadesi de bunu söylüyordu:
*"ya handler'lar cümle yazacak ya da API sınırında tek bir anahtar→cümle sözlüğü olacak;
ekran ekran çözülemez."*

**Sınıf kapatıldı:** `tests/Oksis.Api.UnitTests/Errors/ErrorMessageCatalogTests.cs` — `src`
altındaki **her** anahtar biçimli dizgiyi tarar ve sözlükte karşılığı olmasını şart koşar
(sözlüğün kendi dosyası taramadan hariç; yoksa test kendi kendini doğrulayan boş bir kontrol
olurdu). İkinci test anahtar biçimindeki mesajın **asla ham dönmediğini** çivilliyor: sözlükte
olmayan anahtar bile nötr cümleye düşer, kullanıcı hiçbir yolda `.errors.` görmez.

**Kalıp bir kez sessizce delindi ve `X-05` turunda kapatıldı (`4b49aac`).** Hem `Humanize`
hem kapsam testi anahtarın son parçasını **tek segment** sanıyordu; `school-settings.errors.bell.duplicate-order`
gibi **dört parçalı 13 anahtar** hem sözlüğe girmiyor hem de testi kırmıyordu — yani garanti
yeşil görünürken kullanıcı ham anahtarı görüyordu. Kalıp iki tarafta **birlikte** genişletildi
(`^[a-z][a-z0-9-]*\.(errors|error|warnings)(\.[a-z0-9-]+)+$`) ve iki dosya da "ayrışırlarsa
garanti biter" notunu taşıyor.

**Yeniden ölçüm (2026-08-18):** `src` altında **238 tekil anahtar**, sözlükte **238 giriş** —
kapsam tutuyor. `dotnet test tests/Oksis.Api.UnitTests` → **254/254 yeşil**.

**İstemci ayağı yerinde duruyor (ikinci ağ):** §13'te yapılan yarım çözüm
(`packages/api/src/client/mutation-error.ts` · `isTranslationKey` → `NO_REASON_DESC`)
kaldırılmadı. Sunucu artık anahtar biçimli mesaj üretmediği için bu yol pratikte boşa çalışır,
ama sözlüğün kapsamadığı bir yoldan anahtar sızarsa ekran yine ham basmaz.

⚠️ **Damgalanması gereken yan etki — anahtar artık istemciye HİÇ ulaşmıyor.** Sözlüğün gerekçesi
*"anahtar makine-okunur kalır, kullanıcıya cümle gider"* diyordu; ölçüm bunun **yalnız depo içinde**
doğru olduğunu gösteriyor. `Result.Conflict("duties.errors.substitute-busy")` → `code` =
`Error.Conflict` (jenerik), `message` = artık Türkçe cümle. Yani bu ailede **istemcinin
dallanabileceği tanımlayıcı yanıtta yok**: X-14 öncesi istemci mesajın anahtar olduğunu görüp
dallanabilirdi (`isTranslationKey` tam da bunu yapıyordu), sonrasında bu imkân kapandı.
`USERS_*` gibi gerçek kodu olan modüller etkilenmiyor. Dallanma gerektiren bir ekran çıktığında
doğru çözüm anahtarı **`code` alanına** taşımaktır — bugün böyle bir tüketici yok, bu yüzden
madde açılmadı, not olarak duruyor.

#### `TB-57` · Entegrasyon test paketi `master`'da KIRMIZI (5 test) 🟠 *(kapandı — aşağıda)*
- **Nasıl bulundu:** `E-11` sonrası tam `dotnet test` koşuldu.
- **Ölçüm:** `Oksis.Infrastructure.IntegrationTests` → **5 kırmızı**
  (`SubjectTeacherAssignmentTests` × 4 + `GetAvailableSubstitutes` × 1).
  Değişikliklerim `git stash`'lenip tekrar koşuldu — **aynı 4 test yine kırmızı**,
  yani bu turdan ÖNCE de kırmızıydı.
- **Örnek fark:** `ByCourse_returns_three_value_match` → beklenen `Matched`,
  gelen **`OutOfField`**. Yani branş uyumu testin beklediğinden farklı çalışıyor —
  `X-04` (branş uyumu ad yerine katalog kimliğine bağlandı, `fba5a8e`) turundan
  kalmış olması kuvvetle muhtemel.
- **Neden kimse görmedi:** `.githooks/pre-push` kapısı **build + birim testlerini**
  koşuyor, entegrasyon testlerini koşmuyor (`X-11`'in bilinçli dar kapsamı).
  Kural yazmak korumaz, koşturmak korur — ama koşulmayan test de korumaz.
- **Karar gerektiren:** ya testler güncel davranışa göre düzeltilecek ya da
  davranış hatalı; ikisi de `X-04`'ün kapsamını yeniden açar.

##### ✅ KAPANDI — `oksis-api` @ `4711321`, 2026-08-17

**Kapanışta yapılan tam ölçüm bulguyu büyüttü: 5 değil 11 kırmızı** — ve ikisi ayrı sınıftı.

**1) Gerçek üretim hatası (1 test).** `GetAvailableSubstitutesQueryHandler` öğretmenin
**tenant** branş kimliğini (`school.branches` → `TeacherProfile.BranchId`) doğrudan **katalog**
kimlikleriyle (`master.branches` → `SubjectBranch`) karşılaştırıyordu. İki küme hiçbir zaman
kesişmez; sonuç sessizce daima "alan-dışı" olur. Yani **vekâlet aday sıralamasında branş uyumu
profilden hiç hesaplanmıyordu** — `Same`/`Near` yalnız görevlendirme (ders kategorisi) üzerinden
doğabiliyordu. `X-04` turunda çeviri altı görevlendirme handler'ına eklenmiş, aynı eşleştiriciyi
kullanan vekâlet modülü dışarıda kalmıştı; **iki ay** böyle çalıştı. Düzeltme: handler artık
`AssignmentProjections.LoadCatalogBranchIdsAsync` + `ToCatalogIds` ile çeviriyi yapıyor.

**2) Bayat test fixture'ları (10 test).** Üretim değil, testin kendi kurulumu çürümüştü:
- `SubjectTeacherAssignmentTests` (4) — fixture yalnız tenant branşını kuruyor, katalog zincirini
  (`master.branches` + `subject_branches`) kurmuyordu. `X-04` ile ad karşılaştırması kalkınca
  kurulum sessizce "her öğretmen alan-dışı"ya dönüştü. **Deftere yazılan 4 kırmızı budur.**
- `AutoGenClassResolverTests` (3) + `AutoGenerateScheduleJobTests` (3) — v1 `teaching_assignments`
  satırı seed ediyorlardı; `B-26`/`K-10` ile resolver v2 yetkinlik + müfredat kaynağına geçince
  seed anlamsız kaldı ve testler boş sonuç aldı. **Bunlar `688efcb`'nin regresyonu** ve ilk
  ölçümde hiç sayılmamışlardı — yani defterdeki "5 kırmızı" rakamı eksikti.

**Sınıf kapatıldı:** `tests/Oksis.Tests/Architecture/BranchCatalogTranslationTests.cs` — uyum
çözücüsü (`SubjectBranchMatch.Resolve`, `BranchFitResolver.Resolve`) çağıran her kaynak dosya,
aynı dosyada çeviriyi de (`LoadCatalogBranchIdsAsync` / `LoadTeacherBranchesAsync` / `ToCatalogIds`)
çağırmak zorundadır. Boş yere yeşil değil: çeviri geri alınınca test dosya adını vererek kırmızıya
düştü, geri konunca yeşile döndü.

**Ölçüm (kapanış anı):** entegrasyon paketi **891/891 yeşil** (önce 880/891); birim testleri
Domain 695 · Application 1602 · Api 41 yeşil, build 0 uyarı.

**Yeniden ölçüm (2026-08-18):** `dotnet test tests/Oksis.Infrastructure.IntegrationTests` →
**907/907 yeşil, 0 kırmızı** (2 dk 52 sn). Kapanıştan sonra gelen `X-05` (şube→derslik göçü),
`TB-32`, `TB-65`, `TB-74` commit'leri paketi kırmamış — ama bunu **kanca değil elle koşan biri**
doğruladı; aşağıdaki açık ayak tam olarak bu.

⬜ **Kök neden kapanmadı, belirti kapandı.** "Neden kimse görmedi" ayağı `X-11`'in CI ayağıdır ve
**açık duruyor**: `.githooks/pre-push` bugün de entegrasyon testlerini koşmuyor (bilinçli dar
kapsam — Docker kapalıyken kanca yanlışlıkla kırmızıya düşmesin diye). Mimari test yalnız *branş
çevirisi* sınıfını koruyor; başka bir sınıftan gelecek entegrasyon regresyonu aynı yoldan yine
görülmez.

⚠️ **Mimari testin kendi sınırı:** koruma **dosya granülaritesinde** ve `_matchResolvers` listesi
**elle** tutuluyor. Yeni bir çözücü eklenip listeye yazılmazsa test sessizce kör kalır —
`TB-57`'yi doğuran desenin bir kat yukarıdaki hâli. Testin docblock'u bunu kabul ediyor:
*"Yeni bir çözücü eklenirse buraya yazılır."*

#### `B-32` · ⚠️ **Bulgu geri çekildi — ölçüm hatasıydı**
- **İddia:** *"`/academic-sessions` sayfasında iki 'Aktifleştir' butonu var, birincisi hiçbir
  ağ isteği üretmiyor"* + *"çalışan buton onay istemeden sezonu değiştirdi"*.
- **Yeniden ölçüm (s4, ekranda):** Sayfada **tek** "Aktifleştir" butonu var. Butona basınca
  sayı 1 → 2 oluyor: ikincisi **onay modalının** kendi onay butonu. Test turunda buton sayımı
  modal AÇIKKEN yapılmış; ardından kartın butonuna (perde arkasında kaldığı için etkisiz)
  tıklanmış.
- **Onay modalı VAR ve ayrıntılı:** *"2026-2027 sezonu canlıya alınacak ve sistemin aktif
  sezonu olacak… ŞU AN AKTİF 2025-2026 → Arşive alınır… verileri korunur, salt-okunur
  erişime geçer."*
- **Sonuç:** Düzeltme yapılmadı, yapılmasına gerek yok. Ders çıkarılan yer: **modal açıkken
  sayfa genelinde eleman saymak** güvenilir değil.

#### `B-26` · Karara bağlandı, yeniden yazım bekliyor 🔴
- Düzeltmeye çalışırken bunun bir bağlantı hatası değil **mimari boşluk** olduğu ölçüldü;
  ayrıntı ve karar: [[OKSİS - Yapısal Kararlar ve Eksikler]] `K-10`.
- **Ek ölçüm (bulguyu keskinleştiren):** v1'e yazan tek yol seed ve devir kopyası;
  `AssignSubjectClassCommand` ucu var ama **hiçbir istemci çağırmıyor**. Aktif satır —
  `s1`/`s2`/`s3`: **140**, ama arayüzden kurulan **`s4`: 0**. Yani gerçek bir okulda otomatik
  üretim hiçbir sınıf listeleyemez; dev okullarında çalışıyor görünmesinin tek sebebi seed.
- **Karar:** v2 yetkinlikleri + müfredattan türetme (şube = üretilen sınıf, saat = kademe
  müfredatı), v1 emekli.

#### `E-16` · Lise müfredat saat şablonu master veride yanlış 🟠
- **Nasıl bulundu:** `B-26` yeniden yazımı sırasında; iki master tablo karşılaştırılınca.
- **Ölçüm:**
  - `master.curriculum_hour_templates` → `EducationLevel = High`, 9–12. sınıfların her biri
    **10 ders / 30 saat**. Ama listedeki dersler **ortaokul dersleri**: *Türkçe, Sosyal
    Bilgiler, Fen Bilimleri…*
  - `master.subject_grade_levels` → aynı kademede **doğru lise dersleri**: *Fizik, Kimya,
    Biyoloji, Felsefe, Tarih, Coğrafya…* (Türkçe/Fen Bilimleri **yok**).
  - Kesişim: 9–12 için yalnız **5 ders / 15 saat** (5–8 için 9–10 ders / 27–30 saat — sağlıklı).
- **Etkisi:** `B-26` düzeltmesi yanlış dersin yerleşmesini önlüyor ama lise şubelerine
  haftada yalnız **15 saat** yerleşiyor; kalan saatler "eksik" görünüyor.
- **Yapılması gereken:** `curriculum_hour_templates`'in `High` satırları gerçek lise
  müfredatıyla (Türk Dili ve Edebiyatı, Fizik, Kimya, Biyoloji…) yeniden seed edilmeli.
  Kod tarafında yapılacak bir şey yok — kesişim kuralı zaten koruyor.

#### `E-12` ikinci ayağı · `season.renewal.open` izni hiçbir role verilmemişti 🔴 *(aynı turda kapatıldı)*
- **Nasıl bulundu:** Yenileme ekranı yazılıp ilk kez çağrıldığında müdür hesabı **403** aldı.
- **Ölçüm:** İzin katalogda tanımlı (`PermissionSeedData`: *"Sezonun yenileme dönemini aç
  (Faz 3B; **default-deny**)"*) ama `role_permissions` tablosunda **hiçbir rol** için satırı yok.
  Karşılaştırma: `students.renew` izni `SCHOOL_ADMIN` + `SUPER_ADMIN`'de var.
- **Neden görünmemişti:** Ucu çağıran hiçbir ekran yoktu (`E-12`); çağrılmayan bir ucun
  yetkisiz olduğu da hiç ortaya çıkmıyordu. Eksik ekran, eksik izni gizliyordu.
- **Düzeltme:** İzin `SCHOOL_ADMIN` + `SUPER_ADMIN`'e verildi, mevcut veritabanları için
  migration yazıldı. Ölçüm: izin öncesi **403**, sonrası **204**.

### Ölçüldü ama kapatılamadı
- **`X-13`'ün 401 ayağı:** "oturum dolunca ekran bayat veri göstermeye devam ediyor"
  yeniden üretilemedi. `auth-refresh.ts` yolu doğru görünüyor (refresh başarısızsa
  `auth.clear()` + `onUnauthorized()` → `/login`). Bu ayak `B-27` ile birlikte
  mobil oturum turunda tekrar ölçülecek.

---

## 14. Açık Bulgu Turu — 38 madde kapatıldı (2026-08-17) ✅

> **Ne bu bölüm:** [[OKSİS - Bulgu Kayıt Defteri 1]] dosyasındaki 57 açık maddeden
> **karar bekleyen 14'ü hariç** tamamının ele alındığı tur. Kapanan 38 madde buraya
> işlendi ve açık listeden silindi. Turun kuralı: **ekran bazlı yama değil, sınıfın
> kendisini kapatan merkezî çözüm**; ve her yeni test, düzeltme geri alınıp kırmızıya
> düşürülerek kanıtlandı ("boş yere yeşil değil").

**Sayı:** 57 açık → **19 açık** (14 karar bekleyen + 5 ölçülüp açık bırakılan/park edilen).

### 14.1 Ölçüm teşhisi değiştirdi

Turun en önemli çıktısı düzeltmeler değil, **yanlış teşhislerin düzeltilmesi** oldu.
Kayda geçen altı vaka:

| Madde | Deftere yazılan | Ölçümün söylediği |
|---|---|---|
| `TB-21` | "Öğretmen yükü sorgusu yanlış izin ailesiyle korunuyor, hizalanmalı" | **Teşhis tersmiş.** Hizalamak sessiz bir **yetki genişlemesi** olurdu. |
| `TB-18` | "Nöbet politikaları tamamen etkisiz" | Yarısı etkisiz, yarısı çalışıyordu; yalnız **gün deseni** solver'a hiç girmiyordu. |
| `TB-08` | "İki rakip `InvitationStatus` enum'u" | Rakip değil, **ad çakışması** — ayrı bağlamlarda iki farklı kavram. |
| `TB-49` | "Müfredat–görevlendirme denetimi no-op" | `K-10` kararı sorunun **zeminini kaldırdı**; madde daraldı. |
| `TB-14` | "Silinen şubenin geçmiş atamaları sahipsiz kalıyor" | Kayıtlıdan **daha kötü**. İlk ölçüm ise test fixture kusuruydu (`SoftDeleteInterceptor` kayıtlı değildi) — fixture düzeltilip yeniden ölçüldü. |
| `TB-07` | "İki uç aynı veriyi iki kabukla veriyor" | Aynı veri değil, **farklı eksen**: hesap ekseni ⊂ kişi ekseni. |

### 14.2 Sınıfı kapatan merkezî çözümler

Tek tek yama yerine kurulan altı yapı — her biri kendi bulgu sınıfının **tekrarını**
imkânsız kılıyor:

- **`ErrorMessageCatalog`** (`X-14`, `TB-54`) · API sınırında tek anahtar→cümle sözlüğü;
  223 anahtar. Anahtar makine-okunur kalır, kullanıcıya cümle gider. Kapsam testi yeni
  anahtar eklendiğinde kırmızıya düşer.
- **`SubjectUsageInspector`** (`TB-53`) · Ders silmenin "kullanımda" kapısı tek kayıt
  noktasından okunur; mimari test, `SubjectId` taşıyan **her** kalıcı varlığı kapsamla
  karşılaştırır ve istisnaları belgelenmeye zorlar.
- **`BranchCatalogTranslationTests`** (`TB-57`, `X-04`) · Branş uyumu çözen her dosyanın
  katalog kimliğine çevirmiş olmasını şart koşar.
- **`ScheduleStatsFreshnessTests`** (`TB-28`) · Yerleşim değiştiren her handler'ın
  sayaç tazeleyicisine dokunmasını şart koşar.
- **`EfIgnoredPropertyQueryTests`** (`X-06` dar ayağı) · EF-`Ignore` property'nin sorguya
  sızmasını yakalar; genişletilirken bulduğu tek yanlış pozitif (`<see cref>` içinde geçen
  ad) testin kendi yorum-ayıklamasıyla kapatıldı.
- **eslint `no-restricted-syntax` seçicisi** (`X-08`) · Ekranın reddin sebebini
  uydurmasını (*"Sunucuya ulaşılamadı"*) derleme zamanında yasaklar.

### 14.3 Bölüm bölüm kapananlar

**Veri güveni (7):** `TB-37` kayıt aynası defterden türetiliyor · `TB-15` atama sebebi
sezona göre · `TB-14` silinen kaydın geçmişi korunuyor · `TB-53` ders silme kapısı yedi
tüketiciyi de biliyor · `TB-16` nöbet bölgesine kullanımda kapısı · `TB-41` kota sayacı
atomik · `TB-40` yetim önizlemeler imha kapsamında.

**Sessiz yalanlar (7):** `B-20` içe aktarmada davet bayrağı gerçekten davet üretiyor ·
`TB-18` nöbet gün deseni solver'da · `TB-45`/`TB-24`/`TB-44` etkisiz bildirim ayarları
"Hazırlanıyor" etiketli, ölü katalog kalktı · `TB-26` onay kuyruğunda acil rozeti ·
`TB-30` etkinlik turundaki bayat öğretmen kopyası kaldırıldı.

**Sunucu sözleşmesi (4):** `X-14` + `TB-54` hata mesajları API sınırında Türkçeleşiyor ·
`TB-52` aynı ret iki farklı kodla dönmüyor, ekran "rapor yok" yerine "yetkin yok" diyor ·
`X-08` artığı lint kuralıyla kapandı.

**Adlandırma borcu (12):** `X-05` şube/branş ayrımı (aşağıda) · `TB-07` kişi/hesap ekseni
(aşağıda) · `TB-08` ad çakışması netleşti · `TB-11` rıza sürümü tek tipte · `TB-34` ölü
`SchoolHoliday` + çift enum kalktı · `TB-36` ikinci zaman dilimi alanı kalktı · `TB-17`
`AcademicYearId → AcademicSessionId` geçişi tamamlandı · `TB-33` tek/çift "l" tuzağı ·
`TB-39` sınıf seviyesi kimliğe bağlandı · `TB-09`/`TB-12` ölü alanlar kalktı · `TB-21`
izin ailesi (ölçümle gerekçelendirilerek **olduğu gibi bırakıldı**).

**Ders programı (5):** `TB-50` yerleşmiş saat derse göre sayılıyor · `TB-28` sayaç
tazeliği mimari testle · `TB-49` `K-10` ile daraldı · `E-16` lise müfredat şablonu ·
`V-01` nöbet çizelgesi sezona bağlandı.

**Altyapı (3):** `TB-57` vekalet branş uyumu katalog kimliğine · `TB-51` süreç-geneli
statik yapılandırma kilit altında · `TB-32` hatırlatma kuralı sunucuya taşındı.

### 14.4 Üç madde ayrıca kayda değer

#### `X-05` · `Branch` iki şeyi birden anlatıyordu 🟠 *(kapandı)*
- **Kusur:** ders programı zincirinde `BranchId` **şube** ("9-A"), öğretmen/katalog
  tarafında **branş** ("Matematik"). İkisi de `Guid`; yanlış join **derlenir, çalışır ve
  yanlış sonuç döner**.
- **Karışıklık teorik değildi:** `DutyLoadAggregator` ile `GetAvailableSubstitutesQueryHandler`
  aynı modül altında iki anlamı yan yana kullanıyordu.
- **Düzeltme:** ders programı zinciri `ClassRoomId`'ye taşındı (10 kolon/indeks, veri kaybı
  yok); uç adı `timetable/class-rooms/{classRoomId}/weekly` oldu; istemci sözleşmesi
  yeniden üretildi. **Artık `branch_id` kolonu yalnız `master.subject_branches`'ta.**
- **Süpürme sırasında dört yerde branş yanlışlıkla şubeye çevrildi ve geri alındı** —
  belirsizliğin ne kadar gerçek olduğunun kendi kanıtı.
- **Yan bulgu:** `X-14`'ün kapsam kalıbı hata anahtarının son parçasını tek segment
  sanıyordu; `school-settings.errors.bell.duplicate-order` gibi **dört parçalı 13 anahtar**
  hem sözlüğe girmiyor hem de kapsam testini kırmıyordu — kullanıcı ham anahtarı görüyordu.
  Kalıp iki tarafta birlikte genişletildi.

#### `TB-07` · Kişi ekseni ile hesap ekseni 🟠 *(kapandı — kanonik karar)*
- **Ölçüm bulguyu düzeltti:** iki uç aynı tabloları okur ama **ekseni farklıdır.**
  `api/v1/users` = **hesap ekseni** (`Accounts ⋈ Persons` INNER JOIN; girişi olmayan kişi
  **yok**). `api/v1/users/persons` = **kişi ekseni** (hesabı olsun olmasın herkes).
- **Kusurun asıl biçimi:** ayrımı hiçbir şey söylemiyordu; üstelik belge ikisinin "köprü
  döneminde paralel yaşadığını" söylüyordu — okuyan birinin geçici olduğunu sanıyor.
  Yanlış ucu seçen ekran **hata almaz**, hesapsız kişiler sessizce düşer.
- **Karar:** **ikisi de kanoniktir.** "Okulda kim var?" → persons. "Kim giriş yapabiliyor?"
  → users. Karar iki controller'a yazıldı ve `PersonAndAccountAxisTests` ile çivilendi
  (test boş yere yeşil değil: eksen geçici olarak değiştirilince kırmızı).

#### `TB-32` · Kuralı tutan tek yer ekrandı ⚪ *(kapandı)*
- **Kusur:** manuel "Hatırlat" eyleminde sunucu hiçbir şey kontrol etmiyordu. Kuralı bilen
  tek katman (idare paneli butonu) onu **uygulamak zorunda olmayan** katmandı.
- **Eski gerekçe yanlıştı:** belge *"zaten Completed bir oturumu hatırlatmak zararsız,
  sadece anlamsızdır"* diyordu. Zararsız değil — bildirimin gövdesi *"Bu ders için henüz
  yoklama girmediniz."* Yoklamayı **girmiş** öğretmene bu **yanlış bir suçlamadır**, push
  olarak gider ve geri alınamaz.
- **Düzeltme:** kural toplaşana taşındı (`ReminderOutcome`); kardeş yol
  `MarkAutoReminderSent` bu iki guard'ı zaten taşıyordu. Eşzamanlı basış `RowVersion` ile
  kapandı. Reddin **gerekçesi** ayrı ayrı söyleniyor ve ekranda gösteriliyor — eskiden iki
  çağrı yerinde de `onError` yoktu.
- **Eski testler guard'ın YOKLUĞUNU çiviliyordu**; yeni kurala göre yeniden yazıldı.

### 14.5 Ölçüldü ama kapatılmadı — açık kalanlar

- **`X-06` geniş ayağı** 🟠 · Ölçüm: **150 handler, 58'i kapsamlı, 92'si doğrulanmamış.**
  Dar ayak mimari testle kapandı; geniş ayak bir tur işi değil, ayrı bir plan gerektiriyor.
- **`E-16` artığı** · Lise saatleri seed'lendi ama **"Türk Dili ve Edebiyatı" katalogda
  yok**; lise satırları `CurriculumVersions.HighSchoolProvisionalDecision` ("Doğrulanmadı —
  MEB çizelgesi bekleniyor") ile damgalandı. Uydurulmuş saatin doğrulanmış görünmemesi için.
- **`ENG-02` + `TB-29`** · Kullanıcı kararıyla **ayrı oturuma park** (tasarım üretimi
  sürüyor); ikisi de aynı öğretmen yüzeyini gerektiriyor.
- **`E-13`** · `K-08` ile ertelendi.
- **`X-03`** · `TB-48`'in aynı düğümü; karar bekleyen listede.

### 14.6 Bu turun kendi dersi

`E-12`'nin bıraktığı desen bu turda tekrar tekrar doğrulandı: **çağrılmayan uç, arkasındaki
kusuru da saklar.** `TB-32`'de bunun aynası çıktı — *ekranın uyguladığı kural, sunucunun
bilmediği kuraldır*; ekran değişirse ya da ikinci bir istemci gelirse kural yoktur.
Aynı biçim `TB-07`'de üçüncü kez göründü: **isim bir sözleşme taşımıyorsa, yanlış seçim
hata değil sessiz eksilme üretir.**

---

## 15. ENG-02 Tasarım Alımı — ölçüm turu (2026-08-17)

Tasarım geldi (`Oksis Layout v2`, claude.ai/design). `handoff-web` + `handoff-mobile`
becerilerinin dört kapısından geçirildi. **Kapı 1 geçti** — kaynak isimden değil
registry'den çözüldü (`web/skeleton.jsx :: Page()` satır 307 rol dallanması;
`mobile/proto-app.jsx :: protoScreens()` dört ekran + widget). Manifest ile registry
çelişmiyor. Altı ekranın altısı da `designed`, placeholder yok.

**Kapı 4a beklenenden iyi çıktı ve beklenmedik kusurlar açtı.** ENG-02 dosyası
*"sunucu ayağı hazır; eksik olan yalnız ekran"* diyordu. **Yarısı doğruydu:** altı
tüketici ucu (`timetable/teachers/me/weekly|today`, `students/me/...`,
`parents/children/{id}/...`) gerçekten yazılmış ve `generated/schema.ts`'te mevcut.
Ama **hiçbir ekran onları çağırmadığı için içlerindeki kusurlar da hiç görülmemiş.**
Aşağıdaki beş madde bu ölçümün ürünü.

> Bu, `E-12` deseninin dördüncü tekrarı: **çağrılmayan uç, arkasındaki kusuru saklar.**
> Bu kez saklanan şey izin değil, *okuma modelinin kendisiydi*.

### `TB-58` · Öğretmen haftalık programının başlığı rastgele bir şubenin adı 🟠

`BuildWeeklyFromSnapshotsAsync` dönüş DTO'sunun başlığını `first.ClassRoomId` ile
dolduruyor. Şube ekseninde (`class-rooms/{id}/weekly`) bu doğru: tek snapshot var,
başlık o şubedir. **Öğretmen ekseninde yanlış:** öğretmen dört şubeye giriyorsa
`snapshots[0]` hangi program önce sıralandıysa odur ve başlıkta *"9-A"* yazar.
Ders satırlarındaki `ClassRoomName` doğru; yanlış olan yalnız başlık — yani ekran
başlığa güvenirse öğretmene ait olmayan bir şubenin adını gösterir.

Aynı yerden `AcademicSessionId` / `AcademicTermId` de `first`'ten alınıyor.

### `TB-59` · Haftalık görünüm geçici değişiklikleri hiç göstermiyor 🟠

`ApplyTodayOverlayAsync` yalnız `BuildTodayAsync` içinden çağrılıyor.
`PublishedWeeklyScheduleDto`'nun dersleri **hiçbir zaman** `IsCancelled` ya da
`ExceptionType` taşımıyor. Yani yayınlanmış programda iptal / vekâlet / derslik
değişikliği varsa, haftalık görünüm bunları **yokmuş gibi** çiziyor.

Kök neden yapısal: haftalık DTO tarihsiz bir **kalıp** (Gün 1..5), `ScheduleException`
ise **tarihe** bağlı (`Date`). Hangi takvim haftasına bakıldığı bilinmeden overlay
uygulanamaz. Uç da parametresiz. İkisi birlikte çözülür.

### `TB-60` · Vekâlet edilen ders "iptal" ile aynı bayrağa biniyor, vekilin adı hiç dönmüyor 🟠

Öğretmenin kendi görünümünde `TeacherSubstitution` şöyle işleniyor:

```
IsCancelled = true, ExceptionType = "TeacherSubstitution"
```

İki ayrı sorun:
1. **`IsCancelled` iki farklı olguyu taşıyor** — "bu ders yapılmayacak" ile "bu ders
   yapılacak ama sen girmeyeceksin". İstemci `ExceptionType`'a bakarak ayırabilir,
   ama bayrağın adı yalan söylüyor.
2. **Vekilin adı hiç dönmüyor.** Öğretmen "dersim devredildi" bilgisini alıyor,
   *kime* devredildiğini alamıyor. `ScheduleException.NewTeacherId` duruyor ama
   yalnız şube/öğrenci görünümünde çözülüyor.

Aynı ailede: `RoomChange`'de handler `RoomName`'i yerine yazıyor, **eski derslik adı
kayboluyor** — oysa `OriginalRoomId` kayıtlı. Ve `CreatedAt` (değişikliğin ne zaman
duyurulduğu) DTO'ya hiç çıkmıyor.

### `TB-61` · Zil çizelgesinin ara slotları tüketici ucundan düşürülüyor 🟡

`GetPeriodsAsync` `Where(b => b.SlotType == BellSlotType.Lesson)` ile daraltıyor.
Teneffüs ve öğle arası satırları veritabanında duruyor ama tüketiciye hiç ulaşmıyor.
Sonuç: haftalık ızgarada 4. ders ile 5. ders arasındaki 40 dakikalık boşluk görünmez,
öğrenci programına baktığında öğle arasının nerede olduğunu bilemez.

### `TB-62` · Öğretmen haftalık sorgusu okulun bütün program sürümlerini deserialize ediyor 🟡

`BuildTeacherWeeklyAsync` `db.ScheduleVersions`'ın **tamamını** belleğe çekiyor, her
satırın `SnapshotJson`'unu ayrıştırıyor, sonra `Placements.Any(p => p.TeacherId == …)`
ile filtreliyor. 40 şube × ~10 sürüm = istek başına 400 JSON deserializasyonu.

Ekran yazıldığında bu yol **sabah 08:30'da okulun bütün öğretmenleri tarafından aynı
anda** çağrılacak. Şu an hiçbir ekran çağırmadığı için görünmüyor.


### 15.1 Tasarımın kaçırdığı bir sunucu yeteneği

Ölçüm ters yönde de bir şey buldu: `ApplyTodayOverlayAsync` öğretmen görünümünde
**gelen vekâleti** de işliyor — bugün başkasının yerine gireceğin ders programına
ekleniyor (`BuildSubstitutionInLessonsAsync`). **Tasarım bunu hiç göstermiyor;**
yalnız "senin dersine vekil giriyor" hâlini çiziyor.

Ekran bu hâli çizmezse öğretmen **bugün gireceği bir dersi programında göremez** —
ENG-02'nin kapattığı hatanın tam olarak aynı ailesi. Faz D'de ekranın bunu da
göstermesi gerekiyor.

### 15.2 İzin — bilinçli mi, unutulmuş mu?

Ders programı izin ailesi: `timetable.manage` · `timetable.publish` ·
`timetable.view-all` · `timetable.override` · `timetable.delete`.
**`timetable.view-own` yok** ve altı `me` ucunun hiçbirinde `[RequirePermission]`
bulunmuyor — yetki `accessToken.PersonId` ile kendi kaydına kilitlenmekten geliyor.

Savunulabilir (kendi eksenine erişim izin gerektirmez), ama iki sonucu var:
tasarımdaki *"Hesabınızın ders programı görüntüleme izni yok"* durumu **asla
oluşamaz**, ve web nav satırı izinle değil **rolle** kapılanmak zorunda kalır.
Kararın kendisi doğru; eksik olan yazılı olmaması. Faz A'da koda geçiriliyor.

### 15.3 Kiracı izolasyonu — kontrol edildi, temiz

`ScheduleVersion : TenantEntity` ve `ScheduleException : TenantEntity`. Öğretmen
sorgusu `db.ScheduleVersions`'ı açık `Where(schoolId)` olmadan okuyor ama global
sorgu filtresi devrede. **Sızıntı yok.** (Faz A'da mimari testle çivileniyor —
`TB-62`'nin performans düzeltmesi sorguyu değiştireceği için filtre kazara
düşürülebilir.)


---

## 16. `ENG-02` KAPANDI — öğretmen ve öğrencinin ders programı yüzeyi (2026-08-17)

Tasarım geldi, `K-11` ile kararlar verildi, dört fazda yazıldı ve **ekranda
doğrulandı.** `B-17` turunda (2026-08-12) menüden kaldırılan `/schedule` satırı
geri geldi — aynı rota, role göre farklı yüz.

### 16.1 Üç bulgu birlikte kapandı

| Bulgu | Neydi | Şimdi |
|---|---|---|
| `B-17` | Öğretmen/öğrenci `/schedule`'a girince yöneticinin konsolunu görüyordu | `schedule-screen.tsx` rolü okuyor; ölçüldü, konsoldan hiçbir iz yok |
| `X-08` | 403/404 "sunucuya ulaşılamadı" diye gösteriliyordu | 404 → *"Ders programı henüz yayınlanmadı"*; ölçüldü |
| `ENG-02` | Kendi programını görebileceği ekran yoktu | Web'de ızgara + gün listesi, mobilde bugün + hafta |

### 16.2 Ekranda ölçüldü (s3 · gerçek yayınlanmış program)

- **Öğretmen** (`ogretmen.s3.01`, Murat Özdemir): iki AYRI şubedeki (1-A, 2-A)
  beş ders doğru gün/saat hücrelerinde. Başlık **öğretmenin adı** — şube adı
  değil (`TB-58`). Aralar 2., 4. ve 6. derslerden sonra (`TB-61`). Ders çekmecesi
  açılıyor, yayın künyesi doğru.
- **Öğrenci** (`ogrenci.s3.001`): şubesinin yayınlanmış programı yok →
  *"Ders programı henüz yayınlanmadı — Okul yönetimi programı yayınladığında
  burada görünecek."* Yönetim konsolundan iz yok.
- **Dönem dışı hafta:** bugün (17 Ağustos) dönemin dışında; ekran bunu söylüyor
  ve dönem aralığını veriyor.

### 16.3 Tasarımda olup ölçümde düzeltilenler

**Tasarımın kaçırdığı, ölçümün bulduğu:**
- `TB-58`…`TB-62` — beş sunucu kusuru (defter 15).
- `TB-64` — `X-05` yeniden adlandırması yayınlanmış snapshot'ları sessizce
  okunamaz yapmıştı; şube adı `"—"` çıkıyordu.
- **Dönem dışı hafta durumu** — tasarım hep dönem içinde olunduğunu varsayıyordu.
  Yaz tatilinde ekran bomboş bir ızgara gösteriyordu; boş ızgara "programın yok"
  diye okunur.
- **Ödevler / Notlar kısayolları düşürüldü** — ders çekmecesindeki "Bu dersin
  ödevleri" ve "Bu dersin notları" ölçüldü: `/homework` ve `/grades` hem webde
  hem mobilde `PlannedScreen` ("Bu ekran henüz boş"). Kullanıcıyı oraya yollamak
  `ENG-02`'nin kapattığı hatanın küçültülmüş hâli olurdu. Öğretmende yalnız
  "Yoklamaya git" kaldı (gerçek); öğrencide hiç kısayol yok.

**Tasarımdan bilinçle çıkarılanlar** (`K-11`): saat değişikliği istisnası (a),
ödev rozeti + "Takvime ekle" (b → `TB-63` borcu).

**Ölçümün değiştirdiği bir karar:** `K-11c`'de ders tonu paletini "markaya
kapalı ölçek olarak ekle" diye onaylamıştık. Uygulama sırasında görüldü ki
`packages/core/src/schedule/constants.ts`'te **12 tonluk `SUBJECT_PALETTE`
zaten vardı** ve yöneticinin editörü onu `subjectColorIndex` ile kullanıyordu.
Tasarımın 6-7 tonluk yeni paleti neredeyse aynı değerleri taşıyordu. **İkinci
palet üretilmedi**; mevcut olan yeniden kullanıldı. Karar geçerli, uygulaması
daha küçük çıktı.

### 16.4 Yapılmayanlar — açıkça

- **Mobil anasayfa widget'ları** (tasarımın `ScheduleWidgetShowcase`'i). Mobil
  anasayfalar bugün `home-fixtures.ts` ile besleniyor; tek bir canlı widget'ı
  sahte bir anasayfaya takmak tutarsız olurdu. Anasayfa canlı veriye
  bağlandığında eklenir.
- **Mobil hafta ızgarası.** Tasarım iki varyant çizmiş ama ızgarayı kendi
  notunda *"yoğunluk denemesi … üretim önerisi dikey liste"* diye işaretlemişti.
  Tasarımcının önerisi uygulandı.
- **Koyu tema.** Mobil uygulamada koyu tema yok (`useColorScheme` hiç
  kullanılmıyor); tasarımın koyu varyantı bir Tweaks anahtarıydı ve web tarafında
  da aynı gerekçeyle portlanmamıştı.
- **Veli ders programı ekranı.** Uç hazır (`parents/children/{id}/weekly`) ve
  `packages/api` hook'u yazıldı, ama tasarımda veli ekranı yok. Web'de ve
  mobilde veliye durum ekranı gösteriliyor.

### 16.5 Zincir açıldı

`TB-29` (öğretmen kendi müsaitliğini giremiyor) `ENG-02`'yi bekliyordu — öğretmenin
mobil program yüzeyi artık var, müsaitlik girişi oraya oturabilir. **Bu turun
kapsamında değil**, ama artık açılabilir.


---

## 17. ENG-02 Ekran Testi Turu (2026-08-17, gece)

`ENG-02` kapandıktan sonra ekranın kendisi test edildi. Turun ayırt edici yanı:
**kodda yazılıp ekranda hiç görülmemiş yollar** hedef alındı — dört geçici
değişiklik türü, yoklama ipucu, kırılımlar, rol regresyonları.

**Test verisi gerçek yoldan kuruldu:** aktif döneme (`2026-08-10…08-21`, bugünü
kapsıyor) yeni bir program oluşturulup 6 ders yerleştirildi ve **uçtan** yayınlandı;
sonra dört istisna **uçtan** yaratıldı. Doğrudan veritabanına yazmak yazma yolunu
atlardı.

### 17.1 Tutan yollar

| Ne | Sonuç |
|---|---|
| İptal · vekâlet (giden) · derslik değişikliği · vekâlet (gelen) | Dördü de doğru rozet, doğru ton, doğru sınıf |
| Derslik değişiminde "B-204 → A-101" (eski üstü çizili) | ✅ |
| Çekmece cümlesi: *"Bu derse Zehra Özdemir yerine vekâleten siz gireceksiniz."* | ✅ tasarımın hiç göstermediği yol |
| Duyurulma zamanı + gerekçe | ✅ |
| "Bu hafta 4 ders değişti" şeridi | ✅ sayı doğru |
| Yoklama ipucu ("Alınmadı") | ✅ uçtan geliyor |
| Gün listesi: geçmiş ders soluk, "Bugünkü dersleriniz tamamlandı", "Yarına bak" | ✅ |
| **Yönetici konsolu** | ✅ regresyon yok; yeni yayınlanan programı listeliyor |
| Kırılımlar: `sro-sm` (gün sekmeleri, ızgara yok), `sro-md` (ızgara, derslik gizli) | ✅ |
| **Yatay taşma** | ✅ **yok** — `B-17`'nin özgün belirtisi buydu (947px gövde / 487px görünüm) |
| Veli | `RouteGuard` kesiyor: *"Veli rolü /schedule sayfasını görüntüleyemez"* |

### 17.2 `TB-65` · Haftalık çizelge DÖNEMLERİ karıştırıyor 🟠

**Ekranda görüldü.** Aktif dönemin haftasında (17-21 Ağustos) **arşivlenmiş
dönemin** dersleri de listelendi. Dahası: Pazartesi 3. saatte **iki ders** aynı
hücreye düştü — biri aktif dönemden ("Türkçe", iptal), biri arşivden ("Fen
Bilimleri"). Izgara `lessonAt()` ile ilk eşleşeni aldığı için **birini sessizce
yuttu**; gün listesi ise ikisini de gösterdi. Aynı veri, iki görünümde iki farklı
sonuç.

Kök neden benim Faz A'da yazdığım satır: dönem `snapshots[0].AcademicTermId`'den
okunuyordu — *"hangi program önce sıralandıysa onun dönemi"*. Öğretmen sorgusu ise
öğretmenin ders verdiği **bütün** programları (arşiv sezonlar dâhil) birleştiriyordu.
Tek bir dönem sınırıyla süzülen bir çoklu-dönem kümesi.

Şube ekseninde aynı sınıftan bir kusur: sürüm seçimi yalnız `Version` sırasına
bakıyordu, yani bir şubenin **eski dönemdeki v3** programı, bu dönemdeki v1
programını eziyordu.

**Düzeltme yönü tersine çevirdi:** *hafta dönemi belirler, dönem de hangi
programların geçerli olduğunu.* Dönem haftanın **başladığı** tarihe göre seçilir;
snapshot'lar `AcademicTermId` ile veritabanı tarafında süzülür.

> İlk düzeltmem de yanlıştı: bir hafta iki dönemi kestiğinde "en geç başlayanı"
> seçiyordum ve **kendi guard testim kırmızıya düşürdü**. Doğrusu haftanın
> pazartesisinin hangi dönemde olduğu.

### 17.3 `TB-66` · Geçici değişiklik tarih kuralının mesajı kuralı anlatmıyor 🟡

Geçmiş bir tarihe istisna yazmayı denerken:

> Seçilen tarih **dönem aralığının** dışında.

Ama kural dönemle ilgili değil: `ScheduleExceptionPlanner` (BR-TT-011)
`date < today || date > today.AddDays(30)` diyor — bir **gelecek penceresi**.
Reddedilen tarih (2 Mart) dönemin (10 Şubat – 13 Haziran) tam **içindeydi**.
Kullanıcı mesajı okuyup dönem tarihlerine bakar, tarihin içeride olduğunu görür ve
sebebi bulamaz. Mesaj kuralı söyleyecek biçimde düzeltildi.

### 17.4 `TB-67` · Ders programı ekranının veli dalı ölü kod ⚪

`schedule-screen.tsx`'te veli için bir durum ekranı yazılmıştı. Ölçüldü: **hiç
çalışmıyor.** `/schedule` velinin nav setinde olmadığı için `RouteGuard` daha
yukarıda kesiyor. Ulaşılamayan bir dal, canlı görünen ölü koddur — kaldırıldı,
yerine neden ulaşılamadığı yazıldı.

Aynı temizlikte: gün listesindeki teneffüs şeridi "Sıradaki" ayracıyla **aynı CSS
sınıfını** paylaşıyordu (`.sro-next`). Bir teneffüs "sıradaki ders" değildir;
kendi sınıfına ayrıldı.

### 17.5 Bu turun dersi

`ENG-02` kapanış turunda *"ekranda doğrulandı"* demiştim ve doğruydu — ama
**doğruladığım şey yalnız gördüğüm veriydi.** İstisnası olmayan bir haftada
istisna kodu, tek dönemli bir okulda dönem süzmesi test edilmiş olmuyor.
`TB-65` ancak veriyi bilerek zorlaştırınca (iki dönem, aynı öğretmen, çakışan
hücre) ortaya çıktı.

**Ekran testi, veriyi de tasarlamayı gerektirir.** "Ekranı açtım, çalışıyor"
cümlesi ancak ekranın çizebildiği her hâli üreten bir veri kümesiyle anlam taşır.


### 17.6 Mobil ekranlar — Expo web ile ölçüldü

Kapanış turunda *"mobil ekranları tarayıcıda göremedim"* demiştim. **Görülebiliyormuş:**
API'nin dev CORS listesi `http://localhost:8081`'i (Expo web portu) zaten içeriyor.
Hafızadaki "dev API CORS göndermiyor" notu güncel değilmiş.

`expo start --web` ile öğretmen hesabıyla girildi; **bugün** ve **hafta** ekranlarının
ikisi de gerçek veriyle çalıştı: dört istisna rozeti, teneffüs şeridi, yoklama ipuçları,
"Bugünkü dersleriniz tamamlandı", gün çipleri, hafta gezinmesi.

Üç kusur çıktı:

#### `TB-68` · Ders satırında dokunulabilir öğe içinde dokunulabilir öğe 🟠

`LessonRow` bir `Pressable`; içindeki yoklama ipucu da ayrı bir `Pressable`'dı.
Web'de bu **geçersiz HTML** üretiyor (`<button>` içinde `<button>`, React hydration
hatası); native'de ise hangi eylemin tetikleneceği öngörülemez.

Kaynağı tasarım: `SchRollCallHint` kendi `onPress`'ini `e.stopPropagation()` ile
koruyordu — bu bir **web idiomu**, React Native dokunma sisteminde öyle çalışmaz.
Portlarken deyimi değil yapıyı almışım.

Düzeltme: yoklama ipucu artık bir **etiket**. Satır başına tek dokunma hedefi; ders
sayfasında "Yoklamaya git" düğmesi zaten var. Bir dokunuş fazla, ama davranış belirli.

#### `TB-69` · Mobil hafta ekranında ham ISO tarih ⚪

Gün başlıkları `· 2026-08-17` yazıyordu. Türkçeleştirildi (`· 17 Ağustos`); dönem
sınırı notundaki tarihler de öyle.

#### `TB-70` · Hafta etiketi iki yerde ⚪

Üst barın alt satırı ve ok tuşlarının arası aynı hafta etiketini yazıyordu. Üstteki
kaldırıldı — etiket kontrolün yanında kalır.

**Ayrıca ölçüldü, kapsam dışı:** mobil açılışta `GET /api/v1/auth/me/context` bir kez
**401** dönüyor (oturum geri yüklenmeden önceki yarış). Ekranı engellemiyor ve
`ENG-02` ile ilgisi yok; ayrı bir tur konusu.


---

## 18. Cihaz Turu — Ders Programı Yüzeyi (2026-08-18)

Uygulama kullanıcının **iPhone 15 Pro**'suna kuruldu ve ekranlar gerçek cihazda
açıldı. Emülatörde/Expo web'de görünmeyen bir sınıf kusur ortaya çıktı: ekranın
**uygulama kabuğuna nasıl oturduğu**. Üç bulgunun da kökü aynı — bir ekranın
"alt ekran mı, sekme seviyesi mi" olduğunu YANLIŞ varsaymak.

#### `TB-71` · "Ders Programım" uygulama kabuğunun dışında kalmıştı 🔴

Kullanıcının bildirdiği kusur: *"Programım ekranında Header yok."*

`/schedule` rotası `app/schedule/index.tsx` olarak **stack** altına yazılmıştı.
Sonuç: ortak `AppHeader` (dönem · tarih · bildirim zili · profil) ve alt sekme
çubuğu **hiç çizilmiyordu**. Tasarım (`Oksis Mobile Prototype`) bu ekranı açıkça
sekme seviyesinde gösteriyor: AHHeader + ekran içi "Ders Programım" başlığı +
`PortalTabBar active="more"`.

İlk düzeltme denemem **yanlış yöndeydi**: ekranı alt ekran sanıp geri oklu
`ScreenHeader` verdim ve ekran içi başlığı kaldırdım. Bu, üst barı geri getirmek
yerine tasarımın başlık bloğunu da yok etti. Kullanıcı beklediği tasarımla benim
ürettiğimi yan yana koyunca fark görüldü.

Doğru düzeltme, uydurma değil **var olan mekanizma**: `MOBILE_TAB_HIDDEN_KEYS`.
Ekran `app/(tabs)/schedule.tsx`e taşındı, `href: null` ile çubukta girdisiz
kaydedildi, `activeKeyOverride`a `schedule: 'more'` eklendi. `excuse-list`,
`announcements-inbox` ve `activities` zaten tam olarak böyle çalışıyordu.

Haftalık görünüm (`/schedule/week`) **gerçekten** alt ekrandır; orada elle
yazılmış başlık çubuğu `ScreenHeader`a bağlandı — eskisi `useSafeAreaInsets`
uygulamadığı için çentikli cihazda durum çubuğunun altına giriyordu.

**Ders:** "Ekran çalışıyor" ile "ekran uygulamaya ait" ayrı şeyler. Bir rotayı
hangi dizine yazdığın, ekranın kabuğunu belirler; bu karar tasarımdan okunur,
tahmin edilmez.

#### `TB-72` · `/planned` çıkışsız ekrandı 🟠

Genel "yakında" rotası header'sızdı. PUSH edilen bir ekranda geri düğmesi yoktu;
kullanıcının tek çaresi kenardan kaydırma jestiydi. `ScreenHeader` eklendi.
Blok başlığı artık ekran adını tekrar etmiyor, durumu söylüyor.

#### `TB-73` · Anasayfa kısayolu var olan ekranı "yakında" diye gösteriyordu 🟠

Öğretmen anasayfasındaki **"Günün programını gör"** düğmesi, `ENG-02` kapandıktan
sonra bile `/planned?title=Ders Programı`ya gidiyordu — yani öğretmene, artık VAR
OLAN bir yeteneği yokmuş gibi gösteriyordu. `home-screen.tsx`teki eşleme zaten
"karşılığı olanlar ilgili ekrana gider" diyordu; ENG-02 ile güncellenmemişti.

Bu, `eksik-ekran-eksik-yetkiyi-gizler` desenin kardeşi: **yanlış hedefe bağlı
kısayol, var olan yeteneği gizler.** Bir modül kapanırken ona giden tüm
kısayolların taranması gerekiyor.

**Tasarımdan sapma (açık, karar bekliyor):** tasarım başlık altında
"Yayınlandı · 12 Ağustos, 14:30" (yayın ZAMANI) yazıyor; kod "Yayınlandı ·
Sürüm 1" (yayın SÜRÜMÜ) yazıyor. İkisi de doğru bilgi, farklı sorulara cevap.
Değiştirilmedi.

#### `TB-74` · "Yoklamaya git" çıkmaza gidiyordu 🔴

Kullanıcı ders sayfasındaki **"Yoklamaya git"** düğmesine bastı; açılan ekran
*"Ekran açılamadı — Bu ekran bir ders oturumu seçilerek açılır"* dedi.

Kök neden **sözleşmede**: `PublishedLessonDto` yoklama oturumunun **durumunu**
(`RollCallState`) döndürüyordu ama **kimliğini** döndürmüyordu. Sunucu
`AttachRollCallAsync` içinde tam da o satırları okuyor —
`AttendanceSessions.Where(placementId, date)` — ve `s.Id`'yi projeksiyonun
dışında bırakıyordu. Mobil rota `/attendance/roster` `sessionId` ister;
parametresiz push edilince `MissingParamState` çiziliyordu.

İki ayrı soru, tek alanla cevaplanmaya çalışılmıştı:
- "Yoklama alındı mı?" → `rollCall` (durum)
- "Nereye gideceğim?" → kimlik — **yoktu**

Düzeltme: `RollCallSessionId` sözleşmeye eklendi (sunucu · `packages/core` ·
`packages/api` eşlemesi · OpenAPI yeniden üretildi). `onNavigate` artık kimliği
taşıyor. Oturum henüz maddileşmemişse kısayol **gösterilmiyor** — açılacak bir
yoklama ekranı gerçekten yoktur; düğmeyi gösterip çıkmaza sokmak yalandır.

**Web'de aynı kusur YOK:** oradaki `/roll-call` kendi içinde ders seçtiren bir
sayfadır, parametre beklemez. Mimariler farklı olduğu için tek düzeltme iki
tarafa uymuyordu; ölçülüp doğrulandı.

**Doğrulama:** vekâleten girilen Pazartesi dersi açıldı → düğme göründü →
`/attendance/roster?sessionId=83db02ae…` açıldı ve başlık **"1-A · Matematik ·
2. Ders · 09:30–10:10"** yazdı. Vekile DEVREDİLEN Salı dersinde ise düğme hiç
çizilmedi (doğru).

**Ders:** `ENG-02` turunda ekranların birbirine bağlandığı yerler ölçülmemişti.
Bir ekranı "çalışıyor" saymak için içindeki her çıkışın da bir yere varması
gerekiyor — kısayol, ekranın parçasıdır.

#### `TB-75` · Yayın damgası: sürüm değil ZAMAN, ve iki kopya tek yere indi ⚪

Kullanıcı tercihi (2026-08-18): başlığın altındaki satır tasarımdaki gibi
**yayın anını** yazacak — "Yayınlandı · 12 Ağustos, 14:30" — sürüm numarasını
değil. Öğretmenin sorduğu soru "kaçıncı sürüm" değil "ne zaman yayınlandı".

Uygularken ikinci bir kusur çıktı: web'de bu işi yapan **yerel bir `formatStamp`
kopyası** vardı ve saati `new Date(iso).getHours()` ile **yerel saate
çeviriyordu**. `packages/core/date/tr-date.ts` dosyasının açık kuralı ise
"saat sunucu damgasıdır, çevrilmez". Yani aynı damga iki yüzde iki farklı saat
gösterebiliyordu.

Ortak `formatTrDayMonthTime` eklendi (uzun ay adı, **yıl yok** — dönem içinde
kalan damgalar için); mobil ve web ikisi de onu kullanıyor, web'deki kopya
silindi.

**Boş yere yeşil değil:** testte `"2026-08-12T23:45:00Z"` → `"12 Ağustos,
23:45"` bekleniyor. Eski `getHours()` yöntemi bu makinede (Europe/Istanbul)
**"13 Ağustos, 02:45"** üretiyor — ölçüldü. Guard gerçekten ısırıyor.

**Doğrulama:** mobil ve web, ikisi de "Yayınlandı · 17 Ağustos, 19:52".

**Ayrıca ölçüldü, kapsam dışı:** web'de `/schedule` ÖĞRETMEN oturumuyla
açıldığında dört **yönetici** sorgusu 403 dönüyor (`class-rooms`,
`timetable/programs`, `school-settings/grade-levels`,
`users/persons?profileType=Teacher`). Ekranı engellemiyor ve salt okunur yüz
doğru çiziliyor, ama öğretmenin oturumundan hiç atılmaması gereken sorgular
bunlar. `ENG-02`'nin parçası değil; ayrı tur konusu.

---

## 19. Mobil Öğrenci Ölçümü ve Yayın Ekranının Sayıları (2026-08-18)

`ENG-02`'nin son doğrulanmamış ayağını kapatmak için kullanıcı izniyle **2-A'ya
güncel dönem programı yayınlandı** (uygulamanın kendi uçlarıyla: `POST programs`
→ 30 × `POST placements` → `POST publish`; arşiv 2-A'nın ders/öğretmen çiftleri
kopyalandı, 0 çakışma, 0 eksik saat).

**Mobil öğrenci ekranda doğrulandı** (Onur Yıldırım · 2-A): AppHeader + sekme
çubuğu, "Yayınlandı · 17 Ağustos, 22:45", "SIRADAKİ DERS · 08:40'da başlıyor ·
Fen Bilimleri · Pınar Türk", "Bugün · Salı · 6 ders", öğretmen adları (öğrenci
varyantı), teneffüs ve **Öğle Arası 11:50–12:40** doğru yerlerde, yoklama
kısayolu yok, yönetim konsolu izi yok. `ENG-02`'nin yedi ayağının **yedisi de**
artık ekranda görülmüş durumda.

Bu ölçüm sırasında yayın ekranının kendisinde iki kusur çıktı.


---

## 20. `K-10` Uygulama Denetimi — görevlendirme tek kaynağa indi mi? (2026-08-18)

**Soru:** `K-10` *"v2 + müfredattan türet, **v1 emekliye ayrılır (okuma yolları kesilir)**"*
demişti. Karardan iki gün sonra kodda ne var?

**Cevap: yarısı yapılmış.** Tüketici ayağı bitti — **üretici ayağı hiç başlamadı.**

#### `X-15` · Görevlendirme hâlâ iki tabloda; v1 emekli değil, **canlı yazma yüzeyi var** 🔴 *(kapandı — aşağıda)*

- **Yapılan (doğrulandı):** ders programı üretimi tek kaynağa indi.
  `TeachingAssignmentSource`, `AutoGenClassResolver` ve `GetAutoGenClassesQueryHandler`
  **yalnız** `academic.subject_teacher_assignments` (v2) + müfredat okuyor; üçünde de v1'e
  tek referans kalmamış. Sınıfın kendi docblock'u kararı ve gerekçesini taşıyor.
- **Yapılmayan:** v1 `academic.teaching_assignments`'ın **okuma yolları kesilmedi**;
  üstüne **yazma yüzeyi de duruyor**.

**Ölçüm — v1 bugün canlı (2026-08-18, `oksis-api` @ `b49d17f`, `oksis-ui` @ `5dadb16`):**

| | v1 `teaching_assignments` | v2 `subject_teacher_assignments` |
|---|---|---|
| Yazan uç | `POST/DELETE api/v1/teachers/{id}/assignments` · `POST api/v1/teaching-assignments/copy-season` | `POST api/v1/assignments` … |
| Yazan ekran | **web · Öğretmenler** (`teachers-page.tsx` → `TchAssignModal`: **şube + ders + haftalık saat**) | web · Görevlendirmeler |
| Okuyan | 10 yer (aşağıda) | Görevlendirmeler ekranı + **ders programı üretimi** |
| Aktif satır (dev DB) | ATA-AL **142** · CUM-IO **140** · DEV-OKUL **140** · TST-AL 0 | 16 · 3 · 0 · 0 |

**`K-10`'un ölçümünde bir hata vardı ve karar onun üstüne kuruldu.** Karar metni
*"`AssignSubjectClassCommand` ucu var ama **hiçbir istemci çağırmıyor**"* diyor. Bu doğru değil:
`oksis-ui` @ `5462808` (**2026-07-12**, karardan **beş hafta önce**) Öğretmenler ekranına
görevlendirme modalını eklemiş ve o gün bugündür `useAssignSubjectClass` → `POST v1` çağırıyor;
çekmece de `GET`/`DELETE v1` çağırıyor. `s4`'te v1'in 0 olması "istemci yok"tan değil, **o testte
o modalın kullanılmamış olmasından** kaynaklanıyor. Yani v1 ölü bir tablo değil, **kullanıcının
elinin altındaki bir ekran.**

**Bunun bugünkü anlamı — kullanıcı veri girer, hiçbir şey olmaz.** Öğretmenler ekranından
"Matematik · 9-A · 4 saat" girildiğinde satır v1'e yazılır; ders programı üretimi v1'i artık
**hiç okumaz**. Ekran başarı der, program değişmez. Bu, `B-26`'nın **tersi**: eskiden üretim
kimsenin yazmadığı tablodan besleniyordu, şimdi kullanıcı hiçbir şeyin okumadığı tabloya yazıyor.
Aynı aile: [[kural-ekranda-degil-sunucuda]] · `TB-32`.

**v1'i bugün hâlâ okuyan yerler (10):**

| Yer | Ne bozulur (v1 boş / bayat olan gerçek okulda) |
|---|---|
| `AudienceResolver.BuildTeacherPoolAsync` | Öğretmenin duyuru hedef havuzu **yalnız kendi şube/dersleri**dir ve v1'den kurulur → havuz **boş**, öğretmen kendi sınıfına duyuru yapamaz |
| `AudienceResolver.ResolveCourseStudentsAsync` + `CreateAnnouncementCommandHandler` | "Ders" hedefi bir **v1 satır kimliğidir**; çözülemezse alıcı kümesi boş |
| `GetTeacherWorkloadQueryHandler` | Öğretmen yükü = v1 haftalık saatlerin toplamı → **her öğretmen %0** |
| `GetAvailableSubstitutesQueryHandler` | Adayın ders kategorileri v1'den → kategori üzerinden gelen uyum hiç doğmaz (`TB-57`'nin düzelttiği branş ayağı ayrı) |
| `GetTeacherAssignmentsQueryHandler` | Öğretmen çekmecesindeki "Görevlendirmeler" listesi |
| `GetAssignmentHistoryQueryHandler` | "Görev Geçmişi" |
| Hub: `GetAssignmentSummary` · `ListAssignmentClasses` · `ListClassAssignments` | `api/v1/teaching-assignments/*` — **hiçbir istemci çağırmıyor** (ölçüldü); yani kusuru da görünmez |
| `SubjectUsageInspector` | ✔ **Doğru olan tek yer:** ders silme kapısı v1 **ve** v2'yi birlikte soruyor (`TB-53`) |
| `ActivateSeasonRolloverCommandHandler` · `SetupSeasonReverter` · `CopyAssignmentsToNewSeason` | Devir v1 satırlarını yeni sezona kopyalamayı sürdürüyor — **iki kaynağı her sezon yeniden üretiyor** |
| `TimetableDevSeeder` | Seed hâlâ v1'e 140 satır yazıyor; `B-26`'yı gizleyen verinin ta kendisi |

**Yan bulgu — iki olay da dinleyicisiz.** `TeachingAssignmentChangedEvent` (v1) ve
`SubjectAssignmentChangedEvent` (v2) yayınlanıyor, **hiçbir handler dinlemiyor**. v1 entity'sinin
docblock'u hâlâ *"Değişimde … yayınlanır → Ders Programı senkron kalır"* diyor; bu cümle `K-10`
sonrası yalnız yanlış değil, **tersine yanıltıcı** — o olay artık hiçbir yere gitmiyor.

**Kalan iş (karar değil, uygulama):** ya (a) `K-10` harfiyen uygulanır — v1 yazma yüzeyi
kaldırılır, 9 okuma yolu v2 + müfredata taşınır, seed/devir v2'ye çevrilir, tablo göç ile emekli
edilir; ya da (b) v1'in taşıdığı **şube + haftalık saat** ekseninin kalıcı bir işlevi olduğu kabul
edilir ve `K-10` yeniden açılır. Bugünkü hâl ikisi de değil: **iki doğruluk kaynağı, biri sessizce
tüketicisiz.**

##### ✅ KAPANDI — `oksis-api` @ `67d16db..1798802` · `oksis-ui` @ `5dadb16..2273ceb`, 2026-08-18

`K-10`'un ikinci ayağı on görevlik bir planla uygulandı. Görevlendirme artık **tek kaynakta**:
"kim hangi dersi **verebilir**" → v2 `academic.subject_teacher_assignments`; "kim hangi şubede
**kaç saat** veriyor" → **canlı ders programı**. v1 `academic.teaching_assignments` tablosu düştü.

**Türetmenin tek noktası:** `TeacherCourseLoadProjection` — şube/ders/saat, canlı yerleşimlerden
(`LessonPlacement.IsActive && IsReserving`) sayılır. Taslak program yük üretmez.

**v1'i okuyan dokuz yol taşındı:** öğretmen yükü · çekmece ders listesi · görev geçmişi (v2'ye) ·
öğretmen duyuru havuzu · "Ders" hedefi çözümü · vekâlet aday kategorileri (v2'ye) · sezon devri
(v2 kopya komutuna) · `SetupSeasonReverter` guard'ı · dev seed. **Yazan yüzey kaldırıldı:**
`POST/DELETE teachers/{id}/assignments`, `teaching-assignments/*` ailesinin tamamı,
`academic-sessions/{id}/copy-assignments`, ve web Öğretmenler ekranındaki "Görevlendirme ekle"
penceresi. Migration: `20260818_retire_v1_teaching_assignments` (tablo + `teaching-assignments.assign`
ve `.copy-season` izinleri; `teaching-assignments.view` **kaldı**).

**Geri gelmesini engelleyen guard:** `tests/Oksis.Tests/Architecture/SingleAssignmentSourceTests.cs` —
`src` altında v1 adının geçmesini yasaklar, ihlali dosya:satır listesiyle söyler. Bu yüzden v2 okuyan
`TeachingAssignmentSource` de `CompetencyAssignmentSource` olarak yeniden adlandırıldı (`X-05`'in dersi:
isim sözleşme taşımıyorsa yanlış seçim sessiz hata üretir).

**Ölçüm:** beş test paketi **3539/3539** yeşil, `dotnet build` 0 uyarı; istemci tarafında lint + typecheck
6/6 ve 499 test yeşil. (Nihai bütün-dal incelemesi bir merge blocker + beş madde çıkardı; hepsi tek bir
düzeltme dalgasında kapandı ve ayrıca doğrulandı.)

**Uçtan uca elle doğrulama (s4 = OKSİS Test Lisesi, arayüzden kurulan okul — `B-26`'nın sahnesi):**
sihirbaz **10 şube** listeledi (eskiden **0**) · üretim 9 yerleşim, 0 çakışma, 0 eksik saat ·
çekmecede "9-A Matematik 6sa", "9-A Fizik 3sa" · yük **%20/%10** (ortalama %15, artık sıfır değil) ·
öğretmenin duyuru havuzunda **"9-A Matematik"** ve "9-A velileri". Yani senaryonun her ayağı ekranda görüldü.

**Kullanıcıya dönük üç davranış değişti — üçü de koda yazıldı:**
- **Yük ortalaması tek kaynağa indi ve paydası kadro geneli oldu.** Ara bir aşamada payda "canlı programda
  dersi olan öğretmenler"e daralmıştı; nihai inceleme bunun **ekranda karşılığı olmadığını** yakaladı — web
  Öğretmenler şeridi ortalamayı hâlâ **istemcide, ikinci bir kaynaktan** hesaplıyordu ve K-10 öncesi ikisi
  yalnız rastlantıyla eşitti (v1 boştu, herkes %0'dı). Yani planın kapattığı "aynı soruya iki kaynak" kusuru
  kullanıcıya dönük yüzeyde canlı kalmıştı. Karar: **kanonik anlam kadro geneli, hesap tek yerde — sunucuda.**
  Payda = tüm aktif öğretmenler; canlı yerleşimi olmayan ortalamaya **0 olarak girer**, dolayısıyla yayın
  tamamlanmadan KPI **düşük** okur. Ekran artık sunucunun sayısını gösteriyor, kendi hesabını yapmıyor.
- **Öğretmenin duyuru havuzu yayınlanmış programa bağlı.** Program yayınlanana kadar öğretmen kendi
  sınıfına duyuru yazamaz. Zamanlanmış bir duyuru dönem sınırını aşarsa hedefi yeniden çözülür; yeni
  dönemin programı yayında değilse **sessizce kaybolmaz** — job yayınlamayı reddeder, duyuru `Scheduled`
  kalır, `AnnouncementScheduleFailedEvent` gider ve bir sonraki taramada yeniden aday olur.
- **Vekâlet yetkinliği sezona bağlandı.** Devir sonrası geçen sezonun kapatılmış yetkinliği artık aday
  sıralamasına girmiyor (v2 sözleşmesi sezonu sert sınır sayıyor, `GRV-K-04`).

⚠️ **`X-11`'in yeni ve canlı kanıtı — bu turun en önemli yan bulgusu.** Migration'ın elle yazılmış izin
süpürme bloğu **çalışmıyordu**: `identity` T-SQL'de ayrılmış sözcük, parantezsiz şema adı `Error 156`
veriyordu. Beş test paketi de yeşildi ve **hiçbiri yakalamadı** — çünkü test fixture'ları migration
koşmuyor. Kusuru yalnız uçtan uca elle doğrulama buldu. Eksik olan kapı bu kez entegrasyon testi değil,
**migration'ın gerçekten uygulanabildiğini ölçen** bir adım.

⬜ **Açık kalanlar (bu planın kapsamı dışı, bilerek):**
- **Dev ortamında üretim hâlâ eksik saat bırakıyor** (`scope=All` → 70/90 saat, `missingHours: 20`).
  Sebep `IdentityDevSeeder`'ın branş başına **tek** öğretmen açması; tek adaylı derste bütün şubeler aynı
  kişiye yığılıyor. Plan kaynaklı değil, ayrı karar.
- **`apps/web`'de bileşen testi altyapısı yok** (RTL/jsdom) — ekran ayağının otomatik kapısı yok, kapı
  elle doğrulama.
- **Müfredat saatleri hâlâ doğrulanmamış** (`E-16` artığı: lise satırları *"Doğrulanmadı — MEB çizelgesi
  bekleniyor"* damgalı). Müdürün "bu şubede 6 saat olsun" diyebileceği yüzey `SchoolWeeklyHourOverride`
  üzerinden ayrı bir iştir.
- **`teaching-assignments.view` hiçbir role açıkça verilmiyor** (yalnız `AllPermissionIds()` üzerinden);
  öğretmen kendi ders listesini okuyamaz. Önceden beri böyle, uç idare ekranı için.


---

## 21. Not Modülü Öncesi Kod Taraması (2026-08-19) 🔧

**Bağlam:** Not (Grades) modülünün teknik analizi 18 Ağustos'ta yazıldı, geliştirmeye
başlamadan önce analizin `[D]` (doğrulanacak) maddeleri kodda ölçüldü.
Kaynak: `oksis-api` @ `d45f298` · `oksis-ui` @ `57e9e5b`.

**Ölçülen dört madde:**

| Analiz maddesi | Sonuç |
|---|---|
| T-Q1 · `Mark` hangi kimliği referanslar? | ✔ Doğrulandı — **`PersonId`**. `ITeacherClassroomScope`, `ParentStudentRelationship.StudentPersonId` ve `NotificationRecipientResolver` üçü de `PersonId` konuşuyor. |
| T-Q2 · `NotificationRecipientResolver` `CanViewInfo` süzüyor mu? | ❌ **Süzmüyor** — `TB-78` |
| T-Q6 · Dönem "yeniden aç" akışı var mı? | ❌ **Yok.** `AcademicTerm`'de `Reopen`/`ReOpen` metodu bulunmuyor; kilit tek yönlü. Not modülünde `UnlockAssessment` bunu sütun bazında telafi eder, dönem seviyesinde telafi yok. |
| Kapsam kapısının kaynağı `TeachingAssignment` mı? | ❌ **O tablo dün emekli edildi** — `X-16` |


---

## 22. Notlar Modülü Portu — ekranlar arası bağlantı turu (2026-08-19 … 2026-08-22)

**Kapsam:** Claude Design "Oksis Layout v2" Notlar (grade) modülünün `oksis-ui`'ye alınması ve
alım sonrası ekranda ölçüm. Aşağıdaki `B-33`…`B-36` **19 Ağustos'ta ölçüldü ve aynı gün
kapatıldı**; kod içindeki gerekçe blokları bu ID'lere atıf yapıyordu ama deftere hiç
yazılmamıştı — dangling atıflar burada kapatılıyor. `B-37` **22 Ağustos'ta** ölçüldü.

### `B-33` · İdare not panosuna hiçbir yerden girilemiyordu 🔴 *(kapandı)*

Yöneticinin menüsündeki "Notlar & Karne" `/report-cards`e gidiyordu; orada bir *"yakında"*
yer tutucu vardı. Gerçek pano `/grades`teydi ve yönetici nav'ında `/grades` **hiç yoktu** —
yetki nav'dan türetildiği için (`canAccessRoute`) adresi elle yazmak da işe yaramıyordu,
"yetkiniz yok" ekranı geliyordu. Ekran vardı, ona açılan tek kapı yoktu.

**Kök sebep bendeydi:** portu yaparken rotayı ölçmeden varsaydım. Nav girdisi `/grades`e
alındı, `/report-cards` sayfası silindi; dört rol de tek adresten giriyor.

### `B-34` · Öğrenciye öğretmenin defter listesi açılıyordu 🔴 *(kapandı)*

`GradePage` rol dağıtıcısının **varsayılan dalı** öğretmen ekranıydı. Öğrenci ve veli
yüzü daha tasarlanmamışken bu iki rol, sınıfın tüm öğrencilerinin notlarını tutan
öğretmen defterine düşüyordu. Rol dalları açık yazıldı; **varsayılan dal kaldırıldı ve bir
daha eklenmeyecek** — rolü çözülmemiş oturum boş kabuk görür.

### `B-35` · İdare panosunda "Aç" 404 veriyordu 🔴 *(kapandı)*

Pano satırlarının `bookId`'si ile defter ucunun tanıdığı id'ler **iki ayrı sahte veri
uzayından** geliyordu. Ölçüm ağ panelinden yapıldı: her "Aç" tıklaması 404 + yeniden deneme
üretiyordu. Sahte veri tek kaynağa indirildi (`findGradeBook`, ortak `asmIds`).

### `B-36` · "Son güncelleme" her satırda "0 dakika önce" 🟠 *(kapandı)*

Sahte kayıtların zaman damgaları **gelecek tarihliydi**; göreli zaman biçimlendiricisi
gelecek değerleri sıfıra kırpıyordu. Tohum damgaları "şimdi"ye göre kaydırıldı (`shiftToNow`).

### `B-37` · Notlar'daki "Not ayarları" bağlantısı 404'e gidiyordu 🔴 *(kapandı — 2026-08-22)*

**Ölçüm:** `/grades` (yönetici) → politika şeridinin sağındaki **"Not ayarları"** →
`/settings/policy`. Öyle bir Next rotası **yok**; tıklayan kullanıcı 404 görüyordu.

**Kök sebep — var olmayan bir rota haritası:** `packages/core/src/nav/nav-config.ts`
içinde `SETTINGS_TABS` adlı bir tablo `/settings/policy`, `/settings/holidays` gibi yedi
href tutuyordu. Bu href'lerin **hiçbirinin** karşılığı yoktu: Ayarlar tek sayfadır, sekmeler
sayfa içi state'ti ve hiç adreslenemiyordu. Tablo yalnız breadcrumb çözümünde kullanılıyor,
yani kimse oraya gitmediği sürece yalanı görünmüyordu. Notlar ekranı ona güvenince görüldü.

**İkinci ayak — yetkisiz role verilen bağlantı:** `GradePolicyBar`ın kendi sözleşmesi
*"yetkisiz rolde verilmez"* diyor, ama `GradePage` `onOpenSettings`i **her role** veriyordu.
Öğretmen `/settings`e erişemez (footer nav'ı boş); tıklasa "yetkiniz yok" ekranına düşerdi.
404 düzeltilseydi bu ikinci kusur ortaya çıkacaktı — biri diğerini saklıyordu
([[eksik-ekran-eksik-yetkiyi-gizler]]).

**Çözüm (merkezî, ekran bazlı değil — [[yamalama-kabul-degil]]):**
1. Ayarlar sekmesi **adrese taşındı**: `/settings?tab=policy`. Sekme artık URL'den okunur
   (`useSearchParams`), Devamsızlık kabuğundaki `?tab=` deseninin aynısı. Alt YOL değil
   SORGU seçildi: rota tek kalınca `canAccessRoute` tek girdiyle doğru karar veriyor ve
   breadcrumb tasarımdaki **"Sistem › Ayarlar › &lt;sekme&gt;"** biçimini koruyor.
2. Sekme bayrağı (*"kaydedilmemiş değişiklik"*) sekme anahtarıyla saklanıp **türetiliyor**;
   tarayıcı geri tuşuyla sekme değişince önceki sekmenin uyarısı bir kare bile taşınmıyor.
3. Bağlantı **yetkiye bağlandı** — ikinci bir izin tablosu değil, rolün nav'ı
   (`canAccessRoute(role, "/settings")`).
4. `SETTINGS_TABS` **silindi**. Var olmayan rotaların haritasını tutmak kusuru üretti,
   çözmedi; yerine neden silindiğini anlatan bir blok bırakıldı.

**Doğrulama:** yönetici oturumunda `/grades` → "Not ayarları" → `/settings?tab=policy`,
"Akademik Politikalar" sekmesi açık, breadcrumb *Sistem › Ayarlar › Akademik Politikalar*.
Sekmeler arası geçiş adresi güncelliyor, tarayıcı geri tuşu doğru sekmeye dönüyor.
675 test yeşil, `tsc` ve `eslint` temiz. *(Değişiklik henüz commit edilmedi.)*

**Ailesi:** `TB-71` (kabuk dışında kalan ekran), `TB-73` (var olan ekranı "yakında" gösteren
kısayol), `TB-74` ("Yoklamaya git" çıkmazı), `B-33` — hepsi **"ekran var, ona açılan kapı
yok ya da yanlış yere açılıyor"** ailesi. Bu ailenin beşinci üyesi; ortak sebep, bir ekranın
başka bir ekrana giden bağlantısının **hiç tıklanmadan** teslim edilmesi.

### `TB-79` · Notlar ekranında dönem seçicisi iki kopya 🟠 *(kapandı — 2026-08-22)*

Topbar'daki bağlam seçicisi ile `/grades` sayfa başlığındaki açılır liste **aynı bağlama**
(`useSeasonContext`) yazıyordu — iki kontrol, tek değer. Görünürdeki bedeli de vardı:
sayfa içi seçici dönemin `seasonLabel` alanından yılı yazdığı için **"2026–2027 · 1. Dönem"**,
topbar ise akademik sezon ucundan okuduğu için **"2025–2026 · 1. Dönem"** diyordu; kullanıcı
aynı ekranda iki farklı yıl görüyordu (aynı ayrışma seçici portlanırken `season-context-picker`
docblock'una not düşülmüştü, ekran tarafı temizlenmemişti).

**Çözüm:** sayfa içi seçiciler kaldırıldı — hem idare panosundan
(`grade-admin-board-screen`) hem öğretmen defter listesinden (`grade-book-list-screen`).
Bağlamı **tek kontrol yazar**: topbar seçicisi. Yönetici (`full`) ve öğretmen (`teacher`)
kiplerinin ikisi de menüde dönem kutucuklarını zaten çiziyor, yani kaldırma hiçbir rolü
kontrolsüz bırakmıyor. Öğretmen listesindeki dönem ADI alt özet şeridinde salt-okunur kaldı.

**Doğrulama:** topbar'dan "2. Dönem" seçildi → düğme *2025–2026 · 2. Dönem* oldu, pano
yeniden sorguladı. 675 test yeşil, `tsc`/`eslint` temiz. *(oksis-ui `3ebaf87` içinde.)*

**Ailesi:** [[besleyen-yuzey-olculmeden-kapanmaz]] · `X-15`, `B-26`, `TB-32` — *"bir soruya
iki kaynaktan cevap"*.

**Sıradaki boş ID:** `TB-82` · `X-17` · `B-38` · `D-15` · `V-04` · `E-17` · `ENG-03`

---

## 23. Depo Hijyeni (2026-08-23)

### `TB-80` · Obsidian panel durumu dört vault'ta izleniyordu 🟡 *(kapandı — 2026-08-23)*

`oksis` deposu Obsidian'ı hiç açmadan bile **kirli** görünüyordu: `docs/*/.obsidian/workspace.json`
dosyaları panel/sekme durumunu her açılışta yeniden yazar, makineye özeldir ve paylaşılacak
bir bilgi taşımaz. Dördü (`bugs-and-decisions`, `documents`, `ihtiyac-analizleri`,
`teknik-analizler`) izleniyordu.

**Kök sebep yamalanabilir cinsten değildi:** `.gitignore` kuralı **vault başına** yazılmıştı
(`docs/domain/.obsidian/workspace.json`) — yazıldığı gün tek vault vardı. Vault sayısı beşe
çıkınca kural sessizce eksik kaldı. Dört satır daha eklemek aynı tuzağı altıncı vault için
kurardı.

**Çözüm:** kural desene bağlandı — `docs/*/.obsidian/workspace*.json` — ve izlenen dört dosya
`git rm --cached` ile izlemden çıkarıldı (diskte duruyorlar). Yeni vault eklendiğinde
hatırlanacak bir şey kalmıyor. Commit: `oksis` `f4c3c92`.

**Ailesi:** [[yamalama-kabul-degil]] — *"aynı kusur birden çok yerdeyse merkezî çöz"*.

### `TB-81` · API, SQL Server açılmadan başlatılınca çöküyor 🟡 *(kapandı — 2026-08-23)*

Belirti: API açılışta `pre-login handshake` hatasıyla düşüyor (`Hata 35`, `SocketException (22)`),
yığın Hangfire'ın `SqlServerStorage.Initialize`'ında bitiyor ve süreç `terminated unexpectedly`
diyor. Görüntü "Hangfire bozuk" izlenimi veriyor; değil.

**Ölçüm:** kapsayıcı `09:27:44` UTC'de başladı, çökme `09:28:37`'de (53 sn sonra), `oksis_dev`
kurtarması (`Recovery is complete`) `09:29:15`'te bitti — yani API, veritabanı **kurtarma
altındayken** bağlanmayı denedi. Sunucu o aralıkta TCP'yi kabul ediyor ama oturum öncesi el
sıkışmayı tamamlamıyor. Aynı komut kurtarma bittikten sonra sorunsuz açıldı
(`Now listening on: http://localhost:5000`), yani kodda kusur yok — **yarış** var.

**Neden kendini gizledi:** compose sağlık ölçütü `SELECT 1` idi; bu yalnız "sunucu soket kabul
ediyor" der, `oksis_dev`in durumunu sormaz. `docker ps` "healthy" derken veritabanı hâlâ
kurtarmadaydı, dolayısıyla "altyapı hazır" sinyali yanlıştı.

**Çözüm:** ölçüt uygulamanın gerçekten kullandığı veritabanına bağlandı — `oksis_dev` kaydı
varsa `ONLINE` olmalı; yoksa (ilk kurulum, migration öncesi) kontrol geçer. `start_period: 90s`
eklendi (imaj bu makinede ~90 sn'de açılıyor). Üç dal da kapsayıcıda denendi: ONLINE → 0,
veritabanı yok → 0, RAISERROR → 1. Commit: `oksis-api` `ec50126`.

**Açık bırakılan:** API'nin kendisi hazır-bekleme yapmıyor; sağlıklı sinyal beklenmeden
başlatılırsa yine düşer. Fail-fast bilinçli bir tercih, bu yüzden koda dokunulmadı.

**Ailesi:** [[kural-ekranda-degil-sunucuda]] — *"yeşil gösterge ölçtüğü şey kadar doğrudur"*.

**Sıradaki boş ID:** `TB-82` · `X-17` · `B-38` · `D-15` · `V-04` · `E-17` · `ENG-03`

---

## 24. Not Modülü — Uçtan Uca Test (2026-08-25)

> **Kaynak:** Yerel uçtan uca test, `Notlar Bulguları;.md` (6 ham gözlem) ·
> `oksis-api` @ `82b0a88` · `oksis-ui` @ `ffdfd9f` · zemin: Atatürk AL · 11-A · 1. Dönem
> **Yöntem:** Her gözlem uç/DB/tarayıcı ölçümüyle köküne indirildi; kök bulunamayan
> madde yok. Doğrulama biçimi her maddede ayrıca yazılı.

### `B-38` · Öğretmen not politikasını **hiç** okuyamıyor 🔴 *(kapandı — 2026-08-25)*

Belirti (ham gözlem 2, birinci ayak): müdür Not Düzeltme Penceresi'ni değiştiriyor,
değer kaydoluyor, **öğretmen ekranına yansımıyor**.

**Kök sebep — öğretmen yüzü yönetici ucundan besleniyor.** `useGradePolicy()` iki
sorgunun projeksiyonudur: `useAcademicPolicy()` + `useGradeSettings()`
(`packages/api/src/grade/queries.ts:179`). Bunlardan ilki
`getAcademicPolicy()` üzerinden **`GET /api/v1/school-settings`** çağırır
(`packages/api/src/academic-policy/endpoints.ts:44`) — bu uç okul yönetimine ait.

Ölçüm (öğretmen `ogretmen.s2.02` tokenıyla):

| Uç | Öğretmen | Müdür |
|---|---|---|
| `GET /school-settings` | **403 Forbidden** | 200 |
| `GET /school-settings/grade-settings` | 200 · `correctionWindowHours: 9` | 200 · `9` |

Yani düzeltme penceresinin **kendi** ucu öğretmene açık ve doğru değeri veriyor;
projeksiyon onu 403 alan akademik yarı yüzünden çöpe atıyor:
`academic.data` `undefined` kalınca `useGradePolicy()` de kalıcı olarak `undefined`
döner. Öğretmen için politika **hiçbir zaman** gelmez — yanlış değer değil, **değer yok**.
Müdürün ne yaptığından bağımsız.

**Neden "yanlış değer" gibi göründü:** aynı projeksiyonda ikinci bir tuzak var —
`settings.data ?? DEFAULT_GRADE_SETTINGS`. Not ayarları gecikirse ya da reddedilirse
koda gömülü **48 saat** sessizce devreye giriyor (`packages/core/src/grade/constants.ts:122`).
Sunucunun söylediği 9 ile ekranın söylediği 48 arasındaki fark hiçbir yerde belirtilmiyor.

**Doğrulama:** iki uç curl ile ayrı ayrı çağrıldı; 403/200 ayrımı yukarıdaki tabloda.
DB'de `school.school_settings.grade_correction_window_hours = 9` (Atatürk AL,
`updated_at 2026-08-25 14:14`) — yazma tarafı sağlam, kusur **okuma** tarafında.

**Ailesi:** [[kural-ekranda-degil-sunucuda]] · [[besleyen-yuzey-olculmeden-kapanmaz]] —
*"okuma ekranı doğru diye onu besleyen uç doğru sayılmaz"*. `X-17`'nin birinci ayağı.

**Çözüm — projeksiyon sunucuya taşındı.** İstemcide iki sorguyu birleştiren
`useGradePolicy` kaldırıldı; yerine **tek okuma ucu** geldi:
`GET /api/v1/grades/policy` (`GetGradePolicyQuery`, `grades.read`). Altı alanı
(`scaleMax`, `passingGrade`, `writtenWeight`, `performanceWeight`,
`correctionWindowHours`, `showClassAverage`) sunucu birleştirir. Alanların
YÖNETİMİ yerinde kalır — skala/geçme notu/ağırlık `academic-policy`, görünürlük/
pencere `grade-settings`; yeni uç SALT OKURDUR, yani "aynı alan iki yerden
yönetilmez" kuralı korunur.

İki yan kazanç: (1) `scaleMax` artık istemcinin sabiti değil, okulun gerçek
skalasından (`SchoolSettings.DefaultGradeScaleId` → `GradeScale.MaxValue`)
okunuyor; tanımsızsa MEB varsayılanına **sunucuda** düşülüyor. (2) Sessiz yedek
kaldırıldı: politika okunamazsa `data` `undefined` kalır, 48 saat uydurulmaz.

**Doğrulama:** dört rolde de uç ölçüldü (öğretmen/veli/öğrenci/müdür → `200`,
`correctionWindowHours: 9`). Tarayıcıda öğretmen oturumu: politika şeridi
*"düzeltme penceresi 9 saat"*, ağ kaydında tek istek `/api/v1/grades/policy` →
`200`; `/school-settings` çağrısı YOK (eskiden 403 alan istek). Mobil aynı
kancayı kullandığı için o ayak da bedelsiz düzeldi.

**Ailesi:** `X-17`'nin "aşağı doğru" ayağı — kapandı.

### `B-39` · Ayar formu geç gelen veriyle tazelenmiyor, varsayılana kilitleniyor 🔴 *(kapandı — 2026-08-25)*

Belirti (ham gözlem 2, ikinci ayak): müdür çıkış-giriş yapınca Not Düzeltme Penceresi
**eski değere dönüyor**.

**Kök sebep — tek seferlik tohum.** `PolicyTab` iki sorguyu paralel açar ama formu
**yalnız akademik politika** gelir gelmez kurar:

```
<PolitikaForm key={data.defaultPassingScore} gradeSettings={grade.data ?? DEFAULT_GRADE_SETTINGS} …/>
```

`useSettingsForm` başlangıç değerini `useState(initial)` ile **bir kez** alır ve prop
değişimini dinleyen hiçbir `useEffect` yoktur (`apps/web/features/settings/parts.tsx`).
Yeniden kurma anahtarı (`key`) ise `defaultPassingScore` — yani **akademik politikanın**
alanı; not ayarları sonradan gelse bile bileşen yeniden kurulmaz.

Sonuç: not ayarları sorgusu akademik politikadan **sonra** çözülürse form,
`DEFAULT_GRADE_SETTINGS`e (48 saat + varsayılan görünürlük kümesi) kilitlenir ve
gerçek veri geldiğinde **düzelmez**. Soğuk açılışta (çıkış-giriş) sıra bozulma ihtimali
en yüksektir — kullanıcının tarifi bu yüzden "çıkış giriş yapınca eski değer".

**Doğrulama (yeniden üretildi):** Playwright ile `**/grade-settings**` isteği 6 sn
geciktirildi, sayfa soğuk yüklendi:

| An | Alanın gösterdiği |
|---|---|
| 2,5 sn (istek yolda) | **48** |
| 9,5 sn (istek 200 döndü, değer 9) | **48** — düzelmedi |

Gecikme olmadan aynı sayfa 9 gösteriyor; yani hata **aralıklı**, ekran bazlı bir
"bazen olmuyor" değil, yarışın kaybedildiği her yüklemede kesin.

**İkincil zarar:** form 48'e kilitliyken müdür görünürlük ayarını değiştirip Kaydet'e
basarsa, `updateGradeSettings.mutate(gradeValues)` **tüm nesneyi** gönderir —
dokunmadığı 9 saatlik pencere sessizce 48 olur. Kaydet `gradeForm.dirty` ile korunuyor,
yani sadece akademik politika kaydedildiğinde bu olmaz; ama not alanlarından **herhangi
biri** kirlendiğinde bayat pencere de yazılır.

**Ailesi:** `B-38` ile aynı varsayılan (`48`) iki farklı yoldan sızıyor — [[yamalama-kabul-degil]]:
tek tek ekran düzeltmek yerine "sunucu veriyi verene kadar form kurulmaz" kuralı gerekiyor.

**Çözüm — form veri gelmeden KURULMUYOR.** `PolicyTab` artık iki sorgunun da
verisini bekler (`isPending || grade.isPending → iskelet`); not ayarları
okunamazsa varsayılana düşmek yerine hata + "Tekrar dene" gösterilir. Yeniden
kurma anahtarı da sunucu değerini içerir, yani başka bir sekmeden yapılan kayıt
formu tazeler; değer aynı kaldığı sürece anahtar sabittir ve arka plan
tazelemesi kullanıcının yazdığını silmez. `DEFAULT_GRADE_SETTINGS` bu ekrandan
tamamen çıktı.

**Doğrulama (aynı deney, tersi sonuç):** `**/grade-settings**` isteği 6 sn
geciktirilip sayfa soğuk yüklendi — 2,5 sn'de form HİÇ çizilmedi (iskelet),
veri gelince alan **9** gösterdi. Öncesinde aynı deney 2,5 sn'de de 9,5 sn'de de
48 gösteriyordu.

### `B-40` · Sütun menüsü, yöneticiye **yapamayacağı** yayını sunuyor 🔴 *(kapandı — 2026-08-25)*

Belirti (ham gözlem 4): müdür bir sütunu öğretmen adına yayınlamak istiyor; gerekçe
sorulmuyor ve onayda *"Kayıt bulunamadı; bu arada silinmiş ya da taşınmış olabilir."*
hatası geliyor. Ham yanıt: `Error.NotFound`.

**Kök sebep — kapı herkese açık, oda öğretmene ait.** Sütun menüsündeki düz **"Yayınla"**
maddesi `{admin && …}` bloğunun **dışındadır** (`apps/web/features/grade/grade-grid-screen.tsx:156`);
yalnız `locked || status !== "draft"` ile kapatılır. Yani taslak bir sütunda müdür de
onu etkin görür ve tıklayınca **öğretmenin** yayın diyaloğunu açar (ekran görüntüsündeki
başlık *"1. Yazılı notlarını yayınla"* — yönetici diyaloğu olsaydı *"… Levent Koç adına
yayınla"* derdi).

Sunucu tarafı ise bunu bilerek reddediyor. `PublishAssessmentCommandHandler` yayın kapısını
**yazma kapsamına** bağlar ve docblock'unda açıkça yazar: *"Yönetici bunu `:publish-for`
ile yapar, bu uçtan değil."* Kapsam başarısız olunca `Result.NotFound` döner.

**Doğrulama (yan etkisiz):** Matematik öğretmeni `ogretmen.s2.02` ile **Türkçe** sütunu
(`…8a61a296….f715d19a…`) `:publish` uçundan yayınlanmaya çalışıldı → `HTTP 404`,
`Error.NotFound` — kullanıcının yapıştırdığı gövdeyle **birebir aynı**. Müdür de aynı
kapsam kontrolünden geçemediği için aynı yanıtı alır. Yönetici yolunun kendisi
(`GradePublishForDialog` → gerekçe → `:publish-for`) doğru bağlanmış durumda; kusur
**yanlış maddenin sunulmasında**.

**İkinci ayak — hata metni yanıltıyor.** Sunucu kapsam reddini kasıtlı olarak `NotFound`
ile örtüyor (varlık sayımını engellemek makul bir tercih), ama istemci bunu
*"bu arada silinmiş ya da taşınmış olabilir"* cümlesine çeviriyor. Kullanıcıya verinin
kaybolduğu söyleniyor; gerçek *"bu uçtan siz yayınlayamazsınız"*. `B-38`'de olduğu gibi
sunucunun sustuğu yeri istemci uyduruyor.

**Ailesi:** `X-17`'nin ikinci ayağı. `TB-71`/`TB-73`/`TB-74`/`B-33` ailesinin **aynası**:
o aile *"ekran var, kapı yok"* diyordu; bu madde *"kapı var, arkasında yetki yok"*.

**Çözüm — yazma yüzeyini sunucu açıyor.** `GradeGridDto` artık `canWrite`
taşıyor; değeri `IGradeBookScope.CanWriteAsync`in kendisidir. Ekran yazma
maddelerini (**Yayınla · Sınav tarihi ayarla · Sütunu temizle** — üçü de sunucuda
AYNI kapıdan geçer) ve hücre yazılabilirliğini bu bayraktan sürüyor; `admin`
prop'undan TÜRETMİYOR. Kapı kapalıysa madde devre dışı değil, hiç çizilmiyor:
devre dışı bir madde "bir gün olur" vaadidir, oysa yönetici için bu asla
açılmaz — onun yolu "Başkası adına yayınla".

Sütun DURUMU bilerek bozulmadı. Kolay çözüm olan "yönetici kipinde tüm sütunları
locked say" denenmedi, çünkü yöneticinin KENDİ eylemleri sütun durumuna bağlı
(`Yayını geri al` yayınlanmış, `Başkası adına yayınla` taslak ister) — o yol
kusuru düzeltirken yönetici yüzünü sessizce kapatırdı.

**Doğrulama:** uç düzeyinde `canWrite` öğretmende `true`, müdürde `false`.
Tarayıcıda müdür menüsü: yazma maddeleri YOK, yalnız *Excel'e aktar* + yönetici
bölümü. Öğretmen menüsü dört maddesiyle tam, hücreler yazılabilir (gerileme yok).
Kapsam kapısının 404'ü yan etkisiz doğrulandı: Matematik öğretmeni Türkçe
sütununu `:publish`ten yayınlamayı denedi → `HTTP 404 Error.NotFound`, kullanıcının
yapıştırdığı gövdeyle birebir aynı.

**Açık bırakılan:** reddin METNİ. Sunucu kapsam reddini `NotFound` ile örtüyor
(varlık sayımını engelleyen bilinçli tercih) ve istemci bunu *"bu arada silinmiş
ya da taşınmış olabilir"* diye çeviriyor. Menü kapandığı için bu yol artık
arayüzden tetiklenmiyor, ama görevlendirmesi oturum ortasında değişen bir
öğretmen hâlâ bu cümleyi görebilir. Düzeltmesi tek modüle yamalanacak bir iş
değil — bkz. `X-17`.

**Ailesi:** `X-17`'nin "yukarı doğru" ayağı. `TB-71`/`TB-73`/`TB-74`/`B-33`
ailesinin aynası.

### `B-41` · Excel'e aktarma isteği token taşımıyor → 401 🔴 *(kapandı — 2026-08-25)*

Belirti (ham gözlem 5): "Excel'e aktar" → *"Bağlantınızı kontrol edip yeniden deneyin."*
DevTools: `export` isteği **401**, başlatıcı `endpoints.ts:345`.

**Kök sebep — paylaşılan istemci atlanmış.** `exportGradeBook`
(`packages/api/src/grade/endpoints.ts:344`) `getClient()` yerine **ham `fetch`** kullanıyor:

```
await fetch(`/api/v1/grades/books/${…}/export`, { credentials: "include" })
```

`Authorization: Bearer …` başlığını ekleyen tek yer istemci ara katmanıdır
(`packages/api/src/client/auth-refresh.ts:88`). Ham `fetch` oradan geçmediği için istek
**kimliksiz** gider; API çerezle değil taşıyıcı token ile kimlik doğruladığından 401 kesin.
`credentials: "include"` bu mimaride hiçbir şey taşımıyor.

İkinci kayıp: aynı ara katman 401'de token yenileyip isteği **bir kez tekrarlar**
(`auth-refresh.ts:120`). Dışa aktarma bu kurtarmadan da mahrum — süresi dolmuş token
senaryosunda diğer tüm ekranlar kendini toparlarken bu düğme düşer.

**Neden ağ hatası gibi göründü:** `if (!response.ok) throw new Error("Defter dışa
aktarılamadı.")` — durum kodu yutuluyor, arayüz jenerik bağlantı metnine düşüyor.
Kimlik hatası ağ hatası kılığında.

**Not:** docblock ham `fetch` tercihini *"yanıt zarf DEĞİL, ham dosyadır"* diye
gerekçelendiriyor. Gerekçe doğru ama sonuç yanlış: zarf açmamak için `unwrap`'ten
kaçınmak yeterliydi, **istemciden** kaçmak gerekmiyordu.

**Ailesi:** [[yamalama-kabul-degil]] — düğmeye token elle eklemek yaması değil, blob
indiren istekler için ortak bir yol gerekiyor (aynı desen ileride karne/rapor
indirmelerinde tekrar edecek).

**Çözüm — istek paylaşılan istemciye alındı.** `exportGradeBook` artık
`getClient().GET(..., { parseAs: "blob" })` kullanıyor; böylece Bearer başlığı,
401'de tek-uçuşlu token yenileme, `baseUrl` ve enjekte edilebilir `fetch`
(testlenebilirlik) hepsi birden geliyor. Zarf açma için `unwrapBlob`
eklendi (`client/request.ts`): başarıda gövde dosyanın kendisi, hatada normal
zarf → `unwrap` ile AYNI `ApiError`. Yani "Bağlantınızı kontrol edin" yerine
gerçek ret cümlesi çıkıyor.

Yardımcı bilerek `grade/` altına değil `client/` altına yazıldı: karne ve rapor
indirmeleri aynı deseni tekrar isteyecek ([[yamalama-kabul-degil]]).

**Ölçüm testte de yakalandı:** ham `fetch` göreli yol kullandığı için test
ortamında `TypeError: Invalid URL` veriyordu — yani bu uç web dışında,
**mobilde hiç çalışmıyordu**; kusur 401'den ibaret değilmiş.

**Doğrulama:** 4 yeni test (yapılandırılmış fetch + baseUrl, `Authorization`
başlığı, blob dönüşü, hata dalında `ApiError`). Tarayıcıda: istek
`Bearer eyJhbGciO…` taşıyor, yanıt **200**, `11-A-Bilgisayar.xlsx` gerçekten indi.

### `D-15` · Son satırın doğrulama uyarısı yapışkan alt satırın altında kalıyor 🟠 *(kapandı — 2026-08-25)*

Belirti (ham gözlem 1): 0–100 dışı değer girilince uyarı çıkıyor, ama **en alttaki
öğrencide** yarısı kesiliyor (ekran görüntüsünde Özge Kılıç'ınki okunuyor, Veli
Doğan'ınki "Sınıf ortalaması" satırının altında kayboluyor).

**Kök sebep — iki kural çarpışıyor:**

| Kural | Yer |
|---|---|
| `.grg-cellerr { position: absolute; top: calc(100% + 2px); }` — **z-index yok** | `grade.css:285` |
| `.grg-tbl tfoot td { position: sticky; bottom: 0; z-index: 5; background: … }` | `grade.css:290` |

Uyarı hücrenin **altına** çiziliyor; son satırda o alan tam olarak yapışkan tfoot'un
kapladığı yer. tfoot `z-index: 5` ve **opak zemin** taşıdığı için uyarıyı boyayarak
örtüyor. Ayrıca `.grg-wrap { overflow: auto }` kaydırma kabı, taşan kısmı kırpıyor —
yani iki farklı mekanizma aynı anda saklıyor.

**Neden önemli:** kırpılan şey dekor değil, **kullanıcının yaptığı hatanın açıklaması**.
Son satır her defterde vardır; sekiz öğrencinin sekizde biri bu kusuru her seferinde görür.

**Ailesi:** `D-16` ile aynı kök — yapışkan/kaydırmalı ızgaranın içinde **taşan** parça
çizmek. İkisi de "ızgara dışına taşan katman" kuralı gerektiriyor.

**Çözüm — z-index + opak zemin.** Uyarı altlığın en yükseğinin (tfoot
`c-stu`/`c-avg` = 7) üstüne çıkarıldı (`z-index: 8`) ve okunurluk için opak
zemin + ince kırmızı çerçeve + gölge verildi; çıplak kırmızı metin altlığın
kendi yazısının ("Sınıf ortalaması 22,7") üzerine binerdi. `pointer-events: none`
eklendi ki geçici bir uyarı altlığa tıklamayı engellemesin.

**Doğrulama:** son satıra `130` yazıldı; uyarı altlık satırıyla ÇAKIŞIYOR
(`altlıkla çakışma: true`) ama artık üstte ve tam okunur — ekran görüntüsüyle
görüldü, kaydırma kabının içinde kalıyor.

### `D-16` · Sütun menüsü kaydırma kabı tarafından kırpılıyor 🟠 *(kapandı — 2026-08-25)*

Belirti (ham gözlem 3): "⋮" menüsü açılıyor ama sol kenarı kesik
(*"YÖNETİCİ İŞLEMLERİ"* → *"ÖNETİCİ İŞLEMLERİ"*) ve alt kısmı görünmüyor.

**Kök sebep:** `.gr-menu` mutlak konumlu (`grade.css:169`) ve yapışkan `th` içindeki
`.gr-menuwrap`'e göre yerleşiyor. Mutlak konumlu bir katman, `overflow` tanımlı **her**
atası tarafından kırpılır:

- `.grg-wrap { overflow: auto; max-height: calc(100vh - 340px) }` → **altını** kırpar
- `.grg-card { overflow: hidden }` → yatay kaydırmada **solunu** kırpar

Menü uzadıkça (yönetici kipinde 8 madde) kırpılma kaçınılmaz hâle geliyor; yönetici
menüsü en uzun olan olduğu için kusuru en çok **yönetici** görüyor.

**Çözüm yönü:** menüyü ızgaranın DOM'undan çıkarmak — portal + `position: fixed`
(ya da native popover / CSS anchor positioning). `overflow`'u gevşetmek çözüm değil:
ızgaranın kaydırması ve yapışkan başlıkları ona bağlı.

**Ailesi:** `D-15` ile ortak kök.

**Çözüm — menü ızgaranın DOM'undan çıkarıldı.** `packages/ui`'ye
`AnchoredMenu` eklendi: portal + `position: fixed`, tetikleyicinin
`getBoundingClientRect()`ine sağa hizalanır, aşağıda yer kalmazsa yukarı açılır,
her hâlde `max-height` ile ekran dışına taşmaz. Dışarı tıklama, `Escape` ve
kaydırma/yeniden boyutlandırmada konum tazeleme bileşenin içinde
(`scroll` dinleyicisi `capture: true` — ızgaranın İÇ kaydırıcısı `window`'a
baloncuk göndermez).

`overflow` gevşetilmedi: ızgaranın kaydırması ve yapışkan başlık/altlık satırları
ona bağlı. Bileşen `apps/web` içine değil `packages/ui`'ye yazıldı — aynı desen
ızgara sütun menüsünde ve defter listesi satır menüsünde kullanılıyor, ikisi de
buna geçirildi.

**Doğrulama:** yönetici kipinde (en uzun menü) ölçüldü — `portalda: true`,
`position: fixed`, `tam görünür: true`. Öğretmen kipinde de tam görünür.

### `E-17` · Profil değiştirme: bütün altyapı var, **düğme yok** 🔴 *(kapandı — 2026-08-25)*

Belirti (ham gözlem 6): çift profilli hesapta (öğretmen + veli) test senaryosu profil
geçişinden söz ediyor, ekranda böyle bir yol bulunmuyor. Kullanıcı menüsünde
*Profilim · Hesap Ayarları · Bildirim Tercihleri · Gizlilik & Güvenlik · Çıkış Yap* var,
profil geçişi **yok**.

**Ölçüm — zincir son adım hariç tamam:**

| Katman | Durum |
|---|---|
| `POST /api/v1/auth/account/switch-profile` | var (üretilmiş şemada kayıtlı) |
| `switchProfile()` istemci fonksiyonu | var — `packages/api/src/auth/endpoints.ts:86` |
| `useSwitchProfile()` kancası | var — token setini kalıcılaştırıp önbelleği tazeliyor |
| Kancayı çağıran ekran | **yok** — `apps/web` ve `apps/mobile/src` içinde sıfır çağrı |

Yani eksik olan tek şey bir düğme. Giriş anında profil seçimi çalışıyor
(`needsProfileSelection` → `Parent`/`Teacher`), ama oturum açıldıktan sonra öbür profile
geçmenin yolu **çıkıp yeniden girmek**.

**Bunun sakladığı ikinci soru:** profil geçişi hiç çağrılmadığı için, geçiş sonrası
izin/bağlam tazelemesinin doğru çalışıp çalışmadığı da **hiç ölçülmemiş** durumda
([[eksik-ekran-eksik-yetkiyi-gizler]]). Düğme eklendiğinde ilk iş bu olmalı.

**Not:** aynı eksik **mobilde de** var — kanca orada da çağrılmıyor. Yani bu web'e özgü
değil, ortak bir boşluk.

**Çözüm — hem web hem mobil.** `useSwitchProfile` zaten hazırdı; eksik olan
ekran eklendi:
- **Web:** kullanıcı menüsüne "Profil değiştir" bölümü (`app-shell.tsx`).
- **Mobil:** "Daha fazla" ekranına "Profil" bölümü; satırın rengi GEÇİLECEK
  profilin portal rengi.

İkisinde de bölüm yalnız `availableProfiles.length > 1` iken çizilir, aktif
profil işaretli ve tıklanamaz, geçişten sonra köke dönülür (yeni profilin sekme/
menü seti farklı; bulunulan rota o profilde açık olmayabilir). Profil listesi
giriş yanıtından değil `auth/me/context`ten okunur — sayfa yenilendiğinde giriş
yanıtı elde olmaz.

**Doğrulama (web, uçtan uca):** çift profilli hesapta menüde *Veli* (aktif,
kapalı) ve *Öğretmen* göründü; *Öğretmen*e basıldı → `switch-profile` **200**,
üst bar rolü *Öğretmen* oldu ve kenar menüsü öğretmen setine döndü
(`/roll-call`, `/grades`, `/teacher-assignments`). Yani maddede "hiç ölçülmemiş"
denen **geçiş sonrası izin/bağlam tazelemesi de doğrulanmış oldu**.

**Doğrulanmayan:** mobil ekran çalışma zamanında AÇILAMADI — simülatörü
tıklamayla sürmek erişilebilirlik izni istiyor, bu oturumda yok. Değişiklik
`tsc` + `eslint` temiz ve aynı kanca web'de uçtan doğrulandı; mobil yüzeyin
kendisi gözle görülmedi.


---

## 25. Ödev Modülü — Kod Taraması (2026-08-26)

> **Kaynak:** Ödev modülü teknik analizi için yapılan kod taraması ·
> `oksis-api` @ `6b7331a` · `oksis-ui` @ `9fe0d7a`
> **Yöntem:** Sözleşme (`contract.ts`) ↔ mock handler ↔ ekran ↔ backend kodu
> dört yönlü karşılaştırıldı. Ekran testi değil; bulguların hiçbiri gezinmeyle
> görünmez — hepsi ancak işlem tamamlanınca ya da kod okununca ortaya çıkıyor.
> Analiz: `oksis-api/docs/analysis/odev-modulu-teknik-analiz.md`

### `B-42` · Öğrencinin ödev fotoğrafı yükleme akışı kırık 🔴 *(kapandı — 2026-08-27)*

Ekran 5 (Ödev Detayı + Görsel Teslim) fotoğrafı iki adımda gönderiyor: önce
`POST /api/v1/files`, sonra dönen `fileId`'yi ödeve bağlıyor. Birinci adım
**hiçbir ortamda başarılı olamıyor**.

`homework-self-detail-screen.tsx:184` kategoriyi `'homework'` diye gönderiyor.
Böyle bir kategori iki tarafta da yok:

| Taraf | Kayıt defteri | `'homework'` gönderilince |
|---|---|---|
| Backend | `FileCategoryPolicyRegistry` — 8 kategori; doğrusu **`AssignmentSubmission`** | `file.category.unknown` |
| Mock | yalnız `AnnouncementAttachment` tanınıyor (`file-handlers.ts:154`) | **422 `FILES_CATEGORY_UNKNOWN`** |

İronik olan: mock'un kendi yorumu sekiz kategoriyi **tek tek sayıyor** —
`AssignmentSubmission` de listede. Bilgi oradaydı, ekran yanlış dizgiyi yazdı.

**Neden gezinmeyle görünmedi:** Faz B doğrulaması Expo web hedefinde ekranları
dolaşarak yapıldı; yükleme kartı, karolar ve "2/5 dosya" sayacı fixture'dan
geldiği için doğru görünüyor. Hata ancak **dosya seçildikten sonra** doğuyor.

**Düzeltme (2026-08-27) — önerildiği gibi yapıldı.** Dizgi artık
`@workspace/core :: HOMEWORK_SUBMISSION_CATEGORY` = `"AssignmentSubmission"`;
uzantı/MIME/boyut değerleri de aynı yerde ve **kayıt defterinden birebir
kopyalandı** (pdf/docx/jpg/png, 20 MB) — mock ile istemcinin iki ayrı kopyaya
bölünmesini engellemek için, `HOMEWORK_ATTACHMENT_*` ile aynı kalıp.

Mock kategoriyi politika tablosuna aldı. Öğrenci teslimi ile öğretmen eki AYRI
iki satırdır: sınırları bugün aynı olsa da sahibi ve saklama gerekçesi farklı
(materyal ≠ kişisel veri), tek satıra indirmek ikisini eşitlemek olurdu.

**Kilitleyen iki test** (`file-handlers.test.ts`): doğru kategori 200 ve
`category` alanı `"AssignmentSubmission"` dönüyor; tahmin edilen `'homework'`
adı 422 `FILES_CATEGORY_UNKNOWN` alıyor. İkincisi kasıtlı — hatanın tekrar
etmesi test kırar.

**Doğrulama gezinmeyle DEĞİL, gerçek yüklemeyle yapıldı** (bulgunun kendi
dersi): web hedefinde öğrenci rolüyle "Fonksiyon grafikleri çalışması" açıldı,
kaynak sayfasından bir PNG seçildi, kart "1/5 dosya"ya döndü. İki adımın ikisi
de geçti.

**Backend'de açılacak bir şey yok** — `AssignmentSubmission` kayıt defterinde
zaten vardı. Bu, `HomeworkAttachment`ın tersidir (o kategori gerçekten yok ve
açılması gerekiyor); ikisi karıştırılmamalı, bkz.
`oksis-ui/docs/backend-needs-homework.md §3.4` ve `§3.4.1`.


### `TB-85` · Tanımlanmamış `--on-accent` token'ı seçili çipleri okunmaz yapıyordu 🟠

Ödev CSS'inde `--on-accent` diye bir token dört yerde kullanılıyor ama **hiçbir
yerde tanımlı değil** (depo genelinde `grep`: yalnız bu dört kullanım).

Tanımsız değişken `color` özelliğini *invalid at computed-value time* yapar ve
özellik `inherit`e düşer. Sonuç:

| Kural | Belirti |
|---|---|
| `.hw-chip.on` | Seçili şube/teslim çipi: lacivert zeminde **siyah metin** |
| `.hw-chip.dashed.on` | "Takvimden seç" çipi seçiliyken aynı |
| `.hw-pop-tab.on` | Öğrenci seçici sekmesi aynı |
| `.hw-row[aria-checked="true"] .hw-check` | **Onay tiki hiç görünmüyor** (transparent'tan devralıyor) |

Token, port sırasındaki "marka kapısı" geçişinde uydurulmuş; dosyanın kendi
başlık yorumu o geçişin üç ham hex'i token'ladığını söylüyor ama dördüncü olarak
**var olmayan** bir token ürettiğini yazmıyor. Doğru karşılık `--white`.

**Düzeltildi** (2026-08-26, `oksis-ui`): dört kullanım `var(--white)` yapıldı ve
başlık yorumuna düzeltme notu eklendi. Ekran bazında değil tek noktada — aynı
token dört ayrı yüzeyi birden bozuyordu.

**Ders:** tanımsız CSS değişkeni sessizdir. Ne derleyici ne lint yakalar; yalnız
ekrana bakan görür ve "kontrast tercihi" sanabilir.

### `TB-86` · Mock modunda tema ilk boyamada uygulanmıyordu 🟡

Belirti (Next.js 16 konsol uyarısı): *"Encountered a script tag while rendering
React component. Scripts inside React components are never executed when
rendering on the client."* — `ThemeProvider → Providers → RootLayout`.

**Kök sebep uyarının kendisi değil, `Providers`in kapı sırasıydı.**
`app/providers.tsx` bütün ağacı MSW hazır olana kadar kesiyordu:

```tsx
if (!ready) return null          // mock AÇIKKEN ilk render'da true değil
return <ThemeProvider>…</ThemeProvider>
```

Mock açıkken `ready` başlangıçta `false`, dolayısıyla `ThemeProvider` sunucuda
**hiç** render edilmiyor, ilk kez istemcide doğuyordu. İki sonucu:

1. `next-themes`in flash önleyici `<script>`i ilk HTML'e girmiyordu. İstemci
   render'ında yaratılan script ASLA çalışmaz; Next 16 bunu uyarıyor.
   **Ölçüldü:** mock açıkken SSR çıktısında `localStorage.getItem` geçmiyordu.
2. **Asıl kusur:** `color-scheme: light` ilk boyamada yazılmıyordu. İşletim
   sistemi koyu moddayken tarayıcı, ağaç mount olana kadar koyu kaydırma
   çubuğu ve koyu form kontrolü çiziyordu — `forcedTheme="light"`in önlemek
   için konduğu hâlin ta kendisi (bkz. `theme-provider.tsx` yorumu). Yani
   uyarı, yarım kalmış bir düzeltmenin habercisiydi.

Mock KAPALIYKEN sorun yok: `ready` baştan `true`, sağlayıcı sunucuda render
ediliyor, script HTML'e giriyor.

**Düzeltildi** (2026-08-26, `oksis-ui`): tema sağlayıcısı mock kapısının
DIŞINA alındı; bekleme yalnız veri katmanını (`QueryClientProvider`) geciktiriyor.
Doğrulama: SSR çıktısında script var, konsolda uyarı yok, `<html>` üzerinde
`data-theme="light"` + `color-scheme: light`.

**Not — açık kalan:** mock modunda `!ready` iken sayfa hâlâ boş dönüyor, yani
her yüklemede kısa bir boş ekran var. Ayrı bir konu; bu maddede kapsanmadı.

### `TB-87` · Mock modunda her sayfa yüklemesinde boş ekran 🟡 *(kapandı — 2026-08-26)*

`TB-86`nın altında duran ikinci kusur. `Providers` bütün ağacı MSW hazır olana
kadar kesiyordu:

```tsx
if (!ready) return null
```

Gerekçesi meşruydu: worker hazır olmadan giden istek gerçek proxy'ye düşer ve
mock'un cevaplayacağı uç 404/401 döner. Ama bedeli, mock açık HER yüklemede
uygulamanın hiç çizilmemesiydi — kabuk, kenar çubuğu, başlık, iskeletler dâhil.

**Kapı yanlış katmandaydı.** Beklemesi gereken arayüz değil AĞDIR: ekranların
hepsinin kendi yükleniyor iskeleti zaten var.

**Düzeltme:** bekleme taşıma katmanına indirildi. `configureApi` mock modunda
worker'ı bekleyen bir `fetch` sarmalayıcısı alıyor; ağaç anında render ediliyor.
`NEXT_PUBLIC_API_MOCKING` derleme anında gömüldüğü için mock kapalıyken
sarmalayıcı hiç üretilmiyor — üretimde tek fazladan `await` yok.

Worker'ın başlatılması tekil bir söze bağlandı (`mockServiceWorkerReady`), yani
kaç çağrı olursa olsun bir kez başlıyor. Senaryo barının kalıcı seçimi de o
sözün içinde geri uygulandığı için "ilk istek doğru senaryoyu görür" garantisi
korunuyor — eski render kapısının verdiği garantinin ta kendisi.

**Doğrulama:** "Liste yükleniyor" senaryosu açıkken sayfa yeniden yüklendi;
kenar çubuğu, başlık, araç çubuğu ve iskelet kartlar görünüyor, veri beklerken
ekran boş değil. Mock kapalıyken davranış değişmedi.

### `TB-88` · Öğrenci/veli ödev listesi ekranın ortasından başlıyordu 🟡 *(kapandı — 2026-08-27)*

Öğrenci ve veli "Ödevlerim" ekranlarında ders çipi şeridinin altında yarım
ekranlık boşluk kalıyor, kartlar ekranın ortasına iniyordu. Öğretmen ekranında
sorun yoktu.

**Kök neden ekranda değil, React Native'in kendi taban stilinde.** `ScrollView`
yatay kipte de `flexGrow: 1` taşıyor:

```js
baseHorizontal: { flexGrow: 1, flexShrink: 1, flexDirection: 'row', ... }
```

Bu iki ekranda çip şeridi, `flex: 1` bir kabın içinde `SectionList` ile
KARDEŞ. İkisi de büyüyebildiği için boştaki dikey alanı paylaşıyorlar: şerit
kendi içeriğinin kat kat üstünde yer kaplıyor, liste aşağı itiliyor. Öğretmen
ekranı bundan etkilenmedi çünkü orada yatay şerit dikey bir `ScrollView`un
içeriğinde duruyor — orada paylaşılacak boş alan yok.

Aynı stil hem `react-native` hem `react-native-web` tarafında olduğu için bu
web hedefine özgü bir yanılsama DEĞİL; cihazda da aynı şekilde bozuktu.

**Düzeltme merkezî.** İki ekranda birebir aynı `SubjectChip` kopyası ve iki ayrı
`ScrollView` vardı; ikisi de silinip `self-parts.tsx` içinde tek bir
`SubjectChipRow` bileşenine taşındı. `flexGrow: 0` orada, gerekçesiyle birlikte
tek yerde duruyor — sonraki yüzey de aynı şeridi kullanacağı için hata tekrar
edemez.

**Ders:** kopyalanan bir düzen parçası, kopyalandığı yerdeki kabın davranışını
taşımaz. Aynı şerit bir yerde masum, bir yerde ekranı ikiye bölüyor.

**Doğrulama:** web hedefinde öğrenci rolüyle "Ödevlerim" açıldı; "BUGÜN SON"
başlığı çip şeridinin hemen altında, dört bölüm de kaydırmasız görünüyor.

### `TB-89` · Öğrenci ödev detayı tasarımın dört parçasını eksik portlamıştı 🟡 *(kapandı — 2026-08-27)*

Ekran "çalışıyordu" ama tasarımla yan yana konunca dört ayrı kayıp çıktı.
Üçü tek başına küçük; birlikte ekranın söylediği şeyi değiştiriyorlardı.

**1. Son teslim satırı kısaydı.** "Son: yarın" yazıyordu, tasarımda
"Son: yarın, 16 Eylül". Listede kısa yazım doğrudur — satır bir bağlam
içindedir. Detay ise ödevin TEK kaydıdır ve öğrenci oraya "tam olarak hangi
gün?" diye bakar. Core'a `homeworkDueLabelLong` eklendi; yakın günün adı
DÜŞMÜYOR, çünkü "16 Eylül" tek başına yarın olduğunu söylemez.

**2. "Güncellendi: dün" hiç portlanmamıştı — çünkü sözleşmede yoktu.**
Ödev yayınlandıktan sonra düzenlendiyse öğrencinin bunu bilmesi gerekir:
açıklama değişmiş olabilir ve öğrenci eski metne göre çalışıyor olabilir.
Alanı taşıyan hiçbir uç yoktu. `updatedAtLabel: string | null` iki detay ucuna
eklendi (öğrenci + aile), mock'a bağlandı, `backend-needs-homework.md §3.3.1`e
yazıldı. Hazır metin, ham damga değil — "dün"ü cihazın saat diliminde
hesaplamak ödevin takvimini cihaza devretmek olurdu.

**3. Ek satırlarının ikonları yanlış anlam taşıyordu.** Dosyada ataç (`clip`),
BAĞLANTIDA KAĞIT UÇAK (`send`) çiziliyordu. Kağıt uçak "gönder" demektir;
satırın yaptığı iş göndermek değil, kullanıcıyı tarayıcıya çıkarmaktı.
Sette ikisinin de karşılığı yoktu; `file` (web'in ortak setinden birebir
geometri) ve `externalLink` eklendi. Alt satır da tasarımdaki gibi ne olacağını
söylüyor: "PDF · 200 KB" / "Bağlantı · tarayıcıda açılır".

**4. Ek satırları BASILAMIYORDU.** En büyüğü buydu ve görsel karşılaştırma
olmasa görünmezdi: satırlar `View`di, dokunuşa cevap vermiyordu. Öğretmenin
eklediği çalışma kağıdı ekranda duruyor ama açılamıyordu. Akış zaten depoda
vardı (`openFileDownload`, duyuru ekleri onu kullanıyor) — kablolanmamıştı.

**Düzeltme yine merkezî.** `AttachmentRow` iki detay ekranında birebir
kopyaydı. İkisi de silinip `self-parts.tsx` içinde tek bir `AttachmentList`
toplandı: açma akışı, meşgul hâli ve hata cümlesi de artık oradadır. Öğrenci
ile veli aynı eke dokunduğunda aynı şeyi yaşasın diye — kopyalansaydı ikisi
ayrı ayrı bozulabilirdi. Aynı hafta içinde ikinci kez aynı kalıp
(bkz. `TB-88`): bu ekran ailesinde kopyala-yapıştır parçalar sistematik bir
kusur kaynağı.

**Ders:** "ekran açılıyor ve veri doğru" bir portun bittiği anlamına gelmiyor.
Dördüncü madde ne bir hata günlüğü ne bir boş liste üretiyordu — yalnız
tasarımla yan yana koyunca görüldü.

**Doğrulama:** web hedefinde öğrenci rolüyle "Kelime çalışması Unit 3" açıldı;
dört madde de tasarımdaki gibi. `dotnet` tarafı etkilenmedi; core testleri
(853) geçiyor, iki uygulama tip kontrolünden temiz çıkıyor.

### `TB-90` · Android derlemesi yalnız elde kalmış `android/` klasörü sayesinde çalışıyordu 🟢 *(kapandı — 2026-08-28, `488b034`)*

OS push işinin RNFirebase spike'ında ortaya çıktı, ama **push ile ilgisi yok.**
`apps/mobile` ilk kez `expo prebuild --clean` ile yeniden üretildi ve derleme
düştü:

```
e: MainActivity.kt:39:11 Unresolved reference 'BuildConfig'.
e: MainApplication.kt:33:28 Unresolved reference 'BuildConfig'.
```

**Sorun Firebase değil.** Altı ayrı yapılandırmada aynı hata alındı: RNFirebase
kurulu/kurulu değil, `app.config.ts`/orijinal `app.json`, `expo-build-properties`
var/yok, `buildFeatures { buildConfig true }` elle eklenmiş, ham `gradlew` yerine
`expo run:android`. **RNFirebase tamamen kaldırılıp deponun commit durumuna
dönüldüğünde de hata aynı.**

`BuildConfig.java` **üretiliyor** ve doğru pakette duruyor
(`app/build/generated/source/buildConfig/debug/com/oksis/mobile/BuildConfig.java`)
— yani AGP özelliği açık. Kotlin derleyicisi üretilen dizini kaynak yolunda
görmüyor. AGP / Kotlin Gradle Plugin / Gradle 9.3.1 üçlüsünde bir uyum sorunu.

**Asıl mesele bulgunun kendisi değil, neden görünmediği.** Bu proje aynı gün
Redmi'ye derlenip kurulmuştu (`com.oksis.mobile` telefonda duruyor). Fark şu: o
derleme **daha önce üretilmiş** `android/` klasörünü kullandı. `android/` ve
`ios/` gitignore'da olduğu için (CNG modu) kırıklık kimsenin gözüne
görünmüyordu — çalışan derleme, elde kalmış tek bir üretilmiş klasöre bağlıydı.
Yeni bir checkout, yeni bir geliştirici ya da CI aynı duvara çarpardı.

**Ders:** CNG modunda `android/` tek kullanımlık bir çıktıdır. Yalnız
yeniden-üretilmediği sürece çalışan bir derleme, çalışan bir derleme değildir.
Bu, defterdeki "ekranda yeşil, zeminde kırık" kalıbının derleme zincirindeki
karşılığı — ve `X-11` push kapısının ölçmediği bir yüzey.

**Kapsam kararı (2026-08-28):** push işini bloklamıyor; backend'in tamamı bundan
bağımsız. Ayrı iş olarak sıraya alındı, **mobil istemci işi başlamadan önce
çözülmesi şart.**

---

#### ✅ KAPANDI — 2026-08-28 · `oksis-ui@488b034`

**Kök neden: uygulama adındaki Türkçe `İ` harfi.**

Ad `OKSİS` olduğunda `expo prebuild`, Android paketini `android.package` yerine
**addan** türetiyor. `MainActivity.kt` ve `MainApplication.kt`
`package com.oksisdev` diye doğuyor — ama `com/oksis/mobile/dev/` dizininde
duruyorlar ve `namespace` `com.oksis.mobile.dev`.

Sonuç iki katmanlı:

1. `BuildConfig` **namespace** paketinde üretiliyor; farklı paketteki
   MainActivity onu göremiyor → `Unresolved reference 'BuildConfig'`.
2. Derleme geçseydi bile manifest `.MainActivity`, yani
   `com.oksis.mobile.dev.MainActivity` arıyor; sınıf orada değil → **çalışma
   zamanı çökmesi**. Yani bu yalnız bir derleme hatası değildi.

**Ölçüm:** ad `Oksis Dev` yapılıp `prebuild --clean` çalıştırıldığında paket
doğru üretiliyor (`com.oksis.mobile.dev`). Expo **57.0.4** ve **57.0.18**'de
sonuç aynı.

**Yanlış iz — sürüm yükseltmesi:** önce Expo 57.0.4 → 57.0.18 ve
React Native 0.86.0 → 0.86.3 denendi. Hata sürdü; üstelik yükseltme
workspace'te iç içe bir `@expo/cli` kopyası doğurup Metro'yu kırdı
(`Cannot find module 'expo-router/_ctx-shared'`). Geri alındı. **Sürüm meselesi
değildi.**

**Yanlış iz — KGP sürümü:** `compileDebugKotlin`'in kaynak dizinleri
yazdırıldığında yalnız `src/main/java/...` göründü, üretilen `buildConfig`
dizini yoktu; bu bir Kotlin Gradle Plugin ↔ AGP uyumsuzluğu sanıldı ve KGP
2.1.20 → 2.2.10 denendi (`expo-build-properties` ile). Çözmedi. Ölçüm
yanıltıcıydı: `KotlinCompile.sources` **Kotlin** kaynaklarını verir, Java
kaynak kökleri ayrıdır.

**Neden aylarca görünmedi:** `android/` ve `ios/` gitignore'da (CNG modu). Elde
kalmış, eski bir şablondan üretilmiş `android/` klasörü kullanılıyordu; ilk
`expo prebuild --clean` çalıştırıldığında ortaya çıktı. Yeni bir checkout, yeni
bir geliştirici ya da CI aynı duvara çarpardı.

**Düzeltme:** `app.json` → `app.config.ts` (ortama duyarlı), ad ASCII
(`Oksis` / `Oksis Dev`), ve gerekçe dosyanın başında kalıcı olarak yazılı.

**Açık kalan:** görünen ad marka gereği `OKSİS` olmalı. Doğru yol
`strings.xml`'deki `app_name` kaynağını bir config plugin ile ayarlamak;
`app.config.ts`'teki `name` ASCII kalır. Ayrı iş.

**Doğrulama:** Redmi Note 9'a kuruldu, FCM token alındı, önce Firebase
Console'dan sonra **OKSİS backend'inden** (öğretmen ödev yayınladı → dört kapılı
gönderim yolu → FCM) bildirim telefonda görüldü.

**Ders:** CNG modunda `android/` tek kullanımlık bir çıktıdır. Yalnız
yeniden-üretilmediği sürece çalışan bir derleme, çalışan bir derleme değildir —
ve hata mesajı (`BuildConfig`) kök nedenden (uygulama adı) üç katman uzaktaydı.

### `TB-91` · SMTP parolası git geçmişinde düz metin duruyor 🟢 *(kapandı — 2026-08-29)*

`src/Oksis.Api/appsettings.json` içinde e-posta göndericisinin parolası **düz
metin** olarak duruyor ve dosya git takibinde. Parola 2026-05-25 tarihli
`471ea88` (*"Davet e-postaları SMTP üzerinden gönderiliyor"*) commit'inden beri
geçmişte; dosyanın 8 commit'i var.

**Neden şimdi açılıyor:** `K-02` bunu 2026-08-08'de yan bulgu olarak not etmişti
ama kalem açılmamıştı. OS push işi ikinci bir sırrı (Firebase service account
JSON) aynı yola sokacak; sır yönetimi bir kez doğru kurulmadan ikinci sırrı
taşımak, aynı hatayı ikiye katlamak olur. Push spec'i (`oksis-api/docs/superpowers/specs/2026-08-28-os-push-bildirimi-design.md` §6.3)
bu maddeye atıf yapıyor.

**Yapılması gerekenler — sırayla:**

1. **Parola döndürülmeli.** Geçmişten silmek YETMEZ: değer ifşa olmuş sayılır ve
   depo klonu olan herkeste duruyor. E-posta sağlayıcısında yeni parola üretilip
   eskisi iptal edilmeli. Bu ilk adım; gerisi ondan sonra anlamlı.
2. Yeni değer ortam değişkenine taşınmalı, `appsettings.json`'da yalnız yer
   tutucu kalmalı (`CHANGE_ME` kalıbı zaten `DefaultConnection`'da kullanılıyor).
3. Aynı taramada `appsettings*.json`'daki diğer sır adayları gözden geçirilmeli.
4. Geçmiş temizliği (`git filter-repo` vb.) **isteğe bağlı** ve ayrı bir karar:
   depo geçmişini yeniden yazmak tüm klonları bozar. Döndürme yapıldıysa aciliyeti
   kalmaz.

**Ders:** yapılandırma dosyası "kod değil" diye sır denetiminin dışında kalıyor.
`X-11` push kapısı bu dosyayı ölçmüyor — sır taraması eklenene kadar aynı hata
sessizce tekrar edebilir.

---

#### ✅ KAPANDI — 2026-08-29

**1. Döndürüldü.** Hesabın parolası değiştirildi ve iki adımlı doğrulama açılıp
bir uygulama parolası üretildi. Bu gerekliydi: `appsettings.json`'daki değer
Microsoft'un uygulama parolası biçiminde (16 hane, rastgele küçük harf) DEĞİLDİ
— insan eliyle seçilmiş bir parolaydı. Yani depoda duran şey "posta gönderme
yetkisi" değil, **hesabın tamamına giriş**ti.

**2. Yer tutucuya çevrildi.** `appsettings.json` ve `appsettings.Test.json`'da
`CHANGE_ME` (`DefaultConnection`'ın kalıbı). Gerçek değer yalnız
`Email__Smtp__Password` ortam değişkeninde — Firebase sırrıyla aynı kalıp.

**3. Tarama yapıldı — tek gerçek sır oymuş.** Üç `appsettings*.json` dosyasındaki
tüm sır adayları tarandı:

| Aday | Gerçek durum |
|:--|:--|
| `NationalIdProtection:*KeyBase64` (prod) | `{{SECRET_…}}` **yer tutucu** ✅ |
| `Jwt:PublicKeyPath` | `keys/public.pem` — yol, yanlış pozitif |
| `Hangfire:Cron:RefreshTokenCleanup` | cron ifadesi, yanlış pozitif |
| `ConnectionStrings:Redis` | `localhost:6379` |
| `Email:Smtp:Password` | 🔴 tek gerçek sır — bu madde |
| `Development`: S3/Jwt/DB | yerel konteyner değerleri, `DEV-` önekli |

**4. Bekçi testi yazıldı** — `SmtpSecretBindingTests`. Bağ sessizce kırılabilir:
`SectionName` değişirse ya da bir yapılandırma kaynağı ortam değişkeninin üstüne
yazarsa uygulama `CHANGE_ME` ile kimlik doğrulamaya çalışır ve **tüm davet
postaları sessizce ölür**. Test üç şeyi ölçer: ortamın yer tutucuyu ezdiğini,
ortam yokken yer tutucunun görünür kaldığını (boşa düşmediğini) ve bölüm adının
ortam değişkeni adıyla tutarlı olduğunu.

**Kapanış turunda çıkan ikinci hata — kayda değer:** kullanıcı yeni uygulama
parolasını doğrudan `appsettings.json`'a yapıştırdı, yani düz metin sırrı düz
metin sırla değiştirdi. **Henüz commit'lenmemişti**; çalışma ağacında yakalandı
ve geçmişe hiç girmedi. Ders: sır döndürmenin "yeni değeri nereye koyacağım"
adımı, döndürmenin kendisi kadar açık söylenmeli — yoksa döndürme aynı deliğe
yeni bir sır koymakla biter.

**Açık kalan iki yan kalem:**
- `appsettings.Test.json` **gerçek Outlook sunucusunu ve gerçek hesabı**
  gösteriyor. `SmtpOptions.Enabled` yalnız Host + FromAddress'e bakar, parolaya
  bakmaz — yani ortam değişkeni set edilmiş bir makinede testler GERÇEK posta
  gönderebilir. `Development` gibi Mailpit'e (`localhost:1025`) çevrilmeli.
- **Geçmiş temizliği yapılmadı** ve bilinçli: `git filter-repo` tüm klonları
  bozar, döndürme yapıldığı için aciliyeti yok. Eski parola geçmişte duruyor ama
  artık hiçbir kapıyı açmıyor.
- `X-11` push kapısına sır taraması eklenmedi — bu turun işi değildi.

### `TB-92` · Mock katmanı "not ve ödev ucu yok" diyor, ikisi de aylardır var 🟢 *(kapandı — 2026-08-29, `cb4fe95`)*

Üç dosyada, beş ayrı yorumda aynı bayat iddia duruyor:

- `oksis-ui/apps/mobile/src/lib/enable-mocking.ts:57,60` — *"Not modülünün .NET
  ucu HENÜZ YOK (oksis-api Modules/Grades boş, TB-13)"* ve *"Ödev modülünün .NET
  ucu da HENÜZ YOK (Modules/Homework yalnız README taşır)"*
- `oksis-ui/apps/web/mocks/browser.ts:69,71` — aynı iki cümle
- `oksis-ui/packages/api-mocks/src/index.ts:22,27` ve
  `packages/api-mocks/src/grade/grade-handlers.ts:2` — aynı iddia

**Ölçüm (2026-08-29):** `Modules/Grades` uygulama katmanında **64**, domain'de
**12** dosya; `Modules/Homework` **91** ve **15**. `GradesController` ve
`HomeworkController` ikisi de `src/Oksis.Api/Controllers/V1/` altında.
`oksis-ui/packages/api/src/grade` ve `.../homework` gerçek istemcileri taşıyor
(`grades/books/{bookId}/grid`, `grades/assessments/{id}/entries`, … ).

**Zararı iddianın kendisi değil, çektiği sonuç.** Her yorum aynı cümleyle
bitiyor: *"…ekranların TEK veri kaynağı bu handler'lardır."* Yeni gelen bunu
okuyup not ve ödev ekranlarını mock'a bağlı sanır; gerçek uçla ekran arasındaki
sözleşme farkını kimse ölçmez. `TB-76`/`TB-77`'nin kalıbı bu:
**besleyen yüzey ölçülmeden kapanmaz.**

**Yapılacak:** beş yorum düzeltilecek ve mock'un rolü doğru adlandırılacak —
"ucun yokluğu" değil, "backend'siz geliştirme ve deterministik demo verisi".
Aynı turda not/ödev ekranlarının gerçek uca karşı bir kez gezilmesi gerekir;
mock'un doğru cevap vermesi, ucun doğru cevap verdiğini göstermez.

**Ders:** "henüz yok" yazan yorumun son kullanma tarihi vardır. Bir modül
yazıldığında onu bekleyen yorumları aramak, modülün bitiş listesinin parçası.

#### ✅ KAPANDI — 2026-08-29 · `oksis-ui@cb4fe95`

Kapanış beklenenden çok daha büyük çıktı ve **bayat yorum en küçük parçasıydı.**

`npm run codegen` (push işi dört yeni uç için gerekiyordu) çalıştırıldığında
üretilen şema **2130 satır** büyüdü: ödev modülünün **24 ucu** ilk kez gerçek
sözleşmeye girdi. Ve `packages/api/src/homework/contract.ts` bunların hepsini
kendi elle yazdığı module augmentation ile zaten tanımlıyordu → **24 × TS2717.**

**Bunu o dosyanın kendi başlığı öngörmüştü:** *"Bu BİLİNÇLİ bir drift
bekçisidir: backend yayınlanıp `npm run codegen` çalıştığında gerçek şema bu
bloğun yerini alır ve aradaki her fark typecheck'i KIRAR."* Bekçi görevini yaptı.

**Yakaladığı gerçek fark üç alandaydı** — ve üçü de aynı cinsten:

| Alan | İstemcide | Sunucuda |
|:--|:--|:--|
| `targetStudentIds` | opsiyonel (`?`) | `string[] \| null` **zorunlu** |
| `description` · `attachments` | opsiyonel | nullable-**zorunlu** |
| `exemptReason` | opsiyonel | nullable-**zorunlu** |

Opsiyonel alan anahtarı **hiç göndermez**; nullable-zorunlu alan `null`
gönderir. İkisi aynı şey değildir. Çalışma zamanında ASP.NET eksik anahtarı
`null`a bağladığı için görünür bir hata çıkmıyordu — yani bu, **testin
yakalayamayacağı, yalnız sözleşmenin gösterdiği** bir sapmaydı.

**Düzeltme telin dibinde, tek yerde:** `wireAttachments` + üç `?? null`
normalleştirmesi (`endpoints.ts`). Çağıranın ergonomik tipi opsiyonel kaldı;
her çağrı noktasına `?? null` yazmak, bir gün birinin unutulması demekti.

**Ayrıca düzeltilen bayat yorumlar:** `contract.ts` başlığı, ve
`packages/core/src/notifications/logic.ts`'teki *"Not modülü — backend HENÜZ
yazılmadı"* satırı.

**Ders (revize):** bayat yorum tehlikeli değildi; tehlikeli olan onun
gerekçelendirdiği **elle yazılmış sözleşmeydi.** Yorum eskidiğinde sözleşme de
eskir, ama sessizce — çünkü iki taraf da kendi içinde tutarlıdır. Bu deponun
kalıbı doğru: elle yazılan sözleşme, codegen geldiğinde **çakışacak** biçimde
yazılmalı. Çakışmasaydı fark hiç görünmezdi.

### `TB-93` · Push kayıt ucu enum'u telde sayı ilan ediyordu, çalışma zamanı string yazıyordu 🟢 *(kapandı — 2026-08-29, `84d44a1`)*

`RegisterDeviceCommand` ham `DevicePlatform` enum'u taşıyordu. Üretilen OpenAPI
belgesi alanı `DevicePlatform: number` ilan ediyor — oysa `Program.cs:49`'daki
`JsonStringEnumConverter` çalışma zamanında **string** yazıyor.

**Sözleşme ile davranış aynı fikirde değildi.** İstemci üretilen tipe inanırsa
`2` gönderir (sihirli sayı, anlamı bir C# enum'unda yaşıyor); çalışma zamanına
inanırsa `"android"` gönderir ama tipi zorlamak için `as` yazmak zorunda kalır.
İkisi de yalan.

**Neden bu modülün kendi kuralına da aykırıydı:** aynı modülde
`NotificationDto.Kind` BİLEREK `string`tir — DTO'lar enum'u wire'da string
taşır. Ham enum taşıyan tek yer bu komuttu.

**Neden şimdi düzeltildi:** ucun **sıfır tüketicisi** vardı. İlk istemci
yazılmadan önce bedava; sonrası kırıcı değişiklik olurdu.

**Düzeltme:** komut `string Platform` taşır, çeviri tek yerde
(`DevicePlatformWire`). Doğrulayıcı ve handler **aynı** çağrıyı kullanır —
ayrı karar verselerdi istek doğrulamayı geçip handler'da patlardı, yani 400
yerine 500. Sayısal değer bilerek reddedilir: `Enum.TryParse` `"99"`u sessizce
`(DevicePlatform)99` yapar ve tanımsız bir platforma yazardı.

**Ders:** üretilen istemci sözleşmesi, sunucunun DAVRANIŞINI değil BELGESİNİ
yansıtır. İkisi ayrıştığında hatayı ne derleyici ne test görür — yalnız ilk
istemciyi yazan kişi görür, ve o kişi çoğu zaman yalanı kabullenip devam eder.

### `TB-94` · Kapalı uygulamada bildirim dokunuşu hiçbir yere gitmiyordu 🟢 *(kapandı — 2026-08-29, `0a1a494`)*

Push arka plandaki uygulamada çalışıyordu; **kapalıyken** dokunulunca uygulama
açılıyor ama **ana ekranda kalıyordu**. Spec §1'in bitmişlik cümlesi tam olarak
bu hâli tarif ediyor: *"uygulaması **kapalı** velinin telefonunda…"*

**İki ayrı kusur üst üste binmişti ve ikisi de yalnız telefonda görünüyordu.**

#### 1. Native — `MainActivity`'de `onNewIntent` yok

Manifest'te `android:launchMode="singleTask"` (Expo'nun ürettiği hâl). Bu modda
bildirime dokunulduğunda Android **yeni activity yaratmaz**, var olanı yeniden
kullanır ve niyeti `onNewIntent` ile teslim eder. Activity onu `setIntent` ile
saklamazsa `getIntent()` **hâlâ ilk açılış niyetini** döndürür — FCM verisi
hiçbir zaman görünmez.

**Nasıl bulundu:** geçici `console.log`'la iki RNFirebase yolu da ölçüldü.
`getInitialNotification()` → `null`, `onNotificationOpenedApp` → hiç
tetiklenmiyor. İkisi de activity niyetini okur; niyet bayat olduğu için ikisi de
**haklı olarak** "bildirim yok" diyordu. Yani kusur JS'te değil native'deydi ve
JS tarafına ne yapılsa çözülmezdi.

**Düzeltme `android/`'ye ELLE yazılmadı.** O klasör CNG'de üretilen bir çıktıdır
ve gitignore'dadır; elle düzenleme ilk `expo prebuild`ta sessizce kaybolurdu —
`TB-90`'ın tam olarak öğrettiği ders. Config plugin yazıldı:
`apps/mobile/plugins/with-main-activity-new-intent.js`.

#### 2. Mimari — dinleyiciler çok geç kuruluyordu

Dokunuş dinleyicileri sekme kabuğunda (`(tabs)/_layout`) kuruluyordu. Arka
planda çalışıyordu çünkü kabuk zaten mount'tu. Kapalı uygulamada ise olay
**React ağacı kurulmadan önce** gelir ve dinleyici henüz yokken düşer.

**Ayrım şu:** *yakalamak* oturum GEREKTİRMEZ (yalnız payload'ı saklar),
*gezinmek* gerektirir (rol çözülmeden hedef `null`a düşer). İkisi ayrıldı —
yakalama uygulama kökünde en erken anda başlar (`pending-push.ts`), gezinme rol
hazır olunca tamponu boşaltır.

**Doğrulama (Redmi Note 9, uygulama süreç olarak öldürüldü):**

```
getInitialNotification sonuc: VAR
deliver, handler var mi: false      ← tamponlandı
alici baglandi, tamponda: VAR       ← rol çözülünce boşaltıldı
ekran: Ebru Çetin · 10-B / "Soguk acilis 5" / Son: 11 Eylül
in-app satırı: is_read=1
```

**Ders — iki katmanlı:** (a) `getInitialNotification`'ın `null` dönmesi
"bildirim yok" demek değildir; activity niyetinin bayat olduğu anlamına da
gelebilir ve bu ayrım yalnız cihazda görünür. (b) Bir dinleyicinin **ne zaman
kurulduğu**, ne dinlediği kadar önemlidir: erken gelen olay, geç kurulan
dinleyiciye görünmez ve hiçbir yerde iz bırakmaz.

### `TB-95` · Bildirim kuyruğu hiçbir ortamda Hangfire'a bağlanmıyordu 🟢 *(kapandı — 2026-08-29, `b876945`)*

Push işi bitince ölçüldü: `Infrastructure/DependencyInjection.cs` yorumu
*"Production'da Api katmanı Hangfire register edip bu kaydı override eder"*
diyordu. **Etmiyordu** — `src/Oksis.Api` içinde `IBackgroundJobClient` hiç
geçmiyordu. Yani hiçbir ortamda, hiçbir yapılandırmayla dayanıklı kuyruk devrede
değildi; `AddOksisHangfire` yalnız storage'ı ve cron süpürmelerini kuruyordu.

**Sonucu üç katlıydı.** (a) 28 handler'ın tamamı bildirimlerini
`InProcessBackgroundJobClient` ile, bellek içi `Task.Run` üzerinden dağıtıyordu —
API yeniden başladığında kuyruktakiler iz bırakmadan kayboluyordu. (b) `K-02`'nin
dayandığı yeniden deneme politikası (5 deneme, 1m/5m/15m/1h/6h) yazılıydı ama
**geçerli değildi**; `Task.Run` başarısızlığı yutar. (c) Sessiz saat ertelemesi
`Task.Delay` ile bellekte planlanıyordu — gece 22:00'de ertelenen bir push,
sabaha kadar süreç ayakta kalmazsa hiç gitmiyordu. Push işindeki `Ruling-33`
(ertelenen teslim `false` döner) doğrudan bunun sonucuydu.

**Nasıl ölçüldü — kod okumakla yetinilmedi:** çalışan veritabanında
`hangfire.Job` tablosunda `DispatchNotificationJob` sayısı **103.500+ iş içinde
0**'dı; kayıtlı işlerin tamamı cron süpürmeleriydi. Yorumun yalan söylediğini
tabloyu saymak kanıtladı.

**Düzeltme:** `HangfireBackgroundJobClient` adaptörü Infrastructure'a yazıldı
(Application katmanı Hangfire'a referans veremez — C0), kaydı **Api katmanında
`AddOksisHangfire` içinde**, `AddHangfireServer()`'dan sonra ve var olan
`Hangfire:Enabled` kapısının arkasında yapılıyor. Karar orada çünkü storage'ı da
o fonksiyon kurar: soyutlamayı bağlayıp storage'ı kurmamak mümkün olmamalı.
Kapı kapalıysa tip hiç kaydedilmez, in-process fallback yürürlükte kalır.

**Sıraya bağımlı ve bu bilerek böyle:** `Program.cs`'te Infrastructure kaydı (39)
Api kaydından (42) önce gelir, son kayıt kazanır. Ters çevrilirse bağlama sessizce
geri düşer — bu yüzden `BackgroundJobClientRegistrationTests` sırayı ölçüyor.

**Doğrulama (canlı):** öğretmen not yayınladı → `hangfire.Job` 103558 →
`Succeeded`, 18 in-app satırı, push 1 saniye sonra telefona düştü.

**Ders:** *bir yorumun anlattığı kablolama, o kablolamanın var olduğunun kanıtı
değildir.* Yorum muhtemelen yazıldığı gün doğruydu; kayıt satırı hiç eklenmedi ve
aradaki fark ne derleyiciye ne teste göründü — çünkü in-process fallback her iki
hâlde de çalışan bir sistem üretiyordu. Yalnız "restart'tan sonra" ve "5 deneme"
iddiaları yalandı, ikisi de üretimde ölçülür.

---

## 26. Kulüp Modülü — Kod Taraması (2026-08-29)

> **Kaynak:** Kulüp teknik analizinin OS push + FE uyum revizyonu ·
> `oksis-api` @ `1acf29a` · `oksis-ui` @ `1fec5aa`
> **Yöntem:** Portlanan ekranlar ↔ `contract.ts` ↔ mock handler ↔ backend push
> altyapısı dört yönlü karşılaştırıldı. Ekran testi değil. Backend modülü henüz
> yok; bulguların hepsi FE'nin kendi içinde ya da FE ile analiz arasında.
> Analiz: `oksis-api/docs/analysis/kulup-modulu-teknik-analiz.md` §18–§20.


---

## 27. Kulüp Modülü — Uçtan Uca Test Hazırlığı (2026-08-30)

### `TB-102` · Kulüp duyuru okuyucusu DI'ye kaydedilmemiş — API hiç açılmıyordu 🔴 *(kapandı — 2026-08-30)*

`feat/kulup-modulu` dalında `dotnet run --project src/Oksis.Api` startup'ta
düşüyordu: `Unable to resolve service for type
'...Clubs.Internal.ClubAnnouncementReader' while attempting to activate
'ListClubAnnouncementsQueryHandler'`. Faz 4 (`ef3187f`) reader'ı yazmış,
`Application/DependencyInjection.cs`'e **kaydetmemişti**. Sonuç kulüple sınırlı
değil: DI grafiği bir bütün olarak doğrulandığı için **hiçbir uç** ayağa
kalkmıyordu.

Üç gün fark edilmemesinin nedeni ölçüm boşluğu: birim testleri handler'ı elle
`new`'liyor, `AddApplication()` çağıran tek test (`ValidationMessageLanguageTests`)
`BuildServiceProvider()`'ı **doğrulama seçenekleri olmadan** kuruyor, ve
`ValidateOnBuild` yalnız `WebApplicationBuilder`'ın Development kurulumunda
açılıyor. Yani grafiği ölçen tek şey **gerçek bir API startup'ı** ve devir notu
"bu oturumda API çalıştırılmadı" diyordu.

Düzeltme: `services.AddScoped<Modules.Clubs.Internal.ClubAnnouncementReader>();`
(`DependencyInjection.cs`, `ClubHistoryReader`'ın hemen altına). Sonrasında API
açıldı, `/health/ready` 200, kulüp zincirinin tamamı `s4`'te curl ile yeşil.

**Kalıcı ders:** kayıt gerektiren her yeni `Internal` sınıf için tek ölçüm noktası
gerçek startup'tır; "birim testleri yeşil" DI hakkında hiçbir şey söylemez.


---

## 28. Kulüp Modülü — Uçtan Uca Ekran Testi (2026-08-30)

`docs/testing/kulup-modulu-test-rehberi.md` akışları `s1` (Dev Okul) üzerinde
web + mobil web'de koşuldu: yönetici üç kulüp açtı, danışman başvuruları karara
bağladı, öğrenci katıldı/etkinliğe kaydoldu, danışman roster işaretledi ve duyuru
yayınladı, veli iki çocuğun kartını gördü. Uçların kendisi sağlam çıktı; bulguların
tamamı **ekran ile sunucunun ayrıştığı** yerlerde.


### Doğru çalışan yollar (kayda değer)

Kontenjan kapısı (2 onay sonrası üçüncü başvuruda "Kontenjan dolu" + düğme kapalı),
`?status`/`?category`/`search` süzgeçleri (danışman soyadıyla arama dahil), üyelik
durum makinesi (`pending` → `active`/`rejected`), taslak etkinliğin öğrenciye
görünmemesi, roster'ın tek `SaveChanges`'te yazılması ve "Son kayıt … yapıldı"
damgası, gece işinin (`clubs.complete-finished-activities`) biten etkinliği
Hangfire panelinden tetiklendiğinde `Completed`'a çekmesi, dört bildirim olayının da gerçekten üretilmesi (kind 28/29/30/31,
gerekçe gövdeye giriyor), veli yüzünün salt-okunurluğu ve ikinci çocuğun boş
durumu, kapsam kapıları (danışman olmayan öğretmen 404, öğretmenin kulüp açma
denemesi 403, üye olmayan öğrencinin etkinlik kaydı 404, veliye başka çocuk 404).

**Sıradaki boş ID:** `TB-104` · `X-20` · `B-50` · `D-19` · `V-04` · `E-23` · `ENG-03`

---

## 29. Bulgu Kapanış Turu — A–D blokları (2026-08-31) ✅

**Damgalar:** `oksis-api` @ `fix/bulgu-kapanis-turu-b` · `oksis-ui` @ `fix/bulgu-kapanis-turu-a`
(dallar `7060820` ve `42f29cb` üzerine). Turun teknik analizi:
`oksis/docs/teknik-analizler/bulgu-kapanis-turu-teknik-analiz.md`.

**Ne yapıldı:** 2026-08-30 fotoğrafındaki iş sıralamasının **karar gerektirmeyen**
A–D blokları uygulandı — 12 madde kapandı, defter 51 → 39'a indi, kritik sayısı
12 → 4'e düştü. Kalan dört kritik (`TB-82`, `X-16`, `TB-48`, `X-17`) karar/ön koşul
sınıfında.

**Doğrulama:** `oksis-api` 4955 test yeşil — 974 domain + 422 API + 2450 application
+ 61 mimari + **1048 entegrasyon (gerçek SQL Server, Testcontainers)**. `oksis-ui`
834 test yeşil (core 356 · api 216 · api-mocks 262) + `turbo lint` + `turbo typecheck`
+ `next build` temiz.

**Turun kendi dersleri:**

- **Defterin fotoğrafı eskir.** İki madde (`TB-99` yazma ayağı, `TB-97` API yarısı)
  ölçüm sırasında **zaten kapanmış** çıktı; biri "bloke edici 🔴" etiketiyle duruyordu.
  Uygulamaya başlamadan önce kodu yeniden ölçmek, yapılmış işi ikinci kez yapmayı
  önledi.
- **"FE işi" etiketi bir ayağı gizleyebilir.** `TB-96` FE işi diye kayıtlıydı; sunucu
  da yanlış rota üretiyordu ve üstelik ölçümde **üç ayrı eski biçim** çıktı.
- **Kalıcı satır, düzeltmenin kapsamını genişletir.** Üretim tek biçime çekilse de
  okuyucu eski biçimleri tanımak zorunda ([[serilesmis-sekil-sozlesmedir]]).
- **Sayım ile fan-out aynı süzgeci kullanmalı.** `TB-77`'nin ilk sürümü kişi sayıyordu;
  bildirim hesaba yazılıyor. "Doğru sayı" tanımı, sayının **tüketicisinin** sorusundan
  gelir.
- **`MockQueryable` yeşili yetmez** ([[bellek-ici-test-db-kisitini-zorlamaz]]). Turun
  ürettiği üç yeni sorgu yolu için gerçek SQL çeviri testi yazıldı; `X-06`'nın geniş
  ayağı (92 handler) hâlâ açık.

### `TB-99` · Kulüp kategorisi telde Türkçe etiket, bilinmeyen değer sessizce "Diğer" 🟠 *(yazma ayağı kapandı — 2026-08-31 doğrulaması; çip kalıntısı açık)*

`packages/core/src/club/types.ts` on kategoriyi `"Bilim"…"Diğer"` string
sabiti olarak **tel değeri** yapıyor; `endpoints.ts:139-141` tanımadığı her
değeri `"Diğer"`e düşürüyor. Backend İngilizce kod üretirse (S-11) her kulüp
"Diğer" görünür ve hiçbir hata çıkmaz. Sessiz yanlışın klasik şekli. FE sabiti
`{ code, label }` çiftine döner (analiz §19-F, F1) — Faz 1 ile aynı anda.

🔴 **Canlıda doğrulandı — 2026-08-30, ekran testi (`oksis-api@f7f1ee6`).** Yönetici
"Kulüp oluştur" formunda kategoriyi listeden seçip kaydedince
`POST /api/v1/clubs` **400** dönüyor: `{"code":"Validation","message":"Tanınmayan
kulüp kategorisi.","field":"Category"}` — gövdede `"category":"Teknoloji"` gidiyor,
sunucu `ClubWire.ParseCategory` ile yalnız `technology` gibi camelCase kodu tanıyor
(`ClubWire.cs:76-89`, `ClubInputRules.CategoryMessage`). Yani bulgunun **yazma
ayağı sessiz değil, gürültülü**: kulüp hiç açılamıyor. Aynı sapmanın iki ayağı
daha var → liste süzgeci `?category=Teknoloji` de 400 üretir
(`ListClubsQueryHandler.cs:46`, `ListClubDiscoveryQueryHandler.cs:48`), okuma
ayağı ise TB-99'un tarif ettiği sessiz "Diğer" düşüşü (`endpoints.ts:139-141`).
Kök neden tek: FE'nin `ClubCategory` tipi Türkçe etiketin kendisi ve hem tel
değeri hem ikon anahtarı olarak kullanılıyor. **Backend'de düzeltilecek bir şey
yok** (S-11/K-13 kararı: sunucu kod gönderir, etiketi ekran üretir); açık iş
F1'dir ve artık Faz 1 merge edildiği için **bloke edici**.

✅ **F1 YAPILMIŞ — bloke edicilik kalktı** *(2026-08-31 kod doğrulaması, `oksis-ui` @
`42f29cb`)*: `ClubCategory` artık camelCase kod (`9d3723e` + merge `9d7cfdc`); etiket/ikon
map'leri `packages/core/src/club/constants.ts:64-99`'da, `endpoints.ts` daraltması koda
bakıyor, `constants.test.ts` sözleşmeyi kilitliyor. **Kalan tek görünür kusur:** web kulüp
listesi süzgeç çipi ham kodu basıyor (`club-list-page.tsx:188` →
"Kategori: socialResponsibility"); hemen üstündeki `:157` doğru kalıbı kullanıyor.
Çözüm: [[bulgu-kapanis-turu-teknik-analiz]] §1.

✅ **KAPANDI — 2026-08-31.** Yazma ayağı zaten kapanmıştı (`oksis-ui` @ `9d3723e`,
merge `9d7cfdc`): `ClubCategory` camelCase kod, etiket/ikon map'leri
`packages/core/src/club/constants.ts:64-99`. Kalan tek kusur — web liste ekranının
aktif süzgeç çipi ham kod basıyordu — kapatıldı: `oksis-ui` @ `aebcf11`
(`club-list-page.tsx:188` → `CLUB_CATEGORY_LABEL[category]`). Sözleşme testi
`constants.test.ts` map'i kilitliyor. Bilinçli artık: `toCategory` bilinmeyen kodu
`"other"`a düşürmeye devam eder (gerekçesi `endpoints.ts:137-145` yorumunda).

### `E-21` · Kulübü yayına alan ekran yok — Taslak hapsi 🔴

Web'de kulüp durumunu değiştiren tek yol "…" menüsü ve orada yalnız **Pasife al**
ile **Arşivle** var (`ClubStatusDialog` hedef olarak yalnız `inactive`/`archived`
tanıyor). Sonuçları:
- Danışmansız açılan kulüp `Draft` doğuyor (K-12) ve **ekrandan asla yayına
  alınamıyor**; düzenleme ekranından danışman atamak da durumu değiştirmiyor
  (`UpdateClubCommandHandler` statüye hiç dokunmuyor).
- Pasife alma diyaloğu "Bu işlem geri alınabilir" diyor ama geri alacak düğme yok.

Sunucuda karşılığı var: uç 5 `{"status":"active"}` ve `Club.Activate()`. Eksik olan
yalnız ekran. Test bu adımı uçtan geçerek sürdürdü.

✅ **KAPANDI — 2026-08-31** · `oksis-ui` @ `2653b7a`. Statü diyaloğu üç aksiyonlu
oldu (`activate` hedefi eklendi); başlık ve onay etiketi kulübün durumuna göre
seçiliyor — taslakta **"Yayına al"**, pasifte **"Yeniden aktifleştir"**. Eylem hem
liste satır menüsüne hem detay sayfasına bağlandı. Ek olarak diyalogda `onError`
yoktu: danışmansız kulüpte sunucunun 409 gerekçesi sessizce yutuluyordu, artık
ekranda görünüyor. Pasife alma diyaloğunun "geri alınabilir" cümlesi artık doğru.

### `B-43` · Açık katılımda başvuru penceresi sessizce siliniyor 🔴

Yeni kulüp formunda **Açık Katılım** seçilip başvuru penceresi doldurulduğunda
(1–31 Ekim) kayıt sonrası `join_start_date`/`join_end_date` **NULL**. Alan ekranda
duruyor, yazı kabul ediyor (`.off` yalnız soluklaştırıyor), kaydederken
`toCreateBody` (`packages/api/src/club/endpoints.ts`) `joinMode !== "approval"` ise
ikisini de `null`'a çeviriyor.

Gerekçesi yanlış: koddaki yorum "sunucu da pencereyi yalnız approval'da uygular"
diyor, oysa `Club.IsApplicationOpen` **moda hiç bakmıyor** — pencereyi açık
kulüpte de uyguluyor. Yani "Ekim'de açılan açık kulüp" sunucuda ifade edilebilir,
ekranda edilemez ve yönetici yazdığı tarihin kaybolduğunu görmez.

✅ **KAPANDI — 2026-08-31** · `oksis-ui` @ `7ee0e75`. `toCreateBody`'deki mod koşulu
kaldırıldı (pencere her modda gönderiliyor), form alanındaki `.off` soluklaştırması
kalktı, şema `refine`'ı `joinMode` koşulu olmadan koşuyor ve yanlış yorumlar
(`schemas.ts:52-55`) gerçeğe çekildi. **Yeni test dosyası** açıldı —
`packages/api/src/club/endpoints.test.ts`, dört test giden gövdeyi doğruluyor
(açık katılımda pencere korunur, onaylıda korunur, boşsa `null`, güncellemede de).

### `B-49` · İptal gerekçesi kutusu uydurma bir cümleyle dolu geliyor 🟠

`activity-dialogs.tsx:138` → `useState("Laboratuvar bakımı nedeniyle etkinlik iki
hafta sonraya ertelendi.")`. Tasarım mock'undan kalmış sabit metin; öğretmen
silmezse **öğrencilere bu yanlış gerekçe gider** (gerekçe bildirim gövdesine
birebir giriyor — ölçüldü). Alan zaten zorunlu ve 15-500 karakter denetimli;
varsayılanın boş olması gerekiyor.

✅ **KAPANDI — 2026-08-31** · `oksis-ui` @ `81437f8`. `useState("")` — prototipten
kalan 65 karakterlik örnek cümle varsayılan değerden çıktı, `placeholder`'da yaşıyor.
Alanın 15-500 denetimi ve `disabled={tooShort}` zaten doğruydu; varsayılan boşalınca
buton kendiliğinden kilitli başlıyor.

### `X-19` · Sezon ileri tarihte başlıyorsa bildirim kutusu tamamen boş 🔴

`s1` ve `s4`'ün yürürlükteki sezonu **15 Eylül 2026**'da başlıyor (bugün 30
Ağustos). `GetMyNotificationsQueryHandler` `WithinActiveSeason` ile
`CreatedAt >= sezon başlangıcı` süzüyor (B-06 kesmesi) → bugün üretilen **her**
bildirim kutuda görünmüyor, rozet `0` kalıyor. Ölçüm: öğrenciye ait 3 kulüp
bildirimi (`kind` 28/29/31) veritabanında duruyor, uç `totalCount: 0` dönüyor.

Kulübe özgü değil — not, ödev, duyuru dahil tüm modülleri etkiler. Sezonu
"yürürlükte" ilan edip başlangıcını ileri tarihe koymak gerçek bir okul
senaryosudur (Ağustos'ta yeni sezona geçiş). Kesmenin varsayımı "aktif sezon
başladı"; varsayım tutmadığında ekran sessizce boşalıyor.

✅ **KAPANDI — 2026-08-31** · `oksis-api` @ `2e8a904`.
`NotificationSeasonScope.ResolveActiveSeasonStartAsync` iki dallı: `StartDate <= bugün`
→ kesme `StartDate` (bugünkü davranış, değişmedi); `StartDate > bugün` (geçiş dönemi)
→ kesme **biten son sezonun `EndDate` + 1 günü**, önceki sezon yoksa daraltma yok.
Kesme sabittir, güne göre kaymaz (`min(StartDate, bugün)` gibi kayan bir kesme dün
görünen bildirimi yarın gizlerdi — reddedildi). Saat `IDateTimeProvider` üzerinden.
**5 birim testi** (görünür/gizli/regresyon/önceki sezon yok/rozet aynı kesme) +
**gerçek SQL çeviri testi** (`007fc7c`): `MAX(end_date)` nullable projeksiyonu dolu
ve boş kümede. Kırmızı kanıtı: geçiş dalı kapatılınca 4 test düştü.

### `TB-96` · Kulüp bildirimi dokununca hiçbir yere gitmiyor — çözümleyicide `clubs` kolu yok 🔴

`packages/core/src/notifications/logic.ts:436-485 · resolveNotificationTarget`
yalnız `announcements`, `homework` ve dört sabit alan yolunu tanır. Web mock'u
iki kulüp bildirimini `/clubs/1` derin bağlantısıyla zil listesine koymuş
(`apps/web/mocks/notifications-data.ts:113-114`) ama `notification-href.ts:68-69`
`null` alıp satırı tıklanamaz bırakıyor; mobilde `navigate-to-target.ts:83-122`
aynı fonksiyona dayandığı için push dokunuşu da boşa gidecek. TB-94'ün kapattığı
"kapalı uygulamada dokunuş" yolu kulüp için baştan açık kalıyor. Backend
`PushDeepLinks.Club(id) = "/clubs/{id}"` üretecek (analiz §18.4, S-13);
`/clubs/{id}` üç rolde üç ayrı ekrana açılıyor, kol bu dağıtımı yapmak zorunda.
**FE işi**, analiz §19-D / F4.

**Ekranda doğrulandı — 2026-08-30 (uçtan uca test):** `s2`'de öğrenci
(`ogrenci.s2.004`) kulüp başvurusu onaylandı, bildirim kutusunda
"Kulüp başvurun onaylandı" satırı **göründü** (rozet 16→15) ama satıra dokunmak
**hiçbir ekrana götürmedi** — yalnız okundu işaretledi. Sunucunun ürettiği derin
bağlantı `/student/clubs/{clubId}`; `NOTIFICATION_AREA_BY_PATH` tablosunda ne bu
yol ne `clubs` kolu var, çözümleyici `null` döndürüyor.

✅ **KAPANDI — 2026-08-31** · iki ayak birden.
**BE** (`oksis-api` @ `5ab7854`): `PushDeepLinks.Club` sabiti zaten vardı; ölçümde
dört üreticinin de kendi yolunu yazdığı görüldü — başvuru kararı `/student/clubs/{id}`,
duyuru `.../announcements`, iki etkinlik handler'ı `.../activities/{activityId}`.
Dördü de tek kaynağa bağlandı, üretim artık yalnız `/clubs/{id:D}`.
**FE** (`oksis-ui` @ `98640f4` + `cd79b8f`): `resolveNotificationTarget`'a `clubs` kolu
— `/clubs/{guid}` → role göre üç yüzey (öğrenci detayı · danışman başvuru ekranı ·
veli kulüp sekmesi kökü); web `notification-href` ve mobil `navigate-to-target`
dağıtımı. Sunucunun **eski üç biçimi de** çözülüyor: o satırlar bildirim tablosunda
kalıcı ([[serilesmis-sekil-sozlesmedir]]), okuyucu onları da tanımasa bugün kutuda
duran her kulüp bildirimi ölü kalırdı. **6 yeni çözümleyici testi.**
🔗 **F5 birlikte kapandı:** mock kulüp kimlikleri GUID biçimine çevrildi (fixture +
`insertClub` + web bildirim mock'unun derin bağlantıları) — `GUID_PATTERN` sayısal
kimliği eliyordu, kol eklense bile dev-drive'da satır ölü kalırdı.
⬜ **Kalan (F7 komşusu):** veli derin bağlantısı kulüp sekmesinin köküne iniyor;
mobil veli detay rotası iki parametre istiyor (`/clubs/parent/[studentId]/[clubId]`)
ve derin bağlantı tek kimlik taşıyor. Yanlış çocuğun ekranını açmaktansa doğru
sekmeye inmek seçildi.

### `TB-97` · Öğrenci "Kulübe katıl" onaylı kulüpte mock'ta 409 alıyor 🔴 *(sözleşme yarısı kapandı — 2026-08-31 doğrulaması; mock yarısı açık)*

`student-detail-screen.tsx:307-314` `joinable` durumunda her koşulda `:join`
çağırıyor; `:apply` yalnız tip imzasında yaşıyor, hiçbir ekran göndermiyor.
Mock `joinMode !== "open"` iken `:join`'e `409 wrong_mode` döndürüyor
(`club-handlers.ts:309-322`). Sözleşmenin iki ucu ile ekranın tek ucu
çelişiyor. Karar analizde: tek `:join` komutu moda göre `Active`/`Pending`
üretir, `:apply` yazılmaz (§10 uç 27, §19-A). FE'de `:apply` ve mock 409 dalı
silinir (F2).

✅ **API yarısı YAPILMIŞ** *(2026-08-31 kod doğrulaması)*: `:apply` codegen geçişinde
sözleşmeden düştü (`oksis-ui` @ `e951629`), tek uç `joinClub`
(`packages/api/src/club/endpoints.ts:667-681`). **Kalan — mock ve ekran artıkları:**
mock 409 `wrong_mode` dalı duruyor (`club-handlers.ts:309-321`; `club-data.ts:839-849`
`joinMode !== "open"`da `undefined` dönüyor), ölü `:apply` handler'ı duruyor (`:294-308`),
`student-detail-screen.tsx` imzasında `'apply'` artığı. Gerçek API'de akış çalışıyor;
mock'lu ortamda hâlâ patlıyor. Çözüm: [[bulgu-kapanis-turu-teknik-analiz]] §7.

✅ **KAPANDI — 2026-08-31** · `oksis-ui` @ `e316ce4`. API yarısı codegen geçişinde
kapanmıştı (`e951629`: `:apply` sözleşmeden düştü, tek uç `joinClub`); mock yarısı
şimdi kapandı: `decideStudentMembership` moda göre `pending`/`member` üretiyor,
409 `wrong_mode` dalı ve ölü `:apply` handler'ı silindi, `queries.ts` ile mobil
imzadaki `'apply'` artığı düştü. **4 mock testi** kararı kilitliyor.

### `E-22` · Kulüp duyurusunu öğrenci de veli de HİÇ okuyamıyor 🔴

Duyuru yazılıyor, bildirim üretiliyor, ama **içeriği görecek bir yüzey yok**:

| Yol | Durum |
| --- | --- |
| Uç 18 `GET /clubs/{id}/announcements` | Üye öğrenciyle **404** — kapı danışman **veya** `clubs.manage` (`ClubReadGate`) |
| FE ekranı | Duyuru listesi yalnız `panel-page.tsx`'te (danışman/yönetici); mobil öğrenci detayında yalnız **sayaç** var (`<Stat label="Duyuru" value={club.announcementCount} />`) |
| Bildirim | Gövde duyurunun **başlığını** taşıyor, içeriğini değil; derin bağlantı `/student/clubs/{id}/announcements` — mobilde **böyle bir rota yok** ve çözümleyici de tanımıyor (`TB-96`) |

Ölçüldü (2026-08-30): danışman "İlk toplantı salı günü / Salı 15:30'da Fen
Laboratuvarı'nda buluşuyoruz…" duyurusunu yayınladı; öğrenci ekranında kulüp
kartı **"1 DUYURU"** yazıyor, metnin kendisi hiçbir yerde görünmüyor.

Kapatmak iki iş istiyor: (a) uç 18'in kapısına ÜYE öğrenciyi (ve velisini) eklemek
ya da öğrenci yüzü için ayrı bir uç açmak, (b) mobil detayda duyuru listesi +
`/clubs/[clubId]/announcements` rotası. İkisi de yapılmadan duyuru özelliği
yazma-tarafı-tamam, okuma-tarafı-yok halinde.

✅ **KAPANDI — 2026-08-31** · iki ayak birden; defterin (a) seçeneği uygulandı
(ayrı uç açılmadı, mevcut ucun kapısı genişledi).
**BE** (`oksis-api` @ `f26093a`): `ListClubAnnouncementsQueryHandler` kapı sırası
`ClubReadGate` (danışman/yönetici) → **üye öğrenci** (`ClubStudentGate` + canlı
üyelik ŞART) → **veli** (`ClubFamilyScope` çocukları + tek turluk üyelik sorgusu,
`ClubStudentReader.FindFirstLiveMemberAsync`) → 404. Üye olmayan öğrenci ve ilgisiz
veli varlık sızdırmadan 404 alır. **5 yeni test**, danışman/yönetici regresyonu (15)
yeşil kaldı.
**FE** (`oksis-ui` @ `db43fac`): `AnnouncementListScreen` + `/clubs/[clubId]/announcements`
rotası; öğrenci ve veli detayındaki "Duyuru" sayacı oraya götürüyor. Yönetim eylemi
yok — o yüz web `panel-page`'in işi.

### `B-46` · Ret gerekçesi hiç sorulmuyor, karara bağlanan başvurular ekranda yok 🟠

İki ayrı kayıp, tek ekranda (`panel-page.tsx`):
1. **Ret gerekçesi sorulmuyor** — `decideOne(a, "reject")` gövdesiz gidiyor,
   `club_memberships.reject_reason` hep boş kalıyor. Sunucu gerekçeyi kabul ediyor
   ve öğrenciye giden bildirimin gövdesine koyacak yeri var (D5).
2. **Karar geçmişi görünmüyor** — ekran `useClubApplications(clubId, "pending")`
   çağırıyor; uç 7 onaylanan/reddedilen satırları da döndürüyor
   (`approved`/`rejected`) ama hiçbir yüzey onları göstermiyor. Danışman dün kimi
   neden reddettiğini bir daha göremiyor.
3. **Gerekçe uçtan geri okunamıyor** *(2026-08-31 doğrulaması)* — BE yazma ayağı tam
   (command `Reason` alanı, `reject_reason nvarchar(500)` kolonu, D5 gereği bildirim
   gövdesine giriyor) ama `ClubApplicationDto` gerekçeyi **döndürmüyor**
   (`ClubDtos.cs:174-181`); karar geçmişi ekranı yapılırken DTO'ya `RejectReason` +
   `DecidedAt` alanları da eklenmeli. Çözüm: [[bulgu-kapanis-turu-teknik-analiz]] §10.

✅ **KAPANDI — 2026-08-31** · üç katmanda birden.
Ölçüm sırasında **üçüncü bir kayıp** bulundu: BE yazma ayağı tamdı (`Reason` alanı,
`reject_reason nvarchar(500)`, D5 gereği bildirim gövdesi) ama gerekçe **hiçbir uçtan
geri okunamıyordu** — `ClubApplicationDto` onu döndürmüyordu.
**BE** (`oksis-api` @ `6773c02`): DTO'ya `RejectReason` + `DecidedAt` **eklendi**;
hiçbir mevcut alan yeniden adlandırılmadı ([[serilesmis-sekil-sozlesmedir]]). Gerekçe
yalnız ret satırında dolu döner. 3 test; kırmızı kanıtı alındı.
**FE** (`oksis-ui` @ `afe1ae1` + `785fbcf`): ret tek tık olmaktan çıktı — onay
diyaloğu, gerekçe isteğe bağlı ama SORULUYOR (boşsa `null` gider); panel ekranına
katlanır **"Karara Bağlanan Başvurular"** bölümü eklendi (öğrenci, karar rozeti,
karar günü, gerekçe). Mock aynı şekle çekildi: gerekçe saklanıyor ve geri dönüyor.

### `B-45` · Penceresiz kulüpte "Başvuru dönemi: Kapalı" yazarken katılım açık 🟠

Öğrenci kulüp detayında (mobil) `InfoRow … value={club.applicationPeriod ?? 'Kapalı'}`
(`student-detail-screen.tsx:177`). Pencere tanımlanmamış kulüpte sunucu
`applicationPeriod: null` + `applicationOpen: true` gönderiyor; ekran bunu
**"Kapalı"** diye yazıyor ve hemen altında "Kulübe katıl" düğmesi açık duruyor.
Doğrusu "süresiz açık". `D8`'in (notun girdisi = düğmenin girdisi) FE yüzü.

✅ **KAPANDI — 2026-08-31** · `oksis-ui` @ `0723dbc`. `applicationPeriod ?? 'Kapalı'`
yerine `applicationPeriod ?? (applicationOpen ? 'Süresiz açık' : 'Kapalı')` — ayrımı
yapan alan telde zaten vardı. Etiket ile CTA artık çelişmiyor. Sunucu-hazır etiket
ilkesi bozulmadı: istemci tarih hesabı yapmıyor, iki sunucu alanını birleştiriyor.
İdeal çözüm sunucunun `applicationPeriod`'a `"Süresiz açık"` yazması olurdu; bu
düzeltmeyi bloklamadığı için ayrı bırakıldı.

### `TB-76` · Yayın ekranındaki bildirim seçimi süs 🔴

`PublishProgramCommand` üç bayrak taşıyor — `NotifyInApp`, `NotifyPush`,
`NotifyEmail`. Uç bunları kabul ediyor, komut kaydına yazılıyor, ve **hiçbir kod
bunları okumuyor.** Bildirim fan-out'u `ScheduleProgramPublishedEvent` üzerinden
**koşulsuz** yapılıyor.

**Ölçüm:** program `{"notifyInApp":false,"notifyPush":false,"notifyEmail":false}`
ile yayınlandı. Yine de **16 bildirim** oluştu — `notifications.notifications`
tablosunda 8 **Student** + 8 **Parent**.

Yani müdür "bildirim gönderme" dese bile gidiyor. Bu bir ekran süsü değil,
kullanıcının verdiği kararın sessizce çöpe atılması.

✅ **KAPANDI — 2026-08-31** · iki ayak birden.
**BE** (`oksis-api` @ `b4d30ee`): `ScheduleProgram.Publish(..., bool notify)` →
`ScheduleProgramPublishedEvent.Notify` → `SchedulePublishedNotificationHandler`
başında `if (!Notify) return;`. Cache invalidation bayraktan etkilenmez (o bildirim
değil tutarlılık işi). Kırmızı kanıtı derleme hatasıydı: bayrak telde hiç yoktu
(`CS1739`). **5 yeni test.**
**FE** (`oksis-ui` @ `63548f3`): push ve e-posta anahtarları ekrandan kaldırıldı —
arkalarında kanal yok (`TB-43`: kayıtlı tek kanal in-app), çalışmayan anahtar sunmak
ekranın gerçeği yansıtmaması demek. Komut alanları **telde kaldı**, sözleşme
kırılmadı; kanallar geldiğinde anahtarlar geri gelir.
🔗 `TB-43`'ün matris sekmesi ayağı AÇIK — bu kapanış onu kapsamaz.

### `TB-77` · Yayın önizlemesinin sayıları sabit 🔴

`PublishReadiness.Evaluate` içinde:

```csharp
var affected = new PublishAffectedDto(
    Teachers: program.ActivePlacements.Select(p => p.TeacherId).Distinct().Count(),
    Students: 0,     // <- sabit
    Parents: 0);     // <- sabit
return new PublishReadinessResult(
    ConflictCount: 0, // <- sabit
    ...
```

Müdür "yayınlayayım mı" kararını bu üç sayıya bakarak veriyor.

**Ölçüm:** önizleme `students: 0, parents: 0` dedi; yayın **16 kişiye** gitti.

Dahası, web çekmecesindeki sayaç **tam ters** çalışıyor:
```ts
const notifCount = notifyInApp && affected
  ? affected.teachers + affected.students + affected.parents : 0
```
Gerçek alıcı kümesi öğrenci + veli (öğretmen **değil**); sayaç ise yalnız
öğretmeni sayıyor, öğrenci ve veliyi sıfır alıyor. "N kişiye bildirim
gönderildi" cümlesi hem yanlış kişiyi sayıyor hem doğru kişileri saymıyor.

**`conflictCount` için not — henüz ölçülmedi:** sabit `0`, ve çekmecedeki
*"çakışma yayını engeller"* uyarısı bu sayıya bakıyor, yani o kapı hiç
tetiklenemiyor. Ancak çakışma **yerleşim anında** engelleniyor olabilir
(`POST placements` 409 dönüyor); öyleyse yayın anında sabit sıfır yapısal olarak
doğru olabilir ve asıl kusur ölü uyarı metnidir. **Programlar arası** (aynı
dönemde başka şubeye sonradan yerleşen aynı öğretmen) çakışmanın yakalanıp
yakalanmadığı ölçülmedi — iddia edilmiyor, ayrı tur konusu.

**Ders:** `ENG-02` tüketici yüzeyini kapattı ama onu besleyen **yayın** yüzeyi
bu turlarda hiç ölçülmemişti. Bir ekranın doğru veriyi göstermesi, o veriyi
üreten ekranın da doğru çalıştığı anlamına gelmiyor.

✅ **KAPANDI — 2026-08-31** · iki ayak + bir düzeltme.
**BE** (`oksis-api` @ `4201f13` + `c6fdc70`): yeni `ClassRoomAudienceCounter` —
sayım TEK yerde yaşıyor ve üç tüketici (yayın önizlemesi, yayın komutu sonucu,
ders istisnası önizlemesinin eski "Debt-BE-2" ikizi) aynı yardımcıyı kullanıyor.
İlk sürüm **kişi** sayıyordu; fan-out ise bildirimi HESABA yazıyor
(`Notification.RecipientAccountId`) — iki sayı ayrışınca maddenin şikâyeti kapanmış
olmaz, yalnız hatanın yönü değişirdi. `LinkedAccountId != null` süzgeci eklendi,
küme artık `ResolveClassRoomConsumersAsync` ile birebir.
**FE** (`oksis-ui` @ `63548f3`): sayaç gerçek alıcı kümesini sayıyor (öğrenci + veli;
öğretmen bu fan-out'un alıcısı değil) ve başarı metni düzeltildi.
**Gerçek SQL doğrulaması** (`007fc7c`): TPH `OfType<StudentProfile>()` + `Contains` +
`Distinct` + hesap süzgeci MSSQL'de çevrildi ve hesapsız kişiyi eliyor.
⬜ **`conflictCount` bilerek DOKUNULMADI** — sabit `0` kaldı; çakışma yerleşim anında
409 ile engelleniyor olabilir, ölçülmedi. FE'deki hiç tetiklenemeyen "çakışma yayını
engeller" uyarı metni kaldırıldı ki ekran yalan söylemesin. **Programlar arası**
çakışma (aynı dönemde başka şubeye sonradan yerleşen aynı öğretmen) hâlâ ölçülmedi —
ayrı tur konusu.


---

## 30. `B-44` · Ürün kararı — danışmansız kulüp başvuru alır (2026-08-31) ✅

Kapanış turunda (§29) bilerek bırakılan **tek** madde. Turda önerilen çözüm dardı
(*"aktif kulüpte danışman boşaltmayı 409'a bağla"*) ve domain'e bilinçli yazılmış bir
asimetriyi tersine çevirdiği için kullanıcı onayına bırakılmıştı. **Karar ters yönde
çıktı:** engellenecek olan danışmanın kaldırılması değil, danışmansızlığın öğrenciye
kapı olarak dönmesiydi.

### Defterden taşınan blok

### `B-44` · Aktif kulübün danışmanı kaldırılabiliyor — D1'in arka kapısı 🟠

`POST /clubs/{id}:changeStatus {"status":"active"}` danışmansız kulüpte **409**
veriyor ("Danışman öğretmeni olmayan kulüp aktifleştirilemez"). Ama **düzenleme**
ekranında aktif kulübün danışmanını "Kaldır" ile boşaltmak serbest: kulüp `Active`
kalıyor, danışmansızlaşıyor. Yani sunucunun kendi kuralı düzenleme kapısından
dolanılıyor ve doğan hâl (aktif + danışmansız) `:changeStatus` ile **onarılamıyor**
— danışman atanmadıkça `Activate()` 409 döner.

⏸️ **2026-08-31 · kapanış turunda BİLEREK ele alınmadı, kullanıcı kararı bekliyor.**
Önerilen çözüm dar: `UpdateClubCommandHandler` aktif kulüpte danışman boşaltmayı
409'a bağlar (değiştirme serbest kalır, taslak/pasifte kaldırma serbest kalır). Ama
bu, domain'e **bilinçli yazılmış** bir asimetriyi tersine çevirir — `Club.cs:200-212`
XML doc'u *"danışmansız aktif kulüp hâli MÜMKÜNDÜR ve bu bilinçlidir"* diyor. Onay
gelmeden dokunulmadı. Alternatif (kaldırınca kulüp `Inactive`'e düşsün) elendi:
sessiz statü değişikliği, `TB-76`'nın şikâyet ettiği "kullanıcı adına karar verme"
sınıfındandır. Ekrandan aktifleştirme yolu artık VAR (`E-21` kapandı), yani anomali
onarılabiliyor — ama doğması hâlâ engellenmiyor.

Yönetici listesinde kırmızı "Danışman yok" uyarısı çıkıyor — anomali görünür, ama
engellenmiyor. Devir notundaki 1. açık ürün kararı artık ekranda ölçüldü.

### Karar (2026-08-31 · kullanıcı)

> *"Danışmanı olmayan kulübe başvuru engellenmesin. Onay için iki ihtimal olsun:
> yönetici rolü onaylasın; öğrenci başvurusu sonrasında danışman olarak atanan
> öğretmenin üzerine assign edilsin başvurular."*

**Kararı ölçen bulgu — eski gerekçe yanlıştı.** `D1`'in dayanağı *"başvuruyu
onaylayacak kimse yok"*tu. Onay ucunun kendi kapsam kapısı (`ClubWriteGate` →
`ClubViewResolver`) **danışman YA DA `clubs.manage`** istiyor; yani danışmansız
kulüpte onaylayacak biri her zaman vardı — idare. Kapı, idarenin elindeki yetkiyi
kendi kendine iptal ediyordu. Açık (`Open`) mod için verilen ikinci gerekçe
(*"üyelik kimsenin göremediği bir listeye düşer"*) da aynı sebeple yanlıştı: üye
uçları da `clubs.manage` kapsamlı.

### Ne yapıldı

✅ **KAPANDI — 2026-08-31** · BE (`oksis-api` @ `fix/kulup-danismansiz-basvuru`) +
FE metin düzeltmesi (`oksis-ui` aynı dal adı).

**Kural tek kapıda yaşıyordu, tek kapıdan kaldırıldı:**
`Club.CanAcceptApplications()` artık yalnız `Status == Active`. Ondan beslenen üç
tüketici — `:join` kapısı (uç 27), beş durumlu `membership` türetmesi
(`ClubStudentStateResolver`) ve kart notu (`ClubLabels.ApplicationNote`) — kendiliğinden
aynı cümleyi söylemeye başladı; hiçbirine ayrı dokunulmadı. `D8` invaryantı (notun
girdisi ile düğmenin girdisi AYNI) bu yüzden korundu.
`DecideClubApplicationCommandHandler`'daki elle yazılmış ikinci kapı kaldırıldı;
`JoinClubCommandHandler.ClosedReason`'daki *"danışman öğretmeni atanmadığı için"*
cümlesi artık erişilemez olduğu için silindi.

**Kararın ikinci yarısı KOD GEREKTİRMEDİ ve bu doğrulandı.** *"Başvurular atanan
danışmanın üzerine assign edilsin"* zaten yapısal olarak öyleydi: başvuru satırında
"atanan kişi" diye bir kolon yoktur, görünürlük `ClubViewResolver`'ın
`Club.AdvisorTeacherPersonId` karşılaştırmasından türer. Danışman atandığı an kulübün
tüm bekleyen başvuruları onun listesindedir. İddia varsayılmadı, **testle çivilendi**
(`Applications_follow_the_newly_assigned_advisor`): gerçek çözümleyiciyle, atanmadan
önce 404 → `AssignAdvisor` → aynı iki satır listede.

**Bildirim EKLENMEDİ ve bu bilinçlidir.** Modülde başvuru bildirimi hiç yok —
danışmanlı kulüpte de yok; danışman bekleyenleri `pendingCount` kartından öğreniyor
(çekme, itme değil). Yalnız bu vaka için itme eklemek modülün kendi kuralını bozardı.
Ayrı iş olarak açılabilir.

**`Club.Activate()` DEĞİŞMEDİ.** Taslak kulüp hâlâ danışman atanmadan yayına çıkamaz.
İki kural aynı şeyi söylemiyor: *"sorumlusunu göstermeden yayına alma"* ayrı,
*"sorumlusu boşalınca kulübün hayatı dursun"* ayrı. Reddedilen yalnız ikincisi.

**Testler.** 6 test yeni kurala çevrildi (biri gerçek MSSQL'de: danışmansız kulüpte
hem onay hem ret çalışıyor ve `member_count` artıyor), 3 test eklendi. Aşırı düzeltme
kontrolleri bilerek bırakıldı: taslak/pasif kulüpte başvuru hâlâ kapalı, kontenjan ve
pencere kapıları yerinde. `oksis-api` 4957 test yeşil (1048'i gerçek SQL Server),
`oksis-ui` 918 test + lint + typecheck + build temiz.

**Yanında düzeltilen gerçek kusur.** Kulüp formundaki yardım metni koşulsuzdu ve
düzenleme modunda **yalan söylüyordu**: yayındaki bir kulübü düzenlerken de *"kulüp
Taslak olarak açılır"* diyordu, oysa danışmanı kaldırmak kulübü `Draft`'a çekmez.
Metin moda bağlandı ve yeni sonucu söylüyor.

### Turun dersi

Bir kuralın **gerekçesi**, kuralın yaşadığı katmandan başka bir katmanda yanlışlanmış
olabilir. `D1` domain'de doğru görünüyordu; onu çürüten şey uygulama katmanındaki
kapsam kapısıydı. Bir kısıtı savunmadan önce, gerekçesinin hâlâ ölçülebilir olup
olmadığına bakmak gerekiyor — bu madde iki tur boyunca "bilinçli asimetri" diye
korundu, oysa dayanağı en baştan yoktu.


---

## 31. `D-04` · Geri çekildi — ölçüldü, karşılığı bulunamadı (2026-08-31)

Kapanış türlerinin üçüncüsü: **düzeltilmedi, kapsam dışı da değil — geri çekildi.**
Bulgu 2026-08-12'de ölçüldü, bugünkü kodda karşılığı olan bir ekran bulunamadı ve
2026-08-31 karar turunda (`K-12` §D) kullanıcı geri çekilmesine karar verdi.

### Defterden taşınan blok

### `D-04` · Veli Portalı duyurular ekranında gereksiz header ❓
- **Belirti:** Header kaldırılacak.
- **Katman:** FE · **Öncelik:** ⚪ Düşük
- 🔎 **ARANDI, BULUNAMADI — bugünkü kodda karşılığı olan bir ekran yok** *(2026-08-12)*. Veli için duyuru yüzeyi olabilecek her yer tek tek ölçüldü:

| Nerede | Bugün ne var | Fazla header var mı |
|---|---|---|
| **Web**, veli rolü, `/announcements` | Duyuru listesi **hiç yok**: `announcements-screen.tsx` veli/öğrenciyi *"Duyurular şu an mobil uygulamada"* boş durumuna ayırıyor | **Hayır** — başlık yok |
| Web rota sarmalayıcısı | `page.tsx` yalnız `<AnnouncementsScreen />` çiziyor, `PageHeader` yok | **Hayır** |
| **Mobil** gelen kutusu | Ekran içi tek başlık: *"Duyurular"* + alt satır | **Hayır** — sekme gezgininde `headerShown: false`, yani bu **tek** başlık |

- 🔎 Ayrıca `"Veli Portal"` metni **iki depoda da hiç geçmiyor** ve web'de veliye özel ayrı bir portal rotası yok (`app/(dashboard)/` altında `parents` var, o da yönetici ekranı).
- ➡️ **İki olasılık:** (a) bulgu yazıldığından beri duyurular C-fazı çalışmasıyla düzelmiş olabilir, (b) kastedilen ekran başka bir şey. Ölçüm ikisini ayırt edemiyor.
- ⏸️ **Kullanıcı netleştirmesi bekliyor — kendiliğinden bir değişiklik YAPILMADI.** Mobil gelen kutusundaki başlığı kaldırmak, ekranı **başlıksız** bırakırdı (gezginde ikinci bir başlık yok); yani "gereksiz" olan bir kopya değil, ekranın tek adı. Hangi ekranda görüldüğü söylendiğinde bir dakikalık iş.

### Kapanış notu

✅ **GERİ ÇEKİLDİ — 2026-08-31** (`K-12` §D). Kendiliğinden hiçbir değişiklik
yapılmadı ve bu bilinçli: mobil gelen kutusundaki "Duyurular" başlığını kaldırmak
ekranı **başlıksız** bırakırdı — gezginde `headerShown: false` olduğu için ikinci bir
başlık yok, yani "gereksiz" olan bir kopya değil ekranın tek adıydı.

**Ders — bulgunun kendisi de bayatlayabilir.** Bu madde iki ölçüm turu boyunca
"netleşmemiş" olarak taşındı. Ölçüm iki olasılığı ayırt edemiyordu: (a) duyurular
C-fazı çalışmasıyla düzelmiş olabilir, (b) kastedilen ekran başka bir şeydi. Bir
bulguyu **belirsiz** tutmanın maliyeti, onu yanlış kapatmanın maliyetinden düşük ama
sıfır değil: her turda yeniden okundu, yeniden ölçüldü. Tekrar görülürse yeni ID ile
açılır.


---

## 32. `E-19` · Bayat bulgu — istek zaten karşılanmıştı (2026-08-31)

`K-12` karar turunun doğrulama adımında bulundu: madde bir eksiği tarif ediyordu, o eksik
**kapanmıştı** ve defter haberdar değildi.

### Defterden taşınan blok

### `E-19` · `homework.write` izni seed'de yok 🟡

`PermissionSeedData.cs:86-88` yalnız iki satır taşıyor: `homework.read`,
`homework.manage`. "Öğretmen yazar / yönetici yönetir" ayrımı üçüncü izne
dayanıyor ve o izin hiç açılmamış.

Bugün etkisi yok (modül yazılmadı), ama **modülün ilk adımı budur**: kapsam
kapılarının hepsi bu izin kodunun varlığını varsayıyor. `homework.manage` de
`grades.manage` emsaliyle `AllPermissionIds()` kataloğuna **girmemeli**, yalnız
`SchoolAdmin` satırıyla verilmeli — platform hesabı okul içi ödev kararı vermez.

### Ölçüm

✅ **ZATEN YAPILMIŞ — 2026-08-31 doğrulaması.** Maddenin iki isteği de karşılanmış durumda:

1. **`homework.write` seed'de VAR** — `PermissionSeedData.cs:88`
   (`"HOMEWORK", "WRITE", "homework.write"`), yanında `homework.read` (87) ve
   `homework.manage` (89).
2. **`homework.manage` `AllPermissionIds()` kataloğunda DEĞİL** — `RolePermissionSeedData.cs:322`
   katalogda yalnız `HomeworkRead`'i sayıyor; `HomeworkWrite` ve `HomeworkManage` satır 38–39'da
   **yalnız `SchoolAdmin`** rolüne veriliyor. Maddenin `grades.manage` emsaliyle istediği tam
   olarak buydu — platform hesabı okul içi ödev kararı vermiyor.

Hiçbir kod değişikliği yapılmadı; yalnız defter gerçekle eşitlendi.

### Ders — defter de bayatlıyor

Bu, karar turunda bulunan **beşinci** bayat iddiaydı (`TB-43`, `TB-46`, `TB-63`, `E-19` bayat;
`TB-82` hâlâ geçerli). Rastgele beş maddeden dördü. Bayat bir bulgu yalnız yanlış bilgi
değil — **yanlış boyutlandırma** üretiyor: `TB-43` bu yüzden XL sanılıp ayrı projeye
konmuştu, `E-19` ise bir fazın ilk adımı sayılmıştı. Defterin kendi kuralı (*her blok koddan
doğrulamayla başlar*) bundan sonra **karar ve planlama turlarına da** uygulanıyor.
