
| | |
|---|---|
| **Belge türü** | İhtiyaç analizi (ürün + iş perspektifi) |
| **Tarih** | 25 Ağustos 2026 |
| **Durum** | **Kararlar kesinleşti** — karar turu tamamlandı (S-1…S-8 cevaplandı) → sıradaki adım teknik analiz |
| **Kapsam (Faz A)** | Ödev verme, yayın, öğrenci/veli görünürlüğü, öğretmen kontrolü, **öğrenci görsel teslimi**, bildirim üretimi |
| **Kapsam dışı** | Tam dijital teslim mekaniği (Faz B), not defterine akış (V2), online quiz (yok), push kanalı (ayrı paket) |
| **Önceki sürüm** | `odev-modulu-ihtiyac-analizi-2026-08-25.html` (öneri kararlı taslak) |

> **Karar turu notu:** S-1 ("dijital teslim Faz B") ile S-8 ("öğrenci her ödev için dosya/resim yükleyebilsin") arasındaki gerilim şöyle çözüldü: teslim kavramı ikiye bölündü. **Görsel teslim** (öğrencinin kendi teslim kaydına fotoğraf/dosya eklemesi, kanıt niteliğinde) **Faz A'dadır**. **Tam dijital teslim** (metin cevabı, saat bazlı süre zorlaması, geç teslim durumu, teslimin durumu otomatik belirlemesi) **Faz B'dedir**. Her iki fazda da durumun tek yetkili kaynağı öğretmen işaretlemesidir.

---

## 1. Yönetici Özeti

Ödev modülü, öğretmenin bir **şube × ders** kapsamında (şubenin tamamına veya seçili öğrencilere) verdiği ödevi **taslak → yayınlandı → süresi doldu → kapandı** yaşam döngüsünde tutan, yayın anında öğrenci ve veliyi bilgilendiren, teslim durumunu öğrenci bazında izleyen ve *"çocuğumun bugün ödevi var mı, yaptı mı?"* sorusunu velinin telefonunda cevaplayan modüldür. Yoklama ve nottan farklı olarak ödev **her gün** üretilen bir sinyaldir; modülün veli sadakati üzerindeki etkisi frekansından gelir.

Teslim modeli iki katmanlıdır:

1. **Öğretmen kontrolü (yetkili katman):** Öğretmen her öğrenciyi **Tamamlandı / Eksik / Yapılmadı / Muaf** olarak işaretler. Durumun tek kaynağı budur.
2. **Öğrenci görsel teslimi (destek katmanı):** Öğrenci, kendi teslim kaydına fotoğraf/dosya yükleyebilir (defter sayfasının fotoğrafı gibi). Yükleme durumu **değiştirmez**; öğretmen ızgarasında rozet olarak görünür ve öğretmenin uzaktan kontrol yapabilmesini sağlar. Devamsız öğrencinin ödevini uzaktan gösterebilmesi bu katmanın doğal sonucudur — ama özellik tüm öğrencilere, her ödevde açıktır.

Modül sıfırdan başlamıyor: `homework` modül iskeleti dokümantasyonda açık (Sprint 2), bildirim kataloğunda ödev aileleri tanımlı, öğretmen görevlendirmesi, şube/öğrenci kapsamı, veli-çocuk kapsam kapısı, sezon bağlamı ve dosya altyapısı (Garage / `IStorageService`) yazılmış durumda. Yeni gelenler: ödev domain'i, teslim takip kaydı, görsel teslim yüzeyi, 4-5 bildirim olay tipinin üretimi, iki yeni izin ve ~16 ekran/ekran-parçası.

> **Tek cümle:** Öğretmen teneffüste telefonundan 60 saniyede ödev verir; öğrenci günü gelmeden görür ve isterse defterinin fotoğrafını yükler; kontrol günü öğretmen ızgaradan üç dokunuşla işaretler (yüklemesi olanı uzaktan da kontrol edebilir); eksik yapan öğrencinin velisi akşam özetiyle haberdar olur; yönetim hangi şubeye hangi güne kaç ödev yığıldığını tek panodan izler — ama hiçbir öğretmen skorlanmaz.

---

## 2. Kesinleşen Kararlar (K-1…K-12)

| Kod | Karar | Kesin hüküm | Sonucu |
|---|---|---|---|
| **K-1** | Ödevin hedefi | **Şubenin tamamı VEYA seçili öğrenci alt kümesi** (S-2 kararı: MVP'de var). Çoklu şubeye verme = şube başına bağımsız kayıt. | Izgara, ödevin hedef listesini gösterir. Alt küme ödevlerde roster **yayın anında sabitlenir**; tam-şube ödevlerde roster dinamiktir (BR-HW-13). |
| **K-2** | Teslim modeli | **Faz A = öğretmen kontrolü + öğrenci görsel teslimi.** Görsel teslim: fotoğraf/dosya, kanıt niteliğinde, durumu değiştirmez. Tam dijital teslim (metin, saat zorlaması, geç teslim, otomatik durum) **Faz B**. | Veri modeli her iki fazı bugünden taşır (teslim kaydı + ek ilişkisi); Faz B ekleme yapar, değiştirmez. |
| **K-3** | Değerlendirme | **Yalnız durum bazlı:** Tamamlandı / Eksik / Yapılmadı / Muaf. **Puan alanı yok** (S-3 kararı: hiç olmasın). Not defterine akış V2 (Not modülünde `kaynak` alanı rezerve). | Ödev modülü akademik hesaba hiçbir biçimde dokunmaz; Not modülüyle kavram karışıklığı sıfır. |
| **K-4** | Yaşam döngüsü | **Taslak → Yayınlandı → Süresi Doldu (otomatik) → Kapandı (öğretmen) → Arşiv (sezon).** Yayın geri alınamaz; iptal ayrı ve bildirimli. Yayınlanmış ödevde değişiklik → "ödev güncellendi" bildirimi. | Sessiz değişiklik yok; Not modülü durum makinesi zihniyeti korunur. |
| **K-5** | Görünürlük & kademe | İlkokulda birincil muhatap **veli** (öğrenci hesabı pasif); ortaokul/lisede birincil muhatap **öğrenci**, veli izleyici. Kıyas verisi hiçbir yüzeyde yok. | Bildirim alıcıları ve mobil öncelikler kademeden çözülür. |
| **K-6** | Son teslim & hatırlatma | **DueDate zorunlu, yalnız tarih** (S-5 kararı: saat alanı Faz A arayüzünde yok; iç değer 23:59; saat Faz B planında). Hatırlatma: `homeworkReminderHoursBefore` (varsayılan 24, 0 = kapalı). | Yeni SchoolSettings alanı; Hangfire zamanlı iş; yoklama hatırlatma kalıbı yeniden kullanılır. |
| **K-7** | Ekler & yüklemeler | **Öğretmen ekleri:** dosya + URL. **Öğrenci yüklemeleri:** görsel (JPG/PNG/HEIC) + PDF, teslim kaydı başına üst sınır (öneri: 5 dosya), mevcut `IStorageService` / Garage, tenant bucket, 25MB eşiği. | Dosya altyapısı iki tüketici kazanır; öğrenci-üretimi içerik için KVKK değerlendirmesi §9'da. |
| **K-8** | Yönetim görünürlüğü | **"Yükü ölçeriz, öğretmeni değil."** Şube × gün yoğunluk takvimi + kontrolsüz kalan ödev uyarısı. Öğretmen bazlı kümülatif skor kartı **yok**. | Raporlama felsefesi korunur; öğretmen direnci riski düşer. |
| **K-9** | Geç işlem | DueDate sonrası öğretmen işaretlemesi serbest ve izli. Öğrenci yüklemesi ödev **Kapandı** olana dek serbesttir; "geç teslim" etiketi Faz A'da yoktur (Faz B konusu). | Düzeltme penceresi / amendment karmaşası bu modülde açılmaz. |
| **K-10** | Silme / iptal | Soft delete, istisnasız. Yayınlanmış ödev iptali → gerekçe + "ödev iptal edildi" bildirimi. Taslak silme sessiz. | Akademik izlenebilirlik korunur. |
| **K-11** | Sezon / dönem | Sezon **hard partition** (`scoped`); dönem yalnız liste filtresi (soft). Kapalı sezon salt okunur. | Yeni bağlam mekanizması gerekmez. |
| **K-12** | Ders programı ilişkisi | Ödev **derse (Subject)** bağlanır, timetable oturumuna bağlanmaz. | Timetable bağımlılığı sıfır. |
| **K-13** | Devamsızlık etkileşimi | **Otomasyon yok** (S-8 kararı). Devamsız öğrenci için öğretmen elle istediği durumu (tipik olarak Muaf) işaretler; öğrenci isterse görsel teslimle uzaktan gösterir. | Yoklama modülüne bağımlılık doğmaz. |

### Karar turu — soru/cevap kaydı

| Soru | Cevap (Faruk) | Analizdeki karşılığı |
|---|---|---|
| S-1 Dijital teslim | Faz B | K-2: tam dijital teslim Faz B; görsel teslim Faz A (S-8 ile birlikte yorumlandı) |
| S-2 Seçili öğrenciye ödev | MVP'ye girsin | K-1 revize: hedef = tam şube veya alt küme |
| S-3 Bilgilendirme puanı | Hiç olmasın | K-3 revize: puan alanı tamamen kaldırıldı |
| S-4 Eksik-ödev bildirimi | Varsayılan günlük özet; okul politikasıyla anında | K-6 / §7 aynen |
| S-5 Saat alanı | Faz A'da yok, Faz B planına | K-6 revize |
| S-6 "Ödevi gördüm" onayı | Gerek yok | Kapsam dışına alındı |
| S-7 Kulüp/etüt kapsam dışı | Teyit | §10 aynen |
| S-8 Devamsız öğrenci + görsel yükleme | Otomasyon yok; her öğrenci her ödeve görsel yükleyebilsin | K-13 yeni; K-2/K-7 revize; HW-S-02 ekranı eklendi |

---

## 3. Kavramlar & Temas Eden Modüller

### Kavramlar

| Kavram | Tanım |
|---|---|
| **Ödev (Homework)** | Görevli öğretmenin şube × ders kapsamında verdiği; başlık, açıklama, opsiyonel ekler ve zorunlu son teslim tarihi taşıyan iş birimi. Hedefi şubenin tamamı veya seçili öğrenci alt kümesidir. Sezona bağlıdır. |
| **Teslim Takip Kaydı** | Yayın anında hedefteki her öğrenci için otomatik açılan kayıt. Başlangıç durumu **İşaretlenmedi**; öğretmen kontrolüyle Tamamlandı / Eksik / Yapılmadı / Muaf olur. Öğrenci yüklemeleri bu kayda bağlanır. Her durum değişikliği izlidir. |
| **İşaretlenmedi** | Kontrol henüz yapılmadı demektir; asla "yapıldı/yapılmadı" olarak yorumlanmaz, veliye olumlu/olumsuz sinyal üretmez. Veli güveninin temeli. |
| **Görsel Teslim** | Öğrencinin kendi teslim kaydına yüklediği fotoğraf/dosya (defter sayfası, çalışma kağıdı). Kanıt niteliğindedir; durumu **değiştirmez**, ızgarada rozet olarak görünür. |
| **Muaf** | Öğrencinin ödevden sorumlu tutulmadığı durum (raporlu, sonradan kayıt, bireysel plan). Gerekçe zorunlu. |
| **Kontrol** | Öğretmenin ızgarada durum işaretlemesi; tek tek, toplu ("kalanları Tamamlandı yap") veya yükleme görüntüleyerek uzaktan yapılabilir. |
| **Ödev yoğunluğu** | Bir şubenin bir gününe son tarihi düşen ödev sayısı. Yönetimin izlediği tek kümülatif metrik; öznesi şube ve gündür, öğretmen değil. |

### Temas eden modüller

| Modül | İlişki | Durum | Ne kullanılır / ne değişir |
|---|---|---|---|
| **Teacher Assignments** | Girdi | Hazır | Kapsam kapısının tek kaynağı: "bu öğretmen bu şubede bu dersi okutuyor mu?" Ders seviyesinde kapsama — ödev de ders seviyesinde: uyumlu. |
| **Classes & Sections** (ClassRoom) | Girdi | Hazır | Şube roster'ı → takip kayıtları. Alt küme ödevde hedef listesi yayında sabitlenir; tam-şube ödevde BR-HW-13 işler. |
| **Academic Sessions** | Girdi | Hazır | Sezon `scoped`, dönem soft filtre, kapalı sezon salt okunur. |
| **Files** (Garage / IStorageService) | Çıktı | Hazır | Öğretmen ekleri + **öğrenci yüklemeleri** tenant bucket'a. Soft-delete'te erişim kapanır, dosya retention'a tabi saklanır. |
| **Notifications** | Çıktı | Genişleme | 5 olay tipinin üretimi (§7). Domain event → enqueuer → dispatch zinciri aynen. |
| **Grades** (Not) | Gelecek | V2 | Ödev durumunun performans notuna akması; Not tarafında `kaynak` alanı rezerve, bu modülde ek hazırlık yok. |
| **Attendance** (Yoklama) | Yok | — | K-13: otomasyon yok, bağımlılık yok. |
| **Clubs** | Yok | — | Kulüp çalışması ≠ ödev (S-7 teyitli). |
| **Reports** | Çıktı | Ekleme | Raporlar hub'ına "Ödev" görünümü: yoğunluk takvimi + kontrolsüz ödevler. Kümülatif öğretmen raporu yok. |

---

## 4. Rol İhtiyaçları

**Öğretmen — "hızlı ver, hızlı kontrol et"**
Ders çıkışı 60 saniyede ödev vermek (mobil birincil — teneffüs gerçeği); kontrol günü 30 kişilik ızgarayı 2 dakikada işaretlemek; yüklemesi olan öğrenciyi sınıfa gelmeden/uzaktan kontrol edebilmek. Korkusu: sistemin defterden yavaş olması ve yoğunluk panosunun kendisini skorlaması — K-8 ikincisini tasarım seviyesinde engeller. Görsel teslimler öğretmene **iş yaratmamalı**: yükleme rozeti bilgidir, inceleme zorunluluğu değildir.

**Öğrenci — "bugün ne var, yarın ne var"**
Çanta hazırlarken tek bakışta yarının ödevlerini görmek; ekleri açmak; istediği ödeve defterinin fotoğrafını yüklemek (özellikle devamsız günlerde). Kıyas yok, sıralama yok, oyunlaştırma yok; "Yapılmadı" nötr dille sunulur. Fiilen ortaokul-lise kitlesi (ilkokul hesabı pasif → ilkokulda görsel teslim fiilen kullanılmaz; bu bilinçli bir sınırdır, veli adına yükleme **açılmaz**).

**Veli — "çocuğum yaptı mı?"**
Güncel ödev listesi + kontrol sonuçları; eksik/yapılmadı bilgisinin akşam özetiyle gelmesi; çocuğunun yüklediği görselleri görebilmek. En büyük hayal kırıklığı *yanlış* bilgidir: "İşaretlenmedi" dürüstçe "henüz kontrol edilmedi" diye gösterilir — sahte "tamamlandı"dan bin kat değerlidir.

**Yönetim — "yük dengeli mi, sistem işliyor mu"**
Aynı güne ödev yığılmasını veli şikâyeti gelmeden görmek; süresi dolmuş ama kontrolsüz ödevleri fark etmek; politikayı (hatırlatma, veli bildirimi, yoğunluk eşiği) kod gerektirmeden ayarlamak. Sınır: anlık boşluk uyarısı evet, öğretmen bazlı kümülatif skor hayır.

---

## 5. İş Kuralları (BR-HW-01…16)

| Kod | Kural | Gerekçe / not |
|---|---|---|
| **BR-HW-01** | Ödev yalnız görevli öğretmen tarafından, görevli olduğu şube × ders için verilebilir; kapsam kontrolü handler seviyesinde görevlendirmeden çözülür. | İzin yüzeyi açar, kapsam kapısı kaydı belirler. |
| **BR-HW-02** | Yayın anında DueDate geçmişte olamaz; iç değer 23:59 (saat arayüzde yok — K-6). | Anında "Süresi Doldu"ya düşmeyi engeller. |
| **BR-HW-03** | Taslak yalnız sahibine görünür; bildirim üretmez. | Taslak güveni. |
| **BR-HW-04** | Yayın geri alınamaz; yayınlanmış ödev ancak gerekçeli **iptal** edilebilir ve bildirim üretir. | Sessiz geri çekme veli güvenini kırar. |
| **BR-HW-05** | Yayın anında hedefteki (tam şube veya alt küme) her aktif öğrenci için takip kaydı açılır; başlangıç durumu İşaretlenmedi. | Izgara daima hedefin tam listesi. |
| **BR-HW-06** | İşaretlenmedi hiçbir arayüz ve bildirimde "yapıldı/yapılmadı" olarak yorumlanamaz. | Veli güveninin temeli. |
| **BR-HW-07** | Durum değişiklikleri izlidir (kim, ne zaman, hangi durumdan hangisine); Muaf gerekçe ister. | "Hiçbir kayıt sessizce değişmez." |
| **BR-HW-08** | Eksik/Yapılmadı işaretlemesi, politika açıksa veliye bildirim üretir; **varsayılan günlük tek özet**, okul politikasıyla "anında"ya çevrilebilir (S-4 kararı). | Spam engeli. |
| **BR-HW-09** | Öğrenci/veli yalnız kendi (çocuğunun) kayıtlarını ve yüklemelerini görür; başka öğrencinin durumu/yüklemesi, sınıf oranı, sıralama gösterilmez. | Kıyas yok; KVKK. |
| **BR-HW-10** | Silme = soft delete; kapalı/arşiv sezon değişmez. | Platform ilkeleri. |
| **BR-HW-11** | Yönetim raporları özne olarak şube/gün/ödevi gösterir; öğretmen bazlı kümülatif liste veya sıralama üretmez. | K-8. |
| **BR-HW-12** | *(kaldırıldı — eski puan kuralı; K-3 gereği puan alanı yok)* | Sürüm izlenebilirliği için kod boş bırakıldı. |
| **BR-HW-13** | Tam-şube ödevde, şubeye sonradan katılan öğrenci için katılım öncesi son tarihli ödevlerde kayıt açılmaz; katılım sonrası son tarihli açık ödevlerde otomatik açılır. Alt küme ödevde hedef listesi yayında sabittir, sonradan katılan eklenmez. | Nakil öğrenciye geriye dönük "Yapılmadı" yığılmaz; alt kümede belirsizlik yok. |
| **BR-HW-14** | Veli erişim-durumu (full/restricted/none) ödev görünürlüğü, yükleme görünürlüğü ve bildirim alıcılığında süzülür. | Ayrı yaşayan ebeveyn senaryosu; resolver'da doğrulanacak. |
| **BR-HW-15** | Öğrenci yüklemesi durumu **değiştirmez**; ızgarada rozet üretir. Yükleme, ödev **Kapandı** olana dek serbesttir; Kapandı/Arşiv'de yükleme kapanır, görüntüleme sürer. Öğrenci kendi yüklemesini ödev Kapandı olana dek silebilir (izli). | Görsel teslim kanıttır, otorite değildir (K-2). |
| **BR-HW-16** | Yükleme sınırları: teslim kaydı başına en çok 5 dosya; izinli türler görsel (JPG/PNG/HEIC) + PDF; boyut/iletim mevcut dosya altyapısı kurallarına tabidir. Yükleme başına öğretmene bildirim **gitmez** (rozet yeterli). | Depolama disiplini + öğretmen bildirim gürültüsünün engellenmesi. |

---

## 6. Yetki Modeli

| İzin kodu | Ne açar | Varsayılan rol eşlemesi |
|---|---|---|
| `homework.read` | Ödev ve kendi kapsamındaki teslim durum/yüklemelerini görüntüleme. | SchoolAdmin, Teacher, Student, Parent (kapsam kapısıyla daraltılır). |
| `homework.write` | Ödev oluşturma, düzenleme, yayınlama, iptal; durum işaretleme. Öğrencide **yalnız kendi teslim kaydına yükleme** bu iznin öğrenci-kapsamlı alt yüzeyidir. | Teacher (görevli şube × ders), SchoolAdmin; Student (yalnız yükleme yüzeyi). |
| `homework.manage` | İdari müdahale: ayrılan öğretmenin taslağını görme/yayınlama, herhangi bir ödevi iptal, politika ayarları. | Yalnız SchoolAdmin. |

**Kapsam kapısı (handler seviyesinde):** öğretmen → görevlendirme kaydı · öğrenci → yalnız kendi teslim kaydı (yükleme dahil) · veli → veli-çocuk ilişkisi + erişim durumu. Not modülü kapsam kapısı kalıbının eşi; teknik analizde ortak soyutlamaya çekilme değerlendirilecek.

**Zor vakalar (kararlı):**
- **Aynı derse iki öğretmen:** ikisi de ödev verebilir ve birbirininkini görür; işaretlemeyi ödevin sahibi yapar (sahip dışı işaretleme Faz A'da yok).
- **Öğretmen ayrıldı:** ödevleri yaşar; kontrolü `homework.manage` veya yeni görevlendirilen öğretmen devralır.
- **Rehber (sınıf) öğretmeni:** kendi şubesinin tüm derslerdeki ödev listesini ve durum ızgarasını **salt okunur** görür (veli görüşmesi/karne hazırlığı meşru menfaati). Öğrenci yüklemelerinin içeriğini görmez, yalnız rozet düzeyini görür.

---

## 7. Bildirimler

| Olay tipi | Tetik | Alıcı | Sınıf |
|---|---|---|---|
| `HOMEWORK_ASSIGNED` | Ödev yayınlandığında. | İlkokul → veli; ortaokul/lise → öğrenci + veli. Alt küme ödevde yalnız hedef öğrenci/velileri. | Kanal seçilebilir |
| `HOMEWORK_UPDATED` | Yayınlanmış ödevde içerik/son tarih değişikliği. | Aynı alıcı kümesi. | Kanal seçilebilir |
| `HOMEWORK_DUE_REMINDER` | Son tarihten `homeworkReminderHoursBefore` önce (Hangfire). | Öğrenci (ortaokul+); ilkokulda veli. | Kanal seçilebilir; politika ile kapatılabilir |
| `HOMEWORK_MARKED_MISSING` | Eksik/Yapılmadı işaretlemesi — **varsayılan günlük özet**, politika ile "anında". | Veli (erişim süzgeçli); öğrenciye ayrıca nötr durum bildirimi. | Kanal seçilebilir; politika ile açık/kapalı |
| `HOMEWORK_CANCELLED` | Yayınlanmış ödevin iptali. | Aynı alıcı kümesi. | Kanal seçilebilir |

**Üretilmeyecek bildirimler (bilinçli):** öğrenci yüklemesi öğretmene bildirim üretmez (BR-HW-16, rozet yeterli); "ödevi gördüm" onayı yoktur (S-6 kararı).

**Birleştirme:** Aynı şubeye art arda yayınlanan ödevler bildirim sisteminin mevcut birleştirme/özet mekanizmasına aday ilk gerçek vakadır ("3 yeni ödev"). Pencere teknik analizde; ihtiyaç seviyesindeki hüküm: **veli günde onlarca tekil ödev bildirimi almaz.**

---

## 8. Ekran Envanteri

| Yüzey | Öğretmen Web | Öğretmen Mobil | Öğrenci Mobil | Veli Mobil | Yönetici Web |
|---|---|---|---|---|---|
| Ödev oluştur / yayınla | Var | **Birincil** | — | — | manage |
| Ödev listem / şube listesi | Var | Var | Ödevlerim | Çocuk bazlı | Var |
| Ödev detay + kontrol ızgarası | **Birincil** | Var | Kendi durumu | Kendi çocuğu | Salt okunur |
| Görsel teslim (yükleme / görüntüleme) | Görüntüleme | Görüntüleme | **Yükleme** | Görüntüleme (kendi çocuğu) | — |
| Yoğunluk takvimi / kontrolsüz ödevler | — | — | — | — | Var |
| Ödev politikası (SchoolSettings) | — | — | — | — | Var |

### HW-T-01 · Ödev Oluştur (öğretmen, web + mobil)
- **İçerik:** şube seçimi (çoklu), **hedef: tam şube / seçili öğrenciler** (K-1 — alt küme seçiminde roster'dan çoklu seçim), ders (görevlendirmeden daralır), başlık, açıklama, ekler (dosya + URL), son tarih (yalnız tarih; hızlı seçenekler: "yarın", "haftaya bugün").
- **Davranış:** "Taslak kaydet" ve "Yayınla" ayrı. Çoklu şube yayını tek onay ekranında özetlenir. Alt küme seçilmişse onay ekranı hedef sayısını açıkça yazar ("bu ödev 8 öğrenciye verilecek").
- **Hız hedefi:** tekrar eden öğretmen için mobilde ≤ 60 sn.

### HW-T-02 · Kontrol Izgarası (öğretmen, web birincil + mobil)
- **İçerik:** hedef roster × durum; satırda dört durum butonu + **yükleme rozeti** (dosya sayısı). Toplu eylem: "işaretlenmemiş kalanları Tamamlandı yap".
- **Davranış:** rozet dokunuşu yükleme görüntüleyiciyi açar (görsel büyütme, PDF önizleme) — öğretmen uzaktan kontrol edip aynı ekrandan işaretler. Muaf gerekçe modalı. Kaydetme anlık; Eksik/Yapılmadı bildirimleri politika gereği günlük özete birikir.
- **Hız hedefi:** 30 kişilik şube ≤ 2 dk.

### HW-S-01 · Ödevlerim (öğrenci, mobil)
- **İçerik:** gruplu liste (Bugün son / Bu hafta / İleri / Geçmiş); kart: ders, başlık, son tarih, ek rozeti, kendi durumu, kendi yükleme rozeti.
- **Davranış:** bildirimden derin link detaya; "Yapılmadı" nötr dil ve nötr renk; dark tema birinci sınıf.

### HW-S-02 · Görsel Teslim (öğrenci, mobil) — *yeni*
- **İçerik:** ödev detayında "Çalışmamı yükle" alanı: kamera ile çek / galeriden seç / PDF seç; yüklenenlerin küçük görselleri; silme (ödev Kapandı olana dek).
- **Davranış:** en çok 5 dosya (BR-HW-16); yükleme başarısızsa kayıpsız yeniden deneme; yükleme sonrası nötr onay ("Çalışman öğretmenine iletildi") — durum etiketi **değişmez** ve bu ekranda açıkça belirtilir ("Öğretmenin kontrol edince durumun güncellenecek").

### HW-P-01 · Çocuğumun Ödevleri (veli, mobil)
- **İçerik:** çocuk seçici + HW-S-01 grup mantığı; kontrol sonucu vurgusu — Eksik/Yapılmadı kartta görünür, İşaretlenmedi "Henüz kontrol edilmedi" diye açık yazılır; çocuğun yüklemeleri görüntülenebilir.
- **Davranış:** ödeme/borç, not, kıyas verisi bu yüzeyde asla görünmez; erişim kısıtlı veli sekmeyi görmez.

### HW-A-01 · Ödev Panosu (yönetici, web)
- **İçerik:** (a) şube × gün yoğunluk takvimi — hücrede o güne son tarihi düşen ödev sayısı, politika eşiğini aşan hücre vurgulu; (b) süresi dolmuş + kontrolsüz ödev listesi (özne: ödev).
- **Davranış:** hücreden ödev listesine inilir; hiçbir görünüm öğretmen bazlı toplam/sıralama üretmez (BR-HW-11).

### HW-A-02 · Ödev Politikası (SchoolSettings eki)
- **Alanlar:** `homeworkReminderHoursBefore` (0-72, varsayılan 24) · `homeworkMissingParentNotification` (açık/kapalı + **günlük özet [varsayılan]** / anında) · `homeworkDailyDensityThreshold` (pano vurgu eşiği, varsayılan 3).

---

## 9. Fonksiyonel Olmayan Gereksinimler

- **Performans:** ızgara işaretlemesi algısal olarak anlık (< 300 ms geri bildirim); listeler tek sorguda sayfalı; yükleme görüntüleyici küçük görselle açılır, tam boyut istekle gelir.
- **Yükleme dayanıklılığı (mobil):** başarısız yükleme kayıpsız yeniden denenebilir; zayıf bağlantıda görsel sıkıştırma (istemci tarafı) teknik analizde değerlendirilir.
- **KVKK:** teslim durumu **ve öğrenci yüklemeleri** kişisel veridir; yüklemeler çocuk-üretimi içerik olduğundan ayrı hassasiyet taşır: erişim kapsam kapısıyla sınırlı (öğrenci kendi, veli kendi çocuğu, ödevin sahibi öğretmen, `homework.manage`), tenant bucket'ta saklanır, mezuniyet-sonrası retention politikasına tabidir. Yüklemelerin üçüncü tarafla paylaşımı yoktur.
- **Çok kiracılılık:** tüm sorgular tenant + sezon sınırlı.
- **Denetim:** yayın, iptal, son tarih değişikliği, durum değişikliği, yükleme ve yükleme silme — hepsi izli.
- **Dil:** tüm yüzeyler Türkçe; nötr, suçlamayan durum dili.

---

## 10. Kapsam Dışı

| Ne | Nereye | Neden şimdi değil |
|---|---|---|
| Tam dijital teslim mekaniği (metin cevabı, saat bazlı süre zorlaması, geç teslim durumu, teslimin durumu belirlemesi) | **Faz B** | Görsel teslim Faz A ihtiyacını karşılar; süre/geç-teslim mantığı ayrı bir davranış katmanıdır (S-1 + S-5 kararları). |
| Son teslim saat alanı (arayüzde) | **Faz B** | S-5 kararı; iç değer 23:59 ile modelde hazır. |
| Ödev durum/puanının not defterine akması | V2 | K-3: puan yok; Not modülünde `kaynak` alanı rezerve. |
| "Ödevi gördüm" veli onayı | Yok | S-6 kararı. |
| Devamsızlık → otomatik Muaf | Yok | S-8 / K-13 kararı: öğretmen manuel işaretler. |
| Online quiz, otomatik değerlendirme, rubrik, intihal kontrolü | Yok | Ürün sınıfı farklı (LMS); OKSİS'in vaadi değil. |
| Ödev bankası / şablon kütüphanesi | V2 | "Son ödevden kopyala" hızlı yolu Faz A'da yeterli. |
| Kulüp / etüt çalışmaları | Yok | S-7 teyitli; ödev ≠ kulüp çalışması. |
| e-Okul / MEB aktarımı | Yok | Platform genel kararı. |

---

## 11. Riskler

| Risk | Etki | Önlem |
|---|---|---|
| Öğretmen kontrol işaretlemesini yapmıyor → veli ekranı "İşaretlenmedi" dolu, modül değersizleşiyor. | **Yüksek** | En kritik benimseme riski. (a) BR-HW-06 dürüst dili yanlış bilgi üretmez, (b) yönetim panosunda kontrolsüz ödev uyarısı, (c) ızgara hız hedefi ≤ 2 dk, (d) yükleme rozeti uzaktan kontrolü kolaylaştırır. Pilotta ilk ölçülecek metrik. |
| Görsel teslim depolama büyümesi (30 öğrenci × günlük ödev × fotoğraf). | **Orta** | BR-HW-16 sınırları (5 dosya, tür kısıtı) + istemci tarafı sıkıştırma değerlendirmesi + tenant bucket kota izleme (dosya altyapısı analizindeki mekanizma). Teknik analizde kapasite projeksiyonu yapılacak. |
| Alakasız/uygunsuz yükleme (öğrenci yanlış/şaka içerik yükler). | **Orta** | İçerik yalnız ödevin sahibi öğretmen + idare görür (kapsam dar); öğretmen yüklemeyi durumdan bağımsız değerlendirir; idari kaldırma `homework.manage` ile, izli. Otomatik moderasyon yok (AI pilot-dışı kararıyla tutarlı). |
| Eksik-ödev bildirimleri gürültüye dönüşür. | Düşük | Günlük özet **varsayılan** (S-4 kararı); "anında" bilinçli okul tercihi. |
| Yoğunluk panosu öğretmen baskı aracına dönüşür. | **Orta** | K-8 / BR-HW-11 tasarım seviyesinde engeller; pilot yönetimine kullanım ilkesi olarak anlatılır. |
| Alt küme ödevlerin veli algısı ("neden benim çocuğuma yok?"). | Düşük | Alt küme ödev yalnız hedef öğrenci/velisine görünür ve bildirilir; hedef dışı aile hiçbir sinyal almaz (BR-HW-09'un doğal sonucu). Pedagojik iletişim okulun sorumluluğunda. |

---

## 12. Başarı Kriterleri (pilot okullarda ölçülecek)

1. Öğretmen ödev vermeyi mobilde **60 saniyenin altında**, 30 kişilik şube kontrolünü **2 dakikanın altında** tamamlıyor.
2. Pilot şubelerde verilen ödevlerin **%80'inden fazlası** sistem üzerinden veriliyor.
3. Yayınlanan ödevlerin **%90'ı** son tarihten sonraki 2 iş günü içinde kontrol işaretlemesi almış (benimseme riski ölçümü).
4. Eksik/Yapılmadı bilgisi veliye **aynı gün** (günlük özetle) ulaşıyor; velinin okulu araması / sınıf grubuna sorması azalıyor (pilot anketi).
5. Yönetim, aynı güne aşırı ödev yığılmasını panodan **veli şikâyeti gelmeden** tespit edebiliyor.
6. *(izleme, hedef değil)* Görsel teslim kullanım oranı raporlanır — Faz B tam dijital teslim kararına girdi olur.

---

## 13. Sonraki Adım

1. **Teknik analiz** — `analysis_standards.md` 9-bölüm standardında: entity seti (Homework, teslim takip kaydı, yükleme ilişkisi), durum makinesi, CQRS envanteri, kapsam kapısı soyutlaması (Not modülüyle ortaklaştırma değerlendirmesi), migration, bildirim üretim noktaları, depolama kapasite projeksiyonu.
2. **Tasarım siparişi** — §8 envanteri girdi olmak üzere Claude Design promptları (öğretmen web+mobil, öğrenci mobil [HW-S-02 dahil], veli mobil, yönetici web); mevcut görsel gramer aynen, yeni desen yok.
3. **Linear** — sprint-first kurala uygun iş paketleri.

> **Yol haritası kabulü:** OS push kanalı hâlâ açık. Ödev modülü bildirim *üretir*; kanal geldiğinde otomatik akar. Ancak ödevin veliye vaadi bildirim frekansına dayandığından, push paketi ödev pilotundan önce kapanmazsa modülün algılanan değeri yarım kalır — bu, yol haritasında bilinçli bir kabul olarak işaretlenmiştir.

---

*OKSİS · Ödev (Homework) Modülü İhtiyaç Analizi (Final) · 25 Ağustos 2026 · Geliştirme başladığında davranışın tek yetkili kaynağı çalışan sözleşme (mock/kod) olacaktır — belge onunla çelişirse mock kazanır.*
