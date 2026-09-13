---
tags: [decision, domain/academic]
date: 2026-09-13
status: accepted
last-synced: 2026-09-13 (294ffe6)
---

# 0006 — Sezon iki aşamada materyalize edilir: yapı "Sezonu Aç"ta, öğrenci ve görevlendirme "Aktifleştir"de

<!-- generated:start -->

## Bağlam

Yeni [[Sezon]] eski sezon bitmeden haftalar önce planlanır. Bu arada eski sezon yürürlüktedir: öğrenci gelir, öğrenci ayrılır, öğretmen değişir. Yönetici ise yeni yılın şubelerini ve takvimini yayından önce görüp düzeltmek ister. Sezon geçişinin ürettiği kayıtların — sezon, dönemler, şubeler, tatiller, öğrenci terfisi, görevlendirmeler — **hangi anda** yazılacağına karar vermek gerekiyordu.

## Karar

Sihirbaz boyunca yalnız hafif bir taslak tutulur ve iki ayrı eylem vardır. **"Sezonu Aç"** yapıyı yazar: sezon `Setup` statüsünde, iki dönem, köken bağlı boş şubeler, tatiller. **"Aktifleştir"** tek transaction'da sezonu yayına alır, önceki sezonu arşivler, öğrencileri terfi ettirir, görevlendirmeleri kopyalar ve taslağı siler — ya hepsi ya hiç.

## Değerlendirilen alternatifler

- **Her şeyi "Sezonu Aç" anında yazmak** — açılış ile yıl başı arasındaki öğrenci giriş/çıkışları ve öğretmen değişiklikleri yeni sezona yansımazdı; terfi bayat bir listeden yapılırdı.
- **Her şeyi aktivasyonda yazmak** — yönetici şubeleri ve takvimi yayından önce göremez, düzeltemezdi. Yeni sezona hazırlık (yenileme toplamak gibi) bağlanacak bir sezon bulamazdı.
- **Sihirbazın her adımında kademeli yazmak** — yarıda bırakılan sihirbaz yarım bir sezon bırakırdı.
- **Aktivasyonu arka plan işi olarak yürütmek** — atomiklik kaybolurdu. Okul ölçeğindeki satır sayısı senkron tek transaction için yönetilebilir.

## Sonuçları

- `Setup` sezon geri alınabilir, ama yalnız ona veri girilmemişse: şubede öğrenci ataması, görevlendirme, açılmış yenileme dönemi ya da toplanmış yenileme taslağı varsa geri alma reddedilir. Aksi hâlde bu veri sezonla birlikte sessizce yiterdi.
- Taslak açılışta silinmez, açılan sezona bağlanır; ömrü aktivasyonla biter. Taslak bağlıyken aynı taslaktan ikinci sezon açılamaz.
- Terfi, taslağı değil şubelerin köken bağını izler. Aynı eşleme haritası önizlemede ve açılışta kullanılır.
- Görevlendirme kopyası taslaktaki tercihe uyar; personel rol atamaları ise her zaman taşınır, yoksa yönetim yeni sezonda yetkisiz kalırdı.
- Kopyalamalar idempotenttir; aktivasyon başarısız olursa bütünüyle geri alınır ve yeniden denenebilir.
- İstisna: rehber öğretmen şubenin bir alanı olduğu için yapı aşamasında, açılışta taşınır. Açılış ile aktivasyon arasında değişen rehberlik yeni sezona kendiliğinden yansımaz.
- Taslaktaki "pasif öğrencileri hariç tut" ve "ders programını kopyala" tercihleri iki aşamanın hiçbirinde okunmaz: pasifler aktivasyonda her zaman hariç tutulur, ders programı kopyalanmaz.
- Karardan dönülürse dokunulacak yerler: taslaktan açma komutu, rollover orkestratörü ve `Setup` geri alma çekirdeğindeki veri kapıları.

## İlgili

- [[Sezon]]
- [[Sezon Yönetimi]]
- [[Şube]]
- [[Öğrenci Kaydı]]
- [[Görevlendirmeler]]

<!-- generated:end -->
