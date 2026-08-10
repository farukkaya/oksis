# Git / Commit / PR Rules

> Branch, commit, PR ve versioning standartları. Tek tip = takım hız + temiz tarih.

---

## 1. Branch Stratejisi

**Trunk-based development** + short-lived feature branches.

\```
main                    ← her zaman deploy edilebilir, korumalı
├── feat/OKS-123-...    ← feature branch, kısa ömürlü (max 3 gün)
├── fix/OKS-456-...     ← bug fix
└── chore/OKS-789-...   ← non-feature work
\```

### Branch İsimlendirme

\```
{type}/{ticket}-{kebab-slug}
\```

| Type | Anlam |
|---|---|
| `feat` | Yeni özellik |
| `fix` | Bug fix |
| `chore` | Non-functional (refactor, doc, deps) |
| `docs` | Dokümantasyon |
| `test` | Test eklendi/düzenlendi |
| `perf` | Performance iyileştirme |
| `refactor` | Davranış değişmeden kod düzenleme |
| `style` | Format / lint (kod değişmiyor) |
| `ci` | CI/CD config |
| `revert` | Geri alma |

**Örnek:**
- `feat/OKS-123-student-bulk-import`
- `fix/OKS-456-attendance-refresh-token-bug`
- `chore/OKS-789-upgrade-react-query`

---

## 2. Commit Mesajları (OKSİS Custom Format)

OKSİS standart format **tarih + tip + özet**:

\```
YYYY-MM-DD <type>: <summary>
\```

Issue ile ilişkili commit'lerde başa `Issue #<no> ` prefix'i eklenir:

\```
Issue #<no> YYYY-MM-DD <type>: <summary>
\```

### Format Kuralları

- **Issue prefix** (opsiyonel): Commit bir GitHub/Linear issue'ya bağlıysa `Issue #<no> ` ile başlar. Issue olmayan commit'lerde kullanılmaz.
- **Tarih**: ISO 8601 (`YYYY-MM-DD`) — commit'in atıldığı gün.
- **Tip**: Aşağıdaki tip listesinden. Birden fazla kategoriyi tek commit kapsıyorsa **virgülle ayır** (boşluksuz).
- **Özet**: Türkçe, anlamlı, ne yapıldığını söyleyen. Sonunda **nokta** olur.

### Tip Listesi

`feat` · `fix` · `chore` · `docs` · `test` · `perf` · `refactor` · `style` · `ci` · `revert`

Branch isimlendirmedeki tip ile **aynı**.

### Örnekler

**Tek tip:**
\```
2025-11-15 feat: Öğrenci toplu import özelliği eklendi.
2025-11-15 fix: Refresh token logout sonrası iptal edilmiyordu, düzeltildi.
2025-11-15 chore: React Query 5.0'dan 5.4'e yükseltildi.
2025-11-15 docs: Yoklama endpoint payload açıklaması netleştirildi.
2025-11-15 test: Not yayınlama akışı integration testi eklendi.
2025-11-15 refactor: Notification recipient resolver ayrı sınıfa taşındı.
2025-11-15 perf: Dashboard agregasyonu cache'lendi.
\```

**Issue ile ilişkili commit'ler (Issue prefix zorunlu):**
\```
Issue #42 2025-11-15 feat: Öğrenci toplu import özelliği eklendi.
Issue #18 2025-11-20 fix,test: Yoklama eşik bildirimi düzeltildi ve regression testi eklendi.
Issue #7 2025-12-01 refactor,docs: Mark publish flow yeniden yapılandırıldı, dokümantasyon güncellendi.
\```

**Çoklu tip (virgülle ayrılır):**
\```
2025-11-15 feat,ci: Duyuru modülü ve deployment işlemleri tamamlandı.
2025-11-20 fix,test: Yoklama eşik bildirimi düzeltildi ve regression testi eklendi.
2025-12-01 refactor,docs: Mark publish flow yeniden yapılandırıldı, dokümantasyon güncellendi.
\```

### Subject (Özet) Kuralları

- **Türkçe** yazılır.
- **Max 72 karakter** (tarih + tip + ": " dahil değil, sadece özet kısmı).
- Özetin sonunda **nokta** bulunur.
- Anlamlı + spesifik olsun: "Düzeltildi", "Eklendi" tek başına yetersiz.
- İlk harf büyük yazılır (cümle gibi).

### Body (Opsiyonel ama Önerilir)

Subject'ten **bir boş satır** sonra başlar:

\```
2025-11-15 feat,refactor: Yoklama 3-tap mobil akışı eklendi.

Öğretmen geri bildirimi: 7-tap süreç → 3-tap'e indirildi.
- Ders programından mevcut saat otomatik seçilir.
- Tüm öğrenciler default "Present".
- Tek tıkla "Absent" / "Late" geçişi.

Refs: OKS-201
\```

- Her satır max 72 karakter.
- "Ne yapıldı + **neden**" anlatılır; "nasıl" anlatılmaz (kodu okur).

### Footer (Opsiyonel)

\```
BREAKING CHANGE: <açıklama>
Refs: OKS-123
Co-authored-by: Name <email>
\```

### Yasak Örnekler

\```
WIP                                      ← anlamsız
update stuff                             ← jenerik + tarih + tip yok
fixed bug                                ← jenerik + format yok
feat: Yeni özellik eklendi               ← tarih yok
2025-11-15: Yeni özellik                 ← tip yok
2025-11-15 feat: yeni özellik            ← küçük harfle başlamış + nokta yok
2025-11-15 feat: Yeni özellik eklendi    ← anlamsız ("ne özelliği?")
\```

---

## 3. Commit Boyutu

- **Bir commit bir mantıksal değişiklik içerir.**
  - İstisna: Birden fazla kategori aynı işin doğal parçasıysa virgülle birleştir (`feat,ci`, `feat,test`, `refactor,docs`).
  - "Refactor + new feature" gibi birbirinden bağımsız iki iş **ayrı** commit olur.
- Bir commit derlenmeli + testler geçmeli.
- "WIP" commit'leri PR'da squash edilmeli.

### Bir Issue = Bir Commit (KESİN KURAL)

> Generated issue'lar (örn. `.claude/generated-issues/<module>/issue-<no>.md`) implement edilirken **her issue için ayrı commit** atılır. Bu kural pazarlık konusu değildir.

- Bir modülün 12 issue'su varsa → **12 ayrı commit** atılır, bir tane "modülü bitirdim" commit'i değil.
- Aynı PR içinde N issue olabilir; ama her commit yalnızca **tek issue'nun dosyalarını** içerir.
- Acceptance Criteria'da tanımlı testler aynı commit'e dahildir (`feat,test`); test ayrı commit'e atılmaz.
- Commit subject'inde issue numarası prefix'i: `Issue #<no> YYYY-MM-DD <type>: Türkçe özet.`
- Her issue dosyasının sonunda zorunlu "Commit Requirement" bölümü vardır — kanonik şablon: `.claude/generated-issues/example-module-name/example-issue-1.md`.

**Anti-pattern (yasak):**

❌ Bir modülün tüm issue'larını tek commit'e toplamak:
```
2026-05-24 feat,test: Users modülü backend — domain, EF, identity altyapısı...
```

✅ Her issue ayrı commit:
```
Issue #1 2026-05-24 feat,test: User domain entity ve domain event'leri eklendi.
Issue #2 2026-05-24 feat,test: PasswordResetToken ve PasswordPolicy eklendi.
Issue #3 2026-05-24 feat: EF Core configuration ve identity initial migration eklendi.
...
```

### Çoklu Tip Ne Zaman Kullanılır?

✅ **Mantıklı birleşim**:
- `feat,ci`: Yeni modül + onun pipeline'ı
- `feat,test`: Özellik + ona ait test
- `refactor,docs`: Refactor + güncellenen dokümantasyon
- `fix,test`: Bug fix + regression testi

❌ **Yanlış birleşim**:
- `feat,fix`: Yeni özellik + ilgisiz bug fix → ayır
- `feat,refactor`: Yeni özellik + ilgisiz refactor → ayır
- `chore,feat`: Bağımsız upgrade + yeni özellik → ayır

---

## 4. PR (Pull Request) Kuralları

### PR Başlığı

Commit format'ı PR başlığında da geçerli. Issue numarası varsa `Issue #<no>` prefix'i ile:

\```
Issue #<no> YYYY-MM-DD <type>: <summary>
\```

**Örnek:**
\```
Issue #42 2025-11-15 feat: Öğrenci toplu import özelliği eklendi.
Issue #18 2025-11-18 fix,test: Refresh token expiry edge case düzeltildi.
2025-11-15 chore: React Query 5.4'e yükseltildi.
\```

### PR Açıklaması Şablonu

\```markdown
## What
Bu PR ne yapıyor?

## Why
Neden gerekli? (Ticket'ı tekrarlama, context ekle.)

## How
Yaklaşım kısaca. Mimari karar varsa belirt.

## Test
- [ ] Unit test eklendi
- [ ] Integration test eklendi
- [ ] Manuel test edildi (adım listesi)

## Screenshots (UI değişikliği varsa)

## Checklist
- [ ] `naming-conventions.md`'e uyuyor
- [ ] Tenant-safe (multi-tenant kontrolü yapıldı)
- [ ] Permission matrisi güncellendi (gerekirse)
- [ ] Notification matrisi güncellendi (gerekirse)
- [ ] Migration eklendi (gerekirse)
- [ ] Dokümantasyon güncel

Refs: OKS-XXX
\```

### PR Boyutu

- **İdeal: < 400 satır** (test hariç).
- 800+ satır → reviewer şikayet hakkı kazanır, küçük parçalara ayır.
- Feature flag ile gradual rollout daha iyi.

### PR Yaşam Döngüsü

1. **Draft PR** açılabilir (erken feedback için).
2. PR `Ready for Review` durumuna getirilince **en az 1 reviewer** atanır.
3. Reviewer 24 saat içinde dönmeli (kuralı, garanti değil).
4. Tüm comment'ler çözülmeden merge YOK.
5. **Squash and merge** default (main temiz tarih).
   - Squash commit message'ı OKSİS format'ına uymak zorunda: `YYYY-MM-DD <type>: <summary>`.
6. Merge sonrası branch otomatik silinir.

---

## 5. Code Review (Reviewer için)

- Naming, structure ve `code-review-checklist.md` üzerinden ilerle.
- "Nit:" prefix'i ile zorunlu olmayan öneri belirt.
- "Blocking:" prefix'i ile merge engelleyen öneri belirt.
- "Question:" ile öğrenme amaçlı sor.
- **Commit mesajı format'ını kontrol et** (tarih + tip + nokta + Türkçe).
- LGTM bırakırken approve butonuna bas.

---

## 6. Versioning

**Semantic Versioning** (`MAJOR.MINOR.PATCH`):

- `MAJOR`: breaking API change (post-MVP)
- `MINOR`: backwards-compatible feature
- `PATCH`: bug fix

MVP süresince `0.x` versiyonları:
- `0.1.0` = Sprint 1 sonu
- `0.2.0` = Sprint 2 sonu
- `0.3.0` = Sprint 3 sonu
- `1.0.0` = Pilot canlı

### Release Tag

\```
git tag -a v0.2.0 -m "2025-XX-XX chore: Sprint 2 operasyon modülü yayınlandı."
git push origin v0.2.0
\```

### Changelog

`CHANGELOG.md` her release için (manuel veya release-please/git-cliff ile otomatik):

\```
## [0.2.0] - 2025-XX-XX
### Added
- Yoklama 3-tap mobil akışı (OKS-201)
- Mark draft/publish akışı (OKS-202)
### Fixed
- Auth refresh token edge case (OKS-456)
\```

---

## 7. Hotfix Akışı

Production critical bug:

1. `main`'den branch: `hotfix/OKS-XXX-...`
2. Fix + test
3. PR → main (hızlı review)
4. Merge sonrası **patch version bump** + tag.
5. Develop branch kullanılmıyor; sadece main + feature.

Commit format'ı hotfix'te de aynı (issue varsa prefix ile):
\```
Issue #99 2025-12-01 fix: Production'da yoklama kaydı 500 hatası düzeltildi.
2025-12-01 fix: Production'da yoklama kaydı 500 hatası düzeltildi.
\```

---

## 8. Yasak

- ❌ `main`'e direkt push (branch protection rule).
- ❌ Force push (`--force-with-lease` istisnası: kendi feature branch'inde).
- ❌ Merge commit (squash only).
- ❌ Yarım yamalak commit (`WIP`, `update`) main'e gidemez.
- ❌ `.env`, secret, key, large binary commit etmek.
- ❌ Generated code commit etmek (migration hariç).
- ❌ Reviewer'ı atlamak (1 onay zorunlu).
- ❌ **OKSİS commit format'ından sapmak** (tarih/tip/nokta eksikliği).
- ❌ Commit özetini İngilizce yazmak (Türkçe zorunlu).
- ❌ Anlamsız özet (`fix: düzeltildi`, `feat: özellik eklendi`).

---

## 9. Hooks (pre-commit / commit-msg / pre-push)

### pre-commit
Lint + format check (husky + lint-staged frontend; `dotnet format` backend).

### commit-msg
OKSİS custom format'ı doğrulayan regex hook (commitlint default config'i **uymaz**, custom regex gerekir):

\```bash
# .husky/commit-msg
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

commit_msg=$(cat "$1" | head -n 1)
regex="^(Issue #[0-9]+ )?[0-9]{4}-[0-9]{2}-[0-9]{2} (feat|fix|chore|docs|test|perf|refactor|style|ci|revert)(,(feat|fix|chore|docs|test|perf|refactor|style|ci|revert))*: .+\.$"

if ! echo "$commit_msg" | grep -qE "$regex"; then
  echo "❌ Commit mesajı OKSİS format'ına uymuyor."
  echo ""
  echo "Beklenen format:"
  echo "  YYYY-MM-DD <type>[,type]: Türkçe özet."
  echo "  Issue #<no> YYYY-MM-DD <type>[,type]: Türkçe özet.  ← issue varsa"
  echo ""
  echo "Örnek:"
  echo "  2025-11-15 feat,ci: Duyuru modülü ve deployment işlemleri tamamlandı."
  echo "  Issue #42 2025-11-15 feat: Öğrenci toplu import özelliği eklendi."
  echo ""
  echo "Geçerli type'lar: feat, fix, chore, docs, test, perf, refactor, style, ci, revert"
  exit 1
fi
\```

Bu hook **header satırını** doğrular (ilk satır). Body opsiyonel, kontrol edilmez.

### pre-push
Hızlı test suite (opsiyonel).

\```bash
# .husky/pre-push
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"
dotnet test --filter "Category=Unit" --no-build
\```

### Kurulum

\```bash
npx husky init
chmod +x .husky/commit-msg .husky/pre-commit
git add .husky/
\```

---

## 10. /commit Slash Command (Claude Code)

Claude Code kullanıyorsanız `.claude/commands/commit.md` slash komutu OKSİS format'ı **doğrudan üretir**:

\```
> /commit
\```

Claude:
1. `git diff --staged` analiz eder.
2. Değişiklik bir issue geliştirmesiyse `Issue #<no>` prefix'i ister veya bağlam varsa otomatik ekler.
3. Bugünün tarihi + uygun tip(ler) + Türkçe özet üretir.
4. Onayını ister.
5. `git commit` atar.

Detay: `claude-code-setup/commands/commit.md`. Slash command'ın `commit-msg` hook ile birlikte çalışması önerilen yapıdır — AI doğru üretir, hook insan hatalarını yakalar.