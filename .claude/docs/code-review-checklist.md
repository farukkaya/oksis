# Code Review Checklist

> AI'ın ürettiği kodu, insanın PR review'da geçirdiği gibi süzer. Reviewer (insan ya da AI) **her PR'da** bu checklist'i uygular.

---

## 1. Genel

- [ ] **Sprint scope'una uygun mu?** MVP'de olmayan feature girilmemiş.
- [ ] **Naming convention'a uyuyor mu?** (`naming-conventions.md`)
- [ ] **Folder yapısı bozulmamış mı?** (`folder-structure.md`)
- [ ] **Yeni pattern var mı?** Varsa mevcut pattern alternatifi tartışıldı mı?
- [ ] **Duplicate kod var mı?** Aynı işi yapan başka kod silindi mi?
- [ ] **Dead kod / commented code temizlendi mi?**
- [ ] **TODO / FIXME yorumları açıklayıcı + Jira link'li mi?**

---

## 2. Backend — Security

- [ ] **Tenant izolasyonu var mı?** Tüm sorgularda `SchoolId` filtresi (EF Global Query Filter aktif).
- [ ] **Cross-tenant veri erişimi imkansız mı?** Resource ID parametre olarak gelse bile tenant kontrolü yapılmış.
- [ ] **Authorization var mı?** `[RequirePermission(...)]` veya pipeline behavior çalışıyor.
- [ ] **Resource-level scope kontrolü var mı?** (Veli sadece kendi çocuğu, öğretmen sadece kendi sınıfı)
- [ ] **IDOR riski yok mu?** Sequential ID kullanılmıyor (Guid).
- [ ] **Mass assignment riski yok mu?** Request DTO ile entity ayrı; client `Id`, `SchoolId`, `CreatedBy` set edemiyor.
- [ ] **Sensitive data log'lanmıyor mu?** Password, token, T.C. kimlik no, IBAN — log'da yok.
- [ ] **JWT validation çalışıyor mu?** Issuer / Audience / Lifetime / Signature.
- [ ] **Rate limiting var mı?** Public endpoint'lerde (login, password reset).
- [ ] **SQL injection riski yok mu?** Raw SQL kullanılıyorsa parametreli.
- [ ] **CSRF / CORS doğru yapılandırılmış mı?**

---

## 3. Backend — Validation

- [ ] **Her Command/Query için Validator var mı?**
- [ ] **Validation pipeline behavior çalışıyor mu?**
- [ ] **Required alanlar doğru işaretlenmiş mi?**
- [ ] **String uzunluk limitleri var mı?** (DB constraint + validator)
- [ ] **Enum değerleri valid mi?** Validator'da `IsInEnum` kontrol.
- [ ] **Business rule validation Domain'de mi?** (Application'da değil — Domain.)
- [ ] **Hata mesajları kullanıcı dostu mu (TR)?**

---

## 4. Backend — Data / EF Core

- [ ] **Migration oluşturuldu mu?** EF CLI ile, manuel düzenleme yok.
- [ ] **Migration name anlamlı mı?** `20250515_AddAttendanceTable` formatında.
- [ ] **Index gerekli yerlerde var mı?** Tenant kolonu + sık filtre kolonları.
- [ ] **Index ilk kolon SchoolId mi?** Composite index'lerde.
- [ ] **Foreign key ON DELETE davranışı doğru mu?** `Restrict` veya `Cascade` bilinçli seçilmiş.
- [ ] **Audit kolonları doldurulmuş mu?** `CreatedAt`, `CreatedBy`, vs.
- [ ] **Soft delete uygun mu?** İlgili entity `ISoftDeletableEntity` implement.
- [ ] **N+1 query yok mu?** Eager loading (`Include`) veya projection (`Select`) kullanılmış.
- [ ] **Pagination var mı listede?** Tüm liste endpoint'lerinde max 100.
- [ ] **AsNoTracking** read-only query'lerde kullanılıyor mu?
- [ ] **Transaction sınırı doğru mu?** TransactionBehavior Command'da otomatik.

---

## 5. Backend — Performance

- [ ] **Cache opportunity değerlendirildi mi?** Sık okunan + nadir değişen veri Redis'te.
- [ ] **Cache invalidation doğru mu?** İlgili entity update'inde temizleniyor.
- [ ] **Heavy operation background'a alındı mı?** PDF, Excel, bulk insert → Hangfire.
- [ ] **HTTP timeout makul mu?** Default 30 sn; uzun işlemler async pattern.
- [ ] **Payload boyutu makul mu?** Liste DTO'larında tüm kolonlar değil.

---

## 6. Backend — Error Handling & Logging

- [ ] **Exception handling middleware var mı?**
- [ ] **Domain exception → HTTP status mapping doğru mu?**
- [ ] **Structured log var mı?** Serilog, `LogContext.PushProperty` ile.
- [ ] **Correlation ID propagate ediliyor mu?**
- [ ] **PII log'da değil mi?**
- [ ] **Audit log gerekli mi?** Sensitive operation'larda var.
- [ ] **`Error.Message` i18n anahtarı mı?** Literal Türkçe YASAK. Format: `<namespace>.errors.<key>`.
- [ ] **Yeni Error anahtarı eklendiyse `oksis-web/src/shared/i18n/locales/<lang>/<namespace>.json` ve (uygulanabiliyorsa) `oksis-mobile/src/shared/i18n/locales/<lang>/<namespace>.json` aynı PR'da güncellendi mi?** Detay: `backend/logging-error-rules.md` §8.5.

---

## 7. Backend — Notification

- [ ] **Event publish edildi mi?** State değişikliği sonrası `_publisher.Publish(...)` veya outbox.
- [ ] **Recipient resolver doğru mu?** Doğru kullanıcıya gidiyor.
- [ ] **Notification matrix güncellendi mi?**
- [ ] **Cooldown uygulanıyor mu?**
- [ ] **Sessiz saat dikkate alındı mı?**

---

## 8. Frontend — Genel

- [ ] **TypeScript strict mode'a uyuyor mu?** `any` yok; gerekirse `unknown` + narrowing.
- [ ] **`React Query` query key standardı uygulandı mı?**
- [ ] **Loading / Error / Empty state var mı?**
- [ ] **Form validation (Zod) var mı?**
- [ ] **Toast ile geri bildirim var mı?** Başarı / hata.
- [ ] **Accessibility (a11y) temel?** `aria-label`, `role`, keyboard nav.
- [ ] **i18n key'leri TR + EN için tanımlandı mı?** (En azından TR.)
- [ ] **Console.log silindi mi?**

---

## 9. Frontend — Performance

- [ ] **Gereksiz re-render var mı?** Memo / callback gerekli yerlerde.
- [ ] **Büyük liste için server-side paging / virtualization?** (`DataTable` server-side veya `react-virtuoso`)
- [ ] **Code splitting** (lazy route) portal bazlı yapıldı mı?
- [ ] **Image optimization** (lazy load, doğru boyut).
- [ ] **Bundle size kontrolü** (`npm run build` → analyze).

---

## 10. Frontend — Permission / Routing

- [ ] **Protected route var mı?** Public sayfalar dışında.
- [ ] **Role-based menu filtrelendi mi?**
- [ ] **Sayfa içinde `hasPermission` kontrolü var mı?** Button level.
- [ ] **404 / 403 sayfaları var mı?**

---

## 11. Mobile — Özel

- [ ] **Touch target ≥ 44x44px?**
- [ ] **Keyboard overlap çözüldü mü?** `KeyboardAvoidingView`.
- [ ] **Sticky action button güvenli alan ile uyumlu mu?** (SafeAreaView)
- [ ] **Offline durum graceful handle ediliyor mu?** (En azından network error toast.)
- [ ] **Push notification token kayıtlı mı?**

---

## 12. Test

- [ ] **Unit test eklendi mi?** Command/Query handler'lar için en azından happy path + 1 fail.
- [ ] **Integration test gerekli mi?** Kritik flow'sa evet.
- [ ] **Test isimlendirme standarda uyuyor mu?**
- [ ] **Coverage düşmüyor mu?**
- [ ] **Flaky test yok mu?**

---

## 13. Dokümantasyon

- [ ] **README güncel mi?** (Yeni env var, setup adımı, vb.)
- [ ] **API endpoint Scalar/Swagger'da görünüyor mu?**
- [ ] **ADR yazıldı mı?** Önemli mimari karar varsa.
- [ ] **Migration'da değişiklik mantıklı mı?** `docs/db-changes.md` (opsiyonel).
- [ ] **`notification-matrix.md`, `permission-matrix.md` güncel mi?** İlgili değişiklik varsa.

---

## 14. Git / PR

- [ ] **Branch ismi standarda uyuyor mu?**
- [ ] **Commit mesajları conventional commit formatında mı?**
- [ ] **PR açıklamasında: ne yapıldı, neden, nasıl test edildi?**
- [ ] **Ticket link var mı?**
- [ ] **Sensitive file (env, key) commit edilmemiş mi?**

---

## 15. AI Self-Check (üreten için)

AI kod üretmeden bitirmeden önce **kendi kendine** sorar:

1. Bu kod tenant-safe mi?
2. Bu kod yetki kontrolü içeriyor mu?
3. Bu kod mevcut pattern'i bozuyor mu?
4. Bu kod MVP scope'unda mı?
5. Bu kod test edilebilir mi?
6. Bu kod loglanması gereken bir şeyi log'luyor mu?
7. Bu kod naming convention'a uyuyor mu?
8. Bu kod bir notification tetiklemesi gerekiyorsa tetikliyor mu?
9. Bu kod cache invalidation gerekiyor mu? Yapıyor mu?
10. Bu kod hata durumlarını handle ediyor mu?

3 veya daha fazla "Hayır" → kod tekrar gözden geçirilir.
