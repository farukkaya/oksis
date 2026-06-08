## Description
**(Greenfield.)** Öğretmen edge-case / koruma kurallarını ve çift-eksen yaşam döngüsünü uygula.

**Spec:**
- **§5.8** —
  - Branşsız öğretmen kaydedilebilir ama **"branş eksik"** uyarısı (görevlendirme yapılamaz).
  - Ders Programı'nda kullanılan görevlendirme silinmek istenince **bağımlılık uyarısı**.
  - **Aşırı yük → sert engel değil, yumuşak uyarı.**
  - **İzinli öğretmene yeni görev atanamaz.**
  - Sınıf öğretmeni boşalan şube **"rehbersiz"** işaretlenir.
- **§6.3** — Çift eksen: **İstihdam** (`İşe Alım → Aktif → İzinli ↔ Aktif → Ayrıldı`) + **Görev** (sezona bağlı `Görevsiz ↔ Görevli`). Tüm terminal durumlar **arşiv, silme değil** (§1.3).

**Mevcut durum:** Ekran/kural yok.

Repository: `farukkaya/oksis-web`
Story Points: `13`

## Implementation
- **Branş eksik:** branşsız öğretmende uyarı rozeti; görevlendirme aksiyonu disable + sebep (§5.8).
- **Görevlendirme silme bağımlılığı:** Ders Programı'nda kullanılan görevlendirme kaldırılmak istenince bağımlılık uyarısı (modül gelene kadar guard hazır, veri yoksa pasif).
- **Aşırı yük:** yumuşak uyarı (ISSUE-04 ile ortak); engel değil.
- **İzinli öğretmen:** durum "İzinli" iken yeni görev atama disable (§5.8 + §6.3 istihdam ekseni).
- **Rehbersiz şube:** ISSUE-05 ile ortak işaret.
- **Çift-eksen durum gösterimi (§6.3):** istihdam ekseni (Aktif/İzinli/Ayrıldı) + görev ekseni (Görevli/Görevsiz) ayrı ayrı; "Aktif ama Görevsiz" mümkün. Terminal durumlar arşiv (silme yok).

## Acceptance Criteria
- [ ] Branşsız öğretmen "branş eksik" uyarısı; görevlendirme disable.
- [ ] İzinli öğretmene yeni görev atanamıyor (disable + sebep).
- [ ] Aşırı yük yumuşak uyarı (engel değil).
- [ ] Kullanılan görevlendirme silmede bağımlılık uyarısı (guard mevcut).
- [ ] İstihdam + görev ekseni durumu ayrı gösteriliyor; terminal = arşiv.
- [ ] Hardcoded Türkçe yok; `any` yok; build + vitest yeşil.

## Test Requirements
- Vitest: branşsız → görevlendirme disable; izinli → atama disable; çift-eksen durum render; aşırı yük uyarısı.

## Dependencies
- ISSUE-03 (görevlendirme), ISSUE-04 (yük), ISSUE-05 (homeroom), ISSUE-07 (izin/ayrılış).

## Out of Scope
- Yeni server iş kuralı (varsa ayrı API issue); bu issue UI guard + mevcut kuralların aynası.

## Commit Requirement (ZORUNLU)
- [ ] Yalnızca bu issue'a ait dosyalar stage edilir; başka issue karışmaz.
- [ ] OKSİS commit formatı: `Issue #<no> YYYY-MM-DD <type>[,type]: Türkçe özet.` — `.claude/docs/git-commit-rules.md`.
- [ ] Doğru repo: web → `oksis-web`. Workspace root'ta kod commit'i atılmaz.
- [ ] `--no-verify` YASAK; bir issue = bir commit (`feat,test`).
