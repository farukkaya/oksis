# Okul Ayarları — UI Flows

> Sayfa listesi, kullanıcı akışı, sekme bazlı component organizasyonu.

> Genel UX kuralları: `frontend/ui-ux-rules.md`. Form: `frontend/form-validation-rules.md`.

---

## Sayfa Lokasyonu

Frontend: `oksis-web/src/portals/admin/settings/`

- `SettingsPage.tsx` — Sekme container (tabs root)
- `components/` — Her sekme için ayrı component:
  - `BasicInfoTab.tsx`
  - `ContactInfoTab.tsx`
  - `AddressTab.tsx`
  - `ThemeTab.tsx`
  - `BellScheduleTab.tsx`
  - `HolidayTab.tsx` + `HolidayFormModal.tsx`
  - `ModuleConfigTab.tsx`
  - `NotificationConfigTab.tsx`

---

## Erişim & Navigasyon

- **URL:** `/admin/settings` (default sekme: Genel Bilgi)
- **Sidebar item:** Admin sidebar'da "Okul Ayarları"; `<PermissionGate permission="school-settings.view">` ile koşullu render
- **Sekme state URL'de:** `?tab=basic|contact|address|theme|bell|holidays|modules|notifications` — refresh sonrası ve paylaşılabilir link için

---

## Sekme Akışları

### 1. Genel Bilgi (Default)

**İzin:** `school-settings.view` + `school-settings.update-basic`

Form alanları:
- Resmi ad (`OfficialName`)
- MEB kodu (`MebCode`)
- Vergi numarası (`TaxNumber`)
- Vergi dairesi (`TaxOffice`)

Kaydet butonu sticky bottom (mobile) veya footer (desktop). `useUpdateBasicInfo` mutation; başarı → toast + sekme reload.

### 2. İletişim

**İzin:** `school-settings.view` + `school-settings.update-contact`

Form: Telefon, faks, e-posta, web sitesi. Validasyon zod schemas: `phoneSchema`, `emailSchema`, `urlSchema`.

### 3. Adres

**İzin:** `school-settings.view` + `school-settings.update-address`

Cascade selectbox (ülke → il → ilçe → mahalle) + açık adres + posta kodu. Lookup veriler `countries`, `provinces`, `districts`, `neighborhoods` master tablolarından gelir. Her seviyenin değişimi bir alt seviyeyi reset eder.

### 4. Tema

**İzin:** `school-settings.view` + `school-settings.update-theme` + `school-settings.upload-logo`

- Logo: drag&drop FileInput (2 MB limit, png/jpg/webp) → `UploadLogo` endpoint
- Logo sil butonu → `DeleteLogo`
- Renk seçici (primary + secondary, hex) — live preview
- Favicon URL (text input)

### 5. Zil Programı (Bell Schedule)

**İzin:** `school-settings.view` + `school-settings.manage-bell`

DataGrid + inline add/edit/delete + drag-drop sıralama. Sıralama tamamlandığında `BulkCreateBellSchedules` ile toplu save.

Slot tipleri: Lesson (ders), Break (teneffüs), Lunch (öğle).

### 6. Tatiller

**İzin:** `school-settings.view` + `school-settings.manage-holidays`

Takvim view + DataGrid view toggle. Resmi tatiller (`official_holidays`) gri badge ile read-only; okul tatilleri (`school_holidays`) editable.

`HolidayFormModal`: title, tarih(ler), tip (PublicHoliday/SchoolEvent/ClosedDay), isRecurring, description.

### 7. Modüller

**İzin:** `school-settings.view` + `school-settings.manage-modules`

6 satır toggle UI. Plan kısıtlı modüller (`PlanRestricted = true`) — kilit ikonu + "Premium" badge + toggle disabled. `UpdateModuleConfig` mutation **PATCH** `/modules/{moduleKey}`.

### 8. Bildirimler

**İzin:** `school-settings.view` + `school-settings.manage-notifications`

Global `notification_types` listesi tablo halinde; her satırda kanal checkbox'ları (Push/Email/SMS/InApp) + cooldown override + quiet hours toggle. Save → `UpdateNotificationConfig`.

---

## React Query Cache Keys

```ts
schoolSettingsKeys = {
  all: ['school-settings'],
  detail: () => [...all, 'detail'],
  bellSchedules: () => [...all, 'bell-schedules'],
  holidays: (year?: number) => [...all, 'holidays', { year }],
  moduleConfigs: () => [...all, 'module-configs'],
  notificationConfig: () => [...all, 'notification-config'],
  publicBranding: (tenantCode: string) => [...all, 'public-branding', tenantCode],
}
```

Her mutation success → ilgili key invalidate. Detay: `frontend/state-management-rules.md`.

---

## Loading / Empty / Error

- **Loading:** Sekme switch'te skeleton; ilk yüklemede page-level skeleton.
- **Empty:** Bell/Holiday/NotificationConfig — boş listede CTA ("İlk zil saati ekle" vb).
- **Error:** Section-level ErrorCard + retry; 403 → "Bu sekmeyi görmeye yetkiniz yok".

---

## Public Branding Akışı

Login öncesi tenant logo + tema:

```
LoginPage mount
   └─► X-Tenant-Code header (URL/subdomain)
        └─► GET /api/v1/school-settings/public
             └─► Logo + tema renkleri uygulanır
                  └─► usePublicBranding hook (no auth)
```

Hata durumunda default OKSİS branding.
