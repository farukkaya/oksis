# OKSİS Teknoloji Yığını

> [!info] Belge bilgisi
> **Amaç:** `oksis-api` (backend), `oksis-ui` (web + mobil + paylaşılan paketler) ve yerel altyapının kullandığı teknolojileri **gerçek sürümleriyle** tek yerde toplamak.
> **Son doğrulama:** 2026-09-13. Kaynak commit'ler: `oksis-api` master `294ffe62`, `oksis-ui` master `ec9ea8c`.
> **Kaynak dosyalar:** `oksis-api/{global.json, Directory.Build.props, src/*/*.csproj, tests/*/*.csproj, docker-compose.yml, Dockerfile, .github/workflows/*}`, `oksis-ui/{package.json, turbo.json, apps/*/package.json, packages/*/package.json}`.
> **Sürüm yazımı:** `^`/`~` npm aralığıdır, `*` NuGet joker sürümdür. Tabloda yazıldığı gibi aktarıldı. Kilitli (çözülmüş) sürüm için `package-lock.json` ve `obj/project.assets.json` dosyalarına bakılır.

İlgili notlar: [[api-sozlesmesi]] · [[yerel-kurulum]] · [[ortamlar]] · [[mimari-ve-katmanlar]]

---

## 1. Repolar

| Repo | İçerik | Dil / çalışma zamanı |
|---|---|---|
| `oksis-api` | Backend. Clean Architecture ve CQRS kullanan modüler monolit. | .NET 10 / C# |
| `oksis-ui` | Turborepo: `apps/web` (Next.js), `apps/mobile` (Expo), `packages/*` | TypeScript (`strict`) |
| `oksis` | Yalnız belge (bu vault) | — |

---

## 2. Backend — `oksis-api`

### 2.1 Derleme ve dil

| Öğe | Değer | Kaynak |
|---|---|---|
| .NET SDK | `10.0.201`, `rollForward: latestFeature`, prerelease kapalı | `global.json` |
| Hedef çatı | `net10.0` | `Directory.Build.props` |
| Dil | `LangVersion latest`, `Nullable enable`, `ImplicitUsings enable` | `Directory.Build.props` |
| Uyarı politikası | `TreatWarningsAsErrors=true`, `EnforceCodeStyleInBuild=true`, `AnalysisLevel latest` (IDE kuralları derlemede hata sayılır) | `Directory.Build.props` |
| Solution | `Oksis.slnx` | — |
| Container | `mcr.microsoft.com/dotnet/aspnet:10.0` çalışma zamanı imajı, port `8080`, `ASPNETCORE_ENVIRONMENT=Production` | `Dockerfile` |

### 2.2 Projeler ve bağımlılık yönü

```
Oksis.Api ──► Oksis.Application ──► Oksis.Domain
     │                ▲                  ▲
     └──► Oksis.Infrastructure ──────────┘
Oksis.Shared  ◄── Api, Application, Infrastructure (Result, Error, PagedResult, sabitler)
```

`Oksis.Domain` hiçbir NuGet paketine bağlı değildir.

### 2.3 Paketler (katman bazında)

**`Oksis.Api`**

| Paket | Sürüm | Kullanım |
|---|---|---|
| Microsoft.AspNetCore.Authentication.JwtBearer | 10.0.8 | Bearer doğrulama |
| Microsoft.AspNetCore.OpenApi | 10.0.7 | `/openapi/v1.json` (yalnız Development) |
| Scalar.AspNetCore | 2.14.14 | API referans arayüzü `/scalar` (yalnız Development) |
| Serilog.AspNetCore | 10.0.0 | İstek loglama, host entegrasyonu |
| Serilog.Enrichers.Environment | 3.0.1 | `MachineName`, `EnvironmentName` zenginleştirici |
| Hangfire.AspNetCore / Hangfire.SqlServer | 1.8.23 | Arka plan işleri, panel `/hangfire` (yalnız Development ve localhost) |
| AspNetCore.HealthChecks.SqlServer / .Redis | 9.0.0 | `/health/ready`, `/health/live` |

**`Oksis.Application`**

| Paket | Sürüm | Kullanım |
|---|---|---|
| MediatR | 14.1.0 | CQRS komut/sorgu hattı |
| FluentValidation (+ DependencyInjectionExtensions) | 12.1.1 | İstek doğrulama (`ValidationBehavior`) |
| Mapster (+ Mapster.DependencyInjection) | 10.0.7 | DTO eşleme |
| Microsoft.EntityFrameworkCore (+ Abstractions) | 10.0.8 | Yalnız `IApplicationDbContext` soyutlaması için |
| Serilog | 4.3.0 | Yalnız `LogContext.PushProperty` (KVKK denetim izi). ASP.NET'e bağımlı değil. |

**`Oksis.Infrastructure`**

| Paket | Sürüm | Kullanım / gerekçe (csproj yorumundan) |
|---|---|---|
| Microsoft.EntityFrameworkCore.SqlServer / .Design | 10.0.8 | SQL Server sağlayıcısı, migration'lar |
| EFCore.NamingConventions | 10.0.1 | snake_case tablo ve kolon adları |
| StackExchange.Redis | 2.13.1 | Önbellek, token kara listesi, yetki sürümü aynası |
| Hangfire.Core / .SqlServer / .AspNetCore | 1.8.23 | İş kuyruğu (SQL Server depolama) |
| MailKit | 4.16.0 | SMTP e-posta göndericisi |
| FirebaseAdmin | 3.6.0 | FCM HTTP v1 push. Apache 2.0. Servis hesabı appsettings'e gömülmez. |
| AWSSDK.S3 | 4.0.100.2 | S3 uyumlu depolama istemcisi (Garage). Yalnız Infrastructure kullanır. |
| ClosedXML | 0.104.* | Excel dışa aktarım (`IExcelExporter`). MIT. |
| nClam | 9.0.0 | ClamAV INSTREAM istemcisi (`IVirusScanner`). Apache 2.0. |
| SkiaSharp (+ NativeAssets.macOS) | 3.119.2 | Görsel küçültme (`IThumbnailGenerator`). PDFtoImage ile uyumlu olması için bu sürüme sabitlendi. |
| PDFtoImage | 5.2.1 | PDF'in ilk sayfasını görsele çevirir. MIT. |
| Konscious.Security.Cryptography.Argon2 | 1.3.1 | Argon2id parola hash'i (`Argon2IdPasswordHasher`, DI'da kayıtlı) |
| BCrypt.Net-Next | 4.0.3 | Eski BCrypt hash'lerini doğrulamak için |
| System.IdentityModel.Tokens.Jwt / Microsoft.IdentityModel.Tokens | 8.14.0 | Token üretimi |
| Microsoft.Extensions.Configuration.UserSecrets | 10.0.8 | Yerel gizli ayarlar (`Oksis.Api` projesinde `UserSecretsId` tanımlı) |
| Serilog.Sinks.Elasticsearch | 10.0.0 | **Paket referansı var, sink bağlı değil** (bkz. §5) |

**`Oksis.Shared`**: yalnız Microsoft.EntityFrameworkCore 10.0.8.

### 2.4 Neden bu seçimler

`oksis-api/CLAUDE.md` § Stack ve csproj yorumlarından derlendi:

- **Mapster, AutoMapper değil.** Proje kuralı olarak sabit.
- **Repository katmanı yok.** Handler'lar doğrudan `IApplicationDbContext` kullanır. EF Core'un üstüne bir sarmalayıcı daha eklemek yasaktır.
- **Hangfire SQL Server depolaması.** Ek bir kuyruk sunucusu gerekmez, veritabanıyla aynı altyapıda çalışır. `Hangfire:Enabled=false` olduğunda `InProcessBackgroundJobClient` devreye girer. Bu sayede geliştirme, test ve CI Hangfire şeması olmadan çalışabilir.
- **Harici kütüphaneler soyutlamanın arkasında.** ClosedXML, nClam, SkiaSharp, FirebaseAdmin gibi paketler hep bir arayüz (`IExcelExporter`, `IVirusScanner`, `IThumbnailGenerator`, `IPushSender`) üzerinden kullanılır. Lisanslar eklenirken kontrol edildi (MIT / Apache 2.0).
- **Garage (S3 uyumlu).** Depolama AWS S3 API'si üzerinden soyutlanır. Her okul için ayrı bir bucket açılır (`oksis-t{SchoolId}`).

---

## 3. Web — `oksis-ui/apps/web`

| Paket | Sürüm | Not |
|---|---|---|
| next | 16.2.6 | App Router. `next dev` Turbopack kullanır. `turbopack.root` monorepo kökünü gösterir. |
| react / react-dom | 19.2.4 | — |
| @tanstack/react-query | ^5 | Tek sunucu durumu katmanı |
| zod | ^4.4.3 | Şemalar `@workspace/core` içinde tanımlıdır |
| lucide-react | ^1.23.0 | İkonlar |
| next-themes | ^0.4.6 | Tema sağlayıcısı |
| @tailwindcss/postcss | ^4 (dev) | Tailwind v4 |
| msw | ^2.15.0 (dev) | Mock kipi. Worker dizini `public/`. |
| Fontlar | `next/font/google` | Plus Jakarta Sans (`--font-sans`), JetBrains Mono (`--font-mono`), alt kümeler `latin` ve `latin-ext` |

**Neden** (`oksis-ui/CLAUDE.md` § Tech Stack): backend dışarıdaki .NET API'dir. Next.js yalnız arayüz sunar; API route ve Server Action yazılmaz. Geliştirmede CORS sorunu Next `rewrites` proxy'si ile çözülür (`/api/*` → .NET).

---

## 4. Mobil — `oksis-ui/apps/mobile`

| Paket | Sürüm | Not |
|---|---|---|
| expo | ~57.0.4 | SDK 57. Yapılandırma dosyası `app.config.ts` (ortama göre değişir). |
| react-native | 0.86.0 | — |
| react / react-dom | 19.2.3 | Web'den farklı sürüm. Metro tek React kopyasına sabitlenmiştir. |
| expo-router | ~57.0.4 | Dosya tabanlı yönlendirme (`src/app`). `typedRoutes` ve `reactCompiler` deneyleri açık. |
| @tanstack/react-query | ^5.101.2 | — |
| expo-secure-store | ~57.0.1 | Token deposu |
| @react-native-firebase/app, /messaging | ^26.3.2 | FCM push (iOS push bilinçli olarak kapalı, bkz. [[mobil]]) |
| react-native-reanimated | 4.5.0 | (+ react-native-worklets 0.10.0) |
| react-native-gesture-handler | ~2.32.0 | — |
| react-native-screens | 4.25.2 | — |
| react-native-safe-area-context | ~5.7.0 | — |
| react-native-svg | 15.15.4 | — |
| @expo/ui, expo-glass-effect, expo-symbols, expo-linear-gradient | ~57.0.x | Arayüz yardımcıları |
| expo-image-picker | ~57.0.5 | Belge/fotoğraf seçimi |
| expo-image | ~57.0.0 | **Bağımlılık listesinde var, kodda import edilmiyor** |
| @expo-google-fonts/plus-jakarta-sans | ^0.4.2 | Marka fontu |
| react-native-web | ~0.21.0 | Expo web önizlemesi |
| msw | ^2.15.0 (dev) | `msw/native` |
| fast-text-encoding, react-native-url-polyfill | ^1.0.6 / ^2.0.0 | Yalnız mock kipinde gereken polyfill'ler. Prod bundle'da boş modüle yönlendirilir. |
| typescript | ^5.9.3 | — |

EAS yapılandırması (`eas.json`) yok.

---

## 5. Paylaşılan paketler — `oksis-ui/packages`

| Paket | Bağımlılıklar (sürüm) | Rolü |
|---|---|---|
| `@workspace/core` | zod ^4.4.3, date-fns ^4.4.0 | Tipler, Zod şemaları, saf iş mantığı, sabitler. React/DOM/fetch yok. |
| `@workspace/api` | openapi-fetch ^0.13.8, @tanstack/react-query ^5, @microsoft/signalr ^8.0.17. Dev: openapi-typescript ^7.13.0. Peer: react ^19.2.0 | Tipli HTTP istemcisi, zarf açıcı, query hook'ları, SignalR aboneliği |
| `@workspace/api-mocks` | msw ^2.15.0 | Web ve mobilin ortak kullandığı MSW handler'ları |
| `@workspace/ui` (yalnız web) | radix-ui ^1.6.2, @radix-ui/react-avatar ^1.2.2, @radix-ui/react-slot ^1.3.0, class-variance-authority ^0.7.1, clsx ^2.1.1, tailwind-merge ^3.6.0, tw-animate-css ^1.4.0, sonner ^2.0.7, shadcn ^4.13.0, react-hook-form ^7.81.0, @hookform/resolvers ^5.4.0, tailwindcss ^4 | Stil dosyaları (`src/styles/*.css`) ve birkaç temel bileşen |
| `@workspace/eslint-config` | eslint ^9, typescript-eslint ^8.60.0, eslint-plugin-react ^7.37.5, eslint-plugin-react-hooks ^7.1.1, @next/eslint-plugin-next ^16.2.6, eslint-plugin-turbo ^2.9.15, eslint-config-prettier ^10.1.8 | Flat config. Katman sınır kuralları (bkz. [[mimari-ve-katmanlar]]). |
| `@workspace/typescript-config` | — | `base.json` (`strict`, `noUncheckedIndexedAccess`, `moduleResolution: Bundler`), `nextjs.json`, `library.json`, `react-library.json` |

### Monorepo araçları

| Araç | Sürüm | Not |
|---|---|---|
| npm (workspaces) | `packageManager: npm@11.16.0` | Tek lockfile `package-lock.json`. `pnpm`/`yarn` yasak. |
| Node | `engines >=20`, `.nvmrc` → `20` | — |
| turbo | ^2.9.18 | Görevler `build`, `dev`, `lint`, `format`, `typecheck`. **`test` görevi yok.** `globalEnv`: `APP_ENV`, `NODE_ENV`, `OKSIS_API_PROXY_TARGET`. |
| typescript | ^5 | — |
| prettier | ^3.8.3 + prettier-plugin-tailwindcss ^0.8.0 | `semi: false`, çift tırnak, `printWidth 80`, `trailingComma es5` |

---

## 6. Altyapı

| Bileşen | Yerel (docker compose servisi / imaj / port) | Uygulamada | Ayar adları |
|---|---|---|---|
| Veritabanı | `mssql` — `mcr.microsoft.com/mssql/server:latest`, `1433` (compose yorumu: SQL Server 2025 imajı) | EF Core 10, snake_case, migration'lar `src/Oksis.Infrastructure/Persistence/Migrations` | `ConnectionStrings:DefaultConnection` |
| Önbellek | `redis` — `redis:7-alpine`, `6379` | StackExchange.Redis. Yapılandırılmadığında in-memory alternatifler kullanılır (`InMemoryAccessTokenBlacklist` vb.). | `ConnectionStrings:Redis` |
| Arka plan işleri | (SQL Server içinde) | Hangfire. Periyodik işler `UseOksisRecurringJobsAsync` ile kaydedilir. | `Hangfire:Enabled`, `Hangfire:PrepareSchema`, `Hangfire:StartupRetry:*`, `Hangfire:Cron:*` |
| Nesne depolama | `garage` — `dxflrs/garage:v1.0.1`, S3 `3900`, RPC `3901`, Admin `3903`. İnceleme arayüzü `s3manager` → `8083` | AWSSDK.S3, path-style, bölge `garage` | `Storage:Provider` (`S3Compatible`), `Storage:S3:*` |
| Virüs tarama | `clamav` — `clamav/clamav:1.4`, `3310` | nClam, akış sınırı 512M | `ClamAv:*` |
| E-posta | `mailpit` — `axllent/mailpit:latest`, SMTP `1025`, arayüz `8025` | MailKit SMTP | `Email:Smtp:*`, `App:BaseUrl` (bağlantıların hedefi) |
| Push | — | FirebaseAdmin (FCM HTTP v1). Yapılandırma yoksa uyarı loglanır, gönderim yapılmaz. | `Firebase:ServiceAccountJson`, `Firebase:ProjectId` |
| Gerçek zamanlı | — | SignalR hub'ları `/hubs/session`, `/hubs/notifications`. **Redis backplane yok** (in-memory). | — |
| Loglama | — | Serilog: console, `LogContext` (`CorrelationId`), `Service=oksis-api`. **Elasticsearch sink'i bağlı değil.** `Elasticsearch:Url` ayarı ve sink paketi var ama ne `Program.cs` ne de appsettings'te `WriteTo` tanımı var. | `Serilog:*`, `Elasticsearch:Url` |
| Kişisel veri koruma | — | T.C. kimlik no şifreleme ve hash | `NationalIdProtection:EncryptionKeyBase64`, `NationalIdProtection:HashKeyBase64` |
| Sağlık | — | `/health/ready` (mssql + redis), `/health/live` | — |

Kimlik doğrulama ayrıntıları (JWT, refresh cookie, token ömrü) için bkz. [[api-sozlesmesi]] §6.

---

## 7. Test ve CI

### Backend

| Proje | Araçlar | `[Fact]`/`[Theory]` içeren dosya sayısı |
|---|---|---|
| `Oksis.Domain.UnitTests` | xUnit 2.*, FluentAssertions 8.* | 82 |
| `Oksis.Application.UnitTests` | xUnit, FluentAssertions, NSubstitute 5.*, Moq 4.20.72, MockQueryable.NSubstitute 7.*, ClosedXML | 217 |
| `Oksis.Api.UnitTests` | xUnit, FluentAssertions, NSubstitute | 27 |
| `Oksis.Infrastructure.IntegrationTests` | xUnit, FluentAssertions, NSubstitute, Testcontainers.MsSql 4.* (Docker gerekir; ClamAV testleri çalışan konteyner ister) | 102 |
| `Oksis.Tests` | xUnit, Testcontainers.MsSql, MediatR, FluentValidation. `Architecture/` altında mimari bekçiler var. | 10 |

Tümünde `Microsoft.NET.Test.Sdk 17.*` kullanılır.

- Günlük koşu: `./scripts/test-changed.sh`. Yalnız değişen koda (transitif) bağlı birim testleri ve mimari bekçileri koşturur. Entegrasyon testleri yalnız `--integration` bayrağıyla koşar.
- `.githooks/pre-push`: `dotnet build` ve üç birim test projesi. Etkinleştirme: `git config core.hooksPath .githooks`.

### Frontend

- **vitest ^2.1.9** yalnız `packages/core` (21 test dosyası), `packages/api` (28) ve `packages/api-mocks` (8) içinde kurulu. Ortam `node`, desen `src/**/*.test.ts`.
- `apps/web` ve `apps/mobile` içinde test çalıştırıcı yok (jest, Playwright bağımlılığı yok).
- `.githooks/pre-push`: `npm run lint` ve `npm run typecheck`.

Ayrıntı: [[test]].

### CI

- **`oksis-ui`: `.github` klasörü yok.** CI yok.
- **`oksis-api/.github/workflows`**: yalnız iki "ajan" iş akışı var, ikisi de derleme/test kapısı değil:
  - `01-architect.yml`: issue yorumu `/revise` ile başlayınca tetiklenir.
  - `04-reviewer.yml`: `feature/issue-*` dalından `master`, `oksis-preprod` veya `oksis-test` hedefli PR açıldığında ya da `/review` yorumunda tetiklenir.
  - İkisi de `.github/scripts/agents/*.py` ve `.github/scripts/requirements.txt` dosyalarını çağırır, **ama bu klasör depoda yok**. Yani iş akışları bu hâliyle çalışamaz.

---

## 8. Kullanılmayan ve yasaklı teknolojiler

| Konu | Durum |
|---|---|
| AutoMapper | **Yasak.** Yerine Mapster kullanılır. |
| EF Core üzerinde repository katmanı | **Yasak.** Handler'lar `IApplicationDbContext` kullanır. |
| Lazy loading | **Yasak.** `Include()` ya da projection kullanılır. |
| Domain katmanında EF Core / DataAnnotations | **Yasak.** Fluent API `Infrastructure/Persistence/Configurations/` altındadır. |
| Controller içinde `DbContext` | **Yasak.** Her zaman `ISender.Send` kullanılır. |
| `async void`, `Task.Result`, `.Wait()` | **Yasak.** |
| `pnpm` / `yarn` | **Yasak.** Yalnız npm. |
| Next.js API route / Server Action | **Yasak.** Tüm veri `packages/api` üzerinden .NET API'den gelir. |
| axios | Kullanılmıyor. İstemci `openapi-fetch`. |
| Zustand | **Kurulu değil.** Bağlam durumu web'de React context'te, mobilde modül deposu ve `useSyncExternalStore` ile tutulur. |
| react-hook-form (apps/web) | `apps/web` bağımlılığı değil (yalnız `packages/ui` içinde). Web formlarında kalıp `useState` ve `schema.safeParse`. |
| TanStack Table / grid kütüphanesi | Yok. Tablolar portlanmış prototip CSS sınıflarıyla yazılır. |
| i18n kütüphanesi | Yok. Arayüz metinleri doğrudan Türkçe yazılır. |
| NativeWind, React Navigation, jest (mobil) | Yok. Stil `tokens.ts` üzerinden, yönlendirme Expo Router ile yapılır. |
| `apps/mobile` → `@workspace/ui` importu | **Yasak** (web/DOM bileşenleri). |
| Yeni kütüphane | Sessizce eklenmez, önce sorulur. |

---

## 9. Eski belgelerde geçen ama kodla doğrulanamayan iddialar

Aşağıdaki iddialar bu belgeye bilinçli olarak alınmadı:

| İddia (kaynak) | Kodda görülen |
|---|---|
| "React 18 + Vite + React Router", "MUI/DevExtreme" (eski frontend belgeleri, eski kök `CLAUDE.md`) | Next.js 16 App Router, React 19 |
| "Serilog → ELK" (`oksis-api/CLAUDE.md`) | Sink paketi referansı var, bağlantısı yok |
| "Argon2id (planlanan)" (`oksis-api/CLAUDE.md`) | Argon2id **kullanımda**, BCrypt yalnız eski hash doğrulaması için |
| "SQL Server 2022 (LocalDB dev)" | Yerelde docker `mssql/server:latest` (`localhost,1433`). LocalDB yalnız `appsettings.Test.json` içinde geçiyor. |
| "Outbox → Hangfire `OutboxDispatchJob`" (eski kök `CLAUDE.md`) | `OutboxDispatchJob` sınıfı yok |
| "husky `commit-msg` kancası" (eski kök `CLAUDE.md`) | husky yok, yalnız `.githooks/pre-push` var |
| "Zustand ile aktif sezon seçici" (`apps/web/CLAUDE.md`) | Zustand kurulu değil |
| "JWT RS256, 15 dk" | İmzalama RS256 ya da HS256 olabilir. Doğrulama tarafı yalnız simetrik anahtarı bağlıyor (bkz. [[api-sozlesmesi]] §6). |
| "SignalR Redis backplane" | Yok |
