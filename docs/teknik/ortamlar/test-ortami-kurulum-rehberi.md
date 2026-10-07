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
7. Bağlantı dizesi (VM'de sorulacak; şimdi sadece hazırlayın):

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

## Adım 6 — SMTP (sonra, acil değil)

Davet/şifre e-postaları için. Öneri: **Brevo** (günde 300 e-posta ücretsiz). Hesap açıp `oksis.net`
alan adını doğrulamak Cloudflare'e birkaç DNS kaydı eklemeyi gerektirir — Claude kayıtları birlikte girer.
