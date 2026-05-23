# Form & Validation Kuralları

## 1. Stack

- **React Hook Form v7** + **Zod** (resolver: `@hookform/resolvers/zod`)
- Manuel `useState`-based form **YASAK**

## 2. Schema Tanımı

```ts
// src/modules/students/schemas/studentSchema.ts
import { z } from 'zod';

export const studentCreateSchema = z.object({
  firstName: z.string().trim().min(1, 'Ad boş olamaz').max(100),
  lastName: z.string().trim().min(1, 'Soyad boş olamaz').max(100),
  nationalId: z.string().regex(/^\d{11}$/, 'TCKN 11 hane olmalı'),
  birthDate: z.coerce.date().max(new Date(), 'Gelecek tarih olamaz'),
  email: z.string().email('Geçerli e-posta giriniz').optional().or(z.literal('')),
  classroomId: z.string().uuid('Sınıf seçimi zorunlu'),
});

export type StudentCreateInput = z.infer<typeof studentCreateSchema>;
```

### Kurallar
- Schema'lar **modülün** içinde, component'te değil
- Hata mesajları **Türkçe** (i18n için key kullanılabilir, MVP'de düz Türkçe OK)
- `.trim()` her string'de, kullanıcı boşluk kaynaklı hata yaşamasın
- Backend validation kuralları ile **birebir** aynı (DRY için OpenAPI'den paylaş, MVP'de manuel sync)

## 3. Form Component Pattern

```tsx
// src/modules/students/components/StudentForm.tsx
export function StudentForm({ defaultValues, onSubmit }: Props) {
  const form = useForm<StudentCreateInput>({
    resolver: zodResolver(studentCreateSchema),
    defaultValues,
    mode: 'onBlur',
  });
  
  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField name="firstName" label="Ad" required />
        <FormField name="lastName" label="Soyad" required />
        <FormField name="nationalId" label="TCKN" required mask="11111111111" />
        <FormDatePicker name="birthDate" label="Doğum Tarihi" required />
        <FormField name="email" label="E-posta" type="email" />
        <FormSelect name="classroomId" label="Sınıf" options={classrooms} required />
        
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>İptal</Button>
          <Button type="submit" loading={form.formState.isSubmitting}>Kaydet</Button>
        </div>
      </form>
    </FormProvider>
  );
}
```

## 4. Validation Modları

| Mode | Davranış | Kullanım |
|------|----------|---------|
| `onBlur` | Field'dan çıkınca validate | **Default** |
| `onChange` | Her tuş vuruşunda | Kritik alanlar (parola güç) |
| `onSubmit` | Sadece submit'te | Basit form |
| `onTouched` | Field touch'tan sonra her change | Kombine |

**Default:** `onBlur` + `reValidateMode: 'onChange'` (hata oluştuktan sonra anında düzelt).

## 5. Server-Side Validation Hatası

Server 400 dönerse `errors` field'larına yansıt:
```tsx
async function onSubmit(data) {
  try {
    await api.post('/students', data);
  } catch (err) {
    if (err.response?.status === 400 && err.response.data.errors) {
      Object.entries(err.response.data.errors).forEach(([field, messages]) => {
        form.setError(field as any, { message: (messages as string[])[0] });
      });
      return;
    }
    toast.error('Kayıt sırasında hata oluştu');
  }
}
```

**Kural:** Server error mesajlarını kullanıcıya **olduğu gibi** göster (backend Türkçe döner).

## 6. Required Field Görünümü

- Label sonunda `*` (kırmızı)
- `aria-required="true"` accessibility
- Empty submit → label rengi kırmızı, hata mesajı alt satırda

## 7. Hata Mesajları

```tsx
<FormField name="firstName" label="Ad" required />
// Render:
// [Label: Ad *]
// [Input: focused border-primary, error border-danger]
// [Error text: "Ad boş olamaz"] ← sadece hata varsa
```

### Kurallar
- Hata altında, kırmızı, ikonlu (opsiyonel)
- Aynı anda **tek mesaj** (Zod ilk hatayı verir, abort early)
- "Genel" hata kutusu: form en üstünde, server side hatalar için

## 8. Disabled / Read-only

- `disabled`: değer **gönderilmez** (form state'inden çıkar)
- `readOnly`: değer **gönderilir** ama edit edilemez

Kullanım örneği:
- Düzenleme modunda TCKN read-only (değiştirilemez)
- Yetki yoksa form alanı disabled + tooltip

## 9. Field Mask

| Alan | Mask | Kütüphane |
|------|------|-----------|
| TCKN | `11 hane sadece rakam` | DevExtreme MaskedInput veya `react-number-format` |
| Telefon | `+90 (5XX) XXX XX XX` | aynı |
| Para | binlik ayraç, `,` ondalık | `react-number-format` |
| Tarih | `gg.aa.yyyy` | DevExtreme DateBox |
| Saat | `HH:mm` | DevExtreme DateBox time mode |

## 10. Submit Davranışı

- Button disabled + loading (`isSubmitting`)
- Submit sırasında form alanları **disable edilmez** (UX hatası), sadece submit button
- Çift submit önleme: `isSubmitting` zaten disable eder
- Submit başarılı: toast + redirect veya form reset
- Submit hata: form aynı kalır, kullanıcı düzeltir

```tsx
<Button type="submit" loading={form.formState.isSubmitting} disabled={!form.formState.isDirty}>
  Kaydet
</Button>
```

### Dirty Check
- Form değişmemişse submit aktif değil (`isDirty: false`)
- Yeni kayıt formu açıldığında dirty olur (default değerler ≠ ilk veri)

## 11. Dirty & Unsaved Changes Uyarısı

Form değişiklik var iken sayfa terkedilirse uyarı:
```tsx
useEffect(() => {
  const handler = (e: BeforeUnloadEvent) => {
    if (form.formState.isDirty) e.preventDefault();
  };
  window.addEventListener('beforeunload', handler);
  return () => window.removeEventListener('beforeunload', handler);
}, [form.formState.isDirty]);
```

Router-level: React Router `useBlocker` (v6.4+) ile in-app navigasyon koruması.

## 12. Wizard Form

Detay: `form-wizard.skill`. Özet kurallar:
- Çoklu step'i tek `useForm` ile yönet
- Her step için ayrı **partial schema** validate et
- Step indicator'a tıklanarak geri dönülebilir, ileri **sadece geçerliyse**
- Son step'te tam schema validate
- Draft autosave (Sprint 2+): `localStorage` veya backend `/drafts`

```tsx
const stepSchemas = [step1Schema, step2Schema, step3Schema];

async function nextStep() {
  const valid = await form.trigger(currentStepFields);
  if (valid) setStep(s => s + 1);
}
```

## 13. Conditional Fields

```tsx
const role = form.watch('role');

{role === 'Parent' && <FormField name="emergencyContact" label="Acil Durum Kontağı" />}
```

- `useWatch` veya `watch` ile bağımlı render
- Gizlendiğinde değer **temizlenir** (`setValue('field', undefined)` veya conditional schema)
- Validation conditional: Zod `z.discriminatedUnion` veya `superRefine`

## 14. Async Validation (örn: email unique)

```ts
firstName: z.string().min(1),
email: z.string().email().refine(async (val) => {
  const { data } = await api.get(`/users/check-email?email=${val}`);
  return !data.exists;
}, 'Bu e-posta zaten kayıtlı'),
```

- Debounce 500 ms (her tuş vuruşunda istek atılmaz)
- Loading indicator field yanında (küçük spinner)
- Submit'te tekrar validate (race condition önleme)

## 15. File Upload

```tsx
<FormField
  name="avatar"
  label="Profil Fotoğrafı"
  type="file"
  accept="image/png,image/jpeg"
  maxSizeMb={2}
/>
```

### Kurallar
- Max boyut client'ta da kontrol (backend de kontrol eder)
- Önizleme (image preview)
- Upload progress göster (>1 MB için)
- Drag & drop opsiyonel
- Multi-upload: ödev teslim akışında

## 16. Reset & Cancel

- **Cancel**: modal kapat / önceki sayfaya dön. Confirm dialog if dirty.
- **Reset**: `form.reset(defaultValues)`, dirty state temizlenir
- **Clear**: tek alan için `form.setValue('x', '')`

## 17. Performans

- Büyük form (50+ field) için: `mode: 'onBlur'`, `shouldUnregister: false`
- `useWatch` parametreli kullanım (tüm form'u izleme)
- React DevTools Profiler ile gereksiz render kontrol

## 18. Test

```ts
test('submit ile öğrenci oluşturur', async () => {
  render(<StudentForm onSubmit={onSubmit} />);
  await user.type(screen.getByLabelText('Ad'), 'Ali');
  await user.type(screen.getByLabelText('Soyad'), 'Veli');
  // ...
  await user.click(screen.getByRole('button', { name: /kaydet/i }));
  await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(...));
});
```

- Form testleri: RTL + `userEvent`
- Validation hatası testleri ayrı
- MSW ile server hata simülasyonu

## 19. Yasaklar

- ❌ `useState` ile manuel form state yönetimi
- ❌ HTML5 native `required`, `pattern` (Zod kullan)
- ❌ Validation mesajını ekranda multiple yere yansıtmak (form altı + alan altı = duplicate)
- ❌ Submit'te `e.preventDefault()` unutmak (RHF `handleSubmit` halleder)
- ❌ Loading sırasında submit butonunu **gizlemek** (disabled kullan, layout shift olmaz)
- ❌ Default value'yu render içinde object literal olarak vermek (her render yeni ref → infinite loop)
- ❌ Form state'ini Zustand'a vs.'ye duplicate etmek
- ❌ Backend validation mesajını "User-friendly" diye **client'ta override** etmek (server kaynak doğrulukta)
