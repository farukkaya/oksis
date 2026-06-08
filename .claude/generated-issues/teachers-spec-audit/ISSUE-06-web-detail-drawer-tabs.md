## Description
**(Greenfield.)** Öğretmen detay drawer'ını spec §5.6 sekme setiyle kur.

**Spec:** **§5.6** — Sekmeler: **Genel · Görevlendirmeler · Ders Programı (salt) · Nöbet (salt) · Sınıf Öğretmenliği · Görev Geçmişi · Belgeler · Hesap**.
**Mevcut durum:** Ekran/detay yok.

Repository: `farukkaya/oksis-web`
Story Points: `13`

## Implementation
- Detay drawer (Öğrenci `StudentDetailDrawer` deseni) sekmeleri:
  - **Genel:** kimlik, sicil no, branş(lar), işe giriş tarihi, iletişim, durum (`TeacherProfile`).
  - **Görevlendirmeler:** aktif sezon ders/sınıfları — *ekle/çıkar burada* (içerik ISSUE-03).
  - **Ders Programı:** haftalık saat-saat — **salt-okunur, Ders Programı modülünden**; modül yok → `—` (dürüst tasarım).
  - **Nöbet:** **salt-okunur, `Duties` modülünden** (mevcut).
  - **Sınıf Öğretmenliği:** sorumlu şube + öğrenci listesine köprü (içerik ISSUE-05).
  - **Görev Geçmişi:** sezon sezon verdiği dersler (`GetAssignmentHistory` — ISSUE-03).
  - **Belgeler:** diploma, sertifika, sözleşme, özlük (+ `UploadDocument`).
  - **Hesap:** bağlı `User` özeti + **"Kullanıcılar'da yönet"** köprüsü (§3 sahiplik sınırı).
- Bu issue sekme **iskeletini** kurar; Görevlendirmeler/Sınıf Öğretmenliği/Görev Geçmişi içeriği ilgili issue'lardan dolar.

## Acceptance Criteria
- [ ] Sekiz sekme render olur (skeleton/empty/error).
- [ ] Ders Programı/Nöbet salt-okunur; kaynaksız Ders Programı `—`, Nöbet `Duties`'ten beslenir.
- [ ] Belgeler liste + ekle iskeleti; Hesap "Kullanıcılar'da yönet" köprüsü.
- [ ] Hardcoded Türkçe yok; `any` yok; build + vitest yeşil.

## Test Requirements
- Vitest: sekme render + durumlar; Nöbet sekmesi Duties verisini gösterir; Hesap köprü href'i.

## API Notu
- Nöbet: `Duties` modülü read sorgusu. `UploadDocument` doğrula/üret. Ders Programı modülü yoksa sekme `—`.

## Dependencies
- ISSUE-03 (Görevlendirmeler/Görev Geçmişi), ISSUE-05 (Sınıf Öğretmenliği) içerik sağlar.

## Out of Scope
- Görevlendirme/yük mantığı (ISSUE-03/04).

## Commit Requirement (ZORUNLU)
- [ ] Yalnızca bu issue'a ait dosyalar stage edilir; başka issue karışmaz.
- [ ] OKSİS commit formatı: `Issue #<no> YYYY-MM-DD <type>[,type]: Türkçe özet.` — `.claude/docs/git-commit-rules.md`.
- [ ] Doğru repo: web → `oksis-web`. Workspace root'ta kod commit'i atılmaz.
- [ ] `--no-verify` YASAK; bir issue = bir commit (`feat,test`).
