# OKSİS — Yapısal Kararlar ve Eksikler

> **Kaynak:** İlk bakış testi, 1. parti (2026-08-08) — `Yapısal Kararlar-Eksikler.md`
> **2. parti:** Duyurular C4 fazı uygulaması (2026-08-09) — `K-05`, `E-07`…`E-10`, `TB-02`…`TB-06`
> **3. parti:** Uçtan uca ekran testi (2026-08-16) — `K-06`…`K-09`; bulguların tamamı [[OKSİS - Bulgu Kayıt Defteri]] §12'de
> **İlgili:** [[OKSİS - Bulgu Kayıt Defteri]]
> **Durum:** Test devam ediyor, yeni partiler bu dosyaya eklenecek.

> [!warning] Bu dosya **Multi-Column Markdown** eklentisi ister
> Ayarlar → Community plugins → Browse → **"Multi-Column Markdown"** (ckRobinson) → Install → Enable.
> Eklenti kurulu değilse içerik kaybolmaz, sadece iki sütun yan yana değil alt alta görünür.

> [!tip] Nasıl kullanılır
> Her açık kararda **sol sütun bağlam** (benim yazdığım), **sağ sütun senin karar alanın**.
> Bir karar verdiğinde: sağ sütunu doldur → oradaki **Durum**'u `✅ Karara bağlandı` yap → aşağıdaki **Karar Panosu**'nda o satırı güncelle.

---

# 📋 Karar Panosu

**Karara bağlanan: 10 / 14**

| ID | Konu | Durum | Tarih | Karar özeti |
|:--|:--|:--|:--|:--|
| **K-01a** | Nöbet & Vekalet bildirimleri | ✅ Karara bağlandı | 2026-08-08 | Atamanın iki tarafına anlık · **yancıya bölge bilgisiyle yeni satır** · veli/öğrenci yok → [[K-01 - Bildirim Matrisi]] |
| **K-01b** | Ders Programı bildirimleri | ✅ Karara bağlandı | 2026-08-08 | Yayın ve iptal anlık, revizyonlar gün sonu özet → [[K-01 - Bildirim Matrisi]] |
| **K-01c** | Sezon Yönetimi bildirimleri | ✅ Karara bağlandı | 2026-08-08 | Yalnız yönetici · devir hatası e-posta da alır → [[K-01 - Bildirim Matrisi]] |
| **K-02** | OS push altyapısı | ✅ Karara bağlandı | 2026-08-08 | Expo istemci + doğrudan FCM/APNs · Web Push dışarıda · Android önce → [[K-02 - OS Push Altyapısı]] |
| **K-03** | Hata görünürlüğü / log stratejisi | ⬜ Bekliyor | — | — |
| **K-04** | Anaokulu gizleme sınırı (BE mi FE mi) | ⬜ Bekliyor | — | — |
| **K-05** | Web'de öğretmen duyuru detay yüzeyi | ⬜ Bekliyor | — | — |
| **K-06** | Kadro davet/iletişim kanalı: e-posta mı, tek seferlik şifre mi? | ✅ Karara bağlandı | 2026-08-16 | SMTP bağlandı; SMS/WhatsApp seçilemez |
| **K-07** | Sezon kapanış yüzeyi: kayıt yenileme akışı yazılacak mı? | ✅ Karara bağlandı | 2026-08-16 | Tam akış yazılacak |
| **K-08** | Dini bayramlar için tatil şeması değişikliği | ⏸️ Ertelendi | 2026-08-16 | Ayrı iş olarak planlanacak |
| **K-09** | Yer tutucu veri politikası (panel/mobil anasayfa) | ✅ Karara bağlandı | 2026-08-16 | "Örnek veri" rozeti |
| **K-10** | Ders programının görevlendirme kaynağı (v1 mi v2 mi) | ✅ Karara bağlandı | 2026-08-16 | v2 + müfredattan türet, v1 emekli |
| **Y-01** | Görevlendirme bildirimi | ✅ Karara bağlandı | 2026-08-08 | Görevlendirilen öğretmene bildirim gider |
| **Y-02** | Anaokulu kademesi ekranlardan kaldırılsın | ✅ Karara bağlandı | 2026-08-08 | Ekranda gizlenir, altyapı korunur |

**Kritik yol:** ~~`K-02`~~ → ~~`K-01a/b/c`~~. **İkisi de çözüldü (2026-08-08)** — bildirim zinciri baştan sona karara bağlandı. Kalan açık kararlar `K-03`, `K-04` ve `K-05` birbirinden bağımsız; sıra artık **uygulamada**: [[K-02 - OS Push Altyapısı]] Parti 1 ile [[K-01 - Bildirim Matrisi]] §8 doğan işleri.

> [!warning] Matrisin açtığı iki zorunluluk
> - `B-13` · `B-14` · `B-07` kapanmadan ilgili satırlar canlıya alınamaz — hatalı veri üstüne kurulan bildirim hatayı yayar.
> - K-02'nin ertelediği **toplu gönderim throttle'ı** artık isteğe bağlı değil: `K-01b` "program yayınlandı" satırını push olarak kararlaştırdı (~1.560 alıcı).

> [!danger] C4'ün açtığı zorunluluk — `TB-02`
> Bildirim uçlarının kalıcı mock'u yok. C4 boyunca **dört kez** geçici scaffold kurulmak zorunda kalındı ve rol duyarlı bildirim yönlendirmesi **uçtan uca hiçbir zaman ekranda ölçülemedi**. K-02 push zincirinin doğrulaması da aynı boşluğa çarpacak: teslim ölçülemezse push'un çalıştığı da ölçülemez. **Push uygulamasından önce kapatılmalı.**

---

**ID şeması** (yeni partilerde devam eder):
`K-##` bekleyen karar · `Y-##` verilmiş karar · `E-##` eksik özellik/ekran · `TB-##` teknik borç

---

# A. Bekleyen Kararlar 🔒

Bunlar netleşmeden ilgili iş kalemleri başlatılamaz.

---

## K-02 · OS push bildirim altyapısı

> ✅ **2026-08-08'de karara bağlandı.** Tam belge: [[K-02 - OS Push Altyapısı]]

--- start-multi-column: K-02
```column-settings
number of columns: 2
largest column: standard
border: off
```

### 📄 Bağlam

**Durum:** ✅ Karara bağlandı — 2026-08-08.

**Neden bloklayıcıydı**
K-01 bildirim matrisindeki "kanal" ekseni buna bağlıydı. Kanal seçenekleri belli olmadan matris yarım kalıyordu. **Artık serbest.**

**Karar öncesi mevcut durum**
Stack'te FCM *planlı* görünüyordu ama onaylanmış değildi. Kodda `INotificationChannel` olarak yalnız `InAppNotificationChannel` kayıtlıydı — yani veli uygulamayı kendisi açmazsa telefonuna hiçbir şey düşmüyordu.

**Karar için gereken bilgi**
- Mobil uygulamanın dağıtım biçimi (native / Expo)
- iOS + Android tek hattan mı yönetilecek?
- Maliyet / kota beklentisi
- Web push da kapsamda mı?

**Seçenekler**
- FCM (planlanan)
- APNs + FCM ayrı ayrı
- OneSignal
- Expo Push

**Bloklar:** `K-01a` `K-01b` `K-01c` `E-05`

--- column-break ---

### ✍️ Karar Alanı

**Durum:** ✅ Karara bağlandı
**Tarih:** 2026-08-08
**Karar veren:** Faruk Kaya

> [!success] 📄 Tam karar belgesi: [[K-02 - OS Push Altyapısı]]
> Mimari, kapsam, iş parçaları, doğrulama ve hesap hazırlığı orada.

**Karar**
> **Paket B — Expo istemci + doğrudan sağlayıcı.** İstemcide yalnız `expo-notifications` (native device token). Backend Android'e FirebaseAdmin ile FCM v1, iOS'a doğrudan APNs HTTP/2 gönderir.
>
> **Web Push kapsam dışı**, ama `user_devices`'a `Platform`/`Provider` kolonları baştan konarak kapı açık bırakılır.
>
> **Cihaz başına tek aktif hesap** — token o an girişli Account'a bağlanır, diğer hesaplardaki satırları silinir.
>
> **Android önce, iOS Apple hesabı gelince.**

**Gerekçe**
> Kırılganlığı istemciden (Expo CNG + RNFirebase config plugin riski) backend'e — tamamen kontrol edilen .NET koduna — taşır. Veri işleyen sayısını 2'ye indirir; Expo sunucuları hiç devrede değil. Cihaz başına hata verdisi tek turda gelir, teslim ölçülebilir olur. iOS push ücretli Apple hesabı olmadan geliştirilemez; Android bugün hiçbir mağaza hesabı olmadan uçtan uca test edilebilir — B'de iki yol zaten ayrı olduğu için Android tek başına ilerler.

**Değerlendirilen alternatifler**

| Seçenek | Artı | Eksi |
|:--|:--|:--|
| **B — Expo + doğrudan FCM/APNs** ✅ | Hafif native kurulum · 2 veri işleyen · hata tek turda · Android tek başına ilerler | Backend'de iki gönderici |
| C — Firebase tam yığın (RNFirebase) | Backend'de tek entegrasyon · kanonik dokümanın yolu | Expo CNG'de ağır kurulum · config plugin riski · iOS de Google'dan geçer |
| A — Expo Push Service | En az kod | EAS bağımlılığı · 3. veri işleyen (KVKK) · iki turlu hata modeli |
| OneSignal | Hazır segmentasyon/analitik | Hedeflemeyi ve öğrenci/veli verisini ABD SaaS'ına taşır · KVKK'yı kötüleştirir |

> [!important] KVKK istisna kabulü
> Push için Google/Apple altyapısı yapısal olarak zorunlu, `security-rules.md:278` ("veri TR'de tutulur") ile çelişiyor. **Bilinçli bir istisna kabulüdür**, gözden kaçmış uyumsuzluk değil. Paket B, isteğe bağlı üçüncü işleyiciyi (Expo) eleyerek yüzeyi asgariye indirir. Pilot öncesi hukuk görüşü + aydınlatma metni güncellemesi ayrı iş.

**Doğan işler**
- [ ] `K-01a/b/c` matrisinin **kanal ekseni** artık doldurulabilir — bu kararın asıl çıktısı
- [ ] D-U-N-S başvurusu *(Apple + Google kurumsal hesabın ortak ön koşulu, takvimin uzun ayağı)*
- [ ] Firebase projesi *(ücretsiz, Parti 1 ve 2 yalnız bunu bekler)*
- [ ] Play Console'un 2024'te kapatılan hesabının durumu destekten teyit edilsin
- [ ] ADR-002 → `oksis/.claude/specs/adr-002-os-push-altyapisi.md`
- [ ] Yeni `TB` maddesi: `appsettings.json`'da düz metin SMTP parolası

--- end-multi-column

---

## K-01 · Bildirim matrisi (kim → neyi → ne zaman)

> Orjinal Listede([[Yapısal Kararlar-Eksikler]])**üç ayrı madde** olarak duruyordu (madde 4, 5, 7). Üçü de aynı sorunun aynı şekli. Ayrı ayrı karar verilirse tutarsız bildirim davranışı çıkar — **tek matris mantığıyla** doldurulmalı.
>
> **Karar eksenleri:** *tetikleyen olay × hedef rol × kanal × zamanlama*
> **Roller:** Yönetici · Öğretmen · Veli · Öğrenci
> **Kanallar:** In-app · Push · E-posta — ✅ *`K-02` çözüldü, kanal ekseni artık doldurulabilir. Bkz. [[K-02 - OS Push Altyapısı]]*
> **Zamanlama:** Anlık · Günlük özet · Yok

### K-01a · Nöbet & Vekalet bildirimleri

--- start-multi-column: K-01a
```column-settings
number of columns: 2
largest column: standard
border: off
```

### 📄 Bağlam

**Kaynak:** Orijinal madde 4

**Kapsanacak olaylar**
- Çizelge yayınlandı
- Nöbet ataması değişti
- **Yancı ataması yapıldı / değişti / kaldırıldı** *(koşullu — yancılık ayarı açıkken)*
- Vekalet atandı
- Vekalet iptal edildi
- Muafiyet onaylandı / reddedildi
- Nöbet günü hatırlatması

**Dikkat**
`B-13` (muafiyetliye nöbet atanıyor) çözülmeden bildirim gönderilirse **yanlış bilgi** yayılır.

> [!danger] Sonradan eklenen olay — yancı bildirimi
> Yancılık `SchoolSettings.DutiesRelieverEnabled` ile açılan bir okul ayarı; açıkken atamaya `(öğretmen × gün × **bölge**)` ikinci bir öğretmen bağlanıyor. Ama:
> - `DutyRosterPublishedEvent` alıcı listesi yalnız `a.TeacherId` taşıyor — **`RelieverId` listede yok** (`DutyRoster.cs:107`)
> - `AssignReliever()` / `ClearReliever()` **hiç domain event üretmiyor** (`DutyRoster.cs:73-93`)
>
> Yani yancı olan öğretmen, **hangi bölgede** yancı olduğunu uygulamada hiç öğrenemiyor. Bu olay matrise eklendi.

**İlgili:** `E-05` Nöbetlerim mobil ekranı bu bildirimlerin giriş noktası olacak.

--- column-break ---

### ✍️ Karar Alanı

**Durum:** ✅ Karara bağlandı
**Tarih:** 2026-08-08
**Karar veren:** Faruk Kaya

> [!success] 📄 Tam karar belgesi: [[K-01 - Bildirim Matrisi]]
> Ortak omurga (alıcı/kanal/zamanlama kuralları), gerekçeler, kod boşlukları ve doğan işler orada.

| Olay | Kime | Kanal | Zamanlama |
|:--|:--|:--|:--|
| Çizelge yayınlandı | Çizelgedeki **tüm** öğretmenler — nöbetçiler **ve yancılar** | In-app + Push | Anlık |
| Nöbet ataması değişti | Yalnız etkilenen öğretmen: atamadan **çıkan** + atamaya **giren** | In-app + Push | Anlık |
| **Yancı ataması yapıldı / değişti / kaldırıldı** *(koşullu)* | Yancı atanan öğretmen — **gün + bölge** ile. Değişiklikte **eski yancı** da. Nöbetçiye bilgi amaçlı. | In-app + Push | Anlık |
| Vekalet atandı | Vekalet eden öğretmen (gün + bölge) + yerine geçilen nöbetçi | In-app + Push | Anlık · **sessiz saati deler** |
| Vekalet iptal edildi | Vekalet eden öğretmen + asıl nöbetçi | In-app | Anlık |
| Muafiyet onaylandı | Talep eden öğretmen | In-app | Anlık |
| Muafiyet reddedildi | Talep eden öğretmen — **red gerekçesiyle** | In-app | Anlık |
| Nöbet günü hatırlatması | Ertesi günün nöbetçisi + *(ayar açıksa)* yancısı | In-app + Push | **Bir gün önce 17:00** |

**Notlar**
> - **Veli ve öğrenci bu tablonun hiçbir satırını almaz** — nöbet iç işleyiş.
> - Yancı satırı `DutiesRelieverEnabled` kapalıyken **hiç üretilmez**.
> - Yancı ve vekalet bildirimlerinin gövdesi **bölge adını** taşır ("Pazartesi · A Blok 2. Kat").
> - Hatırlatma bir gün önce akşam: öğretmene planlama şansı bırakır, sabah telaşı üretmez.
> - Sessiz saati delen tek satır **vekalet atandı** — 22:30'da verilen sabah vekaletini 07:00'de öğrenmek geç.
> - ⚠️ `B-13` kapanmadan hiçbir satır canlıya alınamaz.

--- end-multi-column

### K-01b · Ders Programı bildirimleri

--- start-multi-column: K-01b
```column-settings
number of columns: 2
largest column: standard
border: off
```

### 📄 Bağlam

**Kaynak:** Orijinal madde 5

**Kapsanacak olaylar**
- Program yayınlandı
- Program revize edildi
- Tek ders değişti (saat/derslik)
- Ders iptal edildi

**Dikkat**
Veli ve öğrenciye giden program bildirimi **sık revizyonda gürültü** yaratır. "Her değişiklikte anlık" yerine "gün sonu özet" tercih edilebilir — bunu bilinçli seç.

**İlgili:** `B-14` program üretimi düzelmeden yayın bildirimi anlamsız.

--- column-break ---

### ✍️ Karar Alanı

**Durum:** ✅ Karara bağlandı
**Tarih:** 2026-08-08
**Karar veren:** Faruk Kaya

> [!success] 📄 Tam karar belgesi: [[K-01 - Bildirim Matrisi]]

| Olay | Kime | Kanal | Zamanlama |
|:--|:--|:--|:--|
| Program yayınlandı | Etkilenen öğretmenler + o sınıfların veli ve öğrencileri | In-app + Push | Anlık |
| Program revize edildi | Yalnız etkilenen öğretmen + etkilenen sınıfın veli/öğrencisi | In-app | **Gün sonu özet** |
| Tek ders değişti | Dersin öğretmeni + o sınıfın veli/öğrencisi | In-app | **Gün sonu özet** |
| Ders iptal edildi | Dersin öğretmeni + o sınıfın veli/öğrencisi | In-app + Push | Anlık · **sessiz saati deler** |

**Notlar**
> - **"Gün sonu özet"** = o gün biriken değişiklikler tek bildirimde toplanır ("Programında 3 değişiklik var"), tek tek gönderilmez. Bağlamdaki gürültü uyarısının cevabı bu.
> - **İstisna:** özet penceresi kapandıktan sonra **ertesi güne ait** bir değişiklik olursa anlık gider.
> - İptal anlık ve sessiz saat delici: aksiyon gerektiriyor (veli çocuğunu erken alacak).
> - ⚠️ `B-14` kapanmadan yayın bildirimi hatalı programı otoriteyle duyurur.
> - ⚠️ **Bildirim yağmuru:** "program yayınlandı" tek işlemde ~1.560 alıcıya push atıyor. [[K-02 - OS Push Altyapısı]] bu throttle işini erteledi — bu karar onu **pilot öncesi zorunlu** hale getirdi.

--- end-multi-column

### K-01c · Sezon Yönetimi bildirimleri

--- start-multi-column: K-01c
```column-settings
number of columns: 2
largest column: standard
border: off
```

### 📄 Bağlam

**Kaynak:** Orijinal madde 7

**Kapsanacak olaylar**
- Sezon açıldı
- Sezon kapandı
- Devir tamamlandı
- Devirde aktarılamayan kayıt oldu

**Dikkat**
Sezon olayları çoğunlukla **yönetici işi**. Öğretmen/veliye gidecek tek şey muhtemelen "yeni sezon başladı" — gerisi iç bildirim olarak kalabilir.

**İlgili:** `B-07` devir hatası düzelmeden "devir tamamlandı" bildirimi yanıltıcı olur.

--- column-break ---

### ✍️ Karar Alanı

**Durum:** ✅ Karara bağlandı
**Tarih:** 2026-08-08
**Karar veren:** Faruk Kaya

> [!success] 📄 Tam karar belgesi: [[K-01 - Bildirim Matrisi]]

| Olay | Kime | Kanal | Zamanlama |
|:--|:--|:--|:--|
| Sezon açıldı | Yönetici | In-app | Anlık |
| Sezon kapandı | Yönetici | In-app | Anlık |
| Devir tamamlandı | Devri başlatan yönetici + okulun diğer yöneticileri | In-app | Anlık |
| Devirde hata / eksik kayıt | Devri başlatan yönetici | In-app + **E-posta** | Anlık |

**Notlar**
> - **Öğretmen/veli/öğrenci hiçbirini almaz.** Bağlam "yeni sezon başladı" bildirimini olası görüyordu — **göndermemeye** karar verildi: sezonun kullanıcıya yansıması zaten "çizelge yayınlandı" (K-01a) ve "program yayınlandı" (K-01b) ile geliyor. Üstüne bir de sezon bildirimi, aynı bilgiyi ikinci ve daha soyut kez duyurmak olur.
> - Devir hatası tek e-posta alan satır: devir mesai dışında çalışıyor, sonucu aksiyon gerektiriyor.
> - Push yok — dördü de masa başı işleri.
> - ⚠️ `B-07` kapanmadan "devir tamamlandı" kontrolsüz bir işi onaylanmış gösterir.
> - ℹ️ E-posta kanalı bugün gerçek değil ([[K-02 - OS Push Altyapısı]] §11); bağlanana dek bu satır in-app çalışır.

--- end-multi-column

---

## K-03 · Hata görünürlüğü / log stratejisi

--- start-multi-column: K-03
```column-settings
number of columns: 2
largest column: standard
border: off
```

### 📄 Bağlam

**Tespit**
Hatanın tam açıklaması **yalnızca Debug Console'da** görünüyor. Serilog sadece `.WriteTo.Console()` ile yapılandırılmış (`src/Oksis.Api/Program.cs:35`) — dosya sink'i yok, DB'ye de yazılmıyor. HTTP gövdesi tasarım gereği yalnızca `"An unexpected error occurred."` dönüyor.

**Neden önemli**
Şu an canlıda bir hata olsa **hiçbir iz kalmıyor**. Bulgu defterindeki `B-12` (401) gibi maddelerin kök nedenine ulaşmayı da bu zorlaştırıyor.

**Seçenekler**
- Rolling file sink
- DB sink
- Doğrudan ELK (CLAUDE.md'de hedeflenen)
- Response'a `traceId` + log korelasyonu

**Benim önerim**
MVP için minimum = **rolling file sink + response'ta `traceId`**. ELK entegrasyonu MVP sonrasına bırakılabilir.

**Uygulama tarafı:** `TB-01`

--- column-break ---

### ✍️ Karar Alanı

**Durum:** ⬜ Bekliyor
**Tarih:**
**Karar veren:**

**Karar**
>

**Gerekçe**
>

**Seçilen sink'ler**
- [ ] Console (mevcut)
- [ ] Rolling file
- [ ] DB
- [ ] ELK
- [ ] Response'ta `traceId`

**Ortam ayrımı** *(dev detaylı / prod maskeli?)*
>

**Doğan işler**
- [ ]

--- end-multi-column

---

## K-04 · Anaokulu kademesinin gizlenme sınırı

--- start-multi-column: K-04
```column-settings
number of columns: 2
largest column: standard
border: off
```

### 📄 Bağlam

**Verilmiş olan karar** *(`Y-02`)*
Anaokulu kademesi ekranlardan kaldırılacak; **altyapısal alanlar kalacak** (enum, tablo, seed), MVP sonrası değerlendirilip sisteme dahil edilecek.

**Netleşmesi gereken**
"Ekranda gösterilmesin" **nerede** uygulanacak?
- (a) Sadece FE filtrelesin
- (b) BE'nin kademe listesi endpoint'i de anaokulunu dışarıda bıraksın

**Benim önerim**
BE'de tek bir görünürlük bayrağı/filtresi. FE'de dağınık `if` bloklarıyla gizlemek, MVP sonrası geri açarken **her ekranı tek tek dolaşmayı** gerektirir.

**Etkilenen ekranlar**
Sınıflar & Şubeler · Ders Programı · Görevlendirmeler · Sezon kurulumu · Raporlar

--- column-break ---

### ✍️ Karar Alanı

**Durum:** ⬜ Bekliyor
**Tarih:**
**Karar veren:**

**Karar** *(a / b / diğer)*
>

**Gerekçe**
>

**Geri açma senaryosu** *(MVP sonrası nasıl açılacak?)*
>

**Doğan işler**
- [ ]

--- end-multi-column

---

## K-05 · Web'de öğretmen duyuru detay yüzeyi

> **Kaynak:** Duyurular C4 uygulaması (2026-08-09). Ölçüm dalın gözden geçirmesinde yapıldı.

--- start-multi-column: K-05
```column-settings
number of columns: 2
largest column: standard
border: off
```

### 📄 Bağlam

**Ölçülen durum**
Web'de öğretmenin duyuru **detay** yüzeyi **hiç yok**. `TeacherAnnouncementsPage` yalnız iki durum tanıyor: "yeni duyuru formu" ve "Duyurularım tablosu". Detay çizen bir kol, alabileceği bir parametre, hatta tıklanabilir bir tablo satırı bile yok. Duyuru detayı bileşenlerinin (gönderim raporu, denetim izi, geri çekme) hiçbiri bu sayfaya ithal edilmiyor.

**Neden şimdi gündemde**
C4 bildirim yönlendirmesini rol yerine **bildirim türüne** bağladı. Artık öğretmene giden bildirimler ikiye ayrılıyor:
- **okuyucu şapkası** (`Published`, `Amended`) → çözüldü; mobilde okuma ekranı açılıyor, web'de satır bilinçli olarak tıklanamaz
- **yayınlayan şapkası** (`Approved`, `Rejected`, `Withdrawn`, `ScheduledExecuted`, `ScheduleFailed`) → mobilde doğru çalışıyor, **web'de eksik**

**Etkinin büyüklüğü** *(ölçüldü)*
Yayınlayan-şapkalı beş türün **dördü** web'de ara listeye çıkıyor. En ağırı `ScheduledExecuted`: o bildirimin var oluş sebebi **gönderim raporu** ve rapora web'den ulaşılamıyor. (`Rejected` etkilenmiyor — adresi zaten liste.)

**Gerileme değil**
Önceden de aynıydı; C4 yalnızca okuyucu kolunu ondan ayırarak durumu iyileştirdi. Ama planın kendi kuralı **DYR-F-18** ("derin bağlantı doğrudan detayı açar, ara listeye düşmez") web'de karşılanmıyor.

**Neden karar gerektiriyor**
Kapatmak = yönetici detay ekranını öğretmen yetkisine göre budayıp **yeni bir ekran** açmak. Küçük bir bağlama işi değil.

**İlgili:** `E-07` (uygulama tarafı) · spec **K-7** ("web'de veli/öğrenci okuma yüzü kapsam dışı") — öğretmen için de aynı boşluk

--- column-break ---

### ✍️ Karar Alanı

**Durum:** ⬜ Bekliyor
**Tarih:**
**Karar veren:**

**Karar** *(a: web'e öğretmen detay yüzeyi açılsın / b: açılmasın, satır tıklanamaz olsun / c: bugünkü ara liste kabul edilsin ve spec'e istisna yazılsın)*
>

**Gerekçe**
>

**Eğer (a):** Öğretmen detayda neyi görsün?
> Gönderim raporu · denetim izi · geri çekme · düzenleme — hangileri, hangi yetkiyle?

**Eğer (b) veya (c):** DYR-F-18 istisnası
> Spec'e karşılık mı yazılacak, istisna mı? *(Gözden geçirme notu: karar ne olursa olsun bu ihlal spec'te sessiz kalmamalı.)*

**Doğan işler**
- [ ]

--- end-multi-column

---

---

## K-06 · Kadro davet/iletişim kanalı

--- start-multi-column: K-06
```column-settings
number of columns: 2
largest column: standard
border: off
```

### 📄 Bağlam

**Durum:** ⬜ Bekliyor · **Kaynak:** `E-11` (2026-08-16 uçtan uca test)

Ölçüm: sistemde **hiçbir e-posta gönderilmiyor**. `UserInvitedEvent`'in handler'ı yok,
`IEmailSender` hiçbir yerden çağrılmıyor, şifre sıfırlama işi token'ı `_ = rawToken;` ile atıyor.
Davet token'ı DB'de yalnız hash olarak durduğu için gönderilmemiş davet **geri getirilemez**.

Bu, yeni okulda kadro kurulmasını tümüyle engelliyor — turun tek bloklayıcı maddesi.

**Karar gereken:** MVP'de kadroya erişim nasıl verilecek?
- (a) SMTP'yi bağla — davet + şifre sıfırlama e-postası (altyapı hazır, yalnız handler yok)
- (b) E-postayı ertele; müdür ekranda **tek seferlik şifre** üretsin ve elden versin
      (öğrenci kaydında bu yol zaten var: kayıt sonu ekranı geçici şifre gösteriyor)
- (c) İkisi birden — e-posta varsayılan, şifre yedek

**Bağlı maddeler:** `B-24` (olmayan SMS "gönderildi" diyor) · `B-20` (içe aktarmada davet bayrağı ölü)
· `K-02` (push altyapısı — aynı teslim ölçülebilirliği sorunu)

--- column-break ---

### ✍️ Karar Alanı

**Durum:** ✅ Karara bağlandı
**Tarih:** 2026-08-16
**Karar veren:** Faruk Kaya

**Karar**
> **(a) SMTP bağlandı.** Davet ve şifre sıfırlama e-postaları gerçekten gönderiliyor; geçici şifre yolu da duruyor (kayıt sihirbazının başarı ekranı). SMS ve WhatsApp ekranda **seçilemez** durumda, "yakında" etiketiyle görünüyor.

**Gerekçe**
> Altyapı zaten hazırdı (`IEmailSender` + `SmtpEmailSender` + Mailpit); eksik olan yalnız bağlantıydı. Elden şifre yolu tek başına ölçeklenmiyor: geçici şifre ekranda BİR KEZ gösteriliyor ve kapatılınca kişi sisteme hiç giremiyordu. Gerçekten gönderim yapmayan kanalı seçtirmek `B-24`'ün ta kendisiydi; o yüzden gizlemek yerine **seçilemez** yapıldı — yol haritası görünür kalsın ama yanlış vaat üretmesin.

--- end-multi-column

---

## K-07 · Sezon kapanış yüzeyi: kayıt yenileme akışı

--- start-multi-column: K-07
```column-settings
number of columns: 2
largest column: standard
border: off
```

### 📄 Bağlam

**Durum:** ⬜ Bekliyor · **Kaynak:** `E-12` + `B-30` (2026-08-16)

Sunucuda tam bir kapanış yaşam döngüsü var; **yedi ucun hiçbirinin ekranı yok**:
`open-renewal-period`, `renewal-candidates`, `set-intent`, `renew`, `promote-students`,
`copy-assignments`, `terms/{id}/close`.

Bunun görünür sonucu ölçüldü: yenileme dönemi açılamadığı için devir "legacy" yolda çalışıyor,
`StudentEnrollment` yazılmıyor ve **devirden sonra öğrenciler `/students` ekranında kayboluyor**
(şube ekranı 46 öğrenci derken öğrenci listesi 0 diyor).

**Karar gereken:**
- (a) Kayıt yenileme akışının ekranları yazılsın (veli niyeti + müdür onayı + terfi)
- (b) Yenileme kapsam dışı kalsın; devir **her zaman** enrollment de yazsın
      (legacy yol tek yol hâline gelsin) — daha küçük iş, veli niyeti toplanmaz
- (c) Şimdilik yalnız `promote-students` + `copy-assignments` için buton eklensin

**Not:** (b) seçilirse `B-30` bir ekran işi değil, tek bir davranış değişikliğiyle kapanır.

--- column-break ---

### ✍️ Karar Alanı

**Durum:** ✅ Karara bağlandı
**Tarih:** 2026-08-16
**Karar veren:** Faruk Kaya

**Karar**
> **Tam akış yazılacak.** Kayıt yenileme dönemi açma, veli niyet toplama, yenileme, dönem kapatma ve görevlendirme kopyalama uçlarının hepsine ekran yazılır.

**Gerekçe**
> `B-30`'un kök nedeni bu boşluk: yenileme dönemi açacak ekran olmadığı için devir HER ZAMAN legacy yolda çalışıyor, `StudentEnrollment` aynası hiç yazılmıyor ve öğrenciler devir sonrası `/students` ekranından kayboluyor (ölçüm: `/sections` 46 öğrenci, `/students` 0). Yalnız aynayı yazmak belirtiyi kapatır, akışı değil — sezon kapanışı kullanıcının bu turda açıkça istediği kapsamdı.

--- end-multi-column

---

## K-08 · Dini bayramlar için tatil şeması

--- start-multi-column: K-08
```column-settings
number of columns: 2
largest column: standard
border: off
```

### 📄 Bağlam

**Durum:** ⬜ Bekliyor · **Kaynak:** `E-13` (2026-08-16)

`master.official_holidays` **7 satır** ve şeması sabit `month` + `day` + `is_annual`.
Ramazan ve Kurban Bayramı yok; hicri takvime bağlı oldukları için **mevcut şemaya sığmıyorlar**
(her yıl kayıyor, 3,5–4,5 gün sürüyor, arife yarım günü var).

2026'da ikisi de sezon içine düşüyor. Devamsızlık hesabı, ders programı ve yoklama pencereleri
o günleri normal ders günü sayıyor.

**Karar gereken:**
- (a) Şemayı yıl bazlı tarih aralığına çevir (`year`, `start_date`, `end_date`, `is_half_day`)
      ve dini bayramları yıllık olarak seed'le
- (b) Diyanet/MEB takviminden yıllık içe aktarma (kaynak + güncelleme sorumluluğu kararı ister)
- (c) Okul kendi "Okul tatili" kaydı olarak elle girsin (bugünkü tek çıkış yolu)

--- column-break ---

### ✍️ Karar Alanı

**Durum:** ⏸️ Ertelendi
**Tarih:** 2026-08-16
**Karar veren:** Faruk Kaya

**Karar**
> **Bu turda ele alınmayacak.** `master.official_holidays` şeması değişmiyor.

**Gerekçe**
> Dini bayramlar hicri takvime bağlı olduğu için her yıl kayıyor ve 3,5–4,5 gün sürüyor; mevcut sabit ay/gün şeması bunu ifade edemiyor. Doğru çözüm yıl bazlı tarih aralığı + arife (yarım gün) desteği — ama devamsızlık/program/yoklama pencerelerine dokunduğu için ayrı bir iş olarak planlanacak. `E-13` açık kalıyor.

--- end-multi-column

---

## K-09 · Yer tutucu veri politikası

--- start-multi-column: K-09
```column-settings
number of columns: 2
largest column: standard
border: off
```

### 📄 Bağlam

**Durum:** ⬜ Bekliyor · **Kaynak:** `X-12` (2026-08-16)

Beş ayrı yüzey sabit tasarım verisini canlı veri gibi gösteriyor: web gösterge paneli,
**mobil anasayfa (dört rolde de)**, kenar çubuğu varsayılanları ("Atlas Koleji" · "Kadıköy"),
öğrenci kayıt sihirbazı başlığı, öğrenciler KPI'ı.

Mobil anasayfa bunu **kırmızı "Kritik" rozetiyle** yapıyor: Pazar günü "2 kritik, 7 uyarı,
%92 yoklama, 34 devamsız" diyor; aynı uygulamanın yoklama ekranı "bugün dersiniz yok" diyor.

İki karar bilinçliydi (panel 2026-08-02, mobil anasayfa 2026-08-01) — sorun kararın kendisi
değil, ekranda **hiçbir işaret olmaması**.

**Karar gereken:** Bağlanmamış widget ne yapsın?
- (a) Görünmesin (boş durum + "yakında")
- (b) Görünsün ama açıkça **"örnek veri"** etiketiyle
- (c) Ucu olanlar bugün bağlansın (öğrenci/öğretmen sayısı, sezon geri sayımı bugün bağlanabilir —
      `dashboard-static.ts` kendi silme rehberinde bunu yazıyor), kalanlar (a)/(b)

**Ürün içinde doğru desen zaten var:** duyuru ekranı "Push bildirim — yakında — bu sürümde
gönderilmiyor", SMS kotası kartı "Geçici veri" diyor.

--- column-break ---

### ✍️ Karar Alanı

**Durum:** ✅ Karara bağlandı
**Tarih:** 2026-08-16
**Karar veren:** Faruk Kaya

**Karar**
> **"Örnek veri" etiketi.** Gerçek veriye bağlanmamış widget'lar kaldırılmıyor; üzerlerinde açık bir "örnek veri" rozeti gösteriliyor.

**Gerekçe**
> Desen üründe zaten var ve doğru çalışıyor: SMS kotası kartı "Geçici veri", duyuru oluşturma ekranı "Push bildirim — yakında — bu sürümde gönderilmiyor" diyor. Kartları tümden gizlemek tasarım bütünlüğünü bozar ve ürünün ne yapacağını da gizler; sorun gösterilmeleri değil, **gerçek sanılmaları**. Rozet yanıltmayı bitirir, yol haritasını görünür bırakır.

--- end-multi-column

---

---

## K-10 · Ders programının görevlendirme kaynağı

--- start-multi-column: K-10
```column-settings
number of columns: 2
largest column: standard
border: off
```

### 📄 Bağlam

**Durum:** ✅ Karara bağlandı · **Kaynak:** `B-26` (2026-08-16 uçtan uca test) · **Aynı düğüm:** `X-03`, `TB-48`

Görevlendirme iki nesil hâlinde yaşıyor ve **ekranla üretim farklı nesli okuyor**:

| | v1 `teaching_assignments` | v2 `subject_teacher_assignments` |
|---|---|---|
| Taşıdığı | Öğretmen × **Şube** × Ders + **haftalık saat** | Öğretmen × Ders (yetkinlik) |
| Şube / saat | ✔ | **YOK** (entity dokümanı: *"Haftalık saat ve şube YOKTUR; downstream Şube Dağıtımı / Ders Programı katmanının işidir"*) |
| Yazan ekran | **hiçbiri** | Görevlendirmeler |
| Okuyan | Ders Programı üretimi (`TeachingAssignmentSource`, `GetAutoGenClassesQueryHandler`) | Görevlendirmeler ekranı |

**Ölçüm (2026-08-16):**
- Aktif satır sayısı — `s1`/`s2`/`s3`: v1 **140**, v2 15/3/0. **`s4` (arayüzden kurulan okul): v1 = 0.**
- `grep`: v1'e yazan tek yol seed ve devir kopyası; `AssignSubjectClassCommand` ucu var ama
  **hiçbir istemci çağırmıyor**.
- Görünür sonuç: bir **lise** 10. sınıfına Türkçe / Fen Bilimleri / Sosyal Bilgiler yerleşti —
  hiçbiri Görevlendirmeler ekranındaki kayıtlarda yok.

Yani ders programı üretimi, **hiçbir ekranın yazmadığı** bir tablodan besleniyor. Dev okullarında
çalışıyor görünmesinin tek sebebi seed verisi; arayüzden kurulan gerçek bir okulda üretim hiçbir
sınıf listeleyemez.

--- column-break ---

### ✍️ Karar Alanı

**Durum:** ✅ Karara bağlandı
**Tarih:** 2026-08-16
**Karar veren:** Faruk Kaya

**Karar**
> **v2 + müfredattan türet.** Üretici v2 yetkinliklerini okur; eksik iki bileşen türetilir:
> **şube** = üretimin yapıldığı sınıfın kendisi, **haftalık saat** = o kademenin müfredatı
> (`SubjectGradeLevel` / `SchoolWeeklyHourOverride`), **öğretmen** = o derse yetkin v2 kaydı.
> v1 `teaching_assignments` emekliye ayrılır (okuma yolları kesilir).

**Gerekçe**
> Eksik olan "Şube Dağıtımı" katmanı zaten türetilebilir: müfredat saatleri ve şubeler sistemde
> **var**. Ayrı bir ekran açmak, kullanıcıdan sistemin kendi bildiği bir şeyi ikinci kez istemek
> olurdu. v1'i yaşatmak ise iki doğruluk kaynağını kalıcılaştırırdı — `X-03`/`TB-48`'in göç
> kararı bu turda "temizlik" olmaktan çıkıp **yanlış program üretmeye** başladığı için
> ertelenemezdi.
>
> Yan kazanç: ders↔kademe uygunluğu artık yapısal olarak garanti — müfredatta olmayan ders
> o kademeye hiç aday olmuyor.

--- end-multi-column

# B. Verilmiş Kararlar ✅

---

## Y-01 · Görevlendirme bildirimi

--- start-multi-column: Y-01
```column-settings
number of columns: 2
largest column: standard
border: off
```

### 📄 Bağlam

**Kaynak:** Orijinal madde 6

Bu, `K-01` matrisinin **verilmiş tek satırı**. Matris tamamlanınca oraya taşınmalı; tek başına uygulanırsa diğer bildirimlerle tutarsız bir desen doğurur.

**Bağımlılık**
Kanal seçimi ~~`K-02`'ye bağlı~~ — ✅ `K-02` çözüldü. In-app ile başlanır, push Parti 1/2 ile eklenir.

--- column-break ---

### ✍️ Karar Alanı

**Durum:** ✅ Karara bağlandı
**Tarih:** 2026-08-08

**Karar**
> Görevlendirme işleminde, görevlendirilen öğretmene bildirim gönderilecek.

**Gerekçe**
>

**Açık kalan**
- [ ] Kanal: in-app mi, push da mı? *(altyapı hazır — [[K-02 - OS Push Altyapısı]])*
- [ ] Görevlendirme **iptal** edilince de bildirim gitsin mi?

--- end-multi-column

---

## Y-02 · Anaokulu kademesinin ekranlardan kaldırılması

--- start-multi-column: Y-02
```column-settings
number of columns: 2
largest column: standard
border: off
```

### 📄 Bağlam

**Kaynak:** Orijinal madde 1

Kademe kaldırılacak, altyapı korunacak. **Uygulama yeri** `K-04`'te netleşmeyi bekliyor — o karar verilmeden koda dokunulmamalı.

--- column-break ---

### ✍️ Karar Alanı

**Durum:** ✅ Karara bağlandı
**Tarih:** 2026-08-08

**Karar**
> Anaokulu kademesi ekranlarda gösterilmeyecek. Altyapısal alanlar (enum, tablo, seed) korunacak, MVP sonrası değerlendirilecek.

**Gerekçe**
> MVP kapsamı dışında.

**Açık kalan**
- [ ] Uygulama yeri → `K-04`

--- end-multi-column

---

# C. Eksik Özellik & Ekranlar ➕

> Bunlar karar değil, **yapılacak iş**. Kapsam soruları netleşince doğrudan iş kalemine dönüşürler.

### E-01 · Öğretmen branş atama yüzeyi
- **Durum:** Bulgu defterinde **B-05** olarak kayıtlı, 🔴 kritik.
- **Neden burada da anılıyor:** Aslında bir "bug" değil, hiç yapılmamış bir ekran/alan. Zincirin en üstünde — `E-02` ve otomatik program üretimi buna bağlı.
- **Aksiyon:** Öğretmen detay/düzenleme ekranına branş alanı.
- ❓ **Netleşmeli:** Birden fazla branş desteklenecek mi?

### E-02 · Görevlendirmeleri otomatik yapan buton
- **İstek:** Görevlendirmeleri otomatik oluşturacak bir aksiyon eklenecek. *(Orijinal madde 10)*
- **Ön koşul:** `E-01` — branşsız öğretmenle otomatik dağıtım anlamsız.
- ❓ **Netleşmeli:** Dağıtım kriteri nedir — branş eşleşmesi + ders yükü dengesi + kıdem?
- **Önerim:** Nöbet modülündeki "adil dağıtım" ile ortak bir çekirdek çıkarılsın; iki ayrı algoritma iki ayrı bakım yükü demek.

### E-03 · Öğretmen müsaitlik takvimi (müdür kontrollü)
- **İstek:** Öğretmenlere müsaitlik takvimi açılacak; **okul müdürü isterse açıp isterse kapatabilecek.** *(Orijinal madde 11)*
- **Yapısal etki:** Bu bir **okul düzeyinde ayar** demek. Ayar altyapısı bu ekrana özel değil, genel bir "modül aç/kapa" deseni olarak kurgulanmalı.
- ❓ **Netleşmeli:** Kapatıldığında girilmiş veri silinsin mi, saklanıp gizlensin mi? Müsaitlik ders programı/nöbet dağıtımını **bağlayıcı** mı etkileyecek, yoksa öneri mi?

### E-04 · Akademik Takvim ekranı
- **Durum:** Tasarlanacak. *(Orijinal madde 8)*
- ❓ **Netleşmeli:** Kapsam (resmi tatiller, sınav dönemleri, dönem başı/sonu, okul etkinlikleri)? Hangi roller görecek, kim düzenleyecek? Sezona bağlı mı, tenant geneli mi?
- **Bağlantı:** `V-01` (nöbet çizelgesinin sezon tarihlerine bağlanması) bu takvimden beslenebilir.

### E-05 · Mobil "Nöbetlerim" ekranı
- **İstek:** Nöbet Yönetimi'ndeki "Öğretmen Görünümü" önizlemesi mobilde uygulanacak; ayrı bir **Nöbetlerim** ekranı olacak. *(Orijinal madde 12)*
- **Bağımlılık:** `B-13` çözülmeden bu ekran öğretmene **yanlış veri** gösterir.
- **İlgili:** `K-01a` — nöbet bildirimleri bu ekranın giriş noktası.

### E-06 · Öğretmen ↔ Veli rol geçişi
- **İstek:** Hem öğretmen hem veli olan kullanıcı iki rol arasında geçiş yapabilecek. *(Orijinal madde 3)*
- **Yapısal etki:** Tek kullanıcı–çok profil modelini doğrudan ilgilendiriyor. Bulgu `B-03` ("Bağlı Profil"de GUID görünmesi) tam olarak bu modelin yüzeyi — ikisi birlikte ele alınmalı.
- ❓ **Netleşmeli:** Geçiş oturumu nasıl taşıyacak — token'da aktif profil claim'i mi, her istekte profil seçimi mi? Yetki matrisi aktif profile göre mi hesaplanacak? *(Tenant izolasyonu açısından kritik.)*

### E-07 · Web'de öğretmen duyuru detay ekranı
- **Durum:** `K-05` kararına bağlı. Karar (a) çıkarsa bu iş kalemi doğar.
- **Kapsam:** Öğretmenin kendi duyurusunun detayı — gönderim raporu, denetim izi, geri çekme, geri çekmeyi iptal etme. Yönetici detay ekranı var; ondan yetkiye göre budanmış bir varyant mı, ayrı bir ekran mı olacağı kararla birlikte netleşir.
- **Neden gerekli:** Yayınlayan-şapkalı dört bildirim türü bugün web'de ara listeye çıkıyor; `ScheduledExecuted` bildiriminin işaret ettiği gönderim raporuna web'den hiç ulaşılamıyor.
- ❓ **Netleşmeli:** Öğretmen başkasının duyurusunun raporunu görmemeli (uç zaten 403 veriyor) — ekran bu ayrımı nasıl çizecek?

### E-08 · Mobilde Türkçe "sayfa bulunamadı" ekranı
- **Tespit:** `apps/mobile`'da `+not-found.tsx` yok. Karşılığı olmayan bir adrese gidildiğinde expo-router'ın **İngilizce** yerleşik ekranı ("Unmatched Route / Page could not be found") çıkıyor.
- **Neden burada:** C4 karşılıksız bildirim adreslerini core'da eşleyerek bu yüzeye düşmeyi engelledi, ama ekranın kendisi hâlâ yok — başka bir yol hatası aynı İngilizce ekrana çıkar.
- **Aksiyon:** Marka diline uygun Türkçe bir "sayfa bulunamadı" ekranı + geri dönüş yolu.

### E-09 · Öğretmenin reddedilen duyuru bildirimi boş ekrana düşüyor
- **Tespit:** Duyurusu reddedilen öğretmene giden bildirim `/announcements` adresini taşıyor. Mobilde o sekme yönetici değilse **boş yer tutucu** dönüyor ("Bu ekran henüz boş"). Öğretmenin gerçek duyuru yüzeyi ayrı bir sekme (`Duyurularım`).
- **Etki:** Öğretmen "duyurun reddedildi" bildirimine dokunuyor ve bomboş bir ekran görüyor — reddedilme gerekçesine hiç ulaşamıyor.
- **Aksiyon:** Ya bildirim öğretmeni "Duyurularım"a götürsün, ya da o sekme öğretmen için gerçek içerik döndürsün.
- **Not:** C4'ün getirdiği bir kusur değil; C4 ölçerken buldu.

### E-10 · Yönetici devamsızlık bildirimi öğrenci ekranına düşüyor
- **Tespit:** Yönetici, devamsızlık eşiği aşıldığında bildirim **alıyor**, ama mobil devamsızlık sekmesinin yönetici dalı yok — ekranda öğrencinin *"Devamsızlığım · Kayıt bulunamadı"* görünümü çıkıyor.
- **Aksiyon:** Yöneticiyi canlı devamsızlık/rapor yüzeyine götürecek bir dal. Bu **yeni bir yönlendirme kararı** olduğu için C4'te yazılmadı.
- **İlgili:** `K-01` matrisinin devamsızlık satırları.

---

# D. Teknik Borç 🔧

### TB-01 · Gözlemlenebilirlik altyapısı yok
- **Tespit:** Serilog yalnızca Console sink. Dosya yok, DB yok, ELK yok. Canlıda hata izi kalmıyor.
- **Karar tarafı:** `K-03`
- **Uygulama tarafı (karar sonrası):** Sink yapılandırması, `traceId` korelasyonu, ortam bazlı ayrım, log seviyesi politikası.
- **Öncelik:** MVP öncesi kapatılmalı — aksi halde canlıdaki her sorun "yeniden üretebilirsen bakarım" durumuna düşer.

### TB-02 · Bildirim uçlarının mock'u yok 🔴 kritik yol
- **Tespit:** `packages/api-mocks`'ta bildirim uçları için handler yok; web tarafında oturum zinciri mock'u da eksik. Sonuç: **mock modunda hiçbir bildirim satırı tıklanabilir değil.**
- **Maliyeti ölçüldü:** C4 boyunca **dört kez** geçici scaffold kurulup geri alındı. Rol duyarlı bildirim yönlendirmesi — fazın ana işi — **uçtan uca hiçbir zaman ekranda ölçülemedi**; iki doğrulama maddesi "görüntüyle kanıtlayamadım" diye kapandı.
- **Neden kritik yol:** `K-02` push zinciri de aynı boşluğa çarpacak. Teslim ölçülemezse push'un çalıştığı da ölçülemez.
- **Aksiyon:** Kalıcı `notificationHandlers` + GUID kimlikli fixture + web oturum zinciri.
- **Öncelik:** Push uygulamasından **önce**.

### TB-03 · Backend deepLink desenleri istemci rotalarıyla uyuşmuyor
- **Tespit:** Sunucu bildirimlere 7 farklı adres yazıyor; ikisinin istemcide karşılığı yoktu — `/duties` (web rotası **tekil** `duty`) ve `/announcements/{id}/delivery-report` (hiç yok). Ayrıca `/announcements/approvals` gerçek bir rota değil, sekme.
- **Şimdiki durum:** C4 bunu istemci tarafında bir eşleme tablosuyla kapattı (karar core'da, testli). Yani **kullanıcı etkisi yok** — ama sunucu hâlâ istemcide karşılığı olmayan dizeler yazıyor ve her yeni adres aynı eşlemeye bakım borcu ekliyor.
- **Aksiyon:** `oksis-api` tarafında deepLink desenleri gözden geçirilsin. **Uyarı:** `DeepLink` bildirim satırında kalıcı bir sütun — sunucu bugün düzeltilse bile kutulardaki mevcut bildirimler eski adresi taşımaya devam eder, yani istemci eşlemesi yine de kalmalı.

### TB-04 · Backend docblock'ları "yedi rol" diyor, seed'de beş rol var
- **Tespit:** `announcements.view` izni için iki sorgu docblock'u "yedi rolün tamamında" diyor; seed'de bugün **beş** rol var (Yardımcı Müdür, Rehber ertelenmiş).
- **Neden önemli:** Bu ifade C4'te planın bir **güvenlik gerekçesine** dayanak yapıldı ve gerekçe ölçümde çürüdü. İstemci belgeleri düzeltildi, kaynak hâlâ eski.
- **Aksiyon:** `oksis-api` docblock'ları güncellensin. `permission-matrix.md` / `notification-matrix.md` de taranmalı — aynı ifade oralara yayılmış olabilir.

### TB-05 · Docblock'lardaki satır numaralı atıflar sistematik bayatlıyor
- **Tespit:** Tek bir fazda **yedi** atıf bayatladı; **dördü** düzeltme turlarının kendi ürünüydü — yani satır numarasını düzelten commit, komşu bir atfı kaydırıp yenisini bozdu.
- **Neden burada:** Bu, tek tek düzeltilecek bir hata değil, **kalıptan doğan** bir borç.
- **Alınan önlem:** C4 kapanışında politika değişti — docblock'larda satır numarası yerine **sembol/fonksiyon adı**, ölçüm günlüğü ayrı ve tarihli blokta. Son turda yeni satır-numaralı atıf **sıfır**.
- **Aksiyon:** Politika `code-review-checklist.md` §16'ya kalıcı kural olarak yazılsın ve eski docblock'lar tarandıkça çevrilsin.

### TB-06 · Web mock'u sunucunun üretmediği bildirim adresleri taşıyor
- **Tespit:** Web bildirim fixture'ında `/roll-call`, `/reports`, `/students`, `/duty` gibi backend'in **hiç üretmediği** adresler var.
- **Etki:** Artık doğru şekilde tıklanamazlar (C4 eşlemesi sayesinde), ama mock gerçeğe sadık değil — demo ve geliştirme yanlış bir dünya gösteriyor.
- **Aksiyon:** `TB-02` ile birlikte ele alınsın; fixture'lar sunucunun gerçek 7 deseninden üretilsin.

---

## Bağımlılık Haritası

```
K-02 (push altyapısı) ✅ ÇÖZÜLDÜ 2026-08-08
  └─> K-01a / K-01b / K-01c (bildirim matrisi)  ← artık serbest
        └─> Y-01 (görevlendirme bildirimi)
        └─> E-05 (Nöbetlerim bildirimleri)

E-01 (branş atama)  ← aynı zamanda bulgu B-05
  └─> E-02 (otomatik görevlendirme)
  └─> B-14 (otomatik ders programı)

K-04 (gizleme sınırı)
  └─> Y-02 (anaokulu kaldırma)

K-03 (log stratejisi)
  └─> TB-01 (gözlemlenebilirlik)

B-13 (nöbet dağıtım hatası)
  └─> E-05 (Nöbetlerim ekranı — yanlış veri riski)

TB-02 (bildirim mock'u yok)  🔴 kritik yol
  └─> K-02 uygulaması (push teslimi ölçülemez)
  └─> TB-06 (mock sadakati — aynı işte kapanır)

K-05 (web öğretmen detay yüzeyi)
  └─> E-07 (ekranın kendisi)

TB-03 (deepLink desenleri)
  └─> bakım borcu: her yeni bildirim adresi istemci eşlemesine dokunur
```

---

## Önerilen Sıra

Bunu bir plan olarak değil, **bloklama ilişkisinin doğal sonucu** olarak yazıyorum:

1. ~~**K-02** kararı ver~~ ✅ → **K-01a/b/c** matrisini doldur *(K-02 çözüldü, kanal ekseni serbest — sıradaki iş bu)*
2. **TB-02** bildirim mock'u *(push uygulamasından önce — yoksa teslim ölçülemez ve K-02'nin doğrulaması yapılamaz)*
3. **E-01 / B-05** branş atama *(dört ayrı iş kalemini kilitli tutuyor)*
4. **K-03 → TB-01** log altyapısı *(kalan hataları teşhis edebilmek için)*
5. **K-04 → Y-02** anaokulu gizleme *(kapsamı net, hızlı kapanır)*
6. **K-05 → E-07** web öğretmen detay yüzeyi *(kararı ucuz, uygulaması yeni ekran)*
7. **E-03** müsaitlik takvimi + okul ayarı deseni
8. **E-04** Akademik Takvim tasarımı
9. **E-02** otomatik görevlendirme *(E-01 sonrası)*
10. **E-05** Nöbetlerim mobil ekranı *(B-13 sonrası)*

**Ucuz ve bağımsız** *(sıraya girmesi gerekmeyen, tek başına kapanabilenler)*: `E-08` Türkçe 404 ekranı · `E-09` reddedilen duyuru bildirimi · `E-10` yönetici devamsızlık bildirimi · `TB-04` docblock rol sayısı · `TB-05` atıf politikası.

---

## İzlenebilirlik

| Yeni ID | Kaynak (`Yapısal Kararlar-Eksikler.md`) |
|:--|:--|
| K-01a / K-01b / K-01c | 4 / 5 / 7 — üçü tek matris altında birleştirildi |
| K-02 | 2 |
| K-03 · TB-01 | 9 — karar ve uygulama olarak ikiye ayrıldı |
| K-04 · Y-02 | 1 — karar ve uygulama olarak ikiye ayrıldı |
| Y-01 | 6 |
| E-01 | *(yeni)* — `Bulgular.md` 5 (B-05) buraya da taşındı |
| E-02 | 10 |
| E-03 | 11 |
| E-04 | 8 |
| E-05 | 12 |
| E-06 | 3 — karar/eksik değil, tanımlı özellik isteği olduğu için buraya alındı |

### 2. parti — Duyurular C4 (2026-08-09)

| Yeni ID | Kaynak |
|:--|:--|
| K-05 · E-07 | C4 kapanış gözden geçirmesi — karar ve uygulama olarak ikiye ayrıldı |
| E-08 · E-09 · E-10 | C4 sırasında ölçülen, kapsam dışı bırakılan boşluklar |
| TB-02 · TB-06 | C4'te dört kez geçici scaffold kurulmasına yol açan mock boşluğu |
| TB-03 | C4 Task 6 — backend deepLink desenlerinin istemci rotalarıyla uyuşmaması |
| TB-04 | C4 Task 6/7 — planın çürüyen "yedi rol" gerekçesinin kaynağı |
| TB-05 | C4 boyunca yedi bayat atıf; kalıptan doğan borç olarak ayrıştırıldı |

> [!note] Bu partinin kod tarafı kapandı
> C4 sekiz görev + bir düzeltme dalgası + iki kapanış kararıyla tamamlandı ve `master`'a birleştirildi *(uzak depoya push edilmedi)*. Ayrıntılı backlog `oksis` deposunda **spec §17**'de `C4-1`…`C4-20` olarak duruyor; buraya yalnız **yapısal** olanlar taşındı.
>
> C4'ün öğrettiği şey ayrıca kayda değer: planın dört ayrı yerinde **ölçülmemiş gerekçe** vardı ve ikisi *koruma* vaat ediyordu — biri uygulansaydı veli yönetim konsolunu görecekti. Bunun panzehiri `TB-05`'teki atıf politikası ve kararların `packages/core`'a taşınıp testlenmesi oldu; merkezîleştirme üç ayrı gerçek hatayı kendiliğinden ortaya çıkardı.
