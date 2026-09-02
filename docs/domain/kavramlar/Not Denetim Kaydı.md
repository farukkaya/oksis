---
aliases: [GradeAuditEntry, Denetim İzi, Not Geçmişi, MarkAmendment (deprecated)]
tags: [domain/academic]
table: academic.grade_audit_entries
status: active
last-synced: 2026-09-03 (b72c819)
---

# Not Denetim Kaydı

<!-- generated:start -->

## Nedir

Bir [[Not Defteri]] üzerinde yapılmış her işlemin değiştirilemez kaydı — "kim, ne zaman, neyi, neden". İlk taslakta adı `MarkAmendment` (not düzeltmesi) idi ve fazla dardı: kayıt yalnız düzeltmeyi değil defterdeki **tüm** olayları taşır — sütun oluşturma, toplu giriş, temizleme, sınav tarihi, yayın, adına yayın, geri alma, düzeltme, kilit, kilit açma ve dönem kapanış kilidi.

## Yaşam döngüsü

**Yalnız eklenir.** Güncelleme ve silme yolu yoktur; eşzamanlılık jetonu bile tanımlı değildir — değişmeyen bir kaydın yarışa girecek hâli yoktur.

## Kurallar

- **Tek tablo, olay tipine göre boş alanlar:** sütun olayında sütun kimliği, hücre olayında ayrıca öğrenci ile eski/yeni değer (tel biçimi: "85", "G"); sistem olayında aktör yoktur ve "sistem" işaretlidir; dönem kapanışı gibi takvimden gelen olay ayrıca "planlı" işaretlenir.
- **Görüntülenecek Türkçe metin sunucuda kurulur;** istemci çevirmez.
- **Gerekçe yönetici işlemlerinde zorunludur ve aileyle paylaşılmaz.** Aile yüzü gerekçe taşımaz; dışa aktarılan dosyaya da girmez — elden ele dolaşan bir dosyaya değil, okul içi kayda aittir.
- **Hücre başına kayıt yoktur.** Her not girişine bir satır yazmak denetim ekranını doldururdu; var olan satırı sayaç artırarak güncellemek append-only ilkesini delerdi. Bilgi yayın anına ertelenir: "sütuna n not girdi" tek satırdır. Taslakta yapılan düzeltmeler iz bırakmaz.
- **Okuma yönetici iznine bağlıdır;** defter bazlı, yeniden eskiye.

## İlişkiler

- [[Not Defteri]] — kaydın bağlı olduğu defter; okuma bu eksende
- [[Değerlendirme]] — sütun olayları
- [[Not]] — düzeltme olayında eski ve yeni değer
- [[Kişi]] — aktör; sistem olayında boş
- [[Dönem]] — kapanış kilidi planlı sistem kaydıdır

## Geçtiği modüller

- [[Notlar]] — kavramın sahibi; her yazma komutu en az bir kayıt üretir, denetim ekranı okur

<!-- generated:end -->

## Notlar

<El yazısı alan. Senkron buraya dokunmaz.>

## Açık Sorular

- Kayıt yumuşak silme bayrağı taşıyor ama silme yolu yok; bayrak kalıp gereği mi duruyor?
