# {{MODULE_NAME_TR}} — UI Flows

> Bu modülün frontend ekranları, kullanıcı akışları, state management.

> Genel UI/UX kuralları için bkz. `frontend/ui-ux-rules.md` ve `frontend/component-rules.md`.

> **Konvansiyon:** Bu dosya hem web hem mobile akışını barındırır. Aşağıdaki "Web Flow" ve "Mobile Flow" alt başlıkları altında ayrı yaz. Ayrı `ui-flows-web.md` / `ui-flows-mobile.md` dosyası **AÇMA** — modül cross-tier iş kavramı, tek dosyada tutmak drift'i engeller. Modül admin-only ise sadece "Web Flow" başlığını doldur; "Mobile Flow" başlığını "Bu modül {{TBD: web|mobile}}-only" notuyla geç.

---

## Web Flow

### Sayfa Lokasyonu

Frontend: `oksis-web/src/portals/{{TBD: admin|teacher|parent|student}}/{{MODULE_SLUG}}/`

### Ekranlar

#### Liste — `{{TBD_route}}`

**Portal:** admin | teacher | parent | student
**Permission:** `{{MODULE_SLUG}}.view`
**Component:** `{{TBD_ComponentName}}`
**Konum:** `src/modules/{{MODULE_SLUG}}/pages/{{TBD_ComponentName}}.tsx`

**State:**
- Server: `use{{MODULE_NAME_CODE}}sQuery` (TanStack Query)
- Local: filter, search, pagination (URL params)

**Aksiyonlar:**
- "Yeni Ekle" → `{{TBD_route}}/new`
- Row click → detay sayfası

**Edge Case'ler:**
- Boş liste → EmptyState component
- Hata → ErrorState + retry
- Loading → Skeleton (Spinner değil)

---

#### Detay / Düzenle — `{{TBD_route}}/:id`

{{TBD}}

---

#### Yeni Ekle — `{{TBD_route}}/new`

{{TBD}}

---

### Web Kullanıcı Akışı

```
[Liste] → "Yeni Ekle" → [Form] → submit
                                    ↓
                              validation OK?
                              ├── Hayır: form'da hata göster
                              └── Evet: API call
                                          ↓
                                    success?
                                    ├── Hayır: toast error
                                    └── Evet: toast + liste yenile
```

---

## Mobile Flow

> Modül mobile-only değilse de mobile tarafı varsa burayı doldur. Mobile akış web'le aynı user journey'in cihaz varyantıdır — farklılıklar (navigation, sticky action, 3-tap optimizasyonu, keyboard overlap) burada netleşir.

### Sayfa Lokasyonu

Mobile: `oksis-mobile/src/features/{{MODULE_SLUG}}/`

### Ekranlar

#### {{TBD_ScreenName}}

**Stack:** {{TBD: TeacherStack|ParentStack|StudentStack}}
**Permission:** `{{MODULE_SLUG}}.view`
**Component:** `{{TBD_ScreenName}}.tsx`
**Konum:** `src/features/{{MODULE_SLUG}}/screens/{{TBD_ScreenName}}.tsx`

**State:**
- Server: `use{{MODULE_NAME_CODE}}sQuery` (TanStack Query, tenant prefix key)
- Local: filter, scroll position

**Mobil-Spesifik Notlar:**
- 3-tap kuralı uygulanır mı? {{TBD}}
- Sticky action button gerekli mi (SafeAreaView)? {{TBD}}
- Keyboard overlap (`KeyboardAvoidingView`)? {{TBD}}
- FlatList/FlashList kullanımı (ScrollView+map YASAK)? {{TBD}}
- expo-image (RN Image YASAK)? {{TBD}}

---

### Mobile Kullanıcı Akışı

```
[Tab/Stack] → [Screen] → user action → mutation
                                          ↓
                                    optimistic update? (varsa)
                                          ↓
                                    success: toast + invalidate query
                                    error:   rollback + toast
```

---

## Form Validation (Web + Mobile ortak)

```ts
// Zod schema — hem web (RHF) hem mobile (RHF) tarafından kullanılır
const {{TBD}}Schema = z.object({
  {{TBD}}: z.string().min(1, "Zorunlu").max(100),
  {{TBD}}: z.{{TBD}},
});
```

> Schema `oksis/.claude/docs/modules/{{MODULE_SLUG}}/`'a yazılır; her iki client kopyalar veya shared/ üzerinden import eder.

---

## i18n Key'leri

| Key | TR |
|---|---|
| `{{MODULE_SLUG}}.title` | {{TBD}} |
| `{{MODULE_SLUG}}.empty` | Henüz {{TBD}} eklenmemiş |
| `{{MODULE_SLUG}}.errors.required` | Bu alan zorunludur |

---

## Yasaklar

- ❌ Web tarafında Spinner (Skeleton kullan).
- ❌ Hardcoded Türkçe string (i18n key zorunlu).
- ❌ Form'da Zod olmadan validation.
- ❌ Web'de `getByTestId` testlerde (Role + Text bazlı sorgular).
- ❌ Mobile'da `StyleSheet.create` (NativeWind `className` kullan).
- ❌ Mobile'da `AsyncStorage` token (expo-secure-store).
- ❌ Mobile'da `ScrollView + map` liste için (FlatList/FlashList).
- ❌ **Ayrı `ui-flows-web.md` / `ui-flows-mobile.md` dosya açma** — bu dosya iki tier'ı tek tutar.

> Detay: `frontend/component-rules.md`, `frontend/form-validation-rules.md`, `mobile/component-rules.md`.
