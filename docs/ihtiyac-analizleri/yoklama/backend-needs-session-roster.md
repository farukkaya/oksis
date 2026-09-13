# Backend İhtiyacı — Yoklamayı Görüntüleme (Yoklama Oturumu Dökümü)

**Ekran:** Devamsızlık › Canlı Yoklama Panosu → tamamlanmış hücre → çekmece →
"Yoklamayı Görüntüle"
**Rota:** `/attendance/sessions/{sessionId}` — **salt-okunur**, hiçbir yazma yok.
**Kaynak tasarım:** Claude Design `Oksis Layout v2` ·
`shell_skeleton/session_roster.{jsx,css}`
**FE durumu:** ekran master'da (`feat(web): yoklama oturumu dökümü ekranı eklendi`).
**Canlı doğrulama:** 2026-07-30, gerçek .NET (`localhost:5112`, Altınay Koleji
seed verisi) — bkz. §3. Ekran uçtan uca çalışıyor.

---

## Sonuç: yeni uç gerekmiyor

Ekran mevcut iki uçla uçtan uca çalışıyor. Aşağıdaki dört madde **yeni uç değil,
mevcut yanıtlara alan ekleme / tip sıkılaştırma** talebidir.

---

## 1. Kullanılan uçlar (mevcut — değişiklik istenmiyor)

### `GET /api/v1/attendance/sessions/{id}/roster`

`{id}` = **attendanceSession id**. Panonun `cells[].sessionId` değeri birebir
buraya geçiyor (id hizalaması mock'ta uçtan uca doğrulandı; canlı .NET'te teyit
bekliyor). Yanıt: `SessionRosterDto { session, records, carryFrom }`.

Ekranın **kullandığı** alanlar:

| Alan | Kullanım |
| --- | --- |
| `session.sectionName`, `subjectName`, `period`, `startTime`, `endTime`, `date` | Başlık + künye |
| `session.expectedTeacherName` | "Beklenen Öğretmen" |
| `session.isSubstitute`, `actualTakerId` | "Yoklamayı Alan" (bkz. Boşluk 1) |
| `session.lockedAt` | "Düzeltme Penceresi" açık/kapandı |
| `session.blockLabel` | Blok etiketi |
| `session.state` | "Tamamlandı" rozeti (`3`) |
| `records[]` (tamamı) | Roster satırları + 5 statülü özet + dağılım çubuğu |

**Kullanılmayanlar** (bu ekran için): `carryFrom`, `placementId`, `termId`,
`sectionId`, `subjectId`, `schoolStage`, `expectedTeacherId`, `session.counts`.

> Not: `session.counts` yalnız 3 statü (`present/absent/late`) taşıyor. Ekran 5
> statüyü `records[]` üzerinden kendisi sayıyor — **`counts`'un genişletilmesine
> ihtiyaç yok**.

### `GET /api/v1/attendance/records/{id}/history`

`{id}` = **`AttendanceRecordDto.id`** — `studentId` DEĞİL (id hizalaması önemli).
Satır açılınca tembel çağrılıyor; açılan her satır için bir istek.
Yanıt: `RecordHistoryEntryDto[] { label, text }`.

---

## 2. Backend'in eklemesi gerekenler

### Boşluk 1 — Vekil öğretmenin adı yok · **öncelik: yüksek**

`AttendanceSessionDto` yalnız `isSubstitute: bool` + `actualTakerId: uuid?`
taşıyor, **ad yok**. Ekran şu an idareciye *"Vekil öğretmenin adı kayıtlarda
yok"* + kayıt referansı (GUID) gösteriyor; ad uydurulmuyor.

**Talep:** `actualTakerName: string?` — `expectedTeacherName` ile aynı kalıp.

**Neden:** "Bu yoklamayı kim aldı?" bu ekranın var oluş sebebi; GUID idareciye
hiçbir şey anlatmıyor. FE'de client-side çözülemiyor: `actualTakerId` ile
`teachers` domaininin id uzayı ayrı.

### Boşluk 2 — Denetim izi eski→yeni durumu ve saati taşımıyor · **öncelik: yüksek**

`RecordHistoryEntryDto = { label: string, text: string }` ve `text` yalnız
*"kişi · gün"* taşıyor (ör. `"Kemal Öztürk · 2 Tem"`).

**Talep:** yapılandırılmış alanlar —
`occurredAt: datetime`, `fromStatus: int?`, `toStatus: int?`, `actorName: string`

**Neden:** "Gelmedi → Geç, 14:20, Kemal Öztürk" bir denetim izidir;
"Kemal Öztürk · 2 Tem" değildir. Aynı gün iki değişiklik olduğunda sıra bile
okunamıyor. Ekran bu sınırı şu an kullanıcıya açıkça yazıyor:
*"Geçmiş kayıtları gün bazında tutulur — saat ve önceki durum bilgisi
bulunmuyor."*

> `packages/core`'daki tip yorumu uzun süre `"Gelmedi → Geç · … 14:20"` örneği
> veriyordu; ne DTO ne mock bunu üretiyor. Yorum 2026-07-30'da gerçeğe çekildi.

### Boşluk 3 — `history.label` serbest metin, enum olmalı · **öncelik: orta**

FE bu metne göre çip tonu seçiyor. Backend'in şu an ürettiği değerler:
`"Öğretmen girişi"`, `"Mazeret onayı"`, `"Etkinlik kaydı"`, `"Düzeltme"`.
Serbest metin olduğu için bir yazım değişikliği FE stilini **sessizce** bozar ve
i18n'e kapalıdır.

**Talep:** `kind: int` (enum) + görüntü metni FE'de.
Kapalı küme önerisi: `teacherEntry | excuseApproval | activityRecord |
amendment | adminEntry`.

### Boşluk 4 — İzin slug'ları seed'de yok · **öncelik: orta**

`attendance.manage` / `attendance.report` slug'ları seed'de tanımlı değil; mock
bunları varmış gibi cevaplıyor.

**Talep:** bu salt-okunur ekranın hangi slug'la korunduğunun netleştirilmesi
(öneri: ayrı bir `attendance.view`) ve seed'e eklenmesi. Rol matrisi bağlanınca
FE kapısı tek satırda açılır (`SessionRosterPage` şu an yetki kapısı taşımıyor —
panelde henüz sayfa düzeyi yetki kalıbı yok).

---

## 3. Canlı doğrulama sonuçları (2026-07-30, gerçek .NET)

Ortam: `Oksis.Api` @ `localhost:5112`, Next proxy üzerinden, Müdür oturumu.
Oturum: `0e52f150-c248-443d-988e-66e02302aed1` (9-A · Türkçe, 1. ders, 10 öğrenci).

| Konu | Sonuç |
| --- | --- |
| **id hizalaması** | ✅ Panonun `cells[].sessionId` değeri roster ucunun `{id}`'si olarak **çalışıyor** — en riskli bilinmeyendi, kapandı. |
| **Canlı OpenAPI ↔ generated schema** | ✅ `AttendanceSessionDto`, `AttendanceRecordDto`, `RecordHistoryEntryDto`, `SessionRosterDto` alan alan **birebir aynı** — codegen bayat değil. |
| **`markedAt` semantiği** | ✅ Açık offset'li UTC: `2026-07-30T11:13:14.89158+00:00` → yerel **14:13**. Ekran doğru gösteriyor. (Bu, metinden `HH:mm` çeken ilk sürümün 11:13 göstereceğini kanıtlıyor — düzeltme gerekliydi.) |
| **`lockedAt` semantiği** | ✅ Aynı biçim, `markedAt + 24s`: `2026-07-31T11:13:...+00:00` → yerel 14:13. |
| **`studentNo` tipi** | ⚠️ Canlı yanıt **`string`** (`"20260100"`, 8–9 hane, değişken uzunluk). FE tipi `number` → **drift FE'de**. Detay §5. |
| **`state` int eşlemesi** | ✅ `3` = completed (number). FE eşlemesi doğru. |
| **`status` int eşlemesi** | ✅ `1` = present (number). AttendanceStatus 1..5 eşlemesi doğru. |
| **`records[]` sırası** | ✅ `studentNo` artan sırada geliyor. FE yeniden sıralamıyor, backend sırasını koruyor. |
| **`studentCount` vs `records.length`** | ✅ İkisi de 10 — ayrışmadı. |
| **`carryFrom`** | ✅ `null` (bu ekran kullanmıyor). |
| **`actualTakerId`** | ℹ️ `isSubstitute: false` olsa da **dolu** geliyor (asıl öğretmenin id'si). Ekran onu yalnız vekâlette gösterdiği için etkisi yok. |
| **Denetim izi (Boşluk 2)** | ✅ **Boşluk canlıda onaylandı:** `{ label: "Öğretmen girişi", text: "Caner Aslan · 30 Tem" }` — saat yok, eski→yeni durum yok. |
| **`history.label` (Boşluk 3)** | ✅ Canlı değer dört bilinen etiketten biri; FE ton haritası uyumlu. Yine de serbest metin olduğu için enum talebi geçerli. |
| **Boşluk 1 (vekil adı)** | ⛔ Doğrulanamadı — vekâletli bir oturum **üretilemiyor**, bkz. §6. Sözleşmede alanın olmadığı OpenAPI'den zaten kesin. |
| Tamamlanmamış oturum | ⛔ **Uç 500 dönüyor** — bkz. §6, Bulgu A. |

## 4. FE tarafında kapatılanlar

Backend talebi değil — kayıt için:

- **`markedAt` yerel saate çevriliyor.** İlk sürüm metinden `HH:mm` çekiyordu;
  gerçek UTC instant geldiğinde +03:00 kayacaktı. Mobildeki `formatMarkedAt`
  kuralına hizalandı.
- **Mock'un sahte-UTC damgası düzeltildi.** `${date}T${endTime}:00Z` yerel duvar
  saatini UTC'ymiş gibi damgalıyordu (`lessonEndInstant`).
- **`TRAIL_LABEL_CLASS` anahtarları** backend'in ürettiği etiketlerle hizalandı
  (`"İdare girişi"` prototip icadıydı, hiç üretilmiyor). Boşluk 3 çözülünce
  enum'a bağlanacak.

---

## 5. `studentNo` tip drift'i — karar bekliyor

Canlı yanıt `string` (`"20260100"`), generated schema `string`, **FE tipi
`number`**. Yani yanlış olan taraf FE.

**Ölçülen etki:** 22 dosyada 54 kullanım, ancak **hiçbirinde aritmetik yok** —
tümü render veya değer aktarımı. Bu yüzden çalışma zamanında bugün zarar
vermiyor (JS string'i olduğu gibi basıyor); risk iki noktada:

1. TS tipi yanlış bilgi veriyor — ileride biri `studentNo` üzerinde
   karşılaştırma/aritmetik yaparsa sessizce bozulur.
2. `features/activities/assign-modals.tsx` katılımcı eklerken
   `Number(studentNumber) || 0` ile sayıya çeviriyor — baştaki sıfırları veya
   sayısal olmayan karakterleri kaybeder. Bugünkü seed verisinde sorun çıkmıyor.

**Öneri:** `AttendanceRecord.studentNo` ve `ActivityStudent.studentNo`
alanlarını `string`'e çekmek. Mekanik bir değişiklik ama 5+ dosyaya dokunduğu
için kök CLAUDE.md gereği önce onay ister.

---

## 6. Vekâlet doğrulaması denemesi — iki backend hatası

2026-07-30, gerçek .NET. Amaç: `isSubstitute: true` olan bir oturum üretip
ekranın "Yoklamayı Alan" hücresini gerçek veriyle doğrulamak.

**Yapılan:** Nöbet & Vekâlet ekranından Caner Aslan bugün "gelmedi" işaretlendi,
iki dersine vekil atandı (UI akışı, `POST /duties/substitution`):

| Ders | Oturum durumu | Vekil | exceptionId |
| --- | --- | --- | --- |
| 1. ders 9-A Türkçe | tamamlandı | Burak Doğan | `679eb79a-dbf4-40bb-baf6-319c8700d46b` |
| 3. ders 9-A Türkçe | bekliyor | İbrahim Öztürk | `64da50e2-7768-49b1-8c6b-5d967b30df13` |

Her iki kayıt da kalıcı (`GET /duties/substitution/board?termId&date&teacherId=<gelmeyen>`
→ `status: "covered"`), vekile de görünüyor
(`GET /duties/substitution/me?termId=` → 9-A Türkçe, 3. ders).

**Sonuç: `isSubstitute` hiçbir durumda true olmadı.**

- **Tamamlanmış oturumda** (1. ders) `isSubstitute: false`, `actualTakerId` =
  beklenen öğretmen. **Bu doğru davranış** — yoklamayı fiilen Caner Aslan almıştı
  (14:13), sonradan gelen görevlendirme geçmişi yeniden yazmamalı.
- **Bekleyen oturumda** (3. ders) vekil yoklamayı hiç alamıyor → oturum asla
  vekâletli-tamamlanmış hâle gelmiyor. Sebebi aşağıdaki iki hata.

### Bulgu A — `GET /sessions/{id}/roster` bekleyen oturumda 500

Pano bekleyen (state `1`) hücreler için de `sessionId` veriyor, ama o id'lerle
roster çağrısı **500 InternalError** dönüyor. 3/3 tutarlı; tamamlanmış iki
oturumda 200.

```
1. ders (tamamlandı) → 200
2. ders (tamamlandı) → 200
3./4./5. ders (bekliyor) → 500 InternalError
```

Etkisi: idare bekleyen bir oturumun dökümünü açamıyor (ekran hata durumuna
düşüyor). Dokümanın §3'teki "tamamlanmamış oturum ne döner?" sorusunun cevabı
budur — 404 değil, 500.

### Bulgu B — Yoklama modülü vekâlet görevlendirmesini tanımıyor

Vekil öğretmen (İbrahim Öztürk, `b2a19449-…`) için:

- `GET /attendance/sessions/my?date=2026-07-30` → **0 ders** (vekâlet dersi yok)
- `POST /attendance/sessions/{placementId}/open?date=2026-07-30` → **404 NotFound**
  (`placementId: f493fa8e-…`, aynı id duty board'un verdiği id)

Yani vekâlet duty modülünde var (`substitution/me` onu döndürüyor) ama yoklama
modülü onu tüketmiyor: vekil ne dersi listesinde görüyor ne oturumu açabiliyor.
**Vekilin yoklama alması mümkün değil** — bu, ekran doğrulamasından bağımsız,
üretimde vekâlet günlerinde yoklama alınamayacağı anlamına gelir.

Not: 404'ün yetki-kapsamı mı yoksa arama mı olduğunu izole etmedim (admin ile
`open` denemek mevcut oturum durumunu değiştireceği için yapılmadı).

**Sonuç:** ekranın vekâlet sunumu yalnızca mock senaryosuyla doğrulanmış
durumda (`substitute` senaryosu). Gerçek veriyle doğrulama Bulgu A ve B
kapanmadan mümkün değil.
