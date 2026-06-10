# Setup Sezonu Sihirbaza Geri Alma (Reopen-to-Draft) — Tasarım Dokümanı

**Tarih:** 2026-06-10
**Kapsam:** oksis-api + oksis-web
**Tetikleyen hata:** Sezon Yönetimi'ndeki "Hazır" (Setup) sezon kartında **Düzenle** butonu `admin/academic-sessions/new`'e gidiyor; sihirbaz boş açılıyor (taslak açılışta silindiği için düzenlenecek hedef yok).

## 1. Problem

- Sihirbaz tamamlanınca `OpenSeasonFromDraftCommandHandler` yeni `AcademicSession`'ı `Setup` statüde oluşturur ve **SeasonDraft'ı siler** (adım 9).
- Listedeki "Hazır" kartın Düzenle'si `navigate('new')` yapar; `SeasonWizardPage` yalnızca `GET /season-drafts/current`'tan yüklenir → taslak yok → boş "yeni sezon" akışı açılır.
- Taslağın sezondan yeniden inşası **kayıplıdır**: `HolidaysJson` (özel tatiller) açılışta materialize edilmiyor (handler'da TODO), copy bayrakları ve `ExcludePassiveStudents` hiçbir yere yazılmıyor, mezun satırları şube haritasında yer almıyor.
- Aynı belirsizlik yüzünden "Hazır" kartta **Sil** butonu gizliydi (completion_status bilinen boşluk notu).

## 2. Karar (kullanıcı onaylı)

1. **Mekanizma — taslağı sakla + link:** `OpenSeasonFromDraft` taslağı silmez; taslağa `OpenedSessionId` yazılır. Reopen = Setup sezonu geri al (sil), linki temizle → sihirbaz dolu taslağı yükler. Kayıpsız; yeniden inşa yok. Taslağın yaşam döngüsü artık **aktivasyonda** biter.
2. **"Yeni Sezon Aç" blokajı:** Hazır (Setup) sezon varken yeni sezon açılamaz; bilgi modalı "Önce {yıl}'ı aktifleştirin ya da düzenlemeye geri alın" gösterilir.
3. **Sil kapsama dahil:** Reopen altyapısıyla "Sil" semantiği netleşti → Hazır kartta Sil görünür olur (`cancel-setup` = geri al + taslağı sil). Bilinen boşluk kapanır.

## 3. Domain + Migration (oksis-api)

- `SeasonDraft`'a nullable `Guid? OpenedSessionId` eklenir.
  - `MarkOpened(Guid sessionId)`: yalnız `OpenedSessionId == null` iken; doluysa domain exception (`SeasonDraft.AlreadyOpened`).
  - `ClearOpenedSession()`: linki null'lar.
  - Entity doc yorumu güncellenir: taslak "Sezonu Aç" sonrası değil, **aktivasyon** sonrası silinir.
- Migration: `20260610_SeasonDraftOpenedSessionId` (tek nullable kolon; FK zorlanmaz — sezon silinince link komutla temizlenir, bağımsız cascade istenmez).

## 4. Backend komutları (oksis-api)

### 4.1 `OpenSeasonFromDraft` değişikliği

- Adım 9 `db.SeasonDrafts.Remove(draft)` → `draft.MarkOpened(session.Id)`.
- Ek guard (adım 2'den sonra): `draft.OpenedSessionId != null` ise `Conflict("academic-sessions.errors.draft-already-opened")`.

### 4.2 Yeni `ReopenSeasonToDraftCommand`

- **Endpoint:** `POST /api/v1/academic-sessions/{id}/reopen-to-draft` · izin: `academic-sessions.create` (open/delete-draft ile aynı; permission-matrix değişmez).
- **Guard'lar (sırayla):**
  1. Sezon var ve tenant'a ait; yoksa NotFound.
  2. `Status == Setup` değilse `Conflict("academic-sessions.errors.not-setup")`.
  3. Tenant taslağı var ve `draft.OpenedSessionId == id`; değilse `Conflict("academic-sessions.errors.reopen-mismatch")`.
  4. Sezonun `ClassRoom`'larında öğrenci ataması veya sezonda görevlendirme varsa `Conflict("academic-sessions.errors.reopen-has-data")` (Setup şubeleri `Active` statüde oluştuğundan teorik olarak atama yapılabilir — defensive).
- **Etki (tek transaction):** Sezonun `ClassRoom`'ları silinir, sezona bağlı `Holiday` kayıtları silinir, sezon silinir (`AcademicTerm`'ler owned/cascade), `draft.ClearOpenedSession()`.
- **Dönüş:** taslak `Id` (frontend sihirbaza yönlenir).

### 4.3 Yeni `CancelSetupSeasonCommand`

- **Endpoint:** `POST /api/v1/academic-sessions/{id}/cancel-setup` · izin: `academic-sessions.create`.
- Reopen ile aynı guard'lar ve geri alma; ek olarak taslak da silinir. Tek transaction.
- Kod paylaşımı: geri alma mantığı ortak private helper'da (ya da `ActivateSeasonRollover`'daki doğrudan-örnekleme pattern'i ile reopen handler'ı çağrılır); mantık iki yerde kopyalanmaz.

### 4.4 `ActivateSeasonRollover` değişikliği

- Aktivasyon başarıyla tamamlanınca hedef sezona bağlı taslak (`OpenedSessionId == targetSessionId`) silinir. Taslak yoksa sessizce geçilir (idempotent).

### 4.5 DTO

- `GET /api/v1/season-drafts/current` yanıtına `openedSessionId: Guid?` eklenir.

## 5. Frontend tasarımı (oksis-web)

### 5.1 Tip + veri

- `SeasonDraftDto`'ya `openedSessionId: string | null`.
- `useSeasonListData`: `draft` alanı yalnız `openedSessionId == null` iken döner ("devam eden taslak" kartı); bağlı taslak listede ayrıca gösterilmez (Hazır kart zaten Setup sezondan beslenir). Bölüm sayacı davranışı korunur: `(draft?1:0)+(pendingActivation?1:0)`.

### 5.2 Hazır kart aksiyonları (`PendingSeasonCard` + `SeasonListPage`)

- **Düzenle:** `ReopenSeasonDialog` (onay): "Oluşturulan şubeler ve yarıyıl tatili kaydı geri alınacak; sihirbaza döneceksiniz." → `POST reopen-to-draft` → ilgili query'ler invalidate → `navigate('new')`. Hata: toast.
- **Sil (görünür olur):** `CancelSetupDialog` (danger): "Sezon ve taslak tamamen silinecek; bu işlem geri alınamaz." → `POST cancel-setup` → invalidate. `onDelete` opsiyonelliği kaldırılır.

### 5.3 "Yeni Sezon Aç" blokajı

- `handleNewSeason` (header butonu + `ActiveSeasonHero` "Yeni Sezon Aç" köprüsü aynı handler): `pendingActivation` varsa bilgi modalı (`PendingBlocksNewSeasonDialog`): "Önce {yıl}'ı aktifleştirin ya da düzenlemeye geri alın." Mevcut discard-draft akışı yalnız bağsız taslak için çalışmaya devam eder.

### 5.4 Wizard guard

- `SeasonWizardPage`: yüklenen taslakta `openedSessionId` doluysa `/admin/academic-sessions`'a redirect (deep-link koruması).

### 5.5 Akademik Takvim rozeti

- "Planlanmamış ↔ Taslak" rozeti taslak varlığına bakıyorsa koşul `draft != null && draft.openedSessionId == null` olarak güncellenir (açılmış taslak "Taslak" sayılmaz; sezon zaten Setup olarak görünür).

## 6. Hata sözleşmesi (i18n)

| Kod | Durum | Mesaj (TR) |
|---|---|---|
| `academic-sessions.errors.draft-already-opened` | 409 | Taslak zaten bir sezona açılmış. |
| `academic-sessions.errors.not-setup` | 409 | Yalnız Hazır (Setup) statüdeki sezon geri alınabilir. |
| `academic-sessions.errors.reopen-mismatch` | 409 | Taslak bu sezona bağlı değil. |
| `academic-sessions.errors.reopen-has-data` | 409 | Sezona öğrenci/görevlendirme eklenmiş; geri alınamaz. |

Frontend i18n: dialog metinleri + hata toast'ları `academic-sessions` namespace'inde (hardcoded Türkçe yok).

## 7. Testler (TDD)

**Backend (IntegrationTests):**
1. `OpenSeasonFromDraft`: taslak silinmez, `OpenedSessionId = session.Id`; linkli taslakla ikinci open → `draft-already-opened`.
2. `ReopenSeasonToDraft`: sezon+şubeler+SemesterBreak Holiday silinir, link temizlenir, taslak içeriği aynen durur.
3. Reopen guard'ları: Setup değil → `not-setup`; link uyuşmaz → `reopen-mismatch`; öğrenci atanmış → `reopen-has-data`.
4. `CancelSetupSeason`: sezon + taslak birlikte silinir.
5. `ActivateSeasonRollover`: aktivasyon sonunda bağlı taslak silinir; taslaksız aktivasyon kırılmaz.

**Frontend (vitest):**
1. Bağlı taslak: DraftSeasonCard gizli, PendingSeasonCard görünür.
2. Düzenle dialog onayı → reopen çağrısı + `navigate('new')`.
3. Sil dialog onayı → cancel-setup çağrısı.
4. `pendingActivation` varken Yeni Sezon Aç → blok modalı (discard modalı açılmaz).
5. Wizard: `openedSessionId` dolu taslakla redirect.

## 8. Dokümantasyon

- `academic-years/api-contracts.md`: 2 yeni endpoint + `openedSessionId` alanı + hata kodları.
- `academic-years/business-rules.md`: taslak yaşam döngüsü BR'si (taslak aktivasyona kadar yaşar; Setup sezon yalnız veri eklenmemişken geri alınabilir; tek Setup sezon kuralı).
- `academic-years/completion_status.md`: "Sil gizli" bilinen boşluk notu kapanır; tarih/progress güncellenir.

## 9. Kapsam dışı

- Setup şubelerine manuel veri eklenmişse geri almayı "zorla" yapma (kullanıcıya yalnız hata gösterilir).
- Özel tatil materializasyonu (`HolidaysJson` → Holiday kopyalama TODO'su) — ayrı iş; bu tasarım yalnız veriyi taslakta korur.
- Aynı anda ikinci taslak/Setup sezon desteği.
