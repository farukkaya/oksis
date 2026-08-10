# Documents (Dosya Yönetimi)

> Bu modülün **tek kaynak gerçek** dokümantasyonu. Diğer dosyalar bu modülün alt başlıklarını detaylandırır.
> Bağlayıcı spec: `.claude/specs/dosya-yonetimi-spec.md` — bu doküman spec'in Faz 0-5 (MVP tamam) teslim durumunu yansıtır, spec'in yerini almaz.

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
| `school-settings` | SchoolLogo kategorisi ile ilk canlı tüketici — Faz 5'te göç tamamlandı (`LogoStoredFileId` + public logo proxy) |
| `homework` | Gelecekte `AssignmentSubmission` kategorisi ile bağlanacak (Application katmanı henüz boş — B2) |
| `announcements` | Gelecekte `AnnouncementAttachment` kategorisi ile bağlanacak (B2) |
| `identity` | Onboarding sırasında `ProvisionSchoolBucketCommand` (Faz 2) |

---

## Mevcut Durum

- Hangi sprint'te? → Faz 0-5 TAMAM (MVP kapsamı bitti). Faz 0-4 `master`'a merge edildi; Faz 5 (api+web `feature/dosya-yonetimi-faz5`) henüz master'a merge edilmedi — final review sonrası kontrolcü merge edecek (bkz. `completion_status.md`)
- MVP scope'unda mı? → Evet; altyapı + ilk canlı tüketici (SchoolLogo, Faz 5) MVP kapsamında tamamlandı
- Hangi parçaları yapıldı / kaldı? → Faz 0 (dev altyapı) + Faz 1 (domain + persistence) + Faz 2 (depolama/S3/provisioning) + Faz 3 (CQRS yüzeyi + izinler) + Faz 4 (Hangfire job'ları + log kataloğu) + Faz 5 (SchoolLogo göçü + public logo proxy + web shared/files + eski `IFileStorageService` emekliliği) ✅ — kalan işler post-MVP borç (bkz. `completion_status.md` Known Gaps + `open-questions.md`)

> Açık sorular için bkz. `open-questions.md`.

---

## Metadata

- **Slug:** documents
- **Status:** complete (MVP tamam)
- **Sprint:** Faz 0-5 TAMAM
- **Owner:** {{TBD}}
- **Created:** 2026-07-04
- **Last Updated:** 2026-07-05
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
