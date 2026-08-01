import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface StoreLocation {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  operatingHours?: Record<string, string>;
  imageBase64?: string;
  isActive: boolean;
}

export interface StoreLocatorState {
  stores: StoreLocation[];
  searchResults: StoreLocation[];
  pagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
  loading: boolean;
  error: string | null;
}

const initialState: StoreLocatorState = {
  stores: [],
  searchResults: [],
  pagination: {
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0,
  },
  loading: false,
  error: null,
};

const storeLocatorSlice = createSlice({
  name: 'storeLocator',
  initialState,
  reducers: {
    setStores(state, action: PayloadAction<{ content: StoreLocation[]; totalElements: number; totalPages: number; page: number }>) {
      state.stores = action.payload.content;
      state.pagination.totalElements = action.payload.totalElements;
      state.pagination.totalPages = action.payload.totalPages;
      state.pagination.page = action.payload.page;
    },
    setSearchResults(state, action: PayloadAction<StoreLocation[]>) {
      state.searchResults = action.payload;
    },
    setStoreLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setStoreError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
});

export const { setStores, setSearchResults, setStoreLoading, setStoreError } = storeLocatorSlice.actions;
export default storeLocatorSlice.reducer;
