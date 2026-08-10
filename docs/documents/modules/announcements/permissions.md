# Duyuru — Permissions

> Bu modülün permission kodları ve rol → permission eşleştirmeleri.

> Genel matris için bkz. proje kökündeki `permission-matrix.md`.

---

## Permission Kodları

Kanonik küme **8 anahtardır** ve `PermissionSeedData.cs` ile birebir hizalıdır.

| Kod | Anlam |
|---|---|
| `announcements.view` | Liste + detay görüntüleme |
| `announcements.create` | Oluşturma / yayınlama |
| `announcements.update` | Yayın sonrası düzeltme (`Amend`) |
| `announcements.withdraw` | Geri çekme ve geri çekmeyi iptal |
| `announcements.approve` | Onay kuyruğunda onay/red — modülde **"yönetim yetkisi"nin TEK ölçüsü** |
| `announcements.moderate` | Moderasyon MODUNU değiştirme (serbest / eşikli) |
| `announcements.template.manage` | Duyuru şablonu oluştur / düzenle / sil |
| `announcements.report.view` | Gönderim raporu |

> **Kaldırılanlar.** `announcements.delete` ve `announcements.view-detail` **hiç var
> olmadı / 2026-08-02'de kaldırıldı** — ikisi de jenerik CRUD şablonundan sızmış
> artıktır. Duyuru kurumsal kayıttır ve silinmez (INV-1); detay `announcements.view`
> ile korunur. Bu dosya C5'te (2026-08-09) gerçeğe uyduruldu; kökteki
> `permission-matrix.md`in eski **"bu dosyalar hâlâ artık taşıyor"** uyarısı artık
> geçersizdir.

---

## Rol Eşleştirmeleri

> ✅ = full | 👁 = sadece kendine ait | 🚫 = yok | ⚙ = yapılandırılabilir

> **Seed gerçeği:** bugün yalnız **5** `SystemRole` seed'lenmiştir. `SchoolStaff` ve
> `Secretary` sütunları **hedeftir**, uygulanmış hâl değil — yetkileri bugün
> `SCHOOL_ADMIN`de toplanmıştır (bkz. `RolePermissionSeedData.cs` erteleme notu).

| Permission | SuperAdmin | SchoolAdmin | SchoolStaff | Teacher | Parent | Student | Secretary |
|---|---|---|---|---|---|---|---|
| `announcements.view` | ✅ | ✅ | ✅ | ✅ | 👁 (kendisine hedefli) | 👁 (kendisine hedefli) | ✅ |
| `announcements.create` | 🚫 | ✅ (her hedef) | ✅ (her hedef) | ✅ (sadece kendi sınıfları) | 🚫 | 🚫 | ✅ |
| `announcements.update` | 🚫 | ✅ | ✅ | 👁 (kendi oluşturduğu) | 🚫 | 🚫 | ✅ |
| `announcements.withdraw` | 🚫 | ✅ | ✅ | 👁 (kendi oluşturduğu) | 🚫 | 🚫 | 🚫 |
| `announcements.approve` | 🚫 | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 |
| `announcements.moderate` | 🚫 | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| `announcements.template.manage` | 🚫 | 👁 | 👁 | 👁 | 🚫 | 🚫 | 🚫 |
| `announcements.report.view` | 🚫 | ✅ | ✅ | ✅ | 🚫 | 🚫 | ✅ |

> `SUPER_ADMIN` duyuru yazma/yönetme izinlerinin **hiçbirini** almaz (kullanıcı kararı
> 2026-08-02): platform hesabı okul adına duyuru yayınlayıp yönetemez. Bu yedi anahtar
> bilinçli olarak `AllPermissionIds()` kataloğunda **değildir**; yalnız `view` katalogdadır.

### `announcements.template.manage` — TEACHER'a açıldı (C5 / K1, 2026-08-09)

Şablon **kişiselleşti**. İzin `RolePermissionSeedData.cs`in Teacher bloğunda ve
üretimde de aynı satırı ekleyen bir seed migration'ı var
(`20260809_announcement_templates_personal`). Satırdaki işaret bu yüzden ✅ değil **👁**.

**İzin ≠ kapsam — bunlar İKİ AYRI KATMANDIR:**

| Katman | Nerede | Ne söyler |
|---|---|---|
| İzin | `[RequirePermission("announcements.template.manage")]` | Yazma yüzeyi açık mı |
| Sahiplik | Handler'daki `CreatedBy` süzgeci | **Hangi kayda** dokunulabilir |
| Veritabanı | `IX_announcement_templates_school_id_created_by_name` (unique) | Ad benzersizliği **sahibe** iner, okula değil |

Sahiplik kapısı üç yerdedir: `GetAnnouncementTemplatesQueryHandler` listeyi
`t.CreatedBy == currentUser.Id` ile daraltır; `UpdateAnnouncementTemplateCommandHandler`
ve `DeleteAnnouncementTemplateCommandHandler` aynı koşulu taşır ve başkasının şablonunda
`Error.NotFound` döner (403 değil — kaydın varlığı sızdırılmaz). **Yönetici olmak bu
kapıyı DELMEZ:** `SCHOOL_ADMIN` de yalnız kendi şablonlarını görür ve düzenler.

---

## Resource-Level Scope Kuralları

Permission yetmez, kapsam (scope) da kontrol edilir:

- **Teacher** → yayınlarken yalnız kendi sınıfları; yaşam döngüsü eylemlerinde yalnız
  kendi yayınladığı duyuru (`AnnouncementLifecycleGuard.CanActOn` →
  `caller.IsManager || PublisherId == caller.PersonId`)
- **Parent** → yalnız kendisine hedefli duyuru (`AnnouncementRecipient` eşleşmesi)
- **Student** → yalnız kendisine hedefli duyuru (aynı mekanizma)
- **Şablon (her rol)** → yalnız `CreatedBy == currentUser.Id` olan kayıtlar (yukarıdaki bölüm)
- **"Yönetim yetkisi"** modülde tek bir soruyla çözülür: `announcements.approve` izni
  (`AnnouncementCallerResolver.IsManagerAsync`). Rol **sorulmaz** — `ICurrentUser.Roles`
  bu depoda her zaman boştur (bkz. spec §17)

---

## Default Deny

Matriste açıkça verilmemiş = **eri̇şi̇m yok**. Yeni permission eklendiğinde tüm rollere default `🚫` gelir.

> Detay: `permission-matrix.md` § 7.
