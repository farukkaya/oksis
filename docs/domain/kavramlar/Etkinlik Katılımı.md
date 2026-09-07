---
aliases: [ClubActivityParticipation, Katılım, Etkinlik Kaydı]
tags: [domain/clubs]
table: school.club_activity_participations
status: active
last-synced: 2026-09-02 (f5d6777)
---

# Etkinlik Katılımı

<!-- generated:start -->

## Nedir

Bir öğrencinin bir kulüp etkinliğine kaydı **ve** yoklaması — ikisi tek satırdır. Öğrenci "Katıl" dediğinde doğar, öğretmen etkinlik sonrası "geldi / gelmedi" işaretler. Etkinliğin çocuğu değil, kendi köküdür: roster ekranı, öğrencinin geçmişi ve velinin çocuk özeti bu satırları doğrudan sorgular.

## Yaşam döngüsü

```
  (öğrenci :register) ──► Registered ──(öğretmen)──► Present
                              │  ▲                 ──► Absent
                              │  └──(yoklamayı geri al)──┘
                              └──(öğrenci :unregister)──► Cancelled ──(:register)──► Registered
                                                              (AYNI SATIR)
```

- **Registered** — kayıtlı, yoklama henüz yapılmadı; kontenjanda yer tutar.
- **Present / Absent** — öğretmen işaretledi; işaretleme anı ve işaretleyen kişi dolar. Kontenjan sayacı değişmez — öğrenci kayıtlıydı, gelmedi; iki cümle farklı şey söyler.
- **Cancelled** — öğrenci kaydını geri çekti; kontenjan sayacı düşer. **Terminal değildir**: aynı satır yeniden kayda döner.

## Kurallar

- **Tekillik koşulsuzdur ve satır silinmez.** Üyelikten farklı olarak "ayrılıp yeniden kaydolma" burada tarihçe değil çift kayıttır — etkinlik tek bir andır, aynı öğrenci iki kez kayıtlı görünemez. Bu yüzden geri çekilmiş satır yeniden açılır, yeni satır doğmaz.
- **Geri çekme yalnız "kayıtlı" hâlden çalışır.** Yoklaması yapılmış kaydı öğrenci geri çekemez — öğretmen kararını vermiştir. Canlı kayıt yoksa (ya da zaten geri çekilmişse) sonuç 404'tür, "zaten iptal" değil: çekilecek bir şey yoktur. Yeniden kayıt da yalnız geri çekilmiş satırdan çalışır; zaten kayıtlı satırda ikinci kayıt sessiz no-op değil hatadır — no-op sayaç bağını ikinci kez tetiklerdi.
- **Öğretmenin işaretlemesinde durum kapısı yoktur ve bu kasıtlıdır.** Roster kaydı her satırı gövdedekiyle eşitler; "geldi → gelmedi → geldi" öğretmenin fikir değiştirmesidir. Geri çekilmiş satırı "geldi" işaretlemek de meşrudur ama sayaca dokunmaz: satır kaydın hayatını değil **yoklamanın gerçeğini** saklar.
- **Sayaç bağı yalnız kayıtlı ↔ geri çekilmiş döngüsündedir** ve bu sınıf kurmaz; handler önce etkinliğin sayaç kapısını, sonra bu satırı yazar — iki aggregate, tek işlem.
- **İşaretleme anı öğretmenin işaretlediği andır, öğrencinin geldiği an değil**; "yoklamayı geri al" da bu anı günceller — o kararın da bir zamanı vardır. Kayıt anı ise geri çekmede korunur, yeniden kayıtta güncellenir ("ne zaman kaydoldu" son kaydı söyler).
- **Üye olmayan öğrenci kaydolamaz**; kapı bunu ayrı bir hata değil "bu etkinlik senin için yok" (404) olarak döndürür. Kontenjan doluysa 409.
- **Geçmişte yalnız "geldi" sayılır.** Öğrencinin ve velinin dönem içi aktivite geçmişinde etkinlik sayısı yalnız Present satırlarıdır; gelmedi, geri çekilmiş ve henüz yapılmamış yoklama geçmiş sayılmaz. Saat sayısı satırların dakikalarının toplamının saate yuvarlanmasıdır. Geçmiş yalnız aktif sezondur.
- Kimliği çözülemeyen çağıran geçmiş sorgusunda boş özet alır, 403 değil.

## İlişkiler

- [[Kulüp Etkinliği]] — sahibi; sayaç orada, kapı orada
- [[Kulüp Üyeliği]] — kayıt için ön koşul (aktif ya da duraklatılmış üye)
- [[Kişi]] — öğrenci ve işaretleyen öğretmen; yalnız kimlik
- [[Veli-Öğrenci İlişkisi]] — velinin çocuğunun geçmişini görme kapsamı
- [[Etkinlik Yoklaması]] — komşu kavram; güvenlik sayımıdır, bununla birleşmez

## Geçtiği modüller

- [[Kulüpler]] — kayıt, geri çekme, roster, aktivite geçmişi (öğrenci ve veli yüzü)

<!-- generated:end -->

## Notlar

<El yazısı alan. Senkron buraya dokunmaz.>

## Açık Sorular

- Geçmiş listesinde `attended` alanı hep doğru döner çünkü sunucu yalnız katılanları döndürüyor; alan bilgi taşımıyor. Ekranın "gelmeyenler de görünsün" isteyip istemediği (mock bunu yapıyor) kararlaştırılmadı.
- Kayıt oluşturuldu olayı yayılıyor ama tüketicisi yok — öğrenci eylemine sunucudan bildirim fazlalık sayıldı. Kalıcı mı, yoksa danışmana "yeni kayıt" bildirimi bir gün istenir mi?
- Saat toplamı bellekte hesaplanıyor (birim testler LINQ-to-Objects'te geçsin diye); büyük okulda binlerce satırda SQL tarafına taşınması gerekir.
- "Yoklamayı geri al" domain'de ayrı metot olarak yazılı ama roster kaydı zaten aynı sonucu üretebiliyor; ekranın ayrı bir düğme koyup koymadığı bilinmiyor.
