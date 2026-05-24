---
description: Belirtilen OKSİS repo'sunda (oksis|oksis-api|oksis-web|oksis-mobile|all) OKSİS commit kuralına uygun commit üret ve at
argument-hint: [oksis | oksis-api | oksis-web | oksis-mobile | all]
allowed-tools: Bash(git -C:*), Bash(git status:*), Bash(git add:*), Bash(git diff:*), Bash(git log:*), Bash(git branch:*), Bash(git rev-parse:*), Bash(git commit:*), Bash(date:*), Read
---

# OKSİS Commit Oluştur

> Kanonik kurallar: `oksis/.claude/docs/git-commit-rules.md`. Aşağıdaki gövde
> committemek için gerekli tüm kuralı (format, regex, örnekler, yasaklar) içerir;
> bu komut her repo'ya birebir aynı kopyalanır.

## Bağlam

Burada **dört bağımsız git repo'su** vardır:

- `oksis` — **workspace root (anarepo)**, paylaşımlı dokümantasyonu (`.claude/docs/`,
  `CLAUDE.md`, `generated-issues/`) tutan ayrı bir git repo'sudur. Yolu = workspace
  root'un kendisi (`/Users/farukkaya/Projects/oksis`).
- `oksis-api`, `oksis-web`, `oksis-mobile` — workspace root altında sibling olarak
  duran üç bağımsız repo.

Bu komut, **argümanla verilen repo'da** commit atar. Tüm git işlemleri
`git -C <repo-yolu> ...` ile yapılır ki o anki çalışma dizini ne olursa olsun doğru
repo'da çalışılsın. Her repo **bağımsız** commit'lenir; commit'ler asla birleştirilmez.

## Görev

### 1. Hedef repo'yu belirle

`$ARGUMENTS` repo adıdır. Geçerli değerler: `oksis`, `oksis-api`, `oksis-web`,
`oksis-mobile`, `all`.

- **Repo yolları**:
  - `oksis` → workspace root'un kendisi: `/Users/farukkaya/Projects/oksis`
  - `oksis-api` / `oksis-web` / `oksis-mobile` → `/Users/farukkaya/Projects/oksis/<RepoAdı>`
  - Mutlak yolu doğrulamak için ilgili dizinde `git rev-parse --show-toplevel` çalıştırabilirsin.
- **`all`**: Dört repo'nun (`oksis`, `oksis-api`, `oksis-web`, `oksis-mobile`) **her
  birinde ayrı ayrı** commit at — bkz. aşağıdaki "`all` modu" bölümü.
- **Argüman yoksa**: o anki çalışma dizini hangi repo içindeyse onu kullan
  (`git rev-parse --show-toplevel` ile tespit et). Belirsizse kullanıcıya hangi
  repo olduğunu **sor**, uydurma.
- Geçersiz repo adı verilirse geçerli seçenekleri listele ve dur.

#### `all` modu

`/commit all` çağrıldığında dört repo'yu **sırayla** işle: `oksis` → `oksis-api`
→ `oksis-web` → `oksis-mobile`. Her repo için:

1. `git -C <repo> status --short` ile değişiklik var mı bak. **Değişiklik yoksa
   atla** ("oksis-web: değişiklik yok, atlandı" diye belirt).
2. Değişiklik varsa aşağıdaki 2–7. adımları o repo için uygula: kendi diff'ine göre
   kendi type'ı + kendi Türkçe özeti + kendi commit'i. Commit'ler **asla
   birleştirilmez** — her repo kendi mantıksal değişikliğiyle ayrı commit alır.
3. Her repo için ayrı onay iste (veya hepsinin önerilen mesajını tek seferde göster,
   topluca onay al — kullanıcı tercihine bırak).

Sonunda hangi repo'da ne commit'lendiğini / nelerin atlandığını özetle.

### 2. Durum tespiti

`git -C <repo> status` ve `git -C <repo> diff --staged` çalıştır.

- **Staged değişiklik yoksa** `git -C <repo> diff` ile unstaged değişiklikleri
  incele ve sor: "Stage edilmemiş değişiklik var — `git add` ile stage'leyeyim mi,
  yoksa sen mi stage'lemek istersin?"
- **Default branch uyarısı**: `git -C <repo> branch --show-current` ile branch'i
  kontrol et. `master`/`main` üzerindeyse kullanıcıyı uyar (kurallarda main'e
  doğrudan push yasak) ve önce feature branch açmayı öner. Yine de commit istemesi
  durumunda devam et.

### 3. Analiz et

- **Type**: `feat | fix | chore | docs | test | perf | refactor | style | ci | revert`.
  Birden fazla kategori aynı işin parçasıysa **virgülle, boşluksuz** birleştir
  (`feat,test`, `fix,test`, `refactor,docs`). İlgisiz işler için birleştirme — ayır.
- **Özet**: **Türkçe**, anlamlı + spesifik, ilk harf büyük, sonunda **nokta**,
  özet kısmı max 72 karakter. "Düzeltildi"/"Eklendi" tek başına yetersiz.
- **Issue prefix**: Değişiklik bir issue geliştirmesiyse (branch adı, bağlam veya
  `.claude/generated-issues/...` dosyası ipucu verir) başa `Issue #<no> ` ekle.
  Emin değilsen kullanıcıya sor; issue yoksa prefix kullanma.
- **Body** (opsiyonel): anlamlıysa bir boş satır sonrası ekle — "ne + neden",
  "nasıl" değil. Her satır max 72 karakter.

### 4. Tek mantıksal değişiklik kuralı

- **Bir commit = bir mantıksal değişiklik.** Diff birden fazla bağımsız iş
  içeriyorsa **parçalamayı öner**: "Bu değişiklik 2 ayrı şey içeriyor (X ve Y).
  Ayrı commit'lere böleyim mi?"
- **Bir issue = bir commit** (kesin kural). Birden fazla issue'yu tek commit'e toplama.

### 5. Mesajı üret ve onay iste

Tarihi dinamik al: `date +%Y-%m-%d`. Format:

```
[Issue #<no> ]YYYY-MM-DD <type>[,type]: Türkçe özet.

<opsiyonel body>

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
```

Önerilen mesajı göster ve onay iste: **(evet / düzelt / iptal)**.

### 6. Commit at

Onay alınca `git -C <repo> commit` ile commit'i at (çok satırlı mesaj için heredoc
veya birden fazla `-m`). `oksis-api`'deki husky `commit-msg` hook'u header satırını
şu regex ile doğrular — üretilen mesaj buna uymalı:

```
^(Issue #[0-9]+ )?[0-9]{4}-[0-9]{2}-[0-9]{2} (feat|fix|chore|docs|test|perf|refactor|style|ci|revert)(,(feat|fix|chore|docs|test|perf|refactor|style|ci|revert))*: .+\.$
```

### 7. Özetle

`git -C <repo> log -1 --stat` ile commit'i özetle.

## Örnekler (doğru format)

```
2026-05-24 feat: Öğrenci toplu import özelliği eklendi.
2026-05-24 fix,test: Yoklama eşik bildirimi düzeltildi ve regression testi eklendi.
Issue #42 2026-05-24 feat: Veli mesajlaşma ekranı eklendi.
Issue #7 2026-05-24 refactor,docs: Mark publish akışı yeniden yapılandırıldı.
```

## Yasak

- ❌ İngilizce özet (Türkçe zorunlu).
- ❌ Tarih veya tip eksikliği, nokta yok, küçük harfle başlama.
- ❌ Anlamsız özet (`fix: düzeltildi`, `feat: özellik eklendi`).
- ❌ `WIP`, `update stuff` gibi jenerik mesaj.
- ❌ Birden fazla bağımsız işi tek commit'e toplamak.
