# Frontend Test Kuralları

> [!info] Belge bilgisi
> **Amaç:** `oksis-ui` içinde neyin, hangi araçla, nerede test edildiğini ve yerel kapıları tanımlamak.
> **Son doğrulama:** 2026-09-13. `oksis-ui` master `ec9ea8c`.
> **Kaynak:** `packages/{core,api,api-mocks}/{package.json,vitest.config.ts}`, test dosyası sayımı, `.githooks/pre-push`, `turbo.json`, `oksis-ui/CLAUDE.md` (Workflow, Handoff intake).

İlgili notlar: [[mimari-ve-katmanlar]] · [[tech-stack]] §7

---

## 1. Araç ve kapsam

| Paket | Çalıştırıcı | Ortam | Desen | Test dosyası |
|---|---|---|---|---|
| `packages/core` | vitest ^2.1.9 | `node` | `src/**/*.test.ts` | 21 |
| `packages/api` | vitest ^2.1.9 | `node` | `src/**/*.test.ts` | 28 |
| `packages/api-mocks` | vitest ^2.1.9 | `node` | `src/**/*.test.ts` | 8 |
| `apps/web` | **yok** | — | — | 0 |
| `apps/mobile` | **yok** | — | — | 0 |

- Test dosyası, test ettiği dosyanın yanına yazılır: `logic.ts` ile `logic.test.ts` aynı klasördedir.
- Kökte ve `turbo.json` içinde `test` görevi **yok**. Testler paket bazında çalıştırılır:

```bash
npm run test -w @workspace/core
npm run test -w @workspace/api
npm run test -w @workspace/api-mocks
```

## 2. Ne test edilir

| Katman | Test edilen şey | Neden burada |
|---|---|---|
| `core/*/logic.ts` | Saf iş kuralları (çakışma, eşik, hesap) | `core` saf TS'dir, mock gerekmez |
| `core/*/schemas.ts` | Alanlar arası kurallar (`superRefine`) | Web ve mobil aynı şemayı kullanır |
| `api/*/endpoints.ts` | Tel → görünüm eşlemesi, enum eşleme, zarf açma | Backend şekli değişirse kırılma burada görünmeli |
| `api/client/*` | Refresh (single-flight, gövdeli istek tekrarı), hata sınıflandırma, query key'ler, 403 izin listesi, yazma kuyruğu | Sözleşme davranışı: `mutation-error.test.ts`, `auth-refresh.test.ts` gibi dosyalarla sabitlenir |
| `api-mocks` | Handler davranışı | Mock'lar da sözleşmedir |

- Bir hata düzeltildiğinde **ölçülen davranış bir testle sabitlenir.** Emsal: 403 cümle geçirme ayrımı `mutation-error.test.ts` içinde sabitlenmiştir.
- Mock fixture'ları üretilen DTO tipleriyle tiplenir. Mock'un şemadan sapması, test geçse bile hatadır (bkz. [[api-sozlesmesi]] §2).

## 3. Arayüzün doğrulanması

Uygulama katmanında otomatik test olmadığı için arayüz değişikliği şöyle doğrulanır:

1. `npm run typecheck`. `packages/*` değişikliği **iki uygulamada da** geçmelidir.
2. `npm run lint`. Katman sınırları ve `X-01` / `X-08` hata kuralları burada yakalanır.
3. Tasarım teslimiyle görsel karşılaştırma (handoff adım 6).
4. Web için `apps/web/.claude/skills/verify` skill'i vardır.

## 4. Yerel kapı

- `.githooks/pre-push` şunları çalıştırır: `npm run lint` ve `npm run typecheck`.
  - **Testler bu kancada yok.** Bu bilinçli bir tercihtir: kancanın amacı "master hiç kırmızı olmasın" garantisidir. Yavaş bir kanca `--no-verify` ile atlanmaya başlar.
- Etkinleştirme (bir kez): `git config core.hooksPath .githooks`.
- `oksis-ui` için CI yoktur.

## 5. Açık kararlar ({{TBD}})

- `apps/web` bileşen/e2e testi kurulacak mı, hangi araçla? {{TBD}}
- `apps/mobile` test çalıştırıcısı kurulacak mı? {{TBD}}
- Kök `turbo` `test` görevi eklenecek mi? {{TBD}}

## 6. Eski belgelerden alınmayanlar

| Eski iddia | Bugünkü gerçek |
|---|---|
| "Login ve yoklama formu gibi kritik yollar test edilmeden geçmez" | Uygulama katmanında test çalıştırıcı yok |
| `data-testid` kuralları | Kodda kullanılmıyor |
| Mobil jest, `npm test` | Yok |
