# Öğrenci Kayıt — Faz 1B-BE (Öğrenci Hesabı + Geçici Şifre) Tasarım Dokümanı

> **Tür:** Faz tasarım dokümanı (şemsiye spec'e bağlı). Bağlayıcı kararlar
> `.claude/specs/ogrenci-kayit-enrollment-spec.md` (E2.6/E2.7/E5.1/E5.2/E5.3) ve üst
> mimari spec madde 121-122'dir; bu doküman onların **uygulama tasarımıdır**, üzerine
> yeni bağlayıcı karar koymaz.
>
> **Durum:** Onaylı (brainstorming, 2026-06-30) · **Kapsam:** `students` + `identity`
> modülleri — öğrenci hesabı provisioning, geçici şifre, öğrenci-no login resolver,
> küçük kademe veli-only carve-out + FE başarı ekranı (Debt kutusunu doldurma).
>
> **Yaklaşım:** B — ayrı `IStudentAccountProvisioner` servisi, EnrollStudent
> transaction'ı içinde çağrılır (kullanıcı onayı 2026-06-30).

---

## 1. Amaç ve sınır

Faz 1B-FE'de başarı ekranındaki **geçici şifre kutusu Debt** olarak bırakılmıştı (E2.6/E2.7
gereği öğrenci hesabı ertelenmişti). Bu faz o borcu kapatır:

- **E2.7:** Öğrenci istisnası — kullanıcı adı = öğrenci no, geçici şifre üretilir, ilk
  girişte zorunlu değişim (üst spec madde 121-122 ile birebir).
- **E2.6:** Küçük kademede yalnız veli hesabı açılır; öğrenci hesabı opsiyoneldir →
  **otomatik, kademeye göre** carve-out (kullanıcı kararı 2026-06-30).

**Sınır:** Bu faz **mevcut olgun altyapıyı yeniden kullanır** (E1.2). Login zaten
`Account`'ı doğruluyor (`AccountLoginCommandHandler` + `IdentifierResolver`); ADR-001'in
açık noktası bu keşifle cevaplandı — auth Person/Account hattında, legacy `User`'a
bağlı değil. Bu faz **tamamen additive**: mevcut Email/Phone login hattına dokunmaz,
yeni tablo/migration gerektirmez.

### 1.1 Kapsam DIŞI (ayrı iş — takip)

Brainstorming sırasında ortaya çıkan **öğrenci numarası format/kabul** ihtiyacı bu fazın
DIŞINDADIR, ayrı spec'lenecektir (kullanıcı kararı 2026-06-30):

- **(a)** Okulun **mevcut numarasını kabul** (migrasyonla gelen öğrenciler) →
  `EnrollStudentCommand` numara alanı + **Faz 4 Import**.
- **(b)** **Okul-konfigüre generator format'ı** (Türk okulları tipik 3-5 hane salt sayısal)
  → mevcut `StudentNumberGenerator` + **spec E4.4.1/E2.3 revizyonu**.

> ⚠️ **Spec gerilimi (Absolute Rule #6 — kayıt altına alındı):** Yukarıdaki (a)+(b),
> bağlayıcı **E4.4.1** (`{SezonYılı}{5-hane}` sabit format) ve **E2.3** (numara yalnız
> üretilir, dışarıdan alınmaz) ile çelişir. Bu faz E4.4/E2.3'ü **değiştirmez**; gerilim
> ayrı iş paketine ertelendi. Mevcut generator davranışı korunur (`{EnrollmentDate.Year}{next:D5}`
> = 9 hane). Bu fazın login resolver'ı **format-agnostik** tasarlanır (§4) → format işi
> sonra hangi yöne giderse gitsin resolver bozulmaz.

---

## 2. Bileşenler ve sorumluluklar

### 2.1 BE — yeni

| Bileşen | Katman | Sorumluluk |
|---|---|---|
| `ITemporaryPasswordGenerator` (+impl) | App abstraction / Infra Identity | Okunabilir geçici şifre üretir (kripto-RNG). |
| `IStudentAccountProvisioner` (+impl) | App abstraction / App Students | Kademe kontrolü + Account.Create + Person.LinkAccount; düz şifreyi döner. |

### 2.2 BE — değişen

| Bileşen | Değişiklik |
|---|---|
| `EnrollStudentCommandHandler` | Adım 7.5: provisioner çağrısı (Person eklendikten sonra, SaveChanges öncesi). Replay yolunda hesap-varlık kontrolü. |
| `EnrollStudentResult` | `string? TemporaryPassword` + `bool StudentAccountCreated` alanları. |
| `IdentifierType` (enum) | `StudentNumber = 4` eklenir. |
| `Identifier.Create` | Salt-rakam, uzunluk 1-9 → `StudentNumber` sınıflaması. |
| `IPersonDirectory` (+impl) | `FindByStudentNumberAsync(number, schoolId, ct)`. |
| `IdentifierResolver.FindForLoginAsync` | `StudentNumber` case (SchoolHint zorunlu). |

### 2.3 FE — küçük

| Bileşen | Değişiklik |
|---|---|
| `EnrollResult` (studentsApi.ts) | `temporaryPassword: string \| null` + `studentAccountCreated: boolean`. |
| `IdentityBox` / `EnrollSuccess` | Üç durumlu başarı satırı; DebtBadge kaldırılır. |
| i18n `enrollWizard.success.*` | Yeni anahtarlar; öksüz Debt anahtarları temizlenir (tr+en parite). |

### 2.4 Mevcut (yeniden kullanılan, değişmez)

- `Account.Create(schoolId, personId, passwordHash, requirePasswordChange:true)` — e-posta/telefon
  **gerektirmez**; kimlik `Person`'da, login köprüsü `Account.PersonId` + `Person.LinkAccount`.
- `Account.RequirePasswordChange` + `AccountAuthResult.RequirePasswordChange` — ilk-giriş
  zorunlu değişim **zaten mevcut**; yeni mekanizma yok.
- `IPasswordHasher` (Argon2id), `PasswordHash` VO.
- `StudentProfile.StudentNumber` — kalıcı kimlik (E2.3).

---

## 3. EnrollStudent entegrasyon akışı

### 3.1 Handler adımı (yeni adım 7.5)

Mevcut sıra (7. Veliler → 8. İdempotency kaydı) arasına:

```
7.5) Öğrenci hesabı provisioning  (transaction içinde, SaveChanges öncesi)
     tempPwd = await provisioner.ProvisionAsync(person, request.GradeLevel, schoolId, ct)
       • küçük kademe (Preschool|Primary) → null döner, hesap açılmaz
       • ortaokul|lise (Middle|High)      → Account.Create(requirePasswordChange:true)
                                            + person.LinkAccount(...) → düz tempPwd döner
```

`IStudentAccountProvisioner` aynı scoped `IApplicationDbContext`'i kullanır → Account yazımı
aynı transaction/`SaveChangesAsync` ile commit olur (atomik).

### 3.2 Kademe çözümü (carve-out)

Provisioner, kayıttaki grade level'dan `EducationLevel` çözer (`GradeLevel.EducationLevel`):

- `EducationLevel.Preschool (0)` veya `Primary (1)` → **küçük kademe** → hesap yok.
- `Middle (2)` veya `High (3)` → öğrenci hesabı oluşturulur.

### 3.3 Sonuç DTO

```csharp
public sealed record EnrollStudentResult(
    Guid StudentPersonId,
    Guid EnrollmentId,
    string StudentNumber,
    bool HasGuardianWarning,
    string? TemporaryPassword,      // null = hesap açılmadı (küçük kademe) veya replay
    bool StudentAccountCreated);    // hesap var mı (replay'de account-varlık ile set edilir)
```

### 3.4 Idempotency replay (E5.3)

Çift "Kaydet" → mevcut replay yolu (handler ~satır 35-44) erken `return` ile çıkar;
**provisioner replay'de hiç çağrılmaz** → mükerrer hesap/şifre üretilmez.

- Replay → `TemporaryPassword: null` (düz metin hiçbir yerde saklanmaz, yeniden gösterilemez).
- `StudentAccountCreated` → replay yolunda **hesap varlığı kontrolü** ile set edilir
  (`db.Accounts.AnyAsync(a => a.PersonId == prior.StudentPersonId)`). Böylece FE üç durumu
  (§6) yalnız `(StudentAccountCreated, TemporaryPassword)` ile ayırabilir.

### 3.5 Transaction & yan etki (E5.1/E5.2 uyumu)

- Account oluşturma bir **DB yazımıdır** → E5.1 transaction'ı içinde (Person/ilişki yazımları
  gibi). Commit başarısızsa hesap da oluşmaz.
- **Yan etki/teslim yok** → geçici şifre e-posta/SMS ile **gönderilmez**, yanıt gövdesinde
  ekrana döner. Dolayısıyla E5.2 ("davet/SMS/FCM transaction dışında") ihlali yok; veli
  davetleri eskisi gibi post-commit `StudentEnrolledEventHandler`'da kalır.

---

## 4. Login resolver — öğrenci no + SchoolHint

### 4.1 Sınıflama (`Identifier.Create`)

`digits` hesabından sonra, mevcut TCKN(11) ve telefon(10-13) shape'lerinden **sonra**:

```
else if (IsStudentNumberShape(digits)) → StudentNumber   // salt rakam, uzunluk 1-9
else                                   → Unknown
```

**Çakışma yok:** Telefon ≥10, TCKN =11 hane. Öğrenci no (mevcut 9-hane veya gelecekteki
3-5 hane) hep <10 → telefon/TCKN aralığına girmez. Format-agnostik (§1.1-b ne olursa olsun).

> **Bilinen sınır:** Bir okul 10-13 haneli numara kullanırsa telefon olarak sınıflanır.
> Türk okul gerçeğinde (3-5 hane) bu oluşmaz; oluşursa ayrı iş paketinde "telefon-miss →
> öğrenci-no fallback" zinciri eklenebilir. Bu faz kapsamı dışı.

### 4.2 Port (`IPersonDirectory`)

```csharp
Task<PersonContextView?> FindByStudentNumberAsync(string studentNumber, Guid schoolId, CancellationToken ct);
```

Users modülü impl'i: `StudentProfile.StudentNumber == number && SchoolId == schoolId` →
`PersonContextView` (LinkedAccountId dahil). **Tenant-scoped** (öğrenci no okul içinde tekil).

### 4.3 Resolver (`IdentifierResolver.FindForLoginAsync`)

```csharp
IdentifierType.StudentNumber => schoolHint is { } sid
    ? await directory.FindByStudentNumberAsync(identifier.Normalized, sid, ct)
    : null,   // okul bağlamı yoksa → uniform NotFound
```

Sonra mevcut `person is null || person.LinkedAccountId is null → NotFound` kontrolü aynen
geçerli (küçük-kademe / hesapsız öğrenci no → uniform "bulunamadı", bilgi sızıntısı yok —
TR-auth-001/002 deseni korunur).

**Okul bağlamı ön koşulu:** Öğrenci no global değil → öğrenci-no login `SchoolHint` ister
(subdomain/okul seçici; auth akışında zaten mevcut parametre). E-posta/telefon login global
kalır, etkilenmez.

---

## 5. Geçici şifre üretici + güvenlik

### 5.1 `ITemporaryPasswordGenerator`

- **Kripto RNG** (`System.Security.Cryptography.RandomNumberGenerator`, `Random` değil).
- **Okunabilir set** — karışan karakterler hariç (`0 O o 1 l I L`):
  `ABCDEFGHJKLMNPQRSTUVWXYZ` + `abcdefghijkmnpqrstuvwxyz` + `23456789`.
- **Uzunluk 8** (yeterli entropi; ilk girişte zaten değişir).
- Düz metin **hiçbir yerde saklanmaz** → `IPasswordHasher.Hash` (Argon2id) → `PasswordHash`
  → `Account.Create`. Yalnız `EnrollStudentResult` ile **bir kez** döner.

### 5.2 Güvenlik özeti

| Konu | Durum |
|---|---|
| Düz şifre saklama | ❌ yok — sadece Argon2id hash. |
| Log sızıntısı | ✅ yok — `RequestLoggingBehavior` (MediatR) ve `RequestLoggingMiddleware` (HTTP) gövde loglamıyor; yalnız ad/yol/durum/süre. |
| Tek-seferlik gösterim | Yanıt gövdesinde bir kez; replay'de `null`. |
| İlk-giriş zorunlu değişim | `RequirePasswordChange:true` → login yanıtı `RequirePasswordChange` ile FE yönlendirir. |
| İzin (E9) | `students.create` — enroll ucu zaten bu izinde; ek izin yok. |
| Tenant (Rule #1) | `Account.Create(schoolId,…)` + `TenantSaveChangesInterceptor`. |
| Bilgi sızıntısı (login) | Bağlı hesabı olmayan no → uniform "bulunamadı". |

**Kabul edilen tasarım kararı:** Geçici şifre API yanıtında dönüp ekranda gösterilir (madde
122 + FE başarı ekranı). Ortaokul/lisede öğrencinin e-postası yoktur → ekranda tek-seferlik
gösterim tek pratik yol. Küçük kademede zaten veli-davet hattı işler.

---

## 6. FE bağlama (Debt kutusunu doldur)

`EnrollResult` iki yeni alan alır; `IdentityBox`/`EnrollSuccess` **üç durumlu** olur (DebtBadge
kaldırılır):

| Durum | Koşul | Gösterim |
|---|---|---|
| 1. Hesap açıldı, şifre var | `studentAccountCreated && temporaryPassword` | Gerçek geçici şifre (kopyalanabilir, tek-seferlik). |
| 2. Hesap açıldı, şifre yok (replay) | `studentAccountCreated && !temporaryPassword` | "Kayıt zaten oluşturulmuş; şifre ilk yanıtta gösterildi" notu. |
| 3. Hesap yok (küçük kademe) | `!studentAccountCreated` | "Küçük kademe — öğrenci hesabı açılmadı; veli daveti gönderildi" notu. |

- i18n yeni anahtarlar: `success.tempPasswordValue`, `success.passwordShownOnce`,
  `success.accountNotCreatedSmallGrade`. Öksüz `success.tempPasswordDebt` / `success.accountDebt`
  temizlenir; tr+en parite.
- Stack: shadcn/ui + Tailwind + React Query (tenant-scoped key) + RHF/Zod + Axios (E12.4);
  named export, `any` yok, inline-style yok (web CLAUDE.md kuralları).

---

## 7. Test stratejisi (TDD — kırmızı → yeşil)

### 7.1 BE birim

- **`TemporaryPasswordGenerator`** — karakter seti karışan-karakter içermez; uzunluk; yalnız
  izinli karakter; kripto-RNG; tekrar üretimde farklılık.
- **`StudentAccountProvisioner`** — küçük kademe → null + hesap yok; ortaokul/lise →
  `RequirePasswordChange:true` + hash'li şifre + `Person.LinkAccount` + düz şifre döner;
  idempotent (Person'ın hesabı varsa atlar, mükerrer açmaz).
- **`Identifier.Create`** — 1-9 hane sayısal → StudentNumber; 10-13 → Phone; 11 → Tckn;
  e-posta etkilenmez.
- **`IdentifierResolver.FindForLoginAsync`** — StudentNumber + SchoolHint → lookup;
  SchoolHint yok → NotFound; hesapsız → NotFound.

### 7.2 BE entegrasyon

- **`FindByStudentNumberAsync`** — tenant-scoped lookup bağlı hesabı döner; cross-tenant → null.
- **`EnrollStudentCommandHandler`** (mevcut süiti genişlet) — ortaokul/lise sonucu
  `TemporaryPassword`+`StudentAccountCreated:true` taşır; küçük kademe `null`+`false`; replay
  `null` + doğru `StudentAccountCreated`.
- **Login** — öğrenci no + geçici şifre → başarı, yanıtta `RequirePasswordChange:true`.

### 7.3 FE

- **`IdentityBox`** — üç durum render.
- **`studentsApi`** — envelope → `EnrollResult` mapping (yeni alanlar).
- **`EnrollSuccess`** — entegrasyon.

---

## 8. Migration

**Gerekmez.** `accounts` tablosu + `RequirePasswordChange` kolonu zaten mevcut (login çalışıyor);
`student_number_counters` mevcut. Yeni tablo/kolon yok. Yalnız servis + handler + resolver kodu
eklenir.

---

## 9. Spec uyum matrisi

| Madde | Karşılanma |
|---|---|
| E2.6 (küçük kademe veli-only) | §3.2 otomatik carve-out |
| E2.7 (öğrenci no = kullanıcı adı, geçici şifre, ilk-giriş değişim) | §3.1, §4, §5 |
| Üst spec 121-122 | §5 (invite-first; öğrenci istisnası) |
| E5.1 (tek transaction) | §3.1, §3.5 |
| E5.2 (yan etki transaction dışında) | §3.5 (şifre teslim edilmez, gösterilir → ihlal yok) |
| E5.3 (idempotency) | §3.4 |
| E2.3 (numara kişiye sabit) | korunur; numara format işi §1.1 ayrı |
| E9 (izin) | §5.2 `students.create` |
| Rule #1 (tenant) | §4.2, §5.2 |
| E4.4.1/E2.3 (numara format) | ⚠️ §1.1 — bu faz değiştirmez; ayrı iş |

---

## 10. Riskler

- **R1 — Şifre log sızıntısı:** ✅ giderildi/doğrulandı (§5.2 — iki log katmanı da gövde loglamıyor).
- **R2 — Çift Kaydet → mükerrer hesap:** ✅ idempotency replay provisioner'ı atlar (§3.4).
- **R3 — Öğrenci no/telefon sınıflama çakışması:** ✅ yok (öğrenci no <10, telefon ≥10) (§4.1).
- **R4 — Okul 10-13 haneli numara kullanır:** bilinen sınır, kapsam dışı; gerekirse fallback
  zinciri ayrı iş (§4.1 notu).
