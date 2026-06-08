## Description
**(Greenfield.)** Öğretmenler ekranına **kadro/kapasite ekseni** KPI şeridi ekle.

**Spec:** **§5.2** — *Toplam Öğretmen · Aktif Görevli · Ortalama Haftalık Yük (kapasite doluluğu %) · Branş Açığı / Dikkat.* "Branş açığı" Ders Programı modülü olgunlaşınca anlamlanır; başta "—".
**Mevcut durum:** Ekran olmadığı için KPI da yok.

Repository: `farukkaya/oksis-web` (+ olası `oksis-api`)
Story Points: `8`

## Implementation
- 4'lü KPI şeridi (Öğrenciler `StudentsKpiStrip` muadili `TeachersKpiStrip`):
  - **Toplam Öğretmen**, **Aktif Görevli**, **Ortalama Haftalık Yük** (kapasite doluluğu %), **Branş Açığı / Dikkat**.
- Kaynağı henüz olmayan metrikler (Ortalama Yük → ISSUE-04; Branş Açığı → Ders Programı modülü) **`—`** gösterir (dürüst tasarım — §5.2 açıkça "başta —" diyor).
- Sayım endpoint'i: `GetTeacherStats` (Öğrenciler'deki `GetStudentStats` muadili) doğrula/üret.

## Acceptance Criteria
- [ ] KPI şeridi: Toplam Öğretmen · Aktif Görevli · Ortalama Haftalık Yük · Branş Açığı.
- [ ] Kaynaksız metrikler `—` gösterir, "0" değil.
- [ ] Hardcoded Türkçe yok; `any` yok; build + vitest yeşil.

## Test Requirements
- Vitest: kartların sayıları/`—` durumunu doğru render ettiği (mock).

## API Notu
- `GetTeacherStats` (Toplam/Aktif Görevli) — `GetStudentStats` desenini izle. Ortalama yük ISSUE-04 (workload) hazır olunca beslenir.

## Dependencies
- ISSUE-01 (ekran iskeleti). Ortalama Yük değeri ISSUE-04'e bağlı.

## Out of Scope
- Yük hesabı (ISSUE-04).

## Commit Requirement (ZORUNLU)
- [ ] Yalnızca bu issue'a ait dosyalar stage edilir; başka issue karışmaz.
- [ ] OKSİS commit formatı: `Issue #<no> YYYY-MM-DD <type>[,type]: Türkçe özet.` — `.claude/docs/git-commit-rules.md`.
- [ ] Doğru repo: web → `oksis-web`, API → `oksis-api`. Workspace root'ta kod commit'i atılmaz.
- [ ] `--no-verify` YASAK; bir issue = bir commit (`feat,test`).
