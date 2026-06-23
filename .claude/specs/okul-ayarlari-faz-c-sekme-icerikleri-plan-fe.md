# Okul Ayarları — Faz C (Sekme İçerikleri · Birebir Port) · FE Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Implementer'lar **Opus 4.8** ([[feedback-implementer-opus]]).

**Goal:** 8 sekmenin içeriğini handoff tasarımına (`design_handoff_oksis_ayarlar/app/*.jsx`) birebir port etmek; mevcut React Query hook'larına bağlamak; eksik backend alanlarını `BackendDebtBadge` ile Debt işaretlemek.

**Architecture:** Her sekme Faz A shell bileşenlerini kullanır: `SettingsTwoColumn` (2-kolon), `SettingsSideCard` + `WhereUsedCard` (sağ sütun kartları), `useSettingsHeaderAction` (üst "Kaydet"/birincil buton), `settings.css` stilleri, `SettingsSaveBar` (dirty-state). Görsel/yapı kaynağı = handoff JSX; veri kaynağı = mevcut `api/` hook'ları.

**Tech Stack:** React 18 + TS · shadcn/ui + Tailwind + `settings.css` · RHF + Zod · React Query v5 · i18next · Vitest.

## OTONOM YÜRÜTME POLİTİKASI (kullanıcı uyurken — 2026-06-24)
- **Yalnız frontend (oksis-web).** `oksis-api` değiştirilmez; migration/kolon-drop/izin-seed/yeni-domain ÇALIŞTIRILMAZ → hepsi Debt.
- **K2 (tema renk + vergi no/faks/vergi dairesi):** UI'dan kaldır (handoff'ta yok). Backend kaldırma = Debt (ertelendi).
- **Yeni alanlar (Görünen Ad, Kurum Türü, Kuruluş Yılı, Kurum Yetkilisi, recordInfo):** handoff'a göre render et, persist edilemiyorsa `BackendDebtBadge` + kaydetme devre dışı/no-op. Veri varsa mevcut hook'a bağla.
- **K3 (Sekreter salt-okunur):** `ReadOnlyBanner` + form disabled, `usePermission(...)` ile FE gating; backend izin seed = Debt.
- **K5 (Yetkili = SüperAdmin):** edit yetkisi rol/permission ile FE'de gate; backend = Debt.
- **K6 (BranchNamingPattern):** statik gösterim.
- Her sekme commit'i ayrı; OKSİS format `2026-06-24 <type>: ...`.

## Global Constraints
- Named export only (no default). - No inline `style={}` (Tailwind/cn/settings.css className). - No `any`. - No hardcoded Türkçe (i18n). - Server state yalnız React Query; form RHF+Zod. - Tasarım token'ları `src/styles/theme.css` (yeniden tanımlama). - Mevcut bir iş yapan bileşen varsa genişlet, kopyalama. - Debt göstergesi: `components/BackendDebtBadge.tsx`. - Test: `npx vitest run <path>`; tip: `npm run build`.

---

### Task 1: Genel Bilgiler içeriği (`GeneralSettingsTab`)
**Handoff:** `app/settingsGeneral.jsx` (`GenelBilgilerTab`). **Mevcut:** `tabs/GeneralSettingsTab.tsx` + components (AddressFields, LogoUploadCard, ThemePreview, ColorPickerField) + hooks (useSchoolSettings, useUpdateBasicInfo, useUpdateContactInfo, useUpdateAddress, useUploadLogo, useDeleteLogo).

**Hedef yapı (handoff):** `SettingsTwoColumn`.
- **Sol — "Kurum Kimliği" kartı:** logo (LogoUploadCard), Resmî Kurum Adı*(officialName), Görünen Ad*(DEBT), Kurum Türü(Özel/Devlet/Vakıf)(DEBT), MEB Kurum Kodu(kilitli, mebCode), Kuruluş Yılı(DEBT).
- **Sol — "İletişim Bilgileri" kartı:** Telefon(phone), E-posta(email), Web(website), İl/İlçe(AddressFields — sadeleştir: il/ilçe select), Açık Adres(fullAddress).
- **Sağ — `SettingsSideCard`:** "Önizleme"(logo+görünenAd+tür·ilçe menü chip — client), "Kayıt Bilgisi"(Kurum ID/oluşturulma/son güncelleme — DEBT recordInfo), "Kurum Yetkilisi"(Ad/Unvan/E-posta — DEBT; K5 edit yalnız SüperAdmin).
- **Üst:** tek "Kaydet" (`useSettingsHeaderAction`, dirty olduğunda enabled) + alt `SettingsSaveBar` (Vazgeç/Kaydet). Kaydet → ilgili hook'lar (basic-info + contact-info + address) çağrılır; Debt alanlar gönderilmez.
- **K2 kaldır:** ThemePreview renk seçicileri (primaryColor/secondaryColor), Vergi Numarası, Vergi Dairesi, Faks alanları UI'dan kaldır. Logo KALIR. "Önizleme" handoff'taki menü-chip önizlemesidir (renk picker değil).
- **K3:** `ReadOnlyBanner` üstte; `usePermission('school-settings.update-basic')` false ise tüm input disabled + Kaydet gizli.

**Steps (TDD-lite):**
- [ ] 1. Test güncelle/yaz: `GeneralSettingsTab` render olur; "Kurum Kimliği"/"İletişim Bilgileri" kartları + sağ "Önizleme"/"Kayıt Bilgisi"/"Kurum Yetkilisi" görünür; Vergi No/Faks/renk seçici YOK; Görünen Ad alanında BackendDebtBadge var. (mevcut test'i bu yapıya uyarla.)
- [ ] 2. Çalıştır, FAIL gör.
- [ ] 3. Implement: handoff yapısını `SettingsTwoColumn` + `SettingsSideCard` ile kur; alanları RHF+Zod ile mevcut hook'lara bağla; Debt alanları `BackendDebtBadge` ile işaretle; head-action Kaydet + SaveBar; ReadOnlyBanner gating; K2 alanları kaldır.
- [ ] 4. `npx vitest run src/portals/admin/settings/tabs/__tests__/` + ilgili test → PASS. `npm run build` → PASS.
- [ ] 5. Commit: `2026-06-24 feat: Okul Ayarları Genel Bilgiler sekmesi handoff tasarımına portlandı (Debt: görünen ad/tür/yıl/yetkili/kayıt bilgisi).`

---

### Task 2: Derslikler içeriği (`RoomsTab`)
**Handoff:** `app/settings.jsx` (Derslikler görünümü) + `app/settingsForm.jsx` (DerslikDrawer + DeactivateDialog). **Mevcut:** `tabs/RoomsTab.tsx` + RoomFormDrawer + RoomTypeBadge + rooms hooks (useRooms/useCreateRoom/useUpdateRoom/useDeleteRoom).

**Hedef:** handoff'un tablo/araç-çubuğu/kart-görünüm/durum sistemine görsel hizalama (Öğrenci tablo deseni). Arama + Tip filtresi + Durum filtresi + tablo/kart toggle + sayfalama (tablo 8 / kart 9). "Kullanımda" pill (inuse), TypeBadge, satır aksiyonları (Düzenle/Pasife Al/Sil — inuse'da sil disabled). DerslikDrawer (tek-sütun form: ad/kod/tip/kapasite/blok/kat/durum/açıklama). DeactivateDialog onayı. Boş/yükleniyor(skeleton)/hata/sonuç-yok durumları. Üst "Yeni Derslik" head-action.
**Debt:** RoomType 7 tip (backend 4: Classroom/Laboratory/Workshop/Other) → eksik 3 tip (Spor Salonu/Konferans/Kütüphane) Debt; UI'da 4 desteklenen tip + Debt notu. Açıklama/Not alanı backend'de yoksa Debt. inuse backend'den gelmiyorsa Debt.
**K3:** ReadOnlyBanner gating (`classrooms`/rooms edit izni veya `school-settings.view`).
- [ ] Test: tablo+kart toggle, filtre, drawer aç/kapa render; - implement (mevcut RoomsTab'ı handoff görünümüne taşı, shell + settings.css); - vitest + build PASS; - commit `2026-06-24 feat: Okul Ayarları Derslikler sekmesi handoff görünümüne portlandı.`

---

### Task 3: Modüller içeriği (`ModuleConfigTab`)
**Handoff:** `app/settingsSystem.jsx` (`ModullerTab`). **Mevcut:** `tabs/ModuleConfigTab.tsx` + ModuleToggleCard + PlanStatusCard + SettingsSaveBar + moduleCatalog (10 modül) — FE büyük ölçüde hazır.
**Hedef:** handoff kart-ızgara görünümüne ince hizalama: 10 modül kartı (ikon+ad+açıklama+toggle+etiket), çekirdek kilitli ON, plan-kilitli (yükselt), Debt rozetli modüller. Sağ "Plan Durumu" kartı (aktif/toplam + plan adı + yenileme tarihi[Debt]). Alt SaveBar. `SettingsTwoColumn` ile 2-kolon.
**Debt:** ModuleTier enum + seed 6→10 (backend) zaten Debt; plan yenileme tarihi Debt (mevcut).
- [ ] Test güncelle; implement (görsel hizalama + SettingsTwoColumn + PlanStatusCard sağ sütun); vitest + build PASS; commit `2026-06-24 feat: Okul Ayarları Modüller sekmesi handoff kart görünümüne hizalandı.`

---

### Task 4: Akademik Yapı içeriği (`AcademicStructureTab`)
**Handoff:** `app/settingsStructure.jsx` (`AkademikYapiTab`). **Mevcut:** `tabs/AcademicStructureTab.tsx` + grade-levels hooks; ayrıca `src/portals/admin/subjects/` (CourseDrawer, CoursesTable) Ders Kataloğu için.
**Hedef:** Sol: "Kademeler" kartı (Anaokulu/İlkokul/Ortaokul/Lise — aç/kapat + şube sayısı + "Kullanımda" kilidi), "Ders Kataloğu" kartı (AS-1: Subjects modülü — seçmeli+zorunlu dersler, **branş bağlantısı YOK**; mevcut subjects ders yönetimini bu kartta yüzeye çıkar — ad/kod/kademeler/saat/durum/inuse, arama, satır drawer). Sağ: "Şube Adlandırma" kartı (K6 statik harf/sayı önizleme), "Nerede Kullanılır" (`WhereUsedCard`).
**AS-2 korunan:** Günlük Ders Sayısı, Eğitim Dili (uygun bir karta/yere yerleştir). **AS-2 kaldır:** timezone, öğrenci no prefix/uzunluk, haftalık ders günleri (UI'dan; backend Debt).
**Debt:** Şube sayısı = Class agregasyonu (AS-3, backend) → Debt; Subjects CRUD backend belirsiz → CRUD yoksa Debt (read-only liste), inuse Debt; kademe aç/kapat persist backend'e bağlı değilse Debt.
- [ ] Test; implement; vitest + build; commit `2026-06-24 feat: Okul Ayarları Akademik Yapı sekmesi handoff'a portlandı (Debt: şube sayısı/ders kataloğu CRUD).`

---

### Task 5: Akademik Politikalar içeriği (`AcademicPolicyTab`)
**Handoff:** `app/settingsPolicies.jsx` (`AkademikPolitikalarTab`). **Mevcut:** `tabs/AcademicPolicyTab.tsx` + GradeLevelScalePanel + PassingScoreField + academic-policy hook.
**Hedef:** Sol kartlar: "Not Sistemi" (Geçme Notu[bağlı: DefaultPassingScore], Yuvarlama[DEBT], Karne Skalası[client sabit, kilitli]), "Sınav & Değerlendirme" (yazılı/perf sayısı + ağırlıklar %100 canlı doğrulama[DEBT]), "Devamsızlık" (özürsüz/toplam/uyarı + veli bildirim[DEBT]), "Takdir & Teşekkür" (eşikler + otoBelge[AutoPublishReportCards bağlı varsa]). Sağ: "MEB Varsayılanları" (reset — client), "Nerede Kullanılır". Üst Kaydet + SaveBar; canlı INV-POL doğrulamaları (client).
**Debt:** Yuvarlama, yazılı/perf sayısı, ağırlıklar, devamsızlık limitleri, takdir/teşekkür eşikleri backend'de yok → render + client validation, persist edilemeyenler BackendDebtBadge. Geçme notu + (varsa) autoPublish mevcut hook'a bağlı. **AS-5: tenant-geneli, sezon yok.**
- [ ] Test; implement; vitest + build; commit `2026-06-24 feat: Okul Ayarları Akademik Politikalar sekmesi handoff'a portlandı (Debt: sınav/ağırlık/devamsızlık/belge alanları).`

---

### Task 6: Zil Programı içeriği (`BellScheduleTab`)
**Handoff:** `app/settingsBells.jsx` (`ZilProgramiTab`). **Mevcut:** `tabs/BellScheduleTab.tsx` + BellScheduleGrid + BellScheduleFormModal + bell hooks (useBellSchedules/useCreate/useUpdate/useDelete/useBulkCreate).
**Hedef:** Sol: "Zil Çizelgesi" kartı (timeline görseli + satırlar[ders/teneffüs/öğle, start-end editable, süre, kaldır] + Ders Ekle), "Otomatik Üretici" kartı (ilk zil/ders/teneffüs/ders sayısı/öğle params + Yeniden Üret). Sağ: "Gün Atamaları" (7 gün → Tam/Yarım/Kapalı), "Nerede Kullanılır". Tam/Yarım şablon toggle. Çakışma/süre hatası kaydetmeyi kilitler (client INV-ZIL). Üst Kaydet + SaveBar.
**Debt:** templateKey (Tam/Yarım), BellDayAssignment (gün→şablon) backend'de yok → şablon+gün-atama client state, persist Debt; yalnız aktif şablonun düz satırları mevcut bell hook'larına yazılır. **AS-7: üretici parametreleri client-only, saklanmaz.**
- [ ] Test; implement; vitest + build; commit `2026-06-24 feat: Okul Ayarları Zil Programı sekmesi handoff'a portlandı (Debt: şablon/gün-atama).`

---

### Task 7: Tatil Takvimi içeriği (`HolidaysTab`)
**Handoff:** `app/settingsHolidays.jsx` (`TatilTakvimiTab`). **Mevcut:** `tabs/HolidaysTab.tsx` + HolidayFormModal + HolidayList + holidays hooks.
**Hedef:** Sol: "Tatil Listesi" kartı (tür filtre chip'leri Tümü/Resmî/Ara/Yarıyıl/Okul; ay ayırıcılı tablo; tür rozeti; kilitli türlerde lock tooltip; yalnız "Okul" satırları düzenlenir — drawer). Sağ: "Sezon Özeti" (toplam gün + tür dağılımı), "Nerede Kullanılır". TtlDrawer (okul tatili: ad/başlangıç/bitiş/açıklama + gün etkisi). Üst "Okul Tatili Ekle" head-action.
**Debt:** Resmî/Ara/Yarıyıl türleri kilitli + birleşik kaynak (MEB katalog + sezon yarıyıl) backend'de yok → yalnız "Okul" tatili mevcut hook'larla CRUD; diğer türler örnek/Debt. AS-4 `AraTatil` enum = backend Debt; UI taksonomiyi gösterir. Sezon-scope (seasonId) Debt; mevcut year-bazlı kalır.
- [ ] Test; implement; vitest + build; commit `2026-06-24 feat: Okul Ayarları Tatil Takvimi sekmesi handoff'a portlandı (Debt: resmî/ara/yarıyıl kaynakları, sezon-scope).`

---

### Task 8: Bildirim Ayarları içeriği (`NotificationConfigTab`)
**Handoff:** `app/settingsSystem.jsx` (`BildirimAyarlariTab`). **Mevcut:** `tabs/NotificationConfigTab.tsx` + NotificationThresholdSection + notification-config hook.
**Hedef:** Sol: "Bildirim Kuralları" matrisi (4 grup × olaylar × 3 kanal Portal/E-posta/SMS, smsNa hücreleri), "Gönderim Tercihleri" (sessiz saatler toggle+aralık, günlük SMS limiti). Sağ: "SMS Kotası" kartı (kullanım/başlık/sağlayıcı — statik info), "Nerede Kullanılır". Üst Kaydet + SaveBar.
**Debt:** Olay×kanal matrisi + notification_types kataloğu + quiet hours + daily SMS limit + SMS kotası backend'de yok → matris client state + BackendDebtBadge; mevcut 4 genel kanal toggle'ı (Push/Email/SMS) + 2 devamsızlık eşiği mevcut hook'a bağlı kalır (köprü). AS-6 SMS kotası statik (Debt).
- [ ] Test; implement; vitest + build; commit `2026-06-24 feat: Okul Ayarları Bildirim Ayarları sekmesi handoff'a portlandı (Debt: olay×kanal matrisi, sessiz saatler, SMS kotası).`

---

## Notlar
- Bu plan "complete code" yerine **handoff dosyalarını görsel/yapı kaynağı** olarak referanslar (Handoff Birebir Port konvansiyonu); implementer handoff JSX'ini okuyup hedef stack'e (shadcn/Tailwind/RHF/RQ) çevirir, mevcut hook'lara bağlar.
- Her sekme `SettingsTwoColumn`/`SettingsSideCard`/`WhereUsedCard`/`useSettingsHeaderAction`/`settings.css` kullanır; gerekirse `settings.css`'e sekmeye özgü stiller eklenir (handoff CSS'inden port, token'larla, scoped sınıf adlarıyla).
- Faz kapanışı: tüm settings testleri + `npm run build` yeşil; `completion_status.md`'ye Faz C + Debt envanteri işlenir; backend Debt kalemleri `open-questions.md`/`business-rules.md`'ye taşınır.
