---
tags: [index]
---

# OKSİS Belge Merkezi

Bu vault OKSİS'in tek belge merkezidir. Kod `oksis-api` ve `oksis-ui` depolarında yaşar; burada kod yoktur. **Kod tek doğru kaynaktır** — bir belge kodla çelişiyorsa belge düzeltilir.

OKSİS, Türk özel okulları için çok kiracılı (multi-tenant) bir SaaS okul yönetim sistemidir.

## Nereden başlamalı

| Sorun | Git |
|---|---|
| Ürün nedir, kapsamı ne? | `genel/` — [[mvp-kapsami]] |
| Bir kavram veya modül nasıl çalışıyor, neden böyle? | [[domain/_indeks\|Domain Haritası]] |
| Hangi teknolojiler, hangi sürümler? | `teknik/tech-stack.md` |
| Mimari ve katmanlar arası kurallar | `teknik/mimari/` |
| Kodlama kuralları | `teknik/kurallar/` — `ortak/`, `backend/`, `frontend/` |
| Yerelde ayağa kaldırma, ortamlar, seed | `teknik/ortamlar/` |
| Hangi paylaşılan bileşen var? | `frontend/bilesenler/_envanter.md` |
| Marka ve tasarım token'ları | `frontend/tasarim-sistemi/` |
| API'yi elle denemek | `postman/<modul>/` |
| Bir modülün ihtiyaç / teknik analizi | `ihtiyac-analizleri/<modul>/`, `teknik-analizler/<modul>/` |
| İnceleme ve durum raporları | `raporlar/` |
| Açık bulgular, kararlar, engeller | `bulgular/` — Bulgu Kayıt Defteri |
| Devam eden işin geçici belgeleri | `gecici/` |

## Klasör kuralları

- Dosyalar `.md`. İstisnalar: `postman/` koleksiyon JSON'ları, `bulgular/kanit/` görsel ekleri.
- `domain/` koddan `domain-map` skill'iyle üretilir; `<!-- generated -->` blokları dışındaki el yazısı içerik korunur.
- `domain/kararlar/` modelin kalıcı gerekçesidir; `bulgular/kararlar/` bulgu ve süreç kararlarıdır.
- `gecici/` altındaki belgeler iş bitince silinir.
