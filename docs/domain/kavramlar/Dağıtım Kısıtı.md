---
aliases: [DistributionConstraint, Pin, Hariç Tutma, Dağıtım Niyeti]
tags: [domain/academic]
table: academic.distribution_constraints
status: active
last-synced: 2026-09-13 (294ffe6)
---

# Dağıtım Kısıtı

<!-- generated:start -->

## Nedir

Yöneticinin otomatik ders programı üretimine verdiği **niyet kaydı**: bir şubede bir ders için "bu dersi şu öğretmen versin" (**pin**) ya da "şu öğretmen bu dersi vermesin" (**hariç tutma**).

MEB pratiğinde her eylül hazırlanan **ders dağıtım çizelgesinin** — kim hangi şubede hangi dersi okutacak — isteğe bağlı, hücre hücre karşılığıdır. Fark şu: gelenekte çizelge her hücre için elle doldurulur; burada yönetici yalnız önemsediği hücreye kısıt koyar, geri kalanını üretime bırakır.

"Görevlendirme" üç soruyu karşılar ve kısıt ortadakidir:

1. **Yetkinlik** — kim hangi dersi verebilir → [[Ders Görevlendirmesi]]
2. **Dağıtım niyeti** — kim hangi şubede versin → bu kayıt
3. **Fiili yük** — kim nerede kaç saat veriyor → yayınlanmış [[Ders Programı]]

Kısıt ne yetkinliktir ne gerçekleşme. Programa doğrudan yazmaz, gerçekleşmeyi kaydetmez; yalnız üreticiyi yönlendirir. Bu yüzden **bayatlamaz** — olsa olsa ihlal edilir, ve ihlal okunurken türetilir. Kayıtta kalıcı bir "uyuldu mu" alanı bilinçli olarak yoktur: olsaydı program her değiştiğinde güncellenmesi gereken ikinci bir doğruluk kaynağı doğardı. Eski görevlendirme modelini ([[Şube Ders Görevlendirmesi]]) batıran tam olarak buydu.

## Yaşam döngüsü

Oluşturulur, güncellenir (tür, öğretmen, gerekçe), silinir (yumuşak).

**Hedef hücre değişmez.** Sezon + şube + ders bir kez yazılır; hedefi değiştirmek yeni bir niyettir ve yeni kayıt açılır — aksi hâlde denetim izi eski hedeften koparılırdı.

**Sezona bağlıdır ve sezon devrinde kopyalanmaz.** Kısıt şube ile kadronun kesişimine bağlıdır; yeni sezonda ikisi de değişir, kopyalanan kısıt bayat bir niyet taşırdı.

## Kurallar

- Sezon, şube, ders ve öğretmen zorunludur. Şube o sezona ait ve arşivlenmemiş olmalıdır — kısıt yaşayan bir hücreye konur.
- **Hücre başına tek pin.** İki pin aynı anda sağlanamaz; son kapı filtreli tekil index'tir.
- **Çelişki reddedilir:** aynı hücrede aynı öğretmene hem pin hem hariç tutma "hem o versin hem o girmesin" demektir; iki yönde de reddedilir. Aynı kısıt ikinci kez yazılamaz.
- **Gerekçe:** öğretmenin o derse bu sezon aktif yetkinliği yoksa (alan-dışı seçim) gerekçe **zorunludur ve en az 15 karakterdir**; yetkinse isteğe bağlıdır; en fazla 500 karakter. Alan-dışı pin **engellenmez**, meşrudur — izi gerekçede durur. Görevlendirmelerdeki alan-dışı atamayla aynı felsefe: engelleme değil iz bırakma.
- Kısıtı koyan kişi (kişi kimliği) ve zaman damgalanır.
- **Yumuşaktır.** Üretim uymaya çalışır; uyamadığında dağıtım durmaz.
- **Üretimde uygulanışı:** pin her şeyden önce gelir — hücrenin öğretmeni doğrudan pinlenen kişidir. Hariç tutma adayı havuzdan düşürür; **bütün adayları düşürürse kısıt yok sayılır** ve orijinal havuzla devam edilir, çünkü satır üretmemek dersi "yerleşmemiş" bırakıp yumuşak kısıtı sert kısıta çevirirdi.
- Kapasiteye göre dengeli öğretmen seçimi kademedeki kardeş şubelerin kısıtlarını bilmez; bu bilinçli bir yaklaşıklıktır ve sonucun deterministik olmasını bozmaz.
- **Yayın önizlemesinde ihlal uyarıdır, engel değildir.** Pinli hücrede başka bir öğretmen yerleşmişse ya da hariç tutulan öğretmenin o hücrede yerleşimi varsa ihlaldir. Hücre taslakta hiç yoksa sessiz geçilir — eksik saat zaten ayrı bir uyarıdır.
- Kısıtı olan ders "kullanımda" sayılır ve silinemez.
- Yazma `timetable.manage`, okuma `timetable.view-all` ile korunur.

## İlişkiler

- [[Ders Görevlendirmesi]] — gerekçe kuralının dayandığı yetkinlik; kısıt yetkinliği değiştirmez, üstüne biner
- [[Şube]] / [[Ders]] / [[Sezon]] — hedef hücre
- [[Profil]] — pinlenen ya da hariç tutulan öğretmen
- [[Ders Programı]] — üretimde yönlendirilen, yayın önizlemesinde ihlali ölçülen program

## Geçtiği modüller

- [[Ders Programı Yönetimi]] — kavramın sahibi; kısıt yönetimi, üretimde uygulanması, yayın önizlemesi uyarısı
- [[Görevlendirmeler]] — "kim hangi şubede versin" sorusunun cevabı burada değil, kısıtta yaşar; kayıt o modülde yazılmaz
- [[Müfredat]] — kısıtı olan ders silinemez

## Açık Sorular

- İhlal yayını engellemiyor: kural "görünür olsun, kilitlemesin". Yöneticinin niyeti çiğnenmişken yayının kilitlenmesi istenirse karar yeniden açılmalı — sahada böyle bir talep var mı?
- Pin, hücrenin öğretmenini yetkinlik, kapasite ve müsaitliğe bakmadan belirliyor. Pinlenen öğretmen o saatlerde başka şubede doluysa üretim o hücreyi "yerleşmemiş" mi bırakıyor, yoksa başka öğretmene mi kayıyor? Koddan doğrulanmadı.
- Kısıt sezona bağlı ama program döneme bağlı. İkinci dönemde farklı bir dağıtım niyeti (ör. öğretmen değişimi) nasıl ifade ediliyor — kısıtı güncellemek birinci dönemin önizleme uyarılarını da değiştiriyor mu?

<!-- generated:end -->

## Notlar

<El yazısı alan.>
