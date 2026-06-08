## Description
Kullanıcılar ekranındaki KPI kartlarını **profil ekseninden hesap/güvenlik eksenine** çevir.

**Spec çakışması:** `.claude/specs/oksis-admin-ekranlari-mimari-spec.md` **§3.2** — KPI'lar güvenlik/hesap ekseninde olmalı: *Toplam Hesap · Aktif · Bekleyen Davet · Dikkat Gerektiren (kilitli + askıda) · (opsiyonel) 30+ gündür giriş yapmamış.*
**Mevcut durum:** `UsersPage.tsx` metric kartları = Öğrenci/Öğretmen/Veli sayısı (`usePersons({ profileType })`), yani profil/akademik eksen.

Repository: `farukkaya/oksis-web`
Story Points: `8`

## Scope
- `oksis-web/src/portals/admin/pages/users/UsersPage.tsx` — `metricCards` bloğu.
- Gerekirse yeni özet sorgusu: hesap durumlarına göre sayım (Active / Invited / Locked+Suspended).
- i18n: `users.metrics.*` anahtarlarının yeniden adlandırılması.

## Implementation
- Metrik kartlarını şu dört (+1 opsiyonel) hesap-ekseni metriğe çevir:
  - **Toplam Hesap**, **Aktif**, **Bekleyen Davet**, **Dikkat Gerektiren** (kilitli + askıda), opsiyonel **30+ gün giriş yok**.
- Kaynak: hesap-ekseni sayım endpoint'i (mevcut `ListUsers`/account status sayımları üzerinden; yoksa hafif bir `GetUserStats` doğrula/ekle — bkz. API notu).
- Profil sayıları (Öğrenci/Öğretmen/Veli) bu ekrandan kalkar; bu bilgi Öğrenciler/Öğretmenler ekranlarına aittir (§3 sahiplik sınırı).
- "Dikkat Gerektiren" kartı tıklanınca tabloyu `Durum = Kilitli/Askıda` filtresine bağla.

## Acceptance Criteria
- [ ] KPI kartları: Toplam Hesap, Aktif, Bekleyen Davet, Dikkat Gerektiren (+ ops. 30+ gün) gösterir.
- [ ] Profil-ekseni (Öğrenci/Öğretmen/Veli) sayım kartları kaldırıldı.
- [ ] "Dikkat Gerektiren" kartı ilgili durum filtresini uygular.
- [ ] Hardcoded Türkçe yok; tüm etiketler i18n.
- [ ] `any` yok; `npm run build` + vitest yeşil.

## Test Requirements
- Vitest: kartların doğru sayıları render ettiği (mock'lu), "Dikkat Gerektiren" tıklamasının filtreyi set ettiği.

## API Notu
- Hesap durumu sayımları `ListUsers` toplamlarından türetilebilir; tek çağrıda gelmiyorsa `GetUserStats` benzeri hafif query doğrula/ekle (oksis-api Identity).

## Dependencies
- ISSUE-02 (Durum filtresi) ile gevşek bağlı — "Dikkat Gerektiren" kartının filtreye bağlanması için.

## Out of Scope
- Tablo kolonları, aksiyonlar (ISSUE-02, ISSUE-03).

## Commit Requirement (ZORUNLU)
- [ ] Yalnızca bu issue'a ait dosyalar stage edilir; başka issue karışmaz.
- [ ] OKSİS commit formatı: `Issue #<no> YYYY-MM-DD <type>[,type]: Türkçe özet.` — kanonik kural `.claude/docs/git-commit-rules.md`.
- [ ] Doğru repo: web → `oksis-web`. Workspace root'ta kod commit'i atılmaz.
- [ ] `--no-verify` YASAK; bir issue = bir commit (test + implementation `feat,test`).
