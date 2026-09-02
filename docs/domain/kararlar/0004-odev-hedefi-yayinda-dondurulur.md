---
tags: [decision, domain/academic]
date: 2026-08-27
status: accepted
---

# 0004 — Ödev hedefi yayında çözülür ve dondurulur; sonradan katılan öğrencinin satırı okurken sentezlenir

## Bağlam

Bir [[Ödev]] "tüm sınıfa" ya da "seçili öğrencilere" verilir. Sınıf mevcudu oluşturma ile yayın arasında ve yayından sonra değişir: öğrenci gelir, öğrenci ayrılır. Hangi anın mevcudunun hedef sayılacağı ve sonradan gelen öğrencinin ızgarada nasıl görüneceği kararlaştırılmalıydı.

## Karar

Hedef **yayın anında** mevcutla çözülür ve takip satırları o anda doğar; yayından sonra hedef değişmez. Tüm-sınıf hedefli yayındaki ödevde sonradan katılan öğrenci ızgarada bellekte sentezlenmiş bir satırla görünür; kalıcı satır ilk işaretlemede ya da ilk teslimde doğar ve "yayından sonra eklendi" işaretini taşır. Okuma hiçbir zaman yazmaz.

## Değerlendirilen alternatifler

- **Oluşturma anındaki mevcudu dondurmak** — aradaki haftada şubeye katılan öğrenciyi dışarıda bırakırdı.
- **Yayında da mevcudu takip etmek (hedefi canlı tutmak)** — seçili öğrenci hedefinde ödevin verilmediği öğrenciyi ızgaraya sokardı; kapanmış ödev tarihsel kayıttır.
- **Sonradan gelen öğrenciye okurken kalıcı satır açmak** — GET'in yan etkisi olurdu ve iki eşzamanlı okuma tekillik kısıtında yarışırdı.
- **Sonradan geleni hiç göstermemek** — öğretmen ona ödev verildiğini de verilmediğini de anlayamazdı.

## Sonuçları

Bildirim alıcıları takip satırlarından okunur, mevcuttan değil (seçili hedefte ikisi ayrışır). Sentezlenmiş satır işaretlenebilir ve toplu tamamlamaya girer; aksi hâlde öğretmenin gördüğü satır sunucuyla çelişirdi. Şubeden ayrılan öğrencinin kalıcı satırı ızgarada kalır. "Roster ile birleşir mi" hesabının tek çekirdeği uygulama katmanındadır; domain onu parametre olarak alır, ikinci bir kopyası yoktur.

## İlgili

- [[Ödev]]
- [[Ödev Takibi]]
- [[Ödevler]]
- [[Not Defteri]] — aynı tembel kalıp
