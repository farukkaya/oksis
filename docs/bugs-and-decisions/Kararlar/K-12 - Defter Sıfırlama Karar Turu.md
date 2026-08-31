# K-12 · Defter Sıfırlama Karar Turu

**Tarih:** 2026-08-31 · **Karar veren:** kullanıcı · **Kapsam:** [[OKSİS - Bulgu Kayıt Defteri]]'ndeki
38 açık maddenin yön kararları · **Plan:** [[defter-sifirlama-is-sirasi]]

> **Ne bu dosya:** defteri sıfırlamanın önündeki **21 yön kararı** tek oturumda sırayla
> soruldu ve bağlandı. Her satır: soru → seçilen → gerekçe → neyi açtığı.
> Bu dosya kararların **kanonik kaydıdır**; defterdeki "senin kararını bekleyenler"
> listesi bu turla **tamamen boşaldı**.

---

## Özet

| Küme | Karar | Sonuç |
|---|---|---|
| 0.A Yön | 6 | 6 ✔ |
| 0.B Merkezî kural | 5 | 5 ✔ |
| 0.C Kapsam | 8 | 8 ✔ |
| 0.D Metin/geri çekme | 3 | 3 ✔ |
| **Toplam** | **21** | **21 ✔** |

> ⚠️ **İlk turda 20 soruldu, biri atlandı.** `X-11` (CI sağlayıcısı) defterin "kararını
> bekleyenler" listesindeydi ama sorulmadı; liste yine de boşaltıldı. Hata 2026-08-31'de
> aynı gün fark edildi ve `X-11` §A6 olarak karara bağlandı. Doğru sayı **21**.

**Anında defterden düşenler:** `TB-29` (kapsam dışı → §C7), `X-11` (kapsam dışı → §A6),
`D-04` (geri çekildi → arşiv §31), `E-19` (bayat, zaten yapılmış → arşiv §32).
Defter **38 → 34**.

**Faz planındaki en büyük değişiklik:** `TB-43` "XL kanal altyapısı" sanılıyordu; kod
doğrulaması push'un **tamamlanmış** ve SMTP taşıyıcısının **hazır** olduğunu gösterdi.
Kalem 2–3 güne indi ve Faz 5'ten **Faz 3'e** taşındı.

---

## A. Yön kararları

### A1 · `TB-48` / `X-03` — Görevlendirme v1/v2 → **Yol 1 şimdi, Yol 2 hedef**

v1 yazma ekranı geri gelir, v2 yetkinlik katmanı olarak üstte kalır; v1→v2 göçü ayrı
proje olarak takvimlenir.

**Gerekçe:** bugünkü kod zaten v1'i kanonik varsayıyor (7 canlı tüketici: ders programı,
otomatik üretim, yayın önizlemesi, vekâlet aday havuzu, duyuru hedefleme, sezon geri alma
koruması + sezon aktivasyonunun kopyalayıcısı). Yol 2 doğru hedef ama `AssignmentLine`
sözleşmesi v2'den üretilemediği için yedi tüketiciyi birden taşımak demek; pilot o kadar
bekleyemez.

🔓 **Açtığı:** `X-03` aynı kararla kapanır. `B-07` (sezon devrinde görevlendirme
aktarılmıyor) açıklanır ve kapanır — aktarım kodu v1'i kopyalıyordu, v1'de veri yoktu.
📌 [[OKSİS - Yapısal Kararlar ve Eksikler]] · `K-10` bu kararla cevaplanmıştır.

### A2 · `TB-43` — Bildirim ayarları → **Kanal altyapısı yazılsın** (kapsam: e-posta)

**Karar sırasında yapılan kod doğrulaması defteri düzeltti.** `TB-43`'ün *"kayıtlı tek
kanal in-app, ayarlar teslimata hiç bakmıyor"* cümlesi 2026-08 başında yazılmıştı ve
**push işi ondan sonra geldi**. Bugünkü gerçek:

| Var olan | Durum |
|---|---|
| `PushNotificationChannel` | **Matrisi gerçekten okuyor** — beş kapı: `NotificationConfig.PushEnabled` → `NotificationRuleConfig.PushEnabled` (satır yoksa `NotificationEventType.DefaultPushEnabled`) → `NotificationPreference.PushEnabled` → sessiz saat (`DeferredPushJob`) → cihaz kaydı |
| `FcmSender` · `FcmErrorClassifier` · `PushDelivery` · `UserDevice` | Yazılmış, cihazda test edilmiş (iOS hariç — Apple hesabı yok) |
| `SmtpEmailSender` (MailKit) · `IEmailSender` · `EmailTemplates` · `SmtpOptions` | Var — ama tüketicisi **yalnız kimlik akışları** (`InvitationEmailJob`, `PasswordResetEmailSender`) |

**Eksik olanlar — altı madde, kalan işin tamamı budur:**

1. **`EmailNotificationChannel` yok.** `AddNotificationChannels` yalnız iki kanal kaydediyor
   (in-app, push). Taşıyıcı var, fan-out'a bağlı değil: kulüp duyurusu ya da not yayını
   asla e-posta olarak gitmiyor. Push'un beş kapısının e-posta karşılığı + şablon + kayıt
   sırası (in-app önce kuralı `NotificationChannelOrderTests` ile korunuyor).
2. **In-app kanalının hiç kapısı yok** — kendi dokümanı söylüyor. Matristeki **Portal**
   sütunu bu yüzden yalancı.
3. **Matrisin üç sütununun tüketicisi sıfır:** `PortalEnabled`, `EmailEnabled`, `SmsEnabled`.
   Dağıtımda okunan yalnız `PushEnabled`.
4. **Ana kapama anahtarı ölü:** `NotificationConfig.IsEnabled` hiçbir yerde okunmuyor
   (`EmailEnabled`/`SmsEnabled` de öyle).
5. **SMS'te hiçbir şey yok** — ne gönderici, ne kanal, ne sağlayıcı; ama ekranda "Günlük
   SMS Limiti" ve "SMS Kotası" alanları duruyor.
6. **Ekrandaki sütunlar ile çalışan sütun ters** (`E-20`): web matrisi Portal / E-posta /
   SMS çiziyor — üçü de ölü. **Push sütunu ekranda yok**, oysa tek çalışan o; backend
   `SupportsPush` + `PushEnabled` zaten döndürüyor.

🔓 **Açtığı:** `E-20` bu kalemin içinde kapanır (FE'ye push sütunu).
📌 `K-02`'nin push ayağı fiilen tamamlanmış; kalan iOS ayağı Apple Developer hesabına bağlı.

### A3 · SMS → **Sütun kaldırılsın, sağlayıcı kararı sonraya**

SMS sütunu ve SMS kotası/limiti alanları ekrandan kalkar. `NotificationRuleConfig.SmsEnabled`
kolonu **kalır** — kalıcı şeklin alanını silmek eski satırları sessizce boşaltır
([[serilesmis-sekil-sozlesmedir]]). Sağlayıcı seçimi + İYS uyumu + maliyet ayrı karar.

### A4 · `X-06` geniş ayağı → **Ortak koşum**

Birim testlerini gerçek sağlayıcıya çeviren paylaşılan bir fixture yazılır; 92 handler tek
hamlede kapanır. Altyapı hazır (Testcontainers MSSQL, 1048 entegrasyon testi gerçek SQL'de).

**Gerekçe:** handler başına test haftalar sürer ve yeni handler'lar yine elle test bekler.
Ortak koşumda bundan sonra yazılan her handler doğrudan doğru koşuma girer — Faz 1–4'te
yeni borç birikmez.

### A5 · `E-13` — Dini bayram takvimi → **Yıl bazlı aralık + seed**

Şema `month`/`day`'den **yıl bazlı tarih aralığı + arife (yarım gün) bayrağına** geçer;
2026–2030 bayramları seed'de gelir, yönetici düzeltebilir.

**Gerekçe:** hicri hesap kütüphanesi Diyanet ilanıyla sapabiliyor ve ülke/mezhep farkları
var; yanlış hesap **sessizce** yanlış takvim üretir. Öngörülebilir + denetlenebilir + dış
bağımlılıksız yol seçildi.
📌 `K-08` bu kararla cevaplanmıştır.

**Veri kaynağı kararı (aynı gün):** taslak tarihleri ben yazarım, **her satır
"doğrulanmadı" işaretiyle** seed'e girer; kullanıcı Diyanet takvimiyle karşılaştırıp
onaylar. 🚫 **Onaylanmadan canlıya çıkmaz** — devamsızlık hesabı ve yoklama pencereleri
bu tarihlere bakacak, yaklaşık tarih yeterli değil.

### A6 · `X-11` — CI kapısı → **Kanca yeterli, kapsam dışı**

Sağlayıcı tabanlı CI (GitHub Actions vb.) kurulmayacak; bugünkü pre-push kancası kapı
olarak yeterli sayıldı ve **bugünkü kapsamında kalacak**: build + birim testleri +
lint/typecheck. **Entegrasyon testleri kancaya eklenmeyecek**, elle koşulacak.

Madde [[OKSİS - Yapısal Kararlar ve Eksikler]]'e taşındı ve defterden düştü.

⚠️ **Bilinen bedeli üç maddede yazılı:** kanca `--no-verify` ile atlanabilir ve kurmamış
geliştiriciyi etkilemez · 1048 entegrasyon testi hiçbir otomatik kapıda koşmuyor (`TB-57`
bu boşluktan geçti) · `X-06`'nın ortak koşumu yazıldığında onun ürettiği doğrulama da
yalnız elle koşulacak.

---

## B. Merkezî kural kararları

### B1 · `X-17` — Kapsam reddi → **403 + gerekçe / 404, merkezî türetme**

*Okuyabiliyor ama yazamıyor* → **403 + modül önekli Türkçe gerekçe**;
*okuyamıyor bile* → **404** (varlık sızdırmama korunur).

**Kritik ayrıntı:** `ResultExtensions.MapStatusCode` modül başına elle yazılan zincir
olmaktan çıkıp **hata kodu ailesinden türeyecek**. Yalnız `Grades.` dalı eklemek, maddenin
kendi uyardığı "yüzey başına elle ayırma"nın ta kendisi olurdu. `mutation-error.ts`
`DOMAIN_FORBIDDEN_CODE_PREFIXES` genişletilir (bugün yalnız `"Announcements."`).

🔓 **İlk müşteri:** not modülünün beş yazma handler'ı (`SetMark`, `AmendMark`,
`ClearAssessmentMarks`, `SetAssessmentExamDate`, `PublishAssessment`).

### B2 · `TB-78` — `CanViewInfo` → **Merkezî süzgeç + bilinçli istisna**

`NotificationRecipientResolver` varsayılan olarak `CanViewInfo` süzer; çağıran
`includeInfoRestricted: true` ile bilinçli istisna yapabilir.

**Gerekçe:** yoklamanın bugünkü davranışı bayrakla **birebir korunur** (canlı davranış
değişmez, gerekçesi yazılı hâle gelir); yeni modüller güvenli varsayılanı miras alır. Aksi
hâlde `GRADE_PUBLISHED` handler'ı `IGradeScopeGuard`'ın etrafından dolaşırdı.

### B3 · `X-10` — Rota kapısı → **Yükleme penceresinde iskeletle bekletsin**

`RouteGuard`, `activeRole` çözülene kadar iskelet gösterip bekler. Yazılı bir tercih
değiştiği için onay alındı. Bugünkü bedel (yanlış ekranın çizilmesi + beş 403 isteği)
biter; kaçınılan "boş ekran flaşı" iskeletle karşılanır — sinyal zaten var
(`useActiveRole.isLoading`).

### B4 · `X-18` — **Ortak `ChipRow` çıkarılsın**

Mobilde tek bir `ChipRow`/`FilterStrip` bileşeni yazılır; üç çağrı yeri (`grade-parts`,
`self-parts`, kulüp keşfi) oraya taşınır. Üçüncü tekrar yaşandı, dördüncüyü beklemeye
gerek yok.

### B5 · `TB-31` — Eşik bildirimi → **Fail-closed**

Önbellek erişilemezse bildirim gönderilmez, kalıcı damgaya düşülür, bir sonraki koşuda
gönderilir. **Gerekçe:** mükerrer bildirim veliye doğrudan gürültü; gecikmiş eşik uyarısı
yalnız gecikmedir.

---

## C. Kapsam kararları

### C1 · `E-01` — Rıza yenileme ekranı → **MVP'de, küçük tut**

Tek ekran: rıza metni + kabul → mevcut `POST /api/v1/users/consents`. İlk sürüm
yükseltmesinde **381 rıza kaydının aynı anda kilitlenmesi** riskini ortadan kaldırır.

### C2 · `TB-19` — Geçici muafiyet → **Çizelgede kalsın, o tarihlerde vekil geçsin**

Öğretmen dönem çizelgesinde kalır; muafiyet penceresine düşen günlerde yerine vekil
atanır. Bugün karşılığı olan bir tüketim noktası yok — **yeni iş**.

⚠️ Naif düzeltme ölçülerek elendi: `CoversDay(today)` yerine dönem örtüşmesi koymak, 5
aylık dönemde 2 gün muaf olanı dönemin tamamından çıkarır (`duty_assignments` tarih değil
`day_of_week` taşıyor).

### C3 · `TB-46` — Sınav ağırlığı → **Okul akademik politikasında**

`WrittenWeight` + `PerformanceWeight` (toplam 100 doğrulayıcısı zaten var) yetkili kaynak;
`ExamType.WeightPercent` emekli edilir. **Gerekçe:** master veri okul kararını taşımamalı —
aynı sınav türü iki okulda farklı ağırlıkta olabilir. Not modülünden **önce** yapılır.

### C4 · `TB-55` — İçe aktarma → **Users yolu kalsın, daveti devralsın**

Profil tipine göre şablon + önizleme + Hangfire olan yol kalır ve davet üretimini üstlenir;
Identity yolu (`POST /users/import`) emekli edilir.
🔓 **Açtığı:** `B-20` (ölü davet bayrağı) ve `TB-20`'nin branş ayağı birlikte kapanır.

### C5 · `TB-38` — Öğrenci belgesi → **Saklı dosyaya taşınsın, saklama süresi taslak**

Öğrenci belgesi saklı dosya referansına geçer; yeni kategori açılır ve saklama süresi —
mazeret belgesinde olduğu gibi — **"teyit bekleyen taslak"** işaretlenir. Virüs taraması,
kota, yetim dosya temizliği ve erişim denetimi hemen kazanılır; KVKK teyidi ayrı satır.

### C6 · `TB-42` — Yetim dosya kategorileri → **Erişim çözümleyicileri yazılsın**

Karar sırasında ölçüldü: kategori defteri **9** kategori taşıyor, erişim çözümleyicisi **3**
(okul, mazeret, duyuru). Yetimler ve bugünkü durumları:

| Kategori | Bağlanacağı kayıt | Bugün yazılabilir mi |
|---|---|---|
| `ClubDocument` | `Club` / `ClubAnnouncement` | ✔ |
| `ExamDocument` | `Grades.Assessment` | ✔ |
| `AssignmentSubmission` | `HomeworkSubmission` | ✔ |
| `HomeworkAttachment` | `HomeworkAttachment` | ✔ |
| `VirtualBook` | **yok** — böyle bir varlık/modül hiç yok | ✘ |

**Dördü yazılır; `VirtualBook` kategori defterinden çıkarılır** (bağlanacak kayıt tipi yok,
planlanmış modülü de yok). Tüketicisi doğduğu gün geri eklenir.

> 🔎 **Bu ölçüm defterde iki bayat atıf ortaya çıkardı:** `TB-46` ve `TB-63`, `TB-13`'e
> ("ödev modülü boş klasör, 0 entity") dayanıyor. **Ödev domain'i yazılmış** — `Homework`,
> `HomeworkSubmission`, `HomeworkAttachment`, `HomeworkTracking`, `HomeworkAuditEntry`
> duruyor ve beş migration geçmiş. Atıflar düzeltildi.

### C7 · `TB-29` — Öğretmen müsaitliği → **Ertelendi, kapsam dışı**

Madde bütün olarak [[OKSİS - Yapısal Kararlar ve Eksikler]]'e taşındı ve **defterden
düştü**. İki ayağı da erteleniyor:
- **(a)** Öğretmenin kendi müsaitliğini girdiği ekran yazılmayacak; yönetici elle
  işaretlemeye devam edecek.
- **(b)** Nöbetin müsaitliği **gün seviyesine** indirgemesi (bir günde tek engelli saat
  varsa günün tamamı kapalı) ile ders programının **saat bazında** okuması arasındaki
  ayrışma da bugün düzeltilmeyecek.

⚠️ **Bekletmenin bilinen bedeli:** nöbet dağıtımı, bir günde tek engelli saati olan
öğretmeni o günün tamamından çıkarmaya devam eder.

### C8 · `X-16`(2) — Not yazma kapsamı → **"Program yayınlanmadan not girilmez" KURAL**

Bağımlılık bilinçli kural hâline gelir ve yazılır: `IGradeScopeGuard` kapsamı yalnız canlı
ders programının yerleşimlerinden (`TeacherCourseLoadProjection`, `IsActive && IsReserving`)
türer. Tek kaynak, tutarlı kapsam.

⚠️ **Sonucu yazılı olmalı ve EKRANDA görünmeli:** programını yayınlamamış bir okulda
hiçbir öğretmen not giremez. Öğretmen "not giremiyorum" dediğinde sebebi ekranda okumalı —
aksi hâlde `X-17`'nin şikâyet ettiği "yanlış teşhis" kalıbı not modülünde yeniden doğar.
📌 Not modülü teknik analizi §7.3 ve §2 bu kuralla birlikte güncellenir.

---

## D. Metin ve geri çekme kararları

| Madde | Karar | Not |
|---|---|---|
| `B-19` ⚪ | **Metne indirgensin** | Ölü "Okul yönetimine yaz" düğmesi kaldırılır, açıklama metni kalır; mobil ile eşitlenir. Okulun iletişim adresi giriş yapılmamış oturumda mevcut olmadığı için çalışan bir düğme bugün yazılamıyor. |
| `B-24` artığı ⚪ | Etiket **"Kaydı Kapat"** | Eylemin sonucunu doğru anlatır, domain terimini ("Ayrılmış") ekrana taşımaz. |
| `D-04` ❓ | **Geri çekildi** | "Ölçüldü, bugünkü kodda karşılığı yok" notuyla arşive; defterden düştü. Tekrar görülürse yeni ID ile açılır. |

---

## E. Defterden düşenler ve devredilenler

| Madde | Nereye | Sebep |
|---|---|---|
| `TB-29` 🟡 | [[OKSİS - Yapısal Kararlar ve Eksikler]] | Kapsam dışı (§C7) |
| `X-11` 🟠 | [[OKSİS - Yapısal Kararlar ve Eksikler]] | Kapsam dışı (§A6) |
| `D-04` ❓ | [[OKSİS - Bulgu Arşivi]] §31 | Geri çekildi (§D) |
| `E-19` 🟡 | [[OKSİS - Bulgu Arşivi]] §32 | Bayat — istek zaten karşılanmıştı (§G) |

**Defter: 38 → 34.**

---

## G. Turun bulduğu bayat maddeler

Karar hazırlığında **beş madde koda karşı doğrulandı, dördü bayat çıktı.**

| Madde | Defter ne diyordu | Gerçek | Sonuç |
|---|---|---|---|
| `TB-43` | "kayıtlı tek kanal in-app, ayarlar teslimata bakmıyor" | Push kanalı matrisi **beş kapıyla** okuyor | Kalem XL → M, Faz 5 → Faz 3 |
| `TB-46` | "not modülü boş klasör (`TB-13`)" | `Grades` domain'i var | Atıf düzeltildi |
| `TB-63` | "ödev modülü hiç yazılmamış, 0 entity" | Domain + Application + `HomeworkController` **tam** | Kilit kalktı, Faz 6 boşaldı |
| `E-19` | "`homework.write` izni seed'de yok" | Var (`PermissionSeedData.cs:88`) + `manage` katalog dışı | **Kapandı**, arşiv §32 |
| `TB-82` | "iki ucun mock handler'ı yok" | Doğru — `homework-handlers.ts`'te hâlâ yok | Geçerli |

**Sonuç ve yeni kural.** Bayat bulgu yalnız yanlış bilgi değil, **yanlış boyutlandırma**
üretiyor: `TB-43` bu yüzden ayrı projeye konmuştu, `E-19` bir fazın ilk adımı sayılmıştı,
`TB-63` başka bir modüle kilitli görünüyordu. Defterin kendi kuralı — *her blok koddan
doğrulamayla başlar* — bundan sonra **karar ve planlama turlarına da** uygulanır.

🚧 **Bu yüzden Faz 1'den önce bir doğrulama süpürmesi gerekiyor** (bkz.
[[defter-sifirlama-is-sirasi]] §2.5): 34 maddenin her biri koda karşı *geçerli / bayat /
zaten kapanmış* diye işaretlenir. Bugünkü örnekleme oranı (4/5) bu adımın defteri
kendiliğinden birkaç madde daha düşüreceğini gösteriyor.

---

## F. Faz planına etkisi

| Değişiklik | Sebep |
|---|---|
| `TB-43` + `E-20` **Faz 5 → Faz 3** | Push tamam, SMTP taşıyıcısı hazır; kalan iş ~2–3 gün (A2) |
| `TB-42` büyüdü | Bir kategori çıkarma değil, **dört erişim çözümleyicisi** yazma işi (C6) |
| `X-11` (CI) Faz 1'e paralel | Faz 1–4'te yazılacak ~35 maddelik kodun kapısı yok |
| `TB-19` L olarak kaldı | Vekil ikamesi yeni tüketim noktası demek (C2) |
| `X-16` iki ayağa ayrıldı | (1) analiz düzeltmesi — S · (2) kuralın yazılması + ekranda görünmesi — M |

Güncel sıra: [[defter-sifirlama-is-sirasi]] §10.
