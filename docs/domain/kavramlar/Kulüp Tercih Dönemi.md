---
aliases: [ClubPreferenceRound, Tercih Dönemi, ClubPreferenceReminder, Tercih Hatırlatması]
tags: [domain/clubs]
table: school.club_preference_rounds
status: active
last-synced: 2026-10-12 (b415d6fc)
---

# Kulüp Tercih Dönemi

<!-- generated:start -->

## Nedir

Kulüp üye kabulünü **idarenin** yaptığı okulda, öğrencilerin sıralı kulüp tercihlerini topladığı ve ardından idarenin yerleştirmeyi yayınladığı sezonluk süreç. Koordinatı **okul × sezon**; bir sezonda **tek** dönem vardır. Yalnız okulun "Kulüp Üye Kabul Sorumlusu" ayarı **İdare** iken var olabilir ([[Okul Ayarları]]); öğretmen modunda dönem uçlarının hepsi reddedilir. Gerekçe ve modun bütünü: [[0023-kulup-uye-kabul-sorumlusu-sezon-basinda-secilir]].

Dönem bir üyelik sürecinin çatısıdır, üyeliğin kendisi değildir: öğrencinin tercihi [[Kulüp Tercihi]], idarenin kararı [[Kulüp Yerleştirmesi]] satırlarında, yayının doğurduğu sonuç [[Kulüp Üyeliği]]'nde yaşar.

## Yaşam döngüsü

```
          Create          Tercihe Aç          Tercihi Kapat           Yayınla
  (yok) ──────► Draft ─────────────► Open ─────────────► Closed ─────────────► Published ⟲ (fark yayını)
                  │                    ▲                    │
                  └── Sil (yalnız      └──── Yeniden Aç ────┘   (yalnız hiç yayın yapılmadıysa)
                      burada)
```

- **Draft (Hazırlık)** — oluşturuldu; öğrenci görmez, bildirim gitmez. Silinebilen **tek** durumdur (yumuşak silme; tekil indeks silinmişleri dışladığı için aynı sezonda yeniden oluşturulabilir).
- **Open (Tercihe açık)** — öğrenci tercihini kaydeder ve değiştirir. İdare bu sırada yerleştirme taslağında ön çalışma yapabilir ama yayınlayamaz.
- **Closed (Tercihe kapalı)** — tercihler salt okunur; yerleştirme yapılır. Hiç yayın yapılmadıysa yeniden açılabilir.
- **Published (Yayınlandı)** — en az bir yayın yapıldı; yeniden açılamaz. Sonraki yayınlar durumu değiştirmez, yalnız **farkı** uygular ve yayın sürümünü artırır.
- **Açma ve kapatma tarihten türemez**: her geçiş idarenin ayrı jestidir; zamanlanmış iş yoktur. Hedef son gün yalnız bilgidir, dönemi kapatmaz.
- Aynı jestin tekrarı no-op'tur (açık döneme "Aç", kapalı döneme "Kapat"): retry çift bildirim üretmez.

## Kurallar

- **Sezonda tek dönem** — ikinci oluşturma 409; son savunma okul × sezon tekil indeksidir. Sonradan gelen ya da yerleşemeyen öğrenci ikinci bir dönemle değil, aynı dönemde elle yerleştirmeyle çözülür.
- **Oluşturma iki koşul ister**: okulun kabul modu İdare ve okulun yayında bir sezonu olması (yoksa 409). Sezon süzgeci elle yazılır, otomatik değildir (kulüp modülünün genel kuralı).
- **Tercih sayısı 3, kodda sabittir**; geçmiş kayıtlar bozulmasın diye satırda da tutulur.
- **Hedef son gün** isteğe bağlıdır, okulun bugününden önce olamaz (400; bugün kabul edilir) ve yayından sonra değiştirilemez.
- **Yeniden açma yalnız yayından önce**: yayınlanmış dönemi açmak, öğrenciye sonucu verilmiş bir süreci yeniden başlatmak olurdu. Cümle idareyi yerleştirme ekranına yönlendirir.
- **Açılış sırası** her açılışta (ilk ve her yeniden açma) bir artar; "açıldı" ve "kapandı" bildirimlerinin kimliği bu sırayı taşır — yeniden açılan dönem yeni bir bildirimdir, aynı jestin retry'ı değildir.
- **Yayın açık dönemde yapılamaz** ("Önce tercihi kapatın", 409): sonuç, değişmekte olan tercihlerin üzerine yayınlanmasın.
- **Dönem satırının sürüm damgası yerleştirmenin eşzamanlılık damgasıdır.** Kaydet, Otomatik yerleştir ve Yayınla istemcinin aldığı damgayı geri ister; bayatsa 409. Kaydet yalnız yerleştirme satırlarına dokunsa damga dönmezdi, bu yüzden her taslak yazımı dönem satırına bir taslak sürümü yazar.
- **Kapsam tek yerde tanımlıdır**: dönemin muhatabı sezonda aktif kaydı olan, okul kulüp saatini programa koyduysa şubesinde kulüp saati olan **ve** sezonda canlı kulüp üyeliği olmayan öğrencidir. Açılış bildirimi, katılım özeti, tercih yapmayanlar listesi, hatırlatma, öğrencinin tercih ekranı ve yerleştirme evreni aynı tanımdan okur.
- **Hatırlatma** ("Tercih yapmayanlara hatırlat") yalnız açık dönemde, **okulun günü başına bir kez** gönderilir; aynı gün ikinci basış 409. Alıcı kümesi kapsamda olup tercihini kaydetmemiş öğrencilerdir. Her hatırlatma ayrı, silinmeyen bir kayıttır (dönem × gün tekil); kayıt yazılmadan olay doğmaz, indekse takılan ikinci basış bildirim üretmez.
  - **Hatırlatma kaydı neden dönemin bir alanı değil:** dönem satırına yazmak sürüm damgasını döndürür ve dönem açıkken taslak üzerinde çalışan idarecinin Kaydet'ine sahte 409 düşürürdü. Kayıt bu yüzden ayrı tablodadır (`club_preference_reminders`), ama ayrı bir kavram değildir: kendi yaşam döngüsü yoktur (yalnız eklenir), tek modülde geçer ve MEB karşılığı yoktur.
- **Öğrenciye görünen dönem** Hazırlık dışındaki dönemdir; öğrencinin kulüp yanıtlarındaki kabul bloğu (mod, dönem durumu, hedef son gün, "tercihini kaydetti mi", "yerleştirme yayınlandı mı", uygunluk) bu dönemden türer. Veli yüzünde bu blok üretilmez.

## İlişkiler

- [[Sezon]] — kimlik referansı; sezonda tek dönem
- [[Okul Ayarları]] — varlık şartı: Kulüp Üye Kabul Sorumlusu = İdare
- [[Kulüp Tercihi]] — dönemin çocuk satırları (dönem × öğrenci), FK'lı
- [[Kulüp Yerleştirmesi]] — dönemin taslak ve yayın satırları (dönem × öğrenci), FK'lı; yayın jesti dönemin üzerindedir
- [[Kulüp]] — tercih edilebilen ve yerleştirilebilen kulüpler sezonun aktif kulüpleridir
- [[Bildirim]] — açılış (öğrenciye), hatırlatma (öğrenciye), kapanış (diğer idarecilere) ve yerleştirme sonuçları

## Geçtiği modüller

- [[Kulüpler]] — kavramın sahibi; idare yüzü (oluştur, aç, kapat, hatırlat, yerleştir, yayınla) ve öğrenci tercih ekranı
- [[Bildirimler]] — altı yeni olay türünün üreticisi

<!-- generated:end -->

## Notlar

<El yazısı alan. Senkron buraya dokunmaz.>

## Açık Sorular

- Dönem satırının sürüm damgası hem dönem jestlerinin (aç/kapat) hem yerleştirmenin damgasıdır. Dönem açıkken bir idareci "Kapat" derse, aynı anda taslakta çalışan idarecinin sonraki Kaydet'i bayat damga alır. Bilinçli kabul mü, yoksa ölçülmemiş bir yan etki mi? Koddan net çıkmadı.
- Hazırlık dönemi silinebiliyor ama Kapalı (hiç yayınlanmamış) dönemi iptal etmenin yolu yok; sezonda tek dönem kuralıyla birleşince, yanlış açılmış bir dönem ancak yayına kadar götürülerek kapanabilir. Ürün kararı mı?
