# Test Ortamı Kurulum Rehberi (kullanıcı adımları)

> [[oksis-ortam-ve-hosting-plani]] Dilim D + Dilim S'in 👤 adımları, sırasıyla. Her adımın sonunda
> "bitti" denince Claude bir sonrakine geçer / doğrular. Panel menü adları zamanla değişebilir;
> takılınca ekran görüntüsü yeter.

**Sıra neden böyle:** DNS taşıması 1–24 saat yayılır, onu en başta başlatırız; beklerken Oracle ve
Azure hesapları açılır. Azure güvenlik duvarı VM'in IP'sini ister, o yüzden Oracle Azure'dan önce.

---

## Adım 0 — SSH anahtarı (Mac'te, 1 dk)

Bu Mac'te hiç SSH anahtarı yok. Terminalde:

```bash
ssh-keygen -t ed25519 -C "oksis-test" -f ~/.ssh/oksis_test
cat ~/.ssh/oksis_test.pub      # çıkan TEK satırı Oracle'a yapıştıracağız
```

Parola (passphrase) sorarsa bir parola verin; Mac anahtar zincirine kaydedilir.

---

## Adım 1 — Cloudflare'e DNS taşıma (≈15 dk + bekleme)

**Bugünkü durum (2026-10-07 ölçümü):** `oksis.net` alan adı **Nics Telekom** (isimtescil/Natro)
üzerinden kayıtlı; DNS **Vercel**'de (`ns1/ns2.vercel-dns.com`). Canlı adresler: `oksis.net` (200),
`www.oksis.net` (→ oksis.net), `brand.oksis.net` (200) — üçü de Vercel projesi. MX (e-posta) kaydı yok.

1. <https://dash.cloudflare.com/sign-up> → hesap aç (Free).
2. **Add a domain** → `oksis.net` → **Free** planı seç.
3. Cloudflare kayıtları otomatik tarar. Listede şu üçü **mutlaka** olsun, yoksa elle ekleyin; hepsinin
   bulut simgesi **gri (DNS only)** olmalı — turuncu olursa Vercel SSL sertifikası yenileyemez:

   | Type | Name | Target |
   |---|---|---|
   | `A` | `@` | `76.76.21.21` |
   | `CNAME` | `www` | `cname.vercel-dns.com` |
   | `CNAME` | `brand` | `cname.vercel-dns.com` |

   Taramanın getirdiği başka `A`/`CNAME`/`*` kayıtlarını silin (Vercel'in otomatik kayıtlarıdır).
4. Cloudflare iki nameserver verir (ör. `xxx.ns.cloudflare.com`). Not alın.
5. **Nics/isimtescil paneli** → Alan adlarım → `oksis.net` → **Nameserver / DNS sunucuları** →
   Vercel'in ikisini silip Cloudflare'in ikisini yazın → kaydet.
6. Cloudflare'de **SSL/TLS → Overview → Full (strict)**.
7. Bekleyin: Cloudflare "Active" e-postası gelir (genelde 1 saat içinde, en fazla 24 saat).
   Claude'a "DNS aktif" deyin — üç adresin hâlâ açıldığını ölçer.

> Kısa kesinti kabul (kullanıcı, 2026-10-07): kayıtlar eksik kalırsa adresler geçişte birkaç saat
> açılmayabilir, sonra düzeltilir. Vercel tarafında hiçbir şey silinmez; domain projelerde kalır, yalnız DNS'i artık Cloudflare verir.

---

## Adım 2 — Oracle Cloud VM (≈30 dk)

1. <https://signup.cloud.oracle.com> → **Home Region: Germany Central (Frankfurt)**.
   ⚠️ Ana bölge sonradan değiştirilemez. Kredi kartı doğrulama için istenir, ücret alınmaz.
2. Giriş → **Compute → Instances → Create instance**:
   - Name: `oksis-test`
   - Image: **Canonical Ubuntu 24.04** (aarch64 olanı otomatik gelir)
   - Shape → **Ampere → VM.Standard.A1.Flex**, **2 OCPU, 12 GB** ("Always Free-eligible" etiketi görünmeli)
   - Networking: varsayılan VCN, **Assign a public IPv4 address: açık**
   - SSH keys → **Paste public keys** → Adım 0'daki `.pub` satırı
   - Boot volume: varsayılan (≈47 GB) yeterli
3. **"Out of capacity"** hatası Frankfurt'ta sık görülür. Çözüm: birkaç saat sonra tekrar deneyin ya da
   hesabı **Pay As You Go**'ya yükseltin (Always Free sınırında kaldıkça ücret yok; kapasite önceliği
   artar). Yükseltmeden önce Claude'a sorun.
4. Instance "Running" olunca **Public IP**'yi not alın ve Claude'a verin.
   ⚠️ Sihirbazın verdiği IP **ephemeral**'dır (VM yeniden kurulunca değişir) ve OCI onu reserved'a
   **çeviremez**. Kalıcı IP için: Networking → IP management → **Reserved public IPs → Reserve**; sonra
   VNIC → IP administration → `⋯` → Edit → önce *No public IP* → Update, tekrar Edit → *Reserved public IP*.
   IP değişirse güncellenecekler: Azure SQL firewall, GitHub `TEST_VM_HOST` + `TEST_VM_KNOWN_HOSTS`.
   (08.10.2026: `oksis-test-ip` = `138.2.159.102`.)
5. Bağlantı denemesi (Mac): `ssh -i ~/.ssh/oksis_test ubuntu@<IP>`

---

## Adım 3 — Azure SQL (Free Offer) (≈20 dk)

1. <https://azure.microsoft.com/free> → hesap aç (kart doğrulaması; ücret yok).
2. Portal → **Azure SQL** → **Create** → **SQL databases / Single database** → sayfanın üstündeki
   **"Want to try Azure SQL Database for free?" → Apply offer**.
3. Basics:
   - Resource group: **yeni** `oksis-test-rg`
   - Database name: `oksis-test`
   - Server: **Create new** → ad ör. `oksis-test-sql` (dünya çapında benzersiz olmalı), bölge
     **Germany West Central**, kimlik doğrulama **Use SQL authentication** → yönetici adı + güçlü
     parola (parolayı bir yere kaydedin)
   - **Behavior when free limit reached: Auto-pause the database until next month**
4. Networking: **Public endpoint**; "Allow Azure services…" **No**; "Add current client IP" **No**.
5. Create → bitince sunucu sayfası → **Security → Networking → Firewall rules → Add** →
   ad `oksis-test-vm`, başlangıç ve bitiş IP = Adım 2'deki VM IP'si → **Save**.
6. Alarm: veritabanı sayfası → **Free offer** kartı / **Alerts → Create** → "Free amount remaining"
   < 10.000 → e-posta.
7. Bağlantı dizesi VM'de `sudo /opt/oksis/test/scripts/baglanti-yaz.sh` ile yazılır — yalnız parolayı sorar
   (şablonu elle düzenlemek 2026-10-08'de `PAROLA` kelimesinin olduğu gibi kalmasına yol açtı). Dizenin biçimi:

   ```
   Server=tcp:<sunucu-adı>.database.windows.net,1433;Initial Catalog=oksis-test;User ID=<yönetici>;Password=<parola>;Encrypt=True;TrustServerCertificate=False;Connection Timeout=60;
   ```

---

## Adım 4 — Cloudflare Tunnel (≈10 dk, Adım 1 "Active" olduktan sonra)

1. Cloudflare → **Zero Trust** (ilk girişte takım adı ister, Free plan seçin; kart isteyebilir, ücret yok).
2. **Networks → Tunnels → Create a tunnel → Cloudflared** → ad `oksis-test`.
3. Ortam olarak **Docker** seçin; gösterilen komuttaki `--token` sonrasındaki uzun metin **token**'dır.
   Kopyalayın (Claude'a yazmayın; VM'de gizli sorulacak). Konteyneri çalıştırmayın — compose çalıştıracak.
4. **Public Hostname** (ya da "Published application routes") ekleyin:

   | Subdomain | Domain | Type | URL |
   |---|---|---|---|
   | `api-test` | `oksis.net` | HTTP | `api-test:8080` |
   | `s3-test` | `oksis.net` | HTTP | `garage:3900` |

   "Additional settings → HTTP Host Header" **boş kalsın** (dosya adresi imzası ona bağlı).

---

## Adım 5 — VM kurulumu (≈15 dk, Mac terminalinden)

```bash
cd ~/Repositories/oksis-api
scp -i ~/.ssh/oksis_test -r infra/test ubuntu@<IP>:/tmp/oksis-test
ssh -i ~/.ssh/oksis_test ubuntu@<IP>

# VM içinde:
sudo /tmp/oksis-test/scripts/vm-kurulum.sh
sudo /opt/oksis/test/scripts/anahtar-uret.sh <platform-yonetici-eposta>
#   → Azure bağlantı dizesini ve tunnel token'ını sorar (ekranda görünmez)
cd /opt/oksis/test
sudo -u oksis docker compose up -d redis garage clamav seq
sudo ./scripts/garage-ilk-kurulum.sh
```

API konteyneri **Dilim C**'de (imaj + göçler) başlatılır. İlk platform yönetici parolası:
`sudo cat /opt/oksis/test/secrets/api/PlatformBootstrap__Password`.

Bitince Claude'a "VM hazır" deyin; çıktıyı birlikte kontrol ederiz.

---

## Adım 6 — E-posta (08.10.2026: Mailpit)

Test'te gerçek gönderim **yok**: tüm e-postalar VM'deki Mailpit'te yakalanır, arayüz
<https://mail-test.oksis.net> (Cloudflare Access arkasında). Gerçek sağlayıcı (Brevo / OCI Email Delivery,
SPF/DKIM ile) prod açılışında. Şifre sıfırlama denerken istekte `schoolHint` olmalı — yoksa API sessizce
e-posta göndermez.

---

## Adım 7 — Mobil "Oksis Test" (08.10.2026)

Kimlik `com.oksis.mobile.test` ("Oksis Test"), API `https://api-test.oksis.net`, dev uygulamasıyla aynı
telefonda yan yana durur. Dağıtım: **TestFlight** iç grup "Oksis Test Ekibi" + **Play** iç test listesi
`oksis-test-ekibi` ("farukkaya" geliştirici hesabı). Push: oksis-dev Firebase projesinde "Oksis Test"
uygulamaları; iOS için APNs anahtarı (`7M8HLMT92S`, takım `26QMTVX47Z`) test uygulamasına ayrıca yüklü.

**Yeni sürüm** (`oksis-ui/apps/mobile` içinde; derleme numarası commit sayısıdır, aynı commit'ten ikinci
yükleme için `BUILD_NUMBER=<daha büyük>` ver):

```bash
./scripts/build-test.sh ios       # arşivler + App Store Connect'e yükler → 5-15 dk sonra TestFlight'ta
./scripts/build-test.sh android   # imzalı AAB → build/test/oksis-test-<no>.aab
npx expo prebuild --clean         # dev'e dön: ios/ ve android/ test kimliğiyle ezilmişti
```

Android AAB'yi Play Console → Oksis Test → Test etme → **Dahili test → Yeni sürüm oluştur** sayfasına
sürükleyip **Kaydet ve yayınla** (incelemesiz, dakikalar içinde gelir).

**Ön koşullar / tuzaklar:**
- **Android Play yüklemesi otomatik (2026-10-09):** `build-test.sh android`, `~/.oksis/play-upload.json` varsa AAB'yi
  `scripts/play-upload.js` ile iç test kanalına yükleyip yayınlar. Kimlik: Google Cloud `oksis-dev` projesinde
  `oksis-play-upload` hizmet hesabı (projede rolü yok; Google Play Android Developer API açık), Play Console'da yalnız
  Oksis Test için "Release to testing tracks" + salt okuma izni. Denetim: `node scripts/play-upload.js --check`.
  Anahtar kaybolursa Cloud → hizmet hesabı → Keys'ten yenisi üretilir, eskisi silinir.
- Android yükleme anahtarı depoda değil: `~/.oksis/android-upload.jks` + `android-upload.env` — **yedekli
  tutun**; kaybolursa Play Console → Uygulama bütünlüğü'nden sıfırlatılır (birkaç gün).
- iOS arşivi "No profiles … Unable to log in" ile durursa: Xcode → Settings → Accounts → yeniden giriş.
- iOS **yükleme** adımı `exportArchive Failed to Use Accounts` ile durursa (arşiv başarılı, yükleme değil): Xcode'da
  Apple hesabı yok/oturum düşmüş — Xcode → Settings → Accounts → giriş; sonra yalnız yükleme adımı yeniden koşulur
  (`xcodebuild -exportArchive -archivePath build/test/OksisTest.xcarchive -exportOptionsPlist build/test/ExportOptions.plist
  -exportPath build/test/export -allowProvisioningUpdates`), yeniden derleme gerekmez (2026-10-09).
- `AuthKey_7M8HLMT92S.p8` **APNs (push) anahtarıdır**, App Store Connect'e yükleme yapamaz. Xcode oturumu olmadan yükleme
  için App Store Connect → Users and Access → Integrations → **App Store Connect API** anahtarı (`.p8` + Key ID + Issuer ID)
  gerekir. **Kuruldu (2026-10-09):** Admin rollü anahtar `~/.oksis/` altında; `build-test.sh` `~/.oksis/asc-api.env`
  (`ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_KEY_PATH`) varsa arşiv ve yükleme adımlarında bu anahtarı kullanır — Xcode'da hesap
  girişi gerekmez. Rol **Admin** olmalı: App Manager anahtarı yükleyebilir ama bulut dağıtım sertifikası oluşturamaz
  ("Cloud signing permission error"). Elle yükleme: yukarıdaki komuta `-authenticationKeyPath/-authenticationKeyID/
  -authenticationKeyIssuerID` eklenir.
- Yeni iOS test kullanıcısı: App Store Connect → Users and Access → `+` (yalnız Oksis Test erişimi, en kısıtlı
  rol) → davet kabul edilince TestFlight → Oksis Test Ekibi → Testers `+`.
- Yeni Android test kullanıcısı: Play Console → Dahili test → Test kullanıcıları → `oksis-test-ekibi`
  listesine e-posta; katılım bağlantısını paylaş. Hesaptaki `testers` listesi AntrePlan'ındır, kullanmayın.
- Test'te Altınay'ın **gerçek verisi** var: test kullanıcısı eklemek o veriye erişim vermektir.
