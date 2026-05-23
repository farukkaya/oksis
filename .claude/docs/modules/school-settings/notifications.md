# Okul Ayarları — Notifications & Events

> Domain event akışları + kullanıcıya giden bildirimler.

> Genel matriks: `notification-matrix.md`.

---

## Domain Event'ler

### `SchoolSettingsCreatedEvent`

**Tetik:** `SchoolSettings.CreateDefault(schoolId)` factory metodu — `SchoolCreatedEvent` handler'ından çağrılır.

**Handler:** Şimdilik aktif handler yok; Sprint 2+ audit log için kullanılacak.

### `SchoolSettingsUpdatedEvent(SchoolId, SectionName)`

**Tetik:** `SchoolSettings.Update*` davranışlarından her biri.

**SectionName değerleri:** `UpdateBasicInfo`, `UpdateContactInfo`, `UpdateAddress`, `UpdateTheme`, `UpdateAcademicStructure`.

**Handler:** Sprint 2+ `AuditLogHandler` — `audit_logs` tablosuna detaylı diff yazar.

### `BellScheduleChangedEvent(SchoolId)`

**Tetik:** Bell schedule bulk update sonrası `SchoolSettings.RaiseBellScheduleChanged()`.

**Handler:** Sprint 2+ — Schedule modülünün cache'ini invalidate eder.

---

## Kullanıcı Bildirimleri

MVP'de Okul Ayarları işlemleri **kullanıcıya push bildirimi tetiklemez** — tipik admin self-service. İstisnalar:

| Senaryo | Bildirim | Kanal | Öncelik |
|---|---|---|---|
| Modül **devre dışı** bırakıldı (örn. messaging) | Okul kullanıcılarına InApp banner | InApp | `Normal` |
| Bildirim tipi default kanal değişti | — (kullanıcı zaten Profil ayarlarından izleyebilir) | — | — |
| Tema/logo değişti | — | — | — |
| Resmi/okul tatil günü eklendi | Hedef sınıflara InApp | InApp | `Low` |

> Push olmaması bilinçli karar — ayar değişiklikleri admin işi, son kullanıcıyı bombalamamak için.

---

## Cooldown & Sessiz Saatler

Bu modülün kullanıcı bildirimi neredeyse olmadığı için cooldown/quiet hours geçerli değil. Sadece InApp banner'lar olur, otomatik 24 saat sonra arşivlenir.

---

## Audit Trail

Tüm `SchoolSettings*` event'leri Sprint 2+ audit log handler'ı tarafından dinlenir. Tablo: `audit_logs (id, school_id, user_id, event_type, resource_id, before_json, after_json, occurred_at, correlation_id)`.

Filtreleme: Admin paneli üzerinden `event_type LIKE 'SchoolSettings%'`.
