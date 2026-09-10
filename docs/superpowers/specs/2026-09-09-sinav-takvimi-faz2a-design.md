# Sınav Takvimi Faz 2a — Oturum ve Yerleşim — Tasarım

| | |
|---|---|
| **Tarih** | 2026-09-09 |
| **Kapsam** | `oksis-api` (`Exams` modülü; Timetable ve AcademicSessions okur) · `oksis-ui` (web yönetici/öğretmen, mobil öğrenci/veli) · `oksis` (bu belge) |
| **Girdi** | 2026-09-09 beyin fırtınası oturumu (kullanıcı kararları §2) · [[2026-09-08-sinav-takvimi-modulu-design]] (üç fazın omurgası) · Faz 1 kodu (`master`, `5896d467` / `d78a513`) |
| **Durum** | Onay bekliyor |

---

## 1. Bu belge neyi değiştiriyor

Omurga spec'i ([[2026-09-08-sinav-takvimi-modulu-design]]) Faz 2'yi tek parça olarak
tarif ediyordu: oturum, derslik tahsisi, oturma planı, gözetmen havuzu ve ataması, görüş
penceresi, gözetmen yoklaması, üç yazdırma çıktısı. 2026-09-09 oturumunda iki şey oldu.

**Faz 2 ikiye bölündü** (kullanıcı kararı):

- **Faz 2a — bu belge.** Oturumun kurulması, dersliklerin türetilmesi, öğrencilerin
  serpiştirilmesi, gözetmenin türetilmesi ve oturum modunda yayın. Sonuç: kelebek takvimi
  kurulabilir, yayınlanabilir, öğrenci dersliğini ve sırasını görür.
- **Faz 2b.** Sınav gününün kendisi: kapı listesi / oturma planı / gözetmen çizelgesi
  çıktıları, gözetmen yoklaması ve Attendance bağı, görüş penceresi.

Ayrım şu gerekçeyle: 2a kendi başına çalışan yazılım üretir; 2b farklı kullanıcıya
(gözetmen), farklı ekrana ve başka bir modülün (Attendance) yazma komutuna dokunur. Riskli
kısım, omurga oturduktan sonra ve kendi gözden geçirmesiyle yapılır.

**Omurga spec'inin üç kararı geçersizleşti.** Aşağıda §2'de tek tek gerekçesiyle
yazılıdır: K-5 (oturumu yalnız yönetici kurar), K-7 (şube ardışık dilimlere bölünür) ve
EX-H04 (kapasite sert kural). Omurga belgesi tarihsel kayıt olarak yerinde bırakılır;
**çelişki hâlinde bu belge geçerlidir.**

---

## 2. Kilitlenmiş kararlar (2026-09-09)

| # | Karar | Gerekçe |
|---|---|---|
| K-14 | **Oturum = tek ders, çok şube.** Bir oturumda yalnız bir dersin sınavı yapılır; 9. sınıf matematik ile 10. sınıf fizik aynı oturumda olamaz. Oturumda iki seviye görünmesinin sebebi bir öğretmenin iki seviyeye girmesidir | Kullanıcı kararı. Bir dersliğe iki farklı kağıt düşerse gözetmen iki sınav yönetir |
| K-15 | **Oturumun sahibi yok.** Sorumlu öğretmen(ler) içindeki `ScheduledExam` satırlarının sahiplerinden türer | Üç öğretmenin oturumu birleşince üç sorumlu kendiliğinden çıkar; birleştirme için alan taşımak gerekmez |
| K-16 | **Oturumu hem öğretmen hem yönetici açar.** ~~K-5: yalnız yönetici~~ | Kullanıcı kararı: "genelde kelebeği yönetim hazırlar ama öğretmenlerin de oturum açabilmesini istiyorum" |
| K-17 | **Oturumun saati serbest.** Sahibin kendi ders saati olmak zorunda değil; EX-H03 oturum modunda uygulanmaz | Kullanıcı kararı. Kendi saatini seçerse sınıfında gözetmen olur, başka saati seçerse dolaşır |
| K-18 | **Derslikler seçilmez, türetilir:** giren şubelerin kendi sınıfları (`ClassRoom.RoomId`). Yönetici sonradan ekleyip çıkarabilir | Kullanıcı kararı: "boş derslik olmasına gerek yok; o sınıflarda hangi ders olduğundan bağımsız o sınıflar oturum için kullanılır" |
| K-19 | **Gözetmen atanmaz, türetilir:** o gün o saatte o şubeye dersi olan öğretmen, dersini anlatmak yerine kendi girdiği sınıfta gözetmenlik yapar | Kullanıcı kararı: "boşa çıkartıp tekrar dağıtmanın anlamı yok". Gözetmen havuzu, atama ekranı ve EX-S03 yük dengesi kuralı bu kararla gereksizleşti |
| K-20 | **Türetmenin delikleri elle doldurulur**, ama gözetmensiz derslik kalırsa **takvim yayınlanmaz** | Kullanıcı kararı (elle doldurma) + kapı olmadan kural yalnız kırmızı bir rozete dönüşür |
| K-21 | **Serpiştirme dönüşümlü**, ardışık dilimleme değil. ~~K-7: tahsis birimi "şubeden N öğrenci"~~ | Kullanıcı kararı. Dilimlemede on beş kişi hâlâ kendi şubesiyle yan yana oturuyordu |
| K-22 | **Oturum tek ders saatidir**, alternatifi yok | Kullanıcı kararı. `StartPeriod`/`EndPeriod` yerine tek `Period`; sınav ortasında gözetmen değişimi sorunu doğmaz |
| K-23 | **Kapasite aşımı sert kural değil**, renkle gösterilir ve yayını engellemez. ~~EX-H04~~ → EX-S06 | Kullanıcı kararı: "kapasite aşımı sadece renk ile gösterilsin, çok önemli değil" |
| K-24 | **Derslik müsaitliği MVP dışı.** Her derslik her zaman kullanılabilir sayılır | Kullanıcı kararı. Tadilat/kapalı derslik kavramı sistemde yok |
| K-25 | **Derslik başına tek gözetmen** | Türetme zaten tek isim verir; ikinci gözetmen `ExamRoom`'u bire-çok bir tabloya çevirir, bugün karşılığı olmayan bir maliyet |
| K-26 | **Şubenin dersliğinin zorunlu olması ayrı iştir** — `TB-120` olarak deftere yazıldı, sınav takvimi bitince kendi turunda ele alınır | Kullanıcı kararı. 2a bu kapanana kadar eksik derslik için elle eklemeyi köprü olarak kullanır |

---

## 3. Alan modeli

Tüm entity'ler `TenantEntity`; global filtre ve `TenantSaveChangesInterceptor` geçerlidir.
Domain'de EF/DataAnnotations yok; yapılandırma `Infrastructure/Persistence/Configurations/Exams/`.

Omurga spec'i beş yeni varlık öngörüyordu. **İkisi düştü:**

- **`RoomAllocationGroup`** ("9-A'nın numara sırasıyla 1..15'i") — K-21 ile ardışık dilim
  kavramı ortadan kalktı. Bir dersliğe hangi öğrencinin düştüğünü doğrudan `ExamSeat` taşır.
- **`Invigilation`** — K-19 ve K-25 ile gözetmen, dersliğin bir alanına indi.

### 3.1 ExamSession — Oturum

`ExamWindowId`, `SubjectId`, `Date`, `Period`, `CreatedByPersonId`, `Version`.

Tek ders (K-14), tek ders saati (K-22), sahipsiz (K-15). `Version` yayın sonrası
değişiklikleri sayar; Faz 1'in `ExamWindow.Version` kalıbıyla aynı.

### 3.2 ScheduledExam — Faz 1'in satırı, bir alan eklenir

`ExamSessionId?` (nullable). Ders saati modundaki satırlarda boştur. Oturum modunda satırı
çatısına bağlar.

Faz 1'in bütün mantığı — yerleştirme, taşıma, sayaçlar, `ExamExpectationReader`, hatırlatma
sweep'i — bu alandan habersiz çalışmaya devam eder. Faz 2a hiçbir Faz 1 davranışını
değiştirmez, yalnız üstüne katman ekler.

### 3.3 ExamRoom — Oturumun bir dersliği

`ExamSessionId`, `RoomId`, `InvigilatorTeacherId?`, `InvigilatorSource?`, `IsManuallyAdded`, `IsExcluded`.

- `InvigilatorTeacherId` **boş olabilir** — delik demektir; sunucu bunu **EX-H10** sert
  ihlali olarak döndürür ve yayını engeller (K-20). Ekran kendi hesaplamaz.
- `InvigilatorSource` (`Derived` | `Manual`): elle yazılan gözetmenin üzerine yeniden
  türetme yazmaz.
- `IsManuallyAdded`: yöneticinin eklediği dersliği (konferans salonu) giren şubelerin
  kendi sınıflarından ayırır — üyelik değişince türetme onu silmez.
- `IsExcluded`: yöneticinin çıkardığı derslik silinmez, işaretlenir; yeniden türetme
  onu görür ve atlar. Dördüncü bir tablo açmamanın sebebi budur — dışlama, dersliğin
  kendi hâlidir.

Kapasite kopyalanmaz; kural denetiminde `Room.Capacity` okunur (omurga spec'i §3.5 ile aynı
gerekçe).

### 3.4 ExamSeat — Kim nerede oturuyor

`ExamRoomId`, `StudentPersonId`, `SeatNo`, `IsManuallySwapped`.

`SeatNo` derslik içinde 1'den başlayan **düz** numaradır. Dersliğin sıra × sütun düzeni
modellenmez — `Room` bugün yalnız `Capacity` taşır ve oturma planı çıktısı sabit genişlikte
bir ızgaraya dökülür. Sınırı §5'te açıkça yazılıdır.

---

## 4. İş akışları

### 4.1 Pencere

Faz 1'in `CreateExamWindow` komutu `Mode = Session` ile açılır; `PublishWindow` (hafta
duyurusu) aynen çalışır.

Faz 1'in koyduğu kapı **pencere oluşturmadadır, yayında değil**: bugün
`CreateExamWindowCommandHandler` oturum modunu reddediyor ("Oturum modu henüz
kullanılamıyor"). Faz 2a bu dalı kaldırır. Ayrıca `ExamMode` enum yorumu "pencere
oluşturulabilir ama yayınlanamaz" diyerek yanılıyor; o da düzeltilir.
*(2026-09-09 ön uçuş taramasında koddan ölçüldü.)*

### 4.2 Oturum iki yoldan doğar

**Öğretmenden.** Faz 1'in yerleştirme ekranı. Öğretmen gün ve saat seçer — oturum modunda
saat serbesttir (K-17). Sistem o öğretmenin o dersteki bütün şube × ders çiftlerini
`ExamExpectationReader`'dan bulur, her biri için `ScheduledExam` yazar ve bir `ExamSession`
doğurur. Varsayılan bütün şubeleridir; öğretmen bir şubeyi işaretten çıkarıp başka güne
bırakabilir.

**Yöneticiden.** Panodan "oturum aç": tarih, saat, ders. Sonra beklenti listesinden çiftler
eklenir; toplu seçenekler var ("9. sınıf matematiğin tamamı", "Ahmet'in matematik şubeleri").

İkisi aynı `ExamSession` satırını üretir; sonrasında ayrım kalmaz.

**Saat isteği oturum modunda yoktur.** `HourRequest`, sınavın başkasının dersini ödünç
aldığı ders saati modunun kurumudur. Saat serbest seçildiğinden (K-17) ödünç alma kavramı
düşer: öğretmene bu ekran gösterilmez, yayın kapısındaki "bekleyen istek yok" koşulu oturum
modunda boş geçer.

### 4.3 Türetme

Üyelik her değiştiğinde (şube eklendi, çıkarıldı, oturum birleşti, öğrenci nakil geldi/gitti)
üçü birden yeniden hesaplanır:

| Ne | Kaynak |
|---|---|
| Derslikler | Giren şubelerin `ClassRoom.RoomId`'leri; artı `IsManuallyAdded` olanlar, eksi yöneticinin çıkardıkları |
| Gözetmen | Canlı programın (`IsActive && IsReserving`) o gün, o saat, o şubedeki `LessonPlacement.TeacherId`'si |
| Yerleşim | §4.4 |

Elle yapılan müdahaleler korunur (`IsManuallyAdded`, `InvigilatorSource = Manual`).
**Sıra takasları korunmaz:** öğrenci kümesi değişince eski takas anlamsızlaşır; yeniden
üretim uyarı verir ve `IsManuallySwapped` satırları temizlenir.

**`ClassRoom.RoomId` boşsa** o şube için derslik türetilemez; oturum "derslik eksik" uyarısı
verir ve yönetici elle ekler. Bu bir köprüdür, kalıcı çözüm `TB-120`'dedir (K-26).

**Oturumun ömrü.** `ExamSession`, ilk `ScheduledExam` bağlandığında doğar; son satırı da
çıkarıldığında **silinir** (`ExamRoom` ve `ExamSeat` ile birlikte) — pencere yayınlanmış
olsun ya da olmasın.

Yayınlanmış pencerede fark **silinip silinmemesi değil, silmenin nasıl olduğudur**: gerekçe
zorunludur, `ExamWindowRevision` satırı yazılır ve etkilenen öğrenci/veliye bildirim gider.
Silme sessiz olamaz.

*(2026-09-09 kararı R30 — ilk yazımda bu paragraf "silme değil `Revise` konusudur" diyordu
ve iki türlü okunabiliyordu. Boş kabuğun ayakta bırakılması reddedildi: şubesi çıkan
öğrencinin sınavı zaten yerleşmemişe döndüğü için takviminden düşer, ama panoda **sahipsiz**
bir oturum kartı kalır — K-15 gereği sorumlu öğretmen de bağlı satırlardan türediği için —
ve bestekârın "aktif derslik yok" uyarısı onu düzeltilmeyi bekleyen bir kusur gibi gösterir.
Kimlik ve tarihçe kaygısı soft-delete ile revizyon satırlarından zaten karşılanıyor.)*

### 4.4 Yerleşim algoritması

Düz dönüşümlü dağıtım (`A1 B1 C1 A2 B2 C2 …`) şubeler eşit boyda olmadığında bozulur:
9-A 30, 9-B 28, 9-C 32 kişiyse listenin kuyruğunda arka arkaya yirmi iki tane 9-C kalır ve
son derslikte karışım hiç olmaz.

**Oransal serpiştirme.** Her öğrenciye şubesi içindeki sırasına göre bir konum anahtarı
verilir:

```
anahtar = (şube içindeki sıra + 0,5) / şubenin mevcudu
```

Bütün öğrenciler bu anahtara göre sıralanır. Her şube, mevcudu ne olursa olsun dizinin
tamamına eşit aralıklarla yayılır; kuyrukta yığılma olmaz. Eşit mevcutlu şubelerde sonuç
düz dönüşümlü dağıtımla birebir aynıdır.

- Şube içi sıra: **okul numarası**.
- Şubeler arası öncelik: **şube adı** (9-A, 9-B, …).

İkisi de sabit olduğu için algoritma **belirlenimcidir** — aynı girdi hep aynı yerleşimi
verir. Bu bir gereksinimdir: yerleşim yeniden üretildiğinde bütün okul yer değiştirmemeli,
yalnız değişen kısım oynamalıdır.

**Dersliklere bölme.** Sıralı liste dilim dilim dersliklere dağıtılır. Dersliğin payı
kapasitesiyle orantılıdır:

```
pay(i) = yuvarla( toplam öğrenci × kapasite(i) / toplam kapasite )
```

Yuvarlamadan artan öğrenciler, kapasitesine oranla en az yüklenmiş dersliklere birer birer
dağıtılır. Derslik sırası şube adına göredir; elle eklenen derslikler sona gelir.

Bu formül **kapasiteyi aşan hâli de kapsar**: toplam mevcut toplam kapasitenin üstündeyse
her derslik oransal olarak aşar, fazlalık tek dersliğe yığılmaz. Yerleşim yine tamamlanır;
aşan derslikler EX-S06 ile kırmızı görünür (K-23).

### 4.5 Yönetici denetler

Panodaki işler: gözetmen deliklerini doldurmak, derslik eklemek/çıkarmak, sıra takası,
yerleşimi yeniden üretmek, ve **oturum birleştirmek** — aynı tarih, saat ve dersteki iki
oturumu tek oturumda toplamak. Birleşince derslikler birleşir ve yerleşim bütün havuz
üzerinden yeniden üretilir; üç matematik öğretmeninin öğrencileri gerçekten karışır.

### 4.6 Yayın ve sonrası

Faz 1'in `PublishSchedule` komutu, oturum modunda §6'daki ek kapılarla. Yayın sonrası
değişiklik yine Faz 1'in mekanizmasıdır: `Revise(reason)`, `Version++`,
`ExamWindowRevision` satırı, bildirim yalnız etkilenenlere — bir öğrencinin dersliği veya
sırası değiştiyse etkilenen odur.

---

## 5. Bilinen sınır: fiziksel düzen modellenmiyor

Düz sıra numarası dersliğin sıra × sütun düzenini bilmez. Üç şube giren bir oturumda sıralar
`A B C A B C …` diye gider; sınıfta üç sütun varsa her sütun tek şubeye denk gelebilir ve
öğrencinin **arkasındaki** kişi kendi şubesinden çıkar. Yanı her zaman farklıdır, arkası
bazen aynıdır.

Çözümü dersliğin sıra × sütun düzenini modellemekten geçer. Faz 2b'de oturma planı çıktısı
tasarlanırken ızgara diziliminde kısmen giderilebilir. **Faz 2a bunu bilinen sınır olarak
kabul eder**; kullanıcı 2026-09-09'da bilgilendirildi.

---

## 6. Kural denetleyicisi

Kurallar entity'de değil `ExamRuleInspector`'da yaşar (omurga spec'i §3.8). Faz 2a
tablosu — değişenler kalın:

| Kod | Tür | Kural | Faz 1'e göre |
|---|---|---|---|
| EX-H01 | Sert | Şubeye aynı gün en çok 2 sınav | Aynen |
| EX-H02 | Sert | Şube × ders pencere içinde tek sınav | Aynen |
| EX-H03 | Sert | Seçilen saat sahibin o şubedeki dersi olmalı | **Yalnız ders saati modunda** (K-17) |
| ~~EX-H04~~ | — | ~~Derslik kapasitesi aşılamaz~~ | **Kaldırıldı** → EX-S06 (K-23) |
| EX-H05 | Sert | Öğrenci aynı gün ve saatte tek oturumda, tek derslikte, tek sırada | Netleşti |
| EX-H06 | Sert | Bir öğretmen aynı gün ve saatte tek derslikte gözetmen | Türetme bunu üretemez; **elle doldurmada ısırır** |
| EX-H07 | Sert | Aynı dönemde pencere çakışması | **Oturum yarısı çıkarıldı** |
| **EX-H11** | Sert | Bir derslik aynı gün ve saatte tek oturuma ait | **Yeni** |

**Neden EX-H09 değil (2026-09-09 kararı R34).** Bu belgenin ilk yazımında kural `EX-H09`
diye numaralandırılmıştı; **o kod Faz 1'de zaten kullanımda** — `ExamRuleInspector` onu
"bekleyen saat isteği var, yayın öncesi karara bağlanmalı" için yayıyor ve
`PublishExamScheduleCommandHandler` onu geçilemez sayıyor. Omurga spec'i o kurala kod
vermemişti, Faz 1 uygularken kendi verdi; ben de aynı kodu ikinci kez dağıttım.
Derslik çakışması **EX-H11**'dir. `EX-H10` gözetmensiz dersliktir.

**Kural `ExamRoom` satırları üzerinden yazılır**, "elle eklenmiş dersliği özel kapsa" diye
değil: `ClassRoom.RoomId`'de benzersiz dizin yoktur, yani iki şube ev dersliğini paylaşabilir
ve **türetilmiş derslikler de çakışabilir**. Yüklem `!IsExcluded` süzmelidir — çıkarılmış
satır oturumun aktif kümesinde değildir ve sayılırsa yanlış pozitif üretir.
| **EX-H10** | Sert | Dersliğin gözetmeni yok | **Yeni** (2026-09-09 tasarım incelemesi) |
| EX-H08 | Sert | Takvim yayını ilk sınava ≥ N gün — gerekçeyle geçilir | Aynen |
| EX-S01 | Yumuşak | Aynı şubeye art arda iki gün sınav | Aynen |
| ~~EX-S02~~ | — | ~~Dersin öğretmeni kendi öğrencisinin dersliğinde gözetmen~~ | **Kaldırıldı** |
| ~~EX-S03~~ | — | ~~Gözetmen yükü dengesizliği~~ | **Kaldırıldı** (K-19) |
| EX-S04 | Yumuşak | Bir dersliğe tek şubeden öğrenci düştü | Seviye değil **şube** ölçülür |
| EX-S05 | Yumuşak | Yerleşmemiş şube × ders varken yayın | Aynen |
| **EX-S06** | Yumuşak | Derslikte kapasite aşıldı | **Yeni** (K-23) |

**Omurga spec'inin "aynı tarihte oturumlar ders saati olarak çakışamaz" kuralı yanlıştı.**
Ahmet'in matematiği ile Ayşe'nin Türkçesi salı 2. derste yan yana durabilir. Çakışamayan
oturum değil, üç kaynaktır: aynı derslik (EX-H11), aynı öğrenci (EX-H05), aynı gözetmen
(EX-H06).

**EX-S02 neden kaldırıldı:** sahip öğretmen kendi ders saatini seçtiğinde kendi sınıfında
gözetmen olur ve kullanıcı bunu istemektedir (K-19). Kural yerinde kalsaydı sistem her doğru
kurulumda uyarı basardı; susturulmayı öğrenilen uyarı, uyarı olmaktan çıkar.

### Oturum modunda yayın kapısı

Faz 1'in koşullarına (`ExamRuleInspector.CheckPublishAsync`) ek olarak:

- Her `ExamRoom`'un gözetmeni var (K-20) — eksikse EX-H10.
- Oturumdaki her öğrenci bir `ExamSeat`'e oturmuş — yerleşim üretilmiş ve eksiksiz.
- EX-H11 ve EX-H05 ihlali yok.

EX-S06 (kapasite) ve EX-S04 (karışmamış derslik) yayını **engellemez**, panoda görünür.

---

## 7. Yetkiler

Omurga spec'i §6'nın anahtarları geçerlidir; Faz 2a **yeni izin açmaz**. Eşleme:

| Eylem | Anahtar |
|---|---|
| Yönetici oturum açar, birleştir, derslik ekle/çıkar, gözetmen doldur/değiştir, sıra takas, yerleşimi yeniden üret | `exams.manage` |
| Öğretmen yerleştirir (oturumu doğuran hâli dahil) | `exams.place` |
| Öğrenci/veli kendi dersliği ve sırası | `exams.read` |

**Anahtarlar koddan ölçüldü (2026-09-09, Görev 3.1).** Bu belgenin ilk yazımında omurga
spec'inden `exams.window.manage` / `exams.exam.place` / `exams.read.self` diye alınmıştı;
**üçü de depoda yok.** Gerçek katalog dört anahtar taşır: `exams.manage` ("pencere kur,
yayınla, revize et, kilitle"), `exams.place`, `exams.read`, `exams.report`. Var olmayan bir
slug yazmak `RequirePermissionSeedCoverageTests`'i kırmızıya düşürür.

Öğretmenin yerleştirmesi bir oturum doğuruyor olsa da yeni bir yetki gerektirmez: doğan
şey kendi sınavının organizasyonudur, başkasının sınavına dokunmaz. Yöneticinin denetim
eylemlerinin tamamı `exams.window.manage` altındadır — Faz 1'de pencere yayınını ve kilidi
taşıyan anahtar.

Gözetmen olarak türetilen öğretmene Faz 2a'da **yazma yetkisi verilmez**; gözetmenin yazdığı
tek şey yoklamadır ve o Faz 2b'nin konusudur.

---

## 8. Okuma yüzleri

| Yüz | Değişim |
|---|---|
| **Öğretmen yerleştirme** (Faz 1) | Oturum modunda saat seçimi kendi programıyla sınırlı değil; yerleştirdiği anda o dersteki bütün şubeleri işaretli gelir. Kaydettikten sonra sonucu görür: "Oturum kuruldu — 3 şube, 3 derslik, 90 öğrenci, 1 gözetmen eksik" |
| **Yönetici panosu** (Faz 1) | Oturum görünümü eklenir: gün × ders saati ızgarasında oturumlar; ders adı, şube/öğrenci sayısı, gözetmen deliği sayısı, uyarı rozetleri |
| **Oturum ayrıntısı** | **Yeni ekran.** Derslik listesi (ad, gözetmen + kaynağı, mevcut/kapasite, şube dağılımı) ve sıra listesi. Eylemler: gözetmen doldur/değiştir, derslik ekle/çıkar, sıra takas, yerleşimi yeniden üret, oturum birleştir |
| **Öğrenci / veli takvimi** (Faz 1) | Derslik ve sıra alanları dolar. Faz 1'in `roomName: null` boşluğu burada kapanır |
| **Öğretmen kendi takvimi** (Faz 1) | Kendi sınavlarının yanına gözetmenlik satırları girer |
| **Ders programı etiketi** (Faz 1) | Öğrencinin hücresi **sınavın dersinin** rengini alır (o saatteki normal dersin değil) — o saat yapacağı iş sınavdır. Öğretmen tarafında aynı hücre "gözetmen" olarak görünür |

Ders rengi yine sunucuya alınmaz; K-13 (deterministik `subjectColorIndex` paleti) geçerlidir.

---

## 9. Bildirimler

Yeni tür yok. Faz 1'de tanımlı olanların davranışı:

| Kind | Faz 2a'da |
|---|---|
| `ExamSchedulePublished` | İçerik derslik ve sıra ile zenginleşir |
| `ExamMoved` | Derslik/sıra değişimi de "taşıma" sayılır; yalnız etkilenen öğrenciye gider |
| `ExamInvigilationChanged` | **Devreye girer** — yayından sonra gözetmen değişirse o kişiye gider |
| `ExamReviewOpened` | Faz 2b |

---

## 10. Test stratejisi

Faz 1'in kalıbı sürer: birim testler `ExamRuleInspector` ve yerleşim algoritmasını
sözleşme düzeyinde ölçer; **kural ve yerleşim en az bir kere gerçek SQL'de** doğrulanır
(Testcontainers MSSQL). Gerekçe kayıtlıdır: `MockQueryable` çeviri hatalarına kördür ve bu
desen üç kez ısırmıştır (`B-15`, `X-07`, `X-04`).

Bu fazda **zorunlu** entegrasyon testleri:

- Türetme ile `AsNoTracking` etkileşimi — Faz 1'de `MarkMoved()` sessizce yazmamıştı
  ([[asnotracking-join-ile-yayilir]]).
- Yerleşimin belirlenimciliği: aynı girdiyle iki kez üretim, birebir aynı `SeatNo` dizisi.
- EX-H11 / EX-H05 / EX-H06 — üçü de çoklu tablo JOIN'i üzerinden ölçülür.
- Yayın kapısı: gözetmensiz derslik ve eksik yerleşim ayrı ayrı yayını engelliyor mu.

Günlük döngü `./scripts/test-changed.sh`; entegrasyon yalnız `--integration`.

---

## 11. Kapsam dışı

**Faz 2b'ye:** kapı listesi / oturma planı / gözetmen çizelgesi çıktıları · gözetmen
yoklaması ve Attendance bağı · görüş penceresi (`ExamWindow.OpenReview` Faz 1'de yazıldı,
hâlâ çağrılmıyor) ve `ExamReviewOpened`.

**Faz 3'e:** derslik ve gözetmeni kurallara göre öneren otomatik dağıtıcı.

**Hiç yapılmayacak (bu fazda):** derslik müsaitliği/tadilat kavramı (K-24) · derslik başına
ikinci gözetmen (K-25) · dersliğin sıra × sütun düzeni (§5) · şube dersliğinin zorunlu
kılınması (K-26, `TB-120`).

---

## 12. Faz 2b’ye devreden açık nokta

`AttendanceSession` bir `PlacementId` ve **tek** bir `ActualTakerId` taşır. Kelebekte 9-A üç
ayrı dersliğe bölünür ve üç ayrı gözetmen tarafından işaretlenir — yani tek şubenin tek
yoklama oturumuna üç kişi yazar. `AttendanceRecord.MarkedBy` kayıt bazında olduğu için veri
modeli bunu taşıyabilir, ama oturumun "kim aldı" alanı ve `SubmitAttendance` teslim akışı tek
kişi varsayar.

Omurga spec'i §5.4 bu çakışmayı görmemişti. Faz 2b'nin ilk karar noktasıdır.
