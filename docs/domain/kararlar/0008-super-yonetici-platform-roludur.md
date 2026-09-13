---
tags: [decision, domain/people]
date: 2026-09-13
status: accepted
---

# 0008 — Süper yönetici platform rolüdür; okulun iç verisini görmez

<!-- generated:start -->

## Bağlam

Rol ilk tanımda "OKSİS firma yöneticisi, sistem geneli erişim" diye yazılmıştı ve kod bunu harfiyen uyguladı. 2026-09-13'te sınav modülündeki okul sınırı açıklarının kök nedeni aranırken asıl soru ortaya çıktı: OKSİS'in kendi personeli okulların iç verisini — notu, devamsızlığı, öğrencinin kimlik ayrıntısını — görmeli mi?

## Karar

Süper yönetici **OKSİS personelinin platform rolüdür**: okulun sistemdeki varlığını yönetir, okulun içini değil. Okul içi veriye yalnız bir okulu **üstlenerek**, **o okulun onayıyla**, gerekçeli ve izli bir olay olarak erişir.

- **Yaptığı iş** dört öbektir: okul kaydı (yeni okul, okul kodu, ilk yöneticinin daveti, kademe/sezon iskeleti); mevcut okullar (liste, durum, lisans, kullanım, modül açma-kapama — bunlar okul *hakkında* veridir); destek (üstlenme yoluyla); platform ayarları (tek okulun kararı olmayan ayarlar).
- **Yapmadığı iş:** yoklama almaz, not girmez, sınav kurmaz, duyuru yayınlamaz. Okulların verisini yan yana görmez; okullar arası bir ihtiyaç varsa adı rapordur, kimliği ayrıdır ve kişisel veri taşımaz.
- "Okulu yönetmek" ile "okulları yönetmek" aynı iş değildir: süper yönetici müdürün büyüğü değil, başka bir meslektir. Bu yüzden yetkisi okul yöneticisinin yetkisinin üst kümesi olarak tanımlanamaz.
- Destek erişimini okul yöneticisi açar; açılmadan OKSİS personeli okulun iç verisine giremez.
- Rol OKSİS'in kendi personeline ve az kişiye verilir. Operasyon ve destek aynı yetkiye ihtiyaç duymayan iki görevdir; tek rolde tutulmaları MVP kararıdır, hedef değil.

## Değerlendirilen alternatifler

- **Sistem geneli üst rol (bugünkü kod)** — OKSİS personeli bütün okullardaki bütün öğrencilerin notunu, devamsızlığını ve kimlik ayrıntısını okuyabilir; KVKK ve okulun güveni açısından kabul edilmedi.
- **Okul seçerek sessizce geçersiz kılma** (istekte bir okul belirtip onun tamamına girmek) — üstlenmeyi teknik bir ayrıntıya indirir; okulun haberi ve onayı olmaz.
- **Onaysız ama izli üstlenme** — iz, erişimi sonradan görünür kılar ama engellemez; okulun onayı şartı bu yüzden eklendi.

## Sonuçları

- Tenant süzgecindeki süper yönetici muafiyeti kalkar; tenant verisi yalnız üstlenilmiş okul için görünür. Okul kaydının kendisi tenant varlığı olmadığı için okul listesi ve platform yüzeyi muafiyet kalkınca da çalışır.
- İzin kümesi tersine kurulur: bugün "okul yöneticisinin izinleri eksi yazma izinleri"; doğrusu sıfırdan başlayıp platform işinin gerektirdiğini eklemektir. Bunun için izin kataloğunda bir **platform modülü** (okullar, tenant, destek) açılmalıdır.
- Muafiyet kaldırılmadan önce süper yönetici kimliğiyle birden çok okula dokunan akışlar ve süzgeci bilinçli atlayan yerler çıkarılmalıdır; bilinmeden kaldırılırsa ekranlar sessizce boş döner.

## Uygulama durumu

**Karar alındı (2026-09-13), uygulaması bekliyor.** Bugünkü kod davranışı bu karara aykırıdır:

- Küresel tenant süzgeci süper yönetici için tamamen kısa devre ediyor; okul veri modelinin tamamında bütün okulların satırları görünüyor.
- Bir okulu üstlenmek kapsamı daraltmıyor — üstlenme sırasında da muafiyet sürüyor.
- Yazma tarafındaki okul sınırı kontrolü de süper yöneticiye uygulanmıyor.
- İzin kataloğunda platform modülü yok (bütün modüller okul içi); rol not, devamsızlık, öğrenci ayrıntısı ve dosya okuma izinlerini taşıyor.
- Rol seed'indeki açıklama hâlâ "tüm tenantlara erişim" diyor.

Zamanlama: sınav takvimi Faz 2a kapanışından sonra, kendi turunda; ilk adım ölçüm, ikinci adım izin kümesinin yeniden kurulması. Sınav modülündeki okul sınırı bulguları bunun belirtisiydi. İz: [[OKSİS - Bulgu Kayıt Defteri]] (TB-139).

## İlgili

- [[Sistem Rolü]]
- [[İzin]]
- [[Rol Ataması]]
- [[Okul]] — tenant varlığı değil; platform yüzeyinin nesnesi
- [[Okul Yönetimi]]
- [[0007-mvp-rol-seti-bes-rol]]

<!-- generated:end -->
