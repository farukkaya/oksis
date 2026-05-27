# OKSİS — Rules & Skills Paketi

OKSİS (Türk özel okulları için multi-tenant SaaS okul yönetim sistemi) projesi için AI asistan kuralları ve skill'leri.

## 📦 Pakette Ne Var?

### ✅ `rules/` — 27 dosya (TAMAMLANDI)

**Root (11):**
- `project-context.md` — Ürün tanımı, roller, portallar, MVP sprint planı
- `architecture-rules.md` — Clean Architecture + CQRS, MediatR pipeline
- `naming-conventions.md` — Domain ubiquitous language (TR→EN), C#/TS/DB naming
- `folder-structure.md` — Backend + web + mobile klasör yapıları
- `business-rules.md` — Devamsızlık 3-tap, Mark Draft→Published→Locked, mesajlaşma
- `permission-matrix.md` — 8 rol, permission enum, modül bazlı matris
- `notification-matrix.md` — Kanallar (Push/InApp/SignalR/Email), öncelikler, event matrisi
- `mvp-scope-rules.md` — 4 sprint plan, OUT-OF-MVP listesi, feature creep akışı
- `testing-rules.md` — Test piramidi 70/25/5, xUnit+FluentAssertions+Testcontainers
- `code-review-checklist.md` — Tenant/IDOR/mass-assignment kontrolleri, AI self-check
- `git-commit-rules.md` — Trunk-based, Conventional Commits, semver 0.x

**Backend (9):**
- `backend/coding-standards.md` — .NET 10/C# 13, sealed default, Result<T>, Serilog
- `backend/api-design-rules.md` — REST URL yapısı, response envelope, pagination, async pattern
- `backend/domain-model-rules.md` — Aggregate root'lar, strongly-typed ID'ler, audit, events
- `backend/multi-tenant-rules.md` — **KRİTİK**: SchoolId enforcement, EF Global Query Filter, interceptor
- `backend/database-rules.md` — Microsoft SQL Server 2022 + EF Core 10, migration stratejisi, outbox şeması
- `backend/security-rules.md` — JWT RS256, refresh token rotation, Argon2id, KVKK
- `backend/notification-rules.md` — Event→Outbox→Hangfire→Dispatcher→Channels akışı
- `backend/background-job-rules.md` — Hangfire kuyrukları, idempotency, recurring jobs
- `backend/logging-error-rules.md` — Serilog→Elasticsearch, PII redaction, audit_logs tablosu

**Frontend (7):**
- `frontend/coding-standards.md` — TS strict, state mgmt stratejisi, i18n, axios
- `frontend/ui-ux-rules.md` — Tailwind tokens, 4px grid, mobile 44px target, WCAG AA
- `frontend/component-rules.md` — Button/Modal/DataTable/FormField API'leri
- `frontend/form-validation-rules.md` — RHF + Zod kalıpları, wizard, submit davranışı
- `frontend/datagrid-rules.md` — shadcn/ui Table tabanlı DataTable standartları
- `frontend/state-management-rules.md` — React Query (server) + Zustand (client) ayrımı, cache invalidation
- `frontend/routing-auth-rules.md` — Portal-based routing, protected routes, role-based menüler

### ✅ `skills/` — 17 dosya (TAMAMLANDI)

Her skill dosyası belirli bir tetikleyici (trigger) durumunda devreye girer; AI cevap üretirken ilgili checklist'i otomatik uygular ve standart bir output formatı döner.

**Foundation (4):**
- `foundation/architecture-review.skill` — Layer/CQRS/tenant/scaling/scope uyumu
- `foundation/consistency-check.skill` — Naming, folder, pattern reuse, duplicate detection
- `foundation/security-check.skill` — Tenant, auth, IDOR, validation, mass assignment, data leakage
- `foundation/performance-check.skill` — N+1, pagination, cache, render, payload

**Backend (5):**
- `backend/entity-design.skill` — Audit/soft-delete/tenant/index/naming otomatik uygulama
- `backend/api-endpoint-generator.skill` — Route + envelope + pagination + validation + OpenAPI + policy
- `backend/event-driven-flow.skill` — Domain event → notif queue → push/SignalR → audit
- `backend/multi-tenant-guard.skill` *(en kritik)* — Query/cache/job/event/log tenant-safety
- `backend/audit-log.skill` — Mark/attendance/role/user/SuperAdmin aksiyonlarının standart kaydı

**Frontend (5):**
- `frontend/crud-page-generator.skill` *(en yüksek ROI)* — Sayfa + hook + API + Zod + DataGrid + modal + i18n tek seferde
- `frontend/dashboard-widget.skill` — Metric card, chart wrapper, skeleton, empty/error, responsive grid
- `frontend/form-wizard.skill` — Step state + validation + autosave + draft + async submit
- `frontend/mobile-responsive.skill` — Touch target, sticky action, keyboard, fallback, bottom sheet
- `frontend/notification-ui.skill` — Toast + in-app drawer + push permission + deep link + multi-child

**Product (3):**
- `product/mvp-guard.skill` — "Sprint 1'de gerçekten gerekli mi?" feature-creep filtresi
- `product/school-ux.skill` — Rol bazlı (öğretmen/veli/öğrenci/yönetim) UX ilkeleri + Türk okul bağlamı
- `product/notification-priority.skill` — Instant / Batched / Silent / Critical sınıflandırma + quiet hours + cooldown

---

## 🎯 Onaylanan Tech Stack

**Backend:** .NET 10 + C# 13, Clean Architecture + CQRS (MediatR), Microsoft SQL Server 2022 + EF Core 10, Redis, Hangfire, SignalR, FCM, FluentValidation, Mapster, Scalar, JWT custom + refresh tokens, xUnit+FluentAssertions+NSubstitute+Testcontainers, Serilog + Elasticsearch + Kibana.

**Frontend Web:** React 18 + TypeScript + Vite + shadcn/ui (Radix) + Tailwind + React Query + Zustand + React Hook Form + Zod + React Router v6.

**Mobile:** React Native + Expo + TypeScript + React Query + RHF + Zod + React Navigation.

**Çok kiracılı (multi-tenant) model:** Shared DB / row-level — her tenant tablosunda `SchoolId` kolonu, EF Global Query Filter ile zorunlu.

---

## 📁 Klasör Yapısı

```
oksis-rules-skills/
├── README.md                          ← bu dosya
├── rules/                             ← 27 dosya
│   ├── project-context.md
│   ├── architecture-rules.md
│   ├── naming-conventions.md
│   ├── folder-structure.md
│   ├── business-rules.md
│   ├── permission-matrix.md
│   ├── notification-matrix.md
│   ├── mvp-scope-rules.md
│   ├── testing-rules.md
│   ├── code-review-checklist.md
│   ├── git-commit-rules.md
│   ├── backend/                       ← 9 dosya
│   └── frontend/                      ← 7 dosya
└── skills/                            ← 17 dosya
    ├── foundation/                    ← 4 skill
    ├── backend/                       ← 5 skill
    ├── frontend/                      ← 5 skill
    └── product/                       ← 3 skill
```

---

## 🚀 Nasıl Kullanılır?

### Rules
1. **Cursor / Claude Code / Windsurf vb.** kullanıyorsanız `rules/` klasöründeki Markdown dosyalarını `.cursorrules`, `.clinerules` veya benzer bir kural dosyasına referans olarak ekleyin.
2. Her rule dosyasının başında **bağlam** ve **bu kurala ne zaman bakılacağı** bölümü vardır; AI bunları otomatik olarak referans alır.
3. **`backend/multi-tenant-rules.md`** ve **`backend/security-rules.md`** dosyaları proje için pazarlık konusu değildir — bu iki dosyaya AI'nin her zaman uymasını sağlayın.

### Skills
1. `skills/` altındaki `.skill` dosyaları **belirli bir tetikleyici** durumunda çalışacak şekilde tasarlandı (örn: "yeni entity üret", "CRUD ekran ekle", "bildirim event'i tanımla").
2. AI tool'unuza bu dosyaları **rule olarak** ekleyin; her dosyanın başında "Trigger" bölümü vardır.
3. **En kritik skill'ler:** `multi-tenant-guard` (her backend kodda), `crud-page-generator` (her CRUD ekranda), `mvp-guard` (her yeni feature talebinde), `school-ux` (her UI kararında).

---

## ⚠️ Notlar & Varsayımlar

- Belirsiz bırakılan teknoloji seçimleri için makul varsayımlar yapıldı (Mapster vs AutoMapper, Hangfire vs Quartz, vb.). Farklı tercih varsa ilgili kural dosyasını güncellemek yeterli.
- Domain dilinde **"Mark"** (not) ve **"Grade"** (sınıf seviyesi) ayrımı bilinçlidir; karıştırmayın.
- Mobile-first öncelik: Öğretmen yoklama akışı, 3-tap kuralına bağlıdır.
- KVKK: 5 yıl audit log saklama, PII redaction zorunludur.

---

**Toplam: 45 dosya** (1 README + 27 rules + 17 skills).
