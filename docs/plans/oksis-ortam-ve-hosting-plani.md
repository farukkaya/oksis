# OKSİS — Ortam, Subdomain ve Ücretsiz Hosting Planı

| | |
|---|---|
| **Sürüm** | v0.2 |
| **Tarih** | 07.10.2026 |
| **Kapsam** | Test ortamının ücretsiz altyapıda devreye alınması; prod'un hazırlık iskeleti |
| **Domain** | `oksis.net` |
| **İlgili** | [[ortamlar]] (`docs/teknik/ortamlar/ortamlar.md`) — ortam envanteri |

> [!info] v0.1 → v0.2 değişikliği
> v0.1 genel bir şablona göre yazılmıştı; 07.10.2026'da koddan ölçülüp düzeltildi.
> Ölçüm bulguları ve verilen kararlar §11'de. Özet:
> - **Prod ertelendi.** Azure SQL Free Offer bu kodla prod'u ay ortasında durdurur (§5.4).
>   Bu turda yalnız **Test** kurulur; prod ilk ücretli okulla birlikte açılır.
> - **Web tek Next.js 16 uygulamasıdır**, 3 Vite SPA değil. Yayın: Cloudflare Workers (OpenNext).
> - **Dal modeli:** `dev` → `test` → `master`; üçü de korumalı (§6).

---

## 1. Amaç

Hosting bütçesi olmadan OKSİS'in **test** ortamını devreye almak; prod için mimariyi
şimdiden aynı kalıba oturtmak. Kurgu, ilk ücretli okulla birlikte ücretli altyapıya
**mimariyi değiştirmeden** taşınabilecek şekilde tasarlanmıştır. Taşınırken yalnızca
makine ve bağlantı bilgileri değişir.

### Ortamlar

| Ortam | Veritabanı | Barındırma | Durum |
|---|---|---|---|
| Development | `oksis_dev` | Yerel (Docker MSSQL) | Var |
| Test | `oksis-test` | Bulut (ücretsiz) | **Bu turda kurulur** |
| Production | `oksis-prod` | Ücretli, tercihen yurt içi | **Ertelendi** (§9 tetikleyicileri) |

### Yayınlanacak bileşenler

| Bileşen | Kaynak | Not |
|---|---|---|
| API | `oksis-api` | .NET 10, tek imaj, ortam `ASPNETCORE_ENVIRONMENT` ile seçilir |
| Web (Merkez + Okul) | `oksis-ui/apps/web` | **Tek** Next.js 16 uygulaması; Merkez = `(platform)`, Okul = `(dashboard)` route grubu |
| Landing + Marka Profili | **Depo yok** | Ayrı iş; bu turun kapsamı dışında (§10) |

---

## 2. Subdomain Yapısı

### 2.1 Temel kural

**Ortam tire ile eklenir, alt seviye açılmaz.**

- ✅ `api-test.oksis.net`
- ❌ `api.test.oksis.net`

**Gerekçe:** Cloudflare'in ücretsiz Universal SSL sertifikası yalnızca tek seviyeyi
(`*.oksis.net`) kapsar. İki seviyeli adlar ücretli Advanced Certificate Manager ister.

### 2.2 Subdomain tablosu

| Bileşen | Prod (ertelendi) | Test |
|---|---|---|
| Landing | `oksis.net` (`www` → 301) | — |
| Marka Profili | `oksis.net/marka` | — |
| API | `api.oksis.net` | `api-test.oksis.net` |
| Merkez Platform | `merkez.oksis.net` | `merkez-test.oksis.net` |
| Okul Platformu | `okul.oksis.net` | `okul-test.oksis.net` |

Merkez ve Okul **aynı Worker'ın** iki host adıdır (§5.2); ayrı build yoktur.

### 2.3 Kararların gerekçeleri

**Marka Profili → `oksis.net/marka`**
Ayrı subdomain ayrı deploy ve SEO bölünmesi demektir. `brand.oksis.net` → `oksis.net/marka`
**301**. Landing deposu açılana kadar `brand.oksis.net` olduğu gibi kalır.

**Merkez Platform → `merkez` (`admin` değil)**
Okul tarafında da "yönetici" rolü vardır; `admin.oksis.net` bir okul müdürüne "bu benim
panelim" algısı verir. Merkez yalnız OKSİS ekibinin platform konsoludur — erişim K-27
platform rolleriyle (`PLATFORM_ADMIN` / `PLATFORM_OPERATIONS` / `PLATFORM_SUPPORT`) belirlenir.

**Okul Platformu → tek domain `okul.oksis.net`**
- Tenant çözümü login sonrası JWT claim'i üzerinden yapılır (bugünkü davranış).
- Okul bazlı subdomain (ör. `ornekkolej.oksis.net`) ileride premium "vanity domain" olabilir.

> [!warning] `app.oksis.net` çakışması — karar gerekli
> Kodda e-posta bağlantılarının ve mobil davet deep link'inin hedefi `app.oksis.net`'tir
> (`appsettings.json` → `App:BaseUrl`; mobil `app.config.ts` universal link / App Links `/invite`).
> CORS tabanında ise `app.oksis.tr` / `admin.oksis.tr` geçer. `okul.oksis.net`'e geçilirse:
> mobil derlemedeki associated domain değişir (yeni mağaza sürümü), `apple-app-site-association`
> ve `assetlinks.json` yeni host'tan sunulur. Seçenekler: (a) `okul` + mobil güncelleme,
> (b) `app.oksis.net` kalır, `okul` ona 301. **Test için** `App:BaseUrl = https://okul-test.oksis.net`
> verilir; prod kararı prod açılırken.

### 2.4 Rezerve adlar

Bugün kodda tenant slug / okul subdomain kavramı **yoktur**; bu yüzden validasyon işi yok.
Vanity domain gelirse şu adlar rezerve edilir:

```
www, api, api-test, merkez, merkez-test, okul, okul-test, app, admin,
status, docs, s3, cdn, mail, marka, brand, test, prod, staging, dev
```

### 2.5 API dokümantasyonu (Scalar)

| Ortam | Scalar | Bugünkü kod |
|---|---|---|
| Development | Açık | Açık |
| Test | Açık (`api-test.oksis.net/scalar`) | **Kapalı** — koşul `IsDevelopment()`; genişletilecek |
| Production | Kapalı | Kapalı |

Hangfire dashboard Test'te de **kapalı** kalır (yalnız dev + localhost; `Program.cs`).

---

## 3. Ortam Adlandırma

### 3.1 Backend (.NET)

| Ortam | `ASPNETCORE_ENVIRONMENT` | Ayar dosyası |
|---|---|---|
| Development | `Development` | `appsettings.Development.json` |
| Test | `Test` | `appsettings.Test.json` |
| Production | `Production` | `appsettings.json` (taban) |

> [!danger] `appsettings.Test.json` bugün kullanılamaz durumda
> Dosya var ama içinde dev değerleri ve **depoya işlenmiş gizli bilgiler** duruyor:
> localdb bağlantısı, eski simetrik `Jwt:SecretKey` (kod artık RSA `Jwt:PublicKeyPath` kullanıyor),
> `NationalIdProtection` şifreleme/hash anahtarları. Bu anahtarlar **hiçbir bulut ortamında
> kullanılmaz** (depo geçmişinde açık). Dosya yalnız gizli olmayan ayarları tutacak şekilde
> yeniden yazılır; gizli bilgiler sunucudaki env dosyasından gelir. Test/integration test
> kodu `Test` ortam adını kullanmıyor (07.10 ölçümü), çakışma yok.

### 3.2 Frontend (Next.js)

Web, API'yi tarayıcıdan doğrudan çağırmaz: istekler aynı origin'deki `/api/*`'a gider ve
`next.config.ts` `rewrites` ile API'ye proxy'lenir. Bu yüzden **CORS ve cross-site cookie
sorunu yoktur**; ortam farkı tek değişkendir:

| Ortam | `OKSIS_API_PROXY_TARGET` |
|---|---|
| Development | tanımsız → `http://localhost:5112` |
| Test | `https://api-test.oksis.net` |
| Production | `https://api.oksis.net` |

> `rewrites` hedefi build anında config'e gömülür; değişken **build ortamında** verilmelidir
> (Worker runtime env'i değil). Dilim W0'da ölçülür.

---

## 4. Hosting Mimarisi

### 4.1 Genel görünüm (Test)

```
                         ┌─────────────────────────────┐
   Kullanıcı ──────────▶ │  Cloudflare (DNS/SSL/CDN)   │
                         └──────────────┬──────────────┘
              ┌─────────────────────────┼──────────────────────────┐
              ▼                         ▼                          ▼
   ┌────────────────────┐   ┌────────────────────┐   ┌────────────────────────┐
   │ Cloudflare Workers │   │ Cloudflare Access  │   │ Cloudflare Tunnel      │
   │ (OpenNext)         │◀──│ yalnız merkez-test │   │ api-test               │
   │ merkez-test /      │   │ ve okul-test       │   └───────────┬────────────┘
   │ okul-test          │──── /api/* proxy ───────────────────▶ │
   └────────────────────┘                                        ▼
                                          ┌──────────────────────────────────────┐
                                          │ Oracle Cloud Always Free (ARM VM)    │
                                          │ docker compose:                      │
                                          │  api-test · redis · garage ·         │
                                          │  clamav · seq · cloudflared          │
                                          └───────────────────┬──────────────────┘
                                                              ▼
                                          ┌──────────────────────────────────────┐
                                          │ Azure SQL Database (Free Offer)      │
                                          │  oksis-test                          │
                                          └──────────────────────────────────────┘
```

### 4.2 Bileşen – sağlayıcı eşlemesi

| Katman | Sağlayıcı | Plan |
|---|---|---|
| DNS, SSL, CDN | Cloudflare | Free |
| Web (Next.js) | Cloudflare Workers + `@opennextjs/cloudflare` | Free (sınırlar §5.2 — W0'da ölçülür) |
| Test web erişim koruması | Cloudflare Access (Zero Trust) | Free (50 kullanıcıya kadar) |
| API + Redis + Garage + ClamAV + Seq | Oracle Cloud | Always Free (ARM A1) |
| Dışa açılım | Cloudflare Tunnel | Free |
| Veritabanı | Azure SQL Database | Free Offer (yalnız Test) |
| E-posta | {{TBD}} — ücretsiz SMTP katmanı (ör. Brevo/Resend) | Free |
| Push | Firebase `oksis-dev` | Free |
| CI/CD | GitHub Actions + GHCR | Free |
| Log | Seq (aynı VM, container) | Free (tek kullanıcı) |

---

## 5. Bileşen Detayları

### 5.1 DNS → Cloudflare Free

1. `oksis.net` Cloudflare'e eklenir.
2. Domain kayıt firmasında nameserver'lar Cloudflare'inkilerle değiştirilir.
3. SSL modu **Full (strict)**.
4. Taşımadan önce mevcut kayıtlar (özellikle `brand.oksis.net` ve varsa MX) dışa aktarılıp
   Cloudflare'de birebir yeniden kurulur — yoksa marka sayfası ve e-posta kesilir.

### 5.2 Web → Cloudflare Workers (OpenNext)

`apps/web` tek bir Next.js 16 uygulamasıdır (SSR + `rewrites`). Statik export (`output: "export"`)
`rewrites`'ı desteklemediği için Cloudflare Pages statik yayını **kullanılmaz**.
`@opennextjs/cloudflare` adaptörü uygulamayı Node.js runtime'ıyla Worker olarak çalıştırır;
`/api/*` proxy'si aynen korunur.

| Worker | Kaynak dal | Host adları |
|---|---|---|
| `oksis-web-test` | `test` | `merkez-test.oksis.net`, `okul-test.oksis.net` |
| `oksis-web` (ertelendi) | `master` | `merkez.oksis.net`, `okul.oksis.net` |

**Host → yüzey ayrımı:** Bugün tek uygulama her iki yüzeyi de aynı host'tan sunar. İlk sürümde
iki host da aynı uygulamayı açar (kabul edilebilir). Ayrımı kesinleştirmek — `merkez-*`'de
yalnız `(platform)`, `okul-*`'da yalnız `(dashboard)` — Next `proxy.ts` ile host bazlı
yönlendirme işidir; ayrı dilim (W2).

> [!warning] Workers Free sınırları — W0 ölçümü olmadan devam edilmez
> - Worker boyutu: **3 MiB (sıkıştırılmış)** Free planda. Next uygulamaları bu sınırı sıkça aşar.
> - CPU: istek başına **10 ms** Free planda. SSR sayfaları bunu aşabilir (1102 hatası).
> - Günde 100.000 istek; istek başına 50 alt istek.
>
> W0'da `opennextjs-cloudflare build` çıktısı ölçülür ve tipik sayfalar `wrangler` ile denenir.
> Sınır aşılırsa yedek: **Next standalone container'ı aynı Oracle VM'de** çalıştırmak
> (Tunnel arkasında; mimari ve domain'ler değişmez). Workers Paid ($5/ay) üçüncü seçenektir.

**Test ortamı koruması:** `merkez-test` ve `okul-test` Cloudflare Access arkasına alınır
(izinli e-posta listesi). `api-test` Access arkasına **alınmaz**: mobil uygulamanın kullanması
gerekir ve uygulamaya gömülen bir Service Token sızmış sayılır. API zaten JWT ile korunur;
login uçlarında rate limiting var (TB-169).

### 5.3 API → Oracle Cloud Always Free + Cloudflare Tunnel

**Kaynak limiti (2026):** Ampere A1 Always Free kotası **2 OCPU / 12 GB RAM**. Eski
rehberlerdeki "4 OCPU / 24 GB" artık geçerli değildir. Kota aşılırsa instance kapatılır.

**Önerilen VM:** `VM.Standard.A1.Flex`, 2 OCPU, 12 GB RAM, Ubuntu 24.04 aarch64, Frankfurt.

**docker compose servisleri (Test):**

| Servis | Açıklama | `mem_limit` (öneri) |
|---|---|---|
| `api-test` | `ASPNETCORE_ENVIRONMENT=Test`; gizli ayarlar `secrets/api/` → `OKSIS_SECRETS_DIR` (salt-okunur mount) | 2g |
| `redis` | Cache, oturum/izin deposu, rate limit | 512m |
| `garage` | S3 uyumlu object storage (okul başına bucket) | 512m |
| `clamav` | Yükleme virüs taraması (v0.1'de eksikti); arm64 için `clamav/clamav-debian` (`TB-274`) | 1.5g |
| `seq` | Log | 1g |
| `cloudflared` | Tunnel istemcisi | 128m |

Prod açıldığında aynı dosyaya `api-prod` (3g) eklenir; RAM bütçesi ~9 GB ile sığar.

**Cloudflare Tunnel ingress:**

| Hostname | Hedef |
|---|---|
| `api-test.oksis.net` | `http://api-test:8080` |
| `s3-test.oksis.net` | `http://garage:3900` (imzalı dosya adresleri; anahtarsız erişim yok) |

- VM'de **80/443 dışarı açılmaz**; yalnız SSH (anahtar ile) açık.
- SignalR (`/hubs/session`, `/hubs/notifications`) WebSocket'leri tunnel üzerinden çalışır.
- Mevcut `Dockerfile` multi-arch taban imaj kullanır; GitHub Actions'ta `buildx` ile
  `linux/arm64` build edilir, GHCR'ye itilir, VM'de çekilir. `Dockerfile`'daki
  `ASPNETCORE_ENVIRONMENT=Production` compose'da `Test` ile ezilir.
- TLS tunnel'da biter; API `UseHttpsRedirection` kullandığı için forwarded headers
  (`X-Forwarded-Proto`) yapılandırılır — yoksa yönlendirme döngüsü olur.

### 5.4 Veritabanı → Azure SQL Database Free Offer (yalnız Test)

**Limitler:** abonelik başına 10 ücretsiz DB; DB başına aylık **100.000 vCore saniyesi**
serverless; 32 GB veri; kota her ay yenilenir.

**Yapılandırma:**
- `oksis-test`, bölge **Germany West Central**
- Limit dolunca: **Auto-pause until next month**
- Alarm: "Free amount remaining" < 10.000 vCore saniyesi → e-posta

> [!danger] Bu kod Azure Free kotasını birkaç günde bitirir — prod'un ertelenme nedeni
> 0,5 vCore'la 100.000 vCore-sn ≈ **ayda 55 saat** uyanıklık. Serverless DB ancak en az
> 1 saat hiç sorgu gelmezse duraklar. Kodda veritabanını doğrudan sorgulayan sık işler var
> (`HangfireSetup.cs`):
> - `PublishScheduledAnnouncementsJob` — **her dakika**
> - `AttendanceReminderJob` — **her 5 dakika**
> - `HomeworkDueReminderJob` — saatlik
>
> Hangfire storage'ı Redis'e taşımak bunu **çözmez**; işin kendisi DB'ye gider. Ayrıca gerçek
> kullanımda okul saatleri tek başına ayda ~170 saattir. Sonuç: Free Offer prod için uygun
> değil; Test için yalnız aşağıdaki önlemlerle.
>
> SQL Server'ın ARM64 Linux imajı yoktur (Azure SQL Edge emekli). Veritabanı Oracle VM'ine
> taşınamaz.

**Test için önlemler:**

| Risk | Önlem |
|---|---|
| Sık recurring job'lar DB'yi hep uyanık tutar | Test'te `Hangfire:Enabled = false` (varsayılan). Job testi gerektiğinde geçici açılır, test bitince kapatılır |
| Hangfire SQL storage polling (15 sn) | Job'lar kapalıyken Hangfire hiç kurulmaz — ek iş yok. Redis storage'a geçiş **prod işi**, bu turda yapılmaz |
| `/health/ready` DB'yi sorgular | Zaten ayrık: `/health/live` DB'ye dokunmaz (`Predicate = _ => false`). Docker healthcheck ve dış izleme **yalnız** `/health/live` kullanır |
| Uyanma (cold start) saniyeler–1 dk | `EnableRetryOnFailure` **doğrudan açılamaz**: retrying execution strategy, kullanıcı başlatmalı transaction'larla (`BeginTransaction`) çalışmaz. Önce kullanım yerleri taranır; ya `CreateExecutionStrategy().ExecuteAsync` ile sarılır ya da yalnız bağlantı açılışına `Connect Timeout=60` + `ConnectRetryCount` verilir. Eşik gerçek uyanmada ölçülür |
| Her startup'ta location seed DB'yi uyandırır | Kabul — yalnız deploy anında |

### 5.5 Loglama

Elasticsearch + Kibana VM'de RAM'in yarısını tüketir. Test'te:

- Serilog → **Seq** (aynı VM, container; tek kullanıcı ücretsiz). `Serilog.Sinks.Seq` eklenir;
  sink seçimi config'den yapılır, `Elasticsearch` sink'i korunur.
- Seq UI dışarı açılmaz; SSH tüneliyle erişilir.
- Correlation ID ve structured logging standardı aynen korunur.

---

## 6. Dal Modeli ve Deploy Akışı

### 6.1 Dallar (karar: 07.10.2026)

`oksis-api` ve `oksis-ui` depolarında üç kalıcı dal vardır; üçü de **korumalı**
(silinemez, force-push yasak):

| Dal | Rolü | Ortam | Kim günceller |
|---|---|---|---|
| `dev` | Geliştirmenin birleştiği dal; feature dalları buraya girer | — (test koşmaz) | Geliştirme akışı |
| `test` | Geliştirmesi tamamlanan iş buraya push edilir | **Test** — otomatik deploy | Geliştirme tamamlanınca |
| `master` | Kontrolleri biten iş | Prod (ertelendi) | **Yalnız kullanıcı onayıyla** merge |

```
feature/* ──▶ dev ──(geliştirme tamam)──▶ test ──(kontroller tamam + onay)──▶ master
                                            │                                  │
                                            ▼                                  ▼
                                      Test deploy                        Prod deploy
                                      (otomatik)                    (ertelendi; tag + onay)
```

**Koruma kuralları (GitHub branch protection / ruleset):**
- `dev`, `test`, `master`: silme yasak, force-push yasak.
- `master`: doğrudan push yasak; yalnız PR ile, **kullanıcı onayı (review) zorunlu**,
  `test` CI'ı yeşil olmalı.
- `test`: CI yeşil olmadan deploy işi koşmaz.
- **Testler yalnız `test` ve `master` push'unda otomatik koşar** (karar 07.10.2026) — hem yerel
  pre-push kancası hem CI. `dev` ve feature push'ları testsiz ve hızlıdır.

> Mevcut `04-reviewer.yml` `oksis-test` / `oksis-preprod` dal adlarını dinliyor; bu dallar yok.
> Yeni dal adlarına (`test`, `master`) güncellenir ya da iş akışı kaldırılır (depoda olmayan
> `.github/scripts/`'i çağırıyor, bugün zaten çalışmıyor).

### 6.2 API pipeline

```
dev push      → (CI yok)

test push     → build & birim testler + bekçiler + entegrasyon
              → docker buildx (linux/arm64) → GHCR (tag: test-<sha>)
              → EF migration bundle → oksis-test
              → SSH → VM: docker compose pull api-test && up -d api-test
              → duman testi: GET https://api-test.oksis.net/health/live

master (ertelendi)
              → tag v0.x.y → build → GHCR (v0.x.y)
              → [GitHub Environments: manuel onay]
              → EF migration bundle → oksis-prod → deploy
```

**Kurallar:**
- Prod'a migration **asla otomatik** gitmez.
- Migration'lar geriye dönük uyumlu yazılır (önce kolon ekle, sonra kod, en son eski kolonu kaldır).
- Prod deploy öncesi `oksis-prod` için point-in-time restore noktası not edilir.
- Test DB'sine migration otomatik gider (bugün API kendi migrate etmez; bundle bu açığı kapatır).

### 6.3 Web pipeline

`test` push → GitHub Actions: `opennextjs-cloudflare build` (`OKSIS_API_PROXY_TARGET` build
env'inde) → `wrangler deploy` → `oksis-web-test`. Cloudflare API token GitHub secret'ında.
(Workers Builds'in Git entegrasyonu da kullanılabilir; monorepo + turbo için Actions daha
öngörülebilir.)

---

## 7. KVKK Değerlendirmesi

Azure (Almanya) ve Oracle (Frankfurt) kullanımı kişisel verinin **yurt dışına aktarımı** demektir.

1. Gerçek kişisel veriler (Altınay gerçek okul açılışı dahil) yalnız yerel `oksis_dev`'de tutulur.
2. `oksis-test`'te yalnız **sentetik veri**. Mevcut seed hesapları (s1…) ve seed runbook'u
   (`docs/teknik/ortamlar/seed-runbook.md`) sentetik olduğu ölçülerek kullanılır; gerçek veri
   içeren seed adımı (varsa) test'e uygulanmaz. Ayrı anonimleştirme betiği yalnız gerçek veri
   test'e taşınmak istenirse yazılır.
3. Prod açılmadan önce: yurt dışı aktarım için hukuki dayanak **veya** yurt içi barındırma.
   Prod ertelendiği için bu karar prod açılışına bağlanır; yurt içi sağlayıcı önceliklidir.

---

## 8. Yedek Plan

Oracle hesabı açılamazsa (Türk kartlarında doğrulama sorunu olabiliyor) veya Frankfurt'ta ARM
kapasitesi doluysa: aynı `docker compose` + Tunnel kurulumu **evdeki bir bilgisayarda** çalışır.
Mimari ve domain'ler değişmez. Kısıt: bilgisayar kapanınca API kapanır — Test için kabul edilebilir.

---

## 9. Prod Açılış Tetikleyicileri

Aşağıdakilerden biri gerçekleşince prod ücretli altyapıda açılır:

- İlk ücretli okul sözleşmesi
- Gerçek kişisel verinin buluta girmesi gerekliliği
- Prod API için SLA/uptime taahhüdü

Prod açılırken karara bağlanacaklar: barındırma (yurt içi), `app.oksis.net` / `okul.oksis.net`
(§2.3), Hangfire storage'ın Redis'e taşınması, prod Firebase projesi, mobil prod dağıtım hattı.

---

## 10. Uygulama Dilimleri

Her dilim kendi başına doğrulanır. ☐ = yapılacak, 👤 = hesap/panel işi (kullanıcı yapar),
🤖 = kod/yapılandırma (Claude yapar).

### Dilim 0 — Dal modeli
- [x] 🤖 `oksis-api`, `oksis-ui`: `dev` ve `test` dallarını `master`'dan aç, push et
- [ ] 👤 GitHub'da üç dala koruma kuralı — **engel:** private depo + GitHub Free'de ruleset/branch protection kapalı (HTTP 403). Şimdilik yerel kanca `.githooks/dal-korumasi.sh` (silme/force yasak, `master` yalnız `test`'ten + `OKSIS_MASTER_ONAY=1`). **Karar (07.10.2026): Free planda kalınır**, sunucu koruması yok; koruma yalnız yerel kancadadır
- [x] 🤖 `04-reviewer.yml` dal adlarını güncelle (`master`, `test`, `dev`)
- [x] 🤖 CI (`ci.yml`, iki depo) ve pre-push kancası: testler yalnız `test` ve `master` push'unda (API: build + birim + bekçiler + entegrasyon; UI: lint + typecheck + paket testleri + web build)
- [x] 👤 `gh` token'ına `workflow` yetkisi (`gh auth refresh -h github.com -s workflow`) — yoksa `.github/workflows/` push edilemez
- [x] 🤖 **Göç birleştirmesi (07.10.2026, kullanıcı kararı):** pre-push ve CI derlemesi bitmiyordu — kök neden 240 EF
  göçünün Designer dosyaları (Infrastructure'ın ~%98'i, 3,65 M satır). Tek `20261007_baseline` göçüne birleştirildi; çözüm
  sıfırdan 54 sn'de derleniyor, CI build 3 dk. Eski zincir ve baseline iki boş DB'de şema + veri satır satır karşılaştırıldı;
  iki ham SQL tohumu (plan modülleri, rehberlik dersi) baseline'a taşındı. Var olan DB'ler için
  `scripts/goc-birlestirme-dev-gecisi.sql` (veriye dokunmaz; eski zincir DB'sinde denendi).
- [x] 🤖 **Dev veritabanı baseline'a geçirildi (07.10.2026)** — önce yedek (`/var/opt/mssql/backup/oksis_dev_once_baseline_20261007.bak`,
  doğrulandı); şema baseline ile birebir (Hangfire hariç), `dotnet ef database update` boş geçiyor. Dilim 0 + B master'da (PR #39)

### Dilim B — Backend uyarlamaları (`oksis-api`, `dev` dalında)
- [x] 🤖 `appsettings.Test.json`'u gizli bilgiden arındır — gizli değerler `OKSIS_SECRETS_DIR` altında dosya başına bir anahtar
  (`AddKeyPerFile`; PEM/JSON çok satırlı). Test'in gizli listesi: `ConnectionStrings__DefaultConnection`, `Jwt__PrivateKeyPem`,
  `NationalIdProtection__EncryptionKeyBase64`, `NationalIdProtection__HashKeyBase64`, `Storage__S3__AccessKey`,
  `Storage__S3__SecretKey` (+ SMTP seçilince `Email__Smtp__*`, push için `Firebase__*`)
- [x] 🤖 Scalar'ı Development + Test'te aç
- [x] 🤖 Forwarded headers — kod gerekmedi: compose'da `ASPNETCORE_FORWARDEDHEADERS_ENABLED=true` (Dilim S)
- [x] 🤖 `Serilog.Sinks.Seq` + config'den sink seçimi (Test → `seq:5341`)
- [x] 🤖 Transaction taraması → `EnableRetryOnFailure` **kullanılamaz** (`TransactionBehavior` her komutu transaction'a sarar).
  Yerine `ConnectionOpenRetryInterceptor` (`Database:OpenRetry`): yalnız bağlantı açılışı yeniden denenir. Kesinti vekiliyle
  ölçüldü: kapalı ayarla 12. sn'de düşüyor, açıkla 22. sn'de ayağa kalkıyor. Azure uyanmasında yeniden ölçülecek (Dilim D sonrası)
- [x] 🤖 Test CORS/`App:BaseUrl` değerleri (`okul-test`, `merkez-test`)
- [x] 🤖 **`TB-270` (yeni bulgu):** RS256 token API'de doğrulanmıyordu — düzeltildi, RS256 anahtarıyla uçtan uca ölçüldü
- [ ] 🤖 **Yeni ihtiyaç:** imzalı dosya adresleri (`PresignedEndpoint`) tarayıcıdan erişilebilir olmalı → Garage S3 de Tunnel
  arkasından açılır: `s3-test.oksis.net` → `garage:3900` (Dilim S ingress + Dilim D DNS)

### Dilim D — Hesaplar ve DNS (👤)
- [x] 👤 Mevcut DNS kayıtlarını dışa aktar; `oksis.net` nameserver'larını Cloudflare'e taşı — **08.10.2026 aktif**. DNS önceden
  Vercel'deydi (yalnız Vercel'in otomatik kayıtları); yerine `@`→`76.76.21.21`, `www`/`brand`→`cname.vercel-dns.com` (DNS only)
- [ ] 👤 SSL Full (strict)
- [x] 👤 Azure hesabı; Free Offer ile `oksis-test` (Germany West Central, auto-pause, alarm) — **08.10.2026**: eski `rg-oksis`
  (West Europe, 39 MB) kullanıcı kararıyla silindi; yeni `oksis-test-rg` / `oksis-test-sql` / `oksis-test`, GP_S_Gen5_2, overage kapalı,
  SQL + Entra kimlik doğrulaması (`oksisadmin`), harmanlama dev ile aynı. ⬜ "Free amount remaining" alarmı henüz kurulmadı
- [x] 👤 Oracle Cloud hesabı (Frankfurt), A1.Flex 2 OCPU / 12 GB VM — **08.10.2026**: `oksis-test`, AD-2 (AD-1 kapasite yok),
  Ubuntu 24.04 aarch64, genel IP `130.61.174.101` (ephemeral; sihirbazda açılamadı, sonradan VNIC'ten verildi)
- [x] 👤 Azure SQL firewall'a VM çıkış IP'si — yalnız `130.61.174.101`; VM'den gerçek giriş ölçüldü (`baglanti-yaz.sh`)
- [ ] 👤 SMTP sağlayıcısı seç ve hesap aç

### Dilim S — Sunucu (`oksis-api`, `infra/test/` altında)
- [x] 🤖 `infra/test/docker-compose.yml` (api-test, redis, garage, clamav, seq, cloudflared; dışa port yok, Seq UI ve
  API yalnız `127.0.0.1` — SSH tüneli/duman testi), `env.example` (VM'de `.env`), `garage/garage.toml` (sırlar env'den)
- [x] 🤖 `scripts/vm-kurulum.sh` — Docker resmi depo, `oksis` kullanıcısı, SSH sertleştirme, fail2ban, otomatik
  güvenlik güncellemesi, 2 GB swap, Docker log sınırı. Konteynerde deneme koşusu ağ yavaşlığından yarıda kaldı;
  **ilk gerçek koşu VM'de** doğrulanacak
- [x] 🤖 `scripts/anahtar-uret.sh` — Test'e özgü **yeni** RSA 2048 JWT, `NationalIdProtection` (32/64 bayt), Garage S3
  anahtarı, Garage RPC/admin, Seq parolası, platform kurucu hesabı; idempotent (var olanı ezmez); bağlantı dizesi ve
  tunnel token'ı terminalden gizli okunur. Gizli dosyalar `1654` (API konteyner kullanıcısı) sahipliğinde, `400`
- [x] 🤖 `scripts/garage-ilk-kurulum.sh` — layout + API anahtarını içe alma + bucket oluşturma izni; idempotent
- [x] 🤖 **Yerel duman koşusu (07.10.2026)** — imaj + yığın + baseline'lı boş DB: `/health/live`, `/health/ready`,
  Scalar 200; ilk platform hesabı üretildi, giriş token'ı RS256, yetkili 200 / token'sız 401; dış host adıyla
  (`s3-test.oksis.net`) imzalanan adres Garage'da 200, bozuk/imzasız 403; Seq'e `Service=oksis-api`,
  `Environment=Test` olaylar düşüyor; ClamAV `PONG`. Bellek: API 444 MB, ClamAV 961 MB, Seq 123 MB
- [x] 🤖 Bulunan iki engel düzeltildi: `TB-273` (Dockerfile restore kırık, imaj hiç derlenmiyordu) ve `TB-274`
  (`clamav/clamav` yalnız amd64 → `clamav/clamav-debian`)
- [x] 👤 Tunnel oluştur (token) — **08.10.2026**, Zero Trust Free (kart doğrulamalı, $0). Ingress panelde: `api-test.oksis.net` → `http://api-test:8080`,
  `s3-test.oksis.net` → `http://garage:3900` (Host başlığı **değiştirilmez**; imza onu kapsar)
- [x] 👤 VM'de sırayla: `vm-kurulum.sh` → `anahtar-uret.sh <eposta>` → `compose up -d redis garage clamav seq` →
  `garage-ilk-kurulum.sh` → (Dilim C göç sonrası) `compose up -d` — **08.10.2026** API hariç hepsi arm64'te ayakta; ClamAV
  `clamav-debian` sağlıklı (`TB-274` gerçek ortamda doğrulandı); tunnel 4 bağlantı (fra); dışarıdan `api-test` 502 (API yok),
  `s3-test` Garage 403 (anonim erişim yok). Eksik yalnız `ConnectionStrings__DefaultConnection` (Azure)
- [ ] 👤 Seq ilk girişte parola değişikliği ister (`ssh -L 8081:127.0.0.1:8081`, kullanıcı `admin`)

### Dilim C — API CI/CD
- [ ] 🤖 `test` push → arm64 imaj → GHCR → migration bundle → SSH deploy → duman testi
- [ ] 👤 GitHub secrets: SSH anahtarı, VM adresi, `oksis-test` bağlantısı
- [ ] 🤖 Test DB'sine sentetik seed

### Dilim W — Web
- [ ] 🤖 **W0:** OpenNext build'i ölç (boyut ≤ 3 MiB, CPU) — sınır aşılırsa VM container yedeğine geç
- [ ] 🤖 W1: `wrangler` yapılandırması, `test` push → deploy workflow'u
- [ ] 👤 Cloudflare API token, `merkez-test`/`okul-test` custom domain, Access politikası
- [ ] 🤖 W2: host → yüzey ayrımı (`proxy.ts`)

### Kapsam dışı (bu tur)
- Prod ortamı (§9)
- Landing deposu ve `brand.oksis.net` → `oksis.net/marka` 301 (landing deposu açılınca)
- Hangfire storage'ın Redis'e taşınması
- Mobil uygulamanın `api-test`'e bağlanan derlemesi (ayrı EAS/derleme işi)

---

## 11. Ölçüm Bulguları ve Kararlar (07.10.2026)

| # | v0.1 varsayımı | Koddaki gerçek | Sonuç |
|---|---|---|---|
| 1 | Azure Free Offer test + prod'u taşır | Dakikalık/5 dk'lık job'lar DB'yi sürekli uyandırır; okul saatleri tek başına kotayı aşar | **Karar:** Test Azure (job'lar kapalı), prod ertelendi |
| 2 | 3 React + Vite SPA, Cloudflare Pages | Tek Next.js 16 uygulaması, `rewrites` proxy'si, `OKSIS_API_PROXY_TARGET` | **Karar:** Cloudflare Workers (OpenNext); W0 ölçümü şart |
| 3 | `main` + `develop` | Üç depoda yalnız `master` | **Karar:** `dev` → `test` → `master`, üçü korumalı, master'a merge kullanıcı onayıyla |
| 4 | Landing Pages projesi | Landing deposu yok | Kapsam dışı |
| 5 | Health check ayrılacak | Zaten ayrık (`/health/live`, `/health/ready`) | Yalnız healthcheck hedefi seçilir |
| 6 | Scalar prod'da kapatılacak | Zaten yalnız Development'ta açık | Test'e genişletilir |
| 7 | CORS eklenecek | Zaten config'den (`Cors:AllowedOrigins`); web proxy kullandığı için tarayıcı CORS'u gerekmiyor | Yalnız değerler |
| 8 | `appsettings.Test.json` eklenecek | Var; içinde depoya işlenmiş gizli anahtarlar ve bayat JWT ayarı | Temizlenir, anahtarlar yeniden üretilir |
| 9 | Compose: api, redis, garage, cloudflared | ClamAV eksik; SMTP yok (yalnız Mailpit) | ClamAV + Seq eklendi; SMTP sağlayıcısı {{TBD}} |
| 10 | Tenant slug rezerve adları | Kodda slug kavramı yok | Validasyon işi yok; liste ileriye not |
| 11 | "SuperAdmin konsolu" | K-27: platform rolleri | Metin güncellendi |
| 12 | `EnableRetryOnFailure` aç | Kullanıcı transaction'larıyla çakışır | Önce tarama |
| 13 | Mobil için Access Service Token | Uygulamaya gömülen token sızmış sayılır | `api-test` Access'e alınmaz |
| 14 | `okul.oksis.net` | `App:BaseUrl` ve mobil deep link `app.oksis.net` | Prod kararı açık (§2.3) |
| 15 | Göçler kod geçmişi | 240 göçün Designer dosyaları derlemeyi kilitliyordu | **Karar:** birleştirildi (baseline). Dev DB'nin geçişi betikle, zamanı kullanıcıyla |

---

## Kaynaklar

- [Azure SQL Database free offer – Microsoft Learn](https://learn.microsoft.com/en-us/azure/azure-sql/database/free-offer)
- [Oracle Quietly Halves Free Tier Ampere A1 Compute Limits – InfoQ](https://infoq.com/news/2026/07/oracle-cloud-free-tier-limits/)
- [Oracle Always Free Resources – Oracle Docs](https://docs.oracle.com/en-us/iaas/Content/FreeTier/resourceref.htm)
- [OpenNext — Cloudflare adaptörü](https://opennext.js.org/cloudflare)
- [Cloudflare Workers — fiyatlandırma ve sınırlar](https://developers.cloudflare.com/workers/platform/pricing/)
