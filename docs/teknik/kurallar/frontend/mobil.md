# Mobil Kuralları (Expo / React Native)

> [!info] Belge bilgisi
> **Amaç:** `oksis-ui/apps/mobile` uygulamasına özgü sınırları, stil, oturum, ortam yapılandırması, mock ve Metro kurallarını tanımlamak. Ortak kurallar için [[mimari-ve-katmanlar]] ve [[veri-ve-durum-yonetimi]] geçerlidir.
> **Son doğrulama:** 2026-09-13. `oksis-ui` master `ec9ea8c`.
> **Kaynak:** `apps/mobile/CLAUDE.md`, `apps/mobile/{package.json, app.config.ts, metro.config.js, eslint.config.mjs}`, `apps/mobile/src/{lib,theme,components,app,features}`, `apps/mobile/scripts/*`.
> **Yerini aldığı belge:** `docs/documents/mobile/*` (emekli `oksis-mobile` reposunu anlatır: React Navigation, NativeWind, jest; bayat).

---

## 1. Sabitlenmiş yığın

- **Expo SDK 57**, React Native 0.86.0, React 19.2.3.
- **Expo Router** ile dosya tabanlı yönlendirme: `src/app/`. Deneyler açık: `typedRoutes`, `reactCompiler`.
- Web'deki `app/` klasörünün mobil karşılığı `src/app/` klasörüdür ve **yalnız yönlendirme** içerir. Ekranlar feature'ları birleştirir.

## 2. Katı sınırlar

- **`@workspace/ui` asla import edilmez.** O paket web ve DOM içindir.
  - Uyarı: `mobileBoundaries` ESLint kuralı tanımlı, fakat `apps/mobile/eslint.config.mjs` onu bağlamıyor. Bu kuralın bugün otomatik bekçisi yok.
- Web ile **aynı beyin** kullanılır: tipler, şemalar ve iş mantığı `@workspace/core`'dan, veri hook'ları `@workspace/api`'den gelir. Yeniden yazılmaz.
- Sözlük ve adlandırma kuralları web ile aynıdır (bkz. [[adlandirma]]). Arayüz metinleri Türkçedir.
- Feature'lar `src/features/<alan>/{components,lib,index.ts}` yapısındadır ve yalnız arayüz içerir.
- Feature'lar birbirinin iç dosyasını import etmez. İkinci bir tüketici çıkınca parça `src/lib/` ya da `src/components/` altına terfi eder. Emsal: `lib/active-child.ts`, `components/icon.tsx`.
- Rota dosyası feature ekranını çizer; gerekiyorsa `PortalScreen` ile sarar.
- İş sırası: önce web pilot ekranı yapılır, ardından RN karşılığı ikinci pilot olarak gelir. Böylece "aynı feature, iki platform" için bir referans oluşur.

## 3. Stil ve token'lar

- **Ekranlara punto ya da hex değeri literal olarak yazılmaz.** Değerler `src/theme/tokens.ts` üzerinden gelir: `COLORS`, `TYPE`, `STATUS_TINTS`, `SURFACE_TONES`, `EVENT_DARK`. Eksik bir değer varsa literal yazılmaz, **token eklenir.**
- Fiili kalıp, token'larla kurulan `style={…}` nesneleridir. `@/theme/tokens` 157 dosyada import ediliyor.
- NativeWind kullanılmıyor (`className` yok) ve `StyleSheet.create` kullanılmıyor.
- Marka paleti `brand.oksis.net` v1.0'dan gelir. Web ile ortak statü rengi kuralı: İzinli için `STATUS_TINTS.izinli` (bkz. [[bilesen-ve-stil-kurallari]] §1.6).
- Font: `@expo-google-fonts/plus-jakarta-sans`.
- Güvenli alan için `react-native-safe-area-context` kullanılır.
- Ortak bileşenler `src/components/` altındadır: `app-header`, `badge`, `banner`, `button`, `card`, `chip`, `chip-row`, `checkbox-row`, `date-field`, `empty-state`, `fab`, `forbidden-state`, `missing-param-state`, `note`, `query-error-state`, `screen-header`, `sheet`, `skeleton`, `stepper`, `tab-bar`, `text-field`, `toast-host`, `toggle` ve diğerleri.

## 4. Oturum ve API

- `src/lib/configure-api.ts` şu yapılandırmayı kurar:
  - `clientType: 'mobile'`. **Zorunludur.** Bu başlık olmadan refresh token gövdede dönmez ve oturum her açılışta düşer (B-27).
  - `onUnauthorized` → `router.replace('/login')`.
- API adresi `EXPO_PUBLIC_API_URL`'den okunur. Tanımsızsa geliştirme makinesinin adresi (Expo `hostUri` ya da bundle'ın `scriptURL`'i) ve `:5112` kullanılır.
- Token'lar `expo-secure-store`'da tutulur (`lib/auth-bridge.ts`). SecureStore'un anahtar başına ~2 KB sınırı yüzünden access token, refresh token ve bitiş zamanı **ayrı anahtarlarda** saklanır. `AsyncStorage` token için kullanılmaz.
- Aktif çocuk ve dönem modül deposunda, `useSyncExternalStore` ile tutulur (`lib/active-child.ts`, `lib/active-term.ts`). Kalıcı değildir.

## 5. Push bildirimleri

- `@react-native-firebase/messaging` kullanılır. Kayıt ve çözme `lib/push-registration.ts` içinde, `registerDevice` / `unregisterDevice` (`@workspace/api`) ile yapılır.
- Cihaz kaydı `auth.clear()` **öncesinde** silinmelidir. Sonra çağrılırsa 401 alır.
- **iOS push bilinçli olarak kapalıdır** (2026-08-29). Ücretsiz Apple geliştirici takımı Push Notifications yeteneğine izin vermiyor. Ücretli programa geçilince `aps-environment` ve `UIBackgroundModes` eklenecek. O zamana kadar push yalnız Android'de test edilir.

## 6. Ortama duyarlı yapılandırma: `app.config.ts`

| | Dev (varsayılan) | Prod (`APP_ENV=prod`) |
|---|---|---|
| Uygulama adı | `Oksis Dev` | `Oksis` |
| Bundle / paket | `com.oksis.mobile.dev` | `com.oksis.mobile` (mağazaya çıktıktan sonra **değiştirilemez**) |
| Deep link şeması | `oksis-dev` | `oksis` |
| Firebase dosyaları | `./firebase/dev/` | `./firebase/prod/` (**depoda yok**) |
| Universal link / App Links | yok | `app.oksis.net`, `/invite` |

- `APP_ENV=prod` verilmedikçe dev varsayılır. Gerekçe: yanlışlıkla prod'a derlemek, yanlışlıkla dev'e derlemekten pahalıdır.
- **Uygulama adı ASCII olmak zorundadır (TB-90).** Ad `OKSİS` olduğunda `expo prebuild` Android paketini addan türetiyor ve `BuildConfig` çözülemiyor. Görünen adı değiştirmek gerekirse bir config plugin ile `strings.xml` ayarlanır.
- `ios/` ve `android/` git'e girmez (`.gitignore`). Config plugin'ler: `plugins/with-main-activity-new-intent.js` (bildirime dokunma), `plugins/with-firebase-podfile.js`. `expo-build-properties` ile Kotlin `2.2.10` ve iOS statik framework ayarlanır.

## 7. Mock kipi (MSW)

- Mock yalnız `__DEV__` **ve** `EXPO_PUBLIC_API_MOCKING=enabled` iken açılır. `msw/native` kullanılır, handler'lar `@workspace/api-mocks`'tan gelir.
- Bayrak `apps/mobile/.env.local` dosyasında durur (git-ignored). `scripts/dev-*.sh` betikleri bu dosyayı yeniden yazar, bu yüzden bayrağı tekrar eklemek gerekebilir.
- Polyfill'ler (`fast-text-encoding`, `react-native-url-polyfill`) ve `msw-bootstrap` önce, handler'lar sonra ve **sırayla** import edilir. `Promise.all` kullanılırsa yükleme sırası yarışa girer ve `MessageEvent` hatası çıkar.

## 8. Metro (monorepo)

`metro.config.js`:

- `watchFolders = [workspaceRoot]`, `nodeModulesPaths` hem uygulamayı hem kökü içerir, `disableHierarchicalLookup = true`.
  - **Gerekçe (tek React kopyası):** Web React 19.2.4, RN ise 19.2.3 kullanıyor. İki kopya olursa "Invalid hook call" hatası çıkar.
- `resolveRequest` zinciri:
  1. Prod'da `msw`, `@workspace/api-mocks`, `@mswjs/*` ve polyfill'ler boş modüle yönlendirilir.
  2. msw'nin istediği `path-to-regexp`, msw'nin kendi v6 kopyasına sabitlenir.
- **Zincir düzenlenirken ekleme yapılır.** Tek React pini bozulmamalıdır.

## 9. Açık kararlar ({{TBD}})

| Konu | Durum |
|---|---|
| Uzun listeler | Eski kural "`ScrollView` + `map` yasak, `FlatList`/`FlashList` kullan" diyordu. Bugün `ScrollView` 62 dosyada, `FlatList` 1 dosyada kullanılıyor. Kural geçerli mi? {{TBD}} |
| Görseller | `expo-image` bağımlılık listesinde var ama import edilmiyor. `react-native`'in `Image` bileşeni 2 dosyada kullanılıyor. Tercih {{TBD}} |
| Mobil test çalıştırıcısı | Yok. Kurulacak mı? {{TBD}} |
| `mobileBoundaries` lint kuralının bağlanması | {{TBD}} |
| Prod Firebase dosyaları ve prod derleme hattı (EAS yok) | {{TBD}} |

## 10. Eski belgelerden alınmayanlar

| Eski iddia (`docs/documents/mobile/*`) | Bugünkü gerçek |
|---|---|
| React Navigation v7, typed ParamList, `RootNavigator` rol yönlendirmesi, "Expo Router yasak" | Expo Router |
| NativeWind v4 `className`, `npm run sync-theme` ile web Tailwind config kopyası | `tokens.ts` + `style` |
| `expo-notifications` + `setNotificationHandler` | `@react-native-firebase/messaging` |
| i18n key, "hardcoded Türkçe yasak" | Metinler doğrudan Türkçe |
| jest, `npm test` | Test çalıştırıcı yok |
| React Hook Form `Controller` zorunluluğu | RHF yok |
| Tenant renk özelleştirmesi, dark mode kuralları | Kodla doğrulanmadı |
| `apps/mobile/CLAUDE.md` § "Ancestor: oksis-mobile" | Emekli repo. Bu belgeye taşınmadı. |
