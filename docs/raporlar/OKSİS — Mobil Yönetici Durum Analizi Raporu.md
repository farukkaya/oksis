# OKSİS — Mobil Yönetici Durum Analizi Raporu

> **Tarih:** 2026-10-05
> **Kapsam:** Okul Yöneticisi (`schoolAdmin`, mobilde `admin` rolü) mobil uygulamaya girdiğinde neleri yapabiliyor, neler yarım, neler hiç yok; "Yakında" envanteri; geliştirme sırası; bildirim gönderme/alma boşlukları
> **Hedef:** Mobilde "Yakında" ibaresi kalmadan, yöneticinin tüm ekran ve özelliklerinin doğru çalışması
> **Ölçüm tabanı:** `oksis-ui` @ `87514fb` (`feature/mobile-profile`) · `oksis-api` @ `c67fab14` (`feature/self-profile-photo-last-login`)
> **Yöntem:**
> 1. Uçtan uca ekran testi: Chrome'da Expo web (`localhost:8081`), telefon genişliği. Okul: Altınay Eğitim Kurumları (gerçek verili kayıt), yönetici hesabıyla. Test, 2026-10-05 00:17–00:45 arasında yapıldı.
> 2. API doğrulaması: aynı okulda yönetici, öğretmen, veli ve öğrenci hesaplarıyla `curl`.
> 3. Statik kod denetimi (UI + backend): her iddia dosya:satır düzeyinde.
>
> **Etiketler:**
> - **[Ekranda doğrulandı]**: tarayıcıda yaşandı.
> - **[API ile doğrulandı]**: gerçek uç çağrısıyla ölçüldü.
> - **[Kod]**: kod okumasıyla tespit edildi, çalıştırılmadı.
>
> **Öncül rapor:** [[OKSİS — Bildirim Altyapısı İnceleme Raporu]] (2026-09-10). Bu raporun §6'sı o raporun güncel ölçümüdür.

---

## 0. Yönetici özeti

Mobil yönetici uygulaması **izleme** tarafında büyük ölçüde hazır: duyurular, canlı yoklama özeti, öğrenci sorgu, etkinlikler, okul ayarları ve profil çalışıyor. **Karar ve aksiyon** tarafı ise neredeyse boş. Yöneticinin telefondan en çok yapması gereken işler mobilde yok:

- mazeret onayı,
- düzeltme talebi onayı,
- vekâlet ataması,
- yoklama girmeyen öğretmeni dürtme,
- gün içi izin,
- acil tatil (ör. kar tatili).

Bu işlerin hemen hepsinin **backend ucu ve `packages/api` hook'u hazır**. Eksik olan, mobil ekranların kendisi.

**Rakamlar:**

| Ölçü | Değer |
|---|---|
| Ekranı var ama hatalı çalışan (§4) | 5 yüksek · 13 orta · 17 düşük |
| **"Yakında" etiketi/hedefi** | **15**: 10'u dokunulabilir çıkmaz, 5'i salt gösterim |
| Yakında'dan yalnız UI işi olanlar (backend hazır) | 9 |
| Backend de isteyenler | 6 |
| Hiç düşünülmemiş / atlanmış ekran | 12 |
| Gereksiz / kaldırılması önerilen giriş | 4 |
| Yöneticinin aldığı bildirim tipi (43 tip içinde) | **3**. Hiçbiri push değil |
| Yöneticinin alması gerekip almadığı olay | 11 |
| Yönetici işleminden sonra gitmesi gerekip gitmeyen bildirim | 12 |

**En kritik beş madde:**

1. **"Onay bekleyen" kartı yanlış yere gidiyor** [Ekranda doğrulandı]. Kart "1 düzeltme talebi" gösteriyor. Dokununca duyuru onay kuyruğu açılıyor ve "Onay bekleyen duyuru yok" yazıyor. Yöneticinin bu talebi mobilde görme yolu yok.
2. **Backend "bugün"ü UTC'den hesaplıyor** [Ekranda + API ile doğrulandı]. Türkiye saatiyle 00:00–03:00 arasında öğrenci kartı "Bugün ders yok" diyor; oysa pano aynı şubeye 8 ders listeliyor. Duyuru detayı da 5 Ekim 00:19'da yayınlanan duyuruyu "4 Eki" gösteriyor. `IDateTimeProvider.Today` UTC tarihi döndürüyor ve 16 dosyada kullanılıyor.
3. **Yönetici velilere hedefli duyuru gönderemiyor** [API ile doğrulandı]. Yöneticinin hedef kitle seçeneklerinde kademe, seviye ve şube katmanları yalnız *öğrenci* kovası döndürüyor; kişi katmanı `null`. Örnekler:
   - Yönetici "12. sınıf velileri"ne duyuru atamıyor.
   - Yönetici "10-A" seçince duyuru yalnız 7 öğrenciye gidiyor, veliler almıyor.
   - Öğretmen ise "10-A velileri"ni seçebiliyor.
4. **Etkinlik bildirimleri ters işliyor** [API ile doğrulandı].
   - Etkinlik oluşturulunca sorumlu öğretmene hiçbir bildirim gitmiyor.
   - Veliye etkinlik henüz yapılmadan "katıldığı için izinli sayıldı" deniyor.
   - Etkinlik iptal edilince kimseye bildirim gitmiyor; veli çocuğunu hâlâ izinli sanıyor.
5. **Yöneticiye gelen 3 bildirim tipinin yalnız biri doğru ekrana iniyor** [Kod].
   - Devamsızlık limiti bildirimi yöneticiyi kendi "Devamsızlığım" (öğrenci) ekranına götürüyor.
   - Sınav görüşü bildirimi hiçbir yere gitmiyor.
   - Yöneticinin push tercih ekranında 17 anahtar var; hiçbiri yöneticiye gelen bir bildirim değil.

---

## 1. Yöneticinin bugün mobilde yapabildikleri: sınıflandırılmış envanter

**Sınıflar:**
- ✅ **Var ve çalışıyor**
- ⚠️ **Var ama hatalı / eksik**
- 🔜 **Yakında** (yer tutucu)
- ❌ **Ekran yok** (olmalı)
- 🖥️ **Web'de kalmalı** (mobilde gerekmez)

### 1.1 Alt sekmeler ve giriş noktaları

Sekme seti: Anasayfa · Duyurular · Takip · Okul · Daha fazla (`packages/core/src/nav/nav-config.ts:800-808`).

#### Anasayfa (`features/home/components/admin-home.tsx`)

| Bölüm | Durum | Not |
|---|---|---|
| A: Yoklama durumu | ✅ | Gece 00:17'de "08:55 · 1. ders başlıyor" doğru. Dokununca Canlı Yoklama açılıyor |
| B: Onay bekleyen | ⚠️ | Duyuru + mazeret + düzeltme sayısını topluyor, hedef sabit `/announcements/queue` (`:81-92`, `:159`). **[Ekranda doğrulandı]**: "1 düzeltme talebi" → "Onay bekleyen duyuru yok" |
| C: Vekâlet ihtiyacı | 🔜 | `:162-168` |
| D: Bugün okulda | ⚠️ | Etkinlik ve tatil satırları çalışıyor; test etkinliği anında yansıdı [Ekranda doğrulandı]. Sorunlar:<br>• Sınav satırı `/planned`'a düşüyor (`:111`).<br>• `GetExamBadges` yöneticiye okul geneli sınavları döndürmüyor (`GetExamBadgesQueryHandler.cs:57-63,108-125`); ders vermeyen yönetici hiç sınav görmüyor.<br>• Liste 3 satırda kesiliyor, "Tümü" bağlantısı yok (`:123`) |
| E: Kısayollar | ⚠️ | "Duyuru yayınla" ✅ · "Öğrenci sorgula" ✅ · "Akademik takvim" 🔜 · "Mesajlar" 🔜. Mesajlar bu okulun planında **plan dışı**; Modüller ekranı "plan dışı modüller menüde görünmez" diyor ama kısayol duruyor [Ekranda doğrulandı] |
| Sezon kilidi notu | ⚠️ | `/school`'a gidiyor ama orada sezon yönetimi yok (`:141`). Açılışta kilit notu yanıp sönebilir (`:71`, `season.isPending` kontrol edilmiyor) [Kod] |
| Selamlama | ⚠️ (düşük) | 00:17'de "İyi akşamlar" |

#### Duyurular (`(tabs)/announcements.tsx`)

| Bölüm | Durum | Not |
|---|---|---|
| Envanter, sayaç kartları, çipler, sonsuz liste | ✅ | [Ekranda doğrulandı] |
| Duyuru detayı + gönderim raporu | ⚠️ | • Yayın tarihi UTC gösteriliyor ("4 Eki", gerçek 5 Eki 00:19) [Ekranda doğrulandı].<br>• 404/403/ağ hatasında sonsuz iskelet (`announcement-detail-screen.tsx:209`) [Kod] |
| Değişiklik geçmişi | ✅ | Hata durumu yok (`audit.tsx`) [Kod] |
| Yeni duyuru | ⚠️ | Yayın akışı ✅ [Ekranda doğrulandı]. Sorunlar:<br>• **Kişi** katmanı "Bu katmanda seçenek yok".<br>• **Şube** katmanı yalnız öğrenci (velisiz).<br>• Şube listesi metin sıralı (9-A/9-B en sonda).<br>• **Zamanlama ve geçerlilik tarihi alanı yok**; backend `scheduledAt` / `validUntil` destekliyor.<br>• Push ve E-posta kanalları 🔜 |
| Düzelt | ⚠️ | Önbellek boşken (derin bağlantı) form boş tohumlanıyor (`edit.tsx`, `compose-screen.tsx:167-183`) [Kod] |
| Geri çek | ✅ | [Ekranda doğrulandı]. Eski "yayınlandı" tostu ekranda kalıyor. Geri çekilen duyurunun bildirimi alıcıda okunmamış kalıyor ve 404'e gidiyor [API ile doğrulandı] |
| Onay kuyruğu (onay/ret) | ✅ | Eşikli moderasyonda uçtan uca test edildi: öğretmen → yöneticiye bildirim → zil → kuyruk → ret → öğretmene ret bildirimi [Ekranda + API ile doğrulandı]. Sorunlar:<br>• Bekleyen duyuruda "0 alıcı" görünüyor (13 veli olmalı).<br>• Kuyruk hatası "boş" gibi çiziliyor (`queue-screen.tsx:75-83`).<br>• Serbest modda kuyruk girişi gizli |
| Şablonlar | ✅ | [Kod] |

#### Takip (`features/student-tracking`)

| Bölüm | Durum | Not |
|---|---|---|
| Öğrenci sorgula (ad/no) | ✅ | [Ekranda doğrulandı] |
| Öğrenci devam kartı | ⚠️ | Gece "Bugün ders yok" (UTC hatası, §4.1). Diğer sorunlar:<br>• Yükleme/hata sırasında "Bu ay devamsızlığı yok" yazıyor (`admin-student-attendance-screen.tsx:75-79,108-111`).<br>• Ders numarası `i+1` ile uyduruluyor (`:166`).<br>• **Veli iletişimi / arama düğmesi yok** |
| Canlı Yoklama (özet) | ⚠️ | Sayılar doğru (0/88/0) [Ekranda doğrulandı]. Sorunlar:<br>• `unrecorded` hatasında "Tüm yoklamalar alındı" yazıyor (`admin-live-screen.tsx:160,279-287`).<br>• Hafta sonuna "resmî tatil" diyor (`:165,228`).<br>• Satıra dokununca yalnız "web panosunda" tostu çıkıyor. **Hatırlat düğmesi yok** |
| "CANLI" rozeti | ⚠️ (düşük) | Gece 00:20'de, ders başlamadan yanıyor |
| Mazeret Bildirimleri | 🔜 | `student-tracking-hub-screen.tsx:184-188` |
| Düzeltme Talepleri | 🔜 | `:189-193` |
| Not girişi durumu kartı | ✅ / ⚠️ | Salt okunur. Dokunulamıyor, "Hatırlat" yok, header'daki dönem seçimini yok sayıyor |

#### Okul (`features/school-settings`)

| Bölüm | Durum | Not |
|---|---|---|
| Kimlik Bilgileri | ✅ | Salt okunur; logo yükleme web'de 🖥️ |
| İletişim (görüntüle + düzenle) | ✅ / ⚠️ | Geçersiz e-postada Kaydet sessizce pasif kalıyor, neden gösterilmiyor. Adres düzenleme web'de 🖥️ |
| Akademik Politikalar | ✅ / ⚠️ | Not görünürlüğü yazılabilir. "Karneleri otomatik yayınla: Açık" gösteriliyor ama **karne modülü yok** |
| Akademik Yapı · Zil Programı · Modüller | ✅ | Salt okunur. Modül listesi 6 modül; kulüp, etkinlik, sınav, nöbet ve program listede yok |
| Tatiller | ✅ / ❌ | Liste çalışıyor. **Mobilde tatil / acil kapanış eklenemiyor** (kar tatili, afet). Not: bu okulda "Ara Tatil 0"; MEB Kasım/Nisan ara tatilleri tanımlı değil (veri eksiği) |
| Bildirim Ayarları | ✅ / ⚠️ | Moderasyon yazılabilir ✅ [Ekranda doğrulandı]. Sorunlar:<br>• Matriste **Push sütunu yok** (yalnız Portal/E-posta/SMS).<br>• SMS kotası "temsilî veri" (E-23).<br>• Ödeme ve karne satırları, modül yokken listeleniyor |

#### Daha fazla (`features/more`)

| Bölüm | Durum | Not |
|---|---|---|
| Profilim | ⚠️ | Ayrıntı: Profil satırı |
| Bildirim tercihlerim | ⚠️ | 17 anahtarın hiçbiri yöneticiye gelen bir bildirim değil; yöneticiye gelen duyuru onayı listede yok (TB-269) [Ekranda doğrulandı] |
| Ayarlar | 🔜 | Satırda "Yakında" rozeti **yok**; normal satır gibi görünüp yer tutucuya düşüyor |
| Okul Bilgileri | ✅ | "Okul" sekmesiyle aynı hedef; gereksiz tekrar |
| Etkinlikler | ✅ / ⚠️ | Ayrıntı: Etkinlik satırı |
| Kulüpler | 🔜 | Rozet yok. Yer tutucu "Modül hazır olduğunda" diyor; kulüp modülü web ve backend'de **hazır** |
| Kütüphane | 🔜 | Rozet yok. Backend'de `/library` yok, web menüsünde yok |
| Profil değiştirme · Çıkış | ✅ | |

#### Profil (`/profile`)

| Bölüm | Durum | Not |
|---|---|---|
| Okul kartı | ⚠️ | "Girişte okutmak için dokunun" yazıyor; QR okuyucu tanımlı değil, söz verilen özellik yok |
| Sayaçlar (Kullanıcı / Öğretmen / Şube) | 🔜 ×3 | Uçlar yöneticide var (`useUsers`, `useTeachers`, `useSections`) |
| Görev · Kampüs · Sezon · Son giriş | ✅ | |
| Fotoğraf yükle / kaldır | ✅ | |
| İletişim metni | ⚠️ (metin) | Yöneticiye "değişiklik için okul yönetimiyle iletişime geçin" yazıyor; yönetici kendisi. Kendi telefonunu girememesi de bir eksik |
| Parolayı değiştir | 🔜 | `profile-account-tab.tsx:65`; uç hazır |

#### Etkinlik (`(tabs)/activities`, `activities/*`)

| Bölüm | Durum | Not |
|---|---|---|
| Liste (Yaklaşan / Geçmiş) | ✅ | Arşiv sezonu seçilse de aktif sezonu okuyor [Kod] |
| Oluştur (3 adım) | ✅ / ⚠️ | [Ekranda doğrulandı]. Sorunlar:<br>• **Tur saati adımı yok**; tek tur sabit "Sayım 09:00" (`app/activities/new.tsx:62`).<br>• Birden çok sorumlu seçilince tüm öğrenciler her gruba ekleniyor (`:62-70`) [Kod] |
| Detay | ⚠️ | Yalnız iptal var. Eksikler: **düzenleme, tur ekleme, sorumlu devri, katılımcı değiştirme** (uçlar var: `UpdateActivity`, `HandoverActivityGroupTeacher`, `SetActivityGroupStudents`) |
| İptal | ✅ / ⚠️ | [Ekranda doğrulandı]. İptal sonrası grup "Sayım bekliyor", tur "Bekliyor" görünmeye devam ediyor. İptal hatası sessizce yutuluyor (`activities/[id].tsx:37`) [Kod] |

#### Ortak yüzeyler

| Bölüm | Durum | Not |
|---|---|---|
| Bildirim merkezi | ⚠️ | Liste ✅. Hedef sorunları için bkz. §6.4 |
| Sezon / dönem bağlamı | ✅ | [Ekranda doğrulandı] |

### 1.2 Menüden değil, bildirim ya da derin bağlantıyla düşülen ekranlar

| Rota | Yöneticiye ne çiziliyor | Durum | Kanıt |
|---|---|---|---|
| `(tabs)/attendance` | Öğrencinin "Devamsızlığım" ekranı; yöneticinin `personId`'siyle özet çağırıyor | ⚠️ yanlış ekran (E-10) | `attendance-tab-screen.tsx:33`, `student-screen.tsx:172-184` |
| `(tabs)/duty` | "Bu ekran web konsolunda" | ❌ | `(tabs)/duty.tsx:27-36` |
| `(tabs)/schedule`, `schedule/week` | "Ders Programı web konsolunda" | ❌ | `(tabs)/schedule.tsx:22-34` |
| `(tabs)/exams` | Yönetici dalı yok; öğrenci/veli takvimi çiziliyor | ⚠️ | `(tabs)/exams.tsx:44-74` |
| `(tabs)/grades`, `(tabs)/homework` | Öğrenci yüzü / "henüz boş" | ⚠️ | `grade-tab-screen.tsx:60-80`, `homework-tab-screen.tsx:57-62` |
| Bilinmeyen rota | Türkçe "sayfa bulunamadı" yok | ⚠️ (E-08) | `app/+not-found.tsx` yok |

### 1.3 Uçtan uca test edilen akışların sonucu

| Akış | Sonuç |
|---|---|
| Giriş (DEV hızlı giriş, Altınay) | ✅. Aynı adlı iki "Altınay Eğitim Kurumları" var, listede ayırt edilemiyor (düşük, dev aracı) |
| Yönetici duyuru yayınla (şube) → öğrenci bildirimi | ✅ öğrenci aldı · ❌ veli almadı (şube = yalnız öğrenci) |
| Moderasyon: öğretmen veliye duyuru → yöneticiye bildirim → kuyruk → ret → öğretmene ret bildirimi | ✅ tamamı çalıştı |
| Geri çekme | ✅. Alıcının bildirimi ölü kalıyor |
| Etkinlik oluştur → anasayfa → iptal | ✅ ekran tarafı · ❌ bildirim tarafı (§6.3) |
| Okul iletişim düzenleme | ✅. Doğrulama mesajı yok |
| Profil, bildirim tercihleri, sezon seçici | ✅ (metin kusurlarıyla) |

> **Test sırasında oluşturulan ve geri alınan veri (Altınay):**
> - Bir test duyurusu yayınlandı ve geri çekildi; arşivde "geri çekildi" olarak duruyor.
> - Bir öğretmen test duyurusu reddedildi; öğretmenin taslaklarına döndü.
> - Bir test etkinliği oluşturuldu ve iptal edildi; kayıt "iptal" olarak duruyor.
> - Moderasyon modu geri "Serbest"e alındı.
> - İlgili hesapların bildirim listelerinde test bildirimleri kalıyor.

---

## 2. "Yakında" envanteri: 15 kalem

### 2.1 Dokunulabilir çıkmazlar (10)

| # | Ekran / öğe | Giriş yolu | Kanıt | Backend | İş türü | Karar önerisi |
|---|---|---|---|---|---|---|
| Y1 | **Mazeret Bildirimleri** (liste + onay/ret) | Takip | `student-tracking-hub-screen.tsx:184` | Hazır: `GET excuses`, `PUT excuses/{id}/decision` (`AttendanceController.cs:223`); `useExcuses`, `useDecideExcuse` | Yalnız UI + **mobil tasarım yok** | **Yap: P0** |
| Y2 | **Düzeltme Talepleri** (liste + onay/ret) | Takip | `:189` | Hazır: `PUT amendment-requests/{id}/decision` (`:274`); `useAmendmentRequests`, `useDecideAmendmentRequest` | Yalnız UI + **mobil tasarım yok** | **Yap: P0** |
| Y3 | **Vekâlet ihtiyacı** (anasayfa C) | Anasayfa | `admin-home.tsx:162` | Kısmen: `duties/substitution/board` öğretmen başına; okul geneli günlük özet ucu yok | Backend özet ucu + UI | **Yap: P1**, vekâlet ekranıyla birlikte |
| Y4 | Sınav satırı (anasayfa D) | Anasayfa → Bugün okulda | `admin-home.tsx:111` | `exams/windows`, `/board` hazır. `GetExamBadges` idare kapsamı **hatalı** | Backend düzeltme + salt okunur UI | **Yap: P2** |
| Y5 | **Parolayı değiştir** | Profil → Hesap | `profile-account-tab.tsx:65` | Hazır: `POST auth/account/change-password`, `useChangeAccountPassword` | Yalnız UI; tasarım var (`change-password`) | **Yap: P1** |
| Y6 | **Ayarlar** (dil, tema, güvenlik, gizlilik, rızalar) | Daha fazla | `more-screen.tsx:212-219` | Güvenlik ve rıza uçları var; tema/dil yerel | Yalnız UI; tasarım var (`settings*`, `consents`) | **Yap: P2**. Tema/dil gelene kadar satırı "Güvenlik" olarak daralt |
| Y7 | **Kulüpler** (yönetici) | Daha fazla | `nav-config.ts:985-991`, `app/clubs/index.tsx:42` | Hazır: `GET /clubs`, üyeler, başvurular, `changeStatus` | Yalnız UI; tasarım yer tutucu | **Yap: P3** (salt okunur liste + durum) |
| Y8 | Akademik takvim | Anasayfa kısayolu | `core/home/constants.ts:94-99` | **Yok** (E-04; web de yer tutucu) | Backend + web + mobil | **Kaldır** ya da kısayolu `/school/holidays`'e bağla |
| Y9 | Mesajlar | Anasayfa kısayolu | `core/home/constants.ts:100-106` | **Yok** (`Modules/Messaging` boş); okulda plan dışı | Modül | **Kaldır** (modül kararına kadar) |
| Y10 | Kütüphane | Daha fazla | `nav-config.ts:992-998` | **Yok** | Modül | **Kaldır** |

### 2.2 Salt gösterim (5)

| # | Öğe | Kanıt | Backend | Karar |
|---|---|---|---|---|
| Y11–13 | Profil sayaçları: Kullanıcı, Öğretmen, Şube | `core/account/constants.ts:37-41` | Liste uçları yöneticide var; ideali bir sayım ucu | **Yap: P3** (yorumdaki "self kaynak yok" gerekçesi yönetici için geçersiz) |
| Y14–15 | Duyuru kanalları: Push (yakında), E-posta (yakında) | `core/announcements/constants.ts:137-150` | Duyuru tipleri push eşlemesinde (`PushEventKeyMap`) yok. Kanal seçimi kaydediliyor ama teslimde okunmuyor (`AnnouncementMapper.cs:72`). Throttle yok | **Backend: P2** (throttle → duyuru push'u → kanal seçimini kapıya bağla) |

**Özet:**
- 15 "Yakında"nın 9'u yalnız UI işi (Y1, Y2, Y5, Y6, Y7, Y11–13; Y4'ün UI yarısı da öyle).
- 3'ü kaldırılmalı (Y8, Y9, Y10).
- 3'ü backend ister (Y3, Y14, Y15).

**Tasarım engeli:** Y1, Y2 ve vekâlet için Claude Design registry'sinde mobil yönetici tasarımı **yok**. `mobil-tasarim-haritasi.md:124-128` kuralı gereği önce tasarım istenmeli. Y5 ve Y6'nın tasarımı hazır (`proto-app.jsx:1954-1997`).

---

## 3. Hiç düşünülmemiş / atlanmış ekranlar (Yakında bile denmeyen)

Bu ekranlar menüde "Yakında" olarak bile yok. Yöneticinin sahada telefondan yapacağı işler oldukları için mobilde olmaları gerekir.

| # | Ekran | Neden mobilde olmalı | Backend | Öncelik |
|---|---|---|---|---|
| A1 | **Onay Merkezi** (duyuru + mazeret + düzeltme, tek liste) | Anasayfa B kartı bu üçünü zaten sayıyor; tek hedef olmalı. Y1 ve Y2'yi de karşılar | Hazır | **P0** |
| A2 | **Vekâlet panosu + atama** (bugün boş dersler → aday → ata / etüt / geri al) + bugünün nöbetçileri | Sabah 07:45'te "öğretmen gelmedi" kararı koridorda verilir | Hazır: `duties/on-duty` `:195`, `substitution/board` `:231`, `candidates` `:244`, `POST substitution` `:266`, `study-hall` `:282`, `revoke` `:298`; hook'lar `duty/queries.ts:222-316` | **P1** |
| A3 | **Canlı Yoklama'da "Hatırlat"** (tek ve toplu) | Eksik liste var, aksiyon yok | Hazır: `POST sessions/{id}/remind` `:169`, `useRemindTeacher` | **P1** |
| A4 | **Acil tatil / okul kapanışı ekle** | Kar tatili, afet veya valilik kararı akşam ya da sabah erken verilir; yönetici bilgisayar başında değildir. Bildirimle birlikte gelmeli (§6.3) | Uç var (`CreateSchoolHoliday`); bildirim yok | **P1** |
| A5 | **Gün içi izin ver** (öğrenci kartından "Erken ayrılıyor") | Veli kapıdadır | Hazır: `daily-leaves` `:288-320`, `useGrantDailyLeave` | **P1** |
| A6 | **Kişi rehberi** (öğrenci / öğretmen / veli kartı + `tel:` / `mailto:`) | Mobilde tek bir arama/iletişim aksiyonu yok (`tel:` grep = 0). Öğrenci kartında veli telefonu bile yok | Hazır: `users/students/{id}/parents`, `useStudentGuardians`, `useTeachers` | **P1** |
| A7 | **Yönetici bildirim triyajı** (`adm-notif-list`, `adm-alerts`) | Tasarımı hazır, kodlanmadı (`proto-app.jsx:1673-1717`) | Var | P2 |
| A8 | **Salt okunur ders programı** (şube / öğretmen haftalık: "9-A şu an nerede?") | Vekâletin girdisi | `teachers/{id}/weekly` hook var; `class-rooms/{id}/weekly` **hook yok** | P2 |
| A9 | **Yönetici sınav takvimi** (bugün / hafta, salt okunur) | Y4'ün hedefi | Hazır (+ rozet kapsam düzeltmesi) | P2 |
| A10 | **Risk öğrenciler** (devamsızlık eşiğine yaklaşanlar) | Takip'in doğal kartı | `useRiskStudents` hazır | P2 |
| A11 | **Not girişi "Hatırlat"** (Takip not kartında) | Geciken sayısı görünüyor, aksiyon yok | Hazır: `POST grades/reminders`, `useSendGradeReminders` | P2 |
| A12 | **Etkinlik detay aksiyonları** (tur saati / ekleme, sorumlu devri, katılımcı düzenleme, güncelleme) | Gezi sırasında sorumlu değişimi sahada olur; tur saati sabit 09:00 | Hazır | P2 |

**Daha düşük öncelikli ama atlanmış olanlar:**
- Davet durumu (yeniden gönder / iptal; hook'lar var).
- Ad / soyad düzeltme (E-31).
- Türkçe 404 ekranı (E-08).
- Yöneticinin kendi telefonunu girebilmesi.
- Okul logosu görüntüleme.

### Mobilde gerekmeyen (🖥️ web'de kalmalı)

Bunlar kurulum ya da toplu veri girişi işleri:
- Sezon yönetimi, Sınıflar & Şubeler, Müfredat, Görevlendirmeler
- Ders programı editörü, nöbet çizelgesi kurulumu
- Kullanıcılar, Roller & İzinler
- Ödev panosu (analiz "yalnız web" diyor)
- Raporların dışa aktarımı
- Adres zinciri, logo yükleme, bildirim matrisi düzenleme

Finansın 5 öğesi web'de de yer tutucu, backend yok; şimdilik kapsam dışı.

### Gereksiz / kaldırılması önerilen girişler

1. **Kütüphane** satırı (Y10): backend yok, web menüsünde yok.
2. **Mesajlar** kısayolu (Y9): backend yok ve bu okulun planında plan dışı. Yerine **Onay Merkezi** ya da **Vekâlet** kısayolu konmalı.
3. **Akademik takvim** kısayolu (Y8): modül yok. Kısa vadede Tatiller'e bağlanabilir.
4. **Daha fazla → Okul Bilgileri** satırı: "Okul" sekmesiyle birebir aynı hedef.

---

## 4. Ekranı var ama hatalı çalışanlar: hata listesi

### 4.1 Yüksek

| # | Hata | Kanıt | Doğrulama |
|---|---|---|---|
| H1 | "Onay bekleyen" kartı 3 kaynağı sayıyor, yalnız duyuru kuyruğuna gidiyor | `admin-home.tsx:81-92,159` | Ekranda |
| H2 | **Backend "bugün" = UTC tarihi.** Türkiye'de 00:00–03:00 arası önceki gün sayılıyor. Etkiler:<br>• Öğrenci kartı "Bugün ders yok" diyor (`GetStudentToday` → `noLessons`).<br>• Aynı kalıp 16 dosyada: `OpenOrGetSession`, `MoveExam`, `NotificationSeasonScope`, `AudienceResolver`, `EnrollStudent`, `RenewEnrollment`, `GetStudentRecords`, `SendGradeEntryReminders`, `ScheduleExceptionPlanner`, vb.<br>• Doğru kalıp zaten var: `ISchoolCalendarService.GetLocalNowAsync` (B-104 benzeri) | `Oksis.Infrastructure/Identity/DateTimeProvider.cs` (`Today => DateOnly.FromDateTime(DateTime.UtcNow)`) | Ekranda + API |
| H3 | Yönetici hedef kitlesinde kademe / seviye / şube **yalnız öğrenci** kovası; kişi ve ders katmanı `null`. Yönetici hiçbir alt kümenin **velisine** duyuru atamıyor (yalnız "tüm veliler") | `GET /announcements/audience` (yönetici) ↔ aynı uç (öğretmen: "10-A velileri") | API |
| H4 | Devamsızlık limiti bildirimi yöneticiyi öğrenci "Devamsızlığım" ekranına götürüyor (E-10) | `navigate-to-target.ts:60-68`, `attendance-tab-screen.tsx:33` | Kod |
| H5 | Etkinlik iptali kimseye bildirilmiyor. Veli, oluşturmada "izinli sayıldı" mesajını almış olarak kalıyor | `CancelActivityCommandHandler.cs` (olay yok), `ActivityRollCall.Cancel` | API |

### 4.2 Orta

| # | Hata | Kanıt |
|---|---|---|
| H6 | Duyuru detayında yayın tarihi UTC günüyle gösteriliyor ("4 Eki") | Ekranda |
| H7 | Duyuru detayı 404 / 403 / ağ hatasında sonsuz iskelet | `announcement-detail-screen.tsx:209` |
| H8 | Geri çekilen duyurunun bildirimi alıcıda okunmamış kalıyor, sayaç 1 kalıyor, hedef 404 | API |
| H9 | Şube velilerine giden öğretmen duyurusu `reach: "schoolWide"` dönüyor (`classScoped` olmalı) | API |
| H10 | Sınav bildirimleri (`/exams`) mobilde hiçbir yere gitmiyor; yöneticiye gelen `ExamReviewCommentAdded` ölü | `core/notifications/logic.ts:281-290` |
| H11 | `GetExamBadges` idare için okul geneli dönmüyor; yönetici "Bugün okulda"da sınavları görmüyor | `GetExamBadgesQueryHandler.cs:57-63,108-125` |
| H12 | Canlı Yoklama `unrecorded` hatasında "Tüm yoklamalar alındı" diyor | `admin-live-screen.tsx:160,279-287` |
| H13 | Kuyruk hatası "Onay bekleyen duyuru yok" olarak çiziliyor | `queue-screen.tsx:75-83` |
| H14 | Öğrenci devamı yüklenirken ya da hatada "Bu ay devamsızlığı yok" diyor | `admin-student-attendance-screen.tsx:75-79,108-111` |
| H15 | Etkinlik iptal hatası sessiz | `activities/[id].tsx:37` |
| H16 | Anasayfa sezon kilidi açılışta yanıp sönüyor | `admin-home.tsx:71`, `season-state.ts:176-185` |
| H17 | Arşiv sezonu seçilince Etkinlikler, Tatiller ve anasayfa hâlâ aktif sezonu okuyor | `useCurrentSession` kullanımları |
| H18 | Çok öğretmenli etkinlikte tüm öğrenciler her grupta (web de aynı; karar mı, doğrulanmalı) | `app/activities/new.tsx:62-70` |

### 4.3 Düşük

- Bekleyen duyuruda "0 alıcı".
- Şube listesi metin sıralı.
- Bayat "yayınlandı" tostu.
- İptal edilen etkinlikte grup ve tur "bekliyor" görünüyor.
- İletişim formunda doğrulama mesajı yok.
- "CANLI" rozeti ders saati dışında yanıyor.
- Gece "İyi akşamlar".
- Hafta sonuna "resmî tatil" deniyor.
- "Daha fazla"daki yer tutucu satırlarda "Yakında" rozeti yok.
- Kulüp yer tutucusu "modül hazır olduğunda" diyor (hazır).
- QR "girişte okutun" vaadi.
- Yöneticiye "okul yönetimiyle iletişime geçin" metni.
- Politikalarda var olmayan karne ayarı.
- Bildirim matrisinde Push sütunu yok.
- `clubs/index.tsx:41` header'sız yer tutucu.
- `CAN_WRITE = true` sabiti (`announcements.tsx:338`).
- Web'de sayfa yenileme oturumu düşürüyor (yalnız web).

---

## 5. Önerilen geliştirme sırası

Hedef: "Yakında" kalmadan, yöneticinin tüm ekranları doğru çalışsın. Sıra, **etki × hazırlık** ile belirlendi: önce backend'i hazır olan karar işleri, sonra tasarım ya da backend isteyenler.

### Faz 0: Hızlı düzeltmeler (1–2 gün, tasarım gerekmez)

1. **H2: UTC "bugün"** (backend). `IDateTimeProvider.Today` kullanımlarını okul saat dilimine taşı (`GetLocalNowAsync` kalıbı). En geniş etkili hata; yoklama açma ve sınav taşımayı da etkiler.
2. **H1:** B kartını parçala ya da hedefi Takip'e çevir (Onay Merkezi gelene kadar).
3. **H4 + H10:** Bildirim hedefleri.
   - Yönetici devamsızlık bildirimi → `/attendance/live` (ya da öğrenci kartı; deepLink'e `studentId` eklenmeli).
   - `/exams` alanını core'a ekle.
   - 4 sınav tipine görsel ayar ekle.
4. **H6 / H7 / H12 / H13 / H14 / H15:** Hata ve boş durum eksikleri, tarih gösterimi.
5. **Kaldırma:** Kütüphane, Mesajlar ve Akademik takvim kısayolları (Y8–Y10). Okul Bilgileri tekrarı. Kalan yer tutucu satırlara "Yakında" rozeti.
6. **Metinler:** QR vaadi, yönetici profil metinleri, kulüp yer tutucu metni, var olmayan karne ayarı.

### Faz 1: Karar işleri (P0). Önce Claude Design'dan mobil tasarım istenir

7. **Onay Merkezi (A1)** + **Mazeret kararı (Y1)** + **Düzeltme kararı (Y2)**. Backend ve hook'lar hazır. Takip'teki iki "Yakında" ve anasayfa B kartı birlikte kapanır.
8. **Yeni mazeret / yeni düzeltme talebi → yöneticiye bildirim** (backend, §6.2). Onay Merkezi'nin canlı kalması için şart.

### Faz 2: Sahada aksiyon (P1)

9. **Vekâlet panosu + atama (A2)**, anasayfa C kartı (Y3) ve okul geneli günlük vekâlet özeti ucu (backend).
10. **Canlı Yoklama "Hatırlat" (A3)**, **Gün içi izin (A5)**, **Kişi rehberi + `tel:` (A6)**.
11. **Acil tatil / kapanış (A4)** + tatil bildirimi (backend).
12. **Parola değiştir (Y5)**; tasarım hazır.
13. **H3: Yönetici hedef kitlesine veli kovaları + kişi katmanı** (backend + compose). Mobil formda **zamanlama / geçerlilik** alanları.

### Faz 3: İzleme derinliği (P2)

14. Salt okunur ders programı (A8; `class-rooms/{id}/weekly` hook'u eklenir).
15. Yönetici sınav takvimi (A9 + Y4 + H11).
16. Risk öğrenciler (A10), Not "Hatırlat" (A11).
17. Etkinlik detay aksiyonları (A12) + etkinlik bildirimleri (§6.3).
18. Ayarlar / Güvenlik / Gizlilik / Rızalarım (Y6; tasarım hazır). Yönetici bildirim triyajı (A7).
19. Duyuru push ve e-posta kanalları (Y14–15): throttle → push eşlemesi → kanal seçimini kapıya bağlama.

### Faz 4: Tamamlayıcı (P3)

20. Yönetici kulüp listesi / durum (Y7), profil sayaçları (Y11–13), davet durumu, ad / soyad düzeltme, 404 ekranı.

**Faz 2 sonunda** mobil yöneticide "Yakında" kalmaz; Y14–15 Faz 3'te kapanır. Kaldırılan 3 kısayol yerine Onay Merkezi, Vekâlet ve Öğrenci sorgula kısayolları dolar.

---

## 6. Bildirim analizi (yönetici özelinde)

### 6.1 Güncel durum

- **43** `NotificationKind` tipi var. Portal (matris) eşlemesi 26 tip, push eşlemesi **17** tip.
- **Yöneticiye giden tipler (3):**

  | Tip | Ne zaman | Link | Mobil hedef | Push |
  |---|---|---|---|---|
  | `AnnouncementSubmittedForApproval` | Eşikli modda öğretmenin veliye duyurusu | `/announcements/approvals` | ✅ Onay kuyruğu [Ekranda doğrulandı] | ❌ |
  | `AbsenceThresholdReached` (idare kopyası) | Yalnız özürsüz limit **aşılınca** | `/attendance` | ⚠️ Öğrenci ekranı (H4) | ❌ |
  | `ExamReviewCommentAdded` | Öğretmen sınav planına görüş bırakınca | `/exams` | ❌ Hiçbir yere (H10) | ❌ |

- **Koşullu olarak (yayınlayan yöneticiyse) gelenler:** `AnnouncementScheduledExecuted`, `AnnouncementScheduleFailed`, `AnnouncementWithdrawn`.
- **Yönetici başka bir yöneticinin okul duyurusunu almıyor.** `AudienceBucket` yalnız veli / öğretmen / öğrenci içeriyor (`D/Announcements/Enums/AudienceBucket.cs`).
- **Push tercih ekranı yanlış listeyi gösteriyor (TB-269, ekranda doğrulandı).** Yönetici 17 anahtar görüyor ve hiçbiri ona gelmiyor; yöneticiye gelen tipler listede yok.
- **Kanallar:**
  - Firebase yerelde yapılandırılmış (user-secrets), iOS push 2026-10-04'te ölçüldü.
  - `apps/mobile/firebase/prod/` **yok** (`app.config.ts:51`); prod derlemesi riskli, doğrulanmadı.
  - Toplu gönderim **throttle'ı yok**.
  - TB-126 açık: e-posta kapısı hâlâ push eşlemesine bağlı (`EmailNotificationChannel.cs:67`).
  - SMS sahte yüzey (E-23).
  - TB-125 ve TB-127 kapandı.

### 6.2 Yöneticinin ALMASI gerekip ALMADIĞI bildirimler

| # | Olay | Bugün | Kök neden | Önerilen alıcı / kanal | Öncelik |
|---|---|---|---|---|---|
| N1 | **Veli / sekreterlik yeni mazeret gönderdi** | Yönetici habersiz; yalnız anasayfa sayacı | `AttendanceExcuse.Create` olay yaymıyor (`D/Attendance/Entities/AttendanceExcuse.cs:61-131`) | `attendance.manage` sahipleri · in-app + push | **Yüksek** |
| N2 | **Öğretmen düzeltme talebi açtı** | Habersiz [test: bekleyen 1 talep var, bildirim yok] | `AttendanceAmendmentRequest.Create` olay yaymıyor (`:50-94`) | Aynı | **Yüksek** |
| N3 | **Etkinlik turu zamanında sayılmadı / öğrenci eksik sayıldı** | Habersiz | `ActivityRollCall` tur olayı yaymıyor (`:68-174`) | Etkinliği kuran yönetici + grup sorumlusu · push, sessiz saati delmeli (güvenlik sayımı) | **Yüksek** |
| N4 | Gün sonu: yoklaması alınmamış dersler | Habersiz; DayClose için handler bilinçli no-op | `SessionNotTakenNotificationHandler.cs:20-56` | Yöneticiye tek özet · in-app | Orta |
| N5 | Sezon açılış / kapanış / devir / devir hatası | Habersiz | 13 sezon olayı var, bildirim handler'ı yok (K-01c) | Yönetici · in-app (+ hata e-postası) | Orta |
| N6 | Arka plan iş sonuçları (toplu kişi içe aktarma, program üretimi, nöbet dağıtımı) | Habersiz | `ImportPersonsJob`, `AutoGenerateScheduleJob`, `AutoDistributeDutyJob` bildirim üretmiyor | İşi başlatan yönetici · in-app | Orta |
| N7 | Devamsızlık **limiti aşıldı** (mevcut) | In-app geliyor ama gövdede öğrenci adı yok ("Bir öğrenci…"), push yok, e-posta yok (TB-126) | `AttendanceNotificationContent.cs:58-59` | Gövdeye öğrenci + şube, öğrenci kartına link | Orta |
| N8 | Davet kabul edildi / süresi doldu | Habersiz | `InvitationAccepted/Expired` handler'sız | Daveti gönderen yönetici · in-app | Düşük–Orta |
| N9 | Devamsızlık **uyarı eşiği** | Yalnız veliye | `AbsenceThresholdReachedNotificationHandler.cs:73-76` | Rehberlik / yönetici · günlük özet | Düşük |
| N10 | Sınav saat isteği süresi doldu (yanıtlanmadı) | Habersiz | `ExpireHourRequests` bildirim üretmiyor | Yönetici · in-app | Düşük |
| N11 | Vekâlet ihtiyacı (öğretmen gelmedi / izinli) | Kavram yok | Öğretmen devamsızlık / izin modeli yok | Önce domain kararı (sözlüğe eklenmeli) | Orta (ürün kararı) |

### 6.3 Yöneticinin İŞLEMİNDEN SONRA gitmesi gerekip gitmeyen bildirimler

| # | Yönetici işlemi | Bugün | Eksik | Önerilen alıcı / kanal | Öncelik |
|---|---|---|---|---|---|
| G1 | **Etkinlik oluştur** | Sorumlu öğretmene **hiçbir şey** [API ile doğrulandı]. Veliye anında `ActivityBulkExcused`: "bugünkü etkinliğe katıldığı için izinli sayıldı" (henüz olmamış etkinlik için geçmiş zaman) | `ActivityRollCall.Create` olay yaymıyor (`:68`) | Sorumlu öğretmen (in-app + push: "X etkinliğinde N öğrencinin sorumlusunuz"). Veliye "Çocuğunuz şu tarihte X etkinliğine katılacak; ilgili derslerde izinli sayılacak" | **Yüksek** |
| G2 | **Etkinlik iptal** | Kimseye gitmiyor [API ile doğrulandı] | `Cancel` olay yaymıyor (`:125`) | Sorumlu öğretmen + katılımcı velileri · push (zamana duyarlı; `ClubActivityCancelled` emsali) | **Yüksek** |
| G3 | **Sorumlu devri** | Yeni sorumlu görevini bilmiyor | `HandoverGroupTeacher` olay yaymıyor (`:95`) | Yeni sorumlu (push) + eski sorumlu (in-app) | **Yüksek** |
| G4 | **Tatil ekle / değiştir / sil** (acil kapanış dahil) | Kimseye gitmiyor | `CreateHoliday` / `CreateSchoolHoliday` olay yaymıyor | Okul geneli in-app; acil kapanışta push (throttle sonrası) | **Yüksek** |
| G5 | Etkinlik tarih / başlık güncelle | Gitmiyor | `UpdateDetails` (`:84`) | Sorumlu + veli | Orta |
| G6 | Zil programı değişti | Gitmiyor | `BellScheduleChangedEvent` handler'sız (`SchoolSettings.cs:619`) | Öğretmenler · in-app | Orta |
| G7 | Ders programı yayını | Yalnız şube öğrenci ve velisine | Öğretmenler kendi programlarının yayınlandığını almıyor (`SchedulePublishedNotificationHandler.cs:37`); push yok (throttle) | Programdaki öğretmenler | Orta |
| G8 | Nöbet çizelgesi yayını / atama değişikliği / yancı / muafiyet | Yalnız yayın (in-app, push yok) | `DutyAssignmentChangedEvent`, `DutyExemptionChangedEvent` handler'sız; yancı ataması olay yaymıyor; nöbet günü hatırlatma job'u yok (K-01a) | Öğretmenler · push | Orta |
| G9 | Duyuru yayını | Yalnız in-app; gövde her zaman "Okul yönetimi yeni bir duyuru yayınladı." | Push / e-posta (Y14–15); gövde başlığı ve özeti taşımıyor | Alıcılar | Orta |
| G10 | Duyuru geri çekme | Alıcının eski bildirimi okunmamış ve ölü kalıyor (H8) | Bildirim geri çekilmiyor / "geri çekildi" olarak işaretlenmiyor | Alıcının bildirim satırı güncellenmeli | Orta |
| G11 | Sezon aktifleştirme | Gitmiyor | Handler yok | Öğretmenler (bilgi) + yönetici (sonuç) | Orta |
| G12 | Mazeret kararı · gün içi izin · sınıf öğretmeni ataması · rol ataması | Yalnız veliye / hiç | Etkilenen ders öğretmenleri ve atanan kişi habersiz | İlgili öğretmen · in-app | Düşük |

### 6.4 Mobilde bildirime dokunma (yönetici)

| Bildirim | Hedef | Sonuç |
|---|---|---|
| Duyuru onay talebi | `/announcements/queue` | ✅ [Ekranda doğrulandı] |
| Duyuru yayın / düzeltme / geri çekme / zamanlama | `/announcements/[id]` | ✅ (hata durumunda H7) |
| Devamsızlık limiti (idare) | `/attendance` | ❌ Öğrenci ekranı (H4) |
| Sınav görüşü / sınav penceresi | `null` | ❌ Hiçbir yere (H10) |
| Nöbet yayını (yönetici çizelgedeyse) | `/duty` | ⚠️ "Web konsolunda" |
| Ders programı tipleri | `null` | ❌ |

### 6.5 Bildirim iş sırası (Faz eşlemesiyle)

| Faz | İşler |
|---|---|
| **Faz 0** | Mobil yönlendirme (H4, H10); TB-269: push tercih listesini role göre süz, yöneticiye kendi tiplerini göster |
| **Faz 1** | N1, N2 (Onay Merkezi'nin canlı kalması için) |
| **Faz 2** | G1, G2, G3, G4, N3: etkinlik güvenliği ve acil kapanış. Throttle (G4'ün push'u, G7, G9'un ön koşulu) |
| **Faz 3** | N4, N5, N6, N7, G5–G11; TB-126; duyuru push / e-posta (Y14–15) |
| **Faz 4** | N8–N10, G12; prod Firebase dosyası ve SMS kararı (E-23) |

Her yeni bildirim tipi için ayrıca:
- Bildirim Ayarları matrisine satır eklenmeli; matrise **Push sütunu** da eklenmeli.
- Mobil `resolveNotificationTarget` hedefi tanımlanmalı.
- Görsel ayar (`core/notifications/constants.ts`) eklenmeli.

Sınav modülü bu üçünü birlikte yapan emsaldir.

---

## 7. Ölçüm izi

| İddia | Kaynak |
|---|---|
| Sekme, Daha fazla ve kısayol setleri | `packages/core/src/nav/nav-config.ts:794-999`, `packages/core/src/home/constants.ts:78-107` |
| Onay kartı hedefi | `apps/mobile/src/features/home/components/admin-home.tsx:81-92,159` + ekran testi |
| UTC "bugün" | `oksis-api/src/Oksis.Infrastructure/Identity/DateTimeProvider.cs`; `GetStudentTodayQueryHandler.cs:45,115`; `GET /attendance/students/{id}/today` → `noLessons` ↔ `GET /attendance/board?date=2026-10-05` → 11 şube × 8 ders |
| Hedef kitle kovaları | `GET /api/v1/announcements/audience` (yönetici ↔ öğretmen) |
| Şube duyurusunun veliye gitmemesi | Yönetici duyurusu (10-A) sonrası öğrenci bildirim listesi ↔ veli bildirim listesi |
| Moderasyon akışı | `PUT /announcements/moderation`, öğretmen `POST /announcements`, yönetici `GET /notifications`, ekran testi |
| Etkinlik bildirimleri | Etkinlik oluştur / iptal sonrası öğretmen ve veli `GET /notifications`; `CancelActivityCommandHandler.cs`; `ActivityRollCall.cs:68,95,125,169-175`; `ActivityDefaultsProvider.cs:38` |
| Yöneticiye giden tipler | `NotificationRecipientResolver.cs:130-161`; `AnnouncementSubmittedForApprovalNotificationHandler.cs:75-98`; `AbsenceThresholdReachedNotificationHandler.cs:73-91`; `ExamReviewCommentAddedNotificationHandler.cs:62` |
| Push kapsamı ve kanal durumu | `PushEventKeyMap.cs:49-96`; `EmailNotificationChannel.cs:67`; `NotificationEventTypeSeedData.cs` |
| Mobil bildirim yönlendirme | `packages/core/src/notifications/logic.ts:281-290,510-622`; `apps/mobile/src/features/notifications/lib/navigate-to-target.ts` |
| Hazır ama kullanılmayan hook'lar | `packages/api/src/attendance/queries.ts` (`useDecideExcuse:268`, `useDecideAmendmentRequest:203`, `useGrantDailyLeave:294`, `useRemindTeacher:126`); `duty/queries.ts:222-316`; `grade/queries.ts:175`; `auth/queries.ts:66`; `students/queries.ts:33` |
| Tasarlanmış ama kodlanmamış mobil ekranlar | Claude Design registry `proto-app.jsx:1673-1997`; `docs/frontend/tasarim-sistemi/mobil-tasarim-haritasi.md:124-133` |
