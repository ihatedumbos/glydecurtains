import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '@/api/axiosInstance';

// ─── Types ──────────────────────────────────────────────────────────────────

export type AdjustmentType = 'ADD' | 'REMOVE' | 'SET';

export interface StockAdjustment {
  id: number;
  productId: number;
  productName?: string;
  adjustmentType: AdjustmentType;
  quantity: number;
  resultingStock: number;
  reason: string;
  performedBy: number;
  performedByName?: string;
  createdAt: string;
}

export interface StockAdjustmentRequest {
  productId: number;
  adjustmentType: AdjustmentType;
  quantity: number;
  reason: string;
}

export interface ThresholdUpdateRequest {
  lowStockThreshold: number;
}

export interface BulkAdjustResult {
  totalProcessed: number;
  successful: number;
  failed: number;
  errors?: Array<{ row: number; message: string }>;
}

export interface InventoryState {
  adjustmentHistory: StockAdjustment[];
  pagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
  isLoading: boolean;
  error: string | null;
  bulkResults: BulkAdjustResult | null;
}

// ─── Async Thunks ───────────────────────────────────────────────────────────

export const adjustStock = createAsyncThunk(
  'inventory/adjustStock',
  async (request: StockAdjustmentRequest, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/inventory/adjust', request);
      return response.data.data ?? response.data;
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        return rejectWithValue(axiosErr.response?.data?.message || 'Failed to adjust stock');
      }
      return rejectWithValue('Failed to adjust stock');
    }
  },
);

export const fetchAdjustmentHistory = createAsyncThunk(
  'inventory/fetchAdjustmentHistory',
  async (
    { productId, page = 0, size = 10 }: { productId: number; page?: number; size?: number },
    { rejectWithValue },
  ) => {
    try {
      const response = await axiosInstance.get(`/inventory/history/${productId}`, {
        params: { page, size },
      });
      return response.data.data ?? response.data;
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        return rejectWithValue(axiosErr.response?.data?.message || 'Failed to fetch history');
      }
      return rejectWithValue('Failed to fetch history');
    }
  },
);

export const updateThreshold = createAsyncThunk(
  'inventory/updateThreshold',
  async (
    { productId, threshold }: { productId: number; threshold: number },
    { rejectWithValue },
  ) => {
    try {
      const response = await axiosInstance.put(`/inventory/threshold/${productId}`, {
        lowStockThreshold: threshold,
      } as ThresholdUpdateRequest);
      return response.data.data ?? response.data;
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        return rejectWithValue(axiosErr.response?.data?.message || 'Failed to update threshold');
      }
      return rejectWithValue('Failed to update threshold');
    }
  },
);

export const bulkAdjustStock = createAsyncThunk(
  'inventory/bulkAdjustStock',
  async (adjustments: StockAdjustmentRequest[], { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/inventory/bulk-adjust', adjustments);
      return response.data.data ?? response.data;
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        return rejectWithValue(axiosErr.response?.data?.message || 'Bulk adjustment failed');
      }
      return rejectWithValue('Bulk adjustment failed');
    }
  },
);

export const bulkAdjustFromCsv = createAsyncThunk(
  'inventory/bulkAdjustFromCsv',
  async (file: File, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await axiosInstance.post('/inventory/bulk-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.data ?? response.data;
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        return rejectWithValue(axiosErr.response?.data?.message || 'CSV upload failed');
      }
      return rejectWithValue('CSV upload failed');
    }
  },
);

// ─── Slice ──────────────────────────────────────────────────────────────────

const initialState: InventoryState = {
  adjustmentHistory: [],
  pagination: {
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0,
  },
  isLoading: false,
  error: null,
  bulkResults: null,
};

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    clearBulkResults(state) {
      state.bulkResults = null;
    },
  },
  extraReducers: (builder) => {
    // adjustStock
    builder
      .addCase(adjustStock.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(adjustStock.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(adjustStock.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // fetchAdjustmentHistory
    builder
      .addCase(fetchAdjustmentHistory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAdjustmentHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        const data = action.payload;
        state.adjustmentHistory = data.content ?? data;
        if (data.totalElements !== undefined) {
          state.pagination.totalElements = data.totalElements;
          state.pagination.totalPages = data.totalPages;
          state.pagination.page = data.number ?? data.page ?? 0;
        }
      })
      .addCase(fetchAdjustmentHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // updateThreshold
    builder
      .addCase(updateThreshold.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateThreshold.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(updateThreshold.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // bulkAdjustStock
    builder
      .addCase(bulkAdjustStock.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.bulkResults = null;
      })
      .addCase(bulkAdjustStock.fulfilled, (state, action) => {
        state.isLoading = false;
        state.bulkResults = action.payload;
      })
      .addCase(bulkAdjustStock.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // bulkAdjustFromCsv
    builder
      .addCase(bulkAdjustFromCsv.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.bulkResults = null;
      })
      .addCase(bulkAdjustFromCsv.fulfilled, (state, action) => {
        state.isLoading = false;
        state.bulkResults = action.payload;
      })
      .addCase(bulkAdjustFromCsv.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearBulkResults } = inventorySlice.actions;
export default inventorySlice.reducer;
