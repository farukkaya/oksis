# Documents (Dosya Yönetimi)

> Bu modülün **tek kaynak gerçek** dokümantasyonu. Diğer dosyalar bu modülün alt başlıklarını detaylandırır.
> Bağlayıcı spec: `.claude/specs/dosya-yonetimi-spec.md` — bu doküman spec'in Faz 0-1 teslim durumunu yansıtır, spec'in yerini almaz.

---

## Amaç

Documents modülü, OKSİS genelinde tüm modüllerin (ödev, sınav, sanal kitap, okul logosu, kulüp, duyuru) kullanacağı **merkezi dosya yönetimi altyapısını** sağlar: dosya yükleme (proxy + presigned iki-fazlı), depolama (Garage/S3-uyumlu, tenant başına bucket), virüs tarama, kota, KVKK saklama/imha.

**Sorduğu temel soru:** Bir dosya nasıl güvenli, tenant-izole ve tekrar kullanılabilir şekilde saklanır ve bir iş entity'sine (ödev, duyuru, sanal kitap...) bağlanır?
**Çözmediği şey:** Modüllerin kendi iş kuralları (ör. "ödev teslim süresi kapandıktan sonra dosya silinemez") — bunlar tüketici modülün kendi `business-rules.md`'sindedir. Documents yalnızca dosya-yaşam-döngüsü ve depolama orkestrasyonunu çözer.

---

## Paydaşlar / Roller

| Rol | Kullanım Şekli |
|---|---|
| SchoolAdmin | Tam yetki (okul kapsamında): yükleme, indirme, silme, kota görüntüleme |
| Teacher / Parent / Student / Secretary | Kapsamlı (resource-level scope ile) yükleme/indirme/silme — bkz. `permissions.md` |
| SuperAdmin | Denetim amaçlı `files.view`/`files.download` (yalnız `X-Tenant-Override` + audit); upload/delete yapamaz |

> Tam yetki matrisi için bkz. `permissions.md` (bu klasörde) ve proje kökü `permission-matrix.md` (Faz 3'te bağlandı).

---

## Akış Özeti

Modülün ana akışı (Faz 3'te CQRS yüzeyi açılınca aktif olacak):

1. İstemci `FileCategoryPolicy`'den kuralları okur (uzantı/boyut/mod).
2. Proxy (≤25MB) veya presigned (initiate→confirm, büyük/ForcePresigned kategoriler) ile yükleme yapılır; `StoredFile` kaydı oluşur.
3. Virüs taraması (ClamAV) sonrası dosya `Active` olur; `AttachFileCommand` ile bir iş entity'sine bağlanır (`FileAttachment`).
4. İndirme, resource-level scope kontrolü + kısa TTL presigned URL ile yapılır.

> Detaylı UI akışları için bkz. `ui-flows.md` (Faz 3/5'te dolacak).
> Domain event akışı için bkz. `domain-model.md` § Domain Events ve `notifications.md`.

---

## İlişkili Modüller

| Modül | İlişki |
|---|---|
| `school-settings` | SchoolLogo kategorisi ile ilk canlı tüketici (Faz 5, mevcut logo akışının göçü) |
| `homework` | Gelecekte `AssignmentSubmission` kategorisi ile bağlanacak (Application katmanı henüz boş — B2) |
| `announcements` | Gelecekte `AnnouncementAttachment` kategorisi ile bağlanacak (B2) |
| `identity` | Onboarding sırasında `ProvisionSchoolBucketCommand` (Faz 2) |

---

## Mevcut Durum

- Hangi sprint'te? → `feature/dosya-yonetimi-faz3` branch'i, Faz 0-3 tamamlandı, henüz master'a merge edilmedi (bkz. `completion_status.md`)
- MVP scope'unda mı? → Evet, altyapı MVP kapsamında; canlı tüketici Faz 5'te (SchoolLogo)
- Hangi parçaları yapıldı / kaldı? → Faz 0 (dev altyapı) + Faz 1 (domain + persistence) + Faz 2 (depolama/S3/provisioning) + Faz 3 (CQRS yüzeyi + izinler) ✅; Faz 4-5 ⏳ (bkz. `completion_status.md`)

> Açık sorular için bkz. `open-questions.md`.

---

## Metadata

- **Slug:** documents
- **Status:** in-progress
- **Sprint:** Dosya Yönetimi Faz 0-4
- **Owner:** {{TBD}}
- **Created:** 2026-07-04
- **Last Updated:** 2026-07-04
- **Files:**
  - [x] README.md
  - [x] domain-model.md
  - [x] api-contracts.md
  - [x] database-schema.md
  - [x] permissions.md
  - [x] notifications.md
  - [ ] ui-flows.md
  - [x] business-rules.md
  - [x] open-questions.md
  - [x] completion_status.md
