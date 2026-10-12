---
tags: [decision, domain/clubs]
date: 2026-10-12
status: accepted
---

# 0023 — Kulüp üye kabul sorumlusu sezon başında seçilir; idare modunda tercih ve yerleştirme

## Bağlam

Kulüp saati tasarımı iki kural koymuştu: öğrencinin sezonda tek kulüp üyeliği olur ve kulüp saati olan sınıflarda her öğrenci bir kulübe üye olmak zorundadır. İkinci kuralı sağlayan bir araç yoktu, yalnız program yayınında "kulüpsüz öğrenci" uyarısı vardı. Bugünkü akışta öğrenci kulübe kendisi katılır ya da başvurur, kararı danışman öğretmen verir. Bu akışta okul dağılımı yönetemez: popüler kulüpler dolar, öteki öğrenciler açıkta kalır. Bazı okullar kulüp dağıtımını idarenin yapmasını istiyor.

Soru, bunu her okul için ayrı bir süreç olarak açmak ve ne zaman değişebileceğine karar vermekti. Mod sezon ortasında değişebilseydi öğretmen modundan kalan bekleyen başvurular sahipsiz kalır, açık bir tercih dönemi varken mod dönebilirdi.

## Karar

Okul ayarına **"Kulüp Üye Kabul Sorumlusu"** eklenir: **Öğretmen** (varsayılan, bugünkü akış) ya da **İdare**. Değer yalnız sezon açma sihirbazında seçilir ve **sezonun aktifleştiği anda** okula yazılır; sezon içinde değişmez. İdare modunda öğrenci sezonun tek tercih döneminde üç kulübü sıralar, idare yerleştirir ve ayrı bir jestle yayınlar.

Planın bu karara bağlı kalemleri (2026-10-12):

- **K-3 — sezon içinde değişmez.** Seçim sihirbazda yapılır, Ayarlar'da salt okunur görünür; ayrı bir yazma ucu yoktur. Sezonu zaten açık okul İdare'ye ancak bir sonraki sezon açılışında geçer (K-17).
- **K-4 — taşan kulüpte tercihini önce kaydeden kazanır.** Ölçüt son kayıt anıdır; tercihini değiştiren sırasını yeniler.
- **K-6 — sezonda tek tercih dönemi.** Sonradan gelen ya da yerleşemeyen öğrenci ikinci bir dönemle değil, elle yerleştirmeyle çözülür.
- **K-7 — idare elle atamada kontenjanı aşabilir.** Kontenjan bir hedeftir, uyarıyla gösterilir; otomatik yerleştirme aşmaz.
- **K-8 — veli yalnız sonucu görür.** Tercih süreci ve onun bildirimleri veliye gitmez; yerleştirme sonucu gider.

## Değerlendirilen alternatifler

- **Modu sezon açılışında (`OpenSeasonFromDraft`) yazmak.** İlk tasarım buydu. Açılış "Setup" durumunda bir sezon üretir ve eski sezon aktivasyona kadar aktif kalır; mod o an yazılsaydı eski sezon sezon ortasında yeni modla çalışırdı ve eski moddan kalan bekleyen başvurular sıkışırdı. Yazım aktivasyona taşındı (uygulama notu).
- **Ayarı Ayarlar'dan her an değiştirilebilir yapmak.** Bekleyen başvuruların sahibi ve açık dönemin akıbeti için ayrı kapılar gerekirdi. K-3 bu senaryoları doğmadan kaldırır; bu yüzden "ayar değişince danışmana bildirim" kalemi (K-10) de düştü.
- **Modu sezona bağlı bir kayıtta tutmak.** Değer değiştirilmedikçe her sezon aynen sürmeli; okul ayarında durup sihirbazda önceki değerle varsayılan gelmesi bunu kayıt çoğaltmadan sağlar.
- **Kontenjan kapısını bir bayrakla gevşetmek.** Kulübün sayaç metodunu bayrakla açmak, onu çağıran her yola (öğretmen modunun katılma ve onay yolları) aynı gevşetmeyi açık bırakırdı. Kontenjanı atlayan ayrı bir metot yazıldı ve tek çağıranının yerleştirme yayını olduğu bir mimari testle kilitlendi.
- **Hatırlatmayı dönem satırında bir alan olarak tutmak** (plan §4.5 böyle diyordu). Dönem satırının sürüm damgası yerleştirmenin eşzamanlılık damgasıdır; hatırlatma onu döndürür ve taslakta çalışan idarecinin Kaydet'ine sahte 409 düşürürdü. Küçük ayrı bir tablo açıldı.
- **"Yerleşmedin" haberini yerleştirme sonucuyla aynı türde göndermek.** Push varsayılanı tür başınadır; aynı türde kalsaydı kaygı üreten ve eylemi olmayan bu haberin push'u kapatılamazdı. Ayrı tür oldu.
- **Kontenjansız kulübü "sonsuz boş yer" saymak.** Boş kontenjanlara dağıtımda herkes tek kulübe yığılırdı. Kontenjanlı kulüpler önce dolar, kontenjansızlar taşma havuzudur.
- **Tek üyelik çatışmasında satırı atlayıp yayını sürdürmek.** İdarenin onayladığı önizleme ile uygulanan sonuç ayrışırdı. Yayın tümüyle durur.
- **Yayından sonra otomatik yerleştirmenin yayınlanmış öğrencileri yeniden hesaplaması.** Varsayılan seçenekle yapılan bir koşu yüzlerce öğrenciyi kulüpten çıkarıp toplu bildirim üretebilirdi. Yayınlanmış satır otomatik koşunun dışındadır.

## Sonuçları

- Modu okuyan ve karar veren **tek yer** bir kapıdır: katılma, ayrılma, başvuru kararı, keşif hâli, öğrenci detayı, tercih ve yerleştirme uçları ondan beslenir. Ekran "Katıl" derken ucun 409 dönmesi (TB-32) bu yüzden mümkün değildir. Kapı modu önbelleğe almaz; ayar yalnız aktivasyonda değiştiği için unutulan bir önbellek düşürmesi yeni sezonun ilk saatlerini eski modla çalıştırırdı.
- İdare modunda öğrencinin kendi jestleri (katılma, ayrılma, başvuruyu geri çekme) ve danışmanın başvuru kararı kapalıdır (409). Kulüp saati zorunlu üyeliği öğrencinin kendi eliyle bozulmaz (K-9); değişikliği idare yerleştirme ekranından yapar.
- Öğretmen modu bugünkü davranışını aynen korur: göç varsayılanı öğretmendir, tercih ve yerleştirme uçları bu modda 409 döner.
- Kulüpler arası tek üyelik veritabanında korunmaz (üyelik sezon kolonu taşımaz); uygulama katmanında, yayın engeli ve sezon kurallarıyla durur.
- Geri dönülürse (sezon içinde değişen mod): bekleyen başvuruların ve açık tercih döneminin akıbeti için ayrı kapı yazmak, kapının önbelleksiz okumasını yeniden düşünmek ve aktivasyondaki tek yazım yerini (`SeasonClubAdmissionModeApplier`) bir yazma ucuyla paylaştırmak gerekir.

## İlgili

- [[Okul Ayarları]]
- [[Kulüp Tercih Dönemi]]
- [[Kulüp Tercihi]]
- [[Kulüp Yerleştirmesi]]
- [[Kulüp Üyeliği]]
- [[Kulüpler]]
- [[Sezon Yönetimi]]
- [[0014-kulup-basvurusu-ve-uyeligi-tek-kayit]]
