# OKSİS Commit Oluştur

> Bu dosya committemek için gerekli **tüm** kuralı içerir (format, regex, örnekler,
> yasaklar) ve üç repo'ya birebir aynı kopyalanır.
>
> **Format kaynağı: 2026-07-21 kararı** — `<type>(<scope>): türkçe açıklama`.
> `oksis/docs/documents/git-commit-rules.md` §2/§9/§10 hâlâ ESKİ formatı
> (`YYYY-MM-DD feat: Özet.`) anlatır ve **geçersizdir**; o doküman güncellenene
> kadar çatışma hâlinde **bu dosya** geçerlidir.

## Bağlam

Burada **üç bağımsız git repo'su** vardır:

- `oksis` — **workspace root (anarepo)**, paylaşımlı dokümantasyonu (`.claude/docs/`,
  `CLAUDE.md`, `docs/`, `generated-issues/`) ve bulgu defterini tutar.
- `oksis-api` — .NET backend.
- `oksis-ui` — web + mobil tek depoda.

Üçü de **kardeş dizinlerdir** (bugün `/Users/farukkaya/Repositories/` altında).
`oksis-api` ve `oksis-ui`, `oksis`'in ALTINDA değildir.

> **`oksis-web` ve `oksis-mobile` artık YOKTUR** — `oksis-ui` içinde birleştiler.
> Eski notlarda bu adlar geçerse dikkate alma.

Bu komut, **argümanla verilen repo'da** commit atar. Tüm git işlemleri
`git -C <repo-yolu> ...` ile yapılır ki o anki çalışma dizini ne olursa olsun doğru
repo'da çalışılsın. Her repo **bağımsız** commit'lenir; commit'ler asla birleştirilmez.

## Görev

### 1. Hedef repo'yu belirle

`$ARGUMENTS` repo adıdır. Geçerli değerler: `oksis`, `oksis-api`, `oksis-ui`, `all`.

**Yolu asla sabit yazma, türet:**

```bash
WS=$(dirname "$(git rev-parse --show-toplevel)")   # kardeş depoların dizini
git -C "$WS/<repo>" rev-parse --show-toplevel      # doğrula
```

- Türetme tutmazsa (ör. workspace dışından çağrıldın) kullanıcıya **sor**, uydurma.
- **Argüman yoksa**: o anki çalışma dizini hangi repo içindeyse onu kullan
  (`git rev-parse --show-toplevel`). Belirsizse **sor**.
- Argüman geçerli bir repo adı değilse (ör. serbest metin) geçerli seçenekleri
  listele ve dur — kullanıcı büyük ihtimalle başka bir şey soruyordur.

#### `all` modu

`/commit all` çağrıldığında üç repo'yu **sırayla** işle: `oksis` → `oksis-api`
→ `oksis-ui`. Her repo için:

1. `git -C <repo> status --short` ile değişiklik var mı bak. **Değişiklik yoksa
   atla** ("oksis-ui: değişiklik yok, atlandı" diye belirt).
2. Değişiklik varsa aşağıdaki 2–7. adımları o repo için uygula: kendi diff'ine göre
   kendi type'ı + kendi scope'u + kendi Türkçe açıklaması + kendi commit'i.
   Commit'ler **asla birleştirilmez**.
3. Her repo için ayrı onay iste (veya üçünün önerilen mesajını tek seferde gösterip
   topluca onay al — kullanıcı tercihine bırak).

Sonunda hangi repo'da ne commit'lendiğini / nelerin atlandığını özetle.

### 2. Durum tespiti

`git -C <repo> status` ve `git -C <repo> diff --staged` çalıştır.

- **Staged değişiklik yoksa** `git -C <repo> diff` ile unstaged değişiklikleri
  incele ve sor: "Stage edilmemiş değişiklik var — `git add` ile stage'leyeyim mi,
  yoksa sen mi stage'lemek istersin?"
- **Default branch uyarısı**: `git -C <repo> branch --show-current` ile branch'i
  kontrol et. `master`/`main` üzerindeyse kullanıcıyı uyar (main'e doğrudan push
  yasak) ve önce feature branch açmayı öner. Yine de commit istemesi durumunda
  devam et.

### 3. Analiz et

Mesajı diff'ten üret, ezberden değil.

- **Type** (tek tane): `feat | fix | chore | docs | test | perf | refactor | style | ci | revert`.
  Üç repo'nun tarihinde **virgüllü tip yoktur** — iki tip gerekiyor gibi
  hissediyorsan bu genellikle iki ayrı commit olduğunun işaretidir (bkz. adım 4).
  Özelliğe ait testler kendi commit'ine dahildir ve type `feat` kalır.
- **Scope** (zorunlu, tek kelime, küçük harf): değişikliğin modülü —
  `clubs`, `homework`, `grades`, `notifications`, `attendance`, `auth`, `web`,
  `mobile`... Depo geneli / altyapı işlerinde `repo`. `oksis` deposunda
  dokümantasyon ekseni: `defter`, `bulgular`, `kararlar`, `analiz`.
- **Açıklama**: **Türkçe**, spesifik, **küçük harfle başlar**, sonunda **nokta
  YOKTUR**. "düzeltildi" / "eklendi" tek başına yetersiz — ne düzeltildiği yazılır.
  Detay eklemek istersen ` — ` ile kısa bir açıklama kuyruğu ekleyebilirsin
  (yerleşik kalıp).
- **Uzunluk**: başlık satırı hedef ≤ 72, sert sınır **90** karakter.
- **Issue**: Numarayı **başlığa koyma**. Gövdeye `Refs: #42` satırı olarak yaz.
  "Bir issue = bir commit" kuralı geçerlidir (adım 4).
- **Body** (opsiyonel): anlamlıysa bir boş satır sonrası ekle — "ne + neden",
  "nasıl" değil. Satır başına max 72 karakter.

### 4. Tek mantıksal değişiklik kuralı

- **Bir commit = bir mantıksal değişiklik.** Diff birden fazla bağımsız iş
  içeriyorsa **parçalamayı öner**: "Bu değişiklik 2 ayrı şey içeriyor (X ve Y).
  Ayrı commit'lere böleyim mi?"
- **Bir issue = bir commit** (kesin kural). Birden fazla issue'yu tek commit'e toplama.

### 5. Mesajı üret ve onay iste

```
<type>(<scope>): türkçe açıklama

<opsiyonel body>

Co-Authored-By: Claude <Model Adı> <noreply@anthropic.com>
Claude-Session: <oturum URL'si>
```

**İmza satırı — commit'i gerçekten yazan model yazılır, sabit değil.**
Bu satırı üreten ajan **kendi model adını** kullanır (sistem bağlamındaki model
adı). Bağlam penceresi 1M ise sonuna ` (1M context)` eklenir. Tarihte geçen
gerçek varyantlar:

```
Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
```

Kendi model adından emin değilsen **sor, uydurma**.

İkinci satır oturum URL'sidir (`Claude-Session:`) — 2026-08-30 kararı; oturuma
geri dönmeyi kolaylaştırır. Tarihte 2026-08-30 öncesi commit'lerde bu satır
yoktur, aramaya kalkma. İnsan elle commit atıyorsa iki satır da konmaz.

Önerilen mesajı göster ve onay iste: **(evet / düzelt / iptal)**.

### 6. Commit at

Onay alınca `git -C <repo> commit` ile commit'i at (çok satırlı mesaj için heredoc
veya birden fazla `-m`).

Başlık satırı şu regex'e uymalıdır:

```
^(feat|fix|chore|docs|test|perf|refactor|style|ci|revert)\([a-z0-9-]+\): .+[^.]$
```

Git'in kendi ürettiği merge başlıkları (`Merge branch '...'`) bu kuralın
dışındadır; elle merge commit'i yazma.

> **Not:** Hiçbir repo'da `commit-msg` hook'u YOKTUR — bu format makine tarafından
> zorlanmaz, doğruluğu bu dosyaya bağlıdır. `oksis-api` ve `oksis-ui` yalnızca
> `.githooks/pre-push` taşır (build + hızlı birim testler; entegrasyon testleri
> bilinçli kapsam dışı). Kurulumu: `git config core.hooksPath .githooks`.

### 7. Özetle

`git -C <repo> log -1 --stat` ile commit'i özetle.

## Örnekler (gerçek tarihten)

```
feat(clubs): veli yuzu acildi — cocuk ozeti, cocugun kulupleri, tek kulup detayi
fix(clubs): katilma ucunde Add sayac kapisindan sonraya alindi
refactor(grades): degerlendirme sutunlari "yazili" yerine "sinav" adlandiriliyor
test(clubs): arama olcutu gercek SQL'de olculuyor (uc 1 ve uc 20)
docs(defter): kulup modulu kod taramasi islendi -- TB-96..TB-101, E-20
chore(repo): bugs-and-decisions altindaki gecici notlar silindi
```

## Yasak

- ❌ İngilizce açıklama (Türkçe zorunlu).
- ❌ Başlıkta tarih (`2026-05-24 feat: ...`) — eski format, terk edildi.
- ❌ Sonunda nokta.
- ❌ Büyük harfle başlayan açıklama.
- ❌ Scope'suz başlık (`feat: ...`).
- ❌ Virgüllü çoklu tip (`feat,test(clubs): ...`) — ayrı commit'lere böl.
- ❌ Anlamsız açıklama (`fix(repo): duzeltildi`), `WIP`, `update stuff`.
- ❌ Birden fazla bağımsız işi tek commit'e toplamak.
- ❌ İmza satırına sabit/yanlış model adı yazmak.
