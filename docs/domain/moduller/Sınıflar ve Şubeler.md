---
aliases: [ClassRooms, class-rooms, Sınıflar & Şubeler]
tags: [domain/academic, module]
status: completed
last-synced: 2026-08-10 (2270867)
---

# Sınıflar ve Şubeler

<!-- generated:start -->

## Ne yapar

Okulun sınıf yapısını kuran ve öğrencileri o yapıya yerleştiren modül. Yönetici sezona şubeleri açar (9-A, 9-B, "Papatya"), her şubeye rehber öğretmen ve ev dersliği verir, öğrencileri atar, yıl içinde şubeler arası transfer eder, ayrılanları kapatır ve yıl sonunda şubeyi arşivler.

Modülün taşıyıcı fikri şu: **öğrenci-şube ilişkisi bir alan değil, bir defterdir.** Öğrencinin şubesi üzerine yazılmaz; her atama bir satırdır, ayrılışta sebep koduyla kapatılır, yenisi açılır. "Bu öğrenci ekimde hangi şubedeydi" sorusu bu sayede cevaplanabilir kalır.

## Kodda nerede yaşar

Tek bir kod modülü değildir — üç yere dağılmıştır: şube ve atama defteri `AcademicSessions`'ta, derslik kataloğu `Timetable`'da, sınıf seviyesi `Academics` master verisinde. Ürün olarak tek modüldür ve bunu izin ailesi gösterir: derslik CRUD'u bile `class-rooms.manage` ile korunur, `timetable.*` ile değil. (`Application/Modules/Classes` klasörü boştur; oraya bakma.)

## Kullandığı kavramlar

- [[Şube]] — modülün merkezi aggregate'i; atama defterini içinde taşır
- [[Sınıf Seviyesi]] — şubenin bağlı olduğu kademe; şube adının önekini üretir
- [[Derslik]] — şubenin sabit "ev" odası
- [[Sezon]] — her şube bir sezona aittir; sezon arşivliyse yazma kabul edilmez
- [[Kişi]] / [[Profil]] — atanan öğrenci ve rehber öğretmen; öğrenci profilindeki güncel şube alanı bu modülün defterinden türetilir

## Ana akışlar

1. **Şube kurma** — Hedef sezon `Setup` veya `Active` olmalı; arşiv sezona şube açılmaz. Sınıf seviyesi master'dan doğrulanır ve kodu şube adının önekini üretir (`9` + `A` → `9-A`). Aynı sezonda aynı (seviye, şube adı) ikilisi varsa erken reddedilir. Okul ayarı onay istiyorsa şube `PendingApproval`, istemiyorsa doğrudan `Active` doğar. Rehber öğretmen kuruluşta verilirse varlığı doğrulanır.

2. **Onay** — `PendingApproval` veya `Draft` şube `Active`'e çekilir. Zaten aktifse işlem sessizce geçer (idempotent).

3. **Taslağa çekme** — Aktif bir şube `Draft`'a geri çekilebilir. Bu "yumuşak" bir kapatmadır: **mevcut öğrenciler şubede kalır**, yalnız yeni atama engellenir. Şube statüsü, sezonun aksine tek yönlü değildir.

4. **Rehber öğretmen ve derslik** — İkisi de atanır, değiştirilir, kaldırılır; aynı değerin tekrar atanması işlem üretmez. Şube rehbersiz kalabilir. Bir derslik birden çok şubeye atanabilir — ikili öğretim gerçeği bilinçli olarak engellenmemiştir.

5. **Öğrenci atama** — Yalnız `Active` şubeye yapılır. Bir öğrencinin okul genelinde **en fazla bir aktif ataması** olabilir; bu veritabanı seviyesinde filtreli unique index ile korunur, ihlal `STUDENT_ALREADY_ASSIGNED` döner. Atama sebebi elle girilmez: öğrencinin daha önce kapanmış bir kaydı varsa "yıl içi yeni kayıt", yoksa "ilk atama" olarak türetilir. Kapasite aşımı engellenmez.

6. **Transfer** — Kaynak ve hedef şube **aynı okulda ve aynı sezonda** olmalı, hedef `Active` olmalı, kaynakla aynı olmamalı. Kaynaktaki aktif atama `Transfer` sebebiyle kapatılır, hedefte yenisi açılır. Tek işlemde iki olay yayınlanır.

7. **Çıkarma** — Aktif atama sebep koduyla kapatılır: mezuniyet, okuldan ayrılma, başka okula nakil, arşiv. Mezuniyet ayrıca kendi olayını yayınlar.

8. **Arşivleme ve silme** — İkisi de **aktif öğrenci varken reddedilir**; önce öğrenciler taşınmalıdır. Arşivleme gerekçe ister ve şubeyi salt-okunur yapar. Silme ise farklıdır: statü engel değildir, kayıt fiziksel silinmez (`is_deleted`) ve (sezon, seviye, şube adı) slotu serbest kalır — aynı ad yeniden açılabilir. Sezon kapanışında ayrı bir yol vardır: aktif atamalar `Archive` sebebiyle topluca kapatılır ve şube arşive geçer.

9. **Sezon geçişinde terfi** — Yeni sezonun şubeleri, üretildikleri kaynak şubeye bir köken bağıyla bağlanır; aktivasyondaki öğrenci terfisi bu bağı izler. Terfinin kendisi [[Sezon Yönetimi]]'nin işidir.

10. **Derslik kataloğu** — Oda açma, güncelleme, pasifleştirme, silme. Pasif oda yeni atamalarda listelenmez ama mevcut atamalar korunur. Bir şube tarafından kullanılan oda silinemez.

**Profil senkronu:** Öğrenci profilindeki "güncel şube" alanı ayrı yazılmaz. Defter her değiştiğinde — komut yoluyla ya da seeder gibi yan yollarla — aynı transaction içinde bir interceptor tarafından türetilir. Böylece hiçbir kod yolu senkronu unutamaz.

**Yetki:** `class-rooms.view`, `view-detail`, `create`, `update`, `delete`, `approve`, `archive`, `assign-student`, `remove-student`, `transfer-student` ve derslikler için `manage`. Sınıf seviyesi listesi izinle korunmaz; tenant-agnostik master lookup olduğu için her oturum açmış kullanıcıya açıktır ve 24 saat önbelleklenir.

## Kapsam dışı

- **Kapasite aşımının engellenmesi** — bilinçli olarak soft limit; aşım da mevcut öğrenci sayısının altına inme de serbesttir, uyarı arayüzün işidir (2026-06-10 kararı).
- **Saatlik derslik kullanımı ve çakışma kontrolü** — burada yalnız şubenin sabit ev dersliği vardır; ders saatine göre oda kullanımı ders programı çekirdeğinin işidir.
- **Öğrenci kayıt yenileme** — kim gelecek yıl devam edecek sorusu bu modülde değil, [[Öğrenci Kayıt Yönetimi]]'nde yanıtlanır. Terfi sırasında iki modül buluşur: yenileme dönemi açıksa yalnız taslağı olan öğrenci şube koltuğuna oturur.

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- `Draft` statüsü "nadir, toplu üretimde kullanılır" diye tanımlanmış, ama 2026-06-10'da panele Taslak→Aktif geçişi eklenmiş. Draft'ın gerçek sahası ne — geçici kapatma mı, üretim ara durumu mu?
- Şube silinince slot serbest kalıyor ama kapanmış geçmiş atamalar silinen şubeye asılı kalıyor. Aynı adla yeni şube açılırsa öğrencinin geçmişi hangi şubeye ait okunacak?
- Atama sebebinin (`Initial` / `NewEnrollment`) türetimi öğrencinin **tenant genelindeki** geçmişine bakıyor, sezona değil. Yeni sezonda terfi eden öğrenci bu yolla "yıl içi yeni kayıt" olarak işaretlenmiş olmuyor mu?
- Pasifleştirilmiş derslik mevcut şube atamalarını koruyor, ama silinmesi "kullanımda" gerekçesiyle engelleniyor. Pasif odaya bağlı kalmış şube için beklenen davranış ne?
