# Duyurular C5 — Şablon Yönetimi Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Duyuru şablonunu salt-okunur bir listeden **kişisel bir deftere** çevirmek — herkes yalnız kendi şablonunu görür, oluşturur, düzenler ve siler; şablondan duyuru üretmek gerçekten metni taşır ve kullanım sayacı çalışır; öğretmen web'de kendi duyurusunun detayına ve işlem menüsüne kavuşur.

**Architecture:** Sahiplik kararı **backend'de** verilir (`AnnouncementTemplate.CreatedBy` — `AuditingInterceptor`'ın yazdığı hesap kimliği); istemci hiçbir yerde "bu benim mi" diye sormaz, uç zaten yalnız sahibin kayıtlarını döndürür ve yabancı kimliğe **404** verir (403 değil — varlığı sızdırmamak için, `DeleteAnnouncementTemplateCommandHandler`'daki tenant emsalinin aynısı). Karar veren her istemci kuralı (menü kapıları, statü notları, ad çakışması, arama görünürlüğü, red gerekçesinin denetim izinden okunması) `packages/core`'da saf fonksiyon olarak yaşar ve orada testlidir; web ve mobil yalnız çizer.

**Tech Stack:** .NET 10 / EF Core 10 / MSSQL · MediatR + FluentValidation (backend) · TypeScript + vitest (`packages/core`) · TanStack Query v5 (`packages/api`) · MSW (`packages/api-mocks`) · Next.js 16 App Router (`apps/web`) · Expo Router + React Native (`apps/mobile`)

---

## Global Constraints

- Kullanıcıya dönük her metin **Türkçe**dir; kurum dili resmi ama sade, emir kipi.
- Commit formatı: `<type>(<scope>): türkçe açıklama` — scope modül adı veya `repo`, **sonda nokta yok**.
- **`apps/web` ve `apps/mobile`'da test koşucusu YOKTUR.** Karar veren her kural `packages/core` ya da `packages/api`'ye taşınır ve orada test edilir. Uygulamalarda yalnız `typecheck` + `lint` vardır.
- **`apps/mobile`'a prettier ÇALIŞTIRILMAZ.** Depo kodu ~100 sütunda; komşu biçime uy.
- Backend komutları PATH dışıdır:
  ```bash
  export DOTNET_ROOT=$HOME/.dotnet; export PATH=$DOTNET_ROOT:$DOTNET_ROOT/tools:$PATH
  ```
- Sıra **bağlayıcıdır**: Görev 1–6 backend → Görev 7 TEK codegen turu → Görev 8–17 istemci. Codegen turundan önce hiçbir istemci görevine başlanmaz.
- Test tabanı (2026-08-09'da ölçüldü, `dotnet test`): **3345 test, 0 hata** — Api.UnitTests 247 · Domain.UnitTests 683 · Application.UnitTests 1539 · Oksis.Tests 40 · Infrastructure.IntegrationTests 836. Her backend görevi bu sayıyı **artırmalı**, azaltmamalı.
- İstemci tabanı (2026-08-09): core **235** · api **125** · api-mocks **93**; 6 workspace typecheck ve lint temiz.
- **Docblock'lara satır numarası YAZILMAZ** — sembol/fonksiyon/dosya adı yazılır. Ölçüm günlüğü ayrı ve tarihli blokta durur.
- **Yazılan her nedensellik iddiası ÖLÇÜLÜR** ve nasıl ölçüldüğü yanına yazılır. Kanonik kural: `oksis/.claude/docs/code-review-checklist.md` §16.

---

## Kullanıcı kararları (bağlayıcı)

| Kod | Karar |
|---|---|
| **K1** | Şablonlar **kişiseldir**. Yönetici de öğretmen de yalnız kendi şablonunu görür ve yönetir. Ortak/okul şablonu kavramı yoktur. |
| **K2** | Duyuru görünürlüğü şablondan farklıdır: yönetici tüm duyuruları görür ve işlem yapar, öğretmen yalnız kendininkini; şablonda ikisi de yalnız kendininkini. |
| **K3** | Şablon **güncelleme** yalnız Şablonlar sekmesinde/ekranındadır. "Şablon olarak kaydet" **her zaman YENİ** şablon üretir.<br>⚠️ **Ölçüm düzeltmesi (2026-08-10, Görev 10):** tasarımın çakışma uyarısındaki *"ikinci bir kayıt oluşturur"* cümlesi **yanlıştır**. Benzersiz indeks `(SchoolId, CreatedBy, Name)` sahibe indiği için aynı adla ikinci şablon **oluşmaz** — uç `Announcements.Template.NameDuplicate` (409) döner. Doğru metin: *"Bu adla kaydedemezsiniz — farklı bir ad verin ya da o şablonu Şablonlar sekmesinden düzenleyin."* |
| **K4** | Kullanım sayacı çalıştırılacak. |
| **K5** | *(2026-08-09, bu planın ölçümü üzerine)* Ad benzersizliği ve metin sınırı **tek migration ile** düzeltilir: benzersiz indeks `(SchoolId, CreatedBy, Name)`, `Description` 500 → 4000. |
| **K6** | *(2026-08-09)* Kullanım sayacı **yalnız duyuru gerçekten yayına çıkınca** artar — taslak, zamanlanmış ve onay bekleyen artırmaz. Bu, sayacın **üç** yayın noktasına da bağlanmasını gerektirir. |

---

## ÖLÇÜM GÜNLÜĞÜ — 2026-08-09

Bu planın dayandığı her gerçek burada ve **bu tarihte** ölçüldü. Uygulayıcı bir iddiayı değiştirecekse önce yeniden ölçmelidir.

**Backend**

| İddia | Nasıl ölçüldü | Sonuç |
|---|---|---|
| Şablon listesi sahibe göre süzülmüyor | `GetAnnouncementTemplatesQueryHandler` okundu | `Where(t => t.SchoolId == schoolId)` — sahiplik yok ✅ |
| Update/Delete'te sahiplik kontrolü yok | İki handler okundu | İkisi de yalnız `Id + SchoolId` ile arıyor ✅ |
| `CreatedBy` var ve dolu | `PermanentTenantEntity` + `AuditingInterceptor` okundu | `CreatedBy` `Guid`; interceptor `Added` durumunda `currentUser.Id` yazıyor ✅ |
| `CreatedBy` = **hesap** kimliği, Person değil | `CurrentUser.Id` → `ClaimTypes.NameIdentifier`/`sub` | Sahiplik `ICurrentUser.Id` ile karşılaştırılır, `Person.Id` ile DEĞİL ✅ |
| Şablon seed'lenmiyor | `grep -rn "AnnouncementTemplate" src/Oksis.Infrastructure/Persistence/Seed/` | 0 eşleşme — sahipsiz kayıt riski yok ✅ |
| `RegisterUse` çağrısız | `grep -rn "RegisterUse" --include="*.cs" src tests` | 9 satır: 1 tanım (`src`), 8 test. **Üretimde sıfır çağıran** ✅ |
| Ad benzersizliği okul geneli | `AnnouncementTemplateConfiguration` | `HasIndex(x => new { x.SchoolId, x.Name }).IsUnique()` ⚠️ K1 ile çelişir |
| `Description` 500, duyuru `Body` sınırsız | İki configuration okundu | `Description` `HasMaxLength(500)`; `Announcement.Body` `IsRequired()` — **`HasMaxLength` YOK** ⚠️ |
| Öğretmende `template.manage` yok | `RolePermissionSeedData` Teacher listesi | view/create/update/withdraw/report.view var; `template.manage` **yok** ✅ |
| `template.manage` bugün YALNIZ SCHOOL_ADMIN'de | `RolePermissionSeedData` + `MasterRoleSeedTests` `schoolAdminOnlyCodes` | Müdür yardımcısı (VICE_PRINCIPAL) **MVP sonrasına ertelenmiş**, eşleşmesi yok — brief'teki "yönetici + müdür yardımcısı" bugünkü koda göre **yanlış** ⚠️ |
| Rol izinleri `HasData` ile seed'leniyor | `RolePermissionConfiguration` | `builder.HasData(RolePermissionSeedData.Rows())` → **izin eklemek migration gerektirir** ⚠️ |
| `Announcement.Publish()` üç yerden çağrılıyor | `grep -rn "\.Publish(" --include="*.cs" src` | `CreateAnnouncementCommandHandler` · `PublishScheduledAnnouncementsJob` · `Announcement.Approve()` (→ `ApproveAnnouncementCommandHandler`) ✅ |
| Red gerekçesi DTO'da YOK | `AnnouncementDto` grep `Reject` → 0; `Announcement.Reject()` docblock'u | "Gerekçe entity'ye YAZILMAZ… kalıcı yeri denetim izi" ⚠️ |
| Red gerekçesi denetim izinde ve **testle sabitli** | `RejectAnnouncementCommandHandler` + `AnnouncementApprovalTests` | `action == "duyuruyu reddetti"` ve `Tag == "Gerekçe: …"` iki testte sabitlenmiş ✅ |

**İstemci**

| İddia | Nasıl ölçüldü | Sonuç |
|---|---|---|
| Şablon CRUD hook'ları yazılmış ama **ölü** | `grep -rn "useCreateAnnouncementTemplate\|useUpdate…\|useDelete…" apps/ packages/` | Yalnız 3 tanım satırı; **sıfır çağıran** ✅ |
| MSW şablon CRUD'u tam | `announcement-handlers.ts` | GET/POST/PUT/DELETE dördü de var; **sahiplik kavramı yok** ⚠️ |
| Web şablon sekmesi salt okunur | `templates-tab.tsx` (74 satır) | Yalnız "Bu şablonla oluştur"; düzenle/sil/yeni/arama yok ✅ |
| W-11 hatası | `announcements-page.tsx` `onUse` | `setSeed({ title: template.name, urgent: template.urgent })` — `body` **hiç taşınmıyor**, `compose.tsx` `seed?.body ?? ""` okuyor ✅ |
| Öğretmen web sayfası sekmesiz/detaysız | `teacher-announcements-page.tsx` (224 satır) | Sekme yok, satır tıklanamaz, işlem menüsü yok, şablon yok ✅ |
| Mobil şablon ekranı salt okunur | `templates-screen.tsx` | Yalnız `onUse` ✅ |
| Mobil "bu şablonla oluştur" **iki** yerde tasarımdan sapıyor | `app/announcements/templates.tsx` | `params: { title: template.name, body: template.description }` — tasarım `{ body, urgent }` diyor, **başlığı hiç tohumlamıyor** ve **`urgent` taşınmıyor** ⚠️ |
| Öğretmen mobil ekranında şablon girişi yok | `teacher-announcements-screen.tsx` | `onTemplates` prop'u yok; `onTemplates` yalnız `(tabs)/announcements.tsx`'te (yönetici) ✅ |
| Mobil `readOnly` kapısının çağıranı yok | `announcement-detail-screen.tsx` docblock'u (2026-08-08 ölçümü) | Doğrulandı; tasarım da öğretmenin menüyü görmesini istiyor — kapı canlandırılmayacak ✅ |
| Mobil işlem sayfasında "Geri çekmeyi iptal et" **zaten var** | `announcement-detail-screen.tsx` `canRestoreAnnouncement` kolu | M-5 bir **doğrulama** maddesidir, yeni iş değil ✅ |
| Eksik CSS sınıfları | `grep` `packages/ui/src/styles/announcements.css` | `.duy-tpls/.duy-tpl/.th/.ti/.tn/.tx/.tm/.ta` **var**; `.tfull`, `.duy-tplcount`, `.duy-tplread`, `.duy-tpl-usage`, `.duy-carry`, `.duy-hint` **yok** ⚠️ |
| İkon düğmesi sınıfı | aynı dosya | Depo `.att-btn.icon` kullanıyor; tasarım `ico` yazıyor — **depo kazanır** ✅ |

**Tasarımdan gelen düzeltmeler (brief'in görev listesiyle çelişen ölçümler)**

1. **W-9 yanlış konumlanmış.** Brief "compose altlığında" diyor. Tasarım (`web/duyurular_compose.jsx`) "Şablon olarak kaydet"i sol kolonda **bir kart** olarak çiziyor (anahtar + ad alanı + çakışma uyarısı); alt aksiyon barı **Taslak kaydet · Önizle · Yayınla** olarak kalıyor. Kayıt, **Yayınla onayı verildiğinde** `onSaveTemplate` ile birlikte yapılıyor. Mobil tasarımda da aynı: form gövdesinde bir kart (`sheet === 'tpl'`), yalnız **yeni duyuruda** ve `body.trim().length < 6` iken kapalı.
2. **Mobil "bu şablonla oluştur" başlığı tohumlamaz.** `proto-app.jsx :: protoScreens()` → `window.__dySeed = { body: t.body, urgent: t.urgent }`. Şablon **adı** duyurunun başlığı değildir (form ekranı bunu açıkça yazıyor: *"Ad yalnız sana görünür; duyurunun başlığı değildir"*). Web tasarımı da aynı: `{ title: "", body: tp.body, urgent: tp.urgent }`.
3. **Öğretmen mobil boş durumunda şablon girişi kayboluyor.** Tasarımın `state === 'empty'` kolu doğrudan `DYState` çiziyor; başlık satırı ve şablon ikonu **çizilmiyor**. Bu, hiç duyurusu olmayan öğretmen için şablon listesine tek girişi kapatır. **Bu planda başlık satırı boş durumda da çizilir** (Görev 15) ve gerekçesi koda yazılır — tasarımdan bilinçli, ölçülmüş ve dar bir sapmadır.
4. **Öğretmen web detayındaki "red gerekçesi" bloğunun arkasında alan YOK.** Tasarım `r.rejectedBy · r.rejectedAt` + `r.reason` yazıyor; bu üçü prototip mock'unda var, **telde yok**. Gerekçe yalnız denetim izinde (`tag: "Gerekçe: …"`). Bu planda blok **denetim izinden** üretilir (Görev 8'de core fonksiyonu, Görev 13'te çizim).
5. **Şablon alan adları**: tasarım mock'u `body`/`useCount`/`uses`/`last` kullanıyor; **tel** `description`/`usageCount`/`lastUsedAt`. Tel kazanır (R11 zaten bunu şart koşuyor); tasarımın alan adları port edilmez.
6. **B-6 DÜŞTÜ — `withdrawnBy` DTO'ya eklenmeyecek.** Tasarım geri almada **(a)** yolunu seçti: eylem gösterilir, uç reddederse açıklanır. Gerekçe iki yüzeyde de yazılı (`mobile/README.md`, `web/README.md`): "kim geri çekti" bilgisi telde yoktur ve izin ancak sunucuda anlaşılır; eylemi herkesten gizlemek, sık karşılaşılan doğru durumu (öğretmen kendi geri çekmesini iptal eder) seyrek bir hata durumu yüzünden cezalandırmak olurdu. Bu planda `Announcement.WithdrawnBy` **tele çıkmaz** ve ret mesajı zaten C4'te bağlanmış olan `restoreOutcomeMessage`/`mutationErrorDesc` yolundan gelir.

---

## File Structure

### Backend (`oksis-api`)

| Dosya | Sorumluluk |
|---|---|
| `src/Oksis.Infrastructure/Persistence/Configurations/Announcements/AnnouncementTemplateConfiguration.cs` | Sahibe göre benzersiz ad, `Description` 4000 |
| `src/Oksis.Infrastructure/Persistence/Configurations/Announcements/AnnouncementConfiguration.cs` | `TemplateId` kolonu (FK **yok**) |
| `src/Oksis.Domain/Modules/Announcements/Entities/Announcement.cs` | `TemplateId` + `MarkCreatedFromTemplate` |
| `src/Oksis.Application/.../Queries/GetAnnouncementTemplates/GetAnnouncementTemplatesQueryHandler.cs` | Sahibe göre süzme |
| `src/Oksis.Application/.../Commands/CreateAnnouncementTemplate/*` | Ad çakışması sahibe iner; docblock düzeltmesi |
| `src/Oksis.Application/.../Commands/UpdateAnnouncementTemplate/*` | Sahiplik kapısı |
| `src/Oksis.Application/.../Commands/DeleteAnnouncementTemplate/*` | Sahiplik kapısı |
| `src/Oksis.Application/.../Commands/CreateAnnouncement/*` | `TemplateId` alanı + bağ + yayında `RegisterUse` |
| `src/Oksis.Application/.../Commands/ApproveAnnouncement/ApproveAnnouncementCommandHandler.cs` | Yayında `RegisterUse` |
| `src/Oksis.Infrastructure/BackgroundJobs/Jobs/PublishScheduledAnnouncementsJob.cs` | Yayında `RegisterUse` |
| `src/Oksis.Infrastructure/Persistence/Seed/MasterData/RolePermissionSeedData.cs` | Öğretmene `template.manage` |
| `src/Oksis.Infrastructure/Persistence/Migrations/2026*_20260809_announcement_templates_personal.cs` | Tek migration: indeks + uzunluk + `TemplateId` + izin satırı |

### İstemci (`oksis-ui`)

| Dosya | Sorumluluk |
|---|---|
| `packages/core/src/announcements/constants.ts` | `TEMPLATE_NAME_MAX`, `TEMPLATE_BODY_MAX`, `TEMPLATE_SEARCH_THRESHOLD` |
| `packages/core/src/announcements/logic.ts` | Şablon kuralları + satır menüsü kapıları + statü notu + red gerekçesi çözümü |
| `packages/core/src/announcements/schemas.ts` | `announcementTemplateSchema`, `announcementFormSchema`'ya `templateId` |
| `packages/api/src/announcements/endpoints.ts` | `createAnnouncement` gövdesine `templateId` |
| `packages/api-mocks/src/announcements/announcement-data.ts` | Şablonlara sahip etiketi |
| `packages/api-mocks/src/announcements/announcement-handlers.ts` | Sahibe göre süzme + `templateId` sayacı |
| `packages/ui/src/styles/announcements.css` | Eksik altı sınıf |
| `apps/web/features/announcements/templates-tab.tsx` | Yönetici + öğretmen ortak şablon sekmesi (CRUD) |
| `apps/web/features/announcements/modals.tsx` | Dört şablon modalı |
| `apps/web/features/announcements/compose.tsx` | "Şablon olarak kaydet" kartı |
| `apps/web/features/announcements/inventory-tab.tsx` | Satır menüsüne "Şablon olarak kaydet" |
| `apps/web/features/announcements/announcements-page.tsx` | Yönetici tarafının kablolaması + W-11 |
| `apps/web/features/announcements/teacher-announcements-page.tsx` | Sekmeler, detay, satır menüsü |
| `apps/web/features/announcements/teacher-detail.tsx` (**yeni**) | Öğretmen detay başlığı ve red bloğu |
| `apps/mobile/src/features/announcements/components/templates-screen.tsx` | Şablon listesi + eylemler |
| `apps/mobile/src/features/announcements/components/template-form-screen.tsx` (**yeni**) | Şablon formu — **alt ekran** |
| `apps/mobile/src/features/announcements/components/template-sheets.tsx` (**yeni**) | Silme onayı + "şablon olarak kaydet" sheet'i |
| `apps/mobile/src/app/announcements/templates.tsx` · `templates/new.tsx` · `templates/[id].tsx` (**yeni**) | Rotalar |
| `apps/mobile/src/features/announcements/components/teacher-announcements-screen.tsx` | Başlıkta şablon ikonu |
| `apps/mobile/src/features/announcements/components/compose-screen.tsx` | "Şablon olarak kaydet" kartı + sheet |
| `apps/mobile/src/features/announcements/components/announcement-detail-screen.tsx` | İşlem sayfasına şablon + statü notu |

---

# BÖLÜM 1 — BACKEND (Görev 1–6)

---

### Task 1: Şablon şeması kişiselleşir — sahibe göre benzersiz ad, 4000 karakter metin

Bugün ad benzersizliği **okul geneli**dir. Şablonlar kişiselleşince öğretmen B, öğretmen A'nın hiç **göremediği** bir şablonun adı yüzünden `Announcements.Template.NameDuplicate` alır — hem kullanılamaz bir hata, hem başka birinin kaydının varlığını sızdıran bir yan kanal. Ayrıca `Description` `nvarchar(500)` iken duyuru `Body` sınırsızdır; bu dilimin ana özelliği olan "Şablon olarak kaydet" 500 karakteri aşan her duyuruda 400 dönerdi.

**Files:**
- Modify: `src/Oksis.Infrastructure/Persistence/Configurations/Announcements/AnnouncementTemplateConfiguration.cs`
- Modify: `src/Oksis.Application/Modules/Announcements/Commands/CreateAnnouncementTemplate/CreateAnnouncementTemplateCommandValidator.cs`
- Modify: `src/Oksis.Application/Modules/Announcements/Commands/UpdateAnnouncementTemplate/UpdateAnnouncementTemplateCommandValidator.cs`
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/AnnouncementTemplateEndpointTests.cs`
- Create: `src/Oksis.Infrastructure/Persistence/Migrations/<stamp>_20260809_announcement_templates_personal.cs` (Görev 4'ün sonunda tek migration üretilir — **bu görevde migration ÜRETİLMEZ**, yalnız model değişir)

**Interfaces:**
- Produces: `CreateAnnouncementTemplateCommandValidator.DescriptionMaxLength = 4000` (Görev 8 istemci sınırını buradan kopyalar).

- [ ] **Step 1: Testi yaz**

`AnnouncementTemplateEndpointTests.cs` sonuna:

```csharp
[Fact]
public async Task Should_AllowSameName_When_OwnersDiffer()
{
    // K1: şablon kişiseldir. İki öğretmenin ikisi de "Ödev hatırlatma" adını
    // kullanabilmelidir — biri ötekinin şablonunu göremediği için ad çakışması
    // ona anlamsız bir engel ve başka birinin kaydının varlığına dair bir ipucu olurdu.
    await using var ctx = _fixture.CreateDbContext();
    var schoolId = await SeedSchoolAsync(ctx);

    var mine = AnnouncementTemplate.Create(schoolId, "Ödev hatırlatma", "Metin bir.", false);
    var theirs = AnnouncementTemplate.Create(schoolId, "Ödev hatırlatma", "Metin iki.", false);
    mine.CreatedBy = Guid.Parse("11111111-1111-1111-1111-111111111111");
    theirs.CreatedBy = Guid.Parse("22222222-2222-2222-2222-222222222222");

    ctx.AnnouncementTemplates.AddRange(mine, theirs);

    var act = async () => await ctx.SaveChangesAsync();

    await act.Should().NotThrowAsync();
}

[Fact]
public async Task Should_RejectSameName_When_SameOwner()
{
    await using var ctx = _fixture.CreateDbContext();
    var schoolId = await SeedSchoolAsync(ctx);
    var owner = Guid.Parse("33333333-3333-3333-3333-333333333333");

    var first = AnnouncementTemplate.Create(schoolId, "Kar tatili", "Metin bir.", false);
    var second = AnnouncementTemplate.Create(schoolId, "Kar tatili", "Metin iki.", false);
    first.CreatedBy = owner;
    second.CreatedBy = owner;

    ctx.AnnouncementTemplates.AddRange(first, second);

    var act = async () => await ctx.SaveChangesAsync();

    await act.Should().ThrowAsync<DbUpdateException>();
}

[Fact]
public async Task Should_AcceptLongDescription_When_UnderFourThousand()
{
    // Duyuru gövdesi sınırsızdır (AnnouncementConfiguration `Body`'ye HasMaxLength VERMEZ);
    // "Şablon olarak kaydet" bu gövdeyi şablona taşır. 500'lük kolon o akışı çoğu gerçek
    // duyuruda 400'e düşürürdü.
    await using var ctx = _fixture.CreateDbContext();
    var schoolId = await SeedSchoolAsync(ctx);

    var template = AnnouncementTemplate.Create(schoolId, "Uzun metin", new string('a', 3900), false);
    ctx.AnnouncementTemplates.Add(template);

    var act = async () => await ctx.SaveChangesAsync();

    await act.Should().NotThrowAsync();
}
```

> `SeedSchoolAsync` bu dosyada zaten varsa onu kullan; yoksa dosyadaki mevcut kurulum yardımcısının adını kullan — **yeni bir fixture yazma**, komşu testlerin kalıbını fork et.

- [ ] **Step 2: Testin kırıldığını gör**

```bash
export DOTNET_ROOT=$HOME/.dotnet; export PATH=$DOTNET_ROOT:$DOTNET_ROOT/tools:$PATH
dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~AnnouncementTemplateEndpointTests"
```
Beklenen: `Should_AllowSameName_When_OwnersDiffer` **FAIL** (benzersiz indeks ihlali), `Should_AcceptLongDescription_When_UnderFourThousand` **FAIL** (`nvarchar(500)` taşması).

- [ ] **Step 3: Configuration'ı güncelle**

`AnnouncementTemplateConfiguration.cs`:

```csharp
        builder.Property(x => x.SchoolId).IsRequired();
        builder.Property(x => x.Name).IsRequired().HasMaxLength(120);
        // 4000: duyuru gövdesi SINIRSIZDIR (AnnouncementConfiguration `Body`'ye HasMaxLength
        // vermez) ve "Şablon olarak kaydet" o gövdeyi buraya taşır. Eski 500'lük sınır o akışı
        // çoğu gerçek duyuruda 400'e düşürüyordu (ölçüldü 2026-08-09).
        builder.Property(x => x.Description).IsRequired().HasMaxLength(4000);
        builder.Property(x => x.Urgent).IsRequired().HasDefaultValue(false);
        builder.Property(x => x.UsageCount).IsRequired().HasDefaultValue(0);
        builder.Property(x => x.LastUsedAt);
        builder.Property(x => x.RowVersion).IsRowVersion();

        // K1 — ŞABLON KİŞİSELDİR: benzersizlik SAHİBE iner. Okul geneli benzersizlik,
        // kullanıcının GÖREMEDİĞİ bir kayıt yüzünden 409 üretirdi ve o kaydın varlığını
        // sızdırırdı. `CreatedBy`'ı AuditingInterceptor yazar (hesap kimliği, Person DEĞİL).
        builder.HasIndex(x => new { x.SchoolId, x.CreatedBy, x.Name }).IsUnique();
```

`CreateAnnouncementTemplateCommandValidator.cs` ve `UpdateAnnouncementTemplateCommandValidator.cs` içinde:

```csharp
    /// <summary>EF: <c>HasMaxLength(4000)</c>.</summary>
    public const int DescriptionMaxLength = 4000;
```

> `UpdateAnnouncementTemplateCommandValidator` kendi sabitini tutuyorsa onu da 4000 yap; `CreateAnnouncementTemplateCommandValidator.DescriptionMaxLength`'e atıf veriyorsa dokunma. Önce dosyayı oku.

- [ ] **Step 4: Testlerin geçtiğini gör**

```bash
dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~AnnouncementTemplateEndpointTests"
```
Beklenen: PASS. (Bu adımda EF model ile veritabanı şeması ayrışmış olur; `dotnet ef database update` Görev 4'ten sonra koşulacak — testler `EnsureDatabaseCreatedAsync` ile modelden şema kurduğu için burada geçerler. Eğer fixture migration uyguluyorsa bu adım Görev 4'ün migration'ı üretilene kadar KIRMIZI kalır; o durumda uygulayıcı bunu Görev 4'te kapatır ve **burada durumu açıkça raporlar**.)

- [ ] **Step 5: Commit**

```bash
git add src/Oksis.Infrastructure/Persistence/Configurations/Announcements/AnnouncementTemplateConfiguration.cs \
        src/Oksis.Application/Modules/Announcements/Commands/CreateAnnouncementTemplate/CreateAnnouncementTemplateCommandValidator.cs \
        src/Oksis.Application/Modules/Announcements/Commands/UpdateAnnouncementTemplate/UpdateAnnouncementTemplateCommandValidator.cs \
        tests/Oksis.Infrastructure.IntegrationTests/Persistence/AnnouncementTemplateEndpointTests.cs
git commit -m "feat(announcements): sablon adi sahibe gore benzersiz ve metin siniri 4000"
```

---

### Task 2: Şablon envanteri yalnız sahibin şablonlarını döndürür (B-1)

`GetAnnouncementTemplatesQueryHandler` bugün okulun **tüm** şablonlarını döndürüyor. K1 bunu değiştirir. Handler'ın mevcut sınıf doc'u "envanter yüzeyi" gerekçesini anlatıyor — o gerekçe **düşmez**, daralır: `CanUseInventoryAsync` kapısı veli/öğrenciyi dışarıda tutmaya devam eder (o kapı bir izin sorusudur), sahiplik süzgeci onun **üzerine** biner.

**Files:**
- Modify: `src/Oksis.Application/Modules/Announcements/Queries/GetAnnouncementTemplates/GetAnnouncementTemplatesQueryHandler.cs`
- Modify: `src/Oksis.Application/Modules/Announcements/Queries/GetAnnouncementTemplates/GetAnnouncementTemplatesQuery.cs` (docblock)
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/AnnouncementTemplateEndpointTests.cs`

**Interfaces:**
- Consumes: `ICurrentUser.Id` (hesap kimliği), `AnnouncementCallerResolver.CanUseInventoryAsync`.
- Produces: davranış — `GET /api/v1/announcements/templates` yalnız `CreatedBy == currentUser.Id` satırlarını döndürür.

- [ ] **Step 1: Testi yaz**

```csharp
[Fact]
public async Task Should_ReturnOnlyMine_When_TemplatesBelongToDifferentOwners()
{
    // K1: yönetici de öğretmen de yalnız KENDİ şablonunu görür. Bu test davranış
    // değişikliğinin kendisidir — önceki sürümde okulun tümü dönüyordu.
    await using var ctx = _fixture.CreateDbContext();
    var schoolId = await SeedSchoolAsync(ctx);
    var me = Guid.Parse("44444444-4444-4444-4444-444444444444");
    var other = Guid.Parse("55555555-5555-5555-5555-555555555555");

    var mine = AnnouncementTemplate.Create(schoolId, "Benim şablonum", "Metin.", false);
    var theirs = AnnouncementTemplate.Create(schoolId, "Başkasının şablonu", "Metin.", false);
    mine.CreatedBy = me;
    theirs.CreatedBy = other;
    ctx.AnnouncementTemplates.AddRange(mine, theirs);
    await ctx.SaveChangesAsync();

    var handler = new GetAnnouncementTemplatesQueryHandler(
        ctx, TenantFor(schoolId), CurrentUserWithId(me), PermissionReaderAllowing("announcements.create"));

    var result = await handler.Handle(new GetAnnouncementTemplatesQuery(), default);

    result.IsSuccess.Should().BeTrue();
    result.Value!.Select(t => t.Name).Should().BeEquivalentTo(["Benim şablonum"]);
}
```

> `TenantFor`, `CurrentUserWithId`, `PermissionReaderAllowing` bu dosyada ya da kardeş test dosyalarında zaten mevcut yardımcılardır — **önce ara, bulamazsan komşu dosyadaki (`GetAnnouncementPublishersQueryHandler` testleri) kalıbı fork et.** Yeni bir sahte (fake) tipi icat etme.

- [ ] **Step 2: Testin kırıldığını gör**

```bash
dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~Should_ReturnOnlyMine_When_TemplatesBelongToDifferentOwners"
```
Beklenen: FAIL — iki isim de dönüyor. (Ayrıca handler'ın ctor imzası henüz 3 parametreli olduğu için **derleme hatası** alınır; bu da beklenen kırmızıdır.)

- [ ] **Step 3: Handler'ı güncelle**

```csharp
public sealed class GetAnnouncementTemplatesQueryHandler(
    IApplicationDbContext db,
    ITenantContext tenant,
    ICurrentUser currentUser,
    IPermissionReader permissionReader)
    : IQueryHandler<GetAnnouncementTemplatesQuery, IReadOnlyList<AnnouncementTemplateDto>>
```

Sorgunun `Where`'i:

```csharp
        // K1 — ŞABLON KİŞİSELDİR (kullanıcı kararı 2026-08-09). Yönetici de öğretmen de
        // YALNIZ kendi şablonunu görür; ortak/okul şablonu kavramı yoktur.
        //
        // Sahiplik `CreatedBy` ile ölçülür ve o alanı `AuditingInterceptor` `currentUser.Id`
        // ile doldurur — yani karşılaştırılan şey HESAP kimliğidir, `Person.Id` DEĞİL.
        // Bu modülün geri kalanı (`AnnouncementCallerResolver.ResolveMyPersonIdAsync`)
        // Person kimliğiyle çalışır; ikisini karıştırmak sessizce BOŞ liste üretirdi.
        //
        // `CanUseInventoryAsync` kapısı DÜŞMEZ, üstüne biner: o kapı veli/öğrencinin
        // `announcements.view` iznini envanter yüzeyinden ayırır ve sahiplik süzgeci onu
        // ikame etmez — şablonu olmayan bir veli yine de bu yüzeye hiç girmemelidir.
        var templates = await db.AnnouncementTemplates.AsNoTracking()
            .Where(t => t.SchoolId == schoolId && t.CreatedBy == currentUser.Id)
            .OrderByDescending(t => t.UsageCount)
            .ThenBy(t => t.Name)
            .ToListAsync(cancellationToken);
```

`GetAnnouncementTemplatesQuery.cs` docblock'unu düzelt:

```csharp
/// <summary>
/// <b>Çağıranın KENDİ şablon defteri</b> (K1, 2026-08-09). İzin <c>announcements.view</c>'dur
/// çünkü şablonu KULLANAN (sekreter, öğretmen) onu yönetenden farklıdır — oluşturma/
/// düzenleme/silme <c>announcements.template.manage</c> ister.
///
/// <para>Liste okul envanteri DEĞİLDİR: handler <c>CreatedBy</c> ile daraltır. Eski
/// "okulun şablon envanteri" ifadesi K1 öncesine aittir.</para>
/// </summary>
```

- [ ] **Step 4: Testlerin geçtiğini gör**

```bash
dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~AnnouncementTemplate"
dotnet build
```
Beklenen: PASS + build temiz. **Not:** aynı dosyadaki eski testlerden bazıları şablonu `CreatedBy` yazmadan kuruyorsa (`Guid.Empty`) ve handler'ı `CurrentUserWithId(Guid.Empty)` ile çağırmıyorsa kırılır — bu **doğru** kırılmadır; testleri sahibi açıkça yazacak biçimde güncelle ve her güncellemenin yanına neden gerektiğini yaz.

- [ ] **Step 5: Commit**

```bash
git add -A src tests
git commit -m "feat(announcements): sablon envanteri cagiranin kendi defterine daraltildi"
```

---

### Task 3: Şablon düzenleme ve silme sahiplik kapısından geçer (B-3)

Bugün iki handler de yalnız `Id + SchoolId` ile arıyor. Şablonlar kişiselleşince bu, **başkasının şablonunu düzenleyip silebilmek** demektir — üstelik liste onu hiç göstermediği için kullanıcı ne yaptığını da bilmez. Bu maddeyi atlama.

**Files:**
- Modify: `src/Oksis.Application/Modules/Announcements/Commands/UpdateAnnouncementTemplate/UpdateAnnouncementTemplateCommandHandler.cs`
- Modify: `src/Oksis.Application/Modules/Announcements/Commands/DeleteAnnouncementTemplate/DeleteAnnouncementTemplateCommandHandler.cs`
- Modify: `src/Oksis.Application/Modules/Announcements/Commands/CreateAnnouncementTemplate/CreateAnnouncementTemplateCommandHandler.cs` (ad çakışması sahibe iner)
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/AnnouncementTemplateEndpointTests.cs`

**Interfaces:**
- Produces: `PUT`/`DELETE /templates/{id}` yabancı sahipte **404** (403 değil).

- [ ] **Step 1: Testi yaz**

```csharp
[Fact]
public async Task Should_Return404_When_UpdatingSomeoneElsesTemplate()
{
    // 404, 403 DEĞİL: "yetkin yok" demek o kimliğin var olduğunu söylerdi. Aynı gerekçe
    // handler'da başka okulun şablonu için zaten yazılı; sahiplik onun ikinci ekseni.
    await using var ctx = _fixture.CreateDbContext();
    var schoolId = await SeedSchoolAsync(ctx);
    var owner = Guid.Parse("66666666-6666-6666-6666-666666666666");
    var intruder = Guid.Parse("77777777-7777-7777-7777-777777777777");

    var template = AnnouncementTemplate.Create(schoolId, "Kar tatili", "Metin.", false);
    template.CreatedBy = owner;
    ctx.AnnouncementTemplates.Add(template);
    await ctx.SaveChangesAsync();

    var handler = new UpdateAnnouncementTemplateCommandHandler(
        ctx, TenantFor(schoolId), CurrentUserWithId(intruder));

    var result = await handler.Handle(
        new UpdateAnnouncementTemplateCommand(template.Id, "Yeni ad", "Yeni metin.", false), default);

    result.IsFailure.Should().BeTrue();
    result.Status.Should().Be(ResultStatus.NotFound);

    // Ve kayıt GERÇEKTEN değişmemiş olmalı — 404 dönüp yine de yazmak en kötü sonuç olurdu.
    var reloaded = await ctx.AnnouncementTemplates.AsNoTracking().SingleAsync(t => t.Id == template.Id);
    reloaded.Name.Should().Be("Kar tatili");
}

[Fact]
public async Task Should_Return404_When_DeletingSomeoneElsesTemplate()
{
    await using var ctx = _fixture.CreateDbContext();
    var schoolId = await SeedSchoolAsync(ctx);
    var owner = Guid.Parse("88888888-8888-8888-8888-888888888888");
    var intruder = Guid.Parse("99999999-9999-9999-9999-999999999999");

    var template = AnnouncementTemplate.Create(schoolId, "Servis gecikmesi", "Metin.", false);
    template.CreatedBy = owner;
    ctx.AnnouncementTemplates.Add(template);
    await ctx.SaveChangesAsync();

    var handler = new DeleteAnnouncementTemplateCommandHandler(
        ctx, TenantFor(schoolId), CurrentUserWithId(intruder));

    var result = await handler.Handle(new DeleteAnnouncementTemplateCommand(template.Id), default);

    result.IsFailure.Should().BeTrue();
    result.Status.Should().Be(ResultStatus.NotFound);
    (await ctx.AnnouncementTemplates.CountAsync(t => t.Id == template.Id)).Should().Be(1);
}

[Fact]
public async Task Should_AllowDuplicateName_When_ClashIsAnotherOwners()
{
    // Ad çakışması sorgusu da sahibe inmelidir; inmezse kullanıcı GÖREMEDİĞİ bir kayıt
    // yüzünden 409 alır (Task 1'deki indeksle aynı gerekçe, bu sefer uygulama katmanında).
    await using var ctx = _fixture.CreateDbContext();
    var schoolId = await SeedSchoolAsync(ctx);
    var other = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    var me = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    var theirs = AnnouncementTemplate.Create(schoolId, "Ödev hatırlatma", "Metin.", false);
    theirs.CreatedBy = other;
    ctx.AnnouncementTemplates.Add(theirs);
    await ctx.SaveChangesAsync();

    var handler = new CreateAnnouncementTemplateCommandHandler(ctx, TenantFor(schoolId), CurrentUserWithId(me));

    var result = await handler.Handle(
        new CreateAnnouncementTemplateCommand("Ödev hatırlatma", "Benim metnim.", false), default);

    result.IsSuccess.Should().BeTrue();
}
```

> `ResultStatus.NotFound` yerine depoda kullanılan gerçek API neyse o kullanılır — `Result`/`Result<T>` tipini **önce oku** (`src/Oksis.Shared`), komşu testlerin 404 iddiasını nasıl yazdığını fork et.

- [ ] **Step 2: Testin kırıldığını gör**

```bash
dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~SomeoneElses|FullyQualifiedName~ClashIsAnotherOwners"
```
Beklenen: derleme hatası (ctor'lar 2 parametreli) → düzeltince FAIL.

- [ ] **Step 3: Üç handler'ı güncelle**

`UpdateAnnouncementTemplateCommandHandler`: ctor'a `ICurrentUser currentUser` ekle; arama ve çakışma sorgusu:

```csharp
        // K1 — sahiplik kapısı. Yabancı sahipte 404 (403 DEĞİL): "yetkin yok" demek o
        // kimliğin var olduğunu sızdırırdı; başka okulun şablonu için zaten yazılı olan
        // gerekçenin ikinci ekseni. `CreatedBy` = HESAP kimliği (AuditingInterceptor).
        var template = await db.AnnouncementTemplates
            .SingleOrDefaultAsync(
                t => t.Id == request.Id && t.SchoolId == schoolId && t.CreatedBy == currentUser.Id,
                cancellationToken);
```

```csharp
        // Çakışma da SAHİBE iner: kullanıcının göremediği bir kayıt yüzünden 409 almak
        // hem kullanılamaz hem sızdırıcıdır. KENDİNİ DIŞLA koşulu (`t.Id != request.Id`)
        // korunur — yalnız `urgent` değiştiren düzenleme kendi satırına çakışırdı.
        var duplicate = await db.AnnouncementTemplates.AsNoTracking()
            .AnyAsync(
                t => t.SchoolId == schoolId
                    && t.CreatedBy == currentUser.Id
                    && t.Id != request.Id
                    && t.Name == normalizedName,
                cancellationToken);
```

`DeleteAnnouncementTemplateCommandHandler`: ctor'a `ICurrentUser currentUser`, arama koşuluna `&& t.CreatedBy == currentUser.Id` ve aynı gerekçe yorumu.

`CreateAnnouncementTemplateCommandHandler`: ctor'a `ICurrentUser currentUser`, `exists` sorgusuna `&& t.CreatedBy == currentUser.Id`.

Ayrıca `CreateAnnouncementTemplateCommand` docblock'undaki **"Yalnız yönetim oluşturur (DYR-F-13)"** cümlesi B-5 gereği yanlıştır; Görev 4'te düzeltilecek — **bu görevde dokunma** ki iki değişiklik ayrı gözden geçirilebilsin.

- [ ] **Step 4: Testlerin geçtiğini gör**

```bash
dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~AnnouncementTemplate"
dotnet build
```

- [ ] **Step 5: Commit**

```bash
git add -A src tests
git commit -m "feat(announcements): sablon duzenleme ve silme sahiplik kapisindan gecer"
```

---

### Task 4: Öğretmen kendi şablonunu yönetir + tek migration (B-2, K5)

`announcements.template.manage` bugün **yalnız SCHOOL_ADMIN**'dedir (ölçüldü; müdür yardımcısı rolü MVP sonrasına ertelenmiş ve eşleşmesi kaldırılmış — brief'teki "yönetici + müdür yardımcısı" bugünkü koda göre yanlıştır). Öğretmenin kendi defterini yönetebilmesi için izin ona da açılır. Rol izinleri `HasData` ile seed'lendiğinden bu bir **migration** gerektirir; Görev 1 ve Görev 5'in şema değişiklikleriyle birlikte **tek** migration üretilir.

**Files:**
- Modify: `src/Oksis.Infrastructure/Persistence/Seed/MasterData/RolePermissionSeedData.cs`
- Modify: `src/Oksis.Application/Modules/Announcements/Commands/CreateAnnouncementTemplate/CreateAnnouncementTemplateCommand.cs` (docblock — B-5)
- Modify: `src/Oksis.Application/Modules/Announcements/Commands/UpdateAnnouncementTemplate/UpdateAnnouncementTemplateCommand.cs` (docblock — B-5)
- Modify: `src/Oksis.Domain/Modules/Announcements/Entities/AnnouncementTemplate.cs` (docblock — B-5)
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/AnnouncementPermissionSeedTests.cs`
- Create: migration (Görev 5'ten SONRA — aşağıdaki not)

> **SIRA NOTU.** Bu görevin migration adımı **Görev 5 bittikten sonra** koşulur; `TemplateId` kolonu da aynı migration'a girsin. Uygulayıcı Görev 4'ün kod+test adımlarını bitirir, commit eder, Görev 5'i yapar, sonra Görev 5'in son adımında **tek** `dotnet ef migrations add` çağırır. Bu görevin Step 5'i bunu açıkça söyler.

- [ ] **Step 1: Testi yaz**

`AnnouncementPermissionSeedTests.cs` sonuna:

```csharp
[Fact]
public async Task Should_GrantTemplateManageToTeacher_When_RolePermissionsSeeded()
{
    // K1: şablon kişiseldir, yani öğretmen KENDİ defterini yönetir. Sahiplik kapısı
    // handler'lardadır (Task 2/3); bu izin yalnız "yazma yüzeyine girebilir mi"yi açar.
    await using var ctx = _fixture.CreateDbContext();

    var granted = await (
        from rp in ctx.RolePermissions
        join p in ctx.Permissions on rp.PermissionId equals p.Id
        join r in ctx.SystemRoles on rp.RoleId equals r.Id
        where r.Code == "TEACHER" && p.Code.StartsWith("announcements.")
        select p.Code).ToListAsync();

    granted.Should().Contain("announcements.template.manage");

    // Öğretmen moderasyon ve onay YETKİSİ ALMAZ — bu dilim yalnız şablon kapısını açar.
    granted.Should().NotContain("announcements.moderate");
    granted.Should().NotContain("announcements.approve");
}
```

> Rol kodunun gerçekten `"TEACHER"` olduğunu `SystemRoleSeedData.cs`'ten **doğrula** — kardeş test `"SCHOOL_ADMIN"`/`"PARENT"` gibi UPPER_SNAKE_CASE kullanıyor.

- [ ] **Step 2: Testin kırıldığını gör**

```bash
dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~Should_GrantTemplateManageToTeacher"
```
Beklenen: FAIL — liste `announcements.template.manage` içermiyor.

- [ ] **Step 3: Seed'i ve üç docblock'u güncelle**

`RolePermissionSeedData.cs`, TEACHER bloğundaki duyuru izinlerinin yanına:

```csharp
            MasterSeedIds.Permissions.AnnouncementsReportView,
            // ANNOUNCEMENTS.TEMPLATE_MANAGE — K1 (kullanıcı kararı 2026-08-09): şablon
            // KİŞİSELDİR, öğretmen kendi defterini oluşturur/düzenler/siler. İzin yalnız
            // yazma yüzeyini açar; HANGİ kayda dokunabileceğini handler'lardaki `CreatedBy`
            // kapısı belirler (GetAnnouncementTemplatesQueryHandler + Update/Delete).
            // Bu, `announcements.view` + self-only alıcı eşleşmesindeki iki katmanlı
            // kalıbın aynısıdır.
            MasterSeedIds.Permissions.AnnouncementsTemplateManage,
```

`CreateAnnouncementTemplateCommand.cs` docblock'u (B-5):

```csharp
/// <summary>
/// Yeni hazır duyuru metni — <b>çağıranın KENDİ defterine</b> (K1, 2026-08-09).
///
/// <para><b>DÜZELTME:</b> bu doküman eskiden "Yalnız yönetim oluşturur (DYR-F-13)" diyordu.
/// K1 ile şablon kişiselleşti: öğretmen de kendi şablonunu oluşturur, düzenler ve siler.
/// <c>announcements.template.manage</c> artık SCHOOL_ADMIN'in yanında TEACHER rolünde de
/// seed'lidir; hangi KAYDA dokunulabileceğini izin değil, handler'daki <c>CreatedBy</c>
/// kapısı belirler.</para>
/// </summary>
```

`UpdateAnnouncementTemplateCommand.cs` ve `AnnouncementTemplate.cs` (entity) içindeki aynı "Yalnız yönetim…" cümlelerini de aynı biçimde düzelt.

- [ ] **Step 4: Testin geçtiğini gör**

```bash
dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~AnnouncementPermissionSeedTests"
dotnet test tests/Oksis.Tests --filter "FullyQualifiedName~MasterRoleSeedTests"
```
Beklenen: ikisi de PASS. (`MasterRoleSeedTests` SuperAdmin/SchoolAdmin eksenini ölçer; TEACHER satırı eklemek onu etkilemez — etkilerse test **doğru** kırılmıştır ve gerekçesiyle güncellenir.)

- [ ] **Step 5: Commit — migration YOK**

```bash
git add -A src tests
git commit -m "feat(announcements): sablon yonetimi izni ogretmene acildi"
```

> Migration **Görev 5'in sonunda** üretilecek. Burada `dotnet ef migrations add` **çağırma**.

---

### Task 5: Duyuru hangi şablondan üretildiğini taşır + TEK migration

K6 sayacın **yayın anında** artmasını istiyor. Yayın üç ayrı yerden olur (`Announcement.Publish()` çağıranları: create handler, `Approve`, zamanlanmış duyuru job'ı) ve son ikisi duyuruyu oluşturma isteğinden **çok sonra** çalışır. Bu yüzden şablon bağı isteğin içinde tutulamaz; duyurunun **üzerinde** durmalıdır.

**Files:**
- Modify: `src/Oksis.Domain/Modules/Announcements/Entities/Announcement.cs`
- Modify: `src/Oksis.Infrastructure/Persistence/Configurations/Announcements/AnnouncementConfiguration.cs`
- Modify: `src/Oksis.Application/Modules/Announcements/Commands/CreateAnnouncement/CreateAnnouncementCommand.cs`
- Modify: `src/Oksis.Application/Modules/Announcements/Commands/CreateAnnouncement/CreateAnnouncementCommandHandler.cs`
- Test: `tests/Oksis.Domain.UnitTests/Modules/Announcements/AnnouncementTemplateTests.cs`, `tests/Oksis.Infrastructure.IntegrationTests/Persistence/CreateAnnouncementTests.cs` *(dosya adı farklıysa duyuru oluşturma testlerinin bulunduğu dosya)*
- Create: `src/Oksis.Infrastructure/Persistence/Migrations/<stamp>_20260809_announcement_templates_personal.*`

**Interfaces:**
- Produces:
  ```csharp
  public Guid? TemplateId { get; private set; }          // Announcement
  public void MarkCreatedFromTemplate(Guid templateId);  // Announcement
  // CreateAnnouncementCommand'a yeni alan (kayıt sonuna eklenir):
  string? TemplateId
  ```
- Görev 7 (codegen) bu alanı `CreateAnnouncementCommand` şemasında görecek; Görev 8/9/10/12/15 istemciden gönderecek.

- [ ] **Step 1: Testi yaz**

`AnnouncementTemplateTests.cs` (domain) sonuna:

```csharp
[Fact]
public void MarkCreatedFromTemplate_Should_StoreLink()
{
    var announcement = NewDraft();               // dosyadaki mevcut yardımcı
    var templateId = Guid.NewGuid();

    announcement.MarkCreatedFromTemplate(templateId);

    announcement.TemplateId.Should().Be(templateId);
}
```

Integration tarafında (duyuru oluşturma testlerinin dosyasına):

```csharp
[Fact]
public async Task Should_LinkTemplate_When_TemplateIdBelongsToCaller()
{
    // Bağ, sayacın yayın anında artabilmesi içindir (K6): zamanlanmış ve onay bekleyen
    // duyurular çok sonra, BAŞKA kod yollarından yayına çıkar ve oluşturma isteğini
    // hiç görmezler — bu yüzden şablon kimliği duyurunun ÜZERİNDE durmak zorundadır.
    await using var ctx = _fixture.CreateDbContext();
    var (schoolId, callerAccountId) = await SeedSchoolWithPublisherAsync(ctx);

    var template = AnnouncementTemplate.Create(schoolId, "Kar tatili", "Hazır metin gövdesi.", false);
    template.CreatedBy = callerAccountId;
    ctx.AnnouncementTemplates.Add(template);
    await ctx.SaveChangesAsync();

    var result = await CreateHandler(ctx, schoolId, callerAccountId).Handle(
        NewCommand(asDraft: true, templateId: template.Id.ToString()), default);

    result.IsSuccess.Should().BeTrue();
    var saved = await ctx.Announcements.AsNoTracking()
        .SingleAsync(a => a.Id == Guid.Parse(result.Value!.Id));
    saved.TemplateId.Should().Be(template.Id);
}

[Fact]
public async Task Should_IgnoreTemplateLink_When_TemplateBelongsToSomeoneElse()
{
    // Bağ bir İSTATİSTİK ipucudur, içerik değil. Başkasının (ya da silinmiş) şablonunun
    // kimliği duyurunun tamamını reddetmez — yayını bir sayaç yüzünden düşürmek kötü bir
    // takas olurdu. Bağ kurulmaz ve sayaç hiç artmaz.
    await using var ctx = _fixture.CreateDbContext();
    var (schoolId, callerAccountId) = await SeedSchoolWithPublisherAsync(ctx);

    var theirs = AnnouncementTemplate.Create(schoolId, "Başkasının şablonu", "Metin gövdesi.", false);
    theirs.CreatedBy = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
    ctx.AnnouncementTemplates.Add(theirs);
    await ctx.SaveChangesAsync();

    var result = await CreateHandler(ctx, schoolId, callerAccountId).Handle(
        NewCommand(asDraft: true, templateId: theirs.Id.ToString()), default);

    result.IsSuccess.Should().BeTrue();
    var saved = await ctx.Announcements.AsNoTracking()
        .SingleAsync(a => a.Id == Guid.Parse(result.Value!.Id));
    saved.TemplateId.Should().BeNull();
}
```

> `SeedSchoolWithPublisherAsync`, `CreateHandler` ve `NewCommand` bu test dosyasının **mevcut** kurulum yardımcılarıdır (adları farklıysa dosyayı oku ve oradakileri kullan). `NewCommand`'a yeni `templateId` parametresi eklenir; varsayılanı `null` olsun ki dosyadaki diğer çağrılar değişmesin.

- [ ] **Step 2: Testin kırıldığını gör**

```bash
dotnet build
```
Beklenen: `TemplateId` / `MarkCreatedFromTemplate` yok — derleme hatası.

- [ ] **Step 3: Domain + config + komut + handler**

`Announcement.cs`, alan bildirimlerinin yanına:

```csharp
    /// <summary>
    /// Bu duyurunun hangi şablondan üretildiği — <b>yalnız kullanım sayacı için</b> (K4/K6).
    ///
    /// <para><b>FK YOKTUR ve olmayacaktır.</b> Şablon silinebilir bir kayıttır
    /// (<c>DeleteAnnouncementTemplateCommandHandler</c>, tüm ağaçtaki tek
    /// <c>Remove</c> çağrısı) ve tasarım silme onayında bunu açıkça vaat eder:
    /// "bu şablonla oluşturduğun duyurular etkilenmez". Bir FK ya silmeyi bloklar ya
    /// duyuruyu cascade ile yok ederdi — ikisi de INV-1'e aykırıdır. Bağ koptuğunda
    /// alan yetim bir GUID olarak kalır ve sayaç artışı sessizce atlanır.</para>
    /// </summary>
    public Guid? TemplateId { get; private set; }
```

Metot, `AttachFile` emsalinin yanına:

```csharp
    /// <summary>
    /// Duyuruyu üretildiği şablona bağlar. <c>CreateDraft</c>'a parametre EKLENMEDİ:
    /// o fabrika on üç parametreli ve on yedi çağrı yeri var; <c>AttachFile</c> emsali
    /// aynı sorunu aynı biçimde çözüyor.
    /// </summary>
    public void MarkCreatedFromTemplate(Guid templateId) => TemplateId = templateId;
```

`AnnouncementConfiguration.cs`:

```csharp
        // Kullanım sayacının bağı. FK YOK — gerekçesi entity'de yazılı (şablon silinebilir,
        // duyuru silinemez). İndeks de yok: alan yalnız yayın anında, TEK duyuru elde
        // varken okunur; tarama üretmez.
        builder.Property(x => x.TemplateId);
```

`CreateAnnouncementCommand.cs` — kaydın **sonuna** yeni alan (mevcut alanların sırası korunur; codegen çıktısında alan sırası değişirse istemci gövdeleri sessizce kaymaz ama gereksiz diff üretir):

```csharp
    bool AsDraft,
    string? AttachmentFileId,
    /// <summary>Duyurunun üretildiği şablonun kimliği — kullanım sayacı için, isteğe bağlı.</summary>
    string? TemplateId) : ICommand<AnnouncementDto>;
```

`CreateAnnouncementCommandHandler.cs`, `Announcement.CreateDraft(...)` çağrısından hemen sonra (ek dosya bloğundan **önce**):

```csharp
            // Şablon bağı (K4/K6). Şablon ÇAĞIRANIN KENDİSİNİN olmalıdır — `CreatedBy`
            // kapısı Task 2/3'teki uçlarla aynıdır; başkasının şablonuna sayaç yazmak
            // ona ait olmayan bir kullanım istatistiği üretirdi.
            //
            // Çözülemeyen kimlik SESSİZCE ATLANIR, istek REDDEDİLMEZ: bağ bir istatistik
            // ipucudur, duyurunun içeriği değil. Kullanıcı formu doldururken şablonunu
            // başka bir cihazdan silmiş olabilir; bunun bedeli yayının tamamen düşmesi
            // olamaz. Sayaç da bu durumda hiç artmaz — yanlış bir sayı yazmaktansa
            // hiç yazmamak doğrudur.
            if (!string.IsNullOrWhiteSpace(request.TemplateId)
                && Guid.TryParse(request.TemplateId, out var templateId))
            {
                var templateExists = await db.AnnouncementTemplates.AsNoTracking()
                    .AnyAsync(
                        t => t.Id == templateId
                            && t.SchoolId == schoolId
                            && t.CreatedBy == currentUser.Id,
                        cancellationToken);

                if (templateExists)
                {
                    announcement.MarkCreatedFromTemplate(templateId);
                }
            }
```

- [ ] **Step 4: Testlerin geçtiğini gör**

```bash
dotnet build && dotnet test tests/Oksis.Domain.UnitTests tests/Oksis.Application.UnitTests
```

- [ ] **Step 5: TEK migration'ı üret ve uygula**

```bash
docker compose up -d
export DOTNET_ROOT=$HOME/.dotnet; export PATH=$DOTNET_ROOT:$DOTNET_ROOT/tools:$PATH
dotnet ef migrations add 20260809_announcement_templates_personal \
  --project src/Oksis.Infrastructure --startup-project src/Oksis.Api
dotnet ef database update --project src/Oksis.Infrastructure --startup-project src/Oksis.Api
```

Üretilen migration'ı **oku ve doğrula** — dördü de içinde olmalı:
1. `IX_announcement_templates_SchoolId_Name` DROP → `IX_announcement_templates_SchoolId_CreatedBy_Name` CREATE (unique)
2. `announcement_templates.Description` `nvarchar(500)` → `nvarchar(4000)`
3. `announcements.TemplateId` `uniqueidentifier NULL` ADD
4. `role_permissions` INSERT — TEACHER × `announcements.template.manage`

Eksik olan varsa **migration'ı silip** ilgili model/seed değişikliğini düzelt ve yeniden üret; migration dosyasını **elle düzenleme**.

- [ ] **Step 6: Tam test koşusu**

```bash
dotnet test --nologo
```
Beklenen: 0 hata, toplam **> 3345**.

- [ ] **Step 7: Commit**

```bash
git add -A src tests
git commit -m "feat(announcements): duyuru uretildigi sablonu tasir ve sema migration'i eklendi"
```

---

### Task 6: Kullanım sayacı üç yayın noktasında da artar (B-4 / K4 / K6)

`RegisterUse` yazılmış ama **sıfır** çağıranı var. K6 sayacın yalnız duyuru gerçekten yayına çıkınca artmasını istiyor; `Announcement.Publish()` üç yerden çağrılıyor ve üçü de bağlanmalı — biri unutulursa zamanlanmış ya da onaylanan duyurular sayılmaz ve sayaç sessizce eksik kalır.

**Files:**
- Modify: `src/Oksis.Application/Modules/Announcements/Commands/CreateAnnouncement/CreateAnnouncementCommandHandler.cs`
- Modify: `src/Oksis.Application/Modules/Announcements/Commands/ApproveAnnouncement/ApproveAnnouncementCommandHandler.cs`
- Modify: `src/Oksis.Infrastructure/BackgroundJobs/Jobs/PublishScheduledAnnouncementsJob.cs`
- Create: `src/Oksis.Application/Modules/Announcements/Common/AnnouncementTemplateUsageWriter.cs`
- Test: `tests/Oksis.Application.UnitTests/Modules/Announcements/AnnouncementTemplateUsageGuardTests.cs` (**yeni**) + üç ilgili integration test dosyası

**Interfaces:**
- Produces:
  ```csharp
  public static class AnnouncementTemplateUsageWriter
  {
      public static Task RegisterAsync(
          IApplicationDbContext db, Announcement announcement, Guid schoolId,
          DateTimeOffset now, CancellationToken ct);
  }
  ```

- [ ] **Step 1: Yapısal bekçi testini yaz**

`tests/Oksis.Application.UnitTests/Modules/Announcements/AnnouncementTemplateUsageGuardTests.cs`:

```csharp
using System.Text.RegularExpressions;
using FluentAssertions;
using Xunit;

namespace Oksis.Application.UnitTests.Modules.Announcements;

/// <summary>
/// K6: sayaç YALNIZ gerçekten yayına çıkan duyuruda artar — ve yayın ÜÇ yerden olur.
/// Bu bekçi o üçlüyü sayar: dördüncü bir yayın yolu eklenirse (ya da mevcut biri sayaç
/// çağrısını kaybederse) test kırılır ve sayaç sessizce eksik kalmaz.
///
/// Kaynak dosya ÜZERİNDEN ölçer çünkü ölçtüğü şey davranış değil KAPSAMDIR: "her yayın
/// yolu sayacı yazar" iddiasını runtime'da kanıtlamak üç ayrı entegrasyon kurulumu
/// gerektirirdi ve yeni eklenen dördüncü yolu yine de görmezdi.
/// </summary>
public sealed class AnnouncementTemplateUsageGuardTests
{
    private static readonly string[] PublishSites =
    [
        "src/Oksis.Application/Modules/Announcements/Commands/CreateAnnouncement/CreateAnnouncementCommandHandler.cs",
        "src/Oksis.Application/Modules/Announcements/Commands/ApproveAnnouncement/ApproveAnnouncementCommandHandler.cs",
        "src/Oksis.Infrastructure/BackgroundJobs/Jobs/PublishScheduledAnnouncementsJob.cs",
    ];

    [Fact]
    public void Should_CallUsageWriter_From_EveryPublishSite()
    {
        foreach (var relative in PublishSites)
        {
            var source = File.ReadAllText(Path.Combine(RepoRoot(), relative));
            source.Should().Contain(
                "AnnouncementTemplateUsageWriter.RegisterAsync",
                because: $"{relative} bir yayın yoludur ve K6 gereği sayacı yazmalıdır");
        }
    }

    [Fact]
    public void Should_HaveExactlyThreePublishSites()
    {
        // `Announcement.Publish(` çağrısı bu üç dosyanın DIŞINDA geçerse yeni bir yayın
        // yolu doğmuş demektir; onu da listeye ve sayaç çağrısına eklemek gerekir.
        var hits = Directory
            .EnumerateFiles(Path.Combine(RepoRoot(), "src"), "*.cs", SearchOption.AllDirectories)
            .Where(f => Regex.IsMatch(File.ReadAllText(f), @"\.Publish\(\s*(reach|materialization)"))
            .Select(f => Path.GetFileName(f))
            .OrderBy(f => f)
            .ToList();

        hits.Should().BeEquivalentTo(
            ["CreateAnnouncementCommandHandler.cs", "PublishScheduledAnnouncementsJob.cs"]);
        // Approve yolu entity içinden geçer (`Announcement.Approve` → `Publish`), bu yüzden
        // dosya listesinde görünmez; onu birinci test kapsar.
    }

    private static string RepoRoot()
    {
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir is not null && !File.Exists(Path.Combine(dir.FullName, "Oksis.sln"))) dir = dir.Parent;
        return dir?.FullName ?? throw new InvalidOperationException("Oksis.sln bulunamadı.");
    }
}
```

> Çözüm dosyasının adı `Oksis.sln` değilse repo kökünde `ls *.sln` ile **ölç** ve sabiti düzelt. Depoda buna benzer yapısal bekçiler zaten var (`AnnouncementHardDeleteGuardTests`) — onun kök bulma kalıbını fork etmek daha güvenlidir.

- [ ] **Step 2: Testin kırıldığını gör**

```bash
dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~AnnouncementTemplateUsageGuardTests"
```
Beklenen: `Should_CallUsageWriter_From_EveryPublishSite` FAIL (üç dosyada da çağrı yok).

- [ ] **Step 3: Yazıcıyı ve üç çağrıyı ekle**

`src/Oksis.Application/Modules/Announcements/Common/AnnouncementTemplateUsageWriter.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Domain.Modules.Announcements.Entities;

namespace Oksis.Application.Modules.Announcements.Common;

/// <summary>
/// Şablon kullanım sayacını yazar (K4/K6).
///
/// <para><b>Neden yayın anında, oluşturma anında değil (kullanıcı kararı 2026-08-09):</b>
/// sayaç "bu şablonla kaç duyuru YAYIMLADIM" sorusunu ölçer. Taslakta kalmış ya da
/// reddedilmiş bir metin bu sayıya girmemelidir.</para>
///
/// <para><b>Neden ayrı bir yazıcı:</b> yayın ÜÇ yerden olur — doğrudan oluşturma, onay,
/// zamanlanmış duyuru job'ı. Kural üç yere kopyalansaydı biri zamanla ayrışırdı;
/// <c>AnnouncementTemplateUsageGuardTests</c> hem bu tek yerin üçünden de çağrıldığını
/// hem de dördüncü bir yayın yolunun doğmadığını sabitler.</para>
///
/// <para>Yetim bağ SESSİZCE ATLANIR: şablon silinmiş olabilir (aralarında FK YOKTUR —
/// gerekçesi <c>Announcement.TemplateId</c> docblock'unda). Bu durumda hiçbir satır
/// yazılmaz ve yayın etkilenmez.</para>
/// </summary>
public static class AnnouncementTemplateUsageWriter
{
    public static async Task RegisterAsync(
        IApplicationDbContext db,
        Announcement announcement,
        Guid schoolId,
        DateTimeOffset now,
        CancellationToken ct)
    {
        if (announcement.TemplateId is not { } templateId)
        {
            return;
        }

        // AsNoTracking DEĞİL: sayacı artırmak için izlenen bir entity gerekir.
        var template = await db.AnnouncementTemplates
            .SingleOrDefaultAsync(t => t.Id == templateId && t.SchoolId == schoolId, ct);

        // Sahiplik BURADA sorulmaz: bağ zaten CreateAnnouncementCommandHandler'da
        // `CreatedBy` kapısından geçerek kurulur. İkinci bir kapı, zamanlanmış duyuruyu
        // job'ın (çağıransız bağlamda) yayınladığı yolda `currentUser`ı okumaya zorlardı.
        template?.RegisterUse(now);
    }
}
```

Üç çağrı — her biri `Publish`/`Approve` çağrısından **hemen sonra**, `SaveChangesAsync`'ten **önce**:

```csharp
            announcement.Publish(reach, recipients.Count, clock.UtcNow);

            // K6 — sayaç yalnız GERÇEKTEN yayına çıkınca artar. Taslak ve zamanlanmış
            // dallar bu satıra hiç ulaşmaz (ikisi de yukarıda erken döner).
            await AnnouncementTemplateUsageWriter.RegisterAsync(
                db, announcement, schoolId, clock.UtcNow, cancellationToken);
```

```csharp
            announcement.Approve(materialization.Reach, materialization.RecipientCount, clock.UtcNow);
        }
        catch (AnnouncementDomainException ex) { … }

        // K6 — onaydan geçen duyuru da bu anda yayına çıkar; sayaç burada artar.
        await AnnouncementTemplateUsageWriter.RegisterAsync(
            db, announcement, schoolId, clock.UtcNow, cancellationToken);
```

```csharp
                announcement.Publish(materialization.Reach, materialization.RecipientCount, now);

                // K6 — zamanlanmış duyuru bu job'da yayına çıkar; sayaç burada artar.
                await AnnouncementTemplateUsageWriter.RegisterAsync(
                    db, announcement, schoolId, now, cancellationToken);
```

> Job'daki `schoolId`/`now`/`cancellationToken` yerel adları farklı olabilir — dosyayı **oku** ve oradaki adları kullan.

- [ ] **Step 4: Davranış testini yaz ve geçir**

Duyuru oluşturma integration test dosyasına:

```csharp
[Fact]
public async Task Should_IncrementUsage_When_AnnouncementIsPublished()
{
    // … şablon + doğrudan yayınlanan duyuru kur (asDraft: false, scheduledAt: null)
    var template = await ctx.AnnouncementTemplates.AsNoTracking().SingleAsync(t => t.Id == templateId);
    template.UsageCount.Should().Be(1);
    template.LastUsedAt.Should().NotBeNull();
}

[Fact]
public async Task Should_NotIncrementUsage_When_SavedAsDraft()
{
    // K6: taslak bir yayın değildir.
    template.UsageCount.Should().Be(0);
    template.LastUsedAt.Should().BeNull();
}
```

```bash
dotnet test --nologo
```
Beklenen: 0 hata, toplam **> Görev 5 sonundaki sayı**.

- [ ] **Step 5: Commit**

```bash
git add -A src tests
git commit -m "feat(announcements): sablon kullanim sayaci uc yayin noktasina baglandi"
```

---

# BÖLÜM 2 — CODEGEN (Görev 7)

---

### Task 7: Tek codegen turu

C2/C3'teki sıra: backend biter → **bir kez** codegen → istemci başlar. Bu turdan önce hiçbir istemci görevi açılmaz.

**Files:**
- Modify: `packages/api/src/generated/schema.ts` (üretilir, elle düzenlenmez)

- [ ] **Step 1: API'yi ayağa kaldır**

```bash
cd /Users/farukkaya/Repositories/oksis-api
export DOTNET_ROOT=$HOME/.dotnet; export PATH=$DOTNET_ROOT:$DOTNET_ROOT/tools:$PATH
docker compose up -d
dotnet ef database update --project src/Oksis.Infrastructure --startup-project src/Oksis.Api
dotnet run --project src/Oksis.Api --urls http://localhost:5112
```

- [ ] **Step 2: Şemanın gerçekten değiştiğini gör**

Başka bir terminalde:

```bash
curl -s http://localhost:5112/openapi/v1.json | grep -o '"templateId"' | head
```
Beklenen: en az bir eşleşme (`CreateAnnouncementCommand` içinde). **Yol `/openapi/v1.json`'dır, `/swagger/v1/swagger.json` DEĞİL.**

- [ ] **Step 3: Codegen'i koş**

```bash
cd /Users/farukkaya/Repositories/oksis-ui
npm run codegen -w @workspace/api
```

- [ ] **Step 4: Sonucu doğrula**

```bash
grep -n "templateId" packages/api/src/generated/schema.ts | head
git -C /Users/farukkaya/Repositories/oksis-ui diff --stat packages/api/src/generated/schema.ts
npm run typecheck --workspace=@workspace/api
```
Beklenen: `templateId` `CreateAnnouncementCommand` şemasında var; `AnnouncementTemplateDto` **değişmemiş** (sahiplik telde görünmez — kasıtlı); typecheck temiz.

- [ ] **Step 5: Commit (oksis-ui)**

```bash
cd /Users/farukkaya/Repositories/oksis-ui
git add packages/api/src/generated/schema.ts
git commit -m "chore(api): sablon bagi icin sema yeniden uretildi"
```

---

# BÖLÜM 3 — ÇEKİRDEK VE MOCK (Görev 8–9)

---

### Task 8: Şablon kuralları `packages/core`'a taşınır

Web ve mobil aynı kararları verecek: hangi eylem hangi statüde görünür, alt notta ne yazar, ad çakışıyor mu, arama alanı görünsün mü, red gerekçesi nereden okunur. `apps/*`'ta test koşucusu yok — bu kuralların tek doğru yeri core'dur.

**Files:**
- Modify: `packages/core/src/announcements/constants.ts`
- Modify: `packages/core/src/announcements/logic.ts`
- Modify: `packages/core/src/announcements/logic.test.ts`
- Modify: `packages/core/src/announcements/schemas.ts`

**Interfaces:**
- Produces:
  ```ts
  export const TEMPLATE_NAME_MAX = 120
  export const TEMPLATE_BODY_MAX = 4000
  export const TEMPLATE_SEARCH_THRESHOLD = 8

  export type AnnouncementRowAction =
    | "view" | "report" | "audit" | "saveAsTemplate" | "edit" | "withdraw" | "restore"
  export function announcementRowActions(status: AnnouncementStatus): AnnouncementRowAction[]
  export function announcementActionNote(status: AnnouncementStatus): string
  export function templateNameClash(
    name: string, templates: AnnouncementTemplate[], exceptId?: string,
  ): AnnouncementTemplate | null
  export function isTemplateFormValid(v: { name: string; description: string }): boolean
  export function templateSearchVisible(count: number): boolean
  export function filterTemplates(list: AnnouncementTemplate[], query: string): AnnouncementTemplate[]
  export type TemplateSort = "mostUsed" | "recent" | "name"
  export function sortTemplates(list: AnnouncementTemplate[], sort: TemplateSort): AnnouncementTemplate[]
  export interface AnnouncementRejection { by: string; at: string; reason: string }
  export function announcementRejection(entries: AnnouncementAuditEntry[]): AnnouncementRejection | null
  // schemas.ts:
  export const announcementTemplateSchema  // { name, description, urgent }
  export type AnnouncementTemplateValues
  // announcementFormSchema'ya: templateId: z.string().nullable()
  ```

- [ ] **Step 1: Testi yaz**

`packages/core/src/announcements/logic.test.ts` sonuna:

```ts
describe("şablon kuralları (C5)", () => {
  const tpl = (over: Partial<AnnouncementTemplate> = {}): AnnouncementTemplate => ({
    id: "t1", name: "Kar tatili", description: "Metin.", usageCount: 3,
    lastUsedAt: "2026-02-11T08:00:00.0000000+00:00", urgent: false, ...over,
  })

  it("ad çakışması Türkçe büyük/küçük harfe ve boşluğa duyarsızdır", () => {
    const list = [tpl({ id: "t1", name: "Kar Tatili" })]
    expect(templateNameClash("  kar tatili ", list)?.id).toBe("t1")
    // KENDİNİ DIŞLA: yalnız `urgent`i değiştiren düzenleme kendi satırına çakışmamalı.
    expect(templateNameClash("Kar Tatili", list, "t1")).toBeNull()
    expect(templateNameClash("Servis", list)).toBeNull()
  })

  it("form yalnız ad > 1 ve metin > 5 karakterken geçerlidir", () => {
    expect(isTemplateFormValid({ name: "Ka", description: "Altı karakter." })).toBe(true)
    expect(isTemplateFormValid({ name: "K", description: "Altı karakter." })).toBe(false)
    expect(isTemplateFormValid({ name: "Kar", description: "kısa" })).toBe(false)
    expect(isTemplateFormValid({ name: "  ", description: "Altı karakter." })).toBe(false)
  })

  it("arama alanı 8. şablondan itibaren görünür", () => {
    // Tasarım kararı: 4-5 şablonda alan israfıdır (mobile/README.md).
    expect(templateSearchVisible(7)).toBe(false)
    expect(templateSearchVisible(8)).toBe(true)
  })

  it("arama ad ve metinde çalışır, Türkçe harfe duyarsızdır", () => {
    const list = [tpl({ id: "a", name: "Kar tatili", description: "Servis çalışmaz." }),
                  tpl({ id: "b", name: "Ödev", description: "Teslim tarihi." })]
    expect(filterTemplates(list, "SERVİS").map((t) => t.id)).toEqual(["a"])
    expect(filterTemplates(list, "ödev").map((t) => t.id)).toEqual(["b"])
    expect(filterTemplates(list, "  ").map((t) => t.id)).toEqual(["a", "b"])
  })

  it("sıralama üç kolda da kararlıdır", () => {
    const list = [tpl({ id: "a", name: "Bir", usageCount: 1, lastUsedAt: "2026-01-01T00:00:00Z" }),
                  tpl({ id: "b", name: "Aki", usageCount: 9, lastUsedAt: null })]
    expect(sortTemplates(list, "mostUsed").map((t) => t.id)).toEqual(["b", "a"])
    expect(sortTemplates(list, "name").map((t) => t.id)).toEqual(["b", "a"])
    expect(sortTemplates(list, "recent").map((t) => t.id)).toEqual(["a", "b"])
    // Girdi dizisi DEĞİŞMEZ — liste sunucudan gelen query cache'idir.
    expect(list.map((t) => t.id)).toEqual(["a", "b"])
  })
})

describe("duyuru işlem menüsü — statüye göre (C5)", () => {
  it("yayındaki duyuruda tam menü açılır", () => {
    expect(announcementRowActions("published")).toEqual(
      ["view", "report", "audit", "saveAsTemplate", "edit", "withdraw"])
  })
  it("onay bekleyende yalnız geçmiş ve şablon kalır", () => {
    // Sistemde "onaydan geri al" diye bir eylem YOK (tasarım kararı) — menü kısalır,
    // eksik olanı alttaki not anlatır.
    expect(announcementRowActions("pendingApproval")).toEqual(
      ["view", "report", "audit", "saveAsTemplate"])
  })
  it("geri çekilende iptal eylemi görünür, düzenleme görünmez", () => {
    expect(announcementRowActions("withdrawn")).toEqual(
      ["view", "report", "audit", "saveAsTemplate", "restore"])
  })
  it("zamanlanmış ve süresi dolmuşta geri çekme vardır, düzenleme yoktur", () => {
    expect(announcementRowActions("scheduled")).toContain("withdraw")
    expect(announcementRowActions("scheduled")).not.toContain("edit")
    expect(announcementRowActions("expired")).toContain("withdraw")
  })
  it("taslakta yalnız okuma eylemleri kalır", () => {
    expect(announcementRowActions("draft")).toEqual(["view", "report", "audit", "saveAsTemplate"])
  })
  it("her statü kendi notunu alır ve notlar birbirinden farklıdır", () => {
    const notes = (["draft", "withdrawn", "scheduled", "published", "pendingApproval"] as const)
      .map(announcementActionNote)
    expect(new Set(notes).size).toBe(notes.length)
    expect(announcementActionNote("pendingApproval")).toContain("taslak")
  })
})

describe("red gerekçesi denetim izinden okunur (C5)", () => {
  // ÖLÇÜM: gerekçe DTO'da YOKTUR. `Announcement.Reject()` docblock'u "Gerekçe entity'ye
  // YAZILMAZ… kalıcı yeri denetim izi" diyor. Backend tarafındaki iki test bu iki dizeyi
  // sabitliyor: AnnouncementApprovalTests → Action == "duyuruyu reddetti" ve
  // Tag == "Gerekçe: …". Aşağıdaki eşleşme o sabitlere dayanır.
  const entry = (over: Partial<AnnouncementAuditEntry>): AnnouncementAuditEntry => ({
    actorName: "Mehmet Yıldırım", actorInitials: "MY", action: "duyuruyu yayınladı",
    at: "2026-02-11T08:00:00.0000000+00:00", field: null, tag: null, tone: null, ...over,
  })

  it("red satırını bulur ve 'Gerekçe: ' önekini soyar", () => {
    const found = announcementRejection([
      entry({}),
      entry({ action: "duyuruyu reddetti", tag: "Gerekçe: İfade uygun değil.", tone: "danger",
              actorName: "Okul Müdürlüğü", at: "2026-02-12T09:30:00.0000000+00:00" }),
    ])
    expect(found).toEqual({
      by: "Okul Müdürlüğü",
      at: "2026-02-12T09:30:00.0000000+00:00",
      reason: "İfade uygun değil.",
    })
  })

  it("red satırı yoksa null döner", () => {
    expect(announcementRejection([entry({})])).toBeNull()
  })

  it("birden çok red varsa SONUNCUSU kazanır", () => {
    // Öğretmen düzeltip yeniden gönderebilir; ekranda güncel gerekçe durmalıdır.
    const found = announcementRejection([
      entry({ action: "duyuruyu reddetti", tag: "Gerekçe: Eski.", at: "2026-02-01T00:00:00Z" }),
      entry({ action: "duyuruyu reddetti", tag: "Gerekçe: Yeni.", at: "2026-02-05T00:00:00Z" }),
    ])
    expect(found?.reason).toBe("Yeni.")
  })

  it("etiket beklenen öneki taşımıyorsa gerekçe boş kalır ama satır kaybolmaz", () => {
    const found = announcementRejection([entry({ action: "duyuruyu reddetti", tag: null })])
    expect(found?.reason).toBe("")
  })
})
```

- [ ] **Step 2: Testin kırıldığını gör**

```bash
cd /Users/farukkaya/Repositories/oksis-ui
npm run test --workspace=@workspace/core
```
Beklenen: fonksiyonlar tanımsız — FAIL.

- [ ] **Step 3: Uygula**

`constants.ts`:

```ts
/** EF `HasMaxLength(120)` — `AnnouncementTemplateConfiguration`. */
export const TEMPLATE_NAME_MAX = 120
/** EF `HasMaxLength(4000)` — C5'te 500'den yükseltildi (duyuru gövdesi sınırsızdır). */
export const TEMPLATE_BODY_MAX = 4000
/** Arama alanı bu sayıdan itibaren çizilir; altında alan israfıdır (tasarım kararı). */
export const TEMPLATE_SEARCH_THRESHOLD = 8
```

`logic.ts`:

```ts
const trLower = (s: string) => s.trim().toLocaleLowerCase("tr")

/**
 * Aynı sahibin defterinde aynı adda başka bir şablon var mı.
 *
 * Karşılaştırma Türkçe yerel ayarıyla küçültülür: "İ" ve "I" ayrımı yanlış yapılırsa
 * kullanıcı sunucudan 409 alır ama istemci hiçbir uyarı göstermemiş olur. Sunucu
 * tarafındaki benzersizlik `(SchoolId, CreatedBy, Name)`'dir ve adı TRIM ederek yazar
 * (`AnnouncementTemplate.NormalizeName`) — bu yüzden burada da trim edilir.
 *
 * `exceptId` düzenleme içindir: yalnız `urgent` bayrağını değiştiren bir kayıt kendi
 * satırına çakışırdı.
 */
export function templateNameClash(
  name: string,
  templates: AnnouncementTemplate[],
  exceptId?: string,
): AnnouncementTemplate | null {
  const needle = trLower(name)
  if (!needle) return null
  return templates.find((t) => t.id !== exceptId && trLower(t.name) === needle) ?? null
}

/**
 * Kaydet düğmesinin kapısı. Eşikler backend doğrulamasıyla AYNIDIR: ad boş olamaz
 * (`Announcements.Template.NameRequired`), metin ise tasarımın kabul ettiği en kısa
 * anlamlı gövdedir. Çakışma buraya girmez — onu çağıran ayrıca sorar ve kendi
 * uyarısını çizer.
 */
export function isTemplateFormValid(v: { name: string; description: string }): boolean {
  return v.name.trim().length > 1 && v.description.trim().length > 5
}

export function templateSearchVisible(count: number): boolean {
  return count >= TEMPLATE_SEARCH_THRESHOLD
}

export function filterTemplates(
  list: AnnouncementTemplate[],
  query: string,
): AnnouncementTemplate[] {
  const q = trLower(query)
  if (!q) return list
  return list.filter((t) => trLower(t.name).includes(q) || trLower(t.description).includes(q))
}

export type TemplateSort = "mostUsed" | "recent" | "name"

/** Girdiyi DEĞİŞTİRMEZ — liste TanStack Query cache'inden gelir. */
export function sortTemplates(list: AnnouncementTemplate[], sort: TemplateSort) {
  const copy = [...list]
  if (sort === "mostUsed") return copy.sort((a, b) => b.usageCount - a.usageCount)
  if (sort === "name") return copy.sort((a, b) => a.name.localeCompare(b.name, "tr"))
  // "recent": hiç kullanılmamış şablon EN SONA düşer — `null`'ı 0 saymak onu en eskiyle
  // eşitler ve listenin ortasına serpiştirirdi.
  return copy.sort(
    (a, b) => (b.lastUsedAt ? Date.parse(b.lastUsedAt) : -Infinity)
            - (a.lastUsedAt ? Date.parse(a.lastUsedAt) : -Infinity),
  )
}

export type AnnouncementRowAction =
  | "view" | "report" | "audit" | "saveAsTemplate" | "edit" | "withdraw" | "restore"

/**
 * Duyuru satır menüsü / işlem sayfası — hangi eylem hangi statüde çizilir.
 *
 * SAHİPLİK KAPISI YOKTUR ve gerekmez: öğretmenin listesi zaten yalnız kendi
 * duyurularını gösterir (`scope: "mine"`), yöneticinin ise hepsini yönetme yetkisi
 * vardır (K2). Eylemler yalnız STATÜYE bakar.
 *
 * Kapılar mevcut core kurallarını YENİDEN YAZMAZ, onları çağırır — `canAmendAnnouncement`,
 * `canWithdrawAnnouncement`, `canRestoreAnnouncement` üçü de zaten testlidir ve mobil
 * işlem sayfası bugün doğrudan onları kullanıyor. İkinci bir kural kümesi zamanla
 * ayrışırdı.
 */
export function announcementRowActions(status: AnnouncementStatus): AnnouncementRowAction[] {
  const actions: AnnouncementRowAction[] = ["view", "report", "audit", "saveAsTemplate"]
  if (canAmendAnnouncement(status)) actions.push("edit")
  if (canWithdrawAnnouncement(status)) actions.push("withdraw")
  if (canRestoreAnnouncement(status)) actions.push("restore")
  return actions
}

/**
 * Menünün altındaki açıklama notu. Menü statüye göre kısaldığında sayfa boş
 * durmasın diye vardır ve EKSİK olan eylemi anlatır (tasarım kararı).
 */
export function announcementActionNote(status: AnnouncementStatus): string {
  if (status === "pendingApproval") {
    return "Duyuru onayda — yönetim karar verene kadar düzenlenemez ve geri çekilemez; sistemde “onaydan geri al” diye bir işlem yok. Vazgeçtiyseniz okul yönetimine iletin; reddedilirse duyuru taslak olarak size döner."
  }
  if (status === "draft") {
    return "Taslak henüz kimseye ulaşmadı; listede yalnız siz görürsünüz. Yayınlandıktan sonra düzenleme ve geri çekme açılır."
  }
  if (status === "withdrawn") {
    return "Geri çekilen duyuru arşivde saklanır. Yayına geri almayı yalnız geri çekme işlemini yapan kişi ya da okul yönetimi yapabilir."
  }
  if (status === "scheduled") {
    return "Zamanlanmış duyuru henüz gönderilmedi. “Geri çek” yayını durdurur; kayıt arşivde saklanır."
  }
  return "Duyuru silinemez. Yanlış yayında “Geri çek” kullanın; kayıt arşivde saklanır."
}

export interface AnnouncementRejection {
  by: string
  at: string
  reason: string
}

/** Backend'in yazdığı iki sabit — `RejectAnnouncementCommandHandler`. */
const REJECT_ACTION = "duyuruyu reddetti"
const REJECT_TAG_PREFIX = "Gerekçe: "

/**
 * Red gerekçesini DENETİM İZİNDEN okur.
 *
 * ÖLÇÜM (2026-08-09): gerekçe hiçbir DTO alanında yoktur ve olmayacaktır —
 * `Announcement.Reject()` docblock'u "Gerekçe entity'ye YAZILMAZ… kalıcı yeri denetim
 * izi" diyor ve entity'de karşılık gelen alan yok. Bu yüzden öğretmen detayındaki
 * "Reddedildi" bloğu tek kaynaktan, `GET /announcements/{id}/audit-trail` yanıtından
 * beslenir.
 *
 * Dize eşleşmesi kırılgandır ama SAHİPSİZ DEĞİLDİR: iki backend testi bu iki sabiti
 * aynen doğruluyor (`AnnouncementApprovalTests` — `Action == "duyuruyu reddetti"` ve
 * `Tag == "Gerekçe: …"`). Backend metni değiştirirse orası kırmızıya döner.
 */
export function announcementRejection(
  entries: AnnouncementAuditEntry[],
): AnnouncementRejection | null {
  const hits = entries.filter((e) => e.action === REJECT_ACTION)
  if (hits.length === 0) return null
  // Sonuncusu kazanır: öğretmen düzeltip yeniden gönderebilir ve ekranda GÜNCEL gerekçe
  // durmalıdır. Sıralama iz sırasına değil zamana bakar — uç sırayı değiştirebilir.
  const latest = hits.reduce((a, b) => (Date.parse(b.at) >= Date.parse(a.at) ? b : a))
  const tag = latest.tag ?? ""
  return {
    by: latest.actorName,
    at: latest.at,
    reason: tag.startsWith(REJECT_TAG_PREFIX) ? tag.slice(REJECT_TAG_PREFIX.length) : "",
  }
}
```

`schemas.ts` — `announcementFormSchema` içine (`pinned`'in altına):

```ts
    pinned: z.boolean(),
    /** Duyurunun üretildiği şablon — yalnız kullanım sayacı için; yoksa null. */
    templateId: z.string().nullable(),
```

ve dosya sonuna:

```ts
/** Şablon formu — backend `CreateAnnouncementTemplateCommand` ile aynı üç alan. */
export const announcementTemplateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Şablon adı en az 2 karakter olmalı.")
    .max(TEMPLATE_NAME_MAX, `Şablon adı en çok ${TEMPLATE_NAME_MAX} karakter olabilir.`),
  description: z
    .string()
    .trim()
    .min(6, "Şablon metni en az 6 karakter olmalı.")
    .max(TEMPLATE_BODY_MAX, `Şablon metni en çok ${TEMPLATE_BODY_MAX} karakter olabilir.`),
  urgent: z.boolean(),
})
export type AnnouncementTemplateValues = z.infer<typeof announcementTemplateSchema>
```

> `AnnouncementAuditEntry` tipinin core'daki gerçek adını **önce ölç** (`packages/core/src/announcements/types.ts`); farklıysa import ve imzayı ona göre yaz.

- [ ] **Step 4: Testlerin geçtiğini gör**

```bash
npm run test --workspace=@workspace/core
npm run typecheck --workspace=@workspace/core && npm run lint --workspace=@workspace/core
```
Beklenen: **235 + yeni testler**, hepsi yeşil.

- [ ] **Step 5: `templateId`'yi tele bağla**

`packages/api/src/announcements/endpoints.ts`, `createAnnouncement` gövdesine:

```ts
        attachmentFileId: input.attachmentFileId ?? null,
        // Kullanım sayacının bağı (K4/K6). Sunucu bunu YALNIZ çağıranın kendi şablonuysa
        // saklar ve sayacı yayın anında artırır; çözülemeyen kimlik sessizce atlanır.
        templateId: input.templateId ?? null,
```

```bash
npm run test --workspace=@workspace/api
npm run typecheck --workspace=@workspace/api
```

- [ ] **Step 6: Commit**

```bash
git add packages/core packages/api
git commit -m "feat(announcements): sablon ve islem menusu kurallari core'a tasindi"
```

---

### Task 9: MSW mock'u sahipliği ve sayacı taklit eder

Mock bugün tek bir küresel şablon listesi tutuyor. Ekranlara **"Şablonlar kişiseldir — yalnız siz görürsünüz"** yazacağız; mock modunda bu cümle yalan olmamalıdır (ve mobil doğrulaması yalnız mock modunda yapılabiliyor). Ayrıca sayacın çalıştığı ekranda görülebilmesi gerekir.

**Files:**
- Modify: `packages/api-mocks/src/announcements/announcement-data.ts`
- Modify: `packages/api-mocks/src/announcements/announcement-handlers.ts`
- Modify: `packages/api-mocks/src/announcements/announcement-handlers.test.ts`

**Interfaces:**
- Consumes: `mockProfileForRequest(request)` (`packages/api-mocks/src/session/session-data.ts`) — `"Staff" | "Teacher" | "Student" | "Parent"`.
- Produces: sahiplik `AnnouncementTemplateDto`'ya **eklenmez** (tel şekli değişmez, R11); mock kendi yanında `owner` etiketi tutar.

- [ ] **Step 1: Testi yaz**

```ts
describe("şablon sahipliği (C5)", () => {
  it("yönetici ve öğretmen farklı defterler görür", async () => {
    setActiveMockProfile("Staff")
    const adminList = await templates()
    setActiveMockProfile("Teacher")
    const teacherList = await templates()

    expect(adminList.length).toBeGreaterThan(0)
    expect(teacherList.length).toBeGreaterThan(0)
    // Kesişim BOŞ: aynı kaydı iki kişi görmez.
    const shared = adminList.filter((a) => teacherList.some((t) => t.id === a.id))
    expect(shared).toEqual([])
  })

  it("oluşturulan şablon yalnız oluşturanın listesine düşer", async () => {
    setActiveMockProfile("Teacher")
    const res = await fetch(`${BASE}/templates`, {
      method: "POST",
      body: JSON.stringify({ name: "Öğretmenin şablonu", description: "Metin gövdesi.", urgent: false }),
    })
    const created = (await res.json()).data as TemplateRow

    expect((await templates()).map((t) => t.id)).toContain(created.id)
    setActiveMockProfile("Staff")
    expect((await templates()).map((t) => t.id)).not.toContain(created.id)
  })

  it("başkasının şablonu 404 ile korunur", async () => {
    setActiveMockProfile("Teacher")
    const mine = (await templates())[0]!
    setActiveMockProfile("Staff")

    const put = await fetch(`${BASE}/templates/${mine.id}`, {
      method: "PUT",
      body: JSON.stringify({ name: "Ele geçirildi", description: "Metin gövdesi.", urgent: false }),
    })
    expect(put.status).toBe(404)
    const del = await fetch(`${BASE}/templates/${mine.id}`, { method: "DELETE" })
    expect(del.status).toBe(404)
  })

  it("aynı adı iki farklı sahip kullanabilir", async () => {
    // Gerçek indeks `(SchoolId, CreatedBy, Name)` — mock aynı kuralı uygular.
    setActiveMockProfile("Teacher")
    const body = JSON.stringify({ name: "Ortak ad", description: "Metin gövdesi.", urgent: false })
    expect((await fetch(`${BASE}/templates`, { method: "POST", body })).status).toBe(200)
    setActiveMockProfile("Staff")
    expect((await fetch(`${BASE}/templates`, { method: "POST", body })).status).toBe(200)
    // Ama aynı sahip ikinci kez alamaz.
    expect((await fetch(`${BASE}/templates`, { method: "POST", body })).status).toBe(409)
  })
})

describe("şablon kullanım sayacı (C5)", () => {
  it("yayınlanan duyuru sayacı artırır, taslak artırmaz", async () => {
    setActiveMockProfile("Staff")
    const target = (await templates())[0]!
    const before = target.usageCount

    await createAnnouncement({ templateId: target.id, asDraft: true })
    expect((await templates()).find((t) => t.id === target.id)!.usageCount).toBe(before)

    await createAnnouncement({ templateId: target.id, asDraft: false })
    const after = (await templates()).find((t) => t.id === target.id)!
    expect(after.usageCount).toBe(before + 1)
    expect(after.lastUsedAt).not.toBeNull()
  })
})
```

> `createAnnouncement` yardımcısı bu test dosyasında zaten varsa onu kullan; yoksa dosyadaki mevcut POST çağrısı kalıbını fork et. `setActiveMockProfile` `packages/api-mocks/src/session/session-data.ts`'ten gelir.

- [ ] **Step 2: Testin kırıldığını gör**

```bash
npm run test --workspace=@workspace/api-mocks
```

- [ ] **Step 3: Uygula**

`announcement-data.ts`:

```ts
/**
 * Şablonun SAHİBİ — telde YOKTUR ve olmayacaktır (`AnnouncementTemplateDto` altı alan
 * taşır; gerçek uç sahibi hiç yayınlamaz, yalnız sahibin satırlarını döndürür). Mock
 * ayrımı yanında tutar ki "yalnız siz görürsünüz" cümlesi mock modunda da doğru olsun.
 */
type TemplateOwner = "Staff" | "Teacher"
let templateOwners = new Map<string, TemplateOwner>()

export function templatesFor(owner: TemplateOwner): S["AnnouncementTemplateDto"][] {
  return allTemplates().filter((t) => templateOwners.get(t.id) === owner)
}
export function claimTemplate(id: string, owner: TemplateOwner): void {
  templateOwners.set(id, owner)
}
```

`buildTemplates(now)` çıktısını iki sahibe böl (`resetAnnouncementMocks` içinde `templateOwners` da sıfırlansın) — yönetici defterine tasarımdaki dokuz `admin` şablonu, öğretmen defterine dört `teacher` şablonu düşsün. Adları ve metinleri `mobile/announcement-templates.jsx :: ANNOUNCEMENT_TEMPLATE_STORE`'dan al ama **alan adlarını telinkiyle yaz** (`description`, `usageCount`, `lastUsedAt`).

`announcement-handlers.ts` — dört handler:

```ts
  http.get("*/api/v1/announcements/templates", ({ request }) => {
    // K1: uç yalnız çağıranın kendi defterini döndürür. Veli/öğrenci profilinde
    // liste BOŞtur — gerçek uçta `CanUseInventoryAsync` onları hiç sokmuyor.
    return HttpResponse.json(envelope(templatesForRequest(request)))
  }),
```

`templatesForRequest` yardımcısı `mockProfileForRequest(request)` sonucunu `"Staff"`/`"Teacher"` dışında ise boş dizi döndürecek biçimde yazılır. POST `claimTemplate(row.id, owner)` çağırır ve çakışma kontrolünü **yalnız kendi defterinde** yapar; PUT/DELETE önce `templatesForRequest` içinde arar, bulamazsa `notFound("Şablon bulunamadı.")` döner.

POST `/api/v1/announcements` handler'ında, satır oluşturulup **yayınlandığı** dalda:

```ts
    // K6: sayaç yalnız GERÇEKTEN yayına çıkan duyuruda artar. Taslak ve zamanlanmış
    // dallar bu satıra ulaşmaz — backend'de de üç yayın noktası aynı kuralı uyguluyor.
    if (body.templateId && row.status === "published") {
      const target = allTemplates().find((t) => t.id === body.templateId)
      if (target) {
        target.usageCount += 1
        target.lastUsedAt = new Date().toISOString()
      }
    }
```

- [ ] **Step 4: Testlerin geçtiğini gör**

```bash
npm run test --workspace=@workspace/api-mocks
npm run typecheck --workspace=@workspace/api-mocks && npm run lint --workspace=@workspace/api-mocks
```
Beklenen: **93 + yeni testler**, hepsi yeşil.

- [ ] **Step 5: Commit**

```bash
git add packages/api-mocks
git commit -m "feat(announcements): sablon mock'u sahipligi ve kullanim sayacini taklit eder"
```

---

# BÖLÜM 4 — WEB (Görev 10–13)

---

### Task 10: Yönetici Şablonlar sekmesi tam CRUD olur (W-1..W-4, W-11)

`templates-tab.tsx` bugün 74 satır ve tek düğmesi var. Tasarım (`web/duyurular.jsx` `tab === "sablon"` + `duyurular_parts.jsx :: DuyTemplateGrid` + `duyurular_modals.jsx`) araç çubuğu, dört modal ve dört eylem çiziyor.

**Files:**
- Modify: `packages/ui/src/styles/announcements.css`
- Modify: `apps/web/features/announcements/templates-tab.tsx`
- Modify: `apps/web/features/announcements/modals.tsx`
- Modify: `apps/web/features/announcements/announcements-page.tsx`

**Interfaces:**
- Consumes: `useAnnouncementTemplates`, `useCreateAnnouncementTemplate`, `useUpdateAnnouncementTemplate`, `useDeleteAnnouncementTemplate` (`@workspace/api` — **üçü de bugün ölü, ilk çağıran bu görev**), `filterTemplates`/`sortTemplates`/`templateSearchVisible`/`templateNameClash`/`isTemplateFormValid`/`TEMPLATE_NAME_MAX`/`TEMPLATE_BODY_MAX` (core).
- Produces:
  ```tsx
  export function TemplatesTab(props: {
    templates: AnnouncementTemplate[]
    loading: boolean
    failed: boolean
    onRetry: () => void
    onUse: (t: AnnouncementTemplate) => void
    onNew: () => void
    onEdit: (t: AnnouncementTemplate) => void
    onDelete: (t: AnnouncementTemplate) => void
    onView: (t: AnnouncementTemplate) => void
  }): JSX.Element
  export function TemplateFormModal(props: {
    template: AnnouncementTemplate | null
    existing: AnnouncementTemplate[]
    pending: boolean
    error: string | null
    onClose: () => void
    onSave: (v: AnnouncementTemplateValues) => void
  }): JSX.Element
  export function TemplateDeleteModal(...)
  export function TemplateViewModal(...)
  export function SaveAsTemplateModal(...)   // Task 11 kullanır, burada yazılır
  ```

- [ ] **Step 1: Eksik CSS'i ekle**

`packages/ui/src/styles/announcements.css`, mevcut `.duy-tpl` bloğunun altına:

```css
/* C5 — şablon yönetimi. Sınıf adları tasarımla birebir; `.att-btn.icon` DEPO adıdır
   (tasarımdaki `ico` port EDİLMEZ — ölçüldü 2026-08-09). */
.duy-tpl .tfull { align-self: flex-start; display: inline-flex; align-items: center; gap: 6px; background: none; border: 0; padding: 0; cursor: pointer; font-size: 12px; font-weight: 700; color: var(--p); }
.duy-tplcount { font-size: 12.5px; font-weight: 700; color: var(--muted); margin-left: auto; }
.duy-tplread { white-space: pre-wrap; font-size: 13px; line-height: 1.65; color: var(--ink); background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-md); padding: 14px 16px; max-height: 320px; overflow-y: auto; }
.duy-tpl-usage { display: flex; gap: 16px; font-size: 12.5px; font-weight: 600; color: var(--muted); }
.duy-tpl-usage span { display: inline-flex; align-items: center; gap: 6px; }
.duy-hint { font-size: 12px; color: var(--muted); line-height: 1.5; margin-top: 6px; }
.duy-carry { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.duy-carry .ch2 { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); margin-bottom: 8px; }
.duy-carry .ci { display: flex; align-items: center; gap: 8px; font-size: 12.5px; font-weight: 600; padding: 4px 0; }
.duy-carry .ci.on { color: var(--success); }
.duy-carry .ci.off { color: var(--muted); }
@media (max-width: 720px) { .duy-carry { grid-template-columns: 1fr; } }
```

- [ ] **Step 2: Modalları yaz**

`modals.tsx` sonuna dört modal ekle. Kalıp olarak dosyadaki mevcut `RestoreModal`/`WithdrawModal` **fork edilir** (aynı `DuyModal` kabuğu, aynı `att-modal-*` sınıfları, aynı `pending` ve hata gösterimi). Metinler tasarımdan birebir alınır:

- `TemplateFormModal` — başlık `Yeni şablon` / `Şablonu düzenle`; düzenlemede üstte `.duy-tpl-usage` (kullanım sayısı + son kullanım) ve altta *"Bu şablonla daha önce yayımlanmış duyurular değişmez; onlar bağımsız kayıtlardır."*; ad alanı `maxLength={TEMPLATE_NAME_MAX}`; metin `<textarea>` `maxLength={TEMPLATE_BODY_MAX}`; acil anahtarı `.duy-radio` + `.duy-sw.dg` kalıbıyla; kaydet düğmesi `disabled={!isTemplateFormValid(v) || pending || Boolean(clash)}`; `clash` `templateNameClash(name, existing, template?.id)` ile hesaplanır ve `.duy-alert.wn` içinde **K3'ü** söyler: *"Buradan kaydetmek onu güncellemez… güncellemek için Şablonlar sekmesinden düzenleyin."*
- `TemplateDeleteModal` — *"Şablon listeden kalkar; yeni duyuru oluştururken seçilemez."* + `.duy-alert.ok` içinde **ölçülmüş** vaat: *"Bu şablonla yayımlanmış {usageCount} duyuru etkilenmez."* Bu cümle doğrudur ve ölçüsü kodda: `Announcement.TemplateId`'nin **FK'sı yoktur**, silme hiçbir duyuruya dokunmaz (`DeleteAnnouncementTemplateCommandHandler` tek `Remove` çağrısıdır ve yalnız şablon tablosuna dokunur).
- `TemplateViewModal` — `.duy-tplread` içinde tam metin + "Bu şablonla oluştur".
- `SaveAsTemplateModal` — ad alanı duyuru başlığıyla tohumlanır, `.duy-carry` bloğu **taşınır/taşınmaz** ayrımını çizer, çakışmada K3 uyarısı.

- [ ] **Step 3: Sekmeyi yaz**

`templates-tab.tsx` tamamen yeniden yazılır. Üstteki bilgi şeridinin metni **değişir** — eski cümle ("Şablonları yalnız yönetim oluşturur ve düzenler") K1'den sonra yanlıştır:

```tsx
      <div className="duy-alert wide">
        <DuyIcon name="info" size={17} />
        <div>
          Şablonlarınız yalnız size görünür. Şablon yalnız <b>metin ve acil işareti</b> taşır;
          hedef kitle, tarih ve ek dosya her duyuruda yeniden seçilir.
        </div>
      </div>
```

> Bu cümlenin arkasında uç var: `GetAnnouncementTemplatesQueryHandler` `CreatedBy == currentUser.Id` ile süzer (Görev 2) ve MSW aynısını taklit eder (Görev 9). **Ölçülmeden yazılmış olsaydı C4'ün imza hatası tekrarlanırdı.**

Araç çubuğu yalnız `templateSearchVisible(templates.length)` iken çizilir; sıralama `DuySelect` ile üç kola bağlanır; ızgara `.duy-tpls` + `.duy-tpl` ve her kartta "Tam metni gör" (`.tfull`), sayaç satırı, "Bu şablonla oluştur" + iki `.att-btn.ghost.icon` (düzenle / sil). Boş, aramada-boş, yükleniyor ve **hata** durumları dördü de çizilir (R8).

- [ ] **Step 4: Sayfayı kabla ve W-11'i düzelt**

`announcements-page.tsx`:

```tsx
  const createTemplate = useCreateAnnouncementTemplate()
  const updateTemplate = useUpdateAnnouncementTemplate()
  const deleteTemplate = useDeleteAnnouncementTemplate()
  const [templateModal, setTemplateModal] = useState<TemplateModalState>(null)
```

```tsx
            onUse={(template) => {
              // W-11 DÜZELTMESİ. Eski satır `setSeed({ title: template.name, urgent })`
              // idi ve `body`'yi HİÇ taşımıyordu — `compose.tsx` `seed?.body ?? ""`
              // okuduğu için şablonun metni sessizce düşüyordu (ölçüldü 2026-08-09).
              //
              // Başlık BİLEREK boş bırakılır: şablon adı duyurunun başlığı değildir
              // (form modalının kendi ipucu bunu yazıyor) ve tasarımın iki yüzeyi de
              // `{ title: "", body, urgent }` tohumluyor.
              setSeed({ title: "", body: template.description, urgent: template.urgent })
              setSeedTemplateId(template.id)
              setView({ kind: "compose" })
            }}
```

`seedTemplateId` yeni bir state'tir ve compose'a `templateId` olarak geçer; yayınlarken `create.submit({ ...values, templateId })` çağrılır. Compose'dan çıkışta (`setSeed(null)` yapılan her yerde) **birlikte** sıfırlanır — aksi hâlde bir sonraki elle yazılan duyuru yanlış şablonun sayacını artırırdı.

- [ ] **Step 5: Doğrula**

```bash
npm run typecheck --workspace=web && npm run lint --workspace=web
```

Sonra ekranı **aç ve gör** (`npm run dev -w web`, MSW açık): yönetici olarak Şablonlar sekmesinde yeni şablon oluştur → listede görün; düzenle → sayaç korunsun; sil → onay metnini oku; "Bu şablonla oluştur" → **compose'un metin alanında şablon gövdesi dursun** ve başlık boş olsun. Ekran görüntülerini plan çalışma alanına koy, md5'lerinin ayrı olduğunu doğrula, her birinin hangi iddiayı kanıtladığını yaz.

- [ ] **Step 6: Commit**

```bash
git add packages/ui apps/web
git commit -m "feat(announcements): web sablon sekmesi tam crud oldu ve sablon metni compose'a tasiniyor"
```

---

### Task 11: "Şablon olarak kaydet" web'de üç girişten açılır (W-9, W-10)

**Files:**
- Modify: `apps/web/features/announcements/compose.tsx`
- Modify: `apps/web/features/announcements/inventory-tab.tsx`
- Modify: `apps/web/features/announcements/announcements-page.tsx`

**Interfaces:**
- Consumes: `SaveAsTemplateModal` (Görev 10), `useCreateAnnouncementTemplate`.

- [ ] **Step 1: Compose kartını ekle**

> **BRIEF DÜZELTMESİ.** W-9 "compose altlığında" diyor; tasarım (`web/duyurular_compose.jsx`) kartı **sol kolonda** çiziyor ve alt bar **Taslak kaydet · Önizle · Yayınla** olarak kalıyor. Tasarım uygulanır.

`compose.tsx` sol kolonun sonuna, "Üst sırada sabitle" kartından sonra:

```tsx
      {onSaveTemplate ? (
        <div className="duy-card">
          <button type="button" className={"duy-row" + (asTemplate ? " on" : "")}
            onClick={() => setAsTemplate((v) => !v)}>
            <span style={{ flex: 1 }}>
              <span className="rt"><DuyIcon name="copy" size={15} />Şablon olarak kaydet</span>
              <span className="rd">Bu metin Şablonlar sekmesine eklenir; sonraki duyurularda hazır gelir.</span>
            </span>
            <span className={"duy-sw" + (asTemplate ? " on" : "")} />
          </button>
          {asTemplate ? (
            <div style={{ marginTop: 12 }}>
              <div className="duy-fld">
                <div className="duy-lbl">Şablon adı</div>
                <input className="duy-inp" value={templateName} maxLength={TEMPLATE_NAME_MAX}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder={title || "Örn. Ödev Teslim Hatırlatması"} />
                <div className="duy-hint">
                  Duyuru başlığından bağımsızdır — şablonu sonra bulacağınız adı yazın.
                </div>
              </div>
              {templateClash ? (
                <div className="duy-alert wn" style={{ marginTop: 12 }}>
                  <DuyIcon name="alertTriangle" size={17} />
                  <div>
                    <b>“{templateClash.name}”</b> adında şablonunuz zaten var
                    ({templateClash.usageCount} kez kullanıldı). Bu adla kaydedemezsiniz —
                    farklı bir ad verin ya da o şablonu Şablonlar sekmesinden düzenleyin.
                  </div>
                </div>
              ) : null}
              <div className="duy-alert" style={{ marginTop: 12 }}>
                <DuyIcon name="info" size={17} />
                <div>
                  Şablona yalnız <b>metin ve acil işareti</b> geçer. Hedef kitle, tarih ve
                  ek dosya şablonda tutulmaz.
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
```

`templateClash` çakışmayı **yazılan ad boşsa başlıktan** ölçer — tasarımın kalıbı budur ve kaydetme de aynı düşüşü kullanır (`templateName.trim() || title.trim()`); iki yer ayrışırsa kullanıcı uyarı görmeden 409 alırdı:

```tsx
  const [asTemplate, setAsTemplate] = useState(false)
  const [templateName, setTemplateName] = useState("")
  const templateClash = useMemo(
    () => templateNameClash(templateName.trim() || title.trim(), templates ?? []),
    [templateName, title, templates],
  )
```

Kaydetme, **yayın onayı verildiğinde** yapılır (tasarımın `onConfirm` kolu):

```tsx
    // Şablon duyuruyla birlikte, YAYIN ONAYINDAN sonra kaydedilir. Önce kaydetmek,
    // vazgeçilen bir duyurudan şablon üretirdi; sonra kaydetmek ise duyuru yayını
    // başarısız olduğunda kullanıcıyı iki kez uğraştırırdı.
    if (asTemplate && onSaveTemplate) {
      onSaveTemplate({ name: templateName.trim() || title.trim(), description: body, urgent })
    }
```

`onSaveTemplate` prop'u **isteğe bağlıdır**: geçilmediğinde kart hiç render edilmez (düzenleme akışında olduğu gibi). Tasarım da kartı yalnız yeni duyuruda çiziyor — `mode === "edit"` iken `onSaveTemplate` geçilmez.

- [ ] **Step 2: Satır menüsüne ve detaya ekle**

`inventory-tab.tsx` — `InventoryTabProps`'a `onSaveAsTemplate: (row: Announcement) => void` eklenir ve menüde "Değişiklik geçmişi"nden sonra çizilir (tasarımın sırası). `canWrite` kapısı korunur.

Detay görünümünün aksiyonlarına da aynı düğme eklenir (`announcements-page.tsx` içindeki `PageHeader actions`).

- [ ] **Step 3: Modalı kabla**

`announcements-page.tsx`: `setTemplateModal({ kind: "saveAs", source: row })` → `SaveAsTemplateModal` → `createTemplate.mutate` → başarı toast'ı: *"«{ad}» Şablonlar sekmesine eklendi"*. Hata `mutationErrorDesc` ile çevrilir (ham anahtar basılmaz).

- [ ] **Step 4: Doğrula**

```bash
npm run typecheck --workspace=web && npm run lint --workspace=web
```

Ekranı aç: compose'da anahtarı aç → yayınla → Şablonlar sekmesinde yeni kayıt görünsün; envanter satır menüsünden "Şablon olarak kaydet" → aynı adla ikinci kez denendiğinde **K3 uyarısı** çıksın. Ekran görüntüsü al.

- [ ] **Step 5: Commit**

```bash
git add apps/web
git commit -m "feat(announcements): web'de sablon olarak kaydet compose ve satir menusunden acilir"
```

---

### Task 12: Öğretmen portalı sekmelenir ve kendi şablon defterini alır (W-5, W-6)

**Files:**
- Modify: `apps/web/features/announcements/teacher-announcements-page.tsx`

**Interfaces:**
- Consumes: `TemplatesTab` + dört modal (Görev 10), aynı hook'lar.

- [ ] **Step 1: Sekmeleri kur**

`PageHeader`'a `tabs`/`activeTab`/`onTab` eklenir:

```tsx
        tabs={[
          { key: "mine", label: "Duyurularım", icon: "mega", count: listQuery.data?.totalCount ?? 0 },
          { key: "templates", label: "Şablonlar", icon: "copy", count: templatesQuery.data?.length ?? 0 },
        ]}
```

Sağdaki birincil eylem sekmeye göre değişir: `mine` → "Yeni Duyuru", `templates` → "Yeni şablon".

- [ ] **Step 2: Şablon sekmesini bağla**

Yönetici tarafıyla **aynı** `TemplatesTab` bileşeni ve **aynı** dört modal kullanılır — ikinci bir şablon yüzeyi yazılmaz. Öğretmenin gördüğü liste zaten kendi defteridir (Görev 2'deki `CreatedBy` süzgeci); istemcide ek bir kapı yoktur ve olmamalıdır.

`onUse` yönetici tarafıyla birebir aynı davranır (`title: ""`, `body: description`, `urgent`, `templateId`).

- [ ] **Step 3: Compose'a şablon kaydını bağla**

Öğretmen compose'una da `onSaveTemplate` geçilir (yönetici tarafındaki kalıp).

- [ ] **Step 4: Doğrula**

```bash
npm run typecheck --workspace=web && npm run lint --workspace=web
```

Öğretmen rolüyle ekranı aç: iki sekme görünsün, Şablonlar sekmesinde **yalnız öğretmenin dört şablonu** olsun (yöneticininkiler görünmesin — bu, "yalnız size görünür" cümlesinin ekrandaki kanıtıdır). Ekran görüntüsü al ve md5'ini yöneticininkiyle karşılaştır.

> **TUZAK (ölçüldü, C4):** sayfa yenilemesiyle açılan rota rolü token'dan bağımsız **yöneticiye** düşürür. Rol değişimi **uygulama içinden** yapılmalıdır.

- [ ] **Step 5: Commit**

```bash
git add apps/web
git commit -m "feat(announcements): ogretmen portalina sablonlar sekmesi eklendi"
```

---

### Task 13: Öğretmen duyuru detayı ve satır işlem menüsü (W-7, W-8) — `C4-21` kapanır

Spec §17 `C4-21`: *"Web'de öğretmen duyuru DETAY yüzeyi yok — DYR-F-18'in kalan ihlali."* Bu görev onu kapatır.

**Files:**
- Modify: `apps/web/features/announcements/teacher-announcements-page.tsx`
- Create: `apps/web/features/announcements/teacher-detail.tsx`
- Modify: `apps/web/features/announcements/announcements-screen.tsx` (öğretmene `entry` taşınır)

**Interfaces:**
- Consumes: `AnnouncementDetail` (mevcut, `detail.tsx`), `AuditDrawer`, `WithdrawModal`, `RestoreModal`, `useDeliveryReport`, `useAnnouncementAuditTrail`, `announcementRowActions`, `announcementActionNote`, `announcementRejection` (core).

- [ ] **Step 1: Satır menüsünü kur**

Tabloya `.duy-menuwrap` sütunu eklenir; başlık satırındaki hücre boş kalır. Menü **doğrudan** `announcementRowActions(row.status)` üzerinden çizilir — ikinci bir kapı listesi yazılmaz:

```tsx
{announcementRowActions(row.status).map((action) => (
  <button key={action} type="button" className={action === "withdraw" ? "danger" : undefined}
    onClick={() => { setOpenMenuId(null); runAction(action, row) }}>
    <DuyIcon name={ACTION_ICON[action]} size={16} />{ACTION_LABEL[action]}
  </button>
))}
{announcementRowActions(row.status).length <= 4 ? (
  <div className="note"><DuyIcon name="hourglass" size={14} />{announcementActionNote(row.status)}</div>
) : null}
```

Ayrıca başlık hücresi tıklanabilir olur (`onOpen`) — bugün `<div className="duy-title">`; `<button>`e çevrilir ve detayı açar.

- [ ] **Step 2: Detay görünümünü yaz**

`teacher-detail.tsx`, öğretmene özgü **üst blokları** çizer ve gövdeyi mevcut `AnnouncementDetail`'e devreder — ikinci bir gönderim raporu yazılmaz:

```tsx
/**
 * Öğretmen duyuru detayı. Gövde (gönderim raporu, içerik, ek dosya) yönetici
 * detayının AYNISIDIR — `AnnouncementDetail` yeniden kullanılır; öğretmen sürümü
 * yalnız daha az BLOK ekler (tasarım kararı: "iki portal aynı bileşen ailesini
 * paylaşır").
 *
 * RED GEREKÇESİ DTO'DAN GELMEZ. Ölçüldü (2026-08-09): `AnnouncementDto`'da red
 * alanı yoktur ve `Announcement.Reject()` docblock'u gerekçenin kalıcı yerinin
 * DENETİM İZİ olduğunu yazıyor. Bu yüzden blok `announcementRejection(auditTrail)`
 * ile beslenir ve denetim izi sorgusu `status === "draft"` iken de çalıştırılır —
 * reddedilen duyuru taslağa DÖNER, yani "reddedildi" diye bir statü yoktur.
 */
```

Bloklar: statü + tür rozetleri, başlık, meta satırı (hedef / yayın / geçerlilik); `pendingApproval` sarı bekleme bloğu (`announcementActionNote` metniyle **tek kaynaktan**); red bloğu (`announcementRejection` doluysa); `withdrawn` bilgi bloğu.

- [ ] **Step 3: Derin bağlantıyı bağla**

`announcements-screen.tsx`'te öğretmen kolu bugün `entry`'yi **bilerek** taşımıyor (yorumu: taşınsaydı öğretmen yönetim konsoluna düşerdi). Artık öğretmenin kendi detay yüzeyi olduğu için taşınır:

```tsx
  // C5: öğretmenin artık kendi detay yüzeyi var (`teacher-detail.tsx`), bu yüzden
  // `entry` ona da taşınır — `/announcements/{id}` derin bağlantısı öğretmende ara
  // listeye düşmüyor (spec §17 `C4-21`, DYR-F-18). Yönetim konsoluna düşme riski
  // yok: `TeacherAnnouncementsPage` `AnnouncementsPage`i hiç render etmiyor.
  if (activeRole === "teacher") return <TeacherAnnouncementsPage entry={entry} />
```

- [ ] **Step 4: Doğrula**

```bash
npm run typecheck --workspace=web && npm run lint --workspace=web
```

Ekranı aç: öğretmen listesinde satıra tıkla → detay açılsın; menüde yayındaki duyuruda **Düzenle + Geri çek**, geri çekilende **Geri çekmeyi iptal et**, onay bekleyende yalnız dört eylem + not olsun. `/announcements/{id}` adresini doğrudan aç → detay gelsin. Reddedilmiş bir duyuruda gerekçe bloğunu gör.

> Reddedilmiş duyuru mock'ta yoksa **bunu açıkça yaz**; gerekçe bloğunu ekran görüntüsüyle kanıtlayamadığını gizleme.

- [ ] **Step 5: Commit**

```bash
git add apps/web
git commit -m "feat(announcements): ogretmen duyuru detayi ve satir islem menusu eklendi"
```

---

# BÖLÜM 5 — MOBİL (Görev 14–16)

---

### Task 14: Mobil şablon CRUD — form ALT EKRAN olarak (M-1)

> **TASARIMIN VERDİĞİ KARAR, YENİDEN TARTIŞILMAZ.** Form bir sheet **değil** alt ekrandır. Ölçülmüş gerekçe (`mobile/README.md`): klavye açıkken sheet gövdesi ~200px'e iner, çok satırlı alan kullanılamaz hâle gelir ve altlıktaki "Kaydet" klavyenin altında kalır. Alt ekran tam yüksekliği kullanır; altlık `flexShrink: 0` ile klavyenin üstünde durur.

**Files:**
- Modify: `apps/mobile/src/features/announcements/components/templates-screen.tsx`
- Create: `apps/mobile/src/features/announcements/components/template-form-screen.tsx`
- Create: `apps/mobile/src/features/announcements/components/template-sheets.tsx`
- Modify: `apps/mobile/src/features/announcements/index.ts`
- Modify: `apps/mobile/src/app/announcements/templates.tsx`
- Create: `apps/mobile/src/app/announcements/templates/new.tsx`
- Create: `apps/mobile/src/app/announcements/templates/[id].tsx`

**Interfaces:**
- Produces:
  ```tsx
  export function TemplatesScreen(props: {
    templates: AnnouncementTemplate[]; loading: boolean; failed: boolean
    brandColor: string
    onBack: () => void; onRetry: () => void
    onUse: (t: AnnouncementTemplate) => void
    onNew: () => void; onEdit: (t: AnnouncementTemplate) => void
    onDelete: (t: AnnouncementTemplate) => Promise<void>
  })
  export function TemplateFormScreen(props: {
    template: AnnouncementTemplate | null; existing: AnnouncementTemplate[]
    brandColor: string; pending: boolean; error: string | null
    onBack: () => void; onSave: (v: AnnouncementTemplateValues) => void
  })
  export function TemplateDeleteSheet(props: { template: AnnouncementTemplate; pending: boolean; onClose: () => void; onConfirm: () => void })
  export function SaveAsTemplateSheet(props: { seedTitle: string; seedBody: string; urgent: boolean; existing: AnnouncementTemplate[]; brandColor: string; pending: boolean; error: string | null; onClose: () => void; onSaved: (v: AnnouncementTemplateValues) => void })
  ```

- [ ] **Step 1: Liste ekranını genişlet**

`templates-screen.tsx`:
- `ScreenHeader`'a sağ eylem: 44×44 `+` düğmesi (`accessibilityLabel="Yeni şablon"`), yalnız normal durumda.
- Bilgi notu metni **değişir** (eski cümle K1'den sonra yanlış): *"Şablonlar kişiseldir — yalnız siz görürsünüz. Şablon metin ve acil işaretini taşır; hedef kitle, tarih ve ek dosya duyuru oluştururken seçilir."*
- Arama alanı `templateSearchVisible(templates.length)` iken; süzme `filterTemplates`.
- Kartta uzun metin için "Tüm metni göster / Daha az göster" (tasarımdaki `long` kuralı: metin 120 karakterden uzun **ya da** satır sonu içeriyor).
- Kart altlığı: "Bu şablonla oluştur" (birincil, `full`) + 52px düzenle + 52px sil (`dangerGhost`). Üçü de min 44×44.
- Dört durum: normal / loading / empty / **error** (`failed` → yeniden dene). Bugün `failed` prop'u yok; eklenir ve rota `templatesQuery.isError`'ı geçirir.

- [ ] **Step 2: Form ekranını yaz**

`template-form-screen.tsx` — iskelet **istisnasız** şudur:

```tsx
    <View style={{ flex: 1, backgroundColor: COLORS.surfaceLight }}>
      <ScreenHeader title={editing ? 'Şablonu düzenle' : 'Yeni şablon'} subtitle={signature} onBack={onBack} />
      <ScrollView style={{ flex: 1, minHeight: 0 }} contentContainerStyle={{ padding: 16, paddingBottom: 20, gap: 12 }}>
        {/* ad kartı · metin kartı · acil kartı · (düzenlemede) sayaç notu */}
      </ScrollView>
      {/* ALTLIK: klavyenin üstünde kalır. `flexShrink: 0` tasarımın ölçülmüş kararıdır;
          kaldırılırsa "Kaydet" klavyenin altında kalır. */}
      <View style={{ flexShrink: 0, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.border,
                     paddingHorizontal: 16, paddingTop: 10, paddingBottom: keyboardOpen ? 10 : 34, flexDirection: 'row', gap: 10 }}>
        <Button label="Vazgeç" onPress={onBack} />
        <Button label={editing ? 'Değişiklikleri kaydet' : 'Şablonu kaydet'} color={brandColor}
                disabled={!ready || pending} onPress={submit} />
      </View>
    </View>
```

`keyboardOpen` React Native'in `Keyboard` olaylarına bağlanır (`keyboardDidShow`/`keyboardDidHide`) — tasarımdaki `onFocus/onBlur` yaklaşımı prototipe özgüdür ve iki alan arasında geçişte yanıp söner. Home-indicator payı 34 → 10px iner (tasarımın ölçüsü).

Ad alanı `maxLength={TEMPLATE_NAME_MAX}` + sayaç `{name.length}/120`; ipucu *"Ad yalnız size görünür; duyurunun başlığı değildir."*; çakışmada `templateNameClash(...)` ile uyarı notu. Metin alanı `multiline`, `maxLength={TEMPLATE_BODY_MAX}`, klavye açıkken minHeight 150, kapalıyken 220. Düzenlemede *"Kullanım sayacı düzenlemede korunur — {usageCount} kez kullanıldı"* notu; bu cümlenin arkasında ölçüm var: `AnnouncementTemplate.Update` `UsageCount`/`LastUsedAt`'e **dokunmaz** (entity docblock'unda yazılı).

- [ ] **Step 3: Silme sheet'ini yaz**

`template-sheets.tsx` içinde `TemplateDeleteSheet`. "Emin misiniz" demez, **ne olacağını** söyler: *"Şablon defterinizden kaldırılır. Bu şablonla daha önce oluşturduğunuz duyurular etkilenmez; onlar bağımsız kayıtlardır ve yayında kalır."* Altında şablonun adı, 3 satır kırpılmış metni ve kullanım özeti.

- [ ] **Step 4: Rotaları kur**

`templates.tsx` mutasyonları bağlar; `templates/new.tsx` ve `templates/[id].tsx` formu açar. Düzenleme rotası şablonu **listeden değil** `useAnnouncementTemplates()` cache'inden `id` ile bulur (Expo Router param'ında nesne taşınmaz).

- [ ] **Step 5: Doğrula — ekranı AÇ ve GÖR**

```bash
npm run typecheck --workspace=mobile && npm run lint --workspace=mobile
```

> **`apps/mobile`'a prettier ÇALIŞTIRMA.**

```bash
npx expo start --web   # apps/mobile içinden; MSW açık
```

Rolü **uygulama içinden** öğretmene çevir (sayfa yenileme rolü yöneticiye düşürür — ölçülmüş tuzak). Şablon oluştur → listede gör; düzenle → sayaç korunsun; sil → onay metnini oku. **Klavye açıkken "Kaydet" düğmesinin görünür kaldığını** ekran görüntüsüyle kanıtla — bu, alt ekran kararının tek ölçülebilir vaadidir. Görüntüleri plan çalışma alanına koy, md5'lerinin ayrı olduğunu doğrula.

> TUZAK: mock modu **native'de kırık**; yalnız `expo --web` çalışır.

- [ ] **Step 6: Commit**

```bash
git add apps/mobile
git commit -m "feat(announcements): mobil sablon crud eklendi ve form alt ekran oldu"
```

---

### Task 15: Öğretmenin şablon girişi ve doğru tohumlama (M-2)

**Files:**
- Modify: `apps/mobile/src/features/announcements/components/teacher-announcements-screen.tsx`
- Modify: `apps/mobile/src/app/(tabs)/my-announcements.tsx`
- Modify: `apps/mobile/src/app/announcements/templates.tsx`
- Modify: `apps/mobile/src/app/announcements/new.tsx`

- [ ] **Step 1: Başlık satırına ikon düğmesi**

`teacher-announcements-screen.tsx` — `onTemplates: () => void` prop'u eklenir ve başlık satırı `flexDirection: 'row'` olur; sağda 44×44 `copy` ikon düğmesi (`accessibilityLabel="Şablonlar"`).

```tsx
/**
 * Şablon girişi başlıkta, yöneticiyle AYNI konumda (tasarım kararı): başlık altına
 * konacak bir giriş kartı, ekranın asıl işi olan duyuru listesini aşağı iter ve her
 * açılışta yer kaplar; şablon ise ancak duyuru yazarken aranır.
 *
 * TASARIMDAN BİLİNÇLİ SAPMA (ölçüldü 2026-08-09): tasarımın `state === 'empty'` kolu
 * doğrudan boş durumu çiziyor ve başlık satırını HİÇ çizmiyor — yani hiç duyurusu
 * olmayan öğretmenin şablon listesine tek girişi kapanıyor. Başlık satırı burada boş
 * durumda da çizilir; bedeli 44px, kazancı özelliğin erişilebilir kalmasıdır.
 */
```

- [ ] **Step 2: Rotayı bağla**

`my-announcements.tsx`: `onTemplates={() => router.push('/announcements/templates')}`.

- [ ] **Step 3: Tohumlamayı düzelt**

`templates.tsx` `onUse`:

```tsx
      onUse={(template) =>
        router.push({
          pathname: '/announcements/new',
          // DÜZELTME (ölçüldü 2026-08-09): eski satır `{ title: template.name, body: … }`
          // idi. Şablon ADI duyurunun başlığı DEĞİLDİR (form ekranının kendi ipucu bunu
          // yazıyor) ve `urgent` hiç taşınmıyordu. Tasarımın kayıt defteri
          // (`proto-app.jsx :: protoScreens()`) `{ body, urgent }` tohumluyor; web
          // tarafı da C5'te aynı hâle geldi.
          params: { body: template.description, urgent: String(template.urgent), templateId: template.id },
        })
      }
```

`new.tsx`: `useLocalSearchParams` artık `{ body, urgent, templateId }` okur; `seed` `{ title: '', body, urgent: urgent === 'true' }` olur ve `templateId` gönderim gövdesine geçer. **`title` parametresi kaldırılır** — başka çağıranı olmadığını `grep -rn "pathname: '/announcements/new'" apps/mobile/src` ile doğrula ve sonucu raporla.

- [ ] **Step 4: Doğrula**

```bash
npm run typecheck --workspace=mobile && npm run lint --workspace=mobile
```

Ekranı aç: öğretmen "Duyurularım" başlığında ikonu gör (hem dolu hem boş listede), bas → şablonlar açılsın, "Bu şablonla oluştur" → **metin alanında şablon gövdesi**, başlık boş, acil işareti şablondaki gibi gelsin. Ekran görüntüsü al.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile
git commit -m "feat(announcements): ogretmenin sablon girisi eklendi ve sablon tohumlamasi duzeltildi"
```

---

### Task 16: Mobil "Şablon olarak kaydet" ve işlem sayfası (M-3, M-4, M-5)

**Files:**
- Modify: `apps/mobile/src/features/announcements/components/compose-screen.tsx`
- Modify: `apps/mobile/src/features/announcements/components/announcement-detail-screen.tsx`
- Modify: `apps/mobile/src/app/announcements/new.tsx`, `apps/mobile/src/app/announcements/[id]/index.tsx`

- [ ] **Step 1: Compose kartı + sheet (M-3)**

Form gövdesinin sonuna (yalnız `mode === 'create'`) 56px yükseklikte bir kart; `body.trim().length < 6` iken kapalı (tasarımın eşiği). Basınca `setSheet('template')` → `SaveAsTemplateSheet`. Sheet tek ad alanı + "Şablona giren" (metin + acil) ve "Şablona girmeyen" (hedef kitle · yayın ve geçerlilik tarihi · ek dosya) özet bloklarını çizer; çakışmada K3 uyarısı.

- [ ] **Step 2: İşlem sayfası (M-4, M-5)**

`announcement-detail-screen.tsx`:
- `Sheet`'in başlığına alt satır eklenir: `sub={statusLabel(row.status) + ' · ' + row.title}` (tasarım her statüde çiziyor, yalnız menü kısaldığında değil).
- Menü `announcementRowActions(row.status)` üzerinden çizilir; `view`/`report` bu ekranda zaten açık olduğu için **çıkarılır** — bu, core kuralını yeniden yazmak değil, çıktısını bu yüzeye uyarlamaktır ve gerekçesi yanına yazılır.
- **"Şablon olarak kaydet"** eylemi eklenir (`saveAsTemplate` → `SaveAsTemplateSheet`, `seedTitle: row.title`, `seedBody: row.body`, `urgent: row.urgent`).
- Alt not `announcementActionNote(row.status)`'tan gelir; `pendingApproval` uyarı tonunda çizilir. Bugün buradaki sabit cümle (*"Duyuru silinemez…"*) **silinir** — artık core'daki dört koldan biri olarak gelir.
- **M-5 bir doğrulama maddesidir:** "Geri çekmeyi iptal et" bu ekranda **zaten var** (`canRestoreAnnouncement` kolu, `RestoreSheet` onayıyla). Uygulayıcı onu **yeniden yazmaz**, yalnız yeni menü üretiminde kaybolmadığını doğrular ve doğrulamayı raporlar.

- [ ] **Step 3: Doğrula**

```bash
npm run typecheck --workspace=mobile && npm run lint --workspace=mobile
```

Ekranı aç: compose'da kart görünsün ve boş metinde kapalı olsun; duyuru detayının işlem sayfasında **beş statüyü de** gez (yayında / zamanlanmış / onay bekliyor / taslak / geri çekildi) ve her birinde menünün ve notun değiştiğini gör. En az iki farklı statünün ekran görüntüsünü al.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile
git commit -m "feat(announcements): mobil sablon olarak kaydet ve statuye gore islem sayfasi"
```

---

# BÖLÜM 6 — KAPANIŞ (Görev 17)

---

### Task 17: Belgeler, spec ve tam doğrulama

**Files:**
- Modify: `oksis/docs/superpowers/specs/2026-08-02-duyurular-uctan-uca-design.md` (§14, §17, K-6 satırı)
- Modify: `oksis/.claude/docs/modules/announcements/permissions.md`
- Modify: `oksis/.claude/docs/modules/announcements/business-rules.md`
- Modify: `oksis/.claude/docs/modules/announcements/completion_status.md`
- Modify: `oksis/.claude/docs/permission-matrix.md`

- [ ] **Step 1: Spec'i düzelt**

- Satır **K-6** (`| K-6 | Şablon CRUD **A'ya dâhil** (3 yeni uç) | DYR-F-13; donmuş 17 uçta şablon salt okunur |`) → gerekçe sütununa şu not eklenir:
  > **C5 düzeltmesi (2026-08-09):** DYR-F-13'ün "yalnız yönetim oluşturur" ifadesi geçersizdir. K1 ile şablon **kişiselleşti**: `announcements.template.manage` öğretmene de verildi, liste `CreatedBy` ile daraltıldı ve Update/Delete sahiplik kapısı aldı.
- §14 tablosundaki **"Şablon CRUD — arayüz"** satırı ✅ **Yapıldı — C5 (2026-08-09)** olarak güncellenir; ölü hook'ların artık canlı olduğu ve ilk çağıranın hangi dosya olduğu yazılır.
- §17'deki **`C4-21`** kaydı ✅ olarak işaretlenir ve kapanış cümlesi eklenir: öğretmen web detayı `teacher-detail.tsx` ile açıldı; `entry` artık öğretmene taşınıyor; DYR-F-18'in kalan ihlali kapandı.
- §17'ye **C5'te ölçülerek eklenen backlog** başlığı açılır ve şunlar yazılır:
  - Red gerekçesi telde bir DTO alanı değildir; istemci onu denetim izindeki iki sabit dizeden okur (`announcementRejection`). Backend metni değiştirirse iki backend testi kırılır ama **istemci sessizce boşalır** — bu bir kırılganlıktır ve ileride `AnnouncementDto`'ya alan eklemek gündeme gelirse ilk aday budur.
  - Şablon `Description` 4000'e çıkarıldı; duyuru `Body` hâlâ **sınırsızdır**. 4000'i aşan bir duyurudan şablon üretmek 400 döner ve istemci bunu `maxLength` ile keser — kayıpsız değildir.
  - Mobil şablon ekranının `readOnly` benzeri bir yetki kapısı yoktur; izin verisi telde var ama okuyan istemci kodu yok (C4 ölçümü hâlâ geçerli). Öğretmene `template.manage` verildiği için bugün bu bir sorun üretmiyor.

- [ ] **Step 2: Modül belgelerini düzelt**

`permissions.md`'de `announcements.template.manage` satırına TEACHER eklenir ve sahiplik kapısının izinden **ayrı** bir katman olduğu yazılır. `business-rules.md`'ye K1–K3 kuralları eklenir. `completion_status.md` C5 ile güncellenir. `permission-matrix.md`'deki duyuru bloğu aynı biçimde düzeltilir.

- [ ] **Step 3: Tam doğrulama**

```bash
# backend
cd /Users/farukkaya/Repositories/oksis-api
export DOTNET_ROOT=$HOME/.dotnet; export PATH=$DOTNET_ROOT:$DOTNET_ROOT/tools:$PATH
dotnet format --verify-no-changes || dotnet format
dotnet build && dotnet test --nologo

# istemci
cd /Users/farukkaya/Repositories/oksis-ui
npm run test --workspace=@workspace/core
npm run test --workspace=@workspace/api
npm run test --workspace=@workspace/api-mocks
npm run typecheck --workspace=web && npm run lint --workspace=web
npm run typecheck --workspace=mobile && npm run lint --workspace=mobile
npm run typecheck --workspace=@workspace/core && npm run lint --workspace=@workspace/core
npm run typecheck --workspace=@workspace/api && npm run lint --workspace=@workspace/api
npm run typecheck --workspace=@workspace/ui && npm run lint --workspace=@workspace/ui
```

Beklenen: backend **0 hata ve > 3345 test**; core > 235, api > 125, api-mocks > 93; altı workspace typecheck + lint temiz. **Sayı yazacaksan çıktıdan SAY.**

- [ ] **Step 4: Commit**

```bash
cd /Users/farukkaya/Repositories/oksis
git add docs .claude
git commit -m "docs(announcements): c5 sablon yonetimi kapanisi ve dyr-f-13 duzeltmesi"
```

- [ ] **Step 5: Dal birleştirme kararını kullanıcıya sor**

C1–C4'te "master'a **yerel** merge, push YOK" seçildi ve dallar silinmedi. **Aynısını varsayma — sor.** Üç depo da (oksis, oksis-api, oksis-ui) aynı kararı paylaşır.

---

## Gözden geçiriciye — her görevde sorulacaklar

Bu faz boyunca en pahalı hata "kod doğru, yanındaki gerekçe ölçülmemiş ve yanlış" oldu. C4'te planın **dört** gerekçesi çürüdü ve ikisi **koruma** vaat ediyordu. Her görev sonunda:

1. **Her nedensellik iddiasını ölç.** "Şu yüzden şu olur" diyen her cümle için: nasıl ölçüldü, çıktı ne? Ölçülmemişse iddiayı sil ya da ölç.
2. **Ekrana yazılan her cümleyi ölç.** "Yalnız siz görürsünüz" cümlesinin arkasında `CreatedBy` süzgeci var mı, mock da aynı mı? "Bu şablonla yayımlanmış duyurular etkilenmez" cümlesinin arkasında FK'sızlık var mı?
3. **Dayanılan dosyanın/prop'un canlı olduğunu ölç.** Import ediliyor mu, çağıranı var mı? (Bu dilim tam da **ölü** üç hook'u canlandırıyor — canlandığını `grep` ile kanıtla.)
4. **Davranışı değişen satırın yanındaki ESKİ gerekçeyi yeniden ölç.** Özellikle: `GetAnnouncementTemplatesQueryHandler`'ın "envanter" doc'u, `templates-tab.tsx`'in "yalnız yönetim oluşturur" şeridi, `templates-screen.tsx`'in aynı cümlesi, `announcements-screen.tsx`'in "öğretmene `entry` taşınmaz" yorumu.
5. **Docblock'ta satır numarası olmasın** — sembol adı olsun.
6. **Sayı varsa say** (`grep -c`, test çıktısı); görüntüden sayı yazılacaksa görüntüden say.
7. **"Bu test şunu korur" iddiasını MUTASYONLA doğrula** ve mutasyonu **kendin seç** — uygulayıcının listesinden değil. Örnek adaylar: `CreatedBy` süzgecini kaldır, `t.Id != request.Id` koşulunu sil, `RegisterUse` çağrısını üç yerden birinden çıkar, `templateNameClash`'in `exceptId` kolunu yok say.
8. **Mobil maddeleri "typecheck geçti" ile kapatma** — ekranı aç ve gör; kanıtlayamadığın şeyi açıkça yaz.
