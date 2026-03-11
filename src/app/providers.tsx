'use client';

import { extendTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import React from 'react';

const theme = extendTheme({
  colorSchemes: {
    light: {},
    dark: {},
  },
  colorSchemeSelector: 'data-color-scheme',
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
