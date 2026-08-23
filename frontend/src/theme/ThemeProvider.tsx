import React, { useEffect, useMemo } from 'react';
import {
  ThemeProvider as MuiThemeProvider,
  createTheme,
  CssBaseline,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { ThemeConfig, ThemeMode } from './types';
import { setThemeConfig } from '@/store/slices/themeSlice';
import axiosInstance from '@/api/axiosInstance';

function getShadow(intensity: ThemeConfig['shadowIntensity']): string {
  switch (intensity) {
    case 'low':
      return '0 1px 3px rgba(0,0,0,0.08)';
    case 'high':
      return '0 8px 32px rgba(0,0,0,0.3)';
    case 'medium':
    default:
      return '0 4px 16px rgba(0,0,0,0.15)';
  }
}

function getAnimationDuration(speed: ThemeConfig['animationSpeed']): string {
  switch (speed) {
    case 'slow':
      return '0.5s';
    case 'fast':
      return '0.15s';
    case 'normal':
    default:
      return '0.3s';
  }
}

function injectCssVariables(config: ThemeConfig, mode: ThemeMode): void {
  const root = document.documentElement;
  root.style.setProperty('--primary-color', config.primaryColor);
  root.style.setProperty('--secondary-color', config.secondaryColor);
  root.style.setProperty('--accent-color', config.accentColor);
  root.style.setProperty('--background-color', config.backgroundColor);
  root.style.setProperty('--text-color', config.textColor);
  root.style.setProperty('--border-radius', config.borderRadius);
  root.style.setProperty('--shadow-intensity', config.shadowIntensity);
  root.style.setProperty('--shadow', getShadow(config.shadowIntensity));
  root.style.setProperty(
    '--glassmorphism-opacity',
    String(config.glassmorphismOpacity)
  );
  root.style.setProperty('--animation-speed', config.animationSpeed);
  root.style.setProperty(
    '--animation-duration',
    getAnimationDuration(config.animationSpeed)
  );
  root.setAttribute('data-theme-mode', mode);
}

function buildMuiTheme(config: ThemeConfig, mode: ThemeMode) {
  const borderRadiusNum = parseInt(config.borderRadius, 10) || 8;

  return createTheme({
    palette: {
      mode,
      primary: {
        main: config.accentColor,
      },
      secondary: {
        main: config.secondaryColor,
      },
      background: {
        default: config.backgroundColor,
        paper: config.primaryColor,
      },
      text: {
        primary: config.textColor,
        secondary:
          mode === 'dark'
            ? 'rgba(255,255,255,0.7)'
            : 'rgba(0,0,0,0.6)',
      },
    },
    shape: {
      borderRadius: borderRadiusNum,
    },
    typography: {
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: config.backgroundColor,
            color: config.textColor,
            transition: `background-color var(--animation-duration) ease, color var(--animation-duration) ease`,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            transition: `background-color var(--animation-duration) ease, box-shadow var(--animation-duration) ease`,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: `${borderRadiusNum}px`,
            transition: `all var(--animation-duration) ease`,
          },
        },
      },
    },
  });
}

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const dispatch = useDispatch();
  const { config, mode } = useSelector((state: RootState) => state.theme);

  useEffect(() => {
    axiosInstance.get('/cms/themes')
      .then((response) => {
        const storedConfig = response.data?.data?.config;
        if (typeof storedConfig === 'string') {
          dispatch(setThemeConfig(JSON.parse(storedConfig)));
        }
      })
      .catch(() => {
        // Retain the local preset while the backend is unavailable.
      });
  }, [dispatch]);

  useEffect(() => {
    injectCssVariables(config, mode);
  }, [config, mode]);

  const muiTheme = useMemo(() => buildMuiTheme(config, mode), [config, mode]);

  return (
    <MuiThemeProvider theme={muiTheme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}
