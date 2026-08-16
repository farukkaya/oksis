# OKSİS — Bulgu Kayıt Defteri

> **Kaynak:** İlk bakış testi, 1. parti (2026-08-08) — `Bulgular.md`
> **Kaynak 2:** Kod taraması, domain-map partisi (2026-08-10) — `oksis-api` @ `2270867` · bkz. [11. Kod Taraması Bulguları](#11-kod-taraması-bulguları-domain-map-)
> **Kaynak 3:** Kod taraması, duyurular/acil kavşağı partisi (2026-08-10) — `TB-22 … TB-26`, aynı bölümde
> **Kaynak 4:** Çalışma zamanı hata kaydı (2026-08-10) — çalışan API'nin yığın izinden doğrulanan bulgular: `B-15`, `X-06`
> **Kaynak 5:** **Uçtan uca ekran testi (2026-08-16)** — kurulumdan mezuniyete 8 faz,
> web + Android cihaz, her iddia uç/DB ölçümüyle · `oksis-api` @ `7667084` · `oksis-ui` @ `2325383`
> · bkz. [12. Uçtan Uca Ekran Testi](#12-uçtan-uca-ekran-testi--kurulumdan-mezuniyete-2026-08-16-)
> **İlgili:** [[OKSİS - Yapısal Kararlar ve Eksikler]]
> **Durum:** Test devam ediyor, yeni partiler bu dosyaya eklenecek.
> **Düzeltme turu:** 2026-08-16 akşamı başladı — bkz. [13. Düzeltme Turu](#13-düzeltme-turu--ekran-testi-bulguları-2026-08-16-)

> [!warning] Bu dosya **Multi-Column Markdown** eklentisi ister
> Ayarlar → Community plugins → Browse → **"Multi-Column Markdown"** (ckRobinson) → Install → Enable.
> Eklenti kurulu değilse içerik kaybolmaz, sadece iki sütun yan yana değil alt alta görünür.
> *(Yalnızca en alttaki [Netleştirme Bekleyenler](#netleştirme-bekleyenler-) bölümü iki sütunlu.)*

**Sıralama mantığı:** Modül/ekran bazlı gruplandım, modülleri de risk ağırlığına göre sıraladım (akış bloklayan modül en üstte). Rol bazlı bakmak isteyen için en altta çapraz indeks var.

**ID şeması** (yeni partilerde devam eder):
- `B-##` → Fonksiyonel bulgu
- `D-##` → Tasarım / UX bulgusu
- `V-##` → Validasyon & iş kuralı bulgusu
- `X-##` → Çapraz kesen iş
- `TB-##` → Teknik borç (kod taramasından)

**Sıradaki boş ID:** `TB-57` · `X-15` · `B-33` · `D-15` · `V-04` · `E-16` · `ENG-03`
*(2026-08-16 uçtan uca ekran testi partisi `B-21`…`B-32`, `D-09`…`D-14`, `V-02`·`V-03`,
`X-12`·`X-13`, `E-11`…`E-15` ve `TB-56`'yı aldı — bkz. [12. Uçtan Uca Ekran Testi](#12-uçtan-uca-ekran-testi--kurulumdan-mezuniyete-2026-08-16-).
`E-##` sayacı [[OKSİS - Yapısal Kararlar ve Eksikler]] ile ortaktır; orada `E-01`…`E-10` kullanılmıştı.)*

---

## Özet

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
**Açık kalanlar:** `V-01` (nöbet çizelgesi sezon yaşam döngüsü) · `D-04` (hedefi bulunamadı, netleştirme bekliyor) · `B-19` (ölü düğme — **karar bekliyor**) · `B-20` (içe aktarmada davet üretilmiyor 🟠) · `E-01` (rıza yenileme ekranı — **kapsam kararı bekliyor**) — ayrıca çapraz kesenler `X-03`/`X-05`/`X-06 geniş ayak`/`X-10`/`X-11 (CI ayağı)`.

---

### 2026-08-16 · Uçtan uca ekran testi partisi (28 yeni madde)

| Öncelik | Adet | Maddeler |
|---|---|---|
| 🔴 Kritik | 11 | `E-11` (hiç e-posta gitmiyor) · `E-12` (kapanış yüzeyleri yok) · `B-30` (devir sonrası öğrenci kayboluyor) · `B-31` (yarım mezuniyet) · `B-21` (sessiz veri kaybı) · `B-22` (rol sütunu/süzgeci ölü) · `B-24` (olmayan SMS "gönderildi") · `B-26` (iki görevlendirme kaynağı) · `B-27` (mobil oturum kalıcı değil) · `X-12` (uydurma veri) · `X-13` (sessiz hata) |
| 🟠 Yüksek | 5 | `B-23` (sabit kayıt tarihi) · `B-25` (artık taslak + sessiz 409) · `B-28` (öğretmene yönetici ekranı, 403 yanlış anlatılıyor) · `B-32` (ölü buton + onaysız devir) · `E-13` (dini bayramlar şemada yok) |
| 🟡 Orta | 3 | `B-29` (modül ekranı ölü) · `E-15` (modül envanteri üretilmiyor) · `E-14` (rehber öğretmen devri) |
| ⚪ Düşük | 9 | `V-02` · `V-03` · `D-09` … `D-14` · `TB-56` |
| **Toplam** | **28** | 12 fonksiyonel + 6 tasarım + 5 eksik özellik + 2 çapraz kesen + 2 validasyon + 1 teknik borç |

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

### D-04 · Veli Portalı duyurular ekranında gereksiz header ❓
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

> 🔧 **Kod taramasından bu bölüme bağlananlar** *(2026-08-10)*: `TB-22` (acil işareti yalnız oluşturma anında sorgulanıyor), `TB-23` (onay gerektiren duyuru zamanlanınca kuyruğu atlıyor), `TB-24` (acil = e-posta kanalı seed'de yazılı, tüketicisi yok), `TB-25` (şablon acil kapısı yok), `TB-26` (onay kuyruğunda acil rozeti yok). Beşi de → [Kod Taraması Bulguları](#11-kod-taraması-bulguları-domain-map-).

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

### E-01 · Rıza yenileme ekranı yok — 403 çıkışsız 🟠
- **Eksik olan:** Rızası geri çekilmiş ya da rıza paketi sürümü ilerlemiş kullanıcının **rızayı yeniden verebileceği bir ekran yok.** Ne web'de ne mobilde.
- **Katman:** FE · **Öncelik:** 🟠 Yüksek (mevzuat) · **Tip:** Eksik özellik — kapsam kararı kullanıcınındır
- **Nasıl bulundu:** `TB-10` kapanışının ardından yapılan çıkış yolu kontrolünde (2026-08-12).
- **Ölçüm — eksik olan backend değil, arayüz:** `POST /api/v1/users/consents` (`GrantConsentCommandHandler`) **var ve çalışıyor**; `users.update` yetkisi ve açık bir oturum istiyor, yani bir yönetici başkası adına rızayı yeniden verebilir. Ama arayüz bu ucu **hiç çağırmıyor**: `packages/api` + `apps/web` + `apps/mobile` içinde `users/consents` POST çağrısı **sıfır** eşleşme. FE'deki tek rıza yüzeyleri davet kabul ekranı (ilk onay) ve `users/self/consents` (geri çekme).
- **Sonuç — tek yönlü kapı:** `TB-10` ile birlikte rıza düşünce oturum artık gerçekten kapanıyor. Bu **doğru** davranış, ama kullanıcı için çıkışsız bir odaya dönüşüyor: giriş 403, yenileme 403, rızayı yeniden verecek ekran yok. Kullanıcının kendisi hiçbir şey yapamıyor; yöneticinin elinde de yalnızca doğrudan API çağrısı var, düğme yok.
- ⚠️ **Bugün sahada patlamıyor** çünkü rıza paketi sürümü hiç ilerletilmedi (`master.consent_bundles`: 1 satır, `v2026.05.01`) ve seed kullanıcılarının hepsi `Granted`. **İlk sürüm yükseltmesinde 381 rıza kaydının tamamı aynı anda kapıya takılır.**
- ❓ **Karar gerekiyor:** rıza yenileme ekranı MVP kapsamında mı? Kapsam dışıysa, sürüm yükseltmesinin **operasyonel bir engel** olduğu yazılı hâle gelmeli.
- 🔗 **`B-18` kapandı ama bu madde açık:** kullanıcı artık **doğru teşhisi** görüyor ("KVKK onayı gerekiyor"), çıkış yolu hâlâ yok. Teşhisin düzelmesi çıkışın yerine geçmez.

### B-19 · Askıya alma ekranındaki tek eylem düğmesi ölü ⚪
- **Belirti:** Giriş → askıya alınmış hesap ekranındaki birincil düğme **"Okul yönetimine yaz"** tıklanabilir görünüyor ama **hiçbir şey yapmıyor.**
- **Katman:** FE (web) · **Öncelik:** ⚪ Düşük
- **Nasıl bulundu:** `B-18` ekran ölçümünde, ÖNCE kanıtı alınırken (2026-08-12).
- **Ölçülen kök neden:** `apps/web/features/auth/login-screen.tsx` → `SuspendedView`, `<button type="button" className="au-btn">` — `onClick` yok, `href` yok. Görsel tasarımdan (Claude Design auth) taşınırken eylemi bağlanmamış.
- **Neden yalnız kozmetik değil:** ekranın söylediği tek eylem bu. Kullanıcı düğmeye basıyor, hiçbir şey olmuyor ve yönetime nasıl ulaşacağını hâlâ bilmiyor. Mobilde bu düğme **yok** (yalnız "Girişe dön"), yani ekranlar bu noktada da ayrışmış durumda.
- ❓ **Karar gerekiyor:** düğme ne yapmalı — okul e-postasına `mailto:` mı, uygulama içi bir iletişim ekranı mı, yoksa kaldırılıp metne mi indirgenmeli? Okulun iletişim adresi bugün istemcinin elinde yok (giriş yapılmamış oturum), bu yüzden `mailto:` bile veri gerektiriyor.

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

### TB-55 · İki ayrı toplu içe aktarma yolu yan yana yaşıyor 🟡
- **Bulgu:** Aynı iş — "dosyadan toplu kişi ekle" — için birbirinden habersiz **iki** uç var:
  - `POST /api/v1/users/import` (Identity): başlıklar `Ad, Soyad, Email, Rol`; senkron; `Person` + minimal profil + **davet** üretir; sezon ve rıza paketi önkoşulu arar.
  - `POST /api/v1/users/imports/preview` → `POST /api/v1/users/imports` (Users): profil tipine göre şablon (öğretmende `Brans`, öğrencide `OgrenciNo`…); önizleme + onay + Hangfire işi; **davet üretmez** (bkz. `B-20`), rol/sezon/rıza hiç sormaz.
- **Katman:** BE · **Öncelik:** 🟡 Orta · **Nasıl bulundu:** `TB-20` ölçümü sırasında (2026-08-12).
- **Neden borç:** İkisi de "içe aktarma" adını taşıyor ama farklı şey üretiyor. Bir okul öğretmen listesini hangisinden yüklerse yüklesin sonucu farklı: birinde branş yok ama davet var, diğerinde branş var ama davet yok. Hangisinin "doğru" yol olduğu koddan okunmuyor.
- 🔗 `B-20`'nin (davet bayrağı ölü) ve `TB-20`'nin "davet yolunda branş sorulmuyor" ayağının ortak zemini bu ikilik. Üçü birlikte düşünülmeli: tek bir içe aktarma yolu, hem branşı çözen hem daveti üreten.
- ⬜ **Karar gerekiyor:** hangisi kalacak? Birleştirme kapsam kararıdır; bugün ikisi de canlı.

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

### X-03 · Görevlendirme iki nesil hâlinde yan yana yaşıyor
- **Belirti:** Aynı iş alanı kodda **iki ayrı modelle** temsil ediliyor ve ikisi de canlı:
  - **v1** → öğretmen × şube × ders + haftalık saat · izin ailesi `teaching-assignments.*` · uçlar `teachers/{id}/assignments`, `teaching-assignments`
  - **v2** → öğretmen × ders **yetkinliği**, saat ve şube yok · izin ailesi `assignments.*` · uç `assignments`
- **Katman:** BE · **Öncelik:** 🟠 Yüksek
- **Neden çapraz kesen:** Ayrı tablo, ayrı izin ailesi, ayrı sezon kopyalama komutu, ayrı değişim olayı. İkisi de yıl geçişinde çalışabilir ve farklı eksenlerden kopyalar (v1 şube eşlemesi, v2 ders+öğretmen). Hangisinin kanonik olduğu koddan çıkmıyor.
- **Etkisi:** Yeni gelen geliştirici hangi nesle dokunduğunu bilmeden değişiklik yapıyor; `B-07` (sezon devrinde görevlendirme aktarılmıyor) bu ikilikle ilgili olabilir — hangi kopyalama komutunun çağrıldığı doğrulanmalı.
- ⬜ **Önce yapılacak:** Karar → v1 emekli mi, yoksa v2 yetkinlik katmanı olarak üstüne mi biniyor? Karar verilmeden altındaki hiçbir bulgu güvenle kapatılamaz. *(Karar maddesi olarak [[OKSİS - Yapısal Kararlar ve Eksikler]] dosyasına taşınmalı.)*
- ✅ **"Hangisi kanonik" sorusu cevaplandı (2026-08-10, `TB-48`):** bugünkü kodda **kanonik olan v1'dir**. Ders programı, otomatik üretim, vekâlet, duyuru hedeflemesi ve sezon aktivasyonu — beşi de v1'i okuyor. **v2'nin aşağı akış tüketicisi yoktur**, yalnız kendi ekranını besleyen kapalı devredir. Buna rağmen v1'in kullanıcıya açık yazma ekranı `oksis-ui`'dan kaldırılmış durumda; yani kanonik nesil beslenmiyor. Ölçümün tamamı `TB-48`'de.
- ⚠️ **Kapanmadı, ağırlaştı:** karar hâlâ verilmedi ve artık *"hangisi kanonik"* değil *"kesik hattı hangi yönde onaracağız"* sorusu. `TB-48`'deki üç yol.
- ⏸️ **KULLANICI 2026-08-12'de BİLİNÇLİ OLARAK ERTELEDİ:** *"bu konuyu şimdilik atla"*. Karar verilmedi, madde açık kalıyor ve bu turda ele alınmayacak. Bekletmenin bugünkü bedeli `TB-48`'de yazılı: yeni bir okulda `teaching_assignments` boş doğuyor, ders programı / otomatik üretim / vekâlet / duyuru hedeflemesi **sessizce** boş sonuç veriyor.

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

### X-10 · Rota kapısı rol çözülene kadar geçirgen — yanlış rol ekranı kısa süre görüyor ve istekleri atıyor
- **Belirti:** Öğrenci `/schedule` adresini açtığında yönetim konsolu **kısa süreliğine mount oluyor**; beş yönetim isteği gerçekten atılıyor (`class-rooms`, `class-rooms?sessionId`, `school-settings/grade-levels`, `users/persons?profileType=Teacher`, `timetable/programs`) ve **beşi de 403** dönüyor. Rol çözüldükten sonra ekran *"Bu sayfaya erişemezsiniz"*e dönüyor.
- **Katman:** FE · **Öncelik:** 🟡 Orta
- **Nasıl bulundu:** `B-17` kapanış ölçümü, 2026-08-12 — menü budaması doğrulanırken ağ sekmesinde görüldü. `B-17`'nin ürünü **değil**, ondan bağımsız ve önceden var.
- 🔍 **Kök neden tek koşulda:** `apps/web/components/route-guard.tsx:24` → `if (activeRole && !canAccessRoute(activeRole, pathname))`. `activeRole` henüz **null** iken (oturum bağlamı sorgusu sürüyor) koşul kısa devre yapıyor ve sayfa **olduğu gibi** render ediliyor.
- ⚠️ **Bu bir gözden kaçma DEĞİL, yazılı bir tercih:** dosyanın kendi yorumu diyor ki *"Rol henüz çözülmemişken sayfa olduğu gibi render edilir: burada engellemek her gezinmede boş ekran flaşı yaratır."* Yani biri bu ödünü tartmış ve bugünkü davranışı seçmiş. **Bu yüzden tek başıma değiştirmedim.**
- 🔍 **Ama tartının bir tarafı eksik ölçülmüş:** ödün *"boş ekran flaşı"* ile karşılaştırılmış, oysa gerçekte olan **yanlış ekranın çizilmesi + beş reddedilen istek**. Ayrıca kaçınılmak istenen flaş için gereken sinyal **zaten mevcut**: `useActiveRole` `isLoading` alanını da döndürüyor. Yani "rol yok" ile "rol henüz gelmedi" ayırt edilebilir ve kapı yalnız ikincisinde bekletebilir — boş ekran yerine iskelet gösterilerek.
- 📌 **Kapsamı tek ekran değil:** kural her korumalı rotada aynı; `/schedule` yalnız ölçüldüğü yer. Güvenlik sınırı değil (gerçek kapı .NET tarafında, beş istek de 403 aldı) ama `B-17`'nin ve `B-01`'in şikâyet ettiği şeyin ta kendisi: **kullanıcıya sahip olmadığı bir yetenek gösteriliyor.**
- ⬜ **Açık — karar gerektiriyor:** yazılı bir tercih değiştirileceği için `RouteGuard`'ın yükleme penceresinde bekletilmesi onaylanmalı.

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

### TB-19 · Geçici muafiyet hiçbir aşamada tam uygulanmıyor 🟠
- Çizelge taslağı kaydedilirken ve otomatik sonuç uygulanırken **yalnızca sürekli** muafiyet dikkate alınıyor; geçici muafiyet bilinçli olarak dışarıda bırakılmış ("tarihe bağlı, tüketim anında uygulanır").
- Dağıtım işi ise geçici muafiyeti **yalnızca işin çalıştığı günün tarihine** göre değerlendiriyor — dönem aralığına değil. Kasımda muaf olan öğretmen, dağıtım ekimde çalıştırılırsa havuza giriyor.
- Kodun yorumu "dönem-kapsayan geçici muafiyet" diyor ama uygulama tek güne bakıyor — **niyet ile kod ayrışmış.**
- ✅ **CANLIDA DOĞRULANDI — kırık olduğu ölçüldü** *(2026-08-12, `B-13` ölçüm turunun içinde · `mudur.s2`, dönem 2026-08-03 → 08-14, koşturma günü **2026-08-12**)*. Aynı öğretmene iki farklı geçici muafiyet verilip dağıtım koşturuldu:

| Geçici muafiyet penceresi | Koşturma gününü kapsıyor mu | Nöbetçi | Vekil |
|---|---|---|---|
| 2026-08-11 → 08-13 | **evet** | 0 | 0 |
| **2026-08-13 → 08-14** *(dönem içinde)* | **hayır** | **2** | **3** |

  ➡️ Dönem içinde muaf olduğu günler için öğretmene nöbet **ve** vekillik yazıldı. Bulgunun koddan okunan iddiası birebir çıktı.
- 🔍 **Kök neden tek satır ve niyet koda yazılıyken kod onu yapmıyor** — `Infrastructure/BackgroundJobs/Jobs/AutoDistributeDutyJob.cs:96-101`. Yorum *"Muafiyet: Permanent + **dönem-kapsayan** Temporary (K-2c-7)"* diyor, hemen altındaki kod `e.CoversDay(today)` çağırıyor. Yani süzgeç dönem aralığına değil, **yöneticinin butona bastığı güne** bakıyor.
- ✅ **AÇIK OLAN SORU CEVAPLANDI — "tüketim anında uygulanır" denen kontrol HİÇ YOK.** `CoversDay` repo genelinde **yalnız üç** yerden çağrılıyor (`AutoDistributeDutyJob`, `GetDutyHubSummaryQueryHandler`, `GetDutyRosterForEditQueryHandler`) ve **üçü de `today` geçiyor**. Vekil seçicisi (`GetAvailableRelievers` — tüketime en yakın nokta) yalnız **`Permanent`** süzüyor. `SaveDutyRosterDraftCommandHandler`'daki *"Temporary exemptions are date-bound and apply per-date at consumption — NOT here"* yorumu **gerçeği yansıtmıyor**: işaret ettiği tüketim noktası yazılmamış.
- ➡️ **Bugünkü net durum:** geçici muafiyet, yalnız pencereye denk gelen bir günde ekran açılırsa/dağıtım koşarsa etki ediyor. Yönetici muafiyeti önceden girerse (normal kullanım) **hiçbir şey yapmıyor**.
- 🚫 **NAİF DÜZELTME YANLIŞ OLUR — ölçülerek görüldü:** `today` yerine dönem aralığı örtüşmesi koymak, 5 aylık dönemde **2 gün** muaf olan öğretmeni **dönemin tamamından** çıkarır. Sebep yapısal: `duty_assignments` tarih değil **`day_of_week`** taşıyor, yani çizelge haftalık-tekrarlı; tarih penceresi haftalık tekrara birebir eşlenemiyor.
- ⏸️ **KAPSAM KARARI GEREKİYOR (kendi başıma başlanmadı):** iki günlük muafiyet (a) öğretmeni dönem çizelgesinden tamamen çıkarsın mı, yoksa (b) çizelgede kalıp o tarihlerde yerine **vekil** mi geçsin? (b) doğru ürün davranışı gibi duruyor ama bugün karşılığı olan bir tüketim noktası yok — yani yeni iş demek. Karar verilene kadar madde açık.
- 📌 **Önceliği yükseltildi 🟡 → 🟠:** artık *"koddan okundu"* değil, canlıda üretilmiş, kullanıcıya görünen yanlış çizelge.

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

### TB-29 · Öğretmen kendi müsaitliğini giremiyor 🟡
Öğretmen müsaitliği (hangi saatte ders veremez / vermeyi tercih etmez) otomatik üretimin sert ve yumuşak girdisi, ama **tek yazma yüzeyi yönetici**. Öğretmenin kendi tercihini girebileceği bir yol yok; yönetici her öğretmeninkini elle işaretlemek zorunda.
- ❓ Bilinçli kısıt mı, yapılmamış ekran mı belirsiz. Pilotta yönetici yükünü ciddi artırır.
- **Ayrıca:** Nöbet dağıtımı müsaitliği **gün seviyesine** indirgiyor (bir günde tek bir engelli saat varsa günün tamamı kapalı sayılıyor), ders programı ise saat bazında okuyor. İki modül aynı veriyi iki farklı çözünürlükte yorumluyor.

### TB-30 · Etkinlikte grup devri turlardaki öğretmeni güncellemiyor 🟡
Etkinlik sayım turu oluşturulurken grubun sorumlu öğretmeni **tura da kopyalanıyor**. Sonra grup sorumluluğu devredilince yalnız gruptaki alan güncelleniyor; turdaki kopya **eski öğretmende kalıyor**.
- **Etkisi:** Aynı bilgi iki yerde tutuluyor ve devirden sonra ayrışıyor. Tur listesi eski sorumluyu gösteriyor olabilir — güvenlik sayımında "bu turdan kim sorumluydu" sorusu yanlış cevaplanır.
- **Çözüm yönü:** Turdaki kopya kaldırılıp okuma anında gruptan çözülmeli. `ActivityGroup` zaten "adı değil kimliği sakla, ad bayatlar" ilkesini uyguluyor — aynı ilke burada da geçerli, ama uygulanmamış.

### TB-31 · Devamsızlık eşik bildiriminde fail-open 🟡
Eşiğe gelen öğrenci için mükerrer bildirim iki katmanla önleniyor: hızlı bir önbellek kapısı ve arkasında kalıcı damga. Önbellek erişilemezse sistem **açık kalıyor** (fail-open) ve DB yedeğine düşüyor.
- **Etkisi:** Kesinti anında aynı öğrenci için mükerrer eşik uyarısı gidebilir. Veli/öğrenciye giden bildirim olduğu için gürültü doğrudan hissedilir.
- ⬜ **Karar gerekiyor:** Kesintide bildirim **gitsin mi gitmesin mi**? Kapalı kalma (fail-closed) uyarıyı geciktirir; açık kalma mükerrer üretir. Kod bugün ikincisini seçmiş ama gerekçesi yazılı değil.

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

### TB-38 · İki belge akışı, iki farklı depolama yaklaşımı 🟡
- **Mazeret belgesi** → dosya yönetimi modülündeki saklı dosyaya **referans** veriyor; kod açıkça "yeni depolama icat etme" diyor.
- **Öğrenci belgesi** → dosya adresini **serbest metin** olarak kendi kaydında tutuyor.

Aynı ürün içinde iki evrak akışı, iki farklı yaklaşım. Öğrenci belgesi tarafı dosya yönetimi modülünün sağladıklarından (virüs taraması, kota, yetim dosya temizliği, erişim denetimi) yararlanamıyor.
- ⬜ **Karar:** Öğrenci belgesi de saklı dosya referansına taşınsın mı?
- ➕ **Ayrışmanın bir sebebi bulundu** *(dosya yönetimi taraması, 2026-08-10)*: Dosya kategorisi defterinde **öğrenci belgesi diye bir kategori hiç yok**. Yani taşıma kararı tek başına yetmez; önce bir kategori açılması ve o kategorinin **saklama süresine karar verilmesi** gerekir (KVKK kararı — mazeret belgesininki bile "teyit bekleyen taslak" diye işaretli).

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

### TB-42 · Dört dosya kategorisinin bağlanabileceği kayıt tipi yok 🟡
İki ayrı kayıt defteri var ve **örtüşmüyorlar**:
- **Kategori defteri** (kodda sabit): ödev teslimi, sınav belgesi, sanal kitap, okul logosu, kulüp belgesi, duyuru eki, mazeret belgesi, önizleme.
- **Erişim çözümleyici defteri** (DI kayıtları): yalnız **okul**, **mazeret**, **duyuru**.

Yani ödev teslimi, sınav belgesi, sanal kitap ve kulüp belgesi kategorileri tanımlı ve kategori politikası ucundan okunabiliyor — ama o dosyalar hiçbir kayda **bağlanamıyor**; deneme sessizce reddediliyor (404).
- Kod bunu "henüz tüketicisi gelmemiş" diye açıklıyor, yani bilinçli bir bekleme.
- **Risk:** Kategori politikası ucu bu kategorileri gerçekmiş gibi gösteriyor. Arayüz bu listeden beslenirse kullanıcıya çalışmayan seçenek sunulur.
- ⬜ **Karar:** Tüketicisi olmayan kategoriler defterden çıkarılsın mı, yoksa "hazırlanıyor" diye işaretlensin mi?

### TB-43 · Bildirim ayarlarının teslimata hiçbir etkisi yok 🟠
Okul Ayarları'ndaki "Bildirimler" sekmesi üç kanallı bir olay×kanal matrisi sunuyor. **Hiçbiri çalışmıyor.** Üç ayak da ölü:
- **Kural matrisi** (`NotificationRuleConfig`) yalnız kendi ayar sorgusunda/komutunda okunup yazılıyor; dağıtım motoru ona **hiç bakmıyor**.
- **Kanal anahtarları** (push/e-posta/SMS) ve **ana kapama anahtarı** da dağıtımda okunmuyor. Motor kayıtlı tüm kanallar × tüm alıcılar üzerinde koşulsuz döner.
- **Kayıtlı tek kanal in-app.** E-posta, SMS ve push kanallarının uygulaması yok — matriste sunulan iki kanalın arkasında hiçbir şey yok.

**Etkisi:** Yönetici bir olayın SMS'ini kapatıyor, e-postayı açıyor, hatta bildirimleri tümden kapatıyor — davranış değişmiyor. Ekran gerçeği yansıtmıyor.
- **Aile:** `TB-35` ile aynı desen (ayar var, tüketici yok) ama daha geniş — orada bir alan ölüydü, burada ayar sekmesinin tamamı.
- ⬜ **Karar:** Ayarlar teslimata bağlansın mı, yoksa ekran bugünkü gerçeğe (tek kanal) indirgensin mi? İkisinin arasında kalmak en kötüsü.

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

### TB-46 · Not ve sınav yapılandırması tüketicisiz, üstelik ağırlık iki yerde tanımlı 🟡
Notlandırmanın tüm yapılandırma yüzeyi hazır ama **arkasında hiçbir şey yok** — not modülü boş klasör (`TB-13`).
- **Sınav ağırlığı iki ayrı yerde:** master sınav türünde tür başına yüzde (`ExamType.WeightPercent`), okul akademik politikasında ise yazılı/performans ağırlığı (`WrittenWeight` + `PerformanceWeight`, toplamı 100 olmak **zorunda** — doğrulayıcısı var).
- **İkisinin de tüketicisi yok.** `WeightPercent` hiçbir yerde okunmuyor; okul ayarındaki ağırlıklar yalnız kendi CRUD'unda dönüyor.
- Aynısı geçme notu, yuvarlama kuralı, yazılı/performans sayısı ve not ölçeği seçimi için de geçerli: seçiliyor, doğrulanıyor, saklanıyor — kullanılmıyor.
- **Etkisi (bugün):** Yönetici akademik politikayı dolduruyor ve hiçbir şey olmuyor. `TB-35`/`TB-43` ile aynı aile.
- **Etkisi (yarın):** Not modülü geldiğinde **iki rakip ağırlık tanımı** hazır bekliyor olacak ve hangisinin yetkili olduğuna dair yazılı bir karar yok.
- ⬜ **Karar (not modülünden ÖNCE):** Ağırlık master sınav türünde mi, okul politikasında mı yaşayacak? İkisi birden kalırsa ilk not hesabında çakışır.

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

### TB-48 · Görevlendirme v1'in tek yazma yüzeyi kapalı, yedi tüketicisi hâlâ ona bağlı 🔴

"Şube Ders Görevlendirmesi" (v1) ekranı `oksis-ui`'dan kaldırıldı. Backend'de kalan kod **artık atıl değil, tam tersine yük taşıyan taraf** — ve besleme hattı kesik.

**İki nesil, tek cümlelik farkı:**
- **v1** → `TeachingAssignment` · `academic.teaching_assignments` · öğretmen × şube × ders + **haftalık saat**
- **v2** → `SubjectTeacherAssignment` · `academic.subject_teacher_assignments` · öğretmen × ders yetkinliği; **şube ve saat bilinçli olarak yok**

**Yazma yüzeyi (ölçüldü).** v1'e yazan yalnız üç uç var: `POST /api/v1/teachers/{id}/assignments`, `DELETE .../{assignmentId}`, `POST /api/v1/teaching-assignments/copy-season`. `oksis-ui` içinde bu üçünü çağıran **hiçbir istemci kodu yok** — geçtikleri tek yer üretilmiş `packages/api/src/generated/schema.ts` ve izin sabitleri. İstemcinin fiilen kullandığı hat tamamen `/api/v1/assignments/*` yani v2. Yani **v1 tablosuna bugün hiçbir kullanıcı satır yazamıyor** (dev ortamındaki `TimetableDevSeeder` hariç).

**v1'i okuyan yedi tüketici, hepsi canlı:**

| Tüketici | Dosya | Ne için okuyor |
|---|---|---|
| Ders programı — yerleşmemiş dersler | `Infrastructure/Timetable/TeachingAssignmentSource.cs` | `AssignmentLine(SubjectId, TeacherId, **WeeklyHours**)` |
| Otomatik üretim — aday şubeler | `Infrastructure/Timetable/AutoGenClassResolver.cs:30` | görevlendirmesi olan şubeler |
| Otomatik üretim ekranı | `Timetable/Queries/GetAutoGenClasses:41` | aynı veri yolu |
| Yayın önizleme / hazırlık | `Timetable/Queries/GetPublishPreview`, `Services/PublishReadiness` | kapsama ölçümü |
| Vekâlet aday havuzu | `Duties/…/GetAvailableSubstitutes:138` | adayın ders kategorileri |
| Duyuru hedefleme | `Infrastructure/Announcements/AudienceResolver.cs:321, 548` | öğretmenin "kendi şubelerim / derslerim" hedefi |
| Sezon geri alma koruması | `AcademicSessions/Shared/SetupSeasonReverter.cs:50` | görevlendirme varsa geri alma reddedilir |

Buna ek olarak **sezon aktivasyonu** v1 kopyalayıcısını doğrudan çağırıyor: `ActivateSeasonRolloverCommandHandler.cs:90` → `CopyAssignmentsToNewSeasonCommandHandler`.

**v2'nin aşağı akış tüketicisi sıfır.** `SubjectTeacherAssignments` DbSet'i yalnız `Modules/Academics/Assignments/*` içinde okunup yazılıyor — kendi ekranını besliyor, başka hiçbir modüle gitmiyor. Kapalı devre.

- **Etkisi (bugün):** yeni bir okulda `teaching_assignments` boş kalıyor. Ders programı editörü "yerleşmemiş ders" göstermiyor, otomatik üretim aday şube bulamıyor, vekâlet adayları ders kategorisiz çıkıyor, öğretmenin duyuru hedef ağacındaki "kendi şubelerim" boş dönüyor. Hepsi **sessiz** — hata değil, boş sonuç. Bu yüzden ekran kaldırıldığında kimse fark etmedi.
- **Neden basit silme değil:** v2 şube ve saat taşımadığı için `AssignmentLine` sözleşmesi ondan **üretilemez**. v1 kazınırsa ders programı motorunun girdisi tamamen kaybolur; sezon aktivasyonu ve duyuru hedeflemesi de kırılır.
- 🚫 **Kısıt:** Bu bir temizlik işi değil, veri modeli kararı. Tüketicileri tek tek "boş dönerse şöyle yapsın" diye yamamak kabul değil.
- ⬜ **Karar gerekiyor — üç yol:**
  1. **v1 ekranı geri gelir**, v2 üstte yetkinlik katmanı olarak kalır. Bugünkü kod bunu varsayıyor; en az iş.
  2. **v2 genişletilir** (şube + haftalık saat taşır), yedi tüketici v2'ye taşınır, v1 ondan sonra kazınır. Doğru hedef, en çok iş.
  3. Ders programı / vekâlet / duyuru hedeflemesi kapsam dışına alınır — pratikte olmaz.
- 🔗 **`X-03`'ün cevabı bu maddede.** Ayrıca `B-07` (sezon devrinde görevlendirme aktarılmıyor) buradan açıklanıyor: aktarım kodu v1'i kopyalıyor, v1'de veri yok.

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

### E-13 · Resmî tatil kataloğu dini bayramları taşıyamıyor 🟠
- **Belirti:** `/settings` → Tatil Takvimi, 2025-2026 sezonu için **"Resmî: 5 kayıt"**:
  29 Ekim · 1 Ocak · 23 Nisan · 1 Mayıs · 19 Mayıs.
- **Ölçüm:** `master.official_holidays` **tüm içeriği 7 satır** ve şema `month`, `day`, `is_annual`:
  Yılbaşı · 23 Nisan · 1 Mayıs · 19 Mayıs · 15 Temmuz · 30 Ağustos · 29 Ekim.
- **Eksik:** Ramazan ve Kurban Bayramı. 2026'da ikisi de sezon içine düşüyor
  (Ramazan ~19–21 Mart, Kurban ~26–29 Mayıs) ve okullar tatil. Arife yarım günleri de yok.
- **Neden yalnız veri eksiği değil:** Tablo sabit ay/gün tutuyor; dini bayramlar hicri takvime
  bağlı olduğu için **her yıl kayıyor** ve 3,5–4,5 gün sürüyor. Mevcut şema bunu ifade edemez —
  yıl bazlı tarih aralığı + arife (yarım gün) desteği gerekiyor.
- **Etkisi:** Devamsızlık hesabı, ders programı, akademik takvim ve yoklama pencereleri
  bayram günlerini normal ders günü sayıyor.

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

**Kanıt:** ![[fix-b22-rol-suzgeci.png]] · ![[fix-x13-merkezi-hata-yuzeyi.png]]

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

#### `X-14` · Sunucu hata mesajı olarak çeviri anahtarı gönderiyor (198 anahtar) 🟠
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

### Ölçüldü ama kapatılamadı
- **`X-13`'ün 401 ayağı:** "oturum dolunca ekran bayat veri göstermeye devam ediyor"
  yeniden üretilemedi. `auth-refresh.ts` yolu doğru görünüyor (refresh başarısızsa
  `auth.clear()` + `onUnauthorized()` → `/login`). Bu ayak `B-27` ile birlikte
  mobil oturum turunda tekrar ölçülecek.
