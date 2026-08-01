import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface DashboardSummary {
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
  totalEmployees: number;
  pendingApprovals: number;
  lowStockCount: number;
  revenue: number;
  totalEnquiries: number;
}

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface DashboardState {
  summary: DashboardSummary | null;
  recentActivity: unknown[];
  orderTrends: ChartDataPoint[];
  revenueTrends: ChartDataPoint[];
  userTrends: ChartDataPoint[];
  loading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  summary: null,
  recentActivity: [],
  orderTrends: [],
  revenueTrends: [],
  userTrends: [],
  loading: false,
  error: null,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setSummary(state, action: PayloadAction<DashboardSummary>) {
      state.summary = action.payload;
    },
    setRecentActivity(state, action: PayloadAction<unknown[]>) {
      state.recentActivity = action.payload;
    },
    setOrderTrends(state, action: PayloadAction<ChartDataPoint[]>) {
      state.orderTrends = action.payload;
    },
    setRevenueTrends(state, action: PayloadAction<ChartDataPoint[]>) {
      state.revenueTrends = action.payload;
    },
    setUserTrends(state, action: PayloadAction<ChartDataPoint[]>) {
      state.userTrends = action.payload;
    },
    setDashboardLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setDashboardError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
});

export const { setSummary, setRecentActivity, setOrderTrends, setRevenueTrends, setUserTrends, setDashboardLoading, setDashboardError } = dashboardSlice.actions;
export default dashboardSlice.reducer;
