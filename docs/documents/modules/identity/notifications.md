# Kimlik Doğrulama — Notifications & Audit

> Bu modülün domain event → audit / bildirim eşleştirmeleri. Kaynak: teknik analiz Bölüm 13, 14.
> Genel akış için bkz. `backend/notification-rules.md` (teknik) ve `notification-matrix.md` (içerik).

---

## Audit (Serilog → Elasticsearch)

Tüm authentication/switch olayları **structured log** olarak Elasticsearch'e yazılır (Kibana'da incelenir). Her log `CorrelationId`, `SchoolId`, `AccountId`, `Channel` taşır. Identifier ve TCKN **maskelenir**. `Console.WriteLine` **yasak**. MediatR notification handler'ları her domain event'ten ilgili audit kaydını üretir.

| Domain Event | Audit | Kullanıcı Bildirimi |
|---|---|---|
| `LoginSucceeded` | ✅ | — (opsiyonel "yeni cihazdan giriş") |
| `LoginFailed` / `LoginRateLimited` | ✅ | — |
| `AccountLocked` | ✅ | Admin uyarısı (opsiyonel) |
| `PasswordResetRequested` | ✅ | Reset linki (Email/Sms) |
| `PasswordChanged` | ✅ | "Parolanız değişti" bilgilendirme |
| `ProfileSwitched` / `ChildContextSwitched` / `SeasonSwitched` | ✅ | — |
| `LoggedOut` / `AllSessionsLoggedOut` | ✅ | — |
| `SuspiciousTokenReuse` | ✅ (güvenlik alarmı) | Forced logout (SignalR) |
| `PermissionDenied` | ✅ | — |
| `LoginBlockedDueToSuspension` | ✅ | — |

---

## Gerçek Zamanlı Forced Logout (SignalR)

KVKK: consent geri çekilince / suspend edilince **tüm oturumlar anlık logout** (teknik analiz 8.3).

- **`SessionHub`** — kullanıcı bağlanınca `account:{accountId}` grubuna katılır.
- `AllSessionsLoggedOut`, `PasswordChanged`, `AccountSuspended`, `SuspiciousTokenReuse` → ilgili gruba `ForceLogout` mesajı; istemci token'ı atar, login'e döner.
- Redis backplane ile çok-instance tutarlı broadcast.

---

## Parola Kurtarma Bildirimi (örnek)

**`PasswordResetRequested`** → kullanıcının seçili kanalına (Email/Sms) tek kullanımlık, kısa ömürlü (30 dk) reset linki/kodu. Forgot-password endpoint'i uniform `202` döner (kanal sızdırmaz).

**Template (TR):** Title: `OKSİS — Parola Sıfırlama`, Body: link + geçerlilik süresi. **PII (TCKN/telefon) template'e gömülmez.**

---

## Yasaklar

- ❌ Sync olarak handler içinde bildirim göndermek (queue / outbox zorunlu).
- ❌ Template veya log'da TCKN/telefon/email plain.
- ❌ Cross-tenant alıcı/broadcast (recipient `SchoolId` farklıysa).
- ❌ `Console.WriteLine` ile loglama.

> Detay: `backend/notification-rules.md`, teknik analiz Bölüm 13–14.
