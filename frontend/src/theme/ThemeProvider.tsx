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
        main: '#1f2937',
      },
      secondary: {
        main: '#64748b',
      },
      background: {
        default: '#f8fafc',
        paper: '#ffffff',
      },
      text: {
        primary: '#111827',
        secondary: '#64748b',
      },
    },
    shape: {
      borderRadius: 6,
    },
    typography: {
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: '#f8fafc',
            color: '#111827',
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
            textTransform: 'none',
            borderRadius: '6px',
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
