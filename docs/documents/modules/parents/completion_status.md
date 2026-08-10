# Veli (Parents) — Tamamlanma Durumu

> Bu dosya modülün ne ölçüde tamamlandığını ve spec dışına çıkılan
> durumları raporlar. İlgili her geliştirmede ANINDA güncellenir.
> Status snapshot'tır, kural deposu değil (tam kurallar `business-rules.md`).

**İlerleme:** `██░░░░░░░░` %20   ·   Status: in-progress (web liste ekranı)   ·   Güncel: 2026-06-08

> Web admin **Veliler** liste ekranı (design handoff) eklendi: `oksis-web/src/portals/admin/parents/`.
> Backend `Application/Modules` hâlâ boş; ekranın imza alanları (veli↔öğrenci ilişki
> grafiği, son giriş, KPI) ve mesaj/davet/duyuru aksiyonları mevcut uç olmadığından
> `attemptRealThenMock` mock fallback + "D" (DebtBadge) ile karşılanıyor. Doküman
> içeriği (≈110 `{{TBD}}`) hâlâ doldurulmadı.

---

## ✅ Tamamlanan Yapılar

- 9 dosyalık doküman iskeleti oluşturuldu (içerik doldurulmadı).
- **Web admin "Veliler" liste ekranı (design handoff 1:1):** KPI şeridi · arama+Yakınlık/
  Hesap/Sınıf filtreleri · imza kolonu "Bağlı Öğrenci(ler)" (çoka-çok çip + "+N kardeş") ·
  Erişim göstergesi · 5 sekmeli detay drawer (Genel/Öğrenciler/İletişim/Ödemeler/Hesap) ·
  Yeni Veli ve Öğrenci Bağla modalları · seçim çubuğu · sayfalama. i18n tr/en, 2 test dosyası.
  - **Gerçek uçlar:** liste (`GET /users/persons?profileType=Parent`), Yeni Veli
    (`POST /users/persons`), öğrenci arama (`GET /users/persons?profileType=Student`),
    Öğrenci Bağla (`POST /users/relationships`), dışa aktar (`GET /users/persons/export`).
  - **Çapraz ekran:** Kullanıcılar ekranı "Bağlı Profil" kolonunda Veli → `/admin/parents`
    (`linkedProfilePage`/`ProfileLink` güncellendi). Drawer Hesap sekmesi → Kullanıcılar;
    çocuk satırı → Öğrenciler.

## ⏳ Eksik / Bekleyen Yapılar

- Doküman içeriği (≈110 `{{TBD}}` alanı) — spec doldurulmadı.
- Backend: veli listesi zenginleştirme (kids[] ilişki grafiği), son giriş, parent-stats,
  mesaj/davet-yenile/toplu-duyuru, veli künye düzenleme uçları (şu an mock+D).
- Mobile: veli rolü ekranları (yok).

## ⚠️ Spec Dışına Çıkılanlar

- **2026-06-08 — Veliler ekranı DEBT mock-fallback (onaylı, kullanıcı isteği):** Backend
  karşılığı olmayan alan/aksiyonlar gerçek isteği yine de atıp (`attemptRealThenMock`) uç
  yoksa mock veri döndürür ve UI'da "D" (DebtBadge) ile işaretlenir. Mock+D kapsamı:
  bağlı öğrenci grafiği (kids[]) + son giriş + Yakınlık türetimi, KPI sayıları
  (parent-stats), Mesaj Gönder, Daveti Yenile, Toplu Duyuru, veli künye Düzenle,
  Ödemeler (salt-okunur finans özeti). Uç açılınca tek dosyada (`parentsDebtApi`)
  gerçeğe döner, ilgili "D" kalkar. Etki: liste backbone'u gerçek, imza zenginleştirme geçici mock.
