# OKSİS — Bulgu Kayıt Defteri

> **Kaynak:** İlk bakış testi, 1. parti (2026-08-08) — `Bulgular.md`
> **Kaynak 2:** Kod taraması, domain-map partisi (2026-08-10) — `oksis-api` @ `2270867` · bkz. [11. Kod Taraması Bulguları](#11-kod-taraması-bulguları-domain-map-)
> **Kaynak 3:** Kod taraması, duyurular/acil kavşağı partisi (2026-08-10) — `TB-22 … TB-26`, aynı bölümde
> **Kaynak 4:** Çalışma zamanı hata kaydı (2026-08-10) — çalışan API'nin yığın izinden doğrulanan bulgular: `B-15`, `X-06`
> **İlgili:** [[OKSİS - Yapısal Kararlar ve Eksikler]]
> **Durum:** Test devam ediyor, yeni partiler bu dosyaya eklenecek.

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

---

## Özet

| Öncelik | Adet | Kapsam |
|---|---|---|
| 🔴 Kritik | 7 | Akışı bloklıyor veya iş kuralı ihlali üretiyor |
| 🟠 Yüksek | 4 | İşlev yanlış çalışıyor, veri/yetki güveni zedeleniyor |
| 🟡 Orta | 8 | İşlev eksik ama alternatif yol var |
| ⚪ Düşük | 5 | Kozmetik / temizlik |
| **Toplam** | **24** | 16 fonksiyonel + 7 tasarım + 1 validasyon |

**Kapananlar:** `B-03` · `B-08` · `B-10` · `B-11` · `B-15` · `D-03` · `TB-22` · `TB-23` · `TB-25` — `D-05` kodda kapandı, ekran doğrulaması bekliyor.
**Kalan (bu dosyada, TB kuyruğu hariç):** 15.

**Katman dağılımı:** BE 9 · FE 9 · Her ikisi 5

**Çapraz kesen 6 iş** (`X-01` … `X-06`) mevcut bulgulardan türetildi, sayıma dahil değil — bkz. [Çapraz Kesen İşler](#10-çapraz-kesen-i̇şler-).

---

## 1. Sezon Yönetimi 🔴

Bu modül şu an **yeni sezon açma akışını bloklıyor**. Diğer her şeyden önce kapanmalı.

### B-04 · Sezon açma 6. adımda validasyona takılıyor
- **Belirti:** "Sezonu aç" butonu `"Adım 0-5 arasında olmalı."` hatası veriyor. Kullanıcı 6. (Özet) adımda sezonu açabilmeli.
- **Katman:** BE + FE · **Öncelik:** 🔴 Kritik
- **Kök neden (BE):** `SaveSeasonDraftCommandValidator.CurrentStep` kuralı `InclusiveBetween(0, 5)` — özet adımı aralık dışında kalıyor.
- ✅ **Durum:** Backend tarafı çalışma ağacında düzeltildi (`0-6` aralığı), **henüz commit edilmedi**.
- ⬜ **Kalan iş:** Adım sayısı tek yerden (enum/const) beslensin ki FE adım sayısı ile BE aralığı bir daha ayrışmasın.

### B-04a · Validasyon uyarısı ekranda doğru gösterilmiyor
- **Belirti:** BE'den dönen validasyon mesajı kullanıcıya düzgün yansımıyor; kullanıcı neden takıldığını ekrandan anlayamıyor.
- **Katman:** FE · **Öncelik:** 🟠 Yüksek
- **Not:** B-09 ile **aynı kök problem** — BE validasyon/hata mesajlarının notify katmanına taşınması. İkisi tek işte çözülmeli. -Proje Genelinde bu sorun var gibi genel bir çözüm bulunmalı yamalama kabul değil -

### B-07 · Sezon devrinde görevlendirmeler aktarılmıyor
- **Belirti:** Yeni sezon başlatılırken "Görevlendirmeler aktarılsın" seçilmesine rağmen aktarım gerçekleşmedi.
- **Katman:** BE · **Öncelik:** 🔴 Kritik
- **Kontrol edilecek:** Seçim bayrağı komuta taşınıyor mu, rollover handler'ında görevlendirme dalı var mı, tenant/sezon filtresi kaynak kayıtları eliyor mu.
- **Bağlantı:** B-05 (branşsız öğretmen) aktarımı sessizce düşürüyor olabilir.

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

### B-12 · Muafiyet eklemede 401 Unauthorized
- **Belirti:** Bölgeler & Politika sekmesinde muafiyet eklenirken 401 alınıyor. İşaretleme sorunsuz, ekleme aşamasında patlıyor.
- **Katman:** BE (yetki) · **Öncelik:** 🟠 Yüksek
- ❓ **Netleştirme gerekli:** "Sürekli işaretlendiğinde sorun yok ama sürekli eklendiğinde" ifadesi iki farklı okumaya açık — (a) *sürekli muafiyet tipi* eklenirken mi, (b) *arka arkaya defalarca* eklerken mi? Tekrar denenip hangi endpoint'in 401 döndüğü network sekmesinden alınmalı.
- **Kontrol edilecek:** Muafiyet create endpoint'inde permission attribute'u eksik/yanlış olabilir; 401 (401 ≠ 403) olması token yenileme sorununa da işaret edebilir.
- ✍️ **Cevap alanı:** [Netleştirme Bekleyenler → B-12](#b-12--muafiyet-eklemede-401-unauthorized)

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

### B-09 · Branşsız öğretmen seçilince BE mesajı bildirilmiyor
- **Belirti:** Görevlendirmelerde branşsız öğretmen seçildiğinde backend anlamlı bir mesaj dönüyor ama kullanıcıya notify edilmiyor.
- **Katman:** FE · **Öncelik:** 🟡 Orta
- **Not:** B-04a ile aynı kök problem → bkz. **X-01 · BE mesaj hattı**. Tek tek yamalanmayacak.

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
- ✅ **NETLEŞTİ — 2026-08-11.** Cevap sorulan iki seçeneğin de dışında çıktı; ikisi de yanlış çerçeveymiş:
  - **İstenen ne "haftaya yay" ne "tek güne yığ" — istenen BLOK yerleştirme.** Bir ders haftada birden çok saat alıyorsa saatler **aynı gün içinde ardışık ikili bloklar** hâlinde konmalı, bloklar da farklı günlere dağıtılmalı.
  - **Kullanıcının verdiği örnek:** *3 saat* → bir güne **ardışık 2**, başka bir güne **1**. *4 saat* → iki ayrı güne **2+2 ardışık**.
  - **Bugünkü davranış:** 3 saat → Pzt 1, Sal 1, Çar 1 (her gün tek saat, hiç blok yok). Gerçek okul programı böyle kurulmuyor.
- ➡️ **Sonuç: bu bir hedef değişikliği, hata düzeltmesi değil.** Puanlayıcıya bugün **hiç olmayan** bir boyut ekleniyor: *aynı dersin aynı gün ardışık saatlerde olması ödüllendirilir.* Mevcut "haftaya yay" boyutu kaldırılmıyor, blok boyutuyla birlikte tartılıyor — çünkü bloklar da farklı günlere dağılmalı. İki hedef çelişmiyor, **iç içe**: gün ekseninde dağıt, gün içinde blokla.
- ⬜ **Sıradaki iş:** (1) Kullanıcı gerçek bir ders programı görseli iletecek — hedef çıktı buradan birebir sabitlenecek (blok boyutu 2 mi 3 mü, hangi dersler bloklanmaz, tek saatlik dersler nereye). (2) Ondan sonra puanlayıcıya blok boyutu + strateji ağırlıkları. **Görsel gelmeden algoritmaya dokunulmayacak.**
- 🔗 **Bağlantı:** `TB-49` (müfredat saat sağlayıcısı stub) bu işin girdisini etkiler — bir dersin haftalık saatinin ne olduğu bugün yalnız elle yazılan `WeeklyHours`'tan geliyor.

### D-07 · Öğretmen görünümü mobilde bozuk
- **Belirti:** Ders Programı öğretmen görünümü mobil ekrana göre tasarlanmış ama responsive değil.
- **Katman:** FE · **Öncelik:** 🟡 Orta

### D-05 · Önizleme metriklerinde yuvarlama yok
- **Belirti:** "Tüm sınıflar için oluştur" önizleme adımında ortalama vb. alanlar ham gösteriliyor; virgülden sonra **2 hane** olacak şekilde yuvarlanmalı.
- **Katman:** FE · **Öncelik:** ⚪ Düşük
- ✅ **Kod tarafı KAPANDI** *(`oksis-ui` @ `4ff222f`, 2026-08-11)*: `avgTeacherGap` ve `preferencePercent` doğrudan basılıyordu. Yuvarlama **her ekranda tek tek değil** `packages/core/src/format/tr-number.ts` içinde tek noktada: yeni `formatTrDecimal(value, maxFractionDigits = 2)` — en fazla 2 basamak, Türkçe ondalık ayırıcı (virgül), sondaki gereksiz sıfırlar atılır. Modülün "`toLocaleString` kullanma, Hermes'te ICU garanti değil" kuralına uyuyor, yani mobil de aynı yardımcıyı kullanabilir.
- ⬜ **Ekranda doğrulanmadı:** kesirli metrik üretmek için gerçek bir otomatik program üretim koşusu gerekiyor; bu turda çalıştırılmadı. Bir sonraki turda otomatik üretim tetiklenip önizleme ekran görüntüsü alınmalı.

---

## 5. Duyurular & Bildirimler 🟠

### B-01 · Gönderim Raporu başlığı öğrenci/veliye görünüyor
- **Belirti:** Öğrenci ve Öğretmen duyuru detay ekranında "Gönderim Raporu" başlığı görünüyor.
- **Katman:** FE (+ BE kontrolü) · **Öncelik:** 🟠 Yüksek
- **Neden yüksek:** Bu yönetici bilgisi. **Sadece başlığı gizlemek yetmez** — BE'nin bu rollere gönderim raporu verisini DTO'da hiç göndermediği doğrulanmalı, yoksa network sekmesinden okunabilir kalır.

### B-06 · Duyurularda sezon filtresi yok
- **Belirti:** Duyurular ekranında sezon filtresi bulunmuyor.
- **Katman:** BE + FE · **Öncelik:** 🟡 Orta
- ⬜ **Ayrıca kontrol et:** Bildirimler ekranında da sezon filtresi var mı? Yoksa aynı iş kapsamına alınmalı.
- ✍️ **Cevap alanı:** [Netleştirme Bekleyenler → B-06](#b-06--bildirimler-ekranında-sezon-filtresi)

### D-04 · Veli Portalı duyurular ekranında gereksiz header
- **Belirti:** Header kaldırılacak.
- **Katman:** FE · **Öncelik:** ⚪ Düşük

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

---

## 8. Genel Kabuk & Navigasyon ⚪

### D-01 · Uzun okul adında logo sıkışıyor
- **Katman:** FE · **Öncelik:** ⚪ Düşük

### D-02 · Etkinlik Tanımlama modalında buton ekran dışında kalıyor
- **Belirti:** Sorumlu Öğretmenler listesi uzayınca "Etkinliği Oluştur ve İşaretle" butonu görünmez oluyor.
- **Katman:** FE · **Öncelik:** 🟡 Orta (işlem tamamlanamıyor)
- **Çözüm yönü:** Modal gövdesi scroll'lansın, aksiyon çubuğu sabit (sticky footer) kalsın. Tek modal değil, bileşen seviyesinde → **X-02**.

### D-06 · Breadcrumb tıklanabilir değil
- **Belirti:** `Akademik › Ders Programı › 10-A` yolunda ara kırılımlar tıklanamıyor.
- **Katman:** FE · **Öncelik:** ⚪ Düşük (global davranış)

---

## 9. Master Data ✅

### B-10 · "Rehberlik" branş listesinden kaldırılması
- **Karar:** Rehberlik bir branş değil → master data'dan silindi.
- ✅ **Durum:** `20260807213717_20260808_remove_counseling_subject` migration'ı + seed güncellemeleri çalışma ağacında hazır, **henüz commit edilmedi**.
- ⬜ **Kalan iş:** Mevcut tenant verisinde Rehberlik'e bağlı öğretmen/görevlendirme kaydı kalmış olabilir — migration öncesi bağımlılık taraması yapıldığı doğrulanmalı.

---

## 10. Çapraz Kesen İşler ✳️

Tek bir ekranın bulgusu değil, **proje geneline yayılmış** yapısal sorunlar. Ayrı ayrı yamalanırsa aynı hata yeni ekranlarda tekrar doğar.

### X-01 · BE mesajlarının notify hattı yok
- **Belirti:** Backend'in ürettiği validasyon/hata mesajları kullanıcıya ulaşmıyor veya bozuk ulaşıyor.
- **Görüldüğü yerler:** `B-04a` (sezon açma validasyonu), `B-09` (branşsız öğretmen uyarısı) — **muhtemelen tüm ekranlarda var.**
- **Öncelik:** 🟠 Yüksek · **Katman:** FE (+ BE hata sözleşmesi)
- 🚫 **Kısıt:** *Proje genelinde geçerli tek bir çözüm kurulacak — ekran ekran yamalama kabul değil.*
- **Çözüm yönü:** BE'de tek tip hata/validasyon yanıt sözleşmesi (`ProblemDetails` + alan bazlı hata listesi) → FE'de tek bir interceptor bu sözleşmeyi okuyup toast/inline hataya çevirsin. Ekranlar tek tek mesaj yakalamasın.
- ⬜ **Önce yapılacak:** Mevcut hata yanıtlarının biçimi envanterlensin — BE zaten tek tip mi dönüyor, yoksa sözleşme de mi dağınık? Yamasız çözüm buna göre şekillenir.

### X-02 · Uzun içerikte aksiyon butonlarının kaybolması
- **Belirti:** Modal/panel içeriği uzayınca aksiyon butonu görünür alanın dışında kalıyor.
- **Görüldüğü yer:** `D-02` (Etkinlik Tanımlama modalı) — aynı desen diğer uzun modallarda da beklenir.
- **Öncelik:** 🟡 Orta · **Katman:** FE
- **Çözüm yönü:** Modal bileşeninde gövde scroll + sticky footer'ı **varsayılan** yap; tek tek modal düzeltme yerine bileşen seviyesinde çöz.

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

### X-04 · Branş uyumu katalog kimliği yerine ad karşılaştırmasıyla hesaplanıyor
- **Belirti:** Öğretmenin branş **adı** ile dersin **adı** normalize edilip (tr-TR, boşluklar atılarak) karşılaştırılıyor. Öğretmen profilinde branş katalog kimliği dururken kullanılmıyor.
- **Görüldüğü yerler:** Görevlendirme uyumu (branş-içi / yan branş / alan-dışı) **ve** vekâlet aday sıralaması (aynı / yakın / farklı) — **iki modül aynı mekanizmayı kullanıyor.**
- **Katman:** BE · **Öncelik:** 🟡 Orta
- **Etkisi:** Ad birebir tutmadığında uyum yanlış çıkar. "Matematik" branşlı öğretmen "İleri Matematik" dersine **alan-dışı** düşer ve gereksiz gerekçe ister. Branş veya ders adının yeniden adlandırılması sessizce tüm uyum sonuçlarını değiştirir.
- 🚫 **Kısıt:** Tek tek ekran düzeltmesi değil — karşılaştırma mantığı tek noktada, kimlik üzerinden çözülmeli.

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

### X-05 · `Branch` identifier'ı iki ayrı kavramı gösteriyor
- **Belirti:** Aynı isim iki farklı şeyi, iki farklı tabloyu işaret ediyor:
  - **Ders programı modülünde** `Branch` = **şube** → `ScheduleProgram.BranchId`, `LessonPlacement.BranchId`, `ScheduleException.BranchId` hepsi `class_rooms` tablosuna gider. Uç adı bile `timetable/branches/{branchId}/weekly`.
  - **Müfredat/öğretmen tarafında** `Branch` = **branş** → `school.branches`, `TeacherProfile.BranchId`.
- **Katman:** BE · **Öncelik:** 🟠 Yüksek
- **Neden yüksek:** Sessiz veri hatası üretir. Bir `BranchId` gören geliştirici hangi tabloya join atacağını isimden bilemiyor; yanlış join derlenir, çalışır ve **yanlış sonuç döner**. Otomatik üretim solver'ı da aynı adı şube anlamında kullanıyor, dolayısıyla hata yüzeyi geniş.
- **Çözüm yönü:** Ders programı tarafında `Branch` → `ClassRoom` olarak yeniden adlandırılmalı (ya da tersi). Geçiş sırasında eski ad silinmeyip *deprecated* işaretlenmeli, yoksa iki isim yan yana daha da karıştırır.
- ⬜ **Not:** Domain haritasında iki kavram notuna da karşılıklı uyarı yazıldı; ama bu dokümantasyonla kapanacak bir şey değil, isim düzeltmesi gerekiyor.

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

### TB-07 · Eski `User` kavramının emekliliği yarım kaldı 🟠
Kullanıcı oluşturma artık kişi + davet üretiyor, ama `users` ve `persons` uçları aynı veriyi iki farklı kabukla sunmaya devam ediyor. Hangisinin kanonik olduğu belirsiz. **Etkisi:** `B-03` (bağlı profilde GUID) gibi bulgular hangi uçta düzeltileceği belli olmadan kapatılamaz.

### TB-08 · İki ayrı `InvitationStatus` enum'u 🟡
Kullanıcılar tarafında altı değerli (`Created/Sent/Opened/Accepted/Expired/Revoked`), kimlik tarafında dört değerli (`Pending/Accepted/Expired/Revoked`) iki ayrı enum var. Hangisinin yürürlükte olduğu koddan çıkmıyor. Davet akışında yanlış olanın okunması sessiz hata üretir.

### TB-09 · `RelationshipAccessLevel` enum'u ölü görünüyor ⚪
Veli yetki seviyesi (yalnız bilgi / karar / ödeme) enum'u tanımlı, ama veli-öğrenci ilişkisi bunun yerine beş ayrı bayrak kullanıyor. Enum hiçbir yerde okunmuyor.

### TB-10 · KVKK rıza kapısı hâlâ boş iskelet 🟠
Giriş akışındaki rıza kontrolü "her zaman izin ver" döndüren bir stub. **Veri işleme rızası geri çekilen kullanıcının oturumu kapanmıyor.** Rıza kaydı, geri çekme ve kanıt zinciri tam çalışıyor — eksik olan yalnızca kapının bağlanması. Mevzuat açısından en riskli açık.

### TB-11 · Rıza sürümü iki farklı tipte tutuluyor 🟡
Hesap üzerinde sayısal (`int`), rıza kaydında metin (`v2026.05.01` biçimi). İkisi aynı şeyi anlatıyorsa karşılaştırma yapılamaz; anlatmıyorsa adlandırma yanıltıcı. Yeni sürüm yayınlandığında yeniden onay istemek bu alana bağlı olacak.

### TB-12 · İki adımlı doğrulama bayrağının karşılığı yok ⚪
Hesapta `TwoFactorEnabled` alanı ve açma/kapama davranışları var, ama giriş akışında bu bayrağı okuyan bir dal görünmüyor. OTP altyapısı da "sonraki sürümde etkinleşecek" notuyla bekliyor.

### TB-13 · Uygulama katmanında beş boş modül klasörü duruyor ⚪
`Classes` klasörü var ama içinde yalnız `.gitkeep` bulunuyor; şube işlerinin tamamı `AcademicSessions` altında yaşıyor. Yeni gelen buraya bakıp kayboluyor.
- ➕ **Kapsam genişledi** *(2026-08-10)*: Aynı durumda **beş** klasör var — `Classes`, `Grades`, `Homework`, `Messaging`, `Dashboard`. Hepsi yalnız `.gitkeep` içeriyor; domain tarafında da karşılıkları yok (0 entity).
- **Etkisi:** Klasör listesi "bu modüller var" izlenimi veriyor. `Classes` yanıltıcı çünkü işlev **başka yerde** yaşıyor; diğer dördü ise **hiç yazılmamış** — ikisi çok farklı durum ama klasöre bakınca ayırt edilemiyor.
- **Çözüm yönü:** `Classes` silinsin (işlevi `AcademicSessions`'ta). Yazılmamış dördü ya silinsin ya da içine niyeti anlatan bir `README` konsun.

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

### TB-19 · Geçici muafiyet hiçbir aşamada tam uygulanmıyor 🟡
- Çizelge taslağı kaydedilirken ve otomatik sonuç uygulanırken **yalnızca sürekli** muafiyet dikkate alınıyor; geçici muafiyet bilinçli olarak dışarıda bırakılmış ("tarihe bağlı, tüketim anında uygulanır").
- Dağıtım işi ise geçici muafiyeti **yalnızca işin çalıştığı günün tarihine** göre değerlendiriyor — dönem aralığına değil. Kasımda muaf olan öğretmen, dağıtım ekimde çalıştırılırsa havuza giriyor.
- Kodun yorumu "dönem-kapsayan geçici muafiyet" diyor ama uygulama tek güne bakıyor — **niyet ile kod ayrışmış.**
- ⬜ **Doğrulanacak:** "Tüketim anında uygulanır" denen yerde gerçekten bir kontrol var mı? Bu taramada bulunamadı.

### TB-20 · Öğretmen branşı davet ve içe aktarma akışında atanmıyor 🟠
Toplu içe aktarma ve davet yolunda branş **adı** katalog kimliğine çözülmüyor; kod pilot için boş bırakılmasını kabul ediyor. Buna karşılık **branşsız öğretmene görevlendirme yapılamıyor** (sert engel).
- 🔗 **`B-05` ile aynı zincir:** "Mevcut öğretmenin branşı hiçbir yerden belirlenemiyor" bulgusunun ikinci ayağı bu. Ekran eksikliği tek başına çözüm değil — **içe aktarma ve davet yolları da branşı çözmeli**, yoksa toplu eklenen her öğretmen görevlendirilemez doğar.

### TB-21 · Öğretmen yükü sorgusu farklı izin ailesiyle korunuyor ⚪
Görevlendirme sorguları kendi izin aileleriyle korunurken, öğretmen yük özeti `users.view` istiyor. Yetki matrisinde bilinçli bir istisna mı, kopyala-yapıştır kalıntısı mı belirsiz.

### TB-27 · Ders programı durum enum'unda bayat faz notu ⚪
`ScheduleProgramStatus` açıklamasında *"Faz 1'de yalnız Taslak/Revize egzersiz edilir; Yayında Faz 2'de devreye girer"* yazıyor. Oysa yayın uçları, yayın snapshot'ı ve tüketici ekranları (öğretmen/öğrenci/veli programı) çalışır durumda. Yorum yeni geleni yanlış yönlendiriyor.

### TB-28 · Program istatistiklerinin tazeliği garanti değil 🟡
Ders programı üzerinde üç denormalize sayı taşınıyor — çakışan yerleşim sayısı, yerleştirilmemiş saat, müsaitlik ihlali. Üçünü de domain hesaplamıyor; uygulama katmanı hesaplayıp yazıyor, program yalnız saklıyor. Hub listesi bu sayıları okuyor.
- ⬜ **Doğrulanacak:** Her yerleşim/durum değişiminden sonra yeniden hesabın **gerçekten** tetiklendiği bu taramada izlenemedi. Tetiklenmeyen bir yol varsa hub listesi sessizce eski sayıyı gösterir — kullanıcı "çakışma yok" görüp yayınlar.
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

### TB-35 · Devamsızlık eşiği iki ayrı ekranda tanımlanıyor, biri hiçbir şey yapmıyor 🟠
Yönetici devamsızlık uyarı eşiğini **iki farklı yerden** girebiliyor:
- **Akademik politika** (okul ayarları) → `WarningAbsenceThreshold`, `UnexcusedAbsenceLimit`, `TotalAbsenceLimit`
- **Bildirim yapılandırması** → `AbsenceWarningThreshold`, `AbsenceCriticalThreshold`

İkincisi yazılıyor, 1-60 aralığında **doğrulanıyor**, DTO ile ekrana dönüyor — ama **hiçbir tüketicisi yok**. Devamsızlık eşik motoru yalnız akademik politikadaki alanları okuyor.
- **Etkisi:** Yönetici bildirim ekranından eşiği ayarlayıp "uyarı kuruldu" sanıyor; hiçbir uyarı tetiklenmiyor. Kullanıcıya görünen sessiz bir yalan.
- ⬜ **Karar:** Bildirim tarafındaki alanlar kaldırılsın mı, yoksa gerçek eşik oraya mı taşınsın? İkisinin bir arada kalması en kötü seçenek.

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

---

## Netleştirme Bekleyenler ❓

Bu maddeler şu haliyle iş kalemine dönüşemiyor. **Sol sütun eksik olan bilgi, sağ sütun senin cevap alanın.**
Cevabı yazdığında **Durum**'u `✅ Netleşti` yap ve aşağıdaki panoyu güncelle.

**Netleşen: 2 / 4**

| ID | Konu | Durum | Tarih |
|:--|:--|:--|:--|
| **B-02** | Nöbet/Vekalet ↔ Yoklama ilişkisi | ✅ Netleşti → **kapatıldı** (kavram karışıklığı) | 2026-08-11 |
| **B-12** | Muafiyet eklemede 401 | ⬜ Bekliyor | — |
| **B-06** | Bildirimlerde sezon filtresi | ⬜ Bekliyor *(ekrandan bakılarak cevaplanabilir, kullanıcıya sorulmasına gerek yok)* | — |
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

B-05 (branş ekranı yok)
  └─> TB-20 (davet/içe aktarma da branşı çözmüyor)   ← ikisi birlikte kapanmalı
        └─> B-09, B-14, B-07

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

**Not:** `TB-##` ve `X-##` sayaçları [[OKSİS - Yapısal Kararlar ve Eksikler]] dosyasıyla ortaktır — orada `TB-01…TB-06` ve `X-01…X-02` kullanılmış, ilk kod taraması partisi `TB-07` ve `X-03`'ten, duyurular partisi `TB-22`'den, ders programı partisi `TB-27` ve `X-05`'ten, yoklama partisi `TB-30`'dan, okul ayarları partisi `TB-34`'ten, öğrenci kayıt partisi `TB-37`'den, dosya yönetimi partisi `TB-40`'tan, bildirimler partisi `TB-43`'ten, müfredat partisi `TB-46`'dan, görevlendirme kazıma taraması `TB-48`'den devam etti, çalışma zamanı hata kaydı partisi `B-15` ve `X-06`'yı aldı, C6 dilimi kapanışı `TB-51`'i aldı, ekran testi turu `B-16`'yı aldı. **Sıradaki boş ID: `TB-52`, `X-07`, `B-17`, `ENG-02`.**

**Engel dosyaları** (`Engeller/`): bir bulguyu kapatmaya çalışırken çıkan ve kendisi ayrı bir iş olan tıkanmalar buraya ayrı belge olarak yazılır; ana maddeden `[[wikilink]]` ile adreslenir.
- [[ENG-01 - Farkli okula giris 500 veriyor]] → `B-16`

**Karara dönüşmesi gerekenler** *(bu dosyada değil, karar panosunda yaşamalı)*: `X-03` + `TB-48` (görevlendirme v1/v2 — kanoniklik cevaplandı, **onarım yönü kararı açık**), vekil uygunluğunun öğretmen müsaitlik kayıtlarına kasıtlı olarak bakmaması *(gerekçe koddan çıkmıyor)*, `B-14` netleştikten sonra çıkabilecek hedef değişikliği.
