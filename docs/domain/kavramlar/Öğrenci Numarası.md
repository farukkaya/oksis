---
aliases: [StudentNumber, StudentNumberCounter, Okul Numarası]
tags: [domain/people]
table: academic.student_number_counters
status: active
last-synced: 2026-09-13 (294ffe6)
---

# Öğrenci Numarası

<!-- generated:start -->

## Nedir

Öğrencinin okul içindeki kalıcı numarası — MEB pratiğinde "okul numarası". Öğrenci [[Profil]]'i üzerinde yaşar; nasıl üretildiği ise ayrı bir sayaç kaydında tutulur.

Tasarımın ayırt edici kararı şu: **numarada yıl yoktur.** Okul ömrü boyunca tek bir monoton sıra işler ve 100'den başlar. Yıl bazlı numaralandırma yaygın olsa da burada bilinçle tercih edilmemiş — öğrenci yıllar boyu aynı numarayı taşır, yenileme yeni numara üretmez. Yıl içeren eski biçimde üretilmiş numaralar yeniden biçimlenmedi; yeni sıradaki numaralarla okulda yan yana yaşar.

Ortaokul ve lise öğrencisi sisteme bu numarayla girer; o yüzden numaranın biçimi giriş çözümlemesini de etkiler.

## Nasıl üretilir

Sayaç okul başına tektir ve **atomik** artırılır: aynı anda iki kayıt açılsa bile iki farklı numara çıkar, çakışma olmaz.

Görünen numara iki ayarla biçimlenir ve ikisi de [[Okul Ayarları]]'nda durur: bir **ön ek** (isteğe bağlı) ve bir **en az hane sayısı**. Hane sayısı bir tavan değil **taban**dır — sıra o genişliği aşarsa numara dolgusuz olarak büyümeye devam eder. Ayar yoksa öneksiz ve en az üç hane kullanılır.

Numara kayıtta elle de verilebilir. Elle verilen numara iki koşulla kabul edilir: okulun biçimine uyar (ön ek varsa ön ek + en az hane kadar rakam; ön ek yoksa yalnız rakam ve değeri en az 100) ve okulda o numarayı taşıyan bir öğrenci profili yoktur.

## Ön ek değişikliği ve onay

Ön ek dolu bir yeni değere ayarlandığında idareciden **onay alınır** ve bu onay değişmez bir kanıt satırı olarak yazılır: onaylayan, an, onaylanan metnin tam kopyası ve sürümü. Kayıt yalnız eklenir, hiç güncellenmez.

Gerekçe şudur: ön ek değişikliği bundan sonra üretilecek numaraların biçimini değiştirir, ama **geçmişte üretilmiş numaralara dokunmaz**. Aynı okulda iki farklı biçimde numara yan yana yaşamaya başlar; bunun sorumluluğu kayda geçirilir.

## Kurallar

- Sayaç okul başına tektir ve geriye sarılmaz.
- **Numara yeniden kullanılmaz.** Sayaç aynı değeri ikinci kez vermez; elle girişte dolu bir numara reddedilir. Ayrılan, nakil giden veya mezun olan öğrencinin profili silinmediği için numarası dolu kalır.
- Numara ilk kayıtta üretilir; yenileme sırasında yeniden üretilmez.
- Ön ek ve hane sayısı yalnız üretim anında okunur; mevcut numaralar geriye dönük biçimlenmez.
- Ön ek değişikliği onay kapısından geçer.
- **Kullanımdaki ön ek değiştirilemez ve temizlenemez:** kayıtlı ön ekle başlayan en az bir numara varsa istek 409 ile reddedilir. Ön ek boşken yeni ön ek eklemek serbesttir; hane sayısı hiç kilitlenmez.
- **Ön ek yoksa en az hane sayısı en fazla 9 olabilir.** 10 ve üzeri haneli salt rakam numara girişte telefon numarası ve TCKN ile karışır; öğrenci kendi numarasıyla giriş yapamaz. Ön ek harf taşıdığı için bu risk yoktur, önekli numarada sınır 10'dur.

## İlişkiler

- [[Profil]] — numaranın taşındığı yer (öğrenci profili)
- [[Okul Ayarları]] — ön ek, hane sayısı ve onay kanıtı
- [[Öğrenci Kaydı]] — numara kayıt açılırken üretilir

## Geçtiği modüller

- [[Öğrenci Kayıt Yönetimi]] — üretim ve doğrulama
- [[Okul Yönetimi]] — biçim ayarı ve onay kaydı
- [[Kullanıcılar]] — profildeki numaranın okul içi tekilliği
- [[Kimlik Doğrulama]] — öğrenci numarasıyla giriş; numara okul içinde tekil olduğu için okul ipucu ister

## Açık Sorular (senkron)

- Silinmiş (soft-delete) öğrenci profilinin numarası hem elle giriş kontrolünden hem tekillik index'inden düşüyor; yani silinmiş profilin numarası elle yeniden girilebilir. "Numara yeniden kullanılmaz" kuralı silme için de geçerli olmalı mı?

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- Ön ek değiştikten sonra eski ve yeni biçimli numaralar bir arada kalıyor. Listeleme ve aramada bu ikilik nasıl ele alınacak?