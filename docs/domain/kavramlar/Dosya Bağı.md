---
aliases: [FileAttachment, Dosya Eki, Ek]
tags: [domain/platform]
table: files.file_attachments
status: active
last-synced: 2026-09-03 (b72c819)
---

# Dosya Bağı

<!-- generated:start -->

## Nedir

Bir [[Saklı Dosya]] ile bir iş kaydı arasındaki bağ. "Bu mazerete şu rapor eklendi", "bu duyuruya şu PDF iliştirildi" cümlelerinin karşılığı.

Bağ **çok biçimlidir**: hedef kaydın tipi bir metin alanında taşınır, yabancı anahtar kurulmaz. Bu sayede yeni bir modül dosya kullanmak istediğinde dosya tarafında şema değişikliği gerekmez.

Kavramın ayrı durmasının sebebi şu: **aynı dosya birçok kayda bağlanabilir.** Bir sanal kitap on iki şubeye aynı anda iliştirilir ve tek kopya olarak saklanır. Bağ silindiğinde dosya silinmez — dosyanın ömrü kendi kurallarına tabidir.

## Yaşam döngüsü

Kurulur ve kaldırılır. Sıra numarası ve açıklaması güncellenebilir. Bir sürüm numarası taşır.

## Kurallar

- Hedef kayıt tipi zorunludur.
- Sürüm en az 1, sıra numarası negatif olamaz.
- **Bağ kaldırmak dosyayı silmez**; fiziksel imha ayrı bir işin sorumluluğudur.

## Erişim kapsamı

Bir dosyaya erişim, bağlı olduğu kaydın erişim kuralına devredilir: her kayıt tipi için ayrı bir çözümleyici, "bu kullanıcı bu kayda erişebiliyor mu" sorusunu cevaplar.

**Kayıtlı olmayan kayıt tipi doğrudan reddedilir** ve çağırana "bulunamadı" olarak döner — kaynağın var olup olmadığı sızdırılmaz. Yeni bir modül dosya kullanmak istediğinde tek yapması gereken kendi çözümleyicisini yazmaktır; dosya tarafı değişmez.

Bugün tanınan kayıt tipleri: okul, mazeret, duyuru, **ödev eki**, **ödev teslimi** ve öğrenci belgesi. Ödev tarafında iki ayrı tip vardır: öğretmenin eki ile öğrencinin teslimi aynı kovaya düşseydi idari kaldırma hangi bağın kimin dosyası olduğunu ayırt edemezdi. Ödev ekinin bağı ödev modülünün kendi ek satırına **ek olarak** yazılır — ekran ödevin satırını okur, Documents'ın saklama ve kullanım hesabı bu bağı görür; yalnız ilki yazılsaydı dosya "kullanılmıyor" görünüp imha edilebilirdi.

## İlişkiler

- [[Saklı Dosya]] — bağın dosya ucu
- [[Mazeret]] / [[Duyuru]] / [[Okul Ayarları]] — tanınan hedef kayıtlar
- [[Ödev]] / [[Ödev Teslimi]] — iki ayrı bağ tipi; ek ve teslim

## Geçtiği modüller

- [[Dosya Yönetimi]] — kavramın sahibi
- [[Ödevler]] — öğretmen eki ve öğrenci teslimi için bağ yazar; erişim çözümleyicileri ödevin görünüm kuralına devreder

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- Sürüm alanı taşınıyor ama sürümleme akışı (aynı hedefe yeni sürüm ekleme, eskisini emekliye ayırma) bu taramada görünmedi. Alan ileriye dönük mü?
- Aynı dosya aynı kayda iki kez bağlanabilir mi? Tekillik kuralı yok. Ödev teslimi tarafı bunu bilinçli olarak serbest bırakıyor (kota sınırlar, tekillik değil).
- Öğrenci belgesi çözümleyicisi bu taramada görüldü ama [[Öğrenci Belgesi]] notu hâlâ "kendi ham dosya adresini tutuyor" diyor; o not ayrı bir turda ölçülmeli.
