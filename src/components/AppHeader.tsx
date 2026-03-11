'use client';

import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import GitHubIcon from '@mui/icons-material/GitHub';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useColorScheme } from '@mui/material/styles';

export function AppHeader() {
  const { mode, setMode } = useColorScheme();

  const handleThemeToggle = () => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  };

  // Default to light icon on server (mode === undefined)
  const isDark = mode === 'dark';

  return (
    <AppBar position="sticky" color="default" elevation={1}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ fontWeight: 700, flexGrow: 1 }}>
          ML-PEG
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <IconButton
            component="a"
            href="https://github.com/ddmms/ml-peg"
            target="_blank"
            rel="noopener"
            aria-label="GitHub repository"
            color="inherit"
            size="small"
          >
            <GitHubIcon />
          </IconButton>
          <IconButton
            onClick={handleThemeToggle}
            aria-label="toggle dark/light mode"
            color="inherit"
            size="small"
          >
            {isDark ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
