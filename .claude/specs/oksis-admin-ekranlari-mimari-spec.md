# Oksis — Admin Paneli Ekran Mimarisi Spec'i

**Kapsam:** Kullanıcılar, Öğrenciler, Öğretmenler ekranları
**Hedef rol:** School_Admin
**Durum:** Tasarım kararları (v1)
**Mimari bağlam:** Modular Monolith · Vertical Slice · CQRS/MediatR · Clean Architecture · Multi-tenant

---

## 0. Bu dokümanın amacı

Üç admin ekranının sorumluluk sınırları, veri modeli kararları, yaşam döngüleri ve backend slice karşılıklarını tek yerde toplar. Buradaki en kritik fikir, ekranların **birbirine karışmamasını sağlayan sınırların** baştan netleştirilmesidir. Her ekran için bir cümlelik "sahiplik sınırı" tanımlıdır; bir karar verirken bu sınıra aykırı düşüyorsa, o iş başka ekrana aittir.

---

## 1. Temel kavramsal ayrımlar (tüm ekranların türediği kararlar)

### 1.1 Hesap ≠ Profil (account vs profile)

Sistemde iki ayrı kavram vardır ve karıştırılmamalıdır:

- **Hesap (`User` / Identity):** Sisteme giriş yapabilen kimlik. E-posta/telefon, şifre, roller, durum, son giriş, davet durumu. Auth/altyapı meselesidir ve ortaktır.
- **Domain profili (`Student` / `Teacher` / `Guardian`):** Okula özgü iş varlığı. Bir `UserId`'ye bağlanan, kendi domain verisiyle gelen profil.

Bu üç domain varlığı kimlik dışında neredeyse hiçbir anlamlı alan paylaşmaz. Bu yüzden tek bir dev "kullanıcı" tablosunda hepsini yönetmek god-screen üretir; ayrım şarttır.

Bir kişi **birden çok role/profile** sahip olabilir (örn. okulda çalışan bir öğretmenin aynı okulda veli olması). Bu durumda kişi **tek bir hesap**, birden çok profile (Teacher + Guardian) bağlıdır. Birleşik Kullanıcılar ekranının asıl değeri kimliği birleştiren bu tek noktadır.

### 1.2 Sezon modeli: kişi ≠ kayıt

Hem öğrenci hem öğretmen tarafında aynı yapı geçerlidir:

| Kalıcı varlık | Sezona bağlı varlık | Sezona bağlı taşınan veri |
|---|---|---|
| `Student` (kişi) | `Enrollment` | sınıf, durum, devamsızlık, ortalama |
| `Teacher` (istihdam kimliği) | `TeachingAssignment` | verdiği dersler/sınıflar, sınıf öğretmenliği, haftalık saat |

Tablolar kişileri değil, **aktif sezonun kayıtlarını** listeler. Sezon seçici değiştiğinde tablonun filtre ekseni değişir; kişiler silinmez. Bu model olmadan geçmiş yıl verisi kaybolur ve sınıf yükseltme/mezuniyet/görev taşıma işlemleri kabusa döner.

### 1.3 Hard-delete yasağı (tüm varlıklar)

Hiçbir hesap, öğrenci veya öğretmen **gerçekten silinmez.** Akademik kayıtlar, karneler, mali kayıtlar ve audit izi bu varlıklara referans verir. "Sil" işlemi her zaman **Pasife alma** anlamına gelir. Bu hem veri bütünlüğünü hem denetlenebilirliği korur.

### 1.4 Modüller arası iletişim: domain event

Bir modül başka bir modülü doğrudan çağırmak yerine **domain event** yayınlar (örn. `StudentEnrolled`, `TeacherHired`, `AssignmentChanged`). İlgili modül event'i dinleyerek tepki verir. Bu, "modülleri izole tut / tight coupling'den kaçın" prensibinin uygulamasıdır.

### 1.5 Multi-tenancy

Tüm ekranlar yalnızca **aktif okulun (tenant)** verisini gösterir. E-posta tekilliği tenant bazında ele alınır.

---

## 2. Menü konumlandırması

```
OKUL
  ├─ Öğrenciler        → domain CRUD + akademik yaşam döngüsü
  ├─ Öğretmenler       → domain CRUD + görev/kapasite yönetimi
  └─ (Veliler ekranı YOK — Öğrenci detayında yönetilir)

SİSTEM
  ├─ Kullanıcılar      → hesap/erişim/güvenlik merkezi
  └─ Roller ve İzinler → rol tanımları (atama Kullanıcılar'da yapılır)
```

Persona bazlı domain alanları (OKUL) ile hesap/güvenlik yönetimi (SİSTEM) ayrı başlıklar altındadır.

---

## 3. Kullanıcılar Ekranı

> **Sahiplik sınırı:** Hesabı yönetir, profili değil. Kim giriş yapabiliyor, hangi rolle, hangi durumda — yalnızca bunlar.

### 3.1 Hesap nerede doğar?

- **Öğrenci / öğretmen / veli hesapları** kendi domain ekranlarında doğar; Kullanıcılar ekranı bunları **yönetir, oluşturmaz.**
- **Domain'i olmayan roller** (Yönetici, Muhasebe, Operasyon) doğrudan bu ekrandan doğar. "+ Yeni Kullanıcı" pratikte personel/idari hesap üretir.

### 3.2 KPI'lar (güvenlik/hesap ekseni)

- Toplam Hesap
- Aktif
- Bekleyen Davet
- Dikkat Gerektiren (kilitli + askıda)
- (opsiyonel) 30+ gündür giriş yapmamış

### 3.3 Arama ve filtreler

- **Arama:** ad / e-posta / telefon
- **Filtreler:** Rol · Durum · Bağlı profil (var/yok) · Son giriş aralığı

### 3.4 Tablo kolonları

| Kolon | Açıklama |
|---|---|
| Kullanıcı | avatar + ad + e-posta/telefon |
| Rol(ler) | çoklu badge |
| Bağlı Profil | domain kaydına köprü ("Öğrenci · 202610029") veya "—" |
| Durum | Aktif / Davet / Kilitli / Askıda / Pasif |
| Son Giriş | bu ekranın en değerli sütunu |
| Oluşturma / Davet tarihi | |
| Aksiyonlar | (…) |

### 3.5 Aksiyonlar

- **Satır (…):** Detay · Rolleri düzenle · Şifre sıfırlama bağlantısı gönder · Daveti yeniden gönder · Kilidi aç · Askıya al / Yeniden etkinleştir · Pasife al
- **Toplu:** rol atama · askıya alma · davet yeniden gönderme · dışa aktarma (toplu şifre sıfırlama ve pasife alma onaylı; bağlı kaydı olan hesapta sert silme engellenir)
- **"Düzenle" = hesabı düzenler.** Akademik bilgi için domain ekranına köprü.

### 3.6 Detay drawer (sekmeli)

- **Hesap:** kimlik, roller, durum, oluşturulma/davet tarihi
- **Güvenlik:** şifre sıfırlama linki, 2FA durumu, aktif oturumlar + "tüm oturumları kapat", başarısız giriş denemeleri
- **Erişim:** rol atama (tanım "Roller ve İzinler"de; burada yalnızca atanır)
- **Bağlı Profil:** domain kaydına köprü
- **Etkinlik / Audit:** giriş geçmişi, kim ne zaman ne değiştirdi

### 3.7 Davet akışı

- Prensip: **invite-first.** Yönetici şifre belirlemez; kullanıcı kendi şifresini kurar (custom JWT + refresh rotation kurgusuyla uyumlu).
- **Öğrenci istisnası:** çoğu öğrencide e-posta yoktur → kullanıcı adı = öğrenci no, geçici şifre üretilir, ilk girişte zorunlu değişim. Veli/öğretmende normal e-posta/telefon daveti.

### 3.8 Edge case'ler / koruma kuralları

- Son kalan yönetici askıya alınamaz/pasife çekilemez.
- Yönetici kendi hesabını kilitleyemez/askıya alamaz.
- E-posta değişimi yeniden doğrulama gerektirir.
- Çoklu rollü hesabı pasife almak tüm rollerini etkiler → kullanıcı uyarılır.

### 3.9 Backend slice'ları

```
Modules/Identity/Features/
  InviteUser/ ResendInvite/ AssignRoles/
  LockUser/ UnlockUser/ SuspendUser/ ReactivateUser/ DeactivateUser/
  SendPasswordReset/   (link gönderir, şifre SET ETMEZ)
  RevokeSessions/
  GetUsers/ GetUserDetail/ GetUserActivity/
```

---

## 4. Öğrenciler Ekranı

> **Sahiplik sınırı:** Öğrencinin akademik kimliğini ve okul içindeki yaşam döngüsünü yönetir — giriş/şifre/güvenlik değil. Ayrıca veli ilişki ağının da evidir.

### 4.1 Yapısal gerçekler

- **Öğrenci ≠ Kayıt:** Tablo aslında aktif sezonun `Enrollment` kayıtlarını listeler (bkz. §1.2).
- **Veli burada yaşar:** Ayrı veli ekranı olmadığı için veli CRUD'u Öğrenci detayının içindedir.

### 4.2 KPI'lar (akademik/operasyonel eksen, hepsi aktif sezon)

- Toplam Öğrenci · Aktif · Bu Ay Yeni Kayıt · Devamsızlık Riski
- Devamsızlık verisi başka modülden beslenir; o modül gelene kadar "—" göstermek dürüst tasarımdır.

### 4.3 Arama ve filtreler

- **Arama:** ad / öğrenci no / veli
- **Filtreler:** Sınıf · Durum · Cinsiyet · Seviye/Kademe · Veli durumu (tanımlı/eksik) · (ileride) Devamsızlık eşiği

### 4.4 Tablo kolonları

| Kolon | Not |
|---|---|
| Öğrenci | avatar + ad + öğrenci no |
| Sınıf | aktif sezon |
| Veli | birden çok olabilir → "Zeynep Sönmez +1" / birincil veli işareti |
| Devamsızlık | salt-okunur, dış modül |
| Ortalama | salt-okunur, dış modül |
| Durum | |
| Kayıt | |

### 4.5 Aksiyonlar (domain operasyonları)

- **Satır (…):** Detay · Düzenle · Sınıf ata/değiştir · Veli bağla · Belge ekle · Nakil çıkışı · Mezun et · Kaydı dondur · Pasife al
- **Toplu:** sınıf atama/yükseltme (yıl sonu terfi) · dışa aktarma (mezun etme/nakil onaylı)
- **"Düzenle" = akademik bilgi.** Giriş bilgisi için Kullanıcılar'daki bağlı hesaba köprü.

### 4.6 Detay (geniş drawer / tam sayfa, sekmeli)

- **Genel:** kimlik, öğrenci no, doğum tarihi, fotoğraf, aktif sınıf, durum
- **Veliler:** bağlı veliler, ilişki tipi, birincil veli, iletişim — *veli ekle/çıkar burada*
- **Akademik:** ortalama/dersler/karne — salt-okunur
- **Devamsızlık:** salt-okunur
- **Kayıt Geçmişi:** sezon sezon hangi sınıf — sezon modelinin meyvesi
- **Belgeler:** nüfus, nakil, sağlık vb.
- **Hesap:** bağlı `User` özeti + "Kullanıcılar'da yönet" köprüsü

### 4.7 Veli yönetimi (ayrı ekranı olmayan modülün evi)

- İlişki **çoka-çok:** bir öğrencinin birden çok velisi, bir velinin birden çok öğrencisi (kardeşler) olabilir.
- `Guardian` ayrı varlık; ilişki üzerinde **tip** (anne/baba/vasi) ve **birincil mi** bilgisi taşınır.
- Akış: "Veli ekle" → önce mevcut velilerde ara (kardeş zaten kayıtlıysa bağla) → yoksa yeni veli + arka planda `User` hesabı/davet.

### 4.8 Edge case'ler

- Velisiz öğrenci kaydedilebilir ama "veli eksik" uyarısı görünür.
- Sınıf değiştirme yalnızca aktif sezon kaydını etkiler, geçmişi değiştirmez.
- Mezun/nakil öğrenci aktif tablodan düşer, filtreyle erişilir.
- Öğrenci no tenant + sezon bazında üretilir ve değişmez (örn. `202610029` = yıl + sıra).

### 4.9 Backend slice'ları

```
Modules/Students/Features/
  EnrollStudent/        (öğrenci + ilk Enrollment + User provizyonu → event)
  UpdateStudent/
  AssignClass/ TransferClass/ PromoteStudents/
  GraduateStudent/ TransferOut/ FreezeEnrollment/ Reactivate/
  LinkGuardian/ UnlinkGuardian/ SetPrimaryGuardian/
  UploadDocument/
  GetStudents/ GetStudentDetail/ GetEnrollmentHistory/
```

`EnrollStudent` → `StudentEnrolled` event → Identity modülü hesabı açar (doğrudan çağrı değil).

---

## 5. Öğretmenler Ekranı

> **Sahiplik sınırı:** Öğretmenin mesleki kimliğini ve görev yükünü yönetir — ders programının kendisini, not girişini, nöbet çizelgesini değil. Bu ekran arzı tanımlar; Ders Programı / Nöbet modülleri onu tüketir.

### 5.1 Yapısal gerçekler

- **Öğretmen ≠ Görevlendirme:** `Teacher` (kalıcı istihdam) ile `TeachingAssignment` (sezona bağlı görev) ayrıdır (bkz. §1.2).
- **Kapasite/kaynak ekranı:** Öğrenciden farklı olarak öğretmenler farklı yüklere sahip kaynaklardır; **haftalık yük/kapasite** birinci sınıf vatandaştır.

### 5.2 KPI'lar (kadro/kapasite ekseni)

- Toplam Öğretmen · Aktif Görevli · Ortalama Haftalık Yük (kapasite doluluğu %) · Branş Açığı / Dikkat
- "Branş açığı" Ders Programı modülü olgunlaşınca anlamlanır; başta "—".

### 5.3 Arama ve filtreler

- **Arama:** ad / sicil no / branş
- **Filtreler:** Branş · Durum (aktif/izinli/ayrıldı) · Görev tipi (sınıf öğr. / branş öğr. / rehber) · (kapasite gelince) Yük durumu

### 5.4 Tablo kolonları

| Kolon | Not |
|---|---|
| Öğretmen | avatar + ad + sicil no |
| Branş | birden çok olabilir, çoklu badge |
| Verdiği Dersler/Sınıflar | aktif sezon özeti ("9-A, 9-B, +3") |
| Sınıf Öğretmenliği | şube ("10-A") veya "—" |
| Haftalık Yük | "24 / 30 saat", doluluk göstergeli — bu ekranın imzası |
| Durum | |
| Aksiyonlar | (…) |

### 5.5 Aksiyonlar (atama/yetkilendirme odaklı)

- **Satır (…):** Detay · Düzenle (mesleki bilgi/branş) · Ders/sınıf görevlendir · Sınıf öğretmeni ata/kaldır · Ders programını görüntüle (köprü) · İzin/ayrılış işle · Pasife al
- **Toplu:** sezon görevlendirme taşıma (geçen yılı şablon olarak kopyalama) · dışa aktarma

### 5.6 Detay (sekmeli)

- **Genel:** kimlik, sicil no, branş(lar), işe giriş tarihi, iletişim, durum
- **Görevlendirmeler:** aktif sezon ders/sınıfları — *ekle/çıkar burada* (ekranın kalbi)
- **Ders Programı:** haftalık saat-saat — salt-okunur, Ders Programı modülünden
- **Nöbet:** salt-okunur, Nöbet Yönetimi'nden
- **Sınıf Öğretmenliği:** sorumlu şube + öğrenci listesine köprü
- **Görev Geçmişi:** sezon sezon verdiği dersler
- **Belgeler:** diploma, sertifika, sözleşme, özlük
- **Hesap:** bağlı `User` özeti + "Kullanıcılar'da yönet" köprüsü

### 5.7 Görevlendirme yönetimi (programın beslendiği yer)

- İlişki `Teacher × Class × Subject` üçlüsü üzerinden; bu ilişki **haftalık saat** taşır. Toplam yük = tüm görevlendirme saatlerinin toplamı.
- **Sınır:** Öğretmen ekranı *kim hangi dersi verecek* sorusunu çözer; *hangi gün/saat* sorusunu Ders Programı modülü çözer. ("Ahmet → 9-A Matematik, 4 saat" burada; o 4 saatin çizelgeye yerleşmesi orada.)
- **Sınıf öğretmenliği** ders vermekten bağımsız idari atamadır: bir öğretmen 0/1 şube, bir şube tek sınıf öğretmeni.

### 5.8 Edge case'ler

- Branşsız öğretmen kaydedilebilir ama "branş eksik" uyarısı (görevlendirme yapılamaz).
- Ders Programı'nda kullanılan görevlendirme silinmek istenince bağımlılık uyarısı.
- Aşırı yük → sert engel değil, yumuşak uyarı.
- İzinli öğretmene yeni görev atanamaz.
- Sınıf öğretmeni boşalan şube "rehbersiz" işaretlenir.

### 5.9 Backend slice'ları

```
Modules/Teachers/Features/
  HireTeacher/          (Teacher + User provizyonu → event)
  UpdateTeacher/
  AssignSubjectClass/ UnassignSubjectClass/
  SetHomeroom/ RemoveHomeroom/
  CopyAssignmentsToNewSeason/
  PutOnLeave/ ReturnFromLeave/ Terminate/
  UploadDocument/
  GetTeachers/ GetTeacherDetail/ GetTeacherWorkload/ GetAssignmentHistory/
```

- `HireTeacher` → `TeacherHired` event → Identity hesap açar.
- Görevlendirme değişikliği → `AssignmentChanged` event → Ders Programı modülü senkron kalır.
- `GetTeacherWorkload` sık çağrılır → sezon bazında Redis cache.

---

## 6. Yaşam döngüleri (state machine referansı)

İlgili görsel: **"Oksis — Hesap, Öğrenci ve Öğretmen Yaşam Döngüleri"** FigJam diyagramı.

### 6.1 Hesap (Identity)

`Davet Edildi → Aktif` (şifre kurulunca). `Aktif → Kilitli` (otomatik, hatalı giriş) → kilit açılınca `Aktif`. `Aktif → Askıda` (kasıtlı idari kapatma) → geri alınınca `Aktif`. `→ Pasif` (arşiv, terminal). Davet `Pasif`'e çekilerek iptal edilebilir.

### 6.2 Öğrenci

`Aday/Ön Kayıt → Aktif` (kesin kayıt). `Aktif ↔ Dondurulmuş` (geçici ayrılış). `Aktif → Nakil Gitti` (çıkış belgesi, terminal). `Aktif → Mezun` (kademe biter, arşiv, terminal). `Aktif → Aktif` self-transition = yıl sonu sezon terfisi (yeni `Enrollment` yaratır, öğrenciyi değiştirmez).

### 6.3 Öğretmen (çift eksen)

- **İstihdam ekseni:** `İşe Alım → Aktif → İzinli (↔ Aktif) → Ayrıldı` (arşiv, terminal).
- **Görev ekseni (sezona bağlı):** `Görevsiz ↔ Görevli`. Öğretmen istihdamda Aktif olup o sezon henüz Görevsiz olabilir.

Tüm terminal durumlar **arşivdir, silme değildir** (bkz. §1.3).

---

## 7. Mimari uyum kontrol listesi

- [ ] Her handler `async` + `CancellationToken`
- [ ] FluentValidation ile giriş doğrulama
- [ ] Mapster ile DTO map (AutoMapper YOK)
- [ ] Domain katmanı infrastructure'a bağımlı değil
- [ ] Modüller arası iletişim domain event ile (doğrudan çağrı yok)
- [ ] Tüm sorgular tenant-filtreli + sayfalı
- [ ] Sezona bağlı sorgular aktif sezon eksenli
- [ ] Hard-delete yok → pasife alma
- [ ] Durum değişiklikleri yapılandırılmış audit logu üretir

### Örnek audit log standardı

```csharp
_logger.LogInformation(
    "{Class}.{Method}: {Entity} {EntityId} status changed {From}->{To} by {ActorUserId}",
    nameof(SuspendUserHandler), nameof(Handle),
    "account", targetUserId, previousStatus, newStatus, actorUserId);
```

Loglar Serilog → Elasticsearch/Kibana üzerinden "kim kimi/neyi ne zaman değiştirdi" denetimini doğrudan verir.
