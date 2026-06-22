# Sezon / Dönem Bağlamı — Faz/Dilim Uygulama Yol Haritası

> **Agentic worker için:** Her dilim, yürütme anında `superpowers:writing-plans` ile kendi
> `…-plan-be.md` / `…-plan-fe.md` detay planına (gerçek dosyalar + TDD adımları) açılır.
> Bu dosya **yol haritasıdır**: sıralama, bağımlılık, kapsam ve kabul kriterleridir; bite-sized
> kod adımları içermez. İlerleme `- [ ]` kutularıyla dilim düzeyinde takip edilir.

**Hedef:** İki kaynak analizini (`sezon_donem_ihtiyac_analizi` = rol-bazlı bağlam seçici;
`sezon_yonetimi_uygulama_analiz` = Sezon Listesi + Devir Sihirbazı) üretim koduna tam taşımak;
ihtiyaç analizinin **kırmızı çizgisini** (model day-0 doğru, özellik ertelenebilir) korumak.

**Mimari:** Backend zaten kırmızı çizgiyi sağlıyor (`AcademicSession` Setup/Active/Archived +
`IsCurrent`, `AcademicTerm` Status, `ContextResolver = LastActiveSeasonId ?? CurrentSession`,
yıl-scoped/dönem-scoped FK'ler, rollover orkestrasyonu). Kalan iş ağırlıkla **tüketim katmanında**
(shell topbar seçici + client query-scoping) ve **küçük backend kapanışlarında**. Sezon yönetimi
ekranı ve backend modeli yapısal değişmez.

**Tech Stack:** oksis-api (.NET 10, CQRS/MediatR, EF Core 10) · oksis-web (React 18, shadcn/ui,
TanStack Query v5, Zustand, RHF+Zod).

## Global Constraints (CLAUDE.md — her dilim için geçerli)

- Multi-tenant: her sorgu/cache/key `SchoolId` scope'lu; client React Query key'leri tenant prefix'li.
- `Mark` = not, `Grade` = kademe — karıştırma.
- **Ayrı grid kütüphanesi YOK** — listeler shadcn `Table`/`DataTable`. *(Belge §9'daki "DevExtreme DataGrid" referansı geçersiz; kod zaten düz `<table>` kullanıyor — korunacak.)*
- Permission kontrolü her zaman sunucu tarafında; UI gate yalnız UX.
- `any` yasak; default export sayfa/component'te yasak; inline style yasak.
- Commit: OKSİS formatı `YYYY-MM-DD <type>: Türkçe özet.`
- Bağlayıcı spec'ler: `oksis-admin-ekranlari-mimari-spec.md` (§1.2 kişi≠kayıt, §4.9, §5.9, §1.3 hard-delete yasağı). Aykırılıkta dur, madde numarasıyla bildir.

## Bağımlılık grafiği

```
Faz A (ekran kapanışı, bağımsız)  ─┐
                                   ├─►  hazır zemin
Faz B (rol altyapısı) ────────────┘        │
                                           ▼
                              Faz C (topbar seçici rol modları)
                                           │
                              Faz D (client query-scoping) — C ve sonraki modüllerle birlikte, kesişen
```

- **Faz A** hiçbir şeye bağlı değil → ilk yapılır (hızlı kapanış).
- **Faz C**, Koordinatör/öğretmen/veli rol ayrımları için **Faz B**'ye bağlı.
- **Faz D** kesişen bir kalite kuralı; ayrı "büyük" iş değil, C içinde ve dönem-tüketen modüller (marks/attendance) geldikçe uygulanır.

---

## FAZ A — Sezon Yönetimi Ekranı Kapanışı (≈%90 → %100)

`sezon_yonetimi_uygulama_analiz` belgesinin koda karşı işaretlenmesinden çıkan **gerçekten kalan**
kalemler. Düşük risk, çoğu backend. Hiçbiri ekranın yapısını değiştirmez.

### Dilim A1 — Okul tatili toplu kopyalama (backend) ❌
- **İhtiyaç:** Devir sihirbazı Adım 4 "okul tatillerini önceki sezondan kopyala" toggle'ının backend karşılığı.
- **Sorun:** `OpenSeasonFromDraft` içindeki `CopyHolidays` bloğu hâlâ placeholder/TODO.
- **Dokunulan:** `Oksis.Application/Modules/AcademicSessions/Commands/OpenSeasonFromDraft/…` (CopyHolidays bloğu); kaynak sezon `SchoolHoliday`'lerini (`HolidayType` koruyarak, tarihleri +1 yıl kaydırmadan kopyala — okul tatilleri sezona özgü, kullanıcı düzenler).
- **Kabul kriteri:** `CopyHolidays=true` taslakla açılan sezon, kaynak sezonun okul tatillerini (`SchoolEvent/ClosedDay`) yeni sezona kopyalar; resmi tatiller (`PublicHoliday`) `OfficialHoliday` master'dan üretilir, kopyalanmaz; idempotent.
- **Test:** Application.UnitTests — kopya sayısı + tür filtresi + tekrar çağrıda çiftleme yok.
- **Efor:** Küçük (BE).

### Dilim A2 — `holidays:reader` cache invalidation ⏳
- **Sorun:** `OpenSeasonFromDraft` yarıyıl tatili (`SemesterBreak`) yazarken `holidays:reader:{schoolId}` cache'ini geçersizleştirmiyor (bilinen düşük-riskli boşluk; yeni sezon Setup'ta).
- **Dokunulan:** Aynı handler — cache invalidation çağrısı; A1 ile birlikte tek dilimde ele alınabilir.
- **Kabul kriteri:** Tatil yazımından sonra ilgili reader cache key invalidate edilir.
- **Efor:** Çok küçük (BE) — A1'e bitişik.

### Dilim A3 — İzin anahtarlarını `season.*`'a yeniden adlandır ❌ (KARAR: yeniden adlandır)
- **Karar (2026-06-22, kullanıcı):** Belge §8 isimlerine geçilecek — `season.list.read`, `season.draft.create/update/delete`, `season.open`, `season.activate` (yalnız yönetici), `season.archive.view`.
- **Dokunulan:** Identity izin seed + migration (yeni `season.*` izinleri, eski `academic-sessions.*`/`seasons.view-archived`/`students.promote` atıflarının taşınması); tüm `[RequirePermission(...)]`/policy atıfları (academic-sessions controller + ilgili handler'lar); `permission-matrix.md` + `completion_status.md` "Spec Dışına Çıkılanlar" notunun kapanışı.
- **Kabul kriteri:** Eski izinle gate'lenmiş hiçbir uç kalmaz; rol matrisi (§8) birebir; tüm yetki testleri yeşil; School_Admin için davranış değişmez.
- **Bağımlılık:** A1 merge edildikten **sonra** (ikisi de academic-sessions alanına dokunur — sıralı).
- **Efor:** Orta (BE — migration + geniş atıf taraması).

---

## FAZ B — Rol Altyapısı: Koordinatör + Sunucu-Tarafı Sezon Gating

Her iki belgenin ortak bağımlılığı. Topbar seçicinin rol modları ve Sezon Yönetimi izin matrisi
gerçek bir **Koordinatör** rolü ve sunucu-tarafı sezon erişim kısıtı gerektirir.

### Dilim B1 — Koordinatör rolü ⏸️ ERTELENDİ (KARAR: 2026-06-22, kullanıcı)
> Pilotta tüm yönetim `School_Admin`'de kalır; ayrı Koordinatör rolü kurulmaz. Bağlı dilim C3 (koordinatör draft-mode) de ertelenir. C1/C2 bundan etkilenmez. Aşağıdaki kapsam Pilot Sonrası içindir.


- **İhtiyaç:** `sezon_yonetimi_uygulama_analiz §8`: Koordinatör taslak hazırlar/açar ama **aktifleştiremez**; `sezon_donem_ihtiyac_analizi`: koordinatör taslak (hazırlık) yılda çalışır.
- **Sorun:** Sistemde muhtemelen tüm yönetimsel yetki `School_Admin`'de; ayrı Koordinatör rolü yok.
- **Dokunulan:** Identity rol seed (`Coordinator` rolü) + permission atamaları: `season.draft.*` ✓, `season.open` ✓, `season.activate` ✗ (yalnız admin). `permission-matrix.md` güncelle.
- **Kabul kriteri:** Koordinatör hesabı taslak oluşturur/sezon açar; `ActivateSeasonRollover` çağrısı 403 döner; admin'de açık.
- **Test:** Api.UnitTests / Integration — Koordinatör → activate 403; draft.create 200.
- **Efor:** Orta (BE) — **önce kullanıcı onayı:** Koordinatör rolü pilot kapsamında mı, yoksa şimdilik ertelenip topbar yalnız mevcut rollerle mi gönderilsin? *(docx Koordinatör'ün İ-1 draft-mode'unu Pilot Sonrası'na atıyor — rolün kendisi gerekli ama draft-sandbox ertelenebilir.)*

### Dilim B2 — Sunucu-tarafı sezon erişim gating'i (doğrulama + sıkılaştırma) ⏳
- **Mevcut:** `ActiveSeasonWritePolicy` (geçmiş sezona yazma engeli), `seasons.view-archived` (arşiv geçişi), `ContextResolver` taslağı consumer'a göstermiyor — büyük ölçüde **VAR**.
- **İş:** Topbar'ın rol modlarıyla birebir tutarlılığı **doğrula ve testle**: öğretmen taslak yıl seçemez (server reddeder), veli/öğrenci yalnız Active+Archived, hiçbir consumer Setup/Draft çözemez.
- **Dokunulan:** `AccountSwitchSeasonCommandHandler` + `ContextResolver` — rol bazlı hedef-sezon doğrulaması (taslak/Setup hedefe geçiş consumer rolde 403/400). Mevcut testlere rol-bazlı senaryolar ekle.
- **Kabul kriteri:** Öğretmen/öğrenci/veli token'ı ile Setup sezona `switch-season` → reddedilir; admin/koordinatör → izinli.
- **Efor:** Küçük-Orta (BE, çoğu doğrulama+test).

---

## FAZ C — Topbar Bağlam Seçici Rol Modları (`sezon_donem_ihtiyac_analizi` / handoff)

En büyük görünür iş; çoğunlukla FE. Mevcut `SeasonTermSwitcher` "admin vs herkes" kabalığında;
handoff 6 mod istiyor. Her dilim bir rol grubunu hedefler. **İhtiyaç:** İ-3 (hata önleme).

### Dilim C1 — Öğrenci & Öğretmen modları ⚠️
- **Mevcut:** öğretmen/öğrenci/veli hepsine dönem seçici veriliyor.
- **Hedef (handoff):**
  - **Öğrenci** = seçici **yok**, "Şimdi · {dönem}" kilitli rozet (`mode:'now'`).
  - **Öğretmen** = yıl **aktife kilitli**, dönem yalnız **not/karne** bağlamında açık, taslak gizli (`mode:'teacher'`).
- **Dokunulan:** `oksis-web/src/app/components/shell/SeasonTermSwitcher.tsx` (rol→mod eşlemesi; `portalKey` zaten var), `seasonStore` (öğrencide setTerm no-op/lock), i18n anahtarları, ilgili `__tests__`.
- **Kabul kriteri:** Student portal topbar'da seçici menüsü açılmaz, kilit rozeti görünür; Teacher portal yıl satırı disabled, dönem seçilebilir, taslak satırı render edilmez.
- **Test:** Vitest — her portalKey için render farkı; öğrencide menü yok; öğretmende yıl disabled.
- **Efor:** Orta (FE).

### Dilim C2 — Veli çocuk-seçici topbar entegrasyonu ⚠️
- **Mevcut:** `activeChildStore` + `ChildSelector` sayfası var ama **topbar'da render edilmiyor**; velide yalnız dönem var.
- **Hedef (handoff):** Velinin **asıl ekseni çocuk**; topbar'da çocuk seçici + yıl yalnız Active+Archived (taslak asla).
- **Dokunulan:** `ParentLayout`/`ShellTopbar` veli dalı (`SeasonTermSwitcher` `mode:'parent'` veya ayrı `ChildPill`); `activeChildStore` topbar'a bağlanır; React Query key'lerine `childId` ekseni (Faz D ile).
- **Kabul kriteri:** Parent portal topbar'ında çocuk seçici görünür ve değişimde aktif çocuk store + ekran verisi değişir; yıl menüsü yalnız Active+Archived gösterir.
- **Test:** Vitest — veli topbar'da çocuk seçici var; çocuk değişimi store'u günceller; taslak yıl listede yok.
- **Efor:** Küçük-Orta (FE).

### Dilim C3 — Koordinatör draft-mode (İ-1) — **ERTELENEBİLİR (Pilot Sonrası)** ⏸️
- **Hedef (handoff `mode:'draft'`):** Koordinatör taslak (hazırlık) yılda çalışır; aktif yıl salt-referans; canlı veri korunur.
- **Bağımlılık:** Faz B1 (Koordinatör rolü). docx bunu **Pilot Sonrası** sayıyor → pilotta zorunlu değil.
- **Karar:** Pilot kapsamı netleşince planlanır; şimdilik kutu açık bırakılır.
- **Efor:** Orta (FE+BE) — ertelenmiş.

### Muhasebe modu (İ-5) — **KAPSAM DIŞI (Pilot Sonrası)**
- Finansal takvim ayrışması billing/muhasebe modülüyle gelir; bu modül pilotta yok. **Şimdi dokunulmaz.**

---

## FAZ D — Client Query-Scoping (kırmızı çizgi · kesişen)

Ayrı "büyük" faz değil; Faz C ve dönem-tüketen modüller (marks/attendance/report-cards) geldikçe
uygulanan **kalite kuralı**. docx'in client-tarafı kırmızı çizgisi.

### Kural D — sezon/dönem key ekseni
- **Mevcut borç:** React Query key'leri yalnız `tenant:{schoolId}` prefix'i taşıyor; sezon/dönem ekseni yok. Admin students/assignments/classrooms `seasonId` kullanıyor ama `termId` filtresi uygulanmıyor; öğrenci/veli grades/attendance/schedule mock.
- **Kural:** Sezona bağlı her query key'i `seasonId`, döneme bağlı her query key'i `termId` (velide ayrıca `childId`) eksenini taşır; bağlam değişince ilgili veri otomatik refetch olur. `tenantScopedKey` deseninin sezon/dönem genişletmesi.
- **Uygulama noktası:** Bu kural **yeni dönem-tüketen ekran yazılırken** zorunlu; geriye dönük olarak C1/C2'deki tüketim ekranlarına ve admin students/assignments/classrooms'a eklenir.
- **Kabul kriteri:** Topbar'dan dönem değişince dönem-scoped liste yeniden fetch eder; sezon değişince sezon-scoped listeler yenilenir; cache çapraz-sızmaz.
- **Not:** marks/attendance/report-cards modülleri **henüz yok**; yazıldıklarında `AcademicTermId`'yi day-0 taşımalı (BE kırmızı çizgi) — pattern: `ScheduleProgram` (zaten `AcademicYearId`+`AcademicTermId`).

---

## Sıralama önerisi (tek cümle)

**A1+A2 → A3(season.* yeniden adlandırma) → B2 → C1 → C2 → (B1/C3/Muhasebe ertelenir; D her dilimde uygulanır).**
> Kararlar (2026-06-22): A3 = `season.*`'a yeniden adlandır · B1 Koordinatör = ertele · C3 = ertele. B2, Koordinatör olmadan yalnız öğretmen/öğrenci/veli gating doğrulaması olarak yapılır.

A grubu hızlı kapanış ve risksiz; B rol zeminini kurar; C görünür değeri (rol-bazlı seçici) getirir;
D boydan boya kalite guardrail'i.

---

## Self-Review (skill gereği — spec kapsama taraması)

- **Belge 2 (sezon_yonetimi) kalan kalemleri:** tatil kopyalama → A1; cache → A2; izin isimleri → A3; Koordinatör rolü → B1. ✓ kapsandı.
- **Belge 1 (ihtiyaç/handoff) seçici modları:** öğrenci/öğretmen → C1; veli çocuk → C2; koordinatör draft → C3 (ertelendi); muhasebe → kapsam dışı; aktif-bağlam çözünürlüğü → zaten VAR; client scoping → Faz D. ✓ kapsandı.
- **Zaten mevcut (plan dışı, dokunulmaz):** AcademicSession/Term modeli, ContextResolver, rollover (§4.9/§5.9), Sezon Listesi + 6-adım sihirbaz + modallar. ✓
- **Açık karar noktaları (kod öncesi sorulacak):** A3 (izin isim stratejisi), B1 (Koordinatör pilot kapsamında mı), C3 (draft-mode ertelensin mi). Hiçbiri varsayımla geçilmez.
- **Çelişki notu:** §9 DevExtreme → proje yasağı; kod zaten doğru (shadcn table). Aksiyon yok, not düşüldü.
