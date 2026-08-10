# Handoff: Admin Paneli — Ders Programı (Akademik)

## Genel Bakış
**Ders Programı**, OKSİS yönetim panelinde sınıf, öğretmen ve derslik programlarının **oluşturulduğu, doğrulandığı ve yayınlandığı** akademik modüldür. Bu handoff, Admin (Yönetim) rolündeki tüm Ders Programı yüzeyini uçtan uca belgeler:

- **Hub / Liste** — üç mercekli (sınıf · öğretmen · derslik) liste ekranı, özet şeridi, filtreler, satır aksiyonları.
- **Yeni Program** — sınıf seçimiyle editörü boş çizelgede açan modal.
- **Otomatik Oluştur** — görevlendirme ve zil programından çakışmasız taslak üreten iki aşamalı sihirbaz.
- **Program Editörü** — sürükle-bırak haftalık çizelge, hücre bağlam menüsü, canlı doğrulama.
- **Doğrulama** — çakışma + eksik saat tespiti; editör ve yayınlama kapısı.
- **Yayınla** — doğrulama kapısı → etki/değişiklik özeti → yayın türü → bildirim kanalları → onay → geri-al.
- **Popover / Menü desenleri** — satır üç-nokta menüsü, hücre bağlam menüsü, editör "daha fazla" menüsü.

> İş kuralının kalbi: **bir program ancak açık çakışma yoksa yayınlanabilir.** Otomatik üretim insanı devre dışı bırakmaz — ürettiği her şey **Taslak** olarak editöre yüklenir, yayın kararını yine yönetici verir.

---

## Tasarım Dosyaları Hakkında
`source/` içindeki dosyalar **React 18 + tarayıcı-içi Babel ile yazılmış tasarım referanslarıdır** — amaçlanan görünüm ve davranışı gösteren prototiplerdir, doğrudan production'a kopyalanacak kod değildir. Görev, bu davranışı **hedef kod tabanının mevcut ortamında** (React/Vue/Angular/SwiftUI vb.) o ortamın yerleşik bileşen, durum ve routing desenleriyle **yeniden oluşturmaktır**. Henüz bir ortam yoksa proje için en uygun framework seçilip orada uygulanmalıdır.

Tüm veri statiktir (mock — Atlas Koleji · Lise). Production'da programlar, görevlendirmeler, öğretmen müsaitlikleri ve zil programı API'den; rol ise oturum/yetki katmanından gelmelidir. Prototipin `window.__schTarget` / `window.__schNew` / `window.__schDraft` gibi global köprüleri yalnızca ekranlar arası demo geçişi içindir — production'da bunlar **route parametresi / state** olmalıdır.

## Fidelity
**High-fidelity (hifi).** Renk, tipografi, boşluk, durum renkleri ve etkileşimler nettir; UI piksel hassasiyetinde yeniden üretilmelidir. Token değerleri `source/brand.css` içindedir (özet tablo aşağıda).

## Önizleme
`source/preview.html` dosyasını bir tarayıcıda açın. Üstteki köprü çubuğundan **Hub / Liste** ↔ **Program Editörü** arasında geçiş yapabilirsiniz. Bu çubuk yalnızca handoff önizlemesi içindir; gerçek uygulama kabuğu (Sidebar/Topbar) değildir. Ekranlar production'da hedef kod tabanının kendi routing'ine bağlanır.

---

## 1) Hub / Liste — `schedule.jsx` · `ScheduleScreen`
`Dersler & Branşlar` (Akademik) ile birebir aynı kalıp: **PageTop → özet şeridi → sekmeler (üç mercek) → filtre çubuğu → tablo**. Üç mercek aynı dönem verisinin farklı bakışlarıdır; sekme değişince filtre çubuğu ve tablo sütunları uyarlanır.

📷 `screenshots/01-hub-sinif-listesi.png`

### Üst başlık (PageTop)
- Breadcrumb: **Akademik › Ders Programı** · başlık **Ders Programı** · alt başlık "Sınıf, öğretmen ve derslik programlarını oluşturun, doğrulayın ve yayınlayın."
- Sağ aksiyonlar: **Otomatik Oluştur** (ghost, `sparkles`) ve **Yeni Program** (primary, `plus`).

### Özet şeridi (`.sch-summary`) — tıklanır rozetler
Dört rozet sınıf merceğine ait sayaçları gösterir ve **hızlı filtre** görevi görür (tıkla → tablo o duruma filtrelenir, tekrar tıkla → kalkar):

| Rozet | Renk tonu | Sayar |
|---|---|---|
| **Yayında** | yeşil (`t-pub`) | `durum === 'pub'` |
| **Taslak** | gri (`t-draft`) | `durum === 'taslak'` |
| **Açık çakışma** | kırmızı (`t-conf`) | `conf > 0` |
| **Eksik saat** | turuncu (`t-miss`) | `miss > 0` |

Rozete tıklamak merceği **otomatik olarak Sınıf'a** çevirir (`clickSum`). Aktif filtrede "Filtreyi kaldır" çipi belirir. 📷 `screenshots/02-hub-cakisma-filtre.png`

### Üç mercek (sekmeler `.aca-tabs`)
| Mercek | Veri | Tablo sütunları |
|---|---|---|
| **Sınıf Programları** | `SCH_CLASSES` | Sınıf/Şube · Kademe · Durum · Çakışma · Eksik Saat · Son Güncelleme · Sürüm · (aksiyon) |
| **Öğretmen Programları** | `SCH_TEACHERS` | Öğretmen · Branş · Haftalık Yük · Boş Saat · Nöbet · Durum · (aksiyon) |
| **Derslik Doluluğu** | `SCH_ROOMS` | Derslik · Tür · Doluluk Oranı · Çakışma · (aksiyon) |

📷 `screenshots/04-hub-ogretmen-programlari.png` · `screenshots/05-hub-derslik-dolulugu.png`

### Filtre çubuğu (`.stu-toolbar`) — mercek başına uyarlanır
- **Sınıf:** arama + 9/10/11/12 kademe chip'leri (`.asg-lvl-chip`) + Durum (Taslak/Yayın).
- **Öğretmen:** arama + Branş (`ACA_BRANCHES` aktifleri) + Durum.
- **Derslik:** arama + Tür (Normal/Laboratuvar/Salon).
- Sağda kolon/filtre ayarları ikonu (`sliders`).

### Satır bileşenleri (durum rozetleri)
- `SchStatus` — `pub`→**Yayın** (yeşil), `taslak`→**Taslak** (gri), `rev`→**Revize ediliyor** (sarı). Noktalı pill.
- `SchCount` — çakışma (`alert-triangle`) / eksik saat (`clock`) sayacı; `0` ise nötr "zero" tonu.
- `SchTur` — derslik türü rozeti (Normal/Laboratuvar/Salon, ikonlu).
- `SchOcc` — doluluk çubuğu; `%≥90` kırmızı, `%≥75` sarı, altı normal.
- `sch-ver` — sürüm pill'i (`v4`).

### Satır aksiyonları (`.sch-rowacts`)
- **Sınıf satırı:** `Aç` (editöre git) + (yayında değilse) `Yayınla` + **üç-nokta popover menüsü** (`AcaRowMenu`).
- **Öğretmen / Derslik satırı:** `Görüntüle` (mock toast).
- Tüm satır tıklanabilir → ilgili aç/görüntüle. Aksiyon hücresi `e.stopPropagation()` ile satır tıklamasını yutar.

### Boş & yükleniyor durumları
- **Yükleniyor** (`t.schState === 'yükleniyor'`): 6 satırlık skeleton (`.sch-skel`).
- **Hiç program yok** (`forceEmpty` veya kaynak 0): `calendar-range` ikonlu boş durum + **İlk Programı Oluştur** / **Otomatik Oluştur**.
- **Filtre sonucu boş**: `search` ikonlu "Sonuç bulunamadı" + **Filtreleri Temizle**.

---

## 2) Yeni Program (modal) — `schedule.jsx` · `NewProgramModal`
📷 `screenshots/06-yeni-program-modal.png`

`Modal` kabuğu (`modals.jsx`) içinde sınıf/şube seçici liste (`.sch-pick`). Her satır: tag (9-A) + "9-A programı" + "kademe · durum · sürüm". Bir sınıf seçilene kadar **Editöre Geç** pasiftir. Seçilince `window.__schNew = true` set edilip editöre (`scheduleEditor`) **boş çizelgeyle** geçilir.

---

## 3) Otomatik Oluştur — `schedule_autogen.jsx` · `AutoGenFlow`
Sağdan açılan **iki aşamalı sihirbaz drawer**. Bir taslak seçmek **yayınlamaz**; editöre **taslak** olarak yükler — insan elle ince ayar yapar.

### Aşama 1 — Ayarlar 📷 `screenshots/07-otomatik-olustur-ayarlar.png`
- **Kapsam:** Tek sınıf · Kademe · Tümü (`scope`). Seçime göre alt seçici (şube / kademe) ve "N sınıf" geri bildirimi.
- **Kısıtlar (bilgi kartı):** öğretmen müsaitlikleri, derslik uygunluğu, haftalık ders saatleri. Öğretmenlerin **"müsait değil"** işaretleri **kesin engel** olarak uygulanır.
- **Optimizasyon tercihleri (ağırlıklar):**
  - *Zor dersleri sabaha topla* (düşük/orta/yüksek)
  - *Öğretmen boş saatini azalt* (düşük/orta/yüksek)
  - *Günlük yükü dengele* (düşük/orta/yüksek)
  - *Blok dersleri koru* (aç/kapa toggle)
- **Katı kısıt modu:** hiçbir tercihten ödün vermez — çözüm bulunamayabilir.
- Alt çubuk: **Taslak Üret**.

### Aşama 2 — Önizleme
- **Üretiliyor** ara durumu: spinner + ilerleyen mesajlar (Görevlendirmeler okunuyor → … → Taslaklar puanlanıyor) + 3 skeleton kart (~1.65 sn).
- **Tek sınıf sonucu:** 3 taslak kartı (`AgCard`) yan yana — skor (İyi/Orta), metrikler (Çakışma · Eksik saat · Ort. boş saat · Tercih uyumu · Günlük denge), **mini haftalık ızgara**, **Editörde Aç** + büyük önizleme (`AgPreview` overlay). En iyi skorlu kart **Önerilen** rozeti alır. 📷 `screenshots/08-otomatik-olustur-sonuc.png`
- **Toplu sonuç (kademe/tümü):** sınıf başına özet satırları + her satırda **Aç**.
- **Çözüm bulunamadı** (katı mod): hangi kısıtın gevşetileceğine dair öneri listesi + **Ayarları Gevşet**.
- Sayfa altında daimi **el notu**: "Otomatik üretim insanı devre dışı bırakmaz… Taslak seçmek onu yayınlamaz."

---

## 4) Program Editörü — `schedule_editor.jsx` · `ScheduleEditorScreen`
Tam ekran çalışma yüzeyi. 📷 `screenshots/10-editor-genel.png`

### Düzen
- **Üst şerit:** geri butonu · breadcrumb · `9-A · Sınıf Programı` + durum pill + sürüm · **görünüm segmenti** (Sınıf / Öğretmen) · **Doğrula · Kaydet · Yayınla** + üç-nokta menü.
- **Sol panel:** "Yerleştirilmemiş dersler" — 30 saatlik ilerleme çubuğu + sürüklenebilir **ders çipleri** (`SubjectChip`), her çipte kalan saat. Tümü yerleşince kutlama durumu.
- **Orta ızgara:** 5 gün × 8 ders saati; teneffüs/öğle ayraçları; zorunlu öğretim penceresi (1–6) ile opsiyonel saatler (7–8) görsel ayrımı.
- **Alt doğrulama çubuğu (`.sed-valbar`):** durum pill'leri + lejant + Doğrula.

### Sürükle-bırak yerleştirme
- Çipi ızgaraya sürüklerken hedef hücre **uygunsa yeşil**, **çakışıyorsa kırmızı** yanar; hücre üstünde sebep ipucu görünür.
- **Kilitli slot** (`SED_LOCKS` — "müsait değil", kurul saati, rehberlik): bırakılamaz.
- **Harici meşguliyet** (`SED_BUSY` — öğretmen başka sınıfta): bırakılamaz, kırmızı + sebep.
- Başarılı bırakışta toast: "<Ders> yerleştirildi".

### Hücre bağlam menüsü (popover) — `CellMenu` 📷 `screenshots/11-editor-hucre-menu.png`
Dolu hücreye (veya `cc-more` ⋯ ikonuna) tıklayınca açılır:
- **Öğretmen değiştir** › (alt menü: öğretmen listesi, seçili işaretli)
- **Derslik değiştir** › (alt menü: derslik listesi, ikonlu)
- **Bloğu böl** (yalnızca blok hücrelerde)
- **Kaldır** (danger; blok ise eşini de kaldırır)

### Görünüm segmenti
- **Sınıf görünümü** — düzenlenebilir çizelge.
- **Öğretmen görünümü** — seçilen öğretmenin **salt-okunur** haftası: kendi dersleri renkli, "başka sınıf" / "müsait değil" slotları işaretli. 📷 `screenshots/13-editor-ogretmen-gorunum.png`

### Kaydet / sürüm / geri
- **Kaydet** yalnızca `dirty` iken aktif; "Kaydediliyor → Kaydedildi" geçişi; kirli rozet (`circle-dot`).
- Üç-nokta menü (`.rmenu-pop`): Programı çoğalt · Sürüm geçmişi · PDF dışa aktar · **Programı sil** (danger).
- Kaydedilmemiş değişiklikle çıkışta **`BackConfirmModal`**: İptal · Kaydetmeden çık · Kaydet ve çık.

---

## 5) Doğrulama — editör + yayın kapısı
İki türev değer her şeyi yönetir (`schedule_editor.jsx`):
```js
const conflicts   = /* place içinde conflict:true olan hücreler */;
const missingCells = /* zorunlu pencerede (1–6) boş & kilitsiz hücreler */;
const clean = conflicts.length === 0 && missingCells.length === 0;
```
- **Alt çubuk pill'leri:** temizse "Yayına hazır" (yeşil); değilse "N çakışma" (kırmızı) ve/veya "N eksik saat" (sarı).
- **Doğrula paneli** (`.sed-issues`): her sorun tıklanabilir satır → **"Hücreye git"** ilgili hücreye kaydırır + flaş efekti. 📷 `screenshots/12-editor-dogrulama-paneli.png`
- **Lejant:** Uygun · Çakışma · Boş/eksik · Müsait değil.

**Yayın kuralı:** `conflicts > 0` → yayın **engellenir** (buton pasif). `missing > 0` (çakışma yok) → "Yine de Yayınla" ile yayınlanabilir; eksikler taslakta işaretli kalır.

---

## 6) Yayınla — `schedule_publish.jsx` · `PublishFlow`
Editör veya hub'daki **Yayınla** → sağdan açılan adım paneli (drawer). 📷 `screenshots/09-yayinla-dogrulama-kapisi.png`

Akış adımları:
1. **Doğrulama kapısı** — "Yayına hazır" (yeşil) / "N çakışma · N eksik saat bulundu" (kırmızı/sarı). Sorunlar listelenir; her biri **"Hücreye git"** (`onGotoCell`).
2. **Etki özeti** — kaç öğretmen · öğrenci · veli etkilenecek.
3. **Değişiklik özeti** — bir önceki sürüme (v→v+1) göre değişen hücreler (eski → yeni).
4. **Yayın türü** — *Kalıcı yayın* (yeni sürüm) / *Geçici değişiklik* (yalnızca seçilen tarih; kalıcı programı bozmaz, tarih seçici açılır).
5. **Sürüm notu** (opsiyonel).
6. **Bildirim kanalları** — Uygulama içi (varsayılan) · Push · E-posta; alıcı özeti.
7. **Onay teyidi** → **Yayınlanıyor** → **Başarı + geri-al** (9 sn'lik geri-al penceresi, halka sayaç ile `v` öncesine dönüş).

Alt buton mantığı: hazırsa **Yayınla**; çakışma varsa **pasif** (tooltip "Çakışmalar çözülmeli"); yalnızca eksikse **Yine de Yayınla** (warn).

> **Not:** Hub'dan açılan basit yayınlama (`PublishModal`) ile editör/akış (`PublishFlow`) aynı kuralı paylaşır. Production'da tek bir yayınlama servisi/komponenti hedeflenmelidir.

---

## 7) Popover / Menü desenleri
Üç ayrı popover deseni vardır; üçü de **dışarı tıklayınca kapanır** (`document` mousedown dinleyicisi) ve hafif açılış animasyonu (`oksis-scrim`) kullanır:

| Desen | Bileşen / kaynak | İçerik | Görsel |
|---|---|---|---|
| **Satır üç-nokta menüsü** | `AcaRowMenu` (`academicsBase.jsx`) | Editörde Aç · Yayınla (yayındaysa pasif) · Çoğalt · Sürüm geçmişi · — · PDF dışa aktar | `03-hub-satir-popover.png` |
| **Hücre bağlam menüsü** | `CellMenu` (`schedule_editor.jsx`) | Öğretmen değiştir › · Derslik değiştir › · Bloğu böl · Kaldır | `11-editor-hucre-menu.png` |
| **Editör "daha fazla" menüsü** | `.rmenu-pop` (`schedule_editor.jsx`) | Programı çoğalt · Sürüm geçmişi · PDF dışa aktar · — · Programı sil | (editör üst şerit) |

`AcaRowMenu` öğe sözleşmesi:
```js
items = [
  { icon, label, onClick, disabled?, tip?, danger?, sep? },
  ...
]
```
- `sep: true` → ayraç. `disabled` → `%40` opaklık + tıklama yutulur, `tip` tooltip olur. `danger` → kırmızı.
- Stil: `.rmenu-pop` `position:absolute; right:0; top:100%+6; min-width:186px; box-shadow: var(--sh-lg); border-radius:12px`.

> **Production uyarısı:** Popover'lar `position:absolute` ile satır/hücreye göre konumlanır. Tabloda `.stu-card-wrap { overflow:hidden }` olduğundan, hedef kod tabanında menü **portal/overlay katmanına** taşınmalı ya da konteyner taşması yönetilmelidir; aksi halde uzun menüler kırpılabilir.

---

## Durum Modeli & Veri (mock)
```
SCH_CLASSES  → [id, ad, kademe, durum(pub|taslak|rev), conf, miss, upd, who, ver]
SCH_TEACHERS → [id, ad, brans, yuk, bos, nobet, durum]
SCH_ROOMS    → [id, ad, tur(normal|lab|salon), occ%, conf]
```
Editör (9-A) örnek yerleşimi `SED_INIT_PLACE` ile gelir: 28/30 dolu, **1 çakışma** (Per·3 Matematik), **2 eksik** (Cum·5,6). `SED_LOCKS` kilitli slotları, `SED_BUSY` harici meşguliyetleri tanımlar. Dersler ve hedef saatleri `SED_SUBJECTS` içinde (`target` = haftalık zorunlu saat).

**Ekranlar arası köprü (yalnızca demo):** `window.__schTarget` (hedef sınıf), `window.__schNew` (boş başla), `window.__schDraft` (taslaktan yükle). Production'da bunlar route/state olmalı.

---

## Rol Bazlı Görünürlük
Bu paket **Admin (tam yetki)** yüzeyidir. Aynı program, diğer portallerde **salt-okunur** türevlerle görünür (kardeş ekranlar: `myschedule`/`studentSchedule`/`parentSchedule`, ana app'te `schedule_teacher/student/parent.jsx`). Rol bazlı kısıtlama deseni için referans: **`design_handoff_oksis_takvim_rolbazli`**. Öğretmen müsaitlik/talep yüzeyleri ise `schedule_avail.jsx` · `schedule_duty.jsx` · `schedule_requests.jsx` (bu pakete dahil değil — istenirse ayrı handoff).

---

## Tasarım Token Referansı (`source/brand.css`)
| Token | Değer | Kullanım |
|---|---|---|
| `--accent` / `--navy` | `#1B2B5E` | Admin vurgu · primary buton · breadcrumb |
| `--accent-bright` / `--electric` | `#4F6BFF` | accent vurgu · seçili durum |
| `--surface` | `#EEF1FA` | sayfa yüzeyi |
| `--card` / `--bg-elev` | `#FFFFFF` | kart · tablo · drawer |
| `--line` / `--line-soft` | `#E6E9F2` / `#EFF1F8` | kenarlık · ayraç |
| `--text` / `--text-body` / `--text-muted` / `--text-faint` | `#111827` / `#374151` / `#6B7280` / `#9AA3B2` | metin hiyerarşisi |
| `--success` / `--success-bg` | `#0E7A5A` / `#D7F5EC` | Yayın durumu · "yayına hazır" |
| `--warning` / `--warning-bg` | `#B05A0A` / `#FEF3C7` | eksik saat · "yine de yayınla" |
| `--danger` / `--danger-bg` | `#991B1B` / `#FEE2E2` | açık çakışma · yayın engeli |
| `--r-card` / `--r-md` / `--r-sm` | `14 / 12 / 8px` | köşe yarıçapı |
| `--sh-sm` / `--sh` / `--sh-lg` | (bkz. brand.css) | kart / drawer / popover gölgesi |
| `--font` | `Plus Jakarta Sans` | tüm tipografi |

Ders/branş renkleri (`SED_SUBJECTS[].c`, `ACA_BRANCHES`) sabit paletten gelir; hücre sol kenarı ve mini-ızgara bu renkle boyanır.

---

## Production Notları / Güvenlik
- **Görünürlük ≠ Yetki.** Yayınlama, silme, otomatik üretim ve dışa aktarma uçları **sunucu tarafında RBAC** ile korunmalıdır. Frontend gizleme yalnızca UX içindir.
- **Yayın kapısı sunucuda da uygulanmalı:** açık çakışma varken yayın isteği API tarafından da reddedilmelidir (frontend `disabled` yeterli değildir).
- **Çakışma motoru** (öğretmen/derslik aynı saatte meşgul, müsaitlik ihlali, blok bütünlüğü) prototipte mock'tur; production'da otoritesi backend/çözücü olmalıdır. Editör yalnızca sonucu gösterir ve elle düzeltmeye izin verir.
- **Otomatik üretim** ayrı bir servis/iştir (zaman uyumsuz). Sonuç **her zaman taslaktır**; yayın ayrı bir bilinçli adımdır.
- **Bildirimler & geri-al** atomik bir yayın işlemi olarak ele alınmalı: sürüm artışı, portal güncellemesi ve bildirim aynı transaksiyonda; geri-al penceresi sunucu destekli olmalı.

---

## Dosya Envanteri (`source/`)
| Dosya | İçerik |
|---|---|
| `schedule.jsx` / `schedule.css` | **Hub / Liste** — `ScheduleScreen`, üç mercek, özet şeridi, `NewProgramModal`, `PublishModal`, satır bileşenleri |
| `schedule_editor.jsx` / `schedule_editor.css` | **Program Editörü** — sürükle-bırak grid, `CellMenu`, doğrulama çubuğu, `EdPublishModal`, `BackConfirmModal` |
| `schedule_autogen.jsx` / `schedule_autogen.css` | **Otomatik Oluştur** — `AutoGenFlow` (2 aşama), `AgCard`, `AgMini`, `AgPreview` |
| `schedule_publish.jsx` / `schedule_publish.css` | **Yayınla** — `PublishFlow` (kapı → özet → tür → kanal → onay → geri-al) |
| `academicsBase.jsx` / `academics.css` | Paylaşılan akademik primitifler — **`AcaRowMenu` (satır popover)**, `ACA_BRANCHES`, `ACA_BR`, sekme/not stilleri |
| `components.jsx` / `shell.css` | `PageTop` (standart üst bağlam barı) + kabuk yardımcıları |
| `students.jsx` / `students.css` | `StuFilter` dropdown filtre + tablo/araç-çubuğu/durum stilleri (`.stu-tbl`, `.stu-toolbar`, `.stu-state`) |
| `modals.jsx` / `modals.css` | `Modal` kabuğu + `SuccessBody` |
| `icons.jsx` | Lucide tabanlı SVG ikon seti (`Icon`) |
| `preview.html` / `preview.jsx` | Handoff önizleme köprüsü (Hub ↔ Editör) — production'da kullanılmaz |
| `brand.css` | Marka / tasarım token'ları (renk, tipografi, gölge, radius, motion) |

## Ekran Görüntüleri (`screenshots/`)
| Dosya | Ekran |
|---|---|
| `01-hub-sinif-listesi.png` | Hub — Sınıf Programları listesi |
| `02-hub-cakisma-filtre.png` | Hub — "Açık çakışma" hızlı filtresi aktif |
| `03-hub-satir-popover.png` | Hub — satır üç-nokta popover menüsü |
| `04-hub-ogretmen-programlari.png` | Hub — Öğretmen Programları merceği |
| `05-hub-derslik-dolulugu.png` | Hub — Derslik Doluluğu merceği |
| `06-yeni-program-modal.png` | Yeni Program modalı (sınıf seçimi) |
| `07-otomatik-olustur-ayarlar.png` | Otomatik Oluştur — Aşama 1 (Ayarlar) |
| `08-otomatik-olustur-sonuc.png` | Otomatik Oluştur — Aşama 2 (3 taslak karşılaştırma) |
| `09-yayinla-dogrulama-kapisi.png` | Yayınla drawer — doğrulama kapısı (engelli) |
| `10-editor-genel.png` | Program Editörü — genel görünüm |
| `11-editor-hucre-menu.png` | Editör — hücre bağlam menüsü (popover) |
| `12-editor-dogrulama-paneli.png` | Editör — Doğrulama paneli (sorun listesi) |
| `13-editor-ogretmen-gorunum.png` | Editör — Öğretmen görünümü (salt-okunur) |
