---
aliases: [Homework, HomeworkAttachment, HomeworkTargetStudent, HomeworkAuditEntry, Ev Ödevi]
tags: [domain/academic]
table: academic.homework
status: active
last-synced: 2026-09-03 (b72c819)
---

# Ödev

<!-- generated:start -->

## Nedir

Öğretmenin bir şubeye bir ders için verdiği tek ödev — **dönem × şube × ders × sahip öğretmen** koordinatı. MEB dilinde "ev ödevi", "performans ödevi"; bu modülde ikisi ayrılmaz. **Yayın birimi budur:** taslak kimseye ulaşmaz, yayın hedef öğrencilerin ekranına düşer ve takip satırlarını ([[Ödev Takibi]]) doğurur.

**Çoklu şube tek kayıt değildir.** Öğretmen üç şubeye aynı anda ödev verdiğinde üç ödev doğar; bkz. [[0003-coklu-sube-ayri-odev-kaydi]].

Ödevin üç yardımcı parçası bu notun içinde yaşar, ayrı kavram değildir:

- **Ek** (`HomeworkAttachment`) — öğretmenin iliştirdiği dosya ya da bağlantı; tek liste, iki tür.
- **Hedef seçimi** (`HomeworkTargetStudent`) — "seçili öğrenciler" hedefinde taslakta seçilen alt küme; yalnız taslakta yaşar, yayında tüketilir.
- **Denetim kaydı** (`HomeworkAuditEntry`) — append-only iz; [[Not Denetim Kaydı]]'nın sadeleştirilmiş kardeşi (sistem olayı ve değer düzeltmesi yok).

## Yaşam döngüsü

```
  (yeni) ──► Draft ──(yayın)──► Published ──(sahibi kapatır)──► Closed
               │                    └──────(gerekçeli iptal)──► Cancelled
               └── sessiz silme
```

- **Draft** — kimseye ulaşmaz; takip satırı yoktur; hedef ve ekler serbestçe değişir; silinebilir (yumuşak, sessiz, bildirimsiz). Yönetici listesinde yalnız sahibi **ayrılmışsa** görünür: çalışan öğretmenin yayınlamadığı taslağı onun özel çalışmasıdır.
- **Published** — **geri alınamaz;** yayından taslağa dönüş yoktur. Yayın öğrenciye ulaşmıştır; geri alınsa ekranından sessizce kaybolurdu. Geri almanın yerine gerekçeli iptal vardır. Hedef bu anda **dondurulur**; içerik hâlâ düzenlenebilir ve "içerik güncellendi" damgası yalnız burada ilerler.
- **Closed** — sahibi kapatır; yeni yükleme ve işaretleme alınmaz. Kapatma **denetlenmez**: idari bir müdahale değil, ödevin doğal sonudur.
- **Cancelled** — yalnız yayındaki ödev iptal edilir; gerekçe en az 15 karakterdir ve **öğrenciye görünür**. İptal edilmiş ödev öğrenci listesinden düşer ama detayda kalır — "ödevim nerede" sorusunun cevabı ancak oradan alınır.

## Kurallar

- **Tekillik kısıtı yoktur;** aynı öğretmen aynı şubeye aynı gün iki ödev verebilir. Not defterinin sınav türü tekilliği burada karşılık bulmaz.
- **Son teslim bir gündür, saati yoktur.** "Bugün" okulun günüdür ([[Okul]] takvimi ve saat dilimi), sunucunun makinesinin günü değil. Gecikme, tarih etiketleri ve iki zamanlanmış iş bunun üstüne kurulur.
- **Hedef yayında çözülür, oluşturmada değil** ([[0004-odev-hedefi-yayinda-dondurulur]]). "Tüm sınıf" yayın anındaki mevcuda bakar; "seçili öğrenciler" taslaktaki seçimin mevcutla kesişimidir (aradaki hafta içinde ayrılan öğrenciye satır açılmaz). Çözülen hedef boşsa yayın 409 ile reddedilir — sessiz başarı bu hatanın kendisinden çok daha pahalı çıkmıştı. Seçim yayında tüketilir ve temizlenir.
- **Yayında hedef tipi değişmez:** gönderilen değer mevcutla aynıysa sessizce yok sayılır (ekran gövdeyi tam gönderir), farklıysa 409 (değişiklik sessizce düşmesin).
- **Son teslim günü okul gününden önce olamaz;** kontrol yayında yapılır, taslakta geçmiş tarih tutulabilir.
- **Ekler:** sıra geliş sırasından türer, istemciden alınmaz. Bağlantı yalnız http/https; kontrol karakteri içeren adres ayrıştırılmadan reddedilir (doğrulanan dize ile saklanan dize aynı olmalı). Dosya ekinde dosya kimliği doğrulanır, sahibi çağıran olmalıdır ve Documents tarafına ayrıca bir [[Dosya Bağı]] yazılır — aksi hâlde dosya "kullanılmıyor" görünüp imha edilebilirdi. Kategorisi öğrenci teslimininkinden ayrıdır ([[Dosya Kategorisi]]). Düzenlemede ek alanı **gönderilmezse korunur**, boş dizi temizler.
- **Sahiplik ≠ yazma kapsamı.** Oluşturmada soru "bu şube-dersi okutuyor musun"dur ve [[Ders Programı]]'ndan cevaplanır (görevlendirme değil, vekâlet kapsama girmez). Var olan kayıtta soru "bu ödev senin mi"dir: program değişip öğretmen o şubeden alınsa da kendi ödevini kapatabilir. Sahibi olmayan için kayıt 404'tür, 403 değil.
- **Yönetici yazma kapısından geçmez.** Adına yayın yalnız sahibi **ayrılmış** taslakta çalışır, gerekçelidir ve yeni son teslim tarihini zorunlu ister. "Ayrılmış" bir kolon değil, çalışan öğretmenler kümesinin tümleyenidir; sezona bağlı bir kayda bağlansaydı sezon devri gününde bütün öğretmenler ayrılmış görünürdü. Sahiplik **devredilmez** (açık soru).
- **Gecikmiş** = yayında ve son teslim günü geçmiş; **kontrol bekliyor** = gecikmiş ve işaretlenmemiş satırı var. İkisi sayaçlardan türer, istemcide hesaplanmaz.
- **Denetim:** yayın, adına yayın, iptal, toplu tamamlama ve idari teslim kaldırma yazılır; tekil işaretleme ve kapatma yazılmaz. Gerekçe aileyle paylaşılmaz. Okuyan uç bugün yoktur.
- **Bildirim:** yayın hedef öğrencilere ve velilerine gider; alıcı listesi takip satırlarından okunur, mevcuttan değil (seçili hedefte ikisi ayrışır). İki yayın ucu tek üreticiden geçer ve bildirim kayıt bittikten **sonra** kuyruklanır. Oluşturma, taslak silme ve teslim yükleme bildirim üretmez.

## İlişkiler

- [[Ödev Takibi]] — ödevin satırları; yayında doğar
- [[Ödev Teslimi]] — satır üzerinden; ödevin durumu teslim kapısıdır
- [[Dönem]] / [[Şube]] / [[Ders]] — koordinat eksenleri
- [[Kişi]] — sahip öğretmen; yalnız kimlik
- [[Ders Programı]] — oluşturma kapsamının tek kaynağı
- [[Öğrenci Kaydı]] — yayın anındaki mevcut
- [[Saklı Dosya]] / [[Dosya Bağı]] / [[Dosya Kategorisi]] — dosya ekleri
- [[Okul]] — okulun günü ve saat dilimi
- [[Okul Ayarları]] — hatırlatma saati ve yoğunluk eşiği
- [[Bildirim Türü]] — "ödev yayınlandı"

## Geçtiği modüller

- [[Ödevler]] — kavramın sahibi
- [[Dosya Yönetimi]] — ödev ekinin erişim çözümleyicisi ("Homework" bağ tipi)

<!-- generated:end -->

## Notlar

<El yazısı alan. Senkron buraya dokunmaz.>

## Açık Sorular

- **Adına yayınlanan ödevin sahibi ayrılmış öğretmen kalıyor;** işaretleme kapısı sahip-only olduğundan idare kendi yayınladığı ödevin ızgarasını işaretleyemez. Ürün kararı (defter: `TB-109`).
- Yalnız ekleri değiştiren bir düzenleme "içerik güncellendi" damgasını ilerletmiyor; bugün ayrı uç olmadığı için belirti yok.
- Taslak silme yumuşaktır ve çocuk satırlara (ek, seçili öğrenci) dokunmaz; temizlik borcu.
- Form bağlamı tek ders taşıyor; çok dersli öğretmene yalnız ilk dersin şubeleri teklif ediliyor.
