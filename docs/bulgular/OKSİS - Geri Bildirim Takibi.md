# OKSİS — Geri Bildirim Takibi

> **Ne bu dosya:** TestFlight ve Play'den gelen her mobil geri bildirimin tek satırlık kaydı ve DURUMU.
> Ayrıntı (tam açıklama, ekran görüntüsü, çökme logu) satırdaki "ayrıntı" bağlantısındadır: `gelen/<gün>/bildirimler.md`.
> **Kim yazar:** `oksis-ui/apps/mobile/scripts/feedback-pull.js` her sabah yalnız YENİ kimlikleri `yeni` durumuyla
> tablonun sonuna ekler, var olan satırlara dokunmaz. Durum, Bulgu ve Kapanış sütunlarını ajan ekibi günceller.
> Tablonun altına başka içerik yazma; script satırları dosyanın sonuna ekler.
>
> **Durumlar:**
> - `yeni` — henüz ayıklanmadı
> - `bulgu` — [[OKSİS - Bulgu Kayıt Defteri]]'nde bir TB maddesine bağlandı (Bulgu sütununa TB-xxx yazılır)
> - `mükerrer` — aynı sorun başka bir satırda ya da TB maddesinde zaten var (Bulgu sütununa onu yaz)
> - `hata-değil` — öneri, soru ya da beklenen davranış; Faruk'a karar olarak gider
> - `çözüldü` — düzeltme test derlemesinde doğrulandı; Kapanış sütununa düzeltmenin geldiği derleme no ve tarih yazılır
>
> `çözüldü` yalnız Ekran Test Uzmanı düzeltmeyi bildirimin geldiği platformda gördükten sonra yazılır.
> Bağlı TB maddesi kapanınca o maddeye bağlı bütün satırlar birlikte `çözüldü` olur.

| Kimlik | Tarih | Platform · tür | Derleme | Bildirim | Durum | Bulgu | Kapanış |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `ios-AEnsvVZoZkcM8LkOu3NxP1A` | 9.10.2026 07:24 | ios · geri bildirim | 924 | Soğuk açılışta kullanıcısız açılıyor [[gelen/2026-10-13/bildirimler\|ayrıntı]] | çözüldü | — | Faruk bildirdi, 13.10.2026 (takip öncesi çözülmüş) |
| `ios-AE42xbU5V590CrulHJVUH0I` | 9.10.2026 07:27 | ios · geri bildirim | 924 | Dönem bilgisi kaldırılmalı ve devamsızlık göstergesi tasarımda olduğu gibi gösterilmeli [[gelen/2026-10-13/bildirimler\|ayrıntı]] | çözüldü | — | Faruk bildirdi, 13.10.2026 (takip öncesi çözülmüş) |
| `ios-APLWCdf4N4okriqNPXMy6Fc` | 12.10.2026 19:26 | ios · geri bildirim | 1006 | Uyarı görünmüyor [[gelen/2026-10-13/bildirimler\|ayrıntı]] | çözüldü | — | Faruk bildirdi, 13.10.2026 (takip öncesi çözülmüş) |
| `ios-AJ3xZ_Sh7i9Z9SsQiLjd1e8` | 12.10.2026 19:27 | ios · geri bildirim | 1006 | Bozuk görsel [[gelen/2026-10-13/bildirimler\|ayrıntı]] | çözüldü | — | Faruk bildirdi, 13.10.2026 (takip öncesi çözülmüş) |
| `ios-ADtyCaevCeXQ0ncrK3Evp3A` | 12.10.2026 19:30 | ios · geri bildirim | 1006 | Bu alan ve görsel ekleme bölümü yeni ödev paneli ile aynı olmalı görsel, belge ve bağlantı eklenebilir [[gelen/2026-10-13/bildirimler\|ayrıntı]] | çözüldü | — | Faruk bildirdi, 13.10.2026 (takip öncesi çözülmüş) |
| `ios-AMh_8IxUlUA8mOdsmI6R0Bc` | 12.10.2026 20:26 | ios · geri bildirim | 990 | Çift profilli hesaplarda bu ekrana profil değiştirme butonu eklenmeli [[gelen/2026-10-13/bildirimler\|ayrıntı]] | çözüldü | — | Faruk bildirdi, 13.10.2026 (takip öncesi çözülmüş) |
| `ios-AOz20w8vcTfkiE7VdaEDlsM` | 12.10.2026 20:31 | ios · geri bildirim | 1006 | Bu ekranda canlı sinyalı aktif gibi görünsede sayfa yenilenmeden canlı olarak bu sayfa yenilenmiyor [[gelen/2026-10-13/bildirimler\|ayrıntı]] | çözüldü | — | Faruk bildirdi, 13.10.2026 (takip öncesi çözülmüş) |
