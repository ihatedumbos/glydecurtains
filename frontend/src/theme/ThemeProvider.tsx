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
        main: '#a06b3a',
        light: '#c99a5f',
        dark: '#7a4f28',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#6b5544',
        light: '#8a6d5a',
        dark: '#4a3a2e',
      },
      background: {
        default: '#f4ede1',
        paper: '#faf5ea',
      },
      text: {
        primary: '#2c2c2c',
        secondary: '#6b5d52',
      },
      divider: 'rgba(44, 44, 44, 0.14)',
      success: { main: '#3a6b3f' },
      warning: { main: '#b5895a' },
      error: { main: '#a13a2e' },
      info: { main: '#6b5544' },
    },
    shape: {
      borderRadius: 10,
    },
    typography: {
      fontFamily: "'IBM Plex Sans', system-ui, -apple-system, sans-serif",
      h1: { fontFamily: "'Lora', Georgia, serif", fontWeight: 600, letterSpacing: '-0.01em' },
      h2: { fontFamily: "'Lora', Georgia, serif", fontWeight: 600, letterSpacing: '-0.01em' },
      h3: { fontFamily: "'Lora', Georgia, serif", fontWeight: 600 },
      h4: { fontFamily: "'Lora', Georgia, serif", fontWeight: 600 },
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
            backgroundColor: '#f4ede1',
            backgroundImage:
              "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='0 0 0 0 0.17  0 0 0 0 0.17  0 0 0 0 0.17  0 0 0 0.03 0'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)'/%3E%3C/svg%3E\")",
            color: '#2c2c2c',
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
            color: '#2c2c2c',
            backgroundColor: '#faf5ea',
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            color: '#2c2c2c',
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
            backgroundColor: '#a06b3a',
            color: '#ffffff',
            '&:hover': {
              backgroundColor: '#7a4f28',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: '0 1px 2px rgba(44, 34, 24, 0.08)',
            border: '1px solid rgba(44, 34, 24, 0.12)',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: '0 1px 0 rgba(44, 34, 24, 0.12)',
            backgroundImage: 'none',
            backgroundColor: '#faf5ea',
            color: '#2c2c2c',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: '#faf5ea',
            color: '#2c2c2c',
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
