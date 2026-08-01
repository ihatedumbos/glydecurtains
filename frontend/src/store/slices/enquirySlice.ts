import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Enquiry {
  id: number;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
}

export interface EnquiryFilters {
  status?: string;
  searchTerm?: string;
}

export interface EnquiryState {
  list: Enquiry[];
  currentEnquiry: Enquiry | null;
  filters: EnquiryFilters;
  pagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
  loading: boolean;
  error: string | null;
}

const initialState: EnquiryState = {
  list: [],
  currentEnquiry: null,
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

const enquirySlice = createSlice({
  name: 'enquiries',
  initialState,
  reducers: {
    setEnquiries(state, action: PayloadAction<{ content: Enquiry[]; totalElements: number; totalPages: number; page: number }>) {
      state.list = action.payload.content;
      state.pagination.totalElements = action.payload.totalElements;
      state.pagination.totalPages = action.payload.totalPages;
      state.pagination.page = action.payload.page;
    },
    setCurrentEnquiry(state, action: PayloadAction<Enquiry | null>) {
      state.currentEnquiry = action.payload;
    },
    setEnquiryFilters(state, action: PayloadAction<EnquiryFilters>) {
      state.filters = action.payload;
    },
    setEnquiryLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setEnquiryError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
});

export const { setEnquiries, setCurrentEnquiry, setEnquiryFilters, setEnquiryLoading, setEnquiryError } = enquirySlice.actions;
export default enquirySlice.reducer;
