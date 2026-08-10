# Duyuru — API Kontratları

> Bu modülün dışa açtığı endpoint'ler. Her endpoint için: path, method, permission, amaç.

> Genel API tasarım kuralları için bkz. `backend/api-design-rules.md`.
> Rol → permission matrisi için bkz. `permissions.md` (bu klasörde).

**Bu belge gerçek uç envanterinden yazılmıştır.** Kaynaklar: `AnnouncementsController.cs`,
`AnnouncementTemplatesController.cs`, `src/Oksis.Application/Modules/Announcements/` altındaki
komut/sorgu sınıfları (izin öznitelikleri **komut/sorgu sınıfının** üzerindedir, controller'ın
değil), `PermissionSeedData.cs` / `RolePermissionSeedData.cs` ve üretilmiş istemci sözleşmesi
`oksis-ui/packages/api/src/generated/schema.ts`.

---

## Endpoint Özeti

Toplam **22 operasyon**: 18'i `AnnouncementsController`, 4'ü `AnnouncementTemplatesController`.

### Duyuru yüzeyi (18) — `AnnouncementsController`

| Method | Path | Permission | Amaç |
|---|---|---|---|
| GET | `/api/v1/announcements` | `announcements.view` | Yönetim envanteri; sayfalı liste |
| GET | `/api/v1/announcements/summary` | `announcements.view` | Özet kartı sayaçları (filtreden bağımsız) |
| GET | `/api/v1/announcements/audience` | `announcements.create` | Hedef kitle havuzu (katman → seçenekler) |
| GET | `/api/v1/announcements/inbox` | `announcements.view` | Veli/öğrenci gelen kutusu; sayfalı |
| GET | `/api/v1/announcements/moderation` | `announcements.create` | Okul geneli moderasyon modunu okur |
| PUT | `/api/v1/announcements/moderation` | `announcements.moderate` | Moderasyon modunu değiştirir |
| GET | `/api/v1/announcements/approvals` | `announcements.approve` | Onay kuyruğu |
| GET | `/api/v1/announcements/publishers` | `announcements.view` | Yayınlayan filtresi seçenekleri |
| GET | `/api/v1/announcements/{id}` | `announcements.view` | Duyuru detayı |
| POST | `/api/v1/announcements` | `announcements.create` | Duyuru oluşturur (taslak veya yayın) |
| PUT | `/api/v1/announcements/{id}` | `announcements.update` | Yayın sonrası düzeltme (amend) |
| POST | `/api/v1/announcements/{id}:read` | `announcements.view` | Okundu damgası |
| POST | `/api/v1/announcements/{id}:withdraw` | `announcements.withdraw` | Yayındaki duyuruyu geri çeker |
| POST | `/api/v1/announcements/{id}:restore` | `announcements.withdraw` | Geri çekmeyi geri alır |
| POST | `/api/v1/announcements/{id}:approve` | `announcements.approve` | Onaylar ve yayınlar |
| POST | `/api/v1/announcements/{id}:reject` | `announcements.approve` | Reddeder ve taslağa döndürür |
| GET | `/api/v1/announcements/{id}/audit-trail` | `announcements.report.view` | Değiştirilemez işlem geçmişi |
| GET | `/api/v1/announcements/{id}/delivery-report` | `announcements.report.view` | Gönderim raporu |

### Şablon yüzeyi (4) — `AnnouncementTemplatesController`

| Method | Path | Permission | Amaç |
|---|---|---|---|
| GET | `/api/v1/announcements/templates` | `announcements.view` | Okulun şablon envanteri |
| POST | `/api/v1/announcements/templates` | `announcements.template.manage` | Yeni şablon |
| PUT | `/api/v1/announcements/templates/{id}` | `announcements.template.manage` | Şablonu düzenler |
| DELETE | `/api/v1/announcements/templates/{id}` | `announcements.template.manage` | Şablonu siler |

> Şablonlar **ayrı controller**'dadır (A3 D-1): şablon silinebilir, duyuru silinemez.
> `AnnouncementsController`'ın "hiçbir uç `[HttpDelete]` değil" bekçisi INV-1'in API
> katmanındaki tek otomatik kanıtıdır; şablon silme ucu oraya konsaydı bu bekçi gevşerdi.
> Rota `api/v1/announcements/templates`, `{id:guid}` kısıtıyla çakışmaz — "templates" GUID değildir.

---

## Yaşam Döngüsü Fiilleri ve INV-1

Yaşam döngüsü eylemleri **iki nokta ile** ifade edilir: `{id}:read`, `{id}:withdraw`,
`{id}:restore`, `{id}:approve`, `{id}:reject`. Hepsi `POST`'tur.

- **Generic `PATCH` yoktur.** Modülde tek bir `PATCH` ucu tanımlı değildir.
- **`DELETE /api/v1/announcements/{id}` YOKTUR ve yazılmayacaktır (INV-1).** Duyuru kurumsal
  kayıttır: `Announcement`'ta `Delete()` metodu ve `IsDeleted` alanı yoktur, yapısal koruma
  NetArchTest ile zorlanır. Yanlış duyuru `:withdraw` ile geri çekilir ve arşivde kalır;
  reddedilen duyuru silinmez, taslağa döner.
- Modüldeki **tek** `[HttpDelete]` şablon silmedir
  (`AnnouncementTemplatesController.DeleteAsync`) ve sayısı testle bire sabitlenmiştir.

---

## Permission Kodları

Kanonik **8 anahtar** (`PermissionSeedData.cs`, `ANNOUNCEMENTS` bloğu):

| Kod | Anlam |
|---|---|
| `announcements.view` | Duyuru listesini ve detayını görüntüle |
| `announcements.create` | Duyuru oluştur ve yayınla |
| `announcements.update` | Yayın sonrası düzeltme yap |
| `announcements.withdraw` | Yayındaki duyuruyu geri çek |
| `announcements.approve` | Onay kuyruğundaki duyuruyu onayla / reddet |
| `announcements.moderate` | Okul geneli moderasyon modunu değiştir |
| `announcements.template.manage` | Duyuru şablonu oluştur / düzenle |
| `announcements.report.view` | Gönderim raporu ve denetim izini görüntüle |

**Var olmayan anahtarlar:**

- `announcements.read` / `announcements.manage` — **emekliye ayrıldı** (spec §4). Seed'de yok.
- `announcements.delete` — **hiç doğmadı**; INV-1 ile çelişir.
- `announcements.view-detail` — **hiç doğmadı**; detay ucu `announcements.view` ister.
- Ayrı bir `restore` anahtarı **yoktur**: geri alma, geri çekmenin geri alınmasıdır ve
  `announcements.withdraw` ister.

**İki uç, adının çağrıştırdığından farklı bir anahtar ister** — ikisi de bilinçlidir:

- `GET /moderation` → `announcements.create` (**`moderate` değil**). Öğretmen compose ekranında
  modu okumak zorundadır; `moderate` ile korunsaydı 403 alır, istemci varsayılana düşer ve
  öğretmene "yayınlanacak" denip duyuru onay kuyruğuna düşerdi. Yazma yetkisi yönetimde kalır.
- `GET /audience` → `announcements.create`. Havuz yalnız duyuru yazarken anlamlıdır; alıcı
  sayıları hassas veridir.

---

## Handler'daki Ek Daraltmalar

**İzin anahtarı rolü kapatır, rol içi daraltmayı kapatmaz.** İki katman birbirinin yerine
geçmez. Daraltmalar `AnnouncementCallerResolver` ve `AnnouncementLifecycleGuard` üzerinden
çözülür; **rol kontrolü yapılmaz** — bu depoda `ICurrentUser.Roles` her zaman boştur ve
`IsInRole(...)` ölü koddur. "Yönetim mi" sorusu `announcements.approve` izninden sorulur
(`AnnouncementCallerResolver.IsManagerAsync`).

| Katman | Nerede | Ne yapar |
|---|---|---|
| Envanter kapısı | `AnnouncementCallerResolver.CanUseInventoryAsync` (= `announcements.create`) | `announcements.view` **bugünkü seed'de beş rolde** vardır ama o izin gelen kutusu içindir. Envanter yazanların yüzeyidir. |
| Yayınlayan daraltması | `AnnouncementCallerResolver.ResolveScopedPublisherIdAsync` | Yönetim yetkisi olmayan yayınlayan (öğretmen) yalnız kendi kayıtlarını/kapsamını görür. |
| Kayıt sahipliği | `AnnouncementLifecycleGuard.CanActOn` | `caller.IsManager \|\| announcement.PublisherId == caller.PersonId` — öğretmen yalnız kendi duyurusuna dokunur. |
| Self-only | Gelen kutusu ve okundu damgası handler'ları | Sorgu `AnnouncementRecipient`'tan yürür ve `PersonId` ile kesilir; başkasının satırı **erişilemez**, yalnız gizlenmiş değil. |

Uç bazında:

| Uç | İlan edilen izin | Handler'ın ek daraltması |
|---|---|---|
| `GET /announcements` | `view` | Envanter kapısı; öğretmende varsayılan kapsam `mine`, açık `scope=school` isteği 403 |
| `GET /announcements/summary` | `view` | Listeyle **birebir aynı** kapsam kuralı (aynı kapı, aynı daraltma, aynı 403) |
| `GET /announcements/publishers` | `view` | Envanter kapısı — daraltmasız hâli her veliye tüm personelin adını ve `Person.Id`'sini verirdi (A3 D-2) |
| `GET /announcements/templates` | `view` | Envanter kapısı (ME-1, 2026-08-04) — aynı sızıntı gerekçesi |
| `GET /announcements/moderation` | `create` | Envanter kapısı |
| `GET /announcements/audience` | `create` | Yayınlayan daraltması — öğretmen "tüm okul"u görmez |
| `GET /announcements/{id}` | `view` | Yayınlayan **veya** yönetim tam kaydı görür; değilse alıcı satırı + okuyucuya açık statü şartı, yoksa **404** |
| `GET /announcements/inbox` | `view` | Self-only alıcı eşleşmesi; yalnız `published` + `expired` döner (INV-7) |
| `POST /{id}:read` | `view` | Self-only; alıcı olmayan çağıran **404** alır — "yetkin yok" demek duyurunun varlığını sızdırırdı |
| `PUT /{id}` · `POST /{id}:withdraw` | `update` / `withdraw` | `CanActOn` — öğretmen yalnız kendi kaydı |
| `POST /{id}:restore` | `withdraw` | **Farklı kapı:** yönetim **veya** duyuruyu geri çeken kişi (`announcement.WithdrawnBy == caller.PersonId`) — yayınlayan olmak tek başına yetmez |
| `GET /{id}/audit-trail` · `/delivery-report` | `report.view` | `CanActOn` — öğretmen yalnız kendi duyurusunun raporunu görür |
| `GET /approvals` · `POST /{id}:approve` · `:reject` | `approve` | Handler ayrıca `caller.IsManager` şartı arar |

Seed'de (`RolePermissionSeedData.cs`): `announcements.view` SuperAdmin/SchoolAdmin
katalogunda, ayrıca Teacher, Parent, Student'a açıkça verilir. `create`/`update`/`withdraw`/
`approve`/`moderate`/`template.manage`/`report.view` **katalog dışıdır** ve yalnız
SchoolAdmin'e yazılır; Teacher bunlardan `create`/`update`/`withdraw`/`report.view` alır.

> **DÜZELTME (2026-08-09, C4 kapanışı) — "yedi rol" HEDEF dağılımdı, seed'de BEŞ var.**
> Yukarıdaki tablo "Envanter kapısı" satırında `announcements.view` iznini "yedi rolde"
> diye anlatıyordu. **Nasıl ölçüldü:** `RolePermissionSeedData.Rows()` baştan sona okundu
> ve `AnnouncementsView` satırları sayıldı — **beş**: `SuperAdmin` + `SchoolAdmin`
> (`AllPermissionIds()` kataloğu üzerinden) ve `Teacher` / `Parent` / `Student` (her biri
> kendi bloğunda açık satır). `Secretary` ve `SchoolStaff` **seed'lenmiş rol değildir**
> (dosyanın kendi notları ertelemeyi yazıyor), `VicePrincipal` ve `Counselor` da MVP
> sonrasına ertelendi. Alttaki düzyazı zaten doğruydu; yanlış olan tablo hücresiydi.
>
> **Neden önemli:** bu cümle C4'te *"veli/öğrenci çağrısında uç zaten 403 döner"*
> varsayımına dönüştü ve bir güvenlik gerekçesi olarak kullanıldı. Ölçüldü, yanlış:
> `GetAnnouncementByIdQueryHandler`'da **iki** `Forbidden()` vardır ve ikisi de yetkiyle
> ilgili değildir (tenant çözülemedi · çağıranın `Person` kaydı yok); alıcı olmayan
> çağıran **`NotFound()`** alır. Veli/öğrenci kapıdan geçer ve 200/404 alır — yani
> **yüzey ayrımını sunucu yapmaz, istemci yapar**.
>
> Aynı iddia `oksis-api` docblock'larında hâlâ duruyor (`GetAnnouncementByIdQuery`,
> `GetAnnouncementInboxQuery`) — spec §17, **C4-6**.

---

## C4'ün Getirdiği İstemci Sözleşmesi — Bildirim Yönlendirmesi

Bu bölüm **uç sözleşmesi değildir**: backend'in `Notification.DeepLink` sütununa yazdığı
adreslerin istemci tarafında nasıl yorumlandığını sabitler. Buraya yazılmasının sebebi,
çevirinin **kalıcı** olması: `DeepLink` kalıcı bir sütundur ve yazıldığı anda donar —
sunucu bir deseni sonradan düzeltse bile kutulardaki eski bildirimler eski adresi taşımaya
devam eder. Yani çeviri katmanı geçici bir yama değil, sözleşmenin parçasıdır.

### 1. Backend'in ürettiği adresler — kapalı liste

Bildirim handler'larındaki adres literalleri sayıldı (2026-08-09): **7 desen + `null`**.

| Desen | Nereden | İstemci karşılığı |
|---|---|---|
| `/announcements/{id}` | yayın · düzeltme · geri çekme · onay · zamanlama kolları | Duyuru detayı — **rol duyarlı** |
| `/announcements/{id}/delivery-report` | zamanlanmış yayın bildirimi | **Ayrı hedef değil**: rapor iki uçta da detayın İÇİNDE çizilir (`useDeliveryReport`), aynı detaya çözülür |
| `/announcements/approvals` | onaya gönderim bildirimi | **Rol duyarsız** ayrı kol: web'de rota değil **sekme** (`tab === "queue"`), mobilde `announcements/queue` |
| `/announcements` | red kararı bildirimi (alıcı = yazan öğretmen) | Duyuru **listesi** — rol duyarlı |
| `/attendance` · `/schedule` · `/duties` | Attendance · Timetable · Duties sabitleri | Alan adına çevrilir (bkz. §3) |
| `null` | kayıt yenileme bildirimi | Hedef yok — satır tıklanamaz |

### 2. `NotificationTarget` — dört kol + `null`

`packages/core/src/notifications/logic.ts`:

```ts
type NotificationTarget =
  | { kind: "announcement"; announcementId: string; surface: "reader" | "manager" }
  | { kind: "announcementApprovals" }
  | { kind: "announcementList"; surface: AnnouncementRoleSurface }
  | { kind: "area"; area: NotificationArea }
  | null
```

`resolveNotificationTarget(deepLink, role)` **rolü girdi olarak alır** ve şu sırayla çözer:

1. **Rol yoksa hedef yok.** `role: RoleKey | undefined` ve `if (!role) return null`.
   Gerekçe ölçülmüştür: mobil `useActiveRole` bağlam inmeden `PORTAL_ROLE_FALLBACK`
   (= `"admin"`) döndürüyordu ve o an bildirime dokunan **veli**, `surface: "manager"`
   üzerinden gönderim raporlu yönetim detayına düşüyordu. Yükleniyor hâlinin doğru cevabı
   "yönetici gibi davran" değil, **"henüz gidilecek yer yok"**tur.
2. **Şema ve protokol-göreli adres reddedilir.** Yalnız `/` ile başlayan uygulama-içi
   yollar kabul edilir; `https://`, `oksis://`, `//baska.site` ve eğik çizgisiz yük
   (`announcements/a-1`, `javascript:alert(1)`) `null` döner.
3. **Duyuru kolları rol tablosundan geçer** — bkz. §4.
4. **Kimlik BİÇİME göre süzülür** (`ANNOUNCEMENT_ID_PATTERN`, .NET `Guid.ToString("D")`,
   harf duyarsız). "İkinci segment var" demek yetmez: yoksa `approvals` gibi her yeni
   sözcük sahte bir duyuruya çözülürdü.
5. **Tanınmayan her adres `null` döner.** Sözleşme **kapalıdır**. Ham yolu geçirmek,
   karşılığı olmayan rotada kullanıcıyı 404'e (web) ya da İngilizce "Unmatched Route"a
   (mobil) götürüyordu.

### 3. `NotificationArea` — duyuru dışı adresler

Ham yolu taşımak yetmez, çünkü **iki uygulamanın rota envanteri aynı değil**:

| alan | backend deseni | web rotası | mobil rotası |
|---|---|---|---|
| `attendance` | `/attendance` | `/attendance` | `/attendance` |
| `timetable` | `/schedule` | `/schedule` | **YOK** |
| `duties` | `/duties` | **`/duty`** (tekil!) | **YOK** |

Her uygulama alan adından kendi rotasını üretir; karşılığı yoksa satırı **tıklanamaz**
bırakır. Eşleme `Record` olarak **total**dır — core'a yeni bir alan eklenirse iki uygulama
da derlenmez, yani sessizce eksik eşleme kalamaz.

### 4. `announcementRoleSurface` — rol → duyuru yüzeyi, TEK tablo

`packages/core/src/announcements/logic.ts`. Hem duyuru **detayının** (okuyucu mu, yöneten
mi) hem duyuru **listesinin** hangi ekrana çözüleceğini belirleyen tek kaynak; iki kol
ayrışamaz.

| rol | yüzey | web | mobil |
|---|---|---|---|
| `admin` | `manage` | yönetim konsolu | `(tabs)/announcements` |
| `teacher` | `authored` | "Duyurularım" | `(tabs)/my-announcements` |
| `student` · `parent` | `inbox` | **YOK** — "şu an mobil uygulamada" (spec K-7) | `(tabs)/announcements-inbox` |

Detay kolunda `surface: inbox → "reader"`, diğerleri → `"manager"`. Okuyucu ekranında
gönderim raporu, denetim izi ve "Geri çek" **yoktur**; yönetim detayında vardır.

⚠️ Öğretmen bir duyurunun **alıcısı** olduğunda da `"manager"` alır ve bu bugün bilinen
bir kusurdur — spec §17, açık ürün kararı **I-2**.

### 5. `shouldSaveModerationChange` — yazma kararı core'da

`shouldSaveModerationChange(next, current)` moderasyon modunun **kaydedilip
kaydedilmeyeceğine** karar verir; seçili moda dokunmak uca istek göndermez.

Kural core'a taşındı çünkü **üç yazma yüzeyi** (web Ayarlar › Bildirimler, web Duyurular ›
Moderasyon, mobil Bildirim Ayarları) onu üç ayrı biçimde tekrarlıyordu ve hiçbirinin testi
yoktu. Merkezileştirme **üçüncü yüzeyde gerçek bir hata buldu**: `announcements-page.tsx`in
`onChange`'i koşulsuz `mutate` çağırıyordu ve oradaki `disabled` yalnız görsel bir
affordance'tı, kararı korumuyordu. Yüklem başarı kolunda `qk.announcements.all()` **kök**
anahtarını invalide ettiği için, görünürde hiçbir şey değişmezken bütün duyuru sorguları
yeniden çekiliyordu.

Bugün `disabled` prop'u da **aynı yüklemi** okur — görsel affordance ile gerçek karar
ayrışamaz. Mod etiketleri de core'dadır (`announcementModerationLabel`), böylece
"(varsayılan)" niteleyicisi üç yüzeyde tutarlıdır.

> **Kapı hatırlatması:** okuma ucu `announcements.create`, yazma ucu
> `announcements.moderate` ister (bkz. yukarıdaki "İki uç, adının çağrıştırdığından farklı
> bir anahtar ister"). Sayıldı: `create` → **2 rol** (SchoolAdmin, Teacher — SuperAdmin'de
> **yok**), `moderate` → **1 rol** (SchoolAdmin). Yani **öğretmen kartı görür ama
> kaydedemez**; istemci kapısı okumaya değil **yazmaya** konmalıdır. "Okuma çağrısının
> 403'ü kartı kendiliğinden kapatır" varsayımı ölçümde çürüdü.

---

## Gövde ve Dönüş Tipleri

Zarf her uçta `ApiResponse<T>`'tir (tek istisna: şablon silme **204 No Content**).
Başarılı yazma uçları **200 döner, 201 değil** — `ToHttpResult` başarılı `Result<T>`'yi 200'e
eşler ve ilan bunu olduğu gibi söyler (üretilmiş OpenAPI kontrat-senkron frontend'i besler).

| Uç | Gövde tipi | Dönüş tipi |
|---|---|---|
| `GET /announcements` | — | `PagedResult<AnnouncementDto>` |
| `GET /announcements/inbox` | — | `PagedResult<AnnouncementDto>` |
| `GET /announcements/summary` | — | `AnnouncementSummaryDto` |
| `GET /announcements/audience` | — | `AudiencePoolDto` |
| `GET\|PUT /announcements/moderation` | `UpdateModerationRequestBody` (yalnız PUT) | `AnnouncementModerationDto` |
| `GET /announcements/approvals` | — | `IReadOnlyList<AnnouncementDto>` |
| `GET /announcements/publishers` | — | `IReadOnlyList<AnnouncementPublisherDto>` |
| `GET /announcements/{id}` | — | `AnnouncementDto` |
| `POST /announcements` | `CreateAnnouncementCommand` | `AnnouncementDto` |
| `PUT /announcements/{id}` | `AmendAnnouncementRequestBody` | `AnnouncementDto` |
| `POST /{id}:read` · `:restore` · `:approve` | gövdesiz | `AnnouncementDto` |
| `POST /{id}:withdraw` · `:reject` | `AnnouncementReasonRequestBody` | `AnnouncementDto` |
| `GET /{id}/audit-trail` | — | `IReadOnlyList<AnnouncementAuditEntryDto>` |
| `GET /{id}/delivery-report` | — | `DeliveryReportDto` |
| `GET /templates` | — | `IReadOnlyList<AnnouncementTemplateDto>` |
| `POST /templates` | `CreateAnnouncementTemplateCommand` | `AnnouncementTemplateDto` |
| `PUT /templates/{id}` | `UpdateAnnouncementTemplateRequestBody` | `AnnouncementTemplateDto` |
| `DELETE /templates/{id}` | — | 204, gövdesiz |

Gövde kayıtlarında **`id` yoktur** — rotadan gelir. Komut kaydını doğrudan `[FromBody]` ile
bağlamak üretilmiş OpenAPI'ye gövdede olmayan bir `id` alanı yazar ve kontrat drift'i üretirdi.
`:withdraw` ve `:reject` **aynı** gövde şeklini kullanır (`AnnouncementReasonRequestBody`).

`PUT /announcements/{id}` gövdesi **hedef taşımaz (INV-2)**: `title`, `body`, `silent`. Alıcı
listesi yayın anında donar; hedefi yanlış seçilmiş duyuru geri çekilip yeniden yayınlanır.

Enum alanları telde **string anahtardır** (`AnnouncementEnumWire`): statü
`draft` · `scheduled` · `pendingApproval` · `published` · `expired` · `withdrawn` · `archived`;
tür `institutional` · `classroom`; erişim `schoolWide` · `classScoped`; kanal
`inApp` · `push` · `email`; moderasyon modu `open` · `thresholded`.

`PagedResult<T>` alanları: `items`, `page`, `pageSize`, `totalCount`, `totalPages`,
`hasPreviousPage`, `hasNextPage`.

---

## C2'nin Getirdiği Sözleşme Değişiklikleri

### 1. Liste ucu çoklu `status` alır

`GET /api/v1/announcements` artık `?status=a&status=b` biçiminde **dizi** bağlar
(`GetAnnouncementsQuery.Statuses`). Tek değer gönderen eski istemci tek elemanlı dizi olarak
bağlanır — kırılma yok. Boş liste "hiçbiri eşleşmesin" değil **"filtre yok"** demektir.

Gerekçe: "Son 30 günde yayınlanan" özet kartı üç statüyü birden kapsar
(`published`/`withdrawn`/`expired`) ve tek değerli bir filtreyle sunucuya taşınamazdı.

### 2. Gelen kutusu sayfalı

`GET /api/v1/announcements/inbox` artık `page` / `pageSize` alır ve düz liste yerine
`PagedResult<AnnouncementDto>` döner. Eskiden ne istemci ne sunucu `Take` uyguluyordu; üç
yıllık geçmişi olan bir veli tüm gelen kutusunu tek istekte çekiyordu.

Sayfalama sabitleri envanterle **aynıdır**: varsayılan boy 50, üst sınır 200
(`DefaultPageSize` / `MaxPageSize`, iki handler'da da aynı değer). `pageSize` sunucuda
`Math.Clamp` ile kırpılır; `page` verilmezse 1.

### 3. `summary` ucu eklendi

`GET /api/v1/announcements/summary` özet kartı sayaçlarını döndürür:
`published`, `scheduled`, `draft`, `last30` (published + withdrawn + expired, son 30 gün),
`urgentThisMonth`.

**Filtre parametresi almaz** — yalnız `scope`. Kart bir filtre *kısayoludur*, filtrenin sonucu
değil; seçili filtreye göre daralan bir sayaç kendi kısayolunu anlamsız kılardı. Kapsam kuralı
`GET /announcements` ile birebir aynıdır: kartlarla listenin farklı kapsamlara bakması,
kullanıcıya "12 yayında" deyip 3 satır göstermek demektir.

---

## C3'ün Getirdiği Sözleşme Değişiklikleri — Ek Dosya

Duyurunun **en fazla bir** eki olur (`Announcement.AttachmentFileId` tekil kolondur).
Yükleme ve indirme uçları bu modülde **değil**, Documents modülündedir; duyuru yüzeyi
onlara yalnız bir kimlikle bağlanır.

### 1. Yükleme tek adımlıdır (proxy)

`POST /api/v1/files` — multipart gövde (`[FromForm] IFormFile file` + `[FromForm] string
category`), `category` sabittir: `AnnouncementAttachment`. Uç `StoredFileDto` döner ve
istemci yalnız `fileId`'yi taşır.

**Presigned üç adımlı akış (`/files/initiate` → depoya PUT → `/files/{id}/confirm`)
kullanılmaz.** `FileCategoryPolicyRegistry`'de `AnnouncementAttachment` politikası
`ForcePresigned: false`, `AllowMultipart: false`, üst sınır **10 MB** ilan eder; proxy
yolu `ForcePresigned || boyut > 25 MB` olduğunda kapanır, bu kategori o eşiğin altındadır.

### 2. Bağı backend yazar — istemci `attach` çağırmaz

Dönen kimlik `POST /api/v1/announcements` gövdesinde `attachmentFileId` olarak gider.
`CreateAnnouncementCommandHandler` bağı **iki yere birden** yazar — köke
(`Announcement.AttachFile`) ve Documents'in `FileAttachment` tablosuna — ikisi de aynı
transaction'dadır.

❌ İstemci **`POST /api/v1/files/{id}/attach` çağırmaz**: ikinci bir çağrı çift bağ satırı
üretir. `IFileAccessGuard` kapsamı dosyanın bağlarından okuduğu için çift satır erişim
kararını da bulanıklaştırırdı.

### 3. `AnnouncementAttachmentDto`'ya `fileId` eklendi

`url` alanı **bir dosya değildir** — indirme ucunun göreli yoludur
(`/api/v1/files/{id}/download-url`, `GetAnnouncementByIdQueryHandler.LoadAttachmentAsync`
içinde dize interpolasyonuyla kurulur). O uç `[Authorize]`'dır ve JSON zarfı döner, yani
`<a href>` ile açılamaz. Yolun biçimi **tel sözleşmesinde tanımlı değildir** (üretilen
şemada düz `string`); istemci yolu ayrıştırmaz, `fileId` ile indirmeyi kendisi başlatır.

### 4. İndirme: kısa ömürlü adres, taranmamış dosyada 409

`GET /api/v1/files/{id}/download-url` → zarf içinde `url` + `ttlMinutes` (bugün **10 dk**,
`GetFileDownloadUrlQueryHandler.TtlMinutes`). Adres presigned'dır ve imzalı query'sinde
`Content-Disposition: attachment` taşır.

`AnnouncementAttachment` politikası `RequiresVirusScan: true` olduğu için dosya
**karantinada doğar** (`Quarantined`/`Pending`) — yükleme yanıtı hiçbir zaman `Clean`
taşımaz, tarama commit sonrasına kuyruklanır. Tarama bitene kadar indirme
**409 `FILES_NOT_SCANNED`** döner (`file.CanBeDownloaded` false → `FilesErrors.NotScanned`).
Bu, ek dosya akışının en sık görülen geçici hata dalıdır ve arayüz onu gizlemez.

Kısa ömürlü adres **hiçbir state'e girmez ve loglanmaz** —
`dosya-yonetimi-spec.md` §5.3 madde 3 (istemci) ve §8.2 "KURAL — Redaction" (sunucu).
İndirme için TanStack Query hook'u bilinçli olarak yazılmadı: önbelleğe alınan adres
ikinci tıklamada süresi dolmuş bir bağlantı açardı.

### 5. Ek yalnız detay ucunda dolar

`AnnouncementDto.Attachment` **yalnız `GET /announcements/{id}`** yolunda doldurulur.
Liste uçları (`GET /announcements`, `/inbox`, `/approvals`) ve yaşam döngüsü uçları
(`:read`, `:withdraw`, `:approve`, …) `AnnouncementMapper.ToDto`'ya `attachment`
**geçmez**, yani alan `null` döner. İstemci detayı bir yaşam döngüsü yanıtından yeniden
render **etmemelidir** — ek kaybolur.

Sonucu: **liste satırlarındaki ataç rozeti üretimde hiç görünmez** (yalnız mock'ta
görünür). Ayrıntı ve düzeltme yolu için bkz. spec §17, C3 tablosu (C3-1).

### 6. Mobilde yalnız görsel eklenebilir

Mobil compose ekranı eki `expo-image-picker` ile (`mediaTypes: ['images']`) alır; yani
**yalnız `jpg` / `png`**. `pdf` politikada izinlidir ama mobilden **seçilemez**:
`expo-document-picker` paketi depoda yoktur (hiçbir `package.json`'da geçmez) ve
eklenmesi **native yeniden derleme** gerektirir — C3 kapsamı dışında bırakıldı, backlog'a
alındı (spec §17, C3-2).

Sınır ekranda **açıkça** yazılır, sessizce geçilmez: *"Mobilden yalnız fotoğraf
eklenebilir — .jpg ya da .png biçiminde, en fazla 10 MB. PDF eklemek için web arayüzünü
kullanın."* Cümledeki uzantılar ve MB `packages/core` sabitlerinden türetilir, elle
yazılmaz — bayatlayamazlar.

**İstemci ön elemesi backend'le birebirdir**, gevşek değildir:
`ANNOUNCEMENT_ATTACHMENT_EXTENSIONS = ["pdf", "jpg", "png"]`. `jpeg` bilinçli olarak
**yoktur** — `UploadFileCommandHandler` uzantı ile content-type'ı **ayrı ayrı** arar
(`!ExtensionAllowed(...) || !ContentTypeAllowed(...)`), dolayısıyla `image/jpeg` MIME'ıyla
gelen bir `.jpeg` dosyası uzantıdan düşer. Ön elemede geçirmek reddi ortadan kaldırmaz,
yalnız 10 MB yüklendikten **sonraya** erteler.

---

## Bilinen Sınırlar

Ölçülmüş ve bilinçli olarak kayda geçmiş sınırlar:

| Sınır | Ayrıntı |
|---|---|
| Sunucu aramasında **aksan katlaması yok** | `?q=` kalıbı depo genelindeki `ToLower()` + `LIKE` kalıbıdır (`ListStudentsQueryHandler` emsali). İstemcideki `foldTurkish` katlaması (ş→s, ğ→g) sunucuya **devralınmadı** ve kullanıcıya hiçbir yerde bildirilmiyor. |
| Bozuk enum değeri **400 değil 500** | `?status=zirva` / `?type=zirva` → `AnnouncementEnumWire.ParseStatus`/`ParseType` `ArgumentOutOfRangeException` fırlatır. Değersiz elemanlar (`?status=` → tek elemanlı null dizi) ayıklanır, ama **bilinmeyen** bir değer hâlâ fırlatır. |
| `?page` taşması **envanterde 500** | `GetAnnouncementsQueryHandler`'da `.Skip((page - 1) * pageSize)` `int` aritmetiğinde sessizce taşar ve negatif OFFSET üretir; SQL Server bunu reddeder. **Gelen kutusunda düzeltildi**: `GetAnnouncementInboxQueryHandler` `skip`'i `long` üzerinden hesaplar ve `int.MaxValue`'ya kırpar (patolojik girdinin doğru yanıtı hata değil, boş sayfa). |
| Gönderim raporunda **kanal kırılımı tek satır** | `DeliveryReportDto.Channels` yalnız `inApp` döner: sunucuda kayıtlı tek `INotificationChannel` odur. Gerçek kırılım teslim kanallarıyla (D fazı) gelecek. |
| Ulaşılamayan alıcı listesi **kırpılır** | `DeliveryReportDto.Unreachable` en çok `UnreachableLimit` (100) satır döner (A3 D-4); kesin sayı `Total - Reached` ile türetilir. |
| Liste uçlarında **ek bilgisi yok** | `AnnouncementDto.Attachment` yalnız `GET /announcements/{id}`'de dolar; üç liste ucu da `null` döner. Arayüzdeki ataç rozeti bu yüzden üretimde hiç görünmez (C3 §5). |
| Mobilden **PDF eklenemez** | Ek seçici `expo-image-picker`'dır; `expo-document-picker` depoda yoktur ve eklenmesi native yeniden derleme ister (C3 §6). Politika pdf'i kabul eder, mobil ekran seçtiremez. |

---

## Yasaklar

- ❌ `DELETE /api/v1/announcements/{id}` — INV-1, hiç yazılmadı ve yazılmayacak.
- ❌ Generic `PATCH` — yaşam döngüsü fiilleri iki nokta ile (`{id}:withdraw`).
- ❌ `announcements.delete` / `announcements.view-detail` / `announcements.read` /
  `announcements.manage` — bu anahtarlar yok.
- ❌ `PUT /{id}` gövdesine hedef alanı eklemek — INV-2.
- ❌ Gövdeye `id` koymak — rotadan gelir, aksi hâlde OpenAPI drift'i.
- ❌ Snake_case path — kebab-case.
- ❌ Inconsistent envelope — her yanıt `ApiResponse<T>` (şablon silme 204 hariç).

> Detay: `backend/api-design-rules.md`.
