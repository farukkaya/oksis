# MEB Müfredatı — Dilim 5: Merkez Müfredat Ekranları (İlk Dilim) Uygulama Planı

**Goal:** Merkez kullanıcısının MEB haftalık ders çizelgesini **ekranda** görüp ara alana
taşıyabilmesi. Dilim 2–4 backend sözleşmesini kurdu ama hiçbirinin ekranı yok; bugün bu
yüzeye yalnız Postman'den erişilebiliyor.

**Kapsam (kullanıcı kararı, 2026-09-20):** keşif → indirme → ayrıştırma → ara alana taşıma.
Satır inceleme / ders eşleme, onay ve yayım ekranları **sonraki dilim**. Gerekçe: bu dilim
tek platform hesabıyla uçtan uca denenebilir; onay ekranı iki kişi kuralı yüzünden bugün
denenemez (ikinci platform hesabı yok, karar 0019 bekliyor).

**Architecture:** `oksis-ui` monorepo kurallarına göre üç katman — `packages/api` (uçlar +
TanStack Query kancaları), `apps/web/features/platform` (görünüm), `app/(platform)/…/page.tsx`
(yalnız feature bileşenini render eden ince sayfa). Tipler `packages/api/src/generated/schema.ts`
üzerinden **OpenAPI'dan üretilir**; elle tip yazılmaz.

**Tech Stack:** Next.js 16 App Router, TypeScript strict, TanStack Query, shadcn/ui (Mira),
Tailwind v4, openapi-typescript codegen. Backend .NET 10 (bu depo değişmez — bir uç hariç,
aşağıda).

**Spec:** `docs/teknik-analizler/mufredat/meb-haftalik-ders-cizelgesi-entegrasyonu-tasarimi.md`
§6.1. **Önceki dilimler:** Dilim 1 `c89c22bf`, 2 `db1c11b1`, 3 `1f0f60af`, 4 `e8d8451a`,
düzeltmeler `1f7966fe` (hepsi `oksis-api/master`).

---

## Ölçülen başlangıç durumu

2026-09-20 ekran testinde doğrulandı:

- Platform panelinde **yalnız iki sayfa** var: `/platform/login`, `/platform/schools`.
- Okul panelinde müfredat menüsü **yok**; ders kataloğu ekranında "seviye bazlı haftalık saat
  editörü sonraki teslimde eklenecek (ayrı curriculum-hours modülü)" notu duruyor.
- Uçtan uca API koşusu çalışıyor: keşif 30 aday → indirme → ayrıştırma 6 çizelge (36/36
  sağlama) → ara alan 161 satır, 0 hata.

### Backend'de kapatılan tek eksik

Çizelgeyi ara alana taşıyan komut **eğitim programı kodunu** ister ama platform tarafında
programları listeleyen bir uç yoktu (okul tarafındaki liste tenant kapsamlı). Ekranın kodu
serbest metin olarak sorması, yazım hatasıyla **yanlış programa müfredat yazmaya** açık kapı
bırakırdı. Eklendi: `GET /api/v1/platform/curriculum-sources/education-programs`.

---

## Global Constraints

- Bu dilim **ekran** işidir; kod `oksis-ui`. Backend'e yalnız yukarıdaki tek okuma ucu eklendi.
- `oksis-ui` monorepo kuralları bağlayıcı: tipler `packages/core`/`packages/api`'de, `fetch`
  yalnız `packages/api/endpoints.ts`'te, sayfa dosyaları ≤ ~15 satır, feature yalnız
  `index.ts` üzerinden dışa açılır, tanımlayıcılar İngilizce, **kullanıcıya görünen metin
  Türkçe**.
- Tipler **OpenAPI'dan üretilir** (`npm run codegen` → `packages/api/src/generated/schema.ts`).
  Elle DTO yazmak, backend değişince sessizce bayatlayan ikinci bir sözleşme üretirdi.
- **Platform token'ı ayrı.** Bu ekranlar `(platform)` route grubunda yaşar ve platform
  oturumunu kullanır; okul token'ıyla açılmaz.
- **Ayrıştırma hiçbir şey yazmaz.** Ekran bunu görünür kılar: "Ara alana taşı" ayrı ve
  bilinçli bir aksiyondur.
- **Sağlama görünür olmalı.** Çizelgenin `isPublishable` bayrağı ve tutmayan toplamlar
  ekranda gösterilir; kullanıcı "temiz mi" sorusunu tıklamadan önce cevaplayabilmeli.
- MSW mock'ları bu dilimde **gerekmiyor**: uçlar gerçek ve çalışıyor.

---

## Ekran haritası

Tek rota: **`/platform/curriculum`** — "MEB Kaynakları".

```text
┌─ MEB Kaynakları ──────────────── [Yeni belgeleri indir] [Yenile] ─┐
│ Kategori: Haftalık ders çizelgeleri (7)                            │
├────────────────────────────────────────────────────────────────────┤
│ TARİH       BAŞLIK                                  DURUM   İŞLEM  │
│ 09.09.2026  Özel Program… Anadolu Lisesi            —       İndir  │
│ 20.05.2025  Anadolu Lisesi, Fen Lisesi…             Alındı  Aç     │
└────────────────────────────────────────────────────────────────────┘
        ↓ "Aç"
┌─ Belge · 20144001_202505.pdf ─────────────────────────────────────┐
│ 10 sayfa · 6 çizelge · parmak izi dd388738…                        │
├────────────────────────────────────────────────────────────────────┤
│ s2  ANADOLU LİSESİ HAFTALIK DERS ÇİZELGESİ                         │
│     9, 10, 11, 12 · 60 satır · sağlama 8/8 ✓        [Ara alana taşı]│
│ s3  HAZIRLIK SINIFI BULUNAN ANADOLU LİSESİ …                       │
│     HAZIRLIK, 9, 10, 11, 12 · 63 satır · 10/10 ✓    [Ara alana taşı]│
└────────────────────────────────────────────────────────────────────┘
        ↓ "Ara alana taşı"
┌─ Ara alana taşı ───────────────────────────────────────────────────┐
│ Belge seti (hukuki kaynak)                                         │
│   Başlık        [Anadolu/Fen/SBL haftalık ders çizelgeleri       ] │
│   Karar no      [2025/05]      Karar tarihi [09.05.2025]           │
│ Hedef                                                               │
│   Eğitim programı  [Lise geçici program ▾]                          │
│   Akademik yıl     [2025-2026]                                      │
│                                        [Vazgeç]  [Ara alana taşı]   │
└────────────────────────────────────────────────────────────────────┘
```

**Belge seti neden dialogda:** backend `documentSetId` ister. Kullanıcıya üç ayrı adım
(set aç → belgeyi bağla → içe aktarmayı başlat) yaptırmak, tek bir niyeti üç ekrana bölerdi.
Dialog tek aksiyonda üçünü yapar ama **karar numarasını kullanıcıya sorar** — o bilgi
belgenin kapağındadır ve uydurulamaz.

---

## Görevler

### T1 — Sözleşme: OpenAPI şeması ve API katmanı

- API ayakta iken `npm run codegen` ile `packages/api/src/generated/schema.ts` yenilenir.
- `packages/api/src/platform-curriculum/endpoints.ts`: `discoverMebDocuments`,
  `fetchSourceDocument`, `sweepMebCatalog`, `parseSourceDocument`, `listEducationPrograms`,
  `createDocumentSet`, `attachDocumentToSet`, `startImportRunFromChart`.
- `queries.ts`: `useMebDiscovery`, `useFetchSourceDocument`, `useSweepMebCatalog`,
  `useParsedDocument`, `useEducationPrograms`, `useStartImportFromChart` (set açma +
  bağlama + başlatmayı tek mutation'da zincirler).
- Query key'leri `qk.platformCurriculum.*` altına eklenir.

**Kabul:** `apps/web` içinde tek bir `fetch` yok; tipler elle yazılmadı.

### T2 — Keşif ekranı

Liste: tarih, başlık, durum (Alındı / —), aksiyon (İndir / Aç). Üstte "Yenile" ve
"Yeni belgeleri indir" (sweep, arka plan işi; 202 döner ve bilgilendirme gösterilir).

Kırmızı hâller görünür olmalı: allowlist hatası (400), MEB'e ulaşılamaması (502) kullanıcıya
Türkçe ve **ne yapacağını söyleyen** bir mesajla gösterilir.

**Kabul:** Bilinen belge "Alındı" işaretlenir ve "Aç" ile ayrıştırmaya gider; bilinmeyen
belge indirildiğinde liste kendini tazeler.

### T3 — Ayrıştırma ekranı

Belgenin çizelgeleri kart listesi olarak. Her kartta: sayfa no, başlık, sınıf sütunları,
satır sayısı, **sağlama özeti** (tutan/toplam) ve `isPublishable` rozeti. Uyarı varsa
kodlarıyla listelenir.

`CURRICULUM_SOURCE_NO_TEXT_LAYER` (taranmış belge) ve `CURRICULUM_SOURCE_NOT_PARSABLE` için
ayrı ve yol gösteren boş durum: "Bu belge taranmış; satırlar elle girilmeli."

**Kabul:** Gerçek 2025/05 belgesinde altı çizelge, doğru sınıf etiketleri ve 36/36 sağlama
ekranda görünür.

### T4 — "Ara alana taşı" dialogu

Belge seti alanları + eğitim programı (uçtan gelen liste) + akademik yıl. Gönderimde sırayla
set açılır, belge bağlanır, içe aktarma başlatılır. Sonuç özeti gösterilir: durum, satır
sayısı, çözülmemiş ders sayısı.

Sonuçta **çözülmemiş ders sayısı vurgulanır** — bugün gerçek belgede 146 çıkıyor (`TB-210`) ve
kullanıcı bunu tıklamadan önce değil, sonra öğrenirse şaşırır.

**Kabul:** Aynı belge/sayfa ikinci kez taşındığında yeni çalışma açılmaz (`alreadyExisted`)
ve ekran bunu söyler; `CURRICULUM_SOURCE_SET_DUPLICATE` (409) hata değil, var olan sete
bağlanma olarak ele alınır.

### T5 — Navigasyon ve yetki

Platform kabuğunda "Okullar" yanına "Müfredat" bağlantısı. Rota `(platform)` grubunda;
platform oturumu yoksa `/platform/login`'e yönlenir (var olan desen).

### T6 — Doğrulama

- `npm run lint` ve `npx tsc --noEmit` temiz.
- Gerçek API ve gerçek MEB belgesiyle **ekran testi**: keşif → indir → ayrıştır → taşı.
- Ekran görüntüleri ve bulgular `oksis/docs` altına.

---

## Kabul matrisi

| # | Beklenen davranış | Görev | Nasıl doğrulanır |
|---|---|---|---|
| 1 | Keşif listesi gerçek MEB'den dolar | T2 | Ekran |
| 2 | Bilinen belge "Alındı" görünür | T2 | Ekran |
| 3 | İndirme sonrası liste tazelenir | T2 | Ekran |
| 4 | MEB erişilemezse anlaşılır hata | T2 | Ekran (uç kapatılarak) |
| 5 | Altı çizelge doğru etiketlerle listelenir | T3 | Ekran |
| 6 | Sağlama ve yayımlanabilirlik görünür | T3 | Ekran |
| 7 | Taranmış belge yol gösteren boş durum verir | T3 | Ekran |
| 8 | Program listesi uçtan gelir, serbest metin yok | T1+T4 | Kod + ekran |
| 9 | Taşıma tek aksiyonda set+bağlama+başlatma yapar | T4 | Ekran |
| 10 | İkinci taşıma yeni çalışma açmaz | T4 | Ekran |
| 11 | Çözülmemiş ders sayısı vurgulanır | T4 | Ekran |
| 12 | `apps/web` içinde `fetch` yok | T1 | Kod taraması |

---

## Kapsam dışı (bilinçli)

- **Satır inceleme ve ders eşleme ekranı.** 161 satır × ders seçici; kendi dilimi.
- **Onay ve yayım ekranları.** İki kişi kuralı ikinci platform hesabı ister (karar 0019).
- **Belge seti yönetim ekranı** (set listesi, birden çok belge bağlama). Bugün dialog tek
  belgelik seti açıyor; çok ekli kararlar için ayrı ekran gerekecek.
- **Okul tarafı müfredat ekranları** (Dilim 4 sözleşmeleri). Ayrı planlanır.
- **Mobil.** Merkez yüzeyi mobilde yok.
