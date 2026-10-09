# K-34 · Bildirim kanalının tek kararı alıcınındır

> **Durum:** ✅ Karara bağlandı · ✅ uygulandı, Test'e itildi (2026-10-09)
> **Tarih:** 2026-10-09
> **Karar veren:** Faruk Kaya
> **Ana dosya:** [[OKSİS - Yapısal Kararlar ve Eksikler]]
> **Revize ettikleri:** [[K-02 - OS Push Altyapısı]] R2 (okul matrisi), [[K-01 - Bildirim Matrisi]] kanal ekseni
> **Doğduğu bulgu:** `E-42` (duyuru bildirim kanalları)

---

## Karar

Bir bildirimin hangi kanaldan (uygulama içi, push, e-posta, SMS) gideceğine **yalnız alıcı** karar verir. Bu kural sistem çapındadır ve gelecekteki her modül için de geçerlidir.

- **Yayınlayıcı kanal seçmez.** Duyuru dahil hiçbir modülün formunda, isteğinde veya komutunda kanal alanı bulunmaz.
- **Okul olay×kanal matrisi kalkar.** Okul yöneticisi bir olayın kanalını açıp kapatmaz.
- **Sistem kataloğu yalnız kanalın var olup olmadığını söyler.** Katalog bir olayın hangi kanalları desteklediğini tanımlar; bu bir tercih değil, teknik kapsamdır.

Teslim kuralı: **katalogdaki destek ∩ alıcının tercihi.**

## Sonuçları

| Konu | Önce | Sonra |
|:--|:--|:--|
| Duyuru formu | Yayınlayıcı push/e-posta kutularını seçiyordu (`E-42` ilk hâli, hiçbir ortama çıkmadı) | Kanal kutusu yok; formda "alıcıların bildirim tercihlerine göre iletilir" bilgisi |
| Okul ayarları | Olay×kanal matrisi (`notification_rule_configs`) | Matris ve tablosu kalkar; **sessiz saatler kalır** (zamanlama, kanal kararı değil) |
| Okul ana kanal anahtarları | `NotificationConfig` genel / push / e-posta / SMS açık-kapalı | Kalkar. *Geç gelme bildirimi* anahtarı kalır (olayın kendisi, kanal değil); günlük SMS limiti kalır |
| Push | Okul satırı ∩ alıcı tercihi | Katalog ∩ alıcı tercihi (tercih satırı yoksa açık — mevcut kural) |
| E-posta | Okul anahtarı + okul satırı (katalogda e-postası açık push olayları: `GRADE_PUBLISHED`, `ANNOUNCEMENT_URGENT`) | Alıcının e-posta tercihi olmadığı için **geçici olarak tüm olaylarda kapalı**; `E-44` alıcı e-posta tercihiyle açılır |
| SMS | Okul satırına bağlı | Bildirim hattında SMS kanalı yok; SMS yalnız tek seferlik giriş kodunda kullanılıyor, etkilenmez |
| Acil duyuru | Okul sessiz saatini aşıyor | Değişmedi; push'u yine alıcının tercihi belirler |

Push kapsamındaki (`PushEventKeyMap`) her olayın katalog push desteği açıktır; kulüp etkinliği ve kulüp duyurusu bu kararla açıldı (eskiden yalnız okul matristen açabiliyordu, matris kalkınca hiç gidemez olacaklardı). Testle korunur.

Hesap e-postaları (davet, parola sıfırlama) bildirim hattının dışındadır; bu karardan etkilenmez.

## Neden

- Aynı bildirimi üç ayrı katmanın (yayınlayıcı, okul, alıcı) süzmesi, "neden bana gelmedi" sorusunu cevapsız bırakıyordu. Teslim raporu da hangi katmanın kestiğini anlatamıyordu.
- Kanalı alıcının elinden almak, istenmeyen bildirimi kapattırmanın en hızlı yoludur ([[K-01 - Bildirim Matrisi]] O1 ile aynı gerekçe).

## Koruma

- `oksis-api` mimari testi: hiçbir MediatR komutu kanal seçimi taşımaz.
- [[notification-rules]] yasak pratikler listesinde.

## Uygulama

- `oksis-api` `feat/duyuru-kanallari` → `dev` `59e618e6`: `5d1bad74` yayınlayıcı seçimi, `AllowedChannels`, okul matrisi ve tablosu; `3e7a71c0` okul ana kanal anahtarları, kulüp olaylarının push varsayılanı. Göç `20261009174330_20261009_announcement_channel_defaults` (tablo ve kolonları düşürür; Down şemayı kurar, veri geri gelmez). Mimari test `NoChannelDecisionInCommandsTests`, katalog bekçisi `NotificationCatalogPushTests`.
- `oksis-ui` `fix/acik-bulgular` → `dev` `99177aa`: `39adfa0` duyuru formu, `0a36ac1` okul matrisi, `c52893c` ana anahtarlar, `4729a87` şema.
- 2026-10-09 18:01 Test'e itildi.
