# Ders Programı — Faz 1B (Admin Hub Web) — Tasarım & Plan

**Katman:** `oksis-web` · **Bağlayıcı spec:** `.claude/specs/ders-programi-modulu-spec.md`
**Önkoşul:** Faz 1A backend (PR #23, master'a merge) ✅
**Tarih:** 2026-06-12 · **Kapsam:** Bu oturum = **Hub ekranı** (`schedule.jsx` Sınıf merceği). Editör (`schedule_editor.jsx`) sonraki oturum.

> Brainstorming kararları (kullanıcı onaylı, 2026-06-12):
> 1. **Gerçek API** (settings/rooms deseni — httpClient + React Query + tenant key).
> 2. **dnd-kit** editör için (sonraki oturum).
> 3. Faz 2/3 tasarım öğeleri → **disabled + "Yakında"**.
> 4. **Önce Hub, sonra Editör** — bu oturum yalnız Hub.

---

## 1. Hedef

Spec §9.1 Admin Hub: sınıf bazlı program listesi (durum, yerleşim sayısı), filtre+arama+sayfalama → URL search params, dört durum varyantı (boş/yükleniyor/hata/dolu). Eski `src/app/pages/admin/ScheduleManagement.tsx` (Figma scaffold) yerine geçer; route `/admin/schedule`.

## 2. Konum & yapı (subjects/classrooms desenine birebir)

```
src/portals/admin/timetable/
  ScheduleHubPage.tsx              # ekran kökü; URL state + React Query orkestrasyonu
  types.ts · index.ts · timetable.css
  api/timetableApi.ts              # GERÇEK API → httpClient
  keys/timetableKeys.ts            # tenant-prefixed (schoolId)
  hooks/useHubData.ts              # programs + summary + branch/term join (React Query)
  hooks/useProgramMutations.ts     # createProgram
  lib/derive.ts                    # BranchId→sınıf+kademe join + filtre/arama saf fonksiyonları
  components/
    SummaryStrip.tsx · LensTabs.tsx · ClassProgramsTable.tsx · HubToolbar.tsx
    StatusDot.tsx · NewProgramModal.tsx · RowMenu.tsx
    states/EmptyState.tsx
  __tests__/  derive.test.ts · ScheduleHubPage.test.tsx · NewProgramModal.test.tsx · RowMenu.test.tsx
```

## 3. Veri katmanı (gerçek API)

| İhtiyaç | Kaynak | Uç |
|---|---|---|
| Program listesi | timetable | `GET /api/v1/timetable/programs?termId=&page=` → `ClassProgramListItemDto[]` |
| Özet sayaçlar | timetable | `GET /api/v1/timetable/summary?termId=` → `HubSummaryDto` |
| Program oluştur | timetable | `POST /api/v1/timetable/programs` (CreateProgram) → `Guid` |
| Sınıf/şube çözümü (BranchId→"9-A"+kademe) | classrooms | mevcut `/class-rooms` sorgusu (`classroomsApi`) |
| Dönem listesi/aktif dönem | academic-sessions | mevcut `academicSessionsApi` |

- React Query key'leri `schoolId` önekli (`useAuthStore`). ProblemDetails hata yüzeyi `shared/api`.

## 4. UI (tasarımdan uyarlanmış — Sınıf merceği)

- **Üst aksiyon:** "Yeni Program" (aktif) · "Otomatik Oluştur" (disabled, `Yakında · Faz 3`).
- **Özet şeridi:** Yayında / Taslak (summary DTO). *Çakışma / Eksik-saat → backend vermiyor, omit (§6).*
- **3 mercek sekmesi:** Sınıf (aktif) · Öğretmen · Derslik (disabled, `Yakında · Faz 2`).
- **Tablo kolonları:** Sınıf/Şube · Kademe · Durum · Yerleşim sayısı (`PlacementCount`) · aksiyonlar (Aç / RowMenu).
- **Durum varyantları:** boş (CTA "İlk Programı Oluştur") · yükleniyor (skeleton) · hata (ProblemDetails) · dolu.
- **Filtreler:** arama + kademe + durum → **URL search params** (React Router `useSearchParams`).

## 5. Editör seam (bu oturum)

"Yeni Program" → sınıf seç modalı → `POST /programs` → `/admin/schedule/:id/edit` route'una yönlendir. Bu route bu oturumda geçici **"yapım aşamasında" placeholder** render eder (editör sonraki oturum). "Aç" satır aksiyonu da aynı route'a gider. Eski `ScheduleBuilder.tsx` route'u korunur/kaldırılır — implementasyonda netleşir.

## 6. ⚠️ Spec dışına çıkılan / Debt (completion_status'a yazılacak)

- **Debt-FE-1:** Hub'da çakışma rozeti + eksik-saat rozeti (tasarım §9.1, spec §9.1 betimsel) **gösterilmiyor** — Faz 1A Hub DTO'ları vermiyor ("sonraki fazda zenginleştirilir"). Bağlayıcı kabul kriteri §11 Hub için bunları şart koşmuyor (yalnız durum varyantı + URL filtre). Backend list-DTO zenginleştirme = Faz 2.
- **Debt-FE-2:** Sürüm / son güncelleme / "kim" kolonları omit — DTO'da yok.
- Mevcut entegrasyon deseni (gerçek API) korundu; mock-first'e sapılmadı.

## 7. Test (vitest, TDD)

- `derive.test.ts`: BranchId→sınıf join, kademe filtre, durum filtre, arama (tr-locale).
- `ScheduleHubPage.test.tsx`: dört durum varyantı + URL search-param senkronu.
- `NewProgramModal.test.tsx`: sınıf seçimi → create akışı (mutation mock).
- `RowMenu.test.tsx`: aksiyon/disabled durumları.

## 8. Kabul kriterleri (bu oturum)

- [ ] `/admin/schedule` yeni `ScheduleHubPage` render eder; eski `ScheduleManagement` kaldırıldı.
- [ ] Programlar + özet gerçek API'den, tenant-key'li; sınıf adı/kademe classrooms join'inden.
- [ ] Dört durum varyantı; arama+kademe+durum filtreleri URL search-param ile.
- [ ] Faz 2/3 öğeleri disabled + "Yakında" tooltip.
- [ ] "Yeni Program" → create → editör route placeholder'a yönlendirir.
- [ ] Tüm yeni testler yeşil; `npm run build` temiz.
- [ ] `timetable/completion_status.md`: ilerleme + Debt-FE-1/2 güncel.
