# Ders Programı Faz 2 — Yayın & Dağıtım Implementation Plan

> **For agentic workers:** İş küçük dikey dilimler halinde yürütülür. Her dilim TDD → implementasyon → review → test/build → dokümantasyon güncellemesi döngüsünden geçer.

**Goal:** Faz 1'de tamamlanan `ScheduleProgram` + Admin Hub/Editör çekirdeğinin üzerine Faz 2 kapsamını eklemek: yayın/snapshot, geçici değişiklik, öğretmen/öğrenci/veli salt-okunur görünümleri, bildirim/SignalR dağıtımı ve handoff'taki `schedule_publish.jsx` akışı.

**Kaynaklar:**
- İhtiyaç analizi: `/Users/farukkaya/Downloads/Oksis_Ders_Programi_Ihtiyac_Analizi.docx`
- Teknik analiz: `/Users/farukkaya/Downloads/Oksis_DersProgrami_Teknik_Analiz.docx`
- Handoff: `/Users/farukkaya/Downloads/Oksis Layout-handoff.zip`
- Bağlayıcı spec: `.claude/specs/ders-programi-modulu-spec.md`
- Modül durumu: `.claude/docs/modules/timetable/completion_status.md`

**Faz 2 kabul çıktısı:** Program sunucu tarafı yayın kapısından geçerek sürümlenir; taslak alt rollere sızmaz; teacher/student/parent portal ekranları yalnız yayınlanmış programı okur; geçici değişiklik kalıcı programı kirletmeden uygulanır; bildirim/SignalR altyapısı gerçek veya port arkasında açık Debt ile bağlanır.

---

## Dilim 2.1 — Yayınlama Çekirdeği (Backend)

- [x] Domain: `ScheduleVersion` / snapshot modeli ve `ScheduleProgram.Publish(...)` durum geçişi.
- [x] Domain event: `ScheduleProgramPublishedEvent` (SchoolId, ProgramId, BranchId, TermId, Version, affected summary).
- [x] Application: `GetPublishPreviewQuery` — doğrulama kapısı + etki/diff özeti.
- [x] Application: `PublishProgramCommand` — sunucu tarafı publish gate, transaction, snapshot, status/version update.
- [x] API: `GET /api/v1/timetable/programs/{id}/publish-preview`, `POST /api/v1/timetable/programs/{id}/publish`.
- [x] Tests: domain publish/version, handler conflict/not-found/success, publish preview testi.

## Dilim 2.2 — Admin Yayınla UI

- [x] `schedule_publish.jsx/css` hifi davranışı mevcut UI desenlerine port edilir.
- [x] Hub satırı ve editör üst şeridi aynı `PublishFlow` komponentini açar.
- [x] Çakışma varsa yayın engelli; yalnız eksik saat varsa "Yine de Yayınla".
- [x] Kanal seçimi ve sürüm notu API payload'ına bağlanır.
- [x] Tests: publish drawer gate, confirm, API mutation, error state.

## Dilim 2.3 — Yayınlanmış Program Okuma Modelleri

- [x] Backend query: `GetBranchWeekly`, `GetTeacherWeekly`, `GetTeacherToday`.
- [x] Backend query: `GetStudentWeekly/Today`, `GetParentChildSchedule`.
- [x] Scope/IDOR: Teacher yalnız kendi dersleri, Student kendi şubesi, Parent kendi çocuğu (`ParentStudentRelationship` + `CanViewInfo` kontrolü).
- [x] Taslaklar hiçbir tüketici endpoint'inde dönmez (yalnız `ScheduleVersion` snapshot okunur).
- [x] "Bugün/şu anki/sıradaki ders" okul-yerel saat dilimine göre (`IDateTimeProvider` + `School.TimeZone`); UTC değil.
- [x] Tests: published-only, cross-scope forbidden, no-version NotFound, okul-yerel today süzme (8 birim test).

## Dilim 2.4 — Web Tüketici Ekranları

- [x] Teacher portal `Programım`: bugün/sıradaki ders + haftalık.
- [x] Student portal `Programım`: bugün + haftalık.
- [x] Parent portal: çocuk seçimi + çocuğun gün düzeni/haftalık programı.
- [x] Paylaşılan `PublishedScheduleView` (loading/empty/not-published/error/403 + bugün paneli + haftalık ızgara).
- [x] i18n: tüm string'ler `timetable.consumer.*` namespace'inde (tr/en), hardcoded Türkçe yok.
- [x] Tests: `PublishedScheduleView` (5) + 3 sayfa durum varyantları (9) = 14 vitest.

## Dilim 2.5 — Geçici Değişiklik

- [ ] Domain: `ScheduleException` (date, type, override payload, reason).
- [ ] Application/API: preview/create/revert endpoints.
- [ ] Publish drawer "Geçici değişiklik" yolu backend'e bağlanır.
- [ ] Read queries published snapshot + date exception overlay uygular.

## Dilim 2.6 — Bildirim / SignalR Dağıtımı

- [ ] Publish/exception event'lerinden etkilenen kişi kümesi hesaplanır.
- [ ] In-app notification gerçek altyapıya bağlanır; eksik kanal varsa port/stub + Debt.
- [ ] SignalR fan-out: ilgili user/class/teacher grupları.
- [ ] Idempotency: aynı yayın için tekrar bildirim engeli.

## Her Dilim Sonu

- [x] `dotnet test` ilgili unit/integration subset.
- [x] `npm run test` ilgili frontend subset veya ortam kısıtı notu.
- [x] `npm run build` / `dotnet build` mümkünse.
- [x] `.claude/docs/modules/timetable/completion_status.md` güncel.
- [x] Gerekirse `api-contracts.md`, `domain-model.md`, `database-schema.md`, `ui-flows.md` güncel.
