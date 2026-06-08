## Description
**(Kök sapma.)** Öğrenci detayını **veli yönetiminin evi** hâline getir. Bugün veli salt-okunur.

**Spec çakışması:**
- **§4.7** — *"İlişki çoka-çok… `Guardian` ayrı varlık; ilişki üzerinde tip (anne/baba/vasi) ve birincil mi bilgisi taşınır. Akış: 'Veli ekle' → önce mevcut velilerde ara (kardeş zaten kayıtlıysa bağla) → yoksa yeni veli + arka planda `User` hesabı/davet."*
- **§4.1** — *"Veli burada yaşar: Ayrı veli ekranı olmadığı için veli CRUD'u Öğrenci detayının içindedir."*
- **§4.4** — Veli kolonu: *birden çok olabilir → "Zeynep Sönmez +1" / birincil veli işareti.*

**Mevcut durum:** `StudentDetailDrawer` "Genel" sekmesinde yalnızca **birincil veliyi read-only** gösteriyor (mini-card). `studentsApi.parents` salt okuma; veli telefonu bile `null` ("Phase B"). Veli **ekle/çıkar/birincil ata + kardeş arama akışı yok**. Tablo "Veli" kolonu tek veli (`primaryParentName`), çoklu veli "+1"/birincil işareti yok.

Repository: `farukkaya/oksis-web` (+ olası `oksis-api`)
Story Points: `21`

## Scope
- `StudentDetailDrawer.tsx` — ayrı **"Veliler"** sekmesi (read-only mini-card yerine tam CRUD).
- `StudentsTable.tsx` — "Veli" kolonu çoklu veli "+1" + birincil işareti.
- `api/studentsApi.ts` — veli ekle/çıkar/birincil ata + kardeş arama; veli telefonunu DTO'ya ekle.

## Implementation
- **Veliler sekmesi:** bağlı velileri (çoka-çok) listele; her satırda tip (anne/baba/vasi) + birincil işareti.
- **Veli ekle akışı (§4.7):** önce mevcut velilerde ara (kardeş zaten kayıtlıysa bağla) → yoksa yeni veli oluştur + arka planda `User` hesabı/davet (Identity invite-first ile uyumlu).
- **Veli çıkar / birincil ata** aksiyonları (`UnlinkGuardian` / `SetPrimaryGuardian`).
- Tablo "Veli" kolonu: birden çok velide "Ad Soyad +N" + birincil veli işareti.
- Veli telefonu DTO'ya eklenir (bugün `null`).
- İzinle gated; mutasyonlar toast + ilgili query invalidation.

## Acceptance Criteria
- [ ] Detayda "Veliler" sekmesi çoka-çok veli listesini tip + birincil işaretiyle gösterir.
- [ ] Veli ekle: önce mevcut arama (kardeş bağlama), yoksa yeni veli + hesap daveti.
- [ ] Veli çıkar + birincil ata çalışır + invalidation.
- [ ] Tablo "Veli" kolonu çoklu veli "+N" + birincil işareti gösterir.
- [ ] Veli telefonu listeleniyor (DTO'da mevcut).
- [ ] Hardcoded Türkçe yok; `any` yok; build + vitest yeşil.

## Test Requirements
- Vitest: kardeş-arama akışı mevcut veliyi bağlar; birincil ata tek birincil bırakır; veli çıkarma onayı; çoklu veli kolon render'ı.

## API Notu
- `LinkGuardian` / `UnlinkGuardian` / `SetPrimaryGuardian` (§4.9) **doğrula/üret** — `Modules/Students` boş; ilişki bugün `RelationshipsController` (read) üzerinden. Mevcut relationship komutları varsa bağla.
- `GET /users/students/{id}/parents` DTO'suna telefon alanı ekle.

## Dependencies
- ISSUE-04 (Veliler sekmesinin drawer sekme yapısına yerleşmesi).

## Out of Scope
- Sezon/Enrollment ekseni (ISSUE-01).

## Commit Requirement (ZORUNLU)
- [ ] Yalnızca bu issue'a ait dosyalar stage edilir; başka issue karışmaz.
- [ ] OKSİS commit formatı: `Issue #<no> YYYY-MM-DD <type>[,type]: Türkçe özet.` — `.claude/docs/git-commit-rules.md`.
- [ ] Doğru repo: web → `oksis-web`, API → `oksis-api`. Workspace root'ta kod commit'i atılmaz.
- [ ] `--no-verify` YASAK; bir issue = bir commit (`feat,test`).
