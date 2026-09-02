---
aliases: [Person, Kullanıcı]
tags: [domain/people]
table: identity.persons
status: active
last-synced: 2026-09-03 (b72c819)
---

# Kişi

<!-- generated:start -->

## Nedir

Okul ekosistemindeki gerçek insanı temsil eden aggregate root. Öğrenci, öğretmen, veli ve idari personel — hepsi birer **Kişi**dir; ne olduklarını taşıdıkları [[Profil]] belirler. Yani "öğrenci" ayrı bir tablo değil, öğrenci profili taşıyan bir kişidir.

Bu ayrımın pratik karşılığı şu: kendi çocuğu aynı okulda okuyan bir öğretmen tek kişi kaydıdır, iki profili vardır ve tek girişle ikisi arasında geçiş yapar. Türkiye'de yaygın olan bu durumu ikinci bir hesap açmadan çözmek modelin ana gerekçesidir.

Kimlik doğrulama burada değil, [[Hesap]] tarafındadır: Kişi "kim olduğunu", Hesap "nasıl giriş yaptığını" tutar.

## Yaşam döngüsü

`Draft → Invited → Active → Suspended | Graduated | Transferred → Archived`

- **Draft** — kayıt açıldı, henüz davet gitmedi.
- **Invited** — [[Davet]] oluşturuldu.
- **Active** — davet kabul edildi veya doğrudan aktive edildi. **En az bir profil zorunludur**; profilsiz kişi aktive edilemez.
- **Suspended** — askıya alma; gerekçe zorunlu, geri dönüşü var (`Reactivate`).
- **Graduated** — yalnızca öğrenci profili olan kişide anlamlı, aksi hâlde reddedilir.
- **Transferred** — nakil. Hedef okul `null` ise OKSİS dışına çıkış demektir; hedef okulda kopya oluşturmak **ayrı bir iştir**, bu geçiş onu yapmaz.
- **Archived** — KVKK saklama süresi sonrası; yalnız `Suspended`, `Graduated` veya `Transferred`'dan girilir. Terminal.

Geçişlerin tamamı aggregate metotlarıyla korunur; geçersiz geçiş `USERS_LIFECYCLE_INVALID_TRANSITION` ile reddedilir.

## Kurallar

- Bir kişide aynı tipten iki profil olamaz (`ProfileDuplicateType`).
- Aktivasyon için en az bir profil şart.
- Bağlı hesap (`LinkedAccountId`) bir kez yazılır, **değiştirilemez** — yeniden davet yeni hesap üretmez.
- Kimlik numarasının açık hâli domain'e hiç girmez: yalnız tenant'a özel tuzla üretilmiş hash ve AES-GCM ile şifrelenmiş değer tutulur. Kriptografi Infrastructure'ın işidir.
- Kimlik numarası hash'i tekildir (`ux_persons_national_id_hash`); tuz tenant'a özel olduğundan bu pratikte okul içi tekillik demektir. Aynı numaranın ikinci kez girilmesi `USERS_PERSON_DUPLICATE_NATIONAL_ID` döner.
- Kimlik belgesi TCKN, YKN veya pasaport olabilir; doğrulama tipe göre dallanır.
- Mezuniyet yalnız öğrenci profilinde, nakil yalnız `Active` durumda mümkündür.
- Nakil hedefi kendi okulu olamaz.

## Kimi görebilir (kapsam kuralı)

Kaynak-seviyesi erişim rol adına değil, çözülmüş izne ve gerçek ilişki kaydına bakar:

1. `users.view-all` izni olan → tenant içinde kısıt yok.
2. Kişinin kendisi → her zaman serbest.
3. Veli → yalnız [[Veli-Öğrenci İlişkisi]]'nde "bilgi görebilir" bayrağı açık olan çocuğu.
4. Öğretmen → yalnız kendi şubelerindeki öğrenci.

## İlişkiler

- [[Profil]] — sahiplik; kişinin rolleri profillerle kazanılır
- [[Hesap]] — bire bir köprü (`LinkedAccountId`); modüller arası FK kurulmaz, ID ile bağlanır
- [[Veli-Öğrenci İlişkisi]] — iki kişi arasındaki veli bağı
- [[Rol Ataması]] — kişiye sezon bazında sistem rolü verir
- [[Davet]] — kişiyi sisteme sokan akış
- [[Rıza Kaydı]] — KVKK onayları kişiye bağlanır

## Geçtiği modüller

- [[Kullanıcılar]] — kavramın sahibi; kayıt, profil, yaşam döngüsü, içe/dışa aktarma
- [[Kimlik Doğrulama]] — login sırasında hesabın arkasındaki kişiyi ve bağlamını çözer
- [[Öğrenci Kayıt Yönetimi]] — öğrenci kaydı akışı kişi, profil, numara, veli bağı ve hesabı tek işlemde üretir
- [[Notlar]] — öğretmen, öğrenci, veli ve yönetici kişi kimliğiyle çözülür; oturum kişiye bağlanamıyorsa yazma yolu yoktur
- [[Ödevler]] — sahip öğretmen, öğrenci, veli kişi kimliğidir; "ayrılmış öğretmen" bir kolon değil, çalışan kişiler kümesinin tümleyenidir

Kişiye `PersonId` ile bağlanan ama henüz notu olmayan modüller: Teachers, Messaging.

<!-- generated:end -->

## Notlar

<El yazısı alan. Senkron buraya dokunmaz.>

## Açık Sorular

- Nakil (`Transferred`) hedef okulda kopya kişi üretmiyor; bu ikinci adım hangi modülün işi olacak?
- `EmergencyContact` değer nesnesi tanımlı ama `Person` üzerinde bir alan olarak görünmüyor — nereye bağlanacak?
