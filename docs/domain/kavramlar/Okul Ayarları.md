---
aliases: [SchoolSettings, Kurum Bilgileri, Akademik Politika]
tags: [domain/platform]
table: school.school_settings
status: active
last-synced: 2026-08-10 (2270867)
---

# Okul Ayarları

<!-- generated:start -->

## Nedir

[[Okul]] başına **tek** bir kayıt; kurumun kimliğini ve okulun kendi kurallarını taşır. Okul kaydı "bu tenant kim" sorusunu, bu kayıt "bu okul nasıl çalışır" sorusunu cevaplar.

Haritadaki önemi şudur: **başka modüllerin davranışını buradaki alanlar belirler.** Devamsızlık eşiği, yoklama düzeltme penceresi, nöbet politikası, duyuru moderasyonu — hepsi bu kayıttan okunur. Bir modülün "neden böyle davrandı" sorusunun cevabı çoğu zaman burasıdır.

## Yaşam döngüsü

Okul oluşturulduğunda varsayılan değerlerle otomatik açılır ve hiç silinmez. Alanlar bölüm bölüm, ayrı yetkilerle güncellenir.

## Ne taşır

**Kurum kimliği** — resmî ad, MEB kurum kodu, görünen ad, mülkiyet türü (özel/devlet/vakıf), kuruluş yılı, kurum yetkilisi. Yetkili bilgisini yalnız süper admin düzenler.

**İletişim ve adres** — telefon, e-posta, web sitesi, fiziksel adres.

**Tema** — logo, favicon, marka renkleri. Logonun **tek gerçek kaynağı** [[Saklı Dosya]] referansıdır; temadaki serbest logo bağlantısı geriye dönük uyum için duruyor ama yükleme/silme akışı ona dokunmaz.

**Akademik yapı** — okulun çalıştığı türler (bir okul aynı anda ortaokul + lise olabilir), eğitim dili, haftalık ders günleri, öğrenci numarası ön eki ve uzunluğu, mezun verisi saklama süresi.

**Akademik politika** — varsayılan [[Not Ölçeği]] ve geçme notu, yuvarlama kuralı, yazılı/performans sayısı ve ağırlıkları, teşekkür/takdir eşikleri, devamsızlık sınırları. *(Ölçek ve sınav türü kataloğu [[Müfredat]]'ta; buradaki alanlar seçim ve okul politikasıdır.)*

**Modül politikaları** — nöbet yancılığı, haftalık nöbet sıklığı ve gün deseni; duyuru moderasyon kipi; yoklama düzeltme penceresi (saat), geç kalma birikimi ve yarım gün eşiği.

## Okulun sunduğu kademeler

Hangi sınıf kademelerinin ([[Sınıf Seviyesi]]) okulda fiilen çalıştığı ayrı satırlarda tutulur. Bu liste bir **filtre** gibi davranır: [[Şube]] açılırken ve ders kademeleri gösterilirken uygulanır — bir lise, ortaokul kademelerini görmez.

**En az bir aktif kademe kalmalıdır**; toplu güncellemede son kademeyi kapatma denemesi reddedilir.

Ayrıca kademe bazında **not ölçeği override'ı** verilebilir: okul ilkokulu 5'lik, liseyi 100'lük ölçekle yönetebilir. Override yoksa varsayılan geçme notuna düşülür.

## Öğrenci numarası ön eki onayı

Ön ek yeni bir değere ayarlandığında idarecinin onayı **değişmez bir kanıt satırı** olarak yazılır: onaylayan, an, onaylanan metnin tam kopyası ve sürümü. Kayıt yalnız eklenir, hiç değiştirilmez — ön ek değişikliği üretilmiş numaraları etkilediği için geriye dönük sorumluluk izi gerekir.

## Kurallar

- Okul başına tam olarak bir ayar kaydı vardır.
- En az bir aktif sınıf kademesi bulunmalıdır.
- Mezun verisi saklama süresi 1-30 yıl aralığındadır.
- Kademe bazlı ölçek override'ında (okul, kademe) çifti tekildir.
- Ön ek onayı append-only'dir; hiçbir güncelleme yolu yoktur.
- Yetki alan bazında ayrılmıştır: temel bilgi, iletişim, adres, yetkili, tema, akademik yapı, akademik politika, zil, tatil, modül, bildirim ve logo için ayrı izinler vardır.

## İlişkiler

- [[Okul]] — bire bir; ayarların sahibi tenant
- [[Sınıf Seviyesi]] — okulun sunduğu kademeler ve ölçek override'ları
- [[Zil Çizelgesi]] — günlük zaman düzeni; ayrı kayıtlarda ama aynı ekranda yönetilir
- [[Okul Tatili]] — okul takvimi
- [[Modül Yapılandırması]] / [[Bildirim Yapılandırması]] — ayrı kayıtlar, aynı ayar yüzeyi
- [[Devamsızlık Özeti]] — eşik ve gün-eşdeğerliği parametrelerini buradan alır
- [[Yoklama Oturumu]] — düzeltme penceresi buradan gelir
- [[Nöbetler]] — yancılık, sıklık ve gün deseni buradan gelir
- [[Duyurular]] — moderasyon kipi buradan gelir
- [[Şube]] — şube kurulumunda onay isteyip istememe ayarı buradan okunur
- [[Öğrenci Numarası]] — ön ek, hane sayısı ve ön ek değişikliği onayı burada tutulur

## Geçtiği modüller

- [[Okul Yönetimi]] — kavramın sahibi
- [[Yoklama ve Devamsızlık]], [[Nöbetler]], [[Duyurular]], [[Sınıflar ve Şubeler]] — politika tüketicileri

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- Zaman dilimi burada **Windows** biçiminde (`Turkey Standard Time`), [[Okul]] kaydında **IANA** biçiminde tutuluyor. İki alan, iki format — hangisi yetkili?
- Devamsızlık eşiği hem burada hem [[Bildirim Yapılandırması]]'nda var. Motor buradakini okuyor; oradaki alanların tüketicisi yok.
- Not ölçeği ve sınav ağırlıkları tanımlı ama not modülü henüz haritalanmadı; bu alanların gerçekten okunduğu doğrulanamadı.
