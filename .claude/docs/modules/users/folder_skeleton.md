# Users Module — Frontend File Skeleton

> `src/app/pages/admin/users/` klasörünün dosya yapısı ve sorumlulukları.

---

## Klasör Ağacı

```
src/app/pages/admin/users/
├── index.ts                        # Barrel export
├── UserManagement.tsx              # Coordinator (~145 satır)
├── types.ts                        # Sayfa-yerel UI tipleri
├── UserMetricCards.tsx             # Metrik kartları bölümü
├── UserTabBar.tsx                  # Sekme çubuğu (Öğrenci / Öğretmen / Veli)
├── UserToolbar.tsx                 # Arama, filtre, dışa/içe aktarma, toplu işlem çubuğu
├── UserDataTable.tsx               # Tablo wrapper (loading/error/empty + pagination)
├── UserTableRow.tsx                # Tekil tablo satırı + aksiyon butonları
├── AddUserModal.tsx                # Yeni kullanıcı ekleme diyaloğu
├── EditUserModal.tsx               # Kullanıcı düzenleme diyaloğu
├── ExcelImportModal.tsx            # 4 adımlı Excel import sihirbazı
├── ChangeBranchModal.tsx           # Şube değiştirme diyaloğu
├── DeleteUserDialog.tsx            # Silme onay diyaloğu
├── hooks/
│   └── useUserManagementPage.ts   # Tüm sayfa state, filtre, handler'lar (~730 satır)
└── utils/
    └── getStatusBadge.tsx         # Durum badge render fonksiyonu
```

---

## Dosya Sorumlulukları

### `index.ts`
Barrel export. Route import yolunun (`./pages/admin/users`) değişmeden çalışmasını sağlar.

### `UserManagement.tsx` — Coordinator
- `useUserManagementPage()` hook'unu çağırır.
- Tüm alt bileşenleri props ile birleştirir.
- Sayfa başlığı, breadcrumb ve "Kullanıcı Ekle" butonunu içerir.
- Kendi içinde iş mantığı veya state **barındırmaz**.

### `types.ts`
- `UserFormData`, `UserFormErrors` — form state tipleri.
- `ColumnMappings`, `MappingErrors` — Excel import sütun eşleme tipleri.
- `ImportPreviewRow` — import önizleme satır tipi.
- `@/features/user-management` modülünden ortak tipleri re-export eder.

### `UserMetricCards.tsx`
- Toplam öğrenci, öğretmen, veli sayılarını 4 metrik kartla gösterir.
- Props: `studentCount`, `teacherCount`, `parentCount`.

### `UserTabBar.tsx`
- "Öğrenciler", "Öğretmenler", "Veliler" sekmeleri.
- Props: `activeTab`, `onTabChange`.

### `UserToolbar.tsx`
- Arama inputu, sınıf/durum filtreleri.
- Excel import ve toplu işlem (davet/sil) butonları.
- Seçili satır sayısına göre toplu işlem çubuğu gösterir.
- Props: arama/filtre state + handler'lar, `selectedRowsCount`, `onImport`, `onBulkInvite`, `onBulkDelete`.

### `UserDataTable.tsx`
- Loading skeleton, hata durumu, boş durum (empty state) yönetimi.
- Tablo başlık satırı (checkbox + kolon isimleri).
- Aktif sekmeye göre `UserTableRow` bileşenlerini listeler.
- Pagination footer.
- Props: veri dizileri, filtrelenmiş/sayfalanmış veri, seçim state'i, sayfa state'i, aksiyon callback'leri.

### `UserTableRow.tsx`
- Tek bir kullanıcı satırını render eder.
- Aktif sekmeye (`students` / `teachers` / `parents`) göre farklı kolonlar gösterir.
- Satır aksiyonları: düzenle, davet gönder, sil, şube değiştir.
- Props: `user`, `activeTab`, `isSelected`, aksiyon callback'leri.

### `AddUserModal.tsx`
- Kullanıcı tipi seçimi (Öğrenci / Öğretmen / Veli).
- Seçime göre koşullu form alanları.
- Validasyon hataları ve kaydet/iptal footer'ı.
- Props: modal state, form state, `onFieldChange`, `onSave`, `isFormValid`.

### `EditUserModal.tsx`
- Düzenlenen kullanıcının mevcut verileriyle dolu form.
- Kullanıcı tipine göre koşullu alanlar.
- Props: modal state, `editingUser`, form state, `onFieldChange`, `onSave`.

### `ExcelImportModal.tsx`
- 4 adımlı sihirbaz:
  1. Kullanıcı tipi seçimi
  2. Dosya yükleme + şablon indirme
  3. Sütun eşleme
  4. Önizleme + import
- Props: tüm adım state'leri, dosya/mapping/preview verileri, adım navigasyon callback'leri.

### `ChangeBranchModal.tsx`
- Öğrencinin mevcut şube bilgisini gösterir.
- Yeni şube seçici ve uyarı bildirimi.
- Aynı şube seçilirse hata mesajı.
- Props: modal state, `student`, `selectedNewBranch`, `onBranchChange`, `onSave`.

### `DeleteUserDialog.tsx`
- AlertDialog ile silme onayı.
- "Bu işlem geri alınamaz" uyarısı.
- Props: `open`, `onOpenChange`, `onConfirm`.

### `hooks/useUserManagementPage.ts`
- Sayfa seviyesindeki **tüm** state ve handler mantığını barındırır.
- React Query hook'ları (`useStudents`, `useTeachers`, `useParents`) + mutation hook'ları.
- Sekme, arama, filtre, seçim, sayfalama state'leri.
- Form state (ekleme/düzenleme), validasyon, Excel import state.
- Modal açma/kapama handler'ları.
- Tek bir nesne olarak tüm değerleri ve callback'leri döner.

### `utils/getStatusBadge.tsx`
- `UserStatus` enum değerine göre renkli badge JSX döner.
- `active` → yeşil, `inactive` → gri, `pending` → sarı, vb.

---

## Veri Akışı

```
useUserManagementPage (hook)
        │
        ▼
UserManagement (coordinator) ── props ──► Alt bileşenler
        │
        ├── UserMetricCards
        ├── UserTabBar
        ├── UserToolbar
        ├── UserDataTable ──► UserTableRow (×N)
        ├── AddUserModal
        ├── EditUserModal
        ├── ExcelImportModal
        ├── ChangeBranchModal
        └── DeleteUserDialog
```

- Tüm state ve handler'lar **tek hook**'ta merkezileştirilmiştir.
- Alt bileşenler yalnızca props üzerinden veri alır ve callback çağırır.
- Alt bileşenler arası doğrudan iletişim **yoktur**.

---

## İlişkili Feature Modülü

```
src/features/user-management/
├── api/          # React Query hook'ları (useStudents, useTeachers, useParents, mutation'lar)
├── types/        # Shared tipler (Student, Teacher, Parent, UserStatus)
└── index.ts      # Barrel export
```

`hooks/useUserManagementPage.ts` bu modülden API hook'larını ve tipleri import eder.
