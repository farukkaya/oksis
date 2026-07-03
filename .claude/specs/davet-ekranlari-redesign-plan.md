# Davet Ekranları Yeniden Tasarım — Handoff Port Planı

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Her faz sonu **Chrome ekran testi ZORUNLU** (yeşil vitest CSS kırılmasını kaçırır — [[feedback_handoff_css_scr_system]] dersi).

**Goal:** "Oksis Layout — Davet" handoff'undaki 7 davet ekranını, mevcut OKSİS tasarım sistemine **birebir sadık** biçimde, **gerçek React Query hook'larına bağlayarak** canlı bileşenlere port etmek.

**Handoff kaynağı (salt-okunur referans, prototip):** `/private/tmp/claude-501/-Users-farukkaya-Projects-oksis/8badf060-2ed0-4545-ac8f-d1a0465c398f/scratchpad/davet-handoff/design_handoff_oksis_davetler/` — `README.md`, `invite_accept.jsx`, `invites.jsx`, `invites_modals.jsx`, `invites.css`. **Kopyalanacak kod DEĞİL** — look/behavior referansı; OKSİS bileşen kütüphanesi + token + data layer ile yeniden kurulur.

**Architecture:** İki repo değil tek repo (oksis-web). Prototip React-via-Babel global fonksiyonlar (`useStateIA`, `Icon`) + `.inv-*`/`.stu-*`/`.ivs-pill` sınıfları + kendi `invites.css`'i kullanır. Port kuralı: **paylaşılan iskele** (sayfa başlığı, tablo, KPI şeridi, modal kabuğu, badge, satır aksiyonları) → OKSİS'in **gerçek** bileşenleri/sınıfları (`.scr-*`/screen.css, `Modal`/`ConfirmDialog`/`SuccessBody`, mevcut KPI/tablo desenleri); **davete-özel görseller** (`.inv-steps`, `.ivs-pill`, `.iv-life`, `.invlink`, `.pw-meter`, `.inv-verify`, `.inv-consent`) → handoff `invites.css`'inden **co-located** stylesheet olarak portlanır (app global'e enjekte edilmez).

**Tech Stack:** React 18 + TS + Tailwind + shadcn (yalnız gerektiğinde) + React Query + RHF/Zod + i18next. Bileşen/identifier İngilizce PascalCase, UI metni Türkçe i18n ([[feedback_english_component_names]]).

## Global Constraints

- **Handoff-sadık port** ([[feedback_handoff_faithful_port]]): prototip JSX yapısı + `invites.css` görselleri birebir; soyut üretme. Ama gerçek hook'a bağla (mock data DEĞİL).
- **CSS sistemi** ([[feedback_handoff_css_scr_system]]): paylaşılan iskele app'in gerçek sınıflarıyla; davete-özel CSS co-located portlanır. Prototipin `.stu-*` scaffold'ını app'e taşıma — app'in karşılığını kullan.
- **Her faz sonu Chrome ekran testi** (canlı dev): görsel + akış kanıtı. Yeşil vitest yeterli DEĞİL.
- **Gerçek hook'lar (mevcut):** `useInvitations(params)`, `useCurrentConsentBundle()`, `useCreateInvitation()`, `useBulkInvite()`, `useResendUserInvite()`/`useResendInvitation()`, `useRevokeInvitation()` (`modules/users/hooks/useInvitations.ts` + `modules/identity/hooks/useUserActions.ts`); public `useInvitationPreview(token)` + `useAcceptInvitation()` + `acceptPasswordSchema` (`portals/public/pages/invitations/`). Eksik veri (KPI toplamları, batch listesi, kanal/KVKK-versiyon kolonları) BACKEND'DE YOKSA: FrontEnd'i birebir kur, eksik alanı `DebtBadge`/mock-fallback ile işaretle ([[feedback_frontend_first_debt]]) — yeni tablo/endpoint gerekiyorsa ERTELE, borç yaz.
- **Login kompozisyonu (Faz 1):** accept sihirbazı `portals/public/components/AuthCard.tsx` + `login/login.css` kart matematiğini kullanmalı (aynı genişlik/oran/marka/boşluk) — handoff README §1 "login-card math, exactly".
- Commit: OKSİS formatı + `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`; `npm run oksis:test` yeşil. **Fix'te değil ama bu feature işinde faz-başı commit serbest** (kullanıcı port'u onayladı).
- Bilinen pre-existing 6 vitest fail (settings/timetable) — ilgisiz, kabul.

---

### Faz 0: Paylaşılan davet bileşenleri + invites.css (temel)

Liste/batch/accept'in ortak kullandığı atomları önce kur.

**Files:**
- New: `src/modules/users/components/InviteStatusBadge.tsx` — handoff `InviteBadge` + `INV_STATUS` (6 durum: Bekliyor/Gönderildi/Açıldı/Kabul Edildi/Süresi Doldu/İptal Edildi) dot-pill (`.ivs-pill <tone>`) + `IvLife` 4-segment yaşam çubuğu. Tek kaynak status map (liste + batch + accept paylaşır). Mevcut `InvitationStatusBadge.tsx`'i (çıplak renkler) BUNUNLA değiştir; tüm tüketicileri repoint et.
- Modify: `src/portals/admin/users/components/InviteLinkCopy.tsx` — handoff `InviteLinkBlock` görseline (`.invlink`: label+link icon, mono readonly input+lock, "Kopyala"→yeşil "Kopyalandı" 1.8s) çevir; shadcn Input/Button yerine `.inp`+`.btn` (co-located invites.css). Davranış (copyToClipboard+toast) korunur.
- New: `src/modules/users/styles/invites.css` — handoff `invites.css`'ten davete-özel sınıflar (`.ivs-pill`, `.iv-life`, `.invlink`, `.iv-role`, `.iv-av` vb.); OKSİS token'larına (`var(--success)` vb.) bağlı. İlgili bileşenlerde import et.
- i18n: `users.invite.status.*` (6 durum) tr+en.
- Test: `InviteStatusBadge.test.tsx` (6 durum doğru tone/label), `InviteLinkCopy` mevcut test yeni sınıflara göre güncellenir.

- [ ] TDD: badge 6 durum RED→GREEN; InviteLinkCopy görsel sınıf + davranış testi. `npm run oksis:test` yeşil. Commit.

### Faz 1: Davet Kabul Sihirbazı (PUBLIC — en yüksek öncelik)

**Files:**
- Rewrite: `src/portals/public/pages/invitations/InvitationAcceptPage.tsx` — handoff `invite_accept.jsx` (`InviteAcceptScreen`) birebir: login kartı (`AuthCard`/login.css math) içinde 3 adım (Bilgiler `.inv-verify` → Onaylar `.inv-consent` → Parola `.pw-meter`+kural checklist). `data-portal` davet edilen role göre. Tüm durumlar: yükleniyor/geçersiz/kabul-edilmiş/başarı (hepsi login-kart kompozisyonunda).
- Bind: `useInvitationPreview(token)` (okul/ad/rol/e-posta + geçerli/expired/revoked/accepted), `useCurrentConsentBundle()` (KVKK/koşullar zorunlu + duyuru opsiyonel), `useAcceptInvitation()` (parola + onaylar → 201 → "Girişe Git"). `acceptPasswordSchema` + RHF; parola gücü handoff `iaPwScore`.
- New: accept-özel CSS `src/portals/public/pages/invitations/invite-accept.css` (`.inv-steps/.inv-verify/.inv-consent/.pw-*`).
- i18n `invitationAccept.*` genişlet (adım başlıkları, kurallar, güç etiketleri, onay metinleri). Mevcut `data-testid`'ler (accept-error/loading/expired/invalid/already/success) KORUNUR (testler bağlı).
- Test: adım geçişleri, zorunlu-onay gate, parola-gücü, submit; mevcut hata-durum testleri geçmeli.

- [ ] TDD + **Chrome:** `/invite/<token>` → 3 adım akışı + geçersiz/expired/success ekranları görsel. Commit.

### Faz 2: Davetler Listesi (admin)

**Files:**
- Rewrite: `src/portals/admin/pages/users/InvitationsPage.tsx` — handoff `invites.jsx` (`InvitesScreen`): `PageTop` (Sistem›Davetler breadcrumb; ghost "Partiler"+"Dışa Aktar" + primary "Toplu Davet"), KPI şeridi (`.kpi-row`: Toplam/Bekleyen/Kabul/Süresi Geçen), toolbar (arama + Rol + Durum filtreleri), seçim çubuğu (toplu Yenile/İptal), tablo (`.stu-tbl`: Kişi avatar+mono iletişim, Rol pill, Kanal, Durum=InviteStatusBadge+IvLife, Kalan, KVKK, satır aksiyonları mail/link/x). Durumlar: yükleniyor/boş/hata.
- Bind: `useInvitations` (liste+filtre+sayfa), resend/revoke hook'ları. KPI toplamları backend'de yoksa → istemci-türet veya DebtBadge. Kanal/KVKK-versiyon/Kalan kolonları veri yoksa Debt.
- Co-located `users.css`/`invites.css` sınıfları.
- Test: liste render, filtre, satır aksiyon, boş/hata.

- [ ] TDD + **Chrome:** Davetler ekranı + filtre + satır aksiyon + boş durum. Commit.

### Faz 3: Toplu Davet Sihirbazı (modal)

**Files:**
- Rewrite: `src/portals/admin/pages/users/BulkInviteWizard.tsx` — handoff `invites_modals.jsx` (`BulkInviteModal`): OKSİS `Modal.lg`, adımlar Hedefler(radio-cards+kişi seçici/liste-yapıştır) → Ayarlar(rol select + kanal `.seg` + geçerlilik `.seg`) → Önizleme(cred-box + mail preview) → Sonuç(progress + parti raporu ok/bad + hata satırları).
- Bind: `useBulkInvite()`; kişi seçici için mevcut person listesi hook'u (yoksa Debt). Sonuç raporu backend yanıtından.
- Test: adım geçiş, seçim sayacı, gönder→rapor.

- [ ] TDD + **Chrome:** Toplu Davet 4 adım + sonuç raporu. Commit.

### Faz 4: Batch Detay + Revoke Modalı

**Files:**
- Rewrite: `src/portals/admin/pages/users/InvitationBatchDetailPage.tsx` — handoff `InviteBatchDetail`: breadcrumb Sistem›Davetler›Parti Detayı, metrik kartları (Toplam/Kabul/Bekleyen/Süresi Geçen), batch davetleri aynı badge'li tabloda, "Bekleyenleri Yenile". Batch verisi backend'de yoksa Debt/mock-fallback.
- Rewrite: `src/modules/users/components/InvitationRevokeModal.tsx` — handoff `RevokeInviteModal`: OKSİS `Modal` (danger), `.impact.danger` not, opsiyonel gerekçe textarea (audit-only), "İptal Et" (`.btn-danger`)/"Vazgeç", `SuccessBody`. shadcn Dialog'dan OKSİS Modal'a taşı.
- Bind: `useRevokeInvitation()`; batch detay listesi hook'u.
- Test: revoke onay + success; batch detay render.

- [ ] TDD + **Chrome:** Parti detay + revoke modalı. Commit.

### Faz 5: Kapanış — final review + PR + docs

- [ ] Faz-başı Minor'ları topla; final whole-branch review (en yetenekli model).
- [ ] Branch `davet-ekranlari-redesign` (oksis-web), PR base master. Body: 7 teslimat + Chrome kanıtları + Debt listesi + footer.
- [ ] Docs: `modules/users/completion_status.md` + `identity` (davet UI OKSİS temasına alındı); memory; ADR yok.
