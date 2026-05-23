# OKSİS — Mobile Navigation Rules

> React Navigation v7 · Typed ParamList · Role-based stacks

---

## Stack Mimarisi

```
RootNavigator
├── AuthStack (giriş yapılmamış)
│   ├── Login
│   └── ForgotPassword
├── TeacherStack (role === 'Teacher')
│   ├── TeacherTabs (Bottom Tab)
│   │   ├── Dashboard
│   │   ├── Schedule
│   │   ├── Attendance (Tab)
│   │   └── Announcements
│   └── Modal ekranlar (stack üstüne)
│       ├── AttendanceDetail
│       └── AnnouncementDetail
├── ParentStack (role === 'Parent')
│   ├── ParentTabs
│   │   ├── Dashboard
│   │   ├── Children (öğrenci listesi)
│   │   └── Announcements
│   └── StudentReport
└── StudentStack (role === 'Student')
    ├── StudentTabs
    │   ├── Dashboard
    │   ├── Schedule
    │   └── Announcements
    └── GradeDetail
```

---

## ParamList Tanımları (Tam)

```typescript
// src/navigation/types.ts

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Teacher: NavigatorScreenParams<TeacherStackParamList>;
  Parent: NavigatorScreenParams<ParentStackParamList>;
  Student: NavigatorScreenParams<StudentStackParamList>;
};

export type AuthStackParamList = {
  Login: undefined;
  ForgotPassword: { email?: string };
};

export type TeacherTabParamList = {
  Dashboard: undefined;
  Schedule: undefined;
  AttendanceTab: undefined;
  Announcements: undefined;
};

export type TeacherStackParamList = {
  TeacherTabs: NavigatorScreenParams<TeacherTabParamList>;
  AttendanceDetail: { scheduleId: string; date: string };
  AnnouncementDetail: { announcementId: string };
};

export type ParentTabParamList = {
  Dashboard: undefined;
  Children: undefined;
  Announcements: undefined;
};

export type ParentStackParamList = {
  ParentTabs: NavigatorScreenParams<ParentTabParamList>;
  StudentReport: { studentId: string };
  AnnouncementDetail: { announcementId: string };
};

export type StudentTabParamList = {
  Dashboard: undefined;
  Schedule: undefined;
  Announcements: undefined;
};

export type StudentStackParamList = {
  StudentTabs: NavigatorScreenParams<StudentTabParamList>;
  GradeDetail: { courseId: string; termId: string };
  AnnouncementDetail: { announcementId: string };
};
```

---

## RootNavigator — Rol Yönlendirme

```tsx
// src/navigation/RootNavigator.tsx
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '@/features/auth/store';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const user = useAuthStore((s) => s.user);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : user.role === 'Teacher' ? (
          <Stack.Screen name="Teacher" component={TeacherNavigator} />
        ) : user.role === 'Parent' ? (
          <Stack.Screen name="Parent" component={ParentNavigator} />
        ) : (
          <Stack.Screen name="Student" component={StudentNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

---

## Deep Link Yapılandırması

```typescript
// src/navigation/linking.ts
export const linking = {
  prefixes: ['oksis://', 'https://app.oksis.com'],
  config: {
    screens: {
      Teacher: {
        screens: {
          TeacherTabs: {
            screens: {
              Announcements: 'teacher/announcements',
            },
          },
          AnnouncementDetail: 'teacher/announcements/:announcementId',
        },
      },
      Parent: {
        screens: {
          ParentTabs: {
            screens: {
              Announcements: 'parent/announcements',
            },
          },
        },
      },
    },
  },
};
```

---

## Ekran Başlıkları

```typescript
// Header başlıkları i18n key ile:
<Stack.Screen
  name="AnnouncementDetail"
  component={AnnouncementDetailScreen}
  options={{ title: t('announcements.detail.title'), headerShown: true }}
/>
```

Hardcoded string yasak.

---

## Kurallar

1. `navigate()` çağrısında her zaman `params` tipli olmalı — `any` yasak.
2. `goBack()` yerine mümkünse `navigation.navigate(öncekiEkran)` kullan (kontrolsüz back yığın karmaşasına yol açar).
3. Modal ekranlar `presentation: 'modal'` ile açılmalı.
4. `useRoute<RouteProp<ParamList, 'EkranAdı'>>()` ile route params okunmalı.
5. Navigation ref (`navigationRef`) global state'te tutulmamalı — `useNavigation()` hook'u tercih.
