---
aliases: [AcademicSessions, SeasonManagement, academic-sessions]
tags: [domain/academic, module]
status: completed
last-synced: 2026-08-10 (db8336b)
---

# Sezon Yönetimi

<!-- generated:start -->

## Ne yapar

Okul yönetiminin eğitim-öğretim yılını kurduğu, yürüttüğü ve kapattığı modül. Yıl sonunda gelecek sezonu bir sihirbazla planlar, şubeleri ve takvimi hazırlar, hazır olunca sezonu yayına alır — bu geçişte öğrenciler bir üst kademeye terfi eder, son kademedekiler mezun olur, öğretmen görevlendirmeleri yeni sezona kopyalanır. Yıl içinde ise şube kurma, öğrenci atama/transfer, dönem açma-kapatma ve tatil takvimi burada yönetilir.

Modülün karakteristik özelliği, geçişin **iki aşamalı** olması: önce geri alınabilir bir hazırlık (taslak ve `Setup` sezon), sonra geri alınamaz bir aktivasyon. Hazırlık aşamasındaki her şey iptal edilebilir; aktivasyondan sonra hiçbiri edilemez.

## Kullandığı kavramlar

- [[Sezon]] — modülün merkezi; yılın çatısı ve yaşam döngüsü
- [[Dönem]] — sezonun içindeki T1/T2; not ve karne akışlarının zaman kutusu
- [[Şube]] — şubeler; öğrenci atamalarının ve terfinin taşıyıcısı
- [[Okul Tatili]] — sezon takvimindeki kapalı günler

Ayrı notu olmayan iki yardımcı kayıt: **SeasonDraft** (sihirbazın sunucu tarafı taslağı, tenant başına en fazla bir tane, `season_drafts`) ve **ClassRoomStudent** (öğrenci-şube atamasının tarihsel kaydı, `class_room_students`).

## Ana akışlar

1. **Sezon planlama sihirbazı** — Yönetici gelecek sezonu adım adım kurar. Sunucuda tek bir taslak tutulur; her adımda tüm state tek seferde güncellenir. Ağır kayıt yazılmaz, yalnızca "neyi kopyalayacağız" tercihleri (dönemler, şubeler, tatiller, görevlendirmeler, ders programı) ve şube eşleme haritası saklanır. Akademik Takvim'deki "Planlanmamış ↔ Taslak" rozeti bu kaydın varlığına bakar.

2. **Taslaktan sezonu açma** — Taslak `Setup` statüsünde gerçek bir sezona materyalize edilir: sezon, iki dönem, şubeler ve tatiller yazılır. Taslak silinmez; açılan sezona bağlanır, böylece geri alınabilir kalır.

3. **Geri alma** — `Setup` sezon iptal edilir veya taslağa geri döndürülür: şubeler, sezona bağlı tatiller ve sezon soft-delete edilir, taslağın bağı temizlenir ve sihirbaz taslağı yeniden devralır. İki komut da aynı çekirdeği paylaşır ve tek transaction'da çalışır.

4. **Sezon aktivasyonu ve rollover** — Yılın geri alınamaz anı. Sezon `Active` olur, önceki sezon arşivlenir, öğrenciler terfi eder, görevlendirmeler kopyalanır. Terfi haritası (BR-AS-015): her kaynak şube için bir üst kademe okulca sunuluyorsa öğrenciler aynı şube adıyla o kademeye çıkar; üst kademe yoksa (terminal kademe) mezun edilir; ayrıca giriş kademesi için gelecek yılın yeni öğrencilerine boş şubeler açılır. Aynı harita hem önizlemede hem gerçek geçişte kullanılır — önizlemede görünen, uygulanan haritanın aynısıdır.

5. **Yenileme dönemi** — `Setup` sezonda kayıt yenilemenin açıldığını işaretler. Statü değiştirmez, yalnızca zaman damgası düşer; idempotenttir.

6. **Dönem yürütme** — T1 aktive edilir, kapatılır; T2 aktive edilir, kapatılır. Kapanış karne üretimini tetikler (BR-AS-009) ve geri alınamaz.

7. **Şube ve öğrenci yönetimi** — Şube kurma (okul ayarına göre onaylı veya doğrudan aktif), sınıf öğretmeni ve derslik atama, öğrenci atama, şubeler arası transfer, çıkarma ve arşivleme. Atamalar silinmez, sebep koduyla kapatılır.

8. **Takvim** — Sezona bağlı tatillerin eklenmesi ve resmî tatil listesinin aralık sorgusu.

**Yetki:** Tüm komut ve sorgular `[RequirePermission]` ile kapıdan geçer — `season.*` (list/detail/current read, update, activate, archive, term.activate, term.close, renewal.open, draft.create), `class-rooms.*` (view, create, update, delete, approve, archive, assign-student, remove-student, transfer-student), `school-holidays.*` (view, create, update, delete). Yetkisiz bırakılmış komut yok.

## Kapsam dışı

- **Kapasite aşımının engellenmesi.** Kapasite bilinçli olarak soft limittir; aşım ve mevcut öğrenci sayısının altına düşürme engellenmez, uyarı UI'nin işidir. Sahadaki gerçek kullanım hard limitle çatıştığı için 2026-06-10'da hard kontroller kaldırıldı.
- **Terfi ve görevlendirme kopyalamanın tek başına kullanımı.** Bu iki işlemin ayrı endpoint'i vardır ama yapı taşı olarak işaretlenmiştir; tam yıl geçişi için birleşik rollover akışı kullanılır.

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- `season.draft.create` izni sekiz ayrı işlemi birden kapatıyor: sezon oluşturma, taslaktan açma, taslağa geri döndürme, `Setup` iptali, taslak silme, taslak kaydetme ve iki sorgu. Sezonu açmak/geri almak, taslak oluşturmakla aynı yetki seviyesinde mi olmalı?
- `SeasonDraft.ExcludePassiveStudents` bir taslak tercihi, ancak `promote-students` yardımcı endpoint'i bu değeri sabit `true` gönderiyor. Taslaktaki tercih bu yolda yok mu sayılıyor, yoksa yalnızca birleşik rollover akışında mı okunuyor?
- Taslaktaki `CopySchedule` (ders programı kopyalama) tercihinin karşılığı bu taramada izlenemedi; Timetable tarafı kapsam dışıydı.
- `BR-AS-010` ve `BR-AS-013` kod tabanında hiç geçmiyor.
