# Duyuru — Business Rules

> Bu modüle özel iş kuralları. Yazılım dünyasından gelen genel kurallar değil — **OKSİS'te Duyuru için spesifik** kararlar.

> Genel iş kuralları için bkz. proje kökündeki `business-rules.md`.

> Kanonik tasarım: `docs/superpowers/specs/2026-08-02-duyurular-uctan-uca-design.md`
> (invariant'lar §3.5, izin kapıları §4). Buradaki kurallar ondan **türetilmiştir**;
> çelişkide spec kazanır.

---

## Kurallar

### BR-announcements-001: Şablon KİŞİSELDİR (C5 / K1, kullanıcı kararı 2026-08-09)

**Kural:** Duyuru şablonu, onu oluşturan hesaba aittir. Yönetici de öğretmen de
**yalnız kendi** şablonunu görür, düzenler ve siler. Ortak / okul şablonu kavramı
**yoktur** — yöneticilik bu kapıyı delmez.

**Sebep:** Şablon bir kişisel kısayoldur, kurumsal bir varlık değil. Okul genelinde
ortak bir defter, her öğretmenin listesini başkasının kalıplarıyla doldururdu ve
"kimin sildiği" sorusunu doğururdu.

**Uygulama:**
- Backend (izin): `announcements.template.manage` **Teacher'a da** verildi
  (`RolePermissionSeedData.cs` Teacher bloğu + seed migration
  `20260809_announcement_templates_personal`).
- Backend (kapsam): sahiplik `CreatedBy` ile ölçülür — **hesap kimliği**, `Person.Id`
  değil. Üç kapı: `GetAnnouncementTemplatesQueryHandler` listeyi
  `t.CreatedBy == currentUser.Id` ile daraltır; `UpdateAnnouncementTemplateCommandHandler`
  ve `DeleteAnnouncementTemplateCommandHandler` aynı koşulu taşır.
- DB: `IX_announcement_templates_school_id_created_by_name` **unique** — benzersizlik
  okul genelinden **sahibe** indi (eski indeks `(school_id, name)` idi).
- Frontend: liste zaten "kendi defteri" olarak çizilir; ekranda ayrıca ikinci bir
  istemci kapısı **yoktur** (gerek de yok — sunucu daraltıyor).

**Edge case'ler:**
- **Başkasının şablonuna yazma → `Error.NotFound` (404), 403 DEĞİL.** "Yetkin yok"
  demek o kaydın varlığını sızdırırdı.
- **İki öğretmen aynı adı kullanabilir** — indeks sahibe indiği için çakışmaz.
- **Yayımlanmış duyurular etkilenmez:** şablon silinince ona bağlı duyurulara hiçbir
  şey olmaz; `Announcement.TemplateId` bir **FK değildir** (bilinçli — bkz.
  BR-announcements-003).

**Test referansı:** `AnnouncementTemplateEndpointTests`
(`Oksis.Infrastructure.IntegrationTests`) — sahiplik ekseninin üçü de orada;
`AnnouncementPermissionSeedTests` + `MasterRoleSeedTests` izin satırını tutar

---

### BR-announcements-002: Duyuru görünürlüğü şablondan FARKLIDIR (C5 / K2)

**Kural:** Yönetici okulun **tüm** duyurularını görür ve üzerinde işlem yapar;
öğretmen yalnız kendi yayınladığını. **Şablonda ise ikisi de yalnız kendininkini**
görür. İki eksen bilinçli olarak ayrışıktır.

**Sebep:** Duyuru kurumsal bir kayıttır (INV-1: silinmez, geri çekilir) ve yönetimin
denetim yükümlülüğü vardır. Şablon ise kişisel bir kısayoldur; denetlenecek bir şey yok.

**Uygulama:**
- Backend: yaşam döngüsü kapısı `AnnouncementLifecycleGuard.CanActOn` →
  `caller.IsManager || announcement.PublisherId == caller.PersonId`.
  Şablon kapısı bunu **kullanmaz** — orada `IsManager` kolu hiç yoktur (BR-001).
- "Yönetim yetkisi" modülde **tek** soruyla çözülür: `announcements.approve` izni
  (`AnnouncementCallerResolver.IsManagerAsync`). **Rol sorulmaz** — `ICurrentUser.Roles`
  bu depoda her zaman boştur (spec §17).

**Edge case'ler:**
- **Taslaklar bugün yönetimin envanterinde GÖRÜNÜYOR.** `GetAnnouncementsQueryHandler`
  varsayılan bir statü kapısı taşımaz (ölçüldü 2026-08-10); temel sorgu yalnız
  `SchoolId`e bakar, `scope`/`statuses` süzgeçleri isteğe bağlıdır. Taslağın kişisel
  mi kurumsal mı olduğu **açık bir ürün kararıdır** → spec §17 `C5-8`.
- **Kaydedilmiş bir taslak bu sürümde ne düzenlenebiliyor ne yayına alınabiliyor**
  → spec §17 `C5-7`. Çıkış yolu: metni "Şablon olarak kaydet" ile saklayıp yeni
  duyuru göndermek.

**Test referansı:** `GetAnnouncementsTests`; `CanActOn` kapısı kendi test sınıfına
sahip değildir, kullanım yerlerinden ölçülür (`AmendAnnouncementTests`,
`RestoreAnnouncementTests`, `GetAnnouncementDeliveryReportTests`,
`AnnouncementAttachmentTests`)

---

### BR-announcements-003: "Şablon olarak kaydet" HER ZAMAN yeni şablon üretir (C5 / K3)

**Kural:** Şablon **güncelleme** yalnız Şablonlar sekmesinde / ekranındadır. Duyuru
oluştururken açılan "Şablon olarak kaydet" kutusu **var olan bir şablonu güncellemez** —
her zaman yeni kayıt dener.

**Sebep:** Duyuru yazarken şablon güncellemek gizli bir yan etkidir: kullanıcı duyuru
gönderdiğini sanırken başka bir yerdeki kalıbını değiştirmiş olur.

**Uygulama:**
- Backend: `CreateAnnouncementTemplateCommandHandler` yalnız `Add` yapar; upsert yoktur.
- Frontend: karar core'dadır — `templateDraftFromCompose` (`packages/core`), çıktısı
  `ready | nameTooShort | nameClash | bodyTooShort | bodyTooLong | invalid`. Compose
  ekranı **sebebi çizer**; sessiz atlama yolu yoktur.

**Edge case'ler:**
- **Aynı adla ikinci şablon OLUŞMAZ.** Benzersiz indeks `(SchoolId, CreatedBy, Name)`
  olduğu için uç `Announcements.Template.NameDuplicate` (**409**) döner.
  ⚠️ Tasarımın *"ikinci bir kayıt oluşturur"* cümlesi **yanlıştı** ve 2026-08-10'da
  ölçülerek düzeltildi. Doğru metin: *"Bu adla kaydedemezsiniz — farklı bir ad verin
  ya da o şablonu Şablonlar sekmesinden düzenleyin."*
- **İstemcinin çakışma uyarısı 409'u ÖNLEMEZ,** yalnız çoğu vakada erken haber verir:
  istemci `toLocaleLowerCase("tr")` ile karşılaştırır, sunucu ise **örnek collation'ı**
  ile (modelde hiçbir `HasCollation` yok — ölçüldü) → spec §17 `C5-9`.
- Sıra: şablon, duyuru **başarılı olduktan sonra** yazılır. Paralel sıra, yayın hata
  alınca kullanıcının ikinci denemesinde kendi bıraktığı şablona 409 yedirirdi.

**Test referansı:** `AnnouncementTemplateEndpointTests` (409 kolu),
`AnnouncementTemplateValidatorTests`,
`packages/core/src/announcements/logic.test.ts` (`templateDraftFromCompose`)

---

### BR-announcements-004: Kullanım sayacı YALNIZ gerçek yayında artar (C5 / K6)

**Kural:** `AnnouncementTemplate.UsageCount` yalnız duyuru **gerçekten yayına çıkınca**
artar. Taslak, zamanlanmış ve onay bekleyen duyurular sayacı **artırmaz** — kendi
yayın anlarında artırırlar.

**Sebep:** Sayaç "bu kalıp kaç kez kullanıldı" sorusuna cevaptır; hiç yayına çıkmamış
bir taslak bir kullanım değildir.

**Uygulama:**
- Bağ duyurunun **üzerindedir** (`Announcement.TemplateId`, nullable) — isteğin içinde
  tutulamaz, çünkü zamanlanmış/onaylı yayın isteğin çok sonrasında çalışır.
- `Announcement.Publish()` **üç** yerden çağrılır ve **üçü de** `RegisterUse` taşır:
  `CreateAnnouncementCommandHandler`, `Announcement.Approve()` yolu
  (`ApproveAnnouncementCommandHandler`), `PublishScheduledAnnouncementsJob`.
- `TemplateId` **FK değildir**: silinen şablon yayımlanmış duyuruları etkilemez.

**Edge case'ler:**
- **Geri alınan duyuru sayacı ikinci kez ARTIRMAZ** (ölçüldü): `Announcement.Restore()`
  yalnız `Status = previous` yapar, `Publish()` çağırmaz.
- Şablon **çağıranın kendisinin** olmalıdır — bağ kurulurken `CreatedBy` kontrol edilir.
- Mock (MSW) `pendingApproval` dalını hiç üretmediği için eşikli modda sayaç davranışı
  mock'ta **gerçekle ayrışır** → spec §17 `C5-11`.

**Test referansı:** üç yayın noktası üç ayrı sınıfta çivilidir —
`CreateAnnouncementTests`, `AnnouncementApprovalTests`,
`PublishScheduledAnnouncementsJobTests`; ayrıca yapısal bekçi
`AnnouncementTemplateUsageGuardTests` ve domain kolu `AnnouncementTemplateTests`

---

### BR-announcements-005: ACİL işareti bir AYRICALIKTIR — yetki ister (C5 / kullanıcı kararı 2026-08-10)

**Kural:** `Urgent = true` yalnız **okul yönetimi** tarafından kullanılabilir. Yetkisiz
çağıranda istek **403** ile reddedilir (`Announcements.Urgent.Forbidden` — *"Acil işareti
yalnız okul yönetimi tarafından kullanılabilir."*).

**Sebep:** `Urgent` bir içerik alanı değil, bir ayrıcalık talebidir: denetim izine
"Acil olarak işaretlendi" damgası düşer, envanterde `urgentOnly` süzgecine ve özet
kartındaki `UrgentThisMonth` sayacına girer, bildirim başlığına `"Acil duyuru: "` öneki
ekler.

**Uygulama:**
- Backend: `CreateAnnouncementCommandHandler` — kapı `AsDraft` dallanmasının
  **ÖNÜNDEDİR**, yani taslak da reddedilir. Ayırt edici izin `announcements.approve`'tur
  ve **yeniden okunmaz** (`caller.IsManager` zaten o izinden çözülmüştür); yeni bir izin
  anahtarı açılmadı.
- Sessizce `false`'a **düşürülmez**: sessiz düşürme yayınlayana yalan söylerdi.
- Frontend: öğretmenin şablon formunda acil anahtarı **çizilmez**; şablondan gelen
  `urgent` bayrağı öğretmen compose'una **taşınmaz**. Sözleşme değişmedi.

**Edge case'ler:**
- 🔴 **GERİYE DÖNÜK KOL YOK.** Kapıdan önce bir öğretmenin `Urgent = true` ile kaydettiği
  taslak/onay bekleyen duyuru varsa, `ApproveAnnouncementCommandHandler` ve
  `PublishScheduledAnnouncementsJob` `Urgent`'ı **hiç sorgulamadığı** için (grep → her
  ikisinde 0 isabet, ölçüldü 2026-08-10) o kayıt **acil yayına çıkar** → spec §17 `C5-5`.
- Şablon uçlarında backend acil kapısı **yoktur**; bugün etkisizdir çünkü acil
  yalnız duyuru oluştururken yayına dönüşür.
- **Türkçe hata mesajını hiçbir test korumuyor** (yalnız hata kodu ölçülüyor)
  → spec §17 `C5-6`.

**Test referansı:** `CreateAnnouncementTests` (pozitif + negatif kol),
`ResultExtensionsAnnouncementsTests`

---

## Sınır Durumlar

| Senaryo | Beklenen Davranış |
|---|---|
| Başkasının şablonunu düzenle/sil | **404** (`Error.NotFound`) — 403 değil, varlık sızdırılmaz |
| Aynı adla ikinci şablon (aynı sahip) | **409** `Announcements.Template.NameDuplicate` |
| Aynı ad, **farklı** sahip | Kabul — benzersizlik `(SchoolId, CreatedBy, Name)` |
| Şablon adı boş | **400** *"Şablon adı zorunludur."* (istemci ayrıca 2 karakter ister — tasarım daraltması) |
| Şablon metni boş | **Kabul** — yalnız başlık kalıbı olan şablon geçerlidir. ⚠️ İstemci 6 karakter istediği için bu vaka **arayüzden erişilemez** |
| Şablon metni > 4000 | **400**. Duyuru `Body`'si SINIRSIZ olduğu için 4000'i aşan duyurudan şablon üretilemez → spec §17 `C5-2` |
| Şablonu olan duyuru yayınlandı | `UsageCount` +1, `LastUsedAt` = iş zamanı |
| Şablonu olan duyuru **taslak** kaydedildi | Sayaç **değişmez**; bağ (`TemplateId`) yine de yazılır |
| Bağlı şablon silindi | Duyurular etkilenmez (`TemplateId` FK değil), sayaç kaydıyla birlikte gider |
| Öğretmen `urgent: true` gönderdi | **403** `Announcements.Urgent.Forbidden` — taslak dahil |

---

## Tarihsel Notlar

| Tarih | Değişiklik | Sebep |
|---|---|---|
| 2026-05-15 | İlk kurallar tanımlandı | İlk implementasyon |
| 2026-08-02 | `announcements.delete` kaldırıldı, `withdraw` geldi | INV-1: duyuru kurumsal kayıttır, silinmez |
| 2026-08-09 | **K1/K2/K3** — şablon kişiselleşti; benzersizlik `(SchoolId, CreatedBy, Name)`'e indi; `Description` 500 → 4000 | Kullanıcı kararı (C5). Migration: `20260809_announcement_templates_personal` |
| 2026-08-09 | **K6** — kullanım sayacı üç yayın noktasına da bağlandı | Sayaç yalnız gerçek yayında artmalı |
| 2026-08-10 | **Acil işareti yetki kapısı** (BR-005) | Kullanıcı kararı; C5 acil işaretini üründen iki tıkla erişilebilir yapmıştı |

> Eski kural değişikliği geriye dönük etki yaratıyorsa migration / data fix planı `database-schema.md`'de bahsedilir.
> ⚠️ `20260809_announcement_templates_personal.Down` **veri-bağımlı olarak geri alınamaz**
> (çakışan ad → duplicate key; 500'ü aşan metin → truncate). İkisi de gürültülü hatadır;
> rollback runbook notu için bkz. spec §17 `C5-4`.
