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
| 🔴 Kritik | 3 | Akışı bloklıyor veya iş kuralı ihlali üretiyor |
| 🟠 Yüksek | 8 | İşlev yanlış çalışıyor, veri/yetki güveni zedeleniyor |
| 🟡 Orta | 9 | İşlev eksik ama alternatif yol var; borç birikiyor |
| ⚪🟢 Düşük | 2 | Kozmetik, temizlik, adlandırma |
| ❓ Netleşmemiş | 0 | — |
| **Toplam** | **22** | |

**Modül dağılımı:** Duyurular 4 · Çapraz kesen 3 · Notlar 3 · Görevlendirme 2 · Kimlik 2 ·
Kullanıcılar 2 · Belge 2 · Kulüp 1 · Ders programı 1 · Nöbet 1 · Takvim 1

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

## 3. Notlar & Değerlendirme 🔴

Not modülü öncesi kod taraması (2026-08-19) ile uçtan uca testin (2026-08-25) artıkları.

### `X-16` · Not modülü teknik analizi emekli edilmiş tabloya dayanıyor 🔴

**Ölçüm.** Analiz §7.3 kapsam kapısının kaynağını şöyle tanımlıyor:

> aktif `TeachingAssignment(TeacherId=me, ClassRoomId, SubjectId, AcademicSessionId, RevokedAt IS NULL)`

`src/Oksis.Domain` altında **`TeachingAssignment` diye bir entity yok.** `X-15` kapatılırken
(`b278415` *"K-10 v1 teaching_assignments emekli edildi"*, `d45f298` merge — **18 Ağustos**,
analizin yazıldığı gün) tablo düşürüldü. Analiz o merge'den önceki repoyu taramış.

**Bugünkü tek kaynak:** `TeacherCourseLoadProjection` —
*"Hangi öğretmen hangi şubede hangi dersi kaç saat veriyor?" sorusunun **tek** cevabı"* —
**canlı ders programının yerleşimlerinden** türetiliyor (`IsActive && IsReserving`), sezon
değil **dönem** kapsamlı (`R-09`).

**Not modülü için üç sonucu var:**

1. `IGradeScopeGuard` yazma kapsamını `TeacherCourseLoadProjection.ForTeacherAsync(...)`
   üzerinden kurmalı; analizde tarif edilen `RevokedAt` süzgeci artık anlamsız.
2. **Yazma yetkisi yayınlanmış programa bağlanıyor.** Taslak program slot rezerve etmiyor
   (`IsReserving == false`), dolayısıyla programını yayınlamamış bir okulda **hiçbir öğretmen
   not giremez**. Analizde bu bağımlılık hiç yok. Ürün kararı gerektirir: kapsamın ikinci
   kaynağı olarak yetkinlik (`subject_teacher_assignments`) kabul edilecek mi, yoksa
   "program yayınlanmadan not girilmez" kuralı bilinçli mi?
3. Defterin kimliği kalıcı bir satır değil, bileşik anahtar
   (`TeacherCourseLoadProjection.CourseKey(classRoomId, subjectId)`). `GradeBook`'un
   koordinatları (`classRoomId`, `subjectId`, `termId`) bu anahtarla birebir örtüşüyor —
   uyumlu, ama biçim tek yerde yaşamalı ([[serilesmis-sekil-sozlesmedir]]).

**Ailesi:** `X-15`, `B-26`, `TB-32` — hepsi *"bir soruya iki kaynaktan cevap"* ailesi.
Analiz, kapatılmış bir kusurun kapatılmadan önceki hâline dayanmış.

**Aksiyon:** teknik analiz §7.3 ve §2 bağımlılık tablosu geliştirmeden **önce** düzeltilmeli;
`Teachers` satırı `TeachingAssignment` değil `TeacherCourseLoadProjection` demeli.

### `X-17` · İstemci, sunucunun role göre daralttığı ucu ayırt etmeden tüketiyor 🔴 *(yapısal yarısı kapandı — 2026-08-25; biçim kararı açık)*

`B-38` ve `B-40` aynı kusurun iki yönü:

- **Aşağı doğru:** öğretmen yüzü, yönetici ucundan (`/school-settings`) besleniyor →
  403 alıyor, ekran sessizce koda gömülü varsayılana düşüyor.
- **Yukarı doğru:** yönetici yüzü, öğretmen ucunu (`:publish`) çağırabiliyor →
  404 alıyor, ekran bunu "kayıt silinmiş" diye anlatıyor.

Ortak kök: **istemci, bir ucun hangi role ait olduğunu bilmiyor**; hem yanlış rolün
ucunu çağırıyor hem de reddi kullanıcıya yanlış tercüme ediyor. Rol daraltması sunucuda
doğru kurulmuş ([[kural-ekranda-degil-sunucuda]]), istemci tarafında karşılığı yok.

**Karara bağlanması gereken:** her ucun hedef rolü sözleşmede işaretlensin mi
(üretilmiş şemadan türetilebilir), yoksa yüzey başına elle mi ayrılsın? İkincisi
aynı hatayı bir sonraki modülde tekrar üretir.

**Çözüm — yetenek bayrağı kaynağın kendisinde.** İki ayak da kapandı ve ikisi de
AYNI biçimi kullandı:

| Yön | Eski | Yeni |
|---|---|---|
| Aşağı (`B-38`) | istemci yönetici ucunu çağırıyor, 403'te varsayılana düşüyor | modülün kendi rol-güvenli okuma ucu (`GET /grades/policy`) |
| Yukarı (`B-40`) | istemci rolden "yazabilirim" çıkarımı yapıyor | sunucu zaten çektiği kaynakta `canWrite` söylüyor |

Ortaya çıkan kural: **istemci bir yeteneği rolden TÜRETMEZ; sunucu onu, istemcinin
zaten okuduğu kaynağın üstünde söyler.** Bu, maddede sorulan iki seçeneğin de
alternatifidir — ne her ucun hedef rolünü sözleşmede işaretlemek (üretilmiş şema
şişer, istemci yine kendi çıkarımını yapar) ne de yüzey başına elle ayırmak
(aynı hata bir sonraki modülde tekrarlanır).

**Açık kalan — reddin BİÇİMİ (karara gitmeli).** Kapsam reddi bugün `NotFound`
ile örtülüyor ve istemci onu *"kayıt bulunamadı; silinmiş olabilir"* diye
çeviriyor. Ölçüldü: bu kalıp not modülünde **beş** yazma handler'ında aynı
(`SetMark`, `AmendMark`, `ClearAssessmentMarks`, `SetAssessmentExamDate`,
`PublishAssessment`).

Önerilen ayrım — *okuyabiliyor ama yazamıyor* → **403 + modül önekli Türkçe
gerekçe**; *okuyamıyor bile* → **404** (varlık sızdırmama korunur). Deponun bunun
için hazır bir mekanizması var: `mutation-error.ts`
`DOMAIN_FORBIDDEN_CODE_PREFIXES` (bugün yalnız `"Announcements."`) sunucunun
Türkçe cümlesini ekrana geçiriyor.

**Neden bu turda YAPILMADI:** `ResultExtensions.MapStatusCode` modül başına
elle yazılmış bir zincir; oraya yalnız `Grades.` dalı eklemek, maddenin kendi
uyardığı "yüzey başına elle ayırma"nın ta kendisi olurdu. Karar tüm modüller
için bir kez verilmeli. `B-40`'ın menü düzeltmesi bu yolu arayüzden zaten
kapattığı için acil değil; görevlendirmesi oturum ortasında değişen öğretmen
tek kalan tetikleyici.

### `TB-46` · Not ve sınav yapılandırması tüketicisiz, üstelik ağırlık iki yerde tanımlı 🟡
Notlandırmanın tüm yapılandırma yüzeyi hazır ama **arkasında hiçbir şey yok** — not
modülünün hesap ayağı yazılmadı. *(2026-08-31 düzeltmesi: eskiden burada `TB-13`'e atıfla
"boş klasör" yazıyordu; `Grades` domain'i bugün var — `Assessment`, `AssessmentStatus`,
`MarkSpecialValue`, `GradeVisibility`. Eksik olan ağırlıkların TÜKETİCİSİ.)*
- **Sınav ağırlığı iki ayrı yerde:** master sınav türünde tür başına yüzde (`ExamType.WeightPercent`), okul akademik politikasında ise yazılı/performans ağırlığı (`WrittenWeight` + `PerformanceWeight`, toplamı 100 olmak **zorunda** — doğrulayıcısı var).
- **İkisinin de tüketicisi yok.** `WeightPercent` hiçbir yerde okunmuyor; okul ayarındaki ağırlıklar yalnız kendi CRUD'unda dönüyor.
- Aynısı geçme notu, yuvarlama kuralı, yazılı/performans sayısı ve not ölçeği seçimi için de geçerli: seçiliyor, doğrulanıyor, saklanıyor — kullanılmıyor.
- **Etkisi (bugün):** Yönetici akademik politikayı dolduruyor ve hiçbir şey olmuyor. `TB-35`/`TB-43` ile aynı aile.
- **Etkisi (yarın):** Not modülü geldiğinde **iki rakip ağırlık tanımı** hazır bekliyor olacak ve hangisinin yetkili olduğuna dair yazılı bir karar yok.
- ⬜ **Karar (not modülünden ÖNCE):** Ağırlık master sınav türünde mi, okul politikasında mı yaşayacak? İkisi birden kalırsa ilk not hesabında çakışır.

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

### `TB-78` · Bildirim yolu `CanViewInfo` kapısını atlıyor 🟠

**Ölçüm.** `NotificationRecipientResolver.ResolveGuardianAccountsAsync` veli hesaplarını
çözerken yalnız `SchoolId` + `RevokedAt == null` süzüyor (`NotificationRecipientResolver.cs:36`);
`ParentStudentRelationship.CanViewInfo` **sorguya hiç girmiyor**.

**Bu bilinçli.** Yoklamadaki üç bildirim handler'ı (`ExcuseDecided`,
`AmendmentRequestDecided`, `AbsenceThresholdReached`) docblock'larında bunu açıkça yazıyor:
*"RevokedAt==null, **CanViewInfo şartı YOK**"*. Yani okuma yüzeyi (`StudentAttendanceScopeGuard`,
`ListExcuses`, `GetExcuseDetail`) `CanViewInfo` süzerken, bildirim yüzeyi süzmüyor —
**aynı veri için iki farklı kapı.**

**Neden bugün savunulabilir, yarın değil.** Yoklamada bildirim metni "çocuğunuz devamsız
sayıldı" — bilgiyi görme yetkisi olmayan veliye de gitmesi tartışılır ama savunulabilir.
Notta durum farklı: ön inceleme §4 *"Ayrı yaşayan ebeveyn: `CanViewInfo=false` ise bildirim de
gitmemeli"* diyor. Aynı resolver'ı süzgeçsiz kullanan bir `GRADE_PUBLISHED` handler'ı,
handler seviyesindeki kapsam kapısının (`IGradeScopeGuard`) **etrafından dolaşır**.

**Karar gerektiriyor, bu yüzden çözümü burada değil karar panosunda:** resolver merkezî
olarak mı süzsün (yoklamanın bugünkü davranışı değişir), yoksa çağıran mı seçsin
(`includeInfoRestricted: bool`)? [[yamalama-kabul-degil]] merkezî çözümü işaret ediyor ama
yoklamanın davranış değişikliği ayrı bir onay. → [[OKSİS - Yapısal Kararlar ve Eksikler]]

**Ailesi:** [[eksik-ekran-eksik-yetkiyi-gizler]] — bildirim yüzeyi hiç çağrılmadığı için
(`GRADE_PUBLISHED` bugün `delivered: false`) arkasındaki kapı kusuru da görünmüyordu.

### `TB-31` · Devamsızlık eşik bildiriminde fail-open 🟡
Eşiğe gelen öğrenci için mükerrer bildirim iki katmanla önleniyor: hızlı bir önbellek kapısı ve arkasında kalıcı damga. Önbellek erişilemezse sistem **açık kalıyor** (fail-open) ve DB yedeğine düşüyor.
- **Etkisi:** Kesinti anında aynı öğrenci için mükerrer eşik uyarısı gidebilir. Veli/öğrenciye giden bildirim olduğu için gürültü doğrudan hissedilir.
- ⬜ **Karar gerekiyor:** Kesintide bildirim **gitsin mi gitmesin mi**? Kapalı kalma (fail-closed) uyarıyı geciktirir; açık kalma mükerrer üretir. Kod bugün ikincisini seçmiş ama gerekçesi yazılı değil.

### `TB-104` · "Tümünü okundu işaretle" sezon kesmesini kullanmıyor 🟡

`WithinActiveSeason` süzgecini yalnız iki tüketici kullanıyor (`GetMyNotifications`,
`GetMyUnreadCount`); `MarkNotificationRead` / `MarkAllNotificationsRead` komutları
kullanmıyor. Sonuç: listede ve rozette görünmeyen sezon-dışı (ya da `X-19` senaryosunda
sezon-öncesi) bildirim, "tümünü okundu işaretle" ile **görünmeden** okundu sayılabilir.
Bugün kullanıcıya görünen zararı yok (işaretlenen şey zaten gizli), ama okuma yüzeyi ile
yazma yüzeyi aynı kesmeyi paylaşmıyor — B-06'nın "sayaç listeyle aynı kesmeyi kullanır"
ilkesinin komut ayağı eksik. 2026-08-31 kod doğrulamasında bulundu
([[bulgu-kapanis-turu-teknik-analiz]] §0.2). `X-19` 2026-08-31'de kapandı ama bu ayak
onunla birlikte kapatılMADI — okuma yüzeyi (liste + rozet) kesmeyi uyguluyor, yazma
komutları hâlâ uygulamıyor.

> 🔧 **Kod taramasından bu bölüme bağlananlar** *(2026-08-10)*: `TB-22` (acil işareti yalnız oluşturma anında sorgulanıyor), `TB-23` (onay gerektiren duyuru zamanlanınca kuyruğu atlıyor), `TB-24` (acil = e-posta kanalı seed'de yazılı, tüketicisi yok), `TB-25` (şablon acil kapısı yok), `TB-26` (onay kuyruğunda acil rozeti yok). Beşi de → [Kod Taraması Bulguları](#11-kod-taraması-bulguları-domain-map-).

---

## 7. Kimlik & Rıza 🟠

### `E-01` · Rıza yenileme ekranı yok — 403 çıkışsız 🟠
- **Eksik olan:** Rızası geri çekilmiş ya da rıza paketi sürümü ilerlemiş kullanıcının **rızayı yeniden verebileceği bir ekran yok.** Ne web'de ne mobilde.
- **Katman:** FE · **Öncelik:** 🟠 Yüksek (mevzuat) · **Tip:** Eksik özellik — kapsam kararı kullanıcınındır
- **Nasıl bulundu:** `TB-10` kapanışının ardından yapılan çıkış yolu kontrolünde (2026-08-12).
- **Ölçüm — eksik olan backend değil, arayüz:** `POST /api/v1/users/consents` (`GrantConsentCommandHandler`) **var ve çalışıyor**; `users.update` yetkisi ve açık bir oturum istiyor, yani bir yönetici başkası adına rızayı yeniden verebilir. Ama arayüz bu ucu **hiç çağırmıyor**: `packages/api` + `apps/web` + `apps/mobile` içinde `users/consents` POST çağrısı **sıfır** eşleşme. FE'deki tek rıza yüzeyleri davet kabul ekranı (ilk onay) ve `users/self/consents` (geri çekme).
- **Sonuç — tek yönlü kapı:** `TB-10` ile birlikte rıza düşünce oturum artık gerçekten kapanıyor. Bu **doğru** davranış, ama kullanıcı için çıkışsız bir odaya dönüşüyor: giriş 403, yenileme 403, rızayı yeniden verecek ekran yok. Kullanıcının kendisi hiçbir şey yapamıyor; yöneticinin elinde de yalnızca doğrudan API çağrısı var, düğme yok.
- ⚠️ **Bugün sahada patlamıyor** çünkü rıza paketi sürümü hiç ilerletilmedi (`master.consent_bundles`: 1 satır, `v2026.05.01`) ve seed kullanıcılarının hepsi `Granted`. **İlk sürüm yükseltmesinde 381 rıza kaydının tamamı aynı anda kapıya takılır.**
- ❓ **Karar gerekiyor:** rıza yenileme ekranı MVP kapsamında mı? Kapsam dışıysa, sürüm yükseltmesinin **operasyonel bir engel** olduğu yazılı hâle gelmeli.
- 🔗 **`B-18` kapandı ama bu madde açık:** kullanıcı artık **doğru teşhisi** görüyor ("KVKK onayı gerekiyor"), çıkış yolu hâlâ yok. Teşhisin düzelmesi çıkışın yerine geçmez.

### `B-19` · Askıya alma ekranındaki tek eylem düğmesi ölü ⚪
- **Belirti:** Giriş → askıya alınmış hesap ekranındaki birincil düğme **"Okul yönetimine yaz"** tıklanabilir görünüyor ama **hiçbir şey yapmıyor.**
- **Katman:** FE (web) · **Öncelik:** ⚪ Düşük
- **Nasıl bulundu:** `B-18` ekran ölçümünde, ÖNCE kanıtı alınırken (2026-08-12).
- **Ölçülen kök neden:** `apps/web/features/auth/login-screen.tsx` → `SuspendedView`, `<button type="button" className="au-btn">` — `onClick` yok, `href` yok. Görsel tasarımdan (Claude Design auth) taşınırken eylemi bağlanmamış.
- **Neden yalnız kozmetik değil:** ekranın söylediği tek eylem bu. Kullanıcı düğmeye basıyor, hiçbir şey olmuyor ve yönetime nasıl ulaşacağını hâlâ bilmiyor. Mobilde bu düğme **yok** (yalnız "Girişe dön"), yani ekranlar bu noktada da ayrışmış durumda.
- ❓ **Karar gerekiyor:** düğme ne yapmalı — okul e-postasına `mailto:` mı, uygulama içi bir iletişim ekranı mı, yoksa kaldırılıp metne mi indirgenmeli? Okulun iletişim adresi bugün istemcinin elinde yok (giriş yapılmamış oturum), bu yüzden `mailto:` bile veri gerektiriyor.

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

### `B-24` artığı · "Pasife Al" etiketi ile ürettiği durum uyuşmuyor ⚪

Öğrenci listesindeki **"Pasife Al"** eylemi artık `:withdraw` ucuna bağlı ve kaydı **"Ayrılmış"**
durumuna geçiriyor (domain modeli buna zorluyor: `Archived`, aktif bir öğrenciden değil ancak
mezun/ayrılmış/nakil bir kayıttan sonra gelen saklama adımı). Onay modali sonucu doğru söylüyor
ama **buton etiketi eski adında kaldı.**

⬜ **Karar:** etiket "Ayrılmış Say" / "Kaydı Kapat" gibi bir şeye mi dönsün?

---

## 10. Belge & Depolama 🟡

### `TB-38` · İki belge akışı, iki farklı depolama yaklaşımı 🟡
- **Mazeret belgesi** → dosya yönetimi modülündeki saklı dosyaya **referans** veriyor; kod açıkça "yeni depolama icat etme" diyor.
- **Öğrenci belgesi** → dosya adresini **serbest metin** olarak kendi kaydında tutuyor.

Aynı ürün içinde iki evrak akışı, iki farklı yaklaşım. Öğrenci belgesi tarafı dosya yönetimi modülünün sağladıklarından (virüs taraması, kota, yetim dosya temizliği, erişim denetimi) yararlanamıyor.
- ⬜ **Karar:** Öğrenci belgesi de saklı dosya referansına taşınsın mı?
- ➕ **Ayrışmanın bir sebebi bulundu** *(dosya yönetimi taraması, 2026-08-10)*: Dosya kategorisi defterinde **öğrenci belgesi diye bir kategori hiç yok**. Yani taşıma kararı tek başına yetmez; önce bir kategori açılması ve o kategorinin **saklama süresine karar verilmesi** gerekir (KVKK kararı — mazeret belgesininki bile "teyit bekleyen taslak" diye işaretli).

### `TB-42` · Dört dosya kategorisinin bağlanabileceği kayıt tipi yok 🟡
İki ayrı kayıt defteri var ve **örtüşmüyorlar**:
- **Kategori defteri** (kodda sabit): ödev teslimi, sınav belgesi, sanal kitap, okul logosu, kulüp belgesi, duyuru eki, mazeret belgesi, önizleme.
- **Erişim çözümleyici defteri** (DI kayıtları): yalnız **okul**, **mazeret**, **duyuru**.

Yani ödev teslimi, sınav belgesi, sanal kitap ve kulüp belgesi kategorileri tanımlı ve kategori politikası ucundan okunabiliyor — ama o dosyalar hiçbir kayda **bağlanamıyor**; deneme sessizce reddediliyor (404).
- Kod bunu "henüz tüketicisi gelmemiş" diye açıklıyor, yani bilinçli bir bekleme.
- **Risk:** Kategori politikası ucu bu kategorileri gerçekmiş gibi gösteriyor. Arayüz bu listeden beslenirse kullanıcıya çalışmayan seçenek sunulur.
- ⬜ **Karar:** Tüketicisi olmayan kategoriler defterden çıkarılsın mı, yoksa "hazırlanıyor" diye işaretlensin mi?

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

### `X-10` · Rota kapısı rol çözülene kadar geçirgen — yanlış rol ekranı kısa süre görülüyor 🟡
- **Belirti:** Öğrenci `/schedule` adresini açtığında yönetim konsolu **kısa süreliğine mount oluyor**; beş yönetim isteği gerçekten atılıyor (`class-rooms`, `class-rooms?sessionId`, `school-settings/grade-levels`, `users/persons?profileType=Teacher`, `timetable/programs`) ve **beşi de 403** dönüyor. Rol çözüldükten sonra ekran *"Bu sayfaya erişemezsiniz"*e dönüyor.
- **Katman:** FE · **Öncelik:** 🟡 Orta
- **Nasıl bulundu:** `B-17` kapanış ölçümü, 2026-08-12 — menü budaması doğrulanırken ağ sekmesinde görüldü. `B-17`'nin ürünü **değil**, ondan bağımsız ve önceden var.
- 🔍 **Kök neden tek koşulda:** `apps/web/components/route-guard.tsx:24` → `if (activeRole && !canAccessRoute(activeRole, pathname))`. `activeRole` henüz **null** iken (oturum bağlamı sorgusu sürüyor) koşul kısa devre yapıyor ve sayfa **olduğu gibi** render ediliyor.
- ⚠️ **Bu bir gözden kaçma DEĞİL, yazılı bir tercih:** dosyanın kendi yorumu diyor ki *"Rol henüz çözülmemişken sayfa olduğu gibi render edilir: burada engellemek her gezinmede boş ekran flaşı yaratır."* Yani biri bu ödünü tartmış ve bugünkü davranışı seçmiş. **Bu yüzden tek başıma değiştirmedim.**
- 🔍 **Ama tartının bir tarafı eksik ölçülmüş:** ödün *"boş ekran flaşı"* ile karşılaştırılmış, oysa gerçekte olan **yanlış ekranın çizilmesi + beş reddedilen istek**. Ayrıca kaçınılmak istenen flaş için gereken sinyal **zaten mevcut**: `useActiveRole` `isLoading` alanını da döndürüyor. Yani "rol yok" ile "rol henüz gelmedi" ayırt edilebilir ve kapı yalnız ikincisinde bekletebilir — boş ekran yerine iskelet gösterilerek.
- 📌 **Kapsamı tek ekran değil:** kural her korumalı rotada aynı; `/schedule` yalnız ölçüldüğü yer. Güvenlik sınırı değil (gerçek kapı .NET tarafında, beş istek de 403 aldı) ama `B-17`'nin ve `B-01`'in şikâyet ettiği şeyin ta kendisi: **kullanıcıya sahip olmadığı bir yetenek gösteriliyor.**
- ⬜ **Açık — karar gerektiriyor:** yazılı bir tercih değiştirileceği için `RouteGuard`'ın yükleme penceresinde bekletilmesi onaylanmalı.

### `X-18` · Yatay çip şeridi üçüncü kez ekranı ikiye böldü — kulüp keşfi 🟠 *(ekran düzeltildi — 2026-08-30; merkezî bileşen AÇIK)*

Öğrenci "Kulüpler" keşif ekranında kategori çipleri **ekran boyu dev ovallere**
dönüşmüş, liste aşağı itilmişti (cihazda görüldü, 2026-08-30 uçtan uca test).
Kök neden `TB-88`'in birebir aynısı: RN'in `ScrollView` taban stili yatay kipte
de `flexGrow: 1` taşır; şerit `flex: 1` bir kabın içinde ikinci `ScrollView` ile
KARDEŞ olduğunda boş dikey alanı onunla paylaşır. Çipin `minHeight: 32` demesi
onu kurtarmıyor — kap gerildiğinde `alignItems` varsayılanı (`stretch`) çipi
uzatıyor; yan etki olarak uzun etiket (`Teknoloji`) sıkışıp okunmaz oluyordu.

**Bu üçüncü tekrar:** notlar dönem şeridi (2026-08-23, `grade-parts.tsx`,
`flexGrow: 0` yorumuyla), ödev ders şeridi (`TB-88`, 2026-08-27, `SubjectChipRow`
bileşenine taşınarak), şimdi kulüp kategori şeridi. Her seferinde yeni bir ekran
aynı düzeni **kopyalayarak** doğuruyor ve kabın davranışını taşımıyor.

**Bugün yapılan (yama):** `discovery-list-screen.tsx` şeridine
`style={{ flexGrow: 0, flexShrink: 0 }}`, `contentContainerStyle`'a
`alignItems: 'center'`, çipe sabit `height: 32`. Mobil web hedefinde öğrenci
rolüyle doğrulandı: çipler normal yükseklikte, "Teknoloji" etiketi tam
görünüyor, kategori süzgeci çalışıyor.

**Açık kalan (merkezî çözüm):** mobilde `@/components` altında tek bir
`ChipRow`/`FilterStrip` bileşeni yok; `grade-parts`, `self-parts` ve kulüp
kendi kopyalarını taşıyor. Dördüncü ekran aynı hatayı yeniden açabilir.
Karar gerekiyor: ortak bileşen çıkarılsın mı, çıkarılırsa üç çağrı yeri
oraya taşınır.

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
