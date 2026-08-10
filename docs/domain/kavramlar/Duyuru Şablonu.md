---
aliases: [AnnouncementTemplate, Şablon]
tags: [domain/messaging]
table: announcement_templates
status: active
last-synced: 2026-08-10 (238f5e1)
---

# Duyuru Şablonu

<!-- generated:start -->

## Nedir

Hazır duyuru metni — sık tekrarlanan bir duyuruyu her seferinde yeniden yazmamak için saklanan ad, gövde ve acil tercihi. **Ayrı bir aggregate'tir**: duyurunun içinde yaşamaz, kendi yaşam döngüsü ve kendi API yüzeyi vardır.

2026-08-09'daki K1 kararıyla kişiselleşti: şablon listesi okulun ortak envanteri değil, **kişinin kendi defteridir**. Ortak veya okul şablonu diye bir kavram yoktur. Öğretmen de kendi defterini oluşturur, düzenler ve siler.

## Yaşam döngüsü

`oluşturulur → (düzenlenir | kullanılır)* → silinir`

Statü makinesi yoktur. Duyurunun tersine **silinebilir** ve silme **kalıcıdır** — soft-delete uygulanmaz, gerçek bir kayıt silme olur. Silme tüm kod tabanında tek bir dosyadan yapılabilir ve bu kısıt testle sabitlenmiştir.

Silme hiçbir duyuruyu etkilemez: aralarında yabancı anahtar yoktur ve silme onayı ekranda bunu açıkça vaat eder.

## Kurallar

- **Sahiplik bir HESAP kimliğidir**, kişi kimliği değil. Modülün geri kalanı kişi kimliğiyle çalışır; ikisini karıştırmak hiçbir hata üretmeden herkesi kendi şablonundan kilitler — liste sessizce boş döner.
- **Benzersizlik okul + sahip + ad üçlüsündedir.** Okul geneli benzersizlik, kullanıcının hiç göremediği bir kayıt yüzünden çakışma üretir ve o kaydın varlığını sızdırırdı. Başkasının aynı adlı şablonu çakışma değildir.
- **Okuma, düzenleme ve silme aynı sahiplik süzgecinden geçer.** Yabancı bir şablona erişim 403 değil **404** döner — "yetkin yok" demek o kaydın varlığını sızdırırdı.
- **Kullanım sayacı yalnız duyuru gerçekten yayına çıkınca artar.** Taslakta kalmış, reddedilmiş ya da saati hiç gelmemiş bir duyuru sayıya girmez. Sayacı yazan tek yer vardır ve yayının üç noktasından da (doğrudan yayın, onay, zamanlanmış yayın job'ı) oraya gidilir; dördüncü bir yayın yolunun sessizce doğmadığını bir bekçi testi sabitler.
- **Düzenleme sayacı ve son kullanım anını korur** — sayaç metnin yaşını değil, şablonun kullanım değerini ölçer.
- **Yetim bağ sessizce atlanır.** Şablon silinmişse sayaç hiç yazılmaz ve yayın etkilenmez; yanlış bir sayı yazmaktansa hiç yazmamak tercih edilir.
- **Şablon metninin bir üst sınırı vardır, duyuru gövdesinin yoktur.** Bu tavanın üstündeki bir gövde "şablon olarak kaydet" akışında reddedilir — ölçülmüş bir kısıttan değil, 2026-08-09 tarihli kullanıcı kararından gelen bilinçli bir sınırdır.
- Şablonun kendi denetim izi yoktur; denetim izi bir duyurunun geçmişidir.

## İlişkiler

- [[Duyuru]] — köken damgası; duyuru hangi şablondan üretildiğini taşır ama **yabancı anahtar yoktur**, çünkü bir FK ya silmeyi bloklar ya duyuruyu cascade ile yok ederdi — ikisi de duyurunun silinmezliğine aykırıdır

## Geçtiği modüller

- [[Duyurular]] — şablon defteri, oluşturma akışındaki köken bağı ve kullanım sayacı burada yönetilir

<!-- generated:end -->

## Notlar

<El yazısı alan. Senkron buraya dokunmaz.>

## Açık Sorular

- Şablon acil tercihi taşıyor, ama acil işareti yalnız yönetim yetkisi olanda kullanılabiliyor. Öğretmen acil işaretli bir şablon kaydedebilir mi — şablon ucunda böyle bir kapı görülmedi; kaydederse o şablondan üretilen duyuru oluşturma anında reddedilir mi? Kapının şablon yüzeyinde olmaması bilinçli mi?
- Sahiplik hesap kimliğine bağlı: kişinin hesabı değişirse (yeniden bağlanma, hesap birleştirme) defterindeki şablonlara ne olur? Taşıma yolu kodda görülmedi.
- Şablon değişikliği için ayrı bir denetim tablosu "gerekirse" diye bırakılmış; ihtiyaç kararı verilmiş mi?
