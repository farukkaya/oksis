## Description
**(Greenfield.)** Öğretmen satır ve toplu aksiyonlarını (atama/yetkilendirme odaklı) uygula.

**Spec:** **§5.5** —
- Satır (…): Detay · Düzenle (mesleki bilgi/branş) · **Ders/sınıf görevlendir** · **Sınıf öğretmeni ata/kaldır** · **Ders programını görüntüle** (köprü) · **İzin/ayrılış işle** · **Pasife al**.
- Toplu: **sezon görevlendirme taşıma** (geçen yılı şablon olarak kopyalama) · dışa aktarma.
- **§1.3** — "Pasife al" (hard-delete yok).

**Mevcut durum:** Ekran yok → aksiyon yok.

Repository: `farukkaya/oksis-web` (+ olası `oksis-api`)
Story Points: `21`

## Implementation
- **Satır (…) menüsü:** Detay · Düzenle (mesleki/branş) · Ders/sınıf görevlendir (→ ISSUE-03) · Sınıf öğretmeni ata/kaldır (→ ISSUE-05) · Ders programını görüntüle (köprü) · İzin/ayrılış işle · Pasife al.
- "Düzenle" = **mesleki** bilgi (branş/sicil/işe giriş); giriş/şifre için "Kullanıcılar'da yönet" köprüsü.
- **İzin/ayrılış (§6.3 istihdam ekseni):** `PutOnLeave` / `ReturnFromLeave` / `Terminate`.
- "Pasife al" soft (§1.3); kalıcı silme dili yok.
- **Toplu (§5.5):** **sezon görevlendirme taşıma** = geçen sezonu şablon kopyala (`CopyAssignmentsToNewSeason`) · dışa aktarma.
- İzinle gated; mutasyon toast + invalidation.

## Acceptance Criteria
- [ ] Satır (…) menüsü §5.5 setini durum-duyarlı gösterir.
- [ ] "Düzenle" mesleki bilgiyi düzenler; giriş için Kullanıcılar köprüsü.
- [ ] İzin/ayrılış işlenebilir; "Pasife al" soft.
- [ ] Toplu sezon görevlendirme taşıma (geçen yılı kopyala) + dışa aktarma çalışır.
- [ ] Hardcoded Türkçe yok; `any` yok; build/test yeşil.

## Test Requirements
- Vitest: aksiyon görünürlüğü duruma göre; izin/ayrılış akışı; sezon kopyalama seçili kümeye uygulanır; "Pasife al" onay.

## API Notu
- `PutOnLeave`/`ReturnFromLeave`/`Terminate`/`CopyAssignmentsToNewSeason` (§5.9) doğrula/üret. Dışa aktarma `GetTeachers` filtreleriyle.

## Dependencies
- ISSUE-03 (görevlendir), ISSUE-05 (homeroom). ISSUE-01 (ekran).

## Out of Scope
- Edge-case/koruma mantığı (ISSUE-08).

## Commit Requirement (ZORUNLU)
- [ ] Yalnızca bu issue'a ait dosyalar stage edilir; başka issue karışmaz.
- [ ] OKSİS commit formatı: `Issue #<no> YYYY-MM-DD <type>[,type]: Türkçe özet.` — `.claude/docs/git-commit-rules.md`.
- [ ] Doğru repo: web → `oksis-web`, API → `oksis-api`. Workspace root'ta kod commit'i atılmaz.
- [ ] `--no-verify` YASAK; bir issue = bir commit (`feat,test`).
