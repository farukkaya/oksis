---
aliases: [ParentStudentRelationship, Veli Bağı]
tags: [domain/people]
table: identity.parent_student_relationships
status: active
last-synced: 2026-09-03 (b72c819)
---

# Veli-Öğrenci İlişkisi

<!-- generated:start -->

## Nedir

Bir veli [[Kişi]] ile bir öğrenci [[Kişi]] arasındaki bağı ve bu bağın **yetki bayraklarını** taşıyan aggregate root. Kendi kaydı olmasının sebebi, ilişkinin tek bir "veli" alanına sığmamasıdır: boşanmış ailede iki veli farklı yetkilerle, vasi veya üvey ebeveyn üçüncü bir bağ olarak durabilir.

Akrabalık tipi (anne, baba, vasi, diğer) ile yetki ayrıdır — baba olmak otomatik olarak ödeme sorumlusu olmak demek değildir.

## Yaşam döngüsü

Kayıt oluşturulur, geçerlilik aralığı (`ValidFrom` / opsiyonel `ValidUntil`) ile yaşar, gerekirse **sonlandırılır**. Sonlandırma silme değildir: gerekçe ve zaman damgası kalır, aktiflik "geri çekilmemiş olmak" üzerinden hesaplanır.

Bitiş tarihi yoksa sonlandırma günü bitiş olarak yazılır; henüz başlamamış (gelecek tarihli) bir ilişki sonlandırılırsa aralık tutarlılığını korumak için bitiş, başlangıca sabitlenir.

## Kurallar

- Veli ve öğrenci **aynı kişi olamaz** (`USERS_RELATION_SELF`).
- Aynı (veli, öğrenci) çiftinin aynı anda yalnız **bir aktif** ilişkisi olabilir; filtreli unique index ile korunur (`USERS_RELATION_DUPLICATE`).
- Bitiş tarihi başlangıçtan önce olamaz.
- Sonlandırılmış ilişki güncellenemez, ikinci kez sonlandırılamaz.
- Sonlandırma gerekçesi zorunludur.
- İlişki hard delete edilmez — hukuki ve denetim izi korunur.

## Yetki bayrakları

Beş ayrı bayrak taşınır: bilgi görebilir, karar verebilir, ödeme sorumlusu, öğrenciyi teslim alabilir, birincil iletişim kişisi. Bunlardan **bilgi görebilir** doğrudan erişim kapısıdır: veli, ancak bu bayrağı açık olan çocuğunun kaydını görebilir — ilişkinin varlığı yetkinin kendisidir.

## İlişkiler

- [[Kişi]] — iki uçta da kişi; veli tarafının veli [[Profil]]'i, öğrenci tarafının öğrenci profili olmalıdır
- [[Profil]] — profil tipi ön koşulu (`USERS_RELATION_PARENT_PROFILE_REQUIRED` / `..._STUDENT_PROFILE_REQUIRED`)

## Geçtiği modüller

- [[Kullanıcılar]] — kavramın sahibi; bağ kurma, yetki güncelleme, sonlandırma
- [[Kimlik Doğrulama]] — velinin çocuklar arasında bağlam değiştirmesi bu ilişkiye dayanır

- [[Bildirimler]] — veliye giden bildirimlerin alıcı çözümlemesi bu ilişkiyi izler
- [[Notlar]] — aile not yüzünün kapsam kapısı: çocuk kimliği sunucuda bu ilişkiyle doğrulanır, iptal edilmiş bağ kapsam dışı; "yeni not" damgası veli başına ayrı tutulur
- [[Ödevler]] — velinin salt okunur ödev yüzü ve üç bildirimin veli ayağı; kapsam sorgusu Notlar'dan bilinçli olarak kopyalandı, ortak servise çıkarılmadı (iki modül bağımsız evrilsin)

Veli bağını okuyan ama henüz notu olmayan modüller: Messaging.

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- `RelationshipAccessLevel` enum'u (yalnız bilgi / karar / ödeme) tanımlı, ama ilişki bunun yerine beş ayrı bayrak kullanıyor. Enum ölü mü, yoksa bayrakları özetleyen bir görünüm olarak mı düşünülmüştü?
- "Birincil iletişim kişisi" bayrağı öğrenci başına tek olmalı görünüyor ama tekillik kontrolü koddan çıkmıyor. Kural var mı?
