# Kulüp Üye Kabul Sorumlusu — Tercih Dönemi ve İdare Yerleştirmesi · Plan

> **Durum:** D1–D7 uygulandı (2026-10-12) — `oksis-api` `b415d6fc`, `oksis-ui` `36711ea`, dal `feature/kulup-tercih-yerlestirme` (henüz `dev`'e birleşmedi). D8 (Excel çıktısı, K-13) açık. Uygulamada netleşenler §11'de.
> **Kapsam:** `oksis-api` (backend) · `oksis-ui/apps/web` (idare, danışman) · `oksis-ui/apps/mobile` (öğrenci, veli, danışman).
> **Dayanak:** kod taraması `oksis-api` `78da8a03`, `oksis-ui` güncel `main`; domain notları [[Kulüpler]], [[Kulüp]], [[Kulüp Üyeliği]]; kulüp saati tasarımı `teknik-analizler/ders-programi/kulup-saati.md`.
> **Kararlar:** §9'da.

---

## 0. Tek paragrafta

Okul ayarlarına **"Kulüp Üye Kabul Sorumlusu"** ayarı eklenir: **Öğretmen** (bugünkü akış, varsayılan) ya da **İdare**.

- **Sezona bağlı bir kayıt değildir;** değeri okul ayarında durur ve değiştirilmedikçe her sezon aynen sürer.
- **Yalnız sezon açma sihirbazında seçilir;** sezon içinde değişmez, Ayarlar'da salt okunur görünür.

İdare seçiliyse süreç şöyle işler:

1. Öğrenci kulübe doğrudan katılamaz ya da başvuramaz.
2. İdare sezonun **tek tercih dönemini** oluşturur ve hazır olduğunda **"Tercihe Aç"** der.
3. Öğrenciler **sıralı 3 kulüp** tercih eder.
4. İdare **"Tercihi Kapat"** der.
5. **Yerleştirme** ekranında tercihlere göre **otomatik yerleştirme** yapılır. Taşan kulüpte **tercihini önce kaydeden** kazanır.
6. İdare sonucu elle düzeltir; gerekirse kontenjanı da aşabilir.
7. İdare çalışmayı **kaydeder** (taslak) ve hazır olduğunda ayrı bir jestle **yayınlar**.

Yayından sonra sonradan gelen ya da yerleşemeyen öğrenciyi idare aynı ekranda elle yerleştirir; yalnız **fark** yayınlanır.

Bu iş, kulüp saati tasarımının iki kararıyla doğrudan örtüşür:

- **tek üyelik** (karar 3);
- **"kulüp saati olan sınıflarda her öğrenci bir kulübe üye olmak zorundadır"** (karar 6).

Bugün karar 6'yı sağlayan bir araç yok, yalnız hazırlık uyarısı var. Yerleştirme ekranı bu boşluğu kapatır.

---

## 1. Ayar

### 1.1 Ad

| | Karar |
|---|---|
| Ekrandaki ad | **Kulüp Üye Kabul Sorumlusu** |
| Seçenek 1 (varsayılan) | **Öğretmen** — "Öğrenci kulübe başvurur, danışman öğretmen onaylar" |
| Seçenek 2 | **İdare** — "Öğrenci tercih döneminde 3 kulüp seçer, idare yerleştirir" |
| Kod adı | `SchoolSettings.ClubAdmissionMode` · enum `ClubAdmissionMode { Advisor = 0, Administration = 1 }` |
| Tel değeri | `clubAdmissionMode: "advisor" \| "administration"` |

Ad, seçeneklerin cevap verdiği soruyu doğrudan söyler: sorumlu **İdare** mi, **Öğretmen** mi. Sürecin şeklinin de değiştiği bilgisi (başvuru ↔ tercih) seçeneklerin alt satırındaki açıklamadadır.

### 1.2 Nerede seçilir, nerede görünür

- **Seçim: sezon açma sihirbazı** (web `features/academic-sessions/wizard.tsx`). Sihirbaza "Kulüpler" adımı (ya da mevcut bir adıma bir alan) eklenir. Önceki değer varsayılan gelir, yani değiştirilmedikçe her sezon aynı davranış sürer.
  - Backend'de değer `SeasonDraft`'ta taslak olarak durur.
  - Sezon **aktifleşirken** (`ActivateAcademicSession`; rollover da bu handler'dan geçer) **aynı işlemde** `SchoolSettings`'e yazılır.
  - *Uygulama notu (2026-10-12):* ilk tasarım `OpenSeasonFromDraft` anıydı. Açılan sezon "Setup" durumunda doğar ve eski sezon aktivasyona kadar aktif kalır; mod o an yazılsaydı eski sezon sezon ortasında yeni modla çalışırdı (K-3 ihlali). Yazım aktivasyona taşındı.
- **Görüntüleme: Ayarlar › Akademik Politikalar › "Kulüp Politikası" kartı, salt okunur.** Ödev ve Sınav politikası kartlarının yanında durur. Kartın içeriği:
  - "Kulüp Üye Kabul Sorumlusu: İdare";
  - altında seçilen modun bir cümlelik açıklaması;
  - "Sezon açılırken seçilir; bir sonraki sezonda değiştirebilirsiniz" notu ve sihirbaza bağlantı;
  - yan kartta `AUsedIn` ("Kulüpler › Başvurular" ya da "Kulüpler › Tercih ve Yerleştirme").
- **Mobil:** idarenin mobil okul ayarlarında gösterilmez. İdarenin kulüp işi web'dedir.

### 1.3 Davranış kuralları

- **Sezon içinde değişmez.** Değişim yalnız yeni sezon açılırken olur. Bu yüzden "bekleyen başvurular sahipsiz kalır" ya da "açık tercih dönemi varken mod döner" senaryoları **doğmaz**; bunlar için ayrı bir kapı yazılmaz.
- **Önceki sezonun kayıtları etkilenmez.** Mod değişse de geçen sezonun üyelikleri ve başvuruları kendi sezonunda kalır.
- **Varsayılan Öğretmen.** Migration `HasDefaultValue(Advisor)` ile mevcut okulların bugünkü davranışını korur. Sezonu zaten açık olan okul İdare'ye ancak **bir sonraki sezon açılışında** geçebilir; ilk sezon için istisna yoktur (karar K-17). Bugünkü bütün okullar bu sezonu Öğretmen moduyla tamamlar.
- **Okuma izni:** `school-settings.view` ve `clubs.read`. Ayrı bir yazma ucu **yoktur**; yazma, sezon sihirbazının izniyle yapılır. Öğrenci ve veli modu ayrı bir uçtan değil, kulüp ekranlarının yanıtındaki bloktan öğrenir (§4.4).
- **Önbellek:** alan `ISchoolSettingsReader` üzerinden okunacaksa, sezon açılışında önbellek düşürülür.

---

## 2. Mod: Öğretmen (bugünkü akış)

**Hiçbir şey değişmez.** Bugünkü gibi çalışanlar:

- katılma, başvuru, onay/ret ve ayrılma;
- açık kulüp (`Open`) ve başvuru penceresi;
- kontenjan, tek üyelik ve kulüp saati kapsamı.

Bu modda tercih dönemi ve yerleştirme ekranı **görünmez**; uçları 409 döner (`Clubs.AdmissionByAdvisor`).

---

## 3. Mod: İdare — süreç

### 3.1 Akış

```
 İDARE (web)                         ÖĞRENCİ (mobil)                 VELİ (mobil)   DANIŞMAN
 ─────────────────────────────────────────────────────────────────────────────────────────────
 ⓪ Sezon sihirbazında "İdare" seçilmiş (sezon boyunca sabit)
 ① Sezonun tercih dönemini oluşturur
   (Hazırlık: kimse görmez; isteğe bağlı hedef son gün)
        │
 ② [Tercihe Aç] ── ayrı jest ──► 🔔 "Kulüp tercih dönemi açıldı"
        ▼
 ③ İzler: kaç öğrenci tercih     ④ 3 kulübü sıralar, kaydeder;
   yaptı, kulüp başına talep       dönem açıkken değiştirebilir
   (değiştirirse sırası yenilenir)
   [Tercih yapmayanlara hatırlat] ─► 🔔 hatırlatma (yalnız tercih yapmamışlara)
        │
 ⑤ [Tercihi Kapat] ── ayrı jest ─► öğrenci ekranı salt okunur
        │                            (yayın yapılmadıysa [Yeniden Aç] mümkün)
        ▼
 ⑥ YERLEŞTİRME ekranı
   ⑦ "Otomatik yerleştir" ─► taslak dolar (önce kaydeden önce; elle düzenlenenler korunur)
   ⑧ Elle düzeltme (başka kulübe al, yerleşmeyenleri ata; kontenjan aşılabilir, uyarı)
   ⑨ "Kaydet" ─► taslak sunucuda; sayfa kapanırsa iş kaybolmaz
   ⑩ "Yayınla" ─► önizleme (N yeni üyelik, M değişiklik, K yerleşmemiş, aşan kulüpler)
        │            onay
        ▼
   Üyelikler üretilir ──────────► 🔔 "X kulübüne yerleştirildin"  🔔 "Çocuğunuz…"  🔔 "Kulübünüze N öğrenci…"
        │
 ⑪ Yayın sonrası: sonradan gelen ya da yerleşmeyen öğrenciyi idare AYNI ekranda elle yerleştirir;
   taslak ≠ yayın farkı rozetle görünür, "Yayınla" yalnız farkı uygular
   ─► 🔔 yalnız etkilenen öğrenciye/velisine ve ilgili danışmanlara
```

### 3.2 Tercih dönemi (Kulüp Tercih Dönemi)

- **Sezona bağlıdır** ve **bir sezonda tek dönem vardır** (karar K-6). Tekillik indeksle korunur (okul × sezon). Sonradan gelen ya da yerleşemeyen öğrenci ikinci bir dönemle değil, idarenin elle yerleştirmesiyle çözülür (§3.4).
- **Tercihe açma ve kapatma ayrı jestlerdir, tarihten türemez** (karar K-16). İdare dönemi oluşturur, kulüpleri ve kontenjanları hazırlar, hazır olduğunda **"Tercihe Aç"** der. Yeterli tercih toplanınca **"Tercihi Kapat"** der. Tarih geçti diye kendiliğinden açılan ya da kapanan bir şey yoktur; zamanlanmış işe de bağlı değildir.
- **Durumlar:** *Hazırlık* (oluşturuldu, öğrenci görmez) → *Tercihe açık* → *Tercihe kapalı* → *Yayınlandı* (en az bir yerleştirme yayını yapıldı). Durum kalıcı alandır ve her geçiş, açılış/kapanış anını ve yapan kişiyi yazar.
- **Yeniden açma** (karar K-14): kapalı dönem, **yayın yapılmadıysa** "Yeniden Aç" ile tekrar tercihe açılabilir (geç kalanlar, son dakika eklenen kulüp). Yayından sonra açılamaz.
- **Hedef son gün** (karar K-15, isteğe bağlı, yalnız bilgi):
  - idare bir "son gün" yazabilir;
  - öğrenci ekranında ve bildirimde "Son gün 22 Eylül" diye görünür;
  - tarih geçince idareye "kapatmayı unutmayın" rozeti çıkar;
  - **dönemi kapatmaz**.
- **Alanlar:** durum, açılış/kapanış anı ve yapan, isteğe bağlı hedef son gün, tercih sayısı (**3, kodda sabit**, karar K-12; geçmiş kayıtlar bozulmasın diye kolonda tutulur), yayın anı, yayınlayan, sürüm damgası.
- **Silme:** yalnız *Hazırlık* durumundaki (hiç açılmamış) dönem silinebilir.
- **Kapsam (kimler tercih yapar):** iki koşul birlikte aranır.
  - Öğrenci kulüp saati kapsamındadır (`ClubHourScope`; okulda kulüp saati yoksa sezonda kaydı olan herkes).
  - Sezonda canlı üyeliği **yoktur**. Üyeliği olan öğrenci tercih ekranında "X kulübünün üyesisin" görür ve tercih yapamaz (karar K-5).
- **Seçilebilir kulüpler:** sezonun **aktif** kulüpleri. Taslak, pasif ve arşiv kulüp listede yoktur. Danışmansız aktif kulüp seçilebilir (karar 0015 ile tutarlı). Kulübün `JoinMode` ve başvuru penceresi bu modda **yok sayılır**; kontenjan yerleştirmede kullanılır.

### 3.3 Öğrencinin tercihi

- Tek kayıt: dönem × öğrenci; içinde **sıralı 3 kulüp**. Aynı kulüp iki sırada olamaz.
- **Aktif kulüp sayısı 3'ten azsa** öğrenci o sayıda seçer.
- Dönem açıkken istediği kadar değiştirebilir. **Her değişiklik kayıt anını yeniler** (karar K-4): sıradaki yerini kaydettiği **son** ana göre alır. Böylece "önce yer kap, sonra rahatça değiştir" açığı kapanır. Ekran bunu kaydetmeden önce söyler: "Değiştirirsen sıradaki yerin yenilenir."
- Dönem kapanınca tercih **salt okunur** olur.
- Tercih bir üyelik **değildir**; `ClubMembership` tablosuna yazılmaz. Tek üyelik kuralı (Pending dâhil canlı satır) birden çok sıralı tercihi zaten engellerdi. Tercihler ayrı tabloda yaşar ve kulübün sayacına, keşif hâline ya da danışmanın listesine dokunmaz.
- **Veli tercih yapamaz ve tercih sürecini görmez; yalnız sonucu görür** (karar K-8). Bu, bugünkü "veli sürecin adımlarını değil sonucunu görür" ilkesiyle aynıdır (bekleyen başvuru da veliye görünmüyor).

### 3.4 Yerleştirme ekranı ve otomatik yerleştirme

**Ekranın evreni canlı türetilir:** dönemin kapsamındaki **bütün** öğrenciler, tercih yapmış ya da yapmamış. Sonradan okula gelen öğrenci tabloda kendiliğinden "tercih yok · yerleşmedi" olarak görünür. Bu, karar 6'nın ("herkes bir kulübe") izlenebilir olmasını ve tek dönem kararının (K-6) işlemesini sağlar.

**Satırın taşıdıkları:**

- taslak kulüp ve yayınlanmış kulüp;
- eşleşen tercih sırası (1/2/3 ya da "tercih dışı");
- kaynak (otomatik/elle);
- **kilit**: elle yapılan değişiklik satırı kendiliğinden kilitler. Bu, sınav oturma düzenindeki `IsManuallySwapped` emsalidir.

**Otomatik yerleştirme algoritması** — sıralı tercih, **önce kaydeden önce** (karar K-4):

1. **Kalan kontenjan:** kontenjan − (bu dönemin dışındaki aktif üyeler) − (kilitli atamalar). Kontenjanı boş olan kulüp sınırsızdır. Otomatik yerleştirme kontenjanı **aşmaz**; aşmak yalnız idarenin elle yapabildiği bir istisnadır.
2. **Tur k = 1, 2, 3:** her kulüp için, k. tercihi bu kulüp olan ve henüz yerleşmemiş öğrenciler aday olur. Kalan yer adaylara yetiyorsa hepsi yerleşir. Yetmiyorsa adaylar **son kayıt anına** göre sıralanır (önce kaydeden önce) ve kalan yer kadarı yerleşir. Aynı ana düşen iki kayıtta eşitliği öğrenci kimliği bozar; böylece sonuç her koşuda aynıdır.
3. Üç turdan sonra kalanlar **yerleşmedi** olarak işaretlenir.
4. **(Seçenek, ayrı düğme)** "Yerleşmeyenleri ve tercih yapmayanları boş kontenjanlara dağıt": her öğrenci, o an en çok boş yeri olan kulübe atanır. Karar 6 gereği her öğrencinin bir kulübe girmesi gereken okul için tek tıklık tamamlama sağlar.

**Senkron hesap.** Okul ölçeğinde (yüzlerce–birkaç bin öğrenci, onlarca kulüp) hesap bellekte milisaniyeler sürer. Nöbet ve ders programındaki gibi Hangfire işine ve yoklamaya gerek yoktur; tek uç, tek yanıt.

**Kaydet ve Yayınla ayrıdır:**

- **Kaydet:** satırların taslak hâlini yazar. Sunucuda kalıcıdır; tarayıcı kapanınca iş kaybolmaz. Hiçbir öğrenci ya da danışman bir şey görmez, bildirim gitmez.
- **Yayınla:** önce sunucudan **fark önizlemesi** alınır: yeni üyelik, kulüp değişikliği, üyelikten çıkarılan ve yerleşmeyen öğrenci sayısı, **kontenjanı aşan kulüpler** ve bildirim gidecek kişi sayısı. Onaylanınca:
  - yeni yerleşen için `ClubMembership` **Active** doğar; karar anı ve karar veren dolar, böylece "bir insan karar verdi" semantiği korunur (bkz. [[Kulüp Üyeliği]]);
  - kulübü değişen öğrencinin eski üyeliği **Left** olur, yeni kulüpte Active doğar;
  - taslakta kulübü boşaltılan öğrencinin üyeliği **Left** olur;
  - sayaçlar `IsActiveMember` sözleşmesiyle güncellenir; tümü **tek `SaveChanges`** içinde yazılır;
  - taslak, yayınlanmış hâle kopyalanır.
- **Yayın yalnız tercihe kapalı dönemde yapılır.** Dönem açıkken otomatik yerleştirme ve Kaydet çalışır (idare ön çalışma yapabilir), ama Yayınla "önce tercihi kapatın" gerekçesiyle kapalıdır: öğrenci tercihini değiştirirken sonuç yayınlanmasın.
- **Kontenjan aşılabilir** (karar K-7), yalnız idarenin elle ataması ile:
  - Ekranda aşan kulüp **uyarı** olarak görünür ("24/20"); yayın yapılabilir.
  - Domain'deki kontenjan kapısı (`Club.IncrementMemberCount`) bugün dolu kulüpte reddediyor. Yerleştirme yayını için kapıyı **bilinçli olarak** atlayan ayrı bir domain metodu yazılır (örn. `AdmitByPlacement`). Kulübün Active olma şartı korunur; atlanan yalnız kontenjan kontrolüdür.
  - Öğretmen modundaki katılma ve onay kapısı aynen kalır.
  - Kulüp kartı aşımda "dolu" ve "24/20" gösterir.
- **Eşzamanlılık:** iki idareci aynı ekranda çalışabilir. Dönem satırının sürüm damgası Kaydet ve Yayınla'yı korur; bayat kayıt 409 alır ve "başka biri değiştirdi, yenileyin" denir.
- **Kulüp saati etkinlikleri:** yayından sonraki ilk hizalamada yeni üyeler kendiliğinden kayıtlı eklenir. Aynı gün yoklamada eksik çıkmaması için yayın, bugünün hizalamasını da tetikler (`ClubHourActivitySync.SyncAsync`).

### 3.5 İdare modunda değişen mevcut davranışlar

| Yer | Öğretmen modu | İdare modu |
|---|---|---|
| `:join` (öğrenci) | bugünkü gibi | **409** `Clubs.AdmissionByAdministration` — "Kulüplere yerleştirmeyi idare yapar." |
| `:approve` / `:reject` | danışman/idare | **409** (İdare modunda bekleyen başvuru doğmaz) |
| `:leave` (öğrenci) | bugünkü gibi | **409**; değişikliği idare yerleştirme ekranından yapar (karar K-9). Kulüp saati zorunlu üyeliği öğrencinin kendi eliyle bozulmaz. |
| Keşif hâli (`ClubStudentStateResolver`) | 5 durum | 5 durum **korunur**; katılınamayan kulüpler "kapalı" ve gerekçesi "idare yerleştirir" olur. Yanıta mod ve dönem bilgisini taşıyan bir **kabul bloğu** eklenir (§4.4). |
| Kulüp formu (idare) | katılım şekli + başvuru penceresi | bu iki alan gizlenir, "Bu sezon kabulü idare yapar" notu çıkar; değerler silinmez |
| Danışmanın başvuru şeridi/ekranı | var | gizli; bilgi bandı |
| Hazırlık kontrolü "kulüpsüz öğrenci" | uyarı | uyarı + yerleştirme ekranına bağlantı |

Modun okunduğu ve kararın verildiği **tek yer** `ClubSeasonRules`'a eklenecek bir kapıdır (örn. `ClubAdmissionGate`). `:join`, karar uçları, `:leave`, keşif hâli, tercih ve yerleştirme uçları ondan beslenir. Böylece ekran "katıl" derken ucun 409 dönmesi (TB-32) engellenir.

---

## 4. Backend işleri (`oksis-api`)

### 4.1 Domain ve kalıcılık

| # | İş | Not |
|---|---|---|
| B1 | `SchoolSettings.ClubAdmissionMode` + `ApplyClubAdmissionMode()` | enum emsali `AnnouncementModeration`; `HasConversion<int>()`, `HasDefaultValue(Advisor)` |
| B2 | `SeasonDraft.ClubAdmissionMode` (taslak alan) + sezon aktivasyonunda `SchoolSettings`'e yazım (`SeasonClubAdmissionModeApplier`) | aynı işlem; sihirbaz önceki değeri varsayılan getirir |
| B3 | `ClubPreferenceRound` (Kulüp Tercih Dönemi) aggregate | okul × sezon **tekil**; durum ve `Open()`, `Close()`, `Reopen()`; açılış/kapanış anı ve yapan, hedef son gün, tercih sayısı, yayın anı/yapan, `RowVersion` |
| B4 | `ClubPreference` (Öğrenci Tercihi) | dönem × öğrenci tekil; sıralı 3 kulüp kimliği; **son kayıt anı** (sıralama ölçütü) |
| B5 | `ClubPlacement` (Yerleştirme Satırı) | dönem × öğrenci tekil; taslak kulüp, yayınlanmış kulüp, eşleşen sıra, kaynak, kilit |
| B6 | `ClubMembership.CreatePlaced(...)` + `Club.AdmitByPlacement()` | üyelik Active doğar, karar anı + karar veren dolu; yeni durum **eklenmez** (indeks filtresi değişmez); kulüp metodu kontenjanı bilerek atlar, Active şartını korur |
| B7 | Migration | tablolar/kolonlar, tekil indeksler, FK `Restrict` |

`ClubPlacement` bir "yerleştirme" satırıdır, üyelik değildir. Yayınlanınca üyelik üretir ama onun yerine geçmez. Böylece [[Kulüp Üyeliği]]'nin "başvuru ve üyelik tek kayıt" kararı (0014) bozulmaz; tercih ve yerleştirme üyeliğin **öncesidir**.

### 4.2 Uçlar

**Sezon sihirbazı** — mevcut uçlar genişler, yeni uç yoktur. `SaveSeasonDraft` gövdesine `clubAdmissionMode`, sezon taslağı okumasına aynı alan eklenir. Değer sezon aktifleşirken okula yazılır.

**Ayar okuma**

| Uç | İş |
|---|---|
| `GET api/v1/school-settings/club-settings` | mevcut mod (salt okunur kart için) |

**İdare (web) — `clubs.manage`**

| Uç | İş |
|---|---|
| `GET  api/v1/clubs/preference-round` | sezonun dönemi (yoksa boş) |
| `POST api/v1/clubs/preference-round` | dönem oluştur. 409: İdare modu değilse ya da sezonda dönem zaten varsa |
| `PUT  api/v1/clubs/preference-round/{id}` | hedef son günü düzenle |
| `POST api/v1/clubs/preference-round/{id}:open` | **Tercihe Aç** (Hazırlık ya da yayınlanmamış Kapalı → Açık); "açıldı" bildirimi |
| `POST api/v1/clubs/preference-round/{id}:close` | **Tercihi Kapat** (Açık → Kapalı); diğer idarecilere özet bildirimi |
| `POST api/v1/clubs/preference-round/{id}:remind` | tercih yapmayanlara hatırlatma gönder |
| `DELETE api/v1/clubs/preference-round/{id}` | yalnız **Hazırlık** durumundaki dönem |
| `GET  …/{id}/overview` | katılım sayıları; kulüp başına 1./2./3. tercih sayısı, kontenjan, mevcut üye |
| `GET  …/{id}/placements` | yerleştirme tablosu (+ süzgeçler: şube, kulüp, durum) |
| `POST …/{id}/placements:auto` | otomatik yerleştir `{ keepLocked, fillUnplaced }` → taslak güncellenir ve döner |
| `PUT  …/{id}/placements` | **Kaydet**: değişen satırlar `[{studentId, clubId?, locked}]` + sürüm |
| `GET  …/{id}/placements/diff` | yayın önizlemesi (aşan kulüpler dâhil) |
| `POST …/{id}:publish` | **Yayınla** (sürümle) |
| `GET  …/{id}/placements:export` | Excel (D7 sonrası, karar K-13) |

**Öğrenci (mobil) — `clubs.join` / `clubs.read`**

| Uç | İş |
|---|---|
| `GET api/v1/students/me/clubs/preference` | dönem (Hazırlık hariç) + durum + seçilebilir kulüpler + kendi tercihi + (yayınlandıysa) sonucu |
| `PUT api/v1/students/me/clubs/preference` | sıralı 3 kulüp kaydet (dönem açık değilse 409); kayıt anı yenilenir |

**Veli** — yeni uç **yok** (karar K-8: yalnız sonuç). Yayından sonra çocuğun kulübü, mevcut "çocuğun kulüpleri" uçlarında zaten görünür.

### 4.3 Kurallar ve kapılar

- **`ClubAdmissionGate`** (tek yer): modu okur; `:join`, `:approve`/`:reject`, `:leave`, keşif hâli, tercih ve yerleştirme uçları buradan beslenir.
- Sezon süzgeci her sorguda elle yazılır (modülün kuralı). Sezonsuz okulda okuma boş döner, yazma 409 döner.
- Tercih kaydında üç şey doğrulanır: kulüpler sezonun aktif kulüpleridir, tekrar yoktur, öğrenci kapsamdadır.
- Yayın tek işlemde yapılır. Tek üyelik son savunması indekstedir; kontenjan yayında bilerek atlanır (K-7).
- Hata kodları `Clubs.` önekiyle: `Clubs.AdmissionByAdministration`, `Clubs.AdmissionByAdvisor`, `Clubs.PreferenceRoundNotOpen`, `Clubs.PreferenceRoundExists`, `Clubs.PublishWhileOpen`, `Clubs.PlacementStale` (409).

### 4.4 Mevcut uçlara eklenecek

- **Öğrenci yanıtlarına `admission` bloğu:** keşif, öğrenci detayı ve "Kulüplerim" yanıtına `{ mode, round?: { id, status, targetEndOn? }, myPreferenceSubmitted, placementPublished }` eklenir. Mobil banner'ı ve "Tercih Et" düğmesi buradan çizilir; istemci kendi kararını üretmez. Hazırlık durumundaki dönem öğrenciye hiç dönmez.
- **Danışman yanıtlarına `admissionMode`:** danışmanın kulüp listesine ve panel yanıtına eklenir; başvuru şeridini gizlemek için kullanılır.

### 4.5 Arka plan işi

**Gerekmez.** Açma ve kapama idarenin jestleridir. Bildirimler o jestlerin domain olaylarından anında üretilir: "açıldı" ve "kapandı" `ClubPreferenceRoundOpenedEvent` ve `…ClosedEvent` olaylarından, hatırlatma `:remind` komutundan. "İş çalışmadı, dönem açılmadı" türünden bir hata yolu da ayrı bir hatırlatma kayıt tablosu da yoktur.

Olay kimlikleri:

- açılış ve kapanış: `round + kind + açılış sırası`. Yeniden açılan dönem yeni bir "açıldı" bildirimi üretir; aynı jestin retry'ı üretmez.
- hatırlatma: `round + student + gün`. Aynı gün ikinci "Hatırlat" basışı aynı öğrenciye ikinci bildirim göndermez; düğme gerekçesiyle pasifleşir.

### 4.6 Testler

- **Birim:**
  - algoritma: kontenjan, önce kaydeden önce, eşitlikte kimlik, kilitlerin korunması, 3'ten az kulüp, sınırsız kontenjan, dağıt seçeneği;
  - mod kapısı;
  - dönem durum geçişleri: aç, kapat, yeniden aç, yayından sonra yeniden açılamaz, Hazırlık dışında silinemez;
  - sihirbazın modu sezon açılışında yazması.
- **Entegrasyon (gerçek SQL):**
  - yayının tek işlemde üyelik ve sayaç üretmesi;
  - kontenjan aşan elle atamanın yayınlanması;
  - ikinci yayının yalnız farkı uygulaması;
  - eşzamanlı Kaydet (409);
  - tekil indeksler (okul × sezon tek dönem; dönem × öğrenci).
- **Mimari bekçiler:** `NotificationKindContinuityTests`, `PushEventKeyMapTests`, `NotificationCatalogPushTests`, `NotificationKindMetadataTests`.

---

## 5. Bildirimler — hangi aşamada kime ne

### 5.1 Ölçüt

Kulüp modülünde yerleşmiş ölçüt korunur: **push, kilit ekranına düşen bir kesintidir.** Varsayılanı yalnız **eyleme çağıran** ya da **kişinin beklediği sonucu taşıyan** olaylarda açıktır; haber niteliğindekiler uygulama içinde kalır. K-34'ten beri okul düzeyinde push matrisi yok; kapı, katalog varsayılanı ve alıcının kendi tercihidir.

Gövdeler PII'sızdır; öğrenci adı yalnız veliye giden mesajda bulunur (çok çocuklu veli için). **Veliye yalnız sonuç bildirimleri gider** (karar K-8).

### 5.2 Tablo

| # | Aşama | Alıcı | Başlık / gövde (öneri) | Uygulama içi | Push varsayılanı | Bağlantı |
|---|---|---|---|---|---|---|
| N1 | Tercih dönemi **açıldı** (idare "Tercihe Aç" der) | kapsamdaki, üyeliği olmayan **öğrenciler** | "Kulüp tercih dönemi açıldı" / "Uygulamadan 3 kulüp seç." (hedef son gün varsa: "Son gün 22 Eylül.") | ✔ | **Açık** (eyleme çağırır) | tercih ekranı |
| N2 | **Hatırlatma** (idare "Tercih yapmayanlara hatırlat" der) | yalnız **tercihini kaydetmemiş** öğrenciler | "Kulüp tercihini henüz yapmadın" (hedef son gün varsa tarihle) | ✔ | **Açık** | tercih ekranı |
| N3 | Tercih dönemi **kapandı** (idare "Tercihi Kapat" der) | **diğer idareciler** | "Kulüp tercih dönemi kapandı" / "340 öğrenciden 312'si tercih yaptı. Yerleştirme bekliyor." | ✔ | Kapalı | web yerleştirme ekranı |
| N4 | Yerleştirme **yayınlandı** — yerleşen | **öğrenci** | "Kulübün belli oldu" / "Robotik Kulübü'ne yerleştirildin (1. tercihin)." | ✔ | **Açık** (beklenen sonuç) | kulüp detayı |
| | | **veli** | "Ayşe, Robotik Kulübü'ne yerleştirildi." | ✔ | **Açık** | çocuğun kulüp ekranı |
| N5 | Yerleştirme yayınlandı — **yerleşmeyen** | yalnız **öğrenci** | "Kulüp yerleştirmen henüz tamamlanmadı" / "İdare seni bir kulübe yerleştirecek." | ✔ | Kapalı (kaygı üretir, eylem yok) | tercih ekranı |
| N6 | Yerleştirme yayınlandı — **danışman** | öğrenci giren/çıkan kulüplerin danışmanları | "Kulübünüze 24 öğrenci yerleştirildi" | ✔ | Kapalı (haber) | danışman paneli |
| N7 | **Yayın sonrası değişiklik** (elle yerleştirme, tekrar yayın) | yalnız **kulübü yeni belirlenen / değişen / çıkarılan** öğrenci + velisi | "Kulübün belli oldu" ya da "Kulübün değişti" / "Satranç Kulübü'ne alındın." | ✔ | **Açık** | kulüp detayı |
| | | ilgili danışmanlar | "Kulübünüzde üye değişikliği: +1 / −1" | ✔ | Kapalı | danışman paneli |

N3'ü, kapatan idarecinin kendisi almaz; ekran sonucu zaten gösteriyor.

**Bilinçli olarak bildirim üretmeyenler:**

- Öğrencinin tercih kaydetmesi: kendi eylemidir, ekran onay gösterir.
- İdarenin Kaydet ve Otomatik yerleştir jestleri: taslak kimseye ulaşmaz (kulüp etkinliği taslağıyla aynı ilke).
- Velinin tercih süreci (açıldı, hatırlatma, yerleşmedi): veli süreci değil sonucu görür (K-8).
- Ayarın değişmesi: yalnız sezon açılışında olur; yeni sezonun kulüp ekranları zaten yeni modla açılır (eski K-10 bu yüzden düştü).
- İdare modunda `CLUB_APP_DECIDED`: zaten tetiklenemez.

### 5.3 Katalog işi

Yeni `NotificationKind` değerleri **sona** eklenir (sıradaki 54):

| Kind | Karşıladığı satırlar |
|---|---|
| `ClubPreferenceRoundOpened` | N1 |
| `ClubPreferenceReminder` | N2 |
| `ClubPreferenceRoundClosed` | N3 |
| `ClubPlacementPublished` | N4, N5, N7 (gövde ayrışır) |
| `ClubPlacementAdvisorSummary` | N6 ve N7'nin danışman kolu |

Club grubunda sıra 5–9 olur.

Dokunulacak yerler:

- `NotificationKindMetadata` (N1/N2 `IsActionable`);
- `NotificationEventKeyMap`;
- `PushEventKeyMap` (+ `PushAudience`);
- seed (`MasterSeedIds`, `NotificationEventTypeSeedData`, `delivered: true`) ve migration;
- `PushDeepLinks.ClubPreference()` → `/clubs/preference`;
- test bekçileri.

Yayın bildirimlerinin olay kimliği `round + student + publishVersion` olur. Aynı yayının retry'ı çift bildirim üretmez; sonraki yayın yeni bildirimdir.

---

## 6. Web işleri (`oksis-ui/apps/web`) — idare ve danışman

| # | Ekran / iş | Açıklama |
|---|---|---|
| W1 | **Sezon sihirbazı** (`features/academic-sessions/wizard.tsx`) | "Kulüpler" adımı ya da alanı: "Kulüp Üye Kabul Sorumlusu" `ASeg` [Öğretmen \| İdare], önceki değer varsayılan, her seçeneğin altında sonuç cümlesi. Özet adımında seçilen mod görünür. |
| W2 | **Ayarlar › Akademik Politikalar › "Kulüp Politikası" kartı** | **Salt okunur**: mevcut mod, açıklaması, "Sezon açılırken seçilir" notu ve sihirbaza bağlantı; `AUsedIn`. Kaydet çubuğuna katılmaz. |
| W3 | **Kulüp formu** (`form-drawer.tsx`) | İdare modunda "Katılım Şekli" ve başvuru penceresi adımları gizlenir, bilgi notu çıkar. Kontenjan alanı kalır (yerleştirmenin girdisi). |
| W4 | **Danışman paneli** (`panel-page.tsx`) | İdare modunda "Bekleyen Başvuru" şeridi gizlenir; yerine "Bu sezon üyeleri idare yerleştirir" bandı. İdare kulüp detayında "Başvurular" sekmesi gizlenir. |
| W5 | **Kulüpler listesi (idare)** | İdare modunda sayfa başlığına **"Tercih ve Yerleştirme"** girişi ve dönem durumu rozeti (Hazırlık / Tercihe açık / Kapalı / Yayınlandı). Kontenjanı aşan kulüp kartında "24/20" uyarısı. Öğretmen modunda giriş görünmez. |
| W6 | **Tercih Dönemi sayfası** `/clubs/placement` | Ayrıntısı aşağıda. |
| W7 | **Yerleştirme ekranı** `/clubs/placement/[roundId]` | Ayrıntısı aşağıda. |
| W8 | **Bildirim yönlendirmesi** | N3, N6 ve N7'nin danışman kolu için web in-app bağlantıları (`packages/core/src/notifications/logic.ts` kulüp kolu). |
| W9 | **API ve mock** | `packages/api/src/club/` (contract, endpoints, queries), `packages/api/src/academic-sessions/` (sihirbaz alanı), `packages/api/src/school-settings/`; şema `openapi-typescript` ile yeniden üretilir; MSW `packages/api-mocks/src/club/` (web ve mobil ortak). |

**W6 Tercih Dönemi sayfasının ayrıntısı:**

- *Dönem kartı:*
  - sezonda dönem yoksa "Tercih dönemi oluştur";
  - hedef son günü düzenleme;
  - duruma göre tek ana düğme: **Tercihe Aç** / **Tercihi Kapat** / **Yeniden Aç** (yayından önce). Her biri sonucu anlatan bir onay diyaloğuyla açılır ("340 öğrenciye bildirim gidecek");
  - **Tercih yapmayanlara hatırlat** düğmesi;
  - Hazırlık durumunda sil;
  - hedef son gün geçtiyse "Kapatmayı unutmayın" rozeti.
- *Canlı izleme:*
  - KPI'lar: kapsamdaki, tercih yapan, yapmayan öğrenci sayısı;
  - kulüp talep tablosu: 1./2./3. tercih sayısı, kontenjan, talep/kontenjan oranı; taşan kulüp kırmızı rozetle;
  - "Tercih yapmayanlar" listesi (şube süzgeçli).

**W7 Yerleştirme ekranının ayrıntısı:**

- *Üst çubuk:* dönem durumu, "Yayınlanmamış N değişiklik" rozeti, **Otomatik Yerleştir**, **Kaydet**, **Yayınla**.
  - Dönem açıkken Yayınla "önce tercihi kapatın" gerekçesiyle kapalıdır.
  - *Otomatik Yerleştir* bir çekmece açar (`duty/auto-distribute-drawer.tsx` kalıbı ama işsiz, tek adım). Seçenekler: "Elle düzenlenenleri koru" (varsayılan açık) ve "Yerleşmeyenleri boş kontenjanlara dağıt". Uygulanınca sonuç özeti gösterilir: "%78 1. tercih, %15 2., %4 3., 12 yerleşmedi".
- *Sol — öğrenci tablosu:*
  - kolonlar: ad, şube, 1/2/3. tercih (çip), atanan kulüp (`SelectBox`, yanında kalan kontenjan; dolu kulüp de seçilebilir, uyarıyla), eşleşme rozeti (1. tercih / 2. / 3. / tercih dışı / yerleşmedi), kaynak (oto/elle), kilit simgesi;
  - süzgeçler: yerleşmedi, tercih yok, 2–3. tercihe düşenler, kulüp, şube, değişmiş (taslak ≠ yayın);
  - toplu seçim ile "Seçilenleri … kulübüne ata".
- *Sağ — kulüp doluluk paneli:* her kulüp için doluluk çubuğu (taslak/kontenjan). Aşımda **turuncu uyarı** gösterir, engel değildir. Kulübe tıklamak tabloyu o kulübe süzer.
- *Kaydet:* ayarlar ekranındaki "Kaydedilmemiş değişiklikler" çubuğu kalıbı. Sayfadan ayrılırken uyarı verir. 409 (bayat) gelirse "Başka bir yönetici değiştirdi, yenileyin" denir.
- *Yayınla:* `publish-modal` kalıbı. Fark önizlemesi gösterilir (yeni üyelik, değişen, çıkarılan, yerleşmeyen, **aşan kulüpler**, bildirim gidecek kişi sayısı); onaydan sonra yayın yapılır.
- *Yayın sonrası:* ekran açık kalır. Sonradan okula gelen öğrenci tabloda "tercih yok" olarak çıkar; idare atar ve yalnız farkı yayınlar.
- *Sürükle-bırak:* MVP'de yok; tablo ve seçim kutusu yeter. Projede DnD kütüphanesi yok.

---

## 7. Mobil işleri (`oksis-ui/apps/mobile`) — öğrenci, veli, danışman

| # | Ekran / iş | Açıklama |
|---|---|---|
| M1 | **Keşif (`/clubs`) — öğrenci** | İdare modunda üstte **banner** (Hazırlık dönemi öğrenciye görünmez). Duruma göre metin: "Tercih dönemi açık · [Tercih Et]" (hedef son gün varsa "son gün 22 Eylül") / "Tercihin kaydedildi · [Düzenle]" / "Tercihler değerlendiriliyor" / "Robotik Kulübü'ne yerleştirildin" / "Henüz bir kulübe yerleştirilmedin". Dönem yoksa: "Kulüplere yerleştirmeyi idare yapar." Kart düğmesi "Katıl" yerine yoktur; kartlar **tanıtım** için durur. |
| M2 | **Tercih ekranı `/clubs/preference` — öğrenci (yeni)** | Ayrıntısı aşağıda. |
| M3 | **Kulüp detayı — öğrenci** | İdare modunda "Katıl" ve "Ayrıl" gizlenir (K-9). Dönem açıksa "Tercih listeme ekle" kısa yolu boş slota ekler (isteğe bağlı). |
| M4 | **Kulüplerim** | Yayından sonra kulüp burada görünür (mevcut ekran). Ayrıl düğmesi İdare modunda gizli. |
| M5 | **Veli** | **Yeni ekran işi yok** (K-8: yalnız sonuç). Yayından sonra çocuğun kulübü mevcut veli ekranlarında görünür; N4/N7 bildirimleri çocuğun kulüp ekranına açılır. |
| M6 | **Danışman — başvurular** (`/clubs/[clubId]/applications`) | İdare modunda giriş gizlenir, panelde bilgi bandı çıkar. |
| M7 | **Bildirim yönlendirmesi** | `logic.ts` kulüp koluna `preference` yüzeyi eklenir: N1, N2 ve N5 tercih ekranına; N4 ve N7 kulüp detayına; veli kolu çocuğun kulüp ekranına (`navigate-to-target.ts`). |
| M8 | **Bildirim tercihleri** | Yeni push anahtarları kullanıcının bildirim tercihleri listesine katalogdan kendiliğinden düşer. Yalnız etiketler kontrol edilir. |
| M9 | **Mock'lu web hedefinde doğrulama** | Expo web + MSW ile tercih ekranı ve banner durumları gezilir. |

**M2 Tercih ekranının ayrıntısı:**

- Üç slot: "1. tercih / 2. tercih / 3. tercih".
- Slota dokununca `sheet` açılır ve kulüp seçilir. Listede kategori, danışman, yer ve kontenjan görünür; başka slotta seçilmiş kulüp pasiftir.
- Sıra **yukarı/aşağı ok düğmeleriyle** değişir. Projede sıralanabilir liste bileşeni yok; ok düğmesi erişilebilirlik açısından da daha güvenlidir.
- **Kaydet.** Kayıtlı bir tercih değiştirilirken önce "Değiştirirsen sıradaki yerin yenilenir" uyarısı gösterilir (K-4). Kayıttan sonra "Tercihin kaydedildi · 14:32" yazar.
- Dönem kapalıysa ekran salt okunurdur.
- Yayından sonra sonuç kartı gösterilir: "2. tercihin olan Satranç Kulübü'ne yerleştirildin".
- Öğrencinin üyeliği varsa ekranda "X kulübünün üyesisin" yazar ve tercih yapılamaz (K-5).

**Mobilde bilinçli olarak yapılmayanlar:** sezon sihirbazı, dönem oluşturma/silme, yerleştirme tahtası ve yayın — idarenin masa başı işi.
**Mobil idare yüzü (2026-10-13, Faruk kararı: izleme + hafif eylemler):** `PlannedScreen` kaldırıldı. Yönetici mobilde kulüp listesini (durum çipi, danışman, doluluk), salt okunur kulüp detayını (üyeler) ve İdare modunda tercih dönemi kartını görür; kartta **Tercihe Aç / Tercihi Kapat / Yeniden Aç / Tercih yapmayanlara hatırlat** onay paneliyle yapılır. N3 bildirimi bu ekrana iner.

---

## 8. Dilimler ve sıra

**Karar K-11:** tüm dilimler birlikte yayına çıkar. Tek dalda ilerlenir ya da İdare seçeneği bir özellik bayrağının arkasında tutulur. Ara dilimler `dev`'e birleşebilir, ama İdare seçeneği tüm akış bitene kadar sihirbazda görünmez.

| Dilim | İçerik | Depo | Bağımlılık |
|---|---|---|---|
| **D1** | Ayar ve sihirbaz: B1, B2, okuma ucu, `ClubAdmissionGate` (okuma); W1, W2 | api + web | — |
| **D2** | Mod etkisi: `:join` / karar / `:leave` kapıları, `admission` bloğu, `admissionMode`; W3, W4, M1 (ilk durumlar), M3, M4, M6 | api + web + mobil | D1 |
| **D3** | Tercih dönemi + öğrenci tercihi: B3, B4, dönem uçları (aç/kapat/yeniden aç/hatırlat), öğrenci tercih uçları; W5, W6; M2 | api + web + mobil | D2 |
| **D4** | Yerleştirme taslağı: B5, algoritma, `:auto`, Kaydet, tablo uçları; W7 (yayın hariç) | api + web | D3 |
| **D5** | Yayın: B6, diff, `:publish`, ikinci yayın (fark), kontenjan aşımı, kulüp saati hizalaması; W7 yayın modalı | api + web | D4 |
| **D6** | Bildirimler: katalog + migration, aç/kapat/hatırlat ve yayın handler'ları (zamanlanmış iş yok); W8, M7, M8 | api + web + mobil | D3 (N1–N3), D5 (N4–N7) |
| **D7** | Kapanış: entegrasyon testleri gerçek SQL'de; domain notları (`domain-map`: Kulüp Tercih Dönemi, Öğrenci Tercihi, Yerleştirme yeni kavramlar; Kulüpler, Kulüp, Kulüp Üyeliği güncellemesi; yeni karar notu "kulüp kabul sorumlusu sezon başında seçilir"); Postman koleksiyonu; test rehberi; bayrağın açılması | api + oksis + ui | D5, D6 |
| **D8** | Yerleştirme sonucunun Excel çıktısı (K-13): `…/placements:export` + W7'de "Excel'e aktar" düğmesi | api + web | D7 |

---

## 9. Kararlar

### 9.1 Verilenler (2026-10-12)

| # | Soru | Karar |
|---|---|---|
| K-1 | Ayarın adı | **"Kulüp Üye Kabul Sorumlusu"** · Öğretmen / İdare |
| K-2 | Ayar Ayarlar'da nerede görünür | Akademik Politikalar'da **salt okunur** "Kulüp Politikası" kartı |
| K-3 | Ayar ne zaman değişir | **Yalnız sezon açma sihirbazında**; sezon içinde değişmez. Bekleyen başvuru ve açık dönem senaryoları bu yüzden doğmaz |
| K-4 | Taşan kulüpte kim kazanır | **Tercihini önce kaydeden**; ölçüt **son kayıt anı** (tercihi değiştiren sırasını yeniler) |
| K-5 | Üyeliği olan öğrenci tercih yapabilir mi | **Hayır** |
| K-6 | Sezonda ikinci tercih dönemi | **Hayır**; sonradan gelen ya da yerleşemeyen öğrenciyi idare elle yerleştirir |
| K-7 | İdare kontenjanı aşabilir mi | **Evet**, elle atamada; uyarı gösterilir, otomatik yerleştirme aşmaz |
| K-8 | Veli ne görür | **Yalnız sonuç**; tercih süreci ve bildirimleri veliye gitmez |
| K-9 | Öğrenci kendisi ayrılabilir mi | **Hayır**; değişikliği idare yapar |
| K-11 | Dilimler nasıl yayına çıkar | **Hepsi bitince birlikte** |
| K-12 | Tercih sayısı | **3, sabit** |
| K-14 | Kapatılan dönem yeniden açılır mı | **Yayın yapılmadıysa evet** |
| K-15 | Tarih bilgisi | İsteğe bağlı **hedef son gün**, yalnız bilgi; dönemi kapatmaz |
| K-16 | Dönem nasıl açılıp kapanır | Sezona bağlı dönem; açma ve kapatma idarenin **ayrı jestleri** |
| K-13 | Yerleştirme sonucu Excel çıktısı | **Evet**, D7 sonrasında (ödev tamamlama raporundaki Excel emsaliyle) |
| K-17 | Sezonu zaten açık okullar için ilk sezon istisnası | **Yok**; İdare modu en erken bir sonraki sezon açılışında seçilir |
| ~~K-10~~ | Ayar değişince danışmana bildirim | **Düştü**: ayar sezon içinde değişmiyor |

Açık karar kalmadı.

---

## 10. Riskler ve dikkat noktaları

- **Ekran ile sunucunun ayrışması (TB-32):** mod, dönem durumu ve "tercih edebilir mi" kararı sunucuda tek yerde verilir. Mobil kendi kararını üretmez, `admission` bloğunu okur.
- **Bellek içi test DB kısıtını zorlamaz:** tekil indeksler (okul × sezon tek dönem, dönem × öğrenci) ve yayının tek işlem iddiası gerçek SQL entegrasyon testiyle ölçülmeli.
- ~~**Sezon sihirbazının geri açılması**~~ — *kapandı (2026-10-12):* mod sezon aktifleşirken yazıldığı ve taslağa geri alınabilen Setup sezonunda kulüp hareketi olmadığı için sihirbaz sezon içi değişikliğin arka kapısı olamaz; ayrı kilit gerekmedi.
- **Kontenjan istisnası (K-7):** kontenjanı atlayan domain metodu yalnız yerleştirme yayınından çağrılmalı. Öğretmen modundaki `:join` ve `:approve` yolları onu kullanmamalı; bunu bir mimari test kilitlemeli.
- **"Önce kaydeden" ölçütü (K-4):** dönem açıldığı an uygulamaya yoğun giriş beklenir. N1 bildirimi yüzlerce alıcıya aynı anda gider; mevcut dağıtıcı (partili FCM, post-commit kuyruk) bunu taşır, ama tercih kaydetme ucu kısa sürede yoğun yazma alır. Ucun tek satır upsert olması yeterli. Ölçüt, ekranda ve N1 metninde öğrenciye açıkça söylenmeli ("kontenjanı dolan kulüplerde önce kaydedenler önce yerleşir").
- **Açık unutulan dönem:** kapanış elle olduğu için idare kapatmayı unutabilir. Hedef son gün rozeti ve W5 durum rozeti bunu görünür kılar. Yayınla düğmesi dönem açıkken kapalıdır.
- **Kulüp saati hizalaması:** yayın, bugünün `ClubHourActivitySync` hizalamasını tetiklemeli; yoksa yeni üyeler ertesi sabaha kadar bugünkü kulüp saati yoklamasında görünmez.

---

## 11. Uygulama notları (2026-10-12)

Uygulama sırasında plandan bilinçli sapılan ya da plana eklenen noktalar. Gerekçeleri kod yorumlarında da yazılı.

- **Mod yazım anı:** sezon açılışı değil, sezon aktivasyonu (bkz. §1.2 uygulama notu).
- **N5 ayrı bildirim türü:** "Yerleşmedin" (`ClubPlacementUnplaced`) `ClubPlacementPublished`'tan ayrıldı. Push varsayılanı tür başınadır; aynı türde kalsaydı N5'in push'u kapatılamazdı. Böylece §5.3'teki beş tür altı oldu (`NotificationKind` 54–59).
- **Hatırlatma kaydı:** §4.5 "ayrı tablo yok" diyordu. Hatırlatmayı dönem satırına yazmak dönemin sürüm damgasını değiştirir ve dönem açıkken taslak üzerinde çalışan idarecinin Kaydet'ine sahte 409 düşürürdü. Bu yüzden küçük bir `club_preference_reminders` tablosu (dönem × gün tekil) açıldı. Aynı gün ikinci hatırlatma 409 `Clubs.PreferenceReminderAlreadySent` döner.
- **"Boş kontenjanlara dağıt" sırası:** §3.4 "en çok boş yeri olan kulüp" diyordu. Kontenjansız kulüp "sonsuz boş yer" sayılsaydı herkes tek kulübe yığılırdı. Uygulama önce kontenjanlı kulüpleri doldurur, kontenjansızları en sona bırakır.
- **Ayar okuma izni:** yalnız `clubs.read`. İzinler VE ile birleşir; `school-settings.view` de istenseydi danışman öğretmen ve öğrenci okuyamazdı.
- **Yayından sonra otomatik yerleştirme:** yayınlanmış satırlar otomatik yerleştirmede kilitli sayılır ve doluluğa girer. Otomatik koşu yalnız yayınlanmamış ya da sonradan gelen öğrencilere dokunur; yayınlanmış öğrenciyi yalnız idarenin elle düzeltmesi değiştirir. Bu kural bağımsız incelemede çıktı: aksi hâlde varsayılan çekmeceyle yapılan bir koşu yüzlerce öğrenciyi kulüpten çıkarıp toplu bildirim üretebiliyordu.
- **Tek üyelik çatışması yayında:** önizlemede `blockers` olarak listelenir ve yayın 409 `Clubs.PlacementConflict` ile tümüyle durur. Kısmi yayın yapılmaz, çünkü onaylanan önizlemeyle uygulanan sonuç ayrışırdı.
- **Göçler:** dört ara göç tek göçte birleştirildi.
- **Mobil tercih sheet'i (§7 M2):** başka sırada seçili kulüp "pasif" değil, işaretli ve soluk görünür. Seçilirse iki sıra yer değiştirir. Sıra değiştirmenin ok düğmelerinden başka bir yolunu verir ve kulübü seçilemez bırakmaktan daha az şaşırtıcıdır.
- **"Tercih listeme ekle" (§7 M3) kaydetmez:** tercih ekranını kulüp ilk boş sıraya önseçili olarak açar. Kayıt ve K-4 "sıran yenilenir" uyarısı tek yerde kalır. Üç sıra doluysa kısa yol bunu söyler.
- **Web'de veliye giden kulüp bildirimleri tıklanamaz:** velinin web'de kulüp ekranı yoktur. Satır, öğrencinin tercih bildirimleri gibi "web'de karşılığı yok" kalıbıyla bağlantısız gösterilir; veli bildirime mobilden ulaşır.
- **Yerleştirme ekranındaki anlık doluluk ve özet istemcide yeniden hesaplanır:** kontenjan aşımı Kaydet'ten önce görünsün diye. Düzenleme yokken sunucunun özeti olduğu gibi gösterilir; kural kopyası sunucu projeksiyonuna bir eşlik testiyle kilitlidir.
