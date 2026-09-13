# Mobil prototip — tuzak haritası

Kaynak: Claude Design projesi **"Oksis Layout v2"**
`7d876f6c-70ee-4894-bac1-2be5c96dd34a`, `mobile/` ağacı.

> **Klasör adları 2026-08-04'te değişti:** `oksis-redesign/` = **`mobile/`** ·
> `shell_skeleton/` = **`web/`**. Repodaki eski köken yorumları
> (`Kaynak: shell_skeleton/excuse.css`) bu eşlemeyle okunur.

## Bu dosya ne DEĞİL

Artık **ekran → bileşen → dosya tablosu tutmuyor.** O iş projenin kökündeki
**`manifest.json`**'a devredildi: her ekran için `id`, `domain`, `roles`,
`component`, `file`, `status`, `stateKey`, `states`, `target`. Tablo iki yerde
tutulunca biri sessizce eskiyordu — bu dosyanın eski hâli tam olarak öyle
eskimişti.

Burada yalnız **manifest'in ifade edemediği şeyler** var: hangi dosyanın
aldatıcı olduğu, hangi kuralın render sırasında bozulduğu, neyin üretime
taşınmayacağı.

Manifest de bir **önbellek**, kanıt değil. Tek kanıt `mobile/proto-app.jsx`
içindeki `protoScreens()` kaydıdır; çelişkide registry kazanır.

## Neden bu dosya var

Bu projede **klasörde duran dosya ≠ canlı tasarım.** 2026-07-20'de login ekranı
silinmiş bir nesilden (V2 İmza Gradyan) portlandı ve baştan yazıldı. Aynı hata
davet ekranında tekrarlandı. Adla, README ile veya "hangisi doğru görünüyor" ile
dosya seçmek bu projede iki kez yanlış sonuç verdi.

## Ad tuzakları (manifest doğru söyler, isim yanıltır)

| Görünen | Gerçek |
| --- | --- |
| `auth-web-flow.jsx` "web gibi duruyor" | **Mobil** tasarımdır — başlık yorumu: "OKSİS Mobil — 'Web Akışı' auth varyantı" |
| Splash `proto-screens.jsx`'te sanılır | `SplashContent` **`app-icon.jsx`**'tedir |
| `"inlineInRegistry": true` satırları | Ekranın **kendi dosyası yok**; gövdesi `proto-app.jsx` içinde |
| `status: "placeholder"` | "Yakında" yer tutucusu — **bitmiş tasarım değil**, dur ve sor |

## Ölü / silinmiş dosyalar

| Dosya | Durum |
| --- | --- |
| `invite-accept.jsx` | **2026-08-04'te silindi.** Ölü V2 davet tasarımıydı; gerçek davet `InviteWizardWeb` (`auth-web-flow.jsx`) |
| `dashboard-mock.jsx` | **2026-08-04'te silindi.** Dört rol anasayfası (`admin/teacher/parent/student-home.jsx`) ikame etti |
| `login.jsx` | 2026-07-20'de silindi (V1–V6 palet varyantları) |
| `invite-expired.jsx` | **Hiç var olmadı.** Süresi dolmuş davet, sihirbazın önizleme senaryosudur |
| `oksis-web/` ağacı | **2026-08-04'te silindi.** Vite+shadcn scaffold'du, hiçbir zaman kaynak değildi |

**Dosya içinde ölü kod** (dosya canlı, parça değil):

- `tab-bar.jsx` → `TabBarClassic`, `TabBarFloating` kullanılmıyor.
  `proto-app.jsx`'te `const TabBar = TabBarIndicator` ile sabitlenmiş —
  **canlı stil M3 Indicator.** (2026-08-04 doğrulandı.)
- `proto-screens.jsx` → `ProtoPortalSelect` artık hiçbir ekranda render
  edilmiyor. Rol seçimi gerçekte API'nin `needsProfileSelection` yanıtına bağlı
  ve Login'in çoklu-profil senaryosuyla karşılanıyor (`LoginV7WebFlow`,
  `scenario: 'multi'`). (2026-08-04 doğrulandı.)
- `school-info.jsx` → birden fazla varyasyon içerir; canlı olan V1.

## Sekme seti — iki kaynak var, karıştırma

*(2026-08-01 turundan devralındı, 2026-08-04'te yeniden doğrulanmadı.)*

| Rol | Seti tanımlayan | Çubuğu çizen |
| --- | --- | --- |
| öğretmen / öğrenci / veli | `proto-app.jsx` · `protoTabs(role)` | `TabBarIndicator` |
| **yönetici** | **`admin-home.jsx` · `AH_HOME_TABS`** | `AdmTabBar` |

`protoTabs(admin)` yöneticide **ölü**: yalnız hotspot metin kurallarını besler ve
sırası render edilenden farklıdır. **Render edilen kazanır.**

Doğrulanmış setler (hepsi 5, sonuncusu "Daha fazla"): yönetici *Anasayfa ·
Duyurular · Okul · Raporlar* · öğretmen *Anasayfa · Yoklama · Notlar · Ödev* ·
öğrenci *Anasayfa · Devamsızlığım · Notlarım · Ödevlerim* · veli *Anasayfa ·
Devamsızlık · Notlar · Ödevler*. **Program sekmesi yok** (Daha fazla → Okul'a
indi), **Çocuklarım sekmesi yok** (çocuk seçici veli anasayfasının içinde).

## Header standardı

| Katman | Bileşen | Dosya |
| --- | --- | --- |
| Ana (sekme) ekran | **`OksisHomeHeader`** | `mobile/teacher-home.jsx` — dört rolde ortak; `THHeader`/`SHHeader`/`PHHeader`/`AHHeader` yalnız satır/baş harf/zil tonu geçirir |
| Alt (stack) ekran | **`STopBar`** | `mobile/settings.jsx` |

Rol başına 2. satır: öğretmen/veli `Salı, 15 Eylül 2026` · öğrenci `11-A · <tarih>`
· yönetici `Altınay Lisesi · 14:32`.

⚠️ Tasarımda **iki eski alt-header varyantı** duruyor ve `STopBar` ile çelişiyor:
`excuse-parent.jsx` (54/16/12, dairesiz 40×40 geri, 16.5/800) ve
`notifications-admin.jsx` `AdmTopBar`. **Kullanıcı kararı: standart `STopBar`**,
diğer ikisi ona hizalanır.

## Düzen tuzakları

⚠️ **"Daha fazla"dan açılan her ekran alt ekran DEĞİL.** `exc-parent-list`
(Mazeret Taleplerim) `ExcParentList`i `embedded` bayrağıyla çağırıp kendi
header'ını gizler, üstüne `ParentTopBlock` ve altına `PortalTabBar active="more"`
koyar. Port etmeden önce kaydın gerçekten hangi düzeni kurduğuna bak.

FAB: `ExcParentList` (56×56, r28, `0 8px 22px rgba(13,17,23,0.22)`, right 18 /
bottom 20) ve `adm-announcements` (60×60, bottom 104 — kapsayıcı tab bar'ı da
içerdiği için). Ekran boşken de durur.

Boş/"yakında" ekran kalıbı (`TeacherEmptyTab`/`StudentEmptyTab`/`AdminEmptyTab`):
56×56 daire (`#E9EEF7`) içinde `N_ICONS.lock` 24px, başlık 17/700, açıklama 14 ·
maxWidth 260.

## Üretime asla taşınmaz (prototip iskeleti)

`ios-frame.jsx` (cihaz çerçevesi), `tweaks-panel.jsx` (duyuruların `dyTheme`
açık/koyu anahtarı dahil — koyu palet bir tasarım keşfidir, teslim gereksinimi
DEĞİL; mobilde tema sistemi yok), sol sidebar + rol değiştirici, metin eşleşmeli
hotspot navigasyonu, `localStorage`'a yazılan ekran/rol durumu, ve **Portal
Seçimi ekranı**.

## Kapsam

Kapsamın tek beyanı **`manifest.json`**'dur: `status: "designed"` olan satırlar
tasarımı olan ekranlar, `"placeholder"` olanlar "yakında" stub'ları. Prose bir
kapsam listesi tutulmuyor — eskiyor.

Manifest'te hiç satırı olmayan modülün mobil tasarımı **yoktur**. Bunların
prototipi yalnız **web** içindir (`web/` ağacı; `nobet.jsx`, `program_*.jsx`,
`finans_*.jsx`, `ayarlar_*.jsx` gibi Türkçe adlı dosyalar). Web tasarımı mobil
ekran kaynağı **değildir** — farklı tuval (1440 vs 402), farklı etkileşim
modeli. Böyle bir modül istenirse **dur ve mobil tasarım iste.**

> Bildirim ailesi rol başına AYRI liste ekranı tanımlar (öğretmen aksiyon odaklı,
> yönetici severity/triyaj panosu, öğrenci sade). `apps/mobile`'daki mevcut
> `notif-list-screen.tsx` Faz 1'de rol-agnostik tek liste olarak portlanmıştı —
> bilinçli bir tekleştirme, rol varyantları Faz 3'ün konusu.

## Projedeki iki ağaç

| Ağaç | Ne | Mobil portu için |
| --- | --- | --- |
| `mobile/` | Mobil prototip (402×874) | ✅ Tek geçerli kaynak |
| `web/` | Web paneli prototipi (1440) | ❌ Web'in kaynağı (`handoff-web`) |

Paylaşılan ikili varlıklar `assets/` altındadır (`school-logo.png`) — iki yüzey
de oradan okur.

## Marka token'ları

Marka profili web ile **aynıdır**; önbellek [[marka-tokenlari]]
(kaynak: https://brand.oksis.net/brand/index.html). Mobil kod karşılıkları
`apps/mobile/src/theme/tokens.ts` içinde `COLORS` / `RADIUS` / `FONTS` /
`PORTAL_COLORS` / `SIGNATURE_GRADIENT` / `STATUS_TINTS`.

Mobile özgü iki ek:
- Login/davet hero'su radyal lacivert zemin kullanır:
  `radial-gradient(120% 120% at 15% 12%, #26407F, #1B2B5E 46%, #141F45)` — imza
  gradyanının yerine geçmez, yanında yaşar.
- `inkSoft #4A5375`, `inkSofter #8A92AE`, `border #DDE3F1` marka çekirdeğinde
  yoktur; laciverten türetilmiş nötrlerdir ve `tokens.ts`'te tanımlıdır.

**Tip ölçeği:** web'in 5 satırlık kapalı ölçeği Tailwind içindir ve mobile birebir
uymaz; mobil prototip 21/23/13.5/12.5 gibi değerler kullanır. Kural: boyut/ağırlık
**`theme/tokens.ts`'te merkezî** olmalı. Kapalı bir mobil tip ölçeği henüz
**kararlaştırılmadı** — yeni bir ekran yeni boyutlar getiriyorsa raporda belirt.
