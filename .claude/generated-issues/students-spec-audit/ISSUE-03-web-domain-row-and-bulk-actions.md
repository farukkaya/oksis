## Description
Öğrenci **domain operasyon aksiyonlarını** uygula. Bugün satır "…" butonu boş, toplu aksiyonlar `noop`.

**Spec çakışması:**
- **§4.5** satır (…): Detay · Düzenle · **Sınıf ata/değiştir** · **Veli bağla** · **Belge ekle** · **Nakil çıkışı** · **Mezun et** · **Kaydı dondur** · **Pasife al**. Toplu: **sınıf atama/yükseltme (yıl sonu terfi)** · dışa aktarma. *"Düzenle = akademik bilgi"*; giriş bilgisi için Kullanıcılar'a köprü.
- **§1.3** — "Pasife al" (hard-delete yok).

**Mevcut durum:** `StudentsTable.tsx` satır aksiyonları = Maximize2 (detay) + Pencil (**handler yok**) + MoreHorizontal (**handler yok, menü yok**). `StudentsSelectionBar` aksiyonları `StudentsPage.tsx`'te `noop` (yalnız export çalışıyor; `onAssignClass/onSendNotification/onDeactivate = noop`).

Repository: `farukkaya/oksis-web` (+ olası `oksis-api`)
Story Points: `21`

## Implementation
- Satır (…) menüsü: **Detay · Düzenle (akademik) · Sınıf ata/değiştir · Veli bağla · Belge ekle · Nakil çıkışı · Mezun et · Kaydı dondur · Pasife al** — her biri durum-duyarlı (ör. "Mezun et" yalnız aktif kademe sonunda; "Dondur" aktifte).
- "Düzenle" = **akademik** bilgi; giriş/şifre için "Kullanıcılar'da yönet" köprüsü (§4.5, §3 sahiplik sınırı).
- "Pasife al" soft (Deactivate/Archive); "kalıcı silme" dili yok (§1.3).
- **Toplu:** `SelectionBar` aksiyonlarını bağla — **sınıf atama**, **sınıf yükseltme (yıl sonu terfi)**, **dışa aktarma**. (`onSendNotification` spec toplu setinde yok; Bildirim modülü kapsamına bırak/işaretle.)
- Sınıf ata/transfer/terfi `AcademicSessions` (`StudentAssignedToClassRoom` / `StudentTransferred`) yetenekleriyle; mezuniyet `StudentGraduated`.

## Acceptance Criteria
- [ ] Satır (…) menüsü §4.5 aksiyon setini durum-duyarlı gösterir; boş buton kalmaz.
- [ ] "Düzenle" akademik bilgiyi düzenler; giriş için Kullanıcılar köprüsü var.
- [ ] "Pasife al" soft; hard-delete dili yok.
- [ ] Toplu sınıf atama / yıl sonu terfi / dışa aktarma çalışır (noop kalmaz).
- [ ] Mezun/nakil sonrası öğrenci aktif tablodan düşer (filtreyle erişilir) — §4.8 ile uyumlu.
- [ ] Hardcoded Türkçe yok; `any` yok; build + vitest yeşil.

## Test Requirements
- Vitest: aksiyon görünürlüğü duruma göre; toplu terfi seçili kümeye uygulanır; "Pasife al" onay akışı; mezun edilen öğrenci aktif listeden düşer.

## API Notu
- Sınıf ata/transfer/terfi/mezuniyet → `AcademicSessions` event/komutları **doğrula/bağla**. `FreezeEnrollment` / `TransferOut` / `PromoteStudents` (§4.9) eksikse üret.

## Dependencies
- ISSUE-01 (sezon ekseni) — sınıf/terfi aktif sezon kaydını hedefler.
- ISSUE-02 ("Veli bağla" aksiyonu veli akışını çağırır).

## Out of Scope
- Belgeler/Hesap sekme içerikleri (ISSUE-04).

## Commit Requirement (ZORUNLU)
- [ ] Yalnızca bu issue'a ait dosyalar stage edilir; başka issue karışmaz.
- [ ] OKSİS commit formatı: `Issue #<no> YYYY-MM-DD <type>[,type]: Türkçe özet.` — `.claude/docs/git-commit-rules.md`.
- [ ] Doğru repo: web → `oksis-web`, API → `oksis-api`. Workspace root'ta kod commit'i atılmaz.
- [ ] `--no-verify` YASAK; bir issue = bir commit (`feat,test`).
