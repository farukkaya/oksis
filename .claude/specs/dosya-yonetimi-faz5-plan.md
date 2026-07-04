# Dosya Yönetimi Faz 5 Uygulama Planı (Logo Göçü + Web shared/files + Eski Servis Emekliliği + Chrome E2E)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Bağlayıcı: `dosya-yonetimi-spec.md` §9 (eski altyapı emekliliği) + B1 (kod-tarafı sıfır borç). İKİ REPO: oksis-api + oksis-web.

**Goal:** SchoolLogo'yu yeni Documents altyapısına göç ettir, eski `IFileStorageService`/`FileStorageService`/`FileStorageOptions`'ı SİL (B1 sıfır-borç zorunluluğu), web `shared/files` katmanı + `FileUpload` bileşeni + logo ekranı swap, Chrome ile uçtan uca ekran testi.

**Base:** oksis-api master (Faz 4 merge sonrası) + oksis-web master. **Branch'ler:** `feature/dosya-yonetimi-faz5` (her iki repoda).

## Kritik Tasarım Kararı (KTK) — Public Logo Erişimi

**Sorun:** Logo giriş-ÖNCESİ gösterilir (login sayfası branding, davet önizleme `InvitationTokenPreviewDto`, `GetPublicSchoolBrandingQuery`). Yeni Documents `GetFileDownloadUrl` presigned + kısa TTL + `files.download` izinli → anonim/pre-login kullanıcı için ÇALIŞMAZ.

**KARAR (KTK-1):** `SchoolTheme.LogoUrl` string alanı KALIR ama anlamı değişir: artık **stabil public proxy endpoint**'i işaret eder: `GET /api/v1/public/schools/{schoolId}/logo` (AllowAnonymous; tenant param'dan çözülür; okulun aktif SchoolLogo StoredFile'ını bulur, `files` schema global-filter'ı public endpoint'te `IgnoreQueryFilters` + explicit SchoolId eşitliğiyle bypass edilir — SECURITY yorumu; Clean+Active değilse veya yoksa 404/placeholder). Byte'lar API üzerinden proxy stream (2MB logo, presigned gerekmez, HTTP cache'lenebilir, imza sızmaz). SchoolSettings'e `LogoStoredFileId Guid?` eklenir (StoredFile referansı); `LogoUrl` DTO'larda bu StoredFileId'den türetilen stabil public URL olur (StoredFileId null → LogoUrl null).

**Neden bu:** (a) pre-login display çalışır; (b) presigned-anonim ve 24h-TTL-sızıntı sorunlarından kaçınır; (c) admin yönetimi yine `files.*` komutlarını kullanır (upload/attach/delete); (d) tek stabil URL → `<img src>` cache'lenir. Alternatif (presigned uzun-TTL branding response'a gömme) reddedildi: imza sızması + cache kırılması.

**Bu bir spec genişletmesidir** (spec §9 logo göçünü söyler, public erişim mekanizmasını bırakır) — sapma değil, boşluk doldurma; completion_status'a KTK-1 olarak kaydedilir.

## KTK-2 — School yazma-kapsamı (Faz 4 SERT ÖN KOŞUL, bu fazın İLK işi)

Faz 4 final review Important #2: `SchoolEntityScopeResolver` "School"ü tenant içi HER role açar; logo `entityType="School"`'a bağlanınca Student logoyu silebilir/değiştirebilir (spec §4.1.3 ihlali). **Logo swap'tan ÖNCE** guard intent-aware yapılır (Task 1).

## Global Constraints
- Faz 0-4 Global Constraints geçerli (commit + **Fable trailer TAM "Claude Fable 5"**; TDD verbatim; api `src/**` `_camelCase`; `dotnet format` FOREGROUND ~15dk NO watcher; BOM checkout). **Web tarafı:** TS strict, named export, `any` YASAK, server state yalnız React Query, RHF+Zod, i18n key (hardcoded Türkçe YASAK), izin yoksa buton render edilmez.
- **B1 zorunluluğu:** faz sonunda eski `IFileStorageService`+`FileStorageService`+`FileStorageOptions` + appsettings FileStorage bölümü SİLİNMİŞ olacak; grep ile sıfır referans kanıtı.
- Web test: vitest + RTL + MSW (`src/test/setup.ts`, `mswServer.ts` kalıbı). Web run: `npm run dev` (Vite :5173, /api proxy → :5112). E2E login: SchoolAdmin `mudur.s1@oksis.local` / `Oksis1234!`, `/auth/account/login`.
- **Handoff-sadık port kuralı YOK burada** (logo ekranı zaten var — GeneralTab); mevcut UI'ı yeni akışa bağla, bozma.
- **Chrome ekran testi ŞART** (memory feedback_handoff_css_scr_system dersi + kullanıcı sabah ekran testi bekliyor): logo upload→görünüm→sil akışı gerçek tarayıcıda kanıtlanır.

## Keşif Notları
- Eski akış: `UploadSchoolLogoCommand`(Stream,name,ct,size→URL) + `DeleteSchoolLogoCommand`; `SchoolTheme(LogoUrl,FaviconUrl)` VO, `SchoolSettings.UpdateTheme`. Controller `POST/DELETE school-settings/logo`. `IFileStorageService` yalnız 2 logo handler'ında.
- LogoUrl okuyanlar: `SchoolSettingsDetailDto`, `SchoolBrandingDto`/`GetPublicSchoolBrandingQuery`, `InvitationTokenPreviewDto`, web `data.theme.logoUrl` → `<img>`.
- Yeni primitifler: `UploadFileCommand`(...,Category)→StoredFileDto, `AttachFileCommand`(FileId,EntityType,EntityId), `DeleteFileCommand`, `GetFileDownloadUrlQuery`, `ListFilesByEntityQuery`. SchoolLogo kategori registry'de (png/svg 2MB scan=true).
- Guard: `IFileAccessGuard.CanAccessAsync(entityType,entityId,ct)` intent-blind; 5 call site (Attach/Detach/Delete=write, GetDownloadUrl/List=read); `SchoolEntityScopeResolver` tek canlı.
- Web: logo UI `portals/admin/settings/tabs/GeneralTab.tsx` + `useUploadLogo`/`useDeleteLogo` (`school-settings.mutations.ts`, FormData→`/school-settings/logo`). `shared/` var (components/hooks/api/...). FileUpload/dropzone YOK (react-dropzone dep var, kullanılmıyor) — kurulacak. i18n: yeni `files.json` namespace (tr/en) + `ns` array + `resources`. httpClient: `utils/api.ts` FormData algılıyor.

---

### Task 1 (api): FileAccessGuard intent-aware (School write = SchoolAdmin-only) — KTK-2 ön koşulu

**Files:** `IFileAccessGuard.cs` (`CanAccessAsync(string entityType, Guid entityId, FileAccessIntent intent, ct)` + `enum FileAccessIntent { Read, Write }`), `IFileEntityScopeResolver.cs` (`CanAccessAsync(Guid entityId, FileAccessIntent intent, ct)`), `FileAccessGuard.cs`, `SchoolEntityScopeResolver.cs` (Read → `CurrentSchoolId==entityId`; Write → ayrıca `files.delete`/SchoolAdmin rol/izin kontrolü — mevcut `IPermissionReader`/`ICurrentUser` ile; öğrenci/veli/öğretmen Write reddedilir), 5 call site güncelle (Attach/Detach/Delete→Write, GetDownloadUrl/List→Read).
**Test:** guard unit — School Write yalnız SchoolAdmin/izinli geçer, Student/Parent/Teacher Write reddedilir (404), Read tenant-wide geçer; mevcut testler intent parametresiyle güncellenir. Attach/Delete handler testleri: yetkisiz rol School'a yazamaz.
Commit `feat,test`.

### Task 2 (api): SchoolLogo göçü — yeni komutlar + public logo endpoint + StoredFileId

**Files:**
- Domain: `SchoolTheme`'e `LogoStoredFileId Guid?` (veya `SchoolSettings`'e) + `UpdateLogo(Guid? storedFileId)` domain metodu; migration. `LogoUrl` VO'da KALIR (geriye-dönük) veya tamamen StoredFileId'ye taşınır — karar: `LogoStoredFileId` ekle, `LogoUrl` DTO'da türetilir (VO'dan LogoUrl string'i kaldırma opsiyonel; bkz. rapor).
- Yeni: `UploadSchoolLogoCommand`/`DeleteSchoolLogoCommand` handler'ları YENİ altyapıya göçer: Upload → `UploadFileCommand`(SchoolLogo) mediator ile (veya doğrudan servisler) → StoredFile → `AttachFileCommand`("School", SchoolId) → `SchoolSettings.UpdateLogo(storedFileId)`; Delete → mevcut logo StoredFile'ı `DeleteFileCommand` + `UpdateLogo(null)`. Eski `IFileStorageService` çağrıları KALDIRILIR.
- Public endpoint: `PublicSchoolLogoController` (veya mevcut public branding controller) `GET api/v1/public/schools/{schoolId}/logo` `[AllowAnonymous]` → okulun `LogoStoredFileId` Active+Clean StoredFile'ını `IgnoreQueryFilters`+SchoolId eşitliği (SECURITY yorumu) ile bul → `IStorageService.DownloadAsync` proxy stream (Content-Type, Cache-Control) → yoksa 404. Query handler `GetSchoolLogoStreamQuery`.
- DTO/mapping: `SchoolSettingsDetailDto.LogoUrl`, `SchoolBrandingDto.LogoUrl`, `InvitationTokenPreviewDto` → `LogoStoredFileId` varsa stabil URL (`/api/v1/public/schools/{schoolId}/logo`), yoksa null. Tek yardımcı (`ISchoolLogoUrlBuilder` veya mapping helper).
**Test:** upload→attach→settings.LogoStoredFileId set; public endpoint anonim stream (Garage'a karşı entegrasyon — logo yükle, `GET /public/.../logo` 200 + bytes); delete→null+404; DTO LogoUrl türetme unit.
Commit `feat,test`.

### Task 3 (api): Eski servis emekliliği (B1) + tam doğrulama

**Files:** SİL: `IFileStorageService.cs`, `FileStorageService.cs`, `FileStorageOptions.cs`; DI kayıtları (Configure+AddSingleton) kaldır; `appsettings.json` FileStorage bölümü kaldır. Grep ile sıfır referans.
**Test:** tüm süit yeşil (build 0 warning); `grep -rn "IFileStorageService\|FileStorageService\|FileStorageOptions" src` → BOŞ (rapora yapıştır). Migration yoksa yok.
Commit `refactor` (veya `chore`).

### Task 4 (web): shared/files katmanı + FileUpload bileşeni + files i18n

**Files:** `src/shared/components/files/FileUpload.tsx` (react-dropzone ile drag&drop + progress + client policy re-validation; `category`+`entityType`/`entityId` prop; component-rules §17), `src/shared/api/files.api.ts` (upload/initiate/confirm/download-url/list — httpClient/`utils/api.ts` FormData kalıbı), `src/shared/api/files.keys.ts` (`['files', entityType, entityId]` spread kalıbı), `src/shared/hooks/useFileUpload.ts`/`useEntityFiles.ts`, `src/shared/types/files.types.ts` (Zod), `src/shared/i18n/locales/{tr,en}/files.json` + `index.ts` ns/resources kaydı, `file.*` backend hata kodları için i18n girişleri.
**Test:** vitest+MSW — useFileUpload proxy akışı (FormData POST → invalidate), FileUpload bileşeni (drag&drop, boyut/uzantı reddi, progress, izin-yoksa-render-yok). Named export, any yok.
Commit `feat,test`.

### Task 5 (web): Logo ekranı swap + Chrome E2E + Kapanış

**Files:** `GeneralTab.tsx` logo bölümü yeni akışa (yeni `useUploadLogo`/`useDeleteLogo` gerekiyorsa `shared/files` üzerinden veya mevcut `/school-settings/logo` endpoint'i yeni backend'e bağlı olduğundan mutations aynı kalabilir — backend Task 2'de aynı endpoint'i koruduğu için web mutation DEĞİŞMEYEBİLİR; doğrula). `data.theme.logoUrl` artık public proxy URL → `<img src>` çalışır. Eski "IFileStorageService" yorumu temizlenir.
- **Chrome E2E (ŞART):** `npm run dev` + backend :5112 ayakta; login `mudur.s1@oksis.local`/`Oksis1234!` → /admin/settings General → logo yükle (png) → önizleme görünür (public URL'den) → sayfa yenile, logo kalıcı → "Kaldır" → logo gider. GIF/screenshot kanıtı. Konsol hatası YOK.
- **Kapanış (kontrolcü):** completion_status %100 + Faz 5 bloğu + B1 sıfır-borç KANITI (grep boş) + KTK-1/KTK-2 kaydı; `spec §9` "Uygulandı"; final review (fable, her iki repo) → fix'ler → **master merge (iki repo)**; MEMORY + session summary; ADR benzeri kapanış.
**Test:** web vitest tam + Chrome E2E kanıtı (screenshot/gif).
Commit `feat,test` (web) + kapanış commit'leri.

---

## Faz Kapanış Notu
Bu faz bitince: 5/5 faz tamam, kod-tarafı sıfır borç (eski servis SİLİNDİ), logo canlı yeni altyapıda, Chrome'da kanıtlı. Kalan post-MVP borçlar (multipart-abort UploadId kolonu, thumbnail lifecycle, kategori-kota, per-category quota) completion_status'ta izlenir — bunlar B1 "kod-tarafı sıfır borç" tanımının dışında (spec §11 Açık İşler / sonraki modül tüketicileri).
