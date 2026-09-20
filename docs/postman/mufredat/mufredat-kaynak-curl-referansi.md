# Müfredat Kaynak Hattı — curl referansı

> MEB kararının ham belgesinden yayımlanmış müfredat sürümüne giden merkez yolu
> (müfredat Dilim 2 + Dilim 3).
> Kanonik koleksiyon: [`oksis-mufredat-kaynak.postman_collection.json`](./oksis-mufredat-kaynak.postman_collection.json).
>
> Uçlar: `src/Oksis.Api/Controllers/V1/PlatformCurriculumSourcesController.cs` ve
> `PlatformCurriculumImportsController.cs`.
>
> **Yetki:** hepsi yalnız **platform token'ı** ile çalışır (`POST /platform/auth/login`); okul
> token'ı 403 alır. Placeholder'lar: `{{API_SERVICE}}` (`https://localhost:5001/api/v1`),
> `{{platformAccessToken}}`, `{{documentId}}`, `{{documentSetId}}`, `{{importRunId}}`,
> `{{entryId}}`, `{{masterSubjectId}}`.

## Akışın sırası

```text
(A) elle:   belge yükle ─┐
(B) MEB'den: keşfet → indir ─┴→ belge seti aç → belgeyi sete bağla
    → içe aktarma başlat   (elle JSON ile, ya da belgeyi ayrıştırıp çizelgeden)
    → ders eşlemelerini karara bağla (+ gerekirse satır düzelt)
    → incele/onayla (BAŞKA bir platform hesabıyla) → yayımla
```

İki giriş kapısı (elle yükleme ve MEB'den indirme) **aynı koddan** geçer: parmak izi,
virüs taraması, tekilleştirme ve revizyon zinciri her ikisinde birebir aynıdır.

**İki kişi kuralı:** ara alanı düzelten hesap aynı içe aktarmayı onaylayamaz. Eşleme kararı ya da
satır düzeltmesi yaptıysanız onayı farklı bir platform hesabıyla verin.

## Durum ve hata sözlüğü

**İçe aktarma durumu** — `Draft · Validated · NeedsReview · Approved · Published · Rejected · Quarantined`
(son üçü terminaldir).
**Ders eşleme durumu** — `Unresolved · Suggested · Confirmed · Rejected`. Öneri karar değildir:
%100 güvenli eşleşme bile `Suggested` doğar.

| Kod | HTTP | Ne demek |
|---|---|---|
| `CURRICULUM_SOURCE_UNSUPPORTED_TYPE` | 400 | Tür ya da boyut sınır dışı (PDF/DOCX/XLSX, ≤25 MB) |
| `CURRICULUM_SOURCE_INFECTED` | 422 | Virüs taraması temiz değil; dosya depoya **yazılmadı** |
| `CURRICULUM_SOURCE_DOCUMENT_NOT_FOUND` | 404 | Belge yok |
| `CURRICULUM_SOURCE_SET_NOT_FOUND` | 404 | Belge seti yok |
| `CURRICULUM_SOURCE_SET_DUPLICATE` | 409 | Aynı karar numarası ve başlıkla set zaten var |
| `CURRICULUM_IMPORT_PAYLOAD_INVALID` | 400 | Şema/program/yıl/satır gövdesi hatalı |
| `CURRICULUM_IMPORT_NOT_FOUND` | 404 | İçe aktarma ya da satır yok |
| `CURRICULUM_IMPORT_UNRESOLVED_SUBJECT` | 409 | Çözülmemiş ders eşlemesi varken onay |
| `CURRICULUM_IMPORT_SAME_ACTOR` | 409 | Düzelten kullanıcı onaylamaya çalıştı |
| `CURRICULUM_IMPORT_NOT_APPROVED` | 409 | Onaysız yayım denemesi |
| `CURRICULUM_IMPORT_TERMINAL` | 409 | Terminal durumda düzeltme/geçiş |
| `CURRICULUM_VERSION_CODE_TAKEN` | 409 | Bu karar numarası aynı program ve yıl için zaten yayımlanmış |
| `CURRICULUM_VERSION_IMMUTABLE` | 409 | Yayımlanmış sürümü değiştirme denemesi |
| `CURRICULUM_SOURCE_HOST_NOT_ALLOWED` | 400 | Adres izin verilen MEB alan adları dışında |
| `CURRICULUM_SOURCE_FETCH_FAILED` | 502 | MEB'e ulaşılamadı ya da beklenmeyen yanıt |
| `CURRICULUM_SOURCE_NO_TEXT_LAYER` | 422 | PDF taranmış; satırlar elle girilmeli |
| `CURRICULUM_SOURCE_NOT_PARSABLE` | 422 | Belge PDF değil ya da çizelge içermiyor |
| `CURRICULUM_IMPORT_CHART_NOT_FOUND` | 404 | İstenen sayfada çizelge yok |

---

## 0. MEB'den keşif ve indirme (Dilim 3)

Kategori listesi TTKB'den okunur; **hiçbir şey indirilmez ve yazılmaz**. Bilinen adres
`knownDocumentId` ile işaretlenir. "Değişmiş" diye üçüncü bir durum yoktur: içerik
indirilmeden parmak izi bilinemez, değişim revizyon kaydıyla belli olur.

```bash
curl -X GET "{{API_SERVICE}}/platform/curriculum-sources/discovery?category=7" \
  -H "Authorization: Bearer {{platformAccessToken}}"
```

Tek belgeyi indir (allowlist dışı adres **istek bile yapılmadan** 400 alır):

```bash
curl -X POST "{{API_SERVICE}}/platform/curriculum-sources/documents/fetch" \
  -H "Authorization: Bearer {{platformAccessToken}}" \
  -H "Content-Type: application/json" \
  -d '{ "sourceUrl": "https://ttkb.meb.gov.tr/meb_iys_dosyalar/2025_05/20144001_202505.pdf" }'
```

Kategoriyi tara ve yeni belgeleri arka planda indir (`202` + iş kimliği döner). Tekrarlayan
zamanlama **yoktur**: MEB müfredatı dönem içinde senkronize edilmez.

```bash
curl -X POST "{{API_SERVICE}}/platform/curriculum-sources/discovery/sweep?category=7" \
  -H "Authorization: Bearer {{platformAccessToken}}"
```

## 0.1 Belgeyi ayrıştır

Belgedeki bütün haftalık ders çizelgelerini çıkarır. **Hiçbir şey yazmaz.** Tek PDF birden
çok çizelge taşıyabilir (2025/05 sayılı kararda sayfa 2-7 altı ayrı eğitim programıdır).

```bash
curl -X GET "{{API_SERVICE}}/platform/curriculum-sources/documents/{{documentId}}/parse" \
  -H "Authorization: Bearer {{platformAccessToken}}"
```

Yanıt her çizelge için sayfa numarası, başlık, sınıf sütunları, satırlar, **sağlama
karşılaştırması** ve `isPublishable` bayrağı verir. Çizelge kendi toplamını taşıdığı için
düzen değişikliği ölçülebilir: `ORTAK/ZORUNLU + SEÇMELİ + REHBERLİK/SERBEST = TOPLAM`
tutmuyorsa `isPublishable: false` olur.

| Uyarı kodu | Ne demek |
|---|---|
| `MEB_PARSER_NO_HEADER` | Sayfada çizelge tablosu bulunamadı |
| `MEB_PARSER_NO_ROWS` | Başlık var, veri satırı yok |
| `MEB_PARSER_UNREADABLE_CELL` | Hücre sayı/tire/parantez şekillerinden hiçbiri değil |
| `MEB_PARSER_SUM_MISMATCH` | Beyan edilen toplam hesaplananla tutmuyor |
| `MEB_PARSER_NO_TOTALS` | Karşılaştırılacak toplam satırı yok (drift) |

## 0.2 Çizelgeden içe aktarma başlat

Hangi çizelgenin hangi eğitim programına karşılık geldiğini **merkez kullanıcısı söyler**;
başlıktan tahmin edilmez.

```bash
curl -X POST "{{API_SERVICE}}/platform/curriculum-imports/from-chart" \
  -H "Authorization: Bearer {{platformAccessToken}}" \
  -H "Content-Type: application/json" \
  -d '{
        "documentSetId": "{{documentSetId}}",
        "documentId": "{{documentId}}",
        "pageNumber": 2,
        "educationProgramCode": "HIGH-ANATOLIAN",
        "academicYearCode": "2026-2027"
      }'
```

Buradan sonrası aşağıdaki elle akışla **birebir aynıdır**: doğrulama, ders eşleme, iki kişi
kuralı ve onay kapısı değişmez. Tire (`-`) hücresi satır üretmez; saat seçenekli hücre
(`(2)(4)`) `hourOptions` olarak gelir.

---

## 1. Belge yükle (elle)

Aynı içerik ikinci kez yüklenirse **yeni kayıt açılmaz**: `200` ile var olan belge döner
(`alreadyExisted: true`). Yeni belge `201` verir. `sourceUrl` verilirse ve aynı adresin içeriği
değişmişse yeni belge öncekine **revizyon** olarak bağlanır.

```bash
curl -X POST "{{API_SERVICE}}/platform/curriculum-sources/documents" \
  -H "Authorization: Bearer {{platformAccessToken}}" \
  -F "file=@2027-14-sayili-karar.pdf;type=application/pdf" \
  -F "sourceUrl=https://ttkb.meb.gov.tr/karar.pdf"
```

İndirme adresi (10 dakikalık imzalı bağlantı, dosya özgün adıyla iner):

```bash
curl -X GET "{{API_SERVICE}}/platform/curriculum-sources/documents/{{documentId}}/download" \
  -H "Authorization: Bearer {{platformAccessToken}}"
```

## 2. Belge seti aç ve belgeyi bağla

Set, kararı ve resmî eklerini tek hukuki kaynakta toplar; yayımlanan sürüm bu sete bağlanır.
Karar tarihi belgede yazmıyorsa `null` bırakın — uydurulmaz.

```bash
curl -X POST "{{API_SERVICE}}/platform/curriculum-sources/sets" \
  -H "Authorization: Bearer {{platformAccessToken}}" \
  -H "Content-Type: application/json" \
  -d '{ "title": "Ortaokul haftalık ders çizelgesi", "decisionNumber": "2027/14", "decisionDate": "2027-04-12" }'

curl -X POST "{{API_SERVICE}}/platform/curriculum-sources/sets/{{documentSetId}}/documents" \
  -H "Authorization: Bearer {{platformAccessToken}}" \
  -H "Content-Type: application/json" \
  -d '{ "documentId": "{{documentId}}", "role": "Decision", "displayOrder": 1 }'
```

`role`: `Decision` (kararın kendisi) · `Annex` (resmî ek) · `Correction` (düzeltme).

## 3. İçe aktarma başlat

Satırlar kaynaktaki ham hâliyle gönderilir. Saat **ya tek değerdir ya da en az iki seçenektir**
("1 veya 2 saat"); tek seçenek zaten tek değerdir ve reddedilir.

```bash
curl -X POST "{{API_SERVICE}}/platform/curriculum-imports" \
  -H "Authorization: Bearer {{platformAccessToken}}" \
  -H "Content-Type: application/json" \
  -d '{
        "documentSetId": "{{documentSetId}}",
        "payload": {
          "schemaVersion": "1.0",
          "educationProgramCode": "MIDDLE-GENERAL",
          "academicYearCode": "2027-2028",
          "entries": [
            { "gradeLevelCode": "5", "subjectName": "Matematik", "courseType": "Common",
              "weeklyHours": 6, "hourOptions": [], "pageNumber": 3 },
            { "gradeLevelCode": "5", "subjectName": "Seçmeli Bilişim", "courseType": "Elective",
              "weeklyHours": null, "hourOptions": [1, 2], "pageNumber": 4, "note": "1 veya 2 saat" }
          ]
        }
      }'
```

Yanıt durumu söyler: `Validated` (temiz), `NeedsReview` (uyarı ya da çözülmemiş eşleme),
`Quarantined` (satır yok ya da hiçbir sınıf seviyesi tanınmadı). Aynı içerik ikinci kez
gönderilirse `200` ve `alreadyExisted: true` döner.

Satırları ve doğrulama özetini okuyun:

```bash
curl -X GET "{{API_SERVICE}}/platform/curriculum-imports/{{importRunId}}" \
  -H "Authorization: Bearer {{platformAccessToken}}"

curl -X GET "{{API_SERVICE}}/platform/curriculum-imports?status=NeedsReview" \
  -H "Authorization: Bearer {{platformAccessToken}}"
```

## 4. Satırı düzelt ve ders eşlemesini karara bağla

```bash
# Seviye/saat/ders türü düzeltmesi (ham ders adı değişmez)
curl -X PATCH "{{API_SERVICE}}/platform/curriculum-imports/{{importRunId}}/entries/{{entryId}}" \
  -H "Authorization: Bearer {{platformAccessToken}}" \
  -H "Content-Type: application/json" \
  -d '{ "gradeLevelCode": "6", "courseType": "Common", "weeklyHours": 4, "hourOptions": null }'

# Dersi çekirdek katalogdaki bir derse bağla
curl -X POST "{{API_SERVICE}}/platform/curriculum-imports/{{importRunId}}/entries/{{entryId}}/match" \
  -H "Authorization: Bearer {{platformAccessToken}}" \
  -H "Content-Type: application/json" \
  -d '{ "masterSubjectId": "{{masterSubjectId}}", "reject": false }'

# Ya da satırı kapsam dışı bırak (yayımda atlanır)
curl -X POST "{{API_SERVICE}}/platform/curriculum-imports/{{importRunId}}/entries/{{entryId}}/match" \
  -H "Authorization: Bearer {{platformAccessToken}}" \
  -H "Content-Type: application/json" \
  -d '{ "masterSubjectId": null, "reject": true }'
```

İçe aktarma **yeni ders açmaz**: `masterSubjectId` var olan bir çekirdek dersi göstermelidir.
Katalogda gerçekten yoksa önce dersi ekleyin, sonra eşleyin.

## 5. İncele ve yayımla

```bash
# BAŞKA bir platform hesabıyla (iki kişi kuralı)
curl -X POST "{{API_SERVICE}}/platform/curriculum-imports/{{importRunId}}/review" \
  -H "Authorization: Bearer {{platformAccessToken}}" \
  -H "Content-Type: application/json" \
  -d '{ "decision": "Approve", "reason": null }'

curl -X POST "{{API_SERVICE}}/platform/curriculum-imports/{{importRunId}}/publish" \
  -H "Authorization: Bearer {{platformAccessToken}}"
```

Yayım tek işlemde sürümü, satırları, saat seçeneklerini ve kaynak izlerini yazar; aynı program ve
akademik yıl için önceki yayımlı sürüm `Superseded` olur. İkinci yayım çağrısı yeni sürüm üretmez
(`alreadyPublished: true`). Yayımlanan sürüm ve satırları bundan sonra **değiştirilemez**;
düzeltmenin yolu yeni bir sürüm yayımlamaktır.

Ret ya da karantina gerekçe ister:

```bash
curl -X POST "{{API_SERVICE}}/platform/curriculum-imports/{{importRunId}}/review" \
  -H "Authorization: Bearer {{platformAccessToken}}" \
  -H "Content-Type: application/json" \
  -d '{ "decision": "Reject", "reason": "Çizelge ile karar numarası uyuşmuyor" }'
```
