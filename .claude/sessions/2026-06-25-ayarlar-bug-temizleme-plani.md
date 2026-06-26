# Ayarlar Ekranı — Bug Temizleme (Remediation) Planı

**Tarih:** 2026-06-25
**Kaynak:** `2026-06-25-ayarlar-ekrani-test-bulgulari.md`
**Kapsam:** /admin/settings (8 sekme) + çapraz etki ekranları
**Durum:** Planlama — kod değişikliği YOK.

> Önce iş ayrımı: **🐞 Gerçek bug** (düzelt) · **🏗️ Mimari/Ürün kararı** (önce karar) · **💤 Bilinçli Debt** (roadmap, bu planın dışı) · **🧹 Tutarsızlık/Refactor** (temizlik).
> Her madde: Kök neden → Çözüm → Dokunulacak yer → Efor (S/M/L) → Risk → Önce-karar mı?

> ⚠️ **Uygulama öncesi:** İlgili modülün `.claude/specs/*` ve `.claude/docs/modules/<x>/business-rules.md` dosyaları **bağlayıcıdır** (CLAUDE.md Absolute Rule #6). Her fix'ten önce ilgili spec maddesi kontrol edilecek; çakışma varsa önce kullanıcıya bildirilecek.

---

## FAZ 0 — Bloklayıcılar (acil, yüksek etki) 🐞

### B0.1 — GeneralTab sonsuz render döngüsü `[KRİTİK]`
- **Kök neden:** `src/portals/admin/settings/tabs/GeneralTab.tsx:215` (`GnlForm`) — `useEffect` içinde her render'da değişen bir bağımlılık (muhtemelen form değeri ↔ preview senkron effect'i) setState tetikliyor. GeneralTab tüm Ayarlar sayfasında mount kaldığı için her sekmede çalışıyor.
- **Çözüm:** Offending `useEffect`'in bağımlılık dizisini düzelt; türev state'i `useMemo`'ya çevir veya RHF `watch` ile yeniden render yerine subscription kullan. `GeneralTab.tsx:1282` mount zincirini de gözden geçir.
- **Yer:** `GeneralTab.tsx` (215, 1282)
- **Efor:** S–M · **Risk:** Düşük · **Karar:** Hayır
- **Doğrulama:** Ayarlar açıkken konsol "Maximum update depth" üretmemeli (React Profiler ile render sayısı sabit).

### B0.2 — "Yeni Ders" ekleme kırık (academics/subjects 400) `[KRİTİK]`
- **Kök neden (2 ayrı):**
  1. Frontend her zaman `displayOrder: 0` gönderiyor; backend `> 0` istiyor.
  2. `code` boş gönderilebiliyor (UI "opsiyonel" der) ama backend zorunlu.
- **Çözüm (KARAR VERİLDİ):**
  - `displayOrder`: **Backend create'te otomatik atasın** (mevcut max+1, sona ekle); FE 0 göndermesin. (Öneri — basit ve çift-kaynak yok.)
  - `code`: backend zorunlu olduğundan **UI'da `*` zorunlu yap + zod validasyonu** ekle (R4.3 ile birlikte).
  - `Haftalık Saat`: artık ayrı iş → **B0.2H**'ye taşındı (seviye-bazlı model).
- **Yer:** Akademik Yapı katalog create drawer + `academics/subjects` mutation/DTO/handler.
- **Efor:** M · **Risk:** Orta (kontrat) · **Karar:** Verildi

### B0.2H — Haftalık Saat: seviye-bazlı modele bağlanır (Debt → implement) `[KARAR VERİLDİ]`
- **Karar:** Kullanıcı (2026-06-25) — Haftalık saat **seviye-bazlı** modele bağlanır; tek-kolon değil. Spec D4'ün "ayrı iş" olarak bıraktığı müfredat-saat entegrasyonu yapılır; `(Debt)` kalkar.
- **Çözüm:** Mevcut `CurriculumHourTemplate` (seviye-bazlı MEB müfredat saati) + `SchoolWeeklyHourOverride` (okul katmanı) modeline ders×seviye haftalık saatini bağla. UI tek değer yerine **seviye bazında** saat gösterir/düzenler (katalog ve create/edit drawer).
- **Yer:** Backend `CurriculumHourTemplate`/`SchoolWeeklyHourOverride` (varlık + endpoint), FE Akademik Yapı katalog + drawer.
- **Efor:** L · **Risk:** Orta–Yüksek (yeni veri akışı + UI) · **Karar:** Verildi
- **Önce:** Mevcut `CurriculumHourTemplate` kullanımı/şeması kod üzerinden netleştirilecek (TDD öncesi keşif).
- ⚠️ **Spec etkisi:** `subjects-cekirdek-genisletme-spec.md` **D4** (weeklyHours = Debt) güncellenecek (artık implement); `.claude/docs/modules/subjects/completion_status.md`'e deviation notu.

### B0.3 — "Yeni Derslik" ekleme kırık (rooms POST 400) `[KRİTİK]`
- **Kök neden:** Doğrulanamadı (app yakalanmış `fetch` referansı yüzünden gövde alınamadı). Semptom subjects ile aynı → muhtemelen zorunlu bir alan eksik/yanlış (örn. `displayOrder` veya enum eşleşmesi).
- **Çözüm:** Önce backend log/Swagger ile 400 gövdesini al (FE payload ↔ `CreateRoom` DTO karşılaştır), eksik/yanlış alanı düzelt.
- **Yer:** `src/portals/admin/settings/api/rooms/rooms.mutations.ts` + rooms create drawer + backend rooms endpoint.
- **Efor:** S–M · **Risk:** Düşük · **Karar:** Hayır (önce teşhis)

### B0.4 — Backend hata mesajlarının yüzeye çıkması 🐞
- **Kök neden:** Backend alan-bazlı `errors[]` + `correlationId` dönüyor ama UI generic "İşlem başarısız oldu" gösteriyor.
- **Çözüm:** Ortak mutation hata yakalayıcıda backend `errors[]`'i ilgili form alanlarına (RHF `setError`) ve/veya toast'a maple. B0.2/B0.3'ün hata ayıklamasını da kolaylaştırır.
- **Yer:** `shared/api` hata yardımcısı + create drawer'lar.
- **Efor:** S · **Risk:** Düşük · **Karar:** Hayır

---

## FAZ 1 — Mimari (KARARLAR VERİLDİ 2026-06-25) 🏗️

### A1.1 — Tek gerçek ders kaynağı + `/admin/subjects` silinir `[YÜKSEK]` `[KARAR VERİLDİ]`
- **Durum:** (1) Ayarlar Kataloğu → backend `academics/subjects`, (2) `/admin/subjects` → **frontend mock** (`data/seed.ts`+`store.ts`), (3) Görevlendirmeler → backend `assignments/courses`.
- **Karar (kullanıcı):** Tek gerçek kaynak = **Akademik Yapı > Ders Kataloğu** (DB: `master.subjects`, GLOBAL master — SchoolId taşımaz). **`/admin/subjects` route'u + ekranı tamamen silinir** (eski/mock).
- **Çözüm:**
  - `oksis-web` içinde `/admin/subjects` route'u, `SubjectsPage` ve `src/portals/admin/subjects/` (mock `data/seed.ts`+`store.ts` dahil) kaldırılır; sidebar "Dersler & Branşlar" linki silinir.
  - Akademik Yapı katalog kartı tek subjects UI'ı olur; backend `academics/subjects/manage` (liste) + create/update/status/delete'e bağlı (zaten bağlı; create B0.2 ile düzelir). Cache key'leri **global** (tenant prefix YOK — `master.subjects` tenant-agnostik; spec D1).
  - `assignments/courses` backend içinde aynı `master.subjects`'i mi okuyor doğrula (tutarlılık).
- ⚠️ **Spec çakışması (ezildi, kullanıcı onayı 2026-06-25):** `subjects-cekirdek-genisletme-spec.md` **D6** ("/admin/subjects 'Branşlar' sekmesi mock+Debt kalır") ve **FE-S2** ("SubjectsPage 'Dersler' sekmesi gerçeğe bağlanır") → ekran silineceği için geçersiz. **Spec güncellenecek** + `.claude/docs/modules/subjects/completion_status.md` "Spec Dışına Çıkılanlar"a not.
- **Branş (KARAR VERİLDİ 2026-06-26):** `/admin/subjects` silinir; branş **gerçek backend lookup'ına çıkarılır** (mock değil). Detay → **A1.4**.
- **Efor:** M (silme) · **Risk:** Düşük

### A1.2 — Sezon-context `[KARAR VERİLDİ]`
- **Karar (kullanıcı):** **Sezon seçici Ayarları SÜRMEZ** — Ayarlardaki veriler sezonluk değişmez (global okul ayarı). Bu, sezon spec'i ile de tutarlı (settings sezon-scoped değil). **Akademik Takvim mevcut/aktif sezonu gösterir, topbar seçicisiyle değişmez.**
- **Çözüm:**
  - Tatil Takvimi alt başlığı + `holidays?year=...` sorgusu **sabit/eski 2026'dan değil, aktif sezonun yılından** türetilir (tek kaynak: aktif sezon). Topbar seçicisine bağlanmaz.
  - Akademik Takvim aktif sezona pinlenir (yanlışsa düzelt); topbar seçici bu ekranı değiştirmez.
- **Efor:** M · **Risk:** Düşük–Orta · **Spec:** Uyumlu (`sezon-baglam-uygulama-plan.md` — settings sezon-scoped değil).

### A1.3 — Görünen Ad → topbar/sol menü `[KARAR VERİLDİ]`
- **Karar (kullanıcı):** Topbar'daki "Atlas Koleji" **yanlış/statik**; orada **Ayarlar > Görünen Ad** gösterilmeli.
- **Çözüm:** Topbar/sol menü okul adını auth-context `school.name` yerine **settings `displayName`**'e bağla; statik "Atlas Koleji" kaldır. Görünen Ad kaydı sonrası ilgili context/query invalidate edilip topbar canlı güncellensin.
- **Efor:** S–M · **Risk:** Düşük · **Karar:** Verildi

### A1.4 — Branş: `master.branches` lookup tablosu + Branş Kataloğu UI `[KARAR VERİLDİ 2026-06-26]`
- **Araştırma özeti:** "Branş" 3 ayrı şey → (1) **öğretmen branşı** `TeacherProfile.Branch`(string)+`SecondaryBranches`(string[]) — backend-persist, iş-kritik; (2) `/admin/subjects` 16 branş — salt FE mock (`seed.ts`), backend YOK; (3) timetable/sezon `branchId` = şube/classroom (alakasız). Backend'de bağımsız Branch entity/`master.branches`/`subject.branchId` **yoktu**; ders tarafı `SubjectCategory` enum (11). Görevlendirme (`SubjectBranchMatch`) + vekalet (`BranchFitResolver`) öğretmen branş **string'ini ders ADIyla** + SubjectCategory ile eşleştiriyor.
- **Karar (kullanıcı):**
  1. **Yeni `master.branches` tablosu** (global master, `master.subjects` gibi — SchoolId YOK). Alanlar: `id, name, mebCode?(nullable), isActive, displayOrder` (+ opsiyonel `color`). FE `seed.ts SEED_BRANCHES` 16 branşıyla (MEB kodlarıyla) seed edilir. Backend lookup + CRUD (`GET /academics/branches[/manage]`, `POST/PUT/.../status`).
  2. **Akademik Yapı sekmesine "Branş Kataloğu"** bölümü/kartı eklenir (Ders Kataloğu yanına); branşlar buradan eklenir/yönetilir. **Ders Kataloğu branşsız kalır (AS-1 korunur)** — Branş Kataloğu ayrı katalog.
  3. **Öğretmen ekleme/düzenlemede branş seçimi** `master.branches` GET lookup'ından beslenir → mevcut iki tutarsız mock (subjects 16 + `HireTeacherDialog` 11) **birleşir/kaldırılır**.
- **Tasarım alt-kararı (KARAR: B — `branchId` FK, kullanıcı 2026-06-26):** Öğretmen branşı **FK** olarak saklanır: `teacher.Branch`(string) → `teacher.branchId`(Guid? FK → master.branches); `SecondaryBranches`(string[]) → `secondaryBranchIds`(Guid[] FK). Gereken işler:
  - **Migration + veri taşıma:** mevcut `teacher_branch`/`teacher_secondary_branches` string değerleri normalize-ad eşleşmesiyle `master.branches` id'lerine map'lenir (eşleşmeyenler için strateji: yeni branş yarat / null bırak + uyarı — uygulamada netleştir, deviation logla).
  - **Eşleşme mantığı uyarlanır:** `SubjectBranchMatch.Resolve` + `BranchFitResolver` + `BranchMatching` şu an `teacher.Branch` **string'ini** ders ADIyla eşleştiriyor. FK'ye geçince branş adı `master.branches`'ten **resolve edilip** ad-bazlı eşleşme korunur (semantik aynı, kaynak FK). Görevlendirme hard-block ("branşsız öğretmene atama yok") `branchId == null` ile çalışır.
- **Dokunulan:** Backend yeni `Branch` entity + `master.branches` migration/seed + CRUD; **Teacher branş alanları FK migration + veri taşıma**; `SubjectBranchMatch`/`BranchFitResolver`/`BranchMatching` FK→ad resolve uyarlaması + testleri; FE Akademik Yapı'ya Branş Kataloğu UI + branch query/mutation; öğretmen branş picker'ı lookup'a bağla (FK id seçimi); `/admin/subjects` + mock silme (A1.1).
- ⚠️ **Spec çakışması (ezildi, kullanıcı onayı 2026-06-26):** `subjects-cekirdek-genisletme-spec.md` **D6** (*"bağımsız Branch entity/CRUD eklenmez"*) artık geçersiz — **bağımsız Branch entity + teacher FK yapılıyor**. Spec güncellenecek + `modules/subjects/completion_status.md` + `modules/teachers/completion_status.md` deviation. (AS-1 branşsız ders-katalogu **korunur**.)
- **Efor:** L–XL (yeni tablo + CRUD + 2 UI + picker + **teacher FK migration/veri taşıma + eşleşme uyarlaması**) · **Risk:** Yüksek (görevlendirme/vekalet eşleşmesine + öğretmen verisine dokunuyor) · **Karar:** Verildi (B)

---

## FAZ 2 — Genel Bilgiler eksikleri 🐞

### B2.1 — Logo yükleme yok `[KARAR VERİLDİ]`
- **Karar (kullanıcı):** Logo upload **MVP kapsamında yapılır**. Ancak depolama **soyutlanmış** olmalı: `local → FTP → MinIO (veya başka)` geçişi kolay olsun.
- **Çözüm:**
  - Backend: `IFileStorage` (veya mevcut storage abstraction) arkasında logo upload endpoint'i; **provider config-driven** (başlangıç: yerel disk; FTP/MinIO sağlayıcıları aynı arayüzü implemente eder, çağıran kod değişmez). Dosya yolu tenant-scoped (`SchoolId` prefix — multi-tenant kuralı).
  - Frontend: "Okul Logosu" bölümüne gerçek `input[type=file]` + önizleme + kaldır; upload sonucu URL settings'e yazılır.
- **Efor:** M · **Risk:** Düşük–Orta (storage soyutlaması) · **Karar:** Verildi

### B2.2 — İl / İlçe readonly & boş
- **Çözüm:** `locations` API (zaten yükleniyor: `settings/api/locations`) ile İl→İlçe seçici bağla; mevcut okul ilçesini (auth-context "Kadıköy") doldur.
- **Efor:** M · **Risk:** Düşük · **Karar:** Hayır (API mevcut)

### B2.3 — Kayıtta sadece dirty bölümü PUT et (minor)
- **Çözüm:** `basic-info`/`contact-info`/`address` için RHF `dirtyFields`'e göre koşullu PUT.
- **Efor:** S · **Risk:** Düşük

---

## FAZ 3 — Çapraz etki kablolaması 🐞/🏗️

### B3.1 — Tatil → Akademik Takvim yansıması yok
- **Durum:** Tatil listesi tatilleri Akademik Takvim'de işaretlenmiyor (vaade rağmen). Akademik Takvim kendi "Sezon Etkinlikleri" verisini kullanıyor, "Arşiv·salt-okunur".
- **Çözüm:** Akademik Takvim'i `school-settings/holidays` ile besle (tatilleri takvim hücrelerine işaretle). A1.2 (sezon) ile bağlantılı.
- **Efor:** M · **Risk:** Orta · **Karar:** Kısmi (entegrasyon kapsamı)

### B3.2 — Modül durumu sol menüyü gating etmiyor
- **Durum:** "Kapalı" modüller (Ders Programı, Duyurular) sol menüde duruyor; "kapatılan modül menüden kalkar" uygulanmıyor.
- **Çözüm:** Sidebar nav öğelerini aktif modül listesine göre filtrele (modül anahtarı → route guard + menü görünürlüğü).
- **Efor:** M · **Risk:** Orta (route guard) · **Karar:** Hayır (davranış zaten yazılı)

### B3.3 — Zil çizelgesi seed çakışması + tüm günler "Kapalı"
- **Durum:** Teneffüs 09:30-09:45, 2. Ders ile çakışıyor (validasyon doğru flag'liyor); Gün Atamaları tüm günler Kapalı.
- **Çözüm:** Seed/demo zil verisini düzelt (çakışmasız); Gün Atamaları için makul varsayılan (Pzt-Cum Tam Gün). **Not:** Kod bug'ı değil, veri/seed temizliği.
- **Efor:** S · **Risk:** Düşük

---

## FAZ 4 — Tutarsızlık / Refactor (component birleştirme) 🧹

- **R4.1** — Ortak **create-drawer/form iskeleti** (Yeni Ders / Yeni Derslik / Yeni Okul Tatili 3 ayrı kodlanmış). Efor: M.
- **R4.2** — Ortak **settings-tab iskeleti**: "Nerede Kullanılır" kartı + "Kaydedilmemiş değişiklikleriniz var" çubuğu + Kaydet dirty-gate her sekmede tekrar. Efor: M.
- **R4.3** — **Kısa Kod etiketi** birörnek (subjects "opsiyonel" ↔ rooms "zorunlu"; backend ikisinde zorunlu). Efor: S. (B0.2 ile birlikte yapılır.)
- **R4.4** — **Tip değeri konvansiyonu**: filtre TR label ↔ form EN enum → tek konvansiyon (enum + i18n label). Efor: S.
- **R4.5** — **API host/proxy + httpClient** birörnekleştir (tümü :5173 proxy + tek fetch sarmalayıcı). Efor: M · Risk: Orta.

---

## 💤 Bilinçli Debt (bu planın DIŞI — roadmap)

Bunlar test'te (Debt) işaretli; "bug temizleme" değil, planlı borç:
- SMS Kotası, Şube Adlandırma, `HAFT. SAAT` kolonu, Resmî/Ara/Yarıyıl tatil feed'leri (kilitli), Modüllerin çoğu (Ders Programı/Ödemeler/e-Okul/Servis/Yemekhane/Kütüphane).
- Junk seed kaydı "aaaaa" tatili — dev verisi, ürün dışı.

---

## Kararlar (kullanıcı) — özet
- **A1.1 (2026-06-25):** `/admin/subjects` SİLİNİR; tek ders kaynağı Akademik Yapı katalog (`master.subjects`). Spec D6/FE-S2 ezilir.
- **A1.4 (2026-06-26):** Branş → yeni **`master.branches`** lookup tablosu + **Branş Kataloğu** (Akademik Yapı) + öğretmen branş picker'ı bu tablodan beslenir. Öğretmen branşı **`branchId` FK** (karar B) → teacher migration/veri taşıma + eşleşme uyarlaması. Spec D6 ezilir — artık Branch entity + teacher FK VAR. Ders katalogu branşsız (AS-1) korunur.
- **B0.2H (2026-06-25):** Haftalık saat **seviye-bazlı** modele bağlanır (Debt kalkar). Spec D4 güncellenir.
- **A1.2:** Sezon seçici settings'i sürmez; takvim aktif sezona pinli (spec uyumlu).
- **A1.3:** Topbar okul adı = settings Görünen Ad (statik "Atlas Koleji" kalkar).
- **B2.1:** Logo upload MVP'de, depolama soyutlamalı (local→FTP→MinIO config-driven).
- **B0.2 displayOrder:** Backend otomatik atar.

## ✅ Tüm kararlar net — plan KAPALI, uygulanmaya hazır
- A1.4 alt-kararı: **B (branchId FK)** seçildi. Açık karar kalmadı.

## Önerilen Sıra
1. **FAZ 0** (B0.1 → B0.4): Bloklayıcılar + hata yüzeyleme. Hızlı, yüksek etki.
2. **A1.3** (displayName) + **B2.1** (logo) + **A1.2** (sezon) — net, orta efor.
3. **A1.1** (subjects silme) + **A1.4** (master.branches + Branş Kataloğu + teacher FK) — birlikte; spec güncellemesiyle. A1.4 en büyük kalem (L–XL, teacher migration + eşleşme).
4. **B0.2H** (seviye-bazlı haftalık saat) — keşif sonrası, L efor.
5. **FAZ 3 → FAZ 4** kalan etki/refactor.

> Her uygulama dilimi: ilgili spec/business-rules oku → TDD (kırmızı test) → incremental → review → commit (OKSİS formatı, fix'lerde önce onay). A1.1/A1.4/B0.2H spec ezdiğinden: `subjects-cekirdek-genisletme-spec.md` (D4/D6/FE-S2) güncelle + ilgili `completion_status.md` "Spec Dışına Çıkılanlar" notları.

> Spec'i ezen kalemler (A1.1, B0.2H) uygulanırken: `subjects-cekirdek-genisletme-spec.md` güncellenecek (D4/D6/FE-S2) + `modules/subjects/completion_status.md` "Spec Dışına Çıkılanlar"a tarih/sebep/onay notu (CLAUDE.md modül-doc kuralı).

> Her madde için akış: spec kontrol → TDD (önce kırmızı test) → incremental implement → review → commit (OKSİS commit formatı). Fix'lerde önce kullanıcı onayı (memory: fix'lerde auto-commit yok).
