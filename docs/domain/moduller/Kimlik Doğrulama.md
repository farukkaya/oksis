---
aliases: [Identity, api/v1/auth]
tags: [domain/people, module]
status: completed
last-synced: 2026-09-13 (294ffe6)
---

# Kimlik Doğrulama

<!-- generated:start -->

## Ne yapar

Kullanıcının sisteme girmesini, oturumunun sürmesini ve hangi bağlamda çalıştığının bilinmesini sağlar. [[Kullanıcılar]] modülü "kim var" sorusunu, bu modül "kim giriş yaptı ve şu an ne yapabiliyor" sorusunu cevaplar.

OKSİS'e özgü olan kısım bağlam yönetimidir: tek girişle birden fazla [[Profil]] arasında, veliyse çocuklar arasında, yöneticiyse sezonlar arasında geçilebilir. Aynı insan için ikinci hesap açılmaz.

## Kullandığı kavramlar

- [[Hesap]] — modülün ana aggregate'i; parola, oturum, kilit, aktif bağlam
- [[Kişi]] — hesabın arkasındaki insan; bağ `PersonId` köprüsüyle
- [[Profil]] — giriş sonrası aktif profil seçimi
- [[Veli-Öğrenci İlişkisi]] — veli hesabının çocuk bağlamı buradan doğrulanır
- [[Rol Ataması]] / [[Sistem Rolü]] / [[İzin]] — çalışma anındaki yetkiler
- [[Sezon]] — aktif sezon bağlamı
- [[Rıza Kaydı]] — girişte rıza kapısı

## Ana akışlar

1. **Giriş** — kullanıcının girdiği tanımlayıcı önce normalize edilip sınıflandırılır. Geçerli giriş tanımlayıcıları e-posta, telefon ve öğrenci numarasıdır; **TCKN girişte reddedilir** (yalnız parola kurtarmada, okul bilindiğinde kabul edilir). Öğrenci numarasıyla giriş okul ipucu olmadan çözülmez. **Hesap var/yok sızdırılmaz:** kişinin bulunamaması, bağlı hesabın olmaması ve yanlış parola aynı tip 401 döner; her durumda sabit bir sahte hash üzerinde parola doğrulaması koşturularak yanıt süresi eşitlenir. Tek istisna: parola doğru ama kişi askıda, arşivde ya da nakil edilmişse açıklayıcı bir 403 döner. Ardından rıza kapısından geçilir ([[Rıza Kaydı]]) ve bağlam çözülür; birden fazla profil varsa ve seçim yapılamıyorsa oturum açılmaz, profil seçimi istenir ([[Hesap]]).
2. **Kilitlenme** — yalnız hatalı parola sayacı artırır; eşiğe ulaşınca hesap süreli kilitlenir. Yönetici elle açabilir, açan kişi kayda geçer.
3. **Jeton yenileme** — refresh token her yenilemede döner: eskisi geri çekilir, yenisi zincire eklenir. Kullanılmış bir jeton tekrar gelirse bu saldırı sayılır; tüm zincir geri çekilir ve şüpheli kullanım olayı yayınlanır. Yenileme de rıza kapısından geçer; veri işleme rızası geri çekilmiş kullanıcı oturumunu jeton döndürerek uzatamaz (TB-10).
4. **Bağlam geçişi** — profil, çocuk ve sezon geçişleri ayrı akışlardır; her biri hesaba yazılır ve kendi olayını yayınlar. Sezon geçişi salt-okunur bilgisini de taşır (geçmiş sezona bakmak yazma yetkisi vermez). Yürürlükteki sezona geçiş serbesttir; kurulum aşamasındaki (Setup) sezona `season.update` izniyle, arşiv sezona `season.archive.view` izniyle geçilir ve ikisi de salt okunurdur. `season.archive.view` yalnız süper yönetici ve okul yöneticisine verilir; arşive geçişin ikinci kaynağı okulun rol bazlı ayarıdır ve ikisinden biri yeter.
5. **Parola** — kullanıcı kendi parolasını değiştirir (tüm oturumlar kapanır), unuttuysa kanal üzerinden tek kullanımlık sıfırlama jetonu ister. Jeton ham saklanmaz, 30 dakika yaşar, tek kullanımlıktır. Parola hash'i Argon2id'dir.
6. **Çıkış** — tek oturumdan veya tüm oturumlardan. Zorla çıkarma (askıya alma, rıza geri çekme, parola değişimi) olay üzerinden tetiklenir ve istemciye bildirilir.
7. **İzin çözümleme** — izinler jetona basılmaz. Her istekte hesabın aktif sezondaki rol atamalarından çözülür ve önbelleğe alınır; matris veya atama değişince izin sürümü artırılır ve önbellek geçersizleşir.
8. **Denetim** — başarılı/başarısız giriş, kilit, çıkış, bağlam geçişi, yetki reddi ayrı olaylar olarak denetim kaydına düşer; kişisel veri maskelenerek yazılır.

## Arka plan işleri

- Süresi geçmiş refresh token temizliği
- Kullanılmamış OTP kayıtlarının temizliği

## Kapsam dışı

- OTP ile giriş — altyapı iskeleti (kod hash'i, deneme sayacı, 5 dakika ömür) hazır, akış sonraki sürümde etkinleşecek.
- SMS ile parola sıfırlama — MVP yalnız e-posta.

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- İki adımlı doğrulama bayrağı hesapta var ama giriş akışında karşılığı görünmüyor.
- Denetim kaydındaki IP ve tarayıcı bilgisinin 1 yıl sonra anonimleşmesi hedefleniyor ve saklama işi tanımlı, ama iş bugün iskelet: eşiği hesaplayıp log yazıyor, anonimleştirme adımı yok. Ne zaman bağlanacak?
- Kilitli hesap tek tip 401 yerine ayrı bir kilit hatası dönüyor. Kilit ancak var olan bir hesap için oluşabildiğinden bu yanıt hesabın varlığını ele veriyor mu?
