# Kullanıcı Yönetimi — Açık Sorular

> Henüz cevaplanmamış, takım kararı bekleyen veya araştırılması gereken konular. Karar verilince **diğer ilgili dosyaya taşınır** ve buradan silinir.

> Numara konvansiyonu: `OQ-users-{NNN}`. Diğer dosyalarda bu numaralarla atıfta bulunulur.

---

## OQ-users-001: Sezon geçişinde rol atamaları default olarak kopyalansın mı?

**Soru:** Yeni bir sezon (`Season`) açıldığında, önceki sezonun `RoleAssignment` kayıtları yeni sezona otomatik olarak kopyalansın mı? Yoksa SchoolAdmin'in açıkça "Aktar" butonuna basması mı gereksin?

**Bağlam:** Bir öğretmen büyük ihtimalle yeni sezonda da öğretmen olarak devam edecek. 200 öğretmen + 100 personeli her sezon manuel atamak operasyonel yüktür. Ancak otomatik kopyalama, bu sezon ayrılmış bir öğretmenin yanlışlıkla yeni sezonda hâlâ atanmış görünmesine yol açabilir.

**Seçenekler:**

- **A) Otomatik kopyala (default), kullanıcı isterse iptal eder**
  - Artısı: Operasyonel kolaylık; %95'lik vaka için doğru çalışır.
  - Eksisi: İşten ayrılan personel sezona kopyalanabilir; manuel temizlik gerekir.

- **B) Manuel onay zorunlu — yöneticiye "Önceki sezondaki şu kişileri yeni sezona aktar" wizard'ı sun**
  - Artısı: Veri temizliği zorunlu hale gelir; her transferin audit izi olur.
  - Eksisi: Sezon açılış yükü artar; 300 kişi için kaydırarak onaylama yorucu.

- **C) Hibrit — `TerminatedAt = null` olan personel otomatik, `TerminatedAt != null` olanlar atlanır; öğrenciler sınıf bilgisine göre `classrooms` modülünden gelir (zaten oradan oluşur)**
  - Artısı: Akıllı default; veri zaten doğru ise iş yapma.
  - Eksisi: `TerminatedAt` doğru güncellenmemişse yine yanlış kopyalanır — veri kalite riski.

**Bağımlılıklar:** `seasons` modülünün sezon açma akışı; `RoleAssignment.Status = Inactive` geçişinin kim tarafından tetikleneceği.

**Etkilenecek dosyalar:**
- `business-rules.md` — BR-users-004
- `seasons/` modülü dokümantasyonu
- `domain-model.md` — `RoleAssignment` davranışları

**Sorulacak kişi(ler):** Pilot okul operasyon müdürü (gerçek sezon geçişi yaşayan biri).

**Hedef karar tarihi:** Sprint 3 planlama toplantısı.

---

## OQ-users-002: 13 yaş altı öğrencinin profil değişiklikleri veli onayına gitsin mi?

**Soru:** `StudentProfile` sahibi öğrenci 13 yaşından küçük olduğunda, kendi hesabıyla yaptığı profil değişiklikleri (örn. telefon, fotoğraf) doğrudan kaydedilsin mi yoksa **`IsPrimaryContact = true` velinin onayını** bekleyen taslak (pending change) olarak mı tutulsun?

**Bağlam:** KVKK + Çocuk Koruma yasal bağlamı: 13 yaş altı çocuğun açık rızası geçerli sayılmaz, ebeveyn onayı gerekir. Ancak bu sistemde fazladan bir "PendingChange" katmanı her profil alanı için karmaşa getirir. Diğer yandan veli haberi olmadan çocuğun yanlış telefon girmesi de problem.

**Seçenekler:**

- **A) Yaş eşiği yok — herkes kendi profilini özgürce düzenler, sadece hassas alanlar (TCKN, doğum tarihi) zaten kilitli**
  - Artısı: Basitlik. Bugünkü `MyProfilePage` tasarımı.
  - Eksisi: KVKK denetimi soru sorabilir.

- **B) 13 yaş altı için tüm değişiklikler `PendingProfileChange` tablosuna gider, veli onaylar**
  - Artısı: Hukuki olarak en güvenli.
  - Eksisi: 13 yaş altı çocukların login'i de tartışmaya açık; pratikte küçük öğrenci direkt giriş yapmaz (veli üzerinden).

- **C) 13 yaş altı çocuk hesabı yok (zaten BR-users-001 `IsActiveStudent = false` ile çözülüyor), 13+ için kendi düzenler**
  - Artısı: Net çizgi; pendingChange katmanı gerekmez.
  - Eksisi: 13-18 yaş arası "küçük" tanımı yine var; ama bu yaşlardaki çocuk medeni hukuk bakımından çok daha bağımsız.

**Bağımlılıklar:** `identity` modülünün login akışındaki yaş kontrolü; KVKK hukuki danışmanlık.

**Etkilenecek dosyalar:**
- `business-rules.md` — yeni BR-users-011 olarak eklenecek
- `ui-flows.md` — `MyProfilePage` rol matrisi
- `domain-model.md` — gerekirse `PendingProfileChange` entity'si

**Sorulacak kişi(ler):** Hukuk danışmanı + ürün sahibi.

**Hedef karar tarihi:** Sprint 5 (KVKK sprint'i) öncesi.

---

## OQ-users-003: `ConsentBundle` metni nerede saklanacak?

**Soru:** Her `ConsentRecord` bir `BundleVersion` referansı taşır (örn. `v2026.05.01`), ancak o versiyondaki **aydınlatma metninin kendisi** (HTML/PDF içeriği) henüz şemada yok. Nerede saklanmalı?

**Bağlam:** `consent_records.evidence_hash` o anki içeriğin SHA-256 hash'i; ancak içerik bizde değilse "kullanıcı şu metne onay verdi" diyemiyoruz. KVKK denetiminde içerik + hash karşılaştırması istenir. Ayrıca SchoolAdmin yeni versiyon yayınlamak için bir UI ister.

**Seçenekler:**

- **A) Yeni tablo: `consent_bundle_versions(id, school_id, version, html_content, pdf_url, published_at, retired_at, hash)`**
  - Artısı: İçerik versiyonlanır, audit zinciri tam.
  - Eksisi: Yeni tablo + admin yayın akışı (CRUD).

- **B) Markdown dosyaları repo'da (`content/consent-bundles/v2026.05.01.md`), DB sadece version + hash tutar**
  - Artısı: Source control'lü, code review'dan geçer.
  - Eksisi: Multi-tenant — her okulun kendi metni olabilir (özellikle özel okullar farklı isteyebilir); repo'da olamaz.

- **C) S3 / blob storage'da PDF, DB sadece URL + hash tutar**
  - Artısı: Hukuk metni PDF formatında zaten tutuluyor.
  - Eksisi: Multi-tenant izolasyon ve linklerin kalıcılığı sorunu; archive policy.

**Bağımlılıklar:** Multi-tenant onay akışı; pilot okul KVKK metinleri.

**Etkilenecek dosyalar:**
- `database-schema.md` — yeni tablo şeması
- `domain-model.md` — `ConsentBundleVersion` aggregate (gerekiyorsa)
- `api-contracts.md` — bundle yayınlama endpoint'leri
- `permissions.md` — `consents.manage` neyi kapsıyor

**Sorulacak kişi(ler):** Hukuk danışmanı + DevOps.

**Hedef karar tarihi:** Sprint 5.

---

## OQ-users-004: KVKK retention süresi ne olacak?

**Soru:** `LifecycleState = Archived` olan Person'lar ne kadar süre DB'de kalsın? Tam anonimleştirme (PII silme) ne zaman, hangi job ile yapılsın?

**Bağlam:** KVKK Madde 7 (silme/yok etme/anonim hale getirme) kişisel verinin amacı ortadan kalktığında veri sorumlusu için bir yükümlülük. Eğitim sektöründe diploma/sertifika doğrulama gibi sebeplerle 10 yıl saklama yaygın; ancak hassas veriler (sağlık, fotoğraf) için süre daha kısa olmalı.

**Seçenekler:**

- **A) Tek tip retention: 10 yıl, sonra full anonimleştirme**
  - Artısı: Basit.
  - Eksisi: Hassas veri için fazla uzun.

- **B) Katmanlı retention:**
  - Akademik kayıt (notlar, devamsızlık, diploma): 10 yıl
  - İletişim bilgileri (email, phone, address): 1 yıl
  - Sağlık + acil iletişim: 6 ay
  - Fotoğraflar: 3 yıl (galeri için, sonra anonimleştir)
  - Eksisi: Karmaşık; her veri türü için ayrı job + kural.

- **C) Tenant-config — her okul kendi politikasını seçer (`SchoolSettings.RetentionPolicy`)**
  - Artısı: Esnek; farklı okullarımız farklı isteyebilir.
  - Eksisi: Default belirleyici lazım; yanlış config = KVKK ihlali.

**Bağımlılıklar:** Hukuk danışmanlığı; `audit` modülünün retention'ı (ayrı olabilir); `seasons` ile akademik kayıt bağı.

**Etkilenecek dosyalar:**
- `business-rules.md` — yeni BR-users-012 retention
- `database-schema.md` — `account_lifecycle_events` ve `persons` üzerinde retention job tasarımı
- `notifications.md` — anonimleştirme bildirimleri (gerekirse)

**Sorulacak kişi(ler):** Hukuk danışmanı + pilot okul müdürü.

**Hedef karar tarihi:** Sprint 5–6.

---

## OQ-users-005: Yabancı uyruklu öğrenci/öğretmen için kimlik numarası alanı?

**Soru:** TCKN yerine **yabancı kimlik numarası** (Y.K.N.) veya pasaport numarası taşıyan kişiler için domain modeli nasıl olacak? `national_id_hash` ve `national_id_encrypted` aynı şekilde mi kullanılsın yoksa ayrı alan mı?

**Bağlam:** Özel okullar yabancı uyruklu öğrenciler ve uluslararası öğretmen alır. Bu kişilerin 99-ile başlayan Yabancı Kimlik Numarası vardır (TCKN algoritmasından geçer ama anlamsal olarak farklıdır), bazıları sadece pasaport numarası taşır. Aynı alan kullanılırsa validation algoritması karışır.

**Seçenekler:**

- **A) Aynı `nationalId` alanı, ek bir `idType` enum (`Tckn`, `Ykn`, `Passport`) ile**
  - Artısı: Tek alan, basit schema.
  - Eksisi: Validation `idType`'a göre dallanır; arama yapılırken karışıklık ihtimali.

- **B) Ayrı `foreignIdNumber` alanı (`varbinary(256)` encrypted) ve `passport_number`, `passport_country`**
  - Artısı: Açık anlam, ayrı validation pipeline.
  - Eksisi: 3 farklı alan, hangisinin dolu olduğu logic'i her yerde.

- **C) `IdentityDocument` value object: `{ Type, Number, IssuingCountry }`**
  - Artısı: Domain'de doğru abstraction.
  - Eksisi: Tek satır + JSON ya da ayrı tablo; arama performansı düşebilir.

**Bağımlılıklar:** Pilot okul yabancı öğrenci sayısı/profili.

**Etkilenecek dosyalar:**
- `domain-model.md` — `Person` veya yeni VO
- `database-schema.md` — yeni kolonlar veya tablo
- `business-rules.md` — BR-users-008 güncellenecek

**Sorulacak kişi(ler):** Pilot okul kayıt birimi.

**Hedef karar tarihi:** Sprint 4.

---

## OQ-users-006: Cross-tenant `MasterIdentity` katmanı eklenecek mi?

**Soru:** Aynı kişi (TCKN'i aynı) farklı okullarda farklı `Person` kayıtları taşıyor — bu BR-users-009 ile kabul edildi. Ancak SuperAdmin "Bu öğretmen 3 okulda da var" diyebilmek isteyebilir. Bunun için bir master tablo katmanı (`master_identities`) eklenmeli mi?

**Bağlam:** Şu anki yapı multi-tenant güvenli ama cross-tenant raporlama için bilgi kayıp. Bir master `Identity` katmanı şu kullanımları açar:
- SuperAdmin: "Bu kişi platformdaki kaç okulda kullanıcı?"
- Tek SSO: aynı email ile her okula tek hesapla giriş
- Cross-school veri transferi (öğrenci nakil)

**Seçenekler:**

- **A) Şimdilik **eklenmesin** — multi-tenant izolasyonunu koru, SuperAdmin paneli sadece tenant-içi**
  - Artısı: Minimum scope, izolasyon net.
  - Eksisi: Gelecekte schema refactor olur.

- **B) `master_identities` master tablosu (`Id, NationalIdHashCrossTenant?, Email?`) + `Person.MasterIdentityId` FK**
  - Artısı: Cross-tenant raporlama, SSO altyapısı.
  - Eksisi: Multi-tenant izolasyon karmaşıklaşır; master tabloya leak riski; cross-tenant hash için ayrı salt politikası gerek.

- **C) Sadece SuperAdmin sorgularında **çalışma zamanında** TCKN hash karşılaştırması yap, kalıcı bağ tutma**
  - Artısı: Schema'ya dokunmaz.
  - Eksisi: TCKN hash tenant-bağımlı salt kullanıyor → karşılaştırma yapılamaz (BR-users-008 ile çatışır). Salt yapısı değişmeli.

**Bağımlılıklar:** SuperAdmin portal kapsamı; SSO roadmap'i.

**Etkilenecek dosyalar:**
- `domain-model.md` — yeni master entity (`identity` modülünde olabilir)
- `database-schema.md`
- `business-rules.md` — BR-users-008 (hash salt politikası) ve BR-users-009 (tenant izolasyonu)

**Sorulacak kişi(ler):** Ürün sahibi + güvenlik mimarı.

**Hedef karar tarihi:** Post-MVP roadmap.

---

## OQ-users-007: `ParentProfile.Address` zorunlu mu olmalı?

**Soru:** Bir Person `ParentProfile` taşıdığında, adres bilgisi zorunlu mu olsun? Şu an `domain-model.md`'de tüm address alanları `nullable`.

**Bağlam:** Veli adresi çoğunlukla okulun mektup, fatura veya yıllık yollaması için kullanılır. Ancak günümüzde her şey dijital — adres gerekmeyebilir. Aynı zamanda boşanmış velilerin farklı adresleri vardır, bu farklılığı kim takip edecek?

**Seçenekler:**

- **A) Tamamen opsiyonel** (mevcut tasarım)
  - Artısı: Form daha kısa.
  - Eksisi: Fatura keserken adres yoksa muhasebe sorun yaşar.

- **B) `IsPaymentResponsible = true` ise zorunlu**
  - Artısı: İhtiyaca bağlı validation.
  - Eksisi: Form akışı dinamik validation gerektirir.

- **C) Tüm veliler için zorunlu, default = okul adresi**
  - Artısı: Veri her zaman var.
  - Eksisi: "Aynı okul" gibi dummy değerler oluşur, veri kalitesi düşer.

**Bağımlılıklar:** `billing` modülünün fatura kesim akışı.

**Etkilenecek dosyalar:**
- `business-rules.md` — yeni BR-users-013
- `domain-model.md` — `ParentProfile` invariant'ları
- `database-schema.md` — adres kolonları nullable mı

**Sorulacak kişi(ler):** Pilot okul muhasebe + billing modülü sahibi.

**Hedef karar tarihi:** Sprint 4.

---

## OQ-users-008: Mezun portal kapsamı bu modülde mi yer alacak?

**Soru:** `LifecycleState = Graduated` olan öğrenciler için ayrı bir "Mezun Portal" (alumni network, transcript indirme, vb.) düşünülüyor. Bu portal Users modülünün bir uzantısı mı yoksa ayrı modül mü?

**Bağlam:** Mezun öğrencinin profili kalır ama derslere/yoklamaya erişimi olmaz. Buna karşın transkript indirme, mezuniyet belgesi alma, alumni iletişimi gibi ihtiyaçlar var. Bu, ayrı bir izin matrisi + ayrı bir UI gerektirir.

**Seçenekler:**

- **A) Users modülünün uzantısı — `Graduated` state için özel UI'lar Users altında**
  - Artısı: Person aggregate'i aynı yerde, tekrarsız.
  - Eksisi: Users modülü zaten kalabalık; "mezun yönetimi" farklı bir iş alanı.

- **B) Ayrı `alumni` modülü, sadece Users'ı okur**
  - Artısı: Net scope; alumni'ye özel feature'lar (etkinlik, bağış, network) izole.
  - Eksisi: Cross-modül sınır net çizilmeli; veri ownership belirsizliği.

- **C) Şimdilik scope dışı — `Graduated` state işaretlenir ama portal MVP'de yok**
  - Artısı: MVP scope korunur.
  - Eksisi: Mezunların hesabına ne olacak sorusu yanıtsız kalır.

**Bağımlılıklar:** Ürün roadmap'i; pilot okul mezunlarla ilgili politika.

**Etkilenecek dosyalar:**
- `README.md` — kapsam dışı listesi
- `ui-flows.md` — `MyProfilePage` mezun davranışı

**Sorulacak kişi(ler):** Ürün sahibi.

**Hedef karar tarihi:** Post-MVP roadmap.

---

## OQ-users-009: Aynı Person'a birden fazla `Account` bağlanabilir mi?

**Soru:** Bir gerçek kişi sistem içinde tek `Person` ile temsil edilir (BR-users-002). Ancak login için **birden fazla credential** (örn. eski "veli" hesabı + yeni "öğretmen" hesabı) bağlanması mümkün mü olsun?

**Bağlam:** Bir kişi önce veli olarak kayıt oldu, sonra öğretmen olarak işe alındı. Şu an "tek Person, birden fazla profile, birden fazla RoleAssignment" diyoruz. Ama login credential tarafında ne olacak? Aynı email ile mi giriyor? Farklı email/parola taşıyabilir mi?

**Seçenekler:**

- **A) Tek Person ↔ Tek Account — Person'a yeni profile eklenir, aynı hesapla giriş yapar, rolleri menüye yansır**
  - Artısı: Basit; kullanıcı tek hesap yönetir.
  - Eksisi: Yanlışlıkla profil kontaminasyonu olabilir (örn. veli olarak login olup öğretmen menüsünde gezinme).

- **B) Tek Person ↔ Birden fazla Account — Her profil için ayrı hesap (örn. veli@example.com ve ogretmen@example.com)**
  - Artısı: Net iş ayrımı; "veli olarak girdim" demek mümkün.
  - Eksisi: Aynı kişi 2 parola hatırlar, UX kötü.

- **C) Tek Account + "Şu an hangi rol?" portal seçici (Microsoft hesabı tarzı)**
  - Artısı: Net rol bağlamı; tek login.
  - Eksisi: Geliştirilmesi karmaşık; her sayfa "aktif portal" context'i taşımak zorunda.

**Bağımlılıklar:** `identity` modülünün Account tasarımı; JWT claim yapısı.

**Etkilenecek dosyalar:**
- `domain-model.md` — `Person.LinkedAccountId` tek mi çok mu
- `identity/` modülü — Account-Person ilişkisi

**Sorulacak kişi(ler):** UX tasarımcısı + ürün sahibi.

**Hedef karar tarihi:** Sprint 3 (Person ↔ Account köprüsünden önce).

---

## OQ-users-010: Davet kabulü sırasında parola yerine OTP + sonradan parola kurma desteklenecek mi?

**Soru:** Şu anki tasarımda davet kabul akışının 4. adımı parola belirleme. Ancak veliler için "SMS OTP ile gir, sonra istersen parola belirle" akışı daha düşük friction olabilir mi?

**Bağlam:** Anneler/babalar telefon-merkezli kullanıcılar; mobil OTP onlar için tanıdık. Parola politikası (10 char + sembol vb.) onboarding'i yavaşlatabilir. Ancak parolasız login uzun vadede 2FA + güvenlik için olmaz.

**Seçenekler:**

- **A) Parola zorunlu — mevcut tasarım**
  - Artısı: Net güvenlik; standart akış.
  - Eksisi: %15-20 onboarding drop-off riski.

- **B) İlk login OTP ile, ilk login sonrası "Parola belirleyin" prompt'u**
  - Artısı: Hızlı onboarding; sonradan güvenlik.
  - Eksisi: Bir süre boyunca parolasız hesap = SMS güvenliğine bağımlılık.

- **C) Hibrit — opsiyon olarak parola, opsiyon olarak passwordless (magic link/OTP)**
  - Artısı: Kullanıcı seçer.
  - Eksisi: İki akışı paralel sürdürmek geliştirme yükü.

**Bağımlılıklar:** `identity` modülü auth akışı; SMS sağlayıcısı maliyeti; pilot okul kullanıcı profili.

**Etkilenecek dosyalar:**
- `ui-flows.md` — `InvitationAcceptPage` akışı
- `api-contracts.md` — `POST /invitations/accept` body
- `identity/` modülü — auth handler

**Sorulacak kişi(ler):** UX tasarımcısı + güvenlik mimarı + ürün sahibi.

**Hedef karar tarihi:** Sprint 4 (davet sprint'i).

---

## Karar Verilenler (Arşiv)

Bu bölümde, cevabı netleşmiş ancak henüz ilgili dosyaya taşınmamış sorular tutulur. Bir sonraki güncellemede ilgili dosyaya taşı, buradan sil.

_(Henüz arşivlenmiş karar yok.)_

---

## Soru Ekleme Konvansiyonu

Yeni açık soru eklenirken:

1. Bir sonraki sıralı numarayı al (`OQ-users-011`, `012`, ...).
2. Soru, bağlam, en az 2 seçenek (artı/eksi ile), bağımlılık, etkilenecek dosyalar, sorulacak kişi ve hedef tarihi doldur.
3. Karar netleşince → `Karar Verilenler (Arşiv)` bölümüne taşı.
4. Bir sonraki düzenlemede → ilgili kalıcı dosyaya (örn. `business-rules.md` veya `domain-model.md`) işle, arşivden sil.

> Açık sorular **canlı dokümandır**; commit edilirken her güncelleme `docs: OQ-users-NNN güncellendi/eklendi/kapatıldı` formatında bir mesajla geçer.
