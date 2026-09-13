# MVP Scope Rules

> AI'ın **feature creep** üretmesini engeller. "Bu Sprint 1'de gerekli mi?" sorusu sürekli sorulmalı.

---

## 1. MVP Tanımı

OKSİS MVP'si **2 pilot özel okulda canlıya alınabilen** minimum üründür. Pilot başarısı:
- Yoklama günlük olarak alınıyor
- Notlar girilip yayınlanıyor, veli bildirim alıyor
- Veli push notification'ları doğru zamanda alıyor
- Yönetim dashboard'unda canlı veri görüyor

---

## 2. Sprint Planı (14 hafta)

### Sprint 1 — Foundation (4 hafta)
**Backend**
- ✅ Multi-tenant altyapı (SchoolId zorunluluğu, global query filter)
- ✅ Identity (User, Role, Permission, JWT, refresh token)
- ✅ Okul kurulum sihirbazı API'leri
- ✅ Sınıf / şube / ders tanımları
- ✅ Öğretmen + öğrenci + veli CRUD
- ✅ Veli-öğrenci bağlama (çoklu çocuk)
- ✅ AcademicYear yönetimi
- ✅ Hangfire + Redis bağlantıları
- ✅ Serilog + ELK pipeline
- ✅ Tenant interceptor + audit interceptor

**Frontend (Web)**
- ✅ Login + token yönetimi
- ✅ Admin portal layout, sidebar, topbar
- ✅ Kurulum sihirbazı UI
- ✅ Kullanıcı yönetimi ekranı (DataGrid + modal CRUD)
- ✅ Öğrenci listesi + detay + form
- ✅ Veli-öğrenci eşleştirme

**Mobile**
- ✅ Login + token yönetimi
- ✅ Navigation skeleton (3 rol)
- ✅ Profil ekranı

### Sprint 2 — Operasyon (4 hafta)
**Backend**
- ✅ Yoklama API'leri (3 tıklama optimize)
- ✅ Not (Mark) CRUD + publish flow
- ✅ Ödev (Homework) CRUD + submission
- ✅ Duyuru CRUD + target resolver
- ✅ Notification altyapısı (FCM provider, recipient resolver)
- ✅ Event-driven flow (domain event → Hangfire job)

**Frontend (Web)**
- ✅ Yoklama girişi ekranı (admin/staff için)
- ✅ Not girişi ekranı (taslak/yayınla)
- ✅ Ödev oluşturma + listeleme
- ✅ Duyuru oluşturma + listeleme

**Mobile (öncelikli)**
- ✅ Öğretmen yoklama ekranı (3 tıklama)
- ✅ Öğretmen not girişi
- ✅ Öğretmen ödev oluşturma
- ✅ Veli ana ekran (çocuk seçici)
- ✅ Veli — bildirim merkezi
- ✅ Veli — duyuru / ödev / not görüntüleme
- ✅ Öğrenci — ana ekran, ödev listesi

### Sprint 3 — İletişim & Raporlama (3 hafta)
**Backend**
- ✅ Mesajlaşma API'leri (veli-öğretmen)
- ✅ Devamsızlık raporları
- ✅ Karne PDF üretimi
- ✅ Dashboard agregasyon endpoint'leri

**Frontend (Web)**
- ✅ Mesajlaşma UI
- ✅ Devamsızlık raporları (DataGrid + export)
- ✅ Karne görüntüleme/PDF
- ✅ Yönetim dashboard'u (canlı metrik, chart)

**Mobile**
- ✅ Mesajlaşma UI
- ✅ Karne görüntüleme

### Sprint 4 — Pilot Hazırlığı (3 hafta)
**Backend**
- ✅ Excel import (öğrenci, öğretmen, ders programı)
- ✅ Sezon geçişi sihirbazı
- ✅ Demo data seed
- ✅ Backup / restore script
- ✅ Performance tuning

**Frontend (Web)**
- ✅ Excel import sihirbazı
- ✅ Sezon geçişi sihirbazı
- ✅ Pilot onboarding ekranları

**QA / Pilot**
- ✅ Pilot okul kurulumu
- ✅ Eğitim materyalleri (admin, öğretmen)
- ✅ Geri bildirim toplama mekanizması

---

## 3. MVP DIŞINDA (Sonra)

❌ **Ödeme / Finans Modülü** — Sprint 5+
❌ **Yemekhane / Kantin** — Sprint 5+
❌ **Servis Takibi** — Sprint 6+
❌ **MEB / K12NET Entegrasyonu** — Sprint 6+
❌ **Etkinlik / Kulüp Yönetimi** — Sprint 5+
❌ **Sınav Modülü Detaylı** (online sınav, soru bankası) — Sprint 6+
❌ **Rehberlik / Görüşme Notları** — Sprint 5+
❌ **Disiplin / Davranış İzleme** — Sprint 5+
❌ **Mobile Offline Mode** — Sprint 6+
❌ **Çoklu Dil (TR dışı UI)** — UI altyapısı kurulur, çeviri Sprint 5+
❌ **White-label (okul teması)** — Sprint 5+
❌ **SuperAdmin: çoklu tenant analytics** — Sprint 5+
❌ **Veli ödeme online (kredi kartı / havale)** — Sprint 5+
❌ **GraphQL endpoint** — yok / planlanmıyor
❌ **Native iOS / Android app (Expo dışında)** — yok / planlanmıyor
❌ **Real-time video / online ders entegrasyonu** — yok / planlanmıyor
❌ **AI destekli not öneri / öğrenci profilleme** — yok / planlanmıyor

---

## 4. "Şüpheli Feature" Karar Akışı

AI yeni bir feature önerisi aldığında **şu soruları sırasıyla sorar**:

1. **Bu feature MVP scope listesi'nde var mı?** → Hayır ise: STOP. Kullanıcıya "Bu Sprint X+'a ait" bildir.
2. **Pilot okullar bunsuz canlıya çıkamaz mı?** → Çıkabilir ise: STOP.
3. **Mevcut bir feature ile çakışıyor mu?** → Evet ise: kullanıcıya alternatif bul.
4. **Tahmini effort > 1 sprint?** → Evet ise: parçala veya sonra'ya at.
5. **3 farklı role değiyor mu?** → Evet ise: izin matrisini güncelle.

---

## 5. "Bunu da yapalım" Anti-Pattern Listesi

AI bu kalıplara DİKKAT etmeli:

- 🚫 "Bonus olarak ... ekleyelim" → MVP'de yok
- 🚫 "Generic / pluggable framework yapalım" → over-engineering, MVP'de specific çözüm
- 🚫 "Future-proof olsun diye ... ekleyeyim" → YAGNI
- 🚫 "İyi olur diye microservice'e ayıralım" → Monolith MVP'de
- 🚫 "GraphQL daha esnek" → REST kalsın
- 🚫 "Kullanıcı configürasyonu seçebilsin" → defaults yeterli, configürasyon Sprint 5+
- 🚫 "Performance için aggressive cache" → ilk önce basit çözüm, sonra optimize

---

## 6. "MVP-Worth" Check

Bir feature MVP'ye dahil edilmeden önce şu kontrol yapılır:

- [ ] Pilot okul kullanıcısı bunsuz işini yapamaz mı?
- [ ] Aynı amacı çözen bir başka yol yok mu?
- [ ] Tek bir sprint'te bitebilir mi?
- [ ] 2 rolden fazlasını etkilemiyor mu?
- [ ] Effort < beklenen value mi?

3+ "Evet" varsa MVP'ye uygundur.

---

## 7. Karar Defteri (Decision Log)

Tartışmalı feature'lar için ADR (Architecture Decision Record) `docs/adr/` altında tutulur.

ADR şablonu:
```
# ADR-XXX: {Karar başlığı}
Status: Proposed / Accepted / Deprecated
Date: 2025-XX-XX
Decision Makers: ...

## Context
...
## Options Considered
...
## Decision
...
## Consequences
...
```
