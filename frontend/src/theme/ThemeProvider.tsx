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
        main: '#a8400f',
        light: '#d98a5f',
        dark: '#7c2f0b',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#14232b',
        light: '#4b5b63',
        dark: '#0b161c',
      },
      background: {
        default: '#f3f5f6',
        paper: '#ffffff',
      },
      text: {
        primary: '#14232b',
        secondary: '#4b5b63',
      },
      divider: 'rgba(20, 35, 43, 0.14)',
      success: { main: '#1a7f45' },
      warning: { main: '#b45309' },
      error: { main: '#b3261e' },
      info: { main: '#14232b' },
    },
    shape: {
      borderRadius: 8,
    },
    typography: {
      fontFamily: "'IBM Plex Sans', system-ui, -apple-system, sans-serif",
      h1: { fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontWeight: 700, letterSpacing: '-0.01em' },
      h2: { fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontWeight: 700, letterSpacing: '-0.01em' },
      h3: { fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontWeight: 600 },
      h4: { fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontWeight: 600 },
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
            backgroundColor: '#f3f5f6',
            backgroundImage: 'none',
            color: '#14232b',
          },
          '*': {
            boxSizing: 'border-box',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            color: '#14232b',
            backgroundColor: '#ffffff',
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            color: '#14232b',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: '8px',
            fontWeight: 600,
            letterSpacing: '0.01em',
            boxShadow: 'none',
          },
          contained: {
            backgroundColor: '#a8400f',
            color: '#ffffff',
            '&:hover': {
              backgroundColor: '#7c2f0b',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: '0 1px 2px rgba(20, 35, 43, 0.08)',
            border: '1px solid rgba(20, 35, 43, 0.12)',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: '0 1px 0 rgba(20, 35, 43, 0.12)',
            backgroundImage: 'none',
            backgroundColor: '#ffffff',
            color: '#14232b',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: '#ffffff',
            color: '#14232b',
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
