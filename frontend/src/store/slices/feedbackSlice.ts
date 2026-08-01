import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Feedback {
  id: number;
  userId: number;
  userName: string;
  productId?: number;
  productName?: string;
  rating: number;
  title: string;
  comment: string;
  status: string;
  adminReply?: string;
  createdAt: string;
}

export interface FeedbackFilters {
  status?: string;
  productId?: number;
  rating?: number;
}

export interface FeedbackState {
  list: Feedback[];
  productFeedback: Feedback[];
  filters: FeedbackFilters;
  pagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
  loading: boolean;
  error: string | null;
}

const initialState: FeedbackState = {
  list: [],
  productFeedback: [],
  filters: {},
  pagination: {
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0,
  },
  loading: false,
  error: null,
};

const feedbackSlice = createSlice({
  name: 'feedback',
  initialState,
  reducers: {
    setFeedbackList(state, action: PayloadAction<{ content: Feedback[]; totalElements: number; totalPages: number; page: number }>) {
      state.list = action.payload.content;
      state.pagination.totalElements = action.payload.totalElements;
      state.pagination.totalPages = action.payload.totalPages;
      state.pagination.page = action.payload.page;
    },
    setProductFeedback(state, action: PayloadAction<Feedback[]>) {
      state.productFeedback = action.payload;
    },
    setFeedbackFilters(state, action: PayloadAction<FeedbackFilters>) {
      state.filters = action.payload;
    },
    setFeedbackLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setFeedbackError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
});

export const { setFeedbackList, setProductFeedback, setFeedbackFilters, setFeedbackLoading, setFeedbackError } = feedbackSlice.actions;
export default feedbackSlice.reducer;
