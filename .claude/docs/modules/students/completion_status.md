# Öğrenci (Students) — Tamamlanma Durumu

> Bu dosya modülün ne ölçüde tamamlandığını ve spec dışına çıkılan
> durumları raporlar. İlgili her geliştirmede ANINDA güncellenir.
> Status snapshot'tır, kural deposu değil (tam kurallar `business-rules.md`).

**İlerleme:** `████░░░░░░` %40   ·   Status: in-progress (Faz 1B — FE wizard)   ·   Güncel: 2026-06-29 (Faz 1A backend tamamlandı)

> 2026-06-29: **Faz 1A backend tamamlandı.** Domain (`StudentEnrollment`, `StudentDocument`, `EnrollmentIdempotency`, `StudentNumberCounter`), migration `20260629_student_enrollment_core`, `EnrollStudentCommand` (tek-transaction: Person+Enrollment+ClassRoom.AssignStudent+guardians+idempotency+event), 3 yardımcı query, 5 REST endpoint, 8 permission seed (STUDENTS modülü). Post-commit: `StudentEnrolledEventHandler` → veli daveti + öğrenci hesabı. Detay: `.claude/specs/ogrenci-kayit-enrollment-spec.md`, plan: `.claude/specs/ogrenci-kayit-faz1-backend-plan.md`. Branch: `oksis-api:student-enrollment`.

> 2026-06-28: **Güncel şube tek doğruluk kaynağı + ayna alan kuralı (mimari değişiklik).** `academic.class_room_students` (aktif satır, `left_at IS NULL`) güncel şubenin tek doğruluk kaynağı; `StudentProfile.CurrentClassroomId` ondan `StudentClassroomSyncInterceptor` ile aynı transaction içinde türetilen denormalize ayna alandır (aktif yoksa `null`). Atama/transfer/çıkarma handler'larındaki manuel senkron kaldırıldı → iki-yazım drift'i yapısal olarak imkânsız. Doküman: `business-rules.md` BR-students-001 dolduruldu (skeleton değildi artık) + tarihsel not. İlgili: classrooms BR-classrooms-001, identity api-contracts notu.

> 2026-06-08: **Öğrenciler design-handoff 1:1 boşluk kapatma (oksis-web).** Mevcut ekran (drawer 7 sekme + GuardiansTab + AddGuardianDialog hepsi gerçek) tasarıma uyduruldu; eksik parçalar eklendi: (1) **"Yeni Öğrenci" (Enroll) modalı** (`EnrollStudentDialog` — ad/soyad + cinsiyet segment + doğum + sınıf/şube + birincil veli; başarıda öğrenci no + geçici şifre `cred-box`); (2) **"Sınıf Ata / Değiştir" modalı** (`AssignClassDialog`, tekil drawer + toplu seçim, aktif-sezon etki notu); (3) seçim çubuğunda **toplu Sınıf Ata + Sınıf Yükselt** etkinleştirildi (eskiden pasif); (4) drawer'da `wide` + footer tasarıma uyarlandı (**Sınıf Ata · Veli Bağla** [→ Veliler sekmesi] **· Düzenle**), eski noop "Mesaj/Profili Aç" footer'ı kaldırıldı. **Backend ucu OLMAYANLAR mock fallback + "D" rozeti** (`shared/api/debtFallback.attemptRealThenMock`): Enroll (`POST /students`), AssignClass (`POST /students/{id}/transfer-class`), Promote (`POST /students/promote`), Edit (`PUT /students/{id}`). Mevcut GERÇEK uçlar korundu: liste/stats/detay/veli(GuardiansTab,AddGuardianDialog)/lifecycle(suspend,reactivate,graduate,transferOut,deactivate)/export/enrollment-history/sezon. Mock mantığı `studentsDebtApi`/`useStudentDebt`'te izole; AssignClass/Edit mutasyonları test-izolasyonu için page'de (drawer prop `onAssignClass`/`onEdit`). Ortak Modal sistemi `shared/components/modal/Modal` + `shared/styles/modal.css` (Kullanıcılar/Öğretmenler ile paylaşımlı; cred-box eklendi). Drawer testleri güncellendi (onMessage/onOpenProfile prop'ları kaldırıldı). 48 students vitest yeşil, tam paket 463 yeşil, build yeşil. Sapma: bkz. Spec Dışına Çıkılanlar 2026-06-08 "Students DEBT mock-fallback".

> Temel: Backend `Application/Modules/Students` Faz 1A ile doldu. Web "Öğrenciler" admin ekranı VAR (`oksis-web/src/portals/admin/students/**`) ve spec-audit (students-spec-audit) ile §4'e hizalandı.

---

## ✅ Tamamlanan Yapılar

- 9 dosyalık doküman iskeleti oluşturuldu (içerik doldurulmadı).
- **Web admin "Öğrenciler" ekranı** (liste/kart, KPI, drawer, filtreler) mevcut.
- **students-spec-audit ISSUE-01..06 (2026-06-08):** Öğrenciler ekranı sezon eksenine alındı, veli yönetimi, satır/toplu aksiyonlar, drawer sekme yapısı, arama+filtreler, yaşam-döngüsü koruma UI'da tamamlandı. Detay: satır satır 2026-06-08 öncesi kayıtlar.
- **Faz 1A Backend (2026-06-29, `oksis-api:student-enrollment`):**
  - Domain: `StudentEnrollment` aggregate, `StudentDocument`, `EnrollmentIdempotency`, `StudentNumberCounter` POCO, `EnrollmentType`/`EnrollmentStatus`/`DocumentType` enum'ları, `StudentEnrolledEvent`.
  - Migration: `20260629_student_enrollment_core` — 4 tablo (`student_enrollments`, `student_documents`, `enrollment_idempotency`, `student_number_counters`; `academic` schema).
  - `IStudentNumberGenerator`: atomic `{yıl}{5-hane}`, per-tenant, bir kez üretilir (E2.3).
  - CQRS: `EnrollStudentCommand` — tek transaction (Person+StudentProfile+StudentEnrollment+ClassRoom.AssignStudent+guardians+idempotency+event); `ClientRequestId` idempotency; hard kapasite kontrolü; aktif sezon kontrolü; `TemporaryPassword` sonuçta.
  - Queries: `CheckNationalIdDuplicate`, `GetBranchCapacity`, `SearchGuardians`.
  - Post-commit: `StudentEnrolledEventHandler` → `IPostCommitDispatcher` → veli daveti (`InvitationCreationHelper`) + öğrenci hesabı (`Account.Create`, `requirePasswordChange=true`; kullanıcı adı = öğrenci no).
  - REST: `POST students:enroll`, `POST students:transfer-in`, `GET students/check-national-id`, `GET branches/capacity`, `GET guardians:search`.
  - Permissions seed (8 izin): `students.view`, `view-detail`, `create`, `update`, `renew`, `manage`, `import`, `export` — SuperAdmin+SchoolAdmin tümü; Teacher `view`+`view-detail`.

---

## ⏳ Eksik / Bekleyen Yapılar

- **Faz 1B (FE wizard):** Kayıt sihirbazı FE portu (`EnrollStudentDialog` → gerçek backend bağlantısı; şu an mock+D). `POST /api/v1/students:enroll` ve `transfer-in` uçları canlı → mock'lar kaldırılacak.
- **Faz 2 backend:** `ListStudents`/`GetStudentDetail`/`GetEnrollmentHistory` slice'ları (web tüketici hazır, uç açılınca beslenir), Freeze/Withdraw/Transfer/Graduate endpoint'leri, server-side `seasonId` filtresi.
- **Faz 2 FE:** AssignClass / PromoteStudents mock+D → gerçek; Belgeler sekmesi aktifleşmesi; Hesap sekmesi bağlantısı.
- **Faz 3+:** `students.import` toplu aktarım, document upload UI.
- **Doküman içeriği:** `domain-model.md`, `api-contracts.md`, `database-schema.md` Faz 1A ile dolduruldu; `notifications.md`, `ui-flows.md`, `business-rules.md`, `open-questions.md` hâlâ iskelet/TBD.
- **Mobile:** öğrenci rolü ekranları (yok).
- **ISSUE-05 küçük not:** `export` ucu yeni `gradeCode`/`hasGuardian` param'larını henüz tüketmiyor → web zararsız geçirir (export filtre paritesi ileride).

---

## ⚠️ Spec Dışına Çıkılanlar

- **2026-06-29 — E2.3: EnrollmentNo kaldırıldı, öğrenci-no kişiye sabit (ONAYLANMIŞ KARAR, sapma değil).** Spec başlangıç taslağı per-season `EnrollmentNo` öngörmüştü; spec E2.3 bunu revize etti: öğrenci numarası (`StudentNumber`) kişiye sabit, `{yıl}{5-hane}` formatında, bir kez üretilir, mezuniyete kadar değişmez. `EnrollmentNo` alanı hiç oluşturulmadı. Karar: spec E2.3 revizyon (kullanıcı onayladı).
- **2026-06-29 — Secretary rolü Faz 1A seed'inde yok.** `students.*` izinleri seed'inde SecretaryRoleId yok (MVP rolleri: SuperAdmin, SchoolAdmin, Teacher, Parent, Student); Secretary ileride. `permissions.md` ve `permission-matrix.md` hedef tasarımı gösterir. Bkz. `permission-matrix.md` § 1 MVP notu.
- **2026-06-08 — Students DEBT mock-fallback: backend'siz aksiyonlar gerçek istek atar ama mock döner + "D" rozeti (oksis-web, bu oturum):** Design-handoff 1:1 boşlukları kapatılırken backend ucu **henüz açılmamış** öğrenci işlemleri `shared/api/debtFallback.attemptRealThenMock` ile sarıldı. Kapsam: Enroll, AssignClass, Promote, Edit. Gerekçe: kullanıcı talimatı. Geçiş: Faz 1B uçlar açılınca `studentsDebtApi`'de mock kaldırılır; UI dokunulmaz.
- **2026-06-08 — ISSUE-01 (geçici degrade):** `GetEnrollmentHistory` + server-side `seasonId` filtresi backend'de yok; Faz 2'ye ertelendi.
- **2026-06-08 — ISSUE-02 (eşdeğer uç + client orkestrasyonu):** `LinkGuardian`/`UnlinkGuardian`/`SetPrimaryGuardian` ayrı slice yok; mevcut `Users` uçları kullanıldı; tek-birincil atomik garanti Faz 2'de.
- **2026-06-08 — ISSUE-03 (görünür-ama-pasif):** AssignClass/PromoteStudents/UploadDocument/UpdateStudent backend ucu yok → web'de görünür ama pasif + notReadyHint.
- **2026-06-08 — ISSUE-04 (Ödemeler sekmesi kaldırıldı, onaylı):** §4.6 dışı Ödemeler sekmesi kaldırıldı.
