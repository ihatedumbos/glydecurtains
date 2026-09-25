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
        main: '#c27d56',
        light: '#d4a489',
        dark: '#925e41',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#2f3e46',
        light: '#6d787e',
        dark: '#232f35',
      },
      background: {
        default: '#ffffff',
        paper: '#ffffff',
      },
      text: {
        primary: '#2f3e46',
        secondary: '#5c6b73',
      },
      divider: 'rgba(47, 62, 70, 0.14)',
      success: { main: '#2e7d32' },
      warning: { main: '#c27d56' },
      error: { main: '#b3261e' },
      info: { main: '#2f3e46' },
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
            backgroundColor: '#ffffff',
            backgroundImage: 'none',
            color: '#2f3e46',
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
            color: '#2f3e46',
            backgroundColor: '#ffffff',
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            color: '#2f3e46',
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
            backgroundColor: '#c27d56',
            color: '#ffffff',
            '&:hover': {
              backgroundColor: '#925e41',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: '0 1px 2px rgba(47, 62, 70, 0.08)',
            border: '1px solid rgba(47, 62, 70, 0.12)',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: '0 1px 0 rgba(47, 62, 70, 0.12)',
            backgroundImage: 'none',
            backgroundColor: '#ffffff',
            color: '#2f3e46',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: '#ffffff',
            color: '#2f3e46',
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
