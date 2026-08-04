# Duyurular — B fazı başlangıç prompt'u (yeni oturum)

> Bu dosya, B fazını temiz bir oturumda başlatmak için hazırlanmış prompt'tur.
> A3'ün kapanışında (2026-08-04) yazıldı. Aşağıdaki bloğu olduğu gibi yapıştır.

---

Duyuru modülünün **B fazını** yapacaksın: codegen + sözleşme birleştirme.

## Depolar ve yön

- **Yazacağın depo:** `/Users/farukkaya/Repositories/oksis-ui` (monorepo, frontend).
- **`/Users/farukkaya/Repositories/oksis-api`'ye YAZMA.** Backend A fazında bitti ve
  `master`'a merge edildi (`b22147c`, push edilmiş). Oku, doğrula, ama değiştirme.
  Backend'de gerçek bir kusur bulursan **dur ve bana söyle** — kendin düzeltme.
- **`/Users/farukkaya/Repositories/oksis`** spec/doküman deposu. Buraya yazabilirsin
  (spec §13 güncellemeleri), `master` dalında.

## Önce oku

1. `oksis/docs/superpowers/specs/2026-08-02-duyurular-uctan-uca-design.md` — **§13**
   (codegen adımları, drift listesi), §14 (C fazı boşlukları), §17 (açık riskler).
2. `oksis-ui/CLAUDE.md` — özellikle "Backend Contract" bölümü.
3. A3 defteri: `oksis-api/.superpowers/sdd/2026-08-03-duyurular-a3-yardimci-uclar/progress.md`
   — sonundaki "Devredilen (B fazına)" bölümü ve kapanış notları.

## Görev

Spec §13'ün 8 adımı. Özet:

1. Backend ayağa kalkar; Swagger duyuru uçlarını içerir.
2. Codegen → `packages/api/src/generated/schema.ts` yenilenir.
3. `paths.ts` augmentation'ı generated tiplerle çakışır ve **typecheck kırılır**.
   Bu bir arıza değil, bilinçli drift bekçisinin çalmasıdır.
4. Şekil farkları giderilir (aşağıya bak).
5. `contract.ts` + `paths.ts` **silinir**; `endpoints.ts`'teki eşleyiciler kalır.
6. `packages/api-mocks` tiplerini generated şemadan almaya geçirilir —
   bugün `contract.ts`'ten alır, silinince kırılır. **Bu adım atlanamaz.**
7. İki app typecheck + lint.
8. Web ve mobil gerçek uca karşı duman testi (Next `rewrites` proxy üzerinden).

MSW handler'ları **silinmez** — senaryo/hata denemeleri ve mobil dev için kalır.

## Bilinen şekil farkları — ALTI tane, spec'te BEŞİ yazılı

Spec §13 beş madde sayar. **Altıncısı spec'te YOK** ve eklemen gerekiyor:

1. `AudienceSelectionBody` → `bucket: "parent" | "teacher" | "student"` eklenir;
   `endpoints.ts` onu gövdeye yazacak şekilde düzeltilir (bugün düşürüyor).
2. `CreateAnnouncementBody` → `attachmentFileId: string | null` eklenir; compose formu doldurur.
3. `POST /announcements` başarı statüsü **`201` → `200`**. Typecheck'i asıl kıracak olan bu.
   Aynı sapma `POST /announcements/templates` için de geçerli.
4. Şablon yazma uçları (`POST`/`PUT`/`DELETE`). `PUT`/`DELETE` rotaları
   `/announcements/templates/{id}` olduğu için `paths.ts`'e **yeni bir path anahtarı**
   gerekir; yalnız `POST` mevcut anahtarın `post` slotuna girer. `DELETE` gövdesizdir,
   `204` döner, `Wrapped<T>` sarmalı YOKTUR.
5. `restore` mock'u koşulsuz `published` yazıyor (`announcement-handlers.ts`). Backend
   `StatusBeforeWithdraw`'a döner. **Davranış farkı — typecheck yakalamaz**, elle düzeltilir.
6. **`:withdraw` artık `scheduled`'dan da çalışıyor** (A3, ME-4b). `paths.ts`, MSW ve UI
   bunu bilmiyor; web/mobil zamanlanmış duyuruda geri çekme düğmesini göstermiyor.
   Gerekçe: boş hedefli zamanlanmış duyuru aksi hâlde terminal hâle geliyordu
   (yayınlanamaz/geri çekilemez/düzeltilemez/silinemez). INV-1 silmeyi yasakladığı için
   `:withdraw` emekliye ayırmanın tek yolu. **Bu maddeyi spec §13'e de ekle.**
   Ayrıca §13'ün `restore` drift maddesi yalnız `expired` kolunu anlatıyor —
   `scheduled` kolu da eklenmelidir.

## Bağlayıcı kısıtlar

- **Spec'in drift listesini eksiksiz sayma.** Altıncı maddenin spec'te olmaması bunun
  kanıtı. A1'de planın tahmin ettiği dokuz dış API'nin **dokuzu da** farklı çıktı.
  Her şekli **canlı Swagger'a ve `generated/schema.ts`'e karşı doğrula**, spec'e veya
  bu prompt'a değil. Satır numaraları (`endpoints.ts:247`, `paths.ts:76`,
  `announcement-handlers.ts:220-228`) A2/A3 sırasında doğruydu; **yeniden doğrula.**
- `generated/schema.ts` **wire şeklinin tek otoritesidir**. El yazımı bir tip onunla
  çelişiyorsa yanlış olan el yazımı olandır. Generated dosyayı asla "uyarlama".
- **Wire tiplerini "iyileştirme".** id görünümlü string `string` kalır; sayı görünümlü
  string `string` kalır. `studentNo` **`string`**'tir (backend `"20260100"` döner) —
  `number`'a çevirmek baştaki sıfırları yok eder. Bu drift iki kez shipledi.
- **Mock'lar da tiplidir.** `packages/api-mocks` fixture'ları generated DTO'yu alan alan
  yansıtmalı. Typecheck yeşilken yanlış runtime tipi yayan mock bir hatadır.
- **Tarih üretiminde `toISOString().slice(0,10)` yasak** (+03:00'te önceki günü üretir).
- `npm` kullan — `pnpm`/`yarn` yok, tek lockfile.
- Commit kuralı: `<type>(<scope>): <açıklama>`, scope `web`/`mobile`/`core`/`api`/`ui`/`repo`,
  açıklama Türkçe, emir kipi, küçük harf, nokta yok. Bir commit = bir mantıksal değişiklik.
- Dal: `feature/announcements-b`. Commit öncesi `npm run typecheck && npm run lint`.
- `git stash` kullanma.

## Yöntem

`superpowers:writing-plans` ile plan yaz, sonra `superpowers:subagent-driven-development`
ile uygula. **Planlarken gerçek repo şekillerini doğrula** — A1'in dersi bu.

Plan yazmadan önce şunları kendin doğrula ve plana gerçek değerleri yaz:
- Backend ayağa kalkıyor mu, Swagger kaç path/operasyon veriyor
  (A3 kapanışında: 16 path / 21 operasyon, tam bir DELETE ve o da şablon ucu).
- Codegen komutu ne, `package.json`'da hangi script.
- `contract.ts` + `paths.ts`'i bugün kim tüketiyor (A3 kapanışında 11 endpoint
  fonksiyonu + 13 hook) — silme adımının gerçek yarıçapı bu.
- `packages/api-mocks` bugün tiplerini nereden alıyor.

## Bilinen tuzaklar

- **Bash aracının varsayılan timeout'u 120 sn ve otomatik arka plana atar.** Uzun
  komutlarda (`npm run build`, codegen, test) `timeout` parametresini **açıkça** ver
  (ms, maks 600000). macOS'ta `timeout` komutu yok.
- Alt ajanlara model'i **açıkça** ver; belirtilmezse oturumun en pahalı modelini miras alır.
- Bir testin kırıldığını göstermek için **üretim kodunu kalıcı değiştirme** — mutasyon
  denetimi yap, geri al, raporla.

## Kapsam dışı

C fazı (frontend boşlukları: `restore` bağlanması, sayfalama, moderasyon↔Ayarlar bağı,
mobil derin bağlantı, kanal tablosu gizleme, `requiresApproval` testleri) **B'de yapılmaz**.
Web veli/öğrenci okuma yüzü tasarım gelmeden kapsam dışıdır (K-7).
