import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Order {
  id: number;
  orderNumber: string;
  status: string;
  grandTotal: number;
  createdAt: string;
  itemCount: number;
}

export interface OrderFilters {
  status?: string;
  startDate?: string;
  endDate?: string;
  customerId?: number;
}

export interface OrderState {
  list: Order[];
  currentOrder: Order | null;
  filters: OrderFilters;
  pagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
  loading: boolean;
  error: string | null;
}

const initialState: OrderState = {
  list: [],
  currentOrder: null,
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

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setOrders(state, action: PayloadAction<{ content: Order[]; totalElements: number; totalPages: number; page: number }>) {
      state.list = action.payload.content;
      state.pagination.totalElements = action.payload.totalElements;
      state.pagination.totalPages = action.payload.totalPages;
      state.pagination.page = action.payload.page;
    },
    setCurrentOrder(state, action: PayloadAction<Order | null>) {
      state.currentOrder = action.payload;
    },
    setOrderFilters(state, action: PayloadAction<OrderFilters>) {
      state.filters = action.payload;
    },
    setOrderLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setOrderError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
});

export const { setOrders, setCurrentOrder, setOrderFilters, setOrderLoading, setOrderError } = orderSlice.actions;
export default orderSlice.reducer;
