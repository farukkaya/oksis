---
tags: [ihtiyac-analizi, domain/platform]
date: 2026-10-08
status: taslak
karar: K-33
---

# OKSİS — Demo Talebi ve Satış Akışı · İhtiyaç Analizi

> Landing (oksis.net) "Demo talep et" bölümünün arka yüzü: talep nerede tutulur, talepten satışa
> ve satışa dönmeyen talebe ne olur. Karar kaydı: `K-33` ([[OKSİS - Yapısal Kararlar ve Eksikler]]).

## 0. Ölçülen başlangıç durumu (2026-10-08)

- Landing formu (`gecici/landing-taslak/index.html`, `#demo`) veriyi **hiçbir yere göndermiyor**:
  `onsubmit` yalnız buton metnini "Teşekkürler" yapıyor. Landing yayına girerse talepler sessizce kaybolur.
- Formda beş alan var: ad soyad, okul adı, telefon, e-posta, öğrenci sayısı (aralık). KVKK aydınlatma bağlantısı `#`.
- Merkez Platform yüzeyi var: web `(platform)/platform/{schools,curriculum,branches}`, API `PlatformSchoolsController`
  (liste, oluşturma, künye). Okul açma ucu hazır.
- [[0019-platform-rol-seti-uc-rol]] ayrı "satış rolü"nü reddetti: sözleşme takibi Operasyon'un plan/lisans işinde.
- Okul durumları Kurulum → Aktif → Askıda → Arşiv; planlar ücretsiz / standart / premium ([[Okul]]).
- Prod API henüz yok (yalnız Test ortamı canlı); landing Vercel'de, statik.

## 1. Talep nerede tutulur

**Karar: Merkez Platform'da, kendi API'mizde, platform düzeyinde `DemoRequest` kaydı.** Harici CRM yok.

Gerekçe:
1. **Dönüşümde veri yeniden yazılmaz** — "Kazanıldı" talepten önceden dolu okul açılışı başlatır; talep `SchoolId`
   ile okula bağlanır. Okulun hangi kanal/CTA'dan geldiği kalıcı bilinir.
2. **KVKK** — kişisel veri yurt dışı CRM'e aktarılmaz; saklama/imha kuralı bizde.
3. **İzin modeli hazır** — 0019'un `schools.*` öbeğinin yanına `leads.view`, `leads.manage`.
   Operasyon + Yöneticisi görür; Destek görmez. Yeni rol yok.

**Tenant:** `DemoRequest` okula ait değildir, `IHasTenant` taşımaz; platform kaydıdır, `IgnoreQueryFilters` gerekmez.
Okul token'ı platform uçlarına ulaşmaz.

```
 oksis.net (statik)                       api.oksis.net                        merkez.oksis.net
 ┌────────────────────┐  POST (anonim)    ┌───────────────────────────┐        ┌───────────────────────┐
 │ Demo formu         │ ────────────────► │ /api/v1/public/           │        │ Platform › Talepler   │
 │ + gizli: cta,      │  Turnstile        │   demo-requests           │ ◄───── │ liste + kanban        │
 │   utm_*, referrer  │  rate limit       │ → DemoRequest (tenant'sız) │        │ leads.view / .manage  │
 └────────────────────┘  honeypot         │ → olay DemoRequested      │        └───────────────────────┘
                                          └────────────┬──────────────┘
                                ┌──────────────────────┴───────────────────────┐
                                ▼                                              ▼
                 Talep edene otomatik e-posta                    Operasyona anında bildirim
                 ("aldık, 1 iş günü içinde dönüyoruz")           (e-posta + platform zili)
```

### 1.1 Ara çözüm — prod API gelene kadar (karar: Vercel fonksiyonu → e-posta)

Landing deposunda (`oksis-web`) tek bir sunucu fonksiyonu `/api/demo`: Turnstile + honeypot doğrular, talebi
operasyon e-postasına iletir, talep edene onay e-postası gönderir. Kalıcı depo yoktur — e-posta kutusu geçici kayıttır.
Prod API açılınca form `api.oksis.net`'e çevrilir; birikmiş talepler bir kerelik elle (veya betikle) `DemoRequest`'e aktarılır.
Form alan adları ve gizli alanlar baştan nihai sözleşmeyle aynı tutulur, böylece çevirme yalnız URL değişimidir.

### 1.2 Form alanları

| Alan | Zorunlu | Not |
|---|---|---|
| Ad soyad | ✓ | mevcut |
| Okul adı | ✓ | mevcut |
| E-posta | ✓ | mevcut |
| Telefon | | mevcut |
| Öğrenci sayısı (aralık) | | mevcut |
| **Görevi** (kurucu / müdür / müdür yrd. / BT / diğer) | ✓ | karar verici nitelendirmesi |
| **İl** | | yerinde / uzaktan demo |
| **Okul türü / kademeler** (çoklu) | | demoyu okula göre hazırlamak — formun vaadi |
| **Not / öncelikli ihtiyaç** | | yol haritası "Bize yazın" bağlantısı buraya `cta=roadmap` ile iner |
| **Ticari ileti izni** (ayrı, işaretsiz kutu) | | 6563 / İYS; KVKK aydınlatmasından ayrı onay |
| *gizli* `cta` | | hero / nav / mobil-nav / roadmap / footer |
| *gizli* `utm_source/medium/campaign`, referrer | | kanal ölçümü |
| *sunucu* KVKK metin sürümü, zaman, IP özeti | | ispat |

**Tekrar eden talep:** aynı e-posta veya aynı okul adı+il açık bir talebe eşleşirse yeni kayıt açılmaz; mevcut talebe
"tekrar temas" notu düşer, talep listede öne çıkar. Kaybedilmiş talep tekrar yazarsa YENİ'ye döner.

## 2. Talepten satışa akış

```
                ┌───────────┐
   form ──────► │   YENİ    │  SLA: 1 iş günü içinde ilk temas
                └─────┬─────┘
                      │ arandı / yazıldı
                      ▼
                ┌───────────────┐   karar verici değil, veli/öğrenci,
                │ NİTELENDİRME  │ ─ spam, rakip, kapsam dışı ──────────► GEÇERSİZ (nedenli)
                └─────┬─────────┘
                      │ uygun okul
                      ▼
                ┌───────────────┐
                │ DEMO PLANLANDI│  tarih + kanal (uzaktan / yerinde)
                └─────┬─────────┘
                      ▼
                ┌───────────────┐  ortak "Demo Okul" tenant'ında,
                │ DEMO YAPILDI  │  okulun kademelerine göre senaryo
                └─────┬─────────┘
                      │ okul denemek istiyor
                      ▼
                ┌───────────────┐  gerçek tenant açılır (Kurulum),
                │ PİLOT         │  30 gün, bitiş tarihi zorunlu
                └─────┬─────────┘
                      ▼
                ┌───────────────┐
                │ TEKLİF        │  plan + öğrenci sayısı + fiyat + geçerlilik tarihi
                └──┬─────────┬──┘
          kabul    │         │  ret / sessizlik
                   ▼         ▼
          ┌────────────┐  ┌────────────┐
          │ KAZANILDI  │  │ KAYBEDİLDİ │  (neden zorunlu)
          └─────┬──────┘  └────────────┘
                ▼
   pilot varsa aynı tenant devam eder (veri kaybolmaz) → plan atanır → Aktif
   pilot yoksa talepten önceden dolu "okul aç" → ilk yönetici daveti → sihirbaz
```

- Her aşamadan KAYBEDİLDİ'ye geçilebilir; Pilot atlanabilir (Demo Yapıldı → Teklif).
- Her geçiş zaman + platform hesabı + not ile iz bırakır; kanban bu durumlar üzerine kurulur.
- Talebin bir **sorumlusu** (platform hesabı) vardır.

### 2.1 Otomatik kurallar (Hangfire)

| Kural | Davranış |
|---|---|
| YENİ'de 1 iş günü | sorumluya / operasyona hatırlatma |
| Ulaşılamadı | 14 günde 3 başarısız temas kaydı → KAYBEDİLDİ (ulaşılamadı) |
| Pilot bitişine 7 gün | hatırlatma; okul yöneticisine "pilotunuz bitiyor" iletisi |
| Pilot bitti, teklif yok | talep TEKLİF'e çekilir, sorumluya görev |
| Teklif geçerliliği doldu | hatırlatma |
| Yeniden temas tarihi geldi | KAYBEDİLDİ → YENİ |

Arka plan işleri izin kapısından geçen kullanıcı komutunu çağırmaz; sistem komutu ikizi yazılır
(bkz. arka plan işi kuralı, [[background-job-rules]]).

## 3. Satışa dönmezse

Kaybetme nedeni listeden **zorunlu**: Fiyat · Zamanlama · Rakip (hangisi) · Eksik özellik (hangisi) ·
Ulaşılamadı · Karar verici ikna olmadı · Diğer.

```
 KAYBEDİLDİ
   ├─ Eksik özellik ──► ihtiyaç kaydına bağlanır (E-## / yol haritası)
   │                    özellik yayına girince (izin varsa) "artık var" iletisi, talep YENİ'ye döner
   ├─ Zamanlama / Fiyat ──► "yeniden temas tarihi" (varsayılan: okulların karar dönemi, Mart–Haziran)
   │                        o gün talep YENİ'ye döner
   └─ Diğer / Ulaşılamadı ──► besleme havuzu — yalnız ticari ileti izni varsa
```

**Saklama (karar: 24 ay):** satışa dönmeyen talebin kişisel verisi (ad, telefon, e-posta, not) son temas tarihinden
**24 ay** sonra anonimleştirilir. Okul adı, il, ölçek, tür, kaynak, CTA, neden ve aşama geçmişi istatistik olarak kalır.
Ticari ileti izni olan kayıt için süre iznin geri alınmasıyla başlar. Süre KVKK aydınlatma metnine açıkça yazılır.
GEÇERSİZ (spam vb.) kayıtlar 30 günde silinir.

**Pilot açılmış, satış yok:** okul → **Askıda** (salt okunur) → okula veri dışa aktarımı sunulur → 30 gün sonra
**Arşiv** ve okul kişisel verisinin imhası. Talep KAYBEDİLDİ'ye geçer, neden girilir.

## 4. Ölçüm — butonun faydası

Platform › Talepler panosu:
- CTA ve kanal (utm) başına **talep → kazanım** dönüşümü (yalnız form sayısı değil).
- Aşama dönüşüm hunisi ve aşamada bekleme süresi.
- Kayıp nedeni dağılımı; "eksik özellik" sayımı yol haritasına girdi, landing "yakında" bölümünü besler.
- İlk temas SLA uyumu.

Landing tarafı: teşekkür ekranında net sonraki adım ("1 iş günü içinde arayacağız"); her buton kendi `cta` değerini taşır;
yol haritası "Bize yazın" formu not alanı odaklı açar.

## 5. Kapsam dışı (MVP)

- Takvimden kendi kendine demo randevusu (ileride: bağlantı ile).
- Teklif PDF'i / e-imza / ödeme entegrasyonu — plan ve yenileme bugün elle ([[Okul Yönetimi]]).
- Okul başına ayrı demo sandbox'ı — demo ortak "Demo Okul" tenant'ında yapılır.
- Ayrı satış rolü (0019).

## 6. Açık uçlar

- Ara çözüm e-posta sağlayıcısı (Vercel fonksiyonundan gönderim) ve operasyon alıcı adresi.
- KVKK aydınlatma metni ve ticari ileti onay metninin yazılması (landing'de bağlantılar `#`).
- "Demo Okul" tenant'ının içeriği (sentetik seed; gerçek okul verisi kullanılmaz).
- Pilot okulun planı: pilotta hangi modüller açık (öneri: premium, süreli).

## 7. Dilimler (taslak)

| # | Dilim | Depo |
|---|---|---|
| 0 | Ara çözüm: `/api/demo` Vercel fonksiyonu + form alanları + gizli alanlar + Turnstile | oksis-web |
| 1 | `DemoRequest` aggregate, anonim uç (rate limit, Turnstile, tekrar eşleşme), onay + operasyon e-postası, `leads.*` izinleri | oksis-api |
| 2 | Platform › Talepler: liste, detay, aşama geçişi, not/temas kaydı, sorumlu | oksis-ui |
| 3 | Dönüşüm: talepten önceden dolu okul açılışı, pilot (bitiş tarihi, askı/arşiv akışı) | oksis-api + oksis-ui |
| 4 | Hangfire kuralları (SLA, ulaşılamadı, pilot, yeniden temas, 24 ay anonimleştirme) | oksis-api |
| 5 | Pano: huni, CTA/kanal dönüşümü, kayıp nedenleri | oksis-api + oksis-ui |
| 6 | Landing formunu prod API'ye çevirme + birikmiş e-posta taleplerinin aktarımı | oksis-web |
