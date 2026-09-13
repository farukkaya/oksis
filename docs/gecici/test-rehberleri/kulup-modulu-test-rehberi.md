# Kulüp Modülü — Test Rehberi

**Hazırlandı:** 30 Ağustos 2026 · `feat/kulup-modulu` dalı, Faz 0-5 tamamlandıktan sonra
**Kapsam:** 34 uç (5 controller) + 4 bildirim olayı + 1 gece işi
**Kaynaklar:** `src/Oksis.Application/Modules/Clubs/ARCHITECTURE.md` ·
`docs/analysis/kulup-modulu-teknik-analiz.md` ·
`docs/superpowers/plans/2026-08-29-kulup-modulu-DEVIR.md`

---

## 1. ⚠️ ÖNCE BUNU OKU

**1) Kulüp verisi seed'de YOKTUR.** Dört okulda da sıfır kulüp var; test kulübü
açmakla başlar. Ödev/not modüllerinin aksine kulüp **ders programına bağlı
değildir** — tek koşul okulun yürürlükteki (`Active`) sezonudur ve o dört okulda
da var. Yani teorik olarak her okul test edilebilir.

**2) Yine de `s1` ile çalış.** İki nedenle:

| Neden | Ayrıntı |
| --- | --- |
| Mobil hızlı giriş | `DEV_ACCOUNTS` **`s1`'e sabit** (`login-screen.tsx:31`). Öğrenci/veli yüzü yalnız mobilde yaşıyor; başka okulda her girişte kimlik elle yazılır. |
| İki çocuklu veli | `veli.s1.001` hem **Caner Aydın (10-A)** hem **Serkan Aydın (12-A)** velisi. Veli özet ekranı (uç 31) ancak çok çocuklu velide ölçülür. |

**3) Öğrenci ve veli yüzü web'de YOKTUR — bu kusur değil.** `clubs-screen.tsx`
o iki rolde "Kulüpler şu an mobil uygulamada" kartı basar. Web = yönetici +
danışman; mobil = öğrenci + veli (+ danışman).

**4) `s1`'in dört hesabı da tek profillidir** (30 Ağustos'ta ölçüldü) — girişte
profil seçim ekranı çıkmaz. `s4`'te öğretmenler çift profilli, orada takılırsın.

---

## 2. Kullanıcı bilgileri

**Parola — hepsinde aynı:** `Oksis1234!` · hepsi `@oksis.local`

| Rol | E-posta | Kim | Ne için |
| --- | --- | --- | --- |
| **Yönetici** | `mudur.s1` | — | Kulüp açma/düzenleme/durum, okul geneli liste |
| Müdür yrd. | `mudyrd.s1` | — | İkinci yönetici (yetki farkı) |
| **Danışman** | `ogretmen.s1.01` | İbrahim Öztürk | **Ana danışman.** Kulüplerim, üye/başvuru, etkinlik, duyuru, roster |
| İkinci öğretmen | `ogretmen.s1.02` | Büşra Aydın | Kapsam kapısı testi (danışmanı olmadığı kulüp → 404) |
| **Öğrenci** | `ogrenci.s1.001` | Caner Aydın · 10-A | Keşif, katılma, etkinlik kaydı, geçmiş |
| Öğrenci 2 | `ogrenci.s1.002` | Leyla Özdemir · 10-B | Kontenjan/onay ikinci eli |
| Öğrenci 3 | `ogrenci.s1.003` | Eren Arslan · 11-A | Ret ve "dolu" hâli |
| Kardeş | `ogrenci.s1.051` | Serkan Aydın · 12-A | Velinin **ikinci** çocuğu |
| **Veli** | `veli.s1.001` | — | Caner + Serkan'ın velisi; salt-okunur |

---

## 3. Ortam

Hepsi **30 Ağustos 04:15 itibarıyla ayakta** — yeniden kurman gerekmez.

| Servis | Adres | Nasıl başlar |
| --- | --- | --- |
| API | `http://localhost:5112` | `export DOTNET_ROOT="$HOME/.dotnet"; export PATH="$HOME/.dotnet:$PATH"; dotnet run --project src/Oksis.Api` |
| Web (Next) | `http://localhost:3000` | `cd ../oksis-ui/apps/web && npm run dev` (mock kapalı, `/api/*` → 5112 proxy) |
| Mobil (Expo/Metro) | `http://localhost:8081` | `cd ../oksis-ui/apps/mobile && npx expo start` |
| Mobil → API | `http://192.168.1.100:5112` | `.env.local` + `scripts/lan-proxy.js` (cihaz/emülatör için) |
| Hangfire paneli | `http://localhost:5112/hangfire` | Gece işini elle tetiklemek için |
| Mailpit | `http://localhost:8025` | — |
| MSSQL | `localhost:1433` · `oksis_dev` | `sa` / `YourStrong!Pass2025` |

**Migration durumu:** kulübün beş migration'ı (`faz0`…`faz4_announcements`)
`oksis_dev`'e **uygulanmış**; `clubs.read/write/manage/join` izinleri, dört
`CLUB_*` olay tipi ve dört okulun `clubs` modül anahtarı (`is_enabled=1`)
veritabanında doğrulandı.

**Mobilde hangi cihaz:** iOS simülatöründe ekran görünür ama otomatik
dokunulamaz; elle test için ikisi de olur. Android'de `adb shell input tap`
çalışıyor. Tarayıcıdan ölçmek için `http://localhost:8081` (Expo web hedefi)
yeterlidir — **ama sayfayı yenilemek oturumu düşürür**, ekranlar arasında
uygulama içi gezinmek gerekir.

> ⚠️ **Bildirim akışı `s1`'de ÖLÇÜLEMEZ (30 Ağustos'ta ölçüldü):** `s1` ve `s4`'ün
> yürürlükteki sezonu **15 Eylül 2026'da başlıyor**; `GetMyNotifications` yalnız
> `CreatedAt >= sezon başlangıcı` satırlarını döndürüyor (B-06 kesmesi). Bugün
> üretilen her bildirim — kulüp, not, ödev fark etmez — kutuda **hiç görünmüyor**
> ve rozet `0` kalıyor. Bildirim yüzünü ölçmek için `s2` (sezon 3 Ağustos'ta
> başladı) veya `s3` kullan; kulüp bildiriminin gerçekten üretildiğini
> `notifications.notifications` tablosundan doğrulayabilirsin (kind 28-31).

---

## 4. Test akışları

Tel değerleri (gövdelerde bunlar geçer):

- **kategori:** `science` · `sports` · `art` · `music` · `culture` ·
  `technology` · `socialResponsibility` · `foreignLanguage` ·
  `entrepreneurship` · `other`
- **kulüp durumu:** `draft` · `active` · `inactive` · `archived`
- **katılım modu:** `open` (anında üye) · `approval` (danışman onaylar)
- **üyelik:** `pending` · `active` · `paused` · `rejected` · `left`
- **öğrenci kartı beş hâl:** `joinable` · `pending` · `member` · `full` · `closed`
- **etkinlik:** `draft` · `published` · `cancelled` · `completed`
- **yoklama:** `registered` · `present` · `absent` · `cancelled`

### A — Yönetici: kulüp aç ve yayına al (`mudur.s1`, web `/clubs`)

1. **Kulüpler** menüsünden yeni kulüp: ad "Bilim Kulübü", kategori `science`,
   danışman **İbrahim Öztürk**, kontenjan **2**, katılım **Onaylı**.
   → Kulüp **doğrudan Aktif** doğar (K-12: danışman varsa `Active`, yoksa `Draft`).
2. İkinci kulüp aç: "Satranç Kulübü", `sports`, danışman **yok**, kontenjan 10,
   katılım **Açık**. → **Taslak** doğar ve öyle kalır.
3. Üçüncü kulüp: "Müzik Kulübü", `music`, danışman İbrahim Öztürk, kontenjan 10,
   katılım **Açık**.
4. Listede ara (ad ve danışman soyadı ile — ikisi de çalışıyor), kategori ve
   duruma göre süz.
5. Bilim Kulübü'nü düzenle: açıklamayı değiştir.
6. **D1 anomalisini üret:** Müzik Kulübü'nü düzenle → danışmanı **Kaldır** → kaydet.
   Kulüp `Active` kalır ve danışmansızlaşır; öğrenci yüzünde `closed` olur.

**Beklenen:** Taslak kulüp öğrenci keşfinde **görünmez**. Danışmansız kulübün
kartında "başvuru açık" **yazmamalı** (D1/D8).

> ⚠️ **İki tuzak (30 Ağustos'ta ölçüldü):**
> - **Danışmansız kulüp aktifleştirilemez** — uç 409 `Clubs.InvalidState`
>   ("Danışman öğretmeni olmayan kulüp aktifleştirilemez") döner. Taslak kulübü
>   yayına almanın tek yolu danışman atamaktır ve **bunu yapan bir ekran yoktur**
>   (aşağıya bak).
> - **Web'de kulübü Aktif'e çeken aksiyon YOK.** "…" menüsü yalnız *Pasife al* ve
>   *Arşivle* taşır; `ClubStatusDialog` hedef olarak yalnız `inactive`/`archived`
>   tanıyor. Pasife alınan kulüp geri döndürülemiyor (diyalog "geri alınabilir"
>   dese de). Test sırasında aktifleştirme gerekiyorsa uç kullan:
>   `POST /clubs/{id}:changeStatus {"status":"active"}`.

### B — Danışman: üye ve başvuru (`ogretmen.s1.01`, web `/clubs`)

1. "Kulüplerim" ızgarasında **üç kulüp değil, ikisi** görünür (Satranç'ın
   danışmanı yok).
2. C akışından sonra dön: **Başvurular** sekmesinde Caner'i **onayla**,
   Eren'i **gerekçeyle reddet** (gerekçe 500 karakteri aşarsa 400 döner,
   kırpılmaz).
3. **Üyeler** sekmesi: onaylı öğrenci `active` görünür; reddedilen **üye
   listesinde yok**, başvuru listesinde `rejected`.
4. `ogretmen.s1.02` ile gir → aynı kulüp **404** (kapsam dışı, 403 değil).

### C — Öğrenci: keşif ve katılma (`ogrenci.s1.001`, **mobil**)

1. Kulüpler → **Keşfet**: üç aktif kulüp görünür. Kartlardaki hâl:
   Bilim `joinable`, Satranç **danışmansız** → `closed`,
   Müzik → pencere açılmadığı için `closed` ("1 Ekim'de açılıyor" notu).
2. Bilim Kulübü'ne **Katıl** → `pending` (onaylı mod). Sayaç artmaz.
3. **Kulüplerim** → bekleyen başvuru burada **görünmez** (yalnız üye kulüpler).
4. Aynı kulübe tekrar katılmayı dene → 409.
5. `ogrenci.s1.003` (Eren) da Bilim'e başvursun → B akışında reddedilecek.
6. B akışındaki onaydan sonra: kart `member`, "Kulüplerim"de görünür.
7. `ogrenci.s1.002` (Leyla) Bilim'e katılsın → kontenjan 2 dolduysa `full` /
   `Clubs.CapacityFull` 409.
8. **Ayrıl** → satır `left`, sayaç düşer, kart yeniden `joinable`.

### D — Etkinlik ve roster (danışman web + öğrenci mobil)

1. Danışman: Bilim Kulübü → **Etkinlik oluştur** (yarın, 14:00-16:00, yer "Lab",
   kontenjan 10) → **Taslak** doğar; öğrenci **görmez**.
2. **Yayınla** → öğrencinin mobilde "Yaklaşan etkinlikler"ine düşer,
   `CLUB_ACTIVITY_PUBLISHED` bildirimi yayınlanır.
3. Öğrenci **kaydol** → `registeredCount` artar; **kaydı iptal et** → aynı satır
   `cancelled` olur, ikinci satır doğmaz.
4. Danışman **Yoklama (roster)**: liste üye + kayıtlıları birleştirir; işaretle
   (`present`/`absent`) → kaydet. Gövdede olmayan satır **değişmez** (D12).
5. İkinci etkinlik aç, yayınla, sonra **iptal et** — gerekçe **15-500 karakter
   zorunlu**; kısa gerekçe 400 verir.

### E — Duyuru (`ogretmen.s1.01`)

1. Kulüp → **Duyuru yayınla** (başlık + içerik). Gövde alanı adı `content`.
2. Duyuru listesi **yayın anına göre azalan** sırada.
3. Öğrenci mobilde kulüp detayında duyuruyu görür; `CLUB_ANNOUNCEMENT_PUBLISHED`
   bildirimi düşer.
4. Duyuru **geri çekilemez** — geri alma ucu yoktur, bu tasarım.

### F — Veli (`veli.s1.001`, **mobil**)

1. **Çocuklarım özeti**: iki kart (Caner, Serkan) — her birinde kulüp sayısı,
   aktivite sayısı, saat toplamı.
2. Caner'in kulüplerine gir → üyelikler + yaklaşan etkinlikler.
3. Tek kulüp detayı → öğrencinin gördüğü DTO'nun aynısı, **düğmesiz**.
4. Kapsam testi: başka bir öğrencinin `studentId`'siyle çağır → **404**.
5. Veli hiçbir yerde katılamaz/ayrılamaz (salt-okunur).

### G — Geçmiş + gece işi (Hangfire)

> ⚠️ **Geçmiş tarihli etkinlik AÇILAMAZ** — hem ekran hem sunucu reddediyor
> ("Etkinliğin başlangıç anı geçmişte olamaz", `CreateClubActivityCommandHandler`).
> Sweep'i ölçmenin yolu **bugün birkaç dakika sonra başlayıp biten** bir etkinlik
> kurmak ve bitişini beklemektir.

1. Danışman **bugün, ~5 dakika sonrası** için kısa bir etkinlik oluştur
   (örn. 12:45–12:50) ve **yayınla**.
2. Roster'da öğrenciyi `Katıldı` işaretle.
3. Bitiş saati geçtikten sonra `http://localhost:5112/hangfire` → **Recurring jobs**
   → `clubs.complete-finished-activities` → **Trigger now**.
4. Etkinlik `completed`'a geçer; öğrencinin **Aktivite Geçmişi** ve velinin özet
   kartı aynı sayıyı söyler.

### H — Kapsam ve durum kapıları (en önemli tur)

| Kim | Ne | Beklenen |
| --- | --- | --- |
| Danışman olmayan öğretmen | Kulüp detayı / üye / başvuru | **404** |
| Öğretmen | Kulüp açma (`POST /clubs`) | **403** (`clubs.manage` yok) |
| Öğrenci | Taslak kulübün detayı | **404** |
| Öğrenci | Taslak etkinliğin detayı | **404** |
| Üye olmayan öğrenci | Yayında etkinliğe kaydolma | **404** |
| Öğrenci | Pasif kulübe katılma | **409** `Clubs.InvalidState` |
| Öğrenci | Kontenjanı dolu kulüp | **409** `Clubs.CapacityFull` |
| Danışman | Danışmansız kulübün başvurusunu onaylama | **409** (ret çalışır) |
| Danışman | `Draft` etkinliği iptal | **409** |
| Veli | Başka çocuğun kulüpleri | **404** |
| Veli | Katılma/ayrılma | **404** (uç yok) |

---

## 5. Bilinen sınırlar — bunları kusur sanma

1. **Öğrenci/veli web'de yok** (§1-3). Tasarım kararı, duyurular emsali.
2. **`CLUB_*` olaylarının `is_delivered` bayrağı `0`** — Ayarlar › Bildirimler'de
   dört kulüp satırı **"Hazırlanıyor"** rozetiyle çıkar, oysa handler'lar
   yazıldı. Bayrağı `true`'ya çeken migration henüz yok (DEVIR §5, Faz 5-b).
3. **Bildirim matrisinde push sütunu yok** (`E-20`) — kulüp push tercihini
   yönetici ekrandan açamaz; `CLUB_ACTIVITY_PUBLISHED` ve
   `CLUB_ANNOUNCEMENT_PUBLISHED` varsayılan **kapalı** gelir.
4. **Kulüp bildirimine dokunmak hiçbir yere gitmiyor** (`TB-96`) — FE
   çözümleyicisinde `clubs` kolu yok, `/clubs/{id}` derin bağlantısı `null`
   hedefe düşer.
5. **Kategori çipi** FE'de Türkçe etiketi tel değeri sanıyor (`TB-99`) —
   bilinmeyen değer sessizce "Diğer"e düşebilir.
6. **Ayarlar › Modüller'de `clubs` satırı adsız** — modül kataloğunda anahtar yok.
7. **`:apply` ucu yoktur** (D3) — katılma tek uçtur (`:join`), mod kulübün
   `joinMode`'undan okunur.
8. **`Paused` üyeliği yazan uç yok** (D7) — enum ve sayaç var, ekran yok.
9. **Geçen sezonun kulüpleri hiçbir listede görünmez** (K-1, sezon süzgeci elle).
10. **Sıralama ayrışması:** "Kulüplerim" bellekte `tr-TR`, keşif/yönetici listesi
    SQL harmanlamasıyla sıralanır — aynı iki kulüp iki listede farklı sıralanabilir.
11. **Etkinlik geçmiş tarihe açılabilir** — bilinçli (G akışı bunu kullanır).
12. **`ClubActivityCompletedEvent` ve `ActivityRegistrationCreatedEvent`
    tüketicisizdir** — bildirim üretmezler.

---

## 6. Hızlı API duman testi (ekransız)

Çalışan tam zincir: `docs/testing/` dışında, oturum çalışma dosyasında duruyor;
özeti:

```bash
API=http://localhost:5112/api/v1
tok() { curl -s -X POST $API/auth/account/login -H 'Content-Type: application/json' \
  -d "{\"identifier\":\"$1\",\"password\":\"Oksis1234!\",\"channel\":\"web\"}" \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['accessToken'])"; }

ADM=$(tok mudur.s1@oksis.local)
curl -s -H "Authorization: Bearer $ADM" $API/clubs                 # okul geneli liste
curl -s -H "Authorization: Bearer $ADM" $API/clubs/advisor-options # danışman havuzu
```

⚠️ **zsh tuzağı:** `"$ID:approve"` yazma — zsh `:a` değiştiricisini uygular ve
URL'yi mutlak dosya yoluna çevirir (404 alırsın). **`"${ID}:approve"`** yaz.
Aynı tuzak `:register`, `:cancel`, `:changeStatus` için de geçerli değil ama
alışkanlık olarak süslü parantez kullan.

⚠️ Çift profilli hesapta (`s4` öğretmenleri) giriş gövdesine
`"profileType":"Teacher"` eklenmezse `accessToken` **boş** döner ve her uç 401 verir.

---

## 7. Uçtan uca test sonucu (30 Ağustos)

Rehberdeki akışların tamamı `s1`'de (bildirim ayağı `s2`'de) koşuldu; bulgular
**Bulgu Kayıt Defteri §28**'de: `B-43`…`B-49`, `E-21`, `E-22`, `X-19`, `TB-103`,
`D-17`, `D-18`. Test sırasında ortaya çıkan rehber hataları yukarıdaki ⚠️
kutularına işlendi. En ağır üçü:

1. **`E-22`** — kulüp duyurusunu öğrenci de veli de okuyamıyor (uç 18 üyeye 404,
   ekran yok, bildirim yalnız başlığı taşıyor).
2. **`E-21`** — kulübü yayına alan ekran yok; taslak kulüp ekrandan asla
   aktifleşmiyor, pasife alınan kulüp geri dönmüyor.
3. **`X-19`** — yürürlükteki sezon ileri tarihte başlıyorsa bildirim kutusu tüm
   modüllerde boş kalıyor.

## 8. Hazırlık turunda bulunanlar (30 Ağustos)

- **`TB-102` (düzeltildi, commit edilmedi):** `ClubAnnouncementReader` DI'ye
  kaydedilmemişti; API **hiç açılmıyordu**
  (`Unable to resolve service ... ClubAnnouncementReader`). Kayıt
  `DependencyInjection.cs`'e eklendi.
- `s4` (OKSİS Test Lisesi) üzerinde 34 ucun ana zinciri curl ile koşuldu ve
  yeşil: kulüp aç → aktif → başvuru → onay → üye → etkinlik → yayın → kayıt →
  roster → duyuru → geçmiş → veli özeti. Duman kulüpleri sonra **arşivlendi**.
- `s4` öğrencilerinin `section` alanı boş dönüyor; **veri**, kusur değil —
  o öğrenciler yürürlükteki sezonda hiçbir şubeye bağlı değil. `s1`'de dolu gelir.
