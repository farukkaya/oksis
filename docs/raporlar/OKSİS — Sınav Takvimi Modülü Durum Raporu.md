# OKSİS — Sınav Takvimi Modülü Durum Raporu

> **Yaşayan belge.** Sınav takvimi modülünün fazları arasında "nerede kaldık"
> sorusunun tek cevabı. Her oturum sonunda güncellenir; tarihli kopya çıkarılmaz.
>
> **Son güncelleme:** 2026-09-15 (**kapanış turu** — ekran testi A+B'den kalan 10 madde
> kapandı, altı ürün kararı bağlandı) · **Yazan:** Claude Opus 5 (1M context)

---

## 1. Tek bakışta

| Faz | Kapsam | Durum | Nerede |
|---|---|---|---|
| **Faz 1** — Ders saatinde sınav | Pencere, yerleştirme, pano, iki adımlı yayın, etiket katmanı, takvimler | ✅ **Bitti, merge edildi** | `master` (üç depoda) |
| **Faz 2a** — Oturum ve yerleşim (sunucu) | `ExamSession`/`ExamRoom`/`ExamSeat`, besteci, komutlar, kurallar, okuma uçları, bildirim | ✅ **Sunucu tarafı 26/26 bitti** | `oksis-api` · **`master`** |
| **Faz 2a** — İstemci | Dilim 7 (**9 görev**) + Görev 8.1 uçtan uca doğrulama | ✅ **BİTTİ — 9/9 + 8.1** | `oksis-ui` · **`master`** |
| **Faz 2b** — Çıktılar ve görüş | Kapı listesi, oturma planı, gözetmen çizelgesi, görüş penceresi | ✅ **Beş dilim de bitti (2026-09-13)**; uçtan uca uçlardan doğrulandı, ekranlar gözle görülmedi | `oksis-api` `2891f6d9` · `oksis-ui` `4a80516` |
| **Kapanış turu** — ekran testi bulguları | Gerekçe kapısı, oturum taşıma, görüş döngüsü, geri alma, duyuru kapsamı, taslak panosu | ✅ **10 madde kapandı (2026-09-15)** | üç depo, dal başı |
| **Faz 3** — Otomatik dağıtıcı | Derslik ve gözetmeni öneren Hangfire işi | ⬜ Kapsam kilitli, planlanmadı | — |

**Kapanış turu bitti (2026-09-15).** Ekran testi A+B'den kalan maddelerin onu kapandı:
`TB-124` `TB-129` `TB-143` `TB-144` `TB-145` `TB-148` `TB-151` `TB-154` `TB-156` `TB-159`.
`TB-152` yarı kapandı (`EX-S09` yazıldı; sihirbazın seçilemez satırı kaldı). Ayrıntı ve
kanıtlar: [[OKSİS - Bulgu Arşivi]] §48. **Modülde açık kalan:** `TB-128` (alıcı çözümünde
N+1), `TB-152`'nin sihirbaz ayağı, `TB-158` (push ekranı uyandırmıyor — cihaz işi),
`TB-114` (KPI eğilimi), `TB-120` (`K-26`, faz dışı).

**Yeni kural kodu:** `EX-S09` — ders programı yayınlanmamış şube sınav takvimine hiç
girmiyor. Sıradaki boş kod `EX-S10`.

**Faz 2a BİTTİ.** Sunucu 26/26, istemci 9/9, uçtan uca doğrulama koşuldu.
**Tenant turu da kapandı** (2026-09-13): `TB-130` · `TB-131` · `TB-133` · `TB-135`
düzeltildi ve testlendi (§6). **Faz 2b'nin beyin fırtınası 2026-09-13'te yapıldı** ve
kapsamı daralttı (§7): gözetmen yoklaması kapsam dışına alındı, görüş penceresi tam
uygulanacak. Sıradaki iş: `TB-140` kısa turu, sonra Faz 2b planı. `TB-139` ayrı tur.

### Görev 8.1 — uçtan uca doğrulama (2026-09-13)

Altı adımın beşi gerçek arayüzde koşuldu; biri kısmen ve sebebi aşağıda.

| Adım | Sonuç |
|---|---|
| Oturum modunda pencere aç, sınavları aynı saate yerleştir | ✅ Öğretmen yolundan (Cem Kılıç) ve yönetici yolundan (Görev 7.9) |
| **İki oturumu birleştir**, derslikler birleşsin, öğrenciler karışsın | ✅ Aynı hücredeki iki Matematik oturumu birleşti: **4 şube · 4 derslik · 31 öğrenci**, sürüm v1→v2, kaynak oturum silindi. Her derslikte `10-B ×2 11-A ×2 11-B ×2 12-B ×2`; sıra listesi dört şubeyi dönüşümlü diziyor — yan yana hiçbir öğrenci kendi şubesinden değil. `R32`'nin onayı hangi oturumun KALACAĞINI ve hangisinin SİLİNECEĞİNİ ad vererek söyledi |
| Gözetmen deliği yarat, yayın engellensin; deliği doldur, geçsin | 🟡 **Yayın engeli ve kalkması doğrulandı** ama `EX-H10` üzerinden değil, `EX-H12` (sırasız öğrenci) üzerinden: dersliksiz oturum yayını engelledi, yeniden üretme derslikleri türetti, engel kalktı, takvim yayınlandı. **`EX-H10` arayüzden tetiklenemedi** — türetme dışarıdan deterministik olarak boş düşürülemiyor (o saatte yayınlanmış dersi olmayan şubelerin dersliklerine bile gözetmen türedi). Kural sunucu entegrasyon testlerinde ölçülü ve ekran ihlal listesini sunucudan olduğu gibi çiziyor |
| Öğrenci ve veli mobilden derslik ve sırayı görsün | ✅ **Gerçek Android cihazda** (Xiaomi M2003J15SC). Öğrenci: 11-B Dersliği sıra 3 + "kendi sınıfında değil" ipucu. Veli: şeritte çocuğun adı, 10-A Dersliği sıra 1 |
| Öğretmen gözetmenlik satırını ve "Gözetmen" rozetini görsün | ✅ Web ve cihazda görev listesi; ders programında dersi olmayan saatte "MATEMATİK 3. SINAV · Gözetmen · 10-B Dersliği" |
| Bulguları deftere işle | ✅ `TB-132`…`TB-138` |

**Dilim 7 + 8.1 turunda çıkan yedi bulgu:** `TB-132` (yöneticinin oturum kurma ekranı
yoktu → Görev 7.9), `TB-133` (yerleştirme saatleri sorgusu okul süzmüyor), `TB-134`
(tasarım "elle gözetmen korunmaz" diyordu, sunucu tersini yapıyor), `TB-135` (pencere
kendi döneminin dışına kurulabiliyor), `TB-136` 🟠 (öğretmen kendi programında okulun
BÜTÜN etiketlerini görüyordu), `TB-137` ve `TB-138` (diyalog yerleşimi ve metni).

### Dal ve ağaç topolojisi (2026-09-13'te ölçüldü)

Faz 2a'nın tamamı **master'a alındı ve push edildi**. Her iki depoda
`feature/exam-session-client` = `master` = `origin/master`; dallar merge'den sonra da
aynı ucu gösterdiği için silinmedi, geride iş bırakmıyorlar.

| Depo | Dal | Uç | Ağaç | Kim |
|---|---|---|---|---|
| `oksis-api` | `feature/exam-session-client` = `master` = `origin/master` | `20ab14bd` | `~/Repositories/oksis-api` | sınav işi |
| `oksis-ui` | `feature/exam-session-client` = `master` = `origin/master` | `3dcfeed` | `~/Repositories/oksis-ui` | sınav işi |
| `oksis-api` | `fix/polish` | `dda332cf` | `~/Repositories/worktrees/oksis-api-polish` | **kullanıcı** — dokunulmaz |
| `oksis-ui` | `fix/polish` | `1ab7a20` | `~/Repositories/worktrees/oksis-ui-polish` | **kullanıcı** — dokunulmaz |

Kapanış merge'leri: `oksis-api` `294ffe62` · `oksis-ui` `ec9ea8c`. Ad aynı olsa da dallar
**master'dan yeniden türetildi**, eski `feature/exam-session` geçmişi master'ın içinde.
Sonrasında iki depo kabuk işi daha aldı: belge merkezine taşıma (`2cf181c6` / `3dcfeed`)
ve bayat kod yorumlarının düzeltilmesi (`20ab14bd`).

---

## 2. Faz 1 — bitti

Kelebek uygulamayan okulu tam karşılar. `master`'da, üç depoda merge edilmiş.

**Sunucu:** `ExamWindow`, `ScheduledExam`, `ExamHourRequest`, öğretmen yerleştirme,
yönetici panosu ve yığılma haritası, iki adımlı yayın, Grades beslemesi, Timetable
etiket katmanı, bildirimler ve sweep'ler.

**İstemci** (`oksis-ui`, 09-08 14:30 → 09-09 10:36, 15 commit, ~7.400 satır):
sınav pencereleri hub'ı, öğretmen yerleştirme ekranı ve saat seçici, yönetici panosu +
ısı haritası + ihlal paneli, pencere oluşturma/yayın modalleri, şube takvimi yazdırma
görünümü, ders programı sınav etiketi (web + mobil), mobil sınav takvimi ekranı,
ayarlarda sınav politikası kartı.

**Faz 1'den devreden, hâlâ açık:** `ExamWindow.OpenReview` yazıldı ama **hiçbir yerden
çağrılmıyor** — görüş penceresi Faz 2b'ye bırakıldı.

---

## 3. Faz 2a — sunucu tarafı bitti (26/26)

**Dal:** `oksis-api` · eski `feature/exam-session` · **46 commit** ·
`8132bad6` (09-09 15:57) → `f19c114a` (09-11 13:17) · **2026-09-12'de master'a merge
edildi ve dal silindi** (bkz. §1 topoloji).

**Son tam regresyon HEAD'de yeşil (2026-09-11):**
`Oksis.Domain.UnitTests` 1041 · `Oksis.Application.UnitTests` 2599 ·
`Oksis.Api.UnitTests` 427 · `Oksis.Tests` (mimari bekçiler) 62 ·
`Oksis.Infrastructure.IntegrationTests` 1381 — **toplam 5.510, başarısız 0.**

### Dilim dilim

| Dilim | Görev | Durum |
|---|---|---|
| 1 — Alan modeli | 1.1 entity'ler · 1.2 `ScheduledExam` bağı · 1.3 kalıcılık + göç | ✅ 3/3 |
| 2 — Türetme ve yerleşim | 2.1 `ExamSeatArranger` · 2.2 `ExamSeatingReader` · 2.3 `ExamRoomDeriver` · 2.4 `ExamInvigilatorDeriver` · 2.5 `ExamSessionComposer` | ✅ 5/5 |
| 3 — Komutlar | 3.1 `CreateExamSession` · 3.2 `PlaceExam` oturum modu · 3.3 `UpdateSessionSections` · 3.4 `MergeExamSessions` · 3.5 derslik ekle/çıkar · 3.6 `SetInvigilator` · 3.7 `SwapSeats`/`RegenerateSeating` | ✅ 7/7 |
| 4 — Kurallar ve yayın | 4.1 kaldırılan + mod kapısına alınan kurallar · 4.2 `EX-H05`/`EX-H06`/`EX-H11` (+ düzeltme turu I-1/I-2/I-3) · 4.3 `EX-S06`, `EX-H12`, yayın kapısı | ✅ 3/3 |
| 5 — Okuma uçları | 5.1 `GetExamSession` (+G-1) · 5.2 pano oturum görünümü · 5.3 öğrenci/veli takvimine derslik + sıra · 5.4 öğretmen gözetmenlik uçları · 5.5 program etiketi · 5.6 gözetmen/derslik aday uçları | ✅ 6/6 |
| 6 — Bildirimler | 6.1 `ExamInvigilationChanged` (üç işleyici, `NotificationType = 40`) | ✅ 1/1 |
| 8 — Kapanış | 8.2 belgeler | ✅ 1/1 |

### Kural kodları — kodda gerçekten yazılı olan 13 tanesi

`EX-H01` `EX-H03` `EX-H05` `EX-H06` `EX-H08` `EX-H09` `EX-H10` `EX-H11` `EX-H12` ·
`EX-S01` `EX-S04` `EX-S05` `EX-S06`

> **`EX-H02` `EX-H04` `EX-H07` `EX-S02` `EX-S03` hiç yazılmadı** (karar `R47`).
> Numara boşluğu kasıtlıdır; "eksik" sanıp doldurmaya kalkma.

**İzinler (koddan doğrulandı):** `exams.manage` (55) · `exams.place` (35) ·
`exams.read` (28) · `exams.report` (13).

**Sözleşme notu:** `ExamViolationDto(string Code, string Severity, string Message,
Guid? ExamId, string? SectionName)` — `Severity` **string**'tir (`"hard"` / `"soft"`),
enum değil. Ekran bunu olduğu gibi çizer.

---

## 4. Faz 2a — istemci dilimi: bitti (9/9 + 8.1)

**Plan:** `2026-09-09-sinav-takvimi-faz2a.md` — belge merkezi yeniden yapılandırmasında
silindi, `oksis` @ `1061fe8^` içinde duruyor (§8). Commit'ler `oksis-ui` deposundandır.

| Görev | Durum | Not |
|---|---|---|
| 7.1 `packages/core` — oturum tipleri + saf mantık | ✅ `e63b61a` | `session.ts`; tipler sunucu DTO'larıyla alan alan birebir |
| 7.2 `packages/api` — uçlar + query'ler | ✅ `d5dcfc8` | 10 uç yolunun 10'u sunucu rotalarıyla birebir |
| 7.3 Web — yerleştirme ekranı oturum modu | ✅ `128ed5f` + `7f0dde3` | Ön koşul `bd95af5` (kelebek modu ekranda kapalıydı); tarayıcıda doğrulandı, üç kusur çıktı (§4.1) |
| 7.4 Web — pano oturum görünümü | ✅ `63a6c38` + `fb993f4` | Izgara tasarımın diline çekildi |
| 7.5 Web — oturum ayrıntısı ekranı | ✅ `de2757c` | 1 815 satır: iki sütun, 7 modal, 9 durumluk matris; üç uyumsuzlukta sunucu kazandı (aşağıda) |
| 7.6 Web — ders programı sınav etiketi | ✅ `6fa6928` | Sunucu ayağı `oksis-api` `f19c114a`; etiket dersi olmayan saatte de çiziliyor |
| 7.7 Mobil — öğrenci/veli takvimine derslik + sıra | ✅ **istemci değişikliği gerekmedi** | `exam-schedule-screen.tsx` alanları Faz 1'de (`455bbd5`) yazılmıştı; eksik olan sunucu ayağıydı (`oksis-api` `1faeaced`). Gerçek cihazda doğrulandı |
| 7.8 Öğretmen gözetmenlik takvimi (web + mobil) | ✅ `f2b696b` | Tek görev, iki platform; sunucu ayağı `oksis-api` `734fbe12` |
| 7.9 Web — yöneticinin oturum kurması | ✅ `4172c25` | `TB-132`; `CreateExamSession` ürüne hiç bağlanmamıştı |
| 8.1 Uçtan uca doğrulama ve örnek veri | ✅ 2026-09-13 | Altı adımın beşi tam, biri kısmen (§1); yedi bulgu çıktı, düzeltmeleri `30f8e97` |

**Kapanış merge'i:** `oksis-ui` `ec9ea8c`.

### 4.1 · Görev 7.3'ün tarayıcı doğrulamasında çıkan üç kusur (2026-09-12, düzeltildi)

Üçü de ekranı **kullanılamaz** bırakıyordu; hiçbiri birim testiyle yakalanamazdı.

1. **Pencere seçici yoktu.** `pickExamPlacementWindow` ilk açık pencereyi alıyordu; Faz 1
   penceresi açıkken öğretmen kelebek penceresine **hiç ulaşamıyordu**. Dönem içinde birden
   çok pencerenin açık olması olağan. `resolveExamPlacementWindow` + şeritte seçici eklendi.
2. **Oturum saati ızgarası öğretmende olmayan izne bağlıydı.** Zil çizelgesi ucu
   `school-settings.view` ister; modal "Zil çizelgesi yüklenemedi" diyor ve düğme hiç
   açılmıyordu. Izgara Faz 1'in kullandığı `slots` ucuna (`exams.place`) taşındı — K-17
   korunuyor, kural core'da tek yerde (`sessionPeriodOptions`).
3. **Derslik türetilemediğinde özet "gözetmenler tamam" diyordu.** Boşluk sayısı sıfırdı
   çünkü doldurulacak derslik yoktu; sırasız kalan öğrenci de hiç görünmüyordu.

**Ayrıca iki ön koşul plan dışıydı ve bulundu:**
- Oturum modu pencere kurma modalinde ve ayarlarda **kapalıydı** (Faz 1 kilidi). Sunucu
  kapısı Görev 4.1'de kaldırılmıştı ama ekran tarafı Dilim 7'nin hiçbir görevinde yoktu →
  arayüzden kelebek penceresi kurulamıyordu (`bd95af5`).
- `s2`'de **hiç fiziksel derslik yoktu ve şubelerin `room_id`'si NULL'dı** → oturum kuruluyor
  ama 0 derslik / 0 sıra türüyordu (`TB-120` alanı). Dev verisi tamamlandı; sonraki oturum
  `[[dev-ortam-giris-bilgileri]]`'ne bakmalı.

**Doğrulanan zincir:** oturum modunda pencere aç → yayınla → öğretmen yerleştirir → oturum
doğar → derslik şubenin ev dersliğinden türer → sıralar serpiştirmeyle üretilir → gözetmen
ders programından atanır. Türkçe oturumu: 1 şube, 1 derslik, 7 sıra, 1 gözetmen.

---

### Görev 7.5'in üç uyumsuzluğu — sunucu kazanır, ekran uyarlanır

1. **Gerekçe eşiği:** tasarım "en az 10 karakter" diyor; sunucu
   `ExamWindow.MinReasonLength = 15`. Ekran **15** yazar ve 15'te etkinleşir.
2. **Kapasite kuralının kodu:** tasarım mock'u `EX-S07` üretiyor; doğrusu **`EX-S06`**.
3. **Gözetmen eksikliği ekranda hesaplanmaz:** tasarım `rooms.filter(r => !r.invigilator)`
   ile istemcide türetiyor — **Kısıt 4'ü çiğner**. Sunucu bunu `EX-H10` olarak döndürür;
   ekran `violations` dizisinden çizer.

**Ayrıca `R32`:** `merge` modalinin onay metni hangi oturumun **silineceğini** ve
hangisinin **kalacağını** ad vererek söylemek zorunda — silme geri alınamaz ve
tasarımın teslim ettiği metin bunu söylemiyor.

### Paralelleştirme kesimi

`7.1 + 7.2` önce biter (ötekiler buna bağımlı). Sonra üç koldan:
`7.3 + 7.4 + 7.6` · `7.5` tek başına · `7.7 + 7.8`. Duvar saati ~7–9 saate iner.
**`R53` gereği her ajan ayrı `git worktree`'de olmalı** — `oksis-ui` tek ağaçta üç
ajanla ölçüm yapılamaz.

---

## 5. Sonraki oturumun ilk on dakikası — ön uçuş

Bu üç adım atlanırsa ekran boş açılır ve bir tur boşa gider.

```bash
# 1. Göçleri uygula — API göçleri otomatik uygulamıyor.
#    Bu yapılmazsa oturum tabloları dev veritabanında YOK ve her ekran "veri yok" gösterir.
cd ~/Repositories/oksis-api
git checkout master   # feature/exam-session-client aynı ucu gösteriyor
dotnet ef database update --project src/Oksis.Infrastructure --startup-project src/Oksis.Api

# 2. API'yi TAZE başlat. Bayat :5112 süreci Faz 1'de codegen'e boş şema ürettirdi
#    ve birden çok tur kaybettirdi.
dotnet run --project src/Oksis.Api

# 3. Şemayı yenile. Üretilen şema boşsa DUR — sunucu bayattır.
cd ~/Repositories/oksis-ui
npm run codegen -w packages/api
```

**Dev ortam:** API `:5112` · Web `:3000` · seed hesapları `s1`'den başlar,
ders programı verisi `s3`'te.

> **Not (2026-09-13'te ölçüldü):** Yukarıdaki üç adım, ekranı **host'taki** geliştirme
> sunucusunda açmak içindir. Daha önce burada anılan `chore/test-env` dalı ve
> `./scripts/test-env.sh` betiği **artık hiçbir depoda yok** — dal silinmiş, betik
> geçmişte de bulunamıyor. Container'da ayağa kaldırma gerekirse yeniden yazılacaktır.

---

## 6. Tenant turu — kapandı (2026-09-13)

Kullanıcı kararı: *"Şimdi, Faz 2b'den önce."* Dört madde tek turda kapandı; hepsinin
testi düzeltmeden ÖNCE kırmızı doğrulandı.

| # | Konu | Sonuç |
|---|---|---|
| `TB-130` | `ExamCaller.ResolveAsync` çağıranı okul süzmeden çözüyor 🟡 | ✅ İmzaya `schoolId` eklendi, **on dört** çağıran bağlandı (defter beş diyordu) |
| `TB-131` | Faz 1 sınav sayaçları pencereyi okul süzmeden okuyor 🟡 | ✅ **Yedi** metot (defter üç diyordu); arayüz imzaları DEĞİŞMEDİ, okul `ITenantContext`'ten okunuyor |
| `TB-133` | Yerleştirme saatleri sorgusu pencereyi okul süzmeden okuyor 🟡 | ✅ İki sorgu + yükleyicinin üç okuması açık yüklemli |
| `TB-135` | Pencere kendi döneminin dışına kurulabiliyor 🟡 | ✅ `CreateExamWindow` dönem sınırını doğruluyor; revizyon komutu yok, dev verisi kendiliğinden düzelmiş |
| `TB-132` | Yöneticinin oturum kurma komutunun ekranı yok 🟡 | ✅ Görev 7.9 olarak yazıldı ve doğrulandı |
| `X-21` | Modül dokümantasyon sistemi ⚪ | ⏸️ **Kullanıcının derleme turuna bırakıldı** (2026-09-13). Silme İŞLETİLMEDİ: ölçüm tazelenince defterin tarifi bayat çıktı — `modules/` altında **75 dosya / 18 809 satır gerçek içerik** var ve `README.md` yalnız 5 modülde dolu, yani "README'yi tut kalan dokuzu sil" çoğu modülde boş dosyayı tutup dolu dosyayı silerdi |
| — | `EX-S04`'ün pencere kapsamına alınması | ⬜ Olgu sözleşmesi değişikliği gerektiriyor; Faz 2b'de mi? |

**Commit'ler:** `oksis-api` `06e03596` (tenant üçlüsü) · `a72856f2` (`TB-135`) ·
`oksis` `cfae923` (defter). Koşum: sınav birim 116/116, sınav entegrasyon 325/325,
`test-changed.sh` 427 + 7 mimari bekçi — temiz.

**Turun iki sürprizi kayda değer.** ① Ölçüm defterin sayısını ikisinde de aştı (5→14
çağıran, 3→7 metot): *bulgu metni bir tarif değil bir işarettir, sayısına güvenilmez.*
② `TB-130` kapanınca `GetMyExamDuties`'in iki `R55` testi kırmızıya döndü, çünkü
güvence bir kat YUKARI taşındı — eskiden çağıran yabancı kişiye çözülüyor ve sorgunun
yüklemi satırı eliyordu; artık kimlik hiç çözülmüyor ve uç `Forbidden` dönüyor.

**Açık kalan kök neden — `TB-139` 🔴.** Yukarıdaki dördü belirtiyi kapattı, hastalığı
değil: küresel süzgeç hâlâ `IsSuperAdmin || (...)` biçiminde ve süper yönetici
oturumunda tümden düşüyor. Ayrı turun ilk adımı ÖLÇÜMDÜR (birden çok okula dokunan
akışlar, `IgnoreQueryFilters()` kullanımları), sonra izin kümesini yeni bir platform
izin modülü etrafında kurmak ve "üstlenme"yi onaya bağlı, gerekçeli, süreli ve
denetlenir yapmak.

> **Ölçülmüş ders (mutasyon turu, `M17`):** okul yüklemi kaldırılınca sorgu paylaşılan
> entegrasyon veritabanının **tamamını taramaya** başladı; on testlik sınıf 50 dakikada
> bitmedi, tek teste daraltınca 9 saniyede kırmızı verdi. **Okul yüklemi yalnız bir
> güvenlik sınırı değil, sorgunun kapsamını tutan şey.** `TB-130`/`TB-131`'in ikinci
> maliyeti performanstır ve veri büyüdükçe sessizce artar.

---

## 7. Faz 2b — kapsam kilitlendi (2026-09-13 beyin fırtınası)

**Kapsam:** kapı listesi · oturma planı · gözetmen çizelgesi çıktıları · görüş penceresi
(`ExamWindow.OpenReview` + `SessionReviewComment`) ve `ExamReviewOpened`.

**Kapsam DIŞI (bu turda alınan karar):** gözetmen yoklaması ve Attendance bağı.

### Alınan beş karar

| # | Soru | Karar | Gerekçe |
|---|---|---|---|
| 1 | Kelebekte yoklamayı kim alır? | **Sınav saatinde yoklamaya hiç dokunulmaz.** Sunucuda tek satır değişmez; yoklamayı ders öğretmeni normal akışından alır, gözetmen kâğıt imza listesi tutar | Kelebeğe özel ikinci bir yoklama sistemi istenmiyor |
| 2 | Üç çıktı nereden beslenir? | Kapı listesi ve oturma planı **`GetExamSession`'ın mevcut okumasından**; yalnız gün/pencere eksenli **gözetmen çizelgesi için yeni sorgu** | Faz 1'in "yeni sorgu açılmaz" kuralı korunur; ekranda karşılığı olmayan tek çıktı çizelgedir |
| 3 | Görüş penceresi? | **Tam uygulanacak** — `SessionReviewComment` varlığı, aç/yorum bırak/çözüldü işaretle komutları, `ExamReviewOpened` bildirimi, öğretmen yüzeyi | Alanlar ve okul ayarı zaten yarım duruyordu |
| 4 | Görüş süresi dolmadan yayın? | **Yumuşak kapı** — uyarı üretir, yönetici gerekçe yazarak geçer | `EX-H08` (7 gün) ve `EX-S05` emsali: kural sunucuda, kaçış yolu izli |
| 5 | Açık (çözülmemiş) yorum? | **Uyarı üretir, gerekçe ister** — yayın ön kontrolünde listelenir | Yorum sessizce gömülmez, ama tek unutulmuş yorum yayını kilitlemez |

### Kararların sonuçları

**① Omurga spec §5.4 hükümsüz.** Orada yazılı olan *"ders öğretmeni o saatte kendi
şubesinden yoklama almaya kalkarsa 'bu saat sınav oturumunda, yoklama gözetmenden gelir'
hatası"* kuralı ve onu denetleyecek `IsInExamSession(classRoomId, date, period)` sorgusu
**yazılmayacak**. Sınav saatinde şube oturumu normal akışında kalır; yoklama hatırlatma
sweep'i de o saatleri normal ders gibi görmeye devam eder. `AttendanceSession`'ın tek
`ActualTakerId` alanı ve `Submit`'in "hepsi ya da hiç" varsayımı **değişmeden kalır**.

**② Faz 2b küçüldü.** Sunucu tarafında Attendance'a hiç dokunulmuyor; yeni yazılacak tek
alan modeli `SessionReviewComment` (oturum, öğretmen, metin, çözüldü mü).

**③ Yayın kapısı iki yeni yumuşak kural kazanıyor** — ikisi de `ExamRuleInspector.CheckPublish`
içine, mevcut `EX-S` kalıbıyla: görüş süresi dolmadan yayın, ve açık yorumla yayın.

### Faz 2b'nin dilim iskeleti

**Plan yazıldı:** `oksis/docs/gecici/planlar/2026-09-13-sinav-takvimi-faz2b.md` — beş dilim,
on iki görev, dört açık karar. Aşağıdaki iskelet onun özetidir.

1. **Görüş penceresi — sunucu:** `SessionReviewComment` + `OpenExamReview` /
   `AddSessionReviewComment` / `ResolveSessionReviewComment` komutları + iki yayın kuralı +
   `ExamReviewOpened` bildirimi.
2. **Gözetmen çizelgesi sorgusu:** gün/pencere ekseninde derslik × gözetmen okuması.
3. **İstemci — üç çıktı:** kapı listesi ve oturma planı oturum ekranından, çizelge kendi
   sorgusundan; yazdırma kalıbı Faz 1'in `exam-print-section-schedule.tsx`'i.
4. **İstemci — görüş yüzeyi:** öğretmenin yorum bırakması, yöneticinin çözüldü işaretlemesi,
   yayın ön kontrolünde iki yeni uyarının çizilmesi.

### Bu fazda hiç yapılmayacaklar

Derslik müsaitliği/tadilat kavramı (`K-24`) · derslik başına ikinci gözetmen (`K-25`) ·
dersliğin sıra × sütun düzeni · şube dersliğinin zorunlu kılınması (`K-26`, `TB-120`) ·
**gözetmen yoklaması ve Attendance bağı** (yukarıdaki 1 numaralı karar).

### Faz 2b'den önce

✅ **`TB-140` turu bitti** (2026-09-13, `oksis-api` @ `1905abbc`). Yoklama ve duyuru
modüllerinin çağıran çözümleyicileri okul yüklemine bağlandı; ölçüm defterin sayısını yine
aştı (21 dosya değil **35 çağrı**, üç modül) ve kapsam büyüdü: kaynak kontrolü yapan dokuz
okuma ile mazeret uygulayıcısının yazma yolu da yüklem aldı. Testi önce kırmızı doğrulandı;
koşum birim 2603 + 427 + 7, entegrasyon 1386/1386. Ayrıntı defterde.

✅ **`EX-S04` Faz 2b'ye alındı** (karar 2026-09-13): bugün yalnız oturum kapsamında çalışıyor
ve yayın kapısında hiç yok; pencere kapsamı olgusu eklenip yayın listesinde üçüncü yumuşak
kural olacak. Planın dört açık kararının dördü de aynı gün bağlandı — yorum metni 10–1000,
yorum **izin istemez** (öğretmen olmak yeterli), çıktılar `exams.manage`.

---

## 8. Kaynak haritası

**2026-09-13 uyarısı:** belge merkezi yeniden yapılandırmasında (`oksis` @ `1061fe8`)
`docs/superpowers/` tümüyle silindi — omurga tasarımı ve iki fazın plan/spec'leri dahil.
Kaybolmadılar, **çalışma ağacında yoklar**; `git show 1061fe8^:<yol>` ile okunur.
Modülün yaşayan bilgisi artık domain notundadır.

| Ne | Nerede |
|---|---|
| **Modülün domain notu (kapsam, akışlar, kural kodları, açık sorular)** | `oksis/docs/domain/moduller/Sınav Takvimi.md` |
| Kelebek kararı — derslik ve gözetmen türetilir | `oksis/docs/domain/kararlar/0017-kelebek-derslik-ve-gozetmen-turetilir.md` |
| Sınav kuralları denetleyicide kararı | `oksis/docs/domain/kararlar/0018-sinav-kurallari-denetleyicide.md` |
| Omurga tasarımı (üç fazın ortak iskeleti) | ⚠️ `git show 1061fe8^:docs/superpowers/specs/2026-09-08-sinav-takvimi-modulu-design.md` |
| Faz 1 planı | ⚠️ `git show 1061fe8^:docs/superpowers/plans/2026-09-08-sinav-takvimi-faz1.md` |
| Faz 2a tasarımı | ⚠️ `git show 1061fe8^:docs/superpowers/specs/2026-09-09-sinav-takvimi-faz2a-design.md` |
| Faz 2a planı | ⚠️ `git show 1061fe8^:docs/superpowers/plans/2026-09-09-sinav-takvimi-faz2a.md` |
| Ekran tasarım brief'i | `oksis/docs/gecici/tasarim-briefleri/sinav-takvimi-ekranlari-brief.md` |
| Bulgu Kayıt Defteri | `oksis/docs/bulgular/OKSİS - Bulgu Kayıt Defteri.md` |
| Kapanmış bulgular | `oksis/docs/bulgular/OKSİS - Bulgu Arşivi.md` |
| **Faz 2a uygulama defteri (kararlar `R1`–`R59`)** | `oksis-api/.superpowers/sdd/2026-09-09-sinav-takvimi-faz2a/progress.md` (git dışı, diskte) |

**Defterde bir sonraki boş kimlikler:**
`B-51` · `D-19` · `V-04` · `X-22` · `TB-140` · `E-24` · `ENG-03`

---

## 9. Bu fazda doğan ve kalıcı olan süreç kuralları

Tam hâlleri uygulama defterinde; burada yalnız istemci tarafında da geçerli olanlar.

- **`R43`** — dosya kopyalama mtime'ı korumaz; MSBuild yeniden derlemeyi atlar ve test
  mutasyonlu ikili üzerinde koşar. Kopyadan sonra `touch` şart.
- **`R48`** — mutasyon geri alımı **yedek kopyayla** yapılır; `git checkout` / `git restore`
  **asla** (paylaşılan ağaçtaki commit'lenmemiş işi yok eder).
- **`R53`** — paralel ajanlar paylaşılan ağaçta ölçüm yapamaz. Her ajan kendi
  `git worktree add --detach` ağacında koşar; commit ana ağaçta `git commit -- <yol>` ile.
- **`R56`** — hız sınırı rejiminde paket yeşile döner dönmez commit'le, mutasyon turunu
  sonra koştur.
- **`R58`** — `TreatWarningsAsErrors=true` + `EnforceCodeStyleInBuild=true` altında bir
  yüklemi **silen** mutasyon parametreyi okunmamış bırakır → **derleme hatası, test
  kazanımı değil**. Mutasyon derlenmek zorundadır: "parametreyi okuyan ama yüklemi
  etkisizleştiren" varyant yazılır.
- **`R59`** — `R58` bilinmeden koşmuş her mutasyon turunun ham kaydı `error CS` için
  denetlenir. Faz 2a'nın iki turu denetlendi ve tabloları düzeltildi.
