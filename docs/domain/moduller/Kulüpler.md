---
aliases:
  - Clubs
  - clubs
tags:
  - domain/clubs
  - module
status: completed
last-synced: 2026-09-13 (294ffe6)
---

# Kulüpler

<!-- generated:start -->

## Ne yapar

Okulun öğrenci kulüplerini dört yüzden taşır. **İdare** kulüp açar, düzenler, danışman atar, pasife alır ve arşivler; okulun bütün kulüplerini (taslak ve arşiv dâhil) görür. **Danışman öğretmen** kendi kulüplerini listeler, üye ve başvuru listesini okur, başvuruyu onaylar ya da gerekçesiyle reddeder, etkinlik açar, yayınlar, iptal eder, yoklama tutar ve kulüp duyurusu yayınlar. **Öğrenci** keşif listesinden kulüp bulur, katılır, ayrılır, "Kulüplerim"i görür, üyesi olduğu kulüplerin yaklaşan etkinliklerine kaydolur ve kaydını geri çeker, dönem içi aktivite geçmişini çeker. **Veli** çocuklarının özetini, bir çocuğun kulüplerini, tek kulüp detayını ve aktivite geçmişini **salt okunur** görür.

Modülün iki karakteristik özelliği var. Birincisi **izin ile kapsamın ayrılması**: bir izin anahtarı ucu açar, handler içindeki kapı **hangi kulüpte** olduğunu söyler. İkincisi **kararın sunucuda verilmesi**: öğrencinin "Katıl" düğmesi sunucunun türettiği beş durumlu hâlden çizilir; istemci mod, kontenjan ve pencereden kendi kararını üretmez.

## Kullandığı kavramlar

- [[Kulüp]] — okul × sezon × ad; durum makinesi, danışman, kontenjan ve pencere kuralları
- [[Kulüp Üyeliği]] — başvuru ve üyelik tek kayıt; tek tablo iki projeksiyon
- [[Kulüp Etkinliği]] — saatli faaliyet; taslak → yayın → tamamlandı/iptal
- [[Etkinlik Katılımı]] — kayıt ve yoklama tek satır; koşulsuz tekillik
- [[Kulüp Duyurusu]] — durum makinesiz, silinmez, imzası donan kulüp içi haber
- [[Sezon]] — her kulüp okulun yayındaki sezonuna bağlıdır; süzgeç her sorguda elle
- [[Kişi]] / [[Profil]] — danışman, öğrenci, karar veren, yayınlayan hep kişi kimliğidir; öğrenci ölçütü profilin varlığıdır, aktifliği değil
- [[Veli-Öğrenci İlişkisi]] — veli yüzünün tek kapsam kaynağı; iptal edilmiş ilişki kapsam dışı
- [[İzin]] — dört anahtar: okuma, yazma, yönetme, katılma
- [[Modül Yapılandırması]] — `clubs` anahtarı; standart katman, plan kısıtı yok
- [[Bildirim]] / [[Bildirim Türü]] — dört olay: başvuru sonucu, etkinlik yayını, etkinlik iptali, duyuru yayını; dördü de uygulama içi + push
- [[Okul]] — saat dilimi ve "okulun bugünü"

## Ana akışlar

1. **Kulüp açma ve düzenleme** — İdare gövdede durum ve sezon göndermez: sezonu sunucu çözer (yoksa 409), durum danışmandan türer. Düzenleme gövdesi oluşturmayla aynıdır; danışman alanı her kaydetmede gönderilir, `null` danışmanı kaldırır ama kulübü taslağa düşürmez, dolu değer taslağı yayına alır. Durum değişikliği ayrı uçtur (aktif ↔ pasif, arşiv); "adı düzelten" bir istek kulübü sessizce kapatamaz. Danışman seçicisinin havuzu okulun bugünkü kadrosudur ve kulüp bağlamı olmadan da açılır; yalnız idare okur — öğretmen listesi kadro kaydıdır ([[0016-ayrilmis-ogretmen-kadrodan-turer]]).

2. **Katılma ve ayrılma** — Tek katılma komutu iki modu karşılar: açık kulüpte anında üyelik ve sayaç artışı, onaylı kulüpte bekleyen başvuru. Ayrı "başvur" ucu yoktur ve yazılmayacaktır. Ayrılma da tek uçtur: bekleyen için geri çekme, üye için ayrılma; kulübün durumu süzülmez. Kimlik yetkilendirme başlığından çözülür; öğrenci başkasının adına işlem yapamaz. Kontenjan başvuruda kapatılır, onayda yeniden bakılır; bekleme listesi yoktur. Başvuru ve üyelik tek kayıttır ([[0014-kulup-basvurusu-ve-uyeligi-tek-kayit]]).

3. **Başvuru kararı** — Onay ve ret tek komut, iki kol. Kararı danışman **ya da** idare verir; izin `clubs.write`'tır (`clubs.manage` değil) çünkü karar danışmanın asli işidir ve öğretmende yönetme izni yoktur. Kulüp satırı karar sırasında değişmişse ayrı bir çakışma kodu döner. Danışmansız aktif kulüpte kararı idare verir; sonradan atanan danışman bekleyenleri devralır ([[0015-danismansiz-aktif-kulup-basvuru-alir]]). Onay iki olay yayar; bugün yalnız "sonuçlandı" olayının tüketicisi var.

4. **Etkinlik ve yoklama** — Danışman etkinliği taslak açar, ayrı bir jestle yayınlar; iptal gerekçe ister. Yoklama listesi ilk açılışta üye listesinden türetilir, kaydedilince yalnız gönderilen satırlar yazılır. Tamamlanmış etkinlikte de yoklama yazılabilir. Her gece 23:00'te bir iş bitmiş yayınları "tamamlandı"ya çeker; okul okul, seri, idempotent.

5. **Kulüp duyurusu** — Tek adım yayın; imza çağırandan çözülür ve donar. Dört rol aynı uçtan okur.

6. **Öğrenci yüzü** — Keşif yalnız yayındaki kulüpleri gösterir; durum süzgeci parametreye açılmaz (taslak kulüpleri sorma yolu olurdu). Tanınmayan kategori 400'dür, boş liste değil. "Kulüplerim" yalnız üyelikleri gösterir, bekleyen başvuru keşifte "bekliyor" hâliyle görünür ve oradan geri çekilir. Pasife alınmış kulübün üyesi detaya girip ayrılabilir; yayında olmayan kulübü yalnız orada canlı satırı olan öğrenci görür, taslak kulüp herkese 404'tür. Öğrenci detayı üye listesini döndürmez, yalnız sayıyı — üye listesi kişisel veridir. Yaklaşan etkinlikler ve geçmiş yalnız aktif sezondur.

7. **Veli yüzü** — Rota "velinin çocukları" bir kapsam bildirimidir: çocukları sunucu bulur, öğrencinin kendisi bu uçlardan kendini göremez (404), çocuğu olmayan veli boş liste alır. Kapsam dışı çocuk 404'tür, 403 değil. Sezonsuz okulda özet boş döner, tekil kulüp 404. Veli katılamaz, işaretleyemez; öğrencinin detay DTO'su aynen döner ama yazma düğmesi hiç çizilmez ve veli şemasında "katılabilir" alanı `false` değil **hiç yoktur**. Bekleyen başvuru veli özetinde görünmez — veli sürecin sonucunu bekler, adımlarını görmez.

8. **Bildirim ve push** — Dört domain olayı dört handler'la uygulama içi bildirime ve push'a akar. Alıcı kümeleri bilinçli olarak farklıdır: başvuru sonucu yalnız öğrenciye; etkinlik yayını üyelere **ve** velilerine; etkinlik iptali yalnız kayıtlılara ve velilerine; duyuru yalnız üyelere. Kaynak kayıt okunamıyorsa bildirim sessizce düşer. Push eşlemesi handler'larla aynı fazda açıldı — erken açılsaydı her hesabın tercih ekranında çalışmayan bir düğme doğardı. Push kilit ekranına düşen bir kesintidir; bu yüzden varsayılanı yalnız alıcının planını bozan ya da beklediği cevabı taşıyan iki olayda açıktır (etkinlik iptali, başvuru sonucu). Etkinlik yayını ve kulüp duyurusu haber niteliğindedir, okul matristen açar. E-posta ve SMS dördünde de kapalıdır. Bildirim kataloğunda dört olayın "teslim ediliyor" bayrağı, üreticileri yazılmış olduğu hâlde hâlâ kapalıdır.

**Yetki — iki katman.** İzin anahtarları ucu açar: **okuma** (liste, detay, etkinlik, duyuru), **yazma** (danışmanın kendi kulübünde etkinlik/duyuru, üyelik kararı, yoklama), **yönetme** (açma, kapama, danışman atama, okul geneli görünüm), **katılma** (kulübe başvurma, etkinliğe kaydolma). Seed'de idarede okuma-yazma-yönetme; öğretmende okuma-yazma; velide yalnız okuma; öğrencide okuma-katılma. Katılma hiçbir yetişkin rolde yoktur.

Handler içindeki ikinci katman "hangi kulüp" sorusunu sorar ve sırası sabittir: **danışmanlık → idare → kapsam dışı (404)**. Kendi kulübüne bakan müdür yardımcısı "idare" değil "danışman" görür. Kimliği bir kişiye bağlanamayan oturum, yönetme izni olsa bile hiçbir görünüm almaz — yönetme bir kişinin yetkisidir, sahibi belirsiz yazma yolu bırakılmaz. Öğrencinin kapsamı kimlikten değil kulübün hâlinden ve üyelikten gelir; velinin kapsamı ilişkiden. Üç eksen üç ayrı kapıda yaşar ve sıra tek yerde (görünüm çözücüde) durur; bir ara ikinci bir yerde tekrar ediliyordu ve testin koruduğu ile çalışanın ayrışma riski doğdu, kaldırıldı.

**Kapsam dışı = 404, 403 değil.** 403 kaynağın varlığını doğrular; üye listesi kişisel veridir. Bu yüzden kapsam dışının bir hata kodu yoktur. Başvuru listesinde kapsam kapısı süzgeç doğrulamasından **önce** koşar: görülemeyen kulüpte bozuk süzgeç de 404'tür.

**Sezon izolasyonu.** Tenant süzgeci otomatiktir, sezon süzgeci değildir; her sorgu elle yazar ve okuma ile yazma aynı kapıdan geçer — aksi hâlde "okuma 404 verirken yazmanın çalıştığı" bir kulüp doğardı. Sezonsuz okulda **okuma** boş liste ya da 404 döner (kulüp yoktur), **yazma** 409 döner (kaydı nereye yazacağını bilemez). Tek istisna danışman havuzudur: sezon eksenli değil kadro eksenlidir, yoksa sezon devri gününde bütün öğretmenler havuzdan düşerdi.

**Hata sözleşmesi.** Kodlar `Clubs.` önekiyle gelir ve HTTP durumu önekten çözülür: doğrulama 400 (bozuk süzgeç, tanınmayan kategori, kadroda olmayan danışman, durum değiştirmede taslak hedefi, roster'da üye olmayan öğrenci); durum makinesi ihlali, kontenjan dolu, eşzamanlı karar, sezon yok ve aynı adda kulüp 409; kapsam dışı, başka sezonun kulübü ve okuma yolunda sezonsuz okul 404. 409 ölçütü: "gövde kusursuz, kaydın hâli uygun değil" — aynı istek koşul değişince aynen geçer. Domain istisnasının Türkçe mesajı korunur ve doğrudan kullanıcıya gösterilir. Ad tekilliği iki katmandır: ön kontrol hatayı anlaşılır yapar, indeks son savunmadır ve ihlal indeks adından tanınır.

## Kapsam dışı

- **Ayrı "başvur" ucu.** Sözleşmede vardı, ekranda ölüydü; tek katılma komutu iki modu karşılar.
- **Üyelik duraklatma.** Enum ve sayaç var, yazan uç yok; "duraklatılmış üye kontenjanda yer tutar mı" sorusu o uçla birlikte cevaplanacak.
- **Kulüp içi rol atama** (başkan, yardımcı). Etiket olarak kolonda var, yazan uç yok; yetkiye bağlanmayacak.
- **Bekleme listesi.** Kontenjan başvuruda kapatılır.
- **Sayfalama.** Kulüp, üye, başvuru ve veli özeti listeleri tek yanıtta döner; sözleşmede de yok. Yüzlerce kulüplü okul çıkarsa yeniden düşünülür.
- **Duyuru düzenleme ve silme.** Yeni duyuru yayınlanır.
- **Geçmiş sezon görünümü.** Hiçbir uç sezon parametresi almaz; arşiv kulüp yalnız idarenin listesinde görünür.
- **Ders programındaki "Kulüp" saatiyle bağ** ve **ders saatiyle çakışan etkinliğin devamsızlık köprüsü.** İkisi de bilinçli olarak kurulmadı.
- **Dosya bağı.** Dosya kategorisi kataloğunda "kulüp belgesi" tanımlı, ama kulüp kayıtlarına dosya bağlanamıyor (bkz. [[Dosya Kategorisi]]).
- **Öğretmen için etkinlik detay ucu** ve öğrenci için **geçmiş etkinlik listesi.**
- **Veliye yazma.** Salt okunur; tercih listesi rol süzgeci push tarafında ayrı iş.
- **Taslak etkinlik silme.**
- **Etkinlik hatırlatması.** Ödevin bir yükümlülüğü vardır; etkinliğe kaydolmak gönüllüdür.

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- **Üç domain olayı tüketicisiz yayılıyor** (kulüp oluşturuldu, etkinliğe kayıt oluşturuldu, etkinlik tamamlandı). Bilinçli — hiçbiri bir kullanıcı bildirimi değil; audit ya da haftalık özet isterse bildirim handler'ı değil projeksiyon uygun. Kalıcı karar mı?
- **Docker'lı ortamda hiç koşmamış şeyler:** Faz 0–3 migration'ları (entegrasyon testleri şemayı modelden kuruyor, filtreli/tekil indeks iddiaları kanıtsız), Faz 3'ün 13 entegrasyon iddiası, veli yüzünün 7 iddiası (fixture'ın ikinci sezon aktivasyonu tekil indekse takılıyor, arşivleme kalıbına çevrilmeli), gece işinin iki-okul tenant filtresi testi.
- Kimlik çözümü iki yerde yazılı (danışman/idare ekseni ve veli ekseni aynı sorguyu koşuyor). Kabul edilen borç; veli push tercih listesi doğduğunda üçüncü eksenle ortak çekirdek yazılacak.
- Veli tercih listesi rol süzgeci olmadan döndüğü için veli, kendisine hiç gitmeyecek "kulüp duyurusu" için push düğmesi görebilir; DTO'ya uygunluk alanı merkezi çözüm.
- Ekran tarafında (oksis-ui) açık kalanlar backend'i beklemez: bildirim çözümleyicisinde kulüp kolu yok, kategori sabiti Türkçe etiketi tel değeri sanıyor, modül kataloğunda `clubs` anahtarı yok. Domain notu değil ama modülü kapatanın bilmesi gereken liste.
