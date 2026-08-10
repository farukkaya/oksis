---
aliases: [RoleAssignment, Yetkilendirme]
tags: [domain/people]
table: identity.role_assignments
status: active
last-synced: 2026-08-10 (2270867)
---

# Rol Ataması

<!-- generated:start -->

## Nedir

Bir [[Kişi]]'ye, belirli bir [[Sezon]]'da, belirli bir [[Sistem Rolü]] veren kayıt. Yetki kişinin kendisinde değil bu atamada durur; bu yüzden aynı kişi bir sezonda müdür yardımcısı, ertesi sezonda sınıf öğretmeni olabilir ve geçmiş sezonun yetkisi geçmişte kalır.

Kullanıcının çalışma anındaki izinleri JWT'ye basılmaz; her istekte aktif sezonun rol atamalarından çözülür.

## Yaşam döngüsü

`Active → Inactive` (iptal) veya `Active → Expired` (süre dolumu).

- **Inactive** — elle iptal; gerekçe ve zaman damgası saklanır, geri alınabilir.
- **Expired** — zaman sınırlı atamanın süresi dolduğunda periyodik sweep işi tarafından yazılır. **Terminaldir**: yeniden aktive edilemez, çünkü geçmiş bir bitiş tarihiyle anında tekrar dolardı. Yeniden yetki gerekiyorsa yeni atama açılır.

İptal de süre dolumu da hard delete değildir.

## Kurallar

- Aynı (kişi, rol, sezon) üçlüsü tekildir; unique index ile korunur (`USERS_ROLE_ASSIGNMENT_DUPLICATE`).
- Kişi, rol ve sezon kimlikleri zorunludur.
- Yalnız aktif atama iptal edilebilir veya süresi dolabilir; iş idempotency'si bu invariant'a dayanır.
- Yalnız iptal edilmiş (`Inactive`) atama yeniden aktive edilir.
- İptal gerekçesi zorunludur.
- Süresiz atama mümkündür (`ValidUntil` boş).

## Yetki yükseltme koruması

Atama yapan kişi kendi seviyesinden **kesin düşük** seviyeli bir rol atayabilir. Seviye sayısaldır ve büyük sayı yüksek yetki demektir. Üç ayrı ret sebebi vardır: hedef rol çok yüksek (`USERS_ROLE_ASSIGNMENT_LEVEL_TOO_HIGH`), hedef rolün izin kümesi atayanınkini kapsıyor (`..._PERMISSION_SUPERSET`), kişi kendine yetki yükseltiyor (`..._SELF_ELEVATION`).

## İlişkiler

- [[Kişi]] — atamanın öznesi
- [[Sistem Rolü]] — verilen rol
- [[Sezon]] — atamanın geçerli olduğu yıl; atama sezonsuz olamaz
- [[İzin]] — çalışma anında izinler bu atamadan çözülür

## Geçtiği modüller

- [[Kullanıcılar]] — kavramın sahibi; atama, iptal, listeleme, yetki matrisi
- [[Kimlik Doğrulama]] — login ve her istekte izin çözümlemesi buradan okur
- [[Sezon Yönetimi]] — yeni sezona geçişte rollerin kopyalanması

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- `ScopeAttributes` ham JSON olarak duruyor ve geçerliliği Application validator'ına bırakılmış. Hangi kapsam anahtarları destekleniyor, şeması nerede tanımlı?
- Sezon geçişinde rol kopyalama işten ayrılmış personeli dışarıda bırakıyor; bu kural sezon tarafında yaşıyor, atama tarafında karşılığı yok.
