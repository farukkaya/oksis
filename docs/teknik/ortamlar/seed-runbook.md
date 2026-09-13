# Seed Runbook

> [!info] Belge bilgisi
> **Amaç:** Veritabanına hangi başlangıç verisinin, hangi mekanizmayla, **hangi ortamda, ne zaman ve hangi sırayla** yazıldığını tanımlamak. Lokasyon verisinin güncelleme prosedürünü de kapsar.
> **Son doğrulama:** 2026-09-13. `oksis-api` master `294ffe62`.
> **Kaynak:**
> - `oksis-api/README.md` § "Lokasyon (ülke / il / ilçe / mahalle) seed runbook" (bu belgeye taşındı).
> - `src/Oksis.Api/Program.cs`, `src/Oksis.Infrastructure/Persistence/Seed/{LocationSeeder, DevDataSeeder, IdentityDevSeeder, ClassRoomDevSeeder, TimetableDevSeeder}.cs`, `Seed/MasterData/*`, `Seed/Data/locations/*.csv`.
> - `tools/seed-locations/Generate-LocationCsvs.ps1`, `infra/scripts/seed_schools.sql`, `infra/scripts/identity-dev-seed.sql`, `scripts/init-garage.sh`.
> **Gizli bilgi:** Dev hesaplarının e-posta ve parolaları yazılmaz; seeder kaynağında tanımlıdır.

İlgili notlar: [[yerel-kurulum]] · [[ortamlar]] · Alan: [[Okul Yönetimi]] · [[Kimlik Doğrulama]]

---

## 1. Seed türleri: özet

| # | Tür | Mekanizma | Ortam | Ne zaman | Idempotent |
|---|---|---|---|---|---|
| 1 | **Master veri** (roller, yetkiler, sınıf seviyeleri, dersler, sınav türleri, not ölçekleri, resmî tatiller, bildirim türleri, KVKK onay paketleri, sistem ayarları…) | EF Core `HasData` → migration | Hepsi | `dotnet ef database update` ya da migration SQL'i uygulanınca | Evet (migration) |
| 2 | **Lokasyon** (ülke, il, ilçe, mahalle) | `LocationSeeder` + gömülü CSV | **Hepsi, prod dahil** | Her uygulama başlangıcında | Evet (var olan Id atlanır) |
| 3 | **Dev verisi** (okullar, okul ayarları, kadro, şubeler, zil çizelgesi, görevlendirmeler) | `DevDataSeeder` → `IdentityDevSeeder`, `ClassRoomDevSeeder`, `TimetableDevSeeder` | **Yalnız Development** | Her uygulama başlangıcında | Evet |
| 4 | Depolama ön koşulu (Garage layout + dev anahtarı) | `scripts/init-garage.sh` | Yerel | İlk kurulumda bir kez | Evet |
| — | `infra/scripts/seed_schools.sql`, `infra/scripts/identity-dev-seed.sql` | Elle SQL | — | **Çalıştırmayın** (§5) | — |

## 2. Master veri (migration ile)

- Kaynak: `src/Oksis.Infrastructure/Persistence/Seed/MasterData/*SeedData.cs`. Bu sınıflar `Persistence/Configurations/**` altında **17 entity yapılandırmasında** `builder.HasData(...)` ile modele gömülür.
- Sınıflar: `AcademicTermType`, `Branch`, `ConsentBundle`, `CurriculumHour`, `DutyLocationTemplate`, `ExamType`, `GradeLevel`, `GradeScale`, `NotificationEventType`, `OfficialHoliday`, `Permission`, `RolePermission`, `SubjectBranch`, `SubjectGradeLevel`, `Subject`, `SystemRole`, `SystemSetting`.
- Deterministik Guid üretimi `SeedGuid.cs` ve `MasterSeedIds.cs` ile yapılır. Bu yüzden aynı veri her ortamda aynı Id'yi alır.
- **Master veri değişikliği yeni bir migration demektir.** Önce `SeedData` sınıfı düzenlenir, sonra `dotnet ef migrations add <YYYYMMDD_ad> …` çalıştırılır.

## 3. Dev verisi (yalnız Development)

`Program.cs` → `app.Environment.IsDevelopment()` koşuluyla `DevDataSeeder.SeedAsync()` çağrılır.

| Adım | Ne yapar |
|---|---|
| `DevDataSeeder` | 4 dev okulunu ve her birinin `school_settings` kaydını **ADO.NET ile** yazar (tenant filtresini aşmak için), `IF NOT EXISTS` ile |
| `IdentityDevSeeder` | Her okul için Account/Person kadrosu (müdür, müdür yardımcısı, öğretmenler, öğrenciler, veliler, hem öğretmen hem veli olan çift profilli kişiler). EF Core üzerinden, tenant context okul başına sabitlenerek yazılır. **O okulda zaten hesap varsa okul atlanır.** |
| `ClassRoomDevSeeder` | Aktif sezona şube açar ve öğrencileri şubelere atar. Sınıf kademesi tanımsız okulu atlar. |
| `TimetableDevSeeder` | Zil çizelgesi ve öğretmen görevlendirmeleri (Ders Programı editörünün ön verisi) |

Dev okulları:

| Okul | Kod | Not |
|---|---|---|
| OKSİS Dev Okulu | `DEV-OKUL` | Sabit Id `97b8675e-52a0-4af1-af3c-8cca57df51d1`. Tarihî DEV okulu. |
| Atatürk Anadolu Lisesi | `ATA-AL` | Tam yapı |
| Cumhuriyet İlkokulu | `CUM-IO` | Tam yapı |
| OKSİS Test Lisesi | `TST-AL` | **Yapısı boş okul.** Kadro ve yürürlükteki sezon seed'lenir. Kademe, şube, zil çizelgesi ve görevlendirme seed'lenmez; kurulum sihirbazı ve ayar ekranlarını gerçekten boş bir okulda ölçmek içindir. |

- **Giriş hesapları:** e-posta kalıbı ve ortak dev parolası `IdentityDevSeeder.cs` içinde tanımlıdır. Bu belgeye yazılmaz.
- Dev verisini baştan üretmek için tanımlı bir "sıfırla" komutu yok. `IdentityDevSeeder` hesabı olan okulu atladığı için mevcut okulun kadrosu yeniden yazılmaz.
  - Seçenek: `docker compose down -v` ile volume'ları silmek. **Tüm yerel veriyi siler** (SQL, Redis, Garage, ClamAV imzaları). Ardından §6.1 sırası uygulanır.

## 4. Lokasyon verisi

Adres seçimi arayüzde zincirleme seçim kutularıyla yapılır. Veri `countries`, `provinces`, `districts`, `neighborhoods` tablolarından gelir. Bu tablolar **kiracıdan bağımsız master veridir**: tüm okullar paylaşır, nadiren değişir.

### 4.1 Bugünkü durum

| Dosya (`src/Oksis.Infrastructure/Persistence/Seed/Data/locations/`) | Satır (başlık hariç) |
|---|---|
| `countries.csv` | 5 |
| `provinces.csv` | 81 |
| `districts.csv` | 1010 |
| `neighborhoods.csv` | 32000 |

- CSV'ler `EmbeddedResource` olarak assembly'ye gömülür. Deploy sırasında ayrı dosya kopyalanmaz.
- `LocationSeeder` her başlangıçta CSV'leri okur, DB'deki Id'lerle karşılaştırır ve **yalnız eksik satırları** ekler. Seed süresince komut zaman aşımı 5 dakikaya çıkarılır.
- `districts.csv` ya da `neighborhoods.csv` yoksa uyarı loglanır ve o aşama atlanır. Uygulama yine çalışır; zincirin 3. ve 4. seviyesi boş gelir.

### 4.2 Idempotency sınırları

| İşlem | Sonuç |
|---|---|
| CSV'ye yeni satır eklemek | Sonraki başlangıçta yalnız o satır eklenir |
| Var olan satırın adını değiştirmek | `LocationSeeder` var olan Id'yi atlar, **güncellemez.** Ayrı bir migration ya da elle SQL gerekir. |
| CSV'den satır silmek | DB'den **silinmez.** Elle SQL gerekir. |

### 4.3 Veri setini yeniden üretme / güncelleme

**Yöntem A: PowerShell betiği (önerilen).** Betik bir kez çalıştırılır ve çıktı commit'lenir. Yeni sunucu kurulumunda tekrar çalıştırmaya gerek yoktur, çünkü CSV'ler assembly içindedir.

```powershell
cd ~/Repositories/oksis-api
pwsh ./tools/seed-locations/Generate-LocationCsvs.ps1 `
    -SourceUrl '<kaynak JSON URL>' `
    -SourceFormat Hierarchical
```

| Parametre | Değerler |
|---|---|
| `-SourceUrl` **veya** `-SourceFile` | Uzak JSON **ya da** yerel dosya (yerel CSV `Ptt` formatı içindir, UTF-8) |
| `-SourceFormat` (zorunlu) | `Hierarchical` (il → ilçeler → mahalleler), `Flat` (satır başına il/ilçe/mahalle/pk), `Ptt` |
| `-OutputDir` | Varsayılan `src/Oksis.Infrastructure/Persistence/Seed/Data/locations` |

Betik şunları yapar:

- `provinces.csv`'yi okur ve il adından Id'ye bir eşleme kurar.
- Kaynağı indirir ve ayrıştırır.
- Deterministik Guid üretir: ilçeler `00000003-…`, mahalleler `00000004-…`. Aynı veri tekrar işlenirse aynı Id çıkar ve FK'ler kırılmaz.
- `districts.csv` ve `neighborhoods.csv` dosyalarını yazar.

**Kaynak lisansı mutlaka doğrulanır. GPL kaynaklar OKSİS'e uygun değildir.** README'de önerilen kaynaklar:

| Kaynak | Format | Lisans |
|---|---|---|
| github.com/ferdiozer/turkey-city-regions | Flat | belirsiz |
| github.com/ramdemi/TurkeyGeolocationRestApi | Hierarchical | MIT |
| PTT `pk_list.zip` | XLSX (`Ptt` akışı / elle dönüşüm) | resmî |

**Yöntem B: elle CSV.** Aynı klasöre, UTF-8 (BOM'suz) olarak yazılır. CRLF ya da LF fark etmez.

```
districts.csv      → Id,ProvinceId,Name
neighborhoods.csv  → Id,DistrictId,Name,PostalCode
```

Kurallar:

- Id alanları benzersiz Guid'dir ve deterministik bir kalıpla üretilir; aynı CSV iki ortamda aynı Id'yi vermelidir.
- `ProvinceId` / `DistrictId` var olan bir üst kayda işaret etmelidir. Geçersiz üst kayıt FK ihlaline yol açar.
- Türkçe karakterler (`İ Ğ Ş Ç Ö Ü`) korunur.

**Her iki yöntemden sonra:**

```bash
dotnet build                                   # CSV'lerin gömüldüğünü doğrula
dotnet run --project src/Oksis.Api             # log: "Seeded N new districts/neighborhoods"
git add src/Oksis.Infrastructure/Persistence/Seed/Data/locations/*.csv
```

Commit biçimi `teknik/kurallar/ortak/` altındaki commit kurallarına uyar.

### 4.4 Doğrulama

Lokasyon uçları `[Authorize]`'dır. Geçerli bir Bearer token gerekir (dev hesabıyla `POST /api/v1/auth/account/login`).

```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:5112/api/v1/locations/countries
# 5 ülke (Türkiye DisplayOrder=0)

curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5112/api/v1/locations/provinces?countryId=00000001-0001-0001-0001-000000000001"
# 81 il
```

İlk istek Redis önbelleğini ısıtır (24 saat).

### 4.5 Sorun giderme

| Belirti | Neden / çözüm |
|---|---|
| Startup'ta "`districts.csv` embedded resource bulunamadı" uyarısı | CSV repoda yok. §4.3'ü uygulayın. |
| `LocationSeeder` `Province not found` hatası | Kaynaktaki il adı `provinces.csv`'deki adla uyuşmuyor (örnek "KAHRAMANMARAŞ" / "Kahramanmaraş"). Betik normalize eder; uç durumlarda elle düzeltme gerekir. |
| Migration `Cannot drop column 'address_street'` | Elle yazılmış migration; Designer/Snapshot bayat olabilir. Derleme sonrası `dotnet ef migrations script` ile durumu tazeleyin. |
| Arayüzde seçim kutusu boş | İstekte `Authorization` başlığı eksik (uçlar `[Authorize]`) |

## 5. Elle SQL betikleri: BAYAT, çalıştırmayın

| Dosya | Durum (2026-09-13, `OksisDbContextModelSnapshot` ile karşılaştırıldı) |
|---|---|
| `infra/scripts/identity-dev-seed.sql` (2026-09-13'te `docs/seed/`'den taşındı) | Eski `users` tablosuna yazıyor. Güncel modelde bu tablo yok; kimlik `identity.accounts` ve `identity.persons` tablolarında. `IdentityDevSeeder` yorumu da "eski `[identity].[users]` artık seed edilmez" diyor. |
| `infra/scripts/seed_schools.sql` | `schools` ve `school_settings` tablolarına şema öneki olmadan yazıyor (güncel şema `school`). Kullandığı `school_settings` kolonlarının bir kısmı modelde yok (örnek `tax_number`, `address_city`, `theme_primary_color`, `school_type`, `timezone`). Okul Id'leri `DevDataSeeder`'daki okullarla eşleşmiyor. |

Tek geçerli dev verisi yolu §3'teki C# seeder'lardır. Bu iki dosyanın silinmesi ya da güncellenmesi: {{TBD}}.

## 6. Çalıştırma sırası

### 6.1 Yerel, sıfırdan

1. `docker compose up -d` → servisler healthy olana kadar beklenir.
2. `./scripts/init-garage.sh` (yalnız ilk kez).
3. `dotnet ef database update --project src/Oksis.Infrastructure --startup-project src/Oksis.Api` → şema ve **master veri**.
4. `dotnet run --project src/Oksis.Api` (Development). Başlangıç sırası: Hangfire periyodik işleri → **LocationSeeder** → **DevDataSeeder** (okullar → kadro → şubeler → zil/görevlendirme).
5. §4.4 doğrulaması ve dev hesabıyla giriş.

### 6.2 Yeni sunucu / paylaşılan ortam

1. Migration SQL'i üretilir ve uygulanır. **Prod'da otomatik migration yoktur.**

   ```bash
   dotnet ef migrations script <from> <to> -o m.sql --idempotent \
     --project src/Oksis.Infrastructure --startup-project src/Oksis.Api
   ```

2. Uygulama başlatılır. `LocationSeeder` otomatik çalışır. `DevDataSeeder` Development dışında **çalışmaz**.
3. İlk okulun (tenant), SuperAdmin hesabının ve okul yöneticisinin nasıl oluşturulacağı kodda tanımlı bir runbook olarak yok: {{TBD}}.

### 6.3 Yeni migration geldiğinde (yerel)

1. `dotnet ef database update …`
2. API yeniden başlatılır. Seeder'lar idempotenttir, yeni eksikleri tamamlar.
