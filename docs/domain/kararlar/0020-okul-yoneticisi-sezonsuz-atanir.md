---
tags: [decision, domain/people]
date: 2026-09-15
status: accepted
---

# 0020 — Okul yöneticisi rolü okul düzeyinde (sezonsuz) atanır; sezon geçmişi tarihlerden türer

<!-- generated:start -->

## Bağlam

Rol ataması bugün sezona zorunlu bağlı: `RoleAssignment.SeasonId` boş olamaz, davet de sezonu yalnız bu atamaya taşımak için ister. Kural [[Rol Ataması]] notunda "atama sezonsuz olamaz" diye yazılıydı; gerekçesi öğretmen, veli ve öğrenci için sağlam (bu yılın öğretmeni gelecek yıl aynı şubede olmayabilir, geçmiş sezonun yetkisi geçmişte kalır; sezon devri bunun üstüne kurulu).

`K-27` ilk dilimi (platformdan okul aç → müdüre davet → müdür sıfırdan kursun) bu kuralla kısır döngüye giriyor: sezonu açacak izin bir atamada, atama ise sezon istiyor. Sezonu platforma açtırmak reddedildi; sezonu müdür kendisi açmalı. Ölçüm: [[super-admin-izleri-envanteri]] tartışması, 2026-09-15.

Müdürlük sezona bağlı bir görev değil, okula bağlı bir görevdir. Yine de kullanıcı şartı net: kişinin **hangi sezonlarda** yöneticilik yaptığı kaybolmasın; okul kurulumunda müdür olan biri sonraki sezon öğretmen olarak devam edebilir ve her sezondaki görevi izlenebilmelidir.

## Karar

Okul yöneticisi rolü **okul düzeyinde**, sezonsuz atanır: `SeasonId` boş olan atama tüm sezonlarda geçerlidir. Öğretmen, veli ve öğrenci atamaları sezon-bağlı kalır. Sezon geçmişi ayrıca saklanmaz; atamanın geçerlilik aralığı (`AssignedAt` → `RevokedAt` / `ValidUntil` / bugün) sezonların tarih aralıklarıyla kesiştirilerek türetilir.

Somut senaryo: kişi okul açılışında müdür atanır (sezonsuz). Ertesi yıl müdürlükten ayrılıp öğretmenliğe geçince müdür ataması gerekçeli iptal edilir (`RevokedAt` dolar, kayıt silinmez), öğretmen ataması yeni sezona bağlı açılır. Kişinin geçmişi iki kayıttan okunur: müdürlük aralığı hangi sezonlarla kesişiyorsa o sezonlarda müdür, öğretmenlik hangi sezona bağlıysa o sezonda öğretmen.

## Değerlendirilen alternatifler

- **İlk sezonu platform açsın** — davet şartı olduğu gibi kalırdı; ama müdürün sıfırdan kurulum yapması senaryonun kendisi. Reddedildi.
- **Yalnız ilk yönetici davetinde istisna** — aynı mekanik, iki ayrı yol; ikinci yönetici yine sezon isterdi. Reddedildi.
- **Sezon kavramını atamadan tamamen kaldırmak** — öğretmen/veli/öğrenci devri ve "geçmiş sezonun yetkisi geçmişte kalır" kuralı bozulurdu. Reddedildi.
- **Müdür atamasını her sezona kopyalamak (bugünkü davranış)** — kısır döngüyü çözmez, tarihçe yapay kopyalardan oluşur. Reddedildi.
- **Yöneticilik sezonlarını ayrı bir listede saklamak** — tarihlerden türetilebilen bilginin ikinci kopyası; devirde ve iptalde senkron yükü. Reddedildi.

## Sonuçları

- `RoleAssignment.SeasonId` ve `Invitation.SeasonId` boş olabilir; EF konfigürasyonu ve göç değişir. Tekillik indeksi (okul, kişi, rol, sezon) boş sezonu tek sayar: kişi-rol başına bir okul-düzeyi atama.
- İzin çözümleyici aktif sezona süzerken boş sezonlu atamayı da sayar (`AccountPermissionResolver`). Sezonsuz okulda giriş zaten çalışıyor (aktif sezon boş → süzgeç yok).
- Sezon devri boş sezonlu atamayı kopyalamaz; kopyalayacak bir şey yok.
- Davet ve rol atama validator'ları sezonu rolün türüne göre ister: okul-düzeyi rolde boş, sezon-bağlı rolde zorunlu. Hangi rolün okul-düzeyi olduğu rol tanımında belirtilir; MVP'de yalnız okul yöneticisi.
- Kişi rol geçmişi sorgusu (`GetPersonRoleAssignments`) boş sezonlu atama için sezon adı yerine türetilmiş sezon listesini ya da "tüm sezonlar" ifadesini döner. Web ve mobil listeler aynı dili kullanır.
- Bir kişinin belli bir sezondaki görevi sorulduğunda cevap iki kaynaktan birleşir: o sezona bağlı atamalar + aralığı o sezonla kesişen okul-düzeyi atamalar.
- Geri dönülürse: boş sezonlu atamalara devirle sezon yazmak yeterlidir; veri kaybı yoktur.

## İlgili

- [[Rol Ataması]]
- [[Davet]]
- [[Sezon]]
- [[Sistem Rolü]]
- [[Sezon Yönetimi]]
- [[0019-platform-rol-seti-uc-rol]]
- [[OKSİS - Yapısal Kararlar ve Eksikler]] `K-27`

<!-- generated:end -->

## Uygulama durumu

**Uygulandı** (2026-09-15, `oksis-api` `e91711bd`). Okul-düzeyi rol kümesi `SchoolLevelRoles`
(MVP'de yalnız `SCHOOL_ADMIN`). Davet ve atama sezonu rolün türüne göre `SeasonScopeRule` ile
çözüyor: okul-düzeyi rolde gelen sezon yok sayılıp boş yazılıyor, sezon-bağlı rolde sezon
zorunlu (`USERS_INVITATION_SEASON_REQUIRED` / `USERS_ROLE_ASSIGNMENT_SEASON_REQUIRED`).
`AccountPermissionResolver` boş sezonlu atamayı her sezonda sayıyor. Dev seed'de okul
yöneticileri sezonsuz. Web davet listesi boş sezonu "Tüm sezonlar" gösteriyor (`oksis-ui`
`bd8d0f6`).

Henüz yapılmayan: kişi rol geçmişi sorgusu boş sezonda "türetilmiş sezon listesi" döndürmüyor,
sezon adını boş bırakıyor. Sezon devri boş sezonlu atamayı kopyalamıyor, çünkü kaynak sezon
süzgecine takılmıyor; bunu bekçi test ölçmüyor.
