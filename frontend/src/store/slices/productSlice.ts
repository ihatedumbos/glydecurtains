import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Product {
  id: number;
  name: string;
  sku: string;
  shortDescription?: string;
  basePrice: number;
  offerPrice?: number;
  discountPercentage?: number;
  thumbnailUrl?: string;
  categoryId?: number;
  status: string;
  isFeatured?: boolean;
  isTrending?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  isPremium?: boolean;
  stockQuantity: number;
}

export interface ProductFilters {
  categoryId?: number;
  subCategoryId?: number;
  collectionId?: number;
  minPrice?: number;
  maxPrice?: number;
  colors?: string[];
  sizes?: string[];
  materials?: string[];
  status?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface ProductState {
  list: Product[];
  currentProduct: Product | null;
  filters: ProductFilters;
  pagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
  loading: boolean;
  error: string | null;
}

const initialState: ProductState = {
  list: [],
  currentProduct: null,
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

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setProducts(state, action: PayloadAction<{ content: Product[]; totalElements: number; totalPages: number; page: number }>) {
      state.list = action.payload.content;
      state.pagination.totalElements = action.payload.totalElements;
      state.pagination.totalPages = action.payload.totalPages;
      state.pagination.page = action.payload.page;
    },
    setCurrentProduct(state, action: PayloadAction<Product | null>) {
      state.currentProduct = action.payload;
    },
    setFilters(state, action: PayloadAction<ProductFilters>) {
      state.filters = action.payload;
    },
    setProductLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setProductError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
});

export const { setProducts, setCurrentProduct, setFilters, setProductLoading, setProductError } = productSlice.actions;
export default productSlice.reducer;
