# OKSİS — Mobile Component Rules

> NativeWind v4 · Atomic design · Web ile paralel component isimleri

---

## Genel Kurallar

1. **Named export** zorunlu, default export yasak (barrel import için).
2. **Single responsibility**: Her component tek bir işi yapar.
3. Component dosya adı PascalCase, hook dosya adı `use` prefix camelCase.
4. `src/shared/components/` — tüm roller tarafından kullanılan ortak bileşenler.
5. `src/screens/<role>/components/` — yalnızca o role özel bileşenler.

---

## Temel Shared Bileşenler

### OksisButton

```tsx
// src/shared/components/OksisButton.tsx
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface OksisButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
}

const variantClass: Record<ButtonVariant, string> = {
  primary:   'bg-brand-600 active:bg-brand-700',
  secondary: 'bg-white border border-neutral-300 active:bg-neutral-50',
  danger:    'bg-danger-600 active:bg-danger-700',
  ghost:     'bg-transparent active:bg-neutral-100',
};

const labelClass: Record<ButtonVariant, string> = {
  primary:   'text-white font-semibold',
  secondary: 'text-neutral-700 font-semibold',
  danger:    'text-white font-semibold',
  ghost:     'text-brand-600 font-semibold',
};

const sizeClass: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 rounded-lg',
  md: 'h-11 px-4 rounded-xl',
  lg: 'h-14 px-6 rounded-2xl',
};

export function OksisButton({
  label, onPress, variant = 'primary', size = 'md',
  loading = false, disabled = false, accessibilityLabel,
}: OksisButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={`flex-row items-center justify-center ${variantClass[variant]} ${sizeClass[size]} ${disabled ? 'opacity-50' : ''}`}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'primary' ? '#fff' : '#2563eb'} />
      ) : (
        <Text className={labelClass[variant]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}
```

### OksisInput

```tsx
// src/shared/components/OksisInput.tsx
import { View, Text, TextInput, TextInputProps } from 'react-native';

interface OksisInputProps extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
}

export function OksisInput({ label, error, hint, ...props }: OksisInputProps) {
  return (
    <View className="gap-1 mb-4">
      <Text className="text-sm font-medium text-neutral-700">{label}</Text>
      <TextInput
        className={`h-11 px-3 rounded-xl border text-sm text-neutral-900 bg-white ${
          error ? 'border-danger-500' : 'border-neutral-300 focus:border-brand-500'
        }`}
        placeholderTextColor="#94a3b8"
        {...props}
      />
      {error && <Text className="text-xs text-danger-600">{error}</Text>}
      {hint && !error && <Text className="text-xs text-neutral-500">{hint}</Text>}
    </View>
  );
}
```

### OksisCard

```tsx
// src/shared/components/OksisCard.tsx
import { View, ViewProps } from 'react-native';

interface OksisCardProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
}

export function OksisCard({ children, className = '', ...props }: OksisCardProps) {
  return (
    <View
      className={`bg-white rounded-2xl shadow-sm border border-neutral-100 p-4 ${className}`}
      {...props}
    >
      {children}
    </View>
  );
}
```

### OksisSkeleton

```tsx
// src/shared/components/OksisSkeleton.tsx
// Spinner kullanma — skeleton kullan
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';

interface OksisSkeletonProps {
  className?: string;
}

export function OksisSkeleton({ className = '' }: OksisSkeletonProps) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.3, { duration: 800 }), -1, true);
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={animStyle}
      className={`bg-neutral-200 rounded-lg ${className}`}
    />
  );
}
```

### OksisEmptyState

```tsx
// src/shared/components/OksisEmptyState.tsx
import { View, Text } from 'react-native';

interface OksisEmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function OksisEmptyState({ title, description, action }: OksisEmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center p-8 gap-3">
      <Text className="text-lg font-semibold text-neutral-700 text-center">{title}</Text>
      {description && (
        <Text className="text-sm text-neutral-500 text-center">{description}</Text>
      )}
      {action}
    </View>
  );
}
```

---

## Ekran Şablonu

```tsx
// src/screens/teacher/AnnouncementsScreen.tsx
import { View, FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import { OksisSkeleton, OksisEmptyState, OksisCard } from '@/shared/components';
import { useAnnouncements } from '@/features/announcements/queries';

export function AnnouncementsScreen() {
  const { t } = useTranslation();
  const { data, isLoading } = useAnnouncements();

  if (isLoading) {
    return (
      <View className="flex-1 p-4 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <OksisSkeleton key={i} className="h-20 w-full" />
        ))}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-neutral-50">
      <FlatList
        data={data?.items ?? []}
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-4 gap-3"
        ListEmptyComponent={
          <OksisEmptyState
            title={t('announcements.empty.title')}
            description={t('announcements.empty.description')}
          />
        }
        renderItem={({ item }) => (
          <OksisCard>
            {/* ... */}
          </OksisCard>
        )}
      />
    </View>
  );
}
```

---

## Yasaklar

| Yasak | Alternatif |
|-------|-----------|
| `<ActivityIndicator />` loading state için | `<OksisSkeleton />` |
| `TouchableHighlight` | `TouchableOpacity` veya `Pressable` |
| `<Text>` inline stil | `className` NativeWind |
| 2 farklı Button component | Tek `OksisButton` (variant prop) |
| Modal içinde Modal | Düz navigation stack |
| Direct `Alert.alert` | Toast component veya confirm modal |
