## Description
Öğrenci yaşam döngüsü **edge-case / koruma kurallarını** UI'da uygula.

**Spec çakışması:** **§4.8** —
- Velisiz öğrenci kaydedilebilir ama **"veli eksik" uyarısı** görünür.
- Sınıf değiştirme yalnızca **aktif sezon** kaydını etkiler, geçmişi değiştirmez.
- **Mezun/nakil** öğrenci aktif tablodan düşer, filtreyle erişilir.
- **Öğrenci no** tenant + sezon bazında üretilir ve **değişmez** (ör. `202610029`).

**Mevcut durum:** Bu koruma/uyarıların hiçbiri UI'da yok ("veli eksik" uyarısı yerine boş mini-card; sınıf/mezun/nakil operasyonları zaten eksik).

Repository: `farukkaya/oksis-web`
Story Points: `8`

## Implementation
- **"Veli eksik" uyarısı:** velisi olmayan öğrenci satırında/detayında görünür rozet/uyarı (§4.8). Kayda engel değil.
- **Sınıf değiştirme aktif-sezon kuralı:** sınıf değişimi yalnız aktif sezon kaydını etkiler; geçmiş sezon kaydı değişmez (UI bunu açıkça belirtir; ISSUE-01/03 ile uyumlu).
- **Mezun/nakil düşürme:** mezun/nakil sonrası öğrenci aktif tablodan düşer, durum filtresiyle erişilir.
- **Öğrenci no değişmezliği:** öğrenci no düzenlenemez (read-only); UI hiçbir yerde değiştirme sunmaz.
- Tüm kurallar sunucu kuralının aynası; iş kuralı server-side kalır.

## Acceptance Criteria
- [ ] Velisiz öğrenci "veli eksik" uyarısı gösterir (kayda engel değil).
- [ ] Sınıf değiştirme yalnız aktif sezonu etkiliyor; UI geçmişin değişmediğini belirtiyor.
- [ ] Mezun/nakil öğrenci aktif tablodan düşüyor, filtreyle erişilebiliyor.
- [ ] Öğrenci no hiçbir formda düzenlenemiyor (read-only).
- [ ] Hardcoded Türkçe yok; `any` yok; build + vitest yeşil.

## Test Requirements
- Vitest: veli-eksik uyarısı görünürlüğü; öğrenci no alanının read-only olduğu; mezun öğrencinin aktif filtrede görünmediği.

## Dependencies
- ISSUE-01 (sezon ekseni), ISSUE-02 (veli durumu), ISSUE-03 (mezun/nakil aksiyonu) üzerine oturur.

## Out of Scope
- Yeni server iş kuralı (varsa ayrı API issue); bu issue UI guard + mevcut kuralların aynası.

## Commit Requirement (ZORUNLU)
- [ ] Yalnızca bu issue'a ait dosyalar stage edilir; başka issue karışmaz.
- [ ] OKSİS commit formatı: `Issue #<no> YYYY-MM-DD <type>[,type]: Türkçe özet.` — `.claude/docs/git-commit-rules.md`.
- [ ] Doğru repo: web → `oksis-web`. Workspace root'ta kod commit'i atılmaz.
- [ ] `--no-verify` YASAK; bir issue = bir commit (`feat,test`).
