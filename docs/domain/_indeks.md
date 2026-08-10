---
tags: [domain/index]
last-synced: 2026-08-10 (238f5e1)
---

# OKSIS Domain Haritası

Bu vault, OKSIS'in domain kavramlarının haritasıdır. **Kod tek doğru kaynaktır; buradaki notlar harita ve niyettir.** Bir notta kolon listesi, tip imzası veya endpoint gövdesi bulmayacaksın — bunlar `oksis-api` içinde yaşar ve kopyalandıkları anda çürümeye başlar. Notların cevapladığı sorular: bu kavram nedir, nerede yaşar, hangi kuralları vardır, neden böyle kurgulanmıştır.

Her notun `last-synced` alanı, hangi tarihte hangi commit'ten üretildiğini söyler. Nota ne kadar güveneceğini oradan anla.

## Nereden başlamalı

Projeye yeni geldiysen [[Sezon]] ile başla — okulun bütün akademik kayıtları bir sezona bağlıdır, o yüzden her şeyin girişi orasıdır. Ardından [[Sezon Yönetimi]] modül notu, yılın nasıl kurulup kapandığını uçtan uca anlatır.

## Kavramlar

- [[Sezon]] — eğitim-öğretim yılının çatısı; `Setup → Active → Archived`
- [[Dönem]] — sezonun içindeki T1/T2 dönemleri
- [[Şube]] — sınıf şubesi; öğrenci atamalarının taşıyıcısı
- [[Okul Tatili]] — sezon takvimindeki kapalı günler
- [[Duyuru]] — kurumsal iletişim kaydı; silinmez, geri çekilir
- [[Duyuru Şablonu]] — kişisel hazır duyuru metni; ayrı aggregate, silinebilir

## Modüller

- [[Sezon Yönetimi]] — yılın kurulması, dönemler, şubeler ve takvim
- [[Duyurular]] — kitlesel iletişim; hedefleme, moderasyon, şablonlar

## Notlar hakkında

- `<!-- generated -->` blokları arası otomatik üretilir ve senkronda üzerine yazılır. **O blokların dışına yazdığın hiçbir şeye dokunulmaz** — gerekçeler, tarihçe ve tuzaklar "Notlar" başlığı altında güvendedir.
- "Açık Sorular" başlığı, koddan net çıkarılamayan şeyleri toplar. Uydurulmuş bir kural, eksik bir kuraldan pahalıdır; cevabını bildiğin bir soruyu yanıtlayıp yukarı taşımak en değerli katkıdır.
- Kavram, modül ve klasör adları Türkçedir. Koddaki İngilizce identifier `aliases` alanının **ilk** değeridir — `AcademicSession` diye arattığında Obsidian seni [[Sezon]] notuna götürür.

## Kapsam

Notlar yalnızca `oksis-api` (backend) taranarak üretilir. Domain kuralları ve iş akışları oradan çözülür; bir kavramın ekranda nasıl göründüğü domain bilgisi sayılmaz.
