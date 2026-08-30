# Git / Commit / PR Rules

> Branch, commit, PR ve versioning standartları. Tek tip = takım hız + temiz tarih.

---

## 1. Branch Stratejisi

**Trunk-based development** + short-lived feature branches.

\```
master                   ← her zaman deploy edilebilir, korumalı
├── feat/kulup-modulu    ← feature branch, kısa ömürlü (max 3 gün)
├── fix/yoklama-tekrar   ← bug fix
└── chore/deps-yukselt   ← non-feature work
\```

### Branch İsimlendirme

\```
{type}/{kebab-slug}
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

**Örnek (gerçek tarihten):**
- `feat/kulup-modulu`
- `feat/push-mobil-kopru`
- `fix/yoklama-refresh-token`

> **Ticket öneki kullanılmıyor.** Üç deponun 450+ commit'inde ve hiçbir dal
> adında `OKS-123` gibi bir ticket kimliği geçmez. Numara gerekiyorsa GitHub
> issue numarası commit gövdesine `Refs: #<no>` olarak yazılır (§2).

---

## 2. Commit Mesajları (Conventional Format)

> **2026-07-21 kararı.** Önceki `YYYY-MM-DD <type>: Özet.` formatı terk edildi:
> tarih ve sondaki nokta kaldırıldı, scope zorunlu oldu, açıklama küçük harfle
> başlar hâle geldi. Bu bölüm üç deponun (`oksis`, `oksis-api`, `oksis-ui`)
> gerçek commit tarihinden çıkarılmıştır.

OKSİS standart formatı **tip + scope + Türkçe açıklama**:

\```
<type>(<scope>): türkçe açıklama
\```

### Format Kuralları

- **Tip** (zorunlu, tek tane): aşağıdaki listeden. **Virgüllü çoklu tip yoktur** —
  üç deponun 600+ commit'inde hiç kullanılmamıştır. İki tip gerekiyor gibi
  hissediyorsan bu genellikle iki ayrı commit olduğunun işaretidir (§3).
- **Scope** (zorunlu, tek kelime, küçük harf, parantez içinde): değişikliğin
  düştüğü modül. Depo geneli / altyapı işlerinde `repo`.
- **Açıklama**: Türkçe, spesifik, sonunda **nokta yoktur**. Cümle gibi büyük
  harfle başlatılmaz; ancak özel ad, kısaltma veya bulgu/karar kimliğiyle
  başlayabilir (`TB-95`, `ENG-02`, `API`, `Faz 0` — gerçek tarihte 120 başlığın
  28'i böyledir).
- **Tarih yazılmaz** — commit'in tarihi zaten git'te durur.
- **Issue numarası başlığa girmez** — gövdeye `Refs: #42` satırı olarak yazılır.

### Tip Listesi

`feat` · `fix` · `chore` · `docs` · `test` · `perf` · `refactor` · `style` · `ci` · `revert`

Branch isimlendirmedeki tip ile **aynı**.

### Scope Listesi (yerleşik kullanım)

| Depo | Sık kullanılan scope'lar |
|---|---|
| `oksis-api` | modül adı: `clubs`, `homework`, `grades`, `notifications`, `attendance`, `auth` |
| `oksis-ui` | modül adı + platform: `homework`, `grades`, `notifications`, `web`, `mobile` |
| `oksis` | doküman ekseni: `defter`, `bulgular`, `kararlar`, `analiz` |
| hepsi | depo geneli iş: `repo` |

### Örnekler (gerçek tarihten)

\```
feat(clubs): veli yuzu acildi — cocuk ozeti, cocugun kulupleri, tek kulup detayi
fix(clubs): katilma ucunde Add sayac kapisindan sonraya alindi
refactor(grades): degerlendirme sutunlari "yazili" yerine "sinav" adlandiriliyor
test(clubs): arama olcutu gercek SQL'de olculuyor (uc 1 ve uc 20)
docs(defter): kulup modulu kod taramasi islendi -- TB-96..TB-101, E-20
chore(repo): bugs-and-decisions altindaki gecici notlar silindi
\```

### Subject (Başlık) Kuralları

- **Türkçe** yazılır.
- Hedef **≤ 72**, sert sınır **90** karakter (tip + scope dâhil). Gerçek tarihte
  medyan 61–72, maksimum 87.
- Sonunda nokta **bulunmaz**. Cümle gibi büyük harfle başlatılmaz (özel ad ve
  kimlik istisnası yukarıda).
- Anlamlı + spesifik olsun: "duzeltildi", "eklendi" tek başına yetersiz.
- Detay için ` — ` ile kısa bir açıklama kuyruğu eklenebilir (yerleşik kalıp).

### Body (Opsiyonel ama Önerilir)

Başlıktan **bir boş satır** sonra başlar:

\```
feat(attendance): 3-tap mobil yoklama akisi eklendi

Ogretmen geri bildirimi: 7-tap surec 3-tap'e indirildi.
- Ders programindan mevcut saat otomatik secilir.
- Tum ogrenciler default "Present".
- Tek tikla "Absent" / "Late" gecisi.

Refs: #201
\```

- Her satır max 72 karakter.
- "Ne yapıldı + **neden**" anlatılır; "nasıl" anlatılmaz (kodu okur).

### Footer (Opsiyonel)

\```
BREAKING CHANGE: <açıklama>
Refs: #123
\```

**Ajan imzası.** Commit'i bir Claude Code oturumu yazdıysa iki satır eklenir
(2026-08-30 kararı):

\```
Co-Authored-By: Claude <Model Adı> <noreply@anthropic.com>
Claude-Session: <oturum URL'si>
\```

Model adı **commit'i gerçekten yazan modelin** adıdır, sabit değildir; tarihte
`Claude Opus 5`, `Claude Opus 5 (1M context)`, `Claude Fable 5` varyantları
geçer. 1M bağlam penceresi etkinse sonuna ` (1M context)` eklenir.
`Claude-Session` satırı 2026-08-30 öncesi commit'lerde yoktur, aramaya kalkma.
İnsan elle commit atıyorsa iki satır da konmaz.

### Yasak Örnekler

\```
WIP                                          ← anlamsız
update stuff                                 ← jenerik, İngilizce, formatsız
2026-05-24 feat: Yeni özellik eklendi.       ← eski format (tarih + nokta)
feat: kulup modulu eklendi                   ← scope yok
feat,test(clubs): kulup ve testleri eklendi  ← virgüllü tip, ayır
fix(clubs): Duzeltildi                       ← anlamsız + cümle gibi büyük harf
fix(clubs): katilma ucu duzeltildi.          ← sonda nokta
\```

---

## 3. Commit Boyutu

- **Bir commit bir mantıksal değişiklik içerir.**
  - Özelliğe ait testler o özelliğin commit'ine dâhildir; tip `feat` kalır,
    ayrı bir `test` commit'i açılmaz.
  - "Refactor + yeni özellik" gibi birbirinden bağımsız iki iş **ayrı** commit olur.
  - İki tip gerektiğini düşünüyorsan commit'i böl — virgüllü tip yasaktır (§2).
- Bir commit derlenmeli + testler geçmeli.
- "WIP" commit'leri PR'da squash edilmeli.

### Bir Issue = Bir Commit (KESİN KURAL)

> Generated issue'lar (örn. `.claude/generated-issues/<module>/issue-<no>.md`) implement edilirken **her issue için ayrı commit** atılır. Bu kural pazarlık konusu değildir.

- Bir modülün 12 issue'su varsa → **12 ayrı commit** atılır, bir tane "modülü bitirdim" commit'i değil.
- Aynı PR içinde N issue olabilir; ama her commit yalnızca **tek issue'nun dosyalarını** içerir.
- Acceptance Criteria'da tanımlı testler aynı commit'e dâhildir.
- Issue numarası **başlığa değil gövdeye** yazılır: `Refs: #<no>`.
- Her issue dosyasının sonunda zorunlu "Commit Requirement" bölümü vardır — kanonik şablon: `.claude/generated-issues/example-module-name/example-issue-1.md`.

**Anti-pattern (yasak):**

❌ Bir modülün tüm issue'larını tek commit'e toplamak:
```
feat(users): users modulu backend — domain, EF, identity altyapisi...
```

✅ Her issue ayrı commit:
```
feat(users): user domain entity ve domain event'leri eklendi
feat(users): PasswordResetToken ve PasswordPolicy eklendi
feat(users): EF Core configuration ve identity initial migration eklendi
```

### Scope Nasıl Seçilir?

- Değişiklik tek bir modüle düşüyorsa **modül adı** (`clubs`, `grades`, ...).
- Birden fazla modüle yayılıyorsa: bu genellikle commit'in bölünmesi gerektiğinin
  işaretidir. Gerçekten ortak bir altyapı işiyse `repo`.
- Depo iskeleti, CI, araç/komut dosyaları, bağımlılık yükseltmeleri → `repo`.

---

## 4. PR (Pull Request) Kuralları

### PR Başlığı

Commit format'ı PR başlığında da geçerlidir:

\```
<type>(<scope>): türkçe açıklama
\```

**Örnek:**
\```
feat(clubs): kulup modulu backend acildi
fix(auth): refresh token expiry edge case duzeltildi
chore(repo): React Query 5.4'e yukseltildi
\```

Issue numarası başlığa girmez; PR açıklamasının `Refs:` satırına yazılır.

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

Refs: #<no>
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
5. **Squash and merge** default (master temiz tarih).
   - Squash commit message'ı OKSİS format'ına uymak zorunda: `<type>(<scope>): türkçe açıklama`.
6. Merge sonrası branch otomatik silinir.

---

## 5. Code Review (Reviewer için)

- Naming, structure ve `code-review-checklist.md` üzerinden ilerle.
- "Nit:" prefix'i ile zorunlu olmayan öneri belirt.
- "Blocking:" prefix'i ile merge engelleyen öneri belirt.
- "Question:" ile öğrenme amaçlı sor.
- **Commit mesajı format'ını kontrol et** (tip + scope + küçük harf + noktasız + Türkçe).
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
git tag -a v0.2.0 -m "chore(repo): sprint 2 operasyon modulu yayinlandi"
git push origin v0.2.0
\```

### Changelog

`CHANGELOG.md` her release için (manuel veya release-please/git-cliff ile otomatik):

\```
## [0.2.0] - 2026-XX-XX
### Added
- Yoklama 3-tap mobil akışı (#201)
- Not taslak/yayın akışı (#202)
### Fixed
- Auth refresh token edge case (#456)
\```

---

## 7. Hotfix Akışı

Production critical bug:

1. `master`'dan branch: `hotfix/<kebab-slug>`
2. Fix + test
3. PR → master (hızlı review)
4. Merge sonrası **patch version bump** + tag.
5. Develop branch kullanılmıyor; sadece master + feature.

Commit format'ı hotfix'te de aynıdır:
\```
fix(attendance): uretimde yoklama kaydi 500 hatasi duzeltildi
\```

---

## 8. Yasak

- ❌ `master`'a direkt push (branch protection rule).
- ❌ Force push (`--force-with-lease` istisnası: kendi feature branch'inde).
- ❌ Merge commit (squash only).
- ❌ Yarım yamalak commit (`WIP`, `update`) master'a gidemez.
- ❌ `.env`, secret, key, large binary commit etmek.
- ❌ Generated code commit etmek (migration hariç).
- ❌ Reviewer'ı atlamak (1 onay zorunlu).
- ❌ **OKSİS commit format'ından sapmak**: scope eksikliği, sonda nokta,
  açıklamayı cümle gibi büyük harfle başlatma, başlıkta tarih, virgüllü çoklu tip.
- ❌ Commit açıklamasını İngilizce yazmak (Türkçe zorunlu).
- ❌ Anlamsız açıklama (`fix(clubs): duzeltildi`, `feat(clubs): ozellik eklendi`).
- ❌ İmza satırına sabit / yanlış model adı yazmak (§2 · Footer).

---

## 9. Hooks (pre-commit / commit-msg / pre-push)

### pre-commit
Lint + format check (`oksis-ui` tarafında lint; `oksis-api` tarafında
`dotnet format`). Depo genelinde zorunlu bir pre-commit hook'u kurulu değildir.

### commit-msg
**Kurulu değildir.** Üç depoda da `commit-msg` hook'u YOKTUR; commit formatı
makine tarafından zorlanmaz, doğruluğu bu dokümana ve `/commit` slash
komutuna bağlıdır (§10).

Kurulmak istenirse başlık satırını doğrulayacak regex:

\```
^(feat|fix|chore|docs|test|perf|refactor|style|ci|revert)\([a-z0-9-]+\): .+[^.]$
\```

Bu regex üç deponun son 120 commit'inin 117'siyle uyuşur; uymayan üçü git'in
kendi ürettiği `Merge branch '...'` başlıkları ve iki tek seferlik sapmadır.
Git'in ürettiği merge başlıkları kural dışıdır, muaf tutulmalıdır.

Regex **büyük/küçük harfi denetlemez** — bu bilinçlidir: başlıkların yaklaşık
dörtte biri meşru olarak `TB-95` / `ENG-02` / `API` gibi bir kimlikle başlar.
Cümle gibi büyük harfle başlatmayı makine değil reviewer yakalar (§5).

> `commitlint` default config'i **uymaz** — scope zorunluluğu ve "sonda nokta
> yok" kuralı için custom regex gerekir.

### pre-push
`oksis-api` ve `oksis-ui` taşır (`.githooks/pre-push`), `oksis` taşımaz.
Kapsam bilinçli olarak dardır: build + hızlı birim testler. **Entegrasyon
testleri kapsam dışıdır** — SQL Server/ClamAV konteyneri isterler, Docker
kapalıyken kanca yanlışlıkla kırmızıya düşerdi.

\```bash
# .githooks/pre-push (oksis-api)
set -e
export PATH="$HOME/.dotnet:$PATH"
dotnet build
for p in tests/Oksis.Domain.UnitTests tests/Oksis.Application.UnitTests tests/Oksis.Api.UnitTests; do
  dotnet test "$p" --no-build
done
\```

Acil durumda: `git push --no-verify`.

### Kurulum

Hook'lar `.husky/` değil `.githooks/` altındadır ve depo başına bir kez
işaret edilmelidir:

\```bash
git config core.hooksPath .githooks
\```

---

## 10. /commit Slash Command (Claude Code)

Üç depoda da `.claude/commands/commit.md` slash komutu bu formatı **doğrudan
üretir** ve üç kopya birebir aynıdır:

\```
> /commit oksis-api
> /commit all          ← oksis → oksis-api → oksis-ui, her biri ayrı commit
\```

Claude:
1. Hedef repo'yu belirler (argüman yoksa çalışma dizininden; belirsizse sorar).
2. `git diff --staged` (yoksa `git diff`) analiz eder.
3. Diff birden fazla bağımsız iş içeriyorsa commit'i bölmeyi önerir (§3).
4. Uygun tip + scope + Türkçe açıklama üretir; issue varsa gövdeye `Refs: #<no>`.
5. İmzayı kendi model adıyla yazar (§2 · Footer).
6. Onayını ister, sonra `git commit` atar ve `git log -1 --stat` ile özetler.

Slash command bugün formatın **tek** zorlayıcısıdır — doğrulayan bir
`commit-msg` hook'u yoktur (§9). Bu yüzden `commit.md` ile bu doküman
birbiriyle tutarlı tutulmalıdır.