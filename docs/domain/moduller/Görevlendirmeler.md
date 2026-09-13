---
aliases: [Assignments, TeachingAssignments, api/v1/assignments, Görevlendirme Hub]
tags: [domain/academic, module]
status: completed
last-synced: 2026-09-13 (294ffe6)
---

# Görevlendirmeler

<!-- generated:start -->

## Ne yapar

Okul yöneticisinin "hangi öğretmen hangi dersi verebilir" sorusunu cevapladığı modül. Yıl başında dersler öğretmenlere bağlanır, kapsaması olmayan dersler görünür kılınır, alan-dışı atamalar gerekçelendirilir, yıl içinde devir olursa görev kapatılır ve yeni sezona geçerken geçen yılın yetkinlikleri kopyalanır. Öğretmen yükü ve öğretmenin ders listesi de buradan okunur — ama bu modülde yazılmaz, yayınlanmış ders programından türetilir.

Modülün taşıyıcı fikri **"öğretmen ≠ görevlendirme"**: kişi ve istihdam kalıcıdır, görevlendirme sezona bağlıdır. Sezon değişince öğretmen silinmez, yeni görevlendirme açılır. Kapatma da silme değildir — görev geçmişi her zaman okunabilir kalır.

İkinci taşıyıcı fikir **engelleme değil iz bırakma**: sistem alan-dışı atamayı yasaklamaz, gerekçe ister ve kaydeder. Sahada branş dışına çıkmak zorunluluk olduğu için karar okula bırakılmış, denetlenebilirlik sisteme.

## Tek kayıt, üç soru

"Görevlendirme" üç ayrı soruyu karşılar; karışıklığın kökü üçünün aynı adla anılmasıydı:

| Soru | Nerede yaşar | Nasıl |
|---|---|---|
| Kim hangi dersi **verebilir**? | [[Ders Görevlendirmesi]] | elle, bu modülde |
| Kim hangi şubede **versin**? | [[Dağıtım Kısıtı]] | isteğe bağlı, [[Ders Programı Yönetimi]]'nde |
| Kim nerede kaç saat **veriyor**? | yayınlanmış [[Ders Programı]] | türetilir, hiçbir yerde elle yazılmaz |

Fiili yükü elle tutan eski model ([[Şube Ders Görevlendirmesi]], "v1") programla senkron kalamadı: yazan ekran yokken okuyan her yüzey sessizce boş dönüyordu. 2026-08-18'de tablosu ve yazma yüzeyi kaldırıldı (`K-10`, `X-15`). Bugün modülde **tek nesil** vardır; kodda hâlâ görülen "v2" adı bu tarihçeden kalır. İş ihtiyacı tarafındaki gerekçe için: [Görevlendirme iş ihtiyacı analizi](../../teknik-analizler/gorevlendirme-is-ihtiyaci-analizi.md).

## Kullandığı kavramlar

- [[Ders Görevlendirmesi]] — modülün tek kaydı; yetkinlik
- [[Ders]] — görevlendirmenin bir ucu
- [[Branş]] — uyumun hesaplandığı katalog
- [[Profil]] — diğer uç; öğretmen profili, branşları ve haftalık kapasitesi
- [[Sezon]] — her görevlendirme bir sezona aittir; sert sınır
- [[Ders Programı]] — öğretmen yükünün ve öğretmenin ders listesinin kaynağı
- [[Nöbet Çizelgesi]] / [[Kulüp]] — öğretmen yükündeki ders dışı yükün kaynakları
- [[Dağıtım Kısıtı]] — yetkinliğin üstüne binen dağıtım niyeti; bu modülde yazılmaz

## Ana akışlar

1. **İki eksenli dağıtım** — Ekran iki yönden çalışır: ders ekseninde bir derse birden çok öğretmen bağlanır, öğretmen ekseninde bir öğretmene birden çok ders. İkisi de aynı (ders, öğretmen) ikilileri listesiyle ifade edilir, yani tek bir yazma yolu vardır. Zaten aktif olan ikililer atlanır.

2. **Aday listeleme** — Seçim yapılırken zaten atanmış olanlar elenir, kalanlar branş uyumuna göre sıralı döner. Ders havuzu okulun aktif kademeleriyle süzülür; kademe tanımlanmamışsa bütün aktif dersler görünür.

3. **Üç değerli branş uyumu** — Öğretmenin ana branşı dersi okutabilen branşlardan biriyse branş-içi, yan branşlarından biri ise yan branş, hiçbiri değilse alan-dışı. Uyum **saklanmaz, her okumada hesaplanır** ve ad değil **branş kimliği** üzerinden yapılır; ad karşılaştırması derslerin önemli kısmını kalıcı alan-dışı düşürüyor, ad değişiminde sonucu sessizce değiştiriyordu.

4. **Alan-dışı atama** — Engellenmez. Serbest metin gerekçe taşınır ve yalnız alan-dışı satırlarda gösterilir. Buna karşılık **branşsız öğretmene atama sert engeldir** — gerekçeyle aşılamaz.

5. **Kapsama görünümü** — Ders ekseninde her ders için kaç öğretmen atandığı ve alan-dışı bulunup bulunmadığı özetlenir. "Hangi ders sahipsiz kaldı" sorusu buradan cevaplanır. Sahipsiz ders otomatik üretimde "yerleşmemiş" kalır.

6. **Görev kapatma** — Yıl-içi devirde kayıt silinmez, kapatılır: kapatan kişi, tarih ve gerekçe yazılır. Kapatılmış kaydın gerekçesi bir daha değişmez.

7. **Sezon kopyalama** — Kaynak sezonun aktif (ders, öğretmen) çiftleri hedefe taşınır; ayrılmış öğretmen, pasif ders ve hedefte zaten aktif olan satırlar atlanır, bu yüzden tekrar çalıştırmak güvenlidir. Sezon aktivasyonu bu kopyayı bağlı taslaktaki tercihe göre kendisi çalıştırır. Dağıtım kısıtları kopyalanmaz.

8. **Öğretmen yükü** — Bir sezonun öğretmen yük özeti. Ders yükü **canlı ders programının** yerleşimlerinden sayılır (bir yerleşim bir ders saati), sezonun güncel dönemi üzerinden. Yüzde, öğretmenin **kişisel haftalık kapasitesine** göre hesaplanır — profilde özel değer yoksa varsayılan 30 saat (`K-13`). Kadro ortalamasının paydası kadronun tamamıdır: canlı yerleşimi olmayan öğretmen ortalamaya 0 olarak girer, çünkü sorulan soru "kadro ne kadar dolu"dur. Ayrıca **ders dışı yük** saat olarak gösterilir: canlı nöbet çizelgesindeki nöbet günü ve aktif kulüp danışmanlığı, okulun katsayılarıyla (varsayılan ikisi de 2 saat) çevrilir. Bu saatler **yalnız bilgi amaçlıdır**; yük yüzdesine, aşım rozetine ve kapasite hesabına girmez (`K-15/3`) — kural kaynağında yazılıdır ki yeni bir tüketici "toplam yük" icat etmesin. Özet kısa ömürlü önbellektedir; program yayını ve sezon değişimi önbelleği tazeler.

9. **Öğretmenin ders listesi** — Öğretmenin hangi şubede hangi dersi okuttuğu yayınlanmış programdan okunur; yayın öncesinde boştur.

10. **Görev geçmişi** — Bir öğretmenin kapatılmış görevlendirmeleri dahil yetkinlik geçmişi okunabilir. Geçmiş yetkinlik eksenindedir: hangi yıl hangi **şubede** ders verildiği bu listede yoktur, o iz [[Program Sürümü]]'nde yaşar.

**Yetki:** `assignments.view`, `assignments.assign` (atama, gerekçe güncelleme, kapatma), `assignments.copy-season`. Öğretmenin ders listesi ve görev geçmişi `teaching-assignments.view` ile korunur — kaldırılan eski nesilden kalan tek izindir. Öğretmen yükü özeti ve ders dışı yük katsayıları `users.view` ile korunur. Onay iş akışı yoktur, yerine denetim izi vardır.

## Kapsam dışı

- **Gün ve saat yerleşimi** — Bu modül "kim hangi dersi verebilir" sorusunu çözer; "hangi gün hangi saatte" ders programının işidir. Görevlendirme değişince olay yayınlanır ama **dinleyen yoktur**: mevcut program değişmez, yeni yetkinliği yalnız sonraki otomatik üretim görür.
- **Şube ve saat** — Yetkinlik kaydı bilinçle saatsiz ve şubesizdir; şube programı üretilen sınıftır, saat müfredattan gelir.
- **Dağıtım niyeti** — "Bu şubeyi şu öğretmen alsın" bu modülde yazılmaz; [[Dağıtım Kısıtı]] olarak ders programı tarafında tutulur.
- **Onay iş akışı** — Bilinçli olarak yok; yerine öz-denetim ve otomatik denetim damgası konulmuştur.
- **Nöbet görevlendirmeleri** — Ayrı bir alandır ([[Nöbetler]]); buraya yalnız ders dışı yük saati olarak yansır.

## Açık Sorular (koddan doğrulanamayan)

- Öğretmen profilinde yan branş alanı var ve uyum onu okuyor, ama yan branşı yazan bir uygulama komutu bulunamadı. Üç değerli uyumun "yan branş" ayağı pratikte hiç doğmuyor mu?
- Ders dışı yük katsayıları gösterim amaçlı; nöbet yükü raporundaki "toplam" ise nöbet günü + yancılık + vekâlet adedi. İki farklı "nöbet yükü" sayısının aynı ekranda karşılaşması bekleniyor mu?

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- Öğretmen profilindeki branş kimliği davet ve toplu içe aktarma akışında çözülmüyor (pilotta boş bırakılıyor). Branşsız öğretmene atama sert engel olduğuna göre, bu öğretmenler görevlendirilemez mi kalıyor?
- Öğretmen yükü sorgusu `users.view` ile korunuyor, diğer görevlendirme sorguları kendi aileleriyle. Bu bilinçli mi?
