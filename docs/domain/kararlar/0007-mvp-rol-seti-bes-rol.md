---
tags: [decision, domain/people]
date: 2026-09-13
status: accepted
---

# 0007 — MVP rol seti beş roldür

<!-- generated:start -->

## Bağlam

İlk yetki tasarımı okul içinde yedi-sekiz rol öngörüyordu: süper yönetici, okul yöneticisi, okul personeli (müdür yardımcısı, koordinatör), öğretmen, veli, öğrenci, sekreter, muhasebeci; eski seed'de ayrıca müdür yardımcısı ve rehber öğretmen vardı. Her rol ayrı bir izin sütunu, ayrı bir kapsam kuralı ve ayrı test yükü demekti. Bu rollerin çoğunun MVP'de karşılık geldiği bir iş akışı (finans, sekreterlik) yoktu — tanımlı ama kullanılmayan bir rol, izin matrisinde kimsenin sınamadığı bir yetki yolu açar.

## Karar

MVP'de sistem rolü seed'i yalnız beş roldür: **süper yönetici, okul yöneticisi, öğretmen, veli, öğrenci**. Diğer roller MVP sonrasına ertelendi ve çalışma anında atanamaz (2026-06-05).

## Değerlendirilen alternatifler

- **Bütün rolleri baştan seed'lemek** — iş akışı olmayan roller izin matrisinde sınanmamış yollar bırakırdı; muhasebeci örneğinde bu somut bir açığa dönüştü (aşağıda).
- **Okulun kendi rolünü tanımlaması** — ileri sürüm; MVP'de platform rol-izin matrisi tüm okullar için tek yetkili kaynaktır.

## Sonuçları

- Ayrıcalık seviyeleri: süper yönetici 100, okul yöneticisi 80, öğretmen / veli / öğrenci 40. Atama "yalnız kesin düşük seviye" kuralına bağlı olduğundan okul yöneticisi üç okul rolünü atayabilir; aynı seviyedeki roller birbirini atayamaz.
- **Muhasebeci kapsam dalı kaldırıldı.** Kişi erişim denetiminde "ödeme sorumlusu" dalı hiç var olmayan bir role bağlıydı ve isteği yapan kişiyi referans almadığı için başkasının kaydını açabiliyordu (IDOR). Dal silindi; kapsam denetimi rol adına değil çözülmüş izne ve gerçek ilişki kaydına bakacak şekilde yeniden kuruldu. Finans rolü doğduğunda ilişki kaydına bağlı olarak yeniden eklenir.
- Yeni rol eklemek üç şeyi birlikte değiştirir: rol seed'i, rol-izin eşlemesi ve seviye. Uygulama katmanına rol adı yazılmaz.
- Kodda eski sekiz değerli kullanıcı rolü enum'u (sekreter, muhasebeci dâhil) sunum yüzeyleri için hâlâ duruyor; rol tablosuyla bu enum arasındaki çift kaynak açık bir sorudur ([[Sistem Rolü]]).
- Açık kalan: müdür yardımcısı, sekreter gibi idari personele MVP'de beş rolden hangisinin verileceği kararlaştırılmış değil.

## İlgili

- [[Sistem Rolü]]
- [[Rol Ataması]]
- [[İzin]]
- [[Kullanıcılar]]
- [[0008-super-yonetici-platform-roludur]] — beş rolden birinin tanımı

<!-- generated:end -->
