---
tags: [decision, domain/platform]
date: 2026-09-13
status: accepted
---

# 0010 — Her okulun dosyaları kendi depolama alanında durur; alanın adı okul kimliğinden türetilir

## Bağlam

Dosyalar tek bir ortak depolama alanında mı, okul başına ayrı alanlarda mı tutulacaktı? Soru iki taahhüdü birlikte etkiliyordu: okullar arası izolasyon ve KVKK imha taahhüdü, yani okul sistemden ayrıldığında bütün dosyalarının gerçekten silindiğini kanıtlayabilmek.

## Karar

Her okulun dosyaları kendi depolama alanında durur. Alanın adı okulun değişmez kimliğinden türetilir, kısa adından (slug) değil. Alan, okul oluşturulduğunda otomatik hazırlanır (K1).

## Değerlendirilen alternatifler

- **Tek ortak alan, okulu önekle ayırmak.** İzolasyon yalnız uygulama katmanında kalırdı. Okul ayrıldığında imha nesne nesne silmek demek olurdu ve eksiksiz yapıldığını kanıtlamak zorlaşırdı.
- **Alan adını okulun kısa adından türetmek.** Okul adı değişebilir, depolama alanı ise yeniden adlandırılamaz. Ad değişikliği bir taşıma işine dönüşürdü.

## Sonuçları

İzolasyon fiziksel katmana iner: bir okulun dosyası başka bir okulun alanında bulunamaz. Okul ayrıldığında imha, alanın tek işlemle silinmesiyle yapılabilir ve denetim kaydıyla kanıtlanabilir. Bedeli, her yeni okulda alan hazırlama adımının mutlaka çalışmasıdır; bu adım okul oluşturma olayına bağlıdır.

**Uygulama durumu (2026-09-13):** okul başına alan, adın okul kimliğinden türetilmesi ve okul açılışında hazırlama kodda var. **Okuldan ayrılış (offboarding) akışı kodda yok.** Yasal bekleme süresi, okulun bütün dosyalarının topluca yumuşak silinmesi ve alanın tek işlemle silinmesi henüz yazılmadı. Bu yüzden sözleşme süresine bağlı kategoriler (sanal kitap) bugün hiçbir imha işinin kapsamında değil.

## İlgili

- [[Saklı Dosya]]
- [[Dosya Kategorisi]]
- [[Dosya Yönetimi]]
- [[Okul]]
