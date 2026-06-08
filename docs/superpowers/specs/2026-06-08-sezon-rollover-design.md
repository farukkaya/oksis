# Sezon Rollover — Tasarım Dokümanı (Sezon Yönetimi, Faz 1)

> **Tarih:** 2026-06-08 · **Kapsam:** Sezon Yönetimi 6 adımlı sihirbazının backend orkestrasyonu
> **Hedef rol:** School_Admin · **Modül:** `AcademicSessions` (+ Students, Teachers, Schools)
> **Kaynaklar:** handoff `seasonwizard.jsx`, `oksis-admin-ekranlari-mimari-spec.md` (§1.2, §4.9, §5.9, §6),
> gap analizi `.claude/docs/modules/academic-years/season-management-gap-analysis.md`
> **Bağlayıcı:** Mimari spec §4.9 (`PromoteStudents`) ve §5.9 (`CopyAssignmentsToNewSeason`) bağlayıcıdır (CLAUDE.md Absolute Rule #6).

---

## 0. Amaç

Mevcut backend `AcademicSessions` modülü boş sezon yaratma + tekil sınıf/öğrenci/tatil
işlemlerinde olgun, ancak **"önceki sezondan kopyalayarak yeni sezon açma + toplu terfi"**
orkestrasyonu yok. Bu doküman o boşluğu kapatan tasarımı tanımlar.

---

## 1. Genel mimari — iki fazlı yaşam döngüsü

Sihirbaz boyunca **hiçbir ağır kayıt yazılmaz**; sunucuda yalnızca hafif bir `SeasonDraft`
tutulur. İki ayrı eylem vardır:

```
[Sihirbaz adımları] ──"Taslağı Kaydet"──► SeasonDraft (sunucu, tenant başına 1)
                                              │
                          ──"Sezonu Aç"───────┘
                                              ▼
                    OpenSeasonFromDraft (senkron, tek transaction)
                    → AcademicSession (Setup) + 2 Term + boş ClassRoom'lar
                      (terfi haritasına göre) + SchoolHoliday'ler
                    → SeasonDraft silinir.  Eski sezon DOKUNULMAZ.
                                              │
                          ──"Aktifleştir"─────┘  (yıl başında, ayrı eylem)
                                              ▼
                    ActivateSeasonRollover (orkestratör, senkron, tek transaction)
                    → Session Setup→Active, IsCurrent=true
                    → eski aktif sezon Archive (BR-AS-001)
                    → PromoteStudents (§4.9)            ← bağımsız slice, orkestratör çağırır
                    → CopyAssignmentsToNewSeason (§5.9) ← bağımsız slice
```

### Kilit kararlar (brainstorming çıktısı)

| Karar | Seçim | Gerekçe |
|---|---|---|
| Kopya zamanı (yapı) | **Sezonu Aç anında** | Yarım kalan sezon kirliliği yok; önizleme salt-okunur. |
| Kopya zamanı (öğrenci/görevlendirme) | **Aktifleştir anında** | Taslak↔aktivasyon arası öğrenci giriş/çıkışları gerçek cutover'da yansır. |
| Yürütme | **Senkron, tek transaction** | ~1248 satır SQL Server için yönetilebilir; atomik (ya hepsi ya hiç). |
| Terfi haritası | **Otomatik öneri + admin override** | Grade DisplayOrder'dan hesaplanır; admin hedef değiştirebilir. |
| `PromoteStudents` / `CopyAssignments` | **Bağımsız slice + orkestratör çağırır** | Spec §4.9/§5.9 slice tanımına sadık; idempotent, re-run edilebilir. |

### Provenance

Her yeni `ClassRoom`'a `SourceClassRoomId` (nullable Guid) eklenir. Override edilmiş haritada
bile kaynak→hedef bağını taşır; aktivasyondaki terfi bunu izler, kayıt geçmişine değer katar.
"Yeni şube" satırları `SourceClassRoomId = null`.

---

## 2. `SeasonDraft` (yeni varlık)

Sihirbazın sunucu tarafı taslağı. **Tenant başına en fazla 1** kayıt ("sıradaki planlama sezonu").
Akademik Takvim ekranındaki `Planlanmamış ↔ Taslak` rozeti bu kaydın varlığına bakar.

```
SeasonDraft : TenantEntity
  Name                    string          // "2026–2027"
  SourceSessionId         Guid            // kaynak (aktif) sezon
  CurrentStep             int             // sihirbazın kaldığı adım (0..5)
  CopyTerms               bool
  CopyBranches            bool
  CopyHolidays            bool
  CopyAssignments         bool
  CopySchedule            bool
  ExcludePassiveStudents  bool
  TermDatesJson           string?         // override edilmiş dönem tarihleri (Adım 2)
  BranchMapJson           string?         // override edilmiş terfi haritası (Adım 3)
  HolidaysJson            string?         // seçilmiş/eklenmiş okul tatilleri (Adım 4)
  (Created/Updated audit alanları)
```

- **Komutlar:** `SaveSeasonDraft` (upsert), `GetSeasonDraft` (sihirbaz açılışta okur), `DeleteSeasonDraft` (vazgeç / Sezonu Aç sonrası temizlik).
- Override edilen harita/tarihler **JSON** olarak saklanır (esnek, şema migration'sız). Taslak gevşek tutulur (yarım veri normal); validasyon "Sezonu Aç"ta yapılır.

---

## 3. "Sezonu Aç": `OpenSeasonFromDraft` komutu

Senkron, tek transaction. Taslaktaki bayrak/override'lara göre **yapıyı** materyalize eder:

1. **Sezon + dönemler** — `AcademicSession.Create(...)` (mevcut factory). `CopyTerms` açıksa
   taslaktaki +1 yıl kaydırılmış tarihler; değilse formdaki tarihler. Sonuç: **Setup** statüsü.
2. **Şubeler** (`CopyBranches` açıksa) — nihai terfi haritasındaki her **hedef** şube için boş
   `ClassRoom.Create(...)`; `SourceClassRoomId` köken bağı set edilir. "Mezun" satırları hedef
   üretmez. "Yeni şube" satırları kaynaksız.
3. **Tatiller** (`CopyHolidays` açıksa) — taslaktaki okul tatilleri + resmi tatiller yeni sezona
   `SchoolHoliday` olarak yazılır.
4. `SeasonDraft` silinir.

**Validasyon burada:** ad tekilliği, tarih invariant'ları (BR-AS-004), harita hedef tekilliği
(aynı grade+section iki kez olamaz), grade'lerin okulca sunulması (`SchoolGradeLevel`).

> `CopyAssignments`/`CopySchedule` bayrakları bu komutta **yazma yapmaz**; taslakta saklanıp
> aktivasyonda kullanılır (görevlendirme öğretmen-bağımlı).

---

## 4. Terfi haritası önizleme: `GetSeasonRolloverPreview`

Salt-okunur query, hiçbir şey yazmaz. Sihirbaz Adım 3'ü besler:

- Kaynak sezonun aktif şubelerini al → her biri için grade `DisplayOrder + 1` çözümle:
  - Üst kademe okulca sunuluyorsa → **Terfi** (hedef: aynı section, üst grade).
  - Üst kademe yok (terminal) → **Mezuniyet** (hedef yok).
  - Okulun **en alt** kademesi kaynaksız → **Yeni Şube** (kaynağın alt-kademe section'ları boş klon).
- Satır: `{ sourceClassRoomId, fromLabel, studentCount, toGradeLevelId, toSection, kind }`.
- Özet: `{ promotedBranches, graduatingStudents, newBottomBranches }`.

Admin haritayı düzenleyip `SaveSeasonDraft` ile `BranchMapJson`'a yazar.

---

## 5. "Aktifleştir": `ActivateSeasonRollover` orkestratörü

Senkron, tek transaction. Mevcut `ActivateAcademicSession`'ı **sarmalar** (eski komut bozulmaz):

```
ActivateSeasonRollover(targetSessionId)
  1. Hedef sezon Setup mı? değilse hata.
  2. session.Activate(now, previousSessionId)        // mevcut domain: Setup→Active, IsCurrent
  3. eski aktif sezon.Archive(now)                    // BR-AS-001 (mevcut)
  4. PromoteStudents(targetSessionId, excludePassive)            // §4.9
  5. CopyAssignmentsToNewSeason(sourceSessionId, targetSessionId) // §5.9
  → tek SaveChanges, atomik. Hata = tüm rollback.
```

### `PromoteStudents` (§4.9) — bağımsız slice, idempotent

- Kaynak sezonun aktif `ClassRoomStudent` kayıtlarını gez. Her hedef `ClassRoom`'u
  `SourceClassRoomId` ile bul.
- Hedefi olan (Terfi) → yeni sezonda `AssignStudent(Reason.Initial)`; kaynak kayıt aktivasyonla
  (eski sezon arşiv) doğal kapanır.
- Hedefi olmayan (Mezuniyet/terminal) → `GraduateStudent` (`PersonGraduatedEvent`).
- `excludePassive` → pasif öğrenciyi atla. Idempotent: hedefte zaten kaydı olan öğrenciyi tekrar açmaz.

### `CopyAssignmentsToNewSeason` (§5.9) — bağımsız slice

- Kaynak sezonun `TeachingAssignment`'larını yeni sezona klonla (öğretmen + ders + hedef şube,
  haftalık saat). Hedef şube `SourceClassRoomId` ile eşlenir. Mezun olan şubenin görevlendirmesi
  taşınmaz. `TeachingAssignmentChangedEvent` yayınlanır (Ders Programı senkronu).

---

## 6. Tatiller: resmi tatil kaynağı

- **Okul tatili kopyalama:** taslaktaki tatiller "Sezonu Aç"ta `SchoolHoliday` olarak yazılır (§3).
- **Resmi tatil ("Otomatik eklendi"):** master **`NationalHoliday` seed** (sabit tarihli ulusal
  tatiller — 29 Ekim, 23 Nisan, 19 Mayıs, 1 Mayıs) → sezon yılına göre otomatik
  `SchoolHoliday(PublicHoliday)` üretilir.
- **Bilinen sınır:** Dini bayramlar (Ramazan/Kurban) hicri takvim — sabit tarihten hesaplanamaz.
  MVP'de **yıl bazında manuel** (veya ileride yıllık seed). Spec dışı sınır olarak belgelenir.

---

## 7. API yüzeyi

| Method | Route | Permission | Açıklama |
|---|---|---|---|
| GET | `/api/v1/season-drafts/current` | `academic-sessions.manage` | Sihirbaz taslağını oku |
| PUT | `/api/v1/season-drafts/current` | `academic-sessions.manage` | Taslağı upsert |
| DELETE | `/api/v1/season-drafts/current` | `academic-sessions.manage` | Taslağı sil |
| GET | `/api/v1/academic-sessions/{sourceId}/rollover-preview` | `academic-sessions.manage` | Terfi haritası önizleme |
| POST | `/api/v1/academic-sessions/open-from-draft` | `academic-sessions.create` | Sezonu Aç → Setup sezon (yapı) |
| POST | `/api/v1/academic-sessions/{id}/activate-rollover` | `academic-sessions.activate` | Aktifleştir → terfi + görevlendirme |
| POST | `/api/v1/academic-sessions/{id}/promote-students` | `students.promote` (yeni) | §4.9 bağımsız (re-run) |
| POST | `/api/v1/academic-sessions/{id}/copy-assignments` | `teachers.assign` | §5.9 bağımsız (re-run) |

---

## 8. Kapsam dışı (Faz 2)

Akademik Takvim'in 6 türlü **etkinlik** varlığı (`term/exam/holiday/meeting/activity/admin`) +
`GET /seasons/{id}/events` + Etkinlik Ekle modalı. Sezon Yönetimi sihirbazı bunlara bağımlı
değildir; ayrı faz.

---

## 9. Issue ön-bölümlemesi

1. `SeasonDraft` varlık + 3 komut (`Save`/`Get`/`Delete`) + EF config + migration
2. `GetSeasonRolloverPreview` query (grade-order çözümleme)
3. `ClassRoom.SourceClassRoomId` provenance + migration
4. `OpenSeasonFromDraft` komutu (yapı materyalizasyonu)
5. `PromoteStudents` slice (§4.9)
6. `CopyAssignmentsToNewSeason` slice (§5.9)
7. `ActivateSeasonRollover` orkestratörü (4→6'yı çağırır)
8. `NationalHoliday` master seed + resmi tatil üretimi
9. Frontend: 6 adımlı stepper sihirbaz (oksis-web)

**Sıra bağımlılığı:** 1–3 temel → 4 → 5,6 (paralel) → 7 → 8 → 9.

---

## 10. Mimari uyum kontrol listesi

- [ ] Tüm handler `async` + `CancellationToken`
- [ ] FluentValidation ile giriş doğrulama (özellikle `OpenSeasonFromDraft`)
- [ ] Mapster ile DTO map (AutoMapper YOK)
- [ ] Tüm sorgular tenant-filtreli; rollover komutları atomik tek transaction
- [ ] Hard-delete yok → terfi/mezuniyet yeni kayıt üretir, eskiyi kapatır (§1.3)
- [ ] `PromoteStudents` / `CopyAssignments` idempotent (re-run güvenli)
- [ ] Durum değişiklikleri yapılandırılmış audit logu üretir
- [ ] Modüller arası: domain event (PersonGraduated, TeachingAssignmentChanged) — doğrudan çağrı yok
</content>
