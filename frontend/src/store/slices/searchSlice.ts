import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface SearchState {
  query: string;
  suggestions: string[];
  recentSearches: string[];
  loading: boolean;
  error: string | null;
}

const initialState: SearchState = {
  query: '',
  suggestions: [],
  recentSearches: [],
  loading: false,
  error: null,
};

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setQuery(state, action: PayloadAction<string>) {
      state.query = action.payload;
    },
    setSuggestions(state, action: PayloadAction<string[]>) {
      state.suggestions = action.payload;
    },
    setRecentSearches(state, action: PayloadAction<string[]>) {
      state.recentSearches = action.payload;
    },
    clearSuggestions(state) {
      state.suggestions = [];
    },
    setSearchLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setSearchError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
});

export const { setQuery, setSuggestions, setRecentSearches, clearSuggestions, setSearchLoading, setSearchError } = searchSlice.actions;
export default searchSlice.reducer;
