# Ders Programı — Faz 2.5C: Geçici Değişiklikler Katmanı (tepsi + 3 katmanlı geri-al) — Tasarım

**Tarih:** 2026-06-14
**Katman:** `oksis-web` (frontend-first) · backend = Faz 2.5A uçları yeniden kullanılır
**Tasarım kaynağı:** `Oksis Layout-handoff (1).zip` (2026-06-14) →
`app/schedule_temp_changes.jsx` (+ `.css`), handoff README §6/§7
**Bağlayıcı spec:** `.claude/specs/ders-programi-modulu-spec.md` — geçici değişiklik UX'i
Faz 2 yol-haritası seviyesinde; madde-seviye çakışma YOK (yalnızca completion_status'a
sapma kaydı gerekir).
**İlgili önceki plan:** `2026-06-13-ders-programi-faz2-5b3-degisiklik-listesi-geri-al.md`
(ertelenmiş "liste + geri al") — bu tasarım onu **gerçekleştirir ve genişletir**.

---

## 0. Kapsam

Yalnızca **A grubu** (handoff'un iki bağımsız grubundan ilki). B grubu
(Çoğalt / Sürüm geçmişi / PDF / Sil — `schedule_more_actions.jsx`) **sonraki dilim**, bu
tasarıma dahil değil.

### Dahil
- Editör hücre menüsü → zengin **Vekil Öğretmen Ata** / **Dersi İptal Et** modalları.
- Editör grid üstünde **"Geçici değişiklikler" tepsisi**.
- **Geçici Yayınla** akışı (onay → yayınlanıyor → başarı + geri-al penceresi/halka sayaç).
- **Üç katmanlı geri-al** (taslak tek / yayın-sonrası pencere / yayınlanmış tek).
- Hücre durum işaretleri: teal **VEKİL** rozeti (asıl öğretmen üstü çizili), kırmızı taramalı
  **İPTAL**, yayınlanmışta yeşil nokta.
- i18n (tr/en) tüm yeni string'ler.

### Hariç (bu dilimde değil)
- B grubu (Çoğalt/Sürüm/PDF/Sil).
- Geçici değişiklik **bildirim dağıtımı** (Debt-BE-3, Faz 2.6) — toggle'lar UI-only kalır.
- **Telafi dersi** backend'i (aşağıda yeni Debt) — toggle UI-only.
- Atomik toplu-uygula ucu (Debt-FE-11 korunur).

---

## 1. Yönetişim kararları (kullanıcı onaylı — 2026-06-14)

- **D1 — Dilimleme:** Önce A, sonra B. Her grup kendi spec→plan→TDD→commit döngüsü.
- **D2 — Taslak yeri:** Geçici-değişiklik taslakları **yalnızca FE state** (editörün tamponlu
  modeliyle aynı felsefe). Yeni backend durumu/migration YOK. Yayınlanmamış taslaklar sayfa
  yenilemede uçar (kabul edildi). Yayınlanmışlar P26'dan yeniden yüklenir → yenilemeye dayanıklı.
- **D3 — PublishDrawer:** Mevcut "Geçici değişiklik" yolu **kodda dokunulmadan, bağımsız** kalır
  (`PublishDrawer.tsx`, `useTempActions`, `PublishDrawer.test.tsx` aynen). Coexistence modeli (§6).
- **D4 — Toggle'lar (telafi + bildirim):** Tasarım 1:1 portlanır; backend borçlu → **UI-only Debt**
  ([[feedback_frontend_first_debt]]).

---

## 2. Backend (yeniden kullanım — yeni iş YOK)

Faz 2.5A uçları birebir kullanılır:

| İş | Uç (mevcut) |
|---|---|
| Müsait vekil öğretmen önerisi | **P28** `GET .../available-teachers?day&period` |
| Geçici değişiklik oluştur (yayınla) | **P25** `POST .../exceptions` (Cancellation / TeacherSubstitution) |
| Mevcut istisnaları listele (tepsi "Yayında") | **P26** `GET .../exceptions?from&to` |
| Geçici değişikliği geri al | **P27** `POST .../exceptions/{eid}/revoke` |
| Yayınlanmış snapshot (hücre bağlamı) | P17 `branches/{id}/weekly` (editör zaten programı yükler) |

> Geçici aksiyonlar yalnız **Published** programda mümkün (mevcut `canTemp = isPublished && !tempLocked`
> guard'ı korunur). `RoomChange` istisna tipi bu menüde **yok** (tasarımda yalnız Vekil + İptal);
> derslik değişikliği kalıcı editör aksiyonu olarak kalır.

---

## 3. Veri modeli — `useTempChanges` (yeni saf store)

Mevcut `tempActions.ts`'in sade modeli yetersiz (tarih/sebep/bildirim taşımıyor) ve o
**PublishDrawer'a bağlı** (dokunulmaz). Bu yüzden **ayrı yeni** saf modül + hook:
`editor/lib/tempChanges.ts` + `editor/hooks/useTempChanges.ts`.

```ts
type TempKind = "sub" | "cancel";
type WhenWeek = "this" | "next";

interface TempChange {
  key: string;          // placementId (hücre kimliği — tek aktif geçici değişiklik/placement)
  type: TempKind;
  dayIdx: number;       // 0..4
  period: number;
  subName: string;      // ders adı (lookup)
  color?: string;       // branş rengi (varsa)
  origTeacher: string;  // asıl öğretmen adı
  when: WhenWeek;
  dateLabel: string;    // "15 Haz" gibi gösterim
  date: string;         // P25 için ISO (haftadan + günden hesaplanır)
  reason: string;
  teacher?: string;     // sub: vekil öğretmen adı
  newTeacherId?: string;// sub: P25 için
  makeup?: boolean;     // cancel: telafi (UI-only Debt)
  notify: { t: boolean; s: boolean; p: boolean }; // UI-only Debt
  published: boolean;
  exceptionId?: string; // publish sonrası P25'ten döner; P27 revoke için
}

type TempState = Record<string /*placementId*/, TempChange>;
```

Saf reducer'lar (TDD): `addSub`, `addCancel`, `removeDraft`, `markPublished(keys, ids)`,
`undoAllPublished`, `loadPublished(fromP26)`, türevler `draftCount`/`pubCount`,
`toExceptionBody(change)` (per-change tarih — Debt-FE-11 döngüsü).

> Tarih hesabı: "bu hafta/gelecek hafta" + `dayIdx` → ISO. Saf yardımcı `resolveDate(when, dayIdx, now)`
> (now enjekte edilir → test edilebilir; `Date.now()` doğrudan kullanılmaz).

---

## 4. Bileşenler (tasarım prototipini 1:1 port — shadcn/Tailwind, inline-style yok)

| Bileşen | Kaynak (prototip) | Not |
|---|---|---|
| `SubstituteModal` | `SubstituteFlow` | bu/gelecek hafta · sebep çipleri · P28 vekil listesi (uygunluk rozeti, `busy` disabled, "aynı branş" işareti) · bildirim toggle'ları · "yalnız bugün geçerli" notu |
| `CancelLessonModal` | `CancelLessonFlow` | bu/gelecek hafta · sebep çipleri · **telafi planla** toggle · bildirim · iptal notu |
| `TempChangesPanel` (tepsi) | `TempChangesPanel` | grid üstü; satır = ikon + gün/ders/branş + özet + Taslak/Yayında rozeti + satır **Geri al**; başlık **Geçici Yayınla (N)** |
| `TempPublishModal` | `TempPublishFlow` | confirm (liste + etki kutuları) → publishing (spin) → done + **geri-al penceresi** (8 sn halka SVG sayaç) / "süre doldu" |
| Hücre işaretleri | grid stilleri | `GridCell`/`WeekGrid`: VEKİL (teal) · İPTAL (kırmızı taramalı) · yayınlanmış yeşil nokta |

Ortak alt-bileşenler (prototipteki `TCDatePick`/`TCReasons`/`TCNotify`) paylaşılan küçük
parçalar olarak çıkarılır. CSS: editör modül CSS desenine uygun (`editor.css` veya yeni
`tempChanges.css`, modül-içi; global değil).

---

## 5. Üç katmanlı geri-al

- **(a) Taslak tek geri-al** — tepsi satırı / hücre → `removeDraft(key)` (yalnız FE; sunucu yok).
- **(b) Yayın-sonrası pencere** — `TempPublishModal` done adımında 8 sn "Geri Al" → bu yayında
  oluşturulan tüm `exceptionId`'leri **P27 revoke** + `undoAllPublished` ile taslağa döndür.
- **(c) Yayınlanmış tek geri-al** — tepsideki "Yayında" satırı → **P27 revoke** + state'ten düş.

---

## 6. Coexistence (PublishDrawer dokunulmaz)

- **Hücre menüsü = yeni zengin akışın TEK tetikleyicisi** → `useTempChanges` tepsi store'u.
- **PublishDrawer.tsx + `useTempActions` + testleri aynen kalır** (bağımsız, kodda korunur).
- Hücre menüsü artık `useTempActions` yerine yeni store'u beslediğinden drawer'ın geçici listesi
  pratikte **boş** kalır — kod/görsel bozulmaz, aktif geçici-yazma yüzeyi tepsiye taşınır.
- `ScheduleEditorPage`: `temp = useTempActions()` çağrısı + `tempLessonInfo` + drawer'a geçirilen
  `tempActions/onTempApplied` prop'ları **korunur** (drawer bağımsız çalışsın). Yeni `useTempChanges`
  + tepsi + modallar **eklenir**; guard'lar (`tempLocked`/`permLocked`/`canTemp`) yeni store'a göre
  yeniden bağlanır (`permLocked = tempChanges.hasTemp`).

---

## 7. i18n

Yeni namespace alanları `timetable.temp.*` (modal başlıkları, sebep listeleri, tepsi, publish,
undo, hücre rozetleri) — tr/en. Hardcoded Türkçe YASAK (hard-ban). Sebep listeleri
(`TC_SUB_REASONS`/`TC_CANCEL_REASONS`) i18n anahtarlarına taşınır.

---

## 8. Test (TDD)

1. Saf reducer'lar: `tempChanges.ts` (add/remove/markPublished/undoAll/loadPublished/toExceptionBody)
   + `resolveDate`.
2. Modallar: `SubstituteModal` (P28 listesi, busy disabled, valid gate), `CancelLessonModal`
   (telafi toggle, valid).
3. `TempChangesPanel`: taslak/yayında ayrımı, satır geri-al, Geçici Yayınla görünürlüğü.
4. `TempPublishModal`: confirm→publishing→done akışı, undo penceresi sayaç, undo-all.
5. Hücre işaretleri: VEKİL/İPTAL/yeşil-nokta render.
6. Entegrasyon: editör sayfasında hücre menüsü → modal → tepsi → yayınla → undo katmanları.

**Doğrulama kapısı:** tam web paketi **yeşil** + `npm run build` **temiz**.

---

## 9. completion_status'a yazılacak sapmalar/Debt

- **Sapma (2026-06-14):** Geçici değişiklik UX'i **tepsi-merkezli** modele geçti (2.5B'nin
  publish-drawer gating'i KORUNDU ama aktif yazma yüzeyi tepsiye taşındı). Onay: kullanıcı.
- **Debt-FE-yeni (telafi):** "Telafi planla" toggle UI-only; backend'de telafi kavramı yok.
- **Debt-BE-3 (bildirim)** sürüyor: bildirim toggle'ları UI-only; dağıtım Faz 2.6.
- **Debt-FE-11** (toplu uygula atomik değil) korunur — Geçici Yayınla P25 döngüsü.
- **Debt-D2 (taslak kalıcı değil):** yayınlanmamış taslaklar yenilemede kaybolur (karar D2).

---

## 10. Kabul kriterleri

- [ ] Hücre menüsü (yalnız Published + !tempLocked) → Vekil/İptal zengin modalları açılır.
- [ ] Vekil modalı P28 ile branşa-uygun müsait öğretmenleri listeler; `busy` seçilemez.
- [ ] Onaylanan aksiyon tepsiye **Taslak** olarak düşer; hücre VEKİL/İPTAL işaretine geçer.
- [ ] Geçici Yayınla: taslaklar P25 ile oluşturulur, dönen id'ler saklanır, tepside **Yayında** olur.
- [ ] Üç katmanlı geri-al çalışır (taslak tek / yayın-sonrası pencere P27 / yayınlanmış tek P27).
- [ ] Editör açılışında P26 ile mevcut hafta istisnaları "Yayında" satırları olarak yüklenir.
- [ ] PublishDrawer kodu/testleri değişmez; bağımsız kalır.
- [ ] Tüm string i18n (tr/en); tam web paketi yeşil; `npm run build` temiz.
- [ ] `completion_status.md` güncellenir (sapma + Debt).
</content>
</invoke>
