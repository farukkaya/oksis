---
aliases: [ClubMembership, Kulüp Başvurusu, Üyelik]
tags: [domain/clubs]
table: school.club_memberships
status: active
last-synced: 2026-09-13 (294ffe6)
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

  Paused ──► Left    (Paused'u YAZAN uç yok; enum ve sayaç var)
```

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
- **Öğrencinin ekranda gördüğü beş durumlu hâl** (katılınabilir / bekliyor / üye / dolu / kapalı) bu satırın hâli **değildir**; kulübün durumu, penceresi, kontenjanı ve öğrencinin kendi satırından **sunucuda, tek yerde** türer ve katılma ucunun kapılarıyla aynı cümleyi söyler. Sıra: öğrencinin kendi satırı her şeyden önce (dolu kulübün üyesi "dolu" değil "üye" görür), sonra "kapalı", sonra "dolu". Danışmansız aktif kulüp "kapalı" **değildir** (B-44, bkz. [[0015-danismansiz-aktif-kulup-basvuru-alir]]).
- **Katılma izni yalnız öğrencidedir** (`clubs.join`); veli okur, idare yönetir. Kimlik yetkilendirme başlığından çözülür — öğrenci başkasının adına katılamaz.
- **Kulüp içi rol etikettir, yetki değildir** ve MVP'de yazan uç yoktur; her üyelik "üye" doğar.
- Onay iki olay yayar (başvuru sonuçlandı + öğrenci katıldı). Bugün yalnız ilkinin tüketicisi vardır; ikincisine tüketici bağlanırsa onaylı kulüpte **çift bildirim** doğar.

## İlişkiler

- [[Kulüp]] — sahibi; kimlikle bağ, navigasyon yok, sayacını handler günceller
- [[Kişi]] — öğrenci ve karar veren; kaydı dondurulmuş öğrenci de kendi kulüp geçmişini görebilir (ölçüt profilin varlığıdır, aktifliği değil)
- [[Veli-Öğrenci İlişkisi]] — veli yüzünün kapsamı; iptal edilmiş ilişki kapsam dışıdır
- [[Bildirim]] — başvuru sonucu yalnız başvuran öğrenciye gider; onay ve ret tek olay, ayrım gövdede

## Geçtiği modüller

- [[Kulüpler]] — katılma, ayrılma, onay/ret, üye ve başvuru listeleri, "Kulüplerim", veli özeti

<!-- generated:end -->

## Notlar

<El yazısı alan. Senkron buraya dokunmaz.>

## Açık Sorular

- **Duraklatılmış üyelik kontenjanda yer tutuyor mu?** Enum ve sayaç var, yazan uç yok. Bugün üye sayılıyor ama sayaçta yer tutmuyor; yani duraklatılmış üye "üye" görünürken kulüp aynı anda yeni üye alabilir. Uç açıldığında sayaç tanımı ve ekran cümlesi birlikte kararlaştırılmalı.
- Onaylanıp sonra ayrılan öğrencinin satırı başvuru listesinden kaybolur (Left gösterilmiyor). Danışmanın "onaylamıştım, nerede?" sorusunun cevabı geçmiş ekranı mı, yoksa dördüncü bir süzgeç mi?
- Üye ve başvuru listeleri sayfalama yapmıyor; 200 üyeli kulüp tek yanıtta döner. Sözleşmede de yok; büyüklük eşiği kararlaştırılmadı.
