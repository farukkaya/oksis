# Duyurular C3 — Ek Dosya Uçtan Uca Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Duyuruya ek dosya iliştirmeyi ve alıcının o eki açmasını uçtan uca çalışır hâle getirmek.

**Architecture:** Yükleme **tek adımlıdır**: `POST /api/v1/files` (proxy/multipart) dosyayı alır ve `StoredFile` kimliğini döndürür; o kimlik `CreateAnnouncementBody.attachmentFileId` olarak gönderilir. `FileAttachment` bağını **backend kendisi yazar** (`CreateAnnouncementCommandHandler`), istemci `/attach` çağırmaz. İndirmede ek `url`'i doğrudan bir dosya değil, presigned URL döndüren bir API ucudur — istemci onu auth'lu çağırır, zarfı açar ve dönen kısa ömürlü URL'e yönlendirir.

**Tech Stack:** .NET 10 (backend, yalnız küçük bir DTO eklemesi) · TypeScript + vitest (`packages/api`, `packages/core`) · MSW (`packages/api-mocks`) · Next.js 16 (`apps/web`) · Expo Router + `expo-image-picker` (`apps/mobile`)

## Global Constraints

- Kullanıcıya dönük her metin **Türkçe**dir.
- **`apps/web` ve `apps/mobile`'da test koşucusu YOKTUR.** Test edilebilir her kural `packages/core`'a taşınır.
- Commit formatı: `<type>(<scope>): türkçe açıklama` — sonda nokta yok.
- Backend commit'inden önce `dotnet format`.
- **Kategori sabittir: `AnnouncementAttachment`.** Politikası (`FileCategoryPolicyRegistry.cs`): izinli uzantılar `pdf, jpg, png`, izinli MIME `application/pdf, image/jpeg, image/png`, üst sınır **10 MB**, `ForcePresigned: false`, `AllowMultipart: false`. İstemci ön elemesi bir **güvenlik sınırı değildir** — backend `FileCategoryPolicy` ile yeniden doğrular.
- **Duyuru başına EN FAZLA BİR ek vardır.** `Announcement.AttachmentFileId` tekil bir kolondur. Compose formundaki çoklu dosya seçici tek dosyaya indirilir.
- **İstemci `POST /files/{id}/attach` çağırmaz.** `CreateAnnouncementCommandHandler.cs:186-190` `FileAttachment.Create(...)` satırını zaten yazıyor; ikinci bir çağrı **çift bağ satırı** üretir.
- `files.upload` izni SchoolAdmin, Teacher, Parent ve Student rollerinde vardır (`RolePermissionSeedData.cs`); duyuru yayınlayabilen herkes ek yükleyebilir. **SuperAdmin'de yoktur** — platform hesabı ek iliştiremez, bu bilinçlidir.
- **Kapsamlı sınır (kayda geçmiş karar):** mobilde ek **yalnız görseldir (jpg/png)**. `expo-document-picker` bağımlılığı depoda yoktur ve eklenmesi native yeniden derleme gerektirir (C3 kapsamı dışı); mevcut `expo-image-picker` PDF seçemez. Web üç türü de destekler. Mobil ekranda bu sınır **açıkça yazılır**, sessizce geçilmez.
- Komutlar:
  - Backend test: `dotnet test --filter "FullyQualifiedName~<Sınıf>"`
  - Paket testi: `npm run test --workspace=@workspace/api` · `npm run test --workspace=@workspace/core`
  - Uygulama doğrulama: `npm run typecheck --workspace=<paket>` · `npm run lint --workspace=<paket>`

---

## File Structure

| Dosya | Sorumluluk |
|---|---|
| `src/Oksis.Application/Modules/Announcements/DTOs/AnnouncementDto.cs` | `AnnouncementAttachmentDto`'ya `FileId` eklenir |
| `src/Oksis.Application/.../GetAnnouncementById/GetAnnouncementByIdQueryHandler.cs:114-136` | `FileId` doldurulur |
| `packages/api/src/files/endpoints.ts` (**yeni**) | `uploadFile`, `getFileDownloadUrl` |
| `packages/api/src/files/queries.ts` (**yeni**) | `useUploadFile` |
| `packages/api/src/files/endpoints.test.ts` (**yeni**) | Yükleme gövdesi ve indirme zarfı testleri |
| `packages/api/src/index.ts` | `files` modülü dışa açılır |
| `packages/core/src/announcements/constants.ts` | Ek dosya politikası sabitleri |
| `packages/core/src/announcements/logic.ts` | `validateAttachment` — istemci ön elemesi |
| `packages/core/src/announcements/types.ts` | `AnnouncementAttachment.fileId` |
| `packages/api-mocks/src/files/file-handlers.ts` (**yeni**) | Yükleme + indirme mock'u |
| `apps/web/features/announcements/compose.tsx:350-395` | Gerçek yükleme, tek dosya |
| `apps/web/features/announcements/detail.tsx:112-124` | İndirme düzeltmesi |
| `apps/mobile/src/features/announcements/components/compose-screen.tsx` | Görsel eki |
| `apps/mobile/src/features/announcements/components/{announcement-detail-screen,announcement-reader-screen}.tsx` | İndirme |

---

### Task 1: Ek DTO'su dosya kimliğini taşır

Bugün `AnnouncementAttachmentDto.Url` `/api/v1/files/{id}/download-url` biçiminde bir **yol**. İstemcinin indirme için o kimliğe ihtiyacı var; URL'den ayrıştırmak kırılgan bir bağımlılıktır (yol değişirse sessizce bozulur).

**Files:**
- Modify: `src/Oksis.Application/Modules/Announcements/DTOs/AnnouncementDto.cs:43-49`
- Modify: `src/Oksis.Application/Modules/Announcements/Queries/GetAnnouncementById/GetAnnouncementByIdQueryHandler.cs:114-136`
- Modify: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/AnnouncementAttachmentTests.cs`

**Interfaces:**
- Consumes: `StoredFile` (`db.StoredFiles`).
- Produces: `AnnouncementAttachmentDto { Guid FileId; string Name; long Size; string MimeType; string Url }`. Task 3 ve Task 5 `fileId`'yi kullanır.

- [ ] **Step 1: Testi yaz**

`tests/Oksis.Infrastructure.IntegrationTests/Persistence/AnnouncementAttachmentTests.cs`'e ekleyin:

```csharp
[Fact]
public async Task Should_ExposeFileId_When_AnnouncementHasAttachment()
{
    // Arrange: dosyanın mevcut "eki olan duyuru" seed yardımcısı kullanılır.
    var result = await SendAsync(new GetAnnouncementByIdQuery(announcementId));

    result.Value!.Attachment.Should().NotBeNull();
    result.Value.Attachment!.FileId.Should().Be(storedFileId);
    result.Value.Attachment.Url.Should().Be($"/api/v1/files/{storedFileId}/download-url");
}
```

- [ ] **Step 2: Testi çalıştır, kırmızı olduğunu doğrula**

```bash
dotnet test --filter "FullyQualifiedName~AnnouncementAttachmentTests"
```

Beklenen: FAIL — `FileId` alanı yok.

- [ ] **Step 3: DTO'ya alanı ekle**

`AnnouncementDto.cs`:

```csharp
public sealed record AnnouncementAttachmentDto
{
    /// <summary>
    /// <c>StoredFile.Id</c>. İstemci indirmeyi bu kimlikle başlatır;
    /// <see cref="Url"/>'i ayrıştırmak zorunda kalmaz — yol değişirse sessizce
    /// bozulacak bir bağımlılık olurdu.
    /// </summary>
    public required Guid FileId { get; init; }
    public required string Name { get; init; }
    public required long Size { get; init; }
    public required string MimeType { get; init; }
    public required string Url { get; init; }
}
```

- [ ] **Step 4: Handler'da doldur**

`GetAnnouncementByIdQueryHandler.cs`, `LoadAttachmentAsync` içindeki dönüş:

```csharp
        return file is null
            ? null
            : new AnnouncementAttachmentDto
            {
                FileId = file.Id,
                Name = file.OriginalFileName,
                Size = file.SizeBytes,
                MimeType = file.ContentType,
                Url = $"/api/v1/files/{file.Id}/download-url",
            };
```

> Projeksiyon zaten `f.Id`'yi seçiyor (`.Select(f => new { f.Id, f.OriginalFileName, f.SizeBytes, f.ContentType })`) — ek sorgu gerekmez.

- [ ] **Step 5: Testi çalıştır, yeşil olduğunu doğrula**

```bash
dotnet format && dotnet test --filter "FullyQualifiedName~AnnouncementAttachmentTests"
```

Beklenen: PASS.

- [ ] **Step 6: Commit + codegen**

```bash
git add src tests
git commit -m "feat(announcements): ek dosya dtosu stored file kimligini tasir"
```

Sonra backend'i ayağa kaldırıp `oksis-ui`'de codegen'i çalıştırın (B fazındaki adımın aynısı) — `packages/api/src/generated/schema.ts` `fileId` alanını tanımalıdır. Sonraki görevler buna dayanır.

---

### Task 2: İstemci ön elemesi `packages/core`'da

Boyut ve tür kontrolü iki uygulamada iki kez yazılırsa biri güncellenip diğeri unutulur. Kural saf fonksiyondur ve testlidir.

**Files:**
- Modify: `packages/core/src/announcements/constants.ts`
- Modify: `packages/core/src/announcements/logic.ts`
- Modify: `packages/core/src/announcements/types.ts`
- Modify: `packages/core/src/announcements/logic.test.ts`

**Interfaces:**
- Consumes: yok.
- Produces:
  ```ts
  export const ANNOUNCEMENT_ATTACHMENT_MAX_BYTES: number            // 10 * 1024 * 1024
  export const ANNOUNCEMENT_ATTACHMENT_MIME_TYPES: string[]         // pdf/jpeg/png
  export const ANNOUNCEMENT_ATTACHMENT_CATEGORY: string             // "AnnouncementAttachment"
  export type AttachmentRejection = "tooLarge" | "unsupportedType"
  export function validateAttachment(file: { name: string; size: number; type: string }): AttachmentRejection | null
  export function attachmentRejectionMessage(reason: AttachmentRejection): string
  ```
  Task 4 ve Task 6 bunları tüketir. `AnnouncementAttachment` tipine `fileId: string` eklenir.

- [ ] **Step 1: Testi yaz**

`packages/core/src/announcements/logic.test.ts` sonuna:

```ts
describe("validateAttachment — istemci ön elemesi", () => {
  const file = (over: Partial<{ name: string; size: number; type: string }> = {}) => ({
    name: "duyuru.pdf",
    size: 1024,
    type: "application/pdf",
    ...over,
  })

  it("politikaya uyan dosyayı kabul eder", () => {
    expect(validateAttachment(file())).toBeNull()
    expect(validateAttachment(file({ name: "afis.png", type: "image/png" }))).toBeNull()
    expect(validateAttachment(file({ name: "afis.jpg", type: "image/jpeg" }))).toBeNull()
  })

  it("10 MB'ı aşan dosyayı reddeder", () => {
    expect(validateAttachment(file({ size: ANNOUNCEMENT_ATTACHMENT_MAX_BYTES + 1 }))).toBe("tooLarge")
  })

  it("tam 10 MB'ı kabul eder — sınır dâhildir", () => {
    expect(validateAttachment(file({ size: ANNOUNCEMENT_ATTACHMENT_MAX_BYTES }))).toBeNull()
  })

  it("politikada olmayan türü reddeder", () => {
    expect(validateAttachment(file({ name: "rapor.docx", type: "application/msword" }))).toBe(
      "unsupportedType",
    )
  })

  it("MIME'ı boş gelen dosyayı uzantıdan karara bağlar", () => {
    // Bazı tarayıcılar/native köprüler type'ı boş bırakır; uzantı son çaredir.
    expect(validateAttachment(file({ type: "" }))).toBeNull()
    expect(validateAttachment(file({ name: "rapor.docx", type: "" }))).toBe("unsupportedType")
  })

  it("her ret sebebi kullanıcıya gösterilebilir bir Türkçe cümle üretir", () => {
    expect(attachmentRejectionMessage("tooLarge")).toContain("10 MB")
    expect(attachmentRejectionMessage("unsupportedType")).toContain("PDF")
  })
})
```

- [ ] **Step 2: Testi çalıştır, kırmızı olduğunu doğrula**

```bash
npm run test --workspace=@workspace/core -- announcements/logic
```

Beklenen: FAIL.

- [ ] **Step 3: Sabitleri yaz**

`packages/core/src/announcements/constants.ts` sonuna:

```ts
// ═══════════ Ek dosya politikası ═══════════
// Backend FileCategoryPolicyRegistry.cs → FileCategories.AnnouncementAttachment
// ile BİREBİR aynı olmalıdır. Burası ön elemedir, güvenlik sınırı DEĞİL:
// backend aynı politikayı yeniden doğrular ve son sözü o söyler. Yine de aynı
// tutulur — kullanıcıyı 10 MB'lık bir yüklemenin sonunda reddetmek kötüdür.

export const ANNOUNCEMENT_ATTACHMENT_CATEGORY = "AnnouncementAttachment"

export const ANNOUNCEMENT_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024

export const ANNOUNCEMENT_ATTACHMENT_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
] as const

export const ANNOUNCEMENT_ATTACHMENT_EXTENSIONS = ["pdf", "jpg", "jpeg", "png"] as const
```

> `jpeg` uzantısı listede `jpg`'ye ek olarak var: backend uzantı listesi `["pdf","jpg","png"]` olsa da politika denetimi MIME üzerinden de geçer ve kullanıcı dosyasını `.jpeg` uzantısıyla seçebilir. Ön eleme burada gevşek, backend'de kesindir.

- [ ] **Step 4: Fonksiyonları yaz**

`packages/core/src/announcements/logic.ts` sonuna:

```ts
export type AttachmentRejection = "tooLarge" | "unsupportedType"

/**
 * Ek dosya ön elemesi. `null` = kabul.
 *
 * Tür kararı ÖNCE MIME'a bakar; MIME boşsa (bazı tarayıcılar ve RN native
 * köprüsü onu boş bırakabilir) uzantıya düşer. İkisi de tutmuyorsa reddedilir —
 * "emin değilsem geçir" burada yanlış olurdu: kullanıcı 10 MB yükleyip
 * backend'den ret almaktansa saniyesinde uyarılmalıdır.
 */
export function validateAttachment(file: {
  name: string
  size: number
  type: string
}): AttachmentRejection | null {
  if (file.size > ANNOUNCEMENT_ATTACHMENT_MAX_BYTES) return "tooLarge"

  const mimeOk = (ANNOUNCEMENT_ATTACHMENT_MIME_TYPES as readonly string[]).includes(file.type)
  if (mimeOk) return null

  if (file.type) return "unsupportedType"

  const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
  return (ANNOUNCEMENT_ATTACHMENT_EXTENSIONS as readonly string[]).includes(ext)
    ? null
    : "unsupportedType"
}

/** Ret sebebinin kullanıcıya gösterilecek karşılığı. */
export function attachmentRejectionMessage(reason: AttachmentRejection): string {
  return reason === "tooLarge"
    ? "Dosya 10 MB sınırını aşıyor."
    : "Yalnız PDF, JPG ve PNG dosyaları eklenebilir."
}
```

- [ ] **Step 5: `AnnouncementAttachment` tipine `fileId` ekle**

`packages/core/src/announcements/types.ts`:

```ts
export interface AnnouncementAttachment {
  /** `StoredFile.Id` — indirme bu kimlikle başlatılır. */
  fileId: string
  name: string
  size: number
  mimeType: string
  /** İndirme UCU (dosyanın kendisi değil): auth'lu çağrılır, presigned URL döner. */
  url: string
}
```

`packages/api/src/announcements/endpoints.ts:126-132`'de eşleyiciye alanı ekleyin:

```ts
    attachment: d.attachment
      ? {
          fileId: String(d.attachment.fileId ?? ""),
          name: d.attachment.name,
          size: num(d.attachment.size),
          mimeType: d.attachment.mimeType,
          url: d.attachment.url,
        }
      : null,
```

- [ ] **Step 6: Testi çalıştır, yeşil olduğunu doğrula**

```bash
npm run test --workspace=@workspace/core -- announcements/logic
npm run typecheck --workspace=@workspace/core && npm run typecheck --workspace=@workspace/api
```

Beklenen: PASS. Mevcut `endpoints.test.ts`'teki ek dosya fixture'ı `fileId` alanı olmadığı için kırılırsa fixture'a ekleyin.

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/announcements packages/api/src/announcements
git commit -m "feat(announcements): ek dosya on elemesi core'a tasindi"
```

---

### Task 3: `packages/api` dosya modülü

Depoda `packages/api/src/files` **yok**. Yükleme ve indirme uçları buraya gelir.

**Files:**
- Create: `packages/api/src/files/endpoints.ts`
- Create: `packages/api/src/files/queries.ts`
- Create: `packages/api/src/files/endpoints.test.ts`
- Modify: `packages/api/src/index.ts`
- Modify: `packages/api/src/client/query-keys.ts`

**Interfaces:**
- Consumes: `getClient`, `unwrap` (`packages/api/src/client`), `ANNOUNCEMENT_ATTACHMENT_CATEGORY`.
- Produces:
  ```ts
  export interface UploadedFile { fileId: string; name: string; size: number; category: string; status: string; virusScanStatus: string }
  export function uploadFile(input: { file: File; category: string }): Promise<UploadedFile>
  export function getFileDownloadUrl(fileId: string): Promise<{ url: string; ttlMinutes: number }>
  export function useUploadFile(): UseMutationResult<UploadedFile, unknown, { file: File; category: string }>
  ```

- [ ] **Step 1: Testi yaz**

Create `packages/api/src/files/endpoints.test.ts` — `packages/api/src/announcements/endpoints.test.ts`'in kurulum kalıbını (fetch mock, `configureApi`) birebir kopyalayın:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getFileDownloadUrl, uploadFile } from "./endpoints"

describe("uploadFile", () => {
  it("multipart gövdeye dosyayı ve kategoriyi yazar", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        data: {
          fileId: "f-1",
          originalFileName: "duyuru.pdf",
          category: "AnnouncementAttachment",
          sizeBytes: 2048,
          sha256Checksum: "abc",
          status: "Active",
          virusScanStatus: "Clean",
        },
      }),
    )

    const file = new File(["x"], "duyuru.pdf", { type: "application/pdf" })
    const result = await uploadFile({ file, category: "AnnouncementAttachment" })

    const init = fetchMock.mock.calls[0]![1] as RequestInit
    expect(init.body).toBeInstanceOf(FormData)
    const fd = init.body as FormData
    expect(fd.get("category")).toBe("AnnouncementAttachment")
    expect(fd.get("file")).toBeInstanceOf(File)
    expect(result.fileId).toBe("f-1")
    expect(result.size).toBe(2048)
  })

  it("sunucu reddederse ApiError fırlatır", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        { data: null, errors: [{ code: "Files.PolicyViolation", message: "Dosya 10 MB sınırını aşıyor." }] },
        422,
      ),
    )
    const file = new File(["x"], "buyuk.pdf", { type: "application/pdf" })
    await expect(uploadFile({ file, category: "AnnouncementAttachment" })).rejects.toMatchObject({
      status: 422,
      message: "Dosya 10 MB sınırını aşıyor.",
    })
  })
})

describe("getFileDownloadUrl", () => {
  it("zarfı açıp kısa ömürlü URL'i döndürür", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ data: { url: "https://depo/imzali", ttlMinutes: 10 } }),
    )
    await expect(getFileDownloadUrl("f-1")).resolves.toEqual({
      url: "https://depo/imzali",
      ttlMinutes: 10,
    })
  })
})
```

> `jsonResponse` ve `fetchMock` kurulumunu var olan test dosyasından kopyalayın; yeni bir yardımcı yazmayın.

- [ ] **Step 2: Testi çalıştır, kırmızı olduğunu doğrula**

```bash
npm run test --workspace=@workspace/api -- files/endpoints
```

Beklenen: FAIL — modül yok.

- [ ] **Step 3: Uçları yaz**

Create `packages/api/src/files/endpoints.ts`:

```ts
import { getClient } from "../client/client"
import { unwrap } from "../client/request"
import type { components } from "../generated/schema"

type S = components["schemas"]

export interface UploadedFile {
  fileId: string
  name: string
  size: number
  category: string
  status: string
  virusScanStatus: string
}

/**
 * Tek adımlı (proxy) dosya yükleme — `POST /api/v1/files`.
 *
 * Presigned (`/files/initiate` → depoya PUT → `/files/{id}/confirm`) akışı
 * KULLANILMAZ: `FileCategoryPolicyRegistry`'de `AnnouncementAttachment`
 * `ForcePresigned: false, AllowMultipart: false, 10 MB` ilan ediyor, yani
 * üç adımlı akışın (15 dk TTL, iptal, yeniden deneme) getirdiği karmaşıklığın
 * bu kategoride karşılığı yok.
 *
 * Gövde multipart'tır ama generated şema onu `application/x-www-form-urlencoded`
 * ilan ediyor (IFormFile + [FromForm] için .NET OpenAPI davranışı) — bu yüzden
 * `bodySerializer` ile FormData elle kurulur. `body` `undefined` OLMAMALI,
 * openapi-fetch aksi hâlde serileştiriciyi hiç çağırmaz. Emsal:
 * `attendance/endpoints.ts` → `createExcuse`.
 */
export async function uploadFile(input: { file: File; category: string }): Promise<UploadedFile> {
  const dto = await unwrap<S["StoredFileDto"]>(
    await getClient().POST("/api/v1/files", {
      body: {} as never,
      bodySerializer: () => {
        const fd = new FormData()
        fd.append("file", input.file)
        fd.append("category", input.category)
        return fd
      },
    }),
  )
  return {
    fileId: String(dto?.fileId ?? ""),
    name: dto?.originalFileName ?? "",
    size: Number(dto?.sizeBytes) || 0,
    category: dto?.category ?? "",
    status: dto?.status ?? "",
    virusScanStatus: dto?.virusScanStatus ?? "",
  }
}

/**
 * İndirme URL'i. `AnnouncementAttachment.url` bir DOSYA DEĞİL, bu ucun yoludur:
 * çağrı auth'ludur, JSON zarfı döner ve içindeki kısa ömürlü (10 dk) presigned
 * URL'e yönlendirilir. `<a href>` ile doğrudan açmak zarfın kendisini indirirdi.
 */
export async function getFileDownloadUrl(
  fileId: string,
): Promise<{ url: string; ttlMinutes: number }> {
  const dto = await unwrap<S["FileDownloadUrlDto"]>(
    await getClient().GET("/api/v1/files/{id}/download-url", {
      params: { path: { id: fileId } },
    }),
  )
  return { url: dto?.url ?? "", ttlMinutes: Number(dto?.ttlMinutes) || 0 }
}
```

- [ ] **Step 4: Hook'u yaz**

Create `packages/api/src/files/queries.ts`:

```ts
import { useMutation } from "@tanstack/react-query"

import { uploadFile } from "./endpoints"

/**
 * Dosya yükleme. Sorgu önbelleği İNVALİDE EDİLMEZ: yüklenen dosya henüz hiçbir
 * listeye ait değildir — duyuruya bağlanması `createAnnouncement`'ın
 * `attachmentFileId` alanıyla olur ve o mutasyon zaten duyuru anahtarlarını
 * invalide eder.
 */
export function useUploadFile() {
  return useMutation({
    mutationFn: (input: { file: File; category: string }) => uploadFile(input),
  })
}
```

- [ ] **Step 5: Modülü dışa aç**

`packages/api/src/index.ts`'e ekleyin (dosyadaki mevcut sıralamayı koruyun):

```ts
export * from "./files/endpoints"
export * from "./files/queries"
```

- [ ] **Step 6: Testi çalıştır, yeşil olduğunu doğrula**

```bash
npm run test --workspace=@workspace/api -- files/endpoints
npm run typecheck --workspace=@workspace/api
```

Beklenen: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/api/src
git commit -m "feat(files): tek adimli yukleme ve indirme uclari istemciye eklendi"
```

---

### Task 4: MSW dosya handler'ları

Ekranlar mock'a karşı geliştirilecek; mock yoksa compose formu yüklemede takılır.

**Files:**
- Create: `packages/api-mocks/src/files/file-handlers.ts`
- Modify: `packages/api-mocks/src/index.ts` (handler listesi)

**Interfaces:**
- Consumes: Task 3'ün uç sözleşmeleri.
- Produces: yok.

- [ ] **Step 1: Handler'ları yaz**

Create `packages/api-mocks/src/files/file-handlers.ts`. Zarf yardımcılarını `announcements/announcement-handlers.ts`'ten aynı biçimde kurun:

```ts
import { http, HttpResponse } from "msw"

// Yüklenen dosyalar bellekte tutulur; indirme ucu aynı kimliği tanısın diye.
const uploaded = new Map<string, { name: string; size: number }>()
let seq = 0

function envelope<T>(data: T) {
  return { data, meta: null, errors: null, correlationId: "mock" }
}

export const fileHandlers = [
  http.post("*/api/v1/files", async ({ request }) => {
    const form = await request.formData()
    const file = form.get("file")
    const category = String(form.get("category") ?? "")

    if (!(file instanceof File)) {
      return HttpResponse.json(
        {
          data: null,
          meta: null,
          errors: [{ code: "Error.Validation", message: "Dosya boş olamaz." }],
          correlationId: "mock",
        },
        { status: 400 },
      )
    }

    // Gerçek uç FileCategoryPolicy ile yeniden doğrular; mock aynı sınırı
    // uygular ki istemci ön elemesini atlayan bir hata mock'ta da görünsün.
    if (file.size > 10 * 1024 * 1024) {
      return HttpResponse.json(
        {
          data: null,
          meta: null,
          errors: [{ code: "Files.PolicyViolation", message: "Dosya 10 MB sınırını aşıyor." }],
          correlationId: "mock",
        },
        { status: 422 },
      )
    }

    const fileId = `mock-file-${++seq}`
    uploaded.set(fileId, { name: file.name, size: file.size })

    return HttpResponse.json(
      envelope({
        fileId,
        originalFileName: file.name,
        category,
        sizeBytes: file.size,
        sha256Checksum: "mock-checksum",
        status: "Active",
        // Gerçekte tarama asenkrondur ve Quarantined olabilir; mock temiz döner.
        virusScanStatus: "Clean",
      }),
    )
  }),

  http.get("*/api/v1/files/:id/download-url", ({ params }) => {
    const id = String(params.id)
    if (!uploaded.has(id) && !id.startsWith("f-")) {
      return HttpResponse.json(
        {
          data: null,
          meta: null,
          errors: [{ code: "not_found", message: "Dosya bulunamadı." }],
          correlationId: "mock",
        },
        { status: 404 },
      )
    }
    // Gerçek uç kısa ömürlü presigned URL döner; mock sabit bir yer tutucu verir.
    return HttpResponse.json(envelope({ url: `https://mock.oksis/files/${id}`, ttlMinutes: 10 }))
  }),
]
```

- [ ] **Step 2: Handler listesine ekle**

`packages/api-mocks/src/index.ts` içinde diğer handler dizilerinin yanına `...fileHandlers` ekleyin.

- [ ] **Step 3: Doğrula ve commit**

```bash
npm run typecheck --workspace=@workspace/api-mocks && npm run lint --workspace=@workspace/api-mocks
git add packages/api-mocks/src
git commit -m "feat(files): msw dosya yukleme ve indirme handlerlari eklendi"
```

---

### Task 5: Web compose formu gerçekten yükler

Bugün form dosya seçiyor ama **hiçbir şey yüklemiyor**: kod yorumu bile "yalnız meta gönderilir" diyor. Ayrıca çoklu seçim var, oysa duyurunun tek bir eki olabilir; metin "ofis dosyası" diyor, oysa politika yalnız PDF/JPG/PNG kabul ediyor.

**Files:**
- Modify: `apps/web/features/announcements/compose.tsx:350-395`
- Modify: `apps/web/features/announcements/announcements-page.tsx` (submit yolu)

**Interfaces:**
- Consumes: `useUploadFile`, `validateAttachment`, `attachmentRejectionMessage`, `ANNOUNCEMENT_ATTACHMENT_CATEGORY`, `createAnnouncement`'ın `attachmentFileId` parametresi (`endpoints.ts:339` — zaten var).
- Produces: `ComposeSubmit`'in `create` kolu `attachmentFileId: string | null` taşır.

- [ ] **Step 1: Form durumunu tek dosyaya indir**

`compose.tsx` içinde `files` durumu yerine:

```tsx
  // Duyurunun EN FAZLA BİR eki olur (Announcement.AttachmentFileId tekil kolon).
  // Çoklu seçim, backend'in kabul etmediği bir vaat taşıyordu.
  const [attachment, setAttachment] = useState<File | null>(null)
  const [attachmentError, setAttachmentError] = useState<string | null>(null)

  const pickFile = (list: FileList | null) => {
    const file = list?.[0]
    if (!file) return
    const rejection = validateAttachment({ name: file.name, size: file.size, type: file.type })
    if (rejection) {
      setAttachmentError(attachmentRejectionMessage(rejection))
      setAttachment(null)
      return
    }
    setAttachmentError(null)
    setAttachment(file)
  }
```

- [ ] **Step 2: Ekler kartını yeniden çiz**

`compose.tsx:350-395` bloğunun yerine:

```tsx
          {/* Ek */}
          <div className="duy-card">
            <h3>
              <DuyIcon name="clip" size={17} />
              Ek dosya
            </h3>
            <p className="ch">PDF, JPG veya PNG — en fazla 10 MB, tek dosya.</p>
            <label className="duy-drop">
              <DuyIcon name="download" size={20} />
              <span className="t">Dosyayı buraya sürükleyin</span>
              <span className="d">veya tıklayıp bilgisayarınızdan seçin</span>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                style={{ display: "none" }}
                onChange={(e) => pickFile(e.target.files)}
              />
            </label>
            {attachmentError && <div className="duy-err">{attachmentError}</div>}
            {attachment && (
              <div className="duy-files">
                <div className="duy-file">
                  <span className="fi">
                    <DuyIcon name="file" size={16} />
                  </span>
                  <span>
                    <span className="fn" style={{ display: "block" }}>
                      {attachment.name}
                    </span>
                    <span className="fs">{formatAttachmentSize(attachment.size)}</span>
                  </span>
                  <button
                    type="button"
                    className="rm"
                    aria-label="Dosyayı kaldır"
                    onClick={() => setAttachment(null)}
                  >
                    <DuyIcon name="x" size={15} />
                  </button>
                </div>
              </div>
            )}
          </div>
```

- [ ] **Step 3: Gönderim yolunu iki adımlı yap**

`compose.tsx`'in `onSubmit` çağrısına dosyayı taşıyın — `ComposeSubmit`'in `create` kolunda `file: File | null` alanı ekleyin — ve yüklemeyi **üst bileşende** yapın (compose görünüm bileşenidir, ağ çağrısı orada durmamalı).

`announcements-page.tsx` içinde:

```tsx
  const upload = useUploadFile()

  // Ek ÖNCE yüklenir, sonra duyuru kimlikle oluşturulur. Sıra tersine
  // çevrilemez: backend attachmentFileId'yi doğrular ve olmayan bir dosyaya
  // duyuru yayınlamaz. Yükleme başarısızsa duyuru HİÇ oluşturulmaz — sessizce
  // eksiz yayınlamak, yayınlayanın "ek gitti" sanmasına yol açardı
  // (CreateAnnouncementCommandHandler'ın aynı gerekçesi).
  const submitCreate = async (values: AnnouncementFormValues, asDraft: boolean, file: File | null) => {
    let attachmentFileId: string | null = null
    if (file) {
      try {
        const uploaded = await upload.mutateAsync({
          file,
          category: ANNOUNCEMENT_ATTACHMENT_CATEGORY,
        })
        attachmentFileId = uploaded.fileId
      } catch (err) {
        toasts.push({
          tone: "danger",
          icon: "xCircle",
          title: "Ek dosya yüklenemedi",
          desc: mutationErrorDesc(err),
        })
        return
      }
    }
    create.mutate({ ...values, asDraft, attachmentFileId }, { /* mevcut onSuccess/onError aynen */ })
  }
```

> `mutationErrorDesc` C1 Task 2'de tanımlandı. C1 uygulanmadıysa `err instanceof ApiError ? err.message : "Bağlantınızı kontrol edip yeniden deneyin."` satırını yerinde yazın.

Yükleme sürerken birincil düğme kilitli kalmalı: `pending` prop'unu `create.isPending || upload.isPending` yapın ve etiketini `upload.isPending ? "Ek yükleniyor…" : …` olarak ayırın.

- [ ] **Step 4: Doğrula**

```bash
npm run typecheck --workspace=@workspace/web && npm run lint --workspace=@workspace/web
```

Beklenen: PASS.

- [ ] **Step 5: Duman testi**

```bash
npm run dev --workspace=@workspace/web
```

Elle doğrulayın: 10 MB'ı aşan dosya anında reddediliyor; `.docx` reddediliyor; geçerli bir PDF seçilip duyuru yayınlanınca detayda ek görünüyor.

- [ ] **Step 6: Commit**

```bash
git add apps/web/features/announcements
git commit -m "feat(announcements): web compose ek dosyayi gercekten yukluyor"
```

---

### Task 6: Ek dosya indirilebilir hâle gelir

`detail.tsx:118` bugün `<a href={row.attachment.url} download>` diyor. O adres bir dosya değil, JSON zarfı döndüren bir API ucudur ve üstelik auth başlığı olmadan çağrılıyor — bağlantı **çalışmıyor**.

**Files:**
- Modify: `apps/web/features/announcements/detail.tsx:112-124`
- Modify: `apps/mobile/src/features/announcements/components/announcement-detail-screen.tsx`
- Modify: `apps/mobile/src/features/announcements/components/announcement-reader-screen.tsx`

**Interfaces:**
- Consumes: `getFileDownloadUrl(fileId)` (Task 3), `AnnouncementAttachment.fileId` (Task 2).
- Produces: yok.

- [ ] **Step 1: Web indirmesini düzelt**

`detail.tsx`, bileşenin üstünde:

```tsx
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)

  /**
   * Ek `url`'i bir dosya değil, presigned URL döndüren bir API ucudur (auth'lu).
   * Bu yüzden `<a href>` çalışmaz: önce uç çağrılır, zarf açılır ve dönen kısa
   * ömürlü (10 dk) adrese YENİ SEKMEDE gidilir. URL state'te saklanmaz — spec
   * §5.3.3 kısa ömürlü adresin tutulmamasını ve loglanmamasını şart koşar.
   */
  const openAttachment = async (fileId: string) => {
    setDownloadError(null)
    setDownloading(true)
    try {
      const { url } = await getFileDownloadUrl(fileId)
      window.open(url, "_blank", "noopener,noreferrer")
    } catch (err) {
      // Karantinadaki dosyada uç 409 döner: ek VARDIR ama henüz açılamaz.
      setDownloadError(
        err instanceof ApiError ? err.message : "Ek dosya açılamadı. Yeniden deneyin.",
      )
    } finally {
      setDownloading(false)
    }
  }
```

`<a className="rm" href={…} download …>` etiketini düğmeyle değiştirin:

```tsx
                  <button
                    type="button"
                    className="rm"
                    aria-label="Ek dosyayı indir"
                    disabled={downloading}
                    onClick={() => void openAttachment(row.attachment!.fileId)}
                  >
                    <DuyIcon name="download" size={15} />
                  </button>
```

Dosya satırının altına hata çıkışı ekleyin: `{downloadError && <div className="duy-err">{downloadError}</div>}`.

- [ ] **Step 2: Mobil detayda ve okuyucu ekranında aynı akış**

İki ekranda da ek satırına dokunma eylemi bağlanır:

```tsx
  const openAttachment = async (fileId: string) => {
    try {
      const { url } = await getFileDownloadUrl(fileId);
      await Linking.openURL(url);
    } catch {
      setDownloadError('Ek dosya açılamadı. Yeniden deneyin.');
    }
  };
```

`Linking` `expo-linking`'ten gelir (bağımlılık `apps/mobile/package.json:19`'da zaten mevcut). Hata metni `Note tone="danger"` ile satırın altında gösterilir.

> Okuyucu ekranında (`announcement-reader-screen.tsx`) ek satırı bugün hiç çizilmiyorsa, `row.attachment` doluyken web detayındaki aynı görsel bloğu (ikon + ad + boyut + indir) ekleyin — veli ekin varlığını görmeden indiremez.

- [ ] **Step 3: Doğrula**

```bash
npm run typecheck --workspace=@workspace/web && npm run typecheck --workspace=@workspace/mobile
npm run lint --workspace=@workspace/web && npm run lint --workspace=@workspace/mobile
```

Beklenen: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/features/announcements apps/mobile/src/features/announcements
git commit -m "fix(announcements): ek dosya indirme presigned uc uzerinden calisiyor"
```

---

### Task 7: Mobil compose görsel eki alır

**Files:**
- Modify: `apps/mobile/src/features/announcements/components/compose-screen.tsx`
- Modify: `apps/mobile/src/app/announcements/new.tsx`

**Interfaces:**
- Consumes: `expo-image-picker` (`apps/mobile/package.json:17`), `validateAttachment`, `useUploadFile`.
- Produces: `ComposeSubmit`'in `create` kolu mobilde de `file` taşır.

- [ ] **Step 1: Seçici ve sınır notunu ekle**

`compose-screen.tsx`, "Ek dosya" kartı olarak (`excuse-create-screen.tsx:100-138` kalıbının aynısı):

```tsx
/**
 * RN'de gerçek DOM `File` yok — galeriden/kameradan gelen varlık
 * `{uri,name,type}` biçiminde FormData'ya eklenir (native köprü bunu bekler).
 * `uploadFile` imzası web'le paylaşıldığından `File` tipini taşır; burada
 * yapısal olarak uyan nesne bilinçli olarak cast edilir.
 * Emsal: features/attendance/components/excuse-create-screen.tsx.
 */
type PickedFile = { uri: string; name: string; type: string };
const asUploadFile = (picked: PickedFile): File => picked as unknown as File;

async function pickFromLibrary() {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    setAttachmentError('Galeri izni verilmedi.');
    return;
  }
  const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
  if (result.canceled || !result.assets[0]) return;
  const asset = result.assets[0];
  const name = asset.fileName ?? `ek-${Date.now()}.jpg`;
  const type = asset.mimeType ?? 'image/jpeg';
  const rejection = validateAttachment({ name, size: asset.fileSize ?? 0, type });
  if (rejection) {
    setAttachmentError(attachmentRejectionMessage(rejection));
    return;
  }
  setAttachmentError(null);
  setAttachment({ name, file: { uri: asset.uri, name, type } });
}
```

Kartın altına sınırı **açıkça** yazın:

```tsx
            <Note icon="info">
              Mobilden yalnız fotoğraf (JPG/PNG) eklenebilir — en fazla 10 MB. PDF eklemek için
              web arayüzünü kullanın.
            </Note>
```

- [ ] **Step 2: `new.tsx`'te yüklemeyi bağla**

C1 Task 2'de kurulan `submit` fonksiyonunu, web'dekiyle aynı sırayla iki adımlı yapın: önce `upload.mutateAsync({ file: asUploadFile(attachment.file), category: ANNOUNCEMENT_ATTACHMENT_CATEGORY })`, sonra `create.mutate({ …, attachmentFileId })`. Yükleme hatası `setSubmitError` ile forma yazılır ve duyuru **oluşturulmaz**.

- [ ] **Step 3: Doğrula**

```bash
npm run typecheck --workspace=@workspace/mobile && npm run lint --workspace=@workspace/mobile
```

Beklenen: PASS.

- [ ] **Step 4: Duman testi**

```bash
npm run dev --workspace=@workspace/mobile
```

Galeriden bir fotoğraf seçip duyuru yayınlayın; detayda ekin göründüğünü ve dokununca açıldığını doğrulayın.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src
git commit -m "feat(announcements): mobil compose gorsel ek yukluyor"
```

---

## Kapanış doğrulaması

```bash
cd /Users/farukkaya/Repositories/oksis-api
dotnet format && dotnet build && dotnet test --filter "FullyQualifiedName~Announcement"

cd /Users/farukkaya/Repositories/oksis-ui
npm run test --workspace=@workspace/core && npm run test --workspace=@workspace/api
npm run typecheck && npm run lint
```

Uçtan uca duman testi (gerçek backend, Next `rewrites` proxy üzerinden):
1. Yönetici web'den PDF ekli duyuru yayınlar.
2. Aynı duyuru veli mobil gelen kutusunda görünür, ek satırı vardır ve dokununca açılır.
3. Alıcı **olmayan** bir hesapla aynı `fileId` için `/files/{id}/download-url` çağrılır → 404/403 (`AnnouncementEntityScopeResolver` kesiyor).

Sonra `oksis` deposunda:
- Spec §7 "Ek dosya (Documents entegrasyonu)" adımları güncellenir: presigned akış **kullanılmadı**, tek adımlı proxy yükleme seçildi (gerekçe: `ForcePresigned: false`).
- Spec §14'e "Ek dosya yükleme akışı — C3'te tamamlandı; mobilde yalnız görsel" satırı eklenir.
- `docs/modules/announcements/` altında ek dosya bölümüne mobil görsel-sınırı ve `expo-document-picker` backlog'u yazılır.
