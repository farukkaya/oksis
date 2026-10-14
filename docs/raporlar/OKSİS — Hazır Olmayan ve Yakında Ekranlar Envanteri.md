# OKSİS — Hazır Olmayan ve Yakında Ekranlar Envanteri

> **Tarih:** 2026-10-14
> **Talep:** REQ-003 (tam ekran "hazır değil" yer tutucuları) + REQ-004 ("Yakında" içerikler)
> **Kapsam:** Mobil uygulama (yönetici, öğretmen, öğrenci, veli) ve web paneli (aynı dört rol). Kullanıcının "bitmemiş" diye gördüğü her yer: tam ekran yer tutucular, "Yakında" rozetleri, soluk ve dokunulamaz kısayollar, kilitli düğmeler, pasif katalog kartları.
> **Ölçüm tabanı:** `oksis-ui-tasarim` @ `2b5eba0` (`design/genel-tasarim`, en güncel tasarım dalı) · `oksis-ui` @ `ba099ff` (`master`) · `oksis-api` @ `2b05d1b1` (`master`)
> **Yöntem:**
> 1. Statik kod taraması. Aranan ifadeler: `hazır değil`, `henüz eklenmedi`, `hazırlanıyor`, `Yakında/yakında`, `isPlanned`, `comingSoon`, `PlannedScreen`, `/planned`, `SoonBtn`, `disabled`. Her bulgu çağrı yerine kadar izlendi: hangi menü satırı ya da düğme o ekrana götürüyor, hangi rolde görünüyor.
> 2. API durumu için `packages/api/src/generated/schema.ts` (501 yol) tarandı. Kuşkulu maddelerde `oksis-api` controller, handler ve DTO'larına inildi.
> 3. Ekran testi yapılmadı. Tüm bulgular **[Kod]** düzeyindedir: kod okunarak tespit edildi, çalıştırılmadı.
>
> **API sınıfları:**
> - **UÇ VAR**: Uç var, ekran bağlanmamış. Yalnız arayüz işi kalıyor.
> - **UÇ YOK**: Self kapsamlı ya da modül düzeyinde uç yok, backend işi gerekli.
> - **KARAR**: Önce ürün kararı gerekli. Bu madde için ya kapsam tanımsız ya da modül planda yok; "bağla mı, kaldır mı" sorusu koddan önce gelir.
>
> **Öncül:** [[OKSİS — Mobil Yönetici Durum Analizi Raporu]] (2026-10-05). O raporun yönetici "Yakında" listesinin çoğu kapandı. Bu rapor dört rolün güncel durumunu ölçüyor.

---

## 0. Özet

### Rakamlar

| Ölçü | Mobil | Web | Toplam |
|---|---|---|---|
| **REQ-003: menüden ulaşılan tam ekran yer tutucu** (ayrı giriş noktası) | 5 (rol × giriş: 11) | 8 rota (rol × giriş: 10) | **13** |
| REQ-003 ek: tam ekran "bu iş başka yüzeyde" durumu (zorunlu parola, web'de "mobilde") | 1 | 2 | 3 |
| Rol bekçisi yer tutucu (menüden erişilmez, yalnız derin bağlantı veya bildirimle) | 13 | 1 (+1 ölü dal) | 14 |
| **REQ-004: ekran içi "Yakında" öğe** | 23 | 19 | **42** |

### Sınıf dağılımı (REQ-003 + ek + REQ-004, rol bekçileri hariç: 58 madde)

| Sınıf | Mobil | Web | Toplam | Anlamı |
|---|---|---|---|---|
| **UÇ VAR** (yalnız arayüz işi) | 17 | 7 | **24** | En ucuz kazanımlar |
| **UÇ YOK** (backend gerekli) | 3 | 6 | **9** | Modül ya da self uç yazılmalı |
| **KARAR** (ürün kararı gerekli) | 9 | 16 | **25** | Kütüphane, Mesajlar, Finans, Rozetler gibi planda olmayan modüller ve kapsamı tanımsız alanlar |

### En önemli beş bulgu

1. **Parola değiştirme her iki girişte de çıkmaza düşüyor, oysa uç ve hook hazır.** `POST /auth/account/change-password` ve `useChangeAccountPassword` (`packages/api/src/auth/queries.ts:65`) var. Mobilde Profil › Hesap › "Parolayı değiştir" satırı dört rolde de `/planned` ekranına gidiyor. Zorunlu parola değişiminde ise giriş ekranı "Bu adım şimdilik yalnızca web panelde tamamlanabilir" diyor (`login-screen.tsx:327`). Bu durumda kullanıcı telefondan **hiç giriş yapamıyor**. Tek bir parola formu iki boşluğu birden kapatır.
2. **Profildeki 19 "Yakında" öğesinin 13'ünün verisi zaten API'de duruyor.** Öğretmen için rehber sınıf, haftalık ders sayısı, sınıf sayısı ve verdiği sınıflar `timetable/teachers/me/weekly` yanıtından çıkıyor (`scope.homeroomClassRoomName` + `lessons[].classRoomName`). Öğrencinin şubesi ve rehber öğretmeni `timetable/students/me/weekly` yanıtındaki `scope` alanında. Öğrencinin kulüpleri `students/me/clubs/mine` ucundan geliyor. Ortalama, devam ve bekleyen ödev sayıları öğrencinin kendi sekmelerinin kullandığı sorgulardan alınabilir. Yönetici sayaçları için `users/stats`, `users/persons/teacher-stats` ve sınıf listesi var. Eksik olan yalnız bağlantı. `core/account/logic.ts` bu satırlara "self kaynağı yok" diyor. Bu yorum ölçümle çelişiyor; kaynaklar sonradan gelmiş.
3. **"Kıdem: Belirtilmemiş" bir veri boşluğu.** Alan ya da ekran eksik değil. `ProfileDto.hireDate` var ve `PersonDtoMapper.cs:48` onu dolduruyor. Mobil `seniorityYears(profile.hireDate)` ile hesaplıyor, web öğretmen formu da alanı yazıyor (`features/teachers/modals.tsx`). "Belirtilmemiş" görünmesinin tek nedeni, o öğretmen kaydında işe başlama tarihinin girilmemiş olması. Çözüm veri girişi. İsteğe bağlı olarak boş durumun metni "İşe başlama tarihi girilmemiş" diye netleştirilebilir.
4. **Veli "Ders programı" kısayolu soluk duruyor, oysa uç hazır.** `timetable/parents/children/{childPersonId}/weekly` ve `/today` uçları var. Öğrenci için yazılmış `ScheduleTodayScreen` ve `ScheduleWeekScreen` ekranları da duruyor. Velinin `/schedule` dalı ise hâlâ "Ders Programı — Yakında" gösteriyor (`app/(tabs)/schedule.tsx:23-34`). Yeniden kullanılabilir bir ekranla kapanacak bir boşluk.
5. **Web'de görünür ama içi boş menüler.** Yönetici menüsünde altı satır yer tutucuya açılıyor: Akademik Takvim ve beş Finans satırı. Öğretmen ve veli menüsünde "Mesajlar" var. Backend'de bunların hiçbiri için modül yok: `Oksis.Domain/Modules` altında Finance, Messaging ya da Calendar bulunmuyor. Mobilde aynı modüller 2026-10-05'te "plan dışı" kararıyla kaldırılmıştı (yönetici Mesajlar ve Kütüphane). Web menüsü bu karara henüz uymuyor. Öğrenci ve veli web'de "Ödevler" menüsünü de yer tutucuya açıyor, oysa mobil aynı uçlarla çalışıyor.

---

## 1. Ortak yer tutucu bileşenler

| Yüzey | Bileşen | Metin | Kullanım |
|---|---|---|---|
| Mobil | `apps/mobile/src/features/navigation/components/planned-screen.tsx:12` (`PlannedScreen`) | Kilit ikonu, başlık, varsayılan açıklama "Bu ekran mobil uygulamaya henüz eklenmedi." (satır 58) | Rotalara doğrudan gömülüyor (rol bekçileri) ve genel `/planned` rotasında kullanılıyor |
| Mobil | `apps/mobile/src/app/planned.tsx:22` (genel `/planned` rotası) | Başlık parametresi (`?title=`) header'a gidiyor, gövdede "Bu ekran henüz hazır değil" yazıyor | Hedefi olmayan menü satırları ve kısayollar buraya `router.push({ pathname: '/planned', params: { title } })` ile düşüyor |
| Web | `apps/web/components/shared/planned-screen.tsx` (`PlannedScreen`) | "Bu ekran hazırlanıyor — … menüde yer alıyor, ancak ekranı henüz yayına alınmadı" | `app/(dashboard)/*/page.tsx` ve rol dalları |
| Web | `apps/web/features/settings/parts.tsx:518` (`SettingsComingSoon`) | "{sekme} yakında" | **Ölü dal.** `settings-labels.ts` içindeki dokuz sekmenin dokuzu da `settings-page.tsx:193-217` içinde gerçek bileşene bağlı. Silinebilir. |

`/planned` rotasına giden çağrı yerleri: `use-home-shell.ts:67` (kısayol), `more-screen.tsx:140` (`goPlanned`), `admin-home.tsx:155`, `school-settings-hub-screen.tsx:116` ve `profile-account-tab.tsx:68`.

---

## 2. REQ-003: Mobil tam ekran yer tutucular

### 2.1 Menüden ulaşılanlar

| # | Rol | Giriş noktası (menü yolu) | Rota | Kaynak dosya:satır | API durumu | Öneri |
|---|---|---|---|---|---|---|
| M-1 | Tüm roller (4) | Daha fazla › Profilim › **Hesap** sekmesi › Güvenlik "Parolayı değiştir" | `/planned?title=Parola değiştir` | `apps/mobile/src/features/account/components/profile-account-tab.tsx:62-69` | **UÇ VAR**: `POST /api/v1/auth/account/change-password`; hook `useChangeAccountPassword` (`packages/api/src/auth/queries.ts:65`) | **Bağla.** Mevcut parola, yeni parola ve tekrar alanlarından oluşan bir panel ya da ekran. Aynı form M-6'yı da kapatır. |
| M-2 | Tüm roller (4) | Daha fazla › Hesap › **Ayarlar** ("Dil, tema, güvenlik"; "Yakında" rozetli) | `/planned?title=Ayarlar` | `apps/mobile/src/features/more/components/more-screen.tsx:217-225` | **KARAR**: Dil ve tema yerel ayar, backend gerektirmiyor. "Güvenlik" = M-1 + `POST auth/account/logout-all` (uç var). Bildirim tercihleri zaten ayrı satırda. | Kapsamı tanımlanmalı. Öneri: satır "Güvenlik" adıyla parola değiştirme ve "tüm cihazlardan çık" işlevlerine bağlansın. Dil ve tema planda yoksa açıklamadan çıkarılsın. |
| M-3 | Öğrenci | Daha fazla › Okul › **Kütüphane** ("Yakında" rozetli) | `/planned?title=Kütüphane` | `packages/core/src/nav/nav-config.ts:1157-1162` (`href` yok) → `more-screen.tsx:252-256` | **KARAR / UÇ YOK**: Backend'de kütüphane modülü yok (`Oksis.Domain/Modules` altında bulunmuyor) | **Menüden kaldır.** Yönetici satırı aynı gerekçeyle 2026-10-05'te kaldırılmıştı (`nav-config.ts:1033-1035`). Öğrenci satırı ve E slotu kısayolu (Y-1) bu karara uymuyor. |
| M-4 | Veli | Daha fazla › Okul › **Ödemelerim** ("Yakında" rozetli) | `/planned?title=Ödemelerim` | `packages/core/src/nav/nav-config.ts:1204-1210` (`href` yok) | **KARAR / UÇ YOK**: Finans modülü yok. Web Finans menüsü de yer tutucu (W-2…W-6). | Finans modülü kararı verilene kadar **menüden kaldır**. |
| M-5 | Yönetici | Anasayfa › "Bugün" listesi › **sınav satırı** | `/planned?title=Sınav takvimi` | `apps/mobile/src/features/home/components/admin-home.tsx:149-156` | **KARAR (uç var)**: `GET exams/sessions`, `exams/windows/*` var. Yöneticinin mobil `/exams` dalı da kasıtlı olarak "web panelinde" diyor (`app/(tabs)/exams.tsx:57-66`). | İki yol var: (a) yönetici için salt okunur günlük sınav listesi, (b) satır bilgi amaçlı kalır ve tıklanamaz olur. (b) en ucuzu. Bugünkü hâliyle satır çıkmaz bir ekrana götürüyor. |

### 2.2 Tam ekran "başka yüzeyde" durumu (REQ-003 ek)

| # | Rol | Giriş noktası | Kaynak | API durumu | Öneri |
|---|---|---|---|---|---|
| M-6 | Tüm roller | Giriş › sunucu `requirePasswordChange: true` dönerse | `apps/mobile/src/features/auth/components/login-screen.tsx:320-331`. Metin: "Bu adım şimdilik yalnızca web panelde tamamlanabilir." | **UÇ VAR**: aynı `change-password` ucu. Web bu akışı uyguluyor (`apps/web/features/auth/login-screen.tsx:111, 262`). | **Bağla.** M-1 ile aynı formu kullansın. Bugün davetle gelen ya da parolası sıfırlanan kullanıcı mobilden **giriş yapamıyor**. Öncelik yüksek. |

### 2.3 Rol bekçileri (menüden erişilmez)

Aşağıdaki `PlannedScreen` çağrıları rotayı yanlış rolden korumak için var. Hiçbirine o rolün menüsünden ulaşılamıyor. Envanter bütünlüğü için listelendi. Gerçek bir kullanıcı ancak derin bağlantı ya da bildirimle bu ekranlara düşebilir; bu durumlar **kalın** yazıldı.

| Rota | Bekçinin düştüğü rol(ler) | Kaynak | Not |
|---|---|---|---|
| `/(tabs)/schedule` | Veli ("Ders Programı — Yakında"), yönetici ("web konsolunda") | `app/(tabs)/schedule.tsx:23-34` | Veli dalı Y-2 ile birlikte bağlanmalı (uç var) |
| `/schedule/week` | Veli ("Bu ekran henüz hazır değil"), yönetici | `app/schedule/week.tsx:14-27` | Aynı |
| `/(tabs)/exams` | Yönetici ("Sınav takvimi web panelinde") | `app/(tabs)/exams.tsx:57-66` | **Bildirimden erişilir:** `exams` alanlı bildirim `/exams` rotasına gider (`notifications/lib/navigate-to-target.ts:77`) |
| `/(tabs)/duty` | Öğretmen dışı ("Bu ekran web konsolunda") | `app/(tabs)/duty.tsx:27-36` | **Bildirimden erişilir:** `duties` → `/duty` (`navigate-to-target.ts:73`) |
| `/(tabs)/announcements` | Yönetici dışı | `app/(tabs)/announcements.tsx:115-124` | Erişilmez |
| `/(tabs)/announcements-inbox` | Öğretmen, yönetici | `app/(tabs)/announcements-inbox.tsx:56-65` | Erişilmez |
| `/(tabs)/my-announcements` | Öğretmen dışı | `app/(tabs)/my-announcements.tsx:28-33` | Erişilmez |
| `/(tabs)/excuse-list` | Veli dışı | `app/(tabs)/excuse-list.tsx:16-18` | Erişilmez |
| `/(tabs)/school` | Yönetici dışı | `app/(tabs)/school.tsx:11-13` | Erişilmez |
| `/(tabs)/student-tracking` | Yönetici dışı | `app/(tabs)/student-tracking.tsx:27-29` | Erişilmez |
| `/(tabs)/activities` | Hiçbir rol (dört rolün de dalı var) | `app/(tabs)/activities.tsx:73-82` | Ölü dal |
| `/clubs/preference` | Öğrenci dışı | `app/clubs/preference.tsx:25` | Erişilmez |
| Ödev sekmesi | Yönetici (sekme çubuğunda Ödev yok) | `features/homework/components/homework-tab-screen.tsx:60-64` | Erişilmez |

Not: `timetable` alanlı bildirimler mobilde hiçbir rotaya bağlanmıyor (`navigate-to-target.ts:79-80` → `null`). Veli ders programı ekranı bağlandığında bu eşleme de açılmalı.

---

## 3. REQ-004: Mobil "Yakında" öğeleri

### 3.1 Anasayfa E slotu kısayolları (soluk, kesikli çerçeveli, dokunulamaz)

Kaynak tablo: `packages/core/src/home/constants.ts`. Görünüm: `home-shortcut-grid.tsx:46-55`, `home-parts.tsx:27-45` (`disabled={isPlanned}`). Bu kartlar `/planned` ekranına düşmüyor, dokunulamıyor; erişilebilirlik etiketi "…, yakında".

| # | Rol | Ekran | Öğe | Kaynak | API durumu | Öneri |
|---|---|---|---|---|---|---|
| Y-1 | Öğrenci | Anasayfa | Kısayol **Kütüphane** | `core/src/home/constants.ts:38` | **KARAR / UÇ YOK** (modül yok) | M-3 ile birlikte kaldır; yerine çalışan bir hedef koy (ör. Sınav Takvimim ya da Programım) |
| Y-2 | Veli | Anasayfa | Kısayol **Ders programı** | `core/src/home/constants.ts:70-75` | **UÇ VAR**: `GET timetable/parents/children/{childPersonId}/weekly` ve `/today` | **Bağla.** Öğrencinin `ScheduleTodayScreen`/`ScheduleWeekScreen` ekranları seçili çocukla yeniden kullanılır. `app/(tabs)/schedule.tsx` ve `schedule/week.tsx` içindeki veli dalı açılır. |
| Y-3 | Veli | Anasayfa | Kısayol **Mesajlar** (`unreadMessages` rozet anahtarıyla) | `core/src/home/constants.ts:76-82` | **KARAR / UÇ YOK**: Mesajlaşma modülü yok. Yönetici kısayolu 2026-10-05'te "plan dışı" kararıyla kaldırılmıştı. | **Kaldır.** Rozet anahtarı da ölü. |

### 3.2 Daha fazla › rozetli satırlar

Ayarlar (M-2), Kütüphane (M-3) ve Ödemelerim (M-4) satırlarında "Yakında" rozeti var (`more-screen.tsx:91`). REQ-003'te sayıldıkları için burada yeniden sayılmadı.

### 3.3 Profilim ekranı (`/profile`): Bilgiler sekmesi

Satırlar ve sayaçlar `packages/core/src/account/logic.ts` ile `constants.ts` dosyalarında üretiliyor. "Yakında" metni `profile-info-tab.tsx:113` (çip bloğu), `:127-130` (sayaç) ve `profile-row.tsx:34` (satır) tarafından çiziliyor. `logic.ts:91-95` "self-kapsamlı kaynağı olmayan satırlar" diyor. Bu varsayım **yeniden ölçüldü** ve maddelerin çoğu için artık geçerli değil.

| # | Rol | Öğe | Kaynak | API durumu | Öneri |
|---|---|---|---|---|---|
| Y-4 | Öğretmen | Sayaç **Haftalık** | `core/account/constants.ts:22-26`, `logic.ts:131-138` | **UÇ VAR**: `GET timetable/teachers/me/weekly` → `lessons.length` (yayınlanmış program yoksa 404, "—" gösterilir) | Bağla |
| Y-5 | Öğretmen | Sayaç **Öğrenci** | aynı | **UÇ YOK**: Self kapsamlı öğrenci sayısı yok. `users/persons/teacher-workload` idareye kapalı. | Backend: öğretmen self özet ucu (`GET teachers/me/summary`). Ya da ürün kararıyla sayacı çıkar. |
| Y-6 | Öğretmen | Sayaç **Sınıf** | aynı | **UÇ VAR**: aynı yanıtta `distinct(lessons[].classRoomId)` | Bağla |
| Y-7 | Öğretmen | Satır **Rehber sınıf** | `logic.ts:102` | **UÇ VAR**: `timetable/teachers/me/weekly` → `scope.homeroomClassRoomName` (`PublishedScheduleQueryHandler.cs:471-472`) | Bağla. Program yayınlanmamışsa değer boş kalır, bu durumda satır "Belirtilmemiş" der. |
| Y-8 | Öğretmen | Satır **Veli görüşme saati** | `logic.ts:104` | **KARAR** (uç da yok): Backend'de görüşme saati kavramı yok | Ürün kararı. Planda yoksa satırı kaldır. |
| Y-9 | Öğretmen | Çip bloğu **Verdiği sınıflar** | `core/account/constants.ts:48-49`, `profile-info-tab.tsx:106-116` | **UÇ VAR**: aynı haftalık yanıttan `distinct(classRoomName)` | Bağla |
| — | Öğretmen | Satır **Kıdem: "Belirtilmemiş"** | `logic.ts:103`, `profile-row.tsx:34` | **Alan var, veri yok.** `ProfileDto.hireDate` dolduruluyor (`PersonDtoMapper.cs:48`) ve web öğretmen formu yazıyor. "Belirtilmemiş" = o kişide `hireDate` boş. | Kod işi yok; okul kaydında işe başlama tarihi girilmeli. İsteğe bağlı: boş metin "İşe başlama tarihi girilmemiş" olsun. **"Yakında" sayısına katılmadı.** |
| Y-10 | Öğrenci | Sayaç **Ortalama** | `constants.ts:27-31` | **UÇ VAR**: Öğrencinin Notlarım sekmesinin kullandığı not uçları (`grades/students/{studentId}` vb.) | Bağla. "Ortalama"nın tanımı (dönem ya da yıl, ağırlıklı ya da düz) Notlar sekmesindekiyle aynı olmalı. |
| Y-11 | Öğrenci | Sayaç **Devam** | aynı | **UÇ VAR**: `GET attendance/students/{id}/summary` (Devamsızlığım sekmesi kullanıyor) | Bağla |
| Y-12 | Öğrenci | Sayaç **Bekleyen ödev** | aynı | **UÇ VAR**: Ödevlerim sekmesinin self ödev listesi | Bağla |
| Y-13 | Öğrenci | Satır **Sınıf / şube** | `logic.ts:108` | **UÇ VAR**: `timetable/students/me/weekly` → `scope.ownerName` | Bağla. Daha sağlam yol: `users/self` profil DTO'suna şube adı eklemek. `currentClassroomId` dönüyor ama ad dönmüyor. |
| Y-14 | Öğrenci | Satır **Rehber öğretmen** | `logic.ts:109` | **UÇ VAR**: aynı yanıt → `scope.homeroomTeacherName` (`PublishedScheduleQueryHandler.cs:333-337`) | Bağla |
| Y-15 | Öğrenci | Satır **Kulüpler** | `logic.ts:110` | **UÇ VAR**: `GET students/me/clubs/mine` | Bağla. Satır Kulüplerim ekranına götürebilir. |
| Y-16 | Öğrenci | Çip bloğu **Rozetler** | `constants.ts:50` | **KARAR / UÇ YOK**: Rozet modülü yok | Kaldır ya da ürün kararı |
| Y-17 | Veli | Sayaç **Yeni not** | `constants.ts:32-36` | **KARAR**: `grades/family` var, ama "yeni" kavramı (okunmamış ya da son 7 gün) tanımlı değil | Tanım kararı, sonra bağla. Ya da sayacı kaldır. |
| Y-18 | Veli | Sayaç **Yeni duyuru** | aynı | **UÇ VAR**: `GET announcements/inbox/unread-count` | Bağla |
| Y-19 | Veli | Satır **Acil iletişim kişileri** | `logic.ts:113` | **UÇ YOK**: Domain'de `EmergencyContact` değer nesnesi var (`Oksis.Domain/Modules/Users/ValueObjects/EmergencyContact.cs`). Hiçbir entity kullanmıyor, kalıcılık ve uç yok. | Backend gerekli; ya da ürün kararıyla kaldır |
| Y-20 | Yönetici | Sayaç **Kullanıcı** | `constants.ts:37-41` | **UÇ VAR**: `GET users/stats` | Bağla |
| Y-21 | Yönetici | Sayaç **Öğretmen** | aynı | **UÇ VAR**: `GET users/persons/teacher-stats` | Bağla |
| Y-22 | Yönetici | Sayaç **Şube** | aynı | **UÇ VAR**: sınıf listesi (`class-rooms`) | Bağla |

Veli sayacı "Çocuk" çalışıyor (`logic.ts:125-128`). Yönetici satırları Görev, Kampüs ve Sezon çalışıyor.

### 3.4 Profilim: İletişim ve Hesap sekmeleri

| Sekme | Durum | Kaynak | Değerlendirme |
|---|---|---|---|
| İletişim | E-posta ve Telefon satırları **kilitli** (Yakında değil); değer gösteriliyor | `profile-contact-tab.tsx:13-17` | Bilinçli karar (2026-10-04): SMS doğrulama ucu yok, doğrulamasız telefon değişimi yayınlanmıyor. "Yakında" sayısına katılmadı. Açılması için **UÇ YOK** (doğrulama). |
| Hesap | Hesap durumu, Rol ve Son giriş çalışıyor; **Parolayı değiştir** → `/planned` | `profile-account-tab.tsx:22-69` | M-1 (REQ-003) |
| Hesap | "Oturum listesi" tasarımda var, ekranda yok (`profile-account-tab.tsx:7`) | — | **UÇ YOK** (oturum listeleme ucu yok; yalnız `logout-all` var). Ekranda vaat edilmediği için sayılmadı. |

### 3.5 Diğer mobil öğe

| # | Rol | Ekran | Öğe | Kaynak | API durumu | Öneri |
|---|---|---|---|---|---|---|
| Y-23 | Yönetici, öğretmen | Duyuru yaz (tam boy panel) | Kanal **E-posta "(yakında)"**, kilitli | `packages/core/src/announcements/constants.ts:132-138` (`comingSoon: true`), `compose-sheet.tsx:48-50` | **UÇ YOK**: Kullanıcı e-posta tercihi ve duyuru e-posta gönderimi yok | Backend tercih modeli gelince açılır. Bilinçli yol haritası işareti olarak kalabilir. |

---

## 4. Web bölümü

### 4.1 REQ-003: Web tam ekran yer tutucular (sol menüden ulaşılır)

| # | Rol | Menü yolu | Rota | Kaynak | API durumu | Öneri |
|---|---|---|---|---|---|---|
| W-1 | Yönetici | Genel › **Akademik Takvim** | `/academic-calendar` | `app/(dashboard)/academic-calendar/page.tsx`; menü `core/nav/nav-config.ts:97-102` | **KARAR**: Takvim modülü yok. Parçalar var: dönemler (`academic-sessions/*/terms`), tatiller (`school-settings/holidays`), sınav pencereleri (`exams/windows`). | Ürün kararı: parçalardan salt okunur bir birleşik takvim (UÇ VAR, yalnız arayüz) ya da menüden kaldırma. Sezon Yönetimi'ndeki "Akademik Takvim" düğmesi de buna bağlı (W-27). |
| W-2…W-6 | Yönetici | Finans › **Finans Panosu, Cari Hesaplar, Ücretlendirme, İndirim & Burs, Finans Raporları** | `/finance`, `/finance/accounts`, `/finance/tuition`, `/finance/discounts-scholarships`, `/finance/reports` | `app/(dashboard)/finance/**/page.tsx`; menü `nav-config.ts:279-318` | **KARAR / UÇ YOK**: Finans modülü yok | Modül kararı verilene kadar **grubu menüden kaldır** (mobil Kütüphane emsali) |
| W-7 | Öğretmen, veli | Genel › **Mesajlar** | `/messages` | `app/(dashboard)/messages/page.tsx`; menü `nav-config.ts:423-428` (öğretmen), `:550-555` (veli) | **KARAR / UÇ YOK**: Mesajlaşma modülü yok ("plan dışı", 2026-10-05) | **Menüden kaldır** |
| W-8 | Öğrenci, veli | Genel › **Ödevler** | `/homework` | `features/homework/homework-page.tsx:51-55` | **UÇ VAR**: Mobil öğrenci (`HomeworkSelfScreen`) ve veli (`HomeworkFamilyScreen`) aynı `packages/api` hook'larıyla çalışıyor | **Bağla.** Web öğrenci ve veli ödev yüzü. |

### 4.2 REQ-003 ek: Web'de "şu an mobil uygulamada" tam ekran durumu

| # | Rol | Menü yolu | Kaynak | API durumu | Öneri |
|---|---|---|---|---|---|
| W-9 | Öğrenci, veli | Genel › **Duyurular** | `features/announcements/announcements-screen.tsx:51-63` ("Web sürümü hazırlanıyor") | **UÇ VAR**: duyuru gelen kutusu uçları (mobil `AnnouncementInboxScreen` kullanıyor) | Bağla ya da ürün kararıyla mobil-öncelikli kalsın |
| W-10 | Öğrenci | Genel › **Kulüpler** | `features/club/clubs-screen.tsx:22-37` | **UÇ VAR**: `students/me/clubs/*` | Aynı |

### 4.3 Web rol bekçisi ve ölü dallar

- `features/exam/exam-page.tsx:22-25`: öğrenci ve veli için `PlannedScreen`. `/exams` bu rollerin web menüsünde yok, yani erişilmiyor. Uç var (`exams/me/schedule`, `exams/children/{id}/schedule`).
- `features/settings/parts.tsx:518` `SettingsComingSoon`: ölü (bkz. §1).

### 4.4 REQ-004: Web ekran içi "Yakında" öğeleri

| # | Rol | Ekran | Öğe | Kaynak | API durumu | Öneri |
|---|---|---|---|---|---|---|
| W-11 | Yönetici | Öğretmenler › satır menüsü | **"Ders Programını Görüntüle"** kilitli | `features/teachers/teacher-labels.ts:44-48` (`kind: "locked"`), `parts.tsx:466-478` | **UÇ VAR**: `timetable/teachers/{teacherId}/weekly`. Aynı çekmecenin **Ders Programı sekmesi çalışıyor** (`drawer-tabs.tsx:183`). | **En ucuz düzeltme:** eylem çekmeceyi `program` sekmesinde açsın |
| W-12 | Yönetici | Öğretmen çekmecesi | Sekme **Görev Geçmişi** (kilitli, "Yakında") | `features/teachers/drawer.tsx:39, 184-189` | **UÇ VAR**: `GET teachers/{teacherId}/assignments/history` | Bağla |
| W-13 | Yönetici | Öğretmen çekmecesi › Belgeler | **"Belge Ekle"** | `features/teachers/drawer.tsx:584-592` | **KARAR**: Dosya altyapısı var (`FilesController`, `FileCategoryPolicy`), ama öğretmen belgesi kategorisi ve listeleme ucu tanımlı değil | Ürün kararı (hangi belgeler, KVKK). Sekme şu an sabit "belge yok" metni gösteriyor. |
| W-14 | Yönetici | Veliler › çekmece alt çubuğu ve toplu seçim | **"Mesaj Gönder"** (iki yerde) | `features/parents/drawer.tsx:122`, `parts.tsx:267` | **KARAR / UÇ YOK** (mesajlaşma yok) | Kaldır (W-7 ile tutarlı) |
| W-15 | Yönetici | Veli çekmecesi | **"Düzenle"** (iki yerde) | `features/parents/drawer.tsx:123, 341` | **UÇ VAR**: kişi ve profil güncelleme uçları (`UpdateProfileCommand`, `users/persons/{id}`) | Bağla. Öğretmenler ekranındaki düzenleme kalıbı var. |
| W-16 | Yönetici | Veliler › toplu seçim | **"Daveti Yenile"** | `features/parents/parts.tsx:268` | **UÇ VAR**: `POST users/invitations/{id}/resend` (tekil; toplu iş istemcide döngüyle ya da toplu uçla) | Bağla |
| W-17 | Yönetici | Veli çekmecesi › İletişim | **"Duyuru/Mesaj Gönder"** | `features/parents/drawer.tsx:342` | **KARAR**: Duyuru tek veliye hedeflenebiliyor mu, netleşmeli | Ürün kararı; duyuru hedeflemesi destekliyorsa Duyuru yaz paneline ön doldurmayla bağla |
| W-18 | Yönetici | Veli çekmecesi | Sekme **Ödemeler** ("Yakında") | `features/parents/drawer.tsx:103-116` | **KARAR / UÇ YOK** (finans yok) | Sekmeyi kaldır (W-2…W-6 ile birlikte) |
| W-19 | Yönetici | Raporlar kataloğu | Kart **Not / Karne Raporları** (pasif, "Yakında") | `features/reports/reports-hub.tsx:51-56, 189-220` | **KARAR (kısmi uç)**: `grades/summary`, `grades/books/*/export` var; okul geneli karne raporu ucu yok | Kapsam kararı |
| W-20 | Yönetici | Raporlar kataloğu | Kart **Taşımacılık Raporu** | aynı, `:58-63` | **KARAR / UÇ YOK** (servis modülü yok) | Kaldır |
| W-21 | Yönetici | Raporlar kataloğu | Kart **Program Doluluk Raporu** | aynı, `:65-70` | **KARAR (kısmi uç)**: `timetable/summary`, `programs/{id}/external-occupancy` | Kapsam kararı |
| W-22 | Yönetici | Raporlar kataloğu | Kart **Duyuru Erişim Raporu** | aynı, `:72-77` | **KARAR (kısmi uç)**: Duyuru başına `announcements/{id}/delivery-report` var; okul geneli toplu rapor yok | Kapsam kararı; toplu rapor için backend gerekli |
| W-23 | Yönetici | Raporlar › Risk sekmesi | Satır eylemi **Rehberlik görüşme kaydı** ("Yakında", disabled) | `features/reports/risk-tab.tsx:143-151` | **UÇ YOK** ("Faz 2"; rehberlik görüşmesi modülü yok) | Backend gerekli; Faz 2 |
| W-24 | Yönetici | Öğrenci kayıt sihirbazı › davet kanalı | **SMS, WhatsApp "yakında"** | `features/students/enroll/steps.tsx:1120-1134`, `core/src/students/constants.ts:148-149` | **UÇ YOK**: SMS ve WhatsApp davet gönderici yok, yalnız e-posta gidiyor | Yol haritası işareti olarak kalabilir; ya da kaldır |
| W-25 | Yönetici, öğretmen | Duyuru yaz | Kanal **E-posta** (kilitli, yakında) | `core/src/announcements/constants.ts:132-138`, `features/announcements/compose.tsx:12` | **UÇ YOK** (Y-23 ile aynı) | Y-23 ile aynı |
| W-26 | Yönetici | Nöbet Yük Raporu | **Excel / PDF** düğmeleri disabled ("— yakında") | `features/duty/report-page.tsx:66-72`, `duty-labels.ts:323-324` | **UÇ YOK**: Nöbet dışa aktarma ucu yok (`duties/load-report` yalnız JSON) | Backend: export ucu. Ya da istemci tarafı CSV. |
| W-27 | Yönetici | Sezon Yönetimi başlığı | **"Akademik Takvim"** düğmesi → toast "yakında eklenecek" | `features/academic-sessions/academic-sessions-page.tsx:276-282` | **KARAR** (W-1'e bağlı) | W-1 kararıyla birlikte |
| W-28 | Yönetici | Ders Programı › Öğretmen Müsaitliği | **"İçe Aktar"** → toast "İçe aktarma yakında." | `features/schedule/availability-page.tsx:247-252` | **UÇ YOK**: Müsaitlik içe aktarma ucu yok (`timetable/availability` yalnız okuma ve yazma) | Backend ya da düğmeyi kaldır |
| W-29 | Yönetici | Davetler | **"Dışa Aktar"** disabled ("Dışa aktarma ucu henüz hazır değil") | `features/invitations/invitations-page.tsx:403-412` | **UÇ YOK**: `users/export` ve `users/persons/export` var, davet dışa aktarma yok | Backend; ya da mevcut `users/export` ucuna davet durumu süzgeci eklenebilir mi bakılsın |
| W-30 | Yönetici | Öğretmen çekmecesi | Sekme kilit ikonu (W-12 ile aynı öğe) | `drawer.tsx:162-166` | — | W-12 ile kapanır |

(W-30, W-12'nin görsel parçası olduğu için sayılmadı. İki yerde görünen düğmeler ("Mesaj Gönder", "Düzenle") tek madde sayıldı. Web REQ-004 toplamı: W-11…W-29 = **19 madde**.)

---

## 5. `oksis-ui` master ile fark

Tasarım dalı (`design/genel-tasarim`) master'ın (`ba099ff`) önünde. Master'da **ek olarak** şu "Yakında" öğeleri var. Tasarım dalı bunları kapattı; dal birleştiğinde master'dan da kalkacaklar:

| Rol | Öğe (master) | Kaynak (master) | Tasarım dalında |
|---|---|---|---|
| Öğrenci, öğretmen | Anasayfa kısayolu **Etkinlikler** (`isPlanned`) | `core/src/home/constants.ts` | `href: "/activities"` (bağlandı) |
| Öğrenci | Daha fazla › **Etkinlikler** ("Yakında" → `/planned`) | `nav-config.ts` öğrenci `activities` satırında `href` yok | Bağlandı |
| Yönetici | Daha fazla › **Kulüpler** ("Yakında" → `/planned`) | `nav-config.ts` yönetici `clubs` satırında `href` yok | `href: "/clubs"` |
| Öğrenci, veli, öğretmen | `/activities` rotası yönetici dışına `PlannedScreen` gösteriyor | `app/(tabs)/activities.tsx:30` | Dört rolün ekranı var |
| Öğrenci | `/clubs/preference` rotası yok | — | Eklendi |

Web tarafında iki dal arasında yer tutucuyla ilgili fark yok (fark yalnız kulüp yerleştirme sayfalarında).

---

## 6. Önerilen sıralama (en ucuz kazanım önce)

**Dalga 1: yalnız arayüz, çok küçük (her biri birkaç saat)**

1. **W-11**: Öğretmen satır menüsündeki "Ders Programını Görüntüle" çekmeceyi `program` sekmesinde açsın. Ekran zaten var.
2. **Kaldırmalar (karar emsali var):** Y-1 ve M-3 (öğrenci Kütüphane), Y-3 (veli Mesajlar), W-7 (web Mesajlar), W-14 (veli Mesaj Gönder), W-20 (Taşımacılık kartı), `SettingsComingSoon` ölü dalı. Mobil yöneticide aynı modüller 2026-10-05'te kaldırılmıştı. Kalanların kaldırılması için kısa bir onay yeterli.
3. **M-5**: Yönetici anasayfasındaki sınav satırı tıklanamaz olsun ya da salt okunur listeye gitsin. Çıkmaz ekran kalkar.

**Dalga 2: yalnız arayüz, uç hazır (en yüksek kullanıcı değeri)**

4. **M-1 + M-6**: Mobil parola değiştirme formu. Tek form iki boşluğu kapatıyor. M-6 kullanıcının mobilden girişini engellediği için öncelikli.
5. **Profil sayaç ve satırları (Y-4, Y-6, Y-7, Y-9…Y-15, Y-18, Y-20…Y-22): 13 madde.** Tek bir `useProfile` genişletmesi yeter: rol başına bir ya da iki ek sorgu (`timetable/*/me/weekly`, `students/me/clubs/mine`, `announcements/inbox/unread-count`, `users/stats`, `teacher-stats`). Ardından `core/account/logic.ts` içindeki `planned(...)` çağrıları `fact(...)` olur. Program yayınlanmamışsa (404) satır "Belirtilmemiş" der, "Yakında" demez.
6. **Y-2**: Veli ders programı. Mevcut öğrenci program ekranları seçili çocukla kullanılır, kısayol ve `/schedule` veli dalı açılır, `timetable` bildirim eşlemesi bağlanır.
7. **W-12** Görev Geçmişi sekmesi, **W-15** veli Düzenle, **W-16** Daveti Yenile.
8. **W-8** web öğrenci ve veli Ödevler; ardından **W-9/W-10** (web gelen kutusu ve kulüpler). Bunlar mobil-öncelik kararıyla bekletilebilir.

**Dalga 3: ürün kararı gerekiyor (karar olmadan kod yazılmamalı)**

9. **M-2** Ayarlar'ın kapsamı: öneri "Güvenlik" = parola + tüm cihazlardan çık.
10. **W-1/W-27** Akademik Takvim: parçalardan salt okunur takvim mi, kaldırma mı?
11. **M-4, W-2…W-6, W-18** Finans: modül planı yoksa web grubunu ve veli Ödemelerim satırını kaldır.
12. **Y-8** veli görüşme saati, **Y-16** rozetler, **Y-17** "yeni not" tanımı, **W-13** öğretmen belgeleri, **W-17** tek veliye duyuru, **W-19/W-21/W-22** rapor kapsamları.

**Dalga 4: backend gerekli**

13. **Y-5** öğretmen self öğrenci sayısı, **Y-19** acil iletişim kişileri (değer nesnesi var, kalıcılık ve uç yok), **Y-23/W-25** e-posta kanalı, **W-23** rehberlik görüşmesi, **W-24** SMS/WhatsApp davet, **W-26** nöbet raporu dışa aktarma, **W-28** müsaitlik içe aktarma, **W-29** davet dışa aktarma.

---

## 7. Notlar

- **`core/account/logic.ts` yorumu bayat.** "Self-kapsamlı kaynağı olmayan satırlar (rehber sınıf, … şube adı, rehber öğretmen, kulüpler …)" ifadesi bugün geçerli değil: `ScheduleScopeDto` `homeroomClassRoomName` ve `homeroomTeacherName` taşıyor, `students/me/clubs/mine` var. "Kaynak yok" kararı verilmeden önce yeniden ölçülmeli (bkz. bellek: *karar öncesi yeniden ölçüm*).
- **`use-home-shell.ts:67` çağrısı `isPlanned` kısayollar için ölü.** Kart `disabled` olduğu için `/planned` ekranına hiç düşmüyor. Yalnız `href` ve `action` alanı olmayan, `isPlanned` de taşımayan bir kısayol olursa çalışır. Şu an böyle bir kısayol yok.
- **Kulüp başvuru inceleme ekranının "öğrenciye anında bildirilir" vaadi (KARAR sınıfı, REQ-008 ile eklendi; sayaçlara katılmadı).**
  - *İddia (REQ-001 ajanı):* boş durum metni "Karar verdiğin başvurular öğrenciye anında bildirilir." diyor, ama başvuru reddinde (onayda da) öğrenciye bildirim gönderen backend kodu doğrulanamadı.
  - *Metin:* danışman/idare başvuru inceleme ekranı, `apps/mobile/src/features/club/components/application-review-screen.tsx:84` (tasarım dalı; `oksis-ui` `master` ve `dev`'de `:56`). Öğrencinin kendi başvuru ekranında değil, kararı verenin ekranında.
  - *Ölçüm (`oksis-api` `master` @ `2b05d1b1`, kod okundu):* **bildirim VAR, iki yönde de.** `ClubMembership.Approve` ve `Reject` (`Oksis.Domain/Modules/Clubs/Entities/ClubMembership.cs:283`, `:314`) `ClubApplicationDecidedEvent` yayıyor. `ClubApplicationDecidedNotificationHandler.cs:45-72` başvuran öğrencinin hesabına `NotificationKind.ClubApplicationDecided` kuyruğa alıyor. Onayda "'X' kulübüne başvurun onaylandı.", retta "…başvurun kabul edilmedi." (gerekçe varsa ekleniyor). Katalogda portal + push açık (`NotificationEventTypeSeedData.cs:325-327`), push kitlesi `Student` (`PushEventKeyMap.cs:157`). Birim test de var (`ClubApplicationDecidedNotificationHandlerTests.cs`). `dev` dalı handler'a yalnız idare modu kapısı ekliyor, bildirim yolu aynı. REQ-001'deki "doğrulanamadı" tespiti yanlış.
  - *Kalan iki ince nokta:* (1) "Anında" uygulama içi bildirim için doğru. Push ise okulun sessiz saati açıksa sabaha erteleniyor (`PushNotificationChannel.cs:117-121`, bu tür muaf değil). (2) Bildirim yalnız öğrenciye gidiyor, veliye gitmiyor (handler'ın kendi gerekçesi: "kararı bilmesi gereken öğrencidir"). Metin de "öğrenciye" diyor, çelişki yok.
  - *Sonuç:* Metin bugün doğru, düzeltme **zorunlu değil**. Ürün kararı yalnız şu: sessiz saat ertelemesi yüzünden "anında" sözcüğü yumuşatılsın mı ("öğrenciye bildirim olarak gider"), veli de bilgilendirilsin mi? Biri seçilmezse madde kapanabilir.
- **Ekran doğrulaması yapılmadı.** Uygulama sırasında her madde Expo web hedefinde (mobil) ve tarayıcıda (web) gezilerek doğrulanmalı. Özellikle sayaçlarda boş ya da 404 durumu ("—" mi, "Belirtilmemiş" mi) ekranda görülmeli.
