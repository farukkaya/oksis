# Okul Ayarları (School Settings)

> Bu modülün **tek kaynak gerçek** dokümantasyonu. Diğer dosyalar bu modülün alt başlıklarını detaylandırır.

---

## Amaç

Okul Ayarları modülü, bir tenant'ın (okulun) tüm yapılandırma alanlarını tek noktadan yönetir: kurumsal bilgiler (resmi ad, MEB kodu, vergi), iletişim, adres, görsel tema, akademik yapı, zil/ders saati programı, tatil günleri, modül aktif/pasif durumu ve bildirim tercihleri.

**Sorduğu temel soru:** "Bu okulun yapılandırması hangi değerlerle çalışmalı?"
**Çözmediği şey:** Tenant yaşam döngüsü (Setup → Active → Suspended → Archived) — bu `schools` modülünde. Kullanıcı/rol/izin yönetimi — `identity` modülünde.

---

## Paydaşlar / Roller

| Rol | Kullanım Şekli |
|---|---|
| SchoolAdmin | Tüm ayarları görüntüler ve düzenler (sekme bazlı: temel, iletişim, adres, tema, zil, tatil, modüller, bildirim) |
| SuperAdmin | Public branding endpoint'i hariç müdahale etmez; okul kurulum sırasında SchoolAdmin için ön-doldurma yapar |
| Diğer roller | Sadece public branding (`/api/v1/school-settings/public`) anonim erişim — login öncesi okul logosu / renkleri için |

> Tam yetki matrisi: `permissions.md` (bu klasörde) ve `permission-matrix.md` § School Settings.

---

## Akış Özeti

1. **Okul oluşturulur** → `SchoolCreatedEvent` → `SchoolCreatedEventHandler` varsayılan `school_settings` satırını yaratır (BR-SS-001, idempotent).
2. **SchoolAdmin Okul Ayarları ekranına gelir** → sekme bazlı düzenleme yapar.
3. **Her sekme bağımsız endpoint çağırır** → backend `SchoolSettingsUpdatedEvent(SchoolId, <SectionName>)` yayar.
4. **Modül kataloğu** ayrı `school_module_configs` tablosunda; 6 varsayılan modül (`attendance, marks, announcements, homework, messaging, reports`) okul oluşturma migration'ı tarafından seed edilir.
5. **Bildirim ayarları** `school_notification_configs` tablosunda (tenant scope), global `notification_types` master kataloğundan referans alınarak.

> UI sekme akışları: `ui-flows.md`. Event akışı: `notifications.md`.

---

## İlişkili Modüller

| Modül | İlişki |
|---|---|
| `schools` | `SchoolSettings` 1:1 `School` ile, `SchoolCreatedEvent` event-driven init |
| `identity` | `school-settings.*` izinleri SCHOOL_ADMIN rolüne global `role_permissions` seed'i ile bağlanır |
| `notifications` | Tenant `school_notification_configs` global `notification_types` kataloğunu override eder |
| `academic-years` | Tatil günleri (`school_holidays`) tenant scope; resmi tatiller (`official_holidays`) global |
| `subjects` | Akademik yapı sekmesinde günlük ders sayısı, ders günleri gibi alanlar `Subject` kullanımını sınırlar |

---

## Mevcut Durum

- Hangi sprint'te? → **Sprint 1** (Backend 20 endpoint live, frontend sekme component'leri çalışıyor)
- MVP scope'unda mı? → **Evet**
- Hangi parçaları yapıldı / kaldı?
  - ✅ Backend `SchoolSettingsController` (20 yetkili + 1 anonim public branding endpoint'i)
  - ✅ 10 endpoint-bazlı izin (`school-settings.*`) seed edildi (Issue ekran sekmesi → izin eşleştirmesi)
  - ✅ Frontend query hook'ları yazıldı (`8f18255`)
  - ❗ Test borcu — bkz. `open-questions.md`
  - ⏳ Mutation hook'ları & form validasyonu (Issue #27, #28)

> Açık sorular için bkz. `open-questions.md`.

---

## Metadata

- **Slug:** school-settings
- **Status:** in-progress
- **Sprint:** Sprint 1
- **Owner:** {{TBD}}
- **Created:** 2026-05-24
- **Last Updated:** 2026-05-24
- **Files:**
  - [x] README.md
  - [x] domain-model.md
  - [x] api-contracts.md
  - [x] database-schema.md
  - [x] permissions.md
  - [x] notifications.md
  - [x] ui-flows.md
  - [x] business-rules.md
  - [x] open-questions.md
