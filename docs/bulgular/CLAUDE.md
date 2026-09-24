# Bulgu Klasörü — Önek Sözlüğü

> Bu klasördeki defterlerde kullanılan **tüm ID önekleri** ve yazma kuralları tek yerde.
> Yeni bulgu, karar veya engel yazmadan önce bu dosyayı oku.
> Kanonik sayaç: [[OKSİS - Bulgu Kayıt Defteri]] başındaki **"Sıradaki boş ID"** satırı.

---

## 1. Bulgu önekleri (sayaçlı)

| Önek | Açılımı | Ne zaman kullanılır | Örnek |
|---|---|---|---|
| `B-##` | **Bulgu** (fonksiyonel) | Bir işlev yanlış çalışıyor: yanlış sonuç, hata, kırık akış | `B-20` |
| `D-##` | **Dizayn** (tasarım / UX) | Ekran, yerleşim, metin, kullanılabilirlik sorunu; işlev doğru ama deneyim kötü | `D-15` |
| `V-##` | **Validasyon** (& iş kuralı) | Girdi doğrulaması veya iş kuralı eksik/yanlış/gerekçesiz | `V-04` |
| `X-##` | **Çapraz kesen** iş | Tek modüle sığmayan, birden çok modülü/depoyu etkileyen konu | `X-11` |
| `TB-##` | **Teknik Borç** | Kod taramasından çıkan; kullanıcı bugün görmese de biriken risk | `TB-139` |
| `E-##` | **Eksik** özellik / ekran | Olması gereken ama hiç yazılmamış yüzey veya yetenek | `E-16` |
| `ENG-##` | **Engel** | İşi/testi durduran, etrafından dolaşılamayan sorun. Uzun belgesi `engeller/` altında ayrı dosya | `ENG-02` |

## 2. Karar önekleri (sayaçlı)

| Önek | Açılımı | Ne zaman kullanılır | Nerede |
|---|---|---|---|
| `K-##` | **Karar** (bekleyen) | Kullanıcının/ürünün vermesi gereken karar; netleşmeden ilgili iş başlamaz | [[OKSİS - Yapısal Kararlar ve Eksikler]]; uzun belgesi `kararlar/K-## - Başlık.md` |
| `Y-##` | **Yapılmış** (verilmiş) karar | Karara bağlanmış, artık uygulanan hüküm | [[OKSİS - Yapısal Kararlar ve Eksikler]] |

`K-##` içindeki alt maddeye bölümle atıf yapılır: `K-12 §A1`.

---

## 3. Sayaç kuralları

- Sayaçlar **üç dosya arasında ortaktır**: Bulgu Kayıt Defteri + Bulgu Arşivi + Yapısal Kararlar ve Eksikler.
- `E-##` sayacı defter ile karar panosu arasında **ortak** — iki yerde ayrı sayılmaz.
- `K-##` sayacı defterdeki dipnotta durur (`K-16`…`K-26` modül belgelerinde kullanılmış).
- Yeni ID vermeden önce **üç dosyada birden `grep`** at; sonra "Sıradaki boş ID" satırını güncelle.
- Kapanmış ID **yeniden kullanılmaz**.

## 4. Öncelik işaretleri (başlığın sonunda)

| İşaret | Anlamı |
|---|---|
| 🔴 | Kritik — tenant izolasyonu, veri/çıktı kaybı, akışı bütünüyle bloklayan |
| 🟠 | Yüksek — işlev yanlış çalışıyor, veri/yetki güveni zedeleniyor |
| 🟡 | Orta — işlev eksik ama alternatif yol var; borç birikiyor |
| ⚪🟢 | Düşük — kozmetik, temizlik, adlandırma |
| ❓ | Netleşmemiş — önceliği henüz ölçülmedi |

Başlık biçimi: ``### `TB-179` · Kısa, belirtiyi söyleyen cümle 🟡``

## 5. Yaşam döngüsü

- **Açık** madde → [[OKSİS - Bulgu Kayıt Defteri]] (modül bazlı gruplu).
- **Kapanan** madde → bloğun tamamı kanıtıyla (commit, ölçüm, `kanit/` görseli)
  [[OKSİS - Bulgu Arşivi]]'ne taşınır; defterde **hiç iz bırakmaz**.
- **Yarısı kapanan** madde defterde açık kalır; kapanan ayağın kanıtı arşive gider, defterde tek cümlelik atıf kalır.
- Kapanmayıp **bölünen** madde yeni ID'lerle ayrılır (örn. `TB-165` → `TB-230` + `TB-231`).
- Kullanıcının ham notları `Kullanıcı Bulguları.md`'de durur; ID'lenip deftere işlenir, ham dosyaya dokunulmaz.

---

## 6. Karıştırılmaması gerekenler (bulgu ID'si DEĞİL)

Defter metninde geçen ama sayaca girmeyen kodlar:

| Kod | Ne olduğu |
|---|---|
| `EX-H##` / `EX-S##` | Sınav takvimi kural kodları (`H` sert kural, `S` yumuşak kural) — kodda tanımlı |
| `S-#` | Bir analiz/spec belgesinin kendi açık soru / madde numarası (örn. kulüp analizi `S-9`…`S-15`) |
| `BR-XX-###` | Domain notlarındaki iş kuralı numarası (örn. `BR-SS-003`) |
| `DYR-F-##` | Duyurular planının kendi kural numarası |
| `Debt-XX-#` | Modül belgelerindeki yerel borç numarası (örn. `Debt-AG-8`) |
| `§##` | Arşivdeki kapanış turu bölümü (örn. `Bulgu Arşivi §48`) |
