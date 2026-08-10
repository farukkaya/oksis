# Business Rules

> OKSİS'in **ürün davranış kurallarını** sabitler. AI feature yazarken bu kuralları default kabul eder. Aksini sadece kullanıcı açıkça istediğinde uygular.

---

## 1. Yoklama (Attendance)

- **3 tıklama prensibi**: Öğretmen yoklamayı 3 adımda almalı.
  1. Ders / saat seç (varsayılan: o anki saat)
  2. Sınıf otomatik gelir (varsayılan: programdan)
  3. "Tümü gelmiş" varsayılan; sadece **gelmeyenler işaretlenir**
- Yoklama statüleri: `Present`, `Absent`, `Late`, `Excused`. (Sadece bu 4'ü)
- Yoklama **gün içinde** alınmalıdır; geçmiş güne yoklama girişi **sadece okul yönetimi** rolünde.
- Aynı ders saatine ikinci kez yoklama girilemez → **upsert**, ilk kaydeden sorumlu, sonraki düzenleme = audit log + revize statüsü.
- Yoklama alındığında:
  - `AttendanceTakenEvent` publish edilir.
  - **Devamsızlık eşiği aşan öğrencilerin velilerine** otomatik push (varsayılan eşik: dönem başına 5 günden fazla — okul ayarlanabilir).
- Geç gelen (`Late`) öğrenci → devamsızlık olarak sayılmaz, ancak haftalık dijest'te raporlanır.
- **İzinli (`Excused`)** → veli/öğrenci belge yüklemiş olmalı (opsiyonel, MVP'de zorunlu değil).

---

## 2. Not (Mark)

- Not statüleri: `Draft` (taslak) → `Published` (yayında) → `Locked` (kilitli, dönem sonu).
- **Taslak için bildirim GİTMEZ.** Sadece `Published` olduğunda veli + öğrenci push alır.
- Bir not bir kez yayınlandıktan sonra **değiştirilebilir**; değişiklikte:
  - Yeni "düzeltme" push'u (cooldown: aynı not 24 saatte max 2 değişiklik bildirimi).
  - Audit log: kim, ne zaman, eski değer, yeni değer.
- Not skalası okul bazlı yapılandırılır (varsayılan: 0–100, sözel: AA/BA/BB/CC/DC/DD/FF).
- **Yıl sonu kilitleme**: dönem kapanınca `Locked` olur; sadece okul yönetimi açabilir (audit ile).
- **Karne (ReportCard)**: dönem kapanınca otomatik üretilir, PDF olarak velinin app'inde görünür.

---

## 3. Ödev (Homework)

- Ödev oluşturulduğunda:
  - Hedef: sınıf bazlı veya öğrenci bazlı atama.
  - Teslim tarihi zorunlu; **min 1 gün sonrası**.
  - Dosya ekleme opsiyonel (max 10 MB, ALLOWED: pdf, doc, docx, jpg, png, mp4).
- Bildirim:
  - Oluşturulduğunda → öğrenci + veli push.
  - Teslim tarihinden **24 saat önce** → hatırlatma push (öğrenci'ye).
  - Teslim tarihi geçince ve teslim edilmediyse → veli'ye push (`HomeworkOverdueEvent`).
- Öğrenci teslim ettiğinde → öğretmene push.
- Not verildiğinde → öğrenci + veli push.

---

## 4. Veli (Parent) — Çoklu Çocuk

- Bir veli **birden fazla öğrencinin velisi** olabilir (kardeşler).
- Bir öğrencinin **birden fazla velisi** olabilir (anne, baba, vasi).
- Veli login olduğunda **çocuk seçici** (child switcher) UI'da her zaman üstte.
- "Tüm çocuklarım" toplu görünüm bazı modüllerde desteklenir (duyuru, mesaj). Yoklama / not gibi yerlerde tek çocuk seçili olmalı.
- Veli-öğrenci bağlantısı `StudentParent` join entity üzerinden (`Relationship` enum: `Mother`, `Father`, `Guardian`).
- **Veli onayı zorunlu işlemler**: ödeme, izin belgesi, kantin kart limiti (MVP'de yok).

---

## 5. Devamsızlık Eşiği

- Varsayılan eşik: **dönem başına 5 tam gün**. Okul bazlı yapılandırılır (1–60 arası).
- Geç kalma 3 kez = 1 yarım gün devamsızlık (varsayılan, okul ayarlanabilir).
- Eşik aşıldığında:
  1. **Push to veli**: "5. devamsızlığa ulaşıldı."
  2. Yönetim dashboard'unda **kırmızı flag**.
  3. Eşik aşıldıktan sonra her ek devamsızlıkta da bildirim (haftalık dijest).
- Resmi tatil ve okul tatilleri yoklama dışında — `AcademicYear.Holidays` tablosu ile yönetilir.

---

## 6. Mesajlaşma (Messaging)

- **Veli ↔ Öğretmen**: ✅ açık (varsayılan).
- **Öğrenci ↔ Öğretmen**: ⚠️ varsayılan **KAPALI**. Okul yönetimi açabilir; veli bireysel öğrenci için kapatabilir (opt-out).
- **Öğrenci ↔ Öğrenci**: ❌ varsayılan **KAPALI**. MVP'de yok.
- **Veli ↔ Veli**: ❌ Hiç yok. (Sadece toplu duyuru var.)
- Mesajlar arşivlenebilir, silinemez (audit/yasal).
- Mesajlaşma çalışma saatleri dışında ayarlanabilir (örn. 22:00–07:00 arası push ertelenir; mesaj kaydedilir).
- **Spam koruması**: aynı kullanıcıdan 1 dakikada 10'dan fazla mesaj = rate limit.

---

## 7. Duyuru (Announcement)

- Hedefleme:
  - Okul geneli (tüm portallar)
  - Belirli sınıf seviyesi (örn. 5. sınıflar)
  - Belirli şube (örn. 5-A)
  - Belirli rol (sadece veliler / sadece öğretmenler)
- Zamanlı yayın (`PublishAt` future tarihi destekler).
- Süre bitişi (`ExpiresAt`) opsiyonel; bitince duyuru pasif olur ama silinmez.
- Yayınlandığında push (yöneticinin tercihine göre: anında / sessiz).
- Yeniden gönderim yok; duyuru güncelleneceği zaman yeni duyuru oluşturulur (audit).

---

## 8. Kullanıcı / Hesap

- E-posta unique (tenant scope'ta DEĞİL — global unique. Sebep: kullanıcı birden fazla okula bağlanabilir teorik olarak; MVP'de tek okul).
- Şifre kuralı: min 8 karakter, en az 1 büyük harf, 1 rakam.
- **2FA opsiyonel** (MVP'de SMS değil, e-posta ile OTP). Yönetim için zorunlu yapılabilir.
- Hesap kilitleme: 5 başarısız login → 15 dk lock.
- Şifre sıfırlama: e-posta üzerinden token (1 saat geçerli).
- **İlk login'de şifre değiştirme** zorunlu (yönetim tarafından oluşturulan hesaplarda).
- **Kullanıcı silme** = soft delete + tüm session'lar revoke + audit log.

---

## 9. Tenant (Okul) Yaşam Döngüsü

- Statüler: `Setup` → `Active` → `Suspended` → `Archived`.
- `Setup`: yeni okul, ilk admin login etmeden önce. Sadece kurulum sihirbazı erişilebilir.
- `Active`: normal kullanım.
- `Suspended`: lisans/ödeme problemi. Read-only erişim, kullanıcılar bilgilendirme banner'ı görür.
- `Archived`: hesap kapandı. Veri 6 ay tutulur, sonra hard delete (KVKK uyumu).
- Tenant `Suspended` ya da `Archived` ise: tüm yazma işlemleri **403 Forbidden**.

---

## 10. Sezon (AcademicYear) Yönetimi

- Bir okulun aktif **tek bir** `AcademicYear`'ı olur (`IsCurrent = true`).
- Yıl geçişi sihirbazı:
  - Mevcut sezonu kapat
  - Yeni sezon başlat
  - Sınıfları **bir üst seviyeye taşı** (5-A → 6-A) veya kullanıcı manuel
  - Mezunlar → `Status = Graduated`
  - Yeni sezon için ders programı, dönem tarihleri set edilir
- Geçmiş sezon verisi read-only; sadece görüntülenir.

---

## 11. Bildirim Cooldown ve Sessiz Saatler

- Aynı entity için aynı kullanıcıya **5 dakikada max 1 push** (örn. aynı not 5 dk içinde 3 kez değiştirilirse 1 push gider).
- **Sessiz saatler**: 22:00–07:00 (kullanıcı zaman dilimi). Bu saatlerde:
  - **Kritik** bildirimler hemen gönderilir (örn. acil duyuru flag'i).
  - **Normal** bildirimler 07:00'de dijest olarak.
- Detay: `notification-matrix.md`, `notification-priority.skill`

---

## 12. Veri Bütünlük Kuralları

- **Bir şubede aynı T.C. kimlikli iki öğrenci olamaz.** (Tenant scope, unique constraint)
- **Bir öğretmen aynı saatte iki sınıfa yoklama alamaz.** Ders programı çakışması engellenir.
- **Bir öğrenci aktif sezonda tek bir şubeye atanır.** Şube değişikliği = audit log.
- **Silinmiş kullanıcı yeniden kayıt olabilir** (yeni Id; eski Id soft-deleted kalır).
- **Karne yayınlandıktan sonra not değişikliği = düzeltme** (revize karne otomatik üretilir).

---

## 13. KVKK / Veri Saklama

- Mezun öğrenci verisi **5 yıl** saklanır.
- Veli, kendi verisini ve çocuğunun verisini **export** edebilmeli (`GET /api/v1/me/data-export` → JSON).
- Veli, hesabını silme talebi yapabilir (manuel onay süreci, MVP'de form üzerinden).
- Audit log **silinemez** (soft delete dahil).
