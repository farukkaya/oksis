## Description
**(Greenfield.)** Admin **Öğretmenler** liste ekranını sıfırdan kur. Şu an hiç yok.

**Spec:** **§5** (sahiplik sınırı: mesleki kimlik + görev yükü), **§5.3** (arama/filtreler), **§5.4** (tablo kolonları).
**Mevcut durum:** `portals/admin/teachers` klasörü, `/admin/teachers` route'u, `teachers.json` i18n **yok**. Öğretmen verisi `Modules/Users/TeacherProfile` (Person, profileType=Teacher) olarak mevcut.

Repository: `farukkaya/oksis-web`
Story Points: `21`

## Scope
- Yeni `portals/admin/teachers/` (Öğrenciler ekranı desenini referans al: `portals/admin/students/`).
- `/admin/teachers` route + menü girişi (§2 menü: OKUL → Öğretmenler).
- Liste verisi: `GET /users/persons?profileType=Teacher` (Öğrenciler'deki `studentsApi` muadili `teachersApi`).
- `teachers.json` (tr/en) i18n.

## Implementation
- **Arama (§5.3):** ad / sicil no / branş.
- **Filtreler (§5.3):** Branş · Durum (aktif/izinli/ayrıldı) · Görev tipi (sınıf öğr./branş öğr./rehber) · (kapasite gelince) Yük durumu.
- **Tablo kolonları (§5.4):** Öğretmen (avatar+ad+sicil no) · Branş (çoklu badge) · Verdiği Dersler/Sınıflar (aktif sezon özeti "9-A, 9-B, +3") · Sınıf Öğretmenliği ("10-A"/"—") · **Haftalık Yük** ("24/30 saat", doluluk göstergeli — *bu ekranın imzası*) · Durum · Aksiyonlar.
- Kaynağı henüz olmayan kolonlar (Verdiği Dersler, Haftalık Yük → ISSUE-03/04) **`—`** gösterir (dürüst tasarım; Öğrenciler'deki Devamsızlık gibi).
- URL state (arama/filtre/sayfa/sıra), skeleton/empty/error durumları, server-side sayfalama — Öğrenciler ekranı standartlarıyla.

## Acceptance Criteria
- [ ] `/admin/teachers` route + menü girişi çalışıyor.
- [ ] Liste `profileType=Teacher` verisini arama+filtre+sayfalama ile gösteriyor.
- [ ] §5.4 kolon iskeleti render oluyor; kaynaksız kolonlar `—`.
- [ ] §5.3 arama (ad/sicil/branş) + filtreler (Branş/Durum/Görev tipi) çalışıyor.
- [ ] i18n tam; hardcoded Türkçe yok; `any` yok; build + vitest yeşil.

## Test Requirements
- Vitest: liste render + skeleton/empty/error; arama/filtrelerin query param + sorgu parametresi güncellemesi.

## API Notu
- `ListPersonsQuery`'nin `profileType=Teacher` + branş/sicil aramasını desteklediğini doğrula; eksikse parametre ekle.

## Dependencies
- Yok (iskelet). Kolon içeriği ISSUE-03/04'e bağlı.

## Out of Scope
- KPI (ISSUE-02), görevlendirme (ISSUE-03), aksiyonlar (ISSUE-07), detay (ISSUE-06).

## Commit Requirement (ZORUNLU)
- [ ] Yalnızca bu issue'a ait dosyalar stage edilir; başka issue karışmaz.
- [ ] OKSİS commit formatı: `Issue #<no> YYYY-MM-DD <type>[,type]: Türkçe özet.` — `.claude/docs/git-commit-rules.md`.
- [ ] Doğru repo: web → `oksis-web`, API → `oksis-api`. Workspace root'ta kod commit'i atılmaz.
- [ ] `--no-verify` YASAK; bir issue = bir commit (`feat,test`).
