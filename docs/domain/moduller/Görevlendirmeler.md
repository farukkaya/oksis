---
aliases: [Assignments, TeachingAssignments, api/v1/assignments, Görevlendirme Hub]
tags: [domain/academic, module]
status: completed
last-synced: 2026-08-10 (2270867)
---

# Görevlendirmeler

<!-- generated:start -->

## Ne yapar

Okul yöneticisinin "hangi öğretmen hangi dersi verecek" sorusunu cevapladığı modül. Yıl başında dersler öğretmenlere dağıtılır, kapsaması olmayan dersler görünür kılınır, alan-dışı atamalar gerekçelendirilir, yıl içinde devir olursa görev kapatılır ve yeni sezona geçerken geçen yılın dağıtımı kopyalanır.

Modülün taşıyıcı fikri **"öğretmen ≠ görevlendirme"**: kişi ve istihdam kalıcıdır, görevlendirme sezona bağlıdır. Sezon değişince öğretmen silinmez, yeni görevlendirme açılır. Kaldırma da silme değildir — görev geçmişi her zaman okunabilir kalır.

İkinci taşıyıcı fikir **engelleme değil iz bırakma**: sistem alan-dışı atamayı yasaklamaz, gerekçe ister ve kaydeder. Sahada branş dışına çıkmak zorunluluk olduğu için karar okula bırakılmış, denetlenebilirlik sisteme.

## İki nesil yan yana

Bu alan kodda **iki ayrı modelle** temsil ediliyor ve ikisi de canlı:

- [[Ders Görevlendirmesi]] ("Görevlendirme v2") — öğretmen × ders **yetkinliği**. Saat ve şube taşımaz. İzin ailesi `assignments.*`, rota `api/v1/assignments`.
- [[Şube Ders Görevlendirmesi]] ("v1") — öğretmen × şube × ders + **haftalık saat**. İzin ailesi `teaching-assignments.*`, rotalar `api/v1/teachers/{id}/assignments` ve `api/v1/teaching-assignments`.

Her ikisinin de kendi özet sorgusu, kendi değişim olayı ve kendi sezon kopyalama komutu var. Hangisinin kanonik olduğu koddan çıkmıyor — açık sorulara bak. Yeni gelen için en kafa karıştırıcı nokta budur; bir kod parçasına bakmadan önce hangi nesle ait olduğunu anlaman gerekir.

## Kullandığı kavramlar

- [[Ders Görevlendirmesi]] — yetkinlik ekseni (v2)
- [[Şube Ders Görevlendirmesi]] — şube ve saat ekseni (v1)
- [[Ders]] — görevlendirmenin bir ucu
- [[Branş]] — uyumun hesaplandığı taraf
- [[Profil]] — diğer uç; öğretmen profili ve branş bağları
- [[Şube]] — v1'in şube ekseni
- [[Sezon]] — her görevlendirme bir sezona aittir; sert sınır

## Ana akışlar

1. **İki eksenli dağıtım** — Ekran iki yönden çalışır: ders ekseninde bir derse birden çok öğretmen bağlanır, öğretmen ekseninde bir öğretmene birden çok ders. İkisi de aynı (ders, öğretmen) ikilileri listesiyle ifade edilir, yani tek bir yazma yolu vardır.

2. **Aday listeleme** — Seçim yapılırken zaten atanmış olanlar elenir, kalanlar branş uyumuna göre sıralı döner. Sıralama arayüzün gruplamasını besler.

3. **Üç değerli branş uyumu** — Öğretmenin ana branşı derse uyuyorsa branş-içi, yan branşlarından biri uyuyorsa yan branş, hiçbiri uymuyorsa alan-dışı. Uyum **saklanmaz, her okumada hesaplanır**; karşılaştırma ad üzerinden ve tr-TR normalizasyonuyla yapılır (İ/ı doğruluğu için). SQL'e çevrilemediği için ham alanlar çekilip bellekte çözülür.

4. **Alan-dışı atama** — Engellenmez. Serbest metin gerekçe taşınır ve yalnız alan-dışı satırlarda gösterilir. Buna karşılık **branşsız öğretmene atama sert engeldir** — gerekçeyle aşılamaz.

5. **Kapsama görünümü** — Ders ekseninde her ders için kaç öğretmen atandığı ve alan-dışı bulunup bulunmadığı özetlenir. "Hangi ders sahipsiz kaldı" sorusu buradan cevaplanır.

6. **Görev kapatma** — Yıl-içi devirde kayıt silinmez, kapatılır: kapatan kişi, tarih ve gerekçe yazılır. Kapatılmış kaydın gerekçesi bir daha değişmez. v1 tarafında karşılığı "kaldırma"dır ve o da arşivdir.

7. **Sezon kopyalama** — İki nesil bunu farklı eksenden yapar. v2 kaynak sezonun aktif (ders, öğretmen) çiftlerini hedefe taşır; ayrılmış öğretmen, pasif ders ve hedefte zaten aktif olan satırlar atlanır. v1 ise [[Şube]]'lerin köken bağını izler ve şube eşlemesi üzerinden kopyalar; ayrılmış öğretmen, eşleşen hedef şube olmaması, hedef şubenin arşivlenmiş olması ve hedefte aynı (şube, ders) çiftinin zaten bulunması sebebiyle satır atlar. Her iki tarafta da "zaten var" kontrolü işlemi tekrar çalıştırmayı güvenli kılar.

8. **Öğretmen yükü** — Bir sezondaki tüm öğretmenlerin haftalık yük özeti. Saat yalnız v1'de bulunduğu için yük de oradan hesaplanır. Sık sorulduğundan sezon bazında kısa ömürlü önbelleğe alınır; atama veya kaldırma önbelleği geçersiz kılar.

9. **Görev geçmişi** — Bir öğretmenin kaldırılmış görevlendirmeleri dahil tüm geçmişi okunabilir. Kaldırmanın silme olmamasının tek sebebi budur.

**Yetki:** v2 tarafında `assignments.view`, `assignments.assign`, `assignments.copy-season`; v1 tarafında `teaching-assignments.view`, `teaching-assignments.assign`, `teaching-assignments.copy-season`. Öğretmen yükü özeti farklı bir aileden korunuyor (`users.view`). Yazma yetkisi tek roldedir; onay iş akışı yoktur, yerine denetim izi vardır.

## Kapsam dışı

- **Gün ve saat yerleşimi** — Bu modül "kim hangi dersi verecek" sorusunu çözer; "hangi gün hangi saatte" ders programının işidir. Görevlendirme değişince olay yayınlanır ve program senkron kalır.
- **Saat ve şube dağıtımı (v2 tarafında)** — Yetkinlik katmanı bilinçle saatsiz ve şubesizdir; dağıtım aşağı akıştaki katmana bırakılmıştır.
- **Onay iş akışı** — Bilinçli olarak yok; yerine öz-denetim ve otomatik denetim damgası konulmuştur.
- **Nöbet görevlendirmeleri** — Ayrı bir alandır (nöbet çizelgesi, muafiyet, otomatik dağıtım, vekâlet) ve bu notun kapsamında değildir.

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- **İki nesilden hangisi kanonik?** İki tablo, iki izin ailesi, iki kopyalama komutu, iki olay. v1 emekliye mi ayrılıyor, yoksa v2 yalnız yetkinlik katmanı olarak üstüne mi biniyor? Yıl geçişinde ikisi birden mi çalıştırılmalı?
- v2 saat ve şubeyi "Şube Dağıtımı / Ders Programı katmanına" bırakıyor. O katman kodda var mı, yoksa rolü hâlâ v1 mi oynuyor?
- Branş uyumu katalog kimliği yerine **ad karşılaştırmasıyla** hesaplanıyor. Öğretmen profilinde branş kimliği dururken bu neden ad üzerinden? "Matematik" branşı "İleri Matematik" dersine alan-dışı düşüyor — kabul edilmiş bir sınır mı?
- Öğretmen profilindeki branş kimliği davet ve toplu içe aktarma akışında çözülmüyor (pilotta boş bırakılıyor). Branşsız öğretmene atama sert engel olduğuna göre, bu öğretmenler görevlendirilemez mi kalıyor?
- Öğretmen yükü sorgusu `users.view` ile korunuyor, diğer görevlendirme sorguları kendi aileleriyle. Bu bilinçli mi?
