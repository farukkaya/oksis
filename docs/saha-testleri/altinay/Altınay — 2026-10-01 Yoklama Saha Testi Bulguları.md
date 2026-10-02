---
tags: [saha-testi, altinay, yoklama, kulup]
---

# Altınay — 1 Ekim 2026 Yoklama Saha Testi Bulguları

**Tarih:** 1 Ekim 2026, Perşembe · 11:35–15:15 (okul saatiyle)
**Kapsam:** Öğretmenlerin o güne ait bekleyen yoklama görevleri: şube yoklaması (1–8. ders) ve 9-A/9-B/10-A/10-B'nin
8. saatindeki kulüp saati yoklaması.
**Ortam:** Yerel dev · oksis-api `6a3cd210` · oksis-ui `f99f61f` · Altınay (`ALTINAY-AL`)
**Yüzeyler:** Web (`/roll-call`, `/clubs/...`), mobil (Expo web, telefon genişliği), API (betikle 17 öğretmen), DB ölçümü.
**Ana kayıt:** Bulguların tam metni [[OKSİS - Bulgu Kayıt Defteri]]'nde; bu belge testin özetidir.
Test başlığı satırları: [[Altınay — Yaşam Döngüsü Test Başlıkları]] `C1.1` ve `C2.2`.

> **Kişisel veri:** Depo herkese açık. Öğretmen ve öğrenciler rolüyle anılır (ör. "10-B Kimya öğretmeni", "Müzik
> kulübü danışmanı").

---

## 1. Özet

| | Sayı |
|---|---|
| Öğretmen | 17 (o gün dersi olan herkes) |
| Şube yoklama oturumu | 84 (1–8. ders) |
| Alınan şube yoklaması | 44 (1–4. dersler; 41 gerçekçi dağılım + 3 kenar testi) + 1 gelecek ders testi |
| Kulüp | 6 kulüp, 34 üye, 4 şube |
| Yeni bulgu | **9** — 🟠 5 · 🟡 3 · ⚪ 1 |
| Mevcut maddeye ek | `B-92`'ye kulüp ayağı; kapalı `TB-259`'un sahadaki sonucu |

**En önemli üç sonuç:**
1. Henüz yapılmamış dersin — hatta gelecek haftanın — yoklaması alınabiliyor (`B-92`), kulüp saatinde de.
2. Eksik ya da boş öğrenci listesiyle gönderilen yoklama "Tamamlandı" sayılıyor ve eksik öğrenciler kalıcı olarak kayıtsız kalıyor (`B-94`).
3. Zil değişikliği kulüp saatini ikiye katladı; yanlış (eski) etkinliğe girilen kulüp yoklaması devamsızlığa hiç yazılmıyor (`B-98`).

---

## 2. Bulgular

| ID | Öncelik | Başlık | Yüzey |
|---|---|---|---|
| `B-92` | 🟠 | Başlamamış dersin ve gelecek günün yoklaması alınıp kaydedilebiliyor (kulüp saati dahil) | Sunucu · web · mobil |
| `B-94` | 🟠 | Eksik/boş listeyle gönderilen yoklama "Tamamlandı"; eksik öğrenciler kalıcı kayıtsız | Sunucu · mobil görünüm |
| `B-95` | 🟠 | Pencere dışı ve program yayınından önceki günler maddileşiyor; 21 Eylül sonsuza dek "Bekliyor" | Sunucu |
| `B-96` | 🟠 | Zil değişimi bugünün kapanmış oturumlarını yeniden açıyor; gece 87 yinelenen hatırlatma | Sunucu · bildirim |
| `B-98` | 🟠 | Zil değişimi kulüp saatini ikizliyor; eski etkinliğe girilen yoklama devamsızlığa yazılmıyor | Sunucu · web · mobil |
| `B-97` | 🟡 | Gün içi izin: yinelenen izin ve var olmayan ders saati kabul ediliyor, iptal yolu yok | Sunucu |
| `TB-264` | 🟡 | Aynı oturuma eşzamanlı iki gönderimde biri 500 | Sunucu |
| `D-42` | 🟡 | Danışmanın günlük listesinde kulüp saati "Boş", kulüp kartı "0 etkinlik" | Web · mobil |
| `D-41` | ⚪ | Öğretmen yoklama ekranı idareye açık ucu çağırıyor, her açılışta 403 | Web |

### `B-92` 🟠 Gelecek ders ve gün yoklaması

- Web: 11:42'de 10-B'nin 13:30'daki 6. dersinin "Yoklama Al" düğmesi etkindi, liste açıldı ve kaydedildi.
- Mobil: gelecek dersler soluk ve "Bekliyor" görünüyor ama dokununca liste açılıyor, "Kaydet" etkin.
- API: `POST sessions/{placementId}/open?date=2026-10-08` → 200, gelecek haftanın oturumu `Open` oldu.
- Kulüp saati: Münazara danışmanı ders başlamadan 10 dk önce (14:50) işaretledi → 200, dört şubenin 8. saatine yazıldı.
- Yan etki: öğrenciye 11:46'da 5. dersten itibaren gün içi izin verildi; önceden kaydedilmiş 6. derste öğrenci **"Geldi"**
  olarak kaldı. İzin tamamlanmış oturumu çevirmiyor.
- Kod: `OpenOrGetSessionCommandHandler`, `AttendanceSession.Open/Submit` ve `UpdateClubActivityRoster` saate/tarihe bakmıyor.

### `B-94` 🟠 Eksik ve boş liste

- 9-A İngilizce (7 öğrenci) 3 kayıtla gönderildi → 200, `Completed`, 3 kayıt.
- 10-A TDE (7 öğrenci) `records: []` ile gönderildi → 200, `Completed`, 0 kayıt.
- Kurtarma yolu yok: farklı içerikle tekrar → 409 `AlreadyCompleted`; tekil düzeltme yalnız var olan kaydı değiştirir.
- Mobil 9-A'yı **"3 öğrenci · İstisna yok — tüm sınıf geldi"** diye gösteriyor; 4 öğrenci ekrandan düşmüş.
- Bugünkü ekranlar tam listeyi gönderdiği için olağan yolda tetiklenmez; eski istemci, liste açıkken şubeye öğrenci eklenmesi
  ya da el yapımı istekle tetiklenir.

### `B-95` 🟠 Pencere dışı ve yayın öncesi üretim

- Program 27 Eylül'de yayınlandı; 21–25 Eylül için oturumlar 28 Eylül'de tek seferde üretilmiş.
- 22–25 Eylül: 348 oturum "Alınmadı". 21 Eylül: 88 oturum "Bekliyor"; 7 günlük kapanış penceresinin dışında kaldığı için
  hiç kapanmayacak, retro giriş de yapılamayacak.
- "Alınmayan Yoklamalar" (24 Eylül–1 Ekim) 360 satır; **172'si programın olmadığı günler**.
- Kaynaklar: `sessions/my?from=&to=` aralıktaki her günü sınırsız üretiyor; maddileştirici sürümün yayın gününden öncesini de üretiyor.

### `B-96` 🟠 Zil değişimi kapanmış günü yeniden açıyor

- 30 Eylül 21:45'te 87 oturum "Alınmadı" oldu, hatırlatmaları 20:28–20:50 arası gitti.
- 23:37'de zil değişti; silme sınırı "okulun bugünü" olduğu için bu 87 oturum silindi, 23:48'de "Bekliyor" olarak yeniden üretildi.
- 23:50'de hatırlatma işi bunları yeni sayıp **87 hatırlatmayı ikinci kez** gönderdi.
- Gün içinde de geçerli: zil öğlen değişirse sabahın saati geçmiş dersleri yeni kimlikle "Bekliyor" doğar.

### `B-98` 🟠 Kulüp saati ikizlendi, yoklama kayboluyor

- Her kulübün bugün iki "Kulüp saati" etkinliği vardı, ikisi de yayında: **15:10–15:50** (eski zil, 28 Eylül) ve
  **15:00–15:30** (yeni zil, 1 Ekim 11:39). Web ve mobil ikisini de "Yoklama al" ile sunuyor.
- 15:03'te gerçek etkinlik "Geçmiş"e düştü; **"Yaklaşan"da yalnız yanlış olan kaldı.**
- Kütüphanecilik danışmanı yanlış etkinliği işaretledi → 200, kulüp ekranında "katıldı", ama **devamsızlığa hiçbir şey yazılmadı**:
  kaydedici zili etkinlik aralığına düşen dersi arıyor, 8. ders 15:00'te başladığı için 15:10–15:50'ye sığmıyor, sessizce boş dönüyor.
- Kök neden: kulüp saati tekilliği "kulüp × başlangıç"; `B-93`'ün zil temizliği kulüp etkinliklerine dokunmuyor.

### `B-97` 🟡 Gün içi izin doğrulaması

- Aynı öğrenciye aynı gün üç izin: 5. dersten, 6. dersten ve **99. dersten** (okulun 8 dersi var) → üçü de 201.
- Her biri veliye ayrı bildirim (6 bildirim, 2 veli). İzni silen ya da düzelten uç ve ekran yok.
- Öğretmen izin veremiyor (403) — doğru.

### `TB-264` 🟡 Eşzamanlı gönderim

- Aynı açık oturuma iki iş parçacığıyla aynı anda farklı içerik: biri 200, öteki **500**. Veri sağlam (8 kayıt, 8 tekil öğrenci);
  ikinci istek 409'a (aynı içerikse 200'e) çevrilmeli.

### `D-42` 🟡 Danışman kulüp saatini görmüyor

- Çevre ve Kimya danışmanının mobil *Bugünkü Derslerim* listesinde 8. saat **"Boş"**; kulüp yoklamasına ancak
  *Daha fazla › Kulüplerim › kulüp › Etkinlikler* yoluyla ulaşılıyor.
- Kulüp kartı hem web hem mobilde **"0 etkinlik"**, kulübün içindeki sekme "Etkinlikler 2".

### `D-41` ⚪ Öğretmen ekranında 403

- `/roll-call`'da liste açılınca `GET attendance/amendment-requests?state=1` → 403, konsol hatası. İşlev bozulmuyor.

---

## 3. Mevcut maddelerle ilişki

- **`TB-259` (kapalı, 28 Eylül "sınır olarak kabul"):** Alınmayan kulüp saati hiçbir listeye düşmüyor. Sahadaki sonucu: Kütüphanecilik'in
  doğru etkinliği boş kaldı → 5 öğrencinin 8. saatinin hiç kaydı yok. Danışmana hatırlatma gitmedi (15:10'da 7 şube öğretmenine
  gitti); yönetici panosu ve öğrencinin günlük görünümü kulüp saatini göstermiyor. `B-98` ile birleşince kayıp tamamen
  görünmez oluyor. **Kararın yeniden değerlendirilmesi önerilir.**
- **`B-93` (kapalı):** Zil değişiminde yoklama oturumlarını yeniden üretme kuralı. `B-96` ve `B-98` onun yan etkileri.
- **`B-91` (açık):** Yeniden üretilen oturumun kimliği değişiyor. `B-96` aynı aileden.

---

## 4. Doğru çalışanlar

**Şube yoklaması**
- API'nin her öğretmene döndürdüğü günlük liste DB ile birebir (17/17).
- Web akışı: liste → istisna işaretle → onay penceresi → kaydet → "Görüntüle" → tekil düzeltme + tarihçe.
- Başkasının oturumunu açma, okuma ve gönderme → 404.
- Açmadan gönderim → 409 `NotOpen`; yinelenen öğrenci → 409; geçersiz durum (0, 6) → 400; bilinmeyen kayıt → 409.
- Öğretmenin retro gönderimi → 403.
- Aynı içerikle tekrar gönderim → 200, hiçbir şey değişmez; farklı içerik → 409.
- Gün içi izin, sonraki bekleyen derste "İzinli · Gün içi izin" varsayılanı (web ve mobil).
- Pano anlık dersi ve sayaçları doğru gösteriyor; hatırlatma ders başlangıcından 10 dk sonra gidiyor.

**Kulüp saati**
- Liste şubeden değil kulübün üyelerinden geliyor (üyeler dört ayrı şubeden); işaret her öğrencinin kendi şubesinin 8. saatine
  "şube × kulüp" oturumu olarak yazılıyor.
- Gün içi izinli öğrenciye "katılmadı" → İzinli olarak yazılıyor.
- Danışman olmayan öğretmen → 404; üye olmayan öğrenci, kayıt geri çekme, yinelenen ve geçersiz statü → 400.
- Düzeltme (katıldı → katılmadı) çalışıyor; işaret "işaretlenmedi"ye geri alınamıyor.
- Kısmi işaretleme sonradan tamamlanabiliyor (aynı oturuma eklenerek).

---

## 5. Karar bekleyen gözlemler (deftere yazılmadı)

1. Sabah gelmeyen öğrenci öğleden sonraki derslerde varsayılan olarak "Geldi" geliyor. Tasarım gereği, ama öğretmen
   işaretlemeyi unutursa öğrenci derse gelmiş görünür.
2. "Gelmedi" kaydı sonradan "Geldi"ye düzeltildiğinde veliye düzeltme bildirimi gitmiyor ("ilk derse gelmedi" bildirimi
   yanlış kalıyor).
3. Kulüp saati devamsızlığa sayılıyor ama öğrencinin/velinin günlük görünümünde yer almıyor.

---

## 6. Test artıkları

**2026-10-01 akşamı temizlendi (kullanıcı kararı).** İki fazla gün içi izin ürünün yeni iptal ucuyla (`B-97`) iptal edildi; diğerleri veritabanında tek işlemle temizlendi: dört artık oturumun 27 kaydı ve 28 tarihçe satırı silindi, oturumlar "Alınmadı"ya çekildi (idare geriye dönük girebilir), bir öğrencinin geç sayacı düzeltildi; 8 Ekim oturumu ile Kütüphanecilik'in bayat 15:10 etkinliği (5 katılımıyla) yumuşak silindi. Diğer beş kulübün bayat ikizi `B-98` göçüyle silinmişti. Göç öncesi yedekler: `~/oksis-yedek/oksis_dev_oncesi_yoklama_goc_20261001.bak`, `…_oncesi_y07_20261001.bak`. Kalan: bugünün diğer yoklamaları ve veli bildirimleri ürünün ürettiği akışın parçası olarak bırakıldı.

| Artık | Bağlı bulgu |
|---|---|
| 9-A 1. ders 3/7 kayıtla, 10-A 1. ders 0 kayıtla "Tamamlandı" | `B-94` |
| 10-B 6. ders ders saatinden önce kaydedildi | `B-92` |
| 8 Ekim'e açık bırakılmış oturum `2f9e8ccf…` | `B-92` |
| Fazla gün içi izinler `12de22f5…` (6. ders) ve `67a51d56…` (99. ders) | `B-97` |
| Her kulübün eski 15:10 etkinliği; Kütüphanecilik'inkinde 5 "katıldı" işareti | `B-98` |
| 10-B'de rastgele dağılımla yüksek devamsızlık (bir derste 12'de 5) ve bunlara giden veli bildirimleri | — |

## 7. Açık kalan ölçümler

- 5–8. derslerin bekleyen oturumları bilerek bırakıldı: akşam 21:45 kapanışında "Alınmadı"ya düşüp düşmedikleri ölçülmedi
  (API'nin akşam açık olması gerekiyor).
- 30 Eylül'ün yeniden "Bekliyor"a dönen 87 oturumunun bu akşamki kapanışla tekrar "Alınmadı"ya düşmesi (`B-96`).
- Mazeret akışı ölçülmedi.

---

## 8. 2 Ekim ders saati testi (düzeltmelerin sahada ölçümü)

Bütün düzeltmeler master'da (`oksis-api` `5eb52c1b`, `oksis-ui` `8f97170`); `Y-07` (okul günü içinde zil ve program değişmez) da dahil.

| Madde | Ölçüm | Sonuç |
|---|---|---|
| `B-92` | 08:44'te 1. dersi açma; 08:50:06'da açma + gönderim; web ve mobil liste kilidi | ✅ 409 "08:50 itibarıyla", oturum Pending kaldı → 200; ekranda "08:50'den itibaren", 08:50'de kilit kalktı, mobil ve web kayıt |
| `D-41` | Öğretmen listeyi açınca ağ ve konsol | ✅ `amendment-requests` çağrılmıyor, konsol temiz |
| `B-97` | Müdür Gün İçi İzin Ver penceresi | ✅ seçili günün izinleri + "İptal et" |
| `Y-07` zil | Ders saatinde toplu zil ve gün ataması (aynı içerik), web zil ekranı | ✅ 409 "Bugün 15:25'ten sonra…", veri değişmedi; kalıcı not ve ret şeridi. Yeni `D-43` ⚪ (mesaj iki kez) |
| `Y-07` yayın | — | Sahada ölçülmedi (yayınlanmamış program yok; ölçmek veri değiştirirdi), birim testli |

Gece kapanışı ve sabah üretimi temiz: 1 Ekim'de Bekliyor kalmadı, 30 Eylül'ün yeniden açılmış 87 oturumu "Alınmadı"ya düştü,
2 Ekim'in 88 oturumu Cuma ziliyle (08:55–15:25) üretildi. Kapanan altı madde arşivde (§75). Açık: `B-96`, `B-98` (sahada zil değişimi —
son ders sonrası ölçülecek), `D-42` (mobil, Perşembe), `Y-07` sabah yayını + vekâlet açık noktası.

---

## 9. Öğrenci ve veli pencerelerinden devamsızlık yansıması (2 Ekim)

Okul ayarı: özürsüz sınır 10 gün, uyarı 5, toplam sınır 30, yarım gün eşiği %50, 3 geç = 0,5 gün. Her durumu taşıyan 12 öğrenci
(tam gün gelmedi, kısmi ≥%50 ve <%50, raporlu, izinli/gün içi izin + kulüp saati, geç, tek dersi alınmış gün) için öğrenci ve veli
hesabıyla `students/{id}/summary`, `records?month=`, `today` okundu; mobil veli ekranı gezildi.

| Durum | Örnek gün | Beklenen (kural) | Öğrenci/veli özeti | Doğru mu |
|---|---|---|---|---|
| Alınmış derslerin hepsi gelmedi | 1 Ekim, 4/4 (günün 8 dersinden 4'ü alınmış) | 1 gün | 1 gün | Kurala uygun, kural yanlış (`B-99`) |
| Kısmi ≥ %50 | 1 Ekim, 3/4 | 0,5 | 0,5 | ✅ |
| Kısmi < %50 | 1 Ekim, 1/4 | 0 | 0 | ✅ |
| Raporlu | 1 Ekim, 2 ders raporlu | özürsüze girmez | özürsüz 0, "İzinli/Raporlu Gün 2" | Etiket yanlış (`B-100`) |
| Gün içi izin + kulüp saati izinli | 1 Ekim | izinli 1 ders | özürlü 1 | Etiket yanlış (`B-100`) |
| Geç ×3 | 1 Ekim (deneme, geri alındı) | 0,5 gün | özet 0, dönem raporu 0,5 | ❌ `B-101` |
| Tek dersi alınmış gün | 2 Ekim 1. ders gelmedi | — | 1 gün, veli "1/10 gün" | ❌ `B-99` |

Doğru çalışanlar: öğrenci ve veli aynı değerleri görüyor; başka öğrencinin özeti 404; günlük kırılım etiketleri ("3 ders gelmedi",
"2 ders raporlu", "1 ders geç") ve bugünkü ders listesi doğru; dönem raporu özetle (geç dışında) tutarlı.

---

## 10. 2 Ekim gün sonu

- **Yoklamalar:** 88 oturumun 88'i tamamlandı. 1–5. derslerin bir kısmı API sabah 2 saatlik süre sınırıyla kapandığı için 12:12'de
  gecikmeli alındı; 6–8. dersler açılış saatinde (başlangıç − 5 dk). Kayıtlar: 758 geldi, 24 gelmedi (3 öğrenci gün boyu), 23 raporlu
  (3 öğrenci), 3 geç (yalnız 1. ders), 0 izinli (verilen tek izin ekrandan iptal edildi).
- **Hatırlatma:** 88 dersin 52'sine gitti; 6–8. dersler ders başlangıcı + 10 dk'dan önce alındığı için hatırlatma gerekmedi. API kapalı
  olduğu sabah aralığında gitmesi gereken hatırlatmalar kaçtı (ortam sorunu, ürün değil).
- **`Y-07` zil kabulü:** 15:37'de son dersten sonra aynı içerikli zil kaydı 204; bugüne dokunulmadı. Yeni `TB-265` ⚪ (aynı içerikte de
  gelecek bekleyen oturumlar siliniyor). `B-96` kapandı.
- **`Y-07` yayın kabulü:** sahada ölçülmedi (birim testli); 10-A "Revize Ediliyor" bekliyor.

**Açık kalan ölçümler:** `D-42` mobil ve `B-98` zil değişiminde kulüp saati taşıma (kulüp saati Perşembe; 8 Ekim etkinlikleri pazartesi
üretilecek) · `Y-07` sabah ilk dersten önce yayın + aynı güne vekâlet açık noktası · `Y-07` yayın kabulü ve yürürlük günü (10-A).

---

## 11. Devamsızlık hesabının düzeltilmesi ve gün kapanışı ölçümü (2 Ekim akşamı)

Kararlar: payda günün programdaki dersleri (kulüp saati dahil, iptal hariç); bugün 21:45 kapanışından sonra sayılır; o gün raporlu ders
varsa gelmedi dersleri de raporlu; özürlü devamsızlık gün olarak; geç birikimi her yerde. Kod: oksis-api `01f94a97`, oksis-ui `20bbe86`.

| Ölçüm | Saat | Sonuç |
|---|---|---|
| 12 öğrenci, bağımsız hesap = API (öğrenci = veli) | 18:30 | ✅; tek dersi alınmış gün 1 → 0, 4/8 → 0,5, bugün sayılmıyor |
| Aynı 12 öğrenci kapanıştan sonra | 21:48 | ✅; bugün gün boyu gelmeyen iki öğrenci +1 gün |
| Gün boyu raporlu üç öğrenci | 21:48 | ✅ özürlü 1 / 1 / 0,5 gün (8, 8, 7 ders) |
| Rapor önceliği (raporlu günde bir ders gelmedi) | 21:49 | ✅ özürlü 1, özürsüz 0, "Tam gün raporlu" (geri alındı) |
| Geç birikimi 3 geç | 21:50 | ✅ özet = veli = dönem raporu = 0,5 (geri alındı) |
| Kapanış işi | 21:47 | ✅ telafi koşusu, hata yok |

Kapandı: `B-99`, `B-100`, `B-101`. Ekranda ölçüm bekleyen: `X-24`, `D-44`, `D-45`, `TB-265` (pazartesi ders saati).

