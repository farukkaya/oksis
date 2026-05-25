# Okul Ayarları — Notifications (Güncellenmiş)

> Mevcut event'ler korunur, 2 yeni event eklenir.

---

## Mevcut Domain Event'ler (değişmez)

- `SchoolSettingsCreatedEvent` — aggregate ilk oluşturulduğunda (handler: yok, Sprint 2+ audit)
- `SchoolSettingsUpdatedEvent(SchoolId, SectionName)` — her `Update*` çağrısında
- `BellScheduleChangedEvent(SchoolId)` — zil programı değişikliğinde

---

## Yeni Domain Event'ler

### `AcademicPolicyUpdatedEvent(SchoolId)`

**Tetik:** `SchoolSettings.UpdateAcademicPolicy(...)` çağrıldığında.

**Handler'lar:**
- Cache invalidation: `oksis:tenant:{schoolId}:grade-scale-resolver`, `oksis:tenant:{schoolId}:academic-policy`
- Sprint 2+ audit log

**Kullanıcı bildirimi:** Yok — admin self-service, push gereksiz.

### `SchoolGradeLevelsChangedEvent(SchoolId)`

**Tetik:** `PUT /grade-levels` sonrası kademe aktive/deaktive edildiğinde.

**Handler'lar:**
- `academic-sessions` modülü: şube oluşturma dropdown cache invalidation
- Sprint 2+ audit log

**Kullanıcı bildirimi:** Yok.

### `SchoolGradeLevelScaleChangedEvent(SchoolId, GradeLevelId)`

**Tetik:** `PUT /grade-level-scales` sonrası seviye bazlı skala değiştiğinde.

**Handler'lar:**
- `marks` modülü (Sprint 2): grade scale resolver cache invalidation
- Sprint 2+ audit log

**Kullanıcı bildirimi:** Yok.

---

## Kullanıcı Bildirimleri (değişmez)

MVP'de Okul Ayarları işlemleri kullanıcıya push bildirimi tetiklemez — tipik admin self-service. İstisnalar:

| Senaryo | Bildirim | Kanal |
|---|---|---|
| Modül devre dışı bırakıldı | Okul kullanıcılarına InApp banner | InApp |
| Resmi/okul tatil günü eklendi | Hedef sınıflara InApp | InApp |

> Push olmaması bilinçli karar — ayar değişiklikleri admin işi.

---

## Audit Trail (değişmez)

Tüm `SchoolSettings*` event'leri Sprint 2+ audit log handler'ı tarafından dinlenir.