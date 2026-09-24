# Müfredat seçmeli ders seçimi + Sezon Açılış Kontrol Listesi (TB-247)

> Durum: **onaylandı** (2026-09-24, kullanıcı). Bulgu: Bulgu Kayıt Defteri `TB-247` 🔴.

## Sorun

Okul, sezona başlarken MEB çizelgesinin seçmeli dersler bölümünden kendine uygun dersleri **seçer**;
yalnız seçtikleri okutulur. Uygulama ise ortak ve seçmeli dersleri kategorisiz, karışık ve MEB
saatleriyle listeliyor; müdür seçmediği her dersi elle sıfırlamak zorunda. Aktifleştirmede hiçbir
toplam/hazırlık denetimi yok — sezon, MEB toplamını tutmayan müfredatla dondurulabiliyor (9. sınıf
32 saat donduruldu, MEB 40 diyor). "MEB toplamı" ekranda bütün satırların toplamı (59), MEB'in
beyanı değil: beyan edilen toplamlar ayrıştırıcıda sağlama için kullanılıp atılıyor.

## Kararlar

| # | Karar |
|---|---|
| K1 | Tablo MEB PDF düzeninde: **Ortak Dersler** → **Seçmeli Dersler** (MEB kategorisi başına grup; veriden — Akademik Çalışmalar yalnız 11–12'de satır taşır) → dip toplamlar. Sınıf sekmeleri aynen kalır. |
| K2 | Seçmeli dersler varsayılan **seçilmemiş** (0 saat). Seçilen ders MEB saatini alır. Seçim okul düzeltmesi (`school_curriculum_overrides`) olarak saklanır: seçilebilir satırda **düzeltme yoksa 0**. |
| K3 | Bölünmüş seçenekli ortak satırlar ("Görsel Sanatlar/Müzik", 12. sınıfta + Beden Eğitimi) **"Birini seçin"** grubudur (`alternative_group`); biri seçilince diğerleri 0. Ortak toplam MEB beyanını tutar. |
| K4 | MEB'in sınıf başına beyanı saklanır: `master.curriculum_grade_totals` (ortak · seçilebilecek · rehberlik · toplam). Yeni içe aktarım ayrıştırıcıdan alır; yayımlanmış sürümler saklı PDF yeniden ayrıştırılarak doldurulur. |
| K5 | Dip toplamlar: Ortak Ders Toplamı (MEB/Okul), Seçilen Seçmeli Ders Toplamı (MEB seçilebilecek/Okul), Rehberlik ve Yönlendirme, Toplam. Özet kartında "MEB Toplamı" = beyan. |
| K6 | Sınıf başına iki **açık onay**: "Ortak dersleri onaylıyorum" ve "Seçmeli ders kararını onaylıyorum" (kim + ne zaman). O sınıfta bir satır değişirse onaylar düşer. |
| K7 | **Sezon Açılış Kontrol Listesi** tek sunucu değerlendiricisinden (`SeasonActivationReadiness`); önizleme ekranı ve aktifleştirme komutu aynı listeyi okur. 🔴 engeller sunucuda reddedilir; 🟡 uyarılar ekranda tek tek onaylanır; son adımda sezon adı yazılır. |
| K8 | Görevlendirme ekranının "bu sınıfta okutulan dersler" kümesi, sezon varsa **müfredattan** (saat > 0) okunur, katalogdan değil — seçilmeyen seçmeli görevlendirme beklemez. |

## Kontrol listesi

| Kod | Kontrol | Tür |
|---|---|---|
| M1 | Her "Birini seçin" grubunda tam bir ders seçilmiş | 🔴 |
| M2 | Ortak dersler onaylanmış | 🔴 |
| M3 | Seçmeli ders kararı onaylanmış ve seçilen seçmeli toplamı = MEB seçilebilecek | 🔴 |
| M4 | Ortak toplam = MEB ortak; ders toplamı = MEB toplam − rehberlik | 🔴 |
| Y1 | Açık her seviyenin müfredat taslağı ve en az bir şubesi var | 🔴 |
| Y2 | Haftalık saat zile sığar: MEB toplamı ≤ günlük ders × ders günü | 🔴 |
| Y3 | Müfredatta yabancı dil dersi var, okulun o dili seçilmemiş | 🟡 |
| Y4 | Öğrencisi olmayan şube var | 🟡 |
| — | MEB beyanı bilinmiyor (el ile taslak) → M3/M4'ün toplam kısmı uygulanamaz | 🟡 |

## Uygulama sırası

1. Beyan toplamları: ayrıştırıcı → yük (`GradeTotals`) → ara alan → yayım → `curriculum_grade_totals`; doldurma komutu.
2. `alternative_group`: bölücü → yük → ara alan → yayım; mevcut bölünmüş satırlar için veri göçü.
3. Taslak onayları + seçim komutları + çözücü kuralı (K2/K3) + onay düşürme (K6).
4. Diff ucu genişler (tür, kategori, grup, seçili, beyan toplamları, onaylar).
5. `SeasonActivationReadiness` + önizleme + aktifleştirmede zorlama.
6. Görevlendirme kapsamı müfredattan (K8).
7. Web: gruplu tablo, seçim, dip toplamlar, onay düğmeleri, kontrol listesi modalı, sezon adı onayı.
