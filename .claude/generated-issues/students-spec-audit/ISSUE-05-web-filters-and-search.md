## Description
Filtre ve aramayı spec §4.3'e tamamla.

**Spec çakışması:** **§4.3** —
- Arama: ad / öğrenci no / **veli**.
- Filtreler: Sınıf · Durum · Cinsiyet · **Seviye/Kademe** · **Veli durumu (tanımlı/eksik)** · (ileride) Devamsızlık eşiği.

**Mevcut durum:** `StudentsToolbar.tsx` filtreleri yalnız **Sınıf · Durum · Cinsiyet**. **Seviye/Kademe** ve **Veli durumu (tanımlı/eksik)** filtreleri yok. Arama (`q`, server-side `search>=2`) veli adını kapsıyor mu belirsiz.

Repository: `farukkaya/oksis-web` (+ olası `oksis-api`)
Story Points: `13`

## Implementation
- **Seviye/Kademe filtresi** ekle (sınıf seviyesi/kademe ekseni; `AcademicSessions` sınıf verisinden türetilebilir).
- **Veli durumu filtresi:** "tanımlı / eksik" — velisi olmayan öğrencileri süzer (§4.8 "veli eksik" ile uyumlu).
- Aramanın **ad + öğrenci no + veli adı**nı kapsadığını doğrula; kapsamıyorsa server `search` alanını genişlet.
- Yeni filtreler URL state + aktif filtre çiplerine (`StudentsFilterChips`) eklenir; "Devamsızlık eşiği" ileride (işaretle, kapsam dışı).

## Acceptance Criteria
- [ ] Seviye/Kademe filtresi çalışır + çip gösterir.
- [ ] Veli durumu (tanımlı/eksik) filtresi çalışır + çip gösterir.
- [ ] Arama ad/öğrenci no/veli adını kapsar (doğrulandı/genişletildi).
- [ ] Tüm filtreler URL state'te; "Tümünü temizle" hepsini sıfırlar.
- [ ] Hardcoded Türkçe yok; `any` yok; build + vitest yeşil.

## Test Requirements
- Vitest: her yeni filtrenin query param + sorgu parametresini güncellediği; veli-eksik filtresinin doğru süzdüğü; arama veli adıyla sonuç döndürdüğü (mock).

## API Notu
- `ListPersonsQuery`/`/users/persons` server tarafında `gradeLevel`/`hasGuardian` ve veli-adı aramasını destekliyor mu **doğrula**; eksikse parametre ekle.

## Dependencies
- ISSUE-01 (sezon ekseni) — Seviye/Kademe aktif sezon sınıfından gelir.

## Out of Scope
- Devamsızlık eşiği filtresi (Attendance modülü gelince).

## Commit Requirement (ZORUNLU)
- [ ] Yalnızca bu issue'a ait dosyalar stage edilir; başka issue karışmaz.
- [ ] OKSİS commit formatı: `Issue #<no> YYYY-MM-DD <type>[,type]: Türkçe özet.` — `.claude/docs/git-commit-rules.md`.
- [ ] Doğru repo: web → `oksis-web`, API → `oksis-api`. Workspace root'ta kod commit'i atılmaz.
- [ ] `--no-verify` YASAK; bir issue = bir commit (`feat,test`).
