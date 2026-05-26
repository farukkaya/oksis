# API-7 — Migration + EF config: `school_grade_level_scales`

## Description
`school_grade_level_scales` junction tablosunu oluştur ve EF Core config'ini ekle. Bu tablo seviye-bazlı not skalası override'larını tutar.

## Scope
- `oksis-api/src/Oksis.Infrastructure/Persistence/Configurations/SchoolGradeLevelScaleConfiguration.cs` (yeni)
- `oksis-api/src/Oksis.Infrastructure/Persistence/ApplicationDbContext.cs` — `DbSet<SchoolGradeLevelScale> SchoolGradeLevelScales`
- Yeni migration: `20260527_add_school_grade_level_scales`

## Implementation

### EF Config
```csharp
builder.ToTable("school_grade_level_scales");
builder.HasKey(x => x.Id);
builder.Property(x => x.GradeLevelId).IsRequired();
builder.Property(x => x.GradeScaleId).IsRequired();
builder.Property(x => x.PassingScore).HasColumnType("decimal(6,2)");
builder.HasOne<School>().WithMany().HasForeignKey(x => x.SchoolId).OnDelete(DeleteBehavior.Restrict);
builder.HasOne<GradeLevel>().WithMany().HasForeignKey(x => x.GradeLevelId).OnDelete(DeleteBehavior.Restrict);
builder.HasOne<GradeScale>().WithMany().HasForeignKey(x => x.GradeScaleId).OnDelete(DeleteBehavior.Restrict);
builder.HasIndex(x => new { x.SchoolId, x.GradeLevelId })
       .IsUnique()
       .HasFilter("is_deleted = 0");
```

### Migration SQL
```sql
CREATE TABLE school_grade_level_scales (
    id uniqueidentifier NOT NULL CONSTRAINT pk_sgls PRIMARY KEY,
    school_id uniqueidentifier NOT NULL,
    grade_level_id uniqueidentifier NOT NULL,
    grade_scale_id uniqueidentifier NOT NULL,
    passing_score decimal(6,2) NULL,
    -- audit + soft-delete + row_version
    CONSTRAINT fk_sgls_schools FOREIGN KEY (school_id) REFERENCES schools(id),
    CONSTRAINT fk_sgls_grade_levels FOREIGN KEY (grade_level_id) REFERENCES grade_levels(id),
    CONSTRAINT fk_sgls_grade_scales FOREIGN KEY (grade_scale_id) REFERENCES grade_scales(id)
);
CREATE UNIQUE INDEX ux_sgls_school_grade
  ON school_grade_level_scales(school_id, grade_level_id)
  WHERE is_deleted = 0;
```

## Acceptance Criteria
- [ ] `school_grade_level_scales` tablosu migration ile oluşturulur
- [ ] Unique index `(school_id, grade_level_id) WHERE is_deleted = 0` mevcut
- [ ] 3 FK (school, grade_level, grade_scale) `OnDelete: Restrict` ile bağlı
- [ ] EF Core global tenant filter aktif
- [ ] `ApplicationDbContext.SchoolGradeLevelScales` DbSet eklendi
- [ ] Down migration reversible
- [ ] Integration test: `(SchoolId, GradeLevelId)` çift kayıt insert hatası fırlatır
- [ ] Integration test: cross-tenant okuma boş döner

## Test Requirements
- `SchoolGradeLevelScale_DuplicateSchoolGradeLevel_ThrowsDbUpdateException`
- `SchoolGradeLevelScale_Query_FilteredByTenant`

## Out of Scope
- Seed (boş başlar, admin sonradan ekler)
- `IGradeScaleResolver` (ISSUE-12)
- Endpoint (ISSUE-11, ISSUE-14)

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
