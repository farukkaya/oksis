B-01 — gonderim raporu ucu, rol bazli olcum (2026-08-11, calisan API localhost:5112)
Duyuru: 49adc94e-5d79-4ee5-af44-29fced238946  'Ogrenci Duyurusu'  (yayinda, 60 alici)

ROL                GET detay        GET delivery-report
------------------ ---------------- -------------------
ogrenci.s1.001     200              403
veli.s1.001        404              403
ogretmen.s1.01     404              403
mudur.s1           200              200

SONUC: rapor VERISI hicbir gelen-kutusu rolune ulasmiyor (403).
       Kapi: AnnouncementLifecycleGuard.CanActOn = IsManager || PublisherId == caller
       Sizan tek sey BASLIK idi -> showsDeliveryReport (core) ile kapatildi.
