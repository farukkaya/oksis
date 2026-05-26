# Sprint Planlama Kuralı — Cross-Module Sprint Akışı

> Bu dosya OKSİS projesinde **tüm ihtiyaç analizi, teknik analiz, madde üretimi ve Linear yapılandırması** için bağlayıcı kuraldır.
> Konum: `.claude/docs/sprint-planning-rules.md`
> Onay tarihi: 2026-05-26

---

## Yanlış Yaklaşım (Modül-Önce)

```
X:Sprint1 → X:Sprint2 → X:Sprint3 → X:Sprint4
                                              ↓
                                        Y:Sprint1 → ...
```

Bir modülün tüm sprint'leri bitmeden diğerine geçilmez gibi görünen bu yaklaşım **yanlıştır.**
Modüller birbirine bağımlıdır; birini izole geliştirmek entegrasyon sorunlarına yol açar.

---

## Doğru Yaklaşım (Sprint-Önce / Cross-Module)

```
Sprint 1: [X:foundation] + [Y:foundation] + [Z:foundation]
Sprint 2: [X:operations] + [Y:operations] + [Z:operations]
Sprint 3: [X:advanced]   + [Y:advanced]   + [Z:advanced]
Sprint 4: [X:pilot]      + [Y:pilot]      + [Z:pilot]
```

**Bir sprint = Tüm modüllerin o anki olgunluk seviyesi.**
Sprint'ler modülleri **dikey değil, yatay** keser.

```
          | identity | attendance | marks | homework | notifications |
Sprint 1  |  ████    |    ████    |  ████ |   ████   |     ████      |  ← foundation
Sprint 2  |  ███     |    ████    |  ████ |   ████   |     ████      |  ← operations
Sprint 3  |  ██      |    ███     |  ███  |   ██     |     ████      |  ← iletişim/rapor
Sprint 4  |  █       |    ██      |  ██   |   █      |     ██        |  ← pilot/polish
```

---

## Sprint'e Yerleştirme Sorusu

Bir feature veya görev hangi sprint'e girer sorusunun cevabı:

| Sprint | Soru |
|--------|------|
| Sprint 1 | Sistemin çalışır hale gelmesi için **minimum** ne gerekiyor? (foundation) |
| Sprint 2 | Üstüne **operasyonel akış** ne gerektirir? |
| Sprint 3 | **Raporlama, iletişim, polish** için ne lazım? |
| Sprint 4 | **Pilot'a hazırlık** için ne kalıyor? |

---

## Teknik / İhtiyaç Analizi Çıktı Formatı

Herhangi bir modül için analiz yapılırken AI çıktısı **her zaman** şu formatta olmalıdır:

```
[Modül X — Teknik Analiz]

Sprint 1 kapsamı (foundation):
 └── Backend: ...
 └── Frontend (Web): ...
 └── Mobile: ...

Sprint 2 kapsamı (operations):
 └── Backend: ...
 └── Frontend (Web): ...
 └── Mobile: ...

Sprint 3 kapsamı (raporlama/iletişim):
 └── Backend: ...
 └── Frontend (Web): ...
 └── Mobile: ...

Sprint 4 kapsamı (pilot):
 └── Backend: ...
 └── Frontend (Web): ...
 └── Mobile: ...
```

---

## Linear Issue Üretim Kuralı

Her issue oluşturulurken **zorunlu** alanlar:

| Alan | Zorunlu | Değer |
|------|---------|-------|
| **Project** | ✅ | Sprint 1 / Sprint 2 / Sprint 3 / Sprint 4 |
| **Team** | ✅ | Backend veya Frontend |
| **Label: modül** | ✅ | `module:attendance`, `module:marks`, `module:identity` ... |
| **Label: platform** | ✅ | `platform:api`, `platform:web`, `platform:mobile` |
| **Label: tip** | ✅ | `Feature`, `Bug`, `Improvement`, `type:tech-debt` ... |

---

## Kural Özeti

> **Sprintler zamana göre, modüller konuya göre organize edilir.**
> Hiçbir analiz veya Linear üretimi bu kuralı ihlal edemez.
> AI bu dosyayı her teknik analiz oturumunda bağlayıcı kural olarak kabul eder.