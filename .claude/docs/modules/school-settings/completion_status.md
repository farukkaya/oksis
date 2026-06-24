# Okul Ayarları (School Settings) — Tamamlanma Durumu

> Bu dosya modülün ne ölçüde tamamlandığını ve spec dışına çıkılan
> durumları raporlar. İlgili her geliştirmede ANINDA güncellenir.
> Status snapshot'tır, kural deposu değil (tam kurallar `business-rules.md`).

**İlerleme:** `▓▓▓▓▓▓▓▓▓▓` %100   ·   Status: **mvp-ready**   ·   Güncel: 2026-06-24 (Faz A shell tamamlandı)

> Temel: Baseline (21 endpoint + 6 tab) **live**. 2026-05-25 ihtiyaç analiziyle açılan
> 22 issue'luk genişletme **tamamlandı** (API #1–14 + Web #15–22). 2026-05-28 ek
> genişletmeler tam stack üzerinde çözüldü: Q6 (multi `school_types`), Q-Plan-Modules
> (plan ↔ modül kataloğu), bildirim kanal toggle'ları kalıcı. 10-maddelik manuel QA
> turu tamamlandı; multi-tenant izolasyon ikinci tenant ile doğrulandı, DTO sızıntı
> kontrolü temiz, regresyon yok.

---

## ✅ Tamamlanan Yapılar

- **Doküman:** 9 dosya tamamen dolu (`{{TBD}}` = 0).
- **API baseline:** `Oksis.Application/Modules/Schools` altında 21 endpoint live; `SchoolSettings`, `Holiday`, `BellSchedule`, `ModuleConfig`, `NotificationConfig` entity'leri + EF config + 10 permission seed.
- **API genişletme (Issue 1–14):** `SchoolGradeLevel` & `SchoolGradeLevelScale` entity'leri, 5 yeni endpoint (`GET/PUT /grade-levels`, `PUT /academic-policy`, `GET/PUT /grade-level-scales`), `IGradeScaleResolver` + Redis cache, `CreateHoliday` aktif-sezon otomasyonu, migration'lar + integration testler.
- **Web genişletme (Issue 15–22):** `AcademicPolicyTab`, `AcademicStructureTab`, `GradeLevelScalePanel`, ilgili React Query hook'ları + Zod şemaları, 8 sekmeli `SchoolSettingsTabs` + URL param + smoke test.
- **Q6 — multi `school_types` (2026-05-28):** Domain `SchoolSettings.SchoolTypes` (JSON kolon, distinct + sıralı), `UpdateAcademicStructureCommand.SchoolTypes` (List<SchoolType>, min 1), Mapster güncellemesi, `SeedSchoolGradeLevelsHandler` çoklu tür birleştirme, EF migration `20260528_school_settings_multi_school_types` (data preserving SQL ile). Web: `AcademicStructureDto.schoolTypes`, Zod `.min(1)`, `AcademicStructureTab` gerçek çoklu seçim payload'u. Tüm backend (656/656) + web (school-settings 31/31) testleri yeşil.
- **Bildirim kanal toggle'ları (2026-05-28):** `NotificationConfig` entity'si `PushEnabled`, `EmailEnabled`, `SmsEnabled`, `LateArrivalNotify` 4 yeni kolonla genişletildi. `IsEnabled` domain'de türev (any-of). Command + Handler + DTO + Mapping güncellendi. Migration `20260528_add_notification_channel_toggles` (idempotent backfill: eski `is_enabled=true` satırlarda push aktif). Web `useUpdateNotificationConfig` mutation `IsEnabled` derive'ini kaldırıp 4 kanal toggle'ını direkt gönderir; adapter raw'dan birebir okur. UI'daki kanal switch'leri artık gerçekten kalıcı.
- **Q-Plan-Modules — Plan ↔ modül kataloğu (2026-05-28):** Yeni master tablo `master.plan_modules` (PlanCode × moduleKey junction) + seed (Free: 4 / Standard: 5 / Premium: 6 modül). `IPlanModuleResolver` servisi okul planı × katalog join'ini tek noktada hesaplar. `GetModuleConfigsQuery`, `GetSchoolSettings`, `UpdateModuleConfig` handler'ları plan-aware oldu; `ModuleConfigDto`'da `isPlanRestricted` yerine `isAvailableInPlan` + `requiredPlan` döner. `school_module_configs.plan_restricted` kolonu deprecated. Web `ModuleToggleCard` plan kilidini `!isAvailableInPlan` ile çizer. Modül seed bug'ı (DEV-OKUL) için `SeedDefaultModuleConfigsHandler` + backfill migration `20260528_backfill_module_configs` eklendi. Tüm backend testleri yeşil.
- **Mobile:** 10 salt-okunur ekran (8 + Akademik Yapı & Akademik Politika). Yazma akışı bilinçli kapsam dışı (yalnız İletişim düzenlenir).
- **Mobile akademik ekranları (2026-05-28):** Operasyonel gruba `AcademicStructureScreen` (haftalık ders günleri, günlük ders sayısı, öğrenci no prefix/uzunluk, timezone) ve `AcademicPolicyScreen` (geçme notu, mezun veri saklama, şube onayı, otomatik karne) eklendi. Veri zaten `GET /school-settings` → `basicInfo` (SchoolSettingsDetailDto) içinde geliyordu; mobil tip akademik politika alanlarıyla genişletildi. Yeni route'lar `SchoolSettingsAcademicStructure` / `SchoolSettingsAcademicPolicy`, hub'da iki yeni satır. `defaultGradeScaleId` mobilde isim sözlüğü olmadığı için gösterilmiyor (GUID). Yeni i18n: `sections.academicStructure/Policy`, `academicStructure.*`, `academicPolicy.*`, `common.yes/no` (tr/en).
- **Mobile gösterim düzeltmeleri (2026-05-28):** (1) Hub aktif modül sayacı plan-aware (`isAvailableInPlan && isEnabled`) — eskiden hep 6/6 idi. (2) Kimlik ekranı Q6 `schoolTypes` (çoklu) okuyup lokalize ediyor; eski `schoolType` (tekil) ve yanlış i18n etiket haritası düzeltildi; eğitim dili de lokalize. (3) Bildirim eşiği `dayUnit` i18n v3 plural formatına çevrildi (`_one/_other` v3'te çözülmüyordu, ham anahtar görünüyordu). (4) Tatiller `useHolidays(year)` mevcut yılı gönderiyor (eksik year → backend Year=0 → boş liste); ekran Yaklaşan/Geçmiş iki bölüme ayrıldı. (5) `SchoolBrandingHeader` logo kırık/yüklenemezse `onError` ile okul ikonuna (FontAwesome5 `school`) düşüyor.
- **Mobile plan-aware hizalama (2026-05-28):** `ModulesScreen` + `ModuleConfigDto` Q-Plan-Modules sözleşmesine taşındı. Eski `isPlanRestricted` alanı kaldırılıp `isAvailableInPlan` ile değiştirildi; ekran etkin durumu artık `isAvailableInPlan && isEnabled` ile hesaplıyor (web `ModuleToggleCard` ile aynı kural). Bug: backend plan dışı modüllerde `isEnabled=true` koruduğu, mobil ise yalnızca `isEnabled`'a baktığı için **tüm modüller "Aktif" görünüyordu** → kapandı. Plan dışı modüller artık "Plan dışı" rozeti + gerekli plan etiketi gösteriyor. Yeni i18n: `modules.status.planLocked`, `modules.planLocked`, `modules.planUpgrade` (tr/en). typecheck + lint temiz.

## ✅ Faz A — Shell + PageHeader + Ortak Desenler (2026-06-24)

- Task 1: `SchoolSettingsShell` subtitle/breadcrumb (Task 1)
- Task 2: `SettingsHeaderActionContext` provider + `useSettingsHeaderAction` / `useSettingsHeaderActionSlot` hook'ları
- Task 3–4: `PageHeader.tabs` + `SchoolSettingsTabs` kaldırıldı (K4 PageHeader geçişi — eski bileşen yerine standart sekme destekli `PageHeader` kullanımına geçildi)
- Task 5: `settings.css` paylaşımlı savebar + kart stilleri oluşturuldu
- Task 6: `SettingsSideCard` (icon + title + body yan kartı)
- Task 7: `WhereUsedCard` (Nerede Kullanılır yan kartı, `SettingsSideCard` üzerine), `settings.css`'e `.yap-uses`/`.yap-use`/`.gnl-note` stilleri, `components/index.ts`'e tüm Faz A bileşen re-export'ları eklendi

## ✅ Faz C — Sekme İçerikleri Handoff Birebir Port (2026-06-24, FRONTEND-only)

> 8 sekmenin içeriği yeni handoff tasarımına portlandı (2-kolon `SettingsTwoColumn` + yan kartlar + tek üst Kaydet + dirty savebar + K3 `ReadOnlyBanner`). **Backend'e dokunulmadı**; eksik backend alanları ekranda `BackendDebtBadge` ile işaretlendi ve kaydet payload'larından dışlandı (her sekmede testle kilitlendi). 8 sekme + 2 review-fix = 10 commit; settings testleri 187 yeşil, `npm run build` temiz.

- **Genel Bilgiler** (`3627c14`): Kurum Kimliği + İletişim 2-kolon; sağ Önizleme/Kayıt Bilgisi/Kurum Yetkilisi. Persist: officialName/contact/address/logo. K2: tema renk + vergi no/faks/vergi dairesi UI'dan kaldırıldı (logo kaldı).
- **Derslikler** (`0600edc`): handoff tablo+kart+drawer+DeactivateDialog; inuse pill + sil-guard.
- **Modüller** (`7e99a95`): 2-kolon kart ızgarası + PlanStatusCard; toggle persistence korundu.
- **Akademik Yapı** (`2adb180`, fix `0eecb78`): Kademeler + Ders Kataloğu (Subjects, branşsız AS-1) + statik Şube Adlandırma (K6); kademe kilit iskeleti.
- **Akademik Politikalar** (`a1e584b`): Not/Sınav/Devamsızlık/Belge kartları + canlı INV-POL; MEB reset (client). Persist: geçme notu + autoPublish + seviye skalaları.
- **Zil Programı** (`6741304`): Tam/Yarım şablon + timeline + üretici + gün atamaları; yalnız aktif şablon düz satırları persist.
- **Tatil Takvimi** (`85cd2d5`): tür filtre + ay ayırıcı + sezon özeti; yalnız "Okul" tatili CRUD; enum güvenli (`ClosedDay`).
- **Bildirim Ayarları** (`cbe2e52`, fix `5f304bd`): olay×kanal matrisi + sessiz saatler + SMS limiti + SMS kotası kartı; persist yalnız 4 kanal toggle + 2 eşik.

### ⚠️ Spec Dışına Çıkılanlar / Otonom Kararlar (2026-06-24)
- **FE-only otonom yürütme:** Kullanıcı uyurken "bitirene kadar durma" talimatıyla Faz A+C subagent-driven uygulandı; backend (oksis-api) hiç değiştirilmedi. Review-fix commit'leri bu yetki kapsamında atıldı (normalde "Fix'lerde Auto-Commit YOK").
- **K2 backend temizliği ertelendi:** Tema renk kolonları + tax/fax/vergi dairesi yalnız UI'dan kaldırıldı; backend kolon drop'u Debt (sabah onayıyla yapılacak).

### 🧾 Backend Debt Envanteri (Faz C'den — bekleyen API işleri)
- SchoolSettings: `DisplayName`, `OwnershipType`, `FoundingYear`, `SchoolAuthority` VO, `recordInfo` (audit→DTO); K2 ölü kolon temizliği (tema renk/tax/fax).
- Akademik Politika genişlemesi: yuvarlama, yazılı/perf sayısı, ağırlıklar, devamsızlık limitleri, takdir/teşekkür eşikleri, parentNotify (+ INV-POL domain).
- Derslik: `RoomType` 4→7, `Room.Note`, inuse hesabı; `class-rooms`/rooms izin slug netleştirme.
- Akademik Yapı: kademe şube sayısı (Class agregasyonu, AS-3), Subjects CRUD + inuse.
- Zil: `TemplateKey` + `BellDayAssignment` (+ üretici param persist — AS-7 client).
- Tatil: `HolidayType`'a `AraTatil` (AS-4) + birleşik kaynak (MEB katalog + Sezon yarıyıl) + seasonId scope.
- Bildirim: olay×kanal matrisi (`notification_types`) + quiet hours + daily SMS limit + SMS kotası (AS-6) + GET endpoint.
- Modül: `ModuleTier` enum + seed 6→10 + plan yenileme tarihi.
- İzin seed'leri: Sekreter `school-settings.view` (K3), Yetkili `manage-authority` (K5).
- **İzin slug uyumsuzluğu (final review):** `school-settings.update-academic-policy`, `school-settings.update-academic-structure`, `class-rooms.update` `permission-matrix.md`'de yok — backend seed öncesi matrise eklenmeli ya da mevcut slug'a hizalanmalı (yoksa gate'ler hiç açılmaz).

### 🧹 FE Final-Polish Backlog (Faz C review minor'ları)
- C1: Debt "Görünen Ad" `required *` kaldırıldı (final review must-fix — `fix` commit ile çözüldü).
- BellScheduleTab `fmtDur` `sa`/`dk` birimleri hardcoded TR (i18n'e taşı — C7-M4 ile birlikte).
- C2-M1: RoomsTab toggle hata toast'ı yanlış i18n key; C2/C4 büyük tab dosyaları (bölme).
- C6: kullanılmayan BellScheduleGrid/FormModal/SlotTypePill + dead i18n keys.
- C7-M4: HolidaysTab MONTHS_TR hardcoded TR (Intl/i18n'e taşı); C7-M3 delete try/catch.
- C5: dead i18n key + weight-bar inline style; test getByRole scope sağlamlaştırma.

## ⏳ Eksik / Bekleyen Yapılar

_(Yok — modül mvp-ready.)_

Sprint 2+'a bırakılanlar `business-rules.md` ve `open-questions.md`'de zaten not edildi:
- Karne template seçimi + dil (Sprint 3)
- Sınav ağırlığı override (Q7, Sprint 2'de karara bağlanacak)
- Harfli skala için geçme notu UX'i (Q8, Sprint 3)
- SuperAdmin için plan kataloğu UI (Q-Plan-Modules sonrası, v2)

## ⚠️ Spec Dışına Çıkılanlar

> Aşağıdakiler git geçmişinden türetilmiş yaklaşım değişiklikleridir; resmî onay/gerekçe doğrulanmalı.

- **2026-06-11 — Tasarım hizalama (Layout handoff) + Frontend-first/Debt ilkesi (faruk).** OKSİS Ayarlar 8-sekme tasarım handoff'u birebir uygulanmaya başlandı (spec: `docs/superpowers/specs/2026-06-11-okul-ayarlari-hizalama-design.md`, planlar `docs/superpowers/plans/2026-06-11-okul-ayarlari-*`). **İlke:** FrontEnd birebir aktarılır; backend borçlu kalabilir, eksikler frontend'de `(Debt)` rozetiyle işaretlenir (yeni tablo gerektiren işler ertelenir). **Teslim — Plan 1 (kabuk):** sekme şeridi pill+ikon, Derslikler sekmesi route iskeleti (placeholder), `ReadOnlyBanner` + `SettingsSaveBar` ortak primitive'leri. **Teslim — Plan 2 (Modüller):** 10 modül kart grid + Plan Durumu yan kartı + kirli-durum save bar; `BackendDebtBadge`, `moduleCatalog` sabiti. **Açık debt'ler:** (1) 7 modül (students, timetable, finance, eokul, transport, cafeteria, library) backend kataloğunda yok → frontend fixture, `(Debt)`; (2) Plan Durumu yenileme tarihi + "Planı Yükselt" backend abonelik verisi yok → `(Debt)`; (3) backend'de var olan homework/messaging/reports tasarım gridinde gösterilmiyor. Etki: web settings 31 dosya/118 test yeşil, build temiz.
- **2026-06-11 — Plan 5 (Derslikler) full-stack teslim (faruk onayı).** Derslikler sekmesi tasarıma birebir, **debt'siz** uygulandı. **Backend additive (yeni tablo YOK):** `Timetable.Room`'a `Name`, `RoomType` (enum: Classroom/Laboratory/Workshop/Other), `Block`, `Floor` kolonları + backfill migration (`20260611_expand_rooms_name_type_location`, Name=Code); `CreateRoom`/`UpdateRoom`/`RoomDto` genişletildi; yeni `DELETE /rooms/{id}` (kullanım-kilidi: ClassRoom.RoomId referansı varsa 409 `rooms.errors.in-use`, aksi halde soft-delete); `ListRooms` `includeInactive` parametresi (default false → classrooms ev-dersliği ataması geriye dönük korunur). **Frontend:** settings altında `rooms` API katmanı (httpClient/axios; not: school-settings'in eski `utils/api.ts`'i yerine yeni `httpClient` deseni), `RoomFormDrawer` + `RoomTypeBadge` + zod şema, `RoomsTab` (toolbar arama/tip/durum filtre + Tablo/Kart toggle + sıralı tablo + kart + 8/9 pager + veri durumları + satır aksiyon + "Kullanımda" kilit + pasife al/sil confirm). **İstisna:** web CLAUDE.md "liste = OksisDataGrid (DevExtreme) zorunlu" kuralı liste-grid içindir; bu ekran tablo/kart toggle + hover aksiyon + kart görünümü istediğinden shadcn `Table` ile elle kuruldu (DevExtreme import edilmedi). **Migration uygulanmalı** (`dotnet ef database update`) — prod'da idempotent script ile. Etki: backend 1181 unit test yeşil; web settings 33 dosya/131 test yeşil; her iki build temiz.
- **2026-06-11 — Genel Bilgiler sekmesi görsel yeniden tasarım (faruk, `/frontend-design`).** Mevcut shadcn/ui + Tailwind design system **içinde** kalınarak (proje UI kuralı "clean/professional/calm, tutarlılık > yenilik" — frontend-design skill'inin bold/maximalist yaklaşımı bilinçli reddedildi): (1) ortak `FormSection`'a opsiyonel `icon` prop'u (brand-tonlu kare; tüm tab'lara tutarlı yansır, backward-compatible), (2) 4 bölüme ikon (Building2/Phone/MapPin/Palette) + açıklama satırı (`sectionDescriptions.*` i18n tr/en), (3) hata kartı ikon + ortalanmış düzen, (4) tab içeriği `max-w-5xl` ile okunur genişlik, (5) yeni `ThemePreview` bileşeni — seçilen ana/ikincil renk + logo `form.watch` ile **canlı önizleme** (renkler runtime kullanıcı verisi olduğundan CSS değişkenine enjekte edilip `bg-[var(--preview-*)]` ile kullanıldı; hex hardcode/inline-hex yok), tema bölümü 2 kolon (sol: renkler+logo, sağ: önizleme). Davranış/API/save akışı (bölüm başına) değişmedi. Backend borcu yok. Etki: settings tab testleri 25 passed/1 skipped yeşil.
- **Bekleyen sekmeler:** Akademik Yapı (Ders Kataloğu), Akademik Politikalar, Zil Programı, Tatil Takvimi, Bildirim Ayarları — kullanıcı isteğiyle Derslikler sonrası **bekletiliyor** (planlar yazılacak/uygulanacak). (Genel Bilgiler görsel olarak hizalandı; bkz. üstteki not.)

- **2026-05-28** — Q6 (`school_type` multi-select backend desteği) **MVP'ye dahil edildi** (önceden açık soru / minor backlog idi). Tekil `school_type` kolonu drop edildi, yerine JSON array `school_types` (`nvarchar(max)`, EF `HasConversion` + `ValueComparer`). UI checkbox grubu artık gerçekten çoklu seçim payload'u gönderiyor; refresh sonrası kaybolma bug'ı (kullanıcı tarafından raporlandı) kapandı. Etki: tüm spec dosyaları güncellendi; migration mevcut satırların değerini `["X"]` formatında taşır. Onay: kullanıcı isteği (faruk).
- **2026-05-28** — Spec'in ilk 4 sekmesi (Genel Bilgi / İletişim / Adres / Tema) tek `GeneralSettingsTab` içinde 4 `FormSection` olarak **birleştirildi** → toplam sekme: 10 → **7**. Bölüm bazlı endpoint/permission/mutation'lar (`update-basic|contact|address|theme`) korundu; yalnız UI birleşti. Gerekçe: kullanıcıya 4 küçük sekme yerine tek "Genel" sekmesi daha akıcı. Etki: `ui-flows.md` ve `README.md` koda hizalandı; davranışsal regresyon yok (4 ayrı Kaydet hâlâ var). Onay: ürün/UX (doğrulanmalı).
- **2026-05-27** — Web'de statik tanımlı yetki listesi **backend kaynaklı** hale getirildi; master sınıf-kademe kataloğu school-settings yerine `/academics` endpoint'ine taşındı (commit `266b1bf`). Orijinal web spec'inde permission listesi front-end'de sabitti. Etki: web AcademicStructure/permission akışı backend'e bağımlı.
