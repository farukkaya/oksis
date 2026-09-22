# K-28 · Kurum Yetkilisi — uygulama planı

> **Ne bu dosya:** `K-28 (a)` kararının uygulama planı. 2026-09-16 gece düzeltme turunda
> **salt okuma** ölçümüyle çıkarıldı; kod yazılmadı. Kapattığı maddeler: `TB-171`, `TB-165`, `TB-172`.
> Karar metni: [[OKSİS - Yapısal Kararlar ve Eksikler]] `K-28`.
> **Durum:** ✅ **TAMAMLANDI.** Adım 1–2 2026-09-16'da, Adım 3–8 2026-09-22'de uygulandı.
> Kapanış kanıtı: [[OKSİS - Bulgu Arşivi]] §52. Plan artık tarihsel kayıttır.
>
> **Planın iki varsayımı uygulamada değişti:**
> 1. *Yetkili ad + e-posta zorunlu* → kullanıcı kuralı **"DB'de zorunlu alanlar formda da
>    zorunlu olsun"**; ölçüm künye kolonlarının hepsinin nullable olduğunu gösterdi, bu yüzden
>    **hiçbir yeni alan zorunlu değil**.
> 2. *Liste DTO'su + satır içi düzenleme* → yerine ayrı `GET platform/schools/{id}` künye ucu
>    ve üç adımlı sihirbaz. Gerekçe: alan sayısı 16'ya çıkınca satır içi düzenleme okunmaz olurdu.
>
> Ayrıca kapsam kullanıcı talebiyle büyüdü: yalnız yetkili değil, **kurum kimliği ve iletişim
> bilgileri de** açılışta soruluyor.

## Karar

Kurum yetkilisini **platform açılışta sorar**, sonradan **platform düzenler**, okul müdürü **yalnız görür**.

## Ölçüm özeti (planın dayandığı kod gerçekleri)

| Gerçek | Yer |
|---|---|
| `CreateSchoolCommand` yetkili sormuyor (7 alan: ad, kod, tür, tz, müdür ad/soyad/e-posta) | `Modules/Platform/Commands/CreateSchool/` |
| `display_name` NULL kalıyor — handler `displayName: null` geçiyor | `CreateSchoolCommandHandler` |
| `PlatformSchoolsController` yalnız `GET ""` + `POST ""` taşıyor | `Api/Controllers/V1/` |
| K5 ucu `PUT school-settings/authority`, izin `school-settings.manage-authority`, yalnız `SUPER_ADMIN`'de | `RolePermissionSeedData:109-111` |
| **`School.Code` `nvarchar(max)`** — SQL Server üstüne tekil indeks kuramaz, önce daraltma şart | `OksisDbContextModelSnapshot` |
| `school.schools` tablosunda `is_deleted` **yok** → indeks süzgeçsiz olacak | — |
| `School` için ayrı `IEntityTypeConfiguration` yok, yapılandırma `OnModelCreating` içinde satır içi | `OksisDbContext` |
| Platform komutları `[RequirePermission]` taşımıyor; kapı `TenantContextBehavior`'ın `PlatformOnly` kolu | `AuthorizationBehavior` izin listesi boşsa `next()` |

## Adımlar

### 1 · `TB-172`: okul kodu tekil indeksi — S, bağımsız
- `OksisDbContext`'teki satır içi `School` bloğuna `HasMaxLength(50)` + `HasIndex(Code).IsUnique()`, indeks adı `ux_schools_code`.
- Yeni `Modules/Schools/Common/SchoolCodeIndex.cs` — `BellScheduleIndex` kalıbı (ihlal **indeks adından** tanınır, 2601/2627 sayısından değil).
- Göç: `AlterColumn` (max → 50) **sonra** `CreateIndex`; başına savunma sorgusu (uzun ya da yinelenen kod varsa `RAISERROR` ile dur — saha testinde kod elle değiştirilmişti).
- `CreateSchoolCommandHandler`: ön denetim kalır; **ilk** `SaveChangesAsync` `DbUpdateException` yakalar ve aynı `PLATFORM_SCHOOL_CODE_DUPLICATE` koduna eşler.
- Test: entegrasyonda ikinci aynı kod → ihlal; handler'da yarış kolu 409 döner, 500 değil.

### 2 · `display_name` tohumu + backfill — S, bağımsız
- Handler `displayName: school.Name` geçsin.
- Veri göçü (emsal: `20260916004157_…notification_config_seed_backfill`): `display_name IS NULL` olan ayar satırlarını okul adıyla doldur. Müdürün yazdığı ad **ezilmez**.

### 3 · Açılış formu yetkiliyi sorar — S/M
- `CreateSchoolCommand` + `AuthorityFullName`, `AuthorityTitle`, `AuthorityEmail`; handler `settings.UpdateAuthority(...)`.
- **Varsayım:** ad soyad + e-posta **zorunlu**, unvan isteğe bağlı; zorlama yalnız validator'da, domain ve kolonlar nullable kalır → **göç gerekmez**, tersine dönüş tek satır.

### 4 · Platformda sonradan düzenleme ucu — M
- Yeni `Modules/Platform/Commands/UpdateSchoolAuthority/` (`[Tenancy(PlatformOnly)]`, `[RequirePermission]` **yok**).
- Handler: okul var mı (yoksa `NotFound` → 404; **`PLATFORM_` önekli kod kullanma**, `ResultExtensions` onu 422'ye düşürüyor) → `tenant.SetForLoginFlow(schoolId)` → ayar satırı → `UpdateAuthority` → `SaveChanges` → `school-settings` önbelleğini temizle.
- `PlatformSchoolListItemDto` + üç yetkili alanı (ayrı detay ucu açma).
- `PUT platform/schools/{id}/authority`.

### 5 · K5 ucunun ve iznin emekliliği — M, 4'ten sonra
- **Uç ve izin SİLİNİR; 410/403 tombstone yazılmaz.** Gerekçe: depo emsali (`POST users/import` emekliliği aynen silinmişti), `410` bu depoda **veri ömrü** semantiğine ayrılmış, ve `TB-165` ucun bugün zaten çağrılamadığını ölçtü.
- Silinecek: controller aksiyonu, `Modules/Schools/Commands/UpdateSchoolAuthority/`, testi, `PermissionSeedData` satırı, `MasterSeedIds` GUID'i, `RolePermissionSeedData` eşlemesi.
- Kalan: `SchoolSettings.UpdateAuthority` (artık platform çağırıyor), okuma yolu ve müdürün salt-okunur kartı.
- Göç: `DeleteData` role_permission `516b702a-…` + permission `a0e409f4-…`; `Down()` geri yazar. Adım 1'in şema göçüyle **karıştırma**.

### 6 · Web platform ekranı — M, 3+4 ve codegen'den sonra
- `npm run codegen -w packages/api` (API 5112'de ayakta olmalı; codegen tüm dosyayı yeniden yazar, `prettier --write` ile depo stiline döndür).
- Açılış formuna "Kurum yetkilisi" alanları, liste tablosuna sütun ve satır içi düzenleme (`pf-*` stilleri hazır).

### 7 · Salt-okunur metinler + ölü sözleşme temizliği — S
- `packages/api` `updateAuthority` / `useUpdateAuthority` ve `packages/core` `UpdateAuthorityInput` silinir (çağıran yok; codegen sonrası tip sistemi zaten zorlar).
- `general-tab.tsx` kilit ipucu → "Kurum yetkilisini OKSİS platformu düzenler", rozet koşulsuz; mobil `school-identity-screen` aynı cümle.

### 8 · Belge kapanışı — S
- Defterde `TB-171`, `TB-172` kapanır; `TB-165` **not düşülerek** kapanır (aşağıya bak). `K-28` panosu ✅.
- `domain/moduller/Okul Yönetimi.md` yetki cümlesinden `manage-authority` çıkar (`domain-map`).

## `TB-165` nasıl kapanıyor

Erişilemez uç, erişim açıldığı için değil, **ortadan kalktığı için** kapanıyor: izin de onu isteyen komut da siliniyor, yetenek platform yüzeyine taşınıyor ve orada izin çözümü hiç kullanılmıyor.

**`AccountPermissionResolver.MapProfileToPortal` bu turda DEĞİŞMEMELİ.** Okul oturumunda platform rolünün izinlerinin elenmesi doğru; platform isteği bu çözücüden hiç geçmiyor. Ama boşluk yok olmuyor, **erteleniyor**: `0019`'un üç platform rolü gerçek izin denetimi isteyince platform tarafına ayrı bir izin çözücü gerekecek. Bu yüzden portal süzgecinin `Platform` körlüğü, `TB-165` kapanırken **ayrı bir satır** olarak defterde yaşatılmalı.

## Sözleşme değişiklikleri

| Yüzey | Değişiklik | Kırıcı mı |
|---|---|---|
| `POST platform/schools` | Gövdeye üç yetkili alanı (ikisi zorunlu) | **Evet** — tek çağıran web formu, aynı turda güncelleniyor |
| `GET platform/schools` | DTO + üç alan | Hayır (additive) |
| `PUT platform/schools/{id}/authority` | **Yeni** | Hayır |
| `PUT school-settings/authority` | **Kaldırıldı** | Teoride evet, pratikte çağıranı yok (`TB-165`) |
| `GET school-settings` → `SchoolAuthorityDto` | Değişmiyor | — |

Mobil yalnız okuyor → tek dokunuş bilgi notu metni.

## Riskler

1. **`nvarchar(max)` tuzağı:** kolon daraltılmadan `CreateIndex` üretilirse göç üretimde patlar; kirli veri varsa `AlterColumn` düşer (savunma sorgusu bu yüzden var).
2. `SchoolSettingsControllerTests` uç sayımı **42 → 41** (bilinçli güncelleme).
3. `MasterRoleSeedTests` **kırılmaz ama bayatlar** — `superAdminOnlyCodes`'tan `school-settings.manage-authority` ve iki gerekçe yorumu temizlenmeli, yoksa bekçi kaldırılmış bir kuralı savunur gibi okunur.
4. Seed: `permissions` −1, `role_permissions` −1, model snapshot yeniden üretilir.
5. `CreateSchoolCommandHandler` üç kez kaydediyor → yakalama **yalnız ilk** `SaveChangesAsync` çevresinde olmalı.
6. Adım 4'te `SetForLoginFlow` yerine `IgnoreQueryFilters` ile güncelleme denenirse `TenantSaveChangesInterceptor` reddedebilir ve önbellek anahtarının tenant öneki yanlış okula çözülür.
7. Altınay'ın boş yetkilisi göçle **dolmaz**; platform ekranından elle doldurulacak.

## Uygulama sırasında doğrulanacak iki nokta

- `TransactionBehavior` başarısız `Result` dönüşünde işlemi geri sarıyor mu (Adım 1'in catch kolu buna dayanıyor).
- `TenantSaveChangesInterceptor`, `SetForLoginFlow` ile kurulmuş bağlamda **mevcut** bir satırın güncellenmesine izin veriyor mu (bugünkü emsal yalnız yeni satır ekliyor).

## Kullanıcıya sorulacak açık sorular (uygulama varsayımıyla)

| # | Soru | Varsayım |
|---|---|---|
| 1 | Yetkili zorunlu mu | Ad + e-posta zorunlu, unvan isteğe bağlı |
| 2 | "Müdürle aynı kişi" kısayolu | Bu turda yok — yetkili müdür değildir, kısayol yanlış veriyi kolaylaştırır |
| 3 | Görünen ad tohumu | Evet, okul adından; NULL satırlar backfill |
| 4 | Emeklilik yolu | Uç + izin silinir |
| 5 | Platform düzenleme yüzeyi | Liste DTO'su + satır içi düzenleme |
| 6 | Platform okulun adını/kodunu da düzenlesin mi | Hayır, ayrı karar |
| 7 | Yetkili e-postası doğrulansın/bildirim alsın mı | Kapsam dışı — bugün bu adrese hiçbir şey gitmiyor, oysa ekran "resmî yazışma kopyaları buraya gider" diyor (**ayrı bulgu adayı**) |

## Boyut

Toplam **M–L**. Önerilen sıra: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8.
Sevk paketleri: **1**, **2**, **3+4+6** (sözleşme + codegen birlikte), **5+7**, **8**.
