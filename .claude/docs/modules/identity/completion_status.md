# Kimlik / Identity — Tamamlanma Durumu

> Bu dosya modülün ne ölçüde tamamlandığını ve spec dışına çıkılan
> durumları raporlar. İlgili her geliştirmede ANINDA güncellenir.
> Status snapshot'tır, kural deposu değil (tam kurallar `business-rules.md`).

**İlerleme:** `▓▓▓▓▓▓░░░░` %60   ·   Status: in-progress   ·   Güncel: 2026-05-28

> Temel: Backend `Oksis.Application/Modules/Identity` ≈77 cs (auth, JWT/refresh, kullanıcı,
> yetki, davet). Web tarafında `modules/identity` + `modules/invitations` (api/components/
> hooks/schemas/types) ve admin `users` sayfası mevcut. Doküman kısmen dolu (≈58 `{{TBD}}`).

---

## ✅ Tamamlanan Yapılar

- **Backend:** Identity modülü ≈77 cs — login + refresh akışı (login/refresh yanıtına kullanıcı yetki listesi eklendi, commit `6d522f1`), kullanıcı ve davet (invitation) handler'ları.
- **Web:** `src/modules/identity` ve `src/modules/invitations` tam dikey dilim (api/components/hooks/schemas/types); `portals/admin/pages/users`.

## ⏳ Eksik / Bekleyen Yapılar

- Doküman içeriği: ≈58 `{{TBD}}` alanı doldurulacak.
- Mobile auth akışı (expo-secure-store refresh token) ekran/entegrasyonu.
- Tam permission matrisi uygulaması ve şifre sıfırlama/aktivasyon akışlarının uçtan uca doğrulaması.

## ⚠️ Spec Dışına Çıkılanlar

- Henüz kayıt yok.
