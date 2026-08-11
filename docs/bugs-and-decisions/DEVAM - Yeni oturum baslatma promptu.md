# DEVAM — Yeni oturum başlatma promptu

> Bu dosya, bulgu defterini sıfıra çekme işini **yeni bir oturumda** kaldığı yerden
> sürdürmek için hazırlandı. Aşağıdaki bloğu olduğu gibi kopyalayıp yapıştırın.
> Son güncelleme: 2026-08-12 · Durum: **30 kapalı · 51 açık · 81 toplam**

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
- s1 sezon DIŞI · s2 sezon İÇİNDE (tarihe bağlı akışlar burada test edilir) ·
  s3 sezon başlamamış. Ders programı verisi s2 ve s3'te; duyuru verisi s1'de.
- Okul değiştirmeden ÖNCE çıkış yap — açık oturumla başka okula giriş 500 veriyor
  (bulgu B-16, engel dosyası ENG-01).
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

KULLANICIDAN CEVAP BEKLEYEN 4 MADDE (bunlar bloklamıyor, paralel sor)
- B-17 / ENG-02: öğretmen-öğrenci ders programı yüzeyi yok; ikisi de yöneticinin
  konsoluna düşüyor (veri sızmıyor, 5 uç da 403). Seçenek A (ekranı yaz — sunucu
  ayağı hazır) veya B (menüden kaldır). Önerilen A.
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
- Sıradaki boş ID: TB-53, X-09, B-18, D-09, ENG-03
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

## Son commit'ler

| Depo | Commit |
|---|---|
| `oksis` | `135ee3e` docs(bulgular): B-06 duyurular ayagi kapandi, bildirimler acik |
| `oksis-api` | `a578cf7` feat(announcements): B-06 duyuru envanterine sezon suzgeci |
| `oksis-ui` | `e169148` feat(announcements): B-06 sezon secici, aktif sezon secili aciliyor |

Üçü de `origin/master` ile eşit ve **çalışma ağaçları temiz** — bekleyen commit yok.

> ⚠️ Defterde `B-04` ve `B-10` için yazan *"çalışma ağacında hazır, henüz commit
> edilmedi"* notları **bayattı**; 2026-08-12'de ölçülüp düzeltildi. İkisinin de kodu
> commit edilmiş, açık kalma sebepleri farklı (tek kaynak / bağımlılık taraması).
> Ders: defterdeki "commit edilmedi" türü durum notlarını okumadan önce `git log` ile
> doğrula.
