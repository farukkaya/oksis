# Öğrenci Kayıt — Faz 3B (Yenileme + Rollover Köprüsü) Tasarım Dokümanı

> **Tür:** Tasarım dokümanı (faz uygulama girdisi). Şemsiye **bağlayıcı** spec:
> `.claude/specs/ogrenci-kayit-enrollment-spec.md` (E6.2, E6.3, E8, E10, E11.6, E4). Bu
> doküman o spec'in **Faz 3** paketinin **3B** alt-fazıdır (3A = niyet toplama, tamamlandı).
>
> **Durum:** Onaylı (brainstorming, 2026-07-01) · **Kapsam:** `students` + `academic-sessions`
> modülleri — yenileme taslağı açma + sezon dönemi bayrağı + terfi köprüsü gating + FE.
> **Faz:** 3B (tek dilim — A+B+C+D).
>
> **Kaynaklar (girdi):**
> - Şemsiye spec: `.claude/specs/ogrenci-kayit-enrollment-spec.md` (E6 Yenileme akışı)
> - Faz 3A tasarımı: `.claude/specs/ogrenci-kayit-faz3a-yenileme-niyeti-design.md` (K1–K4)
> - Faz 3A oturumu: `.claude/sessions/2026-06-30-enrollment-faz3a-renewal-intent.md`
> - Modül dokümanları: `students/*`, `academic-years/*` (academic-sessions slug = `academic-years/`)

---

## 1. Amaç

Faz 3A'da toplanan **veli yenileme niyetini** (`Renewing`) gerçek bir gelecek-sezon kaydına
ve sınıf terfisine **köprüler**. Üç adım:

1. **Yenileme dönemini aç** — hedef Setup sezonda explicit bayrak (`RenewalPeriodOpenedAt`).
2. **RenewEnrollment** — Renewing olanlara hedef sezonda `Type=Renewal`, `Status=Draft`,
   `ClassRoomId=null` (koltuk YOK) idari kayıt açar + `EnrollmentRenewedEvent` → veli bildirimi.
3. **Terfi köprüsü** — `PromoteStudents`, dönem açıksa **yalnız taslağı olan** öğrenciyi koltuğa
   yerleştirir ve taslağı `Draft→Active` + `ClassRoomId` yapar (E6.3 gating).

> Tek cümle: **3B, niyeti taslak kayda + koltuğa dönüştüren köprüdür.** E1.3 korunur:
> `ClassRoomStudent` defteri tek doğruluk kaynağı; idari kayıt (StudentEnrollment) onu mirror'lar.

---

## 2. Kilitlenen Kararlar (brainstorming 2026-07-01)

| # | Karar | Gerekçe |
|---|---|---|
| **S1** | Tek dilim 3B (A=academic-sessions, B=RenewEnrollment+event, C=köprü gating, D=FE); ekran testi sonda | Kullanıcı onayı; köprü gerilimi tek turda izole |
| **S2** | Gating = **yenileme-taslağı sürücülü**: PromoteStudents yalnız hedef sezonda `Type=Renewal` taslağı olan öğrenciyi terfi eder | Tek doğruluk kaynağı (enrollment defteri); en az çift-kaynak riski; E6.2 "RenewEnrollment → PromoteStudents köprülenir" ile birebir |
| **S3** | RenewEnrollment **yalnız Renewing→taslak**; Leaving/Undecided no-op (otomatik Withdraw YOK) | Odak; lifecycle/Person.LifecycleState'e dokunmaz. "Leaving→Withdraw" otomasyonu ertelendi (cari aktif sezon kaydını kapatmak riskli; admin gerekirse 2B Withdraw ile manuel) |
| **S4** | `EnrollmentRenewedEvent` **RenewEnrollment anında** tetiklenir; veliye **sınıfsız** "kaydınız yenilendi" bildirimi | Spec E6.2/E10 ile uyumlu: "yenileme" eylemi RenewEnrollment'ın kendisi; taslakta sınıf yok |
| **S5** | OpenRenewalPeriod izni = **yeni `season.renewal.open`** (default-deny) | Granüler `season.*` taksonomisiyle tutarlı; en az-yetki (dönem-açma ≠ sezon-aktive) |
| **S6** | FE Export 3B'de **ertelenir** (pasif `notReadyHint` kalır) | Dilim odağı; Export bağımsız, sonra |

**3A'dan miras kararlar (3B'yi bağlar):** K1 (yenileme = rollover ön-adımı), K2 (dönem =
`RenewalPeriodOpenedAt?` bayrağı + komut), K3 (köprü tetik = **spec E6.3**, docx §5.1 değil —
Rule #6). Tetik noktası: gating `PromoteStudents` **içinde** (RenewEnrollment doğrudan promote
tetiklemez).

---

## 3. Backend — A: academic-sessions (sezon dönemi)

academic-sessions modülü (klasör slug'ı `academic-years/`; aggregate `AcademicSession`).

### 3.1 Domain
- **Yeni alan:** `AcademicSession.RenewalPeriodOpenedAt : DateTimeOffset?` (private set, nullable).
- **Yeni davranış:** `OpenRenewalPeriod(DateTimeOffset now)`.
  - **Guard:** yalnız `Status == Setup` iken açılabilir; `Active`/`Archived` → `DomainException`.
    (BR-AS-002 tek-yön invariant'ını ihlal etmez — statü değiştirmez, yalnız nullable timestamp set eder.)
  - **İdempotent:** `RenewalPeriodOpenedAt != null` ise no-op (tekrar açma hata değil, sessiz geçer).

### 3.2 Migration
- Ad: `..._renewal_period.cs` (`student_enrollment_core` adlandırma deseni; `YYYYMMDDhhmmss_YYYYMMDD_renewal_period`).
- `academic_sessions` tablosuna nullable `renewal_period_opened_at` kolonu.

### 3.3 Komut + REST
- `OpenRenewalPeriodCommand(Guid SessionId)` → `[Tenancy(Required)]`, `[RequirePermission("season.renewal.open")]`.
  Handler `IApplicationDbContext`'e bağlı; sezonu çeker (tenant-içi), `OpenRenewalPeriod(clock.Now)` çağırır, `SaveChanges`.
  **Hata:** 403 (izin) · 404 (sezon yok) · 409 (Setup değil).
- **REST:** `POST /api/v1/academic-sessions/{id}/open-renewal-period` (mevcut `/{id}/activate` deseni).

### 3.4 Guard genişletmesi (BR-AS-015 veri-kaybı fix)
`ReopenSeasonToDraftCommandHandler` + `CancelSetupSeasonCommandHandler` guard'ları:
- Mevcut: yalnız şubelerdeki öğrenci ataması / görevlendirme verisini kontrol ediyor.
- **Genişletme:** hedef sezonda `RenewalPeriodOpenedAt != null` **veya** `Type=Renewal` taslak
  enrollment varsa **reddet (409)**. Sebep: taslak enrollment'lar `ClassRoomId=null` olduğundan
  şubelerde görünmez → niyet/taslak toplanmış sezon sessizce reopen/cancel edilip veri kaybına
  yol açar. Guard bunu kapatır.

---

## 4. Backend — B: students RenewEnrollment + event

### 4.1 Komut
`RenewEnrollmentCommand(Guid TargetSessionId)` → `[Tenancy(Required)]`, `[RequirePermission("students.renew")]`.

**Sonuç:** `RenewEnrollmentResult(int Created, int Skipped)`.

**Handler davranışı (toplu-by-session):**
1. Cari **aktif** sezonu bul (`IsCurrent`); hedef sezon (`TargetSessionId`) Setup olmalı (değilse 409).
   Hedef sezonda `RenewalPeriodOpenedAt != null` ön-koşulu **aranmaz** (FE akışı önce OpenRenewalPeriod
   çağırır; ama RenewEnrollment kendi başına da idempotent çalışır — dönem bayrağı PromoteStudents gating'i içindir, RenewEnrollment için değil).
2. Cari sezonda `Status==Active` + `Intent==Renewing` enrollment'ları çek.
3. Her biri için **eleme:**
   - Hedef sezonda o `StudentPersonId` için zaten `Type=Renewal` taslak varsa → atla (idempotent, `Skipped`).
   - Bir üst aktif sınıf seviyesi yoksa (terminal/mezun olacak) → atla (`Skipped`). (Promote mezuniyet mantığıyla hizalı; `SchoolGradeLevels.IsActive` üzerinden `GradeLevel+1` kontrolü.)
4. Uygun olanlara hedef sezonda `StudentEnrollment.Create(...)`:
   `Type=Renewal`, `Status=Draft`, `ClassRoomId=null`, `GradeLevel = kaynak.GradeLevel + 1`,
   `AcademicSessionId = TargetSessionId`, `StudentPersonId` aynı.
   - **StudentNumber değişmez** (E4.4.2) — taslak yeni numara üretmez (mevcut `StudentProfile.StudentNumber` korunur).
   - **E11.6 uyumu:** taslak `Draft` statüde + Setup sezonda → "yalnız aktif sezona Active enrollment" kuralını ihlal etmez.
5. Her taslak için `EnrollmentRenewedEvent` raise (aggregate üzerinden); tek `SaveChanges` (TransactionBehavior).

**Validator:** `TargetSessionId` boş olamaz.

### 4.2 Domain event + bildirim
- `EnrollmentRenewedEvent(Guid EnrollmentId, Guid SchoolId, Guid StudentPersonId, Guid AcademicSessionId, Guid SourceEnrollmentId, IReadOnlyList<Guid> GuardianPersonIds) : IDomainEvent` — Events klasörü `Modules/Students/Events/`.
- Akış: `DomainEventInterceptor` SaveChanges'te yakalar → outbox → Hangfire `DispatchNotificationJob` → `INotificationRecipientResolver<EnrollmentRenewedEvent>` veli (guardian) çözer → in-app + (kanal varsa) FCM/email.
- **İçerik (S4):** "Gelecek sezon kaydınız yenilendi" — sınıf bilgisi YOK (taslakta koltuk yok). i18n bildirim şablonu.
- **İdempotency:** `notification_delivery_log (outbox_id, user_id, channel)` unique (mevcut altyapı).

### 4.3 REST
- `POST /api/v1/enrollments:renew` → RenewEnrollment (E8 birebir, `students.renew`).
  Body: `{ "targetSessionId": "..." }`. Yanıt: `{ created, skipped }`.

---

## 5. Backend — C: terfi köprüsü (PromoteStudents gating + ActivateSeasonRollover)

### 5.1 PromoteStudents gating (E6.3)
`PromoteStudentsCommandHandler`'a koşullu davranış:
- **Dönem AÇIK** (`target.RenewalPeriodOpenedAt != null`):
  - Mevcut roster terfisini (kaynak `ClassRoomStudent` → hedef sınıf, `SourceClassRoomId` haritası)
    **"hedef sezonda `Type=Renewal` taslağı olan" öğrencilerle kesiştir.**
  - Yalnız taslaklı öğrenciyi koltuğa yerleştir; **ve o taslağı `Draft→Active` + `ClassRoomId` set et**
    (`enrollment.Activate()` + ClassRoomId ataması; E1.3 — defter `ClassRoomStudent`, enrollment mirror).
  - Taslağı olmayan roster öğrencisi → atlanır (`Skipped`).
  - Mezuniyet mantığı (terminal sınıf) korunur.
- **Dönem KAPALI** (`== null`) — **geriye-uyum (E6.3 "korunur"):**
  - Mevcut davranış **aynen**: tüm roster terfi/mezun; enrollment'a **dokunulmaz**.
  - (Legacy yolda promote'un yeni-sezon enrollment oluşturmaması mevcut bir boşluktur; 3B kapsamı
    DEĞİL — completion_status'a not düşülür.)

### 5.2 ActivateSeasonRollover entegrasyonu
- **İmza/akış değişmez.** Orkestratör zaten `PromoteStudents(ExcludePassive=true)` çağırıyor; gating
  PromoteStudents'ın **içinde** olduğundan transparan. Sıra: aktive → (gated) promote → görevlendirme
  kopya → rol atama kopya → taslak temizle.
- **Doğal sıralama:** admin akışı: dönemi aç → 3A niyet → RenewEnrollment (taslaklar) → ActivateSeasonRollover.
  Taslaklar promote'tan **önce** var olur. (Rollover'da hedef sezona taslak **ders programı** üretimi
  bağlayıcı değil — ders-programi spec'i zorunlu kılmıyor; **kapsam dışı/Debt.**)

---

## 6. Frontend — D (`oksis-web`, RenewalPage)

3A'da kurulu `RenewalPage` üzerine; `reenroll.jsx` handoff'una sadık; **`.scr-*` global sistem** (3A dersi: `.stu-*` değil; yeşil testler CSS kırılmasını kaçırır → ekran testi şart).

- **"Yenilemeyi Başlat" etkinleştir** (pasif `notReadyHint` kalkar):
  - Akış: `OpenRenewalPeriod` (hedef Setup sezon) → `RenewEnrollment` (taslaklar). İki adım tek butonda.
  - Başarıda `renewal-candidates` invalidate + sonuç (created/skipped) geri bildirimi.
  - Stabil `mutateAsync` (mutasyon nesnesini deps'e koyma — memory kuralı).
- **Gerçek hedef-sezon bağlama:** sezon köprüsü gerçek hedef Setup sezonunu + `RenewalPeriodOpenedAt`
  durumunu gösterir; taslak sezon yoksa zarif boş-durum.
- **Sınıf-bazlı filtre:** 3A'da `gradeLevel`'a bağlıydı; 3B'de gerçek `classRoomId` filtresi.
  → **BE küçük dokunuş:** `ListRenewalCandidatesQuery`'ye `classRoomId?` param + handler filtresi (D kümesi).
- **Export:** pasif kalır (S6).
- **İzin kapısı:** "Yenilemeyi Başlat" `season.renewal.open` + `students.renew` (UI gate UX-only).
- **Yeni hook'lar:** `useOpenRenewalPeriodMutation`, `useRenewEnrollmentMutation`.
- **i18n:** `renewal.start.*` (tr+en). Hardcoded Türkçe yasak.

---

## 7. Doküman borcu — E (3B'de kapatılır)

- **students/domain-model.md:** `Intent: string?` (başvuru notu) ↔ `RenewalIntent?` (niyet enum) **çakışmasını ayrıştır**; bayat "Faz 2 ... henüz yok" davranış satırını düzelt; `SetRenewalIntent` + `RenewEnrollment`/`OpenRenewalPeriod` davranışlarını ekle; **`EnrollmentRenewedEvent`'i events tablosuna** ekle.
- **students/business-rules.md:** yeni **BR-students-004** (yenileme köprüsü: taslak-sürücülü gating, terminal-sınıf eleme, idempotency, S2/S3).
- **academic-years/business-rules.md:** E6.3 yansıması (PromoteStudents gating) — **spec E6.3 zorunlu** + reopen-guard genişletmesi (BR-AS-015 güncelle).
- **students/api-contracts.md + academic-years/api-contracts.md:** yeni uçlar (`open-renewal-period`, `:renew`, `classRoomId?` param).
- **completion_status.md (her iki modül):** ilerleme + "⚠️ Spec Dışına Çıkılanlar".
- **permission-matrix.md:** yeni `season.renewal.open`.

---

## 8. Testler (TDD)

**BE (Application.UnitTests / Infrastructure.IntegrationTests):**
- OpenRenewalPeriod: yalnız Setup'ta açılır; Active/Archived → 409; idempotent (ikinci çağrı no-op); tenant-izolasyon; izin 403.
- RenewEnrollment: yalnız Renewing→taslak (`Type=Renewal/Draft/ClassRoomId=null/GradeLevel+1`); terminal sınıf elenir; idempotent (taslak varsa atla); `EnrollmentRenewedEvent` raise; StudentNumber değişmez; tenant; izin 403.
- PromoteStudents gating: dönem AÇIK → yalnız taslaklı terfi + `Draft→Active`+ClassRoomId; taslaksız atlanır; dönem KAPALI → legacy davranış aynen (tüm roster, enrollment'a dokunulmaz); idempotent.
- Reopen/cancel guard: `RenewalPeriodOpenedAt != null` veya Renewal taslak varsa 409.
- ActivateSeasonRollover: gated promote ile uçtan uca (dönem açık senaryosu) sayıları doğru.

**FE (vitest):**
- "Yenilemeyi Başlat" → open+renew sıralı mutation; başarı geri bildirimi; invalidate.
- Hedef-sezon gösterimi (var/yok); `classRoomId` filtresi; izin gate; query key tenant-scoped.

**Chrome E2E (zorunlu, sonda):** `.scr-*` stilleri gözle doğrula; gerçek dönem-aç → taslak akışı; (opsiyonel) rollover ile gated promote.

---

## 9. Branch + Akış + DoD

- **Branch:** `student-faz3b` ← `student-faz3a` üzerinden (3A merge edilmedi; 3B onun dilimlerine dayanır). Hem `oksis-api` hem `oksis-web`.
- **Akış:** bu tasarım → writing-plans (TDD) → subagent-driven-development (her görevde spec+kalite review) → opus whole-branch final review → Chrome ekran testi → finishing-a-development-branch (push + PR).
- **DoD:** 3 BE uç + gating canlı; RenewEnrollment event+bildirim çalışıyor; FE "Yenilemeyi Başlat" gerçek uçlara bağlı; BE+FE testleri yeşil; `dotnet build`/`format` + `npm run build`/`vitest` temiz; modül dokümanları + permission-matrix + academic-sessions BR güncel; Chrome E2E ile doğrulanmış.

---

## 10. Spec uyum notları (Rule #6)

- **E6.2** RenewEnrollment davranışı birebir: yalnız Renewing → hedef taslak sezonda Type=Renewal; PromoteStudents'a köprülenir. ✔ (S2/S3)
- **E6.3** PromoteStudents gating + academic-sessions BR yansıması zorunlu. ✔ (C + §7)
- **E8** `POST /enrollments:renew` (students.renew). ✔ (§4.3)
- **E10** `EnrollmentRenewedEvent`, handler senkron iş yapmaz (Hangfire kuyruk). ✔ (§4.2)
- **E11.6** Taslak Renewal kaydı `Draft` statüde (aktif-sezon-Active ihlali yok). ✔ (§4.1)
- **E4.2/E4.3** State machine + enum kodları korunur (Draft→Active geçişi, Renewal=3). ✔
- **Serbest alan:** "dönem açılma" mekanizması spec'te adlandırılmamış → `RenewalPeriodOpenedAt` + `OpenRenewalPeriod` + `season.renewal.open` serbest tasarım (K2 ile kilitli), academic-sessions BR'leriyle tutarlı.
