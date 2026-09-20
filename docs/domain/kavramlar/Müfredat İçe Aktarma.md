---
aliases: [CurriculumImportRun, CurriculumImportEntry, CurriculumImportSubjectMatch, Ara Alan, Staging]
tags: [domain/academic]
table: master.curriculum_import_runs, master.curriculum_import_entries, master.curriculum_import_subject_matches
status: active
last-synced: 2026-09-20 (445eaa6a)
---

# Müfredat İçe Aktarma

<!-- generated:start -->

## Nedir

Bir [[MEB Kaynak Belgesi]] setinden üretilen **ara alan** (staging) ve onun operasyon kaydı.
Çizelgenin satırları önce burada, kaynaktaki ham hâliyle yaşar: ham ders adı, ham sınıf seviyesi
kodu, saat ve sayfa numarası. Master veri ancak merkez onayından sonra bu ara alandan doğar.

Bu ayrımın nedeni: ayrıştırma, doğrulama ya da eşleme hatası **yayımlanmış hiçbir sürümü
etkilemesin**. Yanlış okunmuş bir çizelge ara alanda kalır; okulların çalışan müfredatına
dokunmaz.

## Yaşam döngüsü

```text
Draft → Validated → Approved → Published
   ↘ NeedsReview ↗      ↘ Rejected
   ↘ Quarantined
```

- **Validated** — doğrulama temiz, onaya hazır.
- **NeedsReview** — uyarı, hata ya da çözülmemiş ders eşlemesi var; insan bakmalı.
- **Quarantined** — belge hiç anlaşılmamış (satır yok ya da hiçbir sınıf seviyesi tanınmadı);
  tek tek düzeltmek anlamsızdır.
- **Published / Rejected / Quarantined** terminaldir.

Satırlar merkez tarafından düzeltilebilir (seviye, saat, ders türü) ve her satır bir **ders eşleme
kararı** taşır.

## Kurallar

- İçe aktarma **idempotenttir**: aynı belge seti + program + akademik yıl + aynı içerik parmak izi
  ikinci bir çalışma açmaz.
- Satırın saati ya tek değerdir ya da **en az iki seçenek** ("1 veya 2 saat"); tek seçenek zaten
  tek değerdir. MEB saati sıfırdan büyüktür — 0 okulun kararıdır, çizelgenin değil.
- Aynı seviye ve ders için iki satır olamaz.
- Ders eşleme **önerisi** karar değildir: kod ya da ad birebir eşleşse bile satır `Suggested`
  doğar; `Confirmed` yalnız bir kullanıcının kararıyla olur.
- Belirsiz eşleşme öneri üretmez (iki ders aynı normalize ada düşüyorsa).
- **Bilinmeyen ders master katalog açmaz**: onay var olan bir çekirdek derse bağlanır ya da satır
  kapsam dışı bırakılır.
- Çözülmemiş eşleme varken içe aktarma **onaylanamaz**.
- **İki kişi kuralı**: ara alanı düzelten kullanıcı aynı içe aktarmayı onaylayamaz
  ([[0022-mufredat-yayimi-iki-kisi-kurali]]).
- Terminal durumda düzeltme ve geçiş kapalıdır.

## Neye yarıyor

"Bu çizelge sisteme nasıl girdi, kim neyi düzeltti, kim onayladı" sorusunun cevabıdır. Yayımlanan
sürüm bu çalışmaya, çalışma da belge setine bağlıdır.

## İlişkiler

- [[MEB Kaynak Belgesi]] — ara alanın dayandığı hukuki kaynak
- [[Müfredat Sürümü]] — onaylanan çalışmanın yayım çıktısı
- [[Ders]] — eşleme çekirdek katalogdaki derse bağlanır
- [[Sınıf Seviyesi]] — satırın seviyesi çözülür ya da incelemeye düşer

## Geçtiği modüller

- [[Müfredat]] — merkez içe aktarma yüzeyinin sahibi

<!-- generated:end -->

## Notlar

Bugün ara alanı platform kullanıcısı yapılandırılmış veriyle (JSON) doldurur. Dilim 3'te PDF
ayrıştırıcısı **aynı şekli** üretecek; bu yüzden ara alanda elle girişe özel hiçbir alan yoktur.

## Açık Sorular

- İçe aktarma tek platform hesabıyla uçtan uca denenemez (iki kişi kuralı ikinci hesap ister).
  İkinci platform hesabı açma yolu 0019 dilimine bağlı.
