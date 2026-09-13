# Ortamlar

> [!info] Belge bilgisi
> **Amaç:** OKSİS'in çalıştığı ortamları, her ortamın yapılandırma kaynağını ve kodda görülen farklarını tek tabloda toplamak. **Bilinmeyen adres, sorumlu ve erişim bilgisi `{{TBD}}` bırakılmıştır.**
> **Son doğrulama:** 2026-09-13. `oksis-api` master `294ffe62`, `oksis-ui` master `ec9ea8c`.
> **Kaynak:** `oksis-api/src/Oksis.Api/{appsettings.json, appsettings.Development.json, appsettings.Test.json, Properties/launchSettings.json, Program.cs}`, `oksis-api/{docker-compose.yml, Dockerfile, .github/workflows/*}`, `oksis-ui/{turbo.json, apps/web/.env.example, apps/web/next.config.ts, apps/mobile/app.config.ts, apps/mobile/scripts/*}`.
> **Gizli bilgi:** Bu belgede yalnız ayar ve ortam değişkeni **adları** yer alır. Değerler yazılmaz.

İlgili notlar: [[yerel-kurulum]] · [[seed-runbook]] · [[tech-stack]] · [[api-sozlesmesi]]

---

## 1. Ortam listesi

| Ortam | Kanıt (kodda) | API `ASPNETCORE_ENVIRONMENT` | Adres | Sorumlu | Erişim |
|---|---|---|---|---|---|
| **Yerel (dev)** | `appsettings.Development.json`, `launchSettings.json` (`http` profili), `docker-compose.yml` | `Development` | API `http://localhost:5112`, web `http://localhost:3000`, Metro `8081` | Geliştirici | Yerel makine |
| **Test** | `appsettings.Test.json` var. PR hedef dalı olarak `oksis-test` (`04-reviewer.yml`). | `Test` | {{TBD}} | {{TBD}} | {{TBD}} |
| **Pre-prod** | Yalnız PR hedef dalı adı `oksis-preprod` (`04-reviewer.yml`). appsettings dosyası yok. | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} |
| **Prod** | `Dockerfile` (`ASPNETCORE_ENVIRONMENT=Production`), `appsettings.json` taban değerleri, mobil `APP_ENV=prod` | `Production` | {{TBD}}. Kodda geçen alan adları §4'te. | {{TBD}} | {{TBD}} |

> [!warning] Dal ↔ ortam eşlemesi doğrulanamadı
> `oksis-test` ve `oksis-preprod` dalları iki repoda da yok. Görülen dallar: `master`, `fix/polish`, `feature/exam-session-client`.
> Deploy hattı, sunucu, barındırma sağlayıcısı: kodda yok. {{TBD}}

## 2. Backend yapılandırma farkları

.NET yapılandırma katmanları: `appsettings.json` → `appsettings.{Environment}.json` → user-secrets (yalnız Development; `Oksis.Api` `UserSecretsId` taşır) → ortam değişkenleri. Ortam değişkeninde iç içe ayar `Bolum__Anahtar` biçiminde yazılır.

| Ayar | Taban (`appsettings.json`) | Development | Test |
|---|---|---|---|
| `ConnectionStrings:DefaultConnection` | `localhost,1433`, DB `oksis` | `localhost,1433` (docker), DB `oksis_dev` | `(localdb)\MSSQLLocalDB`, DB `oksis_dev` |
| `ConnectionStrings:Redis` | `localhost:6379` | `localhost:6379` | boş (in-memory alternatifler) |
| `Hangfire:Enabled` | `false` | `true` | tanımsız (taban → `false`) |
| JWT imzalama | `Jwt:PublicKeyPath` tanımlı (**kod okumuyor**) | `Jwt:SecretKey` (simetrik) | `Jwt:SecretKey` (simetrik) |
| Access token ömrü | Tanımlanan ad kod tarafından okunmuyor. Fiilen 15 dk. | aynı | aynı |
| `Cors:AllowedOrigins` | 2 prod origin (§4) | `localhost:5173`, `localhost:3000`, `localhost:8081`, `127.0.0.1:8081` | `localhost:5173`, `localhost:3000`, `localhost:8081` |
| `App:BaseUrl` | `https://app.oksis.net` | `http://localhost:3000` | tanımsız |
| `Storage:*` | tanımsız | `S3Compatible`, `http://localhost:3900` (Garage) | tanımsız |
| `ClamAv:*` | tanımsız | `localhost:3310`, etkin | tanımsız |
| `Email:Smtp:*` | Harici SMTP, port 587, STARTTLS | `localhost:1025` (Mailpit) | `localhost:1025` |
| `Firebase:*` | anahtarlar tanımlı, değerler boş | tanımsız | tanımsız |
| `Elasticsearch:Url` | `http://localhost:9200` (sink bağlı değil) | tanımsız | tanımsız |
| `Serilog:MinimumLevel:Default` | `Information` | `Debug` | `Debug` |

JWT ayar adı uyuşmazlığının ayrıntısı: [[api-sozlesmesi]] §6.5.

**Yalnız Development'ta çalışanlar** (`Program.cs`):

- `/openapi/v1.json` ve `/scalar`.
- `/hangfire` paneli (yalnız localhost).
- `DevDataSeeder` (dev okulları ve kadrosu).

**Development dışında:**

- `UseHttpsRedirection` açılır.

**Her ortamda:**

- `LocationSeeder` çalışır (bkz. [[seed-runbook]]).
- Otomatik migration **yoktur**. Prod'a şema, `dotnet ef migrations script … --idempotent` ile üretilen SQL uygulanarak gelir.

`Test` ortamını hangi süreç kullanıyor? Test kodunda `UseEnvironment("Test")` bulunamadı. {{TBD}}

## 3. Gizli ayarlar

Aşağıdaki ayarlar ortam başına gizli bir değer ister. Değerlerin nerede tutulduğu (vault, CI secret, sunucu ortam değişkeni) bilinmiyor: {{TBD}}.

| Ayar adı | Amaç |
|---|---|
| `ConnectionStrings:DefaultConnection`, `ConnectionStrings:Redis` | Veritabanı ve önbellek bağlantısı |
| `Jwt:SecretKey` **veya** `Jwt:PrivateKeyPem` (+ `Jwt:PublicKeyPem`) | Token imzalama |
| `Email:Smtp:Username`, `Email:Smtp:Password` | SMTP kimliği |
| `Firebase:ServiceAccountJson`, `Firebase:ProjectId` | FCM push |
| `NationalIdProtection:EncryptionKeyBase64`, `NationalIdProtection:HashKeyBase64` | T.C. kimlik no şifreleme ve hash |
| `Storage:S3:AccessKey`, `Storage:S3:SecretKey` | Nesne depolama |
| `Argon2PasswordHasher:*` | Parola hash parametreleri (bölüm bağlanıyor; değerler appsettings'te yok) |

> [!warning] Depoda düz metin geliştirme sırları
> `appsettings.Development.json`, `appsettings.Test.json`, `docker-compose.yml` ve `scripts/init-garage.sh` dosyalarında **yerel geliştirme** için düz metin sırlar bulunuyor: SQL `sa` parolası, JWT simetrik anahtarı, T.C. kimlik anahtarları, Garage anahtarları.
> Bu değerler hiçbir paylaşılan ortamda kullanılmamalıdır.

## 4. Kodda geçen dış adresler

Bu adreslerin gerçekten canlı olup olmadığı ve sahibi bilinmiyor: {{TBD}}.

| Adres | Nerede | Anlamı |
|---|---|---|
| `app.oksis.tr`, `admin.oksis.tr` (https) | `appsettings.json` → `Cors:AllowedOrigins` | Prod web origin'leri (varsayım) |
| `app.oksis.net` (https) | `appsettings.json` → `App:BaseUrl`; mobil `app.config.ts` (universal link / App Links, `/invite`) | E-posta bağlantılarının ve davet deep link'inin hedefi |
| `brand.oksis.net` | `oksis-ui/CLAUDE.md` | Marka profili |

> [!question] Alan adı tutarsızlığı
> CORS listesi `.tr` alan adlarını, `App:BaseUrl` ve mobil universal link ise `.net` alan adını gösteriyor. Hangisi doğru? {{TBD}}

## 5. Frontend ortam değişkenleri

| Değişken | Uygulama | Ne zaman okunur | Kaynak / not |
|---|---|---|---|
| `OKSIS_API_PROXY_TARGET` | web | Next sunucusunda (rewrites) | `apps/web/.env.example`. Varsayılan `http://localhost:5112`. `turbo globalEnv`. |
| `NEXT_PUBLIC_API_MOCKING` | web | Derleme anında gömülür | `enabled` olunca MSW açılır. **`.env.example`'da yok.** |
| `EXPO_PUBLIC_API_URL` | mobil | Bundle anında | `apps/mobile/.env.local`, `scripts/dev-*.sh` tarafından yeniden yazılır |
| `EXPO_PUBLIC_API_MOCKING` | mobil | Bundle anında (yalnız `__DEV__`) | `.env.local` |
| `APP_ENV` | mobil | `app.config.ts` (prebuild/derleme) | `prod` → prod paket adı, şema ve Firebase. Başka her değer → dev. `turbo globalEnv`. |
| `OKSIS_API_DIR`, `OKSIS_AVD`, `OKSIS_IOS_DEVICE`, `ANDROID_SERIAL`, `ANDROID_HOME` | mobil betikleri | Yerel geliştirme | [[yerel-kurulum]] |

`.env*` dosyaları git'e girmez: kök `.gitignore` ve `apps/mobile/.gitignore` → `.env*.local`.

## 6. Mobil derleme ortamları

| | Dev | Prod |
|---|---|---|
| Paket / bundle id | `com.oksis.mobile.dev` | `com.oksis.mobile` |
| Deep link şeması | `oksis-dev` | `oksis` |
| Firebase dosyaları | `apps/mobile/firebase/dev/` (depoda) | `apps/mobile/firebase/prod/` (**depoda yok**) |
| iOS push | kapalı | kapalı (ücretli Apple geliştirici programı gerekli) |
| Dağıtım (TestFlight, Play iç test) | — | {{TBD}} (EAS yapılandırması yok) |

## 7. CI / CD

- `oksis-ui`: CI yok.
- `oksis-api`: İki GitHub Actions iş akışı var (`01-architect.yml`, `04-reviewer.yml`). İkisi de ajan iş akışıdır ve depoda olmayan `.github/scripts/` klasörünü çağırır. Derleme, test ya da deploy yapmaz.
- Deploy süreci: {{TBD}}.

## 8. Kullanıcıdan istenecek bilgiler

- [ ] Test, pre-prod ve prod ortamlarının adresleri (API, web, Hangfire paneli varsa)
- [ ] Her ortamın sorumlusu ve erişim yöntemi (VPN, bastion, bulut konsolu)
- [ ] Barındırma: container platformu, SQL Server, Redis, S3 depolama ve ClamAV prod karşılıkları
- [ ] Gizli değerlerin tutulduğu yer ve rotasyon sorumlusu
- [ ] Dal ↔ ortam eşlemesi (`oksis-test`, `oksis-preprod` dalları kullanılacak mı?)
- [ ] Doğru alan adı: `.tr` mı `.net` mi?
- [ ] Prod JWT imzalama yolu (RS256 mı, HS256 mı) ve ayar adlarının düzeltilmesi
- [ ] Log toplama hedefi (Elasticsearch sink bağlanacak mı?)
- [ ] Mobil prod derleme ve dağıtım hattı, prod Firebase projesi
- [ ] `appsettings.Test.json` hangi süreçte kullanılıyor?
