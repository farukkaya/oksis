# Sicil no doğuşu + çoklu sınıf öğretmenliği — tasarım ve kararlar

> **Ne bu dosya:** Altınay Özel Lisesi kurulumu sırasında çıkan iki kusurun ve bir
> kullanıcı isteğinin tasarımı. 2026-09-20/21 salt okuma ölçümüyle çıkarıldı,
> kararlar kullanıcıyla bağlandı.
>
> Kapsam üç bağlı iş: **(1)** davetle doğan öğretmenin sicil no alması,
> **(2)** bir öğretmenin birden çok şubenin sınıf öğretmeni olabilmesi,
> **(3)** bunun için ortak `MultiSelect` bileşeni.
>
> Depolar: `oksis-api` (`fix/polish`) + `oksis-ui` (`fix/polish`).

## Ölçümden çıkan dört dayanak

1. **Sicil no'nun hiçbir doğuş yolu yoktu.** `TeacherProfile.EmployeeNumber` yalnız profil
   OLUŞTURULURKEN yazılabiliyordu ve o yolu besleyen tek gerçek akış Excel içe aktarmaydı
   (`ImportColumns.SicilNo` → `POST /users/imports`) — web panelinde çağrısı olmayan bir uç.
   Kadrosunu davetle kuran okulda `PersonUserCreationService.cs:126` boş `ProfileRequest`
   gönderiyor, alan her öğretmende `null` doğuyordu. Panel ise sicil noyu dört yerde
   gösterip arama kutusunda ("Ad, sicil no veya branş ara…") onunla aramayı vaat ediyordu.
   Düzeltme yolu 2026-09-20'de açıldı (`UpdateProfileCommand.EmployeeNumber`); **doğuş yolu
   bu turun işi.**

2. **Çoklu sınıf öğretmenliği backend'de ZATEN serbest.** `SetHomeroomCommandHandler.cs:49-52`:
   *"SOFT kural (2026-06-10, ihtiyaç analizi §9): bir öğretmen birden çok şubeye rehber
   atanabilir — engellenmez, UI bilgilendirir. Önceki hard `teacher-already-homeroom` 409'u
   kaldırıldı."* Kısıt tamamen istemcide: `packages/api/src/teachers/endpoints.ts`
   `fetchHomeroomMap` `Map<teacherId, HomeroomInfo>` kuruyor, yani **aynı öğretmenin ikinci
   şubesi sessizce son kazanan tarafından eziliyor.** Veri `/class-rooms` yanıtında zaten var.
   İlişki yönü doğru: **1 şube → 1 rehber**, **1 öğretmen → N şube**.

3. **Sınıf öğretmenliğini iki yüzey yazıyor.** Satır menüsündeki `TchHomeroomModal` ve
   "Mesleki Bilgiler" modalındaki açılır liste. İkincisinin kendi doküman notu tam da bundan
   kaçınmayı şart koşuyor (*"ikinci bir yazma yüzeyi açılmaz"*, Kadro Durumu gerekçesi) —
   homeroom için kural çiğnenmiş. Ayrıca profil modalı A→B devrinde eski şubeden
   **kaldırmıyor** (`modals.tsx` yalnız `setHomeroom(B)` çağırıyor), öğretmen iki şubenin
   birden rehberi kalıyordu; backend soft kural olduğu için itiraz etmiyor.

4. **Ortak `Dialog` var, `MultiSelect` yok.** `apps/web/components/shared/dialog.tsx`
   (`D-19`, commit `197920e`) scrim/Esc/✕/`role="dialog"`/odak geri dönüşü sağlıyor ama
   yalnız **2 tüketicisi** var (ikisi de ayarlar); `att-modal-wrap` hâlâ **27 dosyada** elle
   yazılı, öğretmen modalları dâhil. Çoklu seçim için envanterde hiçbir bileşen yok:
   `MultiChoiceChips` yalnız kısa etiketli az seçenek içindir (Ders Kataloğu "Seviyeler"),
   12+ şubeli okulda çip ızgarası dağılır.

## Bağlanan kararlar (2026-09-21, kullanıcı)

| # | Konu | Karar |
|---|---|---|
| 1 | Sicil no biçimi | **`{sezonYılı}{sıra:000}`** → `2026001`. Yeni tablo ve migration YOK |
| 2 | Yıl kaynağı | **Aktif sezonun başlangıç yılı** (takvim yılı değil) — aynı öğretim yılının kadrosu tek blokta toplanır; Ocak'ta davet edilen de `2026xxx` alır |
| 3 | Sıra kaynağı | `MAX(teacher_employee_number)` `WHERE '{yıl}%'` → +1, yoksa 1 |
| 4 | Yarış durumu | **`sp_getapplock`** (`Exclusive`/`Transaction`, okul başına, 5 sn). Retry YOK, sayaç tablosu YOK. Tekil indeks ikinci savunma hattı |
| 5 | Kapsam | Yalnız `ProfileType.Teacher`. Staff (`schoolAdmin`/`sekreter`/`muhasebeci`) `EmployeeNumber` taşır ama panelde hiçbir yerde gösterilmez → doğrulanamayacak kod yazılmaz |
| 6 | Çoklu homeroom — backend | **Dokunulmaz.** Kural zaten soft (dayanak 2) |
| 7 | Çoklu homeroom — domain tipi | `homeroomClassName`/`homeroomClassRoomId` **silinir**, yerine `homerooms: TeacherHomeroom[]`. Silmek bilinçli: typecheck her tüketiciyi önümüze getirir |
| 8 | **Tek yazma yüzeyi** | **Mesleki Bilgiler modalı.** `TchHomeroomModal` silinir, satır menüsündeki `"homeroom"` maddesi kaldırılır. (Kullanıcı kararı: özel modal değil, profil modalı kalsın) |
| 9 | Kaydetme | **Küme farkı** — eklenenler `setHomeroom`, çıkarılanlar `removeHomeroom`. A→B devri yapısal olarak `remove(A) + add(B)` olur, dayanak 3'teki hata imkânsızlaşır |
| 10 | Tablo hücresi | **İlk iki rozet + "+N"**; tam liste `title`'da. Satır yüksekliği sabit kalır |
| 11 | Yeni ortak bileşen | **`MultiSelect`** — `FilterDropdown`'ın çok değerli yüzü (`SelectBox` tek değerli yüzü olduğu gibi) |
| 12 | Ortak `Dialog`'a taşıma | Bu turun kapsamı DIŞI — ayrı iş. Öğretmen modalları bugünkü `att-modal-*` kabuğunda kalır |

## 1 · Sicil no üretimi (oksis-api)

**Yeni dosyalar** — emsali `IStudentNumberGenerator`/`StudentNumberGenerator`, aynı klasörler:

- `src/Oksis.Application/Common/Abstractions/IEmployeeNumberGenerator.cs`
- `src/Oksis.Infrastructure/Persistence/Identity/EmployeeNumberGenerator.cs`
- `src/Oksis.Infrastructure/DependencyInjection.cs` — kayıt satırı

```
NextAsync(schoolId, ct):
  1. sp_getapplock 'employee-number:{schoolId}'  Exclusive / Transaction / 5000 ms
  2. yıl  = AcademicSession.StartDate.Year   (IsCurrent olan sezon)
  3. aday = TeacherProfile.EmployeeNumber StartsWith('{yıl}')     (LINQ, tenant filtreli)
     sıra  = adayların sayısal kuyruklarının MAX'ı + 1, yoksa 1   (bellekte)
  4. return $"{yıl}{sıra:D3}"
```

İki ayrıntı bilinçli:

- **Sıra SAYISAL karşılaştırılır, metin olarak değil.** `MAX` metin üzerinden alınsaydı 999'u
  aştığı anda bozulurdu: `'2026999' > '20261000'` metin sıralamasında doğrudur, yani 1000.
  öğretmenden sonra sayaç geri sayardı ve tekil indekse çarpardı.
- **Karşılaştırma bellekte yapılır, SQL'de değil.** `CAST(SUBSTRING(...))` yazmak tablo/şema
  adını ham SQL'e gömmeyi gerektirirdi; LINQ ile aday numaraları çekip bellekte karşılaştırmak
  hem sağlayıcıdan bağımsız hem de global tenant filtresini olduğu gibi kullanır. Bir okulun
  bir yıldaki öğretmen sayısı bu iş için önemsizdir. Ham SQL yalnız `sp_getapplock`ta kalır.
- **Sayısal olmayan kuyruk yok sayılır:** elle girilmiş `2026-A` gibi bir numara sırayı bozmaz.
- **`:D3` bir TAVAN değil MİNİMUM genişliktir** — sıra 999'u aşarsa numara dolgusuz büyür
  (`20261000`). `StudentNumberGenerator`'ın `length` alanıyla aynı sözleşme.
- **Aktif sezon yoksa** `CreateAsync` zaten `NoActiveSeason` ile düşüyor (satır 103-106);
  üreteç o kontrolden SONRA çağrılır, yani sezonsuz hâli ele almak zorunda değil.

**Değişen:** `PersonUserCreationService.CreateAsync` — boş `ProfileRequest` yerine
`EmployeeNumber` dolu olanı. Sezon zaten satır 102'de okunuyor (`GetCurrentSessionIdOrNullAsync`).
Üreteç çağrısı ile satır 155'teki tek `SaveChangesAsync` arası **açık bir transaction**a alınır;
kilit commit'te kendiliğinden düşer. Kilit 5 sn'de alınamazsa Türkçe gerekçeli hata döner —
sessizce çakışmaktansa görünür hata.

**Neden batch-içi çakışma yok:** toplu davet (`BulkCreateInvitationsCommandHandler`) var olan
kişileri davet eder, profil açmaz. Öğretmeni doğuran tek yol `CreateAsync` ve o **çağrı başına
tek `SaveChangesAsync`** yapar — sıradaki çağrının `MAX` okuması bir öncekini görür.

## 2 · Çoklu sınıf öğretmenliği — veri akışı (oksis-ui)

```
packages/core/src/teachers/types.ts
- homeroomClassName:   string | null          ✗ silinir
- homeroomClassRoomId: string | null          ✗ silinir
+ export interface TeacherHomeroom { classRoomId: string; className: string }
+ homerooms: TeacherHomeroom[]                // boş dizi = rehber değil

packages/api/src/teachers/endpoints.ts
- Map<teacherId, HomeroomInfo>                // son kazanan siliyordu
+ Map<teacherId, HomeroomInfo[]>
```

`capacitySource` preset seçimi `homerooms.length > 0 ? "classTeacher" : "subjectTeacher"` olur;
anlamı değişmez.

## 3 · `MultiSelect` ortak bileşeni (oksis-ui)

`apps/web/components/shared/multi-select.tsx`; stil `packages/ui/src/styles/screens.css`
(`.usr-fdd` kabuğu **yeniden tanımlanmadan**).

```tsx
<MultiSelect
  icon="sinif"
  label="Şube"
  values={string[]}
  options={{ key, label, disabled?, disabledReason? }[]}
  onChange={(next: string[]) => void}
  placeholder="Şube seçin…"
  maxVisibleChips={2}
  emptyText="Sezonda aktif şube yok."
  disabled?
/>
```

- Düğmede seçili rozetler + "+N"; rozetteki `×` tek tek çıkarır.
- Menüde her satır onay kutulu; `aria-multiselectable`, seçili satır `aria-selected`.
- `disabled` seçenek + gerekçe: rehberi **başkası** olan şube seçilemez — bugünkü
  `takenByOther` kuralı bileşene taşınır, uydurulmaz.
- Envanter (`frontend/bilesenler/_envanter.md`) bu turda güncellenir.

## 4 · UI yüzeyleri (oksis-ui)

| Yüzey | Değişiklik |
|---|---|
| `features/teachers/modals.tsx` — Mesleki Bilgiler | `<select>` → `MultiSelect`; kaydetmede küme farkı; "en fazla bir şubenin rehberi olabilir" bilgi metni kalkar (artık doğru değil) |
| `features/teachers/modals.tsx` — `TchHomeroomModal` | **Silinir** |
| `packages/core/src/teachers/types.ts` | `TeacherAction` birliğinden `"homeroom"` kalkar |
| `packages/core/src/teachers/logic.ts` | `availableTeacherActions` — `homeroom` push'u kalkar |
| `features/teachers/teacher-labels.ts` | `homeroom` etiketi ve menü grubundaki yeri kalkar |
| `features/teachers/teachers-page.tsx` | `homeroom` modal durumu ve iki handler'ı kalkar |
| `features/teachers/table.tsx` | İlk iki rozet + "+N", tam liste `title`'da |
| `features/teachers/drawer.tsx` | `Fact "Sınıf Öğretmenliği"` rozet listesi; `TabSinif` her şube için bir satır |

## Testler

| Katman | Test |
|---|---|
| `Oksis.Infrastructure.IntegrationTests` | `PersonUserCreationService`: davetle doğan öğretmenin sicil no'su **dolu**, ikinci davet sırayı ilerletir (regresyon kilidi). Birim testi DEĞİL: altı DbSet + statik yardımcı taklidi kırılgan olurdu ve transaction/applock'u zaten kanıtlayamazdı |
| `Oksis.Infrastructure.IntegrationTests` | `EmployeeNumberGenerator`: ilk numara `{yıl}001` · sıra artar · yıl bloğu değişince sıfırlanır · 999 eşiğinde geri saymaz · transaction dışında çağrı hatadır. **Eşzamanlılık doğrudan test EDİLMEDİ** — korumanın kanıtı `sp_getapplock` + tekil indeks; iki gerçek eşzamanlı isteği kurgulayan bir test yazılmadı, kapsanmış gibi gösterilmemeli |
| `packages/core` | `homerooms` üzerinden preset seçimi; `availableTeacherActions` artık `homeroom` döndürmez |
| `packages/api` | `fetchHomeroomMap` aynı öğretmenin **iki şubesini de** taşır (bugün son kazanan siliyor) |
| `packages/core` | Küme farkı (`diffHomerooms`): salt ekleme · salt çıkarma · A→B devri (aynı kayıtta ekle+çıkar) · değişiklik yok · hepsini temizleme |

Doğrulama kullanıcı kararıyla **en sonda toplu**: `typecheck` + `lint` + core/api vitest +
backend `dotnet test`, ardından tarayıcı doğrulaması ayrıca onaya bağlı.

## Kapsam dışı (bilinçli)

- **Staff sicil no'su** — alan var, panelde yüzeyi yok (karar 5).
- **Öğretmen modallarının ortak `Dialog`'a taşınması** — ayrı iş (karar 12); `att-modal-wrap`
  27 dosyada duruyor, kademeli taşıma `D-19` envanter notunun planı.
- **Sicil no okul ayarı (önek/uzunluk)** — öğrenci numarasının `StudentNumberPrefix`
  emsali var ama bu tur migration'sız kalıyor; ihtiyaç çıkarsa ayrı tur.
- **`packages/core/src/homework/schemas.test.ts`** — `dueDate: "2026-09-18"` sabiti geçmişte
  kaldığı için düşüyor. Bu turla ilgisiz, ayrı düzeltme.
