---
tags: [teknik-analiz, ders-programi, kulupler]
tarih: 2026-09-25
durum: uygulandı (2026-09-26, dal feat/kulup-saati, commit bekliyor) — açık: E-34 (devamsızlığa yansıma, ürün kararı)
karar: Y-06
---

# Kulüp Saati — Tasarım

> **Karar:** `Y-06` ([[OKSİS - Yapısal Kararlar ve Eksikler]]) · **İlgili:** `Y-05` (sabit yerleşim
> kuralı, sınıf rehberliği dersi türü — [[sinif-rehberligi-dersleri-ve-sabit-yerlesim]]), `K-15`
> (ders dışı yük; `K-15/3` kulüp saati için revize edildi), `K-13` (öğretmen kapasitesi)

## 1. Sorun

Altınay'da 9 ve 10. sınıflarda Perşembe son saat **kulüp saati**. O saatte öğrenci şubesiyle değil,
üye olduğu kulüple, kulübün danışman öğretmeniyle ve kulübün yerinde (derslik, laboratuvar) bulunur.

Bugün:

- Katalogda "Kulüp" sıradan bir **branş dersi** (`SubjectTeachingMode.Branch`). Üretici bu yüzden
  her şubeye bir öğretmen atar: 9-B'nin Perşembe son saatinde "Kulüp — Zuhal Karaca Kaya" yazar.
  Bu gerçeği yansıtmaz. Zuhal Hanım o saatte kendi kulübündedir, 9-B'nin öğrencileri ise farklı
  kulüplere dağılmıştır.
- Kulüpler modülü (kulüp, danışman, üyelik) ile Ders Programı arasında hiçbir bağ yok.
- Kulüp kaydında yer alanı yok (etkinlikte var: `ClubActivity.Location`).
- Bir öğrencinin aynı sezonda birden fazla kulübe üye olması engellenmiyor.

## 2. Kararlar (2026-09-25, kullanıcı)

1. **Kapsam okula göre değişir.** Altınay'da yalnız 9 ve 10'da uygulanır, başka bir okul 9, 10 ve
   11'de uygulayabilir. Kulüp saatinin hangi sınıf düzeyinde olduğunu müfredat belirler.
2. **Danışmanlığı olmayan öğretmen o saatte boştur.** Başka bir sınıf düzeyine ders alabilir.
3. **Öğrenci bir sezonda en fazla bir kulübe üye olur.**
4. **Yoklamayı kulüp danışmanı alır**, kendi üyeleri üzerinden.
5. **Kulüp saati öğretmenin yük yüzdesine girer** (`K-15/3` revizyonu). Programdaki kulüp saati
   yerleşimi, danışman öğretmenin ders saati gibi sayılır: yük yüzdesinin payına ve aşım rozetine
   girer. Katsayılı "kulüp danışmanlığı" ders dışı yük satırı bilgi olarak kalır ve yüzdeye girmez.
   Böylece aynı iş yüzdede iki kez sayılmaz.
6. **Kulüp saati olan sınıflarda her öğrenci bir kulübe üye olmak zorundadır.**
7. **Bir öğretmen en fazla bir kulübün danışmanı olur** (sezon başına).
8. **Bir kulübün tek öğretmeni vardır** (bugünkü tek danışman alanı yeterli).
9. **Kulüp saati yoklaması etkinlik modeliyle alınır** (§7 seçenek a) ve **öğrencinin
   devamsızlığına yansır.**
10. **Kulübe yalnız kulüp saati olan sınıfların öğrencileri başvurabilir** (seçenek B). Okul kulüp
    saatini programa koyduysa, sınıfında kulüp saati olmayan öğrenci (Altınay'da 11 ve 12) kulüpleri
    keşfet ekranında görmez ve başvuru ucu reddeder. Kulüp saati hiç yoksa kısıt uygulanmaz, herkes
    başvurur. Kuralın kaynağı müfredat ve programdır; kulübe ayrıca sınıf alanı eklenmez.

## 3. Model

### 3.1 Ders türü: `SubjectTeachingMode.Club`

`Branch` ve `Homeroom`'un yanına üçüncü tür. `Y-05`'teki sınıf rehberliği türünün kurgusunu izler:

| | Branş | Sınıf rehberliği (`Y-05`) | Kulüp (`Y-06`) |
|---|---|---|---|
| Şube hücresinin öğretmeni | yetkinlikten | şubenin rehber öğretmeni | **yok**: hücrede "Kulüp Saati" yazar |
| Öğretmen tarafı | şube dersi | şube dersi | danışmanlığı olan her kulüp |
| Not / karne | var | yok | yok |
| Yoklama | şube | şube | **kulüp üyeleri, danışman alır** |

Şubenin kulüp satırı öğretmensizdir ama **eksik değildir**. `AssignmentLine.IsPlaceable` bugün ders
ve öğretmen ister; kulüp satırı için öğretmensiz yerleşime izin veren ayrı bir durum gerekir.
"Öğretmen atanmamış" nedeniyle eksik saat üretmemelidir.

### 3.2 Konum: `Y-05` sabit yerleşim kuralı

Yeni bir kavram gerekmez. Altınay'da: *Kulüp · Perşembe · son ders · kapsam = sınıf düzeyi 9 ve
10*. Kulüp saati bütün kapsamdaki şubelerde **aynı anda** olmalıdır, çünkü öğrenciler şubeler
arası karışır. Kapsamdaki bir şubede kulüp saati farklı bir yere düşerse bu bir **engeldir**,
uyarı değil.

### 3.3 Kulüp: yer (öneri, onay bekliyor)

Serbest metin yerine okulun **derslik kataloğuna** bağlanır: `Club.RoomId` (isteğe bağlı,
`academic.rooms`'a kimlikle). Derslik kataloğu Ayarlar → Derslikler'de zaten var ve şube ev
dersliği aynı kataloğu kullanıyor (`ClassRoom.RoomId`). Katalog bağı iki kulübün aynı saatte aynı
laboratuvara düşmesini yakalamayı mümkün kılar; serbest metinde "Fen Lab" ile "fen lab." aynı yer
sayılmaz.

**Kullanıcıya nerede sorulur:** Yeni Kulüp Sihirbazı'nın ilk adımında (Kulüp Bilgisi) **"Kulüp
saati yeri"** alanı. Aranabilir SelectBox. Seçenekler derslik kataloğundan, türüyle birlikte
("Fen Laboratuvarı · Laboratuvar"). Alan isteğe bağlı; boş bırakılırsa:

- Kulüp detayında ve öğrenci/öğretmen programında yer "Belirtilmedi" görünür.
- Hazırlık kontrolünde uyarı olur (§8), engel değil.

Kulüp detay sayfası ve düzenleme de aynı alanı gösterir. Katalogda aradığı yer yoksa kullanıcı
Ayarlar → Derslikler'den ekler. Sihirbazdan derslik oluşturma yok; katalog tek yerden yönetilir.

Altınay'da bugün 12 derslik var, hepsi "Derslik" türünde; laboratuvar ve atölye tanımlı değil.

### 3.4 Tek üyelik

Aynı sezonda öğrencinin ikinci **aktif ya da bekleyen** üyeliği sunucuda reddedilir. Kural
yalnız ekranda uygulanmaz (`TB-32` dersi). Mevcut veride çift üyelik varsa göç öncesi ölçülür ve
raporlanır.

## 4. Üretici ve çakışma

- Kulüp satırı şubede sabit kuralla yerleşir, öğretmen tüketmez.
- **Danışman meşguliyeti (zorunlu kısıt).** Sezonda aktif kulübü olan her danışman, kulüp saati
  diliminde **meşgul** sayılır. Kapsam dışı bir sınıf düzeyine (Altınay'da 11 ve 12) o saatte ders
  alamaz. Kısıt yalnız o dilimi kapatır, öğretmenin diğer saatleri etkilenmez.
- Danışmanlığı olmayan öğretmen o dilimde boştur ve kapsam dışı şubelere yerleşebilir (karar 2).
- Toplu üretimde kısıt, yayındaki programlar ve aynı partide üretilenler için aynı biçimde
  uygulanır (`B-74` kararı).
- Kulüp saati diliminde kapsamdaki şubelerin başka bir dersi olamaz. Bu zaten sabit kuralın
  sonucudur.

## 5. Yük ve kapasite (`K-15/3` revizyonu)

- **Yüzdenin payı** = öğretmenin yayındaki ders yerleşimleri + danışmanı olduğu kulüplerin
  programdaki kulüp saati yerleşimleri. Kulüp saati bir kez sayılır. Danışmanı olduğu tek kulüp
  için haftada 1 kulüp saati = 1 saat.
- Aşım rozeti aynı paydan hesaplanır.
- Katsayılı ders dışı yük satırı (`ClubAdvisorNonTeachingHours`, varsayılan 2) değişmeden bilgi
  olarak görünür, yüzdeye girmez.
- Kulüp saatini programa koymayan okulda davranış bugünküyle aynıdır.
- Bir öğretmen tek kulübün danışmanı olduğu için (karar 7) danışman aynı dilimde iki yerde
  olamaz. Kural Kulüpler modülünde sunucuda zorlanır: aynı sezonda ikinci aktif kulübe danışman
  atanamaz.

## 6. Görünümler

- **Şube programı:** hücre "Kulüp Saati", öğretmen ve yer boş.
- **Öğretmen programı:** "Kulüp · {kulüp adı} · {yer}". Danışmanlığı olmayan öğretmende dilim boştur.
- **Öğrenci programı:** üye olduğu kulübün adı ve yeri; üyelik yoksa "Kulüp seçilmedi" uyarısı.
- **Veli:** öğrenci görünümüyle aynı.

## 7. Yoklama

- Şube yoklamasında kulüp saati **görünmez**. Görünürse öğrenci aynı saat için iki kez yoklamaya
  girer.
- Danışman, kulüp saati diliminde kendi kulübünün **üye listesiyle** yoklama alır.
- **Kayıt modeli (karar 9, seçenek a):** yayındaki programda kulüp saati olan her hafta için
  her aktif kulübe bir **kulüp saati etkinliği** otomatik açılır; tarih ve saat programdaki dilimden,
  yer kulübün yerinden gelir. Aktif üyeler katılımcı olarak kayıtlı doğar. Danışman mevcut
  etkinlik yoklama ekranını kullanır.
- Bu etkinlik sıradan etkinlikten ayrışır: türü "kulüp saati"dir, öğrenci kaydını geri çekemez,
  kontenjan kapısı işlemez, yönetici elle silemez.
- Etkinliği kim açar: arka plan işi. Kural `arka-plan-isinde-izin-kapisi` notundaki gibi, izin
  kapılı kullanıcı komutu yerine sistem komutu ikizi yazılır.
- Tatil ve iptal günlerinde etkinlik açılmaz (okul takvimi).
- **Devamsızlığa yansır (karar 9):** "gelmedi" işareti öğrencinin devamsızlık kaydına o ders saati
  için yazılır. Şube yoklamasıyla aynı devamsızlık sayacını besler. Bağın nasıl kurulacağı (yoklama
  modülüne olay mı, ortak kayıt mı) uygulama diliminde yoklama modülü okunarak belirlenir.

## 8. Hazırlık kontrolleri (yayın ve sezon)

| Kontrol | Tür |
|---|---|
| Kulüp saati olan sınıflarda hiçbir kulübe üye olmayan öğrenci ("9 ve 10'da 14 öğrenci kulüpsüz") | uyarı |
| Kulüp saati olmayan sınıftaki bir öğrencinin kulüp üyeliği (o saatte dersi var) — yeni başvuru karar 10 ile engellenir; uyarı, kural gelmeden önce alınmış ya da şube değişikliğiyle kapsam dışına düşmüş üyelikler için | uyarı |
| Aktif kulübü olup danışmanı olmayan kulüp | uyarı |
| Kulüp saati yeri belirtilmemiş kulüp | uyarı |
| İki kulübün aynı derslikte olması (kulüp saati aynı dilimde) | uyarı |
| Kapsamdaki şubelerde kulüp saatinin aynı dilimde olmaması | **engel** |
| Danışmanın kulüp saati dilimine kapsam dışı şubeden ders yerleşmesi | **engel** |

## 9. Açık kararlar

1. ~~§3.3 yer alanının derslik kataloğuna bağlanması~~ — onaylandı (2026-09-25, "Uygula") ve uygulandı.
2. **`E-34`** · Kulüp saati "gelmedi" işaretinin devamsızlığa nasıl yazılacağı (gün eşdeğeri paydası, mazeret, düzeltme
   penceresi, veli bildirimi) — ürün kararı bekliyor; §11 dilim 6.

## 10. Uygulama dilimleri (öneri)

1. **Kulüpler:** tek üyelik + tek danışmanlık kuralları, `Club.RoomId` ve sihirbaz alanı, göç öncesi
   çift üyelik ve çift danışmanlık ölçümü.
2. **Katalog:** `SubjectTeachingMode.Club`; müfredat ekranında tür seçimi.
3. **Talep ve üretici:** öğretmensiz kulüp satırı, danışman meşguliyet kısıtı, eksik saat hesabının
   kulüp satırını eksik saymaması.
4. **Görünümler:** şube, öğretmen ve öğrenci programı.
4a. **Başvuru kapsamı (karar 10):** keşfet ve başvuru uçları öğrencinin sınıfında kulüp saati olup
   olmadığına bakar; yoksa kulüp görünmez, başvuru reddedilir (sunucu kuralı, gerekçe metniyle).
5. **Yük:** kulüp saati yüzdeye girer (`K-15/3` revizyonu), rapor ve rozet.
6. **Yoklama:** haftalık kulüp saati etkinliği (arka plan işi) + devamsızlığa yansıma.
7. **Hazırlık kontrolleri:** §8.

Altınay'da doğrulama: 9 ve 10'da kulüp saati Perşembe son ders; 11 ve 12'de o dilime danışman
yerleşmiyor.

## 11. Uygulama notları (2026-09-26, dal `feat/kulup-saati`, commit bekliyor)

**Dilim 1 · Kulüpler — uygulandı.** `Club.RoomId` (isteğe bağlı, `academic.rooms` FK, göç `20260925_club_room`); aktif derslik
denetimi sunucuda, silinen derslik kulüpte kullanılıyorsa silme reddedilir (`B-78` ayağı). Kurallar `ClubSeasonRules`'ta:
tek aktif danışmanlık (oluşturma, düzenleme/danışman değişimi, taslağın aktifleşmesi, yeniden aktifleştirme; pasif kulüp sayılmaz)
ve tek canlı üyelik (bekleyen/aktif/askıda; `:join` ve onayda). Keşif ve detay aynı engeli `closed` + gerekçe notuyla gösterir,
uç aynı cümleyle 409 döner. Göç öncesi ölçüm: dev DB'de çift canlı üyelik **0**, çift aktif danışmanlık **0** (Altınay 6 kulüp).
Web: sihirbazın ilk adımında "Kulüp saati yeri" (ortak `SelectBox`, aranabilir, "Ad · Tür", "Belirtilmedi"), düzenleme aynı
alanı, detay başlığı "Kulüp saati yeri: …" gösterir.

**Dilim 2 · Katalog — uygulandı.** `SubjectTeachingMode.Club` (kolon metin, göç gerekmedi). Ders formunda "Kulüp saati"
anahtarı sınıf rehberliği anahtarının yanında; ikisi birbirini kapatır. Liste rozeti "Kulüp saati". Not süzgeci
(`GradedPlacements.WhereGraded`) kulüp saatini de düşürür.

**Dilim 3 · Talep ve üretici — uygulandı.** `LessonPlacement.TeacherId` artık `null` olabilir (göç `20260925_club_hour_placement`:
kolon nullable, `ux_placement_teacher_slot` filtresine `teacher_id IS NOT NULL`). Talep satırı `AssignmentLine.IsClubHour`
(öğretmensiz, `IsPlaceable`, eksik sayılmaz). Kulüp saati yalnız sabit kuralla konumlanır (`FixedPlacementPlanner` öğretmensiz,
yersiz basar); kuralı olmayan saat çözücüye gitmez, `ClubHourWithoutRule` gerekçesiyle eksik sayılır. Danışman meşguliyeti:
kulüp saati dilimleri (dönemin canlı kulüp hücreleri + partide basılanlar) × sezonda aktif kulübü olan danışmanlar üretimde
müsaitlik engeline eklenir, sabit plan yeniden kurulur. Aynı kısıt editör uçlarında: yerleştir/taşı/öğretmen ata reddeder
(`advisor-busy-club-hour`), ön kontrol, uygun öğretmenler, dış doluluk, vekil ve vekil adayları. Kulüp hücresine öğretmen
atanmaz, vekil/etüt/istisna uygulanmaz.

**Dilim 4 · Görünümler — uygulandı.** Şube: "Kulüp Saati", öğretmen ve yer boş (editör + yayınlanmış görünüm, `IsClubHour`).
Öğretmen: danışmanı olduğu aktif kulüp için "Kulüp · {ad}" + yer (`AdvisedClubHour`, tatil/dönem dışı gün hariç), satır o haftanın
kulüp saati etkinliğine bağlanır (yoklama kısayolu). Öğrenci/veli: üye olduğu kulüp, danışmanı, yeri ("Belirtilmedi");
üyelik yoksa "Kulüp seçilmedi".

**Dilim 4a · Başvuru kapsamı — uygulandı.** `ClubHourScope`: okulda canlı kulüp saati varsa, kayıt satırındaki şubesinde kulüp
saati olmayan öğrenci keşifte hiç kulüp görmez, `:join` "Sınıfınızın programında kulüp saati yok…" ile 409. Kulüp saati yoksa kısıt yok.

**Dilim 5 · Yük — uygulandı.** `TeacherClubHourLoad`: yükü belirleyen dönemin kulüp saati dilim sayısı × aktif danışmanlık
`TotalWeeklyHours`'a eklenir (yüzde + aşım); `ClubHourWeeklyHours` ayrıca döner. Ders yükü projeksiyonu kulüp hücrelerini
dışlar (çift sayım yok). Katsayılı "Kulüp danışmanlığı" satırı bilgi olarak kalır. Yayın önizlemesindeki kapasite aşımı da
kulüp saatini sayar.

**Dilim 6 · Yoklama — kısmen.** `ClubActivity.Kind` (`ClubHour`, göç `20260925_club_hour_activity`, kulüp × başlangıç için filtreli
tekil dizin). Sistem komutu `OpenClubHourActivitiesCommand` (izin kapısı yok) + `OpenClubHourActivitiesJob` (her gün 06:20,
okul başına tenant): bugünden cumaya, okul günü olan ve zil şablonunda ders olan kulüp saati dilimleri için her aktif kulübe
yayında doğan, kontenjansız etkinlik; ardışık saatler tek etkinlik; aktif üyeler kayıtlı, başlamamış etkinlikte üye listesi
izlenir. Öğrenci kaydı geri çekemez ve ayrıca kayıt olamaz; danışman "kayıt iptali" işaretleyemez; etkinlik elle iptal
edilemez (domain). Şube yoklaması (`SessionMaterializer`) öğretmensiz ve kulüp türündeki hücreleri maddileştirmez.
**Açık: `E-34`** — "gelmedi"nin devamsızlığa yazılması ürün kararı bekliyor (üç soru orada).

**Dilim 7 · Hazırlık kontrolleri — uygulandı** (`ClubHourReadiness`, yayın önizlemesi, tekli ve toplu yayın). Engeller çakışma
olarak döner ve yayını durdurur: kapsamdaki şubelerde farklı dilim; danışmanın kulüp saati dilimine başka şubeden ders. Uyarılar:
kulüpsüz öğrenci (şube bazında sayı), kulüp saati olmayan sınıfta üyelik, danışmansız aktif kulüp, yeri belirtilmemiş kulüp,
aynı derslikte iki kulüp. Kıyas dönemin canlı programlarıdır; toplu yayında seçilen öteki taslaklar kıyasa girmez.

**Ölçüm (tohum okul ATA-AL, 2026-09-26):** Adabımuaşeret geçici olarak kulüp türüne alındı (mevcut Cuma 7 · 9–10 kuralı);
tüm şubeler için üretim: 9-A, 9-B, 10-A, 10-B'de Cuma 7 öğretmensiz/yersiz kural hücresi, iki danışman (28 ve 35 ders) 11–12'de
Cuma 7'ye yerleşmedi; toplu yayın 8 programı aynı dilimdeki öğretmensiz hücrelerle yayınladı. 11-A öğrencisi keşifte kulüp
görmedi, `:join` 409; 9-A öğrencisi katıldı, ikinci kulübe 409. Öğrenci/öğretmen haftası (2026-03-02) kulüp adı + yer; üyeliksiz
öğrenci "Kulüp seçilmedi"; danışman yükü 28 → 29 (`clubHourWeeklyHours` 1). Test verisi (kulüpler, programlar, işler, deneme
dersi) temizlendi, Adabımuaşeret sınıf rehberliği türüne geri alındı.

