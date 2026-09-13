---
aliases:
  - AcademicSession
  - Eğitim-Öğretim Yılı
  - AcademicYearId (deprecated)
tags:
  - domain/academic
table: academic_sessions
status: active
last-synced: 2026-09-13 (294ffe6)
cssclasses:
---

# Sezon

<!-- generated:start -->

## Nedir

Bir okulun tek bir eğitim-öğretim yılını temsil eden çatı kavram — MEB dilinde "eğitim-öğretim yılı", ürün dilinde "sezon". Tenant başına aynı anda en fazla bir sezon yayındadır ve akademik kayıtların neredeyse tamamı (şube, tatil, yoklama, not, görevlendirme) bir sezona bağlanır.

Tek sezon okulun **bütün kademelerini** kapsar: sezonda kademe ekseni yoktur, anaokulu ile lise aynı sezonun içinde yürür. Kademeye özgü olan şeyler (şube, kayıt) sezonun altında yaşar.

## Yaşam döngüsü

`Setup → Active → Archived` — tek yönlü, geri dönüş yok (BR-AS-002).

- **Setup** — hazırlık. Ad ve tarihler değiştirilebilir, şubeler kurulur.
- **Active** — yayında. `IsCurrent` true olur; tenant başına tek.
- **Archived** — salt-okunur. Yazma denemesi her davranışın girişinde reddedilir (BR-AS-003).

Sezon yaratılırken iki dönem (T1, T2) atomik olarak birlikte oluşturulur — sezon dönemsiz var olamaz.

`Setup` içinde statü değiştirmeyen bir ara işaret vardır: yenileme dönemi (`RenewalPeriodOpenedAt`). Açılması tek-yön invariant'ını bozmaz, yalnızca bir zaman damgası düşer ve idempotenttir.

Sihirbazla açılan sezonun yapısı `Setup`'a geçerken, öğrenci ve görevlendirme verisi `Active`'e geçerken yazılır — bkz. [[0006-sezon-iki-asamali-materyalizasyon]].

## Kurallar

- Tenant başına en fazla bir `Active` sezon bulunur; yeni sezon aktive edilirken öncekini arşivlemek handler katmanının sorumluluğundadır (BR-AS-001, BR-AS-002).
- Statü geçişi tek yönlüdür, `Archived` terminaldir (BR-AS-002).
- Arşivlenmiş sezonda hiçbir yazma işlemi kabul edilmez (BR-AS-003).
- Ad ve tarih değişikliği yalnızca `Setup` statüsünde izinlidir; `Active` sezonda yeniden adlandırma reddedilir.
- Tarih tutarlılığı (BR-AS-004): sezon başlangıcı bitişinden önce olmalı; T1 sezon başlangıcından önce başlayamaz; T1, T2 başlamadan bitmeli; T2 sezon bitişini aşamaz.
- T1 ve T2 farklı dönem tiplerinde olmalıdır.
- Sezon adı okul içinde tekildir (silinmiş sezonlar sayılmaz) ve 4–20 karakterdir. Kavramın kendisi adda kalıp aramaz; ancak doğrudan oluşturma ve yeniden adlandırma uçları `YYYY-YYYY` biçimini ister, taslaktan açma yolu bu kalıbı uygulamaz.
- `Activate` ve `Archive` idempotenttir — hedef statüye ikinci çağrı hata değil, sessiz no-op.

## İlişkiler

- [[Dönem]] — sahiplik (owned koleksiyon); sezon tam iki dönem içerir, ikisi sezonla birlikte doğar
- [[Şube]] — ID referansı; şube bir sezona aittir, aggregate'ler arası navigation yoktur
- [[Okul Tatili]] — ID referansı; tatil sezon tarih aralığında olmalıdır (aralık kontrolü Application katmanında)
- [[Öğrenci Kaydı]] — ID referansı; kayıt bir sezona aittir, yeni kayıt yalnız `Active` sezonda açılır

## Geçtiği modüller

- [[Sezon Yönetimi]] — kavramın sahibi; yaşam döngüsü, sezon geçişi ve takvim burada yönetilir
- [[Öğrenci Kayıt Yönetimi]] — kayıt, yenileme niyeti ve durum değişiklikleri cari sezon üzerinden yürür
- [[Kullanıcılar]] — [[Rol Ataması]] ve [[Davet]] sezona bağlıdır; yetki sezon değişince yeniden kurulur
- [[Kimlik Doğrulama]] — kullanıcının aktif sezon bağlamı ve sezonlar arası geçiş
- [[Nöbetler]] — [[Nöbet Çizelgesi]] sezona bağlıdır, ama kimliği hâlâ eski `AcademicYearId` adıyla taşır

Sezona `AcademicSessionId` ile bağlanan ama henüz notu olmayan modüller: Academics, Teachers, Attendance, Timetable, Announcements, Schools.

## Açık Sorular (senkron)

- Ek sezon (yaz okulu, kurs dönemi) bilinçli olarak kapsam dışı mı, ve kavramın `AcademicYear` yerine `AcademicSession` diye adlandırılması buna ileride yer açmak için mi? Kodda ek sezon türüne dair bir iz yok; gerekçe doğrulanamadı.
- Ad kalıbı iki yolda farklı: doğrudan oluşturma `YYYY-YYYY` ister, taslaktan açma yalnız uzunluğa bakar. Hangisi kasıtlı?

<!-- generated:end -->

## Notlar

<El yazısı alan. Senkron buraya dokunmaz.>

## Açık Sorular

- `Duties` modülü sezona `AcademicYearId` adıyla ham `Guid` üzerinden bağlanıyor; FK yok, değer request gövdesinden geliyor. Bu alan `AcademicSession.Id`'yi mi işaret ediyor, yoksa ayrı bir kavram mı? Aynı şeyse isim `AcademicSessionId`'ye taşınmalı — `aliases` içindeki `deprecated` işareti şimdilik bu varsayıma dayanıyor, doğrulanması gerekiyor.
- `BR-AS-013` kod tabanında hiç geçmiyor. Numara boşluğu mu, yoksa yazılmış ama uygulanmamış bir kural mı? (`BR-AS-010` için bkz. [[Şube]].)
