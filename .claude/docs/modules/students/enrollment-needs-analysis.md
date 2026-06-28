# Öğrenci Kayıt İşlemleri — İhtiyaç Analizi + Altyapı Uygunluk (Gap) Analizi

> Danışmanlık + kod tabanı incelemesi çıktısı. **Spec değildir**, spec/brainstorming
> öncesi karar zeminidir. Bağlayıcı tasarım kararları `.claude/specs/` altına ve
> `business-rules.md`'ye işlendiğinde bu dosya onlara referans verir.
>
> **Oluşturma:** 2026-06-28 · **Kapsam:** yeni kayıt, kayıt yenileme, nakil, dönem geçişi
> · **İlişkili:** `domain-model.md`, `business-rules.md` (BR-students-001), `identity`,
> `parents`, `academic-years` modülleri.

---

## 1. Gerçek hayatta kayıt süreçleri (saha)

Özel okulda "kayıt" tek bir olay değil, **birbirinden ayrı 4-5 iş akışıdır**. En sık
yapılan tasarım hatası bunları tek "öğrenci ekle" formuna sıkıştırmaktır.

### a) Yeni öğrenci kaydı (admission) — iki aşamalı
1. **Aday / başvuru (ön kayıt):** görüşme/sınav/mülakat, kontenjan tutma. Öğrenci
   henüz "okulun öğrencisi" değil — **adaydır**; kesin sınıf/numara/hesap yok.
2. **Kesin kayıt:** sözleşme + peşinat + evrak (nüfus, sağlık raporu, diploma/tasdikname,
   aşı kartı, foto). Bundan sonra öğrenci aktifleşir, numara verilir, şubeye yerleşir,
   veli hesabı açılır.

### b) Kayıt yenileme (re-enrollment) — en kritik, en çok ihmal edilen
Her yıl Nisan-Haziran'da mevcut velilere "gelecek yıl devam?" sorulur. Veli onaylar →
ücret/sözleşme yenilenir → öğrenci bir üst sınıfa terfi eder. İki işlem karışır:
- **Terfi (promotion):** akademik/idari, "5'ten 6'ya" (otomatik/toplu).
- **Kayıt yenileme:** ticari/iradi, "veli gelecek yıl için taahhüt verdi"
  (yeniler / kararsız / ayrılıyor).

### c) Nakil — gelen & giden
- **Gelen:** başka okuldan, e-Okul/tasdikname, ara sınıfa yerleştirme, eksik dönem notu.
- **Giden:** ilişik kesme, evrak iadesi → öğrenci **arşivlenir, silinmez** (geçmiş not/
  devamsızlık korunur).

### d) Dönem içi geç kayıt & şube değişikliği
Yıl başladıktan sonra gelen öğrenci, veya talep/disiplinle A→B şube geçişi.

### Klasik sistem sancıları
| Sancı | Sebep |
|---|---|
| Mükerrer kayıt | TCKN tekilliği zorlanmıyor |
| Kardeş velisi iki kez giriliyor | Veli, öğrenciye bağlı alt-kayıt sanılıyor |
| Boşanmış aile / vasi modellenemiyor | Tek "veli" alanı, çoklu ilişki yok |
| Öğrenci silinince geçmiş uçuyor | Arşiv yerine hard delete |
| Yıl geçişinde numara/sınıf karışır | Enrollment sezona bağlı tutulmuyor |
| Aday verisi aktifi kirletir | Yaşam döngüsü durumu yok |
| Evrak Excel'de | Belge/checklist modeli yok |

---

## 2. OKSİS'ten beklentiler (kabul kriterleri)

1. **Kişi ≠ rol ayrımı** — bir insan aynı anda veli + personel olabilir; veli bağımsız kişi.
2. **Yaşam döngüsü** — Aday → Davetli → Aktif → Mezun/Nakil/Arşiv; aday verisi aktifi kirletmez.
3. **Sezona bağlı kayıt (enrollment)** — "2024-25'te 5/A, 2025-26'da 6/B" tarihsel okunur; geçmiş silinmez.
4. **Terfi ≠ kayıt yenileme** — ayrı tutulur; yenileme niyeti izlenir.
5. **Çoklu veli + yetki bayrakları** — anne/baba/vasi; bilgi görür / karar verir / ödeme sorumlusu / teslim alabilir.
6. **Mükerrer önleme** — TCKN bazlı tekillik, tenant-scoped.
7. **Hesap açma = davet akışı** — şifre elle değil; veli/öğrenci davet linkiyle aktive eder (KVKK onayı).
8. **Çok kiracılı izolasyon** her satırda.

---

## 3. Mevcut altyapı (kod gerçekliği — 2026-06-28)

Çekirdek beklenenden olgun. Doğrulanan yapılar:

### Kimlik çekirdeği (`identity` / `users`, ~%60)
- **`Person`** = gerçek kişi (TCKN hash+şifreli, ad, doğum, cinsiyet, foto, birincil
  e-posta/telefon) + **`PersonLifecycleState`**: `Draft, Invited, Active, Suspended,
  Graduated, Transferred, Archived` → **aday/yaşam döngüsü altyapısı VAR**.
- **`Profile` (TPH, abstract)** → `StudentProfile / TeacherProfile / ParentProfile /
  StaffProfile`. Bir Person **çok profil** taşır → kişi-rol ayrımı VAR.
  - `StudentProfile`: `StudentNumber`, `CurrentClassroomId`, `EnrollmentDate`, `IsActiveStudent`.
- **`ParentStudentRelationship`** (ayrı aggregate, many-to-many): `RelationType`
  (Anne/Baba/Vasi/Diğer) + yetki bayrakları (`CanViewInfo, CanMakeDecisions,
  IsPaymentResponsible, CanPickup, IsPrimaryContact`) + `ValidFrom/Until` + revoke
  (soft delete) → çoklu veli/vasi VAR.
- **`Account`** (login) Person'a 1-1 unique FK; şifre, kilitleme, refresh rotation.
  **TCKN hash unique** (`ux_persons_national_id_hash`) → mükerrer önleme VAR.
- **Davet sistemi tam:** `Invitation` state machine + `CreateInvitation` /
  `BulkCreateInvitation` / `RevokeInvitation` + Email/SMS/WhatsApp kanalları + `accept`
  ucu + KVKK consent versiyonu → hesap açma akışı VAR.

### Sınıf yerleştirme & geçiş (`AcademicSessions`)
- **`ClassRoomStudent`** tarihsel defter (`AssignedAt/LeftAt/Reason`: Initial, Transfer,
  Graduation, Archive, NewEnrollment) — silme yok, kapatma var (BR-AS-011).
- Komutlar: `AssignStudentToClassRoom`, `TransferStudent`, `RemoveStudentFromClassRoom`,
  `PromoteStudents` (sezon aktivasyonunda toplu terfi + terminal sınıf mezuniyeti).
- `StudentClassroomSyncInterceptor` → `CurrentClassroomId` aynası transaction içinde
  otomatik (drift imkânsız, BR-students-001).
- `CreatePerson` (başlangıç profiliyle) ve `CreateRelationship` komutları **var**.

### Web (`oksis-web`)
- Admin "Öğrenciler" ekranı mevcut (liste/KPI/drawer 7 sekme/filtre, sezon ekseni).
  Enroll / AssignClass / Promote / Edit aksiyonları **mock-fallback + "D" rozeti** ile
  (backend ucu açılınca otomatik gerçeğe döner — `attemptRealThenMock`).

---

## 4. Gap analizi

### Hazır olanlar
| Yetenek | Durum | Nerede |
|---|---|---|
| Kişi-rol ayrımı, çoklu profil | ✅ | `Person` + `Profile` (TPH) |
| Yaşam döngüsü (aday→aktif→arşiv) | ✅ altyapı | `PersonLifecycleState` |
| Çoklu veli + yetki + vasi | ✅ | `ParentStudentRelationship` |
| Mükerrer önleme (TCKN) | ✅ | `ux_persons_national_id_hash` |
| Hesap açma / davet / KVKK | ✅ | `Invitation` + kanallar |
| Sınıfa yerleştirme / transfer / geç kayıt | ✅ | AcademicSessions komutları |
| Tarihsel atama defteri | ✅ | `ClassRoomStudent` |
| Toplu terfi (yıl geçişi) | ✅ | `PromoteStudents` |

### Boşluklar (öncelik sıralı)
| # | Eksik | Etki | Zorluk |
|---|---|---|---|
| **G1** | **Students orkestrasyon komutu yok.** Sadece `PromoteStudents`; `EnrollStudent`/`UpdateStudent` ve `/api/v1/students` boş. Web mock+"D". Eldeki parçalar (CreatePerson + Assign + Relationship + Invite) tek akışta orkestre edilmemiş. | Yüksek | Orta |
| **G2** | **"Kayıt türü" kavramı yok.** Yeni / nakil-gelen / yenileme ayrımı modellenmemiş (sadece akademik atama `Reason` var). | Yüksek | Orta |
| **G3** | **Sezona bağlı `Enrollment` kaydı yok.** Enrollment = "sezon + sınıf ataması" türetiliyor; ayrı `StudentEnrollment` (öğrenci × sezon: kayıt tarihi/türü/durumu/no) yok. `GetEnrollmentHistory` mock. | Orta-Yüksek | Orta |
| **G4** | **Kayıt yenileme akışı yok.** `PromoteStudents` idari toplu terfi; veli iradesi (yeniler/kararsız/ayrılıyor) + ticari yenileme yok. | Orta | Orta |
| **G5** | **Aday/başvuru (admission) hunisi yok.** `Draft` var ama başvuru→değerlendirme→kontenjan→kesin kayıt akışı modellenmemiş. | Orta (MVP dışı olabilir) | Yüksek |
| **G6** | **Belge/evrak takibi yok.** Sadece `ProfilePhotoUrl`; checklist/yükleme yok. | Düşük-Orta | Orta |
| **G7** | **Öğrenci no üretim politikası yok.** `StudentNumber` alan var; otomatik üretim/format kuralı tanımsız. | Düşük | Düşük |
| **G8** | **Legacy `User` ↔ `Account`/`Person` çakışması.** İki paralel kimlik modeli; sınır netleşmemiş. | Risk (önkoşul) | Karar işi |
| **G9** | **Ücret/sözleşme/finans yok.** Kesin kayıt + yenilemenin ticari bacağı. | MVP dışı | Yüksek |

### Sonuç
> **Altyapı kayda hazır mı?** Çekirdek **~%75 hazır.** Zor parçalar (kişi-rol ayrımı,
> çoklu veli, yaşam döngüsü, TCKN tekilliği, davet/hesap açma, tarihsel sınıf atama, toplu
> terfi) **mevcut ve olgun.** Eksik olan çoğunlukla **orkestrasyon + idari kabuk** (G1-G4):
> parçaları "yeni öğrenci kaydet / kayıt yenile / nakil al" akışlarına bağlayan komut katmanı.

### Önerilen sıra (MVP odaklı)
1. **G8** — `User` vs `Account`/`Person` sınırını karara bağla (önkoşul).
2. **G1 + G3** — `EnrollStudent` orkestrasyon komutu + sezona bağlı `Enrollment` kaydı.
3. **G2** — kayıt türünü `Enrollment` alanı olarak ekle (Yeni / Nakil / Yenileme).
4. **G4** — yenileme akışını terfiden ayır.
5. **G5 / G6 / G9** — MVP sonrası; `mvp-guard` ile kapsam teyidi.

---

## 5. Açık sorular (spec'e taşınacak)
- Aday/başvuru süreci MVP'de mi? (G5)
- `Enrollment` ayrı entity mi, yoksa `ClassRoomStudent` + `StudentProfile` türevi mi yeter? (G3)
- Öğrenci no formatı/üretimi okul ayarı mı, sistem sabiti mi? (G7)
- `User` legacy entity ne zaman emekli edilecek? (G8)
- Belge checklist'i MVP'de mi, ayrı modül mü? (G6)

> ⚠️ Bu işe başlamadan `.claude/specs/` altında kayıt/enrollment bağlayıcı spec'i olup
> olmadığı kontrol edilmeli (Absolute Rule #6). Spec varsa numaralı maddeleri esastır.
