---
tags: [ofis, handoff]
---

# SESSION-HANDOFF — Ajanlar Arası Beyaz Tahta

> Sahibi: Teknik Lider (`oksis-tech-lead`). Her ajan işe bu dosyayı okuyarak başlar,
> bitirirken **Günlük**'e bir satır ekler.

## Aktif dilim

_Henüz yok — Teknik Lider ilk dilim planını Faruk'a sunacak._

## Masalar

| Masa | Ajan | Klasör | Dal | Durum |
|---|---|---|---|---|
| 1 · Yönetim | `oksis-tech-lead` | `~/Repositories/oksis` | — | boşta |
| 2 · Backend | `oksis-backend-developer` | `~/Repositories/oksis-api-wt-backend` | — (dev) | boşta |
| 3 · Web | `oksis-web-developer` | `~/Repositories/oksis-ui-wt-web` | — (dev) | boşta |
| 4 · İnceleme | `oksis-code-reviewer` | `~/Repositories/oksis-ui`, `~/Repositories/oksis-api` | — | boşta |
| 5 · QA | `oksis-qa-engineer` | `~/Repositories/oksis-ui-wt-qa` | — (dev) | boşta |

## Açık engeller / Faruk'un kararını bekleyenler

_Yok._

## Günlük

<!-- Biçim: - YYYY-MM-DD HH:MM · <ajan> · <dilim/dal> · <ne yapıldı> · <sonraki adım/engel> -->
- 2026-10-07 · kurulum · — · Sanal ofis kuruldu: 13 ajan tanımı, 3 worktree, Pixel Agents düzeni · Teknik Lider ilk dilimi planlayacak
- 2026-10-09 · backend · feat/yoklama-yeniden-acma (oksis-api, push edilmedi) · E-41 sunucu dilimi bitti: POST sessions/{id}/reopen, POST sessions/{id}/reopen-requests, GET reopen-requests(?status)/mine, PUT reopen-requests/{id}/decision, AttendanceSessionDto.reopenedUntil, 3 bildirim türü, göç 20261009_attendance_reopen · incelemeye hazır (oksis-code-reviewer); mobil/web istemcileri sözleşmeye göre yazılabilir
- 2026-10-09 · web · feat/canli-yoklama-eylemleri (oksis-ui, push edilmedi, bd41f5a) · E-41 web dilimi: Alınmayanlar eylemleri (Öğretmene aç), Yeniden Açma Talepleri sekmesi, öğretmen talep diyaloğu + roster retro kuralı, bildirim bağlantıları, MSW · tarayıcıda görülmedi; incelemeye hazır
- 2026-10-09 · backend · feat/duyuru-kanallari (oksis-api, push edildi, 9673f73b + 18d50ad6) · E-42 sunucu dilimi: duyuru Channels dispatch'e taşındı (seçim ∩ tercih), sıradan duyuru push anahtarı ANNOUNCEMENT, e-posta özet+bağlantı, teslim raporu push/email kırılımı (skipped/skipReasons), göç 20261009_announcement_channel_defaults · incelemeye hazır; istemci kilidi açılabilir
- 2026-10-12 · backend · feature/odev-tamamlama-raporu (oksis-api, push/merge edilmedi, aad5167f) · Öğrenci Ödev Tamamlama Oranı API dilimi (analiz §8 dilim 1+2): GET homework/completion-report, completion-report/students/{studentPersonId}, completion-report/export (.xlsx + yapılandırılmış log); kapsam sunucuda (homework.manage → school, rehber → homeroom), yeni izin yok, önbellek yok · incelemeye hazır (oksis-code-reviewer); UI codegen yenilenebilir; gerçek SQL'e karşı entegrasyon testi yok (çeviri ToQueryString ile ölçüldü)
- 2026-10-12 · backend · feature/odev-tamamlama-raporu (oksis-api, push/merge edilmedi, 85afa502) · İnceleme düzeltmeleri: Ö-1 gerçek SQL entegrasyon testi (10 senaryo), Ö-2 kararı uygulandı (rehber evreni güncel şubeler, geçmiş dönemde de), tam belirli sıra, export logunda kullanıcı id, "anaokulu" dosya adı · --integration yeşil; merge Faruk'ta
- 2026-10-12 · mobil · feature/odev-tamamlama-raporu (oksis-ui, push/merge edilmedi, c527c33) · Öğrenci Ödev Tamamlama Oranı mobil dilimi (analiz §8 dilim 5+6): Takip merkezine Ödev özet kartı, /homework-report (özet + en düşük üstte liste + tek şube süzgeci) ve /homework-report/[studentId] (toplam, ders kırılımı, son ödevler); rehberin "Sınıfımın ödevleri" sekmesine sınıf oranı kartı · typecheck+lint yeşil, Expo web + MSW ile iki yol gezildi; mobilde test koşucusu yok; rehber başlığı mock'ta görülemedi (mock kapsamı hep school) · incelemeye hazır
- 2026-10-12 15:45 · backend · feature/kulup-tercih-yerlestirme (oksis-api-kulup-tercih worktree, commit/push YOK) · Kulüp tercih planı D1+D2 backend: SchoolSettings.ClubAdmissionMode + göç 20261012_kulup_kabul_sorumlusu, sihirbaz taslak alanı (SaveSeasonDraft/GetSeasonDraft/OpenSeasonFromDraft), GET school-settings/club-settings, ClubAdmissionGate (join/leave/approve/reject 409 Clubs.AdmissionByAdministration), admission bloğu + admissionMode · test-changed yeşil (Domain 1379, Application 3758, Api 518, bekçi 114), entegrasyon yazıldı koşulmadı · açık: mod OpenSeasonFromDraft'ta (Setup) yazılınca hâlâ Active olan eski sezon yeni modla çalışır — yazımın aktivasyona taşınması Faruk kararı
- 2026-10-12 17:45 · web (ortak paketler) · feature/kulup-tercih-yerlestirme (oksis-ui-kulup-tercih worktree, yalnız packages/api|core|api-mocks, commit/push YOK) · Kulüp tercih planı D4–D5 ortak katman: packages/api club/placement-endpoints+placement-queries (useClubPlacements, useAutoPlaceClubPlacements, useSaveClubPlacements, useClubPlacementDiff, usePublishClubPlacements, isClubPlacementStaleError), core club/placement.ts taslak düzenleme yardımcıları + CLUB_PLACEMENT_* etiketleri, MSW yerleştirme handler'ları + 42 öğrencilik evren (admission-roster.ts), senaryo `placement`/`placementStale`; öğrenci `result` artık yayından · typecheck 6/6 + lint + vitest yeşil (core 1231, api 402, api-mocks 326) · açık: gövde doğrulama hataları `Validation` kodlu (Clubs.Validation değil); mock yayın kulüp memberCount'unu artırmaz; W7 web ekranı bekliyor
- 2026-10-14 · backend · feature/ogrenci-veli-etkinlik (oksis-api-etkinlik worktree, push/merge edilmedi, d7674a19) · Öğrenci/veli etkinlik görünümü: GET attendance/students/{id}/activities (StudentActivityDto; KVKK: başka katılımcı yok, öğrenci çağırınca count null, iptal kalır), StudentAttendanceScopeGuard kapsamı · test-changed yeşil (Domain 1415, Application 3901, Api 565, bekçi 116), Attendance entegrasyon 238/238 (yeni 4) · incelemeye hazır; UI codegen yenilenmeli (yeni uç, additive)

## Arşiv
- 2026-10-12 · web · feature/odev-tamamlama-raporu (oksis-ui, push/merge edilmedi, ce2616b) · Öğrenci Ödev Tamamlama Oranı web dilimi (analiz §8 dilim 3+4): Raporlar › Ödev Panosu'na Pano / Tamamlama Oranı sekmeleri (?tab=completion), özet kartlar + süzgeçler + üç hâlli sıralama + öğrenci yan paneli + Excel; rehber için "Sınıfımın raporu" bağlantısı ve /homework/report; dönem topbar bağlamından · typecheck+lint yeşil, web'e vitest (node) eklendi 15 test; MSW + Playwright ile idare/rehber/boş durum gezildi (rehber kapsamı fetch sarmalıyla) · açık: exportHomeworkCompletionReport Content-Disposition dosya adını döndürmüyor (ad istemcide kuruluyor); bileşen render testi için jsdom/testing-library yok · incelemeye hazır
- 2026-10-12 17:30 · web · feature/kulup-tercih-yerlestirme (oksis-ui-kulup-tercih worktree, commit/push YOK) · Kulüp tercih planı W1–W6 web: sihirbaz Adım 5'e Kulüp Üye Kabul Sorumlusu alanı + özet satırı (K-11 bayrağı NEXT_PUBLIC_FEATURE_CLUB_ADMINISTRATION_ADMISSION=enabled, varsayılan kapalı), Ayarlar › Akademik Politikalar salt okunur Kulüp Politikası kartı, kulüp formu/danışman paneli/idare detayı İdare modu, kulüp listesi girişi + dönem rozeti, /clubs/placement Tercih Dönemi sayfası; sihirbaz mock'u clubAdmissionMode taşır · typecheck+lint+vitest yeşil; MSW + Playwright ile 4 dönem durumu, dönem yok, öğretmen modu, öğretmen rolü, bayrak açık/kapalı gezildi · açık: §10 sihirbaz kilidi (reopen-to-draft) yok, kulüp listesi Başvuru sütunu İdare modunda gizlenmiyor, W7 sonrası Yerleştirmeye geç düğmesi
- 2026-10-12 17:15 · mobil · feature/kulup-tercih-yerlestirme (oksis-ui-kulup-tercih worktree, yalnız apps/mobile, commit/push YOK) · Kulüp tercih planı §7 M1/M2/M3/M4/M6: keşif kabul banner'ı (none/byAdministration/open/submitted/evaluating/published, "Son gün 22 Eylül", Tercih Et/Düzenle), yeni /clubs/preference (3 slot + sheet seçici, ok düğmeleriyle sıra, temizle, K-4 değişiklik uyarısı, salt okunur kapalı dönem, blockReason, sonuç kartı), detayda İdare modunda Katıl/Ayrıl gizli + "Tercih listeme ekle" (önseçimli yönlendirme), Kulüplerim boş metni, danışman başvuru şeridi/rotası gizli + bilgi bandı; veliye dokunulmadı (K-8) · typecheck+lint yeşil, mobilde test koşucusu yok; Expo web + MSW ile öğretmen/idare × dönem × uygunluk senaryoları gezildi · ortak pakete dokunulmadı; M7 bildirim yönlendirmesi D6'da

- 2026-10-14 · REQ-006 (mobil profil veri bağlama) · oksis-ui-req006 `design/req-006` @ a1c3cf1: öğretmen/öğrenci/veli/yönetici profil sayaç-satır-çipleri gerçek uçlara bağlandı (push/merge yok). Açık: öğretmen Öğrenci sayacı, veli Yeni not, öğrenci Ortalama/Devam/Ödev, görüşme saati, acil iletişim, rozetler.
- 2026-10-14 · REQ-009 (mobil gezinme) · oksis-ui-req009 `design/req-009` @ 01db8d3: "geldiğin sekme vurgulu kalır" — anasayfa/Daha fazla/Devamsızlık/Programım sekmeleri kendi Stack grubu (`(tabs)/(home)` …), paylaşılan modül ekranları dizi grubu dosyası (`(home,more)/activities.tsx`); `pushModuleRoute` + core `mobileModuleEntryTab`; kökte oturum hidrasyonu (web doğrudan URL 401 hatası). typecheck/lint/core vitest temiz, ekran testi YAPILMADI (push/merge yok). Açık: kök yığın tam ekranları (kulüpler, rehber, erken çıkışlar…) sekme çubuksuz kaldı.
- 2026-10-14 · REQ-014 (B-122 zorunlu parola sunucu kapısı) · oksis-api-req014 `feature/zorunlu-parola-sunucu-kapisi` (dev tabanlı, push/merge yok): PasswordChangeGateMiddleware + [AllowWhilePasswordChangeRequired] (muaf: change-password, logout, logout-all, refresh, me/context); bayraklı token diğer her uca 403 identity.account.password-change-required; OpenAPI 403 notu; Api.UnitTests 598 yeşil. Bağımsız kod inceleme + güvenlik denetimi bekliyor. Açık: istemci yönlendirmesi (web/mobil) ayrı talep.
- 2026-10-14 · REQ-014 inceleme sonucu (B-122) · oksis-api-req014 `feature/zorunlu-parola-sunucu-kapisi`: bağımsız kod incelemesi DÜZELTMEYLE ONAY — kapı hattı `AuthPipelineSetup` altında Program/test ortak, ortak muafiyet politikası (`IAllowAnonymous` dâhil), OpenAPI `$ref` 403 notu; düzeltmeler dalda (push/merge yok).
- 2026-10-14 · REQ-014 güvenlik denetimi (B-122) · aynı dal: DÜZELTMEYLE ONAY — O-1 aynı parola reddi, O-2 change-password 5/dk + kilit sayacı, O-3 perms_ver bump, D-1 claim yedek zinciri, D-3 cihaz silme muaf; tam `--integration` yeşil (ClamAV ayağa kaldırılarak). Takip: D-2 metrik/örnekleme; istemci REQ-017.
