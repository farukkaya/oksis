# Ders Programı Faz 2.5B-3 — Mevcut Geçici Değişiklikler Listesi + Geri Al (Web) Tasarım

> Bağlayıcı spec: `.claude/specs/ders-programi-modulu-spec.md` (geçici değişiklik / ScheduleException).
> Önceki dilimler: 2.5A (backend ScheduleException — domain/persistence/handler/API),
> 2.5B-2 (web oluşturma akışı — `TemporaryChangePanel` drawer içi kompoze form).
> Backend P26/P27 **tamamen hazır** (SchedulingController + ListScheduleExceptions/RevokeScheduleException).
> Bu dilim **saf frontend** (oksis-web, branch `dersprog`).

**Hedef:** Bir programa ait **mevcut geçici değişiklikleri listele** ve her satırı **Geri Al** (soft revoke).
Böylece Debt-FE-5'in kalan parçası (liste + Geri Al → P26/P27) kapanır.

**Kullanıcı kararları (2026-06-13):**
- **Liste yeri = A (panel içi segment toggle):** `TemporaryChangePanel` üstüne `[Yeni değişiklik] [Mevcut değişiklikler (N)]` segmenti. Drawer içi kompoze form deseni sürer; tek yer.
- **Geri Al UX = 1 (satır içi onay + sebep):** "Geri Al" → satır genişler, sebep input + Onayla/Vazgeç. Ekstra modal yok (drawer üstüne modal binmez).

---

## Backend gerçeği (hazır — değiştirilmez)

- **P27** `GET /timetable/programs/{id}/exceptions?from&to&includeRevoked` → `ScheduleExceptionDto[]`.
  İzin `timetable.override`. Alanlar zaten **çözülmüş** (isimler dahil), ekstra lookup gerekmez:
  `Id, ProgramId, BranchId, Date, Type, TargetPlacementId, Day, Period, OriginalTeacherId/Name,
  NewTeacherId/Name?, OriginalRoomId/Name?, NewRoomId/Name?, Reason, IsActive, RevokedAt?, CreatedAt`.
- **P26** `POST /timetable/programs/{id}/exceptions/{eid}/revoke` body `{ reason }` → 204.
  İstisna programa ait değilse 404; zaten geri alınmışsa 409.

---

## 1. Tipler — `types.ts`

```ts
export interface ScheduleExceptionDto {
  id: string; programId: string; branchId: string;
  date: string;            // ISO (DateOnly)
  type: ScheduleExceptionType;
  targetPlacementId: string; day: number; period: number;
  originalTeacherId: string; originalTeacherName: string;
  newTeacherId: string | null; newTeacherName: string | null;
  originalRoomId: string | null; originalRoomName: string | null;
  newRoomId: string | null; newRoomName: string | null;
  reason: string;
  isActive: boolean;
  revokedAt: string | null;
  createdAt: string;
}
export interface RevokeExceptionInput { reason: string }
```

## 2. API — `api/timetableApi.ts`

- `listExceptions(programId, includeRevoked, signal?)` → `GET .../exceptions?includeRevoked=...`
  (from/to **bu dilimde gönderilmez** → tüm aralık; bkz. Debt-FE-9).
- `revokeException(programId, eid, body: RevokeExceptionInput)` → `POST .../exceptions/{eid}/revoke` (204, body döndürmez).

## 3. Query key — `keys/timetableKeys.ts`

```ts
exceptions: (schoolId, programId, includeRevoked) =>
  tenantScopedKey(schoolId, ["timetable", "exceptions", programId, includeRevoked] as const),
```

## 4. Saf yardımcılar — `lib/exceptionList.ts` (TDD)

- `describeException(e)` → `{ typeKey, fromTo }`: tipe göre değişim özeti
  (Cancellation → "—", TeacherSubstitution → `originalTeacherName → newTeacherName`,
  RoomChange → `originalRoomName → newRoomName`). i18n key + ham parça döndürür (string birleştirme view'da).
- `sortExceptions(list)` → tarihe göre artan, aynı tarihte period artan; aktifler önce.
- `canRevoke(e)` → `e.isActive` (revoked satırda Geri Al yok).
- `isRevokeReady(reason)` → `reason.trim().length > 0`.

## 5. Segment toggle — `TemporaryChangePanel.tsx`

- Panel üstüne segment: `[Yeni değişiklik] [Mevcut değişiklikler (N)]` (mevcut `.pub-seg/.pub-seg-opt` deseni).
- `view: "create" | "existing"` lokal state. `"create"` = bugünkü form (olduğu gibi).
- **N rozeti** = aktif istisna sayısı; list query (includeRevoked=false) `data.filter(isActive)` sayısı.
  Panel açılınca query çalışır (segment görünmese de sayacı göstermek için `enabled: Boolean(schoolId)`).
- Oluşturma başarıyla uygulandığında (`applyMut.onSuccess`) → `exceptions` key invalidate + segmenti
  `"existing"`e çevir (kullanıcı eklediğini listede görsün); `result` success ekranı yerine listeye dön (UX kararı, alttaki not).

## 6. Liste görünümü — `components/ExistingChangesList.tsx` (yeni)

- Props: `{ programId }`. `useQuery(exceptions key)` + `includeRevoked` state (default false).
- **Başlık satırı:** "Mevcut değişiklikler" + sağda **"Geri alınanları göster"** checkbox (includeRevoked toggle).
- **Durumlar:** loading (skeleton/loader) · error (retry) · boş ("Bu programda geçici değişiklik yok.").
- **Satır (`.tmp-item`):**
  - Sol: tarih (`gg Ay`) + gün adı/period rozeti.
  - Orta: tip etiketi (`publish.temp.type.*` yeniden kullan) + `describeException` özeti (vekalet/derslik → "eskiden → yeni"), altında sebep (italik, kısalt).
  - Sağ durum: aktif → **Geri Al** butonu; revoked → soluk + "Geri alındı" rozeti + `revokedAt` tarihi (Geri Al yok).
- **Geri Al satır-içi akışı (UX 1):** "Geri Al" → satır genişler (`.tmp-item.revoking`):
  sebep input + `Vazgeç` / `Onayla`. `Onayla` `isRevokeReady` ile gate'li.
  `revokeMut.mutate({reason})` → başarı: `exceptions` invalidate (liste + N rozeti tazelenir).
  Hata: 409 (`already-revoked`) / 404 → satır içi `.tmp-revoke-err` + i18n kod→mesaj (`getApiErrorCode`, `publish.temp` deseni).
- Aynı anda yalnız bir satır `revoking` (lokal `revokingId` state).

## 7. i18n — `publish.temp.existing.*` (tr/en)

`tabNew`, `tabExisting`, `title`, `showRevoked`, `empty`, `loading`, `loadFailed`,
`revoke`, `revokeConfirm`, `revokeReason`, `revokeReasonPlaceholder`, `confirm`, `cancel`,
`revoked`, `revokedAt`, `from` ("eskiden"), `to` ("yeni"), `cancelled` ("Ders iptal"),
`revokeFailed`. Tip etiketleri mevcut `publish.temp.type.*`'tan gelir. **Hardcoded TR yok.**

## 8. CSS — `timetable.css`

`.tmp-list / .tmp-list-head / .tmp-item / .tmp-item.revoked / .tmp-item.revoking /
.tmp-it-date / .tmp-it-body / .tmp-it-reason / .tmp-it-status / .tmp-revoke-box /
.tmp-revoke-err / .tmp-badge-revoked`. Mevcut `.tmp-*` ve `.pub-*` token/desenlerini izle; inline style yok.

## 9. Testler

- **`lib/__tests__/exceptionList.test.ts`** (saf): `describeException` (3 tip), `sortExceptions`, `canRevoke`, `isRevokeReady`.
- **`components/__tests__/ExistingChangesList.test.tsx`:** liste render (aktif/revoked), boş durum,
  Geri Al → satır içi sebep → Onayla mutation çağrısı (mock api), includeRevoked toggle query'yi değiştirir.
- Mevcut `TemporaryChangePanel.test.tsx`: segment toggle (Yeni↔Mevcut) eklenmesi.
- Tam web paketi yeşil + `npm run build` temiz (doğrulama: `superpowers:verification-before-completion`).

---

## Kapsam dışı / Debt

- **Debt-FE-9 (tarih filtresi):** P27 `from`/`to` desteklerini bu dilim göndermez (tüm aralık + revoked toggle yeterli).
  Hacim büyürse tarih aralığı filtresi sonraki iş.
- **Bildirim yansıması:** revoke domain event'i fırlatır ama dağıtım Faz 2.6 (Debt-BE-3) — bu dilimde UI bildirimi yok.
- **Tüketici overlay tazeleme:** revoke yalnız `*/today` overlay'ini etkiler (yayınlanmış snapshot değişmez);
  admin tarafında consumer query'leri yok → ekstra invalidation gerekmez.
- Mobile kapsam dışı.

## Akış
brainstorming (✅ kararlar alındı) → bu plan → TDD+incremental (saf lib önce, sonra API/key, sonra component, sonra segment) →
review → commit (OKSİS format; fix değil feature → commit kuralı normal, yine de kullanıcı onayıyla).
İlgili: [[feedback_default_workflow]] · [[feedback_frontend_first_debt]] · [[project_ders_programi]].

---

## Task dökümü (sıra)

| # | Task | Kabul ölçütü |
|---|---|---|
| 1 | `types.ts`: `ScheduleExceptionDto` + `RevokeExceptionInput` | tsc temiz, backend DTO ile 1:1 |
| 2 | `lib/exceptionList.ts` + test (TDD) | `describeException/sortExceptions/canRevoke/isRevokeReady` testleri yeşil |
| 3 | `timetableApi.ts`: `listExceptions` + `revokeException` | doğru path/method; 204 void |
| 4 | `timetableKeys.ts`: `exceptions` key | tenant-scope'lu, includeRevoked dahil |
| 5 | `ExistingChangesList.tsx` + CSS + i18n | liste/boş/loading/error + satır-içi Geri Al akışı render |
| 6 | `ExistingChangesList.test.tsx` | render + revoke akışı + includeRevoked toggle yeşil |
| 7 | `TemporaryChangePanel.tsx`: segment + N rozeti + apply sonrası listeye dönüş | toggle çalışır; panel testi güncel |
| 8 | Tam paket + build doğrulama; completion_status + api-contracts not güncelle | tüm vitest yeşil, `npm run build` temiz |
</content>
</invoke>
