---
aliases: [Club, Öğrenci Kulübü]
tags: [domain/clubs]
table: school.clubs
status: active
last-synced: 2026-09-13 (294ffe6)
---

# Kulüp

<!-- generated:start -->

## Nedir

Bir sezonda açılan, şubeden bağımsız öğrenci topluluğu — "Satranç Kulübü", "Robotik Kulübü". Koordinatı **okul × sezon × ad**; aynı sezonda aynı adla ikinci kulüp açılamaz. Modülün aggregate root'u, ama üyelik, etkinlik ve duyuru onun çocuğu **değildir**: üçü de kendi kökleridir ve kulübe yalnız kimlikle bağlanır.

İki komşuyla karıştırılmamalı. Ders programındaki haftalık "Kulüp" saati bir **derstir** ([[Ders]] kataloğunda, şubeye bağlı); buradaki kulüp 9-A'dan da 11-C'den de öğrenci alır ve ikisi arasında bağ yoktur, MVP'de kurulmayacaktır. Gezi/tören sayımı olan [[Etkinlik Yoklaması]] da ayrı bir şeydir (bkz. [[Kulüp Etkinliği]]).

## Yaşam döngüsü

```
  (yeni, danışmansız) ──► Draft ──(danışman atanır)──► Active
  (yeni, danışmanlı)  ───────────────────────────────► Active

  Active ◄──► Inactive          (bu sezon üye almıyor; geri dönüş var)
  Draft | Active | Inactive ──► Archived   (GERİ DÖNÜŞ YOK)
```

- **Draft** — danışmanı olmadan doğan kulüp. Kimseye görünmez, bildirim üretmez, üye almaz. Draft → Inactive geçişi yoktur: taslak zaten üye almaz, "pasife almak" hiçbir şeyi değiştirmezdi.
- **Active** — yayında; başvuru penceresi ve kontenjan kurallarına tabi.
- **Inactive** — bu sezon üye almıyor; üyeler listede kalır ve ayrılabilir.
- **Archived** — geçmiş sezona ait, donmuş kayıt. Arşivden çıkış yoktur: mezun olmuş öğrencilerin bulunduğu bir liste yeniden üye almaya açılmamalı. Arşivleme her canlı durumdan koşulsuz çalışır; arşivlenmiş kulüp düzenlenemez, danışmanı değiştirilemez, aktifleştirilemez ve pasife alınamaz.
- Aynı durumu yeniden göndermek hata değildir (no-op); ekranın "hiçbir şeyi değiştirmeyen hata yolu" olmaması için.
- **Durum değiştirmenin hedefi taslak olamaz.** Yayına alınmış, üyeleri olan kulübü taslağa çekmek onu öğrencinin ekranından sessizce silerdi; vazgeçmenin yolu pasife almaktır. Kural isteğin özelliğidir, kaydın hâlinin değil — bu yüzden doğrulama hatasıdır (400), durum çakışması değil.
- **Danışmanı alınmış aktif kulüp pasife alınırsa kendiliğinden geri açılamaz.** Danışman ataması yalnız taslağı yayına çeker, pasif kulübü değil; aktifleştirme de danışman ister. Kurtarma yolu önce danışman atamak, sonra aktifleştirmektir.

## Kurallar

- **Doğum durumu danışmandan türer ve gövdede yoktur.** Danışman verildiyse Active, verilmediyse Draft. İstemci durum gönderemez; kural tek yerde (fabrikada) yaşar.
- **Kulüp sezona bağlıdır ve sezon süzgeci otomatik DEĞİLDİR.** Global filtre yalnız okulu süzer; sezonu her sorgu elle yazar. Unutulursa geçen yılın kulübü listeye sızar. Her sezon yeni bir kayıt doğar; önceki sezonun kaydı Archived kalır. Sezon parametresi hiçbir uçta yoktur; sunucu okulun yayındaki sezonunu kendisi çözer. Sezon kimliği kulüp doğarken zorunludur; sonradan eklenseydi var olan kayıtların hangi sezona ait olduğu bilinemezdi.
- **Danışman kaldırılınca kulüp taslağa geri DÖNMEZ.** Ayrılan öğretmenin yerine yenisi atanana kadar kulübün üyeleriyle birlikte görünmez olması istenmez. Ama **danışmansız kulüp yayına ALINAMAZ**: taslağı aktife çeken kapı sorumlusunu ister.
- **Danışmansız aktif kulüp başvuru ALIR** (B-44 kararı, 2026-08-31). Eski kural "yayında VE danışmanı var" idi ve kaldırıldı: başvuruyu idare karara bağlar, kulübe sonradan danışman atandığında bekleyen başvurular kendiliğinden onun listesine düşer — başvuru satırı hiçbir kişiye bağlanmadığı için veri taşıması yoktur, görünürlük yalnız danışman kimliği karşılaştırmasından türer. Bkz. [[0015-danismansiz-aktif-kulup-basvuru-alir]].
- **Danışman bir kişi kimliğidir, navigasyon değildir** ve yazmada doğrulanır: yalnız bu okulun bugünkü kadrosundan (aktif, işten çıkmamış öğretmen) seçilebilir ve ölçüt danışman seçicisinin havuzuyla birebir aynıdır — seçicide görünen bir öğretmenin yazmada reddedilmesi ekranın listesini yalan yapardı. Ölçüt sezona bağlı görevlendirme değil kadro kaydıdır ([[0016-ayrilmis-ogretmen-kadrodan-turer]]). Güncellemede kadro kontrolü yalnız danışman **değiştiğinde** yapılır: danışmanı okuldan ayrılmış kulübün adı yine düzeltilebilmeli. Tek danışman vardır; ayrı bir "danışmanlıklar" tablosu yoktur ve açılmayacaktır.
- **Üye sayacı denormalizedir ve tek yazarı kulübün kendi metotlarıdır.** Her okumada saymak, kontenjan kontrolünü kilitlenecek bir satırdan mahrum bırakırdı. Sayaç yalnız **Active** kulüpte artar ve kontenjan kapısı burada durur — Application katmanına emanet edilmez. Azaltmada durum kontrolü **bilerek yoktur**: pasif ya da arşiv kulüpten ayrılmak öğrencinin hakkıdır, simetrik kapı pasif kulübün sayacını dondururdu. Sıfırın altına düşme kırpılmaz, istisnadır. Bu satırın sürüm damgası kontenjan yarışının birinci savunmasıdır; ikincisi uygulama katmanındaki kontrol, üçüncüsü üyeliğin filtreli tekil indeksi.
- **Sayaç sapması tespit edilebilir kılınmıştır.** Detay ucu üye sayacını kolondan, aktif üye sayısını satırlardan okur; ikisi ayrışırsa uyarı loglar, kesinti üretmez.
- **Kontenjan:** boş = sınırsız; sıfır ve negatif reddedilir (yazım hatasıdır, "sınırsız" değildir). Kontenjanı mevcut üye sayısının altına çekmek serbesttir ve kimseyi düşürmez, yalnız yeni katılımı durdurur.
- **Başvuru penceresi** iki uçlu ya da tek uçludur ("15 Eylül'den itibaren, bitiş yok" kabul edilir), bitiş günü **dâhildir**, ters pencere reddedilir. Pencere **okulun gününe** göre ölçülür, sunucunun makinesinin gününe değil. "Başvurular açık mı" sorusunun tek kaynağı vardır ve telin `applicationOpen` alanını, kartın notunu ve öğrencinin beş durumlu ekran hâlini aynı kaynak besler — üçü ayrışırsa kart "açık" derken düğme kapalı olur. Bu soru **kontenjana bakmaz**: dolu kulüp idare yüzünde "başvurular açık" görünür; "katılabilir mi" ayrımını öğrencinin beş durumlu hâli taşır ve ikinci bir yerde yeniden türetilmez.
- **Kategori bir enum'dur, lookup tablosu değildir.** On değer sabittir; "Satranç" kategori değil kulüp adıdır (Spor altında). Sayısal değerler kolona gömülüdür; yeni kategori yalnız sona eklenir.
- **Kulüp içi roller (başkan, başkan yardımcısı) yetki DEĞİL etikettir** — gerçek yetki [[Sistem Rolü]] ve [[Rol Ataması]]'ndadır; MVP'nin tek yönetici rolü danışman öğretmendir.
- Kolon sınırı ile doğrulayıcı sınırı bilinçli olarak farklıdır (kolon geniş, doğrulayıcı dar); domain aşan metni kırpar, asıl kapı doğrulayıcıdır ve o reddeder.

## İlişkiler

- [[Sezon]] — kimlik referansı; kulüp okulun yayındaki sezonuna bağlanır, sezon süzgeci elle yazılır
- [[Kişi]] — danışman öğretmen; yalnız kimlik, navigasyon yok, FK yok
- [[Kulüp Üyeliği]] — kulüp × öğrenci; ayrı kök, sayaç bağını handler kurar
- [[Kulüp Etkinliği]] — kulübün faaliyeti; ayrı kök, sezonunu kulüp üzerinden alır
- [[Kulüp Duyurusu]] — kulübün üyelerine haberi; ayrı kök, sezonunu kulüp üzerinden alır
- [[Modül Yapılandırması]] — `clubs` anahtarı; standart katman, plan kısıtı yok, yeni okulda açık doğar

## Geçtiği modüller

- [[Kulüpler]] — kavramın sahibi; açma, düzenleme, durum, danışman havuzu burada

<!-- generated:end -->

## Notlar

<El yazısı alan. Senkron buraya dokunmaz.>

## Açık Sorular

- Durum değiştirme ucunun `reason` alanı alınıyor ama hiçbir yere yazılmıyor (kolon yok, ekran hep boş gönderiyor). Bilinçli bir MVP kararı, ama kulübün pasife alınma gerekçesinin bir gün sorulup sorulmayacağı cevaplanmadı.
- Taslak kulübün doğrudan arşive çekilmesi kodda serbest (arşivleme koşulsuz). "Hiç yayınlanmamış kulübün arşivi" anlamlı bir hâl mi, yoksa taslak silinmeli mi? Taslak silme ucu yok.
- Kartta gösterilen iki Türkçe cümle ("son gün", "1 Ekim'de açılıyor") uydurma ve onaysız; tek yerde duruyor, değiştirmesi tek satır.
- Kulüp adı sıralaması iki listede farklı harmanlanıyor: "Kulüplerim" bellekte Türkçe sırayla, keşif ve idare listesi SQL harmanlamasıyla. Aynı iki kulüp iki ekranda farklı sıralanabilir.
