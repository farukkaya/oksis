# OKSİS — Mobile Theming Rules

> NativeWind v4 · Web ile ortak design token · Tenant renk özelleştirme

---

## Design Token Paylaşım Stratejisi

Web ve mobile **aynı renk paletini** kullanır. `tailwind.config.js` tek kaynak.

```
oksis-web/
└── tailwind.config.js          ← Kaynak dosya

oksis-mobile/
└── tailwind.config.js          ← Kopyala veya symlink
```

CI/CD'de veya `postinstall` script'te web config'i mobile'a kopyala:

```json
// oksis-mobile/package.json
{
  "scripts": {
    "sync-theme": "cp ../oksis-web/tailwind.config.js ./tailwind.config.js"
  }
}
```

---

## Renk Paleti (Kaynak)

```js
// tailwind.config.js
colors: {
  brand: {
    50:  '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',   // Primary CTA
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  neutral: {
    50:  '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  success: {
    50: '#f0fdf4', 100: '#dcfce7', 500: '#22c55e', 600: '#16a34a', 700: '#15803d',
  },
  warning: {
    50: '#fffbeb', 100: '#fef3c7', 500: '#f59e0b', 600: '#d97706', 700: '#b45309',
  },
  danger: {
    50: '#fff1f2', 100: '#ffe4e6', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c',
  },
  info: {
    50: '#f0f9ff', 100: '#e0f2fe', 500: '#0ea5e9', 600: '#0284c7', 700: '#0369a1',
  },
}
```

---

## Tipografi

```js
// tailwind.config.js — fontFamily
fontFamily: {
  sans:     ['Inter_400Regular'],
  medium:   ['Inter_500Medium'],
  semibold: ['Inter_600SemiBold'],
  bold:     ['Inter_700Bold'],
}
```

### Kullanım

```tsx
<Text className="font-semibold text-lg text-neutral-900">Başlık</Text>
<Text className="font-sans text-sm text-neutral-600">Açıklama</Text>
```

### Web ↔ Mobile Karşılıkları

| Web (Tailwind) | Mobile (NativeWind) | Kullanım |
|---------------|---------------------|---------|
| `text-2xl font-semibold` | `text-2xl font-semibold` | H1 / Sayfa başlığı |
| `text-xl font-semibold` | `text-xl font-semibold` | H2 / Bölüm başlığı |
| `text-lg font-medium` | `text-lg font-medium` | H3 / Kart başlığı |
| `text-sm` | `text-sm` | Body |
| `text-xs` | `text-xs` | Caption / Hint |

---

## Spacing (4px Grid)

Tailwind'in varsayılan spacing scale'i kullan:

```tsx
// 4px = p-1, 8px = p-2, 12px = p-3, 16px = p-4
<View className="p-4 gap-3 m-2" />
```

Hardcoded sayısal spacing yasak:
```tsx
// ❌ Yanlış
<View style={{ padding: 16, marginTop: 8 }} />

// ✅ Doğru
<View className="p-4 mt-2" />
```

---

## Tenant Renk Özelleştirme

Tenant'ın `primaryColor` değeri, brand-600 rengi olarak runtime'da uygulanır.

```tsx
// src/shared/hooks/useTenantTheme.ts
import { useAuthStore } from '@/features/auth/store';

export function useTenantTheme() {
  const tenant = useAuthStore((s) => s.user?.tenant);
  // primaryColor CSS custom property olarak döner
  // NativeWind v4 CSS variables desteği ile kullanılabilir
  return { primaryColor: tenant?.primaryColor ?? '#2563eb' };
}
```

> **Not:** NativeWind v4 CSS custom property desteği ile `style={{ '--color-brand-600': primaryColor }}` pattern çalışabilir. Uygulamada test et.

---

## Dark Mode

MVP kapsamında **dark mode yok**. Gelecekte eklenecekse `colorScheme` hook ile yapılacak.

```typescript
// Şimdilik hardcode light:
import { useColorScheme } from 'react-native';
// Kullanma — her şey light theme.
```

---

## SafeArea

```tsx
import { SafeAreaView } from 'react-native-safe-area-context';

// Tüm root ekranlar SafeAreaView ile sarılmalı:
<SafeAreaView className="flex-1 bg-neutral-50">
  {/* ... */}
</SafeAreaView>
```

`react-native` core'dan gelen `SafeAreaView` yasak, `react-native-safe-area-context` kullan.

---

## Shadow / Elevation

```tsx
// iOS shadow + Android elevation NativeWind ile:
<View className="shadow-sm">      // iOS: küçük gölge
<View className="shadow-md">      // iOS: orta gölge
<View className="shadow-lg">      // iOS: büyük gölge

// Android elevation manuel:
// NativeWind v4 elevation sınıflarını destekliyorsa kullan,
// aksi takdirde: style={{ elevation: 4 }}
```
