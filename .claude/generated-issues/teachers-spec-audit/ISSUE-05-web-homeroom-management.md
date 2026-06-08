## Description
**(Kısmi temel var.)** Sınıf öğretmenliği (homeroom) atama/kaldırma yönetimini uygula.

**Spec:**
- **§5.7** — *"Sınıf öğretmenliği ders vermekten bağımsız idari atamadır: bir öğretmen 0/1 şube, bir şube tek sınıf öğretmeni."*
- **§5.8** — Sınıf öğretmeni boşalan şube **"rehbersiz"** işaretlenir.
- **§6.3** — görev ekseni (sezona bağlı).

**Mevcut durum:** Backend **kısmen hazır:** `AcademicSessions.ClassRoom.HomeroomTeacherId` + `AssignHomeroom()` + `ClassRoomHomeroomChangedEvent`. Web/atama UI ve "rehbersiz" işareti yok; öğretmen tarafından bakış (kolon/aksiyon) yok.

Repository: `farukkaya/oksis-web` (+ olası `oksis-api`)
Story Points: `13`

## Implementation
- **Web:** Öğretmen satır/detayında "Sınıf öğretmeni ata/kaldır" (§5.5) → `ClassRoom.AssignHomeroom` / kaldırma.
- **Kural:** bir öğretmen **0/1 şube**, bir şube **tek** sınıf öğretmeni (UI önden engeller; server kuralı ayna).
- Tablo "Sınıf Öğretmenliği" kolonu şube ("10-A") veya "—".
- **Rehbersiz işareti (§5.8):** sınıf öğretmeni boşalan şube "rehbersiz" rozeti (ilgili sınıf görünümünde).
- Detay "Sınıf Öğretmenliği" sekmesi: sorumlu şube + öğrenci listesine köprü (§5.6).

## Acceptance Criteria
- [ ] Sınıf öğretmeni ata/kaldır çalışır (`AssignHomeroom` / kaldırma).
- [ ] Bir öğretmen en fazla 1 şube; bir şube tek sınıf öğretmeni (UI + server).
- [ ] "Sınıf Öğretmenliği" kolonu/sekmesi doğru gösterir; şube öğrenci listesine köprü.
- [ ] Boşalan şube "rehbersiz" işaretlenir.
- [ ] Hardcoded Türkçe yok; `any` yok; build/test yeşil.

## Test Requirements
- Vitest: ata/kaldır akışı; ikinci şube atamasının engellenmesi; rehbersiz rozetin görünmesi.

## API Notu
- `SetHomeroom`/`RemoveHomeroom` (§5.9) web tüketimi — `ClassRoom.AssignHomeroom` mevcut; kaldırma + "tek öğretmen/tek şube" kuralı server tarafında doğrula/üret.

## Dependencies
- ISSUE-01 (ekran), ISSUE-06 (detay sekmesi).

## Out of Scope
- Ders görevlendirmesi (ISSUE-03) — homeroom ondan bağımsız idari atama.

## Commit Requirement (ZORUNLU)
- [ ] Yalnızca bu issue'a ait dosyalar stage edilir; başka issue karışmaz.
- [ ] OKSİS commit formatı: `Issue #<no> YYYY-MM-DD <type>[,type]: Türkçe özet.` — `.claude/docs/git-commit-rules.md`.
- [ ] Doğru repo: web → `oksis-web`, API → `oksis-api`. Workspace root'ta kod commit'i atılmaz.
- [ ] `--no-verify` YASAK; bir issue = bir commit (`feat,test`).
