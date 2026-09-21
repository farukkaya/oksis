# MEB Kaynaklı Katalog — Ekran Kontrol Senaryosu

**Hazırlandı:** 21 Eylül 2026 · `feat/meb-kaynakli-katalog` dalı (`oksis-api` 21 commit, `oksis-ui` 3 commit)
**Kapsam:** Merkez Platform'un dört ekranı + okul tarafında kademe/şube yüzeyi
**Neyi ölçer:** Müfredat Dilim 6-10'un ekranda karşılığı — katalog artık MEB belgelerinden
doğuyor, modal kalktı, hazırlık bir kademe oldu, kademeye yayılan çizelge bölünüyor.
**Kaynaklar:** `docs/teknik-analizler/mufredat/meb-kaynakli-katalog-tasarimi.md` ·
[[OKSİS - Bulgu Arşivi]] §51 · [[OKSİS - Bulgu Kayıt Defteri]] `TB-224`

---

## 1. ⚠️ ÖNCE BUNU OKU

### 1.1 Bilinen tıkaç: ekrandan YAYIM YAPILAMIYOR

Senaryo **B4'te duruyor**. Sunucuda "çözülmemiş ders eşlemesi onayı engeller" kuralı
bilinçli olarak **kaldırıldı** (tasarım §11: ders yayımda açılıyor, eski kural satırların
%91'ini engelliyordu). Ekran bu kararın **gerisinde kaldı** ve `Onayla` düğmesini hâlâ
kendisi kilitliyor:

| Yer | Satır | Ne diyor |
|---|---|---|
| `import-review-panel.tsx` | 133 | `const canApprove = unresolvedCount === 0` |
| `import-review-panel.tsx` | 242 | `disabled={busy \|\| !canApprove}` |
| `import-review-panel.tsx` | 166 | "Onay için N ders eşlemesi kaldı · Çözülmemiş eşleme varken çalışma onaylanamaz." |
| `import-match-page.tsx` | 182 | "**İçe aktarma yeni ders açmaz.** Çözülmemiş eşleme kalırken çalışma onaylanamaz." |
| `import-match-page.tsx` | 214 | "Çekirdek katalog bu çizelgeyi karşılamıyor … önce katalog beslenmeli" |

Dördü de artık **yanlış**. Sunucu onayı veriyor (`POST …/review` → `204`), yayım eksik
dersi kendisi açıyor. Yani bu bir metin tazeliği sorunu değil: **taze katalogda ekrandan
tek bir çizelge bile yayımlanamaz**, çünkü ilk belgede her satır "çözülmemiş" gelir.

> Bu senaryodaki mevcut veri API üzerinden yayımlandı; ekran yolu hiç koşmadı.
> Düzeltme yapılmadan B4-B6 adımları **ölçülemez**. Düzeltildiğinde bu bölüm silinir.

### 1.2 Bu tur yeni olan şeyler

| Değişiklik | Nerede görünür |
|---|---|
| "Ara alana taşı" modalı kalktı, tek düğme kaldı | A4 |
| Program kataloğu belgeden doğuyor, seed yok | A3, D2 |
| Hazırlık bir `GradeLevel` (`HAZIRLIK`, sıra `-1`), programdan türetiliyor | C3, E2 |
| Kademeye yayılan çizelge kademe başına program üretiyor | A4, C2, D3 |
| Ders/branş seed'leri silindi, katalog yayımdan doğuyor | C1 |
| Öğretmenlik alanları kararı 107 branş yazıyor | — (ekranı yok, F1'de dolaylı) |

### 1.3 Ortam

```bash
# API (göç uygulanmış olmalı — API başlangıçta MİGRATE ETMEZ)
cd ~/Repositories/oksis-api
dotnet ef migrations list | grep Pending     # boş çıkmalı
dotnet run --project src/Oksis.Api           # http://localhost:5112

# Web
cd ~/Repositories/oksis-ui/apps/web && npm run dev   # http://localhost:3000
```

**Hesaplar:**
- Platform: `platform@oksis.local` / `Oksis1234!`
- Okul müdürü: `mudur.s2@oksis.local` / `Oksis1234!` (Atatürk Anadolu Lisesi)
- ⚠️ İkinci platform hesabı `onaylayan@oksis.local` **artık yok** — dev DB 21 Eylül'de
  sıfırlandı, o hesap seed'de değil elle eklenmişti. İki kişi kuralını (B5) denemek
  isteyen önce `platform.accounts`'a yeniden eklemeli.

### 1.4 Veritabanının bu senaryoyu koşacak hâli

21 Eylül sıfırlaması sonrası ölçüldü:

| | Adet |
|---|---|
| İndirilmiş MEB belgesi | 31 (keşiften 30 + elle çekilen öğretmenlik alanları kararı) |
| — künyesi çözülmüş çizelge belgesi | 28 |
| — künyesi **okunamayan** belge (`Kind = Unknown`) | **2** |
| Türetilmiş eğitim programı | 31 (28 Lise · 2 Ortaokul · 1 İlkokul) |
| Yayımlanmış müfredat sürümü | **8** |
| Yayımlanmış satır | 1138 |
| Çekirdek ders | 101 |
| Branş / ders↔branş bağı | 107 / 145 |

Yayımlanmış sekiz sürüm (C bölümünün beklenen değerleri):

| Program | Kademe | Satır | Hazırlık satırı |
|---|---|---|---|
| Anadolu Lisesi | High | 161 | 0 |
| Fen Lisesi | High | 163 | 0 |
| **Hazırlık Sınıfı Bulunan Anadolu Lisesi** | High | 168 | **7** |
| **Hazırlık Sınıfı Bulunan Fen Lisesi** | High | 168 | **7** |
| **Hazırlık Sınıfı Bulunan Sosyal Bilimler Lisesi** | High | 162 | **19** |
| Sosyal Bilimler Lisesi | High | 142 | 0 |
| İlköğretim Kurumları (İlkokul Ve Ortaokul) — Ortaokul | Middle | 142 | 0 |
| **İlköğretim Kurumları (İlkokul Ve Ortaokul) — İlkokul** | **Primary** | **32** | 0 |

---

## 2. Senaryo A — MEB Kaynakları (`/platform/curriculum`)

**Amaç:** Belgenin bulunması, alınması, çizelgelerinin çözülmesi ve **hiç soru sorulmadan**
ara alana taşınması.

### A1 · Giriş
1. `http://localhost:3000/platform/login`
2. `platform@oksis.local` / `Oksis1234!`
3. **Beklenen:** `/platform/schools`'a düşer; sol menüde `Okullar · MEB Kaynakları ·
   İçe aktarmalar · Müfredat` görünür.

### A2 · Keşif listesi
1. `MEB Kaynakları`'na geç.
2. **Beklenen:** Tabloda **30** satır; sütunlar `Başlık · Tarih · Durum · İşlem`.
   Hepsinin durumu **Alındı** (21 Eylül süpürmesi hepsini indirdi) ve işlem sütununda
   `Aç` düğmesi var.
   > Bu otuzun **ikisinin künyesi okunamadı** (`Kind = Unknown`):
   > `14141220_2023-41_Guzel_Sanatlar.pdf` ve `17104202_202341guzelsanatlarhdc.pdf`.
   > Ne gösterildiklerini A7'de ölç.
3. `MEB'den Kontrol Et`'e bas.
   **Beklenen:** "Tarama başlatıldı" bildirimi; liste aynı 30 satırda kalır (yeni karar yok).
   **Ölçtüğü:** Süpürmenin tekilleştirmesi — aynı belgeyi ikinci kez indirmiyor.

### A3 · Bir belgenin çizelgeleri
1. Başlığı "Anadolu Lisesi Haftalık Ders Çizelgesi, Fen Lisesi Haftalık…" ile başlayan
   satırda `Aç`.
2. **Beklenen:** `Çizelgeler` bölümü açılır, **6** kart. Her kartta çizelge adı, sayfa
   numarası ve bir durum rozeti var; altısı da **Temiz** (İncelenmeli yok).
3. **Kritik:** Kartların üzerinde **per-kart düğme YOKTUR**. Tek düğme bölüm başlığındadır.
   **Ölçtüğü:** `TB-218` — eski tasarımda her çizelge ayrı set açmaya çalışıyor, aynı
   kararın ikinci çizelgesi `409` alıyordu.

### A4 · Ara alana taşıma — sıfır soru
1. `Çizelgeler` başlığındaki tek `Ara alana taşı` düğmesine bas.
2. **Beklenen:** **Hiçbir modal açılmaz.** Karar numarası, karar tarihi ve eğitim programı
   sorulmaz — üçü de belgeden okunur.
3. **Beklenen bildirim:** `6 çizelge ara alana taşındı — … satır · … ders eşlemesi
   çözülmedi.`
   > Bu belge zaten taşınmış durumda; ikinci basışta çalışmalar yeniden açılmaz,
   > var olanlar döner. Taze bir ölçüm isteyen A5'i kullansın.

### A5 · Kademeye yayılan çizelge (TB-223)
1. Listeden **"İlköğretim Kurumları (İlkokul ve Ortaokul) Haftalık Ders Çizelgesi"**
   satırını aç.
2. **Beklenen:** **1** çizelge kartı (belge tek çizelge taşır, 1-8 sınıflarını kapsar).
3. `Ara alana taşı`.
4. **Beklenen:** Bildirimde çizelge sayısı **1**, üretilen çalışma sayısı **2**.
   **Ölçtüğü:** Tek sayfa iki programa taşınıyor — İlkokul (1-4) ve Ortaokul (5-8).
   Öncesinde tek program doğuyor, kademesi `max(sınıf)=8` ile Ortaokul çıkıyor ve
   **İlkokul kademesinde hiç program olmuyordu**.

### A6 · Bozuk belge (TB-224 — açık bulgu)
1. Listede `Ortaöğretim Kurumları Haftalık Ders Çizelgeleri-2018` satırını aç.
2. **Şu an olan:** Çizelgeler çözülür ama bu belgeden doğmuş program adları katalogta
   bozuk: "Anadolu İmam Hatip **Lise6i**", "Millî Eğitim **Baklanlığı**", başlığa sızmış
   "10. 11. 12." sınıf etiketleri.
3. **Beklenen (karar sonrası):** Başlığı okunamayan belge program AÇMAMALI; belge
   "başlık okunamadı" diye işaretlenmeli.
4. Bu adımın çıktısını `TB-224`'e kanıt olarak ekle; **bulgu açık, kod değişmedi.**

### A7 · Künyesi okunamayan belge
1. `Güzel Sanatlar Liseleri Haftalık Ders Çizelgeleri'nde Değişiklik…` satırını aç
   (`14141220_2023-41_Guzel_Sanatlar.pdf`).
2. Bu belgenin kapağı çözülemedi: karar numarası, tarihi ve akademik yılı **yok**.
3. **Beklenen:** Ekran bunu **söylemeli** — "künye okunamadı" gibi açık bir durum.
   `Ara alana taşı` denenirse sunucu `CoverUnreadable` döner ve hata Türkçe görünmeli.
4. **Ölçtüğü:** Künyesiz belge sessizce "taşınabilir" görünmemeli. Ekran yalnız "Çizelge
   yok" diyorsa sebep gizlenmiş demektir — bunu not et.

---

## 3. Senaryo B — İçe aktarmalar ve yayım (`/platform/curriculum/imports`)

> ⚠️ B4'ten itibaren §1.1'deki tıkaç yüzünden **ölçülemez**. Düzeltilene kadar B1-B3
> koşulur, gerisi atlanır.

### B1 · Liste
1. `İçe aktarmalar`.
2. **Beklenen:** Sütunlar `Akademik yıl · Satır · Ders eşlemesi · Durum · Oluşturulma ·
   İşlem`. Mevcut sekiz çalışmanın hepsi **Published**.
   **Ölçtüğü:** Yayımlanmış çalışma terminaldir; listede düzenleme düğmesi çıkmamalı.

### B2 · Taze bir çalışma üret
1. `MEB Kaynakları`'na dön, **henüz taşınmamış** bir belge seç (28 çizelge belgesinin
   yalnız 2'si taşındı, **26'sı duruyor** — örneğin `Spor Lisesi Haftalık Ders Çizelgesi`).
2. `Aç` → `Ara alana taşı`.
3. `İçe aktarmalar`'a dön.
4. **Beklenen:** Yeni çalışma(lar) **Draft** ya da **NeedsReview** durumunda.
   Ders eşlemesi sütununda sıfırdan büyük bir "çözülmedi" sayısı var — ama artık
   %91 değil: katalogda 101 ders olduğu için çoğu satır eşleşmeli.
   **Ölçtüğü:** Katalog beslendikçe eşleşme oranının arttığı — kataloğun belgeden
   doğmasının asıl faydası.

### B3 · Ders eşlemesi ekranı
1. Çalışmanın `İşlem` sütunundan detayına gir (`/platform/curriculum/imports/[id]`).
2. **Beklenen:** `Ders eşlemesi` başlığı, satır listesi, her satırda öneri ve karar
   düğmeleri; arama kutusu çalışıyor.
3. ⚠️ **Şu an yanlış olan iki metin** — düzeltme listesine yaz:
   - Başlık altı: "İçe aktarma yeni ders açmaz. Çözülmemiş eşleme kalırken çalışma
     onaylanamaz." → İkisi de artık geçersiz. Doğrusu: *katalogda karşılığı olmayan ders
     yayımda açılır.*
   - Uyarı kutusu: "Çekirdek katalog bu çizelgeyi karşılamıyor … önce katalog beslenmeli
     ya da satırlar kapsam dışı bırakılmalı." → Kullanıcıyı artık gereksiz bir işe
     yönlendiriyor.

### B4 · Onay kapısı ⛔ TIKAÇ
1. Çalışmada çözülmemiş eşleme varken `Onayla` düğmesine bak.
2. **Şu an:** Düğme **pasif**, üstünde "Onay için N ders eşlemesi kaldı" uyarısı var.
3. **Beklenen:** Düğme **etkin** olmalı. Çözülmemiş eşleme bir uyarıdır, kapı değil.
4. Doğrulama (ekran düzelene kadar API'den):
   ```bash
   curl -s -X POST "http://localhost:5112/api/v1/platform/curriculum-imports/<runId>/review" \
     -H "Authorization: Bearer <token>" -H 'Content-Type: application/json' \
     -d '{"decision":"Approve","reason":null}' -o /dev/null -w '%{http_code}\n'
   # beklenen: 204
   ```

### B5 · İki kişi kuralı
1. Bir satırın eşlemesini elle düzelt.
2. Aynı hesapla `Onayla`.
3. **Beklenen:** Sunucu reddeder; ekran "Onayı ara alanı düzelten kullanıcı veremez"
   mesajını **olduğu gibi** gösterir (düğmeyi sessizce pasifleştirmez).
4. ⚠️ İkinci platform hesabı silindi (§1.3); bu adım hesap yeniden eklenmeden koşulamaz.

### B6 · Yayım
1. Onaylanmış çalışmada `Yayımla`.
2. **Beklenen:** "Müfredat sürümü üretildi (…)" ve durum **Published**.
3. **Kritik ölçüm:** Yanıttaki `skippedRowCount` **0** olmalı. Sıfır değilse satır sessizce
   düşmüş demektir — `TB-222`'nin tam olarak kapattığı şey bu.
4. Aynı çalışmada ikinci kez `Yayımla`: yeni sürüm üretmemeli, var olanı dönmeli.

---

## 4. Senaryo C — Müfredat kataloğu (`/platform/curriculum/catalog`)

### C1 · Dersler belgeden doğdu
1. `Müfredat` ekranını aç.
2. Okul türü seçicisinde **Anadolu Lisesi**'ni seç.
3. **Beklenen:** 161 satır; dersler MEB'in kendi kategori başlıkları altında gruplu
   (`Ortak dersler`, `İnsan, Toplum ve Bilim`, `Matematik` …), saatler sınıf sütunlarında.
   **Ölçtüğü:** Kategori `sourceCategory`'den geliyor — elle yazılmış `category` alanı
   kaldırıldı. Grup başlıkları belgenin yazdığı şey olmalı, uydurma bir liste değil.

### C2 · Kademe ayrımı (TB-223)
1. Seçicide **"İlköğretim Kurumları (İlkokul Ve Ortaokul) — İlkokul"**.
2. **Beklenen:** Sınıf sütunları **yalnız 1, 2, 3, 4**. Satır sayısı **32**.
3. Seçicide **"… — Ortaokul"**.
4. **Beklenen:** Sınıf sütunları **yalnız 5, 6, 7, 8**. Satır sayısı **142**.
5. **Kritik:** İlkokul tablosunda 5-8 sütunu, ortaokul tablosunda 1-4 sütunu
   **görünmemeli**. Görünüyorsa kademe süzgeci çalışmıyor demektir ve iki programın da
   müfredatı 1-8'in tamamı olmuş.

### C3 · Hazırlık sütunu (TB-222)
1. Seçicide **"Hazırlık Sınıfı Bulunan Sosyal Bilimler Lisesi"**.
2. **Beklenen:** Sınıf sütunları `HAZIRLIK · 9 · 10 · 11 · 12` — hazırlık **en solda**,
   9'un öncesinde. Toplam 162 satır, hazırlık sütununda **19** dolu hücre.
3. "Hazırlık Sınıfı Bulunan Anadolu Lisesi" ve "… Fen Lisesi" için hazırlık hücresi
   sayısı **7**.
4. Karşılaştırma: **"Anadolu Lisesi"** (hazırlıksız) seçildiğinde `HAZIRLIK` sütunu
   **hiç olmamalı**.
   **Ölçtüğü:** Hazırlık saatleri eskiden sessizce düşüyordu; 33 satır hiç yayımlanmıyordu.

---

## 5. Senaryo D — Okullar (`/platform/schools`)

### D1 · Program zorunlu
1. `Okullar` → `Okulu aç ve müdürü davet et` formu.
2. Okul türü **Lise** seç.
3. **Beklenen:** `Eğitim programı` seçicisi dolu ve **boş seçenek yok**. Program
   seçilmeden `Aç` düğmesi etkinleşmemeli.
   **Ölçtüğü:** "Kademenin varsayılan programı" kavramı kalktı (`IsDefault` silindi);
   okul programını açıkça seçer.

### D2 · Yayımlanmamış program işaretli
1. Aynı seçiciyi aç.
2. **Beklenen:** Müfredatı yayımlanmamış programların adının sonunda
   **"— müfredatı yayımlanmadı"** yazıyor. Listede 28 lise programı var ama yalnız 6'sının
   müfredatı yayımlı; kalan 22'si bu etiketi taşımalı.
   **Ölçtüğü:** Program "seçilebilir ama işaretli" kararı (kullanıcı kararı, tasarım §2.3).

### D3 · İlkokul artık açılabiliyor (TB-223)
1. Okul türü **İlkokul** seç.
2. **Beklenen:** Program seçicisinde **"İlköğretim Kurumları (İlkokul Ve Ortaokul) —
   İlkokul"** var ve müfredatı yayımlı (etiketsiz).
3. **Öncesinde:** Bu kademede hiç program yoktu, ipucu "Bu kademe için program yok"
   diyordu ve ilkokul **hiç açılamıyordu**.
4. Ortaokul türünü de dene: "… — Ortaokul" ve "T.C. Millî Eğitim Bakanlığı İmam Hatip
   Ortaokulu" çıkmalı.

### D4 · Kademe süzgeci
1. Okul türünü Lise ↔ Ortaokul ↔ İlkokul arasında değiştir.
2. **Beklenen:** Program listesi her seferinde **o kademenin** programlarıyla yenilenir ve
   seçim önceki kademede kalmaz.
   **Ölçtüğü:** `TB-215` — "Lise" açılırken ortaokul programı seçilememeli.

### D5 · TB-224'ün görünür hasarı
1. Lise program listesini okuyup **"Anadolu İmam Hatip Lise6i Seçmeli Dersleri (A Grubu)
   10. 11. 12."** satırını bul.
2. **Beklenen (karar sonrası):** Böyle bir satır listede olmamalı.
3. Mevcut dev verisinde `OKSİS Dev Okulu` ve `Atatürk Anadolu Lisesi` bu programa bağlı —
   ekranda okul satırında da görünür. `TB-224`'e kanıt ekle.

---

## 6. Senaryo E — Okul tarafı: kademe ve şube

**Giriş:** `http://localhost:3000/login` · `mudur.s2@oksis.local` / `Oksis1234!`

### E1 · Kademeler kartı
1. `Ayarlar` → `Yapı` sekmesi → `Kademeler` kartı.
2. **Beklenen:** Anaokulu / İlkokul / Ortaokul / Lise satırları; okulun açık kademesi işaretli.

### E2 · Hazırlık programdan geliyor (TB-222, ikinci ayak)
Hazırlığın **anahtarı yoktur**. Kademeler kartında Lise satırı yalnız 9-12'yi açıp kapatır;
hazırlık, okulun seçtiği eğitim programının müfredatında hazırlık satırı varsa açıktır.
Kural sunucudadır (`PreparatoryGradeLevelResolver`), ekran yalnız gösterir.

**Hazır test okulları (21 Eylül'de açıldı):**

| Okul | Program | Beklenen seviyeler |
|---|---|---|
| `Hazirlikli Fen Lisesi` | Hazırlık Sınıfı Bulunan Fen Lisesi | `HAZIRLIK · 9 · 10 · 11 · 12` |
| `Duz Fen Lisesi` | Fen Lisesi | `9 · 10 · 11 · 12` |

İkisi de **aynı okul türüyle** (Lise), aynı formdan açıldı. Fark yalnız seçilen programdan
geliyor ve kullanıcıya hazırlık **hiç sorulmadı**.

1. Lise kademesini kapat, sonra yeniden aç.
2. **Beklenen:** Hazırlık durumu **değişmez**. Lise'yi kapatmak hazırlığı düşürmez, açmak
   hazırlığı getirmez.
3. **Beklenen:** Hazırlığı olan okulda Lise satırının altında **"· hazırlık sınıfı dahil"**
   yazar; olmayan okulda yazmaz.
4. **Beklenen:** Lise satırının alt yazısı **"9.–12. sınıflar"** — artık doğru, çünkü hazırlık
   o anahtarın parçası değil.
5. **Sunucu kontrolü** (ekran eskirse diye kural sunucuda): hazırlığı olmayan okula hazırlık
   dahil bir gövde gönder → sunucu **atmalı**.
   ```bash
   curl -X PUT http://localhost:5112/api/v1/school-settings/grade-levels \
     -H "Authorization: Bearer <okul token>" -H 'Content-Type: application/json' \
     -d '{"gradeLevelIds":["<hazırlık id>","<9 id>",…]}'
   # 204 döner; GET'te hazırlık YOKTUR
   ```
   **Ölçtüğü:** `TB-32` — ekranın uyguladığı ama sunucunun bilmediği kural yok sayılır.
   Burada tersi de geçerli: ekran göndermese bile sunucu hazırlığı ekler.

### E3 · Sıralama
1. Şube oluşturma seçicisinde seviyelerin sırasına bak.
2. **Beklenen:** `Hazırlık Sınıfı · 9. Sınıf · 10. Sınıf · 11. Sınıf · 12. Sınıf` —
   hazırlık **başta**, sonda değil.
   **Ölçtüğü:** Hazırlığın sıra numarası `-1`; 9'dan önce sıralanması kasıtlı, çünkü
   hazırlık hazırlıklı bir lisenin **giriş** kademesidir.

---

## 7. Senaryo F — Derinlik (isteğe bağlı, veri kurulumu ister)

### F1 · Hazırlık terfisi
**Ön koşul:** Hazırlık seviyesi açık bir okulda hazırlık şubesi + öğrenci.
1. `Akademik Sezonlar` → sezon devri önizlemesi.
2. **Beklenen:** Hazırlık şubesi satırı **Promote** ve hedefi **9. sınıf**.
   **Asla Graduate olmamalı** — bu, düzeltme öncesi hazırlığı bitiren sınıfın tamamını
   mezun ilan ediyordu.
3. Hazırlık aynı zamanda **giriş kademesi** olduğu için boş bir `NewBranch` satırı da
   üretilmeli.
4. Entegrasyon testi karşılığı: `SeasonRolloverPreviewTests.Rows_Preparatory_PromotesToNinthGradeAsync`.

### F2 · Hazırlık öğrencisinin hesabı
1. Hazırlık şubesine öğrenci kaydet.
2. **Beklenen:** Öğrenciye **kendi hesabı açılır**.
   **Ölçtüğü:** `IsSmallGrade(-1)` false olmalı. Sınıflandırıcıda hazırlık `<= 0` koluna
   düşseydi anaokulu sayılır ve E2.6 "yalnız veli hesabı" istisnası yanlışlıkla
   uygulanırdı — hazırlık öğrencisi 14 yaşındadır.

---

## 8. Regresyon kontrol listesi

Bu turda **değişmemesi gereken** şeyler:

- [ ] Lise çizelgeleri hâlâ **tek** program üretiyor; kodları ve adları değişmedi
      (`ANADOLU-LISESI`, `FEN-LISESI`, …). Kademe eki yalnız bölünmüş çizelgede olmalı.
- [ ] Hazırlıklı lise çizelgesi **bölünmüyor** (hazırlık sütunu da Lise sayılır).
- [ ] `Anadolu Lisesi` ve `Fen Lisesi` gibi hazırlıksız programlarda `HAZIRLIK` sütunu yok.
- [ ] Kademeler kartında Anaokulu / İlkokul / Ortaokul satırları etkilenmedi.
- [ ] Var olan okulların şube seviyeleri değişmedi (göç yalnız **ekliyor**, 0-12'ye dokunmuyor).
- [ ] Öğrenci terfisi 9→10→11→12 aynı çalışıyor, 12 hâlâ Graduate.

---

## 9. Bulgu kaydı

Her sapma için:
1. Ekran görüntüsünü `docs/kanit/2026-09-21-<ekran>.png` olarak kaydet.
2. Bulguyu [[OKSİS - Bulgu Kayıt Defteri]]'ne yaz — sıradaki boş teknik borç ID'si
   **`TB-225`**.
3. Blokta **ne ölçüldüğü** dursun: hangi ekran, hangi veri, hangi sayı. "Bozuk görünüyor"
   bir bulgu değildir.

**Bu senaryodan çıkması beklenen, hâlihazırda bilinen sapmalar:**

| # | Sapma | Adım |
|---|---|---|
| 1 | Ekran `Onayla`'yı kilitliyor; sunucu kuralı kaldırdı — **yayım ekrandan yapılamıyor** | B4 |
| 2 | "İçe aktarma yeni ders açmaz" ve "önce katalog beslenmeli" metinleri geçersiz | B3 |
| 3 | `TB-224` — bozuk metin katmanlı 2018 belgesi katalogta çöp program adı açtı | A6, D5 |

İlk ikisi bu dalın kendi eksiği (ekran, sunucu kararının gerisinde kaldı); üçüncüsü
defterde açık bulgu.

> **Kapandı (21 Eylül):** "Hazırlık, Lise kademesiyle birlikte otomatik açılıyor" sapması
> düzeltildi — hazırlık artık programdan türetiliyor, kademe anahtarının dışında. E2'ye bakın.
