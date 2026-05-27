# OKSİS — Project Context

> Bu dosya **her AI oturumunda ilk okunması gereken** bağlam dosyasıdır. AI kod üretirken, mimari öneri sunarken veya feature planlarken bu bağlamı temel almalıdır.

---

## 1. Ürün Tanımı

**OKSİS**, özel okullar (K-12) için geliştirilen **multi-tenant SaaS okul yönetim sistemidir**. Her okul kendi izole verisine sahiptir; tek bir uygulama instance'ı birden fazla okula hizmet verir.

### Vizyon
Özel okul operasyonlarının (yoklama, not, ödev, devamsızlık, veli iletişimi, duyuru, ödeme takibi) tek bir merkezi platformda yönetildiği, **veli ve öğrencinin bilgiye anlık ulaştığı**, **öğretmenin minimum tıklamayla iş yaptığı**, **yönetimin canlı dashboard ile okulu izlediği** bir sistem.

### Pazar
- Türkiye'deki özel okullar (anaokulu, ilkokul, ortaokul, lise)
- 1 okul ≈ 100–3.000 öğrenci
- 1 okul ≈ 20–200 öğretmen
- Yönetim, öğretmen, veli, öğrenci aynı sistemde

---

## 2. Hedef Kullanıcılar (Roller)

| Rol | Kullanım Profili | Cihaz |
|---|---|---|
| **Süper Admin** (OKSİS firması) | Tenant (okul) açma, lisans, sistemsel ayar | Web |
| **Okul Yönetimi** (müdür, müdür yrd., koordinatör) | Tüm modüller, raporlama, dashboard | Web (öncelik), Mobile |
| **Öğretmen** | Yoklama, not, ödev, mesajlaşma | **Mobile öncelik**, Web |
| **Veli** | Çocuğunun bilgisi, mesajlaşma, duyuru, ödeme | **Mobile öncelik**, Web |
| **Öğrenci** | Ders programı, ödev, not (kendi), duyuru | **Mobile öncelik**, Web |
| **İdari Personel** (sekreter, muhasebe) | Kayıt, ödeme, evrak | Web |

### Kritik Davranış Kuralları
- **Yoklama 3 tıklamadan fazla almamalı.** (Öğretmen → ders → işaretle)
- **Veli birden fazla çocuk yönetebilmeli** (kardeşler).
- **Notlar taslak → yayınla mantığıyla çalışmalı.** Taslak için bildirim gitmez.
- **Öğrenci-öğretmen / öğrenci-öğrenci mesajlaşma varsayılan KAPALI.** (Veli kontrolü)
- **Devamsızlık eşiği aşılırsa otomatik veli bildirimi.**

---

## 3. Portallar

Tek backend, **4 ayrı frontend deneyimi**:

1. **Admin Portal** (Web — Süper Admin + Okul Yönetimi)
2. **Teacher App** (Mobile + Web — Öğretmen)
3. **Parent App** (Mobile + Web — Veli, çoklu çocuk)
4. **Student App** (Mobile + Web — Öğrenci)

Tek React kod tabanında **portal bazlı routing** ile yönetilir. Mobile React Native ile ayrı build edilir.

---

## 4. Teknoloji Stack'i

### Backend
- **.NET Core API v10** (ASP.NET Core Minimal API + Controllers hibrit)
- **EF Core 10** + **Microsoft SQL Server 2022** (multi-tenant: row-level isolation, her tabloda `SchoolId`)
- **MediatR** (CQRS — Commands & Queries)
- **FluentValidation** (request validation)
- **Mapster** (DTO ↔ Entity mapping — AutoMapper değil, performans)
- **Hangfire** (background jobs, scheduled notifications, SQL Server storage)
- **SignalR** (real-time notifications, dashboard updates)
- **Redis** (distributed cache, SignalR backplane, rate limiting)
- **Serilog + Elasticsearch + Kibana (ELK)** (structured logging)
- **JWT** (access token 15 dk, refresh token 30 gün, tenant-aware claims)
- **Firebase Cloud Messaging (FCM)** (push notifications — iOS + Android)
- **Scalar** (API documentation, Swagger UI yerine modern alternatif)
- **xUnit + FluentAssertions + NSubstitute + Testcontainers** (test)

### Frontend Web
- **React 18 + TypeScript**
- **Vite** (build tool)
- **shadcn/ui (Radix + Tailwind)** (Table, Dialog, Select vb. — tasarım sistemi)
- **Tailwind CSS** (layout, utility)
- **React Router v6** (portal bazlı routing)
- **TanStack Query (React Query) v5** (server state)
- **Zustand** (client state — global UI state, auth)
- **React Hook Form + Zod** (form + validation)
- **i18next** (TR/EN — TR varsayılan)
- **axios** (HTTP, interceptor ile auth/refresh)

### Mobile
- **React Native + Expo** (TypeScript)
- **React Navigation** (stack + tab + drawer)
- **TanStack Query v5** (server state — web ile aynı pattern)
- **React Hook Form + Zod**
- **Expo Notifications** (FCM integration)
- **AsyncStorage / SecureStore** (token storage)

### Infrastructure / DevOps
- **Docker** (her servis containerized)
- **GitHub Actions** (CI/CD)
- **Kubernetes** (production — tek cluster, namespace izolasyonu yok; tenancy uygulama içinde)

---

## 5. Multi-Tenancy Modeli

**Strateji: Shared Database + Row-Level Tenant Isolation**

- Tek SQL Server instance, tek schema.
- Her ana tabloda `SchoolId` (= TenantId) kolonu **zorunlu**.
- EF Core **Global Query Filter** ile her sorguda otomatik `SchoolId` filtresi.
- JWT içinde `school_id` claim'i; `ITenantContext` ile DI üzerinden okunur.
- Süper Admin için tenant switching desteklenir (özel header: `X-Tenant-Override`, sadece SuperAdmin rolü).
- Detay: `backend/multi-tenant-rules.md`

---

## 6. MVP Kapsamı (Sprint 1–4)

### Sprint 1 — Foundation (4 hafta)
- Tenant (okul) oluşturma, kurulum sihirbazı
- Kullanıcı yönetimi (rol, izin, davet)
- Sınıf / şube / ders yapısı
- Öğrenci kaydı + veli bağlama (çoklu çocuk)
- Authentication (JWT + refresh)

### Sprint 2 — Operasyon (4 hafta)
- **Yoklama** (mobil öncelikli, 3 tıklama)
- **Not girişi** (taslak/yayınla)
- **Ödev** (oluştur, ata, teslim al)
- **Duyuru** (okul / sınıf / şube hedefli)
- Push notification altyapısı (FCM)

### Sprint 3 — İletişim & Raporlama (3 hafta)
- Veli-öğretmen mesajlaşma (öğrenci mesajlaşma kapalı)
- Devamsızlık raporları + eşik uyarısı
- Not karnesi (PDF export)
- Dashboard (yönetim için canlı metrik)

### Sprint 4 — Pilot Hazırlığı (3 hafta)
- Excel import (öğrenci, öğretmen, ders programı)
- Sezon yönetimi (yıl geçişi)
- Demo veri seti
- Pilot okul onboarding

**Detay:** `mvp-scope-rules.md`

---

## 7. Kritik Olmayan / Sonraya Bırakılan

- ❌ Ödeme entegrasyonu (Sprint 5+)
- ❌ Yemekhane / servis modülü (Sprint 5+)
- ❌ K12NET / MEB entegrasyonu (Sprint 6+)
- ❌ Çoklu dil (TR dışında) — sadece UI altyapısı kurulur
- ❌ White-label (okul logosu/teması) — Sprint 5+
- ❌ Mobil için offline mode — Sprint 6+

---

## 8. AI'a Direktifler

1. **Her oturumda bu dosyayı + ilgili `*-rules.md` dosyalarını referans al.**
2. **MVP scope dışına çıkma.** Şüpheliysen `mvp-guard.skill` çalıştır.
3. **Tenant izolasyonunu asla atlamayacaksın.** Her query, her event, her cache key tenant-aware olmalı.
4. **Yeni pattern üretme.** Mevcut pattern varsa onu kullan. Yoksa önce `architecture-rules.md`'i kontrol et.
5. **Naming + folder yapısına sıkı uy.** `naming-conventions.md` + `folder-structure.md`.
6. **Türkçe iş terimleri Türkçe kalır** (yoklama → `Attendance` değil **`Yoklama`** ya da net karşılık. Domain dilini sabit kullan — domain-model-rules.md'de tablo).
7. **Şüpheliysen sor, uydurma.** Veri uydurmaktansa "bilmiyorum, şu soruyu netleştirmem lazım" de.
