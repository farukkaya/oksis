# ADR-001 — Legacy `User` entity'sinin kaldırılması (G8)

> **Tür:** Architecture Decision Record · **Durum:** ✅ **Uygulandı** (2026-07-02) — legacy
> `User` entity + `[identity].[users]` tablosu kalıntısız emekliye ayrıldı; tüm auth/yazma/okuma
> yolları `Account`/`Person`/`RoleAssignment` modeline taşındı.
> **Tarih:** 2026-06-29 (karar) → 2026-07-02 (uygulandı) · **İlgili:**
> `.claude/specs/ogrenci-kayit-enrollment-spec.md`, `oksis-admin-ekranlari-mimari-spec.md`
> (madde 22), `legacy-user-emeklilik-design.md` (fazlı uygulama tasarımı),
> `identity/open-questions.md` OQ-identity-001 (kapatıldı).

## Bağlam

İki paralel kimlik modeli mevcut:
- **Legacy `User`** (`Modules/Identity/Entities/User.cs`): ad/soyad/rol/durum **gömülü**;
  `Email` unique per tenant; `UserRole` enum.
- **Yeni hat:** `Person` (kişi) + `Profile` (TPH rol verisi) + `Account` (login) +
  `RoleAssignment` (sezonsal rol). Olgun ve kayıt akışının yaslanacağı model.

Kayıt akışı (`EnrollStudent`) yazılırken hangi modelin yazılacağı netleşmezse öğrenci **iki
yerde doğar** (çift kayıt, tutarsız rol/durum). Bu, gap analizi G8 ve risk R3'tür.

## Karar

1. **Kayıt modülü yalnız `Person`/`Account`/`Profile` hattını yazar.** Legacy `User` yeni
   kayıtta **yazılmaz**.
2. **Tek-seferlik migration:** Mevcut `User` kayıtları `Person` + `Account` (+ uygun
   `Profile`/`RoleAssignment`) olarak taşınır. Eşleştirme **TCKN hash / e-posta ile
   idempotent dedupe**; çift kayıt önlenir.
3. **Kaldırma:** Migration doğrulandıktan sonra `User` entity, `users` tablosu ve ona bağlı
   eski uçlar **deprecate → kaldırılır**. (Üst spec madde 22'deki "`User`/Identity = giriş
   kimliği" rolü artık `Account` tarafından karşılanır.)

## Sıralama

- **Aşama 0 (bu ADR onayı):** karar kilitlenir.
- **Aşama 1:** `EnrollStudent` ve diğer kayıt dilimleri yalnız Person/Account üretir; `User`
  tablosuna dokunmaz (geriye uyum: eski `User` okuyan kod bozulmaz).
- **Aşama 2:** idempotent `User → Person/Account` migration script'i + doğrulama (sayı/dedupe
  raporu).
- **Aşama 3:** `User` ve eski uçların kaldırılması (ayrı PR; kullanıcı/identity modülü
  tüketicileri `Account`'a geçirilmiş olmalı).

## Sonuçlar

- **Olumlu:** tek kimlik modeli; çift kayıt riski ortadan kalkar; kayıt orkestrasyonu
  sadeleşir; `RoleAssignment` sezonsal rol modeli tam kullanılır.
- **Maliyet/risk:** migration geri dönüşü pahalı → **doğrulama + idempotency zorunlu**;
  `User`'a bağlı tüm tüketiciler (auth, kullanıcılar ekranı, eski uçlar) `Account`/`Person`'a
  taşınmadan Aşama 3 yapılmaz. Bu yüzden kaldırma **ayrı, dikkatli PR**.

## Açık nokta (çözüldü)

- ~~Auth/login halen `User` mı yoksa `Account` mı doğruluyor?~~ **Çözüldü:** tüketici envanteri
  `legacy-user-emeklilik-design.md`'de çıkarıldı; login/refresh/parola/davet/CRUD/okuma yollarının
  tümü `Account`/`Person`'a taşındı. Auth artık yalnız `Account` doğrular.

## Uygulama sonucu (2026-07-02)

Kaldırma, riskli tek-PR yerine **fazlı** yürütüldü (`legacy-user-emeklilik-design.md`,
Faz 0-5; her faz kendi branch+PR'ı + faz sonu Chrome/curl E2E):

- **Faz 0-1:** merge/reseed + login/refresh `Account`'a.
- **Faz 2:** parola (reset/confirm/change) legacy uçları emekli; `password_reset_tokens` drop.
- **Faz 3:** davet+oluşturma tekilleşti; `InvitationAccountProvisioner` gerçek `Account.Create`;
  `IJwtTokenService` + PermissionReader legacy claim fallback söküldü; `invitation_tokens` drop.
- **Faz 4:** `DeactivateUser`→`Account.Suspend` (canlı 404 bug fix'i), `GetSchoolSettings`
  UpdatedBy→Account⋈Person; tüketicisiz uçlar + `IRefreshTokenStore` söküldü. **Üretim kodunda
  `db.Users` = 0.**
- **Faz 5 (bu kapanış):** `User` entity + `UserConfiguration` + `DbSet<User>` + 5 tüketicisiz
  `User*` domain event + 2 legacy test silindi; `[identity].[users]` final drop migration
  (`20260702_drop_users`); kalıntı-sıfır grep + smoke E2E (login 200 + `/users` 200, tablo
  düşmüşken Account⋈Person'dan). `UserRole`/`UserStatus`/Identity `InvitationStatus` enum'ları
  yaşayan Users yüzeyi için korundu.

### ⚠️ Aşama 2'den bilinçli sapma

ADR Aşama 2, **idempotent `User → Person/Account` migration script'i + dedupe raporu**
öngörüyordu. Uygulamada bu adım **atlandı**: dev ortamı her fazda `ef database drop` + `update`
+ reseed ile yeniden kuruldu, prod'da taşınacak canlı `User` verisi olmadığından tek-seferlik
veri taşıma script'i yazılmadı. Bunun yerine `[identity].[users]` doğrudan drop edildi
(`Down()` tabloyu geri kurar ama veriyi geri getirmez). Prod devreye alınmadan önce gerçek
`User` verisi oluşursa, bu sapma yeniden değerlendirilmeli (taşıma script'i gerekebilir).
Kayıt: `identity/completion_status.md → Spec Dışına Çıkılanlar`.
