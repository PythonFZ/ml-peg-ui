'use client';

import dynamic from 'next/dynamic';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import { useColorScheme } from '@mui/material/styles';
import type { DiatomicCurve } from '@/lib/types';

// PlotlyChart is ONLY imported via dynamic — never directly.
const PlotlyChart = dynamic(() => import('./PlotlyChart'), { ssr: false });

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

interface DiatomicChartProps {
  curves: DiatomicCurve[];
  pair: string;
}

export default function DiatomicChart({ curves, pair }: DiatomicChartProps) {
  const { mode } = useColorScheme();

  if (curves.length === 0) {
    return (
      <Box sx={{ mt: 2 }}>
        <Skeleton variant="rectangular" width="100%" height={400} sx={{ borderRadius: 1 }} />
      </Box>
    );
  }

  const traces = curves.map((curve) => ({
    type: 'scatter' as const,
    mode: 'lines' as const,
    name: curve.model,
    x: curve.distance,
    y: curve.energy,
  }));

  const themeOverrides = getPlotlyThemeOverrides(mode);

  const layout = {
    title: `Diatomic Curves: ${pair}`,
    xaxis: {
      title: 'Distance (\u212B)',
      ...themeOverrides.xaxis,
    },
    yaxis: {
      title: 'Energy (eV)',
      ...themeOverrides.yaxis,
    },
    legend: {
      orientation: 'v' as const,
      x: 1.02,
      xanchor: 'left' as const,
      y: 1,
    },
    ...themeOverrides,
    autosize: true,
  };

  return (
    <Box sx={{ mt: 2, width: '100%' }}>
      <PlotlyChart data={traces} layout={layout} />
    </Box>
  );
}
