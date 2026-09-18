---
aliases: [SchoolCurriculumOverride, SchoolCurriculumCustomCourse, Haftalık Ders Çizelgesi, Müfredat Saati, CurriculumHourTemplate (removed), SchoolWeeklyHourOverride (removed)]
tags: [domain/academic]
table: academic.school_curriculum_overrides, academic.school_curriculum_custom_courses
status: active
last-synced: 2026-09-18 (f33ea43a)
---

# Haftalık Ders Saati

<!-- generated:start -->

## Nedir

Bir [[Ders]]'in belirli bir [[Sınıf Seviyesi]]'nde haftada kaç saat okutulacağı. MEB'in **Haftalık Ders Çizelgesi** kararının karşılığıdır: 9. sınıfta matematik altı saat, felsefe iki saat.

Sayı üç katmandan gelir ve hangisinin okunduğu **sezonun durumuna** bağlıdır:

- **MEB satırı** — platform genelinde, sürümlü [[Müfredat Sürümü]]'nün bir satırı. Okula göre değişmez.
- **Okul kararı** — okulun sezon taslağında o dersin saatini değiştirmesi. İki biçimi var: MEB satırı olan derste **override**, olmayan derste (okulun kendi dersi, manuel taslak ya da sürümde bulunmayan ders) **ek ders**. Gerekçe taşıyabilir.
- **Snapshot** — sezon başlarken ilk iki katmanın çözümü dondurulur ([[Sezon Müfredat Snapshotı]]).

**Hazırlıktaki sezonda** sayı taslaktan çözülür: override varsa o, yoksa MEB satırı; ek dersler yanına eklenir. **Başlamış ve arşiv sezonda** yalnız snapshot okunur; sonradan yayımlanan MEB sürümü o sezonun sayısını değiştirmez ([[0021-aktif-sezon-mufredati-snapshottan-okur]]).

Ders–kademe eşlemesi saat taşımaz ([[0005-haftalik-ders-saati-ders-kademe-kaydinda-tutulmaz]]).

## Yaşam döngüsü

Okul kararı, hazırlıktaki sezonun taslağına **tek bir yazma komutuyla uzlaştırılır**: okul bir dersin seçili kademelerindeki hedef saatleri gönderir. MEB satırı olan derste istenen saat MEB'e eşitse override **silinir**, farklıysa yazılır. Ek derste 0 kaydı siler, pozitif saat yazar. "MEB değerine dön" ayrı bir işlem değildir.

Sezon başladığında karar donar; o sezon için artık yazılamaz. Sezon açılıştan geri alınırsa (taslağa dönüş ya da iptal) taslak ve okul kararları da silinir.

## Kurallar

- Okul saati **0 veya üstü**, üst sınır yoktur. Özel okul MEB çizelgesinin altına da üstüne de çıkabilir; MEB toplamına göre alt/üst sınır uygulanmaz. 0, dersin o seviyede okutulmadığı anlamına gelir.
- Ek dersin saati sıfırdan büyüktür; 0 ek ders kaydını siler.
- MEB değerine eşit okul değeri override olarak saklanmaz.
- Yazma yalnız **hazırlıktaki** sezona yapılır. Başlamış ya da arşiv sezona yazma `CURRICULUM_SESSION_LOCKED` ile reddedilir (409).
- Sezon belirtilmezse hazırlıktaki **tek** sezon kullanılır; yoksa `CURRICULUM_DRAFT_SESSION_REQUIRED` (409). Aktif sezona düşülmez.
- Okuma uçlarında sezon belirtilmezse önce hazırlıktaki tek sezon, yoksa yürürlükteki sezon okunur.
- Karar yalnız dersin atanmış kademelerinden biri için ve sezonda taslağı olan seviyeye yazılabilir.
- Hazırlıktaki taslakta kullanılan ders silinemez; başlamış sezonun snapshot'ı silmeyi bloklamaz (geçmiş kayıt).
- Okuma `curriculum-hours.view`, yazma `curriculum-hours.override` iznine bağlıdır.

## Neye yarıyor

Bir şubenin ders programı kurulurken "bu sınıfın haftada kaç saat dersi olmalı" sorusunun cevabı buradan gelir. [[Ders Programı]]'ndaki **eksik saat** göstergesi, yerleştirilmiş saatler ile bu hedef arasındaki farktır. Saati 0 olan ders üretim talebine girmez.

## İlişkiler

- [[Ders]] — saatin bağlı olduğu ders; MEB satırı dersin çekirdek kimliğiyle eşleşir
- [[Sınıf Seviyesi]] — hangi kademede kaç saat
- [[Müfredat Sürümü]] — MEB satırının kaynağı
- [[Sezon Müfredat Snapshotı]] — başlamış sezonun dondurulmuş sayısı; okul kararı taslakta yaşar
- [[Sezon]] — okul kararı sezona bağlıdır; aktivasyon dondurur
- [[Ders Programı]] — hedef saat ile yerleşen saat farkı buradan hesaplanır
- [[Şube Ders Görevlendirmesi]] — görevlendirmedeki haftalık saatle **ayrı** alanlardır

## Geçtiği modüller

- [[Müfredat]] — kavramın sahibi; taslak ve okul kararı yönetimi
- [[Ders Programı Yönetimi]] — eksik saat hesabının ve otomatik üretimin girdisi

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- Görevlendirmedeki haftalık saat ile buradaki hedef saat **birbirini doğrulamıyor** görünüyor. Bir öğretmene müfredat hedefinden fazla saat verilirse bir uyarı çıkıyor mu?
- ~~Aktif MEB sürümü kodda sabit. Yeni bir çizelge kararı çıktığında geçmiş sezonların hesabı nasıl korunacak?~~ Kapandı (2026-09-18): başlamış sezon snapshot okur ([[0021-aktif-sezon-mufredati-snapshottan-okur]]).
- Başlamış sezonda bir saat hatası fark edilirse düzeltme yolu yok (snapshot değişmez, dönem içi düzeltme Dilim 1 kapsamı dışında). Ürün bunu nasıl karşılayacak?