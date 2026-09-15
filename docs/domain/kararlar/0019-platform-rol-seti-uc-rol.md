---
tags: [decision, domain/people]
date: 2026-09-15
status: accepted
---

# 0019 — Platform rol seti: üç rol, destek salt-okunur, operasyon okula girmez

<!-- generated:start -->

## Bağlam

[[0008-super-yonetici-platform-roludur]] süper yöneticiyi OKSİS personelinin platform rolü olarak tanımladı ve "operasyon ile destek aynı yetkiye ihtiyaç duymayan iki görevdir; tek rolde tutulmaları MVP kararıdır, hedef değil" diye not düştü. `K-27` (2026-09-15) platform kimliğini **ayrı platform hesabı** olarak bağladı: süper yönetici bir okulun kişisi değil, okulsuz bir platform hesabıdır. Bu iki karar birleşince soru şu oldu: platformda tek rol mü olacak, olmayacaksa hangi roller, hangi kapsamla?

Bugünkü kodda tek platform rolü var: `SUPER_ADMIN`, seviye 100, açıklaması "Platform sahibi — tüm tenantlara erişim", izin kümesi okul yöneticisinin kümesi eksi istisnalar. İzin kataloğunda platform modülü yok. Ölçüm: [[super-admin-izleri-envanteri]].

## Karar

Platform üç rolle başlar: **Platform Yöneticisi** (`PLATFORM_ADMIN`), **Okul Operasyonu** (`PLATFORM_OPERATIONS`), **Destek** (`PLATFORM_SUPPORT`). Bugünkü `SUPER_ADMIN` kodu `PLATFORM_ADMIN` olarak yeniden adlandırılır. Destek üstlenmesi salt-okunurdur. Operasyon hiçbir okula giriş yapmaz.

Ortak zemin: üçü de okulsuz platform hesabıdır, hiçbirinin okul içi izni yoktur, tenant süzgeci okulsuz çağrıya satır göstermez. Rolleri ayıran şey hangi platform verisine dokunduğu ve okulun içine girip giremediğidir.

| Rol | Kod | Yapar | Yapmaz |
|---|---|---|---|
| Platform Yöneticisi | `PLATFORM_ADMIN` | Platform hesaplarını açar ve platform rolü verir; platform ayarları; Hangfire paneli; Operasyon ve Destek'in yapabildiği her şey | Okulun içine tek başına girmez; o da üstlenme ve okul onayına tabidir |
| Okul Operasyonu | `PLATFORM_OPERATIONS` | Okul kaydı, okul kodu, ilk yönetici daveti, kademe ve sezon iskeleti, Kurum Yetkilisi (K5), plan ve lisans, modül açma-kapama, okul durumu (askı, kapanış) — hepsi okul *hakkında* veridir | Okulu üstlenmez, okulun yöneticisi adına giriş yapmaz, okul içi tek satır görmez, platform hesabı açamaz |
| Destek | `PLATFORM_SUPPORT` | Okul yöneticisinin açtığı destek erişimiyle okulu üstlenir; süreli, gerekçeli ve izli; **salt-okunur** | Okul açamaz, lisans ve modül değiştiremez, üstlenmeden okul verisi görmez, yazma yapmaz |

Platform tarafında okul rollerindeki ayrıcalık seviyesi ve alt küme motoru kullanılmaz: platform rolünü yalnız Platform Yöneticisi verir, başka kimse veremez.

İzin kataloğunda platform modülü açılır; taslak öbekler: `platform.*` (hesap, ayar) yalnız Yöneticisi; `schools.*` (kayıt, davet, plan, modül, durum, yetkili) Operasyon ve Yöneticisi; `support.*` (üstlenme, oturum) Destek ve Yöneticisi. Kesin slug listesi K-27 planında belirlenir.

## Değerlendirilen alternatifler

- **Tek rol (bugünkü `SUPER_ADMIN`)** — okul açan personelle destek veren personel aynı yetkiyi taşır; 0008 bunu MVP uzlaşması olarak işaretlemişti, hedef değildi. Ayrı hesap modeli gelince ayırmanın maliyeti düştü.
- **Dördüncü rol: Platform Raporcu** (okullar arası, kişisel veri taşımayan kullanım metrikleri) — kavram 0008'de var ("okullar arası ihtiyaç varsa adı rapordur, kimliği ayrıdır"), ama çoklu okul analitiği MVP kapsamı dışında. Katalogda yer ayrılabilir, seed'e girmez.
- **Faturalama / satış rolü** — ödeme modülü yok; sözleşme takibi Operasyon'un plan ve lisans işinde kalır.
- **Destek üstlenmesinde yazma** — okulun onay kapsamını genişletir ve iz yükünü büyütür; MVP'de gerekmiyor. Yazma gerekirse okul yöneticisi işlemi kendisi yapar.
- **Operasyon'un okul yöneticisi adına girişi** (ör. ilk yönetici davete ulaşamadıysa) — okulun onayı olmadan okul içine giriş demektir; reddedildi. O durum Destek'in onaylı üstlenmesiyle çözülür.
- **`SUPER_ADMIN` kodunu korumak** — bayat tanımı adında taşır. Seed kimliği `role:SUPER_ADMIN` dizesinden türediği için yeniden adlandırma göç gerektirir; kabul edildi.

## Sonuçları

- Rol seed'i üç satıra çıkar; `SUPER_ADMIN` satırı `PLATFORM_ADMIN` olur, açıklama metni ve `HasData` değişir, göç yazılır. İzin kümesi tersine kurulur: "okul yöneticisinin kümesi eksi istisnalar" yerine sıfırdan platform modülü.
- `AllPermissionIds()` kataloğunun platform rolüne toplu verilmesi biter; seed değişmezlerini ölçen testler yeniden yazılır.
- Kurum Yetkilisi (K5) düzenlemesi Operasyon'un işidir; bugün erişilemeyen uç (`TB-165`) platform yüzeyiyle açılır.
- Destek üstlenmesi için okul tarafında "destek erişimi aç" kaydı gerekir; bu kayıt olmadan `support.assume` izni tek başına yetmez. Üstlenme süresince yazma yolu kapalıdır.
- Hangfire paneli yetkisi Platform Yöneticisi'ne bağlanır.
- Portal süzgeci (`AccountPermissionResolver`) platform token'ı için ayrı ele alınır; bugün `Platform` portalını hiçbir profile eşlemiyor.
- İleride geri dönülürse: rol satırları ve platform izin modülü seed'dedir; Raporcu eklemek dördüncü satır ve `reports.*` öbeğidir.

## İlgili

- [[Sistem Rolü]]
- [[İzin]]
- [[Okul]] — platform yüzeyinin nesnesi
- [[Okul Yönetimi]]
- [[0007-mvp-rol-seti-bes-rol]]
- [[0008-super-yonetici-platform-roludur]]
- [[super-admin-izleri-envanteri]] — uygulama öncesi ölçüm
- [[OKSİS - Yapısal Kararlar ve Eksikler]] `K-27`

<!-- generated:end -->
