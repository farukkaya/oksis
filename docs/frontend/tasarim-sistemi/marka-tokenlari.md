# OKSIS Brand Tokens (reference cache)

Source: https://brand.oksis.net/brand/index.html — v1.0, 2026-05-12.
Re-fetch that URL if a handoff uses a token not listed here (brand may have shipped
an update) — do not assume this cache is exhaustive forever.

## Core palette (5 colors + 1 gradient — nothing else is brand)

| Name | Hex | Usage |
| --- | --- | --- |
| Primary Dark (Lacivert) | `#1B2B5E` | Logo, primary UI, Admin portal color |
| Primary Mid (Mavi) | `#3A4F9C` | Secondary UI |
| Accent Electric | `#4F6BFF` | Highlights, CTAs |
| Surface Light (Yüzey) | `#EEF1FA` | Backgrounds |
| Ink Body (Mürekkep) | `#0D1117` | Text |
| Signature gradient | `linear-gradient(135deg, #1B2B5E 0%, #4F6BFF 100%)` | Fixed 135°. Logo/hero/app-icon only — never re-angled or recolored. |

### Portal colors (UI only — never logo/marketing)

| Portal | Hex | Note |
| --- | --- | --- |
| Admin | `#1B2B5E` (Navy) | **oksis-ui is the Admin portal** — this is the one that applies here |
| Teacher | `#0E7A5A` (Teal) | Different product surface — out of scope unless explicitly building teacher portal |
| Parent | `#B05A0A` (Bronze) | Out of scope |
| Student | `#3B0764` (Purple) | Out of scope |

**Rule:** every color in a web handoff must resolve to one of the 5 core colors,
the Admin navy, or a Tailwind/shadcn semantic token already wired to them
(`bg-primary`, `text-muted-foreground`, etc. — see `apps/web/CLAUDE.md` §UI System
rule 3, "no hardcoded colors"). A hex that isn't one of these is a brand violation,
full stop — not a judgment call.

## Status/semantic colors (added v1.0, confirmed live 2026-07-09)

Portal-independent — a status badge is the same color in every portal, chosen
deliberately to *not* collide with any portal's identity color (warning is
more yellow than Parent-orange `#B05A0A`; success is more vivid than
Teacher-green `#0E7A5A`). Never substitute a portal color for a status color
or vice versa.

| Status | TR | Hex | Foreground (on tint) | Tint background | Usage |
| --- | --- | --- | --- | --- | --- |
| Success | Başarı | `#16A34A` | `#15803D` | `#E7F6EC` | Saved/confirmed actions |
| Warning | Uyarı | `#D97706` | `#B45309` | `#FCEFDD` | Pending approvals |
| Error/Destructive | Hata | `#DC2626` | `#B91C1C` | `#FBE7E7` | Absences/failures, destructive actions |
| Info | Bilgi | `#4F6BFF` (= Accent Electric) | `#3A4F9C` | `#E9EDFF` | Announcements |

Rule: every status color in a web handoff must resolve to exactly one of these
four (or an existing semantic token wired to them, e.g. `bg-success`,
`text-warning-foreground`). A handoff inventing its own success/warning/error
hex, or reusing a portal color for status, is a gate-2 FLAG.

## Typography

- Font: **Plus Jakarta Sans** only (already wired in `apps/web/app/layout.tsx` as
  `--font-sans`). `JetBrains Mono` (`--font-mono`) only for numeric/technical data
  (IDs, T.C. no, dates, hour columns) — never for prose.
- Any other font family named in a handoff (Inter, Roboto, system-ui, etc.) is a
  violation — the design tool's default, not brand.

### Type scale — closed set, no ad-hoc sizes

| Token class | Size/Line | Weight · Tracking |
| --- | --- | --- |
| `text-display` | 56/64px | 800 · -3.5% |
| `text-h2` | 38/44px | 700 · -2.5% |
| `text-h3` | 24/28px | 600 · -1.5% |
| `text-body` | 17/26px | 400 |
| `text-label` | 12/18px | 500 · +8% · uppercase |

A handoff element with a font-size/weight pair that doesn't match one of these
five rows exactly is an ad-hoc combo — forbidden per `apps/web/CLAUDE.md`
("Free combinations like `text-4xl font-bold` are forbidden").

## Radius

- One `--radius: 1rem` root token (the 2026-07-09 `1.25rem` calibration was
  reverted with the 2026-07-11 web reset — `apps/web/CLAUDE.md` is the source
  of truth). Surfaces use `rounded-lg` (16px, small) or `rounded-xl` (20px,
  large) only. Pills/badges/chips → `rounded-full`.
- Logo mark geometry (`56×56px container, r14`, `14×14px modules, r3`) is a
  separate, fixed spec — never scale or restyle the mark itself; it is not a
  general UI radius token.

## Logo

- Only 3 approved variants: full logo+wordmark, mark-alone (favicon/avatar/
  sidebar), reverse-on-gradient. No stretch, skew, rotation, recolor, outline-only,
  or altered proportions/corner radii. Gradient always fixed 135°.
- Min size: 16px digital / 6mm print. Recommended 40px. Hero/app-icon 64px+.

## Tone

"Systematic, Modular, Trustworthy, Corporate, Accessible." UI copy is Turkish
(users are Turkish teachers/admins) but should read plain and professional —
brand voice is not a place to get playful or add filler copy the handoff didn't
specify.
