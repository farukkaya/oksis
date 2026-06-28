# ADR-001 — Legacy `User` entity'sinin kaldırılması (G8)

> **Tür:** Architecture Decision Record · **Durum:** Önerildi (onay bekliyor) — kayıt modülü
> kodundan **önce** kilitlenmeli (Öğrenci Kayıt Spec madde E2.2 / P0).
> **Tarih:** 2026-06-29 · **İlgili:** `.claude/specs/ogrenci-kayit-enrollment-spec.md`,
> `oksis-admin-ekranlari-mimari-spec.md` (madde 22)

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

## Açık nokta

- Auth/login halen `User` mı yoksa `Account` mı doğruluyor? Aşama 2 öncesi tüketici
  envanteri çıkarılmalı (login, refresh, permission resolve, kullanıcılar ekranı). Bu envanter
  migration script'inin kapsamını belirler.
