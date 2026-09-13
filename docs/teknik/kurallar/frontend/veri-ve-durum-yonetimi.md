# Veri ve Durum Yönetimi

> [!info] Belge bilgisi
> **Amaç:** Sunucu verisinin, istemci bağlamının, token'ların, hata yüzeyinin ve mock kipinin `oksis-ui` içinde nasıl yönetildiğini tanımlamak.
> **Son doğrulama:** 2026-09-13. `oksis-ui` master `ec9ea8c`, `oksis-api` master `294ffe62`.
> **Kaynak:** `packages/api/src/client/*` (config, client, request, errors, auth-refresh, query-client, query-keys, mutation-error, write-queue), `apps/web/app/providers.tsx`, `apps/web/lib/*`, `apps/mobile/src/lib/*`, `packages/eslint-config/base.js`, `oksis-ui/CLAUDE.md` (Domain Decisions), `apps/web/CLAUDE.md` (Data & State).

İlgili notlar: [[mimari-ve-katmanlar]] · [[api-sozlesmesi]] · [[formlar-ve-dogrulama]] · [[mobil]]

---

## 1. Durum türleri ve sahipleri

| Durum | Sahibi | Kural |
|---|---|---|
| Sunucu verisi | TanStack Query (`@workspace/api` hook'ları) | Başka hiçbir depoya kopyalanmaz |
| Ekran içi arayüz durumu | `useState` | — |
| Ekranlar arası bağlam (dönem, çocuk, rol) | Web: React context (`lib/season-context.tsx`, `lib/active-role.tsx`). Mobil: modül deposu ve `useSyncExternalStore` (`lib/active-child.ts`, `lib/active-term.ts`). | Sunucu işlemi olan seçimler istemcide taklit edilmez (§5) |
| Token'lar | `AuthBridge` uygulaması (web ve mobil ayrı) | Bkz. §4 |
| Form durumu | `useState` ile şema doğrulaması | Bkz. [[formlar-ve-dogrulama]] |

> **Zustand kurulu değil.** `apps/web/CLAUDE.md` ve `packages/api/src/client/config.ts` yorumunda geçen "web: Zustand" ifadesi bayattır. Yeni bir durum kütüphanesi eklemek onay ister.

## 2. Sunucu verisi: TanStack Query

- Bileşenler `fetch` çağırmaz ve query key'i kendileri üretmez. Hook'lar yalnız `packages/api/src/<alan>/queries.ts` içinde yaşar.
- **Tüm query key'leri `packages/api/src/client/query-keys.ts` içindeki `qk` nesnesinden gelir. Elle key yazmak yasaktır.**
- Key'ler şu ilkelere göre kurulur (dosyadaki yorumlar emsaldir):
  - Her alanın bir `all()` öneki vardır, örneğin `["homework"]`. Mutasyon sonrası o önekle toplu geçersizleme yapılır.
  - **Yanıtı değiştiren her parametre key'e girer**: filtre nesnesi, sayfa, `termId`, `sessionId`, `childId`, hafta başı. Aksi hâlde iki farklı sorgu aynı önbellek satırını ezer.
  - **Yanıtı değiştirmeyen şey key'e girmez.** Örneğin aynı okumadan çizilen görünüm kipi (liste / ısı haritası) key'de yer almaz. Yoksa aynı veri farklı zamanlarda bayatlar.
  - Kimliği token'dan çözülen "benim" uçları (`mine()`, `my()`) key'de kimlik taşımaz.
- Key'ler okul öneki taşımaz. Kiracı yalıtımı sunucuda JWT içindeki `school_id` ile yapılır. Çıkışta (`auth/queries.ts`) önce `auth.clear()`, ardından `queryClient.clear()` çağrılır.
- `createQueryClient` varsayılanları (`client/query-client.ts`):
  - `staleTime: 30_000`.
  - Sorgu yeniden denemesi en fazla 2 kez yapılır. **401 ve 403'te yeniden deneme yok**, çünkü refresh ara katmanı zaten denemiştir.
  - `MutationCache` ağı: sahipsiz mutasyon hatası `onMutationError` ile toast'a düşer. Çağrı yeri `onError` tanımladıysa ya da `meta: { errorHandled: true }` verdiyse ağ devreye girmez. 401 hatası bu yüzeye düşmez, girişe yönlendirme yolunu izler.
- Sık yazılan hücreler (not girişi gibi) için `KeyedWriteQueue` kullanılır (`client/write-queue.ts`). Aynı anahtara giden yazımları geciktirir ve tekilleştirir; bir anahtar için aynı anda tek istek uçar.

## 3. İstemci yapılandırması

`packages/api` platformdan bağımsızdır. Platforma bağlı parçalar uygulama tarafından `configureApi()` ile enjekte edilir:

| Alan | Web (`app/providers.tsx`) | Mobil (`src/lib/configure-api.ts`) |
|---|---|---|
| `baseUrl` | `""` (aynı origin; Next `rewrites` → `OKSIS_API_PROXY_TARGET`) | `EXPO_PUBLIC_API_URL`, yoksa geliştirme makinesinin adresi ve `:5112` |
| `auth` | `webAuthBridge` | `mobileAuthBridge` |
| `clientType` | verilmez (sunucu web davranışını uygular) | `"mobile"` (refresh token gövdede döner) |
| `onUnauthorized` | `window.location.href = "/login"` | `router.replace('/login')` |
| `fetch` | Mock kipinde worker hazır olana kadar bekleyen sarmalayıcı | varsayılan |

İstemci `openapi-fetch` ile üretilen tiplere (`generated/schema.ts`) bağlıdır. Ara katman her isteğe `Authorization: Bearer` ekler ve 401'de tek uçuşlu (single-flight) refresh yapar. Ayrıntı: [[api-sozlesmesi]] §6.

## 4. Token saklama

| Platform | Access token | Refresh token |
|---|---|---|
| Web | `sessionStorage` (`webAuthBridge`; sekme kapanınca silinir) | httpOnly `oksis_rt` cookie'si. Sunucu login yanıtının gövdesinde bu alanı boşaltır. |
| Mobil | `expo-secure-store` (anahtar başına ~2 KB sınırı yüzünden üç ayrı anahtar) | `expo-secure-store` |
| Expo web önizlemesi | `sessionStorage` | `sessionStorage` |

- Token `AsyncStorage`'a ya da `localStorage`'a düz yazılmaz.
- Refresh isteği `credentials: "include"` ile gönderilir, böylece web'de cookie taşınır.

## 5. Bağlam seçimleri sunucu işlemidir

- **Sezon (yıl) değiştirmek** `POST /api/v1/auth/account/switch-season` çağrısıdır ve yeni token döner. İstemcide bir yıl state'i tutulmaz; bağlam sunucudan okunur (`me/context`).
- **Çocuk seçimi** `switch-child` çağrısıdır. Web'deki `season-context` durumu bu mutasyonun iyimser yansımasıdır, seçimin kendisi değildir.
- **Profil değiştirmek** `switch-profile` çağrısıdır.
- Dönem seçimi web'de kabukta tutulur, ekranda tutulmaz. Böylece aynı dönem not defteri ve idare panosunda tutarlı kalır.
- Mobilde Expo Router sekmeleri ayrı ağaçlardır, bu yüzden context yetmez. Aktif çocuk bir modül deposunda tutulur ve kalıcı değildir; uygulama açılınca "seçili yoksa ilk çocuk" varsayılanı uygulanır.

## 6. Hata yüzeyi

Kurallar:

1. **API katmanının dışına tek hata tipi çıkar: `ApiError`** (`errors[]`, `status`, `correlationId`, `fieldError(field)`).
2. **Kullanıcıya gösterilen cümle `apiErrorDesc(error)` (sorgular) ya da `mutationErrorDesc(error)` (mutasyonlar) ile seçilir.** Ekran reddin gerekçesini kendisi uydurmaz.
3. **ESLint `X-01`:** `onError: () => …` yazmak hatadır. Handler `err` parametresini almalıdır: `onError: (err) => toast(mutationErrorDesc(err))`. Gerekçe: 31 çağrı yerinde backend'in cümlesi sabit bir metinle gizleniyordu.
4. **ESLint `X-08`:** "Sunucuya ulaşılamadı", "Bağlantınızı kontrol…" gibi ağ suçlaması içeren sabitler yasaktır. Bu cümle yalnız gerçekten ağ hatası olduğunda doğrudur ve `apiErrorDesc` onu zaten üretir.
5. **403'te sunucu cümlesi yalnız izin listesindeki modül öneklerinde geçirilir** (`mutation-error.ts` → `DOMAIN_FORBIDDEN_CODE_PREFIXES`). Diğer kodlarda "Bu işlem için yetkiniz yok." gösterilir, çünkü altyapı kodlarının mesajı İngilizce sabittir. Listeye yeni bir modül eklemek bilinçli bir karardır: o modülün 403 mesajının Türkçe ve kullanıcıya dönük olduğu ölçülmelidir.
6. **Çeviri anahtarına benzeyen mesajlar ekrana ham basılmaz** (`identity.errors.email-exists` gibi). Yerine "gerekçesiz red" cümlesi gösterilir.
7. Yetki reddinde ekran `ForbiddenScreen` / `forbidden-state` bileşenini, sorgu hatasında gerekçeyi hatanın kendisinden alan bileşeni gösterir.

## 7. Gerçek zamanlı güncellemeler

- SignalR aboneliği `packages/api/src/notifications/realtime.ts` içinde, React'ten bağımsız yazılmıştır. Hook'lar uygulama tarafında yaşar.
- Gelen sinyal yalnız "yenile" anlamı taşır. Payload önbelleğe yazılmaz; liste ve rozet yeniden çekilir. Gerekçe: yetki ve kapsam süzgeci backend'dedir.
- Hub adresi mutlak bir `baseUrl` ister. Web'in `baseUrl` değeri `""` olduğu için web'de hub bağlantısı bu fazda kurulu değildir.

## 8. Next.js'e özgü sınırlar

- Next API route ve Server Action yazılmaz.
- Server Component'ten .NET API çağrılmaz. Veri istemci tarafında Query ile çekilir.

## 9. Mock kipi (MSW)

| | Web | Mobil |
|---|---|---|
| Bayrak | `NEXT_PUBLIC_API_MOCKING=enabled` (derleme anında gömülür) | `EXPO_PUBLIC_API_MOCKING=enabled` ve `__DEV__` |
| Başlatma | `mocks/browser.ts` → `msw/browser`, `onUnhandledRequest: "bypass"` (eşleşmeyen istek gerçek proxy'ye gider) | `lib/enable-mocking.ts` → `msw/native`. Polyfill'ler **önce, sırayla** yüklenir. |
| Handler'lar | `apps/web/mocks/*` (yalnız web) + `@workspace/api-mocks` | `@workspace/api-mocks` |

- **Ortak handler ölçütü "backend yok" değil, "web ve mobil aynı handler'a ihtiyaç duyuyor" olmasıdır.** Uygulamalar birbirinden import edemediği için ortak mock'lar `packages/api-mocks`'ta yaşar.
- Handler path'leri `*/api/v1/...` biçimindedir; mobilin mutlak origin'iyle de eşleşmesi için.
- **Mock'lar da tiplidir.** Fixture'lar üretilen DTO ile alan alan aynı olmalıdır. Şemayla çelişen mock, derleme geçse bile hatadır.
- Mock-first kalıbı (backend modülü henüz yokken): sözleşme `packages/api/src/<alan>/contract.ts` içinde `declare module "../generated/schema"` ile tanımlanır. Codegen gelince şekil uyuşmazlığı typecheck'i kırar; bu bilinçli bir bekçidir.
- Web'de mock kipinde `dev/scenario-bar` açılır ve seçilen senaryo yenilemeden sonra da korunur.

## 10. Tarih üretimi

- `toISOString().slice(0, 10)` **yasak**. `+03:00` saat diliminde gece yarısından sonra önceki günü üretir.
- Tarih yerel bileşenlerden kurulur: `getFullYear()`, `getMonth() + 1`, `getDate()`, sıfır dolgulu.

## 11. Eski belgelerden alınmayanlar

| Eski iddia | Bugünkü gerçek |
|---|---|
| Axios instance ve interceptor ile token yenileme | `openapi-fetch` ara katmanı (`client/auth-refresh.ts`) |
| Zustand store kalıbı, `persist` kuralları | Zustand yok (§1) |
| `studentKeys.detail(id)` gibi alan başına key fabrikaları, React Query DevTools | Tek `qk` nesnesi. DevTools kurulu değil. |
| Tenant önekli query key'ler (`tenantScopedKey`, emekli `oksis-mobile`) | Key'lerde okul öneki yok; yalıtım sunucuda |
| URL durumu için ayrı kütüphane | Tanımlı değil |
