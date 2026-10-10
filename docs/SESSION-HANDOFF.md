---
tags: [ofis, handoff]
---

# SESSION-HANDOFF — Ajanlar Arası Beyaz Tahta

> Sahibi: Teknik Lider (`oksis-tech-lead`). Her ajan işe bu dosyayı okuyarak başlar,
> bitirirken **Günlük**'e bir satır ekler. Organizasyon: [[oksis-sanal-ofis-organizasyon]].

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

## Arşiv
