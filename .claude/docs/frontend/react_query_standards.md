# React Query Standards for Oksis Project

## Overview

This document establishes enterprise-grade React Query (TanStack Query) patterns for Oksis. All data fetching follows:

```
Component → Hook (useQuery/useMutation) → Service → API Client → Backend
                                        ↓
                                    Mock Data (Development)
```

---

## 1. Architecture Principles

### ✅ DO

- ✅ Centralize data fetching in custom hooks
- ✅ Use service layer for API calls
- ✅ Implement mock data for development/testing
- ✅ Use query keys as constants
- ✅ Handle loading and error states explicitly
- ✅ Use stale time and cache invalidation strategically
- ✅ Implement retry logic for failed requests
- ✅ Use background refetching for data freshness

### ❌ DON'T

- ❌ Fetch data directly in components
- ❌ Use static arrays in components
- ❌ Mix API calls with business logic
- ❌ Ignore error states
- ❌ Cache everything indefinitely
- ❌ Refetch on every component render
- ❌ Use string literals for query keys

---

## 2. Query Key Structure

### Convention

```typescript
// src/features/students/constants/queryKeys.ts

export const studentKeys = {
  all: ['students'] as const,
  lists: () => [...studentKeys.all, 'list'] as const,
  list: (filters: StudentFilters) => 
    [...studentKeys.lists(), { filters }] as const,
  details: () => [...studentKeys.all, 'detail'] as const,
  detail: (id: string) => [...studentKeys.details(), id] as const,
  search: (query: string) => [...studentKeys.all, 'search', query] as const,
};

export const classKeys = {
  all: ['classes'] as const,
  lists: () => [...classKeys.all, 'list'] as const,
  list: (filters: ClassFilters) => 
    [...classKeys.lists(), { filters }] as const,
  details: () => [...classKeys.all, 'detail'] as const,
  detail: (id: string) => [...classKeys.details(), id] as const,
};
```

### Usage

```typescript
// Never use hardcoded strings
❌ useQuery({ queryKey: ['students'] })
✅ useQuery({ queryKey: studentKeys.all })
```

---

## 3. Service Layer Pattern

### File Structure

```
src/features/students/
├── api/
│   └── studentService.ts          # API calls
├── hooks/
│   ├── useStudents.ts             # Query hook
│   ├── useStudent.ts              # Query hook (single)
│   └── useCreateStudent.ts        # Mutation hook
├── constants/
│   ├── queryKeys.ts               # Query key constants
│   └── config.ts                  # Feature config
├── types/
│   └── student.types.ts           # TypeScript types
└── mocks/
    └── studentMocks.ts            # Mock data
```

### Service Implementation

```typescript
// src/features/students/api/studentService.ts

import { httpClient } from '@/shared/api/httpClient';
import {
  Student,
  CreateStudentRequest,
  UpdateStudentRequest,
  StudentFilters,
} from '../types/student.types';

export const studentService = {
  /**
   * Fetch all students with optional filters
   */
  getStudents: async (filters?: StudentFilters): Promise<Student[]> => {
    const response = await httpClient.get<Student[]>('/students', {
      params: filters,
    });
    return response.data;
  },

  /**
   * Fetch single student by ID
   */
  getStudent: async (id: string): Promise<Student> => {
    const response = await httpClient.get<Student>(`/students/${id}`);
    return response.data;
  },

  /**
   * Create new student
   */
  createStudent: async (data: CreateStudentRequest): Promise<Student> => {
    const response = await httpClient.post<Student>('/students', data);
    return response.data;
  },

  /**
   * Update existing student
   */
  updateStudent: async (
    id: string,
    data: UpdateStudentRequest
  ): Promise<Student> => {
    const response = await httpClient.put<Student>(
      `/students/${id}`,
      data
    );
    return response.data;
  },

  /**
   * Delete student
   */
  deleteStudent: async (id: string): Promise<void> => {
    await httpClient.delete(`/students/${id}`);
  },
};
```

---

## 4. Query Hooks Pattern

### Single Query Hook

```typescript
// src/features/students/hooks/useStudent.ts

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { studentService } from '../api/studentService';
import { studentKeys } from '../constants/queryKeys';
import { Student } from '../types/student.types';

interface UseStudentOptions
  extends Omit<UseQueryOptions<Student>, 'queryKey' | 'queryFn'> {
  enabled?: boolean;
}

export function useStudent(
  id: string,
  options?: UseStudentOptions
) {
  return useQuery({
    queryKey: studentKeys.detail(id),
    queryFn: () => studentService.getStudent(id),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
    retry: 2,
    enabled: !!id,
    ...options,
  });
}
```

### List Query Hook

```typescript
// src/features/students/hooks/useStudents.ts

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { studentService } from '../api/studentService';
import { studentKeys } from '../constants/queryKeys';
import { Student, StudentFilters } from '../types/student.types';

interface UseStudentsOptions
  extends Omit<UseQueryOptions<Student[]>, 'queryKey' | 'queryFn'> {
  filters?: StudentFilters;
}

export function useStudents(options?: UseStudentsOptions) {
  const { filters, ...queryOptions } = options || {};

  return useQuery({
    queryKey: studentKeys.list(filters || {}),
    queryFn: () => studentService.getStudents(filters),
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
    ...queryOptions,
  });
}
```

---

## 5. Mutation Hooks Pattern

### Create Mutation Hook

```typescript
// src/features/students/hooks/useCreateStudent.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { studentService } from '../api/studentService';
import { studentKeys } from '../constants/queryKeys';
import { Student, CreateStudentRequest } from '../types/student.types';
import { useToast } from '@/shared/hooks/useToast';

export function useCreateStudent() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  return useMutation({
    mutationFn: (data: CreateStudentRequest) =>
      studentService.createStudent(data),
    onSuccess: (newStudent) => {
      // Invalidate list queries
      queryClient.invalidateQueries({
        queryKey: studentKeys.lists(),
      });

      // Optionally add to cache
      queryClient.setQueryData(
        studentKeys.detail(newStudent.id),
        newStudent
      );

      showSuccess('Student created successfully');
    },
    onError: (error) => {
      showError(`Failed to create student: ${error.message}`);
    },
  });
}
```

### Update Mutation Hook

```typescript
// src/features/students/hooks/useUpdateStudent.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { studentService } from '../api/studentService';
import { studentKeys } from '../constants/queryKeys';
import { Student, UpdateStudentRequest } from '../types/student.types';
import { useToast } from '@/shared/hooks/useToast';

interface UseUpdateStudentOptions {
  onSuccess?: (student: Student) => void;
}

export function useUpdateStudent(
  studentId: string,
  options?: UseUpdateStudentOptions
) {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  return useMutation({
    mutationFn: (data: UpdateStudentRequest) =>
      studentService.updateStudent(studentId, data),
    onSuccess: (updatedStudent) => {
      // Update cache
      queryClient.setQueryData(
        studentKeys.detail(updatedStudent.id),
        updatedStudent
      );

      // Invalidate lists
      queryClient.invalidateQueries({
        queryKey: studentKeys.lists(),
      });

      showSuccess('Student updated successfully');
      options?.onSuccess?.(updatedStudent);
    },
    onError: (error) => {
      showError(`Failed to update student: ${error.message}`);
    },
  });
}
```

### Delete Mutation Hook

```typescript
// src/features/students/hooks/useDeleteStudent.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { studentService } from '../api/studentService';
import { studentKeys } from '../constants/queryKeys';
import { useToast } from '@/shared/hooks/useToast';

interface UseDeleteStudentOptions {
  onSuccess?: () => void;
}

export function useDeleteStudent(
  studentId: string,
  options?: UseDeleteStudentOptions
) {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  return useMutation({
    mutationFn: () => studentService.deleteStudent(studentId),
    onSuccess: () => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: studentKeys.detail(studentId),
      });

      // Invalidate lists
      queryClient.invalidateQueries({
        queryKey: studentKeys.lists(),
      });

      showSuccess('Student deleted successfully');
      options?.onSuccess?.();
    },
    onError: (error) => {
      showError(`Failed to delete student: ${error.message}`);
    },
  });
}
```

---

## 6. Component Integration

### ✅ Correct Pattern

```typescript
// src/features/students/pages/StudentListPage.tsx

import { useStudents } from '../hooks/useStudents';
import { StudentFilters } from '../types/student.types';
import { useState } from 'react';

export function StudentListPage() {
  const [filters, setFilters] = useState<StudentFilters>({});

  const {
    data: students = [],
    isLoading,
    isError,
    error,
  } = useStudents({ filters });

  if (isLoading) return <LoadingSpinner />;

  if (isError) {
    return (
      <ErrorMessage
        message={error?.message || 'Failed to load students'}
        onRetry={() => {}}
      />
    );
  }

  return (
    <div>
      <StudentFiltersForm onFilterChange={setFilters} />
      <StudentTable
        students={students}
        onFilterChange={setFilters}
      />
    </div>
  );
}
```

### ✅ Detail Page Pattern

```typescript
// src/features/students/pages/StudentDetailPage.tsx

import { useParams } from 'react-router-dom';
import { useStudent } from '../hooks/useStudent';
import { useUpdateStudent } from '../hooks/useUpdateStudent';

export function StudentDetailPage() {
  const { studentId } = useParams<{ studentId: string }>();

  const { data: student, isLoading } = useStudent(studentId!);
  const { mutate: updateStudent, isPending } = useUpdateStudent(studentId!);

  if (isLoading) return <LoadingSpinner />;
  if (!student) return <NotFoundPage />;

  return (
    <StudentForm
      student={student}
      isLoading={isPending}
      onSubmit={updateStudent}
    />
  );
}
```

---

## 7. Mock Data Strategy

### Mock Data Structure

```typescript
// src/features/students/mocks/studentMocks.ts

import { Student, StudentFilters } from '../types/student.types';

export const mockStudents: Student[] = [
  {
    id: '1',
    firstName: 'Ahmet',
    lastName: 'Yılmaz',
    email: 'ahmet@example.com',
    enrollmentNumber: 'STU001',
    classId: 'C1',
    status: 'active',
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    firstName: 'Zeynep',
    lastName: 'Kaya',
    email: 'zeynep@example.com',
    enrollmentNumber: 'STU002',
    classId: 'C1',
    status: 'active',
    createdAt: new Date('2024-01-16'),
  },
];

export const mockGetStudents = (filters?: StudentFilters): Student[] => {
  let result = [...mockStudents];

  if (filters?.classId) {
    result = result.filter((s) => s.classId === filters.classId);
  }

  if (filters?.status) {
    result = result.filter((s) => s.status === filters.status);
  }

  if (filters?.search) {
    const query = filters.search.toLowerCase();
    result = result.filter(
      (s) =>
        s.firstName.toLowerCase().includes(query) ||
        s.lastName.toLowerCase().includes(query) ||
        s.email.toLowerCase().includes(query)
    );
  }

  return result;
};

export const mockGetStudent = (id: string): Student | undefined => {
  return mockStudents.find((s) => s.id === id);
};
```

### Mock Service Implementation

```typescript
// src/features/students/api/studentService.mock.ts

import { CreateStudentRequest, UpdateStudentRequest } from '../types/student.types';
import { mockGetStudent, mockGetStudents, mockStudents } from '../mocks/studentMocks';

// Only use in development
const USE_MOCKS = process.env.REACT_APP_USE_MOCKS === 'true';

export const studentServiceMock = {
  getStudents: async (filters?: any) => {
    await new Promise((r) => setTimeout(r, 300)); // Simulate network delay
    return mockGetStudents(filters);
  },

  getStudent: async (id: string) => {
    await new Promise((r) => setTimeout(r, 200));
    const student = mockGetStudent(id);
    if (!student) throw new Error('Student not found');
    return student;
  },

  createStudent: async (data: CreateStudentRequest) => {
    await new Promise((r) => setTimeout(r, 400));
    const newStudent = {
      ...data,
      id: Math.random().toString(),
      createdAt: new Date(),
    };
    mockStudents.push(newStudent);
    return newStudent;
  },

  updateStudent: async (id: string, data: UpdateStudentRequest) => {
    await new Promise((r) => setTimeout(r, 300));
    const student = mockGetStudent(id);
    if (!student) throw new Error('Student not found');
    Object.assign(student, data);
    return student;
  },

  deleteStudent: async (id: string) => {
    await new Promise((r) => setTimeout(r, 200));
    const index = mockStudents.findIndex((s) => s.id === id);
    if (index === -1) throw new Error('Student not found');
    mockStudents.splice(index, 1);
  },
};
```

---

## 8. HTTP Client Setup

### Axios Configuration

```typescript
// src/shared/api/httpClient.ts

import axios, { AxiosError, AxiosInstance } from 'axios';
import { useAuthStore } from '@/shared/stores/authStore';

const createHttpClient = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor
  instance.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Response interceptor
  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      if (error.response?.status === 401) {
        // Handle token refresh
        useAuthStore.getState().logout();
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

export const httpClient = createHttpClient();
```

---

## 9. Type Safety

### Complete Type Definitions

```typescript
// src/features/students/types/student.types.ts

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  enrollmentNumber: string;
  classId: string;
  status: 'active' | 'inactive' | 'graduated';
  createdAt: Date;
  updatedAt?: Date;
}

export interface CreateStudentRequest {
  firstName: string;
  lastName: string;
  email: string;
  enrollmentNumber: string;
  classId: string;
}

export interface UpdateStudentRequest
  extends Partial<CreateStudentRequest> {}

export interface StudentFilters {
  classId?: string;
  status?: Student['status'];
  search?: string;
  pageNumber?: number;
  pageSize?: number;
}
```

---

## 10. Caching Strategy

### Recommended Settings

```typescript
// Feature-specific cache configuration

// Real-time data (5 sec)
staleTime: 5 * 1000
gcTime: 30 * 1000

// Frequently updated (2 min)
staleTime: 2 * 60 * 1000
gcTime: 10 * 60 * 1000

// Stable data (5 min)
staleTime: 5 * 60 * 1000
gcTime: 30 * 60 * 1000

// Static/reference data (1 hour)
staleTime: 60 * 60 * 1000
gcTime: 24 * 60 * 60 * 1000
```

---

## 11. Error Handling

### Custom Error Hook

```typescript
// src/shared/hooks/useQueryError.ts

import { AxiosError } from 'axios';

export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}

export function useQueryError() {
  const parseError = (error: unknown): ApiError => {
    if (error instanceof AxiosError) {
      return {
        status: error.response?.status || 500,
        message:
          error.response?.data?.message ||
          error.message ||
          'An error occurred',
        errors: error.response?.data?.errors,
      };
    }

    return {
      status: 500,
      message: 'An unexpected error occurred',
    };
  };

  return { parseError };
}
```

### Error Boundary

```typescript
// src/shared/components/QueryErrorBoundary.tsx

import { useQueryErrorResetBoundary } from '@tanstack/react-query';

export function QueryErrorBoundary({ error, reset }: any) {
  return (
    <div className="error-container">
      <h2>Something went wrong</h2>
      <p>{error?.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

---

## 12. Best Practices Checklist

### Before Committing Code

- [ ] No hardcoded strings for query keys
- [ ] All services are in `/api` folder
- [ ] All hooks are in `/hooks` folder
- [ ] Query keys are in `/constants/queryKeys.ts`
- [ ] Types are properly defined
- [ ] Mocks are provided for development
- [ ] Error states are handled
- [ ] Loading states are handled
- [ ] Proper retry logic is implemented
- [ ] Cache times are reasonable
- [ ] No direct API calls in components
- [ ] All mutations invalidate relevant queries
- [ ] TypeScript types are strict

---

## 13. Module Migration Checklist

When migrating a module from static arrays to React Query:

### Step 1: Preparation
- [ ] Create module folder structure
- [ ] Define types in `types/[module].types.ts`
- [ ] Create mock data in `mocks/[module]Mocks.ts`

### Step 2: Service Layer
- [ ] Create service in `api/[module]Service.ts`
- [ ] Create query keys in `constants/queryKeys.ts`
- [ ] Test mock service

### Step 3: Hooks
- [ ] Create `useList` hook
- [ ] Create `useDetail` hook (if applicable)
- [ ] Create `useCreate` mutation hook
- [ ] Create `useUpdate` mutation hook
- [ ] Create `useDelete` mutation hook

### Step 4: Component Updates
- [ ] Remove static arrays
- [ ] Replace with hook calls
- [ ] Update state management
- [ ] Handle loading/error states
- [ ] Test with mocks

### Step 5: Quality Assurance
- [ ] Manual testing in development
- [ ] Error handling verification
- [ ] Cache invalidation testing
- [ ] Performance testing
- [ ] Type safety review

---

## 14. Common Patterns

### Dependent Queries

```typescript
export function useStudentWithClasses(studentId: string) {
  // First query
  const { data: student } = useStudent(studentId);

  // Dependent query
  const { data: classes } = useQuery({
    queryKey: classKeys.list({ studentId }),
    queryFn: () => classService.getClasses({ studentId }),
    enabled: !!student, // Only run when student exists
  });

  return { student, classes };
}
```

### Pagination

```typescript
export function useStudentsPaginated(
  pageNumber: number = 1,
  pageSize: number = 10
) {
  return useQuery({
    queryKey: studentKeys.list({ pageNumber, pageSize }),
    queryFn: () =>
      studentService.getStudents({ pageNumber, pageSize }),
    staleTime: 1000 * 60 * 2,
    keepPreviousData: true, // Important for pagination
  });
}
```

### Search/Debounce

```typescript
import { useDeferredValue } from 'react';

export function useStudentSearch(query: string) {
  const deferredQuery = useDeferredValue(query);

  return useQuery({
    queryKey: studentKeys.search(deferredQuery),
    queryFn: () => studentService.getStudents({ search: deferredQuery }),
    enabled: deferredQuery.length > 2,
    staleTime: 1000 * 60 * 5,
  });
}
```

---

## 15. Testing with React Query

### Test Setup

```typescript
// src/shared/test/setupTests.ts

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

export function TestQueryClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  const testQueryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={testQueryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

### Component Test Example

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { TestQueryClientProvider } from '@/shared/test/setupTests';
import { StudentList } from '../StudentList';

describe('StudentList', () => {
  it('should display students', async () => {
    render(
      <TestQueryClientProvider>
        <StudentList />
      </TestQueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Ahmet Yılmaz')).toBeInTheDocument();
    });
  });
});
```

---

## Summary

React Query implementation in Oksis follows:

1. **Centralized**: All data fetching through custom hooks
2. **Typed**: Full TypeScript support with strict types
3. **Cached**: Intelligent caching with appropriate stale times
4. **Testable**: Mock data and service layer for testing
5. **Scalable**: Module-based organization ready to grow
6. **Maintainable**: Clear patterns and conventions
7. **Enterprise-Grade**: Error handling, logging, retry logic

**Next Step**: Use this standard to migrate each module one by one as per your instructions.
