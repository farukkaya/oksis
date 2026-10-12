---
aliases:
  - Clubs
  - clubs
tags:
  - domain/clubs
  - module
status: completed
last-synced: 2026-10-12 (b415d6fc)
---

# Kulüpler

<!-- generated:start -->

## Ne yapar

Okulun öğrenci kulüplerini dört yüzden taşır. **İdare** kulüp açar, düzenler, danışman atar, pasife alır ve arşivler; okulun bütün kulüplerini (taslak ve arşiv dâhil) görür. **Danışman öğretmen** kendi kulüplerini listeler, üye ve başvuru listesini okur, başvuruyu onaylar ya da gerekçesiyle reddeder, etkinlik açar, yayınlar, iptal eder, yoklama tutar ve kulüp duyurusu yayınlar. **Öğrenci** keşif listesinden kulüp bulur, katılır, ayrılır, "Kulüplerim"i görür, üyesi olduğu kulüplerin yaklaşan etkinliklerine kaydolur ve kaydını geri çeker, dönem içi aktivite geçmişini çeker. **Veli** çocuklarının özetini, bir çocuğun kulüplerini, tek kulüp detayını ve aktivite geçmişini **salt okunur** görür.

2026-09-26'dan (`Y-06`) beri modülün beşinci bir yüzü daha var: **programdaki kulüp saati.** Okul ders programına türü "kulüp" olan bir ders koyduğunda, kulüpler o haftalık dilimde toplanan şubeler-üstü gruplara dönüşür; sistem her hafta her aktif kulübe bir "kulüp saati" etkinliği açar, danışmanın aldığı yoklama öğrencinin devamsızlığına yazılır.

2026-10-12'den beri kulübe giriş **iki yoldan** biriyle olur ve hangisi olduğunu okulun **Kulüp Üye Kabul Sorumlusu** ayarı söyler ([[Okul Ayarları]], [[0023-kulup-uye-kabul-sorumlusu-sezon-basinda-secilir]]). **Öğretmen** modunda (varsayılan) yukarıdaki katılma/başvuru/onay akışı aynen çalışır. **İdare** modunda öğrencinin ve danışmanın kendi kabul jestleri kapanır, yerine yeni bir yüz açılır: idare sezonun tek **tercih dönemini** açar, öğrenciler üç kulübü sıralar, idare dönemi kapatır, **yerleştirme** ekranında otomatik yerleştirip elle düzeltir, taslağı kaydeder ve ayrı bir jestle yayınlar; yayın üyelikleri doğurur. Mod yalnız sezon sihirbazında seçilir ve sezon aktifleşirken yazılır; sezon içinde değişmez.

Modülün iki karakteristik özelliği var. Birincisi **izin ile kapsamın ayrılması**: bir izin anahtarı ucu açar, handler içindeki kapı **hangi kulüpte** olduğunu söyler. İkincisi **kararın sunucuda verilmesi**: öğrencinin "Katıl" düğmesi sunucunun türettiği beş durumlu hâlden çizilir; istemci mod, kontenjan ve pencereden kendi kararını üretmez.

## Kullandığı kavramlar

- [[Kulüp]] — okul × sezon × ad; durum makinesi, danışman, kontenjan ve pencere kuralları
- [[Kulüp Üyeliği]] — başvuru ve üyelik tek kayıt; tek tablo iki projeksiyon
- [[Kulüp Etkinliği]] — saatli faaliyet; taslak → yayın → tamamlandı/iptal
- [[Etkinlik Katılımı]] — kayıt ve yoklama tek satır; koşulsuz tekillik
- [[Kulüp Duyurusu]] — durum makinesiz, silinmez, imzası donan kulüp içi haber
- [[Kulüp Tercih Dönemi]] — idare modunda sezonun tek tercih süreci; `Draft → Open ⇄ Closed → Published`
- [[Kulüp Tercihi]] — öğrencinin sıralı üç kulübü; son kayıt anı "önce kaydeden önce" ölçütü
- [[Kulüp Yerleştirmesi]] — öğrenci başına taslak ve yayınlanmış kulüp; yayın üyelik doğurur
- [[Okul Ayarları]] — Kulüp Üye Kabul Sorumlusu (öğretmen / idare); kabul kapısının tek kaynağı
- [[Sezon]] — her kulüp okulun yayındaki sezonuna bağlıdır; süzgeç her sorguda elle
- [[Kişi]] / [[Profil]] — danışman, öğrenci, karar veren, yayınlayan hep kişi kimliğidir; öğrenci ölçütü profilin varlığıdır, aktifliği değil
- [[Veli-Öğrenci İlişkisi]] — veli yüzünün tek kapsam kaynağı; iptal edilmiş ilişki kapsam dışı
- [[İzin]] — dört anahtar: okuma, yazma, yönetme, katılma
- [[Modül Yapılandırması]] — `clubs` anahtarı; standart katman, plan kısıtı yok
- [[Bildirim]] / [[Bildirim Türü]] — on olay: başvuru sonucu, etkinlik yayını, etkinlik iptali, duyuru yayını; tercih dönemi açıldı, tercih hatırlatması, tercih dönemi kapandı, yerleştirme sonucu, yerleşmedi, danışmana yerleştirme özeti
- [[Okul]] — saat dilimi ve "okulun bugünü"
- [[Derslik]] — kulüp saatinin yeri; katalogdan kimlikle seçilir
- [[Ders Programı]] / [[Program Sürümü]] — kulüp saatinin kaynağı; türü kulüp olan dersin yerleşimleri, her gün o gün yürürlükteki sürümden
- [[Zil Çizelgesi]] — kulüp saati etkinliğinin başlangıç ve bitiş anı
- [[Yoklama Oturumu]] — kulüp saati yoklamasının devamsızlığa yazıldığı oturum

## Ana akışlar

1. **Kulüp açma ve düzenleme** — İdare gövdede durum ve sezon göndermez: sezonu sunucu çözer (yoksa 409), durum danışmandan türer. Düzenleme gövdesi oluşturmayla aynıdır; danışman alanı her kaydetmede gönderilir, `null` danışmanı kaldırır ama kulübü taslağa düşürmez, dolu değer taslağı yayına alır. Durum değişikliği ayrı uçtur (aktif ↔ pasif, arşiv); "adı düzelten" bir istek kulübü sessizce kapatamaz. Danışman seçicisinin havuzu okulun bugünkü kadrosudur ve kulüp bağlamı olmadan da açılır; yalnız idare okur — öğretmen listesi kadro kaydıdır ([[0016-ayrilmis-ogretmen-kadrodan-turer]]). Kulübün kulüp saati yeri de bu formdan seçilir. Danışmanı başka bir aktif kulübün danışmanı olan öğretmen, oluşturmada, danışman değişiminde ve yeniden aktifleştirmede reddedilir (409).

2. **Katılma ve ayrılma** — Tek katılma komutu iki modu karşılar: açık kulüpte anında üyelik ve sayaç artışı, onaylı kulüpte bekleyen başvuru. Ayrı "başvur" ucu yoktur ve yazılmayacaktır. Ayrılma da tek uçtur: bekleyen için geri çekme, üye için ayrılma; kulübün durumu süzülmez. Kimlik yetkilendirme başlığından çözülür; öğrenci başkasının adına işlem yapamaz. Kontenjan başvuruda kapatılır, onayda yeniden bakılır; bekleme listesi yoktur. Öğrencinin sezonda başka bir kulüpte canlı satırı varsa (bekleyen başvuru dâhil) ya da okulda kulüp saati varken sınıfında yoksa katılma kulübün hâlinden bağımsız olarak reddedilir; cümle keşifteki "kapalı" gerekçesiyle aynıdır. Başvuru ve üyelik tek kayıttır ([[0014-kulup-basvurusu-ve-uyeligi-tek-kayit]]).

3. **Başvuru kararı** — Onay ve ret tek komut, iki kol. Kararı danışman **ya da** idare verir; izin `clubs.write`'tır (`clubs.manage` değil) çünkü karar danışmanın asli işidir ve öğretmende yönetme izni yoktur. Kulüp satırı karar sırasında değişmişse ayrı bir çakışma kodu döner. Danışmansız aktif kulüpte kararı idare verir; sonradan atanan danışman bekleyenleri devralır ([[0015-danismansiz-aktif-kulup-basvuru-alir]]). Onay anında tek üyelik yeniden sorulur: kural yürürlüğe girmeden düşmüş ikinci başvuru onaylanıp iki üyeliğe dönüşemez. Onay iki olay yayar; bugün yalnız "sonuçlandı" olayının tüketicisi var.

4. **Etkinlik ve yoklama** — Danışman etkinliği taslak açar, ayrı bir jestle yayınlar; iptal gerekçe ister. Yoklama listesi ilk açılışta üye listesinden türetilir, kaydedilince yalnız gönderilen satırlar yazılır. Tamamlanmış etkinlikte de yoklama yazılabilir. Her gece 23:00'te bir iş bitmiş yayınları "tamamlandı"ya çeker; okul okul, seri, idempotent. Danışman kartındaki etkinlik sayısı iptal edilmemiş bütün etkinlikleri, kulüp saati dâhil, sayar (`D-42`; kart "0" derken kulübün içindeki sekme kulüp saatlerini gösteriyordu).

5. **Kulüp duyurusu** — Tek adım yayın; imza çağırandan çözülür ve donar. Dört rol aynı uçtan okur.

6. **Öğrenci yüzü** — Keşif yalnız yayındaki kulüpleri gösterir; durum süzgeci parametreye açılmaz (taslak kulüpleri sorma yolu olurdu). Tanınmayan kategori 400'dür, boş liste değil. "Kulüplerim" yalnız üyelikleri gösterir, bekleyen başvuru keşifte "bekliyor" hâliyle görünür ve oradan geri çekilir. Pasife alınmış kulübün üyesi detaya girip ayrılabilir; yayında olmayan kulübü yalnız orada canlı satırı olan öğrenci görür, taslak kulüp herkese 404'tür. Öğrenci detayı üye listesini döndürmez, yalnız sayıyı — üye listesi kişisel veridir. Yaklaşan etkinlikler ve geçmiş yalnız aktif sezondur.

7. **Veli yüzü** — Rota "velinin çocukları" bir kapsam bildirimidir: çocukları sunucu bulur, öğrencinin kendisi bu uçlardan kendini göremez (404), çocuğu olmayan veli boş liste alır. Kapsam dışı çocuk 404'tür, 403 değil. Sezonsuz okulda özet boş döner, tekil kulüp 404. Veli katılamaz, işaretleyemez; öğrencinin detay DTO'su aynen döner ama yazma düğmesi hiç çizilmez ve veli şemasında "katılabilir" alanı `false` değil **hiç yoktur**. Bekleyen başvuru veli özetinde görünmez — veli sürecin sonucunu bekler, adımlarını görmez.

8. **Bildirim ve push** — Dört domain olayı dört handler'la uygulama içi bildirime ve push'a akar. Alıcı kümeleri bilinçli olarak farklıdır: başvuru sonucu yalnız öğrenciye; etkinlik yayını üyelere **ve** velilerine; etkinlik iptali yalnız kayıtlılara ve velilerine; duyuru yalnız üyelere. Kaynak kayıt okunamıyorsa bildirim sessizce düşer. Push eşlemesi handler'larla aynı fazda açıldı — erken açılsaydı her hesabın tercih ekranında çalışmayan bir düğme doğardı. Bugün dördünün de push varsayılanı açıktır ve katalogda dördü de "teslim ediliyor" işaretlidir (K-34: push kapsamındaki her olayın katalog varsayılanı açık olmak zorunda; "kapsamda ama varsayılan kapalı" hâli yok). E-posta ve SMS kulübün bütün olaylarında kapalıdır.

   **Tercih ve yerleştirme olayları (2026-10-12) — altı tür daha, toplam on.** Alıcı kümeleri: *tercih dönemi açıldı* kapsamdaki, üyeliği olmayan öğrencilere; *tercih hatırlatması* yalnız tercihini kaydetmemiş kapsam öğrencilerine; *tercih dönemi kapandı* kapatan **hariç** diğer idarecilere (katılım özetiyle); *yerleştirme sonucu* yerleşen, kulübü değişen ya da çıkarılan öğrenciye **ve velisine** (bilgi yetkisi kısıtlı veli almaz, yetki çocuk başınadır); *yerleşmedi* yalnız ilk yayında, yalnız öğrenciye; *danışmana yerleştirme özeti* öğrenci giren ya da çıkan kulübün danışmanına, kulüp başına bir haber (danışmansız kulüp atlanır). Tercih süreci veliye hiç gitmez (K-8: veli süreci değil sonucu görür). Push yalnız eyleme çağıran (açıldı, hatırlatma) ya da beklenen sonucu taşıyan (yerleştirme sonucu) üç olayda kapsamdadır ve varsayılanı açıktır; kapanış, yerleşmedi ve danışman özeti haberdir, push kapsamı dışındadır. "Yerleşmedi" bu yüzden ayrı bir türdür: push varsayılanı tür başınadır, aynı türde kalsaydı kaygı üreten ve eylemi olmayan bu haberin push'u kapatılamazdı. Olay kimlikleri belirlenimlidir (dönem + açılış sırası, dönem + gün, dönem + yayın sürümü): aynı jestin retry'ı çift bildirim üretmez, yeniden açma ve sonraki yayın yeni bildirimdir. İkinci yayında yalnız farktan etkilenen öğrenci ve kulüpler bildirim alır. Dönem okunamazsa ya da açılış/hatırlatma anında artık açık değilse bildirim sessizce düşer.

9. **Kabul modu kapısı** — Okulun modunu okuyan ve ona göre karar veren tek yer bir kapıdır; katılma, ayrılma, başvuru kararı, keşif hâli, öğrenci detayı, tercih ve yerleştirme uçları ondan beslenir, cümleler de oradadır (TB-32: ekran "Katıl" derken uç 409 dönemez). Mod önbelleğe alınmaz, istek başına bir kez okunur; ayar satırı yoksa öğretmen sayılır. İdare modunda öğrencinin katılma, ayrılma ve başvuruyu geri çekme jestleri ile danışmanın onay/ret kararı 409 döner; öğretmen modunda tercih dönemi ve yerleştirme uçlarının hepsi 409 döner. Öğrenci ve veli yanıtlarında kulübün kendi katılım modu ve başvuru penceresi idare modunda yok sayılır. Öğrenci yanıtları (keşif, detay, Kulüplerim, tercih ekranı) bir **kabul bloğu** taşır: mod, Hazırlık dışındaki dönem, "tercihini kaydetti mi", "yerleştirme yayınlandı mı" ve uygunluk; öğretmen modunda dönem alanları boştur ve veritabanına sorulmaz, veli yüzünde blok hiç üretilmez. Danışman paneli ve idare detayı da modu bu bloktan öğrenir. Ayarın kendisi okul ayarları altındaki salt okunur bir uçtan, kulüp okuma izniyle okunur.

10. **Tercih dönemi (idare modu)** — İdare sezonun dönemini Hazırlık'ta oluşturur (sezonda tek dönem; isteğe bağlı hedef son gün yalnız bilgidir), hazır olduğunda "Tercihe Aç" der; kapatmak ayrı jesttir, tarih dönemi açıp kapatmaz. Kapatılan dönem yayın yapılmadıysa yeniden açılabilir; yalnız Hazırlık dönemi silinir. Açıkken idare katılım özetini (kapsamdaki N öğrenciden M'si tercih yaptı), tercih yapmayanlar listesini görür ve günde bir kez hatırlatma gönderebilir. Öğrenci tercih ekranında dönemi, seçilebilir kulüpleri (sezonun aktif kulüpleri) ve kendi listesini görür; sıralı üç kulübü kaydeder ve dönem açık kaldıkça değiştirir. Üyeliği olan ya da kulüp saati kapsamı dışındaki öğrenci tercih yapamaz ve gerekçeyi görür. Bkz. [[Kulüp Tercih Dönemi]], [[Kulüp Tercihi]].

11. **Yerleştirme ve yayın (idare modu)** — Yerleştirme ekranı dönem açıldıktan sonra açılır (açıkken ön çalışma). Evren kapsamdan canlı türer; tablo şube, kulüp ve durumla süzülür. Otomatik yerleştirme tercih turlarıyla kontenjanı aşmadan dağıtır (taşan kulüpte önce kaydeden), isteğe bağlı olarak yerleşmeyenleri ve tercih yapmayanları boş kontenjanlara dağıtır; elle düzenlenmiş satırları koruyabilir, yayınlanmış satırlara hiç dokunmaz. İdare elle düzeltir, gerekirse kontenjanı aşar (uyarıyla) ve **kaydeder** — taslak kimseye ulaşmaz. **Yayın** dönem kapalıyken yapılır; önizleme yeni, değişen ve çıkarılan öğrencileri, yerleşmeyenleri, kulüp doluluğunu, bildirim alacak veli sayısını ve yayını durduracak engelleri gösterir — yayın aynı hesabı uygular, kısmi yayın yoktur. Yayın tek işlemde üyelikleri doğurur ya da ayırır, sonra (commit'ten sonra) kulüp saati etkinliğini hizalar. Yayından sonra sonradan gelen ya da yerleşemeyen öğrenci aynı ekranda elle yerleştirilir ve yalnız fark yeniden yayınlanır. Eşzamanlı iki idareciyi dönemin sürüm damgası sıraya sokar. Bkz. [[Kulüp Yerleştirmesi]].

**Yetki — iki katman.** İzin anahtarları ucu açar: **okuma** (liste, detay, etkinlik, duyuru), **yazma** (danışmanın kendi kulübünde etkinlik/duyuru, üyelik kararı, yoklama), **yönetme** (açma, kapama, danışman atama, okul geneli görünüm), **katılma** (kulübe başvurma, etkinliğe kaydolma). Seed'de idarede okuma-yazma-yönetme; öğretmende okuma-yazma; velide yalnız okuma; öğrencide okuma-katılma. Katılma hiçbir yetişkin rolde yoktur. Tercih ve yerleştirme yeni bir izin anahtarı açmadı: idarenin bütün dönem ve yerleştirme uçları **yönetme** ister (ve aktif sezona yazma politikasından geçer); öğrencinin tercih kaydı **katılma** ister — veli bu yüzden tercih yapamaz; tercih ekranının okunması **okuma** ister ama öğrenci olmayan oturum 403 alır. İzin ucu açar, kabul modu kapısı modu sorar: izni olan idareci öğretmen modundaki okulda dönem açamaz (409).

Handler içindeki ikinci katman "hangi kulüp" sorusunu sorar ve sırası sabittir: **danışmanlık → idare → kapsam dışı (404)**. Kendi kulübüne bakan müdür yardımcısı "idare" değil "danışman" görür. Kimliği bir kişiye bağlanamayan oturum, yönetme izni olsa bile hiçbir görünüm almaz — yönetme bir kişinin yetkisidir, sahibi belirsiz yazma yolu bırakılmaz. Öğrencinin kapsamı kimlikten değil kulübün hâlinden ve üyelikten gelir; velinin kapsamı ilişkiden. Üç eksen üç ayrı kapıda yaşar ve sıra tek yerde (görünüm çözücüde) durur; bir ara ikinci bir yerde tekrar ediliyordu ve testin koruduğu ile çalışanın ayrışma riski doğdu, kaldırıldı.

**Kapsam dışı = 404, 403 değil.** 403 kaynağın varlığını doğrular; üye listesi kişisel veridir. Bu yüzden kapsam dışının bir hata kodu yoktur. Başvuru listesinde kapsam kapısı süzgeç doğrulamasından **önce** koşar: görülemeyen kulüpte bozuk süzgeç de 404'tür.

**Sezon izolasyonu.** Tenant süzgeci otomatiktir, sezon süzgeci değildir; her sorgu elle yazar ve okuma ile yazma aynı kapıdan geçer — aksi hâlde "okuma 404 verirken yazmanın çalıştığı" bir kulüp doğardı. Sezonsuz okulda **okuma** boş liste ya da 404 döner (kulüp yoktur), **yazma** 409 döner (kaydı nereye yazacağını bilemez). Tek istisna danışman havuzudur: sezon eksenli değil kadro eksenlidir, yoksa sezon devri gününde bütün öğretmenler havuzdan düşerdi.

**Hata sözleşmesi.** Kodlar `Clubs.` önekiyle gelir ve HTTP durumu önekten çözülür: doğrulama 400 (bozuk süzgeç, tanınmayan kategori, kadroda olmayan danışman, durum değiştirmede taslak hedefi, roster'da üye olmayan öğrenci); durum makinesi ihlali, kontenjan dolu, eşzamanlı karar, sezon yok ve aynı adda kulüp 409; kapsam dışı, başka sezonun kulübü ve okuma yolunda sezonsuz okul 404. 409 ölçütü: "gövde kusursuz, kaydın hâli uygun değil" — aynı istek koşul değişince aynen geçer. Domain istisnasının Türkçe mesajı korunur ve doğrudan kullanıcıya gösterilir.

Kabul modu, tercih ve yerleştirme aynı ölçütle 409 ailesine eklendi — hepsinde gövde kusursuz, okulun, dönemin ya da taslağın hâli uygun değil: jest bu okulun modunda yok (idare modunda katılma/ayrılma/karar; öğretmen modunda tercih ve yerleştirme — iki ayrı kod, aynı istek öbür modda aynen geçerdi), dönem tercihe açık değil (hatırlatma ve Hazırlık'taki yerleştirme jestleri de bu kodu kendi cümlesiyle döner), sezonda dönem zaten var, öğrenci tercih yapamaz (üyeliği var ya da kapsam dışı), hatırlatma bugün zaten gönderildi, yerleştirme başkası tarafından değiştirildi (bayat sürüm damgası), dönem açıkken yayın, yayını durduran tek üyelik / aktif olmayan kulüp çatışması. Doğrulama (400): geçmişte hedef son gün, tercih listesinin kendi kuralları (boş, uzun, tekrarlı, aktif olmayan kulüp, eksik seçim), yerleştirmede evren dışı öğrenci, aktif olmayan kulüp ya da yerleştirme dışı üyeliği olan öğrenciye atama, tanınmayan durum süzgeci. Ad tekilliği iki katmandır: ön kontrol hatayı anlaşılır yapar, indeks son savunmadır ve ihlal indeks adından tanınır.

### Kulüp saati (`Y-06`, 2026-09-26 · `E-34` · `B-92` · `B-98` · `Y-07`)

- Kulübün **kulüp saati yeri** okulun derslik kataloğundan seçilir (isteğe bağlı; boşsa "Belirtilmedi"). Kulüpte kullanılan derslik silinemez.
- **Tek aktif danışmanlık:** öğretmen bir sezonda yalnız bir aktif kulübün danışmanı olur (oluşturma, danışman değişimi, yeniden aktifleştirme). Pasif kulüp sayılmaz.
- **Tek üyelik:** öğrencinin bir sezonda tek canlı (bekleyen/aktif/askıda) üyeliği olur; keşifte öteki kulüpler "kapalı" ve gerekçeli, katılma ve onay uçları reddeder.
- **Başvuru kapsamı:** okul kulüp saatini programa koyduysa sınıfında kulüp saati olmayan öğrenci kulüpleri görmez, başvuramaz.
- **Kulüp saati etkinliği:** programda kulüp saati olan her hafta her aktif kulübe sistem açar (tür `clubHour`); aktif üyeler kayıtlı doğar, öğrenci geri çekemez, kontenjan kapısı işlemez, elle iptal edilemez, tatilde açılmaz. Yoklamayı danışman alır; işaret öğrencinin devamsızlığına yazılır (`E-34`, bkz. [[Yoklama ve Devamsızlık]] · Kulüp saati): mazeret kapsar, düzeltme penceresi işler, işaretlenmiş yoklama "kayıtlı"ya geri alınamaz.
- **Açılış ve hizalama — tek yer:** her sabah 06:20'de bir iş, okul okul, bugünden haftanın cumasına kadar hizalar; zil çizelgesini ya da gün atamasını değiştiren her komut da kayıttan sonra aynı hizalamayı çağırır. Kaynak her gün için o gün yürürlükteki program sürümüdür (`Y-07`: yayın günü ikiz etkinlik doğmaz); saat o günün zilinden, yer kulübün dersliğinden gelir. Aynı gündeki ardışık kulüp saatleri tek etkinliktir. Okul günü olmayan, tatil ya da zili o saatte ders olmayan gün pencere üretmez. İşin HTTP ucu yoktur ve izin kapısı taşımaz (sistem komutu).
- **Zil değişince (`B-98`):** başlangıcı aynı kalan etkinlik yerinde kalır (başlamadıysa bitişi güncellenir); kayan pencereye başlamamış eski etkinlik **taşınır** — kimliği ve katılım satırları korunur, ikiz açılmaz. Hiçbir pencereye uymayan, başlamamış ve hiç işaretlenmemiş etkinlik katılımlarıyla birlikte **yumuşak silinir**, iptal edilmez: iptal üyelere bildirim üretir ve listede "İptal" olarak kalırdı, oysa hiç gerçekleşmeyecek bir saatin duyurulacak iptali yoktur. Başlamış ya da işaretli etkinliğe dokunulmaz.
- **Üye listesi başlangıca dek izlenir:** başlamamış etkinliğe yeni aktif üye kayıtlı eklenir, üyeliği biten öğrencinin kaydı geri çekilir.
- **Yoklama saati (`B-92`):** kulüp saatinde "katıldı/katılmadı" en erken başlangıçtan 5 dakika önce işaretlenir; şube yoklamasıyla aynı kural, aynı kaynak. Sıradan etkinlik bu kapıya takılmaz.
- **Eşleşmeyen yoklama sessiz geçmez (`B-98`):** etkinliğin saati öğrencinin şubesinin programındaki kulüp saatiyle eşleşmiyorsa yoklama reddedilir ve "idareye bildirin" denir; katılım ve devamsızlık tek kayıtta yazıldığı için biri reddedilirse ikisi de yazılmaz.
- **Program tarafındaki yansımalar** (sahibi bu modül değil): yayın hazırlık kontrolü kulüp saatinin şubeler arasında farklı dilimde olmasını ve danışmanın o dilimde başka şubeye ders almasını engel; kulüpsüz öğrenciyi, kapsam dışındaki üyeliği, danışmansız aktif kulübü, yeri belirtilmemiş kulübü ve aynı derslikteki iki kulübü uyarı sayar. Aktif kulübü olan danışman o dilimde meşguldür (vekil/nöbetçi olarak boş sayılmaz) ve kulüp saati haftalık ders yüküne bir kez eklenir (bkz. [[Ders Programı Yönetimi]], [[Görevlendirmeler]]).

## Kapsam dışı

- **Ayrı "başvur" ucu.** Sözleşmede vardı, ekranda ölüydü; tek katılma komutu iki modu karşılar.
- **Üyelik duraklatma.** Enum ve sayaç var, yazan uç yok; "duraklatılmış üye kontenjanda yer tutar mı" sorusu o uçla birlikte cevaplanacak.
- **Kulüp içi rol atama** (başkan, yardımcı). Etiket olarak kolonda var, yazan uç yok; yetkiye bağlanmayacak.
- **Bekleme listesi.** Kontenjan başvuruda kapatılır.
- **Sayfalama.** Kulüp, üye, başvuru ve veli özeti listeleri tek yanıtta döner; sözleşmede de yok. Yüzlerce kulüplü okul çıkarsa yeniden düşünülür.
- **Duyuru düzenleme ve silme.** Yeni duyuru yayınlanır.
- **Geçmiş sezon görünümü.** Hiçbir uç sezon parametresi almaz; arşiv kulüp yalnız idarenin listesinde görünür.
- **Ders saatiyle çakışan sıradan etkinliğin devamsızlık köprüsü.** Devamsızlığa yalnız kulüp saati etkinliği yazılır; gezi, turnuva gibi sıradan etkinlik bilinçli olarak yazmaz. (Ders programındaki kulüp saatiyle bağ 2026-09-13'te kapsam dışıydı; `Y-06` kurdu.)
- **Dosya bağı.** Dosya kategorisi kataloğunda "kulüp belgesi" tanımlı, ama kulüp kayıtlarına dosya bağlanamıyor (bkz. [[Dosya Kategorisi]]).
- **Öğretmen için etkinlik detay ucu** ve öğrenci için **geçmiş etkinlik listesi.**
- **Veliye yazma.** Salt okunur; tercih listesi rol süzgeci push tarafında ayrı iş.
- **Taslak etkinlik silme.**
- **Etkinlik hatırlatması.** Ödevin bir yükümlülüğü vardır; etkinliğe kaydolmak gönüllüdür.
- **Kabul modunun sezon içinde değişmesi.** Yazma ucu yoktur; değer yalnız sezon aktivasyonunda yazılır (K-3). Bekleyen başvuruların sahipsiz kalması ya da açık dönem varken modun dönmesi bu yüzden doğmaz ve kapısı yazılmadı.
- **Sezonda ikinci tercih dönemi** (K-6). Sonradan gelen ya da yerleşemeyen öğrenci elle yerleştirilir.
- **Tarihle açılıp kapanan dönem** (K-16). Hedef son gün yalnız bilgidir; zamanlanmış iş yoktur, kapatmayı unutmanın çaresi ekrandaki rozettir.
- **Tercih sayısının okulca ayarlanması** (K-12). Üç, kodda sabittir.
- **Veliye tercih süreci** (K-8). Veli tercih yapamaz, dönemi ve onun bildirimlerini görmez; yalnız yerleştirme sonucunu alır.
- **Yerleştirme sonucu Excel çıktısı** (K-13). Kararı verildi, sonraki dilime bırakıldı.
- **Yayınlanmış dönemi yeniden açmak** (K-14). Yayından sonra tek yol elle yerleştirme ve fark yayınıdır.

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- **Üç domain olayı tüketicisiz yayılıyor** (kulüp oluşturuldu, etkinliğe kayıt oluşturuldu, etkinlik tamamlandı). Bilinçli — hiçbiri bir kullanıcı bildirimi değil; audit ya da haftalık özet isterse bildirim handler'ı değil projeksiyon uygun. Kalıcı karar mı?
- **Docker'lı ortamda hiç koşmamış şeyler:** Faz 0–3 migration'ları (entegrasyon testleri şemayı modelden kuruyor, filtreli/tekil indeks iddiaları kanıtsız), Faz 3'ün 13 entegrasyon iddiası, veli yüzünün 7 iddiası (fixture'ın ikinci sezon aktivasyonu tekil indekse takılıyor, arşivleme kalıbına çevrilmeli), gece işinin iki-okul tenant filtresi testi.
- Kimlik çözümü iki yerde yazılı (danışman/idare ekseni ve veli ekseni aynı sorguyu koşuyor). Kabul edilen borç; veli push tercih listesi doğduğunda üçüncü eksenle ortak çekirdek yazılacak.
- Veli tercih listesi rol süzgeci olmadan döndüğü için veli, kendisine hiç gitmeyecek "kulüp duyurusu" için push düğmesi görebilir; DTO'ya uygunluk alanı merkezi çözüm.
- Ekran tarafında (oksis-ui) açık kalanlar backend'i beklemez: bildirim çözümleyicisinde kulüp kolu yok, kategori sabiti Türkçe etiketi tel değeri sanıyor, modül kataloğunda `clubs` anahtarı yok. Domain notu değil ama modülü kapatanın bilmesi gereken liste.
