---
aliases: [ClubMembership, Kulüp Başvurusu, Üyelik]
tags: [domain/clubs]
table: school.club_memberships
status: active
last-synced: 2026-10-12 (b415d6fc)
---

# Kulüp Üyeliği

<!-- generated:start -->

## Nedir

Bir öğrencinin bir kulüpteki ilişkisi — **başvuru ve üyelik aynı kayıttır.** Onaylı kulüpte bekleyen başvuru olarak doğar ve onaylanınca üyeliğe döner; açık kulüpte doğrudan üyelik olarak doğar. Kulübün çocuğu değil, kendi köküdür: üyelik satırları doğrudan sorgulanır (öğrencinin kulüpleri, velinin çocuğunun kulüpleri, danışmanın başvuru listesi).

Öğrenci bu depoda bir [[Kişi]] kimliğidir; öğrenci profili kimlik olarak dolaşmaz.

## Yaşam döngüsü

```
  Approval modu:  (başvuru) ──► Pending ──┬─► Active ──► Left
                                          ├─► Rejected
                                          └─► Left        (başvuru geri çekildi)
  Open modu:      (katılma) ──────────────► Active ──► Left
  İdare modu:     (yerleştirme yayını) ───► Active ──► Left   (yalnız idarenin sonraki yayını ayırır)

  Paused ──► Left    (Paused'u YAZAN uç yok; enum ve sayaç var)
```

- **Yerleştirmeyle doğan üyelik** (`CreatePlaced`) — okulun Kulüp Üye Kabul Sorumlusu **İdare** iken üyelik başvuruyla değil [[Kulüp Yerleştirmesi]]'nin yayınıyla doğar; doğrudan **Active**'tir. Yeni bir durum eklenmedi: yerleştirilmiş üye onaylanmış üyeyle aynı hâldedir, tekillik süzgeci ve sayaç sözleşmesi değişmez. Kulübü değişen ya da taslakta boşaltılan öğrencinin yerleştirme üyeliği sonraki yayında **Left** olur.

- **Pending** — onay bekliyor. Kontenjanda yer **tutmaz**; kontenjan başvuruda kapatılır, onayda son savunma olarak yeniden bakılır. Bekleme listesi yoktur: reddi öğrenciden alıp danışmana taşımak, asla onaylanamayacak bir bekleyen satır üretirdi.
- **Active** — yürürlükteki üyelik; üye sayacında yer tutan **tek** hâl.
- **Paused** — dondurulmuş üyelik; canlıdır, üye listesinde görünür, tekillik kısıtının içindedir. MVP'de yazan uç yoktur.
- **Rejected** — danışman ya da idare reddetti; gerekçe kolondadır. Terminal.
- **Left** — öğrenci ayrıldı ya da başvurusunu geri çekti; ikisi aynı yere varır. Terminal; telde hiç görünmez.

**Terminal hâlden çıkış yoktur; yeniden başvuru yeni satır açar.** Aynı satırı yeniden Pending'e çevirmek ilk reddin gerekçesini ve tarihini silerdi; "geçen dönem reddedildi, bu dönem tekrar başvurdu" bilgisi danışmanın kararının parçasıdır.

## Kurallar

- **Doğum durumu kulübün katılım modundan türer** (Open → Active, Approval → Pending) ve tek komutla karşılanır. Ayrı bir "başvur" ucu yoktur ve yazılmayacaktır: istemci kulübün modunu tahmin etmek zorunda kalmaz. Bilinmeyen mod sessizce Pending'e düşmez, program hatasıdır.
- **Ayrılma tek uçtur ve iki iş yapar:** bekleyen satır için geri çekme, üye satır için ayrılma. Kulübün durumu süzülmez — pasif ya da arşiv kulüpten de ayrılınır.
- **Onay ve ret tek komut, iki koldur.** Kapı sırası, sezon süzgeci, karar veren kişi, sayaç bağı ve iyimser kilit çevrimi ortaktır; ayrışan tek şey seçilen domain metodudur. Zaten karara bağlanmış satırda ikinci onay **sessiz dönmez, hata verir** — sessiz no-op ikinci bir sayaç artışı demek olurdu.
- **Tekillik filtrelidir:** aynı öğrenci aynı kulüpte yalnız bir **canlı** satır tutar; indeks terminal hâlleri dışlar. Yeni bir hâl eklenirken terminal ise filtreye eklenmeli, canlı ise dokunulmamalı — canlı hâlleri sayan bir izin listesi, yeni bir canlı hâlde sessizce çift satıra izin verirdi. Sayısal değerler indeks filtresine gömülüdür, değiştirilemez.
- **Tek tablo, iki tel projeksiyonu.** Başvuru listesi Pending / Rejected / onaylanmış-Active satırları (`approved`) gösterir; üye listesi Active / Paused satırları. Left iki listeden de düşer. Ayrı "başvuru" ve "üyelik" tabloları, onay anında satır taşımak ve yarıda kalan taşımanın öğrenciyi iki listede birden ya da hiçbirinde bırakması demek olurdu. Bkz. [[0014-kulup-basvurusu-ve-uyeligi-tek-kayit]].
- **Sayaç bağının tek tanımı üyeliğin "aktif üye mi" yüklemidir.** Handler bir geçişten önce ve sonra bu değere bakar: yanlış → doğru ise kulübün sayacı artar, doğru → yanlış ise azalır, değişmediyse dokunulmaz. Yeni satırda "önce" değeri yoktur, yanlış sayılır. Kural entity'de durur, dört handler'a kopyalanmaz. Paused bu tanıma **dâhil değildir**.
- **"Üye mi" ile "sayaçta yer tutuyor mu" bilerek ayrı iki sorudur.** Üye yüklemi Active + Paused'u kapsar (öğrenci listededir, "Ayrıl" düğmesi görür, keşifte katılınabilir görünmez); sayaç yüklemi yalnız Active'i.
- **Karar verildiği an açık kulüpte boştur** — orada karar veren bir insan yoktur. Bu yüzden "onaylanmış" görünen satır gerçekten bir insanın onayladığı satırdır ve üyeliğin başlangıç anı "karar anı, yoksa başvuru anı"dır; kural tek yerde durur.
- **Başvuru anı domain zamanıdır**, denetim damgası değil; ikisi bugün aynı değere düşse de denetim alanı iş kuralına kaynak yapılmaz.
- **Ret gerekçesi yalnız ret kolunda saklanır ve zorunlu değildir**; boş metin `null`'a indirgenir. Onay kolunda alınır ama yazılmaz (sözleşme iki uca aynı gövdeyi veriyor).
- **Onay anında kulüp satırı değişmişse** ayrı bir kod döner ("karar verilirken kulüp değişti"); bu "kulüp dolu" ile aynı şey değildir ve ekranda farklı cümle kurmalıdır.
- **Öğrencinin ekranda gördüğü beş durumlu hâl** (katılınabilir / bekliyor / üye / dolu / kapalı) bu satırın hâli **değildir**; kulübün durumu, penceresi, kontenjanı ve öğrencinin kendi satırından **sunucuda, tek yerde** türer ve katılma ucunun kapılarıyla aynı cümleyi söyler. Sıra: öğrencinin kendi satırı her şeyden önce (dolu kulübün üyesi "dolu" değil "üye" görür), sonra kulüpten bağımsız engel (tek üyelik, kulüp saati kapsamı — "kapalı"), sonra kulübün "kapalı" hâli, sonra "dolu". Danışmansız aktif kulüp "kapalı" **değildir** (B-44, bkz. [[0015-danismansiz-aktif-kulup-basvuru-alir]]).
- **Tek üyelik (`Y-06` karar 3).** Öğrencinin bir sezonda en fazla **bir canlı satırı** olur — bekleyen, aktif ya da duraklatılmış; bekleyen başvuru da sayılır, yoksa ikinci başvuru birincisi onaylanınca iki üyeliğe dönüşürdü. Kural katılmada ve **onayda yeniden** sorulur: kural yürürlüğe girmeden önce düşmüş ikinci başvuru onaylanamaz. Kulübe bağlı kontenjan kapısından farklı olarak bu engel kulübün hâlinden **bağımsızdır**; ekran hâli "kapalı" olur, gerekçe öteki kulübün adını söyler ve keşif, detay ve katılma ucu aynı cümleyi kullanır.
- **Başvuru kapsamı kulüp saatinden türer (`Y-06` karar 10).** Okul kulüp saatini programa koyduysa sınıfında kulüp saati olmayan öğrenci kulüpleri **keşifte hiç görmez** (boş liste) ve katılma ucu reddeder; şubesi atanmamış öğrenci de kapsam dışıdır. Kaynak yayındaki programdır — taslak program kimseyi bağlamaz. Okulda kulüp saati yoksa kısıt da yoktur. **Var olan üyelik bu kuraldan etkilenmez**: kural yeni başvuruyu keser, kapsam dışına düşmüş üyelik program yayınında uyarıdır.
- **Aktif üye kulüp saati etkinliğine kayıtlı doğar** (bkz. [[Etkinlik Katılımı]]); duraklatılmış üye bu listeye girmez — burada da "üye" ile "sayaçta yer tutan" ayrımı korunur.
- **Yerleştirme üyeliğinde karar alanları bilerek doludur.** Karar anı ve karar veren (yayını yapan idareci) yazılır; boş kalsaydı satır açık kulübe kendiliğinden katılım gibi okunurdu — "onaylanmış" görünen satır yine bir insanın kararıdır. Başvuru anı karar anına eşittir: [[Kulüp Tercihi]] bir başvuru değildir, ayrı kayıtta yaşar ve anı buraya taşınmaz. Kontenjan ve kulübün aktifliği üyeliğin değil kulübün kapısıdır (`AdmitByPlacement`, bkz. [[Kulüp]]). Satırın yerleştirmeden doğduğu, yerleştirme satırındaki üyelik kimliği bağından anlaşılır; önceki moddan kalan üyelik "yerleştirme dışı" sayılır ve o öğrenciye yerleştirmede kulüp atanamaz.
- **İdare modunda öğrencinin ve danışmanın kendi jestleri kapalıdır** ([[0023-kulup-uye-kabul-sorumlusu-sezon-basinda-secilir]]): katılma, ayrılma (bekleyen başvuruyu geri çekme dâhil) ve başvuru kararı (onay/ret) 409 döner. Ayrılmanın kapanma gerekçesi: kulüp saati zorunlu üyeliği öğrencinin kendi eliyle bozulmaz, değişikliği idare yapar (K-9). Ayrılma kapısı satırın varlığından **önce** sorulur — jest bu okulda yoktur; karar kapısı kapsam kapısından **sonra** — kapsam dışı kulüp yine 404'tür. Mod okunan tek yer kabul kapısıdır; cümleler de oradadır, böylece keşif kartının notu ile ucun reddi aynıdır.
- **İdare modunda öğrencinin ekran hâli**: beş durum korunur; öğrencinin kendi satırı (üye / bekliyor) yine her şeyden önce gelir. Canlı satırı olmayan **her** kulüp "kapalı"dır ve gerekçesi "Kulüplere yerleştirmeyi idare yapar." cümlesidir. Bu okul düzeyinde bir engeldir ve tek üyelik ile kulüp saati engellerinden **önce** sorulur. Öğrenci yanıtları ayrıca bir **kabul bloğu** taşır (mod, görünür tercih dönemi, "tercihini kaydetti mi", "yerleştirme yayınlandı mı", uygunluk); veli yanıtında bu blok boştur.
- **Katılma izni yalnız öğrencidedir** (`clubs.join`); veli okur, idare yönetir. Kimlik yetkilendirme başlığından çözülür — öğrenci başkasının adına katılamaz.
- **Kulüp içi rol etikettir, yetki değildir** ve MVP'de yazan uç yoktur; her üyelik "üye" doğar.
- Onay iki olay yayar (başvuru sonuçlandı + öğrenci katıldı). Bugün yalnız ilkinin tüketicisi vardır; ikincisine tüketici bağlanırsa onaylı kulüpte **çift bildirim** doğar.

## İlişkiler

- [[Kulüp]] — sahibi; kimlikle bağ, navigasyon yok, sayacını handler günceller
- [[Kişi]] — öğrenci ve karar veren; kaydı dondurulmuş öğrenci de kendi kulüp geçmişini görebilir (ölçüt profilin varlığıdır, aktifliği değil)
- [[Veli-Öğrenci İlişkisi]] — veli yüzünün kapsamı; iptal edilmiş ilişki kapsam dışıdır
- [[Bildirim]] — başvuru sonucu yalnız başvuran öğrenciye gider; onay ve ret tek olay, ayrım gövdede
- [[Kulüp Yerleştirmesi]] — idare modunda üyeliği doğuran ve sahiplenen kayıt; bağ üyelik kimliğiyle
- [[Kulüp Tercihi]] — üyeliği olan öğrenci tercih yapamaz (K-5); tercih bir başvuru değildir

## Geçtiği modüller

- [[Kulüpler]] — katılma, ayrılma, onay/ret, üye ve başvuru listeleri, "Kulüplerim", veli özeti; idare modunda yerleştirme yayını

<!-- generated:end -->

## Notlar

<El yazısı alan. Senkron buraya dokunmaz.>

## Açık Sorular

- **Duraklatılmış üyelik kontenjanda yer tutuyor mu?** Enum ve sayaç var, yazan uç yok. Bugün üye sayılıyor ama sayaçta yer tutmuyor; yani duraklatılmış üye "üye" görünürken kulüp aynı anda yeni üye alabilir. Uç açıldığında sayaç tanımı ve ekran cümlesi birlikte kararlaştırılmalı.
- Onaylanıp sonra ayrılan öğrencinin satırı başvuru listesinden kaybolur (Left gösterilmiyor). Danışmanın "onaylamıştım, nerede?" sorusunun cevabı geçmiş ekranı mı, yoksa dördüncü bir süzgeç mi?
- Üye ve başvuru listeleri sayfalama yapmıyor; 200 üyeli kulüp tek yanıtta döner. Sözleşmede de yok; büyüklük eşiği kararlaştırılmadı.
