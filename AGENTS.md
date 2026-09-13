# AGENTS.md

Bu dosya `oksis` deposunda çalışan Codex oturumlarına yol gösterir. `CLAUDE.md` aynı içeriği Claude Code için taşır — biri değişirse öteki de değişir.

## Bu depo nedir

`oksis`, OKSİS'in **belge merkezidir**. Kod barındırmaz. Obsidian ile görüntülenir; **vault kökü `docs/`**. Yeni oturumlar ve AI ajanları için OKSİS hakkında **birincil kaynaktır** — bir işe başlamadan önce `docs/_indeks.md`'den ilgili belgeye git.

**OKSİS:** Türk özel okulları için çok kiracılı (multi-tenant) SaaS okul yönetim sistemi. Satır düzeyi izolasyon `SchoolId` ile. Arayüz dili Türkçe (bugün i18n altyapısı yok; çoklu dil kapsam dışı). Domain dili ve commit mesajları Türkçe; kod identifier'ları İngilizce.

## Depolar

```
~/Repositories/
├── oksis/       belge merkezi (bu depo) — yalnız md
├── oksis-api/   .NET 10 backend — yalnız kod (Clean Architecture + CQRS, SQL Server, EF Core 10)
└── oksis-ui/    Turborepo monorepo — yalnız kod (apps/web Next.js, apps/mobile Expo, packages/*)
```

- `oksis-web` ve `oksis-mobile` emeklidir; yerlerini `oksis-ui` aldı.
- Kod repolarının kendi `AGENTS.md`'si katmana özgü komut ve yasakları taşır; bir katmanda çalışırken önce onu oku.
- **Kod repolarında belge tutulmaz.** Analiz, rapor, plan, spec, test rehberi, Postman koleksiyonu, domain/mimari notu, envanter — hepsi bu depoya yazılır.

## `docs/` haritası

| Klasör | İçerik | Not |
|---|---|---|
| `_indeks.md` | Giriş noktası | |
| `genel/` | Ürün tanımı, MVP kapsamı, sprint planlama | |
| `domain/` | Modül, kavram ve karar notları — **domain bilgisinin tek kaynağı** | Koddan `domain-map` skill'iyle yazılır (`oksis-api/.agents/skills/domain-map/`); `<!-- generated -->` blok kuralı geçerli |
| `teknik/tech-stack.md` | Tüm katmanların teknolojileri ve sürümleri | |
| `teknik/mimari/` | Mimari, multi-tenant, güvenlik, bildirim, arka plan işleri | |
| `teknik/kurallar/` | `ortak/`, `backend/`, `frontend/` kodlama kuralları | |
| `teknik/ortamlar/` | Ortamlar, yerel kurulum, seed runbook | |
| `frontend/bilesenler/` | Bileşen envanteri ve kullanım senaryoları | |
| `frontend/tasarim-sistemi/` | Marka token'ları, mobil tasarım haritası | |
| `postman/<modul>/` | Modül bazlı Postman koleksiyonları | |
| `ihtiyac-analizleri/<modul>/` | İhtiyaç analizleri | |
| `teknik-analizler/<modul>/` | Teknik analizler | |
| `raporlar/` | İnceleme ve durum raporları | |
| `bulgular/` | Bulgu kayıt defteri, arşiv, `kararlar/` (K-xx), `engeller/` (ENG-xx), `kanit/` | |
| `gecici/` | Test rehberleri, tasarım brief'leri, uygulama planları | **İş bitince silinir** |

## Belge yazma kuralları

1. **Yalnız `.md`.** İki istisna: `postman/` altındaki koleksiyon JSON'ları ve `bulgular/kanit/` görsel ekleri.
2. **Kod yok** — jsx, css, html, sql, betik dahil. Kod parçası gerekiyorsa kod reposunda yaşar, belge ona işaret eder.
3. Her belge türünün yeri yukarıdaki haritadır. Yeni üst klasör açmadan önce kullanıcıya sor.
4. Klasör adları Türkçe, küçük harf, kebab-case. Domain not adları Türkçe başlık (domain-map kuralı).
5. **Geçici belge `gecici/` altına yazılır ve iş bitince silinir.** Bitmiş plan, brief ve test rehberi birikmez.
6. İki `kararlar/` klasörü bilinçlidir: `domain/kararlar/` modelin kalıcı gerekçesidir (numaralı, koda bağlı); `bulgular/kararlar/` bulgu, tur ve süreç kararlarıdır (K-xx).
7. Superpowers skill'leri plan/spec'i varsayılan olarak `docs/superpowers/` altına yazar — bu depoda `docs/gecici/planlar/` kullan.
8. **Kod tek doğru kaynaktır.** Belge ile kod çelişirse kod kazanır; belge düzeltilir, çelişki sessizce bırakılmaz.
9. Gizli bilgi (parola, bağlantı dizesi değeri, anahtar, token) yazılmaz — yalnız ayar/değişken adı.

## Mutlak kurallar (tüm katmanlar)

1. **Tenant izolasyonu asla delinmez.** Her sorgu, cache anahtarı, kuyruk işi, SignalR grubu, dosya yolu ve log satırı `SchoolId` ile kapsamlanır. Ayrıntı: `docs/teknik/mimari/multi-tenant-rules.md`.
2. **Adlandırma sabittir.** Not değeri `Mark`, sınıf seviyesi `GradeLevel` — karıştırma. Ayrıntı: `docs/teknik/kurallar/ortak/naming-conventions.md` ve domain notlarındaki `aliases`.
3. **MVP kapsamı korunur.** Yeni özellikten önce `docs/genel/mvp-kapsami.md`; şüphede kullanıcıya sor.
4. **Güvenlik:** yetki kontrolü her zaman sunucudadır; arayüzdeki yetki kapıları yalnız UX'tir. Ayrıntı: `docs/teknik/mimari/security-rules.md`; roller ve izinler `docs/domain/`.
5. **Commit biçimi:** `<type>(<scope>): türkçe açıklama` — scope modül adı veya `repo`, sonda nokta yok (2026-07-21 kararı; eski tarih önekli biçim terk edildi). Ayrıntı: `docs/teknik/kurallar/ortak/git-commit-rules.md`.

## Katmanlar arası yasaklar

- ❌ Tenant süzgecini atlamak (`IgnoreQueryFilters()` gerekçe + denetim olmadan)
- ❌ AutoMapper — Mapster kullan
- ❌ EF Core üstüne repository pattern sarmalayıcısı
- ❌ Lazy loading
- ❌ Controller içinde `DbContext` (her zaman MediatR üzerinden)
- ❌ `async void`, `Task.Result`, `.Wait()`
- ❌ Tam sayfa yüklemede spinner (skeleton kullan)
- ❌ Kurala uymayan commit mesajı (`WIP`, `update stuff`)
- ❌ Sessizce yeni kütüphane veya teknoloji eklemek — önce sor

## Şüphede

Bir kural koddan ve bu belgelerden net çıkmıyorsa tahmin etme, kullanıcıya sor — adlandırma, kütüphane seçimi ve klasör yeri kararları bilinçlidir ve belgelenmiştir.
