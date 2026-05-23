# OKSiS Teknik Analiz Belge Standardi v1.0

> **Amac:** OKSiS projesi icin uretilen tum teknik analiz `.docx` belgelerinin ayni gorsel sistem, yapi ve teknik standartla cikmasini saglar.
> **Tetikleyici:** Kullanici "OKSiS analiz", "teknik analiz", "modul analizi", "X modulu icin analiz" benzeri bir istek yaparsa veya bu belgeyi sohbete eklemisse — bu standart uygulanir.

---

## 1. Genel Uygulama Kurali

Kullanici OKSiS kapsaminda **teknik analiz**, **mimari tasarim**, **modul analizi**, **implementasyon raporu** veya benzeri bir `.docx` belge istedi mi:

1. Once `/mnt/skills/public/docx/SKILL.md` okunur.
2. Belge **docx-js** ile JavaScript uzerinden uretilir.
3. Asagidaki tum bolumlerdeki kurallar **istisnasiz** uygulanir.
4. `validate.py` ile dogrulanir.
5. `/mnt/user-data/outputs/` altina kopyalanir ve `present_files` ile sunulur.

Sade markdown / inline cevap **kabul edilmez** — kullanici "OKSiS analiz" dediyse .docx ciktisi beklenir.

---

## 2. Sayfa ve Belge Ayarlari

| Ayar | Deger |
|---|---|
| Sayfa boyutu | A4 (11906 × 16838 DXA) |
| Margin | 1 inch (1440 DXA) her yondan |
| Header margin | 720 DXA |
| Footer margin | 720 DXA |
| Icerik genisligi | 9026 DXA (PAGE_W - 2 × MARGIN) |
| Default font | Arial |
| Default body size | 22 half-points (11pt) |
| Code font | Courier New, 18 half-points (9pt) |

---

## 3. Renk Paleti (Sabit)

```js
const COLORS = {
  navy:        '1B2B5E',  // Kapak sol, section badge (default), tablo header, H2/H3
  blueAccent:  '2E75B6',  // Kapak sag rozet, ust/alt cizgi
  green:       '0E7A5A',  // Section badge (matris / checklist / ek bolumler)
  codeBg:      '1E293B',  // Kod blogu arka plani
  codeText:    'E2E8F0',  // Kod blogu metni
  ruleBg:      'EEF2FF',  // KURAL kutusu acik arka plan
  ruleBorder:  '1B2B5E',  // KURAL kutusu sol cizgi (navy)
  zebra:       'F1F5F9',  // Tablo zebra cift satir
  headerText:  'FFFFFF',  // Tablo header beyaz metin
  border:      'D1D5DB',  // Hafif kenarlik (#D1D5DB)
  numColBg:    'E0E7FF',  // Flow tablo numara sutunu (acik mavi)
  numColText:  '1B2B5E',  // Flow tablo numara metni (navy)
};
```

**Renk kullanim hiyerarsisi:**
- **Navy** standart section badge'leri icin.
- **Green** sadece: izin matrisi, mimari uyum kontrol listesi, EK (appendix) bolumleri, bagimlilik matrisi gibi `gozden-gecirme` icerik tipleri icin.
- Diger hicbir renk eklenmez. Kirmizi ekleme yapilirsa kullanici onayi gerekir.

---

## 4. Zorunlu Belge Yapisi (Bu Sirayla)

Her OKSiS teknik analizi en az asagidaki yapida olmalidir:

### 4.1 Kapak Sayfasi (Sayfa 1)

- **Iki sutun tablo** (62% / 38% split, ~3200 DXA yukseklik)
- **Sol hucre:** Navy `#1B2B5E` arka plan, beyaz metin
  - Ana baslik (2 satira bolunmus, bold, 52-56pt)
  - "Teknik Analiz" (bold, 48pt)
  - Alt etiket "oksis-api • oksis-web • oksis-mobile" (24pt)
- **Sag hucre:** Blue accent `#2E75B6` arka plan, beyaz metin
  - "OKSiS" bold 44pt
  - Modul adi (22pt)
  - Sprint bilgisi (22pt)
  - Tarih ("Mayis 2026" — guncel ay) (22pt)
- Kapaktan sonra `spacer(360)`

### 4.2 Belge Bilgi Tablosu

Kapak altinda 2 sutunlu tablo (3200 DXA label / 5826 DXA value), zebra alternating:

| Belge Turu | Teknik Analiz / Mimari Tasarim |
| Versiyon | 1.0 — Sprint 1 |
| Durum | Inceleme Bekliyor / Tamamlandi |
| Moduller | (ilgili modul listesi) |
| Sprint | Sprint X — Y |
| Hazirlayan | OKSiS Takim |

### 4.3 Kapsam Kutusu

Tek hucreli tablo:
- Sol kenarda **kalin navy cizgi** (border size: 24)
- Ust/alt/sag ince navy cizgi (border size: 4)
- Arka plan: ruleBg `#EEF2FF`
- Bold navy "Kapsam" basligi (24pt)
- Aciklama paragrafi: belgenin neyi kapsadigi 3-5 cumlede ozetlenir.

### 4.4 Numarali Section'lar (Page Break ile baslar)

Her ana bolum:
1. `new PageBreak()` ile yeni sayfaya gec
2. `sectionBadge("N.  BOLUM ADI")` — navy veya green
3. `spacer(200)`
4. Icerik (H2 / H3 / paragraf / tablolar / kod bloklari / akislar / rule box'lar)

### 4.5 Zorunlu Son Bolum

Belge her zaman bir **kontrol listesi / ozet** ile biter:
- "Mimari Uyum Kontrol Listesi" (Backend 10 kural + Frontend/Mobile 10 kural, "Uygun / Dikkat" sutunuyla)
- Veya "EK A — Tek Bakista Ozet" (implementasyon raporlarinda)
- Green section badge kullanilir.

### 4.6 Kapanis

Belgenin en alti:
```js
new Paragraph({
  alignment: AlignmentType.CENTER,
  children: [new TextRun({
    text: 'OKSiS — <Belge Adi> v1.0  |  <Ay> <Yil>  |  Gizli / Dahili',
    italics: true, color: '6B7280', size: 20, font: 'Arial'
  })],
});
```
+ ikinci satirda kisa bir notice (italik, gray).

---

## 5. Header / Footer

### Header (her sayfada)
- Sol: `OKSiS — <Belge Adi>` (bold, 18pt, navy)
- Sag (tab stop, RIGHT): `Gizli / Dahili` (italic, 18pt, gray `#6B7280`)
- Alt cizgi: navy 6 size SINGLE, space 4

### Footer (her sayfada)
- Ortalanmis: `Sayfa <CURRENT> / <TOTAL>` (18pt, gray)
- Ust cizgi: navy 6 size SINGLE, space 4

---

## 6. Yeniden Kullanilabilir Bilesenler

Asagidaki helper'lar her belgede aynidir. Yeni belge uretirken **kopyala-yapistir kullanilir, yeniden tasarlanmaz**.

### 6.1 Section Badge

Numarali ust bolum basligi. Full-width tek hucreli tablo, dolu renkli arka plan.

```js
function sectionBadge(text, color = COLORS.navy) {
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [CONTENT_W],
    borders: noBorders,
    rows: [new TableRow({
      children: [new TableCell({
        width: { size: CONTENT_W, type: WidthType.DXA },
        shading: { fill: color, type: ShadingType.CLEAR },
        margins: { top: 220, bottom: 220, left: 280, right: 280 },
        borders: noBorders,
        children: [new Paragraph({
          spacing: { before: 0, after: 0 },
          children: [new TextRun({
            text, bold: true, color: COLORS.headerText,
            size: 28, font: 'Arial',
          })],
        })],
      })],
    })],
  });
}
```

**Kullanim:** `sectionBadge('3.  OKSIS-API — BACKEND TASARIMI')` veya `sectionBadge('4.  IZIN MATRISI', COLORS.green)`

### 6.2 H2 ve H3 Basliklari

```js
const h2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 280, after: 140 },
  children: [new TextRun({ text, bold: true, size: 26, color: COLORS.navy, font: 'Arial' })],
});

const h3 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_3,
  spacing: { before: 200, after: 100 },
  children: [new TextRun({ text, bold: true, size: 22, color: COLORS.navy, font: 'Arial' })],
});
```

**Konvansiyon:**
- H2: bolum.altbolum numaralandirmasi → `"3.1  CQRS Komut Listesi"`
- H3: alt-alt-baslik, numarasiz → `"Domain Katmani"`

### 6.3 Kod Blogu

```js
function codeBlock(lines) {
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [CONTENT_W],
    borders: noBorders,
    rows: [new TableRow({
      children: [new TableCell({
        width: { size: CONTENT_W, type: WidthType.DXA },
        shading: { fill: COLORS.codeBg, type: ShadingType.CLEAR },
        margins: { top: 200, bottom: 200, left: 240, right: 240 },
        borders: noBorders,
        children: lines.map(line => new Paragraph({
          spacing: { before: 0, after: 0, line: 280 },
          children: [new TextRun({
            text: line || ' ',
            font: 'Courier New', size: 18, color: COLORS.codeText,
          })],
        })),
      })],
    })],
  });
}
```

**Kullanim:** C#, TypeScript, bash, ASCII art zincir gosterimleri, klasor yapilari hep bu blogun icinde.

### 6.4 Veri Tablosu (Zebra)

```js
function dataTable(headers, rows, widths, opts = {}) {
  if (!widths) {
    const w = Math.floor(CONTENT_W / headers.length);
    widths = headers.map(() => w);
    widths[widths.length - 1] = CONTENT_W - w * (headers.length - 1);
  }
  const headerSize = opts.headerSize || 20;
  const cellSize = opts.cellSize || 20;
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) => new TableCell({
      width: { size: widths[i], type: WidthType.DXA },
      shading: { fill: COLORS.navy, type: ShadingType.CLEAR },
      margins: { top: 110, bottom: 110, left: 120, right: 120 },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color: COLORS.navy },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: COLORS.navy },
        left: { style: BorderStyle.SINGLE, size: 4, color: COLORS.navy },
        right: { style: BorderStyle.SINGLE, size: 4, color: COLORS.navy },
      },
      children: [new Paragraph({
        spacing: { before: 0, after: 0 },
        children: [new TextRun({
          text: h, bold: true, color: COLORS.headerText,
          size: headerSize, font: 'Arial',
        })],
      })],
    })),
  });
  const bodyRows = rows.map((row, rIdx) => new TableRow({
    children: row.map((cellText, cIdx) => new TableCell({
      width: { size: widths[cIdx], type: WidthType.DXA },
      shading: rIdx % 2 === 1 ? { fill: COLORS.zebra, type: ShadingType.CLEAR } : undefined,
      margins: { top: 100, bottom: 100, left: 120, right: 120 },
      borders: allThinBorders,
      children: String(cellText).split('\n').map(line => new Paragraph({
        spacing: { before: 0, after: 40 },
        children: [new TextRun({ text: line, size: cellSize, font: 'Arial' })],
      })),
    })),
  }));
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: widths,
    rows: [headerRow, ...bodyRows],
  });
}
```

**Kurallar:**
- Sutun genislikleri **DXA** olarak verilir, toplami CONTENT_W (9026) olmalidir.
- 7+ sutunlu matrisler icin `opts.headerSize: 16, cellSize: 18` ile kuculltulur.
- Hucre icinde `\n` ile cok satirli icerik desteklenir.

### 6.5 Akis Tablosu (Numarali Adimlar)

```js
function flowTable(steps) {
  const numW = 700;
  const contentW = CONTENT_W - numW;
  const rows = steps.map((s, i) => new TableRow({
    children: [
      new TableCell({
        width: { size: numW, type: WidthType.DXA },
        shading: { fill: COLORS.numColBg, type: ShadingType.CLEAR },
        margins: { top: 160, bottom: 160, left: 100, right: 100 },
        borders: allThinBorders,
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 0 },
          children: [new TextRun({
            text: String(i + 1), bold: true,
            color: COLORS.numColText, size: 28, font: 'Arial',
          })],
        })],
      }),
      new TableCell({
        width: { size: contentW, type: WidthType.DXA },
        margins: { top: 140, bottom: 140, left: 200, right: 200 },
        borders: allThinBorders,
        children: [
          new Paragraph({
            spacing: { before: 0, after: 60 },
            children: [new TextRun({
              text: s.title, bold: true, size: 22,
              color: COLORS.navy, font: 'Arial',
            })],
          }),
          new Paragraph({
            spacing: { before: 0, after: 0 },
            children: [new TextRun({ text: s.desc, size: 21, font: 'Arial' })],
          }),
        ],
      }),
    ],
  }));
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [numW, contentW],
    rows,
  });
}
```

**Kullanim alanlari:** uctan uca akislar, calisma adimlari, kullanim wizard'lari, ekleme prosedurleri.

```js
flowTable([
  { title: 'Adimin baslik kismi', desc: 'Adimin aciklamasi — endpoint, payload, durum.' },
  { title: '...', desc: '...' },
])
```

### 6.6 Entity Card (Envanter Kartlari)

Tablo / entity envanteri icin. Her tabloya: navy header'da monospace ad + meta, altinda 2 sutunlu zebra label/value.

```js
function entityCard(name, meta, rows) {
  const labelW = 2200;
  const valueW = CONTENT_W - labelW;
  const titleRow = new TableRow({
    children: [new TableCell({
      width: { size: CONTENT_W, type: WidthType.DXA },
      columnSpan: 2,
      shading: { fill: COLORS.navy, type: ShadingType.CLEAR },
      margins: { top: 140, bottom: 140, left: 200, right: 200 },
      borders: allThinBorders,
      children: [new Paragraph({
        spacing: { before: 0, after: 0 },
        children: [
          new TextRun({ text: name, bold: true, color: COLORS.headerText, size: 22, font: 'Courier New' }),
          new TextRun({ text: '   ·   ' + meta, color: 'E2E8F0', size: 20, font: 'Arial' }),
        ],
      })],
    })],
  });
  const dataRows = rows.map(([label, value], idx) => new TableRow({
    children: [
      new TableCell({
        width: { size: labelW, type: WidthType.DXA },
        shading: { fill: idx % 2 === 0 ? 'FFFFFF' : COLORS.zebra, type: ShadingType.CLEAR },
        margins: { top: 100, bottom: 100, left: 200, right: 140 },
        borders: allThinBorders,
        children: [new Paragraph({
          spacing: { before: 0, after: 0 },
          children: [new TextRun({ text: label, bold: true, color: COLORS.navy, size: 20, font: 'Arial' })],
        })],
      }),
      new TableCell({
        width: { size: valueW, type: WidthType.DXA },
        shading: { fill: idx % 2 === 0 ? 'FFFFFF' : COLORS.zebra, type: ShadingType.CLEAR },
        margins: { top: 100, bottom: 100, left: 200, right: 200 },
        borders: allThinBorders,
        children: String(value).split('\n').map(line => new Paragraph({
          spacing: { before: 0, after: 30 },
          children: [new TextRun({ text: line, size: 20, font: 'Arial' })],
        })),
      }),
    ],
  }));
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [labelW, valueW],
    rows: [titleRow, ...dataRows],
  });
}
```

**Kullanim:** 5+ entity/tablo/endpoint envanteri varsa. Her kart arasinda `spacer(200)` konur.

### 6.7 Rule / Info Kutusu (KURAL)

Sol kenarda 120 DXA dolu navy cizgi, sag tarafta ruleBg arka planli icerik.

```js
function ruleBox(title, body, opts = {}) {
  const fill = opts.fill || COLORS.ruleBg;
  const borderColor = opts.borderColor || COLORS.ruleBorder;
  const titleColor = opts.titleColor || COLORS.ruleBorder;
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [120, CONTENT_W - 120],
    borders: noBorders,
    rows: [new TableRow({
      children: [
        new TableCell({
          width: { size: 120, type: WidthType.DXA },
          shading: { fill: borderColor, type: ShadingType.CLEAR },
          borders: noBorders,
          children: [new Paragraph({ children: [new TextRun({ text: ' ' })] })],
        }),
        new TableCell({
          width: { size: CONTENT_W - 120, type: WidthType.DXA },
          shading: { fill, type: ShadingType.CLEAR },
          margins: { top: 160, bottom: 160, left: 220, right: 220 },
          borders: noBorders,
          children: [
            new Paragraph({
              spacing: { before: 0, after: 80 },
              children: [new TextRun({ text: title, bold: true, color: titleColor, size: 22, font: 'Arial' })],
            }),
            new Paragraph({
              spacing: { before: 0, after: 0 },
              children: [new TextRun({ text: body, size: 22, font: 'Arial' })],
            }),
          ],
        }),
      ],
    })],
  });
}
```

**Titles convention:**
- `KURAL` — proje kurali / mimari kisitlama
- `OKUMA` — bir tablonun veya gorselin nasil okunacagi
- `NOT` — onemli bir aciklama
- `UYARI` — dikkat edilmesi gereken konu (opsiyonel: `opts.borderColor: 'C2410C', opts.titleColor: 'C2410C'`)

### 6.8 Bullets (LevelFormat.BULLET — Unicode YASAK)

```js
function bullets(items) {
  return items.map(t => new Paragraph({
    numbering: { reference: 'bullets', level: 0 },
    spacing: { before: 40, after: 40 },
    children: [new TextRun({ text: t, size: 22, font: 'Arial' })],
  }));
}
```

Document `numbering` config:
```js
numbering: {
  config: [
    { reference: 'bullets',
      levels: [{
        level: 0, format: LevelFormat.BULLET, text: '\u2022',
        alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } },
      }] },
    { reference: 'numbers',
      levels: [{
        level: 0, format: LevelFormat.DECIMAL, text: '%1.',
        alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } },
      }] },
  ],
},
```

**Unicode bullet karakterini paragraf icine elle YAZMA.** Sadece numbering config aracligi ile.

---

## 7. Icerik Konvansiyonlari

### 7.1 Dil

- **ASCII Turkce** kullanilir, diakritik karakterler kaldirilir:
  - "Bağımlılık" → "Bagimlilik"
  - "Şifre" → "Sifre"
  - "Çalışma" → "Calisma"
  - "Yönetimi" → "Yonetimi"
- Boyle yazmak hem encoding tutarliligini saglar hem de mevcut belgelerle (davet, kullanici yonetimi, seed) ayni stile uyar.
- **Istisna:** Kod bloklarinin icindeki commentler ve string literal'ler ASCII Turkce. UI'ya yansiyan string'ler ("Sifrenizi belirleyin" gibi) gercek Turkce diakritikli yazilabilir.

### 7.2 Bolum Numaralandirma

- Ust bolumler: `1.`, `2.`, `3.` ... numarali (`sectionBadge` icinde)
- Alt bolumler (H2): `1.1`, `1.2`, `3.4` ... iki seviye numarali
- Daha alt (H3): numarasiz, sadece baslik
- EK bolumler: `EK A`, `EK B` ile (green badge)

### 7.3 OKSiS Proje Kurallari (Backend / Frontend / Mobile)

Her analizde **soyut tasarim degil**, OKSiS proje kurallarina ozgu **somut implementasyon** uretilir:

**Backend:**
- .NET Core API v10, MSSQL, EF Core 10 (Global Query Filter ile row-level tenant isolation)
- MediatR (CQRS), FluentValidation, Mapster (AutoMapper YASAK)
- Hangfire, SignalR, Redis, Serilog+ELK
- JWT (access 15dk / refresh 30gun), FCM, Scalar (Swagger YASAK)
- Clean Architecture + CQRS + Modular Monolith
- Domain hicbir seye bagimli degil. Application EF Core BILMEZ (IApplicationDbContext interface)
- Controller tek satir — sadece `mediator.Send()` + `ToHttpResult()`
- MediatR Pipeline Behaviors sirasi: Logging → Validation → TenantContext → Authorization → Transaction (Commands) → Caching ([Cacheable] Queries)

**Multi-Tenancy:**
- Her tabloda SchoolId zorunlu, JWT'de school_id claim, ITenantContext DI
- Cross-tenant = TenantMismatchException → 403 + Critical log
- Cache key'leri tenant-prefixli

**Izin Sistemi:**
- Format: `{module}.{action}`, Default Deny
- Backend: `[RequirePermission]` attribute
- Frontend: `usePermission()` hook veya `RequirePermission` component
- Izin yok → 403; Kapsam disi → 404

**Roller:** SuperAdmin, SchoolAdmin, SchoolStaff, Teacher, Parent, Student, Secretary, Accountant

**Frontend Web:** React 18 + TypeScript strict, Vite, DevExtreme, Tailwind, React Router v6, TanStack Query v5, Zustand, RHF + Zod, axios interceptor

**Mobile:** React Native + Expo SDK 53, NativeWind v4 (StyleSheet.create YASAK), React Navigation v7, TanStack Query v5, RHF + Zod, Controller (register YASAK), expo-secure-store (AsyncStorage token icin YASAK), expo-image

**Yasaklar (her belgede netlestirilir):**
- Backend: AutoMapper, async void, Task.Result/.Wait(), lazy loading, static state, exception ile control flow, controller'da DbContext, Application'da EF Core referansi, DataAnnotations, string interpolation log
- Frontend/Mobile: Default export, server state'i Zustand'a kopyalamak, console.log PR'da, inline style, localStorage'a token, Redux, Material UI, Ant Design, StyleSheet.create, AsyncStorage (token), ScrollView+map, expo-router, hardcoded Turkce string

**Naming:**
- Entity tekil PascalCase, PK: `Id`, FK: `{Entity}Id`, Tenant: `SchoolId`
- Command: `{Verb}{Entity}Command`, Handler: `{Command}Handler`
- Query: `Get{Entity}By{X}Query` / `List{Entity}sQuery`
- Domain Event: gecmis zaman (`UserInvitedEvent`, `UserActivatedEvent`)
- Named export (default export YASAK), any/as any YASAK

### 7.4 Belgenin Olmazsa Olmaz Bolumleri

Her teknik analiz en az su 9 bolumu icerir (siralama ve numarasi sabit):

1. **Genel Bakis** — Modul amaci, tasarim hedefleri, onayli tech stack tablosu
2. **Domain Modeli** — Entity'ler, enum'lar, audit/soft-delete alanlari, domain event'ler
3. **oksis-api Tasarimi** — CQRS komut/sorgu listesi, MediatR pipeline, handler sablonlari, kritik akislar
4. **Izin Matrisi** — Permission key'leri + rol matrisi (green badge)
5. **oksis-web Tasarimi** — Sayfa/komponent yapisi, React Query keys, Zod schema, state yonetimi
6. **oksis-mobile Tasarimi** — Ekranlar, Zustand store, SecureStore, usePermission self-only kural
7. **Uctan Uca Akislar** — En az 2-3 senaryo, flow table ile
8. **Klasor Yapisi** — oksis-api / oksis-web / oksis-mobile icin tam dosya listesi (kod bloklari ile)
9. **Mimari Uyum Kontrol Listesi** — Backend 10 kural + Frontend/Mobile 10 kural, "Uygun/Dikkat" sutunlu (green badge)

**Istisna:** Implementasyon raporu (geriye donuk belge) ise bu yapi yumusatilir; ana hat korunur, "Yapilan Calisma", "Tablo Envanteri", "Modul × Tablo Matrisi" gibi rapora ozgu bolumler eklenebilir. Yine de **Genel Bakis** ve sonunda **Ozet / Kontrol Listesi** bulunur.

### 7.5 Kapsam Bilgisi

- Kapak'taki "Belge Turu" iki secenekten biri: `Teknik Analiz / Mimari Tasarim` veya `Teknik Analiz / Implementasyon Raporu`
- Tarih: olusturuldugu **ay + yil** (Ay ASCII Turkce: Ocak / Subat / Mart / Nisan / Mayis / Haziran / Temmuz / Agustos / Eylul / Ekim / Kasim / Aralik)
- Sprint bilgisi her zaman belirtilir
- Modul listesi virgul ile ayrilir

---

## 8. Teknik Gereksinimler

### 8.1 Uretim
- **docx-js** ile JavaScript dosyasi yazilir (`npm install -g docx` ile global kurulu)
- Once `/home/claude/build_<konu>.js` icine kod yazilir
- `node build_<konu>.js` ile uretilir → `/home/claude/<konu>_analiz.docx`
- **Asla** dogrudan `/mnt/user-data/outputs/` icine ilk dosya yazilmaz; once `/home/claude/`'de uretilip dogrulandiktan sonra kopyalanir

### 8.2 Validation
- `python /mnt/skills/public/docx/scripts/office/validate.py <dosya>.docx`
- "All validations PASSED!" alinmadan dosya kullanilmaz

### 8.3 Gorsel Dogrulama (opsiyonel ama tavsiye)
- LibreOffice ile PDF'e cevir → `pdftoppm` ile JPEG render → en az kapak, bir kod blogu, bir matris/data tablo, bir flow tablo ve son sayfa kontrol edilir.

### 8.4 Teknik Yasaklar
- `WidthType.PERCENTAGE` **YASAK** (Google Docs'ta bozuluyor) → her zaman `WidthType.DXA`
- `ShadingType.SOLID` **YASAK** (siyah arka plan uretiyor) → her zaman `ShadingType.CLEAR`
- `StyleSheet.create` benzeri uzantilar — sadece docx-js native sinif kullanilir
- Tablo width'i = `columnWidths`'lerin toplami olmali (DXA cinsinden)
- Her hucreye hem `columnWidths` hem cell `width` set edilir
- PageBreak `Paragraph` icinde olmak zorunda: `new Paragraph({ children: [new PageBreak()] })`

---

## 9. Dosya Adlandirma

- ASCII, snake_case, sonu `_analiz.docx`
- Ornekler:
  - `davet_sistemi_analiz.docx`
  - `kullanici_yonetimi_analiz.docx`
  - `sifir_km_seed_analiz.docx`
  - `bildirim_sistemi_analiz.docx`
- Belge baslik metni: ana modul adi + "Teknik Analiz"
  - `OKSiS — Davet Sistemi Teknik Analiz`
  - `OKSiS — Kullanici Yonetimi Teknik Analiz`

---

## 10. Akis: Yeni Bir Analiz Istegi Geldiginde

1. Kullanicinin istegini analiz et — hangi modul, hangi alt parca, sprint hangisi?
2. **Once** `/mnt/skills/public/docx/SKILL.md` oku.
3. Bu standardin **Bolum 7.3** OKSiS proje kurallarini istegin kapsamina uygula.
4. Bu standardin **Bolum 7.4** zorunlu 9 bolumu uzerinden tasla cikar.
5. Helper fonksiyonlari **kopyalayarak** (Bolum 6) JavaScript dosyasi yaz.
6. Uretim → validate → render kontrol → outputs'a kopyala → `present_files`.
7. Cevapta kisa bir ozet ver: kac sayfa, hangi bolumler, dikkat cekici tasarim kararlari.

---

## 11. Ornek Sablon Kullanim

Kullanici "Bildirim sistemi icin analiz cikar" dedi:

```
1. Konuyu netlestir:
   - oksis-api: notifications modulu, FCM + SignalR + email
   - Kapsam: push, in-app, email, sms (Sprint 2 mock)
   - Sprint: Sprint 1

2. Helper'lari mevcut bir build.js'den kopyala
   (davet_sistemi veya kullanici_yonetimi build dosyasi referans).

3. Yapi:
   - Kapak (navy/blue, "Bildirim Sistemi")
   - Belge bilgi tablosu
   - Kapsam kutusu
   - 1. Genel Bakis
   - 2. Domain Modeli (Notification, NotificationType, Channel enum)
   - 3. oksis-api (CQRS, IInvitationNotificationChannel pattern,
                   Hangfire job, Outbox pattern)
   - 4. Izin Matrisi (green)
   - 5. oksis-web
   - 6. oksis-mobile (expo-notifications, FCM token)
   - 7. Uctan Uca Akislar
   - 8. Klasor Yapisi
   - 9. Mimari Uyum Kontrol Listesi (green)

4. Build → validate → present_files.
```

---

## 12. Versiyon ve Guncelleme

| Versiyon | Tarih | Degisiklik |
|---|---|---|
| 1.0 | Mayis 2026 | Ilk yayin — davet, kullanici yonetimi, seed analizlerinden cikarildi. |

Yeni bilesen eklenirken bu belge guncellenir, versiyon arttirilir.

---

**Bu belgenin amaci:** her yeni OKSiS analiz isteginde sifirdan tasarim yapmadan, tutarli ve profesyonel ciktilar uretmek. Sapma gerektiren durumlarda once **kullaniciya soruluyor** — sessiz sapma yapilmiyor.
