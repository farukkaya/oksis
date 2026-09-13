# OKSİS — Ürün Tanımı

> 2026-09-13'te eski `project-context.md`'den taşındı. Teknoloji bölümü [[tech-stack]]'e, multi-tenancy ayrıntısı `teknik/mimari/multi-tenant-rules.md`'ye, sprint planı [[mvp-kapsami]]'na devredildi; eskimiş ifadeler çıkarıldı.

---

## 1. Ürün

**OKSİS**, Türkiye'deki özel okullar (K-12) için geliştirilen **çok kiracılı (multi-tenant) SaaS okul yönetim sistemidir**. Her okul kendi izole verisine sahiptir; tek bir uygulama birden fazla okula hizmet verir.

### Vizyon

Özel okul operasyonlarının (yoklama, not, ödev, devamsızlık, veli iletişimi, duyuru, ödeme takibi) tek bir merkezi platformda yönetildiği, **veli ve öğrencinin bilgiye anlık ulaştığı**, **öğretmenin minimum tıklamayla iş yaptığı**, **yönetimin okulu canlı izlediği** bir sistem.

### Pazar

- Türkiye'deki özel okullar (anaokulu, ilkokul, ortaokul, lise)
- 1 okul ≈ 100–3.000 öğrenci, 20–200 öğretmen
- Yönetim, öğretmen, veli ve öğrenci aynı sistemde

---

## 2. Hedef kullanıcılar

| Kullanıcı | Kullanım profili | Cihaz önceliği |
|---|---|---|
| **Süper yönetici** (OKSİS firması) | Okul (tenant) açma, lisans, platform ayarları — okulun iç verisini değil sistemdeki varlığını yönetir | Web |
| **Okul yönetimi** (müdür, müdür yardımcısı, koordinatör) | Tüm modüller, raporlama, izleme | Web, mobil |
| **Öğretmen** | Yoklama, not, ödev, iletişim | **Mobil**, web |
| **Veli** | Çocuğunun bilgisi, duyuru, iletişim, ödeme | **Mobil**, web |
| **Öğrenci** | Ders programı, ödev, kendi notu, duyuru | **Mobil**, web |
| **İdari personel** (sekreter, muhasebe) | Kayıt, ödeme, evrak | Web |

MVP'de sistem rolü olarak yalnız beşi vardır: süper yönetici, okul yöneticisi, öğretmen, veli, öğrenci — bkz. [[0007-mvp-rol-seti-bes-rol]] ve [[0008-super-yonetici-platform-roludur]].

### Ürün davranış ilkeleri

- **Yoklama 3 tıklamadan fazla sürmemeli** (öğretmen → ders → işaretle).
- **Veli birden fazla çocuğu yönetebilmeli** (kardeşler).
- **Notlar taslak → yayın mantığıyla çalışır;** taslak için bildirim gitmez.
- **Öğrenci–öğretmen ve öğrenci–öğrenci mesajlaşma varsayılan kapalıdır** (veli kontrolü).
- **Devamsızlık eşiği aşılırsa veli bilgilendirilir.**

Bu ilkelerin koddaki karşılığı ve güncel kuralları domain notlarındadır: [[domain/_indeks|Domain Haritası]].

---

## 3. Yüzeyler

Tek backend, rol bazlı deneyimler:

- **Web paneli** (`oksis-ui/apps/web`, Next.js) — süper yönetici, okul yönetimi, öğretmen, veli, öğrenci portalları
- **Mobil uygulama** (`oksis-ui/apps/mobile`, Expo) — öğretmen, veli, öğrenci öncelikli

İki uygulama aynı domain çekirdeğini ve veri katmanını paylaşır (`packages/core`, `packages/api`). Ayrıntı: `teknik/kurallar/frontend/`.

---

## 4. Çok kiracılık

Paylaşılan veritabanı + satır düzeyi izolasyon: her okul verisi `SchoolId` ile ayrılır, EF Core global query filter ve kaydetme kesicisi bunu zorlar. Tenant izolasyonu hiçbir katmanda delinmez. Ayrıntı: `teknik/mimari/multi-tenant-rules.md`. Süper yöneticinin okul verisine erişimi için [[0008-super-yonetici-platform-roludur]].

---

## 5. Kapsam

MVP kapsamı ve sprint planı: [[mvp-kapsami]].

### Sonraya bırakılanlar

- Ödeme entegrasyonu
- Yemekhane / servis modülü
- K12NET / MEB entegrasyonu
- Çoklu dil (TR dışında) — bugün i18n altyapısı da yoktur
- White-label (okula özel tema)
- Mobilde çevrimdışı çalışma
