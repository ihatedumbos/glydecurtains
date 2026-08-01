import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Achievement {
  id: number;
  title: string;
  description?: string;
  iconBase64?: string;
  year?: number;
  metricValue: string;
  metricFormat: string;
  sortOrder: number;
  isEnabled: boolean;
}

export interface AchievementState {
  list: Achievement[];
  loading: boolean;
  error: string | null;
}

const initialState: AchievementState = {
  list: [],
  loading: false,
  error: null,
};

const achievementSlice = createSlice({
  name: 'achievements',
  initialState,
  reducers: {
    setAchievements(state, action: PayloadAction<Achievement[]>) {
      state.list = action.payload;
    },
    setAchievementLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setAchievementError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
});

export const { setAchievements, setAchievementLoading, setAchievementError } = achievementSlice.actions;
export default achievementSlice.reducer;
