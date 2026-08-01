import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ThemeConfig, ThemeMode } from '@/theme/types';
import { DEFAULT_THEME_ID, getThemePresetById } from '@/theme/themePresets';

const STORAGE_KEY = 'glyde-theme-preference';

export interface ThemeState {
  activeThemeId: string;
  mode: ThemeMode;
  config: ThemeConfig;
}

function loadFromStorage(): Partial<ThemeState> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return {};
}

function saveToStorage(state: ThemeState): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        activeThemeId: state.activeThemeId,
        mode: state.mode,
      })
    );
  } catch {
    // Ignore storage errors
  }
}

function getInitialState(): ThemeState {
  const stored = loadFromStorage();
  const themeId = stored.activeThemeId || DEFAULT_THEME_ID;
  const preset = getThemePresetById(themeId) || getThemePresetById(DEFAULT_THEME_ID)!;

  return {
    activeThemeId: preset.id,
    mode: stored.mode || preset.mode,
    config: preset.config,
  };
}

const themeSlice = createSlice({
  name: 'theme',
  initialState: getInitialState(),
  reducers: {
    setTheme(state, action: PayloadAction<string>) {
      const preset = getThemePresetById(action.payload);
      if (preset) {
        state.activeThemeId = preset.id;
        state.mode = preset.mode;
        state.config = preset.config;
        saveToStorage(state);
      }
    },
    toggleMode(state) {
      state.mode = state.mode === 'dark' ? 'light' : 'dark';
      saveToStorage(state);
    },
    setMode(state, action: PayloadAction<ThemeMode>) {
      state.mode = action.payload;
      saveToStorage(state);
    },
    setThemeConfig(state, action: PayloadAction<Partial<ThemeConfig>>) {
      state.config = { ...state.config, ...action.payload };
      saveToStorage(state);
    },
  },
});

export const { setTheme, toggleMode, setMode, setThemeConfig } = themeSlice.actions;
export default themeSlice.reducer;
