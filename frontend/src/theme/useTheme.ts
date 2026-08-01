import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/store';
import { setTheme, toggleMode, setMode, setThemeConfig } from '@/store/slices/themeSlice';
import { ThemeConfig, ThemeMode } from './types';
import { themePresets } from './themePresets';

export function useTheme() {
  const dispatch = useDispatch();
  const themeState = useSelector((state: RootState) => state.theme);

  const changeTheme = useCallback(
    (themeId: string) => {
      dispatch(setTheme(themeId));
    },
    [dispatch]
  );

  const toggle = useCallback(() => {
    dispatch(toggleMode());
  }, [dispatch]);

  const changeMode = useCallback(
    (mode: ThemeMode) => {
      dispatch(setMode(mode));
    },
    [dispatch]
  );

  const updateConfig = useCallback(
    (partial: Partial<ThemeConfig>) => {
      dispatch(setThemeConfig(partial));
    },
    [dispatch]
  );

  return {
    activeThemeId: themeState.activeThemeId,
    mode: themeState.mode,
    config: themeState.config,
    isDark: themeState.mode === 'dark',
    presets: themePresets,
    changeTheme,
    toggleMode: toggle,
    changeMode,
    updateConfig,
  };
}
