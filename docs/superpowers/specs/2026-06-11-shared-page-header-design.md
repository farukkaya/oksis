# Paylaşımlı `PageHeader` Componenti — Tasarım

**Tarih:** 2026-06-11
**Repo:** `oksis-web`
**Branch:** `shcool-settings`
**Durum:** Uygulandı + master'a merge edildi (`8c44e88`) — aşağıdaki **Revizyon** notunu oku.

> ## ⚠️ Revizyon (2026-06-11, uygulama sırasında)
> Bu spec başta görünümü **`.stu .page-head`'e (Öğrenciler düz başlığı: 27px, zeminsiz)
> birebir** sabitliyordu. Uygulamadan sonra kullanıcı bunun referans görsele (Sınıflar
> "üst bağlam **barı**") uymadığını belirtti. Gerçek hedef **`.clx-top` BAR**'ıydı:
> tam-genişlik (full-bleed), dolu zemin (`--card`), alt çizgi, 13px/24px padding, **21px**
> başlık, dikey ortalı. `page-header.css` bu bar'a göre yeniden yazıldı ve bar full-bleed
> olması için `<PageHeader>` padding'li iç sarmalayıcının dışına, sayfa kök container'ının
> doğrudan çocuğu olacak şekilde taşındı. Ayrıca bar **sticky** yapıldı; `.stu`'daki
> `overflow-y:auto` araya girip sticky'yi kırdığı için kaldırıldı (gerçek scroll container
> `.oksis-shell .content`). Aşağıdaki "CSS değerleri" ve "byte-identical" ifadeleri bu
> revizyonla **geçersiz** — güncel değerler: bar zemini `--card`, alt çizgi `--line`,
> padding 13/24, h1 21px/800/-0.025em/lh1.1, breadcrumb mb 4px, `position:sticky;top:0`.
> Rollout 9 ekrana genişletildi (Öğrenciler/Öğretmenler/Kullanıcılar/Veliler +
> Gösterge Paneli/Roller/Ayarlar/Akademik Takvim/Sezon Yönetimi). Sınıflar kaynak olarak
> bırakıldı; `app/layouts/PageHeader.tsx` ~20 legacy tüketicisi olduğu için silinmedi.

## Amaç

Admin portalındaki tüm liste/detay ekranlarının üst bağlam barı (breadcrumb +
başlık + alt açıklama + aksiyonlar) bugün **4 ayrı uygulamayla** tekrar ediyor.
Tek, özelleştirilebilir, paylaşımlı bir `PageHeader` componenti kurup ekranları
buna geçirerek standardı tek kaynağa indirmek.

Referans görünüm: **Sınıflar & Şubeler** ekranının üst barı (`clx-top`) — mevcut
en zengin varyant (sezon seçici + özet sayaçlar + aksiyonlar).

## Mevcut durum (tespit)

| Uygulama | Stil | Kullanan ekranlar |
|---|---|---|
| `clx-top` (`classrooms.css`) | CSS-class sistemi — en zengin: breadcrumb + başlık + sezon seçici + özet sayaçlar + aksiyonlar | Sınıflar & Şubeler |
| `.page-head` (CSS `students.css` içinde) | breadcrumb + h1 + subtitle + aksiyon; CSS `students.css`'e gömülü (kırılgan paylaşım) | Öğrenciler, Öğretmenler, Veliler, Kullanıcılar — her biri kendi `*PageHead` componenti |
| `app/layouts/PageHeader.tsx` | Tailwind, subtitle yok | Ayarlar |
| Inline Tailwind | elle yazılmış | Sezon Yönetimi, Roller |

Token gerçeği:
- Global token'lar `src/styles/theme.css` `:root`'ta: `--foreground`,
  `--foreground-heading`, `--foreground-muted`, `--foreground-faint`, `--line`.
- `--text` / `--text-muted` / `--text-faint` yalnızca **sayfa-scoped** alias'lar
  (`.stu`, `.clx` içinde global token'lara map'lenir) — global değil.
- `.btn` **sayfa-scoped** (`.stu .btn`, `.clx .btn`) — global değil.

## Kararlar (onaylı)

1. **Stil sistemi:** CSS-class sistemi (handoff'a birebir). Paylaşımlı componentin
   CSS'i global token'ları (`--foreground*`, `--line`) doğrudan kullanır; metin /
   başlık / breadcrumb stili sayfa kapsamı olmadan kendi başına çalışır.
2. **API:** Esnek slotlu **tek** component (`title` zorunlu + opsiyonel
   `breadcrumb`, `subtitle`, `aside`, `actions`). Sınıflar dahil tüm ekranlar aynı
   componenti kullanır.
3. **Kapsam (bu tur):** Component + CSS kurulumu + **3 pilot ekran** (Öğrenciler,
   Öğretmenler, Kullanıcılar). Kalan ekranlar ve eski uygulamaların temizliği
   sonraki tura bırakılır.

## Component tasarımı

### Konum & dosyalar
`oksis-web/src/shared/components/PageHeader/`
- `PageHeader.tsx` — **named export** (default export yasağı — web kuralı #4)
- `index.ts` — re-export
- CSS: `oksis-web/src/shared/styles/page-header.css` (global `.page-header`)

### API

```ts
export interface PageHeaderBreadcrumbItem {
  label: string;
  to?: string; // verilirse <Link to>, yoksa düz <span>
}

export interface PageHeaderProps {
  title: string;                          // zorunlu → <h1>
  breadcrumb?: PageHeaderBreadcrumbItem[];
  subtitle?: ReactNode;                   // başlık altı açıklama
  aside?: ReactNode;                      // text bloğunun hemen sağı (sol grup) — ör. sezon seçici
  actions?: ReactNode;                    // en sağ — ör. özet sayaçlar + butonlar
  className?: string;                     // ekstra sınıf (cn ile birleşir)
}
```

### Markup

```tsx
<header className={cn("page-header", className)}>
  <div className="ph-left">
    <div className="ph-text">
      {breadcrumb?.length ? (
        <nav className="ph-breadcrumb" aria-label="breadcrumb">
          {breadcrumb.map((item, i) => (
            <Fragment key={i}>
              {i > 0 && <ChevronRight size={13} className="ph-sep" aria-hidden />}
              {item.to ? <Link to={item.to}>{item.label}</Link> : <span>{item.label}</span>}
            </Fragment>
          ))}
        </nav>
      ) : null}
      <h1>{title}</h1>
      {subtitle ? <p className="ph-sub">{subtitle}</p> : null}
    </div>
    {aside ? <div className="ph-aside">{aside}</div> : null}
  </div>
  {actions ? <div className="ph-actions">{actions}</div> : null}
</header>
```

### Yerleşim mantığı

```
┌─ .page-header (flex, align-items:flex-end, gap, wrap) ─────────────────┐
│  ┌─ .ph-left (flex:1, flex, gap, wrap) ─┐              ┌─ .ph-actions ─┐│
│  │ .ph-text: breadcrumb / h1 / subtitle │  [aside]     │ [actions]     ││
│  └──────────────────────────────────────┘              └───────────────┘│
└────────────────────────────────────────────────────────────────────────┘
```

- **Standart ekranlar:** sadece `ph-text` (+subtitle) + `ph-actions` (butonlar).
  `aside` boş geçilir.
- **Sınıflar (zengin):** `aside={sezon seçici}`, `actions={özet sayaçlar + Şube
  Ekle + Sihirbaz}`, `subtitle` yok. `.ph-left` flex:1 olduğundan aksiyonlar sağa
  yaslanır; sezon seçici başlığın hemen sağında kalır → ekran görüntüsü düzeniyle
  birebir.

### CSS değerleri (mevcut `.stu .page-head`'ten birebir)

`.page-header`: `display:flex; align-items:flex-end; gap:16px; margin-bottom:22px; flex-wrap:wrap;`
`.ph-left`: `flex:1; display:flex; align-items:flex-end; gap:16px; flex-wrap:wrap;`
`.ph-text`: `min-width:200px;`
`.ph-breadcrumb`: `display:flex; align-items:center; gap:7px; font-size:12.5px; color:var(--foreground-faint); font-weight:600; margin-bottom:7px;` — link/span aynı stil, `.ph-sep` rengi `var(--line)`.
`.page-header h1`: `font-size:27px; font-weight:800; letter-spacing:-0.03em; color:var(--foreground); margin:0;`
`.ph-sub`: `font-size:14.5px; color:var(--foreground-muted); margin-top:5px;`
`.ph-actions`: `display:flex; align-items:center; gap:10px; margin-left:auto;`

Tek fark: `--text*` alias'ları yerine global `--foreground*` kullanılır. Görünüm
bayt-bayt aynı.

## Pilot migrasyon (3 ekran)

| Ekran | Şu an | Sonra |
|---|---|---|
| Öğrenciler (`StudentsPage`) | `StudentsPageHead` | `<PageHeader>` + `breadcrumb`, `subtitle`, `aside={seasonSelector}`, `actions={Dışa Aktar · Yeni Öğrenci}` → `StudentsPageHead.tsx` silinir |
| Öğretmenler (`TeachersPage`) | `TeachersPageHead` | `<PageHeader>` + `breadcrumb`, `subtitle`, `actions={Sezon Görevini Kopyala · Yeni Öğretmen}` → `TeachersPageHead.tsx` silinir |
| Kullanıcılar (`UsersPage`) | `UsersPageHead` | `<PageHeader>` + `breadcrumb`, `subtitle`, `actions={Dışa Aktar · Yeni Kullanıcı}` → `UsersPageHead.tsx` silinir |

Notlar:
- i18n anahtarları (breadcrumb/title/subtitle/actions) mevcut çevirilerden aynen
  kullanılır; yeni anahtar gerekmez.
- Aksiyon butonları (`.btn btn-ghost`, `.btn btn-primary`) componente **slot**
  olarak geçer; pilot sayfalar `.stu`/`.stu-inner` kök sarmalayıcısı içinde render
  ettiğinden mevcut `.btn` cascade'i çalışmaya devam eder.
- `page-header.css`, `PageHeader.tsx` içinden import edilir
  (`import "../../styles/page-header.css"`) — classrooms'un `import
  "./classrooms.css"` pattern'i gibi; component kendi stilini taşır, ayrı global
  import gerekmez.
- **Eski `.stu .page-head` CSS'i students.css'te kalır** — Veliler hâlâ
  `ParentsPageHead` üzerinden kullanıyor. Yeni `.page-header` sınıfı eskisiyle
  çakışmaz. Tam temizlik sonraki turda.

## Doğrulama

- `npm run build` ve `npm run test` yeşil.
- Pilot 3 ekranın header'ı görsel olarak öncekiyle birebir aynı (breadcrumb,
  başlık boyutu, subtitle, aksiyon hizası).
- Öğrenciler ekranında sezon seçici (`aside`) başlığın sağında, doğru konumda.

## Kapsam dışı (sonraki tur)

- Kalan 7 ekran: Gösterge Paneli, Akademik Takvim, Veliler, Sezon Yönetimi,
  Roller, Ayarlar, Sınıflar & Şubeler.
- Eski `app/layouts/PageHeader.tsx` (Tailwind) ve inline header'ların kaldırılması.
- `.stu .page-head` CSS'inin students.css'ten silinmesi (tüm tüketiciler geçince).
- Paylaşımlı `.btn` / `Button` componenti — `.btn` şimdilik sayfa-scoped kalır.
