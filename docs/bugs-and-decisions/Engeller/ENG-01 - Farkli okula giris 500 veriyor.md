# ENG-01 · Açık oturum varken başka okulun hesabıyla giriş → 500

> **Ne zaman çıktı:** 2026-08-11, ekran testi oturumunun ilk yarısında.
> **Neyi engelledi:** `B-15`'in ekran testini asıl veri bulunan okulda (`s3`) yapmayı.
> **Nerede yaşıyor:** `oksis-api` · `src/Oksis.Infrastructure/Identity/TenantContext.cs:38-52`
> **Defterdeki maddesi:** `B-16` (bkz. [[OKSİS - Bulgu Kayıt Defteri]])
> **Durum:** ✅ **KAPANDI** — 2026-08-12, tavsiye edilen **(b)** yolu uygulandı (`oksis-api` @ `a79b391`).
> Kapanış ayrıntısı ve ölçümler `B-16` maddesinde.

---

## Önce olayı sırayla anlatayım

Ekran testine başlamak için tarayıcıda `localhost:3000` açtım. Tarayıcıda **önceki bir
oturumdan kalma çerez** duruyordu, uygulama beni kendiliğinden `OKSİS Dev Okulu` (`s1`)
okulundaki yöneticiye bağladı. Buraya kadar sorun yok.

Ama `B-15` bulgusu **ders programı** ekranında yaşıyor ve veritabanında ders programı
verisi yalnız `Cumhuriyet İlkokulu` (`s3`) ve `Atatürk Anadolu Lisesi` (`s2`)
okullarında var — `s1`'de sıfır program vardı. Yani testi yapmak için okul
değiştirmem, `mudur.s3@oksis.local` hesabıyla girmem gerekiyordu.

Giriş ekranına gittim, bilgileri yazdım, "Giriş yap"a bastım. **Hiçbir şey olmadı.**
Ekranda ne bir hata mesajı, ne bir uyarı, ne de bir yönlendirme. Sayfa öylece durdu.

Tarayıcı konsoluna bakınca gerçek göründü:

```
[ERROR] Failed to load resource: the server responded with a status of 500
        (Internal Server Error) @ /api/v1/auth/account/login
```

Yani giriş isteği **sunucuda patlamış**, kullanıcıya hiçbir şey söylenmemiş.

---

## Sunucu tarafında ne oluyor

API logundaki yığın izi tek cümlede sebebi veriyor:

```
System.Security.SecurityException: SetForLoginFlow farklı bir tenant'a geçiş için kullanılamaz.
   at Oksis.Infrastructure.Identity.TenantContext.SetForLoginFlow(...)   :line 48
   at ...AccountLogin.AccountLoginCommandHandler.Handle(...)             :line 119
```

Adım adım ne olduğunu açayım:

1. **Tarayıcı, giriş isteğine de eski JWT'yi ekliyor.** Giriş ucu `[AllowAnonymous]`
   olsa bile ASP.NET'in kimlik doğrulama katmanı gelen token'ı yine de çözümlüyor ve
   `HttpContext.User` içine `school_id = s1` claim'ini koyuyor.

2. **Giriş handler'ı kimliği çözüp okulu buluyor.** `mudur.s3@oksis.local` `s3`
   okulunun hesabı olduğu için handler `tenantContext.SetForLoginFlow(s3)` çağırıyor.
   Bunu yapmasının sebebi masum: `SaveChanges` interceptor'ı bu istek boyunca yazılan
   `Account` / `RefreshToken` satırlarını "başka tenant'a yazıyorsun" diye reddetmesin.

3. **`SetForLoginFlow` içindeki koruma devreye giriyor.** Metot, `HttpContext`'teki
   `school_id` claim'ine bakıyor: claim `s1`, istenen `s3`. Farklı → `SecurityException`
   fırlatıyor.

4. **Bu istisnayı kimse yakalamıyor.** `SecurityException` bir domain hatası değil,
   bu yüzden `ExceptionHandlingMiddleware` onu "beklenmeyen hata" sayıp gövdesi
   `{"code":"InternalError"}` olan **500** üretiyor. İstemci 500'ü bir giriş hatası
   olarak yorumlayamadığı için ekranda hiçbir şey göstermiyor.

Kodun kendi yorumu bu senaryoyu **zaten biliyor**:

> `// Browser'da eski JWT duruyorsa [AllowAnonymous] endpoint'lerde bile`
> `// Authentication middleware claim'leri parse eder. Farklı tenant'a sıçramayı engelle...`

Yani senaryo öngörülmüş; öngörülmemiş olan **öngörünün sonucunun 500 olması**.

---

## Deterministik yeniden üretim

Tarayıcıya hiç gerek yok, iki `curl` yeter:

```bash
# 1) s1 okulundan token al
T1=$(curl -s -X POST http://localhost:5112/api/v1/auth/account/login \
  -H 'Content-Type: application/json' \
  -d '{"identifier":"mudur.s1@oksis.local","password":"Oksis1234!","channel":"web"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['accessToken'])")

# 2) O token'ı TAŞIYARAK s3 okuluna giriş dene
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:5112/api/v1/auth/account/login \
  -H 'Content-Type: application/json' -H "Authorization: Bearer $T1" \
  -d '{"identifier":"mudur.s3@oksis.local","password":"Oksis1234!","channel":"web"}'
# → 500

# 3) Aynı isteği token OLMADAN at
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:5112/api/v1/auth/account/login \
  -H 'Content-Type: application/json' \
  -d '{"identifier":"mudur.s3@oksis.local","password":"Oksis1234!","channel":"web"}'
# → 200
```

Tek değişken `Authorization` başlığı. %100 tekrarlanıyor, veriye bağlı değil.

---

## Neden bu sadece bir test sorunu değil

Pilotta gerçekten olacak üç sahne:

- **Ortak bilgisayar.** Okul A'nın müdürü kendi bilgisayarında oturum açmış; ertesi
  gün aynı makineye okul B'den biri girmeye çalışıyor. Ekran sessizce hiçbir şey
  yapmıyor. Kullanıcı parolasını yanlış yazdığını sanıp defalarca deniyor →
  `AccountLoginGuard` hesabı kilitleyebilir. Yani **kullanıcı, kendi hatası olmayan
  bir şey yüzünden hesabını kilitletiyor.**
- **Birden fazla okulda görevli kişi.** Aynı kişi iki kurumda çalışıyorsa okul
  değiştirmek için önce çıkış yapmayı bilmek zorunda; hiçbir ekran bunu söylemiyor.
- **Süresi dolmamış eski token.** Token **15 dakika** geçerli *(bu satırda önce 60 dakika yazıyordu; 2026-08-12'de ölçülerek düzeltildi — token'ın ömrü hatanın görünürlüğünü doğrudan belirliyor, bkz. aşağıdaki kapanış notu)*. Kullanıcı çıkış yapsa bile
  istemci token'ı bir yerde tutuyorsa aynı duvara çarpılıyor.

Üçünde de kullanıcının gördüğü şey aynı: **hiçbir şey.** Bu, `X-01`
(BE mesajlarının notify hattı yok) ile aynı ailenin bir üyesi — ama burada mesajın
kendisi de yok, çünkü sunucu anlamlı bir hata değil 500 dönüyor.

---

## Çözüm yönü (henüz uygulanmadı — karar gerekiyor)

İki aday var ve **yamalama olmayanı ikincisi**:

**(a) `SetForLoginFlow`'un korumasını gevşetmek.** Metot farklı tenant'a geçişe izin
versin. Küçük değişiklik, ama korumanın *neden* konduğunu ortadan kaldırıyor: bu
metot parola **doğrulanmadan önce** çağrılıyor (`AccountLoginCommandHandler:119`,
parola kontrolü satır ~130). Yani A okulunun geçerli token'ını taşıyan biri, yalnız
*deneyerek* istek boyunca tenant bağlamını B okuluna çevirebilir. Bugün bunun bilinen
bir sömürüsü yok ama koruma tam da bunun için yazılmış.

**(b) Kimlik doğrulama uçlarının mevcut kimliği miras almamasını sağlamak.** Bir
*giriş* isteği tanım gereği anonimdir; taşıdığı eski token hiç dikkate alınmamalı.
`/auth/account/login` (ve aynı aileden `refresh`, `forgot-password`, `reset-password`)
işlenmeden önce `HttpContext.User` boş bir principal'a çekilirse:
- `SetForLoginFlow`'un baktığı claim hiç olmaz → koruma korunur, çatışma doğmaz,
- kural tek yerde yaşar, uç uç yamalanmaz,
- eski token'ın yan etkisi olan başka gizli sahneler de kapanır.

**Tavsiye: (b).** Ama bu kimlik doğrulama boru hattına dokunuyor; ayrı bir dilim
olarak, kendi testleriyle yapılmalı — ekran testi turunun ortasında değil.

Ek olarak, hangi yol seçilirse seçilsin: `SecurityException`'ın **500'e düşmesi**
başlı başına yanlış. `ExceptionHandlingMiddleware` bu tipi 401/403 gibi anlamlı bir
yanıta çevirmeli ki istemci kullanıcıya bir cümle gösterebilsin.

---

## Bu turda nasıl etrafından dolaşıldı

Okul değiştirmek yerine **testi `s1` okulunda kurdum**: ders programı ekranından
9-A şubesi için yeni bir program oluşturup Matematik dersini Pazartesi 1. saate
sürükledim, sonra hücre menüsünden "Öğretmen Değiştir"i açtım. `B-15`'in ölçtüğü uç
(`available-teachers`) böylece asıl ekranından çağrıldı ve kanıt alındı.

Yani engel `B-15`'i test etmeyi **engellemedi**, yalnız yolu uzattı. Ama kendisi
kapatılmamış bir bulgu olarak duruyor.

---

## ✅ Kapanış — 2026-08-12

**(b) uygulandı:** `AnonymousEndpointIdentityMiddleware` — `[AllowAnonymous]` bir uç için
`HttpContext.User` boş principal'a çekiliyor (`UseAuthentication`'dan sonra,
`UseAuthorization`'dan önce). Koruma **gevşetilmedi**; kaldırılan şey onu boş yere
tetikleyen miras kimlik.

**Ölçüm bu dosyayı iki yerde düzeltti:**

1. **Tek uç değil, altı akış.** `SetForLoginFlow`'u HTTP anonim akışlarından altı yer
   çağırıyor ve **davet kabul** akışı birebir aynı tuzağı taşıyor: A okulunda oturumu
   açık olan biri B okulunun davetini kabul ederse aynı 500 doğar. Bu dosya yalnız
   giriş ucunu anlatıyordu.
2. **Token ömrü 60 değil 15 dakika.** Yukarıdaki yeniden üretim adımları elde **bayat**
   bir token varken **200** verir, çünkü süresi dolmuş token claim üretmez ve çatışma
   doğmaz. İlk denememde tam olarak bu oldu. Bu, belirtinin neden "bazen oluyor bazen
   olmuyor" göründüğünü de açıklıyor — hata yalnız **taze** bir oturum varken çıkar.
   Yeniden üretmek isteyen, adım 1'deki token'ı **hemen** adım 2'de kullanmalı.

**Ek olarak:** `SecurityException` artık 500 değil **403** + Türkçe cümle
(*"Bu işlem açık olan oturumun okuluyla eşleşmiyor. Önce çıkış yapıp tekrar deneyin."*).
Bu dosyanın son paragrafında istenen düzeltme buydu.

**Kapsam neden `[AllowAnonymous]`:** elle yol listesi tutmak listenin bir gün uçlardan
ayrışması demekti (`B-04`'te ölçülen desen). Depodaki dokuz anonim ucun tamamı tek tek
ölçüldü, hiçbiri tenant claim'ine bağlı değil.

**Doğrulama:** RED→GREEN canlı uçta (500 → 200, dönen token gerçekten hedef okulun);
yanlış parola hâlâ 401; token yenileme / çıkış / korumalı uç regresyonsuz; 3 middleware
testi + boş-yere-yeşil kontrolü; `Oksis.Api.UnitTests` 251/251.
