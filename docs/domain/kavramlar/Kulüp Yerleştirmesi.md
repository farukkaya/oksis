---
aliases: [ClubPlacement, Yerleştirme, Yerleştirme Satırı]
tags: [domain/clubs]
table: school.club_placements
status: active
last-synced: 2026-10-12 (b415d6fc)
---

# Kulüp Yerleştirmesi

<!-- generated:start -->

## Nedir

Bir öğrencinin bir [[Kulüp Tercih Dönemi]]'ndeki **taslak** ve **yayınlanmış** kulübü — idarenin "kim hangi kulübe" kararı. Koordinatı **dönem × öğrenci**, tekil. Bir üyelik değildir: yayınlanınca [[Kulüp Üyeliği]] üretir ama onun yerine geçmez; başvuru ve üyeliğin tek kayıt olması kararı ([[0014-kulup-basvurusu-ve-uyeligi-tek-kayit]]) korunur.

## Yaşam döngüsü

```
  (satır yok = "yerleşmedi")
        │  Otomatik yerleştir / Kaydet
        ▼
  taslak kulüp (auto | manual, kilitli/kilitsiz) ──Yayınla──► yayınlanmış kulüp + üyelik
        ▲                                                         │
        └──────────── elle düzeltme (yayın sonrası) ──────────────┘   yalnız fark yeniden yayınlanır
```

- **Satır yalnız gerektiğinde vardır**: taslak ataması, kilidi ya da yayın geçmişi olan öğrenci için. Yerleştirme ekranının evreni satırlardan değil dönemin kapsamından canlı türer; satırı olmayan aday "yerleşmedi" görünür. Sonradan okula gelen öğrenci için hiçbir yazma gerekmez ve okuma ucu yazmaz.
- **Taslak kimseye ulaşmaz**: Kaydet ve Otomatik yerleştir bildirim üretmez. Taslak dönem açıkken de yazılabilir (ön çalışma); Hazırlık'ta yazılamaz.
- **Yayın** taslağı yayınlanmış hâle kopyalar ve yayın sürümünü satıra yazar. "Yayınlanmamış değişiklik" taslak ile yayının farkıdır, saklanmaz.

## Kurallar

- **Otomatik yerleştirme saf bir hesaptır** (aynı girdi, aynı sonuç). Turlar 1., 2., 3. tercih sırasıyla döner; yer yetmeyen kulüpte [[Kulüp Tercihi]]'nin son kayıt anı erken olan kazanır, eşitlikte öğrenci kimliği. Aktif olmayan kulübe verilmiş tercih atlanır. **Otomatik yerleştirme kontenjanı asla aşmaz**; elle aşılmış bir kulübün kalan yeri sıfır sayılır.
- **"Boş kontenjanlara dağıt"** seçeneği yerleşmeyenleri ve tercih yapmayanları önce en çok boş yeri olan **kontenjanlı** kulübe, yer kalmadıysa sınırsız kulüplerin en az dolusuna atar. Sınırsız kulüp taşma havuzudur; "sonsuz boş yer" sayılsaydı herkes tek kulübe yığılır, okulun planladığı dağılım boş kalırdı.
- **Elle değişiklik satırı kilitler** ve kaynağı "elle" yapar. Otomatik yerleştirme "elle düzenlenenleri koru" seçeneğiyle kilitli satıra dokunmaz; seçenek kapalıysa kilitleri de yeniden hesaplar.
- **Yayınlanmış satır otomatik yerleştirmenin dışındadır** — seçenekten bağımsız. Yeri doluluğa girer ama yeniden hesaplanmaz; onu yalnız idarenin elle düzeltmesi değiştirir. Aksi hâlde varsayılan seçenekle yapılan bir koşu yüzlerce öğrenciyi kulüpten çıkarıp toplu bildirim üretebilirdi.
- **Elle atamada dolu kulübe atama serbesttir** (karar K-7): kontenjan bir uyarıdır, kapı değildir; tabloda kulüp "aşım" bayrağıyla döner. Elle atamanın engelleri (400): öğrenci evrende olmalı, kulüp sezonun aktif kulübü olmalı, yerleştirme **dışı** canlı üyeliği olan öğrenciye kulüp atanamaz (boşaltmak serbest).
- **Yayın tek işlemdir** ve kapıları sabittir: öğretmen modu, Hazırlık, açık dönem ("önce tercihi kapatın"), bayat sürüm damgası ve önizlemedeki engeller 409 döner. **Kısmi yayın yoktur**: yerleştirme dışı canlı üyeliği olan ya da aktifliğini yitirmiş kulübe atanmış öğrenci bütün yayını durdurur; onaylanan önizleme ile uygulanan sonuç ayrışmasın.
- **Önizleme ve yayın aynı fark hesabını kullanır**: önizlemede görülen, yayının uyguladığıdır. Yalnız evrendeki öğrenciler yayına girer; evrenden düşmüş öğrencinin üyeliği kayıt akışlarının konusudur.
- **Yayının etkileri**: yeni yerleşene üyelik doğar ve kulübün sayacı kontenjanı bilerek atlayarak artar ([[Kulüp]], `AdmitByPlacement`); kulübü değişenin eski yerleştirme üyeliği ayrılır, yenisi aktif doğar; taslakta boşaltılanın üyeliği ayrılır. İkinci yayın yalnız farkı uygular; fark yoksa çağrı no-op'tur (sürüm artmaz, bildirim gitmez).
- **Yerleştirmenin ürettiği üyelik kimlikle bağlıdır**: öğrencinin canlı üyeliğinin yerleştirmeden mi doğduğu yoksa yerleştirme dışı mı olduğu (önceki moddan kalan üyelik) yalnız bu bağla ayırt edilir — kulüp kimliğini karşılaştırmak aynı kulüpte elle açılmış bir üyeliği yanlış sahiplenirdi.
- **Eşleşen tercih sırası saklanmaz**; taslak kulüp ile öğrencinin tercihinden her okumada hesaplanır. Dönem açıkken tercih değişebilir, saklanan sıra bayatlardı.
- **Kulüpler arası tek üyelik veritabanında korunmaz**: üyelik indeksi okul × kulüp × öğrencidir ve üyelik sezon kolonu taşımaz. Kural uygulama katmanındadır (yayın engeli + sezon kuralları); eşzamanlı iki yayını dönem damgası sıraya sokar, idare modunda öğrencinin katılma yolu kapalı olduğundan yayınla yarışan bir katılım da yoktur.
- **Kulüp saati hizalaması yayından sonra** çalışır: yeni üyeler bugünün kulüp saati etkinliğine yayının commit'inden sonra eklenir; hizalamanın hatası yayını geri almaz, sonraki hizalama eksiği tamamlar ([[Kulüp Etkinliği]]).

## İlişkiler

- [[Kulüp Tercih Dönemi]] — sahibi; FK'lı, dönem × öğrenci tekil; sürüm damgası dönemdedir
- [[Kulüp Tercihi]] — otomatik yerleştirmenin girdisi
- [[Kulüp]] — atanan kulüp; yayında sayacı kontenjanı atlayarak artar
- [[Kulüp Üyeliği]] — yayının ürettiği üyelik; satır onu kimlikle sahiplenir
- [[Şube]] — yerleştirme tablosunun süzgeci ve kulüp saati kapsamının kaynağı

## Geçtiği modüller

- [[Kulüpler]] — yerleştirme ekranı, otomatik yerleştirme, önizleme ve yayın
- [[Bildirimler]] — yayının öğrenciye, veliye ve danışmana giden sonuç bildirimleri

<!-- generated:end -->

## Notlar

<El yazısı alan. Senkron buraya dokunmaz.>

## Açık Sorular

- Yayınlanmış bir öğrenci evrenden düşerse (okuldan ayrılma) satırı fark hesabına girmez ve üyeliği "kayıt akışlarının konusu" sayılır. Kayıt akışı (ayrılma/nakil) kulüp üyeliğini bugün kapatıyor mu? Bu dalda doğrulanmadı.
- Yerleştirme sonucu Excel çıktısı plan kararıyla (K-13) ileriye bırakıldı; kodda yok.
