---
aliases: [Attendance, api/v1/attendance, Devamsızlık, Etkinlikler]
tags: [domain/academic, module]
status: completed
last-synced: 2026-08-10 (2270867)
---

# Yoklama ve Devamsızlık

<!-- generated:start -->

## Ne yapar

Öğretmenin her ders için yoklama aldığı, idarenin mazeret ve düzeltmeleri karara bağladığı, sistemin devamsızlık toplamlarını hesaplayıp eşiğe yaklaşan öğrenciyi bildirdiği modül. Gezi ve tören sayımları da burada tutulur.

Modülün taşıyıcı fikri **dondurma**: bir yoklama oturumu programdan doğar ama doğduğu anda dersin, öğretmenin ve saatin bilgisi kaydın içine kopyalanır. Program sonradan değişse bile geçmiş yoklama olduğu gibi kalır. Devamsızlık bir öğrencinin sınıfta kalmasına yol açabildiği için kaydın geriye dönük olarak yeniden yorumlanmaması esastır.

İkinci fikir **dar pencere + izne bağlı yol**: düzeltme kısa süre serbesttir, sonra idare iznine bağlanır. Ne donmuş bir kayıt ne de sınırsız düzeltme — ikisinin ortası.

## Kullandığı kavramlar

- [[Yoklama Oturumu]] — modülün ana aggregate'i; kayıtlar içinde yaşar
- [[Mazeret]] — devamsızlığın gerekçelendirilmesi
- [[Düzeltme Talebi]] — pencere kapandıktan sonraki düzeltme yolu
- [[Devamsızlık Özeti]] — dönem toplamları ve eşik motoru
- [[Etkinlik Yoklaması]] — gezi/tören güvenlik sayımı
- [[Ders Programı]] / [[Program Sürümü]] — oturumların türediği kaynak
- [[Program İstisnası]] — iptal ve vekâlet oturumu doğrudan değiştirir
- [[Zil Çizelgesi]] — oturumun saat aralığı
- [[Şube]] / [[Ders]] / [[Dönem]] / [[Kişi]] — oturumun bağlamı ve özneleri

## Ana akışlar

1. **Oturum üretimi** — Oturumlar elle açılmaz; yayınlanmış program sürümünden o güne materialize edilir. Program alanları yazım anında dondurulur. Üretim, bugünü de kapsayan dar bir telafi penceresiyle sınırlıdır ve bu sınır gün sonu kapatma penceresiyle **aynı tutulur** — ayrışsalardı sistem hiç kapatılamayacak, sonsuza dek bekleyen oturumlar üretirdi.

2. **Yoklama alma** — Öğretmen kendi oturumunu açar, listeyi görür, durumları işaretler ve gönderir. Beş durum vardır: var, yok, geç, izinli, raporlu. Gönderim tamamlar; aynı içerikle ikinci gönderim sessizce geçer, farklı içerikle gönderim reddedilir.

3. **Vekâlet** — Ders programında o güne vekâlet yazılmışsa oturumun efektif öğretmeni **vekildir**: yoklamayı o açar, kayıt onun üzerine yazılır, vekillik bir rozet olarak taşınır. Oturumu yalnız efektif öğretmeni görebilir; başkasına "bulunamadı" döner. İptal istisnası varsa oturum doğrudan iptal olarak doğar. **Nöbetin yoklama ile bağı yoktur.**

4. **Alınmayanlar ve hatırlatma** — Ders saati geçtiği hâlde girilmemiş oturumlar için otomatik hatırlatma gider; oturum başına bir kezdir ve durumu değiştirmez. İdare listeden görüp elle de hatırlatabilir. Gün sonunda hâlâ girilmemişse oturum "alınmadı" olur.

5. **Retro giriş** — İdare, alınmamış bir oturumu sonradan tamamlayabilir. Oturum "geriye dönük girildi" şerhini alır ve rapora bu şekilde düşer.

6. **Düzeltme** — Kısa pencere içinde öğretmen tekil kaydı doğrudan düzeltir. Pencere kapandıktan sonra yalnız idare düzeltebilir; öğretmenin yolu gerekçeli [[Düzeltme Talebi]]'dir.

7. **Mazeret** — Veli bildirir ya da sekreterlik kaydeder (ikincisi doğrudan onaylı açılır). Belge ayrı bir yükleme akışıyla iliştirilir. Onay geçmiş kayıtları çevirir ve kayda **gerçekten** kaç kaydın değiştiği yazılır — önizlemedeki tahmin değil.

8. **Gün içi izin** — Öğrenci erken ayrıldığında verilir; o periyottan sonraki dersler izinli varsayılır ve etkilenen kayıtlar bu sebeple işaretlenir.

9. **Devamsızlık muhasebesi** — Toplamlar dönem başına yeniden hesaplanır (tam değiştirme). Gün eşdeğerliği, geç birikimi ve devreden devamsızlık burada birleşir. Eşiğe gelen öğrenci için uyarı üretilir; mükerrer bildirim iki katmanlı korunur.

10. **Etkinlik sayımı** — Etkinlik tanımlanır, sorumlu öğretmen gruplarına bölünür, her gruba sayım turları ve katılımcı listesi verilir. Sayım devamsızlığa girmez; katılımcıların o saatteki dersleri toplu mazeretlenir. Sorumluluk devredilebilir, etkinlik iptal edilebilir — sayım kayıtları hiçbir durumda silinmez.

11. **Raporlar ve izleme** — Okul geneli canlı pano, dönem ve eğilim raporları, risk altındaki öğrenci listesi, öğrenci bazlı özet ve günlük görünüm. Kayıt değişiklikleri ayrı bir geçmiş kaydında izlenir.

**Yetki:** Okuma `attendance.read`, yoklama girme `attendance.write`, idare işlemleri (karar, retro, hatırlatma, etkinlik yönetimi) `attendance.manage`, raporlar `attendance.report`.

## Kapsam dışı

- **Kendi dosya deposu.** Mazeret belgeleri Documents modülünde saklanır; bu modül yalnız referans taşır.
- **Eşik politikasının kendisi.** Kaç gün uyarı, kaç gün sınır — okul ayarıdır; modül yalnız uygular.
- **Nöbet.** Nöbetçi öğretmenin yoklama ile bir bağı yoktur; bkz. [[Nöbetler]].

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- Etkinlikte grup sorumluluğu devredildiğinde turlardaki öğretmen kopyası güncellenmiyor — devirden sonra tur eski öğretmende kalıyor.
- Eşik bildirimi önbellek kesintisinde açık kalacak şekilde davranıyor (fail-open); kesinti anında mükerrer uyarı riski var.
- "Hatırlat" eylemi guard taşımıyor; eşzamanlı iki basış iki bildirim gönderebilir.
- Oturum kilitleme damgası tanımlı ama hiçbir yerde yazılmıyor; dönem kapanışında kilitleme planlanıyor mu?
- Onaylanmış bir mazeretin geri alınma yolu görünmüyor.
