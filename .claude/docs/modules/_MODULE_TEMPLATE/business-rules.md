# {{MODULE_NAME_TR}} — Business Rules

> Bu modüle özel iş kuralları. Yazılım dünyasından gelen genel kurallar değil — **OKSİS'te {{MODULE_NAME_TR}} için spesifik** kararlar.

> Genel iş kuralları için bkz. proje kökündeki `business-rules.md`.

---

## Kurallar

### BR-{{MODULE_SLUG}}-001: {{TBD_kural_basligi}}

**Kural:** {{TBD}}

**Sebep:** {{TBD}} (neden bu kural var, hangi gerçek dünya gereksinimi)

**Uygulama:**
- Backend: {{TBD}} (örn. "Domain layer'da invariant olarak kontrol")
- Frontend: {{TBD}} (örn. "Form'da Zod ile validation")
- DB: {{TBD}} (örn. "Check constraint")

**Edge case'ler:**
- {{TBD}}

**Test referansı:** {{TBD_test_class_name}}

---

### BR-{{MODULE_SLUG}}-002: {{TBD}}

{{TBD}}

---

## Sınır Durumlar

| Senaryo | Beklenen Davranış |
|---|---|
| {{TBD}} | {{TBD}} |
| {{TBD}} | {{TBD}} |

---

## Tarihsel Notlar

| Tarih | Değişiklik | Sebep |
|---|---|---|
| {{DATE}} | İlk kurallar tanımlandı | İlk implementasyon |

> Eski kural değişikliği geriye dönük etki yaratıyorsa migration / data fix planı `database-schema.md`'de bahsedilir.
