# OKSİS — Bulgu Kapanış Turu · Bug-Fix Teknik Analizi

> **Tarih:** 2026-08-31 · **Damgalar:** `oksis-api` @ `7060820` (master) · `oksis-ui` @ `42f29cb` (master)
> **Kaynak:** [[OKSİS - Bulgu Kayıt Defteri]] (2026-08-30 düzenlemesi, 50 açık madde) + bu analiz için
> yapılan iki depolu kod doğrulaması (2026-08-31). Defterdeki her iddia koddan yeniden ölçüldü;
> **sapmalar §0.2'de**.
> **Kapsam:** İş sıralamasının A–D blokları — karar gerektirmeden bugün yazılabilecek 13 düzeltme.
> Karar bekleyen maddeler (E bloğu) ve modül-öncesi ön koşullar (F bloğu) **kapsam dışı**, §14'te listeli.

---

## 0. Sıralama ve kapsam

| Blok | Sıra | Madde | Katman | Neden bu sırada |
|---|---|---|---|---|
| **A — bloke edici** | 1 | `TB-99` kalıntısı | FE | Yazma ayağı kapanmış (bkz. §0.2); kalan tek görünür kusur küçük |
| | 2 | `E-21` | FE | Kulüp Taslak hapsinde; BE hazır, yalnız düğme eksik |
| | 3 | `B-43` | FE | Sessiz veri kaybı; E-21 ile aynı form yüzeyi |
| | 4 | `B-49` | FE | 1 satır; velilere uydurma gerekçe gitmesin |
| **B — kulüp akışı** | 5 | `X-19` | BE | Tüm modüllerin bildirimi kayıp; kulüpten bağımsız |
| | 6 | `TB-96` | FE + BE | Bildirim dokunuşu ölü; BE derin bağlantı da yanlış (yeni bulgu) |
| | 7 | `TB-97` kalıntısı | FE (mock) | API yarısı kapanmış; mock 409 dalı duruyor |
| | 8 | `E-22` | BE + FE | Duyuru okuma yüzü; 6-7-8 birlikte duyuru zincirini kapatır |
| **C — kulüp yüksek** | 9 | `B-44` | BE | Danışman kuralının arka kapısı |
| | 10 | `B-46` | BE + FE | Ret gerekçesi + karar geçmişi |
| | 11 | `B-45` | FE | "Kapalı" etiketi tek satır |
| **D — ders programı** | 12 | `TB-76` | BE + FE | Kullanıcının kararı sessizce çöpe atılıyor |
| | 13 | `TB-77` | BE + FE | Önizleme sabit sayılar; 12 ile aynı yüzey |

Her düzeltme kendi commit'i ile gider (conventional format, `<type>(<scope>): türkçe açıklama`).
FE işleri `oksis-ui`, BE işleri `oksis-api` deposunda; 6, 8, 10, 12, 13 iki depoya birden dokunur.

### 0.1 Kapanış protokolü — defterde iz kalmaz

Bir madde **kabul ölçütü sağlanıp doğrulandığında** (test yeşil + ekran/uç ölçümü):

1. Maddenin bloğu [[OKSİS - Bulgu Kayıt Defteri]]'nden **tamamen silinir** — özet tablosu,
   modül dağılımı ve zincir şeması da güncellenir; defterde ID'ye tek atıf kalmaz.
2. Blok, [[OKSİS - Bulgu Arşivi]]'nde **ait olduğu modül bölümünün altına** taşınır;
   sonuna kapanış satırı eklenir: tarih, commit hash'leri, ölçüm kanıtı (gerekiyorsa
   `kanit/` klasörüne ekran görüntüsü / çıktı).
3. Kısmi kapanışta (maddenin bir ayağı kaldıysa) madde defterde kalır, blok
   **bugünkü gerçek duruma** indirgenir — kapanan ayak arşive yazılır.

### 0.2 Defterden sapmalar — kod bugün farklı söylüyor

Doğrulama, defterin 2026-08-30 fotoğrafından sonra değişen dört şey buldu:

| Madde | Defter diyor | Kod bugün (2026-08-31, master) |
|---|---|---|
| `TB-99` | "FE tipi Türkçe etiket, yazma 400, bloke edici 🔴" | **Yazma ayağı kapanmış** (`oksis-ui` @ `9d3723e` + merge `9d7cfdc`): `ClubCategory` artık camelCase kod, `CLUB_CATEGORY_LABEL`/`ICON` map'leri `packages/core/src/club/constants.ts:64-99`'da, daraltma koda bakıyor. Kalan tek kusur §1'de. |
| `TB-97` | "`:apply` sözleşmede yaşıyor" | **API yarısı kapanmış** (`e951629`): `:apply` sözleşmeden düşmüş, tek uç `joinClub` (`packages/api/src/club/endpoints.ts:667-681`). **Mock yarısı açık** — §7. |
| `TB-96` | "FE işi" etiketi | Defter ölçümü sunucunun `/student/clubs/{clubId}` ürettiğini zaten kaydetmiş; eksik olan katman etiketi — çözüm **BE ayağı da istiyor**: `ClubApplicationDecidedNotificationHandler.cs:63` bu bağlantıyı üretiyor, mobilde `/student/...` diye rota yok (öğrenci rotası `/clubs/[clubId]`), S-13 kararı `"/clubs/{id}"` diyordu. §6'da iki ayaklı çözüm. |
| `B-46` | "Sunucu gerekçeyi kabul ediyor" (ima: BE tamam) | BE **yazma** ayağı fiilen tam (command `Reason` alanı, `reject_reason` kolonu, bildirim gövdesine giriyor — D5). Asıl boşluk: `ClubApplicationDto` gerekçeyi **döndürmüyor** (`ClubDtos.cs:174-181`) — okuma tarafı da BE işi. §10. |

Ek gözlem (bu turda düzeltilmiyor): `WithinActiveSeason` süzgecini yalnız
`GetMyNotifications` ve `GetMyUnreadCount` kullanıyor; `MarkAllNotificationsRead` kullanmıyor —
listede görünmeyen sezon-dışı bildirim "tümünü okundu"da işaretlenebilir. Deftere
**`TB-104`** olarak işlendi (2026-08-31); `X-19` kapatılırken birlikte ele alınabilir.

---

## A Bloğu — Bloke ediciler

## 1. `TB-99` kalıntısı · Süzgeç çipi ham kategori kodu basıyor

**Öncelik:** 🔴→🟢 (ana ayak kapandı) · **Katman:** FE (web) · **Depo:** `oksis-ui`

**Kök neden.** Kategori düzeltmesi (`9d3723e`) her tüketiciyi `CLUB_CATEGORY_LABEL`'a
geçirmiş, tek yer unutulmuş — aktif süzgeç çipi:

```tsx
// apps/web/features/club/club-list-page.tsx:186-188
{category && (
  <span className="att-fchip">
    Kategori: {category}          // ← ham kod: "Kategori: socialResponsibility"
```

Hemen üstteki `:157` (`CLUB_CATEGORY_LABEL[category]`) ve `:145` (Durum çipi) doğru kalıbı
kullanıyor.

**Çözüm.** `{category}` → `{CLUB_CATEGORY_LABEL[category]}` (import zaten dosyada).

**Test.** Görsel doğrulama yeterli (mock'lu web, yönetici, kategori süzgeci seç → çip
"Kategori: Sosyal Sorumluluk" yazmalı). Sözleşme testi `packages/core/src/club/constants.test.ts`
zaten label map'ini kilitliyor.

**Kabul ölçütü.** Süzgeç çipinde Türkçe etiket; depoda `Kategori: {category}` kalıbı kalmadı.

**Kapanış.** `TB-99` bloğu defterden silinir → arşive; kapanış satırına `9d3723e` (yazma
ayağı), `9d7cfdc` (merge) ve bu çip commit'i yazılır. Bilinen bilinçli artık: `toCategory`
bilinmeyen kodu sessizce `"other"`a düşürmeye devam eder (`endpoints.ts:137-145` — yorumuyla
gerekçeli); ayrı madde açılmaz.

---

## 2. `E-21` · Kulübü yayına alan / geri açan düğme yok — Taslak hapsi

**Öncelik:** 🔴 · **Katman:** FE (web) · **Depo:** `oksis-ui`

**Kök neden.** Statü diyaloğu yalnız iki hedef tanıyor:

```tsx
// apps/web/features/club/status-dialog.tsx:14
export type ClubStatusChangeAction = "deactivate" | "archive"
```

ve satır menüsü bu iki eylemi yalnız `c.status === "active"` iken sunuyor
(`club-list-page.tsx:328-380`). Oysa zincirin geri kalanı **dört statüyü de** taşıyor:
`clubStatusChangeSchema` → `z.enum(CLUB_STATUS_VALUES)` (`packages/core/src/club/schemas.ts:83-93`),
uç `POST /clubs/{clubId}:changeStatus` (`endpoints.ts:367-378`), BE `Club.Activate()`
(`Club.cs:217-235`) danışmansız kulüpte `"Danışman öğretmeni olmayan kulüp aktifleştirilemez"`
ile 409 üretiyor (`ChangeClubStatusCommandHandler.cs:51-75`). Kısıt **yalnız UI'da**.

**Çözüm.**
1. `ACTION_CONFIG`'e üçüncü eylem: `activate` — `targetStatus: "active"`,
   etiketler duruma göre: taslakta **"Yayına al"**, pasifte **"Yeniden aktifleştir"**
   (tek eylem, iki metin; `club.status`'a bakarak başlık/onay etiketi seçilir).
2. Satır menüsü: `c.status === "draft" || c.status === "inactive"` iken `activate` eylemi
   gösterilir; `active` dalındaki mevcut iki eylem aynen kalır. Aynı ekleme
   `club-detail-page.tsx:226` montaj noktasına.
3. 409 hâlihazırda kullanıcıya geçiyor (`mutation-error.ts:97-108` 409'da sunucu cümlesini
   olduğu gibi gösteriyor) — danışmansız taslakta düğmeye basan yönetici doğru Türkçe
   gerekçeyi görür; ekstra iş yok.
4. Pasife alma diyaloğundaki "Bu işlem geri alınabilir" cümlesi artık **doğru** hâle gelir —
   metne dokunulmaz.

**Bilinçli kapsam dışı:** diyalogdaki `reason: null` sabiti (analiz §19-G) — gerekçe alanı
eklemek ayrı, küçük bir iş; bu maddeyi bloklamaz.

**Test.** Mock'lu web: (a) danışmanlı taslak kulüp → "Yayına al" → listede Aktif;
(b) pasif kulüp → "Yeniden aktifleştir" → Aktif; (c) danışmansız taslak → 409 cümlesi
ekranda. Mock `club-handlers.ts:126-128` dört statüyü kabul ediyor, senaryo çalışır.

**Kabul ölçütü.** Draft ve Inactive kulüp ekrandan Aktif'e taşınabiliyor; danışmansızda
sunucu gerekçesi görünüyor.

**Kapanış.** `E-21` bloğu arşive; `B-44` (§9) ile aynı düğümün komşusu olduğu not düşülür.

---

## 3. `B-43` · Açık katılımda başvuru penceresi sessizce siliniyor

**Öncelik:** 🔴 · **Katman:** FE · **Depo:** `oksis-ui`

**Kök neden.** İki katmanlı:

```ts
// packages/api/src/club/endpoints.ts:338-348 · toCreateBody (updateClub de aynı gövdeyi kullanır)
applicationStart: values.joinMode === "approval" ? values.applicationStart : null,
applicationEnd:   values.joinMode === "approval" ? values.applicationEnd   : null,
```

Gerekçe yorumu yanlış: `schemas.ts:52-55` *"sunucu da pencereyi yalnız approval'da uygular"*
diyor; oysa BE `Club.IsApplicationOpen` **moda hiç bakmıyor** — pencere açık kulüpte de
uygulanır. Form da alanları gizlemiyor, yalnız soluklaştırıyor
(`form-drawer.tsx:294-323` + `.off { opacity:.45; pointer-events:none }`,
`clubs.css:175`) ve `draft` state temizlenmediği için yazılan tarih ekranda durup gövdede
sessizce `null` gidiyor.

**Çözüm.**
1. `toCreateBody`'deki mod koşulu kaldırılır — pencere her modda olduğu gibi gönderilir:
   `applicationStart: values.applicationStart, applicationEnd: values.applicationEnd`.
2. Form: `.off` sınıfı başvuru penceresi alanından kaldırılır — "Ekim'de açılan açık kulüp"
   artık ekranda da ifade edilebilir. Yardım metni moda göre kalabilir
   ("Boş bırakılırsa kayıtlar sınırsız süreyle açık kalır." her mod için doğru).
3. `schemas.ts:52-55` ve `endpoints.ts`'teki yanlış yorumlar gerçeğe çekilir; şemadaki
   `refine` (`schemas.ts:66-79`) `joinMode` koşulu olmadan (başlangıç ≤ bitiş) her modda koşar.

**Test.** `packages/api` altında kulüp endpoint testi yok (emsal: `announcements/endpoints.test.ts`);
bu düzeltmeyle `packages/api/src/club/endpoints.test.ts` açılır — ilk test:
`toCreateBody({joinMode:"open", applicationStart:"2026-10-01", applicationEnd:"2026-10-31"})`
gövdesinde iki tarihin korunduğu. Ekran doğrulaması: açık katılım + pencere → kaydet →
detayda pencere görünür.

**Kabul ölçütü.** Açık katılımlı kulüpte girilen pencere kayıtta duruyor; testi var.

**Kapanış.** `B-43` arşive; `B-45` (§11) ile akrabalığı (D8 ailesi) not düşülür.

---

## 4. `B-49` · İptal gerekçesi kutusu uydurma cümleyle dolu geliyor

**Öncelik:** 🟠 · **Katman:** FE (web) · **Depo:** `oksis-ui`

**Kök neden.**

```tsx
// apps/web/features/club/activity-dialogs.tsx:129-131
const [reason, setReason] = React.useState(
  "Laboratuvar bakımı nedeniyle etkinlik iki hafta sonraya ertelendi.",
)
```

Tasarım prototipinden kalmış. 65 karakter ≥ `CLUB_CANCEL_REASON_MIN`(15) olduğundan buton
açık; öğretmen dokunmadan onaylarsa bu metin **bildirim gövdesi olarak öğrencilere gider**
(gerekçe bildirime birebir giriyor — ölçülmüştü).

**Çözüm.** `useState("")`; örnek cümle istenirse `placeholder`'a taşınır. Alanın 15-500
denetimi (`schemas.ts:147-159`) ve `disabled={tooShort}` (`activity-dialogs.tsx:226`)
zaten doğru — varsayılan boşalınca buton kendiliğinden kilitli başlar.

**Test.** Görsel: diyalog açılır → alan boş, "İptal et" pasif, "En az 15 karakter" sayacı
görünür.

**Kabul ölçütü.** Boş açılış + pasif buton.

**Kapanış.** `B-49` arşive.

---

## B Bloğu — Kulüp akışını tamamlayan kritikler

## 5. `X-19` · Sezon ileri tarihte başlıyorsa bildirim kutusu tamamen boş

**Öncelik:** 🔴 · **Katman:** BE · **Depo:** `oksis-api`

**Kök neden.** B-06 kesmesi sezonun **başlangıç tarihini** alt sınır yapıyor:

```csharp
// src/Oksis.Application/Modules/Notifications/Common/NotificationSeasonScope.cs:38-66
var start = await db.AcademicSessions ... .Where(s => s.Status == AcademicSessionStatus.Active)
    .Select(s => (DateOnly?)s.StartDate).FirstOrDefaultAsync(...);
...
=> seasonStart is null ? query : query.Where(n => n.CreatedAt >= seasonStart.Value);
```

Sezon "yürürlükte" ilan edilip başlangıcı ileri tarihe konduğunda (Ağustos'ta 15 Eylül
başlangıçlı sezon — gerçek okul senaryosu) `CreatedAt >= 15 Eylül` süzgeci bugün üretilen
**her** bildirimi gizler; iki tüketici de aynı kesmeyi kullanır
(`GetMyNotificationsQueryHandler.cs:16-57`, `GetMyUnreadCountQueryHandler.cs:14-26`) →
liste boş + rozet 0.

**Çözüm.** Kesmenin amacı "önceki sezonun gürültüsünü gizlemek"tir; aktif sezona geçildiği
andan sonrası **yeni sezona aittir**. `ResolveActiveSeasonStartAsync` şu kurala çekilir:

- `StartDate <= bugün` → kesme `StartDate` (bugünkü davranış, değişmez).
- `StartDate > bugün` (geçiş dönemi) → kesme **bir önceki (aktif olmayan) sezonun
  `EndDate` + 1 günü**; önceki sezon yoksa kesme uygulanmaz (`null`).

Bu, sabit bir noktadır (güne göre kaymaz — `min(StartDate, bugün)` gibi kayan bir kesme,
dün görünen bildirimi yarın gizlerdi; o yüzden reddedildi). Tek dosya değişir; iki tüketici
kendiliğinden düzelir. Sorgu maliyeti: geçiş döneminde bir ek `MAX(EndDate)` alt sorgusu.

**Test.** `GetMyNotificationsQueryHandlerTests` / `GetMyUnreadCountQueryHandlerTests`
(NSubstitute + MockQueryable, `SetupSessions` deseni mevcut):
1. Aktif sezon gelecek başlangıçlı + önceki sezon dünkü bitişli + bugün üretilmiş bildirim
   → listede görünür, `totalCount` 1.
2. Aynı kurulumda önceki sezonun **içinde** üretilmiş bildirim → görünmez (B-06 korunur).
3. Aktif sezon geçmiş başlangıçlı → bugünkü davranış birebir (regresyon kilidi).
Sonrasında `dotnet test` + canlı ölçüm: `s1`'de uç `totalCount > 0` dönmeli (defterdeki
ölçümün tersine çevrilmesi).

**Kabul ölçütü.** Üç birim test yeşil; `s1` ölçümünde kulüp bildirimleri kutuda.

**Kapanış.** `X-19` arşive; `MarkAllNotificationsRead` asimetrisi defterde `TB-104` olarak
açık kalır (§0.2) — birlikte kapatılırsa onun bloğu da arşive gider.

---

## 6. `TB-96` · Kulüp bildirimi dokununca hiçbir yere gitmiyor

**Öncelik:** 🔴 · **Katman:** FE + BE · **Depo:** `oksis-ui` + `oksis-api`

**Kök neden — iki uç birden yanlış:**

*FE:* `resolveNotificationTarget` (`packages/core/src/notifications/logic.ts:449-508`)
yalnız `announcements` / `homework` / `grades` kolları + `NOTIFICATION_AREA_BY_PATH`
(`/attendance`, `/schedule`, `/duties`, `/grades`) tanır; `clubs` kolu yok → `null` →
web satırı tıklanamaz (`notification-href.ts:68-69`), mobil push dokunuşu boşa gider
(`navigate-to-target.ts:79-129`, `push-router.ts:81-82`).

*BE (defter ölçümünde kayıtlı, ama maddenin "FE işi" etiketi bunu dışarıda bırakmış):*
sunucu derin bağlantıyı **var olmayan rotayla** üretiyor:

```csharp
// src/Oksis.Application/Modules/Clubs/Events/Notifications/ClubApplicationDecidedNotificationHandler.cs:63
var deepLink = $"/student/clubs/{e.ClubId}";
```

Mobilde öğrenci rotası `/clubs/[clubId]`; `/student/...` önekli rota iki depoda da yok.
S-13 kararı `PushDeepLinks.Club(id) = "/clubs/{id}"` demişti.

**Çözüm — iki ayak, tek turda:**

*BE:* kulüp bildirim handler'larının tamamında (başvuru kararı, etkinlik yayını/iptali,
duyuru — `kind` 28/29/31 ailesi) derin bağlantı `"/clubs/{clubId}"` biçimine eşitlenir;
`PushDeepLinks.Club` sabiti varsa oradan, yoksa açılarak kullanılır (tek kaynak).

*FE:* `logic.ts`'e `clubs` kolu — `NotificationTarget` union'ına `{ kind: "club", clubId }`
eklenir; çözümleyici **iki biçimi de** tanır: `/clubs/{guid}` **ve** `/student/clubs/{guid}`
— çünkü veritabanında eski biçimle yazılmış bildirim satırları kalıcıdır
([[serilesmis-sekil-sozlesmedir]]); yeni üretim tek biçime geçse de okuyucu ikisini çözer.
Dağıtım:

| Rol | Hedef | Kanıt |
|---|---|---|
| Öğrenci (web+mobil) | `/clubs/{clubId}` | `app/clubs/[clubId]/index.tsx` (yalnız öğrenci açar) |
| Öğretmen/danışman (mobil) | `/clubs/{clubId}/applications` | `app/clubs/index.tsx:56-59` |
| Veli (mobil) | `/clubs/mine` yerine veli girişi: `clubs/parent` akışı **iki parametre** istiyor (`studentId`+`clubId`); derin bağlantı tek id taşıdığından veli hedefi **kulüp sekmesi köküne** (`/clubs`) düşer — `studentId`'yi istemcide çözüp detaya inen sürüm F7 ile birlikte ele alınır (analiz §18.4'ün bilinen kısıtı) |
| Web (tüm roller) | `/clubs/{clubId}` — `club-screen.tsx` rol dağıtımını zaten yapıyor | `apps/web/features/club/club-screen.tsx:3-10` |

`notification-href.ts` `switch`'ine `case "club"` (Record tam olduğundan derleyici zorlar),
`navigate-to-target.ts`'e `if (target.kind === 'club')` dalı eklenir.

*F5 bağımlılığı:* web mock kulüp bildirimlerinin kimlikleri GUID değil
(`apps/web/mocks/notifications-data.ts:113-114`, `deepLink: "/clubs/1"`) — `GUID_PATTERN`
(`logic.ts:257`) eler. Aynı commit'te mock derin bağlantıları gerçek fixture GUID'lerine
çevrilir.

**Test.**
- `packages/core` birim testi (`logic.ts` için emsal test dosyası varsa oraya, yoksa
  `notifications/logic.test.ts`): `/clubs/{guid}` + rol → doğru hedef; `/student/clubs/{guid}`
  → aynı hedef; `/clubs/1` → `null` (GUID kilidi).
- BE: `ClubApplicationDecidedNotificationHandler` testine derin bağlantı beklentisi
  `"/clubs/{id}"` olarak güncellenir.
- Ekran: `s2` senaryosu tekrarı — başvuru onayı bildirimi artık öğrenci kulüp detayına
  götürmeli.

**Kabul ölçütü.** Bildirim satırı web'de tıklanabilir, mobilde dokunuş kulüp ekranına iner;
eski `/student/clubs/...` satırları da çözülür.

**Kapanış.** `TB-96` arşive; veli derin-inişi F7 artığı olarak defterde `TB-100`/F7
komşuluğunda tek satır not bırakılır (yeni ID gerekmiyorsa mevcut F7 maddesine eklenir).

---

## 7. `TB-97` kalıntısı · Mock, onaylı kulüpte `:join`'e 409 döndürüyor

**Öncelik:** 🔴→🟡 (API yarısı kapandı) · **Katman:** FE (mock) · **Depo:** `oksis-ui`

**Kök neden.** Karar uygulanmış — sözleşmede tek uç `joinClub` var (`endpoints.ts:667-681`),
`:apply` codegen ile düşmüş (`e951629`). Ama mock hâlâ eski dünyada:

```ts
// packages/api-mocks/src/club/club-handlers.ts:309-321
http.post("*/api/v1/students/me/clubs/:clubId\\:join", ({ params }) => {
  const detail = decideStudentMembership(String(params.clubId), "join")
  if (!detail) return HttpResponse.json({ ... errors: [{ code: "wrong_mode", ... }] }, { status: 409 })
```

`decideStudentMembership` `"join"` kararında `joinMode !== "open"` ise `undefined` dönüyor
(`club-data.ts:839-849`) → onaylı kulüpte "Kulübe katıl" mock ortamında patlıyor. Ölü
`:apply` handler'ı da duruyor (`club-handlers.ts:294-308`).

**Çözüm.**
1. `club-data.ts` `decideStudentMembership("join")`: moda göre dallanır — `open` →
   `active` üyelik (bugünkü), `approval` → `pending` başvuru satırı (bugünkü `"apply"`
   dalının davranışı). 409 üretme sebebi kalmaz.
2. `club-handlers.ts`: 409 `wrong_mode` dalı ve ölü `:apply` handler'ı silinir.
3. `student-detail-screen.tsx` imzasındaki ölü `'apply'` değeri düşer
   (`onDecide: (decision: 'join' | 'leave')`), `queries.ts:289-300`'daki `"apply"` dalı silinir.

**Test.** `packages/api-mocks` (vitest, `npm test -w packages/api-mocks`): onaylı kulüpte
`:join` → 200 + `membership: "pending"`; açık kulüpte `:join` → 200 + `"active"`.
Ekran: mobil web, öğrenci, onaylı kulüpte "Kulübe katıl" → "Başvurun alındı" durumu.

**Kabul ölçütü.** Mock'ta 409 dalı yok; iki mod da tek uçtan doğru duruma iniyor.

**Kapanış.** `TB-97` arşive; kapanış satırına `e951629` (API yarısı) + bu commit yazılır.

---

## 8. `E-22` · Kulüp duyurusunu öğrenci de veli de hiç okuyamıyor

**Öncelik:** 🔴 · **Katman:** BE + FE · **Depo:** `oksis-api` + `oksis-ui`

**Kök neden.** Yazma tarafı tam, okuma yüzeyi yok:

*BE:* uç 18 (`GET /clubs/{clubId}/announcements`) `ClubReadGate`'ten geçiyor; görünüm
çözücüsü yalnız iki kimlik tanıyor:

```csharp
// src/Oksis.Application/Modules/Clubs/Internal/ClubView.cs:38-51
if (club.AdvisorTeacherPersonId == personId) { return ClubView.Advisor; }
return isSchoolWide ? ClubView.Admin : null;    // isSchoolWide = clubs.manage
```

Üye öğrenci ve velisi hiçbir görünüm alamaz → **404**.

*FE:* duyuru listesi yalnız `panel-page.tsx`'te (danışman/yönetici); mobil öğrenci detayı
yalnız sayaç gösteriyor; `/clubs/[clubId]/announcements` rotası yok.

**Çözüm — defterin (a) seçeneği: mevcut ucun kapısı genişler** (ayrı uç açılmaz; tek
kaynak korunur).

*BE:* `ListClubAnnouncementsQueryHandler` kapı sırası:
1. `ClubReadGate.OpenAsync` (danışman/yönetici) — bugünkü yol, değişmez.
2. `null` dönerse **üye öğrenci**: `ClubStudentGate.OpenForReadAsync(schoolId, clubId,
   callerPersonId, ...)` + `FindLiveMembershipAsync` (canlı üyelik: `Pending|Active|Paused`,
   `ClubStudentReader.cs:42-43,103-115`). Bileşen DI'da hazır (`DependencyInjection.cs:157`).
3. O da açmazsa **veli**: `ClubFamilyScope.GetCallerChildIdsAsync` çocuklarından en az
   birinin bu kulüpte canlı üyeliği varsa geçer (`ClubFamilyScope.cs:76-112` emsal).
4. Hiçbiri → **404** (varlık sızdırmama korunur; X-17 kararı beklenmez, çünkü burada
   "okuyabilen ama yazamayan" sınıfı yok — okuyamayan 404 alır, bugünkü sözleşmeyle uyumlu).

İzin `clubs.read` kalır (öğrenci/velide zaten var — `students/me` uçları bununla çalışıyor).

*FE (mobil):* `app/clubs/[clubId]/announcements.tsx` rotası + öğrenci detayındaki
`<Stat label="Duyuru">` kartı bu rotaya bağlanır; veli detayı (`readOnly`
`StudentDetailScreen`) aynı bileşeni kullandığından veli de aynı listeye iner. Liste
bileşeni web `panel-page`'teki duyuru listesinin sadeleştirilmiş okunur hâli (başlık,
gövde, tarih; yönetim eylemleri yok).

**Test.**
- BE `ClubAnnouncementHandlerTests` (mevcut dosya): üye öğrenci → 200 + liste; üye olmayan
  öğrenci → 404; üye çocuğu olan veli → 200; ilgisiz veli → 404; danışman/yönetici
  regresyon (mevcut testler yeşil kalır).
- Ekran: 2026-08-30 ölçümünün tersi — "İlk toplantı salı günü" duyurusu öğrenci ve veli
  ekranında **metniyle** görünür.

**Kabul ölçütü.** Üye öğrenci + velisi uç 18'den 200 alıyor; mobilde duyuru metni okunuyor;
sayaç kartı listeye götürüyor.

**Kapanış.** `E-22` arşive. §6 (TB-96) ile birlikte kapanınca defterdeki
`E-22 → kulüp duyurusunun tek tüketicisi yok` zincir satırı da silinir.

---

## C Bloğu — Kulüp yüksek öncelikliler

## 9. `B-44` · Aktif kulübün danışmanı kaldırılabiliyor — D1'in arka kapısı

**Öncelik:** 🟠 · **Katman:** BE · **Depo:** `oksis-api`

**Kök neden.** `UpdateClubCommandHandler.cs:51` `advisorId = null`'u doğrulamadan geçirip
`AssignAdvisor(null)`'u koşulsuz çağırıyor; domain tarafı bunu **bilinçli** serbest bırakmış
(`Club.cs:200-212` XML doc: *"danışmansız aktif kulüp hâli MÜMKÜNDÜR ve bu bilinçlidir"*).
Ama aynı domain `Activate()`'te danışmansızlığı 409 ile reddediyor — **iki kapı çelişiyor**
ve doğan hâl (aktif + danışmansız) `:changeStatus` ile onarılamıyor. `DecideClubApplication`
bile bu anomaliye karşı elle korunmak zorunda kalmış (`DecideClubApplicationCommandHandler.cs:119-123`).

**Çözüm (önerilen — en dar, kuralı tek yöne kapatır).** `UpdateClubCommandHandler`'da:
kulüp `Active` **ve** istek danışmanı boşaltıyor (`advisorId is null && opened.Club.
AdvisorTeacherPersonId is not null`) → `Clubs.InvalidState` ailesinden 409:
*"Aktif kulübün danışmanı kaldırılamaz; önce yeni bir danışman atayın ya da kulübü pasife alın."*
Danışman **değiştirme** (dolu → dolu) serbest kalır; taslak/pasif kulüpte kaldırma serbest kalır.

⚠️ **Kullanıcı onayı gerekir:** domain'e yazılmış bilinçli bir asimetri tersine çevriliyor.
Alternatif (kaldırınca kulüp `Inactive`'e düşsün) değerlendirildi ve önerilmedi — sessiz
statü değişikliği, TB-76'nın şikâyet ettiği "kullanıcı adına karar verme" sınıfındandır.
Onay gelmeden bu madde atlanır, tur devam eder.

**Test.** `ClubWriteHandlerTests`: (a) aktif + danışman kaldırma → 409 + mesaj; (b) aktif +
danışman değiştirme → 200; (c) taslakta kaldırma → 200 (regresyon); (d) `E-21` ekranından
zincir: pasife al → danışmanı kaldır → yeniden aktifleştir → 409 "danışmansız" (tutarlı döngü).

**Kabul ölçütü.** Aktif kulüp hiçbir kapıdan danışmansızlaşamıyor; yönetici listesindeki
kırmızı "Danışman yok" uyarısı yalnız taslak/pasifte görülebilir hâle geliyor.

**Kapanış.** `B-44` arşive; `Club.cs` XML doc'undaki asimetri gerekçesi de güncellenir
(niyet ile kod yeniden eşitlenir).

---

## 10. `B-46` · Ret gerekçesi sorulmuyor, karar geçmişi görünmüyor

**Öncelik:** 🟠 · **Katman:** BE + FE · **Depo:** `oksis-api` + `oksis-ui`

**Kök neden.** Üç katman, üç ayrı boşluk:
1. **FE gönderim:** `panel-page.tsx:359-373` `decideOne(a, "reject")` gerekçesiz;
   mutation `reason?: string | null` alanını taşıyor ama çağrı yeri geçmiyor
   (`queries.ts:142-166`).
2. **BE okuma:** `ClubApplicationDto` gerekçeyi **döndürmüyor** (`ClubDtos.cs:174-181`) —
   yazma ayağı tam (command `Reason`, `reject_reason nvarchar(500)`, bildirim gövdesine
   giriyor — `ClubApplicationDecidedNotificationHandler.cs:52-68`), ama yazılan gerekçe
   hiçbir uçtan geri okunamıyor.
3. **FE görüntüleme:** `useClubApplications(clubId, "pending")` — uç 7 `approved`/`rejected`
   satırları da dönüyor, hiçbir yüzey göstermiyor.

**Çözüm.**

*BE:* `ClubApplicationDto`'ya iki alan **eklenir** (mevcut alanlar değişmez —
[[serilesmis-sekil-sozlesmedir]]: ekleme güvenli, yeniden adlandırma yasak):
`string? RejectReason`, `string? DecidedAt`. Projeksiyon dolduran yer güncellenir.

*FE:*
1. "Reddet" tek tık olmaktan çıkar: küçük onay diyaloğu — opsiyonel gerekçe alanı
   (≤500, `maxLength`), "Reddet" onay düğmesi. `decideOne`'a `reason` parametresi geçilir.
2. `panel-page`'e ikinci sekme/bölüm: **"Karara bağlananlar"** —
   `useClubApplications(clubId)` (statüsüz = hepsi) ya da ikinci sorgu `"approved"`+`"rejected"`;
   satırda öğrenci, karar, tarih, gerekçe. `contract.ts:62-70` DTO'suna yeni iki alan işlenir.

**Test.** BE: `ClubMembershipHandlerTests` — ret + gerekçe → listede `rejectReason` dolu.
Mock: `club-data.ts` decide yolu gerekçeyi saklayıp listede döndürür (mock-sözleşme eşitliği).
Ekran: reddet → gerekçe gir → "Karara bağlananlar"da satır gerekçesiyle görünür; öğrenci
bildirim gövdesinde aynı gerekçe (D5 zaten çalışıyor).

**Kabul ölçütü.** Danışman dün kimi neden reddettiğini ekrandan görebiliyor; gerekçe uçtan
geri okunuyor.

**Kapanış.** `B-46` arşive.

---

## 11. `B-45` · Penceresiz kulüpte "Başvuru dönemi: Kapalı" yazarken katılım açık

**Öncelik:** 🟠 · **Katman:** FE (mobil) · **Depo:** `oksis-ui`

**Kök neden.**

```tsx
// apps/mobile/src/features/club/components/student-detail-screen.tsx:177
<InfoRow icon="calendar" label="Başvuru dönemi" value={club.applicationPeriod ?? 'Kapalı'} />
```

`applicationPeriod: null` iki ayrı hâli kodluyor: "pencere tanımlı değil (süresiz açık)"
ve "kapalı". Ayrımı yapan alan zaten telde var: `applicationOpen: boolean`
(`types.ts:242`; mock kanıtı `club-data.ts:239`).

**Çözüm.** Tek satır:
`value={club.applicationPeriod ?? (club.applicationOpen ? 'Süresiz açık' : 'Kapalı')}`.
Not: sunucu-hazır etiket ilkesi (`types.ts:254` doc'u) bozulmaz — istemci tarih hesabı
yapmıyor, yalnız iki sunucu alanını birleştiriyor. (İdeal çözüm sunucunun `applicationPeriod`
alanına `"Süresiz açık"` yazması olurdu; BE'ye tek satırlık iş olarak not düşülür, bu
düzeltmeyi bloklamaz.)

**Test.** Görsel: penceresiz açık kulüp detayında "Süresiz açık" + aktif "Kulübe katıl";
pencereli kulüpte tarih etiketi; kapalı kulüpte "Kapalı" + pasif CTA.

**Kabul ölçütü.** Etiket ile düğme çelişmiyor.

**Kapanış.** `B-45` arşive (D8 ailesinin FE yüzü kapandı notuyla).

---

## D Bloğu — Ders programı güven kırıcıları

## 12. `TB-76` · Yayın ekranındaki bildirim seçimi süs

**Öncelik:** 🔴 · **Katman:** BE + FE · **Depo:** `oksis-api` + `oksis-ui`

**Kök neden.** `PublishProgramCommand` üç bayrak taşıyor (`NotifyInApp/NotifyPush/NotifyEmail`,
`PublishProgramCommand.cs:9-15`); handler **hiçbirini okumuyor** (grep doğrulaması: `src/`
altında tek okuma yeri controller bağlaması). Fan-out `ScheduleProgramPublishedEvent`
üzerinden koşulsuz: `SchedulePublishedNotificationHandler.cs:26-40`'ta tek erken çıkış
"alıcı yok". Ölçüm: üç bayrak `false` iken 16 bildirim üretilmişti.

**Çözüm.**
1. **`NotifyInApp` gerçek olur:** `ScheduleProgram.Publish(...)`'e `bool notify` parametresi
   → `ScheduleProgramPublishedEvent`'e `Notify` alanı (olay in-memory, kalıcı serileştirme
   yok — şekil sözleşmesi riski taşımaz) → `SchedulePublishedNotificationHandler` başında
   `if (!e.Notify) return;`. Cache invalidation handler'ı (`WorkloadCacheInvalidationHandler`)
   bayraktan **etkilenmez** — o bildirim değil, tutarlılık işi.
2. **`NotifyPush` / `NotifyEmail` ekrandan kalkar:** arkalarında kanal yok (TB-43 ölçümü:
   kayıtlı tek kanal in-app). Çalışmayan anahtar sunmak TB-43'ün "ekran gerçeği yansıtmıyor"
   kusurunun ta kendisi. Bayraklar **telde kalır** (sözleşme kırılmaz, komut alanları durur)
   ama `publish-drawer.tsx`'ten iki anahtar kaldırılır; TB-43 kararı kanalları getirdiğinde
   geri gelirler. *(Bu, TB-43'ün "ayar mı bağlansın ekran mı indirgensin" kararını
   **çözmez** — yalnız bu ekrandaki iki ölü anahtarı kaldırır; matris sekmesi E bloğunda
   kalır.)*

**Test.** BE `PublishProgramCommandHandlerTests` + `SchedulePublishedNotificationHandlerTests`:
`NotifyInApp=false` → enqueuer hiç çağrılmaz; `true` → alıcı kümesiyle çağrılır. Canlı ölçüm:
defterdeki senaryo tekrarı — `notifyInApp:false` ile yayın → `notifications` tablosuna 0 satır.

**Kabul ölçütü.** "Bildirim gönderme" dendiğinde bildirim gitmiyor; ekranda yalnız gerçek
kanal görünüyor.

**Kapanış.** `TB-76` arşive; TB-43 karar maddesine "yayın ekranı ayağı kapandı, matris
sekmesi açık" notu düşülür.

---

## 13. `TB-77` · Yayın önizlemesinin sayıları sabit

**Öncelik:** 🔴 · **Katman:** BE + FE · **Depo:** `oksis-api` + `oksis-ui`

**Kök neden.**

```csharp
// src/Oksis.Application/Modules/Timetable/Services/PublishReadiness.cs:53-72 (BuildAsync)
var affected = new PublishAffectedDto(
    Teachers: program.ActivePlacements.Select(p => p.TeacherId).Distinct().Count(),
    Students: 0,
    Parents: 0);
return new PublishReadinessResult(ConflictCount: 0, ...);
```

İki uç (`GetPublishPreview` + `PublishProgram` sonucu) aynı sabitleri döndürüyor. FE sayacı
üstüne ters çalışıyor: `publish-drawer.tsx:77` `teachers + students + parents` topluyor —
gerçek alıcı kümesi **öğrenci + veli** (`NotificationRecipientResolver.
ResolveClassRoomConsumersAsync`, öğretmen alıcı değil). Aynı borcun ikizi
`PreviewScheduleExceptionQueryHandler.cs:90-96`'da "Debt-BE-2" yorumuyla zaten kayıtlı.

**Çözüm.**

*BE:* `PublishReadiness.BuildAsync` gerçek sayıları hesaplar (resolver'ın sorgu deseni
Application katmanına uyarlanır; hedef **hesap tek yerde yaşasın** diye sayım mantığı
paylaşılan bir yardımcıya alınır ve `PreviewScheduleException`'daki Debt-BE-2 satırı da
ona bağlanır):
- `Students`: `StudentProfile.CurrentClassroomId == program.ClassRoomId && IsActiveStudent`
  sayımı.
- `Parents`: bu öğrencilerin `ParentStudentRelationships` (RevokedAt == null) distinct
  veli sayımı.
- `ConflictCount`: **bu turda dokunulmaz** — çakışma yerleşim anında engelleniyor olabilir
  (defterin kendi notu: ölçülmedi, iddia edilmiyor). Sabit `0` kalır; çekmecedeki ölü
  *"çakışma yayını engeller"* uyarı metni FE'den kaldırılır ki yalan söylemesin. Programlar
  arası çakışma ölçümü ayrı tur.

*FE:* `publish-drawer.tsx:77` → `notifCount = notifyInApp && affected ? affected.students
+ affected.parents : 0` (öğretmen sayılmaz; §12 sonrası tek kanal in-app olduğundan
`notifyPush/notifyEmail` koşulu konusu kendiliğinden düşer).

**Test.** BE: `PublishProgramCommandHandlerTests` — 8 öğrencili, 8 velili şubede önizleme
`students:8, parents:8`. Canlı ölçüm: defterdeki senaryo tersine döner — önizleme "16 kişi"
der, yayın 16 kişiye gider, ikisi eşit. *(Sayım sorguları `MockQueryable` üzerinde
koşacak — [[bellek-ici-test-db-kisitini-zorlamaz]] uyarınca `PublishSwapIntegrationTests`
ailesine bir gerçek-SQL doğrulaması eklenir; X-06'nın "test yeşil, gerçek çağrı kırık"
deseni bu handler'da tekrarlanmasın.)*

**Kabul ölçütü.** Önizlemenin söylediği sayı ile fiilen bildirim alan kişi sayısı aynı;
sayaç doğru kişileri sayıyor.

**Kapanış.** `TB-77` arşive; `conflictCount` artığı için defterde tek satırlık dar madde
bırakılır ("programlar arası çakışma ölçülmedi" — mevcut blok içindeki not yeni ID ile
ayrışır) — iz, arşivde değil yeni maddede yaşar.

---

## 14. Kapsam dışı — bu analiz neyi bilerek dışarıda bırakıyor

- **E bloğu (karar maddeleri):** `TB-48`/`X-03`, `TB-43` (matris sekmesi), `X-11`, `X-17`,
  `TB-46`, `TB-78`, `TB-55`, `E-01`, `TB-19`, `X-06` geniş ayağı, `X-18`, `X-10`, `TB-31`,
  `B-19`, `B-24` etiketi, `D-04`. Kod değil yön kararı; karar oturumu ayrı.
- **F bloğu (modül ön koşulları):** `X-16` + `TB-46` + `TB-78` (not modülü öncesi);
  `TB-82` → `E-19` → `E-18` → `TB-83` → `TB-84` (ödev backend'i öncesi).
- **Kuyruk:** `B-47`, `B-48`, `TB-98`, `TB-100`, `TB-103`, `E-20`, `TB-29`, `E-13`,
  `TB-38`, `TB-42`, `TB-63`, `TB-101`, `D-17`, `D-18`.
- **Turda görülen küçük yan işler** (bloklamaz, uğrarken alınabilir):
  - `mutation-error.ts:61` `DOMAIN_FORBIDDEN_CODE_PREFIXES`'e `"Clubs."` eklenmesi —
    kulüp 403 Türkçe cümleleri ekrana geçsin (X-17'nin BE kararından bağımsız FE ayağı;
    docblock bilinçli karar istiyor, tek satırlık onay yeter).
  - `status-dialog.tsx` `reason: null` sabiti → pasife alma/arşive gerekçe alanı (analiz §19-G).
  - `TB-104` (deftere işlendi): `MarkAllNotificationsRead` sezon süzgeci asimetrisi —
    `X-19` ile birlikte kapatılabilir (§0.2, §5).

## 15. Tur sonu defter muhasebesi

13 madde kapandığında defterden düşecekler: `TB-99`, `E-21`, `B-43`, `B-49`, `X-19`,
`TB-96`, `TB-97`, `E-22`, `B-44`, `B-46`, `B-45`, `TB-76`, `TB-77` → **51 − 13 = 38 açık**
(`TB-104` dahil; `X-19` ile birlikte kapatılırsa 37 + §13'ün `conflictCount` dar maddesi).
Kritik sayısı 12 → 4'e iner (kalan kritikler:
`TB-82`, `X-16`, `TB-48`, `X-17` — dördü de karar/ön koşul sınıfında). Özet tablosu, modül
dağılımı ve zincir şeması (`E-21`, `E-22` satırları silinir) buna göre yeniden yazılır.
