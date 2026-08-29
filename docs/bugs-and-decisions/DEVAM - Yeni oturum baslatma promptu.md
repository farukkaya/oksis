# DEVAM — Yeni oturum başlatma promptu (seyir defteri)

> Bu dosya, işi **yeni bir oturumda** kaldığı yerden sürdürmek için tutulur.
> Aşağıdaki bloğu olduğu gibi kopyalayıp yapıştırın.
> Son güncelleme: **2026-08-29** · Son tur: OS push zinciri uçtan uca (`TB-90`…`TB-95`)

---

## Kopyalanacak prompt

```
OKSİS'te kaldığım yerden devam et.

HEDEF
Pilot başarı ölçütlerinin dördünü de ekranda ölçülebilir hâle getirmek.
Üçü tamam (yoklama · not yayını + veli bildirimi · doğru anda push);
dördüncüsü — canlı yönetim paneli — henüz hiç yazılmadı.

ÇALIŞMA KURALLARI (ölçümle kanıtlandı, uy)
1. Yamalama kabul değil. Aynı hata birden çok ekranda varsa merkezî çöz.
2. Teşhisini ölçüm çürütürse teşhisi değiştir, ölçümü değil.
3. "Testler yeşil ama gerçek çağrı bozuk" deseni tekrar ediyor (X-06, X-07,
   TB-95) — testin kolay yolu değil, gerçek yolu koşturduğundan emin ol.
4. Kapsam kararı (özellik yazmak, menü budamak) benim değil kullanıcının.
   Böyle bir engelde ENG-## dosyası yaz, defterden linkle, tura devam et.
5. Kod yorumlarına "ne yaptığını" değil "neden ve neyi ölçerek" yazdığını yaz.
6. Push'ları kendin yönetebilirsin (kullanıcı bu yetkiyi verdi). Üç depo da master.
7. Kullanıcıya dönük her açıklama Türkçe.
8. Sır hiçbir zaman appsettings/test/log/commit/sohbete girmez — yalnız ortam
   değişkeni. Dosya doğrularken içeriği YAZDIRMA, yapı kontrolü yap (bkz. TB-91).

ORTAM
- API: cd ~/Repositories/oksis-api && export PATH="$HOME/.dotnet:$PATH" &&
  dotnet run --project src/Oksis.Api   → http://localhost:5112
  (dotnet PATH'te DEĞİL, her oturumda export gerekiyor)
- Web: cd ~/Repositories/oksis-ui/apps/web && npm run dev → http://localhost:3000
- Altyapı ayakta: oksis-mssql (sa / YourStrong!Pass2025, db oksis_dev), redis,
  garage, clamav, mailpit
- Seed hesapları okul indeksi 1'den başlar (s0 YOK): mudur.s1@oksis.local,
  ogretmen.s2.01@…, ogrenci.s2.001@…, veli.s2.006@… — parola hepsinde Oksis1234!
- Dört okul da yürürlükte 2026-2027 sezonunda. s4 = OKSİS Test Lisesi.
- ⚠️ Push için iki ortam değişkeni ZORUNLU, ikisi de dosyada değil:
  `Firebase__ServiceAccountJson` (hizmet hesabı anahtarı) ve
  `Email__Smtp__Password`. appsettings'te ikisi de yer tutucu.
- ⚠️ Migration'ı uygulamayı unutma: `event_id` kolonu eklendiğinde dev DB
  güncellenmediği için bildirim zinciri SESSİZCE düşmüştü. Şema değişince
  `dotnet ef database update`.
- ⚠️ DERS PROGRAMI DÖNEM TUZAĞI: seed'lenmiş programların çoğu ARŞİV dönemlere
  ait; bugünü kapsayan dönemde yayın yoksa ekran doğru olarak "yayınlanmadı" der.
  Dolu ekran için `academic.schedule_versions` × `academic_terms` ile BAK.
- ⚠️ s3'te İKİ tane 1-A var: yürürlükteki sezonunki 0 öğrencili, dolu olan arşivde.
- Ekran testi: web için Playwright MCP. Mobil için Expo web hedefi (mock'lu) —
  cihaz beklemeden gezilir.
- Cihaz testi: Android Redmi Note 9 (205f65af0409) çalışıyor. USB'de `adb reverse`
  + `localhost` kullan, LAN IP'sine güvenme. iOS imza profili 24 Ağustos'ta doldu
  ve Apple geliştirici hesabı hâlâ yok → iOS push ölçülemez.
- ⚠️ "Uygulama kapalı" simülasyonu `am force-stop` DEĞİL: o hâl FCM teslimini
  tamamen engeller. Doğrusu HOME + `am kill`.
- Şema adları koddaki modül adlarıyla birebir değil; tablo ararken
  INFORMATION_SCHEMA'ya bak, tahmin etme.

SIRADAKİ İŞLER (öncelik sırasıyla — gerekçeler aşağıda)
1. Yönetim paneli agregasyonu (Dashboard) — pilot ölçütü, sıfır kod.
2. Karne / not belgesi PDF — not modülü bitmiş veriyi zaten üretiyor.
3. Ödev modülü uçtan uca ekran testi — üç yüz de yazıldı, hiç ölçülmedi.
4. Mesajlaşma modülü — sıfır kod, kendi karar turunu ister.
5. Yedekleme / geri yükleme betiği + pilot hazırlık artıkları.

Başlamadan önce defteri oku ve bana kısa bir plan ver.
```

---

## Nerede duruyoruz (2026-08-29)

### Pilot başarı ölçütleri

| Ölçüt | Durum | Kanıt |
|---|---|---|
| Yoklama alınabiliyor | ✅ | uçtan uca ekran testi §12 |
| Not yayını + veli bildirimi | ✅ | uçtan uca test §24 |
| Bildirim doğru anda düşüyor | ✅ **Android'de** | gerçek cihaz, arka plan + soğuk açılış |
| Canlı yönetim paneli | ❌ | modül hiç yazılmadı |

Push ölçütü Android'de kapandı ama **iOS'ta ölçülemez**: Apple geliştirici hesabı
yok. `K-02` FCM'i her iki platforma karar verdi; APNs ayağı hesap alınana kadar
açık kalır ve bu bir kod işi değil, satın alma işi.

### Son turun bıraktığı hat

OS push zinciri uçtan uca çalışıyor: cihaz kaydı → tercih kapıları → sessiz saat
→ FCM teslimi → dokunuş → derin bağlantı → in-app satırı okundu. Aynı turda beş
bulgu deftere işlendi: `TB-90` (Android derlemesi elde kalmış klasöre yaslanıyordu),
`TB-91` (SMTP parolası git geçmişinde düz metin — döndürüldü), `TB-93` (sözleşme
enum'u telde sayı ilan ediyordu), `TB-94` (kapalı uygulamada dokunuş hiçbir yere
gitmiyordu), `TB-95` (bildirim kuyruğu hiçbir ortamda Hangfire'a bağlı değildi).

`TB-95` turun en pahalı bulgusuydu: bir yorum kablolamayı anlatıyordu, kablolama
yoktu, ve in-process fallback her iki hâlde de "çalışan" bir sistem ürettiği için
fark ne derleyiciye ne teste görünüyordu.

### Depoların hâli

| Depo | Commit | Durum |
|---|---|---|
| `oksis-api` | `a0bd4d8` | master, temiz, origin ile eşit |
| `oksis-ui` | `1fec5aa` | master, temiz, origin ile eşit |
| `oksis` | `a02750c` | master, temiz (bu güncelleme hariç) |

Backend paketi 4141/4141 geçiyor. Yerel dallar temizlendi; uzakta yalnız
`origin/claude/oksis-school-clubs-mvp-nxfhc4` duruyor (tek doküman commit'i,
`8f4bd81`, kullanıcı kararı bekliyor).

---

## Sıradaki işler — gerekçeleriyle

**1. Yönetim paneli agregasyonu.** Dört pilot ölçütünden kapanmayan tek madde.
`Oksis.Application/Modules/Dashboard` sadece "HENÜZ YAZILMADI" README'si; web
tarafı `dashboard-static.ts` yer tutucularıyla çiziliyor. `K-09` bu hâle "Örnek
veri" rozeti kararı vermişti — rozet bir çözüm değil, bir itiraf. Müdürün ilk
gördüğü ekran budur ve şu anda uydurma sayı gösteriyor.

**2. Karne / not belgesi PDF.** Sprint 3'ün açık kalemi. Not modülü §24'te uçtan
uca ölçüldü ve veriyi zaten üretiyor; karne bitmiş verinin üstüne oturur. Emek
başına getirisi en yüksek kalem.

**3. Ödev modülü uçtan uca ekran testi.** Öğretmen, öğrenci/veli ve yönetici
yüzlerinin üçü de web ve mobilde yazıldı — ama modül hiç uçtan uca gezilmedi.
Not modülünde aynı sıra (§24) on bulgu çıkarmıştı; ödevde de çıkacağını
varsaymak makul. Yeni modül yazmadan önce yazılmışı ölçmek daha ucuz.

**4. Mesajlaşma.** Sprint 3'ün en büyük boşluğu: sıfır entity, sıfır handler.
Kendi karar turunu ister (izin matrisi, KVKK sınırları, bildirim matrisi
satırları) — doğrudan koda başlanacak bir iş değil. Ayrıca `TB-02` hâlâ açık:
bildirim uçlarının kalıcı mock'u yok.

**5. Yedekleme / geri yükleme betiği.** Sprint 4'ün açık tek maddesi.
`scripts/` altında yalnız `init-garage.sh` var. Küçük iş ama pilot öncesi
pazarlığa açık değil.

---

## Pilot öncesi kapanması gerekenler (kod dışı)

- **Gönderen adresi kişisel hesap.** Prod `appsettings.json` hâlâ
  `farukkaya03@hotmail.com.tr` adresini `Username`/`FromAddress` olarak taşıyor.
  Pilotta okullara buradan e-posta gitmemeli; `oksis.net` gönderen kimliği gerekiyor.
- **Apple geliştirici hesabı yok** → iOS derlemesi imzalanamıyor, APNs ayağı ölçülemiyor.
- **`X-11` push kapısında sır taraması yok.** `TB-91` tam olarak bu boşluktan
  geçmişti; kanca parolayı görmedi.

## Kullanıcıdan cevap bekleyen maddeler (bloklamıyor, paralel sor)

- `TB-76` 🔴 — yayın ekranındaki bildirim seçimi süs; bayraklar uca gidiyor,
  hiçbir kod okumuyor. **Ürün kararı:** bayrakları oku mu, kaldır mı?
- `TB-77` 🔴 — yayın önizlemesinde Students/Parents/ConflictCount sabit sıfır.
- `X-03` / `TB-48` — görevlendirme v1 ve v2 yan yana; v1'in yazma yüzeyi kapalı
  ama yedi tüketicisi hâlâ ona bağlı. Göç kararı gerekiyor.
- `TB-35` — devamsızlık eşiği iki ayrı ekranda tanımlanıyor, biri ölü.
- `B-19` (ölü düğme) · `B-20` (içe aktarmada davet üretilmiyor) · `E-01` (rıza
  yenileme ekranı — kapsam kararı).
- `K-03` (log stratejisi) · `K-04` (anaokulu gizleme sınırı) · `K-05` (web'de
  öğretmen duyuru detay yüzeyi).
- Uzaktaki `claude/oksis-school-clubs-mvp-nxfhc4` dalı: birleştir, bırak, sil?

---

## DEFTER KONVANSİYONLARI

- ID şeması: `B-##` fonksiyonel · `D-##` tasarım · `V-##` iş kuralı ·
  `X-##` çapraz kesen · `TB-##` teknik borç · `K-##` bekleyen karar ·
  `E-##` eksik özellik · `ENG-##` engel
- **Sıradaki boş ID:** `TB-96` · `X-18` · `B-43` · `D-17` · `V-04` · `E-20` · `ENG-03`
- Kapanan madde SİLİNMEZ — altına "✅ KAPANDI (repo @ commit, tarih)" + gerekçe
  eklenir. Ekran kanıtları `docs/bugs-and-decisions/kanit/` altına konur ve
  `![[dosya.png]]` ile gömülür.
- Commit formatı: `<type>(<scope>): türkçe açıklama` — sonda nokta yok, scope
  modül adı veya `repo`.
