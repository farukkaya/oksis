# Ödev Modülü — Test Rehberi

**Hazırlandı:** 27 Ağustos 2026 · Faz 1-5 tamamlandıktan sonra
**Kapsam:** 28 uç (26 `HomeworkController` + 2 `SchoolSettingsController`)

---

## 1. ⚠️ ÖNCE BUNU OKU — yalnız BİR okul test edilebilir

Ödev vermek üç şeyi aynı anda ister: **bugünü içeren bir dönem**, o dönemde
**yayınlanmış bir ders programı**, ve öğretmenin o programda **dersi**.
Seed'de bu üçü yalnız tek okulda buluşuyor:

| Okul | Bugünü içeren dönem | Yayınlanmış program | Test edilebilir mi |
| --- | --- | --- | --- |
| **s2 · Atatürk Anadolu Lisesi** | 17-28 Ağustos 2026 ✔ | ✔ (27 Ağustos'ta yayınlandı) | **EVET** |
| s1 · OKSİS Dev Okulu | ✘ | — | Hayır |
| s3 · Cumhuriyet İlkokulu | 24-28 Ağustos ✔ | ✘ (ders programı yok) | Hayır |
| s4 · OKSİS Test Lisesi | ✘ | — | Hayır |

**Diğer okullarda `form-context` boş döner ve "Yeni Ödev" formunda şube listesi
boş kalır.** Bu bir kusur değil: taslak ders programı öğretmene ders verme
kapsamı üretmez. Ama test ederken kafa karıştırır — s2 ile çalış.

> **Not:** s2'nin dönemi **28 Ağustos'ta bitiyor.** Sonrasında hiçbir okulda
> bugünü içeren dönem kalmaz ve ödev oluşturulamaz. O gün geldiğinde ya dönem
> tarihini uzat ya da s3'ün ders programını yayınla
> (`POST /api/v1/timetable/programs/{id}/publish`).

---

## 2. Kullanıcı bilgileri

**Parola — hepsinde aynı:** `Oksis1234!`

### Ana test kadrosu (s2 · Atatürk Anadolu Lisesi)

| Rol          | E-posta                      | Kim                                | Ne için                                                |
| ------------ | ---------------------------- | ---------------------------------- | ------------------------------------------------------ |
| **Öğretmen** | `ogretmen.s2.02@oksis.local` | Şeyma Özdemir                      | **Ana öğretmen.** Matematik: 10-B · 11-A · 11-B · 12-B |
| **Yönetici** | `mudur.s2@oksis.local`       | Ali Çelik                          | Pano, filtreler, politika, vekâleten yayın             |
| Müdür yrd.   | `mudyrd.s2@oksis.local`      | —                                  | İkinci yönetici (yetki farkı testi)                    |
| **Öğrenci**  | `ogrenci.s2.010@oksis.local` | Yasemin Türk · 10-B · No 202620010 | Ödev listesi, detay, teslim                            |
| **Veli**     | `veli.s2.010@oksis.local`    | —                                  | Yasemin'in velisi; salt okunur ikiz                    |

### 10-B şubesinin tamamı (8 öğrenci — ızgara testi için)

| No | Ad | Öğrenci | Veli |
| --- | --- | --- | --- |
| 202620010 | Yasemin Türk | `ogrenci.s2.010@` | `veli.s2.010@` |
| 202620019 | Hakan Karaca | `ogrenci.s2.019@` | `veli.s2.019@` |
| 202620021 | Mert Ay | `ogrenci.s2.021@` | `veli.s2.021@` |
| 202620039 | Cem Hız | `ogrenci.s2.039@` | `veli.s2.039@` |
| 202620049 | Ömer Öztürk | `ogrenci.s2.049@` | `veli.s2.049@` |
| 202620050 | Yasemin Aydın | `ogrenci.s2.050@` | `veli.s2.050@` |
| 202620056 | Ebru Çetin | `ogrenci.s2.056@` | `veli.s2.056@` |
| 202620058 | Gizem Polat | `ogrenci.s2.058@` | `veli.s2.058@` |

*(Hepsi `@oksis.local`)*

### Diğer öğretmenler (çok dersli / farklı şube senaryoları)

| E-posta | Ad | Dersler ve şubeler |
| --- | --- | --- |
| `ogretmen.s2.05@` | Cem Kılıç | İngilizce (6 şube) · Türkçe 12-B · Din Kültürü 12-A |
| `ogretmen.s2.07@` | Deniz Çetin | Beden Eğitimi (6 şube) · Din Kültürü 11-A/11-B |
| `ogretmen.s2.03@` | Emre Arslan | Fen Bilimleri 11-A/11-B · Görsel Sanatlar 10-A |
| `ogretmen.s2.01@` | İsmail Aydın | Bilgisayar 10-B · Sosyal Bilgiler 12-A |

**Diğer okullar:** aynı kalıp — `mudur.s{1,3,4}@`, `ogretmen.s{N}.{01-15}@`,
`ogrenci.s{N}.{001-…}@`, `veli.s{N}.{001-…}@`.

---

## 3. Ortam

| Bileşen | Adres | Başlatma |
| --- | --- | --- |
| .NET API | `http://localhost:5112` · LAN: `http://192.168.1.112:5112` | `dotnet run --project src/Oksis.Api` |
| Web (Next) | `http://localhost:3000` | `oksis-ui/apps/web` → `npm run dev` |
| Metro / Expo | `http://localhost:8081` | `oksis-ui/apps/mobile` → `npm run dev:sim` |
| SQL Server | `localhost:1433` · db `oksis_dev` | `docker compose up` |

**Web'i gerçek API'ye bağlamak için** `apps/web/.env.local` içinde
`NEXT_PUBLIC_API_MOCKING=disabled` olmalı (varsayılan `enabled` = MSW mock'ları).
Değiştirdikten sonra dev sunucusunu yeniden başlat.

**Mobil hedefler:**
- Simülatör/emülatör → `npm run dev:sim` (`localhost:5112`, Android'de `adb reverse`)
- Gerçek cihaz iOS → `npm run dev:device` (LAN IP + `lan-proxy.js`)
- Gerçek cihaz Android → `npm run dev:device:android` (`adb reverse`)

**Hangi ekran nerede:**

| Yüz | Web | Mobil |
| --- | --- | --- |
| Öğretmen listesi · detay · ızgara · oluşturma | ✔ | ✔ |
| Yönetici listesi + filtreler | ✔ | — |
| Öğrenci · veli | ✘ ("Bu ekran hazırlanıyor") | ✔ |
| Yoğunluk panosu | ekran dosyası var, **rota bağlı değil** | — |

---

## 4. Test akışları

### A — Öğretmen: oluştur → yayınla (`ogretmen.s2.02`, web)

1. **Ödevler → Yeni Ödev.** Beklenen: Ders **Matematik** ("Görevlendirmenizden"),
   şubeler **10-B · 11-A · 11-B · 12-B**, altta **"Son: <en son ödev verdiğin şube>"** ipucu.
   *Şube listesi boşsa yanlış okuldasın (bkz. §1).*
2. Başlık gir, **"Bu Cuma"** çipine bas. Beklenen: **"Cuma, 28 Ağustos"**.
   *Bu tarih sunucunun gününden türer; cihazın saatinden değil.*
3. **Bağlantı ekle** → `https://ornek.test/video` + ad → **Ekle**.
4. Şube seç → **Yayınla** → onay diyaloğu **"N öğrenci ve velileri bildirim alacak"**
   ve **"Yayın geri alınamaz"** demeli → onayla.
5. Beklenen: detaya düşer, durum **Yayınlandı**, sayaç **0/N kontrol edildi**, ek listede.

**Ayrıca dene:** başlığı boş bırakıp yayınla → **"Başlık zorunludur"**.

### B — Öğretmen: ızgara ve işaretleme

1. Ödeve gir. Beklenen: 8 satır, gerçek ad + okul numarası, hepsi **İşaretlenmedi**.
2. Bir öğrenciye **Muaf** → gerekçe sorulmalı. Boş bırak → **reddedilmeli**.
3. Gerekçe yaz ("Raporlu") → kaydedilmeli.
4. Aynı öğrenciyi **Tamamlandı** yap → **muafiyet gerekçesi DÜŞMELİ**
   (ızgarada "Tamamlandı — Raporlu" gibi çelişen satır kalmamalı).
5. Bir öğrenciye **Eksik** → sayaçlar anında güncellenmeli.
6. **Yalnız işaretlenmemişler** süzgeci → kalanları göstermeli.
7. Toplu tamamlama → **yalnız işaretlenmemişler** tamamlanmalı; zaten
   işaretlenmiş satırlar DEĞİŞMEMELİ.

### C — Durum makinesi (hata yolları)

| Deneme | Beklenen |
| --- | --- |
| Taslağı **Kapat** | 409 — yalnız yayındaki kapatılır |
| Yayınlanmışı **Sil** | 409 — yalnız taslak silinir |
| İkinci kez **Yayınla** | 409 — yayın geri alınamaz |
| **İptal**, 15 karakterden kısa gerekçe | 400 |
| İptal, geçerli gerekçe | 200, durum **İptal edildi**, gerekçe öğrenciye görünür |
| Kapanmış ödevi **düzenle** | 409 |

### D — Öğrenci (`ogrenci.s2.010`, mobil)

1. **Ödevlerim** sekmesi. Beklenen: "BU HAFTA" grubu, ders adı, öğretmen adı,
   ve **B akışında verdiğin durum rozeti** (Eksik/Tamamlandı).
2. Ödeve gir. Beklenen: **"En fazla 5 dosya"** (sunucudan gelir, ekranda sabit değil),
   **"Çalışmamı yükle"** açık.
3. Fotoğraf yükle → kart **"1/5 dosya"** olmalı.
4. **Öğretmen ekranına dön:** o öğrencinin satırında yükleme sayısı **1** görünmeli.
5. Dosyayı sil → sayı düşmeli.
6. Altı dosya yüklemeyi dene → **altıncı reddedilmeli**.

**Şema kontrolü:** öğrenci detayında **muafiyet gerekçesi HİÇ görünmemeli** —
boş bile değil, alan yok.

### E — Veli (`veli.s2.010`, mobil)

1. **Ödevler** sekmesi. Beklenen: üstte **"Yasemin Türk · 10-B / Görüntülenen öğrenci"**.
2. Ödeve gir. Beklenen: aynı bilgiler ama **yükleme/silme yok** — buton bile olmamalı.
3. Çocuğun yüklediği dosyalar **görünür**, açılabilir, silinemez.

### F — Yönetici (`mudur.s2`, web)

1. **Ödevler.** Beklenen: okul geneli liste + **Öğretmen · Şube · Ders · Durum ·
   Son teslim** filtreleri. Öğretmen listesinde 15 gerçek isim.
2. Öğretmen süzgeci → yalnız o öğretmenin ödevleri.
   *Öğretmene göre SIRALAMA olmamalı — pano bir yük ölçerdir, karne değil.*
3. Durum süzgecinde **"Taslak — ayrılan öğretmen"** seçeneği olmalı.
   *Çalışan öğretmenin taslağı idareye GÖRÜNMEZ.*
4. **Ayarlar → Ödev politikası:** hatırlatma saati (0-72), veli bildirimi
   (kapalı/günlük özet/anlık), günlük yoğunluk eşiği (1-10).
   73 gir → **reddedilmeli**.

### G — Kapsam kapıları (en önemli güvenlik testi)

| Kim | Ne dener | Beklenen |
| --- | --- | --- |
| Öğretmen | Yönetici listesi | **403** |
| Yönetici | Bir ödevi kapatmak | **404** (kapatma sahibindir) |
| Öğretmen A | Öğretmen B'nin ödevini düzenlemek | **404**, 403 değil |
| Veli | Başka çocuğun ödevleri (`studentId` değiştir) | **404** |
| Veli | Dosya yüklemek | **404** |
| Öğrenci | Öğretmen listesi (`/homework/mine`) | **200 + boş liste** |

*Son satır kasıtlı: kapsamı olmayan kimlik boş liste alır, 403 değil.*

---

## 5. Bilinen sınırlar — bunları kusur sanma

1. **Rehber öğretmen listesi (`/homework/homeroom`) her zaman boş** — seed'de
   hiçbir şubeye rehber öğretmen atanmamış. Uç çalışıyor, veri yok.
2. **Vekâleten yayın (uç 4) sahiplik ATAMIYOR.** Yayınlandıktan sonra ızgarayı
   işaretleme kapısı hâlâ sahip öğretmene bakıyor ve sahip okuldan ayrılmış —
   yani o ödevi **kimse işaretleyemez**. Ürün kararı bekliyor.
3. **İdari teslim kaldırma (uç 23) kapanmış ödevde 409 verir.** İdare kapanmış
   bir ödevin yanlış yüklenmiş dosyasını kaldıramıyor.
4. **Uç 4 ve 23'ün mock karşılığı yok** (TB-82) — davranışları sözleşmenin
   yalnız tip bildirimine göre yazıldı.
5. **Denetim izi yazılıyor ama okuyan uç yok** — `/homework/{id}/audit`
   sözleşmede bildirilmemiş.
6. **Bildirimler yalnız portal kanalında.** E-posta kanalı depo genelinde
   uygulanmamış (TB-24).
7. **Hafta sonu son teslim tarihi kabul ediliyor** ama yoğunluk panosu Pzt-Cum
   sayıyor — pazar teslimli ödev panoda hiç görünmez.
8. **Zamanlanmış işler** (hatırlatma, günlük özet) Hangfire'da kayıtlı;
   tetiklenmeleri için ilgili saatin gelmesi ya da Hangfire panelinden elle
   çalıştırılmaları gerekir.

---

## 6. Hızlı API duman testi (ekransız)

```bash
API=http://localhost:5112/api/v1
T=$(curl -s -X POST $API/auth/account/login -H 'Content-Type: application/json' \
  -d '{"identifier":"ogretmen.s2.02@oksis.local","password":"Oksis1234!","channel":"web"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['accessToken'])")

curl -s -H "Authorization: Bearer $T" $API/homework/form-context   # şube listesi dolu mu?
curl -s -H "Authorization: Bearer $T" $API/homework/mine           # kendi ödevleri
```

`form-context` boş `classRooms` dönüyorsa §1'e dön — yanlış okul ya da
yayınlanmamış ders programı.
