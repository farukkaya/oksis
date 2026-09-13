# Testing Rules

> Test stratejisi standardize. AI test yazarken bu kurallara uyar.

---

## 1. Test Piramidi

```
       ▲
       │  E2E (Playwright web, Detox mobile) — %5
       │  ────────────────────────────────────
       │  Integration (Testcontainers) — %25
       │  ────────────────────────────────────
       │  Unit (xUnit / Vitest) — %70
       └──────────────────────────────────────►
```

---

## 2. Backend Test Stack

| Tip | Tool |
|---|---|
| Unit | xUnit |
| Assertion | FluentAssertions |
| Mock | NSubstitute (Moq DEĞİL) |
| Integration | Testcontainers (SQL Server + Redis) |
| Architecture | NetArchTest |
| API contract | (sonra) Pact, MVP'de yok |
| Load | k6 (MVP sonrası) |

---

## 3. Test İsimlendirme

### Method ismi: `Should_{ExpectedBehavior}_When_{Condition}`

```csharp
[Fact]
public async Task Should_ReturnNotFound_When_StudentDoesNotExist() { }

[Fact]
public async Task Should_PublishMark_When_TeacherHasPermission() { }

[Fact]
public async Task Should_ThrowTenantMismatchException_When_StudentBelongsToAnotherSchool() { }
```

### Test sınıfı: `{SystemUnderTest}Tests`

```
CreateStudentCommandHandlerTests
StudentRepositoryTests
TenantInterceptorTests
```

---

## 4. AAA Pattern

Her test 3 bölüm:

```csharp
[Fact]
public async Task Should_CreateStudent_When_ValidRequest()
{
    // Arrange
    var schoolId = Guid.NewGuid();
    var command = new CreateStudentCommand(schoolId, "Ali", "Veli", ...);
    _tenantContext.SchoolId.Returns(schoolId);
    
    // Act
    var result = await _sut.Handle(command, CancellationToken.None);
    
    // Assert
    result.IsSuccess.Should().BeTrue();
    result.Value.Should().NotBeEmpty();
}
```

Boş satır ile bölümler ayrılır. Yorum satırı ZORUNLU.

---

## 5. Minimum Test Kapsamı

### Unit Test (her zaman)
- ✅ Command handlers (happy path + validation fail + business rule fail)
- ✅ Query handlers (data return + empty result + filtering)
- ✅ Validators (her validation rule için en az 1 test)
- ✅ Domain entity invariant'ları
- ✅ Domain event publishing
- ✅ Value object'lar

### Integration Test (kritik akışlar)
- ✅ Authentication / refresh token flow
- ✅ Multi-tenant isolation (cross-tenant erişim engellenmeli)
- ✅ EF Core query filter çalışıyor mu
- ✅ Transaction behavior (rollback)
- ✅ Notification job (event → FCM/Email mock)
- ✅ Excel import end-to-end

### Architecture Test
- ✅ Domain hiçbir şeye bağımlı değil
- ✅ Application sadece Domain'e bağlı
- ✅ Controller içinde DbContext kullanılmıyor
- ✅ Entity'lerde public setter yok (immutable)
- ✅ Async metodlar `Async` suffix'i taşıyor

### Coverage Hedefi (MVP)
- Application layer: **≥ 80%**
- Domain layer: **≥ 90%**
- Infrastructure: **≥ 50%** (zor-mock external'lar dahil)
- API: **≥ 60%** (kontrolcüler ince olduğu için)

---

## 6. Mock Kullanımı

### NSubstitute ile

```csharp
_studentRepository = Substitute.For<IStudentRepository>();
_studentRepository.GetByIdAsync(studentId).Returns(student);

await _sut.Handle(query, ct);

await _studentRepository.Received(1).GetByIdAsync(studentId);
```

### Yasak
- ❌ Concrete sınıfları mock'lama (interface'ler üzerinden)
- ❌ Static metodları mock'lamak için gymnastic (yapılamıyorsa kodu refactor et)
- ❌ DbContext mock'lamak (Integration test'te real DB kullan, Testcontainers ile)

---

## 7. Integration Test Pattern

```csharp
public class StudentIntegrationTests : IClassFixture<IntegrationTestFixture>
{
    private readonly IntegrationTestFixture _fixture;
    
    [Fact]
    public async Task Should_NotReturnStudent_When_BelongsToAnotherTenant()
    {
        // Arrange
        await _fixture.SeedAsync(/* school A, school B, students */);
        var clientForSchoolA = _fixture.CreateAuthenticatedClient(schoolAId, userId);
        
        // Act
        var response = await clientForSchoolA.GetAsync($"/api/v1/students/{schoolB_StudentId}");
        
        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
```

### Fixture Kuralları
- Her test class'ı için yeni database (Testcontainers spin-up).
- Test arası **transaction rollback** veya **respawn** ile state temizliği.
- Seed data sadece test'in ihtiyacı kadar.

---

## 8. Frontend Test Stack

| Tip | Tool |
|---|---|
| Unit (component, hook) | Vitest + Testing Library |
| Mock API | MSW (Mock Service Worker) |
| E2E | Playwright |
| Visual regression | (Sprint 5+) — Percy / Chromatic |

---

## 9. Frontend Test Yaklaşımı

### Component Test

```ts
describe('StudentList', () => {
  it('should render students returned by API', async () => {
    server.use(
      http.get('/api/v1/students', () => HttpResponse.json({
        items: [{ id: '1', firstName: 'Ali', lastName: 'Veli' }],
        total: 1
      }))
    );
    
    render(<StudentList />, { wrapper: TestProviders });
    
    expect(await screen.findByText('Ali Veli')).toBeInTheDocument();
  });
  
  it('should show empty state when no students', async () => {
    server.use(
      http.get('/api/v1/students', () => HttpResponse.json({ items: [], total: 0 }))
    );
    render(<StudentList />, { wrapper: TestProviders });
    expect(await screen.findByText(/henüz öğrenci yok/i)).toBeInTheDocument();
  });
});
```

### Hook Test

```ts
describe('useStudentsQuery', () => {
  it('should fetch and return students', async () => {
    const { result } = renderHook(() => useStudentsQuery({ schoolId: 'x' }), {
      wrapper: TestProviders
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items).toHaveLength(1);
  });
});
```

### Kurallar
- Implementation değil **kullanıcı davranışı** test edilir (`getByRole`, `getByText` — `getByTestId` son tercih).
- Snapshot test yok.
- Tüm async UI'lar `findBy*` veya `waitFor` ile test edilir.
- MSW handler'ları test başına override edilir.

---

## 10. Test Data Builder Pattern

```csharp
public class StudentBuilder
{
    private Guid _schoolId = Guid.NewGuid();
    private string _firstName = "Test";
    private string _lastName = "Student";
    
    public StudentBuilder WithSchool(Guid id) { _schoolId = id; return this; }
    public StudentBuilder WithName(string first, string last) { /* ... */ return this; }
    
    public Student Build() => new(_schoolId, _firstName, _lastName, ...);
}

// Kullanım:
var student = new StudentBuilder().WithSchool(schoolA).Build();
```

`Faker` (Bogus library) ile realistik data; production data ASLA test'te.

---

## 11. Test Yasakları

- ❌ Test'te `Thread.Sleep` (yerine `await Task.Delay` kullan, gerçekten gerekiyorsa).
- ❌ Test'te DateTime.Now (FakeTimeProvider veya sabit tarih).
- ❌ Test'te random data (her zaman seed ile).
- ❌ Production database / production API'ye bağlanma.
- ❌ Birbirine bağımlı testler (her test bağımsız çalışabilmeli).
- ❌ "Coverage için" anlamsız test (sadece "ran without throwing").
- ❌ `[Skip]` ile commit (CI fail etmeli).

---

## 12. CI'da Test

- PR açıldığında: unit + integration test (full).
- Main'e merge'den önce: unit + integration + architecture test.
- Test paralel çalışır (`xUnit.runner.json` ile `parallelizeAssembly`).
- Test süresi target: **unit < 1 dk, integration < 5 dk**.
- Flaky test → 3 kez çalıştır, hala fail → fix veya quarantine.
