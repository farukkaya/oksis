# Okul / Tenant Yönetimi — UI Flows

> Bu modülün frontend ekranları, kullanıcı akışları, state management.

> Genel UI/UX kuralları için bkz. `frontend/ui-ux-rules.md` ve `frontend/component-rules.md`.

---

## Ekranlar

### Liste — `{{TBD_route}}`

**Portal:** admin | teacher | parent | student
**Permission:** `schools.view`
**Component:** `{{TBD_ComponentName}}`
**Konum:** `src/modules/schools/pages/{{TBD_ComponentName}}.tsx`

**State:**
- Server: `useStudentsQuery` (TanStack Query)
- Local: filter, search, pagination (URL params)

**Aksiyonlar:**
- "Yeni Ekle" → `{{TBD_route}}/new`
- Row click → detay sayfası

**Edge Case'ler:**
- Boş liste → EmptyState component
- Hata → ErrorState + retry
- Loading → Skeleton (Spinner değil)

---

### Detay / Düzenle — `{{TBD_route}}/:id`

{{TBD}}

---

### Yeni Ekle — `{{TBD_route}}/new`

{{TBD}}

---

## Kullanıcı Akışı

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

## Mobil Notları (varsa)

- 3-tap kuralı uygulanır mı? {{TBD}}
- Sticky action button gerekli mi? {{TBD}}
- Keyboard overlap (`KeyboardAvoidingView`)? {{TBD}}

---

## Form Validation

```ts
// Zod schema
const {{TBD}}Schema = z.object({
  {{TBD}}: z.string().min(1, "Zorunlu").max(100),
  {{TBD}}: z.{{TBD}},
});
```

---

## i18n Key'leri

| Key | TR |
|---|---|
| `schools.title` | {{TBD}} |
| `schools.empty` | Henüz {{TBD}} eklenmemiş |
| `schools.errors.required` | Bu alan zorunludur |

---

## Yasaklar

- ❌ Spinner (Skeleton kullan).
- ❌ Hardcoded Türkçe string (i18n key zorunlu).
- ❌ Form'da Zod olmadan validation.
- ❌ `getByTestId` testlerde (Role + Text bazlı sorgular).

> Detay: `frontend/component-rules.md`, `frontend/form-validation-rules.md`.
