# Ders Programı — Vekâlet İş Akışı (Faz 4 / Dilim 2b) Tasarımı

**Durum:** Tasarım kararları onaylandı (kod taraması + brainstorming, kullanıcı onayı 2026-06-19)
**Tarih:** 2026-06-19
**İlgili bağlayıcı spec:** `.claude/specs/ders-programi-modulu-spec.md` (Faz §1, K0.6 tek doğruluk kaynağı)
**Önceki dilim:** `.claude/specs/ders-programi-faz4-dilim2a-nobet-cizelge-design.md` (2a — Nöbet Çizelgesi, TAMAM)
**Modül:** `timetable` + `Duties` (`.claude/docs/modules/timetable/`)
**Kapsam:** Faz 4 / Dilim 2b — Vekâlet (gelmeyen öğretmenin dersine vekil görevlendirme iş akışı)
**Kaynaklar:** `Nobet-Vekalet-Ihtiyac-Analizi.docx` (§4 Vekalet), `Nobet-Vekalet-Teknik-Analiz.docx` (§3.2/§4/§7.2)
**Tasarım handoff'u:** `.claude/design-handoffs/schedule_duty/duty_admin_more.jsx` (`DtaVekalet`/`DtmLesson`/`DtmCandidate`) + `schedule_duty.jsx` (öğretmen görünümü, salt-okunur kısım)

> Bu dosya `.claude/specs/` altındadır → **bağlayıcı anlaşma** (CLAUDE.md Absolute Rule #6).
> Numaralı kararlar (`K-2b-*`) pazarlık dışıdır. Aykırılıkta dur, madde no ile bildir.

---

## 0. Konumlandırma

Dilim 2 (Nöbet & Vekâlet) dört alt-dilime ayrıldı (2a/2b/2c/2d — bkz. 2a tasarımı §0). **2a (Nöbet Çizelgesi) tamam.** Bu doküman **2b (Vekâlet)**'i tanımlar. 2a admin ekranındaki **Vekâlet (Bugün) sekmesi şu an placeholder** (`VekaletPlaceholder`, "Dilim 2b"); 2b bunu gerçek iş akışıyla değiştirir.

**Çekirdek kavram (İhtiyaç §4):** Vekâlet planlı değil **tepkiseldir** — bir öğretmen gelmediğinde o saatteki dersin boş kalmaması için, o an boşta olan başka bir öğretmen anlık görevlendirilir. Karar genelde nöbetçi müdür yardımcısınındır ve dakikalar içinde uygulanır.

---

## 1. Amaç & Mevcut Zemin

Vekâletin teknik çekirdeği **Faz 2.5'te zaten kuruldu** (kod taraması 2026-06-19 ile teyitli): `ScheduleException` + `TeacherSubstitution` tipi, `CreateScheduleExceptionCommand` (`timetable.override`), revoke, ve otomatik bildirim (vekil + asıl öğretmen + sınıf/veli). Bugün vekâlet yalnızca **editör içinden** (ScheduleEditorPage / PublishDrawer) yapılabiliyor; **ayrı bir vekâlet ekranı yok**.

2b'nin kattığı: **gelmeyen öğretmen → etkilenen dersler → adil & branş-uyumlu vekil önerisi → tek-tık atama → etüt/geri-al → öğretmen görünümü** — hepsi tek, amaca özel ekranda; mevcut `ScheduleException` mekanizması üzerine.

**Mevcut durum özeti (kod taraması):**
- ✅ Reuse: `ScheduleException.Create(... TeacherSubstitution ...)` + `Revoke` + `ScheduleExceptionCreatedEvent` bildirimi (vekil+asıl+sınıf).
- ⚠️ Genişlet: `GetAvailableTeachers` (P28) yalnız yapısal boşta-set; branş/yük sıralaması ve vekil-vekil aynı-slot eleme yok.
- ❌ Sıfırdan: gelmeyen-öğretmen girişi (ad-hoc), vekâlet ekranı (admin + öğretmen), branş-uyumu + adalet sıralama mantığı.

---

## 2. Bağlayıcı Kararlar (kullanıcı onaylı — 2026-06-19)

- **K-2b-1 — Devamsızlık ad-hoc (yeni entity YOK).** Sistemde öğretmen devamsızlık/izin kaynağı yok. Admin vekâlet ekranında **öğretmen + tarih + sebep** seçer; ekran o öğretmenin o günkü derslerini **yayınlanmış programdan** türetir. Devamsızlığın kendisi kalıcı saklanmaz — yalnızca atama sonucu oluşan `ScheduleException` kayıtları kalıcıdır. (TeacherAbsence entity'si bilinçli olarak kapsam dışı; ileride izin modülü gelirse zemin olur.)

- **K-2b-2 — Vekalet için yeni aggregate YOK; `ScheduleException` tüketilir.** (OQ-duty-002 kararı.) `CreateSubstitutionCommand` mevcut `ScheduleException` (TeacherSubstitution) kaydını **domain'de doğrudan** üretir.

- **K-2b-3 — İzin: `duties.substitute`.** `CreateSubstitutionCommand` ve etüt/geri-al `duties.substitute` ister; handler `ScheduleException`'ı domain'de doğrudan oluşturur (ayrı `timetable.override` kapılı komutu yeniden çağırmaz). Teknik analiz §4 "duties.substitute = timetable.override ile aynı otorite" ile uyumlu; SchoolAdmin zaten ikisine de sahip. `GetAvailableSubstitutes` / vekâlet okuma sorguları `duties.substitute` (yazma otoritesi gerektiği için — vekâlet ekranı yalnız atama yetkisi olana açık). (Kullanıcı kararı 2026-06-19.)

- **K-2b-4 — Branş-uyumu 3 kademe, `Subject.Category`'den türetilir (yeni seed YOK).** "Aynı / Yan / Farklı branş":
  - **Aynı:** aday öğretmen, gelmeyen öğretmenin dersinin **aynı Subject'ini** öğretir (TeachingAssignment) **veya** normalize edilmiş `Branch` string'i eşleşir (`BranchMatching.Normalize` reuse).
  - **Yan:** adayın öğrettiği derslerin `SubjectCategory` kümesi, gelmeyen dersin `Subject.Category`'sini içerir (aynı kategori, farklı ders).
  - **Farklı:** kategori örtüşmesi yok.
  Mevcut veriyi kullanır (`TeachingAssignment` + `Subject.Category` + `BranchMatching`); branş-ilişki tablosu/config eklenmez. (Kullanıcı kararı 2026-06-19.)

- **K-2b-5 — Adil öneri sıralaması.** Vekil adayları: o saatte **boşta** (P28 yapısal) + **vekil-vekil eleme** (K-2b-6) → kalanlar **branş-uyumu (Aynı>Yan>Farklı)** sonra **bu haftaki vekâlet yükü (az→çok)** sonra ad'a göre sıralanır. "En iyi" aday "Önerilen" rozetiyle işaretlenir (handoff).

- **K-2b-6 — Vekil-vekil aynı-slot debt'i 2b'de KAPANIR.** `GetAvailableSubstitutes`, aynı **tarih + slot**ta zaten bir `ScheduleException` (TeacherSubstitution) ile vekil atanmış öğretmeni de aday listesinden eler (P28'in bilinen yapısal-only debt'i). Katı kural: aynı öğretmen aynı slotta hem dersli hem vekil olamaz.

- **K-2b-7 — Öğretmen itirazı ERTELENİR (`schedule_requests` dilimi).** 2b'de öğretmen vekâleti yalnız **görür** (today-overlay zaten yansıtıyor) ve gerekiyorsa **onaylar** (hafif kabul); **itiraz/red akışı** ayrı `schedule_requests` dilimine bırakılır. Handoff'taki `DtaObjectModal` 2b'de port edilmez. (Kullanıcı kararı 2026-06-19.)

- **K-2b-8 — Etüt/serbest = atamasız işaret.** Vekil bulunamadığında veya idare tercihinde ders "etüt/serbest" geçer. Bu, `ScheduleExceptionType.Cancellation` (vekilsiz) ile modellenir (kod taraması: Cancellation NewTeacherId/NewRoomId'i null'lar). "Etüt" UI etiketi; altta Cancellation exception. Geri-al = revoke.

---

## 3. Domain & Application

Yeni domain aggregate **yok** (K-2b-2). Tüm iş Application slice'larında + mevcut `ScheduleException` üzerinde.

### 3.1 Yeni sorgular (Queries)
- **`GetTodaysSubstitutionBoardQuery(Guid TermId, DateOnly Date)`** (`duties.substitute`) → ekranın ana veri modeli: idarenin "bugün gelmeyenler" için seçtiği öğretmen(ler) ve onların o günkü dersleri + her ders için mevcut exception durumu (open / covered / etüt). Ad-hoc olduğundan: girdi olarak **absent teacher id(ler)i + tarih** alır (admin seçer); o öğretmen(ler)in o güne düşen yayınlanmış `LessonPlacement`'larını döndürür, her birine varsa aktif `ScheduleException`'ı eşler. (Alternatif: tek-öğretmen `GetTeacherLessonsForDate(teacherId, date)` + ayrı exception listesi — plan netleştirir; sonuç DTO ekranı besler.)
- **`GetAvailableSubstitutesQuery(Guid ProgramId, DateOnly Date, int Day, int Period, Guid AbsentTeacherId)`** (`duties.substitute`) → sıralı vekil önerisi. P28 yapısal boşta-set + K-2b-6 vekil-vekil eleme + K-2b-4 branş-uyumu (Aynı/Yan/Farklı) + K-2b-5 adalet yükü. DTO: `SubstituteCandidateDto(Guid Id, string Name, string? Branch, BranchFit Fit, int CurrentWeekSubstitutionLoad)` — `BranchFit` enum {Same, Near, Different}.
  - Vekâlet yükü: `ScheduleExceptions` (Type==TeacherSubstitution, NewTeacherId==aday, hafta aralığı, RevokedAt==null) sayımı (kod taraması: feasible).

### 3.2 Yeni komutlar (Commands)
- **`CreateSubstitutionCommand(Guid ProgramId, Guid TargetPlacementId, DateOnly Date, Guid SubstituteTeacherId, string Reason)`** (`duties.substitute`) → domain'de `ScheduleException.Create(... TeacherSubstitution, NewTeacherId=SubstituteTeacherId ...)`; SaveChanges → `ScheduleExceptionCreatedEvent` (bildirim hazır). Ön-kontrol: aday gerçekten o slotta boşta + (yumuşak) branş/yük bilgisi. Katı: aday o slotta dersli/vekil olamaz (DB + domain). Reason zorunlu (absent reason buraya akar).
- **`MarkLessonStudyHallCommand(Guid ProgramId, Guid TargetPlacementId, DateOnly Date, string Reason)`** (`duties.substitute`) → `ScheduleException.Create(... Cancellation ...)` (vekilsiz, "etüt/serbest"). (K-2b-8.)
- **`RevokeSubstitutionCommand`** → mevcut revoke yolu (`ScheduleException.Revoke`) `duties.substitute` ile sarmalanır (geri-al).

### 3.3 Reuse (değişmez)
`ScheduleException` entity (Create/Revoke + invariant'lar), `ScheduleExceptionCreatedEvent` + notification handler (vekil + asıl öğretmen + sınıf/veli), today-overlay (`GetTeacherTodayScheduleQuery` — vekil "devredildi"/"gelen vekâlet" görür). `BranchMatching` helper, `Subject.Category`, `TeachingAssignment`.

---

## 4. İş Kuralları (Edge Case)

| Kural | Davranış |
|---|---|
| Aday o slotta dersli | Aday listesinde yok (P28). Katı. |
| Aday o slotta zaten vekil (vekil-vekil) | Aday listesinden elenir (K-2b-6). Katı; DB unique backstop yoksa domain/sorgu eler. |
| Aday o güne nöbetçi/yancı | (Bilgi) — vekâlet ders saatine, nöbet pencereye; çakışma yok. Eleme gerekmez (nöbet ≠ ders slotu). |
| Branş uyumsuz aday seçimi | Engellenmez — idare "Farklı branş" rozetli adayı bilinçli seçebilir (yumuşak). |
| Vekil bulunamadı | Hata değil; ders "etüt/serbest" işaretlenebilir (K-2b-8). |
| Geçmiş tarihe vekâlet | `ScheduleException` tarih kuralı (Date.DayOfWeek == placement.Day) geçerli; geçmiş-tarih politikası mevcut Faz 2.5 davranışına bırakılır. |
| Geri-al (revoke) | `ScheduleException.Revoke` + bildirim; ders yeniden "açık". |
| Müsaitlik (Dilim 1) | Vekâlete **girdi değil** (2a K-2a-2 ile tutarlı — müsaitlik yalnız ders-programı üretimi). |

---

## 5. API

Rota tabanı: vekâlet okuma/yazma uçları `/api/v1/duties` altında (duty modülü yüzeyi), `ScheduleException` üretimi domain'de. Thin controller → `ISender.Send` + `ToHttpResult`.

| Uç | İzin | İşlev |
|---|---|---|
| `GET  /duties/substitution/board?termId=&date=&teacherId=` | `duties.substitute` | Seçili gelmeyen öğretmenin o günkü dersleri + exception durumları |
| `GET  /duties/substitution/candidates?programId=&date=&day=&period=&absentTeacherId=` | `duties.substitute` | Sıralı vekil önerisi (boşta + branş-fit + yük + vekil-vekil eleme) |
| `POST /duties/substitution` | `duties.substitute` | Vekil ata (CreateSubstitution → ScheduleException) |
| `POST /duties/substitution/study-hall` | `duties.substitute` | Dersi etüt/serbest işaretle (Cancellation) |
| `POST /duties/substitution/{exceptionId}/revoke` | `duties.substitute` | Geri-al (revoke) |

- DTO'lar: `SubstitutionBoardDto` (absent teacher + lessons[] + her lesson'ın status/vekil bilgisi), `SubstituteCandidateDto` (§3.1). FE-contract alan adları plan'da netleşir.
- FluentValidation; `ScheduleException` domain hataları → `Conflict(code)` (2a'daki DutyDomain/DomainException→422 deseniyle veya mevcut ScheduleException hata deseniyle tutarlı).
- TeacherName/branch çözümü: **`Person.Name.FullName` EF Select içinde projeksiyon YASAK** (2a'da runtime crash yaşandı) — `p.Name` materialize edilip in-memory `.FullName`. Branş `TeacherProfile.Branch` (string) + `Subject.Category` türetimi.

---

## 6. Web — Admin (Vekâlet Sekmesi)

Handoff: `duty_admin_more.jsx` → `DtaVekalet` + `DtmLesson` + `DtmCandidate`. 2a'daki `VekaletPlaceholder` gerçek bileşenle değiştirilir (DutyAdminPage Vekâlet sekmesi).

- **Gün şeridi (`dta-vk-daybar`):** "Bugün · {tarih}", N öğretmen gelmedi · M ders etkilendi, açık/kapatıldı/etüt sayaçları. Gelmeyen öğretmen **ad-hoc seçilir** (öğretmen picker + sebep) — seçilen her öğretmen bir `dta-abs-card`.
- **Gelmeyen öğretmen kartı (`dta-abs-card`):** avatar + ad + branş + sebep; altında o günkü dersleri (`DtmLesson`).
- **Ders satırı (`DtmLesson`):** saat/period + sınıf·ders + derslik + durum (Açık/Vekil atandı/Etüt). Açıksa **önerilen vekiller** (`DtmCandidate`: avatar + ad + branş-fit rozeti [Aynı/Yan/Farklı] + "bu hafta N vekâlet" yükü + "Önerilen" + **Ata**). "Diğer N aday" genişlet; "Etüt/serbest yap". Atanınca `dta-covered` (vekil + "Bildirildi" + **Geri al**). Etütte `dta-covered` etüt varyantı + geri-al.
- React Query: `['duties','substitution','board',termId,date,teacherId]`, `['duties','substitution','candidates',programId,date,day,period,absentTeacherId]`. Atama/etüt/geri-al sonrası board + candidates invalidate.
- **İzin:** sekme + aksiyonlar `duties.substitute` ile gate'lenir (yoksa sekme/aksiyon görünmez).
- **Kurallar:** ZERO hardcoded Türkçe (i18n `duties.substitution.*`), ZERO inline style, K-2a-2 (müsaitlik gösterilmez), faithful port.

---

## 7. Web — Öğretmen Görünümü (salt-okunur)

Handoff: `schedule_duty.jsx` (`TeacherDuty`) **vekâlet kısmı** — 2a'da nöbet/yancı portu yapıldı, vekâlet bölümü ertelenmişti. 2b ekler:
- Öğretmenin kendine atanan vekâletleri (today-overlay `GetTeacherTodayScheduleQuery`'den / `GetMyDuties` genişletme — plan netleştirir): "sıradaki görev" + liste/takvimde vekâlet item'ı.
- **K-2b-7:** yalnız görüntüleme (+ opsiyonel hafif "Onayla"); **itiraz YOK** (DtaObjectModal port edilmez).
- Çakışma uyarısı (handoff'taki "vekâlet dersinle çakışıyor") gösterilebilir ama aksiyon itiraz değil bilgilendirmedir.

---

## 8. Bildirim

Reuse: `ScheduleExceptionCreatedEvent` → vekil öğretmen + asıl öğretmen + sınıf (öğrenci/veli `CanViewInfo`) otomatik bildirilir (kod taraması teyitli). 2b ek bildirim altyapısı gerektirmez. Revoke → `ScheduleExceptionRevokedEvent` (mevcut).

---

## 9. i18n
`duties.substitution.*` (tr/en parity): gün şeridi, kart, ders satırı, durum pill'leri, aday rozetleri (Aynı/Yan/Farklı branş), "Önerilen", Ata/Etüt/Geri-al, boş/yükleniyor/hata. Öğretmen görünümü vekâlet metinleri. ZERO hardcoded Türkçe.

---

## 10. Test (TDD)

- **GetAvailableSubstitutes:** boşta-set doğru; **vekil-vekil aynı-slot elenir** (K-2b-6 — yeni test); branş-fit Aynı/Yan/Farklı doğru türetilir (`Subject.Category`/`TeachingAssignment` senaryoları); yük sıralaması; müsaitliğe bakmaz (K-2a-2); `FullName` in-memory.
- **CreateSubstitution:** ScheduleException (TeacherSubstitution) üretir; aday o slotta dersli/vekilse reddeder; reason zorunlu; event tetiklenir.
- **MarkStudyHall / Revoke:** Cancellation üretir / revoke + yeniden-açık.
- **Board query:** ad-hoc seçilen öğretmenin o günkü dersleri + exception eşlemesi.
- **FE:** aday listesi render + rozetler; ata/etüt/geri-al akışı + invalidation; izin gate; öğretmen görünümü salt-okunur (itiraz yok).

---

## 11. Debt / Kapsam Dışı

- **Öğretmen devamsızlık/izin modülü** (TeacherAbsence) — kapsam dışı (K-2b-1 ad-hoc).
- **Öğretmen itiraz/red akışı** → `schedule_requests` dilimi (K-2b-7).
- **Yan-branş ilişki tablosu** — gerekmez (Subject.Category türetimi, K-2b-4); kategori-bazlı yakınlık kabaca yeterli, ince ayar gerekirse sonraki dilim.
- **Otomatik vekil ataması** — kapsam dışı (idare seçer; otomasyon ayrı iş).
- **Dönem vekâlet yük raporu** → Dilim 2d (`GetDutyLoadReport`); 2b yalnız öneri-anı yükünü hesaplar.

---

## 12. Kabul Kriterleri (2b "bitti")

**API/BE:** `GetTodaysSubstitutionBoard` + `GetAvailableSubstitutes` (branş-fit + yük + vekil-vekil eleme) + `CreateSubstitution` + `MarkStudyHall` + `Revoke`; hepsi `duties.substitute` sunucu-yetki; ScheduleException reuse; bildirim çalışır; `FullName` in-memory; testler yeşil.

**Web Admin:** Vekâlet sekmesi placeholder yerine gerçek akış (gelmeyen öğretmen ad-hoc + öneri + ata/etüt/geri-al); handoff'a birebir; izin gate; durum varyantları; ZERO hardcoded Türkçe / inline style.

**Web Öğretmen:** salt-okunur vekâlet görünümü (itiraz yok).

**Docs:** `completion_status.md` (2b ✅, kararlar/debt), `api-contracts.md`, `business-rules.md`, `permissions.md` (duties.substitute artık egzersiz edilir), `ui-flows.md`.

---

## 13. Açık Sorular / Riskler

- **AS-2b-1:** Board sorgusunun girdi şekli (tek absent-teacher mı, çoklu mu; tarih tek gün). Plan netleştirir — handoff çoklu kart gösteriyor ama ad-hoc seçim tek tek eklenebilir.
- **AS-2b-2:** `GetAvailableSubstitutes`'in `ProgramId` mi yoksa `(branchId, term)` mi alacağı — P28 `ProgramId` alıyor; absent teacher'ın dersi hangi program/sınıf → o programın id'si kullanılır.
- **AS-2b-3:** Branş-fit "Aynı" tanımı: aynı Subject mı yoksa normalize Branch string eşleşmesi mi öncelikli — ikisi de "Aynı" sayılır; çakışırsa Subject önceliklidir. Plan örneklerle sabitler.
- **AS-2b-4:** Öğretmen görünümü vekâlet verisi `GetTeacherTodayScheduleQuery` (tek gün) mi yoksa `GetMyDuties` genişletmesi (hafta) mi — plan, 2a `GetMyDuties` ile tutarlılığı değerlendirir.

---

## 14. Referanslar
- 2a tasarımı: `.claude/specs/ders-programi-faz4-dilim2a-nobet-cizelge-design.md`
- Bağlayıcı spec: `.claude/specs/ders-programi-modulu-spec.md` (K0.6)
- Handoff: `.claude/design-handoffs/schedule_duty/{duty_admin_more,schedule_duty}.{jsx,css}`
- Reuse (Faz 2.5): `ScheduleException.cs`, `CreateScheduleExceptionCommand`, `ScheduleExceptionCreatedNotificationHandler`, `GetAvailableTeachers` (P28), `GetTeacherTodayScheduleQuery`
- Branş/ders: `TeacherProfile.Branch`, `Subject.Category`, `TeachingAssignment`, `BranchMatching`
