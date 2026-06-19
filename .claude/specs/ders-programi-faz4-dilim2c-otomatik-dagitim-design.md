# Ders Programı — Adil Otomatik Nöbet Dağıtımı (Faz 4 / Dilim 2c) Tasarımı

**Durum:** Tasarım kararları onaylandı (analiz okuması + brainstorming, kullanıcı onayı 2026-06-20)
**Tarih:** 2026-06-20
**İlgili bağlayıcı spec:** `.claude/specs/ders-programi-modulu-spec.md` (Faz §1, K0.6 tek doğruluk kaynağı)
**Önceki dilimler:** `ders-programi-faz4-dilim2a-nobet-cizelge-design.md` (2a — Nöbet Çizelgesi, TAMAM) · `ders-programi-faz4-dilim2b-vekalet-design.md` (2b — Vekâlet, TAMAM)
**Modül:** `timetable` + `Duties` (`.claude/docs/modules/timetable/`)
**Kapsam:** Faz 4 / Dilim 2c — Adil Otomatik Nöbet Dağıtımı (NÖ-4)
**Kaynaklar:** `Nobet-Vekalet-Ihtiyac-Analizi.docx` (§3.3 nöbet sıklığı, §6.5 solver ilişkisi, NÖ-4) · `Nobet-Vekalet-Teknik-Analiz.docx` (§3.1 `EnqueueAutoDistributeDutyCommand`) · Faz 3 ders-programı autogen (`IScheduleSolver` deseni, `business-rules.md` BR-TT-AG-*)

> Bu dosya `.claude/specs/` altındadır → **bağlayıcı anlaşma** (CLAUDE.md Absolute Rule #6).
> Numaralı kararlar (`K-2c-*`) pazarlık dışıdır. Aykırılıkta dur, madde no ile bildir.

---

## 0. Konumlandırma

Dilim 2 (Nöbet & Vekâlet) dört alt-dilime ayrıldı (2a/2b/2c/2d — bkz. 2a tasarımı §0). **2a (Nöbet Çizelgesi) ve 2b (Vekâlet) tamam.** Bu doküman **2c (Adil Otomatik Dağıtım)**'ı tanımlar.

2a admin ekranında (`DutyAdminPage` toolbar) **"Adil Otomatik Dağıt" butonu şu an `disabled`** (2a tasarımı §6 NÖ-4 → 2c'ye ertelendi). 2c bu butonu gerçek bir öner≠uygula akışıyla aktifleştirir.

**Çekirdek kavram (İhtiyaç §3.3, §6.5):** Adil otomatik dağıtım, ders programı otomatik üretiminin (Faz 3) "adil atama" problemine benzer: kısıtlar (kapsama, müsaitlik, muafiyet, kapasite tavanı) + hedef (dengeli/adil dağıtım). Adalet **katı bir kural değil, okul-bazlı yük dengeleme politikasıdır** (İhtiyaç §3.3). Mevcut `IScheduleSolver` port deseni ve "üret ≠ uygula" yaklaşımı buraya da uygulanır; sıfırdan altyapı gerekmez.

---

## 1. Amaç & Mevcut Zemin

2a manuel nöbet çizelgesini kurdu: `DutyRoster` aggregate (Draft→Published→Superseded), `DutyAssignment` (öğretmen×gün×bölge + opsiyonel yancı), `DutyLocation` (kapasite 1–4), `DutyExemption` (Permanent/Temporary), `FairnessPanel` (kişi-başı yük), filtreli unique index'ler (`ux_duty_roster_live`, `ux_duty_assignment_teacher_cell`). 2a'da iki politika ayarı **inert** bırakıldı (K-2a-5, Debt-D8):

- `DutyWeeklyFrequency` (TwicePerWeek / OncePerWeek / OnceEveryTwoWeeks) — SchoolSettings
- `DutyDayPattern` (Spread / Consecutive) — SchoolSettings
- `DutiesRelieverEnabled` (bool) — SchoolSettings (her duty ekranını gate'ler)

2c'nin kattığı: bu politikaları + müsaitlik (Faz 4/D1) + muafiyet + kapasite kısıtlarını girdi alan bir **solver**, "öner≠uygula" akışı, ve sonucu mevcut `DutyRoster` Draft'ına yazan bir uygulama adımı. Admin sonra 2a `PublishDutyRoster` ile yayınlar.

**Mevcut durum özeti:**
- ✅ Reuse: `DutyRoster`/`DutyAssignment` domain (atama/yancı/kapasite/INV'lar), `TeacherAvailabilityProvider` (Faz 4/D1), muafiyet sorgu mantığı (`GetAvailableRelievers` — yalnız Permanent dışlar, Debt-D2), yayınlanmış program okuma (yancı uygunluğu için).
- ✅ Reuse desen: Faz 3 `ScheduleGenerationJob` + Hangfire job + poll + apply akışı (birebir simetri).
- ❌ Sıfırdan: `IDutySolver` + feasibility/scoring, `DutyDistributionJob` entity, 3 endpoint, `DutyAutoDistributeDrawer` (web).

---

## 2. Bağlayıcı Kararlar (kullanıcı onaylı — 2026-06-20)

- **K-2c-1 — Hibrit hedef modeli (kapsama HARD + adalet SOFT).** Solver feasibility (hard kısıt) + scoring (soft hedef) ayrımıyla çalışır; Faz 3 `IScheduleSolver` felsefesiyle simetrik. Adalet katı kural değildir (İhtiyaç §3.3) → soft.

- **K-2c-2 — Kapsama: en az 1 zorunlu, kapasite üst sınır.** HARD: her **aktif (gün×bölge)** hücresinde **≥ 1 nöbetçi** olmalı; doldurulamazsa hücre **eksik** işaretlenir + `RelaxationHints` üretilir (hard hata değil; autogen `MissingHours` deseni). Kapasite (1–4) bir **üst sınırdır** (tavan, asla aşılamaz), talep değildir. Bir hücredeki gerçek nöbetçi sayısını **arz** (öğretmen × sıklık hedefi) + adalet belirler; solver fazla öğretmenleri tavana kadar boş kapasiteye dengeli yayar.

- **K-2c-3 — Sıklık yorumu (per-öğretmen haftalık hedef); biweekly kapsam dışı.** `DutyWeeklyFrequency` solver'da öğretmen başına haftalık **hedef nöbet-gün sayısıdır**: TwicePerWeek=2, OncePerWeek=1. **`OnceEveryTwoWeeks` solver tarafından desteklenmez** (tek-haftalık tekrar eden şablonda A/B hafta rotasyonu gerektirir → 2c kapsamını şişirir). Bu sıklık seçiliyken "Adil Otomatik Dağıt" **disabled** + tooltip. Sıklık hedefi **soft**: hedefin altı/üstü ceza alır; coverage (K-2c-2) hard önceliklidir (kapsama için gerekirse öğretmen hedefin üstüne çıkabilir).

- **K-2c-4 — Yancı birlikte dağıtılır (parametre açıksa).** `DutiesRelieverEnabled` açıksa solver ana nöbetçiyi atadıktan sonra her nöbet için öğle penceresinde **müsait** (o slotta dersi/başka nöbeti olmayan, ≠ nöbetçi — INV-D4) bir yancıyı da atar; yancı yükü **ayrı bir denge ekseni** olarak hafif puanlanır. Parametre kapalıysa yancı katmanı hiç çalışmaz (atama da gösterim de yok).

- **K-2c-5 — İki uygula modu (kullanıcı seçer).** Sihirbazda `Sıfırdan kur` / `Boşları doldur` toggle'ı:
  - `FromScratch` (autogen BR-TT-AG-2 deseni): solver tüm çizelgeyi sıfırdan üretir; uygula, seçilen sonucu mevcut Draft'ın **yerine** koyar.
  - `FillEmpty`: admin'in elle attığı (dolu) hücreler **korunur** (pinned); solver yalnız boş (gün×bölge) hücreleri doldurur ve yük dengesini **kalan kapasite + atanmamış öğretmenler** üzerine kurar.

- **K-2c-6 — Müsaitlik (Faz 4/D1): Unavailable HARD (gün), PrefersNot SOFT.** Öğretmen o gün **nöbet penceresine denk gelen period'larda** Unavailable ise solver o güne otomatik nöbet **yazmaz** (hard, gün-seviyesi ele). PrefersNot slotları o gün için **ceza ağırlığı** olur (soft). Manuel override yolu (`timetable.override`, K-2a/D1 deseni) açık kalır — solver yalnız **otomatik** yerleştirmede hard eler. Dilim-1 üç-durumlu modeliyle tutarlı.

- **K-2c-7 — Muafiyet HARD dışlama.** Muaf öğretmen solver havuzundan tamamen çıkarılır (INV-D1 ile tutarlı): **Permanent** her zaman; **Temporary** ise çizelgenin hedef yürürlük tarihi (`EffectiveFrom`, yoksa dönem başı) muafiyet aralığına denk geliyorsa. Not: 2a manuel `GetAvailableRelievers` yalnız Permanent dışlar (Debt-D2, tarih-bağımsız); 2c solver tarih-duyarlı Temporary dışlamayı **bilinçli olarak ekler** çünkü dağıtım belirli bir yürürlük tarihine bağlanır. Bu fark Debt-D2'nin solver-tarafı iyileştirmesidir, çelişki değildir.

- **K-2c-8 — Tek öneri (3 aday değil).** Solver tek dengeli çizelge üretir (Faz 3'teki 3-aday/strateji modeli **kullanılmaz**); admin önizler, ince-ayar yapar, uygular. Nöbet problemi (gün×bölge) ders programından küçük → çoklu strateji marjinal fayda.

- **K-2c-9 — Öner≠uygula + Hangfire.** `IDutySolver` saf Application solver; Hangfire job arka planda çözer; admin poll ile sonucu alır, onaylar, uygular. Uygula seçilen sonucu `DutyRoster` Draft'ına yazar (durum Draft kalır). **Yayın ayrı adımdır** (2a `PublishDutyRoster`). Yeni izin yok → **`duties.manage`**.

- **K-2c-10 — Deterministik açgözlü solver.** RNG yok (Faz 3 `GreedySolver` deseni); aynı girdi → aynı çıktı (test edilebilirlik). İleri optimizasyon (OR-Tools/metasezgisel) kapsam dışı (Debt-2c, aşağıda).

---

## 3. Solver Modeli

### 3.1 Çalışma birimi & girdiler

- **Talep birimi:** aktif `DutyLocation` × çalışma günleri (Pzt–Cum). Her (gün×bölge) **en az 1, en çok kapasite** nöbetçi alır (K-2c-2).
- **Öğretmen havuzu:** okul öğretmenleri − muaf (K-2c-7).
- **Müsaitlik:** `TeacherAvailabilityProvider` (Faz 4/D1) — gün-seviyesi hard/soft sinyal (K-2c-6).
- **Yayınlanmış program:** yalnız **yancı uygunluğu** için (öğle penceresinde boşta + o gün okulda mı). Ana nöbetçi için ders çakışması yoktur — nöbet teneffüs/öğle penceresinde aktiftir (İhtiyaç §6.1), ders saatiyle çakışmaz.
- **Politika:** `DutyWeeklyFrequency` (hedef gün/öğretmen) + `DutyDayPattern` + `DutiesRelieverEnabled` (SchoolSettings).

### 3.2 HARD kısıtlar (feasibility — `DutyFeasibility`)

| Kısıt | Kaynak |
|---|---|
| Muaf öğretmen atanmaz | INV-D1 / K-2c-7 |
| Öğretmen gün-tekilliği (bir öğretmen/gün tek bölge) | INV-D2 |
| Bölge kapasitesi aşılamaz (üst sınır) | INV-D3 / K-2c-2 |
| Unavailable (nöbet penceresi, gün) → o güne yazılmaz | K-2c-6 |
| Yancı ≠ nöbetçi + yancı o öğle penceresinde dersi/başka nöbeti yok | INV-D4 / K-2c-4 |

### 3.3 SOFT puanlama (`DutyFairnessScorer`)

Ağırlıklı metrikler (düşük = iyi; coverage hard önce gelir):

- **Yük dengesi:** öğretmen başına nöbet sayısının varyansı (min).
- **Sıklık hedefi uyumu:** her öğretmenin atanan gün sayısı `DutyWeeklyFrequency` hedefinden saptıkça ceza (K-2c-3).
- **Gün düzeni (`DutyDayPattern`):** 2+ günü olan öğretmen için — `Spread`: günler arası boşluğu artır; `Consecutive`: ardışık günleri ödüllendir.
- **PrefersNot cezası:** soft müsaitlik tercihi (K-2c-6).
- **Yancı yük dengesi:** (yancılık açıksa) yancı sayısının ayrı varyansı, hafif ağırlık (K-2c-4).

### 3.4 Algoritma (deterministik açgözlü)

1. **Coverage-first:** her aktif (gün×bölge) için ≥1 nöbetçi sağlanana dek, uygun (feasible) öğretmenlerden **en az yüklü + hedefe en uzak (altında)** olanı seç (MRV benzeri sıralama; deterministik tie-break: teacherId).
2. **Surplus dağıtımı:** kalan arz (öğretmen × hedef − atanmış) tükenene veya tüm kapasite tavanları dolana dek, boş kapasiteli hücrelere dengeyi bozmayan atamalar ekle.
3. **Yancı geçişi** (parametre açıksa): her nöbet için feasible yancı havuzundan en az yüklü yancıyı ata.
4. **Skorla:** `DutyFairnessScorer` ile sonucu puanla; metrikleri (atanan, eksik, denge, kişi-başı dağılım) sonuç DTO'suna koy.
5. **Kapsama sağlanamazsa:** eksik hücreler + `RelaxationHints` (örn. `too-many-exemptions`, `capacity-too-high`, `not-enough-teachers`, `availability-too-restrictive`) üret. Sonuç yine uygulanabilir (eksiklerle).

---

## 4. Backend (oksis-api)

### 4.1 Kalıcılık

- **Yeni entity `DutyDistributionJob`** (`[academic]` şema; Faz 3 `ScheduleGenerationJob` simetrisi): `Id`, `SchoolId`, `AcademicYearId`, `AcademicTermId`, `Status` (Queued/Running/Done/NoSolution/Failed), `Mode` (FromScratch/FillEmpty), `ResultJson`, `HintsJson`, audit + rowversion. Migration `YYYYMMDD_add_duty_distribution_jobs`.
- Yeni tablo/aggregate yok onun dışında — sonuç `DutyRoster` Draft'a yazılır (mevcut `SaveDutyRosterDraft` yolu / domain metotları reuse).

### 4.2 CQRS slice

- `EnqueueAutoDistributeDutyCommand(termId, mode)` → `DutyWeeklyFrequency` biweekly ise reddet (validator); program/dönem doğrula; job oluştur (Queued); Hangfire'a al. İzin `duties.manage`.
- `GetAutoDistributeDutyStatusQuery(jobId)` → durum + (Done ise) sonuç DTO (önizleme ızgarası + metrikler + hints). Self/tenant-scope.
- `ApplyAutoDistributeDutyCommand(jobId)` → job sonucu + mode → `DutyRoster` Draft (FromScratch: mevcut aktif atamaları sil-yeniden kur; FillEmpty: dolu hücreleri koru, boşları doldur) → Draft. Retry-idempotency guard (yalnız Done job uygulanır).

### 4.3 Hangfire job

`AutoDistributeDutyJob`: tenant `SetForLoginFlow` → girdileri topla (lokasyon/öğretmen/muafiyet/müsaitlik/politika/program) → `IDutySolver.Solve(...)` → sonuç/hint sakla → durum Done/NoSolution/Failed. Idempotency: yalnız Queued koşar.

### 4.4 API (3 endpoint — `DutiesController`, `duties.manage`)

| Endpoint | Açıklama |
|---|---|
| `POST /api/v1/duties/auto-distribute` (body: `mode`) | → `jobId` |
| `GET /api/v1/duties/auto-distribute/{jobId}` | durum + sonuç |
| `POST /api/v1/duties/auto-distribute/{jobId}/apply` | seçilen sonucu Draft'a uygula |

Detaylar `api-contracts.md` § Nöbet Otomatik Dağıtım bölümüne işlenecek.

### 4.5 Yerleşim

```
Oksis.Application/Modules/Duties/AutoDistribute/
  Solver/  IDutySolver.cs · DutySolver.cs · DutyFeasibility.cs · DutyFairnessScorer.cs · DutyDemandBuilder.cs
  Commands/ EnqueueAutoDistributeDuty/ · ApplyAutoDistributeDuty/
  Queries/  GetAutoDistributeDutyStatus/
  Jobs/     AutoDistributeDutyJob.cs
Oksis.Domain/Modules/Duties/  DutyDistributionJob.cs
Oksis.Infrastructure/  EF config + migration
```

---

## 5. Web (oksis-web)

- **Tetikleyici:** `DutyAdminPage` toolbar'ındaki **disabled "Adil Otomatik Dağıt"** butonu aktifleşir. `DutyWeeklyFrequency = OnceEveryTwoWeeks` ise buton disabled + tooltip (`autoDistribute.biweeklyUnsupported`).
- **`DutyAutoDistributeDrawer`** (Faz 3 `AutoGenDrawer` simetrisi):
  - **Ayarlar:** mod toggle (`Sıfırdan kur` / `Boşları doldur`); mevcut politika rozetleri salt-okunur (sıklık · gün düzeni · yancılık).
  - **Dağıtılıyor:** enqueue → poll (~1200ms).
  - **Sonuç:** dolmuş (gün×bölge) ızgara önizleme + metrik kartları (atanan / eksik / denge) + kişi-başı yük + (varsa) `RelaxationHints` listesi.
  - **Çözüm yok / eksik:** ipuçları gösterilir; yine de "Uygula" mümkün (eksiklerle).
  - **Uygula:** `apply` → Draft'a yazar → editöre (DutyAdminPage Çizelge sekmesi) döner; admin ince-ayar + 2a `Yayınla`.
- **State:** server state yalnız React Query; tenant-scope key'ler (`dutyKeys.autoDistribute(...)`). Zustand'a kopyalanmaz.
- **i18n:** `duties.autoDistribute.*` (tr/en) — ayarlar, mod, metrikler, hint kodları, durum varyantları, biweekly tooltip.

---

## 6. Test Stratejisi

- **Application solver unit:** feasibility (muafiyet/gün-tekilliği/kapasite/Unavailable/yancı), coverage ≥1, surplus tavana yayılım, sıklık hedefi, `DutyDayPattern` (spread/consecutive), PrefersNot cezası, yancı uygunluğu, NoSolution + hints, determinizm (aynı girdi→aynı çıktı).
- **Command/query handler:** enqueue (biweekly reddi), status, apply (FromScratch vs FillEmpty), idempotency guard.
- **Integration:** `DutyDistributionJob` kalıcılık + apply iki mod (Draft sonucu doğrulama).
- **Web vitest:** drawer akışı (ayar→poll→sonuç→apply), biweekly-disabled, boş/hata/eksik-hint/sonuç varyantları, mod toggle.

---

## 7. Kapsam Dışı / Borç (post-2c)

- **Debt-2c-1 (biweekly):** `OnceEveryTwoWeeks` otomatik dağıtımda desteklenmez (K-2c-3). Gerçek A/B hafta rotasyonu ileri iş.
- **Debt-2c-2 (solver heuristik):** Deterministik açgözlü; OR-Tools/metasezgisel optimizasyon kapsam dışı (K-2c-10).
- **Debt-2c-3 (tek aday):** Çoklu strateji/aday yok (K-2c-8).
- **Debt-2c-4 (muafiyet semantiği):** Yalnız Permanent dışlanır (Debt-D2 ile tutarlı); Temporary-bugün ince ayrımı 2c'de de ertelenir.
- **2d (yük/adalet raporu, nöbet defteri):** Ayrı dilim.

---

## 8. Referanslar

- `.claude/specs/ders-programi-modulu-spec.md` — Faz §1, K0.6
- `.claude/specs/ders-programi-faz4-dilim2a-nobet-cizelge-design.md` — K-2a-* (özellikle K-2a-5 politika ayarları)
- `.claude/specs/ders-programi-faz4-dilim2b-vekalet-design.md` — 2b vekâlet
- `.claude/docs/modules/timetable/business-rules.md` — BR-TT-AG-* (Faz 3 solver desenleri)
- `.claude/docs/modules/timetable/completion_status.md` — Faz 3 (`ScheduleGenerationJob`/autogen), Faz 4/D1 (müsaitlik), 2a/2b (Duties), Debt-D8
- `Nobet-Vekalet-Ihtiyac-Analizi.docx` (§3.3, §6.5, NÖ-4) · `Nobet-Vekalet-Teknik-Analiz.docx` (§3.1)
