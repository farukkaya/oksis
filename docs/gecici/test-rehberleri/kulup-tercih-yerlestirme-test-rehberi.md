# Kulüp Tercih Dönemi ve İdare Yerleştirmesi — Test Rehberi

**Hazırlandı:** 12 Ekim 2026 · kod henüz commit edilmemiş (`oksis-api-kulup-tercih` çalışma kopyası)
**Kapsam:** "Kulüp Üye Kabul Sorumlusu" ayarı, sihirbaz, tercih dönemi, öğrenci tercihi, idare yerleştirmesi, yayın, bildirimler
**Kaynak:** `teknik-analizler/kulupler/kulup-tercih-ve-yerlestirme-plani.md` (§3–§5, §9 kararlar, §11 notlar) · API duman testi: `postman/kulupler/`
**Biçim emsali:** `kulup-modulu-test-rehberi.md` (kulüp modülü temel akışları; burada tekrar edilmez)

Her senaryonun satırı: **[kod] başlık** — ön koşul · adımlar · beklenen · hesap. Hesaplar `@oksis.local`, parola hepsinde `Oksis1234!`.

---

## 1. Önce bunu oku

1. **Okul `s4` kullanılır.** Tercih ve yerleştirme uçtan uca `s4`'te ölçüldü (öğrenciler şubelere kayıtlı, danışman öğretmenler var). Kulüp seed'de YOKTUR; senaryolar kulüp açmakla başlar. Hızlı giriş (web ve mobil) okul seçicisinde `4 - OKSİS Test Lisesi`'ni sunar; parola alanına tıklamak bazı tarayıcı eklentilerinin katmanını açtığı için hızlı giriş tercih edilir.
   **Boş DB'de dikkat:** `s4` yapısı boş seed'lenir (`BareSchools`: kademe/şube/öğrenci kaydı yok) ve MEB kataloğu yüklü değilse `s1`–`s3` hiç seed'lenmez. Tercih kapsamı aktif öğrenci kaydından hesaplandığı için önce öğrenciler aktif sezona kaydedilmelidir (2026-10-13 koşusunda test DB'sine `academic.student_enrollments` satırı SQL ile eklendi, şubesiz). Aynı sebeple `s4`'te sezon sihirbazı "Sezonu Aç"ta "Okul için sınıf kademesi tanımlı değil" der; B3'ün aktivasyon ayağı kurulumsuz `s4`'te koşulamaz.
2. **İdare modu özellik bayrağının arkasındadır:** web `.env.local` içinde `NEXT_PUBLIC_FEATURE_CLUB_ADMINISTRATION_ADMISSION=enabled` yoksa sihirbazda "İdare" seçeneği görünmez (K-11). Bayrak değişince `next dev` yeniden başlatılır.
3. **Mod yalnız sezon aktivasyonunda yazılır.** Sihirbazda seçmek yetmez; sezon aktifleşene kadar okulun modu eski değerinde kalır. Aşağıdaki B bölümü bunu ölçer. İdare moduna geçmenin hızlı yolu test okulunda yeni sezonu sihirbazla açıp aktifleştirmektir.
4. **Öğrenci/veli yüzü mobildir**, idare/danışman yüzü web'dedir. Mobilde Expo web hedefi (`http://localhost:8081`) yeterlidir; sayfa yenilemek oturumu düşürür.
5. **Bildirim:** `s4` sezonu 15 Eylül 2026'da başladı; bildirim kutusunda görünür. Kuyruk birkaç saniye gecikebilir. Push gerçek cihazda ölçülmez (bkz. §10).
6. **Önce kaydeden önce** kuralı için tercihleri **arada 1-2 sn bırakarak** kaydet; kayıt anı milisaniye hassasiyetli ama aynı ana düşen kayıtta kimlik eşitliği bozar.

## 2. Hesaplar

| Rol | Hesap | Not |
| --- | --- | --- |
| İdare | `mudur.s4` | `clubs.manage`; web |
| İkinci idareci | `mudyrd.s4` (girişte profil seçimi ister: **Personel** seçilir) | N3 bildirimini alan kişi; bayat kayıt senaryosunda ikinci oturum |
| Danışman | `ogretmen.s4.07`, `ogretmen.s4.11` | Kulüp danışmanları |
| Danışmanı olmayan öğretmen | `ogretmen.s4.01` (girişte profil seçimi ister: **Öğretmen** seçilir) | Kapsam kapısı |
| Öğrenci | `ogrenci.s4.001` … `ogrenci.s4.020` | Mobil; 002 üye, 003 bekleyen başvurulu, 020 şubesiz hazırlanır |
| Veli | `veli.s4.005` | `ogrenci.s4.005`'in velisi |

## 3. Ortak hazırlık

- **H1.** `mudur.s4` ile 4 aktif kulüp aç: Robotik (kontenjan 2), Satranç (3), Müzik (**kontenjansız**), Resim (5); her birine farklı danışman. Danışmansız kulüp aktifleşmez (409 `Clubs.InvalidState`).
- **H2.** Bir taslak (danışmansız) kulüp bırak; tercih listesinde görünmemesi gerekir.
- **H3.** İdare modu senaryoları için okul İdare moduna alınmış olmalı (B3). Öğretmen modu senaryoları (A) önce, mod değişmeden koşulur.

---

## A. Öğretmen modu regresyonu (mod değişmeden, varsayılan)

- **[A1] Varsayılan mod Öğretmen** — ön koşul: yeni mod hiç seçilmemiş okul. Adım: web Ayarlar › Akademik Politikalar › "Kulüp Politikası" kartı. Beklenen: "Kulüp Üye Kabul Sorumlusu: Öğretmen", salt okunur; "Sezon açılırken seçilir" notu. Hesap: `mudur.s4`.
- **[A2] Başvuru/onay akışı bozulmadı** — `kulup-modulu-test-rehberi.md` A–C akışları (kulüp aç, öğrenci `:join`, danışman onay/ret, ayrılma). Beklenen: eskisi gibi; öğrenci keşfinde "Katıl" düğmesi var, banner yok. Hesap: `mudur.s4`, `ogretmen.s4.07`, `ogrenci.s4.005`.
- **[A3] Tercih/yerleştirme görünmez** — web Kulüpler başlığında "Tercih ve Yerleştirme" girişi YOK; API: `GET clubs/preference-round` ve `POST clubs/preference-round` 409 `Clubs.AdmissionByAdvisor`. Hesap: `mudur.s4`.
- **[A4] Kulüp formu eski hâlinde** — kulüp düzenleme çekmecesinde "Katılım Şekli" ve başvuru penceresi alanları görünür. Hesap: `mudur.s4`.
- **[A5] Danışman başvuru şeridi** — danışman panelinde "Bekleyen Başvuru" şeridi ve kulüp detayında "Başvurular" sekmesi var; mobil danışman başvuru ekranı açılır. Hesap: `ogretmen.s4.07`.

## B. Sihirbazda mod seçimi ve sezon aktivasyonu

- **[B1] Bayrak kapalıyken** — `NEXT_PUBLIC_FEATURE_CLUB_ADMINISTRATION_ADMISSION` tanımsız ya da `enabled` dışında bir değer. Adım: sezon sihirbazını aç. Beklenen: "Kulüp Üye Kabul Sorumlusu" alanı yok ya da yalnız Öğretmen; İdare seçilemez. Hesap: `mudur.s4`.
- **[B2] Bayrak açıkken seçim** — bayrak `enabled`, yeniden başlat. Adım: yeni sezon sihirbazı › **5/6 Öğrenciler** adımının altı ("Kulüp Üye Kabul Sorumlusu"); segment [Öğretmen | İdare]; her seçeneğin altında açıklama cümlesi; "İdare" seç; özet adımında seçilen mod görünür; taslağı kaydet, sayfayı yenile. Beklenen: seçim taslakta korunur (`GET season-drafts/current` → `clubAdmissionMode: "administration"`); önceki değer varsayılan gelir. Hesap: `mudur.s4`.
- **[B3] Mod aktivasyonda yazılır** — B2 sonrası sezon henüz **Setup**. Adım: Ayarlar kartına bak → hâlâ "Öğretmen" olmalı, eski sezonda başvuru akışı sürmeli (K-3). Sonra sezonu **aktifleştir**. Beklenen: aynı işlemde kart "İdare" olur (`GET school-settings/club-settings`); `:join` artık 409. Hesap: `mudur.s4`.
- **[B4] Mod sezon içinde değişmez** — aktif sezonda Ayarlar kartında düzenleme yok, sihirbaza bağlantı var; ayarı değiştirecek bir yazma ucu yok. Hesap: `mudur.s4`.
- **[B5] Sonraki sezona taşınma** — yeni bir taslak aç; sihirbazda önceki değer (İdare) varsayılan gelir; Öğretmen'e çevirip aktifleştirince mod geri döner ve **geçen sezonun** üyelik/başvuruları kendi sezonunda kalır. Hesap: `mudur.s4`.
- **[B6] Ayarı okuma izni** — `GET school-settings/club-settings` danışman öğretmen ve öğrenci hesabıyla 200 (`clubs.read`); idarenin mobil okul ayarlarında kart yok. Hesap: `ogretmen.s4.07`, `ogrenci.s4.005`.

## C. İdare modunda yüzler (dönem henüz yok)

- **[C1] Öğrenci: banner ve düğmeler** — Beklenen: mobil `/clubs` üstünde "Kulüplere yerleştirmeyi idare yapar."; kartlarda "Katıl" yok; kulüp detayında "Katıl" ve "Ayrıl" gizli; API `:join` 409 `Clubs.AdmissionByAdministration`, `:leave` 409. Hesap: `ogrenci.s4.005`.
- **[C2] Danışman** — panelde başvuru şeridi yerine "Bu sezon üyeleri idare yerleştirir" bandı; kulüp detayında "Başvurular" sekmesi yok; mobil `applications` girişi gizli; `:approve`/`:reject` 409. Hesap: `ogretmen.s4.07`.
- **[C3] İdare: kulüp formu** — "Katılım Şekli" ve başvuru penceresi gizli, "Bu sezon kabulü idare yapar" notu; kontenjan alanı kalır; mevcut değerler silinmemiş. Hesap: `mudur.s4`.
- **[C4] İdare: Kulüpler başlığı** — "Tercih ve Yerleştirme" girişi ve durum rozeti ("Dönem yok"). Hesap: `mudur.s4`.
- **[C5] Veli** — yeni ekran yok; kulüp ekranında tercih süreci/banner görünmez. Hesap: `veli.s4.005`.
- **[C6] Kulüpsüz öğrenci uyarısı** — hazırlık kontrolünde "kulüpsüz öğrenci" uyarısında yerleştirme ekranına bağlantı var. Hesap: `mudur.s4`.

## D. Tercih dönemi yaşam döngüsü (web, `mudur.s4`)

- **[D1] Oluştur** — `/clubs/placement` › "Tercih dönemi oluştur"; hedef son gün 8 gün sonrası. Beklenen: durum **Hazırlık**; sayfada yalnız Hazırlık düğmeleri (Tercihe Aç, Sil). Öğrenci mobilinde dönem **görünmez** (`ogrenci.s4.005` banner'ı hâlâ "idare yapar"; `GET students/me/clubs/preference` Hazırlık için boş/kapalı).
- **[D2] Tekillik** — ikinci dönem oluşturmayı dene (API: `POST` 409 `Clubs.PreferenceRoundExists`); UI'da oluştur düğmesi yok.
- **[D3] Hedef son gün** — düzenle; geçmiş tarih reddedilir; tarih geçince "Kapatmayı unutmayın" rozeti çıkar ve dönem **kendiliğinden kapanmaz** (K-15/K-16; gerçek tarih geçişini beklemeden hedef gününü yakın bir güne alarak ölç).
- **[D4] Sil** — Hazırlık dönemi sil → kaybolur; yeniden oluştur. Açılmış dönemde Sil düğmesi yok (API 409).
- **[D5] Tercihe Aç** — onay diyaloğu "N öğrenciye bildirim gidecek" der; onayla. Beklenen: durum **Tercihe açık**; hedef son gün öğrenciye görünür; N1 bildirimi (bkz. §H).
- **[D6] Canlı izleme** — KPI: kapsamdaki / tercih yapan / yapmayan sayısı; kulüp talep tablosu 1./2./3. tercih sayıları ve talep/kontenjan; taşan kulüp kırmızı rozet; "Tercih yapmayanlar" listesi şube süzgeçli ve tutarlı (yapan + yapmayan = kapsam).
- **[D7] Tercihi Kapat** — onayla. Beklenen: **Kapalı**; öğrenci ekranı salt okunur; ikinci kapatma yok/409.
- **[D8] Yeniden Aç (yayın öncesi)** — Kapalı dönemde "Yeniden Aç"; durum Açık; öğrenci yeniden tercih kaydedebilir; yeni bir N1 bildirimi gider (aynı jestin tekrarı değil, yeni açılış).
- **[D9] Yayından sonra yeniden açılamaz** — D-bölümü yayından sonra (bkz. §G) `:open` 409; UI'da düğme yok.

## E. Öğrenci tercihi (mobil, dönem **Tercihe açık**)

- **[E1] Tercih ekranı** — `ogrenci.s4.005`: banner "Tercih dönemi açık · Tercih Et" (son gün yazılı); `/clubs/preference`: üç slot (1./2./3. tercih), slota dokununca kulüp listesi (kategori, danışman, yer, kontenjan); başka slotta seçili kulüp pasif; taslak/pasif kulüp listede yok; ekranda "kontenjanı dolan kulüplerde önce kaydedenler önce yerleşir" ifadesi.
- **[E2] Sıra ve kayıt** — ok düğmeleriyle sıra değiştir, Kaydet → "Tercihin kaydedildi · SS:DD"; banner "Tercihin kaydedildi · Düzenle" olur.
- **[E3] Önce kaydeden kuralı** — `ogrenci.s4.005` ve `.006` aynı 1. tercih (kontenjan 2'li Robotik) ile, 1-2 sn arayla; üçüncü olarak `.007` de ekle. Kapatıp otomatik yerleştirince (§F2) ilk ikisi Robotik'e, sonuncu 2. tercihine düşer.
- **[E4] Değişince sıra yenilenir uyarısı** — kayıtlı tercihi değiştirirken kayıttan önce "Değiştirirsen sıradaki yerin yenilenir" uyarısı çıkar. Sonra `.005` listeyi değiştirip kaydeder → yerleştirmede `.005` artık `.006`'dan SONRA gelir (kayıt anı yenilendi). Aynı listeyi değiştirmeden yeniden kaydetmek de anı yeniler (ölçülen davranış; API ile doğrula).
- **[E5] Doğrulamalar** — aynı kulüp iki slotta: reddedilir; 4 kulüp: reddedilir; taslak kulüp: reddedilir; aktif kulüp sayısı 3'ten azsa o kadar kulüp seçilebilir.
- **[E6] Üye öğrenci tercih yapamaz (K-5)** — `ogrenci.s4.002` (üye): ekranda "X kulübünün üyesisin", tercih kaydı yok (`canSubmit=false`, PUT reddedilir). Bekleyen başvurulu öğrenci (`.003`) ve kapsam dışı öğrenci (`.020`) de yapamaz.
- **[E7] Kapalı dönemde salt okunur** — D7 sonrası: slotlar kilitli, Kaydet yok, PUT 409 `Clubs.PreferenceRoundNotOpen`.
- **[E8] Veli tercihi görmez (K-8)** — `veli.s4.005` ne banner ne tercih ekranı görür.
- **[E9] Kulüp detayı** — "Katıl"/"Ayrıl" yok; (isteğe bağlı kısa yol) dönem açıkken "Tercih listeme ekle" boş slota ekler.

## F. Hatırlatma ve yerleştirme taslağı (web, `mudur.s4`)

- **[F1] Hatırlatma** — dönem açıkken en az bir öğrenci tercih yapmamış: "Tercih yapmayanlara hatırlat". Beklenen: yalnız tercihi **kaydetmemiş** öğrencilere N2; tercih yapana gitmez; aynı gün ikinci basış 409 `Clubs.PreferenceReminderAlreadySent`, düğme gerekçeyle pasifleşir; kapalı dönemde hatırlat yok.
- **[F2] Otomatik yerleştir** — dönem **kapalıyken** (açıkken de taslak çalışır, F6) `/clubs/placement/[roundId]` › Otomatik Yerleştir çekmecesi: "Elle düzenlenenleri koru" (varsayılan açık), "Yerleşmeyenleri boş kontenjanlara dağıt". Uygula. Beklenen: özet "%a 1. tercih, %b 2., %c 3., N yerleşmedi"; kontenjan aşılmaz; tabloda eşleşme rozeti ve kaynak "oto"; tercihsiz öğrenci "tercih yok · yerleşmedi".
- **[F3] Evren** — tabloda kapsamdaki **bütün** öğrenci vardır (tercih yapmamış dâhil); üyeliği olanlar "mevcut üye" olarak ayrıdır ve düzenlenemez.
- **[F4] Dağıt seçeneği** — "Yerleşmeyenleri dağıt" açık: önce kontenjanlı kulüpler dolar, kontenjansız Müzik en sona kalır; herkes tek kulübe yığılmaz.
- **[F5] Elle düzeltme** — bir öğrencinin kulübünü `SelectBox` ile değiştir; satır kendiliğinden **kilitlenir** (kilit simgesi, kaynak "elle"). Otomatik yerleştirme "koru" açıkken bu satıra dokunmaz; kapalıyken dokunur. Kulüp panelinde kalan kontenjan anında güncellenir.
- **[F6] Dönem açıkken** — Otomatik ve Kaydet çalışır; **Yayınla** "önce tercihi kapatın" gerekçesiyle kapalı (API `:publish` 409 `Clubs.PublishWhileOpen`).
- **[F7] Kontenjan aşımı uyarısı (K-7)** — Robotik (2) kulübüne elle 3. öğrenciyi ata. Beklenen: sağ panelde turuncu "3/2" uyarısı, engel değil; kulüp kartı "dolu"; otomatik yerleştirme aynı kulübü aşmaz.
- **[F8] Süzgeçler ve toplu atama** — yerleşmedi / tercih yok / 2-3. tercih / kulüp / şube / değişmiş süzgeçleri; çoklu seçip "Seçilenleri … kulübüne ata"; kulübe tıklamak tabloyu süzer.
- **[F9] Kaydet kalıcıdır** — değişiklik yap, Kaydet, sayfayı kapat/aç: taslak duruyor, "Yayınlanmamış N değişiklik" rozeti var. Kaydetmeden ayrılırken uyarı çıkar. Taslak kimseye bildirim üretmez.
- **[F10] Bayat kayıt (eşzamanlılık)** — iki oturum (`mudur.s4`, `mudyrd.s4`) aynı ekranı açar; biri Kaydet, diğeri eski sürümle Kaydet/Yayınla → "Başka bir yönetici değiştirdi, yenileyin" (409 `Clubs.PlacementStale`); yenileyince çalışır.

## G. Yayın ve yayın sonrası

- **[G1] Yayın önizlemesi** — Yayınla modalı: yeni üyelik, değişen, çıkarılan, yerleşmeyen sayıları; **aşan kulüpler** listesi (F7'deki "3/2"); bildirim gidecek kişi sayısı. Önizleme sayıları sonraki gerçek sonuçla birebir tutmalı.
- **[G2] Yayınla** — onayla. Beklenen: durum **Yayınlandı**; yerleşen öğrencilerin üyeliği **Aktif** doğar, kulüp sayaçları güncellenir, kontenjan aşımına rağmen yayın geçer; öğrenci mobilinde "X kulübüne yerleştirildin" (kaçıncı tercih), Kulüplerim'de kulüp, "Ayrıl" gizli; velide çocuğun kulübü görünür.
- **[G3] Tekrar yayın / değişiklik yok** — hemen tekrar Yayınla: değişiklik yok, bildirim üretilmez; aynı rowVersion'la tekrar çağrı çift bildirim yapmaz.
- **[G4] Tek üyelik çatışması** — önizlemede bir öğrenci başka bir yoldan üye olmuşsa `blockers` listelenir ve yayın tümüyle durur (409 `Clubs.PlacementConflict`); kısmi yayın olmaz.
- **[G5] Yayın sonrası elle yerleştirme** — yerleşemeyen/sonradan gelen öğrenciyi ata ve Yayınla: ekranda "taslak ≠ yayın" rozeti; önizleme yalnız **farkı** gösterir; yalnız o öğrenci etkilenir.
- **[G6] Kulüp değiştirme ve çıkarma** — yayınlanmış öğrenciyi başka kulübe al: eski üyelik **Left**, yenisi Active; kulübü boşalt (`clubId` null): üyelik Left.
- **[G7] Yayınlanmış satır otomatik yerleştirmede korunur** — yayından sonra Otomatik Yerleştir (koru kapalı): yayınlanmış öğrenciler kulüpte kalır ve doluluğa girer; yalnız yayınlanmamış/sonradan gelen öğrenciye dokunur (§11).
- **[G8] Sonradan gelen öğrenci** — okula yeni öğrenci kaydet: yerleştirme tablosunda kendiliğinden "tercih yok · yerleşmedi".
- **[G9] Kulüp saati hizalaması** — kulüp saati olan okulda yayın sonrası aynı gün kulüp saati yoklamasında yeni üyelerin görünmesi beklenir; bugünkü hizalama yayınla tetiklenir (bilinen sınır: §10).

## H. Bildirimler — hangi aşamada kime ne

Kontrol: alıcının bildirim kutusu (mobil/web) veya `notifications.notifications` tablosu (`kind` 54–59). Veliye yalnız sonuç gider.

| # | Tetik | Alıcı | Beklenen | Push varsayılanı |
| --- | --- | --- | --- | --- |
| **[H1] N1** | Tercihe Aç (ve Yeniden Aç) | kapsamdaki, üyeliği olmayan öğrenciler | "Kulüp tercih dönemi açıldı" (+ son gün); tercih ekranına açılır; üye öğrenciye ve veliye gitmez | Açık |
| **[H2] N2** | Hatırlat | yalnız tercihini kaydetmemiş öğrenciler | "Kulüp tercihini henüz yapmadın"; tercih yapana ve veliye gitmez; aynı gün ikinci kez yok | Açık |
| **[H3] N3** | Tercihi Kapat | diğer idareciler (`mudyrd.s4`); kapatan kendisi **almaz** | "N öğrenciden M'si tercih yaptı. Yerleştirme bekliyor." → yerleştirme ekranı | Kapalı |
| **[H4] N4** | Yayın — yerleşen | öğrenci + veli | öğrenciye "…yerleştirildin (1. tercihin)"; veliye çocuk adıyla; kulüp detayına/çocuğun kulüp ekranına açılır | Açık |
| **[H5] N5** | Yayın — yerleşmeyen | yalnız öğrenci (**ayrı tür** `ClubPlacementUnplaced`) | "Kulüp yerleştirmen henüz tamamlanmadı"; veliye gitmez; push kapatılabilir ayrı anahtardır | Kapalı |
| **[H6] N6** | Yayın — danışman | giren/çıkan kulüplerin danışmanı | "Kulübünüze N öğrenci yerleştirildi" → danışman paneli | Kapalı |
| **[H7] N7** | Yayın sonrası değişiklik | yalnız kulübü yeni/değişen/çıkarılan öğrenci + velisi; ilgili danışmanlar (+1/−1) | "Kulübün değişti" vb.; etkilenmeyen öğrenciye gitmez | Açık (danışman kapalı) |

Ek kontroller:
- **[H8] Bildirim üretmeyenler:** öğrencinin tercih kaydetmesi, idarenin Kaydet ve Otomatik jestleri, mod değişimi — hiçbir bildirim doğmaz.
- **[H9] Tekrarlanmama:** aynı yayının tekrarı/retry'ı çift bildirim üretmez (olay kimliği `round+student+publishVersion`); yeniden açılan dönem yeni "açıldı" bildirimi üretir.
- **[H10] Bildirim yönlendirmesi:** web'de N3/N6/N7 danışman kolu doğru sayfaya, mobilde N1/N2/N5 tercih ekranına, N4/N7 kulüp detayına, veli çocuğun kulüp ekranına gider.
- **[H11] Bildirim tercihleri:** mobil Bildirim Tercihleri listesinde yeni kulüp anahtarları (tercih dönemi, hatırlatma, kapandı, yerleştirme, yerleşmedi, danışman özeti) etiketleriyle görünür ve kapatılabilir.

## I. Yetki ve kapsam kapıları

| Kim | Ne | Beklenen |
| --- | --- | --- |
| Öğretmen (`clubs.manage` yok) | `GET/POST clubs/preference-round`, yerleştirme uçları | **403** |
| Öğrenci | idare dönem/yerleştirme uçları | **403** |
| İdare | `students/me/clubs/preference` (öğrenci ucu) | beklenen ret (öğrenci hesabı gerekir) |
| Öğrenci | Hazırlık dönemi tercih kaydı | 409/boş; dönem görünmez |
| İdare | Hazırlık dışı dönemi silme | **409** |
| Başka okul (`s3`) idaresi | `s4` dönem id'si ile `overview`/`placements` | **404** (tenant izolasyonu) |
| Danışmanı olmayan öğretmen | kulüp detayı | **404** |

---

## 10. Bilinen sınırlar — kusur sanma

1. **Kulüp saati hizalaması:** yayın bugünün hizalamasını tetikler; ancak kulüp saati olmayan okulda etkisi gözlenmez ve ders programı hizalama sonucunu elle görmek gerekir. Yayın sonrası ertesi gün hizalamasının da yeni üyeleri kapsadığı ayrıca doğrulanmalı (G9).
2. **Gerçek push yok:** FCM/APNs cihaz teslimi bu rehberde ölçülmez; yalnız bildirim kaydı, uygulama içi kutu ve push **varsayılan** değerleri doğrulanır.
3. **Tek dönem:** sezonda ikinci tercih dönemi yoktur (K-6); sonradan gelen için tek yol elle yerleştirmedir.
4. **Tercih sayısı 3, sabit** (K-12).
5. **Kontenjan yalnız elle aşılır** (K-7); otomatik yerleştirme aşmaz. Kontenjansız kulüp "sonsuz" sayılsa da dağıtımda en sona bırakılır.
6. **Tarih bilgidir:** hedef son gün dönemi kapatmaz/açmaz; zamanlanmış iş yoktur.
7. **Öğrenci kendisi ayrılamaz** (K-9); veli süreci görmez (K-8).
8. **Sürükle-bırak yok** (MVP); mobilde sıra ok düğmeleriyle.
9. **Mobilde idare kulüp ekranı `PlannedScreen`;** sihirbaz, dönem ve yerleştirme yalnız web.
10. **Excel çıktısı** (`placements:export`, K-13) bu sürümde yok (D8).
11. **Mod değişimi için sezon aktivasyonu gerekir;** Setup sezonunda taslak seçimi okul ayarını değiştirmez (§11).
12. **Bellek içi test DB** kısıtı zorlamaz; tekil indeks ve tek işlemli yayın iddiaları yalnız gerçek SQL entegrasyon testinde ölçülür (`--integration`).

> **Doğrulama notu (2026-10-12, API 5212):** dönem uçları öğretmen, öğrenci ve veli hesabında 403, müdürde 200 döndü; `mudyrd.s4` ve `ogretmen.s4.01` hesapları var, ikisi de girişte profil seçimi ister.
