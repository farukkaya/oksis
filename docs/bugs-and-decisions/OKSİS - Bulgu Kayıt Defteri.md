# OKSİS — Bulgu Kayıt Defteri

> **Ne bu dosya:** ölçülmüş ve **hâlâ açık** olan bulgular. Bir madde kapandığında
> bloğu [[OKSİS - Bulgu Arşivi]]'ne taşınır; burada iz bırakmaz.
> **Kapanmış her şey:** [[OKSİS - Bulgu Arşivi]] — kanıtlar, commit'ler, kapanış turları.
> Aşağıdaki metinlerde geçen kapanmış madde ID'leri (`B-20`, `TB-88`, `X-15` gibi) orada aranır.
> **Karar bekleyenler:** [[OKSİS - Yapısal Kararlar ve Eksikler]]
> **Son yeniden düzenleme:** 2026-08-31 — **bulgu kapanış turu** (A–D blokları) 12 maddeyi
> kapattı ve arşive taşıdı ([[OKSİS - Bulgu Arşivi]] §29); defterde 39 açık madde kaldı.
> Turun teknik analizi: [[bulgu-kapanis-turu-teknik-analiz]].

**Sıralama mantığı:** modül bazlı gruplandı, modüller risk ağırlığına göre sıralandı
(aktif çalışılan ve akış bloklayan modül en üstte).

**ID şeması** (yeni partilerde devam eder):
- `B-##` → Fonksiyonel bulgu
- `D-##` → Tasarım / UX bulgusu
- `V-##` → Validasyon & iş kuralı bulgusu
- `X-##` → Çapraz kesen iş
- `TB-##` → Teknik borç (kod taramasından)
- `E-##` → Eksik özellik · `ENG-##` → Engel

**Sıradaki boş ID:** `B-50` · `D-19` · `V-04` · `X-20` · `TB-105` · `E-23` · `ENG-03`
*(`E-##` sayacı [[OKSİS - Yapısal Kararlar ve Eksikler]] ile ortaktır.)*

**Yazma kuralı:** yeni ID vermeden önce hem bu dosyada hem
[[OKSİS - Yapısal Kararlar ve Eksikler]]'de, hem de [[OKSİS - Bulgu Arşivi]]'nde `grep` at —
sayaçlar üçü arasında ortak.

---

## Özet

| Öncelik | Adet | Kapsam |
|---|---|---|
| 🔴 Kritik | 1 | Akışı bloklıyor veya iş kuralı ihlali üretiyor |
| 🟠 Yüksek | 4 | İşlev yanlış çalışıyor, veri/yetki güveni zedeleniyor |
| 🟡 Orta | 4 | İşlev eksik ama alternatif yol var; borç birikiyor |
| ⚪🟢 Düşük | 0 | Kozmetik, temizlik, adlandırma |
| ❓ Netleşmemiş | 0 | — |
| **Toplam** | **9** | |

**Modül dağılımı:** Görevlendirme 2 · Duyurular 2 · Kulüp 1 · Kullanıcılar 1 ·
Ders programı 1 · Nöbet 1 · Takvim 1 · Çapraz kesen 1

**Senin kararını bekleyenler: YOK.** 2026-08-31 karar turunda **21 yön kararının tamamı**
bağlandı — bu liste ilk kez boş. Kararların kanonik kaydı:
[[K-12 - Defter Sıfırlama Karar Turu]]. Sıra ve fazlar: [[defter-sifirlama-is-sirasi]].

**Zincirler — hangi madde hangisini bekliyor**

Hepsi `K-12` ile karara bağlandı; kalan bağımlılık **uygulama sırasıdır**:

```
X-17  ──►  beş not yazma handler'ı + her yeni modül (ÖNCE yazılmalı)
X-06  ──►  ortak koşum kurulmadan yazılan her handler yeni borç ekler
TB-48 ──►  B-07 · vekâlet · duyuru hedefi · sezon devri (v1 ekranı geri gelince)
TB-43 ──►  E-20 aynı kalemin içinde kapanır
TB-55 ──►  B-20 ve TB-20'nin branş ayağı birlikte kapanır
TB-46 ──►  not modülü başlamadan ÖNCE (iki rakip ağırlık tanımı)
X-16  ──►  not modülü analizinin §7.3'ü düzeltilmeden geliştirmeye başlanmaz
```

---

## 1. Kulüp Modülü 🟡

Aktif modül. Kod taraması (2026-08-29, `oksis-api` @ `1acf29a` · `oksis-ui` @ `1fec5aa`)
ve uçtan uca ekran testi (2026-08-30, `s1` · web + mobil web) birlikte. Uçların kendisi
sağlam çıktı; bulguların çoğu **ekran ile sunucunun ayrıştığı** yerlerde.
Test rehberi: `oksis-api/docs/testing/kulup-modulu-test-rehberi.md`.

### `E-20` · Kulüp push'unu yönetici açamaz — matriste push sütunu yok 🟡

Backend matris satırı `SupportsPush` + `PushEnabled` döndürüyor
(`NotificationMatrixDto.cs:35-79`, `efb42f2`), `RuleItem.PushEnabled` üç
durumlu yazılıyor (`dba6997`); web `notification-tab.tsx:109-146` yalnız
Portal / E-posta / SMS çiziyor. K-02'nin `S-8` kapsam-dışı maddesi. Kulüpte
görünür sonucu: `CLUB_ACTIVITY_PUBLISHED` varsayılan kapalı (S-9) ve yönetici
açmak istese düğmesi yok. Kulüpten bağımsız, ayar ekranı işi; analiz §20.

---

## 4. Görevlendirme 🔴

`K-10` kararıyla yön belli (v2 + müfredat türetmesi, v1 emekli) ama emeklilik tamamlanmadı.
İki madde aynı düğümün iki adı.

### `TB-48` · Görevlendirme v1'in tek yazma yüzeyi kapalı, yedi tüketicisi hâlâ ona bağlı 🔴

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

### `X-03` · Görevlendirme iki nesil hâlinde yan yana yaşıyor 🟠
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

---

## 5. Ders Programı 🟡

`ENG-02` kapandıktan sonra aynı yüzeyde ölçülenlerin açık kalanları.

### `TB-63` · Ders programı tasarımında arkası olmayan iki öğe — teknik borç 🟡

Kullanıcı kararıyla (2026-08-17) ikisi de bu turda **çizilmiyor**, borç olarak kayda
geçiyor:

- **"Bu derse ödev var" rozeti** (mobil öğrenci ders satırı) · `homework: true` alanı.
  *(2026-08-31 düzeltmesi: burada "ödev modülü hiç yazılmamış, 0 entity" yazıyordu ve bu
  bayattı — `Homework`, `HomeworkSubmission`, `HomeworkAttachment`, `HomeworkTracking`,
  `HomeworkAuditEntry` domain'de duruyor, beş migration geçmiş.)* Eksik olan, ders programı
  satırını besleyecek **sorgu**: bir dersin o gün ödevi var mı.
  🔓 **Kilidi açan:** ödev ucunun ders programı satırına bağlanması.
- **"Takvime ekle" butonu** (web başlık aksiyonu) · ICS üretimi. Uç yok.
  🔓 **Kilidi açan:** bağımsız — istendiği anda yazılabilir. "Yazdır / PDF" istemci
  tarafında çalıştığı için acil değil.

---

## 6. Duyurular & Bildirimler 🟠

### `TB-43` · Bildirim ayarlarının teslimata hiçbir etkisi yok 🟠
Okul Ayarları'ndaki "Bildirimler" sekmesi üç kanallı bir olay×kanal matrisi sunuyor. **Hiçbiri çalışmıyor.** Üç ayak da ölü:
- **Kural matrisi** (`NotificationRuleConfig`) yalnız kendi ayar sorgusunda/komutunda okunup yazılıyor; dağıtım motoru ona **hiç bakmıyor**.
- **Kanal anahtarları** (push/e-posta/SMS) ve **ana kapama anahtarı** da dağıtımda okunmuyor. Motor kayıtlı tüm kanallar × tüm alıcılar üzerinde koşulsuz döner.
- **Kayıtlı tek kanal in-app.** E-posta, SMS ve push kanallarının uygulaması yok — matriste sunulan iki kanalın arkasında hiçbir şey yok.

**Etkisi:** Yönetici bir olayın SMS'ini kapatıyor, e-postayı açıyor, hatta bildirimleri tümden kapatıyor — davranış değişmiyor. Ekran gerçeği yansıtmıyor.
- **Aile:** `TB-35` ile aynı desen (ayar var, tüketici yok) ama daha geniş — orada bir alan ölüydü, burada ayar sekmesinin tamamı.
- ⬜ **Karar:** Ayarlar teslimata bağlansın mı, yoksa ekran bugünkü gerçeğe (tek kanal) indirgensin mi? İkisinin arasında kalmak en kötüsü.

> 🔧 **Kod taramasından bu bölüme bağlananlar** *(2026-08-10)*: `TB-22` (acil işareti yalnız oluşturma anında sorgulanıyor), `TB-23` (onay gerektiren duyuru zamanlanınca kuyruğu atlıyor), `TB-24` (acil = e-posta kanalı seed'de yazılı, tüketicisi yok), `TB-25` (şablon acil kapısı yok), `TB-26` (onay kuyruğunda acil rozeti yok). Beşi de → [Kod Taraması Bulguları](#11-kod-taraması-bulguları-domain-map-).

---

## 8. Nöbet & Vekalet 🟠

### `TB-19` · Geçici muafiyet hiçbir aşamada tam uygulanmıyor 🟠
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

---

## 9. Kullanıcılar & İçe Aktarma 🟡

### `TB-55` · İki ayrı toplu içe aktarma yolu yan yana yaşıyor 🟡
- **Bulgu:** Aynı iş — "dosyadan toplu kişi ekle" — için birbirinden habersiz **iki** uç var:
  - `POST /api/v1/users/import` (Identity): başlıklar `Ad, Soyad, Email, Rol`; senkron; `Person` + minimal profil + **davet** üretir; sezon ve rıza paketi önkoşulu arar.
  - `POST /api/v1/users/imports/preview` → `POST /api/v1/users/imports` (Users): profil tipine göre şablon (öğretmende `Brans`, öğrencide `OgrenciNo`…); önizleme + onay + Hangfire işi; **davet üretmez** (bkz. `B-20`), rol/sezon/rıza hiç sormaz.
- **Katman:** BE · **Öncelik:** 🟡 Orta · **Nasıl bulundu:** `TB-20` ölçümü sırasında (2026-08-12).
- **Neden borç:** İkisi de "içe aktarma" adını taşıyor ama farklı şey üretiyor. Bir okul öğretmen listesini hangisinden yüklerse yüklesin sonucu farklı: birinde branş yok ama davet var, diğerinde branş var ama davet yok. Hangisinin "doğru" yol olduğu koddan okunmuyor.
- 🔗 `B-20`'nin (davet bayrağı ölü) ve `TB-20`'nin "davet yolunda branş sorulmuyor" ayağının ortak zemini bu ikilik. Üçü birlikte düşünülmeli: tek bir içe aktarma yolu, hem branşı çözen hem daveti üreten.
- ⬜ **Karar gerekiyor:** hangisi kalacak? Birleştirme kapsam kararıdır; bugün ikisi de canlı.

---

## 11. Takvim & Master Data 🟠

### `E-13` · Resmî tatil kataloğu dini bayramları taşıyamıyor 🟠
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

---

## 12. Çapraz Kesen İşler ✳️

Tek bir ekranın değil, bir **sınıfın** işi. Kapanışları da merkezî olmak zorunda
([[yamalama-kabul-degil]]).

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

---

---

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
