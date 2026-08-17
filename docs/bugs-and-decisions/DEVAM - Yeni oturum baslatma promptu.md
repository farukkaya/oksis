# DEVAM — Yeni oturum başlatma promptu

> Bu dosya, bulgu defterini sıfıra çekme işini **yeni bir oturumda** kaldığı yerden
> sürdürmek için hazırlandı. Aşağıdaki bloğu olduğu gibi kopyalayıp yapıştırın.
> Son güncelleme: **2026-08-18** · Son tur: `ENG-02` ekran + cihaz turları (`TB-65`…`TB-77`)

---

## Kopyalanacak prompt

```
OKSİS bulgu defterini 0 bulguya çekme işine kaldığım yerden devam et.

HEDEF
docs/bugs-and-decisions/"OKSİS - Bulgu Kayıt Defteri.md" içindeki açık bulguları
sırayla kapat. Her bulgu için: önce ÖLÇ (kod okumak yetmez — çalışan API/ekranda
doğrula), sonra düzelt, sonra ekran fotoğrafı veya uç ölçümüyle İSPATLA, sonra
deftere gerekçesiyle işle. Bulunan her yeni bulgu da deftere yazılır, sohbette
bırakılmaz.

ÇALIŞMA KURALLARI (bu oturumda kanıtlandı, uy)
1. Yamalama kabul değil. Aynı hata birden çok ekranda varsa merkezî çöz.
2. Teşhisini ölçüm çürütürse teşhisi değiştir, ölçümü değil. Bu turda beş kez oldu.
3. "Testler yeşil ama gerçek çağrı bozuk" deseni tekrar ediyor (X-06, X-07) —
   testin kolay yolu değil, gerçek yolu koşturduğundan emin ol.
4. Kapsam kararı (özellik yazmak, menü budamak) benim değil kullanıcının. Böyle bir
   engelde ENG-## dosyası yaz, defterden linkle, tura devam et.
5. Kod yorumlarına "ne yaptığını" değil "neden ve neyi ölçerek" yazdığını yaz.
6. Push'ları kendin yönetebilirsin (kullanıcı bu yetkiyi verdi). Üç depo da master.
7. Kullanıcıya dönük her açıklama Türkçe.

ORTAM
- API: cd ~/Repositories/oksis-api && export PATH="$HOME/.dotnet:$PATH" &&
  dotnet run --project src/Oksis.Api   → http://localhost:5112
- Web: cd ~/Repositories/oksis-ui/apps/web && npm run dev → http://localhost:3000
- Altyapı zaten ayakta: oksis-mssql (sa / YourStrong!Pass2025, db oksis_dev),
  redis, garage, clamav, mailpit
- Seed hesapları okul indeksi 1'den başlar (s0 YOK): mudur.s1@oksis.local,
  ogretmen.s2.01@…, ogrenci.s2.001@… — parola hepsinde Oksis1234!
- DÖRT okul da yürürlükte 2026-2027 sezonunda (eski "s1 dışı / s2 içinde /
  s3 başlamamış" notu 2026-08-16'da geçersizleşti). Dördüncü okul s4 = OKSİS Test
  Lisesi.
- ⚠️ DERS PROGRAMI VERİSİNİN DÖNEM TUZAĞI (2026-08-18'de ölçüldü): seed'lenmiş
  programların çoğu ARŞİV dönemlere ait. Bugünü kapsayan dönemde yayın yoksa ekran
  doğru olarak "yayınlanmadı" der — bu kusur değil, TB-65'in çalışması. Dolu ekran
  görmek için önce `academic.schedule_versions` × `academic_terms` ile bugünü
  kapsayan yayın var mı diye BAK.
- ⚠️ s3'te İKİ tane 1-A var: yürürlükteki sezonunki 0 öğrencili, dolu olan arşivde.
  Yoklama listesi boş çıkarsa önce şubenin öğrenci sayısına bak.
- B-16 KAPANDI: okul değiştirmek için artık çıkış yapmak gerekmiyor (2026-08-16).
- Mobil hızlı giriş düğmeleri s1'e sabit; s3/s2 için kimlik elle girilir.
- Ekran testi için Playwright MCP kullanılıyor (Chrome eklentisi bağlı değil).
- Şema adları koddaki modül adlarıyla birebir değil; tablo ararken
  INFORMATION_SCHEMA'ya bak, tahmin etme.
- Makine bu turda iki kez doyuma gitti (load 26+). Next dev server + paralel dotnet
  build birlikte koşarsa öldür/yeniden başlat.

SIRADAKİ İŞLER (öncelik sırasıyla)
1. B-04 🔴 — Sezon açma 6. adımda validasyona takılıyor. BE düzeltmesi COMMIT
   EDİLMİŞ durumda (238f5e1; validator bugün InclusiveBetween(0,6)). Kalan tek iş:
   adım sayısı hâlâ iki yerde ayrı yazılı (FE TOTAL_WIZARD_STEPS = 6, BE validator
   sabiti) — tek kaynağa bağla, yoksa yeni adım eklendiğinde aynı ayrışma döner.
   En hızlı kapanacak madde.
2. B-13 🔴 — Sürekli muafiyetli öğretmene otomatik nöbet. B-12 kapandığı için artık
   ölçülebilir; algoritma muafiyeti üç noktada sorguluyor, canlı veriyle doğrula.
3. B-16 🔴 — Açık oturumla başka okula giriş 500. ENG-01'de iki çözüm adayı yazılı.
4. B-10 — "Rehberlik" branşı. Migration COMMIT EDİLMİŞ (9e96a4f). Kalan tek iş:
   mevcut tenant verisinde o branşa bağlı öğretmen/görevlendirme kalmış olabilir —
   bağımlılık taraması hâlâ yapılmadı.
5. D-04, D-08 — küçük tasarım maddeleri.
6. TB-## (39 madde) — kod taramasından çıkan teknik borç. Bunlar kullanıcının
   bildirdiği bulgular DEĞİL. Ucuz olanları (TB-09, TB-12, TB-17, TB-21, TB-32,
   TB-33, TB-39) toplu kapatılabilir; TB-48/TB-10/TB-43 ise yarım kalmış
   ÖZELLİKLER — kapsam kararı ister, kendi başına başlama.

KULLANICIDAN CEVAP BEKLEYEN MADDELER (bunlar bloklamıyor, paralel sor)
- TB-76 🔴 YENİ: yayın ekranındaki bildirim seçimi süs. NotifyInApp/Push/Email
  bayrakları uca gidiyor ama HİÇBİR KOD OKUMUYOR; fan-out domain olayı üzerinden
  koşulsuz. Ölçüm: üçü de false gönderildi, yine 16 bildirim oluştu (8 öğrenci +
  8 veli). ÜRÜN KARARI: bayrakları oku mu, bayrakları kaldır mı?
- TB-77 🔴 YENİ: yayın önizlemesinde Students/Parents/ConflictCount sabit sıfır.
  Müdür "yayınlayayım mı" kararını sabit sayılara bakarak veriyor. Web çekmecesinin
  sayacı ayrıca ters: gerçek alıcı öğrenci+veli, sayaç yalnız öğretmeni sayıyor.
  (conflictCount'un sabit olması yapısal olarak doğru OLABİLİR — çakışma yerleşim
  anında engelleniyor olabilir; programlar arası çakışma ÖLÇÜLMEDİ.)
- ~~B-17 / ENG-02~~ ✅ KAPANDI 2026-08-17, yedi ayağın yedisi de ekranda
  doğrulandı (son ayak: mobil öğrenci, 2026-08-18).
- X-03 / TB-48: görevlendirme v1 ve v2 yan yana; v1'in tek yazma yüzeyi kapalı ama
  yedi tüketicisi hâlâ ona bağlı. Göç kararı gerekiyor.
- TB-35: devamsızlık eşiği iki ayrı ekranda tanımlanıyor, biri hiçbir şey yapmıyor.
  Hangi ekran kazanacak?
- B-06 bildirimler ayağı: geçmiş sezon bildirimleri hiç gösterilmeli mi, yoksa
  yalnız aktif sezon mu? "Yalnız aktif sezon" denirse şema değişikliği yerine kayıt
  tarihine göre kesme yetebilir ve iş küçülür. (Notification'ın hiç sezon alanı yok.)

DEFTER KONVANSİYONLARI
- ID şeması: B-## fonksiyonel · D-## tasarım · V-## iş kuralı · X-## çapraz kesen ·
  TB-## teknik borç · K-## bekleyen karar · E-## eksik özellik · ENG-## engel
- Sıradaki boş ID: TB-78, X-15, B-33, D-15, V-04, E-17, ENG-03
- Kapanan madde SİLİNMEZ — altına "✅ KAPANDI (repo @ commit, tarih)" + gerekçe
  eklenir. Ekran kanıtları docs/bugs-and-decisions/kanit/ altına konur ve
  ![[dosya.png]] ile gömülür.
- Commit formatı: <type>(<scope>): türkçe açıklama — sonda nokta yok, scope modül
  adı veya repo.

Başlamadan önce defteri oku ve bana kısa bir plan ver.
```

---

## Bu turda kapananlar (bağlam için)

`B-01` · `B-03` · `B-05` · `B-06` (duyurular ayağı) · `B-07` · `B-08` · `B-09` ·
`B-11` · `B-12` · `B-14` · `B-15` · `B-02` · `D-01` · `D-02` · `D-03` · `D-05` ·
`D-06` · `D-07` · `X-01` · `X-02` · `X-06` · `X-07` · `X-08` · `TB-13` · `TB-27` ·
`TB-47` ve diğerleri.

## Bu turda açılanlar

`B-16` (+ `ENG-01`) · `B-17` (+ `ENG-02`) · `X-08` · `TB-52` · `D-08`

## Son oturum — 2026-08-18 (`ENG-02` ekran + cihaz turları)

`ENG-02` kapandıktan SONRA aynı yüzeyde 13 bulgu çıktı; **11'i kapandı**,
`TB-76` ve `TB-77` karar bekliyor. Ağır olanlar: `TB-65` (iki dönemin dersi aynı
hücrede çakışıyordu), `TB-71` (mobil ekran uygulama kabuğunun tümüyle dışındaydı),
`TB-74` ("Yoklamaya git" çıkmaza gidiyordu — sözleşme oturum kimliğini
döndürmüyordu).

Uygulama kullanıcının **iPhone 15 Pro**'suna kuruldu ve ekranlar gerçek cihazda
açıldı. ⚠️ İmza profili **24 Ağustos'ta doluyor** (ücretsiz kişisel takım,
`26QMTVX47Z`) ve Debug build `192.168.1.112`'ye bakıyor — Mac'in IP'si değişirse
uygulama Metro'ya bağlanamaz, yeniden derlemek gerekir.

**Turun dersi:** *ekranın var olması, ekranın doğru olduğu anlamına gelmiyor.*
Bir de: `ENG-02` tüketici yüzeyini kapattı ama onu **besleyen** yayın yüzeyi hiç
ölçülmemişti — `TB-76`/`TB-77` oradan çıktı.

**Test verisi:** `s3`'e kalıcı veri yazıldı — 1-A'ya 6 derslik program + 4 istisna,
2-A'ya 30 derslik program (ikisi de güncel dönemde, yayınlanmış), 2 derslik,
ve 2-A yayınından doğan 16 bildirim. Kullanıcı bilgilendirildi; temizlenmedi.

## Son commit'ler

| Depo | Commit |
|---|---|
| `oksis` | bu dosyayı içeren commit |
| `oksis-api` | `b49d17f fix(timetable): TB-74 ders yoklama oturumunun kimligini de don` |
| `oksis-ui` | `5dadb16 fix(schedule): TB-75 baslikta yayin ZAMANI yaziyor, bicimleyic` |

Üçü de `origin/master` ile eşit ve **çalışma ağaçları temiz**.
