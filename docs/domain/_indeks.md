---
tags: [domain/index]
last-synced: 2026-09-13 (294ffe6)
---

# OKSIS Domain Haritası

Bu klasör, OKSİS belge merkezinin (`docs/` vault'u) domain bölümüdür ve **domain bilgisinin tek kaynağıdır**. **Kod tek doğru kaynaktır; buradaki notlar harita ve niyettir.** Bir notta kolon listesi, tip imzası veya endpoint gövdesi bulmayacaksın — bunlar `oksis-api` içinde yaşar ve kopyalandıkları anda çürümeye başlar. Notların cevapladığı sorular: bu kavram nedir, nerede yaşar, hangi kuralları vardır, neden böyle kurgulanmıştır.

Her notun `last-synced` alanı, hangi tarihte hangi commit'ten üretildiğini söyler. Nota ne kadar güveneceğini oradan anla.

## Nereden başlamalı

Projeye yeni geldiysen [[Sezon]] ile başla — okulun bütün akademik kayıtları bir sezona bağlıdır, o yüzden her şeyin girişi orasıdır. Ardından [[Sezon Yönetimi]] modül notu, yılın nasıl kurulup kapandığını uçtan uca anlatır.

İkinci durak [[Kişi]] olsun: OKSİS'te öğrenci, öğretmen, veli ve personel ayrı tablolar değil, [[Profil]] taşıyan kişilerdir. Bu ayrımı anlamadan kullanıcı tarafındaki hiçbir kural yerine oturmaz.

## Kavramlar

### Kurum

- [[Okul]] — tenant'ın kendisi; `Kurulum → Aktif ↔ Askıda → Arşiv`
- [[Okul Ayarları]] — kurum bilgisi ve diğer modüllerin politika kaynağı
- [[Modül Yapılandırması]] — hangi modül açık, plan neyi kilitliyor
- [[Bildirim Yapılandırması]] — kanal anahtarları, olay × kanal matrisi ve sessiz saat; teslimatta okunur
- [[Saklı Dosya]] — yüklenmiş dosyanın kaydı; depo byte tutar, gerçek burada
- [[Dosya Bağı]] — dosyayı iş kaydına bağlayan çok biçimli bağ
- [[Dosya Kategorisi]] — izinli tür, boyut, tarama ve saklama süresi

### Akademik

- [[Sezon]] — eğitim-öğretim yılının çatısı; `Setup → Active → Archived`
- [[Dönem]] — sezonun içindeki T1/T2 dönemleri
- [[Şube]] — sınıf şubesi; öğrenci atamalarının taşıyıcısı
- [[Sınıf Seviyesi]] — Anaokulu–12. sınıf; platform geneli sabit liste
- [[Derslik]] — fiziksel oda kataloğu; şubenin ev dersliği
- [[Ders]] — müfredat dersi; platform geneli master
- [[Haftalık Ders Saati]] — MEB çizelgesi + okul override'ı; katmanlı çözüm
- [[Not Ölçeği]] — 100'lük, 5'lik, harfli; okul seçer, tanımlamaz; kademe override'ını kimse okumuyor
- [[Sınav Türü]] — not defteri sütununun türü (sınav/sözlü/performans); dönem sırası taşır, ağırlık taşımaz
- [[Not Defteri]] — dönem × şube × ders; durumsuz, tembel oluşur, kimliği koordinattan
- [[Değerlendirme]] — defterin sütunu; `Empty → Draft → Published → Locked`; yayın birimi budur
- [[Not]] — hücre; sayı, G/M ya da boş; görünürlüğü sütundan türer
- [[Not Denetim Kaydı]] — append-only iz; gerekçe aileyle paylaşılmaz
- [[Sınav Penceresi]] — dönem × sınav türü; yayın birimi; `Draft → WindowPublished → SchedulePublished → Locked`; yayından sonra her değişiklik gerekçeli revizyon
- [[Planlanmış Sınav]] — pencere × şube × ders; tembel doğar; yerleşim ve saat isteği iki ayrı eksen; saat öğretmenindir
- [[Sınav Oturumu]] — kelebek birimi: tek ders, tek saat, çok şube; sahipsiz; derslik ve gözetmen türer, öğrenciler oransal serpiştirilir
- [[Ödev]] — dönem × şube × ders × sahip; `Draft → Published → Closed | Cancelled`; yayın geri alınamaz, iptal görünür
- [[Ödev Takibi]] — ödev × öğrenci; beş durum, "işaretlenmedi" karar değil; sonradan katılan satır okurken sentezlenir
- [[Ödev Teslimi]] — satırın dosyası; yumuşak kaldırma, 5 aktif dosya kotası, yükleme bildirim üretmez
- [[Resmî Tatil]] — millî ve dini tatiller; dini bayramlar seed'de taslak, Diyanet teyidi bekliyor
- [[Branş]] — öğretmenin alanı; okula özel katalog, MEB kaynaklılar korumalı
- [[Ders Görevlendirmesi]] — öğretmen × ders yetkinliği; tek kanonik görevlendirme kaydı, kapasite ve kademe süzgeci
- [[Dağıtım Kısıtı]] — otomatik program üretimine verilen pin / hariç tutma niyeti; yumuşak, sezona bağlı, devirde kopyalanmaz
- [[Şube Ders Görevlendirmesi]] — v1 öğretmen × şube × ders kaydı; **kaldırıldı** (2026-08-18), yerini [[Ders Görevlendirmesi]] ve [[Dağıtım Kısıtı]] aldı
- [[Nöbet Çizelgesi]] — dönemin nöbet planı; sürüm zinciri, silme yok
- [[Nöbet Bölgesi]] — kat, kantin, bahçe, kapı; kapasite = paralel nöbetçi sayısı
- [[Nöbet Muafiyeti]] — sürekli veya geçici; atamayı sert engeller
- [[Ders Programı]] — bir şubenin bir dönemdeki haftalık programı; rezervasyon canlıyken başlar
- [[Program Sürümü]] — yayın anının değişmez kopyası; tüketicinin gördüğü şey
- [[Program İstisnası]] — günlük vekâlet, iptal, derslik değişikliği; programı kirletmez
- [[Öğretmen Müsaitliği]] — seyrek kayıt; "tercih etmiyorum" yumuşak, "müsait değil" sert
- [[Zil Çizelgesi]] — ders sırasının saate karşılığı; programda saat tutulmaz
- [[Yoklama Oturumu]] — programın güne inmiş hâli; alanları yazım anında dondurulur
- [[Mazeret]] — devamsızlığın gerekçelendirilmesi; onay geçmiş kayıtları çevirir
- [[Düzeltme Talebi]] — pencere kapandıktan sonraki düzeltme yolu
- [[Devamsızlık Özeti]] — dönem toplamı; gün eşdeğerliği ve eşik motoru
- [[Etkinlik Yoklaması]] — gezi/tören güvenlik sayımı; devamsızlığa girmez
- [[Okul Tatili]] — sezon takvimindeki kapalı günler

### Kişiler ve yetki

- [[Kişi]] — okuldaki gerçek insan; rolünü profille kazanır
- [[Profil]] — kişinin roldeki verisi; öğrenci, öğretmen, veli, personel
- [[Veli-Öğrenci İlişkisi]] — veli bağı ve yetki bayrakları; silinmez, sonlandırılır
- [[Rol Ataması]] — kişiye sezon bazında verilen sistem rolü
- [[Davet]] — sisteme giriş akışı; token hash'lenir, açık hâli saklanmaz
- [[Hesap]] — giriş, oturum ve aktif bağlam sahibi
- [[Sistem Rolü]] — platform geneli rol tanımı; seviye ve portal taşır
- [[İzin]] — `modül.aksiyon` kodu; yetkinin en küçük birimi
- [[Rıza Kaydı]] — KVKK onayının kanıtlanabilir kaydı
- [[Rıza Paketi]] — aydınlatma metninin versiyonlanmış master kaydı
- [[Öğrenci Kaydı]] — öğrencinin bir sezondaki okul kaydı; kişi kalıcı, kayıt sezonluk
- [[Öğrenci Numarası]] — okul ömrü boyunca tek monoton sıra; yıl içermez
- [[Öğrenci Belgesi]] — kayıt dosyasındaki evrak ve eksik listesi

### İletişim

- [[Duyuru]] — kurumsal iletişim kaydı; silinmez, geri çekilir
- [[Duyuru Şablonu]] — kişisel hazır duyuru metni; ayrı aggregate, silinebilir
- [[Bildirim]] — zil menüsündeki kalıcı satır; alıcısı kişi değil hesap
- [[Bildirim Türü]] — bildirimin ne olduğu; kodda iki temsili var (dağıtım kataloğu silindi)

### Kulüpler

- [[Kulüp]] — okul × sezon × ad; `Draft → Active ↔ Inactive → Archived`; danışmansız aktif kulüp başvuru alır
- [[Kulüp Üyeliği]] — başvuru ve üyelik tek kayıt; terminal hâlden çıkış yok, yeniden başvuru yeni satır
- [[Kulüp Etkinliği]] — saatli faaliyet; `Draft → Published → Completed | Cancelled`; tamamlandı etikettir, kilit değil
- [[Etkinlik Katılımı]] — kayıt ve yoklama tek satır; koşulsuz tekillik, geri çekilmiş satır yeniden açılır
- [[Kulüp Duyurusu]] — durum makinesiz, silinmez, imzası donar; [[Duyuru]]'nun kardeşi, örneği değil

## Modüller

- [[Okul Yönetimi]] — kurum bilgisi, akademik politika, zil düzeni, tatil, modül ve bildirim ayarları
- [[Dosya Yönetimi]] — yükleme, virüs taraması, bağlama, indirme yetkisi, kota ve imha
- [[Müfredat]] — ders, kademe, branş, haftalık saat, not ölçeği ve sınav türü katalogları
- [[Sezon Yönetimi]] — yılın kurulması, dönemler, şubeler ve takvim
- [[Sınıflar ve Şubeler]] — şube kurulumu, rehber öğretmen, derslik, öğrenci atama ve transfer
- [[Görevlendirmeler]] — tek kayıt, üç soru: yetkinlik, dağıtım niyeti, fiili yük
- [[Ders Programı Yönetimi]] — program örme, çakışma koruması, otomatik üretim, yayın ve sürümleme
- [[Yoklama ve Devamsızlık]] — günlük yoklama, mazeret, düzeltme, devamsızlık muhasebesi ve etkinlik sayımı
- [[Nöbetler]] — nöbet çizelgesi, otomatik dağıtım, muafiyet, yük raporu ve ders vekâleti
- [[Öğrenci Kayıt Yönetimi]] — kayıt alma, nakil, dondurma, ayrılma, mezuniyet, kayıt yenileme
- [[Kullanıcılar]] — kişi, profil, veli bağı, rol, davet, rıza, içe/dışa aktarma
- [[Kimlik Doğrulama]] — giriş, oturum, bağlam geçişi, parola, izin çözümleme
- [[Duyurular]] — kitlesel iletişim; hedefleme, moderasyon, şablonlar
- [[Bildirimler]] — olay → alıcı → kanal; uygulama içi, push ve e-posta; mükerrer koruması
- [[Kulüpler]] — öğrenci kulüpleri; dört yüz (idare, danışman, öğrenci, veli), izin ≠ kapsam, sezon süzgeci elle
- [[Notlar]] — dönem içi not girişi; yayın birimi sütun, tembel defter, kapsam ders programından, karar sunucuda
- [[Ödevler]] — ödevin tüm ömrü; beş yüz (öğretmen, öğrenci, veli, idare, rehber), görünüm kimlikten, sahiplik ≠ kapsam, üç bildirim ve iki gece işi
- [[Sınav Takvimi]] — sınav haftası; iki düzen (ders saati, kelebek), iki adımlı yayın, üç kademeli kural denetimi, ders programına yazmaz

## Kararlar

- [[0001-sinav-agirligi-okul-politikasinda]] — master veri okul kararı taşımaz; sınav türündeki ağırlık kaldırıldı
- [[0002-not-defteri-bilesik-tel-kimligi]] — satırı olmayan defter koordinattan adreslenir; deterministik Guid elendi
- [[0003-coklu-sube-ayri-odev-kaydi]] — üç şubeye verilen ödev üç kayıttır; tek kayıt + hedef listesi elendi
- [[0004-odev-hedefi-yayinda-dondurulur]] — hedef yayında çözülür; sonradan katılan öğrencinin satırı okurken sentezlenir, okuma yazmaz
- [[0005-haftalik-ders-saati-ders-kademe-kaydinda-tutulmaz]] — haftalık saat yalnız MEB şablonu ile sezonluk okul override'ında durur; MEB'e eşit override silinir
- [[0006-sezon-iki-asamali-materyalizasyon]] — sezon iki aşamada kurulur: yapı "Sezonu Aç"ta, terfi ve görevlendirme kopyası "Aktifleştir"de tek transaction'da
- [[0007-mvp-rol-seti-bes-rol]] — MVP'de yalnız beş sistem rolü; diğerleri ertelendi, muhasebeci kapsam dalı IDOR yüzünden kaldırıldı
- [[0008-super-yonetici-platform-roludur]] — süper yönetici okulun içini değil sistemdeki varlığını yönetir; iç veriye yalnız okul onayıyla erişir — uygulama bekliyor (TB-139)
- [[0009-tek-kimlik-modeli]] — eski `User` kaldırıldı; tek kimlik modeli Kişi, Profil, Hesap, Rol Ataması
- [[0010-okul-basina-depolama-alani]] — her okulun dosyaları kendi depolama alanında; adı okul kimliğinden, ayrılışta tek silmeyle imha
- [[0011-dosya-tekillestirmesi-kapali]] — aynı içerik iki kez yüklenirse iki kayıt olur; silme referans sayımına dönmesin
- [[0012-bildirim-ilkeleri]] — alıcı etkilenen kişidir, uygulama içi her zaman, push seçilerek, sessiz saat varsayılan
- [[0013-gun-degeri-gercek-system-dayofweek]] — gün değeri gerçek takvim günüdür (Pzt=1…Cum=5); hafta içi sınırı sunucuda zorlanmıyor
- [[0014-kulup-basvurusu-ve-uyeligi-tek-kayit]] — başvuru ve üyelik tek kayıt; iki liste aynı satırlardan süzülür
- [[0015-danismansiz-aktif-kulup-basvuru-alir]] — yayındaki kulüp danışmansız da başvuru alır; sonradan atanan danışman bekleyenleri devralır
- [[0016-ayrilmis-ogretmen-kadrodan-turer]] — "çalışan öğretmen" kadro kaydı ve kişinin yaşam durumundan türer, sezonluk görevlendirmeden değil
- [[0017-kelebek-derslik-ve-gozetmen-turetilir]] — kelebekte derslik ev dersliğinden, gözetmen ders programından türer; yöneticinin eli satırdaki işaretle korunur
- [[0018-sinav-kurallari-denetleyicide]] — sınav kuralları tek denetleyicide; geçilemez sert, gerekçeyle geçilen, yalnız görünen

## Notlar hakkında

- `<!-- generated -->` blokları arası otomatik üretilir ve senkronda üzerine yazılır. **O blokların dışına yazdığın hiçbir şeye dokunulmaz** — gerekçeler, tarihçe ve tuzaklar "Notlar" başlığı altında güvendedir.
- "Açık Sorular" başlığı, koddan net çıkarılamayan şeyleri toplar. Uydurulmuş bir kural, eksik bir kuraldan pahalıdır; cevabını bildiğin bir soruyu yanıtlayıp yukarı taşımak en değerli katkıdır.
- Kavram, modül ve klasör adları Türkçedir. Koddaki İngilizce identifier `aliases` alanının **ilk** değeridir — `AcademicSession` diye arattığında Obsidian seni [[Sezon]] notuna götürür.

## Kapsam

Notlar yalnızca `oksis-api` (backend) taranarak üretilir. Domain kuralları ve iş akışları oradan çözülür; bir kavramın ekranda nasıl göründüğü domain bilgisi sayılmaz.
