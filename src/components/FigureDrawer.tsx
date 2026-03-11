'use client';

import { useEffect } from 'react';
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
  filterModel: string | null; // null = show all models, string = show only this model
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
  filterModel: string | null;
}

function FigurePanel({ benchmarkSlug, figure, filterModel }: FigurePanelProps) {
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

  // Swap annotation to match selected model (density plots store per-model annotations in layout.meta.annotations)
  let annotations = rawLayout.annotations;
  if (filterModel && rawLayout.meta?.annotations) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const modelAnnotation = rawLayout.meta.annotations.find((a: any) =>
      typeof a.text === 'string' && a.text.startsWith(filterModel)
    );
    if (modelAnnotation) annotations = [modelAnnotation];
  }

  const mergedLayout = {
    ...rawLayout,
    ...themeOverrides,
    annotations,
    xaxis: { ...rawLayout.xaxis, ...themeOverrides.xaxis },
    yaxis: { ...rawLayout.yaxis, ...themeOverrides.yaxis },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allTraces: any[] = (figureData as any).data ?? [];

  // Filter traces: if filterModel is set, keep only the matching model trace + reference lines (unnamed traces)
  // Force visible=true on the selected model (density plots default all but first to visible=false)
  // Downgrade scattergl → scatter (plotly-basic-dist doesn't include WebGL scatter)
  const traces = allTraces
    .filter((t) => !filterModel || t.name === filterModel || !t.name)
    .map((t) => ({
      ...t,
      ...(t.type === 'scattergl' && { type: 'scatter' }),
      ...(filterModel && t.name === filterModel && { visible: true }),
    }));

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
        {figure.name}
      </Typography>
      <PlotlyChart data={traces} layout={mergedLayout} />
    </Box>
  );
}

export default function FigureDrawer({
  open,
  onClose,
  benchmarkSlug,
  benchmarkName,
  filterModel,
}: FigureDrawerProps) {
  const { figures, isLoading, error } = useBenchmarkFigures(open ? benchmarkSlug : null);

  // Close on Escape key (persistent drawers don't handle this automatically)
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  return (
    <Drawer
      anchor="right"
      variant="persistent"
      open={open}
      PaperProps={{
        onClick: (e: React.MouseEvent) => e.stopPropagation(),
        sx: {
          width: { xs: '100%', md: '50vw' },
          boxShadow: open ? '-4px 0 24px rgba(0,0,0,0.15)' : 'none',
        },
      }}
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
            {filterModel ?? 'All models'}
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
                key={`${figure.slug}::${filterModel ?? 'all'}`}
                benchmarkSlug={benchmarkSlug}
                figure={figure}
                filterModel={filterModel}
              />
            ))}
          </>
        )}
      </Box>
    </Drawer>
  );
}
