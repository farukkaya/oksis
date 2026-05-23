# OKSİS — Mobile Coding Standards

> Stack: React Native + Expo SDK 53+ · TypeScript (strict) · NativeWind v4 · React Navigation v7 · TanStack React Query v5 · Zustand · React Hook Form + Zod · expo-secure-store · expo-notifications

---

## TypeScript Konfigürasyonu

```jsonc
// tsconfig.json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

Tüm dosyalar `.tsx` (JSX içeren) veya `.ts` (saf logic) olmalı. `any` yasak — gerekirse `unknown` kullan.

---

## Klasör Yapısı

```
oksis-mobile/
├── app/                        # Expo Router (varsa)
├── src/
│   ├── app/                    # App entry, providers
│   │   └── index.tsx
│   ├── navigation/             # React Navigation stacks
│   │   ├── RootNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   ├── TeacherNavigator.tsx
│   │   ├── ParentNavigator.tsx
│   │   ├── StudentNavigator.tsx
│   │   └── types.ts            # ParamList tanımları
│   ├── screens/
│   │   ├── auth/               # Login, ForgotPassword
│   │   ├── teacher/            # Öğretmen ekranları
│   │   ├── parent/             # Veli ekranları
│   │   └── student/            # Öğrenci ekranları
│   ├── features/               # Domain logic (hooks + store dilimler)
│   │   ├── auth/
│   │   ├── announcements/
│   │   ├── schedule/
│   │   └── ...
│   ├── shared/
│   │   ├── components/         # OksisButton, OksisCard, vb.
│   │   ├── hooks/              # useAuth, useApiClient, vb.
│   │   ├── api/                # axios instance + interceptors
│   │   ├── store/              # Zustand stores
│   │   └── utils/
│   └── assets/
├── tailwind.config.js          # Web ile AYNI dosya (symlink veya kopyala)
├── babel.config.js
└── app.json
```

---

## Stillendirme: NativeWind v4

### Temel Kural

`StyleSheet.create` **yasak**. Tüm stiller `className` prop üzerinden NativeWind ile.

```tsx
// ✅ Doğru
<View className="flex-1 bg-white p-4">
  <Text className="text-brand-600 text-lg font-semibold">Başlık</Text>
</View>

// ❌ Yanlış
const styles = StyleSheet.create({ container: { flex: 1 } });
<View style={styles.container} />
```

### Design Token Paylaşımı

`tailwind.config.js` web ile **birebir aynı** olmalı. Sembolik link veya build script ile kopyala:

```js
// tailwind.config.js (web ile ortak)
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { 50:'#eff6ff', 100:'#dbeafe', 200:'#bfdbfe', 300:'#93c5fd',
                  400:'#60a5fa', 500:'#3b82f6', 600:'#2563eb', 700:'#1d4ed8',
                  800:'#1e40af', 900:'#1e3a8a' },
        neutral: { /* slate paleti */ },
        success: { /* green paleti */ },
        warning: { /* amber paleti */ },
        danger:  { /* red paleti */ },
      },
      fontFamily: {
        sans: ['Inter_400Regular'],
        medium: ['Inter_500Medium'],
        semibold: ['Inter_600SemiBold'],
        bold: ['Inter_700Bold'],
      },
    },
  },
  plugins: [],
};
```

### Responsive / Platform

```tsx
import { Platform } from 'react-native';

// Platform koşulları için className birleştirme
const containerClass = Platform.OS === 'ios' ? 'pt-14' : 'pt-10';
<View className={`flex-1 ${containerClass}`} />
```

---

## React Navigation v7 — Typed Navigation

### ParamList Tanımları

```typescript
// src/navigation/types.ts
export type RootStackParamList = {
  Auth: undefined;
  Teacher: undefined;
  Parent: undefined;
  Student: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  ForgotPassword: { email?: string };
};

export type TeacherStackParamList = {
  Dashboard: undefined;
  Schedule: undefined;
  Attendance: { classId: string; date: string };
  AnnouncementDetail: { announcementId: string };
};

export type ParentStackParamList = {
  Dashboard: undefined;
  StudentReport: { studentId: string };
  AnnouncementDetail: { announcementId: string };
};
```

### Typed useNavigation / useRoute

```typescript
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Her ekranda yerel typed hook tanımla:
type Nav = NativeStackNavigationProp<TeacherStackParamList, 'Schedule'>;
const navigation = useNavigation<Nav>();

// Navigasyon çağrısı type-safe:
navigation.navigate('Attendance', { classId: 'abc', date: '2024-09-01' });
```

---

## Veri Fetching: React Query v5

```typescript
// src/shared/api/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,         // 5 dakika
      gcTime: 24 * 60 * 60 * 1000,      // 24 saat (offline cache)
      networkMode: 'offlineFirst',        // çevrimdışı desteği
      retry: 2,
    },
  },
});
```

### Query Key Fabrika

```typescript
// src/features/announcements/queries.ts
export const announcementKeys = {
  all: ['announcements'] as const,
  list: () => [...announcementKeys.all, 'list'] as const,
  detail: (id: string) => [...announcementKeys.all, id] as const,
};

export function useAnnouncements() {
  return useQuery({
    queryKey: announcementKeys.list(),
    queryFn: () => announcementApi.getAll(),
  });
}
```

---

## State Yönetimi: Zustand + expo-secure-store

```typescript
// src/features/auth/store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';

const secureStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserDto | null;
  setTokens: (access: string, refresh: string) => void;
  setUser: (user: UserDto) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setTokens: (access, refresh) => set({ accessToken: access, refreshToken: refresh }),
      setUser: (user) => set({ user }),
      logout: () => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    {
      name: 'oksis-auth',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);
```

**Kural:** `AsyncStorage` token için **kesinlikle yasak**. `expo-secure-store` zorunlu.

---

## Formlar: React Hook Form + Zod

```typescript
// Controller kullan, register kullanma (Native'de ref çalışmaz)
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Geçerli e-posta girin'),
  password: z.string().min(8, 'En az 8 karakter'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginScreen() {
  const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  return (
    <Controller
      control={control}
      name="email"
      render={({ field: { onChange, value } }) => (
        <OksisInput
          label="E-posta"
          value={value}
          onChangeText={onChange}
          error={errors.email?.message}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      )}
    />
  );
}
```

---

## API Client

```typescript
// src/shared/api/client.ts
import axios from 'axios';
import { useAuthStore } from '@/features/auth/store';

export const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — JWT ekleme
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor — 401 → refresh → retry
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      // refresh token flow...
    }
    return Promise.reject(error);
  }
);
```

---

## Push Bildirimleri

```typescript
// src/app/index.tsx — tek bir yerde register et
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});
```

Handler'ı birden fazla yerde tanımlama. Tüm bildirim mantığı `src/features/notifications/` altında.

---

## Liste Render Kuralı

```tsx
// ✅ Doğru — FlatList
<FlatList
  data={items}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => <AnnouncementCard item={item} />}
/>

// ❌ Yasak — ScrollView içinde map
<ScrollView>
  {items.map((item) => <AnnouncementCard key={item.id} item={item} />)}
</ScrollView>
```

`SectionList`, `FlashList` (@shopify/flash-list) da kabul edilir.

---

## Görseller

```tsx
import { Image } from 'expo-image';

// ✅ Doğru
<Image source={{ uri: user.avatarUrl }} className="w-12 h-12 rounded-full" />

// ❌ Yasak
import { Image } from 'react-native'; // performans sorunu
```

---

## Animasyon

`react-native-reanimated` kullan. `Animated` API (core RN) sadece basit opacity/translate için kabul edilir.

---

## Erişilebilirlik

- Her tıklanabilir element min **44×44 px** touch target.
- `accessibilityLabel` zorunlu ikonlarda.
- `accessibilityRole` buton, link, header elementlerinde.

---

## i18n

Web ile aynı anahtar seti. `i18next` + `react-i18next` kullan. Hardcoded Türkçe string **yasak**.

```typescript
import { useTranslation } from 'react-i18next';
const { t } = useTranslation();
<Text>{t('announcements.title')}</Text>
```

---

## Test

- **Unit/Integration**: Jest + `@testing-library/react-native`
- **E2E**: Maestro (`.maestro/` klasörü altında YAML flow'lar)
- Her ekranda en az 1 render test.

---

## Yasaklar Özeti

| Yasak | Alternatif |
|-------|-----------|
| `StyleSheet.create` | `className` (NativeWind) |
| `AsyncStorage` (token) | `expo-secure-store` |
| `ScrollView` + `map` | `FlatList` / `FlashList` |
| `react-native` `Image` | `expo-image` |
| `register` (RHF) | `Controller` |
| `async void` | `async` + proper error handling |
| Hardcoded Türkçe string | i18n key |
| `any` type | `unknown` + type guard |
| `expo-router` page router | React Navigation (proje standardı) |
