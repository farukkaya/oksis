# Görevlendirme Modeli Ekranları — Tasarım Brief'i (Oksis Layout V2)

> **Hedef:** claude.ai/design "Oksis Layout V2" projesine yapıştırılacak prompt.
> **Kaynak analiz:** `oksis/docs/teknik-analizler/gorevlendirme-is-ihtiyaci-analizi.md`
> **Karar maddeleri:** `K-13` (kapasite) · `K-14` (dağıtım kısıtı) · `K-15` (ders dışı yük)
> Üçü de ⬜ Bekliyor — tasarımlar karar destek malzemesidir; varsayım yapılan yerler
> ekranda `[K-13a]` gibi işaretlenir.

---

Aşağıdaki blok, tasarım projesinin sohbetine olduğu gibi verilir:

---

Bu projede (Oksis Layout V2) görevlendirme modeli değişti; üç yeni tasarım işi ve
bir düzeltme var. Önce `CLAUDE.md`'yi (R1–R14 + Bölüm A) oku ve her işte ona uy:
PageHeader, token'lar, `.attm-*`/`.att-*` kalıpları, en yakın ekranı fork et, mock
alan adları İngilizce ve wire şekliyle aynı (R11), her ekran `loading/empty/error`
durum matrisi tanımlar (R8), biten her ekran `manifest.json`'a yazılır (R7).

## Domain bağlamı (tasarımın uyacağı model)

"Görevlendirme" üç ayrı soruya ayrıştı:

- **S1 Yetkinlik** — kim ne verebilir → `web/gorevlendirmeler.jsx` bunu zaten
  çiziyor, DOĞRU ve değişmiyor (saatsiz, şubesiz yetkinlik eşlemesi).
- **S2 Dağıtım niyeti** — kim nerede vermeli → YENİ: üretime verilen opsiyonel
  kısıt (aşağıda İş 2).
- **S3 Fiili yük** — kim nerede kaç saat veriyor → elle GİRİLMEZ, yayınlanmış
  ders programından TÜRETİLİR. Şube+ders+saat elle girme ekranı artık modelde yok.

## İş 1 · Öğretmen haftalık kapasitesi (K-13)

`web/ogretmenler_drawer.jsx` mock'unda `tch.cap` zaten var ama hiçbir yerde
görüntülenip DÜZENLENEMİYOR; backend'de de alan yok — resmîleştiriyoruz.

- **Genel sekmesine** "Haftalık Kapasite" fact'i + kalem aksiyonu: küçük modal
  (`.att-modal-*`): MEB preset seçimi (Sınıf Öğretmeni 18 · Branş 15 + ek ders
  bandı) VEYA serbest saat girişi `[K-13a: ikisi birden varsayıldı]`; kaynağı
  gösteren yardımcı metin ("Varsayılan: 30 — okul genelinde geçerli").
- **Öğretmenler liste tablosuna** (`ogretmenler.jsx`) "Kapasite" sütunu
  (tabular-nums) ve yük yüzdesinin paydası olarak kapasite: `%` rozeti artık
  `load / weeklyCapacityHours`.
- Mock: `weeklyCapacityHours: 30` (number) · `capacitySource: "default" | "custom"`.
- Durumlar: kapasite hiç dokunulmamış (default rozeti) · özel · aşım (`load > cap`
  — mevcut `.ov` stili).

## İş 2 · Dağıtım kısıtları (K-14) — YENİ EKRAN

Ders programı üretimi dağıtımı kendisi seçiyor; yöneticinin "9-A Matematik'i
Ayşe alsın" niyetini kaydedecek yüzey yok. Yeni ekran: **üretim kısıtları**.

- **id:** `schedule-distribution-constraints` · **domain:** `schedule` ·
  dosya `web/schedule-distribution-constraints.jsx` (R2 — Türkçe dosya adı yok).
- **Giriş noktası:** `web/program_hub.jsx`'e kart/sekme + `web/program_autogen.jsx`
  akışında "Kısıtlar" adımı özeti (üretimden önce gözden geçirilir).
- **Gövde:** şube × ders satırları; her satırda kısıt türü:
  - **Sabitle** — bu dersi bu şubede X öğretmeni verir (öğretmen seçici yalnız
    S1'de yetkin olanları listeler; alan-dışı seçim `warning` rozetiyle).
  - **Hariç tut** — X bu şubeye girmesin.
  - **Bölüşüm** — dersi iki öğretmen paylaşır (saat bölüşümü) `[K-14a: MVP'ye
    girip girmeyeceği kararsız — ayrı varyant olarak çiz]`.
- Kısıt satırı = niyet kaydı: kim koydu, ne zaman, gerekçe (opsiyonel —
  `gorevlendirmeler.jsx`'teki GerekceBlok kalıbını fork et).
- **İhlal durumu:** üretim kısıta uyamadıysa satır `danger` rozeti + açıklama;
  yayın önizlemesine (publish preview) "N kısıt ihlali" özeti `[K-14b: engel mi
  uyarı mı kararsız — uyarı olarak çiz, engel varyantını tweaks'e koy]`.
- Mock: `constraints: [{ id, sectionId, courseId, type: "pin"|"exclude"|"split",
  teacherId, splitHours?, reason, createdBy, createdAt, status: "satisfied"|"violated"|"pending" }]`.
- Durumlar: `loading` · `empty` ("Kısıt yok — üretim dağıtımı serbestçe seçer",
  tek aksiyon) · `error` · `violated`.

## İş 3 · Ders dışı yük görünürlüğü (K-15)

Yük göstergeleri yalnız ders saatini sayıyor; nöbet ve kulüp danışmanlığı görünmüyor.

- `ogretmenler_drawer.jsx` üst göstergesi (`tch-gauge`) **parçalı çubuğa** döner:
  ders saati (dolu) + ders dışı (ayrı desen/ton) + boş; alt satırda ayrım:
  "24 ders + 4 ders dışı / 30". Renk tek başına anlam taşımaz — segment
  etiketleri metinle (`ikon + metin` kuralı).
- Ders dışı kalemler `Genel` sekmesinde mini liste: Nöbet (haftalık karşılığı),
  Kulüp danışmanlığı `[K-15b: saat karşılıkları kararsız — mock'ta nöbet günü
  2 saat, kulüp 2 saat varsay ve işaretle]`.
- Öğretmenler listesindeki yük sütunu aynı parçalı mantığı minyatür çubukla alır.
- Mock: `nonTeachingLoad: { dutyHours: 4, clubAdvisorHours: 2 }` ·
  `teachingHours` yayınlanmış programdan gelir.
- **Kritik durum (R8):** `schedule not published` — program yayınlanmamışsa ders
  saati 0'dır ve bu bir hata DEĞİLDİR; çubuk "Program yayınlanmadı" boş durumunu
  ayrıca tanımlar.

## Düzeltme · Öğretmen çekmecesindeki v1 kalıntısı

`ogretmenler_drawer.jsx :: TchTabGorev` hâlâ eski v1 modelini çiziyor: şube +
ders + saat elle ekleme/çıkarma ("Ders/Sınıf Görevlendir"). **Bu model emekli** —
backend'de tablosu bile yok. Sekme yeniden tasarlanır:

- Ad "Ders Yükü" olur; içerik SALT OKUNUR türetilmiş liste: yayınlanmış
  programdan şube · ders · saat satırları (kaynak rozeti: "Ders programından").
- Elle ekleme/kaldırma butonları KALKAR; yerine iki yönlendirme: "Yetkinlikler →
  Görevlendirmeler ekranı" ve "Dağıtım kısıtı ekle → İş 2 ekranı".
- Boş durum: "Yayınlanmış programda dersi yok" + program yayınlanmadıysa ayrı metin.

## Teslim listesi

Her iş için: ekran/parça dosyaları + manifest kaydı (`states` dahil) + tweaks
anahtarları. Hiçbir yeni renk/ikon üretme; sekme sayısı artıyorsa önce sor.
