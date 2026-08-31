# Defteri Sıfırlama — İş Sırası

> **Girdi:** [[OKSİS - Bulgu Kayıt Defteri]] · 38 açık madde (2026-08-31, `B-44` kapanışından sonra).
> **Çıktı:** kapanış sırası, bağımlılıklar, her fazın neyi açtığı.
> **Kardeş belge:** [[bulgu-kapanis-turu-teknik-analiz]] (bir önceki tur, 12 madde).

---

## 0. Baş bulgu — darboğaz kod değil, karar

38 maddenin **17'si** kod yazılmadan önce senin bir cümlelik yön kararını bekliyor.
Bunların bir kısmı bir dakikalık ("etiket ne olsun"), bir kısmı ise **altındaki tüm
işin boyutunu belirliyor**: `X-06`'nın cevabı 92 handler'ı 3 güne mi haftalara mı
çevireceğini, `TB-48`'inki ise pilotun ders programı hattının çalışıp çalışmayacağını
belirliyor.

| | Adet | Kapanma yolu |
|---|---|---|
| Karar gerekmez, bugün başlanabilir | **14** | Kod + test |
| Karar sonrası kod | **17** | Önce yön kararı, sonra kod |
| Ayrı proje (defterin içine sığmaz) | **6** | Kendi planı olacak kalemler |
| Başka modüle kilitli | **1** | Ödev modülü gelince |

**Bu yüzden sıra şu:** önce karar turu (kod yok), sonra kararsız işleri modül modül
temizlemek, sonra merkezî kurallar, en sonda ayrı projeler. Karar turunu öne almanın
sebebi psikolojik değil yapısal — `X-17` ve `TB-78` gibi maddeler **her yeni modülün
miras aldığı** kurallar; geç verilen karar, o ana kadar yazılmış her modülde yeniden
elle düzeltme demek ([[yamalama-kabul-degil]]).

### "Sıfır" ne demek — üç kapanış türü meşrudur

1. **Düzeltildi** — kod değişti, test çivilendi.
2. **Karar verildi, kapsam dışı** — madde [[OKSİS - Yapısal Kararlar ve Eksikler]]'e
   taşınır ve defterden düşer. `E-01`, `TB-29`, `TB-63` gibi maddeler için tek dürüst
   kapanış budur.
3. **Geri çekildi** — ölçüldü, karşılığı bulunamadı (`D-04`).

Defteri "0" göstermek için bir maddeyi zorla düzeltmek, 38'de bırakmaktan kötüdür.
Sıfırın anlamı *"her açık maddenin bir sahibi ve bir kararı var"*dır.

### Değişmeyen disiplin

Her blok **koddan doğrulamayla** başlar. Önceki turda bu adım 12 maddenin 3'ünde
defteri yanlış çıkardı (ikisi zaten kapanmıştı, birinin kök nedeni yanlıştı). Deftere
inanıp kod yazmak, turun en pahalı hatası olur.

---

## 1. Faz tablosu

| Faz | Ne | Madde | Boyut | Ön koşul |
|---|---|---|---|---|
| **0** | Karar turu — kod yok | 17 kararlık pano | ½ gün (senin) | — |
| **1** | Kulüp modülünü sıfırla | 8 | ~2 gün | yok |
| **2** | Ödev ön koşulları | 6 | ~2 gün | yok |
| **3** | Merkezî kurallar | 6 | ~3 gün | Faz 0.B |
| **4** | Kapsam kararı sonrası | 11 | ~4 gün | Faz 0.C |
| **5** | Ayrı projeler | 6 | ayrı takvim | Faz 0.A |
| **6** | Başka modüle kilitli | 1 | — | ödev modülü |

**Faz 1–4 biterse defter 38 → 7'ye iner** (~11 iş günü). Kalan 7'nin 6'sı kendi
planını hak eden kalemler, 1'i başka modüle kilitli.

---

## 2. Faz 0 — Karar turu

Kod yazılmıyor. Her karar için soru + seçenekler + tavsiyem. Dört kümeye ayrıldı
çünkü ağırlıkları çok farklı.

### 0.A — Yön kararları (altındaki işin boyutunu belirler)

**`TB-48` / `X-03` · Görevlendirme v1 mi v2 mi** 🔴
Bugün kanonik olan v1 ve **yazma ekranı kaldırılmış** — yani yeni bir okulda ders
programı, otomatik üretim, vekâlet aday havuzu ve duyuru hedeflemesi *sessizce* boş
dönüyor. Üç yol defterde yazılı.
→ **Tavsiyem: Yol 1'i şimdi, Yol 2'yi hedef olarak.** v1 ekranı geri gelsin (pilotu
bugün açan tek hamle, en az iş), v2 yetkinlik katmanı olarak üstte kalsın; v1→v2 göçü
ayrı bir proje olarak takvimlensin. Yol 2'yi şimdi seçmek doğru hedeftir ama
`AssignmentLine` sözleşmesi v2'den üretilemediği için 7 tüketiciyi birden taşımak
demek — pilot o kadar bekleyemez.
🔓 **Açtığı:** `B-07` (sezon devrinde görevlendirme aktarılmıyor) ve `X-03` birlikte kapanır.

**`TB-43` · Bildirim ayarları teslimata mı bağlansın** 🟠
Üç ayak da ölü: kural matrisi okunmuyor, kanal anahtarları okunmuyor, kayıtlı tek kanal
in-app.
→ **Tavsiyem: ekranı bugünkü gerçeğe indir.** Matris "yakında" diye durmasın, kaldırılsın;
kanal uygulaması (e-posta/SMS/push) `K-02` kapsamında ayrı proje olarak yaşasın. Yalan
söyleyen ayar ekranı, olmayan ayar ekranından kötüdür.
🔓 **Açtığı:** `E-20` (kulüp push sütunu) bu kararla ya kapanır ya `K-02`'ye devredilir.

**`X-06` geniş ayağı · 92 handler nasıl doğrulanacak** 🟠
→ **Tavsiyem: ortak koşum.** Birim testlerini gerçek sağlayıcıya çeviren paylaşılan bir
fixture, 92'yi tek hamlede kapatır; altyapı zaten var (Testcontainers MSSQL, 1048 test
gerçek SQL'de koşuyor). Handler başına test yazmak haftalar sürer ve yine kapsam boşluğu
bırakır.

**`E-13` · Dini bayram verisi nereden gelecek** 🟠
Şema `month/day` tutuyor, hicri takvim her yıl kayıyor.
→ **Tavsiyem:** şema yıl bazlı tarih aralığı + arife (yarım gün) bayrağına geçsin; veri
**seed'de 2026–2030 için önceden yüklensin**, yönetici düzeltebilsin. Hicri hesap
kütüphanesi getirmek bu iş için fazla.

### 0.B — Merkezî kural kararları (her yeni modül miras alır)

**`X-17` · Kapsam reddi 403 mü 404 mü** 🔴
→ **Tavsiyem:** *okuyabiliyor ama yazamıyor* → **403 + modül önekli Türkçe gerekçe**;
*okuyamıyor bile* → **404**. Ek olarak `ResultExtensions.MapStatusCode` modül başına elle
yazılan zincir olmaktan çıkıp hata kodunun ailesinden türesin — aksi hâlde kararın kendisi,
maddenin şikâyet ettiği "yüzey başına elle ayırma" olur.

**`TB-78` · `CanViewInfo` merkezî mi süzülsün** 🟠
→ **Tavsiyem:** resolver **merkezî süzsün**, çağıran `includeInfoRestricted: true` ile
bilinçli istisna yapabilsin. Yoklamanın bugünkü davranışı bu bayrakla birebir korunur
(davranış değişmez, gerekçe yazılı hâle gelir); yeni modüller güvenli varsayılanı miras alır.

**`X-10` · Rota kapısı yükleme penceresinde bekletilsin mi** 🟡
→ **Tavsiyem: bekletsin, iskelet göstersin.** `useActiveRole` zaten `isLoading` döndürüyor,
yani "rol yok" ile "rol henüz gelmedi" ayırt edilebilir. Yazılı tercihin gerekçesi ("boş
ekran flaşı") iskeletle karşılanıyor; bugünkü bedel ise yanlış ekranın çizilmesi + 5 reddedilen istek.

**`X-18` · Ortak `ChipRow` çıkarılsın mı** 🟠
→ **Tavsiyem: evet.** Üçüncü tekrar yaşandı; dördüncüyü beklemek için sebep yok. Üç çağrı
yeri (`grade-parts`, `self-parts`, kulüp keşfi) bileşene taşınır.

**`TB-31` · Kesintide bildirim gitsin mi** 🟡
→ **Tavsiyem: fail-closed.** Mükerrer eşik uyarısı veliye doğrudan gürültü; gecikmiş uyarı
yalnız gecikmedir. Önbellek erişilemezse kalıcı damgaya düşülür, gönderim bir sonraki koşuya kalır.

### 0.C — Kapsam kararları

| Madde | Soru | Tavsiyem |
|---|---|---|
| `E-01` 🟠 | Rıza yenileme ekranı MVP'de mi | **Evet, küçük tut.** Uç zaten var; FE 1 ekran, ~yarım gün. İlk sürüm yükseltmesinde 381 kayıt aynı anda kilitleniyor ve çıkış yolu yok. |
| `TB-19` 🟠 | Geçici muafiyet: çizelgeden çıkar mı, vekil mi geçer | **Vekil geçsin (b).** Doğru ürün davranışı; ama bugün karşılığı olan tüketim noktası yok → yeni iş. Naif düzeltme (dönem örtüşmesi) ölçülerek elendi. |
| `TB-46` 🟡 | Sınav ağırlığı nerede yaşayacak | **Okul akademik politikasında.** `ExamType.WeightPercent` emekli edilsin — master veri okul kararını taşımamalı. Not modülünden **önce**. |
| `TB-55` 🟡 | İki içe aktarma yolundan hangisi | **Users yolu kalsın** (şablon + önizleme + Hangfire), Identity yolu davet üretimini ona devredip emekli olsun. `B-20` ve `TB-20` artığı da bununla kapanır. |
| `TB-38` + `TB-42` 🟡 | Belge depolama ikiliği + tüketicisiz kategoriler | **Birlikte karara bağlansın.** Öğrenci belgesi saklı dosya referansına taşınsın; tüketicisi olmayan kategoriler defterden **çıkarılsın** ("hazırlanıyor" etiketi kullanıcıya çalışmayan seçenek gösterir). KVKK saklama süresi ayrı satır. |
| `TB-29` 🟡 | Öğretmen müsaitlik ekranı MVP'de mi | **Madde ikiye bölünsün.** Ekran MVP dışı (karar); ama nöbet ile ders programının aynı veriyi gün/saat çözünürlüğünde okuması **hata**, kapsam değil — o bugün düzeltilir. |
| `X-16`(2) 🔴 | "Program yayınlanmadan not girilmez" bilinçli mi | **Hayır — ikinci kaynak kabul edilsin** (`subject_teacher_assignments`). Aksi hâlde programını yayınlamamış okulda hiçbir öğretmen not giremez; pilotu bloklar. |

### 0.D — Bir dakikalık kararlar

| Madde | Tavsiyem |
|---|---|
| `B-19` ⚪ | Düğme **metne indirgensin** — okulun iletişim adresi giriş yapılmamış oturumda istemcinin elinde yok, `mailto:` bile veri gerektiriyor. |
| `B-24` artığı ⚪ | Etiket **"Kaydı Kapat"**. |
| `D-04` ❓ | Hangi ekranda görüldüğü söylensin; söylenemiyorsa **geri çekilip arşive** ("ölçüldü, karşılığı yok"). |

---

## 3. Faz 1 — Kulüp modülünü sıfırla (8 madde, karar gerekmez)

Tek modül, hepsi kararsız. Bittiğinde **1. bölüm defterden tamamen düşer.**
Modülün testleri ve mock'ları zaten bu turda ısıtıldı; bağlam maliyeti en düşük yer burası.

| # | Madde | İş | Depo | Boyut |
|---|---|---|---|---|
| 1 | `TB-103` 🟡 | `students/me` ve `parents/me` uçları çağıranın **profil tipini** doğrulasın. Bugün veli/öğretmen/yönetici 200 alıyor. Sözleşme kusuru — rota tabanı kapsam bildirimi sayılıyor ama sunucu doğrulamıyor. | api | S |
| 2 | `B-47` 🟡 | "Kayıtlı" sayısı üç yerde iki farklı değer. D15 kararı (üye kayıtlı görünür) korunur; **kontenjan çubuğu ve sayaç kartı** gerçek kayıt sayısından beslenir. İptal diyaloğunun sayısı fiilî fan-out ile eşitlenir — `TB-77`'nin dersi. | api + ui | M |
| 3 | `B-48` 🟡 | Aktivite geçmişi ölçütü "yoklama işaretli mi"den "etkinlik **geçmişte ve iptal değil** mi"ye çevrilir. İki ayak: gelecekteki etkinlik ve iptal edilen etkinlik ikisi de geçmişte sayılıyor. | api | M |
| 4 | `TB-98` 🟡 | Veli kulüp geçmişi toplamları **sunucuya** taşınır (`summary` bloğu), FE hesabı silinir. Öğrenci ucunda zaten öyle. | api + ui | M |
| 5 | `D-17` 🟢 | Sekme rozeti ile liste aynı kümeyi saysın (taslak dâhil/hariç tek karar). | ui | S |
| 6 | `D-18` 🟢 | Öğrenci etkinlik kartında bitiş saati — `durationMinutes` zaten geliyor. | ui | S |
| 7 | `TB-101` 🟢 | Mock'taki olmayan `TeacherAdvisories` varsayımı temizlenir; tek kaynak `Club.AdvisorTeacherPersonId`. | ui | S |
| 8 | `TB-100` 🟡 | Mobil roll-call rotası ölü — danışman kartı yalnız `applications`'a götürüyor. **Öğretmen etkinlik listesi ekranı yazılmalı**, yoksa rota erişilemez kalır. | ui | M |

⏸️ `E-20` bu bölümde yazılı ama gerçekte bildirim ayarları işi → **Faz 5**, `TB-43` kararına bağlı.

---

## 4. Faz 2 — Ödev ön koşulları (6 madde, karar gerekmez)

Bu blok yalnız defteri düşürmüyor: bittiğinde **ödev backend'i yazılabilir hâle geliyor.**
Bugün yazılamaz, çünkü mock birincil kaynak sayılıyor ama iki ucun mock'u hiç yok.

| # | Madde | İş | Boyut |
|---|---|---|---|
| 1 | `E-19` 🟡 | `homework.write` izni seed'e eklenir. **Modülün ilk adımı** — bütün kapsam kapıları bu kodun varlığını varsayıyor. `homework.manage` `grades.manage` emsaliyle `AllPermissionIds()`'e girmez, yalnız `SchoolAdmin` satırıyla verilir. | S |
| 2 | `TB-82` 🔴 | İki yazma ucunun (`:publish-for`, `:remove`) mock handler'ı + testleri yazılır. Bugün butona basılınca istek gerçek API'ye gidip 404 alıyor. **İkinci ayak:** `backend-needs-homework.md` §7 bu ikisini "mock'ta çalışan" diye listeliyor — belge düzeltilir, yoksa backend yalana güvenerek yazılır. | M |
| 3 | `E-18` 🟡 | Öğretmen ödev eki yazma dalı üç yerde birden yok (web, mobil, mock). Ek bugün yalnız seed'den doğabiliyor. Backend yazılırken mock **tarif değil**, sıfırdan tasarlanacak. | M |
| 4 | `TB-83` 🟡 | `HOMEWORK_CREATED` / `HOMEWORK_DUE` bildirim olay tipleri seed'e geri konur + `NotificationEventGroup`'a ödev grubu. `TB-44`/`TB-24` kalıbı (`delivered: false` yer tutucu) hazır. `missingNotificationMode` ile matris arasındaki öncelik ilişkisi de yazılır. | M |
| 5 | `TB-84` 🟢 | Uç numaralandırması iki belgede çelişiyor — tek numara defteri. | S |
| 6 | `TB-63`(2) 🟡 | "Takvime ekle" (ICS) ayağı — bağımsız, istendiği an yazılabilir. Rozet ayağı Faz 6'da kalır. | M |

---

## 5. Faz 3 — Merkezî kurallar (6 madde · Faz 0.B'den sonra)

Sıra önemli: `X-17` en başta, çünkü **her yeni modül onu miras alıyor**. Geç kalırsa
ödev ve not modülleri yanlış kalıbı kopyalayarak doğar.

| # | Madde | İş | Boyut |
|---|---|---|---|
| 1 | `X-17` 🔴 | 403/404 ayrımı + `MapStatusCode`'un hata kodu ailesinden türemesi + `DOMAIN_FORBIDDEN_CODE_PREFIXES` genişletmesi. Not modülünün beş yazma handler'ı ilk müşteri. | M |
| 2 | `TB-78` 🟠 | `NotificationRecipientResolver` merkezî `CanViewInfo` süzgeci + `includeInfoRestricted` bayrağı. Yoklamanın üç handler'ı bayrakla bugünkü davranışta kalır. | M |
| 3 | `TB-104` 🟡 | `MarkNotificationRead` / `MarkAllNotificationsRead` sezon kesmesini kullansın — okuma yüzeyi kullanıyor, yazma kullanmıyor. `X-19`'un kapanmadan kalan ayağı. | S |
| 4 | `X-18` 🟠 | Ortak `ChipRow` bileşeni + üç çağrı yerinin taşınması. | M |
| 5 | `X-10` 🟡 | `RouteGuard` yükleme penceresinde iskeletle bekletsin. | S |
| 6 | `TB-31` 🟡 | Eşik bildiriminde fail-closed. | S |

---

## 6. Faz 4 — Kapsam kararı sonrası (11 madde · Faz 0.C'den sonra)

| Madde | İş | Boyut |
|---|---|---|
| `X-16`(1) 🔴 | Not modülü teknik analizi §7.3 + §2 düzeltilir: kapsam kaynağı `TeachingAssignment` değil `TeacherCourseLoadProjection`. **Not modülü geliştirmeden önce** yapılmalı, yoksa modül emekli bir tabloya göre yazılır. | S |
| `X-16`(2) | Kapsamın ikinci kaynağı kararı uygulanır (`subject_teacher_assignments`). | M |
| `TB-46` 🟡 | Ağırlık tek yere indirilir, rakip tanım emekli edilir. | M |
| `E-01` 🟠 | Rıza yenileme ekranı (uç hazır). | M |
| `TB-19` 🟠 | Geçici muafiyet tüketim noktası + vekil ikamesi. | L |
| `TB-29`(2) 🟡 | Nöbet/ders programı müsaitlik çözünürlüğü eşitlenir (gün vs saat). | M |
| `TB-55` 🟡 | İçe aktarma yolları birleşir; `B-20` ve `TB-20` artığı birlikte kapanır. | L |
| `TB-38` 🟡 | Öğrenci belgesi saklı dosya referansına taşınır + kategori + saklama süresi. | M |
| `TB-42` 🟡 | Tüketicisiz kategoriler defterden çıkarılır. | S |
| `B-19` ⚪ | Ölü düğme metne iner. | S |
| `B-24` ⚪ | Etiket düzeltilir. | S |
| `D-04` ❓ | Netleşirse bir dakika, netleşmezse geri çekilir. | S |

---

## 7. Faz 5 — Ayrı projeler (6 madde)

Bunlar defterin içine sığmaz; her biri kendi teknik analizini hak ediyor. Defterden
düşmeleri **"proje açıldı ve planı yazıldı"** ile olur, tek bir commit'le değil.

| Madde | Neden ayrı proje | Kaba boyut |
|---|---|---|
| `TB-48` + `X-03` 🔴 | Veri modeli kararı; 7 canlı tüketici, sezon aktivasyonu ve duyuru hedeflemesi bağlı. Yol 1 ~3 gün, Yol 2 ~2 hafta. | L–XL |
| `X-06` geniş 🟠 | Ortak koşum seçilirse ~3 gün; handler başına test seçilirse haftalar. | L |
| `X-11` 🟠 | CI sağlayıcısı + adımlar + PR zorunluluğu. Kanca yerelde, `--no-verify` ile atlanıyor, kurmamış geliştiriciyi hiç etkilemiyor. Bu kapı kurulmadan diğer fazların yeşili tesadüfe bağlı. | M |
| `TB-43` 🟠 | Karara göre ya ekran indirgeme (S) ya kanal altyapısı (XL). | S veya XL |
| `E-20` 🟡 | `TB-43` + `K-02` push fazına bağlı. | M |
| `E-13` 🟠 | Şema değişikliği + migration + 5 yıllık veri + arife yarım gün semantiği. Devamsızlık, ders programı, akademik takvim ve yoklama pencerelerini birden etkiliyor. | L |

> **`X-11`'i erken almanın gerekçesi:** Faz 1–4 boyunca yazılacak ~40 maddelik kodun
> kapısı yok. Kanca kurmamış bir geliştirici (ya da `--no-verify`) kırmızıyı `master`'a
> itebiliyor. Sıralamada Faz 5'te duruyor ama **Faz 1'e paralel çekilmesi** en ucuz sigorta.

---

## 8. Faz 6 — Başka modüle kilitli (1 madde)

`TB-63`(1) 🟡 — "Bu derse ödev var" rozeti. 🔓 Kilidi ödev modülü açar. Defterde
kalmalı; kapanışı ödev modülünün kabul ölçütlerine yazılır.

---

## 9. Riskler

1. **Karar turu yapılmazsa fazlar birbirine girer.** 17 kararın 6'sı Faz 3–5'i doğrudan
   bloklar; kalan 11'i olmadan da Faz 4 başlayamaz. Kararsız başlanan iş, karar geldiğinde
   ikinci kez yazılır.
2. **Defter sıfırlanır, sıfırda kalmaz.** Her modül taraması yeni madde üretiyor (kulüp
   taraması 10, ödev 5). Sıfır bir bitiş değil, bir **ölçüm anı**.
3. **`TB-48` bekledikçe pahalanıyor.** 2026-08-12'de bilinçli ertelendi; o günden beri
   yeni bir okulda ders programı hattı sessizce boş doğuyor. Pilot açılmadan önce karara
   bağlanmalı — sonrasında veri göçü de gerekecek.
4. **`X-06` kapanmadan yazılan her handler borç ekliyor.** Faz 1–4'te yazılacak yeni
   sorgular da `MockQueryable` yeşiliyle doğacak. Ortak koşum kararı erken verilirse yeni
   handler'lar doğrudan doğru koşuma girer.
5. **Faz 2 ödev backend'inin ön koşulu.** Ödev modülüne Faz 2 bitmeden başlanırsa,
   mock'u olmayan iki uç "tarif" sayılıp yanlış yazılır.

---

## 10. Özet — önerilen koşu sırası

```
Faz 0  Karar turu (17 karar)                          ½ gün · sen
   │
   ├─ Faz 1  Kulüp (8)         ──┐  karar gerekmez, paralel koşabilir
   ├─ Faz 2  Ödev ön koşul (6) ──┤
   └─ X-11   CI kapısı          ──┘  (Faz 5'ten öne çekildi — sigorta)
   │
Faz 3  Merkezî kurallar (6)     ← 0.B kararları
   │
Faz 4  Kapsam sonrası (11)      ← 0.C kararları
   │
Faz 5  Ayrı projeler (6)        ← 0.A kararları · kendi takvimleri
Faz 6  Ödev modülüne kilitli (1)
```

**Faz 1–4 sonunda defter 38 → 7.** Kalan 7: `TB-48`, `X-03`, `X-06`, `TB-43`, `E-20`,
`E-13`, `TB-63` — altısı ayrı proje, biri kilitli.
