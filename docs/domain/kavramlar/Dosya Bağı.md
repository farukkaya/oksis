---
aliases: [FileAttachment, Dosya Eki, Ek]
tags: [domain/platform]
table: files.file_attachments
status: active
last-synced: 2026-08-10 (2270867)
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

Bugün tanınan kayıt tipleri: okul, mazeret ve duyuru.

## İlişkiler

- [[Saklı Dosya]] — bağın dosya ucu
- [[Mazeret]] / [[Duyuru]] / [[Okul Ayarları]] — bugün tanınan hedef kayıtlar

## Geçtiği modüller

- [[Dosya Yönetimi]] — kavramın sahibi

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- Sürüm alanı taşınıyor ama sürümleme akışı (aynı hedefe yeni sürüm ekleme, eskisini emekliye ayırma) bu taramada görünmedi. Alan ileriye dönük mü?
- Aynı dosya aynı kayda iki kez bağlanabilir mi? Tekillik kuralı yok.
