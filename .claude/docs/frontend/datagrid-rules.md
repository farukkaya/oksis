# DevExtreme DataGrid Kuralları

## 1. Neden Wrapper?

DevExtreme DataGrid OKSİS'te kullanıcı yönetimi, öğrenci listesi, devamsızlık raporları, ödev listesi gibi onlarca ekranda kullanılır. **Doğrudan** DevExtreme component'ini kullanmak YASAK; her zaman shared wrapper üzerinden:

```
src/shared/components/DataGrid/
├── DataGrid.tsx            # ana wrapper
├── DataGridToolbar.tsx     # toolbar (search, filter, add, export)
├── DataGridColumn.tsx      # type tanımları
├── columnRenderers.tsx     # ortak render fonksiyonları (badge, date, currency)
└── index.ts
```

## 2. Wrapper Kontrat

```tsx
<DataGrid<Student>
  dataSource={students}                       // veya { url, params } async modu
  keyExpr="id"
  columns={columns}
  pagination={{ enabled: true, pageSize: 50, pageSizes: [10, 25, 50, 100] }}
  selection={{ mode: 'multiple' }}
  toolbar={{
    title: 'Öğrenciler',
    search: true,
    filter: true,
    export: { excel: true, pdf: false },
    actions: [
      { label: 'Yeni Öğrenci', icon: <Plus />, onClick: ..., permission: 'student.create' },
    ],
  }}
  rowActions={[
    { label: 'Düzenle', icon: <Edit />, onClick: ..., permission: 'student.update' },
    { label: 'Sil', icon: <Trash />, onClick: ..., permission: 'student.delete', variant: 'danger', confirm: true },
  ]}
  onRowDblClick={(row) => navigate(`/students/${row.id}`)}
  emptyState={<EmptyState ... />}
  loading={isLoading}
  error={error}
/>
```

## 3. Column Tanımları

```tsx
const columns: DataGridColumn<Student>[] = [
  { dataField: 'firstName', caption: 'Ad', minWidth: 120, sortable: true },
  { dataField: 'lastName', caption: 'Soyad', minWidth: 120, sortable: true },
  { dataField: 'classroomName', caption: 'Sınıf', width: 100, filterType: 'select' },
  { dataField: 'birthDate', caption: 'Doğum Tarihi', dataType: 'date', format: 'shortDate' },
  { dataField: 'status', caption: 'Durum', cellRender: StatusBadgeRenderer },
  { dataField: 'createdAt', caption: 'Kayıt', dataType: 'date', visible: false },  // toggle ile aç
];
```

### Kurallar
- `dataField` zorunlu (sorting + filter için)
- `caption` Türkçe, label-style (Title Case değil, kısa)
- `minWidth` her kolonda — responsive scroll için
- `cellRender` özelleştirilmiş kolonlar için (ikon, badge)
- Asla inline anonymous function `cellRender={() => <Badge ...>}` — referans değişir, perf düşer. Component dışına çıkar.

## 4. Veri Modları

### Client-side (küçük veri seti, <500 satır)
```tsx
<DataGrid dataSource={students} />  // array, in-memory
```

### Server-side (büyük veri seti, default)
```tsx
<DataGrid
  remoteOperations={{ paging: true, sorting: true, filtering: true, grouping: false }}
  customDataSource={{
    load: async (loadOptions) => {
      const params = mapLoadOptionsToApiParams(loadOptions);
      const { data, totalCount } = await api.get('/students', { params });
      return { data, totalCount };
    },
  }}
/>
```

### Kural
- 200+ satır beklenen ekran → **server-side** zorunlu
- `infinite scroll` mobil'de tercih edilir, desktop'ta pagination

## 5. Pagination

- Default page size: **50**
- Seçenekler: 10, 25, 50, 100
- Max page size **100** (backend de zorlar)
- Page info: "1-50 / 234 kayıt" (Türkçe)
- URL'e yansıma opsiyonel: `?page=2&size=50&sort=firstName,asc`

## 6. Sıralama

- Sortable kolonlarda header'a ok ikonu
- Multi-sort: Ctrl+Click (kullanıcı eğitim gerektirir, opsiyonel)
- Default sort: kayda göre (`createdAt desc`) veya domain'e özgü
- Server-side sorting → API'ye `sort` query param

## 7. Filtreleme

### Filter Row (her kolon başlığı altında)
- Toggle ile aç/kapat (toolbar)
- Her kolon kendi filter type'ına göre: text, select, date range, number range
- 1 sn debounce server-side filter'da

### Filter Builder (gelişmiş, opsiyonel)
- DevExtreme `FilterBuilder` component'i
- Power user için, default kapalı

### Quick Search (toolbar)
- Tüm kolonlarda full-text arama
- Backend `?search=...` param'ı
- 500 ms debounce

## 8. Aksiyon Kolonu

- **Sağda** sabit (sticky)
- Icon-only button'lar, tooltip ile
- Permission kontrolü: yetki yoksa **render edilmez** (disabled değil)
- Tehlikeli aksiyon (sil): `confirm: true` → confirmation modal

```tsx
rowActions={[
  { label: 'Düzenle', icon: <Edit />, onClick: handleEdit, permission: 'x.update' },
  { label: 'Sil', icon: <Trash />, onClick: handleDelete, permission: 'x.delete', variant: 'danger', confirm: {
      title: 'Silmek istediğinizden emin misiniz?',
      description: 'Bu işlem geri alınabilir, 30 gün arşivde kalır.',
      confirmText: 'Sil',
  }},
]}
```

## 9. Toplu İşlem (Bulk Action)

- Checkbox kolonu sol başta
- Header checkbox: tüm görünür satırları seç
- Tüm sayfaları seç: "Tümünü seç (234 kayıt)" link (opsiyonel)
- Seçim sonrası **floating action bar** alt veya üst:
  ```
  3 öğrenci seçildi | [Sil] [Aktarma] [Excel İndir]
  ```

## 10. Export

### Excel
- DevExtreme native ExcelJS export
- Header'lar Türkçe
- Tarih, sayı format'ları korunur
- Server-side export (>1000 satır): backend `/api/v1/students/export` async endpoint, e-posta veya in-app notification ile teslim

### PDF
- MVP'de **kapalı** (Sprint 3+)
- Açıkken: A4, header/footer, sayfa numarası

### CSV
- Excel yeterli, CSV gerek yoksa açma (gereksiz seçim)

## 11. Empty State

```tsx
emptyState={
  filtersActive
    ? <EmptyState title="Sonuç bulunamadı" description="Filtreleri temizlemeyi deneyin" action={<Button onClick={clearFilters}>Filtreleri Temizle</Button>} />
    : <EmptyState title="Henüz öğrenci yok" description="..." action={<Button>Öğrenci Ekle</Button>} />
}
```

Filtre aktifken farklı mesaj (kullanıcı bağlamı kaybetmesin).

## 12. Loading State

- İlk yüklemede: `TableSkeleton rows={10} columns={5}`
- Refetch (filter değişikliği): üst kısımda shimmer overlay + mevcut veri kalır
- Pagination geçişi: button disabled + spinner

## 13. Error State

- Network hata: ErrorState + retry button
- 403: "Bu listeyi görmeye yetkiniz yok"
- 500: correlation ID kopyala + destek bilgisi

## 14. Responsive

- Desktop: Tüm kolonlar
- Tablet: bazı kolonlar gizlenir (`visible: { md: true, sm: false }`)
- Mobile: **DataGrid yerine** card list (alternative component): `<MobileCardList>`
  - Her satır bir card
  - Aksiyon menüsü: 3-nokta button → action sheet

Otomatik geçiş için `useMediaQuery` ile component swap.

## 15. URL State Sync

```tsx
<DataGrid
  syncToUrl={true}
  // ?page=2&size=50&sort=firstName,asc&filter=...&search=...
/>
```

- Filter, sort, page, search URL'e yansır
- Sayfayı refresh edince state korunur
- Paylaşılabilir link

## 16. Selection State

- Multi-select için `keyExpr` zorunlu
- Selected state Zustand store'da değil — local component state
- Mode değiştirilebilir: `mode: 'none' | 'single' | 'multiple'`

## 17. Inline Edit

**MVP'de kapalı.** Edit her zaman modal/sayfa ile. Inline edit:
- Hız avantajı düşük, hata riski yüksek
- Permission check zorlaşır
- Validation feedback zayıflar

Spektakül kullanım için (örn: not girişi) ayrı özel component yaz.

## 18. Performans

- Server-side mode'da virtual scrolling kapalı (paging yeter)
- Client-side mode'da `paging` veya `virtualScrolling: { mode: 'standard' }`
- `cellRender` referans stable olmalı (component'i dışarı al)
- Sütun sayısı 15'i geçerse: **column chooser** ile kullanıcı seçsin
- `repaintChangesOnly` true (gereksiz render önle)

## 19. Test

```ts
test('arama ile filtreler', async () => {
  render(<StudentList />);
  await user.type(screen.getByPlaceholderText(/ara/i), 'Ali');
  await waitFor(() => expect(screen.getAllByRole('row')).toHaveLength(2));
});
```

- DevExtreme'in render davranışı yavaş test eder → `findBy*` kullan
- Server-side mode'u MSW ile mock'la

## 20. Yasaklar

- ❌ DevExtreme DataGrid'i doğrudan kullanmak (her zaman wrapper)
- ❌ Inline `cellRender` anonymous function
- ❌ Permission check'i atlayıp her satırda "Sil" göstermek
- ❌ Toplu işlem onayını atlayıp "Sil" butonuna basınca anında silmek
- ❌ Pagination olmadan büyük dataset render etmek
- ❌ Filter / sort state'i Zustand store'a koymak (URL veya local)
- ❌ Loading sırasında veriyi sıfırlamak (UX kötü; shimmer overlay)
- ❌ DataGrid içinde başka DataGrid (nested) — alternatif: master-detail pattern
- ❌ Mobile'da masaüstü tablosunu zorla render etmek (card list'e geç)
- ❌ Export butonunu **client-side** 10K satır için kullanmak (browser crash)
