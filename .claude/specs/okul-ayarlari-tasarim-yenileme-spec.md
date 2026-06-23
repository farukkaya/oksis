# Okul Ayarları — Tasarım Yenileme · Teknik Hazırlık Spec'i

> **Tür:** Bağlayıcı teknik hazırlık + fark analizi + fazlama planı (`.claude/specs/` → bağlayıcı anlaşma, CLAUDE.md Absolute Rule #6).
> **Oluşturma:** 2026-06-24 · **Durum:** Onay bekliyor (uygulama bir sonraki adım).
> **Kapsam:** Yönetim (Admin) portalı · Okul Ayarları ekranı · 8 sekme · handoff'a birebir görsel yenileme.

---

## 0. Bu belge nedir, ne değildir

- **Nedir:** Yeni handoff tasarımını (`design_handoff_oksis_ayarlar`) **mevcut canlı web + backend** ile alan-alan kıyaslayan doğrulanmış fark analizi ve fazlama planı. Kod yazılmadan önce zemini netleştirir.
- **Değildir:** Uygulama planı değil (o, onaydan sonra `writing-plans` ile üretilecek). Tasarım dosyalarının birebir kopyası değil — handoff bir görsel/davranış referansıdır, kontrat buradan türetilir.

### Kaynaklar
1. **Handoff:** `/tmp/oksis_handoff/design_handoff_oksis_ayarlar/` (orijinal: `~/Downloads/Oksis Layout (Copy)-settings.zip`) — React 18 + inline Babel hi-fi prototip.
2. **Teknik analiz docx:** `~/Documents/oksis/OKSiS-Okul-Ayarlari-API-Teknik-Analizi.docx` — ⚠️ **Bu belge geçersiz/eskidir** (aşağıya bakın); referans olarak kullanılır, kontrat olarak değil.
3. **Mevcut web:** `oksis-web/src/portals/admin/settings/` (canlı, 8 sekme).
4. **Mevcut backend:** `oksis-api` Schools + Timetable + Academics modülleri (doğrulandı).

---

## 1. Headline bulgu: docx'in temel önermesi geçersiz

docx, "büyük değişiklik yok, info eklenecek" çerçevesini yanlış bulup "3 tamamen yeni backend domaini + 21-endpoint baseline" sonucuna varmış. **Gerçek-kod doğrulaması bunun yanlış olduğunu gösteriyor:**

- Web'de **8 sekme handoff'la aynı isim/sırada zaten var** (shadcn/ui + Tailwind + RHF/Zod + React Query, gerçek endpoint'lere bağlı).
- **Derslikler = `Room` aggregate + `RoomsController` (tam CRUD) zaten var** (Timetable modülü altında). docx'in "yeni domain + isim tuzağı" endişesi yersiz — `Room` adıyla çoktan çözülmüş.
- **Akademik Yapı** entity'leri (`SchoolGradeLevel`, `SchoolGradeLevelScale`) + `GET/PUT /grade-levels` + `/grade-level-scales` + çoklu `SchoolTypes` zaten var.
- **Akademik Politikalar** `PUT /academic-policy` + domain metodu var (GET yok, alanlar tasarımdan dar).
- **Modüller sekmesi neredeyse handoff'un kendisi:** 10 modül kataloğu + etiketler + `BackendDebtBadge` + `PlanStatusCard` + `SettingsSaveBar` zaten frontend-first yapılmış.
- **Tasarım token'ları** (navy `#1B2B5E`, blue `#3A4F9C`, electric `#4F6BFF`, brand-gradient, surface/line, radii, Plus Jakarta Sans, 15px taban) **`oksis-web/src/styles/theme.css`'te birebir mevcut** — token hizalama işi sıfır.

**Sonuç:** Bu iş "sıfırdan domain inşası" değil; ağırlıklı bir **frontend görsel/yerleşim yeniden tasarımı** (handoff'un hi-fi 2-kolon kart düzeni, sticky PageTop + portal head-action butonu, dirty-state savebar, "Önizleme / Kayıt Bilgisi / Nerede Kullanılır" yan kartları) + **küçük, hedefli backend genişletmeleri/temizlikleri**.

---

## 2. Bağlayıcı kararlar (2026-06-24, kullanıcı onaylı)

| # | Karar | Detay |
|---|---|---|
| **K1** | **Etiketli fazlama** | Spec her boşluğu `FE-now` / `BE-now` / `Debt-defer` etiketler; nihai sekme-bazlı karar uygulama sırasında verilir (en esnek model). |
| **K2** | **Ölü alan temizliği** | Handoff'ta olmayan mevcut alanlar **hem UI'dan hem backend'den** kaldırılır — ölü alan kalmaz. Etkilenenler: Tema renk seçicileri (`primaryColor`/`secondaryColor`), `taxNumber`, `taxOffice`(vergi dairesi), `fax`. **Logo korunur** (Genel Bilgiler'de kalıyor). |
| **K3** | **Sekreter salt-okunur gerçek** | `school-settings.view` izni Sekreter rolüne eklenir; `ReadOnlyBanner` tüm 8 sekmeye entegre edilir (formlar `disabled`, birincil aksiyon gizli). |
| **K4** | **Standart `PageHeader` kullanılacak** | Diğer ekranlardaki paylaşımlı `src/shared/components/PageHeader/` bileşeni kullanılır — `breadcrumb` + `subtitle` + first-class `tabs` (sayaç rozetli sticky şerit) + `actions`. **Custom PageTop / set-tabs / head-action portalı KURULMAZ.** |
| **K5** | **Kurum Yetkilisi = SüperAdmin-only** | `SchoolAuthority` (Ad/Unvan/E-posta) yalnızca **SüperAdmin** tarafından güncellenebilir; Admin (ve Sekreter) salt-okunur görür. Yetki: yeni `school-settings.manage-authority` SüperAdmin'e seed. |
| **K6** | **BranchNamingPattern statik** | Şube adlandırma kuralı yalnızca **statik gösterim** (FE) — DB kolonu/kaydı **eklenmez**. |

> **K2 notu — dikkat:** Tema renklerini backend'den kaldırmak `SchoolTheme` VO + `update-theme` endpoint + ilgili migration'ı etkiler. `SchoolTheme.LogoUrl` korunur; renk kolonları drop edilir. Public branding (anonim logo endpoint) logoyu kullanmaya devam eder. Bu, geri-dönüşü olan bir veri kaybıdır → migration data-preserving değil, **drop**; onaylanan kapsamdadır.

---

## 3. Ortak desenler (8 sekmenin paylaştığı iskelet)

Handoff'un shell deseni → mevcut web karşılığı:

| Handoff deseni | Açıklama | Mevcut web karşılığı / aksiyon (K4) |
|---|---|---|
| Sticky PageTop (breadcrumb + H1 + aktif sekme altyazısı) + sekme şeridi + birincil aksiyon | Handoff'un PageTop + `.set-tabs` + `#set-head-actions` üçlüsü | **Standart `PageHeader` tek bileşende karşılar:** `breadcrumb` + `subtitle`(aktif sekme açıklaması) + `tabs`(controlled, sayaç rozetli) + `actions`(sekme birincil butonu). Mevcut `SchoolSettingsTabs` (ayrı pill nav) **kaldırılır**, yerini `PageHeader.tabs` alır. Handoff'un `SETTINGS_TABS[3]` altyazıları `subtitle`'a beslenir. |
| `.gnl-savebar` dirty-state çubuğu | Vazgeç + Kaydet, hatalı alan kilidi | `SettingsSaveBar` var (Modüller'de); **tüm form sekmelerine yaygınlaştırılacak** |
| Yan kartlar: "Önizleme / Kayıt Bilgisi / Nerede Kullanılır" | 2-kolon grid (`gnl-grid`: main + side) | Yeni; **paylaşılan kart bileşenleri** (`SettingsSideCard`, `WhereUsedCard`) |
| `set-ro-banner` (Sekreter) | salt-okunur uyarı | `ReadOnlyBanner` var, entegre değil → **K3** ile entegre |
| Drawer (ekle/düzenle) + Modal (onay) | `students.css`/`modals.css` sistemi | `RoomFormDrawer`, `*FormModal`, `AlertDialog` var → handoff drawer/modal stiline hizalanacak |
| Toast (kayıt sonrası) | alt köşe onayı | Sonner var ✅ |
| `Toggle`, `.fld`, segment, radio, `inp-suffix`, `inp-icon` | form kontrolleri | shadcn karşılıkları var; handoff görünümüne stil hizalama |

**Tasarım sistemi:** token'lar zaten hizalı (§1). İş, bu ortak iskeleti shadcn/Tailwind ile handoff görünümüne getirmek + sekme içeriklerini yeniden düzenlemek.

---

## 4. Sekme sekme doğrulanmış fark analizi

Etiketler: **✅** zaten var · **🟢** küçük · **🟠** orta · **🔴** büyük. Her boşlukta `[FE-now]` / `[BE-now]` / `[Debt-defer]` öneri etiketi (K1; nihai karar uygulamada).

### Sekme 1 — Genel Bilgiler 🟡
Mevcut web: 4 bölüm (temel / iletişim / adres / **tema**). Backend: OfficialName, MebCode, ContactInfo, Address, Theme ✅.

| Tasarım öğesi | Durum | Öneri |
|---|---|---|
| Logo + resmî ad + MEB kodu(kilit) + tel/eposta/web + il/ilçe + açık adres | ✅ var | `[FE-now]` yeni 2-kolon düzene taşı |
| Görünen Ad (`DisplayName`) | 🔴 BE'de yok | `[BE-now]` ucuz kolon (nullable) |
| Kurum Türü (Özel/Devlet/Vakıf = `OwnershipType` enum) | 🔴 BE'de yok | `[BE-now]` enum kolon. **Not:** mevcut `SchoolType`/`SchoolTypes`(kademe) ile karıştırma — bu *sahiplik* türü |
| Kuruluş Yılı (`FoundingYear int?`) | 🔴 BE'de yok | `[BE-now]` nullable int |
| Kurum Yetkilisi kartı (Ad/Unvan/E-posta = `SchoolAuthority` VO) | 🔴 BE'de yok | `[BE-now]` owned VO (ContactInfo deseni) — **K5: yalnız SüperAdmin günceller** (`school-settings.manage-authority`); Admin/Sekreter salt-okunur |
| Kayıt Bilgisi kartı (Kurum ID + oluşturulma + son güncelleme + güncelleyen) | 🟡 audit domain'de var, DTO'da yok | `[BE-now]` `recordInfo` bloğu GET'e + `UpdatedBy`→ad çözümü |
| Önizleme kartı (menü görünümü) | client-only | `[FE-now]` |
| **Tema renk seçicileri** (`primaryColor`/`secondaryColor`) | K2 | `[FE-now + BE-now]` **kaldır** (UI + `SchoolTheme` renk kolonları + endpoint) |
| **`taxNumber` / `taxOffice` / `fax`** | K2 | `[FE-now + BE-now]` **kaldır** (UI + domain + migration) |

### Sekme 2 — Akademik Yapı 🟠
Backend: grade-levels ✅, çoklu `SchoolTypes` ✅. Mevcut web: okul türü(çoklu) + kademe(salt) + timezone + ders günleri + günlük ders sayısı + öğrenci no prefix/uzunluk.

| Tasarım öğesi | Durum | Öneri |
|---|---|---|
| Kademeler listesi (aç/kapat + şube sayısı + "kullanımda" kilidi) | 🟡 SchoolTypes var; şube sayımı agregasyon | `[FE-now]` + **şube sayısı gerçek `Class` agregasyonundan** `[BE-now]` (AS-3 onaylı) |
| Şube adlandırma kuralı (harf "9-A" / sayı "9-1") | K6 | `[FE-now]` **statik gösterim** — DB kaydı yok |
| Ders Kataloğu = **Subjects modülü** (seçmeli + zorunlu dersler, **sezon bağımsız**, **branş bağlantısı gösterilmez**) | 🟠 web'de `subjects` modülü var (`SubjectsPage`/`CourseDrawer`); BE `GET /subjects` var, CRUD belirsiz | AS-1 onaylı. `[FE-now]` mevcut Subjects ders yönetimini bu sekmede yüzeye çıkar (branşsız); **Subjects CRUD backend** `[BE-now veya Debt-defer]` — bkz. AS-1 notu |
| Şube Adlandırma + Nerede Kullanılır yan kartları | yeni | `[FE-now]` |
| Mevcut alanlar | AS-2 onaylı | **Korunur:** Günlük Ders Sayısı, Eğitim Dili. **Kaldırılır (UI+BE):** timezone, öğrenci no prefix/uzunluk, haftalık ders günleri |

### Sekme 3 — Akademik Politikalar 🔴
Backend `AcademicPolicy`: `DefaultGradeScaleId`, `DefaultPassingScore`, `GraduatedDataRetentionYears`, `RequireApprovalForClassRoomCreation`, `AutoPublishReportCards`. Mevcut web: geçme notu + skala + iş akışı + `GradeLevelScalePanel` + "Devamsızlık (Yakında)" placeholder.

| Tasarım öğesi | Durum | Öneri |
|---|---|---|
| Geçme Notu (`DefaultPassingScore`) | ✅ var | `[FE-now]` |
| Karne Not Skalası (100'lük, MEB sabit, kilitli) | client sabit | `[FE-now]` |
| Yuvarlama Kuralı (yok/en yakın/yukarı = `RoundingRule` enum) | 🔴 yok | `[BE-now]` veya `[Debt-defer]` |
| Yazılı sayısı / Performans sayısı (1..3) | 🔴 yok | `[Debt-defer]` (INV-POL doğrulamalı) |
| Not ağırlıkları (yazılı+perf = %100, canlı doğrulama) | 🔴 yok | `[Debt-defer]` — INV-POL-1 |
| Devamsızlık (özürsüz/toplam/uyarı eşiği + veli bildirim) | 🔴 yok (NotificationConfig'teki eşikler farklı) | `[Debt-defer]` — INV-POL-2 |
| Takdir/Teşekkür eşikleri + otoBelge | 🟡 `AutoPublishReportCards` var | `[Debt-defer]` — INV-POL-3 |
| MEB varsayılanlarına dön | client reset | `[FE-now]` (sunucu sabiti `[Debt-defer]`) |

**Backend invariant'lar (uygulanırsa FluentValidation + domain):** INV-POL-1 `wYazılı+wPerf=100`; INV-POL-2 `toplam>özürsüz>uyarı`; INV-POL-3 `takdir>teşekkür`, 1..100; INV-POL-4 `geçme 1..100`. **Politika scope'u (AS-5 onaylı):** **tenant-geneli, sezondan bağımsız** — sezon parametresi yok.

### Sekme 4 — Derslikler 🟢
Backend: `Room` + `RoomsController` (GET/POST/PUT/DELETE) ✅. Mevcut web: `RoomsTab` tam CRUD (tablo+kart+filtre+sayfalama) ✅.

| Tasarım öğesi | Durum | Öneri |
|---|---|---|
| Liste/CRUD/arama/tip+durum filtre/tablo-kart/sayfalama (8/9) | ✅ neredeyse tam | `[FE-now]` handoff görünümüne (Öğrenci tablo sistemi) hizala |
| Derslik tipi: 7 enum (Sınıf/Lab/Atölye/Spor Salonu/Konferans/Kütüphane/Diğer) | 🟡 `RoomType` 4 değer (Classroom/Laboratory/Workshop/Other) | `[BE-now]` enum 4→7 + i18n + RoomTypeBadge |
| Açıklama/Not alanı | 🔴 muhtemelen yok | `[BE-now]` nullable kolon veya `[Debt-defer]` |
| inuse (kullanımdaysa silinemez, pasife) + "Kullanımda" pill | 🟡 web'de var; BE guard? | `[BE-now]` silme guard (409) doğrula |
| Pasife alma onay dialogu | ✅ AlertDialog var | `[FE-now]` handoff `DeactivateDialog` stili |

### Sekme 5 — Zil Programı 🔴
Backend: `BellSchedule` düz liste ✅. Mevcut web: düz grid + modal + bulk reset.

| Tasarım öğesi | Durum | Öneri |
|---|---|---|
| Zil satırları (ders/teneffüs/öğle + start-end) | ✅ var | `[FE-now]` |
| İki şablon (Tam Gün / Yarım Gün = `TemplateKey`) | 🔴 yok | `[BE-now]` `template_key` kolon **veya** `[Debt-defer]` (client şablon) |
| Gün atamaları (Pzt..Paz → tam/yarım/kapalı = `BellDayAssignment`) | 🔴 yok | `[BE-now]` yeni tablo **veya** `[Debt-defer]` |
| Otomatik üretici (start/ders/ten/count/öğle params) | client | `[FE-now]` (params persist → `[Debt-defer]`, AS-7) |
| Timeline görseli + çakışma/süre kilidi | client | `[FE-now]` — INV-ZIL bulk save'de BE doğrulamalı `[BE-now]` |
| Nerede Kullanılır kartı | yeni | `[FE-now]` |

### Sekme 6 — Tatil Takvimi 🟠
Backend: `Holiday` + `HolidayType`(PublicHoliday/SchoolEvent/ClosedDay/SemesterBreak) + `AcademicSessionId` ✅; `GET /holidays?year=`. Mevcut web: yıl-bazlı, 3 tür form, recurring.

| Tasarım öğesi | Durum | Öneri |
|---|---|---|
| Okul tatili CRUD (ekle/düzenle/sil) | ✅ var | `[FE-now]` handoff drawer + ay ayırıcı + sezon özeti |
| Taksonomi: resmi/ara/yarıyıl(kilitli) + okul(CRUD) | 🟡 enum farklı (PublicHoliday/SchoolEvent/ClosedDay/SemesterBreak) | `[BE-now]` AS-4 onaylı: `HolidayType`'a `AraTatil` ekle + taksonomi hizala + migration |
| Birleşik kaynak: resmî(MEB global) + yarıyıl(Sezon) + okul(tenant) | 🔴 sadece tenant tatili | `[Debt-defer]` (official katalog + academic-years bağımlılığı) |
| Sezon-scope (seasonId) | 🟡 `AcademicSessionId` var, GET year-bazlı | `[BE-now]` GET'e seasonId param — Sezon/Dönem bağlam sistemiyle hizala |
| Kilitli türlerde lock tooltip | client | `[FE-now]` |

### Sekme 7 — Bildirim Ayarları 🔴
Backend `NotificationConfig`: 4 kanal toggle (Push/Email/Sms) + 2 devamsızlık eşiği + LateArrivalNotify ✅; **GET yok**. Mevcut web: 4 switch + 2 eşik.

| Tasarım öğesi | Durum | Öneri |
|---|---|---|
| Olay × kanal matrisi (4 grup × ~8 olay × 3 kanal, smsNa) | 🔴 yok (konsept farklı) | `[Debt-defer]` — `notification_types` kataloğu + per-event config; büyük |
| Mevcut kanal toggle'ları (Push/Email/SMS genel) | ✅ var | `[FE-now]` matris gelene kadar köprü |
| Sessiz saatler (toggle + aralık; acil deler) | 🔴 yok | `[Debt-defer]` `quiet_hours_*` |
| Günlük SMS limiti | 🔴 yok | `[Debt-defer]` `daily_sms_limit` |
| SMS Kotası kartı (kullanım/başlık/sağlayıcı — info) | 🔴 yok | `[Debt-defer]` `GET /sms-quota` (sağlayıcı kaynağı, AS-6) |
| GET endpoint | 🔴 yok (sadece veri `GET /school-settings` içinde) | `[BE-now]` matris gelirse ayrı GET |

### Sekme 8 — Modüller 🟢 (FE büyük ölçüde hazır)
Backend: 6 seed + `PlanModule` katalog + `isAvailableInPlan` + `requiredPlan` ✅. Mevcut web: **10 modül kataloğu + etiket + Debt rozeti + PlanStatusCard + SaveBar zaten var.**

| Tasarım öğesi | Durum | Öneri |
|---|---|---|
| 10 modül kartı + aç/kapat + çekirdek kilidi + plan kilidi | ✅ FE hazır | `[FE-now]` handoff kart görünümüne ince hizalama |
| Etiketler (çekirdek/beta/plan/normal = `ModuleTier`) | 🟡 FE'de tag var; BE'de Tier enum yok | `[BE-now]` Tier enum **veya** `[Debt-defer]` (FE tag yeterli) |
| Seed 6 → 10 modül | 🟡 BE 6; FE 10 (4'ü Debt) | `[BE-now]` seed büyütme + backfill **veya** `[Debt-defer]` |
| Plan Durumu kartı (aktif/toplam + plan adı + yenileme tarihi) | 🟡 var; yenileme tarihi Debt | `[Debt-defer]` yenileme tarihi (abonelik kaynağı) |

---

## 5. Konsolide backend dokunuş envanteri (öneri etiketli)

**`[BE-now]` (düşük riskli, migration kolon ekleme/temizleme):**
- `SchoolSettings`: +`DisplayName`, +`OwnershipType`(enum), +`FoundingYear`(int?); −tema renk kolonları, −`TaxNumber`, −`TaxOffice`, −`Fax` (K2). **`BranchNamingPattern` EKLENMEZ** (K6: statik FE gösterimi). Akademik Yapı'dan kaldırılacak alanlar (AS-2): timezone, öğrenci no prefix/uzunluk, haftalık ders günleri — domain + migration temizliği.
- `recordInfo` GET projeksiyonu (audit alanları + `UpdatedBy`→ad).
- `SchoolAuthority` owned VO + yeni izin `school-settings.manage-authority` (yalnız SüperAdmin — K5).
- `RoomType` enum 4→7 + `Room.Note`.
- Kademe şube sayısı: `Class` agregasyon sorgusu (AS-3).
- Sezon-scope GET /holidays?seasonId; HolidayType +`AraTatil` + taksonomi hizalama + migration (AS-4).
- İzinler: `school-settings.view` → Sekreter rolü (K3). (`classrooms.*` yeni izin **gerekmez** — Room mevcut yetkiyle.)
- **Subjects CRUD** (Ders Kataloğu, AS-1): backend `GET /subjects` var, CRUD belirsiz → CRUD eksikse `[BE-now]`, değilse `[Debt-defer]`; inuse guard.

**`[Debt-defer]` (yeni tablo / aggregate / büyük domain — Frontend-First Debt deseniyle ekranda rozetli):**
- Akademik Politika alan genişlemesi (rounding/exam counts/weights/absence/takdir-teşekkür) + INV-POL.
- Zil `TemplateKey` + `BellDayAssignment` (+ üretici param persist).
- Bildirim matrisi (`notification_types` + per-event config) + quiet hours + SMS limiti + SMS kotası.
- Ders Kataloğu Subjects CRUD + inuse guard.
- Tatil birleşik kaynak (official katalog + academic-years yarıyıl).
- Modül Tier enum + seed 6→10 + plan yenileme tarihi.

**Korunan endpoint'ler:** Logo upload/delete, grade-levels, grade-level-scales, mevcut Room/Holiday/Bell/Module/Notification yazma uçları.

---

## 6. Önerilen fazlama

> K1 gereği her faz `FE-now`/`BE-now`/`Debt-defer` etiketleriyle yürür; Debt olanlar `BackendDebtBadge` ile ekranda işaretlenir.

- **Faz A — Shell + ortak desen (FE-now):** PageTop+altyazı+breadcrumb, `#set-head-actions` portalı, alt-çizgi sekme şeridi, paylaşılan savebar + yan kart bileşenleri (`SettingsSideCard`/`WhereUsedCard`), `ReadOnlyBanner` entegrasyonu iskeleti.
- **Faz B — Sekreter salt-okunur (K3):** `school-settings.view` seed → Sekreter; tüm sekmelere banner + disabled form.
- **Faz C — Düşük riskli BE + ilgili sekmeler:** Genel Bilgiler (yeni alanlar + recordInfo + ölü alan temizliği K2), Derslikler (RoomType 7 + not + görsel), Modüller (görsel + opsiyonel Tier/seed).
- **Faz D — Orta sekmeler:** Akademik Yapı (şube adlandırma + kademe görünümü; Ders Kataloğu Debt), Tatil (taksonomi + sezon-scope; birleşik kaynak Debt).
- **Faz E — Büyük domainler (ağırlıklı Debt):** Akademik Politikalar (genişletme veya Debt), Zil (şablon/gün-atama veya Debt), Bildirim matrisi (Debt).

Pilot için Faz A–C beş sekmeyi tam çalışır kılar; D–E aşamalı açılır.

---

## 7. Açık sorular (uygulamadan önce netleşmeli)

| # | Soru | Karar |
|---|---|---|
| **AS-1** | Ders Kataloğu kapsamı | ✅ **Subjects modülünün kendisi**; sezon bağımsız; okulda verilen seçmeli + zorunlu dersler; **branş bağlantısı gösterilmez**. |
| **AS-2** | Akademik Yapı'daki tasarımda olmayan alanlar | ✅ **Korunur:** Günlük Ders Sayısı, Eğitim Dili. **Kaldırılır (UI+BE):** timezone, öğrenci no prefix/uzunluk, haftalık ders günleri. ⚠️ *Kaldırılanların başka modülce kullanımı uygulama öncesi taranmalı.* |
| **AS-3** | Kademe "şube sayısı" kaynağı | ✅ **Gerçek `Class` agregasyonundan** (`[BE-now]`). |
| **AS-5** | Akademik politika scope | ✅ **Tenant-geneli, sezondan bağımsız.** |
| **AS-6** | SMS kotası kaynağı | ✅ **Statik veri (Debt) — şimdilik.** |
| **AS-4** | HolidayType taksonomi eşlemesi | ✅ **Enum şimdi genişletilir/eşlenir** (`[BE-now]`): `HolidayType`'a `AraTatil` eklenir ve tasarım taksonomisine (Resmî/Ara/Yarıyıl/Okul) hizalanır + migration. Kilitli kaynak beslemesi (MEB katalog + sezon yarıyıl) yine `[Debt-defer]`. |
| **AS-7** | Zil üretici parametreleri persist | ✅ **Client-only — saklanmaz.** Yalnız üretilen çizelge satırları persist edilir; parametre kalıcılığı `[Debt-defer]`. |

---

## 8. Spec çakışma kontrolü (Absolute Rule #6)

- `.claude/specs/` altında okul ayarları için **mevcut bağlayıcı spec yok**. En yakın otorite `oksis-admin-ekranlari-mimari-spec.md` (admin ekran mimarisi) — bu spec onunla uyumlu yürütülmeli.
- Naming: `Mark`=not, `Grade`=sınıf seviyesi; bu ekrandaki "Derslik" = fiziksel `Room` (öğrenci grubu `Class` değil). Karıştırma yasağı korunur.
- Multi-tenant, MVP-scope, permission-matrix kuralları her faz için geçerli; yeni izin/alan eklenince `permission-matrix.md` + modül dokümanları + `completion_status.md` güncellenir.

---

## 9. Sonraki adım

Bu spec onaylanınca: seçilen faz(lar) için `writing-plans` ile ayrı uygulama planı üretilir (FE ve gerekiyorsa BE ayrı dilimler). `completion_status.md`'ye "⚠️ Spec Dışına Çıkılanlar" altında K2 (tema/vergi/faks temizliği) ve K3 (Sekreter RO) anında loglanır.
