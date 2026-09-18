# Entegrasyon paketi kırmızı — teşhis (düzeltme yok)

Kapsam: `tests/Oksis.Infrastructure.IntegrationTests`, master `b7f8baaf`.
Kaynak log: master tam koşusu `scratchpad/base-int.txt` (676 başarısız / 1479; `ad5b8a6e` koşusu `tci.txt` aynı imzalar).
`ad5b8a6e` master'da değil; `feat/mufredat-surum-snapshot` dalında, master'ın üstünde. Kırmızılık oraya master'dan geliyor.

## Özet

| # | Sınıf (istisna + ilk test çerçevesi) | Sayı | Kök commit | Tür |
|---|---|---|---|---|
| R1 | Ders kataloğu tenant'a taşındı (`Subject : TenantEntity`) | **338** | `7d9302b7` (TB-191) | yalnız test altyapısı |
| R2 | Sınav türü kataloğu tenant'a taşındı (`ExamType : TenantEntity`) | **303** | `6cefeed8` (TB-195) | yalnız test altyapısı |
| R3 | Okul günü artık sezonun `Active` olmasını istiyor | **34** | `15edc440` (TB-186) | yalnız test altyapısı (ürün davranışı bilerek böyle) |
| R4 | `ExpireStaleInvitationsJobTests` paylaşılan veritabanındaki kirlilikten etkileniyor | **1** | merge'e bağlı değil (koşu sırasına bağlı kırılgan test) | yalnız test |
| | **Toplam** | **676** | | |

Üç kök nedenin (R1–R3) üçü de `b7f8baaf` merge'ünün ikinci ebeveynindeki commit'lerden geliyor. Merge'ten önce aynı testler yeşildi (aşağıdaki kanıta bakın). Üretimde bir hata yok: ürünün okul açma ve seed yolları katalogları içe aktarıyor, sezonu da etkinleştiriyor. Testlerin fixture'ları ise okulu `School.Create` ile doğrudan açıyor ve bu yolların hepsini atlıyor.

## R1 — Ders kataloğu tenant'a taşındı (338)

Değişiklik: `7d9302b7`, "ders kataloğu okul kapsamına taşındı (TB-191)".
- `src/Oksis.Domain/Modules/Academics/Entities/Subject.cs:35`: `public sealed class Subject : TenantEntity`. Master katalog artık `MasterSubject`.
- İçe aktarılan tenant dersi **yeni kimlik** alıyor: `Subject.CreateFromMaster` → `Build(Guid.NewGuid(), ...)` (`Subject.cs:112`). Tenant ders kimliği bu yüzden `MasterSeedIds.Subjects.*` ile aynı değil.
- Ürünün doğru yolu: `CreateSchoolCommandHandler.cs:136` `SubjectCatalogImporter.ImportAsync`, dev seed'de `ClassRoomDevSeeder.cs:101`.

Alt imzalar:
1. **269**: `InvalidOperationException: Sequence contains no elements` at `Persistence/AnnouncementAudienceFixture.cs:310`
   (`ctx.Subjects...FirstAsync()`). Fixture okulu `School.Create` ile açıyor (satır 293), katalog içe aktarılmıyor ve okulun tenant süzgecinde hiç dersi yok. Önceki satırlardaki `GradeLevels.SingleAsync(Code=="1"/"9")` (308–309) geçiyor. Kısa özetteki "GradeLevels" tahmini doğru değil; hata veren satır 310, yani `Subjects`.
2. **67**: `SecurityException: Cannot insert Subject without tenant context` at `TenantSaveChangesInterceptor.cs:31`. Testler `Subject.Create(...)` ile ders yazıyor ama bunu tenantsız "master" bağlamında yapıyor (`_fixture.CreateDbContext()`). Merge'ten önce `Subject` master tablosuydu ve bu yazma geçerliydi. Dağılım:
   ActivateSeasonRolloverTests:220 (12), SubjectTeacherAssignmentTests:133 (9), PublishedScheduleConsumerTests:377 (8), TeacherCourseLoadProjectionTests:302 (8), AutoGenerateScheduleJobTests:474 (5), StudentAttendanceViewsTests:197 (5), AutoGenClassResolverTests:241 (4; `using (var master = _fixture.CreateDbContext())` satır 233), CreateSubstitutionTests:51 (4), GetAvailableSubstitutesTests:123 (4), SubstitutionBoardTests:168 (4), MarkLessonStudyHallAndRevokeTests:60 (3), DutyLoadReportTests:146 (1).
3. **1**: `TimetableDevSeederTests:92`, "competencies not to be empty". Test okulunun tenant dersi yok, bu yüzden seeder ders türetemiyor. Test ayrıca `MasterSeedIds.Subjects.Math/Physics/...` kimliklerini doğruluyor; içe aktarma yapılsa bile bu kimlikler artık tenant ders kimlikleri değil.
4. **1**: `AttendanceThresholdDevSeederTests:82`, "sessions 11, found 0". Sezon bu testte etkin, sorun başka yerde. `AttendanceThresholdDevSeeder.cs:134` tenant'ta `db.Subjects.FirstOrDefaultAsync` sonucu null dönüyor, seeder de "ders yok, atlanıyor" diyerek çıkıyor. Bu test merge'le geldi (master'da yeni dosya).

Düzeltme yönü: tek merkezi yardımcı. Testlerdeki okul açılışı, üretimdeki okul açılışının yaptığını yapmalı: okul yaratıldıktan sonra tenant bağlamında `SubjectCatalogImporter.ImportAsync` çağrılmalı (R2 için `ExamTypeCatalogImporter` de). Önerilen yer `DatabaseFixture`'da tek bir `CreateSchoolWithCatalogAsync` ya da ortak bir `SeedSchoolCatalogsAsync`. Ders yazan testler `CreateDbContext()` yerine `CreateDbContext(schoolId)` kullanmalı; `SubjectGradeLevel` da tenant tarafında yazılmalı. `MasterSeedIds.Subjects.*` ile doğrulama yapan testler `MasterSubjectId` üzerinden çevrilmeli (TB-191'in `SubjectCatalogTranslation` katmanı). Dosya dosya yama önerilmez: bir fixture yardımcısı 269+303 testi birden çözer.

## R2 — Sınav türü kataloğu tenant'a taşındı (303)

Değişiklik: `6cefeed8`, "şube, katalog ve sınav türü denetimleri okul kapsamına çekildi (TB-194..TB-197)", TB-195 ayağı.
- `src/Oksis.Domain/Modules/Academics/Entities/ExamType.cs:30`: `public sealed class ExamType : TenantEntity`.
- Ürünün yolu: `CreateSchoolCommandHandler.cs:141` `ExamTypeCatalogImporter.ImportAsync`, dev seed'de `ClassRoomDevSeeder.cs:112`.

Alt imzalar:
1. **289**: `Sequence contains no elements`. Sınav testlerinin seed'i `ctx.ExamTypes.Where(t => t.TermOrder > 0)...FirstAsync()` sorgusunda boş dönüyor. Dağılım: ExamSessionScenario:148 (41), SeatMaintenance:351 (28), GetExamSessionQuery:870 (27), ExamCandidateQuery:703 (24), ExamSessionNotification:1077 (23), PlaceExamSessionMode:845 (19), SetInvigilator:1109 (19), UpdateSessionRooms:849 (19), ExamInvigilatorDeriver:604 (15), ExamSessionPublishGate:1048 (15), UpdateSessionSections:746 (15), ExamSessionComposer:600 (12), MoveExamSession:579 (12), CreateExamSession:531 (10), ExamExcludedSectionReader:257 (4), ExamBadgeQuery:255 (3), ExamBoardQuery:233 (3).
2. **14**: `ArgumentOutOfRangeException: Index was out of range` at `MergeExamSessionsCommandHandlerTests.cs:694`. Aynı sorgu `Take(2).ToListAsync()` ile boş liste dönüyor, ardından `examTypeIds[0]` okunuyor.

Düzeltme yönü: R1 ile aynı merkezi okul açılışı yardımcısı, `ExamTypeCatalogImporter.ImportAsync`'i de çağırmalı.

## R3 — Okul günü artık sezonun Active olmasını istiyor (34)

Değişiklik: `15edc440`, "sezonsuzluk önbelleği, ders günü kuralı ve okuma sözleşmesi (TB-185, TB-186)".
- `src/Oksis.Application/Modules/AcademicSessions/Shared/AcademicCalendarRules.cs:61`: `&& s.Status == AcademicSessionStatus.Active`.
- `src/Oksis.Infrastructure/Attendance/SchoolCalendarService.cs:39`: `IsSchoolDayAsync` bu kuralı çağırıyor. Eskiden yalnız dönemin tarih aralığına bakıyordu.
- Testler sezonu `AcademicSession.Create(...)` ile yaratıyor ama `Activate(...)` çağırmıyor. Sezon `Setup` durumunda kalıyor, bu yüzden hiçbir gün okul günü sayılmıyor, `SessionMaterializer` oturum üretmiyor, `OpenOrGetSession` de NotFound dönüyor. Örnekler: `SessionMaterializerTests.cs:533-553` (`CreateAcademicTermCoveringAsync`, Activate yok), `AttendanceTeacherSlicesTests.cs:974`, `AttendanceBoardAndJobsTests.cs:128/204`, `AttendanceNotificationsTests.cs:94`.
- Dağılım: AttendanceTeacherSlicesTests 16 (13× "Open başarısız: NotFound", 3× "beklenmeyen hata: NotFound"), SessionMaterializerTests 9 ("sessions ... found 0", "first not null" ...), AttendanceBoardAndJobsTests 8 (`IsSchoolDay` false, boş unrecorded listesi, `closed` 0 ...), AttendanceNotificationsTests 1.

Ürün tarafı: kural bilinçli (TB-186; kurulumdaki sezonda yoklama olmamalı). Gerçek uygulama da aynı davranışı gösterir, bu doğru. Kırılan yalnız fixture'lar.
Düzeltme yönü: yoklama fixture'larındaki sezon yaratma yardımcıları `session.Activate(now, previousSessionId: null)` çağırmalı. `AttendanceThresholdDevSeederTests.cs:160` ve `AbsenceThresholdEngineTests.cs:205` bunu zaten yapıyor. Tek ortak "aktif sezon kur" yardımcısı en temiz çözüm.

## R4 — ExpireStaleInvitationsJobTests paylaşılan veritabanında kırılgan (1)

`Persistence/ExpireStaleInvitationsJobTests.cs:85`: "expiredCount to be 2, but found 5". İş (`ExpireStaleInvitationsJob`) superadmin bağlamında **tüm okulların** davetlerini süpürüyor. Koleksiyon genelindeki paylaşılan MSSQL'de başka testlerin bıraktığı Created/Sent davetleri de (CreateSchoolCommandHandlerTests, SchoolAdminOnboardingFlowTests, InvitationHandlerIntegrationTests, ... 7 günlük TTL) +30 gün sonra süresi geçmiş sayılıyor. Sonuç koşu sırasına bağlı: bu test alt kümede yeşil (master ve öncesi), tam koşuda kırmızı. Merge'le ilişkili değil, yalnız test.
Düzeltme yönü: dönen sayıyı değil, testin kendi 4 davetinin son durumunu doğrulamak. Satır 88–94 bunu zaten yapıyor; `expiredCount.Should().Be(2)` yerine `BeGreaterOrEqualTo(2)` yeterli olur ya da satır kaldırılabilir.

## Merge öncesi / sonrası kanıtı

Aynı alt küme iki geçici, detached worktree'de koşuldu (ikisi de silindi):

Filtre (`scratchpad/subset.filter`): GetAudiencePoolTests | AutoGenClassResolverTests | CreateExamSessionCommandHandlerTests | MergeExamSessionsCommandHandlerTests | SessionMaterializerTests | AttendanceTeacherSlicesTests | AttendanceBoardAndJobsTests | TimetableDevSeederTests | AttendanceThresholdDevSeederTests | ExpireStaleInvitationsJobTests

```
git worktree add --detach scratchpad/wt-before 60e65caf   # merge'ün 1. ebeveyni
git worktree add --detach scratchpad/wt-master b7f8baaf
dotnet build tests/Oksis.Infrastructure.IntegrationTests --disable-build-servers -p:UseSharedCompilation=false
dotnet test  tests/Oksis.Infrastructure.IntegrationTests --no-build --filter "<filtre>"
```

- **60e65caf (merge öncesi):** `Başarılı! Başarısız: 0, Başarılı: 79, Toplam: 79` (`run-before2.log`). İlk denemede (`run-before.log`) test gövdelerinin hepsi geçti (0 `[FAIL]`), ama makine yükü altında konteyner silinemedi (`DockerApiException ... could not kill container`). xUnit bu yüzden 79 "Test Collection Cleanup Failure" ekledi; bu ortamdan kaynaklı, test hatası değil.
- **b7f8baaf (master):** 80 test (+1: merge'le gelen AttendanceThresholdDevSeederTests), **64 gerçek başarısız**, 16 geçen (`run-master.log`). Burada da 80 docker-cleanup satırı ortamdan kaynaklı. İmzalar tam koşudakilerle aynı: 14 Index, 11 Sequence-empty, 4 Subject tenant, 16 NotFound ve ~19 attendance "boş oturum" tipi. ExpireStaleInvitations alt kümede yeşil, bu R4'ün sıraya bağlı olduğunu gösteriyor.

Sonuç: suite merge öncesinde bu kümede yeşildi. Kırmızı `b7f8baaf` merge'ünün ikinci ebeveyniyle geldi. Commit düzeyindeki atfetme (7d9302b7 / 6cefeed8 / 15edc440) her commit ayrı ayrı derlenip koşularak değil, kod okumasıyla yapıldı. Her imza doğrudan o commit'in getirdiği tek satıra bağlanıyor: `Subject : TenantEntity`, `ExamType : TenantEntity`, `Status == Active`. Makine yükü altında (load 100–190) derleme başına 7–17 dk sürdüğü için commit başına bisect koşulmadı.

Neden fark edilmedi: commit mesajları yalnız birim testleri, mimari bekçileri ve 6 yeni tenant izolasyon testini koştuğunu yazıyor. `test-changed.sh` entegrasyon projesini yalnız `--integration` bayrağıyla koşturuyor.

## Not
- Önbellek/tatil commit'i `a6700df7` (TB-183) testlerde yalnız `InMemoryCacheService` değişimi yapıyor, ayrı bir hata sınıfı üretmiyor.
- Önerilen tek merkezi çözüm (okul açılışı = katalog içe aktarma + isteğe bağlı aktif sezon) yaklaşık 675 testi kapsar. R4 ayrı ve tek satırlık.
