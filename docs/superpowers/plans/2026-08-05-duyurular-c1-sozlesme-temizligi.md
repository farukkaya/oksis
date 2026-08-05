# Duyurular C1 — Sözleşme ve Metin Temizliği Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Duyuru yüzeylerinin kullanıcıya söylediği her cümleyi arkadaki gerçekle hizalamak ve hata metinlerini tek konvansiyonda birleştirmek.

**Architecture:** Karar veren her kural `packages/core`'da saf fonksiyon olarak yaşar ve orada test edilir; `apps/web` ile `apps/mobile` yalnız o fonksiyonun döndürdüğünü çizer. Backend tarafında iş yalnız FluentValidation mesajlarının anahtar yerine insan-okunur Türkçeye çekilmesidir — pipeline, zarf ve hata kodları değişmez.

**Tech Stack:** .NET 10 / xUnit + FluentAssertions (backend) · TypeScript + vitest (`packages/core`, `packages/api`) · Next.js 16 (`apps/web`) · Expo Router (`apps/mobile`)

## Global Constraints

- Kullanıcıya dönük her metin **Türkçe**dir. Ham i18n anahtarı ekrana asla basılmaz.
- **`apps/web` ve `apps/mobile`'da test koşucusu YOKTUR.** Test edilebilir her karar `packages/core`'a taşınır ve orada vitest ile test edilir; uygulama katmanı yalnız `npm run typecheck` ve `npm run lint` ile doğrulanır.
- Commit formatı: `<type>(<scope>): türkçe açıklama` — scope modül adı (`announcements`) veya `repo`, **sonda nokta yok**.
- Backend commit'inden önce `dotnet format` zorunludur.
- Backend test adlandırması: `Should_{ExpectedBehavior}_When_{Condition}`.
- Spec §8.3 bağlayıcıdır: **sessiz saat kısıtı yoktur**, dolayısıyla acil işareti onu "delemez". `NotificationPriority` enum'u yoktur.
- Spec K-2 bağlayıcıdır: **push ve e-posta kanalları teslim edilmemiştir**; sunucuda kayıtlı tek kanal `InAppNotificationChannel`'dır.
- Komutlar:
  - Backend test: `dotnet test --filter "FullyQualifiedName~<Sınıf>"`
  - Core test: `npm run test --workspace=@workspace/core`
  - Uygulama doğrulama: `npm run typecheck --workspace=<paket>` ve `npm run lint --workspace=<paket>`

---

## File Structure

| Dosya | Sorumluluk |
|---|---|
| `src/Oksis.Application/Modules/Announcements/Commands/*/[Command]Validator.cs` (5 dosya) | FluentValidation kuralları — mesajlar Türkçe düz metne döner |
| `tests/Oksis.Application.UnitTests/Modules/Announcements/AnnouncementValidatorMessageTests.cs` (**yeni**) | Yapısal bekçi: hiçbir duyuru validator'ı `announcements.errors.` ile başlayan mesaj üretmez |
| `packages/core/src/notifications/constants.ts` | `NOTIFICATION_KIND_CONFIG` — 7 duyuru türü eklenir |
| `packages/core/src/announcements/logic.ts` | `requiresApproval` (test kazanır), `isAmendmentTextValid` (yeniden adlandırma), `withdrawNotice` (**yeni**), `visibleDeliveryChannels` (**yeni**) |
| `packages/core/src/announcements/constants.ts` | `DELIVERY_CHANNEL_CONFIG` — `push`/`email` kilitlenir, `comingSoon` alanı eklenir |
| `apps/web/features/announcements/announcements-page.tsx` | Tüm mutasyon `onError`'ları hatayı okur |
| `apps/web/features/announcements/modals.tsx` | `WithdrawModal` metni statüye göre, acil uyarısı düzeltilir |
| `apps/web/features/announcements/compose.tsx` | Kanal varsayılanı, kilit, önizleme notu, acil metni |
| `apps/web/features/announcements/detail.tsx` | Tek kanallı raporda tablo gizlenir |
| `apps/mobile/src/features/announcements/lib/announcement-toast.ts` (**yeni**) | `new.tsx` → liste ekranına başarı mesajı kanalı |
| `apps/mobile/src/app/announcements/new.tsx` | Hata yüzeyi + başarı mesajı |
| `apps/mobile/src/features/announcements/components/compose-screen.tsx` | Kanal kilidi, acil metni |
| `apps/mobile/src/features/announcements/components/publish-sheets.tsx` | Onay sayfası kanal rozetleri + acil notu |
| `apps/mobile/src/features/announcements/components/announcement-detail-screen.tsx` | Tek kanallı raporda tablo gizlenir, geri çekme metni |

---

### Task 1: Validator mesajları Türkçeye çekilir

Bugün 13 ayrı `announcements.errors.*` anahtarı validator'lardan, düz Türkçe metinler ise handler'lardan **aynı** `ApiError.message` alanına çıkıyor. İstemci `err.message`'ı doğrudan bastığı için doğrulama hatalarında kullanıcıya ham anahtar görünüyor. Karar: anahtar katmanı kaldırılır, handler konvansiyonu tek konvansiyon olur.

**Files:**
- Modify: `src/Oksis.Application/Modules/Announcements/Commands/CreateAnnouncement/CreateAnnouncementCommandValidator.cs:24-70`
- Modify: `src/Oksis.Application/Modules/Announcements/Commands/AmendAnnouncement/AmendAnnouncementCommandValidator.cs:15-22`
- Modify: `src/Oksis.Application/Modules/Announcements/Commands/WithdrawAnnouncement/WithdrawAnnouncementCommandValidator.cs:14-15`
- Modify: `src/Oksis.Application/Modules/Announcements/Commands/RejectAnnouncement/RejectAnnouncementCommandValidator.cs:13-14`
- Modify: `src/Oksis.Application/Modules/Announcements/Commands/UpdateAnnouncementModeration/UpdateAnnouncementModerationCommandValidator.cs:19-20`
- Modify: `tests/Oksis.Application.UnitTests/Modules/Announcements/AmendAnnouncementCommandValidatorTests.cs:38,49,59,77`
- Modify: `tests/Oksis.Application.UnitTests/Modules/Announcements/CreateAnnouncementCommandValidatorTests.cs:117,136,155`
- Create: `tests/Oksis.Application.UnitTests/Modules/Announcements/AnnouncementValidatorMessageTests.cs`

**Interfaces:**
- Consumes: yok (ilk görev).
- Produces: 13 anahtarın kanonik Türkçe karşılığı. Sonraki hiçbir görev bu metinleri değiştirmez; istemci tarafı (Task 2) bunların **düz metin** olduğuna güvenir.

Kanonik eşleme — bu tablo bağlayıcıdır:

| Anahtar | Türkçe metin |
|---|---|
| `id-required` | `Duyuru kimliği zorunludur.` |
| `title-invalid` | `Başlık 3-90 karakter olmalıdır.` |
| `body-invalid` | `Duyuru metni en az 6 karakter olmalıdır.` |
| `audience-required` | `En az bir hedef kitle seçilmelidir.` |
| `audience-dimension-invalid` | `Geçersiz hedef katmanı.` |
| `audience-bucket-invalid` | `Geçersiz alıcı kovası.` |
| `audience-key-invalid` | `Hedef anahtarı boş olamaz.` |
| `channel-invalid` | `Geçersiz gönderim kanalı.` |
| `scheduled-at-invalid` | `Zamanlama tarihi geçersiz.` |
| `valid-until-invalid` | `Geçerlilik bitiş tarihi geçersiz.` |
| `attachment-file-id-invalid` | `Ek dosya kimliği geçersiz.` |
| `reason-required` | `Gerekçe zorunludur.` |
| `moderation-invalid` | `Bilinmeyen moderasyon modu.` |

> `moderation-invalid` metni, `UpdateAnnouncementModerationCommandHandler`'ın aynı durumda ürettiği handler mesajıyla **birebir aynıdır** — kullanıcı hangi katmanın kestiğini fark etmemelidir.

- [ ] **Step 1: Mevcut testleri Türkçe metni bekleyecek şekilde değiştir**

`tests/Oksis.Application.UnitTests/Modules/Announcements/AmendAnnouncementCommandValidatorTests.cs` içinde dört satır:

```csharp
// satır 38
result.Errors.Should().Contain(e => e.ErrorMessage == "Duyuru kimliği zorunludur.");
// satır 49
result.Errors.Should().Contain(e => e.ErrorMessage == "Başlık 3-90 karakter olmalıdır.");
// satır 59
result.Errors.Should().Contain(e => e.ErrorMessage == "Başlık 3-90 karakter olmalıdır.");
// satır 77
result.Errors.Should().Contain(e => e.ErrorMessage == "Duyuru metni en az 6 karakter olmalıdır.");
```

`tests/Oksis.Application.UnitTests/Modules/Announcements/CreateAnnouncementCommandValidatorTests.cs` içinde üç satır:

```csharp
// satır 117
result.Errors.Should().Contain(e => e.ErrorMessage == "En az bir hedef kitle seçilmelidir.");
// satır 136
result.Errors.Should().Contain(e => e.ErrorMessage == "En az bir hedef kitle seçilmelidir.");
// satır 155
result.Errors.Should().Contain(e => e.ErrorMessage == "Geçersiz gönderim kanalı.");
```

- [ ] **Step 2: Yapısal bekçi testini yaz**

Create `tests/Oksis.Application.UnitTests/Modules/Announcements/AnnouncementValidatorMessageTests.cs`:

```csharp
using FluentAssertions;
using FluentValidation.Results;
using Oksis.Application.Modules.Announcements.Commands.AmendAnnouncement;
using Oksis.Application.Modules.Announcements.Commands.CreateAnnouncement;
using Oksis.Application.Modules.Announcements.Commands.RejectAnnouncement;
using Oksis.Application.Modules.Announcements.Commands.UpdateAnnouncementModeration;
using Oksis.Application.Modules.Announcements.Commands.WithdrawAnnouncement;
using Xunit;

namespace Oksis.Application.UnitTests.Modules.Announcements;

/// <summary>
/// Duyuru validator'ları i18n ANAHTARI değil, insan-okunur Türkçe metin üretir.
///
/// <para>Gerekçe: <c>ValidationBehavior</c> mesajı doğrudan zarfa yazar ve istemci
/// <c>ApiError.message</c>'ı ekrana basar. Depoda çeviri katmanı YOKTUR — anahtar
/// dönen bir kural kullanıcıya "announcements.errors.title-invalid" gösterir.
/// Handler hataları zaten Türkçedir; bu test iki katmanın ayrışmasını engeller.</para>
/// </summary>
public sealed class AnnouncementValidatorMessageTests
{
    public static IEnumerable<object[]> AllInvalidResults()
    {
        yield return [new CreateAnnouncementCommandValidator().Validate(
            new CreateAnnouncementCommand(
                Title: "", Body: "", Audience: null!, Channels: null!, Type: null,
                Urgent: false, Pinned: false, ScheduledAt: "yok", ValidUntil: "yok",
                AsDraft: false, AttachmentFileId: "guid-degil"))];

        yield return [new AmendAnnouncementCommandValidator().Validate(
            new AmendAnnouncementCommand(Guid.Empty, Title: "", Body: ""))];

        yield return [new WithdrawAnnouncementCommandValidator().Validate(
            new WithdrawAnnouncementCommand(Guid.Empty, Reason: ""))];

        yield return [new RejectAnnouncementCommandValidator().Validate(
            new RejectAnnouncementCommand(Guid.Empty, Reason: ""))];

        yield return [new UpdateAnnouncementModerationCommandValidator().Validate(
            new UpdateAnnouncementModerationCommand(Mode: "yok"))];
    }

    [Theory]
    [MemberData(nameof(AllInvalidResults))]
    public void Should_ProduceHumanReadableTurkish_When_ValidationFails(ValidationResult result)
    {
        result.IsValid.Should().BeFalse("test girdisi bilerek geçersizdir");
        result.Errors.Should().NotBeEmpty();
        result.Errors.Should().OnlyContain(e => !e.ErrorMessage.StartsWith("announcements.errors."));
        result.Errors.Should().OnlyContain(e => e.ErrorMessage.EndsWith("."));
    }
}
```

> Komut yapıcılarının konumsal parametre adları yukarıdaki gibidir; derlerken imza uyuşmazlığı çıkarsa ilgili `*Command.cs` dosyasındaki `record` tanımına bakıp adları eşleyin — **mesaj beklentisini değiştirmeyin**.

- [ ] **Step 3: Testleri çalıştır, kırmızı olduğunu doğrula**

```bash
dotnet test --filter "FullyQualifiedName~AnnouncementValidatorMessageTests|FullyQualifiedName~AmendAnnouncementCommandValidatorTests|FullyQualifiedName~CreateAnnouncementCommandValidatorTests"
```

Beklenen: FAIL — mesajlar hâlâ `announcements.errors.*` anahtarı.

- [ ] **Step 4: Beş validator dosyasındaki 20 `WithMessage` çağrısını tabloya göre değiştir**

`CreateAnnouncementCommandValidator.cs`:

```csharp
RuleFor(x => x.Title).NotEmpty().Length(3, 90)
    .WithMessage("Başlık 3-90 karakter olmalıdır.");

RuleFor(x => x.Body).NotEmpty().MinimumLength(6)
    .WithMessage("Duyuru metni en az 6 karakter olmalıdır.");

RuleFor(x => x.Audience).NotNull()
    .WithMessage("En az bir hedef kitle seçilmelidir.");

RuleFor(x => x.Audience).NotEmpty()
    .WithMessage("En az bir hedef kitle seçilmelidir.");

RuleForEach(x => x.Audience).ChildRules(audience =>
{
    audience.RuleFor(a => a.Dimension).Must(_validDimensions.Contains)
        .WithMessage("Geçersiz hedef katmanı.");
    audience.RuleFor(a => a.Bucket).Must(_validBuckets.Contains)
        .WithMessage("Geçersiz alıcı kovası.");
    audience.RuleFor(a => a.Key).NotEmpty()
        .WithMessage("Hedef anahtarı boş olamaz.");
});

RuleFor(x => x.Channels).NotNull()
    .WithMessage("Geçersiz gönderim kanalı.");

RuleForEach(x => x.Channels).Must(_validChannels.Contains)
    .WithMessage("Geçersiz gönderim kanalı.");

RuleFor(x => x.ScheduledAt).Must(BeAValidTimestampOrNull)
    .WithMessage("Zamanlama tarihi geçersiz.");

RuleFor(x => x.ValidUntil).Must(BeAValidTimestampOrNull)
    .WithMessage("Geçerlilik bitiş tarihi geçersiz.");

RuleFor(x => x.AttachmentFileId)
    .Must(v => v is null || Guid.TryParse(v, out _))
    .WithMessage("Ek dosya kimliği geçersiz.");
```

`AmendAnnouncementCommandValidator.cs`:

```csharp
RuleFor(x => x.Id).NotEmpty()
    .WithMessage("Duyuru kimliği zorunludur.");

RuleFor(x => x.Title).NotEmpty().Length(3, 90)
    .WithMessage("Başlık 3-90 karakter olmalıdır.");

RuleFor(x => x.Body).NotEmpty().MinimumLength(6)
    .WithMessage("Duyuru metni en az 6 karakter olmalıdır.");
```

`WithdrawAnnouncementCommandValidator.cs` ve `RejectAnnouncementCommandValidator.cs` (ikisi de aynı iki satır):

```csharp
RuleFor(x => x.Id).NotEmpty().WithMessage("Duyuru kimliği zorunludur.");
RuleFor(x => x.Reason).NotEmpty().WithMessage("Gerekçe zorunludur.");
```

`UpdateAnnouncementModerationCommandValidator.cs`:

```csharp
RuleFor(x => x.Mode).NotNull().Must(AnnouncementEnumWire.ValidModerationModes.Contains)
    .WithMessage("Bilinmeyen moderasyon modu.");
```

- [ ] **Step 5: `CreateAnnouncementCommandHandler`'daki artık yorumu düzelt**

`src/Oksis.Application/Modules/Announcements/Commands/CreateAnnouncement/CreateAnnouncementCommandHandler.cs:171-177` şu anda "Aynı kuralın VALIDATOR mesajı anahtar kalır — o katmanda dosyadaki diğer dokuz kural da `announcements.errors.*` üretir" diyor. Bu artık yanlıştır. Yorumu şununla değiştirin:

```csharp
// Mesaj İNSAN OKUNUR Türkçedir, i18n anahtarı DEĞİL: bu modülün handler
// hatalarının tamamı ("Aktif sezon bulunamadı.", "Bilinmeyen moderasyon
// modu.") öyledir ve C1'den sonra VALIDATOR mesajları da öyledir — depoda
// çeviri katmanı yoktur, anahtar dönen bir kural ekrana ham anahtar basardı.
// Kuralı AnnouncementValidatorMessageTests yapısal olarak kilitler.
```

- [ ] **Step 6: Testleri çalıştır, yeşil olduğunu doğrula**

```bash
dotnet format
dotnet test --filter "FullyQualifiedName~Announcement"
```

Beklenen: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/Oksis.Application/Modules/Announcements tests/Oksis.Application.UnitTests/Modules/Announcements
git commit -m "fix(announcements): dogrulama mesajlari ham anahtar yerine turkce doner"
```

---

### Task 2: Mutasyon hataları ekranda görünür olur

Web'de `create`, `withdraw`, `approve`, `reject` `onError`'ları hatayı **hiç okumadan** "Bağlantınızı kontrol edip yeniden deneyin" diyor; 422 doğrulama ve 403 yetki hataları da bağlantı arızası gibi görünüyor. Mobilde `new.tsx`'in `onError`'ı hiç yok — form sessizce bekliyor.

**Files:**
- Modify: `apps/web/features/announcements/announcements-page.tsx:82-85,193-198,422-425,459-462,515-518`
- Create: `apps/mobile/src/features/announcements/lib/announcement-toast.ts`
- Modify: `apps/mobile/src/features/announcements/index.ts`
- Modify: `apps/mobile/src/app/announcements/new.tsx:36-42`
- Modify: `apps/mobile/src/app/(tabs)/announcements.tsx`

**Interfaces:**
- Consumes: Task 1'in ürettiği düz Türkçe doğrulama metinleri — `ApiError.message` artık doğrudan gösterilebilir.
- Produces: `mutationErrorDesc(err: unknown): string` (web, dosya içi); `publishAnnouncementToast(message: string): void` ve `subscribeAnnouncementToast(listener: (m: string) => void): () => void` (mobil).

- [ ] **Step 1: Web — `amendErrorDesc`'i genelleştir**

`apps/web/features/announcements/announcements-page.tsx:82-85`:

```tsx
/**
 * Sunucu yanıt verdiyse mesajı OLDUĞU GİBİ gösterilir: hem handler hem
 * validator hataları C1'den sonra insan-okunur Türkçedir (bkz.
 * AnnouncementValidatorMessageTests). Bağlantı tavsiyesi yalnız istek hiç
 * ulaşmadığında doğrudur — o durumda hata ApiError DEĞİLDİR.
 */
function mutationErrorDesc(err: unknown): string {
  if (err instanceof ApiError) return err.message
  return "Bağlantınızı kontrol edip yeniden deneyin."
}
```

- [ ] **Step 2: Web — beş `onError` çağrısını bu fonksiyona bağla**

Satır 161'deki `desc: amendErrorDesc(err)` → `desc: mutationErrorDesc(err)`.

Satır 193-198 (`create`):

```tsx
onError: (err) =>
  toasts.push({
    tone: "danger",
    icon: "xCircle",
    title: "Duyuru yayınlanamadı",
    desc: mutationErrorDesc(err),
  }),
```

Satır 422-425 (`withdraw`), 459-462 (`approve`), 515-518 (`reject`): aynı biçimde `onError: () => …` imzasını `onError: (err) => …` yapın ve `desc` alanını `mutationErrorDesc(err)` ile doldurun. Mevcut `title` metinlerine dokunmayın.

- [ ] **Step 3: Web — typecheck + lint**

```bash
npm run typecheck --workspace=@workspace/web && npm run lint --workspace=@workspace/web
```

Beklenen: PASS. (Paket adı `apps/web/package.json`'daki `name` alanıdır; farklıysa onu kullanın.)

- [ ] **Step 4: Mobil — toast kanalını oluştur**

Create `apps/mobile/src/features/announcements/lib/announcement-toast.ts`:

```ts
// `new.tsx` (stack push) yayınladıktan sonra listeye (`router.back()`) döner —
// iki ekran ayrı rota olduğundan React state paylaşmaz. Bu minimal
// yayın/dinleme kanalı yalnız "Taslak kaydedildi" / "Duyuru zamanlandı" /
// "N kişiye gönderiliyor" mesajını taşır; genel bir store DEĞİL.
// Emsal: features/attendance/lib/attendance-toast.ts.
type Listener = (message: string) => void;

let listeners: Listener[] = [];

export function publishAnnouncementToast(message: string): void {
  for (const listener of listeners) listener(message);
}

export function subscribeAnnouncementToast(listener: Listener): () => void {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}
```

`apps/mobile/src/features/announcements/index.ts`'e ekleyin:

```ts
export { publishAnnouncementToast, subscribeAnnouncementToast } from './lib/announcement-toast';
```

- [ ] **Step 5: Mobil — `new.tsx`'i `edit.tsx` ile simetrik hâle getir**

`apps/mobile/src/app/announcements/new.tsx`, import bloğuna `useState` ve `ApiError` ekleyip `submit`'i değiştirin:

```tsx
const [submitError, setSubmitError] = useState<string | null>(null);

const submit = (payload: ComposeSubmit) => {
  if (payload.kind !== 'create') return;
  setSubmitError(null);
  create.mutate(
    { ...payload.values, asDraft: payload.asDraft },
    {
      // Web üç ayrı bildirim gösteriyor (taslak / zamanlandı / yayınlandı);
      // mobilde ekran kapandığı için mesaj liste ekranına taşınır.
      onSuccess: (row) => {
        publishAnnouncementToast(
          payload.asDraft
            ? 'Taslak kaydedildi'
            : row.status === 'scheduled'
              ? 'Duyuru zamanlandı — seçtiğiniz tarihte otomatik yayınlanacak'
              : `Duyuru yayınlandı — ${row.recipientCount ?? 0} kişiye gönderiliyor`,
        );
        router.back();
      },
      onError: (err) =>
        setSubmitError(
          err instanceof ApiError ? err.message : 'Bağlantınızı kontrol edip yeniden deneyin.',
        ),
    },
  );
};
```

`<ComposeScreen … />` çağrısına `submitError={submitError}` prop'unu ekleyin (prop `edit.tsx`'te zaten kullanılıyor, `ComposeScreen` imzasında mevcuttur).

- [ ] **Step 6: Mobil — liste ekranı mesajı dinlesin**

`apps/mobile/src/app/(tabs)/announcements.tsx` içinde, ekranın en üst seviyesinde:

```tsx
const [toast, setToast] = React.useState<string | null>(null);

React.useEffect(() => subscribeAnnouncementToast(setToast), []);
```

Ekranda mesajı gösterirken var olan `Note` bileşenini kullanın ve dokunulunca kapatın:

```tsx
{toast ? (
  <Pressable onPress={() => setToast(null)}>
    <Note icon="check">{toast}</Note>
  </Pressable>
) : null}
```

> Bu dosyanın mevcut import listesi ve düzeni korunacak; `Note`/`Pressable` zaten import edilmemişse ekleyin.

- [ ] **Step 7: Mobil — typecheck + lint**

```bash
npm run typecheck --workspace=@workspace/mobile && npm run lint --workspace=@workspace/mobile
```

Beklenen: PASS.

- [ ] **Step 8: Commit**

```bash
git add apps/web/features/announcements apps/mobile/src/app/announcements apps/mobile/src/app/\(tabs\)/announcements.tsx apps/mobile/src/features/announcements
git commit -m "fix(announcements): mutasyon hatalari ve yayin sonucu ekranda gorunur"
```

---

### Task 3: Bildirim listesi duyuru türlerini tanır

Backend 7 yeni `NotificationKind` yayınlıyor (`AnnouncementPublished`, `AnnouncementScheduledExecuted`, `AnnouncementSubmittedForApproval`, `AnnouncementApproved`, `AnnouncementRejected`, `AnnouncementWithdrawn`, `AnnouncementAmended`). `NOTIFICATION_KIND_CONFIG` hiçbirini tanımıyor → yedisi de `NOTIFICATION_KIND_FALLBACK`'e ("Bildirim", zil ikonu) düşüyor. Kullanılmayan `megaphone` ikon anahtarı zaten tanımlı.

**Files:**
- Modify: `packages/core/src/notifications/constants.ts:22-38`
- Create: `packages/core/src/notifications/constants.test.ts` (dosya varsa yeni `describe` bloğu ekleyin)

**Interfaces:**
- Consumes: yok.
- Produces: `NOTIFICATION_KIND_CONFIG` içinde 7 duyuru anahtarı. Task 9 (C4) bunlara dokunmaz.

- [ ] **Step 1: Testi yaz**

`packages/core/src/notifications/constants.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import {
  NOTIFICATION_KIND_CONFIG,
  NOTIFICATION_KIND_FALLBACK,
  notificationKindConfig,
} from "./constants"

// Backend NotificationKind'ın duyuru değerleri (spec §8.2 — additive eklendi).
const ANNOUNCEMENT_KINDS = [
  "AnnouncementPublished",
  "AnnouncementScheduledExecuted",
  "AnnouncementSubmittedForApproval",
  "AnnouncementApproved",
  "AnnouncementRejected",
  "AnnouncementWithdrawn",
  "AnnouncementAmended",
] as const

describe("NOTIFICATION_KIND_CONFIG — duyuru türleri", () => {
  it.each(ANNOUNCEMENT_KINDS)("%s fallback'e düşmez", (kind) => {
    expect(notificationKindConfig(kind)).not.toBe(NOTIFICATION_KIND_FALLBACK)
  })

  it("duyuru türlerinin tamamı megafon ikonunu kullanır", () => {
    for (const kind of ANNOUNCEMENT_KINDS) {
      expect(NOTIFICATION_KIND_CONFIG[kind]?.icon).toBe("megaphone")
    }
  })

  it("bilinmeyen tür hâlâ fallback'e düşer", () => {
    expect(notificationKindConfig("HicBoyleBirSeyYok")).toBe(NOTIFICATION_KIND_FALLBACK)
  })
})
```

- [ ] **Step 2: Testi çalıştır, kırmızı olduğunu doğrula**

```bash
npm run test --workspace=@workspace/core -- notifications/constants
```

Beklenen: FAIL — yedi türün tamamı fallback'e düşüyor.

- [ ] **Step 3: Yedi satırı ekle**

`packages/core/src/notifications/constants.ts`, `NOTIFICATION_KIND_CONFIG` nesnesinin sonuna:

```ts
  // Duyurular (spec §8.2). Ton, kullanıcının o satırda ne yapması gerektiğini
  // söyler: onay bekleyen bir eylem çağrısıdır (warning), red bir kayıptır
  // (danger), kalanı bilgidir.
  AnnouncementPublished: { label: "Duyuru", icon: "megaphone", tone: "info" },
  AnnouncementScheduledExecuted: { label: "Duyuru", icon: "megaphone", tone: "info" },
  AnnouncementSubmittedForApproval: { label: "Onay bekliyor", icon: "megaphone", tone: "warning" },
  AnnouncementApproved: { label: "Duyuru onaylandı", icon: "megaphone", tone: "success" },
  AnnouncementRejected: { label: "Duyuru reddedildi", icon: "megaphone", tone: "danger" },
  AnnouncementWithdrawn: { label: "Duyuru geri çekildi", icon: "megaphone", tone: "warning" },
  AnnouncementAmended: { label: "Duyuru güncellendi", icon: "megaphone", tone: "info" },
```

- [ ] **Step 4: Testi çalıştır, yeşil olduğunu doğrula**

```bash
npm run test --workspace=@workspace/core -- notifications/constants
```

Beklenen: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/notifications
git commit -m "feat(notifications): duyuru bildirim turleri ikon ve etiket kazanir"
```

---

### Task 4: `requiresApproval` istemci tarafında test edilir

Backend'de `AnnouncementModerationPolicyTests` var ve docblock'u "bu tablo istemcideki saf fonksiyonun AYNI vakalarıdır" diye iddia ediyor. İstemcide o tablo **yok** — `logic.test.ts` içinde `requiresApproval` hiç geçmiyor. Spec §11'in "ikisi ayrışırsa öğretmene 'yayınlanacak' denip duyuru kuyruğa düşer" riski açık.

**Files:**
- Modify: `packages/core/src/announcements/logic.test.ts`

**Interfaces:**
- Consumes: `requiresApproval(input: { isTeacher: boolean; moderation: AnnouncementModeration; selections: AudienceSelection[] }): boolean` — `packages/core/src/announcements/logic.ts:256`.
- Produces: yok (yalnız test).

- [ ] **Step 1: Backend tablosunun aynasını yaz**

`packages/core/src/announcements/logic.test.ts` dosyasının sonuna ekleyin (`requiresApproval`'ı üstteki import bloğuna da ekleyin):

```ts
describe("requiresApproval — INV-5 (backend AnnouncementModerationPolicyTests aynası)", () => {
  // Bir seçim üretici: alan adları AudienceSelection ile aynı olmalı.
  const sel = (dimension: string, key: string, bucket: "parent" | "teacher" | "student") =>
    ({ dimension, key, bucket, label: key, sublabel: null, recipientCount: 0 }) as AudienceSelection

  // Tablo, tests/Oksis.Application.UnitTests/Modules/Announcements/
  // AnnouncementModerationPolicyTests.cs `Cases()` ile BİREBİR aynı sırada.
  // Bir satır burada değişiyorsa orada da değişmelidir.
  it.each([
    ["serbest mod, öğretmen, veliye", true, "open" as const, [sel("role", "parent", "parent")], false],
    ["eşikli mod, yönetici, veliye", false, "thresholded" as const, [sel("role", "parent", "parent")], false],
    ["eşikli mod, öğretmen, veliye", true, "thresholded" as const, [sel("role", "parent", "parent")], true],
    ["eşikli mod, öğretmen, öğrenciye", true, "thresholded" as const, [sel("section", "9-A", "student")], false],
    ["eşikli mod, öğretmen, öğretmene", true, "thresholded" as const, [sel("section", "9-A", "teacher")], false],
    [
      "eşikli mod, öğretmen, karışık seçim — tek veli kovası yeter",
      true,
      "thresholded" as const,
      [sel("section", "9-A", "student"), sel("section", "9-B", "parent")],
      true,
    ],
    ["eşikli mod, öğretmen, seçim yok", true, "thresholded" as const, [], false],
  ])("%s", (_ad, isTeacher, moderation, selections, expected) => {
    expect(requiresApproval({ isTeacher, moderation, selections })).toBe(expected)
  })

  // Backend'in Should_LookAtBucketNotDimension_When_SelectionIsAllLayer testi.
  it("kararı dimension'a değil bucket'a göre verir", () => {
    expect(
      requiresApproval({
        isTeacher: true,
        moderation: "thresholded",
        selections: [sel("all", "all", "parent")],
      }),
    ).toBe(true)
    expect(
      requiresApproval({
        isTeacher: true,
        moderation: "thresholded",
        selections: [sel("all", "all", "student")],
      }),
    ).toBe(false)
  })
})
```

> `AudienceSelection`'ın gerçek alan listesi `packages/core/src/announcements/types.ts`'tedir; `sel` yardımcısındaki alanlar oradaki zorunlu alanlarla eşleşmelidir. Fazla alan varsa ekleyin, `as AudienceSelection` cast'ini kaldırmayı deneyin — cast gerekmiyorsa kaldırın.

- [ ] **Step 2: Testi çalıştır, yeşil olduğunu doğrula**

```bash
npm run test --workspace=@workspace/core -- announcements/logic
```

Beklenen: PASS. **Kırmızı çıkarsa durun** — istemci ile backend gerçekten ayrışmış demektir; hangisinin doğru olduğuna karar verilmeden devam edilmemelidir (spec §11: backend bağlayıcı taraftır).

- [ ] **Step 3: Backend testinin docblock'unu karşılıklı hâle getir**

`tests/Oksis.Application.UnitTests/Modules/Announcements/AnnouncementModerationPolicyTests.cs` docblock'undaki cümleye dosya yolunu ekleyin:

```csharp
/// <para><b>Bu tablo istemcideki saf fonksiyonun (<c>packages/core/src/announcements/logic.ts</c>
/// → <c>requiresApproval</c>) AYNI vakalarıdır ve karşılığı
/// <c>packages/core/src/announcements/logic.test.ts</c> → "requiresApproval — INV-5"
/// bloğudur. İki tablo birlikte değişir.</para>
```

- [ ] **Step 4: Commit**

```bash
git add packages/core/src/announcements/logic.test.ts
git commit -m "test(announcements): requiresApproval istemci tablosu backend ile eslesti"
```

```bash
# oksis-api deposunda ayrı commit
git add tests/Oksis.Application.UnitTests/Modules/Announcements/AnnouncementModerationPolicyTests.cs
git commit -m "docs(announcements): moderasyon politikasi tablosunun istemci karsiligi yazildi"
```

---

### Task 5: `isAnnouncementAmendable` → `isAmendmentTextValid`

Bugün `isAnnouncementAmendable` ile özel yardımcı `isAnnouncementTextValid` yan yana duruyor ve isimler karışıyor: ilki "bu duyuru düzeltilebilir mi" gibi okunuyor, oysa yalnız **formdaki metnin** geçerliliğini söylüyor ("bu duyuru düzeltilebilir mi" sorusunun cevabı `canAmendAnnouncement`).

**Files:**
- Modify: `packages/core/src/announcements/logic.ts:279-283`
- Modify: `packages/core/src/announcements/logic.test.ts:106`
- Modify: `apps/web/features/announcements/compose.tsx:27,110`
- Modify: `apps/mobile/src/features/announcements/components/compose-screen.tsx:13,104`

**Interfaces:**
- Consumes: yok.
- Produces: `isAmendmentTextValid(input: { title: string; body: string }): boolean`. Eski ad **kalmaz** — geçiş alias'ı bırakmayın, iki isim tam da giderilmek istenen karışıklığı sürdürür.

- [ ] **Step 1: Testteki adı değiştir**

`packages/core/src/announcements/logic.test.ts:106` ve varsa aynı `describe` bloğundaki diğer kullanımlar:

```ts
expect(isAmendmentTextValid(text)).toBe(true)
```

Import satırındaki `isAnnouncementAmendable`'ı `isAmendmentTextValid` yapın.

- [ ] **Step 2: Testi çalıştır, kırmızı olduğunu doğrula**

```bash
npm run test --workspace=@workspace/core -- announcements/logic
```

Beklenen: FAIL — `isAmendmentTextValid is not exported`.

- [ ] **Step 3: Fonksiyonu yeniden adlandır**

`packages/core/src/announcements/logic.ts`:

```ts
/**
 * Düzeltme formundaki METNİN geçerliliği. Hedef kitle aranmaz: alıcı listesi
 * yayın anında sabitlenir ve düzenleme ekranında seçilemez (INV-2), yayın
 * kuralını burada aynen uygulamak "Kaydet"i kalıcı olarak kilitlerdi.
 *
 * **`canAmendAnnouncement` ile karıştırma:** o, duyurunun STATÜSÜNÜN
 * düzeltmeye izin verip vermediğini söyler. Bu, kutuya yazılanı doğrular.
 */
export function isAmendmentTextValid(input: { title: string; body: string }): boolean {
  return isAnnouncementTextValid(input)
}
```

Dosyadaki `canWithdrawAnnouncement` yorumunda (`logic.ts:400` civarı) geçen `isAnnouncementAmendable` referansını da `isAmendmentTextValid` yapın.

> Barrel dosyası (`packages/core/src/index.ts`) `export * from "./announcements/logic"` kullanıyor — ad listesi tutmaz, dolayısıyla orada değişiklik **gerekmez**.

- [ ] **Step 4: İki çağrı yerini güncelle**

`apps/web/features/announcements/compose.tsx` — import (satır 27) ve kullanım (satır 110):

```tsx
    ? isAmendmentTextValid({ title, body })
```

`apps/mobile/src/features/announcements/components/compose-screen.tsx` — import (satır 13) ve kullanım (satır 104): aynı değişiklik.

- [ ] **Step 5: Tüm doğrulamaları çalıştır**

```bash
npm run test --workspace=@workspace/core -- announcements/logic
npm run typecheck --workspace=@workspace/core
npm run typecheck --workspace=@workspace/web
npm run typecheck --workspace=@workspace/mobile
```

Beklenen: hepsi PASS. Kalan referans varsa typecheck yakalar.

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/announcements apps/web/features/announcements/compose.tsx apps/mobile/src/features/announcements/components/compose-screen.tsx
git commit -m "refactor(announcements): isAnnouncementAmendable adi isAmendmentTextValid oldu"
```

---

### Task 6: Geri çekme metni statüye göre bölünür

`WithdrawModal` "Duyuru alıcıların listesinden kaldırılacak" diyor. ME-4b'den sonra `:withdraw` **`scheduled`** durumundan da çalışıyor — o kayıtta henüz alıcı yok, cümle yanlış. `expired` kaydında da "listeden kaldırılacak" yanlış (süresi dolmuş duyuru zaten listede değil).

**Files:**
- Modify: `packages/core/src/announcements/logic.ts`
- Modify: `packages/core/src/announcements/logic.test.ts`
- Modify: `apps/web/features/announcements/modals.tsx:118-124`
- Modify: `apps/mobile/src/features/announcements/components/withdraw-sheet.tsx` (dosya adı farklıysa `WithdrawSheet` bileşenini barındıran dosya)

**Interfaces:**
- Consumes: `AnnouncementStatus` (`packages/core/src/announcements/types.ts`), `canWithdrawAnnouncement` (`logic.ts:384`).
- Produces: `withdrawNotice(status: AnnouncementStatus): string` — geri çekme onayında gösterilecek tek cümle.

- [ ] **Step 1: Testi yaz**

`packages/core/src/announcements/logic.test.ts` sonuna:

```ts
describe("withdrawNotice — ME-4b üç kol", () => {
  it("yayındaki duyuruda alıcı listesinden kaldırmayı söyler", () => {
    expect(withdrawNotice("published")).toContain("alıcıların listesinden")
  })

  it("zamanlanmış duyuruda alıcıdan SÖZ ETMEZ — henüz alıcı yoktur", () => {
    expect(withdrawNotice("scheduled")).not.toContain("alıcı")
    expect(withdrawNotice("scheduled")).toContain("yayınlanmayacak")
  })

  it("süresi dolmuş duyuruda kaldırmadan değil arşivden söz eder", () => {
    expect(withdrawNotice("expired")).not.toContain("kaldırılacak")
    expect(withdrawNotice("expired")).toContain("arşiv")
  })

  it("üç kolun tamamı silinmediğini söyler — INV-1", () => {
    for (const status of ["published", "scheduled", "expired"] as const) {
      expect(withdrawNotice(status)).toContain("silinmez")
    }
  })

  it("geri çekilemeyen statüde de bir cümle döner (boş metin çizilmez)", () => {
    expect(withdrawNotice("draft").length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Testi çalıştır, kırmızı olduğunu doğrula**

```bash
npm run test --workspace=@workspace/core -- announcements/logic
```

Beklenen: FAIL — `withdrawNotice is not exported`.

- [ ] **Step 3: Fonksiyonu yaz**

`packages/core/src/announcements/logic.ts`, `canWithdrawAnnouncement`'ın hemen altına:

```ts
/**
 * Geri çekme onayında gösterilecek cümle. ME-4b'den sonra `:withdraw` üç
 * statüden çalışır ve üçünde sonuç FARKLIDIR:
 *
 * - `published` → alıcı listesi vardır, duyuru oradan iner
 * - `scheduled` → henüz hiç alıcı YOKTUR; iş, yayının hiç olmamasıdır
 * - `expired`  → duyuru zaten listede değildir; iş, arşiv kaydının etiketidir
 *
 * Tek bir cümle üçünü birden anlatamaz: "alıcıların listesinden kaldırılacak"
 * cümlesi zamanlanmış kayıtta düpedüz yanlıştır. Üç kolun ortak paydası
 * INV-1'dir ve her kolda tekrarlanır — silinmediğini söylemek geri çekmeyi
 * onaylayan kişinin bilmesi gereken tek şeydir.
 */
export function withdrawNotice(status: AnnouncementStatus): string {
  switch (status) {
    case "published":
      return "Duyuru alıcıların listesinden kaldırılacak. Kayıt arşivde “geri çekildi” olarak saklanır ve silinmez."
    case "scheduled":
      return "Duyuru hiç yayınlanmayacak; zamanlaması iptal edilir. Kayıt arşivde “geri çekildi” olarak saklanır ve silinmez."
    case "expired":
      return "Süresi dolmuş duyurunun arşiv kaydı “geri çekildi” olarak etiketlenecek. Kayıt silinmez."
    default:
      return "Kayıt arşivde “geri çekildi” olarak saklanır ve silinmez."
  }
}
```

- [ ] **Step 4: Testi çalıştır, yeşil olduğunu doğrula**

```bash
npm run test --workspace=@workspace/core -- announcements/logic
```

Beklenen: PASS.

- [ ] **Step 5: Web modalını bağla**

`apps/web/features/announcements/modals.tsx`, `WithdrawModal` içindeki `duy-alert` bloğu (satır 118-124):

```tsx
      <div className="duy-alert" style={{ marginBottom: 14 }}>
        <DuyIcon name="archive" size={17} />
        <div>{withdrawNotice(row.status)}</div>
      </div>
```

`withdrawNotice`'ı `@workspace/core` import bloğuna ekleyin.

- [ ] **Step 6: Mobil sheet'i bağla**

`WithdrawSheet` bileşenini barındıran dosyada aynı cümleyi üreten sabit metni `withdrawNotice(row.status)` ile değiştirin. Bileşen `row` prop'unu zaten alıyor (`apps/mobile/src/app/announcements/[id]/index.tsx` `row={row}` geçiyor).

> **DÜZELTME (2026-08-05, uygulama sırasında).** Bu adım başlangıçta mobil
> `announcement-detail-screen.tsx:290-292`'deki menü dipnotunu da
> `withdrawNotice(row.status)` ile değiştirmeyi istiyordu. **Yanlıştı** ve geri
> alındı: `withdrawNotice`'ın `default` kolu `draft`, `pendingApproval` ve
> `archived` statülerinde de çizilir ve "Kayıt arşivde 'geri çekildi' olarak
> saklanır" der — taslak bir duyuru için bu yanlış bir olgudur. Görev "bazı
> statülerde yanlış olan tek cümleyi böl" diye başlayıp aynı kusur sınıfını
> yeniden üretecekti. Ayrıca `withdrawNotice` kendi docblock'unda "geri çekme
> **onayında** gösterilecek cümle" diye tanımlıdır; menü dipnotu bir onay değil.
>
> **Dipnot eski statik politika cümlesinde kalır** — her statüde doğrudur:
> `Duyuru silinemez. Yanlış yayında “Geri çek” kullanın; kayıt arşivde saklanır.`
> `withdrawNotice` yalnız iki geri çekme onayı yüzeyinde kullanılır.

- [ ] **Step 7: Typecheck + lint**

```bash
npm run typecheck --workspace=@workspace/web && npm run typecheck --workspace=@workspace/mobile
npm run lint --workspace=@workspace/web && npm run lint --workspace=@workspace/mobile
```

Beklenen: PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/core/src/announcements apps/web/features/announcements/modals.tsx apps/mobile/src/features/announcements
git commit -m "fix(announcements): geri cekme metni statuye gore dogru cumleyi soyler"
```

---

### Task 7: Push ve e-posta kanalları kilitlenir

Compose varsayılanı bugün `['inApp', 'push']` ve onay sayfası "Push" rozetiyle çıkıyor; sunucuda kayıtlı tek kanal `InAppNotificationChannel`. Karar (2026-08-05): kanallar **kaldırılmaz**, kilitli ve "yakında" rozetiyle gösterilir; gövdeye yalnız `inApp` yazılır.

**Files:**
- Modify: `packages/core/src/announcements/constants.ts:106-130`
- Modify: `packages/core/src/announcements/logic.ts`
- Modify: `packages/core/src/announcements/logic.test.ts`
- Modify: `apps/web/features/announcements/compose.tsx:90-91,403-412,681-684,728`
- Modify: `apps/mobile/src/features/announcements/components/compose-screen.tsx:89,112,255-260,263-281`
- Modify: `apps/mobile/src/features/announcements/components/publish-sheets.tsx:78-83`

**Interfaces:**
- Consumes: `DeliveryChannel` (`packages/core/src/announcements/types.ts`).
- Produces:
  - `DELIVERY_CHANNEL_CONFIG[channel].locked: boolean` (mevcut) ve **yeni** `comingSoon: boolean`
  - `DELIVERABLE_CHANNELS: DeliveryChannel[]` — bugün gerçekten teslim edilen kanallar (`["inApp"]`)

- [ ] **Step 1: Testi yaz**

`packages/core/src/announcements/logic.test.ts` sonuna:

```ts
describe("gönderim kanalları — K-2 teslim sınırı", () => {
  it("bugün yalnız inApp teslim edilir", () => {
    expect(DELIVERABLE_CHANNELS).toEqual(["inApp"])
  })

  it("teslim edilmeyen her kanal kilitli ve 'yakında'dır", () => {
    for (const channel of DELIVERY_CHANNELS) {
      const config = DELIVERY_CHANNEL_CONFIG[channel]
      const deliverable = DELIVERABLE_CHANNELS.includes(channel)
      expect(config.locked).toBe(true)
      expect(config.comingSoon).toBe(!deliverable)
    }
  })

  it("push ipucu artık sessiz saat vaat etmez", () => {
    expect(DELIVERY_CHANNEL_CONFIG.push.hint).not.toContain("Sessiz saat")
  })
})
```

- [ ] **Step 2: Testi çalıştır, kırmızı olduğunu doğrula**

```bash
npm run test --workspace=@workspace/core -- announcements/logic
```

Beklenen: FAIL — `DELIVERABLE_CHANNELS is not exported`.

- [ ] **Step 3: Sabitleri güncelle**

`packages/core/src/announcements/constants.ts`:

```ts
export const DELIVERY_CHANNEL_CONFIG: Record<
  DeliveryChannel,
  { label: string; hint: string; icon: string; locked: boolean; comingSoon: boolean }
> = {
  inApp: {
    label: "Uygulama içi",
    hint: "Duyuru her zaman uygulama içinde görünür — kapatılamaz.",
    icon: "mega",
    locked: true,
    comingSoon: false,
  },
  // K-2: push/e-posta teslim zinciri (D fazı) YAZILMADI. Sunucuda kayıtlı tek
  // INotificationChannel InApp'tir. Seçenek ekranda KALIR ama kilitlidir:
  // kaldırmak, planlandığı bilgisini de siler; açık bırakmak yayınlayana
  // gerçekleşmeyecek bir teslim vaat ederdi. D geldiğinde locked=false yeter.
  push: {
    label: "Push bildirim",
    hint: "Telefon ekranında anında görünür. Bu sürümde gönderilmiyor.",
    icon: "phone",
    locked: true,
    comingSoon: true,
  },
  email: {
    label: "E-posta",
    hint: "E-posta adresi kayıtlı alıcılara gönderilir. Bu sürümde gönderilmiyor.",
    icon: "mail",
    locked: true,
    comingSoon: true,
  },
}

export const DELIVERY_CHANNELS: DeliveryChannel[] = ["inApp", "push", "email"]

/**
 * Bugün GERÇEKTEN teslim edilen kanallar. `DELIVERY_CHANNELS` ekranın
 * gösterdiği listedir; bu, gövdeye yazılabilecek olandır. Compose formu
 * kanal durumunu buradan başlatır ve buradan gönderir.
 */
export const DELIVERABLE_CHANNELS: DeliveryChannel[] = ["inApp"]
```

- [ ] **Step 4: Testi çalıştır, yeşil olduğunu doğrula**

```bash
npm run test --workspace=@workspace/core -- announcements/logic
```

Beklenen: PASS. (`DELIVERABLE_CHANNELS`'ı `logic.test.ts`'in import bloğuna eklemeyi unutmayın; `constants.ts` barrel'dan dışa açılıyorsa oradan da export edin.)

- [ ] **Step 5: Web compose'u bağla**

`apps/web/features/announcements/compose.tsx`:

Satır 90-91 — varsayılan:

```tsx
  const [channels, setChannels] = useState<DeliveryChannel[]>(
    seed?.channels ?? DELIVERABLE_CHANNELS,
  )
```

Satır 403-412 — öğretmen dalındaki metin:

```tsx
              <div className="duy-alert in">
                <DuyIcon name="info" size={17} />
                <div>
                  Sınıf duyuruları <b>uygulama içinde</b> iletilir. Push ve e-posta gönderimi bu
                  sürümde kullanılamıyor.
                </div>
              </div>
```

Kanal satırlarında "yakında" rozeti — `config.locked && <DuyIcon name="lock" … />` ifadesinin yanına:

```tsx
                          {config.comingSoon && <span className="duy-soon">yakında</span>}
```

> `duy-soon` sınıfı yoksa, aynı dosyada kullanılan mevcut küçük etiket sınıfını (`opt`) kullanın; yeni CSS yazmayın.

Satır 681-684 — önizleme notu:

```tsx
            <p className="duy-prevnote">
              Duyuru alıcının uygulama içi duyuru listesinde böyle görünür. Bu sürümde telefon
              ekranına bildirim düşmez.
            </p>
```

Satır 728 — onay modalına giden kanallar:

```tsx
          channels={channels}
```

> `isTeacher ? ["inApp","push"] : channels` koşulu kalkıyor: öğretmen de artık yalnız teslim edilen kanalı görüyor.

- [ ] **Step 6: Mobil compose ve onay sayfasını bağla**

`compose-screen.tsx` satır 89:

```tsx
  const [channels, setChannels] = useState<DeliveryChannel[]>(seed?.channels ?? DELIVERABLE_CHANNELS);
```

Satır 112:

```tsx
      channels,
```

Satır 255-260 — öğretmen notu:

```tsx
            <Note icon="info">
              Sınıf duyuruları uygulama içinde iletilir. Push ve e-posta gönderimi bu sürümde
              kullanılamıyor.
            </Note>
```

Satır 263-281 — `ToggleRow` çağrısı: `on` değeri artık teslim edilebilirlikten okunur ve kilitli satır dokunmayı yok sayar:

```tsx
                const deliverable = DELIVERABLE_CHANNELS.includes(channel);
                return (
                  <ToggleRow
                    key={channel}
                    title={config.comingSoon ? `${config.label} (yakında)` : config.label}
                    description={config.hint}
                    on={deliverable}
                    locked
                    brandColor={brandColor}
                    onToggle={() => {}}
                  />
                );
```

`publish-sheets.tsx` satır 78-83 — rozetler yalnız teslim edilen kanalı gösterir:

```tsx
      <Text style={{ fontFamily: FONTS.bold, fontSize: TYPE.caption, color: COLORS.ink, marginBottom: 8 }}>Kanallar</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 14 }}>
        {channels
          .filter((channel) => DELIVERABLE_CHANNELS.includes(channel))
          .map((channel) => {
            const config = DELIVERY_CHANNEL_CONFIG[channel];
            return <Badge key={channel} label={config.label} icon={config.icon as IconName} tone="brand" />;
          })}
      </View>
```

- [ ] **Step 7: Typecheck + lint**

```bash
npm run typecheck --workspace=@workspace/core
npm run typecheck --workspace=@workspace/web && npm run typecheck --workspace=@workspace/mobile
npm run lint --workspace=@workspace/web && npm run lint --workspace=@workspace/mobile
```

Beklenen: PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/core/src/announcements apps/web/features/announcements/compose.tsx apps/mobile/src/features/announcements/components
git commit -m "fix(announcements): teslim edilmeyen kanallar kilitlendi ve yakinda olarak isaretlendi"
```

---

### Task 8: Sessiz saat iddiaları kaldırılır

Spec §8.3: `NotificationPriority` enum'u yoktur, `INotificationEnqueuer.Enqueue` öncelik parametresi almaz, `InAppNotificationChannel` sessiz saate **hiç bakmaz**. Yani acil işaretinin "deleceği" bir kısıt kurulmamıştır. Beş yerde bunun tersi yazıyor.

**Files:**
- Modify: `packages/core/src/announcements/types.ts:135`
- Modify: `apps/web/features/announcements/compose.tsx:543,552`
- Modify: `apps/web/features/announcements/modals.tsx:234`
- Modify: `apps/mobile/src/features/announcements/components/compose-screen.tsx:295`
- Modify: `apps/mobile/src/features/announcements/components/publish-sheets.tsx:88`

**Interfaces:**
- Consumes: yok.
- Produces: yok (yalnız metin ve yorum).

Acil işaretinin bugünkü **gerçek** üç etkisi: listede **ACİL rozetiyle görsel olarak ayrışır**, denetim izine ayrıca yazılır, bildirim başlığına "Acil duyuru: " ön eki gelir. Yeni metinler yalnız bunları söyler.

> **DÜZELTME (2026-08-05, uygulama sırasında).** Bu bölümün ilk sürümü spec §8.3'ten
> devraldığı hatayla "listede **en üste sabitlenir**" diyordu. **Yanlıştı** ve
> düzeltildi: sıralama `urgent`'a hiç bakmaz, yalnız `pinned`'e bakar
> (`packages/core/src/announcements/logic.ts:161-167`,
> `GetAnnouncementsQueryHandler.cs:122-124`). Bu adım bir asılsız vaadi kaldırmak
> için var; onun yerine başka bir asılsız vaat koymak görevin kendisini boşa
> çıkarırdı. Gerçek görsel etki ACİL rozetidir (`parts.tsx`), sabitleme değil —
> sabitleme ayrı bir alandır (`pinned`) ve compose'da kendi anahtarı vardır.
> Spec §8.3 tablosu aynı gün düzeltildi.

- [ ] **Step 1: Core tip yorumunu düzelt**

`packages/core/src/announcements/types.ts:135`:

```ts
  /** Acil işareti — listede en üste sabitlenir, denetim izine yazılır, bildirim başlığına "Acil duyuru:" ön eki gelir. */
```

- [ ] **Step 2: Web compose metinlerini düzelt**

`apps/web/features/announcements/compose.tsx:543`:

```tsx
                      Listede en üste sabitlenir ve işlem denetim izine kaydedilir.
```

Satır 552:

```tsx
                      Acil duyuru alıcı listesinin en üstüne sabitlenir ve bildirim başlığına
                      “Acil duyuru:” ön eki gelir. Bu
```

> Cümlenin devamı mevcut metinde nasıl bitiyorsa aynen korunmalı; yalnız "sessiz saat kısıtını deler ve gece dahil bildirim gönderir" kısmı değişiyor.

- [ ] **Step 3: Web onay modalını düzelt**

`apps/web/features/announcements/modals.tsx:234`:

```tsx
            <b>ACİL</b> — duyuru listenin en üstüne sabitlenecek ve bildirim başlığında “Acil
            duyuru:” ön ekiyle görünecek. İşlem
```

- [ ] **Step 4: Mobil metinlerini düzelt**

`compose-screen.tsx:295`:

```tsx
              description="Listede en üste sabitlenir; işlem denetim izine kaydedilir."
```

`publish-sheets.tsx:88`:

```tsx
            ACİL — duyuru listenin en üstüne sabitlenecek ve bildirim başlığında “Acil duyuru:” ön ekiyle görünecek. İşlem denetim izine kaydedilir.
```

- [ ] **Step 5: Kalan iddia olmadığını doğrula**

```bash
cd /Users/farukkaya/Repositories/oksis-ui
grep -rn "essiz saat" packages/core/src/announcements apps/web/features/announcements apps/mobile/src/features/announcements
```

Beklenen: **hiç eşleşme yok**. (`packages/core/src/notifications` ve Ayarlar ekranlarındaki "Sessiz saatler" ayarı bu görevin kapsamı dışıdır — orası gerçek bir yapılandırma alanıdır, duyuru vaadi değil.)

- [ ] **Step 6: Typecheck + lint + commit**

```bash
npm run typecheck --workspace=@workspace/core && npm run typecheck --workspace=@workspace/web && npm run typecheck --workspace=@workspace/mobile
git add packages/core/src/announcements/types.ts apps/web/features/announcements apps/mobile/src/features/announcements
git commit -m "fix(announcements): acil isareti kurulmamis sessiz saat kisitini vaat etmiyor"
```

---

### Task 9: Tek kanallı raporda kanal tablosu gizlenir

Spec §10: rapor yalnız inApp + görülme ile çıkar, kanal kırılımı tablosu gizlenir. Backend `DeliveryReportDto.channels` zaten **tek satır** döndürüyor (`GetAnnouncementDeliveryReportQueryHandler:142-150`); iş tamamen istemcide.

**Files:**
- Modify: `packages/core/src/announcements/logic.ts`
- Modify: `packages/core/src/announcements/logic.test.ts`
- Modify: `apps/web/features/announcements/detail.tsx:126-170`
- Modify: `apps/mobile/src/features/announcements/components/announcement-detail-screen.tsx:190-215`

**Interfaces:**
- Consumes: `DeliveryReport` (`packages/core/src/announcements/types.ts`), `DeliveryChannelStat`.
- Produces: `showsChannelBreakdown(report: DeliveryReport): boolean` — tablo çizilsin mi.

- [ ] **Step 1: Testi yaz**

`packages/core/src/announcements/logic.test.ts` sonuna:

```ts
describe("showsChannelBreakdown — spec §10", () => {
  const report = (channels: DeliveryChannelStat[]): DeliveryReport => ({
    total: 100,
    reached: 90,
    seen: 40,
    channels,
    unreachable: [],
  })

  it("tek kanal dönerken tablo çizilmez", () => {
    expect(showsChannelBreakdown(report([{ channel: "inApp", sent: 90, of: 100 }]))).toBe(false)
  })

  it("hiç kanal dönmezse tablo çizilmez", () => {
    expect(showsChannelBreakdown(report([]))).toBe(false)
  })

  it("iki veya daha çok kanal dönerse tablo çizilir", () => {
    expect(
      showsChannelBreakdown(
        report([
          { channel: "inApp", sent: 90, of: 100 },
          { channel: "push", sent: 70, of: 100 },
        ]),
      ),
    ).toBe(true)
  })
})
```

- [ ] **Step 2: Testi çalıştır, kırmızı olduğunu doğrula**

```bash
npm run test --workspace=@workspace/core -- announcements/logic
```

Beklenen: FAIL — `showsChannelBreakdown is not exported`.

- [ ] **Step 3: Fonksiyonu yaz**

`packages/core/src/announcements/logic.ts`:

```ts
/**
 * Kanal kırılımı tablosu çizilsin mi (spec §10, teknik analiz §3.6 seçenek A).
 *
 * Tek satırlık bir "tablo" bilgi taşımaz, yanılsama taşır: yöneticiye kanal
 * SEÇİMİNİN kanal TESLİMİ olduğunu ima eder. Bugün sunucuda kayıtlı tek kanal
 * InApp olduğu için rapor her zaman tek satır döner ve tablo hiç çizilmez;
 * koşul yine de sayıya bakar, "InApp mı" diye sormaz — D fazı ikinci kanalı
 * açtığında tablo kendiliğinden geri gelir.
 */
export function showsChannelBreakdown(report: DeliveryReport): boolean {
  return report.channels.length > 1
}
```

- [ ] **Step 4: Testi çalıştır, yeşil olduğunu doğrula**

```bash
npm run test --workspace=@workspace/core -- announcements/logic
```

Beklenen: PASS.

- [ ] **Step 5: Web detayını bağla**

`apps/web/features/announcements/detail.tsx`, "Kanal bazlı gönderim" kartının gövdesi. `reportLoading ? … : report ? <table>… : <DuyEmpty …>` üçlüsü **dörtlü** olur:

```tsx
            {reportLoading ? (
              <div className="duy-sk" style={{ height: 96, marginTop: 10 }} />
            ) : !report ? (
              <DuyEmpty
                icon="send"
                title="Gönderim raporu yok"
                desc="Duyuru henüz yayınlanmadığı için kanal bazlı rapor oluşmadı."
              />
            ) : showsChannelBreakdown(report) ? (
              <table className="attm-tbl" style={{ marginTop: 4 }}>
                {/* mevcut thead/tbody bloğu AYNEN korunur */}
              </table>
            ) : (
              <div className="duy-alert in" style={{ marginTop: 4 }}>
                <DuyIcon name="info" size={17} />
                <div>
                  Bu sürümde duyuru yalnız <b>uygulama içinde</b> iletilir; kanal kırılımı yoktur.
                  Yukarıdaki “Ulaştı” ve “Görüldü” sayıları raporun tamamıdır.
                </div>
              </div>
            )}
```

Kart başlığını da gerçeğe uydurun (satır 128-131):

```tsx
            <h3>
              <DuyIcon name="send" size={17} />
              {report && showsChannelBreakdown(report) ? "Kanal bazlı gönderim" : "Gönderim"}
            </h3>
```

- [ ] **Step 6: Mobil detayını bağla**

`announcement-detail-screen.tsx:190-215` — `report.channels.map(...)` bloğunu aynı koşulla sarın:

```tsx
              {showsChannelBreakdown(report) ? (
                report.channels.map((stat) => {
                  /* mevcut satır çizimi AYNEN korunur */
                })
              ) : (
                <Note icon="info">
                  Bu sürümde duyuru yalnız uygulama içinde iletilir; kanal kırılımı yoktur.
                </Note>
              )}
```

- [ ] **Step 7: Typecheck + lint**

```bash
npm run typecheck --workspace=@workspace/core
npm run typecheck --workspace=@workspace/web && npm run typecheck --workspace=@workspace/mobile
npm run lint --workspace=@workspace/web && npm run lint --workspace=@workspace/mobile
```

Beklenen: PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/core/src/announcements apps/web/features/announcements/detail.tsx apps/mobile/src/features/announcements/components/announcement-detail-screen.tsx
git commit -m "feat(announcements): tek kanalli raporda kanal tablosu gizlenir"
```

---

## Kapanış doğrulaması

Tüm görevler bittikten sonra:

```bash
# oksis-api
cd /Users/farukkaya/Repositories/oksis-api
dotnet format && dotnet build && dotnet test --filter "FullyQualifiedName~Announcement"

# oksis-ui
cd /Users/farukkaya/Repositories/oksis-ui
npm run test --workspace=@workspace/core
npm run typecheck && npm run lint
```

Hepsi yeşilse C1 tamamdır. `oksis/docs/superpowers/specs/2026-08-02-duyurular-uctan-uca-design.md` §14 tablosundaki "Gönderim raporunda kanal tablosunun gizlenmesi" satırı **Yapıldı** olarak işaretlenir; §8.3 tablosuna "acil metinleri C1'de düzeltildi" notu düşülür.
