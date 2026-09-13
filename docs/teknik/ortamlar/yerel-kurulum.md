# Yerel Kurulum

> [!info] Belge bilgisi
> **Amaç:** `oksis-api` ve `oksis-ui` (web ve mobil) projelerini sıfır bir makinede ayağa kaldırmak. Gerçek API'ye karşı ve mock (MSW) kipinde çalıştırmayı kapsar.
> **Son doğrulama:** 2026-09-13. `oksis-api` master `294ffe62`, `oksis-ui` master `ec9ea8c`.
> **Kaynak:** `oksis-api/{CLAUDE.md, README.md, global.json, docker-compose.yml, scripts/*, .githooks/pre-push, src/Oksis.Api/Properties/launchSettings.json, src/Oksis.Api/Program.cs}`, `oksis-ui/{CLAUDE.md, package.json, .nvmrc, .githooks/pre-push, apps/web/{package.json,.env.example,next.config.ts}, apps/mobile/{package.json, CLAUDE.md, scripts/*}, packages/api/package.json}`.
> **Gizli bilgi:** Parolalar ve anahtarlar yazılmaz. Geliştirme değerleri `docker-compose.yml`, `appsettings.Development.json` ve seeder kaynağında tanımlıdır.

İlgili notlar: [[ortamlar]] · [[seed-runbook]] · [[tech-stack]]

---

## 1. Gereksinimler

| Araç | Sürüm | Neden |
|---|---|---|
| .NET SDK | `10.0.201` (`global.json`, `rollForward: latestFeature`) | API |
| `dotnet-ef` global aracı | EF Core 10 ile uyumlu | Migration uygulamak için. Repoda araç manifesti yok, global kurulur. |
| Docker + Docker Compose | — | SQL Server, Redis, Garage, ClamAV, Mailpit. Entegrasyon testleri de Testcontainers ile Docker ister. |
| Node.js | `>=20` (`.nvmrc` → `20`) | UI |
| npm | `11.16.0` (`packageManager`) | Tek paket yöneticisi. `pnpm`/`yarn` kullanılmaz. |
| Xcode + iOS simülatörü | — | Mobil iOS (isteğe bağlı) |
| Android SDK: platform-tools, emulator, `android-36` sistem imajı | — | Mobil Android (isteğe bağlı) |
| PowerShell (`pwsh`) | — | Yalnız lokasyon CSV'lerini yeniden üretmek için ([[seed-runbook]]) |

> [!note]
> Mobil betikleri macOS varsayar (`ipconfig getifaddr`, `lsof`, `sed -i ''`, Xcode DerivedData yolu).

## 2. Klasör düzeni

```
~/Repositories/
├── oksis/        belgeler (bu vault)
├── oksis-api/
└── oksis-ui/
```

Mobil betikleri API'yi `~/Repositories/oksis-api` ya da `~/Projects/oksis/oksis-api` altında arar. Farklı bir konum için `OKSIS_API_DIR` verilir (`src/Oksis.Api` klasörünü göstermeli).

## 3. Altyapı (docker compose)

```bash
cd ~/Repositories/oksis-api
docker compose up -d
```

| Servis | Konteyner | Port | Not |
|---|---|---|---|
| `mssql` | `oksis-mssql` | `1433` | İlk açılış ~90 sn sürer. Sağlık kontrolü `oksis_dev` veritabanı varsa ONLINE olmasını bekler. |
| `redis` | `oksis-redis` | `6379` | — |
| `mailpit` | `oksis-mailpit` | SMTP `1025`, arayüz http://localhost:8025 | Gönderilen tüm e-postalar arayüzde görünür |
| `garage` | `oksis-garage` | S3 `3900`, `3901`, `3903` | **İlk kurulumda bir kez** `./scripts/init-garage.sh` çalıştırılır |
| `clamav` | `oksis-clamav` | `3310` | İlk açılışta imza veritabanını indirir, birkaç dakika sürebilir (`start_period 180s`) |
| `s3manager` | `oksis-s3manager` | http://localhost:8083 | Garage bucket'larını gezme arayüzü (yalnız geliştirme) |

```bash
docker compose up -d garage && ./scripts/init-garage.sh   # yalnız ilk kez (idempotent)
docker compose ps                                          # tüm servisler healthy olmalı
```

## 4. API (`oksis-api`)

```bash
cd ~/Repositories/oksis-api
git config core.hooksPath .githooks          # bir kez: pre-push kapısı (build + birim testler)
dotnet build
dotnet ef database update --project src/Oksis.Infrastructure --startup-project src/Oksis.Api
dotnet run --project src/Oksis.Api
```

- **Adres: `http://localhost:5112`** (`launchSettings.json` → `http` profili, `ASPNETCORE_ENVIRONMENT=Development`).
- Uygulama migration'ı kendisi uygulamaz. Yeni migration geldiğinde `dotnet ef database update` tekrar çalıştırılır.
- Başlangıçta sırasıyla şunlar olur:
  1. Hangfire etkinse (Development'ta etkin) periyodik işler kaydedilir.
  2. `LocationSeeder` çalışır.
  3. `DevDataSeeder` dev okullarını ve kadrosunu yazar (bkz. [[seed-runbook]]).
- Doğrulama adresleri:

  | Adres | Beklenen |
  |---|---|
  | http://localhost:5112/health/live | 200 |
  | http://localhost:5112/health/ready | mssql ve redis sağlıklı |
  | http://localhost:5112/scalar | API referansı |
  | http://localhost:5112/openapi/v1.json | OpenAPI dokümanı |
  | http://localhost:5112/hangfire | Hangfire paneli (yalnız localhost) |

- Testler:

  ```bash
  ./scripts/test-changed.sh                  # değişen koda bağlı birim testler + mimari bekçiler (~30 sn)
  ./scripts/test-changed.sh --integration    # + entegrasyon (Docker, ~3-4 dk)
  dotnet test                                # tüm paket (~4,5 dk), yalnız bilinçli olarak
  ```

- Yeni migration: `dotnet ef migrations add <YYYYMMDD_ad> --project src/Oksis.Infrastructure --startup-project src/Oksis.Api`.
- Commit öncesi `dotnet format` çalıştırılır.
- Yerel gizli değerleri geçersiz kılmak için `dotnet user-secrets` kullanılabilir (`Oksis.Api` projesinde `UserSecretsId` var).

## 5. UI (`oksis-ui`)

### 5.1 Ortak adımlar

```bash
cd ~/Repositories/oksis-ui
npm install
git config core.hooksPath .githooks          # bir kez: pre-push kapısı (lint + typecheck)
npm run typecheck && npm run lint
```

API tiplerini yeniden üretmek için (API Development'ta çalışıyor olmalı):

```bash
npm run codegen -w @workspace/api            # → packages/api/src/generated/schema.ts
```

Kökteki `npm run dev` komutu `turbo dev` çalıştırır ve **web ile mobili birlikte** başlatır. Tek uygulama için `-w` kullanılır.

### 5.2 Web

```bash
cp apps/web/.env.example apps/web/.env.local  # OKSIS_API_PROXY_TARGET=http://localhost:5112
npm run dev -w web                            # http://localhost:3000
```

- `/api/*` istekleri Next `rewrites` ile `OKSIS_API_PROXY_TARGET` adresine gider. Aynı origin kullanıldığı için CORS gerekmez.
- Giriş hesapları: [[seed-runbook]] §3.

### 5.3 Mobil

Önce `apps/mobile` klasörüne geçilir. Senaryoya göre üç betik vardır. Hepsi şunları yapar:

- API kapalıysa `dotnet run` ile başlatır (log `/tmp/oksis-api-dev.log`),
- `apps/mobile/.env.local` dosyasına `EXPO_PUBLIC_API_URL` yazar,
- Metro'yu `8081` portunda başlatır.

| Komut | Hedef | Ağ çözümü |
|---|---|---|
| `npm run dev:sim` (`-- ios` / `-- android`) | iOS simülatörü ve/veya Android emülatörü | iOS loopback'i paylaşır. Android için `adb reverse` kurulur. `.env.local` → `localhost`. AVD adı `OKSIS_AVD` (varsayılan `oksis_pixel`), iOS cihazı `OKSIS_IOS_DEVICE` (varsayılan `iPhone 17`). |
| `npm run dev:device` | Gerçek iOS cihaz (aynı Wi-Fi) | LAN IP tespit edilir. Kestrel yalnız loopback dinliyorsa `scripts/lan-proxy.js` yönlendirici olarak çalışır. `.env.local` → LAN IP. |
| `npm run dev:device:android` | USB ile bağlı Android cihaz | `adb reverse` ile API ve Metro portları taşınır. Cihaz serisi `ANDROID_SERIAL` ile sabitlenir. |

Yerel derleme ve kurulum (ilk kez ya da native bağımlılık değişince):

```bash
npm run ios        # expo run:ios
npm run android    # expo run:android
```

Bilinen tuzaklar (betik çıktılarından):

- Projede `expo-dev-client` yok. Gerçek iOS cihaz Metro adresini derleme anında bundle'a yazılan `ip.txt` dosyasından okur. Mac'in IP adresi değişirse uygulama Metro'ya bağlanamaz.
  - Çözüm: Dev Menu → Configure Bundler, ya da yeniden derleme. Kalıcı çözüm router'da DHCP rezervasyonu.
- `expo run:android --device` **AVD adı** ister, adb serisi değil.
- Android derlemesi cihazın mimarisine göre daralır. arm64 telefon için alınan APK x86_64 emülatörde çalışmaz.
- `/usr/local` altında eski bir Node kurulumu PATH'i gölgeleyebilir. Betikler nvm'deki en yeni sürümü öne alır.
- `ios/` ve `android/` git-ignored'dır. Prebuild paket adı sorunları: [[mobil]] §6.

## 6. Mock kipi (MSW), backend olmadan

| | Web | Mobil |
|---|---|---|
| Aç | `apps/web/.env.local` → `NEXT_PUBLIC_API_MOCKING=enabled`, sonra `npm run dev -w web` (bayrak derleme anında gömülür, değişince yeniden başlat) | `apps/mobile/.env.local` → `EXPO_PUBLIC_API_MOCKING=enabled` |
| Dikkat | Mock'ta olmayan istekler gerçek proxy'ye düşer (`onUnhandledRequest: "bypass"`) | `scripts/dev-*.sh` `.env.local`'i yeniden yazar; bayrağı betikten sonra tekrar ekleyin |
| Ek | `dev/scenario-bar` ile senaryo seçilir, seçim yenilemede korunur | Yalnız `__DEV__` derlemede açılır |

Hangi alanların mock'u olduğu: `packages/api-mocks/src/*` (ortak) ve `apps/web/mocks/*` (yalnız web).

## 7. Sorun giderme

| Belirti | Neden / çözüm |
|---|---|
| API başlarken Hangfire "pre-login handshake" hatası veriyor | SQL Server henüz kurtarma aşamasında. `docker compose ps` ile `oksis-mssql` healthy olana kadar bekleyin. |
| Tam test koşusunda `ClamAvScannerIntegrationTests` ClamAV'a ulaşamıyor | Makine yük altında. İzole koşuda geçer. Entegrasyon koşu paralelliği bu yüzden sınırlandırıldı (TB-51). |
| README'deki `curl http://localhost:5000/...` çalışmıyor | Doğru port `5112`. Lokasyon uçları `[Authorize]` olduğu için Bearer token gerekir. |
| Startup'ta `districts.csv` / `neighborhoods.csv` uyarısı | [[seed-runbook]] §4 |
| Web'de her istek 401, login açılmıyor | `OKSIS_API_PROXY_TARGET` yanlış ya da API kapalı. `.env.local`'i ve `http://localhost:5112/health/live` adresini kontrol edin. |
| Mobil "Invalid hook call" | İki React kopyası çözülmüş. `metro.config.js` zincirini bozmayın ([[mobil]] §8). |
| Mobil mock'ta `Unexpected ( at index 0` | msw'nin `path-to-regexp` pini bozulmuş ([[mobil]] §8). |
| Mobil oturum her açılışta düşüyor | `clientType: 'mobile'` / `X-Client-Type` eksik ([[api-sozlesmesi]] §6.3). |
