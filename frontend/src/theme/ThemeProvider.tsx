import React, { useMemo } from 'react';
import {
  ThemeProvider as MuiThemeProvider,
  createTheme,
  CssBaseline,
} from '@mui/material';
function buildMuiTheme() {
  return createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: '#111827',
        light: '#374151',
        dark: '#030712',
      },
      secondary: {
        main: '#f59e0b',
        light: '#fef3c7',
        dark: '#b45309',
      },
      background: {
        default: '#f6f7f8',
        paper: '#ffffff',
      },
      text: {
        primary: '#111827',
        secondary: '#4b5563',
      },
      divider: '#e5e7eb',
      success: { main: '#16a34a' },
      warning: { main: '#f59e0b' },
      error: { main: '#dc2626' },
    },
    shape: {
      borderRadius: 12,
    },
    typography: {
      fontFamily: "'Inter', 'SF Pro Display', system-ui, -apple-system, sans-serif",
      h1: { fontWeight: 700 },
      h2: { fontWeight: 700 },
      h3: { fontWeight: 700 },
      h4: { fontWeight: 700 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: {
            scrollBehavior: 'smooth',
          },
          body: {
            background: 'linear-gradient(180deg, #f8f8f7 0%, #f3f4f6 100%)',
            color: '#111827',
          },
          '*': {
            boxSizing: 'border-box',
          },
          a: {
            color: 'inherit',
            textDecoration: 'none',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: '12px',
            fontWeight: 600,
            letterSpacing: '0.01em',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
            border: '1px solid rgba(148, 163, 184, 0.18)',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.04)',
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
  const muiTheme = useMemo(() => buildMuiTheme(), []);

  return (
    <MuiThemeProvider theme={muiTheme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}
