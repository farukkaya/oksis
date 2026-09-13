# Formlar ve Doğrulama

> [!info] Belge bilgisi
> **Amaç:** Form doğrulamasının tek kaynaktan yapılmasını, sunucu hatalarının forma nasıl yansıtıldığını ve tel tiplerinin formla ilişkisini tanımlamak.
> **Son doğrulama:** 2026-09-13. `oksis-ui` master `ec9ea8c`, `oksis-api` master `294ffe62`.
> **Kaynak:** `oksis-ui/CLAUDE.md` (Separation of Concerns, Naming, Backend Contract, Domain Decisions), `apps/web/CLAUDE.md` (Data & State), `packages/core/src/*/schemas.ts`, `apps/web/features/roll-call/amendment-modal.tsx`, `packages/api/src/client/errors.ts`, `oksis-api/src/Oksis.Api/Middleware/ExceptionHandlingMiddleware.cs`.

İlgili notlar: [[veri-ve-durum-yonetimi]] · [[api-sozlesmesi]] · [[adlandirma]]

---

## 1. Tek şema kaynağı

**Kural:** Bir form ya da varlık için **tek** bir Zod şeması vardır. Bu şema `packages/core/src/<alan>/schemas.ts` içinde yaşar. Hem web formu, hem mobil formu, hem de API katmanı aynı şemayı kullanır.

**Gerekçe:** Doğrulama iki yerde yazılırsa zamanla birbirinden ayrışır. `core` saf TS olduğu için şema iki platformda da mock'suz test edilebilir.

Ayrıntılar:

- Zod sürümü **4**'tür (`zod ^4.4.3`).
- Adlandırma: şema `xSchema`, çıkarılan tip `XValues` (örnek `sectionFormSchema` / `SectionFormValues`).
- Hata mesajları şemada Türkçe yazılır. Tasarım teslimindeki metin varsa birebir o kullanılır.
- Alanlar arası kurallar `superRefine` ile eklenir. Örnek: "Raporlu seçiliyse belge zorunlu" (`excuseFormSchema`).
- Şema tanımının üstüne Türkçe açıklama yorumu yazılır; hangi ekranın, hangi kuralın karşılığı olduğunu anlatır.

## 2. Web form kalıbı

- **Kalıp: `useState` ile alan durumu, gönderimde `schema.safeParse(values)`.** Emsal dosya: `apps/web/features/roll-call/amendment-modal.tsx`.
- `react-hook-form` `apps/web` bağımlılığı değildir (yalnız `packages/ui` içinde listelidir). Yeni formlar RHF ile kurulmaz. RHF'ye geçiş bir kütüphane kararıdır ve onay ister.
- `safeParse` sonucundaki hata alan bazında gösterilir. Şemanın mesajı değiştirilmeden kullanılır.

## 3. Mobil form kalıbı

- Aynı şemalar `@workspace/core` üzerinden kullanılır. **Mobilde yeniden yazılmaz.**
- Girdi bileşenleri `src/components/` altındadır: `text-field`, `date-field`, `checkbox-row`, `toggle`, `stepper`, `chip-row`.

## 4. Sunucu doğrulama hataları

- Backend'deki FluentValidation hatası (`ValidationException`) **400** döner. Zarfın `errors[]` alanında her öğe `{ code: "Validation", message, field }` biçimindedir.
- İstemcide ilgili alanın mesajı `ApiError.fieldError(field)` ile alınır.
- `field` değeri FluentValidation'ın özellik adıdır. Hangi harf düzeniyle (PascalCase / camelCase) geldiği uçtan uca doğrulanmadı. **Alan eşlemesi yazmadan önce gerçek yanıtla kontrol edin.**
- **Zarf dışı istisna:** İstek gövdesi JSON olarak çözülemezse ya da model binding başarısız olursa `[ApiController]` otomatik olarak ASP.NET varsayılan ProblemDetails 400 döner, çünkü `InvalidModelStateResponseFactory` özelleştirilmemiştir. `unwrap` bu yanıtı "Beklenmeyen bir hata oluştu." olarak yorumlar. Bkz. [[api-sozlesmesi]] §4.3.
- Alana bağlanamayan sunucu hatası mutasyonun `onError` kolunda `mutationErrorDesc(err)` ile gösterilir. Sabit metin yazılmaz (ESLint `X-01`).

## 5. Tel tipi ve form tipi

- Tel (wire) şekli için tek yetkili kaynak `packages/api/src/generated/schema.ts` dosyasıdır. Bir DTO alanına dokunmadan önce alan orada `grep` ile aranır ve tipi birebir kopyalanır.
- **Tel tipleri "iyileştirilmez."** Kimlik gibi görünen bir string string kalır, sayı gibi görünen bir string de string kalır. Örnek: `studentNo` her katmanda `string`'dir. Sayıya çevirmek baştaki sıfırları kaybettirir.
- Enum benzeri alanlar DTO'da tel değeriyle tutulur. Alan birliğine (union) eşleme `endpoints.ts` içinde yapılır, formda ya da çağrı yerinde yapılmaz.
- Form değeri (`XValues`) ile tel DTO'su aynı şey değildir. Dönüşüm `endpoints.ts` içinde yapılır.

## 6. Tarih alanları

- `toISOString().slice(0, 10)` yasaktır. Tarih yerel bileşenlerden `YYYY-MM-DD` olarak kurulur (bkz. [[veri-ve-durum-yonetimi]] §10).
- Şemalarda ISO tarih deseni `^\d{4}-\d{2}-\d{2}$` kullanılır (örnek `packages/core/src/attendance/schemas.ts`).

## 7. Eski belgelerden alınmayanlar

| Eski iddia (`form-validation-rules.md`) | Bugünkü gerçek |
|---|---|
| "Stack: React Hook Form + Zod, `zodResolver`" | Web'de `useState` + `safeParse` |
| `form.setError` ile sunucu hatası eşleme örneği (`err.response.data.errors` sözlüğü) | Hata listesi zarfın `errors[]` alanında; eşleme `ApiError.fieldError` ile |
| Mobilde `register` yasak, `Controller` zorunlu | Mobilde RHF yok |
| Alan maskesi, dirty/unsaved uyarısı, wizard, async unique kontrol kuralları | Kodda ortak bir kalıp olarak doğrulanmadı. Gerekirse ayrıca karar verilir. |
