---
tags: [decision, domain/people]
date: 2026-09-13
status: accepted
---

# 0009 — Tek kimlik modeli: eski kullanıcı kaydı kaldırıldı

<!-- generated:start -->

## Bağlam

İki paralel kimlik modeli vardı. Eski kullanıcı kaydı (`User`) ad, soyad, rol ve durumu tek satıra gömüyordu; yeni hat kişi, profil, hesap ve sezonluk rol atamasını ayırıyordu. Öğrenci kayıt akışı yazılırken hangi modele yazılacağı netleşmezse öğrenci iki yerde doğacaktı: çift kayıt, birbirini tutmayan rol ve durum. Eski model ayrıca bir kişinin birden çok profil taşımasını (öğretmen + veli) ve rolün sezona bağlı olmasını ifade edemiyordu.

## Karar

Tek kimlik modeli: [[Kişi]] (kim) + [[Profil]] (ne olarak) + [[Hesap]] (nasıl giriyor) + [[Rol Ataması]] (hangi sezonda hangi yetki). Eski kullanıcı kaydı ve tablosu **2026-07-02'de kalıntısız kaldırıldı**; giriş, jeton yenileme, parola, davet, kullanıcı oluşturma ve okuma yollarının tamamı yeni modele taşındı.

## Değerlendirilen alternatifler

- **İki modeli yan yana yaşatmak** — çift kayıt riskinin ta kendisi.
- **Tek seferde büyük kaldırma** — geri dönüşü pahalı. Bunun yerine fazlı yürütüldü: her faz kendi eski yolunu aynı fazda sildi, hiçbir anda iki yol birlikte yaşamadı.
- **Eski kayıtları tekilleştirmeli, tek seferlik bir veri taşımasıyla aktarmak** — planlanmıştı; üretimde taşınacak gerçek veri olmadığı için bilinçli olarak atlandı ve tablo doğrudan düşürüldü.

## Sonuçları

- Kullanıcılar uç ailesi iki eksenlidir: kullanıcı listesi ve detayı **hesap eksenidir** (`/users`), kişi uçları **kişi eksenidir** (`/users/persons`). "Kullanıcı" adı arayüzde yaşıyor ama arkasında ayrı bir varlık yoktur.
- Kişinin bağlı hesap alanı her yerde gerçek hesap kimliğini taşır; eskiden davet yolu buraya eski kullanıcı kimliğini yazıyordu.
- İzinler yalnız rol atamasından çözülür; eski jetona basılı izin listesine düşen geri dönüş yolu söküldü.
- Tasarım ilkesi "hesap yalnız parola doğduğunda doğar" idi: davette hesap doğmaz, kabulde doğar. Öğrenci kaydı bunun istisnasıdır — öğrenci hesabı kayıt akışında geçici parolayla hemen doğar ve ilk girişte parola değişimi zorunludur.
- Eski kullanıcı rolü ve durumu enum'ları yaşayan kullanıcılar yüzeyi (liste, dışa aktarma) için korundu.
- Üretim devreye alınmadan önce gerçek eski veri oluşursa veri taşımasının atlanması yeniden değerlendirilmelidir; tablo geri kurulabilir ama veri geri gelmez.

## İlgili

- [[Kişi]]
- [[Hesap]]
- [[Profil]]
- [[Rol Ataması]]
- [[Davet]]
- [[Kullanıcılar]]
- [[Kimlik Doğrulama]]

<!-- generated:end -->
