# Öğrenci Numarası (StudentNumber) Format & Kabul — Tasarım Dokümanı (Mini-Spec)

> **Tür:** Tasarım dokümanı / mini-spec. **Şemsiye spec amendması:**
> `.claude/specs/ogrenci-kayit-enrollment-spec.md` **E4.4.1**'i (format `{SezonYılı}{5-hane}`)
> **geçersiz kılar/süpersede eder.** 3A tasarımı (`ogrenci-kayit-faz3a-...`) ve
> `students/completion_status.md` (2026-06-30 kaydı) "öğrenci no format/kabul (E4.4/E2.3)
> ayrı spec'e ertelendi" demişti — **bu doküman o ayrı spec'tir.** (Rule #6: sapma onaylı,
> onay: kullanıcı 2026-07-01.)
>
> **Durum:** Onaylı (brainstorming, 2026-07-01). **Kapsam:** `students` (üretim) + `schools`
> (ayar) + `identity` (login resolver) modülleri.

---

## 1. Amaç

Öğrenci numarasını **sabit/varsayılan** bir formattan (`{yıl}{5-hane}`) **okul-yapılandırılabilir,
tutarlı ve import'a hazır** bir sisteme dönüştürmek. Bugün `SchoolSettings.StudentNumberPrefix` +
`StudentNumberLength` alanları **var ve settings UI'da düzenlenebilir**, ama `StudentNumberGenerator`
onları **görmezden geliyor** (sabit `{EnrollmentDate.Year}{5-hane}` üretiyor). Bu iş o boşluğu kapatır.

---

## 2. Mevcut durum (doğrulanmış — keşif 2026-07-01)

- **Üretim:** `StudentNumberGenerator.NextAsync(schoolId, year)` → `$"{year}{next:D5}"`; sayaç
  `student_number_counters (school_id, year, next_value)` üzerinde SQL `MERGE ... HOLDLOCK` (atomik).
  Yıl = `request.EnrollmentDate.Year` (takvim yılı). İlk kayıtta bir kez üretilir, değişmez.
- **Benzersizlik:** `(SchoolId, StudentNumber)` **UNIQUE** index (`StudentProfile`; `student_number nvarchar(50)`, **nullable**).
- **Numara FK DEĞİL:** Marks/Attendance/Enrollment öğrenciyi `StudentPersonId` (GUID) ile bağlar;
  `StudentNumber` yalnız görünen/login alanı → **geri-dönüşüm veri-güvenli olurdu** ama biz global benzersizlik seçtik (bkz. K5).
- **Ayarlar:** `SchoolSettings.StudentNumberPrefix : string?` (var), `StudentNumberLength : int` (non-null, **default 4**).
  Settings UI (`StructureTab`) + `UpdateAcademicStructureCommand` (validator: prefix ≤50, length 1-10; komut length'i **zaten `int?`** alır) düzenletiyor — ama generator tüketmiyor.
- **Login:** `Identifier.Create(input)` şekil-tabanlı sınıflandırır (okul-agnostik): TCKN=11 hane, telefon=10-13 hane, **öğrenci-no=1-9 hane salt-rakam**, e-posta. Öğrenci-no çözümü **`SchoolHint` zorunlu** (`IdentifierResolver`).
- **Elle giriş yok:** enroll sihirbazı %100 otomatik üretir.

---

## 3. Kilitlenen kararlar (brainstorming 2026-07-01)

- **K1 — Yıl yok:** Hiçbir numaraya yıl öneki konmaz. Sayaç yıla göre anahtarlanmaz.
- **K2 — Format:** `{prefix?}{sıra}`. `prefix` opsiyonel (yoksa yok). `length` = **minimum genişlik (sıfır-dolgu / başlangıç genişliği)**, tavan **değil**.
- **K3 — Default (ayar boş):** öneksiz, **min 3 hane, 100'den başlar** → `100, 101, …, 999`, sonra doğal olarak `1000, 1001…` diye büyür (tükenmez).
- **K4 — Sayaç:** okul-ömür-boyu tek monoton sıra; otomatik üretim **asla tekrar kullanmaz**. `StudentNumberLength` entity'de **nullable** (`int?`) yapılır; null = default 3.
- **K5 — Benzersizlik: A (global).** `(SchoolId, StudentNumber)` UNIQUE index **korunur**. Manuel/import doğrulaması global benzersizlik ister (okulda hiç kullanılmamış).
- **K6 — Doğrulama:** manuel/import numarası geçerli ⇔ *(format uyar: ayar-varsa-pattern, yoksa rakam ≥100 / min 3 hane)* **ve** *(global benzersiz)*. Yeniden kullanılabilir `IStudentNumberValidator` policy olarak yazılır.
- **K7 — Login: A (okul-farkında).** `SchoolHint` zaten zorunlu → çözümleme okul formatını dikkate alır (bkz. §6).

---

## 4. Backend tasarımı

### 4.1 `SchoolSettings` — length nullable
- `StudentNumberLength : int` → **`int?`** (nullable). `null` = default davranış (K3: min 3, başlangıç 100).
- EF config + migration: kolon nullable'a çevrilir. **Migration mevcut tüm satırları `NULL`'a çeker** →
  her okul yeni default'a (3/100) geçer. Zaten generator tüketmiyordu → **basılı/atanmış eski numaralar
  değişmez** (immutability korunur); yalnız bundan sonra üretilenler etkilenir.
- `Create`/factory ve `UpdateAcademicStructureCommandHandler`: null-akışı korunur (`request.X ?? settings.X`).
- Validator (`UpdateAcademicStructure`): length null VEYA 1-10; **prefixsiz (salt-rakam) durumda length ≤ 9**
  önerisi (login telefon-aralığı 10-13 ile çakışmasın — bkz. §6). Prefix varsa length serbest (prefix zaten ayırt eder).

### 4.2 `StudentNumberGenerator` — settings tüket + yıl kaldır
- İmza: `NextAsync(Guid schoolId, CancellationToken ct)` (year parametresi **kaldırılır**).
- Okulun `SchoolSettings`'inden `StudentNumberPrefix` + `StudentNumberLength` okunur (`length ?? 3`).
- Sayaç: `student_number_counters` **`(school_id, next_value)`** olarak yeniden kurulur (**`year` kolonu düşer**).
  MERGE: `NOT MATCHED → INSERT next_value = 100, return 100`; `MATCHED → next_value + 1, return`.
  Başlangıç **100** (K3).
- Çıktı: `$"{prefix}{seq}"` — `seq`, `length` haneye sıfır-dolgulu ama **≥100 başladığı için default'ta dolgu gereksiz**;
  `seq` `length`'ten uzunsa olduğu gibi (minimum semantiği). Ör. prefix=`ATL`, length=4 → `ATL0100`; default → `100`.
- **Migration/geçiş:** eski `student_number_counters` satırları atılır (eski numaralar `StudentProfile`'da kalıcı, immutable).
  Yeni sayaç okul başına 100'den başlar. Bir okulda **karışık format** olur (eski `2026xxxxx` + yeni `100…`) — kabul; renumber **kapsam dışı**.

### 4.3 `IStudentNumberValidator` (yeni) — manuel/import kabul
- `Task<Result> ValidateAsync(Guid schoolId, string candidate, CancellationToken ct)`.
- **Format kuralı:** okulun ayarı doluysa `{prefix}{rakam, ≥length hane}` pattern'ine uymalı; boşsa **salt-rakam, sayısal değer ≥100 (min 3 hane)**.
- **Benzersizlik (K5 global):** `db.Profiles.OfType<StudentProfile>()` içinde bu `StudentNumber` **hiç yok** (tenant-scope, `(SchoolId, StudentNumber)`).
- Application katmanında; hem `EnrollStudent` manuel-no yolu hem gelecekteki `students:import` (A5) tüketir.

### 4.4 `EnrollStudent` — opsiyonel manuel no
- Komuta opsiyonel `StudentNumber : string?` eklenir. **Boş → otomatik** (`generator.NextAsync(schoolId)`);
  **dolu → `IStudentNumberValidator` ile doğrula**, geçerliyse kullan (geçersizse `Result.Failure` / 400).
- İlk-kayıt kuralı korunur (Person'ın numarası zaten varsa yeniden üretmez/kabul etmez).

### 4.5 Login resolver — okul-farkında (§6)

---

## 5. Frontend tasarımı

- **`StructureTab` (settings):** prefix/length alanları zaten var. **Yardım/placeholder metni** güncellenir:
  "boş → varsayılan (100'den başlayan 3+ haneli numara)"; length yardımı "minimum genişlik". i18n `school-settings.*`.
- **Enroll sihirbazı:** opsiyonel **"Öğrenci No"** alanı (boş → otomatik; dolu → BE doğrular). Hata mesajı i18n.
  *(Handoff/mevcut sihirbaz deseniyle uyumlu; `.scr-*`/enroll.css.)*
- Hardcoded Türkçe yok; tenant-scoped React Query.

---

## 6. Login çözümleme algoritması (okul-farkında)

`IdentifierResolver` (SchoolHint mevcut — öğrenci-no için zaten zorunlu):

1. **SchoolHint varsa ve okulun `StudentNumberPrefix`'i doluysa:** girdi bu prefix ile **başlıyorsa** →
   `IdentifierType.StudentNumber`, `FindByStudentNumberAsync(input, school)` (tam stored değer, prefix dahil aranır).
   *(Prefix harf içerdiğinden telefon/TCKN ile asla çakışmaz — kesin ayrım.)*
2. **Aksi halde (prefixsiz/default):** mevcut şekil-tabanlı `Identifier.Create` korunur — salt-rakam **1-9 hane**
   → öğrenci-no; 10-13 → telefon; 11 → TCKN. Default numaralar (≥100, gerçekçi olarak ≤9 hane) bu kuralla sorunsuz çözülür.
3. `Identifier.Create` (telefon/TCKN/e-posta yolları) **değişmez** — yalnız prefix-öncelikli bir dal eklenir.

**Kısıt:** prefixsiz numaralarda length ≤ 9 tutulur (§4.1 validator) → telefon-aralığı (10-13) ile çakışma önlenir.
Prefix'li numaralarda uzunluk serbest (prefix ayırt eder).

---

## 7. Testler (TDD)

**BE:**
- `StudentNumberGenerator`: default → `100,101,…`; 999 sonrası `1000`; prefix+length → `ATL0100`; okul-başına izolasyon; atomik/eşzamanlı artış; **yıl yok**.
- `SchoolSettings` length nullable + migration (mevcut satırlar null); update handler null-akışı.
- `IStudentNumberValidator`: default format (rakam ≥100) kabul; <100/harf/yanlış-pattern red; ayar-pattern uyumu; global benzersizlik (var olan numara red); tenant-izolasyon.
- `EnrollStudent`: boş no → otomatik; dolu geçerli no → kullanılır; geçersiz/çakışan no → 400; ilk-kayıt immutability.
- `IdentifierResolver`: prefix'li girdi → öğrenci-no (okul-farkında); prefixsiz kısa rakam → öğrenci-no; 10-13 rakam → telefon; okul prefix'i eşleşmezse şekil-tespitine düşer.

**FE (vitest):** StructureTab yardım metni + validasyon; enroll opsiyonel no alanı (boş/dolu/hatalı); i18n.

**Chrome E2E (zorunlu):** default üretim (yeni öğrenci `100`); prefix ayarlanınca yeni öğrenci `ATL…`; opsiyonel manuel no; (varsa) prefix'li no ile öğrenci login. Stil `.scr-*` doğrulama.

---

## 8. Kapsam dışı

- **Toplu import ekranı/endpoint'i (`students:import`, A5):** bu iş yalnız **doğrulama servisini** verir; import UI ayrı faz.
- **Mevcut öğrencileri renumber etme:** eski numaralar korunur (immutability); karışık format kabul.
- **Login ekranı UX değişikliği** (açık tür seçici): seçilmedi (K7=A okul-farkında tek-alan).

---

## 9. Riskler

- **R1 — Karışık format:** bir okulda eski `2026xxxxx` + yeni `100…` birlikte. Kabul (immutability); dokümante edilir.
- **R2 — Prefix'li login:** resolver güncellenmezse prefix'li numarayla giriş kırılır → §6 zorunlu, testle kapatılır.
- **R3 — Length ≥10 prefixsiz:** telefonla çakışır → §4.1 validator kısıtı (prefixsiz ≤9) ile önlenir.
- **R4 — Settings default değişimi:** migration length'i null'a çekince mevcut okullar 4-hane yerine 3/100'e geçer — beklenen (onaylı); yalnız yeni üretimi etkiler.

---

## 10. Bitiş tanımı (DoD)

Generator settings'i tüketir + yıl yok + 100'den başlar; length nullable + migration; `IStudentNumberValidator` canlı; EnrollStudent opsiyonel manuel no; login okul-farkında (prefix); StructureTab + enroll FE; BE+FE testleri yeşil; Chrome E2E (default + prefix + manuel + login) doğrulanmış; şemsiye spec E4.4 amendment notu + `students/business-rules.md` yeni BR + completion_status güncel.
