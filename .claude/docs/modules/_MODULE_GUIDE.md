# Modül Dokümantasyonu Rehberi (AI için)

> Bu dosya, **modül bazlı canlı dokümantasyon sisteminin** kullanım talimatlarını AI için tanımlar. Kullanıcı "X modülüne Y özelliği ekle/güncelle" dediğinde AI bu kurallara göre davranır.

---

## 1. Klasör Konvansiyonu

Tüm modüller `.claude/docs/modules/<modul-adi>/` altında durur. Modül adı **snake_case değil**, **kebab-case** ve **tekil** (`users` çoğul istisnası — global naming konvansiyonu domain dilini takip eder).

| OKSİS Modülü | Klasör Adı |
|---|---|
| Kullanıcı yönetimi | `users` |
| Öğrenci | `students` |
| Öğretmen | `teachers` |
| Veli | `parents` |
| Okul / Tenant | `schools` |
| Akademik yıl / Sezon | `academic-years` |
| Sınıf / Şube | `classrooms` |
| Ders | `subjects` |
| Ders programı | `timetable` |
| Yoklama | `attendance` |
| Not | `marks` |
| Sınav | `exams` |
| Ödev | `homework` |
| Karne | `report-cards` |
| Duyuru | `announcements` |
| Mesajlaşma | `messaging` |
| Bildirim | `notifications` |
| Dashboard | `dashboard` |
| Okul Ayarları | `school-settings` |

### Sprint 2+ Master Data Modülleri (eklendiğinde)

Aşağıdaki master tablolar şu an mevcut modüllerin `database-schema.md` dosyalarında dokümante edildi, ancak ileride bağımsız modül olarak konumlandırılabilir:

| Tablo / İçerik | Mevcut Lokasyon | Bağımsız Modül Adayı |
|---|---|---|
| `duty_location_templates` | _henüz yok_ — Sprint 2 ile birlikte `duties` modülü açılacak | `duties` |
| `system_settings` | _henüz yok_ — Sprint 2 ile SuperAdmin paneli açıldığında `platform` veya `super-admin` modülü | `platform` / `super-admin` |

> **Karar:** Sprint 2'de Duties modülü açıldığında `duty_location_templates` ve tenant `duty_locations` birlikte modellenir. Şu anda platform-seed olarak `notification_types`'la birlikte `notifications/database-schema.md`'de değil, master data envanteri toplu olarak `modules/identity/database-schema.md` ve okul ayarları cross-reference'lerinde yer alır.

Liste exhaustive değil; yeni modül `naming-conventions.md`'deki domain dili sözlüğünden alınır.

---

## 2. Modül Klasörü İçeriği

Her modül **9 dosya iskelet** ile başlar. MVP başlangıcında 16 modülün hepsi için bu iskelet hazır gelir; içerikleri `{{TBD}}` placeholder'ı ile dolu — bilgi geldikçe doldurulur.

| Dosya | İçeriği | Tipik İlk Bilgi Kaynağı |
|---|---|---|
| `README.md` | Modül özeti, hedefi, paydaşları, ilgili rol(ler), durumu, ilişkili modüller | Modül oluşturulurken |
| `domain-model.md` | Aggregate root, properties, invariants, domain events | Domain tasarım toplantısı |
| `api-contracts.md` | Endpoint listesi, HTTP method, path, request/response şeması, permission | Backend tasarım |
| `database-schema.md` | Tablo şeması, FK, index, constraint, migration referansı | DB tasarım |
| `permissions.md` | Modüle ait permission kodları, role mapping | Permission matrisi belirlenirken |
| `notifications.md` | Event → kim → kanal → template | Notification matrisi belirlenirken |
| `ui-flows.md` | Sayfa listesi, kullanıcı akışı, wireframe linki, state management. **Tek dosya** — içinde "Web Flow" ve "Mobile Flow" alt başlıkları (bkz. § 3.7) | Frontend tasarım |
| `business-rules.md` | Modüle özel kurallar (örn. "Mark publish sonrası 24 saat içinde düzeltilebilir") | İş analizi |
| `open-questions.md` | Tartışılması gereken, henüz karar alınmamış konular | Belirsizlik çıktığında |

> **İskelet bilgisiz dosya değildir.** Şablon yapı + bölüm başlıkları + `{{TBD}}` placeholder'ları içerir. AI sadece `{{TBD}}` alanları doldurmaya odaklanır, var olan yapıyı bozmaz.

---

## 3. AI Davranış Kuralları

### 3.1 "X modülüne Y ekle / güncelle" Talebi Geldiğinde

Sıralı adımlar:

**Adım 1 — Modülü Tespit Et**
- Kullanıcının söylediği isim ile § 1'deki tabloyu eşle.
- Eşleşme bulamazsan **kullanıcıya sor**, modül adı uydurma.
- Talep edilen klasör henüz yoksa **yeni modül başlatma akışına geç** (§ 4).

**Adım 2 — İlgili Dosyayı Belirle**
- Y'nin kategorisini § 2 tablosundan oku:
  - "endpoint" → `api-contracts.md`
  - "tablo / kolon / index" → `database-schema.md`
  - "entity / event" → `domain-model.md`
  - "permission" → `permissions.md`
  - "ekran / form / akış" → `ui-flows.md`
  - "kural / kısıt" → `business-rules.md`
  - "bildirim / event-driven flow" → `notifications.md`
  - Hiçbiri uymuyorsa **kullanıcıya sor**, hangi dosyaya gideceğini.

**Adım 3 — Dosya Var mı Kontrol Et**
- Yoksa: `_MODULE_TEMPLATE/` altındaki ilgili şablonu kopyala, başlığı modüle göre uyarla, yeni bilgiyi ekle.
- Varsa: Mevcut içeriği oku, eklenecek bilgi için **uygun bölüm** belirle.

**Adım 4 — Doğrudan Yaz, Sonra Özetle**
- Dosyayı **doğrudan güncelle** (onay bekleme).
- Yazma tamamlanınca kullanıcıya **kısa özet** ver:
  ```
  ✅ Güncellendi: .claude/docs/modules/users/api-contracts.md

  Eklendi:
  • POST /api/v1/users/{id}/reset-password
    Permission: users.reset-password
    Body: { newPassword: string }
    Response: 204

  Etkilenen başka dosyalar:
  • permissions.md → users.reset-password eklendi
  • README.md → Last Updated güncellendi, Files[api-contracts.md] ✓

  Yanlış bir şey varsa söyle, geri alabilirim.
  ```
- Geri alma talebi gelirse `git diff` veya son yazılan içerikten faydalanarak revize et.

**Adım 5 — Çapraz Etki: Otomatik Uygula, Özette Belirt**
- Eklenen bilgi başka modülü/genel dosyayı etkiliyor mu? (örn. yeni permission → `permission-matrix.md`'de de bahsedilmeli)
- Etkiliyorsa **otomatik güncelle** + özet kısmında "Etkilenen başka dosyalar" başlığı altında listele.
- Özette **hangi dosyaya ne eklendiği** net olsun ki kullanıcı denetleyebilsin.

**Adım 6 — Modül `README.md` Metadata'sını Güncelle**
- `Last Updated` → bugünün tarihi (`YYYY-MM-DD`).
- `Files` checkbox'larında ilk kez içerik eklenen dosya `[ ]` → `[x]` olur.
- `Status` değişmişse (örn. `planning` → `in-progress`) güncelle.
- Bu güncelleme de özette belirtilir.

---

### 3.7 UI Flows: Web + Mobile Tek Dosyada (Konvansiyon)

Modül **iş kavramıdır, teknik katman değil.** Bir modül hem web'de hem mobile'da farklı UX ile yaşıyorsa, akışları **tek `ui-flows.md` içinde** ayrı alt başlıklara yaz:

```markdown
## Web Flow
### Sayfa Lokasyonu (oksis-web/src/portals/...)
### Ekranlar
### Web Kullanıcı Akışı

## Mobile Flow
### Sayfa Lokasyonu (oksis-mobile/src/features/...)
### Ekranlar
### Mobile Kullanıcı Akışı

## Form Validation (ortak)
## i18n Key'leri
```

**Yasaklar:**
- ❌ Ayrı `ui-flows-web.md` veya `ui-flows-mobile.md` dosya **AÇMA** — drift + duplikasyon yaratır.
- ❌ Mobile akış varken "Web Flow" başlığını tamamen atlama — hangi tier kapsam dışı belirt.

**İstisnalar:**
- Admin-only modüller (örn. `school-settings`, `users`, gelecekte `system_settings`) → sadece "Web Flow" başlığı doldurulur; "Mobile Flow" yerine kısa not yeterli ("Bu modül admin-only, mobile UI'sı yok.").
- Mobile-only modüller (henüz yok) → tersi geçerli.

**Tetik:** Yeni modül oluşturulurken `_MODULE_TEMPLATE/ui-flows.md` zaten bu yapıda gelir. Mevcut modülün ui-flows.md'sini güncellerken yapıyı koru.

---

### 3.2 "X Modülünü Oluştur" Talebi Geldiğinde

Yeni modül başlatma akışı:

1. Klasör adı belirle (§ 1).
2. `_MODULE_TEMPLATE/` klasöründeki **tüm 9 dosyayı** kopyala.
3. Placeholder'ları gerçek değerle doldur (`{{MODULE_NAME_TR}}`, `{{MODULE_NAME_CODE}}`, `{{MODULE_SLUG}}`, `{{DATE}}`).
4. `{{TBD}}` placeholder'ları **bırak** — bunlar bilgi gelince doldurulacak alanlar.
5. `README.md` metadata bloğunda tüm `Files` checkbox'ları başlangıçta `[x]` olarak işaretle (dosyalar fiziken oluşturuldu — ama içleri iskelet).
6. Kullanıcıya kısa özet:
   ```
   ✅ Modül oluşturuldu: .claude/docs/modules/<modul>/
   • 9 iskelet dosya hazır (README, domain-model, api-contracts, ...)
   • Hepsi {{TBD}} ile dolu — bilgi geldikçe sen veya ben doldurabiliriz
   • Status: planning

   Hangi alandan başlamak istersin?
   ```

> **Not:** MVP başlangıcında 16 modülün tamamı bu şekilde önceden oluşturulduğu için yeni modül oluşturma talebi nadirdir; çoğunlukla mevcut iskeleti doldurursun.

---

### 3.3 Dosya Yokken Sorgulama (Nadir Durum)

MVP modülleri önceden oluşturulmuş olsa da, bilgi henüz yazılmamışsa:

- `database-schema.md` içinde sadece `{{TBD}}` placeholder'ları varsa: "DB şeması iskeleti var ama henüz doldurulmamış. Mevcut placeholder'lar: tablo adı, kolonlar, FK'ler. Doldurmak ister misin?"
- **Var gibi davranma**, **uydurma**.
- Cevap verirken hangi alanların `{{TBD}}` olduğunu net söyle.

---

### 3.4 Çakışan / Tekrarlanan Bilgi

Aynı bilgi iki yere konmamalı. Örnekler:

- Genel permission tanımları `permission-matrix.md`'de. Modülün **kullandığı** permission'lar `modules/users/permissions.md`'de **referansla** belirtilir, kopyalanmaz:
  ```markdown
  ## Bu Modülün Permission'ları
  - `users.create` — bkz. `permission-matrix.md` § 3.1
  - `users.invite` — bkz. `permission-matrix.md` § 3.1
  ```
- Genel naming convention'lar `naming-conventions.md`'de. Modül dosyasında **referans** ile yetin.

---

## 4. _MODULE_TEMPLATE Kullanımı

`_MODULE_TEMPLATE/` klasöründeki şablonlar **AI tarafından** kopyalanır. Kullanıcı bunları doğrudan kullanmaz.

Şablonlardaki placeholder'lar:
- `{{MODULE_NAME_TR}}` — Türkçe modül adı (örn. "Kullanıcı Yönetimi")
- `{{MODULE_NAME_CODE}}` — Kod tabanındaki isim (örn. "Users")
- `{{MODULE_SLUG}}` — Klasör adı (örn. "users")
- `{{DATE}}` — Bugünün tarihi `YYYY-MM-DD`
- `{{TBD}}` — Henüz bilinmiyor, ileride doldurulacak alan

AI kopyalama sırasında tüm placeholder'ları **gerçek değerle** doldurur. `{{TBD}}` bırakılabilir — kullanıcının ileride dolduracağı işareti.

---

## 5. README.md Metadata Bloğu

Her modülün README.md'sinin **sonunda** sabit blok bulunur:

```markdown
---

## Metadata

- **Slug:** users
- **Status:** planning | in-progress | mvp-ready | live
- **Sprint:** Sprint 1
- **Owner:** {{TBD}}
- **Created:** 2025-11-15
- **Last Updated:** 2025-11-20
- **Files:**
  - [x] README.md
  - [x] domain-model.md
  - [ ] api-contracts.md
  - [ ] database-schema.md
  - [x] permissions.md
  - [ ] notifications.md
  - [ ] ui-flows.md
  - [x] business-rules.md
  - [ ] open-questions.md
```

Bu blok modülün **röntgenini** verir: ne kadar olgun, hangi sprint'te, hangi dosyalar yazılmış.

AI her güncelleme sonrası `Last Updated`'ı bugüne, ilgili `Files` checkbox'ını işaretli hale getirir.

---

## 6. AI İçin Yasaklar

- ❌ Yazma sonrası **özet vermemek**. Her güncelleme net özetle bitmeli.
- ❌ Modül adını uydurma. § 1 tablosunda yoksa kullanıcıya sor.
- ❌ Aynı bilgiyi iki yere yazma (DRY). Genel dosyalara referans yeterli.
- ❌ Genel rule dosyalarındaki içeriği modül dosyasına kopyalama (referans ver).
- ❌ "Last Updated" tarihini güncellemeyi unutmak.
- ❌ Çapraz etkiyi sessiz geçmek. Otomatik güncellersen **özette belirt**.
- ❌ Bilgi yokken uydurma — `{{TBD}}` kalmış mı kontrol et, kalmışsa söyle.
- ❌ Mevcut anlamlı içeriği `{{TBD}}` ile değiştirmek (sadece dolduruluyor, geri gidilmez).
- ❌ Modül `Status`'ünü atlamak (planning → in-progress geçişi izlenmeli).

---

## 7. CLAUDE.md Entegrasyonu

CLAUDE.md'nin başına eklenecek satırlar (kurulum sırasında):

```markdown
## Modül Dokümantasyonu

Kullanıcı "X modülüne Y ekle/güncelle" dediğinde:
1. @.claude/docs/modules/_MODULE_GUIDE.md kurallarına uy.
2. Hedef modül klasörünü `.claude/docs/modules/<modul>/` altında bul (MVP modülleri önceden hazır).
3. İlgili dosyayı belirle, **doğrudan yaz**, sonra **net özet ver**.
4. Çapraz etki varsa otomatik uygula, özette listele.
5. README.md metadata'sını güncelle (Last Updated + Status değişimi).
```
