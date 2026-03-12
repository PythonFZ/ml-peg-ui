'use client';

import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import GitHubIcon from '@mui/icons-material/GitHub';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useColorScheme } from '@mui/material/styles';
import Button from '@mui/material/Button';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useRouter } from 'next/navigation';
import { useCategories, useModels } from '@/lib/api';
import { useFilterContext } from '@/lib/filter-context';
import { TutorialModal, useTutorialModal } from '@/components/TutorialModal';

interface BenchmarkOption {
  label: string;
  href: string;
}

export function AppHeader() {
  const { mode, setMode } = useColorScheme();
  const router = useRouter();
  const { open: tutorialOpen, dismiss: dismissTutorial, reopen: reopenTutorial } = useTutorialModal();
  const { categories } = useCategories();
  const { models } = useModels();
  const { selectedModels, setSelectedModels } = useFilterContext();

  const handleThemeToggle = () => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  };

  // On first render mode can be undefined — don't show toggle until hydrated
  const isDark = mode === 'dark';
  const mounted = mode !== undefined;

  // Build model display names for autocomplete options
  const modelOptions: string[] = models.length > 0
    ? models.map((m) => m.display_name)
    : [];

  // Build benchmark options from categories
  const benchmarkOptions: BenchmarkOption[] = categories.flatMap((cat) =>
    cat.benchmarks.map((b) => ({
      label: b.name,
      href: `/${cat.slug}/${b.slug}`,
    }))
  );

  return (
    <AppBar position="sticky" color="default" elevation={1}>
      <Toolbar sx={{ gap: 1 }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 700, flexGrow: 1 }}>
          ML-PEG
        </Typography>

        {/* Model filter — persists across navigation */}
        <Autocomplete<string, true>
          multiple
          size="small"
          limitTags={3}
          options={modelOptions}
          value={selectedModels}
          onChange={(_event, newValue) => setSelectedModels(newValue)}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                {...getTagProps({ index })}
                key={option}
                label={option}
                size="small"
              />
            ))
          }
          getLimitTagsText={(more) => (
            <Tooltip title={selectedModels.slice(3).join(', ')} arrow>
              <Chip label={`+${more}`} size="small" />
            </Tooltip>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder={selectedModels.length === 0 ? 'Filter models...' : undefined}
              size="small"
            />
          )}
          sx={{ minWidth: 200, maxWidth: 350 }}
          disablePortal
        />

        {/* Benchmark quick-search — ephemeral navigation */}
        <Autocomplete<BenchmarkOption>
          size="small"
          options={benchmarkOptions}
          getOptionLabel={(opt) => opt.label}
          value={null}
          onChange={(_event, option) => {
            if (option) {
              router.push(option.href);
            }
          }}
          blurOnSelect
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Go to benchmark..."
              size="small"
            />
          )}
          sx={{ minWidth: 180, maxWidth: 280 }}
          disablePortal
          isOptionEqualToValue={(option, value) => option.href === value.href}
        />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Button
            onClick={reopenTutorial}
            size="small"
            color="inherit"
            startIcon={<HelpOutlineIcon />}
            sx={{ textTransform: 'none', fontWeight: 400 }}
          >
            Tutorial
          </Button>
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
          {mounted && (
            <IconButton
              onClick={handleThemeToggle}
              aria-label="toggle dark/light mode"
              color="inherit"
              size="small"
            >
              {isDark ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          )}
        </Box>
      </Toolbar>
      <TutorialModal open={tutorialOpen} onClose={dismissTutorial} />
    </AppBar>
  );
}
