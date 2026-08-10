# Duyuru (Announcements) — Tamamlanma Durumu

> Bu dosya modülün ne ölçüde tamamlandığını ve spec dışına çıkılan
> durumları raporlar. İlgili her geliştirmede ANINDA güncellenir.
> Status snapshot'tır, kural deposu değil (tam kurallar `business-rules.md`).

**İlerleme:** `█████████░` %90   ·   Status: MVP tamam (C5 kapandı)   ·   Güncel: 2026-08-10

> Temel: A fazı (backend, 9 dilim) 2026-08-03'te bitti; B fazı (mock → gerçek geçiş)
> 2026-08-04; C1–C5 (frontend boşlukları) 2026-08-05 → 2026-08-10. Kalan %10
> **kapsam dışı ilan edilmiş** işler (push/e-posta zinciri, web veli/öğrenci okuma
> yüzü) ve spec §17'deki ölçülmüş backlog'dur.

---

## ✅ Tamamlanan Yapılar

**Backend (A fazı, `oksis-api`)**
- 5 tablo, 6 enum, **22 uç** (`AnnouncementsController` 18 + `AnnouncementTemplatesController`
  4; sayıldı 2026-08-10). Modüldeki TEK `[HttpDelete]` şablon silmedir — duyuru silinmez (INV-1).
- Alıcı çözümleme (tek resolver), yayın anında materyalizasyon, kademe kuralı.
- Yaşam döngüsü: taslak / zamanlanmış / onay bekleyen / yayında / geri çekilmiş /
  süresi dolmuş. Geri çekme + geri çekmeyi iptal, yayın sonrası düzeltme (`Amend`).
- Eşikli moderasyon (onay kuyruğu), denetim izi, gönderim raporu.
- Hangfire job'ları: zamanlanmış yayın, süre dolumu.
- Ek dosya (Documents entegrasyonu), in-app bildirim zinciri (8 bildirim türü).

**Frontend (B + C fazları, `oksis-ui`)**
- Web: yönetim konsolu (envanter / onay kuyruğu / arşiv / moderasyon / şablonlar),
  öğretmen yüzü + **öğretmen detay yüzeyi** (`teacher-detail.tsx`, C5).
- Mobil: gelen kutusu, okuyucu, duyuru detayı, oluşturma, onay kuyruğu,
  şablon listesi + form (C5).
- Bildirim → doğru ekran yönlendirmesi (tür tabanlı, core'da testli).

**C5 — Şablon yönetimi (2026-08-09/10)**
- Şablon **kişiselleşti** (K1): `announcements.template.manage` öğretmene de verildi,
  liste `CreatedBy` ile daraldı, Update/Delete sahiplik kapısı aldı.
- Benzersiz indeks `(SchoolId, Name)` → `(SchoolId, CreatedBy, Name)`;
  `Description` 500 → 4000. Tek migration:
  `20260809_announcement_templates_personal`.
- "Şablon olarak kaydet" — beş yüzeyde (web iki sayfa, mobil üç giriş).
- Kullanım sayacı (`UsageCount` / `LastUsedAt`) **üç** yayın noktasına da bağlandı.
- `Announcement.TemplateId` (nullable, **FK değil**) eklendi; sözleşmeye `templateId`
  girdi (codegen turu yapıldı).
- Ölü üç hook canlandı: `useCreateAnnouncementTemplate` /
  `useUpdateAnnouncementTemplate` / `useDeleteAnnouncementTemplate`.
- **Acil işareti yetki kapısı** (kullanıcı kararı 2026-08-10): `Urgent = true` yalnız
  `announcements.approve` iznine sahip çağıranda kabul edilir; taslak dahil.
- Merkezi düzeltme: boş sunucu mesajı deliği `mutation-error.ts` düzeyinde kapatıldı
  (beş yüzey tek satır değişmeden düzeldi).

**Doğrulama (2026-08-10)**
- Backend: **3378** test, **0** hata, **0** uyarı.
  `dotnet ef migrations has-pending-model-changes` → *"No changes"*.
- İstemci: `@workspace/core` **274**, `@workspace/api` **135**,
  `@workspace/api-mocks` **103**. Altı workspace typecheck + lint temiz.

---

## ⏳ Eksik / Bekleyen Yapılar

**Kapsam dışı ilan edilmiş (karar, eksik değil)**
- Push / e-posta teslim zinciri (K-2). Teslim sınırı spec §16'da yazılı beyandır.
- Web veli/öğrenci okuma yüzü (K-7) — tasarım çizilmemiş.
- Okundu onayı ("Okudum" butonu) V2'de (KR-02).

**Ölçülmüş backlog** — spec §17, `C5-1` … `C5-12` (ayrıca C3-\*, C4-\*).
En ağırları:
- 🔴 `C5-5` — acil kapısının **geriye dönük kolu yok**; prod'a çıkmadan backfill
  ya da yayın yolunda ikinci kapı gerekir.
- 🔶 `C5-7` — kaydedilmiş taslak ne düzenlenebiliyor ne yayına alınabiliyor.
- 🔶 `C5-4` — migration `Down` kolu veri-bağımlı olarak geri alınamaz (rollback runbook).
- `C5-8` — taslaklar yönetimin envanterinde görünüyor (ürün kararı bekliyor).

**Doküman borcu**
- `api-contracts.md`, `database-schema.md`, `domain-model.md`, `notifications.md`,
  `open-questions.md`, `ui-flows.md`, `README.md` hâlâ `{{TBD}}` taşıyor
  (spec §17 `C4-23`). C5'te `permissions.md` ve `business-rules.md` **gerçeğe
  uyduruldu**; kökteki `permission-matrix.md` de düzeltildi.

---

## ⚠️ Spec Dışına Çıkılanlar

| Konu | Spec ne diyordu | Ne yapıldı | Gerekçe |
|---|---|---|---|
| DYR-F-13 "yalnız yönetim şablon oluşturur" | Şablon yönetimin envanteri | Şablon **kişiselleşti**, öğretmen de yönetir | Kullanıcı kararı K1 (2026-08-09). Spec K-6 satırı düzeltildi |
| Şablon `Description` 500 | — | **4000** | Duyuru `Body`'si sınırsız; 500'lük sınır "Şablon olarak kaydet" akışını kırıyordu (K5) |
| Şablon ad benzersizliği okul geneli | `(SchoolId, Name)` unique | `(SchoolId, CreatedBy, Name)` unique | K1'in doğrudan sonucu; iki öğretmen aynı adı kullanabilmeli |
| Acil işareti | Rol kapısı **yoktu** | `announcements.approve` kapısı eklendi | Kullanıcı kararı (2026-08-10). Sözleşme değişmedi |
| Derin bağlantı şeması `oksis://` | §8.4 | Backend rolden bağımsız tek yol yazar; ayrım istemcide | C4 ölçümü — bkz. §8.4 düzeltme notu |
| Mobil ek dosya | pdf dahil | **yalnız jpg/png** | `expo-document-picker` depoda yok; native yeniden derleme gerektirir (C3-2) |
