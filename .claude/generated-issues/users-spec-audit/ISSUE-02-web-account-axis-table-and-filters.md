## Description
Kullanıcılar tablosunu ve filtrelerini hesap eksenine hizala: **Rol(ler)** ve **Son Giriş** kolonlarını ekle, "Profiller" badge'ini **Bağlı Profil köprüsüne** çevir, filtreleri spec'e uydur.

**Spec çakışması:**
- **§3.4** (tablo kolonları): Kullanıcı (avatar + ad + e-posta/telefon) · **Rol(ler)** (çoklu badge) · **Bağlı Profil** (domain kaydına köprü: "Öğrenci · 202610029" veya "—") · Durum · **Son Giriş** (*"bu ekranın en değerli sütunu"*) · Oluşturma/Davet tarihi · Aksiyonlar.
- **§3.3** (filtreler): Rol · Durum · **Bağlı profil (var/yok)** · **Son giriş aralığı**.

**Mevcut durum:** `UsersPage.tsx` kolonları = Ad · E-posta · Telefon · Profiller(tip badge) · Durum · Oluşturma · Aksiyon. **Rol kolonu ve Son Giriş kolonu yok.** Filtreler = `profileType` (profil ekseni) + `lifecycleState`. `PersonListItem` tipinde `roleNames`/`lastLoginAt` **yok**; oysa `modules/identity/types/user.types.ts` zaten `lastLoginAt` + `roles` taşıyor.

Repository: `farukkaya/oksis-web`
Story Points: `21`

## Scope
- `UsersPage.tsx` — tablo başlıkları/hücreleri + toolbar filtreleri.
- `modules/users/types/person.types.ts` `PersonListItem` (veya hesap-ekseni liste tipi) — `roleNames`, `lastLoginAt`, `linkedProfileRef` alanları.
- Liste sorgusu/DTO hizalaması (web tarafı; API'de `ListUsers` zaten rol/son giriş taşıyorsa map'le).

## Implementation
- **Kolonlar:** `Rol(ler)` (çoklu badge), `Son Giriş` (en görünür sütun, relatif + tam tarih tooltip), `Bağlı Profil` köprü ("Öğrenci · 202610029" → domain ekranına link; yoksa "—"). Avatar + ad + e-posta/telefon tek "Kullanıcı" hücresinde.
- **Filtreler:** `Rol`, `Durum`, `Bağlı profil var/yok`, `Son giriş aralığı`. Mevcut `profileType` filtresi "Bağlı profil" faseti olarak yeniden konumlanır (tip seçimi değil var/yok ekseni).
- Liste verisini hesap-ekseni alanlarla besle (`lastLoginAt`, `roles` `identity` tiplerinde mevcut — `ListUsers` DTO'sunu doğrula, eksikse map ekle).
- URL state (filtre/sayfa/sıra) React Router search param'da kalır (mevcut desen korunur).

## Acceptance Criteria
- [ ] Tablo: Kullanıcı(avatar+ad+iletişim) · Rol(ler) · Bağlı Profil(köprü) · Durum · **Son Giriş** · Oluşturma/Davet · Aksiyon.
- [ ] "Bağlı Profil" hücresi domain kaydına yönlendiren çalışan köprü içerir (veya "—").
- [ ] Filtreler: Rol · Durum · Bağlı profil var/yok · Son giriş aralığı.
- [ ] `roleNames` + `lastLoginAt` liste tipinde mevcut ve doldurulu.
- [ ] Hardcoded Türkçe yok; `any` yok; build + vitest yeşil.

## Test Requirements
- Vitest: Rol/Son Giriş kolonlarının render'ı; Bağlı Profil köprü href'i; her filtrenin query param + sorgu parametresini güncellediği.

## API Notu
- `ListUsers` çıktısında `roles` ve `lastLoginAt` doğrula; yoksa DTO'ya ekle (oksis-api). Son giriş aralığı filtresi için server-side parametre teyidi.

## Dependencies
- ISSUE-06 sonucu "Bağlı Profil" semantiğini netleştirir (hesap→profil köprü yönü).

## Out of Scope
- Aksiyon menüsü (ISSUE-03), KPI (ISSUE-01).

## Commit Requirement (ZORUNLU)
- [ ] Yalnızca bu issue'a ait dosyalar stage edilir; başka issue karışmaz.
- [ ] OKSİS commit formatı: `Issue #<no> YYYY-MM-DD <type>[,type]: Türkçe özet.` — `.claude/docs/git-commit-rules.md`.
- [ ] Doğru repo: web → `oksis-web`. Workspace root'ta kod commit'i atılmaz.
- [ ] `--no-verify` YASAK; bir issue = bir commit (`feat,test`).
