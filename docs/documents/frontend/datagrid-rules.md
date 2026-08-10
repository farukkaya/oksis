# DataGrid / Tablo Kuralları (shadcn/ui)

> **Stack:** Tablolar shadcn/ui `Table` (Radix tabanlı, `src/app/components/ui/table.tsx`) + Tailwind ile kurulur. Sıralama, sayfalama ve filtreleme **server-side** (API param'ları) + React Query + React Router search param ile yönetilir. Ek bir grid kütüphanesi (DevExtreme, AG Grid, vb.) **kullanılmaz**.

## 1. Neden Wrapper?

Öğrenci listesi, kullanıcı yönetimi, devamsızlık raporu gibi onlarca liste ekranı var. Her ekranda `Table` primitive'lerini elle dizmek tekrar + tutarsızlık üretir. Bu yüzden ortak bir `DataTable` wrapper'ı üzerinden gidilir:

```
src/shared/components/DataTable/
├── DataTable.tsx           # shadcn Table üzerine ince wrapper
├── DataTableToolbar.tsx    # toolbar (search, filter toggle, add, export)
├── DataTablePagination.tsx # sayfa kontrolü + "1-50 / 234 kayıt"
├── columns.ts              # ColumnDef<T> tipi + ortak helper'lar
├── cellRenderers.tsx       # ortak hücre render'ları (badge, date, currency)
└── index.ts
```

> Bu wrapper shadcn `Table`'ı sarmalar; doğrudan `Table`/`TableRow` dizmek küçük statik tablolar dışında YASAK değildir ama liste ekranlarında `DataTable` tercih edilir (tutarlı toolbar/pagination/empty/loading).

## 2. Wrapper Kontrat

```tsx
<DataTable<Student>
  data={students}                 // mevcut sayfanın satırları (server-side)
  columns={columns}
  rowKey="id"
  totalCount={totalCount}
  pagination={pagination}         // { page, pageSize } — URL search param'dan
  onPaginationChange={setPagination}
  sorting={sorting}               // { field, dir }
  onSortingChange={setSorting}
  selection={{ mode: 'multiple', selected, onChange: setSelected }}
  toolbar={{
    title: 'Öğrenciler',
    search: true,
    filter: true,
    export: { excel: true },
    actions: [
      { label: 'Yeni Öğrenci', icon: <Plus />, onClick: ..., permission: 'student.create' },
    ],
  }}
  rowActions={[
    { label: 'Düzenle', icon: <Edit />, onClick: ..., permission: 'student.update' },
    { label: 'Sil', icon: <Trash />, onClick: ..., permission: 'student.delete', variant: 'danger', confirm: true },
  ]}
  onRowClick={(row) => navigate(`/students/${row.id}`)}
  emptyState={<EmptyState ... />}
  isLoading={isLoading}
  error={error}
/>
```

## 3. Column Tanımları

```tsx
const columns: ColumnDef<Student>[] = [
  { key: 'firstName', header: 'Ad', sortable: true, minWidth: 120 },
  { key: 'lastName', header: 'Soyad', sortable: true, minWidth: 120 },
  { key: 'classroomName', header: 'Sınıf', width: 100, filter: 'select' },
  { key: 'birthDate', header: 'Doğum Tarihi', cell: (r) => formatDate(r.birthDate) },
  { key: 'status', header: 'Durum', cell: (r) => <StatusBadge value={r.status} /> },
  { key: 'createdAt', header: 'Kayıt', defaultHidden: true },  // column chooser ile aç
];
```

### Kurallar
- `key` zorunlu (sort + filter param eşlemesi için)
- `header` Türkçe, kısa (i18n key'i ile, hardcoded değil)
- `minWidth` her kolonda — responsive yatay scroll için
- `cell` özelleştirilmiş kolonlar için (ikon, badge, formatlama)
- `cell` render fonksiyonunu **modül seviyesinde** tanımla, inline anonymous değil — referans stabilitesi + performans.

## 4. Veri Modları

### Client-side (küçük, sabit veri seti, <500 satır)
```tsx
<DataTable data={rows} columns={columns} rowKey="id" />  // in-memory
```

### Server-side (büyük veri seti, default)
React Query ile sayfa/sıralama/filtre API'ye gider, dönen sayfa render edilir:

```tsx
const { data, isLoading, error } = useQuery({
  queryKey: studentKeys.list({ page, pageSize, sort, search, filters }),
  queryFn: () => api.get('/students', { params: { page, pageSize, sort, search, ...filters } }),
});
```

### Kural
- 200+ satır beklenen ekran → **server-side** zorunlu
- Mobilde `infinite scroll` (FlatList), desktop'ta pagination

## 5. Pagination

- Default page size: **50** · Seçenekler: 10, 25, 50, 100 · Max **100** (backend de zorlar)
- Page info: "1-50 / 234 kayıt" (Türkçe)
- Sayfa/boyut **URL search param**'ında: `?page=2&size=50`
- `DataTablePagination` shadcn `Button` + `Select` ile kurulur

## 6. Sıralama

- Sortable kolon header'ı tıklanabilir, ok ikonu (`lucide` ChevronUp/Down) gösterir
- Tek kolon sıralama (multi-sort MVP'de yok)
- Default sort domain'e özgü (genelde `createdAt desc`)
- Server-side: API'ye `sort=firstName,asc` param'ı; sort state URL'de

## 7. Filtreleme

### Filter satırı (kolon başlığı altında)
- Toolbar toggle ile aç/kapat
- Kolon tipine göre: text, select, date range, number range (shadcn `Input`/`Select`/`Popover`+`Calendar`)
- Server-side filter'da **500 ms debounce**

### Quick Search (toolbar)
- shadcn `Input`, tüm kolonlarda full-text; backend `?search=...`; 500 ms debounce

> Filtre/sort/search state'i **URL search param**'ında tutulur — Zustand'a koyma.

## 8. Aksiyon Kolonu

- **Sağda** sticky
- Icon-only `Button` + `Tooltip`
- Permission kontrolü: yetki yoksa **render edilmez** (disabled değil) — `usePermission` / `RequirePermission`
- Tehlikeli aksiyon (sil): `confirm: true` → shadcn `AlertDialog` ile onay

```tsx
rowActions={[
  { label: 'Düzenle', icon: <Edit />, onClick: handleEdit, permission: 'x.update' },
  { label: 'Sil', icon: <Trash />, onClick: handleDelete, permission: 'x.delete', variant: 'danger',
    confirm: { title: 'Silmek istediğinizden emin misiniz?', description: '30 gün arşivde kalır.', confirmText: 'Sil' } },
]}
```

## 9. Toplu İşlem (Bulk Action)

- Sol başta `Checkbox` kolonu; header checkbox tüm görünür satırları seçer
- "Tümünü seç (234 kayıt)" link opsiyonel
- Seçim sonrası floating action bar: `3 öğrenci seçildi | [Sil] [Aktar] [Excel İndir]`
- Seçim state'i **local** (Zustand değil)

## 10. Export

### Excel
- **Server-side** export: backend `/api/v1/students/export` endpoint döner (header'lar Türkçe, format korunur)
- Büyük veri (>1000 satır) async: e-posta / in-app notification ile teslim
- Client-side büyük export YASAK (browser crash)

### PDF / CSV
- PDF MVP'de **kapalı** (Sprint 3+). CSV gereksizse açma.

## 11. Empty State

```tsx
emptyState={
  filtersActive
    ? <EmptyState title="Sonuç bulunamadı" description="Filtreleri temizlemeyi deneyin" action={<Button onClick={clearFilters}>Filtreleri Temizle</Button>} />
    : <EmptyState title="Henüz öğrenci yok" action={<Button>Öğrenci Ekle</Button>} />
}
```

Filtre aktifken farklı mesaj (kullanıcı bağlamı kaybetmesin).

## 12. Loading State

- İlk yükleme: `TableSkeleton rows={10} columns={5}` (shadcn `Skeleton`) — **spinner değil**
- Refetch (filter değişimi): mevcut veri kalır + üstte hafif shimmer/opacity overlay
- Pagination geçişi: kontroller disabled

## 13. Error State

- Network hata: `ErrorState` + retry button (React Query `refetch`)
- 403: "Bu listeyi görmeye yetkiniz yok"
- 500: correlation ID kopyala + destek bilgisi

## 14. Responsive

- Desktop: tüm kolonlar (yatay scroll wrapper `overflow-x-auto`)
- Tablet: düşük öncelikli kolonlar gizlenir (`responsive: { hideBelow: 'md' }`)
- Mobile: tablo yerine **card list** (`<MobileCardList>`); her satır bir card, aksiyonlar 3-nokta → action sheet
- Geçiş `useMediaQuery` / `use-mobile` ile component swap

## 15. URL State Sync

- Filter, sort, page, search **React Router search param**'ında: `?page=2&size=50&sort=firstName,asc&search=...`
- Refresh sonrası state korunur, link paylaşılabilir
- `useSearchParams` tek kaynak; ayrı bir state store tutma

## 16. Selection State

- Multi-select için `rowKey` zorunlu
- Selected state **local** component state (Zustand değil)
- Mode: `'none' | 'single' | 'multiple'`

## 17. Inline Edit

**MVP'de kapalı.** Edit her zaman modal/sayfa ile:
- Hız avantajı düşük, hata riski yüksek; permission check + validation feedback zorlaşır
- Özel ihtiyaç (örn. not girişi) için ayrı özel component yaz

## 18. Performans

- Server-side mode'da paging yeter (virtualization gerekmez)
- Client-side büyük listede satır sanallaştırma: `react-virtuoso` (gerekirse, ekibe danış)
- `cell` render fonksiyonları referans-stabil olmalı (modül seviyesinde tanımla)
- Sütun 15'i geçerse: **column chooser** ile kullanıcı seçsin
- Geniş tabloda `React.memo` ile satır component'i

## 19. Test

```ts
test('arama ile filtreler', async () => {
  render(<StudentList />);
  await user.type(screen.getByPlaceholderText(/ara/i), 'Ali');
  await waitFor(() => expect(screen.getAllByRole('row')).toHaveLength(2));
});
```

- Server-side mode'u **MSW** ile mock'la
- Async render için `findBy*` kullan

## 20. Yasaklar

- ❌ Liste ekranında ortak `DataTable` yerine her seferinde elden tablo dizmek
- ❌ Inline anonymous `cell` render fonksiyonu (referans değişir, perf düşer)
- ❌ Permission check'i atlayıp her satırda "Sil" göstermek
- ❌ Toplu işlem / silme onayını atlamak (her zaman `AlertDialog`)
- ❌ Pagination olmadan büyük dataset render etmek
- ❌ Filter / sort / page state'ini Zustand'a koymak (URL veya local)
- ❌ Loading sırasında veriyi sıfırlamak (shimmer overlay kullan)
- ❌ Tablo içinde tablo (nested) — alternatif: master-detail pattern
- ❌ Mobile'da masaüstü tablosunu zorla render etmek (card list'e geç)
- ❌ Export'u client-side 10K satır için kullanmak (backend async export)
- ❌ Ayrı bir grid kütüphanesi (DevExtreme, AG Grid, MUI DataGrid vb.) eklemek — shadcn `Table` standarttır
