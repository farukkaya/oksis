# Duyurular C Fazı — Plan Dizini

**Tarih:** 2026-08-05
**Girdi:** `docs/superpowers/specs/2026-08-02-duyurular-uctan-uca-design.md` §14 + B fazında biriken işler
**Kararlar:** 2026-08-05 gereksinim analizi turunda beş blokaj sorusu cevaplandı (aşağıda)

C fazı tek plan için fazla geniştir: dört bağımsız alt sistem içerir ve her biri kendi başına çalışan, test edilebilir yazılım üretir. Dört ayrı plan olarak yazılmıştır.

---

## Planlar

| Plan | Kapsam | Görev | Backend'e dokunur mu |
|---|---|---|---|
| [C1 — Sözleşme ve metin temizliği](2026-08-05-duyurular-c1-sozlesme-temizligi.md) | Hata metni konvansiyonu, bildirim türleri, kanal kilidi, geri çekme metni, rapor tablosu, testler, yeniden adlandırma | 9 | Evet (yalnız validator mesajları) |
| [C2 — Sunucu sayfalaması](2026-08-05-duyurular-c2-sayfalama.md) | Çoklu statü filtresi, özet sayaç ucu, gelen kutusu sayfalaması, istemci geçişi | 8 | Evet (yeni uç + 3 imza) |
| [C3 — Ek dosya uçtan uca](2026-08-05-duyurular-c3-ek-dosya.md) | Tek adımlı yükleme, `packages/api/files` modülü, indirme yüzü, compose bağlanması | 7 | Evet (1 DTO alanı) |
| [C4 — Yönlendirme ve bağlar](2026-08-05-duyurular-c4-yonlendirme-baglar.md) | `restore` bağlanması, rol→rota çözümü, web detay rotası, moderasyon ↔ ayarlar | 8 | Hayır |

**Toplam: 32 görev.**

---

## Alınan kararlar (2026-08-05)

| # | Soru | Karar |
|---|---|---|
| B1 | Sayfalama kapsamı | **Tam sunucu sayfalaması** — filtre, arama ve sayaçlar sunucuya taşınır; özet için yeni uç açılır |
| B2 | Ek dosya akışı | **Tek adımlı `POST /files`** + indirme yüzü C'ye dâhil. Presigned akış yazılmaz (`ForcePresigned: false`) |
| B3 | Derin bağlantı | **İstemci tarafı rol→rota eşlemesi**. `oksis://` yazılmaz, backend `deepLink`'i değişmez |
| H1 | Compose'daki push/e-posta | **Kilitli + "yakında"** — gövdeye yalnız `inApp` yazılır |
| H2 | Hata metinleri | **Validator mesajları Türkçeye çekilir** — istemcide anahtar→metin haritası yok |

---

## Önerilen sıra

```
C1  (bağımsız, backend codegen gerektirmez)
 ↓
C2 + C3'ün backend adımları birlikte  →  TEK codegen turu  →  ikisinin istemci adımları
 ↓
C4  (yalnız istemci)
```

**Gerekçe:** C2 (yeni `summary` ucu, `PagedResult` dönen gelen kutusu, çoklu `status`) ve C3 (`AnnouncementAttachmentDto.FileId`) ikisi de `packages/api/src/generated/schema.ts`'i yeniler. Backend adımları peş peşe yapılıp **tek** codegen turu koşulursa iki ayrı şema eşitleme turu yaşanmaz. C1 ve C4 şemaya dokunmaz, istenen yerde çalıştırılabilir.

C1'i öne almanın ikinci sebebi: C3 ve C4 görevleri C1'in ürettiği `mutationErrorDesc` yardımcısına yaslanıyor (her ikisinde de C1 uygulanmadıysa ne yazılacağı ayrıca belirtilmiştir, yani sıra zorunlu değil — yalnız daha ucuz).

---

## C fazına GİRMEYEN işler ve gerekçeleri

| İş | Durum | Gerekçe |
|---|---|---|
| **Şablon CRUD arayüzü** | Beklemede — plan yazılmadı | API katmanı B'de bağlandı (3 uç + 3 hook + 3 MSW handler hazır), ekran yok. Tasarım handoff'u gelmeden ekran icat etmek CLAUDE.md handoff kuralına aykırıdır. Handoff geldiğinde cevaplanacak sorular şimdiden belli: kullanımdaki şablonun silinmesi (`usageCount`), silme onayı, şablondaki `urgent` alanının anlamı, mobil `templates.tsx` ile eşitlik |
| **Web veli/öğrenci okuma yüzü** | Kapsam dışı (K-7) | Tasarım çizilmemiş. Yeniden kullanılabilecek çekirdek (`filterInbox`, `partitionInboxByValidity`, `countUnreadByChild`) hazır; `handoff-web` ile teslim geldiğinde bağlanır. C4'te açılan `/announcements/[id]` rotası **yönetim yüzeyidir**, okuma yüzü değil |
| **Push / e-posta teslim zinciri** | Kapsam dışı (K-2, D fazı) | C1 bu sınırı gizlemek yerine ekranda görünür kılar (kilitli kanal + "yakında") |
| **`expo-document-picker`** | Backlog | Mobilde PDF eki için gerekli; native yeniden derleme gerektirdiği için C3 kapsamı dışında bırakıldı. Mobil ekranda sınır açıkça yazılır, sessizce geçilmez |
| **Gelen kutusunda sunucu araması** | Backlog | `GET /announcements/inbox` `q` parametresi almıyor; C2 sayfalama ekler ama arama istemcide kalır (gelen kutusu hacmi envanterden küçüktür) |

---

## Analiz turunda bulunan, listede olmayan boşluklar

Bu beş kalem kullanıcının C listesinde yoktu; depo doğrulaması sırasında bulundu ve planlara dâhil edildi:

1. **Gelen kutusunda sayfalama hiç yoktu** — ne istemcide ne sunucuda; `Take` yok, uç `pageSize` bile kabul etmiyordu → C2 Task 3
2. **7 duyuru `NotificationKind`'ı istemcide tanınmıyordu** — hepsi "Bildirim" + zil ikonuna düşüyordu → C1 Task 3
3. **Ek dosya indirme bağlantısı çalışmıyordu** — `<a href>` bir JSON zarfına işaret ediyordu, auth başlığı da yoktu → C3 Task 6
4. **Web'de `/announcements/[id]` rotası yoktu** — backend'in yazdığı `deepLink` web'de 404 dönüyordu → C4 Task 6
5. **Altı yerde "sessiz saat kısıtı delinir" yazıyordu** — spec §8.3 böyle bir kısıt kurulmadığını açıkça söylüyor → C1 Task 8

Ayrıca iki iddia depo üzerinde **doğrulanmadı** ve düzeltildi:

- **`requiresApproval` backend'de testsiz değil** — `AnnouncementModerationPolicyTests` 7 vaka + kova vakasıyla var. Eksik olan **istemci** tablosuydu (`logic.test.ts`'te `requiresApproval` hiç geçmiyordu) → C1 Task 4
- **`api-mocks` restore handler'ı artık doğru** — spec §13'ün "koşulsuz `published` yazıyor" notu güncelliğini yitirmiş; handler `statusBeforeWithdraw`'a dönüyor. C4'te düzeltme gerekmedi
