---
aliases: [Invitation, Kullanıcı Daveti]
tags: [domain/people]
table: identity.invitations
status: active
last-synced: 2026-09-13 (294ffe6)
---

# Davet

<!-- generated:start -->

## Nedir

Önceden açılmış bir [[Kişi]] kaydının sisteme girişini sağlayan tek kullanımlık çağrı. Davet bir kişiye, bir hedef [[Sistem Rolü]]'ne ve bir [[Sezon]]'a bağlıdır; kabul edildiğinde arkasında bir [[Hesap]] doğar.

OKSİS'te kullanıcı kendi kendine kayıt olmaz — okul kişiyi açar, davet eder. Bu yüzden davet, kayıt akışının tamamıdır.

## Yaşam döngüsü

`Created → Sent → Opened → Accepted`, ve aktif herhangi bir aşamadan `Expired` veya `Revoked`.

- **Created** — davet üretildi, henüz gönderilmedi.
- **Sent** — davet e-postası gerçekten gönderildi. Gönderim düşerse davet `Created` kalır ve yeniden gönderilebilir olduğu görünür. SMS kanalı seçilebiliyor ama üründe SMS gönderimi yok; o kanalda sessizce başarılı görünmek yerine uyarı bırakılır.
- **Opened** — link ilk kez açıldı. Bu geçiş idempotenttir; ikinci açılış sessizce geçer.
- **Accepted** — terminal. Hesap üretimi, kişinin aktivasyonu, rol ataması ve rıza kayıtları kabul akışının işidir; davet yalnız durumunu korur ve olayı yayınlar.
- **Expired** — süre dolumu; periyodik sweep işi yazar.
- **Revoked** — elle iptal; gerekçe saklanır.

**Yeniden gönderim** aktif bir daveti `Created`'a geri döndürür: eski token'ın hash'i üzerine yazılır (yani eski link o anda ölür), süre yenilenir, sayaç artar ve yeni bildirim kuyruğa girer.

Kullanıcı listesi bu altı durumu dörde katlanmış bir görünümle gösterir (`Created` / `Sent` / `Opened` → bekliyor). Bu bir sunum izdüşümüdür, ikinci bir yaşam döngüsü değildir; kalıcı durum yukarıdaki altı değerdir (TB-08).

## Kurallar

- Token'ın açık hâli **veritabanında tutulmaz**; yalnız SHA-256 hash'i saklanır. Açık token yalnız iki yere gider: davet oluşturan ya da yeniden gönderen kişiye yanıtta **bir kez** döner (bağlantıyı istemci kurar ve elle paylaşabilir), ve davet olayının yüküyle e-posta işine akar. Log'a ve denetim kaydına yazılmaz.
- E-posta işi bağlantıyı yapılandırılmış web uygulaması adresinden kurar; iş istek bağlamı dışında çalıştığı için adresi gelen istekten türetemez.
- Bilinen ödünleşme: arka plan kuyruğu açıkken e-posta işinin argümanı olan açık token kuyruk deposuna serileşir — "yalnız hash" hedefini kısmen deler. Kalıcı çözüm (şifreli giden kutusu) bilinçli olarak ertelendi.
- Token hash'i tekildir; kabul akışı anonim olduğu için token global çözülür.
- Davet süresi 1–30 gün aralığında olmalıdır. Varsayılan gün sayısı okul ayarından (`INVITE_EXPIRE_DAYS`) okunur, bulunamazsa 7 gün.
- Kişi, hedef rol ve sezon kimlikleri zorunludur.
- Davet açıldığı andaki yürürlükteki [[Rıza Paketi]] sürümünü üzerinde taşır — kişi hangi metni onaylayacaksa o sürümdür.
- Yalnız aktif (`Created`/`Sent`/`Opened`) davet kabul edilebilir, iptal edilebilir, süresi dolabilir veya yeniden gönderilebilir.
- Aynı kişiye **aynı sezonda** ikinci bir aktif davet açılamaz (`USERS_INVITATION_ACTIVE_EXISTS`, 409); eşzamanlı iki istek de aynı hatayla döner. İkinci davet eskisini iptal etmez.
- Yalnız `Draft`, `Invited` veya `Suspended` durumdaki kişi davet edilebilir; `Draft` kişi davetle `Invited`'a geçer.
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

- Yeniden gönderim eski token'ı geçersiz kılıyor ama davet `Sent`'ten `Created`'a geri dönüyor. Bu geri geçiş durum makinesinde bilinçli bir istisna mı, yoksa ayrı bir "yeniden hazırlandı" durumu mu gerekir?
- E-postadaki bağlantı tek bir yapılandırılmış web adresinden kuruluyor. Okul başına ayrı adres olan çok okullu bir yapıda bu yeterli mi?
