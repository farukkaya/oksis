---
aliases: [ExamWindow, ExamWindowRevision, Sınav Haftası]
tags: [domain/academic]
table: academic.exam_windows
status: active
last-synced: 2026-09-13 (294ffe6)
---

# Sınav Penceresi

<!-- generated:start -->

## Nedir

Bir dönemde bir sınav türü için ayrılmış sınav haftası — "1. dönem 2. Sınav, 12–16 Ocak". [[Sınav Takvimi]]'nin **yayın birimi** budur: öğrenci ve velinin gördüğü her şey bir pencerenin yayın durumuna bağlıdır. Pencere sınavların kendisini tutmaz; sınav satırları ([[Planlanmış Sınav]]) ve kelebek oturumları ([[Sınav Oturumu]]) ona bağlanır. Yerleşmiş, toplam ve ihlal sayıları kolon değildir, her okumada pencerenin dışındaki satırlardan hesaplanır.

Pencere açılırken **mod** seçilir — ders saati ya da oturum (kelebek) — ve bütün yerleştirme yolları bu moda göre dallanır.

İçinde yaşayan ikinci kayıt **revizyon kaydıdır** (`ExamWindowRevision`): yayınlanmış takvimde yapılan her değişikliğin değişmez izi. Ayrı bir kavram değildir; pencerenin sürüm geçmişidir.

## Yaşam döngüsü

```
Draft ──(hafta duyurusu)──► WindowPublished ──(takvim yayını)──► SchedulePublished ──► Locked
                                                                   │      ▲
                                                                   └ revizyon (gerekçe, sürüm artar)
Kilit, kilitli olmayan her durumdan çağrılabilir; geri dönüş yoktur.
```

- **Draft** — öğrenci ve veli hiçbir şey görmez. Öğretmen yine de yerleştirebilir ve yerleştirme hatırlatması alır.
- **WindowPublished** — hafta duyurulur; gün, ders saati ve derslik kapalıdır. Takvim yayını yalnız bu durumdan yapılabilir.
- **SchedulePublished** — tarih, ders saati ve derslik görünür; ders programı etiketi ve "yarın sınav var" bildirimi başlar. Bu durumdaki her değişiklik **revizyondur**: gerekçe ister (en az 15 karakter), pencerenin sürümünü artırır, yayın damgasını tazeler ve etkilenen her sınav satırı için bir revizyon kaydı yazar.
- **Locked** — yazma kapanır (yerleştirme, saat isteği cevabı, oturum komutları, hatırlatma), okuma sürer. Gerekçe zorunludur. Günlük iş bitiş tarihi geçmiş ve kilitli olmayan her pencereyi — **taslaklar dahil** — sabit bir Türkçe gerekçeyle, kişi kimliği olmadan kilitler. Kilitli pencere okuma yüzlerinde yayınlanmış takvim gibi davranır.

## Kurallar

- **Tekillik:** bir okulda bir dönem × sınav türü için tek pencere (veritabanı kısıtı).
- **Aynı dönemde tarihleri çakışan iki pencere olamaz** — farklı sınav türleri için bile; pencere kurulurken reddedilir.
- **Pencere kendi döneminin tarihlerine sığmalıdır** (`TB-135`). Sessizliği tehlikelidir: sınav makinesi dönem dışında da çalışır, ama ders programı ekranı dönemin dışındaki haftayı hiç çizmez ve sınav öğrencinin programında görünmez.
- **Yalnız dönem sınavı türleri pencere açar.** Dönem sırası sıfır olan türler (sözlü, performans, proje) sürekli değerlendirmedir, tek haftaya sığmaz. Bkz. [[Sınav Türü]].
- Bitiş başlangıçtan önce olamaz; **taslak tamamlanma tarihi** pencerenin başlangıcından sonra olamaz. Cevapsız ödünç saat istekleri bu tarih geçince düşer; yerleştirme hatırlatması bu tarihten okul ayarındaki gün kadar önce başlar.
- Sezon komuttan alınmaz, dönemden türetilir.
- **Takvim yayını kapısı** kural denetleyicisinin listesidir. Geçilemez sert ihlal varsa yayın reddedilir. Duyuru payı (`EX-H08`) ya da saati seçilmemiş sınav (`EX-S05`) varsa gerekçe zorunludur ve pencerede saklanır. Kapasite aşımı ve karışmamış derslik yayını durdurmaz. Hiç yerleştirme yapılmamış pencere de gerekçesiz yayınlanamaz, çünkü dokunulmamış şube × ders çiftleri de sayılır.
- **Sürüm** 1'den başlar ve yalnız revizyonla artar. Revizyon kaydındaki sürüm, değişiklikten **sonraki** sürümdür: "sürüm 3 neden doğdu" sorusunun cevabı o satırdır.
- **Revizyon kaydı append-only'dir** ve yalnız takvim yayındayken yazılır — taslakta ya da yalnız hafta duyurulmuşken oynatmak değişiklik sayılmaz. Gerekçeyi, yapanı, zamanı, varsa sınav satırını ve önceki/sonraki hücreyi taşır; **ders kimliği taşımaz**, bu yüzden ders silme kapısı ona bakmaz. Türleri: tek sınav başka hücreye taşındı; sınavın saati başka öğretmenin hücresine geçti (ödünç saat); pencerenin kendisi revize edildi; kelebek oturumunun düzeni değişti (şube girdi/çıktı, birleşme, derslik, gözetmen, takas, yeniden yerleşim — hepsi tek türde, çünkü okuyucu için hepsi "bu oturumun düzeni değişti"dir).
- **Not defteri tarihi takvime aittir:** takvimi yayınlanmış pencere varken o dönem × sınav türünün not sütununa elle sınav tarihi girilemez. Bkz. [[Değerlendirme]].

## İlişkiler

- [[Dönem]] — pencere bir döneme aittir; tarih sınırı dönemden gelir
- [[Sezon]] — dönemden türetilen referans
- [[Sınav Türü]] — pencerenin hangi sınav için açıldığı; (dönem, tür) tekildir
- [[Planlanmış Sınav]] — pencerenin satırları; yayın kapısının saydığı küme
- [[Sınav Oturumu]] — yalnız oturum modundaki pencerede
- [[Değerlendirme]] — takvim yayını not sütununun sınav tarihini besler
- [[Okul Ayarları]] — duyuru payı, günlük sınır, hatırlatma başlangıcı, öntanımlı mod
- [[Kişi]] — yayınlayan, revize eden, kilitleyen

## Geçtiği modüller

- [[Sınav Takvimi]] — kavramın sahibi; kurma, iki adımlı yayın, revizyon, kilit
- [[Notlar]] — takvim yayını sütun tarihlerini yazar; yayınlanmış pencere elle tarih girişini kapatır
- [[Bildirimler]] — hafta duyurusu ve takvim yayını bildirimleri pencereden doğar

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- **Kilitten sonra not sütunu tarihi kimin?** Elle tarih kapısı ve sonradan doğan sütunun tarih okuması yalnız `SchedulePublished` durumuna bakıyor, `Locked`'a bakmıyor. Günlük iş pencereyi kilitlediği anda elle tarih girişi yeniden açılıyor ve sonradan doğan sütun tarihsiz doğuyor. Bilinçli mi?
- **Yayından sonra taşınan sınavın not sütunu tarihi güncelleniyor mu?** Sütun tarihi yalnız takvim yayını anında yazılıyor; taşıma olayını dinleyen bir tarih beslemesi görünmüyor.
- **Pencere revizyonu türü üretiliyor mu?** "Pencerenin kendisi revize edildi (tarih aralığı, mod)" türü tanımlı, ama pencerenin tarih aralığını ya da modunu değiştiren bir komut yok.
- **Takvim ikinci kez yayınlanabilir mi?** Yayın olayının yorumu "aynı pencere birden çok kez yayınlanabilir" diyor; durum makinesi ise takvim yayınını yalnız `WindowPublished` durumundan kabul ediyor. Yayın sonrası değişiklikler ayrı bildirimlerle gidiyor.
- **Sistemin attığı kilit kişi kimliği olarak boş Guid yazıyor.** Aynı modüldeki yerleştirme hatırlatması aynı durumda boş değer kullanıyor ve boş Guid'in denetim izini yalanlayacağını söylüyor. Hangisi kural?
