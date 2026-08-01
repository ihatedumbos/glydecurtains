import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Employee {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  departmentId?: number;
  departmentName?: string;
  hireDate?: string;
}

export interface Department {
  id: number;
  name: string;
  description?: string;
}

export interface EmployeeFilters {
  name?: string;
  departmentId?: number;
  status?: string;
}

export interface EmployeeState {
  list: Employee[];
  departments: Department[];
  filters: EmployeeFilters;
  pagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
  loading: boolean;
  error: string | null;
}

const initialState: EmployeeState = {
  list: [],
  departments: [],
  filters: {},
  pagination: {
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0,
  },
  loading: false,
  error: null,
};

const employeeSlice = createSlice({
  name: 'employees',
  initialState,
  reducers: {
    setEmployees(state, action: PayloadAction<{ content: Employee[]; totalElements: number; totalPages: number; page: number }>) {
      state.list = action.payload.content;
      state.pagination.totalElements = action.payload.totalElements;
      state.pagination.totalPages = action.payload.totalPages;
      state.pagination.page = action.payload.page;
    },
    setDepartments(state, action: PayloadAction<Department[]>) {
      state.departments = action.payload;
    },
    setEmployeeFilters(state, action: PayloadAction<EmployeeFilters>) {
      state.filters = action.payload;
    },
    setEmployeeLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setEmployeeError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
});

export const { setEmployees, setDepartments, setEmployeeFilters, setEmployeeLoading, setEmployeeError } = employeeSlice.actions;
export default employeeSlice.reducer;
