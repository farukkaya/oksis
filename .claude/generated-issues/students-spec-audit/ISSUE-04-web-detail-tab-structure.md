## Description
Öğrenci detay drawer'ının sekme yapısını spec §4.6'ya hizala. Eksik sekmeleri ekle, spec dışı sekmeyi karara bağla.

**Spec çakışması:** **§4.6** — Detay sekmeleri: **Genel · Veliler · Akademik · Devamsızlık · Kayıt Geçmişi · Belgeler · Hesap**.
**Mevcut durum:** `StudentDetailDrawer.tsx` sekmeleri = `general · absence · marks · payments`.
- **Eksik:** **Veliler** (şu an Genel içinde read-only — ISSUE-02), **Kayıt Geçmişi** (ISSUE-01), **Belgeler**, **Hesap** (bağlı `User` köprü).
- **Spec dışı:** **Ödemeler (payments)** sekmesi §4.6 setinde yok.

Repository: `farukkaya/oksis-web`
Story Points: `13`

## Implementation
- Sekme setini §4.6'ya getir: **Genel · Veliler · Akademik · Devamsızlık · Kayıt Geçmişi · Belgeler · Hesap**.
- **Belgeler:** nüfus/nakil/sağlık vb. belge listesi + ekle (`UploadDocument`).
- **Hesap:** bağlı `User` özeti + **"Kullanıcılar'da yönet"** köprüsü (§4.6 + §3 sahiplik sınırı; giriş/güvenlik orada).
- **Akademik / Devamsızlık:** salt-okunur dış modül; kaynak gelene kadar "—" (mevcut davranış korunur, dürüst tasarım).
- **Veliler** içeriği ISSUE-02, **Kayıt Geçmişi** içeriği ISSUE-01 kapsamında; bu issue sekme **iskeletini** kurar.
- **Ödemeler sekmesi kararı:** §4.6'da yok → `mvp-guard` ile teyit. Karar: (a) kaldır/ertele, ya da (b) spec'e ekle.
  Sapma onaylanırsa `completion_status.md` "⚠️ Spec Dışına Çıkılanlar"a işle. **Bu issue kapsamında varsayılan: ertele/kaldır**, aksini kullanıcı onaylar.

## Acceptance Criteria
- [ ] Drawer sekmeleri: Genel · Veliler · Akademik · Devamsızlık · Kayıt Geçmişi · Belgeler · Hesap.
- [ ] Belgeler sekmesi liste + ekle (yükleme) iskeletiyle render olur.
- [ ] Hesap sekmesi bağlı User özeti + "Kullanıcılar'da yönet" köprüsü içerir.
- [ ] "Ödemeler" sekmesi kararı uygulandı (kaldırıldı/ertelendi veya onaylı sapma kaydedildi).
- [ ] Hardcoded Türkçe yok; `any` yok; build + vitest yeşil.

## Test Requirements
- Vitest: yedi sekmenin render'ı; Belgeler/Hesap iskelet + boş/hata; köprü href'i.

## API Notu
- `UploadDocument` (§4.9) **doğrula/üret**. Hesap köprüsü `PersonDetail.linkedAccountId`/Identity üzerinden.

## Dependencies
- ISSUE-01 (Kayıt Geçmişi) ve ISSUE-02 (Veliler) bu sekmelere içerik koyar.

## Out of Scope
- Veli CRUD mantığı (ISSUE-02); Kayıt Geçmişi verisi (ISSUE-01).

## Commit Requirement (ZORUNLU)
- [ ] Yalnızca bu issue'a ait dosyalar stage edilir; başka issue karışmaz.
- [ ] OKSİS commit formatı: `Issue #<no> YYYY-MM-DD <type>[,type]: Türkçe özet.` — `.claude/docs/git-commit-rules.md`.
- [ ] Doğru repo: web → `oksis-web`. Workspace root'ta kod commit'i atılmaz.
- [ ] `--no-verify` YASAK; bir issue = bir commit (`feat,test`).
