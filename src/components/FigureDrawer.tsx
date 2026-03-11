'use client';

import dynamic from 'next/dynamic';
import { Box, Drawer, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useColorScheme } from '@mui/material/styles';
import { useBenchmarkFigures, useFigureData } from '@/lib/api';
import FigureSkeleton from './FigureSkeleton';
import type { FigureItem } from '@/lib/types';

// PlotlyChart is ONLY imported here via dynamic — never directly.
const PlotlyChart = dynamic(() => import('./PlotlyChart'), { ssr: false });

interface FigureDrawerProps {
  open: boolean;
  onClose: () => void;
  benchmarkSlug: string | null;
  benchmarkName: string;
  modelName: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getPlotlyThemeOverrides(mode: string | undefined): Record<string, any> {
  const isDark = mode === 'dark';
  return {
    paper_bgcolor: isDark ? '#121212' : '#ffffff',
    plot_bgcolor: isDark ? '#1e1e1e' : '#fafafa',
    font: { color: isDark ? '#e0e0e0' : '#212121' },
    xaxis: { gridcolor: isDark ? '#333' : '#e0e0e0' },
    yaxis: { gridcolor: isDark ? '#333' : '#e0e0e0' },
  };
}

interface FigurePanelProps {
  benchmarkSlug: string;
  figure: FigureItem;
}

function FigurePanel({ benchmarkSlug, figure }: FigurePanelProps) {
  const { figureData, isLoading, error } = useFigureData(benchmarkSlug, figure.slug);
  const { mode } = useColorScheme();

  if (isLoading) {
    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          {figure.name}
        </Typography>
        <FigureSkeleton />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          {figure.name}
        </Typography>
        <Typography color="error" variant="body2">
          Failed to load figure. Please try again.
        </Typography>
      </Box>
    );
  }

  if (!figureData) {
    return null;
  }

  const themeOverrides = getPlotlyThemeOverrides(mode);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawLayout = (figureData as any).layout ?? {};
  const mergedLayout = {
    ...rawLayout,
    ...themeOverrides,
    xaxis: { ...rawLayout.xaxis, ...themeOverrides.xaxis },
    yaxis: { ...rawLayout.yaxis, ...themeOverrides.yaxis },
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
        {figure.name}
      </Typography>
      <PlotlyChart
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data={(figureData as any).data ?? []}
        layout={mergedLayout}
      />
    </Box>
  );
}

export default function FigureDrawer({
  open,
  onClose,
  benchmarkSlug,
  benchmarkName,
  modelName,
}: FigureDrawerProps) {
  const { figures, isLoading, error } = useBenchmarkFigures(open ? benchmarkSlug : null);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', md: '50vw' } } }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
          borderBottom: 1,
          borderColor: 'divider',
          flexShrink: 0,
        }}
      >
        <Box>
          <Typography variant="subtitle1" fontWeight={700} component="div">
            {benchmarkName}
          </Typography>
          <Typography variant="body2" color="text.secondary" component="div">
            {modelName}
          </Typography>
        </Box>
        <IconButton onClick={onClose} aria-label="close drawer" size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Body */}
      <Box sx={{ overflowY: 'auto', flex: 1, px: 2, py: 2 }}>
        {isLoading && (
          <>
            <FigureSkeleton />
            <Box sx={{ mt: 3 }}>
              <FigureSkeleton />
            </Box>
          </>
        )}

        {error && (
          <Typography color="error" variant="body2">
            Failed to load figures. Please check your connection and try again.
          </Typography>
        )}

        {!isLoading && !error && figures.length === 0 && (
          <Typography color="text.secondary" variant="body2">
            No figures available for this benchmark.
          </Typography>
        )}

        {!isLoading && !error && figures.length > 0 && benchmarkSlug && (
          <>
            {figures.map((figure) => (
              <FigurePanel
                key={figure.slug}
                benchmarkSlug={benchmarkSlug}
                figure={figure}
              />
            ))}
          </>
        )}
      </Box>
    </Drawer>
  );
}
