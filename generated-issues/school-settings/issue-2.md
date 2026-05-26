# API-2 — Domain: `Holiday.AcademicSessionId?` opsiyonel sezon bağlantısı

## Description
`Holiday` entity'sine nullable `AcademicSessionId` ekle. BR-SS-013 geçiş dönemi: mevcut tatil kayıtları `null` olarak kalır; yeni tatiller aktif sezon varsa bağlanır.

## Scope
- `oksis-api/src/Oksis.Domain/Modules/Schools/Entities/Holiday.cs`
- `oksis-api/tests/Oksis.Domain.UnitTests/Modules/Schools/HolidayTests.cs`

## Implementation
- Yeni property: `public Guid? AcademicSessionId { get; private set; }`
- Mevcut factory metoduna (`Holiday.Create(...)`) opsiyonel parametre eklenir: `Guid? academicSessionId = null`. Geriye dönük uyumlu (default null).
- `Update(...)` davranışı varsa `academicSessionId` parametresi alır; yoksa minimal mutator eklenir: `internal void AttachToSession(Guid sessionId)` veya `Update` imzasına eklenir (handler katmanı kullanır).
- Property domain seviyesinde validate edilmez (FK kontrolü Application/Infrastructure katmanında).

## Acceptance Criteria
- [ ] `Holiday.AcademicSessionId` (`Guid?`) private setter ile eklenmiş
- [ ] `Holiday.Create(...)` opsiyonel `academicSessionId` parametresi alır; null default
- [ ] Mevcut testler (`Holiday.Create` çağıran) parametresiz çalışmaya devam eder (backward compatible)
- [ ] Yeni unit test: `Create_WithSessionId_PersistsSessionReference`
- [ ] Yeni unit test: `Create_WithoutSessionId_LeavesSessionNull`
- [ ] `Oksis.Domain` EF Core / DataAnnotations referansı yok

## Test Requirements
- `Create_WithSessionId_PersistsSessionReference`
- `Create_WithoutSessionId_LeavesSessionNull`

## Out of Scope
- FK migration (ISSUE-5)
- `ICurrentSessionProvider` ile otomatik atama (ISSUE-13)

## Commit Requirement (ZORUNLU)

> ?? Bu b�l�m her generated issue'da **aynen** yer almak zorundadir. Issue tamamlandiginda **ayri bir commit** atilmadik�a issue "Done" sayilmaz.

- [ ] Issue tamamlandiginda **yalnizca bu issue'a ait dosyalar** stage edilir (`git add <path>`); baska issue'larin degisiklikleri ayni commit'e karismaz.
- [ ] Commit, **OKSIS commit kuralina** uygun formatta atilir: `YYYY-MM-DD <type>[,type]: T�rk�e �zet.` � kanonik kural `.claude/docs/git-commit-rules.md`.
- [ ] Issue-linked commit prefix'i kullanilir: `Issue #<no> YYYY-MM-DD <type>: ...` (issue numarasi `gh issue list` veya dosya adindan alinir, �r. `issue-7.md` ? `Issue #7`).
- [ ] Commit **dogru repoda** atilir: API issue'lari ? `oksis-api`, web issue'lari ? `oksis-web`, mobile issue'lari ? `oksis-mobile`. Workspace root (`oksis/`) repo'sunda **kod commit'i atilmaz**.
- [ ] Husky `commit-msg` hook (`oksis-api`) formati zorlar; `--no-verify` **YASAK**. Hook fail olursa root cause'u d�zelt, sonra yeniden commit at � `--amend` ile ge�mis commit'i degistirme; yeni commit at.
- [ ] **Bir issue = bir commit**. Ayni issue i�inde test + implementation ayni commit'e girer (type: `feat,test`). Birden fazla issue tek commit'e birlestirilmez; "mod�l� bitirince hepsini tek commit yapayim" yaklasimi YASAK.
- [ ] Commit mesajinin body'sinde (opsiyonel) Acceptance Criteria'dan tamamlanan kalemler madde madde �zetlenebilir; uzun a�iklamalar PR description'ina birakilir.

**�rnek (tek issue commit'i):**

```
Issue #7 2026-05-24 feat,test: ChangePasswordCommand ve unit testleri eklendi.

- Mevcut parola BCrypt.Verify ile dogrulanir
- PasswordPolicy.Validate �agrisi yeni parola i�in zorunlu
- Basarili degisimde t�m refresh token'lar revoke edilir
- 3 handler testi + 1 validator testi yesil
```

**Kabul edilmeyen anti-pattern'ler:**

- ? 12 API issue'sunu tek "users mod�l� backend" commit'inde toplamak.
- ? Birden fazla repoya tek bir summary commit atmak.
- ? `update stuff` / `WIP` / T�rk�e olmayan / tarihsiz / nokta'siz mesaj.
- ? `--no-verify` veya hook bypass.
