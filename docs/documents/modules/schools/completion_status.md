# Okul / Tenant (Schools) — Tamamlanma Durumu

> Bu dosya modülün ne ölçüde tamamlandığını ve spec dışına çıkılan
> durumları raporlar. İlgili her geliştirmede ANINDA güncellenir.
> Status snapshot'tır, kural deposu değil (tam kurallar `business-rules.md`).

**İlerleme:** `▓▓▓▓▓░░░░░` %50   ·   Status: in-progress   ·   Güncel: 2026-05-28

> Temel: `Oksis.Application/Modules/Schools` ≈89 cs ile en yoğun backend modülü — ancak bu
> kod tabanı Okul/Tenant kökünü **ve** `school-settings` modülünü birlikte barındırır.
> Doküman kısmen dolu (≈89 `{{TBD}}`). Web'de okul/tenant yönetimi (super-admin) ekranı yok;
> yalnızca ayar sayfası mevcut.

---

## ✅ Tamamlanan Yapılar

- **Backend:** Schools kod modülü ≈89 cs — multi-tenant Okul kökü, `SchoolCreatedEvent` seed akışı ve school-settings ile paylaşılan altyapı.
- **Tenant izolasyon altyapısı:** EF global query filter + `TenantSaveChangesInterceptor` (cross-cutting, bu modülün domaini üzerinden uygulanır).

## ⏳ Eksik / Bekleyen Yapılar

- Doküman içeriği: ≈89 `{{TBD}}` alanı.
- Web: SuperAdmin okul listesi / onboarding / tenant yönetim ekranları (yok).
- Okul oluşturma/aktivasyon akışının uçtan uca (web) doğrulaması.

## ⚠️ Spec Dışına Çıkılanlar

- **Kod organizasyonu:** `schools` ve `school-settings` doc modülleri tek bir API kod modülünde (`Modules/Schools`) birleşik. Doc seviyesinde iki ayrı modül, kod seviyesinde tek klasör. Etki: kapsam sınırı kodda doc'tan farklı.
