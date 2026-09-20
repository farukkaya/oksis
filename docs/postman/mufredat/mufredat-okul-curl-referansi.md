# Müfredat Okul Yüzeyi — curl referansı

> Okulun sezon müfredatını yönettiği uçlar (müfredat Dilim 4).
> Kanonik koleksiyon: [`oksis-mufredat-okul.postman_collection.json`](./oksis-mufredat-okul.postman_collection.json).
>
> Uçlar: `src/Oksis.Api/Controllers/V1/SchoolCurriculumController.cs` ve
> `CurriculumHoursController.cs`.
>
> **Yetki:** **okul token'ı** ister (platform token'ı değil). Okuma
> `curriculum-hours.view`, yazma `curriculum-hours.override`.
> Placeholder'lar: `{{API_SERVICE}}` (`https://localhost:5001/api/v1`), `{{accessToken}}`,
> `{{sessionId}}`, `{{educationProgramId}}`, `{{subjectId}}`.

## Tek kural: hazırlık mı, başlamış mı

| Sezon durumu | Okuma kaynağı | Yazma |
|---|---|---|
| `Setup` (hazırlık) | Taslak (MEB + okulun kararları) | **Serbest** |
| `Active` / `Archived` | Aktivasyonda dondurulmuş **snapshot** | **Kapalı** (`CURRICULUM_SESSION_LOCKED`) |

`sessionId` verilmezse hazırlıktaki **tek** sezon kullanılır; okumada o da yoksa yürürlükteki
sezon. Yazmada yürürlükteki sezona düşülmez.

**Fark bir uyarı değildir.** Okul MEB saatini serbestçe değiştirebilir, sıfıra indirebilir ve
toplamı aşabilir; sistem engel üretmez.

## Hata sözlüğü

| Kod | HTTP | Ne demek |
|---|---|---|
| `CURRICULUM_SESSION_LOCKED` | 409 | Sezon başlamış; müfredatı dondurulmuş |
| `CURRICULUM_DRAFT_SESSION_REQUIRED` | 409 | Hazırlıkta tek bir sezon bulunamadı |
| `CURRICULUM_PROGRAM_NOT_FOUND` | 404 | Eğitim programı yok ya da etkin değil |
| `CURRICULUM_PROGRAM_LEVEL_MISMATCH` | 400 | Program başka bir kademeye ait |
| `CURRICULUM_REBASE_NO_TARGET` | 409 | Bu program ve yıl için yayımlanmış MEB sürümü yok |
| `CURRICULUM_PUBLISHED_VERSION_AMBIGUOUS` | 409 | Aynı program ve yıl için birden fazla yayımlı sürüm |
| `CURRICULUM_SNAPSHOT_NOT_FOUND` | 404 | Sezon henüz başlamadı; kilitli müfredat yok |

---

## 1. Eğitim programı seçimi

Okul hangi programı kullanıyor, hangi seçenekler var ve o yıl için yayımlanmış MEB sürümü
var mı — hepsi tek yanıtta. Sürüm yoksa program yine seçilebilir; taslak `Manual` doğar ve
saatleri okul kendisi girer.

```bash
curl -X GET "{{API_SERVICE}}/curriculum/programs?sessionId={{sessionId}}" \
  -H "Authorization: Bearer {{accessToken}}"

curl -X PUT "{{API_SERVICE}}/curriculum/programs" \
  -H "Authorization: Bearer {{accessToken}}" \
  -H "Content-Type: application/json" \
  -d '{ "sessionId": "{{sessionId}}", "educationLevel": "High", "educationProgramId": "{{educationProgramId}}" }'
```

Program değişirse taslaklar yeni programın yayımlı sürümüne taşınır ve okulun saat kararları
**yeniden tabanlamayla aynı** eşleme kuralından geçer. Aynı program yeniden seçilirse hiçbir
şey yapılmaz (hata değil).

## 2. MEB–okul fark görünümü

```bash
curl -X GET "{{API_SERVICE}}/curriculum/diff?sessionId={{sessionId}}&gradeLevelCode=9" \
  -H "Authorization: Bearer {{accessToken}}"
```

Her satırda `mebHours`, `schoolHours` ve `difference` yan yana. Okulun kendi eklediği derste
`mebHours` ve `difference` **boştur** — sıfır yazmak "fark yok" anlamına gelir ve yanlış
olurdu. Sıfır saatli ders listede kalır: "bu dersi okutmuyorum" bir karardır ve görünmelidir.

`isLocked: true` ise satırlar snapshot'tan okundu ve değiştirilemez.

## 3. Haftalık saat yazma

Saat yazma ucu Dilim 1'den beri aynıdır. MEB satırı olan derste okul kararı **override**'dır
(MEB saatine eşitse silinir), olmayanda **ek ders**tir (0 silinir).

```bash
curl -X PUT "{{API_SERVICE}}/curriculum-hours/subject/{{subjectId}}" \
  -H "Authorization: Bearer {{accessToken}}" \
  -H "Content-Type: application/json" \
  -d '{ "sessionId": "{{sessionId}}",
        "items": [ { "gradeLevelCode": "9", "weeklyHours": 8, "reason": "yoğun matematik" } ] }'
```

Bir seviyedeki bütün kararları geri al (MEB saatlerine dön). **Okulun kendi eklediği dersler
silinmez**; kaç tanesinin durduğu yanıtta söylenir.

```bash
curl -X POST "{{API_SERVICE}}/curriculum/grades/9/reset?sessionId={{sessionId}}" \
  -H "Authorization: Bearer {{accessToken}}"
```

## 4. Güncel MEB sürümüne taşıma (rebase)

Yeni bir MEB sürümü yayımlanması taslağı kendiliğinden değiştirmez; taşıma **okulun
kararıdır**. Önce önizle:

```bash
curl -X GET "{{API_SERVICE}}/curriculum/rebase/preview?sessionId={{sessionId}}" \
  -H "Authorization: Bearer {{accessToken}}"

curl -X POST "{{API_SERVICE}}/curriculum/rebase" \
  -H "Authorization: Bearer {{accessToken}}" \
  -H "Content-Type: application/json" \
  -d '{ "sessionId": "{{sessionId}}", "gradeLevelCode": null }'
```

Rapor üç liste verir:

- `preservedOverrides` — aynı ders yeni sürümde de var; okulun saati **korundu**.
- `addedSubjects` — yeni sürümle gelen dersler, MEB saatiyle.
- `removedForReview` — yeni sürümde artık olmayan ama okulun kararı bulunan dersler.
  **Silinmezler**; okul ne yapacağına kendisi karar verir.

Önizleme ile uygulama **aynı hesaptan** geçer; tek fark `isApplied` alanıdır.

## 5. Aktivasyon önizlemesi

Sezon başlatmak müfredatı geri alınamaz biçimde dondurur; önce ne dondurulacağını görün.
Bu uç hiçbir şey yazmaz.

```bash
curl -X GET "{{API_SERVICE}}/curriculum/activation-preview?sessionId={{sessionId}}" \
  -H "Authorization: Bearer {{accessToken}}"
```

`canActivate: false` ise `blockers` listesi neyin eksik olduğunu söyler — örneğin açık olduğu
hâlde taslağı olmayan bir sınıf seviyesi (`CURRICULUM_PREVIEW_MISSING_DRAFT`): sezon o hâliyle
başlarsa o seviye yıl boyunca müfredatsız kalır.

## 6. Kilitli müfredat (snapshot)

```bash
curl -X GET "{{API_SERVICE}}/curriculum/snapshot?sessionId={{sessionId}}" \
  -H "Authorization: Bearer {{accessToken}}"
```

Başlamış ve arşiv sezonun nihai müfredatı. Sonradan yayımlanan yeni bir MEB sürümü bu yanıtı
**değiştirmez** (karar 0021). Hazırlıktaki sezonda `CURRICULUM_SNAPSHOT_NOT_FOUND` döner:
"müfredat boş" ile "sezon henüz başlamadı" aynı şey değildir.
