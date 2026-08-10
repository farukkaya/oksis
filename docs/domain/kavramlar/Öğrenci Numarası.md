---
aliases: [StudentNumber, StudentNumberCounter, Okul Numarası]
tags: [domain/people]
table: academic.student_number_counters
status: active
last-synced: 2026-08-10 (2270867)
---

# Öğrenci Numarası

<!-- generated:start -->

## Nedir

Öğrencinin okul içindeki kalıcı numarası — MEB pratiğinde "okul numarası". Öğrenci [[Profil]]'i üzerinde yaşar; nasıl üretildiği ise ayrı bir sayaç kaydında tutulur.

Tasarımın ayırt edici kararı şu: **numarada yıl yoktur.** Okul ömrü boyunca tek bir monoton sıra işler ve 100'den başlar. Yıl bazlı numaralandırma yaygın olsa da burada bilinçle tercih edilmemiş — öğrenci yıllar boyu aynı numarayı taşır, yenileme yeni numara üretmez.

## Nasıl üretilir

Sayaç okul başına tektir ve **atomik** artırılır: aynı anda iki kayıt açılsa bile iki farklı numara çıkar, çakışma olmaz.

Görünen numara iki ayarla biçimlenir ve ikisi de [[Okul Ayarları]]'nda durur: bir **ön ek** (isteğe bağlı) ve bir **en az hane sayısı**. Hane sayısı bir tavan değil **taban**dır — sıra o genişliği aşarsa numara dolgusuz olarak büyümeye devam eder. Ayar yoksa öneksiz ve en az üç hane kullanılır.

## Ön ek değişikliği ve onay

Ön ek dolu bir yeni değere ayarlandığında idareciden **onay alınır** ve bu onay değişmez bir kanıt satırı olarak yazılır: onaylayan, an, onaylanan metnin tam kopyası ve sürümü. Kayıt yalnız eklenir, hiç güncellenmez.

Gerekçe şudur: ön ek değişikliği bundan sonra üretilecek numaraların biçimini değiştirir, ama **geçmişte üretilmiş numaralara dokunmaz**. Aynı okulda iki farklı biçimde numara yan yana yaşamaya başlar; bunun sorumluluğu kayda geçirilir.

## Kurallar

- Sayaç okul başına tektir ve geriye sarılmaz.
- Numara ilk kayıtta üretilir; yenileme sırasında yeniden üretilmez.
- Ön ek ve hane sayısı yalnız üretim anında okunur; mevcut numaralar geriye dönük biçimlenmez.
- Ön ek değişikliği onay kapısından geçer.

## İlişkiler

- [[Profil]] — numaranın taşındığı yer (öğrenci profili)
- [[Okul Ayarları]] — ön ek, hane sayısı ve onay kanıtı
- [[Öğrenci Kaydı]] — numara kayıt açılırken üretilir

## Geçtiği modüller

- [[Öğrenci Kayıt Yönetimi]] — üretim ve doğrulama
- [[Okul Yönetimi]] — biçim ayarı ve onay kaydı
- [[Kullanıcılar]] — profildeki numaranın okul içi tekilliği

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- Ön ek değiştikten sonra eski ve yeni biçimli numaralar bir arada kalıyor. Listeleme ve aramada bu ikilik nasıl ele alınacak?
- Ayrılan öğrencinin numarası serbest kalıp yeniden kullanılıyor mu, yoksa sonsuza dek rezerve mi? Sayaç geriye sarmadığına göre ikincisi görünüyor ama bu açıkça yazılı değil.
