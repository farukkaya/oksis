---
aliases: [Invitation, Kullanıcı Daveti]
tags: [domain/people]
table: identity.invitations
status: active
last-synced: 2026-08-10 (2270867)
---

# Davet

<!-- generated:start -->

## Nedir

Önceden açılmış bir [[Kişi]] kaydının sisteme girişini sağlayan tek kullanımlık çağrı. Davet bir kişiye, bir hedef [[Sistem Rolü]]'ne ve bir [[Sezon]]'a bağlıdır; kabul edildiğinde arkasında bir [[Hesap]] doğar.

OKSİS'te kullanıcı kendi kendine kayıt olmaz — okul kişiyi açar, davet eder. Bu yüzden davet, kayıt akışının tamamıdır.

## Yaşam döngüsü

`Created → Sent → Opened → Accepted`, ve aktif herhangi bir aşamadan `Expired` veya `Revoked`.

- **Created** — davet üretildi, bildirim henüz kuyruğa alınmadı.
- **Sent** — bildirim kuyruğa alındı (e-posta, SMS veya ikisi).
- **Opened** — link ilk kez açıldı. Bu geçiş idempotenttir; ikinci açılış sessizce geçer.
- **Accepted** — terminal. Hesap üretimi, kişinin aktivasyonu, rol ataması ve rıza kayıtları kabul akışının işidir; davet yalnız durumunu korur ve olayı yayınlar.
- **Expired** — süre dolumu; periyodik sweep işi yazar.
- **Revoked** — elle iptal; gerekçe saklanır.

**Yeniden gönderim** aktif bir daveti `Created`'a geri döndürür: eski token'ın hash'i üzerine yazılır (yani eski link o anda ölür), süre yenilenir, sayaç artar ve yeni bildirim kuyruğa girer.

## Kurallar

- Token'ın açık hâli **veritabanında asla tutulmaz**; yalnız SHA-256 hash'i saklanır. Açık token sadece davet olayının yükü üzerinden bildirim hattına akar.
- Token hash'i tekildir; kabul akışı anonim olduğu için token global çözülür.
- Davet süresi 1–30 gün aralığında olmalıdır. Varsayılan gün sayısı okul ayarından (`INVITE_EXPIRE_DAYS`) okunur, bulunamazsa 7 gün.
- Kişi, hedef rol ve sezon kimlikleri zorunludur.
- Davet açıldığı andaki yürürlükteki [[Rıza Paketi]] sürümünü üzerinde taşır — kişi hangi metni onaylayacaksa o sürümdür.
- Yalnız aktif (`Created`/`Sent`/`Opened`) davet kabul edilebilir, iptal edilebilir, süresi dolabilir veya yeniden gönderilebilir.
- Aynı kişiye ikinci bir aktif davet açılamaz (`USERS_INVITATION_ACTIVE_EXISTS`).
- Toplu davette aynı partideki davetler bir grup kimliğiyle işaretlenir.

## İlişkiler

- [[Kişi]] — davetin muhatabı; davet açılınca kişi `Invited`'a geçer
- [[Sistem Rolü]] — kabulde verilecek hedef rol
- [[Sezon]] — davetin geçerli olduğu yıl
- [[Rıza Paketi]] — kabulde onaylanacak KVKK metninin sürümü
- [[Hesap]] — kabulde üretilir ve kişiye bağlanır

## Geçtiği modüller

- [[Kullanıcılar]] — kavramın sahibi; tekil/toplu davet, yeniden gönderim, iptal, kabul
- [[Kimlik Doğrulama]] — kabulde hesap üretimi bu modülün sınırında yapılır

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- İki ayrı `InvitationStatus` enum'u var: Users tarafında altı değerli (`Created/Sent/Opened/Accepted/Expired/Revoked`), Identity tarafında dört değerli (`Pending/Accepted/Expired/Revoked`). Hangisi yürürlükte, Identity'deki emekli mi?
- Yeniden gönderim eski token'ı geçersiz kılıyor ama davet `Sent`'ten `Created`'a geri dönüyor. Bu geri geçiş durum makinesinde bilinçli bir istisna mı, yoksa ayrı bir "yeniden hazırlandı" durumu mu gerekir?
