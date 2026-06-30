# Öğrenci Kayıt — Faz 2B: Lifecycle Komutları (Tasarım)

> **Durum:** Tasarım onaylandı (2026-06-30). Bağlayıcı şemsiye: `ogrenci-kayit-enrollment-spec.md`.
> **Kapsam:** Faz 2A'da listede **disable** edilen 5 yaşam-döngüsü aksiyonunu gerçek backend komutlarına bağlamak.
> **Sonraki adım:** `writing-plans` → TDD uygulama planı → `subagent-driven-development`.

## 1. Amaç

`StudentEnrollment` için 5 lifecycle komutu (Freeze, Resume, Withdraw, TransferOut, Graduate) yazmak, REST uçlarını açmak ve frontend'in pasif aksiyonlarını bunlara bağlamak. **Archive (6. metot) ertelendi** — UI butonu yok, terminal→Archived arşiv/KVKK işlemi; ayrı iş.

## 2. Mimari Karar — Koordineli (iki-eksen)

Lifecycle iki eksende tutulur:
- **`StudentEnrollment.Status`** (sezon/idari): `Draft→Active→{Frozen|TransferredOut|Withdrawn|Graduated}→Archived` (spec E4.2).
- **`Person.LifecycleState`** (kişi): `Draft→Invited→Active→{Suspended|Graduated|Transferred}→Archived`.

**Karar:** Her lifecycle komutu **koordineli** çalışır — tek transaction'da hem enrollment.Status'u hem Person.LifecycleState'i (gerektiğinde) hem de şube üyeliğini (`ClassRoomStudent` + `StudentProfile.CurrentClassroomId`) günceller. Buton = tek tutarlı durum değişimi. Bu komutlar lifecycle için **kanonik** kanaldır; eski `/users/persons/{id}/*` uçları öğrenci bağlamında kullanımdan kalkar.

`ClassRoomStudent` şube üyeliğinin tek doğruluk kaynağıdır (E1.3, BR-students-001); terminal geçişlerde aktif atama `ClassRoomStudent.Close(...)` ile kapatılır ve `StudentProfile.CurrentClassroomId` temizlenir.

## 3. Komut Davranış Tablosu

| Komut | enrollment.Status | Şube üyeliği | StudentProfile | Person.LifecycleState | Gövde |
|---|---|---|---|---|---|
| **FreezeEnrollment** | Active→Frozen | **Korunur** (geri dönecek) | değişmez | Active→`Suspend(reason)` | `{ reason }` zorunlu |
| **ResumeEnrollment** | Frozen→Active | korunur | değişmez | Suspended→`Reactivate()` | — |
| **WithdrawStudent** | Active→Withdrawn | `Close` + CurrentClassroomId temizlenir | `Deactivate()` | Active→`Suspend(reason)` | `{ reason }` zorunlu |
| **TransferOutStudent** | Active→TransferredOut | `Close` + temizlenir | `Deactivate()` | Active→`Transfer(targetSchoolId?)` | `{ targetSchoolId?, reason? }` |
| **GraduateStudent** | Active→Graduated | `Close` + temizlenir | `Deactivate()` | Active→`Graduate()` | — |

**Notlar:**
- **Freeze** geçici → şube koltuğu korunur; `Person.Suspend(reason)` neden ister → `reason` zorunlu.
- **Withdraw** ve **Freeze** ikisi de Person'ı `Suspended` yapar; Person ekseni kabadır, ince ayrım (Frozen vs Withdrawn) enrollment ekseninde durur. Guard'lar karışmayı engeller (Resume yalnız Frozen'dan çalışır).
- **Close** çağrısı `ClassRoom` aggregate'i üzerinden yapılır (ClassRoomStudent.Close internal'dır). Kapanış tarihi `clock.UtcNow`, `AssignmentReason` ilgili sebep (uygulama planında enum değeri kesinleştirilir).
- **Reason alanlarının yeri:** Freeze/Withdraw `reason` → `Person.Suspend(reason)`'a geçer. TransferOut'un opsiyonel `reason`'ı (Person.Transfer neden almaz) → `ClassRoomStudent.Close(notes)` not alanına yazılır; boşsa not yazılmaz.

## 4. Domain Değişikliği (Karar 1a)

`Person.Transfer(Guid targetSchoolId)` → **`Person.Transfer(Guid? targetSchoolId)`**. OKSİS dışı okula nakilde hedef Guid bilinmez → `null` kabul edilir. `PersonTransferredEvent` alanı ve mevcut tüm çağıranlar nullable'a güncellenir; `Person.Transfer(null)` için domain testi eklenir.

## 5. REST Sözleşmesi

Mevcut colon-action konvansiyonu. `{id}` = öğrenci **PersonId**; komut aktif sezon enrollment'ını çözer.

| Rota | Komut | İzin |
|---|---|---|
| `POST /api/v1/students/{id:guid}:freeze` | FreezeEnrollment | `students.manage` |
| `POST /api/v1/students/{id:guid}:resume` | ResumeEnrollment | `students.manage` |
| `POST /api/v1/students/{id:guid}:withdraw` | WithdrawStudent | `students.manage` |
| `POST /api/v1/students/{id:guid}:transfer-out` | TransferOutStudent | `students.manage` |
| `POST /api/v1/students/{id:guid}:graduate` | GraduateStudent | `students.manage` |

**Sezon çözümü:** Komut, **aktif (`IsCurrent`) sezondaki** enrollment'ı `(schoolId, studentPersonId, currentSessionId)` ile bulur. MVP'de seçili sezon = aktif sezon.

## 6. Hata Yönetimi

Result pattern (akışı exception'a bırakmayız):
- Tenant yok → `Result.Forbidden()`.
- Aktif sezonda enrollment yok → `Result.NotFound("enrollment.notFoundInCurrentSession")`.
- Geçersiz geçiş (ör. Active olmayanı Freeze) → handler durumu **önceden kontrol eder**, `Result.Fail("enrollment.invalidTransition")` döner. Entity guard'ı (DomainException) son emniyet kemeridir, normal akışta tetiklenmez.
- İzin yok → MediatR authorization pipeline 403.

**Idempotency:** Lifecycle için ayrı idempotency kaydı yok — geçişler guard'lı (çift Freeze → ikincisi `invalidTransition`), bu doğal koruma yeterli.

**Domain event:** Faz 2B lifecycle **event yayınlamaz** (bildirim/outbox ayrı iş). Veli bildirimi gerekirse ileride event eklenir — **Debt** olarak `completion_status.md`'ye yazılır.

## 7. Komut İç Yapısı (EnrollStudent pattern'i)

Her handler `ICommandHandler<TCommand, Unit/Result>`; ctor deps: `IApplicationDbContext db`, `ITenantContext tenant`, `IDateTimeProvider clock`. Akış:
1. `schoolId = tenant.CurrentSchoolId` → null ise `Forbidden`.
2. Aktif sezon id'sini çöz (`AcademicSessions.Where(IsCurrent)`).
3. Enrollment'ı `(StudentPersonId == id && AcademicSessionId == currentSessionId)` ile yükle → yoksa `NotFound`.
4. Durum ön-kontrolü → geçersizse `Fail("enrollment.invalidTransition")`.
5. Person + (terminal ise) ilgili `ClassRoom` + `StudentProfile` yüklenir.
6. Domain metotları sırayla çağrılır (enrollment geçişi → şube Close → profil → person geçişi).
7. `SaveChangesAsync` → `Result.Success`.

İzin attribute'u command üzerinde (`students.manage`). Her komutun `FluentValidation` validator'ı: Freeze/Withdraw → `reason` 3–500 karakter; diğerleri → `id` boş değil.

## 8. Frontend Bağlama (oksis-web)

- **İzin düzeltmesi:** `StudentRowActions.tsx` şu an freeze/graduate/transferOut için `students.update`, deactivate için modülde **olmayan** `students.delete` kullanıyor → 5 aksiyonun tamamı `can.has("students.manage")` ile gate edilir (spec E9 + permissions.md).
- **`studentsApi.ts`:** Eski `/users/persons/{id}/*` metotları yeni enrollment uçlarıyla değiştirilir: `freeze(id, reason)`, `resume(id)`, `withdraw(id, reason)`, `transferOut(id, { targetSchoolId?, reason? })`, `graduate(id)`.
- **Mutation hook'ları:** Aksiyon başına React Query `useMutation`; başarıda students list + detail invalidate. Stabil `mutateAsync` (mutation nesnesi deps'e konmaz — sonsuz-render kuralı).
- **Görünürlük (enrollment.Status):** Active → Dondur/Ayrılma/Nakil/Mezun; Frozen → yalnız Devam; terminal → aksiyon yok. (Withdraw/TransferOut/Graduate guard'ı Active ister → Frozen öğrenci önce Devam etmeli; MVP kısıtı.)
- **`LifecycleActionDialog`** (paylaşılan, shadcn AlertDialog): Freeze + Withdraw → zorunlu neden Textarea; TransferOut → opsiyonel hedef okul + neden; Graduate/Resume → düz onay + geri-alınamaz uyarısı. i18n tr/en.

## 9. Test Stratejisi

- **Backend (her komut, Testcontainers integration):** happy-path (3 eksen etkisi: status + ClassRoomStudent.Close/koltuk + Person state + profil), geçersiz geçiş → Fail, aktif sezonda enrollment yok → NotFound, tenant izolasyonu (cross-tenant erişilemez), izinsiz → 403.
- **Domain:** `Person.Transfer(null)`; Freeze→Suspend + classroom-korunur; Graduate→classroom-Close koordinasyon testleri.
- **Frontend (vitest):** `studentsApi` metot testleri (URL/gövde); `LifecycleActionDialog` zorunlu-neden validasyon testi.

## 10. Out of Scope (Faz 2B değil)

- Archive komutu/uç/buton (terminal→Archived) — ayrı iş.
- Lifecycle domain event'leri + veli bildirimi — Debt.
- Renewal/sezon yenileme (Faz 3).
- Seçili-sezon ≠ aktif-sezon senaryosu (MVP'de eşit kabul).
