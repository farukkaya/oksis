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
| 🟠 Yüksek | 2 | İşlev yanlış çalışıyor, veri/yetki güveni zedeleniyor |
| 🟡 Orta | 1 | İşlev eksik ama alternatif yol var; borç birikiyor |
| ⚪🟢 Düşük | 0 | Kozmetik, temizlik, adlandırma |
| ❓ Netleşmemiş | 0 | — |
| **Toplam** | **4** | |

**Modül dağılımı:** Görevlendirme 2 · Nöbet 1 · Çapraz kesen 1

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
