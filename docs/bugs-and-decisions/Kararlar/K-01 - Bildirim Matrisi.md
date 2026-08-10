# K-01 · Bildirim Matrisi — Karar Belgesi

> **Durum:** ✅ Karara bağlandı
> **Tarih:** 2026-08-08
> **Karar veren:** Faruk Kaya
> **Ana dosya:** [[OKSİS - Yapısal Kararlar ve Eksikler]]
> **Ön koşul:** [[K-02 - OS Push Altyapısı]] — kanal ekseni buna dayanıyor
> **Kapsam:** `K-01a` Nöbet & Vekalet · `K-01b` Ders Programı · `K-01c` Sezon Yönetimi

---

## 1. Neden tek belge

Orijinal listede üç ayrı madde (4, 5, 7) olarak duruyorlardı. Üçü de aynı sorunun aynı şekli: *kim, neyi, ne zaman öğrenir?* Ayrı ayrı karar verilirse üç farklı bildirim davranışı doğar — kullanıcı aynı üründe üç farklı ton görür. Bu yüzden üçü tek matris mantığıyla, **tek bir alıcı kuralı** altında dolduruldu.

K-02 çözülene kadar kanal ekseni boştu. Artık dolu: push kararı verildi, Android hattı bugün yazılabilir durumda.

---

## 2. Ortak omurga

Üç tabloyu da tutarlı kılan dört kural. Yeni bir olay eklendiğinde de bunlar uygulanır.

### O1 — Alıcı roldür değil, **etkilenen kişidir**

> [!important] Matrisin tek en önemli kuralı
> "Öğretmenlere gider" demek yerine "**bu atamanın iki tarafına** gider" denir. Rol bazlı yayın, ilgisiz kişiye giden her bildirimle bildirim değerini düşürür — kullanıcı bir süre sonra hepsini kapatır.

Pratikte: nöbette **atamanın iki tarafı** (nöbetçi + yancı), programda **dersin öğretmeni + o sınıfın veli/öğrencisi**, sezonda **neredeyse yalnız yönetici**.

### O2 — In-app her zaman, push seçilerek

Her satır in-app bildirim üretir; in-app kayıt aynı zamanda denetim izidir. Push yalnızca **kaçırılmaması gereken** satırlarda açılır.

> [!note] `In-app + Push` ne demek
> Push bugün **yalnız Android'de** çalışır. iOS, K-02'nin Parti 3'üne (Apple Developer hesabı) bağlı. Matris bu ayrımı satır satır tekrarlamaz — global kısıt olarak burada durur.

### O3 — Anlık mı özet mi: **aksiyon gerektiriyor mu?**

Kullanıcının bir şey *yapması* gerekiyorsa (yarın nöbet tutacak, çocuğunu erken alacak) anlık. Yalnızca *bilmesi* yetiyorsa özet.

### O4 — Sessiz saat varsayılan olarak geçerli

K-02 sessiz saat kapısını (`QuietHours*` + `School.TimeZone`) gönderim yoluna koyuyor: kritik olmayan push sabah 07:00'ye ertelenir, **in-app satırı her hâlükârda anında yazılır**.

K-01'in duruşu: **bu matriste sessiz saati delen satır sayısı ikidir** (aşağıda işaretli). Gerisi ertelenir. Bu, K-02'nin açık bıraktığı `S-6` öncelik sorusunun K-01 kapsamındaki cevabıdır — ayrı bir öncelik sözlüğü tanımlanmaz, satır bazında "deler / delmez" yeter.

---

## 3. Matrise eklenen olay: yancı ataması

> [!danger] Kodda var, matriste yoktu
> Yancılık `SchoolSettings.DutiesRelieverEnabled` ile açılıp kapanan bir okul ayarı. Açıkken bir nöbet ataması `(öğretmen × gün × **bölge**)` üçlüsüne ikinci bir öğretmen bağlıyor — ama bu kişiye bugün **hiçbir bildirim gitmiyor.**

Üç somut boşluk:

| Bulgu | Konum |
|:--|:--|
| `DutyRosterPublishedEvent` alıcı listesi yalnız `a.TeacherId` taşıyor — **`RelieverId` listede yok** | `DutyRoster.cs:107` |
| `AssignReliever()` hiçbir domain event üretmiyor | `DutyRoster.cs:73-85` |
| `ClearReliever()` hiçbir domain event üretmiyor | `DutyRoster.cs:87-93` |

**Sonuç:** Çizelge yayınlandığında yancı olan öğretmen, yancı olduğunu uygulamada göremiyor. Nöbet günü geldiğinde ya kendisi fark edecek ya da nöbetçi arayacak.

**Karar:** Yancı olayı K-01a'da **kendi satırını alır** — "nöbet ataması değişti" satırına gömülmez. Gerekçesi üç katlı: farklı alıcı (yancının kendisi), farklı yük (**hangi gün + hangi bölge**), ve tek koşullu satır oluşu (ayar kapalıyken hiç üretilmemeli). Gömülen bir kural görünmez olur, görünmez kural uygulanmaz.

> [!important] Bildirim gövdesi bölge adını taşımak zorundadır
> "Yancı olarak atandınız" yetersiz. Atama tanımı gereği bölgeli: **"Pazartesi · A Blok 2. Kat yancılığı"**. Bölgesiz bildirim öğretmeni ekrana bakmaya zorlar — bildirimin varlık sebebini ortadan kaldırır.

---

## 4. K-01a · Nöbet & Vekalet

| Olay | Kime | Kanal | Zamanlama |
|:--|:--|:--|:--|
| Çizelge yayınlandı | Çizelgede yer alan **tüm** öğretmenler — nöbetçiler **ve yancılar** | In-app + Push | Anlık |
| Nöbet ataması değişti | Yalnız etkilenen öğretmen: atamadan **çıkan** + atamaya **giren** | In-app + Push | Anlık |
| **Yancı ataması yapıldı / değişti / kaldırıldı** *(koşullu)* | Yancı atanan öğretmen — **gün + bölge** ile. Değişiklik/kaldırmada **eski yancı** da. Eşleştiği nöbetçiye bilgi amaçlı. | In-app + Push | Anlık |
| Vekalet atandı | Vekalet eden öğretmen (gün + bölge) + yerine geçilen nöbetçi | In-app + Push | Anlık · **sessiz saati deler** |
| Vekalet iptal edildi | Vekalet eden öğretmen + asıl nöbetçi | In-app | Anlık |
| Muafiyet onaylandı | Talep eden öğretmen | In-app | Anlık |
| Muafiyet reddedildi | Talep eden öğretmen — **red gerekçesiyle birlikte** | In-app | Anlık |
| Nöbet günü hatırlatması | Ertesi günün nöbetçisi + *(ayar açıksa)* yancısı | In-app + Push | **Nöbetten bir gün önce 17:00** |

**Notlar**

- **Veli ve öğrenci bu tablonun hiçbir satırını almaz.** Nöbet iç işleyiştir; veliye "öğretmen X bugün bahçe nöbetçisi" bilgisinin hiçbir kullanımı yok.
- Yancı satırı `DutiesRelieverEnabled` kapalıyken **hiç üretilmez** — kapalı bir özellik hakkında bildirim, kullanıcının bilmediği bir kavramı ona anlatmaya çalışır.
- Yancı ve vekalet bildirimlerinin gövdesi **bölge adını** içerir.
- **Hatırlatma neden bir gün önce akşam:** öğretmene planlama şansı bırakır. Nöbet sabahı gönderilen hatırlatma bilgi değil, telaş üretir.
- **Sessiz saati delen tek satır "vekalet atandı":** 22:30'da ertesi sabahın nöbeti için vekalet verildiyse, öğretmenin bunu 07:00'de değil o anda öğrenmesi gerekir — 07:00'de öğrenmek çoğu durumda geç.

> [!warning] ⚠️ Ön koşul — `B-13`
> Muafiyetli öğretmene nöbet atanabiliyorken bu satırların **hiçbiri** canlıya alınamaz. Yanlış çizelge üzerine kurulan her bildirim, hatayı düzeltmek yerine yayar.

**Kodda mevcut durum**

| Satır | Durum |
|:--|:--|
| Çizelge yayınlandı | ✅ `NotificationKind.DutyRosterPublished` + handler var — **ama alıcı listesine yancı eklenmeli** |
| Nöbet ataması değişti | ⚠️ `DutyAssignmentChangedEvent` üretiliyor, **bildirim handler'ı yok** |
| Yancı ataması | ❌ Olay da yok, kind da yok, handler da yok |
| Muafiyet onay/red | ⚠️ `DutyExemptionChangedEvent` üretiliyor, **bildirim handler'ı yok** |
| Nöbet günü hatırlatması | ❌ Yok — zamanlanmış Hangfire job'u gerekir |

---

## 5. K-01b · Ders Programı

| Olay | Kime | Kanal | Zamanlama |
|:--|:--|:--|:--|
| Program yayınlandı | Programı etkilenen öğretmenler + o sınıfların veli ve öğrencileri | In-app + Push | Anlık |
| Program revize edildi | Yalnız etkilenen öğretmen + etkilenen sınıfın veli/öğrencisi | In-app | **Gün sonu özet** |
| Tek ders değişti *(saat/derslik)* | Dersin öğretmeni + o sınıfın veli/öğrencisi | In-app | **Gün sonu özet** |
| Ders iptal edildi | Dersin öğretmeni + o sınıfın veli/öğrencisi | In-app + Push | Anlık · **sessiz saati deler** |

**Notlar**

- **"Gün sonu özet" ne demek:** o gün biriken değişiklikler tek bildirimde toplanır — *"Programında 3 değişiklik var"* — tek tek gönderilmez. Bağlam sütununun uyardığı gürültünün cevabı bu.
- **İstisna:** özet penceresi kapandıktan sonra **ertesi güne ait** bir değişiklik yapılırsa anlık gider. Geç haber vermenin bedeli, özetin sessizliğinin kazancından yüksek.
- **İptal neden anlık ve sessiz saat delici:** aksiyon gerektiriyor. Veli çocuğunu erken almaya gelecek, öğretmen o saati başka türlü planlayacak. Akşam 22:00'de girilen "yarın 1. ders iptal" bilgisinin ertesi sabah 07:00'de gitmesi, birçok veli için evden çıktıktan sonra demek.

> [!warning] ⚠️ Ön koşul — `B-14`
> Program üretimi düzelmeden "program yayınlandı" bildirimi göndermek, hatalı programı otoriteyle duyurmak olur.

> [!danger] Bildirim yağmuru riski — K-02'nin açık maddesi
> "Program yayınlandı" tek işlemde **~1.560 alıcıya** push atıyor. K-02 bu riski bilinçli olarak kapsam dışı bıraktı ama *"pilot öncesi kapatılmalı"* diye işaretledi. **K-01b bu satırı push olarak kararlaştırdığı için o iş artık isteğe bağlı değil** — toplu gönderimde batch/throttle olmadan bu satır canlıya alınamaz.

**Kodda mevcut durum:** `TimetablePublished` `TimetableException` `TimetableCancelled` `TimetableExceptionRevoked` kind'ları mevcut. Eksik olan **zamanlama tarafı** — "gün sonu özet" için toplayıcı bir job yok, bugün her şey anlık akıyor.

---

## 6. K-01c · Sezon Yönetimi

| Olay | Kime | Kanal | Zamanlama |
|:--|:--|:--|:--|
| Sezon açıldı | Yönetici | In-app | Anlık |
| Sezon kapandı | Yönetici | In-app | Anlık |
| Devir tamamlandı | Devri başlatan yönetici + okulun diğer yöneticileri | In-app | Anlık |
| Devirde hata / eksik kayıt | Devri başlatan yönetici | In-app + **E-posta** | Anlık |

**Notlar**

- **Öğretmen, veli ve öğrenci sezon olaylarının hiçbirini almaz.** Bağlam sütunu "yeni sezon başladı" bildirimini olası görüyordu; kararımız **göndermemek** yönünde. Sezonun kullanıcıya yansıması zaten iki somut bildirimle geliyor: **"çizelge yayınlandı"** (K-01a) ve **"program yayınlandı"** (K-01b). Üstüne bir de "yeni sezon başladı" göndermek, aynı bilgiyi ikinci kez ve daha soyut biçimde duyurmak olur.
- **Devir hatası neden tek e-posta alan satır:** devir çoğunlukla mesai dışında çalıştırılıyor ve sonucu aksiyon gerektiriyor. Yönetici uygulamada değilken de ulaşılmalı. Diğer üç satır ertesi sabah öğrenilse hiçbir şey kaybedilmez.
- **Push yok:** dördü de masa başı işleri. Yönetici personası zaten uygulamanın/webin açık olduğu bağlamda.

> [!warning] ⚠️ Ön koşul — `B-07`
> Devir hatası düzelmeden "devir tamamlandı" bildirimi yanıltıcı: aktarılmamış kayıtlar varken "tamamlandı" demek, kontrolü yapılmamış bir işi onaylanmış göstermek olur.

> [!note] E-posta kanalı bugün gerçek değil
> K-02 belgesinin §11'i kayda geçiriyor: `NotificationConfig`/`NotificationRuleConfig` gönderim yolunda okunmuyor, **e-posta ve olay matrisi hâlâ sahte**. Bu satırın e-posta ayağı, e-posta kanalı gerçekten bağlanana dek in-app olarak çalışır.

---

## 7. Açık kalanlar

| Konu | Not |
|:--|:--|
| **"Vekalet" hangi vekalet?** | Kodda **nöbet vekaleti** karşılığı bir yapı yok; `NotificationKind.TimetableException` **ders vekaleti**. K-01a'daki iki vekalet satırının hangisini kastettiği uygulama öncesi netleşmeli — nöbet vekaletiyse önce o yapı kurulmalı. |
| **Y-01 bu matrise taşınmalı** | Görevlendirme bildirimi K-01'in verilmiş tek satırıydı. Matris tamamlandığına göre artık buraya taşınabilir; "görevlendirme **iptal** edilince de bildirim gitsin mi" sorusu hâlâ açık. |
| **Gün sonu özet penceresi** | Saat kararı verilmedi (17:00? 18:00?). Nöbet hatırlatmasıyla aynı saat seçilirse öğretmen iki bildirimi arka arkaya alır — birleştirilmesi düşünülebilir. |
| **Bildirim yağmuru** | K-01b'nin push kararı, K-02'nin ertelediği throttle işini pilot öncesi zorunlu hale getirdi. |

---

## 8. Doğan işler

- [ ] `DutyRosterPublishedEvent` alıcı listesine **yancılar eklensin** — `DutyRoster.cs:107`, `RelieverId` distinct birleşimi
- [ ] `AssignReliever` / `ClearReliever` için domain event + `NotificationKind` + handler *(gövde bölge adını taşır)*
- [ ] `DutyAssignmentChangedEvent` için bildirim handler'ı — olay var, karşılığı yok
- [ ] `DutyExemptionChangedEvent` için bildirim handler'ı — onay/red ayrımı ve red gerekçesi gövdede
- [ ] Nöbet günü hatırlatması — zamanlanmış Hangfire job'u *(bir gün önce 17:00)*
- [ ] Ders programı **gün sonu özet** toplayıcısı + "ertesi güne ait değişiklik anlık" istisnası
- [ ] Sezon olayları için yönetici bildirimleri + devir hatasında e-posta
- [ ] Sessiz saat kapısına **satır bazlı "deler" işareti** — yalnız iki satır *(vekalet atandı, ders iptal edildi)*
- [ ] Toplu gönderim throttle'ı — `K-01b` "program yayınlandı" satırının ön koşulu
- [ ] `Y-01` bu matrise taşınsın, iptal sorusu cevaplansın
