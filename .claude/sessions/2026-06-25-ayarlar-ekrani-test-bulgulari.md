# Ayarlar Ekranı (/admin/settings) — Test Bulguları

**Tarih:** 2026-06-25
**Ortam:** Local dev — frontend `localhost:5173`, backend `localhost:5112`
**Giriş:** Müdür hızlı giriş (`mudur.s1@oksis.local`) → Mustafa Şahin / Okul Yöneticisi · Atlas Koleji
**Yöntem:** Her sekmede (1) Ekran Testi — buton/liste/info/i18n, (2) Etki Testi — çapraz ekran yansıması.
**Kapsam:** Sadece tespit; kod değişikliği YAPILMADI.

> Önem dereceleri: ❗**Kritik** · ⚠️ **Bulgu** · 🟡 **Küçük/İnceleme** · ✅ **Çalışıyor (PASS)** · 🧩 **Kod/Component tutarsızlığı**

---

## 0. Çapraz Kesit / Altyapı

- ❗ **Sonsuz render döngüsü (Maximum update depth exceeded)** — `src/portals/admin/settings/tabs/GeneralTab.tsx:215` (`GnlForm`), mount eden `GeneralTab.tsx:1282`. `useEffect` içinde setState her render'da tetikleniyor. **GeneralTab tüm Ayarlar sayfası boyunca mount kalıyor**, dolayısıyla hangi sekmede olursan ol arka planda sürekli çalışıyor; konsola 9988+ hata basıyor, sürekli CPU tüketiyor. Kök sebep ve performans riski.
- 🧩 **API host tutarsızlığı:** `school-settings` ve `academics/*` çağrıları doğrudan `:5112`'ye gidiyor (CORS preflight OPTIONS ile); `assignments`, `auth`, `notifications` ise `:5173` proxy üzerinden. Tek bir httpClient/proxy stratejisi yok.
- 🧩 **httpClient kullanım tutarsızlığı:** Bazı mutation'lar `window.fetch`'i çağrı anında okuyor (subjects), bazıları modül yüklenince yakalanmış `fetch` referansı kullanıyor (rooms). Davranış birörnek değil.
- ✅ **i18n:** `i18next` global expose edilmemiş; DOM'da ham key sızıntısı yok; `school-settings`, `subjects`, `classrooms` için `tr/en` JSON namespace'leri yükleniyor. (Not: admin tarafında TR/EN dil değiştirici yok — yalnız login ekranında var; tam i18n doğrulaması admin içinde dil değiştirerek yapılamadı.)

---

## 1. Genel Bilgiler

**İçerik:** Kurum Kimliği (Logo, Resmî Ad*, Görünen Ad*, Kurum Türü, MEB Kodu, Kuruluş Yılı), İletişim (Telefon/E-posta/Web/İl/İlçe/Açık Adres), Önizleme, Kayıt Bilgisi, Kurum Yetkilisi.

- ❗ **Logo yükleme çalışmıyor:** "Okul Logosu" bölümü açıklamalı ama hiç `input[type=file]` / yükle-değiştir butonu yok (sadece `cursor:pointer`'lı boş div). Logo yüklenemiyor.
- ⚠️ **İl / İlçe alanları `readOnly` ve boş:** Lokasyon seçici bağlı değil. Oysa auth-context'te ilçe "Kadıköy" mevcut — adres bölümü ile gerçek okul verisi tutarsız.
- ⚠️ **Görünen Ad → topbar/sol menü yansımıyor (etki):** Önizleme "Görünen ad ve logo, sol menü ile giriş ekranında bu şekilde gösterilir" diyor. Görünen Ad'ı değiştirip kaydettim (gerçek UI ile kalıcı oldu) ama topbar çipi hâlâ auth-context'ten gelen "Atlas Koleji"yi gösteriyor. displayName ile topbar **decoupled**.
- 🟡 **Tek bölüm değişse de 3 PUT:** Sadece Görünen Ad değişince bile `basic-info` + `contact-info` + `address` üçü birden PUT'lanıyor (hepsi 204). Dirty-bölüm bazlı optimizasyon yok.
- ✅ **PASS:** MEB Kurum Kodu `readOnly` (kilit mesajıyla tutarlı) · Kaydet dirty-gate (değişiklik yokken disabled) · "Kaydedilmemiş değişiklikleriniz var" çubuğu · canlı önizleme · kayıt kalıcı · "Son güncelleme" gerçek kayıtta bugüne (25.06.2026) güncellendi.
- ℹ️ **Düzeltilen yanlış alarm:** JS native-setter ile yaptığım kayıt kalıcı olmamıştı; bu benim test yöntemimin artefaktı (RHF değeri güncellenmiyor). Gerçek UI yazımıyla kayıt sorunsuz. → "kayıt kalıcı değil / tarih güncellenmiyor" gözlemleri GEÇERSİZ.

---

## 2. Akademik Yapı

**İçerik:** Kademeler (Anaokulu/İlkokul/Ortaokul kapalı, Lise "Kullanımda" 41 şube), Genel (Günlük Ders Sayısı 8, Eğitim Dili), Ders Kataloğu (22 ders), sağda Şube Adlandırma (Debt) + Nerede Kullanılır.

- ❗ **Yeni Ders ekleme tamamen KIRIK** — `POST /api/v1/academics/subjects` → **400**. Backend validation gövdesi:
  - `'Code' must not be empty.` — fakat UI'da **Kısa Kod "(opsiyonel)"** etiketli (yanıltıcı kontrat uyumsuzluğu).
  - `'Display Order' must be greater than '0'.` — frontend her zaman **`displayOrder: 0`** gönderiyor (formda alan yok, sabit 0). → Kod girilse bile bu hata yüzünden **hiçbir ders eklenemiyor.**
- ⚠️ **Haftalık Saat girişi gönderilmiyor:** Oluşturma formundaki "Haftalık Saat" alanı request gövdesinde HİÇ yok (toplanıyor, atılıyor). Katalog tablosundaki **`HAFT. SAAT (DEBT)` "—"** ile tutarlı — alan dekoratif.
- ⚠️ **Hata mesajı yutuluyor:** Backend düzgün alan-bazlı hata + `correlationId` dönerken UI generic **"İşlem başarısız oldu"** toast'ı gösteriyor.
- 🧩 **"Ders" için 3 ayrı veri kaynağı:**
  1. Ayarlar > Ders Kataloğu → backend `academics/subjects/manage` (liste) + `academics/subjects` (POST)
  2. **Dersler & Branşlar (`/admin/subjects`) → FRONTEND MOCK** (`src/portals/admin/subjects/data/seed.ts` + `store.ts`)
  3. Görevlendirmeler → backend `assignments/courses`
  → Katalog ↔ Dersler & Branşlar **decoupled** (mock vs backend). Seed verisi şu an backend'le aynı 22 dersi içerdiği için eşleşiyorlar ama biri güncellense diğerine yansımaz (zaten katalog create kırık).
- 🧩 **İki ayrı "ders yönetimi" UI'ı:** Settings kataloğu (sade) ile `/admin/subjects` (Branş 16 + Seviye + Tür Zorunlu/Seçmeli) — benzer amaç, farklı özellik seti, ayrı kodlanmış. Component birleştirme adayı.
- ℹ️ Şube Adlandırma kartı **(Debt)** işaretli; resmî/ara feed notları gibi frontend-first borç.

---

## 3. Akademik Politikalar

**İçerik:** Not Sistemi (Geçme Notu 50, Yuvarlama, Karne Skalası kilitli-MEB), Sınav & Değerlendirme (2 yazılı / 2 performans, ağırlık 60/40), Devamsızlık Politikası (Özürsüz 10 / Toplam 30 / Eşik 5 gün + veli bildirim toggle), Takdir & Teşekkür (85/70 + otomatik belge toggle), sağda MEB Varsayılanları.

- ✅ **PASS — Ağırlık validasyonu çalışıyor:** Yazılı %70 yapınca performans %40 kaldı (toplam %110); altta **"Ağırlıkların toplamı %100 olmalı (şu an %110)"** uyarısı + "hatalı alanları düzeltin", Kaydet engellendi. **Vazgeç** doğru geri aldı (60/40). Dirty-gate çalışıyor.
- 🟡 Ağırlıklar otomatik kuplajlı değil (manuel giriş + validasyon) — kabul edilebilir tasarım tercihi.
- ℹ️ MEB Varsayılanları uyarısı ("Bazı politikalar MEB varsayılanlarından farklı") + "MEB Varsayılanlarına Dön" butonu mevcut.
- ⏳ Etki hedefleri (Notlar & Karne, Devamsızlık, Veli Bildirimleri) deklare; not yeniden-hesaplama backend-computational olduğundan yüzeysel doğrulandı.

---

## 4. Derslikler

**İçerik:** 10 derslik (8/sayfa, 2 sayfa), DataTable (Ad/Tip/Kapasite/Konum/Durum), Tip+Durum filtre, Tablo/Kart toggle, "Yeni Derslik".

- ✅ Liste backend'den: `GET /api/v1/rooms?includeInactive=true` → 200. Arama filtresi çalışıyor ("Lab" → 2 sonuç). Sıralanabilir kolonlar.
- ❗ **Yeni Derslik ekleme KIRIK** — `POST /api/v1/rooms` → **400** (form tam dolu: Ad + Kısa Kod + Tip; 3/3 deneme 400). Tam hata gövdesi yakalanamadı (app yakalanmış `fetch` referansı kullanıyor); semptom subjects ile aynı.
- 🧩 **Cross-form etiket tutarsızlığı:** Kısa Kod, subjects formunda **"(opsiyonel)"**, rooms formunda **"\*" (zorunlu)** — backend ikisinde de zorunlu. Etiketler birörnek değil.
- 🧩 **Değer konvansiyonu tutarsızlığı:** Filtre dropdown'ı Türkçe değer (`"Sınıf"`, `"Laboratuvar"`) tutuyor; oluşturma formu İngilizce enum (`"Classroom"`, `"Laboratory"`).
- ⏳ Etki: Derslikler → Ders Programı (mevcut derslikler programda seçilir). Create kırık olduğu için yeni derslik propagasyonu test edilemedi.

---

## 5. Zil Programı

**İçerik:** Zil Çizelgesi (8 ders × 40 dk, Tam/Yarım Gün), 8 ders + teneffüs/öğle satırları (time-picker), Ders Ekle, Otomatik Üretici, Gün Atamaları (Tam/Yarım/Kapalı), Nerede Kullanılır (Ders Programı/Yoklama/Bildirimler).

- ⚠️ **Çizelgede zaman çakışması:** Teneffüs **09:30–09:45**, 2. Ders (09:30–10:10) ile çakışıyor; UI **"Önceki blokla çakışıyor"** kırmızı uyarısı veriyor. Seed/çizelge verisinde gerçek tutarsızlık (validasyon doğru flag'liyor — bu yönüyle ✅).
- ⚠️ **Tüm günler "Kapalı":** Gün Atamaları'nda Pzt–Paz hepsi "Kapalı" — hiçbir gün bu şablonu kullanmıyor. Ders Programı'na etki açısından şüpheli (yapılandırma/veri).
- 🟡 Timeline ekseni "08:40–14:20" yazıyor ama dersler 15:50'ye kadar gidiyor — eksen etiketi tutarsız olabilir (düşük güven).
- ✅ "8 ders" özeti, Akademik Yapı'daki "Günlük Ders Sayısı 8" ile tutarlı. Otomatik Üretici parametreleri ve "Çizelgeyi Yeniden Üret" mevcut (destructive — çalıştırılmadı).

---

## 6. Tatil Takvimi

**İçerik:** Tatil Listesi (filtre: Tümü/Resmî/Ara/Yarıyıl/Okul), Sezon Özeti, "Okul Tatili Ekle".

- ❗ **Sezon-context uyuşmazlığı:** Alt başlık **"2025–2026 sezonu"**, Sezon Özeti **"2026"**, topbar aktif sezon **"2029–2030"** — üç farklı referans. API `GET /school-settings/holidays?year=2026` (sabit yıl, aktif sezonu yok sayıyor). **Sekme topbar'da seçili sezonu dikkate almıyor.**
- ⚠️ **Etki FAIL — Tatil → Akademik Takvim yansımıyor:** "Nerede Kullanılır → Akademik Takvim: Tatiller takvimde işaretlenir" denmesine rağmen, mevcut "aaaaa" tatili (12–26 Haziran 2026) `/admin/academic-calendar` Haziran 2026 görünümünde **işaretli değil**. İki ekran decoupled (Akademik Takvim kendi "Sezon Etkinlikleri" verisini kullanıyor, "Arşiv·salt-okunur", o da 2025-2026 gösteriyor).
- ✅ **Create ÇALIŞIYOR:** `POST /school-settings/holidays` → **201** (subjects/rooms 400'dü — yani create-bug sistemik değil, o iki endpoint'e özgü). Liste + Sezon Özeti reaktif güncellendi ("2 tatil · 18 gün", Okul tatili 2).
- ℹ️ Resmî/Ara/Yarıyıl tatilleri "kilitli — kaynak feed'leri henüz bağlanmadı" (debt). Listede önceden var olan junk kayıt "aaaaa" (benim değil).
- 🧹 **TEMİZLENECEK TEST VERİSİ:** Test için oluşturduğum **"ETKI Test Tatili" (15–17 Temmuz 2026)** backend'de duruyor — henüz silinmedi.

---

## 7. Bildirim Ayarları

**İçerik:** Bildirim Kuralları matrisi (8 olay × 3 kanal: Portal/E-posta/SMS), Gönderim Tercihleri (Sessiz saatler, Günlük SMS Limiti), sağda SMS Kotası (Debt) + Nerede Kullanılır.

- ✅ **PASS:** Kanal chip toggle çalışıyor — "Uyarı eşiği aşıldı" SMS açılınca başlık **"1 olay" → "2 olay SMS gönderir"** (canlı sayaç), kaydet çubuğu çıktı, Kaydet aktifleşti; **Vazgeç** doğru geri aldı ("1 olay", Kaydet disabled).
- 🟡 **Acil duyuru SMS "—":** "Acil duyuru" ve "Yeni duyuru" + "Günlük yoklama özeti" olaylarında SMS kanalı "—" (kullanılamaz). Acil duyurunun SMS ile gidememesi dikkat çekici (MVP tercihi olabilir, doğrulanmalı).
- ℹ️ **SMS Kotası (Debt):** 0/1.000 SMS, "2026-07-01 tarihinde yenilenir" — yine 2026 tarihi (aktif sezon 2029-2030 ile uyumsuz). SMS başlığı OKUL (kilitli), Sağlayıcı — (boş). Frontend-first borç.
- ⏳ Etki: Devamsızlık/Duyurular/Ödemeler akışlarına bildirim üretimini etkiler (backend-driven; uçtan uca doğrulanmadı).

## 8. Modüller

**İçerik:** 10 modül kartı (toggle), sağda Plan Durumu ("2/10 modül aktif", Premium plan, Planı Yükselt).

**Modüller:** Öğrenci Yönetimi (Debt, ON-🔒Çekirdek) · Devamsızlık (ON-🔒Çekirdek) · Notlar & Karne (Kapalı) · Ders Programı (Debt, Kapalı) · Duyurular (Kapalı) · Ödemeler & Finans (Debt, Kapalı) · e-Okul Entegrasyonu (Debt, Beta, Kapalı) · Servis Takibi (Debt, Kapalı) · Yemekhane (Debt, Kapalı) · Kütüphane (Debt, Kapalı).

- ⚠️ **Etki FAIL — Modül durumu sol menüyü gating etmiyor:** Alt başlık "kapatılan modül menüden kalkar" diyor; ama **Ders Programı** (`/admin/schedule`) ve **Duyurular** (`/admin/announcements`) Modüller'de **"Kapalı"** olmasına rağmen sol menüde linkleri DURUYOR. Modül on/off durumu navigasyonu sürmüyor.
- ✅ **PASS (ekran):** Toggle çalışıyor — Notlar & Karne açılınca "● Aktif", Plan Durumu **"2/10" → "3/10"** (canlı sayaç), kaydet çubuğu + Kaydet aktif; **Vazgeç** geri aldı (2/10). Çekirdek modüller (Öğrenci Yönetimi, Devamsızlık) ON + kapatılamaz (doğru).
- ℹ️ 10 modülün 8'i (Debt) işaretli — büyük kısmı frontend-first borç.

---

## Component / Kod Tutarsızlığı Özeti (birleştirme adayları)

1. **3 ayrı "create drawer"** (Yeni Ders, Yeni Derslik, Yeni Okul Tatili) — benzer yapı, ayrı kodlanmış → ortak Drawer/Form iskeleti.
2. **Tekrarlayan sekme deseni** — her sekmede "Nerede Kullanılır" kartı + "Kaydedilmemiş değişiklikleriniz var" çubuğu + Kaydet dirty-gate ayrı ayrı yazılmış.
3. **"Ders" için 3 veri kaynağı** (mock `/admin/subjects` vs backend katalog vs assignments/courses) — tek kaynağa indirgenmeli.
4. **Kısa Kod etiketi** subjects'te "opsiyonel", rooms'ta "zorunlu" — birörnek değil (backend ikisinde zorunlu).
5. **Tip değeri konvansiyonu** — filtre TR label, form EN enum.
6. **API host/proxy** — kimi çağrı doğrudan :5112, kimi :5173 proxy; httpClient `fetch` kullanımı birörnek değil.

## Önem Sırasına Göre Bulgu Listesi (özet)

**❗ Kritik**
1. GeneralTab sonsuz render döngüsü (tüm Ayarlar sayfasında sürekli, 9988+ konsol hatası).
2. Yeni Ders ekleme kırık (`academics/subjects` 400: displayOrder=0 + code zorunlu/opsiyonel uyumsuzluğu).
3. Yeni Derslik ekleme kırık (`rooms` POST 400).
4. Tatil Takvimi sezon-context uyuşmazlığı (topbar 2029-2030 ↔ sekme 2025-2026/2026).

**⚠️ Bulgu**
5. Logo yükleme kontrolü yok.
6. İl/İlçe readonly & boş (lokasyon seçici bağlı değil).
7. Görünen Ad → topbar yansımıyor.
8. "Ders" için 3 ayrı veri kaynağı (mock /admin/subjects ↔ backend katalog ↔ assignments/courses).
9. Haftalık Saat girişi gönderilmiyor (subjects create).
10. Hata mesajı yutuluyor (generic "İşlem başarısız oldu").
11. Zil çizelgesinde blok çakışması ("Önceki blokla çakışıyor") + tüm günler "Kapalı".
12. Tatil → Akademik Takvim yansımıyor.
13. Modül durumu sol menüyü gating etmiyor (Ders Programı/Duyurular Kapalı ama menüde).

**🧩 Kod/Component tutarsızlığı:** Bkz. yukarıdaki "Component / Kod Tutarsızlığı Özeti".

**✅ Çalışan:** dirty-gate + kaydet çubuğu + Vazgeç (tüm sekmeler), canlı önizleme/sayaçlar, ağırlık validasyonu, zil çakışma validasyonu, Derslik arama filtresi, Tatil create (201), Bildirim matris toggle, Modül toggle.

## Açık Aksiyonlar
- [x] 8/8 sekme test edildi
- [ ] **"ETKI Test Tatili" (15–17 Temmuz 2026) test kaydını sil** — backend'de duruyor, kullanıcı kararı bekliyor
