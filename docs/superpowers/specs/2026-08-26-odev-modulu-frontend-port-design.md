# Ödev (Homework) Modülü · Frontend Port Tasarımı

|||
|---|---|
|**Belge türü**|Tasarım (spec) — uygulama planının girdisi|
|**Kapsam**|`oksis-ui` monorepo: `packages/core`, `packages/api`, `packages/api-mocks`, `apps/web`, `apps/mobile`|
|**Girdi**|Claude Design "Oksis Layout V2" 9 ekranlık ödev paketi · `docs/ihtiyac-analizleri/OKSİS — Ödev (Homework) Modülü · İhtiyaç Analizi (Final).md` · `docs/teknik-analizler/Ödev (Homework) Modülü · Teknik Analiz (Faz A).md`|
|**Tarih**|26 Ağustos 2026|
|**Durum**|Onaylandı — uygulamaya geçildi|
|**Kapsam dışı**|`oksis-api` tarafında kod (yalnız doküman borcu) · bildirimler · Hangfire işleri · push · Faz B konuları (saat seçici, tam dijital teslim, not defterine akış)|

---

## 1. Amaç

Claude Design'da üretilen 9 ödev ekranını `oksis-ui`'ye taşımak ve `Mock Enabled`
modunda web ve mobilde **uçtan uca gezilebilir** hâle getirmek.

Ödevin .NET karşılığı yok — `src/Oksis.Application/Modules/Homework/` altında
yalnız README var, 0 entity. Bu yüzden iş "bağlama" değil "kurma"dır: önce
sözleşme + mock yazılır, ekranlar ona karşı geliştirilir.

### 1.1 Onaylanmış kararlar

|#|Karar|Gerekçe|
|---|---|---|
|K-A|**Tam etkileşim, MSW belleğinde kalıcı**|"Gezilebilir" iddiasını gerçekten karşılayan tek seviye: ödev oluştur → listede görünür, işaretle → sayaçlar güncellenir, öğrenci yükler → öğretmen görür|
|K-B|**3 faz, her fazın sonunda kontrol**|Yön hatası tüm yüzeye yayılmadan yakalanır|
|K-C|**Doğal veri çeşitliliği + web'de senaryo barı**|Fixture farklı hâllerde ödev taşır; ulaşılamayan durumlar (`loading`/`error`/rehber/ağ hatası) `/scenario-bar` senaryosu olur. Mobilde senaryo barı altyapısı yok — orada yalnız doğal çeşitlilik|
|K-D|**Mock, backend yazılırken birincil kaynaktır**|Handler'lar mutlu yolu değil sözleşmenin tamamını uygular; §4'te ayrıntı|

---

## 2. Mimari yerleşim

Kök `CLAUDE.md`'nin *mock-first domain kalıbı*, emsal: yoklama (attendance).

```
packages/core/src/homework/          types · constants · logic · schemas
packages/api/src/homework/           contract · endpoints · queries
packages/api-mocks/src/homework/     homework-data (defter) · homework-handlers · testler
packages/api-mocks/src/roster/       PAYLAŞILAN öğrenci defteri (terfi — §3.4)
apps/web/features/homework/          Ekran 1-3, 7-8
apps/web/features/settings/          Ekran 9 (homework-tab.tsx)
apps/mobile/src/features/homework/   Ekran 1-6 mobil karşılıkları
```

Katman kuralları kök `CLAUDE.md`'den aynen geçerli: view fetch/logic taşımaz,
`fetch` yalnız `packages/api`, iş kuralı `packages/core`, `apps/*` birbirinden
import etmez.

---

## 3. Paylaşılan katman (Dilim 0)

### 3.1 `packages/core/src/homework/`

**`types.ts`** — 6 string union + alan tipleri. Teknik analizde kilitli:

```ts
type HomeworkStatus     = 'draft' | 'published' | 'closed' | 'cancelled'
type TrackingStatus     = 'unmarked' | 'completed' | 'incomplete' | 'notDone' | 'exempt'
type HomeworkTargetType = 'wholeClass' | 'selectedStudents'
type HomeworkSubmissionType = 'teacherCheck' | 'digitalUpload'   // Faz A: yalnız teacherCheck
type HomeworkAttachmentKind = 'file' | 'link'
type HomeworkAuditKind  = 'published' | 'publishedOnBehalf' | 'updated' | 'cancelled'
                        | 'closed' | 'statusMarked' | 'bulkCompleted' | 'exemptSet'
                        | 'submissionRemovedByAdmin' | 'recordAddedAfterPublish'
```

"Süresi Doldu" **enum değildir** — `status === 'published' && isOverdue` türevidir
ve `isOverdue`'yu sunucu hesaplar.

**`constants.ts`** — `TRACKING_STATUS_CONFIG` ve `HOMEWORK_STATUS_CONFIG`:
durum → Türkçe etiket + ton + Lucide ikon adı, **tek tanım**. Mobilde
"hardcoded Türkçe yasak, enum→etiket eşlemesi tek dosyada" kuralı bunu zorunlu
kılar. Brief'in yargılamayan görsel dili burada kodlanır:

|Durum|Etiket|Ton|
|---|---|---|
|`unmarked`|İşaretlenmedi|nötr gri, boş daire — olumsuzluk **değil**|
|`completed`|Tamamlandı|başarı yeşili + tik|
|`incomplete`|Eksik|uyarı kehribarı|
|`notDone`|Yapılmadı|nötr **koyu** + ikon — **kırmızı değil**|
|`exempt`|Muaf|soluk/kesik, "M"|

Tehlike kırmızısı bu modülde yalnız yıkıcı aksiyon onayında (İptal) meşrudur.

**`logic.ts`** — sunucunun yapmadığı iki türev:
- `groupStudentHomework(items)` — öğrenci listesinin gruplanması istemcidedir
  (uç 14 notu).
- `familyDisplayState(item)` — velinin "Henüz kontrol edilmedi" hâli:
  `isOverdue && myStatus === 'unmarked'`.

İstemci **tarih karşılaştırması yapmaz**; `isOverdue` sunucudan gelir. Tarih
üretiminde `toISOString().slice(0,10)` **yasak** (kök kuralı: +03:00'te gece
yarısından sonra önceki günü üretir) — yerel bileşenlerden kurulur.

**`schemas.ts`** — zod, form ve API katmanı aynı şemayı paylaşır:
- `homeworkFormSchema`: `title` zorunlu (≤200), `dueDate` `YYYY-MM-DD` regex +
  geçmiş yasak, `classRoomIds` ≥1, `targetStudentIds` yalnız tek şubeyle
  birleşebilir (çoklu şube × alt küme Faz A'da kapalı)
- `cancelReasonSchema` / `adminRemoveReasonSchema`: `.min(15)`
- `exemptReasonSchema`: `.min(1)`
- `homeworkSettingsSchema`: 3 alan

### 3.2 `packages/api/src/homework/`

**`contract.ts`** — 25 ucun path'leri ve DTO'ları, `generated/schema.ts`'e
module augmentation (`declare module "../generated/schema"`) ile enjekte edilir.
Bu **bilinçli bir drift bekçisidir**: backend yayınlanıp codegen çalıştığında
şekil uyuşmazlığı typecheck'i kırar. Emsal: yoklama ve not modüllerinin
mock-first dönemi.

**`endpoints.ts`** — zarf açma (`{data, meta, errors, correlationId}`) ve
tel→görünüm eşlemesi **yalnız burada**; çağrı yerinde asla.

**`queries.ts`** — TanStack anahtarları (teknik analizden birebir):

```
['homework','mine',termId,filters]      ['homework','my',scope]
['homework','homeroom',termId]          ['homework','family',studentId,scope]
['homework','item',id]                  ['homework','admin',filters]
['homework','tracking',id]              ['homework','density',weekStart,level]
['homework','pending-check',filters]    ['homework','audit',id]
['homework','settings']
```

Geçersizleme haritası:

|Mutasyon|Geçersizlenen|
|---|---|
|`markTracking` / `bulkComplete`|`tracking` · `item` · `mine` · `pending-check`|
|`publish` / `cancel` / `update` / `close`|`item` · `mine` · `admin` · `density` (+ cancel/close → `pending-check`)|
|`addSubmission` / `removeOwnSubmission`|`my` · `item` (self)|

Öğrencinin yüklemesi öğretmenin `tracking`'ini **canlı tetiklemez** — öğretmen
tarafı refetch-on-focus ile tazelenir, canlı kanal açılmaz.

### 3.3 `packages/api-mocks/src/homework/`

Web ve mobil aynı handler'ı tükettiği için paylaşılan pakette (paketin ölçütü
"iki uygulama da aynı handler'a ihtiyaç duyuyor mu" — `index.ts` başlığı).

**`homework-data.ts`** — değiştirilebilir in-memory defter. Tasarım
promptlarındaki örnek veri **birebir**; tasarım / mock / test aynı evren:

- Okul **Altınay Lisesi** · Sezon **2026-2027** · Dönem **1. Dönem** ·
  Bugün **Salı, 15 Eylül 2026**
- Öğretmen **Ayşe Demir** (Matematik) · şubeler 9-A (30) · 9-B (28) · 10-C (26) · 11-A (24)
- Ana ödev **"Üslü sayılar çalışma kağıdı"** · 10-C · son: 14 Eylül · **Süresi Doldu** ·
  1 ek · dağılım: 12 Tamamlandı · 3 Eksik · 1 Yapılmadı · 1 Muaf
  ("Raporlu — 10–14 Eylül") · 9 İşaretlenmedi · 7 satırda yükleme
- **Ceren Şahin** — 3 görsel + 1 PDF, "Dün 21:40"
- **"Geometri ön hazırlık"** · 10-C · **Taslak**
- Doğal çeşitlilik için ek olarak: bir **Yayınlandı** (süresi dolmamış) ve bir
  **Kapandı** ödev — K-C gereği gezerek görülebilsin

Öğrenci yüklemeleri mevcut `files/file-data.ts` defterine kaydolur — duyuru
eklerinin kullandığı aynı dosya evreni, böylece görüntüleyicinin indirme URL'si
çözülür. Yeni bir dosya defteri açılmaz.

**`homework-handlers.ts`** — 25 handler, yazma uçları defteri gerçekten
değiştirir. Kalite sözleşmesi §4'te.

### 3.4 Paylaşılan öğrenci defteri (terfi)

`GRADE_STUDENTS_9A` (30 kişi, `st-1023…`, Türkçe karakter testi dâhil) zaten var
ve brief'in 9-A numaralarıyla birebir aynı. Ödev de aynı listeye ihtiyaç duyuyor,
artı yeni bir 10-C (26 kişi, `1101…`).

"Bir liste iki yerde tanımlanmaz" (R12) gereği liste tarafsız bir yere terfi
eder: **`packages/api-mocks/src/roster/`** — `files/file-data.ts`'in dosya
defteri olması gibi öğrenci defteri. `grade-data.ts` bu defterden okur; not
modülüne özgü alanlar (`status`, `statusNote`) orada kalır.

Dokunulan dosya sayısı ~3; kök `CLAUDE.md`'nin "5+ dosya refactor'ı onay ister"
eşiğinin altında ve kullanıcı onayı alındı.

---

## 4. Mock'un kalite sözleşmesi (K-D)

> Backend yazılmaya başlandığında bu mock **birincil kaynak** olacak. Bu yüzden
> handler'lar bir demo değil, sözleşmenin çalışan tarifidir.

Bunun somut karşılığı — handler'lar şunları **uygular**, taklit etmez:

1. **Durum makinesi.** `Draft → Published → Closed`, `Published → Cancelled`.
   Yasak geçişler (`Published → Draft`, `Closed/Cancelled → *`) `409 invalid_state`
   döner. Yayın geri alınamaz.
2. **Hata sözleşmesi tam** — altı kodun hepsi gerçek koşullarında üretilir:

   |Kod|HTTP|Koşul|
   |---|---|---|
   |`validation`|400|başlık boş · gerekçe <15 · tarih formatı|
   |`due_date_past`|400|`dueDate < today` ile yayın|
   |`invalid_state`|409|durum makinesi ihlali|
   |`submission_limit`|409|>5 aktif dosya|
   |`submission_closed`|409|`Closed`/`Cancelled`'a yükleme (`Overdue`'da **serbest**)|
   |`not_found`|404|yok **veya kapsam dışı** — varlık sızdırılmaz|

3. **Kapsam daraltması sunucuda.** İstemciden gelen rol/görünüm parametresi
   **yok sayılır**; daraltma mock oturumundaki kimlikten türetilir. Sahip /
   rehber / idare / öğrenci-self / aile beş ayrı görünüm üretir.
4. **`ExemptReason` sızdırılmaz.** Yalnız uç 11 (sahip/idare tracking) ve 24
   (audit) serileştirir. Uç 15 (öğrenci detayı) ve 19 (aile detayı) için alan
   **şema dışıdır** — `null` bile değil, hiç yoktur.
5. **Yükleme durumu değiştirmez.** `POST submissions` tracking `status`'ünü
   **değiştirmez** ve bildirim üretmez. Öğretmen bakar, kendisi işaretler.
6. **Sayaçlar tek yerden.** `HomeworkCounters` karşılığı tek yardımcıdan
   hesaplanır (`targetCount`, `markedCount`, durum başına sayı,
   `submissionStudentCount`, `isOverdue`, `isPendingCheck`); liste, detay ve pano
   **aynı** fonksiyondan okur. Yüzde alanı yok — ekranlar `12/26` gösterir.
7. **`isOverdue` sunucuda.** Mock "bugün"ü sabit (15 Eylül 2026) tutar ve
   `isOverdue`'yu kendisi hesaplar; istemci tarih karşılaştırması yapmaz.
8. **GET yan etkisiz.** "Gördüm/okundu" mekanizması bu modülde yoktur.
9. **Zarf her uçta** `{data, meta, errors, correlationId}`.

**Testler** (`vitest`, emsal `grade-handlers.test.ts`): yukarıdaki 9 maddenin her
biri için en az bir test. Bunlar aynı zamanda backend'in kabul kriteridir —
`.NET` handler'ları yazılırken bu testler sözleşmenin okunabilir tarifidir.

---

## 5. Ekran yerleşimi

### 5.1 Rota deseni

`/grades` dört rolün de tek rotasıdır; rol farkı `GradePage` içinde dispatch ile
taşınır, alt ekranlar rota değil bileşen state'iyle açılır. Ödev aynı deseni
izler: tek `/homework` rotası + `HomeworkPage` dispatch.

**Varsayılan dal yazılmaz.** Rolü çözülmemiş oturum hiçbir şey çizmez — yanlış
ekranı bir an bile göstermektense boş kabuk beklemek doğrudur (`B-34`).

### 5.2 Ekran → dosya

|#|Ekran|Web|Mobil|
|---|---|---|---|
|1|Ödev Oluştur / Yayınla (HW-T-01)|`homework-create-screen.tsx`|`src/app/homework/create.tsx`|
|2|Ödev Listem (öğretmen)|`homework-list-screen.tsx`|`(tabs)/homework.tsx` öğretmen yüzü|
|3|Detay + Kontrol Izgarası (HW-T-02)|`homework-detail-screen.tsx` · `tracking-grid.tsx` · `submission-viewer-dialog.tsx`|`src/app/homework/[id].tsx` + tam ekran viewer|
|4|Ödevlerim (öğrenci, HW-S-01)|—|`(tabs)/homework.tsx` öğrenci yüzü|
|5|Detay + Görsel Teslim (HW-S-02)|—|`src/app/homework/[id].tsx` öğrenci yüzü|
|6|Çocuğumun Ödevleri (veli, HW-P-01)|—|`(tabs)/homework.tsx` veli yüzü|
|7|Ödev Panosu (yönetici, HW-A-01)|`homework-board-screen.tsx`|—|
|8|Liste + Salt Okunur Detay (yönetici)|`homework-admin-screen.tsx`|—|
|9|Ödev Politikası (HW-A-02)|`features/settings/homework-tab.tsx` → `/settings?tab=homework`|—|

Ekran 9 ayrı rota değildir: Ayarlar sekmeyi adresten okur ve not modülü de
`?tab=policy` ile oraya bağlanır. Ödev yüzeyindeki "Ödev ayarları" bağlantısı
aynı şekilde `?tab=homework` açar ve **yetkisiz rolde verilmez**
(`canAccessRoute`) — not modülünde bu bağlantının her role verilmesi hataydı.

### 5.3 Gezinti açılışı

- `nav-config.ts`: öğretmen/öğrenci/veli web nav'ında ödev girdisi **zaten var**.
- **Yöneticinin web nav'ında ödev girdisi yok** — Okul grubuna, Notlar'ın yanına
  eklenir.
- Mobil sekmelerde üç rolde de `isPlanned: true` — ilgili fazda kapatılır.
- `PlannedScreen` kabukları (`app/(dashboard)/homework/page.tsx`,
  `(tabs)/homework.tsx`) gerçek ekranla değiştirilir.

### 5.4 Ekran 3 · UX sözleşmesi (modülün kalbi)

- İşaretleme **anında kaydedilir**, ayrı "kaydet" adımı yoktur.
- Optimistic update + hata hâlinde **geri al** + satır içi "Tekrar dene"
  (mutation retry 1). **Toast yok** — satır içi 300ms mikro-onay; 26 satırda
  toast bombardımanı olmaz.
- Web'de satırda dört segment (Tamamlandı/Eksik/Yapılmadı/Muaf); klavye
  kısayolları T/E/Y.
- Mobilde satırda **üç açık buton**, Muaf üç nokta menüsünde. **Satır dokunuşuyla
  durum döngüsü yoktur** (yanlış dokunma riski).
- Toplu eylem sayaçlıdır ve onayında "veliye anında bildirim göndermez" yazar.
- Izgara altında sabit bilgi satırı: "Eksik ve Yapılmadı işaretlemeleri velilere
  akşam günlük özetle iletilir."
- Yükleme görüntüleyicide işaretleme çubuğu + "Sonraki yüklemeli öğrenci" akışı
  + "Yükleme durumu değiştirmez" bilgisi.

### 5.5 Değişmez ürün kuralları (ihlal = ekran reddedilir)

1. **Puan/not alanı yok** — bu modülde hiçbir ekranda.
2. **Kıyas yok** — sıralama, başarı ligi, rozet, gamification yok.
3. **"Yapılmadı" kırmızı değildir.**
4. **"İşaretlenmedi" olumsuzluk gibi gösterilmez.**
5. **Son teslim yalnız TARİH'tir** — saat hiçbir yerde yok.
6. **Bildirim üreten her aksiyonun onayında etkisi sayıyla yazılır.**
7. **Boş ekran yasak** — her yüzeyde empty + loading (skeleton) + error.
8. **Taslak/Yayınla görsel olarak net ayrışır.**
9. `K-8`: yönetici yüzeyinde öğretmen bir filtre/sıralama boyutu değildir, düz
   metindir — sözleşmede öğretmen parametresi zaten yoktur.

### 5.6 Marka kapısı

Handoff intake kuralı: her renk/font/radius bir OKSİS marka token'ına veya
mevcut semantik token'a (`bg-primary`, `text-h3`, `rounded-lg`) çözülmelidir.
Çözülmeyen değer bir ihlaldir — "yeterince yakın" diye korunmaz. Eşleşmeyen bir
UI öğesi yeni paylaşılan bileşen gerektiriyorsa **dur ve onay iste**.

---

## 6. Fazlar

Her fazın sonunda `npm run typecheck && npm run lint`, ayrı commit, kullanıcıya
teslim.

### Faz A — zemin + öğretmen (Ekran 1-2-3, web + mobil)

- `packages/core/src/homework/` (types · constants · logic · schemas)
- `packages/api/src/homework/` (contract · endpoints · queries)
- `packages/api-mocks/src/roster/` terfisi + `grade-data.ts` uyarlaması
- `packages/api-mocks/src/homework/` (defter · 25 handler · testler)
- `apps/web/features/homework/` — `HomeworkPage` öğretmen dalı + Ekran 1-2-3
- `apps/mobile/src/features/homework/` — öğretmen sekmesi + create/detail stack
- Öğretmen mobil sekmesinde `isPlanned` kapanışı
- `/scenario-bar /homework` — öğretmen senaryoları: `loading` · `error` ·
  rehber salt-okunur · kapandı · taslak · işaretleme ağ hatası
- `oksis-ui/docs/backend-needs-homework.md`

**Çıkış kriteri:** Mock modunda öğretmen olarak ödev oluştur → yayınla → listede
gör → detaya gir → ızgarada işaretle → sayaçlar güncellensin → yükleme
görüntüleyiciyi aç → sonraki yüklemeli öğrenciye geç. Web ve mobilde ayrı ayrı.

### Faz B — öğrenci ve veli (Ekran 4-5-6, mobil)

- Öğrenci ve veli dalları · görsel teslim hattı · `isPlanned` kapanışı
- Öğrenci/veli senaryo verisi

**⚠️ Faz başında karar gerektiren engel:** yükleme hattı
`expo-document-picker` ve `expo-image-manipulator` ister; ikisi de
`apps/mobile/package.json`'da **yok** (`expo-image-picker` var). İkisi native
modül — eklenmesi prebuild/yeniden derleme demektir. İki seçenek: (a) ikisini
ekle ve yeniden derle, (b) teslimi yalnız kamera/galeri ile kur, PDF'i ertele.
**Bu karar kullanıcıya sorulur, tek başına alınmaz.**

**Çıkış kriteri:** Öğrenci olarak ödev listesini gör → detaya gir → görsel yükle
→ 5 dosya limitinde `submission_limit` al → öğretmen yüzünde yüklemenin
göründüğünü doğrula. Veli olarak çocuğun ödevlerini ve "Henüz kontrol edilmedi"
hâlini gör. `ExemptReason`'ın öğrenci ve veli yüzeyine **sızmadığını** test et.

### Faz C — yönetici (Ekran 7-8-9, web)

- Pano (yoğunluk takvimi + kontrolsüz ödevler)
- Yönetici liste + salt okunur detay
- Ayarlar'a ödev sekmesi (`?tab=homework`)
- Yönetici nav girdisi
- Yönetici senaryoları

**Çıkış kriteri:** Yönetici olarak panoda yoğunluğu ve kontrolsüz ödevleri gör →
listeden salt okunur detaya gir → `ExemptReason`'ın idare görünümünde göründüğünü
doğrula → Ayarlar'dan politikayı değiştir → ödev yüzeyine yansıdığını gör.
Öğretmen bir filtre boyutu **olmadığını** doğrula.

---

## 7. Backend borcu

`oksis-api`'de bu iş kapsamında **tek satır kod yazılmaz**. Tespit edilen borç
`oksis-ui/docs/backend-needs-homework.md`'ye yazılır (emsal:
`docs/backend-needs-session-roster.md`):

1. **`homework.write` izni yok.** `PermissionSeedData.cs` yalnız `homework.read`
   ve `homework.manage` taşıyor. Teknik analiz üç izin varsayıyor ve
   "öğretmen yazar / yönetici yönetir" ayrımı buna dayanıyor. Seed'e eklenmeli;
   rol eşlemesi: SchoolAdmin read+write+manage · Teacher read+write ·
   Student read · Parent read.
2. **25 uç** — `packages/api/src/homework/contract.ts` ve
   `packages/api-mocks/src/homework/homework-handlers.ts` sözleşmenin çalışan
   tarifidir; `.NET` tarafı bunlara karşı yazılır ve `api-mocks` testleri kabul
   kriteridir.
3. **`SchoolSettings`** 3 ödev alanı (`homework-settings` ucu).
4. Teknik analizin açık `[D]`/`[KB]` maddeleri (rehberlik ataması hangi tabloda,
   `SchoolSettings.TimeZone` var mı, Files modülünde `UploadedBy` var mı).

---

## 8. Riskler

|Risk|Etki|Karşılık|
|---|---|---|
|Native modül eksikliği (Faz B)|Görsel teslim kurulamaz|Faz başında kullanıcıya sorulur; PDF ertelenebilir|
|Mock ile gelecek codegen'in sapması|Sessiz kırılma|`contract.ts` module augmentation drift bekçisi — sapma typecheck'i kırar|
|Öğrenci defteri terfisi `grade`'i kırar|Not ekranları bozulur|Terfi tip-korumalı; `grade-handlers.test.ts` yeşil kalmalı|
|9 ekranın durum çeşitliliği gözden kaçar|Brief ihlali|Her fazın çıkış kriterinde durumlar tek tek sayılır; web'de senaryo barı|
|Marka ihlalinin sessiz geçmesi|Tasarım borcu|Handoff kapı 2 her ekranda uygulanır; çözülmeyen token bildirilir|
