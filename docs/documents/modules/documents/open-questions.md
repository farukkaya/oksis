# Documents (Dosya Yönetimi) — Açık Sorular

> Henüz cevaplanmamış, kod dışı takip edilen konular. Kaynak: `.claude/specs/dosya-yonetimi-spec.md` § 11 ("Açık İşler — kod dışı, bu spec'in dışında takip"). Karar verilince ilgili dosyaya taşınır ve buradan silinir.

---

## OQ-documents-001: KVKK saklama sürelerinin hukuki teyidi

**Soru:** `FileCategoryPolicy.RetentionPeriod` değerleri (§2.4 tablosu) taslaktır — hukuk/mali müşavir görüşüyle kesinleştirilmesi gerekiyor.

**Bağlam:** Registry tek nokta olduğu için değişiklik maliyeti sıfıra yakındır; ancak kesin süre KVKK saklama-imha politikası belgesiyle teyit edilmeden üretimde güvenilir kabul edilemez.

**Etkilenecek dosyalar (karar verilince güncellenecek):** `domain-model.md` (retention tablosu), `business-rules.md` (retention yorumu), kod: `FileCategoryPolicyRegistry`.

---

## OQ-documents-002: `files.*` subdomain + TLS prod kurulumu

**Soru:** K4 kararının prod ön koşulu olan `files.*` subdomain + TLS için altyapı/DevOps kurulum dokümanı henüz yazılmadı.

**Bağlam:** Dev'de lokal Garage endpoint (`http://localhost:3900`) ile çalışılıyor; presigned URL mimarisi prod'da gerçek subdomain + TLS gerektirir.

---

## OQ-documents-003: Kota değerlerinin plan modeline bağlanması

**Soru:** Okul başına varsayılan kota şu an `SystemSetting`'den okunuyor (§3.6 köprü); Payments/plan modeli geldiğinde bu nasıl değişecek?

**Bağlam:** Payments/plan modeli henüz yok; `SystemSetting` köprüsü geçici çözüm.

---

## OQ-documents-004: `FtpStorageService` implementasyonu

**Soru:** K6 kararı gereği capability modeli hazır ama `FtpStorageService` adapter'ı yazılmadı — hangi talep bunu tetikleyecek?

**Bağlam:** Gerçek trafik olmadan adapter olgunlaşamayan ölü kod olur (K6 gerekçesi); backlog'da.

---

## OQ-documents-005: `StorageMigrationJob` detay tasarımı

**Soru:** Sağlayıcı geçişinde (ör. Garage'dan başka bir S3-uyumlu sağlayıcıya) arka plan taşıma job'ının detay tasarımı ne olacak?

**Bağlam:** İlk sağlayıcı geçişi gündeme geldiğinde tasarlanacak; şimdilik yalnız backlog kaydı (spec § 3.5 tablosunda "Manuel (backlog)").

---

## OQ-documents-006: Mobile `shared/files` katmanı

**Soru:** `oksis-mobile` tarafında dosya yükleme/indirme katmanı ne zaman ve nasıl yazılacak?

**Bağlam:** B4 kararıyla ertelendi — dosya kullanan ilk mobile özellikle birlikte gelecek; spec § 6 tasarımı o gün için referanstır.

---

## OQ-documents-007: Davranışsal tüketicilerin bağlanma sırası

**Soru:** Ödev teslim ekleri, duyuru ekleri, sanal kitap gibi davranışsal tüketiciler hangi sırayla bağlanacak?

**Bağlam:** B2 kararı gereği ilgili modüllerin backend'i geliştirilirken bağlanacak (YAGNI, borç değil sıralama). İlk canlı tüketici SchoolLogo (Faz 5).

---

## OQ-documents-008: Final review devirleri (Faz 2-4 planlarına taşınacak)

**Kaynak:** Faz 0-1 final whole-branch review (2026-07-04, merge onaylı). Kod değişikliği gerektirmeyen, sonraki faz planlarına yazılacak maddeler:

1. **Faz 2:** sha256 için 64-hex şekil guard'ı — domain'e eklenir VEYA `IChecksumCalculator` sözleşmesine yazılır (bugün yalnız non-blank kontrolü var; kolon `char(64)`). → Faz 2'de kısmen kapandı: `IChecksumCalculator` XML doc 64-hex lowercase sözleşmesi yazıldı; domain-side shape guard Faz 3'e.
2. **Faz 2 plan kalıbı:** tenant query-filter doğrulaması snapshot grep'iyle YAPILAMAZ (EF snapshot query filter serileştirmez — projede 0 adet `HasQueryFilter`). Doğru yöntem: entegrasyon testi veya `dbContext.Model.FindEntityType(typeof(X)).GetQueryFilter() != null` assert'i.
3. **Faz 3:** `FileCategoryPolicyRegistry.Find(null)` `ArgumentNullException` fırlatır; API'ye kategori string'i açılırken FluentValidation `NotEmpty` önde olmalı + `Find`'a null-toleransı değerlendirilmeli.
4. **Faz 4:** purge/retention job'ları `Status=SoftDeleted` kayıtları ancak **gerekçeli `IgnoreQueryFilters()`** ile görebilir (tenant filter `!IsDeleted` içeriyor) — Hard Ban istisna prosedürüyle (gerekçe + audit) planlanmalı; `ix_stored_files_school_status` bu taramayı destekler.
5. ~~**Faz 3:** `GetPresignedDownloadUrlAsync`'e ResponseHeaderOverrides (Content-Disposition/Content-Type) opsiyonu — spec § 3.3.2 indirme adı için ŞART.~~ **ÇÖZÜLDÜ (Faz 3, commit `9b763f4`):** `PresignedDownloadHeaderOverrides` overload + RFC 5987 `ContentDispositionBuilder` eklendi; Garage'a karşı gerçek HTTP `Content-Disposition` header'ı doğrulandı (Task 3/4 E2E).
6. ~~**Faz 3:** Confirm akışı ExistsAsync-önce (StatAsync Amazon istisnası Application'da yakalanamaz).~~ **ÇÖZÜLDÜ (Faz 3, commit `143e7a7`):** `ConfirmFileUploadCommandHandler` `ExistsAsync`-önce kontrol uyguluyor.
7. ~~**Faz 3:** upload guard `!CanSeek`'e genişletilsin.~~ **ÇÖZÜLDÜ (Faz 3, commit `9b763f4`):** Ampirik Garage testiyle doğrulandı (non-seekable+known-length SigV4 imzasıyla çalışmıyor — `InvalidRequestException`); `S3CompatibleStorageService.UploadAsync` guard'ı `ContentLength is null && !CanSeek` → `!CanSeek`'e genişletildi. Buffer'lama yerine `HashingStreamWrapper` (seekable inner stream zorunlu) çözümü seçildi — plan dokümanının "İPTAL" notu ampirik olarak yanlış çıktı, brief yetkisiyle geri alındı.
8. **Faz 5:** S3StorageOptions ValidateOnStart doğrulaması. _(Açık — henüz ele alınmadı.)_

---

## Karar Verilenler (Arşiv)

- **OQ-documents-008 madde 5** (Content-Disposition/Content-Type override) — ÇÖZÜLDÜ Faz 3, commit `9b763f4`. Bkz. yukarı.
- **OQ-documents-008 madde 6** (Confirm ExistsAsync-önce) — ÇÖZÜLDÜ Faz 3, commit `143e7a7`. Bkz. yukarı.
- **OQ-documents-008 madde 7** (upload guard `!CanSeek`) — ÇÖZÜLDÜ Faz 3, commit `9b763f4`. Bkz. yukarı.
