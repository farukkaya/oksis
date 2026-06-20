# Ders Programı — Nöbet Yük Raporu (Faz 4 / Dilim 2d) Tasarımı

**Durum:** BE + FE (yönetici) uygulandı (2026-06-20); öğretmen self + mobil + export sonraki turlar (Debt)
**Tarih:** 2026-06-20
**İlgili bağlayıcı spec:** `.claude/specs/ders-programi-modulu-spec.md` (Faz §1 Faz 4; tek doğruluk kaynağı K0.6)
**Önceki dilimler:** `…dilim2a-nobet-cizelge-design.md` (roster/muafiyet/yancı), `…dilim2b-vekalet-design.md` (`ScheduleException`/`TeacherSubstitution`)
**Modül:** `timetable` + `Duties`
**Kapsam:** Faz 4 / Dilim 2d — Dönem nöbet/yancı/vekâlet **yük & adalet raporu** (salt-okunur)
**Kaynak analizler:** `Nobet-Yuk-Raporu-Ihtiyac-Analizi.docx` (RAP-1…8), `Nobet-Yuk-Raporu-Teknik-Analiz.docx` (v1.0)
**Tasarım handoff'u:** `oksis-web/design-handoff/nobet-yuk-raporu/` (`duty_report.jsx` · `DutyReportScreen` · çekirdek hesap `dtrBuild`)

> Bu dosya `.claude/specs/` altındadır → **bağlayıcı anlaşma** (CLAUDE.md Absolute Rule #6).
> Numaralı kararlar (`K-2d-*`) pazarlık dışıdır. Aykırılıkta dur, madde no ile bildir.

---

## 0. Konumlandırma

Faz 4 / Dilim 2 (Nöbet & Vekâlet) dört alt-dilime ayrıldı (2a/2b/2c/2d). **2a, 2b, 2c tamam.** Bu
doküman **2d (Raporlama)**'yı tanımlar. Rapor **yeni veri üretmez** (K0.6): 2a roster'ını ve 2b
vekâletini okuyup özetler. Slice yalnız **sorgu** içerir; komut/yazma yoktur.

İhtiyaç analizi RAP-1…RAP-8 + NÖ-10 (sürüm-doğru toplam) bu dilimde karşılanır.

---

## 1. Bağlayıcı Kararlar (kod taraması + analizlerle uzlaştırıldı — 2026-06-20)

- **K-2d-1 — Salt-okunur read model; yeni domain/tablo/migration YOK.** Rapor `DutyRoster`/
  `DutyAssignment`/`DutyExemption` (2a) + `ScheduleException`(TeacherSubstitution, 2b) +
  `SchoolSettings.DutiesRelieverEnabled` okur. (K0.6, teknik analiz §1.1/§3.)

- **K-2d-2 — İki sorgu + erteleme.** `GetDutyLoadReportQuery` (yönetici tam rapor, `[Cacheable]`) ve
  `GetMyDutyLoadQuery` (öğretmen self). **Export (Excel/PDF) bu turda ERTELENDİ** (Debt) — kullanıcı
  kararı 2026-06-20. (Teknik analiz §4.1'deki `ExportDutyLoadReportQuery` sonraki tur.)

- **K-2d-3 — Yetki: precedent'e uyum, seed değişikliği YOK.**
  - Yönetici: `[RequirePermission("duties.view-load")]` (2a'da seed'li; SuperAdmin + SchoolAdmin).
  - Self: `[RequirePermission("duties.view")]` + `ICurrentUser` ile kendi `Person.Id` çözümü —
    mevcut `GetMyDuties` deseninin aynısı (Teacher rolü `duties.view`'a zaten sahip). Handler yalnız
    **kendi satırı + anonim okul ortalaması** döner (diğer öğretmen verisi sızmaz; sunucu-tarafı IDOR).
  - **Sapma (teknik analiz §5 matrisi):** docx self'i `view-load=kendi`, ayrıca `Accountant=oku`
    öngörüyordu. **Accountant rolü kod tabanında yok**; teacher-self codebase precedent'i (`duties.view`)
    ile çözüldü → seed/migration churn'ü ve paylaşılan-izin scope-ayrımı problemi ortadan kalktı.
    Bağlayıcı spec §K-2a-6 (Teacher view self-only) ile uyumlu. Accountant ileride eklenirse view-load
    grant'ı RolePermissionSeedData'ya eklenir.

- **K-2d-4 — Okuma yolu: EF + in-memory aggregation (Dapper DEĞİL).** Mevcut tüm duty handler'ları
  (`GetDutyHubSummary`, `ListDutyExemptions`) bu deseni kullanıyor; yeni `Dapper` bağımlılığı
  eklenmedi. (Teknik analiz §1.3'teki "Dapper ağır okuma" önerisinden bilinçli sapma — veri hacmi
  dönem × kadro; hacim büyürse sonraki fazda Dapper'a geçiş değerlendirilir.)

- **K-2d-5 — Sürüm-doğru toplama (NÖ-10) çekirdeği.** `nöbet`/`yancı`, **dönem ∩ her sürümün
  yürürlük penceresi** üzerinden, `haftalık × hafta` ile toplanır. Hem **canlı** (Published,
  EffectiveTo=null) **hem geçmiş** (Superseded, EffectiveTo set) sürümler sayılır; yalnız hiç
  yayınlanmamış Draft dışlanır. (Sezon-ortası değişiklikten sonra geçmiş yük doğru kalır.)
  - `weeks = ceil(pencere_gün_sayısı / 7)` (takvim haftası). **Tatil-duyarlı incelik Debt** —
    `IHolidayChecker` kod tabanında yok.

- **K-2d-6 — Vekâlet birimi (OQ-rap-002/003 geçici kararı).** `Toplam = nöbet günü + yancı +
  vekâlet ADEDİ`; saat ayrıca gösterilir. Her aktif `TeacherSubstitution` exception = 1 period =
  **1 saat**. `VekaletHours` = pencere içi exception period sayısı; `VekaletCount` =
  `(Date, OriginalTeacherId)` ile gruplanmış olay sayısı (aynı gün aynı öğretmen için bloklu
  vekâlet = 1 olay / N saat). Revoke'lu (`RevokedAt != null`) ve pencere-dışı kayıtlar sayılmaz.
  Hesap tek noktada (`Toplam`/`LoadTag`) — ağırlıklı yük istenirse DTO değişmeden değişir.

- **K-2d-7 — Muafiyet dışlama.** `Type==Permanent` VEYA pencereyle örtüşen `Temporary` muafiyeti
  olan öğretmen **Rows'tan dışlanır**, `Exemptions[]`'a girer (sonradan muafiyet eklenmiş, atamalı
  öğretmen dahil). (RAP-4, teknik analiz §4.4.)

- **K-2d-8 — Adalet metrikleri.** `Average` (Rows toplamlarından), `Max`/`Min`/`Spread=Max−Min`,
  `Balanced = Spread ≤ 2`. Satır etiketi `LoadTag`: `Toplam > round(avg)+1 → "hi"`,
  `< round(avg)−1 → "lo"`, aksi `"ok"`. (FE `dtrBuild` ile birebir.)

- **K-2d-9 — Yancılık parametresi.** `SchoolSettings.DutiesRelieverEnabled` kapalıysa yancı verisi
  **hiç üretilmez** (gizleme değil): `Yanci=0`, `TotalYanci=0`, yalnız-yancı öğretmen Rows'a girmez,
  `YancilikEnabled=false` döner. (Teknik analiz §4.4.)

---

## 2. Read Model (DTO'lar)

`Oksis.Application/Modules/Duties/DTOs/DutyDtos.cs` (mevcut `DutyLoadRowDto` stub'ı — kullanılmıyordu —
tam sürümle değiştirildi):

- `DutyLoadReportDto(TermId, From, To, YancilikEnabled, TotalNobet, TotalYanci, TotalVekalet, TotalVekHours, TotalToplam, Average, Max, Min, Spread, Balanced, Versions[], Rows[], Exemptions[])`
- `DutyLoadRowDto(TeacherId, FullName, BranchCode, Nobet, Yanci, VekaletCount, VekaletHours, Toplam, LoadTag, VekDetail[])`
- `SubstitutionItemDto(Date, ForTeacherId, ForTeacherName, Lesson, BranchCode, Hours)` — `Lesson` = sınıf adı (`ClassRoom.FullName`); `BranchCode` (ders branşı) **null** → subject zenginleştirmesi Debt.
- `RosterVersionRefDto(Version, From, To, RangeLabel)` — `RangeLabel` kültür-nötr ISO aralık; UI biçimlemesi FE'de From/To'dan.
- `DutyLoadExemptionDto(TeacherId, FullName, Reason, Type, RangeLabel)`
- `MyDutyLoadDto(Me, SchoolAverage, Diff, Over, YancilikEnabled, From, To, Versions[])` — `Over = Diff > 1`.

---

## 3. Slice / Dosya yerleşimi (BE)

```
Oksis.Application/Modules/Duties/Queries/
  GetDutyLoadReport/  DutyLoadAggregator.cs        // sürüm-doğru çekirdek (her iki sorgu paylaşır)
                      GetDutyLoadReportQuery.cs     // [Cacheable] [duties.view-load]
                      GetDutyLoadReportQueryHandler.cs
  GetMyDutyLoad/      GetMyDutyLoadQuery.cs         // [duties.view] + ICurrentUser self
                      GetMyDutyLoadQueryHandler.cs
Oksis.Api/Controllers/V1/DutiesController.cs        // GET /load-report , GET /load-report/me
```

- `GetMyDutyLoad` handler tam raporu (ortalama tüm kadrodan) hesaplar, sonra YALNIZ `Me` + ortalamayı döner.
- `FullName` çözümü: `Person.Name` materialize → in-memory `.FullName` (EF `Select` içinde projeksiyon YASAK — 2a runtime crash dersi). Branş `Profiles.OfType<TeacherProfile>().Branch`.
- `[Cacheable(ttlSeconds:120, Key="duties:load-report:{TermId}:{From}:{To}")]`.

## 4. API

| Uç | İzin | İşlev |
|---|---|---|
| `GET /api/v1/duties/load-report?termId=&from=&to=` | `duties.view-load` | Yönetici tam yük raporu (NÖ-10) |
| `GET /api/v1/duties/load-report/me?termId=&from=&to=` | `duties.view` (self) | Öğretmen kendi yükü + anonim ortalama |

`from`/`to` opsiyonel → dönem (`AcademicTerm.StartDate/EndDate`) varsayılan. Term yoksa 404. Tenant `SchoolId` otomatik.

## 5. Test (TDD — yeşil)

`tests/Oksis.Infrastructure.IntegrationTests/Duties/` (DB-okuyan handler precedent'i):
- `DutyLoadReportTests` (6): tek sürüm + adalet/etiket; çok sürüm (NÖ-10 pencere); yancılık kapalı/açık; muafiyet dışlama; vekâlet adet-vs-saat (revoke/pencere-dışı hariç).
- `GetMyDutyLoadTests` (2): self yalnız kendi + anonim ortalama + over; yük yoksa sıfır satır.
- Regression: mevcut 62 Application + 45 Api duty testi yeşil.

## 6. Debt / sonraki turlar

- **Export (Excel/PDF)** — Excel için ClosedXML zaten onaylı; PDF için QuestPDF onay gerektirir.
- **FE yönetici: ✅ uygulandı** (2026-06-20) — `oksis-web/src/portals/admin/duties/report/` (`DutyLoadReportPage` + `DtrLoadTable`), rota `/admin/schedule/duty-load-report`, `.dtr-*` `duties.css`'e port, `duties.report.*` i18n, 7 FE testi.
- **Öğretmen self görünüm** (teacher portal, `GetMyDutyLoad` → `SelfLoadView`) — sonraki tur.
- **Mobil** self görünüm (`GetMyDutyLoad`).
- **Tatil-duyarlı hafta sayımı** (`IHolidayChecker`).
- **VekDetail subject/branş zenginleştirmesi** (`SubstitutionItemDto.BranchCode`).
- **Accountant rolü** view-load (rol eklenirse).
- **Cache invalidation:** kısa TTL (120s) ile sınırlı; publish/substitution/exemption/setting değişiminde `duties:load-report:*` invalidate'i ileride eklenebilir.

## 7. Referanslar
- Bağlayıcı spec: `.claude/specs/ders-programi-modulu-spec.md` (K0.6)
- 2a/2b: `.claude/specs/ders-programi-faz4-dilim2a-…`, `…dilim2b-…`
- Handoff: `oksis-web/design-handoff/nobet-yuk-raporu/`
- Kaynak: `Nobet-Yuk-Raporu-{Ihtiyac-Analizi,Teknik-Analiz}.docx`
