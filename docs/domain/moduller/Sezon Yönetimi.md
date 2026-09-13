---
aliases: [AcademicSessions, SeasonManagement, academic-sessions]
tags: [domain/academic, module]
status: completed
last-synced: 2026-09-13 (294ffe6)
---

# Sezon Yönetimi

<!-- generated:start -->

## Ne yapar

Okul yönetiminin eğitim-öğretim yılını kurduğu, yürüttüğü ve kapattığı modül. Yıl sonunda gelecek sezonu bir sihirbazla planlar, şubeleri ve takvimi hazırlar, hazır olunca sezonu yayına alır — bu geçişte öğrenciler bir üst kademeye terfi eder, son kademedekiler mezun olur, öğretmen görevlendirmeleri yeni sezona kopyalanır. Yıl içinde ise şube kurma, öğrenci atama/transfer, dönem açma-kapatma ve tatil takvimi burada yönetilir.

Modülün karakteristik özelliği, geçişin **iki aşamalı** olması: önce geri alınabilir bir hazırlık (taslak ve `Setup` sezon), sonra geri alınamaz bir aktivasyon. Hazırlık aşamasındaki her şey — sezona henüz veri girilmediği sürece — iptal edilebilir; aktivasyondan sonra hiçbiri edilemez. Neyin hangi aşamada yazıldığı ve gerekçesi: [[0006-sezon-iki-asamali-materyalizasyon]].

## Kullandığı kavramlar

- [[Sezon]] — modülün merkezi; yılın çatısı ve yaşam döngüsü
- [[Dönem]] — sezonun içindeki T1/T2; not ve karne akışlarının zaman kutusu
- [[Şube]] — şubeler; öğrenci atamalarının ve terfinin taşıyıcısı
- [[Sınıf Seviyesi]] — terfi haritasının izlediği kademe sıralaması
- [[Okul Tatili]] — sezon takvimindeki kapalı günler
- [[Öğrenci Kaydı]] — yenileme dönemi açıksa terfinin kimi yerleştireceğini belirler

Ayrı notu olmayan iki yardımcı kayıt: **SeasonDraft** (sihirbazın sunucu tarafı taslağı, tenant başına en fazla bir tane, `season_drafts`) ve **ClassRoomStudent** (öğrenci-şube atamasının tarihsel kaydı, `class_room_students`).

## Ana akışlar

1. **Sezon planlama sihirbazı** — Yönetici gelecek sezonu adım adım kurar. Sunucuda tek bir taslak tutulur; her adımda tüm state tek seferde güncellenir. Ağır kayıt yazılmaz, yalnızca "neyi kopyalayacağız" tercihleri (dönemler, şubeler, tatiller, görevlendirmeler, ders programı, pasif öğrencilerin hariç tutulması) ve şube eşleme haritası saklanır. Akademik Takvim'deki "Planlanmamış ↔ Taslak" rozeti bu kaydın varlığına bakar.

2. **Taslaktan sezonu açma** — Taslak `Setup` statüsünde gerçek bir sezona materyalize edilir: sezon, iki dönem, şubeler (köken bağıyla) ve tatiller yazılır; görevlendirme kopyası istenmişse kaynak şubenin rehber öğretmeni hedef şubeye taşınır (ayrılmış öğretmen taşınmaz). Taslak silinmez; açılan sezona bağlanır, böylece geri alınabilir kalır. Bağlı olduğu bir sezon varken aynı taslaktan ikinci sezon açılamaz (`draft-already-opened`). Taslağın ömrü aktivasyonla biter — aktivasyon bağlı taslağı siler.

3. **Geri alma** — `Setup` sezon iptal edilir veya taslağa geri döndürülür: şubeler, sezona bağlı tatiller ve sezon soft-delete edilir, taslağın bağı temizlenir. Taslağa geri döndürmede sihirbaz taslağı yeniden devralır; iptalde taslak da silinir. İki komut da aynı çekirdeği paylaşır ve tek transaction'da çalışır. Geri alma yalnız taslağın bağlı olduğu `Setup` sezonda yapılır ve sezona veri girilmişse reddedilir: şubelerde öğrenci ataması, görevlendirme (yetkinlik kaydı), açılmış yenileme dönemi ya da toplanmış yenileme taslağı. Gerekçe: bu veriler sezonla birlikte sessizce yiterdi.

4. **Sezon aktivasyonu ve rollover** — Yılın geri alınamaz anı, tek transaction. Sezon `Active` olur, önceki sezon arşivlenir, öğrenciler terfi eder, görevlendirmeler kopyalanır (kopyalamanın nasıl yürüdüğü [[Görevlendirmeler]] notunda). Görevlendirme kopyası taslaktaki tercihe uyar (bağlı taslak yoksa kopyalanır); personelin rol atamaları ise tercihten bağımsız her zaman taşınır — aksi hâlde yönetim yeni sezonda yetkisiz kalırdı. Terfi haritası (BR-AS-015): her kaynak şube için bir üst kademe okulca sunuluyorsa öğrenciler aynı şube adıyla o kademeye çıkar; üst kademe yoksa (terminal kademe) mezun edilir; ayrıca giriş kademesi için gelecek yılın yeni öğrencilerine boş şubeler açılır. Aynı harita hem önizlemede hem gerçek geçişte kullanılır — önizlemede görünen, uygulanan haritanın aynısıdır.
   - **Pasif öğrenci** = aktif şube ataması olan ama [[Kişi]] yaşam döngüsü `Active` olmayan öğrenci. Rollover pasifleri **her zaman** hariç tutar; taslaktaki tercih bu kararı değiştirmez.
   - **Yenileme dönemi kapalıyken** terfi yalnız şube koltuğunu taşır; yeni sezonda [[Öğrenci Kaydı]] açmaz.
   - **Terminal kademede mezuniyet** yalnız şube atamasını mezuniyet sebebiyle kapatır; kayıt durumuna ve Kişi yaşam döngüsüne dokunmaz. Yani mezuniyetin üç temsili (kayıt, kişi, atama) bu yolda **ayrışabilir**; üçünü birlikte değiştiren tek yol [[Öğrenci Kayıt Yönetimi]]'ndeki tekil mezuniyet işlemidir.

5. **Yenileme dönemi** — `Setup` sezonda kayıt yenilemenin açıldığını işaretler. Statü değiştirmez, yalnızca zaman damgası düşer; idempotenttir. Bu bayrak terfinin davranışını değiştirir: açıkken yalnız [[Öğrenci Kayıt Yönetimi]] tarafında yenileme taslağı olan öğrenci şubeye yerleşir, taslağı olmayan atlanır.

6. **Dönem yürütme** — T1 aktive edilir, kapatılır; T2 aktive edilir, kapatılır. Kapanış karne üretimini tetikler (BR-AS-009) ve geri alınamaz.

7. **Şube ve öğrenci yönetimi** — Şube kurma, rehber öğretmen ve derslik atama, öğrenci atama/transfer/çıkarma, arşivleme. Kod olarak bu modülün içindedir ama ürün olarak ayrı bir alandır ve uçtan uca [[Sınıflar ve Şubeler]] notunda anlatılır; burada yalnızca sezon geçişini ilgilendiren yanı vardır (şubelerin üretilmesi ve köken bağıyla terfi).

8. **Takvim** — Sezona bağlı tatillerin eklenmesi ve resmî tatil listesinin aralık sorgusu.

**Yetki:** Tüm komut ve sorgular `[RequirePermission]` ile kapıdan geçer — `season.*` (list/detail/current read, update, activate, archive, term.activate, term.close, renewal.open, draft.create), `class-rooms.*` (view, create, update, delete, approve, archive, assign-student, remove-student, transfer-student), `school-holidays.*` (view, create, update, delete). Yetkisiz bırakılmış komut yok.

## Kapsam dışı

- **Şube atamasında kapasite aşımının engellenmesi.** Atamada kapasite bilinçli olarak soft limittir; aşım ve mevcut öğrenci sayısının altına düşürme engellenmez, uyarı UI'nin işidir (2026-06-10'da atamadaki hard kontroller kaldırıldı). Yeni kayıt ise dolu şubeye alınmaz — kayıttaki kapasite kuralı için bkz. [[Şube]].
- **Terfi ve görevlendirme kopyalamanın tek başına kullanımı.** Bu iki işlemin ayrı endpoint'i vardır ama yapı taşı olarak işaretlenmiştir; tam yıl geçişi için birleşik rollover akışı kullanılır.

## Açık Sorular (senkron)

- Taslaktaki "pasif öğrencileri hariç tut" ve "ders programını kopyala" tercihleri kaydediliyor ama hiçbir akış okumuyor: rollover pasifleri koşulsuz hariç tutuyor, ders programı kopyası hiç yapılmıyor. Tercihler kaldırılmalı mı, yoksa bağlanması mı bekleniyor?
- Rehber öğretmen devri açılışta yapılıyor; açılış ile aktivasyon arasında ayrılan ya da değişen rehberlik yeni sezona kendiliğinden yansımıyor. Aktivasyonda yeniden kontrol edilmeli mi?

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- `season.draft.create` izni sekiz ayrı işlemi birden kapatıyor: sezon oluşturma, taslaktan açma, taslağa geri döndürme, `Setup` iptali, taslak silme, taslak kaydetme ve iki sorgu. Sezonu açmak/geri almak, taslak oluşturmakla aynı yetki seviyesinde mi olmalı?
- `BR-AS-013` kod tabanında hiç geçmiyor. (`BR-AS-010` için bkz. [[Şube]].)
