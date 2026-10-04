# - Mekez Platform
	- Yeni Okul Formu
		- MEB okul türü (haftalık ders çizelgesi) *  başlığı 'Program' olarak değiştirilsin



# - Okul Platformu
	- Sezon Açılışı
		  Yeni Sezon Adı alanı kullanıcı manuel giriş yapmasın select box olarak gelsin. geçen sezon 2 sezon şimdiki sezon ve gelecek sezon.
		   yani bu şuan için bakacak olursak. şu seçenekler çıkmalı -> '2024-2025,2025-2026,2026-2027,2027-2028'. native selectbox kullanma, geçmiş tarihli sezon açılışı kurala ve izne bağlanmalı(tartışma konusu). içinde bulunan yıl sezonu veya gelecek sezon zaten açıksa(taslak veya aktif durumda ise) seçildiğinde sezon zaten açılmıştır uyarısı verilmeli.



  Backend (oksis-api)                                                                                                                                          
                                                                                                                                                               
  Gate değişikliği — SessionMaterializer.cs                                                                                                                    
  - alreadyMaterialized HashSet artık PlacementId yerine (ClassRoomId, Period) tutuyor. Yeniden yayında farklı PlacementId doğsa bile aynı slot için ikinci    
  oturum üretilmez.                                                                                                                                            
  - GetOrCreateAsync: fast-path (aynı PlacementId) hâlâ var; ondan sonra placement resolve edilip FindExistingBySlotAsync ile slot kontrolü — eski sürüm       
  oturumu varsa onu döner.                                                                                                                                     
  - Race guard artık ux_attendance_sessions_school_slot adına bakıyor; kaybeden istek slot üstünden kazananı okur.                                             

  DB kısıt değişikliği — AttendanceSessionConfiguration.cs
  - Unique index adı ux_attendance_sessions_school_placement_date → ux_attendance_sessions_school_slot.
  - Kolonlar (SchoolId, PlacementId, Date, ClubId) → (SchoolId, ClassRoomId, Date, Period, ClubId). Filter is_deleted = 0 korundu.

  Publish purge — ProgramPublisher.PublishAsync
  - Her yayının başında ExecuteDeleteAsync ile o şubenin bugünden sonrası tarihli Pending/NotTaken oturumları silinir. Completed/Cancelled/Open dokunulmaz.
  Kulüp oturumları (ClubId != null) filtre dışı. Tek ve toplu publish handler'ları aynı yolu paylaştığı için iki yerde birden düzenlemeye gerek olmadı.

  Slot bazlı roll-call eşleşmesi — PublishedScheduleQueryHandler.AttachRollCallAsync
  - Filtre placementIds.Contains(s.PlacementId) → classRoomIds.Contains(s.ClassRoomId) && s.ClubId == null. Grouping (PlacementId, Date) → (ClassRoomId, Date,
  Period). v3 dersinin durum rozetini v1'in aynı slot'taki oturumundan okur.

  Migration — 20260929100000_20260929_attendance_republish_slot_gate.cs
  - Eski indeksi düşürür; latest ScheduleVersion'a bağlı olmayan Pending/NotTaken oturumları siler (Altınay'ın 47 hayaleti + benzeri her okuldaki orphanlar);
  yeni slot indeksini kurar.
  - Not: Deploy öncesi dotnet ef migrations add ile Designer.cs + ModelSnapshot yenilenmeli (elle yazılan migration snapshot'ı güncellemedi).

  Testler — Infrastructure integration
  - AttendanceSessionConstraintTests: eski "same placement" testi yerine "same slot / farklı placement reddedilir" (B-90) + "aynı slot iki kulüp saati kabul
  edilir" (kompozit anahtar) testleri.
  - SessionMaterializerTests: iki yeni B-90 testi — (a) RepublishWithNewPlacementIds_DoesNotDuplicateSessionAtSameSlot (v1→v3 yeniden yayınında ikinci pass
  duplicate üretmez, subject/teacher v1'de kalır), (b) GetOrCreateAsync_WithNewPlacementId_ReturnsExistingSessionFromOtherPlacementAtSameSlot.

  Frontend (oksis-ui)

  FE değişikliği yok. Session DTO'sundaki PlacementId alanı hâlâ dolu (denorm); FE openSession({ placementId: session.placementId }) yolu değişmedi. Query'ler
  zaten ScheduleVersionId süzmüyordu (Explore ajanı doğruladı). Mock kodundaki session.placementId === firstPlacementId sadece bir vekâlet rozeti fixture'ı,
  üretim kodu değil.

  Kalan operasyonel adımlar

  1. dotnet ef migrations add _20260929_attendance_republish_slot_gate çalıştırıp Designer + ModelSnapshot'ı yenile (ya da elle yazdığım migration'ı silip EF
  üret, sonra data-cleanup SQL bloğunu geri koy).
  2. ./scripts/test-changed.sh --integration ile Docker'lı SQL üzerinde AttendanceSession ve materializer testlerini koştur.
  3. Migration prod'a çıkınca SessionMaterializer gece işi bir sonraki turda Altınay için doğru oturumları üretir (28 Eylül'ün Completed'ları duruyor, Pending
  47 hayalet gidiyor).

  Bulgu bloğu (OKSİS - Bulgu Kayıt Defteri.md:2303) hâlâ 🔴 açık — merge sonrası ekran ölçümüyle Arşiv'e taşınacak.		   