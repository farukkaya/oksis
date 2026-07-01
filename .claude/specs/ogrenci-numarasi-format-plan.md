# Öğrenci Numarası Format & Kabul — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development ile görev-görev uygula. Adımlar checkbox (`- [ ]`).

**Goal:** Öğrenci numarasını okul-yapılandırılabilir (prefix/length opsiyonel), yılsız, default 3-hane/100'den başlayan, global-benzersiz ve import'a hazır hale getir; login resolver'ı okul-farkında yap.

**Architecture:** BE `students` (generator + validator + enroll) · `schools` (settings length nullable) · `identity` (login resolver). FE `settings` (StructureTab) + `students` (enroll opsiyonel no). Tasarım: `.claude/specs/ogrenci-numarasi-format-design.md` (K1-K7).

**Tech Stack:** .NET 10, EF Core 10, MediatR, FluentValidation; React+Vite+TS, React Query, RHF/Zod, i18next.

## Global Constraints
- Bağlayıcı tasarım `.claude/specs/ogrenci-numarasi-format-design.md`; şemsiye spec **E4.4.1'i süpersede eder** (yıl kaldırılır — onaylı sapma).
- Multi-tenant asla bypass edilmez (global query filter; `(SchoolId, StudentNumber)` UNIQUE korunur — K5 global benzersizlik).
- Numara **FK değil** (GUID=StudentPersonId); StudentNumber görünen/login alanı, `nullable`.
- Format: `{prefix?}{sıra}`, `length`=minimum genişlik; default null→**3 hane, 100'den başlar**, büyür.
- Mevcut öğrenci numaraları **değişmez** (immutability); renumber kapsam dışı.
- Login prefixsiz numarada length ≤9 (telefon 10-13 çakışması); prefix'te serbest.
- Commit `YYYY-MM-DD <type>: Türkçe özet.` + Co-Authored-By + Claude-Session trailer. Bugün 2026-07-01.
- Branch: `student-no-format` (api+web), master'dan.
- Hardcoded Türkçe yok (i18n); component İngilizce PascalCase.

## Dosya haritası (BE)
- `src/Oksis.Domain/Modules/Schools/Entities/SchoolSettings.cs` — `StudentNumberLength int→int?` (modify)
- `src/Oksis.Infrastructure/.../Configurations/Schools/SchoolSettingsConfiguration.cs` + migration (nullable + rows→null)
- `src/Oksis.Application/Modules/Schools/Commands/UpdateAcademicStructure/*` — null-akış (zaten int?; doğrula)
- `src/Oksis.Application/Common/Abstractions/IStudentNumberGenerator.cs` — imza (year kaldır)
- `src/Oksis.Infrastructure/Persistence/Identity/StudentNumberGenerator.cs` — settings tüket, yıl yok, 100'den (modify)
- `student_number_counters` migration — `year` kolonu düş, `(school_id)` anahtar (create)
- `src/Oksis.Application/.../Students/Services/IStudentNumberValidator.cs` (+ impl) (create)
- `src/Oksis.Application/Modules/Students/Commands/EnrollStudent/*` — opsiyonel `StudentNumber?` (modify)
- `src/Oksis.Application/Modules/Identity/Services/IdentifierResolver.cs` (+ `Identifier`?) — okul-farkında prefix dalı (modify)

## Dosya haritası (FE)
- `oksis-web/src/portals/admin/settings/tabs/StructureTab.tsx` + schema + i18n — yardım metni (modify)
- `oksis-web/src/portals/admin/students/**` enroll sihirbazı — opsiyonel "Öğrenci No" alanı (modify)

## Docs
- `.claude/specs/ogrenci-kayit-enrollment-spec.md` E4.4 amendment notu · `students/{business-rules,api-contracts,completion_status,domain-model}.md` · `schools/*` (ayar davranışı) · `academic-years` N/A.

---

## Task 0: Branch kurulumu
- [ ] **Step 1:** `cd oksis-api && git checkout master && git checkout -b student-no-format`
- [ ] **Step 2:** `cd oksis-web && git checkout master && git checkout -b student-no-format`

---

## Task 1: SchoolSettings.StudentNumberLength nullable + migration (oksis-api)
**Files:** `SchoolSettings.cs`, `SchoolSettingsConfiguration.cs`, migration, `UpdateAcademicStructureCommand{Handler,Validator}.cs`, ilgili testler.
**Interfaces:** Produces: `SchoolSettings.StudentNumberLength : int?` (null = default).
- [ ] **Step 1:** Failing test — `SchoolSettings.Create`/`UpdateAcademicStructure` `StudentNumberLength=null` kabul eder ve saklar; validator null VEYA 1-10; `null` → sonraki üretim default (3) demektir (bu handler'da değil generator'da test edilir, burada yalnız persist). Mevcut SchoolSettings testlerini şablon al.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** Entity alanını `int?` yap; factory/`UpdateAcademicStructure` null-akışı (`request.X ?? settings.X` zaten var — doğrula). EF config nullable. Migration üret: kolon `int NULL` + **mevcut satırları NULL'a çek** (`migrationBuilder.Sql("UPDATE schools.school_settings SET student_number_length = NULL")` veya EF `AlterColumn` + ayrı update). Sadece bu kolonu değiştirdiğini doğrula (drift yok).
- [ ] **Step 4:** PASS; `dotnet build`+`format`.
- [ ] **Step 5:** Commit (`2026-07-01 feat,test: SchoolSettings.StudentNumberLength nullable (null=varsayılan) + migration (mevcut satırlar null).`)

---

## Task 2: StudentNumberGenerator — settings tüket, yıl kaldır, 100'den (oksis-api)
**Files:** `IStudentNumberGenerator.cs`, `StudentNumberGenerator.cs`, counter migration, `EnrollStudentCommandHandler.cs` (çağrı), testler (Infrastructure.IntegrationTests — gerçek SQL MERGE).
**Interfaces:** Consumes: Task 1 settings. Produces: `NextAsync(Guid schoolId, CancellationToken ct)` → `{prefix}{seq}`.
- [ ] **Step 1:** Failing integration test — default (ayar null) → ilk `100`, ikinci `101`; `999` sonrası `1000`; prefix=`ATL`,length=4 → `ATL0100`; length=null → min 3 (`100`); okul-başına izole sayaç; **yıl yok** (aynı okul farklı takvim yılında ardışık devam eder). `StudentNumberGenerator` mevcut testini şablon al.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** İmzadan `year` kaldır. Handler: okul `SchoolSettings`'inden prefix+length oku (`length ?? 3`); counter tablosunu `(school_id, next_value)` MERGE'le, `NOT MATCHED → 100`, `MATCHED → +1`; çıktı `$"{prefix}{seq.ToString().PadLeft(length ?? 3, '0')}"` (≥100 başladığı için default'ta dolgu no-op; minimum semantiği). `EnrollStudentCommandHandler`: `NextAsync(schoolId.Value, ct)` (year argümanı kaldır). Counter migration: eski tabloyu `year` kolonundan arındır — **drop + recreate `(school_id PK/unique, next_value)`** (eski sayaç satırları atılır; numaralar profillerde kalıcı). Sadece counter tablosunu değiştir.
- [ ] **Step 4:** PASS (yeni + mevcut generator/enroll testleri); build+format.
- [ ] **Step 5:** Commit (`2026-07-01 feat,test: StudentNumberGenerator settings-tüketir + yılsız + 100'den (prefix/length); counter (school_id) migration.`)

---

## Task 3: IStudentNumberValidator (format + global benzersizlik) (oksis-api)
**Files:** `Students/Services/IStudentNumberValidator.cs` (+impl), DI, testler.
**Interfaces:** Consumes: Task 1 settings. Produces: `Task<Result> ValidateAsync(Guid schoolId, string candidate, CancellationToken ct)`.
- [ ] **Step 1:** Failing test — ayar boş: `100`/`0500`/`12345` kabul (rakam ≥100, min 3 hane); `99`/`12`/`ABC`/`10.5` red. Ayar prefix=`ATL`,length=4: `ATL0100` kabul, `ATL01`/`XYZ0100`/`0100` red. **Global benzersizlik:** okulda zaten var olan numara → red; başka okulunki → kabul (tenant). 
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** Impl: settings oku → format regex/pattern (`{prefix}\d{{≥length}}` veya prefixsiz `\d{{≥3}}` + değer ≥100) → uy; sonra `db.Profiles.OfType<StudentProfile>().AnyAsync(p => p.StudentNumber == candidate)` (tenant filter otomatik) → varsa red. `Result` döner. DI kaydı.
- [ ] **Step 4:** PASS; build+format.
- [ ] **Step 5:** Commit (`2026-07-01 feat,test: IStudentNumberValidator — format (ayar/varsayılan ≥100) + global benzersizlik (manuel/import için).`)

---

## Task 4: EnrollStudent opsiyonel manuel öğrenci-no (oksis-api)
**Files:** `EnrollStudentCommand.cs` (+ validator), `EnrollStudentCommandHandler.cs`, testler.
**Interfaces:** Consumes: Task 2 generator, Task 3 validator.
- [ ] **Step 1:** Failing test — komutta `StudentNumber=null` → otomatik üretilir (Task 2); `StudentNumber="100"` geçerli+benzersiz → o kullanılır; geçersiz/çakışan → `Result.Failure`/400; ilk-kayıt immutability (Person'ın numarası varsa yeniden üretmez). Mevcut EnrollStudent testini şablon al.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** Komuta `string? StudentNumber` ekle. Handler: doluysa `validator.ValidateAsync` → geçerliyse kullan, değilse fail; boşsa `generator.NextAsync`. Validator (FluentValidation) opsiyonel alan için temel biçim (boş VEYA trim'li). 
- [ ] **Step 4:** PASS; build+format.
- [ ] **Step 5:** Commit (`2026-07-01 feat,test: EnrollStudent opsiyonel manuel öğrenci-no (boş→otomatik, dolu→doğrula).`)

---

## Task 5: Login resolver okul-farkında (prefix dalı) (oksis-api)
**Files:** `IdentifierResolver.cs` (+ gerekiyorsa `Identifier.cs`), testler.
**Interfaces:** Consumes: Task 1 settings (prefix).
- [ ] **Step 1:** Failing test — SchoolHint + okul prefix=`ATL`: girdi `ATL0100` → `StudentNumber` çözülür (`FindByStudentNumberAsync("ATL0100", school)`); prefixsiz okul + `100` → StudentNumber (mevcut şekil); `5551234567` (10 hane) → telefon (öğrenci-no değil); prefix eşleşmezse şekil-tespitine düşer. Mevcut IdentifierResolver testini şablon al.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** `IdentifierResolver`e prefix-öncelikli dal: SchoolHint varsa okulun `StudentNumberPrefix`'ini oku; girdi bununla başlıyorsa `IdentifierType.StudentNumber` + `FindByStudentNumberAsync(input, school)`. Aksi halde mevcut `Identifier.Create` yolu (telefon/TCKN/e-posta/1-9 hane) **değişmez**. §6 algoritması.
- [ ] **Step 4:** PASS; build+format.
- [ ] **Step 5:** Commit (`2026-07-01 feat,test: Login resolver okul-farkında — prefix'li öğrenci-no çözümü (SchoolHint ile), prefixsiz mevcut şekil korunur.`)

---

## Task 6: FE StructureTab yardım/validasyon metni (oksis-web)
**Files:** `StructureTab.tsx`, `academicStructure.schema.ts`, i18n `school-settings` tr/en, testler.
- [ ] **Step 1:** Failing test — prefix/length alanları yardım metni "boş → varsayılan (100'den başlayan 3+ haneli)"; length placeholder "min genişlik"; schema length boş VEYA 1-10 (prefixsizken ≤9 uyarısı/validasyonu opsiyonel). Mevcut StructureTab testini şablon al.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** Yardım/placeholder metinleri + i18n anahtarları; schema mesajları. Var olan alanların davranışı korunur.
- [ ] **Step 4:** `npm run oksis:test -- StructureTab` PASS; `npm run build`.
- [ ] **Step 5:** Commit (`2026-07-01 feat,test: StructureTab öğrenci-no ayar yardım metni (boş=varsayılan 100'den; length=min genişlik).`)

---

## Task 7: FE enroll opsiyonel "Öğrenci No" alanı (oksis-web)
**Files:** enroll sihirbazı ilgili adım/parça + schema + i18n + api tipi (`StudentNumber?`), testler.
- [ ] **Step 1:** Failing test — opsiyonel "Öğrenci No" alanı render; boş → komutta gönderilmez/undefined (otomatik); dolu → komutta `studentNumber` gönderilir; BE 400 hatası (çakışma/geçersiz) toast/inline gösterilir. Mevcut enroll testini şablon al.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** Sihirbaz uygun adımına opsiyonel alan (RHF+Zod, i18n label/hint); enroll api tipine `studentNumber?: string`; boşsa payload'a koyma. `.scr-*`/enroll.css uyumlu.
- [ ] **Step 4:** `npm run oksis:test` ilgili PASS; `npm run build`.
- [ ] **Step 5:** Commit (`2026-07-01 feat,test: Enroll sihirbazı opsiyonel 'Öğrenci No' alanı (boş→otomatik, dolu→BE doğrular).`)

---

## Task 8: Dokümanlar (oksis workspace)
**Files:** `ogrenci-kayit-enrollment-spec.md` (E4.4 amendment notu), `students/{business-rules,api-contracts,domain-model,completion_status}.md`, `schools/*` (ayar davranışı).
- [ ] **Step 1:** Şemsiye spec E4.4.1'e amendment notu: format `{prefix?}{sıra}`, yılsız, default 3/100, bu mini-spec'e referans.
- [ ] **Step 2:** `students/business-rules.md` yeni **BR-students-005** (öğrenci-no format/üretim/kabul/benzersizlik/login). `api-contracts.md` `students:enroll` opsiyonel `studentNumber`. `domain-model.md` generator/validator notu.
- [ ] **Step 3:** `students/completion_status.md`: öğrenci-no borcu **kapandı** (Spec Dışına Çıkılanlar'daki 2026-06-30 kaydını "çözüldü" olarak işaretle) + ilerleme. `schools` docs ayar davranışı.
- [ ] **Step 4:** README metadata bump; commit (`2026-07-01 docs: öğrenci-no format mini-spec dokümantasyonu — E4.4 amendment, BR-students-005, borç kapanışı.`). (Workspace repo — remote VAR, push edilir.)

---

## Task 9: Chrome E2E + final review + PR
- [ ] **Step 1:** oksis-api + web `student-no-format` çalıştır; migration'ları dev DB'ye uygula.
- [ ] **Step 2:** Chrome E2E: (a) default → yeni öğrenci `100`; (b) StructureTab'da prefix=`ATL` ayarla → yeni öğrenci `ATL…`; (c) enroll'da manuel no gir → kullanılır, çakışan → hata; (d) prefix'li no ile öğrenci login. `.scr-*` stil doğrula. Console temiz (ilgisiz SignalR hariç).
- [ ] **Step 3:** Opus whole-branch final review (her iki repo) — multi-tenant, benzersizlik, login güvenliği, migration güvenliği (mevcut numaralar korunuyor mu). Bulguları düzelt.
- [ ] **Step 4:** `dotnet build/test/format` + `npm run build/oksis:test` yeşil — kanıtla.
- [ ] **Step 5:** finishing-a-development-branch: push + PR (base master) her iki repo; docs push. PR gövdesinde E4.4 amendment + DoD.

---

## Self-Review (plan ↔ spec)
- K1 yıl yok → Task 2. K2/K3 format/default → Task 2. K4 length nullable → Task 1. K5 global benzersizlik → Task 3 (index korunur). K6 doğrulama → Task 3+4. K7 login → Task 5. FE → Task 6/7. Docs/amendment → Task 8. E2E/review/PR → Task 9. ✔
- Tip tutarlılığı: `NextAsync(schoolId, ct)`, `ValidateAsync(schoolId, candidate, ct)`, `StudentNumberLength : int?`, `EnrollStudentCommand.StudentNumber : string?` tüm görevlerde tutarlı. ✔
- Placeholder yok; migration güvenliği (mevcut numaralar immutable) Task 2 + Task 9 review'da vurgulu. ✔
