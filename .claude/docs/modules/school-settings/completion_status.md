# Okul Ayarları (School Settings) — Tamamlanma Durumu

> Bu dosya modülün ne ölçüde tamamlandığını ve spec dışına çıkılan
> durumları raporlar. İlgili her geliştirmede ANINDA güncellenir.
> Status snapshot'tır, kural deposu değil (tam kurallar `business-rules.md`).

**İlerleme:** `▓▓▓▓▓▓▓▓▓▓` %100   ·   Status: **mvp-ready**   ·   Güncel: 2026-05-28 (mobile plan-aware hizalama)

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

## ⏳ Eksik / Bekleyen Yapılar

_(Yok — modül mvp-ready.)_

Sprint 2+'a bırakılanlar `business-rules.md` ve `open-questions.md`'de zaten not edildi:
- Karne template seçimi + dil (Sprint 3)
- Sınav ağırlığı override (Q7, Sprint 2'de karara bağlanacak)
- Harfli skala için geçme notu UX'i (Q8, Sprint 3)
- SuperAdmin için plan kataloğu UI (Q-Plan-Modules sonrası, v2)

## ⚠️ Spec Dışına Çıkılanlar

> Aşağıdakiler git geçmişinden türetilmiş yaklaşım değişiklikleridir; resmî onay/gerekçe doğrulanmalı.

- **2026-05-28** — Q6 (`school_type` multi-select backend desteği) **MVP'ye dahil edildi** (önceden açık soru / minor backlog idi). Tekil `school_type` kolonu drop edildi, yerine JSON array `school_types` (`nvarchar(max)`, EF `HasConversion` + `ValueComparer`). UI checkbox grubu artık gerçekten çoklu seçim payload'u gönderiyor; refresh sonrası kaybolma bug'ı (kullanıcı tarafından raporlandı) kapandı. Etki: tüm spec dosyaları güncellendi; migration mevcut satırların değerini `["X"]` formatında taşır. Onay: kullanıcı isteği (faruk).
- **2026-05-28** — Spec'in ilk 4 sekmesi (Genel Bilgi / İletişim / Adres / Tema) tek `GeneralSettingsTab` içinde 4 `FormSection` olarak **birleştirildi** → toplam sekme: 10 → **7**. Bölüm bazlı endpoint/permission/mutation'lar (`update-basic|contact|address|theme`) korundu; yalnız UI birleşti. Gerekçe: kullanıcıya 4 küçük sekme yerine tek "Genel" sekmesi daha akıcı. Etki: `ui-flows.md` ve `README.md` koda hizalandı; davranışsal regresyon yok (4 ayrı Kaydet hâlâ var). Onay: ürün/UX (doğrulanmalı).
- **2026-05-27** — Web'de statik tanımlı yetki listesi **backend kaynaklı** hale getirildi; master sınıf-kademe kataloğu school-settings yerine `/academics` endpoint'ine taşındı (commit `266b1bf`). Orijinal web spec'inde permission listesi front-end'de sabitti. Etki: web AcademicStructure/permission akışı backend'e bağımlı.
