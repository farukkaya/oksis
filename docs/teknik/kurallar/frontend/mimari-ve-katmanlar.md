# Frontend Mimarisi ve Katmanlar

> [!info] Belge bilgisi
> **Amaç:** `oksis-ui` monoreposunda kodun nerede yaşadığını, katmanların birbirine nasıl bağımlı olabileceğini ve bunun nasıl denetlendiğini tanımlamak.
> **Son doğrulama:** 2026-09-13. `oksis-ui` master `ec9ea8c` (`oksis-api` master `294ffe62`).
> **Kaynak:** `oksis-ui/CLAUDE.md` (Workspace Layout, Dependency rules, Where code lives, Separation of Concerns, SOLID, Handoff intake, Workflow), `apps/web/CLAUDE.md`, `apps/mobile/CLAUDE.md`, `packages/eslint-config/library.js`, gerçek klasör yapısı.
> **Yerini aldığı belge:** `docs/documents/frontend/*` (React 18 + Vite + React Router varsayan eski set; bayat).

Aynı kural setinin diğer notları: [[veri-ve-durum-yonetimi]] · [[formlar-ve-dogrulama]] · [[bilesen-ve-stil-kurallari]] · [[adlandirma]] · [[mobil]] · [[test]] · Sözleşme: [[api-sozlesmesi]]

---

## 1. Çalışma alanı düzeni

```
oksis-ui/
├── apps/
│   ├── web/                 Next.js 16 paneli
│   │   ├── app/             Yalnız yönlendirme: (auth)/, (dashboard)/, layout.tsx, providers.tsx
│   │   ├── features/<alan>/ Ekran bileşenleri + index.ts (tek dışa açık yüz)
│   │   ├── components/      Kabuk (app-shell, route-guard, …) + shared/ (page-header, pager, toast…)
│   │   ├── lib/             Uygulama bağlamı (auth-bridge, active-role, season-context, breadcrumb)
│   │   ├── mocks/           Yalnız web'e özgü MSW handler + veri
│   │   └── dev/scenario-bar Mock kipinde senaryo çubuğu
│   └── mobile/src/          Expo
│       ├── app/             Expo Router rotaları (yalnız yönlendirme)
│       ├── features/<alan>/ components/, lib/, index.ts
│       ├── components/      Mobil ortak bileşenler
│       ├── lib/             auth-bridge, configure-api, enable-mocking, active-child, push-registration…
│       └── theme/tokens.ts  Renk/tipografi token'ları
└── packages/
    ├── core/src/<alan>/     types.ts · schemas.ts · logic.ts · constants.ts (+ *.test.ts)
    ├── api/src/<alan>/      endpoints.ts · queries.ts (+ contract.ts) ; client/ ; generated/schema.ts
    ├── api-mocks/src/<alan>/ Web ve mobilin paylaştığı MSW handler'ları
    ├── ui/src/              Yalnız web: styles/*.css + birkaç temel bileşen
    ├── eslint-config/       Flat config + katman sınır kuralları
    └── typescript-config/
```

## 2. Bağımlılık yönü

**Kural:** İçe aktarma yönü tektir: `apps/* → packages/api → packages/core`. Yukarı ya da iki uygulama arasında yana doğru import yapılmaz.

| # | Kural | Gerekçe | Denetim |
|---|---|---|---|
| 1 | `packages/core` içinde React, JSX, DOM globalleri ve `fetch` yok. `@workspace/api` ya da `@workspace/ui` import edilmez. `next`, `expo`, `react-native` import edilmez. | Web ve mobil aynı kodu paylaşabilsin, mock'suz test edilebilsin. | ESLint `coreBoundaries`. `packages/core/eslint.config.*` içinde bağlı. |
| 2 | `packages/api` TanStack Query kullanabilir. React bileşeni, JSX ve DOM globalleri yok. `@workspace/ui` ve platform paketleri import edilmez. | Veri katmanı platformdan bağımsız kalsın. | ESLint `apiBoundaries`. `packages/api` ve `packages/api-mocks` içinde bağlı. |
| 3 | `packages/ui` yalnız web içindir. `apps/mobile` onu **asla** import etmez. | ui paketi DOM ve CSS'e bağımlıdır. | `mobileBoundaries` tanımlı ama **`apps/mobile/eslint.config.mjs` onu bağlamıyor**. Bu kuralın bugün lint bekçisi yok; kural yine geçerlidir. |
| 4 | `apps/web` ile `apps/mobile` birbirinden import yapmaz. Ortak ihtiyaç doğarsa kod `packages/core` ya da `packages/api`'ye taşınır. Ortak mock'lar `packages/api-mocks`'a gider. | İki yüz tek beyni paylaşsın, birbirine bağlanmasın. | İnceleme ile |
| 5 | Web'de bir feature'a yalnız `index.ts` üzerinden erişilir (`@/features/<alan>`). `@/features/<alan>/<dosya>` gibi derin import yasak. | Feature'ın iç yapısı serbestçe değişebilsin. | ESLint `webFeatureBoundaries`. `apps/web/eslint.config.js` içinde bağlı. |

## 3. Kod nerede yaşar

Bir alan (domain) tek bir uygulamanın içine yığılmaz, **ilgisine göre** parçalanır:

| Ne | Nerede | Not |
|---|---|---|
| Tipler, Zod şemaları, saf iş kuralları, sabitler, statü config map'leri | `packages/core/src/<alan>/{types,schemas,logic,constants}.ts` | `apps/` içinde **asla** tanımlanmaz |
| HTTP çağrıları ve tel → görünüm eşlemesi | `packages/api/src/<alan>/endpoints.ts` | `fetch` ya da istemcinin kullanılabildiği **tek** yer |
| Query/mutation hook'ları | `packages/api/src/<alan>/queries.ts` | Query key'leri yalnız `client/query-keys.ts` içindeki `qk` nesnesinden gelir |
| Elle yazılmış tel DTO'ları ve mock dönemi sözleşmesi | `packages/api/src/<alan>/contract.ts` | Bkz. [[api-sozlesmesi]] §2 |
| Ekranlar | `apps/web/features/<alan>/`, `apps/mobile/src/features/<alan>/components/` | Yalnız görünüm |
| Rota dosyası | `apps/web/app/(dashboard)/<rota>/page.tsx`, `apps/mobile/src/app/**.tsx` | "Aptal" kalır: bir feature bileşeni import edip çizer (~15 satırı geçmez) |

Web'de örnek rota dosyası:

```tsx
import { AttendancePage } from "@/features/attendance"

export default function Page() {
  return <AttendancePage />
}
```

Mobilde rota dosyası feature ekranını `PortalScreen` ile sarar (`src/app/(tabs)/grades.tsx`).

## 4. Rota yapısı (web)

- Rota grupları iki tanedir. `(auth)`: `login`, `forgot-password`, `reset-password`, `invitations/[token]`. `(dashboard)`: tüm panel ekranları.
- **Portal başına URL öneki yoktur** (`/admin`, `/teacher` gibi). Tek bir panel vardır. Menü ve erişim aktif role göre değişir: `components/route-guard.tsx`, `@workspace/core` içindeki `canAccessRoute` fonksiyonunu kullanır ve menünün kendisini kaynak alır. Böylece "menüde yok ama rota açık" durumu oluşamaz.
- Rol henüz çözülmemişken kapı bekler ve iskelet gösterir (X-10). Yanlış ekranın bir an için çizilip 403 alan istekler atması bu yüzden engellenir.
- **Gerçek yetki sınırı .NET API'dir.** Arayüzdeki kapılar yalnız kullanıcı deneyimi içindir.
- Rota adları kebab-case ve ASCII'dir (bkz. [[adlandirma]]).

## 5. Sorumlulukların ayrılması: 4 katman

| Katman | Nerede yaşar | Yapamaz |
|---|---|---|
| Görünüm | `apps/*/features/*/components` | Veri çekmek, iş mantığı, veri eşleme |
| Orkestrasyon | Query hook'ları / UI hook'ları | HTTP ayrıntısı bilmek (url, başlık, status) |
| İş mantığı | `packages/core/*/logic.ts` | React, JSX ya da `fetch` import etmek |
| Veri erişimi | `packages/api/*/endpoints.ts` | Tipi doğrulanmamış veriyi dışarı sızdırmak |

- Bileşende ya da UI hook'unda ham `fetch` yazılmaz.
- Her form ya da varlık için **tek** Zod şeması vardır. Form ve API katmanı aynı şemayı kullanır. Aynı doğrulama iki kez yazılmaz.
- **Aşırı katmanlama da hatadır.** Üç satırlık mantık için katman açılmaz. Mantık ancak yeniden kullanılıyorsa ya da test gerektiriyorsa ayrıştırılır.

## 6. SOLID'in React karşılığı

- **S:** Bir bileşenin tek işi olur. Tanımında "ve" geçiyorsa bölünür.
- **O:** Davranış config map'leri ve prop'larla genişletilir, iç kod düzenlenerek değil. Varyant sayısı artınca `if` zinciri yerine `Record<Status, Config>` kullanılır.
- **L:** Sarmalayıcılar yerel prop'ları yutmaz: `...props` aktarılır, `disabled`, `type`, `aria-*` korunur.
- **I:** Bileşen yalnız kullandığı alanları alır. İki alan için bütün varlık geçirilmez (form ve detay görünümleri makul istisnadır).
- **D:** Arayüz hook'lara bağımlıdır. Hook'lar da somut taşıma katmanına değil `api`/`core` soyutlamalarına bağlıdır. Backend değişirse yalnız `packages/api` etkilenir.

## 7. Tasarım teslimi (handoff) → kod

Claude Design teslimleri **güvenilmeyen girdidir**. İçindeki renk, font ve radius değerleri tasarım aracının varsayılanlarıdır, markanın değil. İşaretlemesi de çoğu zaman veri çekme ve mantığı doğrudan DOM'a gömer.

- Web için `handoff-web`, mobil için `handoff-mobile` skill'i çalıştırılır (`oksis-ui/.claude/skills/`).
- Adımlar:
  1. **Marka uyumu bir kapıdır.** Her renk, font ve radius bir marka token'ına ya da mevcut semantik token'a eşlenmelidir.
  2. Her arayüz öğesi mevcut bir ortak bileşene eşlenir. Eşleşmeyen varsa **dur ve onay al.** Yeni ortak bileşen sessizce icat edilmez.
  3. Katman ayrımı (§5) ve SOLID (§6) kurallarını yeniden yapılandırmadan karşılayamayan bir teslim olduğu gibi alınamaz. Parçalanır: veri bağlama `packages/api`'ye, doğrulama ve kurallar `packages/core`'a taşınır.
  4. Adlar sözlükten türetilir (bkz. [[adlandirma]]).
  5. Yalnız `apps/<platform>/features/<alan>/` ve ince bir rota dosyası yazılır.
  6. Doğrulama: typecheck, lint ve teslimle görsel karşılaştırma.

## 8. İş akışı

- Bir iş bir daldır (`feature/<kebab>`, `fix/<kebab>`, `chore/<kebab>`).
- Commit öncesi `npm run typecheck && npm run lint` çalıştırılır. `.githooks/pre-push` bunu zorlar (etkinleştirme: `git config core.hooksPath .githooks`).
- `packages/*` değişikliği iki uygulamada da typecheck'ten geçmelidir.
- 5'ten fazla dosyaya dokunan bir refactor önce bildirilir, onay beklenir.
- Commit biçimi ortak kurallardadır (`teknik/kurallar/ortak/`).

## 9. Eski belgelerden alınmayanlar

| Eski iddia | Bugünkü gerçek |
|---|---|
| Vite + React Router v6, `ProtectedLayout`, `<Outlet />` | Next.js App Router, `(dashboard)/layout.tsx` + `RouteGuard` |
| `/admin`, `/teacher`, `/parent`, `/student`, `/super` portal önekleri, `src/portals/<rol>/` | Tek panel, rol bazlı menü ve kapı |
| `src/modules/<x>/` alan modülleri | `packages/core` + `packages/api` + `apps/*/features` |
| Route bazlı `RouteErrorBoundary`, `React.lazy` ile kod bölme kuralları | Next.js yönlendirmesi. Ayrı bir kural tanımlı değil. |
