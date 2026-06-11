# Okul Ayarları Hizalama — Plan 5: Derslikler Sekmesi Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Derslikler (fiziksel oda) sekmesini tasarım handoff'una birebir, **tam fonksiyonel** uygulamak: backend `Room`'a additive alanlar (Name, RoomType, Block, Floor) + DELETE eklenir; frontend toolbar/tablo/kart/drawer/durumlar tasarıma hizalanır.

**Architecture:** Backend `Timetable.Room` (schema `[academic].rooms`, `TenantEntity`, soft-delete) additive kolonlarla genişletilir — **yeni tablo yok**. CRUD: mevcut `GET/POST/PUT /rooms` genişletilir + yeni `DELETE /rooms/{id}` (kullanım-kilidi). Frontend: settings altında yeni rooms API client + React Query hook'ları; `RoomsTab` Students-ekranı desenini (toolbar + tablo/kart toggle + drawer + veri durumları) shadcn ile uygular.

**Tech Stack:** Backend .NET 10, MediatR, FluentValidation, EF Core 10, Mapster. Frontend React 18 + TS, shadcn/ui + Tailwind, React Query v5, RHF + Zod, react-i18next, vitest.

> **Karar (faruk, 2026-06-11):** Derslikler için additive backend (Name/RoomType/Block/Floor + DELETE) yapılır — debt bırakılmaz. Diğer 7 sekme bekletiliyor; bu plan yalnız Derslikler.

> **Permission:** Mevcut desen korunur — okuma `class-rooms.view`, yazma/silme `class-rooms.update` (özel `rooms.manage` timetable çekirdeğiyle gelecek; CreateRoomCommand notu).

---

## Mevcut durum (doğrulanmış)

- `Room` (`src/Oksis.Domain/Modules/Timetable/Entities/Room.cs`): `Code`, `Location?`, `Capacity`, `IsActive`. `Create(schoolId, code, location, capacity)`, `Update(code, location, capacity)`, `Deactivate/Activate`. Sabitler: MaxCodeLength=20, MaxLocationLength=100, Capacity 1-500.
- `RoomDto`: `(Id, Code, Location?, Capacity, IsActive, AssignedClassRoomFullName?)`.
- `RoomsController` (`/api/v1/rooms`): `GET` (ListRoomsQuery, opsiyonel sessionId), `POST` (CreateRoomCommand), `PUT/{id}` (UpdateRoomBody → UpdateRoomCommand). **DELETE yok.**
- `ListRoomsQueryHandler`: `Where(r => r.IsActive)` — **sadece aktif** döner; sessionId verilirse `assignedClassRoomFullName` doldurulur (ClassRoom.RoomId join).
- Web: `classroomsApi.rooms(sessionId)` GET /rooms yapar, `RoomDto` tipi var; **CRUD UI yok**. `classrooms` portalı = öğrenci şubeleri (ClassRoom), fiziksel oda değil.

---

## Dosya Yapısı

**Backend (oksis-api):**
- Create: `src/Oksis.Domain/Modules/Timetable/Enums/RoomType.cs`
- Modify: `src/Oksis.Domain/Modules/Timetable/Entities/Room.cs`
- Modify: `src/Oksis.Infrastructure/Persistence/Configurations/Timetable/RoomConfiguration.cs`
- Create (migration): `dotnet ef migrations add 20260611_expand_rooms_name_type_location`
- Modify: `CreateRoom/CreateRoomCommand.cs` + `CreateRoomCommandHandler.cs` (+ validator)
- Modify: `UpdateRoom/UpdateRoomCommand.cs` + `UpdateRoomCommandHandler.cs`
- Create: `src/Oksis.Application/Modules/Timetable/Commands/DeleteRoom/DeleteRoomCommand.cs` + `DeleteRoomCommandHandler.cs`
- Modify: `Queries/ListRooms/ListRoomsQuery.cs` + `ListRoomsQueryHandler.cs`
- Modify: `src/Oksis.Application/Modules/Timetable/DTOs/RoomDto.cs`
- Modify: `src/Oksis.Api/Controllers/V1/RoomsController.cs` (UpdateRoomBody + DELETE + includeInactive query)
- Tests: `tests/Oksis.Domain.UnitTests/...Room...` (entity), integration test mirror.

**Frontend (oksis-web):**
- Create: `src/portals/admin/settings/api/rooms/rooms.types.ts`, `rooms.keys.ts`, `rooms.queries.ts`, `rooms.mutations.ts`, `index.ts`
- Create: `src/portals/admin/settings/schemas/room.schema.ts`
- Create: `src/portals/admin/settings/components/RoomFormDrawer.tsx`
- Create: `src/portals/admin/settings/components/RoomTypeBadge.tsx`
- Modify: `src/portals/admin/settings/tabs/RoomsTab.tsx` (placeholder → full)
- Modify: i18n `tr/en/school-settings.json` (`rooms.*`)

---

# BÖLÜM A — BACKEND

## Task 1: RoomType enum

**Files:** Create `src/Oksis.Domain/Modules/Timetable/Enums/RoomType.cs`

- [ ] **Step 1: Create the enum**
```csharp
namespace Oksis.Domain.Modules.Timetable.Enums;

/// <summary>Derslik tipi (tasarım: Sınıf / Laboratuvar / Atölye / Diğer).</summary>
public enum RoomType
{
    Classroom = 0,
    Laboratory = 1,
    Workshop = 2,
    Other = 3
}
```

- [ ] **Step 2: Build**

Run: `dotnet build`
Expected: success.

- [ ] **Step 3: Commit**
```bash
git add src/Oksis.Domain/Modules/Timetable/Enums/RoomType.cs
git commit -m "2026-06-11 feat: RoomType enum (Sınıf/Laboratuvar/Atölye/Diğer) eklendi."
```

---

## Task 2: Room entity — additive alanlar

**Files:** Modify `src/Oksis.Domain/Modules/Timetable/Entities/Room.cs`; Test `tests/Oksis.Domain.UnitTests/Modules/Timetable/RoomTests.cs`

- [ ] **Step 1: Write the failing test** (yeni dosya `tests/Oksis.Domain.UnitTests/Modules/Timetable/RoomTests.cs`):
```csharp
using FluentAssertions;
using Oksis.Domain.Modules.Timetable.Entities;
using Oksis.Domain.Modules.Timetable.Enums;
using Xunit;

namespace Oksis.Domain.UnitTests.Modules.Timetable;

public class RoomTests
{
    [Fact]
    public void Create_sets_name_type_block_floor()
    {
        var room = Room.Create(Guid.NewGuid(), "C-101", "204 Nolu Sınıf",
            RoomType.Classroom, "A Blok", "2. Kat", 30);

        room.Code.Should().Be("C-101");
        room.Name.Should().Be("204 Nolu Sınıf");
        room.RoomType.Should().Be(RoomType.Classroom);
        room.Block.Should().Be("A Blok");
        room.Floor.Should().Be("2. Kat");
        room.Capacity.Should().Be(30);
        room.IsActive.Should().BeTrue();
    }

    [Fact]
    public void Update_changes_all_editable_fields()
    {
        var room = Room.Create(Guid.NewGuid(), "C-101", "Ad", RoomType.Classroom, null, null, 30);
        room.Update("LAB-1", "Lab", RoomType.Laboratory, "B Blok", "1. Kat", 24);

        room.Code.Should().Be("LAB-1");
        room.Name.Should().Be("Lab");
        room.RoomType.Should().Be(RoomType.Laboratory);
        room.Block.Should().Be("B Blok");
        room.Floor.Should().Be("1. Kat");
        room.Capacity.Should().Be(24);
    }
}
```

- [ ] **Step 2: Run test → FAIL**

Run: `dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~RoomTests"`
Expected: compile error / FAIL (Name/RoomType/Block/Floor yok, Create imzası eski).

- [ ] **Step 3: Modify Room.cs.** Add constants, properties, and update `Create`/`Update` signatures. Replace the properties + factory block with:
```csharp
    public const int MinCodeLength = 1;
    public const int MaxCodeLength = 20;
    public const int MaxNameLength = 120;
    public const int MaxLocationLength = 100;
    public const int MaxBlockLength = 60;
    public const int MaxFloorLength = 30;
    public const int MinCapacity = 1;
    public const int MaxCapacity = 500;

    public string Code { get; private set; } = default!;

    /// <summary>Görünen ad (örn. "204 Nolu Sınıf"). Tasarımda zorunlu alan.</summary>
    public string Name { get; private set; } = default!;

    public Enums.RoomType RoomType { get; private set; }

    /// <summary>Konum açıklaması (legacy; Block/Floor'dan türetilebilir). Opsiyonel.</summary>
    public string? Location { get; private set; }

    /// <summary>Blok (örn. "A Blok"). Opsiyonel.</summary>
    public string? Block { get; private set; }

    /// <summary>Kat (örn. "2. Kat"). Opsiyonel.</summary>
    public string? Floor { get; private set; }

    public int Capacity { get; private set; }

    public bool IsActive { get; private set; }

    private Room() { } // EF Core

    public static Room Create(
        Guid schoolId, string code, string name, Enums.RoomType roomType,
        string? block, string? floor, int capacity)
    {
        return new Room
        {
            Id = RoomId.New().Value,
            SchoolId = schoolId,
            Code = NormalizeCode(code),
            Name = NormalizeName(name),
            RoomType = roomType,
            Block = NormalizeOptional(block, MaxBlockLength, "Room.Block.TooLong"),
            Floor = NormalizeOptional(floor, MaxFloorLength, "Room.Floor.TooLong"),
            Location = ComposeLocation(block, floor),
            Capacity = ValidateCapacity(capacity),
            IsActive = true
        };
    }

    public void Update(
        string code, string name, Enums.RoomType roomType,
        string? block, string? floor, int capacity)
    {
        Code = NormalizeCode(code);
        Name = NormalizeName(name);
        RoomType = roomType;
        Block = NormalizeOptional(block, MaxBlockLength, "Room.Block.TooLong");
        Floor = NormalizeOptional(floor, MaxFloorLength, "Room.Floor.TooLong");
        Location = ComposeLocation(block, floor);
        Capacity = ValidateCapacity(capacity);
    }
```
Then replace the old `NormalizeLocation` helper and add the new helpers (keep `NormalizeCode`, `ValidateCapacity` as-is):
```csharp
    private static string NormalizeName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new InvalidRoomException("Room.Name.Empty", "Derslik adı boş olamaz.");
        }
        var trimmed = name.Trim();
        if (trimmed.Length > MaxNameLength)
        {
            throw new InvalidRoomException("Room.Name.TooLong",
                $"Derslik adı en fazla {MaxNameLength} karakter olabilir.");
        }
        return trimmed;
    }

    private static string? NormalizeOptional(string? value, int max, string errorCode)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        var trimmed = value.Trim();
        if (trimmed.Length > max)
        {
            throw new InvalidRoomException(errorCode, $"Değer en fazla {max} karakter olabilir.");
        }
        return trimmed;
    }

    private static string? ComposeLocation(string? block, string? floor)
    {
        var parts = new[] { block?.Trim(), floor?.Trim() }
            .Where(p => !string.IsNullOrWhiteSpace(p))
            .ToArray();
        return parts.Length == 0 ? null : string.Join(" · ", parts);
    }
```
Delete the now-unused `NormalizeLocation` method (its callers were the old Create/Update; if anything else references it, keep it). Add `using System.Linq;` if not present.

- [ ] **Step 4: Run test → PASS**

Run: `dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~RoomTests"`
Expected: PASS. (Build will fail elsewhere — handlers use old Create/Update signature — that's fixed in Tasks 4-6; only run this filtered test now.)

- [ ] **Step 5: Commit**
```bash
git add src/Oksis.Domain/Modules/Timetable/Entities/Room.cs tests/Oksis.Domain.UnitTests/Modules/Timetable/RoomTests.cs
git commit -m "2026-06-11 feat: Room entity Name/RoomType/Block/Floor alanlarıyla genişletildi."
```

---

## Task 3: EF mapping + migration

**Files:** Modify `RoomConfiguration.cs`; create migration.

- [ ] **Step 1: Update RoomConfiguration.** Add after the `Code` property mapping:
```csharp
        builder.Property(x => x.Name)
            .HasMaxLength(Room.MaxNameLength)
            .IsRequired();

        builder.Property(x => x.RoomType)
            .HasConversion<int>()
            .IsRequired()
            .HasDefaultValue(Oksis.Domain.Modules.Timetable.Enums.RoomType.Classroom);

        builder.Property(x => x.Block).HasMaxLength(Room.MaxBlockLength);
        builder.Property(x => x.Floor).HasMaxLength(Room.MaxFloorLength);
```
(Leave the existing `Location` mapping in place.)

- [ ] **Step 2: Build** `dotnet build` → success.

- [ ] **Step 3: Add migration**
```bash
dotnet ef migrations add 20260611_expand_rooms_name_type_location \
  --project src/Oksis.Infrastructure --startup-project src/Oksis.Api
```

- [ ] **Step 4: Backfill existing rows.** Open the generated migration `Up(...)` and, AFTER the `AddColumn` calls, add a backfill so existing rooms get a name (= code) before any NOT NULL enforcement issue (EF adds NOT NULL with default ""; we want Name = Code):
```csharp
            migrationBuilder.Sql(
                "UPDATE academic.rooms SET name = code WHERE name IS NULL OR name = '';");
```
RoomType defaults to 0 (Classroom) via the column default; Block/Floor stay NULL; Location preserved.

- [ ] **Step 5: Build again** `dotnet build` → success.

- [ ] **Step 6: Commit**
```bash
git add src/Oksis.Infrastructure/Persistence/Configurations/Timetable/RoomConfiguration.cs \
  src/Oksis.Infrastructure/Persistence/Migrations/*20260611_expand_rooms_name_type_location*
git commit -m "2026-06-11 feat: rooms tablosu name/room_type/block/floor kolonları + backfill migration."
```

---

## Task 4: CreateRoom — additive alanlar

**Files:** Modify `CreateRoom/CreateRoomCommand.cs`, `CreateRoomCommandHandler.cs`; create/modify validator if exists.

- [ ] **Step 1: Update the command**
```csharp
[Tenancy(TenancyMode.Required)]
[RequirePermission("class-rooms.update")]
public sealed record CreateRoomCommand(
    string Code,
    string Name,
    Oksis.Domain.Modules.Timetable.Enums.RoomType RoomType,
    string? Block,
    string? Floor,
    int Capacity) : ICommand<Guid>;
```

- [ ] **Step 2: Update the handler.** Replace the `Room.Create(...)` call:
```csharp
        var room = Room.Create(
            schoolId.Value, request.Code, request.Name, request.RoomType,
            request.Block, request.Floor, request.Capacity);
```
(Leave the duplicate-code check as-is.)

- [ ] **Step 3: Build** `dotnet build` → success (Create call now matches; Update handler fixed in Task 5).

- [ ] **Step 4: Commit**
```bash
git add src/Oksis.Application/Modules/Timetable/Commands/CreateRoom/
git commit -m "2026-06-11 feat: CreateRoomCommand name/roomType/block/floor alır."
```

---

## Task 5: UpdateRoom — additive alanlar + controller body

**Files:** Modify `UpdateRoom/UpdateRoomCommand.cs`, `UpdateRoomCommandHandler.cs`, `RoomsController.cs`.

- [ ] **Step 1: Update the command**
```csharp
[Tenancy(TenancyMode.Required)]
[RequirePermission("class-rooms.update")]
public sealed record UpdateRoomCommand(
    Guid Id,
    string Code,
    string Name,
    Oksis.Domain.Modules.Timetable.Enums.RoomType RoomType,
    string? Block,
    string? Floor,
    int Capacity,
    bool IsActive) : ICommand;
```

- [ ] **Step 2: Update the handler.** Replace `room.Update(...)`:
```csharp
        room.Update(request.Code, request.Name, request.RoomType,
            request.Block, request.Floor, request.Capacity);
```
(Keep the duplicate-code check and the IsActive Activate/Deactivate block.)

- [ ] **Step 3: Update RoomsController.** Replace `UpdateRoomBody` record + the PUT call:
```csharp
    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> UpdateAsync(
        Guid id,
        [FromBody] UpdateRoomBody body,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new UpdateRoomCommand(id, body.Code, body.Name, body.RoomType,
                body.Block, body.Floor, body.Capacity, body.IsActive),
            cancellationToken);
        return result.ToHttpResult(HttpContext);
    }
```
and the record at the bottom:
```csharp
public sealed record UpdateRoomBody(
    string Code,
    string Name,
    Oksis.Domain.Modules.Timetable.Enums.RoomType RoomType,
    string? Block,
    string? Floor,
    int Capacity,
    bool IsActive);
```

- [ ] **Step 4: Build** `dotnet build` → success.

- [ ] **Step 5: Commit**
```bash
git add src/Oksis.Application/Modules/Timetable/Commands/UpdateRoom/ src/Oksis.Api/Controllers/V1/RoomsController.cs
git commit -m "2026-06-11 feat: UpdateRoom name/roomType/block/floor alır (controller body güncellendi)."
```

---

## Task 6: DELETE endpoint (kullanım-kilidi) + ListRooms genişletme + RoomDto

**Files:** Create `DeleteRoom/DeleteRoomCommand.cs` + `DeleteRoomCommandHandler.cs`; modify `ListRoomsQuery.cs`, `ListRoomsQueryHandler.cs`, `RoomDto.cs`, `RoomsController.cs`.

- [ ] **Step 1: RoomDto — yeni alanlar**
```csharp
public sealed record RoomDto(
    Guid Id,
    string Code,
    string Name,
    Oksis.Domain.Modules.Timetable.Enums.RoomType RoomType,
    string? Block,
    string? Floor,
    string? Location,
    int Capacity,
    bool IsActive,
    string? AssignedClassRoomFullName);
```

- [ ] **Step 2: ListRoomsQuery — includeInactive parametresi.** Replace the query record:
```csharp
[RequirePermission("class-rooms.view")]
public sealed record ListRoomsQuery(Guid? SessionId, bool IncludeInactive = false)
    : IQuery<IReadOnlyList<RoomDto>>;
```
(Keep existing attributes/usings.)

- [ ] **Step 3: ListRoomsQueryHandler.** Replace the `rooms` query and DTO projection:
```csharp
        var query = db.Rooms.AsNoTracking();
        if (!request.IncludeInactive)
        {
            query = query.Where(r => r.IsActive);
        }
        var rooms = await query.OrderBy(r => r.Code).ToListAsync(cancellationToken);
```
and the projection:
```csharp
        IReadOnlyList<RoomDto> dtos = rooms
            .Select(r => new RoomDto(
                r.Id, r.Code, r.Name, r.RoomType, r.Block, r.Floor, r.Location,
                r.Capacity, r.IsActive,
                assignments.TryGetValue(r.Id, out var fullName) ? fullName : null))
            .ToList();
```

- [ ] **Step 4: DeleteRoomCommand**
`src/Oksis.Application/Modules/Timetable/Commands/DeleteRoom/DeleteRoomCommand.cs`:
```csharp
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Cqrs;

namespace Oksis.Application.Modules.Timetable.Commands.DeleteRoom;

/// <summary>
/// Dersliği siler. Herhangi bir şube (ClassRoom) bu odayı ev-dersliği olarak
/// kullanıyorsa silinemez (409) — "Kullanımda" kilidi. Aksi halde soft-delete.
/// </summary>
[Tenancy(TenancyMode.Required)]
[RequirePermission("class-rooms.update")]
public sealed record DeleteRoomCommand(Guid Id) : ICommand;
```

- [ ] **Step 5: DeleteRoomCommandHandler**
`.../DeleteRoom/DeleteRoomCommandHandler.cs`:
```csharp
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Shared;

namespace Oksis.Application.Modules.Timetable.Commands.DeleteRoom;

public sealed class DeleteRoomCommandHandler(IApplicationDbContext db)
    : ICommandHandler<DeleteRoomCommand>
{
    public async Task<Result> Handle(DeleteRoomCommand request, CancellationToken cancellationToken)
    {
        var room = await db.Rooms.FirstOrDefaultAsync(r => r.Id == request.Id, cancellationToken);
        if (room is null)
        {
            return Result.NotFound();
        }

        var inUse = await db.ClassRooms
            .AsNoTracking()
            .AnyAsync(c => c.RoomId != null && c.RoomId.Value == request.Id, cancellationToken);
        if (inUse)
        {
            return Result.Conflict("rooms.errors.in-use");
        }

        db.Rooms.Remove(room); // TenantSaveChangesInterceptor soft-delete'e çevirir
        await db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
```

- [ ] **Step 6: Controller — DELETE + includeInactive.** Update the GET to pass includeInactive and add DELETE:
```csharp
    [HttpGet("")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<RoomDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListAsync(
        [FromQuery] Guid? sessionId,
        [FromQuery] bool includeInactive,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new ListRoomsQuery(sessionId, includeInactive), cancellationToken);
        return result.ToHttpResult(HttpContext);
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> DeleteAsync(Guid id, CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new Oksis.Application.Modules.Timetable.Commands.DeleteRoom.DeleteRoomCommand(id),
            cancellationToken);
        return result.ToHttpResult(HttpContext);
    }
```
(Add `using Oksis.Application.Modules.Timetable.Commands.DeleteRoom;` at top if preferred over fully-qualified.)

- [ ] **Step 7: Build + full backend test**

Run: `dotnet build && dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~RoomTests"`
Expected: build success; RoomTests pass. Then `dotnet test` (full) — fix any compile breaks in existing room-related tests (update old `Room.Create`/`UpdateRoomCommand`/`RoomDto` call sites to the new signatures; report which files).

- [ ] **Step 8: Commit**
```bash
git add src/Oksis.Application/Modules/Timetable/ src/Oksis.Api/Controllers/V1/RoomsController.cs
git commit -m "2026-06-11 feat: rooms DELETE (kullanım-kilidi) + ListRooms includeInactive + RoomDto genişletildi."
```

---

# BÖLÜM B — FRONTEND

## Task 7: Rooms API katmanı (types + keys + queries + mutations)

**Files:** Create under `src/portals/admin/settings/api/rooms/`: `rooms.types.ts`, `rooms.keys.ts`, `rooms.queries.ts`, `rooms.mutations.ts`, `index.ts`. Test: `rooms.queries.test.ts`.

> httpClient + tenant-scoped query key desenini mevcut `src/portals/admin/settings/api/school-settings.*` dosyalarından birebir izle (aynı `httpClient`, `ApiEnvelope`, `useQuery/useMutation`, `queryClient.invalidateQueries`). Tenant prefix için school-settings.keys.ts'teki deseni kopyala.

- [ ] **Step 1: Read existing API pattern.** `src/portals/admin/settings/api/school-settings.queries.ts`, `school-settings.mutations.ts`, `school-settings.keys.ts` dosyalarını oku; `httpClient` import yolu, envelope tipi, key fabrikası ve invalidation desenini birebir uygula.

- [ ] **Step 2: types** `rooms.types.ts`:
```ts
export type RoomType = 'Classroom' | 'Laboratory' | 'Workshop' | 'Other';

export interface RoomDto {
  id: string;
  code: string;
  name: string;
  roomType: RoomType;
  block: string | null;
  floor: string | null;
  location: string | null;
  capacity: number;
  isActive: boolean;
  /** Sezonda bu odayı ev-dersliği kullanan şube (null = müsait) → "Kullanımda" kilidi. */
  assignedClassRoomFullName: string | null;
}

export interface RoomUpsert {
  code: string;
  name: string;
  roomType: RoomType;
  block: string | null;
  floor: string | null;
  capacity: number;
  isActive: boolean;
}
```
> Not: Backend `RoomType` enum'unu JSON'da int mi string mi döndürüyor doğrula. EF enum int saklar ama API serileştirmesi `JsonStringEnumConverter` ile string olabilir — mevcut başka enum DTO'larının (ör. ClassRoomStatus "Active") string döndüğü görüldü, bu yüzden string union kullanıldı. Eğer int dönüyorsa tipi `0|1|2|3` map'ine çevir ve raporla.

- [ ] **Step 3: keys** `rooms.keys.ts` — tenant-scoped (school-settings.keys.ts deseni):
```ts
export const roomKeys = {
  all: (schoolId: string) => ['rooms', schoolId] as const,
  list: (schoolId: string, includeInactive: boolean) =>
    ['rooms', schoolId, 'list', { includeInactive }] as const,
};
```

- [ ] **Step 4: queries** `rooms.queries.ts` — `useRooms(includeInactive = true)`:
```ts
import { useQuery } from '@tanstack/react-query';
import { httpClient } from '<httpClient yolu — school-settings.queries.ts'ten al>';
import { useAuthStore } from '<authStore yolu>';
import { roomKeys } from './rooms.keys';
import type { RoomDto } from './rooms.types';

export function useRooms(includeInactive = true) {
  const schoolId = useAuthStore((s) => s.user?.schoolId ?? '');
  return useQuery({
    queryKey: roomKeys.list(schoolId, includeInactive),
    queryFn: async ({ signal }) => {
      const res = await httpClient.get<{ data: RoomDto[] }>(
        `/rooms?includeInactive=${includeInactive}`,
        { signal }
      );
      return res.data.data;
    },
    enabled: !!schoolId,
  });
}
```
(envelope erişimini mevcut desene göre düzelt: bazı yerlerde `res.data.data`, bazılarında adapter var.)

- [ ] **Step 5: mutations** `rooms.mutations.ts` — create/update/delete, hepsi `roomKeys.all` invalidasyonu:
```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { httpClient } from '<httpClient yolu>';
import { useAuthStore } from '<authStore yolu>';
import { roomKeys } from './rooms.keys';
import type { RoomUpsert } from './rooms.types';

export function useCreateRoom() {
  const qc = useQueryClient();
  const schoolId = useAuthStore((s) => s.user?.schoolId ?? '');
  return useMutation({
    mutationFn: async (payload: RoomUpsert) => {
      const res = await httpClient.post<{ data: string }>('/rooms', payload);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: roomKeys.all(schoolId) }),
  });
}

export function useUpdateRoom() {
  const qc = useQueryClient();
  const schoolId = useAuthStore((s) => s.user?.schoolId ?? '');
  return useMutation({
    mutationFn: async ({ id, ...payload }: RoomUpsert & { id: string }) => {
      await httpClient.put(`/rooms/${id}`, payload);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: roomKeys.all(schoolId) }),
  });
}

export function useDeleteRoom() {
  const qc = useQueryClient();
  const schoolId = useAuthStore((s) => s.user?.schoolId ?? '');
  return useMutation({
    mutationFn: async (id: string) => {
      await httpClient.delete(`/rooms/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: roomKeys.all(schoolId) }),
  });
}
```

- [ ] **Step 6: barrel** `index.ts`: re-export all four.

- [ ] **Step 7: Write + run a query test** `rooms.queries.test.ts` (msw, school-settings test deseni) doğrulayan: `useRooms` GET /rooms?includeInactive=true çağırır ve listeyi döndürür. Run `npm run test -- rooms.queries` → PASS.

- [ ] **Step 8: Commit**
```bash
git add src/portals/admin/settings/api/rooms/
git commit -m "2026-06-11 feat: Derslikler rooms API katmanı (list/create/update/delete hook'ları)."
```

---

## Task 8: RoomTypeBadge + RoomFormDrawer + Zod şema + i18n

**Files:** Create `components/RoomTypeBadge.tsx`, `components/RoomFormDrawer.tsx`, `schemas/room.schema.ts`; modify i18n.

- [ ] **Step 1: i18n `rooms.*`.** `tr/school-settings.json` → `school-settings` köküne `rooms` objesi:
```json
"rooms": {
  "title": "Derslikler",
  "subtitle": "Okuldaki fiziksel mekânlar — ders programı kurulurken bu listeden seçilir.",
  "search": "Derslik ara…",
  "new": "Yeni Derslik",
  "allTypes": "Tüm Tipler",
  "status": { "all": "Durum", "active": "Aktif", "passive": "Pasif" },
  "view": { "table": "Tablo", "card": "Kart" },
  "inUse": "Kullanımda",
  "columns": { "name": "Derslik Adı", "type": "Tip", "capacity": "Kapasite", "location": "Konum", "status": "Durum" },
  "types": { "Classroom": "Sınıf", "Laboratory": "Laboratuvar", "Workshop": "Atölye", "Other": "Diğer" },
  "actions": { "edit": "Düzenle", "deactivate": "Pasife Al", "delete": "Sil" },
  "form": { "name": "Derslik Adı", "code": "Kod", "type": "Tip", "capacity": "Kapasite", "block": "Blok", "floor": "Kat", "active": "Aktif" },
  "empty": { "title": "Henüz derslik tanımlanmadı", "cta": "İlk Dersliği Ekle" },
  "noResults": "Sonuç bulunamadı",
  "clearFilters": "Filtreleri temizle",
  "deactivateConfirm": "Bu dersliği pasife almak istediğinize emin misiniz?",
  "deleteConfirm": "Bu derslik kalıcı olarak silinecek. Devam edilsin mi?",
  "errors": { "duplicate-code": "Bu kod zaten kullanılıyor.", "in-use": "Bu derslik kullanımda — silinemez, pasife alabilirsiniz." },
  "saved": "Derslik kaydedildi.",
  "deleted": "Derslik silindi."
}
```
EN karşılıkları `en/school-settings.json`'a (Rooms, Search rooms…, New Room, All Types, Active/Passive, Table/Card, In use, Name/Type/Capacity/Location/Status, Classroom/Laboratory/Workshop/Other, Edit/Deactivate/Delete, vb.).

- [ ] **Step 2: RoomTypeBadge** `components/RoomTypeBadge.tsx` — tip başına ikon+renk (tasarım: Sınıf, Atölye, Laboratuvar, Diğer):
```tsx
import { School, FlaskConical, Wrench, DoorClosed, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '../../../../app/components/ui/badge';
import type { RoomType } from '../api/rooms/rooms.types';

const META: Record<RoomType, { icon: LucideIcon; cls: string }> = {
  Classroom: { icon: School, cls: 'bg-sky-100 text-sky-700' },
  Laboratory: { icon: FlaskConical, cls: 'bg-violet-100 text-violet-700' },
  Workshop: { icon: Wrench, cls: 'bg-amber-100 text-amber-700' },
  Other: { icon: DoorClosed, cls: 'bg-slate-100 text-slate-600' },
};

export function RoomTypeBadge({ type }: { type: RoomType }) {
  const { t } = useTranslation('school-settings');
  const meta = META[type];
  const Icon = meta.icon;
  return (
    <Badge variant="outline" className={`gap-1 border-transparent ${meta.cls}`}>
      <Icon className="h-3 w-3" aria-hidden="true" />
      {t(`rooms.types.${type}`)}
    </Badge>
  );
}
```

- [ ] **Step 3: Zod şema** `schemas/room.schema.ts`:
```ts
import { z } from 'zod';

export const roomSchema = z.object({
  code: z.string().trim().min(1).max(20),
  name: z.string().trim().min(1).max(120),
  roomType: z.enum(['Classroom', 'Laboratory', 'Workshop', 'Other']),
  block: z.string().trim().max(60).optional().or(z.literal('')),
  floor: z.string().trim().max(30).optional().or(z.literal('')),
  capacity: z.coerce.number().int().min(1).max(500),
  isActive: z.boolean(),
});

export type RoomFormValues = z.infer<typeof roomSchema>;
```

- [ ] **Step 4: RoomFormDrawer** `components/RoomFormDrawer.tsx` — shadcn `Sheet` (sağ drawer, brand-gradient head) + RHF + roomSchema. Alanlar: Derslik Adı*, Kod*, Tip (Select), Kapasite, Blok, Kat, Aktif (Switch). Props: `{ open, onOpenChange, initial?: RoomDto | null, onSubmit: (values: RoomFormValues) => Promise<void>, isSaving }`. `initial` varsa düzenleme, yoksa yeni. (GeneralSettingsTab'daki RHF + shadcn Form desenini izle.) Boş `block`/`floor` stringlerini submit'te `null`'a çevir.

- [ ] **Step 5: Test** `components/__tests__/RoomFormDrawer.test.tsx`: open=true iken Ad/Kod/Tip/Kapasite alanları render olur; geçerli submit `onSubmit`'i doğru payload'la çağırır. Run `npm run test -- RoomFormDrawer` → PASS.

- [ ] **Step 6: Commit**
```bash
git add src/portals/admin/settings/components/RoomTypeBadge.tsx \
  src/portals/admin/settings/components/RoomFormDrawer.tsx \
  src/portals/admin/settings/components/__tests__/RoomFormDrawer.test.tsx \
  src/portals/admin/settings/schemas/room.schema.ts \
  src/shared/i18n/locales/tr/school-settings.json \
  src/shared/i18n/locales/en/school-settings.json
git commit -m "2026-06-11 feat: Derslikler RoomFormDrawer + RoomTypeBadge + zod şema + i18n."
```

---

## Task 9: RoomsTab — toolbar + tablo/kart + pager + durumlar + aksiyonlar

**Files:** Modify `tabs/RoomsTab.tsx` (placeholder → full). Test: `tabs/__tests__/RoomsTab.test.tsx`.

**Davranış (tasarım):** PageTop (başlık + alt başlık + sağda "Yeni Derslik"). Toolbar: arama input, Tip filtresi (Tüm Tipler + 4 tip), Durum filtresi (Aktif/Pasif), aktif filtre chip'leri, Tablo/Kart toggle. Tablo (varsayılan): kolonlar Derslik Adı (+kod alt satır), Tip (RoomTypeBadge), Kapasite, Konum (block · floor), Durum (Aktif/Pasif badge), satır hover aksiyonları (Düzenle / Pasife Al / Sil). "Kullanımda" (assignedClassRoomFullName != null) → Sil disabled + tooltip; Pasife Al confirm dialog. Sayfalama 8/sayfa (kart 9). Veri durumları: yükleniyor (skeleton satır), boş (empty + İlk Dersliği Ekle), hata (Tekrar Dene), sonuç yok (filtre temizle). Filtre/arama/sayfa URL search param'ında (react-router) tutulur.

- [ ] **Step 1: Write the failing test** `tabs/__tests__/RoomsTab.test.tsx` (msw GET /rooms döndürür 2 oda: biri kullanımda):
```tsx
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { server } from '../../../../../test/mswServer';
import { useAuthStore } from '../../../../../shared/store/authStore';
import { UserRole } from '../../../../../modules/identity/types/user.types';
import { ADMIN_PERMISSIONS } from '../../../../../test/authFixtures';
import { RoomsTab } from '../RoomsTab';
import '../../../../../shared/i18n';

const BASE = 'http://localhost:5112/api/v1';

function wrap(ui: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/admin/settings/rooms']}>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  useAuthStore.setState({
    user: { id: 'u1', schoolId: 'school-1', firstName: 'T', lastName: 'U', email: 'a@b.c',
      role: UserRole.SchoolAdmin, firstLoginRequired: false, permissions: ADMIN_PERMISSIONS },
    accessToken: 'jwt', firstLoginRequired: false,
  });
  server.use(
    http.get(`${BASE}/rooms`, () =>
      HttpResponse.json({ data: [
        { id: 'r1', code: 'D204', name: '204 Nolu Sınıf', roomType: 'Classroom', block: 'A Blok', floor: '2. Kat', location: 'A Blok · 2. Kat', capacity: 30, isActive: true, assignedClassRoomFullName: '9-A' },
        { id: 'r2', code: 'LAB-1', name: 'Fizik Laboratuvarı', roomType: 'Laboratory', block: 'B Blok', floor: '1. Kat', location: 'B Blok · 1. Kat', capacity: 24, isActive: false, assignedClassRoomFullName: null },
      ] })
    )
  );
});

describe('RoomsTab', () => {
  it('derslik listesini render eder', async () => {
    render(wrap(<RoomsTab />));
    await waitFor(() => expect(screen.getByText('204 Nolu Sınıf')).toBeInTheDocument());
    expect(screen.getByText('Fizik Laboratuvarı')).toBeInTheDocument();
  });

  it('kullanımdaki derslik "Kullanımda" gösterir', async () => {
    render(wrap(<RoomsTab />));
    await waitFor(() => expect(screen.getByText('Kullanımda')).toBeInTheDocument());
  });

  it('Yeni Derslik butonu var', async () => {
    render(wrap(<RoomsTab />));
    await waitFor(() => expect(screen.getByRole('button', { name: /Yeni Derslik/ })).toBeInTheDocument());
  });
});
```

- [ ] **Step 2: Run test → FAIL** (`npm run test -- RoomsTab`): placeholder içerik.

- [ ] **Step 3: Implement RoomsTab.** Placeholder'ı tam implementasyonla değiştir. Yapı:
  - `useRooms(true)` ile veri; `useSearchParams` ile `q`, `type`, `status`, `view`, `page`.
  - Yükleniyor: skeleton; hata: Tekrar Dene kartı (school-settings `errors.save-failed` deseni); boş (hiç oda yok): empty + "İlk Dersliği Ekle"; sonuç yok (filtre sonrası 0): "Sonuç bulunamadı" + filtre temizle.
  - Toolbar: arama input (`q`), Tip `Select` (Tüm Tipler + 4 tip), Durum `Select` (Aktif/Pasif/hepsi), Tablo/Kart toggle (iki buton).
  - Filtreleme client-side: `name`/`code` arama; `roomType`; `isActive`.
  - Tablo: shadcn `Table`; kolonlar columns i18n; `RoomTypeBadge`; Konum = `block · floor` (veya `location`); Durum badge; satır aksiyonları (Düzenle → drawer initial; Pasife Al → confirm `AlertDialog`, `useUpdateRoom` ile isActive=false; Sil → `assignedClassRoomFullName` varsa disabled + tooltip `rooms.inUse`, yoksa confirm + `useDeleteRoom`).
  - Kart görünümü: aynı veriler kart grid; sayfa 9.
  - Pager: shadcn `pagination`, 8/sayfa (kart 9).
  - "Yeni Derslik" → `RoomFormDrawer` (initial=null). Drawer onSubmit: create veya update mutation; başarıda `toast.success(rooms.saved)`; 409 `duplicate-code`/`in-use` → form/satır hatası + `toast.error`.
  - Tüm metinler i18n; default export YOK.

> Mevcut bir paylaşımlı liste/araç-çubuğu primitive'i (DataTable/StuFilter/StuPager) varsa onu kullan; yoksa shadcn `Table`/`pagination` ile kur. `OksisDataGrid` (DevExtreme) bu ekranda **kullanma** — tasarım hafif tablo + kart toggle istiyor, satır-hover aksiyonları ve kart görünümü grid wrapper'a uymuyor; shadcn `Table` ile elle kur (web CLAUDE.md DataGrid kuralı liste-grid içindir, bu özel görünüm istisnadır — gerekçe: kart/tablo toggle + hover aksiyon).

- [ ] **Step 4: Run test → PASS** (`npm run test -- RoomsTab`).

- [ ] **Step 5: Full settings suite + build**

Run: `npm run test -- settings && npm run build`
Expected: yeşil, build temiz.

- [ ] **Step 6: Commit**
```bash
git add src/portals/admin/settings/tabs/RoomsTab.tsx \
  src/portals/admin/settings/tabs/__tests__/RoomsTab.test.tsx
git commit -m "2026-06-11 feat: Derslikler sekmesi tasarıma hizalandı (toolbar, tablo/kart, drawer, durumlar, kullanım-kilidi)."
```

---

## Self-Review Notları

- **Spec coverage:** Spec "4 · Derslikler" — toolbar (arama, Tüm Tipler+Durum filtre, chip, Tablo/Kart) ✅, sıralanabilir tablo (ad+kod, Tip badge, Kapasite, Konum, Durum, hover aksiyon) ✅, 8/sayfa pager ✅, "Kullanımda" kilit + pasife alma confirm ✅, Yeni/Düzenle drawer (ad/kod/tip/kapasite/blok/kat/aktif) ✅, veri durumları (yükleniyor/boş/hata/sonuç yok) ✅. Backend additive (Name/RoomType/Block/Floor + DELETE + includeInactive) ✅ — debt yok.
- **Risk 1 (enum serileştirme):** RoomType JSON'da int mi string mi — Task 7 Step 2 doğrulamayı zorunlu kılar. Yanlışsa tip union → numeric map.
- **Risk 2 (mevcut çağıranlar):** `Room.Create`/`UpdateRoomCommand`/`RoomDto` imza değişimi mevcut testleri/çağrıları kırabilir (Task 6 Step 7 tüm `dotnet test` ile yakalar). `classroomsApi.rooms()` web tarafı RoomDto'ya yeni alanlar ekledi — eski alanlar korunduğu için kırılmaz; yeni alanlar opsiyonel okunur.
- **Risk 3 (includeInactive):** Classrooms ev-dersliği atama ekranı `GET /rooms` default (active-only) kullanmaya devam eder; settings tab `includeInactive=true` gönderir — geriye dönük uyum korunur.
- **Permission:** view=`class-rooms.view`, write/delete=`class-rooms.update` (mevcut desen). Sekreter salt-okunur davranışı bu planda kapsam dışı (genel rol-gating ayrı iş); Plan 1 `ReadOnlyBanner` ileride bağlanır.
- **Tip tutarlılığı:** `RoomType` union (FE) ↔ enum (BE) adları birebir (Classroom/Laboratory/Workshop/Other). `RoomUpsert` create+update ortak; update'te `id` ayrı geçilir.
- **DataGrid istisnası:** web CLAUDE.md "DevExtreme wrapper zorunlu" kuralı liste-grid içindir; bu tasarım tablo/kart toggle + hover aksiyon + kart görünümü istediğinden shadcn `Table` ile elle kuruldu — completion_status'a not düşülecek.
