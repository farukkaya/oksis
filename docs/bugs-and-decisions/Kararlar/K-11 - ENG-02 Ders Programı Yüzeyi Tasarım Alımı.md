# K-11 · ENG-02 Ders Programı Yüzeyi — Tasarım Alım Kararları

> **Durum:** ✅ Karara bağlandı · **uygulandı ve `ENG-02` kapandı**
> **Tarih:** 2026-08-17
> **Kapattığı engel:** [[ENG-02 - Ogretmen ve ogrenci ders programi yuzeyi hic yok]]
> **Açtığı borçlar:** `TB-58` `TB-59` `TB-60` `TB-61` `TB-62` `TB-63`
> **Zincir:** `ENG-02` → `TB-29` (aynı öğretmen yüzeyi)
> **Tasarım kaynağı:** claude.ai/design · `Oksis Layout v2` ·
> `web/schedule-read.jsx` · `mobile/schedule-read.jsx` · `mobile/schedule-week.jsx`
> **Alım süreci:** `oksis-ui/.claude/skills/handoff-web` + `handoff-mobile` (dört kapı)

---

## 1. Neden bu karar gerekliydi

`B-17` turunda (2026-08-12) **Seçenek B** seçilmişti: öğretmen ve öğrenci menüsünden
`/schedule` kaldırıldı. O karar yüzey ihlalini kapattı, **ihtiyacı değil** — öğretmen
kendi haftalık programını, öğrenci kendi şubesininkini hâlâ hiçbir yerden göremiyordu.
`ENG-02` bu yüzden açık kaldı.

2026-08-17'de tasarım üretildi. Tasarımı koda çevirmek dört kapıdan geçmeyi gerektiriyor
ve üç kapıda karar gerektiren işaret çıktı. Bu dosya o kararları kaydeder.

---

## 2. Ölçümün değiştirdiği teşhis

`ENG-02` dosyası *"Sunucu tarafı **zaten hazır** … iş esas olarak FE ekranı + rol
dallanması"* diyordu.

**Yarısı doğruydu.** Altı tüketici ucu gerçekten yazılmış:

| Uç | Durum |
|---|---|
| `GET /api/v1/timetable/teachers/me/weekly` | ✅ var, şemada mevcut |
| `GET /api/v1/timetable/teachers/me/today` | ✅ var |
| `GET /api/v1/timetable/students/me/weekly` | ✅ var |
| `GET /api/v1/timetable/students/me/today` | ✅ var |
| `GET /api/v1/timetable/parents/children/{id}/weekly` | ✅ var (tasarım kapsamı dışı) |
| `GET /api/v1/timetable/parents/children/{id}/today` | ✅ var (tasarım kapsamı dışı) |

**Ama hiçbir ekran bunları çağırmadığı için içlerindeki kusurlar da hiç görülmemişti.**
Ölçüm beş kusur ve bir performans sorunu çıkardı (`TB-58`…`TB-62`), ve tasarımın
gösterdiği ile sunucunun verebildiği arasında **12 kayma** buldu.

Yani iş "yalnız FE ekranı" değil: **önce sunucu sözleşmesi**, sonra ekran.

---

## 3. Kararlar

### K-11a · Saat değişikliği istisnası tasarımdan çıkar

**Durum:** ❌ Kapsam dışı

Tasarım dört istisna türü çiziyor: iptal · vekâlet · derslik · **saat**.
Sunucuda üçü var; dördüncüsü bilinçli olarak yok. `ScheduleExceptionType` doc'u:

> Period modelinde zaman = zil çizelgesi olduğundan "TimeChange" tipi yoktur
> (Faz 2.5A kapsam dışı).

**Gerekçe:** bir dersin saatini tek gün için kaydırmak o günün bütün zil hizasını bozar.
Sunucudaki gerekçe sağlam ve yazılı; tasarım onu bilmeden çizmiş.

**Sonuç:** `override.kind === "time"` ve `newStart` her iki yüzeyden de çıkarılır.
Gerçek ihtiyaç doğarsa `TimeChange` eklemek `RoomChange` büyüklüğünde ayrı bir iş kalemi.

### K-11b · Ödev rozeti ve "Takvime ekle" teknik borç olarak kaydedilir

**Durum:** 📌 Borç → `TB-63`

İkisi de tasarımda var, ikisinin de arkası yok. Bu turda **çizilmezler** — olmayan bir
yeteneği duyurmak `ENG-02`'nin kapattığı hatanın aynısı.

| Öğe | Neden yok | Kilidi açan |
|---|---|---|
| "Bu derse ödev var" rozeti | Ödev modülü hiç yazılmamış (`TB-13`: 0 entity) | **Ödev modülü başlatıldığında hatırlanacak** |
| "Takvime ekle" (ICS) | Uç yok | Bağımsız; istendiği an yazılabilir |

"Yazdır / PDF" istemci tarafında (`window.print()` + hazır `@media print` bloğu)
çalışmaya devam eder ve aynı ihtiyacı bugün karşılar.

### K-11c · Ders tonu paleti onaylanır — kapalı ölçek olarak markaya eklenir

**Durum:** ✅ Onaylandı

Tasarım yeni bir renk ailesi getiriyor: web'de 6 ton (`t1…t6` × zemin/vurgu/metin =
18 değer), mobilde 7 ton × açık+koyu = 42 değer. Marka çekirdeğinden türemiyorlar.

**Gerekçe:** ihtiyaç gerçek. Sekiz dersi bir bakışta ayırmak anlam renkleriyle
(yeşil/sarı/kırmızı) yapılamaz — onlar *durum* anlatıyor, *ders* değil. Değerler sakin
ve düşük doygunluklu; marka ile çatışmıyorlar.

**Şart — ölçek KAPALI:** bugün 7 ton var. Dokuzuncu ders için sekizinci ton
**uydurulmaz**, tur döner (`t6` nötr fallback zaten tanımlı). Bu, markanın 5-satırlık
tipografi ölçeğiyle aynı disiplin.

**Ayrıca düzeltilir:** `--ok-bg: #E2F3EC` markadaki Success-bg `#E7F6EC` ile
değiştirilir (ıskalama). Mobildeki satır-içi yarıçap ve `fontSize` literalleri
`theme/tokens.ts`'e taşınır.

> ⚠️ **Uygulamada bu karar KÜÇÜLDÜ (2026-08-17 akşamı).** Faz B'de görüldü ki
> `packages/core/src/schedule/constants.ts`'te **12 tonluk `SUBJECT_PALETTE` zaten
> vardı** ve yöneticinin editörü onu `subjectColorIndex(subjectId)` ile — yani
> "aynı ders hep aynı ton" kuralıyla — kullanıyordu. Tasarımın 6-7 tonluk yeni
> paleti neredeyse aynı değerleri taşıyordu (`#EDF2FE/#3B5BDB` ↔ `#E7ECF9/#3A4F9C`).
> **İkinci palet üretilmedi; mevcut olan yeniden kullanıldı.** Kararın yönü doğruydu
> — ihtiyaç gerçekti ve kapalı bir ölçek gerekiyordu — ama ölçek zaten vardı.
> Ders: yeni bir token ailesi onaylamadan önce `packages/core`'da benzerinin
> olup olmadığına bakılmalı.

### K-11d · Hafta gezinme kapsamda kalır

**Durum:** ✅ Kapsamda

Hafta gezinme (`‹ 12-16 Ocak 2026 ›`) sunucuda gerçek iş: haftalık uç bugün **tarihsiz
bir kalıp** döndürüyor (Gün 1..5), `ScheduleException` ise **tarihe** bağlı. Tarih
ekseni eklenmeden geçmiş/gelecek hafta gösterilemez — ve overlay hiçbir haftada
çalışamaz (`TB-59`).

**Gerekçe:** olmadan ekran "bu hafta"ya hapsolur ve öğretmen **gelecek haftanın
vekâletini göremez**. Bu, ekranın varlık sebebine dokunur — ders programına bakmanın
asıl sebeplerinden biri yarını/haftaya planlamaktır.

---

## 4. Web rotası: aynı adres, rol dallanması

Tasarım registry'si aynı menü etiketinde (`"Ders Programı"`) role göre dallanıyor:

```js
// web/skeleton.jsx:307
if ((role === "teacher" || role === "student") && module === "Ders Programı") {
  return <ScheduleReadOnlyPage role={role} … />;
}
if (role === "admin" && module === "Ders Programı") {
  return <ProgramHubPage … />;
}
```

Duyurular modülü bu deseni zaten doğru uyguluyor. Aynısı: **`/schedule` korunur**,
sayfa `activeRole` okur. Ayrı bir `/my-schedule` rotası açmak hem tasarımla hem
mevcut desenle çelişirdi.

`nav-config.ts`'teki *"yazıldığında bu satır kendi rotasıyla geri gelir"* notu bu
kararla netleşiyor: satır **kendi rotasıyla değil, aynı rotayla** geri geliyor.

---

## 5. Uygulama planı — altı faz

| Faz | İş | Depo |
|---|---|---|
| **A** | Sunucu sözleşmesi: tarih ekseni, overlay genelleştirmesi, DTO alanları, `TB-58`…`TB-62` | `oksis-api` |
| **B** | `packages/api` tüketici hook'ları + `packages/core` ton/hafta/cümle mantığı | `oksis-ui` |
| **C** | Web salt okunur ekran (3 kırılım, yazdırma, çekmece) | `oksis-ui` |
| **D** | Mobil bugün + hafta ekranı, anasayfa widget'ları, koyu tema | `oksis-ui` |
| **E** | Nav satırlarının geri getirilmesi (web + mobil `href`) | `oksis-ui` |
| **F** | Kanıt: guard'lar kırmızıya düşürülerek doğrulanır, ekranda ölçüm, defter | üçü |

C ve D paralel gidebilir. Ayrıntılı adım listesi bu turun plan artifact'inde.

---

## 6. Bu kararın açtığı yol

`TB-29` (öğretmen kendi müsaitliğini giremiyor) bu yüzeyi bekliyordu. Faz D bittiğinde
öğretmenin mobil program ekranı var demektir — müsaitlik girişi oraya bir sekme olarak
oturur. **Bu planın kapsamında değil**, ama zincirin bir sonraki halkası açılabilir
hâle gelir.
