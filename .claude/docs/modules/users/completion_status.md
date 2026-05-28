# Kullanıcı Yönetimi (Users) — Tamamlanma Durumu

> Bu dosya modülün ne ölçüde tamamlandığını ve spec dışına çıkılan
> durumları raporlar. İlgili her geliştirmede ANINDA güncellenir.
> Status snapshot'tır, kural deposu değil (tam kurallar `business-rules.md`).

**İlerleme:** `▓▓▓▓░░░░░░` %40   ·   Status: planning (frontend mock hazır)   ·   Güncel: 2026-05-28

> Temel: Doküman büyük ölçüde dolu (≈7 `{{TBD}}`). Web'de admin `users` sayfası mevcut;
> backend kullanıcı yetenekleri `identity` modülü üzerinden gelir (bu modül onunla örtüşür).
> Backend kapsamı README'ye göre genişletilecek.

---

## ✅ Tamamlanan Yapılar

- **Doküman:** büyük ölçüde dolu (≈7 `{{TBD}}`).
- **Web:** `portals/admin/pages/users` (frontend mock/iskelet hazır).
- **Backend (identity üzerinden):** kullanıcı + davet handler'ları `Modules/Identity` içinde.

## ⏳ Eksik / Bekleyen Yapılar

- Kalan doküman `{{TBD}}` alanları (≈7).
- Backend kullanıcı yönetimi kapsamının genişletilmesi (README notu).
- Web users sayfasının gerçek API'ye bağlanması (mock → live).

## ⚠️ Spec Dışına Çıkılanlar

- **Modül örtüşmesi:** `users` ile `identity` doc modülleri kapsamca örtüşüyor; backend kullanıcı/yetki kodu `Modules/Identity` altında tek noktada. Sınır netleştirilmeli (bkz. [[identity]] completion_status).
