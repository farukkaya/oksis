# Kulüp Tercih Dönemi ve İdare Yerleştirmesi — curl referansı

> Kanonik koleksiyon: [`oksis-kulup-tercih-yerlestirme.postman_collection.json`](./oksis-kulup-tercih-yerlestirme.postman_collection.json).
> Plan: `teknik-analizler/kulupler/kulup-tercih-ve-yerlestirme-plani.md` (§4.2 uçlar, §4.3 hata kodları).
> Test rehberi: `gecici/test-rehberleri/kulup-tercih-yerlestirme-test-rehberi.md`.
>
> **Ön koşul:** okul **İdare** modunda olmalı (`GET school-settings/club-settings` -> `clubAdmissionMode: "administration"`). Öğretmen modunda tercih/yerleştirme uçları 409 `Clubs.AdmissionByAdvisor` döner.
> **Yetki:** idare uçları `clubs.manage`; öğrenci uçları öğrenci hesabı; ayar okuma `clubs.read`.

```bash
API=http://localhost:5112/api/v1
tok() { curl -s -X POST $API/auth/account/login -H 'Content-Type: application/json' \
  -d "{\"identifier\":\"$1\",\"password\":\"Oksis1234!\",\"channel\":\"web\"}" \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['accessToken'])"; }
ADM=$(tok mudur.s4@oksis.local); STU=$(tok ogrenci.s4.005@oksis.local)
H() { echo "Authorization: Bearer $1"; }

curl -s -H "$(H $ADM)" $API/school-settings/club-settings

# Dönem yaşam döngüsü (zsh: ${RID}:open biçimini kullan, "$RID:open" değil)
RID=$(curl -s -X POST -H "$(H $ADM)" -H 'Content-Type: application/json' \
  -d '{"targetEndOn":"2026-10-20"}' $API/clubs/preference-round | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['id'])")
curl -s -X POST -H "$(H $ADM)" $API/clubs/preference-round/${RID}:open
curl -s -X PUT  -H "$(H $STU)" -H 'Content-Type: application/json' \
  -d "{\"clubIds\":[\"$C1\",\"$C2\",\"$C3\"]}" $API/students/me/clubs/preference
curl -s -H "$(H $ADM)" $API/clubs/preference-round/${RID}/overview
curl -s -X POST -H "$(H $ADM)" $API/clubs/preference-round/${RID}:remind
curl -s -X POST -H "$(H $ADM)" $API/clubs/preference-round/${RID}:close

# Yerleştirme: rowVersion her yanıttan alınıp bir sonrakine taşınır
RV=$(curl -s -H "$(H $ADM)" $API/clubs/preference-round/${RID}/placements | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['rowVersion'])")
curl -s -X POST -H "$(H $ADM)" -H 'Content-Type: application/json' \
  -d "{\"keepLocked\":true,\"fillUnplaced\":false,\"rowVersion\":\"$RV\"}" $API/clubs/preference-round/${RID}/placements:auto
curl -s -H "$(H $ADM)" $API/clubs/preference-round/${RID}/placements/diff
curl -s -X POST -H "$(H $ADM)" -H 'Content-Type: application/json' \
  -d "{\"rowVersion\":\"$RV2\"}" $API/clubs/preference-round/${RID}:publish
```

## Sürüm (rowVersion) kuralı

| Yanıt | rowVersion yeri |
|---|---|
| `placements` GET, `placements:auto`, `placements` PUT | `data.rowVersion` |
| `placements/diff` | `data.rowVersion` |
| `:publish` | `data.board.rowVersion` (yeni sürüm) |

Bayat sürümle Kaydet/Otomatik/Yayınla 409 `Clubs.PlacementStale` döner.

## Hata sözlüğü

| Kod | HTTP | Ne demek |
|---|---|---|
| `Clubs.AdmissionByAdministration` | 409 | İdare modunda öğrenci `:join` / `:leave`, danışman `:approve` / `:reject` |
| `Clubs.AdmissionByAdvisor` | 409 | Öğretmen modunda tercih/yerleştirme uçları |
| `Clubs.PreferenceRoundExists` | 409 | Sezonda dönem zaten var |
| `Clubs.PreferenceRoundNotOpen` | 409 | Dönem açık değilken tercih kaydı |
| `Clubs.PreferenceReminderAlreadySent` | 409 | Aynı gün ikinci hatırlatma |
| `Clubs.PublishWhileOpen` | 409 | Dönem açıkken yayın |
| `Clubs.PlacementStale` | 409 | Bayat rowVersion |
| `Clubs.PlacementConflict` | 409 | Yayında tek üyelik çatışması; kısmi yayın yapılmaz |
