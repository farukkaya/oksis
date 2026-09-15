# Sınav Takvimi — Kapanış Turu Planı (2026-09-15 gecesi)

> **Ne bu dosya:** ekran testi Bölüm A+B'den kalan açık maddelerin kapatılma planı.
> Kararlar kullanıcıyla 2026-09-15'te bağlandı; uygulama tek oturumda, madde madde,
> her biri kendi commit'iyle.
> **Dal:** `feature/exam-session` (api) · `feature/exam-session-client` (ui) — **push YOK.**

---

## 0. Defter bayat çıktı — önce bu düzeltilir

Plan yazılırken her madde koda karşı ölçüldü. **Üç madde defterde açık, kodda kapalı:**

| ID | Defter | Gerçek |
|---|---|---|
| `TB-147` 🔴 | açık | ✅ `oksis-api` `0e376bb6` — `EX-H13` yazılı, üç testi var |
| `TB-149` 🟡 | açık | ✅ `oksis-api` `f731f0fd` — istek kapısı + artakalan temizliği |
| `TB-146` 🟠 | açık | ✅ `oksis-ui` `13fe955` — "Saati Talep Et" |
| `TB-124` 🟡 | açık | 🟡 yarı — `EX-H07` yazılı (`CreateExamWindowCommandHandler:48`), `EX-H02` yok |

Sınıf `TB-132` ile aynı: **kapanış commit'le birlikte yazılmazsa yazılmıyor.**
Defter düzeltilir, üçü arşive taşınır.

---

## 1. Bağlanan kararlar (2026-09-15)

| ID | Karar |
|---|---|
| `TB-154` | Gerekçe isteyen kodlar: `EX-H08` · `EX-S05` · `EX-S07` · `EX-S08`. `EX-S04`/`EX-S06` yalnız görünür (K-23). Liste `packages/core`'da tek yükleme yazılır; ekran ve sunucu onu okur. **`EX-S07` kullanıcı sorusunda sayılmamıştı; Faz 2b kararı #4 gereği eklendi.** |
| `TB-159` | İkisi de: ① `MoveExamSession` komutu ② oturum ekranına şube düzenleme yüzeyi |
| `TB-143` | (a) Cümleyi gerçeğe çevir — "Bu dönemde açılabilecek tür kalmadı". Tür yönetimi `TB-139`'a bırakılır |
| `TB-145` | `ExamWindowPublished` okulun tamamına gider |
| `TB-148` | Muhafazakâr paket: bekleyen istek varsa geri alma reddedilir · kelebekte öğretmene açılmaz · bildirim yok |
| `TB-151`/`TB-144` | Taslakta oturum kurulamaz (ekran + sunucu kapısı); taslakta ihlal sayacı gösterilmez |

---

## 2. Sıra

Her madde: **ölç → yaz → test → commit → deftere işle.** Testi yeşil olmadan sonrakine geçilmez.
Bir madde beklenenden büyük çıkarsa **atlanır** ve sebebi yazılır; yarım iş commit edilmez.

| # | ID | Depo | Ağırlık |
|---|---|---|---|
| 1 | Defter düzeltmesi (§0) | `oksis` | S |
| 2 | `TB-154` gerekçe yüklemi | core + api + web | M |
| 3 | `TB-159` oturum taşıma + şube düzenleme | api + ui | **L** |
| 4 | `TB-152` elenen şube sebebiyle görünür | api + web | M |
| 5 | `TB-156` görüş döngüsünün iki bildirimi | api | M |
| 6 | `TB-148` öğretmen geri alma | api + web | M |
| 7 | `TB-145` duyuru kapsamı okul geneli | api | S |
| 8 | `TB-143` modal cümlesi | web | S |
| 9 | `TB-151`+`TB-144` taslak panosu | web + api | S |
| 10 | `TB-124` kalanı — `EX-H02` | api | S |
| 11 | `TB-128`/`TB-129` ölçüm, gerekirse kapanış | api | S |

## 3. Kapsam dışı (cihaz/göz gerektirir)

`TB-158` (MIUI kayan bildirim · iOS token) · `TB-142` kalanı (`:fiil` kalıbı) — kullanıcıya kalır.
`TB-150` kalanı (resmî yazı çıktısı) Playwright ile ölçülebilir; sıranın sonunda vakit kalırsa.
