---
aliases: [Announcement, AnnouncementReach, Erişim Kapsamı, Geri Çekme]
tags: [domain/messaging]
table: announcements
status: active
last-synced: 2026-09-13 (294ffe6)
---

# Duyuru

<!-- generated:start -->

## Nedir

Okulun kitlesel iletişim kaydı — müdürlüğün veya bir öğretmenin belirli bir alıcı kümesine gönderdiği, kalıcı ve geri izlenebilir metin. Gündelik dilde "duyuru". Modülün aggregate root'u: hedefler, alıcılar ve denetim izi bu köke aittir. Her duyuru okulun **aktif** sezonuna bağlanır; aktif sezon yoksa duyuru oluşturulamaz.

Karakteristik özelliği kurumsal kayıt oluşudur: yazıldıktan sonra yok edilemez, yalnızca emekliye ayrılır.

## Yaşam döngüsü

```
                  ┌───────────── oluşturma transaction'ı ─────────────┐
  (yeni) ───────► │  Draft ──┬─► Published                             │
                  │          ├─► Scheduled ──(job)──► Published        │
                  │          └─► PendingApproval ──► Published (onay)  │
                  └───────────────────┬─────────────────────────────────┘
                                      └─► Draft (red) ← burada kalır

  Published ──► Expired (günlük job)
  Published | Expired | Scheduled ──► Withdrawn ──► (geri çekmeden önceki statü)
```

- **Draft** — kaydedilmiş taslak. Kök taslaktan üç çıkış tanımlar, ama **üçünün de tek çağıranı oluşturma handler'ıdır** ve üçü de aynı transaction içinde çalışır. Kalıcılaşmış bir taslağı ilerleten komut yoktur: düzenlenemez (düzeltme yalnız `Published`'dan çalışır), yayına alınamaz, zamanlanamaz, onaya gönderilemez, geri çekilemez ve silinemez. Reddedilen duyuru da aynı yere düşer. **Taslak kişiseldir:** envanter listesinde ve özet sayaçlarında taslağı yalnız yazarı görür, yönetim yetkisi taslağa erişim vermez. Bunun bilinçli bir sonucu var: reddedilip taslağa dönen duyuru yöneticinin listesinden, sayacından ve onay kuyruğundan çıkar (C5-8, C6-6).
- **Scheduled** — ileri tarihli yayın bekliyor; hedefler donmuş, alıcılar henüz materyalize edilmemiş. Eşikli moderasyonda onay gerektirecek bir duyuru **zamanlanamaz**; istek reddedilir ve önce onaya gönderilmesi istenir. Onaydan sonra zamanı korumak durum makinesine yeni bir kol eklemek demekti, reddetmek ise kullanıcıya doğru yolu söylüyor (C6-5).
- **PendingApproval** — eşikli moderasyonda onay kuyruğunda.
- **Published** — yayında; alıcı listesi ve sayısı mühürlü.
- **Expired** — geçerlilik tarihi geçti; okuyucu yüzeyinde hâlâ görünür.
- **Withdrawn** — alıcı listelerinden düştü, arşivde kaldı. Geri çekme gerekçe ister. Geri almayı yalnız yönetim ya da duyuruyu geri çeken kişi yapabilir; yayınlayan olmak tek başına yetmez. Geri alma, geri çekme gerekçesini kayıttan siler.
- **Archived** — enum'da tanımlı, ama üretim kodunda bu statüye geçiş yazan tek satır yok.

## Kurallar

- **INV-1 — duyuru silinmez.** Statü enum'unda `Deleted` yoktur, entity soft-delete alanlarını miras almaz, duyuru API yüzeyinde `DELETE` ucu yoktur. Yanlış duyuru geri çekilir.
- **INV-2 — hedefler yayın (veya zamanlama/onaya gönderme) anında donar.** Düzeltme metodu hedef parametresi **almaz**; hedefi yanlış seçilmiş duyuru düzeltilmez, geri çekilip yeniden yayınlanır. Hedef etiketleri de aynı anda dondurulur — şube adı sonradan değişse bile kayıt kime gittiğini kendi kelimeleriyle anlatır.
- **INV-3 — uygulama içi kanal kapatılamaz.** İstemci göndermese de eklenir.
- **INV-4 — geri alma önceki statüye döner.** Koşulsuz yayına almaz: süresi dolmuş duyuru arşive, zamanlanmış olan beklemeye döner (ve job onu tekrar denemeye devam eder).
- **INV-5 — eşikli moderasyon kovaya bakar, hedef katmanına değil.** Yönetim yetkisi olmayan yayınlayanın **veli kovasına** giden herhangi bir seçimi duyuruyu onay kuyruğuna düşürür; öğrenci kovasına gidenler serbest yayınlanır.
- **INV-6 — süresi dolan duyuru arşive iner** ve bildirim üretmez.
- **INV-7 — okuyucu yüzeyi yalnız yayındaki ve süresi dolmuş duyuruları görür.** Bu küme tek yerde tanımlıdır; gelen kutusu, tekil kayıt ve okundu damgası aynı listeyi kullanır.
- **Erişim kapsamı ile imza bağımsız iki eksendir.** 11. sınıf velilerine Okul Müdürlüğü imzasıyla giden duyuru sınıf kapsamlı **ve** kurumsaldır; tek alanla modellenemez.
- **İmza yazıldığı anda donar.** Öğretmen kendi adı ve branşıyla, yönetim "Okul Müdürlüğü" adına imzalar. Bayatlama **istenen** davranıştır: öğretmen okuldan ayrılsa da duyurusu yayında ve imzası tarihsel kalır. Kurumsal imzanın arkasındaki gerçek yazar ayrıca saklanır — sekreter yayınlasa bile alıcı yüzeyinde adı görünmez, sorumluluk zinciri kaybolmaz.
- **"Güncellendi" rozeti tek yönlüdür.** Sessiz düzeltme rozeti açmaz, ama bir kez açıldıysa sonraki sessiz düzeltme onu kapatmaz.
- **Acil işareti bir ayrıcalıktır, içerik alanı değil.** Yalnız yönetim yetkisi olan kullanabilir. Oluşturma anında yetkisiz istek reddedilir, sessizce yok sayılmaz. Ama duyuru günler sonra yayınlanabildiği için kapı **yayın anında da** çalışır: onayla ya da zamanlanmış işle yayına çıkan duyuruda **yayınlayanın** o anki yetkisi yeniden ölçülür. Yetkisizse bayrak düşürülür, denetim izine uyarı düşer ve duyuru yine yayınlanır. Yayın anında uyarılacak bir muhatap olmadığından reddetmek, duyurunun hiç çıkmaması demek olurdu. Kapı yayından **önce** çalışır, çünkü yayın olayı acil bilgisini taşır. Kapı eklenmeden önce yazılmış bekleyen kayıtları günlük bir süpürme işi aynı kuralla temizler; düşürülen bayrak, yetki geri gelse de kendiliğinden geri gelmez (C6).
- **Red gerekçesi hiçbir alanda saklanmaz** — yalnız denetim izinde ve öğretmene giden bildirimde yaşar. Geri çekme gerekçesi ise kökte durur.
- **Geri çekilen duyuru alıcıya bildirilmez.** Bildirim yalnız yayınlayana gider, o da duyuruyu başkası geri çektiyse. Alıcıya "az önce gördüğün duyuru geri çekildi" demek geri çekmenin amacını, yani duyuruyu ortadan kaldırmayı bozardı; iz yönetim tarafında tutulur. Kendi eyleminin haberi ise gürültüdür.
- **Sessiz düzeltme bildirim üretmez.** Sessiz olmayan düzeltme yalnız alıcılara gider ve her düzeltme ayrı bir haber sayılır.
- **Alıcı ve denetim izi kayıtları aktörsüz oluşamaz.** Kimliği çözülemeyen çağıran, kalıcı ve silinemez bir kaydı sahipsiz bırakırdı; kapı domain seviyesinde kapalıdır.
- Veli satırlarında "hangi çocuk nedeniyle ulaştı" bilgisi yalnız **sınıf kapsamlı** duyuruda dolar; okul geneli duyuruda bilinçli olarak boş bırakılır, böylece üç çocuklu veli aynı duyuruyu üç kez görmez.
- Okundu damgası idempotenttir; ilk okuma anı korunur. Damga duyuru açılınca düşer; ayrı bir "okudum" onayı yoktur.

## İlişkiler

- [[Sezon]] — kimlik referansı; duyuru okulun aktif sezonuna bağlanır, aggregate'ler arası gezinme yoktur
- [[Duyuru Şablonu]] — köken damgası; **yabancı anahtar yoktur**, şablon silinse bile duyuru etkilenmez ve bağ yetim bir kimlik olarak kalır
- [[Şube]] — dolaylı; şube katmanındaki hedef anahtarı bir şubeyi işaret eder ve etiketi şube adından üretilir

Kavram notu olmayan bağ: `Person` (yayınlayan, alıcı, denetim izi aktörü). Ek dosya [[Saklı Dosya]]'da, yayın ve karar bildirimleri [[Bildirim]]'de yaşar.

## Geçtiği modüller

- [[Duyurular]] — kavramın sahibi; yaşam döngüsü, hedefleme, moderasyon ve raporlar burada yönetilir

<!-- generated:end -->

## Notlar

<El yazısı alan. Senkron buraya dokunmaz.>

## Açık Sorular

- **Kalıcılaşmış taslağın çıkışı yok.** Ne düzenlenebiliyor, ne ilerletilebiliyor, ne geri çekilebiliyor, ne siliniyor. Reddedilen duyuru da oraya düşüyor — üstelik red metodunun docblock'u "öğretmen düzeltip yeniden gönderebilir" diyor, ama bunu yapacak bir uç yok. Yazılmamış bir faz mı, bilinçli bir MVP sınırı mı?
- `Archived` statüsü enum'da tanımlı ve tel karşılığı var, ama hiçbir kod ona geçiş yazmıyor. Gelecek için ayrılmış bir değer mi, terk edilmiş bir tasarım mı?
- Yayın sonrası düzeltme yalnız başlık ve gövdeye dokunuyor; acil işareti, sabitleme, geçerlilik tarihi ve ek dosya oluşturmadan sonra hiçbir komutla değiştirilemiyor. Bilinçli bir dondurma mı, yoksa henüz yazılmamış bir yüzey mi?
- Taslak mahremiyeti yalnız liste ve sayaçlarda uygulanıyor; tekil kayıt ucu kapsama alınmadı. Yönetici taslağı listede göremiyor, ama kimliğini bilirse detayını açabiliyor. O uçta görünürlük "kendi kaydı veya yönetim" kuralıyla veriliyor ve bu kuralı değiştirmek denetim izi ile gönderim raporu uçlarını da etkiliyor (C6-7). Taslak orada da kişisel mi olmalı? (2026-09-13)
