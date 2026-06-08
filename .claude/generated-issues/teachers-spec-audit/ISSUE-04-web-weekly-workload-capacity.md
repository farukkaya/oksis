## Description
**(Greenfield.)** Haftalık yük / kapasite göstergesini uygula — *"bu ekranın imzası"*.

**Spec:**
- **§5.2** — Ortalama Haftalık Yük (kapasite doluluğu %).
- **§5.4** — Haftalık Yük kolonu "24 / 30 saat", doluluk göstergeli.
- **§5.7** — Toplam yük = tüm görevlendirme saatlerinin toplamı.
- **§5.8** — Aşırı yük → sert engel değil, **yumuşak uyarı**.
- **§5.9** — `GetTeacherWorkload` sık çağrılır → sezon bazında **Redis cache**.

**Mevcut durum:** Görevlendirme olmadığı için yük kaynağı yok (ISSUE-03 gelene kadar `—`).

Repository: `farukkaya/oksis-api` + `farukkaya/oksis-web`
Story Points: `13`

## Implementation
- **API:** `GetTeacherWorkload` — öğretmenin aktif sezon görevlendirme saatleri toplamı / kapasite; sezon bazında **Redis cache** (§5.9).
- **Web:** Tablo "Haftalık Yük" kolonu "24/30 saat" + doluluk barı; KPI "Ortalama Haftalık Yük" beslenir (ISSUE-02).
- **Aşırı yük (§5.8):** kapasite aşımında **yumuşak uyarı** (renk/rozet), işlem engellenmez.

## Acceptance Criteria
- [ ] `GetTeacherWorkload` toplam saat/kapasite döner; sezon bazında cache'li.
- [ ] Tablo "Haftalık Yük" kolonu "X/Y saat" + doluluk göstergesi.
- [ ] KPI "Ortalama Haftalık Yük" gerçek değerle dolar.
- [ ] Aşırı yük yumuşak uyarı gösterir, engellemez.
- [ ] Hardcoded Türkçe yok; `any` yok; build/test yeşil.

## Test Requirements
- API: yük hesabı = görevlendirme saatleri toplamı; cache hit/miss; sezon izolasyonu.
- Web: doluluk göstergesi render; aşırı yük uyarısı.

## Dependencies
- **ISSUE-03 (TeachingAssignment)** — yük onun saatlerinden hesaplanır.
- ISSUE-01/02 (kolon + KPI yüzeyleri).

## Out of Scope
- Ders Programı çizelgesi.

## Commit Requirement (ZORUNLU)
- [ ] Yalnızca bu issue'a ait dosyalar stage edilir; başka issue karışmaz.
- [ ] OKSİS commit formatı: `Issue #<no> YYYY-MM-DD <type>[,type]: Türkçe özet.` — `.claude/docs/git-commit-rules.md`.
- [ ] Doğru repo: API → `oksis-api`, web → `oksis-web`. Workspace root'ta kod commit'i atılmaz.
- [ ] `--no-verify` YASAK; bir issue = bir commit (`feat,test`).
