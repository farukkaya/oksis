# API-5 — Migration: `school_settings` 2 yeni kolon + `school_holidays.academic_session_id`

## Description
EF Core migration: `school_settings` tablosuna `default_grade_scale_id` (FK `grade_scales`) ve `default_passing_score` kolonlarını ekle. `school_holidays` tablosuna `academic_session_id` nullable FK ekle.

## Scope
- `oksis-api/src/Oksis.Infrastructure/Persistence/Configurations/SchoolSettingsConfiguration.cs` — 2 kolon mapping (yeni property'ler için)
- `oksis-api/src/Oksis.Infrastructure/Persistence/Configurations/HolidayConfiguration.cs` — yeni FK mapping + index
- Yeni migration: `dotnet ef migrations add 20260527_add_school_settings_academic_policy_and_holiday_session --project src/Oksis.Infrastructure --startup-project src/Oksis.Api`

## Implementation

### `SchoolSettingsConfiguration` ekleri
```csharp
builder.Property(x => x.DefaultGradeScaleId);
builder.HasOne<GradeScale>()
       .WithMany()
       .HasForeignKey(x => x.DefaultGradeScaleId)
       .OnDelete(DeleteBehavior.Restrict);

builder.Property(x => x.DefaultPassingScore)
       .HasColumnType("decimal(6,2)")
       .HasDefaultValue(50m);
```

### `HolidayConfiguration` ekleri
```csharp
builder.Property(x => x.AcademicSessionId);
builder.HasOne<AcademicSession>()
       .WithMany()
       .HasForeignKey(x => x.AcademicSessionId)
       .OnDelete(DeleteBehavior.Restrict);
builder.HasIndex(x => x.AcademicSessionId)
       .HasFilter("is_deleted = 0 AND academic_session_id IS NOT NULL");
```

### Migration SQL (üretilen)
```sql
ALTER TABLE school_settings ADD default_grade_scale_id uniqueidentifier NULL;
ALTER TABLE school_settings ADD default_passing_score  decimal(6,2)     NOT NULL DEFAULT 50;
ALTER TABLE school_settings ADD CONSTRAINT fk_school_settings_grade_scales
    FOREIGN KEY (default_grade_scale_id) REFERENCES grade_scales(id);

ALTER TABLE school_holidays ADD academic_session_id uniqueidentifier NULL;
ALTER TABLE school_holidays ADD CONSTRAINT fk_school_holidays_academic_sessions
    FOREIGN KEY (academic_session_id) REFERENCES academic_sessions(id);
CREATE INDEX ix_school_holidays_session
  ON school_holidays(academic_session_id)
  WHERE is_deleted = 0 AND academic_session_id IS NOT NULL;
```

> `default_passing_score` `NOT NULL DEFAULT 50` — mevcut satırlar 50 ile backfill olur.
> `default_grade_scale_id` nullable — mevcut okullar onboarding akışında seçim yapana kadar `null`.

## Acceptance Criteria
- [ ] Migration dosyası `20260527_add_school_settings_academic_policy_and_holiday_session` adıyla oluşturuldu
- [ ] `Up()` yukarıdaki 5 ALTER + 1 CREATE INDEX'i içerir
- [ ] `Down()` her kolonu ve FK'yi reversible şekilde geri alır
- [ ] `dotnet ef migrations script` çıktısı clean (warnings yok)
- [ ] `dotnet build` yeşil
- [ ] `dotnet test tests/Oksis.Infrastructure.IntegrationTests` yeşil (mevcut tenant-isolation testleri kırılmaz)

## Test Requirements
- Integration: SQLite (veya `IClassFixture<DatabaseFixture>`) üzerinde `Migrate()` çağrısı hata vermez
- Integration: yeni okul oluştur → `default_passing_score == 50`, `default_grade_scale_id == null`

## Out of Scope
- `school_grade_levels` migration (ISSUE-6)
- `school_grade_level_scales` migration (ISSUE-7)
- Permission migration (ISSUE-8)

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
