# Sınav Oturumu Ayrıntısı Ekranı — Tasarım Brief'i (Oksis Layout v2)

> **Hedef:** claude.ai/design `Oksis Layout v2` (`7d876f6c-70ee-4894-bac1-2be5c96dd34a`)
> projesinin sohbetine yapıştırılacak prompt. Projeye `uploads/oturum-ayrintisi-brief.md`
> olarak da yüklendi.
> **Kaynak tasarım belgesi:** `oksis/docs/superpowers/specs/2026-09-09-sinav-takvimi-faz2a-design.md`
> (K-14…K-26, güncellenmiş EX-H/EX-S tablosu).
> **Uygulama planı:** `oksis/docs/superpowers/plans/2026-09-09-sinav-takvimi-faz2a.md`, Görev 7.5.
> **Not:** Backend HENÜZ YAZILMADI — mock-first, ama wire şekli aşağıda verilmiştir ve
> sözleşmedir (R11). Alan adı uydurulmaz.

---

Aşağıdaki blok tasarım projesinin sohbetine olduğu gibi verilir:

---

`exam` modülünün Faz 1'i teslim edildi ve **kodlandı** — `web/exam-board.jsx`,
`web/exam-place.jsx`, `web/exam-windows.jsx`, `web/exam-hour-requests.jsx`,
`web/exam-window-modals.jsx`, `web/exam-schedule-tag.jsx`, `web/exam.css`,
`web/exam-data.jsx` ve `mobile/exam-schedule.jsx` yaşayan sözleşmedir. Bu iş
**Faz 2a**: kelebek sınav düzeninin kurulması.

Önce kök `CLAUDE.md`'yi (R1–R14 + Bölüm A/B) oku ve her işte ona uy: PageHeader,
token'lar, en yakın ekranı fork et, mock alan adları İngilizce ve wire şekliyle
aynı (R11), her ekran `loading / empty / error` durum matrisi tanımlar (R8),
biten ekran `manifest.json`'a yazılır (R7), ham hex yalnız iki dosyada (R10),
yüzeyler karışmaz (R13). Ders tonu **mevcut** `SUBJECT_PALETTE` +
`subjectColorIndex` ile gelir — ikinci palet açma.

## ÖNEMLİ — 2026-09-08 brief'inin oturum bölümü GEÇERSİZ

`uploads/sinav-takvimi-brief.md` oturum modunu bir varsayımla anlatıyordu. Kullanıcıyla
2026-09-09'da yapılan oturumda model değişti. Aşağıdakiler **artık yanlıştır**, kullanma:

| Eski (geçersiz) | Yeni (geçerli) |
|---|---|
| `roomAllocation` · `seat` · `invigilation` kimlikleri | **`examRoom` · `examSeat`**; gözetmen ayrı varlık değil, dersliğin alanı |
| "Yazan yalnız yöneticidir" | **Oturumu hem öğretmen hem yönetici açar** |
| "Derslik tahsisi: yönetici derslik seçer" | **Derslik seçilmez, türetilir** — giren şubelerin kendi sınıfları |
| "Şube bölünerek dersliklere dağılır, 9-A'nın 1..15'i" | **Ardışık dilim yok.** Öğrenciler oransal serpiştirmeyle karışır |
| "Gözetmen havuzundan atama" | **Gözetmen atanmaz, türetilir** — o saatte o şubeye dersi olan öğretmen |
| "Derslik kapasitesi aşılamaz" (sert kural) | **Kapasite aşımı yalnız renkle gösterilir**, engellemez |
| "Aynı tarihte oturumlar çakışamaz" | **Oturumlar çakışabilir.** Çakışamayan derslik, öğrenci ve gözetmendir |

## Kelebek gerçekte nasıl çalışıyor

Ahmet öğretmen matematik sınavını salı 2. derse koyuyor. O dersi okuttuğu bütün
şubeler (9-A, 9-B, 10-C) aynı anda sınava giriyor. **Boş derslik aranmıyor:** o üç
şubenin kendi sınıfları oturumun derslikleri oluyor. Üç sınıfın öğrencileri
karıştırılıp aynı üç sınıfa yeniden dağıtılıyor — kazanç yer açmak değil, komşuyu
değiştirmek.

O saatte o sınıflarda programda ne varsa (10-C'de fizik olabilir) iptal oluyor ve
**o dersin öğretmeni kendi girdiği sınıfta gözetmen oluyor** — boşa çıkıp yeniden
dağıtılmıyor, zaten orada. Ahmet kendi ders saatini seçtiyse o da bir dersliğin
gözetmenidir; başka bir saat seçtiyse dersliksizdir ve dolaşır. Her iki hâlde
sınavın sorumlusudur.

Yönetici bu kurulumu **yapmaz, denetler**: gözetmen türetilemeyen dersliği doldurur,
derslik ekler/çıkarır, sıra takas eder, iki öğretmenin aynı saatteki oturumunu
birleştirir (üç matematik öğretmeninin öğrencileri o zaman gerçekten karışır).

**Serpiştirme kuralı:** hiçbir öğrencinin yanı kendi şubesinden olmaz. Sıra dizisi
`9-A · 9-B · 10-C · 9-A · 9-B · 10-C …` diye gider. Şubeler eşit mevcutlu olmasa da
küçük şube diziye eşit aralıklarla yayılır, kuyrukta yığılmaz.

---

## İş 1 · `web/exam-session.jsx` — Oturum Ayrıntısı (ASIL İŞ)

Yönetici ekranı. Panodaki bir oturum kartına tıklayınca açılır.

**Fork kaynağı:** `web/exam-board.jsx` (aynı modülün kabuğu, aynı `exam.css`).
Sol/sağ iki sütunlu düzen için `web/session_roster.jsx` ve `web/ayarlar_derslik.jsx`
emsaldir — ikisini de aç, hangisi daha yakınsa onun iskeletini al.

### Yerleşim

**Üst şerit (PageHeader altı, bağlam kartı):**
Ders adı ve tonu · tarih · ders saati (`2. ders`, zil çizelgesinden gelen metin) ·
sorumlu öğretmen(ler) · sürüm rozeti (`v2` — yalnız yayın sonrası değişiklik varsa) ·
özet sayılar: *3 şube · 3 derslik · 90 öğrenci*.

**Sol sütun — derslik listesi.** Her satır:
- Derslik adı (`9-A Sınıfı`)
- Gözetmen adı + **kaynak rozeti**: `türetildi` (nötr, sessiz) veya `elle` (vurgulu).
  Gözetmen yoksa **kırmızı "gözetmen eksik"** — bu yayını engelleyen tek eksiktir,
  görsel ağırlığı buna göre olsun.
- `mevcut / kapasite` — aşımda kırmızı (`32/30`), normalde sessiz
- Şube dağılımı çipleri: `9-A ×11` `9-B ×10` `10-C ×11`. Tek çip kalmışsa
  (karışım olmamış) sarı uyarı tonu.
- Elle eklenen derslik ayırt edilir (`konferans salonu` gibi kimsenin sınıfı değil).

**Sağ sütun — seçili dersliğin sıra listesi.** Sıra no · öğrenci adı · okul numarası ·
şubesi (şube tonuyla). Takas edilmiş sıra işaretli. Liste uzun (30-35 satır), kendi
içinde kayar.

**Alt şerit — uyarılar.** Sert ihlaller kırmızı, yumuşak uyarılar sarı, ayrı ayrı
gruplu. Ayrıca **dersliksiz şube** uyarısı: "9-D şubesine derslik tanımlı değil —
elle derslik ekleyin."

### Eylemler

| Eylem | Nerede | Not |
|---|---|---|
| Gözetmen doldur / değiştir | Derslik satırı | Öğretmen seçici. Aynı saatte başka dersliğe yazılı öğretmen **seçilemez** (EX-H06) |
| Derslik ekle | Sol sütun başlığı | Derslik seçici; eklenen `manuallyAdded` olur |
| Derslik çıkar | Derslik satırı | Öğrencileri kalan dersliklere dağılır. **Geri gelmez** — yeniden türetme onu atlar |
| Sıra takas | Sağ sütun, iki satır seç | İki sıra **farklı dersliklerde olabilir** — takas derslik değiştirmek demektir |
| Yerleşimi yeniden üret | Üst şerit | **Onay ister** ve kaç takasın silineceğini yazar: "3 elle takas silinecek." |
| Oturum birleştir | Üst şerit | Aynı tarih, saat ve dersteki başka oturumu seçtirir. Yoksa eylem gizlenir |

Yayınlanmış pencerede **her eylem gerekçe ister** — Faz 1'in
`exam-window-modals.jsx`'teki gerekçe modalini fork et, yenisini çizme.

### Durum matrisi (R8)

`loading` · `empty` (oturumda hiç şube yok — silinmek üzere) · `error` · **`gözetmen
eksik`** (yayını engeller, en görünür hâl) · `kapasite aşımı` (bilgilendirici) ·
`dersliksiz şube` · `yayınlanmış` (eylemler gerekçe ister) · `kilitli` (salt okunur).

### Wire şekli — SÖZLEŞME, alan adı uydurma (R11)

`web/exam-data.jsx` içine `MOCK_EXAM_SESSION` olarak ekle. Yeni dosya açma; Faz 1'in
mock dosyası bu modülün tek veri kaynağıdır.

```jsonc
{
  "id": "…", "subjectId": "…", "subjectName": "Matematik",
  "date": "2027-03-09", "period": 2, "periodLabel": "2. ders",
  "version": 1, "windowStatus": "schedulePublished",
  "responsibleTeachers": [ { "id": "…", "name": "Ahmet Yılmaz" } ],
  "sections": [ { "classRoomId": "…", "name": "9-A", "studentCount": 30 } ],
  "rooms": [
    {
      "id": "…", "roomId": "…", "name": "9-A Sınıfı", "capacity": 30,
      "studentCount": 32, "isOverCapacity": true,
      "isManuallyAdded": false, "isExcluded": false,
      "invigilator": { "id": "…", "name": "Ayşe Demir", "source": "derived" },
      "sectionBreakdown": [ { "name": "9-A", "count": 11 }, { "name": "9-B", "count": 10 } ],
      "seats": [
        { "id": "…", "seatNo": 1, "studentName": "Ali Kaya",
          "studentNumber": "101", "sectionName": "9-A", "isManuallySwapped": false }
      ]
    }
  ],
  "violations": [ { "code": "EX-S06", "severity": "soft", "message": "…" } ],
  "classRoomsWithoutRoom": [ { "classRoomId": "…", "name": "9-D" } ]
}
```

`invigilator` **null olabilir** (delik). `invigilator.source` yalnız `"derived"` veya
`"manual"`. `violations[].severity` yalnız `"hard"` veya `"soft"`. `periodLabel`
sunucudan gelir — istemci saat metni üretmez.

---

## İş 2 · `web/exam-board.jsx` — oturum kartı (KÜÇÜK, ama kapı bu)

İş 1'in ekranına girilecek bir yer lazım. Panoya gün × ders saati ızgarasında oturum
kartı ekle: ders adı ve tonu · `3 şube · 90 öğrenci · 3 derslik` · gözetmen eksik
rozeti (varsa) · yumuşak uyarı sayısı. Karta tıklamak İş 1'i açar.

`lessonHour` modundaki pencerede bu kart **hiç görünmez** — mevcut pano davranışı
birebir korunur.

---

## Sormadan çizme

1. **Sıra listesi mi, oturma ızgarası mı?** Ben düz liste öneriyorum: sistem dersliğin
   fiziksel sıra × sütun düzenini bilmiyor, sahte bir ızgara çizmek olmayan bir bilgiyi
   varmış gibi gösterir. Katılmıyorsan söyle, konuşalım.
2. **Sıralar sağ sütunda mı, dersliğin altında açılır panelde mi?** Sekiz derslikli bir
   oturumda iki sütun mu daha iyi çalışır, akordeon mu — senin kararın, gerekçesiyle söyle.

## Teslim

- `web/exam-session.jsx` (yeni), `web/exam-data.jsx` (genişler), `web/exam.css`
  (gerekiyorsa genişler), `web/exam-board.jsx` (oturum kartı), `manifest.json` (R7).
- Yeni renk, ikon veya font üretme. Koyu tema yok.
- Bittiğinde hangi dosyaların değiştiğini ve İş 2'deki iki sorunun cevabını yaz.
