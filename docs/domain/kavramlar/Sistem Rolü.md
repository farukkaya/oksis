---
aliases: [SystemRole, Rol]
tags: [domain/people]
table: identity.system_roles
status: active
last-synced: 2026-09-13 (294ffe6)
---

# Sistem Rolü

<!-- generated:start -->

## Nedir

Platform genelinde tanımlı rol tanımı — müdür, öğretmen, veli, öğrenci gibi. Tenant'a bağlı değildir; tüm okullar aynı rol setini paylaşır. Bir kişinin rolü doğrudan burada değil, [[Rol Ataması]] üzerinden ve **sezon bazında** verilir.

Rolün iki ayırt edici alanı vardır: bağlı olduğu **portal** (platform, yönetim, öğretmen, veli, öğrenci) ve **ayrıcalık seviyesi**.

MVP'de beş rol vardır: süper yönetici, okul yöneticisi, öğretmen, veli, öğrenci. Diğer roller (okul personeli, sekreter, muhasebeci) ertelendi ve çalışma anında atanamaz ([[0007-mvp-rol-seti-bes-rol]]).

## Yaşam döngüsü

Roller seed verisiyle sabit kimlikle gelir; bu sayede yeniden migrate edilse bile atama kayıtlarının bağı kırılmaz. MVP rollerinin tamamı sistem korumalıdır: silinemez, kodu değiştirilemez.

## Kurallar

- Rol kodu tekildir ve büyük harfe normalize edilir (örn. `SCHOOL_ADMIN`, `TEACHER`); jetonda taşınan da bu koddur.
- Görünen ad Türkçedir, kod İngilizcedir.
- Ayrıcalık seviyesi sayısaldır ve **büyük sayı yüksek yetki** demektir. Seed: süper admin 100, okul yöneticisi 80, diğerleri 40.
- Atama guard'ı bu seviyeyi kullanır: bir kişi yalnız kendi seviyesinden **kesin düşük** seviyeli rol atayabilir.
- Portal bilgisi girişten sonra kullanıcının hangi arayüze yönleneceğini belirler.
- Rol-izin listesinde yönetici yalnız **kendi seviyesi ve altındaki** rolleri görür; atanabilir roller listesi yalnız **kesin düşük** seviyeleri içerir. Gerekçe: okul yöneticisi süper yöneticinin yetki kümesini görmesin.
- **Süper yönetici platform rolüdür**, okul içi rollerin üstü değildir: okulun iç verisine yalnız o okulun onayıyla, okulu üstlenerek ve izli biçimde erişir ([[0008-super-yonetici-platform-roludur]]). ⚠️ Bu karar henüz uygulanmadı: **bugünkü kod davranışı karara aykırıdır** — küresel tenant süzgeci süper yöneticiyi bütün okulların verisine açıyor ve rol seed açıklaması hâlâ "tüm tenantlara erişim" diyor (TB-139).

## İlişkiler

- [[Rol Ataması]] — rolü kişiye ve sezona bağlayan kayıt
- [[İzin]] — rolün ne yapabildiği izin matrisinden gelir
- [[Davet]] — davet bir hedef rol taşır

## Geçtiği modüller

- [[Kullanıcılar]] — atanabilir rollerin listelenmesi, rol-izin matrisi
- [[Kimlik Doğrulama]] — giriş sonrası portal yönlendirmesi ve izin çözümlemesi

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- Ayrı bir `UserRole` enum'u da var (süper admin, okul yöneticisi, personel, öğretmen, veli, öğrenci, sekreter, muhasebeci) ve kullanıcı oluşturma akışı yalnız dördünü sistem rolü koduna haritalıyor. Enum ile tablo arasındaki bu çift kaynak kalıcı mı, yoksa enum emekli mi olacak?
- Tenant'a özel rol tanımı (okulun kendi rolünü açması) ileri sürüm olarak duruyor; kapsamda mı?
