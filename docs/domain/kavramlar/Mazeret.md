---
aliases: [AttendanceExcuse, Devamsızlık Mazereti, Rapor]
tags: [domain/academic]
table: academic.attendance_excuses
status: active
last-synced: 2026-08-10 (2270867)
---

# Mazeret

<!-- generated:start -->

## Nedir

Bir öğrencinin belirli bir tarih aralığındaki devamsızlığının **gerekçelendirilmesi**. Veli bildirir ya da sekreterlik kaydeder; sağlık raporu, ailevi sebep veya başka bir mazeret olabilir.

Kavramın işlevi tek cümleyle şu: onaylandığında **geçmiş yoklama kayıtlarını çevirir**. Aralığa düşen "yok" kayıtları izinli/raporlu hâline gelir ve öğrencinin devamsızlık toplamından düşer.

## Yaşam döngüsü

`Bekliyor → Onaylandı | Reddedildi`. Karar bir kez verilir; ikinci karar denemesi reddedilir.

Kimin bildirdiği yola etki eder: **veli** bildirimi idare kararı bekler, **sekreterlik/idare** kaydı doğrudan onaylı açılır. Ayrım kaynağın kendisiyle taşınır.

## Kurallar

- Gerekçe zorunludur.
- Bitiş tarihi başlangıçtan önce olamaz.
- Destekleyici belge (rapor, dilekçe) **ayrı bir yükleme akışıyla** oluşturulur; mazeret yalnız [[Saklı Dosya]]'ya referans taşır. Bu modül kendi dosya deposunu kurmaz. Belgenin izinli türü, boyutu ve saklama süresi [[Dosya Kategorisi]] tarafından belirlenir.
- Onay sonrası kayda yazılan "etkilenen oturum sayısı" **gerçekten durumu değişen** kayıtların sayısıdır — onay öncesi gösterilen önizleme tahmininden bilinçli olarak farklıdır. Bekleyen ve reddedilen mazerette her zaman sıfırdır.
- Karar bir olay yayınlar; devamsızlık toplamlarının yeniden hesaplanması buna bağlanır.

## İlişkiler

- [[Yoklama Oturumu]] — onay geçmiş kayıtları çevirir
- [[Devamsızlık Özeti]] — onaylı mazeret toplamlara yansır
- [[Kişi]] — mazeretin öznesi öğrenci, bildiren veli veya sekreterlik
- [[Düzeltme Talebi]] — kardeş akış; ikisi de idare kararı bekler ve aynı karar durumunu paylaşır

## Geçtiği modüller

- [[Yoklama ve Devamsızlık]] — kavramın sahibi; bildirim, belge ekleme, karar
- [[Dosya Yönetimi]] — destekleyici belgenin saklandığı ve erişiminin denetlendiği yer

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- Onaylanmış bir mazeret sonradan geri alınabiliyor mu? Karar terminal görünüyor; hatalı onayın nasıl düzeltileceği koddan çıkmıyor.
- Mazeret aralığı ile onay arasında yeni yoklama girilirse (retro giriş gibi) o kayıtlar da çevriliyor mu, yoksa yalnız onay anındakiler mi?
